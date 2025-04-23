
export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url: string;
  organizer_id: number;
  created_at: string;
  price?: number;
  is_featured?: boolean;
  tags?: string[];
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url?: string;
  price?: number;
  is_featured?: boolean;
  tags?: string[];
  organizer_id?: number;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: number;
}
