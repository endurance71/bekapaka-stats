// Use current origin and proxy via Vite
const API_URL = '';

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Register global handler for 401 responses (e.g. logout + redirect). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

/** Błąd API ze statusem HTTP; `status === 0` = brak połączenia (sieć, tryb samolotowy, serwer nieosiągalny). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Komunikat dla zawodnika zamiast surowego „Request failed: 403”. */
function statusMessage(status: number): string {
  if (status === 403) return 'Brak dostępu do tej części panelu.';
  if (status === 404) return 'Nie znaleziono.';
  if (status === 429) return 'Zbyt wiele prób — spróbuj za chwilę.';
  if (status >= 500) return 'Serwer chwilowo nie odpowiada — spróbuj ponownie.';
  return 'Coś poszło nie tak — spróbuj ponownie.';
}

async function handleResponse<T>(res: Response, sentToken: boolean): Promise<T> {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Response is not valid JSON — propagate the HTTP error below
  }

  if (res.status === 401) {
    // Tylko gdy wysłaliśmy token (wygasła sesja); błędne hasło przy logowaniu nie przeładowuje strony
    if (sentToken) onUnauthorized?.();
    throw new ApiError(data?.error || 'Sesja wygasła — zaloguj się ponownie.', 401);
  }

  if (!res.ok) {
    throw new ApiError(data?.error || statusMessage(res.status), res.status);
  }
  return data as T;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('bkpk_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders, ...(init.headers as Record<string, string>) };
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Brak połączenia z serwerem — sprawdź internet i spróbuj ponownie.', 0);
  }
  return handleResponse<T>(res, Boolean(authHeaders.Authorization));
}

/**
 * Pamięć ostatnich odpowiedzi GET (w pamięci karty, nie na dysku): strona otwarta drugi raz pokazuje dane od razu,
 * a świeże dociąga w tle (`useCachedJSON`). Czyszczona przy wylogowaniu.
 */
const responseCache = new Map<string, { data: unknown; at: number }>();
const CACHE_LIMIT = 80;

export function peekApiCache<T>(path: string): { data: T; at: number } | undefined {
  return responseCache.get(path) as { data: T; at: number } | undefined;
}

export function clearApiCache() {
  responseCache.clear();
}

export async function fetchJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const data = await request<T>(path, { ...options, cache: 'no-store' });
  if (!options.method || options.method === 'GET') {
    responseCache.delete(path);
    responseCache.set(path, { data, at: Date.now() });
    if (responseCache.size > CACHE_LIMIT) responseCache.delete(responseCache.keys().next().value as string);
  }
  return data;
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function deleteJSON<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export async function putJSON<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
