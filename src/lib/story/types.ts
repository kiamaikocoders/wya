
export interface Story {
  id: number;
  user_id: string;
  event_id: number;
  caption: string;
  content?: string;
  media_url?: string;
  media_type: 'image' | 'video';
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_image?: string;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
}

export interface CreateStoryDto {
  event_id: number;
  content: string;
  media_url?: string;
}

export interface UpdateStoryDto {
  content?: string;
  caption?: string;
  media_url?: string;
}
