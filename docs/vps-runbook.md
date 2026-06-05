# VPS Runbook — BeKaPaKa Stats (współdzielony serwer z MOYA)

Ten dokument jest przeznaczony dla agentów AI i developerów wdrażających **BeKaPaKa Stats** na tym samym VPS co backend **moya-native-app**. Przeczytaj go przed jakąkolwiek zmianą na serwerze.

## Cel

- BeKaPaKa działa **obok** MOYA, nie zamiast MOYA.
- MOYA musi pozostać dostępna (restart dozwolony, **destrukcyjne zmiany zabronione**).
- BeKaPaKa ma własną sieć Docker, własną bazę i własne porty.

## Serwer

| Parametr | Wartość |
|----------|---------|
| Dostawca | OVH VPS |
| IPv4 | `51.210.102.167` |
| Użytkownik SSH | `debian` (typowo) |
| Alias SSH (lokalnie) | `ovh-vps-cursor` |

### Połączenie SSH

Na Macu (po skonfigurowaniu `~/.ssh/config`):

```bash
ssh ovh-vps-cursor
```

Bez aliasu:

```bash
ssh debian@51.210.102.167
```

Szczegóły pierwszego logowania, deploy key i stack MOYA: repozytorium **moya-native-app**:

- `moya-native-app/backend/docs/DEPLOY_VPS_IP_ONLY.md`
- `moya-native-app/backend/docs/DEPLOY_VPS_STAGING_DOMAIN.md`
- `moya-native-app/backend/scripts/deploy-vps.sh` (używa `SSH_HOST=ovh-vps-cursor`)

## Mapa usług na VPS

```text
Internet :443 / :80
        │
        ▼
   Caddy (host, /etc/caddy/Caddyfile)
        │
        ├── moya-api.damianmotylinski.pl  → 127.0.0.1:3000   (MOYA API)
        │
        ├── bekapaka.pl, www.bekapaka.pl  → 127.0.0.1:8082   (BeKaPaKa strona publiczna)
        ├── panel.bekapaka.pl             → 127.0.0.1:8081   (BeKaPaKa panel)
        └── cms.bekapaka.pl               → 127.0.0.1:1337   (Strapi CMS)

Docker — MOYA (osobny projekt):
  ~/apps/moya-native-app/
  docker compose → kontener API na porcie 3000 (host)

Docker — BeKaPaKa (ten projekt):
  /opt/bekapaka-stats/
  docker compose -f docker-compose.prod.yml
    ├── bkpk-db-prod        (PostgreSQL, tylko sieć bkpk-network)
    ├── bkpk-backend-prod   (Node, port 4001 na hoście)
    ├── bkpk-frontend-prod  (Nginx, panel, port 8081 na hoście)
    ├── bkpk-site-prod      (Next.js, strona publiczna, port 8082 na hoście)
    └── bkpk-cms-prod       (Strapi CMS, port 1337 na hoście)
```

### Porty — nie zmieniać bez uzasadnienia

| Port (host) | Usługa | Projekt |
|-------------|--------|---------|
| `3000` | MOYA API | **moya-native-app** — nie dotykać |
| `127.0.0.1:4001` | BeKaPaKa backend | bekapaka-stats |
| `127.0.0.1:8081` | BeKaPaKa panel frontend | bekapaka-stats |
| `127.0.0.1:8082` | BeKaPaKa strona publiczna | bekapaka-stats |
| `127.0.0.1:1337` | BeKaPaKa CMS (Strapi) | bekapaka-stats |
| `80` / `443` | Caddy (reverse proxy) | host |

Produkcja BeKaPaKa powinna nasłuchiwać na **localhost** (`127.0.0.1:8081`, `127.0.0.1:4001`), żeby nie kolidować z innymi usługami — ruch z zewnątrz tylko przez Caddy.

## Ścieżki na serwerze

| Ścieżka | Zawartość |
|---------|-----------|
| `/opt/bekapaka-stats/` | Kod, `docker-compose.prod.yml`, `.env`, `data/pgdata` |
| `~/apps/moya-native-app/` | Repozytorium i Docker MOYA |
| `/etc/caddy/Caddyfile` | Reverse proxy (MOYA + BeKaPaKa) |

## DNS (domeny BeKaPaKa)

Rekordy **A** (wszystkie na `51.210.102.167`):

- `bekapaka.pl`
- `www.bekapaka.pl`
- `panel.bekapaka.pl`
- `cms.bekapaka.pl`

Delegacja NS: `ns1.seohost.pl`, `ns2.seohost.pl`.

