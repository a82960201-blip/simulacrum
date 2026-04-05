# SIMULACRUM — APK Build Guide (v2)

## What you need installed
- **Node.js 18+** → https://nodejs.org
- **Android Studio** (with Android SDK + Build Tools) → https://developer.android.com/studio
- **Java 17 JDK** → comes with Android Studio, or install separately

---

## One-time setup

```bash
# 1. Go into the game folder
cd simulacrum

# 2. Install Capacitor dependencies
npm install

# 3. Add the Android platform (only do this ONCE)
npx cap add android
```

---

## Every time you make changes

```bash
# Sync your web files into the Android project
npx cap sync android

# Open Android Studio (then build from there)
npx cap open android
```

---

## Building the APK in Android Studio

1. Wait for Gradle sync to finish (bottom progress bar)
2. Go to: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Click **"locate"** in the popup, or find it at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Install on your phone

**Option A — USB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B — File transfer:**
- Copy `app-debug.apk` to your phone
- Settings → Apps → Install unknown apps → allow your file manager
- Tap the APK and install

---

## Performance tuning

Renders at **45% res** on mobile (pixelated VHS look + speed).
If slow, open `js/game.js` and lower:
```js
const RENDER_SCALE = isMobile ? 0.35 : 0.75;  // try 0.3 on old devices
```

---

## Force landscape (recommended)

In Android Studio, open:
`android/app/src/main/AndroidManifest.xml`

Find `<activity` and add:
```xml
android:screenOrientation="sensorLandscape"
```
