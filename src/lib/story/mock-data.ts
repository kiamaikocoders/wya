
import { Story } from './types';

export const mockStories: Story[] = [
  {
    id: 1,
    user_id: 1,
    event_id: 1,
    content: "Having an amazing time at the Trade Fair!",
    media_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_name: "John Doe",
    user_image: "https://randomuser.me/api/portraits/men/1.jpg",
    likes_count: 24,
    comments_count: 5,
    has_liked: false
  },
  {
    id: 2,
    user_id: 2,
    event_id: 2,
    content: "Cultural festival was absolutely mind-blowing!",
    media_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2074",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_name: "Mary Smith",
    user_image: "https://randomuser.me/api/portraits/women/2.jpg",
    likes_count: 42,
    comments_count: 7,
    has_liked: true
  },
  {
    id: 3,
    user_id: 3,
    event_id: 5,
    content: "Best New Year's ever at Kilifi Festival!",
    media_url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    user_name: "Alex Johnson",
    user_image: "https://randomuser.me/api/portraits/men/3.jpg",
    likes_count: 67,
    comments_count: 12,
    has_liked: false
  }
];
