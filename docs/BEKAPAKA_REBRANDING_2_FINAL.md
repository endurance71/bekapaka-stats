# BeKaPaKa Website 2.0 — raport końcowy

Data: 7.10.2026 · Gałąź: `codex/2.0` (zmiany niezacommitowane) · Podstawa: [audyt](BEKAPAKA_REBRANDING_2_AUDIT.md), [plan](BEKAPAKA_REBRANDING_2_PLAN.md).
Zrzuty przed / po: [`docs/qa/rebranding-2-2026-10-07/`](qa/rebranding-2-2026-10-07/) (`przed-*` — stan wyjściowy, reszta — 2.0).

Weryfikacja: 155/155 testów (vitest), `tsc --noEmit`, `eslint` i `next build` bez błędów; 13 tras sprawdzonych w Chrome przy 390 i 1440 px bez błędów konsoli, z jednym H1 i bez poziomego przepełnienia; strona główna przy 375 / 390 / 768 / 1024 / 1280 / 1440 / 1920 / 2560 px.

---

## Zmieniono

- **Strona główna przestała być siatką kafli.** Zamiast tickera, bento z trzema równymi kaflami i sześciu sekcji „etykieta + H2 + siatka kart” ma pięć pasm odpowiadających na pytania z Brandbooka 2.0 w tej kolejności: *Kiedy gramy? → Jak poszło? → Co się wydarzyło? → Kto gra? → Kto nas wspiera?* Pytanie jest kickerem pasma, odpowiedź — jego treścią.
- **Najbliższy mecz to pełnoekranowa kompozycja**, nie karta: nazwy drużyn w skali Display XL (do 144 px), V stroju A jako znak „vs”, godzina cięta BKPK do 168 px, a pod nią dane w liniach (hala z mapą, wstęp wolny, odliczanie). Na dole hero są paski stroju.
- **Wynik jest nagłówkiem, nie przypisem.** Ostatni wynik (wcześniej 13 px w tickerze) ma teraz formę tablicy: dwa wiersze znak · drużyna · liczba w skali do 144 px. Prowadzący jest pełny, przegrywający konturem, BeKaPaKa zawsze u góry. Obok stoi pozycja w tabeli jako cięta cyfra (do 160 px) i skrócona tabela.
- **Linia zamiast pudełka.** Karty z tłem, ramką i cieniem zastąpiono listami z liniami 1 px, kolumnami 7/5 i zmianą materiału płyta ↔ papier na pełną szerokość. Prostokąt z tłem został tylko tam, gdzie służy czytelności: komórki ściany partnerów (białe pole pod logotypy) i kadry zdjęć.
- **DNA stroju w miejscach konstrukcyjnych:** paski stroju (4 linie, wygaszane ku górze) zamykają hero, nagłówki podstron i otwierają stopkę. V 24°/66° pojawia się raz, jako znak „vs” odsłaniany maską. Numer zawodnika stoi konturem za sylwetką w 72% szerokości portretu. Cięty „BEKAPAKA” podpisuje stopkę.
- **Usunięto złote wypełnienie z etykiety „Najbliższy mecz”** oraz poświaty i gradienty. Złoto zostało tylko jako akcent: aktywna pozycja nawigacji, focus na płycie i etykieta lidera statystyk.

## UX

- **Nawigacja w kolejności sportowej:** Mecze · Tabela · Skład · Aktualności · Partnerzy · Klub (wcześniej zaczynała się od Aktualności). „Panel klubu” zmieniono z przycisku z obrysem na link drugorzędny za separatorem, więc nie konkuruje z akcją meczu. Menu mobilne ma pozycje 64 px w Barlow Condensed 32 px i złotą belkę aktywnej pozycji, bez ikon.
- **Aktualności z hierarchią:** jedna historia wiodąca (zdjęcie 16:10 ze ściętym rogiem, tytuł do 60 px, lead), dwie drugorzędne z miniaturą obok i feed tekstowy „Wcześniej” (data · tytuł). Na `/aktualnosci` historia wiodąca ma układ 7/5, a dalej idzie siatka 3 / 2 / 1 bez ramek.
- **„Kto gra?” pokazuje liderów zamiast czterech mikro-kart:** jeden wyróżniony zawodnik (najwyższy EVAL) z portretem i paskiem 4 średnich, liderzy czterech kategorii jako tabela redakcyjna (zdjęcia się nie powtarzają) i indeks całego składu (numer + nazwisko, 20 linków).
- **Wsparcie na stronie głównej to zaproszenie, nie formularz bankowy.** Dwie karty z numerem konta i QR zastąpiono trzema kolumnami (1,5% · darowizna · dla firm) z linkami. Pełne dane przelewu zostały na `/klub#wsparcie`.
- **`/mecze`:** każdy mecz to jeden wiersz-link (wcześniej przycisk „Szczegóły meczu” w ramce). Strona ma pasmo uzupełniające: na terminarzu pokazuje ostatni wynik, na wynikach najbliższy mecz, więc przy małej liczbie meczów nie jest pusta.
- **`/mecze/[slug]`:** wynik i para drużyn w tym samym hero co na stronie głównej (H1), dalej kwarty jako linia tablicy, porównanie zespołowe i box score. Przełączniki widoku skrócono do „Statystyki / Akcja po akcji”.
- **Artykuł:** 20 linków spisu treści wyświetlanych jako akapit zastąpiono zwijanym „W tym artykule · 16 części”. Kolumna boczna ma listę „Czytaj dalej / Powiązane” z liniami, a podpis okładki nie kończy się już pustym „·”.
- **`/klub`:** rytm płyta → papier → płyta → papier → płyta. Filary Drużyna / Społeczność / Wydarzenia mają numery 01–03 konturem, „Klub w skrócie” to lista danych, kontakt to duży adres e-mail.

