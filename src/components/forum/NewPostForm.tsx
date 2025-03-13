
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
import { Loader2, Image, Film, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [mediaType, setMediaType] = useState<"image" | "video" | "link">("image");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(eventId || null);
  
  // Sample images and videos for easy insertion
  const sampleImages = [
    "https://images.unsplash.com/photo-1638210574160-1181932279e3?q=80&w=2070",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
    "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80&w=2070"
  ];
  
  const sampleVideos = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=9bZkp7q19f0",
    "https://youtu.be/jNQXAC9IVRw"
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
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          required
          disabled={createPostMutation.isPending}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          rows={5}
          required
          disabled={createPostMutation.isPending}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Media</Label>
        <Tabs defaultValue="image" onValueChange={(value) => setMediaType(value as "image" | "video" | "link")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="image" className="space-y-3">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Enter image URL"
              disabled={createPostMutation.isPending}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sampleImages.map((img, index) => (
                <div 
                  key={index} 
                  className="cursor-pointer rounded-md overflow-hidden h-20 border-2 hover:border-kenya-orange transition-colors"
                  onClick={() => handleSampleMediaSelect(img)}
                >
                  <img src={img} alt={`Sample ${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="video" className="space-y-3">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Enter YouTube or video URL"
              disabled={createPostMutation.isPending}
            />
            <div className="space-y-2">
              {sampleVideos.map((video, index) => (
                <Button 
                  key={index}
                  type="button"
                  variant="outline"
                  className="flex justify-between w-full"
                  onClick={() => handleSampleMediaSelect(video)}
                >
                  <span className="truncate">{video}</span>
                  <Film className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="link">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Enter link URL"
              disabled={createPostMutation.isPending}
            />
          </TabsContent>
        </Tabs>
        
        {mediaUrl && mediaType === "image" && (
          <div className="mt-2 p-2 border rounded-md">
            <img src={mediaUrl} alt="Preview" className="max-h-40 object-contain mx-auto" />
          </div>
        )}
      </div>
      
      {!eventId && (
        <div className="space-y-2">
          <Label htmlFor="event">Related Event</Label>
          {eventsLoading ? (
            <div className="h-10 w-full bg-kenya-brown animate-pulse rounded-md"></div>
          ) : events && events.length > 0 ? (
            <Select 
              value={selectedEventId?.toString() || ""} 
              onValueChange={(value) => setSelectedEventId(Number(value))}
              disabled={createPostMutation.isPending}
            >
              <SelectTrigger className="w-full bg-kenya-brown text-white border-kenya-brown-dark">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent className="bg-kenya-brown text-white border-kenya-brown-dark">
                {events.map(event => (
                  <SelectItem 
                    key={event.id} 
                    value={event.id.toString()}
                    className="hover:bg-kenya-brown-dark focus:bg-kenya-brown-dark"
                  >
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-kenya-brown-light p-2">
              No events available. Please check back later.
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-kenya-brown-light text-kenya-brown-light hover:bg-kenya-brown hover:text-white"
          disabled={createPostMutation.isPending}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createPostMutation.isPending || !isAuthenticated}
          className="bg-kenya-orange text-white hover:bg-kenya-orange/90"
        >
          {createPostMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : "Post"}
        </Button>
      </div>
    </form>
  );
};

export default NewPostForm;
