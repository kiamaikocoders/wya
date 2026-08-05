import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { WebOnboardingSplitShell } from '@/components/onboarding/WebOnboardingSplitShell';
import { PhotoSelectTile } from '@/components/onboarding/PhotoSelectTile';
import { CityChip } from '@/components/onboarding/CityChip';
import {
  onboardingService,
  OnboardingPreferencesPayload,
} from '@/lib/onboarding-service';
import { getPostLoginPath } from '@/lib/post-auth-navigation';

const stepMeta = [
  {
    heroSrc: '/onboarding/hero-interests.png',
    headline: 'What gets you out?',
    subcopy: 'Pick the vibes you chase. We will tune your feed and nights around them.',
    panelTitle: 'Your interests',
    panelHint: 'Select at least one. Selected tiles glow coral.',
  },
  {
    heroSrc: '/onboarding/hero-presence.png',
    headline: 'Where do you show up?',
    subcopy: 'Home base + cities you travel for nights. Venue matches depend on this.',
    panelTitle: 'Home base',
    panelHint: 'Pick the city you spend most nights in.',
  },
  {
    heroSrc: '/onboarding/hero-signals.png',
    headline: 'How should we ping you?',
    subcopy: 'Control which updates land in your inbox. Change anytime in Settings.',
    panelTitle: 'Notification signals',
    panelHint: 'Fewer cold messages. More nights that match you.',
  },
  {
    heroSrc: '/onboarding/hero-summary.png',
    headline: 'You are ready.',
    subcopy: 'One last look — then we open your personalized WYA feed.',
    panelTitle: 'Your onboarding profile',
    panelHint: '',
  },
] as const;

const interestOptions = [
  { label: 'Live Music', image: '/onboarding/interest-live-music.png' },
  { label: 'Nightlife', image: '/onboarding/interest-nightlife.png' },
  { label: 'Food & Drink', image: '/onboarding/interest-food-drink.png' },
  { label: 'Pop-up Markets', image: '/onboarding/interest-markets.png' },
  { label: 'Film & Media', image: '/onboarding/interest-film.png' },
  { label: 'Tech & Startups', image: '/onboarding/interest-tech.jpg' },
  { label: 'Wellness', image: '/onboarding/interest-wellness.jpg' },
  { label: 'Community', image: '/onboarding/interest-community.jpg' },
] as const;

const homeBaseCities = [
  { label: 'Nairobi', image: '/onboarding/city-nairobi.png' },
  { label: 'Mombasa', image: '/onboarding/city-mombasa.png' },
  { label: 'Kisumu', image: '/onboarding/city-kisumu.png' },
  { label: 'Eldoret', image: '/onboarding/city-eldoret.png' },
] as const;

const preferredCityOptions = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Malindi',
  'Any city',
] as const;

const signalItems = [
  {
    key: 'aiDigest' as const,
    title: 'AI digest',
    description: 'Weekly picks tailored to your interests and city.',
  },
  {
    key: 'partnerPitches' as const,
    title: 'Partner pitches',
    description: 'Sponsor and venue collab opportunities that fit your profile.',
  },
  {
    key: 'communityHighlights' as const,
    title: 'Community highlights',
    description: 'Friend activity, trending nights, and social sparks.',
  },
];

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

const pillPrimary =
  'inline-flex items-center justify-center rounded-full bg-[#ff6b35] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#ff6b35]/90 disabled:cursor-not-allowed disabled:opacity-70 min-h-[48px] touch-manipulation';

