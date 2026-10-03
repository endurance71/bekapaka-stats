# BeKaPaKa Studio

Studio jest osobną, prywatną aplikacją React/Vite w `studio/`. API `/api/studio/v1` działa w obecnym backendzie. Render i żądania Gemini obsługuje `backend/studio/worker.js`. Strona publiczna, panel, modele KALK i CMS zachowują swoje funkcje.

## Uruchomienie lokalne

Wymagane Node 22, PostgreSQL, Python 3.11+ i środowisko backendu z poprawnym `DATABASE_URL` oraz `JWT_SECRET`. Nie kieruj lokalnych testów integracyjnych do produkcji.

1. `npm --prefix backend ci`, `npm --prefix studio ci`.
2. W `backend/`: `npx prisma generate` i `npx prisma migrate deploy`.
3. `python3 -m venv backend/studio/.venv` oraz `backend/studio/.venv/bin/pip install -r backend/studio/renderer/requirements.txt`.
4. Dodaj zmienne z `backend/studio/.env.example` do prywatnego środowiska backendu. `STUDIO_OWNER_ID` to identyfikator istniejącego konta, nie login. Login i hasło pozostają tymi samymi co w panelu. Nie używaj klucza Gemini analiz meczów do Studio.
5. Uruchom backend na porcie 4001 i worker z tym samym środowiskiem. Przykładowo z `backend/`: `node --env-file=.env server.js`, `node --env-file=.env studio/worker.js`.
6. `npm --prefix studio run dev`, otwórz `http://localhost:5174`. Ustaw dokładnie ten sam `STUDIO_ORIGIN`.

Ścieżki `STUDIO_STORAGE_DIR` i `STUDIO_PYTHON` najlepiej podawać jako absolutne. HEIC dekoduje `sips` na macOS lub `heif-convert` na Linuxie, obecny w obrazach Docker. Nieobsługiwany kodek zgłasza czytelny błąd. Wszystkie fotografie są normalizowane do PNG, orientacji EXIF i sRGB; wycięcia zachowują alfę.

## Korzystanie

1. Nowy projekt → konkretny typ publikacji → kompozycja sportowa, fotograficzna lub redakcyjna. Katalog ma 38 typów, wyszukiwarkę, kategorie i miniatury. Importuj mecz z wybranego sezonu, zawodnika albo opublikowaną treść CMS. Formularz zachowuje migawkę użytych danych. „Sprawdź zmiany” pokazuje aktualne źródło i różnice; aktualizację zatwierdzasz sam.
2. Uzupełnij datę, miejsce, rywala i treści. Wstęp wolny nie jest dopisywany automatycznie. Live/przerwa wymagają ręcznego wyniku i fazy meczu. Wskaż i potwierdź skład/MVP. Zawodnik może mieć do trzech ręcznie potwierdzonych statystyk meczu lub średnich sezonu. Import osoby nie przenosi niesprecyzowanych sezonowo średnich z cache rosteru. Godzina i dzień tygodnia są liczone w Warszawie.
3. Dodaj materiały w Bibliotece: autor/pochodzenie, osoby, numer stroju, prawa do publikacji i status. Materiał roboczy można oglądać, ale nie eksportować produkcyjnie. Zatwierdzenie obrazu AI jest osobną oceną, obejmującą brak ludzi, znaków i niepożądanych treści.
4. Wybierz układ i osobno kolorystykę stroju. Granat/pomarańcz wymaga potwierdzenia kontekstu stroju B. Format zmienia kompozycję w natywnych wymiarach. Kadr zachowuje proporcje zdjęcia.
5. Oceń podgląd również przy 360 px. Nowe kompozycje 2.0.0 są początkowo `draft`; zatwierdzenie dotyczy konkretnego typu, kompozycji i formatu po obejrzeniu aktualnego podglądu. Każdy wybrany format wymaga oceny. W „Marka i partnerzy” można wycofać konkretną kompozycję/format. Dotychczasowe projekty, renderer 1.0.5 i zatwierdzenia rodzin pozostają bez zmian; nic nie migruje automatycznie.
6. Potwierdź dane i wygląd bieżącej rewizji. Potwierdzenie obejmuje również odcisk wybranych materiałów i partnerów; zmiana znaku, praw do zdjęcia lub danych partnera wymaga odświeżenia podglądu i ponownej oceny. Każda edycja unieważnia potwierdzenie. „Sprawdź eksport” wskazuje konkretne pola do poprawy.
7. Generuj paczkę. ZIP zawiera PNG sRGB, opis, globalny tekst alternatywny, mapę tekstów dla slajdów, oznaczenie AI i manifest. Możesz pobrać pojedyncze pliki. Na telefonie przycisk udostępnienia ZIP korzysta z systemowego share sheet, jeżeli przeglądarka go obsługuje.

