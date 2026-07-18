'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, ClipboardList, Heart, User, MapPin, Clock, Star,
  Bell, Plus, Minus, Trash2, ShoppingBag, ChevronLeft, Store,
  Send, Wallet, HelpCircle, Package, Upload, Tag, X, Loader2,
  MoreHorizontal, StarOff, Copy, MessageSquare, Phone, Check,
  RefreshCw, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAuthStore, useClientNav, useCartStore, useSpaceStore, apiFetch,
  formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  BUSINESS_TYPES, PAYMENT_METHODS, PAYMENT_STATUS_LABELS,
  type AppliedCoupon,
} from '@/lib/store';
import { toast } from 'sonner';
import { SupportContact } from '@/components/support-contact';
import { RapigoLogo } from '@/components/rapigo-logo';

/* ── Types ─────────────────────────────────── */
interface Merchant { id: string; businessName: string; businessType: string; shortDescription?: string; logo?: string; coverImage?: string; address: string; phone: string; operatingHours: string; isFeatured: boolean; rating: number; totalRatings: number; city: string; quartier?: string; deliveryZones?: { city: string; quartier: string; fee: number; isActive: boolean }[]; _count?: { products: number } }
interface Product { id: string; name: string; shortDescription?: string; longDescription?: string; price: number; comparePrice?: number; image?: string; stock: number; isAvailable: boolean; rating: number; totalSold: number; merchantId: string; preparationTime?: number; supplements?: string; category?: { name: string; icon?: string; id: string }; merchant?: { businessName: string; id: string; logo?: string } }
interface Order { id: string; orderNumber: string; status: string; subtotal: number; deliveryFee: number; serviceFee: number; discount: number; total: number; paymentMethod: string; paymentStatus: string; paymentProof?: string; deliveryAddress: string; deliveryCity: string; deliveryQuartier?: string; notes?: string; estimatedTime?: number; createdAt: string; items: OrderItem[]; merchant: { id: string; businessName: string; logo?: string; address?: string }; driver?: { id: string; user: { firstName: string; lastName: string; phone: string; avatar?: string } } }
interface OrderItem { id: string; name: string; price: number; quantity: number; supplements?: string }
interface Category { id: string; name: string; icon?: string; image?: string; _count?: { products: number } }
interface Favorite { id: string; productId: string; product: Product & { merchant: { id: string; businessName: string; logo?: string }; category: { name: string; icon?: string; id: string } } }
interface AppNotification { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }
interface WalletData { id: string; balance: number; transactions: { id: string; type: string; amount: number; description: string; createdAt: string }[] }
interface CouponValid { valid: boolean; discount?: number; type?: string; couponId?: string; error?: string }
type Supplement = { name: string; price: number };

/* ── Helpers ───────────────────────────────── */
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.3 } };
const ease = [0, 0, 0.2, 1] as const;

