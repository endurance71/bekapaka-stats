import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ChevronRight, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { fetchJSON, postJSON } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';

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

interface AiCatalogResponse {
  configured: boolean;
  model: string;
  items: AiCatalogItem[];
}

interface AiCatalogHubProps {
  /** Wstawka w Admin — mniejszy nagłówek */
  embedded?: boolean;
}

function formatGeneratedAt(iso: string | null): string {
  if (!iso) return 'Nie wygenerowano';
  return new Date(iso).toLocaleString('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function runGenerate(item: AiCatalogItem, force: boolean): Promise<void> {
  switch (item.generateKind) {
    case 'briefing':
      await postJSON('/api/ai/briefing/generate', { force });
      return;
    case 'match':
      if (!item.generateTarget) throw new Error('Brak identyfikatora meczu');
      await postJSON(`/api/games/${item.generateTarget}/analyze`, { force });
      return;
    case 'player':
      if (!item.generateTarget) throw new Error('Brak identyfikatora zawodnika');
      await postJSON(`/api/players/${item.generateTarget}/analyze`, { force });
      return;
    case 'scouting':
      if (!item.generateTarget) throw new Error('Brak nazwy rywala');
      await postJSON(
        `/api/scouting/analyze?opponent=${encodeURIComponent(item.generateTarget)}`,
        { force }
      );
      return;
    default:
      throw new Error('Nieobsługiwany typ analizy');
  }
}

export default function AiCatalogHub({ embedded = false }: AiCatalogHubProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [catalog, setCatalog] = useState<AiCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
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

  const grouped = useMemo(() => {
    const map = new Map<string, AiCatalogItem[]>();
    for (const item of catalog?.items ?? []) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [catalog?.items]);

  const stats = useMemo(() => {
    const items = catalog?.items ?? [];
    const withContent = items.filter((i) => i.hasContent).length;
    return { total: items.length, withContent };
  }, [catalog?.items]);

  const handleGenerate = async (item: AiCatalogItem, force = false) => {
    if (!isAdmin) return;
    setGeneratingId(item.id);
    try {
      await runGenerate(item, force);
      await loadCatalog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd generacji AI';
      alert(message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleView = (item: AiCatalogItem) => {
    if (item.viewPath.startsWith('/')) {
      navigate(item.viewPath);
      return;
    }
    window.location.href = item.viewPath;
  };

  if (loading && !catalog) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-bkpk-primary" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-widest text-bkpk-text-muted">
          Ładowanie katalogu AI…
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', embedded ? '' : 'space-y-8')}>
      {!embedded ? (
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span>Centrum analiz</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight">
            Analizy <span className="text-bkpk-primary">AI</span>
          </h1>
          <p className="text-bkpk-text-muted text-sm sm:text-lg max-w-2xl">
            Wszystkie raporty Gemini w panelu — briefing, mecze, plany zawodników i scouting.
            {isAdmin ? ' Jako administrator możesz je tu generować i odświeżać.' : ' Otwórz raport na stronie źródłowej.'}
          </p>
        </header>
      ) : (
        <p className="text-bkpk-text-secondary text-sm leading-relaxed">
          Pełna lista analiz AI w systemie. Generacja wymaga roli administratora.
          <Link to="/ai" className="ml-1 text-bkpk-primary font-bold hover:underline">
            Otwórz centrum AI
          </Link>
        </p>
      )}

      <BkpkCard variant="glass" className="border-bkpk-primary/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl border border-bkpk-primary/20 bg-bkpk-primary/10 p-2.5">
              <Bot className="h-5 w-5 text-bkpk-primary" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-bkpk-text-primary">
                {stats.withContent} / {stats.total} raportów wygenerowanych
              </p>
              <p className="mt-0.5 text-xs text-bkpk-text-muted">
                Model: {catalog?.model ?? '—'}
                {catalog?.configured === false ? ' · Gemini nie skonfigurowane' : ''}
              </p>
            </div>
          </div>
          <BkpkButton variant="ghost" size="sm" onClick={() => void loadCatalog()} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Odśwież listę
          </BkpkButton>
        </div>
      </BkpkCard>

      {error ? (
        <p className="rounded-xl border border-bkpk-danger/30 bg-bkpk-danger/10 px-4 py-3 text-sm text-bkpk-text-danger">
          {error}
        </p>
      ) : null}

      {grouped.map(([category, items]) => (
        <section key={category} className="space-y-3" aria-labelledby={`ai-cat-${category}`}>
          <h2
            id={`ai-cat-${category}`}
            className="text-xs font-black uppercase tracking-[0.2em] text-bkpk-text-muted px-1"
          >
            {category}
          </h2>
          <ul className="space-y-2">
            {items.map((item) => {
              const isGenerating = generatingId === item.id;
              return (
                <li key={item.id}>
                  <BkpkCard
                    variant="glass"
                    padding="none"
                    className="border-bkpk-border-strong/80 hover:border-bkpk-primary/25 transition-colors"
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-outfit text-sm font-black text-bkpk-text-primary sm:text-base">
                          {item.title}
                        </p>
                        {item.subtitle ? (
                          <p className="mt-0.5 text-xs text-bkpk-text-muted truncate">{item.subtitle}</p>
                        ) : null}
                        <p className="mt-1.5 text-xs font-medium text-bkpk-text-secondary">
                          Data wygenerowania:{' '}
                          <span className={item.hasContent ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted'}>
                            {formatGeneratedAt(item.generatedAt)}
                          </span>
                          {item.model ? ` · ${item.model}` : ''}
                        </p>
                        {item.stale && item.hasContent ? (
                          <p className="mt-1 text-[11px] font-semibold text-bkpk-warning">
                            Raport może być nieaktualny — rozważ ponowną generację.
                          </p>
                        ) : null}
                        {!item.canGenerate && isAdmin && item.type === 'match' ? (
                          <p className="mt-1 text-[11px] text-bkpk-text-muted">
                            Brak box score — najpierw synchronizuj KALK.
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {item.hasContent ? (
                          <BkpkButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleView(item)}
                            className="min-h-9 !py-2 text-xs font-black uppercase tracking-widest"
                          >
                            Zobacz analizę
                            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                          </BkpkButton>
                        ) : (
                          <BkpkButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(item)}
                            className="min-h-9 !py-2 text-xs"
                          >
                            Przejdź
                            <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                          </BkpkButton>
                        )}

                        {isAdmin && item.canGenerate ? (
                          <BkpkButton
                            variant={item.hasContent ? 'ghost' : 'primary'}
                            size="sm"
                            disabled={isGenerating || !catalog?.configured}
                            onClick={() => void handleGenerate(item, false)}
                            className="min-h-9 !py-2 text-xs"
                          >
                            {isGenerating ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Bot className="mr-1.5 h-4 w-4" aria-hidden />
                            )}
                            {item.hasContent ? 'Odśwież' : 'Generuj'}
                          </BkpkButton>
                        ) : null}

                        {isAdmin && item.canGenerate && item.hasContent ? (
                          <button
                            type="button"
                            disabled={isGenerating || !catalog?.configured}
                            onClick={() => void handleGenerate(item, true)}
                            className="text-[10px] font-bold uppercase tracking-wider text-bkpk-text-muted hover:text-bkpk-primary px-2 py-1 disabled:opacity-50"
                          >
                            Wymuś
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </BkpkCard>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {!loading && (catalog?.items?.length ?? 0) === 0 ? (
        <p className="text-center text-bkpk-text-muted py-8 text-sm">Brak pozycji w katalogu.</p>
      ) : null}
    </div>
  );
}
