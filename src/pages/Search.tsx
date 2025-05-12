import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import { profileService } from '@/lib/profile-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, SearchX } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  
  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });
  
  const { data: profiles, isLoading: isProfilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profileService.searchProfiles(searchTerm),
    enabled: searchTerm.length > 0,
  });
  
  useEffect(() => {
    const initialSearchTerm = searchParams.get('q') || '';
    setSearchTerm(initialSearchTerm);
  }, [searchParams]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredEvents = events
    ? events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  const hasResults = filteredEvents.length > 0 || (profiles && profiles.length > 0);
  const isLoading = isEventsLoading || isProfilesLoading;

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Input
          type="text"
          placeholder="Search events, organizers, and more..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="shadow-sm focus-visible:ring-kenya-orange"
        />
        <Button variant="outline" className="ml-2 shadow-sm">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {searchTerm.length > 0 && !isLoading && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          
          {hasResults ? (
            <>
              {filteredEvents.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-lg mb-3">Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map(event => (
                      <Card key={event.id} className="overflow-hidden">
                        <div className="h-40 relative">
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          {event.tags && event.tags.length > 0 && (
                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                              {event.tags.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="outline" className="bg-black bg-opacity-70 text-white border-0 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1 line-clamp-1">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{formatDate(event.date)} • {event.location}</p>
                          <Button size="sm" asChild className="w-full mt-2">
                            <Link to={`/events/${event.id}`}>View Details</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredEvents.length > 3 && (
                    <div className="text-center mt-4">
                      <Button 
                        variant="outline" 
                        asChild
                        className="border-kenya-orange text-kenya-orange hover:bg-kenya-orange hover:text-white"
                      >
                        <Link to={`/events?q=${searchTerm}`}>
                          See all {filteredEvents.length} events
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {profiles && profiles.length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-3">Organizers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map(profile => (
                      <Card key={profile.id}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || 'User'} />
                            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{profile.full_name}</h4>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <SearchX size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                We couldn't find anything matching "{searchTerm}". Try different keywords or check for typos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
