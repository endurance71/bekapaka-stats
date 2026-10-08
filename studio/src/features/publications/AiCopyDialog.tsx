import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, Sparkles } from 'lucide-react';
import Modal from '../../components/Modal';
import { api, message, send } from '../../lib/api';
import { keys, useBudget } from '../../lib/queries';
import ModelSelect from '../ai/ModelSelect';
import { usd } from '../ai/format';
import {
  channels,
  hasErrors,
  lintCopy,
  mainText,
  type AnyCopy,
  type ChannelId,
  type Publication,
} from '../../lib/publications';
import type { Job } from '../../lib/types';
import { ChannelBadge, Issues } from './bits';

type CopyResult = {
  copy: Partial<Record<ChannelId, AnyCopy>>;
  promptVersion: string;
  model: string;
  factsHash?: string;
};
type Answer = { cached: true; result: CopyResult } | { cached: false; job: Job };

// AI proposals never overwrite anything by themselves: the owner applies each channel explicitly.
export default function AiCopyDialog({
  publication,
  initialChannels,
  apply,
  onClose,
}: {
  publication: Publication;
  initialChannels: ChannelId[];
  apply: (p: Publication) => void;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const budget = useBudget();
  const drafts = publication.items.filter((i) => i.status === 'draft').map((i) => i.channel);
  const [selected, setSelected] = useState<ChannelId[]>(initialChannels.filter((c) => drafts.includes(c)));
  const [brief, setBrief] = useState('');
  const [model, setModel] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [result, setResult] = useState<(CopyResult & { cached: boolean }) | null>(null);
  const [applied, setApplied] = useState<ChannelId[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const b = budget.data;
  // Empty choice = the model set for this task in Settings.
  const task = b?.tasks.find((t) => t.id === 'copy');
  const chosen = model ? b?.models.find((m) => m.id === model) : b?.models.find((m) => m.id === task?.model);
  const ready = !!(model ? chosen?.available : task?.available);
  const maxCall = model ? chosen?.maxCallMicros?.copy : task?.maxCallMicros;

  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const next = await api<Job>(`/jobs/${job.id}`);
        setJob(next);
        if (next.status === 'completed') setResult({ ...(next.result as unknown as CopyResult), cached: false });
        if (['failed', 'uncertain'].includes(next.status)) setError(next.error || 'AI nie przygotowało tekstów.');
        if (!['queued', 'running'].includes(next.status)) void client.invalidateQueries({ queryKey: keys.budget });
      } catch (err) {
        setError(message(err));
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [job, client]);

  async function generate() {
    setBusy(true);
    setError('');
    setResult(null);
    setApplied([]);
    try {
      const answer = await send<Answer>(`/publications/${publication.id}/ai-copy`, {
        channels: selected,
        brief,
        ...(model ? { model } : {}),
      });
      if (answer.cached) setResult({ ...answer.result, cached: true });
      else setJob(answer.job);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function use(channel: ChannelId, copy: AnyCopy) {
    const item = publication.items.find((i) => i.channel === channel);
    if (!item || !result) return;
    try {
      const view = await send<Publication>(
        `/publications/${publication.id}/items/${item.id}`,
        { expectedRevision: item.revision, copy, copyOrigin: 'ai', promptVersion: result.promptVersion },
        'PUT',
      );
      apply(view);
      setApplied((a) => [...a, channel]);
    } catch (err) {
      setError(message(err));
    }
  }

  const running = !!job && ['queued', 'running'].includes(job.status);
  const staleFacts = !!result?.factsHash && result.factsHash !== publication.factsHash;
  return (
    <Modal eyebrow="POMOC AI" title="Teksty kanałów z AI" onClose={onClose} className="ai-copy-modal">
      {!publication.factsConfirmed ? (
        <p className="facts-state">AI dostaje wyłącznie potwierdzone fakty. Najpierw potwierdź fakty publikacji.</p>
      ) : !result ? (
        <>
          <p className="muted small">
            Model AI pisze według zasad marki i instrukcji kanałów (strona „Prompty”), tylko z potwierdzonych faktów.
            Propozycje przechodzą tę samą kontrolę marki co teksty ręczne. Niczego nie zapisuje bez Twojej decyzji.
          </p>
          <fieldset className="channel-picker">
            <legend>Kanały (tylko robocze)</legend>
            {publication.items.map((i) => (
              <label key={i.id} className="check-label">
                <input
                  type="checkbox"
                  disabled={i.status !== 'draft'}
                  checked={selected.includes(i.channel)}
                  onChange={(e) =>
                    setSelected(e.target.checked ? [...selected, i.channel] : selected.filter((c) => c !== i.channel))
                  }
                />
                <ChannelBadge channel={i.channel} decorative /> {channels[i.channel].label}
                {i.status !== 'draft' && <small> · {i.status === 'approved' ? 'zatwierdzony' : i.status}</small>}
              </label>
            ))}
          </fieldset>
          <label>
            Wskazówka (opcjonalnie) — akcent, ton; to nie jest fakt
            <textarea
              rows={2}
              maxLength={500}
              value={brief}
              placeholder="np. podkreśl doping kibiców z Bobolic"
              onChange={(e) => setBrief(e.target.value)}
            />
          </label>
          {b && (
            <label className="ai-model">
              Model
              <ModelSelect
                models={b.models}
                task="copy"
                kind="text"
                value={model}
                onChange={setModel}
                defaultLabel={`Z ustawień: ${b.models.find((m) => m.id === task?.model)?.label ?? task?.model ?? '—'}`}
              />
            </label>
          )}
          <p className="muted small">
            {b
              ? `Budżet: ${usd(b.remainingMicros, 2)} w tym miesiącu · rezerwacja ≤ ${maxCall ? usd(maxCall) : '—'} · te same fakty i prompt nie są płatne drugi raz.`
              : 'Budżet AI niedostępny.'}
            {b &&
              !ready &&
              ' Brak klucza API dostawcy tego modelu — dodaj go w Ustawieniach albo użyj „Wypełnij ze schematu”.'}
          </p>
          {running && (
            <p className="ai-progress">
              <LoaderCircle size={15} className="spin" />{' '}
              {job?.status === 'queued' ? 'Czeka w kolejce…' : `${chosen?.label ?? 'AI'} pisze teksty…`}
            </p>
          )}
          <div className="modal-actions">
            <button className="secondary" onClick={onClose}>
              Anuluj
            </button>
            <button
              className="primary"
              disabled={busy || running || !selected.length || !ready}
              onClick={() => void generate()}
            >
              <Sparkles size={16} /> Generuj ({selected.length})
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted small">
            {result.cached ? 'Wynik z pamięci podręcznej (bez kosztu).' : 'Nowa propozycja.'} Model {result.model} ·
            prompt {result.promptVersion}
          </p>
          {staleFacts && (
            <p className="form-error">Fakty zmieniły się od wysłania żądania — sprawdź, czy tekst jest aktualny.</p>
          )}
          {(Object.entries(result.copy) as [ChannelId, AnyCopy][]).map(([channel, copy]) => {
            const issues = lintCopy(channel, copy, publication.facts);
            const done = applied.includes(channel);
            return (
              <article key={channel} className="ai-proposal">
                <header>
                  <ChannelBadge channel={channel} decorative /> <b>{channels[channel].label}</b>
                  <button
                    className={done ? 'secondary' : 'primary'}
                    disabled={done}
                    onClick={() => void use(channel, copy)}
                  >
                    {done ? (
                      <>
                        <Check size={14} /> Zastosowano
                      </>
                    ) : (
                      'Zastosuj w kanale'
                    )}
                  </button>
                </header>
                <pre>{mainText({ channel, copy }, null)}</pre>
                <Issues issues={issues} />
                {hasErrors(issues) && <p className="muted small">Po zastosowaniu popraw błędy przed zatwierdzeniem.</p>}
              </article>
            );
          })}
          <div className="modal-actions">
            <button className="secondary" onClick={() => setResult(null)}>
              Wygeneruj ponownie
            </button>
            <button className="primary" onClick={onClose}>
              Gotowe
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </Modal>
  );
}
