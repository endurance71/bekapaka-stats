"""Parsery i pipeline KALK v2 na prawdziwych stronach (`tests/fixtures/kalk_v2`), bez sieci."""

import collections
import copy
import io
import json
import logging
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import datetime, timezone
from pathlib import Path

from kalk import boxscore, league, match_info, pbp, players, schedule, seasons, teams
from kalk.common import PARSER_VERSION, ParseError, soup_of
from kalk.http import BudgetExceeded, KalkFetchError, KalkHttp
from kalk.pipeline import (Progress, SyncOptions, normalize_sections, output_paths, plan, run_sync,
                           select_matches)
from kalk.resolve import NameResolver
from kalk.validate import box_errors, match_errors, pbp_errors, quarter_errors
import kalk_sync

FIXTURES = Path(__file__).resolve().parent / 'tests' / 'fixtures' / 'kalk_v2'
BASE = 'https://www.kalk-koszalin.com/'

logging.getLogger('kalk').setLevel(logging.CRITICAL)


def fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding='utf-8')


def page(name: str):
    return soup_of(fixture(name))


def side_box(match_id: str) -> dict:
    box = boxscore.parse_boxscore(page(f'mecz-{match_id}-statystyki.html'))
    info = match_info.parse_match_info(page(f'mecz-{match_id}-info.html'))
    for side, team, head in zip(('home', 'away'), box['teams'], (info['header']['home'], info['header']['away'])):
        team['side'] = side
        team['teamKalkId'] = head['teamKalkId']
    return {'box': box, 'info': info}


def parse_4124_pbp():
    data = side_box('4124')
    known = [(e['name'], e['slug']) for entries in data['info']['info']['leaders'].values() for e in entries]
    resolver = NameResolver({'home': data['box']['teams'][0]['players'], 'away': data['box']['teams'][1]['players']},
                            known)
    result = pbp.parse_pbp(page('mecz-4124-akcja-po-akcji.html'), resolver=resolver,
                           team_ids={'home': '138', 'away': '148'})
    return data, result


# Strony sezonu 2026/27 (katalog drużyn z 2025/26 z podmienioną etykietą — fixture jest jeden).
def season_50_pages() -> dict:
    return {
        BASE + 'liga/dywizja-ii/tabela?sezon=50': fixture('tabela-50.html'),
        BASE + 'liga/dywizja-ii/terminarz?sezon=50': fixture('terminarz-50.html'),
        BASE + 'liga/dywizja-ii/zespoly?sezon=50': fixture('zespoly-49.html').replace('2025/2026', '2026/2027'),
        BASE + 'liga/dywizja-ii/zawodnicy?sezon=50': fixture('zawodnicy-50.html'),
        BASE + 'mecz/4124/info': fixture('mecz-4124-info.html'),
        BASE + 'mecz/4124/statystyki': fixture('mecz-4124-statystyki.html'),
        BASE + 'mecz/4124/akcja-po-akcji': fixture('mecz-4124-akcja-po-akcji.html'),
        BASE + 'zawodnik/filip-karpinski/statystyki': fixture('zawodnik-filip-karpinski-statystyki.html'),
        BASE + 'zawodnik/filip-karpinski/profil': fixture('zawodnik-filip-karpinski-profil.html'),
        BASE + 'druzyna/138/bekapaka-bobolice': fixture('druzyna-138.html'),
    }


class FakeSite:
    def __init__(self, pages: dict, status_override: dict | None = None):
        self.pages = pages
        self.status_override = status_override or {}
        self.calls: list[str] = []

    def __call__(self, url: str):
        self.calls.append(url)
        if url in self.status_override:
            return self.status_override[url], ''
        if url in self.pages:
            return 200, self.pages[url]
        return 404, ''


def make_http(**kwargs) -> KalkHttp:
    kwargs.setdefault('rate', 0)
    kwargs.setdefault('sleep', lambda seconds: None)
    return KalkHttp(**kwargs)


def quiet_run(http, opts, output):
    out = io.StringIO()
    with redirect_stdout(out):
        code = run_sync(http, opts, output=output, progress=Progress(stream=out))
    return code, out.getvalue()


class SeasonDiscoveryTests(unittest.TestCase):
    def test_options_and_targets(self):
        options = seasons.parse_season_options(page('tabela-50.html'))
        numbers = {s['kalkNumber']: s for s in options['seasons']}
        self.assertEqual(options['selected'], 50)
        self.assertEqual((numbers[47]['label'], numbers[47]['slug']), ('2023/2024', '2023-2024'))
        self.assertEqual(numbers[50]['slug'], '2026-2027')
        self.assertEqual([s['kalkNumber'] for s in seasons.resolve_targets('all', options)], [47, 48, 49, 50])
        self.assertEqual(seasons.resolve_targets('current', options)[0]['kalkNumber'], 50)
        self.assertEqual(seasons.resolve_targets('2025-2026', options)[0]['kalkNumber'], 49)
        self.assertEqual(seasons.resolve_targets('48', options)[0]['label'], '2024/2025')
        with self.assertRaises(ParseError):
            seasons.resolve_targets('1999-2000', options)

    def test_page_must_confirm_season(self):
        seasons.confirm_page_season(page('tabela-49.html'), '2025/2026', 'tabela')
        with self.assertRaises(ParseError):
            seasons.confirm_page_season(page('tabela-49.html'), '2026/2027', 'tabela')


