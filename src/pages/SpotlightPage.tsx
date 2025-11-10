import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, format, isAfter, isBefore } from 'date-fns';
import { storyService } from '@/lib/story/story-service';
import { eventService, Event } from '@/lib/event-service';
import { forumService } from '@/lib/forum-service';
import { profileService, type Profile } from '@/lib/profile-service';
import StoryReels from '@/components/spotlight/StoryReels';
import SpotlightHero, { SpotlightHeroItem } from '@/components/spotlight/SpotlightHero';
import SpotlightSection from '@/components/spotlight/SpotlightSection';
import SpotlightMediaCard, { SpotlightMediaItem } from '@/components/spotlight/SpotlightMediaCard';
import SpotlightEventCard, { SpotlightEventItem } from '@/components/spotlight/SpotlightEventCard';
import SpotlightProfileCard from '@/components/spotlight/SpotlightProfileCard';
import SpotlightGuideCard, { SpotlightGuideItem } from '@/components/spotlight/SpotlightGuideCard';
import { Story } from '@/lib/story/types';

type SpotlightContentItem = {
  id: string | number;
  type: 'story' | 'forum';
  title?: string;
  content: string;
  media_url?: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  user_name: string;
  user_image?: string | null;
  event_id?: number | null;
  globalIndex: number;
};

const getEngagementScore = (item: SpotlightContentItem) => {
  return (item.likes_count || 0) * 2 + (item.comments_count || 0) * 3 + (item.views_count || 0) * 0.5;
};

