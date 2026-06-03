#!/usr/bin/env python3
"""
Targeted scrape — tylko wskazane URL-e meczów (uzupełnienie luk box score).

Użycie:
  KALK_GAP_URLS='https://.../mecz,...,0.html,https://...' python3 backend/scripts/kalk_scrape_gaps.py
  python3 backend/scripts/kalk_scrape_gaps.py 'https://.../mecz,...,0.html'
"""
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, List

import requests
from bs4 import BeautifulSoup

from kalk_parsers import parse_match_page

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

OUTPUT_FILE = Path(__file__).resolve().parents[1] / 'kalk_stats.json'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; BeKaPaKa-stats-gap-scraper/1.0)',
    'Accept-Language': 'pl-PL,pl;q=0.9'
}


def fetch_soup(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=60)
    resp.raise_for_status()
    resp.encoding = 'utf-8'
    return BeautifulSoup(resp.text, 'html.parser')


def load_existing() -> Dict:
    if not OUTPUT_FILE.is_file():
        return {}
    with OUTPUT_FILE.open('r', encoding='utf-8') as handle:
        return json.load(handle)


def merge_matches(existing: Dict, new_matches: List[Dict]) -> None:
    matches = list(existing.get('matches') or [])
    by_id = {str(m.get('id')): m for m in matches if m.get('id')}
    for parsed in new_matches:
        mid = str(parsed.get('id') or '')
        if not mid:
            continue
        by_id[mid] = parsed
    existing['matches'] = list(by_id.values())
    manifest = existing.setdefault('scrapeManifest', {})
    manifest['gapScrapeAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    manifest['gapMatchesAdded'] = len(new_matches)


def collect_urls() -> List[str]:
    env = os.environ.get('KALK_GAP_URLS', '').strip()
    urls = [u.strip() for u in env.split(',') if u.strip()]
    urls.extend(arg.strip() for arg in sys.argv[1:] if arg.strip().startswith('http'))
    return list(dict.fromkeys(urls))


def main() -> None:
    urls = collect_urls()
    if not urls:
        logging.error('Podaj URL-e: KALK_GAP_URLS lub argumenty CLI')
        sys.exit(1)

    scraped: List[Dict] = []
    for url in urls:
        try:
            soup = fetch_soup(url)
            parsed = parse_match_page(soup, url)
            scraped.append(parsed)
            logging.info('OK %s → id=%s', url, parsed.get('id'))
        except Exception as exc:
            logging.warning('Błąd %s: %s', url, exc)

    if not scraped:
        logging.error('Nie pobrano żadnego meczu')
        sys.exit(2)

    data = load_existing()
    if not data:
        data = {'version': 2, 'matches': [], 'schedule': [], 'players': []}

    merge_matches(data, scraped)
    data['timestamp'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)

    logging.info('Zapisano %d meczów (łącznie w pliku: %d)', len(scraped), len(data.get('matches', [])))


if __name__ == '__main__':
    main()
