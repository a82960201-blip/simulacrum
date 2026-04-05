# SIMULACRUM — APK Build Guide

## Prerequisites
- Node.js 18+
- Android Studio (with SDK + NDK installed)
- Java 17 (JDK)

---

## Steps

### 1. Install dependencies
```bash
cd simulacrum
npm install
```

### 2. Initialize Capacitor (first time only)
```bash
npx cap init simulacrum com.simulacrum.game --web-dir .
```

### 3. Add Android platform (first time only)
```bash
npx cap add android
```

### 4. Sync web files into the Android project
```bash
npx cap sync android
```

### 5. Open in Android Studio
```bash
npx cap open android
```

### 6. Build APK in Android Studio
- In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Performance notes

The game uses **render scale 0.45** on mobile (renders at 45% resolution, upscales to full screen).
This gives the intentional VHS pixelated look AND keeps framerate smooth on mid-range phones.

If still slow on very old devices, open `js/game.js` and lower `RENDER_SCALE` to `0.3`.

---

## Sideload the APK
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or transfer the APK file directly to your phone and install with "Install unknown apps" enabled.

---

## Publish to Play Store
- Build a **signed release APK** or **AAB** via:
  - Build → Generate Signed Bundle / APK
- Follow [Capacitor's publishing guide](https://capacitorjs.com/docs/android)
