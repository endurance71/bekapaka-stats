# Plan synchronizacji KALK (Dywizja II) — architektura i harmonogram

Dokument planistyczny na koniec sezonu **2025/2026** i start **2026/2027** (wrzesień–październik 2026).  
Stan odniesienia: scraper `backend/scripts/kalk_scraper.py` (Scrapling), import w `server.js` / `dataStore.js`.

---

## 1. Cele

| Cel | Opis |
|-----|------|
| **Bez zdjęć z profili** | Usunąć `extract_profile_photo_url` i requesty na `/zawodnik,...` — UI i tak preferuje `frontend/public/photos/`. |
| **Pełne dane ligowe w DB** | Wszystko, co dziś ląduje w `kalk_stats.json`, trzymane w PostgreSQL (plus snapshoty), żeby zmieniać import/UI bez ponownego scrapingu historycznego. |
| **Sync cykliczny, bezpieczny** | Cron z ograniczoną liczbą requestów; brak masowego crawlowania w weekendy meczowe. |
| **Tylko zmiany** | Najpierw „probe” (hash / liczniki); pełny scrape tylko gdy coś się zmieniło. |
| **Tylko Dywizja II** | Jedna konfiguracja źródła (`dzial,dywizja-2,4.html`) — bez innych dywizji. |
| **Sezony** | Archiwum 2025/26, czysty start 2026/27 bez mieszania tabel i terminarzy. |

---

## 2. Diagnoza stanu obecnego

### 2.1 Co działa

- Pełny scrape ręczny: Admin → `POST /api/scrape/kalk/div2/run` (timeout 15 min).
- Bootstrap przy pustej bazie (~5 s po starcie backendu).
- Import: tabela (regular + play-out), terminarz (kolejki + merge BeKaPaKa), zawodnicy + 6 kategorii statystyk.
- Model `KalkScrapeRun` w Prisma — **funkcje `logKalkScrapeRun` / `getLatestKalkScrapeRun` nie są podpięte do pipeline**.

### 2.2 Krytyczne luki

| Luka | Skutek |
|------|--------|
| **Brak `seasonId` / roku sezonu** na `LeagueTeam`, `LeagueMatch`, `KalkPlayer` | Nowy sezon nadpisze lub zmiesza dane 2025/26 z 2026/27. |
| **`ingestLeagueSchedule` → `deleteMany` + insert** | Każdy import kasuje cały terminarz; brak historii, brak bezpiecznego delta-sync. |
| **Brak fingerprintów** | Zawsze pełny scrape (~dziesiątki–setki HTTP, zależnie od kolejek i zdjęć). |
| **Pobieranie zdjęć z profili** | Do +N requestów; mała wartość, duże ryzyko obciążenia / timeoutu. |
| **`roundUrl`, faza meczu** | Są w JSON (częściowo), nie w DB — trudniejsze debugowanie terminarza. |
| **Plik `kalk_stats.json` jako jedyne źródło pośrednie** | Po restarcie brak audytu „co przyszło z KALK w danym dniu” poza DB operacyjną. |
| **Brak cron na VPS** | Aktualizacje tylko ręcznie lub przy deploy / bootstrap. |

### 2.3 Czego świadomie **nie** scrapujemy (osobne pipeline)

- Protokoły / box score meczów BeKaPaKa → `parser.js` + `POST /api/import` + model `Game`.
- Statystyki per mecz rywali na KALK (link „Statystyki” przy meczu) — poza zakresem v1 syncu ligowego.

---

## 3. Docelowa architektura danych

### 3.1 Warstwy

```text
┌─────────────────────────────────────────────────────────────┐
│  Harmonogram (cron host / node-cron w backendzie)         │
│  → KalkSyncService (Node)                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   [PROBE]            [FULL SCRAPE]        [IMPORT]
   1–4 HTTP           Python scraper       dataStore (delta)
   hash sekcji        kalk_stats.json      + snapshot DB
```

### 3.2 Nowe / rozszerzone modele Prisma (propozycja)

