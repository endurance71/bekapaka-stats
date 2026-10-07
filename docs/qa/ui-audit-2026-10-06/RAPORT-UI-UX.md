# BeKaPaKa 2.0 — kompleksowy audyt UI/UX

6 października 2026 · bieżący podgląd lokalny · raport analityczny

Strona ma już rzeczywistą, rozpoznawalną bazę BeKaPaKa 2.0. Największy zysk da teraz dopracowanie hierarchii, danych i wspólnych komponentów. Najsłabszą ścieżką jest obecnie przejście z terminarza do szczegółów meczu i mobilnego box score. Najmocniejsze elementy to hero meczu, tabela ligi po ostatniej poprawce, bezpośrednie profile oraz statyczna lista partnerów. Oceny poniżej są ocenami jakości UI, nie wynikami automatycznych testów ani badań użytkowników.

## Zakres, metoda i ograniczenia

Audyt dotyczy bieżącego lokalnego podglądu http://127.0.0.1:3100, 6 października 2026. Sprawdzono główne publiczne typy stron przy viewportach 1440×1000 i 390×844, dodatkowo homepage przy 768 i 1024 px. Przy pionowym scrollbarze dostępny obszar strony jest około 15 px węższy. Zrzuty są nowe, z tej sesji; historyczne screenshoty użytkownika służyły wyłącznie jako kontekst. Część pełnostronicowych prób pomijała lazy loading — takich pustych fragmentów nie potraktowano jako błędów strony i nie wykorzystano ich jako dowodów w raporcie. Zmiany UI, CMS, VPS ani deploy nie były wykonywane.

Nie sprawdzono pełnego panelu, draft preview, cyklu publish/unpublish, wszystkich dokumentów szczegółowych (lista jest pusta), wszystkich profili ani wszystkich artykułów. Nie przeprowadzono badań z kibicami, Lighthouse, axe, VoiceOver/TalkBack ani testów Safari/Firefox. Nie potwierdzono transferu JS/CSS w przeglądarce, INP ani zachowania offline. Odczyt kodu służył wyjaśnieniu konkretnych obserwacji; nie zastępuje testów stanów, których nie było w bieżących danych.

Priorytety: **P1** — naprawa przed odbiorem; **P2** — kolejny etap dopracowania. Nie potwierdzono P0 blokującego podstawowe zadania. **S**: mała zmiana; **M**: zmiana komponentu/ścieżki; **L**: większe porządki lub macierz QA. To względny zakres, nie obietnica czasu.

## Najważniejsze wnioski

1. Szczegóły meczu są obecnie najsłabszą ścieżką: dwa sposoby wejścia, instrukcja admina, powtórzony wynik i ciasna tabela mobilna.
2. Część drobnych usterek ma konkretną przyczynę techniczną: puste tokeny etykiety, kontrast około 4,01:1 i ukryty fokusowalny link.
3. Homepage i Klub potrzebują selekcji oraz nawigacji, a nie kolejnych dużych bloków dekoracyjnych.
4. Galerie, skład i dokumenty wymagają uzupełnienia prawdziwych danych oraz dobrych pustych stanów.
5. Zachować poprawione elementy: bento, mobilne skróty tabel, bezpośrednie profile, siatkę partnerów z ShipApp i działające zamykanie menu/modali.

## Ocena strona po stronie

| Ekran / ścieżka | Stan |
|---|---|
| 1. Strona główna | Dobra baza; skrócić dalszą część |
| 2. Terminarz i wyniki | Wymaga spójnej nawigacji |
| 3. Szczegóły rozegranego meczu | Najpilniejsza przebudowa UI |
| 4. Tabela ligi | Dobra; dopracować kontekst |
| 5. Lista zawodników | Dobry kierunek; nierówna kompletność |
| 6. Profil zawodnika | Dobra forma; poprawić interpretację danych |
| 7. Lista aktualności i kategorie | Dobra; poprawić mobilne odkrywanie |
| 8. Artykuł z plakatem | Czytelny tekst; istotne usterki covera i a11y |
| 9. Długa relacja i galeria | Wymaga lepszej nawigacji i metadanych |
| 10. Partnerzy | Kompletna lista; dopracować ekspozycję |
| 11. O klubie i wsparcie | Wyraźnie bogatsza; brakuje konkretów i skrótów |
| 12. Dokumenty, 404 i wspólny shell | Mieszana: dobre 404/menu, słabe dokumenty |

### 1. Strona główna

**Adres:** /

**Ocena:** Dobra baza; skrócić dalszą część.

**Co działa:** Bento rzeczywiście eksponuje mecz. Na pierwszym ekranie telefonu mieszczą się rywal, data, godzina, hala i kalendarz. Płyta/papier, czerwone akcje i ręcznie przewijany pasek wyników odpowiadają kierunkowi 2.0.

**Do poprawy:** UI-11, UI-12, UI-13.

**Dowody:** [01-home-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/01-home-desktop.png>), [16a-home-mobile-first-screen.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/16a-home-mobile-first-screen.png>), [33-home-1024.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/33-home-1024.png>).


### 2. Terminarz i wyniki

**Adres:** /mecze

**Ocena:** Wymaga spójnej nawigacji.

**Co działa:** Wiersze desktop i karty mobile są znacznie czytelniejsze od poprzedniej wersji. Tabela ligi nie jest powielana jako zakładka na stronie meczów. Przełącznik terminarz/wyniki używa URL.

**Do poprawy:** UI-01, UI-02.

**Dowody:** [02-mecze-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/02-mecze-desktop.png>), [03-mecz-panel-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/03-mecz-panel-desktop.png>), [17-mecze-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/17-mecze-mobile.png>).


### 3. Szczegóły rozegranego meczu

**Adres:** /mecze/kalk-4124

**Ocena:** Najpilniejsza przebudowa UI.

**Co działa:** Istnieje bezpośredni adres i udostępnianie. Wynik, kwarty oraz indywidualne statystyki są dostępne. Główna karta zachowuje BeKaPaKa po lewej.

**Do poprawy:** UI-03, UI-04, UI-02.

**Dowody:** [04-mecz-wynik-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/04-mecz-wynik-desktop.png>), [37-statystyki-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/37-statystyki-mobile.png>).


### 4. Tabela ligi

**Adres:** /tabela

**Ocena:** Dobra; dopracować kontekst.

**Co działa:** Mobilne logo + rozpoznawalny skrót oraz rozszerzane kolumny działają. Po scrollu sticky drużyna nie nakłada się na wartości. Własny wiersz ma czerwoną belkę, nie złote tło.

**Do poprawy:** UI-14, UI-15.

**Dowody:** [05-tabela-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/05-tabela-desktop.png>), [18-tabela-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/18-tabela-mobile.png>), [19a-tabela-scrolled-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/19a-tabela-scrolled-mobile.png>).


### 5. Lista zawodników

**Adres:** /sklad

**Ocena:** Dobry kierunek; nierówna kompletność.

**Co działa:** Karty prowadzą do osobnej strony zamiast draweru. Gotowe portrety mają wspólny charakter czarno-czerwonego stroju. Fallback nie udaje prawdziwej twarzy.

**Do poprawy:** UI-16.

**Dowody:** [06-sklad-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/06-sklad-desktop.png>), [20-sklad-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/20-sklad-mobile.png>).


### 6. Profil zawodnika

**Adres:** /sklad/123622e8-ddd8-40d4-986c-acd4ca39e85e

**Ocena:** Dobra forma; poprawić interpretację danych.

**Co działa:** Zdjęcie jest pierwsze na telefonie, nazwisko i numer są wyraziste. Breadcrumb Skład/#24 jest wyrównany. Statystyki i historia są dostępne bez panelu bocznego.

**Do poprawy:** UI-17, UI-18.

**Dowody:** [07-zawodnik-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/07-zawodnik-desktop.png>), [21-zawodnik-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/21-zawodnik-mobile.png>).


### 7. Lista aktualności i kategorie

**Adres:** /aktualnosci

**Ocena:** Dobra; poprawić mobilne odkrywanie.

**Co działa:** Papier, wyróżniony artykuł i siatka kart są spójne. Kliknięcie kategorii Drużyna zmienia query i pokazuje odpowiednią treść. Mechanizm paginacji pozostaje w kodzie; pełnego przebiegu bez JS nie odtworzono.

**Do poprawy:** UI-19, UI-20.

**Dowody:** [08-aktualnosci-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/08-aktualnosci-desktop.png>), [35-aktualnosci-mobile-first-screen.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/35-aktualnosci-mobile-first-screen.png>), [36-filtr-druzyna-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/36-filtr-druzyna-mobile.png>).


### 8. Artykuł z plakatem

**Adres:** /aktualnosci/iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026

