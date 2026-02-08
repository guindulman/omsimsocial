<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Creates the Postgres database used by the test suite if it doesn't exist.
// This repo uses Postgres for tests (see backend/phpunit.xml).

$root = realpath(__DIR__ . '/..');
if ($root === false) {
    fwrite(STDERR, "Unable to resolve backend root.\n");
    exit(1);
}

Dotenv::createImmutable($root)->safeLoad();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '5432';
$user = $_ENV['DB_USERNAME'] ?? 'postgres';
$pass = $_ENV['DB_PASSWORD'] ?? '';

// Database to connect to while creating other databases.
$adminDb = $_ENV['DB_ADMIN_DATABASE'] ?? 'postgres';

// Name of the database used for tests.
$testDb = $_ENV['DB_TEST_DATABASE'] ?? 'omsim_test';

$dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $adminDb);

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $stmt = $pdo->prepare('SELECT 1 FROM pg_database WHERE datname = ?');
    $stmt->execute([$testDb]);

    if ($stmt->fetchColumn()) {
        fwrite(STDOUT, "Database already exists: {$testDb}\n");
        exit(0);
    }

    $quoted = '"' . str_replace('"', '""', $testDb) . '"';
    $pdo->exec("CREATE DATABASE {$quoted}");

    fwrite(STDOUT, "Created database: {$testDb}\n");
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "Failed to create test database: {$e->getMessage()}\n");
    exit(1);
}

