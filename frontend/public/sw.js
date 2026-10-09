/**
 * BeKaPaKa — Service Worker panelu.
 * Build (vite.config.ts → serviceWorkerVersionPlugin) podmienia __BUILD_ID__ i __PRECACHE_ASSETS__:
 * każde wdrożenie = nowy plik, przeglądarka wykrywa aktualizację i panel pokazuje pigułkę „Nowa wersja”.
 */

const BUILD_ID = '__BUILD_ID__';
const CACHE_NAME = `bkpk-stats-${BUILD_ID}`;
const SHELL_URL = '/index.html';
const STATIC_ASSETS = [
  SHELL_URL,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
];
// Wszystkie pliki z dist/assets (z hashem w nazwie) — start i każda strona działają od razu, także offline
const PRECACHE_ASSETS = /*__PRECACHE_ASSETS__*/[];

// 1. Install: powłoka + pliki wersji. Pliki z hashem, które telefon już ma (poprzednia wersja), kopiujemy
//    z poprzedniego cache zamiast pobierać ponownie — aktualizacja ściąga tylko to, co się zmieniło.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: 'reload' })));
      await Promise.all(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const previous = await caches.match(url);
            if (previous) return cache.put(url, previous);
            const response = await fetch(url);
            if (response.ok) await cache.put(url, response);
          } catch {
            // Pojedynczy plik nie blokuje instalacji — dociągnie się przy pierwszym użyciu
          }
        })
      );
    })()
  );
  // Bez skipWaiting: nowa wersja czeka na „Odśwież” w pigułce (SKIP_WAITING), powrót do aplikacji po dłuższej
  // przerwie albo zamknięcie aplikacji
});

// 2. Activate: usunięcie cache poprzednich wersji
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Strony serwera otwierane w nowym oknie (np. druk A4 odprawy z podpisanym linkiem) — prosto z sieci, bez cache
  if (request.mode === 'navigate' && url.pathname.startsWith('/api/')) return;

  // Strategy A: API requests -> Network-First with cache fallback.
  // Odpowiedzi z tokenem (dane zawodnika) nigdy nie trafiają do cache — po wylogowaniu nic nie zostaje w telefonie.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(request.headers.has('Authorization') ? networkOnly(request) : networkFirst(request));
    return;
  }

  // Strategy B: Static assets (JS chunks, CSS, fonts, images) -> Cache-First
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy C: nawigacja w aplikacji -> powłoka z cache (natychmiastowy start), sieć tylko gdy jej brak
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Default: Network-First
  event.respondWith(networkFirst(request));
});

// Network-Only (prywatne API): offline → ten sam JSON 503 co networkFirst, bez zapisu
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    return offlineApiResponse(request, err);
  }
}

// Network-First with Cache Fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return offlineApiResponse(request, err);
  }
}

// Offline: API dostaje JSON 503 z polskim komunikatem (panel pokaże „Spróbuj ponownie”), reszta — błąd sieci
function offlineApiResponse(request, err) {
  if (new URL(request.url).pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ error: 'Brak połączenia z internetem — spróbuj ponownie.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  throw err;
}

// Cache-First with Network Fetch
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached || Promise.reject(err);
  }
}

// Nawigacja: każdy adres panelu to ta sama powłoka SPA (jeden klucz /index.html) z cache tej wersji.
// Nowy HTML przychodzi razem z nową wersją SW (inny BUILD_ID), więc powłoka zawsze pasuje do plików z cache.
async function navigationHandler(request) {
  const cache = await caches.open(CACHE_NAME);
  const shell = await cache.match(SHELL_URL);
  if (shell) return shell;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok && (networkResponse.headers.get('content-type') || '').includes('text/html')) {
      cache.put(SHELL_URL, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const anyShell = await caches.match(SHELL_URL);
    if (anyShell) return anyShell;
    throw err;
  }
}

// 4. Wiadomości z panelu: SKIP_WAITING (włącz nową wersję), GET_VERSION (zamknięcie pigułki per wersja)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_VERSION' && event.ports[0]) {
    event.ports[0].postMessage(BUILD_ID);
  }
});
