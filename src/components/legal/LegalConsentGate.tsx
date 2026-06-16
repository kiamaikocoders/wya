import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/user-service';
import { consentService } from '@/lib/consent-service';
import {
  profileNeedsLegalReconsent,
  shouldSkipLegalConsentGate,
} from '@/lib/legal-consent-status';
import {
  ATTENDEE_TERMS_VERSION,
  MEDIA_CONSENT_VERSION,
  PRIVACY_POLICY_VERSION,
} from '@/legal/policy-versions';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Blocks the app for signed-in users until current Attendee Terms, Privacy Policy,
 * and media consent version are accepted (and optional preferences reviewed).
 */
export function LegalConsentGate() {
  const { user, loading: authLoading, refreshAuth, isAdmin } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const skip = shouldSkipLegalConsentGate(location.pathname);

  // Admins operate ghost tooling and may not use attendee signup/consent on their operator account.
  const enabled = Boolean(user?.id && !skip && !authLoading && !isAdmin);

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user!.id),
    enabled,
  });

  const needsGate = Boolean(
    enabled && profile && profileNeedsLegalReconsent(profile)
  );

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [mediaChoice, setMediaChoice] = useState<'yes' | 'no' | ''>('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [locationOptIn, setLocationOptIn] = useState(false);
  const [organizerOptIn, setOrganizerOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile || !profileNeedsLegalReconsent(profile)) return;
    setMarketingOptIn(profile.marketing_consent ?? false);
    setLocationOptIn(profile.location_consent ?? false);
    setOrganizerOptIn(profile.organizer_content_sharing_opt_in ?? true);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setMediaChoice('');
  }, [
    profile?.id,
    profile?.terms_version_accepted,
    profile?.privacy_version_accepted,
    profile?.media_consent_version,
  ]);

  const showBlockingLoading = enabled && isLoading;
  const open = Boolean(needsGate || (enabled && isError) || showBlockingLoading);

  const canSubmit =
    acceptTerms &&
    acceptPrivacy &&
    (mediaChoice === 'yes' || mediaChoice === 'no') &&
    !submitting &&
    profile;

  const handleSubmit = async () => {
    if (!user?.id || !profile || !canSubmit) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const mediaYes = mediaChoice === 'yes';

    try {
      await userService.updateProfile({
        terms_version_accepted: ATTENDEE_TERMS_VERSION,
        terms_accepted_at: now,
        privacy_version_accepted: PRIVACY_POLICY_VERSION,
        privacy_accepted_at: now,
        media_consent: mediaYes,
        marketing_consent: marketingOptIn,
        location_consent: locationOptIn,
        organizer_content_sharing_opt_in: organizerOptIn,
      });

      await consentService.logConsent({
        userId: user.id,
        consentType: 'terms',
        granted: true,
        policyVersion: ATTENDEE_TERMS_VERSION,
      });
      await consentService.logConsent({
        userId: user.id,
        consentType: 'privacy',
        granted: true,
        policyVersion: PRIVACY_POLICY_VERSION,
      });
      await consentService.logConsent({
        userId: user.id,
        consentType: 'media',
        granted: mediaYes,
        policyVersion: MEDIA_CONSENT_VERSION,
      });

      if (marketingOptIn !== (profile.marketing_consent ?? false)) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'marketing',
          granted: marketingOptIn,
          policyVersion: PRIVACY_POLICY_VERSION,
        });
      }
      if (locationOptIn !== (profile.location_consent ?? false)) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'location',
          granted: locationOptIn,
          policyVersion: PRIVACY_POLICY_VERSION,
        });
      }
      if (organizerOptIn !== (profile.organizer_content_sharing_opt_in ?? true)) {
        await consentService.logConsent({
          userId: user.id,
          consentType: 'organizer_content_sharing',
          granted: organizerOptIn,
          policyVersion: PRIVACY_POLICY_VERSION,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      await refreshAuth();
      toast.success('Thank you. Your choices have been saved.');
    } catch (e) {
      console.error(e);
      toast.error('Could not save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user?.id || skip || authLoading) {
    return null;
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className={
          // flex + inset positioning so tall content is not clipped on phones (avoids top-1/2 centering)
          'flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden border border-border bg-card p-0 shadow-lg ' +
          'fixed left-1/2 top-4 bottom-4 z-50 -translate-x-1/2 translate-y-0 rounded-xl ' +
          'sm:bottom-auto sm:top-1/2 sm:max-h-[min(90vh,720px)] sm:-translate-y-1/2 sm:rounded-lg'
        }
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {showBlockingLoading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
            <AlertDialogTitle className="sr-only">Loading your account</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Please wait while we load your profile.
            </AlertDialogDescription>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading your account…</p>
          </div>
        )}

        {enabled && isError && !isLoading && (
          <div className="flex flex-1 flex-col justify-center gap-4 px-4 py-6">
            <AlertDialogHeader>
              <AlertDialogTitle>Could not load your profile</AlertDialogTitle>
              <AlertDialogDescription>
                We need your profile to check policy acceptance. Please try again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Button type="button" className="w-full" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {needsGate && !showBlockingLoading && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 pt-4 pb-2 [-webkit-overflow-scrolling:touch]">
              <AlertDialogHeader className="text-left">
                <AlertDialogTitle>Please review and confirm</AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  Our Attendee Terms, Privacy Policy, or media consent have been updated, or your
                  account needs a one-time confirmation. You must accept the required items below to
                  keep using WYA.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-4 space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="gate-terms"
                    checked={acceptTerms}
                    onCheckedChange={(c) => setAcceptTerms(c === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="gate-terms" className="text-sm leading-snug cursor-pointer">
                    I agree to the{' '}
                    <Link
                      to="/terms-of-service"
                      className="text-primary underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Attendee Terms and Conditions
                    </Link>{' '}
                    (version {ATTENDEE_TERMS_VERSION}).
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="gate-privacy"
                    checked={acceptPrivacy}
                    onCheckedChange={(c) => setAcceptPrivacy(c === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="gate-privacy" className="text-sm leading-snug cursor-pointer">
                    I agree to the{' '}
                    <Link
                      to="/privacy-policy"
                      className="text-primary underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Privacy Policy
                    </Link>{' '}
                    (version {PRIVACY_POLICY_VERSION}).
                  </label>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium">Photos, video, and audio for marketing</p>
                <p className="text-xs text-muted-foreground">
                  Open the{' '}
                  <Link to="/media-consent" className="text-primary underline" target="_blank" rel="noreferrer">
                    Media consent
                  </Link>{' '}
                  form for full wording (version {MEDIA_CONSENT_VERSION}).
                </p>
                <RadioGroup
                  value={mediaChoice === '' ? undefined : mediaChoice}
                  onValueChange={(v) => setMediaChoice(v as 'yes' | 'no')}
                  className="gap-3"
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="yes" id="gate-media-yes" className="mt-0.5" />
                    <label htmlFor="gate-media-yes" className="text-sm leading-snug cursor-pointer">
                      I consent to the collection and use of my image, video, and/or audio recordings
                      for promotional and marketing purposes, as described in the Media consent form.
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="no" id="gate-media-no" className="mt-0.5" />
                    <label htmlFor="gate-media-no" className="text-sm leading-snug cursor-pointer">
                      I do not consent to the collection and use of my image, video, and/or audio
                      recordings for promotional and marketing purposes.
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="mt-4 space-y-3 rounded-md border border-border bg-muted/30 p-3 pb-4">
                <p className="text-sm font-medium">Other preferences</p>
                <p className="text-xs text-muted-foreground">
                  Confirm or update these now; you can change them anytime in Settings.
                </p>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="gate-mkt" className="text-sm font-normal cursor-pointer">
                    Marketing and partner events
                  </Label>
                  <Switch
                    id="gate-mkt"
                    checked={marketingOptIn}
                    onCheckedChange={setMarketingOptIn}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="gate-loc" className="text-sm font-normal cursor-pointer">
                    Location-based recommendations (when enabled on your device)
                  </Label>
                  <Switch
                    id="gate-loc"
                    checked={locationOptIn}
                    onCheckedChange={setLocationOptIn}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="gate-org" className="text-sm font-normal cursor-pointer">
                    Share event posts with organisers for promotion
                  </Label>
                  <Switch id="gate-org" checked={organizerOptIn} onCheckedChange={setOrganizerOptIn} />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-card px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <Button
                type="button"
                className="w-full"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save and continue'
                )}
              </Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
