// Use current origin and proxy via Vite
const API_URL = '';

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Response is not valid JSON — propagate the HTTP error below
  }

  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('bkpk_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders, ...(options.headers as Record<string, string>) };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });
  return handleResponse<T>(res);
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
  return handleResponse<T>(res);
}

export async function deleteJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse<T>(res);
}

export async function putJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
  return handleResponse<T>(res);
}
