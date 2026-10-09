import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  updateAvailable: boolean;
  applyUpdate: () => void;
  dismiss: () => void;
}

/** Mała pigułka nad paskiem gestów: „Nowa wersja · Odśwież · ×” — nie zasłania treści. */
export function UpdateNotification({ updateAvailable, applyUpdate, dismiss }: UpdateNotificationProps) {
  if (!updateAvailable) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-50 flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center h-11 bg-bkpk-surface-elevated border border-bkpk-border-strong shadow-2xl select-none">
        <span className="pl-3.5 pr-2 label-caps text-[11px] text-bkpk-text-secondary whitespace-nowrap">Nowa wersja</span>
        <button
          type="button"
          onClick={applyUpdate}
          className="flex items-center gap-1.5 h-full px-3 bkpk-btn-primary text-bkpk-on-primary label-caps text-[11px] touch-manipulation"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Odśwież
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Zamknij informację o nowej wersji"
          className="flex items-center justify-center w-11 h-full text-bkpk-text-muted hover:text-bkpk-text-primary touch-manipulation"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
export default UpdateNotification;
