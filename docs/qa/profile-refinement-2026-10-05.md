# BeKaPaKa 2.0 — skład i profile, kolejna iteracja 5.10.2026

Podgląd: http://127.0.0.1:3100/sklad. Wyłącznie zmiany lokalne; bez deployu i zmian w bazach/CMS.

## 1. Skład — poprawiona czytelność

Nazwisko na karcie zależy teraz od szerokości samej karty, z granicami 22–32 px. Wcześniej wielkość zależała od viewportu i stałego mobilnego nadpisania, co źle obsługiwało długie nazwiska. Zachowano portrety 4:5, numer za zdjęciem, monogram przy braku portretu i bezpośrednie otwieranie profilu. Ta sama karta działa na homepage.

Kontrola: wszystkie 20 kart przy 375/390/430/768/820/1024/1280/1440/1920 px, bez poziomego wyjścia i bez uciętych nazwisk. Na homepage przy 375 px cztery karty również bez ucięcia. Źródło: brandbook WWW s. 24.

Zrzuty: `brandbook-audit/polish/refine-profiles/01-before-roster-390.png`, `06-after-roster-390.png`.

## 2. Profil — poprawione proporcje

Zrzut przed zmianą potwierdził na desktopie podział „Kaszubows / ki”. Maksymalna wielkość nazwiska to teraz 80 px, z dopasowaniem do ekranu i bez łamania słowa w dowolnym miejscu. Dla obecnych danych nazwiska mieszczą się. Zdjęcie nadal jest pierwsze na telefonie; desktop zachowuje układ hero 5/7 i oryginalne zdjęcia.

Szczegółowe statystyki i skuteczność rzutowa tworzą dwie kolumny na desktopie. Telefon zachowuje kolejność sekcji. Usunięto czerwone belki z każdego pojedynczego pola statystyki; pozostały spokojniejsze separatory i właściwe akcenty danych. Powrót do składu ma cel 44 px.

Kontrola: 20 profili przy 375 px — poprawny H1, brak poziomego wyjścia i brak ucięcia nazwiska; profil Tomasza również obejrzany przy 1440 px. Przykłady z prawdziwym portretem, numerem bez zdjęcia i portretem #24 zapisano w folderze tej iteracji.

Zrzuty: `02-before-profile-390.png`, `03-before-profile-1440.png`, `04-after-profile-1440.png`, `05-after-profile-390.png`.

## 3. Historia i brak danych — poprawiona prezentacja

Historia pokazuje datę „4 paź 2026” zamiast łamiącego się ISO. Kolumna rywala pozostaje przyklejona podczas przewijania. Dane liczbowe są wyrównane do prawej; dodano nazwę tabeli dla czytników, nagłówki wierszy, fokusowalny region przewijania i widoczną instrukcję na telefonie.

Brak skuteczności po rozegranym meczu pokazuje kreskę, zamiast „—%”. Przed pierwszym występem nie pokazuje się wypełniony pasek ze starych danych. Rzeczywiste 0% pozostaje wartością 0%.

Kontrola klawiaturą: ArrowRight przesunął tabelę o 182,5 px, a kolumna rywala zachowała x=16 px. Trzy nowe testy sprawdzają brak versus rzeczywiste zero, stare procenty bez występu i semantykę historii z czytelną datą.

## Pliki i weryfikacja

- `site/components/public/shared/PlayerProfile.tsx`
- `site/app/styles/digital.css` — zmieniono reguły odpowiedzialnych komponentów.
- `site/tests/player-profile.test.tsx`

**100 testów / 16 plików, typecheck, lint i build produkcyjny — zaliczone.** Zrzuty faktycznie obejrzano po zapisaniu. Odczyty DOM są w `responsive-roster.json` i `profiles-375.json` w folderze iteracji.

## Pozostałe ograniczenia

Nie wykonano w tej iteracji Lighthouse, Safari/Firefox ani VoiceOver/TalkBack. Odczyt DOM i kontrola klawiaturą nie oznaczają pełnego odbioru dostępności. Zdjęcia zachowują oryginalne czerwone tła/stare stroje; do nowej sesji i zatwierdzenia metadanych nie zmieniono ludzi ani fotografii. Pozostałe zadania planu 2.0, w tym mobilny LCP/JS i integracje CMS/bazy, pozostają w `bekapaka-2.0.md`.
