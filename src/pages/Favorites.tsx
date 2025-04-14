
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesService } from '@/lib/favorites-service';
import { eventService } from '@/lib/event-service';
import EventCard from '@/components/ui/EventCard';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowLeft } from 'lucide-react';

const Favorites = () => {
  const { isAuthenticated } = useAuth();
  
  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesService.getUserFavorites,
    enabled: isAuthenticated,
  });
  
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });
  
  const isLoading = favoritesLoading || eventsLoading;
  
  // Filter events that are in favorites
  const favoriteEvents = events?.filter(event => 
    favorites?.some(fav => fav.event_id === event.id)
  ) || [];
  
  if (!isAuthenticated) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center">
        <div className="bg-kenya-brown/20 rounded-lg p-8 text-center max-w-md mx-auto">
          <Bookmark className="mx-auto mb-4 text-kenya-orange" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Login to view favorites</h2>
          <p className="text-kenya-brown-light mb-6">You need to be logged in to view and manage your favorite events.</p>
          <Link to="/login">
            <Button>Login now</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Favorites</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
        </div>
      ) : favoriteEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteEvents.map(event => (
            <EventCard 
              key={event.id}
              id={String(event.id)}
              title={event.title}
              category={event.category}
              date={event.date}
              location={event.location}
              image={event.image_url}
            />
          ))}
        </div>
      ) : (
        <div className="bg-kenya-brown/20 rounded-lg p-8 text-center max-w-md mx-auto">
          <Bookmark className="mx-auto mb-4 text-kenya-brown-light" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
          <p className="text-kenya-brown-light mb-6">Explore events and save your favorites to find them here.</p>
          <Link to="/events">
            <Button>Explore Events</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
