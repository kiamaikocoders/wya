
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User } from "@/lib/auth-service";
import { Loader2, Upload } from "lucide-react";

interface EditProfileFormProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

type FormValues = {
  name: string;
  bio: string;
  profile_picture: string;
};

const EditProfileForm: React.FC<EditProfileFormProps> = ({ user, onUpdate, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(user.profile_picture || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    defaultValues: {
      name: user.name,
      bio: user.bio || "",
      profile_picture: user.profile_picture || "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Make sure profile_picture is set to the preview image
      data.profile_picture = previewImage || "";
      
      await onUpdate(data);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      setIsUploading(true);
      try {
        // Create a local object URL for preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
        setValue("profile_picture", objectUrl);
        
        // In a real app, you would upload the file to a server and get a URL back
        // For now, we'll just use the local object URL
        toast.success('Image selected successfully');
      } catch (error) {
        console.error('Error handling image:', error);
        toast.error('Failed to process image');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handleAvatarSelect = (avatarUrl: string) => {
    setPreviewImage(avatarUrl);
    setValue("profile_picture", avatarUrl);
    toast.success('Avatar selected');
  };
  
  const sampleAvatars = [
    "/placeholder.svg",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "/lovable-uploads/5a8a8680-15e8-4a23-b3d5-10e7c024f961.png"
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewImage || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              {sampleAvatars.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  className={`cursor-pointer rounded-full overflow-hidden h-16 w-16 border-2 hover:border-kenya-orange transition-colors ${previewImage === avatar ? 'border-kenya-orange' : 'border-transparent'}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            
            <div className="mt-4">
              <Label htmlFor="custom-image" className="block mb-2">Or upload your own</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="custom-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="custom-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md hover:bg-muted/80 transition-colors">
                    <Upload size={16} />
                    <span>{isUploading ? 'Uploading...' : 'Choose file'}</span>
                  </div>
                </label>
                {previewImage && previewImage !== user.profile_picture && (
                  <span className="text-xs text-muted-foreground">New image selected</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              {...register("name", { required: "Display name is required" })}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className="min-h-[100px]"
              {...register("bio")}
            />
          </div>
          
          <input 
            type="hidden" 
            {...register("profile_picture")} 
          />
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditProfileForm;
