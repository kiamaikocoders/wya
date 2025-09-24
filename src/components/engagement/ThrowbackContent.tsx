import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, Tag, Upload, X } from 'lucide-react';
import { engagementService } from '@/lib/engagement-service';
import { storageService } from '@/lib/storage-service';
import { toast } from 'sonner';

interface ThrowbackContentProps {
  eventId?: number;
  onSuccess?: () => void;
}

const ThrowbackContent: React.FC<ThrowbackContentProps> = ({ eventId, onSuccess }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    throwbackDate: '',
    tags: '',
    mediaFile: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!storageService.validateFileType(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])) {
      toast.error('Invalid file type. Please select an image or video file.');
      return;
    }

    if (!storageService.validateFileSize(file, 100)) {
      toast.error('File size must be less than 100MB.');
      return;
    }

    setFormData({ ...formData, mediaFile: file });
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeFile = () => {
    setFormData({ ...formData, mediaFile: null });
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.throwbackDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      let mediaUrl = '';
      let mediaType = '';

      // Upload media if provided
      if (formData.mediaFile) {
        const uploadResult = await storageService.uploadThrowbackMedia(
          formData.mediaFile,
          'current-user-id' // This should be the actual user ID
        );
        mediaUrl = uploadResult.publicUrl;
        mediaType = formData.mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      // Create throwback content
      await engagementService.createThrowbackContent(
        eventId || 0,
        0, // originalStoryId - could be 0 for new content
        formData.title,
        formData.description,
        mediaUrl,
        mediaType,
        formData.throwbackDate,
        formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      );

      // Reset form
      setFormData({
        title: '',
        description: '',
        throwbackDate: '',
        tags: '',
        mediaFile: null
      });
      setPreviewUrl(null);
      setShowCreateForm(false);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating throwback content:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Throwback Content
        </h3>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="outline"
          size="sm"
        >
          {showCreateForm ? 'Cancel' : 'Create Throwback'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Throwback Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What was the highlight?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Share the story behind this moment..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="throwbackDate">Original Event Date *</Label>
                <Input
                  id="throwbackDate"
                  type="date"
                  value={formData.throwbackDate}
                  onChange={(e) => setFormData({ ...formData, throwbackDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="fun, memories, friends"
                />
              </div>

              <div>
                <Label htmlFor="media">Media (Image or Video)</Label>
                <div className="space-y-2">
                  <Input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-kenya-brown file:text-white hover:file:bg-kenya-brown-dark"
                  />
                  {previewUrl && (
                    <div className="relative">
                      {formData.mediaFile?.type.startsWith('video/') ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-md"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeFile}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : 'Create Throwback'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Throwback Content Display */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* This would be populated with actual throwback content */}
        <Card className="bg-gradient-to-br from-kenya-brown/10 to-kenya-dark/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-kenya-brown" />
              <span className="text-sm text-gray-500">Last Weekend</span>
            </div>
            <h4 className="font-semibold mb-2">Amazing Night at the Concert</h4>
            <p className="text-sm text-gray-600 mb-3">
              The energy was incredible! Everyone was dancing and singing along.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                #concert
              </Badge>
              <Badge variant="secondary" className="text-xs">
                #memories
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThrowbackContent;

