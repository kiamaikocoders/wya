
import React from 'react';
import SearchBar from '@/components/ui/SearchBar';
import Section from '@/components/ui/Section';
import EventCard from '@/components/ui/EventCard';
import CategoryItem from '@/components/ui/CategoryItem';
import { toast } from 'sonner';

// Sample data for the application
const featuredEvents = [
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
];

const categories = [
  { name: 'Food & Drink', slug: 'food-drink', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Food+%26+Drink' },
  { name: 'Music', slug: 'music', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Music' },
  { name: 'Art', slug: 'art', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Art' },
  { name: 'Sports', slug: 'sports', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Sports' },
];

const Home = () => {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    toast.info(`Searching for: ${query}`);
  };

  const handleDiscoverEvents = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Discovering events for you!');
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="px-4 py-3">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight">
          Discover Kenyan Events
        </h1>
        <p className="text-kenya-brown-light mt-2">
          Find exciting happenings across the nation!
        </p>
      </div>

      <Section title="Find your next experience">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
      </Section>

      <Section title="Categories">
        <div className="flex overflow-y-auto scrollbar-none px-4">
          <div className="flex items-stretch gap-4 pb-2">
            {categories.map((category) => (
              <CategoryItem key={category.slug} {...category} />
            ))}
          </div>
        </div>
      </Section>

      <div className="container px-4 py-10 md:py-16">
        <div className="bg-kenya-brown bg-opacity-20 rounded-xl p-6 md:p-10 flex flex-col items-center text-center">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-4">
            Join the Community
          </h2>
          <p className="text-kenya-brown-light mb-6 max-w-md">
            Connect with event-goers and organizers across Kenya
          </p>
          
          <form onSubmit={handleDiscoverEvents} className="w-full max-w-md">
            <div className="flex w-full rounded-xl h-12 overflow-hidden">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-kenya-brown text-white px-4 py-2 border-none placeholder:text-kenya-brown-light"
              />
              <button 
                type="submit"
                className="bg-kenya-orange text-white px-4 py-2 font-medium hover:bg-opacity-90 transition-colors"
              >
                Discover events
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
