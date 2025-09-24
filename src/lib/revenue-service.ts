import { supabase } from './supabase';
import { toast } from 'sonner';

export interface RevenueSplit {
  total_amount: number;
  platform_commission: number;
  organizer_commission: number;
  sponsor_commission: number;
  platform_rate: number;
  organizer_rate: number;
  sponsor_rate: number;
}

export interface RevenueTransaction {
  id: number;
  event_id: number;
  payment_id: number;
  transaction_type: string;
  amount: number;
  currency: string;
  platform_commission: number;
  organizer_commission: number;
  sponsor_commission: number;
  status: string;
  processed_at: string;
  created_at: string;
}

export interface RevenuePayout {
  id: number;
  recipient_id: string;
  recipient_type: string;
  event_id: number;
  amount: number;
  currency: string;
  payout_method: string;
  payout_details: any;
  status: string;
  transaction_reference: string;
  processed_at: string;
  created_at: string;
}

export interface RevenueAnalytics {
  event_id: number;
  total_revenue: number;
  platform_revenue: number;
  organizer_revenue: number;
  sponsor_revenue: number;
  total_tickets_sold: number;
  average_ticket_price: number;
  revenue_per_attendee: number;
  revenue_breakdown: RevenueTransaction[];
  payouts: RevenuePayout[];
  last_updated: string;
}

export const revenueService = {
  // Calculate revenue split
  calculateRevenueSplit: async (
    eventId: number,
    amount: number
  ): Promise<RevenueSplit> => {
    try {
      const { data, error } = await supabase.rpc('calculate_revenue_split', {
        p_event_id: eventId,
        p_amount: amount
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error calculating revenue split:', error);
      throw error;
    }
  },

  // Process revenue split
  processRevenueSplit: async (
    eventId: number,
    paymentId: number,
    transactionType: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('process_revenue_split', {
        p_event_id: eventId,
        p_payment_id: paymentId,
        p_transaction_type: transactionType
      });

      if (error) throw error;

      toast.success('Revenue split processed successfully');
      return data;
    } catch (error) {
      console.error('Error processing revenue split:', error);
      toast.error('Failed to process revenue split');
      throw error;
    }
  },

  // Get event revenue analytics
  getEventRevenueAnalytics: async (eventId: number): Promise<RevenueAnalytics> => {
    try {
      const { data, error } = await supabase.rpc('get_event_revenue_analytics', {
        p_event_id: eventId
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  },

  // Create payout request
  createPayoutRequest: async (
    eventId: number,
    recipientType: string,
    amount: number,
    payoutMethod: string,
    payoutDetails: any
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('create_payout_request', {
        p_event_id: eventId,
        p_recipient_type: recipientType,
        p_amount: amount,
        p_payout_method: payoutMethod,
        p_payout_details: payoutDetails
      });

      if (error) throw error;

      toast.success('Payout request created successfully');
      return data;
    } catch (error) {
      console.error('Error creating payout request:', error);
      toast.error('Failed to create payout request');
      throw error;
    }
  },

  // Process payouts (admin only)
  processPayouts: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('process_payouts');

      if (error) throw error;

      toast.success('Payouts processed successfully');
      return data;
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.error('Failed to process payouts');
      throw error;
    }
  },

  // Get user's payouts
  getUserPayouts: async (userId?: string): Promise<RevenuePayout[]> => {
    try {
      const { data, error } = await supabase
        .from('revenue_payouts')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user payouts:', error);
      throw error;
    }
  },

  // Get event payouts
  getEventPayouts: async (eventId: number): Promise<RevenuePayout[]> => {
    try {
      const { data, error } = await supabase
        .from('revenue_payouts')
        .select(`
          *,
          profiles:recipient_id(id, full_name, username)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting event payouts:', error);
      throw error;
    }
  },

  // Get revenue transactions
  getRevenueTransactions: async (eventId?: number): Promise<RevenueTransaction[]> => {
    try {
      let query = supabase
        .from('revenue_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting revenue transactions:', error);
      throw error;
    }
  },

  // Update revenue sharing configuration
  updateRevenueConfig: async (
    eventId: number,
    platformRate: number,
    organizerRate: number,
    sponsorRate: number
  ): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('revenue_sharing_config')
        .upsert({
          event_id: eventId,
          platform_commission_rate: platformRate,
          organizer_commission_rate: organizerRate,
          sponsor_commission_rate: sponsorRate,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Revenue configuration updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating revenue config:', error);
      toast.error('Failed to update revenue configuration');
      throw error;
    }
  },

  // Get revenue sharing configuration
  getRevenueConfig: async (eventId: number): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('revenue_sharing_config')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting revenue config:', error);
      throw error;
    }
  }
};
