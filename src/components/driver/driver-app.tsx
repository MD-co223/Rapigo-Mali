'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radio, Navigation, Clock, Wallet, User, Bell, LogOut, Phone,
  MapPin, Package, Star, ChevronRight, ChevronLeft, Upload, Check,
  X, AlertCircle, Loader2, Plus, MessageSquare, FileText, Camera,
  Send, Shield, TrendingUp, CreditCard, CircleDot, ArrowRight,
  Store, UserCircle, CheckCircle2, XCircle, Eye, RefreshCw,
  Home, FileUp, Image as ImageIcon, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDriverNav, useAuthStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type DriverView
} from '@/lib/store';
import { toast } from 'sonner';
import { SupportContactCard } from '@/components/support-contact';

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
      user: { firstName: string; lastName: string; };
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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'À l\'instant';
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
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Approval Screen ─────────────────────────────────────────────────────────

function ApprovalScreen() {
  const logout = useAuthStore((s) => s.logout);
  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
          Rapigo Mali
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1" />
          Déconnexion
        </Button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">En attente d&apos;approbation</h2>
        <p className="text-muted-foreground max-w-sm">
          Votre profil de livreur est en cours de vérification par notre équipe. 
          Vous recevrez une notification dès que votre compte sera approuvé.
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          Vérification en cours...
        </div>

        {/* Informations de support */}
        <div className="w-full max-w-sm mt-8 bg-muted/50 rounded-lg p-4">
          <SupportContactCard />
        </div>
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
            <Button variant="ghost" size="icon" onClick={goBack} className="h-9 w-9">
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

const bottomTabs: { view: DriverView; label: string; icon: typeof Home }[] = [
  { view: 'home', label: 'Accueil', icon: Home },
  { view: 'history', label: 'Historique', icon: Clock },
  { view: 'earnings', label: 'Revenus', icon: Wallet },
  { view: 'profile', label: 'Profil', icon: User },
];

function BottomNav() {
  const { view, navigate } = useDriverNav();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {bottomTabs.map((tab) => {
          const isActive = view === tab.view || (view === 'ride' && tab.view === 'home');
          const Icon = tab.icon;
          return (
            <button
              key={tab.view}
              onClick={() => navigate(tab.view)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-emerald-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Home View ───────────────────────────────────────────────────────────────

function HomeView() {
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, revenue: 0, avgRating: 0 });
  const { navigate } = useDriverNav();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActiveOrder = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/orders?limit=50');
    if (res.data) {
      const active = (Array.isArray(res.data) ? res.data : (res.data as unknown as { orders: Order[] }).orders || [])
        .find((o: Order) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status));
      setActiveOrder(active || null);
    }
  }, []);

  const fetchAvailable = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/drivers/available-orders');
    if (res.data) {
      setAvailableOrders(Array.isArray(res.data) ? res.data : []);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/orders?limit=200');
    if (res.data) {
      const orders = Array.isArray(res.data) ? res.data : (res.data as unknown as { orders: Order[] }).orders || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(
        (o: Order) => o.status === 'DELIVERED' && new Date(o.deliveredAt || o.createdAt) >= today
      );
      const deliveredOrders = orders.filter((o: Order) => o.status === 'DELIVERED');
      const totalRevenue = deliveredOrders.reduce((sum: number, o: Order) => sum + o.deliveryFee, 0);
      const ratings = orders
        .filter((o: Order) => o.ratings && o.ratings.length > 0)
        .flatMap((o: Order) => o.ratings || [])
        .map((r: { rating: number }) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      setStats({ today: todayOrders.length, revenue: totalRevenue, avgRating });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const [ordersRes, availableRes, statsRes] = await Promise.all([
        apiFetch<Order[]>('/api/orders?limit=50'),
        apiFetch<Order[]>('/api/drivers/available-orders'),
        apiFetch<Order[]>('/api/orders?limit=200'),
      ]);
      if (!mounted) return;
      if (ordersRes.data) {
        const list = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data as unknown as { orders: Order[] }).orders || [];
        setActiveOrder(list.find((o: Order) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)) || null);
      }
      if (availableRes.data) {
        setAvailableOrders(Array.isArray(availableRes.data) ? availableRes.data : []);
      }
      if (statsRes.data) {
        const orders = Array.isArray(statsRes.data) ? statsRes.data : (statsRes.data as unknown as { orders: Order[] }).orders || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(
          (o: Order) => o.status === 'DELIVERED' && new Date(o.deliveredAt || o.createdAt) >= today
        );
        const deliveredOrders = orders.filter((o: Order) => o.status === 'DELIVERED');
        const totalRevenue = deliveredOrders.reduce((sum: number, o: Order) => sum + o.deliveryFee, 0);
        const ratings = orders
          .filter((o: Order) => o.ratings && o.ratings.length > 0)
          .flatMap((o: Order) => o.ratings || [])
          .map((r: { rating: number }) => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
        setStats({ today: todayOrders.length, revenue: totalRevenue, avgRating });
      }
      setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (isOnline && !activeOrder) {
      timerRef.current = setInterval(() => {
        fetchAvailable();
        fetchActiveOrder();
      }, 15000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOnline, activeOrder, fetchAvailable, fetchActiveOrder]);

  const handleToggle = () => {
    const next = !isOnline;
    setIsOnline(next);
    toast.success(next ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
    if (next) {
      fetchAvailable();
    } else {
      setAvailableOrders([]);
    }
  };

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    const res = await apiFetch<Order>(`/api/drivers/${orderId}/accept`, { method: 'POST' });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Commande acceptée !');
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      navigate('ride', { id: orderId });
    }
    setAccepting(null);
  };

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    const res = await apiFetch<Order>(`/api/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Statut mis à jour');
      fetchActiveOrder();
      if (newStatus === 'DELIVERED') {
        navigate('home');
        fetchStats();
      } else {
        fetchActiveOrder();
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Online/Offline Toggle */}
      <Card className="border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOnline ? 'bg-emerald-500' : 'bg-muted'
              }`}>
                <Radio className={`w-5 h-5 ${isOnline ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{isOnline ? 'En ligne' : 'Hors ligne'}</p>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'Vous recevez des commandes' : 'Passez en ligne pour recevoir des commandes'}
                </p>
              </div>
            </div>
            <Switch checked={isOnline} onCheckedChange={handleToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <Package className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-lg font-bold">{stats.today}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Livraisons aujourd&apos;hui</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-lg font-bold">{formatPrice(stats.revenue)}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Revenus</p>
        </Card>
        <Card className="p-3 text-center">
          <Star className="w-5 h-5 mx-auto text-amber-400 mb-1" />
          <p className="text-lg font-bold">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Note moyenne</p>
        </Card>
      </div>

      {/* Active Delivery */}
      {activeOrder && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Livraison en cours</CardTitle>
              <Badge className={ORDER_STATUS_COLORS[activeOrder.status] || ''}>
                {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <button
              className="w-full text-left"
              onClick={() => navigate('ride', { id: activeOrder.id })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{activeOrder.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{activeOrder.merchant?.businessName}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-1">{activeOrder.deliveryAddress}</p>
              </div>
            </button>
            {activeOrder.status === 'ASSIGNED' && (
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleStatusUpdate(activeOrder, 'PICKED_UP')}
              >
                <Package className="w-4 h-4 mr-2" />
                Récupérer au marchand
              </Button>
            )}
            {activeOrder.status === 'PICKED_UP' && (
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleStatusUpdate(activeOrder, 'IN_TRANSIT')}
              >
                <Navigation className="w-4 h-4 mr-2" />
                En route vers le client
              </Button>
            )}
            {activeOrder.status === 'IN_TRANSIT' && (
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleStatusUpdate(activeOrder, 'DELIVERED')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmer la livraison
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Orders */}
      {isOnline && !activeOrder && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Commandes disponibles</h3>
            <Button variant="ghost" size="sm" onClick={fetchAvailable} className="h-7 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Actualiser
            </Button>
          </div>
          {availableOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <Package className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune commande disponible</p>
              <p className="text-xs text-muted-foreground mt-1">Les nouvelles commandes apparaîtront ici</p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {availableOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-emerald-600">{order.orderNumber}</span>
                      <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Store className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{order.merchant?.businessName}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground line-clamp-2">{order.deliveryAddress}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {timeAgo(order.createdAt)}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={accepting === order.id}
                      onClick={() => handleAccept(order.id)}
                    >
                      {accepting === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Accepter
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline Message */}
      {!isOnline && !activeOrder && (
        <Card className="p-8 text-center">
          <Radio className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-semibold">Vous êtes hors ligne</p>
          <p className="text-sm text-muted-foreground mt-1">
            Passez en ligne pour voir les commandes disponibles
          </p>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('wallet')}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm font-medium">Portefeuille</span>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('support')}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm font-medium">Support</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Ride View ───────────────────────────────────────────────────────────────

function RideView() {
  const { data } = useDriverNav();
  const orderId = data?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      const res = await apiFetch<Order>(`/api/orders/${orderId}`);
      if (res.data) setOrder(res.data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    const res = await apiFetch<Order>(`/api/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Statut mis à jour');
      if (res.data) setOrder(res.data);
    }
    setUpdating(false);
  };

  const handleCall = (phone: string | undefined, name: string) => {
    if (phone) {
      toast.info(`Appeler ${name}: ${phone}`);
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center py-20">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Commande non trouvée</p>
      </div>
    );
  }

  const clientPhone = order.client?.user?.phone;
  const merchantPhone = order.merchant?.user?.phone || order.merchant?.phone;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Status Badge */}
      <Card className="overflow-hidden border-emerald-500/20">
        <div className="bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
            <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 space-y-4">
          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].map((s, i) => {
              const steps = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
              const currentIdx = steps.indexOf(order.status);
              const stepIdx = i;
              const isActive = stepIdx <= currentIdx;
              const isCurrent = stepIdx === currentIdx;
              return (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`w-full h-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-emerald-500' : 'bg-muted'
                  } ${isCurrent ? 'ring-2 ring-emerald-500/30' : ''}`} />
                  {i < 3 && <div className="w-1" />}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
            <span>Assigné</span>
            <span>Récupéré</span>
            <span>En route</span>
            <span>Livré</span>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Info */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Point de récupération
        </p>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Store className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{order.merchant?.businessName}</p>
            <p className="text-xs text-muted-foreground">{order.merchant?.address || order.delivery?.pickupAddress}</p>
          </div>
        </div>
      </Card>

      {/* Delivery Info */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Adresse de livraison
        </p>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {order.client?.user?.firstName} {order.client?.user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
            {order.deliveryCity && (
              <p className="text-xs text-muted-foreground">{order.deliveryCity}{order.deliveryQuartier ? ` — ${order.deliveryQuartier}` : ''}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Client & Merchant Contact */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Contact
        </p>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleCall(clientPhone, 'le client')}
          >
            <Phone className="w-4 h-4 mr-3 text-emerald-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Appeler le client</p>
              <p className="text-xs text-muted-foreground">{clientPhone || 'Non disponible'}</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleCall(merchantPhone, 'le marchand')}
          >
            <Phone className="w-4 h-4 mr-3 text-amber-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Appeler le marchand</p>
              <p className="text-xs text-muted-foreground">{merchantPhone || 'Non disponible'}</p>
            </div>
          </Button>
        </div>
      </Card>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Articles ({order.items.length})
          </p>
          <div className="space-y-2.5 max-h-48 overflow-y-auto">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.productImage && (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
          {order.serviceFee > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Frais de service</span>
              <span>{formatPrice(order.serviceFee)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-emerald-600">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Paiement</span>
            <span>{order.paymentMethod}</span>
          </div>
        </Card>
      )}

      {/* Notes */}
      {order.notes && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Notes
          </p>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {order.status === 'ASSIGNED' && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={updating}
            onClick={() => handleStatusUpdate('PICKED_UP')}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5 mr-2" />}
            Récupérer au marchand
          </Button>
        )}
        {order.status === 'PICKED_UP' && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={updating}
            onClick={() => handleStatusUpdate('IN_TRANSIT')}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5 mr-2" />}
            En route vers le client
          </Button>
        )}
        {order.status === 'IN_TRANSIT' && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={updating}
            onClick={() => handleStatusUpdate('DELIVERED')}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            Confirmer la livraison
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── History View ────────────────────────────────────────────────────────────

function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const { navigate } = useDriverNav();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const res = await apiFetch<{ orders: Order[]; total: number }>('/api/orders?limit=100');
      if (res.data) {
        const list = res.data.orders || (Array.isArray(res.data) ? res.data : []);
        setOrders(list);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    if (filter === 'ALL') return ['DELIVERED', 'CANCELLED'].includes(o.status);
    return o.status === filter;
  });

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Historique des livraisons</h2>

      {/* Filter Tabs */}
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

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Aucune livraison trouvée</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => navigate('ride', { id: order.id })}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                  <Badge className={`text-[10px] ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </div>
                <div className="flex items-start gap-2 mb-1.5">
                  <Store className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{order.merchant?.businessName}</p>
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {order.client?.user?.firstName} {order.client?.user?.lastName}
                  </p>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDateShort(order.createdAt)}</span>
                  <span className="text-sm font-bold text-emerald-600">{formatPrice(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
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
        const list = ordersRes.data.orders || (Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setOrders(list);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalEarnings = deliveredOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
  const todayEarnings = deliveredOrders
    .filter((o) => {
      const d = new Date(o.deliveredAt || o.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .reduce((sum, o) => sum + o.deliveryFee, 0);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-36 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Revenus</h2>

      {/* Balance Card */}
      <Card className="overflow-hidden border-emerald-500/20">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white">
          <p className="text-sm opacity-80">Solde du portefeuille</p>
          <p className="text-3xl font-bold mt-1">
            {wallet ? formatPrice(wallet.balance) : '0 FCFA'}
          </p>
        </div>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => toast.info('Fonctionnalité de retrait bientôt disponible')}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Retirer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => navigate('wallet')}
            >
              <Wallet className="w-3.5 h-3.5 mr-1.5" />
              Détails
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Aujourd&apos;hui</p>
          <p className="text-lg font-bold text-emerald-600">{formatPrice(todayEarnings)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total gagné</p>
          <p className="text-lg font-bold">{formatPrice(totalEarnings)}</p>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {wallet && wallet.transactions.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'CREDIT' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'CREDIT' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-red-500 rotate-180" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || 'Transaction'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDateShort(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction</p>
          )}
        </CardContent>
      </Card>
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
        const list = res.data.orders || (Array.isArray(res.data) ? res.data : []);
        setOrders(list);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const ratedOrders = orders.filter((o) => o.ratings && o.ratings.length > 0);
  const allRatings = ratedOrders.flatMap((o) => o.ratings || []);
  const avgRating = allRatings.length > 0
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
        <Skeleton className="h-32 w-full rounded-lg" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Évaluations</h2>

      {/* Average Rating */}
      <Card className="p-5 text-center">
        <p className="text-4xl font-bold text-emerald-600">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
        {avgRating > 0 && <StarDisplay rating={avgRating} size={20} />}
        <p className="text-sm text-muted-foreground mt-1">
          {allRatings.length} évaluation{allRatings.length > 1 ? 's' : ''}
        </p>
      </Card>

      {/* Distribution */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Répartition des notes</p>
        <div className="space-y-2">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-2">
              <span className="text-xs w-3 text-right">{d.star}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rating List */}
      {ratedOrders.length > 0 ? (
        <div className="space-y-3">
          {ratedOrders.map((order) =>
            (order.ratings || []).map((rating) => (
              <Card key={rating.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={rating.rating} size={14} />
                    <span className="text-xs text-muted-foreground">
                      {rating.client?.user
                        ? `${rating.client.user.firstName} ${rating.client.user.lastName}`
                        : 'Client'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDateShort(rating.createdAt)}</span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-muted-foreground">{rating.comment}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5">{order.orderNumber}</p>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Star className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Aucune évaluation pour le moment</p>
        </Card>
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
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-36 w-full rounded-lg" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Portefeuille</h2>

      {/* Balance */}
      <Card className="overflow-hidden border-emerald-500/20">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white text-center">
          <p className="text-sm opacity-80 mb-1">Solde disponible</p>
          <p className="text-3xl font-bold">
            {wallet ? formatPrice(wallet.balance) : '0 FCFA'}
          </p>
        </div>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => toast.info('Le dépôt sera bientôt disponible')}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Dépôt
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => toast.info('Fonctionnalité de retrait bientôt disponible')}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Retrait
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {wallet && wallet.transactions.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'CREDIT' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'CREDIT' ? (
                        <ArrowRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-red-500 rotate-180" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || 'Transaction'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      {tx.reference && (
                        <p className="text-[10px] text-muted-foreground">Réf: {tx.reference}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ml-2 ${
                    tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune transaction</p>
          )}
        </CardContent>
      </Card>
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
      const res = await apiFetch<DriverProfile[]>('/api/drivers');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const p = res.data[0];
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
    const res = await apiFetch<DriverProfile>('/api/drivers', {
      method: 'POST',
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
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-lg font-bold">Profil</h2>

      {/* User Info */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-emerald-500" />
            )}
          </div>
          <div>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.phone}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        {profile && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{profile.totalDeliveries}</p>
              <p className="text-[10px] text-muted-foreground">Livraisons</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{profile.rating?.toFixed(1) || '—'}</p>
              <p className="text-[10px] text-muted-foreground">Note</p>
            </div>
          </div>
        )}
      </Card>

      {/* Vehicle Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div>
            <Label className="text-xs">Type de véhicule</Label>
            <Select
              value={form.vehicleType}
              onValueChange={(val) => setForm({ ...form, vehicleType: val })}
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
              placeholder="Ex: AK-1234-BJ"
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Marque</Label>
            <Input
              className="mt-1"
              placeholder="Ex: Yamaha, Honda..."
              value={form.vehicleBrand}
              onChange={(e) => setForm({ ...form, vehicleBrand: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Couleur</Label>
            <Input
              className="mt-1"
              placeholder="Ex: Rouge, Noir..."
              value={form.vehicleColor}
              onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-0">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors border-b"
            onClick={() => navigate('documents')}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Mes documents</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors border-b"
            onClick={() => navigate('ratings')}
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Mes évaluations</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors border-b"
            onClick={() => navigate('wallet')}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Portefeuille</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            onClick={() => navigate('support')}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications View ──────────────────────────────────────────────────────

function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await apiFetch<{ notifications: Notification[]; total: number; unreadCount: number }>(
        '/api/notifications?limit=50'
      );
      if (mounted) {
        if (res.data) {
          setNotifications(res.data.notifications || []);
          setTotal(res.data.total || 0);
        }
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const markAllRead = async () => {
    const res = await apiFetch('/api/notifications', { method: 'PUT' });
    if (!res.error) {
      toast.success('Toutes les notifications marquées comme lues');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const markOneRead = async (id: string) => {
    const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
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
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={markAllRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Aucune notification</p>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 cursor-pointer transition-colors ${
                notif.isRead ? 'opacity-60' : 'border-emerald-500/20 bg-emerald-500/5'
              }`}
              onClick={() => {
                if (!notif.isRead) markOneRead(notif.id);
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.isRead ? 'bg-muted' : 'bg-emerald-500/10'
                }`}>
                  <Bell className={`w-3.5 h-3.5 ${notif.isRead ? 'text-muted-foreground' : 'text-emerald-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${notif.isRead ? 'font-medium' : 'font-semibold'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && <CircleDot className="w-2 h-2 text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
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
      body: JSON.stringify({ subject: subject.trim(), description: description.trim() }),
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

      <Card className="p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-7 h-7 text-emerald-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Notre équipe est là pour vous aider. Décrivez votre problème et nous vous répondrons rapidement.
        </p>
      </Card>

      {sent ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold">Ticket envoyé !</p>
          <p className="text-sm text-muted-foreground mt-1">Nous vous répondrons dans les plus brefs délais.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setSent(false)}
          >
            Envoyer un autre ticket
          </Button>
        </Card>
      ) : (
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={sending}
              onClick={handleSubmit}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Envoyer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations de contact développeur */}
      <Card>
        <CardContent className="p-4">
          <SupportContactCard />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Documents View ──────────────────────────────────────────────────────────

const DOC_FIELDS = [
  { key: 'idCardImage' as const, label: "Carte d'identité", icon: FileText },
  { key: 'licenseImage' as const, label: 'Permis de conduire', icon: Shield },
  { key: 'vehicleImage' as const, label: "Carte grise du véhicule", icon: FileUp },
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
      const res = await apiFetch<DriverProfile[]>('/api/drivers');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setProfile(res.data[0]);
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

      const updateRes = await apiFetch<DriverProfile>('/api/drivers', {
        method: 'POST',
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
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
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
        {DOC_FIELDS.map((doc) => {
          const hasImage = !!(profile as Record<string, unknown> | null)?.[doc.key];
          const Icon = doc.icon;
          return (
            <Card key={doc.key} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    hasImage ? 'bg-emerald-500/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-4 h-4 ${hasImage ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {hasImage ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600">Téléchargé</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span className="text-[10px] text-muted-foreground">Manquant</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {hasImage && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-muted/50 border max-h-48">
                    <img
                      src={(profile as Record<string, unknown> | null)?.[doc.key] as string}
                      alt={doc.label}
                      className="w-full h-full object-contain max-h-48"
                    />
                  </div>
                )}

                <input
                  ref={(el) => { fileRefs.current[doc.key] = el; }}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={() => handleUpload(doc.key)}
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
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
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Driver App ─────────────────────────────────────────────────────────

export default function DriverApp() {
  const { view } = useDriverNav();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const checkApproval = async () => {
      const res = await apiFetch<DriverProfile[]>('/api/drivers');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setIsApproved(res.data[0].isApproved);
      } else {
        // No driver profile yet — show approval screen
        setIsApproved(false);
      }
      setProfileChecked(true);
    };
    checkApproval();
  }, []);

  if (!profileChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isApproved === false) {
    return <ApprovalScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar unreadCount={0} />
      <main className="flex-1">
        {view === 'home' && <HomeView />}
        {view === 'ride' && <RideView />}
        {view === 'history' && <HistoryView />}
        {view === 'earnings' && <EarningsView />}
        {view === 'ratings' && <RatingsView />}
        {view === 'wallet' && <WalletView />}
        {view === 'profile' && <ProfileView />}
        {view === 'notifications' && <NotificationsView />}
        {view === 'support' && <SupportView />}
        {view === 'documents' && <DocumentsView />}
        {view === 'navigation' && <RideView />}
        {view === 'chat' && <SupportView />}
      </main>
      <BottomNav />
    </div>
  );
}