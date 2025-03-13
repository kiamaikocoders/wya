
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

interface NewPostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  eventId?: number;
}

const NewPostForm: React.FC<NewPostFormProps> = ({ onSuccess, onCancel, eventId }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(eventId || null);
  
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
  
  const createPostMutation = useMutation({
    mutationFn: forumService.createPost,
    onSuccess: () => {
      onSuccess();
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create post. Please try again.");
      console.error("Error creating post:", error);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="media-url">Media URL (optional)</Label>
        <Input
          id="media-url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="Add image URL"
        />
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
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createPostMutation.isPending}
          className="bg-kenya-orange text-white hover:bg-kenya-orange/90"
        >
          {createPostMutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
};

export default NewPostForm;
