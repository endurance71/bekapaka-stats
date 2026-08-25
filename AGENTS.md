# Wytyczne dla agentów AI

Przed pracą na VPS lub deployem produkcyjnym **przeczytaj**:

1. **[docs/vps-runbook.md](docs/vps-runbook.md)** — SSH, struktura VPS, porty, Caddy, DNS, **zakazy dotyczące MOYA**
2. **[docs/vps-optimization.md](docs/vps-optimization.md)** — optymalizacja dysku/RAM, skrypty `scripts/vps/`, monitorowanie, checklist deploy
3. **[docs/security-rotation.md](docs/security-rotation.md)** — rotacja sekretów po wycieku (JWT, DB, CMS, cron)
4. **[docs/scraping.md](docs/scraping.md)** — Scrapling, `kalk_scraper.py`, import do DB, walidacja
5. **[docs/ai-match-analysis-plan.md](docs/ai-match-analysis-plan.md)** — plan analizy meczów (Gemini, tekst, cache w DB)
6. **[VPS-dane/README.md](VPS-dane/README.md)** — skrót dostępu i mapa folderów na serwerze
7. **[docs/docker-deploy.md](docs/docker-deploy.md)** — CI/CD i obrazy Docker

Reguła Cursor (auto): `.cursor/rules/vps-moya-deployment.mdc`

## Skrót reguł VPS

- SSH: `ssh ovh-vps-cursor` (VPS `51.210.102.167`)
- BeKaPaKa: `/opt/bekapaka-stats`, kontenery `bkpk-*`, porty `127.0.0.1:4001` / `8081` / `8082` / `1337`
- RAM: monitor `/var/log/bekapaka-ram.log` — patrz [docs/vps-optimization.md](docs/vps-optimization.md)
- MOYA: `~/apps/moya-native-app`, port `3000` — **nie modyfikować bez wyraźnej prośby użytkownika**
- Scraping wyłącznie przez **Scrapling** (`backend/scripts/kalk_scraper.py`)
- Audyt danych KALK: `node backend/scripts/kalk-data-audit.js` — szczegóły w [docs/scraping.md](docs/scraping.md#audyt-danych-kalk)
- Strapi MCP: `https://cms.bekapaka.pl/mcp` (wbudowany, `mcp.enabled` w `cms-app/config/server.js`). Auth: **Admin token** z panelu Strapi — nie `SITE_CMS_TOKEN`. Konfiguracja Cursora tylko lokalnie w `~/.cursor/mcp.json` (token nie w Git). Rotacja: [docs/security-rotation.md](docs/security-rotation.md)
