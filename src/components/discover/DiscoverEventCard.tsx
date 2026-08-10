import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DiscoverEventItem {
  id: number;
  title: string;
  date: string;
  location: string;
  description?: string | null;
  image_url?: string | null;
  link?: string;
  tag?: string;
}

function eventInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'WYA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

/**
 * Discover surface event card — image or branded preview when cover art is missing.
 */
const DiscoverEventCard: React.FC<{ item: DiscoverEventItem; className?: string }> = ({
  item,
  className,
}) => {
  const navigate = useNavigate();
  const eventDate = item.date ? new Date(item.date) : null;
  const formattedDate = eventDate && !Number.isNaN(eventDate.getTime())
    ? format(eventDate, 'MMM d, yyyy')
    : 'Date TBA';
  const initials = eventInitials(item.title);

  const openEvent = () => {
    if (item.link) {
      if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
        window.open(item.link, '_blank', 'noopener,noreferrer');
        return;
      }
      navigate(item.link);
      return;
    }
    navigate(`/events/${item.id}`);
  };

  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-white/0 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-kenya-orange/10',
        className
      )}
    >
      <button
        type="button"
        onClick={openEvent}
        className="relative block h-40 w-full overflow-hidden text-left"
        aria-label={`Open ${item.title}`}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,53,0.45),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.4),transparent_50%),linear-gradient(145deg,#1a1025_0%,#2a1838_45%,#121018_100%)]">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-2 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-bold tracking-wide text-white backdrop-blur-sm">
                {initials}
              </div>
              <p className="line-clamp-2 max-w-[14rem] text-sm font-semibold text-white/90">
                {item.title}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-kenya-orange">
                {formattedDate}
              </p>
            </div>
          </div>
        )}
        {item.tag ? (
          <span className="absolute left-3 top-3 z-[2] rounded-full bg-gradient-accent/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
            {item.tag}
          </span>
        ) : null}
      </button>
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="line-clamp-3 text-sm text-white/70">
            {item.description?.trim() || 'Tap through for full event details, tickets, and location.'}
          </p>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-gradient-orange-accent" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-gradient-orange-accent" />
            <span className="line-clamp-1">{item.location || 'Location TBA'}</span>
          </div>
        </div>
        <div className="mt-auto">
          <Button
            variant="secondary"
            className="w-full bg-white/90 text-black hover:bg-white"
            onClick={openEvent}
          >
            Explore Event <ArrowUpRight size={16} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscoverEventCard;
