# Architektura BeKaPaKa Stats Hub

## Przegląd
System działa jako dwa niezależne frontendy:
- publiczna strona klubowa (`site`, Next.js) pod `bekapaka.pl`,
- panel operacyjny (`frontend`, React + Vite) pod `panel.bekapaka.pl`.

Obie warstwy korzystają z backendu REST (Node.js + Express), a warstwa publiczna dodatkowo pobiera treści redakcyjne z CMS (Strapi).

## Warstwy
- Site (Next.js): widoki publiczne klubu (newsy, wydarzenia, sponsorzy, dokumenty, prezentacja składu).
- Frontend panelowy (React): Dashboard, Game Center, Roster, Trends, Strategy Room.
- Backend (Express): API do tabeli ligi, rosteru, importu raportów i notatek trenera.
- CMS (Strapi): modele treści marketingowych i komunikacyjnych.
- Dane: PostgreSQL dla danych sportowych + SQLite w CMS dla treści redakcyjnych.

## Przepływ danych
1. Publiczna strona pobiera treści z CMS i dane sportowe z backendu.
2. Panel pobiera dane przez `GET /dashboard`, `GET /games`, `GET /games/:id`, `GET /roster`.
3. Import raportu (`POST /import`) parsuje Markdown/JSON i zwraca podgląd lub zapisuje nowy mecz (`backend/parser.js`).
4. Scraping ligi KALK (`POST /api/scrape/kalk/div2/run`) pobiera tabelę, terminarz i statystyki zawodników przez Scrapling — szczegóły: [scraping.md](./scraping.md).
5. Wyniki i metryki są wyliczane w backendzie (eFG%, TS%, TO%, FT Rate).

## Metryki
Wzory w `backend/metrics.js`:
- eFG% = (FG + 0.5 * 3P) / FGA
- TS% = (0.5 * PTS) / (FGA + 0.44 * FTA)
- TO% = TO / (FGA + 0.44 * FTA + TO)
- FT Rate = FTA / FGA

## Rozszerzalność
- Dane można przenieść do Postgresa: przygotowane modele i strukturę JSON można zmapować na tabele (games, teams, players, player_stats).
- Backend trzyma logikę metryk i importu, więc migracja bazy nie zmienia frontendu.
