# Odbiór napraw lokalnych 2.0 — 6 października 2026

Raport: [RAPORT-NAPRAW.md](RAPORT-NAPRAW.md). Macierz 34 kryteriów: [acceptance-matrix.json](acceptance-matrix.json). Geometria: [responsive.json](responsive.json). Dostępność: [accessibility.json](accessibility.json).

## Odtworzenie testów

W `site`: `npm test`, `npm run typecheck`, `npm run lint`, `npm run preview:local`. Podgląd jest buildem produkcyjnym na loopback 3100; korzysta z publicznych danych backendu/CMS i lokalnego trybu przeglądu mediów. Nie publikuje zmian do CMS.

W `frontend`: `npm test -- --run`, `npm run build`. W `cms-app`: `npm test`, `npm run build`, `node scripts/repair-local-integration.cjs`. Ostatnie polecenie używa wyłącznie własnej tymczasowej bazy SQLite i portu 3137, losowych sekretów, usuwa swoją bazę po zakończeniu. Nie używa istniejącego `.tmp/data.db`.

Backend wymaga osobnej pustej bazy PostgreSQL. W tym odbiorze użyto klastra `/tmp/bkpk-repair-pg-20261006`, hosta 127.0.0.1, portu 54491 i bazy `bkpk_repair`, bez danych produkcyjnych. Najpierw `DATABASE_URL=postgresql://bkpk_repair@127.0.0.1:54491/bkpk_repair npx prisma migrate deploy` w `backend`, następnie `STUDIO_TEST_DATABASE_URL=postgresql://bkpk_repair@127.0.0.1:54491/bkpk_repair npx vitest run tests/unit`. Ustawienie STUDIO_TEST_DATABASE_URL uruchamia także testy integracji Studio, zamiast je pomijać.

Test rzeczywistego API uruchamia się z katalogu repozytorium: `DATABASE_URL=postgresql://bkpk_repair@127.0.0.1:54491/bkpk_repair REPAIR_TEST_DATABASE_URL=postgresql://bkpk_repair@127.0.0.1:54491/bkpk_repair node backend/tests/integration/repair-local.mjs`. Skrypt odmawia pracy poza wskazaną testową bazą. Lokalny podgląd strony musi działać z `SITE_REVALIDATE_SECRET=repair-local-revalidation-only`. To stała wyłącznie testowa; skrypt ustawia zgodną wartość dla swojego backendu, tworzy testowego administratora i mecz, weryfikuje PATCH/odczyt/rewalidację, usuwa własne rekordy.

Logi `*.txt` są zapisanym wynikiem tego odbioru. Lighthouse używał istniejącego narzędzia i odrębnego tymczasowego procesu headless Chromium/Brave; nie jest testem produkcji. JSON zachowuje dokładną wersję, ustawienia emulacji i pomiary. Nie uruchamiano deployu, pushu, scrapingu ani pracy na VPS.
