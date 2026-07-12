'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useAuthStore,
  useDriverNav,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import {
  Home,
  Package,
  Clock,
  User,
  MapPin,
  Navigation,
  Phone,
  Star,
  Wallet,
  FileText,
  Headphones,
  Bell,
  MessageCircle,
  ChevronRight,
  CheckCircle2,
  Circle,
  Truck,
  TrendingUp,
  Award,
  ArrowLeft,
  Upload,
  ShieldCheck,
  AlertCircle,
  Plus,
  Minus,
  Send,
  LogOut,
  Car,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Route,
  Timer,
  CircleDot,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_AVAILABLE_ORDERS = [
  {
    id: 'ord-001',
    pickup: 'Restaurant Le Djoliba, ACI 2000, Bamako',
    delivery: 'Quartier Badalabougou, Bamako',
    earnings: 2500,
    distance: '4.2 km',
    estimatedTime: '15 min',
    merchant: 'Restaurant Le Djoliba',
    customer: 'Amadou Diallo',
  },
  {
    id: 'ord-002',
    pickup: 'Supermarché Koutouba, Hamdallaye, Bamako',
    delivery: 'Kalaban-Coura, Bamako',
    earnings: 3500,
    distance: '6.8 km',
    estimatedTime: '22 min',
    merchant: 'Supermarché Koutouba',
    customer: 'Fatoumata Traoré',
  },
  {
    id: 'ord-003',
    pickup: 'Pharmacie du Fleuve, Korofina, Bamako',
    delivery: 'Sotuba, Bamako',
    earnings: 4200,
    distance: '9.1 km',
    estimatedTime: '30 min',
    merchant: 'Pharmacie du Fleuve',
    customer: 'Ibrahim Keita',
  },
];

const MOCK_ACTIVE_RIDE = {
  id: 'ord-001',
  customer: 'Amadou Diallo',
  customerPhone: '+223 70 12 34 56',
  pickup: 'Restaurant Le Djoliba, ACI 2000, Bamako',
  delivery: 'Quartier Badalabougou, Bamako',
  earnings: 2500,
  distance: '4.2 km',
  estimatedTime: '15 min',
  status: 'picking_up' as const,
  merchant: 'Restaurant Le Djoliba',
  orderId: 'RPG-20250115-0042',
};

const MOCK_HISTORY = [
  { id: 'h1', date: '15/01/2025', merchant: 'Boutique Aminata', customer: 'Moussa Coulibaly', amount: 2800, status: 'DELIVERED', distance: '5.1 km' },
  { id: 'h2', date: '15/01/2025', merchant: 'Alimentation Kadiatou', customer: 'Awa Sissoko', amount: 3200, status: 'DELIVERED', distance: '7.3 km' },
  { id: 'h3', date: '14/01/2025', merchant: 'Épicerie Moderne', customer: 'Bakary Diarra', amount: 1900, status: 'DELIVERED', distance: '3.4 km' },
  { id: 'h4', date: '14/01/2025', merchant: 'Restaurant Chez Boubacar', customer: 'Mariam Sanogo', amount: 4100, status: 'CANCELLED', distance: '8.7 km' },
  { id: 'h5', date: '13/01/2025', merchant: 'Pharmacie Centrale', customer: 'Oumar Sidibé', amount: 5200, status: 'DELIVERED', distance: '11.2 km' },
  { id: 'h6', date: '13/01/2025', merchant: 'Supermarché Bim, Bamako', customer: 'Djénéba Konaté', amount: 2400, status: 'DELIVERED', distance: '4.8 km' },
  { id: 'h7', date: '12/01/2025', merchant: 'Boulangerie du Sahel', customer: 'Seydou Traoré', amount: 1800, status: 'DELIVERED', distance: '2.9 km' },
  { id: 'h8', date: '11/01/2025', merchant: 'Marché Médina Coura', customer: 'Kadiatou Bah', amount: 3600, status: 'DELIVERED', distance: '6.5 km' },
  { id: 'h9', date: '10/01/2025', merchant: 'Café Restaurant Bolomba', customer: 'Adama Camara', amount: 2100, status: 'DELIVERED', distance: '3.8 km' },
  { id: 'h10', date: '09/01/2025', merchant: 'Librairie du Mali', customer: 'Fatoumata Dembélé', amount: 2900, status: 'DELIVERED', distance: '5.5 km' },
];

const MOCK_WEEKLY_EARNINGS = [
  { day: 'Lun', amount: 18500 },
  { day: 'Mar', amount: 22300 },
  { day: 'Mer', amount: 15800 },
  { day: 'Jeu', amount: 27400 },
  { day: 'Ven', amount: 31200 },
  { day: 'Sam', amount: 38600 },
  { day: 'Dim', amount: 24100 },
];

const MOCK_RATINGS = {
  average: 4.7,
  total: 238,
  distribution: [
    { stars: 5, count: 156, percentage: 66 },
    { stars: 4, count: 52, percentage: 22 },
    { stars: 3, count: 18, percentage: 7 },
    { stars: 2, count: 8, percentage: 3 },
    { stars: 1, count: 4, percentage: 2 },
  ],
  reviews: [
    { id: 'r1', name: 'Fatoumata T.', rating: 5, comment: 'Très ponctuel et professionnel. La commande est arrivée en parfait état.', date: '14/01/2025' },
    { id: 'r2', name: 'Ibrahim K.', rating: 5, comment: 'Excellent livreur, toujours souriant et poli.', date: '13/01/2025' },
    { id: 'r3', name: 'Awa S.', rating: 4, comment: 'Bon service, juste un petit retard.', date: '12/01/2025' },
    { id: 'r4', name: 'Moussa C.', rating: 5, comment: 'Le meilleur livreur de Bamako ! Rapide et fiable.', date: '11/01/2025' },
    { id: 'r5', name: 'Djénéba K.', rating: 4, comment: 'Correct, je recommande.', date: '10/01/2025' },
  ],
};

const MOCK_DOCUMENTS = [
  { id: 'doc1', name: "Carte d'identité nationale", status: 'verified' as const, description: 'Pièce d\'identité en cours de validité' },
  { id: 'doc2', name: 'Permis de conduire', status: 'verified' as const, description: 'Permis moto ou voiture catégorie A/B' },
  { id: 'doc3', name: "Carte grise du véhicule", status: 'pending' as const, description: 'Enregistrement du véhicule' },
  { id: 'doc4', name: 'Selfie avec pièce', status: 'verified' as const, description: 'Photo de vous avec votre pièce d\'identité' },
];

const MOCK_WALLET = {
  balance: 47500,
  transactions: [
    { id: 't1', type: 'credit' as const, description: 'Course RPG-20250115-0042', amount: 2500, date: '15/01/2025' },
    { id: 't2', type: 'credit' as const, description: 'Course RPG-20250115-0038', amount: 3200, date: '15/01/2025' },
    { id: 't3', type: 'debit' as const, description: 'Retrait Mobile Money', amount: 20000, date: '14/01/2025' },
    { id: 't4', type: 'credit' as const, description: 'Bonus hebdomadaire', amount: 5000, date: '14/01/2025' },
    { id: 't5', type: 'credit' as const, description: 'Course RPG-20250113-0029', amount: 4100, date: '13/01/2025' },
    { id: 't6', type: 'debit' as const, description: 'Commission plateforme', amount: -615, date: '13/01/2025' },
    { id: 't7', type: 'credit' as const, description: 'Pourboire client', amount: 1000, date: '12/01/2025' },
    { id: 't8', type: 'credit' as const, description: 'Course RPG-20250112-0021', amount: 2800, date: '12/01/2025' },
  ],
};

const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'Nouveau bonus disponible', message: 'Effectuez 10 courses cette semaine et gagnez 5 000 FCFA de bonus.', time: 'Il y a 2h', read: false },
  { id: 'n2', title: 'Course annulée', message: 'La course RPG-20250114-0041 a été annulée par le client.', time: 'Il y a 5h', read: false },
  { id: 'n3', title: 'Paiement reçu', message: 'Vous avez reçu 3 200 FCFA pour la course RPG-20250115-0038.', time: 'Hier', read: true },
  { id: 'n4', title: 'Rappel documents', message: 'Veuillez mettre à jour votre carte grise dans la section Documents.', time: 'Il y a 3 jours', read: true },
  { id: 'n5', title: 'Félicitations !', message: 'Vous avez atteint 4.7 étoiles. Continuez ainsi !', time: 'Il y a 5 jours', read: true },
];

