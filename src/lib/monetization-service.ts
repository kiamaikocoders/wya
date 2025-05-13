
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
  description: string;
  paymentMethod?: Partial<PaymentMethod>;
  eventId?: number;
  ticketId?: number;
}

export const monetizationService = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    // This would be implemented with Supabase or Stripe
    console.log('Getting payment methods');
    
    // Return mock data for now
    return [{
      id: 'pm_123456789',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2025,
      default: true
    }];
  },
  
  getTransactions: async (): Promise<Transaction[]> => {
    // This would be implemented with Supabase
    console.log('Getting transactions');
    
    // Return mock data for now
    return [{
      id: 'tx_123456789',
      amount: 25.99,
      currency: 'USD',
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: 'Ticket purchase for Event Name',
      eventId: 1,
      ticketId: 1
    }];
  }
};
