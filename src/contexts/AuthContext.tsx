import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authService } from '@/lib/auth-service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, userType: 'attendee' | 'organizer') => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (error instanceof Error && error.message.includes('authentication')) {
        authService.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_token' && !event.newValue) {
        setUser(null);
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
      navigate('/');
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, userType: 'attendee' | 'organizer') => {
    try {
      setLoading(true);
      const response = await authService.signup({ 
        name, 
        email, 
        password, 
        user_type: userType 
      });
      setUser(response.user);
      navigate('/');
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
