import { supabase } from '../supabase';
import { Sponsor, EventSponsor, SponsorZone, SponsorContentBlock, SponsorAnalytics } from './types';

export const sponsorService = {
  // Get all sponsors
  getSponsors: async (): Promise<Sponsor[]> => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Sponsor[];
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      throw error;
    }
  },
  
  // Alias for getSponsors (for compatibility)
  getAllSponsors: async (): Promise<Sponsor[]> => {
    return sponsorService.getSponsors();
  },
  
  // Get sponsor by ID
  getSponsorById: async (id: number): Promise<Sponsor> => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Sponsor;
    } catch (error) {
      console.error(`Error fetching sponsor with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Get sponsors for an event
  getEventSponsors: async (eventId: number): Promise<EventSponsor[]> => {
    try {
      const { data, error } = await supabase
        .from('event_sponsors')
        .select('*, sponsor:sponsor_id(*)')
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      return data as EventSponsor[];
    } catch (error) {
      console.error(`Error fetching sponsors for event with ID ${eventId}:`, error);
      throw error;
    }
  },
  
  // Get sponsor zone (singular)
  getSponsorZone: async (sponsorId: number): Promise<SponsorZone | null> => {
    try {
      // First get the zone
      const { data: zoneData, error: zoneError } = await supabase
        .from('sponsor_zones')
        .select('*')
        .eq('sponsor_id', sponsorId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      if (zoneError) {
        if (zoneError.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw zoneError;
      }
      
      // Then get the content blocks for this zone
      const { data: blocksData, error: blocksError } = await supabase
        .from('sponsor_content_blocks')
        .select('*')
        .eq('zone_id', zoneData.id)
        .order('order_position', { ascending: true });
      
      if (blocksError) throw blocksError;
      
      // Map the Supabase data to match our interface
      const contentBlocks = (blocksData || []).map((block: any) => ({
        ...block,
        order: block.order_position // Map order_position to order
      })) as SponsorContentBlock[];
      
      // Return the zone with content blocks
      return {
        ...zoneData,
        content_blocks: contentBlocks
      } as SponsorZone;
    } catch (error) {
      console.error(`Error fetching zone for sponsor with ID ${sponsorId}:`, error);
      throw error;
    }
  },
  
  // Get sponsor zones
  getSponsorZones: async (sponsorId: number): Promise<SponsorZone[]> => {
    try {
      const { data, error } = await supabase
        .from('sponsor_zones')
        .select('*')
        .eq('sponsor_id', sponsorId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as SponsorZone[];
    } catch (error) {
      console.error(`Error fetching zones for sponsor with ID ${sponsorId}:`, error);
      throw error;
    }
  },
  
  // Get content blocks for a zone
  getZoneContentBlocks: async (zoneId: number): Promise<SponsorContentBlock[]> => {
    try {
      const { data, error } = await supabase
        .from('sponsor_content_blocks')
        .select('*')
        .eq('zone_id', zoneId)
        .order('order_position', { ascending: true });
      
      if (error) throw error;
      
      // Map the Supabase data to match our interface
      return (data || []).map((block: any) => ({
        ...block,
        order: block.order_position // Map order_position to order
      })) as SponsorContentBlock[];
    } catch (error) {
      console.error(`Error fetching content blocks for zone with ID ${zoneId}:`, error);
      throw error;
    }
  },
  
  // Track sponsor interactions
  submitSponsorInteraction: async (
    userId: string,
    contentId: number,
    interactionType: string,
    data: Record<string, any> = {}
  ): Promise<void> => {
    try {
      console.log('Sponsor interaction tracked:', {
        user_id: userId,
        content_id: contentId,
        interaction_type: interactionType,
        data
      });
      // This would typically insert into a sponsor_interactions table
      // For now just log the interaction
    } catch (error) {
      console.error('Error tracking sponsor interaction:', error);
    }
  },
  
  // Get sponsor analytics
  getSponsorAnalytics: async (
    sponsorId: number
  ): Promise<SponsorAnalytics> => {
    try {
      // This would typically query analytics data from the database
      // For now return mock data
      return {
        impressions: Math.floor(Math.random() * 10000),
        clicks: Math.floor(Math.random() * 1000),
        conversion_rate: Math.random() * 10,
        engagement_time: Math.floor(Math.random() * 300),
        interactions: Math.floor(Math.random() * 500),
        clickThroughs: Math.floor(Math.random() * 300)
      };
    } catch (error) {
      console.error('Error fetching sponsor analytics:', error);
      throw error;
    }
  }
};
