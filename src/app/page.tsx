'use client';

import { useEffect, useSyncExternalStore, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Sun, Moon, LogOut, Truck, Store, User, ShieldCheck,
  ArrowRight, MapPin, Clock, Star, Smartphone, Wallet,
  ChevronRight, Package, Pill, ShoppingBag, Zap, Users,
  TrendingUp, BarChart3, Send, Heart, Award, Gift, Headphones,
  Eye, EyeOff, Mail, Phone, Lock, UserPlus, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthStore, useSpaceStore, useCartStore, AppSpace, formatPrice } from '@/lib/store';
import ClientApp from '@/components/client/client-app';
import MerchantApp from '@/components/merchant/merchant-app';
import DriverApp from '@/components/driver/driver-app';
import AdminApp from '@/components/admin/admin-app';

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Page() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { currentSpace, setSpace } = useSpaceStore();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Derive space from auth state
  const effectiveSpace = isAuthenticated && user
    ? ({ CLIENT: 'client' as const, MERCHANT: 'merchant' as const, DRIVER: 'driver' as const, ADMIN: 'admin' as const })[user.role] || 'landing'
    : currentSpace;

  useEffect(() => {
    if (isAuthenticated && user) {
      const spaceMap: Record<string, AppSpace> = {
        CLIENT: 'client', MERCHANT: 'merchant', DRIVER: 'driver', ADMIN: 'admin',
      };
      setSpace(spaceMap[user.role] || 'landing');
    }
  }, [isAuthenticated, user, setSpace]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      login(data.user, data.token);
      toast.success(`Bienvenue ${data.user.firstName} !`);
    } catch { toast.error('Erreur de connexion'); }
  }, [login]);

  const handleRegister = useCallback(async (formData: Record<string, string>) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      login(data.user, data.token);
      toast.success('Compte créé avec succès !');
    } catch { toast.error('Erreur lors de l\'inscription'); }
  }, [login]);

  // Show authenticated space
  if (isAuthenticated && user && effectiveSpace !== 'landing') {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar user={user} onLogout={() => { logout(); setSpace('landing'); }} />
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={effectiveSpace} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {effectiveSpace === 'client' && <ClientApp />}
              {effectiveSpace === 'merchant' && <MerchantApp />}
              {effectiveSpace === 'driver' && <DriverApp />}
              {effectiveSpace === 'admin' && <AdminApp />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // LANDING PAGE
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Rapigo</span>
            </div>
            <div className="flex items-center gap-2">
              {mounted && (
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
              <Button onClick={() => { setAuthTab('login'); setShowAuth(true); }} className="rounded-full px-4">
                Connexion
              </Button>
              <Button variant="outline" onClick={() => { setAuthTab('register'); setShowAuth(true); }} className="rounded-full px-4 hidden sm:flex">
                Inscription
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        <div className="absolute top-20 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3.5 h-3.5 mr-1.5" /> La livraison N°1 au Mali
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Tout livré
              <span className="gradient-text"> chez vous</span>
              <br />en quelques minutes
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Restaurants, supermarchés, pharmacies, boutiques et colis — Rapigo vous livre tout à Bamako, rapidement et en toute sécurité.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 h-13 text-base font-semibold shadow-lg shadow-primary/25" onClick={() => { setAuthTab('register'); setShowAuth(true); }}>
                Commander maintenant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-13 text-base" onClick={() => { setAuthTab('register'); setShowAuth(true); }}>
                Devenir livreur
              </Button>
            </div>
          </motion.div>

          {/* Quick demo login */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-16">
            <p className="text-sm text-muted-foreground text-center mb-4">Accès démo rapide</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: 'Client', icon: User, email: 'client1@rapigo.ml', pass: 'Client@123', color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
                { label: 'Commerçant', icon: Store, email: 'terranga@rapigo.ml', pass: 'Merchant@123', color: 'bg-gold/10 text-gold-foreground border-gold/20 hover:bg-gold/20' },
                { label: 'Livreur', icon: Truck, email: 'driver1@rapigo.ml', pass: 'Driver@123', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
                { label: 'Admin', icon: ShieldCheck, email: 'admin@rapigo.ml', pass: 'Admin@123', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
              ].map((demo) => (
                <button key={demo.label} onClick={() => handleLogin(demo.email, demo.pass)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-105 ${demo.color}`}>
                  <demo.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{demo.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Que souhaitez-vous ?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { icon: '🍽️', label: 'Restaurants', desc: 'Plats délicieux', count: '50+', color: 'from-orange-500 to-red-500' },
                { icon: '🛒', label: 'Supermarchés', desc: 'Courses quotidiennes', count: '20+', color: 'from-green-500 to-emerald-600' },
                { icon: '💊', label: 'Pharmacies', desc: 'Santé & bien-être', count: '15+', color: 'from-blue-500 to-cyan-500' },
                { icon: '🛍️', label: 'Boutiques', desc: 'Mode & accessoires', count: '30+', color: 'from-pink-500 to-rose-500' },
                { icon: '📦', label: 'Colis', desc: 'Envois & retraits', count: '100+', color: 'from-amber-500 to-yellow-500' },
              ].map((cat, i) => (
                <motion.div key={cat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                    <CardContent className="p-5 text-center">
                      <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                        {cat.icon}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">{cat.desc}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{cat.count} établissements</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Pourquoi Rapigo ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Livraison rapide', desc: 'En moyenne 30 minutes pour vos commandes alimentaires', color: 'text-primary' },
              { icon: MapPin, title: 'Suivi en temps réel', desc: 'Suivez votre livreur sur la carte en direct', color: 'text-blue-500' },
              { icon: Wallet, title: 'Paiements locaux', desc: 'Orange Money, Moov Money, espèces et portefeuille', color: 'text-gold' },
              { icon: Star, title: 'Qualité garantie', desc: 'Commerçants vérifiés et notation transparente', color: 'text-yellow-500' },
              { icon: Smartphone, title: 'Simple et intuitif', desc: 'Interface conçue pour une utilisation facile', color: 'text-purple-500' },
              { icon: Heart, title: 'Support 24/7', desc: 'Notre équipe est là pour vous à tout moment', color: 'text-rose-500' },
            ].map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4 ${feat.color}`}>
                      <feat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground">{feat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Utilisateurs', icon: Users },
              { value: '500+', label: 'Commerçants', icon: Store },
              { value: '200+', label: 'Livreurs', icon: Truck },
              { value: '50K+', label: 'Commandes', icon: Package },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon className="w-7 h-7 mx-auto mb-2 opacity-80" />
                <div className="text-3xl sm:text-4xl font-extrabold mb-1">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">Rapigo Mali</span>
            </div>
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Rapigo Mali. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} defaultTab={authTab} onTabChange={setAuthTab} onLogin={handleLogin} onRegister={handleRegister} />
    </div>
  );
}

// ============================================
// TOP BAR (for authenticated users)
// ============================================
function TopBar({ user, onLogout }: { user: { firstName: string; lastName: string; role: string; avatar?: string }; onLogout: () => void }) {
  const { theme, setTheme } = useTheme();
  const { currentSpace, setSpace } = useSpaceStore();
  const cartCount = useCartStore((s) => s.itemCount());
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const spaceItems: { space: AppSpace; label: string; icon: React.ElementType; roles: string[] }[] = [
    { space: 'client', label: 'Client', icon: User, roles: ['CLIENT', 'ADMIN'] },
    { space: 'merchant', label: 'Commerçant', icon: Store, roles: ['MERCHANT', 'ADMIN'] },
    { space: 'driver', label: 'Livreur', icon: Truck, roles: ['DRIVER', 'ADMIN'] },
    { space: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  return (
    <header className="sticky top-0 z-50 glass-strong border-b">
      <div className="flex items-center justify-between h-14 px-4 max-w-full">
        <div className="flex items-center gap-3">
          <button onClick={() => setSpace('landing')} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">Rapigo</span>
          </button>
          <div className="flex items-center bg-muted/80 rounded-lg p-0.5 gap-0.5">
            {spaceItems.filter((s) => s.roles.includes(user.role)).map((s) => (
              <button key={s.space} onClick={() => setSpace(s.space)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentSpace === s.space ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full h-8 w-8">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-emerald-500/80 flex items-center justify-center text-white text-xs font-bold">
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
function AuthDialog({ open, onOpenChange, defaultTab, onTabChange, onLogin, onRegister }: {
  open: boolean; onOpenChange: (v: boolean) => void; defaultTab: 'login' | 'register';
  onTabChange: (t: 'login' | 'register') => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (data: Record<string, string>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await onLogin(fd.get('email') as string, fd.get('password') as string);
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    fd.forEach((v, k) => { if (typeof v === 'string') data[k] = v; });
    setLoading(true);
    await onRegister(data);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl gradient-text">Rapigo Mali</DialogTitle>
          <DialogDescription>La livraison rapide à Bamako</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} onValueChange={(v) => onTabChange(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input name="email" type="email" placeholder="votre@email.com" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input name="firstName" placeholder="Prénom" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input name="lastName" placeholder="Nom" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="votre@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input name="phone" type="tel" placeholder="+223 7X XX XX XX" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe</Label>
                <Input name="password" type="password" placeholder="Min. 6 caractères" required minLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label>Je suis</Label>
                <select name="role" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required defaultValue="CLIENT">
                  <option value="CLIENT">Un client</option>
                  <option value="MERCHANT">Un commerçant</option>
                  <option value="DRIVER">Un livreur</option>
                </select>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" />Créer mon compte</>}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}