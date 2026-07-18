'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Smartphone, ArrowUpRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'rapigo-pwa-dismissed-v3';

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    !!(window.navigator as unknown as { standalone?: boolean }).standalone
  );
}

function isAppleDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [installing, setInstalling] = useState(false);
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  const shouldShow = useCallback(() => {
    if (isStandaloneMode()) return false;
    if (localStorage.getItem(DISMISS_KEY)) return false;
    return true;
  }, []);

  const show = useCallback(() => {
    if (shouldShow()) setVisible(true);
  }, [shouldShow]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPromptRef.current) {
      setInstalling(true);
      try {
        await deferredPromptRef.current.prompt();
        const { outcome } = await deferredPromptRef.current.userChoice;
        if (outcome === 'accepted') setVisible(false);
      } catch { /* user cancelled */ } finally {
        setInstalling(false);
        deferredPromptRef.current = null;
      }
    }
  }, []);

  const handleIosInstall = useCallback(() => setIosDialogOpen(true), []);

  useEffect(() => {
    setPlatform(isAppleDevice() ? 'ios' : 'android');
    if (!shouldShow()) return;

    let promptFired = false;
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      promptFired = true;
      setTimeout(show, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const fallbackTimer = setTimeout(() => {
      if (!promptFired && shouldShow()) show();
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, [shouldShow, show]);

  useEffect(() => {
    const handler = () => {
      setVisible(false);
      deferredPromptRef.current = null;
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Main Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-600/20">
              <div className="max-w-5xl mx-auto px-3 py-2.5 flex items-center gap-3">
                {/* Banner Logo */}
                <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-1 shadow-inner">
                  <img
                    src="/rapigo-banner.jpeg"
                    alt="Rapigo Mali"
                    className="h-9 w-auto object-contain rounded-lg"
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight">
                      Installer Rapigo Mali
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wider">
                      App gratuite
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-0.5 truncate">
                    {platform === 'ios'
                      ? 'Accédez rapidement depuis votre écran d\'accueil'
                      : 'Ajoutez l\'application sur votre écran d\'accueil'}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {platform === 'ios' ? (
                    <button
                      onClick={handleIosInstall}
                      className="flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                      <Share2 size={13} />
                      Installer
                    </button>
                  ) : (
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60"
                    >
                      {installing ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      Installer
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-all"
                    aria-label="Fermer"
                  >
                    <X size={18} className="text-white/80" />
                  </button>
                </div>
              </div>
            </div>

            {/* iOS instruction tip */}
            {platform === 'ios' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-emerald-50 border-b border-emerald-200 overflow-hidden"
              >
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                  <ArrowUpRight size={20} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <span className="font-semibold">Astuce :</span> Appuyez sur le bouton
                    <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-white rounded-md shadow-sm text-[11px] font-medium">
                      􀈂 Partager
                    </span>
                    en bas de votre écran, puis sur
                    <span className="font-semibold"> « Sur l&apos;écran d&apos;accueil »</span>
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Dialog */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <img
                src="/rapigo-banner.jpeg"
                alt="Rapigo Mali"
                className="h-14 w-auto object-contain"
              />
            </div>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Installer sur iPhone / iPad
            </DialogTitle>
            <DialogDescription className="text-center">
              Suivez ces étapes pour ajouter Rapigo Mali sur votre écran d&apos;accueil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              {
                step: 1,
                title: 'Appuyez sur le bouton Partager',
                desc: "C'est l'icône avec une flèche qui sort d'un carré, en bas de votre écran (Safari).",
              },
              {
                step: 2,
                title: 'Scrollez et appuyez sur « Sur l\'écran d\'accueil »',
                desc: "Cette option se trouve dans la liste d'actions qui apparaît.",
              },
              {
                step: 3,
                title: 'Appuyez sur « Ajouter »',
                desc: "L'application Rapigo Mali sera ajoutée à votre écran d'accueil.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  {step}
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIosDialogOpen(false)} className="bg-emerald-600 hover:bg-emerald-700">
              J&apos;ai compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}