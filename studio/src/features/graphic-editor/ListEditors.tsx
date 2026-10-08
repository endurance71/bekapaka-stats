import { useState } from 'react';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { message } from '../../lib/api';
import { warsawInput, warsawIso } from '../../lib/dates';
import type { Content } from '../../lib/types';
import { useEditor } from './editor-context';
import { AreaField, ImageSelect, TextField, Toggle, usePhotoOptions } from './fields';

type Lineup = Content['lineup'];
type Statistic = Content['statistics'][number];
const statLabels: Statistic['label'][] = ['PTS', 'REB', 'AST', 'PPG', 'RPG', 'APG'];

// Swap with a neighbour; the first item cannot move earlier, the last cannot move later.
export function move<T>(list: T[], i: number, delta: -1 | 1): T[] {
  const j = i + delta;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
const replaceAt = <T,>(list: T[], i: number, patch: Partial<T>) =>
  list.map((x, j) => (j === i ? { ...x, ...patch } : x));

function MoveButtons({
  i,
  length,
  onMove,
  label,
}: {
  i: number;
  length: number;
  onMove: (d: -1 | 1) => void;
  label: string;
}) {
  const { readonly } = useEditor();
  return (
    <>
      <button
        className="icon-button"
        aria-label={`${label} wcześniej`}
        disabled={readonly || i === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={15} />
      </button>
      <button
        className="icon-button"
        aria-label={`${label} później`}
        disabled={readonly || i === length - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={15} />
      </button>
    </>
  );
}

export function StatisticsTable() {
  const { d, field, readonly } = useEditor();
  const rows = d.tableRows || [];
  const set = (next: typeof rows) => field('tableRows', next);
  return (
    <details open>
      <summary>Dane do publikacji</summary>
      <div className="form-group">
        <p className="muted small">Brak danych pozostaw pusty. Zero wpisz wyłącznie, gdy jest potwierdzone w źródle.</p>
        <label>
          Kontekst
          <select
            value={d.statScope || 'match'}
            disabled={readonly}
            onChange={(e) => field('statScope', e.target.value as 'match' | 'season')}
          >
            <option value="match">Konkretny mecz / kolejka</option>
            <option value="season">Sezon</option>
          </select>
        </label>
        {rows.map((row, i) => (
          <div className="data-table-row" key={i}>
            <input
              aria-label={`Etykieta ${i + 1}`}
              placeholder="Zawodnik, drużyna lub statystyka"
              maxLength={100}
              value={row.label}
              disabled={readonly}
              onChange={(e) => set(replaceAt(rows, i, { label: e.target.value }))}
            />
            <input
              aria-label={`Wartość ${i + 1}`}
              placeholder="Potwierdzona wartość"
              maxLength={80}
              value={row.value}
              disabled={readonly}
              onChange={(e) => set(replaceAt(rows, i, { value: e.target.value }))}
            />
            <input
              aria-label={`Szczegóły ${i + 1}`}
              placeholder="Opis, bilans lub etykieta"
              maxLength={100}
              value={row.detail}
              disabled={readonly}
              onChange={(e) => set(replaceAt(rows, i, { detail: e.target.value }))}
            />
            <button className="text-button" disabled={readonly} onClick={() => set(rows.filter((_, j) => i !== j))}>
              Usuń wiersz
            </button>
          </div>
        ))}
        <button
          className="text-button"
          disabled={readonly || rows.length >= 60}
          onClick={() => set([...rows, { label: '', value: '', detail: '' }])}
        >
          + Dodaj wiersz
        </button>
      </div>
    </details>
  );
}

// A statistic is stored only with a confirmed number: clearing the input never turns into 0.
export function PlayerStatistics() {
  const { d, field, readonly } = useEditor();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [newLabel, setNewLabel] = useState<Statistic['label']>('PTS');
  const [newValue, setNewValue] = useState('');
  const valid = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 999;
  return (
    <details>
      <summary>Wybrane statystyki</summary>
      <div className="form-group">
        <p className="muted small">
          Wybierz do 3 liczb. PTS/REB/AST dotyczą meczu, PPG/RPG/APG — średniej sezonu. Potwierdź ich źródło przed
          eksportem.
        </p>
        {d.statistics.map((s, i) => {
          const shown = drafts[i] ?? String(s.value);
          return (
            <div className="list-editor" key={i}>
              <select
                aria-label="Etykieta statystyki"
                value={s.label}
                disabled={readonly}
                onChange={(e) =>
                  field('statistics', replaceAt(d.statistics, i, { label: e.target.value as Statistic['label'] }))
                }
              >
                {statLabels.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                max="999"
                step="0.1"
                aria-label="Wartość statystyki"
                aria-invalid={!valid(shown)}
                value={shown}
                disabled={readonly}
                onChange={(e) => {
                  const v = e.target.value;
                  setDrafts((x) => ({ ...x, [i]: v }));
                  if (valid(v)) field('statistics', replaceAt(d.statistics, i, { value: Number(v) }));
                }}
                onBlur={() => setDrafts((x) => Object.fromEntries(Object.entries(x).filter(([k]) => Number(k) !== i)))}
              />
              <button
                className="icon-button"
                aria-label="Usuń statystykę"
                disabled={readonly}
                onClick={() => {
                  setDrafts({});
                  field(
                    'statistics',
                    d.statistics.filter((_, j) => j !== i),
                  );
                }}
              >
                <X size={15} />
              </button>
              {!valid(shown) && <small className="form-error">Wpisz potwierdzoną liczbę albo usuń statystykę.</small>}
            </div>
          );
        })}
        {d.statistics.length < 3 && !readonly && (
          <div className="list-editor">
            <select
              aria-label="Nowa statystyka"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value as Statistic['label'])}
            >
              {statLabels.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              max="999"
              step="0.1"
              aria-label="Wartość nowej statystyki"
              placeholder="Wartość"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button
              className="text-button"
              disabled={!valid(newValue)}
              onClick={() => {
                field('statistics', [...d.statistics, { label: newLabel, value: Number(newValue) }]);
                setNewValue('');
              }}
            >
              + Dodaj
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

export function LineupEditor() {
  const { d, field, readonly, players } = useEditor();
  const set = (next: Lineup) => field('lineup', next);
  return (
    <details open>
      <summary>Skład meczowy</summary>
      <div className="form-group">
        <label>
          Dodaj zawodnika
          <select
            value=""
            disabled={readonly}
            onChange={(e) => {
              const p = players.find((x) => x.id === e.target.value);
              if (p && !d.lineup.some((x) => x.id === p.id))
                set([
                  ...d.lineup,
                  {
                    id: p.id,
                    firstName: p.firstName || '',
                    lastName: p.lastName || '',
                    number: p.number || '',
                    position: p.position || '',
                  },
                ]);
            }}
          >
            <option value="">Wybierz z rosteru…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={d.lineup.some((x) => x.id === p.id)}>
                {p.firstName} {p.lastName} · #{p.number}
              </option>
            ))}
          </select>
        </label>
        {d.lineup.map((p, i) => (
          <div className="lineup-editor" key={`${p.id}-${i}`}>
            <input
              aria-label={`Imię ${i + 1}`}
              placeholder="Imię"
              value={p.firstName}
              maxLength={60}
              disabled={readonly}
              onChange={(e) => set(replaceAt(d.lineup, i, { firstName: e.target.value }))}
            />
            <input
              aria-label={`Nazwisko ${i + 1}`}
              placeholder="Nazwisko"
              value={p.lastName}
              maxLength={80}
              disabled={readonly}
              onChange={(e) => set(replaceAt(d.lineup, i, { lastName: e.target.value }))}
            />
            <input
              aria-label={`Numer ${i + 1}`}
              placeholder="Nr"
              value={p.number}
              maxLength={3}
              inputMode="numeric"
              disabled={readonly}
              onChange={(e) => set(replaceAt(d.lineup, i, { number: e.target.value }))}
            />
            <input
              aria-label={`Pozycja ${i + 1}`}
              placeholder="Pozycja"
              value={p.position}
              maxLength={40}
              disabled={readonly}
              onChange={(e) => set(replaceAt(d.lineup, i, { position: e.target.value }))}
            />
            <div className="row-actions">
              <MoveButtons
                i={i}
                length={d.lineup.length}
                label="Przesuń zawodnika"
                onMove={(delta) => set(move(d.lineup, i, delta))}
              />
              <button
                className="icon-button"
                aria-label="Usuń zawodnika"
                disabled={readonly}
                onClick={() => set(d.lineup.filter((_, j) => j !== i))}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
        <button
          className="text-button"
          disabled={readonly}
          onClick={() => set([...d.lineup, { id: '', firstName: '', lastName: '', number: '', position: '' }])}
        >
          + Dodaj ręcznie
        </button>
        <Toggle k="lineupConfirmed" label="Potwierdzam skład na ten konkretny mecz" />
      </div>
    </details>
  );
}

export function ScheduleEditor() {
  const { d, field, readonly, setError } = useEditor();
  const rows = d.schedule;
  const set = (next: typeof rows) => field('schedule', next);
  return (
    <details open>
      <summary>Pozycje terminarza</summary>
      <div className="form-group">
        {rows.map((row, i) => (
          <div className="schedule-editor" key={i}>
            <label>
              Data
              <input
                type="datetime-local"
                value={warsawInput(row.date)}
                disabled={readonly}
                onChange={(e) => {
                  try {
                    set(replaceAt(rows, i, { date: warsawIso(e.target.value) }));
                  } catch (err) {
                    setError(message(err));
                  }
                }}
              />
            </label>
            <div className="list-editor">
              <input
                aria-label="Rywal"
                placeholder="Rywal"
                value={row.opponent}
                disabled={readonly}
                onChange={(e) => set(replaceAt(rows, i, { opponent: e.target.value }))}
              />
              <input
                aria-label="Kolejka"
                placeholder="Kolejka"
                value={row.round}
                disabled={readonly}
                onChange={(e) => set(replaceAt(rows, i, { round: e.target.value }))}
              />
              <button
                className="icon-button"
                aria-label="Usuń pozycję"
                disabled={readonly}
                onClick={() => set(rows.filter((_, j) => j !== i))}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
        <button
          className="text-button"
          disabled={readonly}
          onClick={() => set([...rows, { date: '', opponent: '', round: '' }])}
        >
          + Dodaj termin
        </button>
      </div>
    </details>
  );
}

export function CarouselEditor() {
  const { d, field, readonly } = useEditor();
  const photos = usePhotoOptions();
  const slides = d.slides;
  const set = (next: typeof slides) => field('slides', next);
  return (
    <details open>
      <summary>Slajdy karuzeli</summary>
      <div className="form-group">
        {slides.map((s, i) => (
          <div className="schedule-editor" key={i}>
            <div className="section-title">
              <b>Slajd {i + 1}</b>
              <div className="row-actions">
                <MoveButtons
                  i={i}
                  length={slides.length}
                  label="Przesuń slajd"
                  onMove={(delta) => set(move(slides, i, delta))}
                />
              </div>
            </div>
            <label>
              Tytuł
              <input
                value={s.title}
                maxLength={180}
                disabled={readonly}
                onChange={(e) => set(replaceAt(slides, i, { title: e.target.value }))}
              />
            </label>
            <label>
              Treść
              <textarea
                value={s.body}
                maxLength={600}
                disabled={readonly}
                onChange={(e) => set(replaceAt(slides, i, { body: e.target.value }))}
              />
            </label>
            <label>
              Tekst alternatywny slajdu
              <textarea
                value={s.altText}
                maxLength={1500}
                disabled={readonly}
                onChange={(e) => set(replaceAt(slides, i, { altText: e.target.value }))}
              />
            </label>
            <label>
              Zdjęcie
              <select
                value={s.assetId || ''}
                disabled={readonly}
                onChange={(e) => set(replaceAt(slides, i, { assetId: e.target.value || null }))}
              >
                <option value="">Wybierz materiał</option>
                {photos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="text-button" disabled={readonly} onClick={() => set(slides.filter((_, j) => j !== i))}>
              Usuń slajd
            </button>
          </div>
        ))}
        {slides.length < 4 && (
          <button
            className="text-button"
            disabled={readonly}
            onClick={() => set([...slides, { title: '', body: '', altText: '', assetId: null }])}
          >
            + Dodaj slajd
          </button>
        )}
      </div>
    </details>
  );
}

export function PartnersPicker() {
  const { d, field, readonly, partners } = useEditor();
  return (
    <details open>
      <summary>Wybór partnerów</summary>
      <div className="form-group">
        {partners
          .filter((p) => p.status !== 'retired')
          .map((p) => (
            <label className="check-label" key={p.id}>
              <input
                type="checkbox"
                checked={d.partnerIds.includes(p.id)}
                disabled={readonly}
                onChange={(e) =>
                  field(
                    'partnerIds',
                    e.target.checked ? [...d.partnerIds, p.id] : d.partnerIds.filter((id) => id !== p.id),
                  )
                }
              />
              {p.name}
              {p.status !== 'approved' && <small>do sprawdzenia</small>}
            </label>
          ))}
      </div>
    </details>
  );
}

export function PhotoPanel() {
  const { d, field, readonly } = useEditor();
  const labels = { x: 'Kadr poziomo', y: 'Kadr pionowo', zoom: 'Skala' } as const;
  return (
    <details open>
      <summary>Zdjęcie i kadrowanie</summary>
      <div className="form-group">
        <ImageSelect k="photoAssetId" label="Zdjęcie" />
        {(['x', 'y', 'zoom'] as const).map((k) => (
          <label key={k}>
            {labels[k]}
            <input
              type="range"
              min={k === 'zoom' ? 1 : 0}
              max={k === 'zoom' ? 3 : 1}
              step="0.01"
              value={d.crop[k]}
              disabled={readonly}
              onChange={(e) => field('crop', { ...d.crop, [k]: Number(e.target.value) })}
            />
          </label>
        ))}
        <p className="muted small">Historyczny herb na prawdziwym stroju pozostaje na fotografii.</p>
      </div>
    </details>
  );
}

export function CaptionPanel() {
  return (
    <details>
      <summary>Opis posta i dostępność</summary>
      <div className="form-group">
        <AreaField k="caption" label="Opis posta" maxLength={4000} />
        <AreaField k="altText" label="Tekst alternatywny" />
        <TextField k="link" label="Link" maxLength={500} />
      </div>
    </details>
  );
}
