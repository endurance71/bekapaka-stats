import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { fetchJSON, postJSON } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  useAiCatalog,
  type AiAuditEntry,
  type AiAuditSummary,
  type AiCatalogItem
} from '../../hooks/useAiCatalog';
import { useSeasonPreferenceContext } from '../../context/SeasonPreferenceContext';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import PageHeader from '../../shared/ui/PageHeader';
import PageLoader from '../../shared/ui/PageLoader';
import { pluralPl } from '../../shared/lib/plural';
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

type GenerateTarget = Pick<AiCatalogItem, 'generateKind' | 'generateTarget'> & {
  seasonId?: string | null;
};

/** Ręczna (re)generacja analizy — sezon z pozycji katalogu lub z wybranego sezonu panelu. */
async function runGenerate(
  item: GenerateTarget,
  force: boolean,
  fallbackSeasonId: string | null
): Promise<void> {
  const seasonId = item.seasonId || fallbackSeasonId || undefined;
  switch (item.generateKind) {
    case 'briefing':
      await postJSON('/api/ai/briefing/generate', { force, seasonId });
      return;
    case 'match':
      if (!item.generateTarget) throw new Error('Brak identyfikatora meczu');
      await postJSON(`/api/games/${item.generateTarget}/analyze`, { force, seasonId });
      return;
    case 'player':
      if (!item.generateTarget) throw new Error('Brak identyfikatora zawodnika');
      await postJSON(`/api/players/${item.generateTarget}/analyze`, { force, seasonId });
      return;
    case 'scouting':
      if (!item.generateTarget) throw new Error('Brak nazwy rywala');
      await postJSON(
        `/api/scouting/analyze?opponent=${encodeURIComponent(item.generateTarget)}`,
        { force, seasonId }
      );
      return;
    case 'pregame':
      if (!item.generateTarget) throw new Error('Brak nazwy rywala');
      await postJSON('/api/tactics/pregame/generate', {
        force,
        seasonId,
        opponent: item.generateTarget
      });
      return;
    default:
      throw new Error('Nieobsługiwany typ analizy');
  }
}

const AUDIT_TYPE_LABEL: Record<AiAuditEntry['type'], string> = {
  match: 'Mecz',
  player: 'Zawodnik',
  scouting: 'Scouting',
  briefing: 'Briefing',
  pregame: 'Odprawa',
  play: 'Zagrywka AI'
};

