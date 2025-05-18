import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, Event } from '@/lib/event-service';
import { ticketService } from '@/lib/ticket-service';
import { storyService } from '@/lib/story/story-service';
import { CreateStoryDto } from '@/lib/story/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Link2, Share2, ImagePlus, Loader2, Heart, HeartOff, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { StoryModal } from '@/components/StoryModal';
import EventSponsorsSection from '@/components/sponsors/EventSponsorsSection';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/utils/event-utils';
import { useEvents } from '@/hooks/use-events';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(Number(eventId)),
    enabled: !!eventId,
  });
  
  const { data: eventStories, isLoading: storiesLoading } = useQuery({
    queryKey: ['eventStories', eventId],
    queryFn: () => storyService.getEventStories(Number(eventId)),
    enabled: !!eventId,
  });
  
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['eventTickets', eventId],
    queryFn: () => ticketService.getEventTickets(Number(eventId)),
    enabled: !!eventId,
  });
  
  const createStoryMutation = useMutation({
    mutationFn: (storyData: CreateStoryDto) => storyService.createStory(storyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventStories', eventId] });
      setIsStoryModalOpen(false);
      toast.success('Your story has been shared!');
    },
    onError: (error) => {
      console.error('Error sharing story:', error);
      toast.error('Failed to share story');
    },
  });
  
  useEffect(() => {
    if (event) {
      setShareLink(window.location.href);
    }
  }, [event]);
  
  useEffect(() => {
    // Mock check if event is in favorites
    // In a real app, you'd check against a user's saved events
    setIsFavorite(false);
  }, [eventId]);
  
  const handleShareStory = async (data: CreateStoryDto) => {
    try {
      // Create proper story data that matches the Story type
      const storyData = {
        event_id: data.event_id,
        user_id: user?.id || '',
        caption: data.content,
        content: data.content,
        media_url: data.media_url,
        media_type: 'image' as const,
        likes_count: 0,
        comments_count: 0
      };
      
      await storyService.createStory(storyData);
      queryClient.invalidateQueries({ queryKey: ['eventStories', eventId] });
      setIsStoryModalOpen(false);
      toast.success('Your story has been shared!');
    } catch (error) {
      console.error('Error sharing story:', error);
    }
  };
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      toast.success('Event added to saved list');
    } else {
      toast.success('Event removed from saved list');
    }
    // In a real app, you'd call a mutation to save/unsave the event
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-4">Event not found</h1>
        <p className="text-kenya-brown-light mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Event Image and Social Actions */}
      <div className="relative">
        <div 
          className="w-full h-64 bg-cover bg-center relative" 
          style={{ backgroundImage: `url(${event.image_url})` }}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              {isFavorite ? (
                <Heart size={20} className="text-red-500 fill-red-500" />
              ) : (
                <HeartOff size={20} />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={20} />
            </Button>
          </div>
        </div>
        
        {/* Event Details */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-kenya-dark to-transparent text-white">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-2 text-sm mt-1">
            <Calendar size={16} />
            {format(new Date(event.date), 'PPP')}
            <MapPin size={16} className="ml-2" />
            {event.location}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Event Description */}
          <div className="md:col-span-2 space-y-4">
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <CardTitle>About this Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-kenya-brown-light">{event.description}</p>
              </CardContent>
            </Card>
            
            {/* Stories Section */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Stories</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsStoryModalOpen(true)}>
                  <ImagePlus size={16} className="mr-2" />
                  Share Your Story
                </Button>
              </CardHeader>
              <CardContent>
                {storiesLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin h-4 w-4" />
                  </div>
                ) : eventStories && eventStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eventStories.map(story => (
                      <Card key={story.id} className="bg-kenya-brown/10 border-kenya-brown/20">
                        <div className="h-32 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${story.media_url})` }}></div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={story.user_image} alt={story.user_name || 'User'} />
                              <AvatarFallback>{story.user_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-sm">{story.user_name || 'Anonymous'}</CardTitle>
                          </div>
                          <CardDescription className="text-xs text-kenya-brown-light">{format(new Date(story.created_at), 'MMM dd, yyyy')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-kenya-brown-light line-clamp-3">{story.caption}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-xs text-kenya-brown-light">
                            <Heart size={14} className="fill-red-500 text-red-500" />
                            {story.likes_count}
                            <MessageSquare size={14} />
                            {story.comments_count}
                          </div>
                          <Button variant="link" size="sm">
                            View More
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-kenya-brown-light">No stories yet. Be the first to share!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Event Details Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{format(new Date(event.date), 'PPPP, hh:mm a')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{event.capacity} Spots Available</span>
                  </div>
                )}
                {event.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                )}
                {event.price && (
                  <div className="flex items-center gap-2">
                    <span>Price: ${event.price}</span>
                  </div>
                )}
                <Separator />
                {isAuthenticated ? (
                  <Button className="w-full">Get Tickets</Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">Get Tickets</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-kenya-dark border-kenya-brown/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Login Required</AlertDialogTitle>
                        <AlertDialogDescription>
                          You must be logged in to purchase tickets.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Link to="/login">Login</Link>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
            
            {/* Event Sponsors Section */}
            <EventSponsorsSection eventId={Number(eventId)} />
          </div>
        </div>
      </div>
      
      {/* Story Modal */}
      <StoryModal 
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onSubmit={handleShareStory}
        eventId={Number(eventId)}
      />
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-kenya-dark border-kenya-brown/20 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Share this Event</h2>
            <div className="flex items-center gap-2 mb-4">
              <Input type="text" value={shareLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(shareLink)}>
                <Link2 size={16} />
              </Button>
            </div>
            <Button className="w-full" onClick={() => setIsShareModalOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
