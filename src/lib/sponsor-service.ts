
import { apiClient } from './api-client';
import { toast } from 'sonner';

// Sponsor interfaces
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

// Mock data for development
const SAMPLE_SPONSORS: Sponsor[] = [
  {
    id: 1,
    name: 'EABL',
    description: 'East African Breweries Limited - Proudly crafting Kenya\'s finest beverages.',
    logo_url: 'https://placehold.co/200x200?text=EABL',
    website_url: 'https://www.eabl.com',
    partnership_level: 'title',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'SportPesa',
    description: 'Kenya\'s premier sports betting platform.',
    logo_url: 'https://placehold.co/200x200?text=SportPesa',
    website_url: 'https://www.sportpesa.co.ke',
    partnership_level: 'presenting',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Red Bull',
    description: 'Red Bull gives you wings. Energy drink for body and mind.',
    logo_url: 'https://placehold.co/200x200?text=Red+Bull',
    website_url: 'https://www.redbull.com',
    partnership_level: 'gold',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SAMPLE_EVENT_SPONSORS: EventSponsor[] = [
  {
    id: 1,
    event_id: 1,
    sponsor_id: 1,
    sponsorship_type: 'title',
    sponsor: SAMPLE_SPONSORS[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    event_id: 1,
    sponsor_id: 2,
    sponsorship_type: 'presenting',
    sponsor: SAMPLE_SPONSORS[1],
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    event_id: 2,
    sponsor_id: 3,
    sponsorship_type: 'partner',
    sponsor: SAMPLE_SPONSORS[2],
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_SPONSOR_ZONES: SponsorZone[] = [
  {
    id: 1,
    sponsor_id: 1,
    title: 'EABL Zone',
    description: 'Discover the best beverages from East Africa\'s leading brewery.',
    content_blocks: [
      {
        id: 1,
        type: 'video',
        title: 'Crafting Excellence',
        description: 'Discover how EABL creates Kenya\'s finest beverages',
        media_url: 'https://www.youtube.com/watch?v=example',
        order: 1,
      },
      {
        id: 2,
        type: 'product',
        title: 'Featured Products',
        description: 'Explore our award-winning selection',
        media_url: 'https://placehold.co/600x400?text=EABL+Products',
        order: 2,
      },
      {
        id: 3,
        type: 'giveaway',
        title: 'Win a VIP Experience',
        description: 'Enter to win exclusive access to our brewery tour',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        order: 3,
      },
      {
        id: 4,
        type: 'poll',
        title: 'Your Favorite?',
        description: 'What\'s your favorite EABL beverage?',
        data: {
          options: ['Tusker', 'Guinness', 'Smirnoff', 'Johnnie Walker']
        },
        order: 4,
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    sponsor_id: 2,
    title: 'SportPesa Zone',
    description: 'Your gateway to sports betting excitement.',
    content_blocks: [
      {
        id: 5,
        type: 'video',
        title: 'SportPesa Experience',
        description: 'See how SportPesa is changing the game',
        media_url: 'https://www.youtube.com/watch?v=sportpesa-example',
        order: 1,
      },
      {
        id: 6,
        type: 'offer',
        title: 'Special Offer',
        description: 'Get 100% bonus on your first bet',
        action_url: 'https://www.sportpesa.co.ke/promo',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        order: 2,
      },
      {
        id: 7,
        type: 'quiz',
        title: 'Sports Quiz',
        description: 'Test your sports knowledge',
        data: {
          questions: [
            {
              question: 'Which team won the 2022 FIFA World Cup?',
              options: ['Brazil', 'France', 'Argentina', 'Germany'],
              correct: 2
            },
            {
              question: 'Who holds the record for most Premier League goals?',
              options: ['Wayne Rooney', 'Alan Shearer', 'Sergio Aguero', 'Harry Kane'],
              correct: 1
            }
          ]
        },
        order: 3,
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Sponsor service
export const sponsorService = {
  // Get all sponsors
  getAllSponsors: async (): Promise<Sponsor[]> => {
    try {
      // In a real implementation, this would be an API call
      return SAMPLE_SPONSORS;
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      toast.error('Failed to load sponsors');
      return [];
    }
  },
  
  // Get sponsor by ID
  getSponsorById: async (sponsorId: number): Promise<Sponsor | null> => {
    try {
      const sponsor = SAMPLE_SPONSORS.find(s => s.id === sponsorId);
      if (!sponsor) {
        throw new Error(`Sponsor with ID ${sponsorId} not found`);
      }
      return sponsor;
    } catch (error) {
      console.error(`Error fetching sponsor ${sponsorId}:`, error);
      toast.error('Failed to load sponsor details');
      return null;
    }
  },
  
  // Get sponsors for an event
  getEventSponsors: async (eventId: number): Promise<EventSponsor[]> => {
    try {
      // Filter event sponsors by event ID
      return SAMPLE_EVENT_SPONSORS.filter(es => es.event_id === eventId);
    } catch (error) {
      console.error(`Error fetching sponsors for event ${eventId}:`, error);
      toast.error('Failed to load event sponsors');
      return [];
    }
  },
  
  // Get sponsor zone
  getSponsorZone: async (sponsorId: number): Promise<SponsorZone | null> => {
    try {
      const sponsorZone = SAMPLE_SPONSOR_ZONES.find(sz => sz.sponsor_id === sponsorId);
      if (!sponsorZone) {
        throw new Error(`Sponsor zone for sponsor ID ${sponsorId} not found`);
      }
      return sponsorZone;
    } catch (error) {
      console.error(`Error fetching sponsor zone for sponsor ${sponsorId}:`, error);
      toast.error('Failed to load sponsor zone');
      return null;
    }
  },
  
  // Submit a response to a sponsor poll or quiz
  submitSponsorInteraction: async (
    userId: string | number,
    contentBlockId: number,
    type: 'poll' | 'quiz' | 'giveaway' | 'click',
    data: Record<string, any>
  ): Promise<void> => {
    try {
      // In a real implementation, this would be an API call to record the interaction
      console.log(`User ${userId} interacted with ${type} (content block ${contentBlockId}):`, data);
      toast.success(`Your ${type} submission was recorded!`);
    } catch (error) {
      console.error(`Error submitting ${type} response:`, error);
      toast.error(`Failed to submit your ${type} response`);
    }
  },
  
  // Get analytics for a sponsor
  getSponsorAnalytics: async (
    sponsorId: number,
    eventId?: number,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Record<string, any>> => {
    try {
      // Mock analytics data
      const analytics = {
        impressions: 2547,
        interactions: 842,
        clickThroughs: 386,
        pollResponses: 213,
        quizCompletions: 124,
        giveawayEntries: 437,
        checkIns: 195,
      };
      
      return analytics;
    } catch (error) {
      console.error(`Error fetching analytics for sponsor ${sponsorId}:`, error);
      toast.error('Failed to load sponsor analytics');
      return {};
    }
  }
};
