# Monitoring / Analytics (Starter)

## Backend

- Logging: configure `LOG_LEVEL` and ship logs to your provider (Render/Fly/DO, etc.).
- Error tracking (recommended): add Sentry (Laravel) or an equivalent.
- Uptime checks: Laravel exposes `GET /up` by default.

## Mobile

- Crash reporting (recommended): Sentry (React Native / Expo) or an equivalent.
- Product analytics: keep it minimal early (activation, retention, key flows).

## Security Signals

- Track auth abuse: failed logins, repeated registrations from the same IP/device.
- Add alerts for spikes in `429` responses (rate-limits), `500`s, and queue failures.