## Design system

- **Warstwy CSS** (`@layer foundation, components, content, match, pages`) w pięciu plikach zamiast jednego monolitu. Tokeny marki (`packages/digital-design/dist/tokens.css`, generowane z Brandbooka 2.0) → role semantyczne w `foundation.css` → komponenty.
- **Role kolorów** dla płyty i papieru: `--bg`, `--bg-muted`, `--surface`, `--surface-elevated`, `--text`, `--text-secondary`, `--text-muted`, `--line`, `--line-strong`, `--brand`, `--brand-text`, `--brand-gold`, `--action`, `--success`, `--warning`, `--danger`, `--focus`. Komponent nie zna wartości hex.
- **Typografia — 11 ról:** Display XL (płynna 56–152 px), Display, H1, H2, H3, Body Large (lead), Body, Small, Label, Stat (płynna 40–64 px), Score (płynna 80–200 px, cięcie BKPK). Nazwy drużyn w hero dobierają rozmiar do kolumny: (szerokość − znak) / (liczba znaków × 0,5 em), maksymalnie Display XL. Słowo nigdy się nie łamie (sprawdzone 375–2560 px oraz z nazwą „Maxbau Okna Dako PSP”).
- **Odstępy:** tylko skala 4 px z tokenów oraz `--section-pad` (56/72/96) i `--band-pad-lg`.
- **Layout:** jeden kontener 1280 px i jedna lewa oś dla nagłówka, hero i wszystkich pasm (wcześniej hero i nagłówek miały 1440 px, a pasma 1280 px). Podziały 7/5 i 8/4, tekst czytany `min(68ch, 720px)`.
- **Promienie:** brak zaokrągleń. Ścięty róg 8 px dla przycisków, 24 px dla kadrów wiodących; pigułka tylko dla kropki LIVE.
- **`!important`:** 3 wystąpienia (tylko blok `prefers-reduced-motion`), wcześniej 22.

## Components

| Nowy / przebudowany | Rola |
|---|---|
| `primitives/Band`, `BandHead`, `PageHeader` (+ `Breadcrumbs`), `JerseyStripes`, `ArrowLink` | prymitywy pasm, nagłówków i linków „dalej” |
| `match/MatchHero` (+ `LiveMatchCard` z odświeżaniem LIVE co 30 s) | jedno hero dla 6 stanów meczu (zaplanowany, na żywo, przerwa, koniec, przełożony, odwołany) — strona główna i szczegóły |
| `match/Score`, `match/ScoreBoard`, `match/FixtureRow`, `match/TeamMark` (+ `VersusMark`), `match/EventHero` | jeden system wyniku zamiast trzech gałęzi markupu w `MatchCard` |
| `news/Story` (`lead` / `item` / `grid` / `row`) | jedna rodzina historii zamiast `NewsCard` + `FeaturedStory` |
| `team/PlayerPortrait`, `team/StatLeaders`, `team/RosterIndex`, `shared/PlayerCard`, `shared/PlayerProfile` | portret z numerem za postacią, liderzy, indeks składu, profil 5/7 |
| `shared/StandingsBoard` (`compact` / pełna), `shared/PositionSummary` | tabela z kolumnami kluczowymi na stronie głównej; pozycja jako cięta cyfra |
| `sponsors/PartnersGrid` (ściana partnerów) | komórki o równym polu optycznym, linie 1 px, poziomy main / strategic / supporting / local gotowe pod flagę `SITE_PARTNER_LEVELS_APPROVED` |
| `support/FsmmSupportSection`, `DonationSupportPanel` | dwie kolumny danych do przepisania (KRS, cel, rachunek) |
| `templates/HomeTemplate`, `templates/ListingTemplate`, `templates/EditorialDetailTemplate` | trzy szablony zamiast pięciu |

