import React from 'react';
import { Story } from '@/lib/story';
import { formatDistance } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { User, MessageSquare, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryCarouselProps {
  stories: Story[];
  className?: string;
}

const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories, className }) => {
  if (!stories || stories.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {stories.map((story) => (
            <CarouselItem key={story.id} className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <Card className="overflow-hidden h-80 bg-kenya-brown bg-opacity-20 border-0">
                <CardContent className="p-0 h-full flex flex-col">
                  {story.media_url ? (
                    <div className="h-2/3 overflow-hidden">
                      <img 
                        src={story.media_url} 
                        alt="Story media" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-1/2 bg-gradient-to-b from-kenya-orange/30 to-kenya-brown/30 flex items-center justify-center">
                      <p className="text-white text-lg px-4 text-center italic">"{story.content.substring(0, 50)}{story.content.length > 50 ? '...' : ''}"</p>
                    </div>
                  )}
                  
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-kenya-brown rounded-full flex items-center justify-center">
                          {story.user_image ? (
                            <img 
                              src={story.user_image} 
                              alt={story.user_name || 'User'} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm leading-tight">{story.user_name || 'Anonymous'}</p>
                          <p className="text-kenya-brown-light text-xs">
                            {formatDistance(new Date(story.created_at), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-white text-sm line-clamp-2">
                        {story.content}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-kenya-brown-light text-xs mt-3">
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        <span>{story.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        <span>{story.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-0" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-0" />
      </Carousel>
    </div>
  );
};

export default StoryCarousel;
