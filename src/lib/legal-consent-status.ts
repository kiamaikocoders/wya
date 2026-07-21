import {
  ATTENDEE_TERMS_VERSION,
  MEDIA_CONSENT_VERSION,
  PRIVACY_POLICY_VERSION,
} from '@/legal/policy-versions';
import type { Profile } from '@/lib/user-service';

/** Matches primary DB admin check (username = 'admin'); exempt from media posting gate like ghost accounts. */
export function isPrimaryAdminProfile(profile: Profile | null | undefined): boolean {
  return profile?.username === 'admin';
}

/**
 * Reasons public user-generated content (posts, stories, comments) may be blocked client-side.
 * Ghost and primary admin profiles are always allowed through here; RLS enforces the same for admins/ghosts.
 */
export type PostingBlockReason = 'not_signed_in' | 'legal_reconsent_required' | 'media_consent_required';

export function getPostingBlockReason(
  profile: Profile | null | undefined,
): PostingBlockReason | null {
  if (!profile?.id) return 'not_signed_in';
  if (profile.is_ghost === true) return null;
  if (isPrimaryAdminProfile(profile)) return null;
  if (profileNeedsLegalReconsent(profile)) return 'legal_reconsent_required';
  if (profile.media_consent !== true) return 'media_consent_required';
  return null;
}

/** True when the user must confirm current Attendee Terms, Privacy Policy, and media consent version. */
export function profileNeedsLegalReconsent(profile: Profile | null | undefined): boolean {
  if (!profile?.id) return false;
  // Ghost accounts are synthetic; admins post via automation — no attendee consent flow.
  if (profile.is_ghost === true) return false;
  return (
    profile.terms_version_accepted !== ATTENDEE_TERMS_VERSION ||
    profile.privacy_version_accepted !== PRIVACY_POLICY_VERSION ||
    profile.media_consent_version !== MEDIA_CONSENT_VERSION
  );
}

const SKIP_PREFIXES = [
  '/welcome',
  '/login',
  '/signup',
  '/admin-login',
  '/forgot-password',
  '/reset-password',
  '/email-confirmation-pending',
  '/auth/',
  '/events',
] as const;

export function shouldSkipLegalConsentGate(pathname: string): boolean {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  return SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}
