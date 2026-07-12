'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Store,
  Truck,
  ShoppingCart,
  CreditCard,
  Crown,
  Megaphone,
  Grid3X3,
  Package,
  Headphones,
  BarChart3,
  FileText,
  Settings,
  Bell,
  MapPin,
  Menu,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  UserPlus,
  Filter,
  Download,
  RefreshCw,
  Activity,
  DollarSign,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Ban,
  Tag,
} from 'lucide-react';

import { useAuthStore, useAdminNav, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/store';
import type { AdminView } from '@/lib/store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#059669', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4'];

interface MenuItem {
  id: AdminView;
  label: string;
  icon: React.ElementType;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'merchants', label: 'Commerçants', icon: Store },
  { id: 'drivers', label: 'Livreurs', icon: Truck },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'subscriptions', label: 'Abonnements', icon: Crown },
  { id: 'advertisements', label: 'Publicités', icon: Megaphone },
  { id: 'categories', label: 'Catégories', icon: Grid3X3 },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'audit-logs', label: "Logs d'audit", icon: FileText },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  totalMerchants: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  pendingMerchants: number;
  totalProducts: number;
  totalDeliveriesToday: number;
  avgRating: number;
  ordersByStatus: { name: string; value: number }[];
  recentOrders: any[];
  topMerchants: any[];
  revenueChart?: { month: string; revenue: number; orders: number }[];
}

// ─── Reusable hooks ────────────────────────────────────────────────────────────

function useFetch<T>(url: string, fallback: T): { data: T; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [url]);

  const refetch = useCallback(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [url]);

  return { data, loading, refetch };
}

// ─── Reusable components ──────────────────────────────────────────────────────

function PageShell({ title, description, children, actions }: { title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon?: React.ElementType }) {
  const Ic = Icon || Package;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Ic className="mb-4 h-12 w-12 opacity-30" />
      <p>{message}</p>
    </div>
  );
}

function DataTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendValue, color, bg }: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={`rounded-xl p-2.5 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1.5">
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendValue}
            </span>
            <span className="text-xs text-muted-foreground">vs semaine dernière</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--card-foreground))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function SidebarContent({
  collapsed,
  onNavigate,
  currentView,
}: {
  collapsed: boolean;
  onNavigate: (view: AdminView) => void;
  currentView: AdminView;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="font-bold text-lg tracking-tight">Rapigo Admin</h2>
            <p className="text-[11px] text-muted-foreground -mt-1">Panneau de gestion</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section at bottom */}
      <div className="border-t p-3">
        <button
          onClick={() => onNavigate('profile')}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted ${collapsed ? 'justify-center' : ''}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">Admin</p>
              <p className="truncate text-xs text-muted-foreground">admin@rapigo.ml</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView() {
  const { data: stats, loading, refetch } = useFetch<DashboardStats>('/api/stats', {
    totalUsers: 0,
    totalMerchants: 0,
    totalDrivers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    pendingMerchants: 0,
    totalProducts: 0,
    totalDeliveriesToday: 0,
    avgRating: 0,
    ordersByStatus: [],
    recentOrders: [],
    topMerchants: [],
  });

  const revenueChart = stats.revenueChart?.length
    ? stats.revenueChart
    : [
        { month: 'Lun', revenue: 1850000, orders: 245 },
        { month: 'Mar', revenue: 2100000, orders: 278 },
        { month: 'Mer', revenue: 1930000, orders: 256 },
        { month: 'Jeu', revenue: 2350000, orders: 312 },
        { month: 'Ven', revenue: 2780000, orders: 367 },
        { month: 'Sam', revenue: 3100000, orders: 410 },
        { month: 'Dim', revenue: 2450000, orders: 325 },
      ];

  const pieData = stats.ordersByStatus?.length
    ? stats.ordersByStatus
    : [
        { name: 'Livrées', value: 1245 },
        { name: 'En cours', value: 89 },
        { name: 'En attente', value: 45 },
        { name: 'Annulées', value: 32 },
        { name: 'En préparation', value: 67 },
      ];

  if (loading) {
    return (
      <PageShell title="Tableau de bord" description="Vue d'ensemble de la plateforme">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Tableau de bord"
      description="Vue d'ensemble de la plateforme"
      actions={
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers > 1000 ? `${(stats.totalUsers / 1000).toFixed(1)}K+` : stats.totalUsers.toLocaleString('fr-FR')}
          icon={Users}
          trend="up"
          trendValue="+12.5%"
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Revenus"
          value={formatPrice(stats.totalRevenue || 15000000)}
          icon={DollarSign}
          trend="up"
          trendValue="+8.2%"
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          title="Commandes"
          value={stats.totalOrders > 1000 ? `${(stats.totalOrders / 1000).toFixed(1)}K+` : stats.totalOrders.toLocaleString('fr-FR')}
          icon={ShoppingCart}
          trend="up"
          trendValue="+15.3%"
          color="text-violet-600"
          bg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          title="Livreurs actifs"
          value={stats.totalDrivers > 0 ? stats.totalDrivers.toLocaleString('fr-FR') : '200+'}
          icon={Truck}
          trend="up"
          trendValue="+5.1%"
          color="text-cyan-600"
          bg="bg-cyan-50 dark:bg-cyan-950/40"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenus sur 7 jours</CardTitle>
              <CardDescription>Évolution des revenus et commandes</CardDescription>
            </div>
            <Badge variant="secondary" className="font-normal">
              7 derniers jours
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [formatPrice(value), 'Revenus']}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Orders by Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commandes par statut</CardTitle>
            <CardDescription>Répartition des commandes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Commandes']}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {pieData.map((entry, index) => (
                  <div key={`pie-${index}-${entry.name}`} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Merchants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Meilleurs commerçants</CardTitle>
            <CardDescription>Classés par note et chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topMerchants.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {stats.topMerchants.map((merchant: any, i: number) => (
                    <div key={merchant.id || i} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{merchant.businessName || merchant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {merchant.orders || 0} commandes · {formatPrice(merchant.revenue || 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-xs font-medium">{(merchant.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="space-y-3">
                {[
                  { name: 'Le Relais Bamako', orders: 342, revenue: 4250000, rating: 4.8 },
                  { name: 'Supermarché Azalaï', orders: 289, revenue: 3680000, rating: 4.7 },
                  { name: 'Pharmacie du Fleuve', orders: 215, revenue: 2100000, rating: 4.6 },
                  { name: 'Boutique Sahel Mode', orders: 178, revenue: 1920000, rating: 4.5 },
                  { name: 'Restaurant Djenné', orders: 156, revenue: 1750000, rating: 4.4 },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.orders} commandes · {formatPrice(m.revenue)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-medium">{m.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Commandes récentes</CardTitle>
              <CardDescription>Dernières commandes passées sur la plateforme</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              Voir tout <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
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
                  {stats.recentOrders.slice(0, 8).map((order: any, i: number) => (
                    <TableRow key={order.id || i} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">#{(order.id || order.orderNumber || '').slice(-6).toUpperCase()}</TableCell>
                      <TableCell className="text-sm">{order.customerName || order.userName || '—'}</TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{order.merchant?.businessName || order.merchantName || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(order.total || order.amount || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ORDER_STATUS_COLORS[order.status] || 'bg-muted'}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="Aucune commande récente" />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Users View ───────────────────────────────────────────────────────────────

function UsersView() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: users, loading, refetch } = useFetch<any[]>(
    roleFilter !== 'all' ? `/api/users?role=${roleFilter}` : '/api/users',
    []
  );

  const filteredUsers = (users || []).filter(
    (u: any) =>
      !search ||
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = (role: string) => {
    switch (role) {
      case 'CLIENT': return 'Client';
      case 'MERCHANT': return 'Commerçant';
      case 'DRIVER': return 'Livreur';
      case 'ADMIN': return 'Admin';
      default: return role || '—';
    }
  };

  return (
    <PageShell
      title="Utilisateurs"
      description={`${(users || []).length} utilisateurs inscrits`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="CLIENT">Clients</SelectItem>
                <SelectItem value="MERCHANT">Commerçants</SelectItem>
                <SelectItem value="DRIVER">Livreurs</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={6} cols={6} /></div>
          ) : filteredUsers.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[640px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any, i: number) => (
                      <TableRow key={user.id || i} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email || '—'}</TableCell>
                        <TableCell className="text-sm">{user.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {roleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!user.isActive ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Bloqué
                            </Badge>
                          ) : user.isVerified ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Vérifié
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Non vérifié
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={user.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/users/block', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user.id, block: user.isActive }),
                                });
                                if (res.ok) {
                                  refetch();
                                  toast.success(user.isActive ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
                                } else {
                                  toast.error('Erreur');
                                }
                              } catch {
                                toast.error('Erreur');
                              }
                            }}
                          >
                            {user.isActive ? (
                              <><Ban className="mr-1.5 h-4 w-4" />Bloquer</>
                            ) : (
                              <><CheckCircle className="mr-1.5 h-4 w-4" />Débloquer</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucun utilisateur trouvé" />
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>Créer un nouveau compte administrateur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom</label>
                <Input placeholder="Prénom" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input placeholder="Nom" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="email@rapigo.ml" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rôle</label>
              <Select defaultValue="CLIENT">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => { setDialogOpen(false); toast.success('Utilisateur ajouté avec succès'); }}>
              Créer l&apos;utilisateur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Merchants View ───────────────────────────────────────────────────────────

function MerchantsView() {
  const [search, setSearch] = useState('');
  const { data: merchants, loading, refetch } = useFetch<any[]>('/api/merchants?all=true', []);

  const filtered = (merchants || []).filter(
    (m: any) =>
      !search ||
      m.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (merchant: any) => {
    try {
      const res = await fetch('/api/merchants/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, approve: true }),
      });
      if (res.ok) {
        refetch();
        toast.success('Commerçant approuvé');
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const handleReject = async (merchant: any) => {
    try {
      const res = await fetch('/api/merchants/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, approve: false }),
      });
      if (res.ok) {
        refetch();
        toast.success('Commerçant rejeté');
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <PageShell
      title="Commerçants"
      description={`${(merchants || []).length} commerçants enregistrés`}
      actions={
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un commerçant..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={5} cols={7} /></div>
          ) : filtered.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Produits</TableHead>
                      <TableHead>Revenus</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((m: any, i: number) => {
                      const isApproved = m.status === 'APPROVED' || m.isApproved;
                      const isPending = !isApproved;
                      return (
                        <TableRow key={m.id || i} className={`hover:bg-muted/50 ${isPending ? 'border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={m.user?.avatar} />
                                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                                  {(m.businessName || 'C')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{m.businessName || `${m.user?.firstName || ''} ${m.user?.lastName || ''}`}</p>
                                <p className="text-xs text-muted-foreground">{m.user?.email || '—'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{m.businessType || m.type || 'Restaurant'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium">{(m.rating || 0).toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isPending ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                En attente
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Approuvé
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{m.products?.length || m.productCount || 0}</TableCell>
                          <TableCell className="text-sm font-medium">{formatPrice(m.revenue || m.totalRevenue || 0)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {isPending ? (
                                <>
                                  <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleApprove(m)}>
                                    <CheckCircle className="mr-1.5 h-4 w-4" />Approuver
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleReject(m)}>
                                    <XCircle className="mr-1.5 h-4 w-4" />Rejeter
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <CheckCircle className="mr-1 h-3 w-3" />Approuvé
                                </Badge>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucun commerçant trouvé" />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Drivers View ─────────────────────────────────────────────────────────────

function DriversView() {
  const [search, setSearch] = useState('');
  const { data: drivers, loading, refetch } = useFetch<any[]>('/api/drivers', []);

  const filtered = (drivers || []).filter(
    (d: any) =>
      !search ||
      d.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      d.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicleType?.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = async (driver: any) => {
    try {
      const res = await fetch('/api/drivers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: driver.id, approve: true }),
      });
      if (res.ok) {
        refetch();
        toast.success('Livreur vérifié avec succès');
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const handleRejectDriver = async (driver: any) => {
    try {
      const res = await fetch('/api/drivers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: driver.id, approve: false }),
      });
      if (res.ok) {
        refetch();
        toast.success('Livreur rejeté');
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <PageShell
      title="Livreurs"
      description={`${(drivers || []).length} livreurs inscrits`}
      actions={
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un livreur..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={5} cols={7} /></div>
          ) : filtered.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[820px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Revenus</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d: any, i: number) => {
                      const isVerified = d.isVerified;
                      const firstName = d.user?.firstName || d.firstName || '';
                      const lastName = d.user?.lastName || d.lastName || '';
                      return (
                        <TableRow key={d.id || i} className={`hover:bg-muted/50 ${!isVerified ? 'border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={d.user?.avatar} />
                                <AvatarFallback className="bg-cyan-50 text-cyan-700 text-xs">
                                  {(firstName[0] || '') + (lastName[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{firstName} {lastName}</p>
                                <p className="text-xs text-muted-foreground">{d.user?.phone || d.phone || '—'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                              {d.vehicleType || d.vehicle || 'Moto'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium">{(d.rating || 0).toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isVerified ? (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Vérifié
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Non vérifié
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{d.totalDeliveries || d.deliveries || 0}</TableCell>
                          <TableCell className="text-sm font-medium">{formatPrice(d.earnings || d.totalEarnings || 0)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {isVerified ? (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <CheckCircle className="mr-1 h-3 w-3" />Vérifié
                                </Badge>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleVerify(d)}>
                                    <CheckCircle className="mr-1.5 h-4 w-4" />Vérifier
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleRejectDriver(d)}>
                                    <XCircle className="mr-1.5 h-4 w-4" />Rejeter
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
            </div>
          ) : (
            <EmptyState message="Aucun livreur trouvé" icon={Truck} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────

const ORDER_TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'PREPARING', label: 'En préparation' },
  { value: 'IN_TRANSIT', label: 'En livraison' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

function OrdersView() {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { data: orders, loading, refetch } = useFetch<any[]>('/api/orders', []);

  const filtered = (orders || []).filter((o: any) => {
    const matchSearch = !search ||
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusTab === 'all' || o.status === statusTab;
    return matchSearch && matchStatus;
  });

  return (
    <PageShell
      title="Commandes"
      description={`${(orders || []).length} commandes au total`}
      actions={
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par N°, client, commerçant..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <div className="overflow-x-auto -mx-6 px-6">
          <TabsList className="w-full justify-start">
            {ORDER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={statusTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6"><DataTableSkeleton rows={6} cols={6} /></div>
              ) : filtered.length > 0 ? (
                <div className="max-h-[520px] overflow-auto">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N°</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Commerçant</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((order: any, i: number) => {
                          const orderId = order.id || order.orderNumber || String(i);
                          const isExpanded = expandedOrder === orderId;
                          return (
                            <React.Fragment key={orderId}>
                              <TableRow
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedOrder(isExpanded ? null : orderId)}
                              >
                                <TableCell className="font-mono text-xs">#{String(orderId).slice(-6).toUpperCase()}</TableCell>
                                <TableCell className="text-sm">{order.customerName || '—'}</TableCell>
                                <TableCell className="text-sm">{order.merchant?.businessName || order.merchantName || '—'}</TableCell>
                                <TableCell className="text-sm font-medium">{formatPrice(order.total || order.amount || 0)}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={ORDER_STATUS_COLORS[order.status] || 'bg-muted'}>
                                    {ORDER_STATUS_LABELS[order.status] || order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '—'}
                                </TableCell>
                                <TableCell>
                                  <ChevronLeft className={`h-4 w-4 transition-transform text-muted-foreground ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={7} className="bg-muted/30 px-8 py-4">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground">Adresse de livraison</p>
                                        <p className="text-sm mt-0.5">{order.deliveryAddress || '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground">Livreur</p>
                                        <p className="text-sm mt-0.5">{order.driver?.user ? `${order.driver.user.firstName} ${order.driver.user.lastName}` : order.driverName || 'Non assigné'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground">Frais de livraison</p>
                                        <p className="text-sm mt-0.5">{formatPrice(order.deliveryFee || 0)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground">Notes</p>
                                        <p className="text-sm mt-0.5">{order.notes || '—'}</p>
                                      </div>
                                    </div>
                                    {order.items && order.items.length > 0 && (
                                      <div className="mt-4">
                                        <p className="mb-2 text-xs font-medium text-muted-foreground">Articles</p>
                                        <div className="space-y-1">
                                          {order.items.map((item: any, j: number) => (
                                            <div key={j} className="flex justify-between text-sm">
                                              <span>{item.name} ×{item.quantity}</span>
                                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <EmptyState message="Aucune commande trouvée" icon={ShoppingCart} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

// ─── Payments View ────────────────────────────────────────────────────────────

const MOCK_PAYMENTS = [
  { id: 'pay-001', orderId: 'ord-823451', userName: 'Amadou Diallo', amount: 12500, method: 'Orange Money', status: 'SUCCESS', createdAt: '2025-01-15T10:30:00' },
  { id: 'pay-002', orderId: 'ord-823452', userName: 'Fatoumata Traoré', amount: 8750, method: 'Moov Money', status: 'SUCCESS', createdAt: '2025-01-15T11:15:00' },
  { id: 'pay-003', orderId: 'ord-823453', userName: 'Ibrahim Keita', amount: 23000, method: 'Espèces', status: 'PENDING', createdAt: '2025-01-15T12:00:00' },
  { id: 'pay-004', orderId: 'ord-823454', userName: 'Mariam Coulibaly', amount: 5600, method: 'Orange Money', status: 'SUCCESS', createdAt: '2025-01-15T13:20:00' },
  { id: 'pay-005', orderId: 'ord-823455', userName: 'Oumar Sidibé', amount: 15800, method: 'Wallet', status: 'FAILED', createdAt: '2025-01-15T14:45:00' },
  { id: 'pay-006', orderId: 'ord-823456', userName: 'Awa Sangaré', amount: 9200, method: 'Moov Money', status: 'SUCCESS', createdAt: '2025-01-15T15:30:00' },
  { id: 'pay-007', orderId: 'ord-823457', userName: 'Moussa Dembélé', amount: 31200, method: 'Orange Money', status: 'SUCCESS', createdAt: '2025-01-15T16:10:00' },
  { id: 'pay-008', orderId: 'ord-823458', userName: 'Kadiatou Ba', amount: 7400, method: 'Espèces', status: 'PENDING', createdAt: '2025-01-15T17:00:00' },
];

function PaymentsView() {
  const [search, setSearch] = useState('');
  const { data: payments, loading } = useFetch<any[]>('/api/payments', MOCK_PAYMENTS);

  const filtered = (payments || []).filter(
    (p: any) =>
      !search ||
      p.id?.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      p.userName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <PageShell
      title="Paiements"
      description={`Total : ${formatPrice(totalAmount)}`}
      actions={
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un paiement..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={5} cols={6} /></div>
          ) : filtered.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[780px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p: any, i: number) => (
                      <TableRow key={p.id || i} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">#{(p.id || '').slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="font-mono text-xs">#{(p.orderId || '').slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="text-sm">{p.userName || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(p.amount || 0)}</TableCell>
                        <TableCell className="text-sm">{p.method || 'Mobile Money'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            p.status === 'COMPLETED' || p.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : p.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }>
                            {p.status === 'COMPLETED' || p.status === 'SUCCESS' ? 'Complété' : p.status === 'PENDING' ? 'En attente' : 'Échoué'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucun paiement trouvé" icon={CreditCard} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Subscriptions View ───────────────────────────────────────────────────────

const MOCK_SUBSCRIPTIONS = [
  { id: '1', planName: 'Starter', price: 0, activeCount: 45, description: 'Gratuit, commission 15%' },
  { id: '2', planName: 'Pro', price: 15000, activeCount: 28, description: 'Commission 10%, visibilité boostée' },
  { id: '3', planName: 'Premium', price: 35000, activeCount: 12, description: 'Commission 5%, publicités incluses' },
];

function SubscriptionsView() {
  const { data: subs } = useFetch<any[]>('/api/subscriptions', MOCK_SUBSCRIPTIONS);

  return (
    <PageShell
      title="Abonnements"
      description="Plans et abonnements marchands"
      actions={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau plan
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(subs || MOCK_SUBSCRIPTIONS).map((sub: any, i: number) => (
          <Card key={sub.id || i} className="relative overflow-hidden">
            {sub.price === 0 && (
              <div className="absolute right-3 top-3">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Populaire</Badge>
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{sub.planName || sub.name || 'Plan'}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {sub.price > 0 ? formatPrice(sub.price) : 'Gratuit'}
                    {sub.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
                  </p>
                </div>
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{sub.description || ''}</p>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abonnés actifs</span>
                  <span className="font-medium">{sub.activeCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenus mensuels</span>
                  <span className="font-medium">{formatPrice((sub.activeCount || 0) * (sub.price || 0))}</span>
                </div>
                <Progress value={(sub.activeCount || 0) * 2} className="h-1.5 mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// ─── Advertisements View ─────────────────────────────────────────────────────

const MOCK_ADS = [
  { id: '1', title: 'Promo Ramadan 2025', type: 'Bannière', status: 'ACTIVE', impressions: 45200, clicks: 3200, endDate: '2025-03-30' },
  { id: '2', title: 'Livraison gratuite weekend', type: 'Pop-up', status: 'ACTIVE', impressions: 28900, clicks: 1800, endDate: '2025-02-28' },
  { id: '3', title: 'Nouveaux restaurants', type: 'Carrousel', status: 'INACTIVE', impressions: 15600, clicks: 920, endDate: '2025-01-31' },
  { id: '4', title: 'Parrainage - Gagnez 2000 FCFA', type: 'Bannière', status: 'ACTIVE', impressions: 52100, clicks: 4100, endDate: '2025-04-15' },
];

function AdvertisementsView() {
  const [search, setSearch] = useState('');
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'POURCENTAGE',
    value: '',
    minOrderAmount: '',
    maxUsages: '',
    endDate: '',
  });
  const { data: ads, loading } = useFetch<any[]>('/api/advertisements', MOCK_ADS);
  const { data: coupons, loading: couponsLoading, refetch: refetchCoupons } = useFetch<any[]>('/api/coupons', []);

  const filtered = (ads || MOCK_ADS).filter(
    (ad: any) =>
      !search ||
      ad.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCoupon = async () => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponForm.code.toUpperCase(),
          type: couponForm.type,
          value: Number(couponForm.value),
          minOrderAmount: Number(couponForm.minOrderAmount) || 0,
          maxUsages: Number(couponForm.maxUsages) || null,
          endDate: couponForm.endDate || null,
        }),
      });
      if (res.ok) {
        toast.success('Coupon créé avec succès');
        setCouponDialogOpen(false);
        setCouponForm({ code: '', type: 'POURCENTAGE', value: '', minOrderAmount: '', maxUsages: '', endDate: '' });
        refetchCoupons();
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const couponTypeLabel = (type: string) => {
    switch (type) {
      case 'POURCENTAGE': return 'Pourcentage';
      case 'FIXED': return 'Montant fixe';
      case 'FREE_DELIVERY': return 'Livraison gratuite';
      default: return type;
    }
  };

  return (
    <PageShell
      title="Marketing"
      description="Gérer les publicités et les coupons promotionnels"
      actions={
        <Button size="sm" onClick={() => setCouponDialogOpen(true)}>
          <Tag className="mr-2 h-4 w-4" />
          Créer un coupon
        </Button>
      }
    >
      <Tabs defaultValue="advertisements">
        <TabsList>
          <TabsTrigger value="advertisements">Publicités</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="advertisements" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une publicité..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6"><DataTableSkeleton rows={4} cols={6} /></div>
              ) : filtered.length > 0 ? (
                <div className="max-h-[520px] overflow-auto">
                  <div className="min-w-[780px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titre</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Impressions</TableHead>
                          <TableHead>Clics</TableHead>
                          <TableHead>CTR</TableHead>
                          <TableHead>Date de fin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((ad: any, i: number) => (
                          <TableRow key={ad.id || i} className="hover:bg-muted/50">
                            <TableCell className="text-sm font-medium">{ad.title || '—'}</TableCell>
                            <TableCell className="text-sm">{ad.type || 'Bannière'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={
                                ad.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                              }>
                                {ad.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{(ad.impressions || 0).toLocaleString('fr-FR')}</TableCell>
                            <TableCell className="text-sm">{(ad.clicks || 0).toLocaleString('fr-FR')}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {ad.endDate ? new Date(ad.endDate).toLocaleDateString('fr-FR') : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <EmptyState message="Aucune publicité" icon={Megaphone} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Codes promotionnels</CardTitle>
              <CardDescription>{(coupons || []).length} coupons au total</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {couponsLoading ? (
                <div className="p-6"><DataTableSkeleton rows={4} cols={6} /></div>
              ) : (coupons || []).length > 0 ? (
                <div className="max-h-[520px] overflow-auto">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Valeur</TableHead>
                          <TableHead>Commande min.</TableHead>
                          <TableHead>Utilisations max</TableHead>
                          <TableHead>Date de fin</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(coupons || []).map((coupon: any, i: number) => {
                          const isActive = !coupon.endDate || new Date(coupon.endDate) >= new Date();
                          return (
                            <TableRow key={coupon.id || i} className="hover:bg-muted/50">
                              <TableCell className="font-mono text-sm font-semibold">{coupon.code || '—'}</TableCell>
                              <TableCell className="text-sm">{couponTypeLabel(coupon.type)}</TableCell>
                              <TableCell className="text-sm font-medium">
                                {coupon.type === 'FREE_DELIVERY' ? 'Gratuite' : coupon.type === 'POURCENTAGE' ? `${coupon.value}%` : formatPrice(coupon.value || 0)}
                              </TableCell>
                              <TableCell className="text-sm">{formatPrice(coupon.minOrderAmount || 0)}</TableCell>
                              <TableCell className="text-sm">{coupon.maxUsages || '∞'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('fr-FR') : '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'}>
                                  {isActive ? 'Actif' : 'Expiré'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <EmptyState message="Aucun coupon" icon={Tag} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un coupon</DialogTitle>
            <DialogDescription>Ajouter un nouveau code promotionnel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                placeholder="PROMO2025"
                className="uppercase"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={couponForm.type} onValueChange={(v) => setCouponForm({ ...couponForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POURCENTAGE">Pourcentage</SelectItem>
                  <SelectItem value="FIXED">Montant fixe</SelectItem>
                  <SelectItem value="FREE_DELIVERY">Livraison gratuite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {couponForm.type !== 'FREE_DELIVERY' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Valeur</label>
                <Input
                  type="number"
                  placeholder={couponForm.type === 'POURCENTAGE' ? '10' : '5000'}
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Commande minimum (FCFA)</label>
              <Input
                type="number"
                placeholder="0"
                value={couponForm.minOrderAmount}
                onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Utilisations max</label>
              <Input
                type="number"
                placeholder="Illimité"
                value={couponForm.maxUsages}
                onChange={(e) => setCouponForm({ ...couponForm, maxUsages: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={couponForm.endDate}
                onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleCreateCoupon} disabled={!couponForm.code}>
              Créer le coupon
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Categories View ──────────────────────────────────────────────────────────

function CategoriesView() {
  const { data: categories, loading, refetch } = useFetch<any[]>('/api/categories', []);

  return (
    <PageShell
      title="Catégories"
      description={`${(categories || []).length} catégories`}
      actions={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={5} cols={4} /></div>
          ) : (categories || []).length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Produits</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categories || []).map((cat: any, i: number) => (
                      <TableRow key={cat.id || i} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {cat.image ? (
                              <div className="h-8 w-8 rounded-lg bg-muted shrink-0" style={{ backgroundImage: `url(${cat.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Grid3X3 className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="text-sm font-medium">{cat.name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {cat.description || '—'}
                        </TableCell>
                        <TableCell className="text-sm">{cat.productCount || 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cat.isActive !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'}>
                            {cat.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => toast.info('Modification de la catégorie')}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Supprimer" onClick={() => toast.error('Catégorie supprimée')}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucune catégorie" icon={Grid3X3} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Products View ────────────────────────────────────────────────────────────

function ProductsView() {
  const [search, setSearch] = useState('');
  const { data: products, loading, refetch } = useFetch<any[]>('/api/products', []);

  const filtered = (products || []).filter(
    (p: any) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.merchantName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell
      title="Produits"
      description={`${(products || []).length} produits au total`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={6} cols={5} /></div>
          ) : filtered.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Commerçant</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p: any, i: number) => (
                      <TableRow key={p.id || i} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <div className="h-9 w-9 rounded-lg bg-muted shrink-0" style={{ backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-sm font-medium">{p.name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.merchantName || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(p.price || 0)}</TableCell>
                        <TableCell className="text-sm">{p.categoryName || (typeof p.category === 'object' && p.category?.name) || (typeof p.category === 'string' ? p.category : '—')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={p.isAvailable !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'}>
                            {p.isAvailable !== false ? 'Disponible' : 'Indisponible'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucun produit trouvé" icon={Package} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Support View ─────────────────────────────────────────────────────────────

const MOCK_TICKETS = [
  { id: '1', subject: 'Problème de livraison en retard', userName: 'Amadou Diallo', priority: 'HAUTE', status: 'OUVERT', createdAt: '2025-01-15T09:00:00', description: 'Ma commande n\'a pas été livrée après 2h' },
  { id: '2', subject: 'Remboursement non reçu', userName: 'Fatoumata Traoré', priority: 'HAUTE', status: 'EN_COURS', createdAt: '2025-01-15T10:30:00', description: 'J\'ai annulé mais pas de remboursement' },
  { id: '3', subject: 'Produit manquant dans la commande', userName: 'Ibrahim Keita', priority: 'MOYENNE', status: 'OUVERT', createdAt: '2025-01-15T11:00:00', description: 'Il manque un plat dans ma commande' },
  { id: '4', subject: 'Inscription commerçant bloquée', userName: 'Restaurant Le Mandé', priority: 'MOYENNE', status: 'RÉSOLU', createdAt: '2025-01-14T16:00:00', description: 'Documents refusés sans raison' },
  { id: '5', subject: 'Application qui crash', userName: 'Mariam Coulibaly', priority: 'BASSE', status: 'RÉSOLU', createdAt: '2025-01-14T14:00:00', description: 'App se ferme quand je cherche un produit' },
  { id: '6', subject: 'Facture incorrecte', userName: 'Oumar Sidibé', priority: 'MOYENNE', status: 'OUVERT', createdAt: '2025-01-15T12:00:00', description: 'Montant facturé différent du panier' },
];

function SupportView() {
  const [search, setSearch] = useState('');
  const { data: tickets, loading } = useFetch<any[]>('/api/support', MOCK_TICKETS);

  const filtered = (tickets || MOCK_TICKETS).filter(
    (t: any) =>
      !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.userName?.toLowerCase().includes(search.toLowerCase())
  );

  const priorityLabel = (p: string) => p === 'HAUTE' ? 'Haute' : p === 'MOYENNE' ? 'Moyenne' : 'Basse';
  const statusLabel = (s: string) => s === 'OUVERT' ? 'Ouvert' : s === 'RÉSOLU' ? 'Résolu' : 'En cours';

  return (
    <PageShell
      title="Support"
      description={`${(tickets || MOCK_TICKETS).filter((t: any) => t.status === 'OUVERT').length} tickets ouverts`}
      actions={
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ticket..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={5} cols={5} /></div>
          ) : filtered.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t: any, i: number) => (
                      <TableRow key={t.id || i} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <p className="text-sm font-medium">{t.subject || '—'}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{t.description || ''}</p>
                        </TableCell>
                        <TableCell className="text-sm">{t.userName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            t.priority === 'HAUTE'
                              ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
                              : t.priority === 'MOYENNE'
                              ? 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                              : 'border-gray-300 text-gray-600'
                          }>
                            {priorityLabel(t.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            t.status === 'OUVERT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : t.status === 'RÉSOLU' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }>
                            {statusLabel(t.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucun ticket de support" icon={Headphones} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────

const REPORT_CHART_DATA = [
  { month: 'Lun', revenue: 1850000, orders: 245, users: 12 },
  { month: 'Mar', revenue: 2100000, orders: 278, users: 8 },
  { month: 'Mer', revenue: 1930000, orders: 256, users: 15 },
  { month: 'Jeu', revenue: 2350000, orders: 312, users: 18 },
  { month: 'Ven', revenue: 2780000, orders: 367, users: 22 },
  { month: 'Sam', revenue: 3100000, orders: 410, users: 30 },
  { month: 'Dim', revenue: 2450000, orders: 325, users: 10 },
];

function ReportsView() {
  const [tab, setTab] = useState('revenue');

  return (
    <PageShell
      title="Rapports"
      description="Analyses et statistiques de la plateforme"
      actions={
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter PDF
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="growth">Croissance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenus sur 7 jours</CardTitle>
              <CardDescription>Évolution des revenus quotidiens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REPORT_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), 'Revenus']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commandes sur 7 jours</CardTitle>
              <CardDescription>Nombre de commandes quotidiennes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={REPORT_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [value, 'Commandes']}
                      contentStyle={tooltipStyle}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nouveaux utilisateurs</CardTitle>
              <CardDescription>Inscriptions quotidiennes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REPORT_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [value, 'Utilisateurs']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="users" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

// ─── Audit Logs View ──────────────────────────────────────────────────────────

const MOCK_LOGS = [
  { id: '1', userName: 'Admin Principal', action: 'MISE À JOUR', details: 'Modification des frais de livraison', ip: '41.82.156.12', createdAt: '2025-01-15T16:30:00' },
  { id: '2', userName: 'Admin Principal', action: 'APPROBATION', details: 'Approbation du commerçant Le Relais', ip: '41.82.156.12', createdAt: '2025-01-15T15:20:00' },
  { id: '3', userName: 'Système', action: 'CRÉATION', details: 'Nouveau livreur inscrit: Moussa D.', ip: '—', createdAt: '2025-01-15T14:10:00' },
  { id: '4', userName: 'Admin Principal', action: 'SUPPRESSION', details: 'Suppression de la publicité "Promo Noël"', ip: '41.82.156.12', createdAt: '2025-01-15T12:00:00' },
  { id: '5', userName: 'Système', action: 'ALERT', details: 'Tentative de connexion échouée pour user@email.com', ip: '102.156.78.90', createdAt: '2025-01-15T11:45:00' },
  { id: '6', userName: 'Admin Principal', action: 'PARAMÈTRE', details: 'Activation du mode maintenance', ip: '41.82.156.12', createdAt: '2025-01-15T10:30:00' },
  { id: '7', userName: 'Système', action: 'PAIEMENT', details: 'Paiement échoué #pay-005 - solde insuffisant', ip: '—', createdAt: '2025-01-15T09:15:00' },
  { id: '8', userName: 'Admin Principal', action: 'EXPORT', details: 'Export du rapport mensuel (PDF)', ip: '41.82.156.12', createdAt: '2025-01-15T08:00:00' },
];

function AuditLogsView() {
  const [search, setSearch] = useState('');
  const { data: logs, loading } = useFetch<any[]>('/api/audit-logs', MOCK_LOGS);

  const filtered = (logs || MOCK_LOGS).filter(
    (l: any) =>
      !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
  );

  const actionColor = (action: string) => {
    switch (action) {
      case 'APPROBATION': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'SUPPRESSION': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'ALERT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'MISE À JOUR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'CRÉATION': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
      case 'PAIEMENT': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <PageShell
      title="Logs d'audit"
      description="Historique des actions sur la plateforme"
      actions={
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><DataTableSkeleton rows={8} cols={5} /></div>
          ) : filtered.length > 0 ? (
            <div className="max-h-[520px] overflow-auto">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 50).map((log: any, i: number) => (
                      <TableRow key={log.id || i} className="hover:bg-muted/50">
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{log.userName || 'Système'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={actionColor(log.action)}>
                            {log.action || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {log.details || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ip || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState message="Aucun log d'audit" icon={FileText} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

function SettingsView() {
  // Général
  const [platformName, setPlatformName] = useState('Rapigo Mali');
  const [defaultCity, setDefaultCity] = useState('Bamako');
  // Livraison
  const [baseFee, setBaseFee] = useState('500');
  const [perKmFee, setPerKmFee] = useState('200');
  const [freeThreshold, setFreeThreshold] = useState('10000');
  // Paiement
  const [serviceFeeRate, setServiceFeeRate] = useState('5');
  const [driverCommission, setDriverCommission] = useState('20');
  // Sécurité
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  // Support
  const [supportPhone, setSupportPhone] = useState('+223 70 00 00 00');
  const [supportEmail, setSupportEmail] = useState('support@rapigo.ml');

  const handleSave = () => {
    toast.success('Paramètres enregistrés avec succès');
  };

  return (
    <PageShell
      title="Paramètres"
      description="Configuration de la plateforme"
      actions={
        <Button size="sm" onClick={handleSave}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Général */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Général</CardTitle>
            </div>
            <CardDescription>Paramètres généraux de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de la plateforme</label>
              <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ville par défaut</label>
              <Input value={defaultCity} onChange={(e) => setDefaultCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email de support</label>
              <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Téléphone de support</label>
              <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Livraison */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Livraison</CardTitle>
            </div>
            <CardDescription>Tarification de la livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Frais de base (FCFA)</label>
              <Input type="number" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
              <p className="text-xs text-muted-foreground">Frais fixe par course</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frais au kilomètre (FCFA)</label>
              <Input type="number" value={perKmFee} onChange={(e) => setPerKmFee(e.target.value)} />
              <p className="text-xs text-muted-foreground">Coût supplémentaire par km parcouru</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Seuil livraison gratuite (FCFA)</label>
              <Input type="number" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} />
              <p className="text-xs text-muted-foreground">Montant minimum de commande pour livraison gratuite</p>
            </div>
          </CardContent>
        </Card>

        {/* Paiement */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Paiement</CardTitle>
            </div>
            <CardDescription>Commissions et frais de service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Frais de service (%)</label>
              <Input type="number" value={serviceFeeRate} onChange={(e) => setServiceFeeRate(e.target.value)} />
              <p className="text-xs text-muted-foreground">Prélevé sur chaque commande client</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Commission livreur (%)</label>
              <Input type="number" value={driverCommission} onChange={(e) => setDriverCommission(e.target.value)} />
              <p className="text-xs text-muted-foreground">Part du livreur sur les frais de livraison</p>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Sécurité</CardTitle>
            </div>
            <CardDescription>Paramètres de sécurité et maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Mode maintenance</p>
                <p className="text-xs text-muted-foreground">Désactive l&apos;accès client à la plateforme</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Approbation automatique</p>
                <p className="text-xs text-muted-foreground">Approuver les nouveaux commerçants automatiquement</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
            {maintenanceMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30"
              >
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">⚠️ Mode maintenance actif</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">Les clients ne peuvent pas accéder à l&apos;application.</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Notifications View ───────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Nouveau commerçant inscrit', message: 'Restaurant Le Sahel a soumis une demande d\'inscription.', isRead: false, createdAt: '2025-01-15T16:30:00', type: 'warning' },
  { id: '2', title: 'Paiement échoué', message: 'Le paiement #pay-005 a échoué pour cause de solde insuffisant.', isRead: false, createdAt: '2025-01-15T15:00:00', type: 'error' },
  { id: '3', title: 'Objectif hebdomadaire atteint', message: 'La plateforme a dépassé 300 commandes cette semaine !', isRead: false, createdAt: '2025-01-15T12:00:00', type: 'success' },
  { id: '4', title: 'Nouveau livreur vérifié', message: 'Moussa Dembélé a été vérifié et est maintenant en ligne.', isRead: true, createdAt: '2025-01-15T10:00:00', type: 'info' },
  { id: '5', title: 'Rapport mensuel disponible', message: 'Le rapport de décembre 2024 est prêt à être consulté.', isRead: true, createdAt: '2025-01-14T09:00:00', type: 'info' },
  { id: '6', title: 'Alerte sécurité', message: '3 tentatives de connexion échouées détectées.', isRead: true, createdAt: '2025-01-14T08:30:00', type: 'error' },
];

function NotificationsView() {
  const { data: notifications } = useFetch<any[]>('/api/notifications', MOCK_NOTIFICATIONS);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30';
      case 'error': return 'bg-red-100 text-red-600 dark:bg-red-900/30';
      case 'success': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
    }
  };

  return (
    <PageShell
      title="Notifications"
      description={`${(notifications || MOCK_NOTIFICATIONS).filter((n: any) => !n.isRead).length} non lues`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Toutes les notifications marquées comme lues')}
        >
          Tout marquer comme lu
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <div className="divide-y">
              {(notifications || MOCK_NOTIFICATIONS).map((n: any, i: number) => (
                <div
                  key={n.id || i}
                  className={`flex gap-4 p-4 transition-colors hover:bg-muted/50 ${!n.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${!n.isRead ? 'bg-primary/10' : typeIcon(n.type || 'info')}`}>
                    <Bell className={`h-4 w-4 ${!n.isRead ? 'text-primary' : ''}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title || 'Notification'}</p>
                      {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{n.message || n.body || ''}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Cities View ──────────────────────────────────────────────────────────────

const MOCK_CITIES = [
  { id: '1', name: 'Bamako', region: 'District de Bamako', merchantCount: 145, driverCount: 89, isActive: true },
  { id: '2', name: 'Ségou', region: 'Région de Ségou', merchantCount: 32, driverCount: 18, isActive: true },
  { id: '3', name: 'Mopti', region: 'Région de Mopti', merchantCount: 21, driverCount: 12, isActive: true },
  { id: '4', name: 'Kayes', region: 'Région de Kayes', merchantCount: 15, driverCount: 8, isActive: true },
  { id: '5', name: 'Sikasso', region: 'Région de Sikasso', merchantCount: 18, driverCount: 10, isActive: false },
  { id: '6', name: 'Koulikoro', region: 'Région de Koulikoro', merchantCount: 12, driverCount: 7, isActive: true },
  { id: '7', name: 'Gao', region: 'Région de Gao', merchantCount: 8, driverCount: 4, isActive: false },
  { id: '8', name: 'Tombouctou', region: 'Région de Tombouctou', merchantCount: 5, driverCount: 3, isActive: false },
];

function CitiesView() {
  const [search, setSearch] = useState('');
  const { data: cities } = useFetch<any[]>('/api/cities', MOCK_CITIES);

  const filtered = (cities || MOCK_CITIES).filter(
    (c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.region?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell
      title="Villes"
      description={`${(cities || MOCK_CITIES).filter((c: any) => c.isActive).length} villes actives`}
      actions={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une ville..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-auto">
            <div className="min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ville</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Commerçants</TableHead>
                    <TableHead>Livreurs</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: any, i: number) => (
                    <TableRow key={c.id || i} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{c.name || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.region || '—'}</TableCell>
                      <TableCell className="text-sm">{c.merchantCount || 0}</TableCell>
                      <TableCell className="text-sm">{c.driverCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={c.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView() {
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell title="Profil" description="Informations de votre compte administrateur">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'AD'}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-4 text-lg font-semibold">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrateur'}
            </h3>
            <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/15">Admin</Badge>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email || 'admin@rapigo.ml'}</p>
            <Separator className="my-4 w-full" />
            <div className="grid w-full grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-primary">147</p>
                <p className="text-xs text-muted-foreground">Actions ce mois</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">98%</p>
                <p className="text-xs text-muted-foreground">Temps en ligne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations du compte</CardTitle>
            <CardDescription>Modifier vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Prénom</label>
                <Input defaultValue={user?.firstName || 'Admin'} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nom</label>
                <Input defaultValue={user?.lastName || 'Principal'} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input defaultValue={user?.email || 'admin@rapigo.ml'} type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                <Input defaultValue={user?.phone || '+223 70 00 00 00'} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nouveau mot de passe</label>
              <Input type="password" placeholder="Laisser vide pour ne pas changer" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Confirmer le mot de passe</label>
              <Input type="password" placeholder="Confirmer le nouveau mot de passe" />
            </div>
            <Button size="sm" onClick={() => toast.success('Profil mis à jour avec succès')}>
              Mettre à jour le profil
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

// ─── View Router ──────────────────────────────────────────────────────────────

function ViewRouter({ view }: { view: AdminView }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'users':
      return <UsersView />;
    case 'merchants':
      return <MerchantsView />;
    case 'drivers':
      return <DriversView />;
    case 'orders':
      return <OrdersView />;
    case 'payments':
      return <PaymentsView />;
    case 'subscriptions':
      return <SubscriptionsView />;
    case 'advertisements':
      return <AdvertisementsView />;
    case 'categories':
      return <CategoriesView />;
    case 'products':
      return <ProductsView />;
    case 'support':
      return <SupportView />;
    case 'reports':
      return <ReportsView />;
    case 'audit-logs':
      return <AuditLogsView />;
    case 'settings':
      return <SettingsView />;
    case 'notifications':
      return <NotificationsView />;
    case 'cities':
      return <CitiesView />;
    case 'profile':
      return <ProfileView />;
    default:
      return <DashboardView />;
  }
}

// ─── Main AdminApp ────────────────────────────────────────────────────────────

export default function AdminApp() {
  const { view, navigate } = useAdminNav();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (target: AdminView) => {
    navigate(target);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar shrink-0">
        <SidebarContent collapsed={false} onNavigate={handleNavigate} currentView={view} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navigation</SheetTitle>
            <SheetDescription>Navigation de l&apos;administration</SheetDescription>
          </SheetHeader>
          <SidebarContent collapsed={false} onNavigate={handleNavigate} currentView={view} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('notifications')}
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('profile')}>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">AD</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <ViewRouter key={view} view={view} />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}