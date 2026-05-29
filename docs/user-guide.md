# Instrukcja dla trenera

## Dodawanie raportu z meczu
1. Wejdź w `Dashboard`.
2. Kliknij `Dodaj nowy raport`.
3. Wklej protokół w formacie Markdown lub JSON.
4. Kliknij `Parsuj` i sprawdź podgląd.
5. Po akceptacji zapisz (kolejny krok w wersji produkcyjnej).

## Game Center
- Wybierz `Game Center` i kliknij `Szczegóły` przy meczu.
- Zobaczysz boxscore, punkty w czasie, runy i statystyki zespołowe.

## Roster
- Lista zawodników zawiera PPG/RPG/APG i wskaźniki eFG/TS.
- Kliknij zawodnika, aby zobaczyć profil i Game Log.

## Trends
- Sprawdź trendy TO%, 3P%, FT% oraz lead chart.
- Heatmapa pokazuje obecność na treningach.

## Strategy Room
- Dodawaj notatki taktyczne.
- Priorytety treningowe generują się automatycznie z danych.
- Taguj kontekst meczu (back-to-back, turniej itd.).

## Aktualizacja danych z ligi (admin)
1. Wejdź w **Administracja**.
2. Kliknij **Uruchom pełny import danych** (pobiera tabelę, terminarz i statystyki z kalk-koszalin.com).
3. Poczekaj na zakończenie (ok. kilka–kilkanaście minut) — status i logi są widoczne na tej samej stronie.

Technicznie: scraping przez [Scrapling](https://github.com/D4Vinci/Scrapling) — opis w [scraping.md](./scraping.md).
