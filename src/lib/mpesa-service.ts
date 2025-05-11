
import { supabase } from './supabase';
import { toast } from 'sonner';

export interface MpesaPaymentRequest {
  phone: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    checkoutRequestId?: string;
    merchantRequestId?: string;
  };
}

export const mpesaService = {
  initiatePayment: async (paymentData: MpesaPaymentRequest): Promise<MpesaPaymentResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('mpesa', {
        body: {
          phoneNumber: paymentData.phone,
          amount: paymentData.amount,
          referenceCode: paymentData.reference,
          description: paymentData.description || 'WYA App Payment'
        }
      });
      
      if (error) throw error;
      
      return data as MpesaPaymentResponse;
    } catch (error) {
      console.error('Error initiating M-Pesa payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate payment'
      };
    }
  },
  
  checkPaymentStatus: async (checkoutRequestId: string): Promise<string> => {
    try {
      // In a real implementation, we would have another function to check status
      // For now we'll simulate a pending status
      return 'pending';
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to check payment status');
      throw error;
    }
  }
};
