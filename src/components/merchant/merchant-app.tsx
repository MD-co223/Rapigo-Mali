'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Megaphone, Receipt, Crown, Settings, Headphones, Plus, Search, Star, TrendingUp, TrendingDown, Clock, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Bell, MessageSquare, User, ArrowLeft, Tag, Gift, Copy, Check, CreditCard, MapPin, Phone, Store, ImageIcon, Filter, ArrowUpRight, ArrowDownRight, Users, X, Upload } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// ─── Types ───────────────────────────────────────────────
interface MerchantInfo {
  id: string;
  businessName: string;
  businessType: string;
  description: string | null;
  address: string;
  phone: string;
  operatingHours: string;
  rating: number;
  city: string;
  quartier: string | null;
  subscriptions: Array<{ plan: { name: string; price: number; features: string | null } }>;
}

// ─── Helpers ─────────────────────────────────────────────
function EmptyState({ icon: Icon, title, action, onAction }: { icon: React.ElementType; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-center text-sm">{title}</p>
      {action && onAction && (
        <Button onClick={onAction} variant="outline" className="mt-4" size="sm">
          {action}
        </Button>
      )}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="glass-card"><CardContent className="p-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
      ))}
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ─── SIDEBAR ITEMS ───────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'products' as const, label: 'Produits', icon: Package },
  { id: 'orders' as const, label: 'Commandes', icon: ShoppingCart },
  { id: 'stats' as const, label: 'Statistiques', icon: BarChart3 },
  { id: 'marketing' as const, label: 'Marketing', icon: Megaphone },
  { id: 'subscription' as const, label: 'Abonnement', icon: Crown },
  { id: 'billing' as const, label: 'Facturation', icon: Receipt },
  { id: 'settings' as const, label: 'Paramètres', icon: Settings },
  { id: 'support' as const, label: 'Support', icon: Headphones },
  { id: 'profile' as const, label: 'Profil', icon: User },
];

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function MerchantApp() {
  const { view, data, navigate } = useMerchantNav();
  const { user, logout } = useAuthStore();
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [merchantLoading, setMerchantLoading] = useState(true);

  // Fetch merchant info on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/merchants/me?userId=${user.id}`);
        if (res.ok) {
          const m = await res.json();
          setMerchant(m);
        }
      } catch { /* silent */ }
      setMerchantLoading(false);
    })();
  }, [user?.id]);

  const merchantId = merchant?.id;

  return (
    <div className="flex h-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card/50 backdrop-blur-sm shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate gradient-text">Rapigo</p>
              <p className="text-xs text-muted-foreground truncate">{merchantLoading ? 'Chargement...' : merchant?.businessName || 'Marchand'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id || (item.id === 'orders' && view === 'order-detail');
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={logout}>
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm gradient-text">Rapigo</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('notifications')}>
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('chat')}>
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 pb-24 md:pb-6"
            >
              {view === 'dashboard' && <DashboardView merchantId={merchantId} navigate={navigate} />}
              {view === 'products' && <ProductsView merchantId={merchantId} navigate={navigate} />}
              {view === 'add-product' && <AddProductView merchantId={merchantId} data={data} navigate={navigate} />}
              {view === 'orders' && <OrdersView merchantId={merchantId} navigate={navigate} />}
              {view === 'order-detail' && <OrderDetailView data={data} navigate={navigate} />}
              {view === 'stats' && <StatsView merchantId={merchantId} />}
              {view === 'marketing' && <MarketingView merchantId={merchantId} />}
              {view === 'billing' && <BillingView merchantId={merchantId} />}
              {view === 'settings' && <SettingsView merchant={merchant} userId={user?.id} setMerchant={setMerchant} />}
              {view === 'subscription' && <SubscriptionView merchant={merchant} />}
              {view === 'chat' && <EmptyState icon={MessageSquare} title="Aucune conversation" />}
              {view === 'support' && <SupportView userId={user?.id} />}
              {view === 'notifications' && <EmptyState icon={Bell} title="Aucune notification" />}
              {view === 'profile' && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t flex safe-area-bottom z-50">
          {[
            { id: 'dashboard' as const, label: 'Tableau de bord', icon: LayoutDashboard },
            { id: 'products' as const, label: 'Produits', icon: Package },
            { id: 'orders' as const, label: 'Commandes', icon: ShoppingCart },
            { id: 'profile' as const, label: 'Profil', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 pt-2.5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

// ─── 1. DASHBOARD VIEW ───────────────────────────────────
function DashboardView({ merchantId, navigate }: { merchantId?: string; navigate: (v: 'orders' | 'add-product' | 'order-detail', d?: Record<string, string>) => void }) {
  const [stats, setStats] = useState<Record<string, string | number | null | undefined> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      try {
        const res = await fetch(`/api/stats/merchant?merchantId=${merchantId}`);
        if (res.ok) setStats(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [merchantId]);

  const recentOrders = (stats?.recentOrders as unknown as Array<Record<string, any>>) || [];
  const kpis = [
    { label: 'Total commandes', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400' },
    { label: "Revenu du jour", value: formatPrice((stats?.todayRevenue as number) || 0), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'En attente', value: stats?.pendingOrders ?? 0, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Note moyenne', value: `${((stats?.avgRating as number) || 0).toFixed(1)} ★`, icon: Star, color: 'text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d&apos;ensemble de votre activité</p>
        </div>
        <Button size="sm" onClick={() => navigate('add-product')}>
          <Plus className="w-4 h-4 mr-1" /> Produit
        </Button>
      </div>

      {loading ? <LoadingCards /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Commandes récentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('orders')}>
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Aucune commande pour le moment" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentOrders.map((order) => {
                const items = order.items as Array<Record<string, unknown>> | undefined;
                const orderStatus = String(order.status || '');
                return (
                  <div
                    key={String(order.id)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('order-detail', { id: String(order.id) })}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{String(order.orderNumber)}</span>
                        <Badge className={`text-[10px] ${ORDER_STATUS_COLORS[orderStatus] || ''}`}>
                          {ORDER_STATUS_LABELS[orderStatus] || orderStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {items?.length ?? 0} article(s) · {new Date(order.createdAt as string).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(order.total as number)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 2. PRODUCTS VIEW ────────────────────────────────────
function ProductsView({ merchantId, navigate }: { merchantId?: string; navigate: (v: 'add-product' | 'products', d?: Record<string, string>) => void }) {
  const [products, setProducts] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    if (!merchantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await fetch(`/api/products?merchantId=${merchantId}&all=true${q}`);
        if (res.ok && !cancelled) setProducts(await res.json());
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [merchantId, search, fetchTrigger]);

  const refetchProducts = () => setFetchTrigger((t) => t + 1);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/products?id=${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Produit supprimé');
        refetchProducts();
      } else toast.error('Erreur lors de la suppression');
    } catch { toast.error('Erreur serveur'); }
    setDeleteId(null);
  };

  const handleToggle = async (product: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isAvailable: !product.isAvailable }),
      });
      if (res.ok) {
        toast.success(product.isAvailable ? 'Produit désactivé' : 'Produit activé');
        refetchProducts();
      }
    } catch { toast.error('Erreur serveur'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Produits</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produit(s)</p>
        </div>
        <Button size="sm" onClick={() => navigate('add-product')}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="Aucun produit" action="Ajouter un produit" onAction={() => navigate('add-product')} />
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
          {products.map((p) => (
            <Card key={p.id as string} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image ? (
                      <img src={p.image as string} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{p.name as string}</p>
                      <Badge variant={p.isAvailable ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {p.isAvailable ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.category?.name || ''} · Stock: {p.stock as number}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold">{formatPrice(p.price as number)}</span>
                      {p.comparePrice && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.comparePrice as number)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={p.isAvailable as boolean} onCheckedChange={() => handleToggle(p)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('add-product', { id: p.id as string })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(p.id as string)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 3. ADD/EDIT PRODUCT VIEW ────────────────────────────
function AddProductView({ merchantId, data, navigate }: { merchantId?: string; data?: Record<string, string>; navigate: (v: 'products') => void }) {
  const isEditing = !!data?.id;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', comparePrice: '', stock: '', categoryId: '', isAvailable: true, isFeatured: false,
  });

  useEffect(() => {
    fetch('/api/categories').then(r => r.ok && r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing || !data?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/products?merchantId=${merchantId}&all=true`);
        if (res.ok) {
          const products: Array<Record<string, unknown>> = await res.json();
          const p = products.find((x) => x.id === data.id);
          if (p) {
            // Parse images array from product
            let parsedImages: string[] = [];
            if (p.images) {
              try { parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images as string[]); } catch { /* ignore */ }
            }
            if (p.image && !parsedImages.includes(p.image as string)) {
              parsedImages.unshift(p.image as string);
            }
            setImages(parsedImages);
            setForm({
              name: p.name as string,
              description: (p.description as string) || '',
              price: String(p.price),
              comparePrice: p.comparePrice ? String(p.comparePrice) : '',
              stock: String(p.stock),
              categoryId: (p.categoryId as string) || '',
              isAvailable: p.isAvailable !== false,
              isFeatured: (p.isFeatured as boolean) || false,
            });
          }
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [isEditing, data?.id, merchantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return toast.error('Marchand non trouvé');
    if (!form.name || !form.price) return toast.error('Nom et prix requis');
    setSaving(true);
    try {
      const url = '/api/products';
      const method = isEditing ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: form.price,
        comparePrice: form.comparePrice || null,
        stock: parseInt(form.stock) || 0,
        merchantId,
        categoryId: form.categoryId || null,
        image: images[0] || null,
        images: images.length > 0 ? images : null,
        isAvailable: form.isAvailable,
        isFeatured: form.isFeatured,
      };
      if (isEditing) body.id = data!.id;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(isEditing ? 'Produit mis à jour' : 'Produit créé avec succès');
        navigate('products');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur');
      }
    } catch { toast.error('Erreur serveur'); }
    setSaving(false);
  };

  const setField = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('products')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold gradient-text">{isEditing ? 'Modifier le produit' : 'Ajouter un produit'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Informations de base</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nom du produit *</label>
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ex: Poulet Braisé" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Description du produit..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Prix (FCFA) *</label>
                <Input type="number" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="5000" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prix barré (FCFA)</label>
                <Input type="number" value={form.comparePrice} onChange={(e) => setField('comparePrice', e.target.value)} placeholder="6000" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Stock</label>
                <Input type="number" value={form.stock} onChange={(e) => setField('stock', e.target.value)} placeholder="50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Catégorie</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setField('categoryId', e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id as string} value={c.id as string}>{c.name as string}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Multi-Image Upload */}
            <div>
              <label className="text-sm font-medium mb-1 block">Photos du produit</label>
              <div className="flex items-center gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border bg-muted group">
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((imgs) => imgs.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/60 text-white py-0.5">Principale</span>
                    )}
                  </div>
                ))}
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-0.5">Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result as string;
                          setImages((prev) => [...prev, result]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">La première photo sera l&apos;image principale</p>
            </div>

            {/* Availability & Featured Toggles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Produit disponible</label>
              </div>
              <Switch checked={form.isAvailable as boolean} onCheckedChange={(v) => setField('isAvailable', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Produit mis en avant</label>
              </div>
              <Switch checked={form.isFeatured as boolean} onCheckedChange={(v) => setField('isFeatured', v)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('products')} className="flex-1">Annuler</Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── 4. ORDERS VIEW ──────────────────────────────────────
function OrdersView({ merchantId, navigate }: { merchantId?: string; navigate: (v: 'order-detail' | 'orders', d?: Record<string, string>) => void }) {
  const [orders, setOrders] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!merchantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const statusParam = tab !== 'all' ? `&status=${tab}` : '';
        const res = await fetch(`/api/orders?merchantId=${merchantId}${statusParam}`);
        if (res.ok && !cancelled) setOrders(await res.json());
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [merchantId, tab]);

  const tabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'PENDING', label: 'En attente' },
    { id: 'CONFIRMED', label: 'Confirmées' },
    { id: 'PREPARING', label: 'En cours' },
    { id: 'DELIVERED', label: 'Livrées' },
    { id: 'CANCELLED', label: 'Annulées' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Commandes</h1>
        <p className="text-sm text-muted-foreground mt-1">{orders.length} commande(s)</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full overflow-x-auto flex">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs whitespace-nowrap">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Aucune commande trouvée" />
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto">
          {orders.map((order) => {
            const items = order.items as Array<Record<string, unknown>> | undefined;
            return (
              <Card key={order.id as string} className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('order-detail', { id: order.id as string })}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">#{order.orderNumber as string}</span>
                        <Badge className={`text-[10px] ${ORDER_STATUS_COLORS[order.status as string] || ''}`}>
                          {ORDER_STATUS_LABELS[order.status as string] || order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {items?.length ?? 0} article(s) · {new Date(order.createdAt as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.deliveryAddress as string}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold">{formatPrice(order.total as number)}</p>
                      <p className="text-[10px] text-muted-foreground">{order.paymentMethod as string}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 5. ORDER DETAIL VIEW ────────────────────────────────
function OrderDetailView({ data, navigate }: { data?: Record<string, string>; navigate: (v: 'orders') => void }) {
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!data?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${data.id}`);
        if (res.ok) setOrder(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [data?.id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        toast.success(`Commande mise à jour: ${ORDER_STATUS_LABELS[status]}`);
      } else toast.error('Erreur lors de la mise à jour');
    } catch { toast.error('Erreur serveur'); }
    setUpdating(false);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-48 w-full" /></div>;
  if (!order) return <EmptyState icon={ShoppingCart} title="Commande non trouvée" action="Retour aux commandes" onAction={() => navigate('orders')} />;

  const items = (order.items as Array<Record<string, unknown>>) || [];
  const status = order.status as string;
  const merchantFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
  const currentIndex = merchantFlow.indexOf(status);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('orders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Commande #{order.orderNumber as string}</h1>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt as string).toLocaleString('fr-FR')}</p>
        </div>
      </div>

      {/* Status Badge */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <Badge className={`text-sm px-3 py-1 ${ORDER_STATUS_COLORS[status]}`}>
            {ORDER_STATUS_LABELS[status]}
          </Badge>
          <div className="flex items-center gap-2 mt-3">
            {merchantFlow.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-3 h-3 rounded-full ${i <= currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                {i < merchantFlow.length - 1 && <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-primary' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {merchantFlow.map((s) => (
              <span key={s} className="text-[9px] text-muted-foreground text-center flex-1">{ORDER_STATUS_LABELS[s]}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {status !== 'DELIVERED' && status !== 'CANCELLED' && (
        <div className="flex gap-2 flex-wrap">
          {status === 'PENDING' && (
            <Button size="sm" onClick={() => updateStatus('CONFIRMED')} disabled={updating}>
              <Check className="w-4 h-4 mr-1" /> Confirmer
            </Button>
          )}
          {status === 'CONFIRMED' && (
            <Button size="sm" onClick={() => updateStatus('PREPARING')} disabled={updating}>
              <Package className="w-4 h-4 mr-1" /> Préparer
            </Button>
          )}
          {status === 'PREPARING' && (
            <Button size="sm" onClick={() => updateStatus('READY')} disabled={updating}>
              <Check className="w-4 h-4 mr-1" /> Prête
            </Button>
          )}
        </div>
      )}

      {/* Items */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Articles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id as string} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {item.productImage ? <img src={item.productImage as string} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName as string}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity as number}</p>
              </div>
              <span className="text-sm font-semibold">{formatPrice(item.totalPrice as number)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Customer & Delivery */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Livraison</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground shrink-0" /><span>{order.deliveryAddress as string}, {order.deliveryCity as string}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground shrink-0" /><span>~{order.estimatedTime as number} min</span></div>
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground shrink-0" /><span>{order.paymentMethod as string}</span></div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatPrice(order.subtotal as number)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatPrice(order.deliveryFee as number)}</span></div>
          {(order.discount as number) > 0 && (
            <div className="flex justify-between text-emerald-600"><span>Remise</span><span>-{formatPrice(order.discount as number)}</span></div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatPrice(order.total as number)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 6. STATS VIEW ───────────────────────────────────────
function StatsView({ merchantId }: { merchantId?: string }) {
  const [stats, setStats] = useState<Record<string, string | number | null | undefined> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      try {
        const res = await fetch(`/api/stats/merchant?merchantId=${merchantId}`);
        if (res.ok) setStats(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [merchantId]);

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;
  if (!stats) return <EmptyState icon={BarChart3} title="Aucune donnée statistique" />;

  const weeklyRevenue = (stats.weeklyRevenue as unknown as Array<{ day: string; revenue: number }>) || [];
  const ordersByStatus = (stats.ordersByStatus as unknown as Array<{ status: string; count: number }>) || [];
  const topProducts = (stats.topProducts as unknown as Array<{ productName: string; _sum: { quantity: number; totalPrice: number } }>) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Statistiques</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyse de votre activité</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600' },
          { label: 'Revenu total', value: formatPrice((stats.totalRevenue as number) || 0), icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'En attente', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-600' },
          { label: 'Produits', value: stats.productCount, icon: Package, color: 'text-purple-600' },
        ].map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Revenu des 7 derniers jours</CardTitle></CardHeader>
          <CardContent>
            {weeklyRevenue.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Aucune donnée de revenu" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Commandes par statut</CardTitle></CardHeader>
          <CardContent>
            {ordersByStatus.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Aucune donnée" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="status" fontSize={11} tickLine={false} tickFormatter={(v) => ORDER_STATUS_LABELS[v]?.substring(0, 8) || v} />
                  <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [value, 'Commandes']} labelFormatter={(v) => ORDER_STATUS_LABELS[v] || v} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Produits les plus vendus</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <EmptyState icon={Package} title="Aucune donnée" />
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-sm">{p.productName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(p._sum.totalPrice)}</p>
                    <p className="text-[10px] text-muted-foreground">{p._sum.quantity} vendu(s)</p>
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

// ─── 7. MARKETING VIEW ───────────────────────────────────
function MarketingView({ merchantId }: { merchantId?: string }) {
  const [coupons, setCoupons] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'PERCENTAGE', value: '', code: '', startDate: '', endDate: '', maxUses: '' });

  const [couponTrigger, setCouponTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/coupons')
      .then((r) => r.ok ? r.json() : [])
      .then((all) => {
        if (!cancelled) setCoupons((all as Array<Record<string, unknown>>).filter((c) => c.merchantId === merchantId));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [merchantId, couponTrigger]);

  const refetchCoupons = () => setCouponTrigger((t) => t + 1);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.endDate) return toast.error('Code, valeur et date de fin requis');
    setSaving(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: parseFloat(form.value),
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          merchantId,
          startDate: form.startDate || new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        toast.success('Promotion créée avec succès');
        setDialogOpen(false);
        setForm({ title: '', type: 'PERCENTAGE', value: '', code: '', startDate: '', endDate: '', maxUses: '' });
        refetchCoupons();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur');
      }
    } catch { toast.error('Erreur serveur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Marketing</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos promotions</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Créer une promotion
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={Megaphone} title="Aucune promotion active" action="Créer une promotion" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {coupons.map((c) => (
            <Card key={c.id as string} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-mono font-bold text-sm">{c.code as string}</span>
                      <Badge variant="outline" className="text-[10px]">{c.type as string}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value as number)} · Expire le {new Date(c.endDate as string).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-[10px]">
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une promotion</DialogTitle>
            <DialogDescription>Configurez votre coupon de réduction</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Titre</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Promo d'été" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="PERCENTAGE">Pourcentage</option>
                  <option value="FIXED">Montant fixe</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valeur {form.type === 'PERCENTAGE' ? '(%)' : '(FCFA)'}</label>
                <Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder={form.type === 'PERCENTAGE' ? '10' : '500'} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Code promo</label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PROMO10" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date début</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date fin *</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Utilisations max</label>
              <Input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="Illimité" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Création...' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 8. BILLING VIEW ─────────────────────────────────────
function BillingView({ merchantId }: { merchantId?: string }) {
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) setPlans(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Facturation</h1>
        <p className="text-sm text-muted-foreground mt-1">Historique et informations de facturation</p>
      </div>

      <EmptyState icon={Receipt} title="Aucune facture" />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : plans.length > 0 ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Formules disponibles</CardTitle>
            <CardDescription>Votre plan actuel et les options disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {plans.map((plan) => {
                const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) as string[] : [];
                return (
                  <div key={plan.id as string} className="flex items-center justify-between p-3 rounded-xl border">
                    <div>
                      <p className="text-sm font-medium">{plan.name as string}</p>
                      <p className="text-xs text-muted-foreground">{features.slice(0, 3).join(' · ')}</p>
                    </div>
                    <span className="text-sm font-bold">{formatPrice(plan.price as number)}<span className="text-xs text-muted-foreground font-normal">/{plan.duration as number}j</span></span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ─── 9. SETTINGS VIEW ────────────────────────────────────
function SettingsView({ merchant, userId, setMerchant }: { merchant?: MerchantInfo | null; userId?: string; setMerchant: (m: MerchantInfo) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: '', description: '', address: '', phone: '', operatingHours: '', businessType: '',
  });

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (merchant && !initializedRef.current) {
      initializedRef.current = true;
      (async () => {
        setForm({
          businessName: merchant.businessName || '',
          description: merchant.description || '',
          address: merchant.address || '',
          phone: merchant.phone || '',
          operatingHours: merchant.operatingHours || '',
          businessType: merchant.businessType || '',
        });
      })();
    }
  }, [merchant]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/merchants/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...form }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMerchant(updated);
        toast.success('Paramètres enregistrés');
      } else toast.error('Erreur lors de l\'enregistrement');
    } catch { toast.error('Erreur serveur'); }
    setSaving(false);
  };

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Informations de votre commerce</p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nom du commerce</label>
            <Input value={form.businessName} onChange={(e) => setField('businessName', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Adresse</label>
            <Input value={form.address} onChange={(e) => setField('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Téléphone</label>
              <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Horaires</label>
              <Input value={form.operatingHours} onChange={(e) => setField('operatingHours', e.target.value)} placeholder="08:00-22:00" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Type de commerce</label>
            <select value={form.businessType} onChange={(e) => setField('businessType', e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              <option value="RESTAURANT">Restaurant</option>
              <option value="SUPERMARKET">Supermarché</option>
              <option value="PHARMACY">Pharmacie</option>
              <option value="BOUTIQUE">Boutique</option>
              <option value="COLIS">Service de colis</option>
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 10. SUBSCRIPTION VIEW ───────────────────────────────
function SubscriptionView({ merchant }: { merchant?: MerchantInfo | null }) {
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) setPlans(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, []);

  const currentPlan = merchant?.subscriptions?.[0]?.plan;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Abonnement</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez votre formule</p>
      </div>

      {currentPlan && (
        <Card className="glass-card border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium">Plan actuel</p>
                <p className="text-lg font-bold gradient-text">{currentPlan.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 w-full" />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={Crown} title="Aucun plan disponible" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) as string[] : [];
            const isCurrent = currentPlan?.name === plan.name;
            return (
              <Card key={plan.id as string} className={`glass-card ${isCurrent ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{plan.name as string}</CardTitle>
                  <CardDescription className="text-xs">{plan.duration as number} jours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-2xl font-bold">{formatPrice(plan.price as number)}</span>
                    <span className="text-xs text-muted-foreground"> / {plan.duration as number}j</span>
                  </div>
                  {features.length > 0 && (
                    <ul className="space-y-1.5">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : 'default'}
                    disabled={isCurrent}
                    onClick={() => toast.success('Demande d\'abonnement envoyée')}
                  >
                    {isCurrent ? 'Plan actuel' : "S'abonner"}
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

// ─── 12. SUPPORT VIEW ────────────────────────────────────
function SupportView({ userId }: { userId?: string }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return toast.error('Veuillez remplir tous les champs');
    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subject, description: message }),
      });
      if (res.ok) {
        toast.success('Message envoyé avec succès');
        setSubject('');
        setMessage('');
      } else toast.error('Erreur lors de l\'envoi');
    } catch { toast.error('Erreur serveur'); }
    setSending(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Besoin d&apos;aide ? Contactez notre équipe</p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Sujet</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Décrivez brièvement votre problème" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre problème en détail..." rows={5} required />
            </div>
            <Button type="submit" disabled={sending} className="w-full sm:w-auto">
              {sending ? 'Envoi en cours...' : 'Envoyer le message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 14. PROFILE VIEW ────────────────────────────────────
function ProfileView() {
  const { user, logout } = useAuthStore();

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Profil</h1>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {(user?.firstName?.[0] || 'M')}{(user?.lastName?.[0] || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Separator />
          <div className="w-full space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rôle</span>
              <Badge>Marchand</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant={user?.isVerified ? 'default' : 'secondary'}>
                {user?.isVerified ? 'Vérifié' : 'Non vérifié'}
              </Badge>
            </div>
          </div>
          <Separator />
          <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={logout}>
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}