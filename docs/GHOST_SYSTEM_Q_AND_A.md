# Ghost Management System - Q&A & Discussion

## Your Questions Answered

### 1. What's the difference between Forum Post and Community Post?

**Forum Posts** (`forum_posts`):
- ✅ **Can be linked to events** - Has `event_id` field (optional)
- ✅ **Event-specific discussions** - "What to expect at Nairobi Music Festival"
- ✅ **Event-related** - Perfect for event Q&A, discussions, tips

**Community Posts** (`community_posts`):
- ❌ **NOT event-specific** - No `event_id` field
- ✅ **Has categories** - 'general', 'tips', 'culture', 'trending'
- ✅ **General community discussion** - "Best places to eat in Nairobi"

**When to Use:**
- Use **Forum Post** when creating content related to a specific event
- Use **Community Post** for general community engagement (no event link)

---

### 2. Can't upload from device - only URL?

**Current Limitation:**
- Yes, currently only accepts URLs in the `media_url` field
- No file upload capability

**Proposed Solution:**
- Add file upload component
- Upload to Supabase Storage
- Automatically get public URL
- Support images (jpg, png, webp) and videos (mp4, webm)

**Implementation:**
- Create `ghost-content` storage bucket
- Add upload button next to media_url field
- Show preview after upload
- Auto-populate `media_url` with uploaded file URL

---

### 3. Target ID needs to be defined/specific

**Current Problem:**
- Just a number input field
- Hard to know what IDs exist
- No validation
- Can't see what you're targeting

**Proposed Solution:**
- Replace number input with **searchable dropdown**
- Fetch actual records from database:
  - **Stories**: Show preview/content snippet
  - **Forum Posts**: Show title + event name
  - **Community Posts**: Show title + category
  - **Events**: Show name + date + location
- Auto-populate `target_id` when selected
- Show validation (e.g., "Story #123 - 'Great event!'")

**For Events:**
- Add **Event Picker** with:
  - Event name
  - Date & time
  - Location
  - Status (upcoming, ongoing, past)
- Filter by date range
- Time-specific targeting (e.g., "Events happening this week")

---

### 4. Actions are pending - how to move to completed?

**How It Works:**
- Actions are processed by an **Edge Function** (`process-ghost-actions`)
- Edge Function needs to be **triggered** (not automatic)
- Actions flow: `pending` → `processing` → `completed`/`failed`

**Current Options:**
1. **Manual API call** (curl command)
2. **Cron job** (every 5 minutes) - Recommended
3. **Manual trigger from UI** - Not currently available

**Proposed Solution:**
- Add **"Process Now"** button in the Action Queue tab
- Button calls Edge Function API
- Shows processing status
- Auto-refreshes queue after processing
- Shows how many actions were processed

**Edge Function Details:**
- Processes up to 10 pending actions per call
- Adds randomized delays (2-60 seconds) between actions
- Updates status automatically
- Logs all actions in `ghost_action_log` table

---

### 5. JSON block for create actions - needs to be easier

**Current Problem:**
- Just a textarea with JSON
- Hard to understand what fields are needed
- Easy to make syntax errors
- Example: `{"content": "Story content here", "media_url": "optional"}`

**Proposed Solution:**
Replace JSON textarea with **form fields**:

**For Create Story:**
- **Content** (textarea) - Required
- **Media URL** (text input OR file upload) - Optional
- **Event ID** (dropdown) - Optional

**For Create Forum Post:**
- **Title** (text input) - Required
- **Content** (textarea) - Required
- **Event ID** (dropdown) - Optional (links post to event)
- **Media URL** (text input OR file upload) - Optional

**For Create Community Post:**
- **Title** (text input) - Required
- **Content** (textarea) - Required
- **Category** (dropdown) - Required ('general', 'tips', 'culture', 'trending')
- **Media URL** (text input OR file upload) - Optional

**Benefits:**
- ✅ No JSON syntax errors
- ✅ Clear field labels
- ✅ Validation
- ✅ Help text for each field
- ✅ Auto-generates JSON behind the scenes

---

### 6. Can Target ID be specific events in database? Time-specific?

**Yes! Proposed Solution:**

**Event Picker Component:**
- Fetch events from database
- Display in searchable dropdown
- Show for each event:
  - **Name** (e.g., "Nairobi Music Festival")
  - **Date & Time** (e.g., "Jan 15, 2026, 7:00 PM")
  - **Location** (e.g., "Nairobi")
  - **Status** badge (Upcoming, Ongoing, Past)

**Time-Specific Filtering:**
- **Filter by Date Range:**
  - "This Week"
  - "This Month"
  - "Next 30 Days"
  - Custom date range
- **Filter by Status:**
  - Upcoming only
  - Ongoing only
  - Past events
  - All events

**When Event Selected:**
- Auto-populate `target_id` with event ID
- For "Create Story" actions, auto-link story to event
- For "Like Story" actions, show stories from that event

**Alternative: Event-Based Actions**
- New action type: "Engage with Event"
- Automatically targets all stories/posts related to that event
- Time-aware (only targets content from event date range)

---

## Implementation Priority Discussion

### Phase 1: Quick Wins (Do First)
1. ✅ **"Process Now" Button** - Immediate functionality
2. ✅ **Better JSON Form** - Replace textarea with form fields
3. ✅ **Clear Help Text** - Explain Forum vs Community Posts

### Phase 2: Better UX (Do Next)
4. ✅ **Target ID Dropdowns** - Select from actual records
5. ✅ **Event Picker** - Time-specific event selection
6. ✅ **Status Indicators** - Better visual feedback

### Phase 3: Advanced Features (Do Later)
7. ✅ **File Upload** - Upload media from device
8. ✅ **Bulk Actions** - Queue multiple actions at once
9. ✅ **Action Templates** - Save common action patterns

---

## Questions for You

1. **Priority**: Which improvements are most important to you right now?
   - Process Now button?
   - Better form (no JSON)?
   - Event picker?

2. **Event Targeting**: Do you want to:
   - Target specific events by ID?
   - Or target all content from an event (stories, posts)?
   - Or both options?

3. **File Upload**: Is this critical, or can we start with URL-only?

4. **Processing**: Do you want:
   - Manual "Process Now" button?
   - Automatic processing (cron every 5 minutes)?
   - Both?

---

## Next Steps

1. **Review this document** - Does this address your concerns?
2. **Prioritize features** - Which should we implement first?
3. **Start implementation** - I'll begin with Phase 1 (quick wins)

Let me know your thoughts and priorities! 🚀
