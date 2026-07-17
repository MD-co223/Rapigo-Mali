'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Truck, Wallet, User, MoreHorizontal, Radio, Navigation,
  Clock, Bell, LogOut, Phone, MapPin, Package, Star,
  ChevronRight, ChevronLeft, Upload, Check, X, AlertCircle,
  Loader2, MessageSquare, FileText, Send, Shield, TrendingUp,
  CreditCard, CircleDot, ArrowRight, Store, UserCircle,
  CheckCircle2, XCircle, RefreshCw, FileUp, PackageSearch,
  CalendarDays, BarChart3, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import {
  useDriverNav, useAuthStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type DriverView
} from '@/lib/store';
import { toast } from 'sonner';
import { SupportContact } from '@/components/support-contact';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DriverProfile {
  id: string;
  userId: string;
  vehicleType: string;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  idCardNumber: string | null;
  licenseNumber: string | null;
  idCardImage: string | null;
  licenseImage: string | null;
  vehicleImage: string | null;
  selfieImage: string | null;
  isApproved: boolean;
  isAvailable: boolean;
  rating: number | null;
  totalDeliveries: number;
  totalEarnings: number;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    phone: string;
    email: string;
    isActive: boolean;
  };
}

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variants: string | null;
  supplements: string | null;
  notes: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryQuartier: string | null;
  notes: string | null;
  createdAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  clientId: string;
  merchantId: string;
  driverId: string | null;
  items: OrderItem[];
  client?: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
      avatar: string | null;
    };
  };
  merchant?: {
    id: string;
    businessName: string;
    logo: string | null;
    address: string;
    phone?: string;
    user?: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
  driver?: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
      avatar: string | null;
    };
  };
  delivery?: {
    id: string;
    status: string;
    pickupAddress: string;
    dropoffAddress: string;
  };
  ratings?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    client?: {
      user: { firstName: string; lastName: string };
    };
  }>;
}

