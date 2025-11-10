import React from 'react';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';

export interface SpotlightHeroItem {
  id: string | number;
  tag: string;
  title: string;
  description: string;
  media_url?: string | null;
  user_name: string;
  created_at: string;
  globalIndex: number;
}

interface SpotlightHeroProps {
  items: SpotlightHeroItem[];
  onSelect?: (globalIndex: number) => void;
  className?: string;
}

const SpotlightHero: React.FC<SpotlightHeroProps> = ({ items, onSelect, className }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const [primary, ...secondary] = items;

  const renderCard = (item: SpotlightHeroItem, isPrimary = false) => {
    const handleClick = () => {
      if (onSelect) {
        onSelect(item.globalIndex);
      }
    };

    return (
      <div
        key={item.id}
        className={cn(
          'relative group rounded-3xl overflow-hidden bg-kenya-brown/20 flex flex-col justify-end',
          isPrimary ? 'min-h-[420px]' : 'min-h-[200px]'
        )}
      >
        {item.media_url ? (
          <img
            src={item.media_url}
            alt={item.title}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
              isPrimary ? '' : 'brightness-75'
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-kenya-brown/60 to-black/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className={cn('relative p-8 flex flex-col gap-4', isPrimary ? '' : 'p-6')}>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-kenya-orange/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
              {item.tag}
            </span>
            <span className="text-xs text-white/60">
              {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
            </span>
          </div>
          <div className="space-y-3">
            <h2 className={cn('font-semibold text-white', isPrimary ? 'text-3xl md:text-4xl' : 'text-xl')}>
              {item.title}
            </h2>
            <p className={cn('text-white/80', isPrimary ? 'text-base md:text-lg' : 'text-sm line-clamp-3')}>
              {item.description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">By {item.user_name || 'Anonymous'}</span>
            <Button
              variant="secondary"
              size={isPrimary ? 'lg' : 'sm'}
              onClick={handleClick}
              className="bg-white/90 text-black hover:bg-white"
            >
              Watch Story
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('grid gap-6 md:grid-cols-5', className)}>
      <div className="md:col-span-3">{renderCard(primary, true)}</div>
      <div className="md:col-span-2 grid gap-6">
        {secondary.map(item => renderCard(item))}
      </div>
    </div>
  );
};

export default SpotlightHero;

