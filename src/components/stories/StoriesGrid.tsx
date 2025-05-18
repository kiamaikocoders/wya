
import React from 'react';
import { Story } from '@/lib/story/types';
import StoryCard from './StoryCard';

interface StoriesGridProps {
  stories: Story[];
  onDelete?: (storyId: number) => void;
  showActions?: boolean;
  className?: string;
}

const StoriesGrid: React.FC<StoriesGridProps> = ({ 
  stories, 
  onDelete, 
  showActions = true, 
  className = "" 
}) => {
  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">No stories to display.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stories.map((story) => (
        <StoryCard 
          key={story.id} 
          story={story} 
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default StoriesGrid;
