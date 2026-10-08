import { Link } from 'react-router';
import { ArrowUpRight, CalendarClock, CheckCircle2, Lightbulb, PenLine } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useBudget, usePublications, useSuggestions } from '../lib/queries';
import { channels, playbook, publicationState, shortDate, type ChannelId } from '../lib/publications';
import { useShell } from '../app/shell-context';
import { ChannelBadge, formatDateTime } from '../features/publications/bits';
import PublicationRow from '../features/publications/PublicationRow';
import '../features/publications/publications.css';

export default function DashboardPage() {
  const { openNewPublication } = useShell();
  const suggestions = useSuggestions();
  const publications = usePublications();
  const budget = useBudget();
  const list = publications.data || [];
  const now = Date.now();
  const inWork = list.filter((p) => publicationState(p.items).key === 'draft');
  const ready = list.filter((p) => ['approved', 'partial'].includes(publicationState(p.items).key));
  const upcoming = list
    .flatMap((p) =>
      p.items.filter((i) => i.status !== 'published' && i.status !== 'skipped' && i.plannedAt).map((i) => ({ p, i })),
    )
    .filter(({ i }) => Date.parse(i.plannedAt!) >= now - 3600_000 && Date.parse(i.plannedAt!) <= now + 7 * 86400_000)
    .sort((a, b) => Date.parse(a.i.plannedAt!) - Date.parse(b.i.plannedAt!));

  return (
    <>
      <PageHeader title="Pulpit" kind="publication" />
      <div className="dashboard-grid">
        <section className="dash-card dash-suggestions">
          <h2>
            <Lightbulb size={18} /> Do przygotowania
          </h2>
          {suggestions.isPending && <p className="muted">Sprawdzam terminarz KALK…</p>}
          {suggestions.data?.length === 0 && (
            <p className="muted">Wszystkie mecze w najbliższych dniach mają publikacje.</p>
          )}
          {suggestions.data?.map((s) => (
            <div className="suggestion" key={`${s.playbook}-${s.match.id}`}>
              <div>
                <b>
                  {playbook(s.playbook)?.label} · BeKaPaKa – {s.match.opponent}
                </b>
                <small>
                  {shortDate(s.match.date)} · {s.reason}
                </small>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  openNewPublication({ playbook: s.playbook, source: { id: s.match.id, seasonId: s.seasonId } })
                }
              >
                Przygotuj <ArrowUpRight size={15} />
              </button>
            </div>
          ))}
        </section>
        <section className="dash-card">
          <h2>
            <CalendarClock size={18} /> Najbliższe 7 dni
          </h2>
          {!upcoming.length && <p className="muted">Brak zaplanowanych wpisów.</p>}
          <ul className="upcoming-list">
            {upcoming.map(({ p, i }) => (
              <li key={i.id}>
                <Link to={`/publikacje/${p.id}`}>
                  <span>{formatDateTime(i.plannedAt)}</span>
                  <ChannelBadge channel={i.channel as ChannelId} status={i.status} />
                  <b>{p.title}</b>
                  <small>{channels[i.channel as ChannelId].short}</small>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="text-button" to="/kalendarz">
            Cały kalendarz <ArrowUpRight size={14} />
          </Link>
        </section>
        <section className="dash-card">
          <h2>
            <PenLine size={18} /> W przygotowaniu <span className="count">{inWork.length}</span>
          </h2>
          {inWork.slice(0, 6).map((p) => (
            <PublicationRow key={p.id} p={p} />
          ))}
          {!inWork.length && <p className="muted">Nic w toku.</p>}
        </section>
        <section className="dash-card">
          <h2>
            <CheckCircle2 size={18} /> Gotowe do publikacji <span className="count">{ready.length}</span>
          </h2>
          {ready.slice(0, 6).map((p) => (
            <PublicationRow key={p.id} p={p} />
          ))}
          {!ready.length && <p className="muted">Po zatwierdzeniu kanały pojawią się tutaj.</p>}
        </section>
      </div>
      {budget.data && (
        <p className="muted small dash-budget">
          Budżet AI: {(budget.data.remainingMicros / 1e6).toFixed(2)} z {(budget.data.limitMicros / 1e6).toFixed(2)} USD
          w {budget.data.month}
          {!budget.data.configured && ' · brak kluczy API (schematy działają bez AI)'}
        </p>
      )}
    </>
  );
}
