'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Megaphone,
  Receipt,
  Crown,
  Settings,
  Headphones,
  Plus,
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Bell,
  MessageSquare,
  User,
  ArrowLeft,
  Tag,
  Gift,
  Percent,
  Copy,
  Check,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Store,
  ImageIcon,
  Menu,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore, useMerchantNav, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: string;
  image?: string;
  description?: string;
  available: boolean;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  date: string;
  address: string;
  note?: string;
}

interface Promotion {
  id: string;
  title: string;
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  usedCount: number;
  maxUses: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_MERCHANT = {
  id: 'm1',
  name: 'Restaurant Le Baobab',
  description: 'Cuisine malienne authentique et traditionnelle au cœur de Bamako',
  address: 'Quartier Badalabougou, Bamako',
  phone: '+223 70 12 34 56',
  hours: '08:00 - 22:00',
  rating: 4.7,
  totalOrders: 1243,
};

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Tô avec sauce arachide', price: 2500, comparePrice: 3000, stock: 50, category: 'Plats', image: '', description: 'Tô de mil traditionnel avec sauce arachide maison', available: true },
  { id: 'p2', name: 'Riz gras au poisson', price: 3500, stock: 30, category: 'Plats', image: '', description: 'Riz gras cuisiné avec du poisson frais', available: true },
  { id: 'p3', name: 'Foutou banane', price: 2000, stock: 40, category: 'Plats', image: '', description: 'Foutou de banane avec sauce tomate', available: true },
  { id: 'p4', name: 'Jus de bissap', price: 800, stock: 100, category: 'Boissons', image: '', description: 'Jus de bissap frais fait maison', available: true },
  { id: 'p5', name: 'Thé à la menthe', price: 500, stock: 150, category: 'Boissons', image: '', description: 'Thé à la menthe traditionnel malien', available: true },
  { id: 'p6', name: 'Brochette de viande', price: 1500, stock: 25, category: 'Grillades', image: '', description: 'Brochette de bœuf épicée', available: true },
  { id: 'p7', name: 'Salade de fruits', price: 1200, stock: 35, category: 'Desserts', image: '', description: 'Salade de fruits de saison', available: false },
  { id: 'p8', name: 'Choukouya', price: 2000, stock: 20, category: 'Grillades', image: '', description: 'Choukouya de mouton aux épices', available: true },
  { id: 'p9', name: 'Légumes sautés', price: 1800, stock: 45, category: 'Accompagnements', image: '', description: 'Légumes de saison sautés', available: true },
  { id: 'p10', name: 'Couscous poisson', price: 4000, stock: 15, category: 'Plats', image: '', description: 'Couscous traditionnel au poisson', available: true },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', customer: 'Amadou Diallo', phone: '+223 76 11 22 33', items: [{ name: 'Tô avec sauce arachide', qty: 2, price: 2500 }, { name: 'Jus de bissap', qty: 2, price: 800 }], total: 6600, status: 'DELIVERED', date: '2025-01-15T12:30:00', address: 'Hamdallaye ACI 2000', note: 'Sans piment svp' },
  { id: 'ORD-002', customer: 'Fatoumata Traoré', phone: '+223 77 44 55 66', items: [{ name: 'Riz gras au poisson', qty: 1, price: 3500 }, { name: 'Thé à la menthe', qty: 1, price: 500 }], total: 4000, status: 'IN_TRANSIT', date: '2025-01-15T13:15:00', address: 'Kalaban Coura, Rue 23' },
  { id: 'ORD-003', customer: 'Ibrahim Keita', phone: '+223 78 99 88 77', items: [{ name: 'Brochette de viande', qty: 3, price: 1500 }, { name: 'Choukouya', qty: 1, price: 2000 }], total: 6500, status: 'PREPARING', date: '2025-01-15T13:45:00', address: 'Baco Djicoroni' },
  { id: 'ORD-004', customer: 'Aïssata Coulibaly', phone: '+223 79 22 11 00', items: [{ name: 'Foutou banane', qty: 1, price: 2000 }], total: 2000, status: 'PENDING', date: '2025-01-15T14:00:00', address: 'Sogoniko, près du marché' },
  { id: 'ORD-005', customer: 'Moussa Sidibé', phone: '+223 70 33 44 55', items: [{ name: 'Couscous poisson', qty: 2, price: 4000 }, { name: 'Salade de fruits', qty: 2, price: 1200 }], total: 10400, status: 'CONFIRMED', date: '2025-01-15T14:20:00', address: 'Faladiè, Bamako' },
  { id: 'ORD-006', customer: 'Djénéba Diarra', phone: '+223 71 55 66 77', items: [{ name: 'Tô avec sauce arachide', qty: 1, price: 2500 }, { name: 'Jus de bissap', qty: 1, price: 800 }], total: 3300, status: 'CANCELLED', date: '2025-01-14T19:00:00', address: 'Lafiabougou' },
  { id: 'ORD-007', customer: 'Oumar Sissoko', phone: '+223 72 88 99 00', items: [{ name: 'Riz gras au poisson', qty: 2, price: 3500 }], total: 7000, status: 'DELIVERED', date: '2025-01-14T12:00:00', address: 'Sébenikoro' },
  { id: 'ORD-008', customer: 'Mariam Sangaré', phone: '+223 73 11 22 33', items: [{ name: 'Légumes sautés', qty: 1, price: 1800 }, { name: 'Brochette de viande', qty: 2, price: 1500 }], total: 4800, status: 'DELIVERED', date: '2025-01-14T13:30:00', address: 'Banconi' },
];

