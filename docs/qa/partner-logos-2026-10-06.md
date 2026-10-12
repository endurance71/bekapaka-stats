# Logotypy partnerów — research i podmiana, 6.10.2026

Zakres: 14 istniejących partnerów w `site/lib/data/sponsors.ts`, homepage i `/sponsorzy`. Praca lokalna, bez zmian CMS, VPS lub deployu. Zachowano nazwy, identyfikatory, kolejność i jedną listę partnerów.

## Wynik

Były 4 pliki logo i 10 kafli tekstowych. Teraz jest 9 logotypów: 5 SVG i 4 rastry. Dodano 5 brakujących znaków, poprawiono 3 dotychczasowe; istniejący wektor herbu Gminy Bobolice pozostawiono. Pięciu partnerów nadal przedstawia pełna nazwa, ponieważ nie znaleziono potwierdzonego znaku. Nie oznacza to, że takie pliki nie istnieją — poniżej zapisano granice dostępnych źródeł.

Pierwszeństwo miały witryny partnerów i oryginalne wektory. Przejrzano nagłówki HTML/SVG, pliki i sekcje dla mediów, dostępne warianty, oficjalne materiały samorządowe, profile lokalnych firm oraz pliki dostarczone klubowi. Nazwa, miejscowość i powiązanie z partnerem były sprawdzane przed użyciem znaku. Generowanie AI, przerysowywanie rastrów i sztuczne zwiększanie rozdzielczości nie były stosowane.

## Użyte logotypy i źródła

