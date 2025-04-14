
import { apiClient, AUTH_ENDPOINTS } from './api-client';
import { toast } from 'sonner';
import { ADMIN_CREDENTIALS } from './admin-credentials';

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
  user_type: 'attendee' | 'admin' | 'organizer';
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'attendee' | 'admin' | 'organizer';
  created_at: string;
  bio?: string;
  profile_picture?: string;
  // Add other fields from your Xano user schema as needed
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Generate a mock token
const generateMockToken = () => {
  return `mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Mock user data for development
const MOCK_USERS: Record<string, User> = {
  // Adding the admin user to the mock users
  [ADMIN_CREDENTIALS.email]: {
    id: 1,
    name: 'Admin User',
    email: ADMIN_CREDENTIALS.email,
    user_type: 'admin',
    created_at: new Date().toISOString(),
  }
};

// Auth service functions
export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Login with credentials:', credentials);
      
      // TODO: In production, these calls would go to a real API
      // For now, simulate API responses with mock data
      
      // Check mock data first (for demo purposes)
      const mockUser = MOCK_USERS[credentials.email];
      
      if (mockUser) {
        const mockToken = generateMockToken();
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('current_user', JSON.stringify(mockUser));
        
        return { token: mockToken, user: mockUser };
      }
      
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
      } catch (error) {
        console.error('API login failed, using local storage fallback');
        // Fall back to creating a temporary user if the API fails
        const tempUser: User = {
          id: Math.floor(Math.random() * 1000) + 10,
          name: credentials.email.split('@')[0],
          email: credentials.email,
          user_type: 'attendee',
          created_at: new Date().toISOString(),
        };
        
        // Save to mock database and local storage
        MOCK_USERS[credentials.email] = tempUser;
        
        const mockToken = generateMockToken();
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('current_user', JSON.stringify(tempUser));
        
        return { token: mockToken, user: tempUser };
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
      
      // Override user_type to always be 'attendee' for public signups
      const signupData = {
        ...credentials,
        user_type: 'attendee' as const
      };
      
      try {
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
      } catch (error) {
        console.error('API signup failed, using local storage fallback');
        // Create a new user in mock DB
        const newUser: User = {
          id: Math.floor(Math.random() * 1000) + 10,
          name: credentials.name,
          email: credentials.email,
          user_type: 'attendee',
          created_at: new Date().toISOString(),
        };
        
        // Save to mock database and local storage
        MOCK_USERS[credentials.email] = newUser;
        
        const mockToken = generateMockToken();
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('current_user', JSON.stringify(newUser));
        
        return { token: mockToken, user: newUser };
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
      // Check if the credentials match our hardcoded admin credentials
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // If match, create an admin session
        const adminUser: User = {
          id: 1,
          name: 'Admin User',
          email: ADMIN_CREDENTIALS.email,
          user_type: 'admin',
          created_at: new Date().toISOString(),
        };
        
        const mockToken = generateMockToken();
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('current_user', JSON.stringify(adminUser));
        
        toast.success('Admin logged in successfully');
        return { token: mockToken, user: adminUser };
      }
      
      // If not matching our admin credentials, try regular login with admin flag
      try {
        return await authService.login({ 
          email, 
          password,
          isAdmin: true 
        });
      } catch (error) {
        throw new Error('Invalid admin credentials');
      }
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
      
      // First try to get from localStorage
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      // If not in localStorage, try to get from API
      try {
        const response = await apiClient.get<User>(AUTH_ENDPOINTS.ME);
        // Store in localStorage for future use
        localStorage.setItem('current_user', JSON.stringify(response));
        return response;
      } catch (error) {
        console.error('API getCurrentUser failed, checking for mock users');
        // If API fails, check our mock database as fallback
        for (const email in MOCK_USERS) {
          const user = MOCK_USERS[email];
          return user;
        }
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
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
  },
  
  // Update user profile
  updateUserProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get current user data
      const currentUser = await authService.getCurrentUser();
      
      // Update the user with new data
      const updatedUser = {
        ...currentUser,
        ...userData
      };
      
      // Store the updated user in local storage
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      // If the email has changed, update the mock users record
      if (userData.email && userData.email !== currentUser.email) {
        // Remove the old entry
        delete MOCK_USERS[currentUser.email];
        // Add the new entry
        MOCK_USERS[userData.email] = updatedUser;
      } else {
        // Update the existing entry
        MOCK_USERS[currentUser.email] = updatedUser;
      }
      
      // Try to update on the API if available
      try {
        await apiClient.patch(`${AUTH_ENDPOINTS.ME}`, userData);
      } catch (error) {
        console.log('API update failed, using local storage only');
      }
      
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};
