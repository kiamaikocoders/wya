import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { gdprService } from '@/lib/gdpr-service';
import { consentService } from '@/lib/consent-service';
import { MEDIA_CONSENT_VERSION, PRIVACY_POLICY_VERSION } from '@/legal/policy-versions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  PowerOff,
  Save,
  Download,
  UserX,
  Database,
  MessageSquareText,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/maps/LocationPicker';
import { TwoFactorSettings } from '@/components/auth/TwoFactorSettings';
import {
  getPushSubscriptionStatus,
  isOneSignalSupported,
  subscribeToPushNotifications,
  syncPushSubscriptionWithPreference,
  type PushSubscriptionStatus,
} from '@/lib/onesignal';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SettingsForm = {
  full_name: string;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  profile_visibility: string;
  two_factor_auth: boolean;
  location_consent: boolean;
  organizer_content_sharing_opt_in: boolean;
  media_recording_promotional_consent: boolean;
  phone: string;
  date_of_birth: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsForm>({
    full_name: '',
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    profile_visibility: 'public',
    two_factor_auth: false,
    location_consent: false,
    organizer_content_sharing_opt_in: true,
    media_recording_promotional_consent: false,
    phone: '',
    date_of_birth: '',
    location: '',
    latitude: null,
    longitude: null,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const [pushStatus, setPushStatus] = useState<PushSubscriptionStatus | null>(null);
  const [pushPromptOpen, setPushPromptOpen] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const refreshPushStatus = async () => {
    const status = await getPushSubscriptionStatus();
    setPushStatus(status);
    return status;
  };

  const enablePushOnThisDevice = async () => {
    if (!user?.id) return false;
    setIsEnablingPush(true);
    try {
      setSettings((prev) => ({ ...prev, push_notifications: true }));

      const result = await subscribeToPushNotifications(user.id);

      if (result.ok) {
        await userService.updateProfile({ push_notifications: true });
        queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
        toast.success('Push notifications enabled on this device');
        await refreshPushStatus();
        return true;
      }

      if (result.reason === 'denied') {
        toast.error(
          'Notifications are blocked. In Chrome: click the lock icon in the address bar → Site settings → Notifications → Allow.'
        );
      } else if (result.reason === 'dismissed') {
        toast.message('Click Allow when your browser asks for notification permission.');
      } else if (result.reason === 'sdk_not_ready') {
        const initError = pushStatus?.initError ?? (await refreshPushStatus()).initError;
        if (initError && /not configured for web push/i.test(initError)) {
          toast.error(
            'Web push is not set up in OneSignal yet. In the OneSignal dashboard: Settings → Platforms → Web → Custom Code, set Site URL to http://localhost:8080, enable “Treat HTTP localhost as HTTPS”, and set the service worker path to /push/onesignal/.'
          );
        } else {
          toast.error(
            'OneSignal is still loading or blocked. Disable ad blockers for localhost, refresh, then try again.'
          );
        }
      } else if (result.reason === 'opt_in_failed') {
        toast.error(
          'Browser allowed notifications but push setup failed. Check OneSignal dashboard Site URL is http://localhost:8080'
        );
      } else {
        toast.error('Push notifications are not supported in this browser.');
      }

      await refreshPushStatus();
      return false;
    } catch (error) {
      console.error('Enable push failed:', error);
      toast.error('Could not enable push notifications');
      return false;
    } finally {
      setIsEnablingPush(false);
    }
  };

  /** Run on button click — native prompt must be first await (user gesture). */
  const handleAllowNotificationsClick = () => {
    setPushPromptOpen(false);
    void enablePushOnThisDevice();
  };

  const { data: dsarList = [], refetch: refetchDsar } = useQuery({
    queryKey: ['dataSubjectRequests', user?.id],
    queryFn: () => gdprService.listMyDataSubjectRequests(15),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profile) return;
    setSettings({
      full_name: profile.full_name ?? '',
      email_notifications: profile.email_notifications ?? true,
      push_notifications: profile.push_notifications ?? true,
      marketing_emails: profile.marketing_consent ?? false,
      profile_visibility: profile.profile_visibility ?? 'public',
      two_factor_auth: profile.two_factor_auth ?? false,
      location_consent: profile.location_consent ?? false,
      organizer_content_sharing_opt_in: profile.organizer_content_sharing_opt_in ?? true,
      media_recording_promotional_consent: profile.media_consent ?? false,
      phone: profile.phone ?? '',
      date_of_birth: profile.date_of_birth ?? '',
      location: profile.location ?? '',
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
    });
  }, [profile]);

  useEffect(() => {
    if (!user?.id || !profile || !isOneSignalSupported()) return;

    void refreshPushStatus().then((status) => {
      const wantsPush = profile.push_notifications ?? true;
      if (!status.active && wantsPush) {
        setPushPromptOpen(true);
      }
    });
  }, [user?.id, profile?.id, profile?.push_notifications]);

  const [searchParams] = useSearchParams();
  const locationSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('focus') !== 'location') return;
    const t = window.setTimeout(() => {
      locationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchParams, profile?.id]);

  const handleSaveSettings = async () => {
    if (!user?.id || !profile) return;
    try {
      await userService.updateProfile({
        full_name: settings.full_name.trim() || undefined,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_consent: settings.marketing_emails,
        location_consent: settings.location_consent,
        organizer_content_sharing_opt_in: settings.organizer_content_sharing_opt_in,
        media_consent: settings.media_recording_promotional_consent,
        profile_visibility: settings.profile_visibility,
        phone: settings.phone.trim() || null,
        date_of_birth: settings.date_of_birth || null,
        location: settings.location.trim() || undefined,
        latitude: settings.latitude ?? undefined,
        longitude: settings.longitude ?? undefined,
        location_source: 'user',
        location_confirm_needed: false,
      });

      await syncPushSubscriptionWithPreference(settings.push_notifications, {
        promptIfNeeded: settings.push_notifications,
        userId: user.id,
      });

      if (settings.marketing_emails !== (profile.marketing_consent ?? false)) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'marketing',
          granted: settings.marketing_emails,
          policyVersion: PRIVACY_POLICY_VERSION,
        });
      }
      if (settings.location_consent !== (profile.location_consent ?? false)) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'location',
          granted: settings.location_consent,
          policyVersion: PRIVACY_POLICY_VERSION,
        });
      }
      if (
        settings.organizer_content_sharing_opt_in !== (profile.organizer_content_sharing_opt_in ?? true)
      ) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'organizer_content_sharing',
          granted: settings.organizer_content_sharing_opt_in,
          policyVersion: PRIVACY_POLICY_VERSION,
        });
      }
      if (
        settings.media_recording_promotional_consent !== (profile.media_consent ?? false)
      ) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'media',
          granted: settings.media_recording_promotional_consent,
          policyVersion: MEDIA_CONSENT_VERSION,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const runExport = async () => {
    if (!user?.id) return;
    let reqId: string | null = null;
    try {
      const row = await gdprService.createDataSubjectRequest({ request_type: 'export' });
      reqId = row.id;
      await gdprService.updateDataSubjectRequest(row.id, { status: 'processing' });
      const data = await gdprService.exportUserData(user.id, { silent: true });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wya-data-export-${user.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await gdprService.updateDataSubjectRequest(row.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: { bytes: blob.size },
      });
      toast.success('Download started');
      refetchDsar();
    } catch (e) {
      console.error(e);
      if (reqId) {
        await gdprService.updateDataSubjectRequest(reqId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          failure_reason: e instanceof Error ? e.message : 'export failed',
        });
      }
      toast.error('Export failed');
      refetchDsar();
    }
  };

  const runAnonymize = async () => {
    if (!user?.id) return;
    if (!window.confirm('Anonymize your profile and posts? This cannot be undone.')) return;
    let reqId: string | null = null;
    try {
      const row = await gdprService.createDataSubjectRequest({ request_type: 'anonymize' });
      reqId = row.id;
      await gdprService.updateDataSubjectRequest(row.id, { status: 'processing' });
      await gdprService.anonymizeUserData(user.id, { silent: true });
      await gdprService.updateDataSubjectRequest(row.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      toast.success('Account anonymized');
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      refetchDsar();
    } catch (e) {
      console.error(e);
      if (reqId) {
        await gdprService.updateDataSubjectRequest(reqId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          failure_reason: e instanceof Error ? e.message : 'failed',
        });
      }
      toast.error('Anonymization failed');
      refetchDsar();
    }
  };

  const handleDeactivateAccount = async () => {
    if (
      !window.confirm(
        'Deactivate your account? You will be signed out and will not be able to sign in again. Your profile and data are removed. This cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await userService.deactivateAccount();
      toast.success('Account deactivated');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to deactivate account. Is delete-my-account deployed?'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-promo pb-20">
      <AlertDialog open={pushPromptOpen} onOpenChange={setPushPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable push notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              WYA will ask your browser for permission. Choose <strong>Allow</strong> to get
              alerts for follows, events, and messages even when this tab is in the background.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <Button
              type="button"
              className="bg-kenya-orange hover:bg-kenya-orange/90 text-white"
              disabled={isEnablingPush}
              onClick={handleAllowNotificationsClick}
            >
              {isEnablingPush ? 'Enabling…' : 'Allow notifications'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="h-8 w-8 text-gradient-orange-accent" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-promo border-white/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription className="text-text-white/70">
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-black/20 border-kenya-brown/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Name</Label>
                  <Input
                    value={settings.full_name}
                    onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                    className="bg-black/20 border-kenya-brown/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Phone</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="Optional"
                    className="bg-black/20 border-kenya-brown/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Date of birth</Label>
                  <Input
                    type="date"
                    value={settings.date_of_birth}
                    onChange={(e) => setSettings({ ...settings, date_of_birth: e.target.value })}
                    className="bg-black/20 border-kenya-brown/30 text-white"
                  />
                  <p className="text-xs text-text-white/60 mt-1">
                    Used for age-restricted content (e.g. alcohol-related sponsor zones).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-promo border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-text-white/70">
                  Service and marketing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Email notifications</Label>
                    <p className="text-sm text-text-white/70">Account and essential updates</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_notifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Push notifications</Label>
                    <p className="text-sm text-text-white/70">
                      {pushStatus?.active
                        ? 'Enabled on this browser'
                        : 'In-app and device push where supported'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => {
                      setSettings({ ...settings, push_notifications: checked });
                      if (checked) {
                        setPushPromptOpen(true);
                      }
                    }}
                  />
                </div>
                {isOneSignalSupported() && pushStatus && !pushStatus.webPushConfigured && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                    <p className="text-sm text-white font-medium">Web push needs OneSignal setup</p>
                    <p className="text-xs text-text-white/70">
                      In OneSignal: Settings → Platforms → Web → Custom Code. Site URL:{' '}
                      <code className="text-amber-200">{window.location.origin}</code>. Service worker:{' '}
                      <code className="text-amber-200">/push/onesignal/OneSignalSDKWorker.js</code>.
                      Enable “Treat HTTP localhost as HTTPS” for local dev.
                    </p>
                  </div>
                )}
                {isOneSignalSupported() && !pushStatus?.active && (
                  <div className="rounded-lg border border-kenya-orange/40 bg-kenya-orange/10 p-4 space-y-3">
                    <p className="text-sm text-white">
                      Turn on browser push so you get alerts when WYA is in the background.
                    </p>
                    <Button
                      type="button"
                      className="bg-kenya-orange hover:bg-kenya-orange/90 text-white"
                      disabled={isEnablingPush}
                      onClick={handleAllowNotificationsClick}
                    >
                      Enable push on this device
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Marketing</Label>
                    <p className="text-sm text-text-white/70">Promotions and partner events</p>
                  </div>
                  <Switch
                    checked={settings.marketing_emails}
                    onCheckedChange={(checked) => setSettings({ ...settings, marketing_emails: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-promo border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy
                </CardTitle>
                <CardDescription className="text-text-white/70">
                  Consent and visibility (KDPA)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div ref={locationSectionRef} id="settings-location" className="space-y-3 scroll-mt-24">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-kenya-orange" />
                    <Label className="text-white">Your location</Label>
                  </div>
                  <p className="text-sm text-text-white/70">
                    Used for nearby events and recommendations. Confirm a pin after searching or using
                    GPS.
                  </p>
                  <LocationPicker
                    mode="user"
                    compact
                    showMap={false}
                    title=""
                    description=""
                    initialLocation={
                      settings.latitude != null &&
                      settings.longitude != null &&
                      settings.location
                        ? {
                            address: settings.location,
                            latitude: settings.latitude,
                            longitude: settings.longitude,
                          }
                        : undefined
                    }
                    onLocationSelect={(loc) => {
                      setSettings((prev) => ({
                        ...prev,
                        location: loc.address,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        location_consent: true,
                      }));
                    }}
                    onLocationClear={() => {
                      setSettings((prev) => ({
                        ...prev,
                        location: '',
                        latitude: null,
                        longitude: null,
                      }));
                    }}
                  />
                  <p className="text-sm text-text-white/70">
                    Start typing to see places, tap Search, or use My Location.
                  </p>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Location-based features</Label>
                    <p className="text-sm text-text-white/70">
                      Consent for processing location when you enable it on your device
                    </p>
                  </div>
                  <Switch
                    checked={settings.location_consent}
                    onCheckedChange={(checked) => setSettings({ ...settings, location_consent: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Share event posts with organisers</Label>
                    <p className="text-sm text-text-white/70">
                      For promotion per our{' '}
                      <Link to="/privacy-policy" className="text-kenya-orange underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                  <Switch
                    checked={settings.organizer_content_sharing_opt_in}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, organizer_content_sharing_opt_in: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Promotional photos, video, and audio</Label>
                    <p className="text-sm text-text-white/70">
                      See the{' '}
                      <Link to="/media-consent" className="text-kenya-orange underline">
                        Media consent
                      </Link>{' '}
                      form.
                    </p>
                  </div>
                  <Switch
                    checked={settings.media_recording_promotional_consent}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, media_recording_promotional_consent: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Profile visibility</Label>
                    <p className="text-sm text-text-white/70">Who can see your profile</p>
                  </div>
                  <select
                    value={settings.profile_visibility}
                    onChange={(e) => setSettings({ ...settings, profile_visibility: e.target.value })}
                    className="bg-black/20 border-kenya-brown/30 text-white rounded px-3 py-1"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                {user?.id ? (
                  <TwoFactorSettings userId={user.id} variant="dark" layout="row" />
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-gradient-promo border-white/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" />
                  Feedback
                </CardTitle>
                <CardDescription className="text-text-white/70">
                  Suggest improvements or report issues. You are signed in, so we can follow up if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" asChild className="gap-2">
                  <Link to="/feedback">Send feedback</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-promo border-white/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Your data (KDPA)
                </CardTitle>
                <CardDescription className="text-text-white/70">
                  Access, portability, and erasure requests are logged for compliance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="gap-2" onClick={runExport}>
                    <Download className="h-4 w-4" />
                    Download my data
                  </Button>
                  <Button variant="outline" className="gap-2 border-white/30 text-white" onClick={runAnonymize}>
                    <UserX className="h-4 w-4" />
                    Anonymize account
                  </Button>
                </div>
                {dsarList.length > 0 && (
                  <div className="rounded-md border border-white/10 p-3 text-sm text-text-white/80">
                    <p className="font-medium text-white mb-2">Recent requests</p>
                    <ul className="space-y-1">
                      {dsarList.map((r) => (
                        <li key={r.id} className="flex justify-between gap-2">
                          <span>
                            {r.request_type} · {r.status}
                          </span>
                          <span className="text-text-white/60">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveSettings}
              className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
            >
              <Save className="h-4 w-4 mr-2" />
              Save settings
            </Button>
          </div>

          <Separator className="my-8 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/20" />

          <Card className="bg-red-900/20 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400">Account deactivation</CardTitle>
              <CardDescription className="text-red-300">
                Deactivate your account to end access permanently. You will be signed out; sign-in is disabled and
                your profile data is removed through the secure account closure flow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeactivateAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