Przy konflikcie dwóch urządzeń Studio nie nadpisuje projektu; pokazuje błąd i pozwala wczytać aktualną rewizję. Niezapisane zmiany pozostają w formularzu. Cofanie dotyczy sesji edycji, a przywrócenie historii tworzy nową rewizję. Archiwum nie usuwa projektu. Zduplikuj projekt, aby ponownie edytować materiał z archiwum.

Partnerzy startują jako zestaw do sprawdzenia. Obowiązuje jeden poziom, porządek alfabetyczny i równe pola optyczne. Nieaktualne „POM-PUI” jest zastąpione plakietką aktualnej nazwy. Warunki umowne zapisuje pole uwag; obecny renderer nie interpretuje swobodnego tekstu jako zmiany hierarchii. Nietypowa ekspozycja wymaga osobnego zatwierdzonego szablonu.

## Marka i renderer

`backend/studio/brand/manifest.json` wersjonuje tokeny, fonty OFL, znaki 2.0, faktury, toolkit i rejestr partnerów. Import `python3 scripts/studio/import-brand.py '<ścieżka repo marki>'` kopiuje tylko dozwolone źródła. Produkcja nie odczytuje ścieżek na Macu. Zmiana źródeł marki wymaga nowego `BRAND_VERSION` w kontraktach i manifeście importu; zmiana kompozycji wymaga nowej wersji szablonu, a zmiana silnika — `RENDERER_VERSION`. Nie podmieniaj plików pod już zatwierdzoną wersją. Import nie obejmuje danych demonstracyjnych ani zdjęć zawodników.

`renderer/render.py` przyjmuje JSON projektu. Typografia jest konwertowana do krzywych; Sharp tworzy PNG z profilem ICC sRGB. Kontrola obejmuje kolizje, pola ochronne, minima fontów i znaków, marginesy oraz stories 260–1600. Przepełnienie jest błędem, nigdy cichym pomniejszeniem poniżej minimum. Render eksportu ponownie sprawdza dopuszczenie materiałów. Układy mają własne geometrie i paginację; terminarz w kwadracie/poziomie mieści mniej pozycji na planszy niż post/story.

## Biblioteka publikacji 2.0.0

Oprócz meczów, składów, zawodników, turniejów, relacji, partnerów i informacji katalog obejmuje statystyki drużyny i zawodnika, liderów meczu (również remisy), tabelę ligi, kolejkę, sezon oraz urodziny, treningi, kulisy, cytaty, jubileusze, zaproszenia i komunikaty. Typ publikacji, kompozycja i stroje A/B są osobnymi ustawieniami. Zmiana kompozycji zachowuje dane, kadr i wybrane zasoby. Wszystkie typy obsługują post 1080×1350 i Story 1080×1920; rodziny z dotychczasowymi dodatkowymi formatami zachowują kwadrat i poziom. Podgląd telefonu nadal rozdziela ekran urządzenia od mastera Story 9:16. Zapis pojedynczego PNG do Zdjęć i pobieranie ZIP pozostają dostępne.

