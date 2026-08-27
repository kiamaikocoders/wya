
// Migrated authentication service using Supabase
import { supabase } from './supabase';
import { getAllowedPasswordResetRedirectUrl } from './get-redirect-url';
import { getRequestPasswordResetUrl } from './supabase-functions-url';
import { toast } from 'sonner';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

// Export User interface so it can be imported by other files
export interface User {
  id: string;
  name?: string;
  email: string;
  user_type: string;
  created_at: string;
  bio?: string;
  profile_picture?: string;
  avatar_url?: string;
}

// Auth service functions using Supabase
export const authService = {
  // Login user with Supabase
  login: async (credentials: LoginCredentials) => {
    try {
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
      // The database trigger (handle_new_user) will automatically create the profile
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name,
            username: credentials.name.toLowerCase().replace(/\s+/g, '_'), // Pass username to trigger
            user_type: credentials.user_type || 'attendee'
          }
        }
      });
      
      if (error) throw error;
      
      // Profile is automatically created by database trigger (handle_new_user)
      // No need to manually create it here
      
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
        .select('id, username')
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
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio, created_at')
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
        profile_picture: profile.avatar_url,
        avatar_url: profile.avatar_url
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
      throw error;
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
      throw error;
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
        .select('id, full_name, username, avatar_url, bio, created_at')
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
  },

  // Request password reset: uses rate-limited Edge Function if VITE_SUPABASE_URL set, else Supabase Auth (redirectTo allowlist only)
  forgotPassword: async (email: string): Promise<void> => {
    try {
      const rateLimitedUrl = getRequestPasswordResetUrl();
      if (rateLimitedUrl) {
        const res = await fetch(rateLimitedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error ?? (res.status === 429 ? 'Too many attempts. Try again in an hour.' : 'Failed to send reset email.'));
          return;
        }
        return;
      }
      const redirectTo = getAllowedPasswordResetRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
    } catch (error) {
      toast.error('Failed to send password reset email. Please try again.');
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    try {
      // First verify the token by attempting to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // If no session, we need to verify the token first
        // Supabase handles this automatically when user clicks the reset link
        // So we just update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (updateError) throw updateError;
      } else {
        // If we have a session, update password directly
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (updateError) throw updateError;
      }
      
      toast.success('Password reset successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Send magic link for passwordless login
  sendMagicLink: async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
      
      toast.success('Magic link sent! Check your email.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send magic link';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Change email address
  changeEmail: async (newEmail: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) throw error;
      
      toast.success('Verification email sent to your new email address');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change email';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Verify email with token
  verifyEmail: async (token: string, tokenHash?: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash || token,
        type: 'email'
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('Email verification failed');
      }
      
      toast.success('Email verified successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify email';
      toast.error(errorMessage);
      throw error;
    }
  }
};
