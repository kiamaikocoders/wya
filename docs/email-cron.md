# Email cron jobs

These Edge Functions send product email on a schedule. Auth: `Authorization: Bearer $CRON_SECRET` or service role key.

| Function | Suggested cadence | Purpose |
|---|---|---|
| `send-event-reminders` | every 15–30 min | T−24h and T−2h ticket holder reminders |
| `send-message-digests` | hourly | Unread DM digest |
| `send-ai-digests` | weekly (e.g. Monday 09:00 EAT) | Users with `onboarding_preferences.notify_ai_digest` |
| `send-newsletter` | weekly or on-demand | `marketing_consent` profiles + `newsletter_subscribers` |

## Example (curl)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/send-event-reminders" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Schedule via [Supabase Scheduled Functions](https://supabase.com/docs/guides/functions/schedule-functions), GitHub Actions cron, or any external scheduler.

## Secrets

- `RESEND_API_KEY` — required for sends
- `CRON_SECRET` — shared secret for cron callers
- Optional: `EMAIL_FROM`, `EMAIL_FROM_NAME`
