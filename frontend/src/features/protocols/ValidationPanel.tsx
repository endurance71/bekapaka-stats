import { useMemo } from 'react';
import type { ValidationResult } from './types';

interface ValidationPanelProps {
  validation: ValidationResult;
}

export default function ValidationPanel({ validation }: ValidationPanelProps) {
  // Memoize the rendering decision — avoid re-rendering when nothing changed
  const hasIssues = useMemo(() => validation.issues.length > 0, [validation.issues]);

  if (!hasIssues) return null;

  return (
    <div className="bg-bkpk-warning/10 border border-bkpk-warning/30 p-4 rounded-xl text-bkpk-text-primary text-sm mb-6">
      <strong className="text-bkpk-warning block mb-2">Walidacja</strong>
      <ul className="list-disc pl-5 space-y-1">
        {validation.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-bkpk-text-muted font-bold pt-3 border-t border-bkpk-warning/20">
        <span className={validation.scoreMismatch ? 'text-bkpk-danger' : 'text-bkpk-success'}>
          Boxscore: {validation.scoreMismatch ? 'BŁĄD' : 'OK'}
        </span>
        <span className={validation.quartersMismatch ? 'text-bkpk-danger' : 'text-bkpk-success'}>
          Kwarty: {validation.quartersMismatch ? 'BŁĄD' : 'OK'}
        </span>
        <span className={validation.fiveMinMismatch ? 'text-bkpk-danger' : 'text-bkpk-success'}>
          5‑min: {validation.fiveMinMismatch ? 'BŁĄD' : 'OK'}
        </span>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-bkpk-text-muted opacity-80">
        <div><strong>Legenda błędów:</strong></div>
        <div>• Czerwone pola w boxscore = C &gt; W (np. 2P/3P/FT)</div>
        <div>• Czerwone pola w kwartach = niezgodne z 5‑min</div>
        <div>• Czerwone PKT w „W sumie" = suma boxscore nie zgadza się z wynikiem</div>
      </div>
    </div>
  );
}
