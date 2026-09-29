"""Regresje parsera nowej witryny KALK bez dostępu do sieci i bazy."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bs4 import BeautifulSoup

import kalk_new_site
import kalk_scraper


def soup(html):
    return BeautifulSoup(html, 'html.parser')


class NewSiteParserTests(unittest.TestCase):
    def test_table_uses_new_column_positions(self):
        html = '''<table class="standings"><tbody><tr>
        <td>1</td><td><span class="standings-team-name">BeKaPaKa Bobolice</span></td>
        <td>2</td><td>1</td><td>1</td><td>70</td><td>65</td><td>+5</td><td>3</td>
        </tr></tbody></table>'''
        self.assertEqual(kalk_new_site.parse_table(soup(html)), [{
            'position': 1, 'name': 'BeKaPaKa Bobolice', 'matches': 2, 'wins': 1, 'losses': 1,
            'pointsFor': 70, 'pointsAgainst': 65, 'points': 3,
        }])

    def test_schedule_preserves_new_match_id_and_score(self):
        html = '''<article class="schedule-game" data-home-team="138" data-away-team="67">
          <a class="schedule-game-overlay" href="/mecz/4116"></a>
          <span class="schedule-game-topline"><b>Kolejka 1</b></span>
          <span class="schedule-game-home"><strong>BeKaPaKa Bobolice</strong></span>
          <span class="schedule-game-away"><strong>Pantery</strong></span>
          <span class="schedule-game-date"><b>27.09.2026</b><strong>12:00</strong></span>
          <span class="schedule-game-result is-finished"><b>64</b><b>46</b></span>
        </article>'''
        rows = kalk_new_site.parse_schedule(soup(html), 'https://www.kalk-koszalin.com/liga/dywizja-ii/terminarz?sezon=50')
        self.assertEqual((rows[0]['meczId'], rows[0]['scoreHome'], rows[0]['scoreAway']), ('4116', 64, 46))
        self.assertEqual(rows[0]['date'], '27.09.2026 12:00')

    def test_player_statistics_pick_current_season_totals(self):
        html = '''<table class="player-statistics-table"><tbody><tr>
        <td>2026/2027 Dywizja II · BeKaPaKa</td><td>1</td>
        <td>40,0 40</td><td><span>32,0</span><span>32</span></td>
        <td>4,0 4</td><td>28,6% 28,6%</td><td>7,0 7</td><td>38,9% 38,9%</td>
        <td>3,0 3</td><td>60,0% 60,0%</td><td>1,0 1</td><td>8,0 8</td>
        <td><span>9,0</span><span>9</span></td><td><span>4,0</span><span>4</span></td>
        <td><span>2,0</span><span>2</span></td><td><span>3,0</span><span>3</span></td>
        <td><span>1,0</span><span>1</span></td><td>3,0 3</td><td>5,0 5</td>
        <td><span>25,0</span><span>25</span></td>
        </tr></tbody></table>'''
        player = {'id_zawodnika': 'test-player'}
        kalk_new_site.add_player_statistics(player, soup(html), '2026-2027')
        self.assertEqual((player['punkty_suma'], player['srednia_punktow'], player['zbiorki_suma']), (32.0, 32.0, 9.0))

    def test_quarters_convert_cumulative_scores_and_reject_mismatch(self):
        match = {'id': '4116', 'scoreHome': 64, 'scoreAway': 46, 'boxScore': {'meta': {}}}
        html = '''<div class="game-period-progress-row"><b>22</b><span>Q1</span><b>9</b></div>
                  <div class="game-period-progress-row"><b>64</b><span>Q2</span><b>46</b></div>'''
        kalk_new_site.add_quarters(match, soup(html))
        self.assertEqual(match['boxScore']['quarters'][1], {'label': 'Q2', 'home': 42, 'away': 37})
        with self.assertRaisesRegex(ValueError, 'nie zgadza'):
            kalk_new_site.add_quarters(match, soup(html.replace('<b>64</b>', '<b>63</b>')))

    def test_box_score_requires_two_matching_teams_and_point_totals(self):
        def section(name, points):
            values = ['2', 'Player *', '40:00', str(points), '1/2', '50', '0/0', '',
                      '1/2', '50', '0/0', '', '1', '2', '3', '1', '1', '0', '2', '0', '0', '0', '3', '+1']
            cells = ''.join(f'<td>{value}</td>' for value in values)
            return f'<section class="game-boxscore"><h2>{name}</h2><table class="game-stats-table"><tbody><tr>{cells}</tr></tbody></table></section>'

        schedule = {'meczId': '4116', 'meczUrl': 'https://www.kalk-koszalin.com/mecz/4116',
                    'homeTeam': 'BeKaPaKa', 'guestTeam': 'Pantery', 'scoreHome': 2,
                    'scoreAway': 1, 'date': '27.09.2026 12:00'}
        result = kalk_new_site.parse_box_score(soup(section('BeKaPaKa', 2) + section('Pantery', 1)), schedule)
        self.assertEqual(result['id'], '4116')
        self.assertEqual(result['boxScore']['teams'][0]['players'][0]['pts'], 2)
        with self.assertRaisesRegex(ValueError, 'Suma punktów'):
            kalk_new_site.parse_box_score(soup(section('BeKaPaKa', 3) + section('Pantery', 1)), schedule)

    def test_game_log_links_new_match_id(self):
        html = '''<article class="player-game-row">
          <a class="player-game-main" href="/mecz/4116"><span class="player-game-opponent"><strong>Pantery</strong></span>
            <b class="player-game-score">64 : 46</b></a>
          <div class="player-game-stats"><span><small>PKT</small><b>32</b></span>
            <span><small>2P</small><b>4/14</b></span><span><small>3P</small><b>7/18</b></span>
            <span><small>1P</small><b>3/5</b></span></div>
          <span class="player-game-outcome is-win">+</span>
        </article>'''
        player = {'id_zawodnika': 'player-slug', 'imie_nazwisko': 'Player', 'druzyna': 'BeKaPaKa'}
        rows = kalk_new_site.parse_game_logs(soup(html), player)
        self.assertEqual((rows[0]['kalk_match_id'], rows[0]['pts'], rows[0]['fg']), ('4116', 32, '11/32'))

    def test_new_site_failure_keeps_existing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'kalk_stats.json'
            output.write_text('previous', encoding='utf-8')
            with patch.object(kalk_scraper, 'OUTPUT_FILE', output), patch.object(kalk_scraper, 'scrape_new_site', side_effect=ValueError('changed markup')):
                with patch('sys.argv', ['kalk_scraper.py', '--season', '2026-2027']):
                    with self.assertRaisesRegex(ValueError, 'changed markup'):
                        kalk_scraper.main()
            self.assertEqual(output.read_text(encoding='utf-8'), 'previous')


if __name__ == '__main__':
    unittest.main()
