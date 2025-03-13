
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

const sampleEventImages = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070", // Festival
  "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069", // Business
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012", // Concert
  "https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=2069", // Sport
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=2070"  // Cultural
];

type EventCardProps = {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  image?: string;
};

const EventCard = ({ id, title, category, date, location, image }: EventCardProps) => {
  // If no image is provided, select one based on the event id or category
  const getDefaultImage = () => {
    if (!image) {
      const index = parseInt(id, 10) % sampleEventImages.length;
      return sampleEventImages[index >= 0 ? index : 0];
    }
    return image;
  };

  return (
    <div className="flex flex-col bg-white bg-opacity-5 rounded-xl overflow-hidden border border-kenya-brown transition-transform hover:scale-[1.02] animate-fade-in-up">
      <div 
        className="w-full h-40 aspect-video bg-kenya-brown-dark bg-center bg-no-repeat bg-cover rounded-t-xl"
        style={{ backgroundImage: `url(${getDefaultImage()})` }}
      />
      <div className="p-4 flex flex-col gap-2">
        <div className="bg-kenya-orange text-kenya-dark text-xs font-medium py-1 px-2 rounded-full self-start">
          {category}
        </div>
        <h3 className="text-white text-lg font-bold leading-tight">{title}</h3>
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Calendar size={16} />
            <span className="text-sm">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <MapPin size={16} />
            <span className="text-sm">{location}</span>
          </div>
        </div>
        <Link 
          to={`/events/${id}`} 
          className="mt-3 bg-kenya-orange text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-opacity-90 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
