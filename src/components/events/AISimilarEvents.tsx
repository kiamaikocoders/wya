
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import { Event } from '@/types/event.types'; // Import from single source
import { Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface AISimilarEventsProps {
  currentEvent: Event;
}

const AISimilarEvents: React.FC<AISimilarEventsProps> = ({ currentEvent }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  
  // Fetch all events
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });
  
  // Function to find similar events based on category and tags
  const findSimilarEvents = useCallback(() => {
    if (!events || events.length === 0) return [];
    
    setIsLoading(true);
    
    try {
      // Don't include the current event
      const otherEvents = events.filter(event => event.id !== currentEvent.id);
      
      // Score each event for similarity
      const scoredEvents = otherEvents.map(event => {
        let score = 0;
        
        // Category match is a strong signal
        if (event.category === currentEvent.category) {
          score += 5;
        }
        
        // Tag matches - check if tags exist before processing
        if (currentEvent.tags && event.tags) {
          const currentTags = currentEvent.tags;
          const eventTags = event.tags;
          
          currentTags.forEach(tag => {
            if (eventTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
              score += 2;
            }
          });
        }
        
        // Location match is also important
        if (event.location === currentEvent.location) {
          score += 3;
        }
        
        return { event, score };
      });
      
      // Sort by score and get top 3
      const sorted = scoredEvents
        .sort((a, b) => b.score - a.score)
        .filter(item => item.score > 0)
        .map(item => item.event)
        .slice(0, 3);
      
      // Use type assertion to avoid type conflicts
      setSimilarEvents(sorted as Event[]);
    } catch (error) {
      console.error('Error finding similar events:', error);
      toast.error('Could not find similar events');
    } finally {
      setIsLoading(false);
    }
  }, [currentEvent, events]);
  
  // Find similar events when component mounts or when events data changes
  useEffect(() => {
    if (events) {
      findSimilarEvents();
    }
  }, [events, findSimilarEvents]);
  
  if (similarEvents.length === 0 && !isLoading) {
    return null; // Don't show anything if no similar events
  }
  
  return (
    <Card className="border-kenya-orange/20 bg-kenya-dark/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          Similar Events You Might Like
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => void findSimilarEvents()}
          disabled={isLoading}
          className="text-white hover:text-kenya-orange hover:bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : similarEvents.length > 0 ? (
          <div className="grid gap-4">
            {similarEvents.map(event => (
              <Link 
                key={event.id} 
                to={`/events/${event.id}`}
                className="block hover:bg-kenya-brown/10 rounded-lg p-3 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={event.image_url} 
                      alt={event.title} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{event.title}</h3>
                    <p className="text-sm text-white/70">{event.date} • {event.location}</p>
                    <p className="text-xs text-kenya-orange mt-1">{event.category}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-white/70 text-center py-2">No similar events found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AISimilarEvents;
