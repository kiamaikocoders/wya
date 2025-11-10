import { supabase } from './supabase';

export type OnboardingPreferencesPayload = {
  interests: string[];
  homeBase: string;
  preferredCities: string[];
  collaborationNotes: string;
  notifications: {
    aiDigest: boolean;
    partnerPitches: boolean;
    communityHighlights: boolean;
  };
};

type OnboardingPreferencesRow = {
  user_id: string;
  interests: string[] | null;
  home_base: string | null;
  preferred_cities: string[] | null;
  collaboration_notes: string | null;
  notify_ai_digest: boolean | null;
  notify_partner_pitches: boolean | null;
  notify_community_highlights: boolean | null;
};

const mapRowToPayload = (row: OnboardingPreferencesRow) => ({
  interests: row.interests ?? [],
  homeBase: row.home_base ?? '',
  preferredCities: row.preferred_cities ?? [],
  collaborationNotes: row.collaboration_notes ?? '',
  notifications: {
    aiDigest: row.notify_ai_digest ?? true,
    partnerPitches: row.notify_partner_pitches ?? true,
    communityHighlights: row.notify_community_highlights ?? false,
  },
});

export const onboardingService = {
  async getPreferences(): Promise<OnboardingPreferencesPayload | null> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error, status } = await supabase
      .from('user_onboarding_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && status !== 406) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapRowToPayload(data as OnboardingPreferencesRow);
  },

  async upsertPreferences(payload: OnboardingPreferencesPayload): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase.from('user_onboarding_preferences').upsert(
      {
        user_id: user.id,
        interests: payload.interests,
        home_base: payload.homeBase || null,
        preferred_cities: payload.preferredCities,
        collaboration_notes: payload.collaborationNotes || null,
        notify_ai_digest: payload.notifications.aiDigest,
        notify_partner_pitches: payload.notifications.partnerPitches,
        notify_community_highlights: payload.notifications.communityHighlights,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw error;
    }
  },
};


