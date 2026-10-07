# BeKaPaKa Website 2.0 — plan redesignu

Podstawa: [audyt](BEKAPAKA_REBRANDING_2_AUDIT.md). Źródło marki: Brandbook 2.0 + tom WWW (`BeKaPaKa - brand/05_brandbook`). Makiety tomu WWW traktujemy jako materiał pomocniczy, nie projekt.

---

## 1. Art direction — „Program meczowy”

Strona 2.0 to **cyfrowy program meczowy klubu**: coś między wydrukowanym programem dnia meczu, lokalną gazetą sportową i tablicą wyników w hali. Nie dashboard, nie szablon klubowy.

Trzy materiały, zero „kart dla zasady”:

| Materiał | Rola | Jak wygląda |
|---|---|---|
| **Płyta** (#0B0B0B) | dane i emocja: mecz, wynik, tabela, skład | wielka cięta typografia, czerwień tylko na akcji/V, linie 1 px zamiast ramek |
| **Papier** (#F3F1EC) | czytanie: aktualności, artykuł, partnerzy | czarny „nadruk”, kolumny rozdzielone liniami jak w gazecie, zdjęcia bez ramek |
| **Strój** (V, paski, numer) | podpis marki | paski stroju jako separator pasm, V jako znak „vs” i krawędź, numer zawodnika jako grafika |

Charakter: **gęsta, pewna typografia + duże powietrze tylko tam, gdzie coś jest ważne.** Skala jest głównym narzędziem hierarchii: wynik i godzina meczu 2–3× większe niż cokolwiek innego na ekranie.

Inspiracja poziomem (nie layoutem): programy meczowe klubów piłkarskich, sportowe wydania gazet weekendowych, plakaty Nike Basketball w ich dyscyplinie typograficznej — nie w efektach.

---

## 2. Design principles

### 01. Pięć pytań, jedna kolejność
Brandbook: każda publikacja odpowiada na jedno pytanie. Strona główna odpowiada na pięć — w kolejności, w jakiej zadaje je kibic: **Kiedy gramy? → Jak poszło? → Co się wydarzyło? → Kto gra? → Kto nas wspiera?** Pytanie jest etykietą pasma, odpowiedź — jego treścią.

### 02. Wynik to nagłówek
Wynik, godzina i numer zawodnika są składane jak tytuły: cięte cyfry BKPK, największa skala na ekranie, BeKaPaKa zawsze po lewej, przegrywający konturem. Nigdy w małej tabelce jako jedyne miejsce.

### 03. Linia zamiast pudełka
Domyślnym separatorem jest linia 1 px i odstęp, nie tło i ramka. Kafel jest dopuszczalny tylko dla elementu, który jest **samodzielnym linkiem z obrazem** (np. zawodnik). Grupy treści to kolumny i wiersze, jak w gazecie.

### 04. Materiał mówi, jak czytać
Płyta = patrz (dane). Papier = czytaj (tekst). Zmiana materiału na pełną szerokość zastępuje ramki sekcji. Maks. dwa pasma płyty pod rząd.

### 05. Strój w krawędziach
DNA stroju A pojawia się w miejscach konstrukcyjnych: paski stroju jako separator pasm i nad stopką, V jako znak „kontra” w meczu, numer zawodnika za sylwetką. Nigdy jako tapeta, gradient czy poświata.

### 06. Jedna czerwień, jedno złoto
Czerwień = akcja i mecz (CTA, LIVE, V, belka własnego wiersza). Złoto = wyróżnienie (aktywna nawigacja, lider statystyki, focus na płycie). Wszystko inne jest czernią, bielą i szarością.

### 07. Puste nie udaje danych
Brak meczu, wyniku czy zdjęcia ma własny, uczciwy stan („Czekamy na terminarz”, numer zamiast portretu). Nigdy „0:0” czy „0.0” jako dane.

---

## 3. Nowa architektura strony głównej

| # | Pasmo | Materiał | Treść | Zastępuje |
|---|---|---|---|---|
| 1 | **Kiedy gramy?** — `MatchHero` | płyta + zdjęcie hali | pełna szerokość; po lewej rywalizacja (znak + „BEKAPAKA” / V „kontra” / tarcza + rywal) w skali Display XL; po prawej data, **godzina cięta w skali Score**, hala, wstęp wolny, odliczanie (bez sekund), „Dodaj do kalendarza” + „Szczegóły meczu”; paski stroju na dole | ticker + bento (3 kafle) |
| 2 | **Jak poszło?** — `ResultBand` | płyta | po lewej (7 kol.) ostatni wynik `Score` w skali ~180 px, status (Wygrana/Porażka), kolejka, data, link; po prawej (5 kol.) pozycja w tabeli jako cięta cyfra + skrócona tabela (5 wierszy wokół BeKaPaKa) | kafel „1 MIEJSCE”, tabela w „Sezon i drużyna” |
| 3 | **Co się wydarzyło?** — `StoryLead` + `StoryItem` + `StoryRow` | papier | historia wiodąca 7/5 (duże zdjęcie, tytuł H1-skala), dwie drugorzędne w kolumnie z linią, dalej feed tekstowy (data · kategoria · tytuł) | 3 równe karty |
| 4 | **Kto gra?** — `StatLeaders` | płyta | czterech liderów sezonu (punkty, zbiórki, asysty, EVAL): portret, wielki numer konturem, wartość jako Stat; kolumny rozdzielone liniami; link „Cały skład” | 4 karty z mikro-badge |
| 5 | **Kto nas wspiera?** — `PartnerWall` + zaproszenie | papier | ściana logotypów (komórki z linią 1 px, równe pole optyczne), obok zaproszenie: 1,5% / zostań partnerem | siatka białych kafli + 2 karty wsparcia |
| — | Stopka | płyta, paski stroju u góry | znak główny, zdanie o klubie, nawigacja, kontakt, wsparcie, cięty „BEKAPAKA” jako podpis | 4 kolumny |

Usunięte z home: ticker, „Sezon i drużyna”, osierocony link do klubu, dwie karty transakcyjne wsparcia (pełne dane przelewu zostają na `/klub#wsparcie`).

Stany: brak najbliższego meczu → hero przechodzi w „Ostatni mecz” lub wydarzenie z CMS; brak wyników → pasmo 2 pokazuje tylko tabelę; brak statystyk → liderzy znikają, zostaje link do składu.

---

## 4. Zasady layoutu

- **Siatka**: 4 / 8 / 12 kolumn (tokeny `--cols`, `--gutter`, `--margin`), kontener treści `min(1280px, 100% − 2×margin)`.
- **Szeroki kontener** `--container-wide: 1440px` tylko dla kompozycji hero meczu i wyniku — na 1920 px treść nie „tonie” w czerni.
- **Pasma full-bleed**: każde pasmo to tło na całą szerokość + kontener. Brak sekcji-pudełek.
- **Odstępy pasm**: `--section-pad` (56 / 72 / 96 px); hero i wynik mają własną, większą skalę (`--band-pad-lg`).
- **Tekst czytany**: `min(68ch, 720px)`.
- **Wyrównanie**: do lewej krawędzi kontenera. Wyśrodkowane: tylko 404 i puste stany.
- **Asymetria**: główne podziały 7/5 i 8/4 (nie 6/6), żeby zawsze było wiadomo, co jest pierwsze.
- **Breakpointy**: 768 (tablet), 1024 (laptop, hamburger do 1099), 1280 (desktop), 1600 (duży desktop — skalowanie display przez `clamp`).

---

## 5. Design system

### 5.1 Kolory (role semantyczne)

Warstwy: paleta marki (`packages/digital-design/dist/tokens.css`, generowana z `tokens.json`) → **role semantyczne** (`site/app/styles/foundation.css`) → komponenty. Komponenty używają wyłącznie ról.

| Rola (brief) | Token | Płyta | Papier |
|---|---|---|---|
| background | `--bg` | #0B0B0B | #F3F1EC |
| background-muted | `--bg-muted` | #121212 | #EAE7E0 |
| surface | `--surface` | #161616 | #FFFFFF |
| surface-elevated | `--surface-elevated` | #1F1E1C | #FFFFFF + `--shadow-raised` |
| text-primary | `--text` | #F7F6F2 | #0B0B0B |
| text-secondary | `--text-secondary` | #D8D4CC | #2E2C29 |
| text-muted | `--text-muted` | #9C978F | #5C5852 |
| border | `--line` / `--line-strong` | #2E2C29 / #3A3632 | #D8D4CC / #0B0B0B |
| brand-primary | `--brand` | #EF1734 (V, LIVE) | #D9142F |
| brand-secondary | `--brand-gold` | #F4A816 | #9A6400 (tylko tekst ≥ 14 px) |
| accent (akcja) | `--action` / `--action-hover` | #D9142F / #AE1027 | jw. |
| success | `--success` | #3DBA6F | #1F7A45 |
| warning | `--warning` | #F4A816 | #9A6400 |
| danger | `--danger` | #FF5A6E | #AE1027 |
| focus | `--focus` | złoto | czerń |

### 5.2 Typografia (11 ról)

| Rola | Klasa | Krój | Rozmiar (mobile → desktop) | Użycie |
|---|---|---|---|---|
| Display XL | `.t-display-xl` | Condensed 800 | `clamp(56px, 9vw, 168px)` | nazwy drużyn w hero, podpis stopki |
| Display | `.t-display` | Condensed 800 | 56 → 96 | H1 stron, nazwisko w profilu |
| H1 | `.t-h1` | Condensed 800 | 40 → 64 | tytuł artykułu, historia wiodąca |
| H2 | `.t-h2` | Condensed 800 | 32 → 44 | tytuł pasma |
| H3 | `.t-h3` | Condensed 800 | 24 → 30 | tytuły historii drugorzędnych, nazwiska |
| Body Large | `.t-lead` | Barlow 400 | 19 → 22 | lead, opis pasma |
| Body | `.t-body` | Barlow 400 | 17 → 18 | treść |
| Small | `.t-small` | Barlow 400 | 14 → 16 | metadane, podpisy |
| Label | `.t-label` | Barlow 600 wersaliki | 13 → 14, tracking .12em | etykiety, kickery, nagłówki tabel |
| Stat | `.t-stat` | Condensed 800, tabular | 40 → 64 | wartości statystyk, pozycja |
| Score | `.t-score` | Condensed 800, cięcie BKPK | `clamp(80px, 12vw, 200px)` | wynik, godzina meczu, numer zawodnika |

Zasada: komponent nie definiuje `font-size` — wybiera rolę.

### 5.3 Odstępy
Skala 4 px z tokenów (`--space-1` … `--space-32`). Komponenty używają tylko tokenów. Pasma: `--section-pad`, `--band-pad-lg = calc(var(--section-pad) * 1.5)`.

### 5.4 Promienie i krawędzie
`0` wszędzie. Ścięty róg (`clip-path`) **12 px** — kadry zdjęć wiodących i portretów; **8 px** — przyciski. Pigułka wyłącznie dla kropki LIVE. Linie: `1px` (separator), `2px` (belka nawigacji/nagłówek), `3px` (focus, aktywny stan), `4px` (własny wiersz tabeli).

### 5.5 Prymitywy layoutu
`Band` (pasmo full-bleed z materiałem i opcjonalnymi paskami), `.container` / `.container--wide`, `BandHead` (kicker-pytanie + H2 + link), `.grid-7-5`, `.grid-8-4`, `.rule-list` (lista rozdzielona liniami), `.stack`.

---

## 6. Architektura komponentów

```
components/public/
  layout/      PublicShell · MainNav · MobileMenu · SiteFooter · PreviewBanner
  primitives/  Band · BandHead · PageHeader · JerseyStripes · Score · Kicker
  match/       MatchHero · ResultBand · FixtureRow · TeamMark · Countdown · CalendarActions
  news/        StoryLead · StoryItem · StoryRow · NewsCard (listing)
  team/        PlayerCard · StatLeaders · PlayerProfile
  standings/   StandingsBoard (compact | full)
  partners/    PartnerWall · PartnerLogo
  support/     SupportInvite (home) · FsmmSupportSection (/klub) · DonationQrModal
  shared/      ArticleMarkdown · ArticleImageCarousel · ShareActions · EmptyState · DataStateNotice · FallbackImage · icons
```

- Jeden `Score` w całym serwisie (home, `/mecze`, `/mecze/[slug]`, artykuły z wynikiem).
- Jeden `PageHeader` zastępuje `ListingPageHero` + dwa szablony listingów.
- `MatchCard` z trzema markupami → `MatchHero` (najbliższy/szczegóły), `ResultBand`/`ScoreLine` (wynik), `FixtureRow` (terminarz). Wspólne: `resolvePresentation`, `TeamMark`, `Score`.
- CSS w warstwach `@layer foundation, components, content, pages` w czterech plikach zamiast monolitu.

---

## 7. Strategia responsywna

| Element | < 768 | 768–1023 | ≥ 1024 |
|---|---|---|---|
| Nawigacja | 60 px, przycisk menu 44×44, menu pełnoekranowe | jw. | pełna od 1100 px, 72 px |
| Hero meczu | rywalizacja w pionie (znak 56 px + nazwa), godzina pod spodem, przyciski na pełną szerokość | 2 kolumny węższe | 7/5 |
| Wynik | „tablica wyników”: dwa wiersze drużyna — liczba | jw. | linia wyniku w poziomie |
| Tabela (compact) | # · drużyna · M · Pkt | + W · P | + bilans |
| Historie | wiodąca na pełną szerokość, drugorzędne jako wiersze z miniaturą po prawej | 2 kolumny | 7/5 + feed |
| Liderzy | siatka 2×2 | 4 w rzędzie | 4 w rzędzie z liniami |
| Partnerzy | 2 kolumny | 3 kolumny | 5 kolumn |
| Skład | 2 kolumny | 3 | 4–5 |
| Terminarz | wiersz → blok (data nad drużynami) | wiersz | wiersz |

Cele dotykowe ≥ 44 px, treść ≥ 16 px, etykiety ≥ 13 px.

---

## 8. Motion

Tokeny `--dur-*`, `--ease-*` z brandbooka.
- **Hero**: V „kontra” odsłaniany maską (600 ms, raz). Paski stroju rysowane `scaleX` od lewej (400 ms).
- **Linki/historie**: podkreślenie tytułu (160 ms), zoom zdjęcia 3% na hover.
- **Dane**: tylko przenikanie 240 ms; bez liczenia w górę.
- **LIVE**: pulsująca kropka 1,6 s.
- Bez parallax, karuzel z automatem, bibliotek animacji. `prefers-reduced-motion: reduce` → bez animacji i przejść.

## 9. Wydajność

- Bez nowych zależności; CSS w 4 plikach (cel ≤ 50 KB gz łącznie), bez `backdrop-filter`.
- LCP: zdjęcie hali w hero przez `next/image` z `priority`/`fetchPriority=high`, `sizes=100vw`; tekst hero renderowany SSR.
- Fonty: 3 pliki WOFF2 (bez zmian), `display: swap`.
- Obrazy: `next/image` z wymiarami (bez CLS), `loading=lazy` poza LCP.
- Usunięcie nieużywanych assetów (~1,3 MB) i ~700 linii martwego TSX.

## 10. Kolejność wdrażania

1. **Fundament**: `foundation.css` (role, typografia, layout), prymitywy `Band`/`BandHead`/`PageHeader`/`Score`/`JerseyStripes`, header, menu, stopka.
2. **Home**: `MatchHero`, `ResultBand` (+ tabela compact), historie, `StatLeaders`, `PartnerWall` + zaproszenie.
3. **Treści**: listing aktualności, artykuł, galeria.
4. **Sport**: `/mecze` (`FixtureRow`), `/mecze/[slug]` (hero wyniku + box score + PBP), `/tabela`, `/sklad`, profil.
5. **Pozostałe**: `/sponsorzy`, `/klub`, `/dokumenty`, 404, loading/error.
6. **Polish**: responsywność 375–1920, klawiatura, reduced motion, testy, lint, build, sprzątanie (martwy kod, `digital.css`, assety), raport końcowy.
