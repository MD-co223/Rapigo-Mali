'use client';

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, ShoppingBag, Store, Smartphone, Shield, Zap, Star,
  ChevronRight, Menu, X, UtensilsCrossed, Pill, ShoppingCart,
  Package, Shirt, Sparkles, ArrowRight, Phone, Mail, MessageCircle,
  MapPin, Eye, EyeOff, CheckCircle2, Clock, Users, TrendingUp, LogOut,
  Camera, Upload as UploadIcon, Loader2
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

// =============================================
// SPLASH SCREEN — Animation d'ouverture cinématique ultra stylée
// =============================================
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  // Phases: 0=black-in, 1=logo-reveal, 2=glow-pulse, 3=tagline-in, 4=shimmer, 5=zoom-out

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2100),
      setTimeout(() => setPhase(5), 2600),
      setTimeout(onDone, 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 30%, #047857 60%, #059669 100%)' }}
      initial={{ opacity: 1 }}
      animate={phase >= 5 ? { opacity: 0, scale: 1.08 } : { opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Animated gradient background overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.15) 0%, transparent 50%)',
        }}
        animate={phase >= 2 ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cinematic light rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute origin-center"
            style={{
              left: '50%',
              top: '40%',
              width: '2px',
              height: '200%',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 60%, transparent 100%)',
              transform: `rotate(${i * 30}deg)`,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={phase >= 1
              ? { opacity: [0, 0.8, 0.4, 0], scaleY: [0, 1.2, 1, 1.2] }
              : { opacity: 0, scaleY: 0 }
            }
            transition={{ duration: 2.5, ease: 'easeOut', delay: i * 0.1 }}
          />
        ))}
      </div>

      {/* Orbiting ring particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 140;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <motion.div
              key={`orb-${i}`}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 6 : 3,
                height: i % 3 === 0 ? 6 : 3,
                background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(52,211,153,0.8)',
                boxShadow: i % 2 === 0 ? '0 0 8px rgba(255,255,255,0.4)' : '0 0 8px rgba(52,211,153,0.4)',
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={phase >= 1
                ? {
                    x: [0, x * 0.3, x * 1.1, x],
                    y: [0, y * 0.3, y * 1.1, y],
                    opacity: [0, 1, 0.6, 0],
                    scale: [0, 1.5, 1, 0.3],
                  }
                : { x: 0, y: 0, opacity: 0, scale: 0 }
              }
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.04 }}
            />
          );
        })}
      </div>

      {/* Expanding pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border-2 border-white/20"
            initial={{ width: 60, height: 60, opacity: 0 }}
            animate={phase >= 2
              ? {
                  width: [60, 200 + i * 150, 500 + i * 100],
                  height: [60, 200 + i * 150, 500 + i * 100],
                  opacity: [0, 0.5, 0],
                  borderWidth: [2, 1, 0.5],
                }
              : { width: 60, height: 60, opacity: 0 }
            }
            transition={{ duration: 1.5, ease: 'easeOut', delay: i * 0.2 }}
          />
        ))}
      </div>

      {/* Main logo container with glow */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ y: 60, opacity: 0, scale: 0.6, filter: 'blur(20px)' }}
        animate={
          phase === 1
            ? { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }
            : phase === 5
              ? { y: -40, scale: 0.88, opacity: 0, filter: 'blur(8px)' }
              : { y: 0, opacity: 1, scale: 1 }
        }
        transition={phase === 1
          ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
        }
      >
        {/* Logo glow backdrop */}
        <motion.div
          className="absolute -inset-8 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)' }}
          animate={phase >= 2 ? { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] } : { scale: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* The actual logo image */}
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(16,185,129,0.15)' }}
          animate={phase >= 4 ? {
            boxShadow: [
              '0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(16,185,129,0.15)',
              '0 25px 60px rgba(0,0,0,0.3), 0 0 80px rgba(16,185,129,0.3)',
              '0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(16,185,129,0.15)',
            ],
          } : {}}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src="/rapigo-logo.jpg"
            alt="Rapigo Mali"
            className="h-36 sm:h-44 md:h-52 w-auto object-contain"
            draggable={false}
          />
          {/* Shimmer overlay on logo */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 55%, transparent 60%)',
            }}
            initial={{ x: '-100%' }}
            animate={phase >= 4 ? { x: '200%' } : { x: '-100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>

      {/* Tagline with letter-by-letter animation */}
      <motion.div
        className="relative z-10 mt-5 flex overflow-hidden"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {'Rapide • Fiable • Partout au Mali'.split('').map((char, i) => (
          <motion.span
            key={i}
            className="text-white/90 font-semibold text-sm sm:text-base tracking-wider"
            initial={{ y: 20, opacity: 0 }}
            animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: (phase >= 3 ? 0 : 0) + i * 0.02 }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>

      {/* Elegant loading bar */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-0.5 rounded-full overflow-hidden z-10"
        style={{ background: 'rgba(255,255,255,0.15)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(52,211,153,0.9), transparent)',
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </motion.div>

      {/* Version badge */}
      <motion.div
        className="absolute bottom-7 z-10 flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-white/50 tracking-widest font-medium">
          RAPIGO MALI · V3.0
        </span>
      </motion.div>
    </motion.div>
  );
}

function LoadingSpace() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <img src="/rapigo-banner.jpeg" alt="Rapigo Mali" className="h-16 w-auto object-contain animate-pulse" />
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
// COMPRESSOR IMAGE CLIENT-SIDE
// =============================================

function compressImage(base64: string, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

// =============================================
// PAGE ENVOI PREUVE DE PAIEMENT
// =============================================

function PaymentProofUpload({ role, onProofSent }: { role: 'MERCHANT' | 'DRIVER'; onProofSent: (proofUrl: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const amountLabel = role === 'MERCHANT' ? '4 000 FCFA à vie' : '4 000 FCFA';
  const roleLabel = role === 'MERCHANT' ? 'commerçant' : 'livreur';

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      setSelectedImage(compressed);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedImage) {
      toast.error('Veuillez d\'abord sélectionner une image');
      return;
    }
    setUploading(true);
    const { data, error } = await apiFetch<{ user: { merchant?: { paymentProof?: string | null }; driver?: { paymentProof?: string | null } } }>('/api/auth/upload-proof', {
      method: 'PATCH',
      body: JSON.stringify({ proofImage: selectedImage }),
    });
    setUploading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Preuve de paiement envoyée avec succès !');
    const proof = data?.user?.merchant?.paymentProof || data?.user?.driver?.paymentProof || '';
    onProofSent(proof);
  }, [selectedImage, onProofSent]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="max-w-md w-full space-y-6"
      >
        <div className="mx-auto w-32">
          <RapigoLogo variant="vertical" height={64} className="mx-auto" priority />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">📋 Frais d&apos;inscription</h1>
          <p className="text-muted-foreground">
            Bienvenue {roleLabel} ! Pour activer votre compte, veuillez effectuer le paiement d&apos;inscription.
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 space-y-3 border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Montant</span>
            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{amountLabel}</span>
          </div>
          <div className="border-t border-emerald-200 dark:border-emerald-700/50" />
          <p className="text-xs text-center text-emerald-600/80 dark:text-emerald-400/80 font-medium uppercase tracking-wider">OMNIHUB DIGITAL</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">🟠 Orange Money</span>
              <a href="tel:+22377163862" className="text-lg font-bold text-emerald-800 dark:text-emerald-200 hover:underline">+223 77 16 38 62</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">🔵 Wave</span>
              <a href="tel:+22398932806" className="text-lg font-bold text-emerald-800 dark:text-emerald-200 hover:underline">+223 98 93 28 06</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">🟡 Moov Money</span>
              <a href="tel:+22398932806" className="text-lg font-bold text-emerald-800 dark:text-emerald-200 hover:underline">+223 98 93 28 06</a>
            </div>
          </div>
          <div className="border-t border-emerald-200 dark:border-emerald-700/50" />
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
            Effectuez le paiement via l&apos;un de ces numéros, puis prenez une capture d&apos;écran de la confirmation.
          </p>
          <img src="/payment-methods.jpeg" alt="Moyens de paiement" className="w-full rounded-lg border border-emerald-200 dark:border-emerald-700" />
        </div>

        {/* Image upload */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedImage ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
                <img src={selectedImage} alt="Aperçu" className="w-full max-h-64 object-contain bg-muted/30" />
                <button
                  type="button"
                  onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><UploadIcon className="h-4 w-4 mr-2" /> Envoyer la preuve</>
                )}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs">📷 Prendre une photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => {
                  const input = fileInputRef.current;
                  if (input) {
                    input.removeAttribute('capture');
                    input.click();
                  }
                }}
              >
                <UploadIcon className="h-5 w-5" />
                <span className="text-xs">📎 Choisir un fichier</span>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// =============================================
// PAGE EN ATTENTE DE VALIDATION
// =============================================

function WaitingApproval({ role, hasPaymentProof, proofUrl }: { role: 'MERCHANT' | 'DRIVER'; hasPaymentProof: boolean; proofUrl?: string | null }) {
  const { logout, user } = useAuthStore();
  const { setSpace } = useSpaceStore();
  const [reUploading, setReUploading] = useState(false);
  const [reProof, setReProof] = useState<string | null>(null);
  const reProofRef = useRef<HTMLInputElement>(null);

  const handleReProofChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      setReProof(compressed);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleReUpload = useCallback(async () => {
    if (!reProof || !user) return;
    setReUploading(true);
    const { error } = await apiFetch('/api/auth/upload-proof', {
      method: 'PATCH',
      body: JSON.stringify({ proofImage: reProof }),
    });
    setReUploading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Nouvelle preuve de paiement envoyée !');
    setReProof(null);
    window.location.reload();
  }, [reProof, user]);

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Compte en attente</h1>
          <p className="text-amber-700 dark:text-amber-400 font-medium">
            Votre inscription comme {roleLabel} est <strong>EN ATTENTE</strong> de validation de paiement.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Notre équipe va vérifier votre preuve de paiement et activer votre compte sous peu.
          </p>
        </div>

        {hasPaymentProof && proofUrl && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 space-y-3 border border-emerald-200">
            <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Preuve de paiement envoyée ✓
            </div>
            <div className="mx-auto max-w-[200px]">
              <img src={proofUrl} alt="Preuve de paiement" className="w-full rounded-lg border border-emerald-200" />
            </div>
          </div>
        )}

        {!hasPaymentProof && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-3 border border-amber-200">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              ⚠️ Aucune preuve de paiement envoyée. Veuillez en envoyer une pour activer votre compte.
            </p>
          </div>
        )}

        {/* Re-upload section */}
        <div className="space-y-3">
          <input
            ref={reProofRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleReProofChange}
          />
          {reProof ? (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
                <img src={reProof} alt="Nouvelle preuve" className="w-full max-h-48 object-contain bg-muted/30" />
                <button
                  type="button"
                  onClick={() => setReProof(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleReUpload}
                disabled={reUploading}
              >
                {reUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...</> : <><UploadIcon className="h-4 w-4 mr-2" /> Envoyer la nouvelle preuve</>}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => reProofRef.current?.click()}
            >
              <UploadIcon className="h-4 w-4" />
              Envoyer une autre preuve
            </Button>
          )}
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 space-y-2 text-sm border border-emerald-200">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">📋 Inscription : 4 000 FCFA</p>
          <p className="text-xs text-center text-emerald-600/80 dark:text-emerald-400/80 font-medium uppercase tracking-wider">OMNIHUB DIGITAL</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">🟠 Orange Money</span>
              <a href="tel:+22377163862" className="font-bold hover:underline">+223 77 16 38 62</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">🔵 Wave</span>
              <a href="tel:+22398932806" className="font-bold hover:underline">+223 98 93 28 06</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">🟡 Moov Money</span>
              <a href="tel:+22398932806" className="font-bold hover:underline">+223 98 93 28 06</a>
            </div>
          </div>
          <img src="/payment-methods.jpeg" alt="Moyens de paiement" className="w-full rounded-lg border border-emerald-200 dark:border-emerald-700 mt-2" />
        </div>

        <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-medium">Besoin d&apos;aide ?</p>
          <p className="text-muted-foreground">
            Contactez Mr. Diarra Moussa pour accélérer la validation.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <a href="tel:+22377163870" className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:underline font-medium">
              <Phone className="h-4 w-4" /> +223 77 16 38 70
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
// PAGE PRINCIPALE RAPIGO MALI V3.0
// =============================================

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { currentSpace, setSpace } = useSpaceStore();

  // Splash screen
  const [showSplash, setShowSplash] = useState(true);
  const splashDone = useCallback(() => setShowSplash(false), []);

  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [merchantDriverApproved, setMerchantDriverApproved] = useState<boolean | null>(null);
  const [proofUploadRole, setProofUploadRole] = useState<'MERCHANT' | 'DRIVER' | null>(null);
  const [hasPaymentProof, setHasPaymentProof] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  // Statut d'approbation effectif : CLIENT/ADMIN toujours approuvés, MERCHANT/DRIVER vérifié via API
  const isApproved = user?.role === 'CLIENT' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    ? true
    : merchantDriverApproved === true;

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
  const [regPaymentProof, setRegPaymentProof] = useState<string | null>(null);
  const regProofRef = useRef<HTMLInputElement>(null);

  const handleRegProofChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      setRegPaymentProof(compressed);
    };
    reader.readAsDataURL(file);
  }, []);

  // Restauration de session : vérifier l'approbation + routage vers l'espace
  useEffect(() => {
    if (isAuthenticated && user) {
      const spaceMap: Record<string, 'client' | 'merchant' | 'driver' | 'admin'> = {
        CLIENT: 'client', MERCHANT: 'merchant', DRIVER: 'driver',
        ADMIN: 'admin', SUPER_ADMIN: 'admin',
      };
      const targetSpace = spaceMap[user.role] || 'client';

      // CLIENT et ADMIN n'ont pas besoin d'approbation
      if (user.role === 'CLIENT' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        setSpace(targetSpace);
        return;
      }

      // MERCHANT / DRIVER : vérifier l'approbation via l'API
      setSpace(targetSpace);
      apiFetch<{ merchant?: { isApproved: boolean; paymentProof?: string | null }; driver?: { isApproved: boolean; paymentProof?: string | null } }>('/api/auth/me').then(({ data }) => {
        if (data) {
          const profile = data.merchant || data.driver;
          const approved = profile ? profile.isApproved : true;
          const proof = profile?.paymentProof || null;
          setMerchantDriverApproved(approved);
          setHasPaymentProof(!!proof);
          setProofUrl(proof);
          // If not approved and no proof, show upload step
          if (!approved && !proof) {
            setProofUploadRole(user.role as 'MERCHANT' | 'DRIVER');
          }
        }
      });
    }
  }, [isAuthenticated, user, setSpace]);

  const handleLogin = useCallback(async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    const { data, error } = await apiFetch<{ user: AuthUser; token: string; merchant?: { isApproved: boolean; paymentProof?: string | null }; driver?: { isApproved: boolean; paymentProof?: string | null } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    setLoading(false);
    if (error) { toast.error(error); return; }
    if (data) {
      login(data.user, data.token);
      const profile = data.merchant || data.driver;
      const approved = profile ? profile.isApproved : true;
      const proof = profile?.paymentProof || null;
      setMerchantDriverApproved(approved);
      setHasPaymentProof(!!proof);
      setProofUrl(proof);
      setShowAuth(false);
      if (!approved && !proof && (data.user.role === 'MERCHANT' || data.user.role === 'DRIVER')) {
        setProofUploadRole(data.user.role as 'MERCHANT' | 'DRIVER');
      }
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
    if ((regRole === 'MERCHANT' || regRole === 'DRIVER') && !regPaymentProof) {
      toast.error('Veuillez télécharger la preuve de paiement');
      return;
    }
    setLoading(true);
    const { data, error } = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: regFirstName, lastName: regLastName,
        email: regEmail, phone: regPhone, password: regPassword, role: regRole,
        paymentProof: (regRole === 'MERCHANT' || regRole === 'DRIVER') ? regPaymentProof : undefined,
      }),
    });
    setLoading(false);
    if (error) { toast.error(error); return; }
    if (data) {
      login(data.user, data.token);
      setShowAuth(false);
      if (regRole === 'MERCHANT' || regRole === 'DRIVER') {
        setMerchantDriverApproved(false);
        const constructedProofUrl = `/uploads/registration/${data.user.id}.png`;
        setHasPaymentProof(true);
        setProofUrl(constructedProofUrl);
        setProofUploadRole(null);
        // Reset registration form
        setRegPaymentProof(null);
        setRegFirstName('');
        setRegLastName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
      }
      const roleLabel = regRole === 'CLIENT' ? 'client' : regRole === 'MERCHANT' ? 'commerçant' : 'livreur';
      toast.success(`Bienvenue ! Votre compte ${roleLabel} a été créé.`);
    }
  }, [regFirstName, regLastName, regEmail, regPhone, regPassword, regRole, regPaymentProof, login]);

  const handleProofSent = useCallback((sentProofUrl: string) => {
    setHasPaymentProof(true);
    setProofUrl(sentProofUrl);
    setProofUploadRole(null);
  }, []);

  // =============================================
  // ESPACE AUTHENTIFIÉ
  // =============================================

  // Splash screen (always shows first)
  if (showSplash) return <SplashScreen onDone={splashDone} />;

  if (isAuthenticated && user) {
    // Commerçant ou livreur non approuvé
    if ((user.role === 'MERCHANT' || user.role === 'DRIVER') && !isApproved) {
      // Show proof upload step if no proof yet
      if (proofUploadRole && !hasPaymentProof) {
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="proof-upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              <PaymentProofUpload role={proofUploadRole} onProofSent={handleProofSent} />
            </motion.div>
          </AnimatePresence>
        );
      }
      // Show waiting approval (proof was sent or already existed)
      return <WaitingApproval role={user.role as 'MERCHANT' | 'DRIVER'} hasPaymentProof={hasPaymentProof} proofUrl={proofUrl} />;
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
          <motion.div
            key={currentSpace}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <SpaceComponent />
          </motion.div>
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg">
        {/* Bannière Rapigo Mali */}
        <div className="w-full bg-white dark:bg-gray-950 border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="container mx-auto px-4 py-2">
            <img
              src="/rapigo-banner.jpeg"
              alt="Rapigo Mali — Rapide, Fiable, Partout au Mali"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain mx-auto"
            />
          </div>
        </div>
        <div className="container mx-auto flex h-14 items-center justify-between px-4">

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
              <Button size="lg" className="gap-2 text-base px-8 active:scale-95 transition-transform" onClick={() => { setRegRole('CLIENT'); setAuthTab('register'); setShowAuth(true); }}>
                Commander <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 active:scale-95 transition-transform" onClick={() => { setRegRole('MERCHANT'); setAuthTab('register'); setShowAuth(true); }}>
                <Store className="h-4 w-4" /> Devenir Commerçant
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 active:scale-95 transition-transform" onClick={() => { setRegRole('DRIVER'); setAuthTab('register'); setShowAuth(true); }}>
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
        {/* Bannière Rapigo Mali */}
        <div className="w-full bg-white dark:bg-gray-950 border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="container mx-auto px-4 py-4">
            <img
              src="/rapigo-banner.jpeg"
              alt="Rapigo Mali — Rapide, Fiable, Partout au Mali"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain mx-auto"
            />
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Informations */}
            <div className="space-y-4">
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
            <p>Version 3.0.0 Enterprise</p>
          </div>
        </div>
      </footer>

      {/* =============================================
          BOÎTE DE DIALOGUE D'AUTHENTIFICATION
          ============================================= */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <div className="mx-auto mb-2">
              <img src="/rapigo-banner.jpeg" alt="Rapigo Mali" className="h-10 w-auto object-contain mx-auto" />
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
          <div className="overflow-y-auto flex-1 pr-1">
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
                <div className="space-y-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-sm border border-emerald-200 space-y-2">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-base">📋 Les frais d&apos;inscription sont de 4 000 FCFA à vie.</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-sm border border-amber-200 space-y-2">
                    <p className="text-xs text-center text-amber-600/80 dark:text-amber-400/80 font-medium uppercase tracking-wider">OMNIHUB DIGITAL — Moyens de paiement</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800 dark:text-amber-300">🟠 Orange Money</span>
                        <a href="tel:+22377163862" className="text-base font-bold text-amber-700 dark:text-amber-400 hover:underline">+223 77 16 38 62</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800 dark:text-amber-300">🔵 Wave</span>
                        <a href="tel:+22398932806" className="text-base font-bold text-amber-700 dark:text-amber-400 hover:underline">+223 98 93 28 06</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800 dark:text-amber-300">🟡 Moov Money</span>
                        <a href="tel:+22398932806" className="text-base font-bold text-amber-700 dark:text-amber-400 hover:underline">+223 98 93 28 06</a>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">Effectuez le paiement via l&apos;un de ces numéros, puis téléchargez la capture ci-dessous.</p>
                  </div>
                    <img src="/payment-methods.jpeg" alt="Moyens de paiement" className="w-full rounded-lg border border-amber-200 dark:border-amber-700" />
                  {/* Preuve de paiement */}
                  <div className="space-y-2">
                    <Label>Preuve de paiement <span className="text-red-500">*</span></Label>
                    <input
                      ref={regProofRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleRegProofChange}
                    />
                    {regPaymentProof ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
                          <img src={regPaymentProof} alt="Aperçu de la preuve" className="w-full max-h-40 object-contain bg-muted/30" />
                          <button
                            type="button"
                            onClick={() => { setRegPaymentProof(null); }}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Image sélectionnée
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-16 flex-col gap-1 text-xs"
                          onClick={() => regProofRef.current?.click()}
                        >
                          <Camera className="h-5 w-5" />
                          <span>📷 Photo</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-16 flex-col gap-1 text-xs"
                          onClick={() => {
                            const input = regProofRef.current;
                            if (input) {
                              input.removeAttribute('capture');
                              input.click();
                            }
                          }}
                        >
                          <UploadIcon className="h-5 w-5" />
                          <span>📎 Fichier</span>
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>Votre compte sera activé après validation de votre paiement par notre équipe.</p>
                  </div>
                </div>
              )}
              {regRole === 'DRIVER' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-sm border border-emerald-200 space-y-2">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-base">📋 Inscription : 4 000 FCFA</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-sm border border-amber-200 space-y-2">
                    <p className="text-xs text-center text-amber-600/80 dark:text-amber-400/80 font-medium uppercase tracking-wider">OMNIHUB DIGITAL — Moyens de paiement</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800 dark:text-amber-300">🟠 Orange Money</span>
                        <a href="tel:+22377163862" className="text-base font-bold text-amber-700 dark:text-amber-400 hover:underline">+223 77 16 38 62</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800 dark:text-amber-300">🔵 Wave</span>
                        <a href="tel:+22398932806" className="text-base font-bold text-amber-700 dark:text-amber-400 hover:underline">+223 98 93 28 06</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800 dark:text-amber-300">🟡 Moov Money</span>
                        <a href="tel:+22398932806" className="text-base font-bold text-amber-700 dark:text-amber-400 hover:underline">+223 98 93 28 06</a>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">Effectuez le paiement via l&apos;un de ces numéros, puis téléchargez la capture ci-dessous.</p>
                  </div>
                    <img src="/payment-methods.jpeg" alt="Moyens de paiement" className="w-full rounded-lg border border-amber-200 dark:border-amber-700" />
                  {/* Preuve de paiement */}
                  <div className="space-y-2">
                    <Label>Preuve de paiement <span className="text-red-500">*</span></Label>
                    <input
                      ref={regProofRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleRegProofChange}
                    />
                    {regPaymentProof ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
                          <img src={regPaymentProof} alt="Aperçu de la preuve" className="w-full max-h-40 object-contain bg-muted/30" />
                          <button
                            type="button"
                            onClick={() => { setRegPaymentProof(null); }}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Image sélectionnée
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-16 flex-col gap-1 text-xs"
                          onClick={() => regProofRef.current?.click()}
                        >
                          <Camera className="h-5 w-5" />
                          <span>📷 Photo</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-16 flex-col gap-1 text-xs"
                          onClick={() => {
                            const input = regProofRef.current;
                            if (input) {
                              input.removeAttribute('capture');
                              input.click();
                            }
                          }}
                        >
                          <UploadIcon className="h-5 w-5" />
                          <span>📎 Fichier</span>
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>Vous devrez fournir vos documents (CNI, permis) et la preuve de paiement pour validation.</p>
                  </div>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}