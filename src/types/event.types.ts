

export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  time?: string; // Optional event start time (HH:MM:SS format)
  location: string;
  image_url: string;
  organizer_id: string;
  created_at: string;
  price?: number;
  featured?: boolean;
  tags: string[];
  capacity?: number;
  is_featured?: boolean;
  latitude?: number;
  longitude?: number;
  performing_artists?: string[]; // Array of performing artist names
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  date: string;
  time?: string; // Optional event start time
  location: string;
  image_url?: string;
  price?: number;
  tags?: string[];
  organizer_id?: string;
  capacity?: number;
  performing_artists?: string[]; // Array of performing artist names
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: number;
}

