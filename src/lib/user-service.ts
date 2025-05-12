
import { supabase } from './supabase';
import { toast } from 'sonner';

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
  location?: string; // Added location property
}

export interface UpdateProfilePayload {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string; // Added location property
}

export const userService = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.email || 'Anonymous User',
        profile_picture: profile?.avatar_url,
        bio: profile?.bio,
        location: profile?.location, // Use location property
        user_type: user.user_metadata?.user_type || 'attendee',
        created_at: profile?.created_at
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  updateProfile: async (userId: string, profile: UpdateProfilePayload): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          location: profile.location, // Use location property
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  },
  
  getUserProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
};
