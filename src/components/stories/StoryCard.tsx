
import React from 'react';
import { formatDistance } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Trash2 } from 'lucide-react';
import { useStoryLike } from '@/hooks/use-stories';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Story } from '@/lib/story/types';

interface StoryCardProps {
  story: Story;
  onDelete?: (storyId: number) => void;
  showActions?: boolean;
  className?: string;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onDelete, showActions = true, className }) => {
  const { hasLiked, toggleLike, isToggling } = useStoryLike(story.id);
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get the current user ID
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      }
    };

    fetchUser();
  }, []);

  const isOwner = currentUser === story.user_id;
  const initials = story.user_name 
    ? story.user_name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : '?';

  return (
    <Card className={cn("overflow-hidden flex flex-col border-none bg-kenya-brown bg-opacity-20", className)}>
      {story.media_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={story.media_url} 
            alt={story.caption || 'Story media'} 
            className="w-full h-full object-cover"
          />
          {story.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white text-sm font-medium">{story.caption}</p>
            </div>
          )}
        </div>
      )}
      
      <CardContent className={cn(
        "flex-1 p-4",
        !story.media_url && "bg-gradient-to-b from-kenya-orange/30 to-kenya-brown/30 h-48 flex items-center justify-center"
      )}>
        {!story.media_url ? (
          <p className="text-white text-lg px-4 text-center italic">"{story.content}"</p>
        ) : (
          <p className="text-white text-sm line-clamp-3">{story.content}</p>
        )}
        
        {story.hashtags && story.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {story.hashtags.map((tag, index) => (
              <span key={index} className="text-kenya-orange text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex-col items-stretch p-3 gap-3 bg-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border border-kenya-brown">
              {story.user_image ? (
                <AvatarImage src={story.user_image} alt={story.user_name || 'User'} />
              ) : (
                <AvatarFallback className="bg-kenya-brown text-white text-xs">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm leading-tight">
                {story.user_name || 'Anonymous'}
              </p>
              <p className="text-kenya-brown-light text-xs">
                {formatDistance(new Date(story.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {showActions && isOwner && onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(story.id)} 
              className="text-kenya-brown-light hover:text-white hover:bg-red-900"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center justify-between text-kenya-brown-light text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLike()}
              disabled={isToggling}
              className={cn(
                "flex items-center gap-1 text-xs font-normal h-auto py-1",
                hasLiked && "text-kenya-orange"
              )}
            >
              <Heart size={14} className={cn(hasLiked && "fill-kenya-orange")} />
              <span>{story.likes_count || 0}</span>
            </Button>
            
            <Link to={`/story/${story.id}`} className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs font-normal h-auto py-1"
              >
                <MessageSquare size={14} />
                <span>{story.comments_count || 0}</span>
              </Button>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default StoryCard;
