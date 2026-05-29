# Architektura BeKaPaKa Stats Hub

## Przegląd
Aplikacja to SPA (React + Vite) z lekkim backendem REST (Node.js + Express). Frontend pobiera dane z API i renderuje dashboardy, raporty meczowe i panel trenera.

## Warstwy
- Frontend (React): widoki Dashboard, Game Center, Roster, Trends, Strategy Room.
- Backend (Express): API do listy meczów, rosteru, importu raportów i notatek trenera.
- Dane (JSON/in-memory): prototypowe dane w `backend/sample-data.json`.

## Przepływ danych
1. Frontend pobiera dane przez `GET /dashboard`, `GET /games`, `GET /games/:id`, `GET /roster`.
2. Import raportu (`POST /import`) parsuje Markdown/JSON i zwraca podgląd lub zapisuje nowy mecz (`backend/parser.js`).
3. Scraping ligi KALK (`POST /api/scrape/kalk/div2/run`) pobiera tabelę, terminarz i statystyki zawodników przez Scrapling — szczegóły: [scraping.md](./scraping.md).
4. Wyniki i metryki są wyliczane w backendzie (eFG%, TS%, TO%, FT Rate).

## Metryki
Wzory w `backend/metrics.js`:
- eFG% = (FG + 0.5 * 3P) / FGA
- TS% = (0.5 * PTS) / (FGA + 0.44 * FTA)
- TO% = TO / (FGA + 0.44 * FTA + TO)
- FT Rate = FTA / FGA

## Rozszerzalność
- Dane można przenieść do Postgresa: przygotowane modele i strukturę JSON można zmapować na tabele (games, teams, players, player_stats).
- Backend trzyma logikę metryk i importu, więc migracja bazy nie zmienia frontendu.
