import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { usePublications } from '../lib/queries';
import { publicationState } from '../lib/publications';
import PublicationRow from '../features/publications/PublicationRow';
import { useShell } from '../app/shell-context';
import '../features/publications/publications.css';

const filters = [
  ['all', 'Wszystkie'],
  ['draft', 'W przygotowaniu'],
  ['approved', 'Gotowe'],
  ['published', 'Opublikowane'],
  ['archived', 'Archiwum'],
] as const;

export default function PublicationsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('all');
  const { openNewPublication } = useShell();
  const publications = usePublications(filter === 'archived' ? 'archived' : 'draft');
  const list = (publications.data || []).filter((p) => {
    if (filter === 'all' || filter === 'archived') return true;
    const key = publicationState(p.items).key;
    return filter === 'approved' ? ['approved', 'partial'].includes(key) : key === filter;
  });
  return (
    <>
      <PageHeader title="Publikacje" kind="publication" />
      <div className="catalog-categories" role="group" aria-label="Filtr publikacji">
        {filters.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={filter === id}
            className={filter === id ? 'active' : ''}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {publications.isError && <p className="form-error">{publications.error.message}</p>}
      <div className="pub-list">
        {list.map((p) => (
          <PublicationRow key={p.id} p={p} />
        ))}
      </div>
      {!publications.isPending && !list.length && (
        <div className="empty">
          <h3>Brak publikacji</h3>
          <p>Wybierz schemat — Studio przygotuje grafiki i teksty dla Instagrama, Facebooka i strony.</p>
          <button className="secondary" onClick={() => openNewPublication()}>
            Nowa publikacja
          </button>
        </div>
      )}
    </>
  );
}
