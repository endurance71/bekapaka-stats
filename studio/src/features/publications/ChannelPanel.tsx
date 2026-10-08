import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, ClipboardCopy, ExternalLink, FileText, RotateCcw, SkipForward, Sparkles, Undo2 } from 'lucide-react';
import { api, fileUrl, message, query, send } from '../../lib/api';
import { formatSpec } from '../../lib/contracts';
import { warsawInput, warsawIso } from '../../lib/dates';
import {
  channels,
  lintCopy,
  mainText,
  originLabels,
  type Copy,
  type Graphic,
  type Item,
  type Publication,
  type Settings,
} from '../../lib/publications';
import type { Job } from '../../lib/types';
import ExportFile from '../exports/ExportFile';
import SocialPreview from '../graphic-editor/SocialPreview';
import { Counter, HashtagInput, Issues, StatusPill } from './bits';
import { useItemDraft } from './usePublication';
import WebsiteActions, { useWebsiteConfig } from './WebsiteActions';

function useGraphicImage(graphic: Graphic | null) {
  const exported = graphic?.exportJobId
    ? graphic.exportFiles.filter((f) => f.key === graphic.format || f.key.startsWith(`${graphic.format}-`))
    : [];
  const preview = useQuery({
    queryKey: ['graphic-preview', graphic?.projectId, graphic?.format, graphic?.revision],
    queryFn: () => api<Job | null>(`/projects/${graphic!.projectId}/preview?${query({ format: graphic!.format })}`),
    enabled: !!graphic && graphic.hasFormat && !exported.length,
  });
  if (exported.length) return { src: fileUrl(graphic!.exportJobId!, exported[0].key), exported, fromExport: true };
  const job = preview.data;
  const file = job?.result?.files?.[0];
  return {
    src: job && file ? fileUrl(job.id, file.key) : '',
    exported,
    fromExport: false,
    previewRevision: job?.revision,
  };
}

type Props = {
  onAi: () => void;
  publication: Publication;
  item: Item;
  settings?: Settings;
  apply: (p: Publication) => void;
  onError: (m: string) => void;
};

