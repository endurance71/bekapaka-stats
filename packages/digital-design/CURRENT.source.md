# BeKaPaKa Bobolice — co jest aktualne

Ostatnia aktualizacja: 02.10.2026 (herb 2.0 jako znak identyfikacji, szablony v6). **Zawsze zaczynaj od tego pliku.**

| Obszar | Aktualny plik | Status |
|---|---|---|
| Audyt i plan | `RAPORT-AUDYT-MARKI-2026-10-01.md` | gotowe |
| Brief, ton | `00_strategia/brief.md` | szkic, ❓ do potwierdzenia |
| Nazewnictwo | `00_strategia/nazewnictwo.md` | skrót **BKPK** (dodatkowy), zamrożone 02.10 |
| Herb | `01_logo/` (SVG kolor / biały / czarny) | robocza wektoryzacja, redraw do zlecenia |
| Kolory, fonty, siatka | `02_system/tokens.json` | **zamrożone 1.0** |
| Silnik grafik | `02_system/toolkit/` | gotowy |
| **Herb 2.0 = symbol identyfikacji wizualnej** (+ mini, układ poziomy, warianty A/B/złoto/ton/1-kolor/negatyw) | `02_system/symbole/znaki2.py`, `svg/herb2-*` | **kierunek zaakceptowany 02.10**, w dopracowaniu |
| Herb oficjalny klubu | `01_logo/` | **bez zmian**: dokumenty i sprawy formalne; na istniejących strojach do naturalnej wymiany |
| Sygnet 2.0, odznaki | `02_system/symbole/svg/` | propozycja |
| Wordmark, monogram, cyfry, ikony, desenie | `02_system/symbole/` | propozycja |
| Biblioteka motywów | `02_system/toolkit/motyw.py` | gotowe |
| **Rdzeń szablonów v6** (rodziny, warianty A/B, 4 stany zapowiedzi, 4 stany wyniku, formaty 4:5 / 9:16 / 1:1 / 16:9) | `03_szablony/rdzen-v6/` | **do oceny** |
| **Materiały do hali** (baner 4×2 m, roll-up, ekran wyniku) | `03_szablony/hala/` | do oceny |
| **System WWW** (audyt bekapaka.pl, tokeny CSS/Tailwind, komponenty, 8 ekranów desktop + mobile, tom WWW brandbooka) | `06_www/`, `05_brandbook/BeKaPaKa_Brandbook_2.0_WWW.pdf` | gotowe do wdrożenia; treści strony do korekty (patrz audyt) |
| **Barwy stroju B: zastosowania** (dzień meczu, wynik, matchday) | `03_szablony/stroj-b/` | do oceny |
| **Karuzela relacji** (4 slajdy) | `03_szablony/karuzela/` | do oceny |
| **Motion: intro herbu 2.0** (MP4 1080×1920 + GIF) | `03_szablony/motion/` | do oceny |
| **System partnerów** (poziomy, optyczne wielkości, plakietki, pasek) | `02_system/partnerzy/`, `02_system/toolkit/partnerzy.py`, `03_szablony/partnerzy/` | gotowe; poziomy do potwierdzenia |
| Ikony 2.0 (9, jedna rodzina; bez „dom”, „wyjazd” i „bilet” — jedna hala, mecze bezpłatne) | `02_system/symbole/ikony2.py` | gotowe |
| **Przebudowa całości** | `./build_all.sh` | znaki → szablony → plansze → brandbook |
| Plansze identyfikacji | `05_brandbook/source/plansze/`, `plansze2/`, `plansze3/` | gotowe |
| Wzór stroju (wektor) i materiały | `02_system/toolkit/kit.py`, `material.py`, `02_system/materialy/` | gotowe |
| Zdjęcia tymczasowe | `04_fotografia/zrodla-tymczasowe/` | do podmiany po sesji |
| Zaakceptowany kierunek fotograficzny | `99_archiwum/BeKaPaKa_Bobolice_v9/direction-photographic.md` + `tournament-photo-A` | zaakceptowany 01.10.2026 |
| Sesja zdjęciowa, AI, zgody | `04_fotografia/` | sesja planowana ~16.10.2026; lista ujęć i wzór zgody gotowe |
| **Brandbook 2.0 RC** (wersja do przekazania) | `05_brandbook/BeKaPaKa_Brandbook_2.0.pdf` | gotowy; bez warstwy roboczej — status i zadania tylko w tym pliku |
| Stare wersje v3–v9, research | `99_archiwum/` | tylko odniesienie, nie rozwijać |

