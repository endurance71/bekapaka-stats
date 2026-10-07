# BeKaPaKa Public Site

Publiczna strona klubu oparta o Next.js (App Router), zaprojektowana mobile-first.

## Standard UI — Website 2.0

- Art direction „program meczowy”: płyta (dane) i papier (czytanie), linie zamiast kart, cięte cyfry BKPK dla wyniku, godziny i numeru.
- Źródło marki: Brandbook 2.0 + tom WWW (`BeKaPaKa - brand/05_brandbook`); tokeny marki: `packages/digital-design/dist/tokens.css`.
- CSS w warstwach: `app/styles/foundation.css` (role semantyczne, typografia, layout) → `components.css` → `content.css` → `match.css` → `pages.css`. Komponenty używają wyłącznie ról, bez wartości „na oko”.
- Zasady, architektura i decyzje: `docs/BEKAPAKA_REBRANDING_2_PLAN.md`, raport: `docs/BEKAPAKA_REBRANDING_2_FINAL.md`.
- WCAG 2.2 AA i quality gates przed deployem

## Lokalne uruchomienie

```bash
npm install
npm run dev
```

## Zmienne srodowiskowe

- `SITE_CMS_API_URL` - URL API Strapi
- `SITE_CMS_TOKEN` - token read-only do CMS (Strapi API Token z uprawnieniem `find` do kolekcji redakcyjnych). Po `HTTP_401` wygeneruj nowy token w panelu CMS — patrz `docs/public-site-operations.md` §6.
- `SITE_BACKEND_API_URL` - URL backendu sportowego
- `SITE_BASE_URL` - kanoniczny URL strony publicznej

## Trasy publiczne

- `/`
- `/aktualnosci`
- `/mecze`
- `/tabela`
- `/sklad`
- `/sponsorzy`
- `/dokumenty`
- `/klub`
- `/aktualnosci/[slug]`
- `/mecze/[slug]`
- `/dokumenty/[slug]`

## Kompatybilnosc adresow

- `/wydarzenia` -> `/mecze`
- `/wydarzenia/[slug]` -> `/mecze/[slug]`
- `/o-klubie` -> `/klub`

## Quality gate

```bash
npm run quality
```

Kontrola layoutu (serwer na :3200; 5 szerokości × 13 tras: poziomy scroll, tekst < 14 px, nierówne kontrolki, przewijane tabele ≥ 1440 px, H1, konsola):

```bash
npm run qa:layout
```

## SEO

- dynamiczne metadata per route
- `sitemap.xml` przez `app/sitemap.ts`
- `robots.txt` przez `app/robots.ts`

## Operacyjnie

Szczegoly procesu publikacji i rolloutu:

- `docs/public-site-operations.md`
