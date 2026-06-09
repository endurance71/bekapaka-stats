import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayViewportHeight, usePageScrollLock } from '@bekapaka/safari-overlay';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ChevronRight, Loader2, X } from 'lucide-react';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';

const PROSE_CLASSES = cn(
  'prose prose-invert max-w-none',
  'prose-headings:font-outfit prose-headings:font-black prose-headings:text-bkpk-text-primary',
  'prose-p:text-bkpk-text-secondary prose-li:text-bkpk-text-secondary',
  'prose-strong:text-bkpk-primary',
  'prose-table:text-bkpk-text-secondary prose-th:text-bkpk-text-primary',
  'prose-headings:mt-5 prose-headings:mb-3 prose-p:leading-relaxed prose-li:my-1'
);

export interface ScoutingPersonnelContent {
  keyPlayers?: string;
  threats?: string;
  matchups?: string;
  bench?: string;
}

export interface StructuredAiAnalysis {
  summary: string;
  offense: string;
  defense: string;
  verdict: string;
  lockerRoom?: string[];
  personnel?: ScoutingPersonnelContent;
}

function asSectionString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  return '';
}

function structuredFromRecord(parsed: Record<string, unknown>): StructuredAiAnalysis | null {
  const summary = asSectionString(parsed.summary ?? parsed.overview);
  if (!summary && !asSectionString(parsed.offense) && !asSectionString(parsed.defense)) {
    return null;
  }

  const personnelRaw = parsed.personnel;
  const personnel =
    personnelRaw && typeof personnelRaw === 'object'
      ? {
          keyPlayers: asSectionString((personnelRaw as Record<string, unknown>).keyPlayers),
          threats: asSectionString((personnelRaw as Record<string, unknown>).threats),
          matchups: asSectionString((personnelRaw as Record<string, unknown>).matchups),
          bench: asSectionString((personnelRaw as Record<string, unknown>).bench)
        }
      : undefined;

  return {
    summary: summary || asSectionString(parsed.offense) || 'Raport scoutingu',
    offense: asSectionString(parsed.offense ?? parsed.offensive),
    defense: asSectionString(parsed.defense ?? parsed.defensive),
    verdict: asSectionString(parsed.verdict ?? parsed.key ?? parsed.keyPoints),
    lockerRoom: Array.isArray(parsed.lockerRoom)
      ? parsed.lockerRoom.filter((item): item is string => typeof item === 'string')
      : undefined,
    personnel
  };
}

/** Wyciąga fragment JSON z markdown / otoczek. */
function extractJsonCandidate(raw: string): string | null {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]?.trim()) return fence[1].trim();
  if (trimmed.startsWith('{')) return trimmed;
  const embedded = trimmed.match(/\{[\s\S]*"summary"[\s\S]*\}/);
  return embedded?.[0] ?? null;
}

function looksLikeRawJsonDump(raw: string): boolean {
  return /"summary"\s*:/.test(raw) && (raw.trim().startsWith('{') || raw.includes('```'));
}

/** Gdy w DB trafił surowy JSON zamiast markdown — zamiana na sekcje. */
function parseStructuredFromContent(raw: string): StructuredAiAnalysis | null {
  const candidate = extractJsonCandidate(raw) ?? raw.trim();
  if (!candidate.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    return structuredFromRecord(parsed);
  } catch {
    return null;
  }
}

function resolveAiMarkdown(
  content: string | null | undefined,
  structuredContent: StructuredAiAnalysis | null | undefined
): string | null {
  const trimmed = content?.trim();
  if (trimmed) {
    const fromJson = parseStructuredFromContent(trimmed);
    if (fromJson) return structuredAnalysisToMarkdown(fromJson);
    if (structuredContent?.summary && looksLikeRawJsonDump(trimmed)) {
      return structuredAnalysisToMarkdown(structuredContent);
    }
    return trimmed;
  }
  if (structuredContent?.summary) return structuredAnalysisToMarkdown(structuredContent);
  return null;
}

