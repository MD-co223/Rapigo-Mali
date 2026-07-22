import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// App space types
export type AppSpace = 'landing' | 'client' | 'merchant' | 'driver' | 'admin';

// Auth state
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  isSuperAdmin?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        // Clear all Zustand stores
        useAuthStore.setState({ user: null, token: null, isAuthenticated: false }, false);
        useSpaceStore.setState({ currentSpace: 'landing', previousSpace: null }, false);
        useCartStore.setState({ items: [], appliedCoupon: null, merchantId: null, merchantName: null }, false);
        // Clear all client nav stores
        useClientNav.setState({ view: 'home', data: undefined, history: [] }, false);
        useMerchantNav.setState({ view: 'dashboard', data: undefined, history: [] }, false);
        useDriverNav.setState({ view: 'home', data: undefined, history: [] }, false);
        useAdminNav.setState({ view: 'dashboard', data: undefined, history: [] }, false);

        // Clear all browser storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(';').forEach(c => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
          });
        }

        // Navigate to landing
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    { name: 'rapigo-auth' }
  )
);

// App space navigation
interface SpaceState {
  currentSpace: AppSpace;
  previousSpace: AppSpace | null;
  setSpace: (space: AppSpace) => void;
  goBack: () => void;
}

export const useSpaceStore = create<SpaceState>()((set) => ({
  currentSpace: 'landing',
  previousSpace: null,
  setSpace: (space) =>
    set((state) => ({ currentSpace: space, previousSpace: state.currentSpace })),
  goBack: () =>
    set((state) => ({
      currentSpace: state.previousSpace || 'landing',
      previousSpace: null,
    })),
}));

// Client sub-navigation
export type ClientView = 'home' | 'search' | 'category' | 'merchant-detail' | 'product-detail' | 'cart' | 'checkout' | 'orders' | 'order-detail' | 'favorites' | 'wallet' | 'profile' | 'notifications' | 'chat' | 'support' | 'referral' | 'coupons' | 'tracking' | 'loyalty';

interface NavState<T> {
  view: T;
  data?: Record<string, string>;
  history: { view: T; data?: Record<string, string> }[];
  navigate: (view: T, data?: Record<string, string>) => void;
  goBack: () => void;
}

function createNavStore<T extends string>(defaultView: T) {
  return create<NavState<T>>()((set, get) => ({
    view: defaultView,
    data: undefined,
    history: [],
    navigate: (view, data) =>
      set((state) => ({
        view,
        data,
        history: [...state.history.slice(-19), { view: state.view, data: state.data }],
      })),
    goBack: () => {
      const { history } = get();
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      set({ view: prev.view, data: prev.data, history: history.slice(0, -1) });
    },
  }));
}

export const useClientNav = createNavStore<ClientView>('home');

export type MerchantView = 'dashboard' | 'products' | 'add-product' | 'orders' | 'order-detail' | 'stats' | 'marketing' | 'billing' | 'settings' | 'payment-config' | 'delivery-zones' | 'subscription' | 'chat' | 'support' | 'notifications' | 'profile' | 'coupons';
export const useMerchantNav = createNavStore<MerchantView>('dashboard');

export type DriverView = 'home' | 'ride' | 'navigation' | 'history' | 'earnings' | 'ratings' | 'wallet' | 'support' | 'profile' | 'notifications' | 'chat' | 'documents';
export const useDriverNav = createNavStore<DriverView>('home');

export type AdminView = 'dashboard' | 'users' | 'merchants' | 'drivers' | 'orders' | 'payments' | 'subscriptions' | 'advertisements' | 'categories' | 'products' | 'support' | 'reports' | 'audit-logs' | 'settings' | 'notifications' | 'cities' | 'coupons' | 'profile';
export const useAdminNav = createNavStore<AdminView>('dashboard');

// Cart store (persisted)
export interface CartItem {
  productId: string;
  merchantId: string;
  merchantName: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  supplements?: { name: string; price: number }[];
  variants?: string;
  notes?: string;
}

