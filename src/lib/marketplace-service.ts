import { supabase } from './supabase';
import { toast } from 'sonner';
import { getPublicPlatformFlags } from './platform-flags';

export type MarketplaceMode = 'paid_transfer' | 'gift';
export type MarketplaceListingStatus =
  | 'active'
  | 'sold'
  | 'gifted'
  | 'expired'
  | 'cancelled'
  | 'failed';

export type MarketplaceTransferStatus =
  | 'pending_payment'
  | 'completing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type MarketplacePayoutStatus = 'pending' | 'paid' | 'failed' | 'skipped';

export interface MarketplaceListing {
  id: number;
  seller_id: string;
  event_id: number;
  mode: MarketplaceMode;
  status: MarketplaceListingStatus;
  ticket_count: number;
  gross_amount: number;
  fee_amount: number;
  seller_payout_amount: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  event?: {
    id: number;
    title: string;
    date: string;
    location?: string;
    image_url?: string | null;
  } | null;
  items?: MarketplaceListingItem[];
}

export interface MarketplaceListingItem {
  id: number;
  listing_id: number;
  ticket_id: number;
  locked_price: number;
  ticket?: {
    id: number;
    ticket_type: string;
    reference_code: string;
    status: string;
    price: number;
    event_title?: string;
  } | null;
}

