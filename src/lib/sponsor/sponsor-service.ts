
import { supabase } from '../supabase';

export interface SponsorZone {
  id: number;
  title: string;
  description: string | null;
  sponsor_id: number | null;
}

export interface Sponsor {
  id: number;
  name: string;
  description: string | null;
  logo_url: string;
  website_url: string | null;
  partnership_level: string;
  brand_color: string | null;
  brand_gradient: string | null;
}

export interface SponsorContentBlock {
  id: number;
  zone_id: number;
  type: string;
  title: string | null;
  description: string | null;
  media_url: string | null;
  action_url: string | null;
  expires_at: string | null;
  order: number;
  data: any;
}

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
  getEventSponsors: async (eventId: number): Promise<Sponsor[]> => {
    try {
      const { data, error } = await supabase
        .from('event_sponsors')
        .select('*, sponsor:sponsor_id(*)')
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      // Extract the sponsors from the join query
      return data.map((item: any) => item.sponsor);
    } catch (error) {
      console.error(`Error fetching sponsors for event with ID ${eventId}:`, error);
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
      return data.map((block: any) => ({
        ...block,
        order: block.order_position // Map order_position to order
      })) as SponsorContentBlock[];
    } catch (error) {
      console.error(`Error fetching content blocks for zone with ID ${zoneId}:`, error);
      throw error;
    }
  }
};