function outlineNav(isDark: boolean) {
  return cn(
    'inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition-colors min-h-[44px] touch-manipulation',
    isDark
      ? 'border-[#21262d] text-[#e6edf3] hover:bg-white/5'
      : 'border-[#d0d7de] text-[#0d1117] hover:bg-black/5'
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-[rgba(255,107,53,0.15)] px-3 py-1.5 text-xs font-semibold text-[#ff6b35]">
      {label}
    </span>
  );
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useWebAuthTheme();

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
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['onboardingPreferences'], variables);
      queryClient.invalidateQueries({ queryKey: ['onboardingPreferences'] });
      sessionStorage.setItem('onboarding_just_completed', 'true');
      toast.success('Preferences saved! Your feed will adapt immediately.');
      navigate(getPostLoginPath());
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
    key: keyof OnboardingPreferencesPayload['notifications']
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
    setCurrentStep((prev) => Math.min(prev + 1, stepMeta.length - 1));
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    mutation.mutate(profile);
  };

  const meta = stepMeta[currentStep];

  const displayName = useMemo(() => {
    const name = user?.full_name || user?.name || user?.email?.split('@')[0] || 'You';
    return name;
  }, [user]);

  const avatarUrl = user?.avatar_url || user?.profile_picture;

  const signalsOn = useMemo(
    () =>
      signalItems
        .filter((item) => profile.notifications[item.key])
        .map((item) => item.title),
    [profile.notifications]
  );

  return (
    <WebOnboardingSplitShell
      heroSrc={meta.heroSrc}
      step={currentStep + 1}
      headline={meta.headline}
      subcopy={meta.subcopy}
    >
      {isLoading ? (
        <div className="grid gap-3">
          <div className={cn('animate-pulse rounded-2xl p-6', t.inset)} />
          <div className={cn('animate-pulse rounded-2xl p-6', t.inset)} />
          <div className={cn('animate-pulse rounded-2xl p-6', t.inset)} />
        </div>
      ) : currentStep === 0 ? (
        <>
          <div className="space-y-2">
            <h2 className={cn('text-[28px] font-bold leading-tight', t.heading)}>{meta.panelTitle}</h2>
            <p className={cn('text-sm', t.muted)}>{meta.panelHint}</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {interestOptions.map((interest) => (
              <PhotoSelectTile
                key={interest.label}
                imageSrc={interest.image}
                label={interest.label}
                selected={profile.interests.includes(interest.label)}
                onClick={() => toggleArrayValue('interests', interest.label)}
              />
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <p className={cn('text-[13px] font-medium', t.muted)}>
              {profile.interests.length} selected
            </p>
            <button type="button" onClick={nextStep} className={pillPrimary}>
              Continue
            </button>
          </div>
        </>
      ) : currentStep === 1 ? (
        <>
          <div className="space-y-1">
            <h2 className={cn('text-[22px] font-bold', t.heading)}>{meta.panelTitle}</h2>
            <p className={cn('text-[13px]', t.muted)}>{meta.panelHint}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {homeBaseCities.map((city) => (
              <PhotoSelectTile
                key={city.label}
                imageSrc={city.image}
                label={city.label}
                selected={profile.homeBase === city.label}
                showCheck={false}
                aspect="city"
                onClick={() => setProfile((prev) => ({ ...prev, homeBase: city.label }))}
              />
            ))}
          </div>

          <div className="space-y-3">
            <h3 className={cn('text-lg font-bold', t.heading)}>Also open to</h3>
            <div className="flex flex-wrap gap-2">
              {preferredCityOptions.map((city) => (
                <CityChip
                  key={city}
                  label={city}
                  selected={profile.preferredCities.includes(city)}
                  onClick={() => toggleArrayValue('preferredCities', city)}
                  isDark={t.isDark}
                />
              ))}
            </div>
          </div>

          <div
            className={cn(
              'flex w-full flex-col gap-2 rounded-[14px] border px-4 py-3.5',
              t.isDark ? 'border-[#21262d] bg-[#161b22]' : 'border-[#e8ecf0] bg-[#f6f8fa]'
            )}
          >
            <label className={cn('text-xs font-semibold', t.muted)}>
              Anything else about where you go out?
            </label>
            <Textarea
              placeholder="Westlands & Kilimani weekends…"
              value={profile.collaborationNotes}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  collaborationNotes: event.target.value,
                }))
              }
              rows={2}
              className={cn(
                'min-h-[48px] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0',
                t.heading
              )}
            />
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={previousStep} className={outlineNav(t.isDark)}>
              Back
            </button>
            <button type="button" onClick={nextStep} className={pillPrimary}>
              Continue
            </button>
          </div>
        </>
      ) : currentStep === 2 ? (
        <>
          <div className="space-y-2">
            <h2 className={cn('text-[28px] font-bold leading-tight', t.heading)}>{meta.panelTitle}</h2>
            <p className={cn('text-sm', t.muted)}>{meta.panelHint}</p>
          </div>

          <div className="flex flex-col gap-4">
            {signalItems.map((item) => {
              const enabled = profile.notifications[item.key];
              return (
                <div
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleNotification(item.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleNotification(item.key);
                    }
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-4 rounded-[18px] border px-5 py-[18px] text-left transition-colors touch-manipulation',
                    enabled
                      ? t.isDark
                        ? 'border-[1.5px] border-[#ff6b35] bg-[#161b22]'
                        : 'border-[1.5px] border-[#ff6b35] bg-[#f6f8fa]'
                      : t.isDark
                        ? 'border border-[#21262d] bg-[#161b22]'
                        : 'border border-[#e8ecf0] bg-[#f6f8fa]'
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <p className={cn('text-base font-semibold', t.heading)}>{item.title}</p>
                    <p className={cn('text-[13px]', t.muted)}>{item.description}</p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => {
                      setProfile((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, [item.key]: checked },
                      }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 data-[state=checked]:bg-[#ff6b35]"
                  />
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-[rgba(255,107,53,0.12)] px-4 py-3">
            <p className="text-[13px] font-medium text-[#ff6b35]">
              Tip: start lean — you can always turn more on later.
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={previousStep} className={outlineNav(t.isDark)}>
              Back
            </button>
            <button type="button" onClick={nextStep} className={pillPrimary}>
              Continue
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className={cn('text-[28px] font-bold leading-tight', t.heading)}>{meta.panelTitle}</h2>

          <div
            className={cn(
              'overflow-hidden rounded-[20px] border',
              t.isDark ? 'border-[#21262d] bg-[#161b22]' : 'border-[#e8ecf0] bg-[#f6f8fa]'
            )}
          >
            <div className="relative h-[140px] w-full overflow-hidden">
              <img
                src="/onboarding/summary-banner.png"
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-[rgba(13,17,23,0.35)]" />
            </div>

            <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
              <div className="flex items-center gap-3.5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-[#ff6b35]/20 text-lg font-bold text-[#ff6b35]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn('truncate text-lg font-bold', t.heading)}>{displayName}</p>
                  <p className={cn('text-[13px]', t.muted)}>
                    Home base · {profile.homeBase || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className={cn('text-[11px] font-semibold uppercase', t.muted)}>Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((label) => <SummaryChip key={label} label={label} />)
                  ) : (
                    <span className={cn('text-sm', t.muted)}>None selected</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className={cn('text-[11px] font-semibold uppercase', t.muted)}>Also open to</p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredCities.length > 0 ? (
                    profile.preferredCities.map((label) => (
                      <SummaryChip key={label} label={label} />
                    ))
                  ) : (
                    <span className={cn('text-sm', t.muted)}>Any location</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className={cn('text-[11px] font-semibold uppercase', t.muted)}>Signals on</p>
                <div className="flex flex-wrap gap-2">
                  {signalsOn.length > 0 ? (
                    signalsOn.map((label) => <SummaryChip key={label} label={label} />)
                  ) : (
                    <span className={cn('text-sm', t.muted)}>None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={previousStep} className={outlineNav(t.isDark)}>
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className={pillPrimary}
            >
              {mutation.isPending ? 'Saving…' : 'Save & open Home'}
            </button>
          </div>
        </>
      )}
    </WebOnboardingSplitShell>
  );
};

export default Onboarding;
