'use client';

import React, { lazy, Suspense, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Sun, Moon, Truck, Store, User,
  ArrowRight, MapPin, Clock, Star, Smartphone,
  Package, Pill, ShoppingBag, Zap, Users,
  Eye, EyeOff, Mail, Phone, Lock, UserPlus, Loader2,
  ChevronRight, UtensilsCrossed, Laptop, Bike, Car,
  Shield, CreditCard, Leaf, CheckCircle2, Search, ClipboardList,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { useAuthStore, useSpaceStore, AppSpace, apiFetch, AuthUser } from '@/lib/store';
import { SUPPORT_INFO } from '@/components/support-contact';

// ============================================
// Lazy-loaded space components
// ============================================
const AdminApp = lazy(() => import('@/components/admin/admin-app'));
const ClientApp = lazy(() => import('@/components/client/client-app'));
const MerchantApp = lazy(() => import('@/components/merchant/merchant-app'));
const DriverApp = lazy(() => import('@/components/driver/driver-app'));

class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: Error | null}> {
  constructor(props: {children: React.ReactNode}) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
            <p className="text-sm text-muted-foreground mb-4">{this.state.error?.message || 'Une erreur inattendue est survenue.'}</p>
            <Button variant="outline" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
              Réessayer
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// Space loading fallback
// ============================================
function SpaceLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/25 animate-pulse">
          <Truck className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Chargement de votre espace…</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Page() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, token, login, logout } = useAuthStore();
  const { currentSpace, setSpace } = useSpaceStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Only show init loader if there's a stored token to verify
  const initializing = !!token && !isAuthenticated;

  // Derive effective space from auth state
  const effectiveSpace: AppSpace = isAuthenticated && user
    ? (user.role === 'ADMIN'
        ? currentSpace
        : ({ CLIENT: 'client' as const, MERCHANT: 'merchant' as const, DRIVER: 'driver' as const, ADMIN: 'admin' as const }[user.role] || 'landing'))
    : currentSpace;

  // Check session on mount when token exists
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await apiFetch<AuthUser>('/api/auth/me');
      if (cancelled) return;
      if (error || !data) {
        logout();
      } else {
        login(data, token);
        const spaceMap: Record<string, AppSpace> = {
          CLIENT: 'client',
          MERCHANT: 'merchant',
          DRIVER: 'driver',
          ADMIN: 'admin',
        };
        setSpace(spaceMap[data.role] || 'landing');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-switch space on login
  useEffect(() => {
    if (isAuthenticated && user) {
      const spaceMap: Record<string, AppSpace> = {
        CLIENT: 'client',
        MERCHANT: 'merchant',
        DRIVER: 'driver',
        ADMIN: 'admin',
      };
      setSpace(spaceMap[user.role] || 'landing');
    }
  }, [isAuthenticated, user?.id, setSpace]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const { data, error } = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (error) {
      toast.error(error);
      return false;
    }
    if (data) {
      login(data.user, data.token);
      const spaceMap: Record<string, AppSpace> = {
        CLIENT: 'client',
        MERCHANT: 'merchant',
        DRIVER: 'driver',
        ADMIN: 'admin',
      };
      setSpace(spaceMap[data.user.role] || 'landing');
      toast.success(`Bienvenue ${data.user.firstName} !`);
      return true;
    }
    return false;
  }, [login, setSpace]);

  const handleRegister = useCallback(async (formData: Record<string, string>) => {
    const { data, error } = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (error) {
      toast.error(error);
      return false;
    }
    if (data) {
      login(data.user, data.token);
      const spaceMap: Record<string, AppSpace> = {
        CLIENT: 'client',
        MERCHANT: 'merchant',
        DRIVER: 'driver',
        ADMIN: 'admin',
      };
      setSpace(spaceMap[data.user.role] || 'landing');
      toast.success('Compte créé avec succès ! Bienvenue sur Rapigo.');
      return true;
    }
    return false;
  }, [login, setSpace]);

  const handleLogout = useCallback(() => {
    logout();
    setSpace('landing');
    toast.success('Vous avez été déconnecté.');
  }, [logout, setSpace]);

  // Initialization screen
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  // Authenticated space view
  if (isAuthenticated && user && effectiveSpace !== 'landing') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={effectiveSpace}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <AppErrorBoundary>
              <Suspense fallback={<SpaceLoader />}>
                {effectiveSpace === 'admin' && <AdminApp />}
                {effectiveSpace === 'client' && <ClientApp />}
                {effectiveSpace === 'merchant' && <MerchantApp />}
                {effectiveSpace === 'driver' && <DriverApp />}
              </Suspense>
              </AppErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ============================================
  // LANDING PAGE
  // ============================================
  return (
    <div className="min-h-screen flex flex-col bg-background" suppressHydrationWarning>
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Rapigo</span>
              <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                V2.2
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-full"
                  aria-label="Changer le thème"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
              <Button
                onClick={() => { setAuthTab('login'); setShowAuth(true); }}
                className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Connexion
              </Button>
              <Button
                variant="outline"
                onClick={() => { setAuthTab('register'); setShowAuth(true); }}
                className="rounded-full px-5 hidden sm:flex border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                Inscription
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-transparent to-amber-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-amber-950/10" />
        <div className="absolute top-20 -right-32 w-[500px] h-[500px] bg-emerald-400/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              La super-app de livraison N°1 au Mali
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Tout livré
              <span className="gradient-text"> chez vous</span>
              <br />
              en quelques minutes
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Restaurants, supermarchés, pharmacies, boutiques et colis — Rapigo vous connecte aux meilleurs commerçants de Bamako pour une livraison rapide et en toute sécurité.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-13 text-base font-semibold shadow-lg shadow-emerald-600/25 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setAuthTab('register'); setShowAuth(true); }}
              >
                Commander maintenant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-13 text-base border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={() => { setAuthTab('register'); setShowAuth(true); }}
              >
                <Truck className="w-4 h-4 mr-2" />
                Devenir livreur
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Pourquoi Rapigo ?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Une expérience de livraison pensée pour le Mali, avec des solutions de paiement locales et un service client réactif.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Clock, title: 'Livraison rapide', desc: 'En moyenne 30 minutes pour vos commandes alimentaires à Bamako' },
                { icon: Smartphone, title: 'Commande facile', desc: 'Interface intuitive pour passer vos commandes en quelques clics' },
                { icon: CreditCard, title: 'Paiement mobile', desc: 'Orange Money, Moov Money, Wave, espèces et portefeuille' },
                { icon: MapPin, title: 'Suivi en temps réel', desc: 'Suivez votre livreur en direct sur la carte GPS' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feat.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-semibold mb-2">{feat.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Comment ça marche ?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Commandez en 3 étapes simples et recevez votre livraison en un rien de temps.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  step: '01',
                  icon: Search,
                  title: 'Parcourez les commerces',
                  desc: 'Explorez les restaurants, supermarchés, pharmacies et boutiques disponibles près de chez vous.',
                  color: 'from-emerald-500 to-emerald-600',
                },
                {
                  step: '02',
                  icon: ClipboardList,
                  title: 'Passez votre commande',
                  desc: 'Ajoutez vos articles au panier, choisissez votre adresse et votre mode de paiement préféré.',
                  color: 'from-amber-500 to-orange-500',
                },
                {
                  step: '03',
                  icon: CheckCircle2,
                  title: 'Recevez votre livraison',
                  desc: 'Un livreur vous est assigné et vous pouvez suivre votre commande en temps réel jusqu\'à la réception.',
                  color: 'from-teal-500 to-green-500',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="relative"
                >
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-border to-border/30" />
                  )}
                  <Card className="relative h-full text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
                    <CardContent className="pt-8 pb-6 px-6">
                      <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-2 block">
                        Étape {item.step}
                      </span>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Business Categories ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Que souhaitez-vous ?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Explorez nos catégories et trouvez exactement ce dont vous avez besoin.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { icon: UtensilsCrossed, label: 'Restaurants', desc: 'Plats délicieux', gradient: 'from-orange-500 to-red-500' },
                { icon: ShoppingBag, label: 'Supermarchés', desc: 'Courses quotidiennes', gradient: 'from-emerald-500 to-green-600' },
                { icon: Pill, label: 'Pharmacies', desc: 'Santé & bien-être', gradient: 'from-teal-500 to-cyan-500' },
                { icon: Laptop, label: 'Électronique', desc: 'High-tech & gadgets', gradient: 'from-violet-500 to-purple-500' },
                { icon: Package, label: 'Colis', desc: 'Envois & retraits', gradient: 'from-amber-500 to-yellow-500' },
              ].map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden cursor-pointer"
                    onClick={() => { setAuthTab('register'); setShowAuth(true); }}
                  >
                    <CardContent className="p-5 text-center">
                      <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <cat.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust / Stats Section ── */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Utilisateurs actifs', value: '10 000+' },
              { icon: Store, label: 'Commerçants partenaires', value: '500+' },
              { icon: Truck, label: 'Livreurs actifs', value: '300+' },
              { icon: Star, label: 'Note moyenne', value: '4.8/5' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="text-center border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-900">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <CardContent className="relative p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Prêt à simplifier vos livraisons ?
                </h2>
                <p className="text-emerald-100 max-w-xl mx-auto mb-8 leading-relaxed">
                  Rejoignez des milliers de Maliens qui font confiance à Rapigo pour leurs livraisons quotidiennes. Inscription gratuite, livraison rapide.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    className="rounded-full px-8 h-12 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg"
                    onClick={() => { setAuthTab('register'); setShowAuth(true); }}
                  >
                    Créer un compte gratuit <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 h-12 border-white/30 text-white hover:bg-white/10 bg-transparent"
                    onClick={() => { setAuthTab('login'); setShowAuth(true); }}
                  >
                    Se connecter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t bg-card/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold gradient-text">Rapigo Mali</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La super-app de livraison N°1 au Mali. Restaurants, supermarchés, pharmacies et plus encore, livrés chez vous en quelques minutes.
              </p>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Assistance &amp; Contact</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Développeur :</strong> {SUPPORT_INFO.developer}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{SUPPORT_INFO.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{SUPPORT_INFO.email}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => window.open(`tel:${SUPPORT_INFO.phoneRaw}`)}
                >
                  <Phone className="h-3 w-3 mr-1" /> Appeler
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${SUPPORT_INFO.whatsapp}?text=${encodeURIComponent('Bonjour Mr. Diarra Moussa, je vous contacte depuis Rapigo Mali.')}`,
                      '_blank'
                    )
                  }
                >
                  <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() =>
                    window.open(`mailto:${SUPPORT_INFO.email}?subject=${encodeURIComponent('Assistance Rapigo Mali')}`)
                  }
                >
                  <Mail className="h-3 w-3 mr-1" /> Envoyer un e-mail
                </Button>
              </div>
            </div>

            {/* Trust */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Confiance</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5" /> Éco-responsable</p>
                <p className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Paiements sécurisés</p>
                <p className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Livraison rapide</p>
              </div>
            </div>
          </div>
          <Separator className="mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Rapigo Mali. Tous droits réservés. Développé par {SUPPORT_INFO.developer} — {SUPPORT_INFO.phone}
          </p>
        </div>
      </footer>

      {/* ── Auth Dialog ── */}
      <AuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        defaultTab={authTab}
        onTabChange={setAuthTab}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}

  /* TopBar removed - each space component has its own header */

// ============================================
// AUTH DIALOG
// ============================================
function AuthDialog({
  open,
  onOpenChange,
  defaultTab,
  onTabChange,
  onLogin,
  onRegister,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab: 'login' | 'register';
  onTabChange: (t: 'login' | 'register') => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (data: Record<string, string>) => Promise<boolean>;
}) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [regError, setRegError] = useState('');
  const [regRole, setRegRole] = useState<'CLIENT' | 'MERCHANT' | 'DRIVER'>('CLIENT');
  const [vehicleType, setVehicleType] = useState('MOTO');

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    const fd = new FormData(e.currentTarget);
    const email = (fd.get('email') as string)?.trim();
    const password = fd.get('password') as string;

    if (!email || !email.includes('@')) {
      setLoginError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (!password || password.length < 6) {
      setLoginError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const ok = await onLogin(email, password);
    setLoading(false);
    if (ok) onOpenChange(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegError('');
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (typeof v === 'string') data[k] = v.trim();
    });

    if (!data.firstName || data.firstName.length < 2) {
      setRegError('Le prénom est requis (min. 2 caractères).');
      return;
    }
    if (!data.lastName || data.lastName.length < 2) {
      setRegError('Le nom est requis (min. 2 caractères).');
      return;
    }
    if (!data.email || !data.email.includes('@')) {
      setRegError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (!data.phone || data.phone.length < 8) {
      setRegError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }
    if (!data.password || data.password.length < 6) {
      setRegError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    data.role = regRole;

    if (regRole === 'MERCHANT') {
      if (!data.businessName || data.businessName.length < 2) {
        setRegError('Le nom de votre commerce est requis.');
        return;
      }
    }

    if (regRole === 'DRIVER') {
      data.vehicleType = vehicleType;
    }

    setLoading(true);
    const ok = await onRegister(data);
    setLoading(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl gradient-text">Rapigo Mali</DialogTitle>
          <DialogDescription>La livraison rapide à Bamako</DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={defaultTab}
          onValueChange={(v) => {
            onTabChange(v as 'login' | 'register');
            setLoginError('');
            setRegError('');
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>

          {/* ── Login Tab ── */}
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2.5 border border-destructive/20">
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
              </Button>
            </form>
          </TabsContent>

          {/* ── Register Tab ── */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2.5 border border-destructive/20">
                  {regError}
                </div>
              )}

              {/* Role selection tabs */}
              <div className="space-y-1.5">
                <Label>Je suis</Label>
                <Tabs
                  value={regRole}
                  onValueChange={(v) => {
                    setRegRole(v as 'CLIENT' | 'MERCHANT' | 'DRIVER');
                    setRegError('');
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="CLIENT" className="text-xs py-2 gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Client
                    </TabsTrigger>
                    <TabsTrigger value="MERCHANT" className="text-xs py-2 gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      Commerçant
                    </TabsTrigger>
                    <TabsTrigger value="DRIVER" className="text-xs py-2 gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      Livreur
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Common fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first">Prénom</Label>
                  <Input id="reg-first" name="firstName" placeholder="Prénom" autoComplete="given-name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last">Nom</Label>
                  <Input id="reg-last" name="lastName" placeholder="Nom" autoComplete="family-name" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-email" name="email" type="email" placeholder="votre@email.com" className="pl-10" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-phone" name="phone" type="tel" placeholder="+223 7X XX XX XX" className="pl-10" autoComplete="tel" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-password"
                    name="password"
                    type={showRegPass ? 'text' : 'password'}
                    placeholder="Min. 6 caractères"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showRegPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* MERCHANT-only fields */}
              {regRole === 'MERCHANT' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-business">Nom du commerce</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="reg-business"
                        name="businessName"
                        placeholder="Ex: Restaurant Le Baobab"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Le nom qui apparaîtra pour vos clients sur l&apos;application.</p>
                  </div>
                </motion.div>
              )}

              {/* DRIVER-only fields */}
              {regRole === 'DRIVER' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-1.5">
                    <Label>Type de véhicule</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir un véhicule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MOTO">
                          <span className="flex items-center gap-2">
                            <Bike className="w-3.5 h-3.5" />
                            Moto
                          </span>
                        </SelectItem>
                        <SelectItem value="VELO">
                          <span className="flex items-center gap-2">
                            <Bike className="w-3.5 h-3.5" />
                            Vélo
                          </span>
                        </SelectItem>
                        <SelectItem value="AUTO">
                          <span className="flex items-center gap-2">
                            <Car className="w-3.5 h-3.5" />
                            Voiture
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Votre moyen de transport pour les livraisons.</p>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Créer mon compte
                  </>
                )}
              </Button>

              {regRole === 'MERCHANT' && (
                <p className="text-xs text-center text-muted-foreground">
                  En créant un compte commerçant, vous pourrez gérer vos produits, vos commandes et suivre vos revenus.
                </p>
              )}
              {regRole === 'DRIVER' && (
                <p className="text-xs text-center text-muted-foreground">
                  Devenez livreur Rapigo et gagnez de l&apos;argent en livrant des commandes à Bamako.
                </p>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}