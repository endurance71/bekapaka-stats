"""Składanie pliku sezonu KALK v2 (kontrakt `docs/kalk-v2-contract.md`, version 3)."""

from __future__ import annotations

import json
import logging
import os
import secrets
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable, Optional

from . import boxscore, league, match_info, pbp, players, schedule, seasons, teams
from .common import (CONTRACT_VERSION, DEFAULT_LEAGUE, LEAGUE_COMPETITION, PARSER_VERSION, SOURCE_SITE, ParseError,
                     fold, league_url, match_url, now_iso, player_url, soup_of, stable_hash, team_url, unique)
from .http import BudgetExceeded, CacheMiss, KalkFetchError, KalkHttp
from .resolve import NameResolver
from .validate import match_errors, quarter_warnings, unknown_actions

log = logging.getLogger('kalk.pipeline')

ALL_SECTIONS = ['league', 'schedule', 'matches', 'pbp', 'players', 'profiles', 'teams']
CORRECTION_WINDOW = timedelta(days=14)


class LeagueLevelError(RuntimeError):
    """Nie da się pobrać/sparsować strony ligi (tabela, terminarz, katalogi) — brak pliku, kod 2."""


@dataclass
class SyncOptions:
    season: str = 'current'
    league: str = DEFAULT_LEAGUE
    sections: list[str] = field(default_factory=lambda: list(ALL_SECTIONS))
    matches: Optional[set[str]] = None
    mode: str = 'full'
    state: dict = field(default_factory=dict)
    now: Optional[datetime] = None


class Progress:
    """Linie `::PROGRESS:: n/total` na stdout (parsowane przez Node)."""

    def __init__(self, stream=None):
        self.done = 0
        self.total = 0
        self.stream = stream or sys.stdout

    def add(self, count: int) -> None:
        self.total += max(0, count)

    def tick(self) -> None:
        self.done += 1
        self.total = max(self.total, self.done)
        print(f'::PROGRESS:: {self.done}/{self.total}', file=self.stream, flush=True)


def new_run_id(now: Optional[datetime] = None) -> str:
    now = now or datetime.now(timezone.utc)
    return f'{now.strftime("%Y%m%dT%H%M%SZ")}-{secrets.token_hex(2)}'


def normalize_sections(raw: Optional[str]) -> list[str]:
    if not raw:
        return list(ALL_SECTIONS)
    requested = [s.strip() for s in raw.split(',') if s.strip()]
    unknown = [s for s in requested if s not in ALL_SECTIONS]
    if unknown:
        raise ValueError(f'Nieznane sekcje: {", ".join(unknown)}')
    if 'pbp' in requested and 'matches' not in requested:
        requested.append('matches')  # akcja-po-akcji wymaga box score do rozwiązania nazwisk
    return [s for s in ALL_SECTIONS if s in requested]


class Fetcher:
    """Pobieranie z pamięcią podręczną w obrębie procesu i paskiem postępu."""

    def __init__(self, http: KalkHttp, progress: Progress):
        self.http = http
        self.progress = progress
        self.memo: dict[str, str] = {}

    def soup(self, url: str):
        if url not in self.memo:
            self.memo[url] = self.http.get(url)
        self.progress.tick()
        return soup_of(self.memo[url])


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None


def _season_snapshots(state: dict, season_slug: str) -> dict:
    snapshots = state.get('sectionSnapshots') or {}
    if isinstance(snapshots.get(season_slug), dict):
        return snapshots[season_slug]
    return snapshots


def discover(fetcher: Fetcher, league_slug: str, spec: str) -> list[dict]:
    """Lista sezonów do przetworzenia. Numer KALK nie wymaga odkrywania (etykieta z jego strony)."""
    if spec.isdigit():
        return [{'kalkNumber': int(spec), 'label': None, 'slug': None}]
    try:
        soup = fetcher.soup(league_url(league_slug, 'tabela'))
        options = seasons.parse_season_options(soup)
    except (KalkFetchError, ParseError) as exc:
        raise LeagueLevelError(f'Nie udało się odkryć sezonów KALK: {exc}') from exc
    return seasons.resolve_targets(spec, options)


