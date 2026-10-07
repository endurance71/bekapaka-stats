# BeKaPaKa 2.0 — stan refaktoryzacji i QA

Aktualizacja: 5.10.2026. Podgląd produkcyjnego buildu: http://127.0.0.1:3100/. Zmiany pozostają lokalne. Nie wykonano deployu, migracji na VPS ani publikacji w CMS.

## Analiza obecnego stanu

Podstawy systemu zostały wdrożone: oddzielne tokeny WWW, Barlow/Barlow Condensed, znaki 2.0, pełne tła sekcji, bento meczu, jawne statusy, responsywna tabela, profile, galerie i bramka publikacji zdjęć. Stare publiczne arkusze usunięto; panel zachowuje własny system. Źródłem układów jest **brandbook WWW**, szczególnie s. 19–28, oraz jego referencyjne HTML. CURRENT.md rozstrzyga aktualność decyzji; główny brandbook rozstrzyga zasady znaków i identyfikacji.

Od wcześniejszego audytu doszły prezentacja strojów A/B, układ sekcji sportowej, wariant wsparcia na homepage, przebudowane relacje artykułów i stopka. Zachowano te elementy. Analiza wykryła również regresje: brak podglądu składu na homepage, brak linków do profili, proponowany e-mail opublikowany jako zatwierdzony, niejasny KRS, drobny tekst tabeli, ponowne nadpisanie proporcji treści artykułu oraz przewijanie całej strony szczegółów meczu.

## Korekty wykonane z obecnego stanu

| Obszar | Zmiana i uzasadnienie | Główne pliki |
|---|---|---|
| Homepage | Czterech pierwszych zawodników obok tabeli; nowe stroje zachowane niżej, ładowane lazy; partnerzy przed klubem/wsparciem. Usunięto obietnicę gotowej oferty sponsorskiej, która pozostaje otwartą decyzją. | `MegaHomeTemplate.tsx`, `JerseyShowcase.tsx` |
| Skład | Przywrócono bezpośrednie linki `/sklad/[id]` obok zachowanego draweru. Nazw nie zgaduje się: adapter odwraca tylko parę potwierdzoną przez markę lub dokładną tożsamość nowego importu KALK. | `RosterList.tsx`, `player-identity.ts`, `backend.ts` |
| Profile i fokus | Numer, prawdziwy portret i dane sezonu zgodne z WWW 24; brak występów daje kreskę. Imię/nazwisko mają separator dla czytników. Fokus wraca dopiero po zakończeniu zamykania draweru i zdjęciu inert. | `PlayerProfile.tsx`, `SlideoutPanel.tsx` |
| Tabela | Dane i pełne nazwy 16 px; podstawowe sześć kolumn na telefonie, lokalne przewijanie rozszerzonej tabeli, sticky drużyna, nagłówki wierszy. | `StandingsBoard.tsx`, `digital.css` |
| Artykuły i mecze | Przywrócono treść 8/4, hero 7/5, pełną kolumnę bez okładki i pełną szerokość danych sportowych. `min-width:0` zatrzymuje rozpychanie strony przez tabelę statystyk. | `EditorialDetailTemplate.tsx`, `digital.css` |
| Wspólne listingi | Usunięto klasę karty z opakowań nagłówka i całej treści. Pozostają otwarte sekcje na płycie/papierze; karty dotyczą rzeczywistych elementów listy. Usunięte wewnętrzne paddingi przywracają szerokość sześciu kolumn tabeli na telefonie. | `EditorialListingTemplate.tsx`, `EditorialNewsTemplate.tsx`, `PageScaffold.tsx`, `digital.css` |
| Aktualności bez JS | Usunięto globalny i redakcyjny streamingowy loading, które wymagały skryptu do odsłonięcia SSR. Loading dla meczów/tabeli/składu oraz pobierania statystyk pozostaje. Paginacja sprawdza rzeczywistą liczbę kolejnych wpisów. | `app/aktualnosci/page.tsx`; usunięte `app/loading.tsx`, `app/aktualnosci/loading.tsx` |
| Kontakt i wsparcie | Przywrócono istniejący kontakt do czasu zatwierdzenia nowego. KRS jednoznacznie opisuje Fundację FSMM; dokumenty wróciły do stopki. Rachunek, cel i QR zachowano. | `site-settings.ts`, `SiteFooter.tsx`, `FsmmSupportSection.tsx` |
| LCP | Hero otrzymało preload oprócz eager/high priority; pozostałe zdjęcia i stroje lazy. | `MatchCard.tsx`, `FallbackImage.tsx` |

