"""Strony zawodnika: `/zawodnik/{slug}/statystyki` (wszystkie sezony) i `/zawodnik/{slug}/profil`."""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup, Tag

from .common import ParseError, clock_seconds, fold, team_from_url, text, to_float

# Nagłówek tabeli statystyk → klucz kontraktu (wartości z <span data-stat-total>).
COLUMN_KEYS = {
    'M': 'games', 'MIN': 'minutesTotal', 'PKT': 'pts', '2P': 'twoPm', '2P%': 'twoPct', '3P': 'threePm',
    '3P%': 'threePct', '1P': 'ftm', '1P%': 'ftPct', 'ZB A': 'orb', 'ZB O': 'drb', 'ZB': 'reb', 'AST': 'ast',
    'PRZ': 'stl', 'STR': 'tov', 'BLK': 'blk', 'F': 'pf', 'FW': 'pfDrawn', 'EVAL': 'eval', '+/-': 'plusMinus',
}
INT_KEYS = {'games', 'pts', 'twoPm', 'threePm', 'ftm', 'orb', 'drb', 'reb', 'ast', 'stl', 'tov', 'blk', 'pf',
            'pfDrawn', 'eval', 'plusMinus'}
PCT_MADE = {'twoPct': 'twoPm', 'threePct': 'threePm', 'ftPct': 'ftm'}
ROW_KEYS = ['competition', 'teamName', 'teamKalkId', 'games', 'minutesTotal', 'pts', 'twoPm', 'twoPct', 'threePm',
            'threePct', 'ftm', 'ftPct', 'orb', 'drb', 'reb', 'ast', 'stl', 'tov', 'blk', 'pf', 'pfDrawn', 'eval',
            'plusMinus']


def _cell_total(cell: Tag) -> str:
    total = cell.select_one('[data-stat-total]')
    return text(total) if total is not None else text(cell)


def _number(value: str, key: str):
    number = to_float(value, allow_empty=True)
    if number is None:
        return None
    if key in INT_KEYS:
        return int(round(number))
    return round(number, 1)


def _minutes_seconds(cell: Tag, games: Optional[int]) -> Optional[int]:
    """Minuty sezonu → SEKUNDY (jak `secondsPlayed` w box score).

    KALK pokazuje sumę w pełnych minutach i średnią z 1 miejscem po przecinku; średnia × mecze jest
    dokładniejsza (błąd ≤ 3 s/mecz) niż zaokrąglona suma. Zapis `mm:ss` jest przeliczany wprost.
    """
    total = _cell_total(cell)
    average_node = cell.select_one('[data-stat-average]')
    average = text(average_node) if average_node is not None else ''
    if ':' in total:
        return clock_seconds(total)
    if ':' in average and games:
        return clock_seconds(average) * games
    avg = to_float(average, allow_empty=True) if average else None
    if avg is not None and games:
        return int(round(avg * games * 60))
    minutes = to_float(total, allow_empty=True)
    return int(round(minutes * 60)) if minutes is not None else None


def parse_player_stats(soup: BeautifulSoup) -> list[dict]:
    """Wszystkie wiersze „sezon / rozgrywki” (sumy) z kluczem pomocniczym `seasonLabel`."""
    table = soup.select_one('table.player-statistics-table')
    if table is None:
        raise ParseError('Brak tabeli statystyk zawodnika KALK')
    headers = [text(th).upper() for th in table.select('thead th')]
    if not headers or 'M' not in headers:
        raise ParseError('Nieznany nagłówek statystyk zawodnika KALK')
    rows = []
    for tr in table.select('tbody > tr'):
        cells = tr.find_all('td', recursive=False)
        if len(cells) == 1 and cells[0].has_attr('colspan'):
            continue  # „Brak statystyk zawodnika.”
        if len(cells) != len(headers):
            raise ParseError(f'Wiersz statystyk zawodnika KALK ma {len(cells)} kolumn zamiast {len(headers)}')
        season = re.search(r'\d{4}/\d{4}', text(cells[0].find('strong') or cells[0]))
        detail = text(cells[0].find('small'))
        competition, _, team_name = detail.partition('·')
        row = {'seasonLabel': season.group(0) if season else None,
               'competition': competition.strip() or None,
               'teamName': team_name.strip() or None,
               'teamKalkId': None}
        for header, cell in zip(headers[1:], cells[1:]):
            key = COLUMN_KEYS.get(header)
            if key:
                row[key] = cell if key == 'minutesTotal' else _number(_cell_total(cell), key)
        if isinstance(row.get('minutesTotal'), Tag):
            row['minutesTotal'] = _minutes_seconds(row['minutesTotal'], row.get('games'))
        for key in ROW_KEYS:
            row.setdefault(key, None)
        for pct, made in PCT_MADE.items():
            # KALK pokazuje 0,0% także przy 0 oddanych — bez liczby prób to „brak danych”.
            if row.get(made) == 0:
                row[pct] = None
        rows.append(row)
    return rows


def contract_row(row: dict) -> dict:
    return {key: row.get(key) for key in ROW_KEYS}


def split_rows(rows: list[dict], season_label: str, competition: str) -> tuple[list[dict], list[dict]]:
    """(wiersze sezonu docelowego w danej lidze, pozostałe wiersze z etykietą sezonu)."""
    target, other = [], []
    for row in rows:
        if row['seasonLabel'] == season_label and fold(row['competition'] or '') == fold(competition):
            target.append(contract_row(row))
        else:
            other.append({'seasonLabel': row['seasonLabel'], **contract_row(row)})
    return target, other


def _facts(soup: BeautifulSoup) -> dict[str, str]:
    facts = {}
    for group in soup.select('.player-info-panel dl > div'):
        label = fold(text(group.find('dt')))
        value = text(group.find('dd'))
        if label:
            facts[label] = value
    return facts


def _birth_year(value: str) -> Optional[int]:
    match = re.search(r'\b(19|20)\d{2}\b', value or '')
    return int(match.group(0)) if match else None


def parse_player_profile(soup: BeautifulSoup) -> dict:
    name = text(soup.select_one('.player-portal-identity h1') or soup.find('h1'))
    if not name:
        raise ParseError('Profil zawodnika KALK bez nazwiska')
    facts = _facts(soup)
    position = facts.get('pozycja')
    number = re.search(r'-?\d+', facts.get('numer', ''))
    height = re.search(r'\d{2,3}', facts.get('wzrost', ''))
    first, _, last = name.partition(' ')
    team_link = soup.select_one('a.player-portal-team[href]') or soup.select_one('a.player-info-team[href]')
    team = team_from_url(team_link['href']) if team_link else None
    return {
        'fullName': name,
        'firstName': first or None,
        'lastName': last.strip() or None,
        'position': position if position and position not in ('—', '-') else None,
        'heightCm': int(height.group(0)) if height else None,
        'birthYear': _birth_year(facts.get('urodzony', '')),
        'lastNumber': int(number.group(0)) if number else None,
        'currentTeamKalkId': team[0] if team else None,
    }
