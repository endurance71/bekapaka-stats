# Scraping danych ligowych (KALK Dywizja II)

Dokumentacja pipeline pobierania danych z [kalk-koszalin.com](https://www.kalk-koszalin.com/) przy użyciu biblioteki **[Scrapling](https://github.com/D4Vinci/Scrapling)**.

## Przegląd

| Warstwa | Plik / komponent | Rola |
|---------|------------------|------|
| Pobieranie | `backend/scripts/kalk_scraper.py` | Scrapling + BeautifulSoup → `kalk_stats.json` |
| Orkiestracja | `backend/server.js` → `runScrapeImportPipeline` | Uruchamia Python, importuje JSON do DB |
| Import | `backend/dataStore.js` | `ingestLeagueTable`, `ingestLeagueSchedule`, `ingestKalkPlayers`, `syncPlayersFromKalk` |
| UI | `frontend/src/pages/Administration.tsx` | Przycisk „Uruchom pełny import danych” |
| Zależności | `backend/scripts/requirements.txt` | `scrapling`, `beautifulsoup4`, `requests` |

**Wyłącznie Scrapling (D4Vinci).** Katalog `backend/scrapers/` i scraper Node.js (`kalkScraper.js`, `kalkDiv2.js`) zostały usunięte — nie dodawaj ponownie `cheerio`/`axios` pod scraping KALK.

## Różnica: scraping KALK vs import protokołów

| | Scraping KALK | Import protokołów |
|---|---------------|-------------------|
| Źródło | Strona ligi (HTML) | Markdown/JSON wklejany w panelu |
| Kod | `kalk_scraper.py` | `backend/parser.js` |
| API | `POST /api/scrape/kalk/div2/run` | `POST /api/import` |
| Dane | Tabela ligowa, terminarz, statystyki zawodników | Pojedynczy mecz BeKaPaKa (boxscore) |
| Folder | — | `Protokoły/*.md` (wzorce formatu) |

## Źródło danych

- **Dywizja:** [dywizja-2](https://www.kalk-koszalin.com/dzial,dywizja-2,4.html)
- **Sekcje:** Tabela, Terminarz (kolejki), Statystyki indywidualne
- **Dodatkowo:** Terminarz zespołu BeKaPaKa (`klub,bekapaka-bobolice,222,2.html`) — scalany z terminarzem ogólnym

## Przepływ danych

```text
kalk-koszalin.com
        │
        ▼
kalk_scraper.py  (Scrapling Fetcher.get + fallback requests)
        │
        ▼
kalk_stats.json   (w katalogu nadrzędnym względem backend: ../kalk_stats.json)
        │
        ▼
runScrapeImportPipeline()
  ├── ingestLeagueTable(table)
  ├── ingestLeagueSchedule(schedule)   # deleteMany + create
  ├── ingestKalkPlayers(players)         # upsert KalkPlayer
  └── syncPlayersFromKalk()            # RosterPlayer ↔ KalkPlayer (BeKaPaKa)
```

### Bootstrap przy starcie backendu

Jeśli tabele `LeagueTeam`, `LeagueMatch` i `KalkPlayer` są puste, po ~5 s od startu serwera uruchamia się automatycznie `runScrapeImportPipeline('startup-bootstrap')`.

## Format `kalk_stats.json`

Plik generowany przez skrypt Python (przykład struktury):

```json
{
  "timestamp": "2026-05-28T13:11:50Z",
  "table": [
    {
      "name": "MŁODE WILKI",
      "matches": 10,
      "wins": 9,
      "losses": 1,
      "pointsFor": 739,
      "pointsAgainst": 479,
      "points": 19
    }
  ],
  "schedule": [
    {
      "date": "21-09-2025 14:40",
      "homeTeam": "EMET",
      "guestTeam": "BrdCrew",
      "scoreHome": 49,
      "scoreAway": 34,
      "isFinished": true,
      "roundUrl": "https://www.kalk-koszalin.com/..."
    }
  ],
  "players": [
    {
      "id_zawodnika": "zawodnikigor-gierlowski43340",
      "imie_nazwisko": "Gierłowski Igor",
      "druzyna": "PIWIARNIA BUMERANG",
      "mecze_rozegrane": 8,
      "punkty_suma": 272,
      "srednia_punktow": 34.0,
      "profile_url": "https://www.kalk-koszalin.com/zawodnik,...",
      "photo_url": "https://www.kalk-koszalin.com/public/image/zaw/big/..."
    }
  ]
}
```

### Mapowanie do bazy (Prisma)

| Pole JSON (`players`) | Model `KalkPlayer` |
|-----------------------|---------------------|
| `id_zawodnika` | `id` |
| `imie_nazwisko` | `name` |
| `druzyna` | `team` |
| `punkty_suma` | `pointsTotal` |
| `srednia_punktow` | `pointsAverage` |
| `mecze_rozegrane` | `matchesPlayed` |
| `profile_url` | `profileUrl` |
| cały obiekt | `raw` (JSON) |

| Pole JSON (`table`) | Model `LeagueTeam` |
|---------------------|-------------------|
| `name`, `matches`, `wins`, `losses`, `pointsFor`, `pointsAgainst`, `points` | pola 1:1 |

| Pole JSON (`schedule`) | Model `LeagueMatch` |
|------------------------|---------------------|
| `date`, `homeTeam`, `guestTeam`, `scoreHome`, `scoreAway`, `isFinished` | pola 1:1 (`date` parsowane w `ingestLeagueSchedule`) |

## API (admin)

Wymagane: token JWT użytkownika z rolą `ADMIN`.

Szczegóły odpowiedzi: [api.md](./api.md#kalk-div2--scraping).

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/scrape/kalk/div2/status` | Stan bieżący (`running`, `step`, `message`, `lastLog`, `lastFinishedAt`) |
| `POST` | `/api/scrape/kalk/div2/run` | Pełny scrape + import (timeout do 15 min) |

Przykład odpowiedzi po sukcesie:

```json
{
  "success": true,
  "source": "scrapling",
  "teams": 12,
  "matches": 83,
  "players": 140
}
```

Kody błędów:

- `409` — scraper już działa
- `500` — błąd Pythona, brak `kalk_stats.json`, błąd importu (szczegóły w `lastLog` ze statusu)

## Uruchomienie lokalne (dev)

```bash
cd backend
pip3 install -r scripts/requirements.txt
python3 scripts/kalk_scraper.py
# wynik: ../kalk_stats.json
```

W kontenerze Docker (produkcja):

```bash
docker compose -f docker-compose.prod.yml exec bkpk-backend \
  python3 /app/scripts/kalk_scraper.py
```

## Produkcja (VPS)

- Backend musi mieć **Python 3** i zależności z `requirements.txt` (obraz `backend/Dockerfile` instaluje je przy buildzie).
- Pełny deploy i ograniczenia względem MOYA: [vps-runbook.md](./vps-runbook.md).

## Zdjęcia zawodników

- Skrypt zapisuje `photo_url` z profilu KALK (często placeholder `empty.jpg`).
- Frontend (**Skład**, **Profil**) preferuje lokalne pliki `frontend/public/photos/{imie}-{nazwisko}.png`.
- URL z KALK jest używany tylko gdy nie zawiera `empty.jpg`.
- Po deployzie frontendu pliki w kontenerze muszą być czytelne dla Nginx (`chmod` w `frontend/Dockerfile.prod`).

## Walidacja danych (checklist)

Po `POST /api/scrape/kalk/div2/run` lub bootstrapie:

### Plik `kalk_stats.json`

```bash
# w kontenerze backendu
python3 -c "import json; d=json.load(open('/kalk_stats.json')); print(len(d.get('table',[])), len(d.get('schedule',[])), len(d.get('players',[])))"
```

Oczekiwane rzędy wielkości (sezon 2025/26): ~12 drużyn, ~80+ meczów, ~140 zawodników.

### Baza PostgreSQL

```sql
SELECT
  (SELECT COUNT(*) FROM "LeagueTeam") AS teams,
  (SELECT COUNT(*) FROM "LeagueMatch") AS matches,
  (SELECT COUNT(*) FROM "KalkPlayer") AS players;
```

### Reguły integralności

| Sprawdzenie | Oczekiwany wynik |
|-------------|------------------|
| `LeagueTeam`: null w polach liczbowych | 0 |
| `matches = wins + losses` | 0 wyjątków |
| `LeagueMatch`: puste nazwy drużyn | 0 |
| `isFinished=true` bez wyniku | 0 |
| `KalkPlayer`: ujemne statystyki | 0 |
| Duplikaty `(name, team)` | 0 grup |

### API smoke

```bash
curl -s http://127.0.0.1:4001/health
curl -s http://127.0.0.1:4001/api/league/table | jq length
curl -s http://127.0.0.1:4001/api/league/schedule | jq length
curl -s 'http://127.0.0.1:4001/api/league/scorers?limit=20' | jq length
```

## Rozwiązywanie problemów

| Objaw | Przyczyna | Działanie |
|-------|-----------|-----------|
| Scraper kończy się błędem timeout | Dużo kolejek / wolna strona KALK | Ponów; sprawdź logi w `/api/scrape/.../status` |
| `kalk_stats.json` brak | Skrypt nie doszedł do zapisu | Uruchom ręcznie `python3 scripts/kalk_scraper.py`, sprawdź stderr |
| Pusta tabela w panelu | Brak importu lub stara baza | Uruchom scrape z Administracji |
| Zdjęcia puste | KALK zwraca `empty.jpg` | Uzupełnij `frontend/public/photos/` |
| Stary scraper JS | Legacy | Upewnij się, że deploy zawiera tylko pipeline Scrapling |

## Powiązane dokumenty

- [api.md](./api.md) — endpointy REST
- [data-model.md](./data-model.md) — modele Prisma
- [vps-runbook.md](./vps-runbook.md) — VPS, MOYA, deploy
- [architecture.md](./architecture.md) — architektura aplikacji
