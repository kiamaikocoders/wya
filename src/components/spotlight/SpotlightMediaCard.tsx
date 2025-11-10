import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance } from 'date-fns';

export interface SpotlightMediaItem {
  id: string | number;
  title?: string;
  content: string;
  media_url?: string | null;
  user_name: string;
  user_image?: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  tag?: string;
  accentClassName?: string;
  onClick?: () => void;
}

const SpotlightMediaCard: React.FC<{ item: SpotlightMediaItem; className?: string }> = ({ item, className }) => {
  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-white/0 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-kenya-orange/10',
        className
      )}
      onClick={item.onClick}
    >
      <CardContent className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          {item.media_url ? (
            <img
              src={item.media_url}
              alt={item.title || item.content}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-kenya-brown/20">
              <span className="text-sm text-white/60">No media</span>
            </div>
          )}
          {item.tag && (
            <span
              className={cn(
                'absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black',
                item.accentClassName || 'bg-kenya-orange/80'
              )}
            >
              {item.tag}
            </span>
          )}
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-kenya-brown/60">
              <AvatarImage src={item.user_image || undefined} alt={item.user_name} />
              <AvatarFallback className="bg-kenya-brown text-white">
                {item.user_name?.slice(0, 1) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-white">{item.user_name || 'Anonymous'}</p>
              <p className="text-xs text-white/50">
                {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div>
            {item.title && <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>}
            <p className="line-clamp-3 text-sm text-white/70">{item.content}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-1">
              <Heart size={14} />
              <span>{item.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              <span>{item.comments_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{item.views_count}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotlightMediaCard;

