import { useState } from 'react';
import { Upload } from 'lucide-react';
import { api, assetUrl, message, send } from '../../lib/api';
import { useAssets, useReloadLibrary } from '../../lib/queries';
import type { Asset } from '../../lib/types';
import Modal from '../../components/Modal';
import { useShell } from '../../app/shell-context';

export const statuses: Record<string, string> = {
  draft: 'Do sprawdzenia',
  approved: 'Zatwierdzony',
  retired: 'Wycofany',
};
const kinds = [
  ['photo', 'Zdjęcie'],
  ['portrait', 'Portret'],
  ['cutout', 'Wycięcie PNG'],
  ['background', 'Tło'],
  ['logo', 'Logo partnera'],
];
type CmsPost = { id: string; title: string; media: { id: string; name: string }[] };

function AssetModal({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const reload = useReloadLibrary();
  const { setError } = useShell();
  const [busy, setBusy] = useState(false);
  async function save(form: HTMLFormElement) {
    const f = new FormData(form);
    const metadata = {
      name: f.get('name'),
      kind: f.get('kind'),
      origin: f.get('origin'),
      people: f.get('people'),
      jerseyNumber: f.get('jerseyNumber'),
      consent: f.get('consent'),
      status: f.get('status'),
    };
    setBusy(true);
    try {
      if (asset) await send(`/assets/${asset.id}`, metadata, 'PUT');
      else {
        const body = new FormData();
        body.set('file', f.get('file')!);
        body.set('metadata', JSON.stringify(metadata));
        await api('/assets', { method: 'POST', body });
      }
      await reload();
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={asset ? 'Sprawdź materiał' : 'Dodaj materiał'} onClose={onClose} dismissible={false}>
      {asset && <img className="asset-detail" src={assetUrl(asset.id)} alt={asset.name} />}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(e.currentTarget);
        }}
      >
        {!asset && (
          <label>
            Plik
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required />
          </label>
        )}
        <label>
          Nazwa
          <input name="name" defaultValue={asset?.name} required maxLength={180} />
        </label>
        <label>
          Rodzaj
          <select name="kind" defaultValue={asset?.kind || 'photo'} disabled={!!asset?.provenance}>
            {kinds.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {asset?.provenance && <input type="hidden" name="kind" value="background" />}
        </label>
        <label>
          Pochodzenie / autor
          <input name="origin" defaultValue={asset?.origin} required maxLength={500} />
        </label>
        <label>
          Osoby na zdjęciu
          <input name="people" defaultValue={asset?.people} maxLength={500} />
        </label>
        <label>
          Numer stroju
          <input name="jerseyNumber" defaultValue={asset?.jerseyNumber} maxLength={3} />
        </label>
        <label>
          Dopuszczalność publikacji
          <select name="consent" defaultValue={asset?.consent || 'unknown'}>
            <option value="unknown">Nieustalona</option>
            <option value="granted">Mam prawo do publikacji i wymagane zgody</option>
            <option value="not_required">Zgoda osób nie jest wymagana; mam prawo do materiału</option>
            <option value="withdrawn">Zgoda wycofana</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={asset?.status || 'draft'}>
            <option value="draft">Do sprawdzenia</option>
            <option value="approved">Zatwierdzam wygląd i dopuszczam publikację</option>
            <option value="retired">Wycofany</option>
          </select>
        </label>
        {asset?.provenance && (
          <details>
            <summary>Pochodzenie AI</summary>
            <p>
              {asset.provenance.model} · {asset.provenance.generatedAt} ·{' '}
              {(asset.provenance.chargedMicros / 1e6).toFixed(3)} USD
            </p>
            <p>{asset.provenance.prompt}</p>
          </details>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'Zapisywanie…' : 'Zapisz materiał'}
        </button>
      </form>
    </Modal>
  );
}

function CmsImportModal({ posts, onClose }: { posts: CmsPost[]; onClose: () => void }) {
  const reload = useReloadLibrary();
  const { setError } = useShell();
  const [busy, setBusy] = useState(false);
  async function importMedia(documentId: string, mediaId: string) {
    setBusy(true);
    try {
      await send('/assets/import-cms', { kind: 'news', documentId, mediaId });
      await reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Zdjęcia z opublikowanych treści" onClose={onClose}>
      <p className="muted">
        Import tworzy prywatną kopię w Studio. Potwierdź jej prawa i dopuszczalność publikacji w bibliotece.
      </p>
      {!posts.length && <p>Brak opublikowanych materiałów.</p>}
      {posts.map((p) => (
        <div className="history-row" key={p.id}>
          <div>
            <h3>{p.title}</h3>
            {p.media.map((m) => (
              <button key={m.id} className="secondary" disabled={busy} onClick={() => void importMedia(p.id, m.id)}>
                {m.name} · importuj
              </button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}

export default function AssetLibrary() {
  const assets = useAssets();
  const { setError } = useShell();
  const [selected, setSelected] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cmsPosts, setCmsPosts] = useState<CmsPost[] | null>(null);
  const list = assets.data || [];
  return (
    <>
      <div className="section-title">
        <p className="muted">Prawdziwe zdjęcia. Sprawdzone prawa. Własne materiały.</p>
        <div className="header-actions">
          <button
            className="secondary"
            onClick={async () => {
              try {
                setCmsPosts(await api<CmsPost[]>('/sources/cms/news'));
              } catch (err) {
                setError(message(err));
              }
            }}
          >
            Import z CMS
          </button>
          <button className="secondary" onClick={() => setUploading(true)}>
            <Upload size={17} />
            Dodaj materiał
          </button>
        </div>
      </div>
      {assets.isError && (
        <p role="alert" className="form-error">
          {assets.error.message}
        </p>
      )}
      <div className="asset-grid">
        {list.map((a) => (
          <button key={a.id} className="asset-card" onClick={() => setSelected(a)}>
            <img src={assetUrl(a.id)} alt={a.name} loading="lazy" />
            <div>
              <h3>{a.name}</h3>
              <span className={`status status-${a.status}`}>{statuses[a.status]}</span>
              {a.provenance && <small>Ilustracja AI · wymaga oceny</small>}
            </div>
          </button>
        ))}
      </div>
      {!assets.isPending && !list.length && (
        <div className="empty">
          <Upload />
          <h3>Dodaj zdjęcia z parkietu</h3>
          <p>
            JPEG, PNG, WebP, HEIC i gotowe wycięcia PNG.
            <br />
            Materiały są prywatne; status publikacyjny ustalasz Ty.
          </p>
        </div>
      )}
      {(selected || uploading) && (
        <AssetModal
          asset={selected}
          onClose={() => {
            setSelected(null);
            setUploading(false);
          }}
        />
      )}
      {cmsPosts && <CmsImportModal posts={cmsPosts} onClose={() => setCmsPosts(null)} />}
    </>
  );
}
