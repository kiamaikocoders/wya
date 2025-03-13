
/**
 * API Client for Xano backend integration
 */

// Base API URL for Xano
export const XANO_BASE_URL = "https://x8ki-letl-twmt.n7.xano.io/api:jOnkuav-";
export const XANO_EVENT_API_URL = "https://x8ki-letl-twmt.n7.xano.io/api:bV-zLRsC";

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${XANO_BASE_URL}/auth/login`,
  SIGNUP: `${XANO_BASE_URL}/auth/signup`,
  ME: `${XANO_BASE_URL}/auth/me`,
};

// Event endpoints
export const EVENT_ENDPOINTS = {
  ALL: `${XANO_EVENT_API_URL}/event`,
  SINGLE: (id: number) => `${XANO_EVENT_API_URL}/event/${id}`,
};

// Story endpoints
export const STORY_ENDPOINTS = {
  ALL: `${XANO_EVENT_API_URL}/story`,
  SINGLE: (id: number) => `${XANO_EVENT_API_URL}/story/${id}`,
};

// Survey endpoints
export const SURVEY_ENDPOINTS = {
  ALL: `${XANO_EVENT_API_URL}/survey`,
  SINGLE: (id: number) => `${XANO_EVENT_API_URL}/survey/${id}`,
};

// Default request headers
const defaultHeaders = {
  "Content-Type": "application/json",
};

// Add authorization header if token exists
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token
    ? { ...defaultHeaders, Authorization: `Bearer ${token}` }
    : defaultHeaders;
};

// Helper to process response and handle API errors
const processResponse = async (response: Response) => {
  console.log(`API response from ${response.url}:`, response.status);
  
  // Handle HTTP error status
  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error('Error data from API:', errorData);
      
      // Xano returns error messages in a specific format
      if (errorData && errorData.message) {
        throw new Error(errorData.message);
      }
      
      if (errorData && errorData.code) {
        if (errorData.code === 'ERROR_CODE_ACCESS_DENIED') {
          throw new Error(`Authentication error: ${errorData.message || 'Access denied'}`);
        }
        
        if (errorData.code === 'ERROR_CODE_NOT_FOUND') {
          throw new Error(`API endpoint not found: ${response.url}`);
        }
        
        throw new Error(`API error (${errorData.code}): ${errorData.message || 'Unknown error'}`);
      }
      
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    } catch (parseError) {
      if (parseError instanceof Error) {
        throw parseError;
      }
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
  }
  
  // For successful empty responses
  if (response.status === 204) {
    return null;
  }
  
  // Parse JSON for normal responses
  return response.json();
};

// API client with common fetch methods
export const apiClient = {
  // Expose the API URLs
  XANO_BASE_URL,
  XANO_EVENT_API_URL,
  
  get: async <T>(url: string): Promise<T> => {
    console.log(`API GET request to: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    return processResponse(response) as Promise<T>;
  },
  
  post: async <T>(url: string, data: any): Promise<T> => {
    console.log(`API POST request to: ${url}`, data);
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return processResponse(response) as Promise<T>;
  },
  
  put: async <T>(url: string, data: any): Promise<T> => {
    console.log(`API PUT request to: ${url}`, data);
    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return processResponse(response) as Promise<T>;
  },
  
  patch: async <T>(url: string, data: any): Promise<T> => {
    console.log(`API PATCH request to: ${url}`, data);
    const response = await fetch(url, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return processResponse(response) as Promise<T>;
  },
  
  delete: async <T>(url: string): Promise<T> => {
    console.log(`API DELETE request to: ${url}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    
    return processResponse(response) as Promise<T>;
  },
};
