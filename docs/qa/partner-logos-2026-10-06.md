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
| Insight Data Consulting Izabela Kaszubowska | Dokładna nazwa, Bobolice/Głodowa, [profil firmy w Oferteo](https://www.oferteo.pl/insight-data-consulting-izabela-kaszubowska/firma/6139645) i katalogi. Profil ma awatar literowy, bez własnego logotypu. | Pełna nazwa; odrzucono logo portalu oraz zagranicznych firm Insight Data o podobnej nazwie. |

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
