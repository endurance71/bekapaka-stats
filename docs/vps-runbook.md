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
        ├── mthub-api.damianmotylinski.pl → 127.0.0.1:3000   (MOYA / MT Hub API — nie dotykać)
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
| `3000` | MOYA / MT Hub API (`mthub-api`) | **moya-native-app** — nie dotykać |
| `127.0.0.1:3001–3003` | MT Hub (admin, staging) | nie dotykać |
| `127.0.0.1:8083` | BeKaPaKa Studio | bekapaka-stats |
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
docker compose -f docker-compose.prod.yml up -d --no-deps bkpk-backend bkpk-frontend
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f bkpk-backend --tail=100
```

Restart **tylko** kontenerów `bkpk-*`:

```bash
docker compose -f docker-compose.prod.yml restart bkpk-backend
```

### Aktualizacja Caddy (BeKaPaKa)

Źródło prawdy bloków BeKaPaKa (HSTS, CSP): [`deploy/caddy/bekapaka-blocks.caddy`](../deploy/caddy/bekapaka-blocks.caddy).  
Playbook filtrów operatorów: [trust-and-filtering.md](./trust-and-filtering.md).

Po backupie podmień **tylko** bloki `bekapaka.pl` … `cms.bekapaka.pl` (nie ruszaj `moya-api.*`):

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d)
# edycja: wklej bloki z deploy/caddy/bekapaka-blocks.caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -sI https://panel.bekapaka.pl | grep -i strict-transport-security
```

### Zabronione (MOYA)

- `docker compose down` w `~/apps/moya-native-app/` bez wyraźnej zgody użytkownika
- Usuwanie wolumenów, baz lub obrazów MOYA
- Zmiana portu `3000` lub bloku `mthub-api.damianmotylinski.pl` (dawniej `moya-api.*`) w Caddyfile
- `docker system prune -a` na całym VPS (może usunąć obrazy MOYA)
- Wspólna sieć Docker między MOYA a BeKaPaKa (używaj `bkpk-network` tylko dla bkpk)
- Nadpisywanie `/opt/bekapaka-stats/data/pgdata` bez backupu

## Wdrożenie strony 2.0 i zgody na zdjęcia

Strona 2.0 pokazuje okładki, galerie i zdjęcia zawodników tylko z opublikowanym rekordem **„Metadane i zgody zdjęć”** (Strapi `media-record`: alt, autor, zgoda `granted` / `not_required`). Bez rekordu zdjęcie jest ukryte.

Kolejność pierwszego wdrożenia (bez okresu bez zdjęć):

1. CMS z kolekcją `media-record` (push `cms-app` do `main` → ręczny workflow **Deploy CMS to VPS**).
2. Rekordy dla opublikowanych zdjęć — skrypt `scripts/vps/seed-media-records.mjs` (podgląd, potem `--apply`; tworzy tylko brakujące, zgoda „nie wymagana”, autor „BeKaPaKa Bobolice”):

   ```bash
   cd /opt/bekapaka-stats
   docker run --rm --network bkpk-network --env-file <(grep -E '^(SITE_CMS_TOKEN|CMS_MEDIA_TOKEN)=' .env) \
     -v "$PWD/scripts/vps/seed-media-records.mjs:/seed.mjs:ro" node:22-alpine node /seed.mjs
   ```

   Token strony (`SITE_CMS_TOKEN`) musi czytać `media-record`. Do zapisu potrzebny jest token z prawem `create` — jeśli token strony go nie ma, utwórz w Strapi (Settings → API Tokens) token „custom” i dopisz `CMS_MEDIA_TOKEN=…` do `.env`.
3. `pg_dump` bazy, potem merge strony 2.0 do `main` (automatyczny deploy backendu z migracją, strony i panelu).
4. Nowe zdjęcia: przy dodaniu zdjęcia do artykułu utwórz rekord w CMS albo uruchom skrypt ponownie.

Dane klubu na stronie (opcjonalnie w `.env`, puste = wartości domyślne z `site/lib/site-settings.ts`): `SITE_CONTACT_EMAIL`, `SITE_PRIVACY_URL`, `SITE_ASSOCIATION_KRS`, `SITE_PARTNER_LEVELS_APPROVED=1`.

Backend odświeża stronę po zapisie prezentacji meczu przez `http://bkpk-site:3000/api/revalidate` z sekretem `SITE_REVALIDATE_SECRET` (albo `PREVIEW_SECRET`).

## Scraping (Scrapling)

Skrót: backend uruchamia `kalk_scraper.py`, wynik trafia do PostgreSQL.  
**Pełna dokumentacja:** [scraping.md](./scraping.md) (format JSON, API, walidacja, zdjęcia, troubleshooting).

Ręczny trigger (admin): `POST /api/scrape/kalk/div2/run`.

### Harmonogram KALK (host → bkpk-backend, bez MOYA)

Na VPS nie ma zainstalowanego demona `cron`. Źródłem harmonogramu jest więc **timer systemd** `bekapaka-kalk-sync.timer`: poniedziałek 07:30 i wtorek 18:00 czasu hosta (`Europe/Warsaw`), pełny sync przez `127.0.0.1:4001`. Nie używać portu MOYA `3000`.

Po ustawieniu `KALK_CRON_SECRET` w `/opt/bekapaka-stats/.env` i ponownym uruchomieniu `bkpk-backend` zainstaluj pliki z repo:

```bash
sudo bash scripts/vps/install-kalk-sync.sh
systemctl list-timers --all bekapaka-kalk-sync.timer
/usr/bin/python3 /usr/local/bin/bekapaka-kalk-sync --mode probe
journalctl -u bekapaka-kalk-sync.service --since '7 days ago'
```

Skrypt odczytuje sekret z `.env` przy każdym wykonaniu, więc jego wartość nie trafia do pliku timera ani do argumentów procesu. Po rotacji sekretu uruchom test `--mode probe`. Timer wykonuje `mode=full`; `probe` służy tylko do szybkiej kontroli uwierzytelnienia. Weekend (pt–nd) pozostaje bez synchronizacji.

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
- **CMS:** osobny workflow `Deploy CMS to VPS` pobiera obraz GHCR z tagiem SHA i najpierw wykonuje backup SQLite oraz uploadów do `/home/debian/backups/bekapaka-cms-*`. Nie buduj CMS na współdzielonym VPS. Tag sprawdzonego obrazu jest zapisywany jako `BKPK_CMS_IMAGE_TAG` w produkcyjnym `.env`.
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