def select_matches(games: list[dict], opts: SyncOptions, snapshots_unchanged: bool) -> list[dict]:
    finished = [g for g in games if g['isFinished']]
    if opts.matches:
        return [g for g in finished if g['kalkMatchId'] in opts.matches]
    if opts.mode != 'incremental':
        return finished
    known = (opts.state or {}).get('matches') or {}
    now = opts.now or datetime.now(timezone.utc)
    selected = []
    for game in finished:
        previous = known.get(game['kalkMatchId'])
        if previous is None or not previous.get('isFinished'):
            selected.append(game)
        elif (previous.get('scoreHome'), previous.get('scoreAway')) != (game['scoreHome'], game['scoreAway']):
            selected.append(game)
        elif previous.get('parserVersion') != PARSER_VERSION:
            selected.append(game)
        elif not snapshots_unchanged:
            starts = _parse_dt(game['startsAtUtc'])
            if starts is not None and now - starts <= CORRECTION_WINDOW:
                selected.append(game)
    return selected


class SeasonSync:
    def __init__(self, fetcher: Fetcher, opts: SyncOptions, season: dict, run_id: str):
        self.fetcher = fetcher
        self.http = fetcher.http
        self.opts = opts
        self.season = dict(season)
        self.run_id = run_id
        self.failures: list[dict] = []
        self.warnings: list[dict] = []
        self.truncated = False
        self.started_at = now_iso()
        self.counts = {'matchesNew': 0, 'matchesUpdated': 0, 'matchesUnchanged': 0, 'matchesFailed': 0,
                       'players': 0, 'profiles': 0, 'teams': 0}
        self.http_start = self.http.http_count
        self.match_rows: list[dict] = []
        self.out_matches: list[dict] = []
        self.out_players: list[dict] = []
        self.out_profiles: list[dict] = []
        self.out_team_profiles: list[dict] = []
        self.all_matches_loaded = False

    # --- pomocnicze ---------------------------------------------------------------
    def _fail(self, url: str, section: str, error: Exception | str, match_id: Optional[str] = None) -> None:
        entry = {'url': url, 'section': section, 'kalkMatchId': match_id, 'error': str(error)}
        log.warning('Błąd %s %s: %s', section, url, error)
        self.failures.append(entry)

    def _league_page(self, section: str):
        url = league_url(self.opts.league, section, self.season['kalkNumber'])
        try:
            soup = self.fetcher.soup(url)
        except KalkFetchError as exc:
            raise LeagueLevelError(f'Strona ligi {url}: {exc}') from exc
        if self.season.get('label') is None:
            selected = seasons.selected_season(soup)
            if not selected or selected['kalkNumber'] != self.season['kalkNumber']:
                raise LeagueLevelError(f'Strona {url} nie potwierdza sezonu {self.season["kalkNumber"]}')
            self.season.update(selected)
        try:
            seasons.confirm_page_season(soup, self.season['label'], section)
        except ParseError as exc:
            raise LeagueLevelError(str(exc)) from exc
        return url, soup

    # --- liga -----------------------------------------------------------------------
    def load_league(self) -> None:
        self.fetcher.progress.add(4)
        try:
            _, standings_soup = self._league_page('tabela')
            _, schedule_soup = self._league_page('terminarz')
            _, teams_soup = self._league_page('zespoly')
            _, players_soup = self._league_page('zawodnicy')
            self.standings = league.parse_standings(standings_soup)
            self.schedule = schedule.parse_schedule(schedule_soup)
            self.teams = league.parse_teams(teams_soup)
            self.directory = league.parse_player_directory(players_soup)
            self.team_slugs = league.team_slugs(standings_soup, teams_soup, schedule_soup)
        except ParseError as exc:
            raise LeagueLevelError(f'Struktura strony ligi KALK: {exc}') from exc
        self.snapshots = {'standings': stable_hash(self.standings), 'schedule': stable_hash(self.schedule)}
        previous = _season_snapshots(self.opts.state or {}, self.season['slug'])
        self.snapshots_unchanged = bool(previous) and all(previous.get(k) == v for k, v in self.snapshots.items())

    def team_name_map(self) -> dict[str, str]:
        names = {}
        for team in self.teams:
            names[fold(team['name'])] = team['id']
        for row in self.standings:
            names.setdefault(fold(row['name']), row['teamKalkId'])
        for game in self.schedule:
            names.setdefault(fold(game['homeTeam']), game['homeTeamKalkId'])
            names.setdefault(fold(game['guestTeam']), game['guestTeamKalkId'])
        return names

    # --- mecze ----------------------------------------------------------------------
    def _known_full_names(self) -> list[tuple[str, str]]:
        return [(p['fullName'], p['slug']) for p in self.directory]

    def fetch_match(self, game: dict) -> Optional[dict]:
        match_id = game['kalkMatchId']
        score = (game['scoreHome'], game['scoreAway'])
        url, section = match_url(match_id, 'info'), 'matches'
        try:
            info_page = match_info.parse_match_info(self.fetcher.soup(url))
            header = info_page['header']
            if header['home']['teamKalkId'] != game['homeTeamKalkId'] or header['away']['teamKalkId'] != game['guestTeamKalkId']:
                raise ParseError('Drużyny strony meczu nie zgadzają się z terminarzem')
            if header['score'] is not None and tuple(header['score']) != score:
                raise ParseError(f'Wynik strony meczu {header["score"]} ≠ terminarz {score}')
            url = match_url(match_id, 'statystyki')
            box = boxscore.parse_boxscore(self.fetcher.soup(url))
            for side, team, head in zip(('home', 'away'), box['teams'], (header['home'], header['away'])):
                if fold(team['name']) != fold(head['name']):
                    raise ParseError(f'Box score {team["name"]!r} ≠ drużyna {head["name"]!r}')
                team['side'] = side
                team['teamKalkId'] = head['teamKalkId']
            pbp_data = None
            if 'pbp' in self.opts.sections and info_page['hasPlayByPlay']:
                url, section = match_url(match_id, 'akcja-po-akcji'), 'pbp'
                known = self._known_full_names()
                for entries in info_page['info']['leaders'].values():
                    known.extend((e['name'], e['slug']) for e in entries)
                if info_page['info']['mvp']:
                    known.append((info_page['info']['mvp']['name'], info_page['info']['mvp']['slug']))
                resolver = NameResolver({'home': box['teams'][0]['players'], 'away': box['teams'][1]['players']}, known)
                pbp_data = pbp.parse_pbp(self.fetcher.soup(url), resolver=resolver,
                                         team_ids={'home': game['homeTeamKalkId'], 'away': game['guestTeamKalkId']})
        except BudgetExceeded:
            raise
        except boxscore.NoBoxScore as exc:
            self.warnings.append({'url': url, 'kalkMatchId': match_id, 'warning': f'brak box score: {exc}', 'noBoxScore': True})
            log.warning('Mecz %s: %s', match_id, exc)
            return None
        except (KalkFetchError, ParseError) as exc:
            self._fail(url, section, exc, match_id)
            self.counts['matchesFailed'] += 1
            return None

        info = info_page['info']
        if not info['venue']:
            info['venue'] = game['venue']
        if not info['startsAtUtc']:
            info['startsAtUtc'] = game['startsAtUtc']
        match = {'kalkMatchId': match_id, 'info': info, 'box': box, 'pbp': pbp_data}
        errors = match_errors(match, score)
        if errors:
            self._fail(match_url(match_id), 'matches', '; '.join(errors[:8]), match_id)
            self.counts['matchesFailed'] += 1
            return None
        for warning in quarter_warnings(info.get('quarters') or []):
            self.warnings.append({'url': match_url(match_id), 'kalkMatchId': match_id, 'warning': warning})
            log.warning('Mecz %s: %s', match_id, warning)
        unknown = unknown_actions(pbp_data)
        if unknown:
            log.warning('Mecz %s: nieznane akcje akcja-po-akcji %s', match_id, unknown)
        box['teams'] = [{
            'side': t['side'], 'teamKalkId': t['teamKalkId'], 'name': t['name'], 'players': t['players'],
            'totals': t['totals'], 'startersPts': t['startersPts'], 'benchPts': t['benchPts'],
        } for t in box['teams']]
        available = list(header['sections'])
        if not info_page['hasPlayByPlay'] or (pbp_data is None and 'pbp' in self.opts.sections):
            available = [s for s in available if s != 'akcja-po-akcji']  # zakładka jest, ale log pusty
        hashes = {'info': stable_hash(info), 'box': stable_hash(box), 'pbp': stable_hash(pbp_data) if pbp_data else None}
        return {
            'kalkMatchId': match_id,
            'sectionHashes': hashes,
            'sectionsAvailable': available,
            'info': info,
            'box': box,
            'pbp': pbp_data,
            'extras': None,
        }

    def classify_change(self, match: dict) -> str:
        previous = ((self.opts.state or {}).get('matches') or {}).get(match['kalkMatchId'])
        if previous is None:
            return 'new'
        old = previous.get('sectionHashes') or {}
        same = previous.get('parserVersion') == PARSER_VERSION and all(
            old.get(key) == value for key, value in match['sectionHashes'].items()
            if key != 'pbp' or 'pbp' in self.opts.sections)
        return 'unchanged' if same else 'updated'

    def load_matches(self) -> None:
        if self.opts.matches:
            known_ids = {g['kalkMatchId'] for g in self.schedule if g['isFinished']}
            for missing in sorted(self.opts.matches - known_ids):
                self._fail(match_url(missing), 'matches', 'Mecz nie jest zakończony lub nie ma go w terminarzu sezonu', missing)
        selected = sorted(select_matches(self.schedule, self.opts, self.snapshots_unchanged),
                          key=lambda g: (g['startsAtUtc'], g['kalkMatchId']))
        per_match = 3 if 'pbp' in self.opts.sections else 2
        self.fetcher.progress.add(per_match * len(selected))
        for game in selected:
            match = self.fetch_match(game)
            if match is None:
                continue
            change = self.classify_change(match)
            self.counts[{'new': 'matchesNew', 'updated': 'matchesUpdated', 'unchanged': 'matchesUnchanged'}[change]] += 1
            self.match_rows.append({'game': game, 'match': match, 'change': change})
            # W trybie incremental mecze bez zmian (te same hashe) nie trafiają do pliku.
            if self.opts.mode == 'incremental' and change == 'unchanged' and not self.opts.matches:
                continue
            self.out_matches.append(match)
        self.all_matches_loaded = (self.opts.mode == 'full' and not self.opts.matches
                                   and self.counts['matchesFailed'] == 0)

    # --- zawodnicy ----------------------------------------------------------------
    def player_targets(self) -> list[str]:
        box_slugs = []
        changed_slugs = []
        for row in self.match_rows:
            for team in row['match']['box']['teams']:
                for player in team['players']:
                    if player['slug']:
                        box_slugs.append(player['slug'])
                        if row['change'] != 'unchanged':
                            changed_slugs.append(player['slug'])
        directory = [p['slug'] for p in self.directory]
        if self.opts.mode != 'incremental':
            return unique(directory + box_slugs)
        known = set((self.opts.state or {}).get('knownPlayerSlugs') or [])
        return unique([s for s in directory + box_slugs if s not in known] + changed_slugs)

    def _player_context(self) -> dict[str, dict]:
        """Najświeższe wystąpienie zawodnika w box score (numer, drużyna, nazwa skrócona)."""
        context: dict[str, dict] = {}
        for row in sorted(self.match_rows, key=lambda r: r['game']['startsAtUtc']):
            for team in row['match']['box']['teams']:
                for player in team['players']:
                    if player['slug']:
                        context[player['slug']] = {'number': player['number'], 'teamKalkId': team['teamKalkId'],
                                                   'teamName': team['name'], 'name': player['name']}
        return context

    def _box_minutes(self) -> dict[str, tuple[int, int]]:
        """slug → (liczba wierszy box score, Σ sekund) ze wszystkich meczów sezonu w tym przebiegu."""
        totals: dict[str, tuple[int, int]] = {}
        for row in self.match_rows:
            for team in row['match']['box']['teams']:
                for player in team['players']:
                    if player['slug']:
                        games, seconds = totals.get(player['slug'], (0, 0))
                        totals[player['slug']] = (games + 1, seconds + player['secondsPlayed'])
        return totals

    def load_players(self) -> None:
        want_stats = 'players' in self.opts.sections or 'profiles' in self.opts.sections
        want_profiles = 'profiles' in self.opts.sections
        targets = self.player_targets()
        self.fetcher.progress.add(len(targets) * (int(want_stats) + int(want_profiles)))
        names = self.team_name_map()
        directory = {p['slug']: p for p in self.directory}
        context = self._player_context()
        box_minutes = self._box_minutes() if self.all_matches_loaded else {}
        competition = LEAGUE_COMPETITION.get(self.opts.league, 'Dywizja II')
        for slug in targets:
            entry = directory.get(slug) or {}
            ctx = context.get(slug) or {}
            team_id = names.get(fold(entry['teamName'])) if entry.get('teamName') else None
            team_id = team_id or ctx.get('teamKalkId')
            team_name = entry.get('teamName') or ctx.get('teamName')
            rows = other = None
            if want_stats:
                url = player_url(slug, 'statystyki')
                try:
                    rows, other = players.split_rows(players.parse_player_stats(self.fetcher.soup(url)),
                                                     self.season['label'], competition)
                except BudgetExceeded:
                    raise
                except (KalkFetchError, ParseError) as exc:
                    self._fail(url, 'players', exc)
                    rows = other = None
                if rows is not None:
                    for row in rows:
                        row['teamKalkId'] = names.get(fold(row['teamName'] or '')) or (team_id if len(rows) == 1 else None)
                    exact = box_minutes.get(slug)
                    if exact and len(rows) == 1 and rows[0]['games'] == exact[0]:
                        rows[0]['minutesTotal'] = exact[1]  # dokładne sekundy z box score
                    for row in other:
                        row['teamKalkId'] = names.get(fold(row['teamName'] or ''))
            profile = None
            if want_profiles:
                url = player_url(slug, 'profil')
                try:
                    profile = players.parse_player_profile(self.fetcher.soup(url))
                except BudgetExceeded:
                    raise
                except (KalkFetchError, ParseError) as exc:
                    self._fail(url, 'profiles', exc)
            full_name = entry.get('fullName') or (profile or {}).get('fullName') or ctx.get('name')
            if 'players' in self.opts.sections and rows is not None:
                self.out_players.append({
                    'slug': slug,
                    'fullName': full_name,
                    'teamKalkId': team_id,
                    'teamName': team_name,
                    'number': ctx.get('number') if ctx.get('number') is not None else (profile or {}).get('lastNumber'),
                    'profileUrl': player_url(slug),
                    'seasonStats': rows,
                })
            if profile is not None:
                self.out_profiles.append({
                    'slug': slug,
                    'fullName': profile['fullName'],
                    'firstName': profile['firstName'],
                    'lastName': profile['lastName'],
                    'position': profile['position'] or entry.get('position'),
                    'heightCm': profile['heightCm'],
                    'birthYear': profile['birthYear'],
                    'lastNumber': profile['lastNumber'],
                    'otherCompetitions': other or [],
                })

    # --- drużyny --------------------------------------------------------------------
    def team_targets(self) -> list[tuple[str, Optional[str]]]:
        slugs = dict(self.team_slugs)
        slugs.update({t['id']: t['slug'] for t in self.teams if t['slug']})
        ids = [t['id'] for t in self.teams]
        for game in self.schedule:
            ids.extend([game['homeTeamKalkId'], game['guestTeamKalkId']])
        ids = unique(ids)
        if self.opts.mode == 'incremental':
            changed = set()
            for row in self.match_rows:
                if row['change'] != 'unchanged':
                    changed.update({row['game']['homeTeamKalkId'], row['game']['guestTeamKalkId']})
            ids = [i for i in ids if i in changed]
        return [(team_id, slugs.get(team_id)) for team_id in ids]

    def load_team_profiles(self) -> None:
        targets = self.team_targets()
        self.fetcher.progress.add(len(targets))
        for team_id, slug in targets:
            url = team_url(team_id, slug)
            try:
                self.out_team_profiles.append(teams.parse_team_profile(self.fetcher.soup(url), team_id, slug))
            except BudgetExceeded:
                raise
            except (KalkFetchError, ParseError) as exc:
                self._fail(url, 'teams', exc)

    # --- całość --------------------------------------------------------------------
    def run(self) -> dict:
        self.load_league()
        sections = self.opts.sections
        try:
            if 'matches' in sections:
                self.load_matches()
            if 'players' in sections or 'profiles' in sections:
                self.load_players()
            if 'teams' in sections:
                self.load_team_profiles()
        except BudgetExceeded as exc:
            log.warning('Przerwano (budżet): %s', exc)
            self.truncated = True
        return self.assemble()

    def assemble(self) -> dict:
        sections = self.opts.sections
        matches, player_rows = self.out_matches, self.out_players
        profile_rows, team_profiles = self.out_profiles, self.out_team_profiles
        names = self.team_name_map()
        team_players: dict[str, list[str]] = {t['id']: [] for t in self.teams}
        for player in self.directory:
            team_id = names.get(fold(player['teamName'] or ''))
            if team_id in team_players:
                team_players[team_id].append(player['slug'])
        for row in self.match_rows:
            for team in row['match']['box']['teams']:
                if team['teamKalkId'] in team_players:
                    team_players[team['teamKalkId']].extend(p['slug'] for p in team['players'] if p['slug'])
        team_rows = [dict(t, playerSlugs=sorted(set(team_players[t['id']]))) for t in self.teams]
        self.counts['players'] = len(player_rows)
        self.counts['profiles'] = len(profile_rows)
        self.counts['teams'] = len(team_profiles)
        manifest = {
            'runId': self.run_id,
            'parserVersion': PARSER_VERSION,
            'sourceSite': SOURCE_SITE,
            'seasonSlug': self.season['slug'],
            'seasonLabel': self.season['label'],
            'kalkNumber': self.season['kalkNumber'],
            'league': self.opts.league,
            'mode': self.opts.mode,
            'sections': list(sections),
            'httpCount': self.http.http_count - self.http_start,
            'requestBudget': self.http.budget,
            'truncated': self.truncated,
            'counts': dict(self.counts),
            'failures': list(self.failures),
            'warnings': list(self.warnings),
            'startedAt': self.started_at,
            'finishedAt': now_iso(),
            'sectionSnapshots': dict(self.snapshots),
        }
        return {
            'version': CONTRACT_VERSION,
            'manifest': manifest,
            'standings': self.standings if 'league' in sections else [],
            'teams': team_rows if 'league' in sections else [],
            'schedule': self.schedule if 'schedule' in sections else [],
            'matches': matches if 'matches' in sections else [],
            'players': player_rows if 'players' in sections else [],
            'profiles': profile_rows if 'profiles' in sections else [],
            'teamProfiles': team_profiles if 'teams' in sections else [],
        }


