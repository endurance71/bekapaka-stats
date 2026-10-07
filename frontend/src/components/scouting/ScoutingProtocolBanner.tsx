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

  let message = 'Brak box score KALK dla tego rywala — widoczne są tabela, forma i skład.';
  if (fallbackFromPreviousMatch && !fallbackBasicOnly) {
    message = 'DNA z wcześniejszego meczu KALK (brak box score z ostatniego spotkania).';
    if (sourceMatchDate || sourceMatchLabel) {
      const when = [sourceMatchDate, sourceMatchLabel].filter(Boolean).join(' · ');
      message += ` Źródło: ${when}.`;
    }
  } else if (sourceMatchLabel) {
    message += ` Ostatni mecz w bazie: ${sourceMatchLabel}.`;
  }

  return (
    <div
      className="flex items-start gap-3 border border-bkpk-border-subtle border-l-2 border-l-bkpk-text-muted bg-bkpk-surface px-4 py-3 text-sm leading-relaxed text-bkpk-text-secondary"
      role="status"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-bkpk-text-muted" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
