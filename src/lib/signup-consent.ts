import { isVerifiedAdultFromDob } from '@/lib/age-verification';

export interface AttendeeSignupConsents {
  dateOfBirth: string;
  phone?: string;
  marketingOptIn: boolean;
  locationOptIn: boolean;
  organizerSharingOptIn: boolean;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export function validateSignupConsents(consents: AttendeeSignupConsents): string | null {
  if (!consents.acceptTerms) return 'You must accept the Attendee Terms & Conditions.';
  if (!consents.acceptPrivacy) return 'You must accept the Privacy Policy.';
  if (!consents.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(consents.dateOfBirth)) {
    return 'Please enter your date of birth.';
  }
  if (!isVerifiedAdultFromDob(consents.dateOfBirth)) {
    return 'You must be at least 18 years old to use WYA.';
  }
  return null;
}
