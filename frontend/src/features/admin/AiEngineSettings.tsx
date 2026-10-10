import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, ImageIcon, PlugZap } from 'lucide-react';
import { fetchJSON, postJSON, putJSON } from '../../lib/api';
import BkpkButton from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';

/** Stan silnika tekstowego AI — ten sam w panelu i w Studio (jedno globalne ustawienie na backendzie). */
type Engine = 'api' | 'claude-agent-sdk';
type SdkState = 'ready' | 'untested' | 'not_configured' | 'auth_required' | 'unavailable' | 'connection_error' | 'limit_reached';

interface CallView {
  at: string;
  ok: boolean;
  operation: string;
  model: string | null;
  durationMs: number;
  errorCode: string | null;
  error: string | null;
}

export interface AiEngineStatus {
  engine: Engine;
  agentSdkModel: string;
  fallbackToApi: boolean;
  updatedAt: string | null;
  updatedFrom: 'panel' | 'studio' | null;
  updatedByName: string | null;
  activeModel: string | null;
  sdk: { status: SdkState; detail?: string | null; keyConfigured: boolean; lastCall?: CallView | null; lastTest?: CallView | null; billing: string };
  api: { label: string; model: string; configured?: boolean; billing: string } | null;
  sdkModels: { id: string; label: string; default: boolean }[];
  operations: { id: string; surface: 'panel' | 'studio'; label: string; routing: 'engine' | 'api-only' }[];
  imageNotice: string;
}

interface TestResult {
  ok: boolean;
  engine: Engine;
  model?: string;
  apiKeySource?: string;
  billing?: string;
  durationMs?: number;
  costUsd?: number;
  error?: string | null;
  detail?: string | null;
  status?: AiEngineStatus | string;
}

const SDK_STATUS: Record<SdkState, { label: string; tone: 'ok' | 'warn' | 'bad' }> = {
  ready: { label: 'Gotowy', tone: 'ok' },
  untested: { label: 'Skonfigurowany — wykonaj test', tone: 'warn' },
  not_configured: { label: 'Brak konfiguracji', tone: 'bad' },
  auth_required: { label: 'Wymagane uwierzytelnienie', tone: 'bad' },
  unavailable: { label: 'Niedostępny', tone: 'bad' },
  connection_error: { label: 'Błąd połączenia', tone: 'bad' },
  limit_reached: { label: 'Limit wykorzystany', tone: 'bad' },
};

const fieldClass =
  'w-full bg-bkpk-bg border border-bkpk-border-strong min-h-[48px] px-4 text-sm text-bkpk-text-primary hover:border-bkpk-text-muted focus:border-bkpk-text-primary transition-colors';
const fieldLabelClass = 'block label-caps text-xs text-bkpk-text-secondary mb-2';
const checkboxRowClass =
  'flex items-start gap-3 min-h-[48px] p-3 bg-bkpk-bg border border-bkpk-border-strong hover:border-bkpk-text-muted cursor-pointer transition-colors';

const toneClass = { ok: 'text-bkpk-success', warn: 'text-bkpk-warning', bad: 'text-bkpk-danger' };
const fromLabel = { panel: 'panel', studio: 'Studio' };
const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '');

