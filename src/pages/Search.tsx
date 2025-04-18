
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Filter, MapPin, Tag, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { eventService } from '@/lib/event-service';
import EventCard from '@/components/ui/EventCard';
import PostCard from '@/components/forum/PostCard';
import { forumService } from '@/lib/forum-service';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Sample locations and categories for filters
const locations = ['All Locations', 'Nairobi', 'Lamu', 'Naivasha', 'Samburu'];
const categories = ['All Categories', 'Business', 'Culture', 'Sports', 'Music', 'Technology'];
// Sample tags for filter
const popularTags = ['conference', 'concert', 'festival', 'workshop', 'networking', 'charity'];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('events');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState('All Locations');
  const [category, setCategory] = useState('All Categories');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', searchQuery, location, category, startDate, endDate, selectedTags],
    queryFn: eventService.getAllEvents,
  });
  
  // Fetch forum posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['forumPosts', searchQuery],
    queryFn: forumService.getAllPosts,
  });
  
  // Update search params when query changes
  useEffect(() => {
    if (searchQuery) {
      searchParams.set('q', searchQuery);
      setSearchParams(searchParams);
    }
  }, [searchQuery]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search query is already being tracked in state
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  // Filter events based on search parameters
  const filteredEvents = events?.filter(event => {
    const matchesQuery = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLocation = location === 'All Locations' || 
      event.location === location;
      
    const matchesCategory = category === 'All Categories' || 
      event.category === category;
      
    const matchesStartDate = !startDate || 
      new Date(event.date) >= new Date(startDate);
      
    const matchesEndDate = !endDate || 
      new Date(event.date) <= new Date(endDate);
      
    const matchesTags = selectedTags.length === 0 || 
      (event.tags && selectedTags.some(tag => event.tags?.includes(tag)));
      
    return matchesQuery && 
      matchesLocation && 
      matchesCategory && 
      matchesStartDate && 
      matchesEndDate && 
      matchesTags;
  });
  
  // Filter posts based on search query
  const filteredPosts = posts?.filter(post => 
    !searchQuery || 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Search Results{searchQuery ? `: "${searchQuery}"` : ''}
      </h1>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search for events, posts, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
          </Button>
        </form>
      </div>
      
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {popularTags.map(tag => (
                  <Badge 
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="people" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            People
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          {eventsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <EventCard 
                  key={event.id}
                  id={event.id.toString()}
                  title={event.title}
                  category={event.category}
                  date={new Date(event.date).toLocaleDateString()}
                  location={event.location}
                  image={event.image_url}
                  capacity={100}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl text-white mb-2">No events found</h3>
              <p className="text-kenya-brown-light">Try adjusting your search criteria</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="posts">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl text-white mb-2">No posts found</h3>
              <p className="text-kenya-brown-light">Try adjusting your search criteria</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="people">
          <div className="text-center py-12">
            <h3 className="text-xl text-white mb-2">People search coming soon</h3>
            <p className="text-kenya-brown-light">We're working on this feature!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Search;
