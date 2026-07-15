/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingBag,
  CreditCard,
  Grid3X3,
  Package,
  Ticket,
  Crown,
  Settings,
  FileText,
  LifeBuoy,
  Bell,
  Menu,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Ban,
  LogOut,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShieldX,
  UserCog,
  Mail,
  Phone,
  MapPin,
  Star,
  CircleDot,
} from 'lucide-react';

import {
  useAuthStore,
  useAdminNav,
  apiFetch,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  BUSINESS_TYPES,
  PAYMENT_METHODS,
} from '@/lib/store';
import type { AdminView } from '@/lib/store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#059669', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#ef4444', '#8b5cf6', '#14b8a6'];

interface MenuItem {
  id: AdminView;
  label: string;
  icon: React.ElementType;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'merchants', label: 'Marchands', icon: Store },
  { id: 'drivers', label: 'Livreurs', icon: Bike },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'categories', label: 'Catégories', icon: Grid3X3 },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'subscriptions', label: 'Abonnements', icon: Crown },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'audit-logs', label: "Journaux d'audit", icon: FileText },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  MERCHANT: 'Marchand',
  DRIVER: 'Livreur',
  ADMIN: 'Admin',
};

const SUPPORT_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bas',
  MEDIUM: 'Moyen',
  HIGH: 'Haut',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  totalMerchants: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingMerchants: number;
  pendingDrivers: number;
  ordersByStatus: { name: string; value: number }[];
  recentOrders: any[];
}

// ─── Reusable hooks ────────────────────────────────────────────────────────────

function useApiFetch<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<T>(url);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setData(res.data);
    }
    setLoading(false);
  }, [url]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ─── Reusable components ──────────────────────────────────────────────────────

