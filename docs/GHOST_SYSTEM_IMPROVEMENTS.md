# Ghost Management System - Improvements Discussion

## Current Issues & Solutions

### 1. Forum Posts vs Community Posts

**Difference:**
- **Forum Posts** (`forum_posts`):
  - Can be linked to specific events (has `event_id` field)
  - Event-specific discussions
  - Example: "What to expect at Nairobi Music Festival"
  
- **Community Posts** (`community_posts`):
  - General discussion, NOT event-specific (no `event_id`)
  - Has `category` field: 'general', 'tips', 'culture', 'trending'
  - Example: "Best places to eat in Nairobi"

**When to Use:**
- Use **Forum Posts** for event-related discussions
- Use **Community Posts** for general community engagement

---

### 2. Target ID Specificity

**Current Problem:**
- Just a text input field
- Hard to know what IDs exist
- No validation

**Proposed Solution:**
- Add **dropdown/search** to select from actual database records
- Show **event name + date** for events
- Show **story preview** for stories
- Show **post title** for posts
- Add **time-based filtering** for events (upcoming, past, all)

**Implementation:**
- Fetch events/stories/posts from database
- Display in searchable dropdown
- Show relevant metadata (title, date, author)
- Auto-populate target_id when selected

---

### 3. Pending Actions → Completed

**Current Problem:**
- Actions stay "pending" - user doesn't know how to process them
- Edge Function needs to be triggered manually or via cron

**Proposed Solution:**
- Add **"Process Now"** button in UI
- Button calls Edge Function API endpoint
- Show real-time status updates
- Auto-refresh queue after processing

**How It Works:**
- Edge Function processes up to 10 pending actions per call
- Actions move: `pending` → `processing` → `completed`/`failed`
- Can be triggered manually or via cron (every 5 minutes)

---

### 4. JSON Block for Content Creation

**Current Problem:**
- Just a textarea with JSON
- Hard to understand what fields are needed
- Easy to make syntax errors

**Proposed Solution:**
- Replace JSON textarea with **form fields**:
  - **Title** (for posts) - Text input
  - **Content** - Textarea
  - **Category** (for community posts) - Dropdown
  - **Media URL** - Text input OR file upload
  - **Event ID** (for forum posts) - Optional dropdown
- Show **help text** explaining each field
- Auto-generate JSON behind the scenes

---

### 5. Media Upload from Device

**Current Problem:**
- Only accepts URLs
- Can't upload files directly

**Proposed Solution:**
- Add **file upload** component
- Upload to Supabase Storage
- Get URL automatically
- Show preview of uploaded image/video
- Option to use URL or upload file

**Implementation:**
- Use Supabase Storage bucket for ghost content
- Upload file → Get public URL → Use in metadata
- Support images and videos

---

### 6. Event-Specific Targeting

**Current Problem:**
- Target ID is just a number
- No way to see which events are available
- No time-based filtering

**Proposed Solution:**
- Add **Event Picker** component
- Show events with:
  - Event name
  - Date & time
  - Location
  - Status (upcoming, ongoing, past)
- Filter by:
  - Date range
  - Event status
  - Category
- When event selected, auto-populate target_id

---

## Recommended Implementation Order

1. **Add "Process Now" button** (Quick win - immediate functionality)
2. **Improve JSON block** (Better UX - form fields instead of JSON)
3. **Add Target ID dropdowns** (Better UX - select from actual records)
4. **Add Event Picker** (Advanced - time-specific targeting)
5. **Add File Upload** (Advanced - media upload capability)

---

## Technical Considerations

### Processing Actions
- Edge Function processes actions asynchronously
- Can be triggered via:
  - Manual API call (from UI)
  - Cron job (automatic, every 5 minutes)
  - Webhook (if needed)

### Target ID Selection
- Need to fetch:
  - Events (with date filtering)
  - Stories (recent ones)
  - Forum Posts (recent ones)
  - Community Posts (recent ones)
- Cache results for performance
- Add search/filter capabilities

### File Upload
- Use Supabase Storage
- Create bucket: `ghost-content`
- Set proper RLS policies
- Generate public URLs
- Support: images (jpg, png, webp), videos (mp4, webm)

---

## Next Steps

1. **Discuss priorities** - Which improvements are most important?
2. **Implement Phase 1** - Process Now button + Better JSON form
3. **Implement Phase 2** - Target ID dropdowns
4. **Implement Phase 3** - Event picker + File upload
