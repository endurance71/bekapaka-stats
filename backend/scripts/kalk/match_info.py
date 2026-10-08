"""Strona `/mecz/{id}/info`: meta, kwarty, przebieg co 5 min, liderzy, MVP, obsada, źródła punktów."""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup, Tag

from .common import (ParseError, fold, iso_from_datetime_attr, own_text, path_parts, player_slug_from_url,
                     score_pair, team_from_url, text, to_int)

LEADER_TABS = {'eval': 'eval', 'points': 'pts', 'rebounds': 'reb', 'assists': 'ast'}
POINT_SOURCES = {
    'punkty po stratach': 'ptsOffTurnovers',
    'punkty z pomalowanego': 'ptsInPaint',
    'punkty drugiej szansy': 'secondChancePts',
    'punkty z szybkiego ataku': 'fastBreakPts',
}


def parse_header(soup: BeautifulSoup) -> dict:
    """Wspólny nagłówek stron meczu (info/statystyki/akcja-po-akcji)."""
    home = soup.select_one('.game-center-scoreboard a.game-center-team.home')
    away = soup.select_one('.game-center-scoreboard a.game-center-team.away')
    if home is None or away is None:
        raise ParseError('Brak drużyn w nagłówku meczu KALK')
    teams = []
    for node in (home, away):
        team = team_from_url(node.get('href') or '')
        name = text(node.select_one('strong'))
        if not team or not name:
            raise ParseError('Niepełna drużyna w nagłówku meczu KALK')
        teams.append({'teamKalkId': team[0], 'name': name})
    pair = soup.select_one('.game-score-pair')
    scores = [text(b) for b in pair.find_all('b', recursive=False)] if pair else []
    score = (to_int(scores[0]), to_int(scores[1])) if len(scores) == 2 and all(scores) else None
    meta = soup.select_one('.game-center-meta-primary')
    spans = [text(s) for s in meta.find_all('span', recursive=False)] if meta else []
    time_node = meta.find('time') if meta else None
    place = soup.select_one('.game-center-meta-place')
    return {
        'home': teams[0],
        'away': teams[1],
        'score': score,
        'competition': text(meta.find('strong')) if meta else None,
        'stageLabel': spans[0] if len(spans) > 0 else None,
        'roundLabel': spans[1] if len(spans) > 1 else None,
        'startsAtUtc': iso_from_datetime_attr(time_node.get('datetime')) if time_node else None,
        'venue': text(place.find('strong')) or None if place else None,
        'city': text(place.find('span')) or None if place else None,
        'sections': _sections(soup),
    }


def _sections(soup: BeautifulSoup) -> list[str]:
    result = []
    for link in soup.select('nav.game-section-nav a[href]'):
        parts = path_parts(link['href'])
        if len(parts) >= 3 and parts[0] == 'mecz':
            result.append(parts[2])
        elif len(parts) == 2 and parts[0] == 'mecz':
            result.append('info')
    return result


def _period_number(label: str, index: int) -> int:
    lowered = fold(label)
    if re.search(r'\b(ot|dog|dogrywka)\b', lowered):
        numbers = re.findall(r'\d+', lowered)
        return 4 + (int(numbers[0]) if numbers else 1)
    return index


def parse_quarters(soup: BeautifulSoup) -> list[dict]:
    quarters = []
    spans = soup.select('.game-period-scoreline > span')
    for index, span in enumerate(spans, start=1):
        label = text(span.find('small'))
        value = text(span.find('b'))
        if not value:
            continue
        home, away = score_pair(value)
        period = _period_number(label, index)
        quarters.append({
            'period': period,
            'label': label if period <= 4 else f'OT {period - 4}',
            'home': home,
            'away': away,
        })
    if quarters and [q['period'] for q in quarters] != list(range(1, len(quarters) + 1)):
        raise ParseError('Niespójna numeracja kwart KALK')
    return quarters


def parse_flow5(soup: BeautifulSoup) -> list[dict]:
    flow = []
    for point in soup.select('.game-flow-point'):
        minute_text = text(point.find('span'))
        minute = re.search(r'\d+', minute_text)
        if not minute:
            continue
        value = text(point.find('strong'))
        home = away = None
        if value:
            home, away = score_pair(value)
        flow.append({'minute': int(minute.group(0)), 'home': home, 'away': away})
    return flow