## Weryfikacja

- Site: **97 testów / 15 plików**, typecheck, lint bez ostrzeżeń i build produkcyjny — zaliczone.
- Backend: **94 testy zaliczone, 13 pominiętych**, 15 plików zaliczonych / 1 pominięty. Pominięcie nie oznacza weryfikacji integracji z bazą.
- Osiem głównych widoków przy 390 i 1440 px; osiem artykułów, dwa mecze KALK, dwa szczegóły wydarzeń i wszystkie 20 profili przy 390 px. Zapisane zrzuty i odczyty DOM w `brandbook-audit/current/`.
- Homepage: 375/390/430/768/820/1024/1280/1440/1920 px, bez poziomego wyjścia. Nagłówek 60/72 px, hamburger przy 1024 px, cztery karty zawodników.
- Klawiatura: menu, galeria (20 zdjęć, strzałka, Esc, powrót fokusu), profil w drawerze i QR (Esc, powrót fokusu) — sprawdzone w przeglądarce.
- JavaScript wyłączony: filtr `?category=Turniej` renderuje treść i aktywny filtr; `?page=2` pokazuje uczciwy pusty stan, link do nowszych i własny canonical.
- Offline: komunikat o braku połączenia widoczny; emulacja została wyłączona po teście. Stroje A/B: przełączenie przód/tył działa.
- Zachowane przekierowania `/o-klubie` i `/wydarzenia/event`: 307 do istniejących celów; nieistniejący adres: HTTP 404.

Nie przeprowadzono pełnego odbioru VoiceOver/TalkBack ani Safari/Firefox. Wynik automatycznego audytu nie jest potwierdzeniem pełnej zgodności WCAG.

## Lighthouse i budżety

Lokalny produkcyjny build, homepage, Lighthouse 13.5.0. Dane laboratoryjne z 5.10.2026; pomiary lokalnego CMS/API i cache nie zastępują pomiarów po przyszłym deployu.

| Pomiar | Mobile | Desktop |
|---|---:|---:|
| Performance | 92 | 100 |
| Accessibility / Best practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| LCP | 3,43 s | 0,78 s |
| CLS | 0 | 0 |
| TBT | 8 ms | 0 ms |

Transfer w raporcie mobile: skrypty ok. **165 KiB**, CSS **18 KiB**, fonty **72 KiB** (transfer HTTP, obejmuje nagłówki). CSS i fonty mieszczą się w budżecie. **Mobilny LCP i budżet JS nadal nie spełniają celu**. INP nie zmierzono; nie wyprowadza się go z TBT. Surowe raporty: `brandbook-audit/current/lighthouse-{mobile,desktop}.json`.

## Pozostałe prace i granice odbioru

1. Ograniczyć pobierany JS oraz ponownie zbadać mobilny LCP; obecny wynik nie stanowi odbioru budżetów.
2. Potwierdzić alt, autora, podpisy i zgody mediów. Lokalny podgląd pokazuje istniejące zdjęcia na wyraźne życzenie użytkownika; produkcja nie renderuje niepotwierdzonych materiałów.
3. Uzupełnić portrety z nowej zatwierdzonej sesji: większość istniejących zdjęć ma stare czerwone tło i herb na stroju. Nie retuszowano twarzy ani nie generowano zawodników. Portret #24 skopiowano bez zmian z tymczasowych źródeł marki; jego pochodzenie nie jest zgodą publikacyjną.
4. Odbiór Safari/Firefox, VoiceOver/TalkBack, rzeczywisty dotyk/swipe, INP oraz integracyjne publish/unpublish, ręczna edycja i import na izolowanej bazie/CMS. Testy jednostkowe nie zastępują tych sprawdzeń.
5. Kontakt docelowy, poziomy partnerów, partner główny, formularz i procedura zdjęć pozostają konfiguracją/TODO.
6. Dopiero przed oddzielnie zleconym deployem: wskazane runbooki, backup baz/uploadów, kompatybilne migracje Game/KalkMatch, kolekcja media-record i uprawnienia CMS, rewalidacja oraz rollback. MOYA pozostaje poza zakresem.

