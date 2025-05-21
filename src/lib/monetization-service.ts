import { supabase } from './supabase';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  default: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  description?: string;
  paymentMethod?: Partial<PaymentMethod>;
  eventId?: number;
  ticketId?: number;
  referenceCode?: string;
  paymentMethodType?: string;
}

// Define the raw payment record type from Supabase
interface PaymentRecord {
  id: string | number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | string;
  created_at: string;
  description?: string;
  event_id?: number;
  ticket_id?: number;
  reference_code?: string;
  payment_method?: string;
}

export const monetizationService = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    // If you store payment methods in Supabase, fetch them here. Otherwise, return an empty array.
    // For now, return an empty array as a placeholder.
    return [];
  },
  
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*');
      if (error) throw error;
      if (!payments) return [];
      // Map payments to Transaction interface
      return payments.map((p: PaymentRecord) => ({
        id: String(p.id),
        amount: p.amount,
        currency: p.currency,
        status: p.status as Transaction['status'],
        createdAt: p.created_at,
        description: p.description,
        eventId: p.event_id,
        ticketId: p.ticket_id,
        referenceCode: p.reference_code,
        paymentMethodType: p.payment_method,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
      return [];
    }
  }
};
