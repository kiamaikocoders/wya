
import { apiClient } from '../api-client';
import { toast } from 'sonner';
import type { 
  Sponsor, 
  EventSponsor, 
  SponsorZone, 
  SponsorContentBlock,
  SponsorContentBlockType
} from './types';
import { SAMPLE_SPONSORS, SAMPLE_EVENT_SPONSORS, SAMPLE_SPONSOR_ZONES } from './mock-data';

export const sponsorService = {
  getAllSponsors: async (): Promise<Sponsor[]> => {
    try {
      return SAMPLE_SPONSORS;
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      toast.error('Failed to load sponsors');
      return [];
    }
  },
  
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
  
  getEventSponsors: async (eventId: number): Promise<EventSponsor[]> => {
    try {
      return SAMPLE_EVENT_SPONSORS.filter(es => es.event_id === eventId);
    } catch (error) {
      console.error(`Error fetching sponsors for event ${eventId}:`, error);
      toast.error('Failed to load event sponsors');
      return [];
    }
  },
  
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
  
  submitSponsorInteraction: async (
    userId: string | number,
    contentBlockId: number,
    type: 'poll' | 'quiz' | 'giveaway' | 'click',
    data: Record<string, any>
  ): Promise<void> => {
    try {
      console.log(`User ${userId} interacted with ${type} (content block ${contentBlockId}):`, data);
      toast.success(`Your ${type} submission was recorded!`);
    } catch (error) {
      console.error(`Error submitting ${type} response:`, error);
      toast.error(`Failed to submit your ${type} response`);
    }
  },
  
  getSponsorAnalytics: async (
    sponsorId: number,
    eventId?: number,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Record<string, any>> => {
    try {
      return {
        impressions: 2547,
        interactions: 842,
        clickThroughs: 386,
        pollResponses: 213,
        quizCompletions: 124,
        giveawayEntries: 437,
        checkIns: 195,
      };
    } catch (error) {
      console.error(`Error fetching analytics for sponsor ${sponsorId}:`, error);
      toast.error('Failed to load sponsor analytics');
      return {};
    }
  }
};
