
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequestEvent = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please log in to request an event');
      navigate('/login');
      return;
    }
    
    if (!title || !description || !date || !location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Event request submitted successfully! Our team will review it.');
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      setContactEmail('');
      setContactPhone('');
      
    } catch (error) {
      console.error('Event request failed:', error);
      toast.error('Failed to submit event request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-6 w-6 text-kenya-orange" />
            <CardTitle>Request an Event</CardTitle>
          </div>
          <CardDescription>
            Fill out this form to request an event to be added to our platform.
            Our team will review your submission and get back to you.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Event Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Event Description *
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Event Date *
                </label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Event Location *
                </label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="contactEmail" className="text-sm font-medium">
                  Contact Email
                </label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="contactPhone" className="text-sm font-medium">
                  Contact Phone
                </label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+254 XXX XXX XXX"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-kenya-orange hover:bg-opacity-90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </div>
              ) : 'Submit Event Request'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col text-sm text-muted-foreground">
          <p>* Required fields</p>
          <p>Our team will review your request and get back to you within 48 hours.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RequestEvent;
