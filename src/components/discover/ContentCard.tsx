import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Calendar, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

export interface DiscoverContent {
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
  event_title?: string;
  engagementScore?: number;
}

export interface EventMetadata {
  id: number;
  title: string;
  date: string;
  location: string;
  totalContent?: number;
}

interface ContentCardProps {
  content: DiscoverContent;
  isHero: boolean;
  position: 'left' | 'center' | 'right';
  onClick?: () => void;
  onExpand?: () => void;
  onLike?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
  isLiked?: boolean;
  className?: string;
  eventMetadata?: EventMetadata; // Event metadata for bottom-left overlay
  onEventClick?: (eventId: number) => void; // Handler for event metadata click
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
  eventMetadata,
  onEventClick,
}) => {
  const isVideo = content.media_type === 'video';
  const navigate = useNavigate();
  const location = useLocation();
  const [isEventExpanded, setIsEventExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // TikTok-style: muted by default
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync muted state with video element
  useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isVideo]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const displayName = (() => {
    const raw = (content.user_name || '').trim();
    // If it's an email, show only the local-part.
    if (raw.includes('@') && !raw.includes(' ')) return raw.split('@')[0];
    return raw || 'User';
  })();

  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  const handleEventClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (eventMetadata && eventMetadata.id !== 0 && onEventClick) {
      onEventClick(eventMetadata.id);
    }
  };

  return (
    <div
      className={cn(
        // TikTok-style: Full viewport height, rounded corners, no border on mobile
        'relative flex flex-col overflow-hidden rounded-none md:rounded-3xl bg-black',
        'h-screen md:h-[calc(100vh-180px)]',
        'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Media - Full bleed */}
      {content.media_url ? (
        <div className="absolute inset-0">
          {isVideo ? (
            <video
              ref={videoRef}
              src={content.media_url}
              className="h-full w-full object-cover"
              loop
              muted={isMuted}
              playsInline
              autoPlay={true}
              preload="metadata"
            />
          ) : (
            <img
              src={content.media_url}
              alt={content.title || content.content.slice(0, 50)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {/* Enhanced scrim gradient for text legibility - TikTok style */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kenya-dark via-black to-kenya-brown-dark" />
      )}

      {/* Content Overlay - TikTok style layout */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Top area - Empty for now (user info moved to right sidebar) */}
        <div className="flex-1" />

        {/* Bottom area - Event metadata (left) + Interactions (right) */}
        <div className="flex items-end justify-between p-4 md:p-6 pb-24 md:pb-6">
          {/* Bottom-left: Event metadata overlay (tappable/expandable) */}
          <div className="flex-1 min-w-0 pr-4">
            {eventMetadata && eventMetadata.id !== 0 && (
              <div
                className={cn(
                  'bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 p-3 cursor-pointer',
                  'transition-all duration-200 hover:bg-black/50',
                  isEventExpanded ? 'mb-2' : ''
                )}
                onClick={handleEventClick}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base md:text-lg font-bold text-white line-clamp-1">
                      {eventMetadata.title}
                    </h3>
                    {!isEventExpanded && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(eventMetadata.date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{eventMetadata.location}</span>
                        </div>
                      </div>
                    )}
                    {isEventExpanded && (
                      <div className="mt-2 space-y-1 text-xs text-white/80">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(eventMetadata.date), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{eventMetadata.location}</span>
                        </div>
                        {eventMetadata.totalContent !== undefined && (
                          <div className="text-white/60">
                            {eventMetadata.totalContent} {eventMetadata.totalContent === 1 ? 'story' : 'stories'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEventExpanded(!isEventExpanded);
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {isEventExpanded ? (
                      <ChevronUp className="h-4 w-4 text-white/80" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white/80" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Username and caption */}
            <div className="mt-2">
              <p className="text-base md:text-lg font-bold text-white drop-shadow-lg">
                @{displayName}
              </p>
              {content.content && (
                <p className="text-sm md:text-base text-white/90 mt-1 line-clamp-2 drop-shadow-lg">
                  {content.content}
                </p>
              )}
            </div>
          </div>

          {/* Right sidebar: Interactions (thumb zone) - TikTok style */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            {/* Profile picture - no follow button (TikTok patent) */}
            <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
              <AvatarImage src={content.user_image || undefined} />
              <AvatarFallback className="bg-kenya-orange/20 text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Mute/Unmute button (only for videos) */}
            {isVideo && (
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={cn(
                    'h-14 w-14 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70',
                    'border-2 border-white/30 shadow-xl transition-all'
                  )}
                >
                  {isMuted ? (
                    <VolumeX className="h-7 w-7 text-white drop-shadow-lg" />
                  ) : (
                    <Volume2 className="h-7 w-7 text-white drop-shadow-lg" />
                  )}
                </Button>
              </div>
            )}

            {/* Like button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(content.id);
                }}
                className={cn(
                  'h-14 w-14 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70',
                  'border-2 border-white/30 shadow-xl transition-all',
                  isLiked && 'bg-kenya-orange/50 border-kenya-orange/50'
                )}
              >
                <Heart
                  className={cn(
                    'h-7 w-7 transition-all drop-shadow-lg',
                    isLiked && 'fill-white text-white'
                  )}
                />
              </Button>
              <span className="text-sm font-bold text-white drop-shadow-lg">
                {(() => {
                  const count = content.likes_count || 0;
                  if (count >= 1000000) {
                    return `${(count / 1000000).toFixed(1)}M`;
                  } else if (count >= 1000) {
                    return `${(count / 1000).toFixed(1)}K`;
                  } else {
                    return count.toString();
                  }
                })()}
              </span>
            </div>

            {/* Share button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(content.id);
                }}
                className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 border-2 border-white/30 shadow-xl"
              >
                <Share2 className="h-7 w-7 text-white drop-shadow-lg" />
              </Button>
              <span className="text-sm font-bold text-white drop-shadow-lg">Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
