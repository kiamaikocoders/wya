import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import { useAuth } from '@/contexts/AuthContext';
import { followService } from '@/lib/follow';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const RecentUpdatesSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Get recent posts from friends
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['recentFriendPosts', following],
    queryFn: async () => {
      if (!following.length) return [];
      
      const allStories = await storyService.getAllStories();
      const friendStories = allStories
        .filter(story => following.includes(story.user_id))
        .slice(0, 20); // Get more for horizontal scroll

      return friendStories;
    },
    enabled: following.length > 0,
  });

  const handlePostClick = (postId: string | number) => {
    navigate(`/discover/${postId}`);
  };

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

  if (recentPosts.length === 0) {
    return null; // Don't show section if no friend posts
  }

  return (
    <section className="mt-8">
      <div className="px-6 mb-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Friend Activities</h2>
        <Link 
          to="/discover" 
          className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
        >
          See all
        </Link>
      </div>
      
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
        {recentPosts.map((post) => (
          <div
            key={post.id}
            className="min-w-[280px] max-w-[280px] bg-[#1A1A1A] border border-white/8 overflow-hidden flex-shrink-0 rounded-xl shadow-lg hover:border-white/15 transition-all cursor-pointer"
            onClick={() => handlePostClick(post.id)}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {post.media_url ? (
                post.media_type === 'video' ? (
                  <video
                    src={post.media_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      if (video.duration) {
                        video.currentTime = Math.min(0.5, video.duration * 0.1);
                      }
                    }}
                  />
                ) : (
                  <img
                    alt={post.content || 'Post'}
                    src={post.media_url}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <p className="text-white/70 text-sm p-4 line-clamp-3">{post.content}</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.user_image || undefined} />
                  <AvatarFallback className="text-xs">
                    {post.user_name?.charAt(0).toUpperCase() || 'F'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {post.user_name || 'Friend'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(post.created_at), 'MMM d')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentUpdatesSection;