```prisma
model KalkSeason {
  id           String   @id @default(cuid())
  slug         String   @unique  // "2025-2026", "2026-2027"
  divisionPath String   // "dzial,dywizja-2,4.html"
  isActive     Boolean  @default(false)
  startsAt     DateTime?
  endsAt       DateTime?
  createdAt    DateTime @default(now())
}

// Rozszerzenie istniejących:
model LeagueTeam {
  seasonId String
  season   KalkSeason @relation(...)
  @@unique([seasonId, name, phase])
}

model LeagueMatch {
  seasonId     String
  kalkRoundUrl String?  // opcjonalnie
  phaseLabel   String?  // z terminarza klubu
  @@unique([seasonId, date, homeTeam, guestTeam]) // lub hash stabilny
}

model KalkPlayer {
  seasonId String
  @@unique([seasonId, id])  // id z KALK + sezon
}

model KalkSectionSnapshot {
  id          String   @id @default(cuid())
  seasonId    String
  section     String   // "table" | "playout_table" | "schedule" | "players"
  contentHash String   // sha256 canonical JSON
  payload     Json     // pełna sekcja z ostatniego udanego importu
  fetchedAt   DateTime @default(now())
  @@unique([seasonId, section])
}

model KalkSyncRun {
  id            String   @id @default(cuid())
  seasonId      String?
  mode          String   // "probe" | "full" | "import-only"
  trigger       String   // "cron-monday" | "manual-admin" | ...
  status        String   // "running" | "success" | "skipped" | "error"
  httpEstimate  Int?
  sectionsChanged String[] // ["schedule","players"]
  probeHashes   Json?
  errorMessage  String?
  startedAt     DateTime @default(now())
  finishedAt    DateTime?
}
```

**Uwaga:** `KalkScrapeRun` można zmigrować do `KalkSyncRun` lub scalić pola.

### 3.3 Co trzymać w `payload` (snapshot)

| Sekcja | Zawartość | Po co |
|--------|-----------|--------|
| `table` / `playout_table` | tablica drużyn jak dziś | Porównania tygodniowe, AI scouting, rollback UI |
| `schedule` | mecze + `roundUrl` | Audyt terminarza, diff „nowe wyniki” |
| `players` | pełny rekord + pola kategorii | Rankings bez ponownego scrape |

Operacyjne tabele (`LeagueTeam`, …) = **projekcja** ostatniego snapshotu aktywnego sezonu (jak dziś dla UI).

---

## 4. Strategia synchronizacji (anti-blacklist)

### 4.1 Zasady ogólne

1. **User-Agent i rate limit** — zostawić 1 s między requestami; nie obniżać bez potrzeby.
2. **Maks. requestów na run** — twardy limit np. 80 (full) / 8 (probe); przerwać z logiem jeśli przekroczony.
3. **Brak równoległych runów** — już jest `scraperRunning`; rozszerzyć na `KalkSyncRun.status=running`.
4. **Weekendy (pt–nd)** — tylko **probe** (opcjonalnie wyłączone w sobotę/niedzielę); **bez** pełnego scrape i bez odwiedzania kolejek.
5. **Retry** — exponential backoff, max 2 ponowienia; po 3 błędach kolejnych — „circuit open” do następnego okna cron.

### 4.2 Kalendarz sezonowy (strefa `Europe/Warsaw`)

Zakładamy typowy rytm KALK: mecze **pt–nd**, aktualizacje strony **pon–śr**.

| Okno | Dni | Cron (propozycja) | Tryb |
|------|-----|-------------------|------|
| **Po weekendzie** | Pon 07:30 | `probe` → full tylko jeśli hash ≠ | Główne odświeżenie wyników |
| **Doprecyzowanie** | Wt 18:00 | `probe` → full jeśli zmiana | Poprawki statystyk / terminarza |
| **Kontrola** | Śr 12:00 | `probe` tylko | Tanie sprawdzenie |
| **Przed weekendem** | Czw 10:00 | `probe` → ewentualnie **tylko sekcja `schedule`** (przyszłe terminy) | Bez kasowania wyników |
| **Weekend** | Pt–Nd | **brak cron** lub nd 22:00 sam `probe` | Unikamy szczytu ruchu / meczów na żywo |
| **Off-season** (IV–VIII) | Pon 10:00 co 2 tyg. | `probe` | Wykrycie linku nowego sezonu / play-out |

**Sezon 2025/26 (koniec):** od czerwca 2026 przejść na tryb off-season + jeden **full freeze** (snapshot + `isActive=false` na sezonie).

**Sezon 2026/27:** po wykryciu nowego `divisionPath` / nowej tabeli (wrzesień 2026) — utworzyć `KalkSeason` `2026-2027`, `isActive=true`, **nie** importować do starego `seasonId`.

### 4.3 Probe (lekki) — algorytm

**Requesty (3–4):**

