
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
      
      // Add name property for compatibility
      if (data) {
        data.name = data.full_name || '';
      }
      
      return data;
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
      
      // Add name property for compatibility
      if (data) {
        data.name = data.full_name || '';
      }
      
      return data;
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
      
      // Add name property for compatibility
      if (data) {
        data.forEach(profile => {
          profile.name = profile.full_name || '';
        });
      }
      
      return data || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }
};
