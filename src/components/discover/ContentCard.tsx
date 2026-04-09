import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Calendar, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import HeartAnimation from './HeartAnimation';
import { useDiscoverUI } from '@/contexts/DiscoverUIContext';

export interface DiscoverContent {
  id: string | number;
  type: 'story';
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
  end_date?: string | null;
  location: string;
  totalContent?: number;
}

interface ContentCardProps {
  content: DiscoverContent;
  isHero: boolean;
  position: 'left' | 'center' | 'right';
  /** When false, video is paused and muted so sound doesn't play over other posts */
  isActive?: boolean;
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
  isActive = true,
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
  const { uiVisible, toggleUI } = useDiscoverUI();
  const [isEventExpanded, setIsEventExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // TikTok-style: muted by default
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Pause video immediately (synchronously before paint) when isActive changes
  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
  }, []);

  const playVideo = useCallback(() => {
    if (videoRef.current && isActive) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [isActive, isMuted]);

  // Use useLayoutEffect for synchronous pause when isActive changes to false
  // This runs before the browser paints, ensuring immediate pause
  useLayoutEffect(() => {
    if (!videoRef.current || !isVideo) return;
    if (!isActive) {
      pauseVideo();
      setIsMuted(true);
    } else {
      playVideo();
    }
  }, [isActive, isVideo, pauseVideo, playVideo]);

  // Sync muted state with video element when user toggles
  useEffect(() => {
    if (videoRef.current && isVideo && isActive) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isVideo, isActive]);

  // Pause video on any vertical scroll in the discover container
  // This catches cases where the IntersectionObserver hasn't fired yet
  useEffect(() => {
    if (!isVideo) return;

    const discoverContainer = document.querySelector('[data-discover-container]');
    if (!discoverContainer) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      // Immediately pause when scrolling starts
      if (videoRef.current && !videoRef.current.paused) {
        pauseVideo();
      }
      // Clear any existing timeout
      if (scrollTimeout) clearTimeout(scrollTimeout);
      // After scroll ends, let the isActive prop determine if we should play
      scrollTimeout = setTimeout(() => {
        if (isActive) {
          playVideo();
        }
      }, 150);
    };

    discoverContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      discoverContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [isVideo, isActive, pauseVideo, playVideo]);

  // Cleanup: pause video on unmount
  useEffect(() => {
    return () => {
      pauseVideo();
    };
  }, [pauseVideo]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  // Double-tap to like handler with heart animation
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - only preventDefault if cancelable (avoids [Intervention] when scroll is in progress)
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      // Show heart animation
      setShowHeartAnimation(true);
      onLike?.(content.id);
      lastTapRef.current = 0; // Reset to prevent triple-tap
    } else {
      // First tap - wait for potential second tap
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  // Handle touch start to detect swipe direction
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  // Handle touch end - check if it's a tap or swipe
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If horizontal swipe is greater than vertical, it's a horizontal swipe (for carousel)
    // Don't trigger tap actions on horizontal swipes
    if (deltaX > deltaY && deltaX > 10) {
      touchStartRef.current = null;
      return; // Horizontal swipe - let carousel handle it
    }
    
    // Otherwise, treat as tap and handle double-tap
    handleDoubleTap(e);
    touchStartRef.current = null;
  };

  // Handle single click with delay to allow double-tap detection
  // Single tap toggles navbar visibility (content info stays visible)
  const handleClick = (e: React.MouseEvent) => {
    // Delay the onClick to allow double-tap detection
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastTapRef.current > 300) {
        // Not a double tap - toggle navbar visibility
        toggleUI();
        onClick?.();
      }
    }, 300);
  };

  const toggleMute = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current && isVideo) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        // Unmuting: browsers require play() in same user gesture for audio to work
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleMuteTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMuteTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMute(e);
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
      ref={cardRef}
      className={cn(
        // TikTok-style: Full viewport height, rounded corners, no border on mobile
        'relative flex flex-col overflow-hidden rounded-none md:rounded-3xl bg-black',
        'h-screen md:h-[calc(100vh-180px)]',
        'cursor-pointer',
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleTap}
      onTouchEnd={handleDoubleTap}
    >
      {/* Heart animation on double-tap */}
      <HeartAnimation
        show={showHeartAnimation}
        onComplete={() => setShowHeartAnimation(false)}
      />
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

        {/* Bottom area - Event metadata (left) + Interactions (right) - Always visible */}
        <div 
          className={cn(
            'flex items-end justify-between p-4 md:p-6',
            'transition-all duration-300 ease-in-out',
            // Push content up when navbar is visible (BottomNav is ~80px on mobile)
            // pb-24 = 96px which gives enough space for navbar + safe area
            uiVisible ? 'pb-24 md:pb-6' : 'pb-4 md:pb-6' // Extra padding when navbar shows
          )}
        >
          {/* Bottom-left: Metadata with gradient background */}
          <div className="flex-1 min-w-0 pr-4">
            {/* Gradient background container for all metadata */}
            <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-sm rounded-2xl p-3">
              {eventMetadata && eventMetadata.id !== 0 && (
                <div
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    isEventExpanded ? 'mb-2' : ''
                  )}
                  onClick={handleEventClick}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Modern rounded sans-serif font for badge (KodongKlan) */}
                      <h3 className="text-base md:text-lg font-semibold text-white line-clamp-1 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {eventMetadata.title}
                      </h3>
                      {!isEventExpanded && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                            {eventMetadata.end_date && eventMetadata.end_date !== eventMetadata.date.slice(0, 10)
                              ? `${format(new Date(eventMetadata.date), 'MMM d')} – ${format(new Date(eventMetadata.end_date), 'MMM d, yyyy')}`
                              : format(new Date(eventMetadata.date), 'MMM d, yyyy')}
                          </span>
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
                            <span>
                            {eventMetadata.end_date && eventMetadata.end_date !== eventMetadata.date.slice(0, 10)
                              ? `${format(new Date(eventMetadata.date), 'EEEE, MMM d')} – ${format(new Date(eventMetadata.end_date), 'MMM d, yyyy')}`
                              : format(new Date(eventMetadata.date), 'EEEE, MMMM d, yyyy')}
                          </span>
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

              {/* Username badge and caption - grouped closer together (@admin and xoxo) */}
              <div className={cn(
                'space-y-0.5 mt-1',
                eventMetadata && eventMetadata.id !== 0 ? 'mt-2' : ''
              )}>
                {/* Caption moved closer to badge - grouped visually */}
                <p className="text-sm text-white/90 drop-shadow-lg">
                  @{displayName}
                </p>
                {content.content && (
                  <p className="text-sm md:text-base text-white/90 line-clamp-2 drop-shadow-lg">
                    {content.content}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar: Interactions (thumb zone) - Smaller, more vertical - Always visible */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {/* Profile picture - smaller */}
            <Avatar className="h-10 w-10 border border-white/30 shadow-lg">
              <AvatarImage src={content.user_image || undefined} />
              <AvatarFallback className="bg-kenya-orange/20 text-white font-semibold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Mute/Unmute button (only for videos) - smaller; touch handlers prevent scroll-to-next */}
            {isVideo && (
              <div
                className="flex flex-col items-center gap-0.5 touch-none"
                onTouchStart={handleMuteTouchStart}
                onTouchEnd={handleMuteTouchEnd}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => toggleMute(e)}
                  className={cn(
                    'h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60',
                    'border border-white/20 shadow-lg transition-all'
                  )}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={1.5} />
                  ) : (
                    <Volume2 className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={1.5} />
                  )}
                </Button>
              </div>
            )}

            {/* Like button - smaller with thin stroke */}
            <div className="flex flex-col items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(content.id);
                }}
                className={cn(
                  'h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60',
                  'border border-white/20 shadow-lg transition-all',
                  isLiked && 'bg-kenya-orange/40 border-kenya-orange/40'
                )}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-all drop-shadow-lg',
                    isLiked && 'fill-white text-white',
                    'stroke-[1.5]' // Thin stroke
                  )}
                />
              </Button>
              <span className="text-xs font-semibold text-white drop-shadow-lg">
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

            {/* Share button - smaller with thin stroke, safe area padding */}
            <div className="flex flex-col items-center gap-0.5 safe-area-bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(content.id);
                }}
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 shadow-lg"
              >
                <Share2 className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={1.5} />
              </Button>
              <span className="text-xs font-semibold text-white drop-shadow-lg">Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
