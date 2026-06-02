# GitHub Actions — deploy na VPS

## Co robi workflow `Deploy to VPS`

Po każdym pushu na `main`:

1. Buduje i publikuje obrazy w **GHCR**:
   - `backend`
   - `frontend` (panel)
   - `site` (strona publiczna `bekapaka.pl`)
2. Kopiuje `docker-compose.prod.yml` na VPS (`/opt/bekapaka-stats/`).
3. Na VPS: `docker pull` + `docker compose up -d`.

Strona publiczna **nie wymaga** `git pull` na serwerze.

## Wymagane sekrety (Settings → Secrets → Actions)

| Sekret | Opis |
|--------|------|
| `CR_PAT` | PAT z uprawnieniem `write:packages` (oraz `read:packages`) |
| `VPS_HOST` | IPv4 VPS, np. `51.210.102.167` |
| `VPS_USER` | Użytkownik SSH, np. `debian` |
| `VPS_SSH_KEY` | Klucz prywatny SSH (ten sam co do `ssh ovh-vps-cursor`) |

## Ręczne uruchomienie

Actions → **Deploy to VPS** → **Run workflow**.

## Opcjonalnie: `git pull` na VPS

Obecny klucz `~/.ssh/id_ed25519_github_deploy` na VPS zwraca `Repository not found` — nie jest dodany do repozytorium GitHub (lub repo jest prywatne bez dostępu).

Aby naprawić (opcjonalnie, deploy i tak działa przez GHCR):

1. Na VPS: `cat ~/.ssh/id_ed25519_github_deploy.pub`
2. GitHub → repo **bekapaka-stats** → Settings → Deploy keys → Add deploy key (read-only).
3. Na VPS:
   ```bash
   cd /opt/bekapaka-stats
   git remote set-url origin git@github.com:endurance71/bekapaka-stats.git
   GIT_SSH_COMMAND='ssh -i ~/.ssh/id_ed25519_github_deploy -o IdentitiesOnly=yes' git pull origin main
   ```

## Weryfikacja po deployu

```bash
curl -sI https://bekapaka.pl/ | head -5
docker ps --filter name=bkpk-site-prod
```
