# omsimsocial.com - Laravel backend
# PHP 8.3 + nginx, multi-stage build with Composer and Vite assets

FROM php:8.5-fpm-alpine AS base

RUN apk add --no-cache \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    linux-headers \
    $PHPIZE_DEPS

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    pgsql \
    zip \
    intl \
    opcache \
    sockets \
    gd \
    pcntl

# Redis for cache/sessions
RUN pecl install redis && docker-php-ext-enable redis

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/html

# ---- Builder: install deps and build assets ----
FROM base AS builder

RUN apk add --no-cache nodejs npm

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
# Laravel expects this directory for package discovery cache during build.
RUN mkdir -p bootstrap/cache storage/framework/{cache,sessions,views} \
    && chown -R www-data:www-data bootstrap/cache storage \
    && chmod -R 775 bootstrap/cache storage
RUN composer dump-autoload --optimize

RUN npm install --no-audit --no-fund \
    && npm run build \
    && rm -rf node_modules

# ---- Production image ----
FROM base AS production

RUN apk add --no-cache nginx supervisor

COPY --from=builder /var/www/html /var/www/html
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisord.conf

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