## Responsive

- **Mobile:** hero ma rywalizację w pionie (znaki 56 px, nazwy 56 px), godzinę 80 px i przyciski na pełną szerokość. Wynik to dwa wiersze tablicy. Historie drugorzędne to wiersze z miniaturą po prawej. Liderzy idą w kolumnie, indeks składu w 2 kolumnach. Ściana partnerów ma 2 kolumny bez pustej komórki (obramowanie komórek zamiast tła-przerw).
- **Tabela:** compact pokazuje # · drużyna · M · W · P · Pkt (+/− od 768 px). Pełna: kolumny kluczowe + „Więcej kolumn” (`aria-pressed`) z przyklejoną kolumną drużyny.
- **Box score na telefonie:** MIN · PKT · ZB · AS, reszta pod „Pełne statystyki”; kolumna zawodnika jest przyklejona.
- **Cele dotykowe:** min. 44 px (linki stopki, okruszki, przyciski, wiersze indeksu składu).
- **Duży ekran:** jedna oś 1280 px; typografia display rośnie do progu, więc treść nie „tonie” w czerni.

## Performance

- **CSS:** 14,7 KB gzip w jednym pliku (tokeny marki + 5 warstw). Wcześniej sam `digital.css` miał 24,4 KB gzip.
- **Bez nowych zależności i bibliotek animacji;** cały ruch to CSS (maska V 600 ms, rysowanie pasków 400 ms, zoom zdjęć 3%).
- **LCP:** zdjęcie hali w hero z `preload` + `fetchPriority="high"`. Historia wiodąca na `/aktualnosci` i pierwsze 5 portretów na `/sklad` ładują się `eager` (usuwa ostrzeżenie LCP z konsoli); reszta `lazy`.
- **Usunięto 13 nieużywanych assetów (1,55 MB):** `images/ev-*.jpg`, `hero-*basketball.jpg`, duplikaty `baumal`, `majster-plus`, `fem-tech.jpg`, `logo.png`, nieużywane SVG ShipApp. `public/photos/*.png` zostają — `resolvePlayerPhoto` dobiera je dynamicznie po nazwisku.

## Accessibility

- Jedno H1 na każdej z 13 sprawdzonych tras. Na stronie głównej H1 jest wizualnie ukryte; widoczne nagłówki pasm to H2, historie H3.
- Fokus 3 px na wszystkim (złoty na płycie, czarny na papierze), sprawdzony klawiaturą: skip link → logo → menu. Menu mobilne: pułapka fokusu (10 × Tab zostaje w dialogu), Esc zamyka, fokus wraca na przycisk menu.
- `prefers-reduced-motion: reduce` wyłącza animacje i przejścia (sprawdzone: `animation-name: none` na znaku V).
- Wynik ma `aria-label` „BeKaPaKa 86, Kosz-All-In 20”. Forma w tabeli to litera + kształt (pełny / kontur) + tekst dla czytnika. Skróty w nagłówkach tabeli to `<abbr title>`. Kolor nigdy nie jest jedyną informacją (Wygrana / Porażka podane słowem).
- Pary kolorów z tabeli kontrastu tomu WWW (s. 12). Złoto na papierze nie jest używane jako tekst (rola `--brand-gold` na papierze to `#9A6400`).

## Cleanup

- **Usunięte pliki:** `app/styles/digital.css` (1 496 linii) i 17 komponentów (1 421 linii TSX): `public-site.tsx`, `MegaHomeTemplate`, `EditorialHomeTemplate`, `EditorialListingTemplate`, `EditorialNewsTemplate`, `PageScaffold`, `ListingPageHero`, `MatchCard`, `NewsCard`, `FeaturedStory`, `NearestEventCard`, `Section`, `SlideoutPanel`, `MarkdownContent`, `SponsorsStrip`, `SponsorLogoFrame`, `StandingsBoardInteractive`. Do tego 16 nieużywanych ikon z `PublicIcons`.
- **Martwe klasy:** po sprawdzeniu „klasa w CSS bez użycia w TSX” usunięto 8 reguł fundamentu. Pozostałe trafienia to klasy składane dynamicznie (`score--${size}`, `status-flag--…`) lub ustawiane przez hook (`is-scroll-locked`).
- **Klasy `-v2` i `-premium`** w widoku meczu ujednolicono do nowego systemu (`table-scroll`, `data-table`, `segmented`, `compare`, `quarters`). Dwa systemy przycisków (`btn` + `button button--ghost`) zastąpiono jednym (`btn`).
- **Testy:** 6 plików zaktualizowano do nowych komponentów, zachowując sprawdzane zachowania (statusy, brak sztucznego 0:0, mapy, kolumny tabeli, numery składu). Wszystkie 155 testów przechodzi.
- **Dokumentacja:** `site/README.md` (wcześniej „Bento Grid”), `docs/design-tokens.md` (sekcja strony bez złotego gradientu CTA), `docs/Brand Book - BeKaPaKa Bobolice.md` oznaczony jako nieaktualny (1.0).
- **`next.config.mjs`:** opcjonalny `SITE_BUILD_DIR` pozwala zweryfikować build bez nadpisywania `.next` działającego serwera. Domyślnie bez zmian.