Dokładne rozbieżności przed korektą: [porównanie strony po stronie](brandbook-page-audit.md). Inwentaryzacja mediów: [JSON](bekapaka-2-media-inventory.json).

## Kolejna iteracja wizualna

Dopracowano kompozycję strefy sportowej, kontrolki i tło strojów, siatkę oraz pełne kadry logo partnerów, a także rytm kart aktualności. Szczegóły, pliki i wyniki: [raport dopracowania](visual-polish-2026-10-05.md). Zrzuty tej iteracji są w `brandbook-audit/polish/`.

## Uproszczenie widoku meczów

Na życzenie użytkownika usunięto tabelę ligi i zakładkę „Tabela” z `/mecze`. Widok pobiera tylko dane meczowe; pozostają Terminarz/Wyniki, szczegóły i samodzielna `/tabela` w głównej nawigacji. Nagłówek to „Terminarz i wyniki”; link stopki to „Mecze”. Usunięto nieużywany styl `schedule-table`. Typecheck, lint i produkcyjny build zaliczone; w przeglądarce sprawdzono oba widoki, brak tabeli oraz link `/tabela` w nawigacji. Zrzut: `brandbook-audit/polish/matches-without-table.png`.

## Bezpośrednie profile zawodników

Zgodnie z najnowszą decyzją użytkownika karty w `/sklad` otwierają od razu `/sklad/[id]`, tak jak karty na homepage. Usunięto drawer zawodnika, stan wyboru i zdublowany link pod kartą; lista jest komponentem serwerowym i używa wspólnego `PlayerCard`. Usunięto dwa nieużywane selektory CSS. Drawer szczegółów meczów pozostaje. Typecheck, lint i produkcyjny build zaliczone. Przeglądarka: 20 linków i zero przycisków kart; kliknięcie Pawła i Enter na karcie Jędrzeja prowadzą na właściwy URL oraz H1, bez draweru. Profil mobilny bez poziomego wyjścia. Zrzuty: `brandbook-audit/polish/player-direct-profile-{1440,390}.png`.

## Dopracowanie kart i profili

Poprawiono długie nazwiska, kompozycję szczegółowych statystyk, tabelę historii i prezentację brakujących procentów. Bieżący wynik: 100 testów w 16 plikach, typecheck, lint i build zaliczone. [Raport iteracji](profile-refinement-2026-10-05.md) zawiera zmiany, źródła marki, zrzuty i granice odbioru.

## Próba portretu bez tła

Na życzenie użytkownika przygotowano próbne wycięcie Tomasza Kaszubowskiego, dostępne tylko lokalnie. Zachowano oryginał; wariant AI nie gwarantuje zachowania detali osoby, dlatego wymaga oceny przed użyciem jako docelowy portret. [Raport próby](player-cutout-trial-2026-10-05.md) zawiera pochodzenie, ograniczenia, pliki i weryfikację.

## Portrety pozostałych zawodników

Na wyraźne zlecenie użytkownika przygotowano 9 kolejnych lokalnych wizualizacji AI: strój A i numer, przezroczyste tło oraz światło, kąt kamery i kadr według Damiana. Łącznie 11/20 dostępnych portretów; 9 zawodników wymaga fotografii źródłowych. Oryginały zachowano. Przypisanie wymaga ID i zgodnego numeru, poza podglądem localhost warianty są wyłączone. 104 testy w 17 plikach, typecheck, lint i produkcyjny build zaliczone; skład 1440/390 px i 9 nowych profili sprawdzone w przeglądarce. [Raport batch](player-portraits-batch-2026-10-05.md) zawiera pliki, pełne prompty, pochodzenie, zrzuty, ograniczenia i listę brakujących zdjęć.

## Wyrównanie kafelków artykułów — 6.10.2026

Na prośbę użytkownika poprzedni/następny artykuł wyrównano do szerokości i obu krawędzi coveru. W `site/app/styles/digital.css` nagłówek oraz treść używają wspólnej siatki 7/5 z takim samym odstępem; usunięto dwie rozbieżne reguły 8/4. Szerokość tekstu nadal ogranicza istniejący reading-max, a mobile pozostaje jednokolumnowy. Produkcyjny build z typecheck zaliczony. Pomiar przeglądarkowy cover/kafelki: 513,328 px przy 1440 px, 373,75 px przy 1024 px i 343 px przy 390 px; identyczne lewe krawędzie, bez overflow. Dowody: `brandbook-audit/polish/article-alignment/checks.json` i zrzuty `article-{1440,1024,390}.png`. Lokalny serwer działa na porcie 3100; bez deployu.

