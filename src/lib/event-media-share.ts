import { supabase } from '@/integrations/supabase/client';
import { getPublicEventMediaGalleryUrl } from '@/lib/supabase-functions-url';
import type { EventMediaItem, EventMediaSummary } from '@/lib/admin-event-media-service';

export interface SharedGalleryEvent {
  id: number;
  title: string;
  date: string | null;
}

export interface PublicEventMediaResponse {
  event: SharedGalleryEvent;
  summary: EventMediaSummary;
}

export type CreateEventMediaShareOptions = {
  expiresInDays?: number;
  recipientEmail?: string;
  recipientEmails?: string[];
  /** Also email the event's assigned organizer (looked up server-side). */
  emailOrganizer?: boolean;
  mediaSummary?: string;
  message?: string;
};

export type CreateEventMediaShareResult = {
  token: string;
  expiresAt: string;
  galleryUrl?: string;
  emailed?: boolean;
  emailsSent?: string[];
  emailErrors?: string[];
  organizer?: { email: string; name: string | null } | null;
};

async function parseFunctionErrorBody(error: unknown): Promise<{ error?: string; hint?: string }> {
  const ctx =
    error && typeof error === 'object' && 'context' in error
      ? (error as { context: unknown }).context
      : null;
  if (ctx instanceof Response) {
    try {
      return (await ctx.json()) as { error?: string; hint?: string };
    } catch {
      return {};
    }
  }
  return {};
}

export async function createEventMediaShareLink(
  eventId: number,
  options: CreateEventMediaShareOptions | number = 30,
  recipientEmail?: string
): Promise<CreateEventMediaShareResult> {
  // Backward compatible: (eventId, expiresInDays, recipientEmail?)
  const opts: CreateEventMediaShareOptions =
    typeof options === 'number'
      ? { expiresInDays: options, recipientEmail }
      : options;

  // Edge Functions with verify_jwt validate the access_token at the gateway. Stale or
  // near-expired tokens from getSession() often fail with 401 before our function runs.
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  let accessToken = refreshed.session?.access_token;
  if (!accessToken) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token ?? undefined;
  }
  if (!accessToken) {
    throw new Error(refreshError?.message ?? 'Not signed in');
  }

  const { data, error } = await supabase.functions.invoke('create-event-media-share', {
    body: {
      event_id: eventId,
      expires_in_days: opts.expiresInDays ?? 30,
      ...(opts.recipientEmail ? { recipient_email: opts.recipientEmail } : {}),
      ...(opts.recipientEmails?.length ? { recipient_emails: opts.recipientEmails } : {}),
      ...(opts.emailOrganizer ? { email_organizer: true } : {}),
      ...(opts.mediaSummary ? { media_summary: opts.mediaSummary } : {}),
      ...(opts.message ? { message: opts.message } : {}),
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    const payload = await parseFunctionErrorBody(error);
    const base =
      typeof payload.error === 'string' ? payload.error : 'Could not create share link';
    const hint = typeof payload.hint === 'string' ? payload.hint : '';
    throw new Error(hint ? `${base}: ${hint}` : base);
  }

  if (data && typeof data === 'object' && 'error' in data) {
    const d = data as { error?: string; hint?: string };
    const base = typeof d.error === 'string' ? d.error : 'Could not create share link';
    const hint = typeof d.hint === 'string' ? d.hint : '';
    throw new Error(hint ? `${base}: ${hint}` : base);
  }

  const payload = data as {
    token?: string;
    expires_at?: string;
    gallery_url?: string;
    emailed?: boolean;
    emails_sent?: string[];
    email_errors?: string[];
    organizer?: { email: string; name: string | null } | null;
  } | null;
  const token = payload?.token;
  const expiresAt = payload?.expires_at;
  if (!token || !expiresAt) {
    throw new Error('Invalid response from server');
  }
  return {
    token,
    expiresAt,
    galleryUrl: payload?.gallery_url,
    emailed: payload?.emailed,
    emailsSent: payload?.emails_sent ?? [],
    emailErrors: payload?.email_errors ?? [],
    organizer: payload?.organizer ?? null,
  };
}

/** Preview organizer contact for an event (admin). Email comes from auth via edge on send. */
export async function fetchEventOrganizerHint(
  eventId: number
): Promise<{ id: string; name: string } | null> {
  const { data: event, error } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .maybeSingle();
  if (error || !event?.organizer_id) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', event.organizer_id)
    .maybeSingle();

  if (!profile) return { id: event.organizer_id, name: 'Organizer' };
  return {
    id: profile.id,
    name: profile.full_name?.trim() || profile.username?.trim() || 'Organizer',
  };
}

/** Build the in-app URL for recipients (same origin as the web app). */
export function buildPublicEventMediaGalleryPath(token: string): string {
  return `/share/event-media/${encodeURIComponent(token)}`;
}

export async function fetchPublicEventMediaGallery(
  token: string
): Promise<PublicEventMediaResponse> {
  const baseFn = getPublicEventMediaGalleryUrl();
  if (!baseFn) {
    throw new Error('VITE_SUPABASE_URL is not configured');
  }
  const url = `${baseFn}?token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'Could not load gallery');
  }
  const event = payload.event as SharedGalleryEvent | undefined;
  const summary = payload.summary as EventMediaSummary | undefined;
  if (!event || !summary || !Array.isArray(summary.items)) {
    throw new Error('Invalid gallery response');
  }
  return {
    event,
    summary: {
      ...summary,
      items: summary.items as EventMediaItem[],
    },
  };
}
