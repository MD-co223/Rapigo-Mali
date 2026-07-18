'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, Users, Store, Truck, ShoppingCart, Grid3X3,
  Package, Tag, Settings, FileText, Headphones, User, LogOut,
  Menu, Search, Plus, Ban, CheckCircle, X, Eye, Pencil, TrendingUp,
  MoreVertical, Trash2, ShieldOff, ShieldCheck, XCircle, Bell, ClipboardList, Wallet, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupportContact } from '@/components/support-contact';
import { RapigoLogo } from '@/components/rapigo-logo';
import {
  useAdminNav, useAuthStore, useSpaceStore, apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, BUSINESS_TYPES,
  PAYMENT_METHODS, PAYMENT_STATUS_LABELS
} from '@/lib/store';
import type { AdminView } from '@/lib/store';

const tr = { duration: 0.3, ease: [0, 0, 0.2, 1] as const };
const SA = 'diarramoussaka7@gmail.com';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  UPLOADED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

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
function Em({ m, icon: Icon = Package }: { m: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-base font-medium text-muted-foreground mb-1">{m}</p>
    </div>
  );
}
function SkList({ count = 5 }: { count?: number }) {
  return <div className="space-y-3 p-0 animate-in fade-in duration-300">{Array.from({ length: count }).map((_, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card"><Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></div><Skeleton className="h-6 w-20 rounded-full flex-shrink-0" /></div>))}</div>;
}
function SkTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-in fade-in duration-300 space-y-0">
      <div className="flex gap-4 px-4 py-3 bg-muted/50 border-b text-sm">
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b">
          {Array.from({ length: cols }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
        </div>
      ))}
    </div>
  );
}
function Sb({ s, cls }: { s: string; cls?: string }) {
  const color = cls ?? ORDER_STATUS_COLORS[s] ?? PAYMENT_STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  return <Badge className={color}>{ORDER_STATUS_LABELS[s] ?? PAYMENT_STATUS_LABELS[s] ?? s}</Badge>;
}

