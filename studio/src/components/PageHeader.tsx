import type { ReactNode } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useReloadLibrary } from '../lib/queries';
import { useShell } from '../app/shell-context';

// `kind` decides the primary action: a new publication (all channels) or a single graphic.
export default function PageHeader({
  title,
  actions,
  kind = 'graphic',
}: {
  title: string;
  actions?: ReactNode;
  kind?: 'graphic' | 'publication';
}) {
  const reload = useReloadLibrary();
  const { openNew, openNewPublication } = useShell();
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">BEKAPAKA / PRACOWNIA</span>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {actions}
        <button className="icon-button" aria-label="Odśwież" onClick={() => void reload()}>
          <RefreshCw size={18} />
        </button>
        {kind === 'publication' ? (
          <button className="primary" onClick={() => openNewPublication()}>
            <Plus size={18} />
            Nowa publikacja
          </button>
        ) : (
          <button className="primary" onClick={openNew}>
            <Plus size={18} />
            Nowa grafika
          </button>
        )}
      </div>
    </header>
  );
}
