// Location service with Mapbox integration
import { toast } from 'sonner';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidW5tYXNraW5nIiwiYSI6ImNtaHo5dmY5cDBpcncybHM1aTI4cjZ3b3IifQ.yNt2bslI1wAyoeoKREtVyw';

/**
 * Generate a session token for Mapbox Search Box API
 * Session tokens should be unique per search session
 */
export function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  address?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class LocationService {
  private cachedLocation: UserLocation | null = null;
  private locationWatchId: number | null = null;

  /**
   * Check location permission status without triggering a dialog
   */
  async checkPermissionStatus(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
      return { granted: false, denied: true, prompt: false };
    }

    // Use Permissions API if available (doesn't trigger dialog)
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        const state = permissionStatus.state;
        
        if (state === 'granted') {
          return { granted: true, denied: false, prompt: false };
        } else if (state === 'denied') {
          return { granted: false, denied: true, prompt: false };
        } else {
          // 'prompt' state - permission not determined yet
          return { granted: false, denied: false, prompt: true };
        }
      } catch (error) {
        // Permissions API not supported or geolocation not available
        console.warn('Permissions API not available, falling back to direct check:', error);
        // Fall through to direct check
      }
    }

    // Fallback: If Permissions API not available, we can't check without triggering
    // Return prompt state so caller can decide whether to request
    return { granted: false, denied: false, prompt: true };
  }

  /**
   * Request location permission and explain why
   * Only triggers browser dialog if permission is not already granted
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return { granted: false, denied: true, prompt: false };
    }

    // First check if permission is already granted
    const currentStatus = await this.checkPermissionStatus();
    if (currentStatus.granted) {
      // Permission already granted, return silently
      return currentStatus;
    }

    // Only request if permission is not determined (prompt state) or denied
    // If denied, we still try to request (user might have changed browser settings)
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          resolve({ granted: true, denied: false, prompt: false });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve({ granted: false, denied: true, prompt: false });
          } else {
            resolve({ granted: false, denied: false, prompt: true });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Get user's current location
   * Checks permission first and only proceeds silently if granted
   */
  async getCurrentLocation(forceFresh = false, silent = false): Promise<UserLocation | null> {
    if (!navigator.geolocation) {
      if (!silent) {
        toast.error('Geolocation is not supported by your browser');
      }
      return null;
    }

    // Check permission status first
    const permissionStatus = await this.checkPermissionStatus();
    
    // If permission is denied, return null without triggering dialog
    if (permissionStatus.denied) {
      if (!silent) {
        toast.error('Location permission denied. Please enable location access in your browser settings to use this feature.');
      }
      return null;
    }

    // If permission is not determined and we're in silent mode, return null
    // This prevents triggering the dialog when user hasn't explicitly requested location
    if (permissionStatus.prompt && silent) {
      return null;
    }

    // Clear cache if forcing fresh location
    if (forceFresh) {
      this.cachedLocation = null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy || Infinity;

          // Check if coordinates are exact integers (very suspicious - likely fallback)
          const isExactInteger = (lat === Math.round(lat)) || (lng === Math.round(lng));
          
          // Check if coordinates are suspiciously round (e.g., 1.000000, 38.000000)
          // Even with good accuracy, exact integers are suspicious
          const latRounded = Math.round(lat * 1000000) / 1000000;
          const lngRounded = Math.round(lng * 1000000) / 1000000;
          const isSuspiciouslyRound = 
            (latRounded === Math.round(lat)) || 
            (lngRounded === Math.round(lng));
          
          // Reject if:
          // 1. Exact integers (1, 38) - these are definitely fallback values
          // 2. Exact 0,0
          // 3. Suspiciously round AND accuracy is poor (>10km) OR accuracy is suspiciously good (<10m) for round numbers
          if (isExactInteger || (lat === 0 && lng === 0) || (isSuspiciouslyRound && (accuracy > 10000 || accuracy < 10))) {
            console.warn('Suspicious coordinates detected:', lat, lng, 'accuracy:', accuracy, 'm', 'isExactInteger:', isExactInteger);
            toast.error('Unable to get accurate location. The browser returned a fallback location. Please search for your location manually.');
            resolve(null);
            return;
          }

          // Validate coordinates are within reasonable bounds
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error('Invalid coordinates:', lat, lng);
            toast.error('Invalid location coordinates received. Please try again.');
            resolve(null);
            return;
          }

          const location: UserLocation = {
            latitude: lat,
            longitude: lng,
          };

          console.log('Got location:', lat, lng, 'accuracy:', position.coords.accuracy, 'm');

          // Reverse geocode to get address
          try {
            const address = await this.reverseGeocode(location.latitude, location.longitude);
            location.city = address.city;
            location.country = address.country;
            location.address = address.address;
            console.log('Reverse geocoded to:', address.address);
          } catch (error) {
            console.warn('Failed to reverse geocode:', error);
          }

          this.cachedLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          
          // Only show error messages if not in silent mode
          if (!silent) {
            let errorMessage = 'Failed to get your location. ';
            
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = 'Location permission denied. Please enable location access in your browser settings to use this feature.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Location information is unavailable. Please try again or search for your location manually.';
            } else if (error.code === error.TIMEOUT) {
              errorMessage = 'Location request timed out. Please try again.';
            } else {
              errorMessage += 'Please try again or search for your location manually.';
            }
            
            toast.error(errorMessage);
          }
          
          resolve(null);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, // Increased timeout
          maximumAge: forceFresh ? 0 : 60000 // Only cache for 1 minute, or 0 if forcing fresh
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to address using Mapbox
   */
  async reverseGeocode(lat: number, lng: number): Promise<{ city: string; country: string; address: string }> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,locality,neighborhood`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const features = data.features || [];

      let city = '';
      let country = '';
      let address = '';

      if (features.length > 0) {
        const feature = features[0];
        address = feature.place_name || '';
        
        // Extract city and country from context
        const context = feature.context || [];
        for (const item of context) {
          if (item.id.startsWith('place')) {
            city = item.text;
          }
          if (item.id.startsWith('country')) {
            country = item.text;
          }
        }
      }

      return { city, country, address };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return { city: '', country: '', address: '' };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get cached location if available
   */
  getCachedLocation(): UserLocation | null {
    return this.cachedLocation;
  }

  /**
   * Watch location changes
   */
  watchLocation(callback: (location: UserLocation) => void): () => void {
    if (!navigator.geolocation) {
      return () => {};
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const address = await this.reverseGeocode(location.latitude, location.longitude);
          location.city = address.city;
          location.country = address.country;
          location.address = address.address;
        } catch (error) {
          console.warn('Failed to reverse geocode:', error);
        }

        this.cachedLocation = location;
        callback(location);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      if (this.locationWatchId !== null) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
      }
    };
  }

  /**
   * Get Mapbox access token
   */
  getMapboxToken(): string {
    return MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Search locations using Mapbox Search Box API (suggest endpoint)
   * Returns suggestions that need to be retrieved for full details
   */
  async searchLocationsSuggest(query: string, sessionToken: string, options?: {
    country?: string;
    proximity?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      // Search Box API has a maximum limit of 10
      const { country = 'ke', proximity = '36.8219,-1.2921', limit = 10 } = options || {};
      const clampedLimit = Math.min(Math.max(limit, 1), 10); // Ensure limit is between 1 and 10
      
      const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
      url.searchParams.set('q', query);
      url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('session_token', sessionToken);
      url.searchParams.set('country', country);
      url.searchParams.set('proximity', proximity);
      url.searchParams.set('limit', clampedLimit.toString());
      url.searchParams.set('types', 'address,poi,place,locality,neighborhood');
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search Box suggest failed:', response.status, errorText);
        throw new Error(`Search Box suggest failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error in searchLocationsSuggest:', error);
      throw error;
    }
  }

  /**
   * Retrieve full details for a suggestion using Mapbox Search Box API (retrieve endpoint)
   */
  async retrieveLocationDetails(suggestionId: string, sessionToken: string): Promise<any> {
    try {
      const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestionId}`);
      url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('session_token', sessionToken);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search Box retrieve failed:', response.status, errorText);
        throw new Error(`Search Box retrieve failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.features?.[0] || null;
    } catch (error) {
      console.error('Error in retrieveLocationDetails:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();

