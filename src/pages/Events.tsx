
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/ui/SearchBar';
import EventCard from '@/components/ui/EventCard';
import { Calendar, Filter, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { eventService, Event } from '@/lib/event-service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Sample locations and categories for filters
const locations = ['All Locations', 'Nairobi', 'Lamu', 'Naivasha', 'Samburu'];
const categories = ['All Categories', 'Business', 'Culture', 'Sports', 'Music', 'Technology'];

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDate, setSelectedDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Fetch events data
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleApplyFilters = () => {
    toast.success('Filters applied successfully!');
    setIsFilterOpen(false);
  };

  const handleCreateEvent = () => {
    if (!isAuthenticated) {
      toast.error('Please login to create an event');
      navigate('/login', { state: { from: '/create-event' } });
      return;
    }
    
    if (user?.user_type !== 'organizer') {
      toast.error('Only organizers can create events');
      return;
    }
    
    // Navigate to the create event page
    navigate('/create-event');
  };

  // Filter events based on search query and filters
  const filteredEvents = events?.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLocation = selectedLocation === 'All Locations' || 
      event.location === selectedLocation;
      
    const matchesCategory = selectedCategory === 'All Categories' || 
      event.category === selectedCategory;
      
    const matchesDate = selectedDate === '' || 
      event.date.includes(selectedDate);
      
    return matchesSearch && matchesLocation && matchesCategory && matchesDate;
  });

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="px-4 py-6 flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold">Upcoming Events</h1>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-2 rounded-full bg-kenya-brown hover:bg-kenya-brown-dark transition-colors"
          >
            <Filter size={20} className="text-white" />
          </button>
        </div>
        
        <SearchBar 
          placeholder="Search for events..." 
          onSearch={handleSearch} 
        />

        {isFilterOpen && (
          <div className="bg-kenya-brown rounded-xl p-4 animate-fade-in">
            <h3 className="text-white mb-3 font-medium">Filters</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-kenya-brown-light text-sm block mb-1">Location</label>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-kenya-dark text-white rounded-lg p-2 border border-kenya-brown-dark"
                >
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-kenya-brown-light text-sm block mb-1">Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-kenya-dark text-white rounded-lg p-2 border border-kenya-brown-dark"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-kenya-brown-light text-sm block mb-1">Date</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kenya-brown-light">
                    <Calendar size={16} />
                  </div>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-kenya-dark text-white rounded-lg p-2 pl-10 border border-kenya-brown-dark"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleApplyFilters}
                className="w-full bg-kenya-orange text-white py-2 rounded-lg font-medium mt-2 hover:bg-opacity-90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
        </div>
      ) : error ? (
        <div className="text-center text-kenya-orange p-8">
          <p>Failed to load events. Please try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {filteredEvents && filteredEvents.length > 0 ? (
            filteredEvents.map((event: Event) => (
              <EventCard 
                key={event.id} 
                id={String(event.id)}
                title={event.title}
                category={event.category}
                date={event.date}
                location={event.location}
                image={event.image_url}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-kenya-brown-light p-8">
              <p>No events found. Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={handleCreateEvent}
          className="bg-kenya-orange text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-transform hover:scale-105"
          aria-label="Create event"
          title="Create new event"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default Events;