## Remaining opportunities

1. **Odświeżenie podglądu :3100.** To nadal stary build (proces `preview-local` uruchomiony przed zmianami). Po zatrzymaniu serwera dev uruchom `npm run preview:local` w `site/`.
2. **Hasło „Po co jesteśmy”** („Żeby w Bobolicach grało się w koszykówkę”) czeka na zatwierdzenie zarządu (`CURRENT.md`, otwarta decyzja 1). Po zatwierdzeniu może zostać H1 strony `/klub`; dziś jest tam faktograficzne „Koszykówka z Bobolic”.
3. **Sesja zdjęciowa (~16.10.2026):** jednolite portrety w stroju A wzmocnią „Kto gra?” i skład. Obecne portrety lokalne to warianty tylko dla podglądu, a 9 zawodników nie ma zdjęcia (pokazujemy numer + monogram BKPK).
4. **Poziomy partnerów i partner główny** — po decyzji ustawić `tier` w `lib/data/sponsors.ts` i `SITE_PARTNER_LEVELS_APPROVED=1`. Architektura (skala 1.00 / 0.62 / 0.50) jest gotowa.
5. **Galeria meczowa jako pasmo strony głównej** po pierwszych zdjęciach z meczów KALK (dziś są tylko zdjęcia turniejowe w artykułach).
6. **OG obrazy** w nowym języku (para znaków + cięta godzina / wynik) — generator `/api/og` działa, ale ma jeszcze stary układ.
7. **Formularz partnera zamiast `mailto`** i docelowy adres e-mail klubu (`kontakt@bekapaka.pl` — propozycja niezatwierdzona).
8. **Test ręczny przed publikacją:** cięcie BKPK w Safari / Firefox (dziś bezpieczny fallback bez maski), VoiceOver / TalkBack, Lighthouse i CrUX na produkcyjnym buildzie po deployu.

---

## Iteracja 2.1 — czytelność i jakość produkcyjna (7.10.2026)

Po odbiorze 2.0 (tabele nieczytelne, rozjeżdżające się przyciski, niewykorzystana szerokość ekranu ~2000 px) zmierzono stronę skryptem Playwright i w Brave użytkownika (1920 px, DPR 2). Punkt startowy: **120 naruszeń przy 375 i 1920 px**. Po iteracji: **0 naruszeń w 5 szerokościach (375 / 768 / 1024 / 1440 / 1920) × 13 tras**.

- **Szerokość:** kontener 1280 → **1600 px** z płynnym marginesem `clamp(48px, 3,75vw, 80px)` od 1280 px; przy 1920 px treść ma 1600 px zamiast 1280. Od 1600 px skład ma 6 kolumn, aktualności 4, partnerzy 6.
- **Skala dużego ekranu (≥ 1600 px):** body 19 px, dane w tabelach 18 px, H1 72 px, Display 108 px.
- **Próg tekstu:** nowa rola `--fs-micro` (14 px, 15 px od 1600 px) zastąpiła wszystkie 12 px. Etykiety mają 14 px, podpisy 15 px, dane tabel 16 / 17 / 18 px, wiersz tabeli 48 / 52 / 56 px.
- **Kontrolki:** wspólne `.actions` / `.toolbar` utrzymują 48 px w jednym rzędzie i równe górne krawędzie. „Udostępnij” to zwykły przycisk (status w etykiecie + region live). Akcje w kolumnach wsparcia na `/klub` są dociśnięte do jednej linii.
- **Tabela ligi:** bez przełącznika „Więcej kolumn”.
  - Telefon: # · drużyna · M · W · P · Pkt, bez przewijania.
  - Tablet: dochodzą +/− i forma. Desktop: wszystkie kolumny.
  - Pkt to wyróżniona kolumna (Condensed, tło). Forma: kwadraty 28 px. Seria jako tekst. Legenda bez podwójnych myślników.
  - Szerokości mają wszystkie kolumny poza nazwą drużyny.