function Stars({ rating, size = 14, interactive, onRate }: { rating: number; size?: number; interactive?: boolean; onRate?: (r: number) => void }) {
  return <span className="inline-flex items-center gap-0.5">{[1,2,3,4,5].map(i => {
    const filled = i <= Math.round(rating);
    return interactive ? (
      <button key={i} type="button" onClick={() => onRate?.(i)} className="p-0.5 rounded-sm hover:scale-110 transition-transform focus:outline-none"><Star size={size} className={filled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-300 dark:text-gray-600'} /></button>
    ) : <Star key={i} size={size} className={filled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-300 dark:text-gray-600'} />;
  })}<span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span></span>;
}

function Spinner() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;
}
function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 p-0 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
          <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
function SkeletonDetail() {
  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="border-t pt-4 mt-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

function Empty({ icon: Icon, label, description }: { icon: React.ElementType; label: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-base font-medium text-muted-foreground mb-1">{label}</p>
      {description && <p className="text-sm text-muted-foreground/70 max-w-xs">{description}</p>}
    </div>
  );
}

function parseSupplements(raw?: string): Supplement[] {
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/* ── Bottom Nav ────────────────────────────── */
function BottomNav() {
  const { view, navigate } = useClientNav();
  const [plusOpen, setPlusOpen] = useState(false);
  const { getItemCount } = useCartStore();

  const tabs = [
    { key: 'home', icon: Home, label: 'Accueil' },
    { key: 'orders', icon: ClipboardList, label: 'Commandes' },
    { key: 'favorites', icon: Heart, label: 'Favoris' },
    { key: 'profile', icon: User, label: 'Profil' },
  ] as const;

  const moreItems = [
    { icon: Wallet, label: 'Portefeuille', view: 'wallet' as const },
    { icon: Bell, label: 'Notifications', view: 'notifications' as const },
    { icon: HelpCircle, label: 'Support', view: 'support' as const },
    { icon: Tag, label: 'Coupons', view: 'coupons' as const },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 dark:bg-gray-950/95 backdrop-blur-md safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around h-16 px-2">
          {tabs.map(t => {
            const active = view === t.key;
            return (
              <button key={t.key} onClick={() => { if (view !== t.key) navigate(t.key); }} className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 min-w-[56px] transition-colors ${active ? 'text-emerald-700' : 'text-muted-foreground hover:text-foreground'}`}>
                <t.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            );
          })}
          <button onClick={() => setPlusOpen(true)} className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 min-w-[56px] text-muted-foreground hover:text-foreground transition-colors`}>
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>
      <Sheet open={plusOpen} onOpenChange={setPlusOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[50vh]">
          <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-4 px-2">
            {moreItems.map(m => (
              <button key={m.view} onClick={() => { setPlusOpen(false); navigate(m.view); }} className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-emerald-50 transition-colors">
                <m.icon className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ── 1. Home ───────────────────────────────── */
function HomeView() {
  const { navigate } = useClientNav();
  const [query, setQuery] = useState('');
  const [cats, setCats] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, m] = await Promise.all([apiFetch<Category[]>('/api/categories'), apiFetch<Merchant[]>('/api/merchants?approved=true')]);
      if (c.data) setCats(c.data);
      if (m.data) setMerchants(Array.isArray(m.data) ? m.data : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="px-4 pt-4 space-y-6">
      <div className="flex items-center gap-3">
        <RapigoLogo variant="icon" height={28} />
      </div>
      <div className="relative" onClick={() => navigate('search', { q: query })}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un commerçant ou produit..." className="pl-9 bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-emerald-600" readOnly />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Catégories</h2>
        <ScrollArea className="w-full"><div className="flex gap-2 pb-2">
          {cats.map(c => (
            <button key={c.id} onClick={() => navigate('category', { id: c.id })} className="flex-shrink-0 rounded-full border bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm">{c.icon && <span className="mr-1">{c.icon}</span>}{c.name}</button>
          ))}
        </div></ScrollArea>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Commerçants à proximité</h2>
        {loading ? <SkeletonList /> : merchants.length === 0 ? <Empty icon={Store} label="Aucun commerçant disponible" description="Revenez plus tard pour découvrir de nouveaux commerçants." /> : (
          <div className="space-y-3">{merchants.map(m => (
            <Card key={m.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('merchant-detail', { id: m.id })}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">{m.businessName.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{m.businessName}</h3>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">{BUSINESS_TYPES[m.businessType] || m.businessType}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {m.rating > 0 && <Stars rating={m.rating} size={12} />}
                      <span className="flex items-center gap-1"><MapPin size={12} />{m.city}{m.quartier ? ` · ${m.quartier}` : ''}</span>
                    </div>
                    {m.shortDescription && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.shortDescription}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}</div>
        )}
      </div>
    </div>
  );
}

/* ── 2. Search ─────────────────────────────── */
function SearchView() {
  const { data, navigate } = useClientNav();
  const [q, setQ] = useState(data?.q || '');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!q.trim()) return;
    setSearched(true);
    const [mRes, pRes] = await Promise.all([
      apiFetch<Merchant[]>(`/api/merchants?search=${encodeURIComponent(q)}&approved=true`),
      apiFetch<Product[]>(`/api/products?search=${encodeURIComponent(q)}&isAvailable=true`),
    ]);
    if (mRes.data) setMerchants(Array.isArray(mRes.data) ? mRes.data : []);
    if (pRes.data) setProducts(Array.isArray(pRes.data) ? pRes.data : []);
  };

  useEffect(() => { if (q) doSearch(); }, []); // eslint-disable-line

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('home')}><ChevronLeft size={20} /></Button>
        <h1 className="text-lg font-bold">Recherche</h1>
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Rechercher..." className="bg-gray-50 dark:bg-gray-800" autoFocus />
        <Button onClick={doSearch} className="bg-emerald-700 hover:bg-emerald-800"><Search size={16} /></Button>
      </div>
      {!searched ? <Empty icon={Search} label="Tapez pour rechercher" /> : merchants.length + products.length === 0 ? <Empty icon={Search} label="Aucun résultat trouvé" /> : (
        <div className="space-y-4">
          {merchants.length > 0 && (<div className="space-y-2"><h3 className="text-sm font-semibold text-gray-600">Commerçants</h3>{merchants.map(m => (
            <Card key={m.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('merchant-detail', { id: m.id })}>
              <CardContent className="p-3 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">{m.businessName.charAt(0)}</div><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{m.businessName}</p><p className="text-xs text-muted-foreground">{m.address}</p></div><Badge variant="secondary" className="text-[10px]">{BUSINESS_TYPES[m.businessType] || m.businessType}</Badge></CardContent>
            </Card>
          ))}</div>)}
          {products.length > 0 && (<div className="space-y-2"><h3 className="text-sm font-semibold text-gray-600">Produits</h3>{products.map(p => (
            <Card key={p.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('product-detail', { id: p.id })}>
              <CardContent className="p-3 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400"><Package size={18} /></div><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{p.name}</p><p className="text-xs text-muted-foreground">{p.merchant?.businessName}</p></div><span className="font-semibold text-sm text-emerald-700">{formatPrice(p.price)}</span></CardContent>
            </Card>
          ))}</div>)}
        </div>
      )}
    </div>
  );
}

/* ── 3. Category ───────────────────────────── */
function CategoryView() {
  const { data, goBack, navigate } = useClientNav();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data?.id) return;
    apiFetch<Product[]>(`/api/products?categoryId=${data.id}&isAvailable=true`).then(r => { if (r.data) setProducts(Array.isArray(r.data) ? r.data : []); setLoading(false); });
  }, [data?.id]);

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft size={20} /></Button><h1 className="text-lg font-bold">Catégorie</h1></div>
      {loading ? <SkeletonCards /> : products.length === 0 ? <Empty icon={Package} label="Aucun produit dans cette catégorie" description="Essayez une autre catégorie ou revenez plus tard." /> : (
        <div className="grid grid-cols-2 gap-3">{products.map(p => (
          <Card key={p.id} className="overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('product-detail', { id: p.id })}>
            {p.image ? <img src={p.image} alt={p.name} className="h-28 w-full object-cover" /> : <div className="h-28 w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Package size={28} className="text-gray-300" /></div>}
            <CardContent className="p-3"><p className="font-medium text-sm line-clamp-1">{p.name}</p><p className="text-emerald-700 font-semibold text-sm mt-1">{formatPrice(p.price)}</p></CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

/* ── 4. Merchant Detail ────────────────────── */
function MerchantDetailView() {
  const { data, goBack, navigate } = useClientNav();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, getItemCount } = useCartStore();

  useEffect(() => {
    if (!data?.id) return;
    (async () => {
      const [mRes, pRes] = await Promise.all([apiFetch<Merchant>(`/api/merchants/${data.id}`), apiFetch<Product[]>(`/api/products?merchantId=${data.id}&isAvailable=true`)]);
      if (mRes.data) setMerchant(mRes.data);
      if (pRes.data) setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setLoading(false);
    })();
  }, [data?.id]);

  if (loading) return <SkeletonDetail />;
  if (!merchant) return <Empty icon={Store} label="Commerçant introuvable" />;

  return (
    <div className="space-y-4">
      <div className="bg-emerald-700 text-white px-4 pt-4 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4"><Button variant="ghost" size="icon" onClick={goBack} className="text-white hover:bg-white/20"><ChevronLeft size={20} /></Button></div>
        <div className="flex items-end gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">{merchant.businessName.charAt(0)}</div>
          <div className="flex-1 min-w-0"><h1 className="text-xl font-bold truncate">{merchant.businessName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-emerald-100">
              <Badge className="bg-white/20 text-white border-0 text-xs">{BUSINESS_TYPES[merchant.businessType] || merchant.businessType}</Badge>
              {merchant.rating > 0 && <Stars rating={merchant.rating} size={12} />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-emerald-100">
          <span className="flex items-center gap-1"><MapPin size={14} />{merchant.address}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{merchant.operatingHours}</span>
        </div>
      </div>
      <div className="px-4">
        <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Produits ({products.length})</h2>
        {products.length === 0 ? <Empty icon={Package} label="Aucun produit disponible" /> : (
          <div className="space-y-2">{products.map(p => (
            <Card key={p.id} className="shadow-sm overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                {p.image ? <img src={p.image} alt={p.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0 cursor-pointer" onClick={() => navigate('product-detail', { id: p.id })} /> : <div className="h-14 w-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => navigate('product-detail', { id: p.id })}><Package size={20} className="text-gray-300" /></div>}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('product-detail', { id: p.id })}>
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.shortDescription}</p>
                  <p className="text-emerald-700 font-semibold text-sm mt-1">{formatPrice(p.price)}</p>
                </div>
                <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex-shrink-0" onClick={e => { e.stopPropagation(); navigate('product-detail', { id: p.id }); }}><Plus size={16} /></Button>
              </CardContent>
            </Card>
          ))}</div>
        )}
      </div>
      {getItemCount() > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 mx-4 w-[calc(100%-2rem)] max-w-lg">
          <Button className="w-full bg-emerald-700 hover:bg-emerald-800 h-12 rounded-2xl shadow-lg" onClick={() => navigate('cart')}>
            <ShoppingBag size={18} className="mr-2" />Voir le panier ({getItemCount()}) — {formatPrice(useCartStore.getState().getTotal())}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── 5. Product Detail ─────────────────────── */
function ProductDetailView() {
  const { data, goBack } = useClientNav();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedSupps, setSelectedSupps] = useState<Supplement[]>([]);
  const { addItem, merchantId } = useCartStore();

  useEffect(() => {
    if (!data?.id) return;
    apiFetch<Product>(`/api/products/${data.id}`).then(r => { if (r.data) setProduct(r.data); setLoading(false); });
  }, [data?.id]);

  if (loading) return <SkeletonDetail />;
  if (!product) return <Empty icon={Package} label="Produit introuvable" />;

  const supps = parseSupplements(product.supplements);
  const suppTotal = selectedSupps.reduce((s, sp) => s + sp.price, 0);
  const totalPrice = (product.price + suppTotal) * qty;

  const handleAdd = () => {
    addItem({
      productId: product.id, merchantId: product.merchantId,
      merchantName: product.merchant?.businessName || '', name: product.name,
      price: product.price, quantity: qty, image: product.image || undefined,
      supplements: selectedSupps.length > 0 ? selectedSupps : undefined,
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  const toggleSupp = (s: Supplement) => {
    setSelectedSupps(prev => prev.find(x => x.name === s.name) ? prev.filter(x => x.name !== s.name) : [...prev, s]);
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="relative">
        {product.image ? <img src={product.image} alt={product.name} className="h-56 w-full object-cover" /> : <div className="h-56 w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Package size={48} className="text-gray-300" /></div>}
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 bg-white/90 rounded-full shadow" onClick={goBack}><ChevronLeft size={20} /></Button>
      </div>
      <div className="px-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{product.shortDescription}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-emerald-700">{formatPrice(totalPrice)}</span>
          {product.comparePrice && product.comparePrice > product.price && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>}
          {product.rating > 0 && <Stars rating={product.rating} />}
        </div>
        {product.longDescription && (
          <div><h3 className="text-sm font-semibold mb-1">Description</h3><p className="text-sm text-muted-foreground whitespace-pre-line">{product.longDescription}</p></div>
        )}
        {supps.length > 0 && (
          <div><h3 className="text-sm font-semibold mb-2">Suppléments</h3><div className="space-y-2">{supps.map(s => {
            const sel = selectedSupps.find(x => x.name === s.name);
            return <button key={s.name} onClick={() => toggleSupp(s)} className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${sel ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-sm font-medium">{s.name}</span><span className="text-sm font-semibold text-emerald-700">+{formatPrice(s.price)}</span>
            </button>;
          })}</div></div>
        )}
        <div><h3 className="text-sm font-semibold mb-2">Quantité</h3>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></Button>
            <span className="text-lg font-semibold w-8 text-center">{qty}</span>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setQty(qty + 1)}><Plus size={16} /></Button>
          </div>
        </div>
      </div>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 mx-4 w-[calc(100%-2rem)] max-w-lg">
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 h-12 rounded-2xl shadow-lg text-base font-semibold" onClick={handleAdd}>
          <ShoppingBag size={18} className="mr-2" />Ajouter au panier — {formatPrice(totalPrice)}
        </Button>
      </div>
    </div>
  );
}

/* ── 6. Cart ───────────────────────────────── */
function CartView() {
  const { goBack, navigate } = useClientNav();
  const { items, merchantName, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  if (items.length === 0) return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-8"><Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft size={20} /></Button><h1 className="text-lg font-bold">Panier</h1></div>
      <Empty icon={ShoppingBag} label="Votre panier est vide" />
    </div>
  );

  return (
    <div className="px-4 pt-4 space-y-4 pb-28">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft size={20} /></Button><h1 className="text-lg font-bold">Panier</h1></div>
      {merchantName && <p className="text-sm text-muted-foreground">Commande chez <span className="font-medium text-foreground">{merchantName}</span></p>}
      <div className="space-y-2">{items.map(item => (
        <Card key={item.productId} className="shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            {item.image ? <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" /> : <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"><Package size={18} className="text-gray-300" /></div>}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-emerald-700 font-semibold text-sm">{formatPrice(item.price * item.quantity + (item.supplements?.reduce((s, sp) => s + sp.price, 0) || 0) * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={12} /></Button>
              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus size={12} /></Button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.productId)}><Trash2 size={14} /></Button>
          </CardContent>
        </Card>
      ))}</div>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 mx-4 w-[calc(100%-2rem)] max-w-lg space-y-3">
        <Button variant="outline" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { clearCart(); toast.success('Panier vidé'); }}>Vider le panier</Button>
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 h-12 rounded-2xl shadow-lg text-base font-semibold" onClick={() => navigate('checkout')}>
          Passer la commande — {formatPrice(getTotal())}
        </Button>
      </div>
    </div>
  );
}

/* ── 7. Checkout ───────────────────────────── */
function CheckoutView() {
  const { goBack, navigate } = useClientNav();
  const { items, merchantId, merchantName, getTotal, clearCart, appliedCoupon, setAppliedCoupon } = useCartStore();
  const user = useAuthStore(s => s.user);
  const [address, setAddress] = useState('');
  const [quartier, setQuartier] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cities, setCities] = useState<{ name: string; quartiers: string[] }[]>([]);
  const [selectedCity, setSelectedCity] = useState('Bamako');

  const quartiers = useMemo(() => {
    const city = cities.find(c => c.name === selectedCity);
    return city?.quartiers || [];
  }, [selectedCity, cities]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setQuartier('');
  };

  useEffect(() => {
    apiFetch<{ cities: { name: string; quartiers: string[] }[] }>('/api/cities').then(r => {
      if (r.data?.cities) {
        setCities(r.data.cities);
        if (r.data.cities.length > 0) setSelectedCity(r.data.cities[0].name);
      }
    });
  }, []);

  useEffect(() => {
    if (items.length === 0) navigate('home');
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  const subtotal = getTotal();
  const couponDiscount = appliedCoupon?.discount || 0;
  const finalTotal = subtotal - couponDiscount;

  const handleSubmit = async () => {
    if (!address.trim()) { toast.error('Adresse de livraison requise'); return; }
    if (!selectedCity.trim()) { toast.error('Ville de livraison requise'); return; }
    if (!merchantId) return;
    setSubmitting(true);
    const res = await apiFetch<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        merchantId,
        items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, supplements: i.supplements })),
        deliveryAddress: address,
        deliveryCity: selectedCity,
        deliveryQuartier: quartier || undefined,
        paymentMethod: method,
        notes: notes || undefined,
        couponId: appliedCoupon?.couponId || undefined,
        couponDiscount: couponDiscount || undefined,
      }),
    });
    setSubmitting(false);
    if (res.error) { toast.error(res.error); return; }
    clearCart();
    toast.success('Commande passée avec succès !');
    navigate('orders');
  };

  return (
    <div className="px-4 pt-4 space-y-5 pb-28">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft size={20} /></Button><h1 className="text-lg font-bold">Confirmer la commande</h1></div>
      <div className="space-y-4">
        <div><Label className="text-sm font-medium">Adresse de livraison</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Quartier Badalabougou, près de la mosquée" className="mt-1.5" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-sm font-medium">Ville</Label><Select value={selectedCity} onValueChange={handleCityChange}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>
            {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent></Select></div>
          <div><Label className="text-sm font-medium">Quartier</Label>
            {quartiers.length > 0 ? (
              <Select value={quartier} onValueChange={setQuartier}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>
                {quartiers.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent></Select>
            ) : (
              <Input value={quartier} onChange={e => setQuartier(e.target.value)} placeholder="Ex: Badalabougou" className="mt-1.5" />
            )}
          </div>
        </div>
        <div><Label className="text-sm font-medium">Mode de paiement</Label><Select value={method} onValueChange={setMethod}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>
          {Object.entries(PAYMENT_METHODS).filter(([k]) => k !== 'WALLET').map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent></Select></div>
        <div><Label className="text-sm font-medium">Note pour le livreur</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions supplémentaires..." className="mt-1.5" rows={2} /></div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Résumé</h3>
        <p className="text-sm text-muted-foreground">{merchantName}</p>
        {items.map(i => (<div key={i.productId} className="flex justify-between text-sm"><span className="text-muted-foreground">{i.name} × {i.quantity}</span><span>{formatPrice(i.price * i.quantity)}</span></div>))}
        <Separator />
        {couponDiscount > 0 && <div className="flex items-center justify-between text-sm text-emerald-600"><span className="flex items-center gap-1"><Tag size={14} />Code promo ({appliedCoupon?.code})</span><span>-{formatPrice(couponDiscount)}</span></div>}
        <div className="flex justify-between font-semibold"><span>Total</span><span className="text-emerald-700">{formatPrice(finalTotal)}</span></div>
        {couponDiscount > 0 && <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => setAppliedCoupon(null)}>Retirer le code promo</button>}
      </div>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 mx-4 w-[calc(100%-2rem)] max-w-lg">
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 h-12 rounded-2xl shadow-lg text-base font-semibold" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}Confirmer la commande
        </Button>
      </div>
    </div>
  );
}

/* ── 8. Orders ─────────────────────────────── */
function OrdersView() {
  const { navigate } = useClientNav();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ orders: Order[] }>('/api/orders').then(r => { if (r.data) setOrders(r.data.orders); setLoading(false); });
  }, []);

  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Mes commandes</h1>
      {loading ? <SkeletonList /> : orders.length === 0 ? <Empty icon={ClipboardList} label="Aucune commande pour le moment" description="Vos commandes apparaîtront ici une fois passées." /> : (
        <div className="space-y-3">{orders.map(o => (
          <Card key={o.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('order-detail', { id: o.id })}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between"><div><p className="font-semibold text-sm">{o.orderNumber}</p><p className="text-xs text-muted-foreground mt-0.5">{o.merchant.businessName}</p></div><Badge className={`text-[10px] ${ORDER_STATUS_COLORS[o.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>{ORDER_STATUS_LABELS[o.status] || o.status}</Badge></div>
              <div className="flex items-center justify-between mt-3"><span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span><span className="font-semibold text-sm text-emerald-700">{formatPrice(o.total)}</span></div>
            </CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

/* ── 9. Order Detail ───────────────────────── */
function OrderDetailView() {
  const { data, goBack } = useClientNav();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFileUploading, setProofFileUploading] = useState(false);

  const fetchOrder = () => {
    if (!data?.id) return;
    apiFetch<Order>(`/api/orders/${data.id}`).then(r => {
      if (r.data) setOrder(r.data as Order);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOrder();
  }, [data?.id]);

  // Poll every 10 seconds
  useEffect(() => {
    if (!data?.id) return;
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [data?.id]);

  if (loading) return <SkeletonDetail />;
  if (!order) return <Empty icon={Package} label="Commande introuvable" />;

  const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
  const statusIdx = statuses.indexOf(order.status);
  const progress = order.status === 'CANCELLED' ? 0 : order.status === 'REFUNDED' ? 0 : Math.max(((statusIdx + 1) / statuses.length) * 100, 8);

  const submitRating = async () => {
    setRatingSubmitting(true);
    const res = await apiFetch(`/api/orders/${order.id}/rating`, { method: 'POST', body: JSON.stringify({ score, comment }) });
    setRatingSubmitting(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Merci pour votre évaluation !');
    setRatingOpen(false);
    fetchOrder();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Veuillez sélectionner une image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop volumineuse (max 5 Mo)'); return; }

    setProofFileUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const uploadRes = await apiFetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ imageData: base64, fileName: file.name }),
      });
      setProofFileUploading(false);
      if (uploadRes.error || !uploadRes.data) { toast.error(uploadRes.error || 'Erreur de téléchargement'); return; }
      setProofUrl(uploadRes.data.url);
      toast.success('Image téléchargée avec succès');
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const uploadProof = async () => {
    if (!proofUrl.trim()) { toast.error('Veuillez d\'abord sélectionner une image ou entrer une URL'); return; }
    setProofSubmitting(true);
    const res = await apiFetch(`/api/orders/${order.id}/payment-proof`, { method: 'POST', body: JSON.stringify({ imageUrl: proofUrl }) });
    setProofSubmitting(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Preuve de paiement envoyée');
    setProofUrl('');
    fetchOrder();
  };

  return (
    <div className="px-4 pt-4 space-y-5 pb-8">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={goBack}><ChevronLeft size={20} /></Button><div><h1 className="text-lg font-bold">{order.orderNumber}</h1><p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('fr-FR')}</p></div></div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Badge className={`${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 dark:bg-gray-800'}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</Badge><Badge variant="outline" className="text-xs">{PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}</Badge></div>
        {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2"><div className="bg-emerald-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        )}
      </div>
      <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Articles</CardTitle></CardHeader><CardContent className="space-y-2">
        {order.items.map(i => (<div key={i.id} className="flex justify-between text-sm"><span>{i.name} × {i.quantity}</span><span className="font-medium">{formatPrice(i.price * i.quantity)}</span></div>))}
        <Separator /><div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Livraison</span><span>{formatPrice(order.deliveryFee)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Remise</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between font-semibold text-base pt-1"><span>Total</span><span className="text-emerald-700">{formatPrice(order.total)}</span></div>
        </div>
      </CardContent></Card>
      <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Livraison</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        <p>{order.deliveryAddress}</p>
        <p className="text-muted-foreground">{order.deliveryCity}{order.deliveryQuartier ? ` — ${order.deliveryQuartier}` : ''}</p>
        {order.driver && <div className="flex items-center gap-2 mt-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{order.driver.user.firstName.charAt(0)}{order.driver.user.lastName.charAt(0)}</AvatarFallback></Avatar><div><p className="font-medium">{order.driver.user.firstName} {order.driver.user.lastName}</p><p className="text-xs text-muted-foreground">{order.driver.user.phone}</p></div></div>}
      </CardContent></Card>
      <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Paiement</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
        <div className="flex justify-between"><span className="text-muted-foreground">Méthode</span><span>{PAYMENT_METHODS[order.paymentMethod]}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge variant="outline" className="text-xs">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Badge></div>
        {order.paymentProof && <div><p className="text-muted-foreground text-xs mb-1">Preuve :</p><img src={order.paymentProof} alt="Preuve" className="max-h-48 w-full rounded-lg object-contain bg-gray-50 dark:bg-gray-800" /></div>}
        {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH' && (
          <div className="space-y-2 pt-2">
            <Label className="text-xs">Preuve de paiement</Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => fileInputRef.current?.click()} disabled={proofFileUploading}>
              {proofFileUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
              {proofFileUploading ? 'Téléchargement...' : 'Choisir une image'}
            </Button>
            {proofUrl && (
              <div className="flex items-center gap-2">
                <img src={proofUrl} alt="Aperçu" className="h-16 w-16 object-cover rounded-lg border" />
                <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> Image prête</span>
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
            </div>
            <Input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://..." className="text-sm" />
            <Button size="sm" className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={uploadProof} disabled={proofSubmitting || !proofUrl.trim()}>{proofSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send size={14} className="mr-1" />}Envoyer la preuve</Button>
          </div>
        )}
      </CardContent></Card>
      {order.status === 'DELIVERED' && (
        <div className="space-y-2">
          <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => setRatingOpen(true)}><Star size={16} className="mr-2" />Évaluer la commande</Button>
          <Button className="w-full" variant="outline" onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')}><FileText size={16} className="mr-2" />Télécharger la facture</Button>
        </div>
      )}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="max-h-[90dvh] flex flex-col"><DialogHeader><DialogTitle>Évaluer la commande</DialogTitle><DialogDescription>Notez votre expérience</DialogDescription></DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 space-y-4 py-2">
            <div className="flex items-center justify-center gap-1">{[1,2,3,4,5].map(i => (<button key={i} type="button" onClick={() => setScore(i)} className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform"><Star size={36} className={i <= score ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-300 dark:text-gray-600'} /></button>))}</div>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Votre commentaire (optionnel)" rows={3} />
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={submitRating} disabled={ratingSubmitting}>{ratingSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Envoyer l&apos;évaluation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── 10. Favorites ─────────────────────────── */
function FavoritesView() {
  const { navigate } = useClientNav();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const r = await apiFetch<Favorite[]>('/api/favorites'); if (r.data) setFavs(r.data); setLoading(false); })(); }, []);

  const toggleFav = async (productId: string) => {
    await apiFetch('/api/favorites', { method: 'DELETE', body: JSON.stringify({ productId }) });
    toast.success('Retiré des favoris');
    setFavs(prev => prev.filter(f => f.productId !== productId));
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Mes favoris</h1>
      {loading ? <SkeletonCards count={4} /> : favs.length === 0 ? <Empty icon={Heart} label="Aucun favori" description="Ajoutez des favoris en appuyant sur le cœur." /> : (
        <div className="space-y-2">{favs.map(f => (
          <Card key={f.id} className="shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              {f.product.image ? <img src={f.product.image} alt={f.product.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0 cursor-pointer" onClick={() => navigate('product-detail', { id: f.product.id })} /> : <div className="h-14 w-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => navigate('product-detail', { id: f.product.id })}><Package size={20} className="text-gray-300" /></div>}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('product-detail', { id: f.product.id })}>
                <p className="font-medium text-sm truncate">{f.product.name}</p>
                <p className="text-xs text-muted-foreground">{f.product.merchant?.businessName}</p>
                <p className="text-emerald-700 font-semibold text-sm mt-0.5">{formatPrice(f.product.price)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50" onClick={() => toggleFav(f.productId)}><Heart size={18} className="fill-current" /></Button>
            </CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

/* ── 11. Wallet ────────────────────────────── */
function WalletView() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch<WalletData>('/api/wallet').then(r => { if (r.data) setWallet(r.data); setLoading(false); }); }, []);

  return (
    <div className="px-4 pt-4 space-y-5">
      <h1 className="text-lg font-bold">Portefeuille</h1>
      {loading ? <SkeletonDetail /> : wallet ? (
        <>
          <Card className="bg-emerald-700 text-white shadow-lg"><CardContent className="p-6 text-center">
            <p className="text-sm text-emerald-100">Solde disponible</p>
            <p className="text-3xl font-bold mt-2">{formatPrice(wallet.balance)}</p>
          </CardContent></Card>
          <div><h3 className="text-sm font-semibold mb-3">Historique des transactions</h3>
            {wallet.transactions.length === 0 ? <Empty icon={Wallet} label="Aucune transaction" /> : (
              <div className="space-y-2">{wallet.transactions.map(t => (
                <Card key={t.id} className="shadow-sm"><CardContent className="p-3 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${t.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{t.type === 'CREDIT' ? <Check size={16} /> : <X size={16} />}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.description}</p><p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p></div>
                  <span className={`text-sm font-semibold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'CREDIT' ? '+' : '-'}{formatPrice(t.amount)}</span>
                </CardContent></Card>
              ))}</div>
            )}
          </div>
        </>
      ) : <Empty icon={Wallet} label="Portefeuille indisponible" />}
    </div>
  );
}

/* ── 12. Profile ───────────────────────────── */
function ProfileView() {
  const { user, logout, updateUser } = useAuthStore();
  const { setSpace } = useSpaceStore();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify({ firstName, lastName, phone }) });
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    updateUser({ firstName, lastName, phone });
    setEditing(false);
    toast.success('Profil mis à jour');
  };

  const handleLogout = () => {
    logout();
    setSpace('landing');
  };

  if (!user) return null;

  return (
    <div className="px-4 pt-4 space-y-5">
      <h1 className="text-lg font-bold">Mon profil</h1>
      <div className="flex flex-col items-center py-4">
        <Avatar className="h-20 w-20"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback></Avatar>
        {!editing && <h2 className="text-xl font-bold mt-3">{user.firstName} {user.lastName}</h2>}
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-sm text-muted-foreground">{user.phone}</p>
      </div>
      <Separator />
      {editing ? (
        <div className="space-y-3">
          <div><Label>Prénom</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1" /></div>
          <div><Label>Nom</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1" /></div>
          <div><Label>Téléphone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" /></div>
          <div className="flex gap-2"><Button className="flex-1 bg-emerald-700 hover:bg-emerald-800" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Enregistrer</Button><Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Annuler</Button></div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>Modifier le profil</Button>
      )}
      <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleLogout}>Déconnexion</Button>
    </div>
  );
}

/* ── 13. Notifications ─────────────────────── */
function NotificationsView() {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await apiFetch<{ notifications: AppNotification[] }>('/api/notifications'); if (r.data) setNotifs(r.data.notifications); setLoading(false); })(); }, []);

  const markRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await apiFetch('/api/notifications', { method: 'PUT' });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('Toutes les notifications marquées comme lues');
  };

  const typeIcon = (type: string) => {
    switch (type) { case 'ORDER': return <Package size={18} />; case 'PAYMENT': return <Wallet size={18} />; case 'PROMO': return <Tag size={18} />; default: return <Bell size={18} />; }
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-lg font-bold">Notifications</h1>
        {notifs.some(n => !n.isRead) && <Button variant="ghost" size="sm" className="text-emerald-700 text-xs" onClick={markAllRead}>Tout marquer comme lu</Button>}
      </div>
      {loading ? <SkeletonList count={3} /> : notifs.length === 0 ? <Empty icon={Bell} label="Aucune notification" description="Vous n'avez pas encore de notifications." /> : (
        <div className="space-y-2">{notifs.map(n => (
          <Card key={n.id} className={`shadow-sm cursor-pointer transition-colors ${!n.isRead ? 'bg-emerald-50/50 border-emerald-200' : ''}`} onClick={() => { if (!n.isRead) markRead(n.id); }}>
            <CardContent className="p-3 flex items-start gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>{typeIcon(n.type)}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p></div>
              {!n.isRead && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 flex-shrink-0 mt-1.5" />}
            </CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

/* ── 14. Support ───────────────────────────── */
function SupportView() {
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !desc.trim()) { toast.error('Veuillez remplir tous les champs'); return; }
    setSubmitting(true);
    const res = await apiFetch('/api/support', { method: 'POST', body: JSON.stringify({ subject, description: desc }) });
    setSubmitting(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Ticket envoyé avec succès');
    setSubject(''); setDesc('');
  };

  return (
    <div className="px-4 pt-4 space-y-6">
      <h1 className="text-lg font-bold">Support</h1>
      <SupportContact />
      <Separator />
      <div className="space-y-4">
        <h2 className="font-semibold text-sm">Créer un ticket</h2>
        <div><Label>Sujet</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet de votre demande" className="mt-1.5" /></div>
        <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Décrivez votre problème..." className="mt-1.5" rows={4} /></div>
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={handleSubmit} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send size={16} className="mr-2" />}Envoyer le ticket</Button>
      </div>
    </div>
  );
}

/* ── 15. Coupons ───────────────────────────── */
function CouponsView() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CouponValid | null>(null);
  const [checking, setChecking] = useState(false);
  const { setAppliedCoupon, appliedCoupon, items, merchantId } = useCartStore();

  const checkCode = async () => {
    if (!code.trim()) return;
    setChecking(true);
    const subtotal = useCartStore.getState().getTotal();
    const res = await apiFetch<CouponValid>('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, orderTotal: subtotal, merchantId: useCartStore.getState().merchantId || undefined }) });
    setChecking(false);
    if (res.data) {
      setResult(res.data);
      if (res.data.valid && res.data.couponId && res.data.discount) {
        setAppliedCoupon({ couponId: res.data.couponId, code: code.toUpperCase(), discount: res.data.discount, type: res.data.type || 'FIXED' });
        toast.success('Code promo appliqué !');
      }
    } else {
      setResult({ valid: false, error: res.error || 'Erreur' });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setResult(null);
    setCode('');
    toast.success('Code promo retiré');
  };

  return (
    <div className="px-4 pt-4 space-y-5">
      <h1 className="text-lg font-bold">Codes promo</h1>
      {appliedCoupon && (
        <Card className="shadow-sm border-emerald-300 bg-emerald-50"><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700"><Check size={18} /><div><p className="font-semibold text-sm">Code actif : {appliedCoupon.code}</p><p className="text-xs mt-0.5">Remise : {formatPrice(appliedCoupon.discount)}</p></div></div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={removeCoupon}><X size={16} /></Button>
          </div>
        </CardContent></Card>
      )}
      <Card className="shadow-sm border-dashed border-2 border-emerald-200 bg-emerald-50/50"><CardContent className="p-6 text-center">
        <Tag className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
        <p className="text-sm font-medium">Vous avez un code promo ?</p>
        <p className="text-xs text-muted-foreground mt-1">Entrez-le ci-dessous pour vérifier sa validité</p>
      </CardContent></Card>
      <div className="flex gap-2">
        <Input value={code} onChange={e => { setCode(e.target.value); setResult(null); }} placeholder="Ex: PROMO2025" className="uppercase" onKeyDown={e => e.key === 'Enter' && checkCode()} />
        <Button className="bg-emerald-700 hover:bg-emerald-800 flex-shrink-0" onClick={checkCode} disabled={checking}>{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}</Button>
      </div>
      {result && !result.valid && (
        <Card className={`shadow-sm border-red-300 bg-red-50`}><CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600"><X size={18} className="flex-shrink-0" /><p className="text-sm font-medium">{result.error || 'Code invalide'}</p></div>
        </CardContent></Card>
      )}
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">Ajoutez des articles au panier pour utiliser un code promo.</p>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────── */
export default function ClientApp() {
  const { view } = useClientNav();

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView />;
      case 'search': return <SearchView />;
      case 'category': return <CategoryView />;
      case 'merchant-detail': return <MerchantDetailView />;
      case 'product-detail': return <ProductDetailView />;
      case 'cart': return <CartView />;
      case 'checkout': return <CheckoutView />;
      case 'orders': return <OrdersView />;
      case 'order-detail': return <OrderDetailView />;
      case 'favorites': return <FavoritesView />;
      case 'wallet': return <WalletView />;
      case 'profile': return <ProfileView />;
      case 'notifications': return <NotificationsView />;
      case 'support': return <SupportView />;
      case 'coupons': return <CouponsView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="mx-auto max-w-lg pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={view} {...fade} transition={{ duration: 0.3, ease }}>
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}