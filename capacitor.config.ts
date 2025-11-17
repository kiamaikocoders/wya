import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wya.whereyouat',
  appName: 'WYA - Where You At',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development, you can uncomment this to use your dev server:
    // url: 'http://localhost:8080',
    // cleartext: true
  },
  // Live Updates configuration for OTA updates
  liveUpdates: {
    appId: 'com.wya.whereyouat',
    channel: 'production',
    // Update this URL with your actual Vercel deployment URL
    // Or set VITE_APP_URL environment variable in Vercel dashboard
    // The app will use window.location.origin at runtime if not set
    updateUrl: process.env.VITE_APP_URL || 'https://your-app.vercel.app',
    updateMethod: 'background',
    maxVersions: 2,
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set this when you're ready to sign your app
      keystoreAlias: undefined,
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

