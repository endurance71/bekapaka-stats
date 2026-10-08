import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Asset, Budget, ExportEntry, Partner, PostType, SourceItem, Template, View } from './types';
import type { Season } from './seasons';
import type { PublicationSummary, Settings, Suggestion } from './publications';

export const keys = {
  me: ['me'],
  projects: ['projects'],
  project: (id: string) => ['project', id],
  catalog: ['catalog'],
  assets: ['assets'],
  partners: ['partners'],
  budget: ['budget'],
  exports: ['exports'],
  seasons: ['seasons'],
  players: ['players'],
  brand: ['brand'],
  playbooks: ['playbooks'],
  publications: ['publications'],
  publication: (id: string) => ['publication', id],
  suggestions: ['suggestions'],
  settings: ['settings'],
} as const;

type CatalogResponse = { brandVersion: string; templates: Template[]; postTypes: PostType[] };
export type Catalog = { brandVersion: string; templates: Template[]; posts: PostType[] };

// Each resource loads independently: one failing endpoint must not blank the whole Studio.
export const useCatalog = () =>
  useQuery({
    queryKey: keys.catalog,
    queryFn: () => api<CatalogResponse>('/templates'),
    select: (t): Catalog => ({
      brandVersion: t.brandVersion,
      // Saved template state rows carry their own DB id; the family is the stable key in the UI.
      templates: t.templates.map((x) => ({ ...x, id: x.family || x.id })),
      posts: t.postTypes || [],
    }),
  });
export const useProjects = () => useQuery({ queryKey: keys.projects, queryFn: () => api<View[]>('/projects') });
export const useAssets = () => useQuery({ queryKey: keys.assets, queryFn: () => api<Asset[]>('/assets') });
export const usePartners = () => useQuery({ queryKey: keys.partners, queryFn: () => api<Partner[]>('/partners') });
export const useBudget = () => useQuery({ queryKey: keys.budget, queryFn: () => api<Budget>('/ai/budget') });
export const useExports = () => useQuery({ queryKey: keys.exports, queryFn: () => api<ExportEntry[]>('/exports') });
export const useSeasons = () =>
  useQuery({ queryKey: keys.seasons, queryFn: () => api<Season[]>('/sources/seasons'), staleTime: 5 * 60_000 });
export const usePlayers = () =>
  useQuery({ queryKey: keys.players, queryFn: () => api<SourceItem[]>('/sources/players'), staleTime: 5 * 60_000 });

export function useReloadLibrary() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      [
        keys.catalog,
        keys.assets,
        keys.partners,
        keys.budget,
        keys.exports,
        keys.projects,
        keys.publications,
        keys.suggestions,
      ].map((queryKey) => client.invalidateQueries({ queryKey })),
    ).then(() => undefined);
}

export const usePublications = (status: 'draft' | 'archived' = 'draft') =>
  useQuery({
    queryKey: [...keys.publications, status],
    queryFn: () => api<PublicationSummary[]>(`/publications?status=${status}`),
  });
export const useSuggestions = () =>
  useQuery({ queryKey: keys.suggestions, queryFn: () => api<Suggestion[]>('/publications/suggestions') });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: () => api<Settings>('/settings') });
