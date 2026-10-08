"""Profil drużyny `/druzyna/{id}/{slug}`: gra od, kapitan, bilans wszech czasów.

Prywatność: pole „Strona WWW” bywa wypełnione numerem telefonu — nie jest odczytywane.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from .common import ParseError, dash_pair, fold, player_slug_from_url, text, to_int

SUMMARY_KEYS = {
    'mecze': 'games',
    'wygrane porazki': 'record',
    'punkty': 'points',
    'kwarty w p': 'quarters',
    'dogrywki': 'overtimes',
    'dogrywki w p': 'overtimeRecord',
}


def _since_date(value: str) -> Optional[str]:
    match = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', value or '')
    if match:
        return datetime(int(match.group(3)), int(match.group(2)), int(match.group(1))).strftime('%Y-%m-%d')
    year = re.search(r'\b(19|20)\d{2}\b', value or '')
    return f'{year.group(0)}-01-01' if year else None


def parse_team_profile(soup: BeautifulSoup, team_id: str, slug: Optional[str]) -> dict:
    name = text(soup.select_one('.team-portal-identity h1') or soup.find('h1'))
    if not name:
        raise ParseError(f'Profil drużyny KALK {team_id} bez nazwy')
    since = captain = None
    for group in soup.select('dl.team-facts > div'):
        label = fold(text(group.find('dt')))
        dd = group.find('dd')
        if label.startswith('gra z nami od'):
            since = _since_date(text(dd))
        elif label.startswith('kapitan'):
            link = dd.find('a', href=True) if dd else None
            captain = player_slug_from_url(link['href']) if link else None
    summary: dict = {}
    for span in soup.select('.team-all-time-summary .team-history-numbers > span'):
        key = SUMMARY_KEYS.get(fold(text(span.find('small'))))
        value = text(span.find('b'))
        if not key or not value or value in ('—', '-'):
            continue
        summary[key] = to_int(value) if key in ('games', 'overtimes') else dash_pair(value)
    record = summary.get('record') or (None, None)
    points = summary.get('points') or (None, None)
    quarters = summary.get('quarters') or (None, None)
    overtime = summary.get('overtimeRecord') or (None, None)
    return {
        'id': team_id,
        'slug': slug,
        'name': name,
        'sinceDate': since,
        'captainSlug': captain,
        'allTimeGames': summary.get('games'),
        'allTimeWins': record[0],
        'allTimeLosses': record[1],
        'allTimePointsFor': points[0],
        'allTimePointsAgainst': points[1],
        'quartersWon': quarters[0],
        'quartersLost': quarters[1],
        'overtimes': summary.get('overtimes'),
        'overtimeWins': overtime[0],
        'overtimeLosses': overtime[1],
    }
