# BeKaPaKa Website 2.0 — audyt

Data: 7.10.2026 · Zakres: strona publiczna `site/` (Next.js 16, App Router) · Podgląd: produkcyjny build `http://localhost:3100/` z danymi `panel.bekapaka.pl` i CMS.

Metoda: lektura Brandbooka 2.0 (56 s.) i tomu WWW (37 s.) z repozytorium `BeKaPaKa - brand`, przegląd kodu `site/` i `packages/`, pełnostronicowe zrzuty Playwright (Chrome) 12 widoków przy 390 i 1440 px oraz strony głównej przy 768 i 1024 px, odczyt konsoli i poziomego przepełnienia.

---

## 1. Executive summary

Obecna strona **poprawnie wdrożyła tokeny Brandbooka 2.0** (czerń #0B0B0B, czerwień akcji, Barlow / Barlow Condensed, cięcie BKPK, chamfer), ale zrobiła to, **przenosząc 1:1 makiety z tomu WWW** — z ich ograniczeniami. Efekt to „BeKaPaKa 1.0 w nowym CSS”: poprawny, czysty, ale generyczny.

Najważniejsze problemy:

1. **Strona to siatka kafli.** Strona główna ma 7 sekcji i 29 prostokątów z tłem, linią akcentu i ściętym rogiem (bento 3 kafle + 3 karty newsów + tabela w ramce + 4 karty zawodników + 15 plakietek + 2 karty wsparcia + ticker). Każda informacja dostaje tę samą „szatę”, więc nic nie dominuje.
2. **Hierarchia meczu jest odwrócona.** Najbliższy mecz jest kartą w lewej części bento, obok kafla „1 MIEJSCE” o podobnej wadze. Ostatni wynik (86:20, wygrana +66) jest **tylko w 13-pikselowym tickerze** pod nagłówkiem — największe sportowe wydarzenie sezonu jest najmniej widoczne.
3. **Typografia nie pracuje.** Skala 120/96/64 px istnieje w tokenach, ale na stronie głównej największy tekst to godzina w panelu (≈96 px). Tytuły sekcji („Z klubu”, „Sezon i drużyna”) są generyczne i mają tę samą skalę co wszystko inne. Brak kontrastu skali = brak rytmu.
4. **Aktualności bez hierarchii.** Na stronie głównej trzy równe karty; na listingu wyróżnienie jest tylko szerszą kartą. Nie da się w sekundę ocenić, która historia jest najważniejsza.
5. **Architektura CSS to warstwy łatek.** Jeden plik `digital.css` (1 496 linii, 116 KB), w nim port arkusza referencyjnego, „2.1 bento”, sekcje dopisywane przy kolejnych naprawach, bloki zminifikowane w jednej linii, 22 × `!important`, ~40 lokalnych rozmiarów fontów w px obok tokenów, dwa systemy przycisków (`btn` i `button button--ghost`), klasy `*-v2`, `*-premium`. 535 unikalnych klas w TSX.
6. **Martwy kod i równoległe systemy.** `components/public-site.tsx` (308 linii, bento 2025 z treściami „System Bento 2026”, „Mobile first” jako copy na stronie) i `EditorialHomeTemplate`, `PageScaffold`, `MarkdownContent`, `SlideoutPanel` nie są renderowane przez żadną trasę.

Fundament techniczny jest dobry: warstwa danych (`lib/data`) z jawnymi stanami `DataState` (ok/empty/error, live/fallback), bramka zgód na media, revalidate 60 s, schema.org, OG, dostępne menu z pułapką fokusu. **Redesign nie wymaga zmian w API ani CMS.**

---

## 2. Brand interpretation — co mówi Brandbook 2.0

Źródło prawdy: `BeKaPaKa - brand/05_brandbook/BeKaPaKa_Brandbook_2.0.pdf` + `…_WWW.pdf` + `CURRENT.md` (decyzje zamrożone 02.10.2026). Plik `docs/Brand Book - BeKaPaKa Bobolice.md` w tym repo to **wersja 1.0, nieaktualna** (złoto #ECA72C jako kolor główny, Montserrat/Bebas) — nie stosować.

| Zasada brandbooka | Interpretacja cyfrowa 2.0 |
|---|---|
| **„Po co jesteśmy: żeby w Bobolicach grało się w koszykówkę”** · filary Drużyna / Społeczność / Wydarzenia | Strona opowiada o meczach i ludziach, nie o „klubie premium”. Copy konkretne: data, hala, wynik, nazwisko. |
| **Ton: lokalnie, konkretnie, bez patosu, uczciwie** | Zero sloganów w nagłówkach sekcji. Nagłówek = informacja („Najbliższy mecz”, „Ostatni wynik”, „Tabela KALK”). Porażka podana rzeczowo, bez efektów triumfu. |
| **Każdy post odpowiada na jedno pytanie:** Kiedy gramy? · Jak poszło? · Kto gra? · Co się wydarzyło? · Kto nas wspiera? | **To jest architektura strony głównej** — pięć pytań = pięć pasm w tej kolejności. |
| **Czerń stroju = czerń, nie grafit (#0B0B0B)**; papier #F3F1EC dla czytania | Dwa „materiały”: płyta (dane, emocje) i papier (czytanie). Zmiana materiału = zmiana trybu czytania, zamiast ramek wokół treści. |
| **Czerwień #EF1734 = mecz, akcja, element V** | Czerwień tylko dla: CTA, statusu LIVE, krawędzi V i belki własnego wiersza. Nie jako tło sekcji. |
| **Złoto = prestiż; duże pola tylko MVP/puchar; nigdy CTA** | Złoto wyłącznie: aktywna pozycja nawigacji, focus na płycie, lider statystyki, partner główny. |
| **DNA rdzeń: V 24°/66°, skrzydła, paski stroju; „min. 1 element rdzenia w grafice”; „V w krawędziach, nie w tle”** | V jako **krawędź konstrukcyjna** (dolna krawędź hero meczu, przejście płyta → papier), paski stroju jako **separator** pasm. Nigdy jako tapeta. |
| **Litery i cyfry BKPK (Barlow Condensed 800, pochylenie 9°, przecięcie)** — tylko wynik, numer, godzina w hero, display | Cięte cyfry są **znakiem rozpoznawczym**: wynik meczu, numer zawodnika, godzina meczu, pozycja w tabeli. Nigdy w treści, nawigacji, tabelach. |
| **„Numer — wielki, jak na plecach”** | Numer zawodnika jako główny element kompozycji karty i profilu. |
| **Wynik: BeKaPaKa zawsze po lewej; prowadzący pełny, drugi konturem** | Jeden komponent wyniku w całym serwisie; kontur dla przegrywającego. |
| **Jedna hala KALK (KOSiR Koszalin), bez dom/wyjazd, „Wstęp wolny”** | Miejsce zawsze podane, brak oznaczeń gospodarza. |
| **Partnerzy: skala 1.00 / 0.62 / 0.50, równe pole optyczne, plakietka z nazwą zamiast inicjałów** | System poziomów w kodzie, uruchamiany flagą po decyzji zarządu; dziś jeden poziom. |
| **Tom WWW: bez parallax, bez karuzel z automatem, dane tylko przenikają, V odsłaniane maską raz** | Motion minimalny i znaczący. (Brief dopuszcza „subtle parallax” — brandbook zabrania; obowiązuje brandbook.) |
| **Mockupy tomu WWW (s. 19, 34)** | **Nie są projektem do odtworzenia.** Obecna strona to ich implementacja — i to jest źródło problemu „kafel + kafel”. |

Kluczowa obserwacja: Brandbook 2.0 jest silny w **materiałach plakatowych** (sociale, hala), gdzie kompozycja jest typograficzna, asymetryczna i odważna (wielkie cięte cyfry, V jako konstrukcja, papier z nadrukiem). Tom WWW tę odwagę „uprzejmie” zamienił na system kart. **2.0 ma przenieść do WWW charakter plakatu, zachowując czytelność ekranu.**

---

## 3. Visual audit

| Obszar | Obserwacja (1440 / 390 px) |
|---|---|
| Kompozycja | Każda sekcja = kontener 1280 px + nagłówek „etykieta + H2 + link” + siatka kart. Identyczny wzór 6 razy z rzędu. Brak zmian szerokości, brak elementów full-bleed poza tłem hero. |
| Hierarchia | Trzy elementy o zbliżonej wadze na pierwszym ekranie (mecz, „1 miejsce”, relacja). Wynik ostatniego meczu w 13 px. |
| Rytm | Płyta → papier → płyta → płyta → płyta → stopka płyta. Cztery ciemne pasma pod rząd (łamie regułę tomu WWW: „maks. 2 sekcje płyty pod rząd”). |
| Whitespace | Równy, „bezpieczny” — 96 px między każdą sekcją, niezależnie od wagi treści. Brak napięcia. |
| Typografia | 70% powierzchni to Barlow 13–16 px. Tytuły sekcji 44 px, tytuły kart 22–26 px, wszystko wersalikami Condensed → monotonia. Cięte cyfry tylko w 3 miejscach. |
| Kontrast | Poprawny (pary WCAG z tomu WWW). Złota etykieta „NAJBLIŻSZY MECZ” jako wypełniony prostokąt łamie zasadę „złoto nie jako duże pole/CTA”. |
| Fotografia | Zdjęcia zamknięte w małych kadrach kart 3:2. Najlepsze zdjęcie (drużyna z pucharem) ma 410×315 px w kaflu. Plakaty turniejowe (grafiki z tekstem) kadrowane `cover` — ucięty tekst. |
| Branding | Rozpoznawalny tylko przez znak i czerwień. Brak V, brak pasków stroju poza stopką/wsparciem, numery zawodników jako jedyny element DNA. Test brandbooka „zakryj logo” — strona przypomina dowolny ciemny szablon sportowy. |
| Charakter sportowy | Poprawny, ale bez emocji: brak wielkiego wyniku, brak „dnia meczu”. |

---

## 4. UX audit

| Problem | Wpływ |
|---|---|
| Ostatni wynik tylko w tickerze (13 px, poziomy scroll na mobile) | Pytanie „Jak poszło?” wymaga szukania. |
| Ticker duplikuje najbliższy mecz z hero | Dwa razy ta sama informacja na pierwszym ekranie. |
| Kafel „1 MIEJSCE” konkuruje z meczem | Druga najważniejsza informacja ma wagę pierwszej. |
| Nawigacja zaczyna się od „Aktualności” | Kibic szuka „Mecze/Tabela”; kolejność nie odpowiada priorytetom sportowym. |
| Sekcja „Sezon i drużyna” łączy tabelę i 4 karty zawodników w dwóch kolumnach | Dwa różne pytania w jednym bloku; na mobile 6 ekranów przewijania. |
| Link „Drużyna, relacje i kontakt — poznaj klub →” osierocony między sekcjami | Brak kontekstu; wygląda jak pozostałość. |
| Wsparcie 1,5% jako dwie pełne karty z numerem konta na stronie głównej | Treść transakcyjna (rachunek, QR) na stronie głównej przed stopką — ciężka; wystarczy zaproszenie + link. |
| Listing aktualności: 1 szeroka karta + siatka 3 kolumn identycznych kart | Brak „lead / secondary / feed”. |
| Artykuł: spis treści jako 20 podkreślonych linków w akapicie | Blok nieczytelny, rozbija pierwszy ekran artykułu. |
| Artykuł: kolumna boczna z jednym „Poprzedni artykuł” i pusta przestrzeń obok treści | Treść 8/12 kolumn z pustą prawą kolumną przez kilka ekranów. |
| Skład: 20 identycznych kart, brak liderów i statystyk | „Kto gra?” bez kontekstu sezonu. |
| Mecze (terminarz): jeden wiersz w ramce, ogromna pusta płyta | Przy małej liczbie meczów strona wygląda na pustą. |
| Partnerzy: siatka 5×3 równych białych kafli | Brak ekspozycji (pole ochronne, poziomy), logotypy o różnej masie optycznej. |

---

## 5. Architecture audit

| Problem | Szczegóły |
|---|---|
| Monolit CSS | `site/app/styles/digital.css` — 1 496 linii, 116 KB, 30+ sekcji dopisanych w kolejnych iteracjach; reguły dla tego samego komponentu w 3–4 miejscach (np. `.news-card` w sekcjach 9, „2.1”, „Page compositions”, „Homepage uses…”). |
| Wartości „na oko” | ~40 deklaracji `font-size` w px (12/13/15/22/26/28/32/36/40/44 px) obok ról `--fs-*`; `clamp()` lokalnie w komponentach. |
| `!important` | 22 wystąpienia (głównie nadpisania własnych reguł). |
| Inline style w TSX | `style={{…}}` w stopce, artykule, profilu, wsparciu — omija tokeny. |
| Równoległe systemy | `btn btn--*` i `button button--ghost`; `drawer-section-v2`, `data-table-v2`, `stat-bar-premium`, `sponsor-card-premium__logo`, `standings-row-v2`. |
| Martwy kod | `components/public-site.tsx` (308 l.), `EditorialHomeTemplate.tsx`, `PageScaffold.tsx`, `MarkdownContent.tsx`, `SlideoutPanel.tsx`, `FeaturedStory.tsx` (1-liniowy alias), `ListingPageHero.tsx` + dwa niemal identyczne szablony listingów (`EditorialListingTemplate`, `EditorialNewsTemplate`). |
| Niespójne API komponentów | `MatchCard` ma tryby `hero` / `compact` / domyślny w jednym 192-liniowym pliku z rozgałęzieniami markupu; `NewsCard` `featured` / `compact`; `PlayerCard` bez wariantów kontekstu. |
| Nieużywane assety | `public/images/ev-*.jpg`, `hero-event-basketball.jpg`, `baumal.{jpg,png}`, `majster-plus.{jpg,png}`, `fem-tech.jpg`, `public/logo.png` (≈1,3 MB). Uwaga: `public/photos/*.png` są referencjonowane dynamicznie (`resolvePlayerPhoto`) — **nie usuwać**. |
| Co jest dobre | Warstwa danych (`lib/data/*`), `packages/match-presentation` (statusy, `selectHeroGame`), `packages/digital-design` (tokeny generowane z `tokens.json`), fonty lokalne WOFF2 z podzbiorem PL, `FallbackImage` z `next/image`, OG generator. |

---

## 6. Responsive audit

| Szerokość | Obserwacja |
|---|---|
| 375–430 | Hero bento staje się stosem 3 kafli (≈1 250 px wysokości zanim pojawią się aktualności). Strona główna 7 125 px. Karty zawodników z tekstem 11–12 px i 4 mikro-badge statystyk. Ticker przewijany poziomo z ucięciem. Tabela na stronie głównej: 5 wierszy + przycisk „Więcej kolumn” + legenda — ciężko. |
| 768 | Ten sam stos co mobile w szerszym kontenerze; karty newsów 2 kolumny + osierocona trzecia (pusta połowa rzędu). |
| 1024 | Hamburger (zgodnie z zasadą bezpieczeństwa tomu WWW); bento 8/4 ściśnięte — tytuł relacji w kaflu łamie się na 5 linii. |
| 1440 | Poprawny, ale zawartość „mała” na dużej płycie: na pierwszym ekranie największy element to logo rywala. |
| 1920+ | Kontener 1280 px, marginesy po 320 px pustej czerni. Brak elementów full-bleed, które zakotwiczyłyby kompozycję. |
| Brak poziomego przepełnienia na żadnej z testowanych tras. Brak błędów konsoli (poza oczekiwanym 404 na stronie 404). |

---

## 7. Component audit

| Komponent | Stan | Problem | Decyzja |
|---|---|---|---|
| Header (`PublicShell`) | dobry technicznie | kolejność nawigacji, przycisk „Panel klubu” ma wagę CTA | **REFINE** (kolejność sport-first, panel jako link drugorzędny) |
| Menu mobilne (`MobileFullScreenMenu`) | dobry (focus trap, Esc, scroll lock) | ikony przy pozycjach — szum | **REFINE** |
| Ticker wyników | duplikat | 13 px, powtarza hero | **REMOVE** (zastąpiony pasmem wyniku) |
| Bento hero (3 kafle) | — | równa waga 3 informacji | **REMOVE** |
| `MatchCard` (hero/compact/default) | rozgałęziony | 3 markupy w jednym pliku, panel godziny w złotej ramce | **REDESIGN** → `MatchHero`, `ScoreLine`, `FixtureRow` |
| Wynik meczu | brak komponentu | wynik jako tekst w panelu | **NEW** `Score` (cięte cyfry, kontur przegrywającego, aria-label) |
| Kafel „pozycja w tabeli” | — | konkuruje z meczem | **REDESIGN** → pasek sezonu (`SeasonStrip`) |
| `NewsCard` | karta | jeden wygląd w każdym kontekście | **REDESIGN** → `StoryLead`, `StoryItem`, `StoryRow` |
| Listing aktualności | karta + siatka | brak hierarchii | **REDESIGN** (lead / secondary / feed) |
| Artykuł (`EditorialDetailTemplate`) | poprawny układ 7/5 | TOC jako akapit linków, pusta kolumna boczna | **REFINE** |
| `ArticleMarkdown`, galeria, lightbox | dobre | stylowanie do ujednolicenia | **KEEP** (styl) |
| `StandingsBoard` | dobry funkcjonalnie | ramka, legenda zawsze widoczna, badge formy | **REFINE** (typografia tabeli, własny wiersz) |
| `PlayerCard` | karta z tłem | 4 mikro-badge, inicjał „BKPK” jako placeholder | **REDESIGN** (numer jako konstrukcja, bez ramki) |
| Liderzy sezonu | brak | — | **NEW** `StatLeaders` |
| `PlayerProfile` | dobry układ | „dashboard” z boxami i paskami premium | **REFINE** (stat strip, typografia) |
| Box score / PBP (`MatchDrawerContent`, `MatchPlayByPlay`) | funkcjonalny | klasy `*-v2`, własne kolory | **REFINE** (styl w nowym systemie) |
| `PartnersGrid` + `SponsorLogoFrame` | jednopoziomowy | 15 białych kafli, klasy `premium/slider` z martwymi wariantami | **REDESIGN** → `PartnerWall` (komórki z linią 1 px, pole optyczne, poziomy gotowe) |
| Wsparcie (`FsmmSupportSection`) | ciężkie na home | dwie karty transakcyjne | **REFINE** (home: pasmo-zaproszenie; pełne dane na `/klub#wsparcie`) |
| `JerseyShowcase` | ok | — | **KEEP** (restyl) |
| `Section` | dobry prymityw | jeden wariant nagłówka | **REFINE** (warianty nagłówka, separator paskami) |
| `EditorialListingTemplate` + `EditorialNewsTemplate` + `ListingPageHero` | duplikaty | — | **REDESIGN** → jeden `PageHeader` + `Section` |
| Stopka | poprawna | znak 160 px + 4 kolumny małego tekstu | **REFINE** |
| `public-site.tsx`, `EditorialHomeTemplate`, `PageScaffold`, `MarkdownContent`, `SlideoutPanel`, `FeaturedStory`, `SponsorsStrip` | martwe | — | **REMOVE** |
| `digital.css` | monolit | patrz §5 | **REMOVE** → nowy system warstw CSS |

---

## 8. Priorytety

**P0 — krytyczne (blokują „2.0”)**
- Nowa architektura strony głównej wg pięciu pytań brandbooka; najbliższy mecz jako kompozycja full-bleed, ostatni wynik jako treść premium.
- Nowy system CSS (fundament + komponenty + strony) w miejsce `digital.css`; jedna skala typograficzna, jedna skala odstępów, jeden system przycisków.
- Komponent wyniku i rodzina meczowa (hero / pasmo wyniku / wiersz terminarza) wspólna dla home, `/mecze`, `/mecze/[slug]`.
- Aktualności z hierarchią lead / secondary / feed.

**P1 — ważne**
- Skład z numerem jako konstrukcją i liderami sezonu; profil zawodnika.
- System partnerów (ściana logotypów, poziomy gotowe pod flagę).
- Nawigacja sport-first; header i stopka.
- Artykuł: TOC, kolumna boczna, szerokość tekstu.
- Usunięcie martwego kodu i assetów.

**P2 — później**
- Formularz partnera zamiast `mailto` (decyzja klubu).
- Galerie meczowe po sesji zdjęciowej (~16.10.2026).
- OG obrazy w nowym stylu (generator działa, zgodny z tomem WWW).
- Weryfikacja Safari/Firefox cięcia BKPK, VoiceOver/TalkBack, INP w terenie.