- **Box score:**
  - Usunięto błędny limit `max-width: 56rem` (ucinał tabelę do 896 px).
  - 22 kolumny → 18: celne/oddane i % rzutów w jednej komórce, separatory grup.
  - Przy 1920 px tabela mieści się bez przewijania; na 375 px widok podstawowy (MIN · PKT · ZB · AS) mieści się w 343 px.
  - Przełącznik drużyny i „Pełne statystyki” stoją w jednym pasku; ten przycisk i podpowiedź występują tylko na telefonie.
  - Legenda jest zwijana („Objaśnienie skrótów”).
- **Przegląd meczu:**
  - Kwarty jako tabelka protokołu (drużyny × Q1–Q4 + Razem).
  - Porównanie zespołowe w dwóch kolumnach, z nagłówkiem „BeKaPaKa | rywal”.
  - Poprawiona etykieta „Rzuty z gry (FG)”.
  - Przy wyniku (koniec, LIVE, przerwa) liczby stoją na telefonie przed parą drużyn.
- **Wyjścia poza kontener:** cięte cyfry mają rezerwę na pochylenie, `FixtureRow` nie ma ujemnego marginesu, a okruszki artykułu nie powodują już poziomego scrolla na telefonie.
- **Gęstość mobile:** niższe nagłówki podstron, mniejszy blok pozycji w `/tabela`, wygaszona krawędź przewijanych zakładek na `/klub`.
- **Kontrola regresji:** `site/scripts/qa-layout.py` (`npm run qa:layout`) wykrywa poziomy scroll, tekst < 14 px, nierówne kontrolki, przewijane tabele ≥ 1440 px, liczbę H1 i błędy konsoli. Kod wyjścia ≠ 0 przy naruszeniach.

---

## Iteracja 2.2 — przegląd wszystkich elementów (7.10.2026)

Przegląd każdej strony element po elemencie w Brave użytkownika (1920 px, DPR 2) i na 375 px. QA nie łapał części błędów, bo mierzył przepełnienie i wysokości, a nie proporcje, więc dostał nowe reguły: rozciągnięte kontrolki (≥ 80% rodzica), akapit szerszy niż 760 px, podpis powtórzony > 3 razy, zdarzenie PBP wyższe niż 64 px, „pływająca” kolumna w wierszu meczu. Sprawdza też widok `?widok=akcje`. Wynik: **0 naruszeń w 5 szerokościach × 14 tras**.

**Przyczyny systemowe**
- Siatka rozciągała przełączniki i przyciski na 100% szerokości. Teraz `.btn` i `.segmented` mają szerokość treści (`fit-content`, `justify-self: start`).
- Limity 56 rem w pasmach danych zastąpiono pełną siatką 7/5.
- Kolumna boczna aktualności na stronie głównej jest jednym blokiem (drugorzędne + „Wcześniej”), bez dziury.
- Plakaty (proporcje < 1,3 albo `imageFit: contain`) pokazujemy w całości na czerni, zdjęcia poziome są kadrowane.

**Akcja po akcji — przebudowa**
- **Filtry:** jeden pasek: kwarty (Mecz / Q1–Q4) · drużyna · rodzaj akcji jako lista rozwijana z licznikami · „Resetuj”. Wcześniej trzy pełnoszerokościowe rzędy i 10 przycisków.
- **Oś zdarzeń:**
  - jedna linia na zdarzenie: czas · BKPK / skrót rywala · zawodnik + akcja · wynik bieżący, ~44 px zamiast ~75 px;
  - nagłówek kwarty przyklejony, z wynikiem po kwarcie;
  - od 1280 px kwarty stoją w dwóch kolumnach.
- **Domyślny filtr:** „Punkty i celne rzuty”. Poprawiony błąd: filtr łapał „Niecelny” (podciąg „celny”) i pokazywał 149 zamiast 58 zdarzeń.
- **Dane KALK:** „Zmiana: #-2 → X (#n)” to teraz „Wchodzi na parkiet” (`describeAction`).
- **Telefon:** zdarzenie w dwóch liniach na pełną szerokość (czas · drużyna · wynik / zawodnik — akcja).
- **Linkowalny widok:** `/mecze/kalk-…?widok=akcje`. Zakładki Statystyki / Akcja po akcji przełączają całą treść; kwarty i porównanie należą do Statystyk.

**Pozostałe elementy**
- **Hero meczu:** wysokość ekranu tylko przed meczem; po meczu wysokość treści, a treść jest wyśrodkowana w pionie.
- **`/mecze`:** hala, wstęp wolny i kolejka stoją pod drużynami, dochodzi strzałka przejścia. Pasmo „Ostatni wynik / Najbliższy mecz” ma obok pozycję i tabelę compact.
- **Partnerzy bez logo:** nazwa jako plakietka (Condensed, wersaliki) zamiast zwykłego tekstu.
- **Stopka:** podpis „BEKAPAKA” mniejszy i nieprzycięty.
- **Skład:** pasek statystyk karty to 3 równe komórki (wartość 22 px + etykieta). Monogram w kartach bez zdjęcia jest większy. W indeksie składu nazwiska mają 16 px, a numery 24 px.
- **Profil:**
  - „Udostępnij” ma szerokość treści, a nie całej kolumny;
  - brak prób rzutowych to słowo „brak prób”, nie wielkie „—”;
  - historia występów jest tabelą compact, nierozciągniętą na 1600 px.
