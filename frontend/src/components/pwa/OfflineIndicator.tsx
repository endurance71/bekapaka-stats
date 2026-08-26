import { useOnlineStatus } from '../../lib/pwa';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 bg-bkpk-warning text-black font-bold text-xs py-1.5 px-4 flex items-center justify-center gap-2 shadow-lg select-none"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Brak połączenia z internetem — tryb offline (zapisane statystyki są nadal dostępne).</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default OfflineIndicator;