**Ocena:** Czytelny tekst; istotne usterki covera i a11y.

**Co działa:** Układ 7/5, papier i ograniczona szerokość tekstu działają. Poprzedni i następny artykuł mają już szerokość kolumny covera. Data, autor i udostępnianie są obecne.

**Do poprawy:** UI-05, UI-06, UI-07, UI-22.

**Dowody:** [09-artykul-plakat-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/09-artykul-plakat-desktop.png>), [24-artykul-plakat-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/24-artykul-plakat-mobile.png>).


### 9. Długa relacja i galeria

**Adres:** /aktualnosci/3-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026

**Ocena:** Wymaga lepszej nawigacji i metadanych.

**Co działa:** Siatka zastąpiła karuzelę. Na telefonie są dwie kolumny; desktop wyróżnia pierwsze zdjęcie. Sprawdzono przejście strzałką do 2/20, Escape i powrót fokusu do miniatury.

**Do poprawy:** UI-08, UI-21, UI-23, UI-24.

**Dowody:** [34-gallery-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/34-gallery-desktop.png>), [30-gallery-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/30-gallery-mobile.png>), [29-lightbox-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/29-lightbox-mobile.png>).


### 10. Partnerzy

**Adres:** /sponsorzy

**Ocena:** Kompletna lista; dopracować ekspozycję.

**Co działa:** 15 partnerów, w tym ShipApp, jest widocznych. Statyczna siatka nie powiela DOM ani nie wymusza animacji. Nie ma wymyślonych poziomów współpracy.

**Do poprawy:** UI-25, UI-26.

**Dowody:** [11-partnerzy-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/11-partnerzy-desktop.png>), [27-partnerzy-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/27-partnerzy-mobile.png>).


### 11. O klubie i wsparcie

**Adres:** /klub

**Ocena:** Wyraźnie bogatsza; brakuje konkretów i skrótów.

**Co działa:** Herb, wordmark i deseń tworzą rozpoznawalne hero. Działalność, wartości, kontakt oraz FSMM mają własne sekcje. KRS opisuje fundację. QR otwiera się, Escape i powrót fokusu działają.

**Do poprawy:** UI-09, UI-27, UI-28, UI-29.

**Dowody:** [12-klub-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/12-klub-desktop.png>), [25-klub-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/25-klub-mobile.png>), [26-qr-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/26-qr-mobile.png>).


### 12. Dokumenty, 404 i wspólny shell

**Adres:** /dokumenty · /o-klubie · /wydarzenia · nieistniejący adres

**Ocena:** Mieszana: dobre 404/menu, słabe dokumenty.

**Co działa:** 404 jest po polsku i ma dwie drogi wyjścia. /o-klubie przekierowuje do /klub, a /wydarzenia do /mecze. Header nie łamie menu przy 1024 px, tylko pokazuje hamburger. Escape w menu przywraca fokus po zakończeniu animacji.

**Do poprawy:** UI-10, UI-30, UI-31, UI-32, UI-33, UI-34.

**Dowody:** [13-dokumenty-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/13-dokumenty-desktop.png>), [15-404-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/15-404-desktop.png>), [28-menu-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/28-menu-mobile.png>).


## Szczegółowy backlog: 34 zalecenia

| ID | Priorytet | Obszar | Zmiana | Zakres |
|---|---|---|---|---|
| UI-01 | P1 | Mecze | Jeden sposób otwierania szczegółów meczu | S–M |
| UI-02 | P1 | Mecze | Usunąć instrukcję administracyjną z widoku kibica | S |
| UI-03 | P1 | Mecze | Jeden wynik i jedna hierarchia strony meczu | M |
| UI-04 | P1 | Mecze | Przebudować mobilny box score | M |
| UI-05 | P1 | Artykuły | Plakat powinien być widoczny w całości | S–M |
| UI-06 | P1 | Dostępność | Naprawić tokeny i kontrast etykiety artykułu | S |
| UI-07 | P1 | Dostępność | Nie zostawiać niewidocznego linku w kolejności Tab | S |
| UI-08 | P1 | Galerie | Uzupełnić opisy zdjęć i autora | M + treść |
| UI-09 | P1 | Kontakt | Zatwierdzić publiczny kontakt klubu | S + decyzja |
| UI-10 | P1 | Dokumenty | Dać dalszą akcję w pustych dokumentach | S + treść |
| UI-11 | P2 | Homepage | Skrócić drugą połowę strony głównej | M |
| UI-12 | P2 | Homepage | Ujednolicić znaki rywala i nazwy kolejki | S–M |
| UI-13 | P2 | Mecze | Dodać prostą akcję dojazdu na mecz | S + dane |
| UI-14 | P2 | Tabela | Pokazać sezon, dywizję i świeżość danych | S–M |
| UI-15 | P2 | Tabela | Wyjaśnić skróty i ujednolicić serię | S |
| UI-16 | P2 | Skład | Uporządkować kompletność składu | M + dane |
| UI-17 | P2 | Zawodnik | Dać sezon i kontekst statystyk profilu | M |
| UI-18 | P2 | Zawodnik | Ograniczyć cięcia do danych ekspozycyjnych | S–M |
| UI-19 | P2 | Aktualności | Pokazać wszystkie kategorie na telefonie | S |
| UI-20 | P2 | Aktualności | Oznaczać historyczne zapowiedzi | M + treść |
| UI-21 | P2 | Artykuły | Dodać skróty do długiej relacji | M |
| UI-22 | P2 | Artykuły | Uprościć metadane i breadcrumb | S–M |
| UI-23 | P2 | Galerie | Powiększyć użyteczne zdjęcie w lightboxie | M |
| UI-24 | P2 | Galerie | Dopasować sizes do kolumny artykułu | S–M |
| UI-25 | P2 | Partnerzy | Dopracować optyczną wagę logotypów | S–M |
| UI-26 | P2 | Partnerzy | Dodać jasny krok do współpracy | S + treść/decyzja |
| UI-27 | P2 | Klub | Pokazać ludzi i fakty, ograniczyć ogólniki | M + treść |
| UI-28 | P2 | Klub | Dodać skróty do długiej strony klubu | S |
| UI-29 | P2 | Wsparcie | Na telefonie pokazać kopiowanie przed QR | S–M |
| UI-30 | P2 | Shell | Skrócić stopkę na telefonie | S–M |
| UI-31 | P2 | Shell | Poprawić wysokość i tło krótkich podstron | M |
| UI-32 | P2 | Shell | Domknąć menu i zachować sprawne zamykanie | S |
| UI-33 | P2 | System | Uprościć kaskadę CSS po migracji | M–L |
| UI-34 | P2 | Jakość | Uzupełnić pomiary i stany przed odbiorem | M–L |

### UI-01 · P1 · Jeden sposób otwierania szczegółów meczu

**Charakter:** Potwierdzone zachowanie. **Zakres:** S–M.

**Obserwacja:** Przycisk szczegółów w terminarzu otwiera panel boczny i pozostawia adres /mecze. Homepage prowadzi do osobnego adresu meczu. Ta sama intencja ma dwa różne zakończenia.

**Skutek:** Kibic nie może łatwo przekazać adresu aktualnie oglądanego meczu z panelu. Telefon otrzymuje dodatkową warstwę interfejsu.

**Proponowana zmiana:** Prowadzić z terminarza bezpośrednio do istniejącej strony /mecze/kalk-[id]. Cały wiersz może być linkiem; opcjonalny szybki podgląd musi mieć osobną, jednoznaczną nazwę.

**Kryterium odbioru:** Kliknięcie meczu z homepage, terminarza i wyników otwiera ten sam adres. Wstecz przywraca wybrany widok listy. Udostępnianie przekazuje konkretny mecz.

**Podstawa:** WWW s. 18–20; spójność ścieżek.

**Pliki:** [MatchesList.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/mecze/MatchesList.tsx>), [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/mecze/[slug]/page.tsx>).

**Dowód:** [03-mecz-panel-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/03-mecz-panel-desktop.png>).


### UI-02 · P1 · Usunąć instrukcję administracyjną z widoku kibica

**Charakter:** Potwierdzony błąd treści. **Zakres:** S.

**Obserwacja:** Panel zaplanowanego meczu wyświetla: „Brak szczegółowych statystyk dla tego meczu. Uruchom pełny sync KALK w panelu administracyjnym.” Ten sam komponent obsługuje stronę szczegółów.

**Skutek:** Przed meczem brak statystyk jest normalny. Obecna treść sugeruje awarię i wymaga od kibica działania w panelu administratora.

**Proponowana zmiana:** Rozdzielić komunikaty według statusu: zaplanowany — statystyki po meczu; zakończony bez danych — oczekiwanie na statystyki; błąd pobrania — ponów. Przyszły mecz powinien oferować kalendarz i informacje o miejscu.