## Wyrównanie numeru w ścieżce profilu — 6.10.2026

W `site/app/styles/digital.css` elementy `.profile .breadcrumbs li` mają wspólne centrowanie w pionie i minimalną wysokość 44 px. Numer i separator są teraz na równi z linkiem Skład, którego pole kliknięcia pozostaje 44 px. Build produkcyjny z typecheck zaliczony. Pomiar tekstu profilu Damiana: identyczne top/bottom dla Skład i #24 przy 1440 i 390 px, bez overflow. Dowody: `brandbook-audit/polish/profile-breadcrumb/checks.json` i `profile-{1440,390}.png`. Podgląd localhost zaktualizowany, bez deployu.

## Stroje bez czarnych prostokątów — 6.10.2026

Na życzenie użytkownika przygotowano transparentne wersje czterech zdjęć strojów A/B, przód/tył, wbudowanym narzędziem imagegen. Oryginały pozostają. JerseyShowcase używa nowych PNG i właściwych proporcji. Typecheck, lint i build zaliczone; sprawdzono przezroczystość po Next Image, kliknięcie i Enter, front/back obu wariantów oraz brak overflow na desktop/mobile. [Raport, pliki i pełne prompty](jerseys-transparent-2026-10-06.md). Podgląd lokalny zaktualizowany, bez deployu.

## Opis klubu w stopce — 6.10.2026

Zgodnie z prośbą użytkownika usunięto frazę „— mecze bezpłatne” z SiteFooter.tsx. Wspólna stopka prezentuje teraz „(KALK). Organizujemy…”. Produkcyjny build z typecheck zaliczony; w przeglądarce potwierdzono brak frazy w stopce profilu Damiana. Zrzut: `brandbook-audit/polish/footer-copy/footer.png`. Podgląd lokalny działa na porcie 3100.

## Bilans punktów w kafelku Tabela KALK — 6.10.2026

W MegaHomeTemplate dodano „+/−” obok punktów i liczby meczów. Kafelek korzysta z pointsDiff, a przy jego braku oblicza różnicę tylko z kompletu pointsFor/pointsAgainst. Brak danych pokazuje „—”, rzeczywiste zero pozostaje 0. Wykorzystano istniejące formatDiffValue i formatPointBalance. Span ma opis „Bilans punktów” dla czytnika i nie łamie symbolu od wartości. CSS zachowuje istniejącą skalę, kolor i siatkę. 6/6 testów mega-home-table (w tym znak dodatni/ujemny, zero, wyliczenie i brak danych), typecheck, lint i build zaliczone. Przeglądarka 1440/1024/390 px: +/− +66, link /tabela, bez overflow. Dowody: `brandbook-audit/polish/position-balance/checks.json` oraz zrzuty home/tile. Lokalny podgląd zaktualizowany; bez deployu.

## Przebudowa „O klubie” — 6.10.2026

Na prośbę użytkownika przebudowano `/klub`: znak główny 2.0 i wordmark na istniejącym deseniu pasków, sekcje o stowarzyszeniu, skrót faktów, Drużyna/Społeczność/Wydarzenia, wartości, wsparcie i kontakt. Płyta/papier, czerwone CTA, ścięcia i typografia korzystają z systemu WWW; stare reguły strony zastąpiono. Zachowano dane FSMM, QR, dokumenty, kontakt i przekierowanie `/o-klubie`. 109 testów w 17 plikach, typecheck, lint i build zaliczone. Przeglądarka: 375/390/768/1024/1440/1920 px bez overflow, znaki załadowane; QR, Esc i powrót fokusu oraz przekierowanie sprawdzone. [Raport przebudowy](club-redesign-2026-10-06.md) zawiera źródła marki, pliki, zrzuty i granice odbioru. Podgląd lokalny działa; bez deployu.

## Przecięcie BKPK według brandbooka WWW — 6.10.2026

Usunięto rozbieżną maskę `.brand-cut` wycinającą 49–52% pola tekstu. Wspólna reguła `.cut,.brand-cut` używa tokenów 0.662–0.6865em i wysokości wiersza 1, zgodnie ze stroną 11 brandbooka WWW oraz źródłowym CSS marki. Poprawka obejmuje godzinę/wynik, miejsce w tabeli, nazwisko w profilu i kod 404. Zachowano fallback Safari/Firefox. Typecheck, lint i produkcyjny build zaliczone; homepage/profil 1440 i 390 px oraz 404 sprawdzone w Chromium bez overflow. [Raport korekty](text-cut-2026-10-06.md) zawiera źródła, pomiary, zrzuty i granice testów. Podgląd lokalny zaktualizowany, bez deployu.

