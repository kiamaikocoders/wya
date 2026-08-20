import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { WebOnboardingSplitShell } from '@/components/onboarding/WebOnboardingSplitShell';
import { CityChip } from '@/components/onboarding/CityChip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { prepareMediaForUpload } from '@/lib/media-upload-prepare';
import { uploadToR2 } from '@/lib/r2-upload';
import { getPostLoginPath } from '@/lib/post-auth-navigation';

interface EventProposal {
  title: string;
  description: string;
  category: string;
  estimatedDate: string;
  location: string;
  expectedAttendees: string;
  sponsorNeeds: string;
  contactEmail: string;
  contactPhone: string;
  additionalInfo: string;
  imageUrl?: string;
}

const stepMeta = [
  {
    heroSrc: '/request-event/hero-concept.png',
    headline: 'Pitch the night.',
    subcopy:
      'Tell WYA what you want to host. We review proposals before they go live — not an instant publish.',
    panelTitle: 'Concept',
    panelHint: 'Title, category, story — and a cover image for reviewers.',
  },
  {
    heroSrc: '/request-event/hero-logistics.png',
    headline: 'When & where.',
    subcopy:
      'Tentative date, venue or city, and expected headcount — enough for reviewers to plan.',
    panelTitle: 'Logistics',
    panelHint: 'Share timing, location, and scale.',
  },
  {
    heroSrc: '/request-event/hero-collab.png',
    headline: 'Who partners in?',
    subcopy:
      'Sponsors, brands, and how we reach you. Optional — but it speeds up review.',
    panelTitle: 'Collaboration',
    panelHint: 'Partnership needs and contact details.',
  },
  {
    heroSrc: '/request-event/hero-review.png',
    headline: 'Ready to send.',
    subcopy: 'Confirm the pitch. WYA reviews before anything goes live on the platform.',
    panelTitle: 'Review & submit',
    panelHint: '',
  },
] as const;

const categoryOptions = [
  'Music',
  'Food & Drink',
  'Arts & Culture',
  'Nightlife',
  'Business',
  'Other',
] as const;

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

function fieldLabel(isDark: boolean) {
  return cn('text-[11px] font-semibold uppercase tracking-wide', isDark ? 'text-[#8b949e]' : 'text-[#5c6570]');
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-[rgba(255,107,53,0.15)] px-3 py-1.5 text-xs font-semibold text-[#ff6b35]">
      {label}
    </span>
  );
}

function formatReviewDate(iso: string) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

