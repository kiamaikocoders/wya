import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import { eventService, Event } from '@/lib/event-service';
import { forumService } from '@/lib/forum-service';
import EventSpotlightBlock from '@/components/spotlight/EventSpotlightBlock';
import StoryReels from '@/components/spotlight/StoryReels';
import { Story } from '@/lib/story/types';
import { Button } from '@/components/ui/button';
import { Grid, List, Heart, MessageCircle, Eye, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SpotlightPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'reels'>('grid');
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  
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

  // Fetch forum posts
  const { data: forumPosts, isLoading: isLoadingForum, error: forumError } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => forumService.getAllPosts(),
  });

  if (isLoadingStories || isLoadingEvents || isLoadingForum) {
    return <div className="container mx-auto py-8 text-white">Loading Spotlight...</div>;
  }

  if (storiesError || eventsError || forumError) {
    return <div className="container mx-auto py-8 text-red-500">Error loading spotlight data.</div>;
  }

  // Combine stories and forum posts into a unified feed
  const allContent = [
    ...(stories || []).map(story => ({
      ...story,
      type: 'story' as const,
      user_name: story.user_name || 'Anonymous',
      user_image: story.user_image || null,
      views_count: 0, // Stories don't have views_count
    })),
    ...(forumPosts || []).map(post => ({
      id: post.id,
      content: post.content,
      media_url: post.media_url,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      views_count: post.views_count || 0,
      created_at: post.created_at,
      user_name: post.user?.username || 'Anonymous',
      user_image: post.user?.avatar_url || null,
      type: 'forum' as const,
      title: post.title,
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Group stories by event_id for grid view
  const storiesByEvent = (stories || []).reduce((acc, story) => {
    if (story.event_id) {
      if (!acc[story.event_id]) {
        acc[story.event_id] = [];
      }
      acc[story.event_id].push(story);
    }
    return acc;
  }, {} as Record<number, Story[]>);

  // Filter events to only include those with stories
  const eventsWithStories = (events || []).filter(event => storiesByEvent[event.id] && storiesByEvent[event.id].length > 0);

  // Handle story selection for reels view
  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setViewMode('reels');
  };

  const handleCloseReels = () => {
    setSelectedStoryIndex(null);
    setViewMode('grid');
  };

  if (allContent.length === 0) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center text-gray-400">
          <h2 className="text-2xl font-bold mb-4">No content available</h2>
          <p>Check back later for stories and posts from the WYA community!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kenya-dark">
      {viewMode === 'reels' && selectedStoryIndex !== null ? (
        <StoryReels 
          stories={allContent} 
          initialIndex={selectedStoryIndex}
          onClose={handleCloseReels}
        />
      ) : (
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-kenya-orange">Spotlight</h1>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'reels' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('reels')}
                className="flex items-center gap-2"
              >
                <List size={16} />
                Reels
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid size={16} />
                Grid
              </Button>
            </div>
          </div>
          
          {/* Instagram-style grid view */}
          <div className="grid grid-cols-3 gap-2">
            {allContent.map((item, index) => (
              <Card 
                key={`${item.type}-${item.id}`}
                className="bg-kenya-dark border-kenya-brown/20 hover:border-kenya-brown/40 transition-colors cursor-pointer group"
                onClick={() => handleStoryClick(index)}
              >
                <CardContent className="p-0 relative">
                  {/* Media */}
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    {item.media_url ? (
                      <img
                        src={item.media_url}
                        alt={item.type === 'forum' ? item.title : item.content}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-kenya-brown/20 flex items-center justify-center">
                        <span className="text-kenya-brown-light text-sm">No media</span>
                      </div>
                    )}
                    
                    {/* Overlay with engagement stats */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                      <div className="flex items-center gap-3 text-white text-sm">
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          <span>{item.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          <span>{item.comments_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{item.views_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* User info */}
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={item.user_image || ''} />
                        <AvatarFallback className="bg-kenya-brown text-white text-xs">
                          {item.user_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-kenya-brown-light truncate">
                        {item.user_name}
                      </span>
                    </div>
                    {item.type === 'forum' && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {item.title}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotlightPage; 