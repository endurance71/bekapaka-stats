"""Wspólne narzędzia parserów KALK v2: liczby, adresy, nazwy, hashe."""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from datetime import datetime, timezone
from typing import Any, Iterable, Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

BASE = 'https://www.kalk-koszalin.com/'
ALLOWED_HOSTS = {'www.kalk-koszalin.com', 'kalk-koszalin.com'}
DEFAULT_LEAGUE = 'dywizja-ii'
LEAGUE_COMPETITION = {'dywizja-ii': 'Dywizja II'}
PARSER_VERSION = '4.0.0'
CONTRACT_VERSION = 3
SOURCE_SITE = 'v2'
PLACEHOLDER_IMAGES = ('team-placeholder', 'player-placeholder')
REGULAR_PERIOD_SEC = 600
OVERTIME_PERIOD_SEC = 300


class ParseError(ValueError):
    """Strona KALK ma strukturę, której parser nie rozumie — dane nie mogą zostać użyte."""


def soup_of(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, 'html.parser')


def text(node: Optional[Tag]) -> str:
    if node is None:
        return ''
    return re.sub(r'\s+', ' ', node.get_text(' ', strip=True)).strip()


def own_text(node: Optional[Tag]) -> str:
    """Tekst węzła bez tekstu dzieci (np. `<b>36 <small>EVAL</small></b>` → `36`)."""
    if node is None:
        return ''
    parts = [str(child) for child in node.children if isinstance(child, str)]
    return re.sub(r'\s+', ' ', ''.join(parts)).strip()


_NUMBER_CLEAN = re.compile(r'[\s   %]')


def to_float(value: Any, *, allow_empty: bool = False) -> Optional[float]:
    if value is None:
        if allow_empty:
            return None
        raise ParseError('Brak liczby KALK')
    raw = str(value).replace('−', '-').replace('–', '-').replace(',', '.')
    raw = _NUMBER_CLEAN.sub('', raw)
    if raw in ('', '-', '—') and allow_empty:
        return None
    if raw.startswith('+'):
        raw = raw[1:]
    try:
        return float(raw)
    except ValueError as exc:
        raise ParseError(f'Niepoprawna liczba KALK: {value!r}') from exc


def to_int(value: Any, *, allow_empty: bool = False) -> Optional[int]:
    number = to_float(value, allow_empty=allow_empty)
    if number is None:
        return None
    if not float(number).is_integer():
        raise ParseError(f'Oczekiwano liczby całkowitej KALK: {value!r}')
    return int(number)


def made_attempted(value: str) -> tuple[int, int]:
    parts = (value or '').split('/')
    if len(parts) != 2:
        raise ParseError(f'Niepoprawny zapis rzutów KALK: {value!r}')
    return to_int(parts[0]), to_int(parts[1])


def dash_pair(value: str) -> tuple[int, int]:
    """`13–37`, `2 561–3 273` → (13, 37)."""
    parts = re.split(r'\s*[–—-]\s*(?=\d)', (value or '').strip(), maxsplit=1)
    if len(parts) != 2:
        raise ParseError(f'Niepoprawna para liczb KALK: {value!r}')
    return to_int(parts[0]), to_int(parts[1])


def score_pair(value: str) -> tuple[int, int]:
    """`26:4` → (26, 4)."""
    match = re.fullmatch(r'\s*(\d+)\s*:\s*(\d+)\s*', value or '')
    if not match:
        raise ParseError(f'Niepoprawny wynik KALK: {value!r}')
    return int(match.group(1)), int(match.group(2))


def clock_seconds(value: str) -> int:
    match = re.fullmatch(r'\s*(\d{1,3}):(\d{2})\s*', value or '')
    if not match:
        raise ParseError(f'Niepoprawny czas KALK: {value!r}')
    return int(match.group(1)) * 60 + int(match.group(2))


def period_length(period: int) -> int:
    return REGULAR_PERIOD_SEC if period <= 4 else OVERTIME_PERIOD_SEC


def period_offset(period: int) -> int:
    """Sekundy gry przed początkiem danego okresu (kwarty 600 s, dogrywki 300 s)."""
    if period <= 1:
        return 0
    if period <= 5:
        return (period - 1) * REGULAR_PERIOD_SEC
    return 4 * REGULAR_PERIOD_SEC + (period - 5) * OVERTIME_PERIOD_SEC


