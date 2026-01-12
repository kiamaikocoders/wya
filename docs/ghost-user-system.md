# Ghost User System Documentation

## Overview

The Ghost User System is designed to boost platform engagement by programmatically creating and managing "ghost" accounts that can perform actions like likes, shares, comments, and content creation. This system is strictly restricted to admin users and includes sophisticated randomization to prevent detection.

## Architecture

### Components

1. **Database Schema** (`supabase/migrations/20250129_ghost_user_system.sql`)
   - `profiles.is_ghost` flag to mark ghost accounts
   - `ghost_persona_groups` table for different engagement patterns
   - `ghost_action_queue` table for queued actions
   - `ghost_action_log` table for audit trail

2. **Seeding Script** (`scripts/seed-ghost-users.ts`)
   - Creates 50 Kenyan persona accounts
   - Sets up follow relationships
   - Distributes accounts across persona groups

3. **Admin UI** (`src/components/admin/GhostManagement.tsx`)
   - View ghost users
   - Create and manage action queue
   - Monitor execution status

4. **Edge Function** (`supabase/functions/process-ghost-actions/index.ts`)
   - Processes queued actions
   - Implements randomization
   - Executes actions with service role permissions

## Phase 1: Supabase Configuration

### Using Service Role API for Account Creation

The seeding script uses Supabase's **Service Role Key** to bypass email confirmation and RLS policies. This is the recommended approach for programmatic account creation.

#### Getting Your Service Role Key

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Find the **service_role** key (NOT the anon key)
3. Copy this key - it has full database access

⚠️ **IMPORTANT**: Never commit the service role key to version control!

#### Environment Variables

Set these environment variables before running the seeding script:

```bash
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

Or inline:
```bash
VITE_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npx tsx scripts/seed-ghost-users.ts
```

#### Why Service Role?

- **Bypasses Email Confirmation**: Can create accounts with `email_confirm: true`
- **Bypasses RLS**: Can insert into any table regardless of policies
- **Required for Ghost Accounts**: Needed to create accounts programmatically

#### Alternative: Disable Email Confirmation (Not Recommended)

If you want to disable email confirmation for ALL users (not recommended):

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Under "Email Auth", toggle **"Enable email confirmations"** OFF

⚠️ **Warning**: This affects ALL new signups, not just ghost accounts.

## Phase 2: Seeding Ghost Accounts

### Running the Seeding Script

```bash
# Make sure you have the service role key set
export SUPABASE_SERVICE_ROLE_KEY="your-key-here"
export VITE_SUPABASE_URL="https://your-project.supabase.co"