**Ważne:** Panel SEOhost i autorytatywne NS muszą zwracać ten sam IP. Weryfikacja:

```bash
dig +short bekapaka.pl @ns2.seohost.pl
# oczekiwane: 51.210.102.167
```

Jeśli widać `188.210.221.221` — to parking SEOhost, nie VPS. Zgłoś synchronizację strefy do SEOhost.

## Wdrożenie BeKaPaKa (bezpieczne dla MOYA)

### Dozwolone

```bash
cd /opt/bekapaka-stats
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build bkpk-backend bkpk-frontend
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f bkpk-backend --tail=100
```

Restart **tylko** kontenerów `bkpk-*`:

```bash
docker compose -f docker-compose.prod.yml restart bkpk-backend
```

Aktualizacja Caddy **tylko** bloków BeKaPaKa (po backupie):

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d)
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### Zabronione (MOYA)

- `docker compose down` w `~/apps/moya-native-app/` bez wyraźnej zgody użytkownika
- Usuwanie wolumenów, baz lub obrazów MOYA
- Zmiana portu `3000` lub bloku `moya-api.damianmotylinski.pl` w Caddyfile
- `docker system prune -a` na całym VPS (może usunąć obrazy MOYA)
- Wspólna sieć Docker między MOYA a BeKaPaKa (używaj `bkpk-network` tylko dla bkpk)
- Nadpisywanie `/opt/bekapaka-stats/data/pgdata` bez backupu

## Scraping (Scrapling)

Skrót: backend uruchamia `kalk_scraper.py`, wynik trafia do PostgreSQL.  
**Pełna dokumentacja:** [scraping.md](./scraping.md) (format JSON, API, walidacja, zdjęcia, troubleshooting).

Ręczny trigger (admin): `POST /api/scrape/kalk/div2/run`.

### Cron KALK (host → bkpk-backend, bez MOYA)

**Wybór:** harmonogram na **hoście Debian** (`/etc/cron.d/`), HTTP na **`127.0.0.1:4001`** — osobna baza `bekapaka_stats`, port **4001**, sieć Docker `bkpk-*`. Nie używać portu `3000` ani stacku MOYA.

Opcjonalnie **Hermes** na VPS może wywoływać ten sam URL (logi w jednym miejscu); źródłem prawdy dla czasu jest host cron.

1. W `/opt/bekapaka-stats/.env` na serwerze:

```bash
KALK_CRON_SECRET=<losowy-długi-sekret>
```

2. Przebuduj / zrestartuj `bkpk-backend`, aby wczytał zmienną.

3. Plik `/etc/cron.d/bekapaka-kalk` (strefa `Europe/Warsaw` jest w kontenerze; cron hosta — ustaw czasy lokalnie):

```cron
# Pon 07:30 i Wt 18:00 — pełny sync (po weekendzie)
30 7 * * 1 debian curl -fsS -X POST -H "X-Cron-Secret: TU_WKLEJ_SEKRET" "http://127.0.0.1:4001/api/internal/kalk/sync?mode=full" >> /var/log/bekapaka-kalk-sync.log 2>&1
0 18 * * 2 debian curl -fsS -X POST -H "X-Cron-Secret: TU_WKLEJ_SEKRET" "http://127.0.0.1:4001/api/internal/kalk/sync?mode=full" >> /var/log/bekapaka-kalk-sync.log 2>&1
```

Weekendy (pt–nd): brak wpisów — zgodnie z [kalk-sync-plan.md](./kalk-sync-plan.md). Faza „probe” (tylko zmiany) — kolejny krok implementacji.

## Zdjęcia zawodników

- Źródło lokalne: `frontend/public/photos/*.png` (serwowane jako `/photos/...`).
- KALK często zwraca placeholder `empty.jpg` — UI preferuje lokalne pliki, jeśli `photo_url` zawiera `empty.jpg`.
- Po deploy frontendu upewnij się, że pliki w kontenerze mają prawa do odczytu (w `Dockerfile.prod`: `chmod -R a+rX`).

## Weryfikacja po deployu

```bash
# Health backendu
curl -s http://127.0.0.1:4001/health

# Frontend (przez Caddy na hoście)
curl -sI http://127.0.0.1:8081/ | head -5

# MOYA — nie psuć; tylko sprawdzenie
curl -s http://127.0.0.1:3000/api/v1/health 2>/dev/null || echo "sprawdź dokumentację MOYA dla endpointu health"
```

## Sekrety

