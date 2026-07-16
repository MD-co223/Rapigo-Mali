'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingBag, MapPin,
  CreditCard, Crown, User, Bell, LogOut, Menu, X, ChevronLeft,
  Search, Edit, Trash2, Star, Clock, DollarSign, TrendingUp,
  Loader2, AlertCircle, ImagePlus, Send, MessageSquare, Phone,
  Mail, Settings, Store, Ticket,
  CheckCircle2, XCircle, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useMerchantNav, useAuthStore, useSpaceStore,
  apiFetch, formatPrice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_METHODS,
  BUSINESS_TYPES,
} from '@/lib/store';
import type { MerchantView } from '@/lib/store';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantProfile {
  id: string;
  businessName: string;
  businessType: string;
  description: string | null;
  shortDescription: string | null;
  logo: string | null;
  coverImage: string | null;
  address: string;
  city: string;
  quartier: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  operatingHours: string;
  isApproved: boolean;
  isFeatured: boolean;
  rating: number;
  totalRatings: number;
  commissionRate: number;
  minOrderAmount: number;
  user: { id: string; email: string; phone: string; firstName: string; lastName: string; isActive: boolean; avatar?: string | null };
  deliveryZones: DeliveryZone[];
  paymentConfigs: PaymentConfig[];
  subscriptions: (Subscription & { plan: Plan })[];
  _count: { products: number; orders: number };
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
  image: string | null;
  images: string | null;
  video: string | null;
  sku: string | null;
  barcode: string | null;
  weight: string | null;
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
  category: { id: string; name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number; children: number };
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
  paymentMethod: string;
  paymentStatus: string;
  paymentProof: string | null;
  paymentNote: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryQuartier: string | null;
  notes: string | null;
  estimatedTime: number | null;
  cancelReason: string | null;
  createdAt: string;
  items: OrderItem[];
  client: { id: string; user: { firstName: string; lastName: string; phone: string; avatar: string | null } } | null;
  merchant: { id: string; businessName: string; logo: string | null; address: string } | null;
  driver: { id: string; user: { firstName: string; lastName: string; phone: string; avatar: string | null } } | null;
  ratings: unknown[];
}

