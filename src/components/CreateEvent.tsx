import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/lib/event-service';
import type { CreateEventPayload } from '@/types/event.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Film, Link2, Loader2 } from 'lucide-react';

const categories = ['Business', 'Culture', 'Sports', 'Music', 'Technology', 'Education', 'Social', 'Other'];
const locations = ['Nairobi', 'Lamu', 'Naivasha', 'Samburu', 'Mombasa', 'Kisumu', 'Nakuru', 'Other'];

// Sample media for easy insertion
const sampleImages = [
  "https://images.unsplash.com/photo-1472653431158-6364773b2fbc?q=80&w=2069",
  "https://images.unsplash.com/photo-1496024840928-4c417adf211d?q=80&w=2070",
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2070",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076"
];

const CreateEvent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateEventPayload>({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    image_url: '',
    organizer_id: 0, // This will be set before submission
    price: 0,
    tags: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [mediaType, setMediaType] = useState<"image" | "video" | "link">("image");
  
  // Redirect if not authenticated or not an organizer
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to create an event');
      navigate('/login');
      return;
    }
    
    if (user?.user_type !== 'organizer') {
      toast.error('Only organizers can create events');
      navigate('/events');
    }
  }, [isAuthenticated, user, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddTag = () => {
    if (tagsInput.trim()) {
      const newTags = [...(formData.tags || []), tagsInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagsInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };
  
  const handleSampleMediaSelect = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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
    
    try {
      setIsSubmitting(true);
      
      // Use a fallback image if none provided
      if (!formData.image_url) {
        // Pick a default image based on category
        const defaultImages = {
          Business: "https://images.unsplash.com/photo-1676372971824-ed498ef0db5f?q=80&w=2070",
          Culture: "https://images.unsplash.com/photo-1529154045759-34c09aed3b73?q=80&w=2070",
          Sports: "https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2070",
          Music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070",
          Technology: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
          default: "https://images.unsplash.com/photo-1433622070098-754fdf81c929?q=80&w=2070"
        };
        
        const imageUrl = defaultImages[formData.category as keyof typeof defaultImages] || defaultImages.default;
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        formData.image_url = imageUrl;
      }
      
      // Update organizer_id before submission
      const eventData: CreateEventPayload = {
        ...formData,
        organizer_id: user?.id || 0
      };
      
      await eventService.createEvent(eventData);
      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container py-8 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Fill in the details below to create your event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
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
                  <Label htmlFor="description">Description</Label>
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
                  <Label htmlFor="category">Category</Label>
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
                  <Label htmlFor="location">Location</Label>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    name="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
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
                    <Input
                      id="image_url"
                      name="image_url"
                      value={formData.image_url || ''}
                      onChange={handleInputChange}
                      placeholder="Enter image URL"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sampleImages.map((img, index) => (
                        <div 
                          key={index} 
                          className="cursor-pointer rounded-md overflow-hidden h-20 border-2 hover:border-kenya-orange transition-colors"
                          onClick={() => handleSampleMediaSelect(img)}
                        >
                          <img src={img} alt={`Sample ${index}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    
                    {formData.image_url && (
                      <div className="mt-2 p-2 border rounded-md">
                        <img src={formData.image_url} alt="Preview" className="max-h-40 object-contain mx-auto" />
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
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <div 
                        key={index} 
                        className="bg-kenya-brown-dark text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(tag)}
                          className="text-white hover:text-kenya-orange ml-1 focus:outline-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/events')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
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
    </div>
  );
};

export default CreateEvent;
