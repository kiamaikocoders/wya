
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
      const response = await apiClient.post<{ authToken: string }>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      
      // Store token in localStorage
      if (response.authToken) {
        localStorage.setItem('auth_token', response.authToken);
        
        // After storing token, fetch the user details
        const user = await authService.getCurrentUser();
        
        // Make sure user_type is correctly set
        if (!user.user_type) {
          console.error('User type not set in response', user);
          toast.error('User account error: User type not set');
        }
        
        return { token: response.authToken, user };
      }
      
      throw new Error('No auth token received');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Register new user
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      console.log('Signup with credentials:', credentials);
      
      // Make sure user_type is explicitly set
      if (!credentials.user_type) {
        toast.error('Please select a user type (attendee or organizer)');
        throw new Error('User type not specified');
      }
      
      const response = await apiClient.post<{ authToken: string }>(
        AUTH_ENDPOINTS.SIGNUP,
        credentials
      );
      
      // Store token in localStorage
      if (response.authToken) {
        localStorage.setItem('auth_token', response.authToken);
        
        // After storing token, fetch the user details
        const user = await authService.getCurrentUser();
        
        // Verify user_type was set correctly
        if (user.user_type !== credentials.user_type) {
          console.error('User type mismatch', {
            requested: credentials.user_type,
            received: user.user_type
          });
          toast.error(`Account created as ${user.user_type} instead of ${credentials.user_type}`);
        }
        
        return { token: response.authToken, user };
      }
      
      throw new Error('No auth token received');
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
      
      const response = await apiClient.get<User>(AUTH_ENDPOINTS.ME);
      
      // Validate user has a user_type
      if (!response.user_type) {
        console.error('User data missing user_type property:', response);
        throw new Error('User data incomplete: missing user type');
      }
      
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
  }
};
