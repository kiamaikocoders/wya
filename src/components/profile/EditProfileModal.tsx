import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { userService } from '@/lib/user-service';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X } from 'lucide-react';
import LocationPicker from '@/components/maps/LocationPicker';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: {
    id: string;
    full_name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    location?: string;
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, profile }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || '',
    location: profile.location || '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(profile.avatar_url || null);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        location: profile.location || '',
      });
      setPreviewImage(profile.avatar_url || null);
    }
  }, [open, profile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // For now, use object URL. In production, upload to Supabase Storage
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      setFormData(prev => ({ ...prev, avatar_url: objectUrl }));
      toast.success('Image selected');
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url,
        location: formData.location,
      };

      await userService.updateProfile(updateData);
      queryClient.invalidateQueries({ queryKey: ['userProfile', profile.id] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', profile.id] });
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-white/20-dark">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Edit Profile</DialogTitle>
          <DialogDescription className="text-text-white/70">
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-kenya-orange">
              <AvatarImage src={previewImage || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-kenya-orange to-kenya-brown text-2xl text-white">
                {formData.full_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-kenya-orange/50 text-gradient-orange-accent hover:bg-gradient-accent/10"
                disabled={isUploading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.click();
                  }
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </>
                )}
              </Button>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {previewImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData(prev => ({ ...prev, avatar_url: '' }));
                  }}
                  className="text-red-400 hover:text-red-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-white">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
                className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark border-white/20-dark text-white focus:border-gradient-orange-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="username"
                className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark border-white/20-dark text-white focus:border-gradient-orange-accent"
                required
              />
              <p className="text-xs text-text-white/70">Username must be unique and contain only letters, numbers, and underscores</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself"
                rows={4}
                className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark border-white/20-dark text-white focus:border-gradient-orange-accent resize-none"
                maxLength={500}
              />
              <p className="text-xs text-text-white/70">{formData.bio.length}/500 characters</p>
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <Label className="text-white">Your Location</Label>
              <p className="text-xs text-text-white/70 mb-2">
                Set your location to receive personalized event recommendations near you
              </p>
              <LocationPicker
                onLocationSelect={(location) => {
                  // Only update form data when user explicitly confirms location
                  // Don't auto-save - just set the selected location
                  setSelectedLocation(location);
                  // Update formData but don't submit
                  setFormData(prev => ({ ...prev, location: location.address }));
                }}
                initialLocation={selectedLocation || undefined}
                height={300}
                mode="user"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/20-dark text-white hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-accent hover:bg-opacity-90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;

