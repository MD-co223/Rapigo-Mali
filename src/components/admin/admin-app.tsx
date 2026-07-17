/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingBag,
  Grid3X3,
  Package,
  Ticket,
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
  MapPin,
  ChevronDown,
  CircleUserRound,
  Database,
  Phone,
  Mail,
  Star,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  UserCheck,
  Truck,
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
  PAYMENT_STATUS_LABELS,
} from '@/lib/store';
import type { AdminView } from '@/lib/store';
import { SupportContact } from '@/components/support-contact';

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
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingMerchants: number;
  pendingDrivers: number;
  activeMerchants: number;
  activeDrivers: number;
  ordersByStatus: { name: string; value: number }[];
  recentOrders: any[];
  ordersByDay: { date: string; count: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#059669', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#ef4444', '#8b5cf6', '#14b8a6'];

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

function PaginationBar({ page, total, limit, onPageChange }: {
  page: number; total: number; limit: number; onPageChange: (p: number) => void;
}) {
  if (total <= limit) return null;
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{total} résultat(s) au total</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Précédent</Button>
        <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => onPageChange(page + 1)}>Suivant</Button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'merchants', label: 'Commerçants', icon: Store },
  { id: 'drivers', label: 'Livreurs', icon: Bike },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'categories', label: 'Catégories', icon: Grid3X3 },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'audit-logs', label: "Journal d'audit", icon: FileText },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'profile', label: 'Profil', icon: CircleUserRound },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
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
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('notifications' as AdminView)}>
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

// ─── 1. Dashboard View ───────────────────────────────────────────────────────

