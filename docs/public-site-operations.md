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

Cache tresci CMS: `revalidate` 60 s dla newsow i wydarzen (tagi `cms`, `cms-news`, `cms-events`). Bez webhooka nowy wpis moze pojawic sie z opoznieniem do ok. 60 s.

## 1.2 Webhook Strapi → odswiezanie cache strony

Endpoint: `POST` lub `GET` `https://bekapaka.pl/api/revalidate?secret=<PREVIEW_SECRET>`

- Sekret: `SITE_REVALIDATE_SECRET` albo, gdy pusty, `PREVIEW_SECRET` (ten sam co podglad CMS).
- Invaliduje tagi `cms`, `cms-news`, `cms-events` oraz sciezki `/` i `/aktualnosci`.
- Nie wymaga zmian kodu `cms-app` — webhook ustawia sie w panelu Strapi.

Konfiguracja w `https://cms.bekapaka.pl/admin` → Settings → Webhooks:

1. URL: `https://bekapaka.pl/api/revalidate?secret=<wartosc PREVIEW_SECRET z VPS>`
2. Zdarzenia: `entry.publish`, `entry.update`, `entry.delete`, `entry.unpublish` (minimum: News-post i Event).
3. Po publikacji sprawdz homepage i `/aktualnosci` (twardy refresh).

Dane zastępcze (fikcyjne newsy z maja/czerwca, tabela #6 5-6) **nie** pojawiaja sie na produkcji. Wlacza je wylacznie `SITE_ALLOW_FAKE_DATA=1` (lokalnie).

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
   - RAM na VPS: `tail /var/log/bekapaka-ram.log` ([vps-optimization.md](./vps-optimization.md))

## 5. Rollback

1. Cofnij obraz kontenera `site` do poprzedniego tagu.
2. Zweryfikuj status `200` dla stron krytycznych.
3. Sprawdz integralnosc danych CMS.
4. Oznacz incydent i przygotuj poprawke hotfix.

## 6. Token CMS (`SITE_CMS_TOKEN`) — baner „dane zastępcze” / `HTTP_401`

Strona publiczna (`bkpk-site`) pobiera treści redakcyjne ze Strapi z nagłówkiem `Authorization: Bearer <SITE_CMS_TOKEN>`.

### Objawy

- Baner: „nie udało się pobrać danych z źródła” z kodem `HTTP_401` (fikcyjne newsy/tabela tylko przy `SITE_ALLOW_FAKE_DATA=1`)
- `/sponsorzy` (i inne sekcje CMS) puste albo z komunikatem błędu zamiast danych z panelu

### Diagnostyka na VPS

```bash
ssh ovh-vps-cursor
grep -E '^SITE_CMS_' /opt/bekapaka-stats/.env   # nie loguj wartości tokena
docker exec bkpk-site-prod sh -c 'wget -qO- --header="Authorization: Bearer $SITE_CMS_TOKEN" "$SITE_CMS_API_URL/api/sponsors?pagination[limit]=1" | head -c 120'
```

Oczekiwany wynik: JSON z `data`, nie `401 Unauthorized`.

### Naprawa

1. Zaloguj się do Strapi: `https://cms.bekapaka.pl/admin`
2. **Settings → API Tokens → Create new API Token**
   - Typ: Read-only (lub Custom z `find` / `findOne` dla: sponsors, news-posts, events, documents, homepage-sections)
3. Skopiuj token **jednorazowo** i ustaw w `/opt/bekapaka-stats/.env`:

   `SITE_CMS_TOKEN=<nowy_token>`

4. Przeładuj kontener site (bez rebuild CMS):

   `cd /opt/bekapaka-stats && docker compose -f docker-compose.prod.yml up -d bkpk-site`

Uwaga: po zmianie `CMS_API_TOKEN_SALT` wszystkie stare tokeny API przestają działać — trzeba wygenerować nowy token i zaktualizować `.env`.

### Sponsorzy w CMS

Kolekcja **Sponsor**: `name`, `slug`, `logo`, `websiteUrl`, `order` (kolejność na stronie). Brak podziału na rangi — wszyscy sponsorzy wyświetlani jednakowo.