interface WalletData {
  id: string;
  userId: string;
  balance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data: string | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  return `Il y a ${Math.floor(seconds / 86400)} j`;
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

// ─── Waiting Screen ──────────────────────────────────────────────────────────

function WaitingScreen() {
  const logout = useAuthStore((s) => s.logout);
  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
          Rapigo Mali
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Déconnexion
        </Button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
        >
          <Clock className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-xl font-bold mb-2"
        >
          Compte en attente de validation
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="text-muted-foreground max-w-sm"
        >
          Soumettez vos documents (CNI, permis) pour que notre équipe puisse valider votre compte.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          Vérification en cours...
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="w-full max-w-sm mt-8 bg-muted/50 rounded-xl p-5"
        >
          <SupportContact variant="full" />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

function TopBar({ unreadCount }: { unreadCount: number }) {
  const { view, goBack, navigate } = useDriverNav();
  const isHome = view === 'home';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">Rapigo Livreur</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            onClick={() => navigate('notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Bottom Navigation ───────────────────────────────────────────────────────

const bottomTabs: {
  view: DriverView;
  label: string;
  icon: typeof Home;
}[] = [
  { view: 'home', label: 'Accueil', icon: Home },
  { view: 'ride', label: 'Livraisons', icon: Truck },
  { view: 'earnings', label: 'Revenus', icon: Wallet },
  { view: 'profile', label: 'Profil', icon: User },
];

function BottomNav() {
  const { view, navigate } = useDriverNav();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (tabView: DriverView) =>
    view === tabView ||
    (view === 'navigation' && tabView === 'ride');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.view);
            return (
              <button
                key={tab.view}
                onClick={() => navigate(tab.view)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px] min-h-[44px]"
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    active ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Plus button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px] min-h-[44px]"
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                !bottomTabs.some((t) => isActive(t.view))
                  ? 'bg-emerald-500/10'
                  : ''
              }`}
            >
              <MoreHorizontal
                className={`w-5 h-5 transition-colors ${
                  !bottomTabs.some((t) => isActive(t.view))
                    ? 'text-emerald-500'
                    : 'text-muted-foreground'
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                !bottomTabs.some((t) => isActive(t.view))
                  ? 'text-emerald-500'
                  : 'text-muted-foreground'
              }`}
            >
              Plus
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-center">Menu</SheetTitle>
            <SheetDescription className="text-center">
              Accédez rapidement aux autres fonctionnalités
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 mt-2 px-2">
            {[
              {
                view: 'notifications' as DriverView,
                label: 'Notifications',
                icon: Bell,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                view: 'support' as DriverView,
                label: 'Support',
                icon: MessageSquare,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
              },
              {
                view: 'wallet' as DriverView,
                label: 'Portefeuille',
                icon: Wallet,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                view: 'history' as DriverView,
                label: 'Historique',
                icon: History,
                color: 'text-violet-500',
                bg: 'bg-violet-500/10',
              },
              {
                view: 'ratings' as DriverView,
                label: 'Évaluations',
                icon: Star,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                view: 'documents' as DriverView,
                label: 'Documents',
                icon: FileText,
                color: 'text-teal-500',
                bg: 'bg-teal-500/10',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    navigate(item.view);
                    setMoreOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Home View ───────────────────────────────────────────────────────────────

function HomeView() {
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayRevenue: 0,
    avgRating: 0,
  });
  const { navigate } = useDriverNav();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActiveOrder = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/orders?limit=50');
    if (res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as unknown as { orders: Order[] }).orders || [];
      const active = list.find((o: Order) =>
        ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
      );
      setActiveOrder(active || null);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/orders?limit=200');
    if (res.data) {
      const orders = Array.isArray(res.data)
        ? res.data
        : (res.data as unknown as { orders: Order[] }).orders || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(
        (o: Order) =>
          o.status === 'DELIVERED' &&
          new Date(o.deliveredAt || o.createdAt) >= today
      );
      const ratings = orders
        .filter((o: Order) => o.ratings && o.ratings.length > 0)
        .flatMap((o: Order) => o.ratings || [])
        .map((r: { rating: number }) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a: number, b: number) => a + b, 0) /
            ratings.length
          : 0;
      const todayRevenue = todayOrders.reduce(
        (sum: number, o: Order) => sum + o.deliveryFee,
        0
      );
      setStats({
        todayDeliveries: todayOrders.length,
        todayRevenue,
        avgRating,
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const [ordersRes, statsRes] = await Promise.all([
        apiFetch<Order[]>('/api/orders?limit=50'),
        apiFetch<Order[]>('/api/orders?limit=200'),
      ]);
      if (!mounted) return;
      if (ordersRes.data) {
        const list = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : (ordersRes.data as unknown as { orders: Order[] }).orders || [];
        setActiveOrder(
          list.find((o: Order) =>
            ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
          ) || null
        );
      }
      if (statsRes.data) {
        const orders = Array.isArray(statsRes.data)
          ? statsRes.data
          : (statsRes.data as unknown as { orders: Order[] }).orders || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(
          (o: Order) =>
            o.status === 'DELIVERED' &&
            new Date(o.deliveredAt || o.createdAt) >= today
        );
        const ratings = orders
          .filter((o: Order) => o.ratings && o.ratings.length > 0)
          .flatMap((o: Order) => o.ratings || [])
          .map((r: { rating: number }) => r.rating);
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length
            : 0;
        const todayRevenue = todayOrders.reduce(
          (sum: number, o: Order) => sum + o.deliveryFee,
          0
        );
        setStats({
          todayDeliveries: todayOrders.length,
          todayRevenue,
          avgRating,
        });
      }
      setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isOnline && !activeOrder) {
      timerRef.current = setInterval(() => {
        fetchActiveOrder();
      }, 15000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOnline, activeOrder, fetchActiveOrder]);

  const handleToggle = () => {
    const next = !isOnline;
    setIsOnline(next);
    toast.success(next ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
    if (next) {
      fetchActiveOrder();
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Online/Offline Toggle - Big and prominent */}
      <motion.div {...fadeInUp}>
        <Card
          className={`border-2 transition-colors cursor-pointer ${
            isOnline
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-muted'
          }`}
          onClick={handleToggle}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isOnline
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25'
                      : 'bg-muted'
                  }`}
                >
                  <Radio
                    className={`w-7 h-7 transition-colors ${
                      isOnline ? 'text-white' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline
                      ? 'Vous recevez des commandes'
                      : 'Passez en ligne pour recevoir des commandes'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={handleToggle}
                className="scale-125"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.05 }}
      >
        <Card className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold">{stats.todayDeliveries}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Livraisons terminées
          </p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-bold">{formatPrice(stats.todayRevenue)}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Revenus du jour
          </p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xl font-bold">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Note moyenne
          </p>
        </Card>
      </motion.div>

      {/* Active Delivery Card */}
      {activeOrder && (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
          <Card className="border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
            <div className="bg-emerald-500/10 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Livraison en cours
                </span>
                <Badge className={ORDER_STATUS_COLORS[activeOrder.status] || ''}>
                  {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <button
                className="w-full text-left"
                onClick={() => navigate('navigation', { id: activeOrder.id })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {activeOrder.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeOrder.merchant?.businessName}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {activeOrder.deliveryAddress}
                  </p>
                </div>
              </button>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                onClick={() =>
                  navigate('navigation', { id: activeOrder.id })
                }
              >
                <Navigation className="w-4 h-4 mr-2" />
                Voir la livraison
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Action */}
      {isOnline && !activeOrder && (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.15 }}>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[52px] text-base font-semibold"
            onClick={() => navigate('ride')}
          >
            <PackageSearch className="w-5 h-5 mr-2" />
            Voir les commandes disponibles
          </Button>
        </motion.div>
      )}

      {/* Offline Message */}
      {!isOnline && !activeOrder && (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
          <Card className="p-8 text-center">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-semibold">Vous êtes hors ligne</p>
            <p className="text-sm text-muted-foreground mt-1">
              Passez en ligne pour voir les commandes disponibles
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── Ride View (Available Orders) ────────────────────────────────────────────

function RideView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { navigate } = useDriverNav();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await apiFetch<Order[]>('/api/drivers/available-orders');
      if (mounted) {
        if (res.data) {
          setOrders(Array.isArray(res.data) ? res.data : []);
        }
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const refreshOrders = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/drivers/available-orders');
    if (res.data) {
      setOrders(Array.isArray(res.data) ? res.data : []);
    }
  }, []);

  // Also check for active order and redirect
  useEffect(() => {
    const checkActive = async () => {
      const res = await apiFetch<Order[]>('/api/orders?limit=50');
      if (res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as unknown as { orders: Order[] }).orders || [];
        const active = list.find((o: Order) =>
          ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
        );
        if (active) {
          navigate('navigation', { id: active.id });
        }
      }
    };
    checkActive();
  }, [navigate]);

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    // Fetch driver id
    const driverRes = await apiFetch<DriverProfile[]>('/api/drivers/me');
    const driverId = driverRes.data
      ? Array.isArray(driverRes.data)
        ? driverRes.data[0]?.id
        : (driverRes.data as DriverProfile).id
      : null;
    if (!driverId) {
      toast.error('Profil livreur introuvable');
      setAccepting(null);
      return;
    }
    const res = await apiFetch<Order>(`/api/drivers/${driverId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Livraison acceptée !');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      navigate('navigation', { id: orderId });
    }
    setAccepting(null);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Commandes disponibles</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshOrders}
          className="h-9 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Actualiser
        </Button>
      </div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-10 text-center">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-muted-foreground">
              Aucune commande disponible pour le moment
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Les nouvelles commandes apparaîtront ici automatiquement
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: i * 0.04 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-emerald-600">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm font-bold">
                        {formatPrice(order.deliveryFee)}
                      </span>
                    </div>

