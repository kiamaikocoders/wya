
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ADMIN_CREDENTIALS } from '@/lib/admin-credentials';
import { getAllowedPasswordResetRedirectUrl } from '@/lib/get-redirect-url';
import { getRequestPasswordResetUrl } from '@/lib/supabase-functions-url';
import { onboardingNotifications } from '@/lib/onboarding-notifications';
import { ATTENDEE_TERMS_VERSION, PRIVACY_POLICY_VERSION } from '@/legal/policy-versions';
import type { AttendeeSignupConsents } from '@/lib/signup-consent';

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
  signup: (email: string, password: string, name: string, consents: AttendeeSignupConsents) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  verifyEmail: (token: string, tokenHash?: string) => Promise<void>;
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setLoading(false);
        return;
      }
      
      if (session) {
        // Session exists: set minimal user immediately (no network), then fetch profile.
        setUser((prev) => ({
          id: session.user.id,
          name: prev?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          user_type: prev?.user_type || 'attendee',
          created_at: prev?.created_at || session.user.created_at || new Date().toISOString(),
          bio: prev?.bio,
          profile_picture: prev?.profile_picture,
          avatar_url: prev?.avatar_url,
          full_name: prev?.full_name,
          username: prev?.username,
          preferences: prev?.preferences,
        }));

        // Fetch profile data to determine admin status before unblocking UI
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, bio, created_at')
            .eq('id', session.user.id)
            .single();

          // PGRST116 = no rows; treat as "profile missing"
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile fetch error:', profileError);
            // Continue with minimal user data
          } else if (!profile) {
            // Best-effort profile creation
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                username: session.user.email?.split('@')[0] || 'user',
              });

            if (createError) {
              console.warn('Profile creation failed:', createError);
            } else {
              // Profile created, set admin status to false (new user)
              setIsAdmin(false);
            }
          } else {
            // Profile exists, update user and admin status
            const userType: User['user_type'] =
              profile.username === 'admin' ? 'admin' : 'attendee';

            setUser((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                name: profile.full_name || prev.name,
                user_type: userType,
                created_at: profile.created_at || prev.created_at,
                bio: profile.bio ?? prev.bio,
                profile_picture: profile.avatar_url ?? prev.profile_picture,
                avatar_url: profile.avatar_url ?? prev.avatar_url,
                full_name: profile.full_name ?? prev.full_name,
                username: profile.username ?? prev.username,
              };
            });

            setIsAdmin(profile.username === 'admin');
          }
        } catch (err) {
          console.warn('Profile fetch failed:', err);
          // Continue with minimal user data, assume not admin
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

  // Track if user is new (for welcome messages)
  const [isNewUser, setIsNewUser] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null);

  // Set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        if (session) {
          // Check if this is a new user (SIGNED_UP event)
          if (event === 'SIGNED_UP') {
            setIsNewUser(true);
          } else if (event === 'SIGNED_IN') {
            setIsNewUser(false);
            // Check last login time (non-blocking - run in background)
            supabase
              .from('profiles')
              .select('last_login')
              .eq('id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                setLastLoginTime(profile?.last_login || null);
              })
              .catch(err => console.warn('Failed to fetch last_login:', err));
            
            // Update last login time (non-blocking)
            supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id)
              .then(() => {}) // Execute the query
              .catch(err => console.warn('Failed to update last_login:', err));
          }

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
          // Don't await - let it run in background
          setTimeout(() => {
            refreshAuth().catch(err => {
              console.warn('Background refreshAuth failed:', err);
            });
          }, 100);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsNewUser(false);
          setLastLoginTime(null);
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
      
      // Navigate IMMEDIATELY after successful auth - don't wait for anything
      navigate('/home');
      
      // Get user profile for welcome message (non-blocking - run after navigation)
      supabase
        .from('profiles')
        .select('full_name, last_login')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          const userName = profile?.full_name || email.split('@')[0];
          const isReturningUser = !!profile?.last_login;

          // Send welcome notification (non-blocking)
          if (isReturningUser) {
            onboardingNotifications.sendWelcomeBackNotification(data.user.id, userName).catch(err => {
              console.warn('Welcome back notification failed:', err);
            });
          } else {
            onboardingNotifications.sendWelcomeNotification(data.user.id, userName).catch(err => {
              console.warn('Welcome notification failed:', err);
            });
            // Initialize onboarding
            setTimeout(() => {
              onboardingNotifications.initializeOnboarding(data.user.id, userName).catch(err => {
                console.warn('Onboarding initialization failed:', err);
              });
            }, 1000);
          }

          toast.success(`Welcome back, ${userName}! 👋`);
        })
        .catch(err => {
          console.warn('Profile fetch failed, showing generic welcome:', err);
          toast.success('Welcome back! 👋');
        });
      
      // Backup navigation using window.location after short delay
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          console.log('Backup navigation triggered');
          window.location.href = '/home';
        }
      }, 300);
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

  const signup = async (email: string, password: string, name: string, consents: AttendeeSignupConsents) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      // Create user with Supabase auth
      // The database trigger (handle_new_user) will automatically create the profile
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: email.split('@')[0],
            phone: consents.phone?.trim() || undefined,
            date_of_birth: consents.dateOfBirth,
            terms_version_accepted: ATTENDEE_TERMS_VERSION,
            terms_accepted_at: now,
            privacy_version_accepted: PRIVACY_POLICY_VERSION,
            privacy_accepted_at: now,
            marketing_consent: consents.marketingOptIn,
            ...(consents.marketingOptIn ? { marketing_consent_at: now } : {}),
            location_consent: consents.locationOptIn,
            ...(consents.locationOptIn ? { location_consent_at: now } : {}),
            organizer_content_sharing_opt_in: consents.organizerSharingOptIn,
          }
        }
      });
      
      if (error) throw error;
      
      // Profile is automatically created by database trigger (handle_new_user)
      // No need to manually create it here
      
      // Send welcome notification (will be sent after email confirmation)
      if (data.user) {
        const userName = name || email.split('@')[0];
        // Store flag to send welcome notification after email confirmation
        localStorage.setItem('pending_welcome', JSON.stringify({
          userId: data.user.id,
          userName: userName
        }));
      }
      
      // Redirect to email confirmation pending page
      navigate('/email-confirmation-pending', { 
        state: { email: email } 
      });
      
      toast.success('Account created! Please check your email for verification.');
      
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

  const forgotPassword = async (email: string) => {
    setLoading(true);
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
          const msg = data?.error ?? (res.status === 429 ? 'Too many attempts. Try again in an hour.' : 'Failed to send reset email.');
          toast.error(msg);
          return;
        }
        toast.success('If an account exists, you will receive a reset link.');
        return;
      }
      const redirectTo = getAllowedPasswordResetRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (error) throw error;
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Forgot password error:', err.message);
      toast.error('Failed to send password reset email. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    try {
      // Supabase handles token verification automatically when user clicks the reset link
      // We just need to update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
      
      toast.success('Magic link sent! Check your email.');
    } catch (error: any) {
      console.error('Send magic link error:', error);
      toast.error(error.message || 'Failed to send magic link');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async (newEmail: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) throw error;
      
      toast.success('Verification email sent to your new email address');
    } catch (error: any) {
      console.error('Change email error:', error);
      toast.error(error.message || 'Failed to change email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string, tokenHash?: string) => {
    setLoading(true);
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
      await refreshAuth();
    } catch (error: any) {
      console.error('Verify email error:', error);
      toast.error(error.message || 'Failed to verify email');
      throw error;
    } finally {
      setLoading(false);
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
    forgotPassword,
    resetPassword,
    sendMagicLink,
    changeEmail,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
