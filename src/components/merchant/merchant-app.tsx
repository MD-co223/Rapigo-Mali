'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingBag, MapPin,
  CreditCard, Crown, User, Bell, LogOut, Menu, X, ChevronLeft,
  Search, Edit, Trash2, Eye, Star, Clock, DollarSign, TrendingUp,
  Loader2, AlertCircle, ImagePlus, Send, MessageSquare, Phone,
  Mail, Globe, Map, ArrowRight, Check, ExternalLink, ChevronDown,
  RefreshCw, Store, Settings, Copy, Plus, Minus, FileText, File, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useMerchantNav, useAuthStore, useSpaceStore,
  apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_METHODS,
  BUSINESS_TYPES,
} from '@/lib/store';
import type { MerchantView } from '@/lib/store';

// ─── Types ───────────────────────────────────────────────────────────────

interface MerchantProfile {
  id: string;
  businessName: string;
  businessType: string;
  description: string;
  shortDescription: string;
  logo: string;
  coverImage: string;
  address: string;
  city: string;
  quartier: string;
  phone: string;
  email: string;
  website: string;
  operatingHours: string;
  isApproved: boolean;
  isFeatured: boolean;
  rating: number;
  totalRatings: number;
  commissionRate: number;
  minOrderAmount: number;
}

interface Product {
  id: string;
  merchantId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;
  price: number;
  comparePrice: number | null;
  currency: string;
  image: string | null;
  images: string | null;
  video: string | null;
  sku: string | null;
  barcode: string | null;
  weight: string | null;
  dimensions: string | null;
  variants: string | null;
  options: string | null;
  supplements: string | null;
  allergens: string | null;
  tags: string | null;
  brand: string | null;
  origin: string | null;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number | null;
  rating: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variants: string | null;
  supplements: string | null;
  notes: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  merchantId: string;
  driverId: string | null;
  status: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProof: string | null;
  paymentNote: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryQuartier: string | null;
  notes: string | null;
  estimatedTime: number | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  client?: { id: string; firstName: string; lastName: string; phone: string } | null;
  driver?: { id: string; firstName: string; lastName: string; phone: string; vehicleType: string; vehiclePlate: string } | null;
}

interface DeliveryZone {
  id: string;
  merchantId: string;
  city: string;
  quartier: string | null;
  fee: number;
  currency: string;
  isActive: boolean;
}

interface PaymentConfig {
  id: string;
  merchantId: string;
  method: string;
  isEnabled: boolean;
  phoneNumber: string | null;
  accountName: string | null;
  accountNumber: string | null;
  qrCode: string | null;
  instructions: string | null;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  duration: number;
  features: string | null;
  maxProducts: number | null;
  maxOrders: number | null;
  maxCoupons: number | null;
  priority: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MerchantStats {
  activeProducts: number;
  ordersToday: number;
  monthlyRevenue: number;
  averageRating: number;
  recentOrders: Order[];
}

// ─── Nav Items ───────────────────────────────────────────────────────────

const NAV_ITEMS: { view: MerchantView; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'products', label: 'Produits', icon: Package },
  { view: 'add-product', label: 'Ajouter un produit', icon: PlusCircle },
  { view: 'orders', label: 'Commandes', icon: ShoppingBag },
  { view: 'delivery-zones', label: 'Zones de livraison', icon: MapPin },
  { view: 'payment-config', label: 'Configuration paiement', icon: CreditCard },
  { view: 'subscription', label: 'Abonnement', icon: Crown },
  { view: 'profile', label: 'Profil', icon: User },
];

const ORDER_TABS = [
  { value: 'new', label: 'Nouvelles', statuses: ['PENDING', 'PAYMENT_PENDING'] },
  { value: 'preparing', label: 'En préparation', statuses: ['CONFIRMED', 'PREPARING'] },
  { value: 'ready', label: 'Prêtes', statuses: ['READY', 'ASSIGNED'] },
  { value: 'transit', label: 'En livraison', statuses: ['PICKED_UP', 'IN_TRANSIT'] },
  { value: 'completed', label: 'Terminées', statuses: ['DELIVERED'] },
  { value: 'all', label: 'Toutes', statuses: [] },
];

