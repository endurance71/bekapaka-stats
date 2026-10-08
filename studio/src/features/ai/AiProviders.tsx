import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, CheckCircle2, CircleAlert, KeyRound, Trash2 } from 'lucide-react';
import { api, message, send } from '../../lib/api';
import { keys, useAiOverview } from '../../lib/queries';
import type { AiKey, AiOverview, AiProviderId, CustomModel } from '../../lib/types';
import ModelSelect from './ModelSelect';
import { price, providerLabel, usd } from './format';
import './ai.css';

// Keys are write-only from the browser: the API returns the provider, the last 4 characters and test results.
export default function AiProviders() {
  const client = useQueryClient();
  const overview = useAiOverview();
  const [status, setStatus] = useState('');
  const update = (next: AiOverview) => {
    client.setQueryData(keys.aiOverview, next);
    void client.invalidateQueries({ queryKey: keys.budget });
  };
  async function run(action: () => Promise<AiOverview>, done = '') {
    setStatus('');
    try {
      update(await action());
      if (done) setStatus(done);
      return true;
    } catch (err) {
      setStatus(message(err));
      return false;
    }
  }
  const data = overview.data;
  if (!data)
    return (
      <section className="settings-card">{overview.error ? message(overview.error) : 'Wczytuję klucze API…'}</section>
    );

  return (
    <section className="settings-card ai-settings">
      <h2>
        <Bot size={18} /> Klucze API i modele
      </h2>
      <p className="muted">
        Studio korzysta z Google Gemini, Anthropic Claude i OpenAI. Każde wywołanie rezerwuje najgorszy możliwy koszt z
        miesięcznego budżetu; klucze są szyfrowane na serwerze i nigdy nie wracają do przeglądarki.
      </p>
      {!data.secretsConfigured && (
        <p className="ai-warning">
          <CircleAlert size={16} /> Serwer nie ma klucza szyfrowania <code>STUDIO_SECRETS_KEY</code> — zapis kluczy w
          Studio jest wyłączony. Klucze z pliku <code>.env</code> serwera działają dalej.
        </p>
      )}
      <div className="ai-keys">
        {data.keys.map((k) => (
          <ProviderKey
            key={k.provider}
            k={k}
            disabled={!data.secretsConfigured}
            onChange={update}
            onStatus={setStatus}
          />
        ))}
      </div>

      <h3>Model dla zadania</h3>
      <div className="ai-tasks">
        {data.tasks.map((t) => (
          <label key={t.id} className="ai-task">
            <span>
              <b>{t.label}</b>
              <small>
                maks. {usd(t.maxCallMicros)} za wywołanie
                {!t.available && ' · brak klucza tego dostawcy'}
              </small>
            </span>
            <ModelSelect
              models={data.models}
              task={t.id}
              kind={t.kind}
              value={t.model}
              label={`Model: ${t.label}`}
              onChange={(model) =>
                void run(() => send<AiOverview>('/ai/tasks', { task: t.id, model }, 'PUT'), 'Zapisano model zadania.')
              }
            />
          </label>
        ))}
      </div>
      <p className="muted small">
        Przy generowaniu możesz jednorazowo wybrać inny model. Tła AI tworzą tylko modele obrazowe Gemini.
      </p>

      <CustomModels
        models={data.customModels}
        onAdd={(m) => run(() => send<AiOverview>('/ai/custom-models', m), 'Dodano model.')}
        onRemove={(id) =>
          run(() => api<AiOverview>(`/ai/custom-models/${encodeURIComponent(id)}`, { method: 'DELETE' }))
        }
      />
      {status && (
        <p role="status" className="muted">
          {status}
        </p>
      )}
    </section>
  );
}

