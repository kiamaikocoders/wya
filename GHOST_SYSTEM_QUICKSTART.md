# Ghost User System - Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration

```bash
# Apply the migration
supabase migration up
# Or if using Supabase CLI locally:
supabase db push
```

This creates:
- `is_ghost` column on profiles table
- `ghost_persona_groups` table (with 5 default groups)
- `ghost_action_queue` table
- `ghost_action_log` table
- RLS policies (admin-only access)

### Step 2: Seed Ghost Accounts

```bash
# Get your service role key from:
# Supabase Dashboard → Settings → API → service_role key

export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export VITE_SUPABASE_URL="https://your-project.supabase.co"

# Run the seeding script
npx tsx scripts/seed-ghost-users.ts
```

This creates:
- 50 Kenyan persona accounts (25 male, 25 female)
- Follow relationships between accounts
- Distribution across 5 persona groups

### Step 3: Deploy Edge Function

```bash
# Deploy the action processor
supabase functions deploy process-ghost-actions

# Set environment variables (if not already set)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

## 📋 Using the System

### Access Ghost Management

1. Log in as admin
2. Go to **Admin Dashboard** → **Ghost Management** tab

### Queue an Action

1. Go to **Create Action** tab
2. Select action type (e.g., "Like Story")
3. Enter target ID (e.g., story ID: 123)
4. Select persona group or "All Ghost Users"
5. Click **Queue Action**

### Process Actions

The Edge Function processes actions automatically. To trigger manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-ghost-actions \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or set up a cron job to run every 5 minutes.

## 🎯 Example Use Cases

### Boost a Story's Engagement

1. Find a story ID (e.g., from Story feed)
2. Queue action: `like_story` → Target: `story` → ID: `123`
3. Select persona group: `highly_active`
4. Action will be processed with randomized timing

### Create Ghost-Generated Content

1. Queue action: `create_story`
2. In metadata JSON:
```json
{
  "content": "Amazing event! Had so much fun! 🎉",
  "media_url": "https://example.com/event-photo.jpg"
}
```
3. Ghost accounts will create stories with this content

### Boost Event Visibility

1. Queue action: `share_event` → Target: `event` → ID: `456`
2. All ghost users will share the event
3. Creates social proof and visibility

## 🔒 Security Notes

- **Service Role Key**: Never commit to version control
- **Admin Only**: Only users with `username = 'admin'` can access
- **Audit Trail**: All actions logged in `ghost_action_log`
- **RLS Protected**: Database tables protected by Row Level Security

## 📊 Monitoring

- **Statistics**: View in Ghost Management dashboard
- **Action Log**: Check `ghost_action_log` table for detailed execution
- **Queue Status**: Monitor pending/completed/failed actions

## 🐛 Troubleshooting

**Ghost accounts not created?**
- Check service role key is correct
- Verify Supabase URL
- Check script output for errors

**Actions not processing?**
- Verify Edge Function is deployed
- Check Edge Function logs in Supabase Dashboard
- Ensure service role key is set in function environment

**Actions failing?**
- Check `ghost_action_log` for error messages
- Verify target IDs exist
- Check Edge Function logs

## 📚 Full Documentation

See `docs/ghost-user-system.md` for complete documentation.
