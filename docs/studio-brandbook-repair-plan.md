# BeKaPaKa Studio — plan przywrócenia zgodności z Brandbookiem 2.0

Data: 04.10.2026. Status: implementacja lokalna 3.0.0 przygotowana do oceny wizualnej. Bez wdrożenia produkcyjnego. Szczegóły wykonania i otwarte kryteria: `studio-brandbook-repair-validation.md`.

## Cel i definicja odbioru

Studio ma odtwarzać konkretne kompozycje marki, a nie tylko używać jej fontów, znaków i kolorów. Każdy dostępny do produkcyjnego eksportu szablon musi mieć wskazane źródło lub zatwierdzoną specyfikację rozszerzenia, wzorzec wizualny, poprawne reguły danych, zaliczone testy oraz decyzję właściciela. Zgodność nie wynika z liczby wariantów ani samego braku kolizji.

Zakres obejmuje cały katalog 38 typów publikacji, istniejące i nowe projekty, podglądy, PNG, ZIP i miniatury. Naprawiamy system projektowania grafik, bez przebudowy nawigacji aplikacji, autoryzacji, systemu sportowego, CMS ani integracji AI. Obsługa telefonu, podgląd platform i zapis PNG w Zdjęciach pozostają zachowane.

## Potwierdzona przyczyna

- `backend/studio/renderer/render_v2.py` składa zapowiedź i wynik ze wspólnej geometrii: nagłówek, para znaków z VS, jeden napis z godziną lub wynikiem, hala i paski. Nie odtwarza rodzin opisanych w brandbooku.
- `backend/studio/post-types.js` przypisuje każdemu typowi automatycznie wszystkie trzy style oraz zestaw formatów według szerokiej rodziny. Nie sprawdza, czy taka kompozycja ma wzorzec marki.
- Wybór stroju B podmienia paletę i znak, ale tarcza rywala i hierarchia wyniku nie odpowiadają źródłom stroju B.
- `scripts/studio/verify-brand.mjs` sprawdza integralność zasobów. `test_catalog.py` sprawdza renderowalność, wymiary, geometrię i różnice między stylami. Żaden z tych testów nie potwierdza podobieństwa do źródłowego projektu.
- Klucze zatwierdzeń nowych kompozycji obejmują typ, styl i format, ale nie konkretny wariant stroju. Wersja designu i renderera jest wyliczana z globalnych stałych, a wybór ścieżki Python zależy od obecności `postType`. Trzeba zapewnić rzeczywiste przypięcie rewizji do implementacji.

## 1. Rejestr reguł i źródeł

Źródła: `../BeKaPaKa - brand/05_brandbook/BeKaPaKa_Brandbook_2.0.pdf` (56 stron), `CURRENT.md`, `02_system/tokens.json`, `03_szablony/rdzen-v6/`, `03_szablony/stroj-b/`, `03_szablony/karuzela/`, `02_system/partnerzy/` i toolkit.

Najważniejsze odniesienia: strony 22 (kolor i strój B), 28–30 (DNA, materiały, siatka), 33 (AI), 35–39 (rodziny i układy), 46 (rytm feedu), 55–56 (kontrola i produkcja). Plansze będą oceniane wizualnie; ekstrakcja tekstu nie zastępuje stron z ilustracjami.

Powstanie tabela: typ publikacji → kompozycja → stan → strój → format → plik źródłowy → strona brandbooka → decyzje → status zgodności. Każda rozbieżność będzie zapisana jako zadanie, nie jako cicha interpretacja programisty.

Brandbook oraz aktualne jawne decyzje marki określają reguły; kod szablonów jest implementacją do sprawdzenia. Szablony v6 i stroju B mają w `CURRENT.md` status „do oceny”. Nie nadamy im automatycznie zatwierdzenia tylko dlatego, że pochodzą z repo marki. Screenshot przekazany przez użytkownika stanowi referencję wyglądu stroju B; jego przykładowe dane nie stają się danymi produkcyjnymi.

Rozstrzygnięcia do zapisania podczas audytu:

