import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import { eventService, Event } from '@/lib/event-service';
import EventSpotlightBlock from '@/components/spotlight/EventSpotlightBlock';
import { Story } from '@/lib/story/types';

const SpotlightPage = () => {
  // Fetch all stories
  const { data: stories, isLoading: isLoadingStories, error: storiesError } = useQuery<Story[]>({
    queryKey: ['allStories'],
    queryFn: () => storyService.getAllStories(),
  });

  // Fetch all events
  const { data: events, isLoading: isLoadingEvents, error: eventsError } = useQuery<Event[]>({
    queryKey: ['allEvents'],
    queryFn: () => eventService.getAllEvents(),
  });

  if (isLoadingStories || isLoadingEvents) {
    return <div className="container mx-auto py-8 text-white">Loading Spotlight...</div>;
  }

  if (storiesError || eventsError) {
    return <div className="container mx-auto py-8 text-red-500">Error loading spotlight data.</div>;
  }

  if (!stories || stories.length === 0) {
    return <div className="container mx-auto py-8 text-gray-400">No stories available for the spotlight.</div>;
  }

  if (!events || events.length === 0) {
      return <div className="container mx-auto py-8 text-gray-400">No events available to display spotlight stories.</div>;
  }

  // Group stories by event_id
  const storiesByEvent = stories.reduce((acc, story) => {
    if (story.event_id) {
      if (!acc[story.event_id]) {
        acc[story.event_id] = [];
      }
      acc[story.event_id].push(story);
    }
    return acc;
  }, {} as Record<number, Story[]>);

  // Filter events to only include those with stories and maintain order from events fetch
  const eventsWithStories = events.filter(event => storiesByEvent[event.id] && storiesByEvent[event.id].length > 0);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-kenya-orange mb-8">Spotlight</h1>
      
      {eventsWithStories.length === 0 && (
          <div className="text-center text-gray-400">No events with stories available at the moment.</div>
      )}

      {/* Implement vertical scroll for events here */}
      <div className="space-y-12">
        {eventsWithStories.map(event => (
          <EventSpotlightBlock 
            key={event.id} 
            event={event} 
            stories={storiesByEvent[event.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default SpotlightPage; 