
import { apiClient, AUTH_ENDPOINTS } from './api-client';
import { toast } from 'sonner';

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  user_type: 'attendee' | 'admin';
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'attendee' | 'admin';
  created_at: string;
  // Add other fields from your Xano user schema as needed
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Auth service functions
export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<{ authToken: string }>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      
      // Store token in localStorage
      if (response.authToken) {
        localStorage.setItem('auth_token', response.authToken);
        
        // After storing token, fetch the user details
        const user = await authService.getCurrentUser();
        
        return { token: response.authToken, user };
      }
      
      throw new Error('No auth token received');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Register new user (always as attendee)
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      console.log('Signup with credentials:', credentials);
      
      // Override user_type to always be 'attendee' for public signups
      const signupData = {
        ...credentials,
        user_type: 'attendee' as const
      };
      
      const response = await apiClient.post<{ authToken: string }>(
        AUTH_ENDPOINTS.SIGNUP,
        signupData
      );
      
      // Store token in localStorage
      if (response.authToken) {
        localStorage.setItem('auth_token', response.authToken);
        
        // After storing token, fetch the user details
        const user = await authService.getCurrentUser();
        
        return { token: response.authToken, user };
      }
      
      throw new Error('No auth token received');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Special admin login
  adminLogin: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authService.login({ 
        email, 
        password,
        isAdmin: true 
      });
      
      // Verify user is an admin
      if (response.user.user_type !== 'admin') {
        localStorage.removeItem('auth_token');
        throw new Error('Unauthorized: Admin access required');
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Admin login failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await apiClient.get<User>(AUTH_ENDPOINTS.ME);
      return response;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: (): void => {
    localStorage.removeItem('auth_token');
    toast.success('Logged out successfully');
    
    // Navigate to home page
    window.location.href = '/';
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
  
  // Check if user is admin
  isAdmin: async (): Promise<boolean> => {
    try {
      if (!authService.isAuthenticated()) {
        return false;
      }
      
      const user = await authService.getCurrentUser();
      return user.user_type === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};