                    {/* Merchant */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Store className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.merchant?.businessName || 'Marchand'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length || 0} article
                          {(order.items?.length || 0) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Client Address */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">
                          Client
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {order.deliveryAddress}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {timeAgo(order.createdAt)}
                    </div>

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                      disabled={accepting === order.id}
                      onClick={() => handleAccept(order.id)}
                    >
                      {accepting === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Accepter la livraison
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Navigation View (Active Delivery) ───────────────────────────────────────

const DELIVERY_STEPS = [
  { key: 'ASSIGNED', label: 'Assignée' },
  { key: 'PICKED_UP', label: 'Récupérée' },
  { key: 'IN_TRANSIT', label: 'En livraison' },
  { key: 'DELIVERED', label: 'Livrée' },
];

function NavigationView() {
  const { data, navigate } = useDriverNav();
  const orderId = data?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const res = await apiFetch<Order>(`/api/orders/${orderId}`);
      if (mounted) {
        if (res.data) setOrder(res.data);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    const res = await apiFetch<Order>(`/api/orders/${order.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      const labels: Record<string, string> = {
        PICKED_UP: 'Récupération confirmée',
        IN_TRANSIT: 'Livraison démarrée',
        DELIVERED: 'Livraison confirmée !',
      };
      toast.success(labels[newStatus] || 'Statut mis à jour');
      if (res.data) setOrder(res.data);
      if (newStatus === 'DELIVERED') {
        setTimeout(() => navigate('home'), 1500);
      }
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center py-20">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Aucune livraison active</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('home')}
        >
          Retour à l&apos;accueil
        </Button>
      </div>
    );
  }

  const currentStepIdx = DELIVERY_STEPS.findIndex(
    (s) => s.key === order.status
  );
  const isDelivered = order.status === 'DELIVERED';
  const clientPhone = order.client?.user?.phone;
  const merchantPhone = order.merchant?.user?.phone || order.merchant?.phone;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Status Steps */}
      <motion.div {...fadeInUp}>
        <Card className="overflow-hidden border-emerald-500/20">
          <div className="bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm">
                {order.orderNumber}
              </span>
              <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4 pt-5">
            <div className="flex items-center justify-between relative">
              {DELIVERY_STEPS.map((step, i) => {
                const isCompleted = i < currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center flex-1 relative z-10"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted || isCurrent
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'bg-muted text-muted-foreground'
                      } ${isCurrent && !isDelivered ? 'ring-4 ring-emerald-500/20' : ''}`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] mt-1.5 text-center leading-tight font-medium ${
                        isCompleted || isCurrent
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
              {/* Connecting line */}
              <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-muted -z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (currentStepIdx / (DELIVERY_STEPS.length - 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pickup Info */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
            Point de récupération
          </p>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {order.merchant?.businessName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.merchant?.address ||
                  order.delivery?.pickupAddress}
              </p>
            </div>
          </div>
          {merchantPhone && (
            <a
              href={`tel:${merchantPhone.replace(/\s/g, '')}`}
              className="mt-3 flex items-center gap-2 text-xs text-emerald-600 hover:underline"
            >
              <Phone className="w-3 h-3" />
              {merchantPhone}
            </a>
          )}
        </Card>
      </motion.div>

      {/* Delivery Info */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
            Adresse de livraison
          </p>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {order.client?.user?.firstName}{' '}
                {order.client?.user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.deliveryAddress}
              </p>
              {order.deliveryCity && (
                <p className="text-xs text-muted-foreground">
                  {order.deliveryCity}
                  {order.deliveryQuartier
                    ? ` — ${order.deliveryQuartier}`
                    : ''}
                </p>
              )}
            </div>
          </div>
          {clientPhone && (
            <a
              href={`tel:${clientPhone.replace(/\s/g, '')}`}
              className="mt-3 flex items-center gap-2 text-xs text-emerald-600 hover:underline"
            >
              <Phone className="w-3 h-3" />
              {clientPhone}
            </a>
          )}
        </Card>
      </motion.div>

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.15 }}>
          <Card className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Articles ({order.items.length})
            </p>
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.productImage ? (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={item.productImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <span className="text-sm font-medium shrink-0">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais de livraison</span>
              <span className="font-semibold text-emerald-600">
                {formatPrice(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-emerald-600">
                {formatPrice(order.total)}
              </span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Notes */}
      {order.notes && (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
          <Card className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Notes
            </p>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.25 }}
        className="space-y-3"
      >
        {(order.status === 'ASSIGNED' || order.status === 'READY') && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[52px] text-base font-semibold"
            disabled={updating}
            onClick={() => handleStatusUpdate('PICKED_UP')}
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Package className="w-5 h-5 mr-2" />
            )}
            Confirmer la récupération
          </Button>
        )}
        {order.status === 'PICKED_UP' && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[52px] text-base font-semibold"
            disabled={updating}
            onClick={() => handleStatusUpdate('IN_TRANSIT')}
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5 mr-2" />
            )}
            Démarrer la livraison
          </Button>
        )}
        {order.status === 'IN_TRANSIT' && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[52px] text-base font-semibold"
            disabled={updating}
            onClick={() => handleStatusUpdate('DELIVERED')}
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            )}
            Confirmer la livraison
          </Button>
        )}
        {isDelivered && (
          <div className="text-center py-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-emerald-600">
              Livraison terminée !
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── History View ────────────────────────────────────────────────────────────

function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { navigate } = useDriverNav();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const res = await apiFetch<{ orders: Order[]; total: number }>(
        '/api/orders?limit=100'
      );
      if (res.data) {
        const list =
          res.data.orders ||
          (Array.isArray(res.data) ? res.data : []);
        setOrders(list);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const filtered = orders
    .filter((o) => {
      if (filter === 'ALL') return ['DELIVERED', 'CANCELLED'].includes(o.status);
      return o.status === filter;
    })
    .filter((o) => {
      if (!dateFilter) return true;
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === dateFilter;
    });

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Historique des livraisons</h2>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'ALL', label: 'Tout' },
            { value: 'DELIVERED', label: 'Livrées' },
            { value: 'CANCELLED', label: 'Annulées' },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={filter === tab.value ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            className="text-sm h-9"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => setDateFilter('')}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="p-10 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune livraison trouvée
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((order, i) => (
              <motion.div
                key={order.id}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: i * 0.03 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => navigate('navigation', { id: order.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-semibold">
                        {order.orderNumber}
                      </span>
                      <Badge
                        className={`text-[10px] ${ORDER_STATUS_COLORS[order.status] || ''}`}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-2 mb-1.5">
                      <Store className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {order.merchant?.businessName}
                      </p>
                    </div>
                    <div className="flex items-start gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {order.client?.user?.firstName}{' '}
                        {order.client?.user?.lastName}
                      </p>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(order.createdAt)}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatPrice(order.deliveryFee)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Earnings View ───────────────────────────────────────────────────────────

function EarningsView() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { navigate } = useDriverNav();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [walletRes, ordersRes] = await Promise.all([
        apiFetch<WalletData>('/api/wallet'),
        apiFetch<{ orders: Order[] }>('/api/orders?limit=200'),
      ]);
      if (walletRes.data) setWallet(walletRes.data);
      if (ordersRes.data) {
        const list =
          ordersRes.data.orders ||
          (Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setOrders(list);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalEarnings = deliveredOrders.reduce(
    (sum, o) => sum + o.deliveryFee,
    0
  );

  const getFilteredEarnings = () => {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    return deliveredOrders
      .filter((o) => {
        const d = new Date(o.deliveredAt || o.createdAt);
        return d >= startDate;
      })
      .reduce((sum, o) => sum + o.deliveryFee, 0);
  };

  const filteredEarnings = getFilteredEarnings();

  // Build bar data for simple chart
  const buildBarData = () => {
    const bars: { label: string; value: number }[] = [];
    const now = new Date();
    if (period === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('fr-FR', {
          weekday: 'short',
        });
        const dayTotal = deliveredOrders
          .filter((o) => {
            const od = new Date(o.deliveredAt || o.createdAt);
            return od.toISOString().split('T')[0] === dayStr;
          })
          .reduce((s, o) => s + o.deliveryFee, 0);
        bars.push({ label: dayLabel, value: dayTotal });
      }
    } else if (period === 'week') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        const weekTotal = deliveredOrders
          .filter((o) => {
            const od = new Date(o.deliveredAt || o.createdAt);
            return od >= weekStart && od < weekEnd;
          })
          .reduce((s, o) => s + o.deliveryFee, 0);
        bars.push({
          label: `S-${i + 1}`,
          value: weekTotal,
        });
      }
    } else {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const mLabel = m.toLocaleDateString('fr-FR', { month: 'short' });
        const mTotal = deliveredOrders
          .filter((o) => {
            const od = new Date(o.deliveredAt || o.createdAt);
            return od >= m && od <= mEnd;
          })
          .reduce((s, o) => s + o.deliveryFee, 0);
        bars.push({ label: mLabel, value: mTotal });
      }
    }
    return bars;
  };

  const barData = buildBarData();
  const maxBarValue = Math.max(...barData.map((b) => b.value), 1);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Revenus</h2>

      {/* Total Earnings Card */}
      <motion.div {...fadeInUp}>
        <Card className="overflow-hidden border-emerald-500/20">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white text-center">
            <p className="text-sm opacity-80">Revenus totaux</p>
            <p className="text-4xl font-bold mt-1">
              {formatPrice(totalEarnings)}
            </p>
            <p className="text-xs opacity-60 mt-2">
              {deliveredOrders.length} livraison{deliveredOrders.length > 1 ? 's' : ''} effectuée{deliveredOrders.length > 1 ? 's' : ''}
            </p>
          </div>
          <CardContent className="p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs min-h-[40px]"
              onClick={() => navigate('wallet')}
            >
              <Wallet className="w-3.5 h-3.5 mr-1.5" />
              Voir le portefeuille
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Period Selector */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <div className="flex gap-2">
          {[
            { value: 'day' as const, label: 'Jour' },
            { value: 'week' as const, label: 'Semaine' },
            { value: 'month' as const, label: 'Mois' },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={period === tab.value ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs min-h-[40px]"
              onClick={() => setPeriod(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Period Earnings */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {period === 'day'
              ? "Aujourd'hui"
              : period === 'week'
                ? 'Cette semaine'
                : 'Ce mois'}
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatPrice(filteredEarnings)}
          </p>
        </Card>
      </motion.div>

      {/* Simple Bar Chart */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.15 }}>
        <Card className="p-4">
          <p className="text-sm font-semibold mb-4">Évolution des revenus</p>
          <div className="flex items-end gap-2 h-32">
            {barData.map((bar, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <span className="text-[9px] text-muted-foreground font-medium">
                  {bar.value > 0
                    ? `${Math.round(bar.value / 1000)}k`
                    : '0'}
                </span>
                <div
                  className="w-full bg-emerald-500 rounded-t-md transition-all duration-300 min-h-[4px]"
                  style={{
                    height: `${Math.max((bar.value / maxBarValue) * 80, 4)}px`,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Ratings View ────────────────────────────────────────────────────────────

function RatingsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const res = await apiFetch<{ orders: Order[] }>('/api/orders?limit=200');
      if (res.data) {
        const list =
          res.data.orders ||
          (Array.isArray(res.data) ? res.data : []);
        setOrders(list);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const ratedOrders = orders.filter(
    (o) => o.ratings && o.ratings.length > 0
  );
  const allRatings = ratedOrders.flatMap((o) => o.ratings || []);
  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allRatings.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Évaluations</h2>

      {/* Average Rating - Big Stars */}
      <motion.div {...fadeInUp}>
        <Card className="p-6 text-center">
          <p className="text-5xl font-bold text-emerald-600">
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </p>
          {avgRating > 0 && (
            <div className="flex items-center justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={28}
                  className={
                    i <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }
                />
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {allRatings.length} évaluation
            {allRatings.length > 1 ? 's' : ''} reçue
            {allRatings.length > 1 ? 's' : ''}
          </p>
        </Card>
      </motion.div>

      {/* Distribution */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Répartition des notes</p>
          <div className="space-y-2.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-xs w-3 text-right font-medium">
                  {d.star}
                </span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${(d.count / maxCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right font-medium">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Rating List */}
      {ratedOrders.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {ratedOrders.map((order) =>
              (order.ratings || []).map((rating, i) => (
                <motion.div
                  key={rating.id}
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: i * 0.03 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={rating.rating} size={14} />
                        <span className="text-xs text-muted-foreground">
                          {rating.client?.user
                            ? `${rating.client.user.firstName} ${rating.client.user.lastName}`
                            : 'Client'}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateShort(rating.createdAt)}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-muted-foreground">
                        &ldquo;{rating.comment}&rdquo;
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {order.orderNumber}
                    </p>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-10 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune évaluation pour le moment
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── Wallet View ─────────────────────────────────────────────────────────────

function WalletView() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await apiFetch<WalletData>('/api/wallet');
      if (mounted) {
        if (res.data) setWallet(res.data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Portefeuille</h2>

      {/* Balance Card */}
      <motion.div {...fadeInUp}>
        <Card className="overflow-hidden border-emerald-500/20">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white text-center">
            <p className="text-sm opacity-80 mb-1">Solde disponible</p>
            <p className="text-4xl font-bold">
              {wallet ? formatPrice(wallet.balance) : '0 FCFA'}
            </p>
          </div>
          <CardContent className="p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs min-h-[44px]"
              onClick={() =>
                toast.info('Fonctionnalité de retrait bientôt disponible')
              }
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Retirer
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Historique des transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {wallet && wallet.transactions.length > 0 ? (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {wallet.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'CREDIT'
                            ? 'bg-emerald-500/10'
                            : 'bg-red-500/10'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? (
                          <ArrowRight className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-red-500 rotate-180" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.description || 'Transaction'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                        {tx.reference && (
                          <p className="text-[10px] text-muted-foreground">
                            Réf : {tx.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ml-2 ${
                        tx.type === 'CREDIT'
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}
                      {formatPrice(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune transaction
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Profile View ────────────────────────────────────────────────────────────

function ProfileView() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { navigate } = useDriverNav();

  const [form, setForm] = useState({
    vehicleType: 'MOTO',
    vehiclePlate: '',
    vehicleBrand: '',
    vehicleColor: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await apiFetch<DriverProfile>('/api/drivers/me');
      if (res.data) {
        const p = res.data;
        setProfile(p);
        setForm({
          vehicleType: p.vehicleType || 'MOTO',
          vehiclePlate: p.vehiclePlate || '',
          vehicleBrand: p.vehicleBrand || '',
          vehicleColor: p.vehicleColor || '',
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch<DriverProfile>('/api/drivers/me', {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Profil mis à jour');
      if (res.data) setProfile(res.data);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Profil</h2>

      {/* User Info */}
      <motion.div {...fadeInUp}>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-emerald-500" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user?.phone}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          {profile && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">
                  {profile.totalDeliveries}
                </p>
                <p className="text-[10px] text-muted-foreground">Livraisons</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">
                  {profile.rating?.toFixed(1) || '—'}
                </p>
                <p className="text-[10px] text-muted-foreground">Note</p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Vehicle Info - Edit Form */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Informations du véhicule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div>
              <Label className="text-xs">Type de véhicule</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(val) =>
                  setForm({ ...form, vehicleType: val })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOTO">Moto</SelectItem>
                  <SelectItem value="VELO">Vélo</SelectItem>
                  <SelectItem value="VOITURE">Voiture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Immatriculation</Label>
              <Input
                className="mt-1"
                placeholder="Ex : AK-1234-BJ"
                value={form.vehiclePlate}
                onChange={(e) =>
                  setForm({ ...form, vehiclePlate: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Marque</Label>
              <Input
                className="mt-1"
                placeholder="Ex : Yamaha, Honda..."
                value={form.vehicleBrand}
                onChange={(e) =>
                  setForm({ ...form, vehicleBrand: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Couleur</Label>
              <Input
                className="mt-1"
                placeholder="Ex : Rouge, Noir..."
                value={form.vehicleColor}
                onChange={(e) =>
                  setForm({ ...form, vehicleColor: e.target.value })
                }
              />
            </div>
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Upload Placeholders */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documents</CardTitle>
            <CardDescription className="text-xs">
              CNI, permis, carte grise du véhicule
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'CNI',
                  uploaded: !!profile?.idCardImage,
                },
                {
                  label: 'Permis',
                  uploaded: !!profile?.licenseImage,
                },
                {
                  label: 'Photo véhicule',
                  uploaded: !!profile?.vehicleImage,
                },
                {
                  label: 'Selfie',
                  uploaded: !!profile?.selfieImage,
                },
              ].map((doc) => (
                <button
                  key={doc.label}
                  className={`p-4 rounded-xl border text-center transition-colors hover:bg-accent/50 ${
                    doc.uploaded
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-dashed border-muted-foreground/30'
                  }`}
                  onClick={() => navigate('documents')}
                >
                  {doc.uploaded ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  )}
                  <p className="text-xs font-medium">{doc.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {doc.uploaded ? 'Téléchargé' : 'Télécharger'}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Support Contact */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.15 }}>
        <Card>
          <CardContent className="p-4">
            <SupportContact variant="compact" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Notifications View ──────────────────────────────────────────────────────

function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await apiFetch<{
        notifications: Notification[];
        total: number;
        unreadCount: number;
      }>('/api/notifications?limit=50');
      if (mounted) {
        if (res.data) {
          setNotifications(res.data.notifications || []);
        }
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const markAllRead = async () => {
    const res = await apiFetch('/api/notifications', { method: 'PUT' });
    if (!res.error) {
      toast.success('Toutes les notifications marquées comme lues');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  };

  const markOneRead = async (id: string) => {
    const res = await apiFetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
    if (!res.error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-emerald-600"
            onClick={markAllRead}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-10 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune notification
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          <AnimatePresence>
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: i * 0.02 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-colors ${
                    notif.isRead
                      ? 'opacity-60'
                      : 'border-emerald-500/20 bg-emerald-500/5'
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markOneRead(notif.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.isRead ? 'bg-muted' : 'bg-emerald-500/10'
                      }`}
                    >
                      <Bell
                        className={`w-3.5 h-3.5 ${
                          notif.isRead
                            ? 'text-muted-foreground'
                            : 'text-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm ${
                            notif.isRead ? 'font-medium' : 'font-semibold'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <CircleDot className="w-2 h-2 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Support View ────────────────────────────────────────────────────────────

function SupportView() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setSending(true);
    const res = await apiFetch('/api/support', {
      method: 'POST',
      body: JSON.stringify({
        subject: subject.trim(),
        description: description.trim(),
      }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Ticket envoyé avec succès !');
      setSubject('');
      setDescription('');
      setSent(true);
    }
    setSending(false);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Support</h2>

      <motion.div {...fadeInUp}>
        <Card className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Notre équipe est là pour vous aider. Décrivez votre problème et
            nous vous répondrons rapidement.
          </p>
        </Card>
      </motion.div>

      {sent ? (
        <motion.div {...fadeInUp}>
          <Card className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold">Ticket envoyé !</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nous vous répondrons dans les plus brefs délais.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 min-h-[40px]"
              onClick={() => setSent(false)}
            >
              Envoyer un autre ticket
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>Sujet</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Sujet de votre demande"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Décrivez votre problème en détail..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                disabled={sending}
                onClick={handleSubmit}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Support Contact */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
        <Card>
          <CardContent className="p-4">
            <SupportContact variant="full" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Documents View ──────────────────────────────────────────────────────────

const DOC_FIELDS = [
  { key: 'idCardImage' as const, label: "Carte d'identité (CNI)", icon: FileText },
  { key: 'licenseImage' as const, label: 'Permis de conduire', icon: Shield },
  { key: 'vehicleImage' as const, label: 'Carte grise du véhicule', icon: FileUp },
  { key: 'selfieImage' as const, label: 'Selfie', icon: UserCircle },
];

function DocumentsView() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await apiFetch<DriverProfile>('/api/drivers/me');
      if (res.data) {
        setProfile(res.data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpload = async (field: string) => {
    const input = fileRefs.current[field];
    if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 Mo)');
      return;
    }

    setUploading(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = useAuthStore.getState().token;
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        toast.error(uploadData.error || 'Erreur lors du téléchargement');
        setUploading(null);
        return;
      }

      const updateRes = await apiFetch<DriverProfile>('/api/drivers/me', {
        method: 'PUT',
        body: JSON.stringify({ [field]: uploadData.url }),
      });

      if (updateRes.error) {
        toast.error(updateRes.error);
      } else {
        toast.success('Document téléchargé avec succès');
        if (updateRes.data) setProfile(updateRes.data);
      }
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
    setUploading(null);
    input.value = '';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Documents</h2>

      <p className="text-sm text-muted-foreground">
        Veuillez télécharger les documents requis pour vérifier votre compte.
      </p>

      <div className="space-y-3">
        <AnimatePresence>
          {DOC_FIELDS.map((doc, i) => {
            const hasImage = !!(
              profile as Record<string, unknown> | null
            )?.[doc.key];
            const Icon = doc.icon;
            return (
              <motion.div
                key={doc.key}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: i * 0.04 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          hasImage
                            ? 'bg-emerald-500/10'
                            : 'bg-muted'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            hasImage
                              ? 'text-emerald-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{doc.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {hasImage ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] text-emerald-600">
                                Téléchargé
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span className="text-[10px] text-muted-foreground">
                                Manquant
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    {hasImage && (
                      <div className="mb-3 rounded-xl overflow-hidden bg-muted/50 border max-h-48">
                        <img
                          src={
                            (profile as Record<string, unknown> | null)?.[
                              doc.key
                            ] as string
                          }
                          alt={doc.label}
                          className="w-full h-full object-contain max-h-48"
                        />
                      </div>
                    )}

                    <input
                      ref={(el) => {
                        fileRefs.current[doc.key] = el;
                      }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={() => handleUpload(doc.key)}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs min-h-[40px]"
                      disabled={uploading === doc.key}
                      onClick={() => fileRefs.current[doc.key]?.click()}
                    >
                      {uploading === doc.key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : hasImage ? (
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {uploading === doc.key
                        ? 'Téléchargement...'
                        : hasImage
                          ? 'Remplacer'
                          : 'Télécharger'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Driver App ─────────────────────────────────────────────────────────

export default function DriverApp() {
  const { view } = useDriverNav();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkApproval = async () => {
      const res = await apiFetch<DriverProfile>('/api/drivers/me');
      if (res.data) {
        setIsApproved(res.data.isApproved);
      } else {
        setIsApproved(false);
      }
      setProfileChecked(true);
    };
    checkApproval();
  }, []);

  // Fetch unread count for bell icon
  useEffect(() => {
    const fetchUnread = async () => {
      const res = await apiFetch<{
        notifications: Notification[];
        unreadCount: number;
      }>('/api/notifications?limit=1');
      if (res.data && typeof res.data.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      } else if (res.data?.notifications) {
        setUnreadCount(
          res.data.notifications.filter((n) => !n.isRead).length
        );
      }
    };
    if (profileChecked && isApproved) {
      fetchUnread();
    }
  }, [profileChecked, isApproved]);

  // Check for active delivery and auto-redirect
  useEffect(() => {
    if (!isApproved || view !== 'home') return;
    const checkActive = async () => {
      const res = await apiFetch<Order[]>('/api/orders?limit=50');
      if (res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as unknown as { orders: Order[] }).orders || [];
        const active = list.find((o: Order) =>
          ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
        );
        if (active) {
          const { navigate } = useDriverNav.getState();
          navigate('navigation', { id: active.id });
        }
      }
    };
    checkActive();
  }, [isApproved, view]);

  if (!profileChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isApproved === false) {
    return <WaitingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar unreadCount={unreadCount} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" {...fadeInUp}>
              <HomeView />
            </motion.div>
          )}
          {view === 'ride' && (
            <motion.div key="ride" {...fadeInUp}>
              <RideView />
            </motion.div>
          )}
          {view === 'navigation' && (
            <motion.div key="navigation" {...fadeInUp}>
              <NavigationView />
            </motion.div>
          )}
          {view === 'history' && (
            <motion.div key="history" {...fadeInUp}>
              <HistoryView />
            </motion.div>
          )}
          {view === 'earnings' && (
            <motion.div key="earnings" {...fadeInUp}>
              <EarningsView />
            </motion.div>
          )}
          {view === 'ratings' && (
            <motion.div key="ratings" {...fadeInUp}>
              <RatingsView />
            </motion.div>
          )}
          {view === 'wallet' && (
            <motion.div key="wallet" {...fadeInUp}>
              <WalletView />
            </motion.div>
          )}
          {view === 'profile' && (
            <motion.div key="profile" {...fadeInUp}>
              <ProfileView />
            </motion.div>
          )}
          {view === 'notifications' && (
            <motion.div key="notifications" {...fadeInUp}>
              <NotificationsView />
            </motion.div>
          )}
          {view === 'support' && (
            <motion.div key="support" {...fadeInUp}>
              <SupportView />
            </motion.div>
          )}
          {view === 'documents' && (
            <motion.div key="documents" {...fadeInUp}>
              <DocumentsView />
            </motion.div>
          )}
          {view === 'chat' && (
            <motion.div key="chat" {...fadeInUp}>
              <SupportView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}