class LeagueParserTests(unittest.TestCase):
    def test_standings(self):
        rows = league.parse_standings(page('tabela-50.html'))
        self.assertEqual(len(rows), 10)
        self.assertEqual(rows[0], {
            'position': 1, 'teamKalkId': '138', 'name': 'BeKaPaKa Bobolice', 'logoUrl': None, 'matches': 1,
            'wins': 1, 'losses': 0, 'pointsFor': 86, 'pointsAgainst': 20, 'points': 2, 'form': ['W'], 'streak': 'W1'})
        self.assertTrue(rows[1]['logoUrl'].endswith('/storage/legacy/teams/217.jpg'))
        self.assertEqual(len(league.parse_standings(page('tabela-49.html'))), 12)

    def test_teams_and_player_directory(self):
        team_rows = league.parse_teams(page('zespoly-49.html'))
        self.assertEqual(len(team_rows), 12)
        self.assertEqual({k: team_rows[0][k] for k in ('id', 'slug', 'name', 'profileUrl')},
                         {'id': '80', 'slug': '100siopl', 'name': '100SIO.PL',
                          'profileUrl': BASE + 'druzyna/80/100siopl'})
        directory = league.parse_player_directory(page('zawodnicy-50.html'))
        self.assertEqual(len(directory), 104)
        karpinski = next(p for p in directory if p['slug'] == 'filip-karpinski')
        self.assertEqual((karpinski['fullName'], karpinski['teamName']), ('Filip Karpiński', 'BeKaPaKa Bobolice'))


class ScheduleTests(unittest.TestCase):
    def test_stages_rounds_and_epoch(self):
        games = schedule.parse_schedule(page('terminarz-49.html'))
        self.assertEqual(len(games), 94)
        self.assertTrue(all(g['isFinished'] for g in games))
        stages = collections.OrderedDict((g['stageId'], g['stageLabel']) for g in games)
        self.assertEqual(list(stages), [333, 340, 344, 346, 347, 353, 354, 358])
        self.assertEqual(stages[333], 'Sezon zasadniczy')
        self.assertEqual(stages[340], 'Play-off - 1-8')
        self.assertEqual(stages[344], 'Play out')
        first = next(g for g in games if g['kalkMatchId'] == '3836')
        self.assertEqual((first['roundId'], first['roundLabel'], first['roundNumber']), (2138, 'Kolejka 1', 1))
        self.assertEqual(first['startsAtUtc'], '2025-09-21T12:40:00Z')  # 14:40 czasu polskiego
        self.assertEqual((first['homeTeamKalkId'], first['guestTeamKalkId'], first['scoreHome'], first['scoreAway']),
                         ('60', '147', 49, 34))
        self.assertEqual(len(schedule.parse_schedule(page('terminarz-47.html'))), 112)

    def test_current_season_unfinished_games(self):
        games = {g['kalkMatchId']: g for g in schedule.parse_schedule(page('terminarz-50.html'))}
        self.assertEqual(len(games), 13)
        self.assertEqual(sum(g['isFinished'] for g in games.values()), 5)
        game = games['4124']
        self.assertEqual((game['stageId'], game['roundLabel'], game['roundNumber']), (361, 'Kolejka - 3', 3))
        self.assertEqual((game['startsAtUtc'], game['scoreHome'], game['scoreAway']), ('2026-10-04T10:00:00Z', 86, 20))
        upcoming = games['4125']
        self.assertEqual((upcoming['isFinished'], upcoming['scoreHome'], upcoming['venue']), (False, None, 'ZOS - KOSiR'))
        self.assertEqual((upcoming['homeRecordBefore'], upcoming['guestRecordBefore']), ('0–1', '1–0'))


