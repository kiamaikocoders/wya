# Discover Page — Logic & PRD Breakdown

This document describes how the Discover page works: scrolling, touch, fullscreen/UI visibility, linking, share, and all related behavior so you can use it for a PRD or handoff.

---

## 1. Page structure and layout

- **Route:** `/discover` and `/discover/:id` (same `DiscoverPage` component).
- **Layout:** On `/discover`, the app **hides** the top `Navbar` and **keeps** the bottom `BottomNav`; both are controlled by Discover UI visibility (see §4). Footer is not shown on Discover.
- **Wrapper:** `Layout` wraps the app in `DiscoverUIProvider`. Discover is the only page that uses this context.
- **Container:** A single scrollable div with `data-discover-container`, `height: 100vh`, `overflow-y: auto`, and **vertical scroll snapping** (`scrollSnapType: 'y mandatory'`). This div is the only vertical scroller on the page.

**Component tree (simplified):**

```
Layout (DiscoverUIProvider)
  └─ (no Navbar when path === '/discover')
  └─ main (no pb-20 on discover)
      └─ DiscoverPage
          └─ div[data-discover-container] (scroll container)
              ├─ DiscoverHeader (overlay)
              ├─ DiscoverSwipeHint (coachmark)
              └─ DiscoverFeed
                  └─ EventDiscoverSection[] (one per event group)
                      └─ EventContentCarousel (horizontal)
                          └─ ContentCard[] (one per story/post)
  └─ BottomNav (visibility from DiscoverUIContext)
  └─ (no Footer on discover)
```

---

## 2. Scrolling logic

### 2.1 Vertical scroll (between event sections)

- **Container:** The element with `data-discover-container` in `DiscoverPage.tsx` (ref `containerRef`).
- **CSS:** `scrollSnapType: 'y mandatory'` (inline style). Sections use `snap-start` and `snap-always` (see `index.css`: `scroll-snap-align: start`, `scroll-snap-stop: always`).
- **Sections:** Each `EventDiscoverSection` is a full-height block (`h-screen`, `snap-start snap-always`). So scrolling vertically moves one “event section” at a time (TikTok-style full-screen sections).
- **Scroll-to-hide UI:** On any scroll of the discover container, `setUiVisible(false)` is called (in `DiscoverPage`’s `scroll` listener). So as soon as the user scrolls, the header and bottom nav are hidden. Content overlay on the card (event info, caption, actions) stays visible.

### 2.2 Active section detection

- **State:** `DiscoverFeed` keeps `activeSectionIndex` (which section is “current”).
- **Mechanism:** `IntersectionObserver` on each section ref (`sectionsRef`), with `threshold: 0.5` and `rootMargin: '-20% 0px -20% 0px'`. When a section’s intersection ratio is > 0.5, that section’s index is set as `activeSectionIndex`.
- **Use:** `isActive={activeSectionIndex === index}` is passed to each `EventDiscoverSection`. Only the active section’s carousel is considered “active” for video play/pause and similar behavior.

### 2.3 Horizontal scroll (within a section — carousel)

- **Component:** `EventContentCarousel` — a horizontal scroll area with `overflow-x-auto`, `scrollbar-hide`, `snap-x snap-mandatory`, and `touch-pan-x` / `touchAction: 'pan-x pan-y'`.
- **Snap:** Each card is `snap-center`, `shrink-0 basis-full`, so one card per viewport width. `scrollSnapStop: 'always'` (via `snap-always`-style behavior) keeps one-item-per-swipe.
- **One-swipe rule:** On `scrollend`, the carousel clamps the scroll so the user can move at most one item from where they started (`scrollStartIndexRef`). If they fling past one item, it snaps to the immediate next or previous, not two. Exception: loop wrap (last → first or first → last) is allowed.
- **Loop:** If `loop === true` (default), the carousel duplicates the first item at the end. When the user lands on that duplicated item, scroll is instantly reset to the first item (no animation) so the loop feels continuous.
- **Current index:** An `IntersectionObserver` on the carousel’s root, with `threshold: 0.6`, sets which card is “current.” That index is passed to `ContentCard` as `isActive={isSectionActive && index === currentIndex}` so only the visible card plays video.

---

## 3. Touch and click behavior

### 3.1 Single tap (card area, not buttons)