export interface MarketplaceTransfer {
  id: number;
  listing_id: number;
  buyer_id: string;
  seller_id: string;
  mode: MarketplaceMode;
  status: MarketplaceTransferStatus;
  payment_reference?: string | null;
  gross_amount: number;
  fee_amount: number;
  seller_payout_amount: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface MarketplacePayout {
  id: number;
  transfer_id: number;
  seller_id: string;
  amount: number;
  status: MarketplacePayoutStatus;
  payout_method?: string | null;
  attempt_count: number;
  last_error?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface MarketplaceTransferResult {
  transfer_id: number;
  listing_id?: number;
  status: string;
  mode?: MarketplaceMode;
  tokens?: Array<{ ticket_id: number; token: string }>;
  payout_id?: number | null;
  payment_reference?: string;
  buyer_paid?: number;
  idempotent?: boolean;
}

export interface MarketplaceListingResult {
  listing_id: number;
  mode: MarketplaceMode;
  ticket_count: number;
  gross_amount: number;
  fee_amount: number;
  seller_payout_amount: number;
  expires_at: string;
}

export interface AdminMarketplaceStats {
  active_listings: number;
  sold_listings: number;
  gifted_listings: number;
  completed_transfers: number;
  failed_transfers: number;
  fees_collected: number;
  pending_payouts: number;
  failed_payouts: number;
  paid_payout_amount: number;
}

const FEE_PER_TICKET = 100;

function asErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: string }).message;
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export const marketplaceService = {
  feePerTicket: FEE_PER_TICKET,

  /** Create a paid or gift listing from owned tickets (same event; no mixed paid/free). */
  createListing: async (ticketIds: number[]): Promise<MarketplaceListingResult> => {
    try {
      const flags = await getPublicPlatformFlags();
      if (!flags.marketplace_enabled) {
        throw new Error('Marketplace is temporarily disabled');
      }
      const { data, error } = await supabase.rpc('marketplace_create_listing', {
        p_ticket_ids: ticketIds,
      });
      if (error) throw error;
      return data as MarketplaceListingResult;
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to create marketplace listing');
      toast.error(message);
      throw error;
    }
  },

  cancelListing: async (listingId: number): Promise<{ listing_id: number; status: string }> => {
    try {
      const { data, error } = await supabase.rpc('marketplace_cancel_listing', {
        p_listing_id: listingId,
      });
      if (error) throw error;
      toast.success('Listing cancelled');
      return data as { listing_id: number; status: string };
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to cancel listing');
      toast.error(message);
      throw error;
    }
  },

  /** Buyer pays locked gross; seller gets gross − 100×N. Completes + rotates QR. */
  purchaseListing: async (
    listingId: number,
    paymentReference?: string
  ): Promise<MarketplaceTransferResult> => {
    try {
      const flags = await getPublicPlatformFlags();
      if (!flags.marketplace_enabled) {
        throw new Error('Marketplace is temporarily disabled');
      }
      const { data, error } = await supabase.rpc('marketplace_purchase_listing', {
        p_listing_id: listingId,
        p_payment_reference: paymentReference ?? null,
      });
      if (error) throw error;
      toast.success('Transfer complete — tickets are now yours');
      return data as MarketplaceTransferResult;
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to purchase listing');
      toast.error(message);
      throw error;
    }
  },

  /** Zero-price gift claim (no money). */
  claimGift: async (listingId: number): Promise<MarketplaceTransferResult> => {
    try {
      const flags = await getPublicPlatformFlags();
      if (!flags.marketplace_enabled) {
        throw new Error('Marketplace is temporarily disabled');
      }
      const { data, error } = await supabase.rpc('marketplace_claim_gift', {
        p_listing_id: listingId,
      });
      if (error) throw error;
      toast.success('Gift claimed — tickets are now yours');
      return data as MarketplaceTransferResult;
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to claim gift listing');
      toast.error(message);
      throw error;
    }
  },

  /** For payment webhooks / delayed confirm (idempotent if already completed). */
  confirmPayment: async (
    transferId: number,
    paymentReference?: string
  ): Promise<MarketplaceTransferResult> => {
    try {
      const { data, error } = await supabase.rpc('marketplace_confirm_payment', {
        p_transfer_id: transferId,
        p_payment_reference: paymentReference ?? null,
      });
      if (error) throw error;
      return data as MarketplaceTransferResult;
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to confirm marketplace payment');
      toast.error(message);
      throw error;
    }
  },

  getActiveListings: async (options?: {
    eventId?: number;
    mode?: MarketplaceMode;
    limit?: number;
  }): Promise<MarketplaceListing[]> => {
    try {
      let query = supabase
        .from('marketplace_listings')
        .select(
          `
          *,
          event:events!marketplace_listings_event_id_fkey (id, title, date, location, image_url),
          items:marketplace_listing_items (
            id, listing_id, ticket_id, locked_price,
            ticket:tickets!marketplace_listing_items_ticket_id_fkey (
              id, ticket_type, reference_code, status, price, event_title
            )
          )
        `
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(options?.limit ?? 50);

      if (options?.eventId != null) query = query.eq('event_id', options.eventId);
      if (options?.mode) query = query.eq('mode', options.mode);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MarketplaceListing[];
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to load marketplace');
      toast.error(message);
      throw error;
    }
  },

  getListingById: async (listingId: number): Promise<MarketplaceListing | null> => {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(
          `
          *,
          event:events!marketplace_listings_event_id_fkey (id, title, date, location, image_url),
          items:marketplace_listing_items (
            id, listing_id, ticket_id, locked_price,
            ticket:tickets!marketplace_listing_items_ticket_id_fkey (
              id, ticket_type, reference_code, status, price, event_title
            )
          )
        `
        )
        .eq('id', listingId)
        .maybeSingle();
      if (error) throw error;
      return data as MarketplaceListing | null;
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to load listing');
      toast.error(message);
      throw error;
    }
  },

  getMyListings: async (): Promise<MarketplaceListing[]> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('You must be logged in');

      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(
          `
          *,
          event:events!marketplace_listings_event_id_fkey (id, title, date, location, image_url),
          items:marketplace_listing_items (
            id, listing_id, ticket_id, locked_price,
            ticket:tickets!marketplace_listing_items_ticket_id_fkey (
              id, ticket_type, reference_code, status, price, event_title
            )
          )
        `
        )
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MarketplaceListing[];
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to load your listings');
      toast.error(message);
      throw error;
    }
  },

  getMyTransfers: async (): Promise<MarketplaceTransfer[]> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('You must be logged in');

      const { data, error } = await supabase
        .from('marketplace_transfers')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MarketplaceTransfer[];
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to load transfers');
      toast.error(message);
      throw error;
    }
  },

  getActiveQrToken: async (ticketId: number): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('ticket_qr_tokens')
        .select('token')
        .eq('ticket_id', ticketId)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      if (data?.token) return data.token as string;

      const { data: ensured, error: ensureError } = await supabase.rpc(
        'marketplace_ensure_ticket_qr',
        { p_ticket_id: ticketId }
      );
      if (ensureError) throw ensureError;
      return (ensured as string) ?? null;
    } catch (error) {
      // Callers (e.g. TicketDetail) fall back to reference_code QR when tables/RPCs are missing.
      console.warn('getActiveQrToken:', asErrorMessage(error, 'Failed to load ticket QR'));
      return null;
    }
  },

  /** Tickets owned by user that are eligible to list (client-side prefilter; server rechecks). */
  getListableTickets: async (eventId?: number) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('You must be logged in');

      let query = supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'active'])
        .order('purchase_date', { ascending: false });

      if (eventId != null) query = query.eq('event_id', eventId);

      const { data: tickets, error } = await query;
      if (error) throw error;

      const ticketIds = (tickets ?? []).map((t) => t.id);
      let listedIds = new Set<number>();
      if (ticketIds.length > 0) {
        const { data: activeItems, error: itemsError } = await supabase
          .from('marketplace_listing_items')
          .select('ticket_id, marketplace_listings!inner(status)')
          .in('ticket_id', ticketIds)
          .eq('marketplace_listings.status', 'active');
        if (itemsError) {
          // Marketplace tables may not be migrated yet
          console.warn('Could not check active listings:', itemsError.message);
        } else {
          listedIds = new Set((activeItems ?? []).map((row: { ticket_id: number }) => row.ticket_id));
        }
      }

      const now = Date.now();
      const twelveHoursMs = 12 * 60 * 60 * 1000;

      return (tickets ?? []).filter((ticket) => {
        if (listedIds.has(ticket.id)) return false;
        const start = ticket.event_date ? new Date(ticket.event_date).getTime() : NaN;
        if (!Number.isFinite(start)) return true;
        return now < start - twelveHoursMs;
      });
    } catch (error) {
      const message = asErrorMessage(error, 'Failed to load listable tickets');
      toast.error(message);
      throw error;
    }
  },
};
