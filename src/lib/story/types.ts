
export interface Story {
  id: number;
  user_id: string;
  event_id?: number;
  content: string;
  media_url?: string;
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_image?: string;
  likes_count?: number;
  comments_count?: number;
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
  media_url?: string;
}

export interface CreateStoryCommentDto {
  story_id: number;
  content: string;
}
