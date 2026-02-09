# API

## Health
`GET /health`

Response:
```json
{ "status": "ok" }
```

## Dashboard
`GET /dashboard`

Response:
```json
{
  "lastGame": { "id": "game-2026-01-18" },
  "fourFactors": { "efg": 0.44, "tovPct": 0.18, "orbPct": 0.29, "ftRate": 0.28 },
  "shootingForm": [{ "id": "game-2026-01-18", "opponent": "Grubik Team", "efg": 0.44 }]
}
```

## Games
`GET /games`

Response: lista meczów.

`GET /games/:id`

Response: pełny protokół meczu (nagłówek, boxscore, team stats, punkty w czasie, runy).

## Roster
`GET /roster`

Response: lista zawodników z metrykami sezonowymi.

## Import
`POST /import`

Body:
```json
{
  "format": "markdown",
  "content": "| ... |"
}
```

Response (Markdown):
```json
{ "message": "Wykryto Markdown...", "preview": [] }
```

Body (JSON):
```json
{
  "format": "json",
  "content": "{\"game\": { ... }}"
}
```

Response (JSON):
```json
{ "message": "Zaimportowano.", "game": { "id": "game-2026-01-18" } }
```

## Notatki trenera
`POST /coach-notes/:gameId`

Body:
```json
{ "note": "Treść notatki" }
```

## Tagi
`POST /tags/:gameId`

Body:
```json
{ "tag": "back-to-back" }
```

## Kalk Div2 snapshot
`GET /scrape/kalk/div2`

Response:
```json
{
  "source": "kalk-koszalin.com",
  "division": "dywizja-2-grupa-4",
  "url": "https://www.kalk-koszalin.com/dzial,dywizja-2,4.html",
  "fetchedAt": "2026-02-05T11:02:00.000Z",
  "recentMatches": [{ "homeTeam": "...", "awayTeam": "...", "homeScore": 0, "awayScore": 0 }],
  "upcomingMatches": [{ "homeTeam": "...", "awayTeam": "...", "date": "2026-02-15", "time": "18:30" }],
  "standings": [{ "rank": 1, "team": "...", "matches": null, "wins": null, "losses": null, "points": null, "ratio": null }]
}
```

### Uruchomienie skryptu
`POST /scrape/kalk/div2/run`

Uruchamia skrypt Pythona (`backend/scripts/kalk_scraper.py`) na VPS-ie. Zwraca status wykonania, fragmenty stdout/stderr i ścieżkę do `kalk_stats.json`.

Przykład odpowiedzi (status 200):
```json
{
  "message": "Zapisano 32 rekordów z KALK.",
  "summary": "Dodano 3 nowych zawodników: Jan Kowalski, Anna Nowak, Piotr Zieliński.",
  "total": 32,
  "newPlayers": ["Jan Kowalski", "Anna Nowak", "Piotr Zieliński"],
  "runId": "ckxyz"
}
```

Jeśli skrypt już działa, odpowiedź to 409 z komunikatem o oczekiwaniu na zakończenie poprzedniego uruchomienia. W przypadku błędu wyjściowego status to 500 z `logs`.

Ten endpoint uruchamia proces, który generuje `kalk_stats.json` (lista zawodników) *i* zapisuje dane w tabeli `KalkPlayer` w bazie danych oraz rejestruje historię w `KalkScrapeRun`. Komunikat końcowy zawiera listę nowych zawodników, a frontend może wyświetlić aktualny stan przez osobne żądanie statusu.

## Stan skrapera (widoczny w UI)
`GET /scrape/kalk/div2/status`

Response:
```json
{
  "running": false,
  "step": "idle",
  "message": "Brak aktywnego pobierania",
  "lastRunId": "ckxyz",
  "lastRunAt": "2026-02-05T11:02:00.000Z",
  "lastFinishedAt": "2026-02-05T11:05:12.000Z",
  "lastNewPlayers": ["Jan Kowalski", "Anna Nowak"]
}
```

Odpowiedź pokazuje, co aktualnie dzieje się w procesie (status: `fetching`, `processing`, `idle`, `error`) oraz jakie dane zostały dopisane przy ostatnim pobraniu.
