import { supabase } from './supabase';
import { resolveAvatarUrl } from './avatar-url';
import { toast } from 'sonner';
import { getDeleteMyAccountUrl } from '@/lib/supabase-functions-url';
import { MEDIA_CONSENT_VERSION } from '@/legal/policy-versions';

export interface User {
  id: string;
  email?: string;
  name: string;
  profile_picture?: string;
  bio?: string;
  location?: string;
  user_type?: 'attendee' | 'organizer' | 'admin';
  events_attended?: number;
  events_organized?: number;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  updated_at?: string;
  created_at?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string | null;
  date_of_birth?: string | null;
  terms_version_accepted?: string | null;
  terms_accepted_at?: string | null;
  privacy_version_accepted?: string | null;
  privacy_accepted_at?: string | null;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
  location_consent?: boolean;
  location_consent_at?: string | null;
  location_source?: string | null;
  location_confirm_needed?: boolean;
  organizer_content_sharing_opt_in?: boolean;
  media_consent?: boolean;
  media_consent_at?: string | null;
  media_consent_version?: string | null;
  email_notifications?: boolean;
  push_notifications?: boolean;
  profile_visibility?: string;
  two_factor_auth?: boolean;
  /** System-managed ghost accounts; exempt from attendee legal consent gate. */
  is_ghost?: boolean | null;
}

export interface UpdateProfilePayload {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string | null;
  date_of_birth?: string | null;
  terms_version_accepted?: string | null;
  terms_accepted_at?: string | null;
  privacy_version_accepted?: string | null;
  privacy_accepted_at?: string | null;
  marketing_consent?: boolean;
  location_consent?: boolean;
  location_source?: string | null;
  location_confirm_needed?: boolean;
  organizer_content_sharing_opt_in?: boolean;
  media_consent?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  profile_visibility?: string;
  two_factor_auth?: boolean;
}

export const userService = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, bio, location, latitude, longitude, created_at, phone, date_of_birth, marketing_consent, location_consent, organizer_content_sharing_opt_in, email_notifications, push_notifications, profile_visibility, two_factor_auth'
        )
        .eq('id', user.id)
        .single();
      
      return {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.email || 'Anonymous User',
        profile_picture: resolveAvatarUrl(profile?.avatar_url),
        bio: profile?.bio,
        location: profile?.location || '',
        user_type: user.user_metadata?.user_type || 'attendee',
        created_at: profile?.created_at
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  updateProfile: async (profile: UpdateProfilePayload): Promise<void> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (profile.username !== undefined) updateData.username = profile.username;
      if (profile.full_name !== undefined) updateData.full_name = profile.full_name;
      if (profile.avatar_url !== undefined) {
        // Never persist ephemeral blob:/data: URLs (they break after refresh).
        updateData.avatar_url = resolveAvatarUrl(profile.avatar_url) || null;
      }
      if (profile.bio !== undefined) updateData.bio = profile.bio;
      if (profile.location !== undefined) updateData.location = profile.location;
      if (profile.latitude !== undefined) updateData.latitude = profile.latitude;
      if (profile.longitude !== undefined) updateData.longitude = profile.longitude;
      if (
        profile.location !== undefined ||
        profile.latitude !== undefined ||
        profile.longitude !== undefined
      ) {
        updateData.location_source = profile.location_source ?? 'user';
        updateData.location_confirm_needed =
          profile.location_confirm_needed !== undefined
            ? profile.location_confirm_needed
            : false;
      }
      if (profile.location_source !== undefined) {
        updateData.location_source = profile.location_source;
      }
      if (profile.location_confirm_needed !== undefined) {
        updateData.location_confirm_needed = profile.location_confirm_needed;
      }
      if (profile.phone !== undefined) updateData.phone = profile.phone;
      if (profile.date_of_birth !== undefined) updateData.date_of_birth = profile.date_of_birth;

      const now = new Date().toISOString();
      if (profile.terms_version_accepted !== undefined) {
        updateData.terms_version_accepted = profile.terms_version_accepted;
        updateData.terms_accepted_at =
          profile.terms_accepted_at !== undefined && profile.terms_accepted_at !== null
            ? profile.terms_accepted_at
            : now;
      }
      if (profile.privacy_version_accepted !== undefined) {
        updateData.privacy_version_accepted = profile.privacy_version_accepted;
        updateData.privacy_accepted_at =
          profile.privacy_accepted_at !== undefined && profile.privacy_accepted_at !== null
            ? profile.privacy_accepted_at
            : now;
      }
      if (profile.marketing_consent !== undefined) {
        updateData.marketing_consent = profile.marketing_consent;
        updateData.marketing_consent_at = now;
      }
      if (profile.location_consent !== undefined) {
        updateData.location_consent = profile.location_consent;
        updateData.location_consent_at = now;
      }
      if (profile.organizer_content_sharing_opt_in !== undefined) {
        updateData.organizer_content_sharing_opt_in = profile.organizer_content_sharing_opt_in;
      }
      if (profile.media_consent !== undefined) {
        updateData.media_consent = profile.media_consent;
        updateData.media_consent_at = now;
        updateData.media_consent_version = MEDIA_CONSENT_VERSION;
      }
      if (profile.email_notifications !== undefined) {
        updateData.email_notifications = profile.email_notifications;
      }
      if (profile.push_notifications !== undefined) {
        updateData.push_notifications = profile.push_notifications;
      }
      if (profile.profile_visibility !== undefined) {
        updateData.profile_visibility = profile.profile_visibility;
      }
      if (profile.two_factor_auth !== undefined) {
        updateData.two_factor_auth = profile.two_factor_auth;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  getUserProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, bio, location, latitude, longitude, created_at, updated_at, phone, date_of_birth, terms_version_accepted, terms_accepted_at, privacy_version_accepted, privacy_accepted_at, marketing_consent, marketing_consent_at, location_consent, location_consent_at, location_source, location_confirm_needed, organizer_content_sharing_opt_in, media_consent, media_consent_at, media_consent_version, email_notifications, push_notifications, profile_visibility, two_factor_auth, is_ghost'
        )
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Add name property for backward compatibility
      if (data) {
        return {
          ...data,
          name: data.full_name || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },
  
  // Other existing methods
  
  searchProfiles: async (searchTerm: string): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, location, created_at')
        .ilike('full_name', `%${searchTerm}%`)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  },
  
  getProfileByUsername: async (username: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, location, latitude, longitude, created_at, updated_at')
        .eq('username', username)
        .single();

      if (error) throw error;
      
      // Add name property for compatibility
      if (data) {
        return {
          ...data,
          name: data.full_name || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
  },

  /**
   * Permanently deactivates the signed-in account (removes auth user and app data via delete-my-account).
   */
  deactivateAccount: async (): Promise<void> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not signed in');

    // Trigger Auth reauthentication email (emails/reauthentication.html) before delete
    try {
      await supabase.auth.reauthenticate();
    } catch (e) {
      console.warn('reauthenticate before deactivate', e);
    }

    const url = getDeleteMyAccountUrl();
    if (!url) {
      throw new Error(
        'Account deactivation is not configured (missing VITE_SUPABASE_URL or delete-my-account function).'
      );
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ require_reauth: false }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((body as { error?: string }).error || 'Failed to deactivate account');
    }

    await supabase.auth.signOut();
  },
};
