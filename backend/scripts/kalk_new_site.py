"""Parser nowej witryny KALK (od sezonu 2026/2027), bez zapisu do bazy.

Wszystkie adresy pobiera przekazany fetcher Scrapling. Nie zwracamy częściowego
wyniku: zmiana struktury strony lub błąd któregokolwiek żądania przerywa import.
"""

from __future__ import annotations

import re
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag


BASE = 'https://www.kalk-koszalin.com/'
LEAGUE = 'liga/dywizja-ii/'
SUPPORTED_SEASONS = {'2026-2027': '50'}


def _text(node: Tag | None) -> str:
    return node.get_text(' ', strip=True) if node else ''


def _number(value: str) -> float:
    try:
        return float(value.replace('%', '').replace(',', '.').replace('−', '-').strip())
    except ValueError as exc:
        raise ValueError(f'Niepoprawna liczba KALK: {value!r}') from exc


def _integer(value: str) -> int:
    number = _number(value)
    if not number.is_integer():
        raise ValueError(f'Oczekiwano liczby całkowitej KALK: {value!r}')
    return int(number)


def _path_id(url: str, kind: str) -> str:
    parts = urlparse(url).path.strip('/').split('/')
    if kind == 'mecz' and len(parts) >= 2 and parts[0] == 'mecz' and parts[1].isdigit():
        return parts[1]
    if kind == 'druzyna' and len(parts) >= 3 and parts[0] == 'druzyna' and parts[1].isdigit():
        return parts[1]
    if kind == 'zawodnik' and len(parts) >= 2 and parts[0] == 'zawodnik' and parts[1]:
        return parts[1]
    raise ValueError(f'Nieznany adres {kind} KALK: {url}')


def parse_table(soup: BeautifulSoup) -> list[dict]:
    table = soup.select_one('table.standings tbody')
    if table is None:
        raise ValueError('Brak tabeli ligowej nowej witryny KALK')
    results = []
    for row in table.select('tr'):
        cells = row.find_all('td', recursive=False)
        if len(cells) < 9:
            raise ValueError('Niepełny wiersz tabeli ligowej KALK')
        name = _text(cells[1].select_one('.standings-team-name')) or _text(cells[1])
        if not name:
            raise ValueError('Pusta nazwa drużyny w tabeli KALK')
        results.append({
            'position': _integer(_text(cells[0])),
            'name': name,
            'matches': _integer(_text(cells[2])),
            'wins': _integer(_text(cells[3])),
            'losses': _integer(_text(cells[4])),
            'pointsFor': _integer(_text(cells[5])),
            'pointsAgainst': _integer(_text(cells[6])),
            'points': _integer(_text(cells[8])),
        })
    if not results or len({row['name'].casefold() for row in results}) != len(results):
        raise ValueError('Tabela KALK jest pusta lub zawiera duplikaty drużyn')
    if [row['position'] for row in results] != list(range(1, len(results) + 1)):
        raise ValueError('Tabela KALK ma nieciągłą lub nieuporządkowaną numerację miejsc')
    return results


def parse_schedule(soup: BeautifulSoup, source_url: str) -> list[dict]:
    articles = soup.select('article.schedule-game')
    if not articles:
        raise ValueError('Brak meczów w terminarzu nowej witryny KALK')
    matches = []
    for article in articles:
        link = article.select_one('a.schedule-game-overlay[href]')
        home = _text(article.select_one('.schedule-game-home strong'))
        away = _text(article.select_one('.schedule-game-away strong'))
        date = _text(article.select_one('.schedule-game-date b'))
        hour = _text(article.select_one('.schedule-game-date strong'))
        if not link or not home or not away or not re.fullmatch(r'\d{2}\.\d{2}\.\d{4}', date) or not re.fullmatch(r'\d{2}:\d{2}', hour):
            raise ValueError('Niepełny wpis w terminarzu KALK')
        url = urljoin(BASE, link['href'])
        match_id = _path_id(url, 'mecz')
        result = article.select_one('.schedule-game-result.is-finished')
        scores = result.find_all('b') if result else []
        if result and len(scores) != 2:
            raise ValueError(f'Niepełny wynik meczu KALK {match_id}')
        round_label = _text(article.select_one('.schedule-game-topline b'))
        matches.append({
            'date': f'{date} {hour}',
            'homeTeam': home,
            'guestTeam': away,
            'scoreHome': _integer(_text(scores[0])) if scores else None,
            'scoreAway': _integer(_text(scores[1])) if scores else None,
            'isFinished': bool(scores),
            'roundUrl': source_url,
            'roundCode': round_label,
            'meczUrl': url,
            'meczId': match_id,
            'homeTeamId': article.get('data-home-team'),
            'guestTeamId': article.get('data-away-team'),
        })
    if len({m['meczId'] for m in matches}) != len(matches):
        raise ValueError('Duplikaty identyfikatorów meczów w terminarzu KALK')
    return matches