- złoto: aktualny brandbook dopuszcza etykiety, ramki i akcenty; duże powierzchnie tylko wyróżnienia. Starszego, węższego opisu w tokens nie stosować wbrew aktualnej regule;
- partnerzy: jeden poziom, kolejność alfabetyczna i równe pole optyczne z aktualnego rejestru; wyjątki tylko z umów;
- ogólny nagłówek Mini + etykieta oraz kompozycje z wstęgą: reguła przypisana do konkretnego szablonu, nie automatyczne dodawanie drugiego nagłówka;
- stopka: wordmark i/lub adres dokładnie według przyjętej referencji; bez dokładania obu znaków „na wszelki wypadek”;
- źródłowe materiały demonstracyjne, tymczasowe portrety i fikcyjne komunikaty nie mogą wejść do produkcji.

Rezultat etapu: zamknięta specyfikacja rdzenia oraz jawny rejestr miejsc wymagających decyzji wizualnej.

## 2. Rejestr kompozycji zamiast trzech automatycznych stylów

Utworzyć jawne specyfikacje szablonów: identyfikator, wersja, dozwolone typy i stany, układ, paleta stroju, obsługiwane formaty, pola danych, dozwolone zdjęcia/tła, wymagane motywy i wzorce PNG.

Rozdzielić trzy pojęcia:

1. Cel: zapowiedź, wynik, MVP, skład itd.
2. Kompozycja: mecz / typografia, tablica / zawodnik, rama / MVP itd.
3. Strój: A lub B — paleta tego samego systemu, ze świadomym potwierdzeniem kontekstu B.

Nie wymuszać trzech kompozycji dla każdej publikacji. Zachować 38 celów użytkowych; oferować tylko istniejące albo osobno zaprojektowane i zatwierdzone układy. Katalog i formularz odczytują dostępność z rejestru. Niedostępny wariant nie przełącza się po cichu na generyczny renderer.

## 3. Przeniesienie ośmiu rodzin źródłowych

Przenieść funkcje kompozycji z repo marki na wejście JSON i zasoby Studio. Nie przepisywać ich „na oko” oraz nie umieszczać wygenerowanego plakatu AI jako warstwy podglądu. Dane, grafika i reguły pozostają rozdzielone.

| Rodzina | Wymagany rezultat |
|---|---|
| Zapowiedź | Wstęga właściwego stanu, symetryczna para znaków, VS i szewron zgodnie z referencją; godzina w panelu 24°, hala z ikoną; odrębny układ typograficzny. Przełożenie i odwołanie mają własne zachowanie danych i ton. |
| Wynik | Odrębna tablica, bez VS w układzie tablicy; BeKaPaKa po lewej; prowadzący pełny, drugi konturem; właściwe kolory i wielkości, wstęga fazy, nazwy pod wynikiem, panel następnego meczu z danych. Wariant zawodnika zgodny z osobnym wzorcem. |
| Skład | Pierwsza piątka jako pięć koszulek z numerami/nazwiskami; pełny skład jako kontrolowane rozszerzenie z podziałem na plansze. Papier i nadruk, potwierdzenie konkretnego meczu. |
| Zawodnik / nowy / MVP | Rama ze stopniami, numer konturem, wstęga, poprawne pola portretu; MVP jako właściwy wariant wyróżnienia. Bez wygenerowanych osób. Wariant bez portretu ma osobny wzorzec. |
| Turniej | Kompozycja hero z dominującym obiektem, wąską kolumną tytułu i parametrami; CESiR Bobolice z wydarzenia, bez stałej hali KALK. Program i podsumowanie jako odrębne rozszerzenia. |
| Relacja | Papier, zdjęcie w ramie ze stopniami, wstęga i podpis nadrukiem; karuzela zgodna z własnym źródłem, kontrolowana kolejność i kadry. |
| Partnerzy | Papier, jedna hierarchia, równe pole optyczne i alfabetyczna kolejność; osobne referencje planszy, prezentacji i podziękowania. |
| Terminarz / informacja | Terminarz z paskami stroju jako wierszami, poprawny rytm i paginacja; ogłoszenie i news z odrębną zatwierdzoną specyfikacją. |

Strój B: zachować te same układy rodziny; zastosować właściwą wstęgę, granatową tarczę rywala, pomarańczowe akcenty, dolny wzór pęknięć i zatwierdzony wariant znaku. Osobno odwzorować matchday „GRAMY W STROJU B” z koszulką. Nie utożsamiać tej publikacji z dowolną zapowiedzią z granatowym tłem.