/** Kompaktowa lista „Do regeneracji” z audytu AI (tylko admin). Regeneracja ręczna — przyciskiem. */
function AiRegenerationPanel({
  seasonId,
  configured,
  onRegenerated
}: {
  seasonId: string | null;
  configured: boolean;
  onRegenerated: () => Promise<void> | void;
}) {
  const [audit, setAudit] = useState<AiAuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
      setAudit(await fetchJSON<AiAuditSummary>(`/api/ai/audit${q}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wykonać audytu AI');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const regenerate = async (entry: AiAuditEntry) => {
    const key = `${entry.type}:${entry.id}`;
    setBusyId(key);
    try {
      await runGenerate(
        { generateKind: entry.generateKind ?? '', generateTarget: entry.generateTarget, seasonId: entry.seasonId },
        true,
        seasonId
      );
      await Promise.all([loadAudit(), onRegenerated()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Błąd generacji AI');
    } finally {
      setBusyId(null);
    }
  };

  const entries = audit?.toRegenerate ?? [];

  return (
    <section aria-labelledby="ai-regeneration" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <span className="kicker">Audyt AI</span>
          <h2 id="ai-regeneration" className="text-[22px] sm:text-[24px] leading-none text-bkpk-text-primary">
            Do regeneracji{' '}
            <span className="tabular-nums text-bkpk-text-muted">
              {audit ? `${audit.counts.needsRegeneration} / ${audit.counts.total}` : '—'}
            </span>
          </h2>
          {audit ? (
            <p className="text-xs text-bkpk-text-muted tabular-nums">
              Nieaktualne {audit.counts.stale} · niekompletne {audit.counts.incomplete} · szablony{' '}
              {audit.counts.templates} · podejrzane fakty {audit.counts.suspicious}
            </p>
          ) : null}
        </div>
        <BkpkButton variant="ghost" size="sm" onClick={() => void loadAudit()} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : null}
          Sprawdź ponownie
        </BkpkButton>
      </div>

      {error ? (
        <p className="border border-bkpk-text-danger border-l-4 bg-bkpk-surface px-4 py-3 text-sm text-bkpk-text-danger">
          {error}
        </p>
      ) : null}

      {loading && !audit ? <p className="text-sm text-bkpk-text-muted">Audyt analiz AI…</p> : null}

      {audit && entries.length === 0 ? (
        <p className="border border-bkpk-border-subtle bg-bkpk-surface px-4 py-3 text-sm text-bkpk-text-secondary">
          Wszystkie analizy są kompletne i aktualne.
        </p>
      ) : null}

      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const key = `${entry.type}:${entry.id}`;
            const canRegenerate = Boolean(entry.generateKind) && configured;
            return (
              <li
                key={key}
                className="flex flex-col gap-3 border border-bkpk-border-subtle bg-bkpk-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="kicker">{AUDIT_TYPE_LABEL[entry.type]}</span>
                  <p className="truncate text-sm font-semibold text-bkpk-text-primary">{entry.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.reasons.map((reason) => (
                      <span key={reason} className="status-flag text-bkpk-text-danger">
                        {reason}
                      </span>
                    ))}
                  </div>
                  {entry.suspiciousNumbers.length || entry.suspiciousNames.length ? (
                    <p className="text-xs text-bkpk-text-muted">
                      Poza danymi:{' '}
                      {[
                        ...entry.suspiciousNumbers.map((n) => String(n.value)),
                        ...entry.suspiciousNames.map((n) => n.name)
                      ].join(', ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {entry.viewPath ? (
                    <Link
                      to={entry.viewPath}
                      className="label-caps inline-flex min-h-[44px] items-center px-3 text-[12px] text-bkpk-text-secondary hover:text-bkpk-text-primary"
                    >
                      Zobacz
                    </Link>
                  ) : null}
                  {canRegenerate ? (
                    <BkpkButton
                      variant="ghost"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => void regenerate(entry)}
                    >
                      {busyId === key ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Bot className="mr-1.5 h-4 w-4" aria-hidden />
                      )}
                      Regeneruj
                    </BkpkButton>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
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
        variant="flat"
        padding="none"
        className="hover:border-bkpk-border-strong transition-colors"
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg uppercase leading-tight text-bkpk-text-primary sm:text-xl">
              {item.title}
            </p>
            {item.subtitle ? (
              <p className="mt-1 text-sm text-bkpk-text-muted truncate">{item.subtitle}</p>
            ) : null}
            <p className="mt-2 text-xs font-medium text-bkpk-text-secondary tabular-nums">
              Data wygenerowania:{' '}
              <span className={item.hasContent ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted'}>
                {formatGeneratedAt(item.generatedAt)}
              </span>
              {item.model ? ` · ${item.model}` : ''}
            </p>
            {item.stale && item.hasContent ? (
              <p className="mt-1.5 text-xs font-semibold text-bkpk-text-danger">
                Raport może być nieaktualny — rozważ ponowną generację.
              </p>
            ) : null}
            {item.isTemplate && item.hasContent ? (
              <p className="mt-1.5 text-xs font-semibold text-bkpk-text-danger">
                Plan z szablonu (bez Gemini) — wygeneruj ponownie.
              </p>
            ) : null}
            {!item.canGenerate && isAdmin && item.type === 'match' ? (
              <p className="mt-1.5 text-xs text-bkpk-text-muted">
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
                className="text-[13px]"
              >
                Zobacz analizę
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </BkpkButton>
            ) : (
              <BkpkButton
                variant="ghost"
                size="sm"
                onClick={() => onView(item)}
                className="text-[13px]"
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
                className="text-[13px]"
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
                className="label-caps min-h-[44px] px-3 text-[12px] text-bkpk-text-muted underline-offset-4 hover:text-bkpk-text-primary hover:underline disabled:opacity-50"
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
  const { seasonId } = useSeasonPreferenceContext();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (catalog?.summary) {
      return {
        total: catalog.summary.total,
        withContent: catalog.summary.withContent,
        upcomingExcluded: catalog.summary.upcomingExcluded
      };
    }
    const items = catalog?.items ?? [];
    // Pozycje, których nie da się wygenerować (brak box score), nie są liczone jako oczekujące.
    const actionable = items.filter((i) => i.hasContent || i.canGenerate);
    return {
      total: actionable.length,
      withContent: items.filter((i) => i.hasContent).length,
      upcomingExcluded: 0
    };
  }, [catalog?.items, catalog?.summary]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; withContent: number }>();
    for (const item of catalog?.items ?? []) {
      const current = map.get(item.category) ?? { total: 0, withContent: 0 };
      if (item.hasContent || item.canGenerate) current.total += 1;
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
      await runGenerate(item, force, seasonId);
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
    return <PageLoader label="Ładowanie katalogu AI…" />;
  }

  const categoryMeta = categorySlug ? getCategoryMeta(categorySlug) : null;

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="space-y-4">
        {categorySlug ? (
          <Link
            to="/ai"
            className="inline-flex min-h-[44px] items-center gap-2 label-caps text-[12px] text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Wszystkie kategorie
          </Link>
        ) : null}
        <PageHeader
          kicker={categorySlug ? undefined : 'Centrum analiz'}
          title={
            categoryMeta ? (
              <>
                {categoryMeta.label}{' '}
                <span className="text-bkpk-primary">AI</span>
              </>
            ) : (
              <>
                Analizy <span className="text-bkpk-primary">AI</span>
              </>
            )
          }
          description={
            <>
              {categoryMeta
                ? categoryMeta.description
                : 'Wybierz kategorię — briefing, mecze, plany zawodników lub scouting.'}
              {!categorySlug && isAdmin ? ' Jako administrator możesz generować i odświeżać raporty.' : ''}
            </>
          }
        />
      </div>

      <BkpkCard variant="flat">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-bkpk-border-strong">
              <Bot className="h-5 w-5 text-bkpk-primary" aria-hidden />
            </div>
            <div>
              <p className="text-base font-semibold text-bkpk-text-primary">
                <span className="font-display text-2xl leading-none tabular-nums">{stats.withContent} / {stats.total}</span> raportów wygenerowanych
              </p>
              <p className="mt-1 text-xs text-bkpk-text-muted">
                Model: {catalog?.model ?? '—'}
                {catalog?.configured === false ? ' · Gemini nie skonfigurowane' : ''}
                {stats.upcomingExcluded > 0
                  ? ` · pominięto ${stats.upcomingExcluded} ${pluralPl(stats.upcomingExcluded, 'nadchodzący mecz', 'nadchodzące mecze', 'nadchodzących meczów')}`
                  : ''}
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
        <p className="border border-bkpk-text-danger border-l-4 bg-bkpk-surface px-4 py-3 text-sm text-bkpk-text-danger">
          {error}
        </p>
      ) : null}

      {!categorySlug && isAdmin ? (
        <AiRegenerationPanel
          seasonId={seasonId}
          configured={catalog?.configured ?? false}
          onRegenerated={loadCatalog}
        />
      ) : null}

      {!categorySlug ? (
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] [&>*]:h-full">
          {AI_CATEGORIES.map((cat) => {
            const slug = cat.slug;
            const label = categoryLabelFromSlug(slug);
            const catStat = categoryStats.get(label) ?? { total: 0, withContent: 0 };
            return (
              <Link
                key={slug}
                to={`/ai/${slug}`}
                className="group flex h-full flex-col border border-bkpk-border-subtle border-t-2 border-t-bkpk-border-strong bg-bkpk-surface p-5 transition-colors hover:border-bkpk-border-strong hover:border-t-bkpk-primary hover:bg-bkpk-surface-elevated"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-3">
                    <span className="kicker tabular-nums">
                      {catStat.withContent} / {catStat.total} gotowych
                    </span>
                    <h2 className="text-[24px] sm:text-[28px] leading-none text-bkpk-text-primary">
                      {cat.label}
                    </h2>
                    <p className="text-sm text-bkpk-text-secondary">{cat.description}</p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-bkpk-text-muted group-hover:text-bkpk-text-primary group-hover:translate-x-0.5 transition-[color,transform]"
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
          <ul className="space-y-3">
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
