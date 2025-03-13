
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyService } from '@/lib/story-service';
import StoryCarousel from '@/components/stories/StoryCarousel';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Event background images for stories
const eventBackgrounds = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    title: 'Music Festivals',
    description: 'Celebrate the rhythm of Kenya with vibrant music events',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    title: 'Cultural Exhibitions',
    description: 'Explore the rich cultural heritage of Kenya',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    title: 'Food & Drink Festivals',
    description: 'Taste the flavors of Kenya through culinary events',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    title: 'Art Exhibitions',
    description: 'Experience the creativity of Kenyan artists',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    title: 'Sports Events',
    description: 'Feel the excitement of sports competitions in Kenya',
  },
];

const Stories: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Fetch all stories
  const { data: stories, isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: storyService.getAllStories,
  });

  const handleCreateStory = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a story');
      navigate('/login');
      return;
    }
    
    // Navigate to event selection or directly to story creation
    toast.info('Story creation coming soon!');
  };

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl md:text-3xl font-bold">Event Stories</h1>
          <Button 
            onClick={handleCreateStory}
            className="bg-kenya-orange text-white hover:bg-kenya-orange/90 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Share Story
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-white p-4 rounded-lg text-center">
            <p>Failed to load stories. Please try again later.</p>
          </div>
        ) : (
          <>
            {/* Featured Stories Carousel */}
            <div className="mb-12">
              <StoryCarousel stories={stories || []} />
            </div>

            {/* Event Background Sections */}
            <div className="space-y-16">
              {eventBackgrounds.map((event) => (
                <div key={event.id} className="relative">
                  {/* Background Image with Gradient Overlay */}
                  <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                      <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">{event.title}</h2>
                      <p className="text-white/80 max-w-lg">{event.description}</p>
                      
                      <div className="mt-4">
                        <Button 
                          onClick={() => navigate('/events')}
                          variant="outline" 
                          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                        >
                          Explore Events
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Event-specific Stories */}
                  <div className="mt-8">
                    <h3 className="text-white text-xl font-semibold mb-4">Latest Stories</h3>
                    {stories && stories.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stories.slice(0, 3).map((story) => (
                          <div key={story.id} className="bg-kenya-brown bg-opacity-20 p-4 rounded-xl">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-kenya-brown rounded-full flex items-center justify-center">
                                {story.user_image ? (
                                  <img 
                                    src={story.user_image} 
                                    alt={story.user_name || 'User'} 
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-kenya-orange/50 flex items-center justify-center text-white font-medium">
                                    {story.user_name ? story.user_name[0].toUpperCase() : 'U'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">{story.user_name || 'Anonymous'}</p>
                              </div>
                            </div>
                            
                            <p className="text-white mb-3 line-clamp-3">{story.content}</p>
                            
                            {story.media_url && (
                              <div className="mb-3 rounded-lg overflow-hidden h-40">
                                <img 
                                  src={story.media_url} 
                                  alt="Story media" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-kenya-brown-light text-center py-4">No stories yet for this event category.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Stories;
