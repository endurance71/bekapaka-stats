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

## 5. Harmonogram KALK na hoście

Timer `bekapaka-kalk-sync.timer` korzysta z `scripts/vps/kalk-sync.py`, który odczytuje `KALK_CRON_SECRET` bezpośrednio z `.env` przy każdym uruchomieniu. Nie zapisuj sekretu w pliku timera ani w argumentach `curl`.

Po rotacji uruchom bezpieczny test uwierzytelnienia (bez pełnego scrapingu):

```bash
/usr/bin/python3 /usr/local/bin/bekapaka-kalk-sync --mode probe
systemctl list-timers --all bekapaka-kalk-sync.timer
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

## 8. Sesje BeKaPaKa Studio

Studio używa własnych niejawnych sesji w `StudioSession`, a nie JWT panelu. Zmiana hasła istniejącego właściciela automatycznie unieważnia jego sesje Studio przy następnym żądaniu (weryfikacja odcisku aktualnych danych konta). Zmiana `STUDIO_OWNER_ID` odbiera dostęp wcześniejszemu właścicielowi. Sama rotacja `JWT_SECRET` nie usuwa sesji Studio. Po podejrzeniu wycieku sesji usuń rekordy `StudioSession` dla właściciela w bazie BeKaPaKa i zrotuj osobne `STUDIO_GEMINI_API_KEY` / `STUDIO_CMS_TOKEN`, jeśli wyciek dotyczył także tych sekretów. Pliki `data/studio` i kopie zapasowe zawierają prywatne materiały; nie dodawaj ich do Git.

## 9. Tokeny agenta Studio (MCP)

Tokeny `bkpk_agent_…` dają zewnętrznemu agentowi (Claude, Cursor) dostęp do `https://studio.bekapaka.pl/api/studio/v1/mcp`: odczyt schematów, faktów i publikacji, tworzenie roboczych publikacji i propozycje tekstów kanałów roboczych. Nie pozwalają potwierdzać faktów, zatwierdzać, publikować ani zmieniać ustawień.

- Baza przechowuje wyłącznie SHA-256 tokenu; wartość widać jeden raz przy tworzeniu (Studio → Ustawienia → Agent).
- Po wycieku: Studio → Ustawienia → Agent → **Odwołaj** (działa od następnego żądania), utwórz nowy token i podmień go w konfiguracji klienta MCP (`~/.cursor/mcp.json`, konfiguracja Claude). Tokenu nie zapisuj w repozytorium.
- Zmiana `STUDIO_OWNER_ID` unieważnia wszystkie tokeny poprzedniego właściciela.
- Limit: 5 aktywnych tokenów, 120 żądań na minutę na token.

## 10. Token zapisu CMS dla Studio (`STUDIO_CMS_WRITE_TOKEN`)

Studio tworzy szkice aktualności w Strapi i publikuje je dopiero po zatwierdzeniu wariantu „Strona” przez właściciela.

- Utwórz w panelu Strapi (Settings → API Tokens) token typu **Custom**, bez daty wygaśnięcia lub z rotacją, z uprawnieniami wyłącznie: `News-post`: find, findOne, create, update · `Media-record`: find, create, update · `Upload`: upload. Bez delete, bez innych typów treści.
- Wpisz go tylko w `/opt/bekapaka-stats/.env` jako `STUDIO_CMS_WRITE_TOKEN=…` i odtwórz backend: `docker compose -f docker-compose.prod.yml up -d --no-deps bkpk-backend`.
- Po wycieku: odwołaj token w Strapi (natychmiast blokuje zapis), utwórz nowy, podmień w `.env`, odtwórz backend. Szkice już utworzone pozostają w CMS.
- Podgląd na stronie używa istniejącego `PREVIEW_SECRET` (przekazywanego do backendu jako `STUDIO_SITE_PREVIEW_SECRET`). Rotacja `PREVIEW_SECRET` wymaga odtworzenia `bkpk-site`, `bkpk-cms` i `bkpk-backend`.
- Odczytowy `STUDIO_CMS_TOKEN` (import treści z CMS) to osobny token typu **Read-only**.
