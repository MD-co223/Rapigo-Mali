/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingBag,
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
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  User,
  ChevronDown,
  MapPinned,
  CircleUserRound,
  Database,
} from 'lucide-react';

import {
  useAuthStore,
  useAdminNav,
  apiFetch,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  revenueByMonth?: Record<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_COLORS = [
  '#059669', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16',
];

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  MERCHANT: 'Commerçant',
  DRIVER: 'Livreur',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const SUPPORT_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bas',
  MEDIUM: 'Moyen',
  HIGH: 'Haut',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ASSIGNED',
  'IN_TRANSIT', 'DELIVERED', 'CANCELLED',
];

interface MenuItem {
  id: AdminView;
  label: string;
  icon: React.ElementType;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'users', label: 'Utilisateurs', icon: Users },
      { id: 'merchants', label: 'Commerçants', icon: Store },
      { id: 'drivers', label: 'Livreurs', icon: Bike },
      { id: 'orders', label: 'Commandes', icon: ShoppingBag },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { id: 'categories', label: 'Catégories', icon: Grid3X3 },
      { id: 'products', label: 'Produits', icon: Package },
      { id: 'coupons', label: 'Coupons', icon: Ticket },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'subscriptions', label: 'Abonnements', icon: Crown },
      { id: 'settings', label: 'Paramètres', icon: Settings },
    ],
  },
  {
    title: 'Système',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'support', label: 'Support', icon: LifeBuoy },
      { id: 'audit-logs', label: "Journaux d'audit", icon: FileText },
      { id: 'cities', label: 'Villes', icon: MapPinned },
    ],
  },
];

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

function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
}

