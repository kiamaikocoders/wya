import { supabase } from '@/lib/supabase';

export type ConsentType =
  | 'marketing'
  | 'location'
  | 'organizer_content_sharing'
  | 'terms'
  | 'privacy';

export const consentService = {
  async logConsent(params: {
    userId: string;
    consentType: ConsentType;
    granted: boolean;
    policyVersion?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabase.from('consent_audit').insert({
      user_id: params.userId,
      consent_type: params.consentType,
      granted: params.granted,
      policy_version: params.policyVersion ?? null,
      metadata: params.metadata ?? null,
    });
    if (error) console.error('consent_audit insert failed:', error);
  },
};
