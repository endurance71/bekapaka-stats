import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowLeft, Check, Download, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { API, message, send } from '../../lib/api';
import { formatSpec } from '../../lib/contracts';
import { warsawInput, warsawIso } from '../../lib/dates';
import { keys, useSettings } from '../../lib/queries';
import {
  channels,
  playbook,
  publicationState,
  type ChannelId,
  type Item,
  type Publication,
} from '../../lib/publications';
import ChannelPanel from './ChannelPanel';
import FactsPanel from './FactsPanel';
import { ChannelBadge, formatDateTime, StatusPill } from './bits';
import './publications.css';

const tabSlugs: Record<ChannelId, string> = {
  instagram_feed: 'instagram',
  instagram_story: 'relacja',
  facebook: 'facebook',
  website: 'strona',
};
const slugToChannel = Object.fromEntries(Object.entries(tabSlugs).map(([k, v]) => [v, k])) as Record<string, ChannelId>;

function GraphicsOverview({ publication }: { publication: Publication }) {
  const graphics = new Map<string, { graphic: NonNullable<Item['graphic']>; uses: Item[] }>();
  for (const item of publication.items) {
    if (!item.graphic) continue;
    const entry = graphics.get(item.graphic.projectId) || { graphic: item.graphic, uses: [] };
    entry.uses.push(item);
    graphics.set(item.graphic.projectId, entry);
  }
  return (
    <div className="graphics-overview">
      <p className="muted">
        Grafiki to zwykłe projekty Studio: dane, kompozycja, zatwierdzenie i eksport odbywają się w edytorze grafiki. Po
        eksporcie wróć tutaj — pliki trafią do kanałów.
      </p>
      {[...graphics.values()].map(({ graphic, uses }) => (
        <article key={graphic.projectId} className="graphic-card">
          <div>
            <h3>{graphic.name}</h3>
            <p className="muted small">
              Rewizja {graphic.revision} · formaty: {graphic.formats.map((f) => formatSpec(f).label).join(', ')}
            </p>
            <p className="channel-row">
              {uses.map((u) => (
                <span key={u.id} className="graphic-use">
                  <ChannelBadge channel={u.channel} /> {formatSpec(u.format).label}
                  {!u.graphic?.hasFormat && <b className="form-error"> · brak formatu</b>}
                </span>
              ))}
            </p>
            {graphic.valid ? (
              <p className={graphic.exportJobId ? 'ok-line' : 'muted small'}>
                {graphic.exportJobId ? (
                  <>
                    <Check size={14} /> Zatwierdzona i wyeksportowana
                  </>
                ) : (
                  'Zatwierdzona — wygeneruj paczkę eksportu w edytorze grafiki.'
                )}
              </p>
            ) : (
              <ul className="ready-list">
                {graphic.errors.slice(0, 6).map((e, i) => (
                  <li key={i}>
                    <b>{e.field}</b> {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link className="secondary" to={`/grafiki/${graphic.projectId}?publikacja=${publication.id}`}>
            <ImageIcon size={16} /> Otwórz grafikę
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function PublicationEditor({
  publication,
  apply,
}: {
  publication: Publication;
  apply: (p: Publication) => void;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { kanal } = useParams();
  const settings = useSettings();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(publication.title);
  const def = playbook(publication.playbook);
  const tab =
    kanal && slugToChannel[kanal]
      ? slugToChannel[kanal]
      : kanal === 'grafiki'
        ? 'graphics'
        : publication.items[0]?.channel || 'graphics';
  const item = publication.items.find((i) => i.channel === tab);
  const state = publicationState(publication.items);
  const packable = publication.items.some((i) => ['approved', 'published'].includes(i.status) && !i.stale);
  const go = (slug: string) => navigate(`/publikacje/${publication.id}/${slug}`, { replace: true });

  const run = async (fn: () => Promise<Publication | void>) => {
    setBusy(true);
    setError('');
    try {
      const view = await fn();
      if (view) apply(view);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  const update = (body: Record<string, unknown>) =>
    run(() =>
      send<Publication>(`/publications/${publication.id}`, { expectedRevision: publication.revision, ...body }, 'PUT'),
    );

  if (!def) return <p className="form-error">Nieznany schemat publikacji: {publication.playbook}</p>;
  return (
    <div className="publication-editor">
      <header className="editor-header">
        <button className="icon-button" aria-label="Wróć do publikacji" onClick={() => navigate('/publikacje')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <input
            className="project-name"
            aria-label="Nazwa publikacji"
            value={title}
            maxLength={180}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== publication.title && void update({ title: title.trim() })}
          />
          <span className="save-status">
            {def.label} · <span className={`pub-status pub-status-${state.key}`}>{state.label}</span>
            {publication.status === 'archived' && ' · archiwum'}
          </span>
        </div>
        <div className="editor-tools">
          <label className="planned-at">
            <span>Termin</span>
            <input
              type="datetime-local"
              value={warsawInput(publication.plannedAt || '')}
              onChange={(e) => {
                try {
                  void update({ plannedAt: e.target.value ? warsawIso(e.target.value) : null });
                } catch (err) {
                  setError(message(err));
                }
              }}
            />
          </label>
          <a
            className={`primary ${packable ? '' : 'is-disabled'}`}
            aria-disabled={!packable}
            href={packable ? `${API}/publications/${publication.id}/package` : undefined}
            title={packable ? 'Grafiki i teksty zatwierdzonych kanałów' : 'Zatwierdź co najmniej jeden kanał'}
          >
            <Download size={17} />
            <span>Paczka ZIP</span>
          </a>
        </div>
      </header>
      {error && (
        <div className="editor-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setError('')}>Zamknij</button>
        </div>
      )}
      <div className="pub-editor-grid">
        <FactsPanel publication={publication} def={def} apply={apply} onError={setError} />
        <section className="publication-main">
          <nav className="channel-tabs" aria-label="Kanały publikacji">
            <button aria-pressed={tab === 'graphics'} onClick={() => go('grafiki')}>
              <LayoutGrid size={14} /> Grafiki
            </button>
            {publication.items.map((i) => (
              <button key={i.id} aria-pressed={tab === i.channel} onClick={() => go(tabSlugs[i.channel])}>
                <ChannelBadge channel={i.channel} status={i.status} /> {channels[i.channel].short}
                {i.ready.length === 0 && i.status === 'draft' && (
                  <i className="dot-ready" title="Gotowe do zatwierdzenia" />
                )}
              </button>
            ))}
          </nav>
          {tab === 'graphics' || !item ? (
            <GraphicsOverview publication={publication} />
          ) : (
            <ChannelPanel
              key={item.id}
              publication={publication}
              item={item}
              settings={settings.data}
              apply={apply}
              onError={setError}
            />
          )}
        </section>
        <aside className="publication-checklist">
          <div className="panel-heading">
            <span className="eyebrow">KONTROLA</span>
            <h2>Kanały</h2>
          </div>
          <ol>
            {publication.items.map((i) => (
              <li key={i.id}>
                <button className="checklist-row" onClick={() => go(tabSlugs[i.channel])}>
                  <ChannelBadge channel={i.channel} status={i.status} />
                  <span>
                    <b>{channels[i.channel].label}</b>
                    <small>{formatDateTime(i.plannedAt)}</small>
                  </span>
                  <StatusPill status={i.status} />
                </button>
                {i.status === 'draft' && i.ready.length > 0 && <small className="muted">{i.ready[0]}</small>}
                {i.stale && <small className="form-error">Zmiana po zatwierdzeniu — zatwierdź ponownie</small>}
              </li>
            ))}
          </ol>
          <p className="muted small">
            Etap 1: publikujesz ręcznie z paczki lub przyciskami „Kopiuj tekst” i „Zapisz w Zdjęciach”, potem oznaczasz
            kanał jako opublikowany.
          </p>
          <button
            className="text-button archive-button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await send(`/publications/${publication.id}/archive`, { archived: publication.status !== 'archived' });
                void client.invalidateQueries({ queryKey: keys.publications });
                navigate('/publikacje');
              })
            }
          >
            <Archive size={14} /> {publication.status === 'archived' ? 'Przywróć z archiwum' : 'Archiwizuj publikację'}
          </button>
        </aside>
      </div>
    </div>
  );
}
