"""
Parsers for KALK HTML pages (Dywizja II).
Output structures align with backend/kalk/parseMatchBoxScore.js for Node import.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from bs4 import BeautifulSoup, Tag

OUR_TEAM_KEYWORDS = ['bekapaka', 'bobolice']
PARSER_VERSION = '2.0.0'


def normalize_query(value: str) -> str:
    if not value:
        return ''
    normalized = unicodedata.normalize('NFD', value.lower())
    return ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')


def is_our_team(team_value: Optional[str]) -> bool:
    if not team_value:
        return False
    text = normalize_query(team_value)
    return any(keyword in text for keyword in OUR_TEAM_KEYWORDS)


def parse_co_att(value: str) -> Dict[str, int]:
    if not value:
        return {'made': 0, 'att': 0}
    cleaned = value.replace('\xa0', ' ').strip()
    if '/' not in cleaned:
        num = re.search(r'-?\d+', cleaned)
        return {'made': int(num.group(0)) if num else 0, 'att': 0}
    parts = cleaned.split('/', 1)
    return {
        'made': int(parts[0].strip() or 0),
        'att': int(parts[1].strip() or 0),
    }


def parse_int_cell(text: str) -> int:
    if not text:
        return 0
    match = re.search(r'-?\d+', str(text).strip())
    return int(match.group(0)) if match else 0


def extract_match_id_from_url(url: str) -> Optional[str]:
    match = re.search(r'mecz,[^,]+,(\d+),', url or '')
    return match.group(1) if match else None


def extract_player_id_from_url(url: str) -> Optional[str]:
    match = re.search(r'zawodnik,[^,]+,(\d+),', url or '')
    return match.group(1) if match else None


def parse_player_row(cells: List[str]) -> Dict[str, Any]:
    name_cell = cells[1] if len(cells) > 1 else ''
    link = None
    if isinstance(name_cell, Tag):
        link = name_cell.find('a', href=True)
        name = link.get_text(strip=True) if link else name_cell.get_text(strip=True)
        profile_url = link['href'] if link else None
    else:
        name = str(name_cell)
        profile_url = None
        link_match = re.search(r'href="([^"]*zawodnik[^"]*)"', str(name_cell))
        if link_match:
            profile_url = link_match.group(1)

    player_id = extract_player_id_from_url(profile_url or '')

    def cell_text(idx: int) -> str:
        if idx >= len(cells):
            return ''
        c = cells[idx]
        return c.get_text(strip=True) if isinstance(c, Tag) else str(c).strip()

    two = parse_co_att(cell_text(5))
    three = parse_co_att(cell_text(7))
    fg = parse_co_att(cell_text(9))
    ft = parse_co_att(cell_text(11))

    return {
        'name': name,
        'kalkPlayerNumericId': player_id,
        'profile_url': profile_url,
        'number': parse_int_cell(cell_text(0)),
        'starter': cell_text(2) == '*',
        'pts': parse_int_cell(cell_text(3)),
        'min': cell_text(4),
        'two_pm': two['made'],
        'two_pa': two['att'],
        'three_pm': three['made'],
        'three_pa': three['att'],
        'fgm': fg['made'],
        'fga': fg['att'],
        'ftm': ft['made'],
        'fta': ft['att'],
        'orb': parse_int_cell(cell_text(13)),
        'drb': parse_int_cell(cell_text(14)),
        'reb': parse_int_cell(cell_text(15)),
        'ast': parse_int_cell(cell_text(16)),
        'pf': parse_int_cell(cell_text(17)),
        'pfDrawn': parse_int_cell(cell_text(18)),
        'tov': parse_int_cell(cell_text(19)),
        'stl': parse_int_cell(cell_text(20)),
        'blk': parse_int_cell(cell_text(21)),
        'plusMinus': parse_int_cell(cell_text(22)),
        'eval': parse_int_cell(cell_text(23)),
    }


def parse_quarters_from_raw(raw: Optional[str]) -> List[Dict[str, Any]]:
    """Parsuje linię kwart KALK, np. (15:18; 17:18; 23:11; 7:15;)."""
    if not raw:
        return []
    inner = raw.strip().strip('()')
    if not inner:
        return []
    quarters: List[Dict[str, Any]] = []
    for part in inner.split(';'):
        part = part.strip()
        if not part:
            continue
        score_match = re.search(r'(\d{1,3})\s*:\s*(\d{1,3})', part)
        if not score_match:
            continue
        home = int(score_match.group(1))
        away = int(score_match.group(2))
        quarters.append({
            'label': f'Q{len(quarters) + 1}',
            'home': home,
            'away': away,
        })
    return quarters


def extract_quarters_raw(soup: BeautifulSoup) -> Optional[str]:
    """Szuka linii wyników kwartowych (h4 lub HTML strony meczu)."""
    for h4 in soup.find_all('h4'):
        text = h4.get_text(strip=True)
        if re.search(r'\(\d{1,2}:\d{1,2};', text):
            return text
    html_str = str(soup)
    match = re.search(r'\((\d{1,2}:\d{1,2};\s*){2,}[^)]*\)', html_str)
    if match:
        return match.group(0)
    text_blob = soup.get_text(' ', strip=True)
    match = re.search(r'\((\d{1,2}:\d{1,2};\s*){2,}[^)]*\)', text_blob)
    return match.group(0) if match else None


def parse_team_table(table: Tag, team_name: str) -> Dict[str, Any]:
    players: List[Dict[str, Any]] = []
    for row in table.find_all('tr'):
        if row.find('th'):
            continue
        cells = row.find_all('td')
        if len(cells) < 20:
            continue
        label = cells[1].get_text(strip=True)
        if label in ('SUMY', 'Drużyna'):
            continue
        if not re.search(r'\d', cells[0].get_text(strip=True)) and not cells[1].find('a', href=True):
            continue
        players.append(parse_player_row(cells))

    return {
        'name': team_name,
        'players': players,
        'isBekapaka': is_our_team(team_name),
    }


def parse_match_page(soup: BeautifulSoup, page_url: str = '') -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    text_blob = soup.get_text(' ', strip=True)

    round_match = re.search(r'RZ\s*-\s*(\d+)', text_blob, re.I)
    if round_match:
        meta['roundCode'] = f"RZ-{round_match.group(1)}"

    match_num = re.search(r'numer meczu.*?(\d+)', text_blob, re.I)
    if match_num:
        meta['matchNumber'] = int(match_num.group(1))

    date_match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})', text_blob)
    if date_match:
        meta['dateRaw'] = date_match.group(1)

    ref_match = re.search(r'Sędziowie:\s*([^<]+)', str(soup))
    if ref_match:
        meta['referees'] = ref_match.group(1).strip()

    stat_match = re.search(r'Statystyk:\s*([^.<]+)', str(soup))
    if stat_match:
        meta['statistician'] = stat_match.group(1).strip()

    quarters_raw = extract_quarters_raw(soup)
    if quarters_raw:
        meta['quartersRaw'] = quarters_raw
        quarters = parse_quarters_from_raw(quarters_raw)
        if quarters:
            meta['quarters'] = quarters

    score_h1 = soup.find('h1')
    score_home, score_away = None, None
    if score_h1:
        score_parts = re.search(r'(\d{1,3})\s*:\s*(\d{1,3})', score_h1.get_text(strip=True))
        if score_parts:
            score_home = int(score_parts.group(1))
            score_away = int(score_parts.group(2))

    teams: List[Dict[str, Any]] = []
    for h3 in soup.find_all('h3'):
        table = h3.find_next('table')
        if not table:
            continue
        header = table.get_text(' ', strip=True)
        if 'imię i nazwisko' not in header and 'imie i nazwisko' not in normalize_query(header):
            continue
        team_name = h3.get_text(strip=True)
        teams.append(parse_team_table(table, team_name))

    if len(teams) < 2:
        raise ValueError('Nie znaleziono dwóch tabel box score na stronie meczu')

    home = teams[0]
    guest = teams[1]
    home_pts = score_home if score_home is not None else sum(p.get('pts', 0) for p in home['players'])
    guest_pts = score_away if score_away is not None else sum(p.get('pts', 0) for p in guest['players'])

    match_id = extract_match_id_from_url(page_url)
    slug_match = re.search(r'mecz,([^,]+),', page_url or '')
    slug = slug_match.group(1) if slug_match else None

    box_score: Dict[str, Any] = {
        'teams': [
            {**home, 'pts': home_pts},
            {**guest, 'pts': guest_pts},
        ],
        'meta': meta,
    }
    if meta.get('quarters'):
        box_score['quarters'] = meta['quarters']

    return {
        'id': match_id,
        'slug': slug,
        'match_url': page_url,
        'homeTeamName': home['name'],
        'guestTeamName': guest['name'],
        'scoreHome': home_pts,
        'scoreAway': guest_pts,
        'isFinished': home_pts is not None and guest_pts is not None,
        'boxScore': box_score,
        'roundCode': meta.get('roundCode'),
        'date': meta.get('dateRaw'),
        'referees': meta.get('referees'),
        'statistician': meta.get('statistician'),
    }


def discover_stat_category_urls(stats_soup: BeautifulSoup, base_url: str) -> Dict[str, str]:
    """All league stat table URLs from <select> (deduplicated by category key)."""
    urls: Dict[str, str] = {}
    for option in stats_soup.find_all('option'):
        val = option.get('value', '')
        if not val or val.startswith('adres/'):
            continue
        full = val if val.startswith('http') else f"{base_url.rstrip('/')}/{val.lstrip('/')}"
        lowered = normalize_query(val)
        key = 'pkt'
        for candidate in (
            'eval', 'zbiorki', 'asysty', 'prz', 'bl', 'str', 'proc3', 'proc2', 'proc1',
            'czas_gry', 'atak', 'obrona', 'f', 'rekordy'
        ):
            if candidate in lowered:
                key = candidate
                break
        if 'rekordy' in lowered and 'pkt' in lowered:
            key = 'rekordy_pkt'
        if key not in urls:
            urls[key] = full
    return urls


def extract_category_stats_table(soup: BeautifulSoup, category_name: str) -> Dict[str, Dict[str, Any]]:
    table = soup.find('table')
    if not table:
        return {}

    stats: Dict[str, Dict[str, Any]] = {}
    for row in table.find_all('tr'):
        if row.find('th'):
            continue
        cells = row.find_all('td')
        if len(cells) < 4:
            continue
        link = row.find('a', href=True)
        if not link:
            continue
        name = link.get_text(strip=True)
        profile_url = link['href']
        player_id = re.sub(r'[^A-Za-z0-9_-]', '', urlparse(profile_url).path.rstrip('/').split('/')[-1])

        if category_name in ('three_pct', 'proc3'):
            try:
                pct_str = cells[3].get_text(strip=True).replace(',', '.')
                pct = float(pct_str) if pct_str else 0.0
                celne_oddane = cells[4].get_text(strip=True)
                made, att = 0, 0
                if '/' in celne_oddane:
                    parts = celne_oddane.split('/')
                    made = int(parts[0].strip())
                    att = int(parts[1].strip())
                stats[player_id] = {
                    'three_pct': pct,
                    'three_made': made,
                    'three_attempted': att,
                }
            except (ValueError, IndexError):
                pass
        else:
            try:
                suma_str = cells[3].get_text(strip=True).replace(',', '.')
                suma = float(suma_str) if suma_str else 0.0
                srednia_str = cells[5].get_text(strip=True).replace(',', '.') if len(cells) > 5 else '0'
                srednia = float(srednia_str) if srednia_str else 0.0
                stats[player_id] = {
                    f'{category_name}_suma': suma,
                    f'{category_name}_srednia': srednia,
                }
            except (ValueError, IndexError):
                pass
    return stats


def extract_teams_index(soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
    teams = []
    for link in soup.find_all('a', href=True):
        href = link['href']
        if '/klub,' not in href:
            continue
        match = re.search(r'klub,([^,]+),(\d+),', href)
        if not match:
            continue
        slug, team_id = match.group(1), match.group(2)
        name = link.get_text(strip=True)
        if not name:
            continue
        teams.append({
            'id': team_id,
            'slug': slug,
            'name': name,
            'profile_url': href if href.startswith('http') else f"{base_url.rstrip('/')}/{href.lstrip('/')}",
        })
    deduped = {t['id']: t for t in teams}
    return list(deduped.values())


def extract_team_page(soup: BeautifulSoup) -> Dict[str, Any]:
    info: Dict[str, Any] = {}
    text = soup.get_text('\n', strip=True)
    for line in text.split('\n'):
        if line.startswith('Kapitan:'):
            info['captain'] = line.replace('Kapitan:', '').strip()
        elif line.startswith('Barwy:'):
            info['colors'] = line.replace('Barwy:', '').strip()
        elif line.startswith('Sponsorzy:'):
            info['sponsors'] = line.replace('Sponsorzy:', '').strip()

    player_ids = []
    for link in soup.find_all('a', href=True):
        pid = extract_player_id_from_url(link['href'])
        if pid and pid not in player_ids:
            player_ids.append(pid)
    info['playerIds'] = player_ids
    return info


def parse_player_game_log_page(soup: BeautifulSoup, player_name: str = '') -> List[Dict[str, Any]]:
    table = soup.find('table')
    if not table:
        return []

    rows: List[Dict[str, Any]] = []
    for tr in table.find_all('tr'):
        if tr.find('th'):
            continue
        cells = tr.find_all('td')
        if len(cells) < 10:
            continue
        opponent_link = cells[0].find('a', href=True)
        score_link = cells[1].find('a', href=True) if len(cells) > 1 else None
        opponent = opponent_link.get_text(strip=True) if opponent_link else cells[0].get_text(strip=True)
        score_label = score_link.get_text(strip=True) if score_link else cells[1].get_text(strip=True)
        match_url = score_link['href'] if score_link else None

        def c(idx: int) -> str:
            return cells[idx].get_text(strip=True) if idx < len(cells) else ''

        two = parse_co_att(c(4))
        three = parse_co_att(c(6))
        fg = parse_co_att(c(8))
        ft = parse_co_att(c(10))

        rows.append({
            'opponent': opponent,
            'score': score_label,
            'match_url': match_url,
            'kalk_match_id': extract_match_id_from_url(match_url or ''),
            'min': c(2),
            'pts': parse_int_cell(c(3)),
            'two_pt': c(4),
            'two_pct': c(5),
            'three_pt': c(6),
            'three_pct': c(7),
            'fg': c(8),
            'fg_pct': c(9),
            'ft': c(10),
            'ft_pct': c(11),
            'orb': parse_int_cell(c(12)),
            'drb': parse_int_cell(c(13)),
            'reb': parse_int_cell(c(14)),
            'ast': parse_int_cell(c(15)),
            'pf': parse_int_cell(c(16)),
            'tov': parse_int_cell(c(17)),
            'stl': parse_int_cell(c(18)),
            'blk': parse_int_cell(c(19)),
            'plus_minus': parse_int_cell(c(20)),
            'eval': parse_int_cell(c(21)),
            'fgm': fg['made'],
            'fga': fg['att'],
            'ftm': ft['made'],
            'fta': ft['att'],
            'three_pm': three['made'],
            'three_pa': three['att'],
            'player_name': player_name,
        })
    return rows


def extract_violations(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    table = soup.find('table')
    if not table:
        return []
    results = []
    for row in table.find_all('tr'):
        if row.find('th'):
            continue
        cells = [c.get_text(strip=True) for c in row.find_all('td')]
        if len(cells) < 3:
            continue
        results.append({
            'lastName': cells[0],
            'firstName': cells[1],
            'technicalFouls': cells[2:] if len(cells) > 2 else [],
        })
    return results
