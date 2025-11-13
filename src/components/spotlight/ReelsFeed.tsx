import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import { forumService } from '@/lib/forum-service';
import { eventService } from '@/lib/event-service';
import ReelItem from './ReelItem';
import { differenceInHours } from 'date-fns';

interface ReelsFeedProps {
  className?: string;
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

const ReelsFeed: React.FC<ReelsFeedProps> = ({ className }) => {
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

  // Combine and sort content by engagement
  const feedContent = useMemo(() => {
    const allContent = [
      ...stories.map(story => ({
        id: story.id,
        type: 'story' as const,
        title: story.caption || story.content.slice(0, 70),
        content: story.content,
        media_url: story.media_url,
        media_type: story.media_type || 'image',
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

    // Sort by engagement score, then by recency
    return allContent.sort((a, b) => {
      if (b.engagementScore !== a.engagementScore) {
        return b.engagementScore - a.engagementScore;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [stories, forumPosts]);

  // Create event map for quick lookup
  const eventMap = useMemo(() => {
    const map = new Map<number, { title: string }>();
    events.forEach(event => {
      if (event.id) {
        map.set(event.id, { title: event.title });
      }
    });
    return map;
  }, [events]);

  const handleLike = (id: string | number) => {
    // TODO: Implement like functionality
    console.log('Like:', id);
  };

  const handleShare = (id: string | number) => {
    // TODO: Implement share functionality
    console.log('Share:', id);
  };

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

  if (feedContent.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center text-white/70">
        <p className="text-sm uppercase tracking-[0.3em] text-kenya-orange">Spotlight</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Fresh content is on the way.</h2>
        <p className="mt-2 max-w-md text-sm text-white/60">
          Check back soon for recaps, throwbacks, and the next wave of community highlights.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-kenya-orange">WYA Spotlight</p>
          <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
            Discover what's trending
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Scroll through the latest posts and stories from the community
          </p>
        </div>

        <div className="space-y-6">
          {feedContent.map((item) => {
            const eventInfo = item.event_id ? eventMap.get(item.event_id) : undefined;
            
            return (
              <ReelItem
                key={`${item.type}-${item.id}`}
                id={item.id}
                type={item.type}
                title={item.title}
                content={item.content}
                media_url={item.media_url}
                media_type={item.media_type}
                user_name={item.user_name}
                user_image={item.user_image}
                created_at={item.created_at}
                likes_count={item.likes_count}
                comments_count={item.comments_count}
                views_count={item.views_count}
                event_id={item.event_id}
                event_title={eventInfo?.title}
                onLike={handleLike}
                onShare={handleShare}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReelsFeed;

