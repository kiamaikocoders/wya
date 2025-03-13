
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import { storyService, CreateStoryDto } from '@/lib/story-service';
import { Calendar, MapPin, User, Tag, Clock, ArrowLeft, Edit, Trash, MessageSquare, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistance } from 'date-fns';
import StoryCarousel from '@/components/stories/StoryCarousel';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [storyContent, setStoryContent] = useState('');
  const [storyMedia, setStoryMedia] = useState<string | undefined>(undefined);
  
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(Number(eventId)),
    enabled: !!eventId,
  });

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', eventId],
    queryFn: () => storyService.getStoriesByEventId(Number(eventId)),
    enabled: !!eventId,
  });

  const createStoryMutation = useMutation({
    mutationFn: (newStory: CreateStoryDto) => storyService.createStory(newStory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', eventId] });
      setStoryContent('');
      setStoryMedia(undefined);
      toast.success('Story posted successfully');
    },
    onError: (error) => {
      toast.error('Failed to post story');
      console.error('Error posting story:', error);
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: number) => storyService.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', eventId] });
      toast.success('Story deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete story');
      console.error('Error deleting story:', error);
    },
  });

  const handleDeleteEvent = async () => {
    if (!eventId) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(Number(eventId));
        navigate('/events');
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleSubmitStory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storyContent.trim()) {
      toast.error('Story content cannot be empty');
      return;
    }
    
    if (!eventId) return;
    
    const newStory: CreateStoryDto = {
      event_id: Number(eventId),
      content: storyContent,
      media_url: storyMedia,
    };
    
    createStoryMutation.mutate(newStory);
  };

  const handleDeleteStory = (storyId: number) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStoryMutation.mutate(storyId);
    }
  };

  const isOwner = user?.id === event?.organizer_id;

  if (eventLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-white text-xl font-bold mb-4">Event not found</h1>
        <p className="text-kenya-brown-light mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 bg-kenya-orange text-white py-2 px-4 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>
      </div>
    );
  }

  const timeAgo = formatDistance(
    new Date(event.created_at),
    new Date(),
    { addSuffix: true }
  );

  // Format stories for the carousel
  const hasStories = stories && stories.length > 0;

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="relative">
        {/* Event Image Banner */}
        <div 
          className="w-full h-60 md:h-80 bg-center bg-cover bg-no-repeat relative"
          style={{ backgroundImage: event.image_url ? `url(${event.image_url})` : undefined, backgroundColor: '#2A231D' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-kenya-dark"></div>
          
          <button
            onClick={() => navigate('/events')}
            className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-full text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Event Category */}
        <div className="absolute bottom-0 left-0 translate-y-1/2 ml-4">
          <span className="bg-kenya-orange text-kenya-dark text-sm font-medium py-1 px-3 rounded-full">
            {event.category}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-white text-2xl md:text-3xl font-bold mb-3">{event.title}</h1>
        
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Calendar size={18} />
            <span>{event.date}</span>
          </div>
          
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <MapPin size={18} />
            <span>{event.location}</span>
          </div>
          
          {event.price !== undefined && (
            <div className="flex items-center gap-2 text-kenya-brown-light">
              <Tag size={18} />
              <span>{event.price === 0 ? 'Free' : `Ksh ${event.price}`}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Clock size={18} />
            <span>Posted {timeAgo}</span>
          </div>
        </div>
        
        {/* Description */}
        <div className="bg-kenya-dark bg-opacity-50 rounded-xl p-4 mb-6">
          <h2 className="text-white text-lg font-semibold mb-2">About this event</h2>
          <p className="text-kenya-brown-light whitespace-pre-line">{event.description}</p>
        </div>
        
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white text-lg font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <span key={index} className="bg-kenya-brown bg-opacity-30 text-kenya-brown-light text-xs py-1 px-3 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Stories Section */}
        <div className="mt-8 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">Event Stories</h2>
          
          {/* Stories Carousel */}
          {hasStories && !storiesLoading && (
            <div className="mb-6">
              <StoryCarousel stories={stories} />
            </div>
          )}
          
          {/* Story Form */}
          {isAuthenticated && (
            <form onSubmit={handleSubmitStory} className="mb-6 bg-kenya-brown bg-opacity-20 p-4 rounded-xl">
              <div className="mb-3">
                <textarea
                  className="w-full bg-kenya-dark bg-opacity-50 border border-kenya-brown-light border-opacity-30 rounded-lg p-3 text-white placeholder:text-kenya-brown-light"
                  rows={3}
                  placeholder="Share your experience..."
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toast.info('Media upload coming soon')}
                  className="flex items-center gap-2 bg-kenya-brown text-white py-2 px-4 rounded-lg"
                >
                  <Image size={16} />
                  Add Media
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-kenya-orange text-white py-2 px-4 rounded-lg font-medium"
                  disabled={createStoryMutation.isPending}
                >
                  {createStoryMutation.isPending ? 'Posting...' : 'Post Story'}
                </button>
              </div>
            </form>
          )}
          
          {/* Stories List */}
          {storiesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kenya-orange"></div>
            </div>
          ) : stories && stories.length > 0 ? (
            <div className="space-y-4">
              {stories.map((story) => (
                <div key={story.id} className="bg-kenya-brown bg-opacity-20 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-kenya-brown rounded-full flex items-center justify-center">
                        {story.user_image ? (
                          <img 
                            src={story.user_image} 
                            alt={story.user_name || 'User'} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{story.user_name || 'Anonymous'}</p>
                        <p className="text-kenya-brown-light text-xs">
                          {formatDistance(new Date(story.created_at), new Date(), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {user?.id === story.user_id && (
                      <button 
                        onClick={() => handleDeleteStory(story.id)}
                        className="text-kenya-brown-light hover:text-white"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-white mb-3">{story.content}</p>
                  
                  {story.media_url && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={story.media_url} 
                        alt="Story media" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-kenya-brown-light">
                    <button 
                      onClick={() => toast.info('Like functionality coming soon')}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span className="text-sm">{story.likes_count || 0} Likes</span>
                    </button>
                    <button 
                      onClick={() => toast.info('Comment functionality coming soon')}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <MessageSquare size={14} />
                      <span className="text-sm">{story.comments_count || 0} Comments</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-kenya-brown-light">No stories yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
        
        {/* Owner Actions */}
        {isAuthenticated && isOwner && (
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => toast.info('Edit functionality coming soon')}
              className="flex-1 flex items-center justify-center gap-2 bg-kenya-brown text-white py-3 rounded-lg"
            >
              <Edit size={16} />
              Edit Event
            </button>
            <button 
              onClick={handleDeleteEvent}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg"
            >
              <Trash size={16} />
              Delete Event
            </button>
          </div>
        )}
        
        {/* Attendance Actions */}
        {isAuthenticated && !isOwner && (
          <button 
            onClick={() => toast.info('RSVP functionality coming soon')}
            className="w-full bg-kenya-orange text-white py-3 rounded-lg font-medium mt-4"
          >
            RSVP to this event
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
