import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Share2, MapPin, Calendar } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ReelItemProps {
  id: string | number;
  type: 'story' | 'forum';
  title?: string;
  content: string;
  media_url?: string | null;
  media_type?: string;
  user_name: string;
  user_image?: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count?: number;
  event_id?: number | null;
  event_title?: string;
  isLiked?: boolean;
  onLike?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
  className?: string;
}

const ReelItem: React.FC<ReelItemProps> = ({
  id,
  type,
  title,
  content,
  media_url,
  media_type,
  user_name,
  user_image,
  created_at,
  likes_count,
  comments_count,
  event_id,
  event_title,
  isLiked = false,
  onLike,
  onShare,
  className,
}) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes_count);
  const videoRef = useRef<HTMLVideoElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-play video when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && media_type === 'video' && videoRef.current) {
            videoRef.current.play().catch(() => {
              // Autoplay failed, user interaction required
            });
            setIsPlaying(true);
          } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, [media_type]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike?.(id);
  };

  const handleShare = () => {
    onShare?.(id);
    if (navigator.share) {
      navigator.share({
        title: title || content.slice(0, 50),
        text: content,
        url: window.location.href,
      }).catch(() => {
        // Share failed or cancelled
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleEventClick = () => {
    if (event_id) {
      navigate(`/events/${event_id}`);
    }
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        'relative flex h-[calc(100vh-120px)] min-h-[600px] flex-col overflow-hidden rounded-2xl bg-black',
        className
      )}
    >
      {/* Media */}
      {media_url ? (
        <div className="absolute inset-0">
          {media_type === 'video' ? (
            <video
              ref={videoRef}
              src={media_url}
              className="h-full w-full object-cover"
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={media_url}
              alt={title || content.slice(0, 50)}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kenya-dark via-black to-kenya-brown-dark" />
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white">
        {/* Top: User info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={user_image || undefined} />
              <AvatarFallback className="bg-kenya-orange/20 text-white">
                {user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user_name}</p>
              <p className="text-xs text-white/70">
                {formatDistance(new Date(created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
          {event_id && event_title && (
            <Badge
              className="cursor-pointer bg-white/20 hover:bg-white/30"
              onClick={handleEventClick}
            >
              <MapPin className="mr-1 h-3 w-3" />
              {event_title}
            </Badge>
          )}
        </div>

        {/* Middle: Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl text-center">
            {title && (
              <h3 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h3>
            )}
            <p className="text-lg text-white/90 md:text-xl">{content}</p>
          </div>
        </div>

        {/* Bottom: Actions */}
        <div className="flex items-end justify-between">
          <div className="flex-1">
            {event_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEventClick}
                className="text-white hover:bg-white/10"
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Event
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(
                'h-12 w-12 rounded-full bg-white/10 hover:bg-white/20',
                liked && 'bg-kenya-orange/20'
              )}
            >
              <Heart
                className={cn(
                  'h-6 w-6 transition-all',
                  liked && 'fill-kenya-orange text-kenya-orange'
                )}
              />
            </Button>
            <span className="text-sm font-medium">{likeCount}</span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
            >
              <Share2 className="h-6 w-6" />
            </Button>
            <span className="text-sm font-medium">Share</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelItem;

