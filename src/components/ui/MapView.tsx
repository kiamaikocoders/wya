
import React, { useEffect, useRef } from 'react';
import { MapPin, Map } from 'lucide-react';

interface MapViewProps {
  location: string;
  className?: string;
  interactive?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ 
  location, 
  className = '', 
  interactive = false 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const encodedLocation = encodeURIComponent(location);
  
  // For a static map preview - using OpenStreetMap for free static maps
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${encodedLocation}&zoom=14&size=600x300&markers=${encodedLocation},ol-marker-blue`;
  
  useEffect(() => {
    if (!interactive || !mapContainerRef.current) return;
    
    // In a real implementation, we would initialize a map library here
    // such as Leaflet, Google Maps, or Mapbox
    
    // For now, we'll just make the static map clickable
    const mapContainer = mapContainerRef.current;
    
    const handleClick = () => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    };
    
    mapContainer.addEventListener('click', handleClick);
    
    return () => {
      mapContainer.removeEventListener('click', handleClick);
    };
  }, [interactive, encodedLocation]);
  
  // For interactive maps, open in Google Maps
  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  };
  
  return (
    <div 
      ref={mapContainerRef}
      className={`relative overflow-hidden rounded-lg border border-kenya-brown ${className}`}
    >
      {location === 'Kenya' || !location ? (
        // Fallback map UI when no specific location is provided
        <div className="bg-kenya-brown/10 h-full w-full flex items-center justify-center p-6">
          <div className="text-center">
            <Map size={32} className="mx-auto mb-2 text-kenya-orange" />
            <p className="text-kenya-brown-light">Explore events across Kenya</p>
          </div>
        </div>
      ) : (
        <>
          <img 
            src={staticMapUrl} 
            alt={`Map of ${location}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <MapPin size={32} className="text-kenya-orange drop-shadow-lg" />
          </div>
          
          {interactive && (
            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <button
                onClick={openGoogleMaps}
                className="px-4 py-2 bg-kenya-orange text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors shadow-lg"
              >
                View on Google Maps
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MapView;