Statystyki korzystają wyłącznie z istniejących publicznych danych KALK. Identyfikacja meczu obejmuje sezon, a migawka zawodnika/liderów zachowuje wybrany kontekst podczas aktualizacji źródła. Brak liczby nie daje zera; sumy zespołu powstają wyłącznie z kompletnych wartości zawodników i są opisane. Tabela i podsumowania zachowują kontekst meczu/sezonu. Korekty są lokalne dla projektu. Formularze klubowe są ręczne; nie importują prywatnych notatek ani frekwencji treningowej.

Kontrakty nowych projektów mają opcjonalne `postType`, `visualStyle`, `designVersion`; starsze payloady nie otrzymują nowych pól. Nowe wersje zatwierdzeń są zapisane w istniejącej tabeli StudioTemplate pod kluczem `2.0.0:typ:kompozycja:format`; zmiana nie wymaga migracji SQL. Manifest eksportu zawiera te same wersje. Renderer `render_v2.py` ma własne kompozycje; dispatcher starszych projektów jest zachowany.

Miniatury są ilustracyjne i nie stanowią zatwierdzenia ani źródła danych projektu. Regeneracja: `node scripts/studio/generate-catalog.mjs` (z głównego katalogu, po zainstalowaniu backendu i środowiska Python). Korzystają z materiału marki zamiast fikcyjnych fotografii ludzi. Test `test_catalog.py` sprawdza wszystkie typy/kompozycje/formaty, różnice geometrii i paginację; testy API sprawdzają izolację zatwierdzeń oraz eksport nowej wersji. Podgląd i eksport nadal używają tego samego renderera.

## AI i koszty

`STUDIO_GEMINI_API_KEY` jest osobnym kluczem. Modele są konfigurowane na serwerze, ale model bez znanej ceny jest blokowany do aktualizacji `pricing.json`. Cennik ma wersję, źródło i datę weryfikacji. Budżet jest ograniczony do maksymalnie 10 USD miesięcznie, z możliwością ustawienia niższego limitu.

Rezerwacja tekstu: 0,05 USD (wejście ograniczone bajtowo, wynik 1200 tokenów). Rezerwacja obrazu: 0,30 USD (2K, wynik maks. 4096 tokenów). Rezerwacje korzystają z transakcyjnej blokady PostgreSQL. Zużycie jest rozliczane według metadanych odpowiedzi; brak wiarygodnych metadanych zachowuje pełną rezerwację. Timeout, odmowa i niepoprawna odpowiedź nie wywołują automatycznej regeneracji ani ponowienia. Niepewne koszty pozostają zarezerwowane. Sprawdzenie i ewentualne uwolnienie takiej rezerwacji wymaga potwierdzenia rachunku dostawcy przez administratora; UI nie ma przycisku omijania limitu.

Tekst AI otrzymuje wyłącznie białą listę pól z potwierdzonej rewizji: publiczne informacje wpisane do materiału. Nie pobiera notatek trenera, analiz, scoutingu ani danych logowania. Użytkownik powinien wpisywać w pola publikacyjne wyłącznie treści publiczne. Tła mają trzy zamknięte tryby: faktura, pusty parkiet, martwa natura. Zdjęcia ludzi nie są wysyłane ani edytowane przez AI. Wyniki obrazu startują jako niezatwierdzone zasoby i zapisują prompt/model/datę/koszt. Brak API nie blokuje edytora i eksportów.

## Produkcja na VPS

Przed operacjami przeczytaj runbook VPS, optymalizację, rotację sekretów, scraping, plan analiz AI i Docker deploy. W checkoutcie brak `VPS-dane/README.md`; nie zastępuj go domysłami o dostępie. MOYA pozostaje poza zakresem.

