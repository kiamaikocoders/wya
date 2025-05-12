
// Migrated authentication service using Supabase
import { supabase } from './supabase';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  user_type?: 'attendee' | 'admin' | 'organizer';
}

// Auth service functions using Supabase
export const authService = {
  // Login user with Supabase
  login: async (credentials: LoginCredentials) => {
    try {
      console.log('Login with credentials:', credentials);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Register new user with Supabase
  signup: async (credentials: SignupCredentials) => {
    try {
      console.log('Signup with credentials:', credentials);
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name,
            user_type: credentials.user_type || 'attendee'
          }
        }
      });
      
      if (error) throw error;
      
      // Create a profile for the user
      if (data.user) {
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: credentials.name,
            username: credentials.name.toLowerCase().replace(/\s+/g, '_')
          });
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue even if profile creation fails
          // The trigger should handle this automatically
        }
      }
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Special admin login
  adminLogin: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Check if user has admin role in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.username !== 'admin') {
        // Sign out the user if they're not an admin
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Admin login failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get current user with Supabase
  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profile) return null;
      
      return {
        id: user.id,
        name: profile.full_name || '',
        email: user.email || '',
        user_type: profile.username === 'admin' ? 'admin' : 'attendee',
        created_at: profile.created_at,
        bio: profile.bio,
        profile_picture: profile.avatar_url
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  // Logout user using Supabase
  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },
  
  // Check if user is admin
  isAdmin: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
      
      return profile?.username === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
  
  // Update user profile
  updateUserProfile: async (userData: { name?: string, bio?: string, profile_picture?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      
      const updates = {
        full_name: userData.name,
        bio: userData.bio,
        avatar_url: userData.profile_picture,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      
      // Return updated user
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return {
        id: user.id,
        name: profile?.full_name || '',
        email: user.email || '',
        user_type: profile?.username === 'admin' ? 'admin' : 'attendee',
        created_at: profile?.created_at,
        bio: profile?.bio,
        profile_picture: profile?.avatar_url
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  }
};