1. Strona dywizji — czy linki sekcji się nie zmieniły (opcjonalnie).
2. **Tabela** — hash: `JSON.stringify(sorted teams by name + points + wins + matches)`.
3. **Terminarz** — strona główna terminarza bez wchodzenia w kolejki: hash = liczba linków `kolejka_id=` + tekst ostatniej kolejki jeśli widoczny na liście.
4. **Statystyki** — pierwsza tabela: hash = `count(rows)` + top-3 `(id, punkty_suma, mecze)`.

Jeśli **którykolwiek** hash ≠ zapisany w `KalkSectionSnapshot` → oznacz sekcję w `sectionsChanged` → uruchom **full scrape tylko zmienionych sekcji** (faza 2 optymalizacji scrapera).

Faza 1 (szybsza do wdrożenia): probe tylko decyduje full vs skip; full nadal pobiera wszystko, ale **rzadziej**.

### 4.4 Full scrape — optymalizacje kodu

| Zmiana | Efekt |
|--------|--------|
| Usunąć `extract_profile_photo_url` | −0…140 HTTP |
| Usunąć podwójne `fetch_soup` w pętli discovery (linie 429–437) | −3–4 HTTP |
| Parametr CLI `--sections=table,schedule,players` | Full tylko dla zmienionych sekcji |
| Parametr `--skip-team-schedule` poza sezonem BeKaPaKa | Opcjonalnie |
| Nie odwiedzać `tabela_play_out` jeśli link brak | Już częściowo |

---

## 5. Import do bazy (delta zamiast wipe)

### 5.1 Tabela drużyn

- `upsert` po `(seasonId, name, phase)` — bez zmian filozofii.

### 5.2 Terminarz

Zamiast `deleteMany`:

```text
Dla każdego meczu ze scrape:
  klucz = (seasonId, dateDay, normalize(home), normalize(guest))
  upsert wynik + isFinished
Mecze w DB sezonu, których nie ma w źródle przez 30 dni:
  oznacz archived / soft-delete (opcjonalnie) — NIE usuwać od razu w trakcie sezonu
```

### 5.3 Zawodnicy

- Upsert jak dziś; `raw` bez `photo_url` lub z null.
- Przy nowym sezonie: nowe `id` z KALK mogą się zmienić — `syncPlayersFromKalk` tylko dla aktywnego sezonu + ręczne mapowanie w panelu jeśli potrzeba.

---

## 6. Cron na VPS (BeKaPaKa, bez MOYA)

### 6.1 Opcja A — cron hosta (zalecane na start)

W `/etc/cron.d/bekapaka-kalk` (użytkownik root lub deploy):

```cron
# Europe/Warsaw — probe poniedziałek
30 7 * * 1 root curl -fsS -X POST -H "Authorization: Bearer $CRON_TOKEN" https://panel.bekapaka.pl/api/internal/kalk/sync?mode=auto >> /var/log/bekapaka-kalk-sync.log 2>&1
```

- Endpoint **wewnętrzny** `POST /api/internal/kalk/sync` z `CRON_SECRET` (nie JWT admina).
- `mode=auto` → probe → full jeśli potrzeba.

### 6.2 Opcja B — `node-cron` w `server.js`

- Prościej w dev, ale restart backendu resetuje timery; gorzej niż host cron na produkcji.

### 6.3 Opcja C — GitHub Actions schedule

- Możliwe, ale wymaga sekretu i wywołania publicznego API — mniej kontroli nad IP VPS.

**Rekomendacja:** A na produkcji + ręczny przycisk w Admin jak dziś.

---

## 7. Harmonogram wdrożenia (fazy)

### Faza 0 — szybkie (1–2 dni, przed końcem play-off)

- [ ] Usunąć pobieranie zdjęć z profili w `kalk_scraper.py`.
- [ ] Podpiąć `logKalkScrapeRun` / nowy `KalkSyncRun` do pipeline (status, czas, liczby).
- [ ] Zaktualizować `docs/scraping.md` (play-out, kategorie, brak zdjęć).

### Faza 1 — sezon w DB (1 tydzień)

- [ ] Migracja Prisma: `KalkSeason`, `seasonId` na ligowych tabelach.
- [ ] Seed: `2025-2026` active; backfill istniejących wierszy.
- [ ] API league: filtrować po aktywnym sezonie (`GET /api/league/season`).

### Faza 2 — snapshoty + probe (1–2 tygodnie)

