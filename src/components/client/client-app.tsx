'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Search, ClipboardList, Heart, User, MapPin, Clock, Star,
  Bell, Plus, Minus, Trash2, ShoppingBag, Phone, X, ArrowRight,
  Truck, Loader2, ChevronLeft, Store, Send, Copy,
  ArrowUpRight, ArrowDownLeft, CircleAlert,
  Wallet, HelpCircle, Package, ChevronDown, Upload, Gift, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useAuthStore, useClientNav, useCartStore, apiFetch,
  formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  BUSINESS_TYPES, PAYMENT_METHODS, PAYMENT_STATUS_LABELS,
} from '@/lib/store';
import { toast } from 'sonner';
import { SupportContactCard } from '@/components/support-contact';

// ============================================
// TYPES
// ============================================
interface Merchant {
  id: string;
  businessName: string;
  businessType: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  coverImage?: string;
  address: string;
  phone: string;
  operatingHours: string;
  isFeatured: boolean;
  isApproved: boolean;
  rating: number;
  totalRatings: number;
  city: string;
  quartier?: string;
  paymentConfigs?: MerchantPaymentConfig[];
  deliveryZones?: DeliveryZone[];
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  comparePrice?: number;
  image?: string;
  images?: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  totalSold: number;
  merchantId: string;
  preparationTime?: number;
  variants?: string;
  options?: string;
  supplements?: string;
  category?: { name: string; icon?: string; id: string };
  merchant?: { businessName: string; id: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentProof?: string;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryQuartier?: string;
  notes?: string;
  estimatedTime?: number;
  createdAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  items?: OrderItem[];
  merchant?: { businessName: string; phone: string; businessType: string };
  driver?: { user: { firstName: string; lastName: string; phone: string; avatar?: string }; vehicleType?: string; vehiclePlate?: string; vehicleColor?: string };
  rating?: { score: number; comment?: string };
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
  variants?: string;
  supplements?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface FavoriteProduct {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface MerchantPaymentConfig {
  id: string;
  method: string;
  isEnabled: boolean;
  phoneNumber?: string;
  accountName?: string;
  accountNumber?: string;
  qrCode?: string;
  instructions?: string;
}

interface DeliveryZone {
  id: string;
  city: string;
  quartier?: string;
  fee: number;
}

// ============================================
// CONSTANTS
// ============================================
const BAMAKO_QUARTIERS = [
  'Badalabougou', 'Baco Djicoroni', 'Banconi', 'Boulkassoumbougou',
  'Daoudabougou', 'Djicoroni Para', 'Faladiè', 'Hamdallaye',
  'Kalaban-Coura', 'Korofina', 'Lafiabougou', 'Magnambougou',
  'Missabougou', 'Niamakoro', 'Quinzambougou', 'Sabalibougou',
  'Sébenikoro', 'Sotuba', 'Torokorobougou', 'Yirimadio',
];

const SEGOU_QUARTIERS = [
  'Ségou-Koura', 'Ségou-Ville', 'Sokolo', 'Markala',
  'Dioro', 'Tominian', 'San',
];

const AVAILABLE_PAYMENT_METHODS = [
  'CASH', 'ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'QR_CODE', 'WALLET',
];

// ============================================
// HELPERS
// ============================================
function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-5 h-5 animate-spin text-primary ${className}`} />;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
  onAction,
}: {
  icon: React.ElementType;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
      {action && onAction && (
        <Button variant="outline" className="mt-4" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <CircleAlert className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-muted-foreground text-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

function parseJsonSafe<T>(str: string | undefined | null): T | null {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

// ============================================
// MERCHANT CARD (reusable)
// ============================================
function MerchantCard({ merchant, onClick }: { merchant: Merchant; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-28 bg-muted">
        {merchant.coverImage ? (
          <img src={merchant.coverImage} alt={merchant.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10">
            <Store className="w-10 h-10 text-emerald-500" />
          </div>
        )}
        {merchant.logo && (
          <div className="absolute bottom-0 left-3 translate-y-1/2 w-12 h-12 rounded-xl border-2 border-background bg-background overflow-hidden shadow-sm">
            <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="p-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{merchant.businessName}</h3>
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {BUSINESS_TYPES[merchant.businessType] || merchant.businessType}
            </Badge>
          </div>
          {merchant.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium">{merchant.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {merchant.operatingHours}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{merchant.address}</p>
      </div>
    </button>
  );
}

// ============================================
// PRODUCT CARD (reusable)
// ============================================
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <Card className="overflow-hidden rounded-xl">
      <button className="w-full text-left" onClick={onClick}>
        <div className="aspect-square bg-muted relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
          {product.comparePrice && product.comparePrice > product.price && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0">
              -{Math.round((1 - product.price / product.comparePrice) * 100)}%
            </Badge>
          )}
        </div>
      </button>
      <CardContent className="p-3">
        <h4 className="font-medium text-xs truncate">{product.name}</h4>
        <p className="text-[10px] text-muted-foreground truncate">{product.merchant?.businessName}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[10px] text-muted-foreground line-through ml-1">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 1. HOME VIEW
// ============================================
function HomeView() {
  const { navigate } = useClientNav();
  const { user } = useAuthStore();
  const { items } = useCartStore();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [mRes, cRes] = await Promise.all([
        apiFetch<Merchant[]>('/api/merchants?approved=true'),
        apiFetch<Category[]>('/api/categories'),
      ]);
      if (cancelled) return;
      if (mRes.error && !mRes.data) setError(mRes.error);
      const allMerchants = mRes.data ? (Array.isArray(mRes.data) ? mRes.data : []) : [];
      // Featured first, then all others
      const featured = allMerchants.filter((m) => m.isFeatured);
      const others = allMerchants.filter((m) => !m.isFeatured);
      setMerchants([...featured, ...others]);
      if (cRes.data) setCategories(Array.isArray(cRes.data) ? cRes.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [retryCount]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {user?.firstName || ''} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Que souhaitez-vous commander aujourd&apos;hui ?
        </p>
      </div>

      <button
        onClick={() => navigate('search')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
      >
        <Search className="w-5 h-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Rechercher un produit, un marchand...</span>
      </button>

      {!loading && categories.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Catégories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate('category', { id: cat.id })}
                className="flex flex-col items-center gap-1.5 min-w-[72px] p-3 rounded-xl bg-card hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border shrink-0"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('search')}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-400 p-5 text-white text-left hover:opacity-95 transition-opacity"
      >
        <h3 className="text-lg font-bold">Livraison rapide à Bamako</h3>
        <p className="text-sm text-white/80 mt-1">Commandez vos plats, médicaments et courses préférés</p>
        <div className="flex items-center gap-1 mt-3 text-sm font-medium">
          Explorer <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Marchands populaires</h2>
          <button
            onClick={() => navigate('search')}
            className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            Voir tout
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
        ) : merchants.length === 0 ? (
          <EmptyState icon={Store} message="Aucun marchand disponible pour le moment" action="Réessayer" onAction={() => setRetryCount((c) => c + 1)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {merchants.slice(0, 6).map((m) => (
              <MerchantCard
                key={m.id}
                merchant={m}
                onClick={() => navigate('merchant-detail', { id: m.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 2. SEARCH VIEW
// ============================================
function SearchView() {
  const { navigate } = useClientNav();
  const { addItem, merchantId: cartMerchantId, clearCart } = useCartStore();

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activeTab, setActiveTab] = useState('produits');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    const [pRes, mRes] = await Promise.all([
      apiFetch<Product[]>(`/api/products?search=${encodeURIComponent(searchQuery)}`),
      apiFetch<Merchant[]>(`/api/merchants?search=${encodeURIComponent(searchQuery)}`),
    ]);
    setProducts(pRes.data ? (Array.isArray(pRes.data) ? pRes.data : []) : []);
    setMerchants(mRes.data ? (Array.isArray(mRes.data) ? mRes.data : []) : []);
    setLoading(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearched(false);
      setProducts([]);
      setMerchants([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 400);
  };

  const handleAddToCart = (product: Product) => {
    if (cartMerchantId && cartMerchantId !== product.merchantId) {
      clearCart();
    }
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      merchantName: product.merchant?.businessName || '',
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 pr-10"
          />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingState />}

      {!loading && searched && products.length === 0 && merchants.length === 0 && (
        <EmptyState icon={Search} message="Aucun résultat trouvé pour votre recherche" />
      )}

      {!loading && searched && (products.length > 0 || merchants.length > 0) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="produits" className="flex-1 text-xs">
              Produits {products.length > 0 ? `(${products.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="commercants" className="flex-1 text-xs">
              Commerçants {merchants.length > 0 ? `(${merchants.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produits" className="mt-4">
            {products.length === 0 ? (
              <EmptyState icon={Package} message="Aucun produit trouvé" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((p) => (
                  <Card key={p.id} className="overflow-hidden rounded-xl">
                    <button
                      className="w-full text-left"
                      onClick={() => navigate('product-detail', { id: p.id })}
                    >
                      <div className="aspect-square bg-muted relative">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </button>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-xs truncate">{p.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{p.merchant?.businessName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatPrice(p.price)}
                          </span>
                          {p.comparePrice && p.comparePrice > p.price && (
                            <span className="text-[10px] text-muted-foreground line-through ml-1">
                              {formatPrice(p.comparePrice)}
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                        >
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="commercants" className="mt-4">
            {merchants.length === 0 ? (
              <EmptyState icon={Store} message="Aucun commerçant trouvé" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {merchants.map((m) => (
                  <MerchantCard
                    key={m.id}
                    merchant={m}
                    onClick={() => navigate('merchant-detail', { id: m.id })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!searched && !loading && (
        <EmptyState
          icon={Search}
          message="Tapez pour rechercher des produits et des commerçants"
        />
      )}
    </div>
  );
}

// ============================================
// 3. CATEGORY VIEW
// ============================================
function CategoryView() {
  const { data, navigate, goBack } = useClientNav();
  const categoryId = data?.id || '';

  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [cRes, pRes] = await Promise.all([
        apiFetch<Category>(`/api/categories/${categoryId}`),
        apiFetch<Product[]>(`/api/products?categoryId=${categoryId}`),
      ]);
      if (cancelled) return;
      if (cRes.data) {
        const cat = cRes.data as Category;
        setCategoryName(cat.name);
      }
      if (pRes.error && !pRes.data) setError(pRes.error);
      if (pRes.data) setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [categoryId, retryCount]);

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg truncate">{categoryName || 'Catégorie'}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          message={`Aucun produit dans cette catégorie`}
          action="Retour à l'accueil"
          onAction={() => navigate('home')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => navigate('product-detail', { id: p.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 4. MERCHANT DETAIL VIEW
// ============================================
function MerchantDetailView() {
  const { data, navigate, goBack } = useClientNav();
  const merchantId = data?.id || '';

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!merchantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [mRes, pRes] = await Promise.all([
        apiFetch<Merchant>(`/api/merchants/${merchantId}`),
        apiFetch<Product[]>(`/api/products?merchantId=${merchantId}`),
      ]);
      if (cancelled) return;
      if (mRes.error && !mRes.data) setError(mRes.error);
      if (mRes.data) setMerchant(mRes.data as Merchant);
      if (pRes.data) setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [merchantId, retryCount]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />;
  if (!merchant) return <EmptyState icon={Store} message="Marchand introuvable" />;

  return (
    <div className="pb-24">
      <div className="relative h-48 sm:h-56 bg-muted">
        {merchant.coverImage ? (
          <img src={merchant.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-200 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/20" />
        )}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="icon" className="rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-background border-2 border-background shadow overflow-hidden shrink-0">
                {merchant.logo ? (
                  <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                    <Store className="w-8 h-8 text-emerald-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg truncate">{merchant.businessName}</h1>
                <Badge variant="secondary" className="mt-1">
                  {BUSINESS_TYPES[merchant.businessType] || merchant.businessType}
                </Badge>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                  {merchant.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      {merchant.rating.toFixed(1)} ({merchant.totalRatings})
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {merchant.operatingHours}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{merchant.address}</span>
                </p>
              </div>
            </div>
            {merchant.shortDescription && (
              <p className="text-sm text-muted-foreground mt-3">{merchant.shortDescription}</p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <h2 className="font-semibold text-lg mb-3">Menu ({products.length} produits)</h2>
          {products.length === 0 ? (
            <EmptyState icon={Package} message="Aucun produit disponible" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={() => navigate('product-detail', { id: p.id, merchantId: p.merchantId })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 5. PRODUCT DETAIL VIEW
// ============================================
function ProductDetailView() {
  const { data, navigate, goBack } = useClientNav();
  const { addItem, merchantId: cartMerchantId, clearCart } = useCartStore();
  const productId = data?.id || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [showCartWarning, setShowCartWarning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const parsedOptions = parseJsonSafe<{ name: string; values: string[]; required?: boolean }[]>(product?.options);
  const parsedSupplements = parseJsonSafe<{ name: string; price: number }[]>(product?.supplements);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Product>(`/api/products/${productId}`);
      if (cancelled) return;
      if (res.error && !res.data) { setError(res.error); setLoading(false); return; }
      if (res.data) {
        const p = res.data as Product;
        setProduct(p);
        if (p.merchantId) {
          const mRes = await apiFetch<Merchant>(`/api/merchants/${p.merchantId}`);
          if (cancelled) return;
          if (mRes.data) setMerchant(mRes.data as Merchant);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [productId, retryCount]);

  const doAdd = () => {
    if (!product || !merchant) return;
    const supps = selectedSupplements.map((name) => {
      const s = parsedSupplements?.find((ps) => ps.name === name);
      return { name, price: s?.price || 0 };
    }).filter(Boolean);

    addItem({
      productId: product.id,
      merchantId: merchant.id,
      merchantName: merchant.businessName,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      supplements: supps.length > 0 ? supps as { name: string; price: number }[] : undefined,
      variants: Object.keys(selectedVariants).length > 0 ? JSON.stringify(selectedVariants) : undefined,
    });
    toast.success(`${product.name} ajouté au panier`);
    navigate('cart');
  };

  const handleAddToCart = () => {
    if (!product || !merchant) return;
    if (cartMerchantId && cartMerchantId !== product.merchantId) {
      setShowCartWarning(true);
      return;
    }
    doAdd();
  };

  const supplementTotal = selectedSupplements.reduce((sum, name) => {
    const s = parsedSupplements?.find((ps) => ps.name === name);
    return sum + (s?.price || 0);
  }, 0);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />;
  if (!product) return <EmptyState icon={Package} message="Produit introuvable" />;

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-semibold truncate">Détails du produit</span>
      </div>

      <div className="px-4">
        <div className="aspect-square rounded-xl bg-muted overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-bold text-xl">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-sm text-muted-foreground mt-1">{product.shortDescription}</p>
              )}
            </div>
            {merchant && (
              <Badge variant="secondary" className="shrink-0">{merchant.businessName}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>
          {product.totalSold > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{product.totalSold} vendus</p>
          )}
        </div>

        <Separator />

        {product.longDescription && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{product.longDescription}</p>
          </div>
        )}

        {parsedOptions && parsedOptions.length > 0 && (
          <div className="space-y-3">
            {parsedOptions.map((opt) => (
              <div key={opt.name}>
                <Label className="text-sm font-medium mb-2 block">
                  {opt.name} {opt.required && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((val) => (
                    <button
                      key={val}
                      onClick={() => setSelectedVariants((prev) => ({ ...prev, [opt.name]: val }))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        selectedVariants[opt.name] === val
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-card text-foreground border-border hover:border-emerald-600'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {parsedSupplements && parsedSupplements.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Suppléments</Label>
            <div className="space-y-2">
              {parsedSupplements.map((sup) => {
                const isSelected = selectedSupplements.includes(sup.name);
                return (
                  <button
                    key={sup.name}
                    onClick={() =>
                      setSelectedSupplements((prev) =>
                        isSelected ? prev.filter((n) => n !== sup.name) : [...prev, sup.name]
                      )
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600'
                        : 'bg-card border-border hover:border-emerald-600'
                    }`}
                  >
                    <span className="text-sm">{sup.name}</span>
                    <span className="text-sm font-medium">
                      {sup.price > 0 ? `+${formatPrice(sup.price)}` : 'Gratuit'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-2 block">Quantité</Label>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => setQuantity((q) => q + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice((product.price + supplementTotal) * quantity)}
            </p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 max-w-xs"
            size="lg"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Ajouter au panier
          </Button>
        </div>
      </div>

      <Dialog open={showCartWarning} onOpenChange={setShowCartWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Panier d&apos;un autre marchand</DialogTitle>
            <DialogDescription>
              Votre panier contient des articles d&apos;un autre marchand. Voulez-vous vider le panier et ajouter cet article ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCartWarning(false)}>Annuler</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => { clearCart(); setShowCartWarning(false); doAdd(); }}
            >
              Vider et ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// 6. CART VIEW
// ============================================
function CartView() {
  const { navigate, goBack } = useClientNav();
  const { items, merchantName, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();

  const subtotal = getTotal();
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Mon panier</h1>
        </div>
        <EmptyState
          icon={ShoppingBag}
          message="Votre panier est vide"
          action="Explorer les marchands"
          onAction={() => navigate('home')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 pb-52 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Mon panier</h1>
        </div>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={clearCart}>
          <Trash2 className="w-4 h-4 mr-1" />
          Vider
        </Button>
      </div>

      {merchantName && (
        <p className="text-sm text-muted-foreground">
          Commande chez <span className="font-medium text-foreground">{merchantName}</span>
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const suppTotal = item.supplements?.reduce((s, sup) => s + sup.price, 0) || 0;
          return (
            <Card key={item.productId} className="rounded-xl">
              <CardContent className="p-3 flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {item.supplements && item.supplements.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      +{item.supplements.map((s) => s.name).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatPrice((item.price + suppTotal) * item.quantity)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t p-4">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          size="lg"
          onClick={() => navigate('checkout')}
        >
          Passer la commande — {formatPrice(total)}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 7. CHECKOUT VIEW
// ============================================
function CheckoutView() {
  const { navigate, goBack } = useClientNav();
  const { items, merchantId, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bamako');
  const [quartier, setQuartier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = getTotal();
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const currentQuartiers = city === 'Ségou' ? SEGOU_QUARTIERS : BAMAKO_QUARTIERS;

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setQuartier('');
  };

  const handleSubmit = async () => {
    if (!address.trim()) { toast.error('Veuillez entrer votre adresse de livraison'); return; }
    if (items.length === 0) { toast.error('Votre panier est vide'); return; }

    setSubmitting(true);
    try {
      const res = await apiFetch<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          merchantId,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: (item.price + (item.supplements?.reduce((s, sup) => s + sup.price, 0) || 0)) * item.quantity,
            productImage: item.image,
            variants: item.variants,
            supplements: item.supplements ? JSON.stringify(item.supplements) : undefined,
          })),
          deliveryAddress: address,
          deliveryCity: city,
          deliveryQuartier: quartier || undefined,
          paymentMethod,
          notes: notes || undefined,
          subtotal,
          deliveryFee,
          total,
        }),
      });

      if (res.error) { toast.error(res.error); setSubmitting(false); return; }

      const order = res.data as Order;
      clearCart();
      toast.success('Commande passée avec succès !');

      if (paymentMethod !== 'CASH') {
        navigate('tracking', { id: order.id });
      } else {
        navigate('orders');
      }
    } catch {
      toast.error('Erreur lors de la commande');
    }
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="p-4 pb-24">
        <EmptyState icon={ShoppingBag} message="Votre panier est vide" action="Retour" onAction={() => navigate('home')} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-32 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Passer la commande</h1>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Adresse de livraison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="checkout-address">Adresse</Label>
            <Input
              id="checkout-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rue 123, près de la mosquée"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="checkout-city">Ville</Label>
              <Select value={city} onValueChange={handleCityChange}>
                <SelectTrigger id="checkout-city">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bamako">Bamako</SelectItem>
                  <SelectItem value="Ségou">Ségou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="checkout-quartier">Quartier</Label>
              <Select value={quartier} onValueChange={setQuartier}>
                <SelectTrigger id="checkout-quartier">
                  <SelectValue placeholder="Quartier" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuartiers.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mode de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            {AVAILABLE_PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === method
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-border hover:border-emerald-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  paymentMethod === method ? 'border-emerald-600' : 'border-muted-foreground'
                }`}>
                  {paymentMethod === method && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  )}
                </div>
                <span className="text-sm font-medium">
                  {PAYMENT_METHODS[method] || method}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes pour la commande</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions spéciales, allergies..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium mb-1">Résumé de la commande</p>
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate mr-2">
                {item.name} x{item.quantity}
              </span>
              <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total ({items.length} articles)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Paiement : {PAYMENT_METHODS[paymentMethod] || paymentMethod}
          </p>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t p-4">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
          Confirmer la commande — {formatPrice(total)}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 8. ORDERS VIEW
// ============================================
function OrdersView() {
  const { navigate } = useClientNav();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Order[]>('/api/orders');
      if (cancelled) return;
      if (res.error && !res.data) setError(res.error);
      if (res.data) setOrders(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [retryCount]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status);
    if (activeTab === 'completed') return o.status === 'DELIVERED';
    if (activeTab === 'cancelled') return o.status === 'CANCELLED' || o.status === 'REFUNDED';
    return true;
  });

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="font-semibold text-lg">Mes commandes</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">Toutes</TabsTrigger>
          <TabsTrigger value="active" className="flex-1 text-xs">En cours</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 text-xs">Terminées</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 text-xs">Annulées</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          message={activeTab === 'all' ? 'Aucune commande pour le moment' : 'Aucune commande dans cette catégorie'}
          action="Commander"
          onAction={() => navigate('home')}
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="rounded-xl cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('order-detail', { id: order.id })}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.merchant?.businessName}</p>
                  </div>
                  <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 9. ORDER DETAIL VIEW
// ============================================
function OrderDetailView() {
  const { data, navigate, goBack } = useClientNav();
  const orderId = data?.id || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Order>(`/api/orders/${orderId}`);
      if (cancelled) return;
      if (res.error && !res.data) setError(res.error);
      if (res.data) setOrder(res.data as Order);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId, retryCount]);

  const handleSubmitRating = async () => {
    if (ratingScore === 0) { toast.error('Veuillez sélectionner une note'); return; }
    setSubmittingRating(true);
    const res = await apiFetch(`/api/orders/${orderId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ score: ratingScore, comment: ratingComment || undefined }),
    });
    if (res.error) toast.error(res.error);
    else { toast.success('Merci pour votre avis !'); setRetryCount((c) => c + 1); }
    setSubmittingRating(false);
  };

  const handleUploadProof = async () => {
    if (!proofFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', proofFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) { toast.error('Erreur de téléchargement'); setUploading(false); return; }
      const proofRes = await apiFetch(`/api/orders/${orderId}/payment-proof`, {
        method: 'POST',
        body: JSON.stringify({ proofUrl: uploadData.url }),
      });
      if (proofRes.error) toast.error(proofRes.error);
      else { toast.success('Preuve envoyée !'); setRetryCount((c) => c + 1); setShowUploadDialog(false); }
    } catch { toast.error('Erreur'); }
    setUploading(false);
  };

  const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
  const currentIndex = order ? ORDER_STEPS.indexOf(order.status) : -1;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />;
  if (!order) return <EmptyState icon={Package} message="Commande introuvable" />;

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">Commande #{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Badge className={ORDER_STATUS_COLORS[order.status] || 'text-sm px-3 py-1'}>
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </Badge>
            {order.estimatedTime && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" /> ~{order.estimatedTime} min
              </span>
            )}
          </div>

          {currentIndex >= 0 && (
            <div className="space-y-2">
              <Progress value={((currentIndex + 1) / ORDER_STEPS.length) * 100} className="h-2" />
              <div className="flex justify-between">
                {ORDER_STEPS.map((step, i) => (
                  <div
                    key={step}
                    className={`text-[9px] text-center flex-1 ${
                      i <= currentIndex ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[step]?.replace('ée', '').replace('é', '') || step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Méthode</span>
            <span>{PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Statut</span>
            <Badge variant="secondary">{PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}</Badge>
          </div>
          {order.status === 'PAYMENT_PENDING' && (
            <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Envoyer la preuve de paiement
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Articles ({order.items?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                {item.productImage ? (
                  <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
              </div>
              <span className="text-sm font-medium">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Remise</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Livraison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{order.deliveryAddress}</p>
          {order.deliveryQuartier && (
            <p className="text-sm text-muted-foreground">{order.deliveryQuartier}, {order.deliveryCity}</p>
          )}
          {order.notes && (
            <p className="text-sm text-muted-foreground italic">&quot;{order.notes}&quot;</p>
          )}
          {order.driver && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm font-medium">Livreur assigné</p>
              <div className="flex items-center gap-3 mt-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-sm">
                    {order.driver.user.firstName[0]}{order.driver.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {order.driver.user.firstName} {order.driver.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.driver.vehicleType} {order.driver.vehiclePlate ? `• ${order.driver.vehicleColor || ''} ${order.driver.vehiclePlate}` : ''}
                  </p>
                </div>
                <Button size="icon" variant="outline" className="h-9 w-9" asChild>
                  <a href={`tel:${order.driver.user.phone}`}>
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </a>
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate('tracking', { id: order.id })}
              >
                <Truck className="w-4 h-4 mr-2" />
                Suivre la livraison
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {order.status === 'DELIVERED' && !order.rating && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Évaluer cette commande</CardTitle>
            <CardDescription>Comment était votre expérience ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRatingScore(star)}>
                  <Star className={`w-8 h-8 transition-colors ${
                    star <= ratingScore ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
                  }`} />
                </button>
              ))}
            </div>
            <Textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Laissez un commentaire (optionnel)"
              rows={2}
            />
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmitRating}
              disabled={submittingRating || ratingScore === 0}
            >
              {submittingRating ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Envoyer l&apos;avis
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === 'DELIVERED' && order.rating && (
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-1">Votre avis</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-4 h-4 ${star <= order.rating!.score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            {order.rating.comment && (
              <p className="text-sm text-muted-foreground mt-1">{order.rating.comment}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preuve de paiement</DialogTitle>
            <DialogDescription>Téléchargez la capture d&apos;écran de votre paiement.</DialogDescription>
          </DialogHeader>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) setProofFile(e.target.files[0]); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 hover:border-emerald-600 transition-colors"
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{proofFile ? proofFile.name : 'Choisir une image'}</span>
          </button>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUploadProof}
              disabled={!proofFile || uploading}
            >
              {uploading ? <Spinner className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// 10. FAVORITES VIEW
// ============================================
function FavoritesView() {
  const { navigate } = useClientNav();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<FavoriteProduct[]>('/api/favorites');
      if (cancelled) return;
      if (res.error && !res.data) setError(res.error);
      if (res.data) setFavorites(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [retryCount]);

  const handleRemove = async (productId: string, favoriteId: string) => {
    const res = await apiFetch(`/api/favorites/${favoriteId}`, {
      method: 'DELETE',
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success('Retiré des favoris');
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    }
  };

  if (loading) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <h1 className="font-semibold text-lg">Mes favoris</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <h1 className="font-semibold text-lg">Mes favoris</h1>
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="font-semibold text-lg">Mes favoris</h1>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          message="Aucun favori pour le moment. Ajoutez des produits en les aimant !"
          action="Explorer"
          onAction={() => navigate('home')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {favorites.map((fav) => (
            <Card key={fav.id} className="overflow-hidden rounded-xl">
              <button className="w-full text-left" onClick={() => navigate('product-detail', { id: fav.productId })}>
                <div className="aspect-square bg-muted relative">
                  {fav.product?.image ? (
                    <img src={fav.product.image} alt={fav.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(fav.productId, fav.id); }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </button>
                </div>
              </button>
              <CardContent className="p-3">
                <h4 className="font-medium text-xs truncate">{fav.product?.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{fav.product?.merchant?.businessName}</p>
                {fav.product && (
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1">{formatPrice(fav.product.price)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 11. WALLET VIEW
// ============================================
function WalletView() {
  const { goBack } = useClientNav();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [wRes, tRes] = await Promise.all([
        apiFetch<WalletData>('/api/wallet'),
        apiFetch<Transaction[]>('/api/wallet/transactions'),
      ]);
      if (cancelled) return;
      if (wRes.error && !wRes.data) setError(wRes.error);
      if (wRes.data) setWallet(wRes.data as WalletData);
      if (tRes.data) setTransactions(Array.isArray(tRes.data) ? tRes.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [retryCount]);

  if (loading) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Mon portefeuille</h1>
        </div>
        <Skeleton className="h-36 rounded-xl" />
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Mon portefeuille</h1>
        </div>
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Mon portefeuille</h1>
      </div>

      <Card className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-0">
        <CardContent className="p-6">
          <p className="text-sm text-white/80">Solde disponible</p>
          <p className="text-3xl font-bold mt-1">
            {wallet ? formatPrice(wallet.balance) : '0 FCFA'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12"
          onClick={() => toast.info('Le dépôt nécessite une intégration bancaire. Fonctionnalité bientôt disponible.')}
        >
          <ArrowDownLeft className="w-4 h-4 mr-2" />
          Déposer
        </Button>
        <Button
          variant="outline"
          className="rounded-xl h-12"
          onClick={() => toast.info('Le retrait nécessite une intégration bancaire. Fonctionnalité bientôt disponible.')}
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Retirer
        </Button>
      </div>

      <div>
        <h2 className="font-semibold text-sm mb-3">Historique des transactions</h2>
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} message="Aucune transaction" />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.map((tx) => (
              <Card key={tx.id} className="rounded-xl">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'CREDIT' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {tx.type === 'CREDIT'
                      ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                      : <ArrowUpRight className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`font-semibold text-sm shrink-0 ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 12. PROFILE VIEW
// ============================================
function ProfileView() {
  const { user, logout, updateUser } = useAuthStore();
  const { navigate } = useClientNav();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const editInitialized = useRef(false);

  const displayFirstName = user?.firstName || '';
  const displayLastName = user?.lastName || '';
  const displayPhone = user?.phone || '';
  const displayAddress = (user as unknown as { address?: string })?.address || '';

  const startEditing = () => {
    if (!editInitialized.current) {
      setFirstName(displayFirstName);
      setLastName(displayLastName);
      setPhone(displayPhone);
      setAddress(displayAddress);
      editInitialized.current = true;
    }
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName, phone, address }),
    });
    if (res.error) { toast.error(res.error); }
    else {
      updateUser({ firstName, lastName, phone });
      toast.success('Profil mis à jour');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
  };

  const menuItems = [
    { icon: ClipboardList, label: 'Mes commandes', view: 'orders' as const },
    { icon: Heart, label: 'Mes favoris', view: 'favorites' as const },
    { icon: Wallet, label: 'Mon portefeuille', view: 'wallet' as const },
    { icon: Gift, label: 'Parrainage', view: 'referral' as const },
    { icon: HelpCircle, label: 'Support', view: 'support' as const },
  ];

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="font-semibold text-lg">Mon profil</h1>

      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xl">
                {(user?.firstName?.[0] || '')}{(user?.lastName?.[0] || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{displayFirstName} {displayLastName}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <p className="text-sm text-muted-foreground">{displayPhone}</p>
            </div>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="profileFirstName">Prénom</Label>
                  <Input id="profileFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="profileLastName">Nom</Label>
                  <Input id="profileLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="profilePhone">Téléphone</Label>
                <Input id="profilePhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="profileAddress">Adresse</Label>
                <Input id="profileAddress" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Votre adresse" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Annuler</Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Spinner className="w-4 h-4 mr-2" /> : null}
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full mt-4" onClick={startEditing}>
              Modifier le profil
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-0">
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
            </button>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={handleLogout}
      >
        Se déconnecter
      </Button>
    </div>
  );
}

// ============================================
// 13. NOTIFICATIONS VIEW
// ============================================
function NotificationsView() {
  const { goBack } = useClientNav();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<AppNotification[]>('/api/notifications');
      if (cancelled) return;
      if (res.error && !res.data) setError(res.error);
      if (res.data) setNotifications(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [retryCount]);

  const handleMarkRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif?.isRead) return;
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await apiFetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('Toutes les notifications marquées comme lues');
    setMarkingAll(false);
  };

  if (loading) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">Notifications</h1>
          </div>
        </div>
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Notifications</h1>
        </div>
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 text-xs"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? <Spinner className="w-3 h-3 mr-1" /> : null}
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} message="Aucune notification" />
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                notif.isRead
                  ? 'bg-card border-border'
                  : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  notif.isRead ? 'bg-transparent' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm ${notif.isRead ? 'font-medium' : 'font-semibold'}`}>{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 14. SUPPORT VIEW
// ============================================
function SupportView() {
  const { goBack } = useClientNav();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<SupportTicket[]>('/api/support');
      if (cancelled) return;
      if (res.error && !res.data) setError(res.error);
      if (res.data) setTickets(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [retryCount]);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setSubmitting(true);
    const res = await apiFetch('/api/support', {
      method: 'POST',
      body: JSON.stringify({ subject, description }),
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success('Ticket créé avec succès');
      setSubject('');
      setDescription('');
      setShowForm(false);
      setRetryCount((c) => c + 1);
    }
    setSubmitting(false);
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  const statusLabels: Record<string, string> = {
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé',
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Support</h1>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Fermer' : 'Nouveau ticket'}
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label htmlFor="ticketSubject">Sujet</Label>
              <Input id="ticketSubject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Résumez votre problème" />
            </div>
            <div>
              <Label htmlFor="ticketDesc">Description</Label>
              <Textarea id="ticketDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre problème en détail..." rows={4} />
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Spinner className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Envoyer le ticket
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      ) : tickets.length === 0 ? (
        <EmptyState icon={HelpCircle} message="Aucun ticket de support. Créez-en un si vous avez besoin d'aide." />
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{ticket.subject}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge className={statusColors[ticket.status] || ''}>
                    {statusLabels[ticket.status] || ticket.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Informations de support */}
      <div className="mt-6 bg-muted/50 rounded-xl p-4">
        <SupportContactCard />
      </div>
    </div>
  );
}

// ============================================
// 15. REFERRAL VIEW
// ============================================
function ReferralView() {
  const { goBack } = useClientNav();
  const { user } = useAuthStore();
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ referralCode: string }>('/api/auth/me').then((res) => {
      if (res.data) setReferralCode((res.data as { referralCode: string }).referralCode || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      toast.success('Code copié dans le presse-papier !');
    }).catch(() => {
      toast.error('Impossible de copier le code');
    });
  };

  const handleShare = () => {
    if (!referralCode) return;
    if (navigator.share) {
      navigator.share({
        title: 'Rejoignez Rapigo Mali',
        text: `Utilisez mon code de parrainage ${referralCode} pour obtenir des avantages sur Rapigo Mali !`,
        url: typeof window !== 'undefined' ? window.location.origin : '',
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Parrainage</h1>
      </div>

      <Card className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-0">
        <CardContent className="p-6 text-center">
          <Gift className="w-12 h-12 mx-auto mb-3 text-white/90" />
          <h2 className="text-xl font-bold">Parrainez vos amis</h2>
          <p className="text-sm text-white/80 mt-2">
            Partagez votre code et gagnez des récompenses à chaque ami qui rejoint Rapigo
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Votre code de parrainage</p>
          {loading ? (
            <Skeleton className="h-12 rounded-lg" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {referralCode || `${(user?.firstName || 'U').toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={handleCopy}
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12"
        onClick={handleShare}
      >
        <Send className="w-4 h-4 mr-2" />
        Partager le code
      </Button>

      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Comment ça marche ?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-600">
                1
              </div>
              <p className="text-sm text-muted-foreground">
                Partagez votre code de parrainage avec vos amis et famille
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-600">
                2
              </div>
              <p className="text-sm text-muted-foreground">
                Votre ami s&apos;inscrit sur Rapigo en utilisant votre code
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-600">
                3
              </div>
              <p className="text-sm text-muted-foreground">
                Vous recevez tous les deux une récompense sur votre portefeuille
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// 16. TRACKING VIEW
// ============================================
function TrackingView() {
  const { data, goBack } = useClientNav();
  const orderId = data?.id || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Order>(`/api/orders/${orderId}`);
      if (cancelled) return;
      if (res.error && !res.data) setError(res.error);
      if (res.data) setOrder(res.data as Order);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId, retryCount]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />;
  if (!order) return <EmptyState icon={Truck} message="Commande introuvable" />;

  const TRACKING_STEPS = [
    { status: 'CONFIRMED', label: 'Commande confirmée' },
    { status: 'PREPARING', label: 'En préparation' },
    { status: 'READY', label: 'Prête' },
    { status: 'ASSIGNED', label: 'Livreur assigné' },
    { status: 'PICKED_UP', label: 'Commande récupérée' },
    { status: 'IN_TRANSIT', label: 'En livraison' },
    { status: 'DELIVERED', label: 'Livrée' },
  ];

  const allSteps = [{ status: 'PENDING', label: 'Commande passée' }, ...TRACKING_STEPS];
  const currentStepIndex = allSteps.findIndex((s) => s.status === order.status);

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">Suivi de livraison</h1>
          <p className="text-xs text-muted-foreground">Commande #{order.orderNumber}</p>
        </div>
      </div>

      <div className="rounded-xl bg-muted h-48 flex items-center justify-center border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/10" />
        <div className="relative text-center">
          <Truck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Suivi en temps réel</p>
          <p className="text-xs text-muted-foreground mt-1">
            {order.status === 'DELIVERED'
              ? 'Commande livrée'
              : order.driver
                ? 'Votre livreur est en route'
                : 'En attente d\'un livreur'}
          </p>
        </div>
        {order.status === 'IN_TRANSIT' && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              En mouvement
            </div>
          </div>
        )}
      </div>

      {order.driver && (
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Votre livreur</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                  {order.driver.user.firstName[0]}{order.driver.user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{order.driver.user.firstName} {order.driver.user.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {order.driver.vehicleType} {order.driver.vehicleColor || ''} {order.driver.vehiclePlate || ''}
                </p>
              </div>
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-full" asChild>
                <a href={`tel:${order.driver.user.phone}`}>
                  <Phone className="w-4 h-4 text-emerald-600" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Statut de la commande</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {allSteps.map((step, index) => {
              const isCompleted = currentStepIndex >= 0 && index <= currentStepIndex;
              const isCurrent = step.status === order.status;
              return (
                <div key={step.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-muted-foreground/30'
                      } ${isCurrent ? 'ring-4 ring-emerald-600/20' : ''}`}
                    />
                    {index < allSteps.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-[2rem] ${
                        index < currentStepIndex ? 'bg-emerald-600' : 'bg-border'
                      }`} />
                    )}
                  </div>
                  <div className={index === allSteps.length - 1 ? '' : 'pb-6'}>
                    <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <Badge className={`mt-1 text-[10px] ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                        En cours
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MAIN CLIENT APP
// ============================================
export default function ClientApp() {
  const { view, navigate } = useClientNav();
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiFetch<AppNotification[]>('/api/notifications?unread=true').then((res) => {
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        setUnreadCount(list.length);
      }
    });
  }, [view]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const navItems = [
    { view: 'home' as const, label: 'Accueil', icon: Home },
    { view: 'search' as const, label: 'Recherche', icon: Search },
    { view: 'orders' as const, label: 'Commandes', icon: ClipboardList },
    { view: 'favorites' as const, label: 'Favoris', icon: Heart },
    { view: 'profile' as const, label: 'Profil', icon: User },
  ];

  const isHome = view === 'home';

  const viewTitles: Record<string, string> = {
    search: 'Recherche',
    cart: 'Mon panier',
    checkout: 'Passer la commande',
    orders: 'Mes commandes',
    'order-detail': 'Détails de la commande',
    favorites: 'Mes favoris',
    wallet: 'Mon portefeuille',
    profile: 'Mon profil',
    notifications: 'Notifications',
    support: 'Support',
    referral: 'Parrainage',
    tracking: 'Suivi de livraison',
  };

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
      case 'notifications': return <NotificationsView />;
      case 'profile': return <ProfileView />;
      case 'support': return <SupportView />;
      case 'referral': return <ReferralView />;
      case 'tracking': return <TrackingView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
        {isHome ? (
          <>
            <button onClick={() => navigate('home')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-lg text-emerald-600">Rapigo</span>
            </button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => navigate('notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => navigate('cart')}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 -ml-1"
                onClick={() => useClientNav.getState().goBack()}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-semibold truncate">{viewTitles[view] || ''}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => navigate('notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px] ${
                  isActive ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}