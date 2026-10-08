import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { api, query } from '../../lib/api';
import { initialSourceKind, listPath, sourceLabels, sourcesFor, type SourceKind } from '../../lib/sources';
import type { Season } from '../../lib/seasons';
import type { Snapshot, SourceItem } from '../../lib/types';
import { useEditor } from './editor-context';

type Props = {
  seasons: Season[];
  season: string;
  setSeason: (id: string) => void;
  onImport: (snapshot: Snapshot) => void;
  onCheck: () => Promise<boolean>;
};

const itemLabel = (s: SourceItem) =>
  s.opponent ? `${s.date?.slice(0, 10)} · ${s.opponent}` : s.title || `${s.firstName} ${s.lastName}`;

export default function SourcePanel({ seasons, season, setSeason, onImport, onCheck }: Props) {
  const { project, d, busy, readonly, action, setError } = useEditor();
  const allowed = sourcesFor(project.family);
  const [kind, setKind] = useState<SourceKind | ''>(() =>
    initialSourceKind(project.family, project.variant, d.source.kind),
  );
  const ready = kind !== '' && (kind !== 'match' || !!season);
  const items = useQuery({
    queryKey: ['source-items', kind, kind === 'match' ? season : ''],
    queryFn: () => api<SourceItem[]>(listPath(kind as SourceKind, season)),
    enabled: ready,
  });
  if (!allowed.length || !kind) return null;
  const list = items.data || [];

  return (
    <details open>
      <summary>Dane z systemu</summary>
      <div className="form-group">
        <div className="field-row">
          <label>
            Źródło
            <select value={kind} onChange={(e) => setKind(e.target.value as SourceKind)}>
              {allowed.map((k) => (
                <option key={k} value={k}>
                  {sourceLabels[k]}
                </option>
              ))}
            </select>
          </label>
          {kind === 'match' && (
            <label>
              Sezon
              <select value={season} onChange={(e) => setSeason(e.target.value)}>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label>
          Wybierz dane
          <select
            value=""
            disabled={busy || readonly}
            onChange={(e) => {
              const id = e.target.value;
              if (id)
                void action(async () =>
                  onImport(await api<Snapshot>(`/sources/snapshot?${query({ kind, id, seasonId: season })}`)),
                );
            }}
          >
            <option value="">
              {items.isFetching ? 'Wczytuję…' : list.length ? 'Wybierz pozycję…' : 'Brak dostępnych danych'}
            </option>
            {list.map((s) => (
              <option key={s.id} value={s.id}>
                {itemLabel(s)}
              </option>
            ))}
          </select>
        </label>
        {items.isError && <small className="form-error">{items.error.message}</small>}
        {d.source.kind !== 'manual' && (
          <div className="source-note">
            <span>
              Źródło: {d.source.kind} · {d.source.seasonId}
              <br />
              Dane zapisane w projekcie, korekty pozostają lokalne.
            </span>
            <button
              className="text-button"
              onClick={() =>
                void action(async () => {
                  if (!(await onCheck())) setError('Źródło nie zmieniło się od importu.');
                })
              }
            >
              Sprawdź zmiany <RefreshCw size={13} />
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
