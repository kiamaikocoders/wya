
import { supabase } from './supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notification/notification-service';

// Ticket type definitions
export interface Ticket {
  id: number;
  user_id: string;
  event_id: number;
  event_title: string;
  event_date: string;
  purchase_date: string;
  reference_code: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'active';
  ticket_type: string;
  price: number;
  payment_method?: string;
  payment_id?: string;
  transfer_version?: number;
}

export interface PurchaseTicketPayload {
  event_id: number;
  ticket_type: string;
  /** Optional FK to event_ticket_types.id */
  ticket_type_id?: number;
  /** When set, used instead of events.price (multi-tier events). */
  unit_price?: number;
  quantity: number;
  phone_number?: string;
  payment_method: 'mpesa' | 'card' | 'cash';
}

// Ticket service methods
export const ticketService = {
  // Get user tickets
  getUserTickets: async (): Promise<Ticket[]> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('You must be logged in to view tickets');

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });
        
      if (error) throw error;
      return data as Ticket[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tickets';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get event tickets - Added for analytics
  getEventTickets: async (eventId: number): Promise<Ticket[]> => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId);
        
      if (error) throw error;
      return data as Ticket[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch tickets for event #${eventId}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get ticket by ID
  getTicketById: async (id: number): Promise<Ticket> => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Ticket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch ticket #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Purchase ticket
  purchaseTicket: async (purchaseData: PurchaseTicketPayload): Promise<Ticket> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to purchase tickets');
      
      // First get event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('title, date, price')
        .eq('id', purchaseData.event_id)
        .single();
        
      if (eventError) throw eventError;
      
      const unitPrice =
        purchaseData.unit_price != null && Number.isFinite(purchaseData.unit_price)
          ? purchaseData.unit_price
          : eventData.price;

      const ticketData = {
        user_id: user.id,
        event_id: purchaseData.event_id,
        ticket_type: purchaseData.ticket_type,
        ticket_type_id: purchaseData.ticket_type_id ?? null,
        price: unitPrice,
        status: purchaseData.payment_method === 'mpesa' ? 'pending' : 'confirmed',
        reference_code: `TKT-${uuidv4().substring(0, 8).toUpperCase()}`,
        event_title: eventData.title,
        event_date: eventData.date
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();
        
      if (error) throw error;
      
      // For M-Pesa payments, we would use an Edge Function
      if (purchaseData.payment_method === 'mpesa' && purchaseData.phone_number) {
        // In a real implementation, we would call the M-Pesa Edge Function
        // Confirmation email should fire from M-Pesa callback when status → confirmed
        toast.success('Payment initiated! Check your phone to complete the transaction.');
        return data as Ticket;
      }

      try {
        await notificationService.createNotification({
          user_id: user.id,
          type: 'ticket',
          title: 'Ticket confirmed',
          message: `Your ticket for "${eventData.title}" is confirmed. Reference: ${data.reference_code}`,
          resource_id: data.id,
          resource_type: 'ticket',
          link: '/tickets',
          data: { eventTitle: eventData.title, event_id: purchaseData.event_id },
        });
      } catch (notifyErr) {
        console.warn('Ticket confirmation notification failed', notifyErr);
      }

      toast.success('Ticket purchased successfully!');
      return data as Ticket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase ticket';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Cancel ticket
  cancelTicket: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'cancelled' })
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Ticket cancelled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to cancel ticket #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Check payment status for pending tickets
  checkTicketPaymentStatus: async (ticketId: number): Promise<Ticket> => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (error) throw error;
      return data as Ticket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to check payment status for ticket #${ticketId}`;
      toast.error(errorMessage);
      throw error;
    }
  }
};
