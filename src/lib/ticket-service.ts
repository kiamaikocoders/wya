
import { apiClient } from './api-client';
import { toast } from 'sonner';

// Ticket endpoint
const TICKET_ENDPOINT = `${apiClient.XANO_EVENT_API_URL}/tickets`;

// Ticket type definitions
export interface Ticket {
  id: number;
  user_id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  purchase_date: string;
  reference_code: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  ticket_type: string;
  price: number;
}

export interface PurchaseTicketPayload {
  event_id: number;
  ticket_type: string;
  quantity: number;
}

// Ticket service methods
export const ticketService = {
  // Get user tickets
  getUserTickets: async (): Promise<Ticket[]> => {
    try {
      const response = await apiClient.get<Ticket[]>(`${TICKET_ENDPOINT}/user`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tickets';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get event tickets - Added for analytics
  getEventTickets: async (eventId: number): Promise<Ticket[]> => {
    try {
      const response = await apiClient.get<Ticket[]>(`${TICKET_ENDPOINT}/event/${eventId}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch tickets for event #${eventId}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get ticket by ID
  getTicketById: async (id: number): Promise<Ticket> => {
    try {
      const response = await apiClient.get<Ticket>(`${TICKET_ENDPOINT}/${id}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch ticket #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Purchase ticket
  purchaseTicket: async (purchaseData: PurchaseTicketPayload): Promise<Ticket> => {
    try {
      const response = await apiClient.post<Ticket>(TICKET_ENDPOINT, purchaseData);
      toast.success('Ticket purchased successfully!');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase ticket';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Cancel ticket
  cancelTicket: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${TICKET_ENDPOINT}/${id}`);
      toast.success('Ticket cancelled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to cancel ticket #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  }
};