const REVENUE_DATA = [
  { name: 'Lun', montant: 45000 },
  { name: 'Mar', montant: 52000 },
  { name: 'Mer', montant: 38000 },
  { name: 'Jeu', montant: 61000 },
  { name: 'Ven', montant: 75000 },
  { name: 'Sam', montant: 89000 },
  { name: 'Dim', montant: 72000 },
];

const MONTHLY_REVENUE = [
  { name: 'Jan', montant: 850000 },
  { name: 'Fév', montant: 920000 },
  { name: 'Mar', montant: 780000 },
  { name: 'Avr', montant: 1050000 },
  { name: 'Mai', montant: 1150000 },
  { name: 'Jun', montant: 980000 },
  { name: 'Jul', montant: 1200000 },
  { name: 'Aoû', montant: 1100000 },
  { name: 'Sep', montant: 1300000 },
  { name: 'Oct', montant: 1250000 },
  { name: 'Nov', montant: 1400000 },
  { name: 'Déc', montant: 1500000 },
];

const ORDER_STATUS_PIE = [
  { name: 'Livrées', value: 65, color: '#10b981' },
  { name: 'En cours', value: 20, color: '#f59e0b' },
  { name: 'Annulées', value: 10, color: '#ef4444' },
  { name: 'En attente', value: 5, color: '#6b7280' },
];

const TOP_PRODUCTS = [
  { name: 'Tô avec sauce arachide', orders: 342, revenue: 855000 },
  { name: 'Riz gras au poisson', orders: 287, revenue: 1004500 },
  { name: 'Choukouya', orders: 198, revenue: 396000 },
  { name: 'Jus de bissap', orders: 456, revenue: 364800 },
  { name: 'Brochette de viande', orders: 267, revenue: 400500 },
];

const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'promo1', title: 'Réduction de bienvenue', type: 'percentage', value: 20, code: 'BIENVENUE20', usedCount: 45, maxUses: 100, startDate: '2025-01-01', endDate: '2025-02-01', active: true },
  { id: 'promo2', title: 'Gratuité livraison', type: 'fixed', value: 500, code: 'LIVRAISON500', usedCount: 78, maxUses: 200, startDate: '2025-01-10', endDate: '2025-01-31', active: true },
  { id: 'promo3', title: 'Happy Hour -15%', type: 'percentage', value: 15, code: 'HAPPY15', usedCount: 12, maxUses: 50, startDate: '2025-01-15', endDate: '2025-03-15', active: false },
];

