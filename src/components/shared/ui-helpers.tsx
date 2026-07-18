'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, ShoppingCart, Bell, Heart, Store, ClipboardList,
  Wallet, TrendingUp, Users, Truck, Tag, Grid3X3, Search,
  Star, StarOff
} from 'lucide-react';

/* ─── DataSkeleton: Reusable animated skeleton loader ────────── */
export function DataSkeleton({
  type = 'list',
  count = 4,
}: {
  /** 'list' = horizontal rows, 'card' = card grid, 'detail' = single detail page */
  type?: 'list' | 'card' | 'detail';
  count?: number;
}) {
  if (type === 'detail') {
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

  if (type === 'card') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 animate-in fade-in duration-300">
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

  // list type (default)
  return (
    <div className="space-y-3 p-4 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
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

/* ─── EmptyState: Friendly empty state with icon + French message ───── */
const EMPTY_CONFIGS: Record<string, { icon: React.ElementType; label: string; description?: string }> = {
  orders: { icon: ClipboardList, label: 'Aucune commande pour le moment', description: 'Vos commandes apparaîtront ici une fois passées.' },
  products: { icon: Package, label: 'Aucun produit trouvé', description: 'Ajoutez des produits pour commencer à vendre.' },
  notifications: { icon: Bell, label: 'Aucune notification', description: 'Vous n\'avez pas encore de notifications.' },
  favorites: { icon: Heart, label: 'Aucun favori', description: 'Ajoutez des favoris en appuyant sur le cœur.' },
  merchants: { icon: Store, label: 'Aucun commerçant disponible', description: 'Revenez plus tard pour découvrir de nouveaux commerçants.' },
  wallet: { icon: Wallet, label: 'Aucune transaction', description: 'Votre historique de transactions apparaîtra ici.' },
  drivers: { icon: Truck, label: 'Aucun livreur trouvé', description: 'Aucun livreur ne correspond à votre recherche.' },
  users: { icon: Users, label: 'Aucun utilisateur trouvé', description: 'Aucun utilisateur ne correspond à votre recherche.' },
  coupons: { icon: Tag, label: 'Aucun coupon disponible', description: 'Les coupons de réduction apparaîtront ici.' },
  categories: { icon: Grid3X3, label: 'Aucune catégorie', description: 'Aucune catégorie n\'est disponible pour le moment.' },
  search: { icon: Search, label: 'Aucun résultat trouvé', description: 'Essayez avec d\'autres termes de recherche.' },
  history: { icon: ClipboardList, label: 'Aucun historique', description: 'Vos anciennes commandes apparaîtront ici.' },
  earnings: { icon: TrendingUp, label: 'Aucun gain enregistré', description: 'Vos gains apparaîtront ici une fois vos premières livraisons effectuées.' },
  reviews: { icon: Star, label: 'Aucun avis', description: 'Les avis de vos clients apparaîtront ici.' },
};

export function EmptyState({
  type = 'search',
  icon: CustomIcon,
  label: CustomLabel,
  description: CustomDesc,
}: {
  type?: string;
  icon?: React.ElementType;
  label?: string;
  description?: string;
}) {
  const config = EMPTY_CONFIGS[type];
  const Icon = CustomIcon || config?.icon || Package;
  const label = CustomLabel || config?.label || 'Aucune donnée disponible';
  const desc = CustomDesc || config?.description;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-base font-medium text-muted-foreground mb-1">{label}</p>
      {desc && <p className="text-sm text-muted-foreground/70 max-w-xs">{desc}</p>}
    </div>
  );
}

/* ─── RefreshButton: Button with spinning animation when refreshing ───── */
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';

type ButtonHTMLProps = React.ComponentProps<typeof Button>;

interface RefreshButtonProps extends Omit<ButtonHTMLProps, 'onClick'> {
  onRefresh: () => Promise<void> | void;
  /** Label shown next to icon. Default: "Actualiser" */
  label?: string;
}

export function RefreshButton({ onRefresh, label = 'Actualiser', ...props }: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = useCallback(async () => {
    setSpinning(true);
    try { await onRefresh(); } catch { /* ignore */ }
    setSpinning(false);
  }, [onRefresh]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={spinning}
      className="active:scale-95 transition-transform"
      {...props}
    >
      {spinning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {label && <span className="ml-2 text-xs">{label}</span>}
    </Button>
  );
}

/* ─── RatingStars: Professional star rating component ──────────────── */
export function RatingStars({
  rating,
  onRate,
  size = 14,
  interactive = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.round(rating);
        const Icon = filled ? Star : StarOff;
        return interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => onRate?.(i)}
            className="p-0.5 rounded-sm hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
          >
            <Icon
              size={size}
              className={
                filled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                  : 'text-gray-300 dark:text-gray-600'
              }
            />
          </button>
        ) : (
          <Icon
            key={i}
            size={size}
            className={
              filled
                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                : 'text-gray-300 dark:text-gray-600'
            }
          />
        );
      })}
    </div>
  );
}