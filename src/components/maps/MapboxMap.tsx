import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, ViewState } from 'react-map-gl/mapbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Event } from '@/types/event.types';
import { MapPin, Navigation, ExternalLink, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { locationService } from '@/lib/location-service';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = locationService.getMapboxToken();

type MapboxMapProps = {
  events: Event[];
  contextLocation?: string | null;
  height?: number;
  onEventClick?: (event: Event) => void;
  interactive?: boolean;
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
  height = 520,
  onEventClick,
  interactive = true
}) => {
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
    if (onEventClick) {
      onEventClick(event);
    }
  }, [onEventClick]);

  const handleDirections = useCallback((event: Event & { longitude: number; latitude: number }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
    window.open(url, '_blank');
  }, []);

  const handleViewEvent = useCallback((event: Event) => {
    window.location.href = `/events/${event.id}`;
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl" style={{ height }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
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
                className="relative cursor-pointer group"
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => handleMarkerClick(event)}
              >
                {/* Pin Icon */}
                <div className={`
                  relative flex h-12 w-12 items-center justify-center 
                  rounded-full transition-all duration-300
                  ${isSelected 
                    ? 'bg-gradient-to-br bg-gradient-accent scale-125' 
                    : 'bg-gradient-to-br bg-gradient-accent'
                  }
                  ${isHovered ? 'scale-110 shadow-[0_0_30px_rgba(255,128,0,0.6)]' : 'shadow-[0_0_20px_rgba(255,128,0,0.4)]'}
                `}>
                  <MapPin className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-kenya-dark'}`} />
                  
                  {/* Pulse Animation */}
                  <div className="absolute inset-0 rounded-full bg-gradient-accent animate-ping opacity-20" />
                </div>

                {/* Hover Banner */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50">
                    <Card className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-kenya-orange/30 shadow-xl">
                      <CardContent className="p-3">
                        {/* Event Image */}
                        {event.image_url && (
                          <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden">
                            <img
                              src={event.image_url}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        )}
                        
                        {/* Event Info */}
                        <div className="space-y-2">
                          <h3 className="font-bold text-white text-sm line-clamp-1">
                            {event.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-xs text-text-white/70">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                            {event.time && (
                              <>
                                <Clock className="h-3 w-3 ml-2" />
                                <span>{event.time.substring(0, 5)}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-text-white/70">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-accent hover:bg-opacity-90 text-white text-xs h-7"
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
                              className="border-kenya-orange/50 text-gradient-orange-accent hover:bg-gradient-accent/10 text-xs h-7 px-2"
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
            <div className="w-64">
              {selectedEvent.image_url && (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-32 object-cover rounded-t-lg mb-2"
                />
              )}
              <h3 className="font-bold text-sm mb-1">{selectedEvent.title}</h3>
              <p className="text-xs text-gray-600 mb-2">{selectedEvent.location}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-accent hover:bg-opacity-90 text-white text-xs"
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
                  <Navigation className="h-3 w-3 mr-1" />
                  Directions
                </Button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Info Badge */}
      <div className="absolute left-4 top-4 flex flex-wrap gap-2 z-10">
        <Badge className="rounded-full bg-black/80 text-white backdrop-blur border-white/20">
          {plottedEvents.length} event{plottedEvents.length !== 1 ? 's' : ''} pinned
        </Badge>
        {contextLocation && (
          <Badge className="rounded-full bg-black/80 text-white backdrop-blur border-white/20">
            {contextLocation}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default MapboxMap;

