# Próba wycięcia Tomasza Kaszubowskiego — 5.10.2026

Na prośbę użytkownika przygotowano pierwsze wycięcie z istniejącego portretu #12. Oryginał `/photos/tomasz-kaszubowski.png` pozostaje bez zmian. Wariant PNG ma 1254 × 1254 px, kanał alfa i około 1,04 MiB; Next Image zapewnia warianty rozmiarowe i formaty. Dokładny prompt, źródło, narzędzie i sumy kontrolne zapisano w `site/public/brand/photography/tomasz-kaszubowski-cutout-v1.provenance.json`.

## Zmiany i marka

- `site/lib/data/backend.ts`: podmiana portretu wyłącznie dla lokalnego podglądu i identyfikatora Tomasza. Poza nim pozostaje źródłowe zdjęcie i dotychczasowa bramka metadanych/zgód.
- `site/components/public/shared/PlayerProfile.tsx`, `site/app/styles/digital.css`: większa skala kwadratowego wycięcia; numer 12 za postacią i wygaszenie dolnej krawędzi jak w istniejącym profilu Damiana. Kliknięcie karty nadal prowadzi do pełnej strony zawodnika.
- Zgodność kompozycji z WWW: ciemna płyta, konturowy numer, prawdziwy strój, dotychczasowa typografia i geometria.

## Granice próby

Narzędzie AI nie zachowało dokładnie wszystkich pikseli osoby: widoczne są drobne różnice detali twarzy i stroju, a na części krawędzi pozostała czerwień. Wariant służy do lokalnej oceny kompozycji; nie został zatwierdzony jako docelowy portret zgodny z zakazem retuszu twarzy w zasadach marki. Nie przetworzono pozostałych zawodników ani nie zapisano zmian w CMS/API. Zgoda i autor nadal wymagają potwierdzenia.

## Weryfikacja

100 testów w 16 plikach, typecheck, lint i build produkcyjny zaliczone. Podgląd działa na `http://127.0.0.1:3100`. Zrzuty przed/po i układ mobilny: `brandbook-audit/polish/cutout-trial/`. Do oceny użytkownika: skala, kompozycja oraz jakość wycięcia; przed kolejnymi portretami należy dopracować metodę zachowującą oryginalne detale osoby.

## Wariant v2 — czarno-czerwony strój A

Po zaakceptowaniu kompozycji użytkownik wprost zlecił zmianę koszulki na klubowy czarno-czerwony wzór. Użyto wycięcia v1 jako celu edycji i `site/public/brand/jerseys/stroj-a-przod.jpg` jako referencji. Zachowano numer 12; wygenerowany strój odwzorowuje czerwone panele, lamówki oraz układ nadruków. Wariant `tomasz-kaszubowski-stroj-a-v2.png` (RGBA, 1254 × 1254 px) zastąpił v1 tylko w lokalnym podglądzie karty/profilu. Oba wcześniejsze zdjęcia zachowano.

Zmiana stroju to wizualizacja AI wykonana na wyraźne zlecenie użytkownika; nie jest dokumentalnym portretem. Pełny prompt i źródła: `tomasz-kaszubowski-stroj-a-v2.provenance.json`. Testy profilu i bramki mediów: 9/9, typecheck, lint i produkcyjny build zaliczone. Zrzuty wariantu v2: `brandbook-audit/polish/cutout-trial/jersey-a-profile-{1440,390}.png`.

## Wariant v3 — dopasowanie do fotografii Damiana

Użytkownik zlecił dalsze dopasowanie światła, kolorów, perspektywy, kąta kamery i kadru do Damiana Motylińskiego. Przygotowano transparentny pionowy PNG 1122 × 1402 px: bardziej frontalne ujęcie, wyprostowany kadr, większy zakres tułowia i dopasowanie światła/kolorów. Numer 12 i wzór stroju A pozostają. Referencja fotograficzna: `player-24.webp`; dodatkowa referencja tożsamości: oryginalny portret Tomasza. Pełne źródła i prompt są w `tomasz-kaszubowski-portret-v3.provenance.json`.

Zastosowano v3 tylko w lokalnym adapterze składu. Usunięto specjalny większy rozmiar dla poprzedniego kwadratowego wycięcia: pionowy portret używa teraz tych samych reguł skali co Damian. Oryginał oraz v1/v2 zachowano. Rekonstrukcja ujęcia i poszerzenie kadru przez AI są wizualizacją, nie źródłowym dokumentalnym zdjęciem. Testy profilu i bramki mediów: 9/9, typecheck i lint zaliczone. Zrzuty: `brandbook-audit/polish/cutout-trial/portrait-v3-profile-{1440,390}.png`.

Produkcyjny build lokalnego podglądu także zaliczony. Przeglądarka: portret wczytany w profilu 1440/390 px, powrót z karty do profilu działa. Przy 1440 px oba portrety w składzie mają ten sam obszar 302 × 377,5 px i są poprawnie wczytane. Zrzut listy: `portrait-v3-roster-1440.png`; pozostawiono otwarty profil Tomasza i działający serwer na porcie 3100.
