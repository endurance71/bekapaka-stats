import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, ChevronRight, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { postJSON } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useAiCatalog, type AiCatalogItem } from '../../hooks/useAiCatalog';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import {
  AI_CATEGORIES,
  categoryLabelFromSlug,
  getCategoryMeta,
  type AiCategorySlug
} from '../../lib/aiCatalogCategories';

export type { AiCatalogItem };

interface AiCatalogHubProps {
  /** Brak slug = ekran wyboru kategorii */
  categorySlug?: AiCategorySlug;
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

function AiCatalogItemRow({
  item,
  isAdmin,
  configured,
  isGenerating,
  onGenerate,
  onView
}: {
  item: AiCatalogItem;
  isAdmin: boolean;
  configured: boolean;
  isGenerating: boolean;
  onGenerate: (item: AiCatalogItem, force: boolean) => void;
  onView: (item: AiCatalogItem) => void;
}) {
  return (
    <li>
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
                onClick={() => onView(item)}
                className="min-h-9 !py-2 text-xs font-black uppercase tracking-widest"
              >
                Zobacz analizę
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </BkpkButton>
            ) : (
              <BkpkButton
                variant="ghost"
                size="sm"
                onClick={() => onView(item)}
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
                disabled={isGenerating || !configured}
                onClick={() => onGenerate(item, false)}
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
                disabled={isGenerating || !configured}
                onClick={() => onGenerate(item, true)}
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
}

export default function AiCatalogHub({ categorySlug }: AiCatalogHubProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const { catalog, loading, error, loadCatalog } = useAiCatalog();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const items = catalog?.items ?? [];
    const withContent = items.filter((i) => i.hasContent).length;
    return { total: items.length, withContent };
  }, [catalog?.items]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; withContent: number }>();
    for (const item of catalog?.items ?? []) {
      const current = map.get(item.category) ?? { total: 0, withContent: 0 };
      current.total += 1;
      if (item.hasContent) current.withContent += 1;
      map.set(item.category, current);
    }
    return map;
  }, [catalog?.items]);

  const categoryItems = useMemo(() => {
    if (!categorySlug) return [];
    const label = categoryLabelFromSlug(categorySlug);
    return (catalog?.items ?? []).filter((item) => item.category === label);
  }, [catalog?.items, categorySlug]);

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

  const categoryMeta = categorySlug ? getCategoryMeta(categorySlug) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        {categorySlug ? (
          <Link
            to="/ai"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted hover:text-bkpk-primary transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Wszystkie kategorie
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span>Centrum analiz</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight">
          {categoryMeta ? (
            <>
              {categoryMeta.label}{' '}
              <span className="text-bkpk-primary">AI</span>
            </>
          ) : (
            <>
              Analizy <span className="text-bkpk-primary">AI</span>
            </>
          )}
        </h1>
        <p className="text-bkpk-text-muted text-sm sm:text-lg max-w-2xl">
          {categoryMeta
            ? categoryMeta.description
            : 'Wybierz kategorię — briefing, mecze, plany zawodników lub scouting.'}
          {!categorySlug && isAdmin ? ' Jako administrator możesz generować i odświeżać raporty.' : ''}
        </p>
      </header>

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

      {!categorySlug ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {AI_CATEGORIES.map((cat) => {
            const slug = cat.slug;
            const label = categoryLabelFromSlug(slug);
            const catStat = categoryStats.get(label) ?? { total: 0, withContent: 0 };
            return (
              <Link
                key={slug}
                to={`/ai/${slug}`}
                className="group block rounded-2xl border border-bkpk-border-strong bg-bkpk-surface-tint-1 p-5 transition-colors hover:border-bkpk-primary/30 hover:bg-bkpk-surface-tint-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-outfit text-lg font-black text-bkpk-text-primary group-hover:text-bkpk-primary transition-colors">
                      {cat.label}
                    </h2>
                    <p className="mt-1 text-sm text-bkpk-text-muted">{cat.description}</p>
                    <p className="mt-3 text-xs font-bold text-bkpk-text-secondary">
                      {catStat.withContent} / {catStat.total} gotowych
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-bkpk-text-muted group-hover:text-bkpk-primary transition-colors"
                    aria-hidden
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <section className="space-y-3" aria-labelledby="ai-category-items">
          <h2 id="ai-category-items" className="sr-only">
            {categoryMeta?.label}
          </h2>
          <ul className="space-y-2">
            {categoryItems.map((item) => (
              <AiCatalogItemRow
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                configured={catalog?.configured ?? false}
                isGenerating={generatingId === item.id}
                onGenerate={(i, force) => void handleGenerate(i, force)}
                onView={handleView}
              />
            ))}
          </ul>
          {!loading && categoryItems.length === 0 ? (
            <p className="text-center text-bkpk-text-muted py-8 text-sm">
              Brak pozycji w tej kategorii.
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
