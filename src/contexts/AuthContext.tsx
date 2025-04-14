
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, authService } from '@/lib/auth-service';
import { useNavigate } from 'react-router-dom';

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

  const refreshAuth = async () => {
    if (!authService.isAuthenticated()) {
      return;
    }
    
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAdmin(userData.user_type === 'admin');
    } catch (error) {
      console.error('Error refreshing auth:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          await refreshAuth();
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setIsAdmin(response.user.user_type === 'admin');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.adminLogin(email, password);
      setUser(response.user);
      setIsAdmin(response.user.user_type === 'admin');
      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const response = await authService.signup({
        email,
        password,
        name,
        user_type: 'attendee',
      });
      setUser(response.user);
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
  };
  
  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      const updatedUser = await authService.updateUserProfile(userData);
      setUser(updatedUser);
      return;
    } catch (error) {
      console.error('Error updating user:', error);
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
