"""Terminarz ligi: fazy (`schedule-stage-panel`) › kolejki (`schedule-round-group`) › mecze."""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup, Tag

from .common import ParseError, iso_from_epoch, match_id_from_url, match_url, own_text, text, to_int

RECORD_RE = re.compile(r'Bilans przed meczem:\s*(\d+\s*[–-]\s*\d+)')


def _stage_labels(soup: BeautifulSoup) -> dict[str, str]:
    labels = {}
    for option in soup.select('option[data-default-round]'):
        value = (option.get('value') or '').strip()
        if value:
            labels[value] = text(option)
    return labels


def _round_label(group: Tag) -> str:
    heading = group.select_one('header.schedule-round-heading h3') or group.find(['h3', 'h2'])
    label = own_text(heading)
    if not label:
        raise ParseError('Kolejka KALK bez nazwy')
    return label


def _round_number(label: str) -> Optional[int]:
    numbers = re.findall(r'\d+', label)
    return int(numbers[-1]) if numbers else None


def _record(side: Optional[Tag]) -> Optional[str]:
    small = side.select_one('.schedule-game-team-copy small') if side else None
    match = RECORD_RE.search(text(small)) if small else None
    return re.sub(r'\s*[–-]\s*', '–', match.group(1)) if match else None


def parse_game(article: Tag, stage: dict, round_info: dict) -> dict:
    link = article.select_one('a.schedule-game-overlay[href]')
    match_id = match_id_from_url(link['href']) if link else None
    home_side = article.select_one('.schedule-game-home')
    away_side = article.select_one('.schedule-game-away')
    home = text(home_side.select_one('.schedule-game-team-copy strong')) if home_side else ''
    away = text(away_side.select_one('.schedule-game-team-copy strong')) if away_side else ''
    home_id = (article.get('data-home-team') or '').strip()
    away_id = (article.get('data-away-team') or '').strip()
    if not match_id or not home or not away or not home_id.isdigit() or not away_id.isdigit():
        raise ParseError('Niepełny wpis w terminarzu KALK')
    starts = iso_from_epoch(article.get('data-game-date'))
    if starts is None:
        raise ParseError(f'Mecz KALK {match_id} bez daty (data-game-date)')
    result = article.select_one('.schedule-game-result.is-finished')
    score_home = score_away = None
    if result is not None:
        scores = result.find_all('b')
        if len(scores) != 2:
            raise ParseError(f'Niepełny wynik meczu KALK {match_id}')
        score_home, score_away = to_int(text(scores[0])), to_int(text(scores[1]))
    venue = text(article.select_one('.schedule-game-date small')) or None
    return {
        'kalkMatchId': match_id,
        'url': match_url(match_id),
        'stageId': stage['id'],
        'stageLabel': stage['label'],
        'roundId': round_info['id'],
        'roundLabel': round_info['label'],
        'roundNumber': round_info['number'],
        'startsAtUtc': starts,
        'venue': venue,
        'homeTeamKalkId': home_id,
        'homeTeam': home,
        'guestTeamKalkId': away_id,
        'guestTeam': away,
        'scoreHome': score_home,
        'scoreAway': score_away,
        'isFinished': result is not None,
        'homeRecordBefore': _record(home_side),
        'guestRecordBefore': _record(away_side),
    }


def parse_schedule(soup: BeautifulSoup) -> list[dict]:
    labels = _stage_labels(soup)
    panels = soup.select('div.schedule-stage-panel[data-stage-id]')
    if not panels:
        raise ParseError('Brak faz w terminarzu KALK')
    games = []
    for panel in panels:
        stage_id = panel['data-stage-id'].strip()
        if not stage_id.isdigit():
            raise ParseError(f'Niepoprawne ID fazy KALK: {stage_id!r}')
        stage = {'id': int(stage_id), 'label': labels.get(stage_id)}
        for group in panel.select('section.schedule-round-group[data-round-id]'):
            round_id = group['data-round-id'].strip()
            if not round_id.isdigit():
                raise ParseError(f'Niepoprawne ID kolejki KALK: {round_id!r}')
            label = _round_label(group)
            round_info = {'id': int(round_id), 'label': label, 'number': _round_number(label)}
            for article in group.select('article.schedule-game'):
                games.append(parse_game(article, stage, round_info))
    if not games:
        raise ParseError('Brak meczów w terminarzu KALK')
    if len({g['kalkMatchId'] for g in games}) != len(games):
        raise ParseError('Duplikaty identyfikatorów meczów w terminarzu KALK')
    return games
