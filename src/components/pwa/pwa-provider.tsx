'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'studyhub:pwa-install-dismissed';

export function PwaProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  // Register the service worker so the app meets the installability criteria.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            // A new worker finished installing and is waiting. Activate it so
            // users are not pinned to a stale cache after a deploy.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('SKIP_WAITING');
            }
          });
        });
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', () => void register(), { once: true });
    }
  }, []);

  // Capture the install prompt so we can offer our own button.
  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);

      try {
        if (!localStorage.getItem(DISMISS_KEY)) setShowInstall(true);
      } catch {
        setShowInstall(true);
      }
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowInstall(false);
      try {
        localStorage.setItem(DISMISS_KEY, 'installed');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    setShowInstall(false);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowInstall(false);
    try {
      localStorage.setItem(DISMISS_KEY, 'dismissed');
    } catch {}
  };

  if (!showInstall || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-5 left-5 right-5 sm:left-5 sm:right-auto sm:max-w-sm z-40 print:hidden">
      <div className="bg-white rounded-xl shadow-xl border border-grey-light p-4 flex items-start gap-3">
        <div className="shrink-0">
          <img src="/icons/icon-192.png" alt="" width={40} height={40} className="rounded-lg" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy">Install StudyHub</p>
          <p className="text-xs text-grey-medium mt-0.5">
            Add the app to your home screen for faster access, even offline.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Button variant="primary" size="xs" onClick={() => void install()}>
              <Download size={13} className="mr-1" />
              Install
            </Button>
            <Button variant="ghost" size="xs" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 p-1 text-grey-medium hover:text-navy rounded"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default PwaProvider;