class MatchInfoTests(unittest.TestCase):
    def test_info_4124(self):
        parsed = match_info.parse_match_info(page('mecz-4124-info.html'))
        info = parsed['info']
        self.assertTrue(parsed['hasPlayByPlay'])
        self.assertEqual((info['stageLabel'], info['roundLabel'], info['startsAtUtc']),
                         ('Sezon zasadniczy', 'Kolejka - 3', '2026-10-04T10:00:00Z'))
        self.assertEqual((info['venue'], info['city'], info['overtimes']), ('ZOS - KOSiR', 'Koszalin', 0))
        self.assertEqual(info['quarters'][0], {'period': 1, 'label': 'Kw. 1', 'home': 26, 'away': 4})
        self.assertEqual((sum(q['home'] for q in info['quarters']), sum(q['away'] for q in info['quarters'])), (86, 20))
        self.assertEqual(info['flow5'][-1], {'minute': 40, 'home': 86, 'away': 20})
        self.assertEqual(info['mvp'], {'slug': 'filip-karpinski', 'name': 'Filip Karpiński', 'number': 69, 'eval': 36})
        self.assertEqual(info['leaders']['pts'][1],
                         {'slug': 'michal-stachowski', 'name': 'Michał Stachowski', 'teamKalkId': '148', 'value': 12})
        self.assertEqual(info['pointsSources']['home'],
                         {'ptsOffTurnovers': 26, 'ptsInPaint': 0, 'secondChancePts': 10, 'fastBreakPts': 44})
        self.assertEqual(parsed['header']['home']['teamKalkId'], '138')

    def test_info_historic_3842(self):
        parsed = match_info.parse_match_info(page('mecz-3842-info.html'))
        info = parsed['info']
        self.assertFalse(parsed['hasPlayByPlay'])
        self.assertIsNone(info['pointsSources'])
        self.assertIsNone(info['venue'])
        self.assertEqual(info['referees'], ['Jarosław Król', 'Krzysztof Kiwacz', 'Kacper Tarkowski'])
        self.assertEqual(info['commissioner'], 'Zbigniew Lew')
        self.assertEqual(info['flow5'][0], {'minute': 5, 'home': None, 'away': None})
        self.assertEqual(info['flow5'][1], {'minute': 10, 'home': 18, 'away': 12})


class BoxScoreTests(unittest.TestCase):
    def test_box_4124_rows_and_invariants(self):
        data = side_box('4124')
        home, away = data['box']['teams']
        self.assertEqual((home['name'], away['name']), ('BeKaPaKa Bobolice', 'Kosz-All-In'))
        self.assertEqual(sum(p['starter'] for p in home['players']), 5)
        olearczyk = home['players'][0]
        self.assertEqual({k: olearczyk[k] for k in ('slug', 'name', 'number', 'starter', 'secondsPlayed', 'pts', 'ftm',
                                                    'fta', 'orb', 'drb', 'ast', 'eval')},
                         {'slug': 'dawid-olearczyk-vkro', 'name': 'D. Olearczyk', 'number': 1, 'starter': True,
                          'secondsPlayed': 1432, 'pts': 12, 'ftm': 4, 'fta': 6, 'orb': 3, 'drb': 0, 'ast': 11,
                          'eval': 24})
        mras = next(p for p in home['players'] if p['slug'] == 'lukasz-mras-krgb')
        self.assertEqual(mras['blkAgainst'], 1)
        self.assertEqual((home['totals']['pts'], home['startersPts'], home['benchPts']), (86, 58, 28))
        self.assertEqual(home['totals'], home['footer'] | {'secondsPlayed': home['totals']['secondsPlayed']})
        self.assertEqual(box_errors(data['box'], (86, 20)), [])

    def test_box_3842_historic_invariants(self):
        data = side_box('3842')
        match = {'kalkMatchId': '3842', 'info': data['info']['info'], 'box': data['box'], 'pbp': None}
        self.assertEqual(match_errors(match, (83, 40)), [])
        # Minuty drużyny ≠ 200:00 (194:00) nie są błędem.
        self.assertEqual(data['box']['teams'][1]['totals']['secondsPlayed'], 194 * 60)
        self.assertEqual(data['box']['teams'][0]['players'][0]['plusMinus'], 35)

    def test_invariant_violations_are_reported(self):
        data = side_box('4124')
        broken = copy.deepcopy(data['box'])
        broken['teams'][0]['players'][0]['pts'] += 1
        errors = box_errors(broken, (86, 20))
        self.assertTrue(any('pts ≠ 2·twoPm' in e for e in errors))
        self.assertTrue(any('totals.pts' in e for e in errors))
        self.assertTrue(box_errors(data['box'], (85, 20)))
        quarters = [{'period': i, 'label': f'Kw. {i}', 'home': 10, 'away': 10 + (i == 4)} for i in range(1, 5)]
        self.assertEqual(quarter_errors(quarters, (40, 41)), [])
        overtime = quarters + [{'period': 5, 'label': 'OT 1', 'home': 5, 'away': 2}]
        self.assertTrue(any('bez remisu' in e for e in quarter_errors(overtime, (45, 43))))
        self.assertTrue(quarter_errors(quarters, (40, 40)))


