import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, ViewState } from 'react-map-gl/mapbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Event } from '@/types/event.types';
import { MapPin, Navigation, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { locationService } from '@/lib/location-service';
import { isEventInMapDateWindow } from '@/lib/event-map-window';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = locationService.getMapboxToken();
const MAP_STYLE_LIGHT = 'mapbox://styles/mapbox/streets-v12';
const MAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

type MapboxMapProps = {
  events: Event[];
  contextLocation?: string | null;
  /** Pixel height, CSS length, or omit for a tall viewport-based default. */
  height?: number | string;
  onEventClick?: (event: Event) => void;
  interactive?: boolean;
  className?: string;
};

const cityCoordinates: Record<string, { longitude: number; latitude: number }> = {
  nairobi: { longitude: 36.8219, latitude: -1.2921 },
  mombasa: { longitude: 39.6682, latitude: -4.0435 },
  kisumu: { longitude: 34.7617, latitude: -0.0917 },
  nakuru: { longitude: 36.0667, latitude: -0.2833 },
  eldoret: { longitude: 35.2698, latitude: 0.5143 },
  malindi: { longitude: 40.1169, latitude: -3.2192 },
  machakos: { longitude: 37.2620, latitude: -1.5177 },
};

const getCoordinates = (event: Event) => {
  if (typeof event.longitude === 'number' && typeof event.latitude === 'number') {
    return { longitude: event.longitude, latitude: event.latitude };
  }

  const match = Object.entries(cityCoordinates).find(([key]) =>
    event.location?.toLowerCase().includes(key)
  );

  if (match) {
    return match[1];
  }

  return null;
};

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  events, 
  contextLocation, 
  height = 'min(72vh, 820px)',
  onEventClick,
  interactive = true,
  className,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mapStyle = isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: 36.8219,
    latitude: -1.2921,
    zoom: 6,
  });

  const plottedEvents = useMemo(
    () =>
      events
        .filter((event) => isEventInMapDateWindow(event))
        .map(event => {
          const coords = getCoordinates(event);
          if (!coords) return null;
          return { ...event, ...coords };
        })
        .filter(Boolean) as (Event & { longitude: number; latitude: number })[],
    [events]
  );

  // Calculate initial view state
  useMemo(() => {
    if (plottedEvents.length === 0) {
      const defaultCoords =
        (contextLocation &&
          getCoordinates({
            ...(events[0] || {}),
            location: contextLocation,
          } as Event)) ??
        cityCoordinates.nairobi;

      setViewState({
        longitude: defaultCoords.longitude,
        latitude: defaultCoords.latitude,
        zoom: 6,
      });
      return;
    }

    if (plottedEvents.length === 1) {
      setViewState({
        longitude: plottedEvents[0].longitude,
        latitude: plottedEvents[0].latitude,
        zoom: 12,
      });
      return;
    }

    const avgLongitude =
      plottedEvents.reduce((sum, event) => sum + event.longitude, 0) /
      plottedEvents.length;
    const avgLatitude =
      plottedEvents.reduce((sum, event) => sum + event.latitude, 0) / plottedEvents.length;

    setViewState({
      longitude: avgLongitude,
      latitude: avgLatitude,
      zoom: 8,
    });
  }, [plottedEvents, contextLocation, events]);

  const handleMarkerClick = useCallback((event: Event & { longitude: number; latitude: number }) => {
    setSelectedEvent(event);
  }, []);

  const handleDirections = useCallback((event: Event & { longitude: number; latitude: number }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
    window.open(url, '_blank');
  }, []);

  const handleViewEvent = useCallback((event: Event) => {
    setHoveredEvent(null);
    setSelectedEvent(null);
    if (onEventClick) {
      onEventClick(event);
      return;
    }
    window.location.href = `/events/${event.id}`;
  }, [onEventClick]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border shadow-2xl',
        isDark ? 'border-white/10' : 'border-black/10',
        className
      )}
      style={{ height }}
    >
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={true}
        interactive={interactive}
      >
        {/* Map Controls */}
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />
        {interactive && <GeolocateControl position="bottom-right" />}

        {/* Event Markers */}
        {plottedEvents.map(event => {
          const isHovered = hoveredEvent?.id === event.id;
          const isSelected = selectedEvent?.id === event.id;

          return (
            <Marker
              key={event.id}
              longitude={event.longitude}
              latitude={event.latitude}
              anchor="bottom"
            >
              <div
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => handleMarkerClick(event)}
              >
                {/* Pin Icon */}
                <div
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent transition-all duration-300',
                    isSelected ? 'scale-125' : '',
                    isHovered
                      ? 'scale-110 shadow-[0_0_30px_rgba(255,128,0,0.6)]'
                      : 'shadow-[0_0_20px_rgba(255,128,0,0.4)]'
                  )}
                >
                  <MapPin className={cn('h-6 w-6', isSelected ? 'text-white' : 'text-kenya-dark')} />
                  <div className="absolute inset-0 animate-ping rounded-full bg-gradient-accent opacity-20" />
                </div>

                {/* Hover Banner */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 transform">
                    <Card
                      className={cn(
                        'overflow-hidden border shadow-xl',
                        isDark
                          ? 'border-white/15 bg-zinc-950/95 text-white'
                          : 'border-black/10 bg-white text-zinc-900'
                      )}
                    >
                      <CardContent className="p-3">
                        {event.image_url && (
                          <div className="relative mb-2 h-32 w-full overflow-hidden rounded-lg">
                            <img
                              src={event.image_url}
                              alt={event.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3
                            className={cn(
                              'line-clamp-1 text-sm font-bold',
                              isDark ? 'text-white' : 'text-zinc-900'
                            )}
                          >
                            {event.title}
                          </h3>

                          <div
                            className={cn(
                              'flex items-center gap-2 text-xs',
                              isDark ? 'text-white/70' : 'text-zinc-600'
                            )}
                          >
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                            {event.time && (
                              <>
                                <Clock className="ml-2 h-3 w-3 shrink-0" />
                                <span>{event.time.substring(0, 5)}</span>
                              </>
                            )}
                          </div>

                          <div
                            className={cn(
                              'flex items-center gap-1 text-xs',
                              isDark ? 'text-white/70' : 'text-zinc-600'
                            )}
                          >
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 flex-1 bg-[#ff6b35] text-xs text-white hover:bg-[#ff6b35]/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewEvent(event);
                              }}
                            >
                              View Event
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn(
                                'h-7 px-2 text-xs',
                                isDark
                                  ? 'border-orange-400/50 text-orange-300 hover:bg-orange-500/10'
                                  : 'border-orange-500/40 text-orange-700 hover:bg-orange-50'
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirections(event);
                              }}
                            >
                              <Navigation className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Selected Event Popup */}
        {selectedEvent && !hoveredEvent && (
          <Popup
            longitude={selectedEvent.longitude!}
            latitude={selectedEvent.latitude!}
            anchor="bottom"
            onClose={() => setSelectedEvent(null)}
            closeButton={true}
            closeOnClick={false}
            className="mapbox-popup"
          >
            <div className={cn('w-64', isDark ? 'text-white' : 'text-zinc-900')}>
              {selectedEvent.image_url && (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="mb-2 h-32 w-full rounded-t-lg object-cover"
                />
              )}
              <h3 className="mb-1 text-sm font-bold">{selectedEvent.title}</h3>
              <p className={cn('mb-2 text-xs', isDark ? 'text-white/70' : 'text-zinc-600')}>
                {selectedEvent.location}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-[#ff6b35] text-xs text-white hover:bg-[#ff6b35]/90"
                  onClick={() => handleViewEvent(selectedEvent)}
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => handleDirections(selectedEvent)}
                >
                  <Navigation className="mr-1 h-3 w-3" />
                  Directions
                </Button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Info Badge */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <Badge
          className={cn(
            'rounded-full backdrop-blur',
            isDark
              ? 'border-white/20 bg-black/80 text-white'
              : 'border-black/10 bg-white/90 text-zinc-900'
          )}
        >
          {plottedEvents.length} event{plottedEvents.length !== 1 ? 's' : ''} pinned
        </Badge>
        {contextLocation && (
          <Badge
            className={cn(
              'rounded-full backdrop-blur',
              isDark
                ? 'border-white/20 bg-black/80 text-white'
                : 'border-black/10 bg-white/90 text-zinc-900'
            )}
          >
            {contextLocation}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default MapboxMap;