export default function ChannelPanel({ publication, item, settings, apply, onError, onAi }: Props) {
  const { draft, change, saving, dirty } = useItemDraft(publication.id, item, apply, onError);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(item.externalUrl || '');
  const image = useGraphicImage(item.graphic);
  const websiteConfig = useWebsiteConfig();
  // With CMS configured, the website variant is published through Strapi, not marked by hand.
  const viaCms = item.channel === 'website' && !!websiteConfig.data?.draft;
  const locked = item.status === 'published' || publication.status === 'archived';
  const issues = lintCopy(item.channel, draft, publication.facts);
  const spec = channels[item.channel];
  const base = `/publications/${publication.id}/items/${item.id}`;

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
  const put = (body: Record<string, unknown>) =>
    run(() => send<Publication>(base, { expectedRevision: item.revision, ...body }, 'PUT'));

  const formats = spec.formats.filter((f) => item.graphic?.formats.includes(f) || f === item.format);
  const caption =
    item.channel === 'instagram_feed'
      ? `${(draft as Copy['instagram_feed']).caption}${(draft as Copy['instagram_feed']).hashtags.length ? '\n\n' + (draft as Copy['instagram_feed']).hashtags.join(' ') : ''}`
      : item.channel === 'facebook'
        ? (draft as Copy['facebook']).text
        : '';

  return (
    <div className="channel-panel">
      <header className="channel-head">
        <div>
          <span className="eyebrow">{spec.label}</span>
          <h2>
            <StatusPill status={item.status} />{' '}
            {item.stale && <span className="pub-status pub-status-stale">Grafika lub tekst zmieniły się</span>}
          </h2>
          <small className="muted">
            Tekst: {originLabels[item.copyOrigin]}
            {item.promptVersion ? ` · ${item.promptVersion}` : ''} ·{' '}
            {saving ? 'zapisywanie…' : dirty ? 'zmiany w toku' : 'zapisano'}
          </small>
        </div>
        <div className="channel-meta">
          <label>
            Termin publikacji
            <input
              type="datetime-local"
              value={warsawInput(item.plannedAt || '')}
              disabled={locked || busy}
              onChange={(e) => {
                try {
                  void put({ plannedAt: e.target.value ? warsawIso(e.target.value) : null });
                } catch (err) {
                  onError(message(err));
                }
              }}
            />
          </label>
          {formats.length > 1 && (
            <label>
              Format grafiki
              <select
                value={item.format}
                disabled={locked || busy}
                onChange={(e) => void put({ format: e.target.value })}
              >
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {formatSpec(f).label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      <div className="channel-body">
        <div className="copy-editor">
          {item.channel === 'instagram_feed' && (
            <InstagramFields
              draft={draft as Copy['instagram_feed']}
              change={change}
              disabled={locked}
              settings={settings}
            />
          )}
          {item.channel === 'instagram_story' && (
            <StoryFields draft={draft as Copy['instagram_story']} change={change} disabled={locked} />
          )}
          {item.channel === 'facebook' && (
            <FacebookFields draft={draft as Copy['facebook']} change={change} disabled={locked} settings={settings} />
          )}
          {item.channel === 'website' && (
            <WebsiteFields draft={draft as Copy['website']} change={change} disabled={locked} />
          )}
          <Issues issues={issues} />
          <div className="copy-actions">
            <button
              className="text-button"
              disabled={locked || busy || dirty || item.status !== 'draft'}
              title="Zastępuje tekst wersją ze schematu, wypełnioną aktualnymi faktami"
              onClick={() =>
                void run(() =>
                  send<Publication>(`/publications/${publication.id}/templates`, { channels: [item.channel] }),
                )
              }
            >
              <FileText size={14} /> Wypełnij ze schematu
            </button>
            <button
              className="text-button"
              disabled={locked || item.status !== 'draft' || dirty}
              title={
                publication.factsConfirmed ? 'Propozycja Gemini z potwierdzonych faktów' : 'Najpierw potwierdź fakty'
              }
              onClick={onAi}
            >
              <Sparkles size={14} /> Zaproponuj AI
            </button>
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(mainText({ ...item, copy: draft }, item.graphic));
                  onError('');
                } catch {
                  onError('Przeglądarka nie pozwoliła skopiować tekstu. Zaznacz go i skopiuj ręcznie.');
                }
              }}
            >
              <ClipboardCopy size={14} /> Kopiuj tekst
            </button>
          </div>
        </div>

        <div className="channel-preview">
          {item.channel === 'website' ? (
            <article className="article-preview">
              {image.src && <img src={image.src} alt={(draft as Copy['website']).coverAlt} />}
              <span className="eyebrow">AKTUALNOŚCI</span>
              <h3>{(draft as Copy['website']).title || 'Tytuł artykułu'}</h3>
              <p>{(draft as Copy['website']).excerpt}</p>
            </article>
          ) : image.src ? (
            <SocialPreview
              src={image.src}
              alt={(draft as { altText: string }).altText}
              format={item.channel === 'instagram_story' ? 'story' : item.format}
              platform={item.channel === 'facebook' ? 'facebook' : 'instagram'}
              safeZones={false}
              caption={caption}
              stale={!image.fromExport}
              phone
            />
          ) : (
            <div className="preview-empty">
              <img src="/brand/sygnet2-kolor.svg" alt="" />
              <p>Brak podglądu grafiki w tym formacie. Otwórz grafikę, aby go wygenerować.</p>
            </div>
          )}
          {item.graphic && (
            <p className="muted small">
              {image.fromExport ? 'Plik z eksportu' : 'Podgląd roboczy'} · {item.graphic.name} ·{' '}
              <Link to={`/grafiki/${item.graphic.projectId}?publikacja=${publication.id}`}>otwórz grafikę</Link>
            </p>
          )}
          {item.graphic?.aiAssets && <p className="muted small">Tło AI — do tekstu dopisywane jest oznaczenie AI.</p>}
          {image.exported.length > 0 && item.graphic?.exportJobId && (
            <div className="channel-files">
              {image.exported.map((f) => (
                <ExportFile key={f.key} jobId={item.graphic!.exportJobId!} output={f} onError={onError} />
              ))}
            </div>
          )}
        </div>
      </div>

      {item.channel === 'website' && item.status !== 'published' && item.status !== 'skipped' && (
        <WebsiteActions publication={publication} item={item} busy={busy} dirty={dirty || saving} run={run} />
      )}
      <footer className="channel-foot">
        {item.status === 'draft' && (
          <>
            {item.ready.length > 0 && (
              <ul className="ready-list">
                {item.ready.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <button className="text-button" disabled={busy || locked} onClick={() => void put({ status: 'skipped' })}>
              <SkipForward size={14} /> Pomiń ten kanał
            </button>
            <button
              className="primary"
              disabled={busy || saving || dirty || item.ready.length > 0}
              onClick={() => void run(() => send<Publication>(`${base}/approve`, { expectedRevision: item.revision }))}
            >
              <Check size={16} /> Zatwierdź wariant
            </button>
          </>
        )}
        {item.status === 'skipped' && (
          <button className="secondary" disabled={busy || locked} onClick={() => void put({ status: 'draft' })}>
            <RotateCcw size={14} /> Przywróć kanał
          </button>
        )}
        {item.status === 'approved' && (
          <>
            <button className="text-button" disabled={busy} onClick={() => void put({ status: 'draft' })}>
              <Undo2 size={14} /> Cofnij zatwierdzenie
            </button>
            {item.channel !== 'website' && (
              <label className="published-url">
                Link do opublikowanego posta (opcjonalnie)
                <input value={url} type="url" placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
              </label>
            )}
            {!viaCms && (
              <button
                className="primary"
                disabled={busy || item.stale}
                onClick={() =>
                  void run(() => send<Publication>(`${base}/published`, { expectedRevision: item.revision, url }))
                }
              >
                Oznacz jako opublikowane
              </button>
            )}
          </>
        )}
        {item.status === 'published' && (
          <p className="published-note">
            <Check size={15} /> Opublikowano{' '}
            {item.publishedAt ? new Date(item.publishedAt).toLocaleString('pl-PL') : ''}
            {item.externalUrl && (
              <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                Zobacz <ExternalLink size={13} />
              </a>
            )}
          </p>
        )}
      </footer>
    </div>
  );
}

type FieldProps<T> = { draft: T; change: (patch: Partial<T>) => void; disabled: boolean; settings?: Settings };

function InstagramFields({ draft, change, disabled, settings }: FieldProps<Copy['instagram_feed']>) {
  const hook = draft.caption.split('\n')[0];
  return (
    <>
      <label>
        Opis posta
        <textarea
          className="copy-text"
          rows={9}
          value={draft.caption}
          maxLength={2200}
          disabled={disabled}
          onChange={(e) => change({ caption: e.target.value })}
        />
        <span className="field-meta">
          <small className={hook.length > 125 ? 'char-counter is-over' : 'char-counter'}>
            1. linia: {hook.length}/125
          </small>
          <Counter value={draft.caption} max={2200} />
        </span>
      </label>
      <div className="field-block">
        <span className="field-label">Hashtagi</span>
        <HashtagInput
          value={draft.hashtags}
          max={5}
          disabled={disabled}
          suggestions={settings?.hashtags.instagram}
          onChange={(hashtags) => change({ hashtags })}
        />
      </div>
      <label>
        Pierwszy komentarz (opcjonalnie)
        <textarea
          rows={2}
          value={draft.firstComment}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => change({ firstComment: e.target.value })}
        />
      </label>
      <label>
        Tekst alternatywny
        <textarea
          rows={2}
          value={draft.altText}
          maxLength={1500}
          disabled={disabled}
          onChange={(e) => change({ altText: e.target.value })}
        />
      </label>
    </>
  );
}

const stickers = [
  ['none', 'Bez naklejki'],
  ['countdown', 'Odliczanie'],
  ['link', 'Link'],
  ['poll', 'Ankieta'],
  ['question', 'Pytanie'],
] as const;
function StoryFields({ draft, change, disabled }: FieldProps<Copy['instagram_story']>) {
  return (
    <>
      <label>
        Tekst naklejki / podpis
        <input
          value={draft.stickerText}
          maxLength={60}
          disabled={disabled}
          onChange={(e) => change({ stickerText: e.target.value })}
        />
        <Counter value={draft.stickerText} max={60} />
      </label>
      <label>
        Naklejka
        <select
          value={draft.sticker}
          disabled={disabled}
          onChange={(e) => change({ sticker: e.target.value as Copy['instagram_story']['sticker'] })}
        >
          {stickers.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      {draft.sticker === 'link' && (
        <label>
          Link
          <input type="url" value={draft.link} disabled={disabled} onChange={(e) => change({ link: e.target.value })} />
        </label>
      )}
      <label>
        Tekst alternatywny
        <textarea
          rows={2}
          value={draft.altText}
          maxLength={1500}
          disabled={disabled}
          onChange={(e) => change({ altText: e.target.value })}
        />
      </label>
      <p className="muted small">
        Relacja nie powtarza tekstu z grafiki — naklejka dodaje jedną informację lub działanie.
      </p>
    </>
  );
}

function FacebookFields({ draft, change, disabled, settings }: FieldProps<Copy['facebook']>) {
  return (
    <>
      <label>
        Treść posta
        <textarea
          className="copy-text"
          rows={9}
          value={draft.text}
          maxLength={1500}
          disabled={disabled}
          onChange={(e) => change({ text: e.target.value })}
        />
        <Counter value={draft.text} max={1500} />
      </label>
      <label>
        Link (np. do artykułu na bekapaka.pl)
        <input type="url" value={draft.link} disabled={disabled} onChange={(e) => change({ link: e.target.value })} />
      </label>
      <div className="field-block">
        <span className="field-label">Hashtagi (0–2)</span>
        <HashtagInput
          value={draft.hashtags}
          max={2}
          disabled={disabled}
          suggestions={settings?.hashtags.facebook}
          onChange={(hashtags) => change({ hashtags })}
        />
      </div>
      <label>
        Tekst alternatywny
        <textarea
          rows={2}
          value={draft.altText}
          maxLength={1500}
          disabled={disabled}
          onChange={(e) => change({ altText: e.target.value })}
        />
      </label>
    </>
  );
}

function WebsiteFields({ draft, change, disabled }: FieldProps<Copy['website']>) {
  return (
    <>
      <label>
        Tytuł
        <input
          value={draft.title}
          maxLength={90}
          disabled={disabled}
          onChange={(e) => change({ title: e.target.value })}
        />
        <Counter value={draft.title} max={90} />
      </label>
      <label>
        Zajawka (lista aktualności, SEO)
        <textarea
          rows={3}
          value={draft.excerpt}
          maxLength={300}
          disabled={disabled}
          onChange={(e) => change({ excerpt: e.target.value })}
        />
        <Counter value={draft.excerpt} min={140} max={220} />
      </label>
      <label>
        Treść artykułu (Markdown)
        <textarea
          className="copy-text markdown"
          rows={16}
          value={draft.content}
          maxLength={20000}
          disabled={disabled}
          onChange={(e) => change({ content: e.target.value })}
        />
        <small className="muted">
          Samodzielna linia „BeKaPaKa Bobolice 78:64 Rywal” = tablica wyniku · „Mecz w liczbach: 24 pkt X · 11 zb. Y” =
          pas liczb · lista „**Etykieta:** wartość” = tabela faktów.
        </small>
      </label>
      <TagsField tags={draft.tags} disabled={disabled} onChange={(tags) => change({ tags })} />
      <label>
        Tekst alternatywny okładki
        <input
          value={draft.coverAlt}
          maxLength={300}
          disabled={disabled}
          onChange={(e) => change({ coverAlt: e.target.value })}
        />
      </label>
    </>
  );
}

// Commas typed mid-word must survive until the field is left, so tags are committed on blur.
function TagsField({
  tags,
  disabled,
  onChange,
}: {
  tags: string[];
  disabled: boolean;
  onChange: (tags: string[]) => void;
}) {
  const [text, setText] = useState(tags.join(', '));
  return (
    <label>
      Tagi (po przecinku) · kategoria na stronie wynika z tagów i tytułu
      <input
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={() =>
          onChange(
            text
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 8),
          )
        }
      />
    </label>
  );
}
