import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Pencil, Trash2, Save, X } from 'lucide-react';
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
  eventTitle?: string;
  returnTo?: string;
  onChanged?: () => void;
}

const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  open,
  onOpenChange,
  post,
  eventTitle,
  returnTo,
  onChanged,
}) => {
  if (!post) return null;

  const { user } = useAuth();
  const isVideo = post.media_type === 'video';
  const hasMedia = !!post.media_url;

  const isOwner = useMemo(() => {
    if (!user?.id) return false;
    // If user_id isn't provided, assume owner in Profile context
    return !post.user_id || post.user_id === user.id;
  }, [post.user_id, user?.id]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(post.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const storyId = typeof post.id === 'string' ? Number(post.id) : post.id;
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
      const storyId = typeof post.id === 'string' ? Number(post.id) : post.id;
      const ok = await storyService.deleteStory(storyId);
      if (!ok) throw new Error('Delete failed');
      toast.success('Post deleted');
      onChanged?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#121212] border-white/10 text-white p-0 overflow-hidden [&>button]:hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Post</DialogTitle>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="border-white/15 text-white hover:bg-white/10"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving…' : 'Save'}
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
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="border-white/15 text-white hover:bg-white/10"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="border-red-500/30 text-red-200 hover:bg-red-500/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </Button>
                    </>
                  )}
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Media */}
          {hasMedia ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black">
              {isVideo ? (
                <video
                  src={post.media_url || undefined}
                  className="w-full max-h-[60vh] object-contain"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={post.media_url || undefined}
                  alt={post.content || 'Post'}
                  className="w-full max-h-[60vh] object-contain"
                  loading="lazy"
                />
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/80">
              {post.content || '—'}
            </div>
          )}

          {/* Caption */}
          {(!!post.content || isEditing) && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              {isEditing ? (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kenya-orange/40"
                  placeholder="Write a caption…"
                />
              ) : (
                <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
                  {post.content}
                </p>
              )}
            </div>
          )}

          {/* Event link */}
          {!!post.event_id && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-white/50">Tagged event</p>
                <p className="mt-1 text-sm font-semibold text-white truncate">
                  {eventTitle || `Event #${post.event_id}`}
                </p>
              </div>
              <Link to={`/events/${post.event_id}`} state={returnTo ? { returnTo } : undefined}>
                <Button variant="outline" className="border-white/15 text-white hover:bg-white/10">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View event
                </Button>
              </Link>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostPreviewModal;

