# Docker setup for omsimsocial.com

Docker configuration for the Omsim Social Laravel backend and services.

## Services

| Service | Port | Description |
|---|---:|---|
| app | 8000 | Laravel (nginx + PHP 8.3) |
| queue | - | Laravel queue worker |
| reverb | 8080 | Laravel Reverb (WebSockets) |
| postgres | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 |

## Prerequisites

- Docker and Docker Compose
- `backend/.env` (copy from `backend/.env.example`) with at least:
  - `DB_HOST=postgres`
  - `REDIS_HOST=redis`
  - `REVERB_SERVER_HOST=0.0.0.0`
  - `APP_URL=https://omsimsocial.com` (or `http://localhost:8000` for local)

Optional:
- Use a single `backend/.env` for both Laravel and docker-compose variables (recommended).
  - Set `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, and `OMSIM_STORAGE_PATH` in `backend/.env`.
  - Run docker compose with `--env-file backend/.env` so the compose variables are loaded.

## Commands

```bash
# Build and start all services
docker compose --env-file backend/.env up -d --build

# Generate app key if missing
docker compose --env-file backend/.env exec app php artisan key:generate

# Run migrations (first time or after pull)
docker compose --env-file backend/.env exec app php artisan migrate --force

# Create the public storage symlink (needed for /storage URLs)
docker compose --env-file backend/.env exec app php artisan storage:link

# View logs
docker compose --env-file backend/.env logs -f app
docker compose --env-file backend/.env logs -f queue
docker compose --env-file backend/.env logs -f reverb
```

## URLs (local)

- App: `http://localhost:8000`
- Reverb (WebSockets): `ws://localhost:8080`

## Production (omsimsocial.com)

- Put a reverse proxy (e.g. Caddy, nginx, Traefik) in front of:
  - app: port 80 -> 8000
  - reverb: websockets -> 8080
- Use strong `DB_PASSWORD` and keep secrets out of git.

### Persistent Uploads (Recommended)

Uploads are stored on the `public` disk and should survive redeploys. Set `OMSIM_STORAGE_PATH` to an absolute host path.

Example on Ubuntu:

```bash
sudo mkdir -p /opt/omsimsocial/storage
# Alpine www-data is typically uid/gid 82 inside the container.
sudo chown -R 82:82 /opt/omsimsocial/storage || true
sudo chmod -R 775 /opt/omsimsocial/storage
```
