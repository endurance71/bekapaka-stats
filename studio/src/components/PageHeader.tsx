import type { ReactNode } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useReloadLibrary } from '../lib/queries';
import { useShell } from '../app/shell-context';

export default function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  const reload = useReloadLibrary();
  const { openNew } = useShell();
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
        <button className="primary" onClick={openNew}>
          <Plus size={18} />
          Nowy projekt
        </button>
      </div>
    </header>
  );
}
