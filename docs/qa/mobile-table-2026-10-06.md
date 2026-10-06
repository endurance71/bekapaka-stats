# Mobilne tabele ligi — 6.10.2026

Na prośbę użytkownika mobilne tabele ligi pokazują logo i krótki identyfikator zamiast pełnej nazwy. Zmiana obejmuje wspólny StandingsBoard na `/tabela` i homepage, zarówno kolumny podstawowe, jak i „Więcej kolumn”. To świadoma zmiana względem wcześniejszego planu pełnych nazw na telefonie.

## Zmiany

- `site/lib/format.ts`: formatTeamShortName tworzy rozpoznawalny skrót. BKP dla BeKaPaKa, istniejący akronim GMVT pozostaje; wieloczłonowe nazwy korzystają z pierwszych liter (MW, KAI, MODP), jednoczłonowe z pierwszych trzech (PAN, FAS, ATO, BRD).
- `site/components/public/shared/StandingsBoard.tsx`: osobne pełne i skrócone oznaczenia. Skrót jest dekoracyjny dla czytnika, pełna nazwa pozostaje w nagłówku wiersza i title. Region przewijania otrzymał fokus klawiatury i nazwę. Usunięto nieużywany stan form.
- `site/app/styles/digital.css`: poniżej 768 px kolumna drużyny ma 108 px, logo 24 px i tekst 16 px; podstawowe kolumny mieszczą się w szerokości kontenera. Rozszerzona tabela ma minimum 680 px zamiast 900 px. Usunięto transparentne dziedziczone tło przypiętej kolumny: teraz wszystkie jej komórki mają nieprzezroczyste tło z właściwą zebrą i wyróżnieniem BeKaPaKa. Dodano separator krawędzi. Desktop zachowuje pełne nazwy.
- `site/tests/team-short-name.test.ts`: dziewięć przypadków rozpoznawalnych identyfikatorów, polskich znaków, normalizacji odstępów i pustej nazwy.

Paleta, fonty, czerwone wyróżnienie własnego wiersza, dane i adresy pozostają z dotychczasowego systemu WWW. Tabela historii zawodnika i statystyki graczy nie korzystają z „Więcej kolumn” i nie zostały zmienione.

## Weryfikacja

- **118 testów w 18 plikach**, typecheck, lint i produkcyjny build Next.js 16.3.6: zaliczone.
- `/tabela`: 375 / 390 / 430 / 768 / 1440 px bez overflow strony. Podstawowa tabela na telefonie równa szerokości kontenera, kolumna drużyny 108 px. Od 768 px skróty ukryte, pełne nazwy widoczne.
- `/tabela` i homepage: po włączeniu „Więcej kolumn” przewinięto region klawiszami strzałek. Przypięta kolumna pozostała na lewej krawędzi kontenera przy scrollLeft 322–337 px. Tła wszystkich dziesięciu wierszy są nieprzezroczyste. Wizualnie potwierdzono brak nachodzenia danych.
- Drzewo dostępności na telefonie zachowuje pełne nazwy wszystkich drużyn i semantykę nagłówków wierszy. Przycisk zmienia etykietę i aria-expanded; powrót do podstawowych kolumn sprawdzony.
- Lokalny podgląd przebudowano i pozostawiono na porcie 3100. Bez deployu i zmian danych.

Dowody: [pomiary](brandbook-audit/polish/mobile-table/checks.json), [podstawowe kolumny](brandbook-audit/polish/mobile-table/main-390.png), [rozszerzone po przewinięciu](brandbook-audit/polish/mobile-table/preview-expanded-scrolled-390.png), [homepage po przewinięciu](brandbook-audit/polish/mobile-table/home-expanded-scrolled-390.png), [desktop](brandbook-audit/polish/mobile-table/main-1440.png).

Nie przeprowadzono nowego Lighthouse, pełnego skanowania dostępności ani ręcznych testów VoiceOver/TalkBack i Safari/Firefox. Dotykowe przewijanie pozostaje do odbioru na urządzeniu; w tej iteracji potwierdzono przewijanie klawiaturą w Chromium.