- **Intent:** Toggle “UI visibility” (header + bottom nav). Content overlay on the card does **not** hide.
- **Implementation (desktop):** `ContentCard`’s `onClick` is `handleClick`. It waits 300 ms then, if the last tap was not within 300 ms (i.e. not a double-tap), calls `toggleUI()` and `onClick?.()`. So one click → hide nav; second click → show nav.
- **Implementation (touch):** Same card has `onTouchEnd={handleTouchEnd}`. In `handleTouchEnd`, if the gesture was mainly horizontal (`deltaX > deltaY && deltaX > 10`), it’s treated as a carousel swipe and no tap logic runs. Otherwise it calls `handleDoubleTap(e)`. So on touch, a **single tap** does not directly call `handleClick`; the **double-tap** path is used for like. For single tap on touch, the only way would be a delayed “click” from the browser after touch end — but the card does not have a separate single-tap handler for touch that toggles UI. So in practice: **single tap on card (non-swipe)** goes through `handleTouchEnd` → `handleDoubleTap`, which either registers as second tap (like) or first tap (nothing visible except starting the 300 ms window). So **toggle UI on touch may be inconsistent** unless the browser fires a click after the touch (300 ms delay in `handleClick` would then run). This is a nuance to fix if you want “tap once = fullscreen, tap again = show nav” on touch.

### 3.2 Double-tap (like)

- **Intent:** Like the content and show heart animation.
- **Implementation:** `handleDoubleTap` in `ContentCard`. If two taps occur within 300 ms, it prevents default when possible, stops propagation, cancels any pending single-tap timeout, shows heart animation, calls `onLike?.(content.id)`, and resets `lastTapRef`. Otherwise it records the first tap and sets a 300 ms timeout to clear it.
- **Touch:** Same handler is used from `onTouchEnd` when the gesture is not a horizontal swipe.

### 3.3 Horizontal swipe (carousel)

- **Intent:** Move to previous/next story in the same event section.
- **Implementation:** Native horizontal scroll of `EventContentCarousel`; `touch-pan-x` and `touchAction: 'pan-x pan-y'` allow horizontal pan. Vertical scroll of the discover container can still happen (pan-y). Touch start in the carousel is recorded so that in `ContentCard.handleTouchEnd`, if `deltaX > deltaY && deltaX > 10`, the tap is not treated as double-tap and the carousel handles the swipe.

### 3.4 Mute button (videos only)

- **Intent:** Toggle mute for the current video.
- **Implementation:** `toggleMute` toggles `isMuted` and the video element’s `muted` and `play()`. The button has `touch-none` and `onTouchStart`/`onTouchEnd` that prevent default and stop propagation so the gesture doesn’t trigger card tap or scroll.

---

## 4. Fullscreen vs navbar visibility (“click once fullscreen, click again navbar”)

### 4.1 State

- **Context:** `DiscoverUIContext` (in `Layout`).
- **State:** `uiVisible: boolean` (default `true`). `setUiVisible(boolean)` and `toggleUI()`.

### 4.2 What “UI” means

- **When `uiVisible === true`:**  
  - **DiscoverHeader:** opacity 100% (top “Discover” tab).  
  - **BottomNav:** visible (no `translate-y-full opacity-0`).  
  - **ContentCard:** bottom padding is larger (`pb-24` on mobile) so content sits above the nav.
- **When `uiVisible === false`:**  
  - **DiscoverHeader:** opacity 0.  
  - **BottomNav:** `translate-y-full opacity-0` (slide down off-screen).  
  - **ContentCard:** bottom padding reduced (`pb-4` on mobile).  
  - The card’s own overlay (event metadata, @user, caption, like/share/mute) **stays visible** in both states.

### 4.3 What changes visibility

- **Hide UI:**  
  - Any **vertical scroll** on the discover container → `setUiVisible(false)` in `DiscoverPage`.  
  - **Single tap** on the card (when handled as click) → `toggleUI()` → if it was true, becomes false (fullscreen).
- **Show UI:**  
  - **Single tap** again on the card → `toggleUI()` → true (navbar and header reappear).

So: “click once → fullscreen” = tap that triggers `handleClick` and toggles `uiVisible` to false; “click again → navbar” = next tap toggles it back to true.

---

## 5. Linking and navigation

### 5.1 Routes

- `/discover` — feed from the top; no specific content targeted.
- `/discover/:id` — same page; `id` is the **content id** (story or forum post). The feed finds the event section that contains that content and scrolls to it, and the carousel shows that item (e.g. `initialContentIndex`).

### 5.2 How deep link is applied