class PlayByPlayTests(unittest.TestCase):
    def test_classify_catalog(self):
        cases = {
            'Celny rzut za 2': ('shot_made', 2, True, False),
            'Niecelny rzut za 3': ('shot_missed', 3, False, False),
            'Zablokowany rzut za 2': ('shot_blocked', 2, False, True),
            'Celny rzut wolny': ('ft_made', 1, True, False),
            'Niecelny rzut wolny': ('ft_missed', 1, False, False),
            'Zbiórka': ('rebound', None, None, False),
            'Asysta': ('assist', None, None, False),
            'Strata': ('turnover', None, None, False),
            'Przechwyt': ('steal', None, None, False),
            'Faul': ('foul', None, None, False),
            'Blok': ('block', None, None, False),
            'Przerwa na żądanie': ('timeout', None, None, False),
            'Początek okresu': ('period_start', None, None, False),
            'Koniec okresu': ('period_end', None, None, False),
        }
        for raw, expected in cases.items():
            info = pbp.classify(raw)
            self.assertEqual((info['actionType'], info['shotValue'], info['made'], info['blocked']), expected, raw)
        start = pbp.classify('Zmiana: #-2 → Dawid Olearczyk (#1)')
        self.assertEqual((start['actionType'], start['subIn'], start['subInNumber'], start['subOut']),
                         ('sub', 'Dawid Olearczyk', 1, None))
        sub = pbp.classify('Zmiana: Dawid Wenta (#9) → Wojciech Marczyk (#3)')
        self.assertEqual((sub['subOut'], sub['subOutNumber'], sub['subIn'], sub['subInNumber']),
                         ('Dawid Wenta', 9, 'Wojciech Marczyk', 3))
        on_court = pbp.classify('Na boisku: Stefan Płaczek (#15)')
        self.assertEqual((on_court['actionType'], on_court['subInNumber']), ('on_court', 15))
        self.assertEqual(pbp.classify('Coś nowego')['actionType'], 'unknown')

    def test_pbp_4124(self):
        data, result = parse_4124_pbp()
        events = result['events']
        self.assertEqual(result['unresolvedNames'], 0)
        self.assertEqual((events[-1]['scoreHome'], events[-1]['scoreAway']), (86, 20))
        self.assertEqual(pbp.header_score(page('mecz-4124-akcja-po-akcji.html')), (86, 20))
        self.assertEqual(pbp_errors(result, (86, 20)), [])
        self.assertNotIn('unknown', {e['actionType'] for e in events})
        self.assertEqual([e['seq'] for e in events], list(range(1, len(events) + 1)))
        scored = collections.Counter()
        for e in events:
            if e['isScoring']:
                scored[e['side']] += e['shotValue']
        self.assertEqual((scored['home'], scored['away']), (86, 20))
        first_shot = next(e for e in events if e['actionType'] == 'shot_made')
        self.assertEqual({k: first_shot[k] for k in ('period', 'clockSec', 'elapsedSec', 'side', 'teamKalkId',
                                                      'playerSlug', 'playerNumber', 'scoreHome', 'scoreAway')},
                         {'period': 1, 'clockSec': 585, 'elapsedSec': 15, 'side': 'home', 'teamKalkId': '138',
                          'playerSlug': 'alan-niwinski-ghld', 'playerNumber': 27, 'scoreHome': 2, 'scoreAway': 0})
        self.assertEqual(max(e['elapsedSec'] for e in events), 2400)
        self.assertEqual({e['period'] for e in events}, {1, 2, 3, 4})
        team_rebounds = [e for e in events if e['actionType'] == 'rebound' and e['playerName'] is None]
        self.assertTrue(team_rebounds and all(e['reboundType'] == 'TEAM' for e in team_rebounds))
        # Zbiórki O/D wyznaczone z kontekstu zgadzają się z box score (ZB A / ZB O) każdego zawodnika.
        rebounds = collections.Counter((e['playerSlug'], e['reboundType']) for e in events if e['actionType'] == 'rebound')
        for team in data['box']['teams']:
            for player in team['players']:
                self.assertEqual((rebounds[(player['slug'], 'O')], rebounds[(player['slug'], 'D')]),
                                 (player['orb'], player['drb']), player['name'])
        sub = next(e for e in events if e['actionType'] == 'sub' and e['subOutNumber'] == 24)
        self.assertEqual((sub['subOutSlug'], sub['playerSlug']), ('damian-motylinski', 'maciej-tyminski'))
        starters = [e for e in events if e['actionType'] == 'sub' and e['period'] == 1 and e['clockSec'] == 600]
        self.assertTrue(all(e['subOutNumber'] is None and e['subOutSlug'] is None for e in starters))
        self.assertEqual(len(starters), 10)

    def test_empty_logs(self):
        resolver = NameResolver({'home': [], 'away': []})
        for name in ('mecz-3842-akcja-po-akcji.html', 'mecz-4117-akcja-po-akcji.html'):
            self.assertIsNone(pbp.parse_pbp(page(name), resolver=resolver, team_ids={}))

    def test_other_games_classify_fully(self):
        for match_id, final in (('4116', (64, 46)), ('4122', (45, 66))):
            resolver = NameResolver({'home': [], 'away': []})
            result = pbp.parse_pbp(page(f'mecz-{match_id}-akcja-po-akcji.html'), resolver=resolver,
                                   team_ids={'home': 'h', 'away': 'a'})
            self.assertEqual(pbp_errors(result, final), [], match_id)
            self.assertNotIn('unknown', {e['actionType'] for e in result['events']})

    def test_pbp_score_regression_detected(self):
        _, result = parse_4124_pbp()
        broken = copy.deepcopy(result)
        broken['events'][-1]['scoreHome'] = 1
        self.assertTrue(pbp_errors(broken, (86, 20)))

    def test_resolver_strategies(self):
        rows = {'home': [{'slug': 'dawid-olearczyk-vkro', 'name': 'D. Olearczyk', 'number': 1},
                         {'slug': 'jan-nowak-x1', 'name': 'J. Nowak', 'number': 7},
                         {'slug': 'jerzy-nowak', 'name': 'J. Nowak', 'number': 8}],
                'away': [{'slug': 'lukasz-mras-krgb', 'name': 'Ł. Mras', 'number': 13}]}
        resolver = NameResolver(rows, [('Jerzy Nowak', 'jerzy-nowak')])
        self.assertEqual(resolver.resolve('home', 'Dawid Olearczyk'), 'dawid-olearczyk-vkro')
        self.assertEqual(resolver.resolve('away', 'Łukasz Mras'), 'lukasz-mras-krgb')
        self.assertEqual(resolver.resolve('home', 'Jan Nowak', 7), 'jan-nowak-x1')
        self.assertEqual(resolver.resolve('home', 'Jerzy Nowak'), 'jerzy-nowak')
        self.assertIsNone(resolver.resolve('home', 'Józef Nowak'))  # dwóch „J. Nowak” — niejednoznaczne
        self.assertIsNone(resolver.resolve('away', 'Dawid Olearczyk'))


