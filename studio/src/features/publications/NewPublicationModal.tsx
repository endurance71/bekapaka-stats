import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import Modal from '../../components/Modal';
import { api, message, query, send } from '../../lib/api';
import { warsawInput, warsawIso } from '../../lib/dates';
import { keys, useSeasons } from '../../lib/queries';
import { initialSeason } from '../../lib/seasons';
import {
  channels,
  playbookCategories,
  playbooks,
  type ChannelId,
  type Playbook,
  type Publication,
} from '../../lib/publications';
import type { SourceItem } from '../../lib/types';
import { normalize } from '../catalog/PostCatalog';
import { ChannelBadge } from './bits';

export type NewPublicationPrefill = { playbook?: string; source?: { id: string; seasonId: string } };
const matchKinds = new Set(['match', 'statistics']);
const usesMatch = (p: Playbook) => matchKinds.has(p.factsKind) || p.id === 'mvp';

function SourceStep({
  def,
  prefill,
  onBack,
  onClose,
}: {
  def: Playbook;
  prefill?: NewPublicationPrefill;
  onBack: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const seasons = useSeasons();
  const [mode, setMode] = useState<'match' | 'manual'>(usesMatch(def) ? 'match' : 'manual');
  const [season, setSeason] = useState(prefill?.source?.seasonId || '');
  const [matchId, setMatchId] = useState(prefill?.source?.id || '');
  const [facts, setFacts] = useState({ title: '', opponent: '', date: '', venue: '', person: '', partner: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [channelSet, setChannelSet] = useState<ChannelId[]>(Object.keys(def.items) as ChannelId[]);
  useEffect(() => {
    if (seasons.data && !season) setSeason(initialSeason(seasons.data, ''));
  }, [seasons.data, season]);
  const matches = useQuery({
    queryKey: ['source-items', 'match', season],
    queryFn: () => api<SourceItem[]>(`/sources/matches?${query({ seasonId: season })}`),
    enabled: mode === 'match' && !!season,
  });
  const set = (k: keyof typeof facts, v: string) => setFacts((f) => ({ ...f, [k]: v }));
  const needs = (k: string) => def.required.includes(k);

  async function create() {
    setBusy(true);
    setError('');
    try {
      const manual = Object.fromEntries(Object.entries(facts).filter(([, v]) => v));
      const view = await send<Publication>('/publications', {
        playbook: def.id,
        channels: channelSet,
        ...(mode === 'match' ? { source: { kind: 'match', id: matchId, seasonId: season } } : {}),
        facts: manual,
      });
      void client.invalidateQueries({ queryKey: keys.publications });
      void client.invalidateQueries({ queryKey: keys.suggestions });
      void client.invalidateQueries({ queryKey: keys.projects });
      onClose();
      navigate(`/publikacje/${view.id}`);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={15} />
        Schematy publikacji
      </button>
      <h3>{def.label}</h3>
      <p className="muted small">
        {def.timing} · {def.hint}
      </p>
      <fieldset className="channel-picker">
        <legend>Kanały</legend>
        {(Object.keys(def.items) as ChannelId[]).map((c) => (
          <label key={c} className="check-label">
            <input
              type="checkbox"
              checked={channelSet.includes(c)}
              disabled={channelSet.length === 1 && channelSet.includes(c)}
              onChange={(e) => setChannelSet(e.target.checked ? [...channelSet, c] : channelSet.filter((x) => x !== c))}
            />
            <ChannelBadge channel={c} /> {channels[c].label}
          </label>
        ))}
      </fieldset>
      {usesMatch(def) && (
        <div className="segmented" role="group" aria-label="Źródło faktów">
          <button aria-pressed={mode === 'match'} onClick={() => setMode('match')}>
            Mecz z KALK
          </button>
          <button aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>
            Wpiszę ręcznie
          </button>
        </div>
      )}
      <div className="form-group">
        {mode === 'match' ? (
          <>
            <label>
              Sezon
              <select value={season} onChange={(e) => setSeason(e.target.value)}>
                {(seasons.data || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mecz
              <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
                <option value="">{matches.isFetching ? 'Wczytuję…' : 'Wybierz mecz…'}</option>
                {(matches.data || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.date?.slice(0, 10)} · {m.opponent}
                  </option>
                ))}
              </select>
            </label>
            {def.id === 'mvp' && (
              <label>
                MVP (imię i nazwisko)
                <input value={facts.person} maxLength={120} onChange={(e) => set('person', e.target.value)} />
              </label>
            )}
            <p className="muted small">
              Wynik, kolejka i liderzy zostaną pobrani z KALK. Potwierdzisz je w publikacji.
            </p>
          </>
        ) : (
          <>
            {(needs('title') || ['manual', 'tournament', 'club', 'partner'].includes(def.factsKind)) && (
              <label>
                Tytuł
                <input value={facts.title} maxLength={180} onChange={(e) => set('title', e.target.value)} />
              </label>
            )}
            {(needs('opponent') || def.factsKind === 'match') && (
              <label>
                Rywal
                <input value={facts.opponent} maxLength={100} onChange={(e) => set('opponent', e.target.value)} />
              </label>
            )}
            {(needs('person') || def.factsKind === 'player') && (
              <label>
                Osoba (imię i nazwisko)
                <input value={facts.person} maxLength={120} onChange={(e) => set('person', e.target.value)} />
              </label>
            )}
            {(needs('partner') || def.id === 'partner-profile') && (
              <label>
                Partner
                <input value={facts.partner} maxLength={180} onChange={(e) => set('partner', e.target.value)} />
              </label>
            )}
            {!['partner', 'statistics'].includes(def.factsKind) && (
              <label>
                Data i godzina · Europe/Warsaw
                <input
                  type="datetime-local"
                  value={warsawInput(facts.date)}
                  onChange={(e) => {
                    try {
                      set('date', warsawIso(e.target.value));
                    } catch (err) {
                      setError(message(err));
                    }
                  }}
                />
              </label>
            )}
            {(needs('venue') || ['match', 'tournament', 'club'].includes(def.factsKind)) && (
              <label>
                Miejsce
                <input
                  value={facts.venue}
                  maxLength={100}
                  placeholder={
                    def.factsKind === 'tournament'
                      ? 'CESiR Bobolice'
                      : def.factsKind === 'match'
                        ? 'KOSiR Koszalin'
                        : ''
                  }
                  onChange={(e) => set('venue', e.target.value)}
                />
              </label>
            )}
            <p className="muted small">Pozostałe fakty uzupełnisz w publikacji przed potwierdzeniem.</p>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>
          Anuluj
        </button>
        <button className="primary" disabled={busy || (mode === 'match' && !matchId)} onClick={() => void create()}>
          {busy ? 'Tworzę…' : 'Utwórz publikację'} <ArrowUpRight size={16} />
        </button>
      </div>
    </>
  );
}

export default function NewPublicationModal({
  prefill,
  onClose,
}: {
  prefill?: NewPublicationPrefill;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Playbook | null>(() =>
    prefill?.playbook ? playbooks.find((p) => p.id === prefill.playbook) || null : null,
  );
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const list = playbooks.filter(
    (p) =>
      (!category || p.category === category) &&
      normalize(`${p.label} ${p.category} ${p.hint}`).includes(normalize(search)),
  );
  return (
    <Modal
      eyebrow="NOWA PUBLIKACJA"
      title={selected ? 'Skąd bierzemy fakty?' : 'Co publikujemy?'}
      className="template-modal"
      onClose={onClose}
    >
      {selected ? (
        <SourceStep def={selected} prefill={prefill} onBack={() => setSelected(null)} onClose={onClose} />
      ) : (
        <>
          <label className="catalog-search">
            <Search size={16} />
            <input
              data-autofocus
              aria-label="Szukaj schematu"
              placeholder="Wynik, zapowiedź, MVP, partner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="catalog-categories" role="group" aria-label="Kategorie">
            {['', ...playbookCategories].map((c) => (
              <button
                key={c || 'all'}
                aria-pressed={category === c}
                className={category === c ? 'active' : ''}
                onClick={() => setCategory(c)}
              >
                {c || 'Wszystkie'}
              </button>
            ))}
          </div>
          <div className="playbook-grid">
            {list.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)}>
                <span className="eyebrow">{p.category}</span>
                <h3>{p.label}</h3>
                <p>{p.hint}</p>
                <span className="playbook-meta">
                  <span>{p.timing}</span>
                  <span className="channel-row">
                    {(Object.keys(p.items) as ChannelId[]).map((c) => (
                      <ChannelBadge key={c} channel={c} />
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!list.length && <p className="muted">Brak pasujących schematów.</p>}
        </>
      )}
    </Modal>
  );
}
