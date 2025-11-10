
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ADMIN_CREDENTIALS } from '@/lib/admin-credentials';

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'attendee' | 'admin' | 'organizer';
  created_at: string;
  bio?: string;
  profile_picture?: string;
  avatar_url?: string;
  full_name?: string;
  username?: string;
  preferences?: {
    interests?: string[];
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Refresh authentication state from Supabase
  const refreshAuth = async () => {
    try {
      console.log('Refreshing auth...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session?.user?.id);
      
      if (session) {
        // Get profile information from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        console.log('Profile found:', !!profile);
          
        if (profile) {
          const userData: User = {
            id: profile.id,
            name: profile.full_name || '',
            email: session.user.email || '',
            user_type: profile.username === 'admin' ? 'admin' : 'attendee',
            created_at: profile.created_at,
            bio: profile.bio,
            profile_picture: profile.avatar_url,
            avatar_url: profile.avatar_url,
            full_name: profile.full_name,
            username: profile.username
          };
          
          setUser(userData);
          setIsAdmin(userData.user_type === 'admin');
        } else {
          // User authenticated but no profile found - create one
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              username: session.user.email?.split('@')[0] || 'user'
            });
          
          if (profileError) {
            console.warn('Profile creation failed:', profileError);
          }
          
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            user_type: 'attendee',
            created_at: session.user.created_at || new Date().toISOString(),
            full_name: session.user.user_metadata?.full_name || '',
            username: session.user.email?.split('@')[0] || ''
          });
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state change:', _event, session?.user?.id);
        if (session) {
          // Don't fetch profile here to avoid deadlock
          // Just update basic user data
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || '',
            email: session.user.email || '',
            user_type: 'attendee', // Default, will be updated in refreshAuth
            created_at: session.user.created_at || new Date().toISOString(),
            full_name: session.user.user_metadata?.full_name || '',
            username: session.user.email?.split('@')[0] || ''
          });
          
          // Defer profile fetch with setTimeout to avoid deadlock
          setTimeout(() => {
            refreshAuth();
          }, 100);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    refreshAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success('Login successful!');
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check if the credentials match our hardcoded admin credentials
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        // Update user type to admin
        await supabase
          .from('profiles')
          .update({ username: 'admin' })
          .eq('id', data.user.id);
          
        setIsAdmin(true);
        toast.success('Admin login successful!');
        navigate('/admin');
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error(error.message || 'Admin login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Create user with Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) throw error;
      
      // Create profile in profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: name,
            username: email.split('@')[0] // Use email prefix as username
          });
        
        if (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      }
      
      toast.success('Account created successfully! Please check your email for verification.');
      
      // We won't navigate here as the user might need to verify email first
      // depending on Supabase settings
      return;
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };
  
  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      const updates = {
        full_name: userData.name,
        avatar_url: userData.profile_picture,
        bio: userData.bio,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local user state
      setUser({ ...user, ...userData });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Error updating profile');
      throw error;
    }
  };

  const value = {
    user,
    login,
    signup,
    adminLogin,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    updateUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
