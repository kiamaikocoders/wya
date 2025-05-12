
export interface Story {
  id: number;
  user_id: string; // Changed from number to string to match Supabase UUID
  event_id: number;
  caption: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video';
  likes_count: number;
  comments_count: number; // Ensure this field is present
  created_at: string;
  user_name?: string; // Added for UI display
  user_image?: string; // Added for UI display
}

export interface CreateStoryDto {
  event_id: number;
  content: string;
  media_url: string;
}

export interface StoryComment {
  id: number;
  story_id: number;
  user_id: string; // Changed from number to string to match Supabase UUID
  content: string;
  created_at: string;
  user_name?: string; // Added for UI display
  user_image?: string; // Added for UI display
}