- [ ] `KalkSectionSnapshot` + zapis po udanym imporcie.
- [ ] Skrypt `kalk_probe.py` lub flaga `--probe-only` w scraperze.
- [ ] `KalkSyncService` w Node: auto / manual / cron.

### Faza 3 — delta import + sekcje (2 tygodnie)

- [ ] `ingestLeagueSchedule` → upsert per sezon.
- [ ] Scraper: `--sections=...`.
- [ ] Limity HTTP + circuit breaker.

### Faza 4 — zamknięcie sezonu 2025/26 (czerwiec 2026)

- [ ] Full scrape + snapshot „final”.
- [ ] `KalkSeason.isActive = false` dla `2025-2026`.
- [ ] Eksport CSV/JSON archiwum (opcjonalnie backup poza DB).

### Faza 5 — start 2026/27 (wrzesień–październik 2026)

- [ ] Monitor probe: wykrycie nowej tabeli (inna liczba drużyn / zmiana URL dywizji).
- [ ] Utworzenie `2026-2027`, przełączenie `isActive`.
- [ ] Pierwszy full scrape nowego sezonu; pusta baza meczów dla nowego `seasonId`.
- [ ] Komunikat w panelu Admin: „Nowy sezon — sprawdź mapowanie składu”.

---

## 8. Wykrywanie nowego sezonu (heurystyki)

| Sygnał | Akcja |
|--------|--------|
| Zmiana URL w menu dywizji (`find_section_url` inny niż w config sezonu) | Alert admin + aktualizacja `divisionPath` |
| Skok liczby meczów w dół (>50%) przy tym samym slug | Prawdopodobnie nowy terminarz — **nie** nadpisywać starego sezonu |
| Data pierwszego meczu > 1 lipca 2026 i sezon aktywny to 2025-2026 | Zaproponować migrację sezonu |
| Ręczny przycisk „Rozpocznij sezon 2026/27” w Admin | Tworzy rekord + przełącza active (najbezpieczniejsze v1) |

---

## 9. Metryki i alerty

| Metryka | Źródło |
|---------|--------|
| Ostatni udany sync | `KalkSyncRun.finishedAt` |
| Ostatni skip (brak zmian) | `status=skipped` |
| Liczba HTTP / czas trwania | log scrapera + `httpEstimate` |
| Różnica wyników po weekendzie | diff snapshot `schedule` (mecze z `isFinished` false→true) |

Alert (mail/Telegram — opcjonalnie): 3 kolejne błędy probe lub brak syncu >7 dni w sezonie.

---

## 10. Szacunek obciążenia po optymalizacji

| Scenariusz | HTTP (szac.) | Częstotliwość |
|------------|--------------|----------------|
| Probe | 3–4 | 2–3× w tygodniu |
| Full (bez zdjęć, 18 kolejek, 6 kategorii) | ~35–45 | tylko gdy probe wykryje zmianę (~1–2×/tydz. w sezonie) |
| Pełny import ręczny Admin | jak full | rzadko |

Vs dziś: każdy run ≈ 50–200+ requestów przy każdym uruchomieniu.

---

## 11. Decyzje produktowe (zatwierdzone)

| Temat | Decyzja |
|-------|---------|
| **Archiwum w UI** | Tak — **każdy zawodnik** ma selektor sezonu na profilu (`/players/:id`) i w lidze; dane z protokołów filtrowane po zakresie dat sezonu. |
| **Przełączanie sezonu** | **Per zawodnik** — `PlayerSeasonPreference` + `localStorage`; API `PUT /api/players/:id/season`. |
| **Cron** | **Host cron → `127.0.0.1:4001`** (bkpk-backend), nagłówek `X-Cron-Secret`. Hermes opcjonalnie wywołuje ten sam URL (monitoring). MOYA i port 3000 nietknięte. |
| **Play-out** | Ten sam `seasonId`, faza `playout` w `LeagueTeam.phase`. |

---

## 12. Powiązane pliki

| Plik | Rola |
|------|------|
| `backend/scripts/kalk_scraper.py` | Scrape |
| `backend/server.js` | `runScrapeImportPipeline` |
| `backend/dataStore.js` | Import |
| `docs/scraping.md` | Operacje bieżące |
| `docs/vps-runbook.md` | Deploy, porty, MOYA |

---

*Ostatnia aktualizacja planu: 2026-06-01. Kolejny krok implementacyjny: Faza 0 (usunięcie zdjęć + logowanie runów).*
