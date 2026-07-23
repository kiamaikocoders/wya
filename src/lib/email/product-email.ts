import { notificationService } from '@/lib/notification/notification-service';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/notification/types';

const FANOUT_LIMIT = 200;

/** Notify active ticket holders for an event (in-app + email via dispatch). */
export async function notifyEventTicketHolders(opts: {
  eventId: number;
  eventTitle: string;
  type: Extract<Notification['type'], 'event_update' | 'event_cancelled'>;
  title: string;
  message: string;
}): Promise<number> {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('event_id', opts.eventId)
    .in('status', ['confirmed', 'active', 'pending'])
    .limit(FANOUT_LIMIT);

  if (error) {
    console.error('notifyEventTicketHolders:', error.message);
    return 0;
  }

  const userIds = [...new Set((tickets ?? []).map((t) => t.user_id).filter(Boolean))];
  let sent = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      try {
        await notificationService.createNotification({
          user_id: userId,
          type: opts.type,
          title: opts.title,
          message: opts.message,
          resource_id: opts.eventId,
          resource_type: 'event',
          link: `/events/${opts.eventId}`,
          data: { eventTitle: opts.eventTitle, event_id: opts.eventId },
        });
        sent += 1;
      } catch (e) {
        console.error('notifyEventTicketHolders user', userId, e);
      }
    })
  );

  return sent;
}

export async function subscribeNewsletter(email: string, source = 'footer'): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('Valid email required');

  const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
    body: { email: normalized, source },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
}