const PAYMENT_METHOD_LIST = ['CASH', 'ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'VISA', 'MASTERCARD', 'QR_CODE'];

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  PAYMENT_PENDING: [],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: [],
  ASSIGNED: [],
  PICKED_UP: [],
  IN_TRANSIT: [],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

// ─── Main Component ──────────────────────────────────────────────────────

export default function MerchantApp() {
  const { view, data, navigate } = useMerchantNav();
  const { user, logout: authLogout } = useAuthStore();
  const setSpace = useSpaceStore((s) => s.setSpace);

  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchMerchant = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<MerchantProfile>('/api/merchants/me');
    if (res.error || !res.data) {
      setError(res.error || 'Impossible de charger le profil');
      setLoading(false);
      return;
    }
    setMerchant(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMerchant();
  }, [fetchMerchant]);

  const handleLogout = () => {
    authLogout();
    setSpace('landing');
  };

  // ─── Waiting for approval ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-gray-600 text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <Button onClick={handleLogout} variant="outline">Se déconnecter</Button>
        </div>
      </div>
    );
  }

  if (!merchant) return null;

  if (!merchant.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="flex flex-col items-center text-center gap-6 pt-2">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">En attente d'approbation</h1>
              <p className="text-gray-600 mt-2">
                Votre compte marchand <span className="font-semibold text-emerald-700">{merchant.businessName}</span> a été
                soumis avec succès. Un administrateur doit examiner et approuver votre compte avant que vous puissiez
                accéder au tableau de bord.
              </p>
            </div>
            <Separator className="w-full" />
            <div className="w-full text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type d'activité</span>
                <span className="font-medium">{BUSINESS_TYPES[merchant.businessType] || merchant.businessType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Téléphone</span>
                <span className="font-medium">{merchant.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ville</span>
                <span className="font-medium">{merchant.city}</span>
              </div>
              {merchant.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{merchant.email}</span>
                </div>
              )}
            </div>
            <Separator className="w-full" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Veuillez patienter, l'approbation peut prendre jusqu'à 24 heures.</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchMerchant}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Approved: render app ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-30">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Store className="h-7 w-7 text-emerald-600 mr-3" />
          <span className="text-lg font-bold text-emerald-700 truncate">Rapigo Marchand</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Store className="h-7 w-7 text-emerald-600" />
                <span className="text-lg font-bold text-emerald-700">Rapigo</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => { navigate(item.view); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">{merchant.businessName}</h1>
              {view !== 'dashboard' && view !== 'add-product' && view !== 'order-detail' && (
                <button onClick={() => useMerchantNav.getState().goBack()} className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  {merchant.businessName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-emerald-700 max-w-[120px] truncate">{merchant.businessName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="p-4 lg:p-6">
          {view === 'dashboard' && <DashboardView merchant={merchant} />}
          {view === 'products' && <ProductsView merchant={merchant} />}
          {view === 'add-product' && <AddEditProductView merchant={merchant} />}
          {view === 'orders' && <OrdersView merchant={merchant} />}
          {view === 'order-detail' && <OrderDetailView merchant={merchant} />}
          {view === 'delivery-zones' && <DeliveryZonesView merchant={merchant} />}
          {view === 'payment-config' && <PaymentConfigView merchant={merchant} />}
          {view === 'subscription' && <SubscriptionView merchant={merchant} />}
          {view === 'profile' && <ProfileView merchant={merchant} onRefresh={fetchMerchant} />}
        </div>
      </main>
    </div>
  );
}

// ─── 1. Dashboard View ──────────────────────────────────────────────────

function DashboardView({ merchant }: { merchant: MerchantProfile }) {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useMerchantNav((s) => s.navigate);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await apiFetch<MerchantStats>('/api/stats/merchant');
      if (res.data) setStats(res.data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Produits actifs',
      value: stats?.activeProducts ?? 0,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Commandes aujourd\'hui',
      value: stats?.ordersToday ?? 0,
      icon: ShoppingBag,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Revenus du mois',
      value: formatPrice(stats?.monthlyRevenue ?? 0),
      icon: DollarSign,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'Note moyenne',
      value: stats?.averageRating?.toFixed(1) ?? merchant.rating.toFixed(1),
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-500 text-sm mt-1">Bienvenue, {merchant.businessName} ! Voici un aperçu de votre activité.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="py-4">
                  <CardContent className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${card.bg}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('add-product')} className="bg-emerald-600 hover:bg-emerald-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
            <Button variant="outline" onClick={() => navigate('orders')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Voir toutes les commandes
            </Button>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commandes récentes</CardTitle>
              <CardDescription>Les 10 dernières commandes</CardDescription>
            </CardHeader>
            <CardContent>
              {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                <div className="text-center py-10 text-gray-500">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>Aucune commande pour le moment</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="pb-3 font-medium text-gray-500">N°</th>
                        <th className="pb-3 font-medium text-gray-500">Client</th>
                        <th className="pb-3 font-medium text-gray-500">Total</th>
                        <th className="pb-3 font-medium text-gray-500">Statut</th>
                        <th className="pb-3 font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recentOrders.slice(0, 10).map((order) => (
                        <tr key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate('order-detail', { orderId: order.id })}>
                          <td className="py-3 font-mono text-xs text-emerald-700">#{order.orderNumber.slice(-6)}</td>
                          <td className="py-3">{order.client ? `${order.client.firstName} ${order.client.lastName}` : 'Client'}</td>
                          <td className="py-3 font-semibold">{formatPrice(order.total)}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                              {ORDER_STATUS_LABELS[order.status] || order.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500">{new Date(order.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── 2. Products View ────────────────────────────────────────────────────

function ProductsView({ merchant }: { merchant: MerchantProfile }) {
  const navigate = useMerchantNav((s) => s.navigate);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    const res = await apiFetch<Product[]>(`/api/products?merchantId=${merchant.id}`);
    if (res.data) setProducts(res.data);
    setLoading(false);
  }, [merchant.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await apiFetch(`/api/products/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    setDeleting(false);
    fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleAvailable = async (product: Product) => {
    await apiFetch(`/api/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isAvailable: !product.isAvailable }),
    });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produits</h2>
          <p className="text-gray-500 text-sm mt-1">{products.length} produit(s) au total</p>
        </div>
        <Button onClick={() => navigate('add-product')} className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter un produit
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucun produit trouvé</p>
          <p className="text-sm mt-1">Commencez par ajouter votre premier produit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className="group overflow-hidden hover:shadow-md transition-shadow">
              <div
                className="h-40 bg-gray-100 relative cursor-pointer"
                onClick={() => navigate('add-product', { productId: product.id })}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!product.isAvailable && (
                    <Badge variant="destructive" className="text-[10px]">Indisponible</Badge>
                  )}
                  {product.isFeatured && (
                    <Badge className="bg-amber-500 text-[10px]">Vedette</Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-emerald-700" onClick={() => navigate('add-product', { productId: product.id })}>
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-700">{formatPrice(product.price)}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Stock: {product.stock}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={product.isAvailable}
                    onCheckedChange={() => toggleAvailable(product)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <span className="text-xs text-gray-500">{product.isAvailable ? 'Disponible' : 'Masqué'}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate('add-product', { productId: product.id })}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(product.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le produit</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 3. Add/Edit Product View ───────────────────────────────────────────

function AddEditProductView({ merchant }: { merchant: MerchantProfile }) {
  const { data, navigate } = useMerchantNav();
  const isEdit = !!data?.productId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    price: '',
    comparePrice: '',
    stock: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    origin: '',
    preparationTime: '',
    isAvailable: true,
    isFeatured: false,
    weight: '',
    length: '',
    width: '',
    height: '',
    tags: '',
    allergens: '',
    images: '',
    video: '',
    options: '',
    supplements: '',
    variants: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await apiFetch<Category[]>('/api/categories');
      if (res.data) setCategories(res.data);
    };
    fetchCategories();

    if (isEdit && data?.productId) {
      const fetchProduct = async () => {
        const res = await apiFetch<Product>(`/api/products/${data.productId}`);
        if (res.error || !res.data) {
          setError(res.error || 'Produit introuvable');
          setLoading(false);
          return;
        }
        const p = res.data;
        let imagesStr = '';
        try { imagesStr = p.images ? JSON.parse(p.images).join(', ') : ''; } catch { imagesStr = p.images || ''; }
        let tagsStr = '';
        try { tagsStr = p.tags ? JSON.parse(p.tags).join(', ') : ''; } catch { tagsStr = p.tags || ''; }
        let allergensStr = '';
        try { allergensStr = p.allergens ? JSON.parse(p.allergens).join(', ') : ''; } catch { allergensStr = p.allergens || ''; }
        let dims = { length: '', width: '', height: '' };
        try { dims = p.dimensions ? JSON.parse(p.dimensions) : dims; } catch { /* keep default */ }

        setForm({
          name: p.name,
          shortDescription: p.shortDescription || '',
          longDescription: p.longDescription || '',
          price: String(p.price),
          comparePrice: p.comparePrice ? String(p.comparePrice) : '',
          stock: String(p.stock),
          sku: p.sku || '',
          barcode: p.barcode || '',
          categoryId: p.categoryId || '',
          brand: p.brand || '',
          origin: p.origin || '',
          preparationTime: p.preparationTime ? String(p.preparationTime) : '',
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
          weight: p.weight || '',
          length: dims.length || '',
          width: dims.width || '',
          height: dims.height || '',
          tags: tagsStr,
          allergens: allergensStr,
          images: imagesStr,
          video: p.video || '',
          options: p.options || '',
          supplements: p.supplements || '',
          variants: p.variants || '',
        });
        setLoading(false);
      };
      fetchProduct();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [isEdit, data?.productId]);

  const updateField = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const addImage = () => {
    setForm((prev) => ({
      ...prev,
      images: prev.images ? `${prev.images}, ` : '',
    }));
  };

  const removeLastImage = () => {
    const parts = form.images.split(',').map((s) => s.trim()).filter(Boolean);
    parts.pop();
    setForm((prev) => ({ ...prev, images: parts.join(', ') }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setError('Le nom et le prix sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);

    const imagesArr = form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const tagsArr = form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const allergensArr = form.allergens ? form.allergens.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const hasDims = form.length || form.width || form.height;

    const body: Record<string, unknown> = {
      name: form.name,
      shortDescription: form.shortDescription || null,
      longDescription: form.longDescription || null,
      price: parseInt(form.price) || 0,
      comparePrice: form.comparePrice ? parseInt(form.comparePrice) : null,
      stock: parseInt(form.stock) || 0,
      sku: form.sku || null,
      barcode: form.barcode || null,
      categoryId: form.categoryId || null,
      brand: form.brand || null,
      origin: form.origin || null,
      preparationTime: form.preparationTime ? parseInt(form.preparationTime) : null,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      weight: form.weight || null,
      dimensions: hasDims ? JSON.stringify({ length: form.length, width: form.width, height: form.height }) : null,
      images: imagesArr.length > 0 ? JSON.stringify(imagesArr) : null,
      video: form.video || null,
      tags: tagsArr.length > 0 ? JSON.stringify(tagsArr) : null,
      allergens: allergensArr.length > 0 ? JSON.stringify(allergensArr) : null,
      options: form.options || null,
      supplements: form.supplements || null,
      variants: form.variants || null,
    };

    let res;
    if (isEdit && data?.productId) {
      res = await apiFetch(`/api/products/${data.productId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      res = await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) });
    }

    if (res.error) {
      setError(res.error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => navigate('products'), 1000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('products')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{isEdit ? 'Modifiez les informations du produit' : 'Remplissez les informations du nouveau produit'}</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-lg">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">Produit enregistré avec succès ! Redirection...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du produit *</Label>
                <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ex: Poulet braisé" />
              </div>
              <div className="space-y-2">
                <Label>Description courte</Label>
                <Input value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} placeholder="Une brève description" />
              </div>
              <div className="space-y-2">
                <Label>Description longue</Label>
                <Textarea value={form.longDescription} onChange={(e) => updateField('longDescription', e.target.value)} placeholder="Description détaillée du produit..." className="min-h-24" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix (FCFA) *</Label>
                  <Input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="0" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Prix promotionnel (FCFA)</Label>
                  <Input type="number" value={form.comparePrice} onChange={(e) => updateField('comparePrice', e.target.value)} placeholder="0" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} placeholder="0" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Temps de préparation (min)</Label>
                  <Input type="number" value={form.preparationTime} onChange={(e) => updateField('preparationTime', e.target.value)} placeholder="15" min="0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails du produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={form.sku} onChange={(e) => updateField('sku', e.target.value)} placeholder="SKU-001" />
                </div>
                <div className="space-y-2">
                  <Label>Code-barres</Label>
                  <Input value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} placeholder="1234567890123" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.categoryId} onValueChange={(val) => updateField('categoryId', val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marque</Label>
                  <Input value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="Marque du produit" />
                </div>
                <div className="space-y-2">
                  <Label>Origine</Label>
                  <Input value={form.origin} onChange={(e) => updateField('origin', e.target.value)} placeholder="Ex: Mali, Côte d'Ivoire" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Poids</Label>
                <Input value={form.weight} onChange={(e) => updateField('weight', e.target.value)} placeholder="Ex: 500g, 1kg" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Longueur (cm)</Label>
                  <Input type="number" value={form.length} onChange={(e) => updateField('length', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Largeur (cm)</Label>
                  <Input type="number" value={form.width} onChange={(e) => updateField('width', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Hauteur (cm)</Label>
                  <Input type="number" value={form.height} onChange={(e) => updateField('height', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (séparés par des virgules)</Label>
                <Input value={form.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="bio, local, premium" />
              </div>
              <div className="space-y-2">
                <Label>Allergènes (séparés par des virgules)</Label>
                <Input value={form.allergens} onChange={(e) => updateField('allergens', e.target.value)} placeholder="gluten, arachide, lait" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Médias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Images (URLs séparées par des virgules)</Label>
                <Textarea value={form.images} onChange={(e) => updateField('images', e.target.value)} placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" className="min-h-20" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addImage}><Plus className="h-3 w-3 mr-1" /> Ajouter</Button>
                  <Button type="button" variant="outline" size="sm" onClick={removeLastImage}><Minus className="h-3 w-3 mr-1" /> Retirer la dernière</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL de vidéo</Label>
                <Input value={form.video} onChange={(e) => updateField('video', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options, suppléments & variantes (JSON)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Options</Label>
                <Textarea
                  value={form.options}
                  onChange={(e) => updateField('options', e.target.value)}
                  placeholder='[{"name": "Taille", "values": ["Petit", "Grand"], "required": true}]'
                  className="min-h-20 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Suppléments</Label>
                <Textarea
                  value={form.supplements}
                  onChange={(e) => updateField('supplements', e.target.value)}
                  placeholder='[{"name": "Fromage extra", "price": 500}]'
                  className="min-h-20 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Variantes</Label>
                <Textarea
                  value={form.variants}
                  onChange={(e) => updateField('variants', e.target.value)}
                  placeholder='[{"name": "Couleur", "values": ["Rouge", "Bleu"], "priceDifference": 0}]'
                  className="min-h-20 font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Status & Save */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Disponible</Label>
                <Switch checked={form.isAvailable} onCheckedChange={(val) => updateField('isAvailable', val)} className="data-[state=checked]:bg-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Produit vedette</Label>
                <Switch checked={form.isFeatured} onCheckedChange={(val) => updateField('isFeatured', val)} className="data-[state=checked]:bg-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aperçu du prix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-emerald-700">{formatPrice(parseInt(form.price) || 0)}</p>
                {form.comparePrice && parseInt(form.comparePrice) > parseInt(form.price) && (
                  <p className="text-sm text-gray-400 line-through mt-1">{formatPrice(parseInt(form.comparePrice))}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
            </Button>
            <Button variant="outline" onClick={() => navigate('products')} className="w-full">Annuler</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Orders View ─────────────────────────────────────────────────────

function OrdersView({ merchant }: { merchant: MerchantProfile }) {
  const navigate = useMerchantNav((s) => s.navigate);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await apiFetch<Order[]>('/api/orders');
    if (res.data) {
      setOrders(res.data.filter((o) => o.merchantId === merchant.id));
    }
    setLoading(false);
  }, [merchant.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    setUpdatingId(orderId);
    const body: Record<string, string> = { status };
    if (paymentStatus) body.paymentStatus = paymentStatus;
    await apiFetch(`/api/orders/${orderId}`, { method: 'PUT', body: JSON.stringify(body) });
    setUpdatingId(null);
    fetchOrders();
  };

  const filteredOrders = (() => {
    const tab = ORDER_TABS.find((t) => t.value === activeTab);
    if (!tab || tab.statuses.length === 0) return orders;
    return orders.filter((o) => tab.statuses.includes(o.status));
  })().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getPaymentActionButton = (order: Order) => {
    if ((order.status === 'PENDING' || order.status === 'PAYMENT_PENDING') && order.paymentProof) {
      return (
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'CONFIRMED', 'ACCEPTED')}>
            {updatingId === order.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
            Accepter le paiement
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, order.status, 'REJECTED')}>
            Refuser
          </Button>
        </div>
      );
    }
    if (order.paymentProof && (order.status === 'PENDING' || order.status === 'PAYMENT_PENDING')) {
      return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">Preuve de paiement envoyée</p>
        </div>
      );
    }
    return null;
  };

  const getStatusButton = (order: Order) => {
    if (order.status === 'CONFIRMED') {
      return (
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 w-full mt-3" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'PREPARING')}>
          {updatingId === order.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
          Commencer la préparation
        </Button>
      );
    }
    if (order.status === 'PREPARING') {
      return (
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 w-full mt-3" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'READY')}>
          {updatingId === order.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
          Commande prête
        </Button>
      );
    }
    if (order.status === 'PICKED_UP') {
      return (
        <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-center gap-2">
          <Package className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-700">Remis au livreur</p>
            {order.driver && <p className="text-xs text-purple-500">{order.driver.firstName} {order.driver.lastName}</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Commandes</h2>
        <p className="text-gray-500 text-sm mt-1">{orders.length} commande(s) au total</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {ORDER_TABS.map((tab) => {
            const count = tab.statuses.length === 0
              ? orders.length
              : orders.filter((o) => tab.statuses.includes(o.status)).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">{count}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucune commande</p>
          <p className="text-sm mt-1">Pas de commande dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('order-detail', { orderId: order.id })}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold text-emerald-700">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.client ? `${order.client.firstName} ${order.client.lastName}` : 'Client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                </p>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(order.createdAt)}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                </div>

                {/* Payment actions */}
                {(order.status === 'PENDING' || order.status === 'PAYMENT_PENDING') && order.paymentProof && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <img src={order.paymentProof} alt="Preuve de paiement" className="w-20 h-20 object-cover rounded-lg border" />
                    {getPaymentActionButton(order)}
                  </div>
                )}

                {/* Status transition buttons */}
                <div onClick={(e) => e.stopPropagation()}>
                  {getStatusButton(order)}
                </div>

                {/* Driver info for transit orders */}
                {(order.status === 'PICKED_UP' || order.status === 'IN_TRANSIT') && order.driver && (
                  <div className="flex items-center gap-3 p-2 bg-violet-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                      {order.driver.firstName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-violet-700">{order.driver.firstName} {order.driver.lastName}</p>
                      <p className="text-xs text-violet-500">{order.driver.phone} · {order.driver.vehicleType}</p>
                    </div>
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

// ─── 5. Order Detail View ────────────────────────────────────────────────

function OrderDetailView({ merchant }: { merchant: MerchantProfile }) {
  const { data, navigate } = useMerchantNav();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!data?.orderId) return;
    setLoading(true);
    const res = await apiFetch<Order>(`/api/orders/${data.orderId}`);
    if (res.data) setOrder(res.data);
    setLoading(false);
  }, [data]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateOrder = async (status: string, paymentStatus?: string) => {
    if (!order) return;
    setUpdating(true);
    const body: Record<string, string> = { status };
    if (paymentStatus) body.paymentStatus = paymentStatus;
    await apiFetch(`/api/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(body) });
    setUpdating(false);
    fetchOrder();
  };

  const statusSteps = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Commande introuvable</p>
      </div>
    );
  }

  const currentIdx = getStepIndex(order.status);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('orders')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commande #{order.orderNumber}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{new Date(order.createdAt).toLocaleString('fr-FR')}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status] || ''}`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suivi de la commande</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {statusSteps.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    idx <= currentIdx ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {idx <= currentIdx ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] mt-1 text-center ${idx <= currentIdx ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div className={`h-0.5 w-6 mb-5 shrink-0 ${idx < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client & Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client & Livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.client && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {order.client.firstName[0]}{order.client.lastName[0]}
                </div>
                <div>
                  <p className="font-medium">{order.client.firstName} {order.client.lastName}</p>
                  <p className="text-sm text-gray-500">{order.client.phone}</p>
                </div>
              </div>
            )}
            <Separator />
            <div className="space-y-1 text-sm">
              <p className="text-gray-500">Adresse de livraison</p>
              <p className="font-medium">{order.deliveryAddress}</p>
              <p className="text-gray-500">{order.deliveryCity}{order.deliveryQuartier ? ` - ${order.deliveryQuartier}` : ''}</p>
            </div>
            {order.notes && (
              <div className="p-2 bg-amber-50 rounded-lg text-sm text-amber-800">
                <span className="font-medium">Note client :</span> {order.notes}
              </div>
            )}
            {order.driver && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-gray-500 text-sm">Livreur assigné</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold">
                      {order.driver.firstName[0]}{order.driver.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.driver.firstName} {order.driver.lastName}</p>
                      <p className="text-xs text-gray-500">{order.driver.phone} · {order.driver.vehicleType} {order.driver.vehiclePlate || ''}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Méthode</span>
              <span className="font-medium">{PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Statut paiement</span>
              <Badge variant={order.paymentStatus === 'ACCEPTED' ? 'default' : order.paymentStatus === 'REJECTED' ? 'destructive' : 'outline'}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Livraison</span><span>{formatPrice(order.deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Frais de service</span><span>{formatPrice(order.serviceFee)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Réduction</span><span>-{formatPrice(order.discount)}</span></div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-emerald-700">{formatPrice(order.total)}</span></div>
            </div>
            {order.paymentNote && (
              <div className="p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
                <span className="font-medium">Note de paiement :</span> {order.paymentNote}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.unitPrice)}</p>
                  {item.supplements && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">+ Suppléments</p>
                  )}
                </div>
                <p className="font-semibold text-sm">{formatPrice(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Proof */}
      {order.paymentProof && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preuve de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={order.paymentProof}
                alt="Preuve de paiement"
                className="max-h-60 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setImageOpen(true)}
              />
            </div>
            {(order.status === 'PENDING' || order.status === 'PAYMENT_PENDING') && (
              <div className="flex gap-3">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={updating} onClick={() => updateOrder('CONFIRMED', 'ACCEPTED')}>
                  {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Accepter le paiement
                </Button>
                <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50" disabled={updating} onClick={() => updateOrder(order.status, 'REJECTED')}>
                  Refuser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Transition Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.status === 'PENDING' && !order.paymentProof && (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={updating} onClick={() => updateOrder('CONFIRMED')}>
              {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmer la commande
            </Button>
          )}
          {order.status === 'CONFIRMED' && (
            <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled={updating} onClick={() => updateOrder('PREPARING')}>
              {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
              Commencer la préparation
            </Button>
          )}
          {order.status === 'PREPARING' && (
            <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled={updating} onClick={() => updateOrder('READY')}>
              {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Commande prête
            </Button>
          )}
          {['PENDING', 'CONFIRMED'].includes(order.status) && (
            <Button variant="outline" className="w-full text-red-600 hover:bg-red-50" disabled={updating} onClick={() => updateOrder('CANCELLED')}>
              Annuler la commande
            </Button>
          )}
          {!['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <div className="text-center py-4 text-gray-500 text-sm">
              <Check className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
              Aucune action requise pour le moment.
            </div>
          )}
          {order.status === 'DELIVERED' && (
            <div className="text-center py-4 text-emerald-700 text-sm font-medium">
              <Check className="h-5 w-5 mx-auto mb-2" />
              Commande livrée avec succès !
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Bientôt disponible</p>
            <p className="text-sm mt-1">Le chat avec le client et le livreur sera bientôt activé.</p>
          </div>
        </CardContent>
      </Card>

      {/* Image viewer dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-2xl">
          <img src={order.paymentProof || ''} alt="Preuve de paiement" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 6. Delivery Zones View ──────────────────────────────────────────────

function DeliveryZonesView({ merchant }: { merchant: MerchantProfile }) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editZone, setEditZone] = useState<DeliveryZone | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ city: 'Bamako', quartier: '', fee: '' });

  const fetchZones = useCallback(async () => {
    const res = await apiFetch<DeliveryZone[]>(`/api/merchants/${merchant.id}/delivery-zones`);
    if (res.data) setZones(res.data);
    setLoading(false);
  }, [merchant.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchZones(); }, [fetchZones]);

  const resetForm = () => {
    setForm({ city: 'Bamako', quartier: '', fee: '' });
    setEditZone(null);
    setShowForm(false);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditZone(zone);
    setForm({ city: zone.city, quartier: zone.quartier || '', fee: String(zone.fee) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.fee) return;
    setSaving(true);
    const body = {
      city: form.city,
      quartier: form.quartier || null,
      fee: parseInt(form.fee) || 0,
    };

    if (editZone) {
      await apiFetch(`/api/merchants/${merchant.id}/delivery-zones`, {
        method: 'POST',
        body: JSON.stringify({ ...body, id: editZone.id }),
      });
    } else {
      await apiFetch(`/api/merchants/${merchant.id}/delivery-zones`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    resetForm();
    fetchZones();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await apiFetch(`/api/merchants/${merchant.id}/delivery-zones`, {
      method: 'DELETE',
      body: JSON.stringify({ id: deleteId }),
    });
    setDeleting(false);
    setDeleteId(null);
    fetchZones();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Zones de livraison</h2>
          <p className="text-gray-500 text-sm mt-1">Configurez vos zones et frais de livraison</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter une zone
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : zones.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucune zone configurée</p>
          <p className="text-sm mt-1">Ajoutez vos zones de livraison pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Card key={zone.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{zone.city}</p>
                      {zone.quartier && <p className="text-sm text-gray-500">{zone.quartier}</p>}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{formatPrice(zone.fee)}</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Switch checked={zone.isActive} onCheckedChange={async (val) => {
                    await apiFetch(`/api/merchants/${merchant.id}/delivery-zones`, {
                      method: 'POST',
                      body: JSON.stringify({ id: zone.id, isActive: val }),
                    });
                    fetchZones();
                  }} className="data-[state=checked]:bg-emerald-600" />
                  <span className="text-xs text-gray-500">{zone.isActive ? 'Active' : 'Inactive'}</span>
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(zone)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(zone.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editZone ? 'Modifier la zone' : 'Ajouter une zone'}</DialogTitle>
            <DialogDescription>Définissez la ville, le quartier et les frais de livraison.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Bamako" />
            </div>
            <div className="space-y-2">
              <Label>Quartier</Label>
              <Input value={form.quartier} onChange={(e) => setForm((p) => ({ ...p, quartier: e.target.value }))} placeholder="Ex: Badalabougou" />
            </div>
            <div className="space-y-2">
              <Label>Frais de livraison (FCFA)</Label>
              <Input type="number" value={form.fee} onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))} placeholder="500" min="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editZone ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la zone</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer cette zone de livraison ?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 7. Payment Config View ──────────────────────────────────────────────

function PaymentConfigView({ merchant }: { merchant: MerchantProfile }) {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    const res = await apiFetch<PaymentConfig[]>(`/api/merchants/${merchant.id}/payment-config`);
    if (res.data) setConfigs(res.data);
    setLoading(false);
  }, [merchant.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const getConfig = (method: string) => configs.find((c) => c.method === method);

  const toggleMethod = async (method: string, enabled: boolean) => {
    const existing = getConfig(method);
    if (existing) {
      await apiFetch(`/api/merchants/${merchant.id}/payment-config`, {
        method: 'POST',
        body: JSON.stringify({ id: existing.id, isEnabled: enabled }),
      });
    } else {
      await apiFetch(`/api/merchants/${merchant.id}/payment-config`, {
        method: 'POST',
        body: JSON.stringify({ method, isEnabled: enabled }),
      });
    }
    fetchConfigs();
  };

  const saveConfig = async (method: string, fields: Record<string, string>) => {
    setSavingMethod(method);
    const existing = getConfig(method);
    await apiFetch(`/api/merchants/${merchant.id}/payment-config`, {
      method: 'POST',
      body: JSON.stringify({
        ...(existing ? { id: existing.id } : { method }),
        ...fields,
      }),
    });
    setSavingMethod(null);
    fetchConfigs();
  };

  const deleteConfig = async (method: string) => {
    const existing = getConfig(method);
    if (!existing) return;
    await apiFetch(`/api/merchants/${merchant.id}/payment-config`, {
      method: 'DELETE',
      body: JSON.stringify({ id: existing.id }),
    });
    fetchConfigs();
  };

  const isMobileMoney = (m: string) => ['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE'].includes(m);
  const isCard = (m: string) => ['VISA', 'MASTERCARD'].includes(m);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuration paiement</h2>
        <p className="text-gray-500 text-sm mt-1">Gérez vos méthodes de paiement acceptées</p>
      </div>

      <div className="space-y-4">
        {PAYMENT_METHOD_LIST.map((method) => {
          const config = getConfig(method);
          const isEnabled = config?.isEnabled ?? false;

          return (
            <PaymentMethodCard
              key={method}
              method={method}
              config={config}
              isEnabled={isEnabled}
              saving={savingMethod === method}
              onToggle={(enabled) => toggleMethod(method, enabled)}
              onSave={(fields) => saveConfig(method, fields)}
              onDelete={() => deleteConfig(method)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PaymentMethodCard({
  method,
  config,
  isEnabled,
  saving,
  onToggle,
  onSave,
  onDelete,
}: {
  method: string;
  config: PaymentConfig | null;
  isEnabled: boolean;
  saving: boolean;
  onToggle: (enabled: boolean) => void;
  onSave: (fields: Record<string, string>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [phone, setPhone] = useState(config?.phoneNumber || '');
  const [accountName, setAccountName] = useState(config?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(config?.accountNumber || '');
  const [qrCode, setQrCode] = useState(config?.qrCode || '');
  const [instructions, setInstructions] = useState(config?.instructions || '');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync prop to local state
    setPhone(config?.phoneNumber || '');
     
    setAccountName(config?.accountName || '');
     
    setAccountNumber(config?.accountNumber || '');
     
    setQrCode(config?.qrCode || '');
     
    setInstructions(config?.instructions || '');
  }, [config]);

  const isMobileMoney = ['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE'].includes(method);
  const isCard = ['VISA', 'MASTERCARD'].includes(method);
  const isQR = method === 'QR_CODE';

  const handleSave = () => {
    const fields: Record<string, string> = {};
    if (isMobileMoney) { fields.phoneNumber = phone; fields.accountName = accountName; }
    if (isCard) { fields.accountNumber = accountNumber; }
    if (isQR) { fields.qrCode = qrCode; }
    fields.instructions = instructions;
    onSave(fields);
  };

  return (
    <Card className={isEnabled ? 'border-emerald-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-50' : 'bg-gray-100'}`}>
              <CreditCard className={`h-5 w-5 ${isEnabled ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{PAYMENT_METHODS[method] || method}</p>
              <p className="text-xs text-gray-500">{isEnabled ? 'Activé' : 'Désactivé'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-emerald-600"
            />
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && isEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {isMobileMoney && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Numéro de téléphone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+223 XX XX XX XX" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom du compte</Label>
                    <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Nom du titulaire" />
                  </div>
                </div>
              </>
            )}
            {isCard && (
              <div className="space-y-2">
                <Label>Numéro de compte</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Numéro de compte carte" />
              </div>
            )}
            {isQR && (
              <div className="space-y-2">
                <Label>URL de l'image QR Code</Label>
                <Input value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="https://..." />
                {qrCode && (
                  <img src={qrCode} alt="QR Code" className="w-24 h-24 object-contain border rounded-lg bg-gray-50" />
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Instructions de paiement (affichées aux clients)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions pour effectuer le paiement..."
                className="min-h-16"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Enregistrer
              </Button>
              {config && (
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── 8. Subscription View ────────────────────────────────────────────────

function SubscriptionView({ merchant }: { merchant: MerchantProfile }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const res = await apiFetch<Plan[]>('/api/plans');
      if (res.data) setPlans(res.data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  const activePlans = plans.filter((p) => p.isActive).sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>
        <p className="text-gray-500 text-sm mt-1">Choisissez le plan qui correspond à vos besoins</p>
      </div>

      {activePlans.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Crown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucun plan disponible</p>
          <p className="text-sm mt-1">Les abonnements seront bientôt disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => {
            let features: string[] = [];
            try { features = plan.features ? JSON.parse(plan.features) : []; } catch { features = []; }

            return (
              <Card key={plan.id} className="relative hover:shadow-md transition-shadow">
                {plan.priority === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-3 py-1">Populaire</Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                    <Crown className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div>
                    <span className="text-3xl font-bold text-emerald-700">{formatPrice(plan.price)}</span>
                    <span className="text-gray-500 text-sm"> / {plan.duration} jours</span>
                  </div>
                  <Separator />
                  <ul className="space-y-2 text-sm text-left">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.maxProducts && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Jusqu'à {plan.maxProducts} produits</span>
                      </li>
                    )}
                  </ul>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                    alert(`Souscription au plan "${plan.name}" bientôt disponible.`);
                  }}>
                    S'abonner
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 9. Profile View ─────────────────────────────────────────────────────

function ProfileView({ merchant, onRefresh }: { merchant: MerchantProfile; onRefresh: () => void }) {
  const authLogout = useAuthStore((s) => s.logout);
  const setSpace = useSpaceStore((s) => s.setSpace);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    businessName: merchant.businessName,
    businessType: merchant.businessType,
    description: merchant.description || '',
    shortDescription: merchant.shortDescription || '',
    address: merchant.address,
    city: merchant.city,
    quartier: merchant.quartier || '',
    phone: merchant.phone,
    email: merchant.email || '',
    website: merchant.website || '',
    operatingHours: merchant.operatingHours,
  });

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await apiFetch(`/api/merchants/${merchant.id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setEditing(false);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    authLogout();
    setSpace('landing');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
          <p className="text-gray-500 text-sm mt-1">Informations de votre entreprise</p>
        </div>
        <Button
          variant={editing ? 'outline' : 'default'}
          className={editing ? '' : 'bg-emerald-600 hover:bg-emerald-700'}
          onClick={() => { if (editing) { setEditing(false); setForm({ businessName: merchant.businessName, businessType: merchant.businessType, description: merchant.description || '', shortDescription: merchant.shortDescription || '', address: merchant.address, city: merchant.city, quartier: merchant.quartier || '', phone: merchant.phone, email: merchant.email || '', website: merchant.website || '', operatingHours: merchant.operatingHours }); } else { setEditing(true); } }}
        >
          {editing ? 'Annuler' : <><Edit className="h-4 w-4 mr-2" />Modifier</>}
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-lg">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">Profil mis à jour avec succès !</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Business Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
              {merchant.logo ? (
                <img src={merchant.logo} alt={merchant.businessName} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <Store className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{merchant.businessName}</h3>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700">{BUSINESS_TYPES[merchant.businessType] || merchant.businessType}</Badge>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{merchant.rating.toFixed(1)} ({merchant.totalRatings} avis)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de l'entreprise</Label>
                  <Input value={form.businessName} onChange={(e) => updateField('businessName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type d'activité</Label>
                  <Select value={form.businessType} onValueChange={(val) => updateField('businessType', val)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description courte</Label>
                <Input value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className="min-h-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input value={form.address} onChange={(e) => updateField('address', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Quartier</Label>
                  <Input value={form.quartier} onChange={(e) => updateField('quartier', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Site web</Label>
                  <Input value={form.website} onChange={(e) => updateField('website', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Horaires d'ouverture</Label>
                  <Input value={form.operatingHours} onChange={(e) => updateField('operatingHours', e.target.value)} placeholder="08:00-22:00" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={Store} label="Nom" value={merchant.businessName} />
              <InfoRow icon={Settings} label="Type" value={BUSINESS_TYPES[merchant.businessType] || merchant.businessType} />
              {merchant.shortDescription && <InfoRow icon={FileText} label="Description courte" value={merchant.shortDescription} />}
              {merchant.description && <InfoRow icon={FileText} label="Description" value={merchant.description} />}
              <InfoRow icon={MapPin} label="Adresse" value={`${merchant.address}, ${merchant.city}${merchant.quartier ? ` - ${merchant.quartier}` : ''}`} />
              <InfoRow icon={Phone} label="Téléphone" value={merchant.phone} />
              {merchant.email && <InfoRow icon={Mail} label="Email" value={merchant.email} />}
              {merchant.website && <InfoRow icon={Globe} label="Site web" value={merchant.website} />}
              <InfoRow icon={Clock} label="Horaires" value={merchant.operatingHours} />
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Se déconnecter
      </Button>
    </div>
  );
}

// ─── Shared Small Components ─────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-gray-500">{label} : </span>
        <span className="text-gray-900">{value}</span>
      </div>
    </div>
  );
}

