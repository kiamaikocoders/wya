import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import { forumService } from '@/lib/forum-service';
import { eventService } from '@/lib/event-service';
import EventSpotlightSection, { EventSpotlightGroup } from './EventSpotlightSection';
import { SpotlightContent } from './ContentCard';
import { differenceInHours } from 'date-fns';

interface SpotlightFeedProps {
  className?: string;
  onEventClick?: (eventId: number) => void;
  onContentClick?: (contentId: string | number, type: 'story' | 'forum') => void;
}

const getEngagementScore = (item: {
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  created_at: string;
}) => {
  const likes = item.likes_count || 0;
  const comments = item.comments_count || 0;
  const views = item.views_count || 0;
  const hoursAgo = differenceInHours(new Date(), new Date(item.created_at));
  const recencyBoost = Math.max(0, 24 - hoursAgo) * 0.5;
  
  return likes * 2 + comments * 3 + views * 0.5 + recencyBoost;
};

const SpotlightFeed: React.FC<SpotlightFeedProps> = ({ className, onEventClick, onContentClick }) => {
  const { data: stories = [], isLoading: isLoadingStories } = useQuery({
    queryKey: ['allStories'],
    queryFn: () => storyService.getAllStories(),
    staleTime: 1000 * 60,
  });

  const { data: forumPosts = [], isLoading: isLoadingForum } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => forumService.getAllPosts(),
    staleTime: 1000 * 60,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => eventService.getAllEvents(),
    staleTime: 1000 * 60 * 5,
  });

  // Track active section for scroll snapping
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Combine and transform content
  const allContent = useMemo(() => {
    const content: SpotlightContent[] = [
      ...stories.map(story => ({
        id: story.id,
        type: 'story' as const,
        title: story.caption || story.content.slice(0, 70),
        content: story.content,
        media_url: story.media_url,
        media_type: story.media_type || 'image',
        user_id: story.user_id,
        user_name: story.user_name || 'Anonymous',
        user_image: story.user_image,
        created_at: story.created_at,
        likes_count: story.likes_count || 0,
        comments_count: story.comments_count || 0,
        views_count: 0,
        event_id: story.event_id,
        engagementScore: getEngagementScore(story),
      })),
      ...forumPosts.map(post => ({
        id: post.id,
        type: 'forum' as const,
        title: post.title || post.content.slice(0, 70),
        content: post.content,
        media_url: post.media_url,
        media_type: 'image',
        user_id: post.user_id,
        user_name: post.user?.username || post.user?.name || post.user_name || 'Anonymous',
        user_image: post.user?.avatar_url || post.user_image,
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        views_count: post.views_count || 0,
        event_id: post.event_id,
        engagementScore: getEngagementScore(post),
      })),
    ];

    return content;
  }, [stories, forumPosts]);

  // Group content by event
  const eventGroups = useMemo(() => {
    // Create event map
    const eventMap = new Map<number, {
      id: number;
      title: string;
      date: string;
      location: string;
      image_url?: string;
    }>();

    events.forEach(event => {
      if (event.id) {
        eventMap.set(event.id, {
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          image_url: event.image_url,
        });
      }
    });

    // Group content by event_id
    const grouped = new Map<number | 'ungrouped', SpotlightContent[]>();

    allContent.forEach(item => {
      // Always include content, whether it has event_id or not
      if (item.event_id) {
        // Content with event_id - group by event
        if (!grouped.has(item.event_id)) {
          grouped.set(item.event_id, []);
        }
        grouped.get(item.event_id)!.push(item);
      } else {
        // Content without event_id - group as "ungrouped"
        if (!grouped.has('ungrouped')) {
          grouped.set('ungrouped', []);
        }
        grouped.get('ungrouped')!.push(item);
      }
    });

    // Convert to EventSpotlightGroup array and sort
    const groups: EventSpotlightGroup[] = Array.from(grouped.entries())
      .map(([eventIdOrUngrouped, content]) => {
        // Handle ungrouped content (no event_id)
        if (eventIdOrUngrouped === 'ungrouped') {
          // Sort content by engagement score, then recency
          const sortedContent = content.sort((a, b) => {
            if ((b.engagementScore || 0) !== (a.engagementScore || 0)) {
              return (b.engagementScore || 0) - (a.engagementScore || 0);
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          // Limit to top 5 most engaging items initially
          const topContent = sortedContent.slice(0, 5);

          return {
            event: {
              id: 0, // Virtual ID for ungrouped
              title: 'Community Spotlight',
              date: new Date().toISOString(),
              location: 'Various Locations',
            },
            content: topContent,
            totalContent: content.length,
          };
        }

        // Handle content with event_id
        const eventId = eventIdOrUngrouped as number;
        let event = eventMap.get(eventId);
        
        // If event not found, create a placeholder event
        if (!event) {
          // Try to get event info from the content itself (if available)
          const firstContent = content[0];
          event = {
            id: eventId,
            title: `Event #${eventId}`,
            date: firstContent?.created_at || new Date().toISOString(),
            location: 'Location TBD',
          };
        }

        // Sort content by engagement score, then recency
        const sortedContent = content.sort((a, b) => {
          if ((b.engagementScore || 0) !== (a.engagementScore || 0)) {
            return (b.engagementScore || 0) - (a.engagementScore || 0);
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Limit to top 5 most engaging items per event initially
        const topContent = sortedContent.slice(0, 5);

        return {
          event,
          content: topContent,
          totalContent: content.length,
        };
      })
      .filter((group): group is EventSpotlightGroup => group !== null && group.content.length > 0)
      .sort((a, b) => {
        // Sort events by most recent content first
        const aLatest = new Date(a.content[0]?.created_at || 0).getTime();
        const bLatest = new Date(b.content[0]?.created_at || 0).getTime();
        return bLatest - aLatest;
      });

    return groups;
  }, [allContent, events]);

  // Intersection Observer for active section detection
  useEffect(() => {
    const observers = sectionsRef.current.map((section, index) => {
      if (!section) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              setActiveSectionIndex(index);
            }
          });
        },
        {
          threshold: 0.5,
          rootMargin: '-20% 0px -20% 0px',
        }
      );

      observer.observe(section);
      return observer;
    });

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [eventGroups.length]);

  const handleLike = (id: string | number) => {
    // TODO: Implement like functionality
    console.log('Like:', id);
  };

  const handleShare = (id: string | number) => {
    // TODO: Implement share functionality
    console.log('Share:', id);
    if (navigator.share) {
      navigator.share({
        title: 'Check this out on WYA',
        url: window.location.href,
      }).catch(() => {
        // Share failed or cancelled
      });
    }
  };

  // Debug logging (remove in production)
  useEffect(() => {
    console.log('Spotlight Feed Debug:', {
      storiesCount: stories.length,
      forumPostsCount: forumPosts.length,
      eventsCount: events.length,
      allContentCount: allContent.length,
      eventGroupsCount: eventGroups.length,
      eventGroups: eventGroups.map(g => ({
        eventTitle: g.event.title,
        contentCount: g.content.length,
        totalContent: g.totalContent,
      })),
    });
  }, [stories.length, forumPosts.length, events.length, allContent.length, eventGroups.length]);

  if (isLoadingStories || isLoadingForum) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-white/70">
          <p className="text-sm uppercase tracking-[0.3em] text-kenya-orange">Loading Spotlight</p>
          <h2 className="mt-3 text-2xl font-semibold">Gathering the latest vibes...</h2>
        </div>
      </div>
    );
  }

  if (eventGroups.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center text-white/70">
        <p className="text-sm uppercase tracking-[0.3em] text-kenya-orange">Spotlight</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          {allContent.length === 0 
            ? 'No content available yet.' 
            : 'No content to display.'}
        </h2>
        <p className="mt-2 max-w-md text-sm text-white/60">
          {allContent.length === 0
            ? 'Check back soon for recaps, throwbacks, and the next wave of community highlights.'
            : 'Content is being processed. Please refresh the page.'}
        </p>
        {allContent.length > 0 && (
          <p className="mt-4 text-xs text-white/40">
            Found {allContent.length} items but couldn't group them.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-kenya-orange">WYA Spotlight</p>
          <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
            Discover what's trending
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Browse events and explore their stories
          </p>
        </div>
      </div>

      {/* Event Sections with Scroll Snapping */}
      <div className="space-y-0">
        {eventGroups.map((eventGroup, index) => (
          <div
            key={eventGroup.event.id}
            ref={(el) => {
              sectionsRef.current[index] = el;
            }}
            className="snap-start snap-always"
          >
            <EventSpotlightSection
              eventGroup={eventGroup}
              isActive={activeSectionIndex === index}
              onContentChange={(contentIndex) => {
                console.log(`Event ${eventGroup.event.id}, Content ${contentIndex}`);
              }}
              onExpand={(contentId) => {
                const content = eventGroup.content.find(c => c.id === contentId);
                if (content) {
                  onContentClick?.(contentId, content.type);
                }
              }}
              onLike={handleLike}
              onShare={handleShare}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpotlightFeed;

