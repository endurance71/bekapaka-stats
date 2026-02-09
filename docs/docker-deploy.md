# Deploy Docker / VPS

## Wymagania
- Docker
- Docker Compose
- Otwarty port 8080 (frontend) oraz 4000 (backend) lub przekierowanie przez reverse proxy.

## Pliki
- `frontend/Dockerfile` – build Vite i serwowanie przez nginx.
- `backend/Dockerfile` – API Express.
- `docker/nginx.conf` – fallback do `index.html` dla SPA.
- `docker-compose.yml` – uruchomienie dwóch usług na sieci `app-network`.

## Komendy
```bash
docker compose build
docker compose up -d
```

Zatrzymanie:
```bash
docker compose down
```

Aktualizacja (po zmianach w repo):
```bash
docker compose build
docker compose up -d
```

## Porty
- Frontend: `http://<VPS_IP>:8080`
- Backend: `http://<VPS_IP>:4000`

Jeśli używasz reverse proxy (nginx/traefik), wystaw tylko port 80/443 i przekieruj na usługę `frontend`.
