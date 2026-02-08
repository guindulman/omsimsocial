# Production Checklist (Backend)

This project uses a Laravel backend (`backend/`) with Postgres.

## Environment

- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Set `APP_URL` to your public HTTPS URL
- Set a real `APP_KEY`
- Set `LOG_LEVEL=info` (or `warning`)
- Configure Postgres: `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- Configure mail (for password resets / notifications): `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`
- Configure storage for uploads (avatars/covers):
  - Local: `FILESYSTEM_DISK=public` + ensure persistent storage
  - Or switch to S3 and set `AWS_*`
- If you use queues: set `QUEUE_CONNECTION=database` (or `redis`) and run a worker
- If you use caching: prefer `CACHE_STORE=redis` in production

## Deploy Steps

1. Install dependencies (`composer install --no-dev --optimize-autoloader`)
2. Run migrations: `php artisan migrate --force`
3. Ensure storage link: `php artisan storage:link`
4. Cache config/routes/views (after env is correct):
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`
5. Run a queue worker if enabled:
   - `php artisan queue:work`
6. If using Reverb/WebSockets, run the Reverb server (and open the port) per your infra setup.

## Security

- Use HTTPS everywhere.
- Rate limiting is enabled for auth/register and auth/login in `backend/routes/api.php`.
- Review CORS settings if you expose the API publicly.

