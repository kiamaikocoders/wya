import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/user-service';
import { storageService } from '@/lib/storage-service';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { eventService } from '@/lib/event-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { resolveCategoryImage } from '@/pages/events/conceptDUtils';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

const FALLBACK_GALLERY = [
  '/landing/hero-crowd.jpg',
  '/landing/cta-rooftop.png',
  '/landing/story-1.jpg',
];

/**
 * Figma redesign profile — cover, orange-ring avatar, form + image stack.
 * Email is read-only; change uses the existing Supabase change-email flow.
 */
const WebProfile = () => {
  const { user, updateUser, changeEmail } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: galleryEvents = [] } = useQuery({
    queryKey: ['homeFeedEvents', 'profile-gallery'],
    queryFn: () => eventService.getHomeFeedEvents(6),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
    }
  }, [profile?.id, profile?.full_name, profile?.bio]);

  const currentEmail = user?.email || '';
  const displayName = fullName || profile?.full_name || user?.full_name || user?.name || '';
  const avatarUrl = resolveAvatarUrl(
    profile?.avatar_url || user?.avatar_url || user?.profile_picture
  );
  const initials = (displayName || currentEmail || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const galleryImages = [
    ...galleryEvents
      .map((e) => e.image_url || resolveCategoryImage(e.category))
      .filter(Boolean),
    ...FALLBACK_GALLERY,
  ].slice(0, 3);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await storageService.uploadAvatar(file, user.id);
      await userService.updateProfile({ avatar_url: uploaded.publicUrl });
      await updateUser({ profile_picture: uploaded.publicUrl, avatar_url: uploaded.publicUrl });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      toast.success('Profile photo updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const name = fullName.trim();
      if (!name) {
        toast.error('Name is required');
        setSaving(false);
        return;
      }
      await userService.updateProfile({ full_name: name, bio: bio.trim() });
      await updateUser({ name, full_name: name });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      toast.success('Profile updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = newEmail.trim().toLowerCase();
    if (!next || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (next === currentEmail.toLowerCase()) {
      toast.error('That is already your current email');
      return;
    }
    setChangingEmail(true);
    try {
      await changeEmail(next);
      setEmailDialogOpen(false);
      setNewEmail('');
    } catch {
      /* AuthContext already toasts */
    } finally {
      setChangingEmail(false);
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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_432px]">
        <div className="relative">
          <div className="relative h-[180px] overflow-hidden rounded-2xl sm:h-[200px]">
            <img
              src="/companion/profile-hero.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/50" />
          </div>

          <div className="relative -mt-12 mb-4 ml-1 inline-block">
            <div className="relative">
              <Avatar className="size-24 border-2 border-[#ff6b35] bg-white dark:bg-[#161b22]">
                <AvatarImage src={avatarUrl || undefined} alt="" />
                <AvatarFallback className="bg-white text-xl text-[#ff6b35] dark:bg-[#161b22]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className={cn(
                  'absolute bottom-0 right-0 h-8 w-8 rounded-full',
                  companion.border,
                  companion.surface
                )}
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                aria-label="Change photo"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleAvatarChange(e)}
              />
            </div>
          </div>

          <h1 className={cn('mb-5 text-2xl font-bold', companion.heading)}>Profile</h1>

          <form onSubmit={(e) => void handleSave(e)} className="max-w-xl space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="web-profile-name"
                className={cn('text-[13px] font-medium', companion.heading)}
              >
                Full name
              </Label>
              <Input
                id="web-profile-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className={cn('h-11', companion.input)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="web-profile-email"
                className={cn('text-[13px] font-medium', companion.heading)}
              >
                Email
              </Label>
              <Input
                id="web-profile-email"
                type="email"
                value={currentEmail}
                disabled
                readOnly
                className={cn('h-11 opacity-80', companion.input)}
              />
              <p className={cn('text-xs', companion.muted)}>
                Email changes require confirmation on the new address.
              </p>
              <Button
                type="button"
                variant="outline"
                className={cn('mt-1', companion.border, companion.heading)}
                onClick={() => {
                  setNewEmail('');
                  setEmailDialogOpen(true);
                }}
              >
                Change email
              </Button>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="web-profile-bio"
                className={cn('text-[13px] font-medium', companion.heading)}
              >
                Bio
              </Label>
              <Textarea
                id="web-profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Nightlife enthusiast · Nairobi"
                rows={3}
                className={cn('min-h-[88px]', companion.input)}
              />
            </div>
            <Button
              type="submit"
              className={cn('px-6 py-3 text-sm font-semibold', companion.accentBtn)}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </form>

          <p className={cn('mt-8 text-sm', companion.muted)}>
            Prefer account prefs?{' '}
            <Link to="/settings" className={cn('font-medium hover:underline', companion.accent)}>
              Open settings
            </Link>
          </p>
        </div>

        <aside className="hidden flex-col gap-3 lg:flex">
          {galleryImages.map((src, i) => (
            <div key={`${src}-${i}`} className="h-[240px] overflow-hidden rounded-xl">
              <img src={src} alt="" className="size-full object-cover" loading="lazy" />
            </div>
          ))}
        </aside>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className={cn(companion.surface, companion.border, companion.heading)}>
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription className={companion.muted}>
              We&apos;ll send a confirmation link to the new address. Your current email stays
              active until you confirm.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleChangeEmail(e)} className="space-y-4">
            <div className="space-y-2">
              <Label className={companion.muted}>Current email</Label>
              <Input value={currentEmail} disabled className={cn('h-11 opacity-80', companion.input)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="web-new-email" className={companion.heading}>
                New email
              </Label>
              <Input
                id="web-new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={cn('h-11', companion.input)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                className={cn(companion.border, companion.heading)}
              >
                Cancel
              </Button>
              <Button type="submit" className={companion.accentBtn} disabled={changingEmail}>
                {changingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send confirmation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebProfile;
