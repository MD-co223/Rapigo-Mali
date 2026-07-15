'use client';

import React, { lazy, Suspense, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Sun, Moon, LogOut, Truck, Store, User, ShieldCheck,
  ArrowRight, MapPin, Clock, Star, Smartphone, Wallet,
  Package, Pill, ShoppingBag, Zap, Users,
  Eye, EyeOff, Mail, Phone, Lock, UserPlus, Loader2,
  Download, ChevronRight, UtensilsCrossed, Laptop,
  Shield, Headphones, CreditCard, Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthStore, useSpaceStore, AppSpace, apiFetch, AuthUser } from '@/lib/store';

// ============================================
// Lazy-loaded space components
// ============================================
const AdminApp = lazy(() => import('@/components/admin/admin-app'));
const ClientApp = lazy(() => import('@/components/client/client-app'));
const MerchantApp = lazy(() => import('@/components/merchant/merchant-app'));
const DriverApp = lazy(() => import('@/components/driver/driver-app'));

// ============================================
// Space loading fallback
// ============================================
function SpaceLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
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
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  // Only show init loader if there's a stored token to verify
  const initializing = !!token && !isAuthenticated;

  // Derive effective space from auth state
  const effectiveSpace = isAuthenticated && user
    ? (user.role === 'ADMIN'
        ? currentSpace
        : ({ CLIENT: 'client' as const, MERCHANT: 'merchant' as const, DRIVER: 'driver' as const, ADMIN: 'admin' as const })[user.role] || 'landing')
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
          CLIENT: 'client', MERCHANT: 'merchant', DRIVER: 'driver', ADMIN: 'admin',
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
        CLIENT: 'client', MERCHANT: 'merchant', DRIVER: 'driver', ADMIN: 'admin',
      };
      setSpace(spaceMap[user.role] || 'landing');
    }
  }, [isAuthenticated, user?.id, setSpace]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const { data, error } = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (error) { toast.error(error); return false; }
    if (data) {
      login(data.user, data.token);
      toast.success(`Bienvenue ${data.user.firstName} !`);
      return true;
    }
    return false;
  }, [login]);

  const handleRegister = useCallback(async (formData: Record<string, string>) => {
    const { data, error } = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (error) { toast.error(error); return false; }
    if (data) {
      login(data.user, data.token);
      toast.success('Compte créé avec succès !');
      return true;
    }
    return false;
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
    setSpace('landing');
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
        </div>
      </div>
    );
  }

  // Authenticated space view
  if (isAuthenticated && user && effectiveSpace !== 'landing') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar user={user} onLogout={handleLogout} />
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
              <Suspense fallback={<SpaceLoader />}>
                {effectiveSpace === 'admin' && <AdminApp />}
                {effectiveSpace === 'client' && <ClientApp />}
                {effectiveSpace === 'merchant' && <MerchantApp />}
                {effectiveSpace === 'driver' && <DriverApp />}
              </Suspense>
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
                V2.0
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {mounted && (
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
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
              La livraison N°1 au Mali
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Tout livré
              <span className="gradient-text"> chez vous</span>
              <br />
              en quelques minutes
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Restaurants, supermarchés, pharmacies, boutiques et colis — Rapigo vous livre tout à Bamako, rapidement et en toute sécurité.
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
              <p className="text-muted-foreground max-w-xl mx-auto">Une expérience de livraison pensée pour le Mali, avec des solutions de paiement locales.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Clock, title: 'Livraison rapide', desc: 'En moyenne 30 minutes pour vos commandes alimentaires' },
                { icon: Smartphone, title: 'Commande en ligne', desc: 'Interface simple pour passer vos commandes en quelques clics' },
                { icon: CreditCard, title: 'Paiement mobile', desc: 'Orange Money, Moov Money, Wave, espèces et portefeuille' },
                { icon: MapPin, title: 'Suivi GPS', desc: 'Suivez votre livreur en temps réel sur la carte' },
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

      {/* ── Business Types ── */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Que souhaitez-vous ?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Explorez nos catégories et trouvez ce dont vous avez besoin.</p>
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
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
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
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Utilisateurs actifs', value: '10 000+' },
              { icon: Store, label: 'Commerçants', value: '500+' },
              { icon: Truck, label: 'Livreurs', value: '300+' },
              { icon: Star, label: 'Note moyenne', value: '4.8/5' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="text-center border-border/50">
                  <CardContent className="p-6">
                    <stat.icon className="w-7 h-7 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-2xl sm:text-3xl font-extrabold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Download Section ── */}
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
                  Rejoignez des milliers de Maliens qui font confiance à Rapigo pour leurs livraisons quotidiennes.
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">Rapigo Mali</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Leaf className="w-3.5 h-3.5" /> Éco-responsable</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Paiements sécurisés</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Rapigo Mali. Tous droits réservés.
            </p>
          </div>
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

// ============================================
// TOP BAR (authenticated)
// ============================================
function TopBar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { theme, setTheme } = useTheme();
  const { currentSpace, setSpace } = useSpaceStore();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const spaceItems: { space: AppSpace; label: string; icon: React.ElementType; roles: string[] }[] = [
    { space: 'client', label: 'Client', icon: User, roles: ['CLIENT', 'ADMIN'] },
    { space: 'merchant', label: 'Commerçant', icon: Store, roles: ['MERCHANT', 'ADMIN'] },
    { space: 'driver', label: 'Livreur', icon: Truck, roles: ['DRIVER', 'ADMIN'] },
    { space: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  const visibleSpaces = spaceItems.filter((s) => s.roles.includes(user.role));

  return (
    <header className="shrink-0 glass-strong border-b">
      <div className="flex items-center justify-between h-14 px-4 max-w-full">
        <div className="flex items-center gap-3">
          <button onClick={() => { onLogout(); }} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">Rapigo</span>
          </button>
          {visibleSpaces.length > 1 && (
            <div className="flex items-center bg-muted/80 rounded-lg p-0.5 gap-0.5">
              {visibleSpaces.map((s) => (
                <button
                  key={s.space}
                  onClick={() => setSpace(s.space)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    currentSpace === s.space
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full h-8 w-8">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <span className="text-sm font-medium hidden md:inline">{user.firstName}</span>
            <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================
// AUTH DIALOG
// ============================================
function AuthDialog({
  open, onOpenChange, defaultTab, onTabChange, onLogin, onRegister,
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
  const [regRole, setRegRole] = useState('CLIENT');

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    const fd = new FormData(e.currentTarget);
    const email = (fd.get('email') as string)?.trim();
    const password = fd.get('password') as string;

    if (!email || !email.includes('@')) { setLoginError('Veuillez entrer un email valide.'); return; }
    if (!password || password.length < 6) { setLoginError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

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
    fd.forEach((v, k) => { if (typeof v === 'string') data[k] = v.trim(); });

    if (!data.firstName || data.firstName.length < 2) { setRegError('Le prénom est requis (min. 2 caractères).'); return; }
    if (!data.lastName || data.lastName.length < 2) { setRegError('Le nom est requis (min. 2 caractères).'); return; }
    if (!data.email || !data.email.includes('@')) { setRegError('Veuillez entrer un email valide.'); return; }
    if (!data.phone || data.phone.length < 8) { setRegError('Veuillez entrer un numéro de téléphone valide.'); return; }
    if (!data.password || data.password.length < 6) { setRegError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

    data.role = regRole;

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
          onValueChange={(v) => { onTabChange(v as 'login' | 'register'); setLoginError(''); setRegError(''); }}
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
                  <Input id="login-email" name="email" type="email" placeholder="votre@email.com" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="login-password" name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
              </Button>
            </form>
          </TabsContent>

          {/* ── Register Tab ── */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {regError && (
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2.5 border border-destructive/20">
                  {regError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first">Prénom</Label>
                  <Input id="reg-first" name="firstName" placeholder="Prénom" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last">Nom</Label>
                  <Input id="reg-last" name="lastName" placeholder="Nom" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" name="email" type="email" placeholder="votre@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-phone" name="phone" type="tel" placeholder="+223 7X XX XX XX" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-password" name="password" type={showRegPass ? 'text' : 'password'} placeholder="Min. 6 caractères" className="pl-10 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Je suis</Label>
                <Select value={regRole} onValueChange={setRegRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">
                      <span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Un client</span>
                    </SelectItem>
                    <SelectItem value="MERCHANT">
                      <span className="flex items-center gap-2"><Store className="w-3.5 h-3.5" /> Un commerçant</span>
                    </SelectItem>
                    <SelectItem value="DRIVER">
                      <span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Un livreur</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><UserPlus className="w-4 h-4 mr-2" />Créer mon compte</>
                }
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}