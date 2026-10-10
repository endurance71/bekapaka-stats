import { useState } from 'react';
import { ArrowRight, Check, Download, Eye, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { send } from '../../lib/api';
import { DESIGN_VERSION, designFormats, formatSpec } from '../../lib/contracts';
import { useBudget, useReloadLibrary } from '../../lib/queries';
import ModelSelect from '../ai/ModelSelect';
import { usd } from '../ai/format';
import type { Job, Report } from '../../lib/types';
import ExportFile from '../exports/ExportFile';
import { useEditor } from './editor-context';

type Props = {
  projectId: string;
  format: string;
  setFormat: (format: string) => void;
  preview: Job | null;
  current: boolean;
  unseen: string[];
  report: Report | null;
  validate: () => Promise<Report>;
  onConfirm: () => void;
  job: Job | null;
  setJob: (job: Job) => void;
  onArchive: () => Promise<void>;
};

const briefs = [
  ['texture', 'Faktura papieru / farby'],
  ['background', 'Pusty parkiet'],
  ['still-life', 'Piłka na parkiecie'],
];

export default function ExportPanel(props: Props) {
  const {
    projectId,
    format,
    setFormat,
    preview,
    current,
    unseen,
    report,
    validate,
    onConfirm,
    job,
    setJob,
    onArchive,
  } = props;
  const { project, busy, readonly, change, action, publication, template, setError } = useEditor();
  const budget = useBudget();
  const reload = useReloadLibrary();
  const [brief, setBrief] = useState('texture');
  const [textModel, setTextModel] = useState('');
  const [imageModel, setImageModel] = useState('');
  const currentDesign = !!publication && project.designVersion === DESIGN_VERSION;
  const available: string[] = currentDesign ? designFormats(publication, project.visualStyle) : template?.formats || [];
  const designApproved = (f: string) =>
    project.designVersion === DESIGN_VERSION &&
    !!publication?.designs?.some(
      (d) =>
        d.style === project.visualStyle &&
        d.format === f &&
        d.kit === project.content.kit &&
        d.backgroundAssetId === (project.content.backgroundAssetId || null) &&
        d.status === 'approved',
    );
  const templateStatus = project.postType && project.formats.every(designApproved) ? 'approved' : 'draft';
  const b = budget.data;
  // Empty choice = the task's model from Settings; a model is ready when its provider has a key.
  const pick = (id: 'text' | 'image', override: string) => {
    const task = b?.tasks.find((t) => t.id === id);
    const model = b?.models.find((m) => m.id === (override || task?.model));
    return {
      task,
      model,
      ready: !!(override ? model?.available : task?.available),
      maxCall: override ? model?.maxCallMicros?.[id] : task?.maxCallMicros,
    };
  };
  const text = pick('text', textModel);
  const image = pick('image', imageModel);
  const ai = (kind: 'ai-text' | 'ai-image') => {
    const model = kind === 'ai-image' ? imageModel : textModel;
    void action(async () =>
      setJob(
        await send<Job>(`/projects/${projectId}/jobs`, {
          kind,
          ...(kind === 'ai-image' ? { brief } : {}),
          ...(model ? { model } : {}),
        }),
      ),
    );
  };

  return (
    <aside className="export-panel">
      <div className="panel-heading">
        <span className="eyebrow">FORMATY I KONTROLA</span>
        <h2>Gotowe do publikacji.</h2>
      </div>
      <div className="format-list">
        {available.map((f) => {
          const spec = formatSpec(f);
          return (
            <div key={f} className={format === f ? 'format-item selected' : 'format-item'}>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={project.formats.includes(f)}
                  disabled={readonly || (project.formats.length === 1 && project.formats.includes(f))}
                  onChange={(e) =>
                    change({
                      ...project,
                      formats: e.target.checked ? [...project.formats, f] : project.formats.filter((x) => x !== f),
                    })
                  }
                />
                <span>
                  <b>{spec.label}</b>
                  <small>
                    {spec.width} × {spec.height}
                  </small>
                </span>
              </label>
              <button
                className="icon-button"
                aria-label={`Podgląd ${spec.label}`}
                disabled={!project.formats.includes(f)}
                onClick={() => setFormat(f)}
              >
                <Eye size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="control-card">
        <ShieldCheck size={23} />
        <h3>Zgodność przed eksportem</h3>
        <p>Układ, materiały i potwierdzone dane konkretnej rewizji.</p>
        <span className={`status status-${templateStatus}`}>
          {templateStatus === 'approved' ? 'Szablon zatwierdzony' : 'Szablon do oceny'}
        </span>
        {currentDesign && (
          <>
            <p className="design-format-status">
              {project.formats
                .map((f) => `${formatSpec(f).label}: ${designApproved(f) ? 'zatwierdzony' : 'do oceny'}`)
                .join(' · ')}
            </p>
            {!designApproved(format) && (
              <button
                className="secondary"
                disabled={busy || readonly || !current}
                onClick={() =>
                  void action(async () => {
                    await send(`/designs/${project.postType}/${project.visualStyle}/${format}/approve`, {
                      confirmed: true,
                      previewJobId: preview!.id,
                    });
                    await reload();
                  })
                }
              >
                Zatwierdzam tę kompozycję · {formatSpec(format).label}
              </button>
            )}
          </>
        )}
        <button className="secondary" disabled={busy || readonly || !current || unseen.length > 0} onClick={onConfirm}>
          Potwierdź dane i wygląd
        </button>
        {!readonly && unseen.length > 0 && (
          <p className="muted small">
            Obejrzyj aktualny podgląd: {unseen.map((f) => formatSpec(f).label).join(', ')}.{' '}
            <button className="text-button" onClick={() => setFormat(unseen[0])}>
              Pokaż
            </button>
          </p>
        )}
        <button
          className="text-button"
          disabled={busy}
          onClick={() => void action(async () => void (await validate()))}
        >
          Sprawdź eksport <ArrowRight size={13} />
        </button>
        {report && (
          <div className="validation-list" role="status">
            {report.valid ? (
              <p className="valid">
                <Check size={16} />
                Gotowe do eksportu
              </p>
            ) : (
              report.errors.map((e, i) => (
                <p key={i}>
                  <b>{e.field}</b>
                  {e.message}
                </p>
              ))
            )}
          </div>
        )}
      </div>
      <button
        className="primary export-button"
        disabled={busy || readonly || !current}
        onClick={() =>
          void action(async () => {
            const v = await validate();
            if (v.valid)
              setJob(
                await send<Job>(`/projects/${projectId}/jobs`, { kind: 'export', idempotencyKey: crypto.randomUUID() }),
              );
          })
        }
      >
        <Download size={18} />
        Generuj paczkę ZIP
      </button>
      <p className="export-hint">
        PNG sRGB, opisy, oznaczenie AI i manifest.
        <br />
        Wszystkie wybrane formaty.
      </p>
      {job && (
        <div className="job-result" role="status">
          <b>{job.kind === 'export' ? 'Paczka publikacji' : 'Propozycja AI'}</b>
          {['queued', 'running'].includes(job.status) && (
            <p>
              <LoaderCircle size={15} className="spin" />{' '}
              {job.status === 'queued' ? 'Czeka w kolejce…' : 'Trwa przygotowanie…'}
            </p>
          )}
          {['failed', 'uncertain'].includes(job.status) && <p className="form-error">{job.error}</p>}
          {job.status === 'completed' &&
            job.kind === 'export' &&
            job.result?.files?.map((f) => (
              <ExportFile key={`${job.id}:${f.key}`} jobId={job.id} output={f} onError={setError} />
            ))}
          {job.result?.assetId && <p>Tło zapisane jako robocze. Otwórz Materiały, oceń obraz i zatwierdź.</p>}
        </div>
      )}
      <details className="ai-panel">
        <summary>
          <Sparkles size={16} />
          Pomoc AI
        </summary>
        <p className="muted small">AI proponuje treści i osobne tła. Zatwierdzasz je przed publikacją.</p>
        <div className="budget-bar">
          <span style={{ width: `${b ? Math.min(100, (b.usedMicros / Math.max(1, b.limitMicros)) * 100) : 0}%` }} />
        </div>
        <small>{b ? `${usd(b.remainingMicros, 2)} dostępne w tym miesiącu` : 'Budżet AI niedostępny'}</small>
        {b && !b.configured && (
          <p className="muted small">
            Brak kluczy API (Ustawienia → Klucze API i modele). Możesz tworzyć i eksportować materiały bez AI.
          </p>
        )}
        {b && text.task?.engine === 'claude-agent-sdk' && (
          <small>
            Opis: Claude Agent SDK · {b.models.find((m) => m.id === text.task!.model)?.label ?? text.task.model}
          </small>
        )}
        {b && text.task?.engine !== 'claude-agent-sdk' && (
          <ModelSelect
            models={b.models}
            task="text"
            kind="text"
            value={textModel}
            onChange={setTextModel}
            label="Model opisu"
            defaultLabel={`Opis: ${text.task ? (b.models.find((m) => m.id === text.task!.model)?.label ?? text.task.model) : '—'}`}
          />
        )}
        <button className="secondary" disabled={!text.ready || busy || readonly} onClick={() => ai('ai-text')}>
          Zaproponuj opis i alt
        </button>
        <select aria-label="Rodzaj tła AI" value={brief} onChange={(e) => setBrief(e.target.value)}>
          {briefs.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {b && (
          <ModelSelect
            models={b.models}
            task="image"
            kind="image"
            value={imageModel}
            onChange={setImageModel}
            label="Model tła"
            defaultLabel={`Tło: ${image.task ? (b.models.find((m) => m.id === image.task!.model)?.label ?? image.task.model) : '—'}`}
          />
        )}
        <button className="secondary" disabled={!image.ready || busy || readonly} onClick={() => ai('ai-image')}>
          Wygeneruj tło 2K
        </button>
        <small>
          Rezerwacja: opis ≤ {text.maxCall ? usd(text.maxCall) : '—'}, tło ≤ {image.maxCall ? usd(image.maxCall) : '—'}.
          Niepewne żądania zachowują rezerwację.
        </small>
      </details>
      {!readonly && (
        <button className="text-button archive-button" disabled={busy} onClick={() => void action(onArchive)}>
          Archiwizuj projekt
        </button>
      )}
    </aside>
  );
}
