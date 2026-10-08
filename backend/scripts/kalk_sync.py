#!/usr/bin/env python3
"""KALK v2 → JSON sezonu (kontrakt `docs/kalk-v2-contract.md`).

Przykłady:
  python3 kalk_sync.py --season current --mode incremental --state state.json --output /data/kalk/runs/
  python3 kalk_sync.py --season 50 --mode full --budget 400 --cache-dir /tmp/kalk-cache --output /tmp/kalk-v2-50.json
  python3 kalk_sync.py --season all --plan --cache-dir /data/kalk/cache

Wyjście na stdout: `::PROGRESS:: n/total`, na końcu `::OUTPUT:: <ścieżka>` dla każdego pliku.
Kody wyjścia: 0 — zapisano (także z `manifest.failures` / `truncated`), 2 — błąd strony ligi (brak pliku
dla tego sezonu), 1 — błędne argumenty / nieoczekiwany błąd.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys

from kalk.common import DEFAULT_LEAGUE
from kalk.http import CACHE_MODES, KalkHttp
from kalk.pipeline import SyncOptions, normalize_sections, plan, run_sync


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Skraper KALK v2 (Scrapling)')
    parser.add_argument('--season', default='current',
                        help='current | all (47..bieżący) | slug 2025-2026 | numer KALK 49')
    parser.add_argument('--league', default=DEFAULT_LEAGUE, choices=[DEFAULT_LEAGUE])
    parser.add_argument('--sections', default=None,
                        help='Lista po przecinku: league,schedule,matches,pbp,players,profiles,teams (domyślnie wszystkie)')
    parser.add_argument('--matches', default=None, help='Tylko te mecze (ID KALK po przecinku), np. 4116,4120')
    parser.add_argument('--mode', default='full', choices=['full', 'incremental'])
    parser.add_argument('--state', default=None, help='Plik JSON stanu dla trybu incremental')
    parser.add_argument('--output', default=None,
                        help='Plik .json (jeden sezon) lub katalog (<runId>-<seasonSlug>.json)')
    parser.add_argument('--budget', type=int, default=None, help='Twardy limit zapytań sieciowych')
    parser.add_argument('--rate', type=float, default=1.0, help='Minimalny odstęp między zapytaniami [s]')
    parser.add_argument('--cache-dir', default=os.environ.get('KALK_CACHE_DIR'))
    parser.add_argument('--cache-mode', default=None, choices=list(CACHE_MODES))
    parser.add_argument('--plan', action='store_true', help='Wypisz planowane adresy bez pobierania')
    parser.add_argument('--save-fixtures', default=None, help='Katalog na kopie pobranych stron HTML')
    parser.add_argument('-v', '--verbose', action='store_true')
    return parser.parse_args(argv)


def load_state(path):
    if not path:
        return {}
    try:
        with open(path, encoding='utf-8') as handle:
            data = json.load(handle)
    except FileNotFoundError:
        logging.warning('Brak pliku stanu %s — traktuję jak pusty', path)
        return {}
    if not isinstance(data, dict):
        raise ValueError('Plik stanu musi być obiektem JSON')
    return data


def main(argv=None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, stream=sys.stderr,
                        format='%(asctime)s %(levelname)s %(name)s: %(message)s', datefmt='%H:%M:%S')
    try:
        sections = normalize_sections(args.sections)
        state = load_state(args.state)
    except (ValueError, json.JSONDecodeError) as exc:
        logging.error('%s', exc)
        return 1
    matches = {m.strip() for m in args.matches.split(',') if m.strip()} if args.matches else None
    if matches and not all(m.isdigit() for m in matches):
        logging.error('--matches: oczekiwano numerycznych ID meczów')
        return 1
    if args.budget is not None and args.budget < 1:
        logging.error('--budget musi być dodatni')
        return 1
    cache_mode = args.cache_mode or ('read' if args.cache_dir else 'off')
    opts = SyncOptions(season=args.season, league=args.league, sections=sections, matches=matches,
                       mode=args.mode, state=state)
    http = KalkHttp(rate=args.rate, budget=args.budget, cache_dir=args.cache_dir, cache_mode=cache_mode,
                    save_fixtures_dir=args.save_fixtures, offline=args.plan)
    if args.plan:
        plan(http, opts)
        return 0
    return run_sync(http, opts, output=args.output)


if __name__ == '__main__':
    sys.exit(main())
