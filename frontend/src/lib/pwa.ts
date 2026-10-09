import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Registers the Service Worker in supported browsers.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  // Tylko build produkcyjny: w `vite dev` powłoka z cache SW zasłaniałaby zmiany — stary worker wyrejestrowujemy
  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    // Aplikacja z ekranu głównego bywa otwarta tygodniami bez przeładowania — sprawdzaj nową wersję po powrocie
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration.update().catch(() => undefined);
    });
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return undefined;
  }
}

/**
 * Hook to manage PWA installation via beforeinstallprompt or iOS manual prompt.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(isStandalone);
    if (isStandalone) return;

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIosDevice,
    install,
  };
}

/**
 * Hook to monitor online/offline network connectivity.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

const UPDATE_DISMISSED_KEY = 'bkpk-update-dismissed';
/** Po takiej przerwie w tle powrót do aplikacji od razu włącza nową wersję (krótkie przełączenie nie gubi stanu). */
const AUTO_APPLY_AFTER_HIDDEN_MS = 10 * 60_000;

/** Numer wersji czekającego workera (do zapamiętania „×” per wersja). */
function askWorkerVersion(worker: ServiceWorker): Promise<string> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve('unknown'), 1500);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(typeof e.data === 'string' ? e.data : 'unknown');
    };
    try {
      worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      resolve('unknown');
    }
  });
}

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(UPDATE_DISMISSED_KEY);
  } catch {
    return null;
  }
}

/**
 * Nowa wersja panelu (czekający Service Worker): pigułka „Odśwież”, zamknięcie „×” zapamiętane dla tej wersji,
 * a po dłuższym pobycie aplikacji w tle nowa wersja włącza się sama przy powrocie.
 */
export function usePWAUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(readDismissed);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const found = (worker: ServiceWorker) => {
      setWaitingWorker(worker);
      void askWorkerVersion(worker).then(setVersion);
    };

    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) found(reg.waiting);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) found(newWorker);
        });
      });
    });
  }, []);

  const applyUpdate = useCallback(() => {
    // Przeładowanie dopiero, gdy nowy worker przejmie stronę (inaczej stara wersja wczytałaby się ponownie)
    let reloaded = false;
    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true });
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(reload, 3000);
    } else {
      reload();
    }
  }, [waitingWorker]);

  // Powrót po dłuższej przerwie (aplikacja w tle) = nowa wersja od razu, zanim zawodnik zacznie czytać
  useEffect(() => {
    if (!waitingWorker) return;
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null && Date.now() - hiddenAt >= AUTO_APPLY_AFTER_HIDDEN_MS) {
        applyUpdate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [waitingWorker, applyUpdate]);

  const dismiss = useCallback(() => {
    if (!version) return;
    setDismissed(version);
    try {
      sessionStorage.setItem(UPDATE_DISMISSED_KEY, version);
    } catch {
      // bez zapisu — zamknięcie działa do przeładowania
    }
  }, [version]);

  // Czekamy na numer wersji, żeby zamknięta wcześniej pigułka nie mignęła
  const updateAvailable = Boolean(waitingWorker) && version !== null && dismissed !== version;

  return { updateAvailable, applyUpdate, dismiss };
}
