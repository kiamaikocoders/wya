
import { apiClient } from './api-client';
import { toast } from 'sonner';
import { mpesaService, MpesaPaymentRequest } from './mpesa-service';

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
  payment_method?: string;
  payment_id?: string;
}

export interface PurchaseTicketPayload {
  event_id: number;
  ticket_type: string;
  quantity: number;
  phone_number?: string;
  payment_method: 'mpesa' | 'card' | 'cash';
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
      // Handle M-Pesa payment if selected
      if (purchaseData.payment_method === 'mpesa') {
        if (!purchaseData.phone_number) {
          throw new Error('Phone number is required for M-Pesa payments');
        }
        
        // First create a pending ticket
        const pendingTicket = await apiClient.post<Ticket>(`${TICKET_ENDPOINT}/pending`, purchaseData);
        
        // Then initiate M-Pesa payment
        const paymentRequest: MpesaPaymentRequest = {
          phone: purchaseData.phone_number,
          amount: pendingTicket.price * purchaseData.quantity,
          reference: pendingTicket.reference_code,
          description: `Ticket for ${pendingTicket.event_title}`
        };
        
        const paymentResponse = await mpesaService.initiatePayment(paymentRequest);
        
        if (!paymentResponse.success) {
          // If payment failed, update ticket status to cancelled
          await apiClient.put(`${TICKET_ENDPOINT}/${pendingTicket.id}/cancel`);
          throw new Error(paymentResponse.message);
        }
        
        // Return the pending ticket (will be confirmed by webhook)
        toast.success('Payment initiated! Check your phone to complete the transaction.');
        return pendingTicket;
      }
      
      // For other payment methods, proceed with regular ticket creation
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
  },
  
  // Check payment status for pending tickets
  checkTicketPaymentStatus: async (ticketId: number): Promise<Ticket> => {
    try {
      const response = await apiClient.get<Ticket>(`${TICKET_ENDPOINT}/${ticketId}/payment-status`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to check payment status for ticket #${ticketId}`;
      toast.error(errorMessage);
      throw error;
    }
  }
};
