import { supabase } from '@/lib/supabase';
import type { Tables } from '@/integrations/supabase/types';

export const FEEDBACK_CATEGORIES = ['bug', 'idea', 'general', 'other', 'contact'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = ['new', 'read', 'archived'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export type AppFeedbackRow = Tables<'app_feedback'>;

export type AppFeedbackWithProfile = AppFeedbackRow & {
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

const MAX_MESSAGE = 8000;

export type SubmitFeedbackInput = {
  category: FeedbackCategory;
  message: string;
  pagePath?: string | null;
};

export type SubmitContactInput = {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  pagePath?: string | null;
  /** When signed in, link the row to the profile. */
  userId?: string | null;
};

function normalizeCategory(value: string): FeedbackCategory {
  const v = value as FeedbackCategory;
  return FEEDBACK_CATEGORIES.includes(v) ? v : 'general';
}

export const feedbackService = {
  async submit(userId: string, input: SubmitFeedbackInput): Promise<AppFeedbackRow> {
    const message = input.message.trim();
    if (message.length === 0 || message.length > MAX_MESSAGE) {
      throw new Error(`Message must be between 1 and ${MAX_MESSAGE} characters.`);
    }

    const category = normalizeCategory(input.category);
    const { data, error } = await supabase
      .from('app_feedback')
      .insert({
        user_id: userId,
        category,
        message,
        page_path: input.pagePath?.trim() || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  },

  /**
   * Contact Support form — stores in app_feedback as category `contact`
   * so it appears in the admin feedback inbox.
   */
  async submitContact(input: SubmitContactInput): Promise<AppFeedbackRow> {
    const email = input.email.trim().toLowerCase();
    const subject = input.subject.trim();
    const body = input.message.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid email is required.');
    }
    if (!subject) {
      throw new Error('Subject is required.');
    }
    if (body.length === 0 || body.length > MAX_MESSAGE) {
      throw new Error(`Message must be between 1 and ${MAX_MESSAGE} characters.`);
    }

    const name = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ');
    const message = [
      `Subject: ${subject}`,
      `Name: ${name || '—'}`,
      `Email: ${email}`,
      `Phone: ${input.phone?.trim() || '—'}`,
      '',
      body,
    ].join('\n');

    const userId = input.userId || null;
    const { data, error } = await supabase
      .from('app_feedback')
      .insert({
        user_id: userId,
        category: 'contact',
        message,
        page_path: input.pagePath?.trim() || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  },

  /** Count of feedback items awaiting review (sidebar badge). */
  async countNewForAdmin(): Promise<number> {
    const { count, error } = await supabase
      .from('app_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new');

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async listForAdmin(status?: FeedbackStatus | 'all'): Promise<AppFeedbackWithProfile[]> {
    let q = supabase
      .from('app_feedback')
      .select(
        `
        *,
        profiles!app_feedback_user_id_fkey (
          full_name,
          username,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      q = q.eq('status', status);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as AppFeedbackWithProfile[];
  },

  async updateStatus(id: string, status: FeedbackStatus): Promise<void> {
    if (!FEEDBACK_STATUSES.includes(status)) {
      throw new Error('Invalid status');
    }

    const { data: row, error: fetchErr } = await supabase
      .from('app_feedback')
      .select('id, user_id, category, status')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);

    const { error } = await supabase.from('app_feedback').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);

    if (row?.user_id && row.status !== status) {
      try {
        const { notificationService } = await import('@/lib/notification/notification-service');
        await notificationService.createNotification({
          user_id: row.user_id,
          type: 'feedback_reply',
          title: 'Feedback update',
          message: `Your feedback (${row.category}) is now marked as "${status}".`,
          link: '/feedback',
          data: { feedback_id: id, status },
        });
      } catch (e) {
        console.warn('Feedback status notify failed', e);
      }
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('app_feedback').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
