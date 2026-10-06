# Naprawy lokalnej BeKaPaKa 2.0

Punkt wyjścia: `1d95db8`, gałąź `codex/2.0`. Poprzedni odbiór: 5 zamkniętych, 20 częściowych, 9 otwartych. Te statusy są historyczną bazą; poniższe zmiany wymagają nowego odbioru.

## Etap 1 — dane meczów

Zaimplementowano zachowanie brak danych ≠ zero, kompletne sumy, rzeczywisty czas z minut graczy, podstawowe kolumny box score, nagłówki wierszy, komunikaty sześciu statusów, ponowienie błędu strony meczu, wspólny logotyp rywala, uczciwe wyszukiwanie hali, opcjonalne metadane tabeli i kontekst sezonu profilu/składu. Profil pokazuje trafienia/próby i nie powiela trzech średnich.

API `/api/league/table?includeMeta=1` zwraca `{data,meta}`. Bez parametru nadal tablica. Data aktualizacji pochodzi z zapisanych wierszy. Pola sezonu i statystyk profilu są opcjonalne; nie ma migracji danych sezonu. Numer meczowy pochodzi z protokołu, a fallback numeru klubowego jest opisany na profilu.

Testy strony i jednostkowe backendu przechodzą; geometria mobilna i integracja usług pozostają do odbioru końcowego. Nie zmieniono produkcji.
