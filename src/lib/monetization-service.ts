
import { apiClient } from './api-client';
import { toast } from 'sonner';

// Endpoint for monetization features
const MONETIZATION_ENDPOINT = `${apiClient.XANO_EVENT_API_URL}/monetization`;

// Define pricing tiers
export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export interface RevenueSplit {
  platform: number; // platform cut (percentage)
  organizer: number; // organizer cut (percentage)
}

// Standard pricing tiers
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Simple listing for your event',
    price: 0,
    features: [
      'Standard event listing',
      'Basic discovery',
      'Up to 3 photos'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Enhanced visibility for your event',
    price: 2500,
    features: [
      'Featured on homepage',
      'Highlighted in search results',
      'Unlimited photos',
      'Social media promotion',
      'Priority support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Complete promotion package for serious events',
    price: 5000,
    features: [
      'All Premium features',
      'Top placement in search results',
      'Featured in email newsletters',
      'Advanced analytics',
      'Customizable event page',
      'Dedicated account manager'
    ]
  }
];

// Revenue split configurations
export const REVENUE_SPLITS: Record<string, RevenueSplit> = {
  'free': { platform: 0, organizer: 100 },
  'standard': { platform: 10, organizer: 90 },
  'premium': { platform: 8, organizer: 92 }
};

// Monetization service methods
export const monetizationService = {
  // Get pricing tiers
  getPricingTiers: async (): Promise<PricingTier[]> => {
    try {
      // First try to get from API
      const response = await apiClient.get<PricingTier[]>(`${MONETIZATION_ENDPOINT}/pricing-tiers`);
      return response;
    } catch (error) {
      console.info('Using default pricing tiers');
      return PRICING_TIERS;
    }
  },
  
  // Get revenue split information
  getRevenueSplit: async (tierType: string = 'standard'): Promise<RevenueSplit> => {
    try {
      // First try to get from API
      const response = await apiClient.get<RevenueSplit>(`${MONETIZATION_ENDPOINT}/revenue-split/${tierType}`);
      return response;
    } catch (error) {
      console.info('Using default revenue split configuration');
      return REVENUE_SPLITS[tierType] || REVENUE_SPLITS.standard;
    }
  },

  // Calculate platform fee
  calculatePlatformFee: (amount: number, tierType: string = 'standard'): number => {
    const split = REVENUE_SPLITS[tierType] || REVENUE_SPLITS.standard;
    return (amount * split.platform) / 100;
  },
  
  // Calculate organizer payout
  calculateOrganizerPayout: (amount: number, tierType: string = 'standard'): number => {
    const split = REVENUE_SPLITS[tierType] || REVENUE_SPLITS.standard;
    return (amount * split.organizer) / 100;
  },
  
  // Purchase a pricing tier for an event
  purchaseTier: async (eventId: number, tierId: string): Promise<boolean> => {
    try {
      await apiClient.post<{success: boolean}>(`${MONETIZATION_ENDPOINT}/purchase-tier`, {
        event_id: eventId,
        tier_id: tierId
      });
      
      toast.success(`Successfully upgraded event to ${tierId} tier!`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase tier';
      toast.error(errorMessage);
      return false;
    }
  }
};