- **DiscoverPage:** `useParams<{ id?: string }>()` → `targetContentId={id ? Number(id) : undefined}` and `onContentReady={scrollToTop}` passed to `DiscoverFeed`.
- **DiscoverFeed:**  
  - When `targetContentId` is set and data is ready, it finds the event group and section index that contains that content, then after 500 ms calls `section.scrollIntoView({ behavior: 'smooth', block: 'start' })` and sets `hasScrolledToTarget.current = true` so it doesn’t run again.  
  - The section’s `EventContentCarousel` gets `initialContentIndex` so the correct card is shown.
- **Scroll to top when no target:** When there is no `targetContentId`, after content is ready `onContentReady` is called (multiple times with small delays). That is `scrollToTop` in DiscoverPage, which sets `containerRef.current.scrollTop = 0` so the user starts at the first section.

### 5.3 Who links to Discover

- **Profile / Friend activity:** `RecentUpdatesSection` and `FriendActivitiesCarousel` use `navigate(\`/discover/${postId}\`)` or `<Link to={\`/discover/${activity.id}\`}>` to open a specific story/post on Discover.
- **From within Discover:** DiscoverPage does **not** pass `onContentClick` to DiscoverFeed. So when the user taps a story and `onExpand(content.id)` is called, `onContentClick?.(contentId, content.type)` is a no-op. **Expanding a story from inside Discover does not navigate to `/discover/:id`**; deep links are only used when arriving from elsewhere.

### 5.4 Other links from the card

- **Event metadata (title/date/location):** `onEventClick(eventId)` → in `EventDiscoverSection`, `handleEventClick` → `navigate(\`/events/${eventGroup.event.id}\`)`. Not used for “Community Discover” (virtual event id 0).
- **Story vs forum:** In `EventDiscoverSection.handleContentClick`, if type is `'story'` it calls `onExpand?.(content.id)` (no navigation in current setup); if type is `'forum'` it calls `navigate(\`/forum/${content.id}\`)`.

---

## 6. Share

- **Trigger:** Share button on `ContentCard` (right sidebar). `onClick` stops propagation and calls `onShare?.(content.id)`.
- **Handler:** In `DiscoverFeed`, `handleShare(id)`:
  - Logs `'Share:', id`.
  - If `navigator.share` exists, calls `navigator.share({ title: 'Check this out on WYA', url: window.location.href })`. So the shared URL is the **current page URL** (e.g. `/discover` or `/discover/123`), not a dedicated share URL for that piece of content.
- **Gap:** Share does not build a content-specific URL (e.g. `/discover/:id`) for the current card when on `/discover`; it shares whatever the browser URL is.

---

## 7. Like

- **Triggers:** Double-tap on card, or heart button on the card (with `e.stopPropagation()`).
- **Handler:** `DiscoverFeed.handleLike(id)`:
  - Resolves content by `id` in `allContent` to get type (`story` | `forum`).
  - **Story:** `storyService.hasUserLikedStory` then `storyService.likeStory` (toggle). Optimistic update on `['allStories']`, then invalidate. If new like, `playLikeSound()` and `sendLikeNotification(...)`.
  - **Forum:** `forumService.likePost` (like only). Optimistic update on `['forumPosts']`, invalidate, sound and notification if success.
- **Notification:** `sendLikeNotification` uses Supabase RPC `create_like_notification` with creator, liker name, resource type/id, and link (`/stories/${id}` or `/forum/${id}`).

---

## 8. Video play/pause

- **Active card:** Only the card with `isActive === true` should play (current carousel index in the current section, and section must be active).
- **Play:** `ContentCard` uses `useLayoutEffect` so when `isActive` becomes true, it calls `playVideo()` (and respects `isMuted`). So when you scroll to a card, video plays.
- **Pause:** When `isActive` becomes false, same effect calls `pauseVideo()` and sets muted true. So when you scroll away, video pauses immediately (before paint).
- **Scroll:** The discover container’s `scroll` listener in ContentCard also pauses video on any vertical scroll and, after 150 ms idle, calls `playVideo()` if `isActive` is still true. This avoids brief overlap when the IntersectionObserver hasn’t updated yet.
- **Unmount:** On unmount, `pauseVideo()` is called.

---

## 9. Discover swipe hint (coachmark)

- **Component:** `DiscoverSwipeHint`.
- **When it shows:** After 500 ms on Discover, only if not previously dismissed. Dismissal is stored in `localStorage` under `wya.discover.swipeHintDismissed.v1`.
- **Dismiss:**  
  - User clicks “Got it”, or  
  - User does a horizontal swipe (pointer move > 40 px and dx > dy) → dismiss and set storage.
- **UI:** Fixed overlay, “Swipe for next story” with chevrons, “Got it” button. On coarse pointer (touch) the hint is shown; optional “You can also scroll sideways” on non-coarse.

