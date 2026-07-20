import { supabase } from './supabase';

export interface PublicPlatformFlags {
  marketplace_enabled: boolean;
  maintenance_mode: boolean;
  registration_open: boolean;
  marketplace_fee_per_ticket_kes: number;
  marketplace_transfer_close_hours: number;
}

const DEFAULT_FLAGS: PublicPlatformFlags = {
  marketplace_enabled: true,
  maintenance_mode: false,
  registration_open: true,
  marketplace_fee_per_ticket_kes: 100,
  marketplace_transfer_close_hours: 12,
};

export async function getPublicPlatformFlags(): Promise<PublicPlatformFlags> {
  try {
    const { data, error } = await supabase.rpc('get_public_platform_flags');
    if (error) throw error;
    const raw = (data ?? {}) as Record<string, unknown>;
    return {
      marketplace_enabled: Boolean(raw.marketplace_enabled ?? true),
      maintenance_mode: Boolean(raw.maintenance_mode ?? false),
      registration_open: Boolean(raw.registration_open ?? true),
      marketplace_fee_per_ticket_kes: Number(raw.marketplace_fee_per_ticket_kes ?? 100),
      marketplace_transfer_close_hours: Number(raw.marketplace_transfer_close_hours ?? 12),
    };
  } catch {
    // Migration not applied / DB paused — fail open with defaults
    return { ...DEFAULT_FLAGS };
  }
}
