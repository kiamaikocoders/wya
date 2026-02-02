import React, { useMemo, useState, useEffect } from 'react';
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
import OnboardingReminders from '@/components/onboarding/OnboardingReminders';
import { eventService } from '@/lib/event-service';
import { storyService } from '@/lib/story/story-service';
import { forumService } from '@/lib/forum-service';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingNotifications } from '@/lib/onboarding-notifications';
import { onboardingService } from '@/lib/onboarding-service';
import type { Event } from '@/types/event.types';
import { format } from 'date-fns';
import { differenceInHours } from 'date-fns';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEventForTickets, setSelectedEventForTickets] = useState<Event | null>(null);

  // Redirect new users to onboarding wizard before showing Home
  const { data: onboardingPreferences, isLoading: onboardingLoading } = useQuery({
    queryKey: ['onboardingPreferences'],
    queryFn: onboardingService.getPreferences,
    enabled: isAuthenticated && !!user?.id,
  });

  useEffect(() => {
    if (!onboardingLoading && isAuthenticated && onboardingPreferences === null && user?.id) {
      navigate('/onboarding', { replace: true });
    }
  }, [onboardingLoading, isAuthenticated, onboardingPreferences, user?.id, navigate]);

  // Show loader while checking onboarding or redirecting new users
  const needsOnboarding = isAuthenticated && user?.id && (onboardingLoading || onboardingPreferences === null);
  if (needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }

  // Check for nearby events when user has location
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Check for nearby events after 3 seconds
      const timer = setTimeout(() => {
        onboardingNotifications.sendNearbyEventsNotification(user.id);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id]);
  
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['homeFeedEvents'],
    queryFn: () => eventService.getHomeFeedEvents(60),
  });

  // Fetch stories and forum posts for trending content
  const { data: stories = [] } = useQuery({
    queryKey: ['homeStories'],
    queryFn: () => storyService.getAllStories(undefined, 60),
    staleTime: 1000 * 60,
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['homeForumPosts'],
    queryFn: () => forumService.getAllPosts(60),
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

  // Get trending events from Discover content, fallback to featured/upcoming events
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
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background pb-24">
      {/* Onboarding Reminders */}
      {isAuthenticated && <OnboardingReminders />}
      <section className="relative overflow-hidden">
        {/* Hero gradient background - matches reference design exactly */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-indigo-50 via-purple-50/30 to-violet-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950" />
        {/* Subtle glow effect */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_45%)] dark:bg-subtle-glow" />
        <div className="container mx-auto min-w-0 max-w-full px-4 py-8 sm:py-12 md:py-16 relative z-10">
          <div className="space-y-8 min-w-0">
            {/* Mobile AI Feed - Shows FIRST on mobile, hidden on desktop */}
            <div className="block md:hidden">
              <Card className="border-border bg-card p-6 shadow-sm">
                <CardHeader>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <Wand2 className="h-4 w-4 text-primary" />
                    AI feed
                  </span>
                  <CardTitle className="mt-4 text-xl">
                    Today's picks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Based on your vibe and trending moments in Kenya.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  {trendingEvents.length > 0 ? (
                    (() => {
                      const featuredEvent = trendingEvents[0];
                      return (
                        <div
                          className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted/50 hover:bg-muted transition-all hover:border-primary/30"
                          onClick={() => handleEventClick(String(featuredEvent.id))}
                        >
                          {/* Event Image */}
                          {featuredEvent.image_url && (
                            <div className="relative h-40 w-full overflow-hidden">
                              <img
                                src={featuredEvent.image_url}
                                alt={featuredEvent.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-active:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                              <Badge className="absolute top-3 right-3 bg-background/90 text-xs backdrop-blur-sm border border-border">
                                {format(new Date(featuredEvent.date), 'MMM d')}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Event Info */}
                          <div className="p-4">
                            <h3 className="mb-2 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {featuredEvent.title}
                            </h3>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] font-medium">
                                  {featuredEvent.category}
                                </Badge>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {featuredEvent.location}
                                </span>
                              </div>
                              {featuredEvent.time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{featuredEvent.time.slice(0, 5)}</span>
                                </div>
                              )}
                              {featuredEvent.performing_artists && featuredEvent.performing_artists.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Music className="h-3 w-3" />
                                  <span className="line-clamp-1">
                                    {featuredEvent.performing_artists.slice(0, 2).join(', ')}
                                    {featuredEvent.performing_artists.length > 2 && ' + more'}
                                  </span>
                                </div>
                              )}
                              {featuredEvent.price !== undefined && (
                                <div className="pt-2 text-sm font-semibold text-primary">
                                  KSh {featuredEvent.price.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="rounded-2xl border border-border bg-muted/50 p-4 text-center text-muted-foreground">
                      <p className="text-sm">No trending events yet</p>
                      <p className="text-xs mt-1">Check back soon for updates</p>
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    className="w-full touch-target"
                    onClick={() => navigate('/discover')}
                  >
                    View complete feed
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid - Desktop shows 2 columns, mobile stacks */}
            <div className="grid min-w-0 items-start gap-8 md:gap-10 md:grid-cols-[1.2fr_0.8fr]">
              {/* Left Column - Main Content */}
              <div className="min-w-0 space-y-6 md:space-y-8">
                <div className="space-y-5 min-w-0">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Curated for you</Badge>
                  <h1 className="break-words text-2xl font-display font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl tracking-tight">
                    Discover what's happening in <span className="text-gradient">Kenya</span> this week.
                  </h1>
                  <p className="text-base text-muted-foreground sm:text-lg leading-relaxed">
                    We combine cultural insight, real-time data, and AI curation to
                    surface events that feel made for you—whether you're attending,
                    hosting, or scouting partnerships.
                  </p>
                </div>
            
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="w-full min-w-0">
                    <SearchBar onSearch={handleSearch} />
                  </div>
                  <div className="relative min-w-0 px-1">
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-background to-transparent" aria-hidden />
                    <div className="flex gap-2 overflow-x-auto scroll-smooth pb-1 pl-0 pr-6 scrollbar-hide snap-x snap-mandatory [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
                      <Button onClick={() => navigate('/events')} size="sm" className="touch-target shrink-0 snap-start bg-primary text-primary-foreground hover:bg-primary/90 shadow-md whitespace-nowrap">
                        Explore Events
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/request-event')}
                        className="touch-target shrink-0 snap-start whitespace-nowrap"
                      >
                        Host an Event
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/onboarding')}
                        className="touch-target shrink-0 snap-start whitespace-nowrap"
                      >
                        Personalise Feed
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/ai-assistance')}
                        className="touch-target shrink-0 snap-start whitespace-nowrap"
                      >
                        <Brain className="mr-2 h-4 w-4 shrink-0 text-accent" />
                        <span className="hidden sm:inline">AI Studio</span>
                        <span className="sm:hidden">AI</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/events')}
                      className="group flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-sm font-medium text-muted-foreground">Live now</span>
                      <span className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">{events?.length || 0}+</span>
                      <span className="mt-1 text-xs text-muted-foreground leading-snug">Nairobi, Mombasa, Kisumu & more</span>
                    </button>
                    <div className="flex flex-col items-start rounded-xl border border-border bg-card p-4 shadow-sm">
                      <span className="text-sm font-medium text-muted-foreground">For creators</span>
                      <span className="text-2xl font-display font-bold text-foreground">350+</span>
                      <span className="mt-1 text-xs text-muted-foreground leading-snug">Organizers on WYA</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-primary" aria-hidden />
                      <h2 className="text-sm font-semibold text-foreground">Recommended for you</h2>
                    </div>
                    {trendingEvents.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 [scrollbar-width:none]">
                        {trendingEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => handleEventClick(String(event.id))}
                            className="group flex shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/50 text-left transition-all hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {event.image_url ? (
                              <div className="relative h-24 w-28 overflow-hidden sm:h-28 sm:w-32">
                                <img src={event.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                                <Badge className="absolute top-1.5 right-1.5 bg-background/90 text-[10px] backdrop-blur-sm border border-border">
                                  {format(new Date(event.date), 'MMM d')}
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex h-24 w-28 items-center justify-center bg-muted sm:h-28 sm:w-32">
                                <Music className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="p-2">
                              <span className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary transition-colors">{event.title}</span>
                              {event.location && <span className="mt-0.5 block text-[10px] text-muted-foreground truncate">{event.location}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Recommendations refresh every morning. Check back soon.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Desktop AI Feed Sidebar */}
              <div className="hidden md:block relative h-full">
                <Card className="flex h-full flex-col justify-between border-border bg-card shadow-xl p-6 sticky top-24">
                  <CardHeader>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      <Wand2 className="h-3 w-3 text-primary" />
                      AI feed
                    </span>
                    <CardTitle className="mt-4 text-2xl font-display font-bold">
                      Today's picks
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Based on your vibe and trending moments in Kenya.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {trendingEvents.length > 0 ? (
                      (() => {
                        const featuredEvent = trendingEvents[0];
                        return (
                          <div
                            className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted/50 hover:bg-muted transition-all hover:border-primary/30"
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
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                                <Badge className="absolute top-3 right-3 bg-background/90 text-xs backdrop-blur-sm border border-border">
                                  {format(new Date(featuredEvent.date), 'MMM d')}
                                </Badge>
                              </div>
                            )}
                            
                            {/* Event Info */}
                            <div className="p-4">
                              <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                {featuredEvent.title}
                              </h3>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] font-medium">
                                    {featuredEvent.category}
                                  </Badge>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {featuredEvent.location}
                                  </span>
                                </div>
                                {featuredEvent.time && (
                                  <div className="flex items-center gap-1">
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
                      <div className="rounded-2xl border border-border bg-muted/50 p-4 text-center text-muted-foreground">
                        <p className="text-sm">No trending events yet</p>
                        <p className="text-xs mt-1">Check back soon for updates</p>
                      </div>
                    )}
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/discover')}
                    >
                      View complete feed
                    </Button>
                  </CardContent>
                </Card>
              </div>
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
        <div className="min-w-0 overflow-hidden rounded-3xl bg-white/5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2)] backdrop-blur">
          <div className="min-w-0 overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid min-w-0 gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="min-w-0 space-y-4 overflow-hidden sm:space-y-5">
                <div className="flex items-center gap-2 text-sm font-medium text-kenya-orange">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Smart suggestions</span>
                </div>
                <p className="max-w-full break-words text-sm leading-relaxed text-white/85 sm:text-base sm:leading-relaxed">
                  "I'm hosting a rooftop mixer for 60 creatives this Friday." WYA
                  responds with optimal time slots, invite lists, sponsor ideas,
                  and curated playlists—all within a few prompts.
                </p>
                <div className="flex w-full min-w-0 flex-wrap gap-3 pt-1">
                  <Badge className="min-w-0 max-w-full shrink bg-white/10 px-3 py-1.5 text-white/70 text-xs whitespace-normal break-words">
                    Match sponsors instantly
                  </Badge>
                  <Badge className="min-w-0 max-w-full shrink bg-white/10 px-3 py-1.5 text-white/70 text-xs whitespace-normal break-words">
                    Collaborative itinerary builder
                  </Badge>
                  <Badge className="min-w-0 max-w-full shrink bg-white/10 px-3 py-1.5 text-white/70 text-xs whitespace-normal break-words">
                    Trend radar alerts
                  </Badge>
                </div>
              </div>
              <div className="min-w-0 rounded-2xl bg-black/20 px-5 py-5 sm:rounded-3xl sm:px-6 sm:py-6">
                <AIEventRecommendations
                  embedded
                  onSelectCategory={handleCategorySelect}
                />
              </div>
            </div>
          </div>
        </div>
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
