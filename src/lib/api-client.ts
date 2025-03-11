
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

// API client with common fetch methods
export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Network response was not ok");
    }
    
    return response.json() as Promise<T>;
  },
  
  post: async <T>(url: string, data: any): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Network response was not ok");
    }
    
    return response.json() as Promise<T>;
  },
  
  put: async <T>(url: string, data: any): Promise<T> => {
    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Network response was not ok");
    }
    
    return response.json() as Promise<T>;
  },
  
  patch: async <T>(url: string, data: any): Promise<T> => {
    const response = await fetch(url, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Network response was not ok");
    }
    
    return response.json() as Promise<T>;
  },
  
  delete: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Network response was not ok");
    }
    
    return response.json() as Promise<T>;
  },
};
