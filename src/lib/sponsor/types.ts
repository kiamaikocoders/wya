
export interface Sponsor {
  id: number;
  name: string;
  description?: string;
  logo_url: string;
  website_url?: string;
  partnership_level: 'title' | 'presenting' | 'gold' | 'silver' | 'bronze' | 'partner';
  created_at: string;
  updated_at: string;
}

export interface EventSponsor {
  id: number;
  event_id: number;
  sponsor_id: number;
  sponsorship_type: 'title' | 'presenting' | 'supporting' | 'partner' | 'media' | 'community';
  sponsor?: Sponsor;
  created_at: string;
}

export interface SponsorZone {
  id: number;
  sponsor_id: number;
  title: string;
  description?: string;
  content_blocks: SponsorContentBlock[];
  created_at: string;
  updated_at: string;
}

export type SponsorContentBlockType = 
  | 'video' 
  | 'product' 
  | 'offer' 
  | 'giveaway' 
  | 'poll' 
  | 'quiz'
  | 'image'
  | 'text';

export interface SponsorContentBlock {
  id: number;
  type: SponsorContentBlockType;
  title?: string;
  description?: string;
  media_url?: string;
  action_url?: string;
  expires_at?: string;
  order: number;
  data?: Record<string, any>;
}
