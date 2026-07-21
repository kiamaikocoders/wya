import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, ViewState } from 'react-map-gl/mapbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, Navigation, Check, Loader2 } from 'lucide-react';
import {
  locationService,
  generateSessionToken,
  type PlaceSuggestion,
} from '@/lib/location-service';
import { toast } from 'sonner';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = locationService.getMapboxToken();

type PickedLocation = {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
};

interface LocationPickerProps {
  onLocationSelect: (location: PickedLocation) => void;
  /** Called when the user clears the search text so parents can null out stale coords. */
  onLocationClear?: () => void;
  initialLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  height?: number;
  title?: string;
  description?: string;
  mode?: 'event' | 'user';
  /** Compact layout without card chrome (settings / signup). */
  compact?: boolean;
  /**
   * When false: search typeahead + Search + My Location only (no map).
   * Default true for event pinning; signup/settings should pass false.
   */
  showMap?: boolean;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onLocationClear,
  initialLocation,
  height = 400,
  title,
  description,
  mode = 'event',
  compact = false,
  showMap = true,
  className,
}) => {
  const defaultTitle = mode === 'event' ? 'Select Event Location' : 'Set Your Location';
  const defaultDescription = showMap
    ? mode === 'event'
      ? 'Click on the map or search to set the event location.'
      : 'Set your location to receive personalized event recommendations near you.'
    : 'Search for your area, pick a suggestion, or use My Location.';

  const displayTitle = title ?? defaultTitle;
  const displayDescription = description ?? defaultDescription;

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialLocation?.longitude || 36.8219,
    latitude: initialLocation?.latitude || -1.2921,
    zoom: initialLocation ? 14 : 6,
  });

  const [selectedLocation, setSelectedLocation] = useState<PickedLocation | null>(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          address: initialLocation.address,
        }
      : null,
  );

  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSuggestion[]>([]);
  const [sessionToken, setSessionToken] = useState<string>(generateSessionToken());
  const [locating, setLocating] = useState(false);
  const suggestRequestId = useRef(0);

  useEffect(() => {
    if (!initialLocation) return;
    setSelectedLocation({
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      address: initialLocation.address,
    });
    setSearchQuery(initialLocation.address || '');
    setViewState((prev) => ({
      ...prev,
      longitude: initialLocation.longitude,
      latitude: initialLocation.latitude,
      zoom: 14,
    }));
  }, [initialLocation?.address, initialLocation?.latitude, initialLocation?.longitude]);

  const applyPick = useCallback(
    (pick: PickedLocation, commit: boolean) => {
      setSelectedLocation(pick);
      setSearchQuery(pick.address);
      setViewState({
        longitude: pick.longitude,
        latitude: pick.latitude,
        zoom: 14,
      });
      setSearchResults([]);
      if (commit || !showMap) {
        onLocationSelect(pick);
      }
    },
    [onLocationSelect, showMap],
  );

  const runSearch = useCallback(
    async (query: string, opts?: { autoSelectFirst?: boolean }) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSearchResults([]);
        return;
      }

      const idAtStart = ++suggestRequestId.current;
      setIsSearching(true);
      try {
        const currentSessionToken = sessionToken || generateSessionToken();
        if (!sessionToken) setSessionToken(currentSessionToken);

        const suggestions = await locationService.searchPlaces(trimmed, currentSessionToken, {
          limit: 8,
        });

        if (idAtStart !== suggestRequestId.current) return;

        if (suggestions.length === 0) {
          setSearchResults([]);
          if (opts?.autoSelectFirst) {
            toast.error('No locations found. Try a different search term.');
          }
          return;
        }

        setSearchResults(suggestions);

        if (opts?.autoSelectFirst && !showMap) {
          // Search button on search-only: keep list open so user can pick
          toast.success(`${suggestions.length} place${suggestions.length === 1 ? '' : 's'} found`);
        }
      } catch (error) {
        if (idAtStart !== suggestRequestId.current) return;
        console.error('Search error:', error);
        toast.error('Failed to search location. Please try again.');
        setSearchResults([]);
      } finally {
        if (idAtStart === suggestRequestId.current) setIsSearching(false);
      }
    },
    [sessionToken, showMap],
  );

  // Typeahead while typing (search-only and map modes)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      if (!trimmed) setSearchResults([]);
      return;
    }
    // Don't re-suggest when query already matches a confirmed selection
    if (selectedLocation && trimmed === selectedLocation.address.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      void runSearch(searchQuery);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLocation, runSearch]);

  const handleSearchClick = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!searchQuery.trim()) {
        toast.error('Please enter a location');
        return;
      }
      void runSearch(searchQuery, { autoSelectFirst: true });
    },
    [searchQuery, runSearch],
  );

  const handleMapClick = useCallback(
    async (event: any) => {
      const { lng, lat } = event.lngLat;
      try {
        const address = await locationService.reverseGeocode(lat, lng);
        applyPick(
          {
            latitude: lat,
            longitude: lng,
            address: address.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            city: address.city,
            country: address.country,
          },
          false,
        );
      } catch {
        applyPick(
          {
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          },
          false,
        );
      }
    },
    [applyPick],
  );

  const handleConfirm = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!selectedLocation) {
        toast.error('Please select a location');
        return;
      }
      onLocationSelect(selectedLocation);
      toast.success('Location selected!');
    },
    [selectedLocation, onLocationSelect],
  );

  const handleUseCurrentLocation = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setLocating(true);
      try {
        const location = await locationService.getCurrentLocation(true);
        if (!location) return;

        const pick: PickedLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || location.city || 'Current Location',
          city: location.city,
          country: location.country,
        };
        applyPick(pick, true);
        toast.success(`Location set to ${pick.address}`);
      } catch (error) {
        console.error('Current location error:', error);
        toast.error('Failed to get your location. Please try again or search manually.');
      } finally {
        setLocating(false);
      }
    },
    [applyPick],
  );

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSelectedLocation(null);
      setSearchResults([]);
      onLocationClear?.();
    } else if (selectedLocation && value.trim() !== selectedLocation.address.trim()) {
      // Editing after a pick — clear stale coords until they pick again
      setSelectedLocation(null);
      onLocationClear?.();
    }
  };

  const pickSuggestion = async (suggestion: PlaceSuggestion) => {
    try {
      const currentSessionToken = sessionToken || generateSessionToken();
      if (!sessionToken) setSessionToken(currentSessionToken);

      const pick = await locationService.resolveSuggestion(suggestion, currentSessionToken);
      if (!pick) {
        toast.error('Failed to retrieve location details');
        return;
      }
      applyPick(
        {
          latitude: pick.latitude,
          longitude: pick.longitude,
          address: pick.label,
          city: pick.city,
          country: pick.country,
        },
        !showMap,
      );
      toast.success(`Selected: ${pick.label}`);
    } catch (error) {
      console.error('Error retrieving location:', error);
      toast.error('Failed to retrieve location details');
    }
  };

  const searchBlock = (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search town, area, or venue…"
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSearchClick(e);
              }
            }}
            className="h-11 pl-10"
            autoComplete="off"
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={(e) => handleSearchClick(e)}
            disabled={isSearching || !searchQuery.trim()}
            className="h-11"
          >
            Search
          </Button>
          <Button
            type="button"
            onClick={(e) => void handleUseCurrentLocation(e)}
            variant="outline"
            disabled={locating}
            className="h-11"
          >
            {locating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            My Location
          </Button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-sm">
          {searchResults.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pickSuggestion(suggestion)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/60"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="leading-snug">{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedLocation && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Selected: <span className="font-medium text-foreground">{selectedLocation.address}</span>
          </span>
        </p>
      )}
    </>
  );

  const mapBlock = showMap ? (
    <>
      {MAPBOX_TOKEN ? (
        <div
          className="relative overflow-hidden rounded-lg border border-border"
          style={{ height }}
        >
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            attributionControl={true}
          >
            <NavigationControl position="bottom-right" />
            {selectedLocation && (
              <Marker
                longitude={selectedLocation.longitude}
                latitude={selectedLocation.latitude}
                anchor="bottom"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                </div>
              </Marker>
            )}
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
                </div>
              </Popup>
            )}
          </Map>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Map preview needs <code>VITE_MAPBOX_ACCESS_TOKEN</code>. Search still works.
        </p>
      )}

      {selectedLocation && (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="font-medium">Selected Location</p>
              </div>
              <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
            <Button type="button" onClick={(e) => handleConfirm(e)} size="sm">
              <Check className="mr-1 h-4 w-4" />
              Confirm
            </Button>
          </div>
        </div>
      )}
    </>
  ) : null;

  const body = (
    <div className="space-y-3">
      {searchBlock}
      {mapBlock}
    </div>
  );

  if (compact) {
    return (
      <div
        className={`space-y-3 ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {(displayTitle || displayDescription) && (title !== '' || description !== '') && (
          <div>
            {displayTitle ? <p className="text-sm font-medium">{displayTitle}</p> : null}
            {displayDescription ? (
              <p className="text-xs text-muted-foreground">{displayDescription}</p>
            ) : null}
          </div>
        )}
        {body}
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 ${className || ''}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Card>
        <CardHeader>
          <CardTitle>{displayTitle}</CardTitle>
          <CardDescription>{displayDescription}</CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </div>
  );
};

export default LocationPicker;
