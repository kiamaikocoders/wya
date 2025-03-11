
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import { Calendar, MapPin, User, Tag, Clock, ArrowLeft, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistance } from 'date-fns';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(Number(eventId)),
    enabled: !!eventId,
  });

  const handleDelete = async () => {
    if (!eventId) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(Number(eventId));
        navigate('/events');
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const isOwner = user?.id === event?.organizer_id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-white text-xl font-bold mb-4">Event not found</h1>
        <p className="text-kenya-brown-light mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 bg-kenya-orange text-white py-2 px-4 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>
      </div>
    );
  }

  const timeAgo = formatDistance(
    new Date(event.created_at),
    new Date(),
    { addSuffix: true }
  );

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="relative">
        {/* Event Image Banner */}
        <div 
          className="w-full h-60 md:h-80 bg-center bg-cover bg-no-repeat relative"
          style={{ backgroundImage: event.image_url ? `url(${event.image_url})` : undefined, backgroundColor: '#2A231D' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-kenya-dark"></div>
          
          <button
            onClick={() => navigate('/events')}
            className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-full text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Event Category */}
        <div className="absolute bottom-0 left-0 translate-y-1/2 ml-4">
          <span className="bg-kenya-orange text-kenya-dark text-sm font-medium py-1 px-3 rounded-full">
            {event.category}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-white text-2xl md:text-3xl font-bold mb-3">{event.title}</h1>
        
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Calendar size={18} />
            <span>{event.date}</span>
          </div>
          
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <MapPin size={18} />
            <span>{event.location}</span>
          </div>
          
          {event.price !== undefined && (
            <div className="flex items-center gap-2 text-kenya-brown-light">
              <Tag size={18} />
              <span>{event.price === 0 ? 'Free' : `Ksh ${event.price}`}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Clock size={18} />
            <span>Posted {timeAgo}</span>
          </div>
        </div>
        
        {/* Description */}
        <div className="bg-kenya-dark bg-opacity-50 rounded-xl p-4 mb-6">
          <h2 className="text-white text-lg font-semibold mb-2">About this event</h2>
          <p className="text-kenya-brown-light whitespace-pre-line">{event.description}</p>
        </div>
        
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white text-lg font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <span key={index} className="bg-kenya-brown bg-opacity-30 text-kenya-brown-light text-xs py-1 px-3 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Owner Actions */}
        {isAuthenticated && isOwner && (
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => toast.info('Edit functionality coming soon')}
              className="flex-1 flex items-center justify-center gap-2 bg-kenya-brown text-white py-3 rounded-lg"
            >
              <Edit size={16} />
              Edit Event
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg"
            >
              <Trash size={16} />
              Delete Event
            </button>
          </div>
        )}
        
        {/* Attendance Actions */}
        {isAuthenticated && !isOwner && (
          <button 
            onClick={() => toast.info('RSVP functionality coming soon')}
            className="w-full bg-kenya-orange text-white py-3 rounded-lg font-medium mt-4"
          >
            RSVP to this event
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
