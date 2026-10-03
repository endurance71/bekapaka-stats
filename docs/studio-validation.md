# Studio — raport lokalnej weryfikacji (03.10.2026)

Sprawdzenia wykonano w odizolowanym PostgreSQL na localhost:55432, bez danych i sekretów produkcji. Lokalny system: macOS / Node 22 / PostgreSQL 14 / Python 3.13. CI jest skonfigurowane do PostgreSQL 15.

| Obszar | Wynik |
|---|---|
| Backend z integracją PostgreSQL | 83 testy zaliczonych (45 istniejących + 38 Studio) |
| Studio: daty Warszawa, DST, wybór sezonu | 7 testów zaliczonych |
| Renderer | 7 testów zaliczonych: 74 kombinacje rodzin/wariantów/formatów, dodatkowe układy i strój B, zdjęcie/kadr, paginacja, błędy długiego tekstu, czytelność miejsca oraz osobna kompozycja relacji |
| Pakiet marki | SHA256 zgodne dla 96 importowanych plików |
| TypeScript i build Vite | Zaliczony |
| Migracje i zgodność schematu | Addytywne migracje zastosowane lokalnie; Prisma diff nie wykrywa różnic |
| PNG i ZIP | Rzeczywiste renderowanie, profil ICC sRGB, autoryzowany odczyt PNG i ZIP; eksport powiązany z rewizją i manifestem |
| Dostęp | Obce konto, brak sesji i CSRF odrzucane; logout unieważnia sesję |
| AI | Rezerwacje równoległe nie przekraczają budżetu; timeout/odmowa/429/zła odpowiedź nie są ponawiane; metadane poprawnej odpowiedzi rozliczane |
| Trwała kolejka | Dziedziczenie blokad, dzierżawa, zastępowanie podglądów, odzyskanie renderu i zatrzymanie niepewnego AI |
| Przeglądarka | Chromium: logowanie → projekt → zapis → podgląd → zatwierdzenie → ZIP, także viewport 390×844; bez błędów JS i przepełnienia poziomego |
| Autosave | Przycinanie białych znaków nie powoduje pętli kolejnych rewizji |
| Nakładki social | Chromium: Instagram/Facebook dla relacji i posta, strefy bezpieczne, pełny ekran i Escape; widok 390×844 bez przepełnienia poziomego. Zmiana nakładki zachowuje adres i plik PNG, nie kolejkuje renderowania |
| Pliki | HEIC zdekodowany na macOS; przezroczystość PNG zachowana |
| Odtworzenie | Dump przywrócony do osobnej lokalnej bazy; ponowny render daje identyczne SHA256 PNG |
| Kontenery i skrypty | Dockerfile, profil Compose, pipeline CI, health check, systemd backup i skrypty wdrożenia przygotowane; Compose config oraz składnia skryptów shell poprawne |

Nie wykonano lokalnego buildu Docker — demon Docker nie był dostępny. Test kontenerów jest skonfigurowany w CI. Nie wykonano operacji na VPS, zmian DNS/Caddy ani produkcyjnego deployu. Brakuje ustalonego ID właściciela, osobnego klucza Gemini i tokenu CMS. Rzeczywiste odpowiedzi Gemini oraz jego rachunek pozostają do pilotażu z kluczem Studio.

Przed odbiorem produkcji wymagane są: decyzja właściciela o szablonach/partnerach i prawach do prawdziwych zdjęć, dziewięć rzeczywistych materiałów ocenionych razem w feedzie, fizyczny Safari iOS / Chrome Android, HEIC na Linuxie w kontenerze, test udostępniania systemowego, pomiar RAM oraz odtworzenie kopii na VPS. W testach zatwierdzano wyłącznie izolowane projekty w bazie testowej; szablony i partnerzy produkcyjni startują jako robocze.

Audyt nowych zależności: użyto Sharp 0.35.5 z poprawkami wcześniejszych podatności; zależności Studio nie mają zgłoszonych podatności. Istniejące zależności backendu nadal raportują cztery problemy wysokie w drzewie Prisma; nie wykonywano migracji całego backendu na nową główną wersję Prisma w ramach Studio.
