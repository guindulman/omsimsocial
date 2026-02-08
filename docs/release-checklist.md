# Release Checklist (Mobile)

The mobile app lives in `mobile/` and is built with Expo.

## Configure API URL

Set the production API base URL with:

- `EXPO_PUBLIC_API_URL=https://YOUR_API_DOMAIN/api/v1`

This is read in `mobile/src/api/client.ts`.

## Disable Placeholder Social Login Buttons

Social login buttons are hidden by default. To show them (after implementing real auth), set:

- `EXPO_PUBLIC_SOCIAL_AUTH_ENABLED=true`

## EAS (Recommended)

1. Install EAS CLI: `npm i -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build:
   - iOS: `eas build -p ios --profile production`
   - Android: `eas build -p android --profile production`

## Store Links On Landing Page

The landing page download buttons use backend env vars:

- `IOS_APP_STORE_URL`
- `ANDROID_PLAY_STORE_URL`

Set those in your backend production env after your listings are live.

