import React from 'react';
import { Grid, Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Post {
  id: string | number;
  media_url?: string | null;
  media_type?: string;
  content?: string;
  created_at: string;
}

interface PostsGridProps {
  posts: Post[];
  activeTab: 'posts' | 'reels' | 'tagged';
  onPostClick?: (post: Post) => void;
  className?: string;
}

const PostsGrid: React.FC<PostsGridProps> = ({
  posts,
  activeTab,
  onPostClick,
  className,
}) => {
  const filteredPosts = React.useMemo(() => {
    if (activeTab === 'reels') {
      return posts.filter(p => p.media_type === 'video');
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
          {activeTab === 'reels' ? (
            <Video className="h-12 w-12 text-white/40" />
          ) : (
            <Grid className="h-12 w-12 text-white/40" />
          )}
        </div>
        <p className="text-lg font-semibold text-white">
          {activeTab === 'reels' ? 'No reels yet' : activeTab === 'tagged' ? 'No tagged posts' : 'No posts yet'}
        </p>
        <p className="mt-2 text-sm text-white/70">
          {activeTab === 'reels' 
            ? 'Share your first reel to get started'
            : activeTab === 'tagged'
            ? "You haven't been tagged in any posts"
            : 'Share your first post to get started'}
        </p>
      </div>
    );
  }

  return (
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
  );
};

export default PostsGrid;

