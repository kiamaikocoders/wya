
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Upload } from 'lucide-react';
import { CreateStoryDto } from '@/lib/story/types';
import { toast } from 'sonner';

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
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content) {
      toast.error('Please add a caption for your story');
      return;
    }
    
    if (!mediaUrl) {
      toast.error('Please add an image URL for your story');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSubmit({
        event_id: eventId,
        content,
        media_url: mediaUrl,
      });
      
      // Reset form
      setContent('');
      setMediaUrl('');
    } catch (error) {
      console.error('Error submitting story:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-kenya-dark border border-kenya-brown/20 p-6 rounded-lg w-full max-w-md">
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
          <div className="space-y-2">
            <Label htmlFor="media-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="media-url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline">
                <Upload size={18} />
              </Button>
            </div>
            {mediaUrl && (
              <div className="aspect-video bg-cover bg-center rounded-md overflow-hidden">
                <img 
                  src={mediaUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={() => toast.error('Invalid image URL')}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Caption</Label>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Story'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoryModal;
