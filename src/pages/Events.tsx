import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService, Event } from '@/lib/event-service';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Search, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const Events = () => {
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });
  
  const allTags = Array.from(new Set(events?.flatMap(event => event.tags || []) || []));
  const allCategories = Array.from(new Set(events?.map(event => event.category || '') || [])).filter(Boolean);
  const allLocations = Array.from(new Set(events?.map(event => event.location) || [])).filter(Boolean);
  
  useEffect(() => {
    const initialTag = searchParams.get('tag');
    if (initialTag && allTags.includes(initialTag)) {
      setSelectedTags([initialTag]);
    }
  }, [searchParams, allTags]);

  // Filter events by search term and/or tags
  const filterEvents = () => {
    if (!events) return [];

    return events.filter(event => {
      // Match search term
      const matchesSearchTerm = !searchTerm || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Match selected tags (if any)
      const matchesTags = selectedTags.length === 0 || 
        (event.tags && selectedTags.some(tag => event.tags?.includes(tag)));
      
      // Match selected category (if any)
      const matchesCategory = !selectedCategory || 
        event.category === selectedCategory;
      
      // Match selected location (if any)
      const matchesLocation = !selectedLocation || 
        event.location === selectedLocation;
      
      // Match featured flag (if selected)
      const matchesFeatured = !showFeaturedOnly || 
        event.featured;
      
      return matchesSearchTerm && matchesTags && matchesCategory && matchesLocation && matchesFeatured;
    });
  };

  const filteredEvents = filterEvents();
  const hasResults = !isLoading && !error && filteredEvents.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Explore Events</h1>
          {hasResults && (
            <Badge variant="secondary">{filteredEvents.length} Events</Badge>
          )}
        </div>
        
        <div className="w-full md:max-w-sm flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-1">
          <div className="bg-kenya-brown-dark bg-opacity-20 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Filters</h3>
            
            <div className="mb-3">
              <h4 className="text-sm font-medium text-white/80 mb-1">Category</h4>
              <Select value={selectedCategory || 'all'} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Categories</SelectItem>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-3">
              <h4 className="text-sm font-medium text-white/80 mb-1">Location</h4>
              <Select value={selectedLocation || 'all'} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Locations</SelectItem>
                  {allLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {allTags.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-white/80 mb-1">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      className={selectedTags.includes(tag) ? 'bg-kenya-orange text-white' : 'text-white border-kenya-orange hover:bg-kenya-orange hover:text-white'}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Input
                type="checkbox"
                id="featured"
                className="mr-2"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              />
              <label htmlFor="featured" className="text-sm font-medium text-white/80">
                Show Featured Only
              </label>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 text-white p-4 rounded-lg text-center">
              <SearchX size={48} className="mx-auto mb-3" />
              <p>Failed to load events. Please try again later.</p>
            </div>
          ) : !hasResults ? (
            <div className="bg-kenya-brown-dark bg-opacity-20 text-white p-8 rounded-lg text-center">
              <SearchX size={48} className="mx-auto mb-3" />
              <h3 className="text-lg font-medium">No events found</h3>
              <p>Adjust your search or filter criteria to find events.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="initial"
              animate="animate"
            >
              {filteredEvents.map(event => (
                <motion.div 
                  key={event.id}
                  variants={fadeIn}
                  className="bg-kenya-brown-dark bg-opacity-20 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Link to={`/events/${event.id}`} className="block">
                    <div className="relative h-48">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      {event.featured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-kenya-orange border-0 text-white">
                            Featured
                          </Badge>
                        </div>
                      )}
                      {event.tags && event.tags.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                          {event.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="bg-black bg-opacity-50 text-white border-0 text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {event.tags.length > 2 && (
                            <Badge variant="outline" className="bg-black bg-opacity-50 text-white border-0 text-xs">
                              +{event.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-white">{event.title}</h3>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  </CardContent>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
