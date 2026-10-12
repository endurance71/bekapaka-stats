import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { message, send } from '../lib/api';
import { warsawIso } from '../lib/dates';
import { keys, usePublications, useSeasonMatches, useSeasons } from '../lib/queries';
import { initialSeason } from '../lib/seasons';
import { channels, type ChannelId, type PublicationSummary, type Suggestion } from '../lib/publications';
import { useShell } from '../app/shell-context';
import { ChannelBadge } from '../features/publications/bits';
import '../features/publications/publications.css';

const ZONE = 'Europe/Warsaw';
const dayKey = (iso: string) => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date(iso));
const timeOf = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    new Date(iso),
  );
const weekdays = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nd'];
const slug: Record<ChannelId, string> = {
  instagram_feed: 'instagram',
  instagram_story: 'relacja',
  facebook: 'facebook',
  website: 'strona',
};

// Month grid in Warsaw time, Monday first. Day keys are plain YYYY-MM-DD strings.
function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(Date.UTC(year, month, 1 - offset + i));
    return { key: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month };
  });
}

type Entry = { p: PublicationSummary; item: PublicationSummary['items'][number] };
type Match = Suggestion['match'];

export default function CalendarPage() {
  const client = useQueryClient();
  const { setError, openNewPublication } = useShell();
  const publications = usePublications();
  const seasons = useSeasons();
  const seasonId = initialSeason(seasons.data || []);
  const seasonMatches = useSeasonMatches(seasonId);
  const today = dayKey(new Date().toISOString());
  const [cursor, setCursor] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  }));
  const [dragging, setDragging] = useState<Entry | null>(null);
  const cells = monthCells(cursor.year, cursor.month);
  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const p of publications.data || [])
      for (const item of p.items) {
        if (!item.plannedAt || item.status === 'skipped') continue;
        const key = dayKey(item.plannedAt);
        map.set(
          key,
          [...(map.get(key) || []), { p, item }].sort((a, b) => a.item.plannedAt!.localeCompare(b.item.plannedAt!)),
        );
      }
    return map;
  }, [publications.data]);
  // Matches sit in the grid next to the publications, so a match without a preview is visible at a glance.
  const matchesByDay = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of seasonMatches.data || []) {
      if (!Number.isFinite(Date.parse(m.date))) continue;
      const key = dayKey(m.date);
      map.set(key, [...(map.get(key) || []), m]);
    }
    return map;
  }, [seasonMatches.data]);
  const previewed = useMemo(
    () =>
      new Set(
        (publications.data || [])
          .filter((p) => p.playbook === 'match-preview' && p.sourceRef)
          .map((p) => p.sourceRef!.id),
      ),
    [publications.data],
  );
  const label = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(cursor.year, cursor.month, 1)),
  );
  const shift = (delta: number) =>
    setCursor(({ year, month }) => ({
      year: year + Math.floor((month + delta) / 12),
      month: (((month + delta) % 12) + 12) % 12,
    }));

  // Dropping keeps the time of day and moves the variant to another date.
  async function move(entry: Entry, day: string) {
    if (!entry.item.plannedAt || dayKey(entry.item.plannedAt) === day || entry.item.status === 'published') return;
    try {
      await send(
        `/publications/${entry.p.id}/items/${entry.item.id}`,
        { expectedRevision: entry.item.revision, plannedAt: warsawIso(`${day}T${timeOf(entry.item.plannedAt)}`) },
        'PUT',
      );
      await client.invalidateQueries({ queryKey: keys.publications });
    } catch (err) {
      setError(message(err));
    }
  }

  return (
    <>
      <PageHeader title="Kalendarz publikacji" kind="publication" />
      <div className="calendar-toolbar">
        <button className="icon-button" aria-label="Poprzedni miesiąc" onClick={() => shift(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2>{label}</h2>
        <button className="icon-button" aria-label="Następny miesiąc" onClick={() => shift(1)}>
          <ChevronRight size={18} />
        </button>
        <button
          className="text-button"
          onClick={() => setCursor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 })}
        >
          Dziś
        </button>
        <span className="muted small">Przeciągnij wpis na inny dzień, aby zmienić termin.</span>
      </div>
      <div className="calendar" role="grid" aria-label={`Kalendarz ${label}`}>
        {weekdays.map((d) => (
          <div key={d} className="calendar-head" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((c) => (
          <div
            key={c.key}
            role="gridcell"
            className={`calendar-day ${c.inMonth ? '' : 'is-outside'} ${c.key === today ? 'is-today' : ''} ${dragging ? 'is-drop' : ''}`}
            onDragOver={(e) => dragging && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging) void move(dragging, c.key);
              setDragging(null);
            }}
          >
            <span className="calendar-date">{c.day}</span>
            {(matchesByDay.get(c.key) || []).map((m) => {
              const played = m.scoreUs !== null && m.scoreThem !== null;
              const needsPreview = !played && Date.parse(m.date) > Date.now() && !previewed.has(m.id);
              return (
                <div
                  key={m.id}
                  className={`calendar-match ${played ? 'is-played' : ''}`}
                  title={`Mecz KALK${m.round ? ` · ${m.round}` : ''} · BeKaPaKa – ${m.opponent}`}
                >
                  <span>
                    {played ? `${m.scoreUs}:${m.scoreThem}` : timeOf(m.date)} BeKaPaKa – {m.opponent}
                  </span>
                  {needsPreview && (
                    <button
                      className="calendar-match-action"
                      onClick={() => openNewPublication({ playbook: 'match-preview', source: { id: m.id, seasonId } })}
                    >
                      Zapowiedź
                    </button>
                  )}
                </div>
              );
            })}
            {(byDay.get(c.key) || []).map((entry) => (
              <Link
                key={entry.item.id}
                to={`/publikacje/${entry.p.id}/${slug[entry.item.channel as ChannelId]}`}
                className={`calendar-entry is-${entry.item.status}`}
                draggable={entry.item.status !== 'published'}
                onDragStart={() => setDragging(entry)}
                onDragEnd={() => setDragging(null)}
                title={`${channels[entry.item.channel as ChannelId].label} · ${entry.p.title}`}
              >
                <ChannelBadge channel={entry.item.channel as ChannelId} status={entry.item.status} />
                <span>
                  {timeOf(entry.item.plannedAt!)} {entry.p.title}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
