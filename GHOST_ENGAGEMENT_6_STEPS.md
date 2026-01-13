# Ghost Management - 6-Step Engagement Guide

## Quick Start: How to Use Ghost Management for Engagement

### Step 1: Access Ghost Management
- Log in to **Admin Dashboard**
- Click **"Ghost Management"** in the left sidebar (👻 icon)
- You'll see 4 tabs: Overview, Ghost Users, Queue Actions, Action Log

---

### Step 2: Choose Your Action Type
- Click the **"Queue Actions"** tab
- In the form, select an **Action Type**:
  - **Like Story** / **Like Post** / **Like Community Post** - For engagement
  - **Comment on Story** / **Comment on Post** / **Comment on Community Post** - For discussions
  - **Create Story** / **Create Post** / **Create Community Post** - For content generation
  - **Follow User** - For network building

---

### Step 3: Set Target & Persona
- **Target ID**: Enter the ID of the story/post/user you want to engage with
  - Find this in the URL when viewing content (e.g., `/stories/123` → ID is `123`)
- **Persona Group**: Choose which ghost users should perform the action:
  - **Highly Active** - Fast, high engagement (best for quick boosts)
  - **Content Creatators** - Create new content (use for content generation)
  - **All Groups** - Maximum engagement (use for important content)

---

### Step 4: Configure Action Details
- **Number of Ghosts** (optional): How many ghost accounts should participate
  - Leave empty to use the persona group's default engagement rate
- **Scheduled Time** (optional): When the action should execute
  - Leave empty for immediate execution (with randomized delays)
- **Content Metadata** (for create actions only): JSON with content details
  ```json
  {
    "title": "My Event Story",
    "content": "Had an amazing time!",
    "category": "entertainment",
    "media_url": "https://example.com/image.jpg"
  }
  ```

---

### Step 5: Queue & Monitor
- Click **"Create Action"** to queue the engagement
- View pending actions in the **"Queue Actions"** tab
- Actions execute automatically with **randomized delays** (to appear natural)
- Status updates: Pending → Processing → Completed
- Check **"Action Log"** tab to see execution history

---

### Step 6: Verify & Optimize
- Go to **"Action Log"** tab to verify actions completed successfully ✅
- Check **"Overview"** tab for statistics (total actions, success rate)
- **Best Practices**:
  - ✅ Space out actions over time (don't queue 50 at once)
  - ✅ Mix different action types (likes, comments, creates)
  - ✅ Use "Highly Active" for quick engagement, "Content Creators" for content
  - ✅ Target real user content to boost visibility

---

## Quick Tips

- **For Quick Engagement**: Use "Highly Active" persona + Like/Comment actions
- **For Content Generation**: Use "Content Creators" persona + Create actions  
- **For Network Building**: Use Follow User action with "All Groups"
- **Monitor Regularly**: Check Action Log to ensure actions complete successfully

---

**Access Path**: Admin Dashboard → Ghost Management
