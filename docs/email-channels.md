# WYA Email Channels

Inventory of every email instance in the product: what is live, what was built in the transactional email system, and scheduling notes.

**Stack**

- **Auth delivery:** Supabase Auth → Resend SMTP (`smtp.resend.com`)
- **Transactional / platform:** Resend API via `supabase/functions/_shared/resend.ts` (`RESEND_API_KEY`)
- **Hub:** [`dispatch-notification`](../supabase/functions/dispatch-notification/index.ts) → in-app + OneSignal + Resend
- **Templates:** Auth HTML in `emails/*.html` (Figma light theme); product templates in `_shared/email-templates.ts` (see `emails/transactional/`)
- **Assets:** `public/emails/wya-logo.png`, `public/emails/hero-welcome.jpg`
- **Design:** [Figma · 16 — Emails](https://www.figma.com/design/9RMXZrqarVf6A3t4Lug70v/WYA?node-id=397-3)
- **Prefs:** `email.notifications_enabled`, `profiles.email_notifications`, `profiles.notification_email_prefs`, `marketing_consent`
- **Logging:** `email_send_log`, reminder dedupe `email_reminder_log`
- **Cron docs:** [email-cron.md](./email-cron.md)

---

## 1. Live — Auth (Supabase Auth → Resend SMTP)

| Channel | Template | Trigger |
|---|---|---|
| Signup confirmation | `emails/confirm-signup.html` | `signUp` / resend |
| Password reset | `emails/reset-password.html` | `request-password-reset` / recover |
| Magic link | `emails/magic-link.html` | `signInWithOtp` |
| Change email | `emails/change-email.html` | `updateUser({ email })` |
| Invite user | `emails/invite-user.html` | Admin → `admin-invite-user` → `inviteUserByEmail` |
| Reauthentication | `emails/reauthentication.html` | `auth.reauthenticate()` before account delete |

Paste Auth HTML into **Supabase → Authentication → Email Templates** once.

---

## 2. Live — Product (Resend API)

| Channel | Template id | Trigger |
|---|---|---|
| Admin system test | inline | Admin Email → test send |
| Ticket confirmation | `ticket-confirmation` | Confirmed purchase (`ticket-service`) via dispatch |
| Event updated | `event-updated` | `eventService.updateEvent` → ticket holders |
| Event cancelled | `event-cancelled` | `eventService.deleteEvent` → ticket holders |
| Event reminder T−24h / T−2h | `event-reminder` | Cron `send-event-reminders` |
| Proposal submitted / approved / rejected | `proposal-*` | RequestEvent + ProposalManagement → dispatch |
| Marketplace buyer / seller | `marketplace-*` | purchase/claim + `marketplace-confirm-payment` |
| Platform announcement | `announcement` | `publishAnnouncement` → `admin-system` fan-out |
| New event | `new-event` | Existing AdminCreateEvent fan-out → dispatch email |
| Organizer assigned | `organizer-assigned` | Event update with `organizer_id` |
| Media share | `media-share` | `create-event-media-share` + optional `recipient_email` |
| DSAR export ready | `dsar-export-ready` | After `gdprService.exportUserData` |
| Account deleted | `account-deleted` | `delete-my-account` (before user removal) |
| Welcome | `welcome` | Onboarding welcome notification |
| Feedback status | `feedback-reply` | Admin updates `app_feedback` status |
| Survey invite | `survey-invite` | `surveyService.inviteTicketHolders` |
| Newsletter / waitlist confirm | `waitlist-confirmation` | Footer → `subscribe-newsletter` |
| Weekly AI digest | `ai-digest` | Cron `send-ai-digests` |
| Newsletter blast | `newsletter` | Cron `send-newsletter` |
| Message digest | `message-digest` | Cron `send-message-digests` |
| Follower / story like | `follower` / `story-like` | Via dispatch **only if** user opted in (`notification_email_prefs`) |

---

## 3. Settings / prefs (wired)

| Item | Behavior |
|---|---|
| `email.notifications_enabled` | Platform master switch |
| `profiles.email_notifications` | User master switch (Settings + NotificationSettings) |
| `notification_email_prefs` | Per-type toggles; social defaults **off** |
| `marketing_consent` | Required for newsletter / AI digest / partner pitches |
| Footer subscribe | Writes `newsletter_subscribers` + confirmation email |

---

## 4. Partial / notes

| Channel | Notes |
|---|---|
| Check-in | DB trigger inserts in-app `checkin` notification; email requires caller using dispatch (no scanner email path yet) |
| Partner pitches / community highlights | Templates + marketing gates exist; send via cron/admin with `send-transactional-email` when content ready |
| M-Pesa ticket confirm | Pending until M-Pesa callback restores; hook same `ticket` notification on confirm |
| Team/org invites | **Blocked** — no org membership model |
| Ghost users | Never emailed (`is_ghost` / `@wya.local`) |

---

## 5. Edge Functions

| Function | Role |
|---|---|
| `dispatch-notification` | In-app + push + email |
| `admin-system` | Health, test email, announcement email fan-out |
| `send-transactional-email` | Service-role / cron sender |
| `subscribe-newsletter` | Public subscribe + confirm |
| `send-event-reminders` | Reminder cron |
| `send-message-digests` | DM digest cron |
| `send-ai-digests` | Weekly digest cron |
| `send-newsletter` | Newsletter cron |
| `admin-invite-user` | Auth invite |
| `marketplace-confirm-payment` | Completes transfer + emails |
| `create-event-media-share` | Share link + optional email |
| `delete-my-account` | Goodbye email + delete |

---

## Admin Communications hub

`/admin/communications` (Agribeta-style):

| Tab | Purpose |
|---|---|
| Broadcast | Compose with audience + channel (`email` / `in_app` / `both`), history table |
| Email templates | Edit/preview/test `communication_templates` |
| Delivery log | `email_send_log` |
| Provider | Resend settings (former `/admin/email`) |

`/admin/email` redirects to Communications.

## Deploy checklist

1. Apply migrations: `20260722205538_email_transactional_system.sql`, `20260722210836_email_checkin_notify.sql`, `20260723121013_communications_hub.sql`, `20260723152200_figma_email_templates.sql`
2. Set secrets: `RESEND_API_KEY`, optional `CRON_SECRET`, `EMAIL_FROM`
3. Deploy Edge Functions (including `_shared`) and ship `public/emails/*`
4. Paste Auth templates from `emails/*.html` in Supabase dashboard
5. Schedule cron functions (see [email-cron.md](./email-cron.md))
6. Smoke: admin test email, ticket purchase, proposal approve, footer subscribe
