import { App } from '@capacitor/app';
import * as LiveUpdates from '@capacitor/live-updates';
import { Capacitor } from '@capacitor/core';

// Version of the current APK - update this when you release a new APK
// This is only used for major APK updates (when native code changes)
const APK_VERSION = '1.0.0';

// Your Vercel deployment URL - update this with your actual Vercel URL
const UPDATE_URL = import.meta.env.VITE_APP_URL || window.location.origin;

interface VersionInfo {
  version: string;
  buildNumber: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

export const updateService = {
  /**
   * Check for Live Updates (OTA updates for web content)
   * This automatically downloads and applies updates without APK reinstall
   */
  async checkForLiveUpdates(): Promise<{ hasUpdate: boolean; downloaded: boolean }> {
    try {
      // Only check on native platforms
      if (!Capacitor.isNativePlatform()) {
        return { hasUpdate: false, downloaded: false };
      }

      // Skip Live Updates if URL is invalid/placeholder
      // Allow window.location.origin for same-domain updates
      if (!UPDATE_URL || UPDATE_URL.includes('your-app.vercel.app')) {
        console.log('Live Updates: Invalid or placeholder URL, skipping');
        return { hasUpdate: false, downloaded: false };
      }

      try {
        // Set Live Updates configuration first
        await LiveUpdates.setConfig({
          appId: 'com.wya.whereyouat',
          channel: 'production',
          updateUrl: UPDATE_URL,
        });

        // Sync with Live Updates server
        const result = await LiveUpdates.sync();

        if (result.available) {
          // Update is available and will be downloaded automatically
          // Reload app to apply the update
          await LiveUpdates.reload();
          return { hasUpdate: true, downloaded: true };
        }

        return { hasUpdate: false, downloaded: false };
      } catch (error) {
        console.error('Live Updates sync failed:', error);
        // Don't crash - just return no update
        return { hasUpdate: false, downloaded: false };
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // Don't crash - just return no update
      return { hasUpdate: false, downloaded: false };
    }
  },

  /**
   * Check for major APK updates (when native code changes)
   * This is a fallback when Live Updates can't handle the update
   */
  async checkForAPKUpdate(): Promise<{ hasUpdate: boolean; version?: string }> {
    try {
      // Check version endpoint
      const response = await fetch(`${UPDATE_URL}/api/app-version.json`);
      if (!response.ok) {
        return { hasUpdate: false };
      }

      const versionInfo: VersionInfo = await response.json();

      // Compare versions
      if (this.compareVersions(versionInfo.version, APK_VERSION) > 0) {
        return {
          hasUpdate: true,
          version: versionInfo.version,
        };
      }

      return { hasUpdate: false };
    } catch (error) {
      console.error('Error checking APK version:', error);
      return { hasUpdate: false };
    }
  },

  /**
   * Compare two version strings
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  },

  /**
   * Show update notification to user (for APK updates only)
   */
  async promptForAPKUpdate(newVersion: string, releaseNotes?: string): Promise<boolean> {
    const message = releaseNotes
      ? `A new app version (${newVersion}) is available!\n\n${releaseNotes}\n\nThis requires downloading a new APK. Would you like to download it?`
      : `A new app version (${newVersion}) is available! This requires downloading a new APK. Would you like to download it?`;

    return window.confirm(message);
  },

  /**
   * Initialize update checking
   * Call this when app starts and when app comes to foreground
   */
  async initialize() {
    // Don't block app startup - check updates asynchronously
    // Use setTimeout to ensure app loads first
    setTimeout(async () => {
      try {
        await this.checkAndApplyUpdates();
      } catch (error) {
        console.error('Update check failed on startup:', error);
        // Don't crash the app
      }
    }, 2000); // Wait 2 seconds after app loads

    // Listen for app state changes
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        // Check for updates when app comes to foreground
        setTimeout(async () => {
          try {
            await this.checkAndApplyUpdates();
          } catch (error) {
            console.error('Update check failed on foreground:', error);
            // Don't crash the app
          }
        }, 1000);
      }
    });
  },

  /**
   * Check for updates and apply automatically (Live Updates) or notify (APK updates)
   */
  async checkAndApplyUpdates() {
    // First, try Live Updates (seamless OTA)
    const liveUpdateResult = await this.checkForLiveUpdates();

    if (liveUpdateResult.downloaded) {
      // Live update was downloaded and app will reload automatically
      return;
    }

    // If Live Updates didn't find anything, check for major APK updates
    const apkUpdateResult = await this.checkForAPKUpdate();

    if (apkUpdateResult.hasUpdate && apkUpdateResult.version) {
      // Major update available - requires APK download
      try {
        const response = await fetch(`${UPDATE_URL}/api/app-version.json`);
        const versionInfo: VersionInfo = await response.json();

        const shouldDownload = await this.promptForAPKUpdate(
          apkUpdateResult.version,
          versionInfo.releaseNotes
        );

        if (shouldDownload) {
          // Open download page
          window.open(`${UPDATE_URL}/download`, '_blank');
        }
      } catch (error) {
        console.error('Error fetching version info:', error);
      }
    }
  },

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return APK_VERSION;
  },

  /**
   * Get current Live Updates config (if available)
   */
  async getCurrentLiveUpdateConfig(): Promise<any> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return null;
      }

      const config = await LiveUpdates.getConfig();
      return config || null;
    } catch (error) {
      console.error('Error getting Live Update config:', error);
      return null;
    }
  },
};
