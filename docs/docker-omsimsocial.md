# Docker setup for omsimsocial.com

Docker configuration for the Omsim Social Laravel backend and services.

## Services

| Service   | Port  | Description                    |
|----------|-------|--------------------------------|
| **app**  | 8000  | Laravel (nginx + PHP 8.3)      |
| **queue**| —     | Laravel queue worker           |
| **reverb** | 8080 | Laravel Reverb (WebSockets)  |
| **postgres** | 5432 | PostgreSQL 16              |
| **redis**   | 6379 | Redis 7                      |

## Prerequisites

- Docker and Docker Compose
- `backend/.env` (from `backend/.env.example`) with at least:
  - `DB_HOST=postgres`
  - `REDIS_HOST=redis`
  - `REVERB_SERVER_HOST=0.0.0.0`
  - `APP_URL=https://omsimsocial.com` (or `http://localhost:8000` for local)

Optional: copy `.env.docker.example` to `.env` in the project root to set `DB_PASSWORD` (default `postgres`) for the Postgres container.

## Commands

```bash
# Build and start all services
docker compose up -d --build

# Run migrations (first time or after pull)
docker compose exec app php artisan migrate --force

# Generate app key if missing
docker compose exec app php artisan key:generate

# View logs
docker compose logs -f app
docker compose logs -f queue
docker compose logs -f reverb
```

## URLs (local)

- App: http://localhost:8000
- Reverb (WebSockets): ws://localhost:8080

## Production (omsimsocial.com)

- Put a reverse proxy (e.g. Caddy, nginx, Traefik) in front of the **app** (port 80 → 8000) and **reverb** (e.g. `/reverb` → 8080).
- Set `APP_URL`, `REVERB_HOST`, and `REVERB_SCHEME` for production.
- Use strong `DB_PASSWORD` and store secrets in your host or orchestrator (e.g. Hostinger VPS env).
