"""Strona `/mecz/{id}/statystyki`: dwie tabele box score (29 kolumn, `tr.is-starter`, `tfoot` SUMA)."""

from __future__ import annotations

from typing import Optional

from bs4 import BeautifulSoup, Tag

from .common import ParseError, clock_seconds, made_attempted, player_slug_from_url, text, to_int

# Kolejność kolumn <td> w wierszu zawodnika (thead: Nr, Zawodnik, Min, Pkt, Za 2 C/O %, Za 3 C/O %,
# Z gry C/O %, Za 1 C/O %, Zbiórki A O S, As, Prz, Str, F, Fw, Bl, Bl o, EVAL, +/-).
COL_NUMBER, COL_NAME, COL_MIN, COL_PTS = 0, 1, 2, 3
COL_TWO, COL_THREE, COL_FG, COL_FT = 4, 6, 8, 10
COL_ORB, COL_DRB, COL_REB = 12, 13, 14
COL_AST, COL_STL, COL_TOV, COL_PF, COL_PFD, COL_BLK, COL_BLKA, COL_EVAL, COL_PM = 15, 16, 17, 18, 19, 20, 21, 22, 23
MIN_COLUMNS = 24

STAT_KEYS = ['secondsPlayed', 'pts', 'twoPm', 'twoPa', 'threePm', 'threePa', 'fgm', 'fga', 'ftm', 'fta',
             'orb', 'drb', 'reb', 'ast', 'stl', 'tov', 'pf', 'pfDrawn', 'blk', 'blkAgainst', 'eval']


def _stats(cells: list[Tag]) -> dict:
    two = made_attempted(text(cells[COL_TWO]))
    three = made_attempted(text(cells[COL_THREE]))
    fg = made_attempted(text(cells[COL_FG]))
    ft = made_attempted(text(cells[COL_FT]))
    return {
        'secondsPlayed': clock_seconds(text(cells[COL_MIN])),
        'pts': to_int(text(cells[COL_PTS])),
        'twoPm': two[0], 'twoPa': two[1],
        'threePm': three[0], 'threePa': three[1],
        'fgm': fg[0], 'fga': fg[1],
        'ftm': ft[0], 'fta': ft[1],
        'orb': to_int(text(cells[COL_ORB])),
        'drb': to_int(text(cells[COL_DRB])),
        'reb': to_int(text(cells[COL_REB])),
        'ast': to_int(text(cells[COL_AST])),
        'stl': to_int(text(cells[COL_STL])),
        'tov': to_int(text(cells[COL_TOV])),
        'pf': to_int(text(cells[COL_PF])),
        'pfDrawn': to_int(text(cells[COL_PFD])),
        'blk': to_int(text(cells[COL_BLK])),
        'blkAgainst': to_int(text(cells[COL_BLKA])),
        'eval': to_int(text(cells[COL_EVAL])),
    }


def _player_row(tr: Tag) -> dict:
    cells = tr.find_all('td', recursive=False)
    if len(cells) < MIN_COLUMNS:
        raise ParseError(f'Wiersz box score KALK ma {len(cells)} kolumn (oczekiwano {MIN_COLUMNS})')
    name_cell = cells[COL_NAME]
    link = name_cell.find('a', href=True)
    name = (name_cell.get('data-sort-value') or '').strip()
    if not name:
        node = link or name_cell
        name = ' '.join(s.strip() for s in node.find_all(string=True, recursive=False) if s.strip()) or text(node)
    name = name.replace('*', '').strip()
    starter = 'is-starter' in (tr.get('class') or []) or name_cell.find('sup') is not None
    row = {
        'slug': player_slug_from_url(link['href']) if link else None,
        'name': name,
        'number': to_int(text(cells[COL_NUMBER]), allow_empty=True),
        'starter': starter,
    }
    row.update(_stats(cells))
    row['plusMinus'] = to_int(text(cells[COL_PM]), allow_empty=True)
    return row


def _footer(section: Tag) -> Optional[dict]:
    tr = section.select_one('tfoot tr')
    if tr is None:
        return None
    cells = tr.find_all(['td', 'th'], recursive=False)
    if len(cells) < MIN_COLUMNS:
        return None
    return _stats(cells)


def sum_rows(players: list[dict]) -> dict:
    return {key: sum(p[key] for p in players) for key in STAT_KEYS}


def parse_boxscore(soup: BeautifulSoup) -> dict:
    """Zwraca {'teams': [{name, players, totals, footer, startersPts, benchPts}] ×2} (bez side/teamKalkId)."""
    sections = soup.select('section.game-boxscore')
    if len(sections) != 2:
        raise ParseError(f'Oczekiwano 2 tabel box score KALK, jest {len(sections)}')
    teams = []
    for section in sections:
        name = text(section.select_one('header h2') or section.find('h2'))
        table = section.select_one('table.game-stats-table')
        if not name or table is None:
            raise ParseError('Niepełna tabela box score KALK')
        players = [_player_row(tr) for tr in table.select('tbody > tr')]
        if not players:
            raise ParseError(f'Pusta tabela zawodników KALK ({name})')
        teams.append({
            'name': name,
            'players': players,
            'totals': sum_rows(players),
            'footer': _footer(section),
            'startersPts': sum(p['pts'] for p in players if p['starter']),
            'benchPts': sum(p['pts'] for p in players if not p['starter']),
        })
    return {'teams': teams}
