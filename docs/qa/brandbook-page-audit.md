# BeKaPaKa 2.0 — porównanie strony po stronie

Audyt lokalnego buildu 5.10.2026. Źródła: CURRENT.md, brandbook główny 2.0 (zwłaszcza s. 7, 10, 14, 22–23, 29–32), brandbook WWW (s. 7–31) i referencyjne HTML/CSS w 06_www/system. Dane oraz zdjęcia pochodzą z istniejących źródeł klubu; treści przykładowe makiet nie są kopiowane.

Zrzuty przed poprawkami: `/tmp/bkpk-plan-audit/page-by-page/current/`, referencje: `/tmp/bkpk-plan-audit/page-by-page/reference/`. Desktop 1440×1000, telefon 390×844. Oglądano zapisane obrazy, nie tylko strukturę DOM.

| Widok | Wzorzec | Znaleziona rozbieżność przed korektą |
|---|---|---|
| Nagłówek i menu | WWW 14–15 | Znaki prawidłowe; wysokość o 1 px za duża. Hamburger poniżej 1100 px zgodny z uzgodnionym wyjątkiem. |
| `/` | WWW 19 | Bento już przywrócone. Karty aktualności i zawodników dziedziczą błędy z podstron. Odliczanie powoduje zmianę wysokości. |
| `/aktualnosci` | WWW 17, 21 | Wszystkie tagi udają kategorie i zajmują ekran telefonu; brak kickera, niewłaściwa skala wyróżnionego tytułu, data na zdjęciu, brak ścięcia i stopki karty. |
| Artykuł aktualności | WWW 22 | Układ 7/5 oraz 8/4 istnieje, ale brakuje bocznej czerwonej belki i ścięcia okładki; zagnieżdżone opakowanie okładki. Ogólny link zamiast przemyślanej kolumny bocznej. |
| Galeria w artykule | WWW 23 | Siatka 3/2 i lightbox działają; brak wyróżnienia pierwszego zdjęcia 2×2. Metadane wymagają potwierdzenia przez klub. |
| `/mecze`, wyniki | WWW 20 | Wiersze już przywrócone. Należy usunąć pochylenie dat odziedziczone ze starej klasy oraz stosować konsekwentne etykiety sezonu. |
| Szczegóły meczu | WWW 18, 20 | Sportowe dane w szablonie papierowego artykułu; ciemny tekst wyniku na czarnym panelu — wynik niewidoczny. |
| `/tabela` | WWW 20 | Semantyka kolumn poprawna, własny wiersz czerwony, lecz błędy polskich znaków i brak etykiety ligi. Kolumna drużyny wymaga nagłówka wiersza. |
| `/sklad` | WWW 24 | Rozbieżne nazwy klas CSS i JSX: sklejone nazwiska/pozycje, ogromny monogram, mały numer, brak podpisu na zdjęciu. Dla części rekordów API zamieniło imię i nazwisko. |
| `/sklad/[id]`, drawer | WWW 24 | Papierowy szablon artykułu, dwukrotny tytuł, mały portret, brak kompozycji 5/7 i numeru za portretem. Statystyki bez występów udają rzeczywiste zera. |
| `/sponsorzy` | WWW 25 | Plakietki bez ścięcia; nazwa powielona, długa nazwa ucięta, niespójne odstępy. Brak wyśrodkowanego nagłówka. Poziomy pozostają wyłączone zgodnie z planem. |
| `/klub`, `/o-klubie` | WWW 6, 13, 26 | Długi tekst na płycie zamiast papieru; brak rytmu czytania. Treści i wsparcie należy zachować. |
| `/dokumenty`, szczegóły | WWW 13, 28 | Tekst na płycie, brak polskich znaków, dwa komunikaty pustego stanu, komunikaty techniczne dla administratora w publicznym UI. Brak opublikowanych dokumentów — nie tworzymy fikcyjnych plików do podglądu. |
| `/wydarzenia` i szczegóły | istniejące trasy + WWW 22 | Listing zachowuje istniejące przekierowanie do `/mecze`. Szczegóły używają szablonu editorial. Nie usuwamy istniejących przekierowań. |
| 404 | WWW 28 | Brak konturowego kodu, drugiego wyjścia, kontenera i polskich znaków. |
| Loading / błąd / offline | WWW 28–30 | Loading i offline istnieją; ogólny komunikat pusty dubluje docelowy, błędy zawierają nazwy endpointów. |
| Stopka | WWW 26 | Znak właściwy; CTA wsparcia drugorzędne zamiast czerwonego, skrócony opis klubu. Nie kopiować przykładowego adresu/e-maila ani KRS fundacji jako KRS stowarzyszenia. |

## Stan po korekcie i analizie kolejnych zmian

Kontynuowano pracę z aktualnego checkoutu, zachowując dodane stroje, nowe sekcje wsparcia i stopkę. Przywrócono brakujące elementy planu i poprawiono regresje opisane w [raporcie refaktoryzacji](bekapaka-2.0.md). Źródłem układów pozostaje **BeKaPaKa_Brandbook_2.0_WWW.pdf**, nie tylko tom główny.

Zrzuty po zmianach: [homepage desktop](brandbook-audit/current/home-1440.jpg), [homepage telefon](brandbook-audit/current/home-390.jpg), [tabela](brandbook-audit/current/tabela-390.jpg), [skład](brandbook-audit/current/sklad-1440.jpg), [artykuł](brandbook-audit/current/article-1440.jpg). Zapisano też wszystkie 20 profili i osiem artykułów; referencyjne ekrany HTML znajdują się w `brandbook-audit/reference/`. Dawne zrzuty w `/tmp` są historią, nie aktualnym stanem podglądu.

Ocena: usunięto wskazane błędy układów i funkcji; pełny odbiór marki pozostaje warunkowy ze względu na tymczasową fotografię, niepotwierdzone metadane, niezrealizowany budżet mobilnego LCP/JS i brak ręcznego odbioru Safari/Firefox oraz czytników ekranu. Nie jest to certyfikacja WCAG.
