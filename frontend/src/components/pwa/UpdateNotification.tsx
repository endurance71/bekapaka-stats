import { usePWAUpdate } from '../../lib/pwa';
import { RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function UpdateNotification() {
  const { updateAvailable, applyUpdate } = usePWAUpdate();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-bkpk-surface-elevated border border-bkpk-border-strong border-t-2 border-t-bkpk-primary p-4 shadow-2xl"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 border border-bkpk-border-strong flex items-center justify-center text-bkpk-primary shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display uppercase text-lg leading-none text-bkpk-text-primary">Dostępna nowa wersja</h4>
              <p className="text-xs text-bkpk-text-muted mt-0.5 leading-relaxed">
                Zaktualizuj aplikację, aby wczytać najnowsze statystyki i funkcje.
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={applyUpdate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bkpk-btn-primary text-bkpk-on-primary label-caps text-xs min-h-[44px] transition-colors touch-manipulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Zaktualizuj teraz
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default UpdateNotification;
