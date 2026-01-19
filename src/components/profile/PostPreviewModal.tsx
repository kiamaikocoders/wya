import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Pencil, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { storyService } from '@/lib/story/story-service';
import { useAuth } from '@/contexts/AuthContext';

export type ProfilePostPreview = {
  id: string | number;
  user_id?: string;
  media_url?: string | null;
  media_type?: string | null;
  content?: string;
  created_at: string;
  event_id?: number | null;
};

interface PostPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ProfilePostPreview | null;
  posts?: ProfilePostPreview[]; // All posts for navigation
  currentIndex?: number; // Current post index in posts array
  eventTitle?: string;
  eventTitleMap?: Map<number, string>; // Map of event_id to event title
  returnTo?: string;
  onChanged?: () => void;
  onPostChange?: (index: number) => void; // Callback when post changes
}

const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  open,
  onOpenChange,
  post,
  posts = [],
  currentIndex = 0,
  eventTitle,
  eventTitleMap,
  returnTo,
  onChanged,
  onPostChange,
}) => {
  // All hooks must be called before any conditional returns
  const { user } = useAuth();
  const [currentPostIndex, setCurrentPostIndex] = useState(currentIndex);
  const mediaRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPost = posts.length > 0 && currentPostIndex >= 0 && currentPostIndex < posts.length
    ? posts[currentPostIndex]
    : post;

  // Update current index when post changes externally
  useEffect(() => {
    if (post && posts.length > 0) {
      const index = posts.findIndex(p => p.id === post.id);
      if (index !== -1) {
        setCurrentPostIndex(index);
      }
    } else if (currentIndex >= 0) {
      setCurrentPostIndex(currentIndex);
    }
  }, [post, posts, currentIndex]);

  // Update draft content when post changes
  useEffect(() => {
    if (currentPost) {
      setDraftContent(currentPost.content || '');
      setIsEditing(false);
    }
  }, [currentPost?.id]);

  const canGoPrevious = posts.length > 0 && currentPostIndex > 0;
  const canGoNext = posts.length > 0 && currentPostIndex < posts.length - 1;

  const handlePrevious = useCallback(() => {
    if (posts.length > 0 && currentPostIndex > 0) {
      const newIndex = currentPostIndex - 1;
      setCurrentPostIndex(newIndex);
      onPostChange?.(newIndex);
    }
  }, [posts.length, currentPostIndex, onPostChange]);

  const handleNext = useCallback(() => {
    if (posts.length > 0 && currentPostIndex < posts.length - 1) {
      const newIndex = currentPostIndex + 1;
      setCurrentPostIndex(newIndex);
      onPostChange?.(newIndex);
    }
  }, [posts.length, currentPostIndex, onPostChange]);

  // Swipe gesture handlers (not hooks, just functions)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && canGoNext) {
        // Swiped left, go to next
        handleNext();
      } else if (diff < 0 && canGoPrevious) {
        // Swiped right, go to previous
        handlePrevious();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // All useMemo hooks must be before early return
  const isOwner = useMemo(() => {
    if (!user?.id || !currentPost) return false;
    // If user_id isn't provided, assume owner in Profile context
    return !currentPost.user_id || currentPost.user_id === user.id;
  }, [currentPost?.user_id, user?.id, currentPost]);

  // Get event title for current post
  const currentEventTitle = useMemo(() => {
    if (!currentPost) return eventTitle;
    if (currentPost.event_id && eventTitleMap) {
      return eventTitleMap.get(currentPost.event_id);
    }
    return eventTitle;
  }, [currentPost?.event_id, eventTitleMap, eventTitle, currentPost]);

  // Keyboard navigation - must be before early return
  useEffect(() => {
    if (!open || !currentPost) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, canGoPrevious, canGoNext, handlePrevious, handleNext, onOpenChange, currentPost]);

  // Early return AFTER all hooks
  if (!currentPost) return null;

  const isVideo = currentPost.media_type === 'video';
  const hasMedia = !!currentPost.media_url;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const storyId = typeof currentPost.id === 'string' ? Number(currentPost.id) : currentPost.id;
      await storyService.updateStory(storyId, {
        content: draftContent,
        caption: draftContent,
      } as any);
      toast.success('Post updated');
      setIsEditing(false);
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      setIsDeleting(true);
      const storyId = typeof currentPost.id === 'string' ? Number(currentPost.id) : currentPost.id;
      const ok = await storyService.deleteStory(storyId);
      if (!ok) throw new Error('Delete failed');
      toast.success('Post deleted');
      onChanged?.();
      
      // If there are more posts, navigate to next or previous
      if (posts.length > 1) {
        if (canGoNext) {
          handleNext();
        } else if (canGoPrevious) {
          handlePrevious();
        } else {
          onOpenChange(false);
        }
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] md:h-[95vh] bg-[#121212] border-white/10 text-white p-0 overflow-hidden [&>button]:hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Media Section - Instagram-like left side */}
          <div 
            ref={mediaRef}
            className="relative flex-1 flex items-center justify-center bg-black min-h-[50vh] md:min-h-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {hasMedia ? (
              <>
                {isVideo ? (
                  <video
                    key={currentPost.id} // Force re-render on post change
                    src={currentPost.media_url || undefined}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    autoPlay
                  />
                ) : (
                  <img
                    key={currentPost.id} // Force re-render on post change
                    src={currentPost.media_url || undefined}
                    alt={currentPost.content || 'Post'}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8">
                <p className="text-lg text-white/80 text-center whitespace-pre-wrap">
                  {currentPost.content || '—'}
                </p>
              </div>
            )}
            
            {/* Navigation buttons */}
            {posts.length > 1 && (
              <>
                {canGoPrevious && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/50 backdrop-blur-sm rounded-full h-12 w-12 md:h-14 md:w-14"
                  >
                    <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
                  </Button>
                )}
                {canGoNext && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/50 backdrop-blur-sm rounded-full h-12 w-12 md:h-14 md:w-14"
                  >
                    <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
                  </Button>
                )}
              </>
            )}
            
            {/* Post counter */}
            {posts.length > 1 && (
              <div className="absolute top-4 left-4 text-white/70 text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                {currentPostIndex + 1} / {posts.length}
              </div>
            )}
            
            {/* Close button overlay */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 text-white/90 hover:text-white hover:bg-black/50 backdrop-blur-sm rounded-full h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content Section - Instagram-like right side */}
          <div className="flex flex-col w-full md:w-[400px] border-t md:border-t-0 md:border-l border-white/10 bg-[#121212]">
            {/* Header */}
            <DialogHeader className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold">Post Details</DialogTitle>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <>
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                            onClick={handleSave}
                            className="text-white hover:bg-white/10 h-8 px-3"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => {
                              setIsEditing(false);
                              setDraftContent(post.content || '');
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-3"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-3"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDelete}
                            className="text-red-200 hover:text-red-100 hover:bg-red-500/10 h-8 px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Caption */}
                {(!!currentPost.content || isEditing) && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-white/50">Caption</p>
                    {isEditing ? (
                      <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gradient-orange-accent/40"
                        placeholder="Write a caption…"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                        {currentPost.content}
                      </p>
                    )}
                  </div>
                )}

                {/* Event link */}
                {!!currentPost.event_id && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-white/50">Tagged event</p>
                    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-semibold text-white">
                        {currentEventTitle || `Event #${currentPost.event_id}`}
                      </p>
                      <Link to={`/events/${currentPost.event_id}`} state={returnTo ? { returnTo } : undefined}>
                        <Button variant="outline" size="sm" className="border-white/15 text-white hover:bg-white/10 w-full">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View event
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-white/50 pt-2 border-t border-white/10">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(currentPost.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostPreviewModal;

