
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import EventCard from '@/components/ui/EventCard';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Categories = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // Convert slug format (e.g., 'food-drink') to display format (e.g., 'Food & Drink')
  const formatCategoryName = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('And', '&');
  };

  const categoryName = slug ? formatCategoryName(slug) : '';
  
  // Fetch events filtered by category
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', 'category', slug],
    queryFn: async () => {
      const allEvents = await eventService.getAllEvents();
      // Filter events by matching the category (case-insensitive) or closely related terms
      return allEvents.filter(event => {
        const eventCategory = event.category.toLowerCase();
        const searchCategory = categoryName.toLowerCase();
        
        return eventCategory.includes(searchCategory) || 
               searchCategory.includes(eventCategory) ||
               (searchCategory === 'food & drink' && 
                (eventCategory.includes('food') || eventCategory.includes('drink')));
      });
    },
    enabled: !!slug,
  });

  if (!slug) {
    toast.error('Category not found');
    navigate('/events');
    return null;
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-kenya-brown hover:bg-kenya-brown-dark transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-white text-2xl md:text-3xl font-bold">{categoryName} Events</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : error ? (
          <div className="text-center text-kenya-orange p-8">
            <p>Failed to load events. Please try again.</p>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
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
          <div className="text-center text-kenya-brown-light p-8">
            <p>No events found in this category.</p>
            <Link to="/events" className="text-kenya-orange hover:underline mt-4 inline-block">
              Browse all events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
