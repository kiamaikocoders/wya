
export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url: string;
  organizer_id: string;
  created_at: string;
  price?: number;
  featured?: boolean;
  tags: string[]; // Ensure this is required, not optional
  capacity?: number;
  is_featured?: boolean; // Adding this as an alias for 'featured' for backward compatibility
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url?: string;
  price?: number;
  tags?: string[];
  organizer_id?: string;
  capacity?: number;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: number;
}
