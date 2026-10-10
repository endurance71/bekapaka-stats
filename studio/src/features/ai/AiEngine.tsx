import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert, ImageIcon, PlugZap, Sparkles } from 'lucide-react';
import { message, send } from '../../lib/api';
import { keys, useAiEngine } from '../../lib/queries';
import type { AiEngine as Engine, AiEngineId, AiEngineTest, AiSdkState } from '../../lib/types';
import './ai.css';

const SDK_STATUS: Record<AiSdkState, { label: string; ok: boolean }> = {
  ready: { label: 'Gotowy', ok: true },
  untested: { label: 'Skonfigurowany — wykonaj test', ok: false },
  not_configured: { label: 'Brak konfiguracji', ok: false },
  auth_required: { label: 'Wymagane uwierzytelnienie', ok: false },
  unavailable: { label: 'Niedostępny', ok: false },
  connection_error: { label: 'Błąd połączenia', ok: false },
  limit_reached: { label: 'Limit wykorzystany', ok: false },
};
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '';

// One global choice shared with the panel: which engine writes texts. Images never depend on it.
export default function AiEngine() {
  const client = useQueryClient();
  const engine = useAiEngine();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [test, setTest] = useState<AiEngineTest | null>(null);
  const update = (next: Engine) => {
    client.setQueryData(keys.aiEngine, next);
    // Task models, availability and worst-case costs depend on the engine.
    void client.invalidateQueries({ queryKey: keys.aiOverview });
    void client.invalidateQueries({ queryKey: keys.budget });
  };
  const data = engine.data;
  if (!data)
    return <section className="settings-card">{engine.error ? message(engine.error) : 'Wczytuję silnik AI…'}</section>;

  async function save(patch: Partial<Pick<Engine, 'engine' | 'agentSdkModel'>>) {
    if (!data) return;
    setBusy(true);
    setStatus('');
    setTest(null);
    try {
      update(
        await send<Engine>(
          '/ai/engine',
          {
            engine: patch.engine ?? data.engine,
            agentSdkModel: patch.agentSdkModel ?? data.agentSdkModel,
            fallbackToApi: data.fallbackToApi,
          },
          'PUT',
        ),
      );
      setStatus('Zapisano. Nowe generacje użyją tego silnika; rozpoczęte kończą się na dotychczasowym.');
    } catch (err) {
      setStatus(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function runTest() {
    setBusy(true);
    setStatus('');
    try {
      const result = await send<AiEngineTest>('/ai/engine/test', {});
      setTest(result);
      if (result.status && typeof result.status === 'object') update(result.status);
    } catch (err) {
      setTest({ ok: false, engine: data?.engine ?? 'api', error: message(err) });
    } finally {
      setBusy(false);
    }
  }

  const sdk = SDK_STATUS[data.sdk.status] ?? SDK_STATUS.connection_error;
  const isSdk = data.engine === 'claude-agent-sdk';
  const studioOps = data.operations.filter((o) => o.surface === 'studio');

  return (
    <section className="settings-card ai-settings">
      <h2>
        <Sparkles size={18} /> Dostawca AI
      </h2>
      <p className="muted">
        Silnik tekstów AI — wspólny dla Studio i panelu. API to dotychczasowe modele z „Klucze API i modele”; Claude
        Agent SDK działa na kluczu API z Claude Console (kredyty organizacji, np. dołączone do planu Max), nie na
        limitach subskrypcji claude.ai.
      </p>
      <div className="ai-engine-grid">
        <label className="field-block">
          <span className="field-label">Silnik generowania treści</span>
          <select
            value={data.engine}
            disabled={busy}
            onChange={(e) => void save({ engine: e.target.value as AiEngineId })}
          >
            <option value="api">API — dotychczasowi dostawcy</option>
            <option value="claude-agent-sdk">Claude Agent SDK</option>
          </select>
        </label>
        <label className="field-block">
          <span className="field-label">Model Claude (Agent SDK)</span>
          <select
            value={data.agentSdkModel}
            disabled={busy}
            onChange={(e) => void save({ agentSdkModel: e.target.value })}
          >
            {data.sdkModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ai-engine-state">
        <p>
          <span className="field-label">Aktywny</span>
          <b>
            {isSdk ? 'Claude Agent SDK' : data.api?.label || 'API'} · {data.activeModel || '—'}
          </b>
          <small className="muted">{isSdk ? data.sdk.billing : data.api?.billing}</small>
        </p>
        <p>
          <span className="field-label">Claude Agent SDK</span>
          <span className={`ai-chip ${sdk.ok ? 'is-ok' : 'is-bad'}`}>
            {sdk.ok ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />} {sdk.label}
          </span>
          {data.sdk.detail && <small className="muted">{data.sdk.detail}</small>}
        </p>
      </div>

      <div className="ai-key-actions">
        <button type="button" className="secondary" disabled={busy} onClick={() => void runTest()}>
          <PlugZap size={15} /> Testuj połączenie
        </button>
        {data.updatedAt && (
          <small className="muted">
            Zmienione {when(data.updatedAt)}
            {data.updatedByName ? ` · ${data.updatedByName}` : ''}
            {data.updatedFrom ? ` · ${data.updatedFrom === 'panel' ? 'panel' : 'Studio'}` : ''}
          </small>
        )}
      </div>

      {test && (
        <div role="status" className={test.ok ? 'ai-engine-test is-ok' : 'ai-engine-test is-bad'}>
          <b>
            {test.ok ? 'Połączenie działa' : 'Test nie powiódł się'} ·{' '}
            {test.engine === 'claude-agent-sdk' ? 'Claude Agent SDK' : 'API'}
          </b>
          {test.model && <span>Model: {test.model}</span>}
          {test.billing && <span>Rozliczenie: {test.billing}</span>}
          {test.apiKeySource && <span>Uwierzytelnienie: {test.apiKeySource}</span>}
          {typeof test.durationMs === 'number' && (
            <span>
              Czas: {(test.durationMs / 1000).toFixed(1)} s
              {typeof test.costUsd === 'number' ? ` · szacunkowy koszt ${test.costUsd.toFixed(4)} USD` : ''}
            </span>
          )}
          {test.detail && <span>{test.detail}</span>}
          {test.error && <span>{test.error}</span>}
        </div>
      )}

      <h3>Co obsługuje wybrany silnik</h3>
      <ul className="ai-engine-ops">
        {studioOps.map((o) => (
          <li key={o.id}>
            {o.label} — <b>{o.routing === 'engine' ? (isSdk ? 'Claude Agent SDK' : 'API') : 'zawsze API'}</b>
          </li>
        ))}
        <li className="muted">Analizy panelu (mecze, zawodnicy, scouting, briefing, taktyka) — ten sam silnik.</li>
      </ul>
      <p className="ai-warning">
        <ImageIcon size={16} /> {data.imageNotice}
      </p>
      {status && (
        <p role="status" className="muted">
          {status}
        </p>
      )}
    </section>
  );
}