export function structuredAnalysisToMarkdown(data: StructuredAiAnalysis): string {
  const parts: string[] = [];
  if (data.summary?.trim()) parts.push(`## Podsumowanie\n\n${data.summary.trim()}`);
  if (data.offense?.trim()) parts.push(`## Ofensywa\n\n${data.offense.trim()}`);
  if (data.defense?.trim()) parts.push(`## Defensywa\n\n${data.defense.trim()}`);
  if (data.verdict?.trim()) parts.push(`## Klucz\n\n${data.verdict.trim()}`);

  const p = data.personnel;
  if (p) {
    const personnelParts: string[] = [];
    if (p.keyPlayers?.trim()) personnelParts.push(`### Kluczowi zawodnicy\n\n${p.keyPlayers.trim()}`);
    if (p.threats?.trim()) personnelParts.push(`### Zagrożenia\n\n${p.threats.trim()}`);
    if (p.matchups?.trim()) personnelParts.push(`### Matchupy i obrona\n\n${p.matchups.trim()}`);
    if (p.bench?.trim()) personnelParts.push(`### Ławka i rotacja\n\n${p.bench.trim()}`);
    if (personnelParts.length) {
      parts.push(`## Analiza kadry (w planie)\n\n${personnelParts.join('\n\n')}`);
    }
  }

  if (data.lockerRoom?.length) {
    parts.push(
      `## Szatnia\n\n${data.lockerRoom.map((item, i) => `${i + 1}. ${item}`).join('\n')}`
    );
  }
  return parts.join('\n\n');
}

interface AiAnalysisBlockProps {
  title: string;
  content?: string | null;
  structuredContent?: StructuredAiAnalysis | null;
  generatedAt?: string | null;
  model?: string | null;
  /** Pokazuje przyciski generacji (zwykle tylko admin) */
  canGenerate?: boolean;
  loading: boolean;
  onGenerate?: (force?: boolean) => void;
  emptyHint?: string;
  /** Etykieta źródła, np. „Gemini” / „Szablon” */
  sourceLabel?: string | null;
  /** Krótki komunikat gdy cache jest nieaktualny (re-import, scrape KALK) */
  staleHint?: string | null;
  /** Zwarty pasek akcji (scouting, mobile) */
  compactActions?: boolean;
}

function AiAnalysisMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className={PROSE_CLASSES}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}

