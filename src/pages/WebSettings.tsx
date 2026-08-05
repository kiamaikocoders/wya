import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/user-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

/**
 * PDF light-web settings: password, email notifications, basic privacy.
 * Push / theme / app-only prefs stay in the native app.
 */
const WebSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profile) return;
    setEmailNotifications(profile.email_notifications ?? true);
    setMarketingEmails(Boolean(profile.marketing_consent));
    setProfileVisibility(profile.profile_visibility || 'public');
  }, [profile?.id, profile?.email_notifications, profile?.marketing_consent, profile?.profile_visibility]);

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await userService.updateProfile({
        email_notifications: emailNotifications,
        marketing_consent: marketingEmails,
        profile_visibility: profileVisibility,
      });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      toast.success('Settings saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8 pb-28 space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Core account preferences. App-only options (push, theme) are in the WYA app.
        </p>
      </div>

      <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-semibold">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="web-new-password">New password</Label>
          <Input
            id="web-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="web-confirm-password">Confirm password</Label>
          <Input
            id="web-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" variant="outline" disabled={changingPassword}>
          {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>

      <form onSubmit={(e) => void handleSavePrefs(e)} className="space-y-5 rounded-2xl border border-border p-5">
        <h2 className="font-semibold">Notifications & privacy</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted-foreground">Ticket and event updates by email</p>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Marketing emails</p>
            <p className="text-xs text-muted-foreground">Occasional product and event news</p>
          </div>
          <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Public profile</p>
            <p className="text-xs text-muted-foreground">Allow others to find your basic profile in the app</p>
          </div>
          <Switch
            checked={profileVisibility === 'public'}
            onCheckedChange={(checked) => setProfileVisibility(checked ? 'public' : 'private')}
          />
        </div>
        <Button type="submit" className="w-full bg-kenya-orange text-kenya-dark hover:bg-kenya-orange/90" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save preferences
        </Button>
      </form>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/profile" className="text-primary underline-offset-4 hover:underline">
          Edit profile
        </Link>
        <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
          Contact support
        </Link>
        <Link to="/faq" className="text-primary underline-offset-4 hover:underline">
          FAQ
        </Link>
        <Link to="/download" className="text-primary underline-offset-4 hover:underline">
          Get the app
        </Link>
      </div>
    </div>
  );
};

export default WebSettings;
