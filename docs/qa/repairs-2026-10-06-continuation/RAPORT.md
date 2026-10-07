# Kontynuacja napraw lokalnych 2.0 — 6 października 2026

Weryfikowana wersja kodu: `c535f4c`, gałąź `codex/2.0`. Punkt odniesienia: [poprzedni raport](../repairs-2026-10-06/RAPORT-NAPRAW.md), wersja kodu `035cff5`, commit raportu `06e5904`. Praca lokalna; bez pushu, deployu ani zmian w zdalnym CMS.

## Wykonane naprawy

W mapperze kadry `null`, puste ciągi i błędne wartości nie zamieniają się już w zera. Poprawne liczby, także zapisane jako tekst z przecinkiem dziesiętnym, pozostają dostępne. Liczniki celnych rzutów/prób korzystają z tej samej normalizacji. Zero pozostaje zerem.

Profil zawodnika pokazuje „—” i komunikat o niepotwierdzonej liczbie występów, gdy jej nie podano. Komunikat o pierwszym występie pojawia się tylko przy zapisanej liczbie zero. Numer koszulki przekazany jako liczba jest oznaczany jako pochodzący ze źródła. Brak numeru bez znanego odpowiednika w materiałach klubu ma status nieznany.

Test integracyjny API używa teraz unikalnych identyfikatorów i obejmuje sprzątaniem także etap tworzenia danych. Sprawdzono metadane pustej tabeli, tabeli z zapisanym wierszem oraz publicznej kadry. Data aktualizacji tabeli pochodzi z zapisanego `updatedAt`, a nie z chwili zapytania.

## Wyniki weryfikacji

- 154 testy strony w 24 plikach: zaliczone (poprzednio 151). Trzy nowe przypadki obejmują rzeczywisty mapper API oraz render profilu.
- TypeScript i lint: zaliczone.
- Produkcyjny build strony i uruchomienie podglądu na 127.0.0.1:3100: zaliczone.
- Rzeczywiste API na odrębnej bazie PostgreSQL 127.0.0.1:54491/bkpk_repair: odrzucenie zapisu bez sesji 401, bez roli administratora 403, zapis administratora 200, zachowanie zera, odczyt publiczny i HTTP rewalidacji Next.js zaliczone.
- API zachowuje starszy format tablicy i udostępnia metadane sezonu/dywizji na żądanie. Zweryfikowano dokładny timestamp zapisanego wiersza, etykietę sezonu w kadrze i brak hasła w publicznym rekordzie.
- Po teście: 0 zawodników, 0 meczów, 0 wierszy tabeli; pozostaje wyłącznie systemowy sezon utworzony przez inicjalizację. Baza testowa została zatrzymana.
- Podgląd mobilny rzeczywistego profilu Filipa Karpińskiego: szerokość dokumentu i viewportu po 390 px, bez przewijania całej strony w poziomie. Rzuty 13/15 dają 86,7%, a 0/0 nie daje pozornej skuteczności. [Zrzut](profile-mobile.png).

Logi: [testy strony](site-tests.txt), [TypeScript](site-typecheck.txt), [lint](site-lint.txt), [build i podgląd](site-preview-build.txt), [API](backend-integration.txt).

## Porównanie z poprzednim odbiorem

UI17 ma dodatkowy dowód poprawności metadanych sezonu w nowym backendzie i ochronę przed fałszywymi zerami w mapperze. UI14 ma dodatkowy dowód pochodzenia daty aktualizacji i dywizji z bazy. Oba kryteria pozostają częściowe: przeglądarkowy podgląd nadal korzysta z publicznego starszego backendu, który nie przekazuje sezonu. Nie wykonano pełnego testu strony podłączonej do nowego lokalnego backendu.

Macierz odbioru pozostaje **21 zamkniętych, 12 częściowych, 1 otwarte**. Nie nadano zatwierdzeń kontaktowi, numerom kadry, metadanym/zgodom zdjęć ani adresom hal. W tej kontynuacji nie powtarzano benchmarków Lighthouse, całej macierzy responsywnej ani testów pozostałych aplikacji; ich wyniki pozostają historycznymi dowodami poprzedniego odbioru. Safari, Firefox, VoiceOver i zoom 200% nadal wymagają osobnej weryfikacji.

## Odtworzenie testu API

Wymagany jest podgląd strony uruchomiony z `SITE_REVALIDATE_SECRET=repair-local-revalidation-only` oraz wcześniej przygotowana testowa baza z migracjami. Wartości sekretów w tym scenariuszu są wyłącznie testowe.

```sh
pg_ctl -D /tmp/bkpk-repair-pg-20261006 -l /tmp/bkpk-repair-pg-20261006.log -o '-h 127.0.0.1 -p 54491' start
DATABASE_URL=postgresql://bkpk_repair@127.0.0.1:54491/bkpk_repair REPAIR_TEST_DATABASE_URL=postgresql://bkpk_repair@127.0.0.1:54491/bkpk_repair node backend/tests/integration/repair-local.mjs
pg_ctl -D /tmp/bkpk-repair-pg-20261006 stop
```

Skrypt odmawia pracy poza wskazanym adresem bazy. Nie używa danych produkcyjnych.