1. Ustal właściciela i odczytaj ID konta bez haseł/tokenów. Na VPS ustaw prywatnie `STUDIO_OWNER_ID`, `STUDIO_CMS_TOKEN` (Strapi read-only, nie Admin/MCP), `STUDIO_GEMINI_API_KEY` oraz budżet. Backend musi mieć `STUDIO_ORIGIN=https://studio.bekapaka.pl`.
2. Sprawdź RAM ≥ 1,5 GiB wolnej, dysk <75%, wolny localhost:8083, działające backupy DB. Dodaj rekord DNS A Studio do istniejącego IP VPS.
3. CI `.github/workflows/studio.yml` sprawdza API, PostgreSQL, renderer i aplikację, buduje obrazy `studio:<SHA>` i `studio-worker:<SHA>`. Istniejący pipeline wdraża backend z migracjami addytywnymi. Te same SHA muszą być użyte razem. Studio nie jest automatycznie uruchamiane zwykłym deployem, bo ma profil Compose `studio`.
4. Przenieś zweryfikowane skrypty i Compose na VPS z czystego checkoutu zgodnie z zasadami repo, bez zwykłego `git pull` w starym checkoutcie po przepisaniu historii. `scripts/studio/deploy.sh <pełne SHA>` sprawdza właściciela, obraz backendu, port i zdrowie. Aktualizuje wyłącznie dwie usługi Studio.
5. Dopisz wyłącznie blok `scripts/studio/Caddyfile.studio` do Caddy, zachowując wszystkie istniejące hosty. Najpierw `caddy validate`, później reload, następnie test HTTPS/login/pobrania. Nie zmieniaj hostów ani portów MOYA.
6. Worker: 1 CPU / 1 GiB RAM, dwie niezależne kolejki (jeden render i jedno AI jednocześnie), bez publicznego portu. Health check monitoruje aktualność heartbeat workera. Frontend: localhost:8083, 128 MiB. Pliki: prywatny `data/studio`, prawa 0700, bez mapowania przez serwer statyczny. Pobrania są autoryzowane i sprawdzają termin ważności.
7. Zapisz `BKPK_STUDIO_IMAGE_TAG=<SHA>` w prywatnym `.env`, by ręczny compose zachował wydanie. Rollback dwóch obrazów Studio używa poprzedniego SHA i `up --no-deps` dla tych usług; nie cofa migracji. Nie usuwaj obrazów rollbacku przed odbiorem. Zmiana właściciela odbiera dostęp poprzednim sesjom.

## Biblioteka teł

Wersjonowany prywatny pakiet `backend/studio/backgrounds/` zawiera dziewięć ilustracji AI: farbę, papier, parkiet i trzy ujęcia linii boiska. Manifest przechowuje prompt, datę, SHA256 oraz początkową decyzję publikacyjną: sześć zaakceptowanych teł i trzy propozycje hali do oceny. Hala jest ilustracją ogólną, nie fotografią KOSiR. Generacja odbyła się poza Gemini Studio; nie obciąża jego licznika, a koszt zewnętrznego dostawcy jest nieznany.

`node studio/import-backgrounds.js` w katalogu backendu importuje pakiet wyłącznie dla skonfigurowanego `STUDIO_OWNER_ID`. Skrypt deployu Studio uruchamia ten import po sprawdzeniu właściciela i SHA backendu. Weryfikacja plików poprzedza zapis; blokada PostgreSQL i porównanie hashy zapobiegają duplikatom. Kolejne wydanie nie przywraca wycofanych materiałów ani nie zmienia decyzji użytkownika. Pliki wynikowe pozostają w prywatnym storage i są pobierane przez dotychczasowe autoryzowane endpointy. Pakiet nie zmienia kompozycji, formatów ani eksportera.

## Backup i odtworzenie

