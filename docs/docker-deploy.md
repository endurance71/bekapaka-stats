# Deploy Docker / VPS (Automation)

## Wymagania
- Docker & Docker Compose na serwerze.
- Skonfigurowane repozytorium GitHub z Actions.
- Przekierowanie przez Caddy zgodnie z `vps-runbook.md`.

## Automatyzacja (GitHub Actions)
Aplikacja jest wdrażana automatycznie po każdym `push` do gałęzi `main`, ale dopiero po przejściu testów backendu i panelu, kontroli migracji Prisma na pustym PostgreSQL oraz kontroli jakości strony. Ten sam zestaw sprawdzeń uruchamia się dla pull requestów do `main` bez deployu.

Workflow sprawdza cztery aplikacje (w tym build CMS i regresje scrapera) oraz audytuje produkcyjne zależności z bramką dla podatności krytycznych. W PR dodatkowo buduje cztery obrazy Docker bez publikacji. Po połączeniu z `main` publikuje obrazy **backend**, **frontend**, **site** i **cms** z tagiem SHA commita i `latest`. Automatyczny deploy pobiera tag SHA i aktualizuje kolejno backend, witrynę i panel, sprawdzając zdrowie po każdym etapie; przy błędzie przywraca poprzedni obraz zmienionych usług. CMS wdraża się osobnym, ręcznie uruchamianym workflow **Deploy CMS to VPS** z tego samego commita; nie wymaga budowania na VPS.

Backend stosuje wersjonowane migracje (`prisma migrate deploy`) przed uruchomieniem API. Błąd migracji zatrzymuje start; nie jest już ukrywany. Przed pierwszym wdrożeniem po zmianie migracji wykonaj backup bazy zgodnie z [vps-runbook.md](./vps-runbook.md) i sprawdź status migracji. Rollback obrazu **nie cofa schematu bazy** — nowe migracje muszą być kompatybilne wstecz.

Jeśli `latest` zostanie ręcznie wdrożony po automatycznym deployu, pamiętaj, że `BKPK_IMAGE_TAG` w compose domyślnie wskazuje `latest`. Do ręcznego odtworzenia konkretnego wydania ustaw `BKPK_IMAGE_TAG=<SHA>` tylko dla komendy `docker compose`.

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
docker compose -f docker-compose.prod.yml up -d --no-deps bkpk-backend
curl -fsS http://127.0.0.1:4001/api/health
docker compose -f docker-compose.prod.yml up -d --no-deps bkpk-site
curl -fsS http://127.0.0.1:8082/
docker compose -f docker-compose.prod.yml up -d --no-deps bkpk-frontend
curl -fsS http://127.0.0.1:8081/
```

Nie uruchamiaj masowego `docker image prune -a` bez sprawdzenia zachowanych obrazów rollbacku.

CMS (`bkpk-cms`) pobiera gotowy obraz GHCR. Domyślny tag `cms:legacy` jest przypisany na obecnym VPS do obrazu działającego przed migracją; zapobiega niezamierzonej aktualizacji CMS przy zwykłym `docker compose up`. Na nowym VPS przed uruchomieniem całości ustaw `BKPK_CMS_IMAGE_TAG` na istniejący tag obrazu. Przed ręcznym workflow sprawdź, czy obraz `cms:<SHA>` jest już opublikowany oraz czy na VPS jest co najmniej 1 GiB dostępnej pamięci i 2 GiB wolnego dysku. Workflow wykonuje spójny backup SQLite i uploadów do `/home/debian/backups/bekapaka-cms-*`, sprawdza `PRAGMA quick_check`, wdraża obraz, kontroluje `/_health` i dopiero wtedy zapisuje `BKPK_CMS_IMAGE_TAG=<SHA>` w produkcyjnym `.env`. Przy błędzie zachowuje backup oraz tag poprzedniego obrazu. **Nie przywracaj samego obrazu bez sprawdzenia kompatybilności bazy po migracji Strapi**; w razie potrzeby przywróć razem SQLite i uploady z tej samej kopii. Po automatycznej kontroli zdrowia zweryfikuj ręcznie panel `/admin`, MCP, publikację szkicu i podgląd CMS.

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
