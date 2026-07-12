'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore, useDriverNav, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Home, Package, Clock, User, MapPin, Navigation, Phone, Star, Wallet, FileText,
  Headphones, Bell, MessageCircle, ChevronRight, CheckCircle2, Circle, Truck,
  TrendingUp, Award, ArrowLeft, Upload, ShieldCheck, AlertCircle, Plus, Minus,
  Send, LogOut, CreditCard, ArrowUpRight, ArrowDownLeft, Route, Timer, CircleDot,
} from 'lucide-react';

// ─── Nav Items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home' as const, label: 'Accueil', icon: Home },
  { id: 'history' as const, label: 'Historique', icon: Clock },
  { id: 'earnings' as const, label: 'Revenus', icon: Wallet },
  { id: 'ratings' as const, label: 'Évaluations', icon: Star },
  { id: 'ride' as const, label: 'Course active', icon: Truck },
  { id: 'navigation' as const, label: 'Navigation', icon: Navigation },
  { id: 'wallet' as const, label: 'Portefeuille', icon: CreditCard },
  { id: 'documents' as const, label: 'Documents', icon: FileText },
  { id: 'support' as const, label: 'Support', icon: Headphones },
  { id: 'profile' as const, label: 'Profil', icon: User },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'chat' as const, label: 'Messages', icon: MessageCircle },
];

const MOBILE_TABS = [
  { id: 'home' as const, label: 'Accueil', icon: Home },
  { id: 'history' as const, label: 'Historique', icon: Clock },
  { id: 'earnings' as const, label: 'Revenus', icon: Wallet },
  { id: 'profile' as const, label: 'Profil', icon: User },
];

// ─── Empty State Component ──────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold text-muted-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Home View ──────────────────────────────────────────────────────────────

