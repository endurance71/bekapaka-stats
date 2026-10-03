export const API = '/api/studio/v1';
export class ApiError extends Error { constructor(public status: number, message: string, public details?: { field: string; message: string }[]) { super(message); } }
export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const multipart = options.body instanceof FormData;
  const response = await fetch(API + path, { ...options, credentials: 'same-origin', headers: { ...(!multipart && options.body ? { 'Content-Type': 'application/json' } : {}), 'X-Studio-Request': '1', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 401) window.dispatchEvent(new Event('studio-session-expired')); throw new ApiError(response.status, data.error || 'Nie udało się połączyć', data.details); }
  return data;
}
export const send = <T = unknown>(path: string, body: unknown, method = 'POST') => api<T>(path, { method, body: JSON.stringify(body) });
export const assetUrl = (id: string) => `${API}/assets/${encodeURIComponent(id)}/file`;
export const fileUrl = (job: string, key: string, download = false) => `${API}/jobs/${job}/files/${key}${download ? '?download=1' : ''}`;