**Kryterium odbioru:** Żaden publiczny stan nie zawiera nazw sync, Scrapling ani instrukcji admina. Każdy stan ma właściwy komunikat i sensowną dalszą akcję.

**Podstawa:** WWW s. 28 — stany danych.

**Pliki:** [MatchDrawerContent.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/mecze/MatchDrawerContent.tsx>).

**Dowód:** [03-mecz-panel-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/03-mecz-panel-desktop.png>).


### UI-03 · P1 · Jeden wynik i jedna hierarchia strony meczu

**Charakter:** Potwierdzona duplikacja. **Zakres:** M.

**Obserwacja:** Mecz BeKaPaKa–Kosz-All-In pokazuje duży wynik 86:20 w karcie, następnie ponownie 86:20 w starszym zielonym scoreboardzie. Dopiero dalej są kwarty i statystyki. Strona ma około 2912 px wysokości na desktopie.

**Skutek:** Powielenie osłabia hierarchię, wydłuża scroll i miesza nowy system z wcześniejszym komponentem.

**Proponowana zmiana:** Zostawić jedną kartę wyniku. Poniżej umieścić kwarty, najważniejsze dane drużyny i box score. Zaplanowany mecz powinien mieć inny układ dolnej części niż rozegrany.

**Kryterium odbioru:** Wynik końcowy występuje raz jako główny wynik. Kwarty są kolejną sekcją. Brak danych nie tworzy zera. Dla LIVE/BREAK, przełożenia i anulowania układ zachowuje właściwe akcje.

**Podstawa:** WWW s. 18 — sześć stanów i wynik.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/mecze/[slug]/page.tsx>), [MatchDrawerContent.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/mecze/MatchDrawerContent.tsx>), [MatchCard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/MatchCard.tsx>).

**Dowód:** [04-mecz-wynik-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/04-mecz-wynik-desktop.png>).


### UI-04 · P1 · Przebudować mobilny box score

**Charakter:** Potwierdzony problem czytelności. **Zakres:** M.

**Obserwacja:** Tabela zawodników ma około 428 px szerokości w obszarze 343 px. Nazwiska łamią się na kilka wierszy; numer bywa częścią nazwiska w jednej linii. Nie ma przełącznika podstawowych kolumn ani sticky zawodnika, które działają już w tabeli ligi.

**Skutek:** Przewinięcie kolumn pozbawia kontekstu zawodnika. Duże różnice wysokości wierszy utrudniają porównania.

**Proponowana zmiana:** Zastosować wspólny wzorzec tabel: stała kolumna zawodnika, osobny numer, podstawowo MIN/PTS/AST oraz dodatkowe dane przez „Więcej kolumn”. Jeśli REB istnieje w źródle, uwzględnić je; nie dopisywać brakujących danych.

**Kryterium odbioru:** Przy 375/390/430 px nazwiska są rozpoznawalne, liczby nie nakładają się, kontekst pozostaje po scrollu. Tabela ma caption, właściwe nagłówki i legendę skrótów. Brak statystyki pozostaje „—”.

**Podstawa:** WWW s. 20, 29 — czytelne dane i semantyka.

