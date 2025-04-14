
import React, { useState, useEffect } from "react";
import { forumService, CreateForumPostDto } from "@/lib/forum-service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { eventService } from "@/lib/event-service";
import { Loader2, Image, Film, Link2, X, Upload, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface NewPostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  eventId?: number;
}

const NewPostForm: React.FC<NewPostFormProps> = ({ onSuccess, onCancel, eventId }) => {
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(eventId || null);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  
  // Sample images for easy insertion
  const sampleImages = [
    "https://images.unsplash.com/photo-1638210574160-1181932279e3?q=80&w=2070",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
    "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80&w=2070"
  ];
  
  // Fetch events for the dropdown
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventService.getAllEvents,
  });
  
  // Set the event ID when the component loads or when eventId prop changes
  useEffect(() => {
    if (eventId) {
      setSelectedEventId(eventId);
    }
  }, [eventId]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to create a post");
    }
  }, [isAuthenticated]);
  
  const createPostMutation = useMutation({
    mutationFn: forumService.createPost,
    onSuccess: () => {
      onSuccess();
      toast.success("Post created successfully!");
      setTitle("");
      setContent("");
      setMediaUrl("");
      setPreviewMedia(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to create post. Please try again.";
      toast.error(errorMessage);
      console.error("Error creating post:", error);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to create a post");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please enter a title for your post");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please enter content for your post");
      return;
    }
    
    if (!selectedEventId) {
      toast.error("Please select an event for your post");
      return;
    }
    
    const postData: CreateForumPostDto = {
      title: title.trim(),
      content: content.trim(),
      event_id: selectedEventId,
    };
    
    if (mediaUrl.trim()) {
      postData.media_url = mediaUrl.trim();
    }
    
    createPostMutation.mutate(postData);
  };

  const handleSampleMediaSelect = (url: string) => {
    setMediaUrl(url);
    setPreviewMedia(url);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this file to a server
      // For now, we'll just create a temporary URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewMedia(objectUrl);
      // In a real implementation, you'd set mediaUrl to the URL returned from your server
      setMediaUrl(objectUrl);
    }
  };
  
  const clearMedia = () => {
    setMediaUrl("");
    setPreviewMedia(null);
  };
  
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 p-4">
          {user && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profile_picture || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-kenya-orange text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="border-0 border-b bg-transparent p-0 text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={createPostMutation.isPending}
            />
            
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[100px] border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              rows={4}
              disabled={createPostMutation.isPending}
            />
            
            {previewMedia && (
              <div className="relative">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  onClick={clearMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
                <img 
                  src={previewMedia} 
                  alt="Media preview" 
                  className="rounded-md max-h-[400px] w-full object-cover"
                />
              </div>
            )}
            
            {!eventId && (
              <div className="pt-3">
                <Label htmlFor="event" className="text-muted-foreground text-sm">Related Event</Label>
                {eventsLoading ? (
                  <div className="h-10 w-full bg-muted animate-pulse rounded-md mt-1"></div>
                ) : events && events.length > 0 ? (
                  <Select 
                    value={selectedEventId?.toString() || ""} 
                    onValueChange={(value) => setSelectedEventId(Number(value))}
                    disabled={createPostMutation.isPending}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-muted-foreground p-2 mt-1">
                    No events available.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={createPostMutation.isPending}
          />
          <Label htmlFor="image-upload" className="cursor-pointer">
            <Button type="button" variant="ghost" size="icon" asChild>
              <span>
                <Camera className="h-5 w-5" />
              </span>
            </Button>
          </Label>
          
          <div className="relative group">
            <Button type="button" variant="ghost" size="icon">
              <Image className="h-5 w-5" />
            </Button>
            
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block">
              <div className="bg-background shadow-md rounded-md p-2 w-[280px] grid grid-cols-2 gap-2">
                {sampleImages.map((img, i) => (
                  <div 
                    key={i}
                    className="cursor-pointer h-20 rounded-md overflow-hidden"
                    onClick={() => handleSampleMediaSelect(img)}
                  >
                    <img 
                      src={img} 
                      alt={`Sample ${i+1}`} 
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createPostMutation.isPending}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={createPostMutation.isPending || !title || !content || !selectedEventId}
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : "Post"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NewPostForm;
