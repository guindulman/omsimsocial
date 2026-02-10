# Google Play Store Release (EAS)

This project is configured to build Android **App Bundles (`.aab`)** with EAS for Play Store releases.

## 1) One-Time IDs (Do Not Change After Publish)

- Android package: `com.guindulman.omsimsocial` (set in `mobile/app.json`)
- Expo owner/slug: `@guindulman/omsim-social` (used for Expo Go OAuth redirect)

## 2) Prereqs

```bash
npm i -g eas-cli
eas login
eas whoami
```

## 3) Production Build Env (Already Wired)

`mobile/eas.json` contains production env for:
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_REVERB_*`
- `EXPO_PUBLIC_SOCIAL_AUTH_ENABLED`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

If you prefer not to commit these values, remove them from `eas.json` and set them as EAS Secrets instead.

## 4) Google Login On Android (Required For Store Build)

Mobile production builds need an **Android OAuth Client ID**:
- Set `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` for Android builds
- Add the same client ID(s) to backend `GOOGLE_CLIENT_IDS` (comma-separated)

Important:
- APKs you sideload are signed with your **upload key**.
- Apps installed from Play are signed with the **Play App Signing** key.
- These usually have **different SHA-1 fingerprints**, so you may need **two** Android OAuth clients (one per SHA-1).

Where to get SHA-1 fingerprints:
- Upload key: `eas credentials -p android`
- Play signing key: Play Console -> App integrity -> App signing key certificate

Recommended setup:
- `preview` builds (APK): use the **upload-key** Android client ID in `mobile/eas.json` (preview env).
- `production` builds (AAB/Play): use the **play-signing** Android client ID in `mobile/eas.json` (production env).
- Backend `GOOGLE_CLIENT_IDS` should include both client IDs.

## 5) Build AAB For Play Store

```bash
cd mobile
eas build -p android --profile production
```

Result: an `.aab` artifact (upload this to Play Console).

## 6) Submit To Play (Optional Automation)

You can submit with EAS if you configure Play credentials:
```bash
cd mobile
eas submit -p android --profile production
```

Otherwise, upload the `.aab` manually in Play Console.

## 7) Versioning For Updates

Every Play Store update must increment `android.versionCode` in `mobile/app.json`.