def parse_teams(soup: BeautifulSoup) -> list[dict]:
    results = []
    for article in soup.select('article.league-team-card'):
        link = article.select_one('a.league-team-main[href]')
        if not link:
            raise ValueError('Brak profilu drużyny w katalogu KALK')
        url = urljoin(BASE, link['href'])
        parts = urlparse(url).path.strip('/').split('/')
        name = _text(link.select_one('strong'))
        if not name or len(parts) < 3:
            raise ValueError('Niepełny profil drużyny KALK')
        results.append({'id': _path_id(url, 'druzyna'), 'slug': parts[2], 'name': name, 'profile_url': url})
    if not results or len({t['id'] for t in results}) != len(results):
        raise ValueError('Katalog drużyn KALK jest pusty lub ma duplikaty')
    return results


def parse_players(soup: BeautifulSoup) -> list[dict]:
    results = []
    for card in soup.select('a.players-directory-card[href]'):
        url = urljoin(BASE, card['href'])
        name = card.get('data-player-name') or _text(card.select_one('strong'))
        team = _text(card.select_one('small'))
        if not name or not team:
            raise ValueError('Niepełna karta zawodnika KALK')
        results.append({
            'id_zawodnika': _path_id(url, 'zawodnik'),
            'imie_nazwisko': name,
            'druzyna': team,
            'profile_url': url,
            'mecze_rozegrane': 0,
            'punkty_suma': 0,
            'srednia_punktow': 0,
        })
    if not results or len({p['id_zawodnika'] for p in results}) != len(results):
        raise ValueError('Katalog zawodników KALK jest pusty lub ma duplikaty')
    return results


def add_player_statistics(player: dict, soup: BeautifulSoup, season: str) -> None:
    year = season.replace('-', '/')
    table = soup.select_one('table.player-statistics-table')
    if not table:
        raise ValueError(f'Brak statystyk zawodnika {player["id_zawodnika"]}')
    for row in table.select('tbody tr'):
        cells = row.find_all('td', recursive=False)
        if len(cells) < 20 or year not in _text(cells[0]) or 'Dywizja II' not in _text(cells[0]):
            continue
        def pair(index: int) -> tuple[float, float]:
            values = list(cells[index].stripped_strings)
            if len(values) < 2:
                raise ValueError(f'Niepełne statystyki zawodnika {player["id_zawodnika"]}')
            return _number(values[0]), _number(values[1])

        player['mecze_rozegrane'] = _integer(_text(cells[1]))
        player['srednia_punktow'], player['punkty_suma'] = pair(3)
        player['zbiorki_srednia'], player['zbiorki_suma'] = pair(12)
        player['asysty_srednia'], player['asysty_suma'] = pair(13)
        player['prz_srednia'], player['prz_suma'] = pair(14)
        player['str_srednia'], player['str_suma'] = pair(15)
        player['bl_srednia'], player['bl_suma'] = pair(16)
        player['eval_srednia'], player['eval_suma'] = pair(19)
        return
    # Zawodnik może być w katalogu przed rozegraniem pierwszego meczu.


def _co_att(value: str) -> tuple[int, int]:
    parts = value.split('/')
    if len(parts) != 2:
        raise ValueError(f'Niepoprawny zapis rzutów KALK: {value!r}')
    return _integer(parts[0]), _integer(parts[1])


