import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCopy, KeyRound } from 'lucide-react';
import { api, message, send } from '../../lib/api';

type AgentToken = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

// External agents (Claude, Cursor…) draft copy through MCP. The plain token is shown once.
export default function AgentTokens() {
  const client = useQueryClient();
  const tokens = useQuery({ queryKey: ['agent-tokens'], queryFn: () => api<AgentToken[]>('/agent-tokens') });
  const [name, setName] = useState('');
  const [panelAi, setPanelAi] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState('');
  const mcpUrl = `${window.location.origin}/api/studio/v1/mcp`;
  const config = JSON.stringify(
    {
      mcpServers: {
        'bekapaka-studio': { type: 'http', url: mcpUrl, headers: { Authorization: `Bearer ${created || '<token>'}` } },
      },
    },
    null,
    2,
  );
  const reload = () => client.invalidateQueries({ queryKey: ['agent-tokens'] });

  return (
    <section className="settings-card">
      <h2>
        <KeyRound size={18} /> Agent (MCP)
      </h2>
      <p className="muted">
        Agent czyta schematy, fakty i zasady marki, tworzy robocze publikacje i proponuje teksty kanałów. Nie potwierdza
        faktów, nie zatwierdza i nie publikuje. Adres: <code>{mcpUrl}</code>
      </p>
      <p className="muted">
        Twój Claude Code (na Twojej subskrypcji) może też wykonywać zadania AI Studio: <code>list_ai_tasks</code> →{' '}
        <code>prepare_ai_task</code> → <code>submit_ai_task_result</code>. Studio sprawdza wynik tak samo jak własne
        generacje i zapisuje go jako szkic agenta.
      </p>
      <form
        className="token-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            const r = await send<{ token: string }>('/agent-tokens', {
              name,
              ...(panelAi ? { scopes: ['panel-ai'] } : {}),
            });
            setCreated(r.token);
            setName('');
            setPanelAi(false);
            await reload();
          } catch (err) {
            setError(message(err));
          }
        }}
      >
        <input
          required
          maxLength={80}
          placeholder="Nazwa, np. Claude na laptopie"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="primary">Utwórz token</button>
        <label className="token-scope">
          <input type="checkbox" checked={panelAi} onChange={(e) => setPanelAi(e.target.checked)} />
          <span>
            Także analizy panelu (<code>panel-ai</code>): mecze, plany zawodników, scouting, briefing, taktyka. Agent
            dostanie dane zawodników — zaznacz tylko dla własnego, zaufanego agenta.
          </span>
        </label>
      </form>
      {created && (
        <div className="token-once" role="status">
          <b>Skopiuj token teraz — nie pokażemy go ponownie.</b>
          <code>{created}</code>
          <pre>{config}</pre>
          <button className="text-button" onClick={() => void navigator.clipboard?.writeText(config)}>
            <ClipboardCopy size={14} /> Kopiuj konfigurację MCP
          </button>
        </div>
      )}
      <ul className="token-list">
        {(tokens.data || []).map((t) => (
          <li key={t.id} className={t.revokedAt ? 'is-revoked' : ''}>
            <span>
              <b>{t.name}</b>
              <small>
                {t.prefix}… · {t.scopes.includes('panel-ai') ? 'Studio + panel · ' : ''}utworzony{' '}
                {new Date(t.createdAt).toLocaleDateString('pl-PL')} ·{' '}
                {t.revokedAt
                  ? 'odwołany'
                  : t.lastUsedAt
                    ? `użyty ${new Date(t.lastUsedAt).toLocaleString('pl-PL')}`
                    : 'jeszcze nieużyty'}
              </small>
            </span>
            {!t.revokedAt && (
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await send(`/agent-tokens/${t.id}/revoke`, {});
                    await reload();
                  } catch (err) {
                    setError(message(err));
                  }
                }}
              >
                Odwołaj
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