| Partner | Przed → teraz | Najlepszy znaleziony materiał i decyzja |
|---|---|---|
| Gmina Bobolice | SVG → zachowany SVG | Istniejący wektor 748×872; nie zastąpiono go mniejszym rastrem z [witryny gminy](https://bobolice.pl/cms/4857/herb_miasta). [Odniesienie do wektora](https://commons.wikimedia.org/wiki/File:POL_Bobolice_COA.svg). |
| Majster Plus Koszalin | kwadratowy PNG 1160×1160 → SVG | Oryginalny znak z nagłówka [oficjalnego sklepu w Koszalinie](https://koszalin.majsterplus.com/), viewBox 430.09×107.52. Dodano tylko przestrzeń nazw SVG; zachowano kolorowy sygnet, czerwone pole i ścieżki. Link prowadzi do konkretnego sklepu. |
| Fem-Tech Tychowo | JPG z dużym białym marginesem → WebP 666×223 | Największy dostępny plik klubowy, 720×720, zawiera właściwy znak. Usunięto wyłącznie pusty margines; bezstratny zapis, bez powiększania. Tożsamość firmy potwierdzają [materiały sportu miejskiego](https://sport.szczecinek.pl/dofinansowania.html). Nie znaleziono publicznego wektora; odrzucono niezwiązane firmy „femtech”. |
| Contema Bobolice | nazwa → PNG 371×98 | Nieprzerobione logo z dostarczonego systemu marki `logo-00.png`. [Oficjalna firma](https://www.contema.eu/kontakt.htm) ma na stronie baner 742×226 z fabryką, kontenerami i małym znakiem. Baner odrzucono jako gorszą wersję do kafla. |
| CERTE | nazwa → PNG znaku 216×57 | Dostarczony `logo-09.png` zawiera stary podpis „Ireneusz” i adres. Wyodrębniono wyłącznie istniejący czerwony znak CERTE. [Aktualna strona kancelarii](https://certe.com.pl/) przedstawia Inez Szczęśniak-Kachlicką i nie udostępnia graficznego pliku logo. **Raster roboczy z materiału klubu; aktualny oryginał do potwierdzenia przez kancelarię.** Nie użyto znaków holenderskiej diagnostyki Certe. |
| Nadleśnictwo Bobolice / Lasy Państwowe | nazwa → SVG | Oryginał [EPS C1](https://www.lasy.gov.pl/pl/dla-mediow/logotypy-lp/lp_logo_pl_c1.eps) z [oficjalnych materiałów LP](https://www.lasy.gov.pl/pl/dla-mediow/logotypy-lp). Porównano warianty A1, B1 i C1; układ pionowy C1 lepiej mieści się w kaflu. Konwersja wektora do SVG bez zmiany grafiki. Znak ogólny LP; pełna nazwa [nadleśnictwa](https://bobolice.szczecinek.lasy.gov.pl/) pozostaje w etykiecie. Nie użyto wersji jubileuszowej 100-lecia. |
| ALAB laboratoria | nazwa → SVG | Dokładny inline SVG z nagłówka [oficjalnej witryny ALAB](https://www.alab.pl/), viewBox 165.8×26.4, oryginalne kolory i geometria. Link zaktualizowany do bieżącej witryny. |
| CESiR Bobolice | nazwa → WebP 1200×573 | Oryginalny [PNG 3333×1592](https://hala.spbobolice.pl/wp-content/uploads/2018/05/logo.png) z [działającej strony hali](https://hala.spbobolice.pl/). Do WWW przygotowano mniejszy bezstratny WebP; oryginał zachowano. Stary adres cesir.bobolice.pl nie rozwiązywał DNS. Nie użyto logo CESiR Warka. |
| Baumal | PNG 1767×604 → SVG | Oryginalny klubowy `Sponsorzy/baumal.eps`, zgodny ze znakiem na [oficjalnej stronie](https://e-hurtowniabudowlana.pl/). Konwersja wektor EPS → PDF → SVG, bez automatycznej wektoryzacji i bez zależności od fontów. |

## Partnerzy bez potwierdzonego pliku

| Partner | Co sprawdzono | Decyzja |
|---|---|---|
| PST Sped-Trans Bobolice | Bobolice/Chociwle, warianty PST/Sped-Trans i nazwisko Okupski; [oficjalny opis turnieju](https://rowery.wzp.pl/9247-pomorze-zachodnie-i-turniej-4-miast-o-puchar-burmistrza-bobolic), [tożsamość spółki](https://rejestr.io/krs/616209/przedsiebiorstwo-spedycyjno-transportowe-sped-trans), katalogi i profile. | Brak potwierdzonego logo; pełna nazwa. Znaki innych firm Sped-Trans odrzucono. |
| Piotr Adamus | Dokładne imię i nazwisko, Bobolice, usługi muzyczne, oficjalne [materiały gminy](https://bobolice.pl/cms/5144). | Nie potwierdzono znaku ani wyboru konkretnej marki; pełna nazwa partnera osobowego. |
| Remek / Remigiusz Klimek | Skup Aut, Autolaweta, RK-TRANS; [profil właściwego przedsiębiorcy](https://www.orlymotoryzacji.pl/profile-1852024-skup-aut-autolaweta-auto-handel-remigiusz-klimek) i oficjalne materiały turniejowe. | Brak potwierdzonego logo. Plik marki `logo-04.png` przedstawia **POM-PUI, K. Błażejak**, inny podmiot; nie użyto go, zgodnie z adnotacją w `partnerzy.json`. |
| Emil Jaświg | Auto-Części i Oleje, Bobolice, katalogi firm oraz [materiały powiatu](https://powiat.koszalin.pl/wp-content/uploads/2020/05/gaz-ziemska-10-2019-int.pdf). | Tożsamość firmy potwierdzona, pliku znaku nie znaleziono; pełna nazwa. |

Oryginały od powyższych pięciu partnerów umożliwią uzupełnienie grafiki bez zgadywania. Dla CERTE, Contemy i Fem-Tech warto docelowo pozyskać aktualne SVG/PDF/EPS bezpośrednio od firm — obecnie użyte rastry są najlepszymi potwierdzonymi materiałami dostępnymi w ramach tego przeglądu.

## Pliki i zgodność z systemem WWW

- `site/lib/data/sponsors.ts`: lokalne ścieżki, właściwe strony partnerów, `contain`, białe pola. Usunięto dopasowanie `fill`, czerwone tło całego kafla Majster oraz skalowanie powyżej 1.
- `site/public/images/partners/`: 8 przygotowanych plików. Istniejących oryginałów w `site/public/images/`, `Sponsorzy/` i projekcie marki nie zmieniono.
- [Manifest](partner-logos-2026-10-06/manifest.json): wszystkie 14 rekordów, źródła, decyzje, wymiary, liczba bajtów i SHA-256 użytych plików.
- `partner-logos-2026-10-06/sources/`: oryginały, warianty porównawcze, kopie stron z przeglądu oraz konwersje.

Zachowano jednakowe białe plakietki ze ścięciem, oryginalne kolory partnerów, pełne znaki i nazwę zamiast inicjałów przy braku logo. Jedna lista, bez nadawania niezatwierdzonych poziomów partnerstwa i bez dodawania firm spoza istniejących 14 rekordów. Nie dodano warstwy globalnych nadpisań CSS ani zmian wyglądu panelu.

## Weryfikacja

- **118/118 testów w 18 plikach**, typecheck i lint zaliczone.
- Produkcyjny build Next.js 16.3.6 zaliczony; uruchomiony podgląd na `http://127.0.0.1:3100`.
- `/sponsorzy`: 390, 768, 1440 px; homepage: 390 i 1440 px. Wszystkie 14 kafli występują raz, wszystkie 9 obrazów załadowane, brak poziomego overflow. Obrazy używają `contain`, bez skalowania obcinającego logo. Pełne nazwy pozostają etykietami dostępnymi dla czytników.
- Walidacja plików: rastry dekodują się, SVG są poprawnym XML i nie zawierają skryptów, zewnętrznych odwołań, osadzonych rastrów ani zależności od fontów.
- Łącznie 411 596 bajtów dla dziewięciu obrazów bez kompresji transportowej; oryginał CESiR nie jest przesyłany na stronę. To rozmiar zasobów, nie pomiar Lighthouse ani certyfikat dostępności.
- [Pomiary przeglądarki](partner-logos-2026-10-06/browser-checks.json), [desktop](partner-logos-2026-10-06/partners-1440.jpg), [mobile](partner-logos-2026-10-06/partners-390.jpg), [tablet](partner-logos-2026-10-06/partners-768.jpg).

Konwersja EPS: Ghostscript `pdfwrite` z `-dSAFER -dEPSCrop`, następnie `pdftocairo -svg` z dostępnego runtime. Fem-Tech: crop `(22,230,688,453)`, WebP lossless; CERTE: crop `(0,0,216,57)`, PNG; CESiR: 1200×573, Lanczos, WebP lossless. Grafiki nie są rekonstruowane ani powiększane.

## Uzupełnienie po wskazaniu użytkownika: ShipApp

W pierwszym przeglądzie zachowano 14 rekordów istniejących w danych strony i pominięto ShipApp obecny w systemie partnerów marki. Na prośbę użytkownika dodano 15. rekord, `s-15`, z nazwą ShipApp, linkiem `https://shipapp.pl` oraz niezmienionym oryginalnym transparentnym PNG 1884×366 z `02_system/partnerzy/logo-raster/logo-10.png`. Plik dostępny lokalnie jako `/images/partners/shipapp.png`. Nie użyto przygotowanego wcześniej SVG jako rzekomego oryginału. Homepage pobiera 18 partnerów, a `/sponsorzy` 60, więc oba widoki pokazują nowy rekord. Osobna sygnatura Powered by w stopce pozostaje. Aktualnie lista liczy **15 partnerów i 10 znaków (5 wektorów oraz 5 rastrów)**. Manifest uzupełniono o pochodzenie i SHA-256 nowego pliku.

## Aktualizacja 8.10.2026 — Insight Data Consulting Izabela Kaszubowska

Partner dostarczył 7 wariantów logo (PNG z przezroczystością): poziomy miedziany, poziomy biały, poziomy czarny, pionowy z podpisem „Izabela Kaszubowska” (3 kadry) i sam monogram IDC. Każdy wariant sprawdzono w faktycznym polu logo kafla (150 × 52 px, ekran 2×):

- **wybrany: poziomy miedziany** — najlepiej wypełnia szeroki kafel, „Insight Data Consulting” pozostaje czytelne, zachowany firmowy kolor;
- pionowe — podpis „Izabela Kaszubowska” ma w kaflu 2–3 px, nieczytelny;
- sam monogram — bez nazwy firmy;
- czarny — czytelny, ale traci kolor marki; biały — do ciemnego tła, którego ściana partnerów nie używa.

Plik WWW: `site/public/images/partners/insight-data-consulting.webp` — przycięty przezroczysty margines (z prawie przezroczystą poświatą, alfa ≤ 8, która zawyżała obrys), 1050 × 174 px (zapas na ekrany 3×), bezstratny WebP z kanałem alfa, 75 KB. W kaflu `logoCardScale: 1.25` → ok. 187 × 31 px, jak inne szerokie znaki (ShipApp, ALAB). Oryginały pozostają u klubu.


### Druga dostawa (8.10.2026, popołudnie)

Doszły dwa pliki (każdy w dwóch identycznych kopiach): nowy układ poziomy — monogram IDC, nazwa w dwóch liniach, kreska i „Izabela Kaszubowska” — oraz okrągła pieczęć.

- **wybrany: nowy poziomy** — przy tej samej wysokości monogramu nazwa „Insight Data Consulting” jest w kaflu ok. 2,5× większa niż w jednoliniowym znaku; podpis „Izabela Kaszubowska” mieści się w wysokości monogramu, więc nie zmniejsza logo (drobny podpis jak w BAUMAL);
- pieczęć — kwadratowa, w polu 65 px napisy po okręgu mają ok. 4 px.

Oba nowe pliki mają kremowe tło (253, 249, 246) bez przezroczystości — usunięte metodą color-to-alpha (jak w GIMP), z odcięciem alfa < 3%. Plik WWW zastąpiony: 1050 × 202 px, proporcje 5,2 : 1, bezstratny WebP z kanałem alfa, 103 KB; `logoCardScale: 1.25` bez zmian.

## Aktualizacja 9.10.2026 — Nadleśnictwo Bobolice, Jarzyńscy Palety, PST Sped-Trans

- **Nadleśnictwo Bobolice**: dotychczasowy plik (`lasy-vector.svg`) pokazywał tylko znak i napis „Lasy Państwowe”. Nowy `nadlesnictwo-bobolice.svg` (wymiary własne 295 × 156, żeby przeglądarka mogła go powiększyć; `logoCardScale: 1.5` → 147 × 78 px na komputerze, 125 × 66 px na telefonie) ma pod nim drugą linię „Nadleśnictwo Bobolice” — ten sam krój (Arial Bold ok. 8,98 pt, odstępy liter zgodne z oryginałem co do 0,02 pt), ten sam kolor LP `#004C40`, litery zamienione na krzywe (bez zależności od fontów). Obrys przycięty do treści, żeby dodatkowa linia nie zmniejszała logo w kaflu.
- **Jarzyńscy Palety** (PHU Mirosława Jarzyńska, Chociwle, gm. Bobolice): logo poziome z oficjalnej strony firmy (`jarzynscy.pl/wp-content/uploads/2019/11/jarzynscy-poziom1.png`, przezroczyste tło), przycięte do treści, 900 × 259 px, bezstratny WebP, 40 KB.
- **PST Sped-Trans Bobolice** — usunięty z listy partnerów (decyzja klubu).

### Poprawka 9.10.2026 — tylko „Nadleśnictwo Bobolice”

Na prośbę klubu z `nadlesnictwo-bobolice.svg` usunięto linię „Lasy Państwowe” (napis na obwodzie znaku zostaje — jest częścią znaku). „Nadleśnictwo Bobolice” stoi na jej miejscu (ta sama linia bazowa i odstęp od znaku), nieużywane definicje glifów usunięte. Proporcje ~2,4 : 1, wymiary własne 295 × 122, `logoCardScale: 1.25`; nazwa partnera i tekst alternatywny: „Nadleśnictwo Bobolice”.