**Pliki:** [MatchDrawerContent.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/mecze/MatchDrawerContent.tsx>), [StandingsBoard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/StandingsBoard.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [37-statystyki-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/37-statystyki-mobile.png>).


### UI-05 · P1 · Plakat powinien być widoczny w całości

**Charakter:** Potwierdzone kadrowanie. **Zakres:** S–M.

**Obserwacja:** W zapowiedzi III Turnieju cover ma narzucony pionowy kadr. Prawa część napisu „Start 10:…” jest ucięta. Wyrównanie szerokości poprzedniego i następnego artykułu z coverem zostało już poprawione.

**Skutek:** Plakat zawiera informacje użytkowe; przycinanie tekstu może usuwać godzinę lub inne ważne dane.

**Proponowana zmiana:** Rozróżnić typ medium: fotografia może używać cover; plakat i dokument powinny używać contain z neutralną płytą/papierem oraz akcją powiększenia oryginału. Nie zmieniać treści historycznego plakatu.

**Kryterium odbioru:** Cały tekst plakatu pozostaje widoczny na telefonie i desktopie. Fotografie nadal zachowują przewidziany kadr. Czytelny oryginał otwiera się z klawiatury.

**Podstawa:** WWW s. 22, 31; priorytet czytelności informacji.

**Pliki:** [EditorialDetailTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialDetailTemplate.tsx>), [EditorialNewsTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialNewsTemplate.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [09-artykul-plakat-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/09-artykul-plakat-desktop.png>).


### UI-06 · P1 · Naprawić tokeny i kontrast etykiety artykułu

**Charakter:** Potwierdzony pomiar i kod. **Zakres:** S.

**Obserwacja:** Etykieta „Aktualności” ma w przeglądarce kolor #F7F6F2 na #EF1734, font 18 px / 400. Kontrast wynosi około 4,01:1. Zmienne --fs-tag, --lh-tag i --tr-tag są puste; shorthand font wypada i etykieta dziedziczy tekst body.

**Skutek:** Tekst tej wielkości i grubości potrzebuje 4,5:1. Brak tokenów zmienia także zamierzoną hierarchię wizualną.

**Proponowana zmiana:** Zastosować istniejącą rolę label albo kompletną rolę tag. Zmienić tło etykiety na czerwień akcji #D9142F z odpowiednim jasnym tekstem lub użyć czerwonej etykiety bez wypełnienia. Sprawdzić wszystkie użycia niezdefiniowanych tokenów.

**Kryterium odbioru:** Computed style zgadza się z zatwierdzoną rolą typograficzną, a para kolorów osiąga co najmniej 4,5:1 dla małego tekstu. Kontrola obejmuje również etykietę „Mecze”.

**Podstawa:** WWW s. 10, 12, 29; WCAG 1.4.3.

**Pliki:** [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>), [tokens.json](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/packages/digital-design/tokens.json>), [EditorialDetailTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialDetailTemplate.tsx>).

**Dowód:** [09-artykul-plakat-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/09-artykul-plakat-desktop.png>).


### UI-07 · P1 · Nie zostawiać niewidocznego linku w kolejności Tab

**Charakter:** Potwierdzony kod i geometria. **Zakres:** S.

**Obserwacja:** Link „Wróć do listy” w szablonie szczegółów jest zwykłym linkiem z klasą visually-hidden. Ma 1×1 px i clip rect(0,0,0,0); reguła nie odsłania go po uzyskaniu fokusu.

**Skutek:** Użytkownik klawiatury może trafić na aktywny element, którego nie widzi. To inna sytuacja niż poprawnie odsłaniany skip link.

**Proponowana zmiana:** Pokazywać link powrotu normalnie albo użyć wariantu visually-hidden-focusable. Jeśli breadcrumb już zapewnia powrót, usunąć nadmiarowy fokusowalny link.

**Kryterium odbioru:** Każdy przystanek Tab w szczegółach artykułu i meczu ma widoczny cel oraz obrys. Kolejność odpowiada ekranowi.

**Podstawa:** WWW s. 29 — widoczny fokus.

**Pliki:** [EditorialDetailTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialDetailTemplate.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [09-artykul-plakat-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/09-artykul-plakat-desktop.png>).


### UI-08 · P1 · Uzupełnić opisy zdjęć i autora

**Charakter:** Potwierdzony brak opisów użytkowych. **Zakres:** M + treść.

**Obserwacja:** 20 zdjęć relacji ma opisy w rodzaju tytuł artykułu + „Zdjęcie 1”. Galeria nie pokazuje autora ani indywidualnych podpisów. Lightbox bez podpisu wyświetla osamotnione „· 1/20”.

**Skutek:** Czytnik ekranu nie otrzymuje informacji o zdjęciu. Klub i fotograf nie mają czytelnego przypisania materiału. Brak podpisu wygląda jak niedokończony interfejs.

**Proponowana zmiana:** Przeprowadzić inwentaryzację istniejących mediów w CMS i uzupełniać alt/caption/author/consentStatus na podstawie wiedzy klubu. Nie zgadywać osób ani zgód. Oddzielić sam licznik od opcjonalnego podpisu.

**Kryterium odbioru:** Każda publikowana fotografia ludzi ma potwierdzony status i sensowny opis; dekoracyjna ma pusty alt. Podpis i autor są dostępne przy zdjęciu lub w lightboxie. Bez caption licznik ma formę „1 z 20”.

**Podstawa:** WWW s. 23, 31; brandbook główny s. 31–33.

**Pliki:** [ArticleImageCarousel.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/ArticleImageCarousel.tsx>), [media-review.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/data/media-review.ts>), [media-record](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/cms-app/src/api/media-record>).

**Dowód:** [29-lightbox-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/29-lightbox-mobile.png>).


### UI-09 · P1 · Zatwierdzić publiczny kontakt klubu

**Charakter:** Potwierdzony stan + decyzja klubu. **Zakres:** S + decyzja.

**Obserwacja:** Stopka i strona klubu nadal publikują kontakt@damianmotylinski.pl. Plan pozostawiał docelowy kontakt jako otwartą decyzję; nie można uznać osobistej domeny za zatwierdzony docelowy kontakt stowarzyszenia.

**Skutek:** Partner lub nowy zawodnik może nie rozpoznać oficjalnego kanału. Jednocześnie usunięcie jedynego działającego kontaktu bez zastępstwa byłoby regresją.

**Proponowana zmiana:** Potwierdzić istniejący adres albo skonfigurować zatwierdzony adres klubowy. Używać tej samej konfiguracji na klubie, w stopce, partnerach i pustych stanach. Dodać zatwierdzoną politykę prywatności, kiedy jest gotowa.

**Kryterium odbioru:** Wszystkie miejsca pokazują ten sam zatwierdzony kontakt. Nie ma przykładowych maili ani fikcyjnych danych formalnych. KRS FSMM pozostaje opisany jako KRS fundacji.

**Podstawa:** WWW s. 26; otwarte decyzje planu.

**Pliki:** [site-settings.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/site-settings.ts>), [SiteFooter.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/layout/SiteFooter.tsx>), [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/klub/page.tsx>).

**Dowód:** [12-klub-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/12-klub-desktop.png>).


### UI-10 · P1 · Dać dalszą akcję w pustych dokumentach

**Charakter:** Potwierdzony pusty stan. **Zakres:** S + treść.

**Obserwacja:** Dokumenty są promowane w stopce i na stronie klubu, ale lista zawiera jedynie „Brak dokumentów”. Na desktopie po papierowej części zostaje około 460 px pustej czerni przed stopką.

**Skutek:** Użytkownik szukający regulaminu lub formularza trafia w ślepą uliczkę; pustka wygląda jak brakujący blok.

**Proponowana zmiana:** Dodać „Wróć do klubu” i możliwość zapytania przez zatwierdzony kontakt. Opublikować rzeczywiste, zatwierdzone dokumenty; do tego czasu uczciwie wyjaśnić dostępność. Naprawić tło i wysokość krótkiej strony.

**Kryterium odbioru:** Pusty stan ma działającą akcję. Papier obejmuje całą właściwą sekcję, bez przypadkowego czarnego pasa. Pliki mają nazwę, typ i rozmiar, gdy zostaną dostarczone.

**Podstawa:** WWW s. 28 — empty state z dalszym krokiem.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/dokumenty/page.tsx>), [EmptyState.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/EmptyState.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [13-dokumenty-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/13-dokumenty-desktop.png>).


### UI-11 · P2 · Skrócić drugą połowę strony głównej

**Charakter:** Rekomendacja hierarchii. **Zakres:** M.

**Obserwacja:** Homepage ma około 5014 px na desktopie i 8997 px przy mobilnym viewporcie. Po aktualnościach występują dane sezonu, czterech zawodników, stroje, pełna lista partnerów i kolejne bloki klubu/wsparcia.

**Skutek:** Dobry pierwszy ekran nie przekłada się na równie wyraźną hierarchię dalszej strony. Stroje i powtarzane zaproszenia odciągają od aktualnych informacji sportowych.

**Proponowana zmiana:** Zachować kolejność głównych stref. Przenieść pełną prezentację strojów na Skład lub Klub, na homepage zostawić krótkie odwołanie. Po siatce partnerów zostawić jedno zaproszenie do współpracy. Skrócić tekst stopki na telefonie.

**Kryterium odbioru:** Najbliższy mecz, ostatni wynik, news i sezon pozostają łatwo dostępne. Docelowo skrócić wysokość homepage o 20–30% względem baseline bez ukrywania informacji podstawowych; to cel projektu, nie osiągnięty wynik.

**Podstawa:** WWW s. 19, 25–26; priorytety pierwotnego planu.

**Pliki:** [MegaHomeTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/MegaHomeTemplate.tsx>), [JerseyShowcase.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/home/JerseyShowcase.tsx>), [SiteFooter.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/layout/SiteFooter.tsx>).

**Dowód:** [01-home-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/01-home-desktop.png>).


### UI-12 · P2 · Ujednolicić znaki rywala i nazwy kolejki

**Charakter:** Potwierdzona niespójność. **Zakres:** S–M.

**Obserwacja:** Hero potrafi pokazać rzeczywiste niebieskie logo rywala, a szczegóły innego meczu neutralną tarczę z fragmentem nazwy. Metadane wyświetlają również „Kolejka - 3”, co wizualnie przypomina liczbę ujemną.

**Skutek:** Ten sam system meczu nie ma jednej konsekwentnej prezentacji rywali i rozgrywek.

**Proponowana zmiana:** Wydzielić wspólny znak rywala i ustalić wariant: referencyjna neutralna tarcza albo zaakceptowane logo źródłowe. Normalizować etykietę rundy do „3. kolejka” dopiero po potwierdzeniu danych; nie przestawiać samego terminarza.

**Kryterium odbioru:** Hero, terminarz i szczegóły używają tego samego schematu. Długie nazwy nie kolidują ze znakami. Oznaczenie kolejki nie wygląda jak ujemny numer.

**Podstawa:** WWW s. 18–19 — para znaków i metadane.

**Pliki:** [MatchCard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/MatchCard.tsx>), [map-game.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/data/map-game.ts>).

**Dowód:** [16a-home-mobile-first-screen.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/16a-home-mobile-first-screen.png>).


### UI-13 · P2 · Dodać prostą akcję dojazdu na mecz

**Charakter:** Możliwość usprawnienia. **Zakres:** S + dane.

**Obserwacja:** Karta przyszłego meczu ma miejsce, godzinę i kalendarz. Nazwa KOSiR jest tekstem; brakuje bezpośredniego kroku dla kibica, który chce dotrzeć na halę.

**Skutek:** Nowy kibic musi sam wyszukać właściwy obiekt. Na telefonie to ważniejsza funkcja niż kolejny dekoracyjny blok.

**Proponowana zmiana:** Dodać wtórny link „Dojazd” do map po zatwierdzeniu dokładnego obiektu/adresu. Nie dokładać ciężkiego embedu mapy. Przy braku miejsca pokazać uczciwy stan oczekiwania.

**Kryterium odbioru:** Kliknięcie otwiera właściwą halę. Główny CTA i kalendarz pozostają wyraźne. Przełożony lub odwołany mecz nie promuje nieaktualnego terminu.

**Podstawa:** WWW s. 18–19 — praktyczne informacje meczu.

**Pliki:** [MatchCard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/MatchCard.tsx>), [NearestEventCalendarActions.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/home/NearestEventCalendarActions.tsx>).

**Dowód:** [16a-home-mobile-first-screen.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/16a-home-mobile-first-screen.png>).


### UI-14 · P2 · Pokazać sezon, dywizję i świeżość danych

**Charakter:** Potwierdzona luka kontekstu. **Zakres:** S–M.

**Obserwacja:** Widoczny nagłówek to „Tabela ligi” oraz „KALK · KOSiR Koszalin”. Dywizja występuje w opisie tabeli, ale nie jest równie czytelna w głównym nagłówku. Brakuje widocznej informacji, z kiedy są dane.

**Skutek:** W sezonach przejściowych łatwo pomylić rozgrywki lub uznać nieaktualną tabelę za bieżącą.

**Proponowana zmiana:** Dodać sezon i dywizję z danych źródłowych oraz czas rzeczywistej aktualizacji. Oddzielić ostatni sync od czasu wygenerowania strony. Dla cache/offline wyjaśnić stan.

**Kryterium odbioru:** Sezon/dywizja są widoczne przy nagłówku. Znacznik aktualizacji nie jest wymyślaną datą. Cache ma czytelną etykietę, a brak informacji nie udaje świeżego odczytu.

**Podstawa:** WWW s. 20, 28 — dane i aktualizacja.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/tabela/page.tsx>), [StandingsBoard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/StandingsBoard.tsx>), [DataStateNotice.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/DataStateNotice.tsx>).

**Dowód:** [18-tabela-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/18-tabela-mobile.png>).


### UI-15 · P2 · Wyjaśnić skróty i ujednolicić serię

**Charakter:** Potwierdzony język + rekomendacja. **Zakres:** S.

**Obserwacja:** Tabela pokazuje M/W/P/Pkt i dane rozszerzone, w tym serię W1/L1. Litera L miesza angielski zapis porażki z polskim P w innych kolumnach.

**Skutek:** Nowy użytkownik może nie odczytać +/−, formy i serii. Rodzice lub kibice okazjonalni nie muszą znać wszystkich skrótów.

**Proponowana zmiana:** Dodać krótką legendę. Ujednolicić polskie W/P w formie i serii, z pełnym opisem dla czytnika. Zachować logo + rozpoznawalny skrót na telefonie i pełną nazwę w dostępnej nazwie.

**Kryterium odbioru:** Legenda wyjaśnia każdą kolumnę rozszerzoną. Seria ma jeden język. Przy poziomym scrollu krótka kolumna drużyny nadal nie zasłania danych.

**Podstawa:** WWW s. 20 — informacja poza samym kolorem.

**Pliki:** [StandingsBoard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/StandingsBoard.tsx>), [backend.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/data/backend.ts>).

**Dowód:** [19a-tabela-scrolled-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/19a-tabela-scrolled-mobile.png>).


### UI-16 · P2 · Uporządkować kompletność składu

**Charakter:** Potwierdzony stan danych. **Zakres:** M + dane.

**Obserwacja:** Lista zawiera 20 osób: 11 dostępnych portretów i 9 kart zastępczych. Część profili ma nieznany numer/pozycję. W box score istnieją numery zawodników, które nie są uzupełnione w odpowiednich kartach składu.

**Skutek:** Powtarzające się placeholdery i „—” osłabiają jakość bardzo dobrych gotowych portretów. Bez sezonu nie wiadomo, czy oglądamy aktualny skład czy szerszą bazę zawodników.

**Proponowana zmiana:** Zatwierdzić aktywny skład dla sezonu, powiązać tożsamości po ID i uzupełnić numery/pozycje tylko na podstawie potwierdzonych danych. Pokazać sezon; archiwum oddzielić, jeśli jest potrzebne. Zachować gotowe portrety i zamówiony wygląd strojów.

**Kryterium odbioru:** Wszystkie aktywne osoby mają zgodne dane w kartach, profilu i meczach. Nie usuwamy zawodników wyłącznie z powodu braku zdjęcia. Placeholder pozostaje numerem + monogramem marki, bez fikcyjnego portretu.

**Podstawa:** WWW s. 24; brandbook główny s. 31 — wspólna sesja.

**Pliki:** [RosterList.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/sklad/RosterList.tsx>), [PlayerCard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/PlayerCard.tsx>), [player-identity.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/data/player-identity.ts>), [local-player-portraits.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/data/local-player-portraits.ts>).

**Dowód:** [06-sklad-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/06-sklad-desktop.png>).


### UI-17 · P2 · Dać sezon i kontekst statystyk profilu

**Charakter:** Rekomendacja interpretacji danych. **Zakres:** M.

**Obserwacja:** Profil prezentuje duże średnie w hero i ponownie podobne wartości w części statystyk. Procenty FG/FT/3P nie pokazują obok liczby trafień i prób; samo 0% nie wyjaśnia, czy zawodnik rzucał.

**Skutek:** Jednomeczowa próbka może wyglądać jak stabilna średnia sezonowa. Brak mianownika utrudnia interpretację procentów.

**Proponowana zmiana:** Pokazać sezon i liczbę meczów przy średnich. W hero zostawić trzy najważniejsze dane, niżej pełne statystyki. Dodać trafienia/próby, jeśli źródło je udostępnia; zero prób oznaczać „—”, realne nietrafione próby mogą dawać 0%.

**Kryterium odbioru:** Każdy procent ma kontekst źródłowy. Brak danych nie udaje zera. EVAL/eFG/TS mają objaśnienie. Historia rozróżnia sezon i mecz; bezpośredni adres zawodnika pozostaje.

**Podstawa:** WWW s. 24 — profil i brak danych.

**Pliki:** [PlayerProfile.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/PlayerProfile.tsx>), [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/sklad/[id]/page.tsx>).

**Dowód:** [07-zawodnik-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/07-zawodnik-desktop.png>).


### UI-18 · P2 · Ograniczyć cięcia do danych ekspozycyjnych

**Charakter:** Rekomendacja zgodności marki. **Zakres:** S–M.

**Obserwacja:** Cięcia są stosowane w dużych liczbach profilu, także w pasku średnich statystyk. Brandbook dopuszcza charakterystyczne cięcie dla numeru, czasu i wyniku, a krytyczne tabele/dane każe zostawić czytelne.

**Skutek:** Przenoszenie efektu na kolejne liczby może osłabić czytelność i przestaje być wyróżnikiem.

**Proponowana zmiana:** Zostawić cięcie na numerze zawodnika, ekspozycyjnym wyniku i czasie hero. Dla średnich, procentów, tabel i dat używać zwykłych cyfr tablicowych. Zweryfikować linię przecięcia na rzeczywistym cap-height, nie na środku boxa.

**Kryterium odbioru:** Efekt pojawia się wyłącznie w uzgodnionych rolach. Safari/Firefox otrzymują czytelny fallback. Zero, dwukropek i cyfry z łukami nie tracą rozpoznawalności.

**Podstawa:** WWW s. 11 — zakres i położenie cięcia.

**Pliki:** [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>), [PlayerProfile.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/PlayerProfile.tsx>), [tokens.json](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/packages/digital-design/tokens.json>).

**Dowód:** [07-zawodnik-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/07-zawodnik-desktop.png>).


### UI-19 · P2 · Pokazać wszystkie kategorie na telefonie

**Charakter:** Potwierdzona widoczność. **Zakres:** S.

**Obserwacja:** Przy 390 px widać Wszystkie/Turniej/Drużyna, a Klub jest poza pierwszym widokiem poziomego paska. Widoczny natywny scrollbar nie mówi jasno, że istnieje czwarta kategoria. Link Drużyna poprawnie zmienia URL i zawartość.

**Skutek:** Użytkownik może nie odkryć części treści, mimo że filtrowanie jest poprawnie zaimplementowane.

**Proponowana zmiana:** Dla obecnych czterech kategorii rozważyć układ 2×2 lub dopasowane zakładki z minimalnym celem dotykowym. Dla większej liczby zostawić poziomy scroll z widocznym fragmentem kolejnej pozycji i oznaczeniem aktywnej kategorii.

**Kryterium odbioru:** Każda kategoria jest od razu widoczna albo jej istnienie jest jednoznacznie sygnalizowane. URL i obsługa bez JS pozostają. Zmiana kategorii resetuje numer strony.

**Podstawa:** WWW s. 21 — filtry i URL.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/aktualnosci/page.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [35-aktualnosci-mobile-first-screen.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/35-aktualnosci-mobile-first-screen.png>).


### UI-20 · P2 · Oznaczać historyczne zapowiedzi

**Charakter:** Rekomendacja aktualności treści. **Zakres:** M + treść.

**Obserwacja:** Kategoria Drużyna pokazuje jako wyróżniony artykuł zaproszenie na trening 17 czerwca. Data publikacji jest widoczna, ale karta nadal brzmi jak bieżący nabór.

**Skutek:** Osoba chcąca dołączyć może kierować się nieaktualnym terminem. Nie oznacza to, że historyczny artykuł należy usuwać.

**Proponowana zmiana:** Dla treści z terminem dodać „Wydarzenie zakończone” lub „Archiwalna zapowiedź” po potwierdzeniu pola wydarzenia. Zachować oryginalną treść i URL; bieżący nabór promować osobnym, aktualnym komunikatem dopiero gdy klub go zatwierdzi.

**Kryterium odbioru:** Status terminu jest czytelny, a nieaktualne zapowiedzi nie udają aktywnych akcji. Nie automatyzować interpretacji terminów przez zgadywanie dat z tekstu.

**Podstawa:** WWW s. 21, 28 — aktualność i uczciwe stany.

**Pliki:** [NewsCard.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/NewsCard.tsx>), [FeaturedStory.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/FeaturedStory.tsx>), [cms.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/data/cms.ts>).

**Dowód:** [36-filtr-druzyna-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/36-filtr-druzyna-mobile.png>).


### UI-21 · P2 · Dodać skróty do długiej relacji

**Charakter:** Potwierdzona długość + rekomendacja. **Zakres:** M.

**Obserwacja:** Relacja turnieju ma na desktopie około 11,3 tys. px wysokości, wiele nagłówków i galerię 20 zdjęć w środku. Po karcie poprzedniego artykułu prawa kolumna przez większość czytania pozostaje niewykorzystana.

**Skutek:** Trudno szybko dotrzeć do klasyfikacji, galerii lub wyników własnej drużyny. Tekst jest czytelny, lecz słabo skanowalny.

**Proponowana zmiana:** Pod leadem pokazać krótkie podsumowanie i linki „Wyniki / Klasyfikacja / Galeria (20)”. Na desktopie użyć bocznego spisu treści; na telefonie krótkiej listy kotwic. Klasyfikację można podsumować wcześnie, zachowując pełną relację.

**Kryterium odbioru:** Do galerii i klasyfikacji można dotrzeć jednym kliknięciem. Kotwice nie chowają nagłówka pod sticky headerem. URL z hashem i powrót działają bez JS.

**Podstawa:** WWW s. 22–23 — editorial i galeria.

**Pliki:** [EditorialDetailTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialDetailTemplate.tsx>), [ArticleMarkdown.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/ArticleMarkdown.tsx>), [ArticleRelations.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/ArticleRelations.tsx>).

**Dowód:** [34-gallery-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/34-gallery-desktop.png>).


### UI-22 · P2 · Uprościć metadane i breadcrumb

**Charakter:** Rekomendacja hierarchii. **Zakres:** S–M.

**Obserwacja:** Nad artykułem jest pełny tytuł w breadcrumb, duży powtórzony tytuł, etykieta Aktualności, data, czas czytania, licznik wyświetleń, autor i udostępnianie. Linki breadcrumb mają około 19 px wysokości.

**Skutek:** Na telefonie długa ścieżka zabiera miejsce. Licznik odsłon nie pomaga zaplanować wizyty ani zrozumieć relacji; lokalne odsłony nie są miarą popularności produkcji.

**Proponowana zmiana:** Skrócić widoczną ścieżkę na telefonie i powiększyć cel linku. Pokazywać rzeczywistą kategorię artykułu, datę, autora i czas czytania. Rozważyć usunięcie odsłon z publicznej prezentacji przy zachowaniu mechanizmu statystyk.

**Kryterium odbioru:** Tytuł nie jest powtarzany w dwóch długich blokach na telefonie. Linki nawigacyjne spełniają klubowy standard 44 px. Autor i udostępnianie pozostają dostępne.

**Podstawa:** WWW s. 9, 22, 29; brief — cele 44×44.

**Pliki:** [EditorialDetailTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialDetailTemplate.tsx>), [EditorialNewsTemplate.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/EditorialNewsTemplate.tsx>).

**Dowód:** [24-artykul-plakat-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/24-artykul-plakat-mobile.png>).


### UI-23 · P2 · Powiększyć użyteczne zdjęcie w lightboxie

**Charakter:** Potwierdzony układ + rekomendacja. **Zakres:** M.

**Obserwacja:** Na telefonie strzałki zajmują boczne kolumny, przez co poziome zdjęcie ma tylko około 246 px szerokości przy viewporcie 390 px. Wokół pozostaje duża pusta przestrzeń. Zamknięcie jest tekstowym ×.

**Skutek:** W podglądzie fotografia jest niewiele większa niż miniatura; mały glif zamknięcia wygląda mniej pewnie niż ikony reszty serwisu.

**Proponowana zmiana:** Przenieść sterowanie poniżej zdjęcia lub na jego krawędź z bezpiecznym kontrastem. Zastosować wspólne SVG dla zamknięcia i strzałek. Dodać czytelny stan ładowania/błędu oryginału oraz informację o autorze.

**Kryterium odbioru:** Fotografia wykorzystuje szerokość po odjęciu marginesów 16 px. Swipe, strzałki, Escape, licznik i powrót fokusu nadal działają. Przy wolnym obrazie widać stan zamiast pustej przestrzeni.

**Podstawa:** WWW s. 23, 28–29.

**Pliki:** [ArticleImageCarousel.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/ArticleImageCarousel.tsx>), [PublicIcons.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/PublicIcons.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [29-lightbox-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/29-lightbox-mobile.png>).


### UI-24 · P2 · Dopasować sizes do kolumny artykułu

**Charakter:** Potwierdzony kod i pomiar; bez pomiaru transferu. **Zakres:** S–M.

**Obserwacja:** Galeria używa desktopowego sizes=33vw. Przy 1440 px zwykła miniatura ma około 223 px, a przeglądarka wybiera obraz o szerokości 475 px; wyróżniona fotografia ma około 457 px. Wszystkie dostają tę samą deklarację.

**Skutek:** Zwykłe miniatury mogą pobierać większy wariant niż potrzebny dla ich kontenera. Wielkość zależy również od DPR; nie jest to jeszcze pomiar oszczędności bajtów.

**Proponowana zmiana:** Rozróżnić sizes zdjęcia wyróżnionego i zwykłego, z uwzględnieniem maksymalnej szerokości kolumny tekstu. Zachować oryginał w lightboxie oraz poprawne wymiary i lazy loading.

**Kryterium odbioru:** Wybrany currentSrc odpowiada rzeczywistemu rozmiarowi i DPR dla 390/768/1440 px. Porównanie HAR pokaże transfer przed/po. LCP nie jest opóźniany lazy loadingiem.

**Podstawa:** WWW s. 31–32 — obrazy responsive.

**Pliki:** [ArticleImageCarousel.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/ArticleImageCarousel.tsx>), [FallbackImage.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/FallbackImage.tsx>).

**Dowód:** [34-gallery-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/34-gallery-desktop.png>).


### UI-25 · P2 · Dopracować optyczną wagę logotypów

**Charakter:** Rekomendacja wizualna. **Zakres:** S–M.

**Obserwacja:** 15 partnerów, w tym ShipApp, jest obecnych. Różne proporcje i pole własne sprawiają, że niektóre cienkie logotypy wyglądają dużo mniejsze niż nazwy zastępcze. Ostatni rząd jest niepełny; desktopowy nagłówek tej strony jest wyśrodkowany.

**Skutek:** Równe kafle nie dają równej optycznej obecności. Jeden bardzo ciężki fallback dominuje nad prawdziwymi znakami.

**Proponowana zmiana:** Ustalić optyczne pole dla każdego znaku, zmieniając padding/max-height bez rozciągania i przemalowywania logo. Rozważyć 5 kolumn przy 15 partnerach i wyrównanie nagłówka do lewej. Zachować jedną listę bez niezatwierdzonych poziomów.

**Kryterium odbioru:** Każdy znak jest czytelny przy 390/768/1440 px, bez naruszenia proporcji i pola ochronnego. ShipApp pozostaje na stronie i homepage. Różna szerokość nie sugeruje niezatwierdzonych poziomów.

**Podstawa:** WWW s. 7, 25 — wyrównanie i optyczna wielkość.

**Pliki:** [PartnersGrid.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/sponsors/PartnersGrid.tsx>), [SponsorLogoFrame.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/sponsors/SponsorLogoFrame.tsx>), [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/sponsorzy/page.tsx>).

**Dowód:** [11-partnerzy-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/11-partnerzy-desktop.png>).


### UI-26 · P2 · Dodać jasny krok do współpracy

**Charakter:** Możliwość usprawnienia. **Zakres:** S + treść/decyzja.

**Obserwacja:** Strona partnerów ma podziękowanie i siatkę. Po przejrzeniu firm brakuje konkretnego następnego kroku dla zainteresowanego partnera.

**Skutek:** Lista buduje wiarygodność, ale nie zamienia zainteresowania w kontakt.

**Proponowana zmiana:** Dodać krótki blok „Współpraca z BeKaPaKa” z zatwierdzonym kontaktem i konkretną propozycją rozmowy. Formularz, korzyści pakietów i partner główny pozostają decyzją klubu; nie publikować przykładowych ofert.

**Kryterium odbioru:** Jeden wyraźny kontakt jest dostępny po siatce i z klawiatury. Nie ma fikcyjnych pakietów, kwot ani gwarancji.

**Podstawa:** WWW s. 25, 30; otwarte decyzje planu.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/sponsorzy/page.tsx>), [site-settings.ts](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/lib/site-settings.ts>).

**Dowód:** [27-partnerzy-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/27-partnerzy-mobile.png>).


### UI-27 · P2 · Pokazać ludzi i fakty, ograniczyć ogólniki

**Charakter:** Rekomendacja treści i kompozycji. **Zakres:** M + treść.

**Obserwacja:** Strona klubu ma już hero z herbem, wordmarkiem i deseniem, sekcje aktywności, wartości, wsparcie i kontakt. To znacząca poprawa. Wciąż składa się głównie z tekstowych bloków o podobnym przekazie; wysokość to około 4405 px desktop / 7151 px mobile.

**Skutek:** Marka jest widoczna, lecz nie widać życia klubu tak dobrze jak w relacjach turniejowych. Powtarzanie wartości zmniejsza konkretność.

**Proponowana zmiana:** Dodać jedno prawdziwe, zatwierdzone zdjęcie drużyny lub wydarzenia; dwie konkretne karty z linkami do istniejących relacji; krótką historię na potwierdzonych datach. Przyciąć powtarzające się wartości. Zostawić herb i dyskretny deseń.

**Kryterium odbioru:** Po pierwszym ekranie użytkownik rozumie kto gra, gdzie działa klub i co organizuje. Każdy fakt ma źródło; nie dopisujemy roku założenia, zarządu ani godzin treningów z makiety.

**Podstawa:** WWW s. 13, 26; brandbook główny s. 28–32.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/klub/page.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [12-klub-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/12-klub-desktop.png>).


### UI-28 · P2 · Dodać skróty do długiej strony klubu

**Charakter:** Rekomendacja nawigacji. **Zakres:** S.

**Obserwacja:** Sekcje działalność, wartości, wsparcie i kontakt są odległe na telefonie. Do wsparcia prowadzi link ze stopki, ale wejście na /klub nie oferuje równie wyraźnej nawigacji po sekcjach.

**Skutek:** Kto chce tylko kontakt lub dane do wsparcia, musi przejść długą prezentację marki.

**Proponowana zmiana:** Dodać pod leadem krótką nawigację „Drużyna / Działalność / Wsparcie / Kontakt”. Skierować do składu i istniejących kotwic. Nie rozbudowywać jej do drugiego stale przyklejonego headera.

**Kryterium odbioru:** Kontakt i wsparcie są dostępne jednym kliknięciem. Nagłówki po skoku nie są zasłonięte. Kotwice działają bez JavaScript.

**Podstawa:** WWW s. 9, 26 — nawigacja i odstępy.

**Pliki:** [page.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/klub/page.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [25-klub-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/25-klub-mobile.png>).


### UI-29 · P2 · Na telefonie pokazać kopiowanie przed QR

**Charakter:** Potwierdzony układ. **Zakres:** S–M.

**Obserwacja:** Modal wsparcia na telefonie ma kilkuliniowy nagłówek i duży kod QR. Akcje kopiowania znajdują się niżej, poza pierwszym ekranem. Na tym samym telefonie skanowanie własnego ekranu nie jest najprostszą ścieżką.

**Skutek:** Najbardziej użyteczna akcja wymaga dodatkowego przewinięcia, mimo że wszystkie dane już są dostępne.

**Proponowana zmiana:** Ustawić krótki nagłówek, numer rachunku i „Kopiuj” przed kodem. QR pozostawić jako alternatywę. Ujednolicić akcje homepage/klub/modal oraz feedback z aria-live.

**Kryterium odbioru:** Kopiowanie najważniejszych danych jest dostępne bez scrolla przy 390×844. Sukces/błąd ma komunikat dla czytnika. Escape i powrót fokusu pozostają. Dane rachunku i FSMM nie ulegają zmianie.

**Podstawa:** WWW s. 26, 28–29 — proste akcje.

**Pliki:** [DonationQrModal.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/support/DonationQrModal.tsx>), [DonationSupportPanel.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/support/DonationSupportPanel.tsx>), [FsmmSupportSection.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/support/FsmmSupportSection.tsx>).

**Dowód:** [26-qr-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/26-qr-mobile.png>).


### UI-30 · P2 · Skrócić stopkę na telefonie

**Charakter:** Rekomendacja gęstości. **Zakres:** S–M.

**Obserwacja:** Mobilna stopka kolejno pokazuje duży znak, wielowierszowy opis, sześć linków klubu, kontakt, wsparcie i dolny pasek. Na krótkich stronach staje się dużą częścią całego dokumentu.

**Skutek:** Koniec strony przypomina kolejną pełną podstronę, a kontakt i wsparcie są daleko od początku stopki.

**Proponowana zmiana:** Skrócić opis do jednego zdania; ułożyć linki w dwie kolumny i kontakt bliżej góry. Zachować nazwę formalną, FSMM, panel i ShipApp. Nie ukrywać istotnego kontaktu w rozwijanym akordeonie.

**Kryterium odbioru:** Stopka przy 375/390/430 px ma wyraźne grupy i cele 44 px, bez drobniejszej czcionki. Wszystkie obecne funkcje są zachowane.

**Podstawa:** WWW s. 26 — kolejność mobilnej stopki.

**Pliki:** [SiteFooter.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/layout/SiteFooter.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [17-mecze-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/17-mecze-mobile.png>).


### UI-31 · P2 · Poprawić wysokość i tło krótkich podstron

**Charakter:** Potwierdzona geometria. **Zakres:** M.

**Obserwacja:** main ma min-height:calc(100svh - 60px). Stopka dochodzi jeszcze po tej wysokości. Na /dokumenty papier kończy się znacznie wcześniej niż main, tworząc duży czarny pas; krótkie mecze/tabela również mają dużo pustki.

**Skutek:** Różnice tła wyglądają jak niedokończony layout, a proporcje krótkiej strony odbiegają od dłuższych.

**Proponowana zmiana:** Zbudować shell z elastycznym main i pełnym tłem danej strony. Odstępy sekcji powinny wynikać z roli, nie z narzuconej wysokości ekranu. Nie ściskać tabel ani tekstu dla samego skrócenia.

**Kryterium odbioru:** Krótkie strony nie mają przypadkowej czarnej dziury. Przy małej ilości treści stopka domyka viewport; przy dużej nic nie jest ucinane. Sprawdzić 768/1024 px i zoom 200%.

**Podstawa:** WWW s. 7, 9, 13 — pełne tła i rytm.

**Pliki:** [PublicShell.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/layout/PublicShell.tsx>), [PageScaffold.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/templates/PageScaffold.tsx>), [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>).

**Dowód:** [13-dokumenty-desktop.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/13-dokumenty-desktop.png>).


### UI-32 · P2 · Domknąć menu i zachować sprawne zamykanie

**Charakter:** Potwierdzone działanie + drobna rekomendacja. **Zakres:** S.

**Obserwacja:** Menu mobilne ma czytelne linki i panel. Escape zamyka je po animacji, a fokus wraca do hamburgera. Brandbook przewiduje również nazwę stowarzyszenia w dolnej części; aktualnie jej tam nie ma.

**Skutek:** Mechanika jest dobra i wymaga ochrony przed regresją. Krótki podpis może domknąć pustą dolną część, lecz nie powinien wypchnąć linków poza ekran.

**Proponowana zmiana:** Dodać dyskretną nazwę klubu, jeśli mieści się przy małej wysokości. Ujednolicić ikonę zamknięcia między menu, QR i lightboxem. Zachować plain link do panelu i istniejący focus trap.

**Kryterium odbioru:** Na krótkim ekranie wszystkie linki są osiągalne. Tab/Shift+Tab pozostają w menu, Escape przywraca fokus, scroll strony jest odblokowany po zamknięciu. Nie mylić czasu animacji z awarią.

**Podstawa:** WWW s. 15, 29.

**Pliki:** [MobileFullScreenMenu.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/layout/MobileFullScreenMenu.tsx>), [PublicShell.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/layout/PublicShell.tsx>), [PublicIcons.tsx](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/components/public/shared/PublicIcons.tsx>).

**Dowód:** [28-menu-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/28-menu-mobile.png>).


### UI-33 · P2 · Uprościć kaskadę CSS po migracji

**Charakter:** Potwierdzony kod; ryzyko utrzymania. **Zakres:** M–L.

**Obserwacja:** Legacy pliki zostały usunięte, ale digital.css zawiera około 101 KB źródła i wielokrotne reguły tych samych komponentów: warstwę referencyjną i późniejsze dostosowania. Sama liczba linii nie dowodzi wolnego renderowania, lecz brakujące tokeny pokazują realne skutki.

**Skutek:** Kolejna lokalna poprawka może zmienić inne podstrony albo przywrócić wcześniejsze odstępy. Projekt traci jedną definicję komponentu.

**Proponowana zmiana:** Porządkować komponent po komponencie: jedna docelowa reguła, jawne warianty, usuwanie zastąpionych definicji. Zachować wersjonowane źródło brandbooka i generator. Nie dodawać kolejnej globalnej warstwy nadpisującej.

**Kryterium odbioru:** Właściwe komponenty nie mają konkurujących historycznych definicji. Wizualne porównanie 390/768/1024/1440 px pozostaje stabilne; wygląd panelu bez zmian.

**Podstawa:** WWW s. 34–35; plan — usuwanie legacy.

**Pliki:** [digital.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/app/styles/digital.css>), [reference.source.css](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/packages/digital-design/reference.source.css>), [build_tokens.py](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/packages/digital-design/build_tokens.py>).

**Dowód:** [33-home-1024.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/33-home-1024.png>).


### UI-34 · P2 · Uzupełnić pomiary i stany przed odbiorem

**Charakter:** Brak pełnej weryfikacji; nie zgłoszenie awarii. **Zakres:** M–L.

**Obserwacja:** Ten audyt obejmuje bieżący lokalny UI i wybrane interakcje. Nie wykonano Lighthouse, axe, VoiceOver/TalkBack, testów offline ani testu wszystkich sześciu statusów na rzeczywistych danych. Dawny baseline 64 testów nie jest wynikiem tego audytu.

**Skutek:** Wizualnie dobry ekran nie potwierdza wydajności, dostępności całego serwisu ani stabilności podczas błędu API.

**Proponowana zmiana:** Przed odbiorem przeprowadzić macierz stanów i szerokości, pomiary mobile/desktop oraz testy regresji. Oddzielnie zmierzyć interakcje/INP; nie wyprowadzać INP z samego wyniku Lighthouse.

**Kryterium odbioru:** Raport odbioru zawiera rzeczywiste wyniki testów, typecheck/lint/build, Lighthouse, a11y oraz transferów. Każdy niezmierzony cel jest jawnie oznaczony, a nie deklarowany jako spełniony.

**Podstawa:** WWW s. 29, 32, 35; plan QA.

**Pliki:** [tests](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/tests>), [qa](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa>), [preview-local.mjs](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/site/scripts/preview-local.mjs>).

**Dowód:** [19a-tabela-scrolled-mobile.png](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/19a-tabela-scrolled-mobile.png>).


## Zgodność z brandbookiem i decyzje

- Kontakt klubu, formularz współpracy, poziomy partnerów, partner główny i procedura usuwania zdjęć pozostają decyzjami/konfiguracją z TODO. Nie publikować wartości z makiety.
- WWW s. 22 podaje cover 4:5 desktop i 3:2 mobile, a checklista s. 31 wspomina 16:9. To rozbieżność dokumentu. Przyjąć komponentowy opis i referencję HTML; plakat ma dodatkowo wymóg pełnej czytelności, dlatego contain powinien mieć pierwszeństwo przed automatycznym cropem.
- Brandbook dopuszcza drobne role label/meta, ale brief wymaga pomocniczego tekstu minimum 16 px. Używać 13 px tylko dla krótkich etykiet; opisy, wyjaśnienia i stany danych minimum 16 px. Bieżące metadane artykułu zmierzone na telefonie mają 16 px, nie należy ich bez powodu zmniejszać.
- Standard marki to cele 44×44 px. WCAG 2.2 AA 2.5.8 określa 24×24 px z wyjątkami dotyczącymi m.in. odstępów i tekstu inline. Każdy link niższy niż 44 px nie jest automatycznie naruszeniem WCAG, lecz może odbiegać od klubowego standardu wygody.
- Błędy i rekomendacje nie oznaczają zgody na usuwanie danych. Zachować URL, CMS, ICS, statystyki, QR, udostępnianie i szkice. Panel zachowuje swój wygląd. Wszystkie wcześniejsze, wyraźne życzenia użytkownika — bezpośrednie profile, portrety w stroju A, mobilne skróty drużyn — pozostają.
- Portrety zostały wcześniej przerobione na wyraźne życzenie użytkownika. Audyt nie nakazuje ich cofnięcia. Przed publikacją potrzebna jest klubowa weryfikacja podobieństwa, zgód i pochodzenia mediów; nie wolno uznać lokalnego override za potwierdzenie zgody.

## Kolejność prac

### Etap A — naprawy o największym wpływie

**Zakres:** UI-01–07, UI-10.

Ujednolicić szczegóły meczu, usunąć admin copy i powtórzony wynik, poprawić box score, plakat, tokeny/kontrast i widoczny fokus. Każdy komponent kończyć porównaniem desktop/mobile i testem odpowiednim do zmiany.

### Etap B — hierarchia i wspólne wzorce

**Zakres:** UI-11–15, UI-19, UI-21–24, UI-29–32.

Skrócić homepage i stopkę, uporządkować krótkie strony, dodać kontekst tabel oraz nawigację relacji, zoptymalizować lightbox i działania wsparcia. Porządkować CSS podczas migracji komponentów.

### Etap C — treść i dane klubu

**Zakres:** UI-08–09, UI-16–17, UI-20, UI-25–28.

Uzupełnić media i aktywny skład, zatwierdzić kontakt, dodać konkretne materiały o klubie, dopracować znaki partnerów. Ten etap wymaga wiarygodnych danych klubu, a nie przykładowych treści.

### Etap D — odbiór

**Zakres:** UI-18, UI-33–34 + regresja całości.

Domknąć kaskadę i role cięcia, wykonać pełną macierz QA, zmierzyć wydajność i dostępność. Deploy pozostaje osobnym etapem z runbookami, backupem i rollbackiem.


## Pomiary dostępne i niedostępne

Pomiar lokalnych plików: trzy fonty WOFF2 mają łącznie **72 888 B (71,2 KiB)**. Źródłowy digital.css ma **101 316 B**, a jego osobna kompresja gzip około **21 254 B**. To nie jest całkowity transfer CSS aplikacji ani wynik Lighthouse. W bieżących zmierzonych widokach nie wykryto poziomego overflow całego dokumentu; tabele mogą celowo przewijać się we własnym obszarze.

Wybrane udane interakcje: kategoria Drużyna i zmiana query; przełącznik kolumn i poziomy scroll tabeli ligi; bezpośredni profil; menu Escape i powrót fokusu po animacji; galeria następne zdjęcie, Escape i powrót do miniatury; QR Escape i powrót do przycisku. Nie wykonano transakcji ani wysyłania formularzy.

Do wykonania przed odbiorem:

- **Responsywność:** 375/390/430/768/820/1024/1280/1440/1920 px; zoom 200%; długie nazwiska/tytuły; brak zdjęcia; bez poziomego overflow dokumentu.
- **Dane meczowe:** SCHEDULED/LIVE/BREAK/FINAL/POSTPONED/CANCELLED; null vs rzeczywiste 0; przełożenie bez daty; orientacja wyniku; ręczna edycja zachowana po imporcie.
- **Interakcje:** Menu i modale: Tab/Shift+Tab, Escape, scroll lock i powrót fokusu; galeria swipe/strzałki; share/fallback; QR/kopiowanie; kalendarz Europe/Warsaw; profile i linki meczów.
- **CMS i SEO:** Publish/unpublish → home/lista/szczegóły/sitemap/OG; izolacja szkiców; canonical; paginacja/kategorie bez JS; istniejące przekierowania i pełne media metadata.
- **Stany awaryjne:** Błąd API/CMS, offline, wolna sieć, cache ze znacznikiem świeżości, pusty skład/dokumenty/lista, obraz niedostępny; użytkownik ma dalszą akcję.
- **Dostępność:** Automatyczny skan plus klawiatura i realny VoiceOver/TalkBack; kontrast wszystkich ról, semantyka tabel, nazwy kontrolek, focus visible, reduced motion, Safari/Firefox i fallback cięć.
- **Wydajność:** Lighthouse mobile/desktop, 3 powtórzenia na produkcyjnym buildzie z opisem warunków. Cele: LCP <2,5 s, CLS <0,1, INP <200 ms; INP osobno z interakcji/danych terenowych. HAR/gzip: homepage JS ≤120 KB, CSS ≤50 KB, fonty ≤90 KB.
- **Regresja kodu:** Aktualne testy, typecheck, lint i build. Nie przepisywać dawnych 64 testów jako dzisiejszego wyniku. Sprawdzać także izolację publicznych tokenów od panelu.

## Źródła

- [CURRENT.md — nadrzędna wersja marki](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - brand/CURRENT.md>)
- [Brandbook 2.0 WWW — komponenty, siatka i odbiór](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - brand/05_brandbook/BeKaPaKa_Brandbook_2.0_WWW.pdf>)
- [Brandbook 2.0 — znaki, materiał i fotografia](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - brand/05_brandbook/BeKaPaKa_Brandbook_2.0.pdf>)
- [System WWW i referencje HTML](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - brand/06_www/README.md>)
- [WCAG — Contrast Minimum](<https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>)
- [WCAG — Target Size Minimum](<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>)
- [web.dev — Web Vitals](<https://web.dev/articles/vitals>)

## Materiały i status pracy

Raport HTML: [index.html](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/index.html>). Backlog maszynowy: [findings.json](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/findings.json>). Surowe obserwacje DOM: [evidence.json](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/evidence.json>). Manifest użytych dowodów: [evidence-manifest.json](</Volumes/External-drive-lexar/Dev/Projects/BeKaPaKa - stats/docs/qa/ui-audit-2026-10-06/evidence-manifest.json>).

W tym etapie dodano wyłącznie lokalne materiały audytu. Nie zmieniono interfejsu aplikacji, nie wykonano deployu ani zapisów do CMS. Bieżący podgląd 3100 pozostaje miejscem przeglądania serwisu.
