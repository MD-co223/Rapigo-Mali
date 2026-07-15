'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radio, Navigation, Clock, Wallet, User, Bell, LogOut, Phone,
  MapPin, Package, Star, ChevronRight, ChevronLeft, Upload, Check,
  X, AlertCircle, Loader2, Plus, MessageSquare, FileText, Camera,
  Send, Shield, TrendingUp, CreditCard, CircleDot, ArrowRight,
  Store, UserCircle, CheckCircle2, XCircle, Eye, RefreshCw,
  Menu, ChevronDown, ChevronUp, Heart, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useDriverNav, useAuthStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type DriverView
} from '@/lib/store';

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
  isOnline: boolean;
  isAvailable: boolean;
  rating: number;
  totalRatings: number;
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
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryQuartier: string | null;
  notes: string | null;
  estimatedTime: number | null;
  createdAt: string;
  items: OrderItem[];
  client?: { user: { firstName: string; lastName: string; phone: string; avatar: string | null } };
  merchant?: { id: string; businessName: string; logo: string | null; address: string; phone?: string; user?: { firstName: string; lastName: string; phone: string } };
  driver?: { user: { firstName: string; lastName: string; phone: string; avatar: string | null } };
  delivery?: { id: string; status: string; pickupAddress: string | null; dropoffAddress: string | null };
}

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data: string | null;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DriverApp() {
  const { view, navigate, goBack } = useDriverNav();
  const { user, logout: authLogout } = useAuthStore();

  // Driver state
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Notification count
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDriver = useCallback(async () => {
    const { data, error } = await apiFetch<DriverProfile[]>('/api/drivers');
    if (data && data.length > 0) {
      setDriver(data[0]);
      setIsOnline(data[0].isOnline);
    } else {
      setDriver(null);
    }
    setLoading(false);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const { data } = await apiFetch<{ unreadCount: number }>('/api/notifications?limit=1');
    if (data) setUnreadCount(data.unreadCount || 0);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: driverData } = await apiFetch<DriverProfile[]>('/api/drivers');
      if (driverData && driverData.length > 0) {
        setDriver(driverData[0]);
        setIsOnline(driverData[0].isOnline);
      } else {
        setDriver(null);
      }
      setLoading(false);
      const { data: notifData } = await apiFetch<{ unreadCount: number }>('/api/notifications?limit=1');
      if (notifData) setUnreadCount(notifData.unreadCount || 0);
    };
    init();
  }, []);

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // ─── Not Approved Screen ────────────────────────────────────────────────
  if (driver && !driver.isApproved) {
    return <NotApprovedScreen driver={driver} onRefresh={fetchDriver} />;
  }

  // ─── No Driver Profile ──────────────────────────────────────────────────
  if (!driver) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="size-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Profil non trouvé</h2>
            <p className="text-sm text-muted-foreground">Aucun profil chauffeur associé à votre compte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const driverName = `${driver.user.firstName} ${driver.user.lastName}`;

  // ─── Logout handler ─────────────────────────────────────────────────────
  const handleLogout = () => {
    authLogout();
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-background max-w-lg mx-auto relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
              <ChevronLeft className="size-5" />
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{driverName}</p>
            <p className="text-xs text-muted-foreground">{driver.vehicleType === 'MOTO' ? 'Moto' : driver.vehicleType === 'VELO' ? 'Vélo' : 'Voiture'}{driver.vehiclePlate ? ` • ${driver.vehiclePlate}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-1">
            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
            <Switch
              checked={isOnline}
              onCheckedChange={(checked) => {
                setIsOnline(checked);
                setDriver(prev => prev ? { ...prev, isOnline: checked, isAvailable: checked } : null);
                apiFetch('/api/drivers', {
                  method: 'POST',
                  body: JSON.stringify({ isOnline: checked, isAvailable: checked }),
                }).catch(() => {});
              }}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('notifications')}>
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="size-5 text-red-500" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {view === 'home' && <HomeView driver={driver} onAccept={() => navigate('ride')} />}
        {view === 'ride' && <RideView driver={driver} />}
        {view === 'history' && <HistoryView />}
        {view === 'earnings' && <EarningsView driver={driver} />}
        {view === 'ratings' && <RatingsView driver={driver} />}
        {view === 'wallet' && <WalletView />}
        {view === 'profile' && <ProfileView driver={driver} onRefresh={fetchDriver} />}
        {view === 'documents' && <DocumentsView driver={driver} onRefresh={fetchDriver} />}
        {view === 'notifications' && <NotificationsView onBack={() => { goBack(); fetchUnreadCount(); }} />}
        {view === 'support' && <SupportView />}
        {view === 'navigation' && <NavigationPlaceholder />}
        {view === 'chat' && <ChatPlaceholder />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <NavItem icon={Radio} label="Disponible" active={view === 'home'} onClick={() => navigate('home')} />
          <NavItem icon={Navigation} label="Commandes" active={view === 'ride'} onClick={() => navigate('ride')} />
          <NavItem icon={Clock} label="Historique" active={view === 'history'} onClick={() => navigate('history')} />
          <NavItem icon={Wallet} label="Gains" active={['earnings', 'wallet', 'ratings'].includes(view)} onClick={() => navigate('earnings')} />
          <NavItem icon={User} label="Profil" active={['profile', 'documents', 'support', 'notifications'].includes(view)} onClick={() => navigate('profile')} />
        </div>
      </nav>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
        active ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ─── Not Approved Screen ──────────────────────────────────────────────────────

function NotApprovedScreen({ driver, onRefresh }: { driver: DriverProfile; onRefresh: () => void }) {
  const docsStatus = [
    { label: "Pièce d'identité", uploaded: !!driver.idCardImage },
    { label: 'Permis de conduire', uploaded: !!driver.licenseImage },
    { label: 'Photo du véhicule', uploaded: !!driver.vehicleImage },
    { label: 'Selfie', uploaded: !!driver.selfieImage },
  ];
  const allUploaded = docsStatus.every(d => d.uploaded);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Shield className="size-10 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-center">En attente d&apos;approbation</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Votre profil doit être vérifié par un administrateur avant que vous puissiez commencer à recevoir des commandes.
          </p>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {docsStatus.map(doc => (
              <div key={doc.label} className="flex items-center justify-between">
                <span className="text-sm">{doc.label}</span>
                {doc.uploaded ? (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    <span className="text-xs font-medium">Envoyé</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-500">
                    <XCircle className="size-4" />
                    <span className="text-xs font-medium">Manquant</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {!allUploaded && (
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => {
              const nav = useDriverNav.getState();
              nav.navigate('documents');
              onRefresh();
            }}
          >
            <Upload className="size-4 mr-2" />
            Compléter mes documents
          </Button>
        )}

        <Button variant="ghost" className="w-full" onClick={onRefresh}>
          <RefreshCw className="size-4 mr-2" />
          Actualiser
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Vos documents doivent être vérifiés par un administrateur.
        </p>
      </div>
    </div>
  );
}

// ─── Home / Available View ────────────────────────────────────────────────────

function HomeView({ driver, onAccept }: { driver: DriverProfile; onAccept: () => void }) {
  const [isOnline, setIsOnline] = useState(driver.isOnline);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAvailableOrders = useCallback(async () => {
    if (!isOnline) return;
    const { data } = await apiFetch<Order[]>('/api/drivers/available-orders');
    if (data) setOrders(data);
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<Order[]>('/api/drivers/available-orders');
      if (!cancelled && data) setOrders(data);
      if (!cancelled) setLoading(false);
    };
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isOnline]);

  const handleToggle = async (checked: boolean) => {
    setIsOnline(checked);
    await apiFetch('/api/drivers', {
      method: 'POST',
      body: JSON.stringify({ isOnline: checked, isAvailable: checked }),
    });
  };

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    const { data, error } = await apiFetch<Order>(`/api/drivers/${orderId}/accept`, { method: 'POST' });
    if (!error && data) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      onAccept();
    }
    setAcceptingId(null);
  };

  // Offline stats
  const todayDeliveries = driver.totalDeliveries;
  const todayEarnings = driver.totalEarnings;
  const avgRating = driver.totalRatings > 0 ? driver.rating : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Online Toggle */}
      <Card className="overflow-hidden">
        <div className={`p-6 text-center transition-colors ${isOnline ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-gray-50 dark:bg-gray-900/20'}`}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-lg font-bold">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-emerald-600 mx-auto"
          />
          <p className="text-xs text-muted-foreground mt-3">
            {isOnline ? 'Vous recevrez des commandes附近的' : 'Activez pour recevoir des commandes'}
          </p>
        </div>
      </Card>

      {isOnline ? (
        <>
          {/* Waiting / Orders */}
          {loading && orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="size-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">Recherche de commandes...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="relative">
                <Radio className="size-12 text-emerald-500" />
                <span className="absolute inset-0 animate-ping bg-emerald-400/20 rounded-full" />
              </div>
              <p className="font-medium">En attente de commandes...</p>
              <p className="text-sm text-muted-foreground">Les nouvelles commandes apparaîtront ici automatiquement</p>
              <Button variant="outline" size="sm" onClick={fetchAvailableOrders}>
                <RefreshCw className="size-4 mr-1" />
                Actualiser
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Commandes disponibles ({orders.length})
                </h2>
                <Button variant="ghost" size="sm" onClick={fetchAvailableOrders} disabled={loading}>
                  <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="space-y-3">
                {orders.map(order => (
                  <AvailableOrderCard
                    key={order.id}
                    order={order}
                    onAccept={handleAccept}
                    accepting={acceptingId === order.id}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Offline Stats */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Résumé</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Livraisons" value={String(todayDeliveries)} icon={Package} color="text-emerald-600" />
            <StatCard label="Gains" value={formatPrice(todayEarnings)} icon={TrendingUp} color="text-orange-500" />
            <StatCard label="Note" value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—'} icon={Star} color="text-amber-500" />
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg" onClick={() => handleToggle(true)}>
            <Zap className="size-5 mr-2" />
            Me mettre en ligne
          </Button>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="text-center">
      <CardContent className="pt-4 pb-4 px-3">
        <Icon className={`size-5 mx-auto mb-1 ${color}`} />
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function AvailableOrderCard({ order, onAccept, accepting }: { order: Order; onAccept: (id: string) => void; accepting: boolean }) {
  const itemCount = order.items?.length || 0;
  const itemsSummary = order.items?.slice(0, 3).map(i => i.productName).join(', ') + (itemCount > 3 ? `... +${itemCount - 3}` : '');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Store className="size-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{order.merchant?.businessName || 'Marchand'}</p>
              <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
            </div>
          </div>
          <p className="font-bold text-emerald-600 text-sm">{formatPrice(order.deliveryFee)}</p>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Ramassage</p>
              <p className="text-xs">{order.merchant?.address || 'Adresse marchand'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Livraison</p>
              <p className="text-xs">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          <Package className="size-3 inline mr-1" />
          {itemsSummary || 'Aucun article'}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {order.estimatedTime && (
              <Badge variant="outline" className="text-xs">
                <Clock className="size-3 mr-1" />
                ~{order.estimatedTime} min
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {formatPrice(order.total)}
            </Badge>
          </div>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onAccept(order.id)}
            disabled={accepting}
          >
            {accepting ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4 mr-1" /> Accepter</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Ride / Active Delivery View ──────────────────────────────────────────────

function RideView({ driver }: { driver: DriverProfile }) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { navigate } = useDriverNav();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<{ orders: Order[]; total: number }>('/api/orders?status=ASSIGNED&limit=5');
      if (cancelled) return;
      let found: Order | null = null;
      if (data?.orders && data.orders.length > 0) {
        found = data.orders.find(o => o.status === 'IN_TRANSIT')
          || data.orders.find(o => o.status === 'PICKED_UP')
          || data.orders.find(o => o.status === 'ASSIGNED')
          || null;
      }
      if (!found) {
        const { data: data2 } = await apiFetch<{ orders: Order[] }>('/api/orders?limit=10');
        if (!cancelled && data2?.orders) {
          found = data2.orders.find(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)) || null;
        }
      }
      if (!cancelled) {
        setActiveOrder(found);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (newStatus: string) => {
    if (!activeOrder) return;
    setUpdating(true);
    setError(null);
    const { data, error: err } = await apiFetch<Order>(`/api/orders/${activeOrder.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    if (err) {
      setError(err);
    } else if (data) {
      if (newStatus === 'DELIVERED') {
        navigate('home');
      } else {
        setActiveOrder(data);
      }
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Navigation className="size-8 text-gray-400" />
        </div>
        <p className="text-center font-medium">Aucune livraison active</p>
        <p className="text-sm text-muted-foreground text-center">Acceptez une commande pour commencer une livraison</p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('home')}>
          Voir les commandes
        </Button>
      </div>
    );
  }

  const status = activeOrder.status;
  const isAssigned = status === 'ASSIGNED';
  const isPickedUp = status === 'PICKED_UP';
  const isInTransit = status === 'IN_TRANSIT';
  const merchantPhone = activeOrder.merchant?.phone || activeOrder.merchant?.user?.phone || '';
  const clientPhone = activeOrder.client?.user?.phone || '';

  return (
    <div className="p-4 space-y-4">
      {/* Status Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <CircleDot className="size-5 text-emerald-600" />
            <span className="font-semibold text-sm">
              {isAssigned && 'Aller au restaurant'}
              {isPickedUp && 'En route vers le client'}
              {isInTransit && 'En livraison'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <StepDot active done={isAssigned || isPickedUp || isInTransit} label="Assigné" />
            <StepLine done={isPickedUp || isInTransit} />
            <StepDot active={isPickedUp || isInTransit} done={isPickedUp || isInTransit} label="Récupéré" />
            <StepLine done={isInTransit} />
            <StepDot active={isInTransit} done={false} label="Livré" />
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20 h-40 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-32 h-1 bg-emerald-600 rounded rotate-12" />
          <div className="absolute top-16 left-16 w-24 h-1 bg-emerald-600 rounded -rotate-6" />
          <div className="absolute bottom-12 right-12 w-28 h-1 bg-orange-500 rounded rotate-45" />
          <div className="absolute bottom-8 right-8 w-20 h-1 bg-orange-500 rounded -rotate-12" />
        </div>
        <div className="flex flex-col items-center gap-2 z-10">
          <MapPin className="size-8 text-emerald-600" />
          <span className="text-xs text-muted-foreground font-medium">Carte de navigation</span>
        </div>
      </div>

      {/* Merchant Info */}
      {isAssigned && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="size-4 text-emerald-600" />
              Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{activeOrder.merchant?.businessName}</p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 mt-0.5 shrink-0" />
              <span>{activeOrder.merchant?.address}</span>
            </div>
            {merchantPhone && (
              <a href={`tel:${merchantPhone}`} className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Phone className="size-4" />
                {merchantPhone}
              </a>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => updateStatus('PICKED_UP')}
              disabled={updating}
            >
              {updating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
              J&apos;ai récupéré la commande
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Client Info (when picked up) */}
      {(isPickedUp || isInTransit) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCircle className="size-4 text-orange-500" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">
              {activeOrder.client?.user?.firstName} {activeOrder.client?.user?.lastName}
            </p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 mt-0.5 shrink-0 text-orange-500" />
              <span>{activeOrder.deliveryAddress}</span>
            </div>
            {clientPhone && (
              <a href={`tel:${clientPhone}`} className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Phone className="size-4" />
                {clientPhone}
              </a>
            )}
          </CardContent>
          <CardFooter>
            {isPickedUp && (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => updateStatus('IN_TRANSIT')}
                disabled={updating}
              >
                {updating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Navigation className="size-4 mr-2" />}
                Démarrer la livraison
              </Button>
            )}
            {isInTransit && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => updateStatus('DELIVERED')}
                disabled={updating}
              >
                {updating ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                J&apos;ai livré
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Contact Buttons */}
      <div className="flex gap-3">
        {merchantPhone && (
          <a href={`tel:${merchantPhone}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Phone className="size-4 mr-2" />
              Appeler le restaurant
            </Button>
          </a>
        )}
        {clientPhone && (
          <a href={`tel:${clientPhone}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Phone className="size-4 mr-2" />
              Appeler le client
            </Button>
          </a>
        )}
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Détails de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Commande</span>
            <span className="font-mono">#{activeOrder.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Articles</span>
            <span>{activeOrder.items?.length || 0}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(activeOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span className="text-emerald-600 font-medium">{formatPrice(activeOrder.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{formatPrice(activeOrder.total)}</span>
          </div>
          {activeOrder.notes && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Note :</span> {activeOrder.notes}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
        done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-600' : 'bg-gray-200 text-gray-400'
      }`}>
        {done ? <Check className="size-3" /> : active ? <CircleDot className="size-3" /> : ''}
      </div>
      <span className="text-[9px] text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return <div className={`flex-1 h-0.5 rounded ${done ? 'bg-emerald-600' : 'bg-gray-200'}`} />;
}

// ─── History View ────────────────────────────────────────────────────────────

function HistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'DELIVERED' | 'CANCELLED'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const { data } = await apiFetch<{ orders: Order[] }>(`/api/orders?limit=50${statusParam}`);
      if (!cancelled) {
        if (data?.orders) setOrders(data.orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status)));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [filter]);

  const openDetail = async (orderId: string) => {
    setDetailLoading(true);
    const { data } = await apiFetch<Order>(`/api/orders/${orderId}`);
    if (data) setDetailOrder(data);
    setDetailLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Historique des livraisons</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: 'Tout' },
          { key: 'DELIVERED' as const, label: 'Livrées' },
          { key: 'CANCELLED' as const, label: 'Annulées' },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            className={filter === f.key ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="size-12 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground">Aucune livraison trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order.id} className="cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => { setExpandedId(expandedId === order.id ? null : order.id); openDetail(order.id); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.merchant?.businessName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </Badge>
                    <p className="text-xs font-medium mt-1">{formatPrice(order.deliveryFee)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <ChevronDown className={`size-4 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedId === order.id && detailOrder && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {detailLoading && !detailOrder ? (
                      <Loader2 className="size-4 animate-spin mx-auto" />
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sous-total</span>
                          <span>{formatPrice(detailOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frais de livraison</span>
                          <span className="text-emerald-600">{formatPrice(detailOrder.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>Total</span>
                          <span>{formatPrice(detailOrder.total)}</span>
                        </div>
                        {detailOrder.items?.length > 0 && (
                          <>
                            <Separator />
                            <p className="text-xs font-medium text-muted-foreground">Articles :</p>
                            {detailOrder.items.map(item => (
                              <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                                <span>{item.quantity}x {item.productName}</span>
                                <span>{formatPrice(item.totalPrice)}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Earnings View ────────────────────────────────────────────────────────────

function EarningsView({ driver }: { driver: DriverProfile }) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earnings' | 'wallet'>('earnings');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [walletRes, ordersRes] = await Promise.all([
        apiFetch<WalletData>('/api/wallet'),
        apiFetch<{ orders: Order[] }>('/api/orders?limit=100'),
      ]);
      if (walletRes.data) setWallet(walletRes.data);
      if (ordersRes.data?.orders) {
        setOrders(ordersRes.data.orders.filter(o => o.status === 'DELIVERED'));
      }
      setLoading(false);
    }
    load();
  }, []);

  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(todayStart - now.getDay() * 86400000).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const todayEarnings = deliveredOrders
    .filter(o => new Date(o.createdAt).getTime() >= todayStart)
    .reduce((sum, o) => sum + o.deliveryFee, 0);
  const weekEarnings = deliveredOrders
    .filter(o => new Date(o.createdAt).getTime() >= weekStart)
    .reduce((sum, o) => sum + o.deliveryFee, 0);
  const monthEarnings = deliveredOrders
    .filter(o => new Date(o.createdAt).getTime() >= monthStart)
    .reduce((sum, o) => sum + o.deliveryFee, 0);
  const totalEarnings = deliveredOrders.reduce((sum, o) => sum + o.deliveryFee, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Mes gains</h2>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'earnings' | 'wallet')}>
        <TabsList className="w-full">
          <TabsTrigger value="earnings" className="flex-1">Gains</TabsTrigger>
          <TabsTrigger value="wallet" className="flex-1">Portefeuille</TabsTrigger>
          <TabsTrigger value="ratings" className="flex-1" onClick={() => useDriverNav.getState().navigate('ratings')}>Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <EarningsCard label="Aujourd&apos;hui" value={formatPrice(todayEarnings)} icon={Zap} color="bg-emerald-100 text-emerald-700" />
            <EarningsCard label="Cette semaine" value={formatPrice(weekEarnings)} icon={TrendingUp} color="bg-orange-100 text-orange-700" />
            <EarningsCard label="Ce mois" value={formatPrice(monthEarnings)} icon={CreditCard} color="bg-amber-100 text-amber-700" />
            <EarningsCard label="Total" value={formatPrice(totalEarnings)} icon={Wallet} color="bg-emerald-100 text-emerald-700" />
          </div>

          {/* Breakdown */}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Détail des gains</h3>
          {deliveredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="size-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun gain pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveredOrders.slice(0, 20).map(order => {
                const commission = Math.round(order.deliveryFee * 0.1);
                const net = order.deliveryFee - commission;
                return (
                  <Card key={order.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">#{order.orderNumber}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {order.merchant?.businessName} • {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{formatPrice(net)}</p>
                        <p className="text-[10px] text-muted-foreground">Frais: {formatPrice(order.deliveryFee)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4 mt-4">
          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-80">Solde du portefeuille</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(wallet?.balance || 0)}</p>
              <p className="text-xs opacity-60 mt-2">
                {wallet?.transactions?.length || 0} transactions récentes
              </p>
            </CardContent>
          </Card>

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transactions récentes</h3>
          {(!wallet?.transactions || wallet.transactions.length === 0) ? (
            <div className="text-center py-8">
              <CreditCard className="size-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucune transaction</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallet.transactions.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge variant={tx.type === 'CREDIT' ? 'default' : 'destructive'} className={tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : ''}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ratings" />
      </Tabs>
    </div>
  );
}

function EarningsCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
          <Icon className="size-4" />
        </div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ─── Ratings View ─────────────────────────────────────────────────────────────

function RatingsView({ driver }: { driver: DriverProfile }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await apiFetch<{ orders: Order[] }>('/api/orders?limit=50');
      if (data?.orders) {
        setOrders(data.orders.filter(o => o.status === 'DELIVERED' && o.ratings && o.ratings.length > 0) as (Order & { ratings: { score: number; comment: string | null; createdAt: string; client: { user: { firstName: string } } }[] })[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Flatten ratings from orders
  interface FlatRating { score: number; comment: string | null; date: string; clientName: string }
  const ratings: FlatRating[] = [];
  orders.forEach((o) => {
    if (o.ratings && Array.isArray(o.ratings)) {
      o.ratings.forEach((rating: { score: number; comment: string | null; createdAt: string; client: { user: { firstName: string; lastName: string } } }) => {
        ratings.push({
          score: rating.score,
          comment: rating.comment,
          date: rating.createdAt,
          clientName: rating.client?.user ? `${rating.client.user.firstName} ${rating.client.user.lastName}` : 'Client',
        });
      });
    }
  });

  const avgRating = driver.rating;
  const totalRatings = driver.totalRatings;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Mes notes</h2>

      {/* Average Rating Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="p-6 flex flex-col items-center">
          <p className="text-5xl font-bold text-amber-600">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
          <div className="flex gap-1 my-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`size-6 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{totalRatings} évaluation{totalRatings > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Évaluations récentes</h3>
      {ratings.length === 0 ? (
        <div className="text-center py-8">
          <Star className="size-12 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground">Aucune évaluation pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{r.clientName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`size-3 ${i <= r.score ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-muted-foreground italic">&ldquo;{r.comment}&rdquo;</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-2">
        <Button variant="outline" className="w-full" onClick={() => useDriverNav.getState().navigate('earnings')}>
          <ChevronLeft className="size-4 mr-2" />
          Retour aux gains
        </Button>
      </div>
    </div>
  );
}

// ─── Wallet View (Standalone) ────────────────────────────────────────────────

function WalletView() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<WalletData>('/api/wallet').then(({ data }) => {
      if (data) setWallet(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Portefeuille</h2>

      <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <CardContent className="p-6">
          <p className="text-sm opacity-80">Solde disponible</p>
          <p className="text-4xl font-bold mt-1">{formatPrice(wallet?.balance || 0)}</p>
        </CardContent>
      </Card>

      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Historique des transactions</h3>
      {(!wallet?.transactions || wallet.transactions.length === 0) ? (
        <div className="text-center py-8">
          <CreditCard className="size-12 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground">Aucune transaction</p>
        </div>
      ) : (
        <div className="space-y-2">
          {wallet.transactions.map(tx => (
            <Card key={tx.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications View ──────────────────────────────────────────────────────

function NotificationsView({ onBack }: { onBack?: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<{ notifications: Notification[]; total: number }>('/api/notifications?limit=50');
      if (!cancelled) {
        if (data) { setNotifications(data.notifications); setTotal(data.total); }
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const markRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await apiFetch('/api/notifications', { method: 'PUT' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const typeIcon: Record<string, React.ElementType> = {
    ORDER: Package,
    DELIVERY: Navigation,
    PAYMENT: CreditCard,
    INFO: Bell,
    SYSTEM: AlertCircle,
    PROMO: Zap,
    SUPPORT: MessageSquare,
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Notifications</h2>
        {notifications.some(n => !n.isRead) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="size-12 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = typeIcon[n.type] || Bell;
            return (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors ${!n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200' : ''}`}
                onClick={() => { if (!n.isRead) markRead(n.id); }}
              >
                <CardContent className="p-3 flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    !n.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Support View ─────────────────────────────────────────────────────────────

function SupportView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data } = await apiFetch<SupportTicket[]>('/api/support');
    if (data) setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<SupportTicket[]>('/api/support');
      if (!cancelled) { if (data) setTickets(data); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const { error: err } = await apiFetch('/api/support', {
      method: 'POST',
      body: JSON.stringify({ subject, description }),
    });
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setSubject('');
      setDescription('');
      setShowForm(false);
      fetchTickets();
    }
    setSubmitting(false);
  };

  const statusLabel: Record<string, string> = {
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé',
  };
  const statusColor: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Support</h2>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}>
          <Plus className="size-4 mr-1" />
          Nouveau ticket
        </Button>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau ticket de support</DialogTitle>
            <DialogDescription>Décrivez votre problème et nous vous répondrons rapidement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Sujet</Label>
              <Input id="subject" placeholder="Sujet de votre demande" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Décrivez votre problème en détail..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-emerald-600">Ticket envoyé avec succès !</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit} disabled={submitting || !subject.trim() || !description.trim()}>
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="size-12 mx-auto text-gray-300 mb-3" />
          <p className="text-muted-foreground">Aucun ticket de support</p>
          <p className="text-xs text-muted-foreground mt-1">Créez un ticket si vous avez besoin d&apos;aide</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <Card key={ticket.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ticket.description}</p>
                  </div>
                  <Badge className={statusColor[ticket.status] || 'bg-gray-100'}>
                    {statusLabel[ticket.status] || ticket.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile View ────────────────────────────────────────────────────────────

function ProfileView({ driver, onRefresh }: { driver: DriverProfile; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleType: driver.vehicleType,
    vehiclePlate: driver.vehiclePlate || '',
    vehicleBrand: driver.vehicleBrand || '',
    vehicleColor: driver.vehicleColor || '',
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error: err } = await apiFetch('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setEditing(false);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  const vehicleTypeLabel: Record<string, string> = {
    MOTO: 'Moto',
    VELO: 'Vélo',
    VOITURE: 'Voiture',
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Mon profil</h2>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            {driver.user.avatar ? (
              <img src={driver.user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <User className="size-10 text-emerald-600" />
            )}
          </div>
          <h3 className="font-bold text-lg">{driver.user.firstName} {driver.user.lastName}</h3>
          <p className="text-sm text-muted-foreground">{driver.user.phone}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{driver.rating > 0 ? driver.rating.toFixed(1) : 'Nouveau'}</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{driver.totalDeliveries} livraisons</span>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Informations du véhicule</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Type de véhicule</Label>
                <div className="flex gap-2 mt-1">
                  {['MOTO', 'VELO', 'VOITURE'].map(type => (
                    <Button
                      key={type}
                      variant={form.vehicleType === type ? 'default' : 'outline'}
                      size="sm"
                      className={form.vehicleType === type ? 'bg-emerald-600' : ''}
                      onClick={() => setForm(prev => ({ ...prev, vehicleType: type }))}
                    >
                      {vehicleTypeLabel[type]}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="plate">Immatriculation</Label>
                <Input id="plate" value={form.vehiclePlate} onChange={e => setForm(prev => ({ ...prev, vehiclePlate: e.target.value }))} placeholder="Ex: AK-1234-BC" />
              </div>
              <div>
                <Label htmlFor="brand">Marque</Label>
                <Input id="brand" value={form.vehicleBrand} onChange={e => setForm(prev => ({ ...prev, vehicleBrand: e.target.value }))} placeholder="Ex: Yamaha, Honda..." />
              </div>
              <div>
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" value={form.vehicleColor} onChange={e => setForm(prev => ({ ...prev, vehicleColor: e.target.value }))} placeholder="Ex: Rouge, Noir..." />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-emerald-600">Profil mis à jour !</p>}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <ProfileRow label="Type" value={vehicleTypeLabel[driver.vehicleType] || driver.vehicleType} />
              {driver.vehiclePlate && <ProfileRow label="Immatriculation" value={driver.vehiclePlate} />}
              {driver.vehicleBrand && <ProfileRow label="Marque" value={driver.vehicleBrand} />}
              {driver.vehicleColor && <ProfileRow label="Couleur" value={driver.vehicleColor} />}
              {!driver.vehiclePlate && !driver.vehicleBrand && !driver.vehicleColor && (
                <p className="text-sm text-muted-foreground text-center py-2">Aucune information véhicule renseignée</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-0">
          <QuickLink icon={FileText} label="Mes documents" onClick={() => useDriverNav.getState().navigate('documents')} />
          <Separator />
          <QuickLink icon={Star} label="Mes notes" onClick={() => useDriverNav.getState().navigate('ratings')} />
          <Separator />
          <QuickLink icon={CreditCard} label="Portefeuille" onClick={() => useDriverNav.getState().navigate('wallet')} />
          <Separator />
          <QuickLink icon={MessageSquare} label="Support" onClick={() => useDriverNav.getState().navigate('support')} />
          <Separator />
          <QuickLink icon={Bell} label="Notifications" onClick={() => useDriverNav.getState().navigate('notifications')} />
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => useAuthStore.getState().logout()}
      >
        <LogOut className="size-4 mr-2" />
        Se déconnecter
      </Button>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

// ─── Documents View ───────────────────────────────────────────────────────────

function DocumentsView({ driver, onRefresh }: { driver: DriverProfile; onRefresh: () => void }) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const docs = [
    { key: 'idCardImage', label: "Pièce d'identité", field: 'idCardImage', value: driver.idCardImage },
    { key: 'licenseImage', label: 'Permis de conduire', field: 'licenseImage', value: driver.licenseImage },
    { key: 'vehicleImage', label: 'Photo du véhicule', field: 'vehicleImage', value: driver.vehicleImage },
    { key: 'selfieImage', label: 'Selfie', field: 'selfieImage', value: driver.selfieImage },
  ];

  const handleUpload = async (field: string, file: File) => {
    setUploading(field);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Erreur d\'upload' }));
      setError(errData.error || 'Erreur d\'upload');
      setUploading(null);
      return;
    }

    const uploadData = await res.json();
    const url = uploadData.url;

    // Save to driver profile
    const { error: saveErr } = await apiFetch('/api/drivers', {
      method: 'POST',
      body: JSON.stringify({ [field]: url }),
    });

    if (saveErr) {
      setError(saveErr);
    } else {
      setSuccess(field);
      onRefresh();
      setTimeout(() => setSuccess(null), 3000);
    }
    setUploading(null);
  };

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => useDriverNav.getState().goBack()}>
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-bold">Mes documents</h2>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Vérification requise</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
              Vos documents doivent être vérifiés par un administrateur avant que vous puissiez commencer à livrer.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {docs.map(doc => (
          <Card key={doc.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    doc.value ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {doc.value ? (
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    ) : (
                      <XCircle className="size-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {doc.value ? 'Document envoyé' : 'Document manquant'}
                    </p>
                  </div>
                </div>
                <Badge variant={doc.value ? 'default' : 'destructive'} className={doc.value ? 'bg-emerald-100 text-emerald-700' : ''}>
                  {doc.value ? 'Envoyé' : 'Manquant'}
                </Badge>
              </div>

              {doc.value && (
                <div className="mb-3 rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                  <img
                    src={doc.value}
                    alt={doc.label}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <input
                type="file"
                ref={el => { fileInputRefs.current[doc.key] = el; }}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(doc.field, file);
                  e.target.value = '';
                }}
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRefs.current[doc.key]?.click()}
                disabled={uploading === doc.field}
              >
                {uploading === doc.field ? (
                  <><Loader2 className="size-4 animate-spin mr-2" /> Envoi en cours...</>
                ) : success === doc.field ? (
                  <><Check className="size-4 mr-2 text-emerald-600" /> Mis à jour !</>
                ) : doc.value ? (
                  <><RefreshCw className="size-4 mr-2" /> Remplacer</>
                ) : (
                  <><Upload className="size-4 mr-2" /> Téléverser</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Navigation Placeholder ──────────────────────────────────────────────────

function NavigationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <Navigation className="size-8 text-emerald-600" />
      </div>
      <h3 className="font-semibold">Navigation</h3>
      <p className="text-sm text-muted-foreground text-center">La navigation en temps réel sera bientôt disponible.</p>
    </div>
  );
}

// ─── Chat Placeholder ─────────────────────────────────────────────────────────

function ChatPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <MessageSquare className="size-8 text-emerald-600" />
      </div>
      <h3 className="font-semibold">Chat</h3>
      <p className="text-sm text-muted-foreground text-center">La messagerie sera bientôt disponible.</p>
    </div>
  );
}