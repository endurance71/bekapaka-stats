import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { message, send } from '../../lib/api';
import { warsawInput, warsawIso } from '../../lib/dates';
import type { Facts, Playbook, Publication } from '../../lib/publications';

type Key = Exclude<keyof Facts, 'kind' | 'leaders' | 'scoreUs' | 'scoreThem' | 'report'>;
const labels: Record<Key, string> = {
  title: 'Tytuł / nagłówek',
  competition: 'Rozgrywki',
  seasonLabel: 'Sezon',
  round: 'Kolejka',
  opponent: 'Rywal',
  date: 'Data i godzina',
  originalDate: 'Poprzedni termin',
  venue: 'Miejsce',
  entryInfo: 'Wstęp',
  person: 'Osoba (imię i nazwisko)',
  partner: 'Partner',
  edition: 'Edycja (cyframi rzymskimi)',
  notes: 'Dodatkowe fakty publiczne',
  link: 'Link (np. artykuł na stronie)',
};
const byKind: Record<Facts['kind'], Key[]> = {
  match: ['competition', 'round', 'opponent', 'date', 'originalDate', 'venue', 'entryInfo', 'person', 'notes', 'link'],
  statistics: ['title', 'competition', 'seasonLabel', 'round', 'opponent', 'notes', 'link'],
  tournament: ['title', 'edition', 'date', 'venue', 'entryInfo', 'notes', 'link'],
  player: ['person', 'opponent', 'date', 'notes', 'link'],
  partner: ['partner', 'title', 'notes', 'link'],
  club: ['title', 'person', 'date', 'venue', 'entryInfo', 'notes', 'link'],
  manual: ['title', 'date', 'venue', 'entryInfo', 'notes', 'link'],
};
const withScore = new Set(['match-result', 'match-report', 'match-live', 'mvp', 'match-leaders']);
const withLeaders = new Set(['match-result', 'match-report', 'mvp', 'match-leaders']);
const stats = ['PTS', 'REB', 'AST', 'PPG', 'RPG', 'APG'];

