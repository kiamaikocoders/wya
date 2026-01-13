# Ghost Management - Engagement Guide

## How to Use the Ghost Management Tab for Engagement

This guide walks you through using the Ghost Management feature to boost platform engagement through automated ghost user actions.

---

### Step 1: Access Ghost Management

1. Log in to the Admin Dashboard
2. Navigate to the left sidebar menu
3. Click on **"Ghost Management"** (icon: 👻)
4. You'll see the main Ghost Management dashboard with multiple tabs:
   - **Overview** (Statistics)
   - **Ghost Users** (List of all ghost accounts)
   - **Queue Actions** (Pending actions)
   - **Action Log** (History of executed actions)

---

### Step 2: Review Ghost Users & Persona Groups

1. Click on the **"Ghost Users"** tab
2. Review the list of ghost accounts (50 total by default)
3. Notice the **"Filter by Persona Group"** dropdown at the top:
   - **Highly Active** - Most engaged users
   - **Moderately Active** - Regular engagement
   - **Casual Users** - Occasional engagement
   - **Content Creators** - Users who create content
   - **Lurkers** - Minimal engagement
4. Select a persona group to filter users by engagement pattern

**Tip**: Different persona groups have different engagement rates. Use "Highly Active" for immediate engagement, "Content Creators" for content generation.

---

### Step 3: Create an Engagement Action

1. Click on the **"Queue Actions"** tab
2. Find the **"Create New Action"** form
3. Fill in the action details:
   
   **Action Type** - Choose from:
   - **Like Story** - Ghost users like a story
   - **Like Post** - Ghost users like a forum post
   - **Like Community Post** - Ghost users like a community post
   - **Comment on Story** - Ghost users comment on a story
   - **Comment on Post** - Ghost users comment on a forum post
   - **Comment on Community Post** - Ghost users comment on a community post
   - **Create Story** - Ghost users create new stories
   - **Create Post** - Ghost users create forum posts
   - **Create Community Post** - Ghost users create community posts
   - **Follow User** - Ghost users follow a specific user

   **Target ID** (for likes/comments):
   - Enter the ID of the story/post/community post you want to engage with
   - Example: Story ID from the Stories page URL

   **Persona Group**:
   - Select which persona group should perform the action
   - Or select "All Groups" for maximum engagement

   **Number of Ghosts** (optional):
   - Specify how many ghost users should participate
   - Leave empty to use the persona group's engagement rate

   **Scheduled Time**:
   - Choose when the action should execute
   - Leave empty for immediate execution (with randomized delays)

   **Content Metadata** (for create actions):
   - For creating content, provide JSON metadata:
   ```json
   {
     "title": "Event Title",
     "content": "Content text here",
     "category": "category_name",
     "media_url": "https://example.com/image.jpg"
   }
   ```

4. Click **"Create Action"** to queue the engagement

---

### Step 4: Monitor Queued Actions

1. In the **"Queue Actions"** tab, view all pending actions
2. Each action shows:
   - **Action Type** - What will be performed
   - **Target** - What content/user is being engaged with
   - **Persona Group** - Which users will perform it
   - **Status** - Pending, Processing, Completed, or Failed
   - **Scheduled Time** - When it will execute
3. Actions are processed asynchronously by the Edge Function
4. Actions execute with **randomized delays** to appear natural (not all at once)

**Actions You Can Take**:
- **Cancel** - Cancel a pending action before it executes
- **Delete** - Remove a failed or completed action from the queue

---

### Step 5: View Action History & Statistics

1. Click on the **"Action Log"** tab to see executed actions
2. Review the history:
   - **Success** ✅ - Actions that completed successfully
   - **Failed** ❌ - Actions that encountered errors
   - **Execution Time** - When the action was performed
   - **Ghost Users** - Which accounts participated
3. Check the **"Overview"** tab for engagement statistics:
   - Total ghost users
   - Queued actions count
   - Completed actions count
   - Failed actions count

**Use this data to**:
- Verify engagement is happening
- Identify patterns in successful vs failed actions
- Monitor system health

---

### Step 6: Best Practices for Engagement

**Timing & Volume**:
- ✅ Space out actions over time (don't create 50 actions at once)
- ✅ Use scheduled times for peak engagement periods
- ✅ Mix different action types for variety

**Persona Selection**:
- ✅ Use "Highly Active" for quick engagement on new content
- ✅ Use "Content Creators" to generate new stories/posts
- ✅ Use "Lurkers" for minimal, realistic engagement

**Content Targeting**:
- ✅ Target real user content to boost visibility
- ✅ Engage with event-related content during event periods
- ✅ Mix likes, comments, and follows for realistic engagement patterns

**Monitoring**:
- ✅ Check Action Log regularly to ensure actions complete
- ✅ Review failed actions and adjust if needed
- ✅ Monitor overall statistics to track engagement levels

---

## Quick Reference

**Access Path**: Admin Dashboard → Ghost Management

**Key Features**:
- 👥 **50 Ghost Users** with real profile pictures
- 🎭 **5 Persona Groups** with different engagement patterns
- ⚡ **Asynchronous Processing** with randomized delays
- 📊 **Full Audit Trail** via Action Log
- 🔄 **Real-time Statistics** in Overview tab

**Common Actions**:
- Like a new story to boost visibility
- Comment on forum posts to spark discussion
- Create stories to populate the feed
- Follow users to build a network

---

**Note**: All ghost actions are logged and auditable. Ghost users are marked with `is_ghost = true` in the database for transparency.