---

## 10. Data and content flow

- **DiscoverFeed** loads:
  - Events: `eventService.queryEvents` (all events, include past, pageSize 500).
  - Event stories: `storyService.getStoriesForEvents(eventIds)`.
  - Ungrouped stories: `storyService.getUngroupedStories(50)` (“Community Discover”).
  - Forum posts: `forumService.getAllPosts()`.
- **Grouping:** Content is grouped by `event_id`; no `event_id` → `'ungrouped'` (virtual event “Community Discover”, id 0). Groups are sorted by latest content first; within a group, content is sorted by engagement score then recency. Community Discover is limited to top 5 items in the mapping.
- **Engagement score:** `getEngagementScore` uses likes, comments, views, and a recency boost (hours ago from 24).

---

## 11. Scroll restoration and initial scroll

- **History:** On Discover, `history.scrollRestoration = 'manual'` so the browser doesn’t restore scroll on back.
- **On mount / id change:** DiscoverPage runs `scrollToTop()` on mount and when `id` (params) changes, with timeouts at 0, 100, 500 ms so the container reliably starts at top (or then deep-link effect runs after content is ready).

---

## 12. Functions and handlers summary

| Where | Function / handler | Purpose |
|-------|--------------------|--------|
| **DiscoverPage** | `scrollToTop` | Sets `containerRef.current.scrollTop = 0`. |
| **DiscoverPage** | Scroll listener on container | `setUiVisible(false)` on any scroll. |
| **DiscoverFeed** | `handleLike(id)` | Like story (toggle) or forum post; optimistic update, invalidate, sound, notification. |
| **DiscoverFeed** | `handleShare(id)` | `navigator.share` with current `window.location.href`. |
| **DiscoverFeed** | `sendLikeNotification(...)` | Supabase RPC to create like notification. |
| **DiscoverFeed** | IntersectionObserver (sections) | Sets `activeSectionIndex` when section > 50% visible. |
| **DiscoverFeed** | Effect with `targetContentId` | Scrolls to section and sets initial carousel index for deep link. |
| **EventContentCarousel** | `onScrollEnd` | Clamp scroll to at most one item from start index (or allow loop wrap). |
| **EventContentCarousel** | IntersectionObserver (items) | Sets `currentIndex` for active card. |
| **EventContentCarousel** | Effect when `currentIndex === displayContent.length - 1` (loop) | Instant jump `scrollLeft = 0`, set index 0. |
| **EventDiscoverSection** | `handleEventClick` | `navigate(\`/events/${event.id}\`)` (no-op for event id 0). |
| **EventDiscoverSection** | `handleContentClick(content)` | Story → `onExpand(content.id)`; forum → `navigate(\`/forum/${content.id}\`)`. |
| **ContentCard** | `handleClick` | After 300 ms, if not double-tap, `toggleUI()` and `onClick?.()`. |
| **ContentCard** | `handleDoubleTap` | If two taps within 300 ms → like + heart animation; else record first tap. |
| **ContentCard** | `handleTouchEnd` | If horizontal swipe → do nothing; else `handleDoubleTap`. |
| **ContentCard** | `toggleMute` | Toggle `isMuted` and video element. |
| **ContentCard** | Scroll listener (discover container) | Pause video on scroll; after 150 ms, play if still `isActive`. |
| **ContentCard** | `handleEventClick` | `onEventClick(eventMetadata.id)` (event chip click). |
| **DiscoverUIContext** | `toggleUI` | `setUiVisible(prev => !prev)`. |
| **DiscoverSwipeHint** | Dismiss on horizontal swipe / “Got it” | Set localStorage and hide hint. |

---

## 13. Edge cases and gaps (for PRD / future work)

- **Single tap on touch:** Toggle UI may rely on browser-generated click; consider an explicit single-tap handler for “tap once = fullscreen, tap again = navbar” on touch.
- **Share URL:** Share uses current URL; consider sharing a `/discover/:contentId` URL when on Discover so the recipient opens that exact card.
- **Expand from Discover:** Tapping a story in Discover does not navigate to `/discover/:id`; only external entry uses deep link. Consider `navigate(\`/discover/${content.id}\`)` in `onContentClick` for stories.
- **Scroll-to-top button:** Layout’s “scroll to top” button listens to `window.scrollY`; on Discover the scroll is inside the container, so that button may not show or may not scroll the discover container.

This is the full logic of the Discover page as implemented; use it as the single source of truth for the PRD and behavior.