# Run the script
npx tsx scripts/seed-ghost-users.ts
```

### What Gets Created

- **50 Ghost Accounts** (25 male, 25 female)
- **Kenyan Names**: Otieno, Kamau, Anyango, Mutua, etc.
- **Realistic Profiles**: Bios, locations (Nairobi, Mombasa, etc.)
- **Follow Relationships**: Each ghost follows 5-10 other ghosts
- **Persona Group Distribution**:
  - 10 highly_active
  - 15 moderately_active
  - 10 casual_users
  - 10 content_creators
  - 5 lurkers

### Account Details

- **Emails**: `ghost.{username}@wya.local` (won't receive emails)
- **Passwords**: Randomly generated (not used)
- **Visibility**: Ghost accounts are visible to real users
- **Profile Data**: Includes realistic Kenyan names, locations, and bios

## Phase 3: Admin Ghost Management

### Accessing Ghost Management

1. Log in as admin
2. Go to **Admin Dashboard** → **Ghost Management** tab

### Features

#### 1. View Ghost Users
- See all 50 ghost accounts
- Filter by persona group
- View profile details

#### 2. Create Actions
Queue actions for ghost accounts to perform:

**Action Types:**
- `like_story` - Like a story
- `like_post` - Like a forum post
- `like_community_post` - Like a community post
- `share_event` - Share an event
- `share_story` - Share a story
- `share_post` - Share a post
- `comment_story` - Comment on a story
- `comment_post` - Comment on a post
- `create_story` - Create a new story
- `create_post` - Create a forum post
- `follow_user` - Follow a user
- `view_content` - View content (tracking)

**Target Types:**
- `story` - Story ID
- `forum_post` - Forum post ID
- `community_post` - Community post ID
- `event` - Event ID
- `user` - User ID

**Persona Groups:**
- Select specific persona group or "All Ghost Users"

**For Content Creation:**
When creating stories or posts, provide metadata as JSON:
```json
{
  "content": "Great event! 🎉",
  "media_url": "https://example.com/image.jpg"
}
```

#### 3. Monitor Queue
- View all queued actions
- See status (pending, processing, completed, failed)
- Cancel pending actions
- Delete actions

#### 4. Statistics
- Total ghost users
- Queued actions count
- Pending/completed/failed breakdown

## Phase 4: Action Processing

### Edge Function

The `process-ghost-actions` Edge Function processes queued actions with randomization.

### How It Works

1. **Fetches Pending Actions**: Gets up to 10 pending actions per execution
2. **Gets Ghost Users**: Based on persona group or specific user list
3. **Applies Engagement Rate**: Filters users based on persona group's engagement rate
4. **Randomizes Timing**: Adds delays between actions (2-60 seconds by default)
5. **Executes Actions**: Performs the action for each selected ghost user
6. **Logs Results**: Records success/failure in action log
7. **Updates Status**: Marks action as completed or failed

### Randomization Features

- **Staggered Execution**: Actions spread over time (not all at once)
- **Random Delays**: 2-60 seconds between actions (configurable per persona)
- **Engagement Rate**: Not all ghosts participate (85% by default)
- **Human-like Patterns**: Varies timing and participation

### Triggering the Function

#### Option 1: Manual Trigger (via API)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-ghost-actions \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### Option 2: Cron Job (Recommended)

Set up a cron job to call the function periodically:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/process-ghost-actions -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Option 3: Supabase Cron (if available)

Use Supabase's built-in cron functionality if available.

### Deployment

Deploy the Edge Function:

```bash
supabase functions deploy process-ghost-actions
```

Make sure to set environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Security

### Admin-Only Access

- **Frontend**: Protected by `ProtectedRoute` with `adminOnly={true}`
- **Backend**: RLS policies check for `username = 'admin'`
- **Edge Function**: Uses service role key (server-side only)

### Audit Trail

All ghost actions are logged in `ghost_action_log` table:
- Which ghost user performed the action
- Success/failure status
- Error messages (if failed)
- Timestamp

### Best Practices

1. **Never expose service role key** to frontend
2. **Monitor action logs** regularly
3. **Use persona groups** to vary engagement patterns
4. **Don't overuse** - maintain realistic engagement rates
5. **Review statistics** to ensure natural patterns

## Persona Groups

### Default Groups

1. **highly_active** (95% engagement, 50% content creation)
   - Most active users
   - Frequent likes, shares, comments
   - Creates content regularly

2. **moderately_active** (85% engagement, 30% content creation)
   - Balanced engagement
   - Standard participation rates

3. **casual_users** (70% engagement, 15% content creation)
   - Occasional engagement
   - Rarely creates content

4. **content_creators** (80% engagement, 80% content creation)
   - Focuses on creating content
   - Less engagement, more creation

5. **lurkers** (50% engagement, 5% content creation)
   - Mostly views content
   - Rarely engages

### Customizing Persona Groups

Edit persona groups in the database or via SQL:

```sql
UPDATE ghost_persona_groups
SET engagement_rate = 0.90,
    content_creation_rate = 0.40
WHERE name = 'highly_active';
```

## Troubleshooting

### Ghost Accounts Not Created

- Check service role key is correct
- Verify Supabase URL is correct
- Check for existing ghost accounts (script will warn)

### Actions Not Processing

- Verify Edge Function is deployed
- Check Edge Function logs in Supabase Dashboard
- Ensure service role key is set in Edge Function environment
- Check action queue status

### Actions Failing

- Check `ghost_action_log` for error messages
- Verify target IDs exist (story/post/event)
- Check RLS policies (Edge Function uses service role, should bypass)

### Randomization Not Working

- Check persona group settings (min/max delay)
- Verify engagement rates are set correctly
- Check Edge Function logs for timing issues

## Future Enhancements

- [ ] Scheduled actions (queue actions for future execution)
- [ ] Bulk action creation (queue multiple actions at once)
- [ ] Action templates (save common action patterns)
- [ ] Advanced analytics (engagement patterns, success rates)
- [ ] A/B testing support (different strategies per persona group)
- [ ] Content moderation for ghost-created content

## Support

For issues or questions:
1. Check Supabase Dashboard → Logs → Edge Functions
2. Review `ghost_action_log` table for errors
3. Check action queue status in Admin UI
