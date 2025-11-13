import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Brain, MapPin, Sparkles, Star, Wand2, Clock, Music } from 'lucide-react';
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchBar from '@/components/ui/SearchBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AIEventRecommendations from '@/components/events/AIEventRecommendations';
import InfiniteEventCarousel from '@/components/ui/InfiniteEventCarousel';
import EventCard from '@/components/ui/EventCard';
import TicketPurchaseModal from '@/components/events/TicketPurchaseModal';
import CircularGallery from '@/components/ui/CircularGallery';
import { eventService } from '@/lib/event-service';
import { storyService } from '@/lib/story/story-service';
import { forumService } from '@/lib/forum-service';
import type { Event } from '@/types/event.types';
import { format } from 'date-fns';
import { differenceInHours } from 'date-fns';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEventForTickets, setSelectedEventForTickets] = useState<Event | null>(null);
  
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });

  // Fetch stories and forum posts for trending content
  const { data: stories = [] } = useQuery({
    queryKey: ['allStories'],
    queryFn: () => storyService.getAllStories(),
    staleTime: 1000 * 60,
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => forumService.getAllPosts(),
    staleTime: 1000 * 60,
  });

  // Calculate engagement score for content
  const getEngagementScore = (item: { likes_count?: number; comments_count?: number; views_count?: number; created_at: string }) => {
    const likes = item.likes_count || 0;
    const comments = item.comments_count || 0;
    const views = item.views_count || 0;
    const hoursAgo = differenceInHours(new Date(), new Date(item.created_at));
    const recencyBoost = Math.max(0, 24 - hoursAgo) * 0.5; // Boost for recent content
    
    return likes * 2 + comments * 3 + views * 0.5 + recencyBoost;
  };

  // Get trending events from Spotlight content, fallback to featured/upcoming events
  const trendingEvents = useMemo(() => {
    const allContent = [
      ...stories.map(s => ({ ...s, type: 'story' as const })),
      ...forumPosts.map(p => ({ ...p, type: 'forum' as const })),
    ];

    // Get unique event IDs from content with engagement scores
    const eventScores = new Map<number, number>();
    
    allContent.forEach(item => {
      if (item.event_id) {
        const score = getEngagementScore(item);
        const currentScore = eventScores.get(item.event_id) || 0;
        eventScores.set(item.event_id, currentScore + score);
      }
    });

    // Get events sorted by engagement score
    const eventIds = Array.from(eventScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const trendingFromContent = events.filter(event => eventIds.includes(event.id));
    
    // If no trending from content, show featured or upcoming events
    if (trendingFromContent.length === 0) {
      const featured = events.filter(e => e.featured).slice(0, 3);
      if (featured.length > 0) return featured;
      
      // Show upcoming events sorted by date
      const upcoming = [...events]
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
      return upcoming;
    }

    return trendingFromContent;
  }, [stories, forumPosts, events]);

  // Get events with recent posts (last 48 hours)
  const eventsWithRecentPosts = useMemo(() => {
    const recentContent = [
      ...stories.filter(s => differenceInHours(new Date(), new Date(s.created_at)) <= 48),
      ...forumPosts.filter(p => differenceInHours(new Date(), new Date(p.created_at)) <= 48),
    ];

    const eventIds = new Set(
      recentContent
        .filter(item => item.event_id)
        .map(item => item.event_id!)
    );

    return events.filter(event => eventIds.has(event.id));
  }, [stories, forumPosts, events]);
  
  const featuredEvents = useMemo(() => {
    // Prefer events with recent posts, then featured events, then any upcoming events
    if (eventsWithRecentPosts.length > 0) {
      return eventsWithRecentPosts;
    }
    
    const featured = events.filter((event) => event.featured);
    if (featured.length > 0) {
      return featured;
    }
    
    // Fallback to upcoming events
    return events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [eventsWithRecentPosts, events]);

  const filteredEvents = useMemo(() => {
    // Filter upcoming events only
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
    
    if (!selectedCategory) {
      // Show upcoming events sorted by date
      return upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // Filter by category
    return upcomingEvents.filter(
      (event) => event.category?.toLowerCase() === selectedCategory.toLowerCase()
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
        events: events.filter(e => e.category === category),
      })),
    [events]
  );
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };
  
  return (
    <div className="min-h-screen bg-kenya-dark pb-24">
      <section className="relative overflow-hidden">
        {/* Blurred Background Image */}
        <div className="absolute inset-0 -z-10 overflow-hidden" style={{ zIndex: 0 }}>
          <img
            src="/concert-background.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: 'blur(40px)',
              transform: 'scale(1.1)', // Scale up to avoid blur edges
              width: '100%',
              height: '100%',
            }}
            onError={(e) => {
              // Fallback to a gradient if image fails to load
              console.error('Background image failed to load:', e);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          {/* Fallback gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50" />
        </div>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/85 via-black/70 to-black/60" style={{ zIndex: 1 }} />
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 -z-10 bg-gradient-to-t from-kenya-dark to-transparent" style={{ zIndex: 2 }} />
        <div className="container mx-auto px-4 py-16 sm:py-20 relative z-10">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <div className="space-y-3">
                <Badge className="bg-white/10 text-white">Curated for you</Badge>
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  Discover what's happening in Kenya this week.
          </h1>
                <p className="text-lg text-white/70">
                  We combine cultural insight, real-time data, and AI curation to
                  surface events that feel made for you—whether you're attending,
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
                <Card className="border-white/20 bg-black/40 backdrop-blur-sm shadow-none">
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
                <Card className="border-white/20 bg-black/40 backdrop-blur-sm shadow-none">
                  <CardHeader className="space-y-1">
                    <span className="text-sm text-white/60">For creators</span>
                    <CardTitle className="text-2xl text-white">350+</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-white/70">
                    Organizers partnering with WYA to fill venues and manage
                    audiences.
                  </CardContent>
                </Card>
                <Card className="border-white/20 bg-black/40 backdrop-blur-sm shadow-none">
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
              <Card className="flex h-full flex-col justify-between border-white/20 bg-black/40 backdrop-blur-sm p-6 text-white shadow-none">
                <CardHeader>
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                    <Wand2 className="h-4 w-4 text-kenya-orange" />
                    AI feed
                  </span>
                  <CardTitle className="mt-4 text-2xl text-white">
                    Today's picks
                  </CardTitle>
                  <p className="text-sm text-white/65">
                    Based on your vibe and trending moments in Kenya.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/80">
                  {trendingEvents.length > 0 ? (
                    (() => {
                      const featuredEvent = trendingEvents[0];
                      return (
                        <div
                          className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition-all hover:border-kenya-orange/50 hover:bg-black/40"
                          onClick={() => handleEventClick(String(featuredEvent.id))}
                        >
                          {/* Event Image */}
                          {featuredEvent.image_url && (
                            <div className="relative h-48 w-full overflow-hidden">
                              <img
                                src={featuredEvent.image_url}
                                alt={featuredEvent.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <Badge className="absolute top-3 right-3 bg-black/60 text-xs text-white backdrop-blur-sm">
                                {format(new Date(featuredEvent.date), 'MMM d')}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Event Info */}
                          <div className="p-4">
                            <h3 className="mb-2 text-lg font-semibold text-white">
                              {featuredEvent.title}
                            </h3>
                            <div className="space-y-1 text-xs text-white/70">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-white/20 text-white/80">
                                  {featuredEvent.category}
                                </Badge>
                                <span className="text-white/50">•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {featuredEvent.location}
                                </span>
                              </div>
                              {featuredEvent.time && (
                                <div className="flex items-center gap-1 text-white/60">
                                  <Clock className="h-3 w-3" />
                                  <span>{featuredEvent.time.slice(0, 5)}</span>
                                </div>
                              )}
                              {featuredEvent.performing_artists && featuredEvent.performing_artists.length > 0 && (
                                <div className="flex items-center gap-1 text-white/60">
                                  <Music className="h-3 w-3" />
                                  <span className="line-clamp-1">
                                    {featuredEvent.performing_artists.slice(0, 2).join(', ')}
                                    {featuredEvent.performing_artists.length > 2 && ' + more'}
                                  </span>
                                </div>
                              )}
                              {featuredEvent.price !== undefined && (
                                <div className="pt-2 text-sm font-semibold text-kenya-orange">
                                  KSh {featuredEvent.price.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-white/60">
                      <p className="text-sm">No trending events yet</p>
                      <p className="text-xs mt-1">Check back soon for updates</p>
                    </div>
                  )}
          <Button 
                    variant="outline"
                    className="w-full border-white/20 text-white/80 hover:text-white"
                    onClick={() => navigate('/spotlight')}
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
        subtitle="Let WYA's co-pilot surface what matters most. Pull in mood, timing, or attendees and the AI will take it from there."
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
                  "I'm hosting a rooftop mixer for 60 creatives this Friday." WYA
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
        {categories.length > 0 ? (
          <div className="space-y-6">
            {/* Circular Gallery for Categories */}
            <CircularGallery
              items={categories.map((category) => {
                // Get the first event's image for this category, or use a default
                const categoryImage = category.events.length > 0 && category.events[0].image_url
                  ? category.events[0].image_url
                  : null;
                
                // Default category images
                const defaultImages: Record<string, string> = {
                  'Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070',
                  'Technology': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072',
                  'Food': 'https://images.unsplash.com/photo-1529154045759-34c09aed3b73?q=80&w=2070',
                  'Sports': 'https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2070',
                  'Culture': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=2070',
                  'Business': 'https://images.unsplash.com/photo-1676372971824-ed498ef0db5f?q=80&w=2070',
                  'Entertainment': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2070',
                  'Health & Wellness': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2070',
                  'Gaming': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070',
                };
                
                const imageUrl = categoryImage || defaultImages[category.name] || 'https://images.unsplash.com/photo-1433622070098-754fdf81c929?q=80&w=2070';
                
                return {
                  image: imageUrl,
                  text: category.name // Show only category name for cleaner display
                };
              })}
              bend={3}
              textColor="#ffffff"
              borderRadius={0.05}
              font="bold 32px 'Be Vietnam Pro', sans-serif"
              scrollSpeed={2}
              scrollEase={0.05}
              onItemClick={(index, item) => {
                const categoryName = item.text; // Now text is just the category name
                // Navigate to events page filtered by category
                const category = categories.find(cat => cat.name === categoryName);
                if (category && category.events.length > 0) {
                  // Navigate to events page with category filter
                  navigate(`/events?category=${encodeURIComponent(categoryName)}`);
                } else {
                  // If no events, just select the category to show empty state
                  handleCategorySelect(
                    selectedCategory === categoryName ? '' : categoryName
                  );
                }
              }}
            />
            
            {/* Show events for selected category */}
            {selectedCategory && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories
                  .find(cat => cat.name === selectedCategory)
                  ?.events.slice(0, 6)
                  .map((event) => (
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
            )}
          </div>
        ) : (
          <p className="text-center text-white/50">No categories available yet.</p>
        )}
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
              <Card
                key={event.id}
                className="group cursor-pointer border-white/10 bg-white/5 transition hover:border-kenya-orange/50 hover:bg-white/10"
                onClick={() => handleEventClick(String(event.id))}
              >
                {event.image_url && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white">{event.title}</CardTitle>
                      <p className="mt-1 text-sm text-white/70">{event.category}</p>
                    </div>
                    {event.featured && (
                      <Badge className="bg-kenya-orange text-black">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(event.date), 'MMM d, yyyy')}
                      {event.time && ` • ${event.time.slice(0, 5)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  {event.performing_artists && event.performing_artists.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Music className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {event.performing_artists.join(', ')}
                      </span>
                    </div>
                  )}
                  {event.price !== undefined && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-semibold text-white">
                        KSh {event.price.toLocaleString()}
                      </span>
                      <Button 
                        size="sm" 
                        className="bg-kenya-orange hover:bg-kenya-orange/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForTickets(event);
                        }}
                      >
                        Get Tickets
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
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

      {/* Ticket Purchase Modal */}
      <TicketPurchaseModal
        open={!!selectedEventForTickets}
        onClose={() => setSelectedEventForTickets(null)}
        event={selectedEventForTickets}
      />
    </div>
  );
};

export default Home;
