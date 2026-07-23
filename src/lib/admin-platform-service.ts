import { supabase } from './supabase';
import { toast } from 'sonner';
import { getAdminSystemUrl } from './supabase-functions-url';

/** True when the last templates fetch used the bundled Figma catalog (DB table missing). */
export function getCommunicationTemplatesFromBundle(): boolean {
  return communicationTemplatesFromBundle;
}

let communicationTemplatesFromBundle = false;

export type AnnouncementAudience = 'all' | 'attendees' | 'organizers' | 'admins';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';
export type AnnouncementChannel = 'email' | 'in_app' | 'both';

export interface PlatformAnnouncement {
  id: number;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  channel?: AnnouncementChannel;
  status: AnnouncementStatus;
  link?: string | null;
  recipient_count?: number;
  created_by?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: string;
  category: 'auth' | 'transactional' | 'marketing' | string;
  name: string;
  subject: string;
  html: string;
  description?: string | null;
  updated_at?: string;
}

export interface EmailSendLogRow {
  id: number;
  user_id: string | null;
  to_email: string;
  template_id: string;
  subject: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SystemSettingEntry {
  value: unknown;
  description?: string | null;
  updated_at?: string;
}

export type SystemSettingsMap = Record<string, SystemSettingEntry>;

export interface AdminAuditEntry {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminFinanceOverview {
  payments: {
    total_amount: number;
    completed_amount: number;
    pending_amount: number;
    failed_amount: number;
  };
  tickets: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  marketplace: {
    fees_collected: number;
    payouts_pending_amount: number;
    payouts_paid_amount: number;
    payouts_failed_count: number;
  };
}

export interface AdminPaymentRow {
  id: number;
  user_id: string;
  event_id: number | null;
  amount: number;
  currency: string | null;
  status: string;
  payment_method: string | null;
  reference_code: string | null;
  created_at: string | null;
}

export interface AdminTicketRow {
  id: number;
  user_id: string;
  event_id: number;
  event_title?: string;
  ticket_type: string;
  price: number;
  status: string;
  reference_code: string;
  purchase_date?: string;
  event_date?: string;
}

export type SystemHealthStatus =
  | 'Healthy'
  | 'Degraded'
  | 'Error'
  | 'Not configured'
  | 'Auth SMTP only'
  | 'Not migrated'
  | '—';

export interface AdminSystemHealth {
  health: {
    database: SystemHealthStatus;
    auth: SystemHealthStatus;
    storage: SystemHealthStatus;
    email: SystemHealthStatus;
    push: SystemHealthStatus;
    marketplace: SystemHealthStatus;
  };
  metrics: {
    dbLatencyMs: number;
    authLatencyMs: number;
    storageLatencyMs: number;
    uptimeLabel: string;
    runtime: string;
  };
  serverStatus: string;
  resendConfigured: boolean;
}

export interface AdminEmailStatus {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromEmail: string;
  fromName: string;
  notificationsEnabled: boolean;
  smtpPassSet: boolean;
  smtpPassSource: 'env' | 'none';
  siteName: string;
  siteUrl: string;
  note: string;
}

function asErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: string }).message;
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function callAdminSystem<T>(body: Record<string, unknown>): Promise<T> {
  const url = getAdminSystemUrl();
  if (!url) throw new Error('Supabase functions URL is not configured');

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (payload as { error?: string })?.error || `System request failed (${res.status})`
    );
  }
  return payload as T;
}

