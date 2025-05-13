
import { Story } from './types';

// Mock data for stories
export const mockStories: Story[] = [
  {
    id: 1,
    user_id: "1",
    event_id: 1,
    content: "Had the best time at the concert. The energy was amazing!",
    caption: "Amazing concert last night!",
    media_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80",
    media_type: "image",
    likes_count: 24,
    comments_count: 5,
    created_at: "2025-04-10T15:30:00Z",
    user_name: "John Doe",
    user_image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 2,
    user_id: "2",
    event_id: 3,
    content: "Just won first place at the tech hackathon!",
    caption: "Tech Hackathon 2025",
    media_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
    media_type: "image",
    likes_count: 42,
    comments_count: 7,
    created_at: "2025-04-09T19:45:00Z",
    user_name: "Sarah Johnson",
    user_image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: 3,
    user_id: "3",
    event_id: 2,
    content: "The best dishes from the food festival this weekend.",
    caption: "Food Festival Highlights",
    media_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    media_type: "image",
    likes_count: 37,
    comments_count: 12,
    created_at: "2025-04-08T12:15:00Z",
    user_name: "Michael Brown",
    user_image: "https://randomuser.me/api/portraits/men/67.jpg"
  }
];
