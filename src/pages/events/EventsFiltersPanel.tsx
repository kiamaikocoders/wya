import { useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Flame } from 'lucide-react';
import type { EventFilterState } from './types';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

type EventsFiltersPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventFilterState;
  categories: string[];
  locations: string[];
  tags: string[];
  updateFilter: <K extends keyof EventFilterState>(key: K, value: EventFilterState[K]) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
};

const quickDateRanges = [
  {
    label: 'This weekend',
    getRange: () => {
      const now = new Date();
      const day = now.getDay();
      const saturdayOffset = 6 - day;
      const sundayOffset = 7 - day;
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + saturdayOffset);
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + sundayOffset);
      return {
        start: saturday.toISOString(),
        end: sunday.toISOString(),
      };
    },
  },
  {
    label: 'Next 30 days',
    getRange: () => {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 30);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    },
  },
  {
    label: 'This month',
    getRange: () => {
      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    },
  },
];

const EventsFiltersPanel = ({
  open,
  onOpenChange,
  filters,
  categories,
  locations,
  tags,
  updateFilter,
  toggleTag,
  clearFilters,
}: EventsFiltersPanelProps) => {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const selectedRange = useMemo(() => {
    if (!filters.startDate && !filters.endDate) return undefined;
    return {
      from: filters.startDate ? new Date(filters.startDate) : undefined,
      to: filters.endDate ? new Date(filters.endDate) : undefined,
    };
  }, [filters.startDate, filters.endDate]);

  const FiltersContent = () => (
    <div className="space-y-6 text-white">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Category
          </h4>
          {filters.category && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/60 hover:text-white"
              onClick={() => updateFilter('category', null)}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              size="sm"
              variant={filters.category === category ? 'default' : 'outline'}
              onClick={() => updateFilter('category', filters.category === category ? null : category)}
              className={cn(
                'rounded-full text-xs',
                filters.category === category
                  ? 'bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark'
                  : 'border-white/20 text-white/70 hover:border-kenya-orange hover:text-white'
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Location
          </h4>
          {filters.location && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/60 hover:text-white"
              onClick={() => updateFilter('location', null)}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {locations.map(location => (
            <Button
              key={location}
              variant={filters.location === location ? 'default' : 'outline'}
              className={cn(
                'rounded-full text-xs',
                filters.location === location
                  ? 'bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark'
                  : 'border-white/20 text-white/70 hover:border-kenya-orange hover:text-white'
              )}
              onClick={() => updateFilter('location', filters.location === location ? null : location)}
            >
              {location}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Date
          </h4>
          {(filters.startDate || filters.endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/60 hover:text-white"
              onClick={() => {
                updateFilter('startDate', null);
                updateFilter('endDate', null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {quickDateRanges.map(range => (
            <Button
              key={range.label}
              variant="outline"
              size="sm"
              className="rounded-full border-white/20 text-xs text-white/70 hover:border-kenya-orange hover:text-white"
              onClick={() => {
                const { start, end } = range.getRange();
                updateFilter('startDate', start);
                updateFilter('endDate', end);
              }}
            >
              {range.label}
            </Button>
          ))}

          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 rounded-full border-white/20 text-xs text-white/70 hover:border-kenya-orange hover:text-white"
              >
                <CalendarIcon className="h-4 w-4" />
                Choose range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-white/10 bg-kenya-dark/95 text-white">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={range => {
                  updateFilter('startDate', range?.from ? range.from.toISOString() : null);
                  updateFilter('endDate', range?.to ? range.to.toISOString() : null);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {(filters.startDate || filters.endDate) && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Clock className="h-4 w-4 text-kenya-orange" />
            <span>
              {filters.startDate ? format(new Date(filters.startDate), 'MMM d, yyyy') : 'Any time'} –{' '}
              {filters.endDate ? format(new Date(filters.endDate), 'MMM d, yyyy') : 'Any time'}
            </span>
          </div>
        )}
      </div>

      <Separator className="bg-white/10" />

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Tags
          </h4>
          {filters.tags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/60 hover:text-white"
              onClick={() => updateFilter('tags', [])}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map(tag => {
            const selected = filters.tags.includes(tag);
            return (
              <Badge
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1 text-xs',
                  selected
                    ? 'bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark'
                    : 'border border-white/15 bg-transparent text-white/70 hover:border-kenya-orange hover:text-white'
                )}
              >
                {tag}
              </Badge>
            );
          })}
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kenya-orange/20">
            <Flame className="h-4 w-4 text-kenya-orange" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Featured only</p>
            <p className="text-xs text-white/60">Highlight spotlighted experiences</p>
          </div>
        </div>
        <Switch
          checked={filters.featuredOnly}
          onCheckedChange={checked => updateFilter('featuredOnly', checked)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 rounded-full border-white/20 text-white hover:border-kenya-orange hover:text-white"
          onClick={clearFilters}
        >
          Reset all
        </Button>
        <Button
          className="flex-1 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark"
          onClick={() => onOpenChange(false)}
        >
          Apply filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex h-full flex-col gap-5 border-white/10 bg-kenya-dark/95 text-white">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle>Refine your search</SheetTitle>
            <SheetDescription className="text-white/60">
              Layer filters to surface the exact experiences you want to explore.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-4">
            <FiltersContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <aside className="hidden w-72 flex-shrink-0 lg:block">
        <div className="sticky top-28 rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur">
          <FiltersContent />
        </div>
      </aside>
    </>
  );
};

export default EventsFiltersPanel;