export const adminPlatformService = {
  getSystemSettings: async (): Promise<SystemSettingsMap> => {
    const { data, error } = await supabase.rpc('admin_get_system_settings');
    if (error) throw error;
    return (data ?? {}) as SystemSettingsMap;
  },

  upsertSystemSetting: async (
    key: string,
    value: unknown,
    description?: string
  ): Promise<void> => {
    const { error } = await supabase.rpc('admin_upsert_system_setting', {
      p_key: key,
      p_value: value as never,
      p_description: description ?? null,
    });
    if (error) throw error;
    toast.success('Setting saved');
  },

  getAuditLog: async (limit = 100): Promise<AdminAuditEntry[]> => {
    const { data, error } = await supabase.rpc('admin_list_audit_log', {
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []) as AdminAuditEntry[];
  },

  getSystemHealth: async (): Promise<AdminSystemHealth> => {
    return callAdminSystem<AdminSystemHealth>({ action: 'health' });
  },

  getEmailStatus: async (): Promise<AdminEmailStatus> => {
    return callAdminSystem<AdminEmailStatus>({ action: 'email_status' });
  },

  sendTestEmail: async (
    to?: string
  ): Promise<{ messageId: string | null; from: string; to: string }> => {
    const result = await callAdminSystem<{
      success: boolean;
      messageId: string | null;
      from: string;
      to: string;
    }>({ action: 'test_email', to });
    toast.success(`Test email sent to ${result.to}`);
    return result;
  },

  getFinanceOverview: async (): Promise<AdminFinanceOverview> => {
    const { data, error } = await supabase.rpc('admin_finance_overview');
    if (error) throw error;
    return data as AdminFinanceOverview;
  },

  getRecentPayments: async (limit = 50): Promise<AdminPaymentRow[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AdminPaymentRow[];
  },

  getRecentTickets: async (options?: {
    status?: string;
    limit?: number;
  }): Promise<AdminTicketRow[]> => {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('purchase_date', { ascending: false })
      .limit(options?.limit ?? 50);
    if (options?.status) query = query.eq('status', options.status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as AdminTicketRow[];
  },

  cancelTicket: async (ticketId: number, reason?: string): Promise<void> => {
    const { error } = await supabase.rpc('admin_mark_ticket_cancelled', {
      p_ticket_id: ticketId,
      p_reason: reason ?? null,
    });
    if (error) throw error;
    toast.success('Ticket cancelled');
  },

  forceCancelListing: async (listingId: number): Promise<void> => {
    const { error } = await supabase.rpc('admin_force_cancel_marketplace_listing', {
      p_listing_id: listingId,
    });
    if (error) throw error;
    toast.success('Listing force-cancelled');
  },

  listAnnouncements: async (): Promise<PlatformAnnouncement[]> => {
    const { data, error } = await supabase
      .from('platform_announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as PlatformAnnouncement[];
  },

  createAnnouncement: async (payload: {
    title: string;
    body: string;
    audience: AnnouncementAudience;
    channel?: AnnouncementChannel;
    link?: string;
  }): Promise<PlatformAnnouncement> => {
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('platform_announcements')
      .insert({
        title: payload.title,
        body: payload.body,
        audience: payload.audience,
        channel: payload.channel ?? 'both',
        link: payload.link || null,
        status: 'draft',
        created_by: auth.user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    toast.success('Draft announcement created');
    return data as PlatformAnnouncement;
  },

  updateAnnouncement: async (
    id: number,
    payload: {
      title: string;
      body: string;
      audience: AnnouncementAudience;
      channel: AnnouncementChannel;
      link?: string;
    }
  ): Promise<void> => {
    const { error } = await supabase
      .from('platform_announcements')
      .update({
        title: payload.title,
        body: payload.body,
        audience: payload.audience,
        channel: payload.channel,
        link: payload.link || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    toast.success('Draft updated');
  },

  publishAnnouncement: async (id: number): Promise<{ notified_count: number }> => {
    const { data: announcement } = await supabase
      .from('platform_announcements')
      .select('id, title, body, link, channel')
      .eq('id', id)
      .maybeSingle();

    const channel = (announcement?.channel as AnnouncementChannel) || 'both';

    const { data, error } = await supabase.rpc('admin_publish_announcement', {
      p_announcement_id: id,
    });
    if (error) throw error;
    const notified = Number((data as { notified_count?: number })?.notified_count ?? 0);

    if (channel === 'email' || channel === 'both') {
      try {
        await supabase.functions.invoke('admin-system', {
          body: {
            action: 'announce_email_fanout',
            title: announcement?.title ?? 'Announcement',
            message: announcement?.body ?? '',
            link: announcement?.link || '/home',
          },
        });
      } catch (e) {
        console.warn('Announcement email fan-out failed', e);
      }
    }

    toast.success(
      channel === 'email'
        ? 'Published · email fan-out started'
        : `Published · notified ${notified} users`
    );
    return { notified_count: notified };
  },

  archiveAnnouncement: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('platform_announcements')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    toast.success('Announcement archived');
  },

  listCommunicationTemplates: async (): Promise<CommunicationTemplate[]> => {
    const { data, error } = await supabase
      .from('communication_templates')
      .select('*')
      .order('category')
      .order('name');
    if (error) {
      const msg = error.message || '';
      // Table not migrated yet — show bundled Figma catalog so admin UI still works.
      if (/communication_templates|does not exist|schema cache/i.test(msg)) {
        const { BUNDLED_COMMUNICATION_TEMPLATES } = await import(
          '@/lib/communication-templates-catalog'
        );
        communicationTemplatesFromBundle = true;
        return BUNDLED_COMMUNICATION_TEMPLATES;
      }
      communicationTemplatesFromBundle = false;
      throw error;
    }
    communicationTemplatesFromBundle = false;
    return (data ?? []) as CommunicationTemplate[];
  },

  saveCommunicationTemplate: async (payload: {
    id: string;
    subject: string;
    html: string;
  }): Promise<void> => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('communication_templates')
      .update({
        subject: payload.subject,
        html: payload.html,
        updated_at: new Date().toISOString(),
        updated_by: auth.user?.id ?? null,
      })
      .eq('id', payload.id);
    if (error) throw error;
    toast.success('Template saved');
  },

  testCommunicationTemplate: async (opts: {
    templateId: string;
    to: string;
  }): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('admin-system', {
      body: {
        action: 'test_template',
        template_id: opts.templateId,
        to: opts.to,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    toast.success(`Test sent to ${opts.to}`);
  },

  listEmailSendLog: async (limit = 80): Promise<EmailSendLogRow[]> => {
    const { data, error } = await supabase
      .from('email_send_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as EmailSendLogRow[];
  },

  readSettingValue: (settings: SystemSettingsMap, key: string, fallback: unknown) => {
    const entry = settings[key];
    if (!entry) return fallback;
    return entry.value ?? fallback;
  },

  formatError: asErrorMessage,
};
