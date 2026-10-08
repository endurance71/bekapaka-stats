import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Copy, Download, History, LoaderCircle, Undo2 } from 'lucide-react';
import { api, message, send } from '../../lib/api';
import { DESIGN_VERSION, migrateDesign } from '../../lib/contracts';
import { keys, useReloadLibrary, useSeasons } from '../../lib/queries';
import { initialSeason } from '../../lib/seasons';
import { importableKeys } from '../../lib/sources';
import type {
  Asset,
  Job,
  Partner,
  PostType,
  Project,
  Report,
  Snapshot,
  SourceItem,
  Template,
  View,
} from '../../lib/types';
import { EditorContext, type EditorContextValue } from './editor-context';
import { saveLabels, useProjectDraft } from './useProjectDraft';
import { useJob, usePreview } from './useJobs';
import { useSourceCheck } from './useSourceCheck';
import SourcePanel from './SourcePanel';
import StatisticsImport from './StatisticsImport';
import CompositionPanel from './CompositionPanel';
import ContentPanel from './ContentPanel';
import {
  CaptionPanel,
  CarouselEditor,
  LineupEditor,
  PartnersPicker,
  PhotoPanel,
  PlayerStatistics,
  ScheduleEditor,
  StatisticsTable,
} from './ListEditors';
import PreviewPanel from './PreviewPanel';
import ExportPanel from './ExportPanel';
import { AiResultModal, ApprovalModal, HistoryModal, SourceDiffModal } from './EditorModals';

type Props = {
  initial: View;
  posts: PostType[];
  templates: Template[];
  assets: Asset[];
  partners: Partner[];
  players: SourceItem[];
};
type Step = 'edit' | 'preview' | 'export';
const steps: [Step, string][] = [
  ['edit', '1. Dane'],
  ['preview', '2. Podgląd'],
  ['export', '3. Eksport'],
];

