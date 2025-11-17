import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Film, Link2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/lib/admin-service';

const categories = ['Business', 'Culture', 'Sports', 'Music', 'Technology', 'Education', 'Social', 'Other'];
const locations = ['Nairobi', 'Lamu', 'Naivasha', 'Samburu', 'Mombasa', 'Kisumu', 'Nakuru', 'Other'];

const sampleImages = [
  "https://images.unsplash.com/photo-1472653431158-6364773b2fbc?q=80&w=2069",
  "https://images.unsplash.com/photo-1496024840928-4c417adf211d?q=80&w=2070",
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2070",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076"
];

interface AdminCreateEventProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AdminCreateEvent: React.FC<AdminCreateEventProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "link">("image");
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    image_url: '',
    price: 0,
    capacity: 0,
    tags: [] as string[],
    performing_artists: [] as string[],
    ticket_link: '',
    featured: false,
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  });
  
  const [tagsInput, setTagsInput] = useState('');
  const [artistsInput, setArtistsInput] = useState('');

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

  const handleSampleMediaSelect = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setPreviewUrl(url);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      setPreviewUrl(data.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    handleFileUpload(file);
  };

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          organizer_id: null, // Admin-created events may not have an organizer
          status: 'approved', // Admin-created events are auto-approved
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      toast.success('Event created successfully');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
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

    // Use default image if none provided
    if (!formData.image_url) {
      const defaultImages = {
        Business: "https://images.unsplash.com/photo-1676372971824-ed498ef0db5f?q=80&w=2070",
        Culture: "https://images.unsplash.com/photo-1529154045759-34c09aed3b73?q=80&w=2070",
        Sports: "https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2070",
        Music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070",
        Technology: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
        default: "https://images.unsplash.com/photo-1433622070098-754fdf81c929?q=80&w=2070"
      };
      
      const imageUrl = defaultImages[formData.category as keyof typeof defaultImages] || defaultImages.default;
      formData.image_url = imageUrl;
    }

    setIsSubmitting(true);
    createEventMutation.mutate(formData);
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>
          Create an event as an admin. All admin-created events are automatically approved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Music Festival 2023"
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
                  rows={5}
                  required
                />
              </div>
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
                  step="100"
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
                  placeholder="Maximum attendees"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_link">External Ticket Link</Label>
                <Input
                  id="ticket_link"
                  name="ticket_link"
                  type="url"
                  value={formData.ticket_link}
                  onChange={handleInputChange}
                  placeholder="https://eventbrite.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Users will be redirected here when clicking "Get Tickets"
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Event Image</Label>
              <Tabs defaultValue="image" onValueChange={(value) => setMediaType(value as "image" | "video" | "link")}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Link
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="image" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="image_url"
                      name="image_url"
                      value={formData.image_url || ''}
                      onChange={handleInputChange}
                      placeholder="Enter image URL or upload file"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" disabled={isUploading}>
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sampleImages.map((img, index) => (
                      <div 
                        key={index} 
                        className="cursor-pointer rounded-md overflow-hidden h-20 border-2 hover:border-primary transition-colors"
                        onClick={() => handleSampleMediaSelect(img)}
                      >
                        <img src={img} alt={`Sample ${index}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  
                  {previewUrl && (
                    <div className="mt-2 p-2 border rounded-md relative">
                      <img src={previewUrl} alt="Preview" className="max-h-40 object-contain mx-auto" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                </TabsContent>
                
                <TabsContent value="video">
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url || ''}
                    onChange={handleInputChange}
                    placeholder="Enter YouTube or video URL"
                  />
                </TabsContent>
                
                <TabsContent value="link">
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url || ''}
                    onChange={handleInputChange}
                    placeholder="Enter link URL"
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex space-x-2">
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
                <Button type="button" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive ml-1 focus:outline-none"
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
              <div className="flex space-x-2">
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
                <Button type="button" onClick={handleAddArtist}>
                  Add
                </Button>
              </div>
              
              {formData.performing_artists.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.performing_artists.map((artist, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{artist}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveArtist(artist)}
                        className="hover:text-destructive ml-1 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="rounded"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Feature this event on homepage
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminCreateEvent;