export default function FactsPanel({
  publication,
  def,
  apply,
  onError,
}: {
  publication: Publication;
  def: Playbook;
  apply: (p: Publication) => void;
  onError: (m: string) => void;
}) {
  const [facts, setFacts] = useState<Facts>(publication.facts);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(facts) !== JSON.stringify(publication.facts);
  useEffect(() => setFacts(publication.facts), [publication.factsHash, publication.facts]);
  const set = <K extends keyof Facts>(k: K, v: Facts[K]) => setFacts((f) => ({ ...f, [k]: v }));
  const keys = byKind[facts.kind].filter((k) => k !== 'originalDate' || def.id === 'postponed');
  const run = async (fn: () => Promise<Publication>) => {
    setBusy(true);
    try {
      apply(await fn());
    } catch (err) {
      onError(message(err));
    } finally {
      setBusy(false);
    }
  };
  const save = () =>
    run(() =>
      send<Publication>(`/publications/${publication.id}`, { expectedRevision: publication.revision, facts }, 'PUT'),
    );

  return (
    <section className="facts-panel">
      <div className="panel-heading">
        <span className="eyebrow">FAKTY · ŹRÓDŁO PRAWDY</span>
        <h2>Fakty publikacji</h2>
      </div>
      <p className={`facts-state ${publication.factsConfirmed && !dirty ? 'is-confirmed' : ''}`}>
        {publication.factsConfirmed && !dirty ? (
          <>
            <Check size={14} /> Potwierdzone — teksty i AI mogą z nich korzystać.
          </>
        ) : (
          'Sprawdź i potwierdź fakty. Każdy tekst może używać wyłącznie tych informacji.'
        )}
      </p>
      {publication.sourceRef && (
        <div className="source-note">
          <span>
            Źródło: KALK · mecz {publication.sourceRef.id}
            <br />
            Wynik, kolejka i liderzy pochodzą z systemu statystyk.
          </span>
          <button
            className="text-button"
            disabled={busy || dirty}
            onClick={() =>
              void run(() =>
                send<Publication>(`/publications/${publication.id}/refresh-facts`, {
                  expectedRevision: publication.revision,
                }),
              )
            }
          >
            Odśwież z KALK <RefreshCw size={13} />
          </button>
        </div>
      )}
      <div className="form-group">
        {withScore.has(def.id) && (
          <div className="score-inputs">
            {(['scoreUs', 'scoreThem'] as const).map((k) => (
              <label key={k}>
                {k === 'scoreUs' ? 'BeKaPaKa' : 'Rywal'}
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={facts[k] ?? ''}
                  onChange={(e) => set(k, e.target.value === '' ? null : Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        )}
        {keys.map((k) =>
          k === 'date' || k === 'originalDate' ? (
            <label key={k}>
              {labels[k]}
              <input
                type="datetime-local"
                value={warsawInput(facts[k])}
                onChange={(e) => {
                  try {
                    set(k, warsawIso(e.target.value));
                  } catch (err) {
                    onError(message(err));
                  }
                }}
              />
            </label>
          ) : k === 'notes' ? (
            <label key={k}>
              {labels[k]}
              <textarea value={facts[k]} maxLength={1500} onChange={(e) => set(k, e.target.value)} />
              <small>Tylko informacje publiczne i potwierdzone. Bez notatek trenera.</small>
            </label>
          ) : (
            <label key={k}>
              {labels[k]}
              <input value={facts[k]} onChange={(e) => set(k, e.target.value)} />
            </label>
          ),
        )}
        {withLeaders.has(def.id) && (
          <fieldset className="leaders-editor">
            <legend>Liderzy / statystyki</legend>
            {facts.leaders.map((l, i) => (
              <div className="leader-row" key={i}>
                <input
                  aria-label={`Zawodnik ${i + 1}`}
                  placeholder="Imię i nazwisko"
                  value={l.name}
                  onChange={(e) =>
                    set(
                      'leaders',
                      facts.leaders.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                    )
                  }
                />
                <input
                  aria-label={`Wartość ${i + 1}`}
                  placeholder="24"
                  value={l.value}
                  onChange={(e) =>
                    set(
                      'leaders',
                      facts.leaders.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                    )
                  }
                />
                <select
                  aria-label={`Statystyka ${i + 1}`}
                  value={l.stat}
                  onChange={(e) =>
                    set(
                      'leaders',
                      facts.leaders.map((x, j) => (j === i ? { ...x, stat: e.target.value } : x)),
                    )
                  }
                >
                  {stats.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  aria-label="Usuń"
                  onClick={() =>
                    set(
                      'leaders',
                      facts.leaders.filter((_, j) => j !== i),
                    )
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {facts.leaders.length < 12 && (
              <button
                className="text-button"
                onClick={() => set('leaders', [...facts.leaders, { name: '', value: '', stat: 'PTS' }])}
              >
                + Dodaj
              </button>
            )}
          </fieldset>
        )}
        {facts.report && (
          <div className="report-summary" role="note">
            <b>Statystyki meczu z KALK</b>
            <span>
              {[
                facts.report.quarters.length
                  ? `kwarty: ${facts.report.quarters.map((q) => `${q.us}:${q.them}`).join(', ')}`
                  : '',
                facts.report.players.length ? `${facts.report.players.length} zawodników BeKaPaKa` : '',
                facts.report.team ? 'statystyki zespołów' : '',
                facts.report.mvp ? `MVP: ${facts.report.mvp.name}` : '',
                facts.report.nextMatch ? `następny mecz: ${facts.report.nextMatch.opponent}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <small>Relacja na stronę korzysta z tych danych. Aktualizują się przez „Odśwież z KALK”.</small>
          </div>
        )}
      </div>
      <div className="facts-actions">
        <button className="secondary" disabled={!dirty || busy} onClick={() => void save()}>
          Zapisz fakty
        </button>
        <button
          className="primary"
          disabled={dirty || busy || publication.factsConfirmed}
          onClick={() =>
            void run(() =>
              send<Publication>(`/publications/${publication.id}/confirm-facts`, {
                expectedRevision: publication.revision,
              }),
            )
          }
        >
          <Check size={16} /> Potwierdzam fakty
        </button>
      </div>
      <details className="playbook-schema">
        <summary>Schemat: {def.label}</summary>
        <p>
          <b>Kiedy:</b> {def.timing}
        </p>
        <p>
          <b>Co musi paść:</b> {def.hint}
        </p>
      </details>
    </section>
  );
}
