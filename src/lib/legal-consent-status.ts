import {
  ATTENDEE_TERMS_VERSION,
  MEDIA_CONSENT_VERSION,
  PRIVACY_POLICY_VERSION,
} from '@/legal/policy-versions';
import type { Profile } from '@/lib/user-service';

/** True when the user must confirm current Attendee Terms, Privacy Policy, and media consent version. */
export function profileNeedsLegalReconsent(profile: Profile | null | undefined): boolean {
  if (!profile?.id) return false;
  return (
    profile.terms_version_accepted !== ATTENDEE_TERMS_VERSION ||
    profile.privacy_version_accepted !== PRIVACY_POLICY_VERSION ||
    profile.media_consent_version !== MEDIA_CONSENT_VERSION
  );
}

const SKIP_PREFIXES = [
  '/login',
  '/signup',
  '/admin-login',
  '/forgot-password',
  '/reset-password',
  '/email-confirmation-pending',
  '/auth/',
] as const;

export function shouldSkipLegalConsentGate(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}
