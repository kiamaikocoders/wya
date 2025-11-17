# Android APK Build Guide for WYA

This guide explains how to build your WYA web app as an Android APK using Capacitor.

## 📱 What We've Set Up

Your React web app has been configured to work as an Android app using Capacitor, which wraps your web app in a native Android WebView container.

### Key Components:
- **Capacitor**: Bridges your web app to native Android features
- **WebView**: Displays your React app inside the Android app
- **Native Plugins**: Access to camera, location, keyboard, status bar, etc.

## 🛠️ Prerequisites

Before building, you need:

1. **Java JDK 11 or higher**
   ```bash
   java -version  # Check if installed
   ```

2. **Android SDK** (Command Line Tools)
   - Download from: https://developer.android.com/studio#command-tools
   - Or install Android Studio (you don't need to use it, just need the SDK)

3. **Set ANDROID_HOME environment variable**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   ```

## 📦 Building Your APK

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Your Web App
```bash
npm run build
```
This creates the `dist/` folder with your optimized React app.

### Step 3: Sync to Android
```bash
npx cap sync android
```
This copies your web assets to the Android project and updates plugins.

### Step 4: Build the APK

**Option A: Debug APK (for testing)**
```bash
cd android
./gradlew assembleDebug
```
APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Release APK (for distribution)**
```bash
cd android
./gradlew assembleRelease
```
APK will be at: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

**Note**: Release APKs need to be signed. See "Signing Your App" below.

### Quick Build Script
You can also use the convenience script:
```bash
npm run android:build
```
This runs `npm run build` and `cap sync android` together.

## 🔐 Signing Your App (For Release)

To distribute your app, you need to sign it:

1. **Generate a keystore** (one-time):
   ```bash
   keytool -genkey -v -keystore wya-release-key.keystore -alias wya -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create signing config** in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('path/to/wya-release-key.keystore')
               storePassword 'your-store-password'
               keyAlias 'wya'
               keyPassword 'your-key-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               // ... other release config
           }
       }
   }
   ```

3. **Build signed APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## 🚀 Development Workflow

### Testing on Device/Emulator:

1. **Connect Android device** via USB (enable USB debugging)
   OR
   **Start Android emulator**

2. **Run the app**:
   ```bash
   npm run android:dev
   ```
   This builds, syncs, and launches the app.

### Live Reload (Development):
For development, you can use:
```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Open Android Studio or use CLI
npx cap open android
# Then run from Android Studio with "Run" button
```

Then configure `capacitor.config.ts` to point to your dev server:
```typescript
server: {
  url: 'http://YOUR_IP:8080',
  cleartext: true
}
```

## 📋 Project Structure

```
wya/
├── android/                 # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/        # MainActivity.java (WebView wrapper)
│   │   │   ├── res/         # Icons, splash screens, strings
│   │   │   └── assets/      # Your web app files (copied from dist/)
│   │   └── build.gradle     # Android build config
│   └── build.gradle         # Root build config
├── dist/                    # Built web app (generated)
├── capacitor.config.ts      # Capacitor configuration
└── package.json             # NPM scripts and dependencies
```

## 🔧 Configuration Files

### `capacitor.config.ts`
- App ID: `com.wya.whereyouat`
- App Name: `WYA - Where You At`
- Web Directory: `dist`
- Android settings and plugin configs

### `android/app/src/main/AndroidManifest.xml`
- App permissions (camera, location, storage, etc.)
- App metadata and activities

### `android/app/src/main/res/values/strings.xml`
- App name and package info

## 🎨 Customizing App Icon & Splash Screen

### App Icon:
Replace icons in `android/app/src/main/res/mipmap-*/ic_launcher*.png`
- Use Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/

### Splash Screen:
Edit `android/app/src/main/res/drawable*/splash.png`
Or configure in `capacitor.config.ts` under `plugins.SplashScreen`

## 🐛 Troubleshooting

### "Command not found: gradlew"
```bash
cd android
chmod +x gradlew
```

### "SDK location not found"
Set `ANDROID_HOME` environment variable:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### "Build failed: minSdkVersion"
Check `android/variables.gradle` for minimum SDK version (should be 22+)

### Web assets not updating
Run `npx cap sync android` after every `npm run build`

### App crashes on launch
- Check Android logs: `adb logcat`
- Verify `dist/` folder exists and has `index.html`
- Check `capacitor.config.ts` webDir is set to `dist`

## 📱 Permissions Explained

Your app requests these permissions:
- **INTERNET**: Load web content
- **ACCESS_NETWORK_STATE**: Check connectivity
- **ACCESS_FINE_LOCATION**: For maps and event locations
- **CAMERA**: For photo uploads
- **READ_MEDIA_IMAGES**: Access gallery (Android 13+)
- **READ_MEDIA_VIDEO**: Access video gallery (Android 13+)

Users will be prompted to grant these permissions when needed.

## 🎯 Next Steps

1. **Test the debug APK** on a device
2. **Customize app icon** with your WYA logo
3. **Set up signing** for release builds
4. **Test all features** (camera, location, file uploads)
5. **Build release APK** when ready to distribute

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Gradle Build System](https://gradle.org/)

## ⚠️ Important Notes

- **Your web app code doesn't change** - it's the same React app
- **Build web first**: Always run `npm run build` before syncing to Android
- **Version control**: The `android/` folder is part of your repo, but build artifacts are gitignored
- **No Android Studio needed**: You can build entirely from command line

---

**Questions?** Check Capacitor docs or Android developer resources for more help.

