# GitHub Actions — deploy na VPS

## Co robi workflow `Deploy to VPS`

Po każdym pushu na `main`:

1. Buduje i publikuje obrazy w **GHCR**:
   - `backend`
   - `frontend` (panel)
   - `site` (strona publiczna `bekapaka.pl`)
   - `cms` (Strapi; wdrożenie tylko osobnym workflow)
2. Kopiuje `docker-compose.prod.yml` na VPS (`/opt/bekapaka-stats/`).
3. Na VPS: `docker pull` + `docker compose up -d`.

Strona publiczna **nie wymaga** `git pull` na serwerze.

## Wymagane sekrety (Settings → Secrets → Actions)

| Sekret | Opis |
|--------|------|
| `CR_PAT` | PAT z uprawnieniem `write:packages` (oraz `read:packages`) |
| `VPS_HOST` | IPv4 VPS — **musi** być `51.210.102.167` (OVH BeKaPaKa). Stary IP `135.181.138.249` powoduje `connection refused` w jobie deploy. |
| `VPS_USER` | Użytkownik SSH: **`debian`** (jak alias `ovh-vps-cursor`) |
| `VPS_SSH_KEY` | Klucz prywatny `~/.ssh/id_ed25519_cursor_vps`. Błąd: `unable to authenticate, attempted methods [none publickey]` — zły klucz w sekrecie. |
| `VPS_SSH_PORT` | Opcjonalnie: port SSH (domyślnie **22**; nie używaj 10204, jeśli z Maca jest timeout) |

## Ręczne uruchomienie

Actions → **Deploy to VPS** → **Run workflow**.

## CMS i historia po rotacji

Po przepisaniu historii repo nie używaj zwykłego `git pull` w starym checkoutcie. Obrazy są dostarczane przez GHCR; CMS wdraża ręcznie workflow **Deploy CMS to VPS**, który przed zmianą obrazu tworzy zweryfikowaną kopię SQLite i uploadów.

## Deploy failed: `connection refused` na porcie 22

Jeśli job **deploy** pada na kroku **Upload production compose file** z komunikatem:

`dial tcp 135.181.138.249:22: connect: connection refused`

to sekret **`VPS_HOST`** w GitHub Actions wskazuje zły adres. Popraw na `51.210.102.167`, zapisz i uruchom ponownie workflow (**Re-run failed jobs**).

Job **build-and-push** mógł się udać — obrazy są w GHCR, ale VPS nie dostał aktualizacji.

## Deploy failed: `unable to authenticate` (publickey)

SSH łączy się z właściwym hostem, ale **`VPS_SSH_KEY`** nie pasuje do `~/.ssh/authorized_keys` na serwerze.

1. Lokalnie działający klucz: `~/.ssh/id_ed25519_cursor_vps` (para z `ssh ovh-vps-cursor`).
2. W GitHub Secrets wklej **całą** zawartość tego pliku prywatnego do `VPS_SSH_KEY`.
3. Ustaw `VPS_USER` = `debian`.
4. **Re-run** workflow.

## Weryfikacja po deployu

```bash
curl -sI https://bekapaka.pl/ | head -5
docker ps --filter name=bkpk-site-prod
```
