
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import SearchBar from '@/components/ui/SearchBar';
import Section from '@/components/ui/Section';
import EventCard from '@/components/ui/EventCard';
import CategoryItem from '@/components/ui/CategoryItem';
import ImageCarousel, { CarouselImage } from '@/components/ui/ImageCarousel';
import { eventService, Event } from '@/lib/event-service';
import { toast } from 'sonner';

// Categories for the application
const categories = [
  { name: 'Food & Drink', slug: 'food-drink', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Food+%26+Drink' },
  { name: 'Music', slug: 'music', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Music' },
  { name: 'Art', slug: 'art', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Art' },
  { name: 'Sports', slug: 'sports', image: 'https://placehold.co/600x600/3A3027/FFFFFF?text=Sports' },
];

// Featured stories for the carousel
const featuredStories: CarouselImage[] = [
  {
    id: '1',
    src: 'https://placehold.co/1200x800/FF8000/FFFFFF?text=Nairobi+Festival',
    alt: 'Nairobi Festival',
    title: 'Nairobi Festival',
    subtitle: 'A celebration of culture and diversity',
    link: '/events/1'
  },
  {
    id: '2',
    src: 'https://placehold.co/1200x800/3A3027/FFFFFF?text=Lamu+Cultural+Festival',
    alt: 'Lamu Cultural Festival',
    title: 'Lamu Cultural Festival',
    subtitle: 'Experience traditional Swahili culture',
    link: '/events/2'
  },
  {
    id: '3',
    src: 'https://placehold.co/1200x800/FF8000/FFFFFF?text=Kenya+Open',
    alt: 'Magical Kenya Open',
    title: 'Magical Kenya Open',
    subtitle: 'International golf tournament',
    link: '/events/3'
  },
  {
    id: '4',
    src: 'https://placehold.co/1200x800/3A3027/FFFFFF?text=Restaurant+Week',
    alt: 'Nairobi Restaurant Week',
    title: 'Nairobi Restaurant Week',
    subtitle: 'Explore the best dining experiences',
    link: '/events/4'
  },
  {
    id: '5',
    src: 'https://placehold.co/1200x800/FF8000/FFFFFF?text=Music+Festival',
    alt: 'Kilifi New Year Festival',
    title: 'Kilifi New Year Festival',
    subtitle: 'Ring in the new year with music',
    link: '/events/5'
  }
];

const Home = () => {
  const [email, setEmail] = useState('');

  // Fetch events data
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });

  // Filter featured events
  const featuredEvents = events?.filter(event => event.is_featured) || 
                         events?.slice(0, 3) || [];

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    toast.info(`Searching for: ${query}`);
  };

  const handleDiscoverEvents = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    toast.success('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="px-4 py-3">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      {/* Logo and Heading */}
      <div className="flex flex-col items-center justify-center pt-8 pb-5">
        <img 
          src="/lovable-uploads/6cca2893-2362-428d-b824-69d6baff41c7.png" 
          alt="WYA Logo" 
          className="w-28 h-28 mb-4" 
        />
        <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight">
          Discover Kenyan Events
        </h1>
        <p className="text-kenya-brown-light mt-2">
          Find exciting happenings across the nation!
        </p>
      </div>

      {/* Stories Carousel */}
      <Section title="Featured Stories">
        <div className="py-2">
          <ImageCarousel images={featuredStories} />
        </div>
      </Section>

      {/* Featured Events */}
      <Section title="Find your next experience">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {featuredEvents.map((event: Event) => (
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
            <p>No featured events at the moment.</p>
          </div>
        )}
      </Section>

      {/* Categories */}
      <Section title="Categories">
        <div className="flex overflow-y-auto scrollbar-none px-4">
          <div className="flex items-stretch gap-4 pb-2">
            {categories.map((category) => (
              <CategoryItem key={category.slug} {...category} />
            ))}
          </div>
        </div>
      </Section>

      {/* Join Community */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
