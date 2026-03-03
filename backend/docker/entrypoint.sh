#!/bin/sh
set -eu

cd /var/www/html

STORAGE_LINK="public/storage"
EXPECTED_TARGET="/var/www/html/storage/app/public"
CURRENT_TARGET=""

if [ -L "$STORAGE_LINK" ]; then
  CURRENT_TARGET="$(readlink "$STORAGE_LINK" || true)"
fi

if [ "$CURRENT_TARGET" != "$EXPECTED_TARGET" ]; then
  rm -f "$STORAGE_LINK" || true
  php artisan storage:link >/dev/null 2>&1 || true
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
