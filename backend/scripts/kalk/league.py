"""Strony ligi: tabela, katalog drużyn, katalog zawodników."""

from __future__ import annotations

from bs4 import BeautifulSoup

from .common import (ParseError, fold, image_url, player_slug_from_url, player_url, team_from_url,
                     team_url, text, to_int)


def parse_standings(soup: BeautifulSoup) -> list[dict]:
    body = soup.select_one('table.standings tbody')
    if body is None:
        raise ParseError('Brak tabeli ligowej KALK')
    rows = []
    for tr in body.find_all('tr', recursive=False):
        cells = tr.find_all('td', recursive=False)
        if len(cells) < 9:
            raise ParseError('Niepełny wiersz tabeli ligowej KALK')
        link = cells[1].select_one('a[href]')
        team = team_from_url(link['href']) if link else None
        name = text(cells[1].select_one('.standings-team-name')) or text(cells[1])
        if not team or not name:
            raise ParseError('Wiersz tabeli KALK bez drużyny')
        form = [text(b) for b in cells[9].select('.form-badge')] if len(cells) > 9 else []
        streak = text(cells[10]) if len(cells) > 10 else ''
        rows.append({
            'position': to_int(text(cells[0])),
            'teamKalkId': team[0],
            'name': name,
            'logoUrl': image_url(cells[1].select_one('img')),
            'matches': to_int(text(cells[2])),
            'wins': to_int(text(cells[3])),
            'losses': to_int(text(cells[4])),
            'pointsFor': to_int(text(cells[5])),
            'pointsAgainst': to_int(text(cells[6])),
            'points': to_int(text(cells[8])),
            'form': [f for f in form if f],
            'streak': streak if streak and streak not in ('—', '-') else None,
        })
    if not rows:
        raise ParseError('Pusta tabela ligowa KALK')
    if len({r['teamKalkId'] for r in rows}) != len(rows):
        raise ParseError('Tabela KALK zawiera duplikaty drużyn')
    if [r['position'] for r in rows] != list(range(1, len(rows) + 1)):
        raise ParseError('Tabela KALK ma nieciągłą numerację miejsc')
    return rows


def parse_teams(soup: BeautifulSoup) -> list[dict]:
    teams = []
    for card in soup.select('article.league-team-card'):
        link = card.select_one('a.league-team-main[href]')
        team = team_from_url(link['href']) if link else None
        name = text(link.select_one('strong')) if link else ''
        if not team or not name:
            raise ParseError('Niepełna karta drużyny KALK')
        team_id, slug = team
        teams.append({
            'id': team_id,
            'slug': slug,
            'name': name,
            'profileUrl': team_url(team_id, slug),
            'logoUrl': image_url(card.select_one('img')),
            'playerSlugs': [],
        })
    if not teams:
        raise ParseError('Pusty katalog drużyn KALK')
    if len({t['id'] for t in teams}) != len(teams):
        raise ParseError('Katalog drużyn KALK ma duplikaty')
    return teams


def parse_player_directory(soup: BeautifulSoup) -> list[dict]:
    """Karty `a.players-directory-card`; drużyna tylko po nazwie (mapowana na ID w pipeline)."""
    players = []
    for card in soup.select('a.players-directory-card[href]'):
        slug = player_slug_from_url(card['href'])
        name = (card.get('data-player-name') or '').strip() or text(card.select_one('strong'))
        team_name = text(card.select_one('small'))
        if not slug or not name:
            raise ParseError('Niepełna karta zawodnika KALK')
        players.append({
            'slug': slug,
            'fullName': name,
            'teamName': team_name or None,
            'position': (card.get('data-player-position') or '').strip() or None,
            'profileUrl': player_url(slug),
        })
    if len({p['slug'] for p in players}) != len(players):
        raise ParseError('Katalog zawodników KALK ma duplikaty')
    return players


def team_id_by_name(teams: list[dict], name: str):
    key = fold(name)
    for team in teams:
        if fold(team['name']) == key:
            return team['id']
    return None


def team_slugs(*soups: BeautifulSoup) -> dict[str, str]:
    """ID drużyny → slug z linków `/druzyna/{id}/{slug}` na stronach ligi."""
    slugs: dict[str, str] = {}
    for soup in soups:
        for link in soup.select('a[href*="/druzyna/"]'):
            team = team_from_url(link['href'])
            if team and team[1]:
                slugs.setdefault(team[0], team[1])
    return slugs
