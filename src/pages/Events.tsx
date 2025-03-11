
import React, { useState } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import EventCard from '@/components/ui/EventCard';
import { Calendar, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

// Sample data for events
const eventsData = [
  {
    id: '1',
    title: 'Nairobi International Trade Fair',
    category: 'Business',
    date: '2023-10-02',
    location: 'Nairobi',
    image: 'https://placehold.co/600x400/3A3027/FFFFFF?text=Trade+Fair',
  },
  {
    id: '2',
    title: 'Lamu Cultural Festival',
    category: 'Culture',
    date: '2023-11-15',
    location: 'Lamu',
    image: 'https://placehold.co/600x400/3A3027/FFFFFF?text=Cultural+Festival',
  },
  {
    id: '3',
    title: 'Magical Kenya Open',
    category: 'Sports',
    date: '2024-03-10',
    location: 'Nairobi',
    image: 'https://placehold.co/600x400/3A3027/FFFFFF?text=Kenya+Open',
  },
  {
    id: '4',
    title: 'Koroga Festival',
    category: 'Music',
    date: '2023-09-25',
    location: 'Naivasha',
    image: 'https://placehold.co/600x400/3A3027/FFFFFF?text=Koroga+Festival',
  },
  {
    id: '5',
    title: 'Nairobi Tech Week',
    category: 'Technology',
    date: '2023-11-05',
    location: 'Nairobi',
    image: 'https://placehold.co/600x400/3A3027/FFFFFF?text=Tech+Week',
  },
  {
    id: '6',
    title: 'Maralal International Camel Derby',
    category: 'Sports',
    date: '2023-08-20',
    location: 'Samburu',
    image: 'https://placehold.co/600x400/3A3027/FFFFFF?text=Camel+Derby',
  },
];

// Sample locations and categories for filters
const locations = ['All Locations', 'Nairobi', 'Lamu', 'Naivasha', 'Samburu'];
const categories = ['All Categories', 'Business', 'Culture', 'Sports', 'Music', 'Technology'];

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDate, setSelectedDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleApplyFilters = () => {
    toast.success('Filters applied successfully!');
    setIsFilterOpen(false);
  };

  const handleCreateEvent = () => {
    toast.info('Create Event functionality would open here');
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {eventsData.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>
      
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={handleCreateEvent}
          className="bg-kenya-orange text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-transform hover:scale-105"
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      </div>
    </div>
  );
};

export default Events;