function DashboardView() {
  const { data, loading, error, refetch } = useApiFetch<DashboardStats>('/api/stats', {
    totalUsers: 0, totalMerchants: 0, totalDrivers: 0, totalOrders: 0,
    todayOrders: 0, totalRevenue: 0, todayRevenue: 0,
    pendingMerchants: 0, pendingDrivers: 0,
    activeMerchants: 0, activeDrivers: 0,
    ordersByStatus: [], recentOrders: [], ordersByDay: [],
  });

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const pendingApprovals = (data.pendingMerchants || 0) + (data.pendingDrivers || 0);

  const statCards = [
    { label: 'Total utilisateurs', value: data.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Commerçants actifs', value: data.activeMerchants ?? data.totalMerchants, icon: Store, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Livreurs actifs', value: data.activeDrivers ?? data.totalDrivers, icon: Bike, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Commandes aujourd\'hui', value: data.todayOrders ?? data.totalOrders, icon: ShoppingBag, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Revenus du jour', value: formatPrice(data.todayRevenue ?? data.totalRevenue), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'En attente d\'approbation', value: pendingApprovals, icon: ShieldCheck, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', highlight: pendingApprovals > 0 },
  ];

  const chartData = (data.ordersByDay || []).map((d: any) => ({
    date: d.date ? new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }) : d.date || '',
    commandes: d.count || 0,
  }));

  const pieData = (data.ordersByStatus || [])
    .filter((d: any) => d.value > 0)
    .map((d: any) => ({ name: d.name, value: d.value }));

  return (
    <PageShell title="Tableau de bord" description="Vue d'ensemble de la plateforme Rapigo">
      {loading ? (
        <LoadingCards count={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((s) => (
            <Card key={s.label} className={s.highlight ? 'border-yellow-300 dark:border-yellow-700' : ''}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Commandes par jour (7 derniers jours) - LineChart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Commandes par jour (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : chartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="commandes"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ fill: '#059669', r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    name="Commandes"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Commandes par statut - PieChart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : pieData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Dernières commandes
          </CardTitle>
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
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
    const res = await apiFetch(`/api/users/${u.id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: !u.isBlocked }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success(u.isBlocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué');
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
              placeholder="Rechercher par nom, email ou téléphone..."
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
                          <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setDetailUser(u); setDetailOpen(true); }}>
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
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Actif</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '-'}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {!isSuper && (
                                <Button variant="ghost" size="sm" onClick={() => handleBlock(u)} title={u.isBlocked ? 'Débloquer' : 'Bloquer'}>
                                  {u.isBlocked ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Ban className="h-3.5 w-3.5 text-red-500" />}
                                </Button>
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

          <PaginationBar page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </Tabs>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg dark:bg-emerald-900/40 dark:text-emerald-400">
                    {detailUser.firstName?.[0]}{detailUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{detailUser.firstName} {detailUser.lastName}</p>
                  <Badge variant="outline">{ROLE_LABELS[detailUser.role] || detailUser.role}</Badge>
                  {detailUser.isSuperAdmin && <Badge className="ml-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Super Admin</Badge>}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs">Email</span>
                  <p className="font-medium">{detailUser.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Téléphone</span>
                  <p className="font-medium">{detailUser.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Vérifié</span>
                  <p className="font-medium">{detailUser.isVerified ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Inscription</span>
                  <p className="font-medium">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Statut</span>
                  <p className="font-medium">{detailUser.isBlocked ? 'Bloqué' : 'Actif'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
      body: JSON.stringify({ isApproved: true }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Commerçant approuvé');
    fetchMerchants();
  };

  const handleReject = async (id: string) => {
    const res = await apiFetch(`/api/merchants/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ isApproved: false }),
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
                      <TableHead>Nom commerce</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Ville</TableHead>
                      <TableHead className="hidden md:table-cell">Note</TableHead>
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
                        <TableRow key={m.id} className={`${isPending ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''} cursor-pointer`} onClick={() => handleViewDetail(m.id)}>
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
                          <TableCell className="hidden md:table-cell">
                            {m.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-medium">{Number(m.rating).toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                  <span className="text-muted-foreground">Nom :</span>
                  <p className="font-medium">{detailData.businessName || detailData.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type :</span>
                  <p className="font-medium">{BUSINESS_TYPES[detailData.businessType] || detailData.businessType || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ville :</span>
                  <p className="font-medium">{detailData.city || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Téléphone :</span>
                  <p className="font-medium">{detailData.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email :</span>
                  <p className="font-medium">{detailData.user?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Note :</span>
                  <p className="font-medium">{detailData.rating ? `${detailData.rating}/5` : '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Produits :</span>
                  <p className="font-medium">{detailData.productCount || 0}</p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground">Description :</span>
                <p className="mt-1">{detailData.description || 'Aucune description'}</p>
              </div>
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
      body: JSON.stringify({ isApproved: true }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Livreur approuvé');
    fetchDrivers();
  };

  const handleReject = async (id: string) => {
    const res = await apiFetch(`/api/drivers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ isApproved: false }),
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Livreur rejeté');
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
                      <TableHead>Nom</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="hidden md:table-cell">Plaque</TableHead>
                      <TableHead className="hidden md:table-cell">Note</TableHead>
                      <TableHead className="hidden lg:table-cell">Livraisons</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d: any) => {
                      const isOnline = d.isOnline && d.isApproved;
                      return (
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
                            {d.plateNumber || '-'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {d.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span className="text-sm">{Number(d.rating).toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-sm lg:table-cell">
                            {d.completedOrders ?? d.deliveryCount ?? '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {d.isApproved ? (
                                isOnline ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                                    <Wifi className="h-3 w-3" /> En ligne
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 gap-1">
                                    <WifiOff className="h-3 w-3" /> Hors ligne
                                  </Badge>
                                )
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>
                              )}
                            </div>
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
    setDetailOpen(true);
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

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>Détails de la commande</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Client :</span>
                  <p className="font-medium">{selectedOrder.client?.firstName} {selectedOrder.client?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.client?.phone || ''}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Commerçant :</span>
                  <p className="font-medium">{selectedOrder.merchant?.businessName || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Livreur :</span>
                  <p className="font-medium">{selectedOrder.driver ? `${selectedOrder.driver.user?.firstName} ${selectedOrder.driver.user?.lastName}` : 'Non assigné'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total :</span>
                  <p className="font-medium">{formatPrice(selectedOrder.total)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Paiement :</span>
                  <p className="font-medium">{PAYMENT_METHODS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statut paiement :</span>
                  <p className="font-medium">{PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus] || selectedOrder.paymentStatus || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statut :</span>
                  <Badge className={`mt-1 ${ORDER_STATUS_COLORS[selectedOrder.status] || ''}`}>
                    {ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Créée le :</span>
                  <p className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('fr-FR') : '-'}</p>
                </div>
              </div>

              {/* Delivery Info */}
              <Separator />
              <div>
                <p className="mb-1 font-medium">Adresse de livraison</p>
                <p className="text-muted-foreground">{selectedOrder.deliveryAddress || '-'}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {selectedOrder.deliveryCity || '-'}{selectedOrder.deliveryQuartier ? ` — ${selectedOrder.deliveryQuartier}` : ''}
                </div>
              </div>

              {/* Order Items */}
              <Separator />
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Articles ({selectedOrder.items.length})</p>
                  <div className="max-h-48 space-y-1 overflow-y-auto">
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

              {/* Notes */}
              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Notes :</span>
                    <p className="mt-1">{selectedOrder.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── 6. Products View (read-only list) ───────────────────────────────────────

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

// ─── 7. Categories View ──────────────────────────────────────────────────────

function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/categories/${deleteId}`, { method: 'DELETE' });
    if (res.error) { toast.error(res.error); return; }
    toast.success('Catégorie supprimée');
    setDeleteId(null);
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
                            {cat.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(cat.id)}>
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
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
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

// ─── 8. Coupons View ─────────────────────────────────────────────────────────

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

// ─── 9. Support View ─────────────────────────────────────────────────────────

function SupportView() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setTickets([]);
    } else if (res.data) {
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

  const filteredTickets = priorityFilter
    ? tickets.filter((t: any) => t.priority === priorityFilter)
    : tickets;

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
        <Select value={priorityFilter || 'all'} onValueChange={(v) => setPriorityFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toutes priorités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
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
          ) : filteredTickets.length === 0 ? (
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
                  {filteredTickets.map((t: any) => (
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

      {/* Informations de support développeur */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <SupportContact />
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
                  <span className="text-muted-foreground">Utilisateur :</span>
                  <p className="font-medium">{selectedTicket.user?.firstName} {selectedTicket.user?.lastName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email :</span>
                  <p className="font-medium">{selectedTicket.user?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Priorité :</span>
                  <p><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                    {PRIORITY_LABELS[selectedTicket.priority]}
                  </span></p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statut :</span>
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

// ─── 10. Audit Logs View ─────────────────────────────────────────────────────

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
      title="Journal d'audit"
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
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden md:table-cell">Entité</TableHead>
                    <TableHead className="hidden lg:table-cell">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-'}
                      </TableCell>
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

// ─── 11. Settings View ───────────────────────────────────────────────────────

function SettingsView() {
  const [rawSettings, setRawSettings] = useState<any[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

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

  const getGroupSettings = (group: string) => rawSettings.filter((s: any) => (s.group || 'GENERAL') === group);

  const GROUP_LABELS: Record<string, string> = {
    GENERAL: 'Général',
    PAYMENT: 'Paiement',
    DELIVERY: 'Livraison',
    COMMISSION: 'Commission',
    SECURITY: 'Sécurité',
    NOTIFICATION: 'Notifications',
  };

  const GROUP_ICONS: Record<string, React.ElementType> = {
    GENERAL: Settings,
    PAYMENT: TrendingUp,
    DELIVERY: Truck,
    COMMISSION: Star,
    SECURITY: ShieldCheck,
    NOTIFICATION: Bell,
  };

  const groups = ['GENERAL', 'PAYMENT', 'DELIVERY', 'COMMISSION', 'SECURITY'];

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
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving && <Spinner />}
          Sauvegarder
        </Button>
      }
    >
      <Tabs defaultValue="GENERAL" className="space-y-6">
        <TabsList className="flex-wrap">
          {groups.map((g) => {
            const Icon = GROUP_ICONS[g] || Settings;
            return (
              <TabsTrigger key={g} value={g} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {GROUP_LABELS[g] || g}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {groups.map((group) => {
          const items = getGroupSettings(group);
          if (items.length === 0) return null;
          return (
            <TabsContent key={group} value={group}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {(() => { const Icon = GROUP_ICONS[group] || Settings; return <Icon className="h-4 w-4 text-emerald-600" />; })()}
                    Paramètres {GROUP_LABELS[group]?.toLowerCase() || group.toLowerCase()}
                  </CardTitle>
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
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
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
            <AlertDialogAction onClick={() => { setResetOpen(false); toast.info('Fonctionnalité non disponible dans cette version'); }} className="bg-red-600 hover:bg-red-700">
              <AlertTriangle className="mr-1 h-4 w-4" />
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ─── 12. Profile View ────────────────────────────────────────────────────────

function ProfileView() {
  const { user, logout } = useAuthStore();
  const { navigate } = useAdminNav();

  const handleLogout = () => {
    logout();
    navigate('dashboard');
  };

  return (
    <PageShell title="Mon profil" description="Informations du compte administrateur">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
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

        {/* Support Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="h-4 w-4 text-emerald-600" />
              Assistance &amp; Contact
            </CardTitle>
            <CardDescription>Pour toute question technique ou besoin de support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold">Mr. Diarra Moussa</p>
                  <p className="text-sm text-muted-foreground">Responsable technique Rapigo</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <a
                  href="tel:+22377163862"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Phone className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium">+223 77 16 38 62</p>
                  </div>
                </a>

                <a
                  href="mailto:diarramoussaka7@gmail.com"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">diarramoussaka7@gmail.com</p>
                  </div>
                </a>

                <a
                  href="https://wa.me/22377163862?text=%2ABonjour%20Mr.%20Diarra%20Moussa%2A%2C%20je%20vous%20contacte%20depuis%20le%20panneau%20d%27administration%20Rapigo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <LifeBuoy className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="text-sm font-medium">Envoyer un message</p>
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <MapPin className="h-3 w-3" />
                Bamako, Mali
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
    case 'products': return <ProductsView />;
    case 'categories': return <CategoriesView />;
    case 'coupons': return <CouponsView />;
    case 'support': return <SupportView />;
    case 'audit-logs': return <AuditLogsView />;
    case 'settings': return <SettingsView />;
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
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            R
          </div>
          <div>
            <p className="text-sm font-semibold">Rapigo Admin</p>
            <p className="text-[10px] text-muted-foreground">V2.4 Mali</p>
          </div>
        </div>
        <ScrollArea className="flex-1">
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
            <SheetDescription>V2.4 Mali</SheetDescription>
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