import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { followService } from '@/lib/follow';
import { storyService } from '@/lib/story/story-service';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface FriendActivity {
  id: string | number;
  user_id: string;
  user_name: string;
  user_image?: string;
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  event_id?: number;
  event_title?: string;
}

const FriendActivitiesCarousel: React.FC = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Get following users
  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => followService.getFollowing(user?.id || ''),
    enabled: !!user?.id,
  });

  // Get all stories/posts from following users
  const { data: friendActivities = [] } = useQuery({
    queryKey: ['friendActivities', following],
    queryFn: async () => {
      if (!following.length) return [];
      
      const allStories = await storyService.getAllStories();
      const friendStories = allStories.filter(story => 
        following.includes(story.user_id)
      ).slice(0, 10); // Limit to 10 most recent

      return friendStories.map(story => ({
        id: story.id,
        user_id: story.user_id,
        user_name: story.user_name || 'Friend',
        user_image: story.user_image,
        content: story.content,
        media_url: story.media_url,
        media_type: story.media_type,
        created_at: story.created_at,
        event_id: story.event_id,
      })) as FriendActivity[];
    },
    enabled: following.length > 0,
  });

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - startX;
    scrollRef.current.scrollLeft = scrollLeft - x;
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!friendActivities.length) {
    return null; // Don't show section if no friend activities
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4 px-2" style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}>Friend Activities</h2>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {friendActivities.map((activity) => (
            <Card
              key={activity.id}
              className="min-w-[280px] max-w-[280px] bg-[#1A1A1A] border border-white/8 overflow-hidden flex-shrink-0 rounded-xl shadow-lg hover:border-white/15 transition-all hover:shadow-xl"
            >
              <Link to={`/spotlight/${activity.id}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {activity.media_url ? (
                    activity.media_type === 'video' ? (
                      <video
                        src={activity.media_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={activity.media_url}
                        alt={activity.content}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <p className="text-white/70 text-sm p-4 line-clamp-3">
                        {activity.content}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.user_image} />
                      <AvatarFallback className="text-xs">
                        {activity.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.user_name}
                      </p>
                      {activity.event_title && (
                        <p className="text-xs text-white/60 truncate">
                          {activity.event_title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(activity.created_at), 'MMM d')}
                    </span>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
        
        {friendActivities.length > 2 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white border border-white/10 rounded-full h-10 w-10 backdrop-blur-sm shadow-lg"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white border border-white/10 rounded-full h-10 w-10 backdrop-blur-sm shadow-lg"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FriendActivitiesCarousel;