## Decyzje zamrożone
- Herb oficjalny bez zmian; herb 2.0 jako symbol identyfikacji wizualnej (02.10.2026).
- Czerń #0B0B0B (koniec z grafitem #101820), czerwień #EF1734, papier #F3F1EC, złoto #F4A816 tylko dla herbu i wyróżnień.
- Fonty: wyłącznie Barlow Condensed ExtraBold + Barlow. Archivo Black, Anton i BKPK Numerals są wycofane.
- AI: bez generowania ludzi i retuszu twarzy (`04_fotografia/zasady-ai.md`).

- DNA: pełny wzór stroju A (skrzydła, błyskawica, ostrza, V, paski, lamówki, numer z pleców) w świecie materiałowym v9 (02.10.2026).
- Skrót dodatkowy: BKPK (02.10.2026).

## Decyzje 2.0 (po recenzji zewnętrznej, 02.10.2026)
- Architektura: herb klubowy = dokumenty; System 2.0 = cała komunikacja; nie łączymy obu w jednym materiale.
- Nazwy znaków: Herb klubowy · Znak główny 2.0 · Znak 2.0 Mini · Sygnet 2.0 · Monogram BKPK · Odznaka.
- Barwy stroju B = wariant kolorystyczny tej samej drużyny, tylko mecze w stroju B lub materiały świadomie oznaczone jako wariant B; nie submarka ani sekcja.
- Klub nie prowadzi akademii ani sekcji dziecięcej (korekta 02.10.2026): filary marki = Drużyna · Społeczność · Wydarzenia; filary nie wyznaczają kolorów.
- Złoto = prestiż i akcent systemowy; duże powierzchnie tylko MVP/puchar.
- Hierarchia DNA: rdzeń (V, skrzydła, 24°/66°, paski) · wspierające · funkcjonalne · dekoracja.
- Wynik: BeKaPaKa zawsze po lewej. Wszystkie mecze KALK na jednej hali — KOSiR Koszalin (02.10.2026): bez oznaczeń dom/wyjazd, zawsze podajemy miejsce. Turniej o Puchar Burmistrza: CESiR Bobolice.
- KALK = Koszalińska Amatorska Liga Koszykówki. Mecze bezpłatne — nie ma biletów; komunikujemy „Wstęp wolny” (02.10.2026).
- Tekst min. 20 px w pliku 1080 (kontrola automatyczna).
- Partnerzy: skala 1.00 / 0.62 / 0.50 jest domyślna; zapisy umów sponsorskich i regulaminów rozgrywek mają pierwszeństwo.
- Hala (10–25 m): przecięcie liter tylko w BEKAPAKA i krótkich nagłówkach; godzina, wynik, hala, sektor, komunikaty — bez przecięcia.
- WWW: w nagłówku strony Sygnet 2.0 + wordmark (Znak 2.0 Mini dopiero od 90 px); minima znaków wspólne dla obu tomów. Data w terminarzu WWW bez cięcia.
- Herb klubowy na istniejących strojach = materiał sprzed 2.0, do naturalnej wymiany; nowe projekty strojów w systemie 2.0.

## Otwarte decyzje
0. WWW: adres e-mail klubu (proponowany kontakt@bekapaka.pl), korekta treści o „treningach młodzieży” na stronie, jedna lista partnerów (strona ≠ baner), procedura usuwania zdjęć na prośbę (termin), decyzja o formularzu partnera zamiast mailto
0b. WWW przed FINAL: ręczny test przecięcia BKPK w Safari macOS/iOS i Firefox (`06_www/system/test_ciecie.py`, `pages/test-ciecie.html`); budżety wydajności na produkcyjnym buildzie
1. Zatwierdzenie przez zarząd: „Po co jesteśmy” (Drużyna / Społeczność / Wydarzenia), architektura marki, poziomy partnerów i partner główny
2. Fizyczne proofy znaku: haft Mini i Sygnetu, druk 20–30 mm, naklejka, sitodruk 1-kolor, favicon w przeglądarce (arkusz: `05_brandbook/proof/`)
3. Liczba zawodników i lista osób do sesji (~16.10.2026)
4. Kanały i rytm publikacji

## Zmiana decyzji
Każdą zmianę zamrożonej decyzji wpisz tutaj z datą i powodem, a potem zmień `tokens.json`.
