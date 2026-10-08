# Scraping KALK (v2) — Dywizja II

Źródło: [kalk-koszalin.com](https://www.kalk-koszalin.com) (platforma SportSync, od 2026-09-29). Pobieramy **wyłącznie Dywizję II**, sezony BeKaPaKa od **2023/2024**. Narzędzie: **Scrapling** + BeautifulSoup (`backend/scripts/requirements.txt`) — nie dodawaj innych klientów HTTP (axios/cheerio/requests).

Kontrakt danych skraper → import: [`docs/kalk-v2-contract.md`](kalk-v2-contract.md).

## Warstwy

| Warstwa | Pliki |
|---|---|
| Skraper (Python) | `backend/scripts/kalk_sync.py` (CLI) + pakiet `backend/scripts/kalk/` (`http`, `seasons`, `league`, `schedule`, `match_info`, `boxscore`, `pbp`, `resolve`, `players`, `teams`, `validate`, `pipeline`) |
| Import (Node) | `backend/kalk/v2/ingestSeason.js` (+ `mapBox`, `mapPlayer`, `validateBundle`, `resolveMatch`, `lock`) |
| Orkiestracja | `backend/kalk/v2/runSync.js` — stan z bazy → `kalk_sync.py` → walidacja → import pod blokadą advisory → `KalkSyncRun` |
| Audyt | `backend/kalk/v2/audit.js`, `backend/scripts/kalk-data-audit.js` |
| Odczyt dla panelu | `backend/kalk/v2/readModels.js` (`/api/games/:id/info`, `/play-by-play`, `/api/players/:id/career`) |

## Co pobieramy

| Strona KALK | Dane |
|---|---|
| `/liga/dywizja-ii/tabela?sezon=N` | tabela (forma, seria) |
| `/liga/dywizja-ii/terminarz?sezon=N` | wszystkie fazy (sezon zasadniczy, play-off, play-out, o miejsca), kolejki, data (epoch), hala, bilans przed meczem |
| `/liga/dywizja-ii/zawodnicy`, `/zespoly` | katalog zawodników i drużyn |
| `/mecz/{id}` | kwarty (+OT), przebieg co 5 min, liderzy, MVP, sędziowie/komisarz, źródła punktów (tylko mecze z PBP) |
| `/mecz/{id}/statystyki` | box score: min, 2/3/FG/FT, ZB A/O/S, AS, PRZ, STR, F, Fw, BL, BL otrzymane, EVAL, +/-, piątka, wiersz SUMA |
| `/mecz/{id}/akcja-po-akcji` | pełna chronologia (od 2026/27; starsze mecze nie mają PBP) |
| `/zawodnik/{slug}/statystyki`, `/profil` | statystyki wszystkich sezonów, pozycja, numer, wzrost (z daty urodzenia tylko rok) |
| `/druzyna/{id}/{slug}` | bilans wszech czasów, kwarty W–P, dogrywki, kapitan |

Numery sezonów (`?sezon=`): 47 = 2023/24, 48 = 2024/25, 49 = 2025/26, 50 = 2026/27. Mapa rzutów nie jest pobierana.

## Uruchamianie

| Kiedy | Jak |
|---|---|
| Panel → Administracja → „Uruchom pełny import danych” | `POST /api/scrape/kalk/div2/run` — sync **przyrostowy** aktywnego sezonu |
| Timer systemd na VPS (pon 07:30, wt 18:00) | `POST /api/internal/kalk/sync` (`X-Cron-Secret`) — przyrostowo; `?mode=resync` = pełny sezon |
| Brakujące mecze | `POST /api/scrape/kalk/gaps` (`matchIds[]` lub automatycznie z audytu) → `kalk_sync.py --matches` |
| Backfill / ręcznie | `docker exec -w /app bkpk-backend-prod node scripts/kalk-sync-v2.js --season history` |
| Import gotowego pliku | `node scripts/kalk-import-v2.js <plik.json> [--dry-run]` |
| Zamiana sezonu ze starej strony | `node scripts/kalk-replace-season.js --season 2025-2026 --bundle <plik> --dry-run` (potem bez `--dry-run`) |

Tryb przyrostowy: sonda tabeli i terminarza (hash) → pobiera tylko nowe/zmienione mecze, mecze z ostatnich 14 dni (KALK poprawia statystyki) i nowych zawodników. Typowo 4–40 zapytań. Pełny sezon: ~600–700 zapytań (1 zapytanie/s).

Katalog roboczy: `KALK_DATA_DIR` (produkcja: wolumen `./data/kalk` → `/data/kalk`): `runs/` (pliki JSON przebiegów), `cache/` (HTML, gzip), `state/`.

### CLI skrapera

```bash
cd backend/scripts
python3 kalk_sync.py --season current|all|2025-2026|49 [--sections league,schedule,matches,pbp,players,profiles,teams]
  [--matches 4116,4120] [--mode full|incremental] [--state state.json] [--output plik.json|katalog]
  [--budget N] [--rate 1.0] [--cache-dir DIR] [--cache-mode read|refresh|off] [--plan] [--save-fixtures DIR]
```

Kody wyjścia: 0 = zapisano (możliwe pominięcia w `manifest.failures` / `truncated`), 2 = nie pobrano stron ligi (brak pliku, baza bez zmian), 1 = złe argumenty.

## Walidacja i błędy

- Mecz łamiący inwariant (Σ punktów ≠ wynik, SUMA ≠ Σ wierszy, FGM/PTS/REB, Σ kwart, PBP) **nie trafia do bazy** — jest w `manifest.failures`, a przebieg ma status `partial`.
- Niespójności źródła, które nie blokują meczu, idą do `manifest.warnings`: „dogrywka bez remisu” (np. mecz 3205), walkower bez box score (np. 3438, 20:0).
- Wyjście atomowe (`.tmp` + rename); jeden sync naraz (Postgres advisory lock); każdy przebieg ma wpis `KalkSyncRun` (running / success / partial / error, licznik zapytań, manifest).

## Audyt danych KALK

```bash
node backend/scripts/kalk-data-audit.js --season <slug|all> [--strict] [--fail-on error|warn] [--json]
# produkcja
docker exec -w /app bkpk-backend-prod node scripts/kalk-data-audit.js --season all --strict
```

Kontrole meczu E1–E13 (box score vs terminarz, sumy, kwarty, przebieg, PBP vs box score, piątka, minuty, bloki, sekcje) i sezonu S1–S7 (brakujące mecze z linkami `/mecz/{id}`, tabela przeliczona z wyników, statystyki sezonowe vs logi, duplikaty, unikalność ID, aktualność syncu). Kod wyjścia 1 przy problemach w trybie `--strict`.

## Testy

```bash
cd backend/scripts && python3 -m unittest discover -p 'test_kalk_*.py' -v   # parsery na realnych stronach (tests/fixtures/kalk_v2)
cd backend && npm test -- --run                                             # import, audyt, odczyt
```

Fixtures to prawdziwe strony KALK (tylko `<title>` + `<main>`). Przy zmianie markupu KALK: zapisz nowe strony (`kalk_sync.py --save-fixtures`), popraw parser, podbij `PARSER_VERSION` (`kalk/pipeline.py`) — mecze zostaną przeparsowane przy kolejnym syncu.