class PlayerAndTeamTests(unittest.TestCase):
    def test_player_statistics_all_seasons(self):
        rows = players.parse_player_stats(page('zawodnik-filip-karpinski-statystyki.html'))
        self.assertEqual([r['seasonLabel'] for r in rows], ['2026/2027', '2025/2026'])
        target, other = players.split_rows(rows, '2026/2027', 'Dywizja II')
        self.assertEqual(target, [{
            'competition': 'Dywizja II', 'teamName': 'BeKaPaKa BOBOLICE', 'teamKalkId': None, 'games': 1,
            'minutesTotal': 1638, 'pts': 28, 'twoPm': 13, 'twoPct': 86.7, 'threePm': 0, 'threePct': None, 'ftm': 2,
            'ftPct': 100.0, 'orb': 3, 'drb': 3, 'reb': 6, 'ast': 4, 'stl': 2, 'tov': 2, 'blk': 0, 'pf': 1,
            'pfDrawn': 0, 'eval': 36, 'plusMinus': 0}])
        self.assertEqual(len(other), 1)
        self.assertEqual((other[0]['seasonLabel'], other[0]['games'], other[0]['pts'], other[0]['plusMinus']),
                         ('2025/2026', 12, 179, -22))
        target_49, _ = players.split_rows(rows, '2025/2026', 'Dywizja II')
        self.assertEqual(target_49[0]['minutesTotal'], round(35.3 * 12 * 60))  # sekundy (średnia × mecze)

    def test_player_minutes_formats_and_empty_table(self):
        def table(minutes_avg, minutes_total, games='2'):
            cells = ''.join(f'<td>{v}</td>' for v in ['0'] * 18)
            return soup_of(
                '<table class="player-statistics-table"><thead><tr><th>Sezon</th><th>M</th><th>MIN</th>'
                + ''.join(f'<th>{h}</th>' for h in ['PKT', '2P', '2P%', '3P', '3P%', '1P', '1P%', 'ZB A', 'ZB O', 'ZB',
                                                     'AST', 'PRZ', 'STR', 'BLK', 'F', 'FW', 'EVAL', '+/-'])
                + '</tr></thead><tbody><tr><td><strong>2026/2027</strong><small>Dywizja II · X</small></td>'
                + f'<td>{games}</td><td><span data-stat-average>{minutes_avg}</span>'
                + f'<span data-stat-total hidden>{minutes_total}</span></td>{cells}</tr></tbody></table>')
        self.assertEqual(players.parse_player_stats(table('20,5', '41'))[0]['minutesTotal'], 2460)
        self.assertEqual(players.parse_player_stats(table('20:30', '41:00'))[0]['minutesTotal'], 2460)
        empty = soup_of('<table class="player-statistics-table"><thead><tr><th>Sezon</th><th>M</th></tr></thead>'
                        '<tbody><tr><td colspan="21">Brak statystyk zawodnika.</td></tr></tbody></table>')
        self.assertEqual(players.parse_player_stats(empty), [])

    def test_player_profile(self):
        profile = players.parse_player_profile(page('zawodnik-filip-karpinski-profil.html'))
        self.assertEqual(profile, {'fullName': 'Filip Karpiński', 'firstName': 'Filip', 'lastName': 'Karpiński',
                                   'position': 'SF', 'heightCm': 185, 'birthYear': None, 'lastNumber': 69,
                                   'currentTeamKalkId': '138'})
        html = fixture('zawodnik-filip-karpinski-profil.html').replace(
            '<dt>Urodzony</dt><dd>—</dd>', '<dt>Urodzony</dt><dd>12.03.1994</dd>')
        self.assertNotEqual(html, fixture('zawodnik-filip-karpinski-profil.html'))
        self.assertEqual(players.parse_player_profile(soup_of(html))['birthYear'], 1994)

    def test_team_profile_without_phone(self):
        profile = teams.parse_team_profile(page('druzyna-138.html'), '138', 'bekapaka-bobolice')
        self.assertEqual(profile, {
            'id': '138', 'slug': 'bekapaka-bobolice', 'name': 'BeKaPaKa Bobolice', 'sinceDate': '2023-10-08',
            'captainSlug': 'przemyslaw-klimek', 'allTimeGames': 50, 'allTimeWins': 13, 'allTimeLosses': 37,
            'allTimePointsFor': 2561, 'allTimePointsAgainst': 3273, 'quartersWon': 57, 'quartersLost': 127,
            'overtimes': 4, 'overtimeWins': 1, 'overtimeLosses': 3})
        self.assertNotIn('696', json.dumps(profile))