interface OrderItem {
  id: string;
  orderId: string;
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

interface Subscription {
  id: string;
  merchantId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: Plan;
}

interface Coupon {
  id: string;
  code: string;
  merchantId: string | null;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  merchant: { id: string; businessName: string } | null;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

interface MerchantStats {
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  rating: number;
  totalRatings: number;
  recentOrders: Order[];
  ordersByStatus: { status: string; _count: number }[];
}

// ─── Nav items ──────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS: { label: string; view: MerchantView; icon: React.ElementType }[] = [
  { label: 'Tableau de bord', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Produits', view: 'products', icon: Package },
  { label: 'Commandes', view: 'orders', icon: ShoppingBag },
  { label: 'Statistiques', view: 'stats', icon: TrendingUp },
  { label: 'Coupons', view: 'coupons', icon: Ticket },
  { label: 'Configuration paiements', view: 'payment-config', icon: CreditCard },
  { label: 'Zones de livraison', view: 'delivery-zones', icon: MapPin },
  { label: 'Abonnement', view: 'subscription', icon: Crown },
  { label: 'Paramètres', view: 'settings', icon: Settings },
  { label: 'Support', view: 'support', icon: MessageSquare },
];

const BOTTOM_NAV_ITEMS: { label: string; view: MerchantView; icon: React.ElementType }[] = [
  { label: 'Accueil', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Produits', view: 'products', icon: Package },
  { label: 'Commandes', view: 'orders', icon: ShoppingBag },
  { label: 'Notifications', view: 'notifications', icon: Bell },
  { label: 'Profil', view: 'profile', icon: User },
];

// ─── Helper: StatusBadge ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}>
      {ORDER_STATUS_LABELS[status] || status}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    UPLOADED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  return (
    <Badge variant="secondary" className={colors[status] || colors.PENDING}>
      {PAYMENT_STATUS_LABELS[status] || status}
    </Badge>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const token = useAuthStore.getState().token;
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await res.json();
    if (res.ok && data.url) return data.url;
    toast.error(data.error || 'Erreur lors du téléchargement');
    return null;
  } catch {
    toast.error('Erreur de connexion');
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════

// ─── 1. Dashboard ───────────────────────────────────────────────────────────

function DashboardView({ merchant }: { merchant: MerchantProfile }) {
  const { navigate } = useMerchantNav();
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<MerchantStats>('/api/stats/merchant');
      if (data) setStats(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  const statCards = [
    { label: 'Total commandes', value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Revenus', value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { label: 'Produits actifs', value: stats?.totalProducts ?? 0, icon: Package, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Note moyenne', value: stats?.rating ? `${stats.rating.toFixed(1)}/5` : 'N/A', icon: Star, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('add-product')} className="bg-emerald-600 hover:bg-emerald-700">
            <PlusCircle className="h-4 w-4 mr-2" /> Ajouter produit
          </Button>
          <Button variant="outline" onClick={() => navigate('orders')}>
            <ShoppingBag className="h-4 w-4 mr-2" /> Voir commandes
          </Button>
          <Button variant="outline" onClick={() => navigate('payment-config')}>
            <CreditCard className="h-4 w-4 mr-2" /> Configurer paiements
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Commandes récentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('orders')}>
              Voir tout <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!stats?.recentOrders?.length ? (
            <p className="text-muted-foreground text-center py-8">Aucune commande récente</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate('order-detail', { id: order.id })}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="font-semibold text-sm">{formatPrice(order.total)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 2. Products ────────────────────────────────────────────────────────────

function ProductsView({ merchant }: { merchant: MerchantProfile }) {
  const { navigate } = useMerchantNav();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<Product[]>(`/api/products?merchantId=${merchant.id}&available=false`);
      if (data) setProducts(data);
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, [merchant.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    const { error } = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    if (error) { toast.error(error); return; }
    toast.success('Produit supprimé');
    reloadRef.current();
  };

  const handleToggleAvailable = async (p: Product) => {
    setTogglingId(p.id);
    const { error } = await apiFetch(`/api/products/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isAvailable: !p.isAvailable }),
    });
    if (error) { toast.error(error); }
    else { toast.success(p.isAvailable ? 'Produit désactivé' : 'Produit activé'); reloadRef.current(); }
    setTogglingId(null);
  };

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => navigate('add-product')} className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un produit
        </Button>
      </div>

      {!filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">Aucun produit</p>
            <p className="text-muted-foreground text-sm mt-1">Commencez par ajouter votre premier produit</p>
            <Button onClick={() => navigate('add-product')} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un produit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <Badge variant={p.isAvailable ? 'default' : 'secondary'} className="absolute top-2 right-2">
                  {p.isAvailable ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                {p.category && <p className="text-xs text-muted-foreground mt-0.5">{p.category.name}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(p.price)}</span>
                  {p.comparePrice && p.comparePrice > p.price && (
                    <span className="text-xs text-muted-foreground line-through">{formatPrice(p.comparePrice)}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Stock : {p.stock}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Switch
                  checked={p.isAvailable}
                  onCheckedChange={() => handleToggleAvailable(p)}
                  disabled={togglingId === p.id}
                  className="data-[state=checked]:bg-emerald-600"
                />
                <span className="text-xs text-muted-foreground mr-auto">{p.isAvailable ? 'Disponible' : 'Indisponible'}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('add-product', { id: p.id })}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 3. Add/Edit Product ────────────────────────────────────────────────────

function AddProductView({ merchant }: { merchant: MerchantProfile }) {
  const { view, data, goBack, navigate } = useMerchantNav();
  const editId = data?.id;
  const isEdit = !!editId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', shortDescription: '', longDescription: '', price: '',
    comparePrice: '', stock: '', categoryId: '', isAvailable: true,
    isFeatured: false, preparationTime: '', sku: '', barcode: '',
    weight: '', brand: '', origin: '', tags: '', image: '',
  });

  useEffect(() => {
    (async () => {
      const { data: cats } = await apiFetch<Category[]>('/api/categories');
      if (cats) setCategories(cats);
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await apiFetch<Product>(`/api/products/${editId}`);
      if (data) {
        let tagsStr = '';
        try { const t = JSON.parse(data.tags || '[]'); tagsStr = t.join(', '); } catch { /* ignore */ }
        setForm({
          name: data.name || '',
          shortDescription: data.shortDescription || '',
          longDescription: data.longDescription || '',
          price: String(data.price || ''),
          comparePrice: data.comparePrice ? String(data.comparePrice) : '',
          stock: String(data.stock ?? ''),
          categoryId: data.categoryId || '',
          isAvailable: data.isAvailable,
          isFeatured: data.isFeatured,
          preparationTime: data.preparationTime ? String(data.preparationTime) : '',
          sku: data.sku || '',
          barcode: data.barcode || '',
          weight: data.weight || '',
          brand: data.brand || '',
          origin: data.origin || '',
          tags: tagsStr,
          image: data.image || '',
        });
      }
      setLoading(false);
    })();
  }, [editId]);

  const setField = (key: string, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setForm((prev) => ({ ...prev, image: url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Nom et prix requis');
      return;
    }
    setSaving(true);
    const tagsArr = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    const body: Record<string, unknown> = {
      name: form.name,
      shortDescription: form.shortDescription || null,
      longDescription: form.longDescription || null,
      price: parseInt(form.price) || 0,
      comparePrice: form.comparePrice ? parseInt(form.comparePrice) : null,
      stock: parseInt(form.stock) || 0,
      categoryId: form.categoryId || null,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      preparationTime: form.preparationTime ? parseInt(form.preparationTime) : null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      weight: form.weight || null,
      brand: form.brand || null,
      origin: form.origin || null,
      tags: tagsArr.length ? tagsArr : null,
      image: form.image || null,
    };

    const { error } = isEdit
      ? await apiFetch(`/api/products/${editId}`, { method: 'PUT', body: JSON.stringify(body) })
      : await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) });

    if (error) { toast.error(error); setSaving(false); return; }
    toast.success(isEdit ? 'Produit mis à jour' : 'Produit ajouté');
    navigate('products');
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" />{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const fieldClass = 'flex flex-col gap-1.5';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft className="h-5 w-5" /></Button>
        <h2 className="text-xl font-bold">{isEdit ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Image */}
          <div className={fieldClass}>
            <Label>Image du produit</Label>
            {form.image ? (
              <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
                <img src={form.image} alt="Produit" className="w-full h-full object-cover" />
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setField('image', '')}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-40 h-40 rounded-lg border-2 border-dashed cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-emerald-600" /> : <ImagePlus className="h-8 w-8 text-muted-foreground" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldClass}>
              <Label>Nom du produit *</Label>
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ex: Poulet braisé" />
            </div>
            <div className={fieldClass}>
              <Label>Catégorie</Label>
              <Select value={form.categoryId} onValueChange={(v) => setField('categoryId', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <Label>Description courte</Label>
              <Input value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="Une phrase" />
            </div>
            <div className={fieldClass}>
              <Label>Prix *</Label>
              <Input type="number" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="0" />
            </div>
            <div className={fieldClass}>
              <Label>Prix barré (comparaison)</Label>
              <Input type="number" value={form.comparePrice} onChange={(e) => setField('comparePrice', e.target.value)} placeholder="Optionnel" />
            </div>
            <div className={fieldClass}>
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setField('stock', e.target.value)} placeholder="0" />
            </div>
            <div className={fieldClass}>
              <Label>Temps de préparation (min)</Label>
              <Input type="number" value={form.preparationTime} onChange={(e) => setField('preparationTime', e.target.value)} placeholder="30" />
            </div>
            <div className={fieldClass}>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="Réf. interne" />
            </div>
            <div className={fieldClass}>
              <Label>Code barres</Label>
              <Input value={form.barcode} onChange={(e) => setField('barcode', e.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label>Poids</Label>
              <Input value={form.weight} onChange={(e) => setField('weight', e.target.value)} placeholder="Ex: 500g" />
            </div>
            <div className={fieldClass}>
              <Label>Marque</Label>
              <Input value={form.brand} onChange={(e) => setField('brand', e.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label>Origine</Label>
              <Input value={form.origin} onChange={(e) => setField('origin', e.target.value)} placeholder="Ex: Mali" />
            </div>
          </div>

          <div className={fieldClass}>
            <Label>Description longue</Label>
            <Textarea rows={3} value={form.longDescription} onChange={(e) => setField('longDescription', e.target.value)} placeholder="Description détaillée..." />
          </div>
          <div className={fieldClass}>
            <Label>Tags (séparés par des virgules)</Label>
            <Input value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="populaire, promo, nouveau" />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isAvailable} onCheckedChange={(v) => setField('isAvailable', v)} className="data-[state=checked]:bg-emerald-600" />
              <Label>Disponible</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setField('isFeatured', v)} className="data-[state=checked]:bg-emerald-600" />
              <Label>En vedette</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={goBack}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Mettre à jour' : 'Créer le produit'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ─── 4. Orders ──────────────────────────────────────────────────────────────

function OrdersView() {
  const { navigate } = useMerchantNav();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Toutes');

  const reloadRef = useRef<(status?: string) => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const load = async (status?: string) => {
      setLoading(true);
      const q = status ? `?status=${status}` : '';
      const { data } = await apiFetch<{ orders: Order[] }>(`/api/orders${q}`);
      if (data) setOrders(data.orders || []);
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, []);

  const tabs = [
    { label: 'Toutes', value: '' },
    { label: 'En attente', value: 'PENDING' },
    { label: 'En préparation', value: 'PREPARING' },
    { label: 'Prêtes', value: 'READY' },
    { label: 'Livrées', value: 'DELIVERED' },
    { label: 'Annulées', value: 'CANCELLED' },
  ];

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    reloadRef.current(val || undefined);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="w-full justify-start min-w-max">
            {tabs.map((t) => (
              <TabsTrigger key={t.label} value={t.label}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : !orders.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">Aucune commande</p>
                <p className="text-muted-foreground text-sm mt-1">Les commandes apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('order-detail', { id: order.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{order.orderNumber}</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.client?.user ? `${order.client.user.firstName} ${order.client.user.lastName}` : 'Client'}
                          {' · '}{formatDate(order.createdAt)}
                        </p>
                        {order.paymentMethod !== 'CASH' && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod} · <PaymentBadge status={order.paymentStatus} />
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(order.total)}</p>
                        <p className="text-xs text-muted-foreground">{order.items?.length || 0} article(s)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── 5. Order Detail ────────────────────────────────────────────────────────

function OrderDetailView() {
  const { data, goBack, navigate } = useMerchantNav();
  const orderId = data?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<Order>(`/api/orders/${orderId}`);
      if (data) setOrder(data);
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, [orderId]);

  const updateStatus = async (status: string, extra?: Record<string, unknown>) => {
    if (!orderId) return;
    setUpdating(true);
    const body: Record<string, unknown> = { status, ...extra };
    const { error } = await apiFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (error) { toast.error(error); setUpdating(false); return; }
    toast.success('Statut mis à jour');
    reloadRef.current();
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Veuillez indiquer une raison'); return; }
    await updateStatus('CANCELLED', { cancelReason });
    setCancelOpen(false);
    setCancelReason('');
  };

  const handleAcceptPayment = async () => {
    if (!orderId) return;
    setUpdating(true);
    // Accept payment proof then confirm order
    const { error } = await apiFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    if (error) { toast.error(error); setUpdating(false); return; }
    toast.success('Paiement accepté et commande confirmée');
    reloadRef.current();
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim()) { toast.error('Veuillez indiquer une raison'); return; }
    // Cancel order on payment rejection
    await updateStatus('CANCELLED', { cancelReason: `Paiement rejeté: ${rejectReason}` });
    setRejectOpen(false);
    setRejectReason('');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p>Commande non trouvée</p>
        <Button variant="outline" onClick={goBack} className="mt-4">Retour</Button>
      </div>
    );
  }

  const canConfirm = ['PENDING', 'PAYMENT_PENDING'].includes(order.status);
  const canPrepare = order.status === 'CONFIRMED';
  const canReady = order.status === 'PREPARING';
  const canCancel = ['PENDING', 'PAYMENT_PENDING'].includes(order.status);
  const showPaymentProof = order.paymentMethod !== 'CASH' && ['PENDING', 'UPLOADED'].includes(order.paymentStatus);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-xl font-bold">{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Status & Payment */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Statut :</span>
            <StatusBadge status={order.status} />
            <span className="text-sm font-medium ml-2">Paiement :</span>
            <PaymentBadge status={order.paymentStatus} />
            <span className="text-sm text-muted-foreground ml-2">
              ({PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod})
            </span>
          </div>

          {/* Payment proof section */}
          {showPaymentProof && order.paymentProof && (
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/10 space-y-3">
              <p className="font-medium text-sm">Preuve de paiement {order.paymentNote && `- ${order.paymentNote}`}</p>
              <img src={order.paymentProof} alt="Preuve de paiement" className="max-h-48 rounded-lg border" />
              {order.paymentStatus === 'UPLOADED' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAcceptPayment} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Accepter
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={updating}>
                    <XCircle className="h-4 w-4 mr-1" /> Refuser
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Status actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {canConfirm && (
              <Button onClick={() => updateStatus('CONFIRMED')} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
                {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmer
              </Button>
            )}
            {canPrepare && (
              <Button onClick={() => updateStatus('PREPARING')} disabled={updating} className="bg-orange-600 hover:bg-orange-700">
                {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Commencer préparation
              </Button>
            )}
            {canReady && (
              <Button onClick={() => updateStatus('READY')} disabled={updating} className="bg-teal-600 hover:bg-teal-700">
                {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Marquer prête
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)} disabled={updating}>
                <XCircle className="h-4 w-4 mr-1" /> Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Articles</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(item.unitPrice)}</p>
                </div>
                <span className="font-semibold text-sm">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatPrice(order.deliveryFee)}</span></div>
            {order.serviceFee > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Frais de service</span><span>{formatPrice(order.serviceFee)}</span></div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Remise</span><span>-{formatPrice(order.discount)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-emerald-700 dark:text-emerald-400">{formatPrice(order.total)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Client & Delivery info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Client</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.client?.user && (
              <>
                <p className="font-medium">{order.client.user.firstName} {order.client.user.lastName}</p>
                <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {order.client.user.phone}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Livraison</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{order.deliveryAddress}</p>
            <p className="text-muted-foreground">{order.deliveryCity}{order.deliveryQuartier ? ` · ${order.deliveryQuartier}` : ''}</p>
          </CardContent>
        </Card>
      </div>

      {order.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-1">Notes du client</p>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la commande</DialogTitle>
            <DialogDescription>Veuillez indiquer la raison de l&apos;annulation</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Raison de l'annulation..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Retour</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le paiement</DialogTitle>
            <DialogDescription>Veuillez indiquer la raison du refus</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Raison du refus..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Retour</Button>
            <Button variant="destructive" onClick={handleRejectPayment} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Refuser le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 6. Payment Config ──────────────────────────────────────────────────────

function PaymentMethodCard({
  method, label, needsPhone, config, saving, onSave, onQrUpload,
}: {
  method: string;
  label: string;
  needsPhone: boolean;
  config: PaymentConfig | undefined;
  saving: boolean;
  onSave: (method: string, body: Record<string, unknown>) => void;
  onQrUpload: (method: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const isEnabled = config?.isEnabled ?? false;
  const [phone, setPhone] = useState(config?.phoneNumber || '');
  const [accountName, setAccountName] = useState(config?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(config?.accountNumber || '');
  const [instructions, setInstructions] = useState(config?.instructions || '');

  const handleToggle = () => {
    onSave(method, { isEnabled: !isEnabled, phoneNumber: needsPhone ? phone : undefined, accountName, accountNumber, instructions });
  };

  const handleSave = () => {
    onSave(method, { isEnabled: true, phoneNumber: needsPhone ? phone : undefined, accountName, accountNumber, instructions });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={saving}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </CardHeader>
      {isEnabled && (
        <CardContent className="pt-0 space-y-3">
          {needsPhone && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Numéro de téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+223 XX XX XX XX" />
            </div>
          )}
          {!needsPhone && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nom du titulaire</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Numéro de compte</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
            </div>
          )}
          {method === 'QR_CODE' && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">QR Code</Label>
              {config?.qrCode ? (
                <div className="relative w-32 h-32">
                  <img src={config.qrCode} alt="QR Code" className="w-full h-full object-contain rounded border" />
                </div>
              ) : null}
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent text-sm w-fit">
                <ImagePlus className="h-4 w-4" /> Télécharger QR
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onQrUpload(method, e)} />
              </label>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Instructions pour le client</Label>
            <Textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions de paiement..." />
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function PaymentConfigView({ merchant }: { merchant: MerchantProfile }) {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const METHODS = [
    { value: 'ORANGE_MONEY', label: 'Orange Money', needsPhone: true },
    { value: 'MOOV_MONEY', label: 'Moov Money', needsPhone: true },
    { value: 'WAVE', label: 'Wave', needsPhone: true },
    { value: 'VISA', label: 'Visa', needsPhone: false },
    { value: 'MASTERCARD', label: 'Mastercard', needsPhone: false },
    { value: 'QR_CODE', label: 'QR Code', needsPhone: false },
  ];

  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<PaymentConfig[]>(`/api/merchants/${merchant.id}/payment-config`);
      if (data) setConfigs(data);
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, [merchant.id]);

  const getConfig = (method: string) => configs.find((c) => c.method === method);

  const saveConfig = async (method: string, body: Record<string, unknown>) => {
    setSaving(method);
    const { error } = await apiFetch(`/api/merchants/${merchant.id}/payment-config`, {
      method: 'POST',
      body: JSON.stringify({ method, ...body }),
    });
    if (error) { toast.error(error); }
    else { toast.success('Configuration sauvegardée'); reloadRef.current(); }
    setSaving(null);
  };

  const handleQrUpload = async (method: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) saveConfig(method, { qrCode: url });
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Configuration des paiements</h2>
      <p className="text-sm text-muted-foreground">Configurez les méthodes de paiement acceptées par votre boutique.</p>

      {METHODS.map((m) => (
        <PaymentMethodCard
          key={m.value}
          method={m.value}
          label={m.label}
          needsPhone={m.needsPhone}
          config={getConfig(m.value)}
          saving={saving === m.value}
          onSave={saveConfig}
          onQrUpload={handleQrUpload}
        />
      ))}
    </div>
  );
}

// ─── 7. Delivery Zones ──────────────────────────────────────────────────────

function DeliveryZonesView({ merchant }: { merchant: MerchantProfile }) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [city, setCity] = useState('Bamako');
  const [quartier, setQuartier] = useState('');
  const [fee, setFee] = useState('');

  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<DeliveryZone[]>(`/api/merchants/${merchant.id}/delivery-zones`);
      if (data) setZones(data);
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, [merchant.id]);

  const handleAdd = async () => {
    if (!fee) { toast.error('Les frais de livraison sont requis'); return; }
    setSaving(true);
    const { error } = await apiFetch(`/api/merchants/${merchant.id}/delivery-zones`, {
      method: 'POST',
      body: JSON.stringify({ city, quartier: quartier || null, fee: parseInt(fee) || 0 }),
    });
    if (error) { toast.error(error); }
    else { toast.success('Zone ajoutée'); setQuartier(''); setFee(''); reloadRef.current(); }
    setSaving(false);
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    const { error } = await apiFetch(`/api/merchants/${merchant.id}/delivery-zones?zoneId=${zoneId}`, { method: 'DELETE' });
    if (error) { toast.error(error); return; }
    toast.success('Zone supprimée');
    reloadRef.current();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Zones de livraison</h2>
      <p className="text-sm text-muted-foreground">Définissez les zones et frais de livraison.</p>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Ajouter une zone</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Ville</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bamako">Bamako</SelectItem>
                  <SelectItem value="Kayes">Kayes</SelectItem>
                  <SelectItem value="Sikasso">Sikasso</SelectItem>
                  <SelectItem value="Ségou">Ségou</SelectItem>
                  <SelectItem value="Mopti">Mopti</SelectItem>
                  <SelectItem value="Gao">Gao</SelectItem>
                  <SelectItem value="Tombouctou">Tombouctou</SelectItem>
                  <SelectItem value="Koulikoro">Koulikoro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Quartier</Label>
              <Input value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Optionnel" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Frais (FCFA)</Label>
              <div className="flex gap-2">
                <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
                <Button onClick={handleAdd} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !zones.length ? (
            <p className="text-center text-muted-foreground py-8">Aucune zone configurée</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{z.city}{z.quartier ? ` · ${z.quartier}` : ''}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{formatPrice(z.fee)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(z.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 8. Subscription ────────────────────────────────────────────────────────

function SubscriptionView({ merchant }: { merchant: MerchantProfile }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<Plan[]>('/api/plans');
      if (data) setPlans(data);
      setLoading(false);
    })();
  }, []);

  const currentSub = merchant.subscriptions?.[0];
  const currentPlan = currentSub?.plan;

  if (loading) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)}</div>;
  }

  let features: string[] = [];
  try { features = currentPlan?.features ? JSON.parse(currentPlan.features) : []; } catch { /* ignore */ }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Abonnement</h2>
        <p className="text-sm text-muted-foreground">Choisissez le plan adapté à votre activité.</p>
      </div>

      {currentSub && currentPlan && (
        <Card className="border-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plan actuel</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{currentPlan.name}</p>
                {features.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {features.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(currentPlan.price)}</p>
                <p className="text-xs text-muted-foreground">/ {currentPlan.duration} jours</p>
                <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Actif
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          let planFeatures: string[] = [];
          try { planFeatures = plan.features ? JSON.parse(plan.features) : []; } catch { /* ignore */ }

          return (
            <Card key={plan.id} className={isCurrent ? 'border-emerald-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.duration} jours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-muted-foreground text-sm"> / {plan.duration}j</span>
                </div>
                {planFeatures.length > 0 && (
                  <ul className="space-y-1">
                    {planFeatures.map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.maxProducts && <p className="text-xs text-muted-foreground">Max {plan.maxProducts} produits</p>}
                {plan.maxCoupons && <p className="text-xs text-muted-foreground">Max {plan.maxCoupons} coupons</p>}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isCurrent}
                  onClick={() => toast.info('Le paiement d\'abonnement sera bientôt disponible')}
                >
                  {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── 9. Settings ────────────────────────────────────────────────────────────

function SettingsView({ merchant }: { merchant: MerchantProfile }) {
  const [form, setForm] = useState({
    businessName: merchant.businessName,
    businessType: merchant.businessType,
    description: merchant.description || '',
    address: merchant.address,
    city: merchant.city,
    quartier: merchant.quartier || '',
    phone: merchant.phone,
    email: merchant.email || '',
    website: merchant.website || '',
    operatingHours: merchant.operatingHours,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logo, setLogo] = useState(merchant.logo || '');

  const setField = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      setLogo(url);
      // Save logo immediately
      await apiFetch(`/api/merchants/${merchant.id}`, {
        method: 'PUT',
        body: JSON.stringify({ logo: url }),
      });
      toast.success('Logo mis à jour');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await apiFetch(`/api/merchants/${merchant.id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    if (error) { toast.error(error); }
    else { toast.success('Paramètres sauvegardés'); }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Paramètres</h2>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Logo de la boutique</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border bg-muted flex items-center justify-center shrink-0">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground/40" />
              )}
              {uploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent text-sm">
              <ImagePlus className="h-4 w-4" /> Changer le logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nom de la boutique</Label>
              <Input value={form.businessName} onChange={(e) => setField('businessName', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type d&apos;activité</Label>
              <Select value={form.businessType} onValueChange={(v) => setField('businessType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => setField('address', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ville</Label>
              <Input value={form.city} onChange={(e) => setField('city', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Quartier</Label>
              <Input value={form.quartier} onChange={(e) => setField('quartier', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Site web</Label>
              <Input value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Horaires d&apos;ouverture</Label>
              <Input value={form.operatingHours} onChange={(e) => setField('operatingHours', e.target.value)} placeholder="08:00-22:00" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 10. Coupons ────────────────────────────────────────────────────────────

function CouponsView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxUses: '', endDate: '',
  });

  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<Coupon[]>('/api/coupons');
      if (data) setCoupons(data);
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, []);

  const setField = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!form.code || !form.value || !form.endDate) {
      toast.error('Code, valeur et date de fin requis');
      return;
    }
    setSaving(true);
    const { error } = await apiFetch('/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: parseFloat(form.value) || 0,
        minOrder: parseInt(form.minOrder) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        endDate: form.endDate,
      }),
    });
    if (error) { toast.error(error); }
    else {
      toast.success('Coupon créé');
      setDialogOpen(false);
      setForm({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxUses: '', endDate: '' });
      reloadRef.current();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce coupon ?')) return;
    const { error } = await apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (error) { toast.error(error); return; }
    toast.success('Coupon supprimé');
    reloadRef.current();
  };

  const couponTypeLabel: Record<string, string> = {
    PERCENTAGE: 'Pourcentage',
    FIXED: 'Montant fixe',
    FREE_DELIVERY: 'Livraison gratuite',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Coupons</h2>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4 mr-2" /> Créer un coupon
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !coupons.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">Aucun coupon</p>
            <p className="text-muted-foreground text-sm mt-1">Créez votre premier coupon de réduction</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {coupons.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{c.code}</p>
                      <Badge variant="secondary">{couponTypeLabel[c.type] || c.type}</Badge>
                      <Badge variant={c.isActive ? 'default' : 'outline'}>
                        {c.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.type === 'PERCENTAGE' ? `${c.value}% de réduction` :
                        c.type === 'FIXED' ? `${formatPrice(c.value)} de réduction` :
                          'Livraison gratuite'}
                      {c.minOrder > 0 && ` · Min: ${formatPrice(c.minOrder)}`}
                      {c.maxUses && ` · Max: ${c.usedCount}/${c.maxUses} utilisations`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Expire le {new Date(c.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un coupon</DialogTitle>
            <DialogDescription>Créez un code promo pour vos clients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setField('code', e.target.value.toUpperCase())} placeholder="PROMO2024" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setField('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                  <SelectItem value="FIXED">Montant fixe</SelectItem>
                  <SelectItem value="FREE_DELIVERY">Livraison gratuite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type !== 'FREE_DELIVERY' && (
              <div className="flex flex-col gap-1.5">
                <Label>Valeur *</Label>
                <Input type="number" value={form.value} onChange={(e) => setField('value', e.target.value)} placeholder={form.type === 'PERCENTAGE' ? '10' : '1000'} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Commande min. (FCFA)</Label>
                <Input type="number" value={form.minOrder} onChange={(e) => setField('minOrder', e.target.value)} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Utilisations max</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setField('maxUses', e.target.value)} placeholder="Illimité" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date de fin *</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 11. Stats ──────────────────────────────────────────────────────────────

function StatsView() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<MerchantStats>('/api/stats/merchant');
      if (data) setStats(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>;
  }

  const statusBreakdown = stats?.ordersByStatus || [];
  const maxCount = Math.max(...statusBreakdown.map((s) => s._count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Statistiques</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Revenus totaux</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(stats?.totalRevenue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Commandes</p>
            <p className="text-2xl font-bold">{stats?.totalOrders ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Produits</p>
            <p className="text-2xl font-bold">{stats?.totalProducts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Note moyenne</p>
            <p className="text-2xl font-bold">{stats?.rating ? `${stats.rating.toFixed(1)}/5` : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart (bar representation) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Commandes par statut</CardTitle>
        </CardHeader>
        <CardContent>
          {!statusBreakdown.length ? (
            <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((s) => (
                <div key={s.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <StatusBadge status={s.status} />
                    </span>
                    <span className="font-semibold">{s._count}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${(s._count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent orders table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Dernières commandes</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentOrders?.length ? (
            <p className="text-center text-muted-foreground py-8">Aucune commande</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 12. Notifications ──────────────────────────────────────────────────────

function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await apiFetch<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
      setLoading(false);
    };
    reloadRef.current = load;
    void load();
  }, []);

  const markAllRead = async () => {
    const { error } = await apiFetch('/api/notifications', { method: 'PUT' });
    if (error) { toast.error(error); return; }
    toast.success('Toutes les notifications marquées comme lues');
    reloadRef.current();
  };

  const markOneRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    reloadRef.current();
  };

  const typeColors: Record<string, string> = {
    ORDER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PAYMENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    DELIVERY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    PROMO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    INFO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    SYSTEM: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} non lue(s)</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Tout marquer comme lu
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !notifications.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">Aucune notification</p>
            <p className="text-muted-foreground text-sm mt-1">Vos notifications apparaîtront ici</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors ${!n.isRead ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/5' : ''}`}
              onClick={() => { if (!n.isRead) markOneRead(n.id); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className={typeColors[n.type] || typeColors.INFO}>
                    {n.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 13. Profile ────────────────────────────────────────────────────────────

function ProfileView({ merchant }: { merchant: MerchantProfile }) {
  const { user, logout } = useAuthStore();
  const { setSpace } = useSpaceStore();
  const [notifs, setNotifs] = useState<{ unreadCount: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<{ unreadCount: number }>('/api/notifications?limit=1');
      if (data) setNotifs(data);
    })();
  }, []);

  const handleLogout = () => {
    logout();
    setSpace('landing');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-bold">Mon profil</h2>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user?.phone}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span>{merchant.businessName}</span>
              <Badge variant="secondary" className="ml-auto">{BUSINESS_TYPES[merchant.businessType] || merchant.businessType}</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{merchant.address}, {merchant.city}{merchant.quartier ? ` · ${merchant.quartier}` : ''}</span>
            </div>
            {merchant.email && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{merchant.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Star className="h-4 w-4 text-amber-500" />
              <span>{merchant.rating.toFixed(1)}/5 ({merchant.totalRatings} avis)</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span>{notifs?.unreadCount ?? 0} notification(s) non lue(s)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
      </Button>
    </div>
  );
}

// ─── 14. Support ────────────────────────────────────────────────────────────

function SupportView() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error('Sujet et description requis');
      return;
    }
    setSending(true);
    const { error } = await apiFetch('/api/support', {
      method: 'POST',
      body: JSON.stringify({ subject, description }),
    });
    if (error) { toast.error(error); }
    else {
      toast.success('Ticket envoyé avec succès');
      setSent(true);
      setSubject('');
      setDescription('');
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Ticket envoyé</h2>
        <p className="text-muted-foreground mt-2">Notre équipe vous répondra dans les plus brefs délais.</p>
        <Button onClick={() => setSent(false)} className="mt-6 bg-emerald-600 hover:bg-emerald-700">
          Envoyer un autre ticket
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Support</h2>
        <p className="text-sm text-muted-foreground">Besoin d&apos;aide ? Envoyez-nous un ticket.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Sujet *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Décrivez brièvement votre problème" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description *</Label>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Donnez-nous tous les détails nécessaires..."
            />
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-2" /> Envoyer le ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MerchantApp() {
  const { view, navigate } = useMerchantNav();
  const { user } = useAuthStore();
  const logout = useAuthStore((s) => s.logout);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifs, setNotifs] = useState<{ unreadCount: number } | null>(null);

  // Fetch merchant profile
  useEffect(() => {
    (async () => {
      const { data, error } = await apiFetch<MerchantProfile>('/api/merchants/me');
      if (data) setMerchant(data);
      if (error) toast.error(error);
      setLoading(false);
    })();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    (async () => {
      const { data } = await apiFetch<{ unreadCount: number }>('/api/notifications?limit=1');
      if (data) setNotifs(data);
    })();
  }, [view]);

  // ─── Approval check ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-bold">Profil marchand non trouvé</h2>
            <p className="text-muted-foreground mt-2">Votre profil marchand n&apos;a pas été trouvé. Veuillez contacter le support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!merchant.isApproved) {
    const handleLogout = () => {
      logout();
      toast.success('Déconnexion réussie');
    };
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            Rapigo Mali
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" />
            Déconnexion
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-6">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold">En attente d&apos;approbation</h2>
              <p className="text-muted-foreground mt-3 max-w-sm">
                Votre compte marchand <strong>{merchant.businessName}</strong> est en cours de vérification par notre équipe.
                Vous recevrez une notification une fois votre compte approuvé.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Merci de votre patience. Le processus prend généralement 24 à 48 heures.
              </p>

              {/* Support info */}
              <Separator className="my-6 w-full" />
              <div className="w-full space-y-3 text-left bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-center">Support &amp; Contact</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Layout ───
  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView merchant={merchant} />;
      case 'products': return <ProductsView merchant={merchant} />;
      case 'add-product': return <AddProductView merchant={merchant} />;
      case 'orders': return <OrdersView />;
      case 'order-detail': return <OrderDetailView />;
      case 'stats': return <StatsView />;
      case 'coupons': return <CouponsView />;
      case 'payment-config': return <PaymentConfigView merchant={merchant} />;
      case 'delivery-zones': return <DeliveryZonesView merchant={merchant} />;
      case 'subscription': return <SubscriptionView merchant={merchant} />;
      case 'settings': return <SettingsView merchant={merchant} />;
      case 'notifications': return <NotificationsView />;
      case 'profile': return <ProfileView merchant={merchant} />;
      case 'support': return <SupportView />;
      default: return <DashboardView merchant={merchant} />;
    }
  };

  const pageTitle: Record<string, string> = {
    dashboard: 'Tableau de bord',
    products: 'Produits',
    'add-product': 'Ajouter un produit',
    orders: 'Commandes',
    'order-detail': 'Détails de la commande',
    stats: 'Statistiques',
    coupons: 'Coupons',
    'payment-config': 'Configuration paiements',
    'delivery-zones': 'Zones de livraison',
    subscription: 'Abonnement',
    settings: 'Paramètres',
    notifications: 'Notifications',
    profile: 'Mon profil',
    support: 'Support',
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Desktop Sidebar ─── */}
      <aside className={`hidden lg:flex flex-col border-r bg-card transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-64'} sticky top-0 h-screen`}>
        <div className="flex items-center gap-3 p-4 border-b">
          {merchant.logo ? (
            <img src={merchant.logo} alt="" className={`h-8 w-8 rounded-lg object-cover shrink-0`} />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <span className="font-bold text-sm truncate">{merchant.businessName}</span>
          )}
          <Button
            variant="ghost" size="icon" className="ml-auto h-7 w-7 shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {SIDEBAR_ITEMS.map((item) => {
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => navigate(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r flex flex-col shadow-xl">
            <div className="flex items-center gap-3 p-4 border-b">
              {merchant.logo ? (
                <img src={merchant.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="font-bold text-sm truncate">{merchant.businessName}</span>
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 py-2">
              <nav className="space-y-1 px-2">
                {SIDEBAR_ITEMS.map((item) => {
                  const active = view === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => { navigate(item.view); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </aside>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg hidden sm:block">{pageTitle[view] || 'Tableau de bord'}</h1>

            <div className="ml-auto flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost" size="icon" className="relative h-9 w-9"
                onClick={() => navigate('notifications')}
              >
                <Bell className="h-4 w-4" />
                {(notifs?.unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {notifs!.unreadCount > 9 ? '9+' : notifs!.unreadCount}
                  </span>
                )}
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium max-w-32 truncate">
                      {merchant.businessName}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('profile')}>
                    <User className="h-4 w-4 mr-2" /> Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('settings')}>
                    <Settings className="h-4 w-4 mr-2" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('notifications')}>
                    <Bell className="h-4 w-4 mr-2" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => { useAuthStore.getState().logout(); useSpaceStore.getState().setSpace('landing'); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {renderView()}
        </main>

        {/* ─── Mobile Bottom Nav ─── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-30 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => navigate(item.view)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors relative ${
                    active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                  }`}
                >
                  {item.view === 'notifications' && (notifs?.unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-0.5 right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center font-bold">
                      {notifs!.unreadCount > 9 ? '9' : notifs!.unreadCount}
                    </span>
                  )}
                  <item.icon className={`h-5 w-5 ${active ? 'text-emerald-600' : ''}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}