function HomeView() {
  const { navigate, data } = useDriverNav();
  const user = useAuthStore((s) => s.user);
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayEarnings: 0, todayDeliveries: 0 });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          todayEarnings: data.totalRevenue || 0,
          todayDeliveries: data.totalDeliveriesToday || 0,
        });
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      fetchOrders();
      fetchStats();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [isOnline, fetchOrders, fetchStats]);

  const handleToggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    toast.success(next ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
  };

  const handleAcceptOrder = (order: Record<string, unknown>) => {
    toast.success('Commande acceptée');
    navigate('ride', { id: order.id as string });
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'LV';

  return (
    <div className="space-y-5 pb-4">
      {/* Online Toggle */}
      <motion.div
        className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white shadow-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: isOnline ? [1, 1.2, 1] : 1,
              opacity: isOnline ? 1 : 0.5,
            }}
            transition={{ repeat: isOnline ? Infinity : 0, duration: 2 }}
          >
            <div className={`h-4 w-4 rounded-full ${isOnline ? 'bg-white' : 'bg-white/40'}`} />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-white/80">Statut</p>
            <p className="text-lg font-bold">{isOnline ? 'En ligne' : 'Hors ligne'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleToggleOnline}
          className="relative h-14 w-24 rounded-full bg-white/20 hover:bg-white/30 text-white p-0"
          aria-label="Toggle online status"
        >
          <motion.div
            className="absolute top-1 flex h-12 w-[46px] items-center justify-center rounded-full bg-white shadow-lg"
            animate={{ left: isOnline ? 'calc(100% - 50px)' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Truck className={`h-5 w-5 ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`} />
          </motion.div>
        </Button>
      </motion.div>

      {/* Driver Info Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-md glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 border-2 border-emerald-500">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{user ? `${user.firstName} ${user.lastName}` : 'Livreur'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center" onClick={() => navigate('history')}>
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                <p className="text-lg font-bold">{stats.todayDeliveries}</p>
                <p className="text-[10px] text-muted-foreground">Livraisons</p>
              </button>
              <button className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-center" onClick={() => navigate('ratings')}>
                <Star className="mx-auto mb-1 h-5 w-5 text-amber-500" />
                <p className="text-lg font-bold">-</p>
                <p className="text-[10px] text-muted-foreground">Note</p>
              </button>
              <button className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-center" onClick={() => navigate('earnings')}>
                <Wallet className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                <p className="text-lg font-bold">{formatPrice(stats.todayEarnings)}</p>
                <p className="text-[10px] text-muted-foreground">Revenus</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Available Orders */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-base font-bold">Courses disponibles</h2>
          {orders.length > 0 && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {orders.length}
            </Badge>
          )}
        </div>

        {!isOnline ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-lg font-semibold text-muted-foreground">Vous êtes hors ligne</p>
              <p className="mt-1 text-sm text-muted-foreground">Mettez-vous en ligne pour voir les courses disponibles</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <LoadingCards />
        ) : orders.length === 0 ? (
          <EmptyState icon={Package} title="Aucune course disponible" description="Recherche en cours..." />
        ) : (
          <div className="space-y-3">
            {(orders as Record<string, unknown>[]).map((order, idx) => (
              <motion.div key={order.id as string} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}>
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start gap-2">
                      <div className="flex flex-col items-center gap-0.5 pt-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="h-8 w-0.5 bg-gray-200 dark:bg-gray-700" />
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Marchand</p>
                          <p className="text-sm font-semibold">{(order.merchant as Record<string, unknown>)?.businessName || 'Marchand'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Livrer à</p>
                          <p className="text-sm font-semibold">{(order.deliveryAddress as string) || 'Adresse non spécifiée'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900 p-3 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Gains</p>
                        <p className="text-base font-bold text-emerald-600">{formatPrice(order.deliveryFee as number || 0)}</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Articles</p>
                        <p className="text-base font-bold">{(order.items as unknown[])?.length || 0}</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Temps est.</p>
                        <p className="text-base font-bold">~{order.estimatedTime || 30} min</p>
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                      onClick={() => handleAcceptOrder(order)}
                    >
                      Accepter
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Ride View ──────────────────────────────────────────────────────────────

function RideView() {
  const { view, data, navigate } = useDriverNav();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('assigned');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!data?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/orders?userId=${data.id}`);
        if (res.ok) {
          const all = await res.json();
          const found = Array.isArray(all) ? all.find((o: Record<string, unknown>) => o.id === data.id) : null;
          if (found) {
            setOrder(found);
            setStatus(found.status as string || 'CONFIRMED');
          }
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [data?.id]);

  if (!data?.id && !order) {
    return (
      <EmptyState
        icon={Truck}
        title="Aucune course en cours"
        description="Acceptez une course depuis l'accueil"
        action={{ label: "Retour à l'accueil", onClick: () => navigate('home') }}
      />
    );
  }

  if (loading) {
    return <LoadingCards count={2} />;
  }

  const merchantInfo = order?.merchant as Record<string, unknown> | undefined;
  const driverInfo = order?.driver as Record<string, unknown> | undefined;
  const driverUser = driverInfo?.user as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4 pb-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('home')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Course {order?.orderNumber || ''}
          </CardTitle>
          <Badge className={ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.PENDING}>
            {ORDER_STATUS_LABELS[status] || status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <CircleDot className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Récupérer</p>
              <p className="text-sm font-semibold">{merchantInfo?.businessName || 'Marchand'}</p>
              <p className="text-xs text-muted-foreground">{merchantInfo?.phone || ''}</p>
            </div>
          </div>

          <div className="ml-2.5 h-6 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Delivery */}
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <MapPin className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Livrer à</p>
              <p className="text-sm font-semibold">{order?.deliveryAddress || 'Adresse non spécifiée'}</p>
              <p className="text-xs text-muted-foreground">{order?.deliveryQuartier || ''}, {order?.deliveryCity || 'Bamako'}</p>
            </div>
          </div>

          <Separator />

          {/* Customer & Earnings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-semibold">Client</p>
              <p className="text-xs text-muted-foreground">{order?.paymentMethod || 'CASH'}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
              <p className="text-xs text-muted-foreground">Gains</p>
              <p className="text-lg font-bold text-emerald-600">{formatPrice(order?.deliveryFee as number || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {status !== 'PICKED_UP' && status !== 'IN_TRANSIT' && (
          <Button
            className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              setStatus('PICKED_UP');
              toast.success('Colis récupéré !');
            }}
          >
            <Package className="mr-2 h-5 w-5" />
            J&apos;ai récupéré la commande
          </Button>
        )}

        <Button
          className="w-full h-12 text-base font-bold"
          variant="outline"
          onClick={() => navigate('navigation', data)}
        >
          <Navigation className="mr-2 h-5 w-5" />
          Commencer la navigation
        </Button>

        <Button
          className="w-full h-12 text-base font-bold"
          variant="outline"
          onClick={() => toast.info('Appel en cours...')}
        >
          <Phone className="mr-2 h-5 w-5" />
          Appeler le client
        </Button>

        <Button
          className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            toast.success('Commande livrée !');
            navigate('home');
          }}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Livré
        </Button>
      </div>
    </div>
  );
}

// ─── Navigation View ────────────────────────────────────────────────────────

function NavigationView() {
  const { data, navigate } = useDriverNav();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data?.id) {
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${data.id}`);
        if (res.ok) {
          const all = await res.json();
          const found = Array.isArray(all) ? all.find((o: Record<string, unknown>) => o.id === data.id) : null;
          if (found) setOrder(found);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [data?.id]);

  if (!data?.id && !order) {
    return (
      <EmptyState
        icon={Navigation}
        title="Aucune navigation en cours"
        action={{ label: "Retour à l'accueil", onClick: () => navigate('home') }}
      />
    );
  }

  if (loading) return <LoadingCards count={1} />;

  return (
    <div className="space-y-4 pb-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('ride', data)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour à la course
      </Button>

      {/* Map Placeholder */}
      <div className="relative h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Navigation className="h-12 w-12 text-emerald-500" />
          </motion.div>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Navigation en cours...</p>
        </div>
      </div>

      <Card className="border-0 shadow-md glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Route className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold">{order?.deliveryAddress || 'Destination'}</p>
              <p className="text-xs text-muted-foreground">{order?.deliveryQuartier || ''}, {order?.deliveryCity || 'Bamako'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
              <Timer className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
              <p className="text-xl font-bold">~{order?.estimatedTime || 30} min</p>
              <p className="text-xs text-muted-foreground">Temps estimé</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
              <Route className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-xl font-bold">-- km</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              toast.success('Livraison terminée !');
              navigate('home');
            }}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Terminer la livraison
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── History View ───────────────────────────────────────────────────────────

function HistoryView() {
  const { navigate } = useDriverNav();
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <LoadingCards count={5} />;

  if (orders.length === 0) {
    return <EmptyState icon={Clock} title="Aucun historique" description="Vos courses livrées apparaîtront ici" />;
  }

  return (
    <div className="space-y-3 pb-4">
      {(orders as Record<string, unknown>[]).map((order) => {
        const merchant = order.merchant as Record<string, unknown> | undefined;
        return (
          <Card
            key={order.id as string}
            className="border-0 shadow-md glass-card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('ride', { id: order.id as string })}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">{order.orderNumber || ''}</p>
                <Badge className={ORDER_STATUS_COLORS[order.status as string] || ORDER_STATUS_COLORS.PENDING}>
                  {ORDER_STATUS_LABELS[order.status as string] || order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{merchant?.businessName || 'Marchand'}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {order.createdAt ? new Date(order.createdAt as string).toLocaleDateString('fr-FR') : ''}
                </p>
                <p className="text-sm font-bold text-emerald-600">{formatPrice(order.total as number || 0)}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Earnings View ──────────────────────────────────────────────────────────

function EarningsView() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalDeliveriesToday: 0 });
  const [weeklyData, setWeeklyData] = useState<{ day: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalRevenue: data.totalRevenue || 0,
            totalDeliveriesToday: data.totalDeliveriesToday || 0,
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const weekData = days.map((day) => ({
    day,
    amount: weeklyData.find((d) => d.day === day)?.amount || 0,
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (stats.totalRevenue === 0 && weeklyData.length === 0) {
    return <EmptyState icon={Wallet} title="Aucun revenu" description="Effectuez des livraisons pour voir vos revenus" />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-md glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <p className="text-2xl font-bold gradient-text">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total revenus</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md glass-card">
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-amber-500" />
            <p className="text-2xl font-bold">{formatPrice(Math.round(stats.totalRevenue / 30))}</p>
            <p className="text-xs text-muted-foreground mt-1">Aujourd&apos;hui (estimé)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md glass-card">
          <CardContent className="p-4 text-center">
            <Package className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalDeliveriesToday}</p>
            <p className="text-xs text-muted-foreground mt-1">Livraisons aujourd&apos;hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base">Revenus de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatPrice(value), 'Revenus']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base">Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={CreditCard} title="Aucune transaction" description="Les transactions apparaîtront ici" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Ratings View ───────────────────────────────────────────────────────────

function RatingsView() {
  const [ratings, setRatings] = useState<{ average: number; total: number; reviews: { name: string; rating: number; comment: string; date: string }[] }>({
    average: 0, total: 0, reviews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setRatings({
            average: data.avgRating || 0,
            total: 0,
            reviews: [],
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchRatings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (ratings.average === 0 && ratings.total === 0) {
    return <EmptyState icon={Star} title="Aucune évaluation" description="Les évaluations de vos clients apparaîtront ici" />;
  }

  const distribution = [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Average Rating */}
      <Card className="border-0 shadow-md glass-card">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-8 w-8 ${i < Math.round(ratings.average) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-4xl font-bold">{ratings.average.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground mt-1">{ratings.total} évaluation{ratings.total !== 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base">Répartition des notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {distribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-3">
              <span className="text-sm font-medium w-12">{d.stars} étoile{d.stars > 1 ? 's' : ''}</span>
              <Progress value={d.percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-8 text-right">{d.percentage}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base">Avis récents</CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun avis pour le moment</p>
          ) : (
            <div className="space-y-4">
              {ratings.reviews.map((review, i) => (
                <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{review.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-semibold">{review.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Wallet View ────────────────────────────────────────────────────────────

function WalletView() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<{ id: string; type: string; description: string; amount: number; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.totalRevenue || 0);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Balance Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <CardContent className="p-6">
          <p className="text-sm text-white/80">Solde disponible</p>
          <p className="text-3xl font-bold mt-1">{formatPrice(balance)}</p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setDialogType('add'); setDialogOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setDialogType('withdraw'); setDialogOpen(true); }}
            >
              <Minus className="mr-2 h-4 w-4" />
              Retirer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState icon={CreditCard} title="Aucune transaction" description="Vos transactions apparaîtront ici" />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={`rounded-full p-2 ${tx.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Withdraw Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType === 'add' ? 'Ajouter des fonds' : 'Retirer des fonds'}</DialogTitle>
            <DialogDescription>
              {dialogType === 'add' ? 'Entrez le montant à ajouter à votre portefeuille.' : 'Entrez le montant à retirer de votre portefeuille.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Montant en FCFA"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                toast.success(dialogType === 'add' ? 'Fonds ajoutés avec succès' : 'Retrait effectué');
                setDialogOpen(false);
                setAmount('');
              }}
            >
              {dialogType === 'add' ? 'Ajouter' : 'Retirer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Support View ───────────────────────────────────────────────────────────

function SupportView() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      if (res.ok) {
        toast.success('Message envoyé avec succès');
        setSubject('');
        setMessage('');
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Headphones className="h-5 w-5 text-emerald-600" />
            Support
          </CardTitle>
          <CardDescription>Notre équipe est là pour vous aider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Sujet</label>
            <Input
              placeholder="Décrivez votre problème..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message</label>
            <Textarea
              placeholder="Détaillez votre demande..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
          <Button
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Send className="mr-2 h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Profile View ───────────────────────────────────────────────────────────

function ProfileView() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [vehicleInfo, setVehicleInfo] = useState({ type: '', plate: '', color: '' });
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-4 pb-4">
      {/* User Info */}
      <Card className="border-0 shadow-md glass-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-emerald-500">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'LV'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{user ? `${user.firstName} ${user.lastName}` : 'Livreur'}</p>
              <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
            </div>
          </div>
          {user?.isVerified && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Vérifié
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      <Card className="border-0 shadow-md glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            Informations véhicule
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Annuler' : 'Modifier'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Type de véhicule</label>
            <Input
              placeholder="Ex: Moto, Voiture..."
              value={vehicleInfo.type}
              onChange={(e) => setVehicleInfo({ ...vehicleInfo, type: e.target.value })}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Immatriculation</label>
            <Input
              placeholder="Ex: AK-0452-BM"
              value={vehicleInfo.plate}
              onChange={(e) => setVehicleInfo({ ...vehicleInfo, plate: e.target.value })}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Couleur</label>
            <Input
              placeholder="Ex: Rouge, Noir..."
              value={vehicleInfo.color}
              onChange={(e) => setVehicleInfo({ ...vehicleInfo, color: e.target.value })}
              disabled={!editing}
            />
          </div>
          {editing && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setEditing(false);
                toast.success('Informations véhicule mises à jour');
              }}
            >
              Enregistrer
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
        onClick={logout}
      >
        <LogOut className="mr-2 h-5 w-5" />
        Se déconnecter
      </Button>
    </div>
  );
}

// ─── Notifications View ─────────────────────────────────────────────────────

function NotificationsView() {
  return <EmptyState icon={Bell} title="Aucune notification" description="Vos notifications apparaîtront ici" />;
}

// ─── Chat View ──────────────────────────────────────────────────────────────

function ChatView() {
  return <EmptyState icon={MessageCircle} title="Aucune conversation" description="Vos conversations avec les clients apparaîtront ici" />;
}

// ─── Documents View ─────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { id: 'id_card', name: "Carte d'identité nationale", description: "Pièce d'identité en cours de validité" },
  { id: 'license', name: 'Permis de conduire', description: 'Permis moto ou voiture catégorie A/B' },
  { id: 'registration', name: "Carte grise du véhicule", description: "Enregistrement du véhicule" },
  { id: 'selfie', name: 'Selfie avec pièce', description: "Photo de vous avec votre pièce d'identité" },
];

function DocumentsView() {
  const [documents, setDocuments] = useState<Record<string, 'pending' | 'submitted' | 'verified'>>({});

  const handleUpload = (docId: string, name: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        setDocuments((prev) => ({ ...prev, [docId]: 'submitted' }));
        toast.success('Document soumis');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4 pb-4">
      <Card className="border-0 shadow-md glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Documents de vérification
          </CardTitle>
          <CardDescription>Soumettez vos documents pour vérification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOCUMENT_TYPES.map((doc) => {
            const status = documents[doc.id] || 'pending';
            return (
              <div key={doc.id} className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                <div className={`rounded-full p-2 ${
                  status === 'verified' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                  status === 'submitted' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  'bg-gray-100 dark:bg-gray-900'
                }`}>
                  <FileText className={`h-5 w-5 ${
                    status === 'verified' ? 'text-emerald-600' :
                    status === 'submitted' ? 'text-amber-600' :
                    'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={
                    status === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    status === 'submitted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-gray-100 text-gray-500'
                  }>
                    {status === 'verified' ? 'Vérifié' : status === 'submitted' ? 'En cours' : 'Non soumis'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleUpload(doc.id, doc.name)}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── View Renderer ──────────────────────────────────────────────────────────

function ViewRenderer({ view }: { view: string }) {
  switch (view) {
    case 'home': return <HomeView />;
    case 'ride': return <RideView />;
    case 'navigation': return <NavigationView />;
    case 'history': return <HistoryView />;
    case 'earnings': return <EarningsView />;
    case 'ratings': return <RatingsView />;
    case 'wallet': return <WalletView />;
    case 'support': return <SupportView />;
    case 'profile': return <ProfileView />;
    case 'notifications': return <NotificationsView />;
    case 'chat': return <ChatView />;
    case 'documents': return <DocumentsView />;
    default: return <HomeView />;
  }
}

// ─── Main Driver App ────────────────────────────────────────────────────────

export default function DriverApp() {
  const { view, navigate } = useDriverNav();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((item) => item.id === view);

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-card sticky top-0 h-screen">
        <div className="p-4">
          <h1 className="text-xl font-bold gradient-text">Rapigo Driver</h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-base font-bold gradient-text">Rapigo Driver</h1>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => navigate('notifications')}
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-60 bg-card border-r shadow-xl md:hidden"
              >
                <div className="p-4 flex items-center justify-between">
                  <h1 className="text-xl font-bold gradient-text">Rapigo Driver</h1>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = view === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { navigate(item.id); setSidebarOpen(false); }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Header */}
        <div className="hidden md:block px-6 py-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {currentNav && <currentNav.icon className="h-5 w-5 text-emerald-600" />}
            {currentNav?.label || 'Accueil'}
          </h2>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ViewRenderer view={view} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden sticky bottom-0 z-30 bg-background/80 backdrop-blur-lg border-t">
          <div className="flex items-center justify-around py-1">
            {MOBILE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = view === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[64px] ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}