import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { AiEngineStatus } from './AiEngineSettings';

const base: AiEngineStatus = {
  engine: 'api',
  agentSdkModel: 'claude-sonnet-5-5',
  fallbackToApi: false,
  updatedAt: null,
  updatedFrom: null,
  updatedByName: null,
  activeModel: 'gemini-3.5-flash',
  sdk: { status: 'not_configured', detail: 'Brak klucza AGENT_SDK_ANTHROPIC_API_KEY', keyConfigured: false, billing: 'Klucz API z Claude Console' },
  api: { label: 'Gemini (klucz serwera)', model: 'gemini-3.5-flash', billing: 'Płatne API Google Gemini' },
  sdkModels: [
    { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', default: true },
    { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', default: false },
  ],
  operations: [
    { id: 'panel.match', surface: 'panel', label: 'Analiza meczu', routing: 'engine' },
    { id: 'studio.image', surface: 'studio', label: 'Tła AI (generowanie obrazów)', routing: 'api-only' },
  ],
  imageNotice: 'Generowanie i edycja obrazów nadal wykorzystują skonfigurowane API, niezależnie od wybranego silnika tekstowego.',
};

const api = vi.hoisted(() => ({ fetchJSON: vi.fn(), putJSON: vi.fn(), postJSON: vi.fn() }));
vi.mock('../../lib/api', () => api);

const { default: AiEngineSettings } = await import('./AiEngineSettings');

describe('AiEngineSettings', () => {
  beforeEach(() => {
    api.fetchJSON.mockResolvedValue(base);
    api.putJSON.mockImplementation(async (_path: string, body: Partial<AiEngineStatus>) => ({ ...base, ...body, activeModel: 'claude-sonnet-5-5', updatedFrom: 'panel', updatedAt: '2026-10-10T12:00:00Z' }));
    api.postJSON.mockResolvedValue({ ok: false, engine: 'claude-agent-sdk', error: 'Brak klucza', durationMs: 5 });
  });

  it('shows the real SDK status, the API-only image notice and the routing of operations', async () => {
    render(<AiEngineSettings />);
    expect(await screen.findByText('Brak konfiguracji')).toBeInTheDocument();
    expect(screen.getByText(/obrazów nadal wykorzystują skonfigurowane API/)).toBeInTheDocument();
    expect(screen.getByText(/Tła AI \(generowanie obrazów\)/)).toBeInTheDocument();
    expect(screen.getByText(/Gemini \(klucz serwera\) · gemini-3.5-flash/)).toBeInTheDocument();
  });

  it('saves the engine on the backend and shows the connection test result', async () => {
    render(<AiEngineSettings />);
    const select = await screen.findByLabelText('Silnik generowania treści');
    fireEvent.change(select, { target: { value: 'claude-agent-sdk' } });
    await waitFor(() => expect(api.putJSON).toHaveBeenCalledWith('/api/ai/engine', { engine: 'claude-agent-sdk', agentSdkModel: 'claude-sonnet-5-5', fallbackToApi: false }));
    fireEvent.click(screen.getByRole('button', { name: /Testuj połączenie/ }));
    expect(await screen.findByText(/Test nie powiódł się/)).toBeInTheDocument();
    expect(screen.getByText('Brak klucza')).toBeInTheDocument();
  });
});
