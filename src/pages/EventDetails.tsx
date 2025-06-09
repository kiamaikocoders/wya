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
import { Calendar, MapPin, Users, Link2, Share2, ImagePlus, Loader2, Heart, HeartOff, MessageSquare, Clock } from 'lucide-react';
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
    setIsFavorite(false);
  }, [eventId]);
  
  const handleShareStory = async (data: CreateStoryDto) => {
    try {
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
      {/* Hero Section with Event Image */}
      <div className="relative h-80 bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-kenya-dark via-kenya-dark/50 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFavorite} className="bg-black/20 backdrop-blur-sm">
            {isFavorite ? (
              <Heart size={20} className="text-red-500 fill-red-500" />
            ) : (
              <HeartOff size={20} className="text-white" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={() => setIsShareModalOpen(true)} className="bg-black/20 backdrop-blur-sm">
            <Share2 size={20} className="text-white" />
          </Button>
        </div>
        
        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-6xl mx-auto">
            <Badge className="mb-3 bg-kenya-orange/90 text-white">{event.category}</Badge>
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{format(new Date(event.date), 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>{event.capacity} capacity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Highlights/Stories Gallery */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus size={20} />
                  Event Highlights
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsStoryModalOpen(true)}>
                  <ImagePlus size={16} className="mr-2" />
                  Add Story
                </Button>
              </CardHeader>
              <CardContent>
                {storiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6" />
                  </div>
                ) : eventStories && eventStories.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {eventStories.slice(0, 8).map(story => (
                      <div key={story.id} className="aspect-square bg-cover bg-center rounded-lg relative overflow-hidden group cursor-pointer"
                           style={{ backgroundImage: `url(${story.media_url})` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={story.user_image} alt={story.user_name || 'User'} />
                              <AvatarFallback className="text-xs">{story.user_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-white text-xs font-medium">{story.user_name}</span>
                          </div>
                          <p className="text-white text-xs line-clamp-2">{story.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImagePlus size={48} className="mx-auto text-kenya-brown-light mb-4" />
                    <p className="text-kenya-brown-light">No highlights yet. Be the first to share!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* About Event */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <CardTitle>About this Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-kenya-brown-light leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Purchase */}
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Get Tickets</CardTitle>
                  {event.price && (
                    <Badge variant="secondary" className="text-lg font-bold">
                      {event.price === 0 ? 'Free' : `${event.price} KES`}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-kenya-brown-light">Date</span>
                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kenya-brown-light">Time</span>
                    <span>{format(new Date(event.date), 'h:mm a')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kenya-brown-light">Venue</span>
                    <span className="text-right">{event.location}</span>
                  </div>
                </div>
                
                <Separator />
                
                {isAuthenticated ? (
                  <Button className="w-full bg-kenya-orange hover:bg-kenya-orange/90">
                    Get Tickets
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full bg-kenya-orange hover:bg-kenya-orange/90">
                        Get Tickets
                      </Button>
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
