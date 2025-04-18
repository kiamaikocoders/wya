
import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export interface EventCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  image: string;
  capacity: number;
  attendees?: number;
  isFeatured?: boolean;
  price?: number; // Added price property
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  category,
  date,
  location,
  image,
  capacity,
  attendees = 0,
  isFeatured = false,
  price
}) => {
  // Format the date
  let formattedDate;
  try {
    formattedDate = format(parseISO(date), 'EEE, MMM d, yyyy');
  } catch (e) {
    formattedDate = date;
  }

  // Calculate percentage of capacity filled
  const capacityPercentage = Math.min(Math.round((attendees / capacity) * 100), 100);
  const isAlmostFull = capacityPercentage >= 80;
  
  return (
    <Card className="overflow-hidden bg-kenya-brown/10 hover:bg-kenya-brown/20 transition-all duration-300 h-full flex flex-col">
      <Link to={`/events/${id}`} className="h-full flex flex-col">
        <div className="relative">
          <img 
            src={image || 'https://placehold.co/600x400?text=Event+Image'} 
            alt={title}
            className="w-full h-48 object-cover"
          />
          {isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-kenya-orange text-white flex items-center gap-1">
                <Star className="h-3 w-3" /> Featured
              </Badge>
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
          
          <div className="space-y-2 mb-3 flex-1">
            <div className="flex items-center text-sm text-kenya-brown-light">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-sm text-kenya-brown-light">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{location}</span>
            </div>
            {price !== undefined && (
              <div className="flex items-center text-sm font-medium">
                <span className="text-kenya-orange">
                  {price === 0 ? 'Free' : `${price} KES`}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span>{attendees} attending</span>
              </div>
              {isAlmostFull && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  Almost full
                </Badge>
              )}
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div 
                className={`${isAlmostFull ? 'bg-red-500' : 'bg-kenya-orange'} h-1.5 rounded-full`} 
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default EventCard;
