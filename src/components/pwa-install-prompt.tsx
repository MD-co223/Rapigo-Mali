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

const DISMISS_KEY = 'rapigo-pwa-dismissed-v2';

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

  // Check if already installed or dismissed
  const shouldShow = useCallback(() => {
    if (isStandaloneMode()) return false;
    if (localStorage.getItem(DISMISS_KEY)) return false;
    return true;
  }, []);

  // Show the banner
  const show = useCallback(() => {
    if (shouldShow()) {
      setVisible(true);
    }
  }, [shouldShow]);

  // Dismiss handler
  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  // Android install
  const handleInstall = useCallback(async () => {
    if (deferredPromptRef.current) {
      setInstalling(true);
      try {
        await deferredPromptRef.current.prompt();
        const { outcome } = await deferredPromptRef.current.userChoice;
        if (outcome === 'accepted') {
          setVisible(false);
        }
      } catch {
        // user cancelled or error
      } finally {
        setInstalling(false);
        deferredPromptRef.current = null;
      }
    }
  }, []);

  // iOS install - show dialog with instructions
  const handleIosInstall = useCallback(() => {
    setIosDialogOpen(true);
  }, []);

  useEffect(() => {
    // Detect platform
    setPlatform(isAppleDevice() ? 'ios' : 'android');

    if (!shouldShow()) return;

    let promptFired = false;

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      promptFired = true;
      // Show our custom banner (Chrome shows its own mini-infobar, we override it)
      setTimeout(show, 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: if no beforeinstallprompt after 4s, show anyway
    // This handles iOS (no event) and cases where event was missed
    const fallbackTimer = setTimeout(() => {
      if (!promptFired && shouldShow()) {
        show();
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, [shouldShow, show]);

  // Listen for appinstalled event
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
                {/* App Icon */}
                <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <img
                    src="/app-icon.png"
                    alt="Rapigo Mali"
                    className="w-9 h-9 rounded-xl object-contain"
                    width={36}
                    height={36}
                  />
                </div>

                {/* Text Content */}
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

                {/* Action Buttons */}
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

                  {/* Dismiss */}
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

            {/* iOS Instruction Panel (shows below banner when on iOS) */}
            {platform === 'ios' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-emerald-50 border-b border-emerald-200 overflow-hidden"
              >
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <ArrowUpRight size={20} className="text-emerald-600" />
                  </div>
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

      {/* iOS Install Instructions Dialog */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Installer sur iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              Suivez ces étapes pour ajouter Rapigo Mali sur votre écran d&apos;accueil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                1
              </div>
              <div className="pt-0.5">
                <p className="font-medium text-sm">Appuyez sur le bouton <strong>Partager</strong></p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  C&apos;est l&apos;icône avec une flèche qui sort d&apos;un carré, en bas de votre écran (Safari).
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                2
              </div>
              <div className="pt-0.5">
                <p className="font-medium text-sm">Scrollez et appuyez sur <strong>« Sur l&apos;écran d&apos;accueil »</strong></p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cette option se trouve dans la liste d&apos;actions qui apparaît.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                3
              </div>
              <div className="pt-0.5">
                <p className="font-medium text-sm">Appuyez sur <strong>« Ajouter »</strong></p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  L&apos;application Rapigo Mali sera ajoutée à votre écran d&apos;accueil.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIosDialogOpen(false)} className="bg-emerald-600 hover:bg-emerald-700">
              J&apos;ai compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}