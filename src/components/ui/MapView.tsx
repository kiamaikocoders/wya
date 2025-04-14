
import React from 'react';
import { MapPin } from 'lucide-react';

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
  const encodedLocation = encodeURIComponent(location);
  
  // For a static map preview
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=13&size=600x300&markers=color:red%7C${encodedLocation}&key=YOUR_API_KEY`;
  
  // For interactive maps, open in Google Maps
  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  };
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-kenya-brown ${className}`}
    >
      {/* Fallback map UI since we don't have an actual API key */}
      <div className="bg-kenya-brown/10 h-full w-full flex items-center justify-center p-6">
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2 text-kenya-orange" />
          <p className="text-kenya-brown-light">{location}</p>
          
          {interactive && (
            <button
              onClick={openGoogleMaps}
              className="mt-3 px-4 py-2 bg-kenya-orange text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors"
            >
              View on Google Maps
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