- **Artykuł:** tekst (≤ 46 rem) i kolumna boczna stoją obok siebie. Galeria wychodzi na szerokość tekstu i kolumny. Ostrzeżenie podglądu lokalnego pojawia się raz nad galerią, a nie pod każdym z 20 zdjęć.
- **Klub:** relacje w dwóch kolumnach. Na `/sponsorzy` akcja współpracy jest wyrównana do dołu nagłówka.

---

## Iteracja 2.3 — jeden system tabel (7.10.2026)

Tabele były nieczytelne: wiersze rozdzielała tylko linia 1 px, a nagłówek i stopka niczym się nie wyróżniały. Działały też dwa osobne systemy (`.standings-table` w `components.css`, `.data-table` w `match.css`). Zastąpił je jeden plik `site/app/styles/tables.css` (warstwa `@layer tables`) z klasą bazową `.table`, używaną we wszystkich czterech tabelach.

- **Pas nagłówka:** na płycie ciemnoszary (`#2E2C29`), na papierze odwrócony (czarny), biały tekst 14 px wersalikami. Przykleja się pod nagłówkiem strony (od 1280 px także w box score — tabela przestała przewijać się w bok). Kolumna kluczowa (Pkt / PKT / ZB / EVAL / Razem) ma czerwoną belkę w nagłówku.
- **Zebra:** co drugi wiersz ma tło `--table-stripe`, nadane na komórkach, więc przyklejona pierwsza kolumna ma ten sam kolor co jej wiersz. Najechanie podświetla cały wiersz.
- **Pas stopki:** tło z linią 2 px — „Zespół” w box score i nowa stopka „Średnio · N meczów” w historii występów zawodnika.
- **Wiersz BeKaPaKa:** czerwień marki 14% / 10% z belką 4 px, ma pierwszeństwo przed zebrą — w tabeli ligi, w wyniku w kwartach i w grupach turniejowych.
- **Listy-tabele (`.zebra-list`)** w tym samym rytmie:
  - akcja po akcji — nagłówek kwarty jako przyklejony pas;
  - harmonogram turnieju — kolumna godzin 8,5 rem, bez łamania „9:30–10:15”;
  - grupy turniejowe — nagłówek grupy jako pas;
  - liderzy sezonu.
- **Skrócona tabela** (strona główna, `/mecze`): węższe kolumny liczb, mieści się w kolumnie 5/12 od 1024 px.
- **Czytelność tekstu:**
  - tytuły historii w siatce, liście i feedzie oraz „Czytaj dalej” zapisane zdaniowo Barlow 600 (wersaliki Condensed zostały tylko w historii wiodącej);
  - dane w `.facts` (KRS, rachunek, „Klub w skrócie”) w Barlow 600; numer rachunku w Condensed do łatwego przepisania;
  - stopka strony 16 px;
  - okładka artykułu w naturalnych proporcjach (plakaty nie są przycinane).
- **QA:** każda widoczna tabela musi mieć pas nagłówka różny od tła, zebrę między sąsiednimi wierszami, wyróżnioną stopkę (jeśli jest) i wiersz ≥ 44 px; listy `.zebra-list` muszą mieć zebrę. Wynik: 0 naruszeń w 5 szerokościach × 14 tras.

## Iteracja 2.4 — strona artykułu (7.10.2026)

Przy 1920 px artykuł zajmował ~1150 z 1600 px kontenera, a prawa strona była pusta przez ~10 000 px długości. Spis treści był zwinięty, przed każdą sekcją stały dwie kreski, bloki danych wyglądały jak surowy Markdown, a po ostatnim akapicie od razu zaczynała się stopka.

- **Hero** bez zmian w układzie: tytuł i lead po lewej (7/12), okładka po prawej (5/12), teraz wyrównana do góry. Usunięte: czerwona belka przy okładce, podpis „Powiększ okładkę” (została ikona w rogu i `aria-label`), przycisk „Udostępnij” i hashtagi z nagłówka. Na telefonie okładka jest zaraz pod tytułem, na pierwszym ekranie.
- **Trzy strefy od 1280 px** (`.art-body--rail`): szyna ze spisem treści · tekst · kolumna boczna „Czytaj dalej” (nowszy / starszy). Obie szyny są przyklejone i widoczne przez cały artykuł. Bloki danych mieszczą się w kolumnie tekstu.
  - Spis treści (`components/public/news/ArticleToc.tsx`) podświetla aktywną sekcję i pokazuje licznik „3 / 11”.
  - Pozycje spisu liczy `getArticleNavigation()` z `ArticleMarkdown.tsx`: sekcje H2 oraz bloki bez nagłówka; galerii nazwanej już nagłówkiem nie dubluje.
  - Między 1024 a 1279 px: tekst i kolumna boczna, spis zwijany na początku tekstu.
