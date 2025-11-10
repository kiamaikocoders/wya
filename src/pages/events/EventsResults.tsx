import EventCard from './EventCard';
import EventSkeleton from './EventSkeleton';
import EventsEmptyState from './EventsEmptyState';
import EventMap from './EventMap';
import type { Event } from '@/types/event.types';
import type { EventViewMode } from './types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';

type EventsResultsProps = {
  events: Event[];
  isLoading: boolean;
  viewMode: EventViewMode;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isAdmin: boolean;
  onResetFilters: () => void;
  contextLocation: string | null;
};

const skeletons = Array.from({ length: 6 });

const EventsResults = ({
  events,
  isLoading,
  viewMode,
  totalPages,
  currentPage,
  onPageChange,
  isAdmin,
  onResetFilters,
  contextLocation,
}: EventsResultsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skeletons.map((_, index) => (
          <EventSkeleton key={index} variant={viewMode === 'list' ? 'list' : 'grid'} />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return <EventsEmptyState onResetFilters={onResetFilters} isAdmin={isAdmin} />;
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <Pagination className="mt-8">
        <PaginationContent className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-white">
          <PaginationItem>
            <PaginationPrevious
              aria-label="Previous page"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              className="border-white/10 text-white/80 hover:border-kenya-orange hover:text-white"
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={pageNumber === currentPage}
                  onClick={() => onPageChange(pageNumber)}
                  className="border-white/10 text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-kenya-orange data-[state=active]:via-amber-400 data-[state=active]:to-kenya-orange data-[state=active]:text-kenya-dark"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              aria-label="Next page"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              className="border-white/10 text-white/80 hover:border-kenya-orange hover:text-white"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-5">
        <div className="space-y-4">
          {events.map(event => (
            <EventCard key={event.id} event={event} variant="list" />
          ))}
        </div>
        {renderPagination()}
      </div>
    );
  }

  if (viewMode === 'map') {
    return (
      <div className="space-y-6">
        <EventMap events={events} contextLocation={contextLocation} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 p-4 text-white/70">
          <div>
            <h4 className="text-sm font-semibold text-white">Want more pins on the map?</h4>
            <p className="text-xs text-white/60">
              Expand your radius or explore different categories to uncover additional events.
            </p>
          </div>
          <Button
            variant="ghost"
            className="rounded-full text-white/70 hover:text-white"
            onClick={onResetFilters}
          >
            Reset filters
          </Button>
        </div>
        {renderPagination()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {renderPagination()}
    </div>
  );
};

export default EventsResults;

