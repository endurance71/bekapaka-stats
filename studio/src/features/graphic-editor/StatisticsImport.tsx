import { useCallback, useEffect, useState } from 'react';
import { api, message, query } from '../../lib/api';
import type { Season } from '../../lib/seasons';
import type { Snapshot } from '../../lib/types';

type Item = { id: string; title?: string; opponent?: string; date?: string; name?: string };
type Props = {
  variant: string;
  seasons: Season[];
  season: string;
  setSeason: (s: string) => void;
  disabled: boolean;
  importData: (s: Snapshot) => Promise<void>;
};

const kindFor = (variant: string) =>
  variant === 'standings'
    ? 'standings'
    : variant === 'round'
      ? 'round'
      : variant === 'season'
        ? 'season'
        : 'match-statistics';

export default function StatisticsImport({ variant, seasons, season, setSeason, disabled, importData }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState('');
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const kind = kindFor(variant);
  const needsItem = ['round', 'match-statistics'].includes(kind);
  const url = useCallback(
    (id: string, subjectId = '') =>
      `/sources/statistics?${query({
        kind,
        seasonId: season,
        id,
        subjectId,
        view: variant === 'leaders' ? 'leaders' : variant === 'player' && subjectId ? 'player' : 'team',
      })}`,
    [kind, season, variant],
  );

  useEffect(() => {
    let live = true;
    setSelected('');
    setSubject('');
    setSubjects([]);
    setItems([]);
    setError('');
    if (season && needsItem)
      api<Item[]>(
        kind === 'round'
          ? `/sources/rounds?${query({ seasonId: season })}`
          : `/sources/statistical-matches?${query({ seasonId: season })}`,
      )
        .then((r) => live && setItems(r))
        .catch((e) => live && setError(message(e)));
    return () => {
      live = false;
    };
  }, [season, kind, needsItem]);

  useEffect(() => {
    let live = true;
    setSubject('');
    setSubjects([]);
    if (variant === 'player' && selected)
      api<Snapshot>(url(selected))
        .then((r) => live && setSubjects((r.data.subjects || []) as Item[]))
        .catch((e) => live && setError(message(e)));
    return () => {
      live = false;
    };
  }, [selected, variant, url]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      await importData(await api<Snapshot>(url(selected || season, subject)));
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <details open>
      <summary>Statystyki z systemu</summary>
      <div className="form-group">
        <label>
          Sezon
          <select disabled={disabled} value={season} onChange={(e) => setSeason(e.target.value)}>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {needsItem && (
          <label>
            {kind === 'round' ? 'Kolejka' : 'Zakończony mecz'}
            <select disabled={disabled} value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Wybierz…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title || `${i.date?.slice(0, 10)} · ${i.opponent}`}
                </option>
              ))}
            </select>
          </label>
        )}
        {variant === 'player' && (
          <label>
            Zawodnik w tym meczu
            <select
              value={subject}
              disabled={disabled || !subjects.length}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Wybierz zawodnika…</option>
              {subjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="secondary"
          disabled={disabled || loading || !season || (needsItem && !selected) || (variant === 'player' && !subject)}
          onClick={() => void load()}
        >
          {loading ? 'Pobieranie…' : 'Importuj publiczne dane'}
        </button>
        <small>Publiczne dane KALK. Brak wartości pozostaje brakiem danych. Możesz też uzupełnić tabelę ręcznie.</small>
        {error && <p role="alert">{error}</p>}
      </div>
    </details>
  );
}
