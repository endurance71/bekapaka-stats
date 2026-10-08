import { useQuery } from '@tanstack/react-query';
import { Eye, Globe, RefreshCw } from 'lucide-react';
import { API, api, send } from '../../lib/api';
import type { Item, Publication } from '../../lib/publications';

type Config = { draft: boolean; preview: boolean; revalidate: boolean };
export const useWebsiteConfig = () =>
  useQuery({ queryKey: ['website-config'], queryFn: () => api<Config>('/website/config'), staleTime: 5 * 60_000 });

// Website variant ↔ CMS draft: the article stays a draft on bekapaka.pl until the owner publishes it here.
export default function WebsiteActions({
  publication,
  item,
  busy,
  dirty,
  run,
}: {
  publication: Publication;
  item: Item;
  busy: boolean;
  dirty: boolean;
  run: (fn: () => Promise<Publication>) => Promise<void>;
}) {
  const config = useWebsiteConfig();
  const base = `/publications/${publication.id}/items/${item.id}/website`;
  if (!config.data?.draft) return null;
  const cms = item.cms;
  const exported = !!item.graphic?.exportJobId;
  return (
    <div className="website-actions">
      <p className="muted small">
        {cms ? (
          <>
            Szkic w CMS: <code>/aktualnosci/{cms.slug}</code> · zapisany{' '}
            {new Date(cms.syncedAt).toLocaleString('pl-PL')}
            {!cms.upToDate && <b className="form-error"> · tekst zmienił się od zapisu</b>}
          </>
        ) : (
          'Artykuł nie ma jeszcze szkicu w CMS. Szkic nie jest widoczny publicznie.'
        )}
        {!exported && ' Okładka pochodzi z eksportu grafiki — najpierw go wygeneruj.'}
      </p>
      <button
        className="secondary"
        disabled={busy || dirty || !exported || item.issues.some((i) => i.level === 'error')}
        onClick={() => void run(() => send<Publication>(`${base}/draft`, {}))}
      >
        <RefreshCw size={14} /> {cms ? 'Odśwież szkic na stronie' : 'Utwórz szkic na stronie'}
      </button>
      {cms && config.data.preview && (
        <a className="secondary" href={`${API}${base}/preview`} target="_blank" rel="noopener noreferrer">
          <Eye size={14} /> Podgląd na bekapaka.pl
        </a>
      )}
      {item.status === 'approved' && (
        <button
          className="primary"
          disabled={busy || dirty || item.stale}
          onClick={() => {
            if (window.confirm('Opublikować artykuł na bekapaka.pl? Będzie widoczny dla wszystkich.'))
              void run(() => send<Publication>(`${base}/publish`, { expectedRevision: item.revision }));
          }}
        >
          <Globe size={16} /> Opublikuj na stronie
        </button>
      )}
    </div>
  );
}
