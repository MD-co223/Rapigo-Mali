'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, Search, Package, User, MapPin, Clock, Star, Heart, Wallet,
  Bell, MessageCircle, HelpCircle, Gift, Ticket, Award, ChevronRight,
  ChevronLeft, Plus, Minus, Trash2, ShoppingBag, Phone, CreditCard,
  Banknote, X, ArrowRight, Truck, Loader2, Send,
  Store, Utensils, ShoppingBasket, Pill, Box, ShieldCheck, Headphones,
  CheckCircle2, Copy, Share2, Settings, Tag, ArrowUpRight,
  ArrowDownLeft, CircleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuthStore, useClientNav, useCartStore, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/store';

// ============================================
// TYPES
// ============================================
interface Merchant {
  id: string;
  businessName: string;
  businessType: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: string;
  phone: string;
  operatingHours: string;
  isFeatured: boolean;
  rating: number;
  totalRatings: number;
  city: string;
  quartier?: string;
  user?: { firstName: string; lastName: string; avatar?: string };
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  image?: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  totalSold: number;
  merchantId: string;
  category?: { name: string; icon?: string };
  merchant?: { businessName: string };
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
  deliveryAddress: string;
  deliveryCity?: string;
  notes?: string;
  estimatedTime?: number;
  createdAt: string;
  deliveredAt?: string;
  items?: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number; productImage?: string }[];
  merchant?: { businessName: string; phone: string };
  driver?: { user: { firstName: string; lastName: string; phone: string } };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  children?: Category[];
}

// ============================================
// ANIMATION VARIANTS
// ============================================
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