function PageShell({ title, description, children, actions }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 opacity-30" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { view, navigate } = useAdminNav();

  const handleNav = (id: AdminView) => {
    navigate(id);
    onNavigate?.();
  };

  return (
    <nav className="flex flex-col gap-1 px-3">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const { navigate } = useAdminNav();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            R
          </div>
          <span className="text-sm font-semibold">Rapigo Admin</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('support' as AdminView)}>
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </span>
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-400">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('dashboard'); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView() {
  const { data, loading, error, refetch } = useApiFetch<DashboardStats>('/api/stats', {
    totalUsers: 0,
    totalMerchants: 0,
    totalDrivers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingMerchants: 0,
    pendingDrivers: 0,
    ordersByStatus: [],
    recentOrders: [],
  });

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const statCards = [
    { label: 'Utilisateurs', value: data.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Marchands', value: data.totalMerchants, icon: Store, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Livreurs', value: data.totalDrivers, icon: Bike, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Commandes', value: data.totalOrders, icon: ShoppingBag, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Revenus', value: formatPrice(data.totalRevenue), icon: CreditCard, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  ];

  return (
    <PageShell title="Tableau de bord" description="Vue d'ensemble de la plateforme Rapigo">
      {loading ? (
        <LoadingCards count={5} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : data.ordersByStatus.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.ordersByStatus.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {data.ordersByStatus.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {data.ordersByStatus.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">({item.value})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">En attente d'approbation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <Store className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Marchands en attente</p>
                      <p className="text-xs text-muted-foreground">Nécessitent une vérification</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" variant="secondary">
                    {data.pendingMerchants}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Bike className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Livreurs en attente</p>
                      <p className="text-xs text-muted-foreground">Documents à vérifier</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" variant="secondary">
                    {data.pendingDrivers}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !data.recentOrders || data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune commande récente</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Marchand</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.slice(0, 10).map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                      <TableCell className="text-sm">{order.clientName || '-'}</TableCell>
                      <TableCell className="text-sm">{order.merchantName || '-'}</TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Users View ───────────────────────────────────────────────────────────────

function UsersView() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (roleFilter) params.set('role', roleFilter);
    if (search) params.set('search', search);
    const res = await apiFetch<any>(`/api/users?${params}`);
    if (res.data) {
      setUsers(Array.isArray(res.data) ? res.data : res.data.users || []);
      setTotal(res.data.total || res.data.length || 0);
    }
    setLoading(false);
  }, [search, roleFilter, offset]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBlock = async (userId: string, action: 'block' | 'unblock') => {
    const res = await apiFetch(`/api/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(action === 'block' ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
    fetchUsers();
  };

  const handleSuspend = async (userId: string, action: 'suspend' | 'reactivate') => {
    const res = await apiFetch(`/api/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(action === 'suspend' ? 'Utilisateur suspendu' : 'Utilisateur réactivé');
    fetchUsers();
  };

  return (
    <PageShell title="Utilisateurs" description="Gérer tous les utilisateurs de la plateforme">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setOffset(0); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="CLIENT">Clients</SelectItem>
            <SelectItem value="MERCHANT">Marchands</SelectItem>
            <SelectItem value="DRIVER">Livreurs</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : users.length === 0 ? (
            <EmptyState message="Aucun utilisateur trouvé" onRetry={fetchUsers} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => {
                    const isSuper = u.isSuperAdmin;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="hidden text-sm md:table-cell">{u.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ROLE_LABELS[u.role] || u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? 'default' : 'destructive'} className={u.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isSuper && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlock(u.id, u.isActive ? 'block' : 'unblock')}
                                  disabled={!u.isActive && u.role === 'ADMIN'}
                                >
                                  {u.isActive ? <Ban className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSuspend(u.id, u.isActive ? 'suspend' : 'reactivate')}
                                  disabled={!u.isActive && u.role === 'ADMIN'}
                                >
                                  {u.isActive ? <ShieldX className="h-3.5 w-3.5 text-orange-500" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                                </Button>
                              </>
                            )}
                            {isSuper && (
                              <span className="text-xs text-muted-foreground">Super Admin</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} utilisateur(s) au total</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset((p) => Math.max(0, p - limit))}>
            Précédent
          </Button>
          <Button variant="outline" size="sm" disabled={offset + limit >= total} onClick={() => setOffset((p) => p + limit)}>
            Suivant
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Merchants View ───────────────────────────────────────────────────────────

function MerchantsView() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ all: 'true' });
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (approvalFilter) params.set('approved', approvalFilter);
    const res = await apiFetch<any>(`/api/merchants?${params}`);
    if (res.data) {
      setMerchants(Array.isArray(res.data) ? res.data : res.data.merchants || []);
    }
    setLoading(false);
  }, [search, typeFilter, approvalFilter]);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    const res = await apiFetch(`/api/merchants/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(action === 'approve' ? 'Marchand approuvé' : 'Marchand refusé');
    fetchMerchants();
  };

  const handleBlock = async (id: string) => {
    const res = await apiFetch(`/api/users/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ action: 'block' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Marchand bloqué');
    fetchMerchants();
  };

  return (
    <PageShell title="Marchands" description="Gérer les marchands de la plateforme">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un marchand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type de commerce" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(BUSINESS_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={approvalFilter} onValueChange={(v) => setApprovalFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Approbation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="true">Approuvés</SelectItem>
            <SelectItem value="false">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : merchants.length === 0 ? (
            <EmptyState message="Aucun marchand trouvé" onRetry={fetchMerchants} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.map((m: any) => (
                    <TableRow key={m.id} className={!m.isApproved ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {m.businessName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{m.businessName}</p>
                            <p className="text-xs text-muted-foreground">{m.city}{m.quartier ? ` - ${m.quartier}` : ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{BUSINESS_TYPES[m.businessType] || m.businessType}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{m.phone}</TableCell>
                      <TableCell>
                        {!m.isApproved ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" variant="secondary">
                            En attente
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" variant="secondary">
                            Approuvé
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{m.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedMerchant(m); setDetailOpen(true); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {!m.isApproved && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleApprove(m.id, 'approve')}>
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleApprove(m.id, 'reject')}>
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </>
                          )}
                          {m.isApproved && (
                            <Button variant="ghost" size="sm" onClick={() => handleBlock(m.userId)}>
                              <Ban className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merchant Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMerchant?.businessName}</DialogTitle>
            <DialogDescription>Détails du marchand</DialogDescription>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Type:</span> <span className="ml-1 font-medium">{BUSINESS_TYPES[selectedMerchant.businessType]}</span></div>
                <div><span className="text-muted-foreground">Ville:</span> <span className="ml-1 font-medium">{selectedMerchant.city}</span></div>
                <div><span className="text-muted-foreground">Téléphone:</span> <span className="ml-1 font-medium">{selectedMerchant.phone}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="ml-1 font-medium">{selectedMerchant.email || '-'}</span></div>
                <div><span className="text-muted-foreground">Commission:</span> <span className="ml-1 font-medium">{selectedMerchant.commissionRate}%</span></div>
                <div><span className="text-muted-foreground">Note:</span> <span className="ml-1 font-medium">{selectedMerchant.rating?.toFixed(1)}/5</span></div>
              </div>
              {selectedMerchant.description && (
                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1">{selectedMerchant.description}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Adresse:</span>
                <p className="mt-1">{selectedMerchant.address}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Horaires:</span>
                <p className="mt-1">{selectedMerchant.operatingHours}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Drivers View ─────────────────────────────────────────────────────────────

function DriversView() {
  const [search, setSearch] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await apiFetch<any>(`/api/drivers?${params}`);
    if (res.data) {
      setDrivers(Array.isArray(res.data) ? res.data : res.data.drivers || []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    const res = await apiFetch(`/api/drivers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(action === 'approve' ? 'Livreur approuvé' : 'Livreur refusé');
    fetchDrivers();
  };

  const vehicleLabel: Record<string, string> = { MOTO: 'Moto', VELO: 'Vélo', VOITURE: 'Voiture' };

  return (
    <PageShell title="Livreurs" description="Gérer les livreurs de la plateforme">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un livreur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : drivers.length === 0 ? (
            <EmptyState message="Aucun livreur trouvé" onRetry={fetchDrivers} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead className="hidden md:table-cell">Documents</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Livraisons</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((d: any) => {
                    const hasAllDocs = d.idCardImage && d.licenseImage && d.vehicleImage && d.selfieImage;
                    return (
                      <TableRow key={d.id} className={!d.isApproved ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              {d.user?.firstName?.[0]}{d.user?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{d.user?.firstName} {d.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">{d.user?.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vehicleLabel[d.vehicleType] || d.vehicleType}</Badge>
                          {d.vehiclePlate && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{d.vehiclePlate}</p>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            {hasAllDocs ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                            <span className="text-xs">{hasAllDocs ? 'Complets' : 'Incomplets'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {!d.isApproved ? (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" variant="secondary">
                              En attente
                            </Badge>
                          ) : d.isOnline ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" variant="secondary">
                              En ligne
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Hors ligne</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">{d.totalDeliveries}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedDriver(d); setDetailOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {!d.isApproved && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleApprove(d.id, 'approve')}>
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleApprove(d.id, 'reject')}>
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDriver?.user?.firstName} {selectedDriver?.user?.lastName}</DialogTitle>
            <DialogDescription>Détails du livreur</DialogDescription>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Véhicule:</span> <span className="ml-1 font-medium">{vehicleLabel[selectedDriver.vehicleType]}</span></div>
                <div><span className="text-muted-foreground">Plaque:</span> <span className="ml-1 font-medium">{selectedDriver.vehiclePlate || '-'}</span></div>
                <div><span className="text-muted-foreground">Marque:</span> <span className="ml-1 font-medium">{selectedDriver.vehicleBrand || '-'}</span></div>
                <div><span className="text-muted-foreground">Couleur:</span> <span className="ml-1 font-medium">{selectedDriver.vehicleColor || '-'}</span></div>
                <div><span className="text-muted-foreground">N° permis:</span> <span className="ml-1 font-medium">{selectedDriver.licenseNumber || '-'}</span></div>
                <div><span className="text-muted-foreground">N° carte:</span> <span className="ml-1 font-medium">{selectedDriver.idCardNumber || '-'}</span></div>
                <div><span className="text-muted-foreground">Livraisons:</span> <span className="ml-1 font-medium">{selectedDriver.totalDeliveries}</span></div>
                <div><span className="text-muted-foreground">Gains:</span> <span className="ml-1 font-medium">{formatPrice(selectedDriver.totalEarnings)}</span></div>
                <div><span className="text-muted-foreground">Note:</span> <span className="ml-1 font-medium">{selectedDriver.rating?.toFixed(1)}/5</span></div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 font-medium">Documents</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">{selectedDriver.idCardImage ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} Carte d'identité</div>
                  <div className="flex items-center gap-1">{selectedDriver.licenseImage ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} Permis de conduire</div>
                  <div className="flex items-center gap-1">{selectedDriver.vehicleImage ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} Photo du véhicule</div>
                  <div className="flex items-center gap-1">{selectedDriver.selfieImage ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} Selfie</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────

function OrdersView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await apiFetch<any>(`/api/orders?${params}`);
    if (res.data) {
      setOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  return (
    <PageShell title="Commandes" description="Gérer toutes les commandes de la plateforme">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° de commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState message="Aucune commande trouvée" onRetry={fetchOrders} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Marchand</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: any) => (
                    <React.Fragment key={o.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === o.id ? null : o.id)}
                      >
                        <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                        <TableCell className="text-sm">{o.client?.user?.firstName || '-'}</TableCell>
                        <TableCell className="hidden text-sm md:table-cell">{o.merchant?.businessName || '-'}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(o.total)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status] || ''}`}>
                            {ORDER_STATUS_LABELS[o.status] || o.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); viewDetail(o); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRow === o.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="p-2 text-sm">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div><span className="text-muted-foreground">Sous-total:</span> <span className="ml-1">{formatPrice(o.subtotal)}</span></div>
                                <div><span className="text-muted-foreground">Livraison:</span> <span className="ml-1">{formatPrice(o.deliveryFee)}</span></div>
                                <div><span className="text-muted-foreground">Remise:</span> <span className="ml-1">{formatPrice(o.discount)}</span></div>
                                <div><span className="text-muted-foreground">Méthode:</span> <span className="ml-1">{PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod}</span></div>
                                <div><span className="text-muted-foreground">Adresse:</span> <span className="ml-1">{o.deliveryAddress}</span></div>
                                <div><span className="text-muted-foreground">Date:</span> <span className="ml-1">{new Date(o.createdAt).toLocaleString('fr-FR')}</span></div>
                              </div>
                              {o.items && o.items.length > 0 && (
                                <div className="mt-2">
                                  <p className="mb-1 font-medium">Articles:</p>
                                  {o.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between py-0.5 text-xs">
                                      <span>{item.productName} x{item.quantity}</span>
                                      <span>{formatPrice(item.totalPrice)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Détails complets de la commande</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium">Client</p>
                  <p>{selectedOrder.client?.user?.firstName} {selectedOrder.client?.user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.client?.user?.phone}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium">Marchand</p>
                  <p>{selectedOrder.merchant?.businessName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.merchant?.phone}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium">Livraison</p>
                  <p>{selectedOrder.deliveryAddress}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.deliveryCity} - {selectedOrder.deliveryQuartier || '-'}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium">Livreur</p>
                  <p>{selectedOrder.driver?.user?.firstName ? `${selectedOrder.driver.user.firstName} ${selectedOrder.driver.user.lastName}` : 'Non assigné'}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                <div><span className="text-muted-foreground">Sous-total:</span> <span className="ml-1 font-medium">{formatPrice(selectedOrder.subtotal)}</span></div>
                <div><span className="text-muted-foreground">Frais de livraison:</span> <span className="ml-1 font-medium">{formatPrice(selectedOrder.deliveryFee)}</span></div>
                <div><span className="text-muted-foreground">Frais de service:</span> <span className="ml-1 font-medium">{formatPrice(selectedOrder.serviceFee)}</span></div>
                <div><span className="text-muted-foreground">Remise:</span> <span className="ml-1 font-medium">{formatPrice(selectedOrder.discount)}</span></div>
                <div><span className="text-muted-foreground">Total:</span> <span className="ml-1 text-base font-bold text-emerald-600">{formatPrice(selectedOrder.total)}</span></div>
                <div><span className="text-muted-foreground">Méthode:</span> <span className="ml-1">{PAYMENT_METHODS[selectedOrder.paymentMethod]}</span></div>
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Articles ({selectedOrder.items.length})</p>
                  <div className="space-y-1">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded border p-2 text-xs">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-muted-foreground">{formatPrice(item.unitPrice)} x {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Payments View ────────────────────────────────────────────────────────────

function PaymentsView() {
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/orders?limit=100');
    if (res.data) {
      setOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filteredOrders = statusFilter
    ? orders.filter((o: any) => o.paymentStatus === statusFilter)
    : orders;

  const totalAmount = filteredOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  return (
    <PageShell title="Paiements" description="Suivi de tous les paiements">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchPayments}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Total transactions</p>
            <p className="text-lg font-bold">{filteredOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Montant total</p>
            <p className="text-lg font-bold text-emerald-600">{formatPrice(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Paiements acceptés</p>
            <p className="text-lg font-bold">
              {filteredOrders.filter((o: any) => o.paymentStatus === 'ACCEPTED' || o.paymentStatus === 'COMPLETED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState message="Aucun paiement trouvé" onRetry={fetchPayments} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Méthode</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut paiement</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                      <TableCell className="text-sm">{o.client?.user?.firstName || '-'}</TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod}</TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(o.total)}</TableCell>
                      <TableCell>
                        <Badge variant={o.paymentStatus === 'ACCEPTED' || o.paymentStatus === 'COMPLETED' ? 'default' : o.paymentStatus === 'FAILED' || o.paymentStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
                          {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Categories View ──────────────────────────────────────────────────────────

function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', icon: '', sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/categories');
    if (res.data) {
      setCategories(Array.isArray(res.data) ? res.data : res.data.categories || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', icon: '', sortOrder: 0, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon || '', sortOrder: cat.sortOrder, isActive: cat.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9àâçéèêëîïôùûüÿñæœ\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const body = { ...form, slug };

    let res;
    if (editing) {
      res = await apiFetch(`/api/categories/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      res = await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(body) });
    }

    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success(editing ? 'Catégorie modifiée' : 'Catégorie créée');
    setDialogOpen(false);
    setSaving(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Catégorie supprimée');
    fetchCategories();
  };

  return (
    <PageShell
      title="Catégories"
      description="Gérer les catégories de produits"
      actions={
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState message="Aucune catégorie trouvée" onRetry={fetchCategories} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icône</TableHead>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell className="text-lg">{cat.icon || '-'}</TableCell>
                      <TableCell className="text-sm">{cat.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={cat.isActive ? 'default' : 'secondary'} className={cat.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifiez les informations de la catégorie' : 'Remplissez les informations pour créer une catégorie'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Restaurants"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icône (emoji)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Ex: 🍽️"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Ordre de tri</Label>
              <Input
                id="cat-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Spinner />}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Products View ────────────────────────────────────────────────────────────

function ProductsView() {
  const [search, setSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    if (merchantFilter) params.set('merchantId', merchantFilter);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    const res = await apiFetch<any>(`/api/products?${params}`);
    if (res.data) {
      setProducts(Array.isArray(res.data) ? res.data : res.data.products || []);
    }
    setLoading(false);
  }, [search, merchantFilter, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <PageShell title="Produits" description="Catalogue de produits de la plateforme">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchProducts}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState message="Aucun produit trouvé" onRetry={fetchProducts} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="hidden md:table-cell">Marchand</TableHead>
                    <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden lg:table-cell">Ventes</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.image ? (
                            <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs">?</div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{p.merchant?.businessName || '-'}</TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">{p.category?.name || '-'}</TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(p.price)}</TableCell>
                      <TableCell>
                        <Badge variant={p.stock > 0 ? 'secondary' : 'destructive'}>
                          {p.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">{p.totalSold || 0}</TableCell>
                      <TableCell>
                        <Badge variant={p.isAvailable ? 'default' : 'secondary'} className={p.isAvailable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                          {p.isAvailable ? 'Disponible' : 'Indisponible'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Coupons View ─────────────────────────────────────────────────────────────

function CouponsView() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE' as string,
    value: 0,
    minOrder: 0,
    maxUses: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/coupons');
    if (res.data) {
      setCoupons(Array.isArray(res.data) ? res.data : res.data.coupons || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openNew = () => {
    setEditing(null);
    setForm({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrder: 0,
      maxUses: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder || 0,
      maxUses: coupon.maxUses || 0,
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      ...form,
      maxUses: form.maxUses > 0 ? form.maxUses : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    };

    let res;
    if (editing) {
      res = await apiFetch(`/api/coupons/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      res = await apiFetch('/api/coupons', { method: 'POST', body: JSON.stringify(body) });
    }

    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success(editing ? 'Coupon modifié' : 'Coupon créé');
    setDialogOpen(false);
    setSaving(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Coupon supprimé');
    fetchCoupons();
  };

  const typeLabels: Record<string, string> = {
    PERCENTAGE: 'Pourcentage',
    FIXED: 'Montant fixe',
    FREE_DELIVERY: 'Livraison gratuite',
  };

  return (
    <PageShell
      title="Coupons"
      description="Gérer les codes promo et réductions"
      actions={
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau coupon</span>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : coupons.length === 0 ? (
            <EmptyState message="Aucun coupon trouvé" onRetry={fetchCoupons} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead className="hidden md:table-cell">Min. commande</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Expiration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm font-bold">{c.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[c.type] || c.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {c.type === 'FREE_DELIVERY' ? 'Gratuit' : c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value)}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{formatPrice(c.minOrder || 0)}</TableCell>
                      <TableCell className="text-sm">
                        {c.usedCount}/{c.maxUses || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? 'default' : 'secondary'} className={c.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                          {c.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le coupon' : 'Nouveau coupon'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifiez les détails du coupon' : 'Créez un nouveau code promo'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="PROMO2024"
                disabled={!!editing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                    <SelectItem value="FIXED">Montant fixe</SelectItem>
                    <SelectItem value="FREE_DELIVERY">Livraison gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">Valeur</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-min">Min. commande (FCFA)</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-max">Max. utilisations</Label>
                <Input
                  id="coupon-max"
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })}
                  placeholder="0 = illimité"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-start">Date début</Label>
                <Input
                  id="coupon-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-end">Date fin</Label>
                <Input
                  id="coupon-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.code} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Spinner />}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Subscriptions View ───────────────────────────────────────────────────────

function SubscriptionsView() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/plans');
    if (res.data) {
      setPlans(Array.isArray(res.data) ? res.data : res.data.plans || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return (
    <PageShell title="Abonnements" description="Plans d'abonnement pour les marchands">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="mb-2 h-5 w-24" />
                <Skeleton className="mb-2 h-8 w-20" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent>
              <EmptyState message="Aucun plan d'abonnement trouvé" onRetry={fetchPlans} />
            </CardContent>
          </Card>
        ) : (
          plans.sort((a: any, b: any) => a.priority - b.priority).map((plan: any) => {
            let features: string[] = [];
            try { features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || []; } catch { /* empty */ }
            return (
              <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'} className={plan.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                      {plan.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">{formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground"> / {plan.duration} jours</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Max produits: {plan.maxProducts || '∞'}</div>
                    <div>Max commandes: {plan.maxOrders || '∞'}</div>
                    <div>Max coupons: {plan.maxCoupons || '∞'}</div>
                    <div>Slug: <span className="font-mono">{plan.slug}</span></div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PageShell>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

function SettingsView() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<Record<string, any>>('/api/settings');
    if (res.data) {
      const map: Record<string, any> = {};
      const arr = Array.isArray(res.data) ? res.data : [];
      arr.forEach((s: any) => {
        let val = s.value;
        if (s.type === 'NUMBER') val = parseFloat(val);
        if (s.type === 'BOOLEAN') val = val === 'true' || val === true;
        try { if (s.type === 'JSON') val = JSON.parse(val); } catch { /* keep string */ }
        map[s.key] = val;
      });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success('Paramètres sauvegardés');
    setSaving(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapigo-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exportée');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        setSettings(imported);
        toast.success('Configuration importée (non sauvegardée)');
      } catch {
        toast.error('Fichier invalide');
      }
    };
    input.click();
  };

  const handleResetData = async () => {
    const res = await apiFetch('/api/settings/reset-data', { method: 'POST' });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Données réinitialisées avec succès');
    setResetOpen(false);
    fetchSettings();
  };

  const S = (key: string, fallback: any = '') => settings[key] ?? fallback;

  if (loading) {
    return (
      <PageShell title="Paramètres" description="Configuration de la plateforme">
        <LoadingCards count={3} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Paramètres"
      description="Configuration de la plateforme Rapigo"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setResetOpen(true)}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving && <Spinner />}
            Sauvegarder
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="delivery">Livraison</TabsTrigger>
          <TabsTrigger value="payment">Paiement</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Général */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paramètres généraux</CardTitle>
              <CardDescription>Informations de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom de l'application</Label>
                <Input value={S('app_name', 'Rapigo Mali')} onChange={(e) => updateSetting('app_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input value={S('country', 'Mali')} onChange={(e) => updateSetting('country', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email de support</Label>
                <Input value={S('support_email', '')} onChange={(e) => updateSetting('support_email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone de support</Label>
                <Input value={S('support_phone', '')} onChange={(e) => updateSetting('support_phone', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taux de commissions</CardTitle>
              <CardDescription>Configurer les commissions prélevées sur les transactions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Taux par défaut (%)</Label>
                <Input
                  type="number"
                  value={S('default_commission_rate', 10)}
                  onChange={(e) => updateSetting('default_commission_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Commission minimum (FCFA)</Label>
                <Input
                  type="number"
                  value={S('min_commission', 0)}
                  onChange={(e) => updateSetting('min_commission', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Taux livreur (%)</Label>
                <Input
                  type="number"
                  value={S('driver_commission_rate', 15)}
                  onChange={(e) => updateSetting('driver_commission_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Livraison */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paramètres de livraison</CardTitle>
              <CardDescription>Frais et zones de livraison</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Frais par défaut (FCFA)</Label>
                <Input
                  type="number"
                  value={S('default_delivery_fee', 500)}
                  onChange={(e) => updateSetting('default_delivery_fee', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Rayon max (km)</Label>
                <Input
                  type="number"
                  value={S('max_delivery_radius', 15)}
                  onChange={(e) => updateSetting('max_delivery_radius', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Seuil livraison gratuite (FCFA)</Label>
                <Input
                  type="number"
                  value={S('free_delivery_threshold', 5000)}
                  onChange={(e) => updateSetting('free_delivery_threshold', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paiement */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Méthodes de paiement</CardTitle>
              <CardDescription>Activer ou désactiver les méthodes de paiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'payment_cash', label: 'Cash', icon: '💵' },
                { key: 'payment_orange_money', label: 'Orange Money', icon: '🟠' },
                { key: 'payment_moov_money', label: 'Moov Money', icon: '🔵' },
                { key: 'payment_wave', label: 'Wave', icon: '🌊' },
                { key: 'payment_visa', label: 'Visa', icon: '💳' },
                { key: 'payment_mastercard', label: 'Mastercard', icon: '💳' },
                { key: 'payment_qr_code', label: 'QR Code', icon: '📱' },
                { key: 'payment_wallet', label: 'Portefeuille', icon: '👛' },
              ].map((method) => (
                <div key={method.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </div>
                  <Switch
                    checked={S(method.key, method.key === 'payment_cash')}
                    onCheckedChange={(checked) => updateSetting(method.key, checked)}
                  />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Exiger une preuve de paiement</p>
                  <p className="text-xs text-muted-foreground">Les clients doivent envoyer une capture d'écran</p>
                </div>
                <Switch
                  checked={S('require_payment_proof', true)}
                  onCheckedChange={(checked) => updateSetting('require_payment_proof', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paramètres de sécurité</CardTitle>
              <CardDescription>Configuration de l'authentification et des sessions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Tentatives max de connexion</Label>
                <Input
                  type="number"
                  value={S('max_login_attempts', 5)}
                  onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée de session (heures)</Label>
                <Input
                  type="number"
                  value={S('session_duration', 24)}
                  onChange={(e) => updateSetting('session_duration', parseInt(e.target.value) || 24)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration OTP (secondes)</Label>
                <Input
                  type="number"
                  value={S('otp_expiry', 300)}
                  onChange={(e) => updateSetting('otp_expiry', parseInt(e.target.value) || 300)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canaux de notification</CardTitle>
              <CardDescription>Gérer les canaux d'envoi de notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'notifications_email', label: 'Notifications par email', icon: Mail, desc: 'Envoyer des emails pour les commandes et mises à jour' },
                { key: 'notifications_sms', label: 'Notifications par SMS', icon: Phone, desc: 'Envoyer des SMS pour les vérifications et alertes' },
                { key: 'notifications_push', label: 'Notifications push', icon: Bell, desc: 'Notifications en temps réel sur l\'appareil' },
              ].map((channel) => {
                const Icon = channel.icon;
                return (
                  <div key={channel.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{channel.label}</p>
                        <p className="text-xs text-muted-foreground">{channel.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={S(channel.key, true)}
                      onCheckedChange={(checked) => updateSetting(channel.key, checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les données</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de la plateforme (commandes, utilisateurs, produits, etc.)
              seront supprimées et les données par défaut seront restaurées. Êtes-vous sûr ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ─── Audit Logs View ──────────────────────────────────────────────────────────

function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/audit-logs');
    if (res.data) {
      setLogs(Array.isArray(res.data) ? res.data : res.data.logs || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <PageShell
      title="Journaux d'audit"
      description="Historique des actions sur la plateforme"
      actions={
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState message="Aucun journal d'audit trouvé" onRetry={fetchLogs} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entité</TableHead>
                    <TableHead className="hidden md:table-cell">Détails</TableHead>
                    <TableHead className="hidden lg:table-cell">IP</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {log.user?.firstName || '-'} {log.user?.lastName || ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity}</TableCell>
                      <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground md:table-cell">
                        {log.details || '-'}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Support View ─────────────────────────────────────────────────────────────

function SupportView() {
  const [statusFilter, setStatusFilter] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await apiFetch<any>(`/api/support?${params}`);
    if (res.data) {
      setTickets(Array.isArray(res.data) ? res.data : res.data.tickets || []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <PageShell
      title="Support"
      description="Gérer les tickets de support"
      actions={
        <Button variant="outline" size="sm" onClick={fetchTickets}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(SUPPORT_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Ouverts', count: tickets.filter((t: any) => t.status === 'OPEN').length, color: 'text-blue-600' },
          { label: 'En cours', count: tickets.filter((t: any) => t.status === 'IN_PROGRESS').length, color: 'text-yellow-600' },
          { label: 'Résolus', count: tickets.filter((t: any) => t.status === 'RESOLVED').length, color: 'text-emerald-600' },
          { label: 'Fermés', count: tickets.filter((t: any) => t.status === 'CLOSED').length, color: 'text-gray-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div>
                <p className="text-muted-foreground text-xs">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState message="Aucun ticket de support trouvé" onRetry={fetchTickets} />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{t.subject}</p>
                        <p className="max-w-48 truncate text-xs text-muted-foreground">{t.description}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.user?.firstName} {t.user?.lastName}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[t.priority] || ''}`}>
                          {PRIORITY_LABELS[t.priority] || t.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SUPPORT_STATUS_COLORS[t.status] || ''}`}>
                          {SUPPORT_STATUS_LABELS[t.status] || t.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTicket(t); setDetailOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>Ticket de support</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Utilisateur:</span>
                  <p className="font-medium">{selectedTicket.user?.firstName} {selectedTicket.user?.lastName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedTicket.user?.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Priorité:</span>
                  <p><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                    {PRIORITY_LABELS[selectedTicket.priority]}
                  </span></p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statut:</span>
                  <p><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SUPPORT_STATUS_COLORS[selectedTicket.status]}`}>
                    {SUPPORT_STATUS_LABELS[selectedTicket.status]}
                  </span></p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-medium">Description</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Créé le {new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}
                {selectedTicket.resolvedAt && ` · Résolu le ${new Date(selectedTicket.resolvedAt).toLocaleString('fr-FR')}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── View Router ──────────────────────────────────────────────────────────────

function ViewRouter() {
  const { view } = useAdminNav();

  switch (view) {
    case 'dashboard': return <DashboardView />;
    case 'users': return <UsersView />;
    case 'merchants': return <MerchantsView />;
    case 'drivers': return <DriversView />;
    case 'orders': return <OrdersView />;
    case 'payments': return <PaymentsView />;
    case 'categories': return <CategoriesView />;
    case 'products': return <ProductsView />;
    case 'coupons': return <CouponsView />;
    case 'subscriptions': return <SubscriptionsView />;
    case 'settings': return <SettingsView />;
    case 'audit-logs': return <AuditLogsView />;
    case 'support': return <SupportView />;
    default: return <DashboardView />;
  }
}

// ─── Main Admin App ───────────────────────────────────────────────────────────

export default function AdminApp() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            R
          </div>
          <div>
            <p className="text-sm font-semibold">Rapigo Admin</p>
            <p className="text-[10px] text-muted-foreground">V2.0 Enterprise</p>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="py-4">
            <SidebarNav collapsed={false} onNavigate={() => {}} />
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                R
              </div>
              <span>Rapigo Admin</span>
            </SheetTitle>
            <SheetDescription>V2.0 Enterprise</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="py-4">
              <SidebarNav collapsed={false} onNavigate={() => setSheetOpen(false)} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSheetOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <ViewRouter />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}