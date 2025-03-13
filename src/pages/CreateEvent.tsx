
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { eventService, CreateEventPayload } from '@/lib/event-service';

const categories = ['Business', 'Culture', 'Sports', 'Music', 'Technology', 'Education', 'Social', 'Other'];
const locations = ['Nairobi', 'Lamu', 'Naivasha', 'Samburu', 'Mombasa', 'Kisumu', 'Nakuru', 'Other'];

const CreateEvent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Omit<CreateEventPayload, 'organizer_id'>>({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    image_url: '',
    price: 0,
    tags: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  
  // Redirect if not authenticated or not an organizer
  React.useEffect(() => {
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
      await eventService.createEvent(formData);
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
                <Label htmlFor="image_url">Event Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
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
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEvent;
