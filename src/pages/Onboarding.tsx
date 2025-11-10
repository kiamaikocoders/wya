import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Section from '@/components/ui/Section';
import { cn } from '@/lib/utils';
import { CheckCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  onboardingService,
  OnboardingPreferencesPayload,
} from '@/lib/onboarding-service';

const stepDescriptions = [
  {
    title: 'Interests',
    description: 'Tell us what excites you. We’ll personalise events and partners around it.',
  },
  {
    title: 'Presence',
    description: 'Share where you host or attend most. Venue and sponsor matches depend on this.',
  },
  {
    title: 'Signals',
    description: 'Control which updates land in your inbox or dashboard.',
  },
  {
    title: 'Summary',
    description: 'Give everything a quick look before saving your onboarding profile.',
  },
];

const interestOptions = [
  'Live Music',
  'Pop-up Markets',
  'Wellness & Fitness',
  'Food & Drink',
  'Film & Media',
  'Tech & Startups',
  'Conferences',
  'Community Service',
  'Nightlife',
  'Corporate Retreats',
];

const cityOptions = ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru', 'Malindi'];

const defaultPreferences: OnboardingPreferencesPayload = {
  interests: [],
  homeBase: '',
  preferredCities: [],
  collaborationNotes: '',
  notifications: {
    aiDigest: true,
    partnerPitches: true,
    communityHighlights: false,
  },
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['onboardingPreferences'],
    queryFn: onboardingService.getPreferences,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingPreferencesPayload>(defaultPreferences);

  useEffect(() => {
    if (data) {
      setProfile(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: onboardingService.upsertPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingPreferences'] });
      toast.success('Preferences saved! Your feed will adapt immediately.');
      navigate('/home');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Unable to save preferences right now. Please try again.');
    },
  });

  const toggleArrayValue = (key: 'interests' | 'preferredCities', value: string) => {
    setProfile((prev) => {
      const target = prev[key];
      const exists = target.includes(value);
      const updated = exists ? target.filter((item) => item !== value) : [...target, value];
      return { ...prev, [key]: updated };
    });
  };

  const toggleNotification = (
    key: keyof OnboardingPreferencesPayload['notifications'],
  ) => {
    setProfile((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  };

  const nextStep = () => {
    if (currentStep === 0 && profile.interests.length === 0) {
      toast.error('Select at least one interest to help tailor recommendations.');
      return;
    }

    if (currentStep === 1 && !profile.homeBase) {
      toast.error('Tell us where you’re mainly based.');
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, stepDescriptions.length - 1));
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    mutation.mutate(profile);
  };

  const isLastStep = currentStep === stepDescriptions.length - 1;

  const selectedSummary = useMemo(
    () => [
      { label: 'Interests', value: profile.interests.join(', ') || 'Not selected yet' },
      { label: 'Home base', value: profile.homeBase || 'Not provided' },
      {
        label: 'Preferred cities',
        value: profile.preferredCities.join(', ') || 'Any location',
      },
      {
        label: 'Collaboration notes',
        value: profile.collaborationNotes || 'No additional notes',
      },
    ],
    [profile]
  );

  return (
    <div className="min-h-screen bg-kenya-dark pb-16">
      <Section
        title="Let’s co-create your perfect WYA experience"
        subtitle="A few prompts now means smarter recommendations, stronger sponsor matches, and fewer cold outreach messages later."
      >
        <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <div className="space-y-3">
            {stepDescriptions.map((step, index) => (
              <button
                type="button"
                key={step.title}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-kenya-orange/50 hover:bg-white/10',
                  currentStep === index &&
                    'border-kenya-orange/70 bg-white/10 shadow-[0_0_20px_rgba(255,128,0,0.3)]',
                  index < currentStep && 'border-kenya-orange/40'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white',
                    index < currentStep && 'bg-kenya-orange text-kenya-dark'
                  )}
                >
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-white/60">{step.description}</p>
                </div>
              </button>
            ))}
          </div>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
                  <Sparkles className="h-4 w-4 text-kenya-orange" />
                  Step {currentStep + 1} of {stepDescriptions.length}
                </div>
                <CardTitle className="mt-3 text-2xl text-white">
                  {stepDescriptions[currentStep].title}
                </CardTitle>
                <p className="text-sm text-white/70">
                  {stepDescriptions[currentStep].description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="grid gap-3 text-sm text-white/60">
                    <div className="animate-pulse rounded-2xl bg-white/10 p-6" />
                    <div className="animate-pulse rounded-2xl bg-white/10 p-6" />
                    <div className="animate-pulse rounded-2xl bg-white/10 p-6" />
                  </div>
                ) : currentStep === 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {interestOptions.map((interest) => {
                      const selected = profile.interests.includes(interest);
                      return (
                        <button
                          type="button"
                          key={interest}
                          onClick={() => toggleArrayValue('interests', interest)}
                          className={cn(
                            'flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/70 transition hover:border-kenya-orange/40 hover:bg-white/10',
                            selected && 'border-kenya-orange/70 bg-white/10 text-white'
                          )}
                        >
                          <span>{interest}</span>
                          {selected && <CheckCircle className="h-4 w-4 text-kenya-orange" />}
                        </button>
                      );
                    })}
                  </div>
                ) : currentStep === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">
                        Where are you primarily based? <span className="text-kenya-orange">*</span>
                      </p>
                      <Input
                        placeholder="e.g. Nairobi, Westlands"
                        value={profile.homeBase}
                        onChange={(event) =>
                          setProfile((prev) => ({ ...prev, homeBase: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">Other cities you activate</p>
                      <div className="flex flex-wrap gap-2">
                        {cityOptions.map((city) => {
                          const selected = profile.preferredCities.includes(city);
                          return (
                            <Badge
                              key={city}
                              onClick={() => toggleArrayValue('preferredCities', city)}
                              className={cn(
                                'cursor-pointer border border-white/15 bg-white/5 px-3 py-1 text-white/70 transition hover:border-kenya-orange/40 hover:text-white',
                                selected && 'border-kenya-orange/70 bg-white/10 text-white'
                              )}
                            >
                              {city}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">
                        Collaboration notes (optional)
                      </p>
                      <Textarea
                        placeholder="Share themes, brand alignments, audience insights, or recurring needs."
                        value={profile.collaborationNotes}
                        onChange={(event) =>
                          setProfile((prev) => ({
                            ...prev,
                            collaborationNotes: event.target.value,
                          }))
                        }
                        rows={4}
                      />
                    </div>
                  </div>
                ) : currentStep === 2 ? (
                  <div className="grid gap-3">
                    {[
                      {
                        key: 'aiDigest' as const,
                        title: 'Weekly AI digest',
                        description: 'A Monday summary of trending events and insights.',
                      },
                      {
                        key: 'partnerPitches' as const,
                        title: 'Partner pitches',
                        description: 'Sponsor and collaborator recommendations tailored to your profile.',
                      },
                      {
                        key: 'communityHighlights' as const,
                        title: 'Community highlights',
                        description: 'Stories and recaps from organisers across Kenya.',
                      },
                    ].map((item) => {
                      const enabled = profile.notifications[item.key];
                      return (
                        <button
                          type="button"
                          key={item.title}
                          onClick={() => toggleNotification(item.key)}
                          className={cn(
                            'flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-kenya-orange/40 hover:bg-white/10',
                            enabled && 'border-kenya-orange/70 bg-white/10 text-white'
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="text-xs text-white/60">{item.description}</p>
                          </div>
                          {enabled && <CheckCircle className="h-4 w-4 text-kenya-orange" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4 text-sm text-white/75">
                    {selectedSummary.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm text-white/80">{item.value}</p>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                        Notification preferences
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-white/70">
                        {Object.entries(profile.notifications).map(([key, value]) => (
                          <li key={key} className="flex items-center gap-2">
                            <CheckCircle
                              className={cn(
                                'h-4 w-4',
                                value ? 'text-kenya-orange' : 'text-white/25'
                              )}
                            />
                            <span className={cn(!value && 'text-white/45')}>
                              {key === 'aiDigest' && 'Weekly AI digest'}
                              {key === 'partnerPitches' && 'Partner pitches'}
                              {key === 'communityHighlights' && 'Community highlights'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
                }
              </CardContent>
              <div className="flex items-center justify-between border-t border-white/10 bg-white/5 p-6">
                <Button variant="ghost" size="sm" onClick={previousStep} disabled={currentStep === 0}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {isLastStep ? (
                  <Button onClick={handleSubmit} disabled={mutation.isPending || isLoading}>
                    {mutation.isPending ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        Finish onboarding
                        <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
        </div>
      </Section>
    </div>
  );
};

export default Onboarding;


