"""Strona `/mecz/{id}/akcja-po-akcji`: klasyfikacja zdarzeń, zegar, wynik narastająco, zbiórki O/D."""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup, Tag

from .common import ParseError, clock_seconds, fold, period_length, period_offset, score_pair, text, to_int
from .resolve import NameResolver

SHOT_RE = re.compile(r'^(Celny|Niecelny|Zablokowany) rzut za ([23])$')
FT_RE = re.compile(r'^(Celny|Niecelny) rzut wolny$')
PLAYER_NUM_RE = re.compile(r'^(?P<name>.+?)\s*\(#(?P<num>-?\d+)\)$')
SUB_RE = re.compile(r'^Zmiana:\s*(?P<out>.+?)\s*→\s*(?P<in>.+)$')
ON_COURT_RE = re.compile(r'^Na boisku:\s*(?P<in>.+)$')
SIMPLE_ACTIONS = {
    'Zbiórka': 'rebound',
    'Asysta': 'assist',
    'Strata': 'turnover',
    'Przechwyt': 'steal',
    'Faul': 'foul',
    'Blok': 'block',
    'Przerwa na żądanie': 'timeout',
    'Początek okresu': 'period_start',
    'Koniec okresu': 'period_end',
}
EMPTY_LOG_MARKER = 'nie zawiera jeszcze zdarzeń'


def _split_player(value: str) -> tuple[Optional[str], Optional[int]]:
    value = value.strip()
    match = PLAYER_NUM_RE.match(value)
    if not match:
        return (value or None), None
    return match.group('name').strip() or None, int(match.group('num'))


def classify(action: str) -> dict:
    """Mapuje tekst akcji KALK na pola kontraktu (bez kontekstu meczu)."""
    action = re.sub(r'\s+', ' ', action or '').strip()
    result = {'actionType': 'unknown', 'shotValue': None, 'made': None, 'blocked': False,
              'subIn': None, 'subInNumber': None, 'subOut': None, 'subOutNumber': None}
    match = SHOT_RE.match(action)
    if match:
        kind, value = match.group(1), int(match.group(2))
        result.update(shotValue=value, made=kind == 'Celny', blocked=kind == 'Zablokowany',
                      actionType={'Celny': 'shot_made', 'Niecelny': 'shot_missed', 'Zablokowany': 'shot_blocked'}[kind])
        return result
    match = FT_RE.match(action)
    if match:
        made = match.group(1) == 'Celny'
        result.update(shotValue=1, made=made, actionType='ft_made' if made else 'ft_missed')
        return result
    if action in SIMPLE_ACTIONS:
        result['actionType'] = SIMPLE_ACTIONS[action]
        return result
    match = SUB_RE.match(action)
    if match:
        out_raw = match.group('out').strip()
        in_name, in_number = _split_player(match.group('in'))
        result.update(actionType='sub', subIn=in_name, subInNumber=in_number)
        if not re.fullmatch(r'#-?\d+', out_raw):  # „#-2” = skład wyjściowy (brak schodzącego)
            out_name, out_number = _split_player(out_raw)
            result.update(subOut=out_name, subOutNumber=out_number)
        return result
    match = ON_COURT_RE.match(action)
    if match:
        in_name, in_number = _split_player(match.group('in'))
        result.update(actionType='on_court', subIn=in_name, subInNumber=in_number)
        return result
    return result


def _period_of(panel: Tag, index: int) -> int:
    key = (panel.get('data-play-panel') or '').lower()
    heading = fold(text(panel.find('h2')))
    numbers = re.findall(r'\d+', key) or re.findall(r'\d+', heading)
    number = int(numbers[0]) if numbers else index
    if any(tag in key for tag in ('overtime', 'ot-', 'dogrywka')) or 'dogrywka' in heading:
        return 4 + number
    return number


def _side_cell(event: Tag) -> tuple[Optional[str], Optional[Tag]]:
    classes = event.get('class') or []
    side = 'home' if 'is-home' in classes else 'away' if 'is-away' in classes else None
    home = event.select_one('.game-play-home')
    away = event.select_one('.game-play-away')
    if side == 'home':
        return side, home
    if side == 'away':
        return side, away
    for cell in (home, away):
        if cell is not None and cell.find('span', recursive=False) is not None:
            return None, cell
    return None, None


