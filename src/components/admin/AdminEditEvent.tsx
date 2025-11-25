import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminService, AdminEvent } from '@/lib/admin-service';

const categories = ['Business', 'Culture', 'Sports', 'Music', 'Technology', 'Education', 'Social', 'Other'];
const locations = ['Nairobi', 'Lamu', 'Naivasha', 'Samburu', 'Mombasa', 'Kisumu', 'Nakuru', 'Other'];

interface AdminEditEventProps {
  event: AdminEvent;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AdminEditEvent: React.FC<AdminEditEventProps> = ({ event, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    category: event.category || '',
    date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    time: event.time || '',
    location: event.location || '',
    image_url: event.image_url || '',
    price: event.price || 0,
    capacity: event.capacity || 0,
    tags: [] as string[],
    performing_artists: [] as string[],
    ticket_link: '',
    featured: event.featured || false,
  });
  
  const [tagsInput, setTagsInput] = useState('');
  const [artistsInput, setArtistsInput] = useState('');

  useEffect(() => {
    if (event.image_url) {
      setPreviewUrl(event.image_url);
    }
  }, [event]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'capacity') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'featured') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()]
      }));
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddArtist = () => {
    if (artistsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        performing_artists: [...prev.performing_artists, artistsInput.trim()]
      }));
      setArtistsInput('');
    }
  };

  const handleRemoveArtist = (artistToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      performing_artists: prev.performing_artists.filter(artist => artist !== artistToRemove)
    }));
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const bucket = 'event-images';
      const folder = 'event-images';
      const filePath = `${folder}/${fileName}`;

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('new row violates')) {
          const fallbackBucket = 'event-media';
          const fallbackPath = `events/${fileName}`;
          const { error: fallbackError } = await supabase.storage
            .from(fallbackBucket)
            .upload(fallbackPath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (fallbackError) throw fallbackError;
          
          const { data } = supabase.storage
            .from(fallbackBucket)
            .getPublicUrl(fallbackPath);
          
          setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
          setPreviewUrl(data.publicUrl);
          toast.success('Image uploaded successfully');
          return;
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      setPreviewUrl(data.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    handleFileUpload(file);
  };

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      toast.success('Event updated successfully');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter an event description');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!formData.date) {
      toast.error('Please set an event date');
      return;
    }
    
    if (!formData.location) {
      toast.error('Please select a location');
      return;
    }

    setIsSubmitting(true);
    
    const eventData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      time: formData.time && formData.time.trim() ? formData.time.trim() : undefined,
    };
    
    updateEventMutation.mutate(eventData);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select 
                  value={formData.location} 
                  onValueChange={(value) => handleSelectChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Scheduling</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  placeholder="0 for free events"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="featured">Featured Event</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    id="featured"
                    name="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                    Feature this event on the homepage
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Event Image</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Or Enter Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    handleInputChange(e);
                    setPreviewUrl(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              {previewUrl && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-64 object-cover" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewUrl(null);
                      setFormData(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Additional Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Add event tags"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="artists">Performing Artists</Label>
              <div className="flex gap-2">
                <Input
                  id="artists"
                  value={artistsInput}
                  onChange={(e) => setArtistsInput(e.target.value)}
                  placeholder="Add performing artist name"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddArtist();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddArtist} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.performing_artists.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.performing_artists.map((artist, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{artist}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveArtist(artist)}
                        className="hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isUploading || updateEventMutation.isPending}>
              {isSubmitting || updateEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Event'
              )}
            </Button>
          </div>
        </form>
    </div>
  );
};

export default AdminEditEvent;
