import React from 'react';
import { Story } from '@/lib/story/types';
import StoryCarousel from '@/components/stories/StoryCarousel';

interface EventDiscoverBlockProps {
  event: { // Assuming we have event data linked to stories
    id: number;
    title: string;
    // other event details as needed
  };
  stories: Story[]; // Stories filtered for this specific event
}

const EventDiscoverBlock: React.FC<EventDiscoverBlockProps> = ({ event, stories }) => {
  if (!stories || stories.length === 0) {
    return null; // Don't render if there are no stories for this event
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">{event.title}</h2>
      {/* Use the existing StoryCarousel for horizontal scroll */}
      <StoryCarousel stories={stories} />
    </div>
  );
};

export default EventDiscoverBlock; 