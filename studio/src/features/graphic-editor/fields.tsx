import { materialCompatible } from '../../lib/contracts';
import { warsawInput, warsawIso, weekday } from '../../lib/dates';
import { message } from '../../lib/api';
import type { Content } from '../../lib/types';
import { useEditor } from './editor-context';

type StringKey = { [K in keyof Content]-?: NonNullable<Content[K]> extends string ? K : never }[keyof Content];
type NumberKey = { [K in keyof Content]-?: Content[K] extends number | null ? K : never }[keyof Content];
type BoolKey = 'kitBConfirmed' | 'lineupConfirmed' | 'mvpConfirmed';

export function TextField({ k, label, maxLength = 180 }: { k: StringKey; label: string; maxLength?: number }) {
  const { d, field, readonly } = useEditor();
  return (
    <label>
      {label}
      <input
        value={String(d[k] ?? '')}
        maxLength={maxLength}
        disabled={readonly}
        onChange={(e) => field(k, e.target.value as Content[typeof k])}
      />
    </label>
  );
}

export function AreaField({ k, label, maxLength = 1500 }: { k: StringKey; label: string; maxLength?: number }) {
  const { d, field, readonly } = useEditor();
  return (
    <label>
      {label}
      <textarea
        value={String(d[k] ?? '')}
        maxLength={maxLength}
        disabled={readonly}
        onChange={(e) => field(k, e.target.value as Content[typeof k])}
      />
    </label>
  );
}

// An empty number input stores "no data" (null), never zero.
export function NumberField({ k, label }: { k: NumberKey; label: string }) {
  const { d, field, readonly } = useEditor();
  return (
    <label>
      {label}
      <input
        type="number"
        value={d[k] ?? ''}
        disabled={readonly}
        onChange={(e) => field(k, e.target.value === '' ? null : Number(e.target.value))}
      />
    </label>
  );
}

export function DateField({ k, label }: { k: 'date' | 'originalDate'; label: string }) {
  const { d, field, readonly, setError } = useEditor();
  return (
    <label>
      {label}
      <input
        type="datetime-local"
        value={warsawInput(d[k])}
        disabled={readonly}
        onChange={(e) => {
          try {
            field(k, warsawIso(e.target.value));
          } catch (err) {
            setError(message(err));
          }
        }}
      />
      <small>{k === 'date' ? weekday(d[k]) : 'Czas w Polsce'}</small>
    </label>
  );
}

export function Toggle({ k, label }: { k: BoolKey; label: string }) {
  const { d, field, readonly } = useEditor();
  return (
    <label className="check-label">
      <input type="checkbox" checked={d[k]} disabled={readonly} onChange={(e) => field(k, e.target.checked)} />
      {label}
    </label>
  );
}

export function usePhotoOptions() {
  const { assets } = useEditor();
  return assets.filter((a) => ['photo', 'portrait', 'cutout'].includes(a.kind) && a.status !== 'retired');
}

export function ImageSelect({ k, label }: { k: 'photoAssetId' | 'backgroundAssetId'; label: string }) {
  const { d, field, readonly, assets, project } = useEditor();
  const photos = usePhotoOptions();
  const background = k === 'backgroundAssetId';
  const options = background ? assets.filter((a) => a.kind === 'background' && a.status !== 'retired') : photos;
  return (
    <label>
      {label}
      <select value={d[k] || ''} disabled={readonly} onChange={(e) => field(k, e.target.value || null)}>
        <option value="">{background ? 'Materiał z pakietu marki' : 'Wybierz z biblioteki'}</option>
        {options.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {background && !materialCompatible(project, a) ? ' · inny kontekst' : ''}
            {a.status !== 'approved' ? ' · do sprawdzenia' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
