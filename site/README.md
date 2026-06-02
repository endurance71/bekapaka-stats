# BeKaPaKa Public Site

Publiczna strona klubu oparta o Next.js (App Router), zaprojektowana mobile-first.

## Standard UI

- Bento Grid (premium dark sport)
- Brandbook-first tokens (BKP Gold / Obsidian / Crimson / Amber / Slate)
- WCAG 2.2 AA i quality gates przed deployem

## Lokalne uruchomienie

```bash
npm install
npm run dev
```

## Zmienne srodowiskowe

- `SITE_CMS_API_URL` - URL API Strapi
- `SITE_CMS_TOKEN` - token read-only do CMS
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

## SEO

- dynamiczne metadata per route
- `sitemap.xml` przez `app/sitemap.ts`
- `robots.txt` przez `app/robots.ts`

## Operacyjnie

Szczegoly procesu publikacji i rolloutu:

- `docs/public-site-operations.md`