const SpotlightPage = () => {
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);

  const {
    data: stories,
    isLoading: isLoadingStories,
    error: storiesError,
  } = useQuery<Story[]>({
    queryKey: ['allStories'],
    queryFn: () => storyService.getAllStories(),
    staleTime: 1000 * 60,
  });

  const {
    data: events,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery<Event[]>({
    queryKey: ['allEvents'],
    queryFn: () => eventService.getAllEvents(),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: forumPosts,
    isLoading: isLoadingForum,
    error: forumError,
  } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => forumService.getAllPosts(),
    staleTime: 1000 * 60,
  });

  const organizerIds = useMemo(() => {
    if (!events) return [];
    const ids = new Set<string>();
    events.forEach(event => {
      if (event.organizer_id) {
        ids.add(event.organizer_id);
      }
    });
    return Array.from(ids).slice(0, 6);
  }, [events]);

  const allContent = useMemo<SpotlightContentItem[]>(() => {
    const combined: Omit<SpotlightContentItem, 'globalIndex'>[] = [
      ...(stories || []).map(story => ({
        id: story.id,
        type: 'story' as const,
        title: story.caption || story.content.slice(0, 70),
        content: story.content,
        media_url: story.media_url,
        likes_count: story.likes_count || 0,
        comments_count: story.comments_count || 0,
        views_count: 0,
        created_at: story.created_at,
        user_name: story.user_name || 'Anonymous',
        user_image: story.user_image || null,
        event_id: story.event_id,
      })),
      ...(forumPosts || []).map(post => ({
        id: post.id,
        type: 'forum' as const,
        title: post.title || post.content.slice(0, 70),
        content: post.content,
        media_url: post.media_url,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        views_count: post.views_count || 0,
        created_at: post.created_at,
        user_name: post.user?.username || post.user?.name || 'Anonymous',
        user_image: post.user?.avatar_url || null,
        event_id: post.event_id,
      })),
    ];

    return combined
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((item, index) => ({ ...item, globalIndex: index }));
  }, [stories, forumPosts]);

  const {
    data: organizerProfiles,
    isLoading: isLoadingOrganizers,
  } = useQuery<Profile[]>({
    queryKey: ['spotlight', 'organizers', organizerIds],
    queryFn: () => profileService.getProfilesByIds(organizerIds),
    enabled: organizerIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const loading =
    isLoadingStories || isLoadingEvents || isLoadingForum || (organizerIds.length > 0 && isLoadingOrganizers);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kenya-dark">
        <div className="text-center text-white/70">
          <p className="text-sm uppercase tracking-[0.3em] text-kenya-orange">Curating Spotlight</p>
          <h2 className="mt-3 text-2xl font-semibold">Gathering the latest vibes...</h2>
        </div>
      </div>
    );
  }

  if (storiesError || eventsError || forumError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kenya-dark">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-6 text-center text-red-200">
          <h2 className="text-xl font-semibold">We hit a snag loading Spotlight.</h2>
          <p className="mt-2 text-sm">Give it another go in a moment.</p>
        </div>
      </div>
    );
  }

  if (!allContent || allContent.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-kenya-dark text-center text-white/70">
        <p className="text-sm uppercase tracking-[0.3em] text-kenya-orange">Spotlight</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Fresh content is on the way.</h2>
        <p className="mt-2 max-w-md text-sm text-white/60">
          Check back soon for recaps, throwbacks, and the next wave of community highlights.
        </p>
      </div>
    );
  }

  const now = new Date();

  const recaps = allContent.filter(item => differenceInDays(now, new Date(item.created_at)) <= 3).slice(0, 6);
  const throwbacks = allContent.filter(item => differenceInDays(now, new Date(item.created_at)) > 21).slice(0, 6);
  const topMoments = [...allContent].sort((a, b) => getEngagementScore(b) - getEngagementScore(a)).slice(0, 5);
  const communityThreads = [...allContent]
    .filter(item => item.type === 'forum')
    .sort((a, b) => b.comments_count - a.comments_count)
    .slice(0, 4);

  const curatedFlashbacks = throwbacks.slice(0, 3);

  const upcomingEvents = (events || [])
    .filter(event => event.date && isAfter(new Date(event.date), now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const recentEvents = (events || [])
    .filter(event => event.date && isBefore(new Date(event.date), now))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hypeTeasers: SpotlightEventItem[] = upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    location: event.location,
    description: event.description,
    image_url: event.image_url,
    tag: 'Coming Soon',
  }));

  const vibeGuide: SpotlightGuideItem[] = (upcomingEvents.length > 0 ? upcomingEvents : recentEvents.slice(0, 4)).map(
    event => ({
      id: `guide-${event.id}`,
      title: event.title,
      category: event.category || 'Weekend Pick',
      description:
        event.description ||
        `Get the vibe at ${event.location}. Stay tuned for more details from the WYA community.`,
      location: event.location,
    })
  );

  const heroItems: SpotlightHeroItem[] = topMoments.slice(0, 3).map(item => ({
    id: item.id,
    tag: item.type === 'forum' ? 'Top Thread' : 'Top Moment',
    title: item.title || (item.type === 'forum' ? 'Community Highlight' : 'Story Highlight'),
    description: item.content,
    media_url: item.media_url,
    user_name: item.user_name,
    created_at: item.created_at,
    globalIndex: item.globalIndex,
  }));

  const organizerHighlights =
    organizerProfiles && events
      ? organizerProfiles.slice(0, 4).map(profile => {
          const hostedEvents = events.filter(event => event.organizer_id === profile.id);
          const nextEvent = hostedEvents
            .filter(event => event.date && isAfter(new Date(event.date), now))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

          const headline = nextEvent ? "This Month's Top Host" : 'Community Host';
          const highlight = nextEvent
            ? `Up next: ${nextEvent.title} on ${format(new Date(nextEvent.date), 'MMM d')} @ ${nextEvent.location}`
            : hostedEvents.length > 0
            ? `Hosted ${hostedEvents.length} ${hostedEvents.length === 1 ? 'event' : 'events'} with WYA.`
            : 'Stay tuned for their next drop.';

          return { profile, headline, highlight };
        })
      : [];

  const venueInsights = events
    ? Array.from(
        events.reduce<Map<string, Event[]>>((acc, event) => {
          if (event.location) {
            const key = event.location.trim();
            if (!acc.has(key)) {
              acc.set(key, []);
            }
            acc.get(key)!.push(event);
          }
          return acc;
        }, new Map()).entries()
      )
    : [];

  const venueCards: SpotlightGuideItem[] = venueInsights.map(([location, groupedEvents]) => ({
    id: `venue-${location}`,
    title: location,
    category: 'Venue of the Week',
    description:
      groupedEvents[0]?.description ||
      `A go-to spot for ${groupedEvents.length} ${groupedEvents.length === 1 ? 'event' : 'events'} this season.`,
    location,
  })).slice(0, 4);

  const handleOpenReel = (index: number) => {
    setActiveReelIndex(index);
  };

  const handleCloseReels = () => {
    setActiveReelIndex(null);
  };

  const renderMediaRow = (items: SpotlightContentItem[], tag?: string, accent?: string) => {
    if (!items || items.length === 0) return null;

    const mediaItems: SpotlightMediaItem[] = items.map(item => ({
      id: `${item.type}-${item.id}`,
      title: item.title,
      content: item.content,
      media_url: item.media_url,
      user_name: item.user_name,
      user_image: item.user_image,
      created_at: item.created_at,
      likes_count: item.likes_count,
      comments_count: item.comments_count,
      views_count: item.views_count,
      tag,
      accentClassName: accent,
      onClick: () => handleOpenReel(item.globalIndex),
    }));

    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {mediaItems.map(item => (
          <SpotlightMediaCard key={item.id} item={item} className="min-w-[260px] max-w-[280px]" />
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-kenya-dark">
      {activeReelIndex !== null && (
        <div className="fixed inset-0 z-50">
          <StoryReels stories={allContent} initialIndex={activeReelIndex} onClose={handleCloseReels} className="h-full" />
        </div>
      )}

      <div className="relative z-10">
        <div className="container mx-auto flex flex-col gap-16 px-4 py-12 md:px-8">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-kenya-orange">WYA Spotlight</p>
            <h1 className="text-4xl font-semibold text-white md:text-5xl">Inside the Afterparty</h1>
            <p className="max-w-2xl text-sm text-white/70 md:text-base">
              Recaps, throwbacks, top moments, and the next things popping off — curated to keep WYA buzzing even on
              slower weeks.
            </p>
          </header>

          {heroItems.length > 0 && (
            <SpotlightHero items={heroItems} onSelect={handleOpenReel} className="mt-6" />
          )}

          {recaps.length > 0 && (
            <SpotlightSection
              title="What Went Down Last Night"
              subtitle="Fresh recaps from events that just wrapped — tap through to feel the afterglow."
            >
              {renderMediaRow(recaps, 'Just Ended', 'bg-kenya-orange/80 text-black')}
            </SpotlightSection>
          )}

          <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-12">
              {throwbacks.length > 0 && (
                <SpotlightSection
                  title="Flashback Vibes"
                  subtitle="Throwback stories from the community to keep the energy moving."
                >
                  {renderMediaRow(throwbacks, 'Flashback', 'bg-white/80 text-black')}
                </SpotlightSection>
              )}

              {topMoments.length > 0 && (
                <SpotlightSection
                  title="Top Moments"
                  subtitle="Auto-curated by the community — the clips everyone keeps replaying."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    {topMoments.map(item => (
                      <SpotlightMediaCard
                        key={`top-${item.type}-${item.id}`}
                        item={{
                          id: item.id,
                          title: item.title,
                          content: item.content,
                          media_url: item.media_url,
                          user_name: item.user_name,
                          user_image: item.user_image,
                          created_at: item.created_at,
                          likes_count: item.likes_count,
                          comments_count: item.comments_count,
                          views_count: item.views_count,
                          tag: 'Top 10',
                          accentClassName: 'bg-kenya-brown-light/90 text-black',
                          onClick: () => handleOpenReel(item.globalIndex),
                        }}
                        className="h-full"
                      />
                    ))}
                  </div>
                </SpotlightSection>
              )}

              {communityThreads.length > 0 && (
                <SpotlightSection
                  title="Community Threads"
                  subtitle="Keep the conversation going with polls, plans, and post-event chatter."
                >
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {communityThreads.map(thread => (
                      <SpotlightMediaCard
                        key={`thread-${thread.id}`}
                        item={{
                          id: thread.id,
                          title: thread.title,
                          content: thread.content,
                          media_url: thread.media_url,
                          user_name: thread.user_name,
                          user_image: thread.user_image,
                          created_at: thread.created_at,
                          likes_count: thread.likes_count,
                          comments_count: thread.comments_count,
                          views_count: thread.views_count,
                          tag: thread.title?.includes('?') ? "What's Next" : 'Community Chat',
                          accentClassName: 'bg-kenya-orange/70 text-black',
                          onClick: () => handleOpenReel(thread.globalIndex),
                        }}
                        className="min-w-[260px] max-w-[280px]"
                      />
                    ))}
                  </div>
                </SpotlightSection>
              )}
            </div>

            <aside className="space-y-12">
              {hypeTeasers.length > 0 && (
                <SpotlightSection
                  title="Hype in the Works"
                  subtitle="Sneak peeks and teasers before the RSVP links go live."
                >
                  <div className="flex flex-col gap-4">
                    {hypeTeasers.map(event => (
                      <SpotlightEventCard key={event.id} item={event} />
                    ))}
                  </div>
                </SpotlightSection>
              )}

              {organizerHighlights.length > 0 && (
                <SpotlightSection
                  title="Featured Hosts"
                  subtitle="Faces behind the vibes — even when the calendar is quiet."
                >
                  <div className="flex flex-col gap-4">
                    {organizerHighlights.map(({ profile, headline, highlight }) => (
                      <SpotlightProfileCard
                        key={profile.id}
                        profile={profile}
                        headline={headline}
                        highlight={highlight}
                      />
                    ))}
                  </div>
                </SpotlightSection>
              )}
            </aside>
          </div>

          {curatedFlashbacks.length > 0 && (
            <SpotlightSection
              title="Curated from Last Month"
              subtitle="Hand-picked throwbacks and partner drops to keep the feed flowing."
              id="curated"
            >
              {renderMediaRow(curatedFlashbacks, 'Curated', 'bg-white/60 text-black')}
            </SpotlightSection>
          )}

          {(vibeGuide.length > 0 || venueCards.length > 0) && (
            <SpotlightSection
              title="Vibe Guide"
              subtitle="Local tips, trending hangouts, and culture hits to keep your week busy."
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {vibeGuide.map(item => (
                  <SpotlightGuideCard key={item.id} item={item} />
                ))}
                {venueCards.map(item => (
                  <SpotlightGuideCard key={item.id} item={item} />
                ))}
              </div>
            </SpotlightSection>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotlightPage;