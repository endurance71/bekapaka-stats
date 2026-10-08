import type { AiModel, AiProviderId, AiTaskId } from '../../lib/types';
import { priceLabel, providerLabel, usd } from './format';

type Props = {
  models: AiModel[];
  task: AiTaskId;
  kind: 'text' | 'image';
  value: string;
  onChange: (id: string) => void;
  /** Label of the empty option (the task's model from Settings); without it a model must be chosen. */
  defaultLabel?: string;
  label?: string;
  disabled?: boolean;
  /** Settings may pick a model before its provider has a key; generating needs one. */
  allowUnavailable?: boolean;
};

/** Models of one kind grouped by provider, with price and the worst case of one call. */
export default function ModelSelect({
  models,
  task,
  kind,
  value,
  onChange,
  defaultLabel,
  label = 'Model AI',
  disabled,
  allowUnavailable,
}: Props) {
  const groups = (Object.keys(providerLabel) as AiProviderId[])
    .map((p) => [p, models.filter((m) => m.kind === kind && m.provider === p)] as const)
    .filter(([, list]) => list.length);
  return (
    <select aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {defaultLabel && <option value="">{defaultLabel}</option>}
      {groups.map(([provider, list]) => (
        <optgroup key={provider} label={providerLabel[provider]}>
          {list.map((m) => (
            <option key={m.id} value={m.id} disabled={!allowUnavailable && !m.available && m.id !== value}>
              {m.label}
              {m.custom ? ' (własny)' : ''} · {priceLabel(m)}
              {m.maxCallMicros?.[task] ? ` · maks. ${usd(m.maxCallMicros[task]!)}` : ''}
              {m.available ? '' : ' · brak klucza'}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