const MOCK_CHATS = [
  { id: 'c1', name: 'Support Rapigo', lastMessage: 'Votre problème a été résolu. N\'hésitez pas à nous recontacter.', time: 'Hier', unread: 0 },
  { id: 'c2', name: 'Amadou Diallo', lastMessage: 'Je suis à l\'entrée principale.', time: '14/01', unread: 0 },
  { id: 'c3', name: 'Fatoumata Traoré', lastMessage: 'Merci beaucoup !', time: '13/01', unread: 2 },
];

const CHAT_MESSAGES = [
  { id: 'm1', sender: 'them', text: 'Bonjour, je suis près du restaurant. Où êtes-vous exactement ?', time: '14:32' },
  { id: 'm2', sender: 'me', text: 'Je suis à la porte principale du marché, côté rue.', time: '14:34' },
  { id: 'm3', sender: 'them', text: 'D\'accord, j\'arrive dans 2 minutes.', time: '14:35' },
  { id: 'm4', sender: 'me', text: 'Parfait, merci !', time: '14:35' },
  { id: 'm5', sender: 'them', text: 'Merci beaucoup !', time: '14:42' },
];

// ─── Step Progress Component ──────────────────────────────────────────────────

const RIDE_STEPS = [
  { key: 'assigned', label: 'Assignée' },
  { key: 'picking_up', label: 'Récupération' },
  { key: 'in_transit', label: 'En transit' },
  { key: 'delivered', label: 'Livrée' },
] as const;

