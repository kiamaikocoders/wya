
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { CreateStoryDto } from '@/lib/story/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/lib/storage-service';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStoryDto) => Promise<void>;
  eventId: number;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  eventId
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image or video
    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      toast.error('Please select an image or video file');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !previewUrl) {
      toast.error('Please upload a photo or video for your story');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setIsUploading(true);

      let mediaUrl: string | undefined;

      // Upload media if selected
      if (selectedFile && user?.id) {
        const uploadResult = await storageService.uploadStoryMedia(selectedFile, user.id);
        mediaUrl = uploadResult.publicUrl;
      }
      
      await onSubmit({
        event_id: eventId,
        content: content.trim() || '',
        media_url: mediaUrl,
        media_type: mediaType,
      });
      
      // Reset form
      setContent('');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error('Failed to share story');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-kenya-dark border border-kenya-brown/20 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share Your Story</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Preview */}
          {previewUrl && (
            <div className="relative">
              {mediaType === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full rounded-lg"
                  controls
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg object-cover"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* File Upload */}
          {!previewUrl && (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/20 p-12">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-white/40" />
                <p className="mt-4 text-sm text-white/70">
                  Upload a photo or video
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="mt-4 hidden"
                  id="story-media-upload"
                  disabled={isUploading || isSubmitting}
                />
                <Label htmlFor="story-media-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 cursor-pointer border-white/20 text-white hover:bg-white/10"
                    asChild
                  >
                    <span>Select from device</span>
                  </Button>
                </Label>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="content">Caption (optional)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience..."
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading || (!selectedFile && !previewUrl)}>
              {isSubmitting || isUploading ? 'Posting...' : 'Post Story'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoryModal;
