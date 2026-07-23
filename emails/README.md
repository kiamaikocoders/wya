# WYA Email Templates

HTML email templates matching Figma **16 — Emails**
([WYA design file](https://www.figma.com/design/9RMXZrqarVf6A3t4Lug70v/WYA?node-id=397-3)).

## Brand (Figma light theme)

| Token | Value |
|---|---|
| Page background | `#f6f8fa` |
| Soft card | `#eff2f5` |
| Accent | `#ff6b35` |
| Text | `#1f2328` |
| Muted | `#656d76` |

Assets (host on the site origin):

- `/emails/wya-logo.png`
- `/emails/heroes/{template-id}.jpg` — one Figma hero per template (25 unique images)
- `/emails/hero-welcome.jpg` — alias of confirm-signup (legacy)

Auth templates use `{{ .SiteURL }}/emails/...` so Supabase injects the site URL.

## Auth templates (paste into Supabase)

| File | Supabase template | CTA var |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `{{ .ConfirmationURL }}` |
| `invite-user.html` | Invite user | `{{ .ConfirmationURL }}` |
| `magic-link.html` | Magic Link | `{{ .ConfirmationURL }}` |
| `change-email.html` | Change Email Address | `{{ .ConfirmationURL }}` |
| `reset-password.html` | Reset Password | `{{ .ConfirmationURL }}` |
| `reauthentication.html` | Reauthentication | `{{ .ConfirmationURL }}` |
| `admin-system-test.html` | (Resend API only) | Site admin link |

## Transactional

Reference HTML lives in `emails/transactional/*.html` (admin catalog / preview).
**Live product sends** are rendered by
`supabase/functions/_shared/email-templates.ts` + `email-layout.ts`.

## Deploy

1. Ship `public/emails/*` with the web app so logo/hero URLs resolve.
2. Paste each Auth HTML into **Supabase → Authentication → Email Templates**.
3. Apply migration `20260723152200_figma_email_templates.sql` (seeds `communication_templates`).
4. Redeploy Edge Functions that import `_shared/email-templates.ts`.
