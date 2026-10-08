import { useCallback, useEffect, useState } from 'react';
import { fetchJSON } from '../lib/api';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

export interface AiCatalogItem {
  id: string;
  type: string;
  category: string;
  title: string;
  subtitle: string | null;
  generatedAt: string | null;
  model: string | null;
  hasContent: boolean;
  stale: boolean;
  staleReason?: string | null;
  isTemplate?: boolean;
  canGenerate: boolean;
  viewPath: string;
  generateKind: string;
  generateTarget: string | null;
  seasonId?: string | null;
}

export interface AiCatalogSummary {
  /** Pozycje możliwe do wygenerowania lub z treścią (bez meczów, których nie da się analizować). */
  total: number;
  withContent: number;
  stale: number;
  templates: number;
  unavailable: number;
  /** Mecze z terminarza w przyszłości — nie liczone jako oczekujące. */
  upcomingExcluded: number;
}

export interface AiCatalogResponse {
  configured: boolean;
  model: string;
  seasonId?: string | null;
  items: AiCatalogItem[];
  summary?: AiCatalogSummary;
}

export interface AiAuditEntry {
  type: 'match' | 'player' | 'scouting' | 'briefing' | 'pregame' | 'play';
  id: string;
  label: string;
  seasonId: string | null;
  generatedAt: string | null;
  model: string | null;
  reasons: string[];
  suspiciousNumbers: Array<{ value: number; context: string }>;
  suspiciousNames: Array<{ name: string; context: string }>;
  generateKind: string | null;
  generateTarget: string | null;
  viewPath: string | null;
}

export interface AiAuditSummary {
  generatedAt: string;
  seasonId: string | null;
  counts: {
    total: number;
    needsRegeneration: number;
    stale: number;
    incomplete: number;
    templates: number;
    suspicious: number;
  };
  toRegenerate: AiAuditEntry[];
}

export function useAiCatalog() {
  const [catalog, setCatalog] = useState<AiCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { seasonId } = useSeasonPreferenceContext();

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
      const data = await fetchJSON<AiCatalogResponse>(`/api/ai/catalog${q}`);
      setCatalog(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się załadować katalogu AI';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return { catalog, loading, error, loadCatalog };
}
