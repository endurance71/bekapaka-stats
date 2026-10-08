import { InfoIcon as Info } from '../../shared/ui/BrandIcon';

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

  let message = 'KALK nie opublikował statystyk meczów tego rywala — widoczne są tabela, forma i skład.';
  if (fallbackFromPreviousMatch && !fallbackBasicOnly) {
    message = 'Styl gry z wcześniejszego meczu (KALK nie opublikował statystyk ostatniego spotkania).';
    if (sourceMatchDate || sourceMatchLabel) {
      const when = [sourceMatchDate, sourceMatchLabel].filter(Boolean).join(' · ');
      message += ` Źródło: ${when}.`;
    }
  } else if (sourceMatchLabel) {
    message += ` Ostatni mecz ze statystykami: ${sourceMatchLabel}.`;
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