type RideStep = (typeof RIDE_STEPS)[number]['key'];

function StepProgress({ current }: { current: RideStep }) {
  const currentIndex = RIDE_STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-between px-2">
      {RIDE_STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    i <= currentIndex ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
              <motion.div
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  backgroundColor: isCompleted
                    ? '#10b981'
                    : isCurrent
                    ? '#10b981'
                    : '#e5e7eb',
                }}
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : isCurrent ? (
                  <div className="h-3 w-3 rounded-full bg-white" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </motion.div>
              {i < RIDE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    i < currentIndex ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-medium ${
                isCompleted || isCurrent
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────

function HomeView() {
  const { navigate } = useDriverNav();
  const [isOnline, setIsOnline] = useState(false);
  const [showOrders, setShowOrders] = useState(true);

  const handleToggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    toast.success(newState ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
  };

  const handleAcceptOrder = (orderId: string) => {
    toast.success('Course acceptée !');
    navigate('ride', { orderId });
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 pb-4">
        {/* Online Toggle */}
        <motion.div
          className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: isOnline ? [1, 1.2, 1] : 1,
                opacity: isOnline ? 1 : 0.5,
              }}
              transition={{ repeat: isOnline ? Infinity : 0, duration: 2 }}
            >
              <div
                className={`h-4 w-4 rounded-full ${
                  isOnline ? 'bg-white' : 'bg-white/40'
                }`}
              />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-white/80">Statut</p>
              <p className="text-lg font-bold">{isOnline ? 'En ligne' : 'Hors ligne'}</p>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            className={`relative h-14 w-24 rounded-full transition-all duration-500 ${
              isOnline
                ? 'bg-white/30 shadow-inner'
                : 'bg-black/20 shadow-inner'
            }`}
            aria-label="Toggle online status"
          >
            <motion.div
              className="absolute top-1 flex h-12 w-[46px] items-center justify-center rounded-full bg-white shadow-lg"
              animate={{ left: isOnline ? 'calc(100% - 50px)' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Truck className={`h-5 w-5 ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`} />
            </motion.div>
          </button>
        </motion.div>

        {/* Driver Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-emerald-500">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-bold">
                    MK
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">Mamadou Konaté</p>
                  <p className="text-sm text-muted-foreground">Honda PCX 150 • AK-0452-BM</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
                  <p className="text-lg font-bold text-emerald-600">12 courses</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                  <TrendingUp className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                  <p className="text-lg font-bold">12</p>
                  <p className="text-[10px] text-muted-foreground">Courses</p>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
                  <Star className="mx-auto mb-1 h-5 w-5 text-amber-500" />
                  <p className="text-lg font-bold">4.7</p>
                  <p className="text-[10px] text-muted-foreground">Note</p>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
                  <Wallet className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                  <p className="text-lg font-bold">28.5k</p>
                  <p className="text-[10px] text-muted-foreground">FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Orders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-base font-bold">Courses disponibles</h2>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {MOCK_AVAILABLE_ORDERS.length}
            </Badge>
          </div>

          {showOrders ? (
            <div className="space-y-3">
              {MOCK_AVAILABLE_ORDERS.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start gap-2">
                        <div className="flex flex-col items-center gap-0.5 pt-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <div className="h-8 w-0.5 bg-gray-200 dark:bg-gray-700" />
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Récupérer
                            </p>
                            <p className="text-sm font-semibold">{order.pickup}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Livrer à
                            </p>
                            <p className="text-sm font-semibold">{order.delivery}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900 p-3 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Gains</p>
                          <p className="text-base font-bold text-emerald-600">
                            {formatPrice(order.earnings)}
                          </p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="text-base font-bold">{order.distance}</p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Temps</p>
                          <p className="text-base font-bold">{order.estimatedTime}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                        onClick={() => handleAcceptOrder(order.id)}
                      >
                        Accepter la course
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Package className="h-16 w-16 text-gray-300" />
                </motion.div>
                <p className="mt-4 text-lg font-semibold text-gray-400">
                  Aucune course disponible
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Recherche en cours...
                </p>
                <Skeleton className="mt-4 h-1 w-32 rounded-full" />
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ce mois</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="rounded-xl border border-transparent p-3 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => navigate('history')}
                >
                  <p className="text-xl font-bold">87</p>
                  <p className="text-[11px] text-muted-foreground">Total courses</p>
                </button>
                <button
                  className="rounded-xl border border-transparent p-3 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => navigate('ratings')}
                >
                  <p className="text-xl font-bold flex items-center justify-center gap-1">
                    4.7 <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </p>
                  <p className="text-[11px] text-muted-foreground">Note moyenne</p>
                </button>
                <button
                  className="rounded-xl border border-transparent p-3 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => navigate('earnings')}
                >
                  <p className="text-xl font-bold text-emerald-600">312k</p>
                  <p className="text-[11px] text-muted-foreground">Revenus</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}

// ─── Ride / Navigation View ───────────────────────────────────────────────────

function RideView() {
  const { navigate } = useDriverNav();
  const [rideStatus, setRideStatus] = useState<RideStep>(MOCK_ACTIVE_RIDE.status);

  const handleNextStep = () => {
    const steps: RideStep[] = ['assigned', 'picking_up', 'in_transit', 'delivered'];
    const currentIndex = steps.indexOf(rideStatus);

    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      setRideStatus(next);

      if (next === 'in_transit') {
        toast.success('Colis récupéré ! Direction la livraison.');
        navigate('navigation');
      } else if (next === 'delivered') {
        toast.success('Course livrée avec succès ! 🎉');
        setTimeout(() => navigate('home'), 2000);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Map Placeholder */}
      <div className="relative flex-1 bg-gray-200 dark:bg-gray-800">
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <MapPin className="h-12 w-12 text-emerald-500" />
          </motion.div>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            Carte en cours de chargement...
          </p>
        </div>

        {/* Top Bar */}
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-white hover:bg-white/20"
              onClick={() => navigate('home')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-white">
              <p className="text-xs opacity-80">Course en cours</p>
              <p className="font-bold text-sm">{MOCK_ACTIVE_RIDE.orderId}</p>
            </div>
          </div>
        </div>

        {/* Bottom Info Card */}
        <div className="absolute left-0 right-0 bottom-0 p-4">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                {/* Step Progress */}
                <div className="mb-4">
                  <StepProgress current={rideStatus} />
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold text-sm">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{MOCK_ACTIVE_RIDE.customer}</p>
                    <p className="text-xs text-muted-foreground">{MOCK_ACTIVE_RIDE.customerPhone}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full text-emerald-600 border-emerald-200"
                    onClick={() => toast.info('Appel en cours...')}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>

                {/* Addresses */}
                <div className="flex gap-3 mb-4">
                  <div className="flex flex-col items-center gap-0.5 pt-1">
                    <div className={`h-3 w-3 rounded-full ${rideStatus === 'assigned' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-300'}`} />
                    <div className="h-10 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className={`h-3 w-3 rounded-full ${rideStatus === 'in_transit' ? 'bg-red-500 ring-4 ring-red-100' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase">Récupérer</p>
                      <p className="text-xs font-semibold">{MOCK_ACTIVE_RIDE.pickup}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase">Livrer</p>
                      <p className="text-xs font-semibold">{MOCK_ACTIVE_RIDE.delivery}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <div className="flex items-center gap-1.5">
                    <Route className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold">{MOCK_ACTIVE_RIDE.distance}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold">{MOCK_ACTIVE_RIDE.estimatedTime}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600">
                      {formatPrice(MOCK_ACTIVE_RIDE.earnings)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {rideStatus !== 'delivered' && (
                  <Button
                    className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                    onClick={handleNextStep}
                  >
                    {rideStatus === 'assigned' && 'Marquer comme récupérée'}
                    {rideStatus === 'picking_up' && 'Marquer comme récupérée'}
                    {rideStatus === 'in_transit' && 'Marquer comme livrée'}
                  </Button>
                )}
                {rideStatus === 'delivered' && (
                  <div className="flex flex-col items-center py-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </motion.div>
                    <p className="mt-2 font-bold text-emerald-600">Course terminée !</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation View ──────────────────────────────────────────────────────────

function NavigationView() {
  const { navigate } = useDriverNav();

  return (
    <div className="flex h-full flex-col">
      {/* Map Placeholder */}
      <div className="relative flex-1 bg-gray-200 dark:bg-gray-800">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Navigation className="h-16 w-16 text-emerald-500" />
          </motion.div>
          <p className="mt-3 text-sm font-medium text-gray-500">Navigation en cours</p>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold">{MOCK_ACTIVE_RIDE.estimatedTime}</span>
            <span className="text-xs text-muted-foreground">restants</span>
          </div>
        </div>

        {/* Top Bar */}
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-white hover:bg-white/20"
              onClick={() => navigate('ride')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-white">
              <p className="font-bold text-sm">En route vers la livraison</p>
              <p className="text-xs opacity-80">{MOCK_ACTIVE_RIDE.delivery}</p>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="absolute left-0 right-0 bottom-0 p-4">
          <Button
            className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              toast.success('Course livrée avec succès ! 🎉');
              setTimeout(() => navigate('home'), 1500);
            }}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Marquer comme livrée
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────

function HistoryView() {
  const [filter, setFilter] = useState('all');

  const totalEarnings = MOCK_HISTORY
    .filter((h) => h.status === 'DELIVERED')
    .reduce((sum, h) => sum + h.amount, 0);

  const deliveredCount = MOCK_HISTORY.filter((h) => h.status === 'DELIVERED').length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Historique des courses</h1>
          <p className="text-sm text-muted-foreground">Vos dernières livraisons</p>
        </div>

        {/* Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Revenus (période)</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatPrice(totalEarnings)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Courses livrées</p>
                <p className="text-2xl font-bold">{deliveredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full h-12">
            <TabsTrigger value="all" className="flex-1 text-sm">Toutes</TabsTrigger>
            <TabsTrigger value="week" className="flex-1 text-sm">Cette semaine</TabsTrigger>
            <TabsTrigger value="month" className="flex-1 text-sm">Ce mois</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-3">
            <div className="space-y-2.5">
              {MOCK_HISTORY.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{item.merchant}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.customer} • {item.distance}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-bold">
                            {item.status === 'CANCELLED' ? '—' : formatPrice(item.amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-medium ${ORDER_STATUS_COLORS[item.status] || ''}`}
                      >
                        {ORDER_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

// ─── Earnings View ────────────────────────────────────────────────────────────

function EarningsView() {
  const { navigate } = useDriverNav();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const weeklyTotal = MOCK_WEEKLY_EARNINGS.reduce((sum, d) => sum + d.amount, 0);
  const monthlyTotal = 312500;
  const courseEarnings = 248000;
  const bonus = 32500;
  const commission = 32000;

  const chartConfig = {
    amount: { label: 'Revenus', color: '#10b981' },
  };

  const dailySummary = [
    { date: 'Aujourd\'hui', courses: 12, earnings: 28500 },
    { date: 'Hier', courses: 15, earnings: 32100 },
    { date: '13 Jan', courses: 11, earnings: 24800 },
    { date: '12 Jan', courses: 9, earnings: 19400 },
    { date: '11 Jan', courses: 14, earnings: 30200 },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Revenus</h1>
            <p className="text-sm text-muted-foreground">Vos gains et statistiques</p>
          </div>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white">
              <p className="text-sm text-emerald-100">Solde ce mois</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(monthlyTotal)}</p>
              <p className="text-xs text-emerald-200 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                +12% par rapport au mois dernier
              </p>
            </div>
            <CardContent className="p-4">
              <Button
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base active:scale-[0.98] transition-transform"
                onClick={() => setShowWithdrawDialog(true)}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Retirer les gains
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenus cette semaine</CardTitle>
            <CardDescription>{formatPrice(weeklyTotal)} au total</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={MOCK_WEEKLY_EARNINGS} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Détail des gains</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm">Gains des courses</span>
              </div>
              <span className="text-sm font-bold">{formatPrice(courseEarnings)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm">Bonus</span>
              </div>
              <span className="text-sm font-bold">{formatPrice(bonus)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-sm">Commission plateforme</span>
              </div>
              <span className="text-sm font-bold text-red-500">-{formatPrice(commission)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-bold">
              <span className="text-sm">Total net</span>
              <span className="text-sm text-emerald-600">{formatPrice(monthlyTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Résumé quotidien</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {dailySummary.map((day) => (
                <div key={day.date} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{day.date}</p>
                    <p className="text-xs text-muted-foreground">{day.courses} courses</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    {formatPrice(day.earnings)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer les gains</DialogTitle>
            <DialogDescription>
              Choisissez votre mode de retrait
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              variant="outline"
              className="w-full h-14 justify-start text-left"
              onClick={() => {
                toast.success('Demande de retrait envoyée');
                setShowWithdrawDialog(false);
              }}
            >
              <CreditCard className="mr-3 h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold text-sm">Mobile Money</p>
                <p className="text-xs text-muted-foreground">Orange Money / MTN MoMo</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 justify-start text-left"
              onClick={() => {
                toast.success('Demande de retrait envoyée');
                setShowWithdrawDialog(false);
              }}
            >
              <CreditCard className="mr-3 h-5 w-5 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Virement bancaire</p>
                <p className="text-xs text-muted-foreground">BNDA / BIM-SA</p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowWithdrawDialog(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

// ─── Ratings View ─────────────────────────────────────────────────────────────

function RatingsView() {
  const { navigate } = useDriverNav();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('home')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Notes et avis</h1>
            <p className="text-sm text-muted-foreground">{MOCK_RATINGS.total} évaluations</p>
          </div>
        </div>

        {/* Average Rating */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <motion.p
                  className="text-5xl font-bold text-emerald-600"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {MOCK_RATINGS.average}
                </motion.p>
                <div className="flex gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(MOCK_RATINGS.average)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {MOCK_RATINGS.distribution.map((d) => (
                  <div key={d.stars} className="flex items-center gap-2">
                    <span className="text-xs w-3 text-right">{d.stars}</span>
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${d.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * d.stars }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <div>
          <h2 className="text-base font-bold px-1">Avis récents</h2>
          <div className="mt-3 space-y-2.5">
            {MOCK_RATINGS.reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                            {review.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{review.name}</p>
                          <p className="text-[10px] text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= review.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView() {
  const { navigate } = useDriverNav();
  const { logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);

  const menuItems = [
    { icon: FileText, label: 'Documents', view: 'documents' as const, color: 'text-blue-600 bg-blue-50' },
    { icon: Wallet, label: 'Portefeuille', view: 'wallet' as const, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Bell, label: 'Notifications', view: 'notifications' as const, color: 'text-amber-600 bg-amber-50' },
    { icon: Headphones, label: 'Support', view: 'support' as const, color: 'text-purple-600 bg-purple-50' },
    { icon: Star, label: 'Notes et avis', view: 'ratings' as const, color: 'text-amber-500 bg-amber-50' },
    { icon: MessageCircle, label: 'Messages', view: 'chat' as const, color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Profile Header */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 h-24" />
          <CardContent className="p-4 pt-0 -mt-10">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                  MK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-1">
                <h1 className="text-lg font-bold">Mamadou Konaté</h1>
                <p className="text-sm text-muted-foreground">+223 76 12 34 56</p>
              </div>
            </div>

            {/* Online Toggle */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
              <div>
                <p className="text-sm font-medium">Statut en ligne</p>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'Vous recevez des courses' : 'Vous ne recevez pas de courses'}
                </p>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={(checked) => {
                  setIsOnline(checked);
                  toast.success(checked ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-600" />
              Véhicule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-semibold">Moto</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modèle</p>
                <p className="text-sm font-semibold">Honda PCX 150</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Immatriculation</p>
                <p className="text-sm font-semibold">AK-0452-BM</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Couleur</p>
                <p className="text-sm font-semibold">Noire</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                className="text-center"
                onClick={() => navigate('history')}
              >
                <p className="text-xl font-bold">87</p>
                <p className="text-[10px] text-muted-foreground">Ce mois</p>
              </button>
              <button
                className="text-center"
                onClick={() => navigate('earnings')}
              >
                <p className="text-xl font-bold text-emerald-600">312k</p>
                <p className="text-[10px] text-muted-foreground">FCFA</p>
              </button>
              <button
                className="text-center"
                onClick={() => navigate('ratings')}
              >
                <p className="text-xl font-bold flex items-center justify-center gap-0.5">
                  4.7 <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                </p>
                <p className="text-[10px] text-muted-foreground">Note</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Menu */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-2">
            {menuItems.map((item) => (
              <button
                key={item.view}
                className="flex w-full items-center gap-3 rounded-xl p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => navigate(item.view)}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}

            <Separator className="my-2" />

            <button
              className="flex w-full items-center gap-3 rounded-xl p-3.5 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => {
                logout();
                toast.success('Déconnexion réussie');
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-red-600">Déconnexion</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ─── Documents View ───────────────────────────────────────────────────────────

function DocumentsView() {
  const { navigate } = useDriverNav();

  const handleUpload = (docName: string) => {
    toast.success(`${docName} - Téléchargement en cours...`);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground">Vérification de votre profil</p>
          </div>
        </div>

        {/* Verification Status */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Vérification en cours</p>
                <p className="text-xs text-muted-foreground">
                  3/4 documents vérifiés
                </p>
                <Progress value={75} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <div className="space-y-2.5">
          {MOCK_DOCUMENTS.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${
                          doc.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {doc.status === 'verified' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        doc.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }
                    >
                      {doc.status === 'verified' ? 'Vérifié' : 'En attente'}
                    </Badge>
                  </div>

                  {doc.status === 'pending' && (
                    <Button
                      variant="outline"
                      className="w-full mt-3 h-11 border-dashed border-2 text-sm font-medium"
                      onClick={() => handleUpload(doc.name)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Téléverser le document
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Wallet View ──────────────────────────────────────────────────────────────

function WalletView() {
  const { navigate } = useDriverNav();
  const [amount, setAmount] = useState('');

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Portefeuille</h1>
            <p className="text-sm text-muted-foreground">Gérez vos fonds</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white">
            <p className="text-sm text-emerald-200">Solde disponible</p>
            <p className="text-4xl font-bold mt-1">{formatPrice(MOCK_WALLET.balance)}</p>
          </div>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Ajouter des fonds</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Montant"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12"
                />
                <Button
                  className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  onClick={() => {
                    if (amount && Number(amount) > 0) {
                      toast.success(`Dépôt de ${formatPrice(Number(amount))} effectué`);
                      setAmount('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 justify-start"
            onClick={() => toast.info('Retrait en cours de traitement...')}
          >
            <ArrowUpRight className="mr-2 h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">Retirer</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 justify-start"
            onClick={() => toast.info('Envoi en cours...')}
          >
            <Send className="mr-2 h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Envoyer</span>
          </Button>
        </div>

        {/* Transaction History */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-0">
              {MOCK_WALLET.transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 py-3 ${
                    idx < MOCK_WALLET.transactions.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-800'
                      : ''
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      tx.type === 'credit'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p
                    className={`text-sm font-bold ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : ''}{formatPrice(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ─── Support View ─────────────────────────────────────────────────────────────

function SupportView() {
  const { navigate } = useDriverNav();

  const handleSendMessage = () => {
    toast.success('Message envoyé au support');
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Support</h1>
            <p className="text-sm text-muted-foreground">Besoin d&apos;aide ?</p>
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Headphones className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
            <h3 className="font-bold">Comment pouvons-nous vous aider ?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Notre équipe est disponible 7j/7 de 6h à 22h
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2.5">
          {[
            { title: 'Problème avec une course', desc: 'Retard, annulation, litige' },
            { title: 'Problème de paiement', desc: 'Retard de paiement, montant incorrect' },
            { title: 'Problème technique', desc: 'Bug, erreur, application' },
            { title: 'Autre demande', desc: 'Question générale, suggestion' },
          ].map((item) => (
            <Card key={item.title} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={handleSendMessage}>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Contact direct</p>
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => toast.info('Appel en cours...')}
            >
              <Phone className="mr-2 h-5 w-5" />
              Appeler le support
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => navigate('chat')}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Envoyer un message
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ─── Notifications View ───────────────────────────────────────────────────────

function NotificationsView() {
  const { navigate } = useDriverNav();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {MOCK_NOTIFICATIONS.filter((n) => !n.read).length} non lues
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {MOCK_NOTIFICATIONS.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={`border-0 shadow-sm ${
                  !notif.read ? 'border-l-4 border-l-emerald-500' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {!notif.read && (
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2">{notif.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView() {
  const { navigate } = useDriverNav();
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigate('profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
            SR
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Support Rapigo</p>
          <p className="text-[10px] text-emerald-600">En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3 max-w-lg mx-auto">
          {CHAT_MESSAGES.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.sender === 'me'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.sender === 'me' ? 'text-emerald-200' : 'text-muted-foreground'
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Input
            placeholder="Écrire un message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-12 rounded-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && message.trim()) {
                toast.success('Message envoyé');
                setMessage('');
              }
            }}
          />
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0"
            onClick={() => {
              if (message.trim()) {
                toast.success('Message envoyé');
                setMessage('');
              }
            }}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

type TabKey = 'home' | 'ride' | 'history' | 'profile';

function BottomTabBar({ activeTab, onTabChange }: { activeTab: TabKey; onTabChange: (tab: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'Accueil', icon: Home },
    { key: 'ride', label: 'Courses', icon: Package },
    { key: 'history', label: 'Historique', icon: Clock },
    { key: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="flex items-center justify-around border-t bg-white dark:bg-gray-950 px-2 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            className="flex flex-col items-center gap-0.5 py-2.5 px-4 min-w-[64px] transition-colors"
            onClick={() => onTabChange(tab.key)}
            aria-label={tab.label}
          >
            <div className="relative">
              <Icon
                className={`h-6 w-6 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                }`}
              />
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main DriverApp Component ─────────────────────────────────────────────────

const TAB_VIEWS: Record<TabKey, string> = {
  home: 'home',
  ride: 'ride',
  history: 'history',
  profile: 'profile',
};

export default function DriverApp() {
  const { view, navigate } = useDriverNav();

  const activeTab: TabKey = (() => {
    if (view === 'home' || view === 'navigation') return 'home';
    if (view === 'ride') return 'ride';
    if (view === 'history' || view === 'earnings' || view === 'ratings') return 'history';
    return 'profile';
  })();

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      navigate(TAB_VIEWS[tab] as Parameters<typeof navigate>[0]);
    },
    [navigate]
  );

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomeView />;
      case 'ride':
        return <RideView />;
      case 'navigation':
        return <NavigationView />;
      case 'history':
        return <HistoryView />;
      case 'earnings':
        return <EarningsView />;
      case 'ratings':
        return <RatingsView />;
      case 'profile':
        return <ProfileView />;
      case 'documents':
        return <DocumentsView />;
      case 'wallet':
        return <WalletView />;
      case 'support':
        return <SupportView />;
      case 'notifications':
        return <NotificationsView />;
      case 'chat':
        return <ChatView />;
      default:
        return <HomeView />;
    }
  };

  const showBottomBar = !['ride', 'navigation', 'chat'].includes(view);

  return (
    <div className="flex h-full max-w-md mx-auto flex-col bg-white dark:bg-gray-950">
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showBottomBar && <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
}