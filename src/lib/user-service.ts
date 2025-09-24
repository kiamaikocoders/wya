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
  location?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
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
        location: profile?.location || '',
        user_type: user.user_metadata?.user_type || 'attendee',
        created_at: profile?.created_at
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  updateProfile: async (profile: UpdateProfilePayload): Promise<boolean> => {
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
      if (profile.avatar_url !== undefined) updateData.avatar_url = profile.avatar_url;
      if (profile.bio !== undefined) updateData.bio = profile.bio;
      if (profile.location !== undefined) updateData.location = profile.location;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
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
        .select('*')
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
        .select('*')
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
  }
};
