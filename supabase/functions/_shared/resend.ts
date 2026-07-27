/**
 * Shared Resend transactional email helpers for Edge Functions.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  EMAIL_OPT_IN_TYPES,
  MARKETING_TYPES,
  NOTIFICATION_TYPE_TO_TEMPLATE,
  renderTransactionalTemplate,
  type EmailTemplateId,
  type TemplateVars,
} from "./email-templates.ts";

export type ServiceClient = SupabaseClient;

export interface EmailSettings {
  notificationsEnabled: boolean;
  fromEmail: string;
  fromName: string;
  siteUrl: string;
  siteName: string;
}

export interface SendEmailResult {
  sent: boolean;
  skipped?: string;
  error?: string;
  messageId?: string | null;
}

const SETTINGS_KEYS = [
  "email.notifications_enabled",
  "email.from_email",
  "email.from_name",
  "platform.site_name",
  "platform.site_url",
];

export function getResendApiKey(): string {
  return (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
}

export async function loadEmailSettings(admin: ServiceClient): Promise<EmailSettings> {
  const { data } = await admin
    .from("system_settings")
    .select("key, value")
    .in("key", SETTINGS_KEYS);

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    let v = row.value;
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        /* keep string */
      }
    }
    map[row.key] = v;
  }

  return {
    notificationsEnabled: map["email.notifications_enabled"] !== false,
    fromEmail: String(
      Deno.env.get("EMAIL_FROM")?.trim() || map["email.from_email"] || "team@wya254.com"
    ),
    fromName: String(
      Deno.env.get("EMAIL_FROM_NAME")?.trim() ||
        map["email.from_name"] ||
        map["platform.site_name"] ||
        "WYA"
    ),
    siteUrl: String(map["platform.site_url"] || "https://www.wya254.com"),
    siteName: String(map["platform.site_name"] || "WYA"),
  };
}

function isGhostEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith("@wya.local");
}

export interface RecipientProfile {
  id: string;
  email: string | null;
  email_notifications: boolean | null;
  marketing_consent: boolean | null;
  is_ghost: boolean | null;
  notification_email_prefs: Record<string, boolean> | null;
  full_name?: string | null;
  username?: string | null;
}

export async function getRecipientProfile(
  admin: ServiceClient,
  userId: string
): Promise<RecipientProfile | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, email_notifications, marketing_consent, is_ghost, notification_email_prefs, full_name, username"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const email = authData?.user?.email ?? null;

  return {
    id: profile.id,
    email,
    email_notifications: profile.email_notifications,
    marketing_consent: profile.marketing_consent,
    is_ghost: profile.is_ghost,
    notification_email_prefs: (profile.notification_email_prefs as Record<string, boolean>) ?? null,
    full_name: profile.full_name,
    username: profile.username,
  };
}

export function canSendTransactional(
  settings: EmailSettings,
  profile: RecipientProfile | null,
  notificationType?: string
): { ok: boolean; reason?: string; email?: string } {
  if (!settings.notificationsEnabled) return { ok: false, reason: "platform_disabled" };
  if (!getResendApiKey()) return { ok: false, reason: "resend_not_configured" };
  if (!profile) return { ok: false, reason: "no_profile" };
  if (profile.is_ghost) return { ok: false, reason: "ghost" };
  if (isGhostEmail(profile.email)) return { ok: false, reason: "ghost_email" };
  if (!profile.email?.includes("@")) return { ok: false, reason: "no_email" };
  if (profile.email_notifications === false) return { ok: false, reason: "user_disabled" };

  if (notificationType && profile.notification_email_prefs) {
    const pref = profile.notification_email_prefs[notificationType];
    if (pref === false) return { ok: false, reason: "type_disabled" };
  }

  return { ok: true, email: profile.email! };
}

export function canSendMarketing(
  settings: EmailSettings,
  profile: RecipientProfile | null,
  notificationType?: string
): { ok: boolean; reason?: string; email?: string } {
  const base = canSendTransactional(settings, profile, notificationType);
  if (!base.ok) return base;
  if (profile?.marketing_consent !== true) return { ok: false, reason: "no_marketing_consent" };
  return base;
}

export async function sendRawEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail: string;
  fromName: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<SendEmailResult> {
  const key = getResendApiKey();
  if (!key) return { sent: false, skipped: "resend_not_configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${opts.fromName} <${opts.fromEmail}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      tags: opts.tags,
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Resend error", res.status, payload);
    return {
      sent: false,
      error: String(payload?.message || payload?.error || `Resend error (${res.status})`),
    };
  }

  return { sent: true, messageId: payload?.id ?? null };
}

