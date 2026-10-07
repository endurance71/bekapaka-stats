# Design tokens BeKaPaKa — Digital 2.0

Jedynym źródłem palety, fontów, skali typografii i odstępów jest **[`packages/digital-design`](../packages/digital-design/)** (Brandbook 2.0, generowany z `tokens.json` przez `build_tokens.py`; nadrzędne decyzje: `CURRENT.source.md`). Poprzedni pakiet `packages/design-tokens` (1.0, złoto #ECA72C, gradient CTA, glass) został usunięty.

| Aplikacja | Import | Role semantyczne |
|-----------|--------|------------------|
| Strona publiczna (`site/`) | [`dist/tokens.css`](../packages/digital-design/dist/tokens.css) | [`site/app/styles/foundation.css`](../site/app/styles/foundation.css) |
| Panel (`frontend/`) | [`dist/tokens.css`](../packages/digital-design/dist/tokens.css) | [`frontend/src/styles/global.css`](../frontend/src/styles/global.css) — te same nazwy ról (`--bg`, `--surface`, `--text*`, `--line*`, `--brand*`, `--action*`, `--focus`, `--table-*`) + aliasy `--bkpk-*` dla klas Tailwind |

## Zasady

1. **Nie hardcoduj kolorów** w komponentach — klasy `*-bkpk-*`, klasy marki (`brand-red-500`, `ink-700`, `brand-stone-400`…) albo `var(--c-…)`.
2. **Zmiany brandu** wprowadzaj w `packages/digital-design/tokens.json` → `python3 build_tokens.py`; potem sprawdź **oba** produkty.
3. **Deploy** — po zmianie tokenów wdrażaj razem `bkpk-site-prod` i `bkpk-frontend-prod` (obraz panelu kopiuje `packages/digital-design`).
4. Fonty: wyłącznie **Barlow Condensed 800** (nagłówki, liczby, wyniki — wersaliki) i **Barlow 400/600** (tekst, etykiety). Pliki WOFF2: `site/app/fonts/` i `frontend/src/assets/fonts/` (bundlowane przez Vite).

## Paleta (płyta — motyw panelu)

| Token | Wartość | Użycie |
|-------|---------|--------|
| `--c-black` | `#0B0B0B` | Tło aplikacji, sidebar, nagłówek |
| `--c-ink-800` / `--c-ink-700` | `#161616` / `#1F1E1C` | Powierzchnia / powierzchnia podniesiona |
| `--c-ink-600` / `--c-ink-500` | `#2E2C29` / `#3A3632` | Linia / linia mocna |
| `--c-white` | `#F7F6F2` | Tekst |
| `--c-stone-200` / `--c-stone-400` | `#D8D4CC` / `#9C978F` | Tekst drugorzędny / metadane |
| `--c-red-500` | `#EF1734` | Marka: belki kickera, paski stroju, wypełnienia, wiersz BeKaPaKa |
| `--c-red-600` / `--c-red-700` | `#D9142F` / `#AE1027` | Akcja (CTA) / hover akcji |
| `--c-red-300` | `#FF5A6E` | Czerwień jako **tekst** na ciemnym tle |
| `--c-gold-500` | `#F4A816` | **Tylko** wyróżnienia: MVP, lider, rekord, medal, aktywna pozycja nawigacji, fokus |
| `--c-green-400` | `#3DBA6F` | Status pozytywny |

Kształt: brak zaokrągleń (w panelu `--radius-*` wyzerowane w `@theme`; `rounded-full` tylko dla awatarów i kropek). Ścięty róg: `.chamfer` (12 px, karty/portrety), `.chamfer-sm` (8 px, przyciski). Bez blur, poświat i gradientowych CTA.

## Panel (Tailwind v4)

Konfiguracja wyłącznie w `@theme` w `global.css` (plik `tailwind.config.ts` usunięto — Tailwind v4 go nie ładował, ~520 klas nie generowało CSS).

```tsx
// Powierzchnia i tekst
<div className="bg-bkpk-surface border border-bkpk-border-subtle text-bkpk-text-primary">
  <span className="kicker">Liga KALK</span>                 {/* 24×3 px czerwona belka + etykieta */}
  <p className="font-display text-4xl tabular-nums">86</p>  {/* liczby Condensed */}
  <span className="label-caps text-xs text-bkpk-text-muted">Punkty</span>
</div>

// Akcja: BkpkButton variant="primary" (czerwień akcji + ścięty róg 8 px)
<BkpkButton variant="primary">Zapisz</BkpkButton>
```

| Klasa / komponent | Rola |
|-------------------|------|
| `bkpk-primary` | Czerwień marki (#EF1734); `text-bkpk-primary` = #FF5A6E (kontrast) |
| `bkpk-medal-gold`, `bkpk-warning` | Złoto (wyróżnienie / ostrzeżenie) |
| `.bkpk-row-highlight` | Wiersz BeKaPaKa w tabeli: tło czerwone 14% + 4 px pasek |
| `.status-flag` | Obramowana flaga statusu |
| `.outline-text` | Kontur (przegrany wynik, numer w tle) |
| `.cut` | Cięcie BKPK — tylko wynik, numery, krótkie nagłówki |
| `bkpkActivePillClass` | Aktywny segment/filtr: inwersja (białe tło, czarny tekst) |
| `PageHeader`, `SectionHeading`, `PageContainer`, `PageLoader`, `JerseyStripes`, `BrandMark` | Prymitywy w `frontend/src/shared/ui/` |
| `shared/lib/chartTheme.ts` | Kolory wykresów: BeKaPaKa = czerwień, rywal/liga = stone-200, złoto = rekord |

## Kontrast / WCAG (płyta)

| Para | Kontrast |
|------|----------|
| `#F7F6F2` na `#0B0B0B` / `#161616` | 18,2 / 16,7 |
| `#D8D4CC` (secondary) na `#161616` | 12,2 |
| `#9C978F` (muted) na `#161616` / `#1F1E1C` | 6,2 / 5,7 |
| `#FF5A6E` (czerwony tekst) na `#161616` | 6,0 |
| `#EF1734` jako tekst na `#161616` | **4,2 — nie używać dla małego tekstu** |
| `#FFFFFF` na `#D9142F` (CTA) / `#AE1027` (hover) | 5,1 / 7,2 |
| `#F4A816` na `#0B0B0B` | 9,8 |
| `#3DBA6F` na `#161616` | 7,3 |

Kolor nigdy nie jest jedyną informacją: wygrana/porażka słowem lub literą (Z/P), forma = litera + kształt (pełny/kontur).

## Regresja (grep-gate)

```bash
# Musi zwrócić 0 trafień w panelu
rg -n "ECA72C|236, ?167, ?44|backdrop-blur|blur-(sm|md|lg|xl|2xl|3xl|\[)|shadow-bkpk-glow|font-(outfit|montserrat|inter|bebas)|bkp-gold" frontend/src
```

## Checklist QA wizualnego

- [ ] **Login** — herb 2.0, CTA czerwone ze ściętym rogiem, fokus złoty 3 px
- [ ] **Shell** — Sygnet 2.0 + wordmark, aktywna pozycja: złota belka; mobile: 2 px czerwona linia pod nagłówkiem, menu numerowane (Esc zamyka)
- [ ] **Pulpit** — liczby Condensed, kickery, forma Z/P (pełny/kontur)
- [ ] **Mecze** — wiersze data · para · wynik, BeKaPaKa po lewej, przegrany konturem
- [ ] **Liga KALK** — tabela jak `/tabela` na bekapaka.pl (pasmo nagłówka, zebra, wiersz BeKaPaKa)
- [ ] **Skład** — portret 4:5, numer konturem, pasek średnich
- [ ] **Wykresy** — `chartTheme.ts`, siatka ink-600, tooltip bez zaokrągleń
- [ ] **Taktyka** — boisko czytelne, drużyny rozróżnialne kolorem i etykietą
- [ ] **Administracja** — pola 48 px, tabele `.bkpk-table`, strefa resetu z lewym paskiem
