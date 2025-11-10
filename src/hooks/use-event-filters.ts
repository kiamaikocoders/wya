import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/lib/onboarding-service';
import { eventFilterService } from '@/lib/event-filter-service';
import type { EventFilterState, EventSortOption, EventViewMode, EventsTab, SavedEventFilter } from '@/pages/events/types';

const DEFAULT_FILTERS: EventFilterState = {
  search: '',
  category: null,
  location: null,
  tags: [],
  featuredOnly: false,
  startDate: null,
  endDate: null,
};

const DEFAULT_SORT: EventSortOption = 'soonest';
const DEFAULT_VIEW: EventViewMode = 'grid';
const DEFAULT_PAGE_SIZE = 9;

const parseArrayParam = (value: string | null) =>
  value ? value.split(',').filter(Boolean) : [];

export const useEventFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedFromPreferences = useRef(false);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<EventFilterState>(() => ({
    ...DEFAULT_FILTERS,
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category'),
    location: searchParams.get('location'),
    tags: parseArrayParam(searchParams.get('tags')),
    featuredOnly: searchParams.get('featured') === 'true',
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  }));

  const [viewMode, setViewMode] = useState<EventViewMode>(
    (searchParams.get('view') as EventViewMode) || DEFAULT_VIEW
  );

  const [sortOption, setSortOption] = useState<EventSortOption>(
    (searchParams.get('sort') as EventSortOption) || DEFAULT_SORT
  );

  const [page, setPage] = useState<number>(() => {
    const param = searchParams.get('page');
    return param ? Math.max(parseInt(param, 10) || 1, 1) : 1;
  });

  const [pageSize, setPageSize] = useState<number>(() => {
    const param = searchParams.get('pageSize');
    return param ? Math.max(parseInt(param, 10) || DEFAULT_PAGE_SIZE, 1) : DEFAULT_PAGE_SIZE;
  });

  const [activeTab, setActiveTab] = useState<EventsTab>(
    (searchParams.get('tab') as EventsTab) || 'discover'
  );

  const savedFiltersQuery = useQuery({
    queryKey: ['event-saved-filters'],
    queryFn: () => eventFilterService.listSavedFilters(),
    enabled: isAuthenticated,
  });

  const onboardingQuery = useQuery({
    queryKey: ['onboarding-preferences'],
    queryFn: () => onboardingService.getPreferences(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!initializedFromPreferences.current && onboardingQuery.data) {
      const defaultLocation =
        onboardingQuery.data.homeBase ||
        onboardingQuery.data.preferredCities?.[0] ||
        null;

      if (defaultLocation && !filters.location) {
        updateFilter('location', defaultLocation, { skipHistory: true });
      }

      initializedFromPreferences.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingQuery.data]);

  const saveFilterMutation = useMutation({
    mutationFn: eventFilterService.saveFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-saved-filters'] });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: eventFilterService.deleteFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-saved-filters'] });
    },
  });

  const updateSearchParams = useCallback(
    (nextFilters: Partial<EventFilterState> = {}, extraParams: Record<string, string | null> = {}) => {
      const params = new URLSearchParams(searchParams);

      const merged = { ...filters, ...nextFilters };

      params.set('search', merged.search || '');
      if (merged.category) params.set('category', merged.category);
      else params.delete('category');

      if (merged.location) params.set('location', merged.location);
      else params.delete('location');

      if (merged.tags.length) params.set('tags', merged.tags.join(','));
      else params.delete('tags');

      if (merged.featuredOnly) params.set('featured', 'true');
      else params.delete('featured');

      if (merged.startDate) params.set('startDate', merged.startDate);
      else params.delete('startDate');

      if (merged.endDate) params.set('endDate', merged.endDate);
      else params.delete('endDate');

      params.set('sort', sortOption);
      params.set('view', viewMode);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('tab', activeTab);

      Object.entries(extraParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      setSearchParams(params, { replace: true });
    },
    [filters, sortOption, viewMode, page, pageSize, activeTab, searchParams, setSearchParams]
  );

  const updateFilter = useCallback(
    (
      key: keyof EventFilterState,
      value: EventFilterState[keyof EventFilterState],
      options?: { resetPage?: boolean; skipHistory?: boolean }
    ) => {
      setFilters(prev => {
        const next = { ...prev, [key]: value };
        return next;
      });

      if (options?.resetPage !== false) {
        setPage(1);
      }

      if (!options?.skipHistory) {
        updateSearchParams({ [key]: value } as Partial<EventFilterState>, { page: '1' });
      }
    },
    [updateSearchParams]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      setFilters(prev => {
        const exists = prev.tags.includes(tag);
        const nextTags = exists ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag];
        updateSearchParams({ tags: nextTags }, { page: '1' });
        return { ...prev, tags: nextTags };
      });
      setPage(1);
    },
    [updateSearchParams]
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSortOption(DEFAULT_SORT);
    setViewMode(DEFAULT_VIEW);
    updateSearchParams(DEFAULT_FILTERS, {
      sort: DEFAULT_SORT,
      view: DEFAULT_VIEW,
      page: '1',
      pageSize: String(DEFAULT_PAGE_SIZE),
    });
  }, [updateSearchParams]);

  const changeSort = useCallback(
    (nextSort: EventSortOption) => {
      setSortOption(nextSort);
      setPage(1);
      updateSearchParams({}, { sort: nextSort, page: '1' });
    },
    [updateSearchParams]
  );

  const changeView = useCallback(
    (nextView: EventViewMode) => {
      setViewMode(nextView);
      updateSearchParams({}, { view: nextView });
    },
    [updateSearchParams]
  );

  const changePage = useCallback(
    (nextPage: number) => {
      const safePage = Math.max(nextPage, 1);
      setPage(safePage);
      updateSearchParams({}, { page: safePage.toString() });
    },
    [updateSearchParams]
  );

  const changeTab = useCallback(
    (tab: EventsTab) => {
      setActiveTab(tab);
      setPage(1);
      updateSearchParams({}, { tab, page: '1' });
    },
    [updateSearchParams]
  );

  const saveCurrentFilter = useCallback(
    async (name: string) => {
      const payload = {
        name,
        filters,
        sort: sortOption,
        view: viewMode,
        pageSize,
      };
      await saveFilterMutation.mutateAsync(payload);
    },
    [filters, sortOption, viewMode, pageSize, saveFilterMutation]
  );

  const deleteSavedFilter = useCallback(
    async (filterId: string) => {
      await deleteFilterMutation.mutateAsync(filterId);
    },
    [deleteFilterMutation]
  );

  const applySavedFilter = useCallback(
    (filter: SavedEventFilter) => {
      setFilters(filter.filters);
      setSortOption(DEFAULT_SORT);
      setViewMode(DEFAULT_VIEW);
      setPage(1);
      updateSearchParams(
        { ...filter.filters },
        {
          sort: DEFAULT_SORT,
          view: DEFAULT_VIEW,
          page: '1',
          savedFilterId: filter.id,
        }
      );
    },
    [updateSearchParams]
  );

  const recommendationTags = useMemo(() => {
    if (activeTab !== 'for-you') return undefined;
    const interests = onboardingQuery.data?.interests ?? [];
    if (!interests.length) return undefined;
    return interests;
  }, [activeTab, onboardingQuery.data]);

  const contextLocation = useMemo(() => {
    if (filters.location) return filters.location;
    return onboardingQuery.data?.homeBase ?? onboardingQuery.data?.preferredCities?.[0] ?? null;
  }, [filters.location, onboardingQuery.data]);

  return {
    filters,
    sortOption,
    viewMode,
    page,
    pageSize,
    activeTab,
    savedFilters: savedFiltersQuery.data ?? [],
    isLoadingSavedFilters: savedFiltersQuery.isLoading,
    saveCurrentFilter,
    deleteSavedFilter,
    applySavedFilter,
    updateFilter,
    toggleTag,
    clearFilters,
    changeSort,
    changeView,
    changePage,
    setPageSize,
    changeTab,
    recommendationTags,
    contextLocation,
    onboardingPreferences: onboardingQuery.data,
    isSavingFilter: saveFilterMutation.isPending,
    isDeletingFilter: deleteFilterMutation.isPending,
  };
};

