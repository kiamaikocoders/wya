import { supabase } from '@/integrations/supabase/client';
import type { TicketTierDraft } from '@/components/admin/EventTicketTiersEditor';

export type EventTicketTypeRow = {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  sort_order: number;
  is_active: boolean;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
};

/**
 * Lowest price among draft tiers (used as events.price display / "from" price).
 */
export function lowestTierPrice(tiers: TicketTierDraft[]): number {
  if (!tiers.length) return 0;
  return Math.min(...tiers.map((t) => (Number.isFinite(t.price) ? t.price : 0)));
}

/**
 * Persist ticket tiers for an event (create path — insert only).
 */
export async function insertEventTicketTypes(
  eventId: number,
  tiers: TicketTierDraft[],
): Promise<void> {
  const rows = tiers
    .map((t, index) => ({
      event_id: eventId,
      name: t.name.trim() || `Tier ${index + 1}`,
      price: Number.isFinite(t.price) ? t.price : 0,
      capacity: t.capacity === '' || t.capacity == null ? null : Number(t.capacity),
      sort_order: index,
      is_active: true,
    }))
    .filter((r) => r.name.length > 0);

  if (!rows.length) return;

  const { error } = await (supabase as any).from('event_ticket_types').insert(rows);
  if (error) throw error;
}

/**
 * Replace all ticket tiers for an event (edit path).
 */
export async function replaceEventTicketTypes(
  eventId: number,
  tiers: TicketTierDraft[],
): Promise<void> {
  const { error: delError } = await (supabase as any)
    .from('event_ticket_types')
    .delete()
    .eq('event_id', eventId);
  if (delError) throw delError;
  await insertEventTicketTypes(eventId, tiers);
}

/**
 * Load ticket types for an event (purchase + edit).
 */
export async function fetchEventTicketTypes(
  eventId: number,
): Promise<EventTicketTypeRow[]> {
  const { data, error } = await (supabase as any)
    .from('event_ticket_types')
    .select(
      'id, event_id, name, description, price, capacity, sort_order, is_active, sale_starts_at, sale_ends_at',
    )
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []) as EventTicketTypeRow[];
}
