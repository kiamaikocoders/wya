
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PUBLIC_PROFILE_COLUMNS } from "@/lib/profile-columns";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  name?: string; // Added for compatibility
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  location?: string; // Added location property
  followers_count?: number; // Make optional since it doesn't exist in DB
  following_count?: number; // Make optional since it doesn't exist in DB
}

export const profileService = {
  getProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq('id', userId)
        .single();

      if (error) {
        // Not found
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any).code === 'PGRST116') return null;
        throw error;
      }
      
      // Add name property for compatibility and default follower counts
      if (data) {
        const profile = data as Profile;
        profile.name = profile.full_name || '';
        profile.followers_count = 0;
        profile.following_count = 0;
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    try {
      const { name: _name, followers_count: _followers, following_count: _following, ...columns } = updates;
      const { data, error } = await supabase
        .from('profiles')
        .update(columns)
        .eq('id', userId)
        .select(PUBLIC_PROFILE_COLUMNS)
        .single();

      if (error) throw error;
      toast.success('Profile updated successfully');
      
      // Add name property for compatibility and default follower counts
      if (data) {
        const profile = data as Profile;
        profile.name = profile.full_name || '';
        profile.followers_count = 0;
        profile.following_count = 0;
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  },

  searchProfiles: async (query: string): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_COLUMNS)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      
      // Add name property for compatibility and default follower counts
      const profiles = (data || []) as Profile[];
      profiles.forEach(profile => {
        profile.name = profile.full_name || '';
        profile.followers_count = 0;
        profile.following_count = 0;
      });
      
      return profiles;
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  },

  getProfilesByIds: async (ids: string[]): Promise<Profile[]> => {
    try {
      if (!ids || ids.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_COLUMNS)
        .in('id', ids);

      if (error) throw error;

      const profiles = (data || []) as Profile[];
      profiles.forEach(profile => {
        profile.name = profile.full_name || '';
        profile.followers_count = profile.followers_count ?? 0;
        profile.following_count = profile.following_count ?? 0;
      });

      return profiles;
    } catch (error) {
      console.error('Error fetching profiles by ids:', error);
      throw error;
    }
  },
  
  // Adding the missing method that's referenced in UserProfile.tsx
  getProfileByUsername: async (username: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq('username', username)
        .single();

      if (error) {
        // Not found
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any).code === 'PGRST116') return null;
        throw error;
      }
      
      // Add name property for compatibility and default follower counts
      if (data) {
        const profile = data as Profile;
        profile.name = profile.full_name || '';
        profile.followers_count = 0;
        profile.following_count = 0;
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      throw error;
    }
  }
  ,

  /**
   * Fetch by either username OR user id (uuid).
   * The `/users/:userId` route can receive either.
   */
  getProfileByIdentifier: async (identifier: string): Promise<Profile | null> => {
    const trimmed = (identifier || '').trim();
    if (!trimmed) return null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Prefer direct id lookup when it looks like a UUID.
    if (uuidRegex.test(trimmed)) {
      const byId = await profileService.getProfile(trimmed);
      if (byId) return byId;
    }

    // Try username lookup.
    const byUsername = await profileService.getProfileByUsername(trimmed.replace(/^@/, ''));
    if (byUsername) return byUsername;

    // Fallback: if a non-uuid was passed but it's actually an id.
    return await profileService.getProfile(trimmed);
  },
};
