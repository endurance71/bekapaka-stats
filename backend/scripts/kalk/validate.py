"""Inwarianty meczu z kontraktu KALK v2 — sprawdzane przed zapisem pliku."""

from __future__ import annotations

from typing import Optional

from .boxscore import STAT_KEYS

SHOT_PAIRS = (('twoPm', 'twoPa'), ('threePm', 'threePa'), ('fgm', 'fga'), ('ftm', 'fta'))
# Minuty drużyny nie są dokładnie 200 (obserwowane 194–202), więc ich nie walidujemy ściśle.
NON_STRICT_KEYS = {'secondsPlayed'}


def _line_errors(row: dict, label: str) -> list[str]:
    errors = []
    if row['fgm'] != row['twoPm'] + row['threePm']:
        errors.append(f'{label}: fgm ≠ twoPm + threePm')
    if row['fga'] != row['twoPa'] + row['threePa']:
        errors.append(f'{label}: fga ≠ twoPa + threePa')
    if row['pts'] != 2 * row['twoPm'] + 3 * row['threePm'] + row['ftm']:
        errors.append(f'{label}: pts ≠ 2·twoPm + 3·threePm + ftm')
    if row['reb'] != row['orb'] + row['drb']:
        errors.append(f'{label}: reb ≠ orb + drb')
    for made, att in SHOT_PAIRS:
        if row[made] > row[att]:
            errors.append(f'{label}: {made} > {att}')
    for key in STAT_KEYS:
        if row[key] < 0 and key != 'eval':
            errors.append(f'{label}: ujemne {key}')
    return errors


def box_errors(box: dict, score: Optional[tuple[int, int]]) -> list[str]:
    errors = []
    teams = box.get('teams') or []
    if len(teams) != 2 or [t.get('side') for t in teams] != ['home', 'away']:
        return ['box: oczekiwano dokładnie 2 drużyn (home, away)']
    for index, team in enumerate(teams):
        side = team['side']
        players = team['players']
        sums = {key: sum(p[key] for p in players) for key in STAT_KEYS}
        for key in STAT_KEYS:
            if team['totals'][key] != sums[key]:
                errors.append(f'{side}: totals.{key}={team["totals"][key]} ≠ Σ wierszy {sums[key]}')
        footer = team.get('footer')
        if footer:
            for key in STAT_KEYS:
                if key in NON_STRICT_KEYS:
                    continue
                if footer[key] != sums[key]:
                    errors.append(f'{side}: SUMA KALK {key}={footer[key]} ≠ Σ wierszy {sums[key]}')
        errors.extend(_line_errors(team['totals'], f'{side} totals'))
        for player in players:
            errors.extend(_line_errors(player, f'{side} {player.get("name")}'))
        if score is not None and team['totals']['pts'] != score[index]:
            errors.append(f'{side}: Σ pts {team["totals"]["pts"]} ≠ wynik {score[index]}')
        if team['startersPts'] + team['benchPts'] != team['totals']['pts']:
            errors.append(f'{side}: startersPts + benchPts ≠ pts')
    return errors


def quarter_errors(quarters: list[dict], score: Optional[tuple[int, int]]) -> list[str]:
    if not quarters:
        return []
    errors = []
    regular = [q for q in quarters if q['period'] <= 4]
    if len(regular) != 4:
        errors.append(f'kwarty: oczekiwano 4 kwart, jest {len(regular)}')
    home = sum(q['home'] for q in quarters)
    away = sum(q['away'] for q in quarters)
    if score is not None and (home, away) != tuple(score):
        errors.append(f'kwarty: Σ {home}:{away} ≠ wynik {score[0]}:{score[1]}')
    running_home = running_away = 0
    for q in quarters:
        if q['period'] > 4 and running_home != running_away:
            errors.append(f'kwarty: dogrywka {q["label"]} bez remisu ({running_home}:{running_away})')
        running_home += q['home']
        running_away += q['away']
    return errors


def pbp_errors(pbp: Optional[dict], score: Optional[tuple[int, int]]) -> list[str]:
    if not pbp:
        return []
    events = pbp['events']
    errors = []
    previous = (0, 0)
    points = {'home': 0, 'away': 0}
    for event in events:
        current = (event['scoreHome'], event['scoreAway'])
        if current[0] < previous[0] or current[1] < previous[1]:
            errors.append(f'pbp: wynik maleje w zdarzeniu {event["seq"]}')
            break
        previous = current
        if event['isScoring'] and event['side'] in points:
            points[event['side']] += event['shotValue'] or 0
    if score is not None:
        if previous != tuple(score):
            errors.append(f'pbp: ostatni wynik {previous[0]}:{previous[1]} ≠ wynik {score[0]}:{score[1]}')
        if (points['home'], points['away']) != tuple(score):
            errors.append(f'pbp: Σ punktów ze zdarzeń {points["home"]}:{points["away"]} ≠ wynik')
    return errors


def unknown_actions(pbp: Optional[dict]) -> list[str]:
    """Akcje spoza katalogu (`actionType: unknown`) — dozwolone w kontrakcie, raportowane w logu."""
    if not pbp:
        return []
    return sorted({e['actionRaw'] for e in pbp['events'] if e['actionType'] == 'unknown'})


def match_errors(match: dict, score: Optional[tuple[int, int]]) -> list[str]:
    """Wszystkie naruszenia inwariantów; pusta lista = mecz może trafić do pliku."""
    errors = box_errors(match['box'], score)
    errors.extend(quarter_errors(match['info'].get('quarters') or [], score))
    errors.extend(pbp_errors(match.get('pbp'), score))
    return errors
