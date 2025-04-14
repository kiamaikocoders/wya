
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Share2 } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { Button } from './button';
import { toast } from 'sonner';

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
  capacity?: number;
  attendees?: number;
};

const EventCard = ({ 
  id, 
  title, 
  category, 
  date, 
  location, 
  image,
  capacity = 100,
  attendees = 0
}: EventCardProps) => {
  const navigate = useNavigate();
  
  // If no image is provided, select one based on the event id or category
  const getDefaultImage = () => {
    if (!image) {
      const index = parseInt(id, 10) % sampleEventImages.length;
      return sampleEventImages[index >= 0 ? index : 0];
    }
    return image;
  };

  // Calculate attendance percentage
  const attendancePercentage = Math.min(Math.floor((attendees / capacity) * 100), 100);
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out this event: ${title}`,
        url: `${window.location.origin}/events/${id}`
      })
      .then(() => toast.success('Shared successfully'))
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/events/${id}`)
        .then(() => toast.success('Link copied to clipboard'))
        .catch((error) => console.log('Error copying link', error));
    }
  };
  
  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Format the date for calendar
    const eventDate = new Date(date);
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Assuming 2 hours duration
    
    // Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${eventDate.toISOString().replace(/-|:|\.\d+/g, '')}/${endDate.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(`At ${location}`)}&location=${encodeURIComponent(location)}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('Opening Google Calendar');
  };

  return (
    <div className="flex flex-col bg-white bg-opacity-5 rounded-xl overflow-hidden border border-kenya-brown transition-transform hover:scale-[1.02] animate-fade-in-up">
      <div className="relative">
        <div 
          className="w-full h-40 aspect-video bg-kenya-brown-dark bg-center bg-no-repeat bg-cover rounded-t-xl"
          style={{ backgroundImage: `url(${getDefaultImage()})` }}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-kenya-brown-dark/80 text-white hover:bg-kenya-brown transition-colors"
            aria-label="Share event"
          >
            <Share2 size={18} />
          </button>
          <FavoriteButton eventId={parseInt(id, 10)} variant="icon" />
        </div>
        
        {capacity > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-kenya-dark/80 px-3 py-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Users size={14} className="text-kenya-orange" />
              <div className="flex-1">
                <div className="flex justify-between text-kenya-brown-light mb-1">
                  <span>{attendees} attending</span>
                  <span>{Math.floor(attendancePercentage)}% full</span>
                </div>
                <div className="w-full bg-kenya-brown-dark rounded-full h-1.5">
                  <div 
                    className="bg-kenya-orange h-1.5 rounded-full" 
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
        <div className="flex items-center justify-between mt-3">
          <Link 
            to={`/events/${id}`} 
            className="bg-kenya-orange text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-opacity-90 transition-colors flex-1 mr-2"
          >
            View Details
          </Link>
          <Button
            onClick={handleAddToCalendar}
            variant="outline"
            size="icon"
            className="border-kenya-brown-light text-kenya-brown-light hover:text-white hover:bg-kenya-brown"
            title="Add to Calendar"
          >
            <Calendar size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