Pierwszy punkt odbioru: wynik 4:5 w stroju B z referencyjnym wynikiem 71:65 oraz z danymi ze screena Studio 86:20 jako przypadkami testowymi. Pokazać źródło, nowy render i różnicę obrazu. Następnie dzień meczu B i matchday z koszulką, a dopiero po przyjęciu kierunku rozszerzać pozostałe rodziny.

## 4. Nowe typy bez wzorca w brandbooku

Statystyki, liderzy, tabela, podsumowania, urodziny, treningi, kulisy, cytat, jubileusz, zaproszenie i komunikat nie stają się zgodne przez przemalowanie obecnego wspólnego układu.

Dla każdego typu powstanie karta rozszerzenia systemu: rola publikacji, materiał, kompozycja, hierarchia, znak, minimum jeden element rdzenia DNA, pola treści, zachowanie długich danych i przykłady feed/story. Projektować w grupach zbliżonych funkcji, ale zachować rzeczywiste różnice potrzebne do ich czytelności. Wszystkie nowe projekty wymagają oceny wizualnej. Użytkownik zachowuje cele publikacyjne; produkcyjny eksport konkretnego układu jest dostępny dopiero po jego odbiorze.

## 5. Formaty, zdjęcia i dziewięć teł

- Master Story i eksport: 1080 × 1920, 9:16. Dokument nie przyjmuje proporcji telefonu. Instagram/Facebook korzystają z tego samego pliku, różnią się tylko nakładką podglądu.
- Feed 1080 × 1350. Kwadrat i poziom pozostają dostępne tam, gdzie mają osobną sprawdzoną specyfikację. Zachować dotychczasowy zakres formatów jako zakres do zaprojektowania; nie udawać, że samo przeskalowanie jest ukończonym wariantem.
- Każdy format ma własne współrzędne i reflow. Istniejące źródła formatów zostaną sprawdzone, a brakujące formaty zaprojektowane z tą samą hierarchią.
- Informacja Story w y=260–1600; przy szerokości 1080 margines x=72. Tło wypełnia całą powierzchnię dokumentu. Czytelność sprawdzić także przy podglądzie szerokości 360 px.
- Dziewięć teł pozostaje w prywatnej bibliotece z promptami i obecnymi decyzjami. Dopisać dozwolone konteksty: papier, ciemna płyta, scena hali, strój A/B. Ogólna akceptacja faktury nie oznacza akceptacji każdej kombinacji tła i szablonu.
- Zastąpić automatyczny wspólny tint 80%/90% regułami materiału konkretnego szablonu, odtwarzając najpierw referencję. Nie kasować nowego tła ani nie zmieniać skóry/sylwetki przez przypadkowy filtr całego kadru.
- Kadrowanie i punkt skupienia w granicach slotu. Portrety i znaki zachowują proporcje; przy wycięciach kontrolować krawędzie, skalę i zgodność numeru. Brak zdjęcia przełącza tylko na zatwierdzony wariant alternatywny.
- AI wyłącznie materiały tła i dozwolona martwa natura; fonty, wyniki, znaki, koszulki i kompozycje składa deterministyczny silnik. Scena hali AI nie może być opisana jako autentyczne zdjęcie KOSiR.

## 6. Kontrakty danych i brakujące pola

Dodać tylko pola potrzebne przez wzorce: następny mecz z migawką źródła, potwierdzona informacja o kolejnym komunikacie, dane koszulki matchday oraz wybrany identyfikator kompozycji. Wspólna walidacja Zod w API i formularzu. Bez zmian bazy sportowej i własnego scrapera.

Wstęga WYGRANA/PORAŻKA wynika z potwierdzonego wyniku. Live/przerwa mają jawny stan; remis jest możliwy w trakcie, nie jako końcowy wynik. BeKaPaKa zawsze po lewej, również gdy w źródle jest gościem. Dzień tygodnia wynika z daty w Europe/Warsaw. Odrębne sezony i hale pozostają rozróżnione.

Nie kopiować `data/demo.json` do wejścia produkcyjnego. Usunąć stałe nazwiska, numer 24, wyniki, daty, `[RYWAL]`, „druga połowa za 15 minut” i „aktualizacja po 3. kwarcie”. Następny mecz pobrać ze źródła albo podać ręcznie z pochodzeniem i potwierdzeniem. Dla braku danych przygotować zatwierdzony wariant bez tego panelu lub neutralny stan „Termin do potwierdzenia”; bez fikcyjnego przeciwnika i godziny.

