import React, { useEffect, useRef } from 'react';
import { MapPin, Map } from 'lucide-react';
import { locationService } from '@/lib/location-service';

const MAPBOX_TOKEN = locationService.getMapboxToken();

interface MapViewProps {
  location: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  interactive?: boolean;
}

/**
 * Static map preview. Uses Mapbox Static Images API when lat/lng are available,
 * otherwise falls back to a placeholder. The deprecated OpenStreetMap static API
 * is no longer used.
 */
const MapView: React.FC<MapViewProps> = ({
  location,
  latitude,
  longitude,
  className = '',
  interactive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const encodedLocation = encodeURIComponent(location);

  const staticMapUrl = hasCoords
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+ff6b35(${longitude},${latitude})/${longitude},${latitude},14,0,0/600x300@2x?access_token=${MAPBOX_TOKEN}`
    : null;

  useEffect(() => {
    if (!interactive || !mapContainerRef.current) return;

    const mapContainer = mapContainerRef.current;
    const query = hasCoords ? `${latitude},${longitude}` : encodedLocation;

    const handleClick = () => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    mapContainer.addEventListener('click', handleClick);
    return () => mapContainer.removeEventListener('click', handleClick);
  }, [interactive, encodedLocation, hasCoords, latitude, longitude]);

  const openGoogleMaps = () => {
    const query = hasCoords ? `${latitude},${longitude}` : encodedLocation;
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div
      ref={mapContainerRef}
      className={`relative overflow-hidden rounded-lg border border-white/20 ${className}`}
    >
      {location === 'Kenya' || !location ? (
        <div className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 h-full w-full flex items-center justify-center p-6">
          <div className="text-center">
            <Map size={32} className="mx-auto mb-2 text-gradient-orange-accent" />
            <p className="text-text-white/70">Explore events across Kenya</p>
          </div>
        </div>
      ) : staticMapUrl ? (
        <>
          <img
            src={staticMapUrl}
            alt={`Map of ${location}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <MapPin size={32} className="text-gradient-orange-accent drop-shadow-lg" />
          </div>
          {interactive && (
            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <button
                onClick={openGoogleMaps}
                className="px-4 py-2 bg-gradient-accent text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors shadow-lg"
              >
                View on Google Maps
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 h-full w-full flex flex-col items-center justify-center p-6 gap-2">
          <Map size={32} className="text-gradient-orange-accent" />
          <p className="text-text-white/70 text-center">{location}</p>
          {interactive && (
            <button
              onClick={openGoogleMaps}
              className="px-4 py-2 bg-gradient-accent text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors"
            >
              View on Google Maps
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MapView;
