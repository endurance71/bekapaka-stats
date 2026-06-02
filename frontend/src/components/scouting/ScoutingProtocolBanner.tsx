import { Info } from 'lucide-react';

interface ScoutingProtocolBannerProps {
  fallbackBasicOnly?: boolean;
  fallbackFromPreviousMatch?: boolean;
  sourceMatchLabel?: string | null;
  sourceMatchDate?: string | null;
}

export function ScoutingProtocolBanner({
  fallbackBasicOnly,
  fallbackFromPreviousMatch,
  sourceMatchLabel,
  sourceMatchDate
}: ScoutingProtocolBannerProps) {
  if (!fallbackBasicOnly && !fallbackFromPreviousMatch) return null;

  let message = 'Brak protokołu dla tego rywala — widoczne są tabela, forma i skład.';
  if (fallbackFromPreviousMatch && !fallbackBasicOnly) {
    message = 'DNA z wcześniejszego meczu z protokołem (brak ostatniego protokołu).';
    if (sourceMatchDate || sourceMatchLabel) {
      const when = [sourceMatchDate, sourceMatchLabel].filter(Boolean).join(' · ');
      message += ` Źródło: ${when}.`;
    }
  } else if (sourceMatchLabel) {
    message += ` Ostatni mecz w bazie: ${sourceMatchLabel}.`;
  }

  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-bkpk-border-subtle/80 bg-bkpk-surface-tint-1/40 px-3 py-2 text-xs leading-relaxed text-bkpk-text-muted"
      role="status"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
