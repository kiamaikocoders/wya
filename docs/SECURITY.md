# Security Configuration

This project follows strict security protocols. Configure the following for production.

## Authentication & Sessions (Supabase)

- **JWT expiration**: In [Supabase Dashboard](https://supabase.com/dashboard) → Project → Authentication → Settings, set **JWT expiry** to a maximum of **7 days** (e.g. `604800` seconds).
- **Refresh token rotation**: Supabase Auth uses refresh token rotation by default. Ensure you do not disable it in Auth settings.

## CORS (Edge Functions)

Do **not** use wildcard `*` for CORS. Set an allowlist:

- **Env (all Edge Functions)**: `ALLOWED_ORIGINS` — comma-separated list of allowed origins. Include production and local dev, e.g.  
  `https://www.wya254.com,https://wya254.com,https://admin.wya254.com,http://localhost:8080,http://localhost:5173`

Supabase stores this as **one** project secret: **Dashboard → Project Settings → Edge Functions → Secrets** → `ALLOWED_ORIGINS`. Every function that checks CORS against this variable uses the **same** value—no per-function duplicate. Add **every origin** where your SPA runs (production consumer, **admin subdomain**, preview/staging, local Vite ports such as `http://localhost:5173`). If an origin is missing, browser calls from that site to `*.supabase.co/functions/v1/...` will fail CORS.

Functions that rely on `ALLOWED_ORIGINS` include (non-exhaustive): `request-password-reset`, `admin-get-ghost-user-ids`, `delete-my-account`, `mpesa`, `process-ghost-actions`, **`create-event-media-share`**, **`public-event-media-gallery`**, and others that mirror the same pattern.

- **`create-event-media-share`**: Admin copies a share link from the dashboard on **`https://admin.wya254.com`**; that admin origin must be in `ALLOWED_ORIGINS`. Gallery URLs themselves should use the public site (`PUBLIC_SITE_URL` / `https://www.wya254.com`).
- **`public-event-media-gallery`**: The **shared gallery page** loads on the main app (`www` `/share/event-media/...`) and the browser requests this function **cross-origin** from that same app origin—so that origin must also appear in `ALLOWED_ORIGINS`.

## Domains

| Host | Role |
|------|------|
| `https://www.wya254.com` | Consumer app (events, auth, shares) |
| `https://admin.wya254.com` | Admin console only (`/admin/*`) |
| `https://cdn.wya254.com` | Media CDN |

Client env (optional overrides): `VITE_PUBLIC_SITE_URL`, `VITE_ADMIN_SITE_URL`.

## Redirect URLs (Open Redirect Prevention)

- **Client**: Set `VITE_ALLOWED_REDIRECT_ORIGINS` to a comma-separated list of origins allowed for password-reset redirects, e.g.  
  `https://app.example.com,http://localhost:5173`  
  Only these origins will be used as `redirectTo`; others fall back to Supabase dashboard default.
- **Supabase Dashboard**: In Authentication → URL Configuration, add the same URLs to **Redirect URLs**.

## Password Reset Rate Limiting

- **Edge Function** `request-password-reset`: Enforces e.g. **3 requests per email per hour**.
- **Client**: Set `VITE_SUPABASE_URL` to your Supabase project URL (e.g. `https://xxx.supabase.co`) so the app calls the rate-limited function instead of `resetPasswordForEmail` directly.
- **Function secrets**: For `request-password-reset`, set `SUPABASE_ANON_KEY` (project anon key). Optionally set `REDIRECT_URL` for the reset link (must be in Supabase redirect allowlist).

## M-Pesa Webhook

- **Callback URL**: When registering the callback with Safaricom, use a URL that includes a secret only you know, e.g.  
  `https://xxx.supabase.co/functions/v1/mpesa-callback?secret=YOUR_SECRET`
- **Env**: Set `MPESA_CALLBACK_SECRET` to the same value. The function rejects requests whose `secret` query param does not match.

## Admin dashboard (user stats)

The admin dashboard no longer calls `auth.admin.listUsers()` from the client (that requires the service role and returns 403 with the anon key). Instead it calls the **admin-get-ghost-user-ids** Edge Function, which verifies the user is an admin and returns only ghost user IDs for stats exclusion.

- Set **`VITE_SUPABASE_URL`** so the client can call this function (and **request-password-reset**).
- The function uses **`ALLOWED_ORIGINS`** for CORS and **`SUPABASE_ANON_KEY`** to verify the user's JWT.

## Env Summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `ALLOWED_ORIGINS` | Edge Functions | CORS allowlist (comma-separated), e.g. `https://www.wya254.com,https://admin.wya254.com` |
| `VITE_PUBLIC_SITE_URL` | Client build | Consumer origin (default `https://www.wya254.com`) |
| `VITE_ADMIN_SITE_URL` | Client build | Admin origin (default `https://admin.wya254.com`) |
| `VITE_ALLOWED_REDIRECT_ORIGINS` | Client build | Password reset redirect allowlist |
| `VITE_SUPABASE_URL` | Client build | Supabase base URL (password reset + admin ghost IDs) |
| `SUPABASE_ANON_KEY` | request-password-reset, admin-get-ghost-user-ids | Auth recover + JWT verification |
| `REDIRECT_URL` | request-password-reset function | Optional reset link redirect |
| `MPESA_CALLBACK_SECRET` | mpesa-callback function | Optional callback URL secret |
| `PUBLIC_SITE_URL` | create-event-media-share | Public gallery base URL |
