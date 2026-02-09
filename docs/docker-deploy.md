# Deploy Docker / VPS (Automation)

## Wymagania
- Docker & Docker Compose na serwerze.
- Skonfigurowane repozytorium GitHub z Actions.
- Przekierowanie przez reverse proxy (np. Nginx w Moya Stacja).

## Automatyzacja (GitHub Actions)
Aplikacja jest wdrażana automatycznie po każdym `push` do gałęzi `main`.

### Konfiguracja Secrets na GitHub:
1. `CR_PAT`: Personal Access Token z uprawnieniami do pakietów.
2. `VPS_HOST`: Adres Twojego VPS.
3. `VPS_USER`: Użytkownik SSH (np. root).
4. `VPS_SSH_KEY`: Klucz prywatny SSH.

## Porty (Produkcja)
- **Frontend**: `8081` (Dostępny wewnętrznie przez proxy na `bekapaka.tojest.dev`)
- **Backend**: `4001`
- **Database**: `5432` (Tylko wewnętrzna sieć Docker)

## Lokalizacja plików na VPS
Pliki deploymentu znajdują się w `/opt/bekapaka-stats/`.
Główny plik konfiguracyjny to `docker-compose.prod.yml`, który pobiera gotowe obrazy z **GHCR (GitHub Container Registry)**.

## Ręczna aktualizacja na serwerze:
Jeśli chcesz wymusić aktualizację ręcznie na VPS:
```bash
cd /opt/bekapaka-stats
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Szczegółowy przewodnik
Pełna instrukcja konfiguracji znajduje się w systemowych dokumentach:
- [VPS Deployment Guide](file:///Users/damianmotylinski/.gemini/antigravity/brain/c5e5fa2e-64a3-4c24-a7a9-bd6d6dc199d4/vps_deployment_guide.md)
- [Walkthrough](file:///Users/damianmotylinski/.gemini/antigravity/brain/c5e5fa2e-64a3-4c24-a7a9-bd6d6dc199d4/walkthrough.md)
