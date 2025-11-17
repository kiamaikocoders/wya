# OTA Updates & APK Distribution Setup

## ✅ What's Been Implemented

### 1. **App Icons Updated** ✅
- Generated all required Android icon sizes from `public/wya logo.png`
- Replaced icons in all `mipmap-*` folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Icons are now ready for the next APK build

### 2. **OTA Update System** ✅
- Created `src/lib/update-service.ts` - Handles version checking and update notifications
- Integrated into `App.tsx` - Automatically checks for updates on app start and when app comes to foreground
- Works with Vercel hosting - Checks your Vercel deployment for new versions

### 3. **Download Page** ✅
- Created `src/pages/DownloadApp.tsx` - Beautiful download page with:
  - Version information
  - Update notifications
  - Installation instructions
  - Feature highlights
  - Troubleshooting guide
- Accessible at `/download` route

### 4. **Vercel Configuration** ✅
- Created `vercel.json` - Configures APK file serving with proper headers
- APK files are served with correct MIME type and download headers

### 5. **Version API** ✅
- Created `public/api/app-version.json` - Version information endpoint
- Contains: version, buildNumber, downloadUrl, releaseNotes, releaseDate

### 6. **APK Distribution** ✅
- Created `public/downloads/` folder
- Copied current APK to `public/downloads/wya-app.apk`
- Ready for Vercel deployment

## 📱 How It Works

### For Users:
1. **Initial Install**: Users visit `your-app.vercel.app/download` and download the APK
2. **Automatic Updates**: When users open the app, it checks for updates:
   - Compares installed version with latest version from API
   - Shows notification if update is available
   - Prompts user to download new APK if needed

### For You (Developer):
1. **Make Changes**: Push code changes to GitHub
2. **Vercel Auto-Deploys**: Your web app updates automatically on Vercel
3. **Release New APK** (when needed):
   - Build new APK: `npm run android:build && cd android && ./gradlew assembleDebug`
   - Update version in `src/lib/update-service.ts` (APK_VERSION)
   - Update version in `public/api/app-version.json`
   - Copy new APK to `public/downloads/wya-app.apk`
   - Push to GitHub → Vercel deploys → Users get notified

## 🔧 Configuration

### Update These Values:

1. **`src/lib/update-service.ts`**:
   ```typescript
   const APK_VERSION = '1.0.0'; // Update when releasing new APK
   const UPDATE_URL = process.env.VITE_APP_URL || 'https://your-app.vercel.app';
   ```

2. **`public/api/app-version.json`**:
   ```json
   {
     "version": "1.0.0", // Update when releasing new APK
     "buildNumber": "1",
     "releaseNotes": "Your release notes here"
   }
   ```

3. **Environment Variable** (optional, for Vercel):
   - Set `VITE_APP_URL` in Vercel dashboard to your deployment URL
   - This ensures update checks use the correct URL

## 📋 Workflow for Releasing Updates

### Minor Updates (Web Only):
1. Make changes to your React app
2. Push to GitHub
3. Vercel automatically deploys
4. **Note**: For true OTA updates (without APK reinstall), you'd need Capacitor 7+ with Live Updates plugin

### Major Updates (New APK):
1. Make changes to your React app
2. Update `APK_VERSION` in `src/lib/update-service.ts`
3. Update version in `public/api/app-version.json`
4. Build new APK:
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```
5. Copy APK to downloads folder:
   ```bash
   cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/wya-app.apk
   ```
6. Push to GitHub → Vercel deploys
7. Users will be notified of the update when they open the app

## 🎯 Next Steps

1. **Deploy to Vercel**: Push your changes to GitHub and deploy to Vercel
2. **Update URLs**: Replace `https://your-app.vercel.app` with your actual Vercel URL
3. **Test Download Page**: Visit `/download` on your deployed site
4. **Test Update Check**: Install the app and verify update checking works
5. **Rebuild APK with New Icons**: 
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```

## 📝 Notes

- **Current Setup**: Uses version checking + APK download (works with Capacitor 6)
- **Future Enhancement**: To enable true OTA updates (no APK reinstall), upgrade to Capacitor 7 and use `@capacitor/live-updates`
- **Version Format**: Uses semantic versioning (e.g., "1.0.0", "1.1.0", "2.0.0")
- **Update Frequency**: Checks for updates on app start and when app comes to foreground

## 🐛 Troubleshooting

### Update check not working?
- Verify `UPDATE_URL` is set correctly
- Check that `public/api/app-version.json` is accessible
- Ensure Vercel is serving the API endpoint correctly

### Download not working?
- Check `vercel.json` configuration
- Verify APK file exists at `public/downloads/wya-app.apk`
- Check Vercel deployment logs

### Icons not updating?
- Rebuild APK after replacing icons
- Clear app cache on device
- Uninstall and reinstall app

---

**Status**: ✅ All systems implemented and ready for deployment!

