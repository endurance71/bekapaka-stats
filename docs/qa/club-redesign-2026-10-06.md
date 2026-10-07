# „O klubie” — przebudowa lokalna, 6.10.2026

Strona `/klub` otrzymała pełny układ zgodny z aktualnym kierunkiem marki: ekspozycję znaku głównego 2.0 i wordmarku, opis stowarzyszenia, skrót informacji, trzy obszary działalności, wartości oraz wsparcie i kontakt.

## Zmiany i pliki

- `site/app/klub/page.tsx`: nowy hero, sekcje Drużyna / Społeczność / Wydarzenia, lista faktów i wartości, kontakt z konfiguracji, linki do składu, meczów, partnerów, relacji i dokumentów. Unikalne metadata i canonical `/klub`.
- `site/app/styles/digital.css`: zastąpiono stare reguły wąskiej strony klubu stylami sekcji, siatek i ekspozycji identyfikacji. Usunięto nieużywane reguły `.club-page section/p`. Przycisk i linki mają wysokość co najmniej 44 px, adres e-mail może się łamać, kotwice uwzględniają nagłówek.
- `site/public/brand/wzor-paski.svg`: niezmieniona kopia `BeKaPaKa - brand/06_www/system/assets/wzor-paski.svg`.

Wykorzystano istniejące `herb2-kolor.svg` i `wordmark-negatyw.svg`. Wspólne komponenty Section oraz FsmmSupportSection pozostają źródłem sekcji i obsługi wsparcia. Zachowano `/o-klubie` → `/klub`, dokumenty, istniejący kontakt i dane przelewu. KRS programu FSMM nadal jest opisany jako KRS fundacji. Nie dodano niepotwierdzonej daty założenia, historii, sekcji młodzieżowej ani nowych danych kontaktowych.

## Źródła marki

Przeczytano nadrzędny `CURRENT.md`, brief, README systemu WWW oraz oba brandbooki. Szczególnie:

- Brandbook WWW, s. 6, 13, 14 i 35: rytm płyta/papier, płaskie powierzchnie, znaki główne 2.0, czerwone CTA, ścięcia i paski w separatorach.
- Brandbook 2.0, s. 4 i 27: fakty i ton klubu oraz istniejące desenie.

Wzór pasków występuje tylko w wydzielonej ekspozycji znaku; opis klubu nie leży na deseniu. Złoto pozostaje w znaku, a treści korzystają z istniejącej typografii Barlow / Barlow Condensed. Formalnego herbu stowarzyszenia nie użyto w UI. Zmiany pozostają lokalne.

## Weryfikacja

- **109 testów w 17 plikach**, typecheck i lint: zaliczone.
- Produkcyjny build Next.js 16.3.6 z konfiguracją lokalnego podglądu: zaliczony. Serwer działa na `http://127.0.0.1:3100`.
- Przeglądarka: szerokości **375 / 390 / 768 / 1024 / 1440 / 1920 px**, brak poziomego overflow. Wizualnie sprawdzono pełny desktop oraz mobilny i tabletowy początek strony.
- Jeden H1, sekcje z nagłówkami, listy definicji dla faktów i wartości, opisy alternatywne znaków. Oba SVG ładowane poprawnie przy wszystkich badanych szerokościach. Wszystkie linki wewnątrz strony mają co najmniej 44 px wysokości.
- „Co robimy” prowadzi do `#dzialalnosc`; pozostaje kotwica `#wsparcie`.
- Kod QR otwiera się i jest załadowany; Esc zamyka modal, fokus wraca na „Pokaż kod QR do przelewu”.
- Nawigacja do `/o-klubie` kończy się na `/klub`.

Dowody: [pomiary responsywne](brandbook-audit/polish/club-redesign/checks.json), [interakcje](brandbook-audit/polish/club-redesign/interactions.json), [desktop](brandbook-audit/polish/club-redesign/after-1440.png), [mobile](brandbook-audit/polish/club-redesign/after-390.png), [tablet](brandbook-audit/polish/club-redesign/after-768.png), [QR](brandbook-audit/polish/club-redesign/qr-open-1440.png). Zrzut sprzed zmian: `brandbook-audit/polish/club-redesign/before-1440.png`. Obrazy źródłowych stron PDF zapisano w tym samym katalogu.

## Granice odbioru

Ta iteracja nie obejmowała nowego Lighthouse, pełnego audytu WCAG, VoiceOver/TalkBack ani Safari/Firefox. Kontaktu docelowego i danych historycznych nie wymyślano; można je rozszerzyć po otrzymaniu potwierdzonych materiałów od klubu. Nie wykonano deployu ani zmian na VPS/CMS.
