import { supabase } from '@/lib/supabase';

export type TotpFactor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
};

/**
 * List verified TOTP factors for the current user.
 */
export async function listVerifiedTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp ?? []).filter((f) => f.status === 'verified') as TotpFactor[];
}

/**
 * Whether the signed-in user has at least one verified TOTP factor.
 */
export async function hasVerifiedTotp(): Promise<boolean> {
  const factors = await listVerifiedTotpFactors();
  return factors.length > 0;
}

/**
 * Whether login still needs an MFA challenge (AAL1 → AAL2).
 */
export async function needsMfaChallenge(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data.currentLevel === 'aal1' && data.nextLevel === 'aal2';
}

export type EnrollTotpResult = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

/**
 * Start TOTP enrollment — returns QR SVG data URL + secret for manual entry.
 */
export async function enrollTotp(friendlyName = 'WYA Authenticator'): Promise<EnrollTotpResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });
  if (error) throw error;
  if (!data?.id || !data.totp) throw new Error('Could not start authenticator setup');

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/**
 * Verify a TOTP code for a factor (enrollment or login challenge).
 */
export async function verifyTotpCode(factorId: string, code: string): Promise<void> {
  const trimmed = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error('Enter the 6-digit code from your authenticator app');
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) throw challengeError;
  if (!challenge?.id) throw new Error('Could not create MFA challenge');

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: trimmed,
  });
  if (verifyError) throw verifyError;
}

/**
 * Unenroll a TOTP factor (requires a verified AAL2 session when MFA is active).
 */
export async function unenrollTotp(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

/**
 * Keep profiles.two_factor_auth in sync with real TOTP enrollment.
 */
export async function syncTwoFactorProfileFlag(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ two_factor_auth: enabled })
    .eq('id', userId);
  if (error) {
    console.warn('Failed to sync two_factor_auth profile flag', error.message);
  }
}
