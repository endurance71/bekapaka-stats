# BeKaPaKa Stats 🏀

System do zarządzania statystykami i scoutingiem dla drużyny BeKaPaKa.

## 🚀 Szybki Start (Produkcja)

Aplikacja jest hostowana na Mikrus VPS pod adresem:
👉 [**bekapaka.tojest.dev**](https://bekapaka.tojest.dev)

## 🛠 Deployment & CI/CD

Projekt korzysta z automatycznego wdrażania przez **GitHub Actions**.

- **Workflow**: `.github/workflows/deploy.yml`
- **Rejestr Obrazów**: [GitHub Container Registry (GHCR)](https://github.com/endurance71/bekapaka-stats/pkgs/container/bekapaka-stats)

### Dokumentacja techniczna:
- [Instrukcja Deploymentu](docs/docker-deploy.md)
- [Architektura Systemu](docs/architecture.md)
- [API Reference](docs/api.md)

## 📂 Struktura Projektu
- `/backend`: API Express + Prisma ORM.
- `/frontend`: SPA React + Vite + Tailwind CSS.
- `/docs`: Dokumentacja techniczna projektu.

## 🤝 Autorzy
- Damian Motyliński
- BeKaPaKa Team

---
*Ostatnia weryfikacja systemu: 9 Luty 2026*
