
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Brain, MapPin, Sparkles, Star, Wand2 } from 'lucide-react';
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchBar from '@/components/ui/SearchBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AIEventRecommendations from '@/components/events/AIEventRecommendations';
import InfiniteEventCarousel from '@/components/ui/InfiniteEventCarousel';
import CategoryItem from '@/components/ui/CategoryItem';
import EventCard from '@/components/ui/EventCard';
import { eventService } from '@/lib/event-service';
import type { Event } from '@/types/event.types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });
  
  const featuredEvents = useMemo(
    () => (events ? events.filter((event) => event.featured) : []),
    [events]
  );

  const filteredEvents = useMemo(() => {
    if (!selectedCategory) return events || [];
    return (
      events?.filter(
        (event) =>
          event.category?.toLowerCase() === selectedCategory.toLowerCase()
      ) || []
    );
  }, [events, selectedCategory]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          events
            ?.map((event) => event.category)
            .filter((category): category is string => Boolean(category)) || []
        )
      ).map((category, index) => ({
        id: index,
        name: category,
        icon: '✨',
      })),
    [events]
  );
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="min-h-screen bg-kenya-dark pb-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/85 via-kenya-brown-dark/70 to-transparent" />
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-kenya-orange/20 blur-3xl" />
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <div className="space-y-3">
                <Badge className="bg-white/10 text-white">Curated for you</Badge>
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  Discover what’s happening in Kenya this week.
          </h1>
                <p className="text-lg text-white/70">
                  We combine cultural insight, real-time data, and AI curation to
                  surface events that feel made for you—whether you’re attending,
                  hosting, or scouting partnerships.
          </p>
              </div>
          
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate('/events')} size="sm">
              Explore Events
            </Button>
            <Button 
              variant="outline" 
                    size="sm"
              onClick={() => navigate('/request-event')}
                  >
                    Launch Request
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/onboarding')}
                    className="border-white/25 text-white/80 hover:text-white"
            >
                    Personalise Feed
            </Button>
            <Button 
                    variant="ghost"
                    size="sm"
              onClick={() => navigate('/ai-assistance')}
                    className="text-white/80 hover:text-white"
            >
                    <Brain className="mr-2 h-4 w-4 text-kenya-orange" />
                    AI Studio
            </Button>
          </div>
        </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="border-white/10 bg-white/5 shadow-none">
                  <CardHeader className="space-y-1">
                    <span className="text-sm text-white/60">Happening now</span>
                    <CardTitle className="text-2xl text-white">
                      {events?.length || 0}+
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-white/70">
                    Live events across Nairobi, Mombasa, Kisumu, Eldoret, and
                    more.
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 shadow-none">
                  <CardHeader className="space-y-1">
                    <span className="text-sm text-white/60">For creators</span>
                    <CardTitle className="text-2xl text-white">350+</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-white/70">
                    Organizers partnering with WYA to fill venues and manage
                    audiences.
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 shadow-none">
                  <CardHeader className="space-y-1">
                    <span className="text-sm text-white/60">Powered by AI</span>
                    <CardTitle className="text-2xl text-white">Smart</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-white/70">
                    Recommendations refresh every morning with cultural cues and
                    community signals.
                  </CardContent>
                </Card>
              </div>
      </div>
      
            <div className="relative hidden h-full md:block">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-kenya-orange/20 via-white/10 to-transparent blur-2xl" />
              <Card className="flex h-full flex-col justify-between border-white/10 bg-white/5 p-6 text-white shadow-none">
                <CardHeader>
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                    <Wand2 className="h-4 w-4 text-kenya-orange" />
                    AI feed
                  </span>
                  <CardTitle className="mt-4 text-2xl text-white">
                    Today’s picks
                  </CardTitle>
                  <p className="text-sm text-white/65">
                    Based on your vibe and trending moments in Kenya.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/80">
                  {featuredEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div>
                        <p className="font-semibold text-white">{event.title}</p>
                        <p className="text-xs text-white/60">
                          {event.category} • {event.location}
                        </p>
                      </div>
                      <Badge className="bg-white/10 text-xs text-white/70">
                        {event.date}
                      </Badge>
          </div>
                  ))}
          <Button 
                    variant="outline"
                    className="w-full border-white/20 text-white/80"
            onClick={() => navigate('/ai-assistance')}
                  >
                    View complete feed
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Section
        title="Personalized Guidance"
        subtitle="Let WYA’s co-pilot surface what matters most. Pull in mood, timing, or attendees and the AI will take it from there."
        action={
          <Button variant="outline" onClick={() => navigate('/ai-assistance')}>
            Explore AI Studio
          </Button>
        }
      >
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-medium text-kenya-orange">
                  <Sparkles className="h-4 w-4" />
                  <span>Smart suggestions</span>
                </div>
                <p className="text-lg text-white/85">
                  “I’m hosting a rooftop mixer for 60 creatives this Friday.” WYA
                  responds with optimal time slots, invite lists, sponsor ideas,
                  and curated playlists—all within a few prompts.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white/70">
                    Match sponsors instantly
                  </Badge>
                  <Badge className="bg-white/10 text-white/70">
                    Collaborative itinerary builder
                  </Badge>
                  <Badge className="bg-white/10 text-white/70">
                    Trend radar alerts
                  </Badge>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <AIEventRecommendations
                  onSelectCategory={handleCategorySelect}
                />
        </div>
      </div>
          </CardContent>
        </Card>
      </Section>
      
      <Section 
        title="Browse by category"
        subtitle="Switch contexts instantly. Pick a lane to filter your feed with one tap."
      >
        <div className="flex snap-x gap-4 overflow-x-auto px-2 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn(
                'min-w-[160px] snap-start rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-left text-white transition hover:border-kenya-orange/60',
                selectedCategory === category.name && 'border-kenya-orange/70 bg-white/10'
              )}
              onClick={() =>
                handleCategorySelect(
                  selectedCategory === category.name ? '' : category.name
                )
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{category.icon}</span>
                {selectedCategory === category.name && (
                  <Star className="h-4 w-4 text-kenya-orange" />
                )}
              </div>
              <p className="mt-4 text-sm font-semibold">{category.name}</p>
              <p className="text-xs text-white/60">
                {events.filter((event) => event.category === category.name)
                  .length || 0}{' '}
                events
              </p>
            </button>
          ))}
        </div>
      </Section>
      
      <Section
        title="Featured highlights"
        subtitle="Hand-picked experiences earning buzz across the community."
        action={
          <Button variant="outline" onClick={() => navigate('/events')}>
            View all featured
          </Button>
        }
      >
        {featuredEvents.length > 0 ? (
            <InfiniteEventCarousel 
            events={featuredEvents.slice(0, 8).map((event) => ({
                id: String(event.id),
                title: event.title,
                category: event.category || '',
                date: event.date,
                location: event.location,
                image_url: event.image_url || '',
                capacity: event.capacity || 100,
                featured: event.featured,
              price: event.price,
              }))}
              emptyMessage="No featured events available."
            slidesToShow={1.1}
            autoScrollSpeed={4200}
            />
        ) : (
          <p className="text-center text-white/50">
            No featured events available yet. Check back soon.
          </p>
        )}
      </Section>
      
      <Section 
        title={selectedCategory ? `${selectedCategory} lineup` : 'Coming up next'}
        subtitle={
          selectedCategory
            ? 'Curated suggestions based on your current focus.'
            : 'Fresh additions across Kenya for your calendar.'
        }
        action={
          <Button variant="outline" onClick={() => navigate('/events')}>
            Explore full calendar
          </Button>
        }
      >
        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-kenya-orange" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.slice(0, 6).map((event) => (
              <EventCard
                key={event.id}
                id={String(event.id)}
                title={event.title}
                category={event.category || 'General'}
                date={event.date}
                location={event.location}
                image={event.image_url || ''}
                capacity={event.capacity || 100}
                event={event as Event}
            />
            ))}
          </div>
        ) : (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-white/70">
              <MapPin className="h-8 w-8 text-kenya-orange" />
              <p>
                {selectedCategory
                  ? `No ${selectedCategory} events available right now.`
                  : 'No upcoming events available.'}
          </p>
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                Reset filters
            </Button>
            </CardContent>
          </Card>
        )}
      </Section>
    </div>
  );
};

export default Home;
