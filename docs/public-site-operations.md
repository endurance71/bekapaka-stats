# Public Site Operations (mobile-first)

## 1. Workflow redakcyjny (CMS -> site)

1. Redaktor publikuje wpis/zdarzenie/sponsora/dokument w `cms-app`.
2. Sprawdza, czy pola krytyczne sa uzupelnione:
   - `title`
   - `slug`
   - `excerpt` lub `description`
   - data (`publishedAtCustom` / `startAt` / `effectiveDate`)
3. Dla elementow z mediami sprawdza:
   - czy miniatura jest czytelna na mobile
   - czy alt text opisuje obraz
4. Po publikacji wykonuje szybka walidacje na stronie:
   - `https://bekapaka.pl`
   - `https://bekapaka.pl/aktualnosci`
   - `https://bekapaka.pl/mecze`
   - `https://bekapaka.pl/tabela`
   - `https://bekapaka.pl/sklad`
   - `https://bekapaka.pl/sponsorzy`

## 1.1 Workflow tresci pod Bento Grid

1. Priorytet 1 (hero): najwazniejsza aktualnosc i najblizsze wydarzenie.
2. Priorytet 2 (kafle srednie): tabela mini, sklad highlight, dokumenty CTA.
3. Priorytet 3 (kafle wspierajace): sekcje CMS i pozostale newsy.
4. Sponsorzy zawsze utrzymani w dedykowanej strefie dolnej.
5. Dlugosc zajawki:
   - news: 140-220 znakow
   - wydarzenie: 90-180 znakow
   - dokument: tytul do 80 znakow

## 2. Smoke test po publikacji

### Krytyczne sciezki
- Strona glowna laduje sie i ma widoczny hero.
- Aktualnosci wyswietlaja ostatnie wpisy.
- Mecze wyswietlaja kalendarz i date.
- Tabela wyswietla pozycje i bilans druzyn.
- Sklad wyswietla zawodnikow.
- Sponsorzy wyswietlaja nazwy i linki.
- Dokumenty pozwalaja pobrac pliki.
- Strony detail (`/aktualnosci/[slug]`, `/mecze/[slug]`, `/dokumenty/[slug]`) zwracaja status 200 dla istniejacych slugow.

### Kontrole techniczne
- `sitemap.xml` zwraca status 200.
- `robots.txt` zwraca status 200.
- Brak bledow krytycznych 5xx.

## 3. Minimalny budzet jakosci release

- Lighthouse Mobile:
  - Performance >= 85
  - Accessibility >= 95
  - SEO >= 95
- Brak krytycznych bledow a11y (focus, kontrast, role landmarkow).
- Wszystkie przyciski i linki klikalne na touch (min. 44 px wysokosci celu).
- Polecenie quality gate przed deployem:
  - `cd site && npm run quality`

## 4. Rollout produkcyjny

1. Deploy `site` na staging.
2. Wykonaj `npm run quality`.
3. Wykonaj smoke test i szybki audyt Lighthouse mobile.
4. Zatwierdz release.
5. Deploy produkcyjny.
6. Monitoruj przez 24h:
   - błędy runtime
   - czas odpowiedzi
   - brakujace dane z CMS/backend

## 5. Rollback

1. Cofnij obraz kontenera `site` do poprzedniego tagu.
2. Zweryfikuj status `200` dla stron krytycznych.
3. Sprawdz integralnosc danych CMS.
4. Oznacz incydent i przygotuj poprawke hotfix.
