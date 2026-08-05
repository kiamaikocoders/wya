import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/user-service';
import { storageService } from '@/lib/storage-service';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

/**
 * PDF light-web profile: name, email, photo — no social tabs or connections.
 */
const WebProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile?.id, profile?.full_name]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const displayName = fullName || profile?.full_name || user?.full_name || user?.name || '';
  const avatarUrl = resolveAvatarUrl(profile?.avatar_url || user?.avatar_url || user?.profile_picture);
  const initials = (displayName || email || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
      await userService.updateProfile({ full_name: name });
      await updateUser({ name, full_name: name });

      const nextEmail = email.trim().toLowerCase();
      if (nextEmail && nextEmail !== (user.email || '').toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: nextEmail });
        if (error) throw error;
        toast.success('Check your inbox to confirm the new email address');
      } else {
        toast.success('Profile updated');
      }
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
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
    <div className="container mx-auto max-w-lg px-4 py-8 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24 border border-border">
            <AvatarImage src={avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-primary/15 text-xl text-primary">{initials}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 h-9 w-9 rounded-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
        </div>
        <p className="text-xs text-muted-foreground">Upload or change your profile picture</p>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="web-profile-name">Name</Label>
          <Input
            id="web-profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="web-profile-email">Email</Label>
          <Input
            id="web-profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground">
            Changing email may require confirmation before it takes effect.
          </p>
        </div>
        <Button
          type="submit"
          className="w-full bg-kenya-orange text-kenya-dark hover:bg-kenya-orange/90"
          disabled={saving}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>

      <div className="mt-8 space-y-3">
        <Button asChild variant="outline" className="w-full">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Open settings
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Posts, followers, and social features live in the{' '}
        <Link to="/download" className="font-medium text-primary underline-offset-4 hover:underline">
          WYA app
        </Link>
        .
      </p>
    </div>
  );
};

export default WebProfile;
