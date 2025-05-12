
import { supabase } from './supabase';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  created_at: string;
}

export const userService = {
  // Get user profile
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return {
        id: data.id,
        name: data.full_name,
        email: '', // Email is stored in auth.users, not accessible directly
        avatar_url: data.avatar_url,
        bio: data.bio,
        location: data.location || '',
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  // Update user profile
  updateUserProfile: async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          location: profileData.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Profile updated successfully');
      
      return {
        id: data.id,
        name: data.full_name,
        avatar_url: data.avatar_url,
        bio: data.bio,
        location: data.location || '',
        created_at: data.created_at
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      return null;
    }
  }
};
