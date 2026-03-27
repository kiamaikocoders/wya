/** Legal copy lives in .txt files for readable paragraph breaks; import via Vite ?raw. */

import attendeeTerms from './attendee-terms.txt?raw';
import privacyPolicy from './privacy-policy.txt?raw';
import mediaConsent from './media-consent.txt?raw';

export const ATTENDEE_TERMS_PLAIN = attendeeTerms.trimEnd() + '\n';
export const PRIVACY_POLICY_PLAIN = privacyPolicy.trimEnd() + '\n';
export const MEDIA_CONSENT_PLAIN = mediaConsent.trimEnd() + '\n';
