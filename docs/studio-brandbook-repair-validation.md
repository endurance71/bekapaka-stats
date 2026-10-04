# Studio — odbiór naprawy brandbookowej

04.10.2026. Implementacja lokalna 3.0.0, status kompozycji: draft. Produkcja nie została zmieniona.

## Wykonane

- Rejestr 38 typów i 60 jawnych kompozycji w `backend/studio/composition-specs.json`, z przypisaniem źródeł, formatów i stron brandbooka. Nie oferujemy automatycznie trzech stylów dla każdego typu.
- Renderer 3.0.0: niezależne układy rodzin, natywne formaty i bezpieczne strefy. Strój B ma właściwą tarczę rywala i hierarchię wyniku: prowadzący wynik pełny, drugi konturowy, bez VS w tablicy wynikowej. Dodano kompozycję koszulki dla dnia meczu.
- Materiały rozdzielone według papieru/ciemnego podłoża i kontekstu stroju. Nowe tła nie zastępują zatwierdzonych kompozycji.
- Zatwierdzenie obejmuje strój, materiał i SHA implementacji. Eksport sprawdza rewizję i integralność plików. Zmiana implementacji unieważnia dopasowanie starych zatwierdzeń.
- Starsze rewizje korzystają ze swoich rendererów. Ręczne przeniesienie tworzy nową rewizję, zachowuje dane i wymaga nowego podglądu oraz oceny.
- Miniatury katalogu wygenerowane tym samym rendererem. Interfejs został zmieniony tylko w zakresie dostępności kompozycji, migracji oraz decyzji o zgodności.

## Sprawdzone

- Backend: 101 testów w 15 plikach, w tym prywatne pobrania, migracja rewizji, eksport ZIP, idempotencja i izolacja decyzji A/B.
- Interfejs: 12 testów; build produkcyjny zakończony powodzeniem.
- Python: 19 testów, obejmujących 332 natywne warianty A/B, długie dane, paginację i puste formularze wyników. Panel następnego meczu został usunięty na życzenie właściciela.
- Niezależna referencja wyniku B: zamrożone funkcje z repo marki i ich SHA. Porównanie ścieżek znaków, wyniku i wstęgi dla 71:65, 86:20 oraz 65:71. Mutacje braku wstęgi, błędnej tarczy i pełnego drugiego wyniku wykrywane przez test.
- Manifest wydania: kontrola rzeczywistych SHA plików; CI nie aktualizuje wzorców automatycznie.

## Jawne odstępstwa i ograniczenia odbioru

Źródłowe szablony marki mają status „do oceny”. Ich pochodzenie nie jest zatwierdzeniem produkcyjnym. W wyniku B stopkę podniesiono z y=1296 do y=1270, aby zachować margines 72 px. W zapowiedzi zmniejszono znaki i przesunięto nagłówek, aby uwzględnić pola ochronne oraz strefę Story. Te odstępstwa wymagają oceny wizualnej.

Porównanie z niezależnym źródłem obejmuje rdzeń wyniku B; nie jest pełnym porównaniem pikselowym wszystkich rodzin. Pozostałe rodziny i rozszerzenia katalogu wymagają osobnych zatwierdzonych wzorców i oceny właściciela. Zaliczenie kontroli geometrii nie oznacza pełnej zgodności wizualnej.

Galeria dziewięciu materiałów używa danych testowych i zastępczego pola fotografii. Nie stanowi pilotażu na rzeczywistych materiałach i nie nadaje się do publikacji.

Otwarte kryteria planu: ocena pierwszego wyniku B, zatwierdzone wzorce pozostałych rodzin, dziewięć rzeczywistych publikacji, odbiór feedu, próba odtworzenia i kontrola produkcyjnego wdrożenia. Wdrożenie wymaga przejścia tych kryteriów.

## Materiały lokalne do oceny

`output/studio-brandbook-repair/comparison.png`: źródło marki po lewej, wynik nowego renderera po prawej. `feed-review.png`: dziewięć przykładowych materiałów. `index.html`: galeria z opisem źródeł i ograniczeń. Katalog jest lokalnym artefaktem, ignorowanym przez Git.

Podgląd galerii: http://localhost:5175/. Studio: http://localhost:5174/.

## Korekta Story po odbiorze właściciela

04.10.2026: właściciel odrzucił rezerwę dolnego interfejsu 320 px jako zbędną w tym podglądzie. Bieżąca kompozycja Story wykorzystuje y=260–1848, z marginesem 72 px. Reguła dotyczy wszystkich bieżących rodzin i kompozycji Story, zarówno na Instagram, jak i Facebook. Nakładka podglądu opisuje margines, nie interfejs. Wynik i stopka zostały rozłożone na większej wysokości; master i eksport pozostają 1080×1920. Historyczne renderery pozostają bez zmian. Jest to jawna decyzja właściciela zastępująca wcześniejszą dolną granicę 1600 px. Kontrola: 20 testów renderera oraz 12 testów interfejsu.
