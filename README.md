# BeKaPaKa Stats 🏀

System do zarządzania statystykami i scoutingiem dla drużyny BeKaPaKa.

## 🚀 Szybki Start (Produkcja)

Aplikacja działa na **OVH VPS** (`51.210.102.167`) obok backendu MOYA.

Docelowe domeny: `bekapaka.pl`, `www.bekapaka.pl`, `panel.bekapaka.pl`, `cms.bekapaka.pl` (reverse proxy: Caddy).

**Dla agentów AI i deployu:** [docs/vps-runbook.md](docs/vps-runbook.md), [VPS-dane/README.md](VPS-dane/README.md) oraz [AGENTS.md](AGENTS.md).

## 🛠 Deployment & CI/CD

Projekt korzysta z automatycznego wdrażania przez **GitHub Actions**.

- **Workflow**: `.github/workflows/deploy.yml`
- **Rejestr Obrazów**: [GitHub Container Registry (GHCR)](https://github.com/endurance71/bekapaka-stats/pkgs/container/bekapaka-stats)

### Dokumentacja techniczna:
- [Instrukcja Deploymentu](docs/docker-deploy.md)
- [VPS i MOYA (runbook)](docs/vps-runbook.md)
- [Scraping KALK (Scrapling)](docs/scraping.md)
- [Architektura Systemu](docs/architecture.md)
- [API Reference](docs/api.md)

## 📂 Struktura Projektu
- `/backend`: API Express + Prisma ORM.
- `/frontend`: SPA React + Vite + Tailwind CSS (panel).
- `/site`: publiczna strona klubowa (Next.js).
- `/cms`: modele i runtime self-hosted Strapi.
- `/docs`: Dokumentacja techniczna projektu.

## 🤝 Autorzy
- Damian Motyliński
- BeKaPaKa Team

---
*Ostatnia weryfikacja systemu: 9 Luty 2026*
