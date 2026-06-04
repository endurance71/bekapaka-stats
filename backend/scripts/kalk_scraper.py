#!/usr/bin/env python3
"""
Kalk Koszalin Dywizja II stats scraper (v2 — KALK-only).

Pobiera: tabelę, play-out, terminarz (z linkami do meczów), wszystkie kategorie statystyk ligowych,
drużyny, przewinienia, box score każdego zakończonego meczu oraz log „mecz po meczu” kadry BeKaPaKa.
Wynik trafia do `kalk_stats.json`.

Wymaga: requests, beautifulsoup4, opcjonalnie scrapling
"""

import json
import logging
import re
import time
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from kalk_parsers import (
    PARSER_VERSION,
    discover_stat_category_urls,
    extract_category_stats_table,
    extract_match_id_from_url,
    extract_player_id_from_url,
    extract_team_page,
    extract_teams_index,
    extract_violations,
    is_our_team,
    parse_match_page,
    parse_player_game_log_page,
)

try:
    from scrapling.fetchers import Fetcher
    HAS_SCRAPLING = True
except ImportError as exc:
    import logging
    logging.warning('Scrapling import failed (%s). Falling back to requests only.', exc)
    HAS_SCRAPLING = False

BASE_URL = 'https://www.kalk-koszalin.com/'
DIVISION_PATH = 'dzial,dywizja-2,4.html'
RATE_LIMIT_SECONDS = 1.0
PAGE_ENCODING = 'utf-8'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/127.0.0.0 Safari/537.36',
    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
}
# Zapis obok backendu (/app/kalk_stats.json w kontenerze) — zgodnie z server.js
OUTPUT_FILE = Path(__file__).resolve().parents[1] / 'kalk_stats.json'

SECTION_KEYWORDS: Dict[str, List[str]] = {
    'tabela': ['tabela'],
    'tabela_play_out': ['tabela play out'],
    'terminarz': ['terminarz'],
    'statystyki': ['statystyki indywidualne', 'statystyki zawodników', 'statystyki'],
    'druzyny': ['drużyny', 'druzyny'],
}

STAT_KEYWORDS: Dict[str, List[str]] = {
  'punkty_suma': ['punkty', 'suma punktow', 'pkt', 'punkty ogolne'],
  'srednia_punktow': ['srednia punktow', 'srednia pkt', 'avg pkt', 'punkty na mecz'],
  'mecze_rozegrane': ['mecze', 'rozegrane mecze', 'liczba meczow', 'mecze rozegrane'],
  'eval': ['eval', 'wartosc eval', 'indeks eval', 'rating eval']
}

OUR_TEAM_KEYWORDS = ['bekapaka', 'bobolice', 'be ka paka']


def normalize_query(value: str) -> str:
    """Usuń diakrytyki i obniż tekst do porównań."""
    if not value:
        return ''
    normalized = unicodedata.normalize('NFD', value.lower())
    return ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')


def slugify(value: str) -> str:
    """Zamień tekst na prostą wersję ASCII, idealną na identyfikator."""
    normalized = unicodedata.normalize('NFD', value)
    cleaned = ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')
    slug = re.sub(r'[^a-z0-9]+', '-', cleaned.lower())
    return slug.strip('-') or 'player'