def write_atomic(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    with tmp.open('w', encoding='utf-8') as handle:
        json.dump(data, handle, ensure_ascii=False, indent=1)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(tmp, path)


def output_paths(output: Optional[str], run_id: str, season_slugs: list[str]) -> dict[str, Path]:
    default_dir = Path(os.environ.get('KALK_RUNS_DIR', '/data/kalk/runs'))
    if output and len(season_slugs) == 1 and output.endswith('.json'):
        return {season_slugs[0]: Path(output)}
    if output:
        base = Path(output)
        directory = base.parent if base.suffix == '.json' else base
    else:
        directory = default_dir
    return {slug: directory / f'{run_id}-{slug}.json' for slug in season_slugs}


def run_sync(http: KalkHttp, opts: SyncOptions, *, output: Optional[str] = None,
             progress: Optional[Progress] = None, emit: Callable[[str], None] = print) -> int:
    """Pełny przebieg CLI: zapisuje pliki i wypisuje `::OUTPUT:: <ścieżka>`. Zwraca kod wyjścia."""
    progress = progress or Progress()
    fetcher = Fetcher(http, progress)
    run_id = new_run_id()
    exit_code = 0
    try:
        targets = discover(fetcher, opts.league, opts.season)
    except (LeagueLevelError, ParseError) as exc:
        log.error('%s', exc)
        return 2
    results: list[dict] = []
    for season in targets:
        sync = SeasonSync(fetcher, opts, season, run_id)
        try:
            results.append(sync.run())
        except (LeagueLevelError, BudgetExceeded) as exc:
            log.error('Sezon %s: %s', season.get('label') or season['kalkNumber'], exc)
            exit_code = 2
            continue
    if not results:
        return 2
    paths = output_paths(output, run_id, [r['manifest']['seasonSlug'] for r in results])
    for result in results:
        path = paths[result['manifest']['seasonSlug']]
        write_atomic(path, result)
        manifest = result['manifest']
        log.info('Sezon %s: %d meczów, %d zawodników, %d profili, %d drużyn, %d błędów, http=%d, truncated=%s',
                 manifest['seasonLabel'], len(result['matches']), manifest['counts']['players'],
                 manifest['counts']['profiles'], manifest['counts']['teams'], len(manifest['failures']),
                 manifest['httpCount'], manifest['truncated'])
        emit(f'::OUTPUT:: {path}')
    return exit_code


# --- plan (bez sieci) --------------------------------------------------------------
def plan(http: KalkHttp, opts: SyncOptions, emit: Callable[[str], None] = print) -> dict:
    """Wypisuje planowane adresy. Korzysta wyłącznie z cache (http.offline); brak strony → szacunek."""
    planned: list[tuple[str, bool]] = []
    estimated = False

    def page(url: str):
        html = http.cached(url) if http.cache_dir else None
        planned.append((url, html is not None))
        return soup_of(html) if html is not None else None

    def note(url: str, cached: bool = False):
        planned.append((url, cached or bool(http.cache_dir and http.cached(url) is not None)))

    if opts.season.isdigit():
        targets = [{'kalkNumber': int(opts.season), 'label': None, 'slug': None}]
    else:
        soup = page(league_url(opts.league, 'tabela'))
        if soup is None:
            estimated = True
            targets = []
        else:
            targets = seasons.resolve_targets(opts.season, seasons.parse_season_options(soup))
    for season in targets:
        number = season['kalkNumber']
        soups = {name: page(league_url(opts.league, name, number)) for name in ('tabela', 'terminarz', 'zespoly', 'zawodnicy')}
        games = schedule.parse_schedule(soups['terminarz']) if soups['terminarz'] is not None else None
        directory = league.parse_player_directory(soups['zawodnicy']) if soups['zawodnicy'] is not None else None
        team_rows = league.parse_teams(soups['zespoly']) if soups['zespoly'] is not None else None
        if games is None:
            estimated = True
            continue
        snapshot_ok = False
        selected = select_matches(games, opts, snapshot_ok) if 'matches' in opts.sections else []
        for game in selected:
            info_soup = page(match_url(game['kalkMatchId'], 'info'))
            note(match_url(game['kalkMatchId'], 'statystyki'))
            if 'pbp' in opts.sections:
                has_pbp = None
                if info_soup is not None:
                    header = match_info.parse_header(info_soup)
                    has_pbp = match_info.has_play_by_play(info_soup, header)
                if has_pbp is not False:
                    note(match_url(game['kalkMatchId'], 'akcja-po-akcji'))
        if directory is None:
            estimated = True
        else:
            known = set((opts.state or {}).get('knownPlayerSlugs') or []) if opts.mode == 'incremental' else set()
            for player in directory:
                if player['slug'] in known:
                    continue
                if 'players' in opts.sections or 'profiles' in opts.sections:
                    note(player_url(player['slug'], 'statystyki'))
                if 'profiles' in opts.sections:
                    note(player_url(player['slug'], 'profil'))
        if 'teams' in opts.sections and team_rows is not None:
            for team in team_rows:
                note(team_url(team['id'], team['slug']))
    seen = set()
    network = cached = 0
    for url, is_cached in planned:
        if url in seen:
            continue
        seen.add(url)
        emit(f'PLAN {"cache" if is_cached else "http "} {url}')
        if is_cached:
            cached += 1
        else:
            network += 1
    summary = {'urls': len(seen), 'network': network, 'cached': cached, 'estimated': estimated}
    emit(f'::PLAN:: urls={summary["urls"]} network={network} cached={cached} '
         f'estimated={"true" if estimated else "false"}')
    return summary


__all__ = ['ALL_SECTIONS', 'SyncOptions', 'SeasonSync', 'Progress', 'Fetcher', 'LeagueLevelError', 'run_sync',
           'plan', 'normalize_sections', 'output_paths', 'write_atomic', 'select_matches', 'discover', 'CacheMiss']
