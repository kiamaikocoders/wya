# Security Configuration

This project follows strict security protocols. Configure the following for production.

## Authentication & Sessions (Supabase)

- **JWT expiration**: In [Supabase Dashboard](https://supabase.com/dashboard) → Project → Authentication → Settings, set **JWT expiry** to a maximum of **7 days** (e.g. `604800` seconds).
- **Refresh token rotation**: Supabase Auth uses refresh token rotation by default. Ensure you do not disable it in Auth settings.

## CORS (Edge Functions)

Do **not** use wildcard `*` for CORS. Set an allowlist:

- **Env (all Edge Functions)**: `ALLOWED_ORIGINS` — comma-separated list of allowed origins, e.g.  
  `https://app.example.com,https://www.example.com,http://localhost:5173`

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

## Env Summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `ALLOWED_ORIGINS` | Edge Functions | CORS allowlist (comma-separated) |
| `VITE_ALLOWED_REDIRECT_ORIGINS` | Client build | Password reset redirect allowlist |
| `VITE_SUPABASE_URL` | Client build | Supabase base URL for rate-limited password reset |
| `SUPABASE_ANON_KEY` | request-password-reset function | To call Auth recover |
| `REDIRECT_URL` | request-password-reset function | Optional reset link redirect |
| `MPESA_CALLBACK_SECRET` | mpesa-callback function | Optional callback URL secret |