def parse_number(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    cleaned = value.replace(',', '.')
    cleaned = cleaned.strip()
    match = re.match(r'[-+]?\d+(\.\d+)?', cleaned)
    if not match:
        return None
    try:
        parsed = float(match.group(0))
    except ValueError:
        return None
    if parsed.is_integer():
        return int(parsed)
    return round(parsed, 2)


# --- ZMIENNE DO ŚLEDZENIA POSTĘPU ---
CURRENT_REQUESTS = 0
ESTIMATED_ROUNDS = 15
ESTIMATED_CATEGORIES = 5
ESTIMATED_TEAMS = 10
ESTIMATED_MATCHES = 80
ESTIMATED_OUR_PLAYERS = 12

actual_rounds_count = None
actual_categories_count = None
actual_teams_count = None
actual_matches_count = None
actual_our_players_count = None


def get_total_requests() -> int:
    total = 1  # division page
    total += 1  # table
    total += 1  # playout table
    total += 1  # schedule index
    total += (actual_rounds_count if actual_rounds_count is not None else ESTIMATED_ROUNDS)
    total += 1  # team schedule
    total += 1  # stats index
    total += (actual_categories_count if actual_categories_count is not None else ESTIMATED_CATEGORIES)
    total += 1  # druzyny index
    total += (actual_teams_count if actual_teams_count is not None else ESTIMATED_TEAMS)
    total += 1  # violations
    total += (actual_matches_count if actual_matches_count is not None else ESTIMATED_MATCHES)
    total += (actual_our_players_count if actual_our_players_count is not None else ESTIMATED_OUR_PLAYERS)
    return total


def fetch_soup(session: requests.Session, url: str) -> BeautifulSoup:
    """Pobierz stronę przez Scrapling (z fallbackiem) i zwróć BeautifulSoup."""
    global CURRENT_REQUESTS
    CURRENT_REQUESTS += 1
    total = get_total_requests()
    print(f"::PROGRESS:: {CURRENT_REQUESTS}/{total}", flush=True)

    logging.info('Pobieram %s', url)
    time.sleep(RATE_LIMIT_SECONDS)
    text = None

    if HAS_SCRAPLING:
        try:
            page = Fetcher.get(url, timeout=5000, stealthy_headers=True)
            text = (
                getattr(page, 'html', None)
                or getattr(page, 'content', None)
                or str(page)
            )
            if text:
                logging.info('Pobrano przez Scrapling')
        except Exception as exc:
            logging.warning('Scrapling failed (%s), fallback to requests', exc)

    if not text:
        response = session.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response.encoding = 'utf-8'
        text = response.text

    return BeautifulSoup(text, 'html.parser')


def find_section_url(soup: BeautifulSoup, keywords: List[str]) -> Optional[str]:
    normalized_keywords = [normalize_query(k) for k in keywords]
    for anchor in soup.find_all('a', href=True):
        text = normalize_query(anchor.get_text(' ', strip=True))
        if not text:
            continue
        if any(keyword in text for keyword in normalized_keywords):
            href = anchor['href']
            return urljoin(BASE_URL, href)
    return None


def generate_player_id(profile_url: str, name: str) -> str:
    parsed = urlparse(profile_url)
    candidate = parsed.path.rstrip('/').split('/')[-1]
    if candidate:
        return re.sub(r'[^A-Za-z0-9_-]', '', candidate)
    return slugify(name)


def extract_profile_stats(soup: BeautifulSoup) -> Dict[str, Optional[float]]:
    lines = [line.strip() for line in soup.get_text(separator='\n').splitlines() if line.strip()]
    normalized_keywords = {key: [normalize_query(word) for word in words] for key, words in STAT_KEYWORDS.items()}
    stats: Dict[str, Optional[float]] = {key: None for key in STAT_KEYWORDS}
    for line in lines:
        normalized_line = normalize_query(line)
        for key, keywords in normalized_keywords.items():
            if stats[key] is not None:
                continue
            if any(keyword and keyword in normalized_line for keyword in keywords):
                match = re.search(r'([-+]?\d+[.,]?\d*)', line)
                if match:
                    stats[key] = parse_number(match.group(1))
    return stats

def extract_all_players(session: requests.Session, soup: BeautifulSoup) -> List[Dict[str, any]]:
    """Pobiera skrócone dane wszystkich zawodników (do rankingu)."""
    table = soup.find('table')
    if not table:
        return []
    
    players = []
    for row in table.find_all('tr'):
        if row.find('th'): continue
        cells = row.find_all('td')
        if not cells or len(cells) < 4: continue
        
        link = row.find('a', href=True)
        if not link: continue
        
        name = link.get_text(strip=True)
        profile_url = urljoin(BASE_URL, link['href'])

        # Zakładamy kolumny: Lp | Zawodnik | Drużyna | Punkty | Mecze | Średnia
        # Wiersz przykładowy: 1.|Gierłowski Igor|PIWIARNIA BUMERANG|272|8|34,00
        team = cells[2].get_text(strip=True)
        try:
            points = float(cells[3].get_text(strip=True).replace(',', '.'))
            matches = int(cells[4].get_text(strip=True))
            avg = float(cells[5].get_text(strip=True).replace(',', '.'))
        except ValueError as e:
            logging.warning('Nie udało się sparsować statystyk dla zawodnika %s: %s. Ustawiam wartości domyślne 0.', name, e)
            matches, points, avg = 0, 0, 0

        # Tylko proste dane do rankingu, bez wchodzenia w profile (za dużo requestów)
        players.append({
            'id_zawodnika': generate_player_id(profile_url, name),
            'imie_nazwisko': name,
            'druzyna': team,
            'mecze_rozegrane': matches,
            'punkty_suma': points,
            'srednia_punktow': avg,
            'profile_url': profile_url
        })
    return players


def fetch_category_stats(session: requests.Session, url: str, category_name: str) -> Dict[str, Dict[str, any]]:
    try:
        soup = fetch_soup(session, url)
    except Exception as exc:
        logging.error('Błąd pobierania statystyk dla %s: %s', category_name, exc)
        return {}
    return extract_category_stats_table(soup, category_name)


def extract_league_table(soup: BeautifulSoup) -> List[Dict[str, any]]:
    table = soup.find('table')
    if not table: return []
    
    data = []
    # Parsowanie tabeli ligowej
    # Przykład wiersza: 1.|MŁODE WILKI|10|9|1|739|:|479|260|1.5428|19
    # 0: Lp, 1: Nazwa, 2: M, 3: Z, 4: P, 5: Zd, 6: :, 7: Str, 8: Różnica, 9: Stosunek, 10: Pkt
    for row in table.find_all('tr'):
        if row.find('th'): continue
        cells = row.find_all('td')
        if len(cells) < 10: continue
        
        try:
            name = cells[1].get_text(strip=True)
            matches = int(cells[2].get_text(strip=True))
            wins = int(cells[3].get_text(strip=True))
            losses = int(cells[4].get_text(strip=True))
            p_for = int(cells[5].get_text(strip=True))
            p_against = int(cells[7].get_text(strip=True))
            points = int(cells[-1].get_text(strip=True)) # Ostatnia kolumna to punkty
            
            data.append({
                'name': name,
                'matches': matches,
                'points': points,
                'wins': wins,
                'losses': losses,
                'pointsFor': p_for,
                'pointsAgainst': p_against
            })
        except:
            continue
    return data


def _find_mecz_link_in_row(cells) -> Tuple[Optional[str], Optional[str]]:
    """Link do strony meczu jest zwykle w kolumnie WYNIK (biały_link), nie w MECZ."""
    for cell in cells:
        for anchor in cell.find_all('a', href=True):
            href = anchor.get('href', '')
            if '/mecz,' in href or 'mecz,' in href:
                mecz_url = urljoin(BASE_URL, href)
                return mecz_url, extract_match_id_from_url(mecz_url)
    return None, None


def extract_team_schedule(soup: BeautifulSoup) -> List[Dict[str, any]]:
    """Extract schedule from team-specific page table (klub,...,2.html)."""
    table = soup.find('table')
    if not table:
        return []

    matches = []
    for row in table.find_all('tr'):
        if row.find('th'):
            continue
        cells = row.find_all('td')
        if len(cells) < 3:
            continue

        try:
            # Column structure: DATA | MECZ | WYNIK | FAZA
            date_str = cells[0].get_text(strip=True)
            match_text = cells[1].get_text(strip=True)
            score_text = cells[2].get_text(strip=True)
            phase = cells[3].get_text(strip=True) if len(cells) > 3 else None

            parts = re.split(r'\s*-\s*', match_text, maxsplit=1)
            if len(parts) != 2:
                continue
            home_team = parts[0].strip()
            guest_team = parts[1].strip()

            mecz_url, mecz_id = _find_mecz_link_in_row(cells)

            score_home, score_away = None, None
            is_finished = False
            if ':' in score_text and score_text.strip() != ':':
                score_parts = score_text.split(':')
                if len(score_parts) == 2:
                    try:
                        score_home = int(score_parts[0].strip())
                        score_away = int(score_parts[1].strip())
                        is_finished = True
                    except ValueError:
                        pass

            entry = {
                'date': date_str,
                'homeTeam': home_team,
                'guestTeam': guest_team,
                'scoreHome': score_home,
                'scoreAway': score_away,
                'isFinished': is_finished,
                'scheduleSource': 'club',
            }
            if phase:
                entry['phaseLabel'] = phase
            if mecz_url:
                entry['meczUrl'] = mecz_url
            if mecz_id:
                entry['meczId'] = mecz_id
            matches.append(entry)
        except Exception as e:
            logging.warning('Error parsing team schedule row: %s', e)
            continue

    return matches




def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    session = requests.Session()
    section_urls: Dict[str, Optional[str]] = {}
    try:
        division_soup = fetch_soup(session, urljoin(BASE_URL, DIVISION_PATH))
    except requests.RequestException as exc:
        logging.error('Nie udało się pobrać strony dywizji: %s', exc)
        return

    for name, keywords in SECTION_KEYWORDS.items():
        section_urls[name] = find_section_url(division_soup, keywords)

    for name, url in section_urls.items():
        if not url:
            logging.warning('Nie znaleziono linku do sekcji "%s".', name)
        else:
            logging.info('Znaleziono sekcję "%s": %s', name, url)

    # --- TABELA ---
    table_url = section_urls.get('tabela')
    league_table = []
    if table_url:
        try:
            table_soup = fetch_soup(session, table_url)
            # Debug
            table_node = table_soup.find('table')
            if table_node:
                 rows = table_node.find_all('tr')
                 logging.info(f"Tabela ligowa ma {len(rows)} wierszy.")
                 if len(rows) > 1:
                      logging.info(f"Nagłówek tabeli: {rows[0].get_text(separator='|', strip=True)}")
                      logging.info(f"Pierwszy wiersz: {rows[1].get_text(separator='|', strip=True)}")
            else:
                 logging.warning("Nie znaleziono <table> w sekcji tabela.")

            league_table = extract_league_table(table_soup)
            logging.info('Pobrano tabelę ligową: %d drużyn', len(league_table))
        except Exception as exc:
            logging.error('Błąd pobierania tabeli: %s', exc)

    # --- TABELA PLAY OUT ---
    playout_url = section_urls.get('tabela_play_out')
    playout_table = []
    if playout_url:
        try:
            playout_soup = fetch_soup(session, playout_url)
            playout_table = extract_league_table(playout_soup)
            logging.info('Pobrano tabelę play-out: %d drużyn', len(playout_table))
        except Exception as exc:
            logging.error('Błąd pobierania tabeli play-out: %s', exc)

    # --- TERMINARZ ---
    schedule_url = section_urls.get('terminarz')
    schedule_matches = []
    if schedule_url:
        try:
            # 1. Pobierz stronę główną terminarza, aby znaleźć linki do kolejek
            schedule_soup = fetch_soup(session, schedule_url)
            
            # Znajdź linki do kolejek (keyword: '?kolejka_id=')
            round_links = set()
            for a in schedule_soup.find_all('a', href=True):
                if 'kolejka_id=' in a['href']:
                    full_link = urljoin(BASE_URL, a['href'])
                    round_links.add(full_link)
            
            logging.info(f"Znaleziono {len(round_links)} kolejek w terminarzu.")
            global actual_rounds_count
            actual_rounds_count = len(round_links)

            # 2. Odwiedź każdą kolejkę i pobierz mecze
            # Sortuj linki, aby pobierać w kolejności (opcjonalne, ale ładniej w logach)
            sorted_rounds = sorted(list(round_links), key=lambda x: x.split('kolejka_id=')[-1])

            for round_url in sorted_rounds:
                try:
                    r_soup = fetch_soup(session, round_url)
                    
                    # Parsowanie meczów z divów (klasa .pusty2)
                    # Struktura:
                    # <div class="pusty2">
                    #   GOSPODARZ - GOŚĆ
                    #   <div class="data_meczu">DATA<br>GODZINA</div>
                    #   <a class="bialy_link">WYNIK</a>
                    # </div>
                    
                    matches_in_round = r_soup.find_all('div', class_='pusty2')
                    logging.info(f"Kolejka {round_url.split('=')[-1]}: znaleziono {len(matches_in_round)} meczów.")
                    
                    for m_div in matches_in_round:
                        try:
                            # Data i godzina
                            date_div = m_div.find('div', class_='data_meczu')
                            date_str = "0000-00-00 00:00"
                            if date_div:
                                # Tekst: "21-09-2025\n14:40"
                                parts = list(date_div.stripped_strings)
                                if len(parts) >= 2:
                                    date_str = f"{parts[0]} {parts[1]}"
                                elif len(parts) == 1:
                                    date_str = parts[0]
                            
                            # Wynik
                            score_link = m_div.find('a', class_='bialy_link')
                            score_text = score_link.get_text(strip=True) if score_link else "-:-"
                            mecz_url = urljoin(BASE_URL, score_link['href']) if score_link and score_link.get('href') else None
                            mecz_id = extract_match_id_from_url(mecz_url or '')
                            
                            # Zespoły - to jest trudniejsze, bo są bezpośrednio w divie jako tekst
                            # Pobierz cały tekst i usuń to, co w dzieciach
                            text_content = m_div.get_text(" ", strip=True) 
                            # text_content będzie zawierać wszystko: "EMET - BrdCrew 21-09-2025 14:40 49: 34 | Statystyki | Brak relacji"
                            # Musimy wyciągnąć nazwy zespołów. Zwykle są na początku przed datą.
                            
                            # Spróbujmy innej strategii: weźmy first child text node
                            teams_text = m_div.contents[0].strip() if m_div.contents else ""
                            # Czasem jest w &nbsp; więc strip może nie zadziałać idealnie na stringu
                            teams_text = teams_text.replace(u'\xa0', u' ')
                            
                            if '-' in teams_text:
                                parts = teams_text.split('-', 1)
                                home = parts[0].strip()
                                guest = parts[1].strip() if len(parts) > 1 else "?"
                            else:
                                home, guest = "?", "?"

                            # Parsowanie wyniku
                            score_home, score_away = None, None
                            is_finished = False
                            if ':' in score_text:
                                sparts = score_text.split(':')
                                if len(sparts) == 2 and sparts[0].strip().isdigit():
                                    score_home = int(sparts[0].strip())
                                    score_away = int(sparts[1].strip())
                                    is_finished = True

                            schedule_matches.append({
                                'date': date_str,
                                'homeTeam': home,
                                'guestTeam': guest,
                                'scoreHome': score_home,
                                'scoreAway': score_away,
                                'isFinished': is_finished,
                                'roundUrl': round_url,
                                'meczUrl': mecz_url,
                                'meczId': mecz_id,
                            })

                        except Exception as e:
                            logging.warning(f"Błąd parsowania meczu: {e}")
                            continue

                except Exception as e:
                    logging.error(f"Błąd pobierania kolejki {round_url}: {e}")

            logging.info('Pobrano terminarz: %d meczów (łącznie ze wszystkich kolejek)', len(schedule_matches))
        except Exception as exc:
            logging.error('Błąd pobierania terminarza: %s', exc)

    # --- TERMINARZ ZESPOŁU (BeKaPaKa specific) ---
    # Fetch team-specific schedule to ensure we have ALL matches
    team_schedule_url = 'https://www.kalk-koszalin.com/klub,bekapaka-bobolice,222,2.html'
    try:
        logging.info('Pobieram dedykowany terminarz zespołu BeKaPaKa...')
        team_soup = fetch_soup(session, team_schedule_url)
        team_matches = extract_team_schedule(team_soup)
        logging.info(f'Pobrano {len(team_matches)} meczów z terminarza zespołu')
        
        # Merge team matches with general schedule, preferring team data
        # Create a dict keyed by (date_only, home_normalized, guest_normalized) to deduplicate
        def extract_date_only(date_str: str) -> str:
            # 1. Try DD-MM-YYYY or DD.MM.YYYY
            match = re.search(r'(\d{2})[-.](\d{2})[-.](\d{4})', date_str)
            if match:
                return f"{match.group(3)}-{match.group(2)}-{match.group(1)}"
            # 2. Try YYYY-MM-DD or YYYY.MM.DD
            match = re.search(r'(\d{4})[-.](\d{2})[-.](\d{2})', date_str)
            if match:
                return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
            return date_str

        def normalize_team(name: str) -> str:
            n = normalize_query(name)
            if 'bekapaka' in n:
                return 'bekapaka'
            return n

        merged_dict = {}
        
        # First add general schedule
        for m in schedule_matches:
            key = (extract_date_only(m.get('date', '')), normalize_team(m.get('homeTeam', '')), normalize_team(m.get('guestTeam', '')))
            merged_dict[key] = m
        
        # Then overlay team schedule (which has more accurate data)
        for m in team_matches:
            key = (extract_date_only(m.get('date', '')), normalize_team(m.get('homeTeam', '')), normalize_team(m.get('guestTeam', '')))
            if key in merged_dict:
                existing = merged_dict[key]
                date_to_keep = existing.get('date') if len(existing.get('date', '')) > len(m.get('date', '')) else m.get('date')
                merged = {**existing, **m, 'date': date_to_keep}
                if existing.get('roundUrl') and not merged.get('roundUrl'):
                    merged['roundUrl'] = existing['roundUrl']
                # Terminarz klubu: link do /mecz/... jest w kolumnie WYNIK
                if m.get('meczUrl') and not merged.get('meczUrl'):
                    merged['meczUrl'] = m['meczUrl']
                if m.get('meczId') and not merged.get('meczId'):
                    merged['meczId'] = m['meczId']
                if existing.get('roundUrl'):
                    merged['scheduleSource'] = 'division+club'
                merged_dict[key] = merged
            else:
                merged_dict[key] = m
        
        # Convert back to list
        schedule_matches = list(merged_dict.values())
        logging.info(f'Po połączeniu: {len(schedule_matches)} unikalnych meczów')
        
    except Exception as exc:
        logging.error(f'Błąd pobierania terminarza zespołu: {exc}')

    # --- ZAWODNICY (TOP STRZELCY & INNE KATEGORIE) ---
    players_list = []
    stat_category_keys: List[str] = []
    stats_url = section_urls.get('statystyki')
    if stats_url:
        try:
            stats_soup = fetch_soup(session, stats_url)
            players_list = extract_all_players(session, stats_soup)
            players_dict = {p['id_zawodnika']: p for p in players_list}
            logging.info('Pobrano listę podstawową %d zawodników.', len(players_list))
            
            # Dynamiczne pobieranie dodatkowych kategorii
            cat_urls = discover_stat_category_urls(stats_soup, BASE_URL)
            global actual_categories_count
            actual_categories_count = len(cat_urls)
            stat_category_keys = list(cat_urls.keys())
            logging.info('Znalezione kategorie statystyk: %s', stat_category_keys)

            category_key_map = {
                'rebounds': 'zbiorki',
                'assists': 'asysty',
                'steals': 'prz',
                'blocks': 'bl',
                'three_pct': 'proc3',
            }

            for cat_name, cat_url in cat_urls.items():
                ingest_key = category_key_map.get(cat_name, cat_name)
                logging.info('Pobieram statystyki: %s', cat_name)
                cat_stats = fetch_category_stats(session, cat_url, ingest_key)
                for p_id, stats_data in cat_stats.items():
                    if p_id in players_dict:
                        players_dict[p_id].update(stats_data)
                    else:
                        players_dict[p_id] = {
                            'id_zawodnika': p_id,
                            'imie_nazwisko': p_id,
                            **stats_data,
                        }

            players_list = list(players_dict.values())
            logging.info('Pobrano i scalono statystyki %d zawodników z ligi.', len(players_list))
        except Exception as exc:
            logging.error('Błąd pobierania statystyk: %s', exc)

    # --- DRUŻYNY (indeks + strony klubów) ---
    teams_index: List[Dict[str, any]] = []
    teams_enriched: List[Dict[str, any]] = []
    try:
        druzyny_url = section_urls.get('druzyny') or urljoin(BASE_URL, 'poddzial,druzyny,31.html')
        druzyny_soup = fetch_soup(session, druzyny_url)
        teams_index = extract_teams_index(druzyny_soup, BASE_URL)
        global actual_teams_count
        actual_teams_count = len(teams_index)
        logging.info('Indeks drużyn: %d', len(teams_index))
        for team in teams_index:
            try:
                club_soup = fetch_soup(session, team['profile_url'])
                extra = extract_team_page(club_soup)
                teams_enriched.append({**team, **extra})
            except Exception as exc:
                logging.warning('Błąd strony klubu %s: %s', team.get('name'), exc)
                teams_enriched.append(team)
    except Exception as exc:
        logging.error('Błąd pobierania drużyn: %s', exc)

    # --- PRZEWINIENIA ---
    violations: List[Dict[str, any]] = []
    try:
        viol_url = urljoin(BASE_URL, 'poddzial,przewinienia,69.html')
        viol_soup = fetch_soup(session, viol_url)
        violations = extract_violations(viol_soup)
        logging.info('Przewinienia: %d wierszy', len(violations))
    except Exception as exc:
        logging.error('Błąd przewinien: %s', exc)

    # --- MECZE (box score) ---
    matches_scraped: List[Dict[str, any]] = []
    seen_match_ids = set()
    finished_with_url = [
        m for m in schedule_matches
        if m.get('isFinished') and m.get('meczUrl')
    ]
    unique_matches_count = len(set(m.get('meczId') for m in finished_with_url if m.get('meczId')))
    global actual_matches_count
    actual_matches_count = unique_matches_count
    logging.info('Pobieram box score dla %d zakończonych meczów...', len(finished_with_url))
    for m in finished_with_url:
        mid = m.get('meczId')
        if not mid or mid in seen_match_ids:
            continue
        seen_match_ids.add(mid)
        mecz_url = m['meczUrl']
        try:
            match_soup = fetch_soup(session, mecz_url)
            parsed = parse_match_page(match_soup, mecz_url)
            parsed['scheduleDate'] = m.get('date')
            parsed['roundUrl'] = m.get('roundUrl')
            matches_scraped.append(parsed)
        except Exception as exc:
            logging.warning('Błąd parsowania meczu %s: %s', mecz_url, exc)

    logging.info('Pobrano box score: %d meczów', len(matches_scraped))

    # --- LOGI MECZOWE KADRY BeKaPaKa (tab 3) ---
    player_game_logs: List[Dict[str, any]] = []
    our_players = [p for p in players_list if is_our_team(p.get('druzyna'))]
    global actual_our_players_count
    actual_our_players_count = len(our_players)
    logging.info('Log meczowy: %d zawodników BeKaPaKa', len(our_players))
    for p in our_players:
        profile_url = p.get('profile_url')
        if not profile_url:
            continue
        log_url = re.sub(r',(\d+),0\.html$', r',\1,3.html', profile_url)
        if log_url == profile_url:
            log_url = profile_url.replace(',0.html', ',3.html')
        try:
            log_soup = fetch_soup(session, log_url)
            rows = parse_player_game_log_page(log_soup, p.get('imie_nazwisko', ''))
            for row in rows:
                row['kalk_player_id'] = p.get('id_zawodnika')
                row['id_zawodnika'] = p.get('id_zawodnika')
            player_game_logs.extend(rows)
        except Exception as exc:
            logging.warning('Błąd logu meczowego %s: %s', p.get('imie_nazwisko'), exc)

    http_estimate = len(matches_scraped) + len(teams_enriched) + len(our_players) + 40

    final_data = {
        'version': 2,
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'scrapeManifest': {
            'parserVersion': PARSER_VERSION,
            'httpEstimate': http_estimate,
            'matchesScraped': len(matches_scraped),
            'playersCount': len(players_list),
            'teamsCount': len(teams_enriched),
            'playerGameLogRows': len(player_game_logs),
        },
        'statCategories': stat_category_keys,
        'table': league_table,
        'playout_table': playout_table,
        'schedule': schedule_matches,
        'players': players_list,
        'teams': teams_enriched,
        'matches': matches_scraped,
        'violations': violations,
        'playerGameLogs': player_game_logs,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as handle:
        json.dump(final_data, handle, ensure_ascii=False, indent=2)
    
    # Podsumowanie
    logging.info('=' * 60)
    logging.info('PODSUMOWANIE FAZY 7')
    logging.info('=' * 60)
    logging.info('Tabela: %d drużyn', len(league_table))
    logging.info('Tabela play-out: %d drużyn', len(playout_table))
    logging.info('Mecze: %d spotkań', len(schedule_matches))
    logging.info('Zawodnicy: %d (wszyscy)', len(players_list))
    logging.info('Mecze (box score): %d', len(matches_scraped))
    logging.info('Logi meczowe BeKaPaKa: %d wierszy', len(player_game_logs))
    logging.info('Zapisano do: %s', OUTPUT_FILE)
    logging.info('=' * 60)


if __name__ == '__main__':
    main()