- Hasła i `JWT_SECRET` w `/opt/bekapaka-stats/.env` (nie w `docker-compose.prod.yml`).
- **Rotacja po wycieku:** [security-rotation.md](./security-rotation.md).
- **Backup bazy:** tylko poza repo (`pg_dump`, katalog `VPS-dane/`, lokalny dysk). Nigdy nie commituj `data/pgdata/` ani `data/pgdata_backup*/`.
- **Analiza AI (Gemini):** `GEMINI_API_KEY` z [Google AI Studio](https://aistudio.google.com/apikey) — opcjonalnie `GEMINI_MODEL=gemini-3.5-flash`.
- Po pierwszym deployu AI uruchom migrację w kontenerze backend: `npx prisma migrate deploy`.
- **Nigdy** nie commituj `.env` z produkcją do git.
- Osobna baza: `bekapaka_stats` (nie współdzielona z MOYA).
- CMS na produkcji wymaga w `.env`: `CMS_APP_KEYS`, `CMS_API_TOKEN_SALT`, `CMS_ADMIN_JWT_SECRET`, `CMS_JWT_SECRET`, `CMS_TRANSFER_TOKEN_SALT` (patrz `backend/.env.production.example`).

## Monitorowanie RAM i optymalizacja

Na współdzielonym VPS **RAM jest wąskim gardłem** przy deployach Docker, buildach Strapi/CMS i agentach AI (Hermes na hoście). Dysk bywa drugim problemem (cache buildów Docker).

**Pełny przewodnik:** [vps-optimization.md](./vps-optimization.md) (checklist deploy, swap, prune, zużycie RAM po procesach).

### Skrypty w repo

| Plik | Rola |
|------|------|
| `scripts/vps/ram-monitor.sh` | Co 5 min: log dostępnej RAM, load, `docker stats`, top RSS; alert do syslog przy progach |
| `scripts/vps/install-ram-monitor.sh` | Instalacja na VPS (`/usr/local/bin`, cron `/etc/cron.d/bekapaka-ram-monitor`) |
| `scripts/vps/vps-optimize.sh` | Jednorazowa optymalizacja: swap, prune cache/obrazów, journal, apt (bez `docker compose down` MOYA) |

### Instalacja / aktualizacja monitora (na VPS)

```bash
cd /opt/bekapaka-stats
sudo bash scripts/vps/install-ram-monitor.sh
```

### Odczyt logów

```bash
tail -f /var/log/bekapaka-ram.log
tail -20 /var/log/bekapaka-ram-alerts.log
journalctl -t bekapaka-ram --since "1 hour ago"
```

### Progi domyślne (zmienne środowiskowe w cronie, opcjonalnie)

| Zmienna | Domyślnie | Znaczenie |
|---------|-----------|-----------|
| `BKP_RAM_WARN_AVAIL_MIB` | 1024 | Ostrzeżenie: mniej wolnej RAM |
| `BKP_RAM_CRIT_AVAIL_MIB` | 512 | Krytyczne |
| `BKP_RAM_WARN_USED_PCT` | 85 | Ostrzeżenie: % zajętej RAM |
| `BKP_RAM_CRIT_USED_PCT` | 92 | Krytyczne |

### Optymalizacja (bezpieczna dla MOYA)

```bash
sudo bash /opt/bekapaka-stats/scripts/vps/vps-optimize.sh
```

Nie używaj `docker system prune -a` na całym hoście — runbook MOYA. Skrypt używa `docker builder prune` i `docker image prune -a` (tylko obrazy **bez** działającego kontenera).

### Praktyka przy deployu / AI

1. Przed `docker compose ... --build` sprawdź: `free -h` i ostatni wpis w `bekapaka-ram.log`.
2. Swap 2 GiB (`/swapfile`) — bufor przy skokach pamięci; `vm.swappiness=10`.
3. Porty BeKaPaKa w `docker-compose.prod.yml` mapowane na **`127.0.0.1`** (jak MOYA `:3000`).
4. Po deployu usuń stare obrazy: `docker image prune -a -f` (gdy kontenery `bkpk-*` już działają na nowych tagach).

## Powiązana dokumentacja w tym repo

- [vps-optimization.md](./vps-optimization.md) — optymalizacja dysku/RAM, skrypty, checklist deploy
- [docker-deploy.md](./docker-deploy.md) — CI/CD i GHCR
- [architecture.md](./architecture.md) — architektura aplikacji
- [api.md](./api.md) — endpointy API

## Powiązana dokumentacja MOYA

- `../moya-native-app/backend/docs/DEPLOY_VPS_IP_ONLY.md`
- `../moya-native-app/backend/docs/DEPLOY_VPS_STAGING_DOMAIN.md`
