import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// App space types
export type AppSpace = 'landing' | 'client' | 'merchant' | 'driver' | 'admin';

// Auth state
interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
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
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
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
type ClientView = 'home' | 'search' | 'category' | 'merchant-detail' | 'product-detail' | 'cart' | 'checkout' | 'orders' | 'order-detail' | 'favorites' | 'wallet' | 'profile' | 'notifications' | 'chat' | 'support' | 'referral' | 'coupons' | 'tracking' | 'loyalty';

interface ClientNavState {
  view: ClientView;
  data?: Record<string, string>;
  navigate: (view: ClientView, data?: Record<string, string>) => void;
}

export const useClientNav = create<ClientNavState>()((set) => ({
  view: 'home',
  navigate: (view, data) => set({ view, data }),
}));

// Merchant sub-navigation
type MerchantView = 'dashboard' | 'products' | 'add-product' | 'orders' | 'order-detail' | 'stats' | 'marketing' | 'billing' | 'settings' | 'subscription' | 'chat' | 'support' | 'notifications' | 'profile';

interface MerchantNavState {
  view: MerchantView;
  data?: Record<string, string>;
  navigate: (view: MerchantView, data?: Record<string, string>) => void;
}

export const useMerchantNav = create<MerchantNavState>()((set) => ({
  view: 'dashboard',
  navigate: (view, data) => set({ view, data }),
}));

// Driver sub-navigation
type DriverView = 'home' | 'ride' | 'navigation' | 'history' | 'earnings' | 'ratings' | 'wallet' | 'support' | 'profile' | 'notifications' | 'chat' | 'documents';

interface DriverNavState {
  view: DriverView;
  data?: Record<string, string>;
  navigate: (view: DriverView, data?: Record<string, string>) => void;
}

export const useDriverNav = create<DriverNavState>()((set) => ({
  view: 'home',
  navigate: (view, data) => set({ view, data }),
}));

// Admin sub-navigation
type AdminView = 'dashboard' | 'users' | 'merchants' | 'drivers' | 'orders' | 'payments' | 'subscriptions' | 'advertisements' | 'categories' | 'products' | 'support' | 'reports' | 'audit-logs' | 'settings' | 'notifications' | 'cities' | 'profile';

interface AdminNavState {
  view: AdminView;
  data?: Record<string, string>;
  navigate: (view: AdminView, data?: Record<string, string>) => void;
}

export const useAdminNav = create<AdminNavState>()((set) => ({
  view: 'dashboard',
  navigate: (view, data) => set({ view, data }),
}));

// Cart store
interface CartItem {
  productId: string;
  merchantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  merchantId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  merchantId: null,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
          merchantId: item.merchantId,
        };
      }
      return {
        items: [...state.items, item],
        merchantId: item.merchantId,
      };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((i) => i.productId !== productId)
        : state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
    })),
  clearCart: () => set({ items: [], merchantId: null }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

// Format currency
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

// Status helpers
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PREPARING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  READY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  PICKED_UP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  IN_TRANSIT: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};