export default function GraphicEditor({ initial, posts, templates, assets, partners, players }: Props) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const reload = useReloadLibrary();
  const seasons = useSeasons();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const draft = useProjectDraft(initial, setError);
  const { view, project, readonly } = draft;
  const d = project.content;
  const [requestedFormat, setFormat] = useState(initial.payload.formats[0]);
  const format = project.formats.includes(requestedFormat) ? requestedFormat : project.formats[0];
  const [report, setReport] = useState<Report | null>(null);
  const [step, setStep] = useState<Step>('edit');
  const [season, setSeason] = useState('');
  const [history, setHistory] = useState<{ number: number; payload: Project; createdAt: string }[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiResult, setAiResult] = useState<Job | null>(null);
  const { preview, refresh, seenAt } = usePreview(initial.id, view.currentRevision, format, readonly, setError);
  const source = useSourceCheck(d.source);
  const onSettled = useCallback(
    (job: Job) => {
      if (job.status === 'completed' && job.kind === 'ai-text') setAiResult(job);
      if (job.kind.startsWith('ai-')) void reload();
    },
    [reload],
  );
  const [job, setJob] = useJob(onSettled, setError);

  const publication = posts.find((p) => p.id === project.postType);
  const template = templates.find((t) => t.id === project.family);
  const current =
    preview?.status === 'completed' && preview.revision === view.currentRevision && draft.saved === 'saved';
  const unseen = project.formats.filter((f) => !seenAt(f, view.currentRevision));

  useEffect(() => setReport(null), [project]);
  useEffect(() => {
    if (seasons.data && !season) setSeason(initialSeason(seasons.data, initial.payload.content.source.seasonId));
  }, [seasons.data, season, initial.payload.content.source.seasonId]);

  // Leaving the editor (sidebar, back button) waits for the pending autosave.
  const { flush } = draft;
  const blocker = useBlocker(() => draft.dirty());
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    flush()
      .then(() => blockerRef.current.proceed?.())
      .catch((err) => {
        setError(`Nie zapisano zmian: ${message(err)}`);
        blockerRef.current.reset?.();
      });
  }, [blocker.state, flush]);

  const action = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setError('');
      try {
        await flush();
        await fn();
      } catch (err) {
        setError(message(err));
      } finally {
        setBusy(false);
      }
    },
    [flush],
  );

  async function validate() {
    const v = await api<Report>(`/projects/${initial.id}/validation`);
    setReport(v);
    return v;
  }

  function applySource(result: Snapshot) {
    const imported: Record<string, unknown> = {};
    for (const key of importableKeys)
      if (key in result.data && result.data[key] != null) imported[key] = result.data[key];
    const content = { ...project.content, ...imported } as Project['content'];
    if (result.source.kind === 'player') content.statistics = [];
    content.references = [...content.references.filter((r) => r.kind !== result.source.kind), result.source].slice(-5);
    // A player picked for an MVP keeps the match as the primary source of the publication.
    if (!(result.source.kind === 'player' && content.source.kind === 'match' && project.family === 'player'))
      content.source = result.source;
    content.mvpConfirmed = false;
    content.lineupConfirmed = false;
    draft.change({ ...project, content });
    source.setDiff(null);
  }

  const ctx = useMemo<EditorContextValue>(
    () => ({
      project,
      d,
      readonly,
      busy,
      change: draft.change,
      field: draft.field,
      setError,
      action,
      assets,
      partners,
      players,
      publication,
      template,
    }),
    [project, d, readonly, busy, draft.change, draft.field, action, assets, partners, players, publication, template],
  );

  const { family, variant, postType } = project;
  return (
    <EditorContext.Provider value={ctx}>
      <header className="editor-header">
        <button
          className="icon-button"
          aria-label="Wróć do projektów"
          disabled={busy}
          onClick={() => navigate('/grafiki')}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <input
            className="project-name"
            aria-label="Nazwa projektu"
            value={project.name}
            maxLength={180}
            disabled={readonly}
            onChange={(e) => draft.change({ ...project, name: e.target.value })}
          />
          <span className="save-status">
            {draft.saved === 'saved' ? <Check size={12} /> : <LoaderCircle size={12} />}{' '}
            {readonly ? 'Projekt zarchiwizowany' : saveLabels[draft.saved]} · rewizja {view.currentRevision}
          </span>
        </div>
        <div className="editor-tools">
          <button
            className="icon-button"
            aria-label="Cofnij"
            title="Cofnij"
            disabled={!draft.canUndo || readonly}
            onClick={draft.undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Historia"
            title="Historia"
            onClick={() => void action(async () => setHistory(await api(`/projects/${initial.id}/revisions`)))}
          >
            <History size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Duplikuj"
            title="Duplikuj"
            onClick={() =>
              void action(async () => {
                const v = await send<View>(`/projects/${initial.id}/duplicate`, {});
                void client.invalidateQueries({ queryKey: keys.projects });
                navigate(`/grafiki/${v.id}`);
              })
            }
          >
            <Copy size={18} />
          </button>
          <button
            className="primary"
            disabled={busy || readonly}
            onClick={() => {
              setStep('export');
              void action(async () => void (await validate()));
            }}
          >
            <Download size={17} />
            <span>Eksport</span>
          </button>
        </div>
      </header>
      {error && (
        <div className="editor-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setError('')}>Zamknij</button>
          {draft.saved === 'conflict' && (
            <button
              onClick={async () => {
                draft.replace(await api<View>(`/projects/${initial.id}`));
                setError('');
              }}
            >
              Wczytaj aktualną rewizję (odrzuć niezapisane zmiany)
            </button>
          )}
        </div>
      )}
      <div className="mobile-tabs">
        {steps.map(([id, label]) => (
          <button className={step === id ? 'active' : ''} key={id} onClick={() => setStep(id)}>
            {label}
          </button>
        ))}
      </div>
      {readonly && (
        <div className="editor-error archived-banner" role="status">
          <p>Projekt jest zarchiwizowany — edycja, podgląd i eksport są wyłączone.</p>
          <button
            disabled={busy}
            onClick={() =>
              void action(async () =>
                draft.replace(await send<View>(`/projects/${initial.id}/restore`, { confirmed: true })),
              )
            }
          >
            Przywróć z archiwum
          </button>
        </div>
      )}
      {project.designVersion !== DESIGN_VERSION && (
        <div className="editor-error" role="status">
          <p>Historyczna kompozycja. Zachowujemy jej wygląd; nowe eksporty wymagają bieżącego szablonu.</p>
          <button disabled={busy || readonly} onClick={() => draft.change(migrateDesign(project) as Project)}>
            Przenieś do nowej kompozycji · zachowaj poprzednią rewizję
          </button>
        </div>
      )}
      <div className={`editor-grid step-${step}`}>
        <section className="editor-form">
          <div className="panel-heading">
            <span className="eyebrow">TREŚĆ I MATERIAŁY</span>
            <h2>{publication?.label || template?.label}</h2>
          </div>
          {family === 'statistics' ? (
            <>
              <StatisticsImport
                variant={variant}
                seasons={seasons.data || []}
                season={season}
                setSeason={setSeason}
                disabled={busy || readonly}
                importData={(result) => action(async () => applySource(result))}
              />
              {d.source.kind !== 'manual' && (
                <button
                  className="text-button"
                  onClick={() =>
                    void action(async () => {
                      if (!(await source.check())) setError('Źródło nie zmieniło się od importu.');
                    })
                  }
                >
                  Sprawdź zmiany źródła
                </button>
              )}
            </>
          ) : (
            <SourcePanel
              seasons={seasons.data || []}
              season={season}
              setSeason={setSeason}
              onImport={applySource}
              onCheck={source.check}
            />
          )}
          <CompositionPanel />
          <ContentPanel />
          {family === 'statistics' && <StatisticsTable />}
          {family === 'player' && <PlayerStatistics />}
          {family === 'lineup' && <LineupEditor />}
          {family === 'schedule' && variant === 'schedule' && <ScheduleEditor />}
          {family === 'report' && variant === 'carousel' && <CarouselEditor />}
          {family === 'partners' && <PartnersPicker />}
          {(postType || ['result', 'player', 'report'].includes(family)) && <PhotoPanel />}
          <CaptionPanel />
        </section>
        <PreviewPanel
          preview={preview}
          format={format}
          current={current}
          onRefresh={() => void action(async () => void (await refresh()))}
        />
        <ExportPanel
          projectId={initial.id}
          format={format}
          setFormat={setFormat}
          preview={preview}
          current={current}
          unseen={unseen}
          report={report}
          validate={validate}
          onConfirm={() => setConfirmOpen(true)}
          job={job}
          setJob={setJob}
          onArchive={async () => {
            await send(`/projects/${initial.id}/archive`, { confirmed: true });
            void client.invalidateQueries({ queryKey: keys.projects });
            navigate('/grafiki');
          }}
        />
      </div>
      {confirmOpen && (
        <ApprovalModal
          revision={view.currentRevision}
          busy={busy}
          disabled={!current}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() =>
            void action(async () => {
              await send(`/projects/${initial.id}/approve`, {
                confirmed: true,
                expectedRevision: draft.currentRevision(),
                previewJobId: preview!.id,
              });
              setConfirmOpen(false);
              await validate();
            })
          }
        />
      )}
      {history && (
        <HistoryModal
          history={history}
          current={view.currentRevision}
          readonly={readonly}
          onClose={() => setHistory(null)}
          onRestore={(payload) => {
            draft.change(payload);
            setHistory(null);
          }}
        />
      )}
      {source.diff && (
        <SourceDiffModal
          diff={source.diff}
          content={d}
          onKeep={() => source.setDiff(null)}
          onApply={() => applySource(source.diff!)}
        />
      )}
      {aiResult && (
        <AiResultModal
          job={aiResult}
          stale={aiResult.revision !== view.currentRevision}
          onClose={() => setAiResult(null)}
          onApply={() => {
            draft.change({
              ...project,
              content: {
                ...d,
                caption: aiResult.result?.caption || d.caption,
                altText: aiResult.result?.altText || d.altText,
              },
            });
            setAiResult(null);
          }}
        />
      )}
    </EditorContext.Provider>
  );
}
