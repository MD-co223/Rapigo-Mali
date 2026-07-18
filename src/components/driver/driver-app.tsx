'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Navigation, TrendingUp, History, User,
  Bell, Phone, MapPin, Star, ChevronLeft,
  LogOut, Upload, Loader2, Send,
  Clock, Package, Store, CheckCircle2, Wallet, Shield, X, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useDriverNav, useAuthStore, useSpaceStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type DriverView
} from '@/lib/store';
import { toast } from 'sonner';
import { SupportContact } from '@/components/support-contact';
import { RapigoLogo } from '@/components/rapigo-logo';

import { Skeleton } from '@/components/ui/skeleton';

interface DriverData {
  id: string; userId: string; vehicleType: string;
  vehiclePlate: string | null; vehicleBrand: string | null; vehicleColor: string | null;
  idCardImage: string | null; licenseImage: string | null;
  vehicleImage: string | null; selfieImage: string | null;
  isApproved: boolean; isAvailable: boolean;
  isOnline: boolean;
  rating: number | null; totalDeliveries: number; totalEarnings: number;
  user: { id: string; email: string; phone: string; firstName: string; lastName: string };
}

const NAV: { view: DriverView; label: string; icon: typeof Home }[] = [
  { view: 'home', label: 'Accueil', icon: Home },
  { view: 'ride', label: 'Courses', icon: Navigation },
  { view: 'earnings', label: 'Gains', icon: TrendingUp },
  { view: 'history', label: 'Historique', icon: History },
  { view: 'profile', label: 'Profil', icon: User },
];

