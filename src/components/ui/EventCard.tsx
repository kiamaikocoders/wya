
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Share2 } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { Button } from './button';
import { toast } from 'sonner';
import { Event } from '@/lib/event-service';

// Category image mapping for more consistent and relevant images
const categoryImages = {
  "Business": [
    "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?q=80&w=2069", 
    "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=2070",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069"
  ],
  "Culture": [
    "https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=2070",
    "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2071",
    "https://images.unsplash.com/photo-1576075796033-848c2a5f3696?q=80&w=2144"
  ],
  "Sports": [
    "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2007",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070",
    "https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=2069"
  ],
  "Music": [
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
    "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80&w=2070"
  ],
  "Technology": [
    "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=2074",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=2070",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070"
  ],
  "Food & Drink": [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2787",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070",
    "https://images.unsplash.com/photo-1540914124281-342587941389?q=80&w=2674"
  ],
  "Art": [
    "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?q=80&w=2015",
    "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=2835",
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=2070"
  ]
};

// Default fallback images
const defaultImages = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070", // Festival
  "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069", // Business
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012", // Concert
  "https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=2069", // Sport
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=2070"  // Cultural
];

type EventCardProps = {
  id?: string;
  title?: string;
  category?: string;
  date?: string;
  location?: string;
  image?: string;
  capacity?: number;
  attendees?: number;
  event?: Event;
};

const EventCard = ({ 
  id, 
  title, 
  category, 
  date, 
  location, 
  image,
  capacity = 100,
  attendees = 0,
  event
}: EventCardProps) => {
  const navigate = useNavigate();
  
  // Use event object if provided, otherwise use individual props
  const eventId = event ? event.id.toString() : id;
  const eventTitle = event ? event.title : title;
  const eventCategory = event ? event.category : category;
  const eventDate = event ? event.date : date;
  const eventLocation = event ? event.location : location;
  const eventImage = event ? event.image_url : image;
  
  // Get an image based on category or use a default one
  const getEventImage = () => {
    // If image is provided, use it
    if (eventImage && !eventImage.includes("placehold.co")) {
      return eventImage;
    }
    
    // Try to get an image for the category
    const categoryImageArray = categoryImages[eventCategory as keyof typeof categoryImages];
    if (categoryImageArray) {
      // Use ID to ensure consistent image for same event ID
      const categoryIndex = parseInt(eventId, 10) % categoryImageArray.length;
      return categoryImageArray[categoryIndex >= 0 ? categoryIndex : 0];
    }
    
    // Fall back to default images if no category match
    const index = parseInt(eventId, 10) % defaultImages.length;
    return defaultImages[index >= 0 ? index : 0];
  };

  // Calculate attendance percentage
  const attendancePercentage = Math.min(Math.floor((attendees / capacity) * 100), 100);
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: eventTitle,
        text: `Check out this event: ${eventTitle}`,
        url: `${window.location.origin}/events/${eventId}`
      })
      .then(() => toast.success('Shared successfully'))
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}`)
        .then(() => toast.success('Link copied to clipboard'))
        .catch((error) => console.log('Error copying link', error));
    }
  };
  
  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Fix the variable naming conflict by renaming the date variable
    const calendarEventDate = new Date(eventDate || '');
    const endDate = new Date(calendarEventDate.getTime() + 2 * 60 * 60 * 1000); // Assuming 2 hours duration
    
    // Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle || '')}&dates=${calendarEventDate.toISOString().replace(/-|:|\.\d+/g, '')}/${endDate.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(`At ${eventLocation || ''}`)}&location=${encodeURIComponent(eventLocation || '')}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('Opening Google Calendar');
  };

  return (
    <div className="flex flex-col bg-white bg-opacity-5 rounded-xl overflow-hidden border border-kenya-brown transition-transform hover:scale-[1.02] animate-fade-in-up">
      <div className="relative">
        <div 
          className="w-full h-40 aspect-video bg-kenya-brown-dark bg-center bg-no-repeat bg-cover rounded-t-xl"
          style={{ backgroundImage: `url(${getEventImage()})` }}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-kenya-brown-dark/80 text-white hover:bg-kenya-brown transition-colors"
            aria-label="Share event"
          >
            <Share2 size={18} />
          </button>
          <FavoriteButton eventId={parseInt(eventId || "0", 10)} variant="icon" />
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
          {eventCategory}
        </div>
        <h3 className="text-white text-lg font-bold leading-tight">{eventTitle}</h3>
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Calendar size={16} />
            <span className="text-sm">{eventDate}</span>
          </div>
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <MapPin size={16} />
            <span className="text-sm">{eventLocation}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Link 
            to={`/events/${eventId}`} 
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
