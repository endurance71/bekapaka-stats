import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { PanelAnalyticsData } from './PanelAnalytics';

const data: PanelAnalyticsData = {
  range: { days: 7, from: '2026-10-08', to: '2026-10-14', timeZone: 'Europe/Warsaw' },
  trackingSince: '2026-10-08',
  excludeAdmins: false,
  summary: { accounts: 3, activeToday: 2, activeLast7: 2, activeInRange: 2, inactiveInRange: 1, avgActiveDays: 1.5, views: 7 },
  daily: ['08', '09', '10', '11', '12', '13', '14'].map((d) => ({ day: `2026-10-${d}`, activeUsers: d === '14' ? 2 : 0, requests: 0, views: 0 })),
  users: [
    { id: 'p1', name: 'Jan Kowalski', username: 'jan', role: 'USER', lastActivityAt: null, activeDays: 2, requests: 15, views: 4, activeDayList: ['2026-10-13', '2026-10-14'], topPages: [{ page: 'druzyna:zagrywki', views: 3 }] },
    { id: 'p2', name: 'Ola Nowak', username: 'ola', role: 'USER', lastActivityAt: null, activeDays: 0, requests: 0, views: 0, activeDayList: [], topPages: [] },
  ],
  pages: [{ page: 'druzyna:zagrywki', views: 3, users: 1 }],
  logins: { success: 1, failed: 2, failedByUser: [{ username: 'admin', count: 2, lastAt: '2026-10-12T03:00:00Z', knownAccount: false }] },
};

const api = vi.hoisted(() => ({ fetchJSON: vi.fn() }));
vi.mock('../../lib/api', () => api);

const { default: PanelAnalytics } = await import('./PanelAnalytics');

beforeAll(() => {
  // jsdom bez matchMedia / ResizeObserver — widok desktopowy, wykres bez pomiaru
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

describe('PanelAnalytics', () => {
  beforeEach(() => {
    api.fetchJSON.mockReset();
    api.fetchJSON.mockResolvedValue(data);
  });

  it('shows who uses the panel, which pages and failed logins', async () => {
    render(<PanelAnalytics />);
    expect(await screen.findAllByText('Jan Kowalski')).not.toHaveLength(0);
    expect(screen.getAllByText('Drużyna — zagrywki').length).toBeGreaterThan(0);
    expect(screen.getByText(/nie ma takiego konta/)).toBeInTheDocument();
    expect(screen.getByText('1 bez wejścia')).toBeInTheDocument();
    expect(api.fetchJSON).toHaveBeenCalledWith('/api/admin/analytics?days=30&excludeAdmins=false');
  });

  it('reloads for another range and without admins', async () => {
    render(<PanelAnalytics />);
    await screen.findAllByText('Jan Kowalski');
    fireEvent.click(screen.getByRole('button', { name: '90 dni' }));
    await waitFor(() => expect(api.fetchJSON).toHaveBeenLastCalledWith('/api/admin/analytics?days=90&excludeAdmins=false'));
    fireEvent.click(screen.getByLabelText('Pomiń administratorów'));
    await waitFor(() => expect(api.fetchJSON).toHaveBeenLastCalledWith('/api/admin/analytics?days=90&excludeAdmins=true'));
  });
});
