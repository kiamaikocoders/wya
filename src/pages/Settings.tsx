import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Settings as SettingsIcon, User, Bell, Shield, Trash2, Save, Download, UserX, Database } from 'lucide-react';
import { toast } from 'sonner';

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
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

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
    });
  }, [profile]);

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
        two_factor_auth: settings.two_factor_auth,
        phone: settings.phone.trim() || null,
        date_of_birth: settings.date_of_birth || null,
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

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Permanently delete your account and data? You will be signed out. This cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await userService.deleteAccount();
      toast.success('Account deleted');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete account. Is delete-my-account deployed?'
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
                    <p className="text-sm text-text-white/70">In-app / device push where supported</p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, push_notifications: checked })
                    }
                  />
                </div>
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
                <div className="flex items-center justify-between opacity-60">
                  <div>
                    <Label className="text-white">Two-factor authentication</Label>
                    <p className="text-sm text-text-white/70">Coming soon</p>
                  </div>
                  <Switch
                    checked={settings.two_factor_auth}
                    disabled
                    onCheckedChange={(checked) => setSettings({ ...settings, two_factor_auth: checked })}
                  />
                </div>
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
              <CardTitle className="text-red-400">Danger zone</CardTitle>
              <CardDescription className="text-red-300">
                Permanently delete your account via the secure delete function (removes auth user).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
