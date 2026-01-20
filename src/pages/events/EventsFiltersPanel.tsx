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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

  const CategoryBody = () => (
    <div className="flex flex-wrap gap-2 pt-2">
      {categories.map(category => (
        <Button
          key={category}
          size="sm"
          variant={filters.category === category ? 'default' : 'outline'}
          onClick={() => updateFilter('category', filters.category === category ? null : category)}
          className={cn(
            'h-auto rounded-full px-3 py-2 text-xs leading-none',
            filters.category === category
              ? 'bg-gradient-accent text-white'
              : 'border-white/20 text-white/80 hover:border-kenya-orange hover:text-white'
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  );

  const LocationBody = () => (
    <div className="flex flex-wrap gap-2 pt-2">
      {locations.map(location => (
        <Button
          key={location}
          variant={filters.location === location ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-auto rounded-full px-3 py-2 text-xs leading-none',
            filters.location === location
              ? 'bg-gradient-accent text-white'
              : 'border-white/20 text-white/80 hover:border-kenya-orange hover:text-white'
          )}
          onClick={() => updateFilter('location', filters.location === location ? null : location)}
          title={location.length > 30 ? location : undefined}
        >
          <span className="block max-w-[220px] truncate">{location}</span>
        </Button>
      ))}
    </div>
  );

  const DateBody = () => (
    <div>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {quickDateRanges.map(range => (
          <Button
            key={range.label}
            variant="outline"
            size="sm"
            className="h-auto rounded-full border-white/20 px-3 py-2 text-xs leading-none text-white/80 hover:border-kenya-orange hover:text-white"
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
              className="inline-flex h-auto items-center gap-2 rounded-full border-white/20 px-3 py-2 text-xs leading-none text-white/80 hover:border-kenya-orange hover:text-white"
            >
              <CalendarIcon className="h-4 w-4" />
              Choose range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-white/10 bg-gradient-promo/95 text-white">
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
          <Clock className="h-4 w-4 text-gradient-orange-accent" />
          <span>
            {filters.startDate ? format(new Date(filters.startDate), 'MMM d, yyyy') : 'Any time'} –{' '}
            {filters.endDate ? format(new Date(filters.endDate), 'MMM d, yyyy') : 'Any time'}
          </span>
        </div>
      )}
    </div>
  );

  const TagsBody = () => (
    <div className="flex flex-wrap gap-2 pt-2">
      {tags.map(tag => {
        const selected = filters.tags.includes(tag);
        return (
          <Badge
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-2 text-xs leading-none',
              selected
                ? 'bg-gradient-accent text-white'
                : 'border border-white/15 bg-transparent text-white/80 hover:border-kenya-orange hover:text-white'
            )}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );

  const FeaturedSection = () => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent/20">
          <Flame className="h-4 w-4 text-gradient-orange-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Featured only</p>
          <p className="text-xs text-white/60">Highlight discovered experiences</p>
        </div>
      </div>
      <Switch checked={filters.featuredOnly} onCheckedChange={checked => updateFilter('featuredOnly', checked)} />
    </div>
  );

  const FiltersActions = () => (
    <div className="flex gap-2 pt-2">
      <Button
        variant="outline"
        className="flex-1 rounded-full border-white/20 text-white hover:border-kenya-orange hover:text-white"
        onClick={clearFilters}
      >
        Reset all
      </Button>
      <Button className="flex-1 rounded-full bg-gradient-accent text-white" onClick={() => onOpenChange(false)}>
        Apply filters
      </Button>
    </div>
  );

  const FiltersContent = ({
    collapsible,
    defaultOpenAll,
  }: {
    collapsible?: boolean;
    defaultOpenAll?: boolean;
  }) => {
    const selectedCategory = filters.category ?? null;
    const selectedLocation = filters.location ?? null;
    const selectedTagsCount = filters.tags.length;
    const hasDate = Boolean(filters.startDate || filters.endDate);
    const dateLabel =
      filters.startDate || filters.endDate
        ? `${filters.startDate ? format(new Date(filters.startDate), 'MMM d') : 'Any'}–${
            filters.endDate ? format(new Date(filters.endDate), 'MMM d') : 'Any'
          }`
        : null;

    if (collapsible) {
      const defaultValue = defaultOpenAll ? ['category', 'location', 'date', 'tags'] : ['category', 'location'];

      return (
        <div className="space-y-6 text-white">
          <Accordion type="multiple" defaultValue={defaultValue} className="space-y-3">
            <AccordionItem
              value="category"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 backdrop-blur"
            >
              <AccordionTrigger className="py-4 text-sm font-semibold tracking-wide text-white hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="uppercase text-white/80">Category</span>
                    {selectedCategory && (
                      <span className="truncate text-xs font-medium text-white/60">
                        {selectedCategory}
                      </span>
                    )}
                  </div>
                  {selectedCategory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs text-white/60 hover:text-white"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateFilter('category', null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <CategoryBody />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="location"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 backdrop-blur"
            >
              <AccordionTrigger className="py-4 text-sm font-semibold tracking-wide text-white hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="uppercase text-white/80">Location</span>
                    {selectedLocation && (
                      <span className="truncate text-xs font-medium text-white/60">
                        {selectedLocation}
                      </span>
                    )}
                  </div>
                  {selectedLocation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs text-white/60 hover:text-white"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateFilter('location', null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <LocationBody />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="date"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 backdrop-blur"
            >
              <AccordionTrigger className="py-4 text-sm font-semibold tracking-wide text-white hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="uppercase text-white/80">Date</span>
                    {dateLabel && (
                      <span className="truncate text-xs font-medium text-white/60">{dateLabel}</span>
                    )}
                  </div>
                  {hasDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs text-white/60 hover:text-white"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateFilter('startDate', null);
                        updateFilter('endDate', null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <DateBody />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="tags"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 backdrop-blur"
            >
              <AccordionTrigger className="py-4 text-sm font-semibold tracking-wide text-white hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="uppercase text-white/80">Tags</span>
                    {selectedTagsCount > 0 && (
                      <span className="truncate text-xs font-medium text-white/60">
                        {selectedTagsCount} selected
                      </span>
                    )}
                  </div>
                  {selectedTagsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs text-white/60 hover:text-white"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateFilter('tags', []);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <TagsBody />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <FeaturedSection />
          <FiltersActions />
        </div>
      );
    }

    return (
      <div className="space-y-6 text-white">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Category</h4>
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
          <CategoryBody />
        </div>

        <Separator className="bg-white/10" />

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Location</h4>
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
          <LocationBody />
        </div>

        <Separator className="bg-white/10" />

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Date</h4>
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
          <DateBody />
        </div>

        <Separator className="bg-white/10" />

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Tags</h4>
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
          <TagsBody />
        </div>

        <Separator className="bg-white/10" />

        <FeaturedSection />
        <FiltersActions />
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex h-full flex-col gap-5 border-white/10 bg-gradient-promo/95 text-white">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle>Refine your search</SheetTitle>
            <SheetDescription className="text-white/60">
              Layer filters to surface the exact experiences you want to explore.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-4">
            <FiltersContent collapsible />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <aside className="hidden w-72 flex-shrink-0 lg:block lg:min-h-0">
        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-4">
          <FiltersContent collapsible defaultOpenAll />
        </div>
      </aside>
    </>
  );
};

export default EventsFiltersPanel;