class HttpTests(unittest.TestCase):
    def test_rejects_foreign_host_and_counts_budget(self):
        site = FakeSite({BASE + 'a': '<html>a</html>', BASE + 'b': '<html>b</html>'})
        http = KalkHttp(rate=0, budget=1, fetch_fn=site, sleep=lambda s: None)
        with self.assertRaises(KalkFetchError):
            http.get('http://127.0.0.1/secret')
        self.assertEqual(http.get(BASE + 'a'), '<html>a</html>')
        with self.assertRaises(BudgetExceeded):
            http.get(BASE + 'b')
        self.assertEqual((http.http_count, site.calls), (1, [BASE + 'a']))

    def test_retry_on_503_then_success(self):
        responses = iter([(503, ''), (200, '<html>ok</html>')])
        sleeps = []
        http = KalkHttp(rate=0, fetch_fn=lambda url: next(responses), sleep=sleeps.append)
        self.assertEqual(http.get(BASE + 'x'), '<html>ok</html>')
        self.assertEqual((http.http_count, len(sleeps)), (2, 1))

    def test_cache_read_mode_makes_no_network_calls(self):
        with tempfile.TemporaryDirectory() as cache:
            site = FakeSite({BASE + 'a': '<html>żółć</html>'})
            KalkHttp(rate=0, cache_dir=cache, cache_mode='refresh', fetch_fn=site).get(BASE + 'a')

            def offline(url):
                raise AssertionError(f'sieć w trybie cache: {url}')

            http = KalkHttp(rate=0, cache_dir=cache, cache_mode='read', fetch_fn=offline)
            self.assertEqual(http.get(BASE + 'a'), '<html>żółć</html>')
            self.assertEqual((http.http_count, http.cache_hits), (0, 1))


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def opts(self, **kwargs):
        defaults = dict(season='50', sections=normalize_sections('league,schedule,matches,pbp,teams'),
                        matches={'4124'})
        defaults.update(kwargs)
        return SyncOptions(**defaults)

    def test_full_run_writes_contract_file(self):
        site = FakeSite(season_50_pages())
        output = self.dir / 'out.json'
        code, stdout = quiet_run(make_http(fetch_fn=site), self.opts(
            sections=normalize_sections(None)), str(output))
        self.assertEqual(code, 0)
        self.assertIn(f'::OUTPUT:: {output}', stdout)
        self.assertIn('::PROGRESS:: 1/', stdout)
        data = json.loads(output.read_text(encoding='utf-8'))
        manifest = data['manifest']
        self.assertEqual((data['version'], manifest['seasonSlug'], manifest['seasonLabel'], manifest['kalkNumber']),
                         (3, '2026-2027', '2026/2027', 50))
        self.assertEqual((manifest['parserVersion'], manifest['sourceSite'], manifest['league'], manifest['mode']),
                         (PARSER_VERSION, 'v2', 'dywizja-ii', 'full'))
        self.assertEqual(set(data), {'version', 'manifest', 'standings', 'teams', 'schedule', 'matches', 'players',
                                     'profiles', 'teamProfiles'})
        self.assertEqual(manifest['counts']['matchesNew'], 1)
        self.assertFalse([f for f in manifest['failures'] if f['section'] in ('matches', 'pbp')])
        match = data['matches'][0]
        self.assertEqual(set(match), {'kalkMatchId', 'sectionHashes', 'sectionsAvailable', 'info', 'box', 'pbp',
                                      'extras'})
        self.assertEqual([t['side'] for t in match['box']['teams']], ['home', 'away'])
        self.assertEqual(set(match['box']['teams'][0]), {'side', 'teamKalkId', 'name', 'players', 'totals',
                                                         'startersPts', 'benchPts'})
        self.assertEqual(match['pbp']['unresolvedNames'], 0)
        self.assertTrue(match['sectionHashes']['pbp'].startswith('sha256:'))
        karpinski = next(p for p in data['players'] if p['slug'] == 'filip-karpinski')
        self.assertEqual((karpinski['teamKalkId'], karpinski['number'], karpinski['seasonStats'][0]['teamKalkId']),
                         ('138', 69, '138'))
        self.assertEqual(data['profiles'][0]['otherCompetitions'][0]['seasonLabel'], '2025/2026')
        self.assertEqual(data['teamProfiles'][0]['id'], '138')
        bekapaka = next(t for t in data['teams'] if t['id'] == '138')
        self.assertIn('filip-karpinski', bekapaka['playerSlugs'])
        self.assertFalse(list(self.dir.glob('*.tmp')))

    def test_league_failure_exit_2_keeps_previous_file(self):
        pages = season_50_pages()
        site = FakeSite(pages, {BASE + 'liga/dywizja-ii/terminarz?sezon=50': 503})
        output = self.dir / 'out.json'
        output.write_text('previous', encoding='utf-8')
        code, _ = quiet_run(make_http(retries=0, fetch_fn=site), self.opts(), str(output))
        self.assertEqual(code, 2)
        self.assertEqual(output.read_text(encoding='utf-8'), 'previous')
        self.assertFalse(list(self.dir.glob('*.tmp')))

    def test_broken_match_goes_to_failures(self):
        pages = season_50_pages()
        pages[BASE + 'mecz/4124/statystyki'] = pages[BASE + 'mecz/4124/statystyki'].replace(
            '<td>28</td>', '<td>29</td>', 1)
        output = self.dir / 'out.json'
        code, _ = quiet_run(make_http(fetch_fn=FakeSite(pages)), self.opts(), str(output))
        data = json.loads(output.read_text(encoding='utf-8'))
        self.assertEqual(code, 0)
        self.assertEqual(data['matches'], [])
        self.assertEqual(data['manifest']['counts']['matchesFailed'], 1)
        self.assertEqual(data['manifest']['failures'][0]['kalkMatchId'], '4124')

    def test_budget_truncation_still_writes_valid_file(self):
        output = self.dir / 'out.json'
        http = make_http(budget=6, fetch_fn=FakeSite(season_50_pages()))
        code, stdout = quiet_run(http, self.opts(), str(output))
        data = json.loads(output.read_text(encoding='utf-8'))
        self.assertEqual(code, 0)
        self.assertTrue(data['manifest']['truncated'])
        self.assertEqual((data['manifest']['httpCount'], data['manifest']['requestBudget']), (6, 6))
        self.assertEqual(data['matches'], [])  # 4124 bez akcja-po-akcji nie jest kompletny
        self.assertEqual(len(data['standings']), 10)

    def test_cache_read_second_run_is_offline(self):
        cache = self.dir / 'cache'
        first = self.dir / 'first.json'
        sections = normalize_sections('league,schedule,matches,pbp')
        quiet_run(make_http(cache_dir=str(cache), cache_mode='refresh', fetch_fn=FakeSite(season_50_pages())),
                  self.opts(sections=sections), str(first))

        def offline(url):
            raise AssertionError(f'sieć w trybie cache: {url}')

        second = self.dir / 'second.json'
        http = make_http(cache_dir=str(cache), cache_mode='read', fetch_fn=offline)
        code, _ = quiet_run(http, self.opts(sections=sections), str(second))
        self.assertEqual((code, http.http_count), (0, 0))
        a, b = (json.loads(p.read_text(encoding='utf-8')) for p in (first, second))
        self.assertEqual(a['matches'], b['matches'])
        self.assertEqual(b['manifest']['httpCount'], 0)

    def test_incremental_selection(self):
        games = schedule.parse_schedule(page('terminarz-50.html'))
        finished = [g for g in games if g['isFinished']]
        now = datetime(2026, 12, 1, tzinfo=timezone.utc)
        state = {'matches': {g['kalkMatchId']: {'isFinished': True, 'scoreHome': g['scoreHome'],
                                                'scoreAway': g['scoreAway'], 'parserVersion': PARSER_VERSION}
                             for g in finished}}
        opts = SyncOptions(mode='incremental', state=state, now=now)
        self.assertEqual(select_matches(games, opts, snapshots_unchanged=False), [])
        state['matches']['4124']['scoreHome'] = 85
        state['matches']['4116']['parserVersion'] = '3.0.0'
        del state['matches']['4122']
        self.assertEqual(sorted(g['kalkMatchId'] for g in select_matches(games, opts, False)), ['4116', '4122', '4124'])
        # Okno korekt 14 dni: mecze z ostatnich dni są ponawiane, chyba że tabela/terminarz się nie zmieniły.
        recent = SyncOptions(mode='incremental', state={'matches': {g['kalkMatchId']: {
            'isFinished': True, 'scoreHome': g['scoreHome'], 'scoreAway': g['scoreAway'],
            'parserVersion': PARSER_VERSION} for g in finished}}, now=datetime(2026, 10, 8, tzinfo=timezone.utc))
        self.assertEqual(len(select_matches(games, recent, False)), 5)
        self.assertEqual(select_matches(games, recent, True), [])
        self.assertEqual(len(select_matches(games, SyncOptions(), False)), 5)

    def test_incremental_unchanged_match_not_written(self):
        first = self.dir / 'first.json'
        site = FakeSite(season_50_pages())
        quiet_run(make_http(fetch_fn=site), self.opts(), str(first))
        previous = json.loads(first.read_text(encoding='utf-8'))
        match = previous['matches'][0]
        state = {'matches': {'4124': {'isFinished': False, 'scoreHome': 86, 'scoreAway': 20, 'scrapedAt': 'x',
                                      'parserVersion': PARSER_VERSION, 'sectionHashes': match['sectionHashes']}},
                 'knownPlayerSlugs': [], 'sectionSnapshots': previous['manifest']['sectionSnapshots']}
        second = self.dir / 'second.json'
        quiet_run(make_http(fetch_fn=site), SyncOptions(
            season='50', sections=normalize_sections('league,schedule,matches,pbp'), mode='incremental',
            state=state), str(second))
        data = json.loads(second.read_text(encoding='utf-8'))
        self.assertEqual(data['manifest']['counts']['matchesUnchanged'], 1)
        self.assertEqual(data['matches'], [])

    def test_output_paths(self):
        self.assertEqual(output_paths('/x/a.json', 'RUN', ['2026-2027']), {'2026-2027': Path('/x/a.json')})
        self.assertEqual(output_paths('/x/a.json', 'RUN', ['2025-2026', '2026-2027'])['2025-2026'],
                         Path('/x/RUN-2025-2026.json'))
        self.assertEqual(output_paths('/runs', 'RUN', ['2026-2027'])['2026-2027'], Path('/runs/RUN-2026-2027.json'))

    def test_plan_uses_cache_only(self):
        cache = self.dir / 'cache'
        quiet_run(make_http(cache_dir=str(cache), cache_mode='refresh', fetch_fn=FakeSite(season_50_pages())),
                  self.opts(), str(self.dir / 'o.json'))
        lines = []
        http = make_http(cache_dir=str(cache), offline=True,
                        fetch_fn=lambda url: (_ for _ in ()).throw(AssertionError(url)))
        summary = plan(http, SyncOptions(season='50', sections=normalize_sections(None)), emit=lines.append)
        self.assertEqual(http.http_count, 0)
        self.assertIn(f'PLAN cache {BASE}mecz/4124/akcja-po-akcji', lines)
        self.assertIn(f'PLAN http  {BASE}mecz/4116/info', lines)
        self.assertTrue(lines[-1].startswith('::PLAN:: '))
        self.assertGreater(summary['urls'], 200)

    def test_cli_rejects_bad_arguments(self):
        with redirect_stdout(io.StringIO()), self.assertLogs(level='ERROR'):
            self.assertEqual(kalk_sync.main(['--sections', 'nope']), 1)
            self.assertEqual(kalk_sync.main(['--matches', 'abc']), 1)

    def test_cli_plan_without_cache_estimates(self):
        out = io.StringIO()
        env = os.environ.pop('KALK_CACHE_DIR', None)
        try:
            with redirect_stdout(out):
                self.assertEqual(kalk_sync.main(['--season', '50', '--plan']), 0)
        finally:
            if env is not None:
                os.environ['KALK_CACHE_DIR'] = env
        self.assertIn('estimated=true', out.getvalue())
        self.assertIn(f'PLAN http  {BASE}liga/dywizja-ii/terminarz?sezon=50', out.getvalue())


if __name__ == '__main__':
    unittest.main()
