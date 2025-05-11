
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  Sponsor, 
  EventSponsor, 
  SponsorZone, 
  SponsorContentBlock,
  SponsorContentBlockType
} from './types';

export const sponsorService = {
  getAllSponsors: async (): Promise<Sponsor[]> => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('partnership_level', { ascending: true });
        
      if (error) throw error;
      return data as Sponsor[];
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      toast.error('Failed to load sponsors');
      return [];
    }
  },
  
  getSponsorById: async (sponsorId: number): Promise<Sponsor | null> => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', sponsorId)
        .single();
        
      if (error) throw error;
      return data as Sponsor;
    } catch (error) {
      console.error(`Error fetching sponsor ${sponsorId}:`, error);
      toast.error('Failed to load sponsor details');
      return null;
    }
  },
  
  getEventSponsors: async (eventId: number): Promise<EventSponsor[]> => {
    try {
      const { data, error } = await supabase
        .from('event_sponsors')
        .select(`
          *,
          sponsor:sponsors(*)
        `)
        .eq('event_id', eventId);
        
      if (error) throw error;
      return data as EventSponsor[];
    } catch (error) {
      console.error(`Error fetching sponsors for event ${eventId}:`, error);
      toast.error('Failed to load event sponsors');
      return [];
    }
  },
  
  getSponsorZone: async (sponsorId: number): Promise<SponsorZone | null> => {
    try {
      // First get the sponsor zone
      const { data: zoneData, error: zoneError } = await supabase
        .from('sponsor_zones')
        .select('*')
        .eq('sponsor_id', sponsorId)
        .single();
        
      if (zoneError) throw zoneError;
      
      if (!zoneData) return null;
      
      // Then get the content blocks for this zone
      const { data: blocksData, error: blocksError } = await supabase
        .from('sponsor_content_blocks')
        .select('*')
        .eq('zone_id', zoneData.id)
        .order('order_position', { ascending: true });
        
      if (blocksError) throw blocksError;
      
      // Combine the data
      const sponsorZone: SponsorZone = {
        ...zoneData,
        content_blocks: blocksData as SponsorContentBlock[]
      };
      
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
      // In a real implementation, we would store these interactions in a table
      // For now, we'll just log them
      console.log(`User ${userId} interacted with ${type} (content block ${contentBlockId}):`, data);
      toast.success(`Your ${type} submission was recorded!`);
      
      // This would be the actual implementation with Supabase
      /* 
      await supabase.from('sponsor_interactions').insert({
        user_id: userId,
        content_block_id: contentBlockId,
        interaction_type: type,
        interaction_data: data
      });
      */
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
      // In a real implementation, we would query analytics data from the database
      // For now, we'll return mock data
      return {
        impressions: 2547,
        interactions: 842,
        clickThroughs: 386,
        pollResponses: 213,
        quizCompletions: 124,
        giveawayEntries: 437,
        checkIns: 195,
      };
      
      // This would be the actual implementation with Supabase
      /*
      const { data, error } = await supabase.rpc('get_sponsor_analytics', {
        p_sponsor_id: sponsorId,
        p_event_id: eventId,
        p_period: period
      });
      
      if (error) throw error;
      return data;
      */
    } catch (error) {
      console.error(`Error fetching analytics for sponsor ${sponsorId}:`, error);
      toast.error('Failed to load sponsor analytics');
      return {};
    }
  }
};