Długi tekst: dozwolone łamanie wierszy i paginacja, bez deformacji, samowolnego zmniejszania poniżej minimum czy ukrywania wpisów. Brak wymaganych danych blokuje eksport z komunikatem o konkretnym polu.

## 7. Wersjonowanie i istniejące projekty

Nowa wersja kompozycji i renderera, jawnie przypięta do rewizji. Identyfikator zgodności i zatwierdzenia obejmuje: kompozycję, jej wersję, brand package, renderer, format, strój oraz istotny wariant materiału. Nowe zatwierdzenie nie jest dziedziczone z układu generycznego ani z innego stroju. Rejestr odróżnia zgodność wzorca od potwierdzenia danych konkretnej rewizji.

Stare projekty, pliki i historia pozostają dostępne jako archiwum. Nie zmieniać wyglądu zapisanych projektów po cichu. Funkcja „Przenieś do szablonu zgodnego z brandbookiem” tworzy nową rewizję, zachowuje treść i powiązania, pokazuje różnice i wymaga nowego podglądu oraz zatwierdzenia.

Po aktywacji naprawy stare niezweryfikowane kompozycje nie mogą tworzyć nowych produkcyjnych eksportów z oznaczeniem zgodności. Historyczne pobrania są archiwalne i nie otrzymują nowego certyfikatu. Stary renderer jest odczytem historii, nie alternatywną drogą ominięcia reguł.

Manifest ZIP obejmuje identyfikator i wersję rzeczywistej kompozycji, strój, format, wersję zasad i wzorca, hash renderera/wzorca, dane i materiały oraz decyzję odbioru. Miniatury powstają z tej samej wersji renderera co podgląd i eksport.

## 8. Trzy bramki kontroli

### Reguły marki

Fonty i ich rzeczywiste pliki, role kolorów, znak 2.0 bez herbu formalnego jako dodatkowego logo, proporcje i pole ochronne, minima 150/90/24 px właściwych znaków, minimum 20 px tekstu oraz większe minima szablonu, geometria 24°/66°, czytelne ikony, rdzeń DNA, stopka, materiał, strefy Story, kolizje, kadrowanie i brak danych demo.

### Zgodność wizualna

Wzorce PNG pochodzą ze źródła marki lub odebranej specyfikacji, nigdy z aktualnego błędnego renderera. Te same jawne testowe dane w źródle i Studio. Porównanie całego obrazu oraz osobno nagłówka, znaków, tablicy, materiału, stopki i paneli. Tolerancja wyłącznie uzasadnionego rasteryzowania krawędzi, nie zmian kompozycji. Deterministyczne fonty, tekstury i losowość; środowisko renderowania przypięte.

Test musi wykryć celowe usunięcie wstęgi, zamianę konturu na pełny wynik, czarną tarczę w stroju B i przesunięcie znaku. Aktualizacji wzorca nie zatwierdza automat razem z kodem. Artefakt CI pokazuje przed/po/diff; zmiana wzorca wymaga jawnego przeglądu.

### Odbiór wizualny właściciela

Plansze porównawcze źródło / Studio, feed i Story, A i B oraz siatka publikacji. Zatwierdzenie konkretnego wzorca/formatu/kolorystyki. Brak akceptacji lub niezamknięta rozbieżność oznacza draft, nie „zgodny”. Kontrola automatyczna jest konieczna, ale nie zastępuje tego odbioru.

## 9. Testy odbiorowe

1. Wynik: wygrana, porażka bez triumfalnych efektów, live i przerwa, remis w trakcie, zero, wyniki trzycyfrowe, BeKaPaKa po obu stronach danych źródłowych; kolor pełnego wyniku oraz kontur dokładnie według specyfikacji stanu.
2. Zapowiedź: normalna, matchday, przełożona z poprawnym nowym/starym terminem, odwołana, brak godziny, długi rywal, polskie znaki, hala.
3. Skład/zawodnik: pięć koszulek, długi roster z paginacją, długie nazwiska, brak portretu, poprawny numer, MVP z potwierdzeniem, strój B z potwierdzonym kontekstem.
4. Turniej/relacja: właściwa hala, aktualne parametry wydarzenia, prawdziwe zdjęcia i kadry, cztery slajdy, papier i rama, długi opis bez ściskania.
5. Partnerzy/terminarz/statystyki: równa ekspozycja, aktualne logotypy, jawne wyjątki, brak utraconych wierszy, prawdziwe zera odróżnione od braków danych.
6. Format: natywne wymiary, pełne tło, safe zones, układ 9:16 w wysokim telefonie, podgląd 360 px. Preview i eksport mają zgodną kompozycję i ten sam render.
7. Historia/bezpieczeństwo: stara rewizja renderowana swoim rendererem, migracja tworzy nową, zatwierdzenie A nie odblokowuje B, wycofany zasób blokuje nowy eksport, stary job nie zatwierdza nowej kompozycji, prywatne pliki nadal wymagają sesji.
8. Telefon i produkcja: Safari iOS, systemowe udostępnienie i zapis PNG w Zdjęciach, ZIP, dostępność bez Gemini, restart workera, idempotencja eksportu, kopia i odtworzenie jednego projektu w środowisku izolowanym.