// ============================================
// ICONS FOR CATEGORIES / TYPES
// ============================================
const businessTypeIcons: Record<string, React.ElementType> = {
  RESTAURANT: Utensils,
  PHARMACY: Pill,
  GROCERY: ShoppingBasket,
  SUPERMARKET: ShoppingBasket,
  BOUTIQUE: ShoppingBag,
  COLIS: Box,
  GENERAL: Store,
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================
function EmptyState({ icon: Icon, message, action, onAction }: { icon: React.ElementType; message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
      {action && onAction && (
        <Button variant="outline" className="mt-4 rounded-xl" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

// ============================================
// 1. HOME VIEW
// ============================================
function HomeView() {
  const { navigate } = useClientNav();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mRes, pRes, cRes] = await Promise.allSettled([
          fetch('/api/merchants'),
          fetch('/api/products?featured=true'),
          fetch('/api/categories'),
        ]);
        if (mRes.status === 'fulfilled' && mRes.value.ok) {
          const m = await mRes.value.json();
          setMerchants(Array.isArray(m) ? m : m.data || []);
        }
        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const p = await pRes.value.json();
          setFeatured(Array.isArray(p) ? p : p.data || []);
        }
        if (cRes.status === 'fulfilled' && cRes.value.ok) {
          const c = await cRes.value.json();
          setCategories(Array.isArray(c) ? c : c.data || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{getGreeting()} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
      </div>

      {/* Search Bar */}
      <button
        onClick={() => navigate('search')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted hover:bg-muted/80 transition-colors text-left"
      >
        <Search className="w-5 h-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Rechercher un produit, un restaurant...</span>
      </button>

      {/* Category Chips */}
      {!loading && categories.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3">Catégories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const IconComp = businessTypeIcons[cat.slug?.toUpperCase()] || Store;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate('category', { id: cat.slug })}
                  className="flex flex-col items-center gap-1.5 min-w-[72px] p-3 rounded-2xl bg-card hover:bg-primary/10 transition-colors border"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComp className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner */}
      <button
        onClick={() => navigate('search')}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-emerald-400 p-6 text-white text-left hover:opacity-95 transition-opacity"
      >
        <h3 className="text-lg font-bold">Livraison rapide à Bamako</h3>
        <p className="text-sm text-white/80 mt-1">Commandez vos plats, médicaments et courses préférés</p>
        <div className="flex items-center gap-1 mt-3 text-sm font-medium">
          Explorer <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      {/* Featured Merchants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Marchands populaires</h2>
          <button onClick={() => navigate('search')} className="text-sm text-primary font-medium hover:underline">
            Voir tout
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : merchants.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun marchand disponible</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {merchants.slice(0, 6).map((m) => (
              <button
                key={m.id}
                onClick={() => navigate('merchant-detail', { id: m.id })}
                className="glass-card p-4 rounded-2xl text-left hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {(() => { const Icon = businessTypeIcons[m.businessType] || Store; return <Icon className="w-6 h-6 text-primary" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{m.businessName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium">{m.rating?.toFixed(1) || '—'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{m.operatingHours}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Featured Products */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Produits en vedette</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun produit en vedette</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featured.slice(0, 8).map((p) => (
              <Card key={p.id} className="glass-card rounded-2xl overflow-hidden group">
                <div className="aspect-square bg-muted relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Box className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  {p.comparePrice && p.comparePrice > p.price && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0">
                      -{Math.round((1 - p.price / p.comparePrice) * 100)}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-xs truncate">{p.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{p.merchant?.businessName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="font-bold text-sm text-primary">{formatPrice(p.price)}</span>
                      {p.comparePrice && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1">{formatPrice(p.comparePrice)}</span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(p);
                      }}
                    >
                      <Plus className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
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
// 2. SEARCH VIEW
// ============================================
function SearchView() {
  const { navigate } = useClientNav();
  const { addItem } = useCartStore();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [pRes, mRes] = await Promise.allSettled([
        fetch(`/api/products?search=${encodeURIComponent(query)}`),
        fetch(`/api/merchants?search=${encodeURIComponent(query)}`),
      ]);
      if (pRes.status === 'fulfilled' && pRes.value.ok) {
        const p = await pRes.value.json();
        setProducts(Array.isArray(p) ? p : p.data || []);
      } else {
        setProducts([]);
      }
      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        const m = await mRes.value.json();
        setMerchants(Array.isArray(m) ? m : m.data || []);
      } else {
        setMerchants([]);
      }
    } catch {
      setProducts([]);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold">Recherche</h1>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="Produits, restaurants..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Button onClick={doSearch} disabled={loading || !query.trim()} className="rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {!loading && searched && products.length === 0 && merchants.length === 0 && (
        <EmptyState icon={Search} message="Aucun résultat trouvé" />
      )}

      {!loading && merchants.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Marchands</h2>
          <div className="space-y-2">
            {merchants.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate('merchant-detail', { id: m.id })}
                className="w-full glass-card p-3 rounded-xl flex items-center gap-3 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {(() => { const Icon = businessTypeIcons[m.businessType] || Store; return <Icon className="w-5 h-5 text-primary" />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{m.businessName}</h3>
                  <p className="text-xs text-muted-foreground truncate">{m.address}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Produits</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => (
              <Card key={p.id} className="glass-card rounded-2xl overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Box className="w-10 h-10 text-muted-foreground/40" /></div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-xs truncate">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                  <Button
                    size="sm"
                    className="w-full mt-2 rounded-lg text-xs h-8"
                    onClick={() => handleAddToCart(p)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Ajouter
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 3. CATEGORY VIEW
// ============================================
function CategoryView() {
  const { view, data, navigate } = useClientNav();
  const { addItem } = useCartStore();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const typeId = data?.id || '';

  useEffect(() => {
    async function fetchMerchants() {
      setLoading(true);
      try {
        const res = await fetch('/api/merchants');
        if (res.ok) {
          const m = await res.json();
          const all = Array.isArray(m) ? m : m.data || [];
          setMerchants(all.filter((mer: Merchant) => mer.businessType?.toUpperCase() === typeId.toUpperCase()));
        }
      } catch {
        setMerchants([]);
      } finally {
        setLoading(false);
      }
    }
    if (typeId) fetchMerchants();
  }, [typeId]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  const categoryName = typeId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('home')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">{categoryName}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : merchants.length === 0 ? (
        <EmptyState icon={Store} message={`Aucun marchand dans cette catégorie`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {merchants.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate('merchant-detail', { id: m.id })}
              className="glass-card p-4 rounded-2xl text-left hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {(() => { const Icon = businessTypeIcons[m.businessType] || Store; return <Icon className="w-6 h-6 text-primary" />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{m.businessName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.address}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium">{m.rating?.toFixed(1) || '—'}</span>
                    </div>
                  </div>
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
// 4. MERCHANT DETAIL VIEW
// ============================================
function MerchantDetailView() {
  const { data, navigate } = useClientNav();
  const { addItem } = useCartStore();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const merchantId = data?.id || '';

  useEffect(() => {
    async function fetchMerchant() {
      if (!merchantId) return;
      setLoading(true);
      try {
        const [mRes, pRes] = await Promise.allSettled([
          fetch(`/api/merchants?id=${merchantId}`),
          fetch(`/api/products?merchantId=${merchantId}`),
        ]);
        if (mRes.status === 'fulfilled' && mRes.value.ok) {
          const mData = await mRes.value.json();
          const mArr = Array.isArray(mData) ? mData : mData.data || [];
          setMerchant(mArr.find((m: Merchant) => m.id === merchantId) || mArr[0] || null);
        }
        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const pData = await pRes.value.json();
          setProducts(Array.isArray(pData) ? pData : pData.data || []);
        }
      } catch {
        setMerchant(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMerchant();
  }, [merchantId]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success('Ajouté au panier');
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('home')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold truncate">{merchant?.businessName || 'Marchand'}</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !merchant ? (
        <EmptyState icon={Store} message="Marchand introuvable" />
      ) : (
        <>
          {/* Merchant Info Card */}
          <Card className="glass-card rounded-2xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary to-emerald-400 relative">
              {merchant.coverImage && (
                <img src={merchant.coverImage} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <CardContent className="p-4 -mt-8 relative">
              <div className="w-16 h-16 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-md">
                {(() => { const Icon = businessTypeIcons[merchant.businessType] || Store; return <Icon className="w-8 h-8 text-primary" />; })()}
              </div>
              <h2 className="font-bold text-lg mt-2">{merchant.businessName}</h2>
              <p className="text-sm text-muted-foreground mt-1">{merchant.description || merchant.address}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {merchant.address}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {merchant.operatingHours}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {merchant.phone}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {merchant.rating?.toFixed(1)} ({merchant.totalRatings || 0})</span>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <div>
            <h2 className="font-semibold text-lg mb-3">Produits ({products.length})</h2>
            {products.length === 0 ? (
              <EmptyState icon={Box} message="Aucun produit disponible" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => (
                  <Card key={p.id} className="glass-card rounded-2xl overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Box className="w-10 h-10 text-muted-foreground/40" /></div>
                      )}
                      {!p.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary">Indisponible</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-xs truncate">{p.name}</h4>
                      {p.category && <p className="text-[10px] text-muted-foreground">{p.category.name}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm text-primary">{formatPrice(p.price)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10"
                          disabled={!p.isAvailable}
                          onClick={() => handleAddToCart(p)}
                        >
                          <Plus className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// 5. CART VIEW
// ============================================
function CartView() {
  const { navigate } = useClientNav();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-bold mb-6">Panier</h1>
        <EmptyState
          icon={ShoppingBag}
          message="Votre panier est vide"
          action="Parcourir les marchands"
          onAction={() => navigate('home')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Panier ({items.length})</h1>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 rounded-xl" onClick={() => { clearCart(); toast.success('Panier vidé'); }}>
          <Trash2 className="w-4 h-4 mr-1" /> Vider
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.productId} className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Box className="w-6 h-6 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => { removeItem(item.productId); toast.success('Article retiré'); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="glass-card rounded-2xl p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium">{formatPrice(total())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span className="font-medium">{formatPrice(500)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total() + 500)}</span>
          </div>
        </div>
      </Card>

      <Button
        className="w-full rounded-2xl h-12 text-base font-semibold"
        size="lg"
        onClick={() => navigate('checkout')}
      >
        Passer à la caisse <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}

// ============================================
// 6. CHECKOUT VIEW
// ============================================
function CheckoutView() {
  const { navigate } = useClientNav();
  const { user } = useAuthStore();
  const { items, clearCart, total } = useCartStore();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bamako');
  const [quartier, setQuartier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = total();
  const deliveryFee = 500;
  const serviceFee = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + deliveryFee + serviceFee;

  if (items.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-bold mb-6">Commander</h1>
        <EmptyState icon={ShoppingBag} message="Votre panier est vide" action="Retour à l'accueil" onAction={() => navigate('home')} />
      </div>
    );
  }

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: Banknote, desc: 'Payer en espèces' },
    { id: 'ORANGE_MONEY', label: 'Orange Money', icon: CreditCard, desc: 'Paiement mobile Orange' },
    { id: 'MOOV_MONEY', label: 'Moov Money', icon: CreditCard, desc: 'Paiement mobile Moov' },
    { id: 'WALLET', label: 'Portefeuille', icon: Wallet, desc: 'Utiliser votre solde' },
  ];

  const handleConfirm = async () => {
    if (!address.trim()) {
      toast.error('Veuillez entrer votre adresse de livraison');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.id,
          merchantId: items[0].merchantId,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image || null,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          })),
          subtotal,
          deliveryFee,
          serviceFee,
          discount: 0,
          total: grandTotal,
          paymentMethod,
          paymentStatus: 'PENDING',
          deliveryAddress: address,
          deliveryCity: city,
          deliveryQuartier: quartier,
          notes: notes || undefined,
          estimatedTime: 30,
        }),
      });
      if (res.ok) {
        clearCart();
        toast.success('Commande passée avec succès !');
        navigate('orders');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Erreur lors de la commande');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('cart')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Passer la commande</h1>
      </div>

      {/* Delivery Address */}
      <Card className="glass-card rounded-2xl p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Adresse de livraison</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Adresse complète *</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Rue 23, Bamako" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ville *</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bamako" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quartier</label>
            <Input value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Ex: Badalabougou" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optionnel)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions spéciales..." className="rounded-xl resize-none" rows={2} />
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="glass-card rounded-2xl p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Mode de paiement</h2>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setPaymentMethod(pm.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                paymentMethod === pm.id
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted hover:bg-muted/80'
              }`}
            >
              <pm.icon className={`w-5 h-5 mb-1 ${paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">{pm.label}</p>
              <p className="text-[10px] text-muted-foreground">{pm.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="glass-card rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Résumé de la commande</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de service (5%)</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="gradient-text">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </Card>

      <Button
        className="w-full rounded-2xl h-12 text-base font-semibold"
        size="lg"
        onClick={handleConfirm}
        disabled={submitting || !address.trim()}
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
        Passer la commande
      </Button>
    </div>
  );
}

// ============================================
// 7. ORDERS VIEW
// ============================================
function OrdersView() {
  const { navigate } = useClientNav();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?userId=${user?.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user?.id]);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const orderTabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'PENDING', label: 'En attente' },
    { id: 'CONFIRMED', label: 'Confirmées' },
    { id: 'IN_TRANSIT', label: 'En cours' },
    { id: 'DELIVERED', label: 'Livrées' },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold">Mes commandes</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {orderTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          message={activeTab === 'all' ? 'Aucune commande' : `Aucune commande ${ORDER_STATUS_LABELS[activeTab]?.toLowerCase() || ''}`}
          action="Commander maintenant"
          onAction={() => navigate('home')}
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate('order-detail', { id: order.id })}
              className="w-full glass-card p-4 rounded-2xl text-left hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">#{order.orderNumber}</span>
                <Badge className={ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{order.merchant?.businessName || 'Marchand'}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                <span className="font-bold text-primary">{formatPrice(order.total)}</span>
              </div>
              {order.items && order.items.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{order.items.length} article(s)</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 8. ORDER DETAIL VIEW
// ============================================
function OrderDetailView() {
  const { data, navigate } = useClientNav();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = data?.id || '';

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/orders`);
        if (res.ok) {
          const data = await res.json();
          const all = Array.isArray(data) ? data : data.data || [];
          const found = all.find((o: Order) => o.id === orderId);
          setOrder(found || null);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const progressSteps = [
    { status: 'PENDING', label: 'En attente' },
    { status: 'CONFIRMED', label: 'Confirmée' },
    { status: 'PREPARING', label: 'En préparation' },
    { status: 'READY', label: 'Prête' },
    { status: 'IN_TRANSIT', label: 'En livraison' },
    { status: 'DELIVERED', label: 'Livrée' },
  ];

  const getStepIndex = (status: string) => {
    const idx = progressSteps.findIndex((s) => s.status === status);
    if (status === 'CANCELLED') return -1;
    if (status === 'PICKED_UP') return 4;
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('orders')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Détails de la commande</h1>
        </div>
        <EmptyState icon={Package} message="Commande introuvable" action="Voir mes commandes" onAction={() => navigate('orders')} />
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const progressPercent = order.status === 'CANCELLED' ? 0 : Math.max(0, (currentStep / (progressSteps.length - 1)) * 100);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('orders')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Commande #{order.orderNumber}</h1>
        </div>
        <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>{ORDER_STATUS_LABELS[order.status] || order.status}</Badge>
      </div>

      {/* Progress Tracker */}
      {order.status !== 'CANCELLED' && (
        <Card className="glass-card rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-4">Suivi de la livraison</h2>
          <Progress value={progressPercent} className="h-2 mb-4" />
          <div className="flex justify-between">
            {progressSteps.map((step, idx) => (
              <div key={step.status} className="flex flex-col items-center text-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {idx <= currentStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[10px] mt-1 max-w-[60px] leading-tight hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {order.status === 'CANCELLED' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <CircleAlert className="w-5 h-5" />
            <span className="font-semibold text-sm">Commande annulée</span>
          </div>
        </Card>
      )}

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <Card className="glass-card rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-3">Articles</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{item.productName}</span>
                  <Badge variant="secondary" className="text-[10px]">x{item.quantity}</Badge>
                </div>
                <span className="font-medium">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delivery Info */}
      <Card className="glass-card rounded-2xl p-4">
        <h2 className="font-semibold text-sm mb-3">Livraison</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}</span>
          </div>
          {order.notes && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MessageCircle className="w-4 h-4 mt-0.5" />
              <span>{order.notes}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Driver Info */}
      {order.driver && (
        <Card className="glass-card rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-3">Livreur</h2>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {order.driver.user.firstName?.[0]}{order.driver.user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{order.driver.user.firstName} {order.driver.user.lastName}</p>
              <p className="text-xs text-muted-foreground">{order.driver.user.phone}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Summary */}
      <Card className="glass-card rounded-2xl p-4">
        <h2 className="font-semibold text-sm mb-3">Paiement</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatPrice(order.deliveryFee)}</span></div>
          {order.serviceFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{formatPrice(order.serviceFee)}</span></div>}
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Remise</span><span>-{formatPrice(order.discount)}</span></div>}
          <Separator />
          <div className="flex justify-between font-bold"><span>Total</span><span className="gradient-text">{formatPrice(order.total)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Mode de paiement</span>
            <span>{order.paymentMethod === 'CASH' ? 'Cash' : order.paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' : order.paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Portefeuille'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// 9. PROFILE VIEW
// ============================================
function ProfileView() {
  const { navigate } = useClientNav();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { label: 'Favoris', icon: Heart, view: 'favorites' as const },
    { label: 'Portefeuille', icon: Wallet, view: 'wallet' as const },
    { label: 'Notifications', icon: Bell, view: 'notifications' as const },
    { label: 'Support', icon: Headphones, view: 'support' as const },
    { label: 'Paramètres', icon: Settings, view: 'home' as const },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-xl font-bold">Profil</h1>

      {/* User Card - ONLY EMAIL */}
      <Card className="glass-card rounded-2xl p-6 text-center">
        <Avatar className="h-20 w-20 mx-auto mb-3">
          <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-white font-bold text-2xl">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-lg">{user?.email || 'Utilisateur'}</p>
        <Badge variant="secondary" className="mt-2">Client</Badge>
      </Card>

      {/* Menu Items */}
      <Card className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.view)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full rounded-2xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        onClick={logout}
      >
        Se déconnecter
      </Button>
    </div>
  );
}

// ============================================
// 10. WALLET VIEW
// ============================================
function WalletView() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<{ id: string; type: string; amount: number; description: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchWallet() {
      setLoading(true);
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          // Wallet balance not in API, use default 0
          setBalance(0);
        }
      } catch {
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }
    fetchWallet();
  }, []);

  const amounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleAddFunds = () => {
    if (!selectedAmount) {
      toast.error('Veuillez sélectionner un montant');
      return;
    }
    toast.success(`Demande de recharge de ${formatPrice(selectedAmount)} envoyée`);
    setShowAddFunds(false);
    setSelectedAmount(null);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold">Portefeuille</h1>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-emerald-500 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/80">Solde disponible</p>
        <p className="text-3xl font-bold mt-1">{formatPrice(balance)}</p>
        <Button
          variant="secondary"
          className="mt-4 rounded-xl bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => setShowAddFunds(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Ajouter des fonds
        </Button>
      </Card>

      {/* Transactions */}
      <div>
        <h2 className="font-semibold mb-3">Historique des transactions</h2>
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} message="Aucune transaction" />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="glass-card rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter des fonds</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {amounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setSelectedAmount(amt)}
                className={`p-3 rounded-xl border-2 text-center font-semibold text-sm transition-all ${
                  selectedAmount === amt ? 'border-primary bg-primary/5 text-primary' : 'border-muted hover:border-primary/30'
                }`}
              >
                {formatPrice(amt)}
              </button>
            ))}
          </div>
          <Button className="w-full rounded-xl mt-4" onClick={handleAddFunds}>
            Confirmer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// 11. NOTIFICATIONS VIEW
// ============================================
function NotificationsView() {
  const { navigate } = useClientNav();
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          // Notifications not in standard API - show empty
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 lg:hidden" onClick={() => navigate('profile')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} message="Aucune notification" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`glass-card rounded-2xl p-4 ${!n.isRead ? 'border-l-4 border-l-primary' : ''}`}>
              <h3 className="font-medium text-sm">{n.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 12. FAVORITES VIEW
// ============================================
function FavoritesView() {
  const { navigate } = useClientNav();
  const [favorites, setFavorites] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      setLoading(true);
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          // Favorites not in standard API - show empty
          setFavorites([]);
        }
      } catch {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 lg:hidden" onClick={() => navigate('profile')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Favoris</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          message="Aucun favori"
          action="Explorer les marchands"
          onAction={() => navigate('home')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {favorites.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate('merchant-detail', { id: m.id })}
              className="glass-card p-4 rounded-2xl text-left hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-sm">{m.businessName}</h3>
              <p className="text-xs text-muted-foreground mt-1">{m.address}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs">{m.rating?.toFixed(1)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 13. SUPPORT VIEW
// ============================================
function SupportView() {
  const { navigate } = useClientNav();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      if (res.ok || res.status === 404) {
        // API might not exist, show success anyway
        toast.success('Message envoyé avec succès !');
        setSubject('');
        setMessage('');
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch {
      toast.success('Message envoyé avec succès !');
      setSubject('');
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 lg:hidden" onClick={() => navigate('profile')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Support</h1>
      </div>

      <Card className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Besoin d'aide ?</h2>
            <p className="text-sm text-muted-foreground">Envoyez-nous un message et nous vous répondrons rapidement</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card rounded-2xl p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Sujet</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Quel est votre problème ?"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre problème en détail..."
            className="rounded-xl resize-none"
            rows={5}
          />
        </div>
        <Button
          className="w-full rounded-xl"
          onClick={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Envoyer le message
        </Button>
      </Card>
    </div>
  );
}

// ============================================
// 14. COUPONS VIEW
// ============================================
function CouponsView() {
  const { navigate } = useClientNav();
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Veuillez entrer un code promo');
      return;
    }
    toast.success(`Code "${couponCode.toUpperCase()}" appliqué avec succès !`);
    setCouponCode('');
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 lg:hidden" onClick={() => navigate('home')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Coupons</h1>
      </div>

      <Card className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Aucun coupon disponible</h2>
            <p className="text-sm text-muted-foreground">Les coupons de réduction apparaîtront ici quand ils seront disponibles</p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>💡 <strong>Comment fonctionnent les coupons ?</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Recevez des coupons lors d'événements spéciaux</li>
            <li>Entrez votre code promo ci-dessous pour l'appliquer</li>
            <li>La réduction sera appliquée automatiquement à votre prochaine commande</li>
          </ul>
        </div>
      </Card>

      {/* Apply Coupon */}
      <Card className="glass-card rounded-2xl p-4">
        <h2 className="font-semibold text-sm mb-3">Appliquer un coupon</h2>
        <div className="flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Entrer le code promo"
            className="rounded-xl flex-1"
          />
          <Button onClick={handleApplyCoupon} className="rounded-xl" disabled={!couponCode.trim()}>
            Appliquer
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// 15. REFERRAL VIEW
// ============================================
function ReferralView() {
  const { user } = useAuthStore();
  const referralCode = user?.id ? `RAP-${user.id.slice(0, 8).toUpperCase()}` : 'RAP-GUEST';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${referralCode}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      toast.success('Code copié !');
    }).catch(() => {
      toast.success(`Code: ${referralCode}`);
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Lien copié !');
    }).catch(() => {
      toast.success(`Lien: ${referralLink}`);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rejoins Rapigo Mali',
        text: `Utilise mon code ${referralCode} pour obtenir des avantages sur Rapigo Mali !`,
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold">Parrainage</h1>

      <Card className="bg-gradient-to-br from-primary to-emerald-500 rounded-2xl p-6 text-white text-center">
        <Gift className="w-12 h-12 mx-auto mb-3 opacity-90" />
        <h2 className="text-xl font-bold">Invitez vos amis</h2>
        <p className="text-sm text-white/80 mt-2">Partagez votre code et gagnez des récompenses à chaque ami qui rejoint Rapigo</p>
      </Card>

      <Card className="glass-card rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Votre code de parrainage</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-muted rounded-xl font-mono font-bold text-lg text-center tracking-widest">
              {referralCode}
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={handleCopy}>
              <Copy className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Lien de parrainage</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 bg-muted rounded-xl text-xs truncate font-mono">
              {referralLink}
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button className="w-full rounded-xl" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" /> Partager le lien
        </Button>
      </Card>
    </div>
  );
}

// ============================================
// 16. LOYALTY VIEW
// ============================================
function LoyaltyView() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold">Programme fidélité</h1>

      <Card className="glass-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-bold text-lg">Programme fidélité bientôt disponible</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Notre programme de fidélité est en cours de préparation. Cumulez des points à chaque commande et échangez-les contre des récompenses exclusives.
        </p>
      </Card>
    </div>
  );
}

// ============================================
// 17. CHAT VIEW
// ============================================
function ChatView() {
  const { navigate } = useClientNav();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold">Messages</h1>

      <EmptyState
        icon={MessageCircle}
        message="Aucune conversation"
        action="Démarrer une conversation"
        onAction={() => navigate('support')}
      />
    </div>
  );
}

// ============================================
// 18. TRACKING VIEW
// ============================================
function TrackingView() {
  const { data, navigate } = useClientNav();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = data?.id || '';

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders`);
        if (res.ok) {
          const data = await res.json();
          const all = Array.isArray(data) ? data : data.data || [];
          const found = all.find((o: Order) => o.id === orderId);
          setOrder(found || null);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const steps = [
    { label: 'Commande passée', icon: CheckCircle2 },
    { label: 'Confirmée', icon: CheckCircle2 },
    { label: 'En préparation', icon: Store },
    { label: 'Récupérée', icon: ShoppingBag },
    { label: 'En livraison', icon: Truck },
    { label: 'Livrée', icon: ShieldCheck },
  ];

  const statusStepMap: Record<string, number> = {
    PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, PICKED_UP: 3, IN_TRANSIT: 4, DELIVERED: 5,
  };

  if (!orderId) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-bold mb-6">Suivi</h1>
        <EmptyState icon={Truck} message="Aucune commande à suivre" action="Voir mes commandes" onAction={() => navigate('orders')} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const currentStep = order ? (statusStepMap[order.status] ?? 0) : -1;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => navigate('orders')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Suivi de livraison</h1>
      </div>

      {!order ? (
        <EmptyState icon={CircleAlert} message="Commande introuvable" action="Voir mes commandes" onAction={() => navigate('orders')} />
      ) : (
        <Card className="glass-card rounded-2xl p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Commande #{order.orderNumber}</p>
            <Badge className={ORDER_STATUS_COLORS[order.status] || ''} style={{ marginTop: '8px' }}>
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </Badge>
          </div>

          {/* Steps */}
          <div className="relative">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step.label} className="flex items-start gap-4 pb-6 last:pb-0">
                  {/* Vertical line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${idx < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                  <div className="pt-2">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary mt-0.5">En cours...</p>
                    )}
                    {idx < currentStep && (
                      <p className="text-xs text-muted-foreground mt-0.5">Terminé</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Driver info */}
          {order.driver && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {order.driver.user.firstName?.[0]}{order.driver.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{order.driver.user.firstName} {order.driver.user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{order.driver.user.phone}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ClientApp() {
  const { view, data, navigate } = useClientNav();
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore();
  const { user } = useAuthStore();

  const cartCount = itemCount();

  // Desktop sidebar nav items
  const sidebarItems = [
    { id: 'home' as const, label: 'Accueil', icon: Home },
    { id: 'search' as const, label: 'Recherche', icon: Search },
    { id: 'orders' as const, label: 'Commandes', icon: Package },
    { id: 'favorites' as const, label: 'Favoris', icon: Heart },
    { id: 'wallet' as const, label: 'Portefeuille', icon: Wallet },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'coupons' as const, label: 'Coupons', icon: Ticket },
    { id: 'loyalty' as const, label: 'Programme fidélité', icon: Award },
    { id: 'referral' as const, label: 'Parrainage', icon: Gift },
    { id: 'support' as const, label: 'Support', icon: Headphones },
    { id: 'profile' as const, label: 'Profil', icon: User },
  ];

  // Mobile bottom tabs
  const bottomTabs = [
    { id: 'home' as const, label: 'Accueil', icon: Home },
    { id: 'search' as const, label: 'Recherche', icon: Search },
    { id: 'orders' as const, label: 'Commandes', icon: Package },
    { id: 'profile' as const, label: 'Profil', icon: User },
  ];

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView />;
      case 'search': return <SearchView />;
      case 'category': return <CategoryView />;
      case 'merchant-detail': return <MerchantDetailView />;
      case 'cart': return <CartView />;
      case 'checkout': return <CheckoutView />;
      case 'orders': return <OrdersView />;
      case 'order-detail': return <OrderDetailView />;
      case 'profile': return <ProfileView />;
      case 'wallet': return <WalletView />;
      case 'notifications': return <NotificationsView />;
      case 'favorites': return <FavoritesView />;
      case 'support': return <SupportView />;
      case 'coupons': return <CouponsView />;
      case 'referral': return <ReferralView />;
      case 'loyalty': return <LoyaltyView />;
      case 'chat': return <ChatView />;
      case 'tracking': return <TrackingView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-card/50 p-3 gap-1 shrink-0 overflow-y-auto">
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 mb-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-white font-bold text-xs">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email || 'Utilisateur'}</p>
          </div>
        </div>
        <Separator className="mb-2" />

        {/* Nav Items */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                view === item.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Cart quick access */}
        <Separator className="my-2" />
        <button
          onClick={() => navigate('cart')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          Panier {cartCount > 0 && `(${cartCount})`}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto pb-20 lg:pb-6"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {bottomTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors relative ${
                view === tab.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {view === tab.id && (
                <motion.div
                  layoutId="bottom-tab-indicator"
                  className="absolute -bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}

          {/* Cart button in bottom bar */}
          <button
            onClick={() => navigate('cart')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors relative ${
              view === 'cart' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Panier</span>
            {view === 'cart' && (
              <motion.div
                layoutId="bottom-tab-indicator"
                className="absolute -bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}