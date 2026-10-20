import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api, message } from '../lib/api';
import type { GridEntry } from '../lib/publications';
import { GridTile } from '../features/publications/GridVariety';
import '../features/publications/publications.css';

type GridChannel = 'instagram_feed' | 'facebook';
const labels: Record<GridChannel, string> = { instagram_feed: 'Instagram · post', facebook: 'Facebook' };

/**
 * The profile as followers see it: the channel's last and scheduled posts, newest first, with the
 * composition of every graphic and the repetitions that make the feed look monotonous.
 */
export default function GridPage() {
  const [channel, setChannel] = useState<GridChannel>('instagram_feed');
  const grid = useQuery({
    queryKey: ['publications-grid', channel],
    queryFn: () => api<GridEntry[]>(`/publications/grid?channel=${channel}`),
  });
  const repeated = (grid.data || []).filter((e) => e.warnings?.length);
  return (
    <div className="page grid-page">
      <PageHeader title="Siatka profilu" kind="publication" />
      <div className="segmented">
        {(Object.keys(labels) as GridChannel[]).map((c) => (
          <button key={c} aria-pressed={channel === c} onClick={() => setChannel(c)}>
            {labels[c]}
          </button>
        ))}
      </div>
      {grid.isPending && <p className="hint">Wczytuję siatkę…</p>}
      {grid.error && <p className="error">{message(grid.error)}</p>}
      {grid.data && grid.data.length === 0 && (
        <p className="hint">Brak opublikowanych ani zaplanowanych postów w tym kanale.</p>
      )}
      {grid.data && grid.data.length > 0 && (
        <div className="grid-page-body">
          <div className={channel === 'instagram_feed' ? 'grid-tiles is-profile' : 'grid-tiles is-timeline'}>
            {grid.data.map((e) => (
              <Link
                key={e.itemId}
                to={`/publikacje/${e.publicationId}`}
                className="grid-link"
                title={`${e.title} · ${e.composition}`}
              >
                <GridTile entry={e} />
              </Link>
            ))}
          </div>
          <aside className="grid-notes">
            <h2>Powtórzenia</h2>
            {repeated.length === 0 ? (
              <p className="hint">Każdy post wygląda inaczej niż poprzedni. Tak trzymać.</p>
            ) : (
              <ul>
                {repeated.map((e) => (
                  <li key={e.itemId}>
                    <Link to={`/publikacje/${e.publicationId}`}>{e.title}</Link>
                    {e.warnings!.map((w) => (
                      <span key={w.rule}>
                        <AlertTriangle size={13} /> {w.message}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
