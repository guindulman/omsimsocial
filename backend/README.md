# OmsimSocial Core v2 API (Laravel)

API-only Laravel backend for OmsimSocial Core v2.

## Requirements
- PHP 8.3
- Composer
- PostgreSQL 14+

## Setup
```bash
cd backend
cp .env.example .env
```

Update `.env` with your database credentials:
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=omsimsocial
DB_USERNAME=postgres
DB_PASSWORD=secret
FILESYSTEM_DISK=public
```

Install dependencies and prepare the app:
```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```

## Run
```bash
php artisan serve
```

Queue (database driver for dev):
```bash
php artisan queue:work
```

## Tests
```bash
php artisan test
```

## Notes
- File uploads use the `public` disk for local development.
- Rate limiting is enabled for invites, reactions, and adoptions.
