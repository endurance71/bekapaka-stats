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

## KALK Div2 — scraping (Scrapling)

Wymaga nagłówka `Authorization: Bearer <token>` oraz roli **ADMIN**.

Pełna dokumentacja pipeline: [scraping.md](./scraping.md).

### Uruchomienie pełnego importu
`POST /api/scrape/kalk/div2/run`

Uruchamia `python3 backend/scripts/kalk_scraper.py` (biblioteka [Scrapling](https://github.com/D4Vinci/Scrapling)), zapisuje `kalk_stats.json`, importuje dane do tabel `LeagueTeam`, `LeagueMatch`, `KalkPlayer` i synchronizuje skład BeKaPaKa.

Response (200):
```json
{
  "success": true,
  "source": "scrapling",
  "teams": 12,
  "matches": 83,
  "players": 140
}
```

Błędy:

- `409` — `{ "error": "Scraper już działa." }`
- `500` — `{ "error": "<komunikat błędu>" }` (szczegóły w logu ze statusu)

Czas wykonania: do ok. 15 minut (timeout procesu Pythona).

### Stan skrapera (UI Administracja)
`GET /api/scrape/kalk/div2/status`

Response:
```json
{
  "running": false,
  "step": "idle",
  "message": "Zakończono pomyślnie",
  "lastFinishedAt": "2026-05-28T13:11:50.000Z",
  "lastLog": "[12:11:50] Import zakończony sukcesem.\n"
}
```

Pole `step` podczas pracy: `inicjalizacja` → `pobieranie` → `import-bazy` → `synchronizacja` → `idle` (lub `error`).

Pole `lastLog` zawiera ostatnie ~1000 linii logu (stdout/stderr skryptu i backendu).

### Dane ligowe po imporcie (publiczne API)

| Endpoint | Opis |
|----------|------|
| `GET /api/league/table` | Tabela ligowa |
| `GET /api/league/schedule` | Terminarz |
| `GET /api/league/scorers?limit=20` | Top strzelcy (`KalkPlayer`) |

## Analiza AI (Google Gemini)

Wymaga `GEMINI_API_KEY` na backendzie. Generacja: **ADMIN** + Bearer token.

| Endpoint | Opis |
|----------|------|
| `GET /api/ai/status` | Czy skonfigurowano klucz + model |
| `GET /api/ai/briefing` | Ostatni briefing (Markdown) |
| `POST /api/ai/briefing/generate` | Briefing tygodniowy (Dashboard) |
| `POST /api/games/:id/analyze` | Analiza meczu → `Game.aiSummary` |
| `POST /api/players/:id/analyze` | Plan rozwoju zawodnika (min. 3 mecze) |
| `POST /api/scouting/analyze?opponent=` | Raport scoutingu rywala |

Body (opcjonalnie): `{ "force": true }` — wymusza ponowne wywołanie API (pomija cache).

Błędy: `503` brak klucza, `400` za mało danych, `409` generacja już trwa.

Szczegóły: [ai-match-analysis-plan.md](./ai-match-analysis-plan.md).
