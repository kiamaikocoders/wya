// Location service with Mapbox integration
import { toast } from 'sonner';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidW5tYXNraW5nIiwiYSI6ImNtaHo5dmY5cDBpcncybHM1aTI4cjZ3b3IifQ.yNt2bslI1wAyoeoKREtVyw';

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
   * Request location permission and explain why
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return { granted: false, denied: true, prompt: false };
    }

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
   */
  async getCurrentLocation(forceFresh = false): Promise<UserLocation | null> {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
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
}

export const locationService = new LocationService();

