# Scraping danych ligowych (KALK Dywizja II)

Dokumentacja pipeline pobierania danych z [kalk-koszalin.com](https://www.kalk-koszalin.com/) przy użyciu biblioteki **[Scrapling](https://github.com/D4Vinci/Scrapling)**.

## Przegląd

| Warstwa | Plik / komponent | Rola |
|---------|------------------|------|
| Pobieranie | `backend/scripts/kalk_scraper.py` | Scrapling + BeautifulSoup → `kalk_stats.json` |
| Orkiestracja | `backend/server.js` → `runScrapeImportPipeline` | Uruchamia Python, importuje JSON do DB |
| Import | `backend/dataStore.js`, `backend/kalk/kalkIngest.js` | Liga + `ingestKalkTeams`, `ingestKalkMatches`, `ingestKalkPlayerGameLogs`, `syncPlayersFromKalk` |
| Parser meczu | `backend/kalk/parseMatchBoxScore.js` | HTML `/mecz,...,0.html` → box score JSON |
| UI | `frontend/src/pages/Administration.tsx` | Przycisk „Uruchom pełny import danych” |
| Zależności | `backend/scripts/requirements.txt` | `scrapling`, `beautifulsoup4`, `requests` |

**Wyłącznie Scrapling (D4Vinci).** Katalog `backend/scrapers/` i scraper Node.js (`kalkScraper.js`, `kalkDiv2.js`) zostały usunięte — nie dodawaj ponownie `cheerio`/`axios` pod scraping KALK.

## Źródło prawdy (KALK-only)

Import protokołów (`POST /api/import`, `backend/parser.js`, strona `/protocols`) jest **wyłączony** (HTTP 410). Jedyny pipeline danych meczowych i scoutingu to scraping KALK + import v2.

| API | Opis |
|-----|------|
| `POST /api/scrape/kalk/div2/run` | Pełny scrape + import (do ~15 min) |
| `POST /api/scrape/kalk/gaps` | Targeted scrape brakujących meczów (URL-e z body lub z audytu) |
| `GET /api/kalk/ingest-summary` | KPI + lista meczów BeKaPaKa bez box score (Admin) |
| `GET /api/kalk/audit` | Pełny raport audytu JSON (Admin) |

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
  ├── ingestLeagueTable(table + playout)
  ├── ingestLeagueSchedule(schedule)      # delta upsert, kalkMatchId z terminarza
  ├── ingestKalkPlayers(players)          # wszystkie kategorie ligowe
  ├── ingestKalkTeams(teams)
  ├── ingestKalkMatches(matches)          # box score → KalkMatch + LeagueMatch.details
  ├── ingestKalkPlayerGameLogs(logs)      # tab 3 kadry BeKaPaKa
  ├── KalkSyncRun (manifest)
  └── syncPlayersFromKalk()               # PPG/RPG z KalkPlayer
```

### Warstwy scrape (v2)

| Warstwa | HTTP (szac.) | Dane |
|---------|--------------|------|
| A — liga | ~35–45 | tabela, play-out, terminarz+kolejki, wszystkie `<select>` statystyk, drużyny, przewinienia |
| B — mecze | ~60–90 | każdy zakończony `/mecz,...,0.html` → `matches[]` |
| C — kadra | ~12–18 | `zawodnik,...,3.html` → `playerGameLogs[]` |

### Bootstrap przy starcie backendu

Jeśli tabele `LeagueTeam`, `LeagueMatch` i `KalkPlayer` są puste, po ~5 s od startu serwera uruchamia się automatycznie `runScrapeImportPipeline('startup-bootstrap')`.

## Format `kalk_stats.json`

Plik generowany przez skrypt Python (przykład struktury):

```json
{
  "version": 2,
  "timestamp": "2026-06-03T12:00:00Z",
  "scrapeManifest": {
    "parserVersion": "1.0.0",
    "httpCount": 120,
    "sections": ["tabela", "terminarz", "matches", "teams", "playerGameLogs"]
  },
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
      "meczId": "4601",
      "meczUrl": "https://www.kalk-koszalin.com/mecz,...",
      "roundUrl": "https://www.kalk-koszalin.com/..."
    }
  ],
  "teams": [{ "id": "222", "slug": "bekapaka-bobolice", "name": "BeKaPaKa Bobolice" }],
  "matches": [{ "id": "4601", "boxScore": { "teams": [] }, "isFinished": true }],
  "playerGameLogs": [{ "kalk_match_id": "4601", "id_zawodnika": "43340", "pts": 12 }],
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
| `POST` | `/api/scrape/kalk/gaps` | Pobranie wybranych meczów (`urls[]` lub URL-e z audytu) + `ingestKalkMatches` |
| `GET` | `/api/kalk/ingest-summary` | KPI importu + `bekapakaMissingBoxScore[]` |
| `GET` | `/api/kalk/audit` | Pełny audyt spójności danych |

Przykład odpowiedzi po sukcesie:

```json
{
  "success": true,
  "source": "scrapling",
  "version": 2,
  "kalkMatches": 72,
  "kalkMatchesLinked": 68,
  "playerGameLogs": 15,
  "playerGameLogsSkipped": 2,
  "players": 140
}
```

## Audyt danych KALK

Skrypt read-only (lokalnie lub w kontenerze):

```bash
node backend/scripts/kalk-data-audit.js
docker exec bkpk-backend-prod node scripts/kalk-data-audit.js
```

Sekcje raportu: mecze BeKaPaKa vs terminarz, braki box score, duplikaty `KalkPlayer`, legacy ID, gotowość API.

### Checklist po sync

| KPI | Oczekiwane |
|-----|------------|
| `bekapakaScheduleFinished` | Liczba rozegranych meczów BeKaPaKa w terminarzu |
| `bekapakaWithBoxScore` | Powinno być równe liczbie rozegranych (np. 15) |
| `playerGameLogsSkipped` | &lt; 5% wierszy z JSON (brak `KalkMatch` / `KalkPlayer` po migracji ID) |
| `duplicatePlayersCount` | 0 po `migrate-kalk-player-ids.js` |

Migracja legacy ID zawodników (jednorazowo):

```bash
node backend/scripts/migrate-kalk-player-ids.js --dry-run
node backend/scripts/migrate-kalk-player-ids.js
```

Targeted scrape luk:

```bash
KALK_GAP_URLS='https://www.kalk-koszalin.com/mecz,...,0.html' python3 backend/scripts/kalk_scrape_gaps.py
# lub POST /api/scrape/kalk/gaps (Admin) bez body — URL-e z audytu
```

### Ograniczenia

- **Dynamika meczu (5 min):** tylko jeśli KALK udostępnia kwarty w HTML (`quartersRaw` → `quarters`); brak danych 5-min w KALK — wykres kwartowy (krok 10 min) zamiast 5 min.
- **Scraper ligi:** domyślnie pobiera wszystkie zakończone mecze dywizji (scouting rywali); opcjonalnie `SCRAPE_SCOPE=bekapaka` w przyszłości.

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
