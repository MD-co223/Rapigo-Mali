'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, ShoppingBag, Store, Smartphone, Shield, Zap, Star,
  ChevronRight, Menu, X, UtensilsCrossed, Pill, ShoppingCart,
  Package, Shirt, Sparkles, ArrowRight, Phone, Mail, MessageCircle,
  MapPin, Eye, EyeOff, CheckCircle2, Clock, Users, TrendingUp, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore, useSpaceStore, apiFetch, type AuthUser } from '@/lib/store';
import { SupportContact } from '@/components/support-contact';
import { RapigoLogo } from '@/components/rapigo-logo';
import { toast } from 'sonner';

const ClientApp = lazy(() => import('@/components/client/client-app'));
const MerchantApp = lazy(() => import('@/components/merchant/merchant-app'));
const DriverApp = lazy(() => import('@/components/driver/driver-app'));
const AdminApp = lazy(() => import('@/components/admin/admin-app'));

const EASE_OUT = [0, 0, 0.2, 1] as const;

function LoadingSpace() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <RapigoLogo variant="vertical" height={56} priority />
      <div className="animate-spin h-6 w-6 border-3 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );
}

// =============================================
// CONSTANTES
// =============================================

const BUSINESS_TYPES = [
  { icon: UtensilsCrossed, label: 'Restaurants', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { icon: ShoppingCart, label: 'Supermarchés', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { icon: Pill, label: 'Pharmacies', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { icon: ShoppingBag, label: 'Boutiques', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { icon: Smartphone, label: 'Électronique', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { icon: Shirt, label: 'Mode', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  { icon: Sparkles, label: 'Beauté', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  { icon: Package, label: 'Colis', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
];

const FEATURES = [
  { icon: Zap, title: 'Livraison Rapide', desc: 'Livraison en moyenne 30 minutes dans tout Bamako et environs.' },
  { icon: Smartphone, title: 'Paiement Mobile', desc: 'Orange Money, Wave, Moov Money — payez simplement depuis votre téléphone.' },
  { icon: TrendingUp, title: 'Suivi en Temps Réel', desc: 'Suivez votre livreur en direct sur la carte jusqu\'à la livraison.' },
  { icon: Shield, title: 'Support 24/7', desc: 'Notre équipe est disponible 24h/24 et 7j/7 pour vous aider.' },
];

// =============================================
// PAGE EN ATTENTE DE VALIDATION
// =============================================

function WaitingApproval({ role }: { role: 'MERCHANT' | 'DRIVER' }) {
  const { logout } = useAuthStore();
  const { setSpace } = useSpaceStore();
  const roleLabel = role === 'MERCHANT' ? 'commerçant' : 'livreur';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="mx-auto w-32">
          <RapigoLogo variant="vertical" height={64} className="mx-auto" priority />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Compte en attente</h1>
          <p className="text-muted-foreground">
            Votre compte {roleLabel} est en cours de vérification par notre équipe.
            Vous recevrez une notification dès que votre compte sera activé.
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-medium">Besoin d&apos;aide ?</p>
          <p className="text-muted-foreground">
            Contactez Mr. Diarra Moussa pour accélérer la validation.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <a href="tel:+22377163862" className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:underline font-medium">
              <Phone className="h-4 w-4" /> +223 77 16 38 62
            </a>
            <a href="https://wa.me/22377163862" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:underline font-medium">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href="mailto:diarramoussaka7@gmail.com" className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:underline font-medium">
              <Mail className="h-4 w-4" /> diarramoussaka7@gmail.com
            </a>
          </div>
        </div>
        <Button variant="outline" onClick={() => { logout(); setSpace('landing'); }} className="mt-4">
          <LogOut className="h-4 w-4 mr-2" /> Déconnexion
        </Button>
      </motion.div>
    </div>
  );
}

// =============================================
// PAGE PRINCIPALE RAPIGO MALI V2.5
// =============================================

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { currentSpace, setSpace } = useSpaceStore();

  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isApproved, setIsApproved] = useState(true);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('CLIENT');

  // Restauration de session et routage vers l'espace
  useEffect(() => {
    if (isAuthenticated && user) {
      const spaceMap: Record<string, 'client' | 'merchant' | 'driver' | 'admin'> = {
        CLIENT: 'client', MERCHANT: 'merchant', DRIVER: 'driver',
        ADMIN: 'admin', SUPER_ADMIN: 'admin',
      };
      setSpace(spaceMap[user.role] || 'client');
    }
  }, [isAuthenticated, user, setSpace]);

  const handleLogin = useCallback(async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    const { data, error } = await apiFetch<{ user: AuthUser; token: string; merchant?: { isApproved: boolean }; driver?: { isApproved: boolean } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    setLoading(false);
    if (error) { toast.error(error); return; }
    if (data) {
      login(data.user, data.token);
      const approved = data.merchant
        ? data.merchant.isApproved
        : data.driver
          ? data.driver.isApproved
          : true;
      setIsApproved(approved);
      setShowAuth(false);
      toast.success(`Bienvenue ${data.user.firstName} !`);
    }
  }, [loginEmail, loginPassword, login]);

  const handleRegister = useCallback(async () => {
    if (!regFirstName || !regLastName || !regEmail || !regPhone || !regPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    const { data, error } = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: regFirstName, lastName: regLastName,
        email: regEmail, phone: regPhone, password: regPassword, role: regRole,
      }),
    });
    setLoading(false);
    if (error) { toast.error(error); return; }
    if (data) {
      login(data.user, data.token);
      setShowAuth(false);
      if (regRole === 'MERCHANT' || regRole === 'DRIVER') {
        setIsApproved(false);
      }
      const roleLabel = regRole === 'CLIENT' ? 'client' : regRole === 'MERCHANT' ? 'commerçant' : 'livreur';
      toast.success(`Bienvenue ! Votre compte ${roleLabel} a été créé.`);
    }
  }, [regFirstName, regLastName, regEmail, regPhone, regPassword, regRole, login]);

  // =============================================
  // ESPACE AUTHENTIFIÉ
  // =============================================
  if (isAuthenticated && user) {
    // Commerçant ou livreur non approuvé
    if ((user.role === 'MERCHANT' || user.role === 'DRIVER') && !isApproved) {
      return <WaitingApproval role={user.role as 'MERCHANT' | 'DRIVER'} />;
    }

    let SpaceComponent: React.LazyExoticComponent<React.ComponentType> | null = null;

    if (currentSpace === 'client' && user.role === 'CLIENT') {
      SpaceComponent = ClientApp;
    } else if (currentSpace === 'merchant' && user.role === 'MERCHANT') {
      SpaceComponent = MerchantApp;
    } else if (currentSpace === 'driver' && user.role === 'DRIVER') {
      SpaceComponent = DriverApp;
    } else if (currentSpace === 'admin' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isSuperAdmin)) {
      SpaceComponent = AdminApp;
    }

    if (SpaceComponent) {
      return (
        <Suspense fallback={<LoadingSpace />}>
          <SpaceComponent />
        </Suspense>
      );
    }
  }

  // =============================================
  // LANDING PAGE (non connecté)
  // =============================================
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* EN-TÊTE */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <RapigoLogo variant="icon" height={36} priority className="md:hidden" />
            <RapigoLogo variant="horizontal" height={36} priority className="hidden md:block" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#categories" className="text-muted-foreground hover:text-foreground transition-colors">Catégories</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#support" className="text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => { setAuthTab('login'); setShowAuth(true); }}>
              Connexion
            </Button>
            <Button size="sm" onClick={() => { setAuthTab('register'); setShowAuth(true); }}>
              S&apos;inscrire
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ ease: EASE_OUT }}
              className="md:hidden border-t bg-background overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                <a href="#categories" className="text-sm py-2 hover:text-primary" onClick={() => setShowMobileMenu(false)}>Catégories</a>
                <a href="#features" className="text-sm py-2 hover:text-primary" onClick={() => setShowMobileMenu(false)}>Fonctionnalités</a>
                <a href="#support" className="text-sm py-2 hover:text-primary" onClick={() => setShowMobileMenu(false)}>Support</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* SECTION HÉRO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5" /> Rapide • Fiable • Partout au Mali
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Tout livré chez vous{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
                en quelques minutes
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Restaurants, supermarchés, pharmacies, boutiques — commandez en ligne et recevez vos courses à domicile. Bamako, Ségou et bientôt partout au Mali.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => { setRegRole('CLIENT'); setAuthTab('register'); setShowAuth(true); }}>
                Commander <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8" onClick={() => { setRegRole('MERCHANT'); setAuthTab('register'); setShowAuth(true); }}>
                <Store className="h-4 w-4" /> Devenir Commerçant
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8" onClick={() => { setRegRole('DRIVER'); setAuthTab('register'); setShowAuth(true); }}>
                <Truck className="h-4 w-4" /> Devenir Livreur
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATÉGORIES / TYPES DE COMMERCE */}
      <section id="categories" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Explorez nos catégories</h2>
            <p className="text-muted-foreground">Trouvez ce dont vous avez besoin, livré rapidement chez vous.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {BUSINESS_TYPES.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, ease: EASE_OUT }}
              >
                <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border-0 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <div className={`p-3 rounded-xl ${cat.color} group-hover:scale-110 transition-transform`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Pourquoi choisir Rapigo ?</h2>
            <p className="text-muted-foreground">Une plateforme conçue pour le Mali, avec les standards mondiaux.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease: EASE_OUT }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 w-fit">
                      <f.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section id="support" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-3">Support client</h2>
            <p className="text-muted-foreground">Nous sommes là pour vous aider à tout moment.</p>
          </motion.div>
          <SupportContact />
        </div>
      </section>

      {/* PIED DE PAGE */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Informations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RapigoLogo variant="icon" height={32} className="md:hidden" />
                <RapigoLogo variant="horizontal" height={32} className="hidden md:block" />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Votre plateforme de livraison N°1 au Mali. Rapide, fiable, partout au Mali.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Mr. Diarra Moussa</p>
                <a href="tel:+22377163862" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" /> +223 77 16 38 62
                </a>
                <a href="https://wa.me/22377163862" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-600 transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp +22377163862
                </a>
                <a href="mailto:diarramoussaka7@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" /> diarramoussaka7@gmail.com
                </a>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Bamako, Mali
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Plateforme</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="cursor-pointer hover:text-foreground transition-colors">À propos</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Tarification</p>
                <button type="button" className="hover:text-foreground transition-colors text-left" onClick={() => { setRegRole('DRIVER'); setAuthTab('register'); setShowAuth(true); }}>Devenir livreur</button>
                <button type="button" className="hover:text-foreground transition-colors text-left" onClick={() => { setRegRole('MERCHANT'); setAuthTab('register'); setShowAuth(true); }}>Devenir commerçant</button>
              </div>
            </div>

            {/* Boutons de contact */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Nous contacter</h4>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <a href="tel:+22377163862">
                    <Phone className="h-4 w-4 text-emerald-600" /> Appeler
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <a href="https://wa.me/22377163862" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <a href="mailto:diarramoussaka7@gmail.com">
                    <Mail className="h-4 w-4 text-emerald-600" /> Envoyer un Email
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2025 Rapigo Mali. Tous droits réservés.</p>
            <p>Version 2.5.0 Enterprise</p>
          </div>
        </div>
      </footer>

      {/* =============================================
          BOÎTE DE DIALOGUE D'AUTHENTIFICATION
          ============================================= */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2">
              <RapigoLogo variant="vertical" height={40} className="mx-auto" />
            </div>
            <DialogTitle className="text-center text-xl">
              {authTab === 'login' ? 'Connexion' : 'Créer un compte'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {authTab === 'login'
                ? 'Connectez-vous à votre compte Rapigo Mali'
                : 'Rejoignez Rapigo Mali dès maintenant'}
            </DialogDescription>
          </DialogHeader>

          {authTab === 'login' ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="login-email">Adresse email</Label>
                <Input
                  id="login-email" type="email" placeholder="votre@email.com"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => setAuthTab('register')}>
                  S&apos;inscrire
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Tabs value={regRole} onValueChange={v => setRegRole(v)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="CLIENT">Client</TabsTrigger>
                  <TabsTrigger value="MERCHANT">Commerçant</TabsTrigger>
                  <TabsTrigger value="DRIVER">Livreur</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-first">Prénom</Label>
                  <Input id="reg-first" placeholder="Prénom" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-last">Nom</Label>
                  <Input id="reg-last" placeholder="Nom" value={regLastName} onChange={e => setRegLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Adresse email</Label>
                <Input id="reg-email" type="email" placeholder="votre@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Téléphone (+223)</Label>
                <Input id="reg-phone" placeholder="+223 XX XX XX XX" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Mot de passe (6 caractères min.)</Label>
                <div className="relative">
                  <Input
                    id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {regRole === 'MERCHANT' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-medium mb-1">Commerçant</p>
                  <p className="text-xs">Votre compte sera vérifié par notre équipe avant activation. Accès Premium à vie — 4 000 FCFA seulement.</p>
                </div>
              )}
              {regRole === 'DRIVER' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-medium mb-1">Livreur</p>
                  <p className="text-xs">Vous devrez fournir vos documents (CNI, permis) pour validation avant de pouvoir livrer.</p>
                </div>
              )}

              <Button className="w-full" onClick={handleRegister} disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => setAuthTab('login')}>
                  Se connecter
                </button>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}