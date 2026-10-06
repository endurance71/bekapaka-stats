# BeKaPaKa 2.0 — dopracowanie wizualne, 5.10.2026

Podgląd: http://127.0.0.1:3100/ — produkcyjny build lokalny ze zdjęciami. Bez deployu i zmian w danych CMS/API.

## Analiza i wykonane zmiany

1. **Strefa sportowa:** wcześniej tabela rozciągała puste tło do wysokości czterech kart zawodników, a stroje tworzyły osobny blok poniżej. Teraz tabela i stroje zajmują lewą kolumnę 7/12, zawodnicy prawą 5/12. Na telefonie kolejność pozostaje tabela → czterech zawodników → stroje. Tabela zachowuje własne przewijanie. Pliki: `MegaHomeTemplate.tsx`, `digital.css`.
2. **Stroje A/B:** płaskie ciemne tło zamiast dodatkowych radialnych gradientów; spójne kadry bez modyfikacji zdjęć. Przyciski mają 44 px wysokości i czytelne etykiety; nagłówki mieszczą się w jednym wierszu również przy 375 px. Zdjęcie jest natywnym przyciskiem, obsługującym klawiaturę, z etykietą aktualnej akcji. Pliki: `JerseyShowcase.tsx`, `digital.css`.
3. **Partnerzy:** siatka 2/4/7, pełna szerokość kontenera i zachowanie wszystkich 14 pozycji pojedynczo. Naprawiono przycinanie pionowych znaków przez automatyczny rozmiar ścieżki grid i starą regułę obrazu. Znaki mieszczą się w ramie z `object-fit:contain`; konfiguracja CMS skali i paddingu pozostaje. Brak logo nadal daje pełną nazwę. Plik: `digital.css`.
4. **Aktualności:** zajawki zwykłych kart ograniczone wizualnie do trzech linii, bez skracania tytułów lub danych źródłowych. Wyróżniona karta zachowuje pełną zajawkę. Data i strzałka mają subtelny separator, co wyrównuje rytm dolnej części kart. Plik: `digital.css`.

## Zgodność ze źródłem marki

Punktem odniesienia pozostaje brandbook **WWW**, zwłaszcza s. 7–10, 17, 21, 24 i 25. Zachowano płyta/papier, Barlow, czerwone CTA, ścięcia i logo 2.0. Stroje są uzupełnieniem istniejącej sekcji sportowej; ich fotografie pozostają oryginalne. Poziomy partnerów nie są publikowane bez zatwierdzenia. Zmieniono reguły odpowiedzialnych komponentów, bez kolejnej warstwy globalnych nadpisań.

## Weryfikacja

- 97 testów w 15 plikach — zaliczone; typecheck i lint — zaliczone; końcowy build produkcyjny — zaliczony.
- Homepage: 375/390/430/768/820/1024/1280/1440/1920 px; cztery karty, brak przewijania całej strony w poziomie, przyciski strojów minimum 44×44 px.
- Aktualności, skład i partnerzy: 390/1440 px; jeden H1 i brak poziomego wyjścia.
- Strój A: kliknięcie pokazuje tył, Enter na zdjęciu przywraca przód; potwierdzono zmianę rzeczywistego źródła obrazu.
- Obejrzano zapisane zrzuty układu sportowego, partnerów desktop i zestaw podstron mobile. Zrzuty, odczyty DOM i porównanie przed/po: `brandbook-audit/polish/`.

## Pozostałe zadania

Nowa zatwierdzona sesja portretowa poprawi spójność składu: obecne czerwone tła i stare znaki na strojach pochodzą z istniejących zdjęć. Nie retuszowano zawodników. Zgody i metadane zdjęć pozostają bramką przyszłej publikacji.

W tej iteracji nie powtarzano Lighthouse ani pełnego odbioru dostępności; wcześniejsze wyniki i niespełnione budżety mobilnego LCP/JS pozostają opisane w `bekapaka-2.0.md`. Do odbioru pozostają również Safari/Firefox, czytniki ekranu i integracja CMS/bazy. Niniejszy etap nie oznacza ukończenia całego planu 2.0.