function PageShell({ title, description, children, actions }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      key={title}
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
      <FileText className="h-12 w-12 text-muted-foreground opacity-30" />
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { view, navigate } = useAdminNav();

  const handleNav = (id: AdminView) => {
    navigate(id);
    onNavigate?.();
  };

  return (
    <nav className="flex flex-col gap-1 px-3">
      {MENU_GROUPS.map((group) => (
        <div key={group.title} className="mb-2">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
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
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('notifications')}>
          <Bell className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-400">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.firstName} {user?.lastName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('profile')}>
              <CircleUserRound className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => { logout(); navigate('dashboard'); }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ─── CSS Bar Chart ────────────────────────────────────────────────────────────

function BarChart({ data, valueKey = 'value', labelKey = 'name', height = 200 }: {
  data: Record<string, any>[];
  valueKey?: string;
  labelKey?: string;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée</p>;
  }
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="space-y-2" style={{ height }}>
      {data.map((item, i) => {
        const val = Number(item[valueKey]) || 0;
        const pct = (val / maxVal) * 100;
        const color = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={`${item[labelKey]}-${i}`} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground text-right">
              {item[labelKey]}
            </span>
            <div className="flex-1">
              <div
                className="flex h-6 items-center rounded bg-muted/50 overflow-hidden"
              >
                <div
                  className="flex h-full items-center rounded px-2 text-xs font-medium text-white transition-all duration-500"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color, minWidth: val > 0 ? '28px' : '0' }}
                >
                  {val > 0 && <span className="truncate">{val}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 1. Dashboard View ───────────────────────────────────────────────────────

function DashboardView() {
  const { data, loading, error, refetch } = useApiFetch<DashboardStats>('/api/stats', {
    totalUsers: 0, totalMerchants: 0, totalDrivers: 0, totalOrders: 0,
    totalRevenue: 0, pendingMerchants: 0, pendingDrivers: 0,
    ordersByStatus: [], recentOrders: [], revenueByMonth: {} as Record<string, number>,
  });

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const statCards = [
    { label: 'Utilisateurs', value: data.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Commerçants', value: data.totalMerchants, icon: Store, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Livreurs', value: data.totalDrivers, icon: Bike, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Commandes', value: data.totalOrders, icon: ShoppingBag, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Revenus', value: formatPrice(data.totalRevenue), icon: Crown, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Commerçants en attente', value: data.pendingMerchants, icon: ShieldCheck, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Livreurs en attente', value: data.pendingDrivers, icon: Bike, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <PageShell title="Tableau de bord" description="Vue d'ensemble de la plateforme Rapigo">
      {loading ? (
        <LoadingCards count={7} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                  <p className="text-lg font-bold truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <BarChart data={data.ordersByStatus} labelKey="name" valueKey="value" height={220} />
            )}
          </CardContent>
        </Card>

        {/* Revenue by Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenus par mois</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <BarChart
                data={Object.entries(data.revenueByMonth || {}).map(([month, revenue]) => ({
                  month,
                  revenue: revenue as number,
                  value: Math.round((revenue as number) / 1000),
                  displayValue: formatPrice(revenue as number),
                }))}
                labelKey="month"
                valueKey="value"
                height={220}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dernières commandes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (!data.recentOrders || data.recentOrders.length === 0) ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune commande récente</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Commerçant</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.slice(0, 10).map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">#{o.orderNumber || o.id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">
                        {o.client?.firstName} {o.client?.lastName}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {o.merchant?.businessName || o.merchant?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(o.total)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${ORDER_STATUS_COLORS[o.status] || ''}`}>
                          {ORDER_STATUS_LABELS[o.status] || o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : '-'}
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

// ─── 2. Users View ───────────────────────────────────────────────────────────

function UsersView() {
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('ALL');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>(`/api/users?limit=${limit}&offset=${(page - 1) * limit}`);
    if (res.data) {
      const arr = Array.isArray(res.data) ? res.data : res.data.users || [];
      setUsers(arr);
      setTotal(res.data.total || arr.length);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q);
    const matchRole = roleTab === 'ALL' || u.role === roleTab;
    return matchSearch && matchRole;
  });

  const handleBlock = async (u: any) => {
    const action = u.isBlocked ? 'unblock' : 'block';
    const res = await apiFetch(`/api/users/${u.id}/block`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(u.isBlocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué');
    fetchUsers();
  };

  const handleSuspend = async (u: any) => {
    const res = await apiFetch(`/api/users/${u.id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ action: u.isSuspended ? 'reactivate' : 'suspend' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(u.isSuspended ? 'Utilisateur réactivé' : 'Utilisateur suspendu');
    fetchUsers();
  };

  return (
    <PageShell title="Utilisateurs" description="Gérer les utilisateurs de la plateforme" actions={
      <Button variant="outline" size="sm" onClick={fetchUsers}><RefreshCw className="h-4 w-4" /></Button>
    }>
      <Tabs value={roleTab} onValueChange={setRoleTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="ALL">Tous</TabsTrigger>
          <TabsTrigger value="CLIENT">Clients</TabsTrigger>
          <TabsTrigger value="MERCHANT">Commerçants</TabsTrigger>
          <TabsTrigger value="DRIVER">Livreurs</TabsTrigger>
          <TabsTrigger value="ADMIN">Admins</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState message="Aucun utilisateur trouvé" onRetry={fetchUsers} />
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((u: any) => {
                        const isSuper = u.isSuperAdmin || u.role === 'SUPER_ADMIN';
                        return (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs bg-muted">
                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                                  {isSuper && <p className="text-[10px] text-emerald-600 font-medium">Super Admin</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{u.email || '-'}</TableCell>
                            <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{u.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ROLE_LABELS[u.role] || u.role}</Badge>
                            </TableCell>
                            <TableCell>
                              {u.isBlocked ? (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Bloqué</Badge>
                              ) : u.isSuspended ? (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Suspendu</Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Actif</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {!isSuper && (
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleBlock(u)} title={u.isBlocked ? 'Débloquer' : 'Bloquer'}>
                                    {u.isBlocked ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Ban className="h-3.5 w-3.5 text-red-500" />}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleSuspend(u)} title={u.isSuspended ? 'Réactiver' : 'Suspendre'}>
                                    {u.isSuspended ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-yellow-500" />}
                                  </Button>
                                </div>
                              )}
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

          {total > limit && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{total} utilisateur(s) au total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </PageShell>
  );
}

// ─── 3. Merchants View ──────────────────────────────────────────────────────

function MerchantsView() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/merchants?all=true');
    if (res.data) {
      setMerchants(Array.isArray(res.data) ? res.data : res.data.merchants || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const filtered = tab === 'ALL'
    ? merchants
    : merchants.filter((m: any) => {
        if (tab === 'PENDING') return m.status === 'PENDING' || !m.isApproved;
        if (tab === 'APPROVED') return m.isApproved;
        if (tab === 'REJECTED') return m.status === 'REJECTED';
        return true;
      });

  const handleApprove = async (id: string) => {
    const res = await apiFetch(`/api/merchants/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Commerçant approuvé');
    fetchMerchants();
  };

  const handleReject = async (id: string) => {
    const res = await apiFetch(`/api/merchants/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Commerçant rejeté');
    fetchMerchants();
  };

  const handleViewDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    const res = await apiFetch<any>(`/api/merchants/${id}`);
    if (res.data) setDetailData(res.data);
    setDetailLoading(false);
  };

  return (
    <PageShell title="Commerçants" description="Gérer les commerçants de la plateforme" actions={
      <Button variant="outline" size="sm" onClick={fetchMerchants}><RefreshCw className="h-4 w-4" /></Button>
    }>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">Tous</TabsTrigger>
          <TabsTrigger value="PENDING">En attente</TabsTrigger>
          <TabsTrigger value="APPROVED">Approuvés</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejetés</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="Aucun commerçant trouvé" onRetry={fetchMerchants} />
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Ville</TableHead>
                      <TableHead className="hidden md:table-cell">Produits</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((m: any) => {
                      const isPending = !m.isApproved && m.status !== 'REJECTED';
                      const isRejected = m.status === 'REJECTED';
                      return (
                        <TableRow key={m.id} className={isPending ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <Store className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{m.businessName || m.name || '-'}</p>
                                <p className="text-xs text-muted-foreground">{m.user?.email || ''}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{BUSINESS_TYPES[m.businessType] || m.businessType || '-'}</Badge>
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {m.city || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">{m.productCount || 0}</TableCell>
                          <TableCell>
                            {isPending ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>
                            ) : isRejected ? (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejeté</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Approuvé</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isPending && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleApprove(m.id)} title="Approuver">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleReject(m.id)} title="Rejeter">
                                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetail(m.id)} title="Voir détails">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
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
      </Tabs>

      {/* Merchant Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => { setDetailId(null); setDetailData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du commerçant</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : detailData ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Nom:</span>
                  <p className="font-medium">{detailData.businessName || detailData.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{BUSINESS_TYPES[detailData.businessType] || detailData.businessType || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ville:</span>
                  <p className="font-medium">{detailData.city || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Téléphone:</span>
                  <p className="font-medium">{detailData.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{detailData.user?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Produits:</span>
                  <p className="font-medium">{detailData.productCount || 0}</p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{detailData.description || 'Aucune description'}</p>
              </div>
              {/* Merchant Products */}
              {detailData.products && detailData.products.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 font-medium">Produits ({detailData.products.length})</p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {detailData.products.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2">
                          <span className="text-sm">{p.name}</span>
                          <span className="text-sm font-medium">{formatPrice(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Impossible de charger les détails.</p>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 4. Drivers View ─────────────────────────────────────────────────────────

function DriversView() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/drivers');
    if (res.data) {
      setDrivers(Array.isArray(res.data) ? res.data : res.data.drivers || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filtered = drivers.filter((d: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${d.user?.firstName} ${d.user?.lastName}`.toLowerCase().includes(q) ||
      (d.user?.phone || '').includes(q);
    const isPending = !d.isApproved;
    const matchTab = tab === 'ALL' || (tab === 'PENDING' && isPending) || (tab === 'APPROVED' && d.isApproved);
    return matchSearch && matchTab;
  });

  const handleApprove = async (id: string) => {
    const res = await apiFetch(`/api/drivers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Livreur approuvé');
    fetchDrivers();
  };

  const handleReject = async (id: string) => {
    const res = await apiFetch(`/api/drivers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Livreur rejeté');
    fetchDrivers();
  };

  const handleBlock = async (userId: string, isBlocked: boolean) => {
    const res = await apiFetch(`/api/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ action: isBlocked ? 'unblock' : 'block' }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(isBlocked ? 'Livreur débloqué' : 'Livreur bloqué');
    fetchDrivers();
  };

  return (
    <PageShell title="Livreurs" description="Gérer les livreurs de la plateforme" actions={
      <Button variant="outline" size="sm" onClick={fetchDrivers}><RefreshCw className="h-4 w-4" /></Button>
    }>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">Tous</TabsTrigger>
          <TabsTrigger value="PENDING">En attente</TabsTrigger>
          <TabsTrigger value="APPROVED">Approuvés</TabsTrigger>
        </TabsList>

        <div className="relative mt-4 mb-4">
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
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="Aucun livreur trouvé" onRetry={fetchDrivers} />
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Livreur</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d: any) => (
                      <TableRow key={d.id} className={!d.isApproved ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-muted">
                                {d.user?.firstName?.[0]}{d.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{d.user?.firstName} {d.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">{d.user?.email || ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{d.vehicleType || '-'}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {d.user?.phone || '-'}
                        </TableCell>
                        <TableCell>
                          {d.isApproved ? (
                            d.user?.isBlocked ? (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Bloqué</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Approuvé</Badge>
                            )
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!d.isApproved && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleApprove(d.id)} title="Approuver">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleReject(d.id)} title="Rejeter">
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </>
                            )}
                            {d.isApproved && d.userId && (
                              <Button variant="ghost" size="sm" onClick={() => handleBlock(d.userId, !!d.user?.isBlocked)} title={d.user?.isBlocked ? 'Débloquer' : 'Bloquer'}>
                                {d.user?.isBlocked ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Ban className="h-3.5 w-3.5 text-red-500" />}
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
      </Tabs>
    </PageShell>
  );
}

// ─── 5. Orders View ──────────────────────────────────────────────────────────

function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/orders?limit=100');
    if (res.data) {
      setOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (o.orderNumber || '').toLowerCase().includes(q) ||
      `${o.client?.firstName} ${o.client?.lastName}`.toLowerCase().includes(q) ||
      (o.merchant?.businessName || '').toLowerCase().includes(q);
    const matchStatus = statusTab === 'ALL' || o.status === statusTab;
    return matchSearch && matchStatus;
  });

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDetailOpen(true);
  };

  const handleChangeStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setStatusLoading(true);
    const res = await apiFetch(`/api/orders/${selectedOrder.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.error) { toast.error(res.error); setStatusLoading(false); return; }
    toast.success('Statut de la commande mis à jour');
    setStatusLoading(false);
    setDetailOpen(false);
    fetchOrders();
  };

  return (
    <PageShell title="Commandes" description="Gérer toutes les commandes" actions={
      <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-4 w-4" /></Button>
    }>
      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="ALL">Toutes</TabsTrigger>
          {ORDER_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>{ORDER_STATUS_LABELS[s] || s}</TabsTrigger>
          ))}
        </TabsList>

        <div className="relative mt-4 mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, commerçant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="Aucune commande trouvée" onRetry={fetchOrders} />
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Commerçant</TableHead>
                      <TableHead className="hidden lg:table-cell">Livreur</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o: any) => (
                      <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(o)}>
                        <TableCell className="font-mono text-xs">#{o.orderNumber || o.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{o.client?.firstName} {o.client?.lastName}</TableCell>
                        <TableCell className="hidden text-sm md:table-cell">{o.merchant?.businessName || '-'}</TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">{o.driver ? `${o.driver.user?.firstName} ${o.driver.user?.lastName}` : '-'}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(o.total)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${ORDER_STATUS_COLORS[o.status] || ''}`}>
                            {ORDER_STATUS_LABELS[o.status] || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
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
      </Tabs>

      {/* Order Detail / Status Change Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Commande #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>Modifier le statut de la commande</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{selectedOrder.client?.firstName} {selectedOrder.client?.lastName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Commerçant:</span>
                  <p className="font-medium">{selectedOrder.merchant?.businessName || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Livreur:</span>
                  <p className="font-medium">{selectedOrder.driver ? `${selectedOrder.driver.user?.firstName} ${selectedOrder.driver.user?.lastName}` : 'Non assigné'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium">{formatPrice(selectedOrder.total)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Paiement:</span>
                  <p className="font-medium">{PAYMENT_METHODS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Créée le:</span>
                  <p className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('fr-FR') : '-'}</p>
                </div>
              </div>
              <Separator />
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Articles ({selectedOrder.items.length})</p>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={`${item.id}-${idx}`} className="flex items-center justify-between rounded border px-3 py-2">
                        <div>
                          <span className="text-sm">{item.name}</span>
                          {item.quantity > 1 && <span className="ml-1 text-xs text-muted-foreground">x{item.quantity}</span>}
                        </div>
                        <span className="text-sm font-medium">{formatPrice(item.price * (item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <Label>Changer le statut</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
            <Button
              onClick={handleChangeStatus}
              disabled={statusLoading || newStatus === selectedOrder?.status}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {statusLoading && <Spinner />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 6. Categories View ──────────────────────────────────────────────────────

function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', sortOrder: 0, isActive: true });
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
    setForm({ name: '', slug: '', icon: '', sortOrder: 0, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') };
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

  const handleToggle = async (cat: any) => {
    const res = await apiFetch(`/api/categories/${cat.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...cat, isActive: !cat.isActive }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(cat.isActive ? 'Catégorie désactivée' : 'Catégorie activée');
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
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icône</TableHead>
                    <TableHead className="hidden md:table-cell">Produits</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell className="text-lg">{cat.icon || '-'}</TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{cat.productCount || cat._count?.products || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(cat)}
                        >
                          <Badge variant={cat.isActive ? 'default' : 'secondary'} className={cat.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Button>
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
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Restaurants" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Ex: restaurants" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icône (emoji)</Label>
              <Input id="cat-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Ex: 🍽️" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Ordre de tri</Label>
              <Input id="cat-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
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

// ─── 7. Products View (read-only list) ───────────────────────────────────────

function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/products?limit=100');
    if (res.data) {
      setProducts(Array.isArray(res.data) ? res.data : res.data.products || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p: any) => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || (p.merchant?.businessName || '').toLowerCase().includes(q);
  });

  return (
    <PageShell title="Produits" description="Catalogue de produits de la plateforme" actions={
      <Button variant="outline" size="sm" onClick={fetchProducts}><RefreshCw className="h-4 w-4" /></Button>
    }>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-md" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="Aucun produit trouvé" onRetry={fetchProducts} />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="hidden md:table-cell">Commerçant</TableHead>
                    <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
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
                        <Badge variant={p.stock > 0 ? 'secondary' : 'destructive'}>{p.stock}</Badge>
                      </TableCell>
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

// ─── 8. Plans View (Subscriptions) ───────────────────────────────────────────

function PlansView() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', price: 0, duration: 30, features: '', maxProducts: 0, maxOrders: 0, maxCoupons: 0, priority: 0, isActive: true,
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/plans');
    if (res.data) {
      setPlans(Array.isArray(res.data) ? res.data : res.data.plans || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', price: 0, duration: 30, features: '', maxProducts: 0, maxOrders: 0, maxCoupons: 0, priority: 0, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    const features = typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features || []);
    setForm({
      name: plan.name, slug: plan.slug, price: plan.price, duration: plan.duration,
      features, maxProducts: plan.maxProducts || 0, maxOrders: plan.maxOrders || 0,
      maxCoupons: plan.maxCoupons || 0, priority: plan.priority || 0, isActive: plan.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    let featuresParsed: string[] = [];
    try { featuresParsed = JSON.parse(form.features); } catch { featuresParsed = form.features.split('\n').filter(Boolean); }
    const body = { ...form, features: JSON.stringify(featuresParsed) };
    let res;
    if (editing) {
      res = await apiFetch(`/api/plans?id=${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      res = await apiFetch('/api/plans', { method: 'POST', body: JSON.stringify(body) });
    }
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success(editing ? 'Plan modifié' : 'Plan créé');
    setDialogOpen(false);
    setSaving(false);
    fetchPlans();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/plans?id=${deleteId}`, { method: 'DELETE' });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Plan supprimé');
    setDeleteId(null);
    fetchPlans();
  };

  const parseFeatures = (f: any): string[] => {
    try { return typeof f === 'string' ? JSON.parse(f) : Array.isArray(f) ? f : []; } catch { return []; }
  };

  return (
    <PageShell
      title="Abonnements"
      description="Plans d'abonnement pour les commerçants"
      actions={
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau plan</span>
        </Button>
      }
    >
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
          plans.sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0)).map((plan: any) => {
            const features = parseFeatures(plan.features);
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
                    <div key={`feat-${plan.id}-${i}`} className="flex items-center gap-2 text-sm">
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
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(plan.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le plan' : 'Nouveau plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pro" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Ex: pro" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix (FCFA)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Durée (jours)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Max produits</Label>
                <Input type="number" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Max commandes</Label>
                <Input type="number" value={form.maxOrders} onChange={(e) => setForm({ ...form, maxOrders: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Max coupons</Label>
                <Input type="number" value={form.maxCoupons} onChange={(e) => setForm({ ...form, maxCoupons: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Caractéristiques (une par ligne)</Label>
              <Textarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder={"Produits illimités\nSupport prioritaire\nStatistiques avancées"}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordre de priorité</Label>
              <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
              <Label>Actif</Label>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le plan</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Êtes-vous sûr ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ─── 9. Coupons View ─────────────────────────────────────────────────────────

function CouponsView() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', type: 'PERCENTAGE' as string, value: 0, minOrder: 0, maxUses: 0,
    startDate: new Date().toISOString().split('T')[0], endDate: '',
  });

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
    setForm({ code: '', type: 'PERCENTAGE', value: 0, minOrder: 0, maxUses: 0, startDate: new Date().toISOString().split('T')[0], endDate: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      ...form,
      maxUses: form.maxUses > 0 ? form.maxUses : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    };
    const res = await apiFetch('/api/coupons', { method: 'POST', body: JSON.stringify(body) });
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success('Coupon créé');
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

  const typeLabels: Record<string, string> = { PERCENTAGE: 'Pourcentage', FIXED: 'Montant fixe', FREE_DELIVERY: 'Livraison gratuite' };

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
            <div className="max-h-96 overflow-y-auto">
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
                      <TableCell><Badge variant="outline">{typeLabels[c.type] || c.type}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">
                        {c.type === 'FREE_DELIVERY' ? 'Gratuit' : c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value)}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{formatPrice(c.minOrder || 0)}</TableCell>
                      <TableCell className="text-sm">{c.usedCount || 0}/{c.maxUses || '∞'}</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? 'default' : 'secondary'} className={c.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}>
                          {c.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau coupon</DialogTitle>
            <DialogDescription>Créez un nouveau code promo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO2024" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                    <SelectItem value="FIXED">Montant fixe</SelectItem>
                    <SelectItem value="FREE_DELIVERY">Livraison gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. commande (FCFA)</Label>
                <Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Max. utilisations</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} placeholder="0 = illimité" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date début</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.code} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Spinner />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 10. Settings View ───────────────────────────────────────────────────────

function SettingsView() {
  const [rawSettings, setRawSettings] = useState<any[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [dbResetOpen, setDbResetOpen] = useState(false);
  const [dbLoading, setDbLoading] = useState<'export' | 'reset' | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<any>('/api/settings');
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    if (res.data) {
      // API returns { settings: [...], grouped: {...} }
      const arr = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.settings) ? res.data.settings : []);
      setRawSettings(arr);
      const map: Record<string, any> = {};
      arr.forEach((s: any) => {
        let val = s.value;
        if (s.type === 'NUMBER') val = parseFloat(val);
        if (s.type === 'BOOLEAN') val = val === 'true' || val === true;
        try { if (s.type === 'JSON') val = JSON.parse(val); } catch { /* keep string */ }
        map[s.key] = { value: val, type: s.type, group: s.group || 'GENERAL' };
      });
      setSettingsMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const S = (key: string, fallback: any = '') => settingsMap[key]?.value ?? fallback;

  const updateSetting = (key: string, value: any) => {
    setSettingsMap((prev) => {
      const existing = prev[key];
      return { ...prev, [key]: { ...existing, value } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const settingsArr = Object.entries(settingsMap).map(([k, v]) => ({
      key: k,
      value: v.type === 'JSON' ? JSON.stringify(v.value) : String(v.value),
      type: v.type,
      group: v.group,
    }));
    const res = await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify({ settings: settingsArr }) });
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success('Paramètres sauvegardés');
    setSaving(false);
  };

  const handleExport = () => {
    const body: Record<string, any> = {};
    Object.entries(settingsMap).forEach(([k, v]) => { body[k] = v.value; });
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
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
        const newMap: Record<string, any> = {};
        Object.entries(imported).forEach(([k, v]) => {
          const existing = settingsMap[k];
          newMap[k] = { value: v, type: existing?.type || 'STRING', group: existing?.group || 'GENERAL' };
        });
        setSettingsMap((prev) => ({ ...prev, ...newMap }));
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

  const handleDbExport = async () => {
    setDbLoading('export');
    try {
      const res = await apiFetch<{ data: Record<string, unknown> }>('/api/settings/db-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'export' }),
      });
      if (res.error) { toast.error(res.error); return; }
      if (res.data?.data) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapigo-db-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Base de données exportée avec succès');
      }
    } finally {
      setDbLoading(null);
    }
  };

  const handleDbReset = async () => {
    setDbLoading('reset');
    try {
      const res = await apiFetch('/api/settings/db-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success('Base de données réinitialisée avec succès');
      setDbResetOpen(false);
      fetchSettings();
    } finally {
      setDbLoading(null);
    }
  };

  const getGroupSettings = (group: string) => rawSettings.filter((s: any) => (s.group || 'GENERAL') === group);

  const GROUP_LABELS: Record<string, string> = {
    GENERAL: 'Général',
    COMMISSION: 'Commissions',
    DELIVERY: 'Livraison',
    PAYMENT: 'Paiement',
    SECURITY: 'Sécurité',
    NOTIFICATION: 'Notifications',
  };

  const groups = ['GENERAL', 'COMMISSION', 'DELIVERY', 'PAYMENT', 'SECURITY', 'NOTIFICATION'];

  if (loading) {
    return (
      <PageShell title="Paramètres" description="Configuration de la plateforme">
        <LoadingCards count={3} />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Paramètres" description="Configuration de la plateforme">
        <ErrorState message={error} onRetry={fetchSettings} />
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
          <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Spinner />}
            Sauvegarder
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="GENERAL" className="space-y-6">
        <TabsList className="flex-wrap">
          {groups.map((g) => (
            <TabsTrigger key={g} value={g}>{GROUP_LABELS[g] || g}</TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => {
          const items = getGroupSettings(group);
          if (items.length === 0) return null;
          return (
            <TabsContent key={group} value={group}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paramètres {GROUP_LABELS[group]?.toLowerCase() || group.toLowerCase()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((s: any) => {
                    const setting = settingsMap[s.key];
                    if (!setting) return null;
                    if (setting.type === 'BOOLEAN') {
                      return (
                        <div key={s.key} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{s.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                            {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                          </div>
                          <Switch
                            checked={!!setting.value}
                            onCheckedChange={(checked) => updateSetting(s.key, checked)}
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={s.key} className="space-y-2">
                        <Label>{s.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Label>
                        <Input
                          type={setting.type === 'NUMBER' ? 'number' : 'text'}
                          value={setting.value ?? ''}
                          onChange={(e) => {
                            const v = setting.type === 'NUMBER' ? parseFloat(e.target.value) || 0 : e.target.value;
                            updateSetting(s.key, v);
                          }}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Data Management Section */}
      <Card className="mt-6 border-red-200 dark:border-red-900/30">
        <CardHeader>
          <CardTitle className="text-base text-red-600 dark:text-red-400">Gestion des données</CardTitle>
          <CardDescription>Actions dangereuses sur les données de la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Exporter les données
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" /> Importer les données
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Réinitialiser les données
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Management Section */}
      <Card className="mt-6 border-orange-200 dark:border-orange-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-600 dark:text-orange-400">
            <Database className="h-5 w-5" />
            Gestion de la base de données
          </CardTitle>
          <CardDescription>
            Exporter ou réinitialiser l'intégralité de la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDbExport}
              disabled={dbLoading !== null}
            >
              {dbLoading === 'export' ? <Spinner /> : <Database className="mr-2 h-4 w-4" />}
              {dbLoading === 'export' ? 'Export en cours…' : 'Exporter la base'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDbResetOpen(true)}
              disabled={dbLoading !== null}
            >
              {dbLoading === 'reset' ? <Spinner /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              {dbLoading === 'reset' ? 'Réinitialisation en cours…' : 'Réinitialiser la base'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les données</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de la plateforme seront supprimées. Êtes-vous sûr ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData} className="bg-red-600 hover:bg-red-700">
              <AlertTriangle className="mr-1 h-4 w-4" />
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DB Reset Confirmation */}
      <AlertDialog open={dbResetOpen} onOpenChange={setDbResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la base de données</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr ? Cette action supprimera toutes les données sauf le Super Administrateur et les paramètres système. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDbReset} className="bg-red-600 hover:bg-red-700">
              <AlertTriangle className="mr-1 h-4 w-4" />
              Réinitialiser la base
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ─── 11. Notifications View ──────────────────────────────────────────────────

function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'INFO' });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/notifications');
    if (res.data) {
      setNotifications(Array.isArray(res.data) ? res.data : res.data.notifications || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const fetchUsers = useCallback(async () => {
    const res = await apiFetch<any>('/api/users?limit=100');
    if (res.data) {
      setUsers(Array.isArray(res.data) ? res.data : res.data.users || []);
    }
  }, []);

  const openDialog = () => {
    fetchUsers();
    setForm({ userId: '', title: '', message: '', type: 'INFO' });
    setDialogOpen(true);
  };

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error('Titre et message requis'); return; }
    setSaving(true);
    const body: Record<string, any> = { title: form.title, message: form.message, type: form.type };
    if (form.userId) body.userId = form.userId;
    const res = await apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify(body) });
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success('Notification envoyée');
    setDialogOpen(false);
    setSaving(false);
    fetchNotifications();
  };

  const typeLabels: Record<string, string> = {
    INFO: 'Info',
    SUCCESS: 'Succès',
    WARNING: 'Avertissement',
    ERROR: 'Erreur',
    ORDER: 'Commande',
    PROMO: 'Promo',
  };

  const typeColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    SUCCESS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    ORDER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    PROMO: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  };

  return (
    <PageShell
      title="Notifications"
      description="Envoyer et gérer les notifications"
      actions={
        <Button onClick={openDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle notification</span>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState message="Aucune notification trouvée" onRetry={fetchNotifications} />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Lu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n: any) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium text-sm">{n.title}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[n.type] || ''}>{typeLabels[n.type] || n.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {n.user ? `${n.user.firstName} ${n.user.lastName}` : 'Tous'}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{n.message}</TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {n.isRead ? (
                          <CheckCircle className="inline h-4 w-4 text-emerald-500" />
                        ) : (
                          <div className="inline h-4 w-4 rounded-full bg-blue-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle notification</DialogTitle>
            <DialogDescription>Envoyer une notification aux utilisateurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinataire (optionnel)</Label>
              <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v === '__all__' ? '' : v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous les utilisateurs</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({ROLE_LABELS[u.role] || u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="SUCCESS">Succès</SelectItem>
                  <SelectItem value="WARNING">Avertissement</SelectItem>
                  <SelectItem value="ERROR">Erreur</SelectItem>
                  <SelectItem value="ORDER">Commande</SelectItem>
                  <SelectItem value="PROMO">Promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre de la notification" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Contenu de la notification" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSend} disabled={saving || !form.title || !form.message} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Spinner />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 12. Support View ────────────────────────────────────────────────────────

function SupportView() {
  const [statusFilter, setStatusFilter] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSupport, setHasSupport] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ subject: '', description: '', priority: 'MEDIUM' });
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await apiFetch<any>(`/api/support?${params}`);
    if (res.error && res.status === 404) {
      setHasSupport(false);
      setTickets([]);
    } else if (res.data) {
      setHasSupport(true);
      setTickets(Array.isArray(res.data) ? res.data : res.data.tickets || []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreate = async () => {
    if (!createForm.subject || !createForm.description) { toast.error('Sujet et description requis'); return; }
    setCreating(true);
    const res = await apiFetch('/api/support', {
      method: 'POST',
      body: JSON.stringify(createForm),
    });
    if (res.error) { toast.error(res.error); setCreating(false); return; }
    toast.success('Ticket créé');
    setCreateOpen(false);
    setCreating(false);
    fetchTickets();
  };

  return (
    <PageShell
      title="Support"
      description="Gérer les tickets de support"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau ticket</span>
          </Button>
        </div>
      }
    >
      {!hasSupport ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <LifeBuoy className="h-12 w-12 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Le module de support n'est pas encore disponible.</p>
            <p className="text-xs text-muted-foreground">Contactez l'équipe technique pour plus d'informations.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
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
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
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
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sujet</TableHead>
                        <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
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
                          <TableCell className="hidden text-sm md:table-cell">
                            {t.user ? `${t.user.firstName} ${t.user.lastName}` : '-'}
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
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '-'}
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
        </>
      )}

      {/* Developer support info */}
      <Card className="mt-6">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-center">Support &amp; Contact Développeur</p>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Développeur:</strong> Mr. Diarra Moussa</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Téléphone:</strong> +223 77 16 38 62</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Email:</strong> diarramoussaka7@gmail.com</span>
          </div>
          <Button
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => window.open('tel:+22377163862')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Contacter le support
          </Button>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
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
                  <p className="font-medium">{selectedTicket.user?.email || '-'}</p>
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
                Créé le {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('fr-FR') : '-'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
            <DialogDescription>Créer un ticket de support</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} placeholder="Sujet du ticket" />
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={createForm.priority} onValueChange={(v) => setCreateForm({ ...createForm, priority: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Bas</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="HIGH">Haut</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Décrivez votre problème" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.subject || !createForm.description} className="bg-emerald-600 hover:bg-emerald-700">
              {creating && <Spinner />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 13. Audit Logs View ─────────────────────────────────────────────────────

function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/audit-logs');
    if (res.data) {
      setLogs(Array.isArray(res.data) ? res.data : res.data.logs || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actions = [...new Set(logs.map((l: any) => l.action).filter(Boolean))].sort();
  const filtered = actionFilter ? logs.filter((l: any) => l.action === actionFilter) : logs;

  return (
    <PageShell
      title="Journaux d'audit"
      description="Historique des actions sur la plateforme"
      actions={
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4" /> Actualiser
        </Button>
      }
    >
      <div className="mb-4">
        <Select value={actionFilter || 'all'} onValueChange={(v) => setActionFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toutes les actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="Aucun journal d'audit trouvé" onRetry={fetchLogs} />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden md:table-cell">Entité</TableHead>
                    <TableHead className="hidden lg:table-cell">Détails</TableHead>
                    <TableHead className="hidden xl:table-cell">IP</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{log.entity}</TableCell>
                      <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground lg:table-cell">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details) || '-'}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-'}
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

// ─── 14. Cities View ─────────────────────────────────────────────────────────

function CitiesView() {
  const [rawSettings, setRawSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [editCity, setEditCity] = useState<string | null>(null);
  const [editQuartiers, setEditQuartiers] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityQuartiers, setNewCityQuartiers] = useState('');
  const [addingCity, setAddingCity] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<any>('/api/settings');
    if (res.data) {
      const arr = Array.isArray(res.data) ? res.data : [];
      setRawSettings(arr);
      const map: Record<string, any> = {};
      arr.forEach((s: any) => {
        let val = s.value;
        try { if (s.type === 'JSON') val = JSON.parse(val); } catch { /* keep */ }
        map[s.key] = { value: val, type: s.type, group: s.group };
      });
      setSettingsMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const cityKeys = rawSettings
    .filter((s: any) => s.key.startsWith('city_'))
    .sort((a: any, b: any) => a.key.localeCompare(b.key));

  const getCityName = (key: string) => key.replace('city_', '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  const getCityQuartiers = (key: string): string[] => {
    const s = settingsMap[key];
    if (!s) return [];
    if (Array.isArray(s.value)) return s.value;
    if (typeof s.value === 'string') {
      try { return JSON.parse(s.value); } catch { return s.value.split(',').map((q: string) => q.trim()).filter(Boolean); }
    }
    return [];
  };

  const openEditCity = (key: string) => {
    setEditCity(key);
    setEditQuartiers(getCityQuartiers(key).join('\n'));
  };

  const handleSaveQuartiers = async () => {
    if (!editCity) return;
    setSaving(true);
    const quartiers = editQuartiers.split('\n').map((q) => q.trim()).filter(Boolean);
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ [editCity]: quartiers }),
    });
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success('Quartiers mis à jour');
    setEditCity(null);
    setSaving(false);
    fetchSettings();
  };

  const handleAddCity = async () => {
    if (!newCityName) { toast.error('Nom de ville requis'); return; }
    setSaving(true);
    const key = `city_${newCityName.toLowerCase().replace(/\s+/g, '_')}`;
    const quartiers = newCityQuartiers.split('\n').map((q) => q.trim()).filter(Boolean);
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ [key]: quartiers }),
    });
    if (res.error) { toast.error(res.error); setSaving(false); return; }
    toast.success('Ville ajoutée');
    setAddingCity(false);
    setNewCityName('');
    setNewCityQuartiers('');
    setSaving(false);
    fetchSettings();
  };

  if (loading) {
    return (
      <PageShell title="Villes" description="Gérer les villes et quartiers">
        <LoadingCards count={3} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Villes"
      description="Gérer les villes et quartiers de livraison"
      actions={
        <Button onClick={() => setAddingCity(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter une ville</span>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cityKeys.map((cs: any) => {
          const quartiers = getCityQuartiers(cs.key);
          return (
            <Card key={cs.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {getCityName(cs.key)}
                  </CardTitle>
                  <Badge variant="secondary">{quartiers.length} quartiers</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-1">
                  {quartiers.slice(0, 6).map((q: string, i: number) => (
                    <Badge key={`${cs.key}-${q}-${i}`} variant="outline" className="text-xs">{q}</Badge>
                  ))}
                  {quartiers.length > 6 && (
                    <Badge variant="outline" className="text-xs">+{quartiers.length - 6}</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEditCity(cs.key)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier les quartiers
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cityKeys.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState message="Aucune ville configurée" onRetry={fetchSettings} />
          </CardContent>
        </Card>
      )}

      {/* Edit Quartiers Dialog */}
      <Dialog open={!!editCity} onOpenChange={() => setEditCity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les quartiers</DialogTitle>
            <DialogDescription>{editCity ? getCityName(editCity) : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Quartiers (un par ligne)</Label>
            <Textarea
              value={editQuartiers}
              onChange={(e) => setEditQuartiers(e.target.value)}
              rows={10}
              placeholder="Badalabougou\nKalaban-Coura\nHamdallaye"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCity(null)}>Annuler</Button>
            <Button onClick={handleSaveQuartiers} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Spinner />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add City Dialog */}
      <Dialog open={addingCity} onOpenChange={setAddingCity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ville</DialogTitle>
            <DialogDescription>Ajouter une ville avec ses quartiers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la ville</Label>
              <Input value={newCityName} onChange={(e) => setNewCityName(e.target.value)} placeholder="Ex: Kayes" />
            </div>
            <div className="space-y-2">
              <Label>Quartiers (un par ligne)</Label>
              <Textarea
                value={newCityQuartiers}
                onChange={(e) => setNewCityQuartiers(e.target.value)}
                rows={6}
                placeholder="Quartier 1\nQuartier 2\nQuartier 3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingCity(false)}>Annuler</Button>
            <Button onClick={handleAddCity} disabled={saving || !newCityName} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Spinner />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 15. Profile View ────────────────────────────────────────────────────────

function ProfileView() {
  const { user, logout } = useAuthStore();
  const { navigate } = useAdminNav();

  const handleLogout = () => {
    logout();
    navigate('dashboard');
  };

  return (
    <PageShell title="Mon profil" description="Informations du compte administrateur">
      <Card className="max-w-lg">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl dark:bg-emerald-900/40 dark:text-emerald-400">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className={`mt-1 ${user?.isSuperAdmin ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {user?.isSuperAdmin ? 'Super Admin' : ROLE_LABELS[user?.role || ''] || user?.role}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Nom complet</p>
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p className="text-sm font-medium">{user?.phone || 'Non renseigné'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Vérifié</p>
              <p className="text-sm font-medium">
                {user?.isVerified ? (
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Oui</span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600"><XCircle className="h-3.5 w-3.5" /> Non</span>
                )}
              </p>
            </div>
          </div>

          {user?.isSuperAdmin && (
            <>
              <Separator />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Compte Super Admin</p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80">
                      Ce compte est protégé. Il ne peut pas être modifié, bloqué, suspendu ou supprimé par un autre administrateur.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
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
    case 'categories': return <CategoriesView />;
    case 'products': return <ProductsView />;
    case 'coupons': return <CouponsView />;
    case 'subscriptions': return <PlansView />;
    case 'settings': return <SettingsView />;
    case 'notifications': return <NotificationsView />;
    case 'support': return <SupportView />;
    case 'audit-logs': return <AuditLogsView />;
    case 'cities': return <CitiesView />;
    case 'profile': return <ProfileView />;
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
            <p className="text-[10px] text-muted-foreground">V2.1 Mali</p>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="py-4">
            <SidebarNav onNavigate={() => {}} />
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
            <SheetDescription>V2.1 Mali</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="py-4">
              <SidebarNav onNavigate={() => setSheetOpen(false)} />
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