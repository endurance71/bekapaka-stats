# Wytyczne dla agentów AI

Przed pracą na VPS lub deployem produkcyjnym **przeczytaj**:

1. **[docs/vps-runbook.md](docs/vps-runbook.md)** — SSH, struktura VPS, porty, Caddy, DNS, **zakazy dotyczące MOYA**
2. **[docs/scraping.md](docs/scraping.md)** — Scrapling, `kalk_scraper.py`, import do DB, walidacja
3. **[docs/ai-match-analysis-plan.md](docs/ai-match-analysis-plan.md)** — plan analizy meczów (Gemini, tekst, cache w DB)
4. **[VPS-dane/README.md](VPS-dane/README.md)** — skrót dostępu i mapa folderów na serwerze
5. **[docs/docker-deploy.md](docs/docker-deploy.md)** — CI/CD i obrazy Docker

Reguła Cursor (auto): `.cursor/rules/vps-moya-deployment.mdc`

## Skrót reguł VPS

- SSH: `ssh ovh-vps-cursor` (VPS `51.210.102.167`)
- BeKaPaKa: `/opt/bekapaka-stats`, kontenery `bkpk-*`, porty `4001` / `8081`
- MOYA: `~/apps/moya-native-app`, port `3000` — **nie modyfikować bez wyraźnej prośby użytkownika**
- Scraping wyłącznie przez **Scrapling** (`backend/scripts/kalk_scraper.py`)
