# OmsimSocial Core v2 Mobile (Expo)

React Native (Expo) client for the Core v2 MVP.

## Requirements
- Node.js 18+
- Expo CLI

## Setup
```bash
cd mobile
npm install
```

Set the API URL (defaults to localhost):
```bash
set EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Optional realtime (self-hosted Reverb):
```bash
set EXPO_PUBLIC_REVERB_APP_KEY=local
set EXPO_PUBLIC_REVERB_HOST=localhost
set EXPO_PUBLIC_REVERB_PORT=8080
set EXPO_PUBLIC_REVERB_TLS=false
```

## Run
```bash
npm run start
```

## Notes
- Use the Dev Switch in People tab to swap between seeded users (Ari/Bea).
- Media uploads use Expo Image Picker for photo/video.