function ProviderKey({
  k,
  disabled,
  onChange,
  onStatus,
}: {
  k: AiKey;
  disabled: boolean;
  onChange: (o: AiOverview) => void;
  onStatus: (s: string) => void;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    onStatus('');
    try {
      await fn();
    } catch (err) {
      onStatus(message(err));
    } finally {
      setBusy(false);
    }
  }
  const test = () =>
    act(async () => {
      const r = await send<{ ok: boolean; error: string | null; overview: AiOverview }>(
        `/ai/keys/${k.provider}/test`,
        {},
      );
      onChange(r.overview);
      onStatus(r.ok ? `${k.label}: klucz działa.` : `${k.label}: ${r.error}`);
    });
  return (
    <div className="ai-key">
      <div className="ai-key-head">
        <b>
          <KeyRound size={15} /> {k.label}
        </b>
        <KeyState k={k} />
      </div>
      <small className="muted">{k.hint}</small>
      <form
        className="token-form"
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            const saved = await send<AiOverview>(`/ai/keys/${k.provider}`, { apiKey: value.trim() }, 'PUT');
            setValue('');
            onChange(saved);
            await test();
          });
        }}
      >
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          minLength={20}
          maxLength={400}
          disabled={disabled || busy}
          aria-label={`Klucz API ${k.label}`}
          placeholder={k.source === 'studio' ? 'Wklej nowy klucz, aby zastąpić' : 'Wklej klucz API'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="primary" disabled={disabled || busy || !value.trim()}>
          Zapisz i sprawdź
        </button>
      </form>
      {k.source && (
        <div className="ai-key-actions">
          <button className="text-button" disabled={busy} onClick={() => void test()}>
            Sprawdź połączenie
          </button>
          {k.source === 'studio' && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  onChange(await api<AiOverview>(`/ai/keys/${k.provider}`, { method: 'DELETE' }));
                  onStatus(`${k.label}: klucz usunięty ze Studio.`);
                })
              }
            >
              <Trash2 size={14} /> Usuń klucz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function KeyState({ k }: { k: AiKey }) {
  if (!k.source) return <span className="ai-chip is-off">Brak klucza</span>;
  const where = k.source === 'studio' ? `Studio ····${k.last4}` : 'serwer (.env)';
  if (k.lastTestOk === false)
    return (
      <span className="ai-chip is-bad" title={k.lastError || ''}>
        <CircleAlert size={13} /> {where} · błąd
      </span>
    );
  return (
    <span className={`ai-chip ${k.lastTestOk ? 'is-ok' : ''}`}>
      {k.lastTestOk && <CheckCircle2 size={13} />} {where}
      {k.lastTestedAt ? ` · sprawdzony ${new Date(k.lastTestedAt).toLocaleDateString('pl-PL')}` : ''}
    </span>
  );
}

const emptyModel = { id: '', provider: 'anthropic' as AiProviderId, label: '', input: '', output: '' };

function CustomModels({
  models,
  onAdd,
  onRemove,
}: {
  models: CustomModel[];
  onAdd: (m: CustomModel) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(emptyModel);
  return (
    <details className="ai-custom" open={models.length > 0}>
      <summary>Własne modele tekstowe ({models.length})</summary>
      <p className="muted small">
        Nowy model dostawcy, którego nie ma jeszcze na liście. Ceny wpisujesz z cennika dostawcy (USD za 1M tokenów) —
        budżet liczy rezerwację z tych cen.
      </p>
      <ul className="token-list">
        {models.map((m) => (
          <li key={m.id}>
            <span>
              <b>{m.label}</b>
              <small>
                {providerLabel[m.provider]} · <code>{m.id}</code> · {price(m.input)} / {price(m.output)} za 1M
              </small>
            </span>
            <button className="text-button" onClick={() => void onRemove(m.id)}>
              Usuń
            </button>
          </li>
        ))}
      </ul>
      <form
        className="ai-custom-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await onAdd({ ...draft, input: Number(draft.input), output: Number(draft.output) })) setDraft(emptyModel);
        }}
      >
        <select
          aria-label="Dostawca"
          value={draft.provider}
          onChange={(e) => setDraft({ ...draft, provider: e.target.value as AiProviderId })}
        >
          {(Object.keys(providerLabel) as AiProviderId[]).map((p) => (
            <option key={p} value={p}>
              {providerLabel[p]}
            </option>
          ))}
        </select>
        <input
          required
          aria-label="Identyfikator modelu w API"
          placeholder="Identyfikator w API, np. claude-…"
          pattern="[A-Za-z0-9][A-Za-z0-9._:\-]{1,79}"
          value={draft.id}
          onChange={(e) => setDraft({ ...draft, id: e.target.value })}
        />
        <input
          required
          aria-label="Nazwa"
          placeholder="Nazwa"
          maxLength={60}
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
        <input
          required
          aria-label="Cena wejścia (USD za 1M)"
          placeholder="Wejście $/1M"
          type="number"
          min="0.01"
          max="200"
          step="0.01"
          value={draft.input}
          onChange={(e) => setDraft({ ...draft, input: e.target.value })}
        />
        <input
          required
          aria-label="Cena wyjścia (USD za 1M)"
          placeholder="Wyjście $/1M"
          type="number"
          min="0.01"
          max="500"
          step="0.01"
          value={draft.output}
          onChange={(e) => setDraft({ ...draft, output: e.target.value })}
        />
        <button className="secondary">Dodaj model</button>
      </form>
    </details>
  );
}
