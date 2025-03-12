
import React, { useState } from "react";
import { forumService, CreateForumPostDto } from "@/lib/forum-service";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { eventService } from "@/lib/event-service";
import { useQuery } from "@tanstack/react-query";

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
  
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: eventService.getAllEvents,
  });
  
  const createPostMutation = useMutation({
    mutationFn: forumService.createPost,
    onSuccess: () => {
      onSuccess();
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
          <Select 
            value={selectedEventId?.toString() || ""} 
            onValueChange={(value) => setSelectedEventId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.map(event => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createPostMutation.isPending}
        >
          {createPostMutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
};

export default NewPostForm;
