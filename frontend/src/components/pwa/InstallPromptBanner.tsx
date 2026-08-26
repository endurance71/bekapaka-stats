import { useState, useEffect } from 'react';
import { usePWAInstall } from '../../lib/pwa';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';

const DISMISSED_KEY = 'bkpk_pwa_install_dismissed_at';
const DISMISS_DURATION_DAYS = 7;

export function InstallPromptBanner() {
  const { isInstallable, isInstalled, isIosDevice, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const diffMs = Date.now() - parseInt(dismissedAt, 10);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < DISMISS_DURATION_DAYS) {
        setIsDismissed(true);
        return;
      }
    }

    // Delay showing the banner by 4 seconds for a non-intrusive experience
    const timer = setTimeout(() => {
      setIsDismissed(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  const handleAction = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) {
        setIsDismissed(true);
      }
    } else if (isIosDevice) {
      setShowIosModal(true);
    }
  };

  // Don't show if already installed, dismissed, or unsupported
  if (isInstalled || isDismissed || (!isInstallable && !isIosDevice)) {
    return (
      <>
        {showIosModal && (
          <IosInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-bkpk-surface-tint-2 border border-bkpk-primary/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          role="dialog"
          aria-label="Zainstaluj aplikację BeKaPaKa"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-bkpk-bg border border-bkpk-border-strong overflow-hidden flex items-center justify-center shrink-0 p-1">
              <img src="/logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-outfit font-black text-sm text-bkpk-text-primary flex items-center gap-1.5">
                <span>Zainstaluj BeKaPaKa</span>
                <Smartphone className="w-3.5 h-3.5 text-bkpk-primary" />
              </h4>
              <p className="text-xs text-bkpk-text-muted mt-0.5 leading-relaxed">
                Błyskawiczny dostęp do statystyk prosto z ekranu głównego telefonu.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-bkpk-text-muted hover:text-bkpk-text-primary min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
              aria-label="Nie teraz"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2 text-xs font-bold text-bkpk-text-muted hover:text-bkpk-text-primary rounded-xl transition-colors"
            >
              Nie teraz
            </button>
            <button
              type="button"
              onClick={handleAction}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-bkpk-primary hover:bg-bkpk-primary-hover text-bkpk-on-primary rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-bkpk-glow touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              {isIosDevice ? 'Jak dodać' : 'Zainstaluj'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <IosInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} />
    </>
  );
}

function IosInstallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instalacja na iOS (iPhone / iPad)">
      <div className="space-y-4 text-sm text-bkpk-text-secondary">
        <p>
          Aby dodać <strong>BeKaPaKa Stats</strong> do ekranu początkowego w Safari:
        </p>
        <ol className="space-y-3 font-medium bg-bkpk-surface-tint-1 p-4 rounded-xl border border-bkpk-border-subtle">
          <li className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-bkpk-primary/20 text-bkpk-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>
              Dotknij przycisku <strong>Udostępnij</strong> (<Share className="w-4 h-4 inline text-bkpk-primary" />) na dolnym pasku przeglądarki Safari.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-bkpk-primary/20 text-bkpk-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>
              Przewiń w dół i wybierz opcję <strong>„Do ekranu początkowego”</strong> (<PlusSquare className="w-4 h-4 inline text-bkpk-primary" />).
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-bkpk-primary/20 text-bkpk-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>
              Kliknij <strong>„Dodaj”</strong> w prawym górnym rogu. Gotowe!
            </span>
          </li>
        </ol>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-bkpk-primary text-bkpk-on-primary rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Rozumiem
          </button>
        </div>
      </div>
    </Modal>
  );
}
export default InstallPromptBanner;
