import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/user-service';
import { notificationService } from '@/lib/notification/notification-service';
import type { NotificationSettings } from '@/lib/notification/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

const ANDROID_APK_URL = '/downloads/wya-app.apk';
const IOS_DOWNLOAD_URL = '/download';

type SettingsTab = 'account' | 'notifications' | 'security' | 'support' | 'app';

const SIDEBAR: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'support', label: 'Support' },
  { id: 'app', label: 'App' },
];

/**
 * Figma redesign Account Settings — sidebar, hero, row list (light + dark).
 */
const WebSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [twoFactor, setTwoFactor] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<SettingsTab, React.RefObject<HTMLDivElement | null>> = {
    account: accountRef,
    notifications: notificationsRef,
    security: securityRef,
    support: supportRef,
    app: appRef,
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profile) return;
    setProfileVisibility(profile.profile_visibility || 'public');
    setTwoFactor(Boolean(profile.two_factor_auth));
  }, [profile?.id, profile?.profile_visibility, profile?.two_factor_auth]);

  useEffect(() => {
    if (!user?.id) return;
    void notificationService
      .getNotificationSettings()
      .then(setNotifSettings)
      .catch((err) => console.error('Failed to load notification settings', err));
  }, [user?.id]);

  const scrollTo = (tab: SettingsTab) => {
    setActiveTab(tab);
    sectionRefs[tab].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const persistProfilePrefs = async (patch: {
    profile_visibility?: string;
    two_factor_auth?: boolean;
  }) => {
    if (!user?.id) return;
    setSavingToggle(true);
    try {
      await userService.updateProfile(patch);
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(msg);
    } finally {
      setSavingToggle(false);
    }
  };

  const persistNotifPrefs = async (next: NotificationSettings) => {
    setSavingToggle(true);
    setNotifSettings(next);
    try {
      await notificationService.updateNotificationSettings(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save notification settings';
      toast.error(msg);
      try {
        setNotifSettings(await notificationService.getNotificationSettings());
      } catch {
        /* ignore */
      }
    } finally {
      setSavingToggle(false);
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
      setPasswordOpen(false);
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
      <div className={cn('flex justify-center py-16', companion.page)}>
        <div
          className={cn(
            'h-10 w-10 animate-spin rounded-full border-t-2 border-b-2',
            companion.spinner
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12', companion.page)}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex w-full shrink-0 flex-row gap-1 overflow-x-auto rounded-xl p-2 lg:w-[240px] lg:flex-col lg:overflow-visible',
            companion.card
          )}
        >
          {SIDEBAR.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'bg-[#f6f8fa] font-semibold text-[#ff6b35] dark:bg-[#0d1117]'
                    : cn('font-normal', companion.muted, 'hover:text-[#0d1117] dark:hover:text-[#e6edf3]')
                )}
              >
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="relative h-20 overflow-hidden rounded-xl">
            <img
              src="/companion/settings-hero.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-black/20" />
            <h1 className="absolute left-6 top-1/2 -translate-y-1/2 text-[28px] font-bold text-white">
              Settings
            </h1>
          </div>

          <section ref={sectionRefs.account} className="scroll-mt-24 space-y-1">
            <SectionLabel>Password</SectionLabel>
            <SettingsRow
              icon="🔒"
              title="Change password"
              description="Update your login credentials"
              onClick={() => setPasswordOpen(true)}
            />
          </section>

          <section ref={sectionRefs.notifications} className="scroll-mt-24 space-y-1">
            <SectionLabel>Email notifications</SectionLabel>
            <div className="space-y-0">
              <SettingsRow
                icon="📧"
                title="Event reminders"
                description="Get notified before events start"
                trailing={
                  <OrangeSwitch
                    checked={notifSettings?.notification_types.event_updates ?? true}
                    disabled={savingToggle || !notifSettings}
                    onCheckedChange={(checked) => {
                      if (!notifSettings) return;
                      void persistNotifPrefs({
                        ...notifSettings,
                        email_notifications: true,
                        notification_types: {
                          ...notifSettings.notification_types,
                          event_updates: checked,
                        },
                      });
                    }}
                  />
                }
              />
              <SettingsRow
                icon="📬"
                title="Weekly digest"
                description="Curated events in your city"
                trailing={
                  <OrangeSwitch
                    checked={notifSettings?.marketing_consent ?? false}
                    disabled={savingToggle || !notifSettings}
                    onCheckedChange={(checked) => {
                      if (!notifSettings) return;
                      void persistNotifPrefs({
                        ...notifSettings,
                        marketing_consent: checked,
                      });
                    }}
                  />
                }
              />
              <SettingsRow
                icon="🎫"
                title="Ticket updates"
                description="Confirmations and transfers"
                trailing={
                  <OrangeSwitch
                    checked={notifSettings?.notification_types.tickets ?? true}
                    disabled={savingToggle || !notifSettings}
                    onCheckedChange={(checked) => {
                      if (!notifSettings) return;
                      void persistNotifPrefs({
                        ...notifSettings,
                        email_notifications: true,
                        notification_types: {
                          ...notifSettings.notification_types,
                          tickets: checked,
                        },
                      });
                    }}
                  />
                }
              />
            </div>
          </section>

          <section ref={sectionRefs.security} className="scroll-mt-24 space-y-1">
            <SectionLabel>Privacy</SectionLabel>
            <div className="space-y-0">
              <SettingsRow
                icon="👁"
                title="Profile visibility"
                description="Control who sees your activity"
                onClick={() => setVisibilityOpen(true)}
              />
              <SettingsRow
                icon="🔐"
                title="Two-factor auth"
                description="Add an extra layer of security"
                trailing={
                  <OrangeSwitch
                    checked={twoFactor}
                    disabled={savingToggle}
                    onCheckedChange={(checked) => {
                      setTwoFactor(checked);
                      void persistProfilePrefs({ two_factor_auth: checked });
                    }}
                  />
                }
              />
            </div>
          </section>

          <section ref={sectionRefs.support} className="scroll-mt-24 space-y-1">
            <SectionLabel>Support</SectionLabel>
            <div className="space-y-0">
              <SettingsRow
                as={Link}
                to="/faq"
                icon="❓"
                title="FAQ"
                description="Common questions answered"
              />
              <SettingsRow
                as={Link}
                to="/contact"
                icon="✉️"
                title="Contact us"
                description="Reach the WYA team"
              />
              <SettingsRow
                as={Link}
                to="/feedback"
                icon="💬"
                title="Send feedback"
                description="Help us improve the app"
              />
            </div>

            <div className="pt-2 space-y-1">
              <SectionLabel>Legal</SectionLabel>
              <div className="space-y-0">
                <SettingsRow
                  as={Link}
                  to="/terms-of-service"
                  icon="📄"
                  title="Terms of Service"
                />
                <SettingsRow
                  as={Link}
                  to="/privacy-policy"
                  icon="🔏"
                  title="Privacy Policy"
                />
              </div>
            </div>
          </section>

          <section ref={sectionRefs.app} className="scroll-mt-24 space-y-1 pb-4">
            <SectionLabel>Get the app</SectionLabel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={IOS_DOWNLOAD_URL}
                className="inline-flex transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              >
                <img
                  src="/companion/badge-app-store.svg"
                  alt="Download on the App Store"
                  className="h-10 w-auto"
                  width={120}
                  height={40}
                />
              </a>
              <a
                href={ANDROID_APK_URL}
                className="inline-flex transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                download
              >
                <img
                  src="/companion/badge-google-play.svg"
                  alt="Get it on Google Play"
                  className="h-10 w-auto"
                  width={135}
                  height={40}
                />
              </a>
            </div>
            <p className={cn('pt-1 text-xs', companion.muted)}>
              Android installs via our APK download. iOS uses the download page until the App Store
              listing is live.
            </p>
          </section>
        </div>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className={cn(companion.surface, companion.border, companion.heading)}>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription className={companion.muted}>
              Update your login credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-new-password" className={companion.heading}>
                New password
              </Label>
              <Input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={companion.input}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-confirm-password" className={companion.heading}>
                Confirm password
              </Label>
              <Input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={companion.input}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                className={cn(companion.border, companion.heading)}
              >
                Cancel
              </Button>
              <Button type="submit" className={companion.accentBtn} disabled={changingPassword}>
                {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={visibilityOpen} onOpenChange={setVisibilityOpen}>
        <DialogContent className={cn(companion.surface, companion.border, companion.heading)}>
          <DialogHeader>
            <DialogTitle>Profile visibility</DialogTitle>
            <DialogDescription className={companion.muted}>
              Control who sees your activity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(
              [
                { value: 'public', label: 'Public', desc: 'Anyone can find your basic profile' },
                { value: 'private', label: 'Private', desc: 'Only you can see your profile details' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setProfileVisibility(opt.value);
                  void persistProfilePrefs({ profile_visibility: opt.value }).then(() => {
                    setVisibilityOpen(false);
                    toast.success(`Visibility set to ${opt.label.toLowerCase()}`);
                  });
                }}
                className={cn(
                  'flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left transition',
                  companion.border,
                  profileVisibility === opt.value
                    ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                    : cn(companion.surface, 'hover:border-[#ff6b35]/40')
                )}
              >
                <span className={cn('text-sm font-medium', companion.heading)}>{opt.label}</span>
                <span className={cn('text-xs', companion.muted)}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={cn('px-0.5 text-[13px] font-semibold', companion.muted)}>{children}</p>;
}

function OrangeSwitch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="h-6 w-11 data-[state=checked]:bg-[#ff6b35] data-[state=unchecked]:bg-[#d0d7dd] dark:data-[state=unchecked]:bg-[#30363d]"
    />
  );
}

type SettingsRowProps = {
  icon: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  as?: typeof Link;
  to?: string;
};

function SettingsRow({
  icon,
  title,
  description,
  trailing,
  onClick,
  as,
  to,
}: SettingsRowProps) {
  const className = cn(
    'mb-1.5 flex h-[52px] w-full items-center gap-3 px-4 transition last:mb-0',
    companion.card,
    'rounded-[10px]',
    (onClick || as) && 'hover:border-[#ff6b35]/40'
  );

  const body = (
    <>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg border text-base',
          companion.border,
          'bg-[#f6f8fa] dark:bg-[#1c2233]'
        )}
      >
        <span aria-hidden>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', companion.heading)}>{title}</p>
        {description ? (
          <p className={cn('truncate text-xs', companion.muted)}>{description}</p>
        ) : null}
      </div>
      {trailing ?? (
        <ChevronRight className={cn('h-5 w-5 shrink-0', companion.muted)} aria-hidden />
      )}
    </>
  );

  if (as && to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, 'text-left')}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

export default WebSettings;
