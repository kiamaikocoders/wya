
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
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
      return null;
    }
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
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
      return null;
    }
  },

  searchProfiles: async (query: string): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
      return [];
    }
  },

  getProfilesByIds: async (ids: string[]): Promise<Profile[]> => {
    try {
      if (!ids || ids.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
      return [];
    }
  },
  
  // Adding the missing method that's referenced in UserProfile.tsx
  getProfileByUsername: async (username: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      
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
      return null;
    }
  }
};
