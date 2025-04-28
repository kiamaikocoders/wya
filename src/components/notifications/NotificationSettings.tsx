
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Smartphone, Info, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notification';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    notification_types: {
      event_updates: true,
      messages: true,
      announcements: true,
      system: true,
      reviews: true
    }
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userSettings = await notificationService.getNotificationSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  const handleToggleSetting = (path: string, value: boolean) => {
    const pathParts = path.split('.');
    
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings };
      
      if (pathParts.length === 1) {
        return {
          ...prevSettings,
          [pathParts[0]]: value
        };
      } else if (pathParts.length === 2) {
        return {
          ...prevSettings,
          [pathParts[0]]: {
            ...(prevSettings[pathParts[0] as keyof typeof prevSettings] as Record<string, boolean>),
            [pathParts[1]]: value
          }
        };
      }
      return prevSettings;
    });
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      await notificationService.updateNotificationSettings(settings);
      toast.success('Notification settings saved');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-kenya-orange" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-kenya-orange" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Channels</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(value) => handleToggleSetting('email_notifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.push_notifications}
                  onCheckedChange={(value) => handleToggleSetting('push_notifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                </div>
                <Switch
                  id="in-app-notifications"
                  checked={settings.in_app_notifications}
                  onCheckedChange={(value) => handleToggleSetting('in_app_notifications', value)}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Types</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="event-updates">Event Updates</Label>
                <Switch
                  id="event-updates"
                  checked={settings.notification_types.event_updates}
                  onCheckedChange={(value) => handleToggleSetting('notification_types.event_updates', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="messages">Messages</Label>
                <Switch
                  id="messages"
                  checked={settings.notification_types.messages}
                  onCheckedChange={(value) => handleToggleSetting('notification_types.messages', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="announcements">Announcements</Label>
                <Switch
                  id="announcements"
                  checked={settings.notification_types.announcements}
                  onCheckedChange={(value) => handleToggleSetting('notification_types.announcements', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="system">System Notifications</Label>
                <Switch
                  id="system"
                  checked={settings.notification_types.system}
                  onCheckedChange={(value) => handleToggleSetting('notification_types.system', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="reviews">Reviews & Ratings</Label>
                <Switch
                  id="reviews"
                  checked={settings.notification_types.reviews}
                  onCheckedChange={(value) => handleToggleSetting('notification_types.reviews', value)}
                />
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-muted rounded-lg">
              <Info className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                You will always receive important account and security notifications.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Settings'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
