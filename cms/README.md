# BeKaPaKa CMS (Strapi)

Ten katalog przechowuje definicje modeli treści oraz dane robocze Strapi.

## Kolekcje treści

- `news-posts` — aktualności z miniaturą i datą publikacji
- `events` — mecze, turnieje i wydarzenia klubowe
- `sponsors` — sponsorzy (nazwa, logo, strona WWW, kolejność)
- `documents` — regulaminy i pliki do pobrania
- `homepage-sections` — konfigurowalne sekcje strony głównej

## Role

- `admin` — pełen dostęp do konfiguracji i publikacji
- `editor` — dodawanie i edycja treści bez zmian konfiguracyjnych

## Uwaga wdrożeniowa

Przy pierwszym uruchomieniu kontenera `bkpk-cms` Strapi stworzy pliki runtime i bazę SQLite w `cms/data/`.
