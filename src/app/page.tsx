'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, ShoppingBag, Store, Smartphone, Shield, Zap, Star,
  ChevronRight, Menu, X, UtensilsCrossed, Pill, ShoppingCart,
  ShoppingBag as BagIcon, Package, Shirt, Sparkles, Wrench,
  ArrowRight, Phone, Mail, MessageCircle, MapPin,
  Eye, EyeOff, CheckCircle2, Clock, Users, TrendingUp, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore, useSpaceStore, apiFetch, type AuthUser } from '@/lib/store';
import { SupportContact } from '@/components/support-contact';
import { toast } from 'sonner';

const ClientApp = lazy(() => import('@/components/client/client-app'));
const MerchantApp = lazy(() => import('@/components/merchant/merchant-app'));
const DriverApp = lazy(() => import('@/components/driver/driver-app'));
const AdminApp = lazy(() => import('@/components/admin/admin-app'));

function LoadingSpace() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );
}

// =============================================
// PAGE PRINCIPALE RAPIGO MALI
// =============================================

const CATEGORIES = [
  { icon: UtensilsCrossed, label: 'Restaurants', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { icon: ShoppingCart, label: 'Supermarchés', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { icon: Pill, label: 'Pharmacies', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { icon: BagIcon, label: 'Boutiques', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { icon: Package, label: 'Colis & Envois', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { icon: Smartphone, label: 'Électronique', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { icon: Shirt, label: 'Mode', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  { icon: Sparkles, label: 'Beauté', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
];

const STATS = [
  { value: '500+', label: 'Commerçants', icon: Store },
  { value: '10 000+', label: 'Clients satisfaits', icon: Users },
  { value: '50 000+', label: 'Livraisons', icon: Truck },
  { value: '4.8/5', label: 'Note moyenne', icon: Star },
];

const FEATURES = [
  { icon: Zap, title: 'Ultra rapide', desc: 'Livraison en moyenne 30 minutes dans tout Bamako.' },
  { icon: Shield, title: 'Paiements sécurisés', desc: 'Orange Money, Moov Money, Wave, Visa, Cash et plus encore.' },
  { icon: Smartphone, title: 'Simple à utiliser', desc: 'Commandez en 3 clics depuis votre téléphone.' },
  { icon: Clock, title: 'Disponible 7j/7', desc: 'Notre service est ouvert tous les jours de la semaine.' },
  { icon: TrendingUp, title: 'Suivi en temps réel', desc: 'Suivez votre livreur en direct sur la carte.' },
  { icon: Award, title: 'Commerçants vérifiés', desc: 'Tous nos partenaires sont approuvés par notre équipe.' },
];

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { currentSpace, setSpace } = useSpaceStore();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Restore session
  useEffect(() => {
    if (isAuthenticated && user) {
      const spaceMap: Record<string, 'client' | 'merchant' | 'driver' | 'admin'> = {
        CLIENT: 'client', MERCHANT: 'merchant', DRIVER: 'driver', ADMIN: 'admin',
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
    const { data, error } = await apiFetch<{ user: AuthUser; token: string; merchant?: any; driver?: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    setLoading(false);
    if (error) { toast.error(error); return; }
    if (data) {
      login(data.user, data.token);
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
      const roleLabel = regRole === 'CLIENT' ? 'client' : regRole === 'MERCHANT' ? 'commerçant' : 'livreur';
      toast.success(`Bienvenue ! Votre compte ${roleLabel} a été créé.`);
    }
  }, [regFirstName, regLastName, regEmail, regPhone, regPassword, regRole, login]);

  // =============================================
  // Si authentifié → afficher l'espace correspondant
  // =============================================
  if (isAuthenticated && user) {
    let SpaceComponent: React.LazyExoticComponent<React.ComponentType> | null = null;

    if (currentSpace === 'client' && user.role === 'CLIENT') {
      SpaceComponent = ClientApp;
    } else if (currentSpace === 'merchant' && user.role === 'MERCHANT') {
      SpaceComponent = MerchantApp;
    } else if (currentSpace === 'driver' && user.role === 'DRIVER') {
      SpaceComponent = DriverApp;
    } else if (currentSpace === 'admin' && (user.role === 'ADMIN' || user.isSuperAdmin)) {
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
  // PAGE D'ACCUEIL (Landing)
  // =============================================
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">Rapigo</span>
              <span className="text-lg font-light text-emerald-600 ml-1">Mali</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#categories" className="text-muted-foreground hover:text-foreground transition-colors">Catégories</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#support" className="text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user?.firstName}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>Déconnexion</Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => { setAuthTab('login'); setShowAuth(true); }}>
                  Connexion
                </Button>
                <Button size="sm" onClick={() => { setAuthTab('register'); setShowAuth(true); }}>
                  S&apos;inscrire
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
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

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5" /> Rapide, Fiable, Partout au Mali
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
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => { setAuthTab('register'); setShowAuth(true); }}>
                Commander maintenant <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8" onClick={() => { setAuthTab('register'); setRegRole('MERCHANT'); setShowAuth(true); }}>
                <Store className="h-4 w-4" /> Devenir commerçant
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <s.icon className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section id="categories" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Explorez nos catégories</h2>
            <p className="text-muted-foreground">Trouvez ce dont vous avez besoin, livré rapidement chez vous.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Pourquoi choisir Rapigo ?</h2>
            <p className="text-muted-foreground">Une plateforme conçue pour le Mali, avec les standards mondiaux.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 w-fit">
                      <f.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{f.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFRE PREMIUM */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white text-center">
                <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm mb-3">
                  <Award className="h-3.5 w-3.5" /> Offre Spéciale
                </div>
                <h3 className="text-2xl font-bold">Rapigo Mali Premium</h3>
                <p className="text-emerald-100 mt-1">Accès Premium à vie</p>
              </div>
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl font-extrabold">4 000 <span className="text-lg font-normal text-muted-foreground">FCFA</span></div>
                <p className="text-sm text-muted-foreground">Paiement unique • Accès permanent • Sans renouvellement</p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  {['Produits illimités', 'Commandes illimitées', 'Coupons illimités', 'Statistiques avancées', 'Support prioritaire', 'Badge vérifié'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full gap-2 mt-4" onClick={() => { setAuthTab('register'); setRegRole('MERCHANT'); setShowAuth(true); }}>
                  Devenir Premium <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SUPPORT */}
      <section id="support" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Support client</h2>
            <p className="text-muted-foreground">Nous sommes là pour vous aider à tout moment.</p>
          </div>
          <SupportContact />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">Rapigo <span className="font-light text-emerald-600">Mali</span></span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Votre plateforme de livraison N°1 au Mali. Rapide, fiable, partout au Mali.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Bamako, Mali
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Plateforme</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="cursor-pointer hover:text-foreground transition-colors">À propos</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Tarification</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Devenir livreur</p>
                <p className="cursor-pointer hover:text-foreground transition-colors">Devenir commerçant</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Contact</h4>
              <div className="space-y-2 text-sm">
                <a href="tel:+22377163862" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" /> +223 77 16 38 62
                </a>
                <a href="mailto:diarramoussaka7@gmail.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" /> diarramoussaka7@gmail.com
                </a>
                <a href="https://wa.me/22377163862" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-green-600 transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Développé par Mr. Diarra Moussa</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Rapigo Mali. Tous droits réservés.</p>
            <p>Version 2.4.0 Enterprise</p>
          </div>
        </div>
      </footer>

      {/* =============================================
          MODAL D'AUTHENTIFICATION
          ============================================= */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
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
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
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
                  <p className="text-xs">Vous devrez fournir vos documents (CNI, permis) pour validation.</p>
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