## Czytelne mobilne tabele ligi — 6.10.2026

Na życzenie użytkownika wspólny StandingsBoard na homepage i `/tabela` pokazuje na telefonie logo oraz krótki identyfikator drużyny. Pełne nazwy pozostają dla czytników i desktopu. Stała kolumna 108 px i nieprzezroczyste tła naprawiają nachodzenie statystyk podczas przewijania „Więcej kolumn”. Region jest dostępny klawiaturą; podstawowe kolumny mieszczą się w kontenerze, rozszerzona tabela ma 680 px zamiast 900 px. 118 testów w 18 plikach, typecheck, lint i build zaliczone. Sprawdzono 375/390/430/768/1440 px, obie tabele i przewijanie klawiaturą. [Raport mobilnej tabeli](mobile-table-2026-10-06.md) zawiera zmiany, zrzuty, pomiary i ograniczenia. Podgląd lokalny zaktualizowany, bez deployu.

## Research i podmiana logotypów partnerów — 6.10.2026

Przejrzano wszystkich 14 partnerów, oficjalne strony, materiały dla mediów i źródła klubowe. Dodano 5 brakujących znaków i poprawiono 3 istniejące: łącznie 9 logo, w tym 5 SVG. Majster Plus i ALAB korzystają z oficjalnych SVG; LP z oficjalnego EPS C1; Baumal z dostarczonego EPS; CESiR z oficjalnego PNG 3333×1592. Zachowano wektor herbu gminy. Uporządkowano marginesy Fem-Tech i usunięto stary podpis z materiału CERTE, pozostawiając tylko znak. Dla pięciu partnerów bez potwierdzonego pliku pozostają pełne nazwy; odrzucono POM-PUI innego przedsiębiorcy oraz znaki firm o podobnych nazwach. Zaktualizowano właściwe adresy WWW, zachowano jedną listę, kolejność i barwy znaków. 118 testów w 18 plikach, typecheck, lint i produkcyjny build zaliczone. Przeglądarka: homepage i /sponsorzy, 390/768/1440 px, komplet obrazów i brak overflow. [Szczegółowy research, źródła, manifest i QA](partner-logos-2026-10-06.md). Podgląd lokalny zaktualizowany, bez deployu.

## Centrowanie krzyżyka w oknie QR — 6.10.2026

Odtworzono przesunięcie SVG przycisku `.donation-qr-modal__close` o 5 px w lewo. Domyślny padding przycisku i blokowy SVG nie zapewniały centrowania poziomego. W istniejącej regule ustawiono `display:grid; place-items:center; padding:0`, zachowując pole 44×44 px, obramowanie i ikonę. Dowody pomiaru oraz podgląd: `close-icon-2026-10-06/`.

Weryfikacja poprawki QR: produkcyjny build wraz z typecheck zaliczony. W przeglądarce przy 390 i 1440 px środek SVG pokrywa się ze środkiem przycisku w obu osiach (offset 0 px). Sprawdzono Esc, zamknięcie kliknięciem oraz powrót fokusu na wywołujący przycisk. Podgląd lokalny na 3100 zaktualizowany.

## ShipApp w siatce partnerów — 6.10.2026

Po wskazaniu użytkownika uzupełniono pominięty rekord ShipApp na homepage oraz `/sponsorzy`, zgodnie z listą partnerów w projekcie marki. Użyto oryginalnego transparentnego PNG 1884×366, bez przerysowania. Link kieruje do ShipApp; sygnatura w stopce pozostaje. Obecnie 15 partnerów i 10 logotypów. Dowody: `shipapp-partner-2026-10-06/`, zaktualizowany manifest logotypów.

Weryfikacja ShipApp: produkcyjny build z typecheck zaliczony; w przeglądarce homepage i `/sponsorzy` zawierają 15 kafli oraz dokładnie jeden ShipApp w siatce, z załadowanym oryginalnym PNG i linkiem do shipapp.pl. Homepage 390 px bez overflow. Podgląd lokalny zaktualizowany.
