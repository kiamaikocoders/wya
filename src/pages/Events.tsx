
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/ui/SearchBar';
import EventCard from '@/components/ui/EventCard';
import { Calendar, Filter, MapPin, SlidersHorizontal, X, Tag, ChevronsUpDown, ArrowUpDown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { eventService, Event } from '@/lib/event-service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import DarkModeToggle from '@/components/ui/DarkModeToggle';
import MapView from '@/components/ui/MapView';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Constants for the Events page
const DEFAULT_ITEMS_PER_PAGE = 12;
const ITEMS_PER_PAGE_OPTIONS = [6, 12, 24, 48];

// Available locations for filtering
const locationOptions = ['All Locations', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Lamu', 'Malindi', 'Kilifi', 'Naivasha', 'Samburu'];

// Available categories for filtering
const categoryOptions = ['All Categories', 'Music', 'Sports', 'Food & Drink', 'Business', 'Technology', 'Art', 'Culture', 'Education', 'Charity', 'Festival'];

// Price range presets for filtering
const priceRangeOptions = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under 500', min: 0, max: 500 },
  { label: '500-2000', min: 500, max: 2000 },
  { label: '2000-5000', min: 2000, max: 5000 },
  { label: 'Over 5000', min: 5000, max: Infinity }
];

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const getInitialParam = (paramName: string, defaultValue: string) => {
    return searchParams.get(paramName) || defaultValue;
  };

  const [searchQuery, setSearchQuery] = useState(getInitialParam('q', ''));
  const [selectedLocation, setSelectedLocation] = useState(getInitialParam('location', 'All Locations'));
  const [selectedCategory, setSelectedCategory] = useState(getInitialParam('category', 'All Categories'));
  const [selectedDate, setSelectedDate] = useState(getInitialParam('date', ''));
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(getInitialParam('minPrice', '0')),
    parseInt(getInitialParam('maxPrice', '10000'))
  ]);
  const [sortBy, setSortBy] = useState(getInitialParam('sort', 'date-desc'));
  const [currentPage, setCurrentPage] = useState(parseInt(getInitialParam('page', '1')));
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(getInitialParam('limit', DEFAULT_ITEMS_PER_PAGE.toString()))
  );

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(
    getInitialParam('view', 'grid') as 'grid' | 'map'
  );
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(
    getInitialParam('featured', 'false') === 'true'
  );
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });

  useEffect(() => {
    if (events) {
      const tags = new Set<string>();
      events.forEach(event => {
        if (event.tags && Array.isArray(event.tags)) {
          event.tags.forEach(tag => tags.add(tag));
        }
      });
      setAvailableTags(Array.from(tags));
    }
  }, [events]);

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedLocation !== 'All Locations') params.set('location', selectedLocation);
    if (selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 10000) params.set('maxPrice', priceRange[1].toString());
    if (sortBy !== 'date-desc') params.set('sort', sortBy);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (itemsPerPage !== DEFAULT_ITEMS_PER_PAGE) params.set('limit', itemsPerPage.toString());
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (showFeaturedOnly) params.set('featured', 'true');
    
    setSearchParams(params);
  }, [
    searchQuery, selectedLocation, selectedCategory, selectedDate, 
    selectedTags, priceRange, sortBy, currentPage, itemsPerPage,
    viewMode, showFeaturedOnly, setSearchParams
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    toast.success('Filters applied successfully!');
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedLocation('All Locations');
    setSelectedCategory('All Categories');
    setSelectedDate('');
    setSelectedTags([]);
    setPriceRange([0, 10000]);
    setShowFeaturedOnly(false);
    setCurrentPage(1);
    toast.info('Filters have been reset');
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const toggleFeaturedFilter = () => {
    setShowFeaturedOnly(prev => !prev);
    setCurrentPage(1);
  };

  const filteredEvents = events?.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLocation = selectedLocation === 'All Locations' || 
      event.location === selectedLocation;
      
    const matchesCategory = selectedCategory === 'All Categories' || 
      event.category === selectedCategory;
      
    const matchesDate = selectedDate === '' || 
      event.date.includes(selectedDate);
      
    const matchesTags = selectedTags.length === 0 || 
      (event.tags && selectedTags.some(tag => event.tags?.includes(tag)));
      
    const matchesPrice = 
      (event.price === undefined || event.price === null ? 0 : event.price) >= priceRange[0] && 
      (event.price === undefined || event.price === null ? 0 : event.price) <= priceRange[1];
      
    const matchesFeatured = !showFeaturedOnly || event.is_featured === true;
      
    return matchesSearch && matchesLocation && matchesCategory && 
           matchesDate && matchesTags && matchesPrice && matchesFeatured;
  });

  const sortedEvents = filteredEvents ? [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'price-asc':
        return (a.price || 0) - (b.price || 0);
      case 'price-desc':
        return (b.price || 0) - (a.price || 0);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  }) : [];

  const totalPages = sortedEvents ? Math.ceil(sortedEvents.length / itemsPerPage) : 0;
  const paginatedEvents = sortedEvents ? sortedEvents.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  ) : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i} 
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            isActive={currentPage === 1} 
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i} 
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="px-4 py-6 flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold">Upcoming Events</h1>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal size={18} />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-kenya-brown dark:bg-kenya-dark border-t border-kenya-brown-dark">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Filters</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetFilters}
                      className="text-kenya-brown-light hover:text-white flex items-center gap-1"
                    >
                      <X size={14} />
                      Reset
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-kenya-brown-light text-sm block mb-1">Location</label>
                      <select 
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full bg-kenya-dark text-white rounded-lg p-2 border border-kenya-brown-dark dark:border-kenya-brown"
                      >
                        {locationOptions.map(locationOpt => (
                          <option key={locationOpt} value={locationOpt}>{locationOpt}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-kenya-brown-light text-sm block mb-1">Category</label>
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-kenya-dark text-white rounded-lg p-2 border border-kenya-brown-dark dark:border-kenya-brown"
                      >
                        {categoryOptions.map(categoryOpt => (
                          <option key={categoryOpt} value={categoryOpt}>{categoryOpt}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-kenya-brown-light text-sm block mb-1">Date</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kenya-brown-light">
                          <Calendar size={16} />
                        </div>
                        <input 
                          type="date" 
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-kenya-dark text-white rounded-lg p-2 pl-10 border border-kenya-brown-dark dark:border-kenya-brown"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-kenya-brown-light text-sm block">Price Range (KES)</label>
                      <div className="pt-4 px-2">
                        <Slider
                          defaultValue={priceRange}
                          min={0}
                          max={10000}
                          step={100}
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>{priceRange[0]} KES</span>
                        <span>{priceRange[1] === 10000 ? '10,000+ KES' : `${priceRange[1]} KES`}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {priceRangeOptions.map((range, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setPriceRange([range.min, range.max === Infinity ? 10000 : range.max])}
                          >
                            {range.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-kenya-brown-light text-sm block">Tags</label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                        {availableTags.length > 0 ? (
                          availableTags.map(tag => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`tag-${tag}`} 
                                checked={selectedTags.includes(tag)}
                                onCheckedChange={() => toggleTag(tag)}
                              />
                              <label 
                                htmlFor={`tag-${tag}`}
                                className="text-sm cursor-pointer"
                              >
                                {tag}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-kenya-brown-light italic">No tags available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="featured-only" 
                        checked={showFeaturedOnly}
                        onCheckedChange={toggleFeaturedFilter}
                      />
                      <label htmlFor="featured-only" className="text-sm">
                        Featured events only
                      </label>
                    </div>
                    
                    <Button 
                      onClick={handleApplyFilters}
                      className="w-full bg-kenya-orange text-white py-2 rounded-lg font-medium mt-2 hover:bg-opacity-90 transition-colors"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        
        <SearchBar 
          placeholder="Search for events..." 
          onSearch={handleSearch}
          initialValue={searchQuery}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {selectedLocation !== 'All Locations' && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedLocation}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSelectedLocation('All Locations')} 
                />
              </Badge>
            )}
            
            {selectedCategory !== 'All Categories' && (
              <Badge variant="outline" className="flex items-center gap-1">
                {selectedCategory}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSelectedCategory('All Categories')} 
                />
              </Badge>
            )}
            
            {selectedDate && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(selectedDate), 'dd MMM yyyy')}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSelectedDate('')} 
                />
              </Badge>
            )}
            
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <Badge variant="outline" className="flex items-center gap-1">
                Price: {priceRange[0]} - {priceRange[1] === 10000 ? '10,000+' : priceRange[1]} KES
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setPriceRange([0, 10000])} 
                />
              </Badge>
            )}
            
            {selectedTags.map(tag => (
              <Badge key={tag} variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleTag(tag)} 
                />
              </Badge>
            ))}
            
            {showFeaturedOnly && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Featured Only
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={toggleFeaturedFilter} 
                />
              </Badge>
            )}
            
            {(selectedLocation !== 'All Locations' || 
              selectedCategory !== 'All Categories' || 
              selectedDate || 
              priceRange[0] > 0 || 
              priceRange[1] < 10000 || 
              selectedTags.length > 0 ||
              showFeaturedOnly) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-kenya-brown-light hover:text-white h-7"
              >
                Clear all
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Sort
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <Button 
                    variant={sortBy === 'date-desc' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSortChange('date-desc')}
                  >
                    Date (Newest first)
                  </Button>
                  <Button 
                    variant={sortBy === 'date-asc' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSortChange('date-asc')}
                  >
                    Date (Oldest first)
                  </Button>
                  <Button 
                    variant={sortBy === 'price-asc' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSortChange('price-asc')}
                  >
                    Price (Low to high)
                  </Button>
                  <Button 
                    variant={sortBy === 'price-desc' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSortChange('price-desc')}
                  >
                    Price (High to low)
                  </Button>
                  <Button 
                    variant={sortBy === 'title-asc' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSortChange('title-asc')}
                  >
                    Title (A-Z)
                  </Button>
                  <Button 
                    variant={sortBy === 'title-desc' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSortChange('title-desc')}
                  >
                    Title (Z-A)
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[90px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue={viewMode} className="w-full" onValueChange={(value) => setViewMode(value as 'grid' | 'map')}>
          <div className="flex justify-end mb-4">
            <TabsList className="bg-kenya-brown-dark/50 dark:bg-kenya-brown/30">
              <TabsTrigger value="grid" className="data-[state=active]:bg-kenya-orange data-[state=active]:text-white">
                Grid View
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-kenya-orange data-[state=active]:text-white">
                Map View
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
              </div>
            ) : error ? (
              <div className="text-center text-kenya-orange p-8">
                <p>Failed to load events. Please try again.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedEvents && paginatedEvents.length > 0 ? (
                    paginatedEvents.map((event: Event) => (
                      <EventCard 
                        key={event.id} 
                        id={String(event.id)}
                        title={event.title}
                        category={event.category}
                        date={event.date}
                        location={event.location}
                        image={event.image_url}
                        capacity={100}
                        price={event.price}
                        isFeatured={event.is_featured}
                        attendees={Math.floor(Math.random() * 100)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center text-kenya-brown-light p-8">
                      <p>No events found. Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          isActive={currentPage !== 1}
                        />
                      </PaginationItem>
                      
                      {generatePaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          isActive={currentPage !== totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
                
                {filteredEvents && (
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    Showing {paginatedEvents.length} of {filteredEvents.length} events
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <div className="rounded-lg overflow-hidden border border-kenya-brown-dark bg-kenya-brown/10 min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                <div className="md:col-span-1 border-r border-kenya-brown-dark overflow-y-auto max-h-[500px] scrollbar-none">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kenya-orange"></div>
                    </div>
                  ) : paginatedEvents && paginatedEvents.length > 0 ? (
                    paginatedEvents.map((event: Event) => (
                      <div 
                        key={event.id}
                        className={`p-3 border-b border-kenya-brown-dark/50 hover:bg-kenya-brown-dark/20 cursor-pointer transition-colors ${
                          event.is_featured ? 'bg-kenya-orange/10' : ''
                        }`}
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-white text-sm font-medium">{event.title}</h3>
                          {event.is_featured && (
                            <Star className="h-3 w-3 text-kenya-orange" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-kenya-brown-light text-xs">
                          <MapPin size={12} />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-kenya-brown-light text-xs">
                          <Calendar size={12} />
                          <span>{format(new Date(event.date), 'dd MMM yyyy')}</span>
                        </div>
                        {event.price !== undefined && (
                          <div className="mt-1 text-kenya-orange text-xs font-medium">
                            {event.price === 0 ? 'Free' : `${event.price} KES`}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-kenya-brown-light p-8">
                      <p>No events found. Try adjusting your search or filters.</p>
                    </div>
                  )}
                  
                  {totalPages > 1 && (
                    <div className="p-3 border-t border-kenya-brown-dark">
                      <Pagination>
                        <PaginationContent className="justify-center">
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              isActive={currentPage !== 1}
                            />
                          </PaginationItem>
                          
                          <PaginationItem>
                            <PaginationLink isActive>
                              {currentPage} / {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              isActive={currentPage !== totalPages}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 h-[500px] p-4 flex items-center justify-center">
                  <MapView 
                    location={selectedLocation !== 'All Locations' ? selectedLocation : "Kenya"}
                    className="w-full h-full"
                    interactive={true}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Events;
