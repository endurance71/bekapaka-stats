# Rotacja sekretów BeKaPaKa

Użyj tej checklisty po wycieku haseł z kodu, kopii bazy w Git (historia) lub podejrzeniu kompromitacji VPS.

**Historia Git:** jeśli katalog `data/pgdata_backup_*` był w repozytorium, załóż, że zawartość bazy z tamtego okresu mogła wyciec — rotacja poniżej jest obowiązkowa, nawet po usunięciu plików z bieżącego drzewa.

## 1. Wygeneruj nowe wartości (lokalnie)

```bash
# JWT (min. 32 znaki)
openssl rand -base64 48

# Hasło DB, cron, sole CMS
openssl rand -base64 32

# CMS APP_KEYS — cztery oddzielne wartości, po przecinku w .env
openssl rand -base64 16  # powtórz 4×
```

## 2. Zaktualizuj `/opt/bekapaka-stats/.env` na VPS

Nie commituj tego pliku. Minimalny zestaw:

| Zmienna | Opis |
|---------|------|
| `DB_PASSWORD` | Hasło użytkownika `bekapaka` w Postgres |
| `JWT_SECRET` | Podpisy JWT panelu (min. 32 znaki) |
| `KALK_CRON_SECRET` | Nagłówek `X-Cron-Secret` dla cron sync |
| `GEMINI_API_KEY` | Opcjonalnie nowy klucz z AI Studio |
| `CMS_APP_KEYS` | Cztery klucze Strapi, rozdzielone przecinkami |
| `CMS_API_TOKEN_SALT` | Sól tokenów API CMS |
| `CMS_ADMIN_JWT_SECRET` | JWT admina Strapi |
| `CMS_JWT_SECRET` | JWT użytkowników Strapi |
| `CMS_TRANSFER_TOKEN_SALT` | Sól transfer token |

Po zmianie `DB_PASSWORD` w kontenerze Postgres (jeśli volume już istnieje):

```bash
docker exec -it bkpk-db-prod psql -U bekapaka -d bekapaka_stats -c "ALTER USER bekapaka WITH PASSWORD 'NOWE_HASLO';"
```

Upewnij się, że `DATABASE_URL` / `DB_PASSWORD` w `.env` są spójne.

## 3. Restart stacku (tylko BeKaPaKa)

W `/opt/bekapaka-stats`:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Dotykaj wyłącznie kontenerów `bkpk-*`. Nie restartuj MOYA ani nie edytuj Caddy `moya-api.*`.

## 4. Reset haseł użytkowników panelu

W kontenerze backend:

```bash
docker exec -it bkpk-backend-prod sh -c \
  'SET_PASSWORD="NOWE_HASLO_UZYTKOWNIKA" node scripts/set-user-password.js motylinski'
```

Powtórz dla każdego konta z dostępem do panelu.

## 5. Cron KALK na hoście

Zaktualizuj `/etc/cron.d/bekapaka-kalk` — ten sam sekret co `KALK_CRON_SECRET` w `.env`.

Test ręczny:

```bash
curl -fsS -X POST \
  -H "X-Cron-Secret: TWOJ_SEKRET" \
  "http://127.0.0.1:4001/api/internal/kalk/sync?mode=full"
```

## 6. Token MCP Strapi (Cursor)

Endpoint: `https://cms.bekapaka.pl/mcp`. Używa **Admin token** z panelu Strapi (Settings → Admin tokens), nie `SITE_CMS_TOKEN`.

Po wycieku lub rotacji:

1. W [cms.bekapaka.pl/admin](https://cms.bekapaka.pl/admin) unieważnij token `cursor-mcp` i utwórz nowy (treści: news-posts, events, sponsors, documents, homepage-sections — CRUD + publish).
2. Podmień wartość w lokalnym `~/.cursor/mcp.json` (`strapi-mcp` → `Authorization: Bearer …`). Nie commituj tokenu.

## 7. Weryfikacja

```bash
curl -s http://127.0.0.1:4001/health
curl -sI http://127.0.0.1:8081/ | head -5
```

- Zaloguj się do panelu nowym hasłem.
- Stare tokeny JWT w przeglądarce powinny zwracać 403 po zmianie `JWT_SECRET`.
- Lokalny `backend/.env.production` zaktualizuj ręcznie po rotacji (plik jest w `.gitignore`).

## Powiązane

- [vps-runbook.md](./vps-runbook.md) — SSH, porty, zakazy MOYA
- [docker-deploy.md](./docker-deploy.md) — CI/CD
