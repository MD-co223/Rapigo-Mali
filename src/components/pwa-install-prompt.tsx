'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getPwaFlags() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || !!(window.navigator as unknown as { standalone?: boolean }).standalone;
  const isDismissed = !!localStorage.getItem('rapigo-pwa-dismissed');
  const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return { shouldHide: isStandalone || isDismissed, isApple };
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isApple] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  });

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('rapigo-pwa-dismissed', 'true');
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowPrompt(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    const { shouldHide, isApple: apple } = getPwaFlags();
    if (shouldHide) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (apple) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 animate-in slide-in-from-bottom-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <img
            src="/app-icon.png"
            alt="Rapigo Mali"
            className="w-10 h-10 rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            Installer Rapigo Mali
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isApple
              ? 'Appuyez sur ˟ puis "Sur l\'écran d\'accueil"'
              : 'Ajoutez l\'app sur votre écran d\'accueil'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isApple ? (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Download size={14} />
              Installer
            </button>
          ) : (
            <button
              onClick={() => setShowPrompt(false)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Smartphone size={14} />
              OK
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}