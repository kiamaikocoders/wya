import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateService } from '@/lib/update-service';

const DownloadApp = () => {
  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    releaseNotes?: string;
  } | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [hasUpdate, setHasUpdate] = useState(false);

  const apkUrl = '/downloads/wya-app.apk';
  const updateUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    // Get current version
    const current = updateService.getCurrentVersion();
    setCurrentVersion(current);

    // Fetch version info
    fetch(`${updateUrl}/api/app-version.json`)
      .then((res) => res.json())
      .then((data) => {
        setVersionInfo(data);
        // Check if update is available
        const updateCheck = updateService.compareVersions(data.version, current);
        setHasUpdate(updateCheck > 0);
      })
      .catch((error) => {
        console.error('Error fetching version info:', error);
      });
  }, [updateUrl]);

  const handleDownload = () => {
    // Open download link
    window.open(apkUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kenya-dark via-kenya-brown to-kenya-orange">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Download WYA App
            </h1>
            <p className="text-xl text-white/90 mb-2">
              Discover and connect with events happening in Kenya
            </p>
            {currentVersion && (
              <p className="text-sm text-white/70">
                Current version: {currentVersion}
              </p>
            )}
          </div>

          {/* Update Available Banner */}
          {hasUpdate && versionInfo && (
            <Card className="mb-6 border-kenya-orange bg-kenya-orange/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-kenya-orange" />
                  <CardTitle className="text-kenya-orange">Update Available!</CardTitle>
                </div>
                <CardDescription className="text-white/80">
                  Version {versionInfo.version} is now available
                </CardDescription>
              </CardHeader>
              {versionInfo.releaseNotes && (
                <CardContent>
                  <p className="text-sm text-white/70 mb-4">{versionInfo.releaseNotes}</p>
                  <Button onClick={handleDownload} className="bg-kenya-orange hover:bg-kenya-orange/90">
                    <Download className="mr-2 h-4 w-4" />
                    Download Update
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {/* Download Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Download the WYA Android app to discover events, connect with the community, and never miss out on what's happening in Kenya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Version Info */}
              {versionInfo && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Latest Version</p>
                    <p className="text-lg font-semibold">{versionInfo.version}</p>
                  </div>
                  {!hasUpdate && currentVersion === versionInfo.version && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
              )}

              {/* Download Button */}
              <Button
                size="lg"
                className="w-full bg-kenya-orange hover:bg-kenya-orange/90 text-white h-14 text-lg"
                onClick={handleDownload}
              >
                <Download className="mr-3 h-6 w-6" />
                Download APK
              </Button>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-kenya-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Discover Events</p>
                    <p className="text-sm text-gray-600">
                      Find concerts, festivals, meetups, and more happening near you
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-kenya-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Connect & Share</p>
                    <p className="text-sm text-gray-600">
                      Join the community, share stories, and connect with other event-goers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-kenya-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Get Notifications</p>
                    <p className="text-sm text-gray-600">
                      Stay updated with event reminders and community updates
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-kenya-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Offline Access</p>
                    <p className="text-sm text-gray-600">
                      Access your saved events and favorites even without internet
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installation Instructions */}
          <Card className="mt-6 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>
                Follow these steps to install the WYA app on your Android device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-gray-700">
                  <span className="font-semibold">Download the APK</span>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    Tap the download button above to download the APK file to your device
                  </p>
                </li>
                <li className="text-gray-700">
                  <span className="font-semibold">Enable Unknown Sources</span>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    Go to Settings → Security → Enable "Install from Unknown Sources" or "Install Unknown Apps"
                  </p>
                </li>
                <li className="text-gray-700">
                  <span className="font-semibold">Open the APK</span>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    Open your Downloads folder and tap on the downloaded APK file
                  </p>
                </li>
                <li className="text-gray-700">
                  <span className="font-semibold">Install</span>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    Tap "Install" when prompted. The app will be installed on your device
                  </p>
                </li>
                <li className="text-gray-700">
                  <span className="font-semibold">Launch & Enjoy</span>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    Open the WYA app from your app drawer and start discovering events!
                  </p>
                </li>
              </ol>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The app will automatically check for updates when you open it. 
                  You'll be notified when a new version is available for download.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className="mt-6 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Can't install the APK?</strong> Make sure "Install from Unknown Sources" is enabled in your Android settings.
              </p>
              <p>
                <strong>Download not starting?</strong> Try using a different browser or check your internet connection.
              </p>
              <p>
                <strong>App crashes after installation?</strong> Make sure you're downloading the latest version and that your Android version is 5.0 or higher.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DownloadApp;

