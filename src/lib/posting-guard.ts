import { userService } from '@/lib/user-service';
import { getPostingBlockReason } from '@/lib/legal-consent-status';

/** Thrown when the user must grant media consent before posting (forum, stories, comments, etc.). */
export class MediaConsentRequiredForPostingError extends Error {
  readonly code = 'MEDIA_CONSENT_REQUIRED' as const;
  constructor() {
    super('Media consent is required to post.');
    this.name = 'MediaConsentRequiredForPostingError';
  }
}

export class LegalReconsentRequiredForPostingError extends Error {
  readonly code = 'LEGAL_RECONSENT_REQUIRED' as const;
  constructor() {
    super('Please complete the updated legal consent before posting.');
    this.name = 'LegalReconsentRequiredForPostingError';
  }
}

/** Server/client guard before inserting user-generated public content. */
export async function assertUserMayPostUserGeneratedContent(userId: string): Promise<void> {
  const profile = await userService.getUserProfile(userId);
  const reason = getPostingBlockReason(profile);
  if (reason === 'media_consent_required') throw new MediaConsentRequiredForPostingError();
  if (reason === 'legal_reconsent_required') throw new LegalReconsentRequiredForPostingError();
  if (reason === 'not_signed_in') throw new Error('You must be signed in to post.');
}

export function isMediaConsentPostingError(e: unknown): e is MediaConsentRequiredForPostingError {
  return e instanceof MediaConsentRequiredForPostingError;
}
