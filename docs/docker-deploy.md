# Deploy Docker / VPS (Automation)

## Wymagania
- Docker & Docker Compose na serwerze.
- Skonfigurowane repozytorium GitHub z Actions.
- Przekierowanie przez reverse proxy (np. Nginx w Moya Stacja).

## Automatyzacja (GitHub Actions)
Aplikacja jest wdrażana automatycznie po każdym `push` do gałęzi `main`.

Workflow buduje i publikuje obrazy **backend**, **frontend** (panel) oraz **site** (strona publiczna), następnie aktualizuje kontenery na VPS.

Szczegóły sekretów i diagnostyka: **[github-deploy-setup.md](./github-deploy-setup.md)**.

### Konfiguracja Secrets na GitHub:
1. `CR_PAT`: Personal Access Token z uprawnieniami do pakietów (`read:packages`, `write:packages`).
2. `VPS_HOST`: Adres Twojego VPS.
3. `VPS_USER`: Użytkownik SSH (np. `debian`).
4. `VPS_SSH_KEY`: Klucz prywatny SSH.

## Porty (Produkcja)

Mapowanie w `docker-compose.prod.yml` — **tylko localhost** (ruch publiczny przez Caddy):

| Port (host) | Usługa |
|-------------|--------|
| `127.0.0.1:8081` | Panel (frontend) |
| `127.0.0.1:8082` | Strona publiczna (site) |
| `127.0.0.1:4001` | Backend API |
| `127.0.0.1:1337` | CMS (Strapi) |
| `5432` | PostgreSQL — tylko sieć Docker `bkpk-network` |

## Lokalizacja plików na VPS
Pliki deploymentu znajdują się w `/opt/bekapaka-stats/`.
Główny plik konfiguracyjny to `docker-compose.prod.yml`, który pobiera gotowe obrazy z **GHCR (GitHub Container Registry)**.

## Ręczna aktualizacja na serwerze:
Jeśli chcesz wymusić aktualizację ręcznie na VPS (po zalogowaniu do GHCR):
```bash
cd /opt/bekapaka-stats
echo "$CR_PAT" | docker login ghcr.io -u TWOJ_GITHUB_USER --password-stdin
docker compose -f docker-compose.prod.yml pull bkpk-backend bkpk-frontend bkpk-site
docker compose -f docker-compose.prod.yml up -d
docker image prune -a -f   # po udanym starcie — oszczędność dysku
```

CMS (`bkpk-cms`) nadal buduje się z katalogu `./cms-app` na VPS przy `docker compose up -d --build bkpk-cms`. Po buildzie CMS rozważ `docker builder prune -af` (patrz [vps-optimization.md](./vps-optimization.md)).

### Przed deployem (RAM)

Współdzielony VPS ma ~7,6 GiB RAM — przy buildzie i agentach AI może brakować pamięci. Sprawdź:

```bash
tail -3 /var/log/bekapaka-ram.log
free -h
```

Szczegóły: **[vps-optimization.md](./vps-optimization.md)**.

## VPS (współdzielony z MOYA)

Pełny runbook (SSH, struktura serwera, Caddy, DNS, **co wolno / czego nie wolno** względem MOYA):

- **[vps-runbook.md](./vps-runbook.md)**
- **[vps-optimization.md](./vps-optimization.md)** — monitor RAM, optymalizacja dysku, skrypty `scripts/vps/`

Połączenie (lokalny alias): `ssh ovh-vps-cursor`

Katalog na serwerze: `/opt/bekapaka-stats/`

Dokumentacja MOYA (ten sam VPS): `moya-native-app/backend/docs/DEPLOY_VPS_IP_ONLY.md`