const DOCS: { key: 'idCardImage' | 'licenseImage' | 'vehicleImage' | 'selfieImage'; label: string; hint: string }[] = [
  { key: 'idCardImage', label: "Carte d'identité", hint: 'Photo recto de votre carte d\'identité ou passeport' },
  { key: 'licenseImage', label: 'Permis de conduire', hint: 'Photo recto de votre permis de conduire valide' },
  { key: 'vehicleImage', label: 'Photo véhicule', hint: 'Photo de votre véhicule montrant la plaque d\'immatriculation' },
  { key: 'selfieImage', label: 'Selfie', hint: 'Selfie avec votre véhicule en arrière-plan' },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Empty({ icon: Icon, label, description }: { icon: React.ElementType; label: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-base font-medium text-muted-foreground mb-1">{label}</p>
      {description && <p className="text-sm text-muted-foreground/70 max-w-xs">{description}</p>}
    </div>
  );
}

function SkList({ count = 3 }: { count?: number }) {
  return <div className="space-y-3 p-0 animate-in fade-in duration-300">{Array.from({ length: count }).map((_, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card"><Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></div><Skeleton className="h-6 w-20 rounded-full flex-shrink-0" /></div>))}</div>;
}

export default function DriverApp() {
  const { view, navigate } = useDriverNav();
  const { user, logout, updateUser } = useAuthStore();
  const { setSpace } = useSpaceStore();

  const [driver, setDriver] = useState<DriverData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState('');
  const [availOrders, setAvailOrders] = useState<Record<string, unknown>[]>([]);
  const [activeOrder, setActiveOrder] = useState<Record<string, unknown> | null>(null);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [walletData, setWalletData] = useState<Record<string, unknown> | null>(null);
  const [deliveredOrders, setDeliveredOrders] = useState<Record<string, unknown>[]>([]);
  const [notifs, setNotifs] = useState<Record<string, unknown>[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSending, setTicketSending] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [pForm, setPForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [pSaving, setPSaving] = useState(false);
  const [dialog, setDialog] = useState<{ type: string; data?: string } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocKey, setPendingDocKey] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DriverData>('/api/drivers/me').then(r => {
      if (r.data) { setDriver(r.data); setIsOnline(r.data.isOnline || r.data.isAvailable || false); }
      setLoading(false);
    });
    apiFetch<{ unreadCount: number }>('/api/notifications?unread=true&limit=1').then(r => {
      if (r.data) setUnread(r.data.unreadCount || 0);
    });
  }, []);

  // Toggle online/offline — syncs to backend (Bug 2 fix)
  const toggleOnline = async (value: boolean) => {
    setTogglingOnline(true);
    try {
      const r = await apiFetch<DriverData>('/api/drivers/me', {
        method: 'PUT',
        body: JSON.stringify({ isOnline: value }),
      });
      if (r.error) {
        toast.error(r.error);
        setTogglingOnline(false);
        return;
      }
      setIsOnline(value);
      if (r.data) setDriver(r.data);
      toast.success(value ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
    } catch {
      toast.error('Erreur de connexion');
    }
    setTogglingOnline(false);
  };

  // Dots animation — only when on home view
  useEffect(() => {
    if (view !== 'home' || !isOnline) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(t);
  }, [view, isOnline]);

  // Available orders polling — runs regardless of view (Bug 4 fix)
  useEffect(() => {
    if (!isOnline) return;
    apiFetch<Record<string, unknown>[]>('/api/drivers/available-orders').then(r => {
      if (r.data) setAvailOrders(Array.isArray(r.data) ? r.data : []);
    });
    const poll = setInterval(() => {
      apiFetch<Record<string, unknown>[]>('/api/drivers/available-orders').then(r => {
        if (r.data) setAvailOrders(Array.isArray(r.data) ? r.data : []);
      });
    }, 15000);
    return () => clearInterval(poll);
  }, [isOnline]);

  useEffect(() => {
    if (view !== 'ride') return;
    apiFetch<{ orders: Record<string, unknown>[] }>('/api/orders?limit=10').then(r => {
      if (r.data) {
        const active = (r.data.orders || []).find(o =>
          ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status as string));
        setActiveOrder(active || null);
      }
    });
  }, [view]);

  useEffect(() => {
    if (view !== 'history') return;
    // Bug 3 verified: /api/orders auto-filters by driverId for DRIVER role
    apiFetch<{ orders: Record<string, unknown>[] }>('/api/orders?limit=50').then(r => {
      if (r.data) setOrders(r.data.orders || []);
    });
  }, [view]);

  useEffect(() => {
    if (view !== 'earnings') return;
    apiFetch<{ orders: Record<string, unknown>[] }>('/api/orders?status=DELIVERED&limit=100').then(r => {
      if (r.data) setDeliveredOrders(r.data.orders || []);
    });
  }, [view]);

  useEffect(() => {
    if (view !== 'wallet') return;
    apiFetch<Record<string, unknown>>('/api/wallet').then(r => { if (r.data) setWalletData(r.data); });
  }, [view]);

  useEffect(() => {
    if (view !== 'notifications') return;
    apiFetch<{ notifications: Record<string, unknown>[]; unreadCount: number }>('/api/notifications?limit=30').then(r => {
      if (r.data) { setNotifs(r.data.notifications || []); setUnread(r.data.unreadCount || 0); }
    });
  }, [view]);

  // Bug 1 verified: /api/drivers/[id]/accept uses the URL param as orderId.
  // The driver app correctly passes the order ID. No fix needed.
  const acceptOrder = (orderId: string) => {
    apiFetch(`/api/drivers/${orderId}/accept`, { method: 'POST' }).then(r => {
      if (r.error) { toast.error(r.error); return; }
      toast.success('Course acceptée');
      setAvailOrders(prev => prev.filter(o => o.id !== orderId));
      navigate('ride');
    });
  };

  const updateStatus = (orderId: string, status: string) => {
    apiFetch(`/api/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ status }) }).then(r => {
      if (r.error) { toast.error(r.error); return; }
      toast.success(ORDER_STATUS_LABELS[status] || 'Mise à jour');
      if (status === 'DELIVERED') { navigate('home'); return; }
      apiFetch<{ orders: Record<string, unknown>[] }>('/api/orders?limit=10').then(nr => {
        if (nr.data) {
          const a = (nr.data.orders || []).find(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status as string));
          setActiveOrder(a || null);
        }
      });
    });
  };

  // Bug 5 verified: PUT /api/notifications marks all as read. URL is correct.
  const markRead = (id: string) => {
    apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }).then(() => {
      setNotifs(prev => prev.filter(n => n.id !== id));
      setUnread(prev => Math.max(0, prev - 1));
    });
  };

  const markAllRead = () => {
    apiFetch('/api/notifications', { method: 'PUT' }).then(() => {
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
      toast.success('Toutes les notifications marquées comme lues');
    });
  };

  const sendTicket = () => {
    if (!ticketSubject.trim() || !ticketDesc.trim()) { toast.error('Veuillez remplir tous les champs'); return; }
    setTicketSending(true);
    apiFetch('/api/support', { method: 'POST', body: JSON.stringify({ subject: ticketSubject, description: ticketDesc }) }).then(r => {
      setTicketSending(false);
      if (r.error) { toast.error(r.error); return; }
      toast.success('Ticket envoyé');
      setTicketSubject(''); setTicketDesc('');
    });
  };

  const saveProfile = () => {
    setPSaving(true);
    apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify(pForm) }).then(r => {
      setPSaving(false);
      if (r.error) { toast.error(r.error); return; }
      toast.success('Profil mis à jour');
      if (r.data && user) updateUser({ firstName: pForm.firstName || user.firstName, lastName: pForm.lastName || user.lastName, phone: pForm.phone || user.phone });
      setEditProfile(false);
    });
  };

  const handleLogout = () => { logout(); setSpace('landing'); };

  // Bug 6: Document upload via base64 → PUT /api/drivers/me
  const handleDocUploadClick = (docKey: string) => {
    setPendingDocKey(docKey);
    setDialog({ type: 'document', data: docKey });
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocKey) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, etc.)');
      resetFileInput();
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5 Mo');
      resetFileInput();
      return;
    }

    setUploadingDoc(pendingDocKey);
    try {
      const base64 = await fileToBase64(file);
      const r = await apiFetch<DriverData>('/api/drivers/me', {
        method: 'PUT',
        body: JSON.stringify({ [pendingDocKey]: base64 }),
      });
      if (r.error) { toast.error(r.error); return; }
      if (r.data) setDriver(r.data);
      toast.success('Document téléchargé avec succès');
      setDialog(null);
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
    setUploadingDoc(null);
    resetFileInput();
  };

  const resetFileInput = () => {
    setPendingDocKey(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getEarnings = (period: string) => {
    const now = new Date();
    return deliveredOrders.filter(o => {
      const d = new Date((o.deliveredAt as string) || (o.createdAt as string));
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'week') return d >= new Date(now.getTime() - 7 * 86400000);
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    }).reduce((s, o) => s + (Number(o.deliveryFee) || 0), 0);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!driver) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 dark:text-gray-400">Profil non trouvé</p></div>;

  if (!driver.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] as const }} className="text-center space-y-5 max-w-sm">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <Shield className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Compte en attente de validation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Votre profil livreur est en cours de vérification par notre équipe. Vous recevrez une notification une fois approuvé.</p>
          <SupportContact variant="compact" />
          <Button variant="outline" onClick={() => { logout(); }} className="mt-2">
            <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
          </Button>
        </motion.div>
      </div>
    );
  }

  const ao = activeOrder as Record<string, any> | null;
  const orderItems = (ao?.items || []) as Record<string, any>[];

  // Find the pending document info for the dialog
  const pendingDoc = DOCS.find(d => d.key === pendingDocKey);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 max-w-lg mx-auto">
      {/* Hidden file input for document upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white px-4 py-3 flex items-center gap-3">
        <RapigoLogo variant="icon" height={28} />
        <div className="flex-1" />
        <button onClick={() => navigate('notifications')} className="relative p-1">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </button>
        <Switch checked={isOnline} onCheckedChange={toggleOnline} disabled={togglingOnline} />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] as const }}>

            {/* HOME */}
            {view === 'home' && (
              <div className="p-4 space-y-4">
                <Card className="bg-emerald-600 text-white shadow-sm"><CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-emerald-100 text-xs">{togglingOnline ? 'Mise à jour...' : isOnline ? 'Vous êtes en ligne' : 'Vous êtes hors ligne'}</p>
                  <p className="font-bold text-lg">{driver.user.firstName} {driver.user.lastName}</p></div>
                  <Switch checked={isOnline} onCheckedChange={toggleOnline} disabled={togglingOnline} />
                </CardContent></Card>

                {isOnline ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 text-emerald-600 font-medium text-sm">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        En attente de commandes{dots}
                      </div>
                    </div>
                    {availOrders.map(o => {
                      const ord = o as Record<string, any>;
                      const items = (ord.items || []) as Record<string, any>[];
                      const merchant = ord.merchant as Record<string, any> | undefined;
                      return (
                        <Card key={ord.id} className="shadow-sm"><CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2"><Store className="h-4 w-4 text-emerald-600" /><span className="font-medium text-sm">{merchant?.businessName || 'Commerçant'}</span></div>
                          <div className="flex items-start gap-2 text-sm text-gray-500"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span className="line-clamp-2">{ord.deliveryAddress}</span></div>
                          <div className="flex justify-between text-sm"><span>{items.length} article(s)</span><span className="font-semibold">{formatPrice(Number(ord.total) || 0)}</span></div>
                          <p className="text-xs text-emerald-600 font-medium">+ {formatPrice(Number(ord.deliveryFee) || 0)} frais de livraison</p>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-transform" onClick={() => acceptOrder(ord.id)}>Accepter la course</Button>
                        </CardContent></Card>
                      );
                    })}
                    {availOrders.length === 0 && <Empty icon={Package} label="Aucune commande disponible" description="Revenez plus tard ou vérifiez votre connexion." />}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Livraisons', value: driver.totalDeliveries, icon: Package },
                      { label: 'Gains totaux', value: formatPrice(driver.totalEarnings), icon: Wallet },
                      { label: 'Note', value: driver.rating ? `${driver.rating.toFixed(1)}/5` : '—', icon: Star },
                    ].map(s => (
                      <Card key={s.label} className="shadow-sm"><CardContent className="p-3 text-center">
                        <s.icon className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                        <p className="font-bold text-sm">{s.value}</p>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                      </CardContent></Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RIDE */}
            {view === 'ride' && (
              <div className="p-4 space-y-4">
                {!ao ? (
                  <div className="text-center py-16 space-y-4">
                    <Empty icon={Navigation} label="Aucune course en cours" description="Passez en ligne pour recevoir des courses." />
                    <Button variant="outline" onClick={() => navigate('home')}>Retour à l&apos;accueil</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className={`w-3 h-3 rounded-full ${['PICKED_UP', 'IN_TRANSIT'].includes(ao.status) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div className="w-0.5 h-10 bg-gray-200" />
                        <div className={`w-3 h-3 rounded-full ${ao.status === 'IN_TRANSIT' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div><p className="text-[10px] text-gray-400 uppercase">Retrait</p><p className="font-medium text-sm">{(ao.merchant as any)?.businessName}</p><p className="text-xs text-gray-400">{(ao.merchant as any)?.address}</p></div>
                        <div><p className="text-[10px] text-gray-400 uppercase">Livraison</p><p className="font-medium text-sm">{ao.deliveryAddress}</p></div>
                      </div>
                    </div>
                    <Card className="shadow-sm"><CardContent className="p-4 flex items-center justify-between">
                      <div><p className="text-sm font-medium">{(ao.client as any)?.user?.firstName} {(ao.client as any)?.user?.lastName}</p><p className="text-xs text-gray-400">{ao.orderNumber}</p></div>
                      {(ao.client as any)?.user?.phone && <a href={`tel:${(ao.client as any).user.phone}`} className="p-2 rounded-full bg-emerald-50 text-emerald-600"><Phone className="h-5 w-5" /></a>}
                    </CardContent></Card>
                    <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Détails de la commande</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {orderItems.map((it: any) => <div key={it.id} className="flex justify-between text-sm"><span>{it.quantity}x {it.productName}</span><span>{formatPrice(it.totalPrice)}</span></div>)}
                      <div className="border-t pt-2 flex justify-between font-semibold text-sm"><span>Total</span><span>{formatPrice(Number(ao.total) || 0)}</span></div>
                      <p className="text-xs text-emerald-600">+ {formatPrice(Number(ao.deliveryFee) || 0)} frais de livraison</p>
                    </CardContent></Card>
                    <div className="space-y-2">
                      {ao.status === 'ASSIGNED' && <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(ao.id, 'PICKED_UP')}>Récupérer la commande</Button>}
                      {ao.status === 'PICKED_UP' && <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(ao.id, 'IN_TRANSIT')}>Démarrer la livraison</Button>}
                      {ao.status === 'IN_TRANSIT' && <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(ao.id, 'DELIVERED')}>Livraison effectuée</Button>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* HISTORY */}
            {view === 'history' && (
              <div className="p-4 space-y-3">
                <h2 className="font-bold text-lg">Historique des livraisons</h2>
                {orders.map(o => {
                  const ord = o as Record<string, any>;
                  const merchant = ord.merchant as Record<string, any> | undefined;
                  const client = ord.client as Record<string, any> | undefined;
                  return (
                    <Card key={ord.id} className="shadow-sm cursor-pointer" onClick={() => { navigate('ride'); }}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-gray-400">{ord.orderNumber}</span>
                          <Badge className={ORDER_STATUS_COLORS[ord.status as string] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}>{ORDER_STATUS_LABELS[ord.status as string] || ord.status}</Badge>
                        </div>
                        <p className="text-sm font-medium">{merchant?.businessName || '—'}</p>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span><Clock className="h-3 w-3 inline mr-1" />{new Date(ord.createdAt).toLocaleDateString('fr-FR')}</span>
                          <span>+ {formatPrice(Number(ord.deliveryFee) || 0)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {orders.length === 0 && <Empty icon={ClipboardList} label="Aucune livraison effectuée" description="Vos livraisons passées apparaîtront ici." />}
              </div>
            )}

            {/* EARNINGS */}
            {view === 'earnings' && (
              <div className="p-4 space-y-4">
                <Tabs defaultValue="today" onValueChange={v => {}}>
                  <TabsList className="w-full"><TabsTrigger value="today" className="flex-1">Aujourd&apos;hui</TabsTrigger><TabsTrigger value="week" className="flex-1">Semaine</TabsTrigger><TabsTrigger value="month" className="flex-1">Mois</TabsTrigger></TabsList>
                  {['today', 'week', 'month'].map(p => (
                    <TabsContent key={p} value={p}>
                      <Card className="bg-emerald-600 text-white shadow-sm"><CardContent className="p-5 text-center space-y-1">
                        <p className="text-emerald-200 text-xs">Gains en {p === 'today' ? 'aujourd\'hui' : p === 'week' ? 'cette semaine' : 'ce mois'}</p>
                        <p className="text-3xl font-bold">{formatPrice(getEarnings(p))}</p>
                      </CardContent></Card>
                    </TabsContent>
                  ))}
                </Tabs>
                <h3 className="font-semibold text-sm">Dernières livraisons</h3>
                {deliveredOrders.slice(0, 15).map(o => {
                  const ord = o as Record<string, any>;
                  return (
                    <Card key={ord.id} className="shadow-sm"><CardContent className="p-3 flex items-center justify-between">
                      <div><p className="text-sm font-medium">{ord.orderNumber}</p><p className="text-xs text-gray-400">{new Date(ord.deliveredAt || ord.createdAt).toLocaleDateString('fr-FR')}</p></div>
                      <span className="text-sm font-semibold text-emerald-600">+ {formatPrice(Number(ord.deliveryFee) || 0)}</span>
                    </CardContent></Card>
                  );
                })}
                {deliveredOrders.length === 0 && <Empty icon={TrendingUp} label="Aucun gain enregistré" description="Vos gains apparaîtront ici une fois vos premières livraisons effectuées." />}
              </div>
            )}

            {/* RATINGS */}
            {view === 'ratings' && (
              <div className="p-4 space-y-4">
                <div className="text-center space-y-2 py-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50">
                    <Star className="h-10 w-10 text-emerald-500 fill-emerald-500" />
                  </div>
                  <p className="text-4xl font-bold">{driver.rating ? driver.rating.toFixed(1) : '—'}</p>
                  <p className="text-sm text-gray-400">Note moyenne</p>
                </div>
                <Card className="shadow-sm"><CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Répartition</h3>
                  {[5, 4, 3, 2, 1].map(n => (
                    <div key={n} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{n}</span><Star className="h-3 w-3 text-amber-400 fill-amber-400 drop-shadow-sm" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: n === 5 ? '70%' : n === 4 ? '20%' : n === 3 ? '7%' : n === 2 ? '2%' : '1%' }} /></div>
                    </div>
                  ))}
                </CardContent></Card>
              </div>
            )}

            {/* WALLET */}
            {view === 'wallet' && (
              <div className="p-4 space-y-4">
                <Card className="bg-emerald-600 text-white shadow-sm"><CardContent className="p-5 text-center space-y-1">
                  <p className="text-emerald-200 text-xs">Solde disponible</p>
                  <p className="text-3xl font-bold">{formatPrice(Number(walletData?.balance) || 0)}</p>
                  <Button variant="outline" className="mt-3 border-white/30 text-white hover:bg-white/10" onClick={() => setDialog({ type: 'withdraw' })}>Retirer</Button>
                </CardContent></Card>
                <h3 className="font-semibold text-sm">Transactions récentes</h3>
                {((walletData?.transactions || []) as Record<string, any>[]).map(t => (
                  <Card key={t.id} className="shadow-sm"><CardContent className="p-3 flex items-center justify-between">
                    <div><p className="text-sm">{t.description || t.type}</p><p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p></div>
                    <span className={`text-sm font-semibold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'CREDIT' ? '+' : '-'}{formatPrice(Math.abs(Number(t.amount)))}</span>
                  </CardContent></Card>
                ))}
              </div>
            )}

            {/* SUPPORT */}
            {view === 'support' && (
              <div className="p-4 space-y-4">
                <h2 className="font-bold text-lg">Support</h2>
                <SupportContact />
                <Card className="shadow-sm mt-4"><CardHeader><CardTitle className="text-sm">Créer un ticket</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-xs">Sujet</Label><Input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Sujet de votre demande" /></div>
                  <div><Label className="text-xs">Description</Label><Textarea value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} placeholder="Décrivez votre problème..." rows={4} /></div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={sendTicket} disabled={ticketSending}>{ticketSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Envoyer</Button>
                </CardContent></Card>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {view === 'notifications' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">Notifications</h2>
                  {notifs.length > 0 && <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>Tout marquer comme lu</Button>}
                </div>
                {notifs.map(n => {
                  const notif = n as Record<string, any>;
                  return (
                    <Card key={notif.id} className={`shadow-sm cursor-pointer ${!notif.isRead ? 'bg-emerald-50/50' : ''}`} onClick={() => markRead(notif.id)}>
                      <CardContent className="p-3 flex gap-3 items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.isRead ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium">{notif.title}</p><p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p><p className="text-[10px] text-gray-300 mt-1">{new Date(notif.createdAt).toLocaleDateString('fr-FR')}</p></div>
                      </CardContent>
                    </Card>
                  );
                })}
                {notifs.length === 0 && <Empty icon={Bell} label="Aucune notification" description="Vous n'avez pas encore de notifications." />}
              </div>
            )}

            {/* PROFILE */}
            {view === 'profile' && (
              <div className="p-4 space-y-4">
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"><User className="h-10 w-10 text-emerald-600" /></div>
                  <h2 className="font-bold text-lg">{driver.user.firstName} {driver.user.lastName}</h2>
                  <p className="text-sm text-gray-400">{driver.user.phone}</p>
                </div>
                <Card className="shadow-sm"><CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Véhicule</span><span className="text-sm font-medium">{driver.vehicleType}{driver.vehiclePlate ? ` • ${driver.vehiclePlate}` : ''}</span></div>
                  {driver.vehicleBrand && <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Marque</span><span className="text-sm font-medium">{driver.vehicleBrand}{driver.vehicleColor ? ` • ${driver.vehicleColor}` : ''}</span></div>}
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Livraisons</span><span className="text-sm font-medium">{driver.totalDeliveries}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Note</span><span className="text-sm font-medium flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{driver.rating ? driver.rating.toFixed(1) : '—'}</span></div>
                </CardContent></Card>

                <Card className="shadow-sm"><CardContent className="p-2">
                  {[
                    { label: 'Portefeuille', icon: Wallet, view: 'wallet' as DriverView },
                    { label: 'Notes et avis', icon: Star, view: 'ratings' as DriverView },
                    { label: 'Documents', icon: Upload, view: 'documents' as DriverView },
                    { label: 'Support', icon: Send, view: 'support' as DriverView },
                  ].map(l => (
                    <button key={l.view} onClick={() => navigate(l.view)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                      <l.icon className="h-4 w-4 text-gray-400" /><span className="text-sm flex-1">{l.label}</span><ChevronLeft className="h-4 w-4 text-gray-300 rotate-180" />
                    </button>
                  ))}
                </CardContent></Card>

                <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Modifier le profil</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {editProfile ? (
                    <>
                      <div><Label className="text-xs">Prénom</Label><Input value={pForm.firstName} onChange={e => setPForm({ ...pForm, firstName: e.target.value })} /></div>
                      <div><Label className="text-xs">Nom</Label><Input value={pForm.lastName} onChange={e => setPForm({ ...pForm, lastName: e.target.value })} /></div>
                      <div><Label className="text-xs">Téléphone</Label><Input value={pForm.phone} onChange={e => setPForm({ ...pForm, phone: e.target.value })} /></div>
                      <div className="flex gap-2"><Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={saveProfile} disabled={pSaving}>{pSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button><Button variant="outline" onClick={() => setEditProfile(false)}>Annuler</Button></div>
                    </>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => { setPForm({ firstName: driver.user.firstName, lastName: driver.user.lastName, phone: driver.user.phone }); setEditProfile(true); }}>Modifier</Button>
                  )}
                </CardContent></Card>

                <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Déconnexion</Button>
              </div>
            )}

            {/* DOCUMENTS (Bug 6: Real upload UI) */}
            {view === 'documents' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3"><button onClick={() => navigate('profile')} className="p-1"><ChevronLeft className="h-5 w-5" /></button><h2 className="font-bold text-lg">Documents</h2></div>
                <p className="text-xs text-gray-400">Veuillez fournir les documents requis pour valider votre profil livreur. Formats acceptés : JPG, PNG. Taille maximale : 5 Mo.</p>
                {DOCS.map(doc => {
                  const uploaded = !!driver[doc.key];
                  const isUploading = uploadingDoc === doc.key;
                  return (
                    <Card key={doc.key} className="shadow-sm"><CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${uploaded ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            {isUploading ? <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" /> : uploaded ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Upload className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.label}</p>
                            <p className={`text-xs ${uploaded ? 'text-emerald-600' : 'text-amber-500'}`}>{isUploading ? 'Téléchargement...' : uploaded ? 'Fourni' : 'Non fourni'}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUploading}
                          onClick={() => handleDocUploadClick(doc.key)}
                        >
                          {uploaded ? 'Remplacer' : 'Télécharger'}
                        </Button>
                      </div>
                      <p className="text-[11px] text-gray-400 pl-[52px]">{doc.hint}</p>
                    </CardContent></Card>
                  );
                })}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-lg mx-auto flex">
          {NAV.map(n => {
            const active = view === n.view || (n.view === 'ride' && view === 'navigation');
            return (
              <button key={n.view} onClick={() => navigate(n.view)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                <n.icon className="h-5 w-5" /><span className="text-[10px]">{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === 'withdraw'
                ? 'Retrait de fonds'
                : dialog?.type === 'document' && pendingDoc
                  ? `Télécharger : ${pendingDoc.label}`
                  : 'Envoi de document'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.type === 'withdraw'
                ? 'Contactez le support pour effectuer un retrait de votre solde.'
                : dialog?.type === 'document' && pendingDoc
                  ? pendingDoc.hint
                  : 'Veuillez contacter notre support.'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
          {dialog?.type === 'document' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {uploadingDoc ? 'Téléchargement en cours...' : 'Sélectionnez une image à télécharger'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG — max 5 Mo</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!uploadingDoc}
                >
                  {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploadingDoc ? 'Envoi en cours...' : 'Choisir un fichier'}
                </Button>
                <Button variant="outline" onClick={() => { setDialog(null); resetFileInput(); }}>Annuler</Button>
              </div>
            </div>
          ) : (
            <>
              <SupportContact variant="compact" />
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => { setDialog(null); navigate('support'); }}>Contacter le support</Button>
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}