def parse_box_score(soup: BeautifulSoup, schedule: dict) -> dict:
    sections = soup.select('section.game-boxscore')
    if len(sections) != 2:
        raise ValueError(f'Nie znaleziono dwóch tabel box score dla meczu {schedule["meczId"]}')
    teams = []
    for section in sections:
        name = _text(section.select_one('h2'))
        table = section.select_one('table.game-stats-table')
        if not name or not table:
            raise ValueError(f'Niepełny box score meczu {schedule["meczId"]}')
        players = []
        for row in table.select('tbody tr'):
            cells = row.find_all('td', recursive=False)
            if len(cells) < 24:
                continue  # wiersz sum lub separator
            link = cells[1].find('a', href=True)
            two = _co_att(_text(cells[4]))
            three = _co_att(_text(cells[6]))
            fg = _co_att(_text(cells[8]))
            ft = _co_att(_text(cells[10]))
            players.append({
                'name': _text(link).replace(' *', '').strip() if link else _text(cells[1]).replace(' *', '').strip(),
                'profile_url': urljoin(BASE, link['href']) if link else None,
                'kalkPlayerNumericId': None,
                'number': _integer(_text(cells[0])),
                'starter': '*' in _text(cells[1]),
                'min': _text(cells[2]),
                'pts': _integer(_text(cells[3])),
                'two_pm': two[0], 'two_pa': two[1],
                'three_pm': three[0], 'three_pa': three[1],
                'fgm': fg[0], 'fga': fg[1],
                'ftm': ft[0], 'fta': ft[1],
                'orb': _integer(_text(cells[12])),
                'drb': _integer(_text(cells[13])),
                'reb': _integer(_text(cells[14])),
                'ast': _integer(_text(cells[15])),
                'stl': _integer(_text(cells[16])),
                'tov': _integer(_text(cells[17])),
                'pf': _integer(_text(cells[18])),
                'pfDrawn': _integer(_text(cells[19])),
                'blk': _integer(_text(cells[20])),
                'eval': _integer(_text(cells[22])),
                'plusMinus': _integer(_text(cells[23])),
            })
        if not players:
            raise ValueError(f'Pusta tabela zawodników meczu {schedule["meczId"]}')
        teams.append({'name': name, 'players': players, 'isBekapaka': 'bekapaka' in name.casefold()})
    if [t['name'].casefold() for t in teams] != [schedule['homeTeam'].casefold(), schedule['guestTeam'].casefold()]:
        raise ValueError(f'Drużyny box score nie zgadzają się z terminarzem meczu {schedule["meczId"]}')
    teams[0]['pts'] = schedule['scoreHome']
    teams[1]['pts'] = schedule['scoreAway']
    if any(sum(player['pts'] for player in team['players']) != team['pts'] for team in teams):
        raise ValueError(f'Suma punktów zawodników nie zgadza się z wynikiem meczu {schedule["meczId"]}')
    date = datetime.strptime(schedule['date'], '%d.%m.%Y %H:%M').strftime('%Y-%m-%dT%H:%M:00')
    return {
        'id': schedule['meczId'],
        'slug': None,
        'match_url': schedule['meczUrl'],
        'homeTeamId': schedule.get('homeTeamId'),
        'guestTeamId': schedule.get('guestTeamId'),
        'homeTeamName': schedule['homeTeam'],
        'guestTeamName': schedule['guestTeam'],
        'scoreHome': schedule['scoreHome'],
        'scoreAway': schedule['scoreAway'],
        'isFinished': True,
        'boxScore': {'teams': teams, 'meta': {}},
        'roundCode': schedule.get('roundCode'),
        'roundUrl': schedule.get('roundUrl'),
        'date': date,
    }


def add_quarters(match: dict, soup: BeautifulSoup) -> None:
    rows = soup.select('.game-period-progress-row')
    if not rows:
        return
    quarters = []
    previous_home = previous_away = 0
    for index, row in enumerate(rows, start=1):
        scores = row.find_all('b')
        if len(scores) != 2:
            raise ValueError(f'Niepełne wyniki kwart meczu {match["id"]}')
        home = _integer(_text(scores[0]))
        away = _integer(_text(scores[1]))
        if home < previous_home or away < previous_away:
            raise ValueError(f'Niespójne wyniki kwart meczu {match["id"]}')
        quarters.append({'label': f'Q{index}', 'home': home - previous_home, 'away': away - previous_away})
        previous_home, previous_away = home, away
    if (previous_home, previous_away) != (match['scoreHome'], match['scoreAway']):
        raise ValueError(f'Wynik kwart nie zgadza się z wynikiem meczu {match["id"]}')
    match['boxScore']['quarters'] = quarters
    match['boxScore']['meta']['quarters'] = quarters