const RequestEvent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const t = useWebAuthTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [proposal, setProposal] = useState<EventProposal>({
    title: '',
    description: '',
    category: '',
    estimatedDate: '',
    location: '',
    expectedAttendees: '',
    sponsorNeeds: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    additionalInfo: '',
  });

  useEffect(() => {
    if (user?.email) {
      setProposal((prev) => (prev.contactEmail ? prev : { ...prev, contactEmail: user.email }));
    }
  }, [user?.email]);

  const meta = stepMeta[currentStep];
  const inputClass = t.input;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProposal((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const prepared = await prepareMediaForUpload(file, 'proposal');
      const fileExt = prepared.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const folder = authUser ? `proposals/${authUser.id}` : 'proposals/guest';
      const filePath = `${folder}/${fileName}`;

      const { publicUrl } = await uploadToR2({
        bucket: 'event-images',
        file: prepared,
        path: filePath,
        contentType: prepared.type || 'image/jpeg',
        allowGuest: !authUser,
      });

      setProposal((prev) => ({ ...prev, imageUrl: publicUrl }));
      setPreviewUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
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
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    void handleImageUpload(file);
  };

  const removeImage = () => {
    setProposal((prev) => ({ ...prev, imageUrl: '' }));
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!proposal.title || !proposal.description || !proposal.category) {
        toast.error('Add a title, description, and category to continue.');
        return;
      }
      if (!proposal.imageUrl || isUploading) {
        toast.error(
          isUploading
            ? 'Wait for the cover image to finish uploading.'
            : 'Add a cover image before continuing.'
        );
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
      const email = proposal.contactEmail.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Enter a valid contact email so we can send you updates.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, stepMeta.length - 1));
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
    if (!proposal.imageUrl) {
      toast.error('A cover image is required before submitting.');
      setCurrentStep(0);
      return;
    }
    const contactEmail = proposal.contactEmail.trim().toLowerCase();
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error('A valid contact email is required for feedback.');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const descriptionWithContext = proposal.additionalInfo
        ? `${proposal.description}\n\n---\nAdditional context:\n${proposal.additionalInfo}`
        : proposal.description;

      const { data, error } = await supabase.functions.invoke('submit-proposal', {
        body: {
          action: 'submit',
          title: proposal.title,
          description: descriptionWithContext,
          category: proposal.category,
          estimated_date: proposal.estimatedDate || null,
          location: proposal.location || null,
          expected_attendees: proposal.expectedAttendees || null,
          sponsor_needs: proposal.sponsorNeeds || null,
          image_url: proposal.imageUrl,
          contact_email: contactEmail,
          contact_phone: proposal.contactPhone || null,
        },
      });

      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string; emails_sent?: string[] } | null;
      if (payload?.error) throw new Error(payload.error);
      if (!payload?.ok) throw new Error('Could not submit proposal');

      toast.success(
        payload.emails_sent?.length
          ? 'Proposal sent! Check your email for a confirmation.'
          : 'Proposal sent! We’ll review and follow up shortly.'
      );
      navigate(isAuthenticated ? getPostLoginPath() : '/');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit proposal. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverSrc = previewUrl || '/request-event/cover-placeholder.png';
  const reviewBanner = previewUrl || '/request-event/review-banner.png';

  const reviewChips = useMemo(() => {
    const chips: string[] = [];
    const dateLabel = formatReviewDate(proposal.estimatedDate);
    if (dateLabel) chips.push(dateLabel);
    if (proposal.location) chips.push(proposal.location);
    if (proposal.expectedAttendees) chips.push(`~${proposal.expectedAttendees} guests`);
    if (proposal.contactEmail) chips.push(proposal.contactEmail);
    return chips;
  }, [proposal]);

  return (
    <div className={cn('flex min-h-screen flex-col', t.pageBg)}>
      <header
        className={cn(
          'sticky top-0 z-40 flex h-[66px] items-center justify-between border-b px-4 py-4 sm:px-8',
          t.isDark ? 'border-[#21262d] bg-[#0d1117]' : 'border-[#e8ecf0] bg-white'
        )}
      >
        <div className="flex items-center gap-3">
          <Logo
            href="/"
            size="sm"
            className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0"
          />
          <span className="text-[13px] font-semibold text-[#ff6b35]">Request event</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ModeToggle />
        </div>
      </header>

      <WebOnboardingSplitShell
        heroSrc={meta.heroSrc}
        step={currentStep + 1}
        stepBadge={`PROPOSAL · STEP ${currentStep + 1} OF 4`}
        headline={meta.headline}
        subcopy={meta.subcopy}
        embedded
      >
      {currentStep === 0 ? (
        <>
          <div className="space-y-1.5">
            <h2 className={cn('text-[28px] font-bold leading-tight', t.heading)}>{meta.panelTitle}</h2>
            <p className={cn('text-sm', t.muted)}>{meta.panelHint}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="title" className={fieldLabel(t.isDark)}>
              Event title *
            </label>
            <Input
              id="title"
              name="title"
              value={proposal.title}
              onChange={handleChange}
              placeholder="Rooftop Sundowner Nairobi"
              className={cn(inputClass, 'h-11 rounded-xl')}
            />
          </div>

          <div className="space-y-2">
            <p className={fieldLabel(t.isDark)}>Category *</p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <CityChip
                  key={cat}
                  label={cat}
                  selected={proposal.category === cat}
                  onClick={() => setProposal((prev) => ({ ...prev, category: cat }))}
                  isDark={t.isDark}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className={fieldLabel(t.isDark)}>
              Description *
            </label>
            <Textarea
              id="description"
              name="description"
              value={proposal.description}
              onChange={handleChange}
              placeholder="Share the story, audience, and vibe…"
              rows={4}
              className={cn(
                'min-h-[88px] rounded-xl border px-3.5 py-3 text-sm',
                t.isDark
                  ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3] placeholder:text-[#8b949e]'
                  : 'border-[#d0d7de] bg-white text-[#0d1117] placeholder:text-[#8b949e]'
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <img
              src={coverSrc}
              alt=""
              className="h-[100px] w-[160px] rounded-xl object-cover"
            />
            <div className="space-y-1.5">
              <p className={cn('text-sm font-semibold', t.heading)}>Cover image *</p>
              <p className={cn('text-xs', t.muted)}>PNG or JPG · required for review</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                    t.isDark
                      ? 'border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-white/5'
                      : 'border-[#d0d7de] bg-[#f6f8fa] text-[#0d1117] hover:bg-black/5'
                  )}
                >
                  {isUploading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" /> Uploading…
                    </span>
                  ) : previewUrl ? (
                    'Replace photo'
                  ) : (
                    'Add photo'
                  )}
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className={cn('rounded-full px-3.5 py-2 text-xs font-semibold', t.muted)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-end pt-2">
            <button type="button" onClick={handleNext} className={pillPrimary}>
              Continue
            </button>
          </div>
        </>
      ) : currentStep === 1 ? (
        <>
          <div className="space-y-1.5">
            <h2 className={cn('text-[28px] font-bold leading-tight', t.heading)}>{meta.panelTitle}</h2>
            <p className={cn('text-sm', t.muted)}>{meta.panelHint}</p>
          </div>

          <div className="relative h-[180px] w-full overflow-hidden rounded-[18px]">
            <img
              src="/request-event/logistics-vibe.png"
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-[rgba(13,17,23,0.45)]" />
            <div className="absolute bottom-5 left-6 space-y-1">
              <p className="text-xs font-semibold text-[#ff6b35]">Suggested vibe</p>
              <p className="text-lg font-bold text-white">Indoor loft · Westlands-ready</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full space-y-1.5 sm:max-w-[240px]">
              <label htmlFor="estimatedDate" className={fieldLabel(t.isDark)}>
                Estimated date *
              </label>
              <Input
                id="estimatedDate"
                name="estimatedDate"
                type="date"
                value={proposal.estimatedDate}
                onChange={handleChange}
                className={cn(inputClass, 'h-11 rounded-xl')}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label htmlFor="location" className={fieldLabel(t.isDark)}>
                Location *
              </label>
              <Input
                id="location"
                name="location"
                value={proposal.location}
                onChange={handleChange}
                placeholder="Venue, city, or concept"
                className={cn(inputClass, 'h-11 rounded-xl')}
              />
            </div>
          </div>

          <div className="w-full max-w-[240px] space-y-1.5">
            <label htmlFor="expectedAttendees" className={fieldLabel(t.isDark)}>
              Expected attendees
            </label>
            <Input
              id="expectedAttendees"
              name="expectedAttendees"
              value={proposal.expectedAttendees}
              onChange={handleChange}
              placeholder="e.g. 150"
              className={cn(inputClass, 'h-11 rounded-xl')}
            />
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={handleBack} className={outlineNav(t.isDark)}>
              Back
            </button>
            <button type="button" onClick={handleNext} className={pillPrimary}>
              Continue
            </button>
          </div>
        </>
      ) : currentStep === 2 ? (
        <>
          <div className="space-y-1.5">
            <h2 className={cn('text-[28px] font-bold leading-tight', t.heading)}>{meta.panelTitle}</h2>
            <p className={cn('text-sm', t.muted)}>{meta.panelHint}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sponsorNeeds" className={fieldLabel(t.isDark)}>
              Sponsorship & partner needs
            </label>
            <Textarea
              id="sponsorNeeds"
              name="sponsorNeeds"
              value={proposal.sponsorNeeds}
              onChange={handleChange}
              placeholder="Outline tiers, preferred brands, or unique asks…"
              rows={3}
              className={cn(
                'min-h-[88px] rounded-xl border px-3.5 py-3 text-sm',
                t.isDark
                  ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3] placeholder:text-[#8b949e]'
                  : 'border-[#d0d7de] bg-white text-[#0d1117] placeholder:text-[#8b949e]'
              )}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="contactEmail" className={fieldLabel(t.isDark)}>
                Contact email *
              </label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={proposal.contactEmail}
                onChange={handleChange}
                placeholder="hello@yourbrand.com"
                className={cn(inputClass, 'h-11 rounded-xl')}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label htmlFor="contactPhone" className={fieldLabel(t.isDark)}>
                Contact phone
              </label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={proposal.contactPhone}
                onChange={handleChange}
                placeholder="+254 700 000000"
                className={cn(inputClass, 'h-11 rounded-xl')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="additionalInfo" className={fieldLabel(t.isDark)}>
              Additional context
            </label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              value={proposal.additionalInfo}
              onChange={handleChange}
              placeholder="Timelines, collaborators, inspiration…"
              rows={3}
              className={cn(
                'min-h-[88px] rounded-xl border px-3.5 py-3 text-sm',
                t.isDark
                  ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3] placeholder:text-[#8b949e]'
                  : 'border-[#d0d7de] bg-white text-[#0d1117] placeholder:text-[#8b949e]'
              )}
            />
          </div>

          <div className="rounded-xl bg-[rgba(255,107,53,0.12)] px-4 py-3">
            <p className="text-[13px] font-medium text-[#ff6b35]">
              Tip: clear contact details = faster follow-up from WYA.
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={handleBack} className={outlineNav(t.isDark)}>
              Back
            </button>
            <button type="button" onClick={handleNext} className={pillPrimary}>
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
            <div className="relative h-[150px] w-full overflow-hidden">
              <img src={reviewBanner} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-[rgba(13,17,23,0.35)]" />
              <div className="absolute bottom-5 left-6 space-y-1">
                <p className="text-xs font-semibold text-[#ff6b35]">
                  {proposal.category || 'Category'}
                </p>
                <p className="text-[22px] font-bold text-white">
                  {proposal.title || 'Untitled proposal'}
                </p>
              </div>
            </div>
            <div className="space-y-3.5 px-6 pb-6 pt-5">
              <p className={cn('text-sm leading-relaxed', t.muted)}>
                {proposal.description || 'No description yet.'}
              </p>
              {reviewChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reviewChips.map((chip) => (
                    <SummaryChip key={chip} label={chip} />
                  ))}
                </div>
              )}
              {(proposal.sponsorNeeds || proposal.additionalInfo) && (
                <div className="space-y-1.5">
                  <p className={cn('text-[11px] font-semibold uppercase', t.muted)}>Partnerships</p>
                  <p className={cn('text-[13px]', t.heading)}>
                    {proposal.sponsorNeeds || proposal.additionalInfo}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              'rounded-xl border px-4 py-3',
              t.isDark ? 'border-[#21262d] bg-[#161b22]' : 'border-[#e8ecf0] bg-[#f6f8fa]'
            )}
          >
            <p className={cn('text-[13px]', t.muted)}>
              Status after submit: Pending review · you will get a notification when WYA decides.
            </p>
          </div>

          {!isAuthenticated && (
            <p className={cn('text-sm', t.muted)}>
              No account needed — we’ll email updates to your contact address. Already on WYA?{' '}
              <Link to="/login" state={{ from: '/request-event' }} className="font-semibold text-[#ff6b35]">
                Log in
              </Link>{' '}
              so we can link this to your profile.
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={handleBack} className={outlineNav(t.isDark)}>
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className={pillPrimary}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Submitting…
                </span>
              ) : (
                'Submit proposal'
              )}
            </button>
          </div>
        </>
      )}
      </WebOnboardingSplitShell>

      <SiteFooter className="mt-auto shrink-0" />
    </div>
  );
};

export default RequestEvent;
