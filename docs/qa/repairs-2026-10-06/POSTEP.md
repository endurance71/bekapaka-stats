# Naprawy lokalnej BeKaPaKa 2.0

Punkt wyjścia: `1d95db8`, gałąź `codex/2.0`. Poprzedni odbiór: 5 zamkniętych, 20 częściowych, 9 otwartych. Te statusy są historyczną bazą; poniższe zmiany wymagają nowego odbioru.

## Etap 1 — dane meczów

Zaimplementowano zachowanie brak danych ≠ zero, kompletne sumy, rzeczywisty czas z minut graczy, podstawowe kolumny box score, nagłówki wierszy, komunikaty sześciu statusów, ponowienie błędu strony meczu, wspólny logotyp rywala, uczciwe wyszukiwanie hali, opcjonalne metadane tabeli i kontekst sezonu profilu/składu. Profil pokazuje trafienia/próby i nie powiela trzech średnich.

API `/api/league/table?includeMeta=1` zwraca `{data,meta}`. Bez parametru nadal tablica. Data aktualizacji pochodzi z zapisanych wierszy. Pola sezonu i statystyk profilu są opcjonalne; nie ma migracji danych sezonu. Numer meczowy pochodzi z protokołu, a fallback numeru klubowego jest opisany na profilu.

Testy strony i jednostkowe backendu przechodzą; geometria mobilna i integracja usług pozostają do odbioru końcowego. Nie zmieniono produkcji.

## Etap 2 — artykuły i treści

Jawny imageFit oraz lokalne przypisania istniejących plakatów zastępują zgadywanie po temacie artykułu. Okładka ma powiększenie i odnośnik do oryginału. Galeria korzysta z metadanych CMS i oznacza ich brak w lokalnym podglądzie; zachowuje filtr zatwierdzonych mediów. Lightbox ma wspólne ikony i stany pobierania/błędu. Spis treści obejmuje nagłówki i bloki semantyczne, a rozmiary miniatur odpowiadają wariantom siatki.

Archiwalność pochodzi z eventDate lub jawnie zweryfikowanej lokalnej daty treningu. CMS ma opcjonalne imageFit/eventDate. Nie zapisano treści do CMS. Oferta współpracy jest neutralna i używa siteSettings.contactEmail. Klub pokazuje odnośniki do opublikowanych relacji zamiast sekcji ogólnych wartości. Nie dodano wymyślonego zdjęcia/historii/autorów.

151 testów strony przechodzi. Pozostałe zależności redakcyjne: zatwierdzony kontakt, aktywny skład/pozycje, numer Sosińskiego, metadane i zgody zdjęć, zdjęcie życia klubu i historia ze źródłami.

## Etap 3 — homepage, wsparcie i wzorce

Homepage pokazuje skrócone aktualności, 5 wierszy tabeli wokół BeKaPaKa i 4 liderów. Pełne widoki pozostają pod odnośnikami. Usunięto powielony blok stroju i dużą kartę prowadzącą do klubu. Wszyscy partnerzy pozostają w kompaktowej siatce. Wsparcie używa jednego komponentu; kopiowanie poprzedza QR, ma trwały status i ręczny fallback. Stopka jest krótsza, menu ma nazwę organizacji i obsługuje małą wysokość ekranu.

Scalono reguły okładki, breadcrumbs i bazowej sekcji, usunięto martwy wariant darowizny, lightbox używa wspólnych ikon i blokady scrolla. Nie uznajemy tego za pełną redukcję całego historycznego arkusza CSS. Podczas odbioru skorygowano mapowanie rzeczywistych slugów: `iii-…` jest zapowiedzią z plakatem, `3-…` relacją. Data aktualizacji tabeli pozostaje nieznana, gdy źródło jej nie podaje.

Testy strony: 151/151. Izolowany CMS: szkic ukryty, publikacja, wycofanie i opcjonalne imageFit/eventDate potwierdzone. Izolowany PostgreSQL: 109 testów backendu oraz zapis prezentacji przez API, autoryzacja, trwałość zera, publiczny odczyt i rzeczywista rewalidacja HTTP potwierdzone. Odbiór geometrii i raport końcowy w etapie 4.

## Etap 4 — odbiór i dowody

Wszystkie 275 testów przechodzą: strona 151, backend 109, panel 6, CMS 9. Typecheck i lint strony bez błędów; buildy strony/panelu/CMS poprawne. Integracje backendu i CMS wykonano na osobnych lokalnych bazach. Testowy PostgreSQL zatrzymano po sprawdzeniach; nie użyto produkcyjnej bazy ani zapisu do zdalnego CMS.

72 pomiary geometrii nie wykazały overflow strony. Homepage skrócono o 21,7% (390 px) i 25,7% (1440 px), stopkę na telefonie o około 28%. Galeria i menu mają potwierdzony powrót fokusu, pułapkę Tab i blokadę scrolla; awaria zdjęcia i ponowienie pobrania zostały zasymulowane. Zaplanowany mecz nie tworzy zer/tabeli. Kolumna MIN ma osobną szerokość, aby suma 200:00 nie zlewała się z punktami.

Lighthouse ujawnił jeszcze pominięcie poziomu nagłówków i CLS 0,272 w szczegółach meczu. Poprawiono hierarchię i osobny viewportowy ekran ładowania; porównanie pomiarów zachowano w plikach JSON. Raport końcowy `RAPORT-NAPRAW.md` zawiera bieżące wyniki, macierz 34 kryteriów i jawnie niezweryfikowane cele. Nie wykonano deployu/pushu/VPS.
