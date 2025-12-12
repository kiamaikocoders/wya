import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

export interface SpotlightContent {
  id: string | number;
  type: 'story' | 'forum';
  title?: string;
  content: string;
  media_url?: string | null;
  media_type?: string;
  user_id: string;
  user_name: string;
  user_image?: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count?: number;
  event_id?: number | null;
  engagementScore?: number;
}

interface ContentCardProps {
  content: SpotlightContent;
  isHero: boolean;
  position: 'left' | 'center' | 'right';
  onClick?: () => void;
  onExpand?: () => void;
  onLike?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
  isLiked?: boolean;
  className?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  content,
  isHero,
  position,
  onClick,
  onExpand,
  onLike,
  onShare,
  isLiked = false,
  className,
}) => {
  const isVideo = content.media_type === 'video';
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = (() => {
    const raw = (content.user_name || '').trim();
    // If it's an email, show only the local-part.
    if (raw.includes('@') && !raw.includes(' ')) return raw.split('@')[0];
    return raw || 'User';
  })();

  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  return (
    <div
      className={cn(
        // Reels-style card: full-height, minimal blank space, rounded
        'relative flex flex-col overflow-hidden rounded-3xl bg-black border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]',
        // Fill available vertical space (the parent section is full-height)
        'h-[calc(100vh-220px)] md:h-[calc(100vh-180px)]',
        'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Media */}
      {content.media_url ? (
        <div className="absolute inset-0">
          {isVideo ? (
            <video
              src={content.media_url}
              className="h-full w-full object-cover"
              loop
              muted
              playsInline
              autoPlay={true}
            />
          ) : (
            <img
              src={content.media_url}
              alt={content.title || content.content.slice(0, 50)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {/* bottom gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kenya-dark via-black to-kenya-brown-dark" />
      )}

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4 md:p-6">
        {/* Top: User info */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="relative z-20 pointer-events-auto flex items-center gap-3 text-left rounded-xl hover:bg-white/5 px-2 py-1 -ml-2 transition-colors cursor-pointer"
            onMouseDown={(e) => {
              // Prevent parent card handlers from treating this as a card click/drag.
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/${content.user_id}`, { state: { returnTo } });
            }}
          >
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={content.user_image || undefined} />
              <AvatarFallback className="bg-kenya-orange/20 text-white text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm md:text-base">
                {displayName}
              </p>
              <p className="text-xs text-white/70">
                {formatDistance(new Date(content.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </button>
        </div>

        {/* Bottom: Caption + Actions (no comments) */}
        <div className="flex items-end justify-between gap-4">
          {/* Caption area (bottom-left) */}
          <div className="min-w-0">
            {content.title && (
              <h3 className="text-lg md:text-2xl font-bold text-white leading-tight line-clamp-2">
                {content.title}
              </h3>
            )}
            <p className="mt-2 text-sm md:text-base text-white/85 leading-relaxed line-clamp-3 whitespace-pre-wrap">
              {content.content}
            </p>
        </div>

          {/* Action rail (bottom-right, reels-like) */}
          <div className="flex flex-col items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(content.id);
                }}
                className={cn(
                'h-12 w-12 rounded-full bg-white/10 hover:bg-white/20',
                  isLiked && 'bg-kenya-orange/20'
                )}
              >
                <Heart
                  className={cn(
                  'h-6 w-6 transition-all',
                    isLiked && 'fill-kenya-orange text-kenya-orange'
                  )}
                />
              </Button>
            <span className="text-xs font-semibold text-white/80">{content.likes_count}</span>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(content.id);
                }}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
              >
              <Share2 className="h-6 w-6" />
              </Button>
            <span className="text-xs font-semibold text-white/80">Share</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;

