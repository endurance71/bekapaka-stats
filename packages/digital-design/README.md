# BeKaPaKa Digital 2.0

Wersjonowana kopia zatwierdzonego źródła z sąsiedniego projektu `BeKaPaKa - brand/06_www/system`. Nadrzędne decyzje: `CURRENT.source.md`.

Generowanie: `python3 packages/digital-design/build_tokens.py` (uruchom w folderze pakietu). Nie edytuj `dist/tokens.css` ręcznie. Warstwy: wartości → role semantyczne płyta/papier → komponenty w `site/app/styles/digital.css`.

Publiczna strona (`site/`) i panel (`frontend/`) importują wyłącznie ten pakiet (`dist/tokens.css`); poprzedni `packages/design-tokens` (1.0, złoto) usunięto. Źródłowy arkusz referencyjny jest zachowany do porównań, nie jest importowany do aplikacji.

Fonty pochodzą z `02_system/fonts`, mają licencję SIL OFL. Lokalny podzbiór WOFF2 obejmuje polski alfabet, Latin Extended i podstawową interpunkcję. TTF Condensed służy wyłącznie generowaniu OG po stronie serwera.
