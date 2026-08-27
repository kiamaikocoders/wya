import type { RecurrenceFormState } from '@/components/events/RecurrenceFields';
import type { TicketTierDraft } from '@/components/admin/EventTicketTiersEditor';

const DRAFT_KEY = 'wya:admin-create-event-draft:v1';

export type AdminCreateEventDraft = {
  version: 1;
  savedAt: string;
  currentStep: 1 | 2 | 3 | 4;
  formData: {
    title: string;
    description: string;
    category: string;
    category_id: number | null;
    category_ids: number[];
    date: string;
    end_date: string;
    time: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    location_url: string;
    image_url: string;
    price: number;
    capacity: number;
    tags: string[];
    performing_artists: string[];
    ticket_link: string;
    featured: boolean;
    organizer_id: string | null;
    status: 'pending' | 'approved' | 'rejected';
  };
  ticketTiers: TicketTierDraft[];
  recurrence: RecurrenceFormState;
  galleryUrls: string[];
  previewUrl: string | null;
  requireApproval: boolean;
  useExternalTicket: boolean;
  whatToExpect: string;
  tagsInput: string;
  sponsorIds?: number[];
};

/**
 * Load a persisted admin create-event draft from localStorage.
 */
export function loadAdminCreateEventDraft(): AdminCreateEventDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminCreateEventDraft;
    if (!parsed || parsed.version !== 1 || !parsed.formData) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist admin create-event draft so a refresh does not wipe progress.
 */
export function saveAdminCreateEventDraft(draft: AdminCreateEventDraft): void {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, version: 1 as const, savedAt: new Date().toISOString() }),
    );
  } catch (error) {
    console.warn('Could not save create-event draft', error);
  }
}

/**
 * Clear the create-event draft (after publish or explicit discard).
 */
export function clearAdminCreateEventDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
