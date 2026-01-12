import React, { useState, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, ViewState } from 'react-map-gl/mapbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, Navigation, Check } from 'lucide-react';
import { locationService } from '@/lib/location-service';
import { toast } from 'sonner';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = locationService.getMapboxToken();

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }) => void;
  initialLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  height?: number;
  title?: string;
  description?: string;
  mode?: 'event' | 'user'; // 'event' for event creation, 'user' for user profile
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  height = 400,
  title,
  description,
  mode = 'event',
}) => {
  const defaultTitle = mode === 'event' 
    ? 'Select Event Location' 
    : 'Set Your Location';
  const defaultDescription = mode === 'event'
    ? 'Click on the map or search to set the event location. This will be used to pin the event on the map.'
    : 'Set your location to receive personalized event recommendations near you. Your location helps us show you events happening in your area.';
  
  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialLocation?.longitude || 36.8219,
    latitude: initialLocation?.latitude || -1.2921,
    zoom: initialLocation ? 14 : 6,
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    country?: string;
  } | null>(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          address: initialLocation.address,
        }
      : null
  );

  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Geocode search query
  const handleSearch = useCallback(async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsSearching(true);
    try {
      // First try searching with Kenya priority
      let response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=ke&limit=10`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Geocoding failed:', response.status, errorText);
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      let data = await response.json();
      let features = data.features || [];
      
      // If no Kenyan results found, try without country restriction
      if (features.length === 0) {
        console.log('No Kenyan results, trying global search...');
        response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=10`
        );
        
        if (response.ok) {
          data = await response.json();
          features = data.features || [];
        }
      }
      
      console.log('Search results:', features.length, 'results');
      
      if (features.length === 0) {
        toast.error('No locations found. Try a different search term.');
        setSearchResults([]);
        return;
      }
      
      // Prioritize Kenyan results - sort so Kenyan results come first
      const sortedFeatures = features.sort((a: any, b: any) => {
        const aIsKenya = a.context?.some((ctx: any) => ctx.id?.startsWith('country') && ctx.short_code === 'ke');
        const bIsKenya = b.context?.some((ctx: any) => ctx.id?.startsWith('country') && ctx.short_code === 'ke');
        if (aIsKenya && !bIsKenya) return -1;
        if (!aIsKenya && bIsKenya) return 1;
        return 0;
      });
      
      setSearchResults(sortedFeatures);

      // Auto-select first result and center map
      if (sortedFeatures.length > 0) {
        const firstResult = sortedFeatures[0];
        const [lng, lat] = firstResult.center;
        setViewState({
          longitude: lng,
          latitude: lat,
          zoom: 14,
        });
        // Auto-select first result
        setSelectedLocation({
          latitude: lat,
          longitude: lng,
          address: firstResult.place_name,
        });
        const kenyanCount = sortedFeatures.filter((f: any) => 
          f.context?.some((ctx: any) => ctx.id?.startsWith('country') && ctx.short_code === 'ke')
        ).length;
        if (kenyanCount > 0) {
          toast.success(`Found ${sortedFeatures.length} location(s)${kenyanCount < sortedFeatures.length ? ` (${kenyanCount} in Kenya)` : ' in Kenya'}`);
        } else {
          toast.success(`Found ${sortedFeatures.length} location(s)`);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location. Please check your connection and try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Handle map click
  const handleMapClick = useCallback(async (event: any) => {
    const { lng, lat } = event.lngLat;

    try {
      // Reverse geocode to get address
      const address = await locationService.reverseGeocode(lat, lng);
      
      const location = {
        latitude: lat,
        longitude: lng,
        address: address.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: address.city,
        country: address.country,
      };

      setSelectedLocation(location);
      setSearchQuery(location.address);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      const location = {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
      setSelectedLocation(location);
      setSearchQuery(location.address);
    }
  }, []);

  // Confirm selection
  const handleConfirm = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    onLocationSelect(selectedLocation);
    toast.success('Location selected!');
  }, [selectedLocation, onLocationSelect]);

  // Use current location
  const handleUseCurrentLocation = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // Force fresh location (don't use cache)
      const location = await locationService.getCurrentLocation(true);
      if (location) {
        // Validate coordinates before using them
        const lat = location.latitude;
        const lng = location.longitude;
        
        // Check if coordinates are valid and not suspiciously round
        if (lat === 0 && lng === 0) {
          toast.error('Invalid location received. Please try again or search manually.');
          return;
        }
        
        setSelectedLocation({
          latitude: lat,
          longitude: lng,
          address: location.address || location.city || 'Current Location',
          city: location.city,
          country: location.country,
        });
        setViewState({
          longitude: lng,
          latitude: lat,
          zoom: 14,
        });
        setSearchQuery(location.address || location.city || 'Current Location');
        toast.success(`Location set to ${location.address || location.city || 'your current position'}`);
        // DON'T auto-call onLocationSelect - user must click Confirm button
      }
    } catch (error) {
      console.error('Current location error:', error);
      toast.error('Failed to get your location. Please try again or search manually.');
    }
  }, []);

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Card className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-white/20-dark">
        <CardHeader>
          <CardTitle className="text-white">{displayTitle}</CardTitle>
          <CardDescription className="text-text-white/70">
            {displayDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-white/70" />
              <Input
                type="text"
                placeholder="Search for a location (e.g., Nairobi, Mombasa)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearch(e);
                  }
                }}
                className="pl-10 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark text-white border-white/20-dark focus:border-gradient-orange-accent"
              />
            </div>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSearch(e);
              }}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-gradient-accent hover:bg-opacity-90"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUseCurrentLocation(e);
              }}
              variant="outline"
              className="border-white/20-dark text-white hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
            >
              <Navigation className="h-4 w-4 mr-2" />
              My Location
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const [lng, lat] = result.center;
                    setViewState({
                      longitude: lng,
                      latitude: lat,
                      zoom: 14,
                    });
                    setSelectedLocation({
                      latitude: lat,
                      longitude: lng,
                      address: result.place_name,
                    });
                    setSearchQuery(result.place_name);
                    setSearchResults([]);
                    toast.success(`Selected: ${result.place_name}`);
                  }}
                  className="w-full text-left p-2 rounded bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/80 text-white text-sm transition-colors"
                >
                  {result.place_name}
                </button>
              ))}
            </div>
          )}

          {/* Map */}
          <div className="relative overflow-hidden rounded-lg border border-white/10" style={{ height }}>
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              onClick={handleMapClick}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              attributionControl={true}
            >
              <NavigationControl position="bottom-right" />

              {/* Selected Location Marker */}
              {selectedLocation && (
                <Marker
                  longitude={selectedLocation.longitude}
                  latitude={selectedLocation.latitude}
                  anchor="bottom"
                >
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br bg-gradient-accent shadow-[0_0_30px_rgba(255,128,0,0.6)]">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-accent animate-ping opacity-20" />
                  </div>
                </Marker>
              )}

              {/* Popup for selected location */}
              {selectedLocation && (
                <Popup
                  longitude={selectedLocation.longitude}
                  latitude={selectedLocation.latitude}
                  anchor="bottom"
                  closeButton={false}
                  closeOnClick={false}
                >
                  <div className="p-2">
                    <p className="text-sm font-semibold">{selectedLocation.address}</p>
                    {selectedLocation.city && (
                      <p className="text-xs text-gray-600">{selectedLocation.city}</p>
                    )}
                  </div>
                </Popup>
              )}
            </Map>
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark rounded-lg border border-kenya-orange/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-gradient-orange-accent" />
                    <p className="text-white font-medium">Selected Location</p>
                  </div>
                  <p className="text-sm text-text-white/70">{selectedLocation.address}</p>
                  {selectedLocation.city && (
                    <p className="text-xs text-text-white/70 mt-1">
                      {selectedLocation.city}
                      {selectedLocation.country && `, ${selectedLocation.country}`}
                    </p>
                  )}
                  <p className="text-xs text-text-white/70 mt-1">
                    Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirm(e);
                  }}
                  size="sm"
                  className="bg-gradient-accent hover:bg-opacity-90 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationPicker;