`backup.sh` tworzy pełny dump PostgreSQL (także obecne statystyki), niezmienne pliki źródłowe Studio, manifest marki i SHA256SUMS. Wymaga `rsync`, praw do Dockera i katalogu backupu. Stopuje tylko worker na czas spójnej kopii; API może zapisywać pliki, dlatego pliki są synchronizowane przed i po migawce DB. Backup nie obejmuje plików sesyjnych podglądów/eksportów — odtwarza się je z projektu. Na obecnym VPS użyj jednostek `studio-backup.service` i `studio-backup.timer` (systemd, bo host nie ma demona cron). `backup.cron` jest alternatywą dla hosta z cron. Zainstaluj timer po pierwszym odbiorze. Przechowuj kopię poza VPS.

Test odtworzenia przeprowadź w osobnej bazie i katalogu, z osobnym backendem/workerem na lokalnych portach. Zweryfikuj SHA256SUMS, `pg_restore --list`, odtwórz dump bez kierowania go do produkcyjnej bazy, przywróć źródła i uruchom eksport jednej zatwierdzonej rewizji. Porównaj hash PNG i dane w manifeście. Pomocnik: `STUDIO_RESTORE_DATABASE_URL=<osobna odtworzona baza> STUDIO_STORAGE_DIR=<osobny katalog odtworzonych plików> STUDIO_PYTHON=<python renderera> node scripts/studio/restore-check.mjs`. Odmawia użycia tego samego URL co `DATABASE_URL` i porównuje dwa rendery projektu z odtworzonej bazy. Nigdy nie odtwarzaj całego dumpu do produkcji tylko po to, by odzyskać pojedynczy projekt.

Worker usuwa podglądy po 24 h i paczki po 30 dniach. Rekord projektu, rewizje, manifesty eksportów, potwierdzenia i źródła pozostają. Wygasłe linki zwracają 404. Eksport można wykonać ponownie. Restart odzyskuje render; AI z przerwaną odpowiedzią otrzymuje `uncertain` i zachowuje rezerwację.

## Weryfikacja

### Podgląd publikacji

W edytorze i na pełnym ekranie dostępne są tryby **Grafika**, **Instagram** i **Facebook**. Relacje pokazują pasek postępu, profil i dolne kontrolki na pliku 9:16; posty mają ramkę feedu z opisem wpisanym w projekcie. To symulacja interfejsu telefonu — kontrolki platform mogą się różnić między wersjami aplikacji. Nakładki są wyłącznie warstwą przeglądarki: nie zmieniają projektu, nie uruchamiają renderowania i nie trafiają do PNG ani ZIP.

Przełącznik **Strefy bezpieczne** pokazuje dla relacji obszar informacji z pakietu marki: x=72–1008, y=260–1600. W rendererze 1.0.5 zapowiedź 9:16 ma znaki obok siebie, wspólną linię nazw i osobny rozkład nagłówka, dużej godziny oraz miejsca; wynik 9:16 ma osobne pozycje znaków, tablicy i wyniku. Wersja renderera uczestniczy w potwierdzeniu wyglądu, więc po zmianie kompozycji potrzebny jest nowy podgląd i potwierdzenie rewizji.

- Backend: `npm --prefix backend test -- --run`.
- Pełna integracja: osobna baza po migracjach, `STUDIO_TEST_DATABASE_URL=<URL testowej bazy> DATABASE_URL=<ten sam URL> npm --prefix backend test -- --run tests/unit/studio.integration.test.js`.
- Renderer: `backend/studio/.venv/bin/python -m unittest discover -s backend/studio/renderer -p 'test_*.py'`.
- Studio: `npm --prefix studio test` i `npm --prefix studio run build`.

Przed produkcyjnym odbiorem pozostaje rzeczywisty pilotaż: co najmniej dziewięć materiałów ocenionych przez właściciela, ocena wspólnego feedu, fizyczny Safari iOS / Chrome Android (HEIC i share sheet), rzeczywiste wywołanie osobno rozliczanego Gemini, pomiar RAM workera oraz test odtworzenia na VPS. Testy automatyczne i podgląd przeglądarkowy nie zastępują tych decyzji.
