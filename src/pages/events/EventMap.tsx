import { useMemo } from 'react';
import Map, { Marker, NavigationControl, ViewState } from 'react-map-gl/maplibre';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types/event.types';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

type EventMapProps = {
  events: Event[];
  contextLocation: string | null;
  height?: number;
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

const EventMap = ({ events, contextLocation, height = 520 }: EventMapProps) => {
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

  const initialViewState: Partial<ViewState> = useMemo(() => {
    if (plottedEvents.length === 0) {
      const defaultCoords =
        (contextLocation &&
          getCoordinates({
            ...(events[0] || {}),
            location: contextLocation,
          } as Event)) ??
        cityCoordinates.nairobi;

      return {
        longitude: defaultCoords.longitude,
        latitude: defaultCoords.latitude,
        zoom: 6,
      };
    }

    if (plottedEvents.length === 1) {
      return {
        longitude: plottedEvents[0].longitude,
        latitude: plottedEvents[0].latitude,
        zoom: 10,
      };
    }

    const avgLongitude =
      plottedEvents.reduce((sum, event) => sum + event.longitude, 0) /
      plottedEvents.length;
    const avgLatitude =
      plottedEvents.reduce((sum, event) => sum + event.latitude, 0) / plottedEvents.length;

    return {
      longitude: avgLongitude,
      latitude: avgLatitude,
      zoom: 6.5,
    };
  }, [contextLocation, plottedEvents, events]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5">
      <Map
        initialViewState={initialViewState}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        mapLib={import('maplibre-gl')}
        style={{ width: '100%', height }}
      >
        <NavigationControl position="bottom-right" visualizePitch />
        {plottedEvents.map(event => (
          <Marker
            key={event.id}
            longitude={event.longitude}
            latitude={event.latitude}
            anchor="bottom"
          >
            <div className="group relative flex translate-y-[-8px] flex-col items-center">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-kenya-orange via-amber-400 to-kenya-orange shadow-[0_15px_40px_rgba(255,128,0,0.35)]">
                <MapPin className="h-5 w-5 text-kenya-dark" />
              </div>
              <div className="pointer-events-none mt-2 hidden rounded-full border border-white/10 bg-black/80 px-3 py-1 text-xs text-white shadow-lg backdrop-blur group-hover:block">
                <p className="font-semibold">{event.title}</p>
                <p className="text-white/60">{event.location}</p>
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <Badge className="rounded-full bg-black/70 text-white backdrop-blur">
          {plottedEvents.length} pinned
        </Badge>
        {contextLocation && (
          <Badge className="rounded-full bg-black/70 text-white backdrop-blur">
            Focusing on {contextLocation}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default EventMap;

