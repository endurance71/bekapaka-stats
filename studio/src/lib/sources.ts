import { query } from './api';
import type { Source } from './types';

export type SourceKind = 'match' | 'player' | 'event' | 'news';
export const sourceLabels: Record<SourceKind, string> = {
  match: 'Mecz',
  player: 'Zawodnik',
  event: 'Wydarzenie CMS',
  news: 'Aktualność CMS',
};

// Only sources that can actually fill the family's fields are offered.
// Statistics use their own importer; partners are picked from the registry.
const byFamily: Record<string, SourceKind[]> = {
  announcement: ['match', 'event'],
  result: ['match'],
  lineup: ['match'],
  player: ['player', 'match'],
  tournament: ['event', 'news'],
  report: ['match', 'news', 'event'],
  schedule: ['news', 'event', 'match'],
  club: ['news', 'event', 'player'],
  partners: [],
  statistics: [],
};
export const sourcesFor = (family: string): SourceKind[] => byFamily[family] ?? [];

export function initialSourceKind(family: string, variant: string, saved: string): SourceKind | '' {
  const allowed = sourcesFor(family);
  if (allowed.includes(saved as SourceKind)) return saved as SourceKind;
  if (family === 'club' && variant === 'birthday') return 'player';
  return allowed[0] ?? '';
}

export const listPath = (kind: SourceKind, seasonId: string) =>
  kind === 'match'
    ? `/sources/matches?${query({ seasonId })}`
    : kind === 'player'
      ? '/sources/players'
      : `/sources/cms/${kind}`;

export const snapshotPath = (source: Pick<Source, 'kind' | 'id' | 'seasonId' | 'subjectId' | 'view'>) =>
  `/sources/snapshot?${query({
    kind: source.kind,
    id: source.id,
    seasonId: source.seasonId,
    subjectId: source.subjectId || '',
    view: source.view || 'team',
  })}`;

// Keys a source snapshot may overwrite in the project content.
export const importableKeys = [
  'opponent',
  'date',
  'venue',
  'scoreUs',
  'scoreThem',
  'firstName',
  'lastName',
  'number',
  'position',
  'statistics',
  'title',
  'body',
  'tableRows',
  'statScope',
  'attribution',
] as const;
