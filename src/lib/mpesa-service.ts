
import { apiClient } from './api-client';
import { toast } from 'sonner';

// M-Pesa API keys
const MPESA_CONSUMER_KEY = 'CstL0SgMf7ZXUAmhGGqcfRMHizmEUBZTzS8joyKEKwm7YrFj';
const MPESA_CONSUMER_SECRET = 'QuTSinGBkkKbAkQpCHRavgrG4RnPOE0BL054ykqVmMu6P37osdoZLKmGAHHftRnh';

// M-Pesa endpoint (would typically be on your backend)
const MPESA_ENDPOINT = `${apiClient.XANO_EVENT_API_URL}/mpesa`;

// M-Pesa payment types
export interface MpesaPaymentRequest {
  phone: string;
  amount: number;
  reference: string;
  description: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
  checkout_request_id?: string;
}

// M-Pesa service methods
export const mpesaService = {
  // Initiate STK push payment
  initiatePayment: async (paymentData: MpesaPaymentRequest): Promise<MpesaPaymentResponse> => {
    try {
      // Clean and format phone number (ensure it's in the format 2547XXXXXXXX)
      const formattedPhone = formatPhoneNumber(paymentData.phone);
      
      const requestData = {
        ...paymentData,
        phone: formattedPhone,
        consumer_key: MPESA_CONSUMER_KEY,
        consumer_secret: MPESA_CONSUMER_SECRET
      };
      
      const response = await apiClient.post<MpesaPaymentResponse>(
        `${MPESA_ENDPOINT}/stk-push`, 
        requestData
      );
      
      if (response.success) {
        toast.success('Payment request sent to your phone. Please complete the payment.');
      } else {
        toast.error(response.message || 'Payment initiation failed');
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate M-Pesa payment';
      toast.error(errorMessage);
      
      // Return a standardized error response
      return {
        success: false,
        message: errorMessage
      };
    }
  },
  
  // Check payment status
  checkPaymentStatus: async (checkoutRequestId: string): Promise<MpesaPaymentResponse> => {
    try {
      const response = await apiClient.get<MpesaPaymentResponse>(
        `${MPESA_ENDPOINT}/status/${checkoutRequestId}`
      );
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check payment status';
      
      // Return a standardized error response
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

// Helper function to format phone number for M-Pesa
const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if the number starts with '0' (Kenyan format)
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    // Convert from 07XX to 2547XX format
    return `254${digitsOnly.substring(1)}`;
  }
  
  // Check if the number starts with '+254'
  if (digitsOnly.startsWith('254') && digitsOnly.length === 12) {
    // Already in the correct format
    return digitsOnly;
  }
  
  // Check if the number starts with '7' (without country code)
  if (digitsOnly.startsWith('7') && digitsOnly.length === 9) {
    // Add the country code
    return `254${digitsOnly}`;
  }
  
  // Return the original digits if no known format is detected
  return digitsOnly;
};
