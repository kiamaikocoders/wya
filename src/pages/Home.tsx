
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import CategoryItem from '@/components/ui/CategoryItem';
import EventCard from '@/components/ui/EventCard';
import SearchBar from '@/components/ui/SearchBar';
import AIEventRecommendations from '@/components/events/AIEventRecommendations';
import { Brain, Sparkles } from 'lucide-react';

// Sample categories
const categories = [
  { id: 1, name: 'Music', icon: '🎵' },
  { id: 2, name: 'Sports', icon: '⚽' },
  { id: 3, name: 'Food', icon: '🍔' },
  { id: 4, name: 'Art', icon: '🎨' },
  { id: 5, name: 'Technology', icon: '💻' },
  { id: 6, name: 'Culture', icon: '🏛️' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch all events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });
  
  const featuredEvents = events?.filter(event => event.is_featured) || [];
  
  // Filter events by selected category
  const filteredEvents = selectedCategory
    ? events?.filter(event => event.category.toLowerCase() === selectedCategory.toLowerCase())
    : events || [];
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Could also navigate to the category page
    // navigate(`/categories/${category.toLowerCase()}`);
  };
  
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Hero Section */}
      <div className="relative bg-kenya-dark">
        <div className="absolute inset-0 bg-gradient-to-b from-kenya-dark to-transparent opacity-90"></div>
        <div className="relative container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
          <h1 className="text-white text-center text-3xl md:text-5xl font-bold mb-4">
            Discover Amazing Events in Kenya
          </h1>
          <p className="text-white/80 text-center max-w-2xl mb-8">
            Find and attend the best events happening around you. From music festivals to cultural exhibitions, we've got you covered.
          </p>
          
          <div className="w-full max-w-2xl mb-8">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={() => navigate('/events')}
              className="bg-kenya-orange text-white hover:bg-kenya-orange/90"
            >
              Explore Events
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/request-event')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Request an Event
            </Button>
            <Button 
              onClick={() => navigate('/ai-assistance')}
              className="bg-kenya-brown text-white hover:bg-kenya-brown/90 flex items-center gap-2"
            >
              <Brain size={18} className="text-kenya-orange" />
              AI Assistance
            </Button>
          </div>
        </div>
      </div>
      
      {/* AI Recommendations Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-kenya-orange" />
            <h2 className="text-white text-xl font-semibold">AI Recommendations</h2>
          </div>
          <Button 
            variant="link" 
            onClick={() => navigate('/ai-assistance')}
            className="text-kenya-orange"
          >
            More AI Features
          </Button>
        </div>
        <AIEventRecommendations onSelectCategory={handleCategorySelect} />
      </div>
      
      {/* Categories Section */}
      <Section 
        title="Browse Categories" 
        subtitle="Find events by category"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 px-4">
          {categories.map(category => (
            <CategoryItem 
              key={category.id}
              name={category.name}
              icon={category.icon}
              isActive={selectedCategory === category.name}
              onClick={() => handleCategorySelect(category.name)}
            />
          ))}
        </div>
      </Section>
      
      {/* Featured Events Section */}
      <Section 
        title="Featured Events" 
        subtitle="Don't miss out on these amazing events"
        action={
          <Link to="/events">
            <Button variant="link" className="text-kenya-orange">
              View All
            </Button>
          </Link>
        }
      >
        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {featuredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-kenya-brown-light py-4">No featured events available.</p>
        )}
      </Section>
      
      {/* Filtered Events or Upcoming Events */}
      <Section 
        title={selectedCategory ? `${selectedCategory} Events` : "Upcoming Events"} 
        subtitle={selectedCategory ? `Explore ${selectedCategory} events` : "Check out these upcoming events"}
      >
        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {filteredEvents.slice(0, 6).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-kenya-brown-light py-4 px-4">
            {selectedCategory ? `No ${selectedCategory} events available.` : "No upcoming events available."}
          </p>
        )}
        
        {filteredEvents.length > 6 && (
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => navigate('/events')}
              className="bg-kenya-orange text-white hover:bg-kenya-orange/90"
            >
              Load More
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
};

export default Home;