def absolute(href: str) -> str:
    return urljoin(BASE, href)


def path_parts(url: str) -> list[str]:
    return [p for p in urlparse(absolute(url)).path.split('/') if p]


def match_id_from_url(url: str) -> Optional[str]:
    parts = path_parts(url)
    if len(parts) >= 2 and parts[0] == 'mecz' and parts[1].isdigit():
        return parts[1]
    return None


def team_from_url(url: str) -> Optional[tuple[str, Optional[str]]]:
    parts = path_parts(url)
    if len(parts) >= 2 and parts[0] == 'druzyna' and parts[1].isdigit():
        return parts[1], (parts[2] if len(parts) >= 3 else None)
    return None


def player_slug_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    parts = path_parts(url)
    if len(parts) >= 2 and parts[0] == 'zawodnik' and parts[1]:
        return parts[1]
    return None


def image_url(img: Optional[Tag]) -> Optional[str]:
    if img is None:
        return None
    src = (img.get('src') or '').strip()
    if not src or src.startswith('data:') or any(p in src for p in PLACEHOLDER_IMAGES):
        return None
    return absolute(src)


def league_url(league: str, section: str, kalk_number: Optional[int] = None) -> str:
    url = urljoin(BASE, f'liga/{league}/{section}')
    return f'{url}?sezon={kalk_number}' if kalk_number is not None else url


def match_url(match_id: str, section: Optional[str] = None) -> str:
    base = urljoin(BASE, f'mecz/{match_id}')
    return f'{base}/{section}' if section else base


def player_url(slug: str, section: Optional[str] = None) -> str:
    base = urljoin(BASE, f'zawodnik/{slug}')
    return f'{base}/{section}' if section else base


def team_url(team_id: str, slug: Optional[str]) -> str:
    return urljoin(BASE, f'druzyna/{team_id}/{slug}' if slug else f'druzyna/{team_id}')


def season_slug_from_label(label: str) -> str:
    match = re.fullmatch(r'\s*(\d{4})\s*/\s*(\d{4})\s*', label or '')
    if not match:
        raise ParseError(f'Niepoprawna etykieta sezonu KALK: {label!r}')
    return f'{match.group(1)}-{match.group(2)}'


def season_label_from_slug(slug: str) -> str:
    match = re.fullmatch(r'(\d{4})-(\d{4})', slug or '')
    if not match:
        raise ParseError(f'Niepoprawny slug sezonu: {slug!r}')
    return f'{match.group(1)}/{match.group(2)}'


_EXTRA_FOLD = str.maketrans({'ł': 'l', 'Ł': 'l', 'đ': 'd', 'ø': 'o', 'ß': 'ss'})


def fold(value: str) -> str:
    """Porównywalna forma nazwy: bez diakrytyków, małe litery, pojedyncze spacje."""
    value = (value or '').translate(_EXTRA_FOLD)
    normalized = unicodedata.normalize('NFKD', value)
    stripped = ''.join(ch for ch in normalized if not unicodedata.combining(ch))
    stripped = re.sub(r'[^0-9a-zA-Z]+', ' ', stripped).strip().lower()
    return re.sub(r'\s+', ' ', stripped)


def slugify(value: str) -> str:
    return fold(value).replace(' ', '-')


def stable_hash(data: Any) -> str:
    payload = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return 'sha256:' + hashlib.sha256(payload.encode('utf-8')).hexdigest()


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def iso_from_epoch(epoch: Any) -> Optional[str]:
    try:
        value = int(str(epoch).strip())
    except (TypeError, ValueError):
        return None
    return iso_utc(datetime.fromtimestamp(value, tz=timezone.utc))


def iso_from_datetime_attr(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.strip())
    except ValueError:
        return None
    if dt.tzinfo is None:
        return None
    return iso_utc(dt)


def now_iso() -> str:
    return iso_utc(datetime.now(timezone.utc))


def unique(items: Iterable[Any]) -> list[Any]:
    seen = set()
    result = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def page_title(soup: BeautifulSoup) -> str:
    return text(soup.title) if soup.title else ''