def parse_game_logs(soup: BeautifulSoup, player: dict) -> list[dict]:
    results = []
    for article in soup.select('article.player-game-row'):
        link = article.select_one('a.player-game-main[href]')
        if not link:
            raise ValueError(f'Brak odnośnika meczu w logu {player["id_zawodnika"]}')
        url = urljoin(BASE, link['href'])
        stats = {_text(span.select_one('small')).upper(): _text(span.select_one('b')) for span in article.select('.player-game-stats span')}
        score = _text(article.select_one('.player-game-score'))
        values = re.findall(r'\d+', score)
        if len(values) != 2:
            raise ValueError(f'Niepełny wynik w logu {player["id_zawodnika"]}')
        home, away = int(values[0]), int(values[1])
        outcome = article.select_one('.player-game-outcome')
        if outcome and (('is-win' in outcome.get('class', [])) != (home > away)):
            home, away = away, home
        two = _co_att(stats.get('2P', '0/0'))
        three = _co_att(stats.get('3P', '0/0'))
        ft = _co_att(stats.get('1P', '0/0'))
        results.append({
            'opponent': _text(article.select_one('.player-game-opponent strong')),
            'score': f'{home}:{away}',
            'match_url': url,
            'kalk_match_id': _path_id(url, 'mecz'),
            'id_zawodnika': player['id_zawodnika'],
            'kalk_player_id': player['id_zawodnika'],
            'player_name': player['imie_nazwisko'],
            'team_name': player['druzyna'],
            'min': stats.get('MIN', ''),
            'pts': _integer(stats.get('PKT', '0')),
            'two_pt': stats.get('2P', '0/0'),
            'three_pt': stats.get('3P', '0/0'),
            'fg': f'{two[0] + three[0]}/{two[1] + three[1]}',
            'ft': stats.get('1P', '0/0'),
            'two_pm': two[0], 'two_pa': two[1],
            'three_pm': three[0], 'three_pa': three[1],
            'fgm': two[0] + three[0], 'fga': two[1] + three[1],
            'ftm': ft[0], 'fta': ft[1],
            'orb': _integer(stats.get('ZB A', '0')),
            'drb': _integer(stats.get('ZB O', '0')),
            'reb': _integer(stats.get('ZB', '0')),
            'ast': _integer(stats.get('AST', '0')),
            'stl': _integer(stats.get('PRZ', '0')),
            'tov': _integer(stats.get('STR', '0')),
            'blk': _integer(stats.get('BLK', '0')),
            'pf': _integer(stats.get('F', '0')),
            'eval': _integer(stats.get('EVAL', '0')),
            'plus_minus': _integer(stats.get('+/-', '0')),
        })
    return results


def scrape_new_site(season: str, fetch_soup) -> dict:
    season_number = SUPPORTED_SEASONS.get(season)
    if not season_number:
        raise ValueError(f'Nowa witryna KALK: nieobsługiwany sezon {season}')
    def section(name: str) -> tuple[str, BeautifulSoup]:
        url = urljoin(BASE, LEAGUE + name + f'?sezon={season_number}')
        return url, fetch_soup(url)

    _, table_soup = section('tabela')
    schedule_url, schedule_soup = section('terminarz')
    _, players_soup = section('zawodnicy')
    _, teams_soup = section('zespoly')
    season_label = season.replace('-', '/')
    for name, page in (('tabela', table_soup), ('terminarz', schedule_soup),
                       ('zawodnicy', players_soup), ('zespoly', teams_soup)):
        if season_label not in _text(page.title):
            raise ValueError(f'Strona {name} KALK nie potwierdza sezonu {season_label}')
    table = parse_table(table_soup)
    schedule = parse_schedule(schedule_soup, schedule_url)
    players = parse_players(players_soup)
    teams = parse_teams(teams_soup)
    if len(table) != len(teams):
        raise ValueError('Liczba drużyn w tabeli i katalogu KALK jest różna')
    for player in players:
        stats_url = player['profile_url'].split('?')[0].rstrip('/') + f'/statystyki?sezon={season_number}'
        add_player_statistics(player, fetch_soup(stats_url), season)
    for team in teams:
        team['playerIds'] = [p['id_zawodnika'] for p in players if p['druzyna'].casefold() == team['name'].casefold()]

    matches = []
    for game in schedule:
        if not game['isFinished']:
            continue
        stats_url = game['meczUrl'].rstrip('/') + '/statystyki'
        match = parse_box_score(fetch_soup(stats_url), game)
        add_quarters(match, fetch_soup(game['meczUrl']))
        matches.append(match)

    logs = []
    for player in players:
        if 'bekapaka' not in player['druzyna'].casefold():
            continue
        log_url = player['profile_url'].split('?')[0].rstrip('/') + f'/mecz-po-meczu?sezon={season_number}'
        logs.extend(parse_game_logs(fetch_soup(log_url), player))

    return {
        'version': 2,
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'scrapeManifest': {
            'parserVersion': '3.0.0-new-site',
            'sourceSite': 'kalk-2026-redesign',
            'seasonSlug': season,
            'matchesScraped': len(matches),
            'playersCount': len(players),
            'teamsCount': len(teams),
            'playerGameLogRows': len(logs),
        },
        'statCategories': ['points', 'rebounds', 'assists', 'steals', 'turnovers', 'blocks', 'eval'],
        'table': table,
        'playout_table': [],
        'schedule': schedule,
        'players': players,
        'teams': teams,
        'matches': matches,
        'violations': [],
        'playerGameLogs': logs,
    }
