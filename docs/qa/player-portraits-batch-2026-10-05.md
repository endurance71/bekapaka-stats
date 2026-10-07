# Portrety składu — 5.10.2026

Na wyraźne zlecenie użytkownika przygotowano 9 kolejnych wizualizacji AI według zaakceptowanego Tomasza Kaszubowskiego i fotograficznego wzorca Damiana Motylińskiego. Łącznie 11 z 20 zawodników ma portret w lokalnym podglądzie: 9 nowych, wcześniej przygotowany Tomasz oraz niezmieniony Damian. Pozostałych 9 nie ma dostępnych fotografii źródłowych; nie wygenerowano zastępczych twarzy.

## Wynik i pliki

Pionowy kadr 4:5, transparentne tło, frontalna perspektywa oraz neutralne światło studyjne. Wzór koszulki A: czarny z czerwonymi panelami i właściwym numerem zawodnika. Zasoby: RGBA 1122 × 1402 px, około 1,3–1,6 MB każdy. Istniejący Next Image dostarcza responsive formaty i rozmiary. Referencje: `player-24.webp` i `jerseys/stroj-a-przod.jpg`. Oryginalne fotografie pozostawiono bez zmian.

| Zawodnik | Numer | Wynik | Pełny prompt / źródła |
|---|---:|---|---|
| Paweł Samusionek | 3 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/pawel-samusionek-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/pawel-samusionek-portret-v1.provenance.json>) |
| Pablo Iriarte | 4 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/pablo-iriarte-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/pablo-iriarte-portret-v1.provenance.json>) |
| Patryk Szczęśniak | 7 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/patryk-szczesniak-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/patryk-szczesniak-portret-v1.provenance.json>) |
| Mirosław Malina | 11 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/miroslaw-malina-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/miroslaw-malina-portret-v1.provenance.json>) |
| Przemysław Klimek | 16 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/przemyslaw-klimek-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/przemyslaw-klimek-portret-v1.provenance.json>) |
| Robert Kulik | 21 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/robert-kulik-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/robert-kulik-portret-v1.provenance.json>) |
| Emil Kłos | 23 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/emil-klos-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/emil-klos-portret-v1.provenance.json>) |
| Filip Karpiński | 69 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/filip-karpinski-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/filip-karpinski-portret-v1.provenance.json>) |
| Filip Kawecki | 77 | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/filip-kawecki-portret-v1.png>) | [Prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/photography/filip-kawecki-portret-v1.provenance.json>) |

Wszystkie edycje wykonano wbudowanym narzędziem image_gen.imagegen. JSON każdego pliku zawiera pełny prompt, źródło tożsamości, referencje światła/kadru i stroju, identyfikator zawodnika, numer, wymiary oraz sumy SHA256. Warianty są lokalnymi wizualizacjami AI: rekonstrukcja ujęcia może zmienić detale twarzy, nadruków i tatuaży. Nie oznacza to potwierdzenia zgody ani zatwierdzenia do publikacji.

## Integracja i zgodność wizualna

- `site/lib/data/local-player-portraits.ts`: wspólna mapa wariantów dla podglądu localhost. Wymaga zgodności identyfikatora i aktualnego numeru; nie przypisuje zdjęcia po samym numerze ani nazwisku.
- `site/lib/data/backend.ts`: warianty są używane wyłącznie przy istniejącym, jawnie włączonym lokalnym podglądzie mediów. Poza nim pozostaje dotychczasowy odczyt i bramka publikacji.
- `site/tests/local-player-portraits.test.ts`: testy domyślnego wyłączenia, właściwego przypisania, zmiany/braku numeru i obcego identyfikatora.
- `docs/qa/bekapaka-2-media-inventory.json`: 9 nowych wpisów; nie wymyślano autora, zgody ani opisu.
- Zachowano istniejący system WWW: ciemna płyta, czerwone linie, konturowy numer, Barlow/Barlow Condensed i karta 4:5. Karta prowadzi bezpośrednio na stronę zawodnika.
- Zmiany tylko w workspace; bez zapisu w API/CMS, deployu i działań na VPS.

## Weryfikacja

104 testy w 17 plikach, typecheck, lint i produkcyjny build zaliczone. Serwer pozostawiono działający: [skład lokalny](http://127.0.0.1:3100/sklad).

Przeglądarka 1440 px: 20 kart, 11 poprawnie wczytanych portretów, 9 kart zastępczych, brak poziomego overflow. Wszystkie 9 nowych stron zawodników ma właściwy H1, URL i wczytany właściwy portret, bez overflow. Przy 390 px skład nadal ma 20 kart i wszystkie 11 zdjęć się wczytuje; profil Filipa Kaweckiego również bez overflow. Kontrola wizualna potwierdziła przezroczyste tła i czytelne numery. Nie wykonywano ponownego Lighthouse ani odbioru publikacji w tym etapie.

Dowody: [JSON kontroli](brandbook-audit/polish/portrait-batch/checks.json), [skład desktop](brandbook-audit/polish/portrait-batch/roster-1440.png), [skład telefon](brandbook-audit/polish/portrait-batch/roster-390.png), [profil desktop](brandbook-audit/polish/portrait-batch/profile-kawecki-1440.png), [profil telefon](brandbook-audit/polish/portrait-batch/profile-kawecki-390.png).

## Brakujące fotografie

Potrzebne są fotografie źródłowe następujących zawodników: Jędrzej Bortnik (#2), Marcin Trawiński (#10), Łukasz Gośniak (#34), Dawid Olearczyk, Alan Niwiński, Maciej Tymiński, Jakub Gołębiowski, Łukasz Mras i Piotr Sosiński. Dla ostatnich sześciu dane nie podają numeru. Sprawdzono dostępne zasoby repozytorium, sąsiedniego projektu marki i pole photo w API składu; nie znaleziono ich zdjęć. Poproszono użytkownika o ścieżkę do innego folderu, jeśli takie fotografie istnieją. Cały skład 20/20 pozostaje zależny od tych materiałów.
