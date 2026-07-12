'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, Search, Package, User, MapPin, Clock, Star, Heart, Wallet,
  Bell, MessageCircle, HelpCircle, Gift, Ticket, Award, ChevronRight,
  ChevronLeft, Plus, Minus, Trash2, ShoppingBag, Phone, Mail,
  CreditCard, Banknote, X, ArrowRight, Truck, Loader2, Send,
  Store, Utensils, ShoppingBasket, Pill, Box, MinusCircle, PlusCircle,
  ChevronDown, ChevronUp, Copy, Share2, ShieldCheck, Headphones,
  CircleDot, CheckCircle2, Clock4, Eye, LogOut, Settings,
  MapPinned, CreditCardIcon, Sparkles, Tag, ArrowUpRight,
  CircleCheckBig, ArrowDownLeft, AlertCircle, CircleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
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
  businesses?: { name: string }[];
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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
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
// MAIN COMPONENT
// ============================================
export default function ClientApp() {
  const { view, data, navigate } = useClientNav();
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore();
  const { user } = useAuthStore();
  const [showCart, setShowCart] = useState(false);

  const cartCount = itemCount();

  // Navigation tabs
  const tabs = [
    { id: 'home' as const, label: 'Accueil', icon: Home },
    { id: 'search' as const, label: 'Recherche', icon: Search },
    { id: 'orders' as const, label: 'Commandes', icon: Package },
    { id: 'profile' as const, label: 'Profil', icon: User },
  ];

  const handleTabClick = (tabId: 'home' | 'search' | 'orders' | 'profile') => {
    navigate(tabId);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 p-4 gap-2 sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="flex items-center gap-3 p-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-white font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.phone}</p>
          </div>
        </div>
        <Separator className="mb-2" />
        <nav className="flex flex-col gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                view === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          ))}
        </nav>
        <Separator className="my-2" />
        <div className="space-y-1">
          <button
            onClick={() => navigate('favorites')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
          >
            <Heart className="w-4.5 h-4.5" /> Favoris
          </button>
          <button
            onClick={() => navigate('wallet')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
          >
            <Wallet className="w-4.5 h-4.5" /> Portefeuille
          </button>
          <button
            onClick={() => navigate('notifications')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
          >
            <Bell className="w-4.5 h-4.5" /> Notifications
          </button>
          <button
            onClick={() => navigate('support')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
          >
            <Headphones className="w-4.5 h-4.5" /> Support
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (data?.id || '')}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full"
          >
            <ScrollArea className="h-[calc(100vh-3.5rem-5rem)] lg:h-[calc(100vh-3.5rem)]">
              <div className="p-4 md:p-6 max-w-6xl mx-auto">
                {view === 'home' && <HomeView navigate={navigate} />}
                {view === 'search' && <SearchView navigate={navigate} />}
                {view === 'category' && <CategoryView navigate={navigate} categoryId={data?.id} />}
                {view === 'merchant-detail' && <MerchantDetailView navigate={navigate} merchantId={data?.id} />}
                {view === 'cart' && <CartView navigate={navigate} />}
                {view === 'checkout' && <CheckoutView navigate={navigate} />}
                {view === 'orders' && <OrdersView navigate={navigate} />}
                {view === 'order-detail' && <OrderDetailView navigate={navigate} orderId={data?.id} />}
                {view === 'profile' && <ProfileView navigate={navigate} />}
                {view === 'wallet' && <WalletView navigate={navigate} />}
                {view === 'notifications' && <NotificationsView navigate={navigate} />}
                {view === 'favorites' && <FavoritesView navigate={navigate} />}
                {view === 'support' && <SupportView />}
                {view === 'referral' && <PlaceholderView title="Parrainage" description="Invitez vos amis et gagnez des récompenses !" icon={Gift} />}
                {view === 'coupons' && <PlaceholderView title="Coupons" description="Gérez vos codes promo et réductions" icon={Ticket} />}
                {view === 'loyalty' && <PlaceholderView title="Programme fidélité" description="Gagnez des points à chaque commande" icon={Award} />}
                {view === 'chat' && <PlaceholderView title="Messages" description="Discutez avec vos commerçants et livreurs" icon={MessageCircle} />}
                {view === 'tracking' && <TrackingView navigate={navigate} orderId={data?.id} />}
              </div>
            </ScrollArea>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Cart FAB */}
      {cartCount > 0 && !['cart', 'checkout'].includes(view) && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-20 right-4 z-40 lg:bottom-6"
        >
          <Button
            onClick={() => navigate('cart')}
            size="lg"
            className="rounded-2xl shadow-xl shadow-primary/30 h-14 px-5 gap-3"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-bold">{formatPrice(total())}</span>
            <Badge className="bg-white text-primary font-bold h-6 min-w-6 px-1.5">{cartCount}</Badge>
          </Button>
        </motion.div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = view === tab.id || (tab.id === 'home' && ['home', 'category', 'merchant-detail'].includes(view));
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all relative ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomTab"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {tab.id === 'profile' && (
                  <Avatar className="h-5 w-5 -mt-0.5">
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary p-0">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ============================================
// HOME VIEW
// ============================================
function HomeView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [merchantsRes, productsRes, categoriesRes] = await Promise.all([
          fetch('/api/merchants'),
          fetch('/api/products?featured=true'),
          fetch('/api/categories'),
        ]);
        const [merchantsData, productsData, categoriesData] = await Promise.all([
          merchantsRes.json(),
          productsRes.json(),
          categoriesRes.json(),
        ]);
        if (Array.isArray(merchantsData)) setMerchants(merchantsData);
        if (Array.isArray(productsData)) setProducts(productsData);
        if (Array.isArray(categoriesData)) setCategories(categoriesData);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryChips = [
    { name: 'Restaurants', icon: Utensils, color: 'from-orange-500 to-red-500', type: 'RESTAURANT' },
    { name: 'Supermarchés', icon: ShoppingBasket, color: 'from-green-500 to-emerald-600', type: 'SUPERMARKET' },
    { name: 'Pharmacies', icon: Pill, color: 'from-cyan-500 to-blue-500', type: 'PHARMACY' },
    { name: 'Boutiques', icon: ShoppingBag, color: 'from-pink-500 to-rose-500', type: 'BOUTIQUE' },
    { name: 'Colis', icon: Box, color: 'from-amber-500 to-yellow-500', type: 'COLIS' },
  ];

  const banners = [
    { title: '-30% sur votre première commande', subtitle: 'Utilisez le code BIENVENUE', gradient: 'from-primary via-emerald-500 to-teal-500' },
    { title: 'Livraison gratuite ce weekend', subtitle: 'Sur toutes les commandes +5 000 FCFA', gradient: 'from-gold via-amber-500 to-orange-500' },
    { title: 'Parrainez & gagnez', subtitle: '1 500 FCFA par ami invité', gradient: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <h1 className="text-2xl md:text-3xl font-bold">
          Bonjour, <span className="gradient-text">{useAuthStore.getState().user?.firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Bamako, Mali
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.05 }}>
        <div
          onClick={() => navigate('search')}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/80 border border-border/50 cursor-pointer hover:bg-muted transition-colors"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Rechercher un produit, un restaurant...</span>
        </div>
      </motion.div>

      {/* Category Chips */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {categoryChips.map((cat) => (
            <button
              key={cat.type}
              onClick={() => navigate('category', { id: cat.type })}
              className="flex flex-col items-center gap-2 min-w-[72px] group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <cat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Promotional Banners */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-bold mb-3">Bannières promotionnelles</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
          {banners.map((banner, i) => (
            <div
              key={i}
              className={`min-w-[300px] md:min-w-[380px] h-36 md:h-40 rounded-2xl bg-gradient-to-br ${banner.gradient} p-5 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-bold leading-tight">{banner.title}</h3>
                <p className="text-sm opacity-90 mt-1">{banner.subtitle}</p>
              </div>
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  En savoir plus <ArrowRight className="w-3 h-3 ml-1" />
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Popular Merchants */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Populaires près de chez vous</h2>
          <button onClick={() => navigate('search')} className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {merchants.slice(0, 8).map((merchant, i) => (
              <motion.div
                key={merchant.id}
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.05 * i }}
              >
                <MerchantCard merchant={merchant} onClick={() => navigate('merchant-detail', { id: merchant.id })} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Featured Products */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Produits tendance
          </h2>
        </div>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[180px] space-y-2">
                <Skeleton className="h-36 rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {products.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// MERCHANT CARD
// ============================================
function MerchantCard({ merchant, onClick }: { merchant: Merchant; onClick: () => void }) {
  return (
    <Card
      className="glass-card overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="h-32 bg-gradient-to-br from-primary/20 to-gold/20 relative overflow-hidden">
        {merchant.coverImage ? (
          <img src={merchant.coverImage} alt={merchant.businessName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-12 h-12 text-primary/30" />
          </div>
        )}
        {merchant.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-gold text-gold-foreground text-[10px] font-bold shadow-md">
            <Star className="w-2.5 h-2.5 mr-1" /> Populaire
          </Badge>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
          <Star className="w-3 h-3 fill-gold text-gold" />
          <span className="font-bold">{merchant.rating?.toFixed(1)}</span>
          <span className="opacity-70">({merchant.totalRatings})</span>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{merchant.businessName}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {merchant.quartier || merchant.city}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="secondary" className="text-[10px] h-5">
            {merchant.businessType === 'RESTAURANT' ? '🍽️' : merchant.businessType === 'SUPERMARKET' ? '🛒' : merchant.businessType === 'PHARMACY' ? '💊' : merchant.businessType === 'BOUTIQUE' ? '🛍️' : '📦'}
            {merchant.businessType}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-3 h-3" /> {merchant.operatingHours}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PRODUCT CARD
// ============================================
function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    setAdded(true);
    toast.success(`${product.name} ajouté au panier`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Card className="min-w-[170px] max-w-[170px] glass-card overflow-hidden group">
      <div className="h-28 bg-muted/50 relative overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-gold/10">
            <ShoppingBag className="w-8 h-8 text-primary/20" />
          </div>
        )}
        {product.comparePrice && product.comparePrice > product.price && (
          <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] h-5">
            -{Math.round((1 - product.price / product.comparePrice) * 100)}%
          </Badge>
        )}
        <div className="absolute bottom-1.5 right-1.5">
          <button
            onClick={handleAdd}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg ${
              added
                ? 'bg-green-500 text-white scale-110'
                : 'bg-primary text-primary-foreground hover:scale-110'
            }`}
          >
            {added ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <CardContent className="p-2.5">
        <h4 className="font-medium text-xs truncate leading-tight">{product.name}</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {product.merchant?.businessName}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="font-bold text-sm text-primary">{formatPrice(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>
        {product.totalSold > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{product.totalSold} vendus</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// SEARCH VIEW
// ============================================
function SearchView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [productsRes, merchantsRes] = await Promise.all([
        fetch(`/api/products?search=${encodeURIComponent(query)}`),
        fetch('/api/merchants'),
      ]);
      const productsData = await productsRes.json();
      const merchantsData = await merchantsRes.json();
      setResults(Array.isArray(productsData) ? productsData : []);
      const filtered = Array.isArray(merchantsData)
        ? merchantsData.filter((m: Merchant) =>
            m.businessName.toLowerCase().includes(query.toLowerCase())
          )
        : [];
      setMerchants(filtered);
    } catch {
      toast.error('Erreur de recherche');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 400);
    return () => clearTimeout(timer);
  }, [handleSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('home')} className="rounded-xl shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Que recherchez-vous ?"
            className="pl-10 rounded-xl h-11"
            autoFocus
          />
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && searched && (
        <>
          {merchants.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Commerçants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {merchants.map((m) => (
                  <MerchantCard key={m.id} merchant={m} onClick={() => navigate('merchant-detail', { id: m.id })} />
                ))}
              </div>
            </div>
          )}
          {results.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Produits ({results.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
          {results.length === 0 && merchants.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun résultat pour &quot;{query}&quot;</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Essayez d&apos;autres mots-clés</p>
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-primary/40" />
          </div>
          <p className="text-muted-foreground">Tapez pour rechercher</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// CATEGORY VIEW
// ============================================
function CategoryView({ navigate, categoryId }: { navigate: (view: any, data?: Record<string, string>) => void; categoryId?: string }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchByCategory() {
      setLoading(true);
      try {
        const res = await fetch('/api/merchants');
        const data = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((m: Merchant) => m.businessType === categoryId)
          : [];
        setMerchants(filtered);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    if (categoryId) fetchByCategory();
  }, [categoryId]);

  const categoryLabels: Record<string, string> = {
    RESTAURANT: 'Restaurants',
    SUPERMARKET: 'Supermarchés',
    PHARMACY: 'Pharmacies',
    BOUTIQUE: 'Boutiques',
    COLIS: 'Colis',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('home')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">{categoryLabels[categoryId || ''] || 'Catégorie'}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : merchants.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {merchants.map((m) => (
            <MerchantCard key={m.id} merchant={m} onClick={() => navigate('merchant-detail', { id: m.id })} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun commerçant dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// MERCHANT DETAIL VIEW
// ============================================
function MerchantDetailView({ navigate, merchantId }: { navigate: (view: any, data?: Record<string, string>) => void; merchantId?: string }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  useEffect(() => {
    async function fetchData() {
      if (!merchantId) return;
      setLoading(true);
      try {
        const [merchantsRes, productsRes] = await Promise.all([
          fetch('/api/merchants'),
          fetch(`/api/products?merchantId=${merchantId}`),
        ]);
        const merchantsData = await merchantsRes.json();
        const productsData = await productsRes.json();
        const m = Array.isArray(merchantsData) ? merchantsData.find((m: Merchant) => m.id === merchantId) : null;
        setMerchant(m || null);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [merchantId]);

  const getCartQty = (productId: string) => items.find(i => i.productId === productId)?.quantity || 0;

  const handleAddItem = (product: Product) => {
    if (!merchant) return;
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-16">
        <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Commerçant non trouvé</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('home')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <Button variant="ghost" size="icon" onClick={() => navigate('home')} className="absolute top-3 left-3 z-10 rounded-xl bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="h-48 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-gold/20">
          {merchant.coverImage ? (
            <img src={merchant.coverImage} alt={merchant.businessName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-16 h-16 text-primary/20" />
            </div>
          )}
        </div>
        <div className="flex items-end gap-3 -mt-8 px-2 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-card border-2 border-card shadow-lg flex items-center justify-center overflow-hidden">
            {merchant.logo ? (
              <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-xl font-bold">{merchant.businessName}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                {merchant.rating?.toFixed(1)} ({merchant.totalRatings})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {merchant.operatingHours}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-xs px-3 py-1">
          <MapPin className="w-3 h-3 mr-1" /> {merchant.address}
        </Badge>
        <Badge variant="outline" className="text-xs px-3 py-1">
          <Phone className="w-3 h-3 mr-1" /> {merchant.phone}
        </Badge>
      </div>

      {merchant.description && (
        <p className="text-sm text-muted-foreground">{merchant.description}</p>
      )}

      {/* Products */}
      <div>
        <h2 className="text-lg font-bold mb-4">Menu ({products.length})</h2>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun produit disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const qty = getCartQty(product.id);
              return (
                <Card key={product.id} className="glass-card overflow-hidden">
                  <div className="flex gap-3 p-3">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-muted/50 shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{product.name}</h3>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                          )}
                        </div>
                        {qty === 0 ? (
                          <Button size="sm" onClick={() => handleAddItem(product)} className="rounded-xl text-xs h-8 gap-1">
                            <Plus className="w-3.5 h-3.5" /> Ajouter
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => updateQuantity(product.id, qty - 1)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="w-6 text-center text-sm font-bold">{qty}</span>
                            <Button
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-primary text-primary-foreground"
                              onClick={() => updateQuantity(product.id, qty + 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CART VIEW
// ============================================
function CartView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCartStore();
  const cartTotal = total();
  const cartCount = itemCount();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-primary/30" />
        </div>
        <h2 className="text-xl font-bold mb-2">Votre panier est vide</h2>
        <p className="text-sm text-muted-foreground mb-6">Ajoutez des articles pour commencer</p>
        <Button onClick={() => navigate('home')} className="rounded-xl">
          Explorer les commerçants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('home')} className="rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Panier</h1>
          <Badge variant="secondary" className="font-bold">{cartCount} article{cartCount > 1 ? 's' : ''}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive rounded-xl">
          <Trash2 className="w-4 h-4 mr-1" /> Vider
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.productId}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="glass-card">
              <div className="flex gap-3 p-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/50 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                  <p className="font-bold text-sm text-primary mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3" />}
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <Button
                        size="icon"
                        className="h-7 w-7 rounded-lg bg-primary text-primary-foreground"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span className="font-medium text-primary">Gratuit</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de service</span>
            <span className="font-medium">{formatPrice(Math.round(cartTotal * 0.03))}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-lg text-primary">{formatPrice(cartTotal + Math.round(cartTotal * 0.03))}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full rounded-2xl h-13 text-base font-bold shadow-lg shadow-primary/20"
        onClick={() => navigate('checkout')}
      >
        Passer la commande — {formatPrice(cartTotal + Math.round(cartTotal * 0.03))}
      </Button>
    </div>
  );
}

// ============================================
// CHECKOUT VIEW
// ============================================
function CheckoutView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const { user } = useAuthStore();
  const { items, clearCart, total } = useCartStore();
  const [address, setAddress] = useState('');
  const [quartier, setQuartier] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  const cartTotal = total();
  const serviceFee = Math.round(cartTotal * 0.03);
  const finalTotal = cartTotal + serviceFee;

  const paymentMethods = [
    { id: 'CASH', label: 'Espèces', icon: Banknote, desc: 'Payer en espèces à la livraison' },
    { id: 'ORANGE_MONEY', label: 'Orange Money', icon: CreditCard, desc: 'Paiement mobile Orange' },
    { id: 'MOOV_MONEY', label: 'Moov Money', icon: CreditCard, desc: 'Paiement mobile Moov' },
    { id: 'WALLET', label: 'Portefeuille', icon: Wallet, desc: 'Payer avec votre solde Rapigo' },
  ];

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error('Veuillez entrer votre adresse de livraison');
      return;
    }
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.id,
          merchantId: items[0].merchantId,
          subtotal: cartTotal,
          deliveryFee: 0,
          serviceFee,
          discount: 0,
          total: finalTotal,
          paymentMethod,
          paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING',
          deliveryAddress: address,
          deliveryCity: 'Bamako',
          deliveryQuartier: quartier,
          notes,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            productImage: item.image,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la commande');
        return;
      }
      clearCart();
      toast.success('Commande passée avec succès !');
      navigate('order-detail', { id: data.id });
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle2 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Aucun article à commander</h2>
        <Button onClick={() => navigate('home')} className="mt-4 rounded-xl">Retour à l&apos;accueil</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('cart')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Finaliser la commande</h1>
      </div>

      {/* Delivery Address */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Adresse de livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Numéro et nom de rue..."
            className="rounded-xl"
          />
          <Input
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
            placeholder="Quartier (ex: Badalabougou, Faladiè...)"
            className="rounded-xl"
          />
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Mode de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setPaymentMethod(pm.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                paymentMethod === pm.id
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                paymentMethod === pm.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <pm.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{pm.label}</p>
                <p className="text-xs text-muted-foreground">{pm.desc}</p>
              </div>
              {paymentMethod === pm.id && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions spéciales pour le livreur..."
            className="rounded-xl resize-none"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Résumé de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-primary">Gratuit</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de service</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatPrice(finalTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full rounded-2xl h-13 text-base font-bold shadow-lg shadow-primary/20"
        onClick={handlePlaceOrder}
        disabled={loading || !address.trim()}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
        {loading ? 'Traitement en cours...' : `Confirmer — ${formatPrice(finalTotal)}`}
      </Button>
    </div>
  );
}

// ============================================
// ORDERS VIEW
// ============================================
function OrdersView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`/api/orders?userId=${user?.id}`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user?.id]);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const statusTabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'IN_TRANSIT', label: 'En cours' },
    { id: 'DELIVERED', label: 'Livrées' },
    { id: 'CANCELLED', label: 'Annulées' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mes commandes</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-xl bg-muted/80">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune commande trouvée</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('home')}>
            Commander maintenant
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <Card
                className="glass-card cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate('order-detail', { id: order.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{order.orderNumber}</h3>
                      <p className="text-xs text-muted-foreground">{order.merchant?.businessName}</p>
                    </div>
                    <Badge className={`${ORDER_STATUS_COLORS[order.status] || 'bg-muted'} text-xs font-medium`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      Détails <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// ORDER DETAIL VIEW
// ============================================
function OrderDetailView({ navigate, orderId }: { navigate: (view: any, data?: Record<string, string>) => void; orderId?: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((o: Order) => o.id === orderId) : null;
        setOrder(found || null);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const steps = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
  const currentStepIndex = order ? steps.indexOf(order.status) : -1;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Commande non trouvée</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('orders')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('orders')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="ml-auto">
          <Badge className={`${ORDER_STATUS_COLORS[order.status] || 'bg-muted'} font-medium`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>
      </div>

      {/* Progress Tracker */}
      {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Suivi de la commande</h3>
              {order.estimatedTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{order.estimatedTime} min
                </span>
              )}
            </div>
            <Progress value={currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0} className="h-2 mb-4" />
            <div className="flex justify-between overflow-x-auto no-scrollbar">
              {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center min-w-[48px]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                    i <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {i < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">
                    {ORDER_STATUS_LABELS[step]?.replace('ée', '').replace('é', '') || step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Info */}
      {order.driver && (
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold">
              {order.driver.user.firstName[0]}{order.driver.user.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{order.driver.user.firstName} {order.driver.user.lastName}</p>
              <p className="text-xs text-muted-foreground">Votre livreur</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-xl h-10 w-10">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-xl h-10 w-10">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Articles commandés</CardTitle>
          <CardDescription>{order.merchant?.businessName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                {item.productImage ? (
                  <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
              </div>
              <span className="font-semibold text-sm">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
          <Separator />
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>{order.deliveryFee === 0 ? 'Gratuit' : formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais de service</span>
              <span>{formatPrice(order.serviceFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Réduction</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Détails de livraison</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{order.deliveryAddress}, {order.deliveryCity}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                {order.paymentMethod === 'CASH' ? 'Espèces' : order.paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' : order.paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : order.paymentMethod === 'WALLET' ? 'Portefeuille' : order.paymentMethod}
              </span>
            </div>
            {order.notes && (
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>{order.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// TRACKING VIEW
// ============================================
function TrackingView({ navigate, orderId }: { navigate: (view: any, data?: Record<string, string>) => void; orderId?: string }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('orders')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Suivi en temps réel</h1>
      </div>
      <Card className="glass-card">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-float">
            <Truck className="w-10 h-10 text-primary/50" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Suivi en direct</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Votre livreur est en route ! Vous pouvez suivre sa position en temps réel sur la carte.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="rounded-xl gap-2">
              <Phone className="w-4 h-4" /> Appeler
            </Button>
            <Button variant="outline" className="rounded-xl gap-2">
              <MessageCircle className="w-4 h-4" /> Message
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Étapes de livraison</h3>
          {['Commande confirmée', 'En préparation', 'Prête à être récupérée', 'Livreur en route', 'Livrée'].map((step, i) => (
            <div key={i} className={`flex gap-3 ${i < 3 ? '' : 'opacity-40'}`}>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < 3 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < 4 && <div className={`w-0.5 h-8 ${i < 3 ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
              <div className="pt-0.5">
                <p className={`text-sm font-medium ${i < 3 ? '' : 'text-muted-foreground'}`}>{step}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PROFILE VIEW
// ============================================
function ProfileView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const { user, updateUser, logout } = useAuthStore();

  const menuItems = [
    { icon: Heart, label: 'Favoris', view: 'favorites', badge: '0', color: 'text-rose-500' },
    { icon: Wallet, label: 'Portefeuille', view: 'wallet', desc: '0 FCFA', color: 'text-emerald-500' },
    { icon: Bell, label: 'Notifications', view: 'notifications', badge: '3', color: 'text-amber-500' },
    { icon: Gift, label: 'Parrainage', view: 'referral', color: 'text-purple-500' },
    { icon: Ticket, label: 'Coupons', view: 'coupons', color: 'text-orange-500' },
    { icon: Award, label: 'Programme fidélité', view: 'loyalty', color: 'text-cyan-500' },
    { icon: Headphones, label: 'Support', view: 'support', color: 'text-teal-500' },
    { icon: Settings, label: 'Paramètres', view: 'home', color: 'text-gray-500' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-primary/20">
          {user?.avatar ? (
            <AvatarImage src={user.avatar} alt={user.firstName} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-white text-xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
          <Phone className="w-3.5 h-3.5" /> {user?.phone}
        </p>
        {user?.isVerified && (
          <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
            <ShieldCheck className="w-3 h-3 mr-1" /> Vérifié
          </Badge>
        )}
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Commandes', value: '0', icon: Package, color: 'from-primary/20 to-emerald-500/20' },
          { label: 'Portefeuille', value: '0 FCFA', icon: Wallet, color: 'from-gold/20 to-amber-500/20' },
          { label: 'Points fidélité', value: '0', icon: Award, color: 'from-purple-500/20 to-pink-500/20' },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={fadeInUp} transition={{ delay: i * 0.08 }}>
            <Card className={`glass-card bg-gradient-to-br ${stat.color}`}>
              <CardContent className="p-3 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                <p className="font-bold text-sm">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Menu */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {menuItems.map((item, i) => (
            <button
              key={item.view}
              onClick={() => navigate(item.view as any)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-xl bg-muted/80 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.label}</p>
                {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}
              </div>
              {item.badge && item.badge !== '0' && (
                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 px-1.5">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// WALLET VIEW
// ============================================
function WalletView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        // Mock data for now
        setBalance(0);
        setTransactions([]);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchWallet();
  }, [user?.id]);

  const handleAddFunds = () => {
    const amount = parseInt(addAmount);
    if (!amount || amount < 100) {
      toast.error('Montant minimum : 100 FCFA');
      return;
    }
    toast.success(`Demande de ${formatPrice(amount)} envoyée`);
    setShowAddFunds(false);
    setAddAmount('');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('profile')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Portefeuille</h1>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary via-emerald-600 to-teal-600 text-white overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -bottom-12 w-48 h-48 bg-white/5 rounded-full" />
          <CardContent className="p-6 relative z-10">
            <p className="text-sm opacity-80 mb-1">Votre solde</p>
            <p className="text-3xl font-bold mb-4">{formatPrice(balance)}</p>
            <Button
              onClick={() => setShowAddFunds(true)}
              className="bg-white text-primary hover:bg-white/90 rounded-xl font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajouter des fonds
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Orange Money', icon: Phone, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Moov Money', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Virement', icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((action) => (
          <Card key={action.label} className="glass-card cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 mx-auto rounded-xl ${action.bg} flex items-center justify-center ${action.color} mb-2`}>
                <action.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium">{action.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-bold mb-3">Historique des transactions</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune transaction</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="glass-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'CREDIT' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${
                    tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Ajouter des fonds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000, 10000, 20000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(String(amt))}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    addAmount === String(amt) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {formatPrice(amt)}
                </button>
              ))}
            </div>
            <Input
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="Ou saisir un montant"
              className="rounded-xl"
              type="number"
            />
            <Button onClick={handleAddFunds} className="w-full rounded-xl">
              Confirmer le dépôt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// NOTIFICATIONS VIEW
// ============================================
function NotificationsView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const [notifications] = useState<Notification[]>([
    { id: '1', title: 'Commande confirmée', message: 'Votre commande #ORD-123456 a été confirmée par le restaurant.', type: 'ORDER', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: '2', title: 'Promotion spéciale', message: 'Profitez de -20% sur tous les restaurants ce weekend avec le code WEEKEND20.', type: 'PROMO', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: '3', title: 'Livraison en cours', message: 'Votre livreur Amadou est en route avec votre commande.', type: 'ORDER', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: '4', title: 'Paiement reçu', message: '5 000 FCFA ont été ajoutés à votre portefeuille.', type: 'PAYMENT', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: '5', title: 'Bienvenue sur Rapigo', message: 'Merci de vous inscrire ! Découvrez les meilleurs commerçants de Bamako.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  ]);
  const [loading] = useState(false);

  const typeIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    ORDER: { icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    PAYMENT: { icon: Wallet, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    PROMO: { icon: Tag, color: 'text-gold', bg: 'bg-gold/10' },
    INFO: { icon: CircleAlert, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('profile')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Notifications</h1>
        {notifications.filter(n => !n.isRead).length > 0 && (
          <Badge className="bg-primary text-primary-foreground font-bold">
            {notifications.filter(n => !n.isRead).length} nouvelles
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeIcons[notif.type] || typeIcons.INFO;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className={`glass-card cursor-pointer hover:shadow-md transition-all ${!notif.isRead ? 'border-l-4 border-l-primary' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>{notif.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// FAVORITES VIEW
// ============================================
function FavoritesView({ navigate }: { navigate: (view: any, data?: Record<string, string>) => void }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch('/api/products?featured=true');
        const data = await res.json();
        setFavorites(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('profile')} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Mes favoris</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Aucun favori</h2>
          <p className="text-sm text-muted-foreground mb-4">Ajoutez des produits en favoris pour les retrouver facilement</p>
          <Button onClick={() => navigate('home')} className="rounded-xl">Explorer</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              <button className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors shadow-sm">
                <Heart className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SUPPORT VIEW
// ============================================
function SupportView() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Comment passer une commande ?',
      a: 'Parcourez les commerçants, ajoutez des produits au panier, puis allez au panier pour finaliser votre commande en choisissant votre adresse et mode de paiement.',
    },
    {
      q: 'Quels modes de paiement sont acceptés ?',
      a: 'Nous acceptons les espèces, Orange Money, Moov Money et le portefeuille Rapigo. Choisissez votre méthode préférée lors du paiement.',
    },
    {
      q: 'Combien de temps prend la livraison ?',
      a: 'La durée moyenne de livraison est de 30 à 45 minutes selon la distance et le temps de préparation du commerçant.',
    },
    {
      q: 'Puis-je annuler ma commande ?',
      a: 'Oui, vous pouvez annuler votre commande tant qu\'elle n\'a pas été confirmée par le commerçant. Allez dans "Mes commandes" pour annuler.',
    },
    {
      q: 'Comment contacter le livreur ?',
      a: 'Lorsqu\'un livreur est assigné à votre commande, vous pouvez le contacter directement par téléphone ou message depuis la page de suivi.',
    },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Ticket de support envoyé avec succès !');
    setSubject('');
    setDescription('');
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Headphones className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Centre d&apos;aide</h1>
        <p className="text-sm text-muted-foreground mt-1">Comment pouvons-nous vous aider ?</p>
      </div>

      {/* Contact Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Nous contacter</CardTitle>
          <CardDescription>Remplissez le formulaire ci-dessous et nous vous répondrons rapidement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sujet</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Résumez votre problème..."
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              className="rounded-xl resize-none"
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Envoyer le message
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div>
        <h2 className="font-bold mb-3">Questions fréquentes</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <Card key={i} className="glass-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-sm pr-4">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PLACEHOLDER VIEW
// ============================================
function PlaceholderView({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  const { navigate } = useClientNav();
  return (
    <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 animate-float">
        <Icon className="w-10 h-10 text-primary/40" />
      </div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <Button variant="outline" className="rounded-xl" onClick={() => navigate('profile')}>
        <ChevronLeft className="w-4 h-4 mr-2" /> Retour au profil
      </Button>
    </div>
  );
}