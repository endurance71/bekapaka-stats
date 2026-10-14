import { act, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';

const api = vi.hoisted(() => ({ postJSON: vi.fn(async () => null) }));
vi.mock('../lib/api', () => api);

const { pageViewPath, usePageViewTracking } = await import('./usePageViewTracking');

let navigate: ReturnType<typeof useNavigate>;
function Probe() {
  usePageViewTracking();
  navigate = useNavigate();
  return null;
}

describe('usePageViewTracking', () => {
  it('keeps only the tab parameter', () => {
    expect(pageViewPath('/druzyna', '?widok=zagrywki&x=1')).toBe('/druzyna?widok=zagrywki');
    expect(pageViewPath('/rywal', '?opponent=Kosz')).toBe('/rywal');
  });

  it('sends one view per page or tab change', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Probe />
      </MemoryRouter>
    );
    expect(api.postJSON).toHaveBeenLastCalledWith('/api/activity/view', { path: '/dashboard' });
    await act(async () => navigate('/rywal?opponent=A'));
    await act(async () => navigate('/rywal?opponent=B'));
    await act(async () => navigate('/druzyna?widok=zagrywki'));
    expect(api.postJSON).toHaveBeenLastCalledWith('/api/activity/view', { path: '/druzyna?widok=zagrywki' });
    expect(api.postJSON).toHaveBeenCalledTimes(3);
  });
});
