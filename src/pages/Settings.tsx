import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Shield, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    profile_visibility: 'public',
    two_factor_auth: false
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const handleSaveSettings = async () => {
    try {
      await userService.updateProfile(settings);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      setIsEditing(false);
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await userService.deleteAccount();
        toast.success('Account deleted successfully');
        // Redirect to login or home
        window.location.href = '/';
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account');
      }
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
    <div className="min-h-screen bg-kenya-dark pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="h-8 w-8 text-kenya-orange" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Settings */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription className="text-kenya-brown-light">
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
                    value={profile?.name || ''}
                    disabled
                    className="bg-black/20 border-kenya-brown/30 text-white"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-kenya-brown-light">
                  Control your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-kenya-brown-light">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, email_notifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Push Notifications</Label>
                    <p className="text-sm text-kenya-brown-light">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, push_notifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Marketing Emails</Label>
                    <p className="text-sm text-kenya-brown-light">Receive promotional content</p>
                  </div>
                  <Switch
                    checked={settings.marketing_emails}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, marketing_emails: checked})
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription className="text-kenya-brown-light">
                  Manage your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Profile Visibility</Label>
                    <p className="text-sm text-kenya-brown-light">Who can see your profile</p>
                  </div>
                  <select
                    value={settings.profile_visibility}
                    onChange={(e) => setSettings({...settings, profile_visibility: e.target.value})}
                    className="bg-black/20 border-kenya-brown/30 text-white rounded px-3 py-1"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Two-Factor Authentication</Label>
                    <p className="text-sm text-kenya-brown-light">Add extra security</p>
                  </div>
                  <Switch
                    checked={settings.two_factor_auth}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, two_factor_auth: checked})
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveSettings}
                className="bg-kenya-brown hover:bg-kenya-brown-dark"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          )}

          <Separator className="my-8 bg-kenya-brown/20" />

          {/* Danger Zone */}
          <Card className="bg-red-900/20 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-red-300">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
