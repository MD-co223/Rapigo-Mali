'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, Store, Truck, ShoppingCart, Grid3X3,
  Package, Tag, Settings, FileText, Headphones, User, LogOut,
  Menu, Search, Plus, Ban, CheckCircle, X, Eye, Pencil, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportContact } from '@/components/support-contact';
import {
  useAdminNav, useAuthStore, useSpaceStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, BUSINESS_TYPES,
  PAYMENT_METHODS, PAYMENT_STATUS_LABELS
} from '@/lib/store';
import type { AdminView } from '@/lib/store';

const tr = { duration: 0.3, ease: [0, 0, 0.2, 1] as const };
const SA = 'diarramoussaka7@gmail.com';

const NAV: { v: AdminView; l: string; i: React.ElementType }[] = [
  { v: 'dashboard', l: 'Tableau de bord', i: LayoutDashboard },
  { v: 'users', l: 'Utilisateurs', i: Users },
  { v: 'merchants', l: 'Commerçants', i: Store },
  { v: 'drivers', l: 'Livreurs', i: Truck },
  { v: 'orders', l: 'Commandes', i: ShoppingCart },
  { v: 'categories', l: 'Catégories', i: Grid3X3 },
  { v: 'products', l: 'Produits', i: Package },
  { v: 'coupons', l: 'Coupons', i: Tag },
  { v: 'settings', l: 'Paramètres', i: Settings },
  { v: 'audit-logs', l: "Journaux d'audit", i: FileText },
  { v: 'support', l: 'Support', i: Headphones },
  { v: 'profile', l: 'Mon profil', i: User },
];

const BN = NAV.slice(0, 7);

function Sp() {
  return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>;
}
function Em({ m }: { m: string }) {
  return <p className="text-center py-16 text-muted-foreground">{m}</p>;
}
function Sb({ s, cls }: { s: string; cls?: string }) {
  return <Badge variant="secondary" className={cls ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}>{ORDER_STATUS_LABELS[s] ?? PAYMENT_STATUS_LABELS[s] ?? s}</Badge>;
}

