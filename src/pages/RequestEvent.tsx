
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Calendar, CheckCircle, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Section from '@/components/ui/Section';
import { cn } from '@/lib/utils';

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

const steps = [
  {
    label: 'Concept',
    description: 'Introduce your experience to the community.',
  },
  {
    label: 'Logistics',
    description: 'Share timing, location, and headcount.',
  },
  {
    label: 'Collaboration',
    description: 'Tell us who should partner with you.',
  },
  {
    label: 'Review',
    description: 'Confirm details before sending.',
  },
];

const RequestEvent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
    additionalInfo: '',
  });

  const categories = useMemo(
    () => [
      'Music',
      'Sports',
      'Arts & Culture',
      'Food & Drink',
      'Business & Networking',
      'Technology',
      'Education',
      'Community Service',
      'Other',
    ],
    []
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProposal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof EventProposal, value: string) => {
    setProposal((prev) => ({ ...prev, [name]: value }));
  };

  const goToStep = (step: number) => {
    if (step < 0 || step > steps.length - 1) return;
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!proposal.title || !proposal.description || !proposal.category) {
        toast.error('Add a title, description, and category to continue.');
        return;
      }
    }
    if (currentStep === 1) {
      if (!proposal.estimatedDate || !proposal.location) {
        toast.error('Share the tentative date and location to proceed.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!proposal.contactEmail) {
        toast.error('Enter a contact email so we can reach you.');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!proposal.title || !proposal.description || !proposal.category) {
      toast.error('Missing some essentials—double-check your concept step.');
      setCurrentStep(0);
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      toast.success('Proposal sent! We’ll review and follow up shortly.');
      navigate(isAuthenticated ? '/home' : '/');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast.error('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepCard = ({
    step,
    title,
    description,
    isActive,
    isCompleted,
  }: {
    step: number;
    title: string;
    description: string;
    isActive: boolean;
    isCompleted: boolean;
  }) => (
    <button
      type="button"
      onClick={() => goToStep(step)}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-kenya-orange/50 hover:bg-white/10',
        isActive && 'border-kenya-orange/70 bg-white/10 shadow-[0_0_25px_rgba(255,128,0,0.25)]',
        isCompleted && !isActive && 'border-kenya-orange/35'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white',
          isCompleted && 'bg-kenya-orange text-kenya-dark'
        )}
      >
        {isCompleted ? <CheckCircle className="h-4 w-4" /> : step + 1}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/60">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-kenya-dark pb-16">
      <Section
        title="Bring a new experience to life"
        subtitle="Share the story behind your idea. We’ll help with visibility, partnerships, and insights along the way."
        action={
          <Button variant="outline" onClick={() => navigate('/events')}>
            Explore live experiences
          </Button>
        }
      >
        <div className="grid gap-6 md:grid-cols-[0.32fr_0.68fr]">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <StepCard
                key={step.label}
                step={index}
                title={step.label}
                description={step.description}
                isActive={index === currentStep}
                isCompleted={index < currentStep}
              />
            ))}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-white/80">
                  <Rocket className="h-4 w-4 text-kenya-orange" />
                  Proposal snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <p>
                  <span className="font-semibold text-white/85">Title:</span>{' '}
                  {proposal.title || '—'}
                </p>
                <p>
                  <span className="font-semibold text-white/85">Category:</span>{' '}
                  {proposal.category || '—'}
                </p>
                <p>
                  <span className="font-semibold text-white/85">Target date:</span>{' '}
                  {proposal.estimatedDate || '—'}
                </p>
                <p>
                  <span className="font-semibold text-white/85">Location:</span>{' '}
                  {proposal.location || '—'}
                </p>
                <p>
                  <span className="font-semibold text-white/85">Contact:</span>{' '}
                  {proposal.contactEmail || proposal.contactPhone || '—'}
                </p>
              </CardContent>
            </Card>
        </div>
        
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Calendar className="h-4 w-4 text-kenya-orange" />
                Step {currentStep + 1} of {steps.length}
              </div>
              <CardTitle className="text-2xl text-white">
                {steps[currentStep].label}
              </CardTitle>
              <p className="text-sm text-white/65">
                {steps[currentStep].description}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
            <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-white">
                      Event title <span className="text-kenya-orange">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={proposal.title}
                onChange={handleChange}
                      placeholder="Rooftop Sundowner Nairobi"
                required
              />
            </div>
            <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-white">
                      Category <span className="text-kenya-orange">*</span>
              </label>
              <Select
                value={proposal.category}
                      onValueChange={(value) =>
                        handleSelectChange('category', value)
                      }
              >
                <SelectTrigger>
                        <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            </div>
          <div className="space-y-2">
                    <label
                      htmlFor="description"
                      className="text-sm font-medium text-white"
                    >
                      Event description <span className="text-kenya-orange">*</span>
            </label>
            <Textarea
              id="description"
              name="description"
              value={proposal.description}
              onChange={handleChange}
                      placeholder="Share the story, target audience, and desired outcomes."
              rows={5}
              required
            />
          </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                      <label
                        htmlFor="estimatedDate"
                        className="text-sm font-medium text-white"
                      >
                        Estimated date <span className="text-kenya-orange">*</span>
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
                      <label
                        htmlFor="location"
                        className="text-sm font-medium text-white"
                      >
                        Location <span className="text-kenya-orange">*</span>
              </label>
              <Input
                id="location"
                name="location"
                value={proposal.location}
                onChange={handleChange}
                        placeholder="Venue, city, or concept"
              />
            </div>
          </div>
                  <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                      <label
                        htmlFor="expectedAttendees"
                        className="text-sm font-medium text-white"
                      >
                        Expected attendees
              </label>
              <Input
                id="expectedAttendees"
                name="expectedAttendees"
                type="number"
                value={proposal.expectedAttendees}
                onChange={handleChange}
                        placeholder="e.g. 150"
              />
            </div>
            <div className="space-y-2">
                      <label
                        htmlFor="budget"
                        className="text-sm font-medium text-white"
                      >
                        Estimated budget (KES)
              </label>
              <Input
                id="budget"
                name="budget"
                value={proposal.budget}
                onChange={handleChange}
                        placeholder="Optional"
              />
            </div>
          </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
          <div className="space-y-2">
                    <label
                      htmlFor="sponsorNeeds"
                      className="text-sm font-medium text-white"
                    >
                      Sponsorship & partnership needs
            </label>
            <Textarea
              id="sponsorNeeds"
              name="sponsorNeeds"
              value={proposal.sponsorNeeds}
              onChange={handleChange}
                      placeholder="Outline sponsor tiers, preferred partners, or unique requests."
                      rows={4}
            />
          </div>
                  <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                      <label
                        htmlFor="contactEmail"
                        className="text-sm font-medium text-white"
                      >
                        Contact email <span className="text-kenya-orange">*</span>
              </label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={proposal.contactEmail}
                onChange={handleChange}
                        placeholder="hello@yourbrand.com"
                        required
              />
            </div>
            <div className="space-y-2">
                      <label
                        htmlFor="contactPhone"
                        className="text-sm font-medium text-white"
                      >
                        Contact phone
              </label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={proposal.contactPhone}
                onChange={handleChange}
                        placeholder="+254 700 000000"
              />
            </div>
          </div>
          <div className="space-y-2">
                    <label
                      htmlFor="additionalInfo"
                      className="text-sm font-medium text-white"
                    >
                      Additional context
            </label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              value={proposal.additionalInfo}
              onChange={handleChange}
                      placeholder="Anything else we should know—timelines, collaborators, or inspiration?"
                      rows={4}
            />
          </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 text-sm text-white/70">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Overview
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {proposal.title || 'Untitled experience'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                      <Badge className="bg-white/10 text-white/70">
                        {proposal.category || 'No category'}
                      </Badge>
                      <Badge className="bg-white/10 text-white/70">
                        {proposal.estimatedDate || 'Date TBD'}
                      </Badge>
                      <Badge className="bg-white/10 text-white/70">
                        {proposal.location || 'Location TBD'}
                      </Badge>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm text-white/80">
                      {proposal.description}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                        Headcount
                      </p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {proposal.expectedAttendees || 'Not specified'}
                      </p>
                      <p className="text-xs text-white/60">
                        Make sure capacity aligns with your venue.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                        Budget
                      </p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {proposal.budget ? `KES ${proposal.budget}` : 'Flexible'}
                      </p>
                      <p className="text-xs text-white/60">
                        Sponsors use this to scope contributions.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Partnerships
                    </p>
                    <p className="mt-3 whitespace-pre-wrap">
                      {proposal.sponsorNeeds || 'No sponsorship requests listed.'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Contact
                    </p>
                    <div className="mt-3 space-y-1">
                      <p>{proposal.contactEmail}</p>
                      {proposal.contactPhone && <p>{proposal.contactPhone}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="flex items-center justify-between border-t border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Calendar className="h-4 w-4" />
                {currentStep === steps.length - 1
                  ? 'Ready to send for review.'
                  : 'Save progress automatically as you go.'}
              </div>
              <div className="flex items-center gap-3">
            <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentStep === 0}
            >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
            </Button>
                {currentStep === steps.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting
                </>
              ) : (
                      <>
                        Submit proposal
                        <Rocket className="ml-2 h-4 w-4" />
                      </>
              )}
            </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
          </div>
          </Card>
      </div>
      </Section>
    </div>
  );
};

export default RequestEvent;
