import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bookmark,
  Grid,
  List,
  Map,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  EventSortOption,
  EventViewMode,
  SavedEventFilter,
} from './types';
import { cn } from '@/lib/utils';

type EventsToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  sortOption: EventSortOption;
  onSortChange: (option: EventSortOption) => void;
  viewMode: EventViewMode;
  onViewChange: (view: EventViewMode) => void;
  savedFilters: SavedEventFilter[];
  onSavedFilterSelect: (filter: SavedEventFilter) => void;
  onSaveCurrentFilter: (name: string) => Promise<void>;
  onDeleteSavedFilter: (id: string) => Promise<void>;
  isSaving: boolean;
  totalCount: number;
};

const sortOptions: { value: EventSortOption; label: string }[] = [
  { value: 'soonest', label: 'Soonest' },
  { value: 'latest', label: 'Latest' },
  { value: 'newest', label: 'Recently added' },
  { value: 'price-low', label: 'Price: Low to high' },
  { value: 'price-high', label: 'Price: High to low' },
];

const viewButtons: { value: EventViewMode; icon: React.ElementType; label: string }[] = [
  { value: 'grid', icon: Grid, label: 'Grid' },
  { value: 'list', icon: List, label: 'List' },
  { value: 'map', icon: Map, label: 'Map' },
];

const EventsToolbar = ({
  searchValue,
  onSearchChange,
  onOpenFilters,
  sortOption,
  onSortChange,
  viewMode,
  onViewChange,
  savedFilters,
  onSavedFilterSelect,
  onSaveCurrentFilter,
  onDeleteSavedFilter,
  isSaving,
  totalCount,
}: EventsToolbarProps) => {
  const [filterName, setFilterName] = useState('');
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;
    await onSaveCurrentFilter(filterName.trim());
    setFilterName('');
    setIsSavePopoverOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-black/40 px-4 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white">
          <Search className="h-4 w-4 text-white/60" />
          <Input
            value={searchValue}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search events, organizers, or vibes"
            className="h-8 border-0 bg-transparent text-sm text-white placeholder:text-white/40 focus-visible:ring-0"
          />
          {searchValue && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/60" onClick={() => onSearchChange('')}>
              Clear
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-full border-white/15 text-white hover:border-kenya-orange hover:text-white"
        >
          <SlidersHorizontal className="h-4 w-4 text-kenya-orange" />
          Filters
        </Button>
      </div>

      <Separator className="bg-white/10 md:hidden" />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="inline-flex items-center gap-2 rounded-full px-3 text-sm text-white/80 hover:text-white"
            >
              Sort: {sortOptions.find(option => option.value === sortOption)?.label ?? 'Soonest'}
              <MoreHorizontal className="h-4 w-4 text-white/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-white/10 bg-kenya-dark/95 text-white">
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-white/60">
              Sort by
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {sortOptions.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  'flex items-center justify-between text-sm',
                  option.value === sortOption && 'text-kenya-orange'
                )}
              >
                {option.label}
                {option.value === sortOption && <Badge className="bg-kenya-orange/20 text-kenya-orange">Active</Badge>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {viewButtons.map(button => {
            const Icon = button.icon;
            const isActive = viewMode === button.value;
            return (
              <Button
                key={button.value}
                variant="ghost"
                size="sm"
                onClick={() => onViewChange(button.value)}
                className={cn(
                  'h-9 w-9 rounded-full text-white/70 hover:bg-white/10',
                  isActive && 'bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark shadow-[0_0_20px_rgba(255,128,0,0.25)]'
                )}
                aria-label={`Switch to ${button.label} view`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        <Popover open={isSavePopoverOpen} onOpenChange={setIsSavePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-full border-kenya-orange/50 text-white hover:bg-white/10"
            >
              <Save className="h-4 w-4 text-kenya-orange" />
              Save filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 border-white/10 bg-kenya-dark/95 text-white">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">Save current filters</p>
                <p className="text-xs text-white/60">
                  Give this view a name to quickly access it later.
                </p>
              </div>
              <Input
                value={filterName}
                onChange={event => setFilterName(event.target.value)}
                placeholder="e.g. Nairobi Tech Nights"
                className="bg-white/5 text-sm text-white placeholder:text-white/40"
              />
              <Button
                className="w-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark"
                onClick={handleSaveFilter}
                disabled={isSaving || !filterName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save filter'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="inline-flex items-center gap-2 rounded-full text-white/80 hover:text-white">
              <Bookmark className="h-4 w-4 text-kenya-orange" />
              Saved views
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 border-white/10 bg-kenya-dark/95 text-white">
            <Command className="bg-transparent">
              <CommandInput placeholder="Search saved filters..." className="text-sm" />
              <CommandList>
                <CommandGroup heading="Saved filters">
                  {savedFilters.length === 0 && (
                    <div className="px-2 py-4 text-sm text-white/50">
                      You haven’t saved any views yet.
                    </div>
                  )}
                  {savedFilters.map(filter => (
                    <CommandItem
                      key={filter.id}
                      onSelect={() => onSavedFilterSelect(filter)}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="line-clamp-1 text-white">{filter.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/50 hover:text-red-400"
                        onClick={event => {
                          event.stopPropagation();
                          void onDeleteSavedFilter(filter.id);
                        }}
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Badge className="rounded-full bg-white/10 text-white">
          {totalCount} results
        </Badge>
      </div>
    </div>
  );
};

export default EventsToolbar;