def is_empty_log(soup: BeautifulSoup) -> bool:
    return not soup.select('div.game-play-event') and EMPTY_LOG_MARKER in text(soup.select_one('main') or soup)


def parse_pbp(soup: BeautifulSoup, *, resolver: NameResolver, team_ids: dict[str, str]) -> Optional[dict]:
    """Zwraca {'events': [...], 'unresolvedNames': n} albo None, gdy log jest pusty."""
    panels = soup.select('section.game-play-period')
    if not panels:
        if is_empty_log(soup) or soup.select_one('[data-play-by-play]') is None:
            return None
        raise ParseError('Moduł akcja-po-akcji KALK bez okresów')
    events = []
    unresolved = 0
    score = [0, 0]
    last_miss_side: Optional[str] = None
    seq = 0
    for index, panel in enumerate(panels, start=1):
        period = _period_of(panel, index)
        length = period_length(period)
        for node in panel.select('div.game-play-event'):
            side, cell = _side_cell(node)
            if cell is None:
                raise ParseError('Zdarzenie akcja-po-akcji KALK bez treści')
            action_raw = text(cell.find('span', recursive=False))
            strong = cell.find('strong', recursive=False)
            player_name = text(strong) or None
            clock = clock_seconds(text(node.find('time')))
            if clock > length:
                raise ParseError(f'Czas {clock}s poza okresem {period}')
            info = classify(action_raw)
            action_type = info['actionType']
            player_number = info['subInNumber']
            if action_type in ('sub', 'on_court') and info['subIn'] and not player_name:
                player_name = info['subIn']
            slug = None
            if player_name and side:
                slug = resolver.resolve(side, player_name, player_number)
                if slug is None:
                    unresolved += 1
                elif player_number is None:
                    player_number = resolver.number(slug)
            sub_out_slug = None
            if info['subOut'] and side:
                sub_out_slug = resolver.resolve(side, info['subOut'], info['subOutNumber'])
                if sub_out_slug is None:
                    unresolved += 1

            running = cell.select_one('.play-running-score')
            points = info['shotValue'] if info['made'] else 0
            if points and side:
                score[0 if side == 'home' else 1] += points
            if running is not None:
                values = [to_int(text(b)) for b in running.find_all('b')]
                if len(values) != 2:
                    raise ParseError('Niepełny wynik po rzucie w akcja-po-akcji KALK')
                if values != score:
                    raise ParseError(f'Wynik po rzucie {values} ≠ wyliczony {score} (zdarzenie {seq + 1})')

            rebound_type = None
            if action_type == 'rebound':
                if not player_name:
                    rebound_type = 'TEAM'
                elif last_miss_side is not None and side is not None:
                    rebound_type = 'O' if last_miss_side == side else 'D'
                last_miss_side = None
            elif action_type in ('shot_missed', 'shot_blocked', 'ft_missed'):
                last_miss_side = side
            elif action_type in ('shot_made', 'ft_made', 'turnover', 'steal', 'period_start', 'period_end'):
                last_miss_side = None

            seq += 1
            events.append({
                'seq': seq,
                'period': period,
                'clockSec': clock,
                'elapsedSec': period_offset(period) + (length - clock),
                'side': side,
                'teamKalkId': team_ids.get(side) if side else None,
                'playerName': player_name,
                'playerSlug': slug,
                'playerNumber': player_number,
                'actionRaw': action_raw,
                'actionType': action_type,
                'shotValue': info['shotValue'],
                'made': info['made'],
                'blocked': info['blocked'],
                'reboundType': rebound_type,
                'subOutNumber': info['subOutNumber'],
                'subOutSlug': sub_out_slug,
                'scoreHome': score[0],
                'scoreAway': score[1],
                'isScoring': bool(points),
            })
    if not events:
        return None
    return {'events': events, 'unresolvedNames': unresolved}


def header_score(soup: BeautifulSoup) -> Optional[tuple[int, int]]:
    node = soup.select_one('.game-play-score strong')
    if node is None or not text(node):
        return None
    return score_pair(text(node))