- **Bloki treści:**
  - `---` tuż przed nagłówkiem jest usuwane, więc H2 ma jedną linię 2 px z czerwoną belką 48 px;
  - H3 zapisane zdaniowo Barlow 600;
  - „… w liczbach” → pas liczb (wartość Condensed + etykieta);
  - lista „**Etykieta:** wartość” → tabela faktów z zebrą;
  - lista numerowana pod nagłówkiem „Klasyfikacja…” → ranking z zebrą: 1. miejsce w złocie, wiersze BeKaPaKa z czerwoną belką. Zwykłe listy kroków zostają listami;
  - wynik meczu → pas płyty z białym wynikiem Condensed;
  - galeria → 1 duże + 8 zdjęć i przycisk „Pokaż wszystkie zdjęcia (N)”; lightbox przegląda wszystkie.
- **Zakończenie:** „Tematy” i „Udostępnij” pod tekstem, potem pasmo na płycie „Czytaj dalej” z 6 historiami ze zdjęciami w dwóch rzędach (powiązane, dopełnione najnowszymi) i linkiem „Wszystkie aktualności”.
- **Kolumna boczna „Czytaj dalej”:** do 5 artykułów — nowszy, starszy, a po nich najnowsze z datą.
- **Miniatury aktualności:** każde zdjęcie historii ma ścięty róg (24 px w historii wiodącej, 12 px w miniaturach i siatce).
- **QA:** nowe reguły — wykorzystanie szerokości artykułu ≥ 90% kontenera (≥ 1440), brak podwójnych linii, kolumna boczna nie nachodzi na bloki, okładka na pierwszym ekranie przy 375 px. Dodana trasa z plakatem jako okładką. Wynik: 0 naruszeń w 5 szerokościach × 15 tras. Testy 162/162, typecheck, lint i build produkcyjny przechodzą.

## Wdrożenie produkcyjne (7.10.2026)

Przygotowanie w repo przed przełączeniem bekapaka.pl na 2.0:

- **Build w CI i Dockerze:** wygenerowane tokeny marki `packages/digital-design/dist/` są wersjonowane (wyjątki w `.gitignore` i `.dockerignore`). Wcześniej strona budowała się tylko lokalnie. CI sprawdza, czy `dist/` zgadza się z `tokens.json` (`build_tokens.py` + `git diff --exit-code`).
- **Bezpieczeństwo zależności:** `proxy-addr` 2.0.7 → 2.0.8 w backendzie (krytyczna podatność, poprawka bez zmian API). Bez niej bramka audytu w CI zatrzymałaby wdrożenie.
- **Zgody na zdjęcia:** skrypt `scripts/vps/seed-media-records.mjs` (+ test w CI) tworzy rekordy `media-record` dla opublikowanych zdjęć: zgoda „nie wymagana”, autor „BeKaPaKa Bobolice”, opis z alt lub tytułu artykułu. Tworzy tylko brakujące.
- **`docker-compose.prod.yml`:** dane klubu dla strony (`SITE_CONTACT_EMAIL`, `SITE_PRIVACY_URL`, `SITE_ASSOCIATION_KRS`, `SITE_PARTNER_LEVELS_APPROVED`). Backend odświeża stronę przez sieć Docker po zapisie prezentacji meczu.
- **Skład:** Filip Kawecki (#77) nie gra już w klubie. Jego rekord składu usuwa się na produkcji jak przyciskiem „Usuń” w panelu; statystyki KALK i box score zostają. W aktywnym sezonie KALK 2026/27 go nie ma, więc synchronizacja go nie przywróci. Z repo usunięto jego portret do lokalnego podglądu.
- Kolejność wdrożenia i polecenia: [vps-runbook.md](./vps-runbook.md#wdrożenie-strony-20-i-zgody-na-zdjęcia).

## Iteracja 2.5 — audyt mobilny produkcji i naprawy (7.10.2026)

Audyt bekapaka.pl na telefonie (390 × 844, ekran 2×, dotyk): 17 stron + menu, 134 zrzuty, pomiar każdego tekstu, pola dotyku i zdjęcia. Kontrast (WCAG AA), tekst < 14 px, przewijanie w bok i błędy JS — bez uwag. Poprawione:

- **Tabele na telefonie** (PR #14): przyklejony nagłówek zakrywał pierwszy wiersz — w kwartach brakowało wiersza BeKaPaKa, historia występów z jednym meczem wyglądała na pustą. Profil dostał odstęp od nagłówka strony.
- **Wynik meczu zakończonego:** na telefonie tablica „herb · drużyna · liczba” (`ScoreBoard`) zamiast samych liczb nad parą drużyn.
- **Wynik w artykule:** na telefonie liczby na górze, drużyny pod nimi — bez łamania nazw w środku słowa.
- **Plakaty w kartach:** kadr tylko dla zdjęć o proporcjach 1,3–1,7; plakaty pionowe, kwadratowe i 16:9 w całości (`storyImageFit`, pole CMS `imageFit` ma pierwszeństwo).
- **Koniec artykułu:** na telefonie bez listy „Czytaj dalej” dublującej pasmo ze zdjęciami.
- **Zapowiedź meczu:** bez pustej sekcji między paskami; informacja o statystykach w hero.
- **Ostrość zdjęć:** poprawione `sizes` strojów na `/klub` i miniatur relacji; sygnet w nagłówku w proporcjach 912 × 981.
- **Stopka:** linki w dwóch kolumnach na telefonie. **Pola dotyku** e-maili kontaktowych 44 px. „Szukaj hali w mapach” bez łamania.
- **Akcja po akcji:** pełne nazwy drużyn zamiast skrótów („KAI”); usunięta nieużywana `formatTeamShortName`.
- **`/klub`:** zakładki bez wygaszonej krawędzi (zawijają się). **Liderzy:** kwadratowy kadr portretu na telefonie.
- **Kontrola:** `npm run qa:mobile` (`scripts/qa-mobile.py`: kontrast, tekst, pola dotyku, zdjęcia, opcjonalnie zrzuty) oraz w `qa-layout.py` reguły `table-row-covered`, `image-undersized`, `image-distorted`, `tap-target`. Lokalnie: `qa-mobile` 0 uwag (18 widoków), `qa-layout` 0 naruszeń (5 szerokości × 16 tras).
- **Do uzupełnienia poza kodem:** większy plik portretu #24 (dziś 304 px, na liście wyjątków QA), docelowy e-mail klubu (`SITE_CONTACT_EMAIL`).

## Zapowiedź meczu: porównanie z rywalem w sezonie (7.10.2026)

Strona nadchodzącego meczu (`/mecze/kalk-<id>`) ma pod hero sekcję „Przed meczem · Jak wypadamy w sezonie”:

- **Para drużyn:** herb, miejsce w tabeli, bilans i forma (odznaki jak w tabeli ligi).
- **Średnio na mecz** z box score KALK: punkty zdobyte i stracone, zbiórki, asysty, przechwyty, bloki, straty, FG%, 3P%, FT% (procenty z sum celnych i oddanych). Lepsza wartość podkreślona — dla punktów straconych i strat niższa.
- **Najlepsi strzelcy** obu drużyn (pkt na mecz) i **mecze bezpośrednie** ze wszystkich sezonów (z linkiem do meczu).
- Drużyna bez meczu w sezonie: zdanie zamiast pustych słupków; błąd lub brak danych — sekcja się nie pokazuje.
- **Backend:** publiczny `GET /api/league/matchup?opponent=<nazwa>` (`getMatchup` w `dataStore.js`, czyste funkcje w `backend/lib/matchup.js` + testy).
- **Wspólne słupki** `CompareBars` także w „Porównaniu zespołowym” meczu zakończonego — przy meczu wyjazdowym wartości BeKaPaKa i rywala nie są już zamienione miejscami.

### Zapowiedź meczu 2 — „kto ma przewagę” (7.10.2026)

Pierwsza wersja była zbyt uboga (małe herby, słupki czytane na krzyż, porównanie zawodników tylko w punktach). Teraz w stylu programu meczowego:

- **Para drużyn** jak w hero: duże herby i nazwy po bokach, V pośrodku; miejsce, bilans, forma.
- **Lustrzane porównanie** w jednej kolumnie, w trzech blokach — **Atak** (punkty, asysty, FG%, za 2, za 3, rzuty wolne), **Zbiórki** (łącznie, w ataku, w obronie), **Obrona** (punkty stracone, przechwyty, bloki, straty). Paski od środka (dłuższy = większa wartość), lepsza strona w kolorze marki, pod każdą wartością **miejsce w lidze**.
- **Liderzy na mecz** — pojedynki zawodników w punktach, zbiórkach, asystach, przechwytach, blokach i EVAL (średnie z box score, pełne nazwiska z profili KALK).
- **Mecze bezpośrednie** jako karty wyników.
- Backend: `leagueRanks`, `playerAverages`, `leaderDuels` w `backend/lib/matchup.js` (+ testy).
