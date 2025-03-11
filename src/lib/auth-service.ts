
import { apiClient, AUTH_ENDPOINTS } from './api-client';
import { toast } from 'sonner';

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  user_type: 'attendee' | 'organizer';
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'attendee' | 'organizer';
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
      const response = await apiClient.post<AuthResponse>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Register new user
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>(
        AUTH_ENDPOINTS.SIGNUP,
        credentials
      );
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
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
      
      const response = await apiClient.get<{ user: User }>(AUTH_ENDPOINTS.ME);
      return response.user;
    } catch (error) {
      throw error;
    }
  },
  
  // Logout user
  logout: (): void => {
    localStorage.removeItem('auth_token');
    toast.success('Logged out successfully');
    window.location.href = '/';
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  }
};
