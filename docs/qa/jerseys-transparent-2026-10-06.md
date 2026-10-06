# Stroje bez czarnego tła — 6.10.2026

Na prośbę użytkownika usunięto czarne prostokątne tło z czterech zdjęć koszulek: wariant A/B, przód/tył. Pliki źródłowe JPEG zachowano. Wbudowane image_gen.imagegen przygotowało transparentne PNG; nie używano CLI ani lokalnego retuszu bitmap.

| Widok | Wynik w workspace | Prompt / źródła |
|---|---|---|
| stroj-a-przod | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-a-przod-transparent-v1.png>) | [Pełny prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-a-przod-transparent-v1.provenance.json>) |
| stroj-a-tyl | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-a-tyl-transparent-v1.png>) | [Pełny prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-a-tyl-transparent-v1.provenance.json>) |
| stroj-b-przod | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-b-przod-transparent-v1.png>) | [Pełny prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-b-przod-transparent-v1.provenance.json>) |
| stroj-b-tyl | [PNG](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-b-tyl-transparent-v1.png>) | [Pełny prompt i pochodzenie](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/public/brand/jerseys/stroj-b-tyl-transparent-v1.provenance.json>) |

## Integracja i marka

`site/components/public/home/JerseyShowcase.tsx` używa wersji transparent-v1 oraz rzeczywistych wymiarów obrazów. Dla A: 1086 × 1448 px; B: 1024 × 1536 px. Wszystkie mają kanał alfa, zewnętrzne tło ma alfa 0; detale materiału pozostają widoczne. CSS tła kart pozostaje istniejący. Układ, czerwony/pomarańczowy akcent, typografia, kontrole i działanie przód/tył zachowano. Zmiany lokalne, bez deployu/API/CMS.

Pełna specyfikacja promptu każdego pliku znajduje się w JSON: usunięcie wyłącznie zewnętrznego czarnego tła, przezroczystość alfa, zachowanie kompletnej koszulki, widoku, kolorów, numeru 00, logo i nadruków. Pliki są wynikiem edycji AI: nie stanowią gwarancji zachowania każdego piksela źródła. Oryginalne JPEG nadal są dostępne jako źródła referencyjne; metadane zawierają sumy SHA256 źródła i wyniku.

## Weryfikacja

Typecheck, lint oraz build produkcyjny zaliczone. Przeglądarka 1440 px: obie przednie i obie tylne wersje poprawnie wczytane przez Next Image; czarne prostokąty niewidoczne. Kliknięcie kontrolki zmienia zdjęcie i etykietę. Przy 390 px wszystkie przednie zdjęcia wczytane, bez overflow. Enter na zdjęciu przełącza tył na przód dla obu wariantów. Kontrolki w nagłówkach mają 44 px wysokości. Zapisane dowody: [kontrole](brandbook-audit/polish/jerseys-transparent/checks.json), [przód](brandbook-audit/polish/jerseys-transparent/front-final.png), [tył](brandbook-audit/polish/jerseys-transparent/back-1440.png), [telefon](brandbook-audit/polish/jerseys-transparent/front-390.png).

Podgląd działa na [localhost](http://127.0.0.1:3100/). Ta zmiana nie wymagała nowych testów jednostkowych; wykonano kontrolę rzeczywistego renderowania i interakcji.
