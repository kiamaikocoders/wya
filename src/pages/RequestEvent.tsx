
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';

interface EventProposal {
  title: string;
  description: string;
  category: string;
  estimatedDate: string;
  location: string;
  expectedAttendees: string;
  budget: string;
  sponsorNeeds: string;
  contactEmail: string;
  contactPhone: string;
  additionalInfo: string;
}

const RequestEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState<EventProposal>({
    title: '',
    description: '',
    category: '',
    estimatedDate: '',
    location: '',
    expectedAttendees: '',
    budget: '',
    sponsorNeeds: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    additionalInfo: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProposal(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProposal(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!proposal.title || !proposal.description || !proposal.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    try {
      // In a real implementation, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success('Your event proposal has been submitted for review!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast.error('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Calendar className="h-8 w-8 text-kenya-orange mr-3" />
          <h1 className="text-3xl font-bold">Request an Event</h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Submit your event request, and our team will review it. Once approved, it can be published and promoted on our platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Event Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={proposal.title}
                onChange={handleChange}
                placeholder="Enter a catchy title for your event"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={proposal.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="arts">Arts & Culture</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="business">Business & Networking</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Event Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              name="description"
              value={proposal.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of your event"
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="estimatedDate" className="text-sm font-medium">
                Estimated Date
              </label>
              <Input
                id="estimatedDate"
                name="estimatedDate"
                type="date"
                value={proposal.estimatedDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                name="location"
                value={proposal.location}
                onChange={handleChange}
                placeholder="Event location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="expectedAttendees" className="text-sm font-medium">
                Expected Number of Attendees
              </label>
              <Input
                id="expectedAttendees"
                name="expectedAttendees"
                type="number"
                value={proposal.expectedAttendees}
                onChange={handleChange}
                placeholder="e.g., 100"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="budget" className="text-sm font-medium">
                Estimated Budget
              </label>
              <Input
                id="budget"
                name="budget"
                value={proposal.budget}
                onChange={handleChange}
                placeholder="Budget range or amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="sponsorNeeds" className="text-sm font-medium">
              Sponsorship Needs
            </label>
            <Textarea
              id="sponsorNeeds"
              name="sponsorNeeds"
              value={proposal.sponsorNeeds}
              onChange={handleChange}
              placeholder="Describe what kind of sponsorships you're looking for"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="contactEmail" className="text-sm font-medium">
                Contact Email
              </label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={proposal.contactEmail}
                onChange={handleChange}
                placeholder="Your email address"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="contactPhone" className="text-sm font-medium">
                Contact Phone
              </label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={proposal.contactPhone}
                onChange={handleChange}
                placeholder="Your phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="additionalInfo" className="text-sm font-medium">
              Additional Information
            </label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              value={proposal.additionalInfo}
              onChange={handleChange}
              placeholder="Any other details you'd like to share"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-kenya-orange hover:bg-opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Proposal'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestEvent;
