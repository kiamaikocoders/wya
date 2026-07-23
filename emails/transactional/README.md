# Transactional email templates

Product (non-Auth) emails are rendered by Edge Functions in
`supabase/functions/_shared/email-templates.ts` using the Figma layout in
`email-layout.ts` (light theme, badge + two-line headline + CTA pill).

Static HTML mirrors for admin preview / `communication_templates` seed are in
this folder. Auth templates remain in `emails/*.html`.

Design source: [Figma · 16 — Emails](https://www.figma.com/design/9RMXZrqarVf6A3t4Lug70v/WYA?node-id=397-3).

## Template IDs

See `EmailTemplateId` in `_shared/email-templates.ts` (ticket confirmation,
reminders, proposals, marketplace, digests, admin system test, etc.).

## Sending

All product sends go through `_shared/resend.ts`:

- Gated by `system_settings.email.notifications_enabled`
- Gated by `profiles.email_notifications`
- Marketing/digest gated by `profiles.marketing_consent`
- Ghosts / `@wya.local` never emailed
- Logged to `email_send_log`
