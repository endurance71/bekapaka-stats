"""Odkrywanie sezonów KALK z `<select name="sezon">` na stronach ligi."""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup

from .common import ParseError, page_title, season_label_from_slug, season_slug_from_label, text

# Pierwszy sezon historii BeKaPaKa w KALK v2 (2023/24).
FIRST_SEASON_NUMBER = 47


def parse_season_options(soup: BeautifulSoup) -> dict:
    """Zwraca {'seasons': [{kalkNumber, label, slug}], 'selected': int|None} (malejąco jak na stronie)."""
    select = soup.select_one('form.season-switch select[name="sezon"]') or soup.select_one('select[name="sezon"]')
    if select is None:
        raise ParseError('Brak wyboru sezonu na stronie ligi KALK')
    seasons = []
    selected = None
    for option in select.find_all('option'):
        value = (option.get('value') or '').strip()
        label = text(option)
        match = re.search(r'(\d{4})\s*/\s*(\d{4})', label)
        if not value.isdigit() or not match:
            continue
        label = f'{match.group(1)}/{match.group(2)}'
        seasons.append({'kalkNumber': int(value), 'label': label, 'slug': season_slug_from_label(label)})
        if option.has_attr('selected'):
            selected = int(value)
    if not seasons:
        raise ParseError('Pusta lista sezonów KALK')
    if len({s['kalkNumber'] for s in seasons}) != len(seasons):
        raise ParseError('Zduplikowane numery sezonów KALK')
    return {'seasons': seasons, 'selected': selected}


def current_season(options: dict) -> dict:
    by_number = {s['kalkNumber']: s for s in options['seasons']}
    if options.get('selected') in by_number:
        return by_number[options['selected']]
    return max(options['seasons'], key=lambda s: s['kalkNumber'])


def resolve_targets(spec: str, options: dict) -> list[dict]:
    """`current` | `all` (47..bieżący) | slug `2025-2026` | numer KALK `49` → lista sezonów (rosnąco)."""
    spec = (spec or 'current').strip()
    by_number = {s['kalkNumber']: s for s in options['seasons']}
    current = current_season(options)
    if spec == 'current':
        return [current]
    if spec == 'all':
        return sorted((s for s in options['seasons'] if FIRST_SEASON_NUMBER <= s['kalkNumber'] <= current['kalkNumber']),
                      key=lambda s: s['kalkNumber'])
    if spec.isdigit():
        number = int(spec)
        if number not in by_number:
            raise ParseError(f'KALK nie zna sezonu numer {number}')
        return [by_number[number]]
    label = season_label_from_slug(spec)
    for season in options['seasons']:
        if season['label'] == label:
            return [season]
    raise ParseError(f'KALK nie zna sezonu {spec}')


def confirm_page_season(soup: BeautifulSoup, label: str, page: str) -> None:
    """Strona ligi musi potwierdzać sezon w tytule (ochrona przed przekierowaniem na bieżący)."""
    title = page_title(soup)
    if label not in title:
        raise ParseError(f'Strona {page} KALK nie potwierdza sezonu {label} (tytuł: {title!r})')


def selected_season(soup: BeautifulSoup) -> Optional[dict]:
    try:
        options = parse_season_options(soup)
    except ParseError:
        return None
    by_number = {s['kalkNumber']: s for s in options['seasons']}
    return by_number.get(options.get('selected'))