## 10. Kolejność prac i wdrożenie

| Etap | Rezultat i warunek przejścia |
|---|---|
| 1. Audyt i wzorce | Rejestr rozbieżności, reguł i wszystkich obsługiwanych kombinacji; rozstrzygnięte sprzeczności rdzenia. |
| 2. Pionowa poprawka wyniku B | Wierny wynik 4:5, potwierdzony side-by-side; następnie zapowiedź i koszulka matchday B. |
| 3. Rdzeń ośmiu rodzin | Wejście JSON bez demo, właściwe A/B i natywne formaty, zdjęcia oraz kontrolowane tła; odbiór każdej rodziny. |
| 4. Rozszerzenia 38 typów | Nowe karty kompozycji, wzorce i akceptacje; usunięte automatyczne przypisanie trzech stylów wszędzie. |
| 5. Integracja i historia | Rejestr w edytorze, dane następnego meczu, wersjonowanie, migracja przez nową rewizję, brak dziedziczenia zatwierdzeń. |
| 6. Kontrola i pilotaż | Reguły, testy wizualne i przypadki graniczne; odbiór wspólnego feedu i telefonu. |
| 7. Produkcja | Backup, migracje addytywne jeśli potrzebne, CI po SHA, backend/frontend/worker zgodne, health i biblioteka, plan rollbacku. |

Pierwszy punkt kontrolny: poprawiony wynik B, orientacyjnie 1–2 dni po zamknięciu referencji. Całość: około 3–5 tygodni pracy jednej osoby, zależnie od liczby rzeczywiście potrzebnych nowych kompozycji i czasu odbioru. Estymację zaktualizować po audycie; nie obiecywać pełnego katalogu na podstawie samego przeliczenia 38 × 3.

Pilotaż: co najmniej dziewięć materiałów obejmujących wynik i zapowiedź A/B, skład, zawodnika/MVP, relację, turniej oraz informację lub statystyki; feed i Story, jasne/ciemne tła. Testowe dane są jawnie testowe. Produkcyjne materiały wymagają rzeczywistych, potwierdzonych danych i dopuszczonych zasobów.

Wdrożenie wyłącznie BeKaPaKa. Zachować prywatne pliki, istniejące limity workera i budżet Gemini. MOYA, jej konfiguracja, porty, sieci i wolumeny pozostają poza zakresem. Rollback przywraca obrazy i katalog wcześniejszego wydania, bez kasowania historii, danych i zatwierdzeń nowej wersji; nie odblokowuje szablonów oznaczonych jako niezweryfikowane.

## Kryteria ukończenia

- Każda dostępna do eksportu kompozycja ma konkretny wzorzec i zapisany odbiór; nie ma generycznej ścieżki zastępczej.
- Wszystkie 38 typów mają zakończone mapowanie: zatwierdzona kompozycja albo jawnie niedostępny draft do czasu odbioru; deklaracja ukończenia pełnego katalogu dopiero po odebraniu potrzebnych wzorców dla wszystkich typów.
- Użytkownik widzi ten sam układ na miniaturze, w preview i w PNG/ZIP.
- Wynik, zapowiedź i strój B odpowiadają odebranym referencjom, a testy wizualne blokują ponowne uproszczenie.
- Żaden brak danych, zdjęcia lub formatu nie powoduje cichego przejścia do innej kompozycji.
- Stare projekty nie zmieniają się samoczynnie; nowe produkcyjne eksporty spełniają nowe reguły.
- Telefon, native Story 9:16, autoryzacja, biblioteka, budżet AI i dane sportowe przechodzą regresje.
