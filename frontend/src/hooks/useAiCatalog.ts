import { useCallback, useEffect, useState } from 'react';
import { fetchJSON } from '../lib/api';

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
  canGenerate: boolean;
  viewPath: string;
  generateKind: string;
  generateTarget: string | null;
}

export interface AiCatalogResponse {
  configured: boolean;
  model: string;
  items: AiCatalogItem[];
}

export function useAiCatalog() {
  const [catalog, setCatalog] = useState<AiCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON<AiCatalogResponse>('/api/ai/catalog');
      setCatalog(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się załadować katalogu AI';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return { catalog, loading, error, loadCatalog };
}
