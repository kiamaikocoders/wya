
export interface Story {
  id: number;
  user_id: string;
  event_id?: number;  // Make optional to match both implementations
  content: string;
  caption?: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_image?: string;
  likes_count?: number;
  comments_count?: number;
  hashtags?: string[];
  status?: string;
  is_featured?: boolean;
  expires_at?: string;
}

export interface StoryComment {
  id: number;
  user_id: string;
  story_id: number;
  content: string;
  created_at: string;
  user_name?: string;
  user_image?: string;
}

export interface CreateStoryDto {
  event_id?: number;
  content: string;
  caption?: string;
  media_url?: string;
  media_type?: string;
  hashtags?: string[];
}

export interface CreateStoryCommentDto {
  story_id: number;
  content: string;
}
