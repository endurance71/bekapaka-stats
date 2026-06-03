# VPS — optymalizacja zasobów i monitorowanie RAM

Dokument uzupełnia [vps-runbook.md](./vps-runbook.md). Dotyczy współdzielonego serwera OVH (`51.210.102.167`) z **MOYA** i **BeKaPaKa**.

## Kontekst

| Zasób | Typowy problem | Priorytet |
|-------|----------------|-----------|
| **RAM (7,6 GiB)** | Deploy Docker, build Strapi/CMS, agenci AI (Hermes), `dockerd` | **Wąskie gardło** |
| **Dysk (74 GiB)** | Cache buildów Docker (`docker builder`), stare obrazy | Drugi po deployach |
| **CPU (4 vCPU)** | Zwykle niski load | Zapas |

Optymalizacja z czerwca 2026 na produkcji: dysk spadł z ~83% do ~31% użycia po `docker builder prune` i usunięciu nieużywanych obrazów; dodano **swap 2 GiB** i **cron monitora RAM** co 5 minut.

## Skrypty (`scripts/vps/`)

| Plik | Uruchomienie | Opis |
|------|--------------|------|
| `ram-monitor.sh` | Cron (root, co 5 min) | Log RAM, load, `docker stats`, top RSS; alert syslog przy progach |
| `install-ram-monitor.sh` | `sudo bash …` na VPS | Instalacja do `/usr/local/bin/bekapaka-ram-monitor`, cron, logrotate |
| `vps-optimize.sh` | `sudo bash …` na VPS | Swap (jeśli brak), prune cache/obrazów, journal, apt, npm cache |
| `bekapaka-ram.logrotate` | przez `install-ram-monitor.sh` | Rotacja logów `/var/log/bekapaka-ram*.log` |

### Pierwsza instalacja (lub po `git pull` na VPS)

```bash
cd /opt/bekapaka-stats
git pull   # lub rsync/scp z repo
sudo bash scripts/vps/install-ram-monitor.sh
```

### Jednorazowa / okresowa optymalizacja

```bash
sudo bash /opt/bekapaka-stats/scripts/vps/vps-optimize.sh
```

**Bezpieczne dla MOYA:** skrypt nie wykonuje `docker compose down` w katalogu MOYA ani `docker system prune -a` na całym hoście.

## Monitorowanie RAM

### Logi

| Plik | Zawartość |
|------|-----------|
| `/var/log/bekapaka-ram.log` | Wpis co 5 min (avail MiB, % used, swap, load, docker, top RSS) |
| `/var/log/bekapaka-ram-alerts.log` | Tylko przekroczenia progów |
| `journalctl -t bekapaka-ram` | Te same alerty w syslog |

### Odczyt (SSH)

```bash
free -h
tail -f /var/log/bekapaka-ram.log
tail -20 /var/log/bekapaka-ram-alerts.log
journalctl -t bekapaka-ram --since "24 hours ago"
sudo /usr/local/bin/bekapaka-ram-monitor   # jednorazowy snapshot
```

### Progi alertów (domyślne)

| Poziom | Warunek |
|--------|---------|
| Ostrzeżenie | dostępna RAM &lt; **1024 MiB** lub zajęte ≥ **85%** |
| Krytyczne | dostępna RAM &lt; **512 MiB** lub zajęte ≥ **92%** |

Nadpisanie (np. w `/etc/cron.d/bekapaka-ram-monitor` przed komendą):

```bash
BKP_RAM_WARN_AVAIL_MIB=1536 BKP_RAM_CRIT_AVAIL_MIB=768 /usr/local/bin/bekapaka-ram-monitor
```

### Kto zużywa RAM (orientacyjnie)

| Źródło | Szacunek | Uwagi |
|--------|----------|--------|
| `dockerd` + containerd | ~800–950 MiB | Stały narzut Docker |
| Hermes gateway + WebUI | ~450 MiB | Host, poza `bkpk-*` |
| `bkpk-cms-prod` (Strapi) | ~250–350 MiB | Skok przy buildzie/startcie |
| `moya-api` | ~90–100 MiB | Nie restartować bez potrzeby |
| `bkpk-backend`, `bkpk-site`, DB | ~50–150 MiB łącznie | Stabilne po starcie |

Przy deployu z `--build` pamięć rośnie chwilowo (warstwy buildu) — **sprawdź log RAM przed buildem**.

## Swap

- Plik: `/swapfile`, rozmiar domyślny **2 GiB** (`BKP_SWAP_SIZE` w `vps-optimize.sh`)
- `vm.swappiness=10` w `/etc/sysctl.d/99-bekapaka.conf`
- Cel: bufor przy krótkich skokach (CMS build, równoległy deploy + AI), nie zastępuje braku RAM przy długotrwałym obciążeniu

Weryfikacja:

```bash
cat /proc/swaps
free -h
```

## Dysk i Docker

### Co zajmuje miejsce

1. **Build cache** — najczęstsza przyczyna &gt;80% dysku po wielu deployach (`docker builder prune -af`).
2. **Stare obrazy** — lokalne tagi `bekapaka-stats-bkpk-*`, `scrapling`, duplikaty GHCR (`docker image prune -a -f` gdy kontenery już na nowych obrazach).
3. **Journal** — `journalctl --vacuum-size=200M` (w skrypcie optymalizacji).

### Po każdym deployu CI/CD (zalecane na VPS)

```bash
cd /opt/bekapaka-stats
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker image prune -a -f
docker builder prune -af   # gdy dysk >70% lub po dużym buildzie CMS
df -h /
```

### Zabronione (MOYA)

- `docker system prune -a` na całym hoście bez analizy
- `docker compose down` w `~/apps/moya-native-app/`
- Usuwanie wolumenów / obrazów podpiętych do `moya-api` / `moya-postgres`

## Porty i bezpieczeństwo

W `docker-compose.prod.yml` usługi BeKaPaKa mapują porty wyłącznie na **127.0.0.1**:

| Port | Usługa |
|------|--------|
| 4001 | backend |
| 8081 | panel |
| 8082 | strona publiczna |
| 1337 | CMS |

MOYA API pozostaje na `127.0.0.1:3000`. Ruch publiczny: **Caddy** (:80/:443).

Weryfikacja:

```bash
ss -tlnp | grep -E ':(3000|4001|8081|8082|1337)'
```

## Checklist: deploy / praca z AI

1. `tail -3 /var/log/bekapaka-ram.log` — `avail` ≥ 1024 MiB (idealnie ≥ 1536 MiB).
2. `df -h /` — dysk &lt; 75%.
3. Deploy / build.
4. `curl -fsS http://127.0.0.1:4001/health` oraz smoke panelu/strony.
5. `docker image prune -a -f` (opcjonalnie `docker builder prune -af`).
6. Po 10 min: ponownie `tail -1 /var/log/bekapaka-ram.log`.

Jeśli podczas deployu RAM spada poniżej progu krytycznego — rozważ odłożenie buildu CMS lub wstrzymanie zbędnych agentów na hoście (poza zakresem tego repo).

## Powiązane dokumenty

- [vps-runbook.md](./vps-runbook.md) — SSH, MOYA, Caddy, DNS, cron KALK
- [docker-deploy.md](./docker-deploy.md) — GitHub Actions, GHCR
- [VPS-dane/README.md](../VPS-dane/README.md) — skrót dostępu
- [AGENTS.md](../AGENTS.md) — lista dokumentów dla agentów AI
