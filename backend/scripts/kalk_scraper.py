#!/usr/bin/env python3
"""
Kalk Koszalin Dywizja II stats scraper.

Pobiera stronę dywizji i wchodzi do zakładek Tabela, Terminarz i Statystyki indywidualne.
Dla każdego zawodnika z sekcji statystyk odwiedza profil i zapisuje: EVAL, sumę punktów,
średnią punktów oraz rozegrane mecze. Wynik trafia do `kalk_stats.json`.

Wymaga: requests, beautifulsoup4
"""

import json
import logging
import re
import time
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from scrapling.fetchers import Fetcher

BASE_URL = 'https://www.kalk-koszalin.com/'
DIVISION_PATH = 'dzial,dywizja-2,4.html'
RATE_LIMIT_SECONDS = 1.0
PAGE_ENCODING = 'utf-8'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/127.0.0.0 Safari/537.36',
    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
}
OUTPUT_FILE = Path(__file__).resolve().parents[2] / 'kalk_stats.json'

SECTION_KEYWORDS: Dict[str, List[str]] = {
    'tabela': ['tabela'],
    'terminarz': ['terminarz'],
    'statystyki': ['statystyki indywidualne', 'statystyki zawodników', 'statystyki']
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


def fetch_soup(session: requests.Session, url: str) -> BeautifulSoup:
    """Pobierz stronę przez Scrapling (z fallbackiem) i zwróć BeautifulSoup."""
    logging.info('Pobieram %s', url)
    time.sleep(RATE_LIMIT_SECONDS)
    text = None

    try:
        page = Fetcher.get(url, timeout=20000, stealthy_headers=True)
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
        response = session.get(url, headers=HEADERS, timeout=20)
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

def is_our_team(team_value: Optional[str]) -> bool:
    if not team_value:
        return False
    text = normalize_query(team_value)
    return any(keyword in text for keyword in OUR_TEAM_KEYWORDS)


def extract_profile_photo_url(session: requests.Session, profile_url: str) -> Optional[str]:
    """Pobiera URL zdjęcia z profilu zawodnika."""
    if not profile_url:
        return None
    try:
        profile_soup = fetch_soup(session, profile_url)
    except Exception as exc:
        logging.debug('Nie udało się pobrać profilu %s: %s', profile_url, exc)
        return None

    selectors = [
        'img[src*="/zaw/"]',
        'img[src*="zawodnik"]',
        'img[src*="players"]',
        'img[src*="zawodnicy"]',
        '.zawodnik img',
        '.player img',
        '#content img'
    ]

    for selector in selectors:
        for node in profile_soup.select(selector):
            src = node.get('src')
            if not src:
                continue
            src_lower = src.lower()
            if any(skip in src_lower for skip in ['logo', 'baner', 'banner', 'icon', 'facebook', 'twitter', 'koszalin.jpg', 'zos.jpg']):
                continue
            return urljoin(BASE_URL, src)
    return None


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
        photo_url = None
        image_node = row.find('img')
        if image_node and image_node.get('src'):
            photo_url = urljoin(BASE_URL, image_node['src'])
        if not photo_url:
            photo_url = extract_profile_photo_url(session, profile_url)
        
        # Zakładamy kolumny: Lp | Zawodnik | Drużyna | Punkty | Mecze | Średnia
        # Wiersz przykładowy: 1.|Gierłowski Igor|PIWIARNIA BUMERANG|272|8|34,00
        team = cells[2].get_text(strip=True)
        try:
            points = float(cells[3].get_text(strip=True).replace(',', '.'))
            matches = int(cells[4].get_text(strip=True))
            avg = float(cells[5].get_text(strip=True).replace(',', '.'))
        except:
            matches, points, avg = 0, 0, 0

        # Tylko proste dane do rankingu, bez wchodzenia w profile (za dużo requestów)
        players.append({
            'id_zawodnika': generate_player_id(profile_url, name),
            'imie_nazwisko': name,
            'druzyna': team,
            'mecze_rozegrane': matches,
            'punkty_suma': points,
            'srednia_punktow': avg,
            'profile_url': profile_url,
            'photo_url': photo_url
        })
    return players


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


def extract_team_schedule(soup: BeautifulSoup) -> List[Dict[str, any]]:
    """Extract schedule from team-specific page table."""
    table = soup.find('table')
    if not table:
        return []
    
    matches = []
    for row in table.find_all('tr'):
        if row.find('th'):
            continue
        cells = row.find_all('td')
        if len(cells) < 4:
            continue
        
        try:
            # Column structure: DATA | MECZ | WYNIK | FAZA
            date_str = cells[0].get_text(strip=True)
            match_text = cells[1].get_text(strip=True)
            score_text = cells[2].get_text(strip=True)
            
            # Parse teams from "TEAM1 - TEAM2" format (with inconsistent spacing)
            # Use regex to split on dash with optional spaces
            import re
            parts = re.split(r'\s*-\s*', match_text, maxsplit=1)
            if len(parts) == 2:
                home_team = parts[0].strip()
                guest_team = parts[1].strip()
            else:
                continue
            
            # Parse score
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
            
            matches.append({
                'date': date_str,
                'homeTeam': home_team,
                'guestTeam': guest_team,
                'scoreHome': score_home,
                'scoreAway': score_away,
                'isFinished': is_finished
            })
        except Exception as e:
            logging.warning(f"Error parsing team schedule row: {e}")
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
            continue
        try:
            soup = fetch_soup(session, url)
            logging.info('Sekcja %s zawiera %d tabel.', name, len(soup.find_all('table')))
        except requests.RequestException as exc:
            logging.warning('Błąd pobierania sekcji %s: %s', name, exc)

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
                                teams = teams_text.split('-')
                                home = teams[0].strip()
                                # Guest może mieć śmieci na końcu jeśli parsowanie contents[0] zawiodło
                                # Ale w strukturze HTML 'EMET ... - BrdCrew&nbsp;<div...'
                                # Więc split powinien dać 'BrdCrew' jako drugą część (ewentualnie pustą)
                                guest = teams[1].strip() if len(teams) > 1 else "?"
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
                                'roundUrl': round_url
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
                # Merge: prefer the date with time (the longer string)
                date_to_keep = existing.get('date') if len(existing.get('date', '')) > len(m.get('date', '')) else m.get('date')
                merged = {**existing, **m, 'date': date_to_keep}
                if 'roundUrl' in existing and 'roundUrl' not in merged:
                    merged['roundUrl'] = existing['roundUrl']
                merged_dict[key] = merged
            else:
                merged_dict[key] = m
        
        # Convert back to list
        schedule_matches = list(merged_dict.values())
        logging.info(f'Po połączeniu: {len(schedule_matches)} unikalnych meczów')
        
    except Exception as exc:
        logging.error(f'Błąd pobierania terminarza zespołu: {exc}')

    # --- ZAWODNICY (TOP STRZELCY) ---
    players_list = []
    stats_url = section_urls.get('statystyki')
    if stats_url:
        try:
            stats_soup = fetch_soup(session, stats_url)
            # Debugging table structure if extraction fails
            table = stats_soup.find('table')
            if table:
                 rows = table.find_all('tr')
                 logging.info(f"Tabela statystyk ma {len(rows)} wierszy.")
                 if rows and len(rows) > 1:
                     logging.info(f"Przykładowy wiersz statystyk: {rows[1].get_text(separator='|', strip=True)}")
            
            players_list = extract_all_players(session, stats_soup)
            logging.info('Pobrano statystyki %d zawodników z ligi.', len(players_list))
        except Exception as exc:
            logging.error('Błąd pobierania statystyk: %s', exc)

    final_data = {
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'table': league_table,
        'schedule': schedule_matches,
        'players': players_list
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as handle:
        json.dump(final_data, handle, ensure_ascii=False, indent=2)
    
    # Podsumowanie
    logging.info('=' * 60)
    logging.info('PODSUMOWANIE FAZY 7')
    logging.info('=' * 60)
    logging.info('Tabela: %d drużyn', len(league_table))
    logging.info('Mecze: %d spotkań', len(schedule_matches))
    logging.info('Zawodnicy: %d (wszyscy)', len(players_list))
    logging.info('Zapisano do: %s', OUTPUT_FILE)
    logging.info('=' * 60)


if __name__ == '__main__':
    main()
