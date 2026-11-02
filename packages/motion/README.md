# Wzory filmów BeKaPaKa (`packages/motion`)

Pięć wzorów zapowiedzi meczu jako krótkie filmy 9:16 (1080×1920, 30 kl./s, bez dźwięku) na Remotion 4.0.534.
Właściciel zaakceptował wszystkie 2026-11-02 na meczu z Grubik Team. Film opowiada historię meczu w cięciach
i kończy się grafiką zapowiedzi ze Studio, więc typografia planszy końcowej jest ta sama co w publikacji.

| Wzór | Pomysł | Wymagane dane | Długość |
|---|---|---|---|
| `A-Wracamy` | hak „WRACAMY” na skrzydłach V → starcie → bilans z rywalem → puenta → godzina → plakat | `headline`; `comeback` i `h2h` opcjonalnie | ok. 9–11 s |
| `B-Rewanz` | tablica wyników kręci się i staje na złotym „?:?” → „TERAZ NASZA KOLEJ” → starcie → godzina → plakat | `rematch` | 8,1 s |
| `C-Forma` | sezon w liczbach: mecze i wygrane, punkty, lider, niepokonani → starcie → plakat | `season.scores`; `leader`, `unbeaten` opcjonalnie | ok. 7–11 s |
| `D-Tablica` | tablica trenera: boisko rysuje się samo, akcja i podanie → koło środkowe → linia boczna → plakat | tylko podstawa | 8,7 s |
| `E-Redakcyjnie` | papier: data w obrysie → paski z nazwami → godzina i pieczątka „WSTĘP WOLNY” → plakat redakcyjny | tylko podstawa | 8,2 s |

Podstawa każdego meczu: `posterId`, `opponent`, `opponentShort`, `kickoff` (ISO ze strefą), `venue`, `entry`, `round`.

## Jak zrobić film

```bash
cd packages/motion
npm install
npm run prepare-match -- data/grubik-2026-11-07.json   # zasoby marki + grafika Studio + części do animacji
npm run render -- data/grubik-2026-11-07.json          # wszystkie wzory, dla których są dane
npm run render -- data/grubik-2026-11-07.json B-Rewanz # jeden wzór
npm run studio                                          # podgląd i strojenie w Remotion Studio
```

Wynik: `out/<posterId>/<wzór>.mp4`. Katalogi `public/` i `out/` nie trafiają do Git.

`prepare-match` potrzebuje backendu Studio: Pythona z `backend/studio/.venv` (albo `STUDIO_PYTHON`) i
`backend/node_modules` (zod, sharp). W worktree podlinkuj oba z głównego checkoutu.

## Nowy mecz

1. Skopiuj `data/grubik-2026-11-07.json` do `data/<rywal>-<data>.json`.
2. Wpisz **wyłącznie fakty z publikacji Studio** (zakładka faktów, źródło kalk-koszalin.com). Liczby, daty i
   nazwiska nie mogą pochodzić spoza faktów. Pole `source` mówi, skąd są dane.
3. Pola opcjonalne usuń, jeśli nie ma faktów: wzór pominie scenę (A bez `h2h`, C bez lidera) albo
   `render` pominie cały wzór (B bez `h2h`, C bez `season`).
4. Zasady treści: wynik BeKaPaKa zawsze pierwszy, „Wstęp wolny” tylko potwierdzony, żadnych oznaczeń AI.

## Jak to działa

- `scripts/prepare.mjs` renderuje zapowiedź przez `backend/studio/renderer/render.py` (styl „sport” i
  „editorial”, story) i tnie SVG skryptem `scripts/split.py`. Renderer Studio zapisuje nazwane warstwy
  (`20-wstega`, `30-druzyny`, `40-panel`, `90-stopka`), a `split.py` rozpoznaje elementy po treści i położeniu.
  Logo rywala z rejestru Studio trafia do filmu samo. Jeśli szablon zapowiedzi w Studio się zmieni,
  `split.py` przerwie z nazwą brakującej części.
- `src/kit.tsx`: zestaw ruchu, czyli kolory z `tokens.json`, fonty Barlow, wejścia bez przestrzału, ostrze 24°
  z rozmyciem ruchu, paski stroju, rolki cyfr i zdarty nadruk z tej samej faktury co filtr „nadruk” w Studio.
- Tekst zmniejsza się, gdy się nie mieści (`fitSize` w `src/match.ts`, metryki fontów z
  `src/font-metrics.json`; odśwież przez `npm run metrics` po zmianie fontów). Długie nazwy, jak
  „Maxbau Okna Dako PSP”, nie wychodzą poza kadr.
- `src/Poster.tsx`: składanie plakatu ze Studio z warstw. Używają go plansze końcowe A–D.
- `src/templates/*.tsx`: jeden plik na wzór. Ujęcia (`shots`) mają długość w klatkach. Cięcie z `wipe: true`
  zakrywa czerwone ostrze. Długość filmu wynika z danych (`calculateMetadata`).

## Zasady ruchu przyjęte we wzorach

- Ujęcia 1,3–2,5 s, plansza końcowa ok. 2,3 s. Każda scena ma powolny najazd kamery, więc obraz nie zamiera
  (kontrola: `ffmpeg … -vf freezedetect=d=1.0`).
- Cięcia na twardo albo ostrzem, bez przenikania scen. Tekst wchodzi z maski albo uderzeniem skali.
- Napisy i znaki w scenach między y 270 a 1250. Reels zasłania górne 14% i dolne 35% kadru (wytyczne Meta 2026). Wyjątkiem jest dół plakatu ze Studio, bo godzinę i halę pokazuje wcześniej scena „When”.
- Cień i faktura nadruku zawsze na osobnych warstwach: maska na elemencie z cieniem tnie cień do prostokąta.
- Logo i fonty tylko z plików marki (`backend/studio/brand/02_system`), herb 2.0 z napisem BOBOLICE.
- Licencja Remotion: bezpłatna dla osób prywatnych, firm do 3 osób i organizacji non-profit. Przed użyciem
  przez klub potwierdź, że spełnia warunki.

## Poza zakresem (na razie)

Render na VPS i przycisk w Studio. Filmy powstają lokalnie na Macu. Wejście do Studio opisuje analiza
Motion Studio 2.0 z ShipApp: osobny worker bez sieci z limitem pamięci, MP4 w akceptacji i w ZIP-ie.
