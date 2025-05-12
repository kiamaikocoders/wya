
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { storyService, type Story } from '@/lib/story';
import StoryCarousel from '@/components/stories/StoryCarousel';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AIStoryGenerator from '@/components/stories/AIStoryGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string>("");
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  
  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: storyService.getAllStories,
  });

  const handleCreateStory = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a story');
      navigate('/login');
      return;
    }
    
    toast.info('Story creation coming soon!');
  };
  
  const handleAIGenerate = (text: string) => {
    setAiGeneratedContent(text);
    setIsAIDialogOpen(false);
    toast.success('AI content ready to use in your story!');
    
    navigator.clipboard.writeText(text);
    toast.info('Content copied to clipboard! You can paste it when creating your story.');
  };

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl md:text-3xl font-bold">Event Stories</h1>
          <div className="flex gap-2">
            <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-kenya-brown/20 text-white border-kenya-orange/50 hover:bg-kenya-brown/30 flex items-center gap-2"
                >
                  <Sparkles size={16} className="text-kenya-orange" />
                  AI Assist
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>AI Story Assistant</DialogTitle>
                </DialogHeader>
                <AIStoryGenerator onGenerate={handleAIGenerate} />
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={handleCreateStory}
              className="bg-kenya-orange text-white hover:bg-kenya-orange/90 flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Share Story
            </Button>
          </div>
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
            <div className="mb-12">
              <StoryCarousel stories={stories} />
            </div>

            {aiGeneratedContent && (
              <div className="mb-8 bg-kenya-orange/10 p-4 rounded-lg border border-kenya-orange/30">
                <h3 className="text-white text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-kenya-orange" />
                  Your AI-Generated Content
                </h3>
                <p className="text-white/80">{aiGeneratedContent}</p>
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-kenya-orange border-kenya-orange/50 hover:bg-kenya-orange/10"
                    onClick={() => {
                      navigator.clipboard.writeText(aiGeneratedContent);
                      toast.success('Copied to clipboard!');
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-16">
              {eventBackgrounds.map((event) => (
                <div key={event.id} className="relative">
                  <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
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