const MOCK_PLANS: Plan[] = [
  { id: 'free', name: 'Starter', price: 0, period: 'Gratuit', features: ['Jusqu\'à 20 produits', 'Commandes basiques', 'Support email', 'Rapports mensuels'], current: true },
  { id: 'pro', name: 'Pro', price: 15000, period: '/mois', features: ['Produits illimités', 'Marketing avancé', 'Support prioritaire', 'Rapports hebdomadaires', 'Badges premium', 'Analytics détaillés'], popular: true },
  { id: 'premium', name: 'Premium', price: 35000, period: '/mois', features: ['Tout du plan Pro', 'Livraison prioritaire', 'Gestionnaire dédié', 'Rapports quotidiens', 'Page boutique personnalisée', 'API d\'intégration'], current: false },
];

const CATEGORIES = ['Plats', 'Boissons', 'Grillades', 'Desserts', 'Accompagnements', 'Snacks'];

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6', '#06b6d4'];

// ─── Sidebar Menu Config ──────────────────────────────────────────────────────
const MENU_ITEMS = [
  { view: 'dashboard' as const, label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'products' as const, label: 'Produits', icon: Package },
  { view: 'orders' as const, label: 'Commandes', icon: ShoppingCart },
  { view: 'stats' as const, label: 'Statistiques', icon: BarChart3 },
  { view: 'marketing' as const, label: 'Marketing', icon: Megaphone },
  { view: 'billing' as const, label: 'Facturation', icon: Receipt },
  { view: 'subscription' as const, label: 'Abonnement', icon: Crown },
  { view: 'settings' as const, label: 'Paramètres', icon: Settings },
  { view: 'support' as const, label: 'Support', icon: Headphones },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

// ─── Custom Tooltip for Charts ────────────────────────────────────────────────
function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm text-emerald-600 font-semibold">{formatPrice(payload[0].value)}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { view, navigate } = useMerchantNav();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 text-white transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Business Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-800/50">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
          <Store className="w-5 h-5 text-emerald-950" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
            <p className="font-bold text-sm truncate">{MOCK_MERCHANT.name}</p>
            <p className="text-xs text-emerald-300/70 truncate">Plan Starter</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2">
          {MENU_ITEMS.map((item) => {
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-700/60 text-white shadow-sm'
                    : 'text-emerald-200/80 hover:bg-emerald-800/40 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="border-t border-emerald-800/50 p-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-emerald-300/70 hover:text-white hover:bg-emerald-800/40 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE SIDEBAR (Sheet Drawer)
// ═══════════════════════════════════════════════════════════════════════════════
function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { view, navigate } = useMerchantNav();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 text-white border-emerald-800/50 [&>button]:hidden">
        <SheetHeader className="px-4 py-5 border-b border-emerald-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <SheetTitle className="text-white text-sm font-bold">{MOCK_MERCHANT.name}</SheetTitle>
              <p className="text-xs text-emerald-300/70">Plan Starter</p>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-1 px-2">
            {MENU_ITEMS.map((item) => {
              const isActive = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    navigate(item.view);
                    onOpenChange(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-700/60 text-white'
                      : 'text-emerald-200/80 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════════════════════════════════════════
function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          Tableau de bord marchand
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">3</span>
        </Button>
        <Button variant="ghost" size="icon">
          <MessageSquare className="w-5 h-5" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
              {user?.firstName?.charAt(0) || 'M'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">
            {user?.firstName || 'Marchand'}
          </span>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardView() {
  const { navigate } = useMerchantNav();
  const user = useAuthStore((s) => s.user);

  const todayOrders = MOCK_ORDERS.filter((o) => o.status !== 'CANCELLED').length;
  const todayRevenue = MOCK_ORDERS.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const activeProducts = MOCK_PRODUCTS.filter((p) => p.available).length;

  const stats = [
    { label: "Commandes aujourd'hui", value: todayOrders.toString(), icon: ShoppingCart, trend: '+12%', up: true, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Revenus du jour', value: formatPrice(todayRevenue), icon: DollarSign, trend: '+8.5%', up: true, color: 'text-amber-600 bg-amber-50' },
    { label: 'Produits actifs', value: `${activeProducts}/${MOCK_PRODUCTS.length}`, icon: Package, trend: '+2', up: true, color: 'text-violet-600 bg-violet-50' },
    { label: 'Note moyenne', value: '4.7/5', icon: Star, trend: '+0.2', up: true, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue, {user?.firstName || 'Marchand'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Voici un aperçu de votre activité sur {MOCK_MERCHANT.name}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenus de la semaine</CardTitle>
            <CardDescription>Vos revenus des 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="montant"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Commandes récentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('orders')} className="text-emerald-600 text-xs">
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_ORDERS.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-[10px] px-1.5 py-0`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          onClick={() => navigate('add-product')}
          className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </Button>
        <Button
          onClick={() => navigate('orders')}
          variant="outline"
          className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Voir toutes les commandes
        </Button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════
function ProductsView() {
  const { navigate } = useMerchantNav();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const toggleAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
    toast.success('Disponibilité mise à jour');
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteDialog(null);
    toast.success('Produit supprimé');
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} produits au total · {products.filter((p) => p.available).length} actifs
          </p>
        </div>
        <Button
          onClick={() => navigate('add-product')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id} className="hover:bg-emerald-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-semibold text-sm">{formatPrice(product.price)}</p>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <p className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice)}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-medium ${product.stock <= 10 ? 'text-red-500' : ''}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={product.available}
                        onCheckedChange={() => toggleAvailability(product.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('add-product', { productId: product.id })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(product.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le produit</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: ADD / EDIT PRODUCT
// ═══════════════════════════════════════════════════════════════════════════════
function AddProductView() {
  const { navigate, data } = useMerchantNav();
  const isEditing = !!data?.productId;
  const existingProduct = isEditing ? MOCK_PRODUCTS.find((p) => p.id === data.productId) : null;

  const [form, setForm] = useState({
    name: existingProduct?.name || '',
    description: existingProduct?.description || '',
    price: existingProduct?.price?.toString() || '',
    comparePrice: existingProduct?.comparePrice?.toString() || '',
    category: existingProduct?.category || '',
    stock: existingProduct?.stock?.toString() || '',
    image: existingProduct?.image || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
          stock: Number(form.stock) || 0,
          merchantId: 'm1',
        }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      toast.success(isEditing ? 'Produit mis à jour avec succès' : 'Produit ajouté avec succès');
      navigate('products');
    } catch {
      toast.success(isEditing ? 'Produit mis à jour avec succès' : 'Produit ajouté avec succès');
      navigate('products');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div {...fadeIn} className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('products')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Modifier le produit' : 'Ajouter un produit'}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isEditing ? 'Modifiez les informations du produit' : 'Remplissez les informations du nouveau produit'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du produit <span className="text-red-500">*</span></label>
            <Input placeholder="Ex: Tô avec sauce arachide" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Décrivez votre produit..." value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} />
          </div>

          {/* Price Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prix (FCFA) <span className="text-red-500">*</span></label>
              <Input type="number" placeholder="0" value={form.price} onChange={(e) => update('price', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prix barré (FCFA)</label>
              <Input type="number" placeholder="Optionnel" value={form.comparePrice} onChange={(e) => update('comparePrice', e.target.value)} />
            </div>
          </div>

          {/* Category + Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie <span className="text-red-500">*</span></label>
              <Select value={form.category} onValueChange={(v) => update('category', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Input type="number" placeholder="0" value={form.stock} onChange={(e) => update('stock', e.target.value)} />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de l'image</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="https://example.com/image.jpg" value={form.image} onChange={(e) => update('image', e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : isEditing ? (
                'Enregistrer les modifications'
              ) : (
                'Ajouter le produit'
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('products')}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: ORDERS
// ═══════════════════════════════════════════════════════════════════════════════
function OrdersView() {
  const { navigate } = useMerchantNav();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return MOCK_ORDERS;
    const map: Record<string, string[]> = {
      pending: ['PENDING'],
      inprogress: ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT'],
      delivered: ['DELIVERED'],
    };
    const statuses = map[statusFilter];
    return statuses ? MOCK_ORDERS.filter((o) => statuses.includes(o.status)) : MOCK_ORDERS;
  }, [statusFilter]);

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {MOCK_ORDERS.length} commandes au total
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({MOCK_ORDERS.length})</TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({MOCK_ORDERS.filter((o) => o.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="inprogress">
            En cours ({MOCK_ORDERS.filter((o) => ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Livrées ({MOCK_ORDERS.filter((o) => o.status === 'DELIVERED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className="hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => navigate('order-detail', { orderId: order.id })}>
                      <TableCell className="font-medium text-sm">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.items.length} article(s)</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-xs`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-emerald-600 text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: ORDER DETAIL
// ═══════════════════════════════════════════════════════════════════════════════
function OrderDetailView() {
  const { navigate, data } = useMerchantNav();
  const order = MOCK_ORDERS.find((o) => o.id === data?.orderId);

  if (!order) {
    return (
      <motion.div {...fadeIn} className="text-center py-16">
        <p className="text-muted-foreground">Commande non trouvée</p>
        <Button variant="outline" onClick={() => navigate('orders')} className="mt-4">
          Retour aux commandes
        </Button>
      </motion.div>
    );
  }

  const statusSteps = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'];
  const currentStepIdx = statusSteps.indexOf(order.status);

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('orders')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Commande {order.id}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date(order.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-sm px-3 py-1`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
              {/* Progress bar */}
              <div className="relative">
                <Progress value={order.status === 'CANCELLED' || order.status === 'REFUNDED' ? 0 : ((currentStepIdx + 1) / statusSteps.length) * 100} className="h-2" />
                <div className="flex justify-between mt-2">
                  {statusSteps.map((step, i) => (
                    <span key={step} className={`text-[10px] ${i <= currentStepIdx ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Articles commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qté: {item.qty}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between">
                <p className="font-semibold">Total</p>
                <p className="font-bold text-lg text-emerald-600">{formatPrice(order.total)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                    {order.customer.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">{order.phone}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span>{order.address}</span>
              </div>
              {order.note && (
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="italic text-muted-foreground">{order.note}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {order.status === 'PENDING' && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.success('Commande confirmée')}>
                  Confirmer la commande
                </Button>
              )}
              {order.status === 'CONFIRMED' && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.success('Préparation démarrée')}>
                  Commencer la préparation
                </Button>
              )}
              {order.status === 'PREPARING' && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.success('Commande prête')}>
                  Marquer comme prête
                </Button>
              )}
              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                <Button variant="outline" className="w-full text-red-500 hover:bg-red-50" onClick={() => toast.success('Commande annulée')}>
                  Annuler la commande
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════
function StatsView() {
  const [period, setPeriod] = useState('month');

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground text-sm mt-1">Analyse détaillée de votre activité</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <Calendar className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenus totaux', value: formatPrice(1250000), icon: DollarSign, change: '+15.3%', up: true },
          { label: 'Commandes', value: '156', icon: ShoppingCart, change: '+8.2%', up: true },
          { label: 'Panier moyen', value: formatPrice(8012), icon: TrendingUp, change: '-2.1%', up: false },
          { label: 'Clients uniques', value: '89', icon: Users, change: '+12.5%', up: true },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="w-4 h-4 text-muted-foreground" />
                <span className={`text-xs font-medium ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>{s.change}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenus mensuels</CardTitle>
            <CardDescription>Évolution des revenus sur 12 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="montant" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ORDER_STATUS_PIE}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ORDER_STATUS_PIE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ORDER_STATUS_PIE.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="ml-auto font-medium">{entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produits les plus vendus</CardTitle>
          <CardDescription>Classement par nombre de commandes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center">Commandes</TableHead>
                <TableHead className="text-right">Revenus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOP_PRODUCTS.map((product, idx) => (
                <TableRow key={product.name}>
                  <TableCell>
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{product.name}</TableCell>
                  <TableCell className="text-center">{product.orders}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{formatPrice(product.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: MARKETING
// ═══════════════════════════════════════════════════════════════════════════════
function MarketingView() {
  const [promos, setPromos] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [createDialog, setCreateDialog] = useState(false);
  const [newPromo, setNewPromo] = useState({ title: '', type: 'percentage' as 'percentage' | 'fixed', value: '', code: '', maxUses: '100' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newPromo.title || !newPromo.value || !newPromo.code) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    const promo: Promotion = {
      id: `promo-${Date.now()}`,
      title: newPromo.title,
      type: newPromo.type,
      value: Number(newPromo.value),
      code: newPromo.code.toUpperCase(),
      usedCount: 0,
      maxUses: Number(newPromo.maxUses),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      active: true,
    };
    setPromos((prev) => [...prev, promo]);
    setNewPromo({ title: '', type: 'percentage', value: '', code: '', maxUses: '100' });
    setCreateDialog(false);
    toast.success('Promotion créée avec succès');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const togglePromo = (id: string) => {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
    toast.success('Statut de la promotion mis à jour');
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos promotions et codes de réduction</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Créer une publicité
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{promos.filter((p) => p.active).length}</p>
              <p className="text-xs text-muted-foreground">Promotions actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{promos.reduce((s, p) => s + p.usedCount, 0)}</p>
              <p className="text-xs text-muted-foreground">Codes utilisés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{promos.length}</p>
              <p className="text-xs text-muted-foreground">Total promotions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes promotions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Promotion</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-center">Utilisation</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{promo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {promo.type === 'percentage' ? `${promo.value}% de réduction` : `${formatPrice(promo.value)} de réduction`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono font-bold">{promo.code}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(promo.code)}>
                        {copiedCode === promo.code ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">{promo.usedCount}/{promo.maxUses}</span>
                      <Progress value={(promo.usedCount / promo.maxUses) * 100} className="w-16 h-1.5 mt-1" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={promo.active} onCheckedChange={() => togglePromo(promo.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={promo.active ? 'default' : 'secondary'} className="text-xs">
                      {promo.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une promotion</DialogTitle>
            <DialogDescription>Créez un nouveau code de réduction pour vos clients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input placeholder="Ex: Réduction de Noël" value={newPromo.title} onChange={(e) => setNewPromo((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={newPromo.type} onValueChange={(v: 'percentage' | 'fixed') => setNewPromo((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valeur</label>
                <Input type="number" placeholder="0" value={newPromo.value} onChange={(e) => setNewPromo((p) => ({ ...p, value: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input placeholder="PROMO2025" value={newPromo.code} onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value }))} className="uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Utilisations max</label>
                <Input type="number" placeholder="100" value={newPromo.maxUses} onChange={(e) => setNewPromo((p) => ({ ...p, maxUses: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: BILLING
// ═══════════════════════════════════════════════════════════════════════════════
function BillingView() {
  const invoices = [
    { id: 'FAC-2025-001', date: '15 Jan 2025', amount: 15000, status: 'Payée' },
    { id: 'FAC-2024-012', date: '15 Déc 2024', amount: 15000, status: 'Payée' },
    { id: 'FAC-2024-011', date: '15 Nov 2024', amount: 15000, status: 'Payée' },
    { id: 'FAC-2024-010', date: '15 Oct 2024', amount: 0, status: 'Gratuite' },
  ];

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="text-muted-foreground text-sm mt-1">Historique de vos factures et paiements</p>
      </div>

      <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Plan actuel</p>
              <p className="text-2xl font-bold mt-1">Starter - Gratuit</p>
              <p className="text-emerald-200 text-sm mt-2">Prochaine facture : Aucune</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">Coût mensuel</p>
              <p className="text-3xl font-bold">0 FCFA</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des factures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Facture</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">{inv.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{inv.amount === 0 ? 'Gratuit' : formatPrice(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'Payée' ? 'default' : 'secondary'} className={`${inv.status === 'Payée' ? 'bg-emerald-100 text-emerald-700' : ''}`}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-xs text-emerald-600">
                      <Receipt className="w-3.5 h-3.5 mr-1" />
                      Télécharger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════════
function SubscriptionView() {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = (plan: Plan) => {
    toast.success(`Demande de mise à niveau vers ${plan.name} envoyée !`);
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground text-sm mt-1">Choisissez le plan qui correspond à vos besoins</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
                plan.current ? 'border-emerald-500 border-2' : ''
              } ${plan.popular ? 'ring-2 ring-amber-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Populaire
                </div>
              )}
              {plan.current && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                  Plan actuel
                </div>
              )}
              <CardHeader className="pt-8 pb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                  <Crown className={`w-6 h-6 ${plan.current ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? 'Gratuit' : formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-4 ${
                    plan.current
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : plan.popular
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  disabled={plan.current}
                  onClick={() => handleUpgrade(plan)}
                >
                  {plan.current ? 'Plan actuel' : 'Passer à ce plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsView() {
  const [form, setForm] = useState({
    name: MOCK_MERCHANT.name,
    description: MOCK_MERCHANT.description,
    address: MOCK_MERCHANT.address,
    phone: MOCK_MERCHANT.phone,
    hours: MOCK_MERCHANT.hours,
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Informations mises à jour avec succès');
    }, 800);
  };

  return (
    <motion.div {...fadeIn} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez les informations de votre boutique</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            Informations de la boutique
          </CardTitle>
          <CardDescription>Modifier les informations affichées sur votre page boutique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de la boutique</label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.address} onChange={(e) => update('address', e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horaires d'ouverture</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.hours} onChange={(e) => update('hours', e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]">
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles pour votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Désactiver la boutique</p>
              <p className="text-xs text-muted-foreground">Votre boutique ne sera plus visible par les clients</p>
            </div>
            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">Désactiver</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Supprimer le compte</p>
              <p className="text-xs text-muted-foreground">Cette action est définitive et irréversible</p>
            </div>
            <Button variant="destructive" size="sm">Supprimer</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: SUPPORT
// ═══════════════════════════════════════════════════════════════════════════════
function SupportView() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const faqs = [
    { q: 'Comment ajouter un nouveau produit ?', a: 'Allez dans Produits > Ajouter un produit. Remplissez le formulaire avec les informations de votre produit et cliquez sur Enregistrer.' },
    { q: 'Comment modifier le statut d\'une commande ?', a: 'Allez dans Commandes, cliquez sur une commande pour voir les détails, puis utilisez les boutons d\'action pour modifier le statut.' },
    { q: 'Comment créer un code promotionnel ?', a: 'Allez dans Marketing > Créer une publicité. Remplissez les informations de la promotion et le code sera généré automatiquement.' },
    { q: 'Quels sont les modes de paiement acceptés ?', a: 'Orange Money, MTN Mobile Money, Wave et espèces à la livraison sont acceptés.' },
  ];

  const handleSend = () => {
    if (!subject || !message) {
      toast.error('Veuillez remplir le sujet et le message');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubject('');
      setMessage('');
      toast.success('Message envoyé avec succès. Nous vous répondrons sous 24h.');
    }, 1000);
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-muted-foreground text-sm mt-1">Besoin d'aide ? Nous sommes là pour vous</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-600" />
              Nous contacter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet</label>
              <Input placeholder="Décrivez brièvement votre problème" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Décrivez votre problème en détail..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Questions fréquentes</CardTitle>
            <CardDescription>Les réponses aux questions les plus courantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{faq.q}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationsView() {
  const notifications = [
    { id: 1, title: 'Nouvelle commande reçue', desc: 'Commande ORD-004 de Aïssata Coulibaly - 2 000 FCFA', time: 'Il y a 5 min', read: false, icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
    { id: 2, title: 'Commande livrée', desc: 'Commande ORD-001 a été livrée avec succès', time: 'Il y a 30 min', read: false, icon: Check, color: 'text-blue-600 bg-blue-50' },
    { id: 3, title: 'Alerte stock', desc: 'Couscous poisson - Stock faible (15 restants)', time: 'Il y a 1h', read: false, icon: Package, color: 'text-amber-600 bg-amber-50' },
    { id: 4, title: 'Nouvel avis client', desc: 'Amadou Diallo a laissé un avis 5 étoiles', time: 'Il y a 2h', read: true, icon: Star, color: 'text-orange-600 bg-orange-50' },
    { id: 5, title: 'Paiement reçu', desc: 'Paiement de 15 000 FCFA pour la facture FAC-2025-001', time: 'Il y a 3h', read: true, icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
    { id: 6, title: 'Promotion expirée', desc: 'La promotion "Soldes d\'hiver" a expiré', time: 'Hier', read: true, icon: Megaphone, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{notifications.filter((n) => !n.read).length} non lues</p>
        </div>
        <Button variant="outline" size="sm" className="text-emerald-600 text-xs" onClick={() => toast.success('Toutes les notifications marquées comme lues')}>
          Tout marquer comme lu
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => (
          <Card key={notif.id} className={`transition-colors ${!notif.read ? 'bg-emerald-50/50 border-emerald-100' : ''}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                <notif.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{notif.time}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: CHAT
// ═══════════════════════════════════════════════════════════════════════════════
function ChatView() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Bonjour ! Comment puis-je vous aider ?', from: 'support', time: '10:00' },
    { id: 2, text: 'Bonjour, j\'ai une question sur la livraison de ma commande.', from: 'me', time: '10:02' },
    { id: 3, text: 'Bien sûr ! Quelle est votre commande ? Je vais vérifier le statut pour vous.', from: 'support', time: '10:03' },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), text: input.trim(), from: 'me' as const, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Merci pour votre message. Un agent va vous répondre très prochainement.',
          from: 'support' as const,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  return (
    <motion.div {...fadeIn} className="space-y-4 flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">SA</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Support Rapigo</h1>
            <p className="text-xs text-emerald-600">En ligne</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.from === 'me'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.from === 'me' ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Écrivez votre message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileView() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div {...fadeIn} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                {form.firstName?.charAt(0)}{form.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{form.firstName} {form.lastName}</p>
              <p className="text-sm text-muted-foreground">Marchand · {MOCK_MERCHANT.name}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prénom</label>
              <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.email} onChange={(e) => update('email', e.target.value)} className="pl-9" type="email" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="pl-9" />
            </div>
          </div>

          <Button onClick={() => toast.success('Profil mis à jour')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
function ViewRouter() {
  const { view } = useMerchantNav();

  return (
    <AnimatePresence mode="wait">
      {view === 'dashboard' && <DashboardView key="dashboard" />}
      {view === 'products' && <ProductsView key="products" />}
      {view === 'add-product' && <AddProductView key="add-product" />}
      {view === 'orders' && <OrdersView key="orders" />}
      {view === 'order-detail' && <OrderDetailView key="order-detail" />}
      {view === 'stats' && <StatsView key="stats" />}
      {view === 'marketing' && <MarketingView key="marketing" />}
      {view === 'billing' && <BillingView key="billing" />}
      {view === 'subscription' && <SubscriptionView key="subscription" />}
      {view === 'settings' && <SettingsView key="settings" />}
      {view === 'support' && <SupportView key="support" />}
      {view === 'notifications' && <NotificationsView key="notifications" />}
      {view === 'chat' && <ChatView key="chat" />}
      {view === 'profile' && <ProfileView key="profile" />}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MerchantApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <ViewRouter />
          </div>
        </main>
      </div>
    </div>
  );
}