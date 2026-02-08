# Testing

## Backend (Laravel)

The backend test suite is configured to use Postgres (not SQLite) because the current PHP setup does not include the SQLite driver.

### 1) Create a Test Database

Create an empty Postgres database named `omsim_test` using the same Postgres server as your normal dev database.

If you have permission to create databases from your configured Postgres user, you can run:

```bash
php scripts/create_test_db.php
```

### 2) Run Tests

From `backend/`:

```bash
php artisan test
```

Notes:
- The database name used by phpunit is set in `backend/phpunit.xml` (`DB_DATABASE=omsim_test`).
- Host/user/password come from your local `backend/.env` (or environment variables).