export default function AiAnalysisBlock({
  title,
  content,
  structuredContent,
  generatedAt,
  model,
  canGenerate = false,
  loading,
  onGenerate,
  emptyHint = 'Brak analizy AI. Administrator może ją wygenerować.',
  sourceLabel,
  staleHint,
  compactActions = false
}: AiAnalysisBlockProps) {
  const markdown = useMemo(
    () => resolveAiMarkdown(content, structuredContent),
    [content, structuredContent]
  );

  const hasContent = Boolean(markdown);

  const [modalOpen, setModalOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useOverlayViewportHeight(modalOpen);
  usePageScrollLock(modalOpen, { htmlClass: 'is-overlay-open' });

  useEffect(() => {
    if (!modalOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };

    document.addEventListener('keydown', handleEsc);

    const frame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEsc);
      cancelAnimationFrame(frame);
    };
  }, [modalOpen]);

  const metaLine = generatedAt
    ? `Wygenerowano ${new Date(generatedAt).toLocaleString('pl-PL')}${model ? ` · ${model}` : ''}${sourceLabel ? ` · ${sourceLabel}` : ''}`
    : sourceLabel ?? null;

  const handleOpenModal = () => {
    if (hasContent) setModalOpen(true);
  };

  return (
    <>
      <BkpkCard variant="glass" className="border-bkpk-primary/20" padding="none">
        <div
          className={cn(
            'p-4 sm:p-5',
            (loading && !hasContent) || (!hasContent && !loading) ? 'border-b border-bkpk-border-strong/60' : ''
          )}
        >
          <div
            className={cn(
              'flex gap-3',
              compactActions ? 'flex-col' : 'flex-col sm:flex-row sm:items-start sm:justify-between'
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl border border-bkpk-primary/20 bg-bkpk-primary/10 p-2.5">
                <Bot className="h-5 w-5 text-bkpk-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="font-outfit text-base font-black leading-tight tracking-tight text-bkpk-text-primary sm:text-lg">
                  {title}
                </h3>
                {metaLine ? (
                  <p className="mt-1 text-xs font-medium text-bkpk-text-secondary">{metaLine}</p>
                ) : (
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-bkpk-text-muted">
                    {hasContent ? 'Raport dostępny' : 'Brak raportu'}
                  </p>
                )}
                {staleHint && hasContent ? (
                  <p className="mt-1.5 text-[11px] font-semibold leading-snug text-bkpk-warning">{staleHint}</p>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                'flex shrink-0 items-center gap-2',
                compactActions ? 'w-full' : 'flex-wrap sm:justify-end'
              )}
            >
              {hasContent ? (
                <BkpkButton
                  variant="primary"
                  size="md"
                  onClick={handleOpenModal}
                  disabled={loading}
                  className={cn(
                    'min-h-9 font-black uppercase tracking-widest shadow-bkpk-primary !py-2 text-xs',
                    compactActions && 'flex-1'
                  )}
                  aria-haspopup="dialog"
                >
                  Zobacz analizę
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                </BkpkButton>
              ) : null}

              {canGenerate && onGenerate ? (
                <BkpkButton
                  variant={hasContent ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => onGenerate(false)}
                  disabled={loading}
                  className={cn('min-h-9 !py-2', compactActions && hasContent && 'shrink-0 px-3')}
                >
                  {loading ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Bot className="mr-1.5 h-4 w-4" aria-hidden />
                  )}
                  {hasContent ? 'Odśwież' : 'Generuj'}
                </BkpkButton>
              ) : null}
            </div>

            {canGenerate && onGenerate && hasContent ? (
              <button
                type="button"
                onClick={() => onGenerate(true)}
                disabled={loading}
                className="self-start text-left text-xs font-medium text-bkpk-text-secondary underline-offset-2 hover:text-bkpk-text-primary hover:underline disabled:opacity-50"
              >
                Wymuś ponowną generację
              </button>
            ) : null}
          </div>
        </div>

        {loading && !hasContent ? (
          <div className="p-4 sm:p-5 space-y-3" aria-busy="true" aria-label="Generowanie analizy">
            <div className="h-4 w-3/4 rounded-lg bg-bkpk-surface-tint-3 animate-pulse" />
            <div className="h-3 w-full rounded-lg bg-bkpk-surface-tint-2 animate-pulse" />
            <div className="h-3 w-5/6 rounded-lg bg-bkpk-surface-tint-2 animate-pulse" />
            <div className="h-3 w-2/3 rounded-lg bg-bkpk-surface-tint-2 animate-pulse" />
          </div>
        ) : null}

        {!hasContent && !loading ? (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <p className="text-sm text-bkpk-text-muted leading-relaxed">{emptyHint}</p>
          </div>
        ) : null}
      </BkpkCard>

      {typeof document !== 'undefined' && markdown
        ? createPortal(
            <AnimatePresence>
              {modalOpen ? (
                <div
                  className="fixed left-0 right-0 z-[200] flex sm:items-center sm:justify-center sm:p-4 overlay-viewport-fill sm:inset-0 sm:top-0"
                  role="presentation"
                >
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 overlay-viewport-fill bg-bkpk-overlay-strong backdrop-blur-md max-sm:top-0 sm:inset-0"
                    aria-label="Zamknij analizę"
                    onClick={() => setModalOpen(false)}
                  />

                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ai-analysis-modal-title"
                    initial={{ y: '100%', opacity: 0.9 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0.9 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className={cn(
                      'relative z-[201] flex w-full max-w-3xl min-h-0 flex-col border-0 overflow-hidden',
                      'bg-bkpk-surface-elevated shadow-2xl shadow-black/50',
                      'fixed inset-x-0 bottom-0 top-0 sm:static sm:inset-auto',
                      'min-h-[100lvh] max-sm:h-[var(--overlay-vh)] max-sm:min-h-[var(--overlay-vh)] max-sm:max-h-[var(--overlay-vh)]',
                      'rounded-t-2xl rounded-b-none sm:rounded-2xl sm:mx-auto',
                      'sm:h-auto sm:min-h-0 sm:max-h-[min(85dvh,calc(var(--overlay-vh,100dvh)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))]'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-bkpk-border-strong bg-bkpk-surface-elevated px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-5 sm:pb-5 sm:pt-5 shrink-0">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-bkpk-primary/10 border border-bkpk-primary/20 shrink-0">
                          <Bot className="w-5 h-5 text-bkpk-primary" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <h2
                            id="ai-analysis-modal-title"
                            className="text-lg font-black text-bkpk-text-primary font-outfit tracking-tight leading-tight"
                          >
                            {title}
                          </h2>
                          {metaLine ? (
                            <p className="text-xs font-medium text-bkpk-text-secondary mt-1">{metaLine}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="p-2 -mr-1 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 transition-colors shrink-0"
                        aria-label="Zamknij"
                      >
                        <X className="w-5 h-5" aria-hidden />
                      </button>
                    </div>

                    <div
                      className={cn(
                        'flex-1 min-h-0 overflow-y-auto overscroll-contain',
                        'px-4 sm:px-6 pt-5 sm:pt-6 pb-4',
                        'max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]',
                        'sm:pb-6'
                      )}
                      style={{ 
                        touchAction: 'pan-y', 
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehaviorY: 'contain' 
                      }}
                    >
                      <AiAnalysisMarkdown markdown={markdown} />
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
