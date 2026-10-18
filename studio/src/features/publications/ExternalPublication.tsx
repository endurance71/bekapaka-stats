import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { api, send } from '../../lib/api';
import type { Item, Publication } from '../../lib/publications';

// "Now" as the value of a datetime-local input (local time, minutes precision).
const localNow = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

type Props = {
  publication: Publication;
  item: Item;
  busy: boolean;
  run: (fn: () => Promise<Publication>) => Promise<void>;
};

/**
 * A post that went out outside Studio (Business Suite, phone, CMS by hand): record it with its link,
 * time and the images that were actually published, so history and the grid stay true.
 */
export default function ExternalPublication({ publication, item, busy, run }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [at, setAt] = useState(localNow);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [slug, setSlug] = useState('');
  const base = `/publications/${publication.id}/items/${item.id}`;
  const publishedAt = at ? new Date(at).toISOString() : '';
  const website = item.channel === 'website';

  const record = () =>
    run(() => {
      const form = new FormData();
      form.append('payload', JSON.stringify({ expectedRevision: item.revision, url, publishedAt, note }));
      files.forEach((f) => form.append('images', f, f.name));
      return api<Publication>(`${base}/external-published`, { method: 'POST', body: form });
    });
  const link = () =>
    run(() =>
      send<Publication>(`${base}/website/link`, {
        expectedRevision: item.revision,
        documentId,
        slug,
        publishedAt: publishedAt || null,
      }),
    );

  if (!open)
    return (
      <button className="text-button" disabled={busy} onClick={() => setOpen(true)}>
        <ExternalLink size={14} /> {website ? 'Opublikowane w CMS poza Studio' : 'Opublikowane poza Studio'}
      </button>
    );
  return (
    <fieldset className="external-publication">
      <legend>{website ? 'Artykuł opublikowany w CMS poza Studio' : 'Publikacja poza Studio'}</legend>
      <p className="hint">
        Zapisuje, co i kiedy wyszło naprawdę. Wariant nie przechodzi zatwierdzenia i zostaje oznaczony jako publikacja
        spoza Studio.
      </p>
      {website ? (
        <>
          <label>
            Adres artykułu (slug)
            <input
              value={slug}
              placeholder="np. bekapaka-wygrywa-z-gmvt-team-56-54"
              onChange={(e) => setSlug(e.target.value.trim())}
            />
          </label>
          <label>
            Identyfikator dokumentu w CMS (documentId)
            <input value={documentId} onChange={(e) => setDocumentId(e.target.value.trim())} />
          </label>
        </>
      ) : (
        <>
          <label>
            Link do posta
            <input value={url} type="url" placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label>
            Opublikowane grafiki (PNG/JPG, w kolejności)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => setFiles([...(e.target.files || [])].slice(0, 10))}
            />
          </label>
          <label>
            Uwaga (opcjonalnie)
            <input
              value={note}
              maxLength={500}
              placeholder="np. Business Suite, karuzela 3 grafik"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </>
      )}
      <label>
        Data i godzina publikacji
        <input type="datetime-local" value={at} max={localNow()} onChange={(e) => setAt(e.target.value)} />
      </label>
      <div className="row-actions">
        <button className="text-button" disabled={busy} onClick={() => setOpen(false)}>
          Anuluj
        </button>
        <button
          className="primary"
          disabled={busy || !publishedAt || (website && (!slug || !documentId))}
          onClick={() => void (website ? link() : record())}
        >
          Zapisz jako opublikowane
        </button>
      </div>
    </fieldset>
  );
}
