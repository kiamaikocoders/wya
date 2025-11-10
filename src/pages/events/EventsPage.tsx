import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useEventFilters } from '@/hooks/use-event-filters';
import { eventService } from '@/lib/event-service';
import { useAuth } from '@/contexts/AuthContext';
import EventsHero from './EventsHero';
import EventsToolbar from './EventsToolbar';
import EventsFiltersPanel from './EventsFiltersPanel';
import EventsResults from './EventsResults';
import type { EventsMetrics } from './types';

const countEventsThisWeek = (events: { date: string }[]) => {
  const window = {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  };

  return events.filter(event =>
    isWithinInterval(new Date(event.date), window)
  ).length;
};

const EventsPage = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  const {
    filters,
    sortOption,
    viewMode,
    page,
    pageSize,
    activeTab,
    savedFilters,
    saveCurrentFilter,
    deleteSavedFilter,
    applySavedFilter,
    updateFilter,
    toggleTag,
    clearFilters,
    changeSort,
    changeView,
    changePage,
    changeTab,
    recommendationTags,
    contextLocation,
    isSavingFilter,
  } = useEventFilters();

  const facetsQuery = useQuery({
    queryKey: ['event-facets'],
    queryFn: () => eventService.getFilterFacets(),
    staleTime: 1000 * 60 * 30,
  });

  const eventsQuery = useQuery({
    queryKey: [
      'events-feed',
      filters,
      sortOption,
      page,
      pageSize,
      activeTab,
      recommendationTags,
      contextLocation,
    ],
    queryFn: () =>
      eventService.queryEvents({
        ...filters,
        sort: sortOption,
        page,
        pageSize,
        recommendationTags,
        curatedCity: contextLocation,
        includePast: activeTab === 'past',
      }),
    enabled: activeTab !== 'attending',
    keepPreviousData: true,
  });

  const savedEventsQuery = useQuery({
    queryKey: ['events-saved', user?.id],
    queryFn: () => (user ? eventService.getSavedEvents(user.id) : []),
    enabled: activeTab === 'attending' && !!user?.id,
  });

  const events = activeTab === 'attending'
    ? savedEventsQuery.data ?? []
    : eventsQuery.data?.events ?? [];

  const totalPages = activeTab === 'attending'
    ? 1
    : eventsQuery.data?.totalPages ?? 1;

  const metrics: EventsMetrics = useMemo(() => {
    if (activeTab === 'attending') {
      const saved = savedEventsQuery.data ?? [];
      return {
        total: saved.length,
        thisWeek: countEventsThisWeek(saved),
        curatedCity: contextLocation,
        curatedCount: saved.filter(event =>
          contextLocation
            ? event.location?.toLowerCase().includes(contextLocation.toLowerCase())
            : true
        ).length,
        featured: saved.filter(event => event.featured).length,
      };
    }

    return {
      total: eventsQuery.data?.totalCount ?? 0,
      thisWeek: eventsQuery.data?.stats.thisWeekCount ?? 0,
      curatedCity: eventsQuery.data?.stats.curatedCity ?? contextLocation,
      curatedCount: eventsQuery.data?.stats.curatedCount ?? 0,
      featured: eventsQuery.data?.stats.featuredCount ?? 0,
    };
  }, [activeTab, contextLocation, eventsQuery.data, savedEventsQuery.data]);

  const handleSearchChange = (value: string) => {
    updateFilter('search', value);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-10">
      <div className="space-y-8">
        <EventsHero
          metrics={metrics}
          activeTab={activeTab}
          onTabChange={changeTab}
          contextCity={contextLocation}
          isAdmin={isAdmin}
        />

        <EventsToolbar
          searchValue={filters.search}
          onSearchChange={handleSearchChange}
          onOpenFilters={() => setFiltersOpen(true)}
          sortOption={sortOption}
          onSortChange={changeSort}
          viewMode={viewMode}
          onViewChange={changeView}
          savedFilters={savedFilters}
          onSavedFilterSelect={filter => {
            applySavedFilter(filter);
            setFiltersOpen(false);
          }}
          onSaveCurrentFilter={saveCurrentFilter}
          onDeleteSavedFilter={deleteSavedFilter}
          isSaving={isSavingFilter}
          totalCount={
            activeTab === 'attending'
              ? savedEventsQuery.data?.length ?? 0
              : eventsQuery.data?.totalCount ?? 0
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <EventsFiltersPanel
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            filters={filters}
            categories={facetsQuery.data?.categories ?? []}
            locations={facetsQuery.data?.locations ?? []}
            tags={facetsQuery.data?.tags ?? []}
            updateFilter={updateFilter}
            toggleTag={toggleTag}
            clearFilters={clearFilters}
          />

          <main className="flex-1 space-y-6">
            <EventsResults
              events={events}
              isLoading={
                activeTab === 'attending' ? savedEventsQuery.isLoading : eventsQuery.isLoading
              }
              viewMode={viewMode}
              totalPages={totalPages}
              currentPage={page}
              onPageChange={changePage}
              isAdmin={isAdmin}
              onResetFilters={clearFilters}
              contextLocation={contextLocation}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;