export default function AiEngineSettings() {
  const [status, setStatus] = useState<AiEngineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await fetchJSON<AiEngineStatus>('/api/ai/engine');
      if (!next?.engine) throw new Error('Serwer nie zwrócił ustawień AI');
      setStatus(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wczytać ustawień AI');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Partial<Pick<AiEngineStatus, 'engine' | 'agentSdkModel' | 'fallbackToApi'>>) => {
    if (!status) return;
    setSaving(true);
    setTest(null);
    try {
      setStatus(
        await putJSON<AiEngineStatus>('/api/ai/engine', {
          engine: patch.engine ?? status.engine,
          agentSdkModel: patch.agentSdkModel ?? status.agentSdkModel,
          fallbackToApi: patch.fallbackToApi ?? status.fallbackToApi,
        })
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać ustawienia');
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      const result = await postJSON<TestResult>('/api/ai/engine/test', {});
      setTest(result);
      if (result.status && typeof result.status === 'object') setStatus(result.status);
    } catch (err) {
      setTest({ ok: false, engine: status?.engine ?? 'api', error: err instanceof Error ? err.message : 'Test nie powiódł się' });
    } finally {
      setTesting(false);
    }
  };

  if (!status) {
    return <p className="text-sm text-bkpk-text-secondary">{error || 'Wczytywanie ustawień AI…'}</p>;
  }

  const sdk = SDK_STATUS[status.sdk.status] ?? SDK_STATUS.connection_error;
  const isSdk = status.engine === 'claude-agent-sdk';
  const engineOps = status.operations.filter((o) => o.routing === 'engine');
  const apiOnly = status.operations.filter((o) => o.routing === 'api-only');

  return (
    <div className="space-y-6">
      <p className="text-bkpk-text-secondary text-sm">
        Wybór silnika dla tekstów AI w panelu i w Studio (jedno wspólne ustawienie). Domyślnie: dotychczasowe API.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabelClass}>Silnik generowania treści</span>
          <select className={fieldClass} value={status.engine} disabled={saving} onChange={(e) => void save({ engine: e.target.value as Engine })}>
            <option value="api">API — dotychczasowi dostawcy</option>
            <option value="claude-agent-sdk">Claude Agent SDK</option>
          </select>
        </label>
        <label className="block">
          <span className={fieldLabelClass}>Model Claude (Agent SDK)</span>
          <select className={fieldClass} value={status.agentSdkModel} disabled={saving} onChange={(e) => void save({ agentSdkModel: e.target.value })}>
            {status.sdkModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="p-3 border border-bkpk-border-subtle bg-bkpk-bg">
          <dt className="label-caps text-xs text-bkpk-text-muted mb-1">Aktywny silnik i model</dt>
          <dd className="text-bkpk-text-primary font-semibold">
            {isSdk ? 'Claude Agent SDK' : status.api?.label || 'API'} · {status.activeModel || '—'}
          </dd>
          <dd className="text-xs text-bkpk-text-secondary mt-1">{isSdk ? status.sdk.billing : status.api?.billing}</dd>
        </div>
        <div className="p-3 border border-bkpk-border-subtle bg-bkpk-bg">
          <dt className="label-caps text-xs text-bkpk-text-muted mb-1">Status Claude Agent SDK</dt>
          <dd className={cn('font-semibold flex items-center gap-2', toneClass[sdk.tone])}>
            {sdk.tone === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <CircleAlert className="w-4 h-4" />}
            {sdk.label}
          </dd>
          {status.sdk.detail && <dd className="text-xs text-bkpk-text-secondary mt-1">{status.sdk.detail}</dd>}
          {status.sdk.lastCall && (
            <dd className="text-xs text-bkpk-text-muted mt-1">
              Ostatnie żądanie: {dateTime(status.sdk.lastCall.at)} · {status.sdk.lastCall.model || '—'} · {status.sdk.lastCall.ok ? 'OK' : 'błąd'}
            </dd>
          )}
        </div>
      </dl>

      <label className={checkboxRowClass}>
        <input
          type="checkbox"
          className="w-5 h-5 shrink-0 accent-bkpk-primary mt-0.5"
          checked={status.fallbackToApi}
          disabled={saving}
          onChange={(e) => void save({ fallbackToApi: e.target.checked })}
        />
        <span className="text-sm">
          <span className="font-semibold text-bkpk-text-primary">Awaryjnie użyj płatnego API, gdy SDK nie odpowie</span>
          <span className="block text-bkpk-text-secondary text-xs mt-1">
            Domyślnie wyłączone. Działa tylko w panelu i tylko wtedy, gdy SDK niczego nie wygenerowało (brak klucza, brak kredytów, niedostępny).
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <BkpkButton variant="ghost" size="sm" loading={testing} onClick={() => void runTest()}>
          <PlugZap className="w-4 h-4" />
          Testuj połączenie
        </BkpkButton>
        {status.updatedAt && (
          <span className="text-xs text-bkpk-text-muted">
            Zmienione {dateTime(status.updatedAt)}
            {status.updatedByName ? ` · ${status.updatedByName}` : ''}
            {status.updatedFrom ? ` · ${fromLabel[status.updatedFrom]}` : ''}
          </span>
        )}
      </div>

      {test && (
        <div className={cn('p-3 border text-sm space-y-1', test.ok ? 'border-bkpk-success' : 'border-bkpk-danger/30 bg-bkpk-danger/10')} role="status">
          <p className={cn('font-semibold', test.ok ? 'text-bkpk-success' : 'text-bkpk-danger')}>
            {test.ok ? 'Połączenie działa' : 'Test nie powiódł się'} · {test.engine === 'claude-agent-sdk' ? 'Claude Agent SDK' : 'API'}
          </p>
          {test.model && <p className="text-bkpk-text-secondary">Model: {test.model}</p>}
          {test.billing && <p className="text-bkpk-text-secondary">Rozliczenie: {test.billing}</p>}
          {test.apiKeySource && <p className="text-bkpk-text-secondary">Uwierzytelnienie: {test.apiKeySource}</p>}
          {typeof test.durationMs === 'number' && (
            <p className="text-bkpk-text-secondary">
              Czas odpowiedzi: {(test.durationMs / 1000).toFixed(1)} s{typeof test.costUsd === 'number' ? ` · szacunkowy koszt ${test.costUsd.toFixed(4)} USD` : ''}
            </p>
          )}
          {test.detail && <p className="text-bkpk-text-secondary">{test.detail}</p>}
          {test.error && <p className="text-bkpk-danger">{test.error}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className={fieldLabelClass}>Przez wybrany silnik</p>
          <ul className="space-y-1 text-bkpk-text-secondary">
            {engineOps.map((o) => (
              <li key={o.id}>
                {o.label} <span className="text-bkpk-text-muted">· {o.surface === 'panel' ? 'panel' : 'Studio'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={fieldLabelClass}>Zawsze przez API</p>
          <ul className="space-y-1 text-bkpk-text-secondary">
            {apiOnly.map((o) => (
              <li key={o.id}>{o.label}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="flex items-start gap-2 text-sm text-bkpk-text-primary p-3 border border-bkpk-border-strong">
        <ImageIcon className="w-4 h-4 mt-0.5 shrink-0" />
        {status.imageNotice}
      </p>

      {error && <p className="text-sm text-bkpk-danger">{error}</p>}
    </div>
  );
}
