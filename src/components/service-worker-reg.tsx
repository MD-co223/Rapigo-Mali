'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[Rapigo] SW updated');
              }
            });
          }
        });

        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

        console.log('[Rapigo] SW registered successfully, scope:', registration.scope);
      } catch (err) {
        console.warn('[Rapigo] SW registration failed:', err);
        // Retry once after 5 seconds
        setTimeout(() => {
          navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
        }, 5000);
      }
    };

    // Wait for page to fully load before registering SW
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return () => {
      window.removeEventListener('load', registerSW);
    };
  }, []);

  return null;
}