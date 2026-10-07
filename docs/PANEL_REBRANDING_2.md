# Panel BeKaPaKa 2.0 — raport refaktoryzacji wizualnej

Data: 7.10.2026 · Gałąź: `feat/panel-digital-2` (z `origin/main`) · Zakres: `frontend/` (panel.bekapaka.pl)
Wzorzec: bekapaka.pl (Website 2.0, [raport](BEKAPAKA_REBRANDING_2_FINAL.md)) i Brandbook 2.0 (`backend/studio/brand/CURRENT.md`, `02_system/tokens.json`).
Zrzuty przed / po: [`docs/qa/panel-2-0-2026-10-07/`](qa/panel-2-0-2026-10-07/) (`przed-*`, `po-*`, 1440 i 375 px).

**Zasada:** zmieniona wyłącznie warstwa prezentacji — trasy, role, API, hooki, konteksty, propsy komponentów, teksty i `aria-*` bez zmian (wyjątki wymienione niżej).

## Weryfikacja

- `npm test -- --run` — 3 pliki, 6/6 testów.
- `npm run build` — OK; fonty WOFF2 i znaki SVG trafiają do `dist/assets`.
- `tsc --noEmit` — 15 błędów, wszystkie zastane (na `main` było 19; 4 naprawione przy okazji). CI nie uruchamia `tsc`.
- 12 tras (Pulpit, Mecze, Mecz, Liga, Skład, Zawodnik, Mój profil, Analizy, Scouting, Taktyka, AI, Admin) przy 375 px: brak poziomego przepełnienia, brak awarii, brak błędów konsoli. Menu mobilne: wszystkie pozycje + „Wyloguj” mieszczą się przy 375×812, Esc zamyka.
- Grep-gate z [`design-tokens.md`](design-tokens.md#regresja-grep-gate): 0 trafień (`#ECA72C`, złote rgba, blur, poświaty, fonty 1.0, kolory palety Tailwind).
- Kontrast WCAG AA dla wszystkich par ról — tabela w `design-tokens.md`.

## Zmieniono

### Fundament
- Tokeny: `packages/digital-design/dist/tokens.css` (jak strona) zamiast wycofanego `packages/design-tokens` (pakiet usunięty, `Dockerfile.prod` kopiuje `digital-design`).
- Role semantyczne o tych samych nazwach co na stronie + aliasy `--bkpk-*`, dzięki którym ~2000 istniejących klas Tailwind przeszło na nowe barwy bez przepisywania: primary = czerwień #EF1734 (tekst #FF5A6E), złoto tylko dla wyróżnień i fokusu.
- `tailwind.config.ts` usunięty — Tailwind v4 go nie ładował, więc ~520 użyć klas (`border-bkpk-border-strong`, `bg-bkpk-surface-tint-*`, `bg-bkpk-danger-fill`, `text-caption`…) nie generowało CSS. Wszystkie są teraz w `@theme`.
- Promienie wyzerowane w `@theme` (`rounded-full` zostaje), bez blur i poświat; `shadow-xl/2xl` = cień overlay marki.
- Fonty: Barlow + Barlow Condensed (WOFF2, lokalnie) zamiast Google Fonts (Bebas/Inter/Montserrat/Outfit).
- PWA: ikony z Sygnetu 2.0 (w tym maskable), `theme-color` #0B0B0B, cache service workera `bkpk-stats-v2`.

### Komponenty (`frontend/src/shared/ui/`)
- Nowe: `BrandMark` (Sygnet 2.0 + wordmark), `JerseyStripes`, `PageHeader`, `SectionHeading`, `PageContainer`, `PageLoader`; `shared/lib/chartTheme.ts` (jeden motyw wszystkich wykresów).
- `BkpkButton` / `BkpkCard` — to samo API; czerwona akcja ze ściętym rogiem 8 px, płaskie płyty z linią 1 px.
- `MatchCard` jako wiersz terminarza (data · para · wynik), BeKaPaKa zawsze po lewej, przegrany konturem, wynik słowem.
- `PlayerCard` jako portret 4:5 z numerem konturem i paskiem średnich (bez efektu 3D/hologramu).
- Fokus 3 px złoty globalnie (usunięte lokalne `outline-none` i ringi).

### Shell
- Sidebar: Sygnet 2.0 + wordmark, kompaktowy wiersz zawodnika — wszystkie pozycje nawigacji mieszczą się (wcześniej duża karta profilu spychała Taktykę/Analizy/AI/Admin poza widok), aktywna pozycja ze złotą belką.
- Nagłówek mobilny z 2 px czerwoną linią; menu pełnoekranowe numerowane 01…09 jak na stronie.
- Login: układ płyta + formularz, herb 2.0 (stary herb klubowy z `logo.png` nie jest już używany w UI — zgodnie z Brandbookiem herb klubowy to dokumenty).

### Ekrany
- Pulpit, Mecze, Mecz, Skład, Profil, Zawodnik, Liga, Analizy, Scouting, AI, Taktyka, Administracja — `PageHeader`, kickery, liczby Condensed, tabele jak `/tabela` na stronie (pasmo nagłówka, zebra, wiersz BeKaPaKa z czerwonym paskiem), forma Z/P jako kwadraty (pełny/kontur), wykresy przez `chartTheme`, pola formularzy 48 px.
- Taktyka: paleta boiska i przewodnika stref w jednym obiekcie stałych z barw marki; atak = czerwone tokeny, obrona = ciemne tokeny z etykietą D1–D5.

## Świadome odstępstwa od „zero zmian”

| Zmiana | Powód |
|--------|-------|
| `KalkEmptyState`: link `/administration` → `/admin` | martwa trasa |
| `PlayerProfile`: średnie przez `formatStatFixed` | strona wywracała się (`toFixed` na `null`) dla zawodników bez statystyk — także na `main` |
| Menu mobilne zamyka się klawiszem Esc | jak na bekapaka.pl (dostępność) |
| Kickery nad tytułami („Centrum drużyny”, „Sezon”) i flaga „Wygrana/Porażka” w meczu | Brandbook: wynik słowem, nie tylko kolorem |
| Terminarz ligi: BeKaPaKa u góry, etykieta GOSP./GOŚĆ zawsze widoczna | Brandbook „BeKaPaKa zawsze po lewej”; informacja o gospodarzu zachowana |
| Boisko taktyczne nie używa `zone.color` z presetów | presety w `backend/lib/playbookPresets.js` mają barwy spoza marki; strefy rozróżnia etykieta |
| Cele dotykowe podniesione do 44 px (przełączniki, stopka, ikony w adminie) | wytyczne strony |

## Do zrobienia poza tym zakresem

- Forma W/P w tabeli ligi wymaga pola w `/api/league/table` (endpoint jej nie zwraca).
- Zdjęcia `frontend/public/photos/*.png` mają 3,6–6,2 MB (2048 px) — warto przygotować WebP ~600 px.
- `GameDetail` nie ma `h1` (nazwy drużyn to `h2`, jak przed zmianą).
- 15 zastanych błędów `tsc` (m.in. `BasketballCourtCanvas`, `PreGameMatchCard`, `SynergyMatrix`, `TacticsHub`, `Profile`, typy testów) — warto dodać `tsc` do CI po ich naprawie.
- Presety playbooka w backendzie: przenieść kolory stref na paletę marki, jeśli mają wrócić do rysowania.

## Deploy

Bez deployu w ramach tej gałęzi. Po merge: obraz `bkpk-frontend-prod` (CI `.github/workflows/deploy.yml`); wg [`docs/docker-deploy.md`](docker-deploy.md). Klienci PWA dostaną nowe zasoby dzięki zmianie nazwy cache service workera.
