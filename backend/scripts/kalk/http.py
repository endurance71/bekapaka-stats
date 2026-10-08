"""Pobieranie stron KALK wyłącznie przez Scrapling: limit tempa, budżet, retry, cache gzip."""

from __future__ import annotations

import gzip
import hashlib
import logging
import os
import re
import time
from pathlib import Path
from typing import Callable, Optional
from urllib.parse import urlparse

from .common import ALLOWED_HOSTS

log = logging.getLogger('kalk.http')

CACHE_MODES = ('read', 'refresh', 'off')
RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class KalkFetchError(RuntimeError):
    """Pobranie strony KALK nie powiodło się."""


class KalkNotFound(KalkFetchError):
    """KALK zwrócił 404."""


class BudgetExceeded(KalkFetchError):
    """Wyczerpano budżet zapytań sieciowych (--budget)."""


class CacheMiss(KalkFetchError):
    """Tryb offline (--plan): strony nie ma w cache."""


def _scrapling_get(url: str) -> tuple[int, str]:
    from scrapling.fetchers import Fetcher  # import leniwy: testy działają bez sieci

    page = Fetcher.get(url, timeout=30, retries=1, stealthy_headers=True)
    body = page.body
    if isinstance(body, bytes):
        body = body.decode('utf-8', errors='replace')
    return int(page.status), body if isinstance(body, str) else ''


def check_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS:
        raise KalkFetchError(f'Odrzucono adres spoza HTTPS KALK: {url}')


class KalkHttp:
    """Klient stron KALK.

    * `cache_mode='read'` — używa cache, gdy jest; brakujące strony pobiera i zapisuje,
    * `cache_mode='refresh'` — zawsze sieć, zapis do cache,
    * `cache_mode='off'` — zawsze sieć, bez cache,
    * `offline=True` — tylko cache; brak strony → `CacheMiss` (tryb --plan).

    `http_count` liczy wyłącznie zapytania sieciowe (również ponowione próby);
    `budget` to twardy limit tych zapytań.
    """

    def __init__(self, *, rate: float = 1.0, budget: Optional[int] = None,
                 cache_dir: Optional[str] = None, cache_mode: str = 'off',
                 retries: int = 2, fetch_fn: Optional[Callable[[str], tuple[int, str]]] = None,
                 save_fixtures_dir: Optional[str] = None, offline: bool = False,
                 sleep: Callable[[float], None] = time.sleep):
        if cache_mode not in CACHE_MODES:
            raise ValueError(f'Nieznany tryb cache: {cache_mode}')
        if cache_mode != 'off' and not cache_dir:
            cache_mode = 'off'
        self.rate = max(0.0, float(rate))
        self.budget = budget
        self.cache_dir = Path(cache_dir) if cache_dir else None
        self.cache_mode = cache_mode
        self.retries = max(0, int(retries))
        self.fetch_fn = fetch_fn or _scrapling_get
        self.save_fixtures_dir = Path(save_fixtures_dir) if save_fixtures_dir else None
        self.offline = offline
        self.sleep = sleep
        self.http_count = 0
        self.cache_hits = 0
        self._last_request: Optional[float] = None

    # --- cache -------------------------------------------------------------
    def _cache_path(self, url: str) -> Optional[Path]:
        if not self.cache_dir:
            return None
        digest = hashlib.sha256(url.encode('utf-8')).hexdigest()
        return self.cache_dir / digest[:2] / f'{digest}.html.gz'

    def cached(self, url: str) -> Optional[str]:
        path = self._cache_path(url)
        if path is None or not path.exists():
            return None
        try:
            with gzip.open(path, 'rt', encoding='utf-8') as handle:
                return handle.read()
        except (OSError, EOFError):
            return None

    def _store(self, url: str, html: str) -> None:
        path = self._cache_path(url)
        if path is None or self.cache_mode == 'off':
            return
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix('.tmp')
        with gzip.open(tmp, 'wt', encoding='utf-8') as handle:
            handle.write(html)
        os.replace(tmp, path)

    def _save_fixture(self, url: str, html: str) -> None:
        if not self.save_fixtures_dir:
            return
        parsed = urlparse(url)
        name = parsed.path.strip('/').replace('/', '-') or 'index'
        if parsed.query:
            name += '-' + re.sub(r'[^0-9A-Za-z]+', '-', parsed.query).strip('-')
        self.save_fixtures_dir.mkdir(parents=True, exist_ok=True)
        (self.save_fixtures_dir / f'{name}.html').write_text(html, encoding='utf-8')

    # --- sieć ----------------------------------------------------------------
    def _throttle(self) -> None:
        if self._last_request is None or self.rate <= 0:
            return
        wait = self.rate - (time.monotonic() - self._last_request)
        if wait > 0:
            self.sleep(wait)

    def _network(self, url: str) -> str:
        last_error: Optional[Exception] = None
        for attempt in range(self.retries + 1):
            if self.budget is not None and self.http_count >= self.budget:
                raise BudgetExceeded(f'Budżet {self.budget} zapytań wyczerpany przed {url}')
            self._throttle()
            self.http_count += 1
            self._last_request = time.monotonic()
            try:
                status, html = self.fetch_fn(url)
            except Exception as exc:  # błąd sieci Scrapling/curl
                last_error = KalkFetchError(f'Nie udało się pobrać {url} przez Scrapling: {exc}')
                log.warning('Próba %d: %s', attempt + 1, last_error)
            else:
                if status == 404:
                    raise KalkNotFound(f'HTTP 404 dla {url}')
                if status == 200 and html and html.strip():
                    return html
                last_error = KalkFetchError(f'HTTP {status} dla {url}' if status != 200 else f'Pusta odpowiedź dla {url}')
                if status not in RETRYABLE_STATUS and status != 200:
                    raise last_error
                log.warning('Próba %d: %s', attempt + 1, last_error)
            if attempt < self.retries:
                self.sleep(max(self.rate, 1.0) * (2 ** attempt))
        raise last_error or KalkFetchError(f'Nie udało się pobrać {url}')

    def get(self, url: str) -> str:
        check_url(url)
        if self.cache_mode == 'read' or self.offline:
            html = self.cached(url)
            if html is not None:
                self.cache_hits += 1
                return html
        if self.offline:
            raise CacheMiss(f'Brak w cache: {url}')
        html = self._network(url)
        self._store(url, html)
        self._save_fixture(url, html)
        return html