/* ── Sidebar ── */
function Sidebar() {
  const { view, navigate } = useAdminNav();
  const { user, logout } = useAuthStore();
  const setSpace = useSpaceStore(s => s.setSpace);
  return (
    <aside className="hidden lg:flex w-64 flex-col bg-gray-900 dark:bg-gray-950 text-white shrink-0">
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <img src="/logo.svg" alt="Rapigo" className="h-9 w-9" />
        <div><h1 className="text-lg font-bold">Rapigo</h1><p className="text-xs text-gray-400">Administration</p></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-3" role="navigation" aria-label="Navigation admin">
        {NAV.map(n => {
          const Icon = n.i;
          const active = view === n.v;
          return (
            <button key={n.v} onClick={() => navigate(n.v)} aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-emerald-600 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="h-5 w-5 shrink-0" />{n.l}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0"><p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p><p className="text-xs text-gray-400 truncate">{user?.email}</p></div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { logout(); setSpace('landing'); }} className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10 gap-2">
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </aside>
  );
}

/* ── Mobile menu (Sheet) ── */
function MobileMenu() {
  const { view, navigate } = useAdminNav();
  const { user, logout } = useAuthStore();
  const setSpace = useSpaceStore(s => s.setSpace);
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0"><Menu className="h-5 w-5" /></Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-gray-900 dark:bg-gray-950 text-white">
        <SheetHeader className="p-5 border-b border-white/10">
          <SheetTitle className="text-left flex items-center gap-3">
            <img src="/logo.svg" alt="Rapigo" className="h-8 w-8" />
            <div><p className="text-lg font-bold">Rapigo</p><p className="text-xs text-gray-400">Administration</p></div>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-3" role="navigation" aria-label="Menu mobile">
          {NAV.map(n => {
            const Icon = n.i;
            return (
              <button key={n.v} onClick={() => { navigate(n.v); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${view === n.v ? 'bg-emerald-600 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                <Icon className="h-5 w-5 shrink-0" />{n.l}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 space-y-2">
          <p className="text-sm truncate">{user?.firstName} {user?.lastName}</p>
          <Button variant="ghost" size="sm" onClick={() => { logout(); setSpace('landing'); setOpen(false); }} className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10 gap-2">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Bottom nav ── */
function BottomNav() {
  const { view, navigate } = useAdminNav();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-950 border-t" role="navigation" aria-label="Navigation rapide">
      <div className="flex overflow-x-auto no-scrollbar">
        {BN.map(n => {
          const Icon = n.i;
          const active = view === n.v;
          return (
            <button key={n.v} onClick={() => navigate(n.v)}
              className={`flex-1 min-w-[64px] flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${active ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <Icon className="h-5 w-5" /><span className="truncate px-1">{n.l}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ═══════════════ VIEWS ═══════════════ */

/* 1 ── Dashboard ── */
function DashboardView() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, o] = await Promise.all([
        apiFetch<Record<string, number>>('/api/stats'),
        apiFetch<any[]>('/api/orders?limit=10'),
      ]);
      if (s.data) setStats(typeof s.data === 'object' && !Array.isArray(s.data) ? s.data : {});
      if (o.data) setOrders(Array.isArray(o.data) ? o.data : (o.data as any).orders ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Sp />;

  const cards = [
    { l: 'Total Utilisateurs', v: (stats.users ?? stats.totalUsers ?? 0).toString(), i: Users, c: 'bg-emerald-600' },
    { l: 'Commerçants', v: (stats.merchants ?? stats.totalMerchants ?? 0).toString(), i: Store, c: 'bg-amber-600' },
    { l: 'Commandes', v: (stats.orders ?? stats.totalOrders ?? 0).toString(), i: ShoppingCart, c: 'bg-violet-600' },
    { l: 'Revenus', v: formatPrice(stats.revenue ?? stats.totalRevenue ?? 0), i: TrendingUp, c: 'bg-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tableau de bord</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const I = c.i;
          return (
            <Card key={c.l}><CardContent className="p-5 flex items-center gap-4">
              <div className={`${c.c} h-11 w-11 rounded-lg flex items-center justify-center shrink-0`}><I className="h-5 w-5 text-white" /></div>
              <div><p className="text-sm text-muted-foreground">{c.l}</p><p className="text-xl font-bold">{c.v}</p></div>
            </CardContent></Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Commandes récentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left p-3 font-medium">N°</th>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Montant</th>
                <th className="text-left p-3 font-medium">Statut</th>
              </tr></thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3 font-mono text-xs">{o.id?.slice(0, 8)}</td>
                    <td className="p-3">{o.user?.firstName} {o.user?.lastName}</td>
                    <td className="p-3">{formatPrice(o.totalAmount ?? o.total ?? 0)}</td>
                    <td className="p-3"><Sb s={o.status} cls={ORDER_STATUS_COLORS[o.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <Em m="Aucune commande récente" />}
        </CardContent>
      </Card>
    </div>
  );
}

/* 2 ── Users ── */
function UsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const q = new URLSearchParams();
    if (role !== 'all') q.set('role', role);
    const { data } = await apiFetch<any>(`/api/users?${q}`);
    const arr = Array.isArray(data) ? data : (data?.users && Array.isArray(data.users) ? data.users : []);
    setUsers(arr);
  };

  useEffect(() => {
    let active = true;
    const q = new URLSearchParams();
    if (role !== 'all') q.set('role', role);
    apiFetch<any>(`/api/users?${q}`).then(({ data }) => {
      const arr = Array.isArray(data) ? data : (data?.users && Array.isArray(data.users) ? data.users : []);
      if (active) { setUsers(arr); setLoading(false); }
    });
    return () => { active = false; };
  }, [role]);

  const filtered = users.filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.toLowerCase().includes(s);
  });

  const isSA = (u: any) => u.email === SA;

  const action = async (id: string, actionType: 'block' | 'suspend') => {
    const { error } = await apiFetch(`/api/users/${id}/${actionType}`, { method: 'POST' });
    if (error) return toast.error(error);
    toast.success(`Utilisateur ${actionType === 'block' ? 'bloqué' : 'suspendu'}`);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="text-2xl font-bold">Utilisateurs</h2>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="CLIENT">Clients</SelectItem>
              <SelectItem value="MERCHANT">Commerçants</SelectItem>
              <SelectItem value="DRIVER">Livreurs</SelectItem>
              <SelectItem value="SUPER_ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? <Sp /> : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
                <th className="text-left p-3 font-medium">Nom</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Téléphone</th>
                <th className="text-left p-3 font-medium">Rôle</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3 font-medium">
                      {u.firstName} {u.lastName}
                      {isSA(u) && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-400">⚠️ Super Admin protégé</Badge>}
                    </td>
                    <td className="p-3 hidden md:table-cell">{u.email}</td>
                    <td className="p-3 hidden lg:table-cell">{u.phone ?? '—'}</td>
                    <td className="p-3"><Badge variant="secondary">{u.role === 'SUPER_ADMIN' ? 'Admin' : u.role === 'MERCHANT' ? 'Commerçant' : u.role === 'DRIVER' ? 'Livreur' : 'Client'}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className={u.isBlocked ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : u.isSuspended ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}>{u.isBlocked ? 'Bloqué' : u.isSuspended ? 'Suspendu' : 'Actif'}</Badge></td>
                    <td className="p-3">
                      {!isSA(u) && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => action(u.id, 'block')} className="h-8 text-xs gap-1"><Ban className="h-3 w-3" />{u.isBlocked ? 'Débloquer' : 'Bloquer'}</Button>
                          <Button size="sm" variant="outline" onClick={() => action(u.id, 'suspend')} className="h-8 text-xs gap-1"><X className="h-3 w-3" />{u.isSuspended ? 'Réactiver' : 'Suspendre'}</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <Em m="Aucun utilisateur trouvé" />}
        </CardContent></Card>
      )}
    </div>
  );
}

/* 3 ── Merchants ── */
function MerchantsView() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<any>('/api/merchants?all=true');
      const arr = Array.isArray(data) ? data : (data?.merchants && Array.isArray(data.merchants) ? data.merchants : []);
      setMerchants(arr);
      setLoading(false);
    })();
  }, []);

  const approve = async (id: string) => {
    const { error } = await apiFetch(`/api/merchants/${id}/approve`, { method: 'POST' });
    if (error) return toast.error(error);
    toast.success('Commerçant approuvé');
    setMerchants(prev => prev.map((m: any) => m.id === id ? { ...m, isApproved: true } : m));
  };

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Commerçants</h2>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Nom</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Type</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Ville</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Note</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {merchants.map((m: any) => (
                <tr key={m.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 font-medium">{m.businessName ?? m.firstName + ' ' + m.lastName}</td>
                  <td className="p-3 hidden md:table-cell">{BUSINESS_TYPES[m.businessType] ?? m.businessType ?? '—'}</td>
                  <td className="p-3 hidden lg:table-cell">{m.city ?? '—'}</td>
                  <td className="p-3"><Badge variant="secondary" className={m.isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}>{m.isApproved ? 'Approuvé' : 'En attente'}</Badge></td>
                  <td className="p-3 hidden lg:table-cell">{m.rating ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {!m.isApproved && <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(m.id)}><CheckCircle className="h-3 w-3" />Approuver</Button>}
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setDetail(m)}><Eye className="h-3 w-3" />Détails</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {merchants.length === 0 && <Em m="Aucun commerçant" />}
      </CardContent></Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Détails du commerçant</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Nom</p><p className="font-medium">{detail.businessName ?? detail.firstName + ' ' + detail.lastName}</p></div>
                <div><p className="text-muted-foreground">Type</p><p className="font-medium">{BUSINESS_TYPES[detail.businessType] ?? detail.businessType ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{detail.email}</p></div>
                <div><p className="text-muted-foreground">Téléphone</p><p className="font-medium">{detail.phone ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Ville</p><p className="font-medium">{detail.city ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Statut</p><p className="font-medium">{detail.isApproved ? 'Approuvé' : 'En attente'}</p></div>
              </div>
              {detail.description && <div><p className="text-muted-foreground">Description</p><p>{detail.description}</p></div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 4 ── Drivers ── */
function DriversView() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<any>('/api/drivers');
      const arr = Array.isArray(data) ? data : (data?.drivers && Array.isArray(data.drivers) ? data.drivers : []);
      setDrivers(arr);
      setLoading(false);
    })();
  }, []);

  const approve = async (id: string) => {
    const { error } = await apiFetch(`/api/drivers/${id}/approve`, { method: 'POST' });
    if (error) return toast.error(error);
    toast.success('Livreur approuvé');
    setDrivers(prev => prev.map((d: any) => d.id === id ? { ...d, isApproved: true } : d));
  };

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Livreurs</h2>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Nom</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Véhicule</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Note</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Livraisons</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {drivers.map((d: any) => (
                <tr key={d.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 font-medium">{d.firstName} {d.lastName}</td>
                  <td className="p-3 hidden md:table-cell">{d.vehicleType ?? d.vehicle ?? '—'}</td>
                  <td className="p-3"><Badge variant="secondary" className={d.isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}>{d.isApproved ? 'Approuvé' : 'En attente'}</Badge></td>
                  <td className="p-3 hidden lg:table-cell">{d.rating ?? '—'}</td>
                  <td className="p-3 hidden lg:table-cell">{d.completedDeliveries ?? d.deliveryCount ?? 0}</td>
                  <td className="p-3">
                    {!d.isApproved && <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(d.id)}><CheckCircle className="h-3 w-3" />Approuver</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {drivers.length === 0 && <Em m="Aucun livreur" />}
      </CardContent></Card>
    </div>
  );
}

/* 5 ── Orders ── */
function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const q = status !== 'all' ? `?status=${status}` : '';
    apiFetch<any>(`/api/orders${q}`).then(({ data }) => {
      const arr = Array.isArray(data) ? data : (data?.orders && Array.isArray(data.orders) ? data.orders : []);
      if (active) { setOrders(arr); setLoading(false); }
    });
    return () => { active = false; };
  }, [status]);

  if (loading) return <Sp />;

  const statuses = ['all', 'PENDING', 'CONFIRMED', 'PREPARING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="text-2xl font-bold">Commandes</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrer" /></SelectTrigger>
          <SelectContent>
            {statuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'Tous les statuts' : ORDER_STATUS_LABELS[s] ?? s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">N°</th>
              <th className="text-left p-3 font-medium">Client</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Commerçant</th>
              <th className="text-left p-3 font-medium">Montant</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
            </tr></thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} onClick={() => setDetail(o)} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer">
                  <td className="p-3 font-mono text-xs">{o.id?.slice(0, 8)}</td>
                  <td className="p-3">{o.user?.firstName} {o.user?.lastName}</td>
                  <td className="p-3 hidden md:table-cell">{o.merchant?.businessName ?? o.merchantName ?? '—'}</td>
                  <td className="p-3">{formatPrice(o.totalAmount ?? o.total ?? 0)}</td>
                  <td className="p-3"><Sb s={o.status} cls={ORDER_STATUS_COLORS[o.status]} /></td>
                  <td className="p-3 hidden lg:table-cell text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <Em m="Aucune commande" />}
      </CardContent></Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Détails de la commande</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">N°</p><p className="font-mono text-xs">{detail.id}</p></div>
                <div><p className="text-muted-foreground">Statut</p><Sb s={detail.status} cls={ORDER_STATUS_COLORS[detail.status]} /></div>
                <div><p className="text-muted-foreground">Client</p><p className="font-medium">{detail.user?.firstName} {detail.user?.lastName}</p></div>
                <div><p className="text-muted-foreground">Montant</p><p className="font-bold text-emerald-700">{formatPrice(detail.totalAmount ?? detail.total ?? 0)}</p></div>
                <div><p className="text-muted-foreground">Paiement</p><Sb s={detail.paymentStatus ?? 'PENDING'} /></div>
                <div><p className="text-muted-foreground">Méthode</p><p>{PAYMENT_METHODS[detail.paymentMethod] ?? detail.paymentMethod ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Adresse</p><p>{detail.deliveryAddress ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Date</p><p>{detail.createdAt ? new Date(detail.createdAt).toLocaleString('fr-FR') : '—'}</p></div>
              </div>
              {detail.items && detail.items.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Articles</p>
                  <div className="space-y-1">
                    {detail.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between bg-gray-50 dark:bg-gray-900/50 rounded px-3 py-2">
                        <span>{it.name ?? it.productName ?? 'Article'} ×{it.quantity ?? 1}</span>
                        <span className="font-medium">{formatPrice(it.price ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 6 ── Categories ── */
function CategoriesView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', sortOrder: '0' });

  const refresh = async () => {
    const { data } = await apiFetch<any[]>('/api/categories');
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    apiFetch<any[]>('/api/categories').then(({ data }) => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', slug: '', icon: '', sortOrder: '0' }); setDlg(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug, icon: c.icon ?? '', sortOrder: String(c.sortOrder ?? 0) }); setDlg(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Le nom est requis');
    const body = { ...form, sortOrder: Number(form.sortOrder) || 0 };
    const url = editing ? `/api/categories/${editing.id}` : '/api/categories';
    const { error } = await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) });
    if (error) return toast.error(error);
    toast.success(editing ? 'Catégorie modifiée' : 'Catégorie créée');
    setDlg(false);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (error) return toast.error(error);
    toast.success('Catégorie supprimée');
    refresh();
  };

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Catégories</h2>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openNew}><Plus className="h-4 w-4" />Ajouter</Button>
      </div>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Icône</th>
              <th className="text-left p-3 font-medium">Nom</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Slug</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Ordre</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 text-2xl">{c.icon ?? '📦'}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.slug}</td>
                  <td className="p-3 hidden lg:table-cell">{c.sortOrder ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" />Modifier</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => remove(c.id)}><X className="h-3 w-3" />Supprimer</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <Em m="Aucune catégorie" />}
      </CardContent></Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : Restaurants" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ex : restaurants" /></div>
            <div><Label>Icône (emoji)</Label><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Ex : 🍕" /></div>
            <div><Label>Ordre d&apos;affichage</Label><Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={save}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 7 ── Products ── */
function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<any[]>('/api/products');
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const remove = async (id: string) => {
    const { error } = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    if (error) return toast.error(error);
    toast.success('Produit supprimé');
    setProducts(prev => prev.filter((p: any) => p.id !== id));
  };

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Produits</h2>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Nom</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Commerçant</th>
              <th className="text-left p-3 font-medium">Prix</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Stock</th>
              <th className="text-left p-3 font-medium">Disponible</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 hidden md:table-cell">{p.merchant?.businessName ?? p.merchantName ?? '—'}</td>
                  <td className="p-3">{formatPrice(p.price ?? 0)}</td>
                  <td className="p-3 hidden lg:table-cell">{p.stock ?? '∞'}</td>
                  <td className="p-3"><Badge variant="secondary" className={p.isAvailable !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>{p.isAvailable !== false ? 'Oui' : 'Non'}</Badge></td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => remove(p.id)}><X className="h-3 w-3" />Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <Em m="Aucun produit" />}
      </CardContent></Card>
    </div>
  );
}

/* 8 ── Coupons ── */
function CouponsView() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: '', maxUsage: '' });

  const refresh = async () => {
    const { data } = await apiFetch<any[]>('/api/coupons');
    setCoupons(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    apiFetch<any[]>('/api/coupons').then(({ data }) => {
      setCoupons(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const create = async () => {
    if (!form.code.trim() || !form.value) return toast.error('Code et valeur requis');
    const { error } = await apiFetch('/api/coupons', { method: 'POST', body: JSON.stringify({ ...form, value: Number(form.value), maxUsage: Number(form.maxUsage) || null }) });
    if (error) return toast.error(error);
    toast.success('Coupon créé');
    setDlg(false);
    setForm({ code: '', type: 'PERCENTAGE', value: '', maxUsage: '' });
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (error) return toast.error(error);
    toast.success('Coupon supprimé');
    refresh();
  };

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDlg(true)}><Plus className="h-4 w-4" />Créer</Button>
      </div>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Code</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Type</th>
              <th className="text-left p-3 font-medium">Valeur</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Utilisations</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {coupons.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3 hidden md:table-cell">{c.type === 'PERCENTAGE' ? 'Pourcentage' : 'Montant fixe'}</td>
                  <td className="p-3">{c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td className="p-3 hidden lg:table-cell">{c.usageCount ?? 0}{c.maxUsage ? ` / ${c.maxUsage}` : ''}</td>
                  <td className="p-3"><Badge variant="secondary" className={c.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>{c.isActive !== false ? 'Actif' : 'Inactif'}</Badge></td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => remove(c.id)}><X className="h-3 w-3" />Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && <Em m="Aucun coupon" />}
      </CardContent></Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau coupon</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Ex : PROMO2025" /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                  <SelectItem value="FIXED">Montant fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valeur</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'PERCENTAGE' ? 'Ex : 10' : 'Ex : 5000'} /></div>
            <div><Label>Utilisations max (optionnel)</Label><Input type="number" value={form.maxUsage} onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))} placeholder="Illimité" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={create}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 9 ── Settings ── */
function SettingsView() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('GENERAL');

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<any>('/api/settings');
      if (data) {
        // API returns { settings: [...], grouped: {...} }
        const raw = Array.isArray(data) ? data : (data.settings && Array.isArray(data.settings) ? data.settings : []);
        setSettings(raw.map((s: any) => ({ ...s, category: s.group ?? s.category ?? 'GENERAL' })));
      }
      setLoading(false);
    })();
  }, []);

  const groups: Record<string, any[]> = {};
  settings.forEach(s => {
    const cat = s.category ?? 'GENERAL';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  });

  const catLabels: Record<string, string> = {
    GENERAL: 'Général', COMMISSION: 'Commission', DELIVERY: 'Livraison', PAYMENT: 'Paiement', SECURITY: 'Sécurité', NOTIFICATION: 'Notification', SUBSCRIPTION: 'Abonnement',
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify({ settings: [{ key, value }] }) });
    if (error) return toast.error(error);
    toast.success('Paramètre mis à jour');
  };

  if (loading) return <Sp />;

  const groupKeys = Object.keys(groups);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Paramètres</h2>
      {groupKeys.length === 0 ? <Em m="Aucun paramètre" /> : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            {groupKeys.map(g => <TabsTrigger key={g} value={g}>{catLabels[g] ?? g}</TabsTrigger>)}
          </TabsList>
          {groupKeys.map(g => (
            <TabsContent key={g} value={g}>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {groups[g].map((s: any) => (
                    <div key={s.key ?? s.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-48 shrink-0 text-sm">{s.label ?? s.key}</Label>
                      <div className="flex-1 flex gap-2">
                        <Input value={s.value ?? ''} onChange={e => setSettings(prev => prev.map(x => (x.key ?? x.id) === (s.key ?? s.id) ? { ...x, value: e.target.value } : x))} className="max-w-xs" />
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" onClick={() => updateSetting(s.key, s.value)}>Enregistrer</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

/* 10 ── Audit Logs ── */
function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<any[]>('/api/audit-logs');
      setLogs(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Journaux d&apos;audit</h2>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Utilisateur</th>
              <th className="text-left p-3 font-medium">Action</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Entité</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Détails</th>
            </tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleString('fr-FR') : '—'}</td>
                  <td className="p-3">{l.user?.firstName} {l.user?.lastName}</td>
                  <td className="p-3"><Badge variant="secondary">{l.action}</Badge></td>
                  <td className="p-3 hidden md:table-cell">{l.entityType ?? '—'}</td>
                  <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{typeof l.details === 'string' ? l.details : JSON.stringify(l.details ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <Em m="Aucun journal" />}
      </CardContent></Card>
    </div>
  );
}

/* 11 ── Support ── */
function SupportView() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<any[]>('/api/support');
      setTickets(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Sp />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Support</h2>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50"><tr className="border-b">
              <th className="text-left p-3 font-medium">Sujet</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Utilisateur</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Priorité</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
            </tr></thead>
            <tbody>
              {tickets.map((t: any) => (
                <tr key={t.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="p-3 font-medium">{t.subject ?? t.title ?? '—'}</td>
                  <td className="p-3 hidden md:table-cell">{t.user?.firstName} {t.user?.lastName}</td>
                  <td className="p-3 hidden lg:table-cell">
                    <Badge variant="secondary" className={t.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                      {t.priority === 'HIGH' ? 'Haute' : t.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </td>
                  <td className="p-3"><Badge variant="secondary" className={t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : t.status === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>{t.status === 'RESOLVED' ? 'Résolu' : t.status === 'OPEN' ? 'Ouvert' : t.status === 'IN_PROGRESS' ? 'En cours' : t.status}</Badge></td>
                  <td className="p-3 hidden lg:table-cell text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tickets.length === 0 && <Em m="Aucun ticket de support" />}
      </CardContent></Card>
    </div>
  );
}

/* 12 ── Profile ── */
function ProfileView() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Mon profil</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center text-xl font-bold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-muted-foreground">Super Administrateur</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
            <div><p className="text-muted-foreground">Téléphone</p><p className="font-medium">{user?.phone ?? 'Non renseigné'}</p></div>
            <div><p className="text-muted-foreground">Compte vérifié</p><p className="font-medium">{user?.isVerified ? 'Oui ✅' : 'Non'}</p></div>
            <div><p className="text-muted-foreground">Rôle</p><p className="font-medium">Super Administrateur</p></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact support</h3>
          <SupportContact />
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function AdminApp() {
  const { view } = useAdminNav();
  const title = NAV.find(n => n.v === view)?.l ?? '';

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView />;
      case 'users': return <UsersView />;
      case 'merchants': return <MerchantsView />;
      case 'drivers': return <DriversView />;
      case 'orders': return <OrdersView />;
      case 'categories': return <CategoriesView />;
      case 'products': return <ProductsView />;
      case 'coupons': return <CouponsView />;
      case 'settings': return <SettingsView />;
      case 'audit-logs': return <AuditLogsView />;
      case 'support': return <SupportView />;
      case 'profile': return <ProfileView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b p-3 flex items-center gap-3 shrink-0">
          <MobileMenu />
          <h1 className="font-bold text-lg">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={tr}>
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}