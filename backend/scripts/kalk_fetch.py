"""Wspólne pobieranie stron KALK wyłącznie przez Scrapling."""

from scrapling.fetchers import Fetcher
from urllib.parse import urlparse


class KalkFetchError(RuntimeError):
    """Pobranie strony KALK nie powiodło się; import nie może użyć częściowych danych."""


def fetch_html(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in {'www.kalk-koszalin.com', 'kalk-koszalin.com'}:
        raise KalkFetchError('Odrzucono adres spoza HTTPS KALK')
    try:
        page = Fetcher.get(url, timeout=30, retries=2, stealthy_headers=True)
        if page.status != 200:
            raise KalkFetchError(f'HTTP {page.status} dla {url}')
        html = page.body
        if isinstance(html, bytes):
            html = html.decode('utf-8')
        if not isinstance(html, str) or not html.strip():
            raise KalkFetchError(f'Pusta odpowiedź dla {url}')
        return html
    except KalkFetchError:
        raise
    except Exception as exc:
        raise KalkFetchError(f'Nie udało się pobrać {url} przez Scrapling: {exc}') from exc