export async function logEmailSend(
  admin: ServiceClient,
  row: {
    user_id?: string | null;
    to_email: string;
    template_id: string;
    subject: string;
    status: string;
    provider_id?: string | null;
    error?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await admin.from("email_send_log").insert({
      user_id: row.user_id ?? null,
      to_email: row.to_email,
      template_id: row.template_id,
      subject: row.subject,
      status: row.status,
      provider_id: row.provider_id ?? null,
      error: row.error ?? null,
      metadata: row.metadata ?? {},
    });
  } catch (e) {
    console.error("email_send_log insert failed", e);
  }
}

export async function sendTransactionalToUser(opts: {
  admin: ServiceClient;
  userId: string;
  templateId: EmailTemplateId;
  vars?: TemplateVars;
  notificationType?: string;
  requireMarketing?: boolean;
  /** Force send even for opt-in noisy types */
  forceEmail?: boolean;
}): Promise<SendEmailResult> {
  const settings = await loadEmailSettings(opts.admin);
  const profile = await getRecipientProfile(opts.admin, opts.userId);
  const nType = opts.notificationType ?? opts.templateId;

  if (!opts.forceEmail && EMAIL_OPT_IN_TYPES.has(nType)) {
    const pref = profile?.notification_email_prefs?.[nType];
    if (pref !== true) {
      return { sent: false, skipped: "social_opt_in_required" };
    }
  }

  const needsMarketing = opts.requireMarketing || MARKETING_TYPES.has(nType);
  const gate = needsMarketing
    ? canSendMarketing(settings, profile, nType)
    : canSendTransactional(settings, profile, nType);

  if (!gate.ok || !gate.email) {
    return { sent: false, skipped: gate.reason ?? "blocked" };
  }

  const displayName =
    profile?.full_name?.trim() || profile?.username?.trim() || "there";

  const rendered = renderTransactionalTemplate(opts.templateId, {
    siteUrl: settings.siteUrl,
    userName: displayName,
    ...opts.vars,
  });

  const result = await sendRawEmail({
    to: gate.email,
    subject: rendered.subject,
    html: rendered.html,
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    tags: [
      { name: "template", value: opts.templateId.slice(0, 40) },
      { name: "type", value: String(nType).slice(0, 40) },
    ],
  });

  await logEmailSend(opts.admin, {
    user_id: opts.userId,
    to_email: gate.email,
    template_id: opts.templateId,
    subject: rendered.subject,
    status: result.sent ? "sent" : result.skipped ? "skipped" : "error",
    provider_id: result.messageId,
    error: result.error ?? result.skipped ?? null,
    metadata: { notificationType: nType },
  });

  return result;
}

export async function sendNotificationEmail(opts: {
  admin: ServiceClient;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown> | null;
  sendEmail?: boolean;
}): Promise<SendEmailResult> {
  if (opts.sendEmail === false) {
    return { sent: false, skipped: "send_email_false" };
  }

  // Social types: only if user opted in via prefs (forceEmail path not used here)
  if (EMAIL_OPT_IN_TYPES.has(opts.type) && opts.sendEmail !== true) {
    const profile = await getRecipientProfile(opts.admin, opts.userId);
    if (profile?.notification_email_prefs?.[opts.type] !== true) {
      return { sent: false, skipped: "social_opt_in_required" };
    }
  }

  const templateId =
    NOTIFICATION_TYPE_TO_TEMPLATE[opts.type] ?? ("generic" as EmailTemplateId);

  const eventTitle =
    (opts.data?.eventTitle as string) ||
    (opts.data?.event_title as string) ||
    opts.title;

  return sendTransactionalToUser({
    admin: opts.admin,
    userId: opts.userId,
    templateId,
    notificationType: opts.type,
    forceEmail: opts.sendEmail === true && EMAIL_OPT_IN_TYPES.has(opts.type),
    requireMarketing: MARKETING_TYPES.has(opts.type),
    vars: {
      title: opts.title,
      message: opts.message,
      link: opts.link,
      eventTitle,
      whenLabel: opts.data?.whenLabel as string | undefined,
    },
  });
}

export function createServiceClient(): ServiceClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

export { renderTransactionalTemplate, NOTIFICATION_TYPE_TO_TEMPLATE };
