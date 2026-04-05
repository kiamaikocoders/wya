import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import { forumService } from '@/lib/forum-service';
import { eventService } from '@/lib/event-service';
import { notificationService } from '@/lib/notification';
import { supabase } from '@/lib/supabase';
import { playLikeSound } from '@/lib/sounds';
import EventDiscoverSection, { EventDiscoverGroup } from './EventDiscoverSection';
import { DiscoverContent } from './ContentCard';
import { differenceInHours } from 'date-fns';

interface DiscoverFeedProps {
  className?: string;
  onEventClick?: (eventId: number) => void;
  onContentClick?: (contentId: string | number, type: 'story' | 'forum') => void;
  targetContentId?: number;
  /** Called when content has loaded and sections are rendered - use to scroll to top */
  onContentReady?: () => void;
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

const DiscoverFeed: React.FC<DiscoverFeedProps> = ({ className, onEventClick, onContentClick, targetContentId, onContentReady }) => {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['allEvents', 'discover-including-past'],
    queryFn: async () => {
      const result = await eventService.queryEvents({
        search: '',
        category: null,
        location: null,
        tags: [],
        featuredOnly: false,
        startDate: null,
        endDate: null,
        page: 1,
        pageSize: 500,
        sort: 'latest',
        includePast: true,
      });
      return result.events;
    },
    staleTime: 0,
  });

  const { data: forumPosts = [], isLoading: isLoadingForum } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => forumService.getAllPosts(),
    staleTime: 1000 * 60,
  });

  // Fetch ungrouped stories for Community Discover section
  const { data: ungroupedStories = [], isLoading: isLoadingUngroupedStories } = useQuery({
    queryKey: ['ungroupedStories'],
    queryFn: () => storyService.getUngroupedStories(50),
    staleTime: 0,
  });

  // Time-ordered verified stories with an event (no mega .in('event_id', ...) — avoids PostgREST limits and missing new posts).
  const { data: eventStories = [], isLoading: isLoadingEventStories } = useQuery({
    queryKey: ['discoverRecentEventStories'],
    queryFn: () => storyService.getRecentVerifiedEventStoriesForDiscover(600),
    staleTime: 0,
  });

  const storyBackedEventIds = useMemo(() => {
    const ids = eventStories
      .map(s => s.event_id)
      .map(id => (typeof id === 'number' ? id : Number(id)))
      .filter((id): id is number => Number.isFinite(id));
    return [...new Set(ids)];
  }, [eventStories]);

  const forumBackedEventIds = useMemo(() => {
    const ids = forumPosts
      .map(p => p.event_id)
      .map(id => (id == null ? NaN : typeof id === 'number' ? id : Number(id)))
      .filter((id): id is number => Number.isFinite(id));
    return [...new Set(ids)];
  }, [forumPosts]);

  const missingDiscoverEventIds = useMemo(() => {
    const inPage = new Set(events.map(e => e.id).filter((id): id is number => id != null));
    const need = [...new Set([...storyBackedEventIds, ...forumBackedEventIds])];
    return need.filter(id => !inPage.has(id));
  }, [events, storyBackedEventIds, forumBackedEventIds]);

  const { data: discoverExtraEvents = [] } = useQuery({
    queryKey: ['discoverEventsByIds', missingDiscoverEventIds.sort((a, b) => a - b).join(',')],
    queryFn: () => eventService.getEventsByIds(missingDiscoverEventIds),
    enabled: missingDiscoverEventIds.length > 0,
    staleTime: 0,
  });

  const eventsForDiscover = useMemo(() => {
    const byId = new Map<number, (typeof events)[number]>();
    for (const e of events) {
      if (e.id != null) byId.set(e.id, e);
    }
    for (const e of discoverExtraEvents) {
      if (e.id != null && !byId.has(e.id)) byId.set(e.id, e);
    }
    return Array.from(byId.values());
  }, [events, discoverExtraEvents]);

  const isLoadingStories = isLoadingEventStories || isLoadingUngroupedStories;

  // Track active section for scroll snapping
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const hasScrolledToTarget = useRef(false);

  // Combine and transform content
  const allContent = useMemo(() => {
    // Create event map for quick lookup
    const eventMap = new Map<number, { id: number; title: string }>();
    eventsForDiscover.forEach(event => {
      if (event.id) {
        eventMap.set(event.id, {
          id: event.id,
          title: event.title,
        });
      }
    });

    const content: DiscoverContent[] = [
      ...eventStories.map(story => {
        const eventInfo = story.event_id ? eventMap.get(story.event_id) : undefined;
        return {
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
          event_title: eventInfo?.title,
          engagementScore: getEngagementScore(story),
        };
      }),
      ...ungroupedStories.map(story => {
        return {
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
          event_id: undefined,
          event_title: undefined,
          engagementScore: getEngagementScore(story),
        };
      }),
      ...forumPosts.map(post => {
        const eventInfo = post.event_id ? eventMap.get(post.event_id) : undefined;
        return {
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
          event_title: eventInfo?.title,
          engagementScore: getEngagementScore(post),
        };
      }),
    ];

    return content;
  }, [eventStories, ungroupedStories, forumPosts, eventsForDiscover]);


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

    eventsForDiscover.forEach(event => {
      if (event.id) {
        eventMap.set(event.id, {
          id: event.id,
          title: event.title,
          date: event.date,
          end_date: event.end_date ?? undefined,
          location: event.location,
          image_url: event.image_url,
        });
      }
    });

    // Group content by event_id
    const grouped = new Map<number | 'ungrouped', DiscoverContent[]>();

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

    // Convert to EventDiscoverGroup array and sort
    const groups: EventDiscoverGroup[] = Array.from(grouped.entries())
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
              title: 'Community Discover',
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
        
        // If event not found, create placeholder (events may still be loading)
        if (!event) {
          // Try to get event info from the content itself (if available)
          const firstContent = content[0];
          event = {
            id: eventId,
            title: `Event #${eventId}`,
            date: firstContent?.created_at || new Date().toISOString(),
            location: 'Location TBD',
          };
          // Only log warning if events have finished loading
          if (!isLoadingEvents) {
            console.warn(`Event ${eventId} not found in eventMap after events loaded. Events count: ${eventsForDiscover.length}`);
          }
        }

        // Sort content by engagement score, then recency
        const sortedContent = content.sort((a, b) => {
          if ((b.engagementScore || 0) !== (a.engagementScore || 0)) {
            return (b.engagementScore || 0) - (a.engagementScore || 0);
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return {
          event,
          content: sortedContent,
          totalContent: content.length,
        };
      })
      .filter((group): group is EventDiscoverGroup => group !== null && group.content.length > 0)
      .sort((a, b) => {
        // Sort events by most recent content first
        const aLatest = new Date(a.content[0]?.created_at || 0).getTime();
        const bLatest = new Date(b.content[0]?.created_at || 0).getTime();
        return bLatest - aLatest;
      });

    return groups;
  }, [allContent, eventsForDiscover, isLoadingEvents]);

  // Find target content and scroll to it
  useEffect(() => {
    if (!targetContentId || hasScrolledToTarget.current || eventGroups.length === 0 || isLoadingStories || isLoadingForum) return;

    // Find which event group contains the target content
    let targetGroupIndex = -1;
    let targetContentIndex = -1;

    for (let i = 0; i < eventGroups.length; i++) {
      const group = eventGroups[i];
      const contentIndex = group.content.findIndex(c => 
        c.id === targetContentId || String(c.id) === String(targetContentId)
      );
      if (contentIndex !== -1) {
        targetGroupIndex = i;
        targetContentIndex = contentIndex;
        break;
      }
    }

    if (targetGroupIndex !== -1 && sectionsRef.current[targetGroupIndex]) {
      // Scroll to the section containing the target content
      // Use a longer delay to ensure all content is fully rendered
      setTimeout(() => {
        const section = sectionsRef.current[targetGroupIndex];
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          hasScrolledToTarget.current = true;
        }
      }, 500); // Delay to ensure content is rendered
    } else if (targetGroupIndex === -1) {
      // Content not found, mark as scrolled to avoid infinite loops
      hasScrolledToTarget.current = true;
    }
  }, [targetContentId, eventGroups, isLoadingStories, isLoadingForum]);

  // Notify parent when content has loaded so it can scroll to top (start at most recent)
  const hasCalledContentReady = useRef(false);
  useEffect(() => {
    if (
      !onContentReady ||
      targetContentId ||
      isLoadingStories ||
      isLoadingForum ||
      eventGroups.length === 0
    ) {
      return;
    }
    if (hasCalledContentReady.current) return;
    hasCalledContentReady.current = true;

    onContentReady();
    const t1 = requestAnimationFrame(() => onContentReady());
    const t2 = setTimeout(onContentReady, 100);
    const t3 = setTimeout(onContentReady, 400);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onContentReady, targetContentId, isLoadingStories, isLoadingForum, eventGroups.length]);

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

  const handleLike = async (id: string | number) => {
    try {
      // Find the content item to determine its type
      const contentItem = allContent.find(item => item.id === id);
      if (!contentItem) {
        console.error('Content not found for like:', id);
        return;
      }

      // Call appropriate like function based on content type
      if (contentItem.type === 'story') {
        // Check if already liked to determine if we're liking or unliking
        const wasLiked = await storyService.hasUserLikedStory(Number(id));
        
        // storyService.likeStory is a toggle: returns true if liked, false if unliked
        const success = await storyService.likeStory(Number(id));
        
        // Optimistically update the cache immediately
        queryClient.setQueryData(['allStories'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((story: any) => {
            if (story.id === Number(id)) {
              // If success is true, we just liked it (increment)
              // If success is false, we just unliked it (decrement)
              const newCount = success 
                ? (story.likes_count || 0) + 1
                : Math.max((story.likes_count || 0) - 1, 0);
              return { ...story, likes_count: newCount };
            }
            return story;
          });
        });
        
        // Invalidate to refetch and sync with database
        queryClient.invalidateQueries({ queryKey: ['allStories'], refetchType: 'active' });
        
        // Only send notification if it was a new like (success === true)
        if (success) {
          playLikeSound();
          await sendLikeNotification(contentItem.user_id, 'story', Number(id), contentItem.title || contentItem.content.slice(0, 50));
        }
      } else if (contentItem.type === 'forum') {
        // forumService.likePost only likes (returns false if already liked)
        const success = await forumService.likePost(Number(id));
        if (success) {
          // Optimistically update the cache for forum posts
          queryClient.setQueryData(['forumPosts'], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((post: any) => 
              post.id === Number(id) 
                ? { ...post, likes_count: (post.likes_count || 0) + 1 }
                : post
            );
          });
          
          // Invalidate to refetch and ensure correct count
          queryClient.invalidateQueries({ queryKey: ['forumPosts'], refetchType: 'active' });
          
          // Send notification to content creator
          playLikeSound();
          await sendLikeNotification(contentItem.user_id, 'forum_post', Number(id), contentItem.title || contentItem.content.slice(0, 50));
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  // Helper function to send like notification
  const sendLikeNotification = async (
    creatorUserId: string,
    resourceType: string,
    resourceId: number,
    contentTitle: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === creatorUserId) {
        // Don't send notification if user is liking their own content
        return;
      }

      // Get liker's name
      const { data: likerProfile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

      const likerName = likerProfile?.full_name || likerProfile?.username || 'Someone';

      // Use database function to create notification (bypasses RLS)
      const { error } = await supabase.rpc('create_like_notification', {
        p_user_id: creatorUserId,
        p_type: 'system',
        p_title: 'New Like',
        p_message: `${likerName} liked your ${resourceType === 'story' ? 'story' : 'post'}: "${contentTitle.slice(0, 50)}${contentTitle.length > 50 ? '...' : ''}"`,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_link: resourceType === 'story' ? `/stories/${resourceId}` : `/forum/${resourceId}`,
        p_data: null,
      });

      if (error) {
        console.error('Error sending like notification:', error);
      }
    } catch (error) {
      console.error('Error sending like notification:', error);
      // Don't fail the like operation if notification fails
    }
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
    const storiesCount = eventStories.length + ungroupedStories.length;
    console.log('Discover Feed Debug:', {
      storiesCount,
      forumPostsCount: forumPosts.length,
      eventsCount: eventsForDiscover.length,
      allContentCount: allContent.length,
      eventGroupsCount: eventGroups.length,
      eventGroups: eventGroups.map(g => ({
        eventTitle: g.event.title,
        contentCount: g.content.length,
        totalContent: g.totalContent,
      })),
    });
  }, [eventStories.length, ungroupedStories.length, forumPosts.length, eventsForDiscover.length, allContent.length, eventGroups.length]);

  if (isLoadingStories || isLoadingForum) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-white/70">
          <p className="text-sm uppercase tracking-[0.3em] text-gradient-orange-accent">Loading Discover</p>
          <h2 className="mt-3 text-2xl font-semibold">Gathering the latest vibes...</h2>
        </div>
      </div>
    );
  }

  if (eventGroups.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center text-white/70">
        <p className="text-sm uppercase tracking-[0.3em] text-gradient-orange-accent">Discover</p>
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
      {/* Header removed - using transparent header in DiscoverPage instead */}
      {/* Event Sections with Scroll Snapping - TikTok style */}
      <div className="space-y-0">
        {eventGroups.map((eventGroup, index) => {
          // Find if this group contains the target content
          const targetContentIndex = targetContentId 
            ? eventGroup.content.findIndex(c => 
                c.id === targetContentId || String(c.id) === String(targetContentId)
              )
            : -1;
          const initialIndex = targetContentIndex !== -1 ? targetContentIndex : 0;

          return (
            <div
              key={eventGroup.event.id}
              ref={(el) => {
                sectionsRef.current[index] = el;
              }}
              className="snap-start snap-always"
            >
              <EventDiscoverSection
                eventGroup={eventGroup}
                isActive={activeSectionIndex === index}
                initialContentIndex={targetContentIndex !== -1 ? initialIndex : undefined}
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
          );
        })}
      </div>
    </div>
  );
};

export default DiscoverFeed;

