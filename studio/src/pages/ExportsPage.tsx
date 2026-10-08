import { Download } from 'lucide-react';
import { fileUrl } from '../lib/api';
import { useExports } from '../lib/queries';
import PageHeader from '../components/PageHeader';
import { ArchivedExportImages } from '../features/exports/ExportFile';
import { useShell } from '../app/shell-context';

export default function ExportsPage() {
  const exports = useExports();
  const { setError } = useShell();
  const list = exports.data || [];
  return (
    <>
      <PageHeader title="Gotowe do publikacji" />
      <div className="export-list">
        {exports.isError && (
          <p role="alert" className="form-error">
            {exports.error.message}
          </p>
        )}
        {!exports.isPending && !list.length && (
          <div className="empty">
            <Download />
            <h3>Paczki pojawią się po eksporcie</h3>
            <p>PNG, opis posta i manifest w jednym ZIP.</p>
          </div>
        )}
        {list.map((e) => {
          const active = new Date(e.expiresAt) > new Date();
          return (
            <div className="export-row" key={e.id}>
              <Download />
              <div>
                <h3>{e.project.name}</h3>
                <span>
                  Rewizja {e.revision} · {new Date(e.createdAt).toLocaleString('pl-PL')}
                </span>
                {active && <ArchivedExportImages jobId={e.jobId} files={e.files || []} onError={setError} />}
              </div>
              {active ? (
                <a className="secondary" href={fileUrl(e.jobId, 'zip', true)}>
                  Pobierz ZIP
                </a>
              ) : (
                <span className="muted">Wygasł — otwórz projekt i eksportuj ponownie</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
