import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface SpotlightEventItem {
  id: number;
  title: string;
  date: string;
  location: string;
  description?: string | null;
  image_url?: string | null;
  link?: string;
  tag?: string;
}

const SpotlightEventCard: React.FC<{ item: SpotlightEventItem; className?: string }> = ({ item, className }) => {
  const eventDate = item.date ? new Date(item.date) : null;
  const formattedDate = eventDate ? format(eventDate, 'MMM d, yyyy') : 'TBA';

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-white/0',
        className
      )}
    >
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-kenya-brown/20">
          <span className="text-sm text-white/60">Event preview coming soon</span>
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        {item.tag && (
          <span className="inline-flex w-fit items-center rounded-full bg-kenya-orange/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
            {item.tag}
          </span>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="text-sm text-white/70 line-clamp-3">{item.description || 'More details dropping soon.'}</p>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-kenya-orange" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-kenya-orange" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
        </div>
        <div className="mt-auto">
          <Button
            variant="secondary"
            className="w-full bg-white/90 text-black hover:bg-white"
            onClick={() => {
              if (item.link) {
                window.open(item.link, '_blank');
              }
            }}
          >
            Explore Event <ArrowUpRight size={16} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotlightEventCard;

