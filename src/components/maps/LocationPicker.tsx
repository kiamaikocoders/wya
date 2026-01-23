import React, { useState, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, ViewState } from 'react-map-gl/mapbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, Navigation, Check } from 'lucide-react';
import { locationService, generateSessionToken } from '@/lib/location-service';
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
  const [sessionToken, setSessionToken] = useState<string>(generateSessionToken());

  // Search using Mapbox Search Box API
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
      // Generate new session token for each new search
      const currentSessionToken = sessionToken || generateSessionToken();
      if (!sessionToken) {
        setSessionToken(currentSessionToken);
      }
      
      // Use Search Box API suggest endpoint
      // Note: Search Box API has a maximum limit of 10
      const suggestions = await locationService.searchLocationsSuggest(searchQuery, currentSessionToken, {
        country: 'ke',
        proximity: '36.8219,-1.2921', // Nairobi coordinates
        limit: 10
      });
      
      // Filter to ONLY Kenyan results
      const kenyanSuggestions = suggestions.filter((suggestion: any) => {
        // Check if suggestion has country code
        // Search Box API returns country_code directly on the suggestion object
        const countryCode = suggestion.country_code || suggestion.country;
        
        // Also check context if it's an array
        let contextCountryCode = null;
        if (Array.isArray(suggestion.context)) {
          const countryContext = suggestion.context.find((ctx: any) => 
            ctx.country_code || ctx.type === 'country'
          );
          contextCountryCode = countryContext?.country_code || countryContext?.country;
        } else if (suggestion.context && typeof suggestion.context === 'object') {
          // Context might be an object with country information
          contextCountryCode = suggestion.context.country_code || suggestion.context.country;
        }
        
        const finalCountryCode = countryCode || contextCountryCode;
        return finalCountryCode === 'KE' || finalCountryCode === 'ke';
      });
      
      if (kenyanSuggestions.length === 0) {
        toast.error('No locations found in Kenya. Try a different search term.');
        setSearchResults([]);
        return;
      }
      
      // Sort by type priority and distance
      const typePriority: Record<string, number> = {
        'address': 1,
        'poi': 2,
        'locality': 3,
        'neighborhood': 4,
        'place': 5,
      };
      
      const sortedSuggestions = kenyanSuggestions.sort((a: any, b: any) => {
        const aTypes = a.feature_type || [];
        const bTypes = b.feature_type || [];
        
        const aPriority = Math.min(...aTypes.map((t: string) => typePriority[t] || 99));
        const bPriority = Math.min(...bTypes.map((t: string) => typePriority[t] || 99));
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Sort by distance if available (lower is better)
        const aDistance = a.distance || Infinity;
        const bDistance = b.distance || Infinity;
        return aDistance - bDistance;
      });
      
      setSearchResults(sortedSuggestions);

      // Auto-select first result and retrieve full details
      if (sortedSuggestions.length > 0) {
        const firstSuggestion = sortedSuggestions[0];
        
        // Retrieve full details for auto-selection
        const feature = await locationService.retrieveLocationDetails(
          firstSuggestion.mapbox_id,
          currentSessionToken
        );
        
        if (feature) {
          const [lng, lat] = feature.geometry?.coordinates || [];
          if (lat && lng) {
            setViewState({
              longitude: lng,
              latitude: lat,
              zoom: 14,
            });
            
            const address = feature.properties?.full_address || 
                           feature.properties?.name || 
                           firstSuggestion.name || 
                           '';
            
            setSelectedLocation({
              latitude: lat,
              longitude: lng,
              address: address,
            });
            
            toast.success(`Found ${sortedSuggestions.length} location(s) in Kenya`);
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location. Please check your connection and try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, sessionToken]);

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
              {searchResults.map((suggestion, index) => {
                const displayName = suggestion.name || suggestion.full_address || 'Unknown location';
                
                return (
                  <button
                    key={suggestion.mapbox_id || index}
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        const currentSessionToken = sessionToken || generateSessionToken();
                        if (!sessionToken) {
                          setSessionToken(currentSessionToken);
                        }
                        
                        // Retrieve full details for the selected suggestion
                        const feature = await locationService.retrieveLocationDetails(
                          suggestion.mapbox_id,
                          currentSessionToken
                        );
                        
                        if (feature) {
                          const [lng, lat] = feature.geometry?.coordinates || [];
                          if (lat && lng) {
                            setViewState({
                              longitude: lng,
                              latitude: lat,
                              zoom: 14,
                            });
                            
                            const address = feature.properties?.full_address || 
                                           feature.properties?.name || 
                                           suggestion.name || 
                                           '';
                            
                            setSelectedLocation({
                              latitude: lat,
                              longitude: lng,
                              address: address,
                            });
                            setSearchQuery(address);
                            setSearchResults([]);
                            toast.success(`Selected: ${address}`);
                          } else {
                            toast.error('Invalid location coordinates');
                          }
                        } else {
                          toast.error('Failed to retrieve location details');
                        }
                      } catch (error) {
                        console.error('Error retrieving location:', error);
                        toast.error('Failed to retrieve location details');
                      }
                    }}
                    className="w-full text-left p-2 rounded bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/80 text-white text-sm transition-colors"
                  >
                    {displayName}
                  </button>
                );
              })}
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