def _leader_entry(entry: Tag, team_ids: dict[str, str]) -> dict:
    name = text(entry.select_one('.game-leader-copy strong'))
    team_name = text(entry.select_one('.game-leader-copy small'))
    value_node = entry.find('b', recursive=False)
    return {
        'slug': player_slug_from_url(entry.get('href')),
        'name': name,
        'teamKalkId': team_ids.get(fold(team_name)),
        'value': to_int(own_text(value_node), allow_empty=True),
    }


def parse_leaders(soup: BeautifulSoup, team_ids: dict[str, str]) -> dict:
    leaders = {key: [] for key in LEADER_TABS.values()}
    for panel in soup.select('[data-game-leader-panel]'):
        key = LEADER_TABS.get(panel['data-game-leader-panel'])
        if not key:
            continue
        leaders[key] = [_leader_entry(entry, team_ids) for entry in panel.select('a.game-leader-entry')]
    return leaders


def parse_mvp(soup: BeautifulSoup) -> Optional[dict]:
    card = soup.select_one('.game-mvp-card')
    if card is None:
        return None
    number = re.search(r'\d+', own_text(card.find('b', recursive=False)))
    return {
        'slug': player_slug_from_url(card.get('href')),
        'name': text(card.select_one('span strong')),
        'number': int(number.group(0)) if number else None,
        'eval': to_int(own_text(card.find('em', recursive=False)), allow_empty=True),
    }


def parse_officials(soup: BeautifulSoup) -> tuple[list[str], Optional[str]]:
    referees: list[str] = []
    commissioner = None
    for group in soup.select('.game-officials dl > div'):
        label = fold(text(group.find('dt')))
        dd = group.find('dd')
        names = [text(a) for a in dd.find_all('a')] if dd else []
        if not names and dd and text(dd):
            names = [text(dd)]
        if label.startswith('sedzi'):
            referees.extend(n for n in names if n)
        elif label.startswith('komisarz'):
            commissioner = names[0] if names else None
    return referees, commissioner


def parse_points_sources(soup: BeautifulSoup) -> Optional[dict]:
    rows = soup.select('.game-comparison-list > div')
    if not rows:
        return None
    home: dict = {}
    away: dict = {}
    for row in rows:
        key = POINT_SOURCES.get(fold(text(row.find('span'))))
        values = row.find_all('b', recursive=False)
        if not key or len(values) != 2:
            continue
        home[key] = to_int(text(values[0]), allow_empty=True)
        away[key] = to_int(text(values[1]), allow_empty=True)
    if not home:
        return None
    return {'home': home, 'away': away}


def has_play_by_play(soup: BeautifulSoup, header: dict) -> bool:
    """Wykres „Zmiana wyniku” / mapa rzutów pojawiają się tylko, gdy mecz ma log akcja-po-akcji."""
    return soup.select_one('.game-score-chart') is not None or 'rzuty' in header['sections']


def parse_match_info(soup: BeautifulSoup) -> dict:
    header = parse_header(soup)
    team_ids = {fold(header['home']['name']): header['home']['teamKalkId'],
                fold(header['away']['name']): header['away']['teamKalkId']}
    quarters = parse_quarters(soup)
    referees, commissioner = parse_officials(soup)
    info = {
        'stageLabel': header['stageLabel'],
        'roundLabel': header['roundLabel'],
        'startsAtUtc': header['startsAtUtc'],
        'venue': header['venue'],
        'city': header['city'],
        'quarters': quarters,
        'overtimes': max(0, len(quarters) - 4),
        'flow5': parse_flow5(soup),
        'leaders': parse_leaders(soup, team_ids),
        'mvp': parse_mvp(soup),
        'referees': referees,
        'commissioner': commissioner,
        'pointsSources': parse_points_sources(soup),
    }
    return {'header': header, 'info': info, 'hasPlayByPlay': has_play_by_play(soup, header)}
