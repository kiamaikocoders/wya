import React from 'react';
import { Grid, Video, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Post {
  id: string | number;
  media_url?: string | null;
  media_type?: string;
  content?: string;
  event_id?: number | null;
  created_at: string;
}

interface PostsGridProps {
  posts: Post[];
  activeTab: 'posts' | 'spotlight' | 'tagged';
  onPostClick?: (post: Post) => void;
  className?: string;
  emptyCtaLabel?: string;
  onEmptyCtaClick?: () => void;
}

const PostsGrid: React.FC<PostsGridProps> = ({
  posts,
  activeTab,
  onPostClick,
  className,
  emptyCtaLabel,
  onEmptyCtaClick,
}) => {
  const filteredPosts = React.useMemo(() => {
    if (activeTab === 'spotlight') {
      // Spotlight = posts tagged to an event (i.e. "I was at this event")
      return posts.filter(p => !!p.event_id);
    }
    if (activeTab === 'tagged') {
      // For now, return all posts. In the future, filter by tagged posts
      return posts;
    }
    return posts;
  }, [posts, activeTab]);

  if (filteredPosts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="mb-4 rounded-full bg-white/5 p-6">
          {activeTab === 'spotlight' ? (
            <Video className="h-12 w-12 text-white/40" />
          ) : (
            <Grid className="h-12 w-12 text-white/40" />
          )}
        </div>
        <p className="text-lg font-semibold text-white">
          {activeTab === 'spotlight' ? 'No spotlight posts yet' : activeTab === 'tagged' ? 'No tagged posts' : 'No posts yet'}
        </p>
        <p className="mt-2 text-sm text-white/70">
          {activeTab === 'spotlight' 
            ? 'Share a post and tag an event to show up here'
            : activeTab === 'tagged'
            ? "You haven't been tagged in any posts"
            : 'Share your first post to get started'}
        </p>

        {!!emptyCtaLabel && !!onEmptyCtaClick && (
          <Button
            onClick={onEmptyCtaClick}
            className="mt-6 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-6 py-3 font-semibold text-black shadow-[0_0_22px_rgba(255,128,0,0.35)] hover:shadow-[0_0_32px_rgba(255,128,0,0.5)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {emptyCtaLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={cn('grid grid-cols-3 gap-1 md:gap-2', className)}>
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="group relative aspect-square cursor-pointer overflow-hidden bg-white/5"
            onClick={() => onPostClick?.(post)}
          >
            {post.media_url ? (
              <>
                {post.media_type === 'video' ? (
                  <video
                    src={post.media_url}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      // Set currentTime to 0.1s to show a frame instead of black
                      const video = e.currentTarget;
                      if (video.duration) {
                        video.currentTime = Math.min(0.5, video.duration * 0.1);
                      }
                    }}
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.content || 'Post'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                {post.media_type === 'video' && (
                  <div className="absolute top-2 right-2">
                    <Video className="h-4 w-4 text-white" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-4">
                <p className="text-center text-sm text-white/70 line-clamp-3">
                  {post.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Add create post button after posts */}
      {filteredPosts.length > 0 && !!emptyCtaLabel && !!onEmptyCtaClick && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={onEmptyCtaClick}
            className="rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-6 py-3 font-semibold text-black shadow-[0_0_22px_rgba(255,128,0,0.35)] hover:shadow-[0_0_32px_rgba(255,128,0,0.5)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'spotlight' ? 'Create a spotlight post' : 'Create another post'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PostsGrid;

