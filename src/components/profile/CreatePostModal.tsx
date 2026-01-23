import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon, Video, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/lib/event-service';
import { storageService } from '@/lib/storage-service';
import { storyService } from '@/lib/story/story-service';
import { toast } from 'sonner';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const [eventSearchQuery, setEventSearchQuery] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'all-including-past'],
    queryFn: () => eventService.queryEvents({
      search: '',
      category: null,
      location: null,
      tags: [],
      featuredOnly: false,
      startDate: null,
      endDate: null,
      page: 1,
      pageSize: 500,
      sort: 'latest',
      includePast: true, // Allow past events for tagging
    }).then(result => result.events),
  });

  // Helper function to check if event is within the last month
  const isEventWithinLastMonth = (eventDate: string): boolean => {
    const eventDateObj = new Date(eventDate);
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Event must be within the last month (not older than 1 month)
    return eventDateObj >= oneMonthAgo;
  };

  // Filter events: only show events within the last month and match search query
  const filteredEvents = events.filter(event => {
    // First check if event is within the last month
    if (!isEventWithinLastMonth(event.date)) {
      return false;
    }
    
    // Then check search query
    if (!eventSearchQuery.trim()) return true;
    const query = eventSearchQuery.toLowerCase();
    return event.title.toLowerCase().includes(query) || 
           event.location?.toLowerCase().includes(query);
  });

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

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Please log in to create a post');
      return;
    }

    if (!caption.trim() && !selectedFile) {
      toast.error('Please add a caption or media');
      return;
    }

    // Validate that selected event is within the last month
    if (selectedEventId) {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (selectedEvent && !isEventWithinLastMonth(selectedEvent.date)) {
        toast.error('This event is too old to tag. Only events from the last month can be tagged.');
        setSelectedEventId(null);
        return;
      }
    }

    try {
      setIsUploading(true);

      let mediaUrl: string | undefined;

      // Upload media if selected
      if (selectedFile && user?.id) {
        // Use stories bucket since posts are created as stories
        const uploadResult = await storageService.uploadStoryMedia(selectedFile, user.id);
        mediaUrl = uploadResult.publicUrl;
      }

      // Create story/post
      await storyService.createStory({
        content: caption || 'Shared a post',
        caption: caption,
        media_url: mediaUrl,
        media_type: mediaType,
        event_id: selectedEventId || undefined,
      });

      toast.success('Post created successfully!');
      setCaption('');
      setSelectedFile(null);
      setSelectedEventId(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto bg-gradient-promo border-white/10 text-white safe-area-bottom">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button
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

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="mt-2 bg-black/20 border-white/10 text-white placeholder:text-white/50"
              rows={4}
            />
          </div>

          {/* Event Tagging */}
          <div>
            <Label>Tag Event (Optional)</Label>
            <div className="mt-2 space-y-2">
              {selectedEventId ? (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gradient-orange-accent" />
                    <span className="text-sm">
                      {events.find(e => e.id === selectedEventId)?.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEventId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-gradient-orange-accent/50"
                  />
                  <select
                    value=""
                    onChange={(e) => setSelectedEventId(Number(e.target.value) || null)}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white max-h-48 overflow-y-auto"
                  >
                    <option value="">Select an event...</option>
                    {filteredEvents.map((event) => {
                      const eventDate = new Date(event.date);
                      const formattedDate = `${String(eventDate.getMonth() + 1).padStart(2, '0')}/${eventDate.getFullYear()}`;
                      return (
                        <option key={event.id} value={event.id}>
                          {event.title} - {formattedDate}
                        </option>
                      );
                    })}
                  </select>
                  {filteredEvents.length === 0 && (
                    <p className="text-sm text-white/50">
                      {eventSearchQuery 
                        ? 'No events found matching your search' 
                        : 'No events available. Only events from the last month can be tagged.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || (!caption.trim() && !selectedFile)}
              className="bg-gradient-to-r bg-gradient-accent text-black hover:opacity-90"
            >
              {isUploading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;