export interface AppliedCoupon {
  couponId: string;
  code: string;
  discount: number;
  type: string;
}

interface CartState {
  items: CartItem[];
  merchantId: string | null;
  merchantName: string | null;
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      merchantId: null,
      merchantName: null,
      appliedCoupon: null,
      addItem: (item) =>
        set((state) => {
          if (state.merchantId && state.merchantId !== item.merchantId) {
            return { items: [item], merchantId: item.merchantId, merchantName: item.merchantName };
          }
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              merchantId: item.merchantId,
              merchantName: item.merchantName,
            };
          }
          return {
            items: [...state.items, item],
            merchantId: item.merchantId,
            merchantName: item.merchantName,
          };
        }),
      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.productId !== productId);
          return {
            items,
            ...(items.length === 0 ? { merchantId: null, merchantName: null } : {}),
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const items = state.items.filter((i) => i.productId !== productId);
            return {
              items,
              ...(items.length === 0 ? { merchantId: null, merchantName: null } : {}),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          };
        }),
      clearCart: () => set({ items: [], merchantId: null, merchantName: null, appliedCoupon: null }),
      getTotal: () => get().items.reduce((sum, i) => {
        const supps = i.supplements?.reduce((s, sup) => s + sup.price, 0) || 0;
        return sum + (i.price + supps) * i.quantity;
      }, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
    }),
    { name: 'rapigo-cart' }
  )
);

// Format currency (XOF / FCFA)
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

// API helper with auth
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data: T | null = null;
    try {
      const parsed = JSON.parse(text);
      // Auto-unwrap paginated responses
      if (parsed && typeof parsed === 'object') {
        const env = parsed as Record<string, unknown>;
        const unwrapKey = 'items' in env ? 'items'
          : 'products' in env ? 'products'
          : 'merchants' in env ? 'merchants'
          : 'orders' in env ? 'orders'
          : 'notifications' in env ? 'notifications'
          : 'coupons' in env ? 'coupons'
          : 'zones' in env ? 'zones'
          : 'transactions' in env ? 'transactions'
          : 'deliveries' in env ? 'deliveries'
          : null;
        if (unwrapKey && Array.isArray(env[unwrapKey])) {
          data = env[unwrapKey] as T;
        } else {
          data = parsed as T;
        }
      } else {
        data = parsed as T;
      }
    } catch { /* not JSON */ }
    
    if (!res.ok) {
      const errorMsg = data && typeof data === 'object' && 'error' in data 
        ? (data as { error: string }).error 
        : `Erreur ${res.status}`;
      return { data: null, error: errorMsg, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: 'Erreur de connexion', status: 0 };
  }
}

// Status helpers
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PAYMENT_PENDING: 'Paiement en attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  ASSIGNED: 'Assignée',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  UPLOADED: 'Preuve envoyée',
  PAID: 'Payé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PREPARING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  READY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  ASSIGNED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  PICKED_UP: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  IN_TRANSIT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const BUSINESS_TYPES: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  SUPERMARKET: 'Supermarché',
  PHARMACY: 'Pharmacie',
  BOUTIQUE: 'Boutique',
  COLIS: 'Colis & Envois',
  ELECTRONIQUE: 'Électronique',
  MODE: 'Mode & Vêtements',
  BEAUTE: 'Beauté & Santé',
};

export const PAYMENT_METHODS: Record<string, string> = {
  CASH: 'Cash (à la livraison)',
  FEDAPAY: '💳 Carte bancaire / Mobile Money',
  ORANGE_MONEY: 'Orange Money (virement manuel)',
  MOOV_MONEY: 'Moov Money (virement manuel)',
  WAVE: 'Wave (virement manuel)',
  VISA: 'Visa (virement manuel)',
  MASTERCARD: 'Mastercard (virement manuel)',
  QR_CODE: 'QR Code',
  WALLET: 'Portefeuille',
};