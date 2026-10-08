import { ShieldCheck } from 'lucide-react';
import { message, send } from '../../lib/api';
import { compositionLabel, formatSpec } from '../../lib/contracts';
import { useCatalog, useReloadLibrary } from '../../lib/queries';
import { useShell } from '../../app/shell-context';
import { statuses } from './AssetLibrary';

const labels: Record<string, string> = { draft: 'Do oceny', approved: 'Zatwierdzony', retired: 'Wycofany' };

export default function DesignStatuses() {
  const catalog = useCatalog();
  const reload = useReloadLibrary();
  const { setError } = useShell();
  async function update(path: string, body: unknown) {
    try {
      await send(path, body);
      await reload();
    } catch (err) {
      setError(message(err));
    }
  }
  const legacy = (catalog.data?.templates || []).filter((t) => !['club', 'statistics'].includes(t.id));
  return (
    <>
      <section>
        <div className="section-title">
          <h2>Typy publikacji i kompozycje</h2>
          <span className="muted">Zatwierdzenie dotyczy konkretnej kompozycji, formatu, stroju i materiału.</span>
        </div>
        {(catalog.data?.posts || []).map((p) => (
          <details key={p.id} className="design-status-group">
            <summary>
              {p.label} · {p.version}
            </summary>
            <div className="template-statuses">
              {p.designs?.map((d) => (
                <div key={`${d.style}-${d.format}-${d.kit}-${d.backgroundAssetId}`}>
                  <b>
                    {compositionLabel(p, d.style)} · {formatSpec(d.format).label} · strój {d.kit} ·{' '}
                    {d.backgroundAssetId ? 'tło z biblioteki' : 'materiał marki'}
                  </b>
                  <span className={`status status-${d.status}`}>{labels[d.status]}</span>
                  <button
                    className="text-button"
                    onClick={() =>
                      void update(`/designs/${p.id}/${d.style}/${d.format}/status`, {
                        status: d.status === 'retired' ? 'draft' : 'retired',
                        kit: d.kit,
                        backgroundAssetId: d.backgroundAssetId,
                      })
                    }
                  >
                    {d.status === 'retired' ? 'Przywróć roboczy' : 'Wycofaj'}
                  </button>
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>
      {/* Families 1.0.0 serve only historic projects; they can be retired, never newly approved. */}
      <details className="design-status-group">
        <summary>Dotychczasowe szablony (projekty historyczne)</summary>
        <div className="template-statuses">
          {legacy.map((t) => (
            <div key={t.id}>
              <ShieldCheck size={19} />
              <b>{t.label}</b>
              <span className={`status status-${t.status}`}>{statuses[t.status]}</span>
              <button
                className="text-button"
                onClick={() =>
                  void update(`/templates/${t.id}/status`, { status: t.status === 'retired' ? 'draft' : 'retired' })
                }
              >
                {t.status === 'retired' ? 'Przywróć roboczy' : 'Wycofaj'}
              </button>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