/* ── Confirm Dialog ── */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant = 'destructive',
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className={variant === 'destructive' ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Chargement…</span> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sidebar ── */
function Sidebar() {
  const { view, navigate } = useAdminNav();
  const { user, logout } = useAuthStore();
  const setSpace = useSpaceStore(s => s.setSpace);
  return (
    <aside className="hidden lg:flex w-64 flex-col bg-gray-900 dark:bg-gray-950 text-white shrink-0">
      <div className="flex items-center justify-center px-4 py-1.5 border-b border-white/10">
        <img src="/rapigo-banner.jpeg" alt="Rapigo Mali" className="h-9 w-auto object-contain brightness-0 invert" />
      </div>
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <RapigoLogo variant="icon" height={36} />
        <div><p className="text-xs text-gray-400">Administration</p></div>
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
        <div className="flex items-center justify-center px-4 py-1.5 border-b border-white/10">
          <img src="/rapigo-banner.jpeg" alt="Rapigo Mali" className="h-8 w-auto object-contain brightness-0 invert" />
        </div>
        <SheetHeader className="p-4 border-b border-white/10">
          <SheetTitle className="text-left flex items-center gap-3">
            <RapigoLogo variant="icon" height={32} />
            <div><p className="text-xs text-gray-400">Administration</p></div>
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
                    <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="p-3">{o.client?.user?.firstName} {o.client?.user?.lastName}</td>
                    <td className="p-3">{formatPrice(o.totalAmount ?? o.total ?? 0)}</td>
                    <td className="p-3"><Sb s={o.status} cls={ORDER_STATUS_COLORS[o.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <Em m="Aucune commande récente" icon={ClipboardList} />}
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

  const refresh = useCallback(async () => {
    const q = new URLSearchParams();
    if (role !== 'all') q.set('role', role);
    const { data } = await apiFetch<any>(`/api/users?${q}`);
    const arr = Array.isArray(data) ? data : (data?.users && Array.isArray(data.users) ? data.users : []);
    setUsers(arr);
  }, [role]);

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

  const action = async (id: string) => {
    const targetUser = users.find((u: any) => u.id === id);
    if (!targetUser) return;
    const subAction = targetUser.isActive ? 'suspend' : 'reactivate';
    const { error } = await apiFetch(`/api/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ action: subAction }) });
    if (error) return toast.error(error);
    toast.success(targetUser.isActive ? 'Utilisateur suspendu' : 'Utilisateur réactivé');
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
                <th className="text-left p-3 font-medium hidden lg:table-cell">Inscription</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Dernière connexion</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((u: any) => {
                  const statusBadge = !u.isActive
                    ? { label: 'Suspendu', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
                    : { label: 'Actif', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
                  const roleBadge = u.role === 'SUPER_ADMIN'
                    ? { label: 'Admin', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
                    : u.role === 'MERCHANT'
                    ? { label: 'Commerçant', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
                    : u.role === 'DRIVER'
                    ? { label: 'Livreur', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' }
                    : { label: 'Client', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
                  return (
                  <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3 font-medium">
                      {u.firstName} {u.lastName}
                      {isSA(u) && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-400">⚠️ SA</Badge>}
                    </td>
                    <td className="p-3 hidden md:table-cell">{u.email}</td>
                    <td className="p-3 hidden lg:table-cell">{u.phone ?? '—'}</td>
                    <td className="p-3"><Badge variant="secondary" className={roleBadge.cls}>{roleBadge.label}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className={statusBadge.cls}>{statusBadge.label}</Badge></td>
                    <td className="p-3 hidden lg:table-cell text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="p-3 hidden lg:table-cell text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                    <td className="p-3">
                      {!isSA(u) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => action(u.id)}>
                              {u.isActive ? <><ShieldOff className="h-4 w-4 mr-2" />Suspendre</> : <><ShieldCheck className="h-4 w-4 mr-2" />Réactiver</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <Em m="Aucun utilisateur trouvé" icon={Users} />}
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
  const [proofDlg, setProofDlg] = useState<{ url: string; date: string | null } | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; type: string; id: string; name: string }>({ open: false, type: '', id: '', name: '' });
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await apiFetch<any>('/api/merchants?all=true');
    const arr = Array.isArray(data) ? data : (data?.merchants && Array.isArray(data.merchants) ? data.merchants : []);
    setMerchants(arr);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const approve = async (id: string) => {
    const { error } = await apiFetch(`/api/merchants/${id}/approve`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) });
    if (error) return toast.error(error);
    toast.success('Commerçant approuvé');
    refresh();
  };

  const requestReject = (id: string, name: string) => {
    setConfirm({ open: true, type: 'reject-merchant', id, name });
  };

  const requestSuspend = (id: string, name: string, isActive: boolean) => {
    setConfirm({ open: true, type: isActive ? 'suspend' : 'reactivate', id, name });
  };

  const requestDelete = (id: string, name: string) => {
    setConfirm({ open: true, type: 'delete-merchant', id, name });
  };

  const handleConfirm = async () => {
    setActing(true);
    const { type, id } = confirm;
    let error: string | null = null;
    let successMsg = '';

    switch (type) {
      case 'reject-merchant':
        ({ error } = await apiFetch(`/api/merchants/${id}/approve`, { method: 'POST', body: JSON.stringify({ action: 'reject' }) }));
        successMsg = 'Commerçant refusé';
        break;
      case 'suspend':
        ({ error } = await apiFetch(`/api/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ action: 'suspend' }) }));
        successMsg = 'Utilisateur suspendu';
        break;
      case 'reactivate':
        ({ error } = await apiFetch(`/api/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ action: 'reactivate' }) }));
        successMsg = 'Utilisateur réactivé';
        break;
      case 'delete-merchant':
        ({ error } = await apiFetch(`/api/merchants/${id}`, { method: 'DELETE' }));
        successMsg = 'Commerçant supprimé';
        break;
    }

    setActing(false);
    setConfirm({ open: false, type: '', id: '', name: '' });
    if (error) return toast.error(error);
    toast.success(successMsg);
    refresh();
  };

  const getConfirmProps = () => {
    switch (confirm.type) {
      case 'reject-merchant':
        return { title: 'Refuser le commerçant', description: `Voulez-vous vraiment refuser la demande de "${confirm.name}" ?`, confirmLabel: 'Refuser', variant: 'destructive' as const };
      case 'suspend':
        return { title: 'Suspendre l\'utilisateur', description: `Voulez-vous vraiment suspendre "${confirm.name}" ? Il ne pourra plus se connecter.`, confirmLabel: 'Suspendre', variant: 'destructive' as const };
      case 'reactivate':
        return { title: 'Réactiver l\'utilisateur', description: `Voulez-vous réactiver le compte de "${confirm.name}" ?`, confirmLabel: 'Réactiver', variant: 'default' as const };
      case 'delete-merchant':
        return { title: 'Supprimer le commerçant', description: `Voulez-vous vraiment supprimer définitivement "${confirm.name}" ? Cette action est irréversible.`, confirmLabel: 'Supprimer', variant: 'destructive' as const };
      default:
        return { title: '', description: '', confirmLabel: '', variant: 'destructive' as const };
    }
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
              <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Type</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Ville</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {merchants.map((m: any) => {
                const displayName = m.businessName ?? (m.user?.firstName + ' ' + m.user?.lastName);
                return (
                  <tr key={m.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3 font-medium">{displayName}</td>
                    <td className="p-3 hidden md:table-cell">{m.user?.email ?? m.email ?? '—'}</td>
                    <td className="p-3 hidden lg:table-cell">{BUSINESS_TYPES[m.businessType] ?? m.businessType ?? '—'}</td>
                    <td className="p-3 hidden lg:table-cell">{m.city ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={m.isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}>{m.isApproved ? 'Approuvé' : 'En attente'}</Badge>
                        {m.user?.isActive === false && <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Suspendu</Badge>}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">{m.rating ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {!m.isApproved && (
                          <>
                            <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(m.id)}><CheckCircle className="h-3 w-3" />Approuver</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => requestReject(m.id, displayName)}><XCircle className="h-3 w-3" />Refuser</Button>
                          </>
                        )}
                        {m.paymentProof && (
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-blue-600 hover:text-blue-700" onClick={() => setProofDlg({ url: m.paymentProof, date: m.paymentProofAt })}><Eye className="h-3 w-3" />Voir la preuve</Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setDetail(m)}><Eye className="h-3 w-3" />Détails</Button>
                        {m.userId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {m.user?.isActive !== false ? (
                                <DropdownMenuItem className="text-amber-600 cursor-pointer" onClick={() => requestSuspend(m.userId, displayName, true)}>
                                  <ShieldOff className="h-4 w-4 mr-2" />Suspendre
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-emerald-600 cursor-pointer" onClick={() => requestSuspend(m.userId, displayName, false)}>
                                  <ShieldCheck className="h-4 w-4 mr-2" />Réactiver
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => requestDelete(m.id, displayName)}>
                                <Trash2 className="h-4 w-4 mr-2" />Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {merchants.length === 0 && <Em m="Aucun commerçant trouvé" icon={Store} />}
      </CardContent></Card>

      {/* Merchant Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Détails du commerçant</DialogTitle>
            <DialogDescription>Informations détaillées du compte commerçant.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="overflow-y-auto -mx-6 px-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Nom</p><p className="font-medium">{detail.businessName ?? (detail.user?.firstName + ' ' + detail.user?.lastName)}</p></div>
                <div><p className="text-muted-foreground">Type</p><p className="font-medium">{BUSINESS_TYPES[detail.businessType] ?? detail.businessType ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{detail.user?.email ?? detail.email ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Téléphone</p><p className="font-medium">{detail.user?.phone ?? detail.phone ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Ville</p><p className="font-medium">{detail.city ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Compte</p><p className="font-medium">{detail.user?.isActive !== false ? 'Actif' : 'Suspendu'}</p></div>
              </div>
              {detail.description && <div><p className="text-muted-foreground">Description</p><p>{detail.description}</p></div>}
              {detail.paymentProof && (
                <div>
                  <p className="text-muted-foreground mb-1">Preuve de paiement :</p>
                  <img src={detail.paymentProof} alt="Preuve de paiement" className="max-h-40 w-full rounded-lg border object-contain bg-gray-50 dark:bg-gray-800" />
                  {detail.paymentProofAt && <p className="text-xs text-muted-foreground mt-1">Envoyée le {new Date(detail.paymentProofAt).toLocaleString('fr-FR')}</p>}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-auto"><Button variant="outline" onClick={() => setDetail(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Dialog */}
      <Dialog open={!!proofDlg} onOpenChange={() => setProofDlg(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preuve de paiement</DialogTitle>
            <DialogDescription>Document fourni par le commerçant.</DialogDescription>
          </DialogHeader>
          {proofDlg && (
            <div className="overflow-y-auto -mx-6 px-6">
              <img src={proofDlg.url} alt="Preuve de paiement" className="max-w-full max-h-[60vh] rounded-lg border object-contain" />
              {proofDlg.date && <p className="text-xs text-muted-foreground mt-2">Soumise le {new Date(proofDlg.date).toLocaleString('fr-FR')}</p>}
            </div>
          )}
          <DialogFooter className="mt-auto"><Button variant="outline" onClick={() => setProofDlg(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(v) => setConfirm(p => ({ ...p, open: v }))}
        title={getConfirmProps().title}
        description={getConfirmProps().description}
        confirmLabel={getConfirmProps().confirmLabel}
        variant={getConfirmProps().variant}
        onConfirm={handleConfirm}
        loading={acting}
      />
    </div>
  );
}

/* 4 ── Drivers ── */
function DriversView() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofDlg, setProofDlg] = useState<{ url: string; date: string | null } | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; type: string; id: string; name: string }>({ open: false, type: '', id: '', name: '' });
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await apiFetch<any>('/api/drivers');
    const arr = Array.isArray(data) ? data : (data?.drivers && Array.isArray(data.drivers) ? data.drivers : []);
    setDrivers(arr);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const approve = async (id: string) => {
    const { error } = await apiFetch(`/api/drivers/${id}/approve`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) });
    if (error) return toast.error(error);
    toast.success('Livreur approuvé');
    refresh();
  };

  const requestReject = (id: string, name: string) => {
    setConfirm({ open: true, type: 'reject-driver', id, name });
  };

  const requestSuspend = (id: string, name: string, isActive: boolean) => {
    setConfirm({ open: true, type: isActive ? 'suspend' : 'reactivate', id, name });
  };

  const requestDelete = (id: string, name: string) => {
    setConfirm({ open: true, type: 'delete-driver', id, name });
  };

  const handleConfirm = async () => {
    setActing(true);
    const { type, id } = confirm;
    let error: string | null = null;
    let successMsg = '';

    switch (type) {
      case 'reject-driver':
        ({ error } = await apiFetch(`/api/drivers/${id}/approve`, { method: 'POST', body: JSON.stringify({ action: 'reject' }) }));
        successMsg = 'Livreur refusé';
        break;
      case 'suspend':
        ({ error } = await apiFetch(`/api/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ action: 'suspend' }) }));
        successMsg = 'Utilisateur suspendu';
        break;
      case 'reactivate':
        ({ error } = await apiFetch(`/api/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ action: 'reactivate' }) }));
        successMsg = 'Utilisateur réactivé';
        break;
      case 'delete-driver':
        ({ error } = await apiFetch(`/api/drivers/${id}`, { method: 'DELETE' }));
        successMsg = 'Livreur supprimé';
        break;
    }

    setActing(false);
    setConfirm({ open: false, type: '', id: '', name: '' });
    if (error) return toast.error(error);
    toast.success(successMsg);
    refresh();
  };

  const getConfirmProps = () => {
    switch (confirm.type) {
      case 'reject-driver':
        return { title: 'Refuser le livreur', description: `Voulez-vous vraiment refuser la demande de "${confirm.name}" ?`, confirmLabel: 'Refuser', variant: 'destructive' as const };
      case 'suspend':
        return { title: 'Suspendre l\'utilisateur', description: `Voulez-vous vraiment suspendre "${confirm.name}" ? Il ne pourra plus se connecter.`, confirmLabel: 'Suspendre', variant: 'destructive' as const };
      case 'reactivate':
        return { title: 'Réactiver l\'utilisateur', description: `Voulez-vous réactiver le compte de "${confirm.name}" ?`, confirmLabel: 'Réactiver', variant: 'default' as const };
      case 'delete-driver':
        return { title: 'Supprimer le livreur', description: `Voulez-vous vraiment supprimer définitivement "${confirm.name}" ? Cette action est irréversible.`, confirmLabel: 'Supprimer', variant: 'destructive' as const };
      default:
        return { title: '', description: '', confirmLabel: '', variant: 'destructive' as const };
    }
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
              <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Véhicule</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Livraisons</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {drivers.map((d: any) => {
                const displayName = (d.user?.firstName ?? '') + ' ' + (d.user?.lastName ?? '');
                return (
                  <tr key={d.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3 font-medium">{displayName}</td>
                    <td className="p-3 hidden md:table-cell">{d.user?.email ?? '—'}</td>
                    <td className="p-3 hidden lg:table-cell">{d.vehicleType ?? d.vehicle ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={d.isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}>{d.isApproved ? 'Approuvé' : 'En attente'}</Badge>
                        {d.user?.isActive === false && <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Suspendu</Badge>}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">{d.totalDeliveries ?? d.completedDeliveries ?? d.deliveryCount ?? 0}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {!d.isApproved && (
                          <>
                            <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(d.id)}><CheckCircle className="h-3 w-3" />Approuver</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => requestReject(d.id, displayName)}><XCircle className="h-3 w-3" />Refuser</Button>
                          </>
                        )}
                        {d.paymentProof && (
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-blue-600 hover:text-blue-700" onClick={() => setProofDlg({ url: d.paymentProof, date: d.paymentProofAt })}><Eye className="h-3 w-3" />Voir la preuve</Button>
                        )}
                        {d.userId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {d.user?.isActive !== false ? (
                                <DropdownMenuItem className="text-amber-600 cursor-pointer" onClick={() => requestSuspend(d.userId, displayName, true)}>
                                  <ShieldOff className="h-4 w-4 mr-2" />Suspendre
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-emerald-600 cursor-pointer" onClick={() => requestSuspend(d.userId, displayName, false)}>
                                  <ShieldCheck className="h-4 w-4 mr-2" />Réactiver
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => requestDelete(d.id, displayName)}>
                                <Trash2 className="h-4 w-4 mr-2" />Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {drivers.length === 0 && <Em m="Aucun livreur trouvé" icon={Truck} />}
      </CardContent></Card>

      {/* Payment Proof Dialog */}
      <Dialog open={!!proofDlg} onOpenChange={() => setProofDlg(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preuve de paiement</DialogTitle>
            <DialogDescription>Document fourni par le livreur.</DialogDescription>
          </DialogHeader>
          {proofDlg && (
            <div className="overflow-y-auto -mx-6 px-6">
              <img src={proofDlg.url} alt="Preuve de paiement" className="max-w-full max-h-[60vh] rounded-lg border object-contain" />
              {proofDlg.date && <p className="text-xs text-muted-foreground mt-2">Soumise le {new Date(proofDlg.date).toLocaleString('fr-FR')}</p>}
            </div>
          )}
          <DialogFooter className="mt-auto"><Button variant="outline" onClick={() => setProofDlg(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(v) => setConfirm(p => ({ ...p, open: v }))}
        title={getConfirmProps().title}
        description={getConfirmProps().description}
        confirmLabel={getConfirmProps().confirmLabel}
        variant={getConfirmProps().variant}
        onConfirm={handleConfirm}
        loading={acting}
      />
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
                  <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                  <td className="p-3">{o.client?.user?.firstName} {o.client?.user?.lastName}</td>
                  <td className="p-3 hidden md:table-cell">{o.merchant?.businessName ?? o.merchantName ?? '—'}</td>
                  <td className="p-3">{formatPrice(o.totalAmount ?? o.total ?? 0)}</td>
                  <td className="p-3"><Sb s={o.status} cls={ORDER_STATUS_COLORS[o.status]} /></td>
                  <td className="p-3 hidden lg:table-cell text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <Em m="Aucune commande" icon={ShoppingCart} />}
      </CardContent></Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>Informations détaillées de la commande.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="overflow-y-auto -mx-6 px-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">N°</p><p className="font-mono text-xs">{detail.orderNumber}</p></div>
                <div><p className="text-muted-foreground">Statut</p><Sb s={detail.status} cls={ORDER_STATUS_COLORS[detail.status]} /></div>
                <div><p className="text-muted-foreground">Client</p><p className="font-medium">{detail.client?.user?.firstName} {detail.client?.user?.lastName}</p></div>
                <div><p className="text-muted-foreground">Montant</p><p className="font-bold text-emerald-700">{formatPrice(detail.totalAmount ?? detail.total ?? 0)}</p></div>
                <div><p className="text-muted-foreground">Paiement</p><Sb s={detail.paymentStatus ?? 'PENDING'} /></div>
                <div><p className="text-muted-foreground">Méthode</p><p>{PAYMENT_METHODS[detail.paymentMethod] ?? detail.paymentMethod ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Adresse</p><p>{detail.deliveryAddress ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Date</p><p>{detail.createdAt ? new Date(detail.createdAt).toLocaleString('fr-FR') : '—'}</p></div>
              </div>
              {detail.paymentProof && (
                <div>
                  <p className="text-muted-foreground mb-1">Preuve de paiement :</p>
                  <img src={detail.paymentProof} alt="Preuve de paiement" className="max-h-40 rounded-lg border" />
                </div>
              )}
              {detail.paymentStatus === 'UPLOADED' && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={async () => {
                    const { error } = await apiFetch(`/api/orders/${detail.id}/verify-payment`, { method: 'PATCH', body: JSON.stringify({ reject: false }) });
                    if (error) return toast.error(error);
                    toast.success('Paiement approuvé');
                    setDetail({ ...detail, paymentStatus: 'PAID' });
                  }}><CheckCircle className="h-4 w-4" />Approuver le paiement</Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 gap-1" onClick={async () => {
                    const { error } = await apiFetch(`/api/orders/${detail.id}/verify-payment`, { method: 'PATCH', body: JSON.stringify({ reject: true }) });
                    if (error) return toast.error(error);
                    toast.success('Paiement refusé');
                    setDetail({ ...detail, paymentStatus: 'REJECTED' });
                  }}><XCircle className="h-4 w-4" />Refuser</Button>
                </div>
              )}
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
          <DialogFooter className="gap-2 mt-auto">
            {detail?.status === 'DELIVERED' && (
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.open(`/api/orders/${detail.id}/invoice`, '_blank')}>
                <Download className="h-4 w-4" />Télécharger la facture
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetail(null)}>Fermer</Button>
          </DialogFooter>
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
        {items.length === 0 && <Em m="Aucune catégorie" icon={Grid3X3} />}
      </CardContent></Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
            <DialogDescription>{editing ? 'Modifiez les informations de la catégorie.' : 'Renseignez les informations de la nouvelle catégorie.'}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 space-y-3">
            <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : Restaurants" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ex : restaurants" /></div>
            <div><Label>Icône (emoji)</Label><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Ex : 🍕" /></div>
            <div><Label>Ordre d&apos;affichage</Label><Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></div>
          </div>
          <DialogFooter className="mt-auto">
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
        {products.length === 0 && <Em m="Aucun produit" icon={Package} />}
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
                  <td className="p-3 hidden lg:table-cell">{c.usedCount ?? 0}{c.maxUsage ? ` / ${c.maxUsage}` : ''}</td>
                  <td className="p-3"><Badge variant="secondary" className={c.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>{c.isActive !== false ? 'Actif' : 'Inactif'}</Badge></td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => remove(c.id)}><X className="h-3 w-3" />Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && <Em m="Aucun coupon" icon={Tag} />}
      </CardContent></Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouveau coupon</DialogTitle>
            <DialogDescription>Créez un nouveau code de réduction.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 space-y-3">
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
          <DialogFooter className="mt-auto">
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
      const { data } = await apiFetch<any>('/api/audit-logs');
      const arr = Array.isArray(data) ? data : (data?.logs && Array.isArray(data.logs) ? data.logs : []);
      setLogs(arr);
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
                  <td className="p-3 hidden md:table-cell">{l.entity ?? '—'}</td>
                  <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{typeof l.details === 'string' ? l.details : JSON.stringify(l.details ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <Em m="Aucun journal d'audit" icon={FileText} />}
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
        {tickets.length === 0 && <Em m="Aucun ticket de support" icon={Headphones} />}
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
              <p className="text-sm text-muted-foreground">{user?.isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
            <div><p className="text-muted-foreground">Téléphone</p><p className="font-medium">{user?.phone ?? 'Non renseigné'}</p></div>
            <div><p className="text-muted-foreground">Compte vérifié</p><p className="font-medium">{user?.isVerified ? 'Oui ✅' : 'Non'}</p></div>
            <div><p className="text-muted-foreground">Rôle</p><p className="font-medium">{user?.isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}</p></div>
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
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center justify-center px-4 py-1 border-b border-emerald-100 dark:border-emerald-900/30">
            <img src="/rapigo-banner.jpeg" alt="Rapigo Mali" className="h-7 w-auto object-contain" />
          </div>
          <div className="p-3 flex items-center gap-3 border-b">
            <MobileMenu />
            <h1 className="font-bold text-lg">{title}</h1>
          </div>
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