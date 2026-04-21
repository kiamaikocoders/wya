# WYA — Product Requirements Document (PRD)

**Product:** WYA (“Where You At”) — events, discovery, social content, ticketing hooks, sponsors, admin, and AI-assisted tools.  
**Audience:** App builders / engineers / designers who must reproduce behavior without guessing.  
**Source of truth:** This document reflects the **current** React web app in this repository (`src/`, `supabase/`).  
**Stack (high level):** Vite + React 18 + TypeScript, React Router, TanStack Query, Tailwind + shadcn/Radix, Supabase (Auth, Postgres, Storage, Edge Functions), Capacitor (Android; iOS optional).

---

## 1. Product goals

1. Help users **find and engage with events** (Kenya-focused positioning in UI/content).
2. Let hosts **propose** events and (if organizer) **publish** events.
3. Provide a **TikTok-style Discover** feed of **stories** (media posts) tied to events or community.
4. Support **profiles**, **chat**, **notifications** (in-app), **favorites/saved events**, **tickets** (DB + M-Pesa path stubbed), **sponsors**, **surveys**, and **organizer analytics**.
5. **Admin** console for moderation, events, proposals, users, ghost engagement, media galleries, feedback, analytics.

---

## 2. User roles

| Role | How represented | Capabilities (product-level) |
|------|------------------|------------------------------|
| **Guest** | Not logged in | Browse marketing landing, download page, events listing, event details, discover (as implemented), categories, sponsors, legal pages; login/signup. |
| **Attendee** | `profiles` + Supabase Auth; `user_type` attendee | Full app except organizer-only and admin-only areas; onboarding + legal consent; propose events; save/favorite patterns; chat; tickets; surveys; feedback; settings. |
| **Organizer** | `user_type === 'organizer'` (or admin treated as organizer in nav) | **Create Event** (`/create-event`), **Analytics** entry in nav (`/analytics`). |
| **Admin** | Flag from profile / auth logic (`isAdmin`) | `/admin/*` dashboard; ghost tools; sponsor analytics; all management screens. |

---

## 3. Global application shell

### 3.1 Routing

- **Router:** `BrowserRouter` (web). Deep links must match paths below.
- **Layouts:**
  - **`MarketingLayout`:** Public marketing surface — `/`, `/download`.
  - **`AdminLayout`:** `/admin` tree; wrapped in `ProtectedRoute adminOnly`.
  - **`Layout`:** Main app — navbar (most routes), **bottom navigation** (mobile-first), footer or minimal footer, scroll-to-top.

### 3.2 Legal & consent gating

- **`LegalConsentGate`** (global, wraps routes): For **signed-in non-admin** users, blocks the UI until **current** Attendee Terms, Privacy Policy, and **media consent** versions are accepted on the profile (see `policy-versions`). Collects marketing / location / organizer-content preferences.
- **Posting guard:** Story/post flows can throw `MediaConsentRequiredForPostingError` or `LegalReconsentRequiredForPostingError` — user must re-consent via gate/settings.

### 3.3 Auth guard

- **`ProtectedRoute`:** If not logged in → redirect `/login` with toast. If `adminOnly` and not admin → redirect `/` with toast.

### 3.4 Navigation surfaces

**Bottom nav** (`BottomNav`) — always visible except auth pages; on Discover it can **hide on scroll** (Discover UI context):

| Label | Path | Notes |
|--------|------|--------|
| Overview | `/` if logged out, `/home` if logged in | |
| Discover | `/discover` | Full-bleed; no main Navbar |
| Events | `/events` | |
| Host | `/request-event` | Event **proposal** wizard (not “create” for all users) |
| Profile | `/profile` | |

**Top Navbar** (hidden on Discover + auth pages): logo → home; **AI Assistance** CTA; feedback; notifications; chat; user menu (profile, settings, feedback, messages, request event, analytics if organizer, admin if admin, logout).

### 3.5 Data fetching pattern

- **TanStack Query** for server state (`queryKey` per resource).
- **Services** in `src/lib/*` encapsulate Supabase calls (`event-service`, `ticket-service`, `user-service`, `story/story-service`, `notification`, `chat`, etc.).

### 3.6 Native app hooks

- **Capacitor:** `Capacitor.isNativePlatform()` used in places (e.g. Event Details external links, App startup **update service**).
- **Live Updates:** configured in repo but **disabled** in code comments (crash mitigation).

---

## 4. Complete page & route inventory

Paths are **exact** as in `src/App.tsx`.

### 4.1 Marketing

| Route | Page | Purpose |
|--------|------|---------|
| `/` | `Landing` | Marketing homepage (hero, features, FAQ, CTA). |
| `/download` | `DownloadApp` | App download / install guidance. |

### 4.2 Auth & account recovery

| Route | Page | Purpose |
|--------|------|---------|
| `/login` | `Login` | Email/password login via `AuthContext`. |
| `/signup` | `Signup` | Registration with attendee consents. |
| `/admin-login` | `AdminLogin` | Separate admin login entry. |
| `/forgot-password` | `ForgotPassword` | Triggers reset flow (Supabase + edge `request-password-reset` URL helper). |
| `/reset-password` | `ResetPassword` | Set new password from recovery link. |
| `/auth/callback`, `/auth/confirm` | `AuthCallback` | OAuth / email confirmation redirects. |
| `/email-confirmation-pending` | `EmailConfirmationPending` | Post-signup pending state. |

### 4.3 Core app (Layout)

| Route | Protected | Page | Purpose |
|--------|-----------|------|---------|
| `/home` | No | `Home` | Authenticated **dashboard**: onboarding redirect if no preferences; event carousels, AI recommendations, trending, ticket modal, links to discover/events. |
| `/onboarding` | Yes | `Onboarding` | Multi-step **interests / cities / notifications** wizard; persists via `onboardingService`. |
| `/events` | No | `Events` → `EventsPage` | Main **events hub** (tabs, filters, grid/list/map, pagination). |
| `/events/:eventId` | No | `EventDetails` | Single event **hero, highlights, about, tickets card, map, sponsors**. |
| `/categories/:slug` | No | `Categories` | Category-scoped browsing. |
| `/discover` | No | `DiscoverPage` | Full-viewport **vertical snap** feed (see §6). |
| `/discover/:id` | No | `DiscoverPage` | Same feed, **scroll target** = story/content id. |
| `/search` | No | `Search` | Global search experience. |
| `/stories` | No | `Stories` | Stories grid / management surface. |
| `/notifications` | No | `Notifications` | Full notifications list (in-app). |
| `/ai-assistance` | No | `AIAssistance` | **AI hub** tabs: recommendations, story generator, image generator, categorizer, assistant. |
| `/privacy-policy` | No | `PrivacyPolicy` | Legal. |
| `/terms-of-service` | No | `TermsOfService` | Legal. |
| `/media-consent` | No | `MediaConsentPolicy` | Media consent policy. |
| `/favorites` | Yes | `Favorites` | Saved events / favorites. |
| `/request-event` | No | `RequestEvent` | **Proposal** wizard → `proposals` table. |
| `/create-event` | Yes | `CreateEvent` | **Organizer-only** event creation → `events` via `eventService`. |
| `/sponsors` | No | `SponsorsPage` | Sponsor directory. |
| `/sponsors/:sponsorId` | No | `SponsorZone` | Sponsor detail / zone. |
| `/profile` | Yes | `Profile` | Own profile. |
| `/settings` | Yes | `Settings` | Account, notifications toggles, GDPR export/delete flows, etc. |
| `/feedback` | Yes | `FeedbackPage` | Submit `app_feedback`. |
| `/users/:userId` | No | `UserProfile` | Public user profile. |
| `/users` | No | `UsersDirectory` | User discovery directory. |
| `/chat` | Yes | `ChatPage` | Conversation list + empty state. |
| `/chat/:conversationId` | Yes | `ChatPage` | Thread + messages. |
| `/surveys/:surveyId` | Yes | `SurveyPage` | Take survey. |
| `/surveys/:surveyId/results` | Yes | `SurveyResultsPage` | Survey results. |
| `/surveys/create` | Yes | `CreateSurveyPage` | Create survey. |
| `/tickets` | Yes | `MyTickets` | User’s tickets. |
| `/tickets/:ticketId` | Yes | `TicketDetail` | Ticket detail / QR / status. |
| `/analytics` | Yes | `AnalyticsDashboard` | Organizer analytics entry. |
| `/analytics/events/:eventId` | Yes | `AnalyticsDashboard` | Event-scoped dashboard variant. |
| `/analytics/event/:eventId` | Yes | `EventAnalytics` | Per-event analytics view. |
| `/share/event-media/:token` | No | `PublicEventMediaGallery` | **Public** shared gallery via token (Edge Function `public-event-media-gallery`). |
| `*` | No | `NotFound` | 404. |

**Redirects:** `/forum` and `/forum/:postId` → `/discover` (forum sunset).

### 4.4 Admin (`/admin`, admin-only)

| Route | Page / component | Purpose |
|--------|------------------|---------|
| `/admin` | `AdminDashboard` | Admin home. |
| `/admin/events` | `AdminEvents` | Event CRUD / management (`EventManagement`, etc.). |
| `/admin/proposals` | `AdminProposals` → `ProposalManagement` | Review **event proposals** from `proposals`. |
| `/admin/users` | `AdminUsers` | User administration. |
| `/admin/moderation` | `AdminModeration` | Content moderation. |
| `/admin/media-gallery` | `AdminMediaGallery` | Event media gallery admin. |
| `/admin/feedback` | `AdminFeedback` | User feedback panel. |
| `/admin/analytics` | `AdminAnalytics` | Platform analytics. |
| `/admin/sponsor-analytics` | `AdminSponsorAnalytics` | Sponsor metrics. |
| `/admin/ghost` | `AdminGhost` | Ghost user / automation tooling. |

---

## 5. End-to-end flows (detailed)

### 5.1 Signup → session → profile

1. User submits **`/signup`** with email, password, name, **legal consents** (`AttendeeSignupConsents`).
2. **`AuthContext.signup`** creates Supabase user; ensures **`profiles`** row; sets metadata / `user_type` as applicable.
3. On first load with session, **`LegalConsentGate`** may block until terms/privacy/media versions match **current** `policy-versions` constants.
4. **`/home`**: if **`onboardingService.getPreferences`** returns **null**, user is redirected to **`/onboarding`** before seeing home content.

### 5.2 Onboarding (`/onboarding`)

- **Steps:** Interests (multi-select) → Presence (home base + preferred cities) → Signals (notification prefs: AI digest, partner pitches, community highlights) → Summary.
- **Persist:** `onboardingService` (stored in backend — builder should keep parity with existing API).
- **After completion:** user returns to normal **`/home`** experience.

### 5.3 Request Event — **proposal** flow (`/request-event`)

**Not the same as publishing an event.** This is for **anyone** (including attendees) to pitch an idea.

1. **Multi-step wizard:** Concept → Logistics → Collaboration → Review (`steps` in `RequestEvent.tsx`).
2. **Optional image:** Upload to Supabase Storage bucket **`event-images`**, path `proposals/{userId}/{filename}`; uses `prepareMediaForUpload`.
3. **Submit:** `INSERT` into **`proposals`** with `status: 'pending'`, `submitted_by: auth.uid()`, fields: title, description, category, estimated_date, location, expected_attendees, sponsor_needs, image_url, contact_email/phone, etc.
4. **After insert:** `proposalNotifications.notifyProposalSubmitted(userId, title, proposalId)` creates **in-app notification** (and any extended behavior in that module).
5. **UX:** Toast success; navigate to **`/home`** (if authenticated) or **`/`**.
6. **Admin:** Reviews in **`/admin/proposals`** (`ProposalManagement`) — approve/reject workflows live in admin components (builder: mirror statuses and RLS).

### 5.4 Create Event — **organizer** flow (`/create-event`)

1. **Gate:** Must be logged in; **`user.user_type === 'organizer'`** (else toast + redirect `/events`).
2. **Form:** Title, description, category, date/end_date, time, location, **LocationPicker** (lat/lng), price, tags, media type (image/video/link), image URL or samples.
3. **Submit:** `eventService.createEvent` (or equivalent) inserts **`events`** row with `organizer_id` = user.
4. **Side effects:** Code path may notify users about new events (`onboardingNotifications` / event notification helpers in `event-service`).

### 5.5 Admin event lifecycle (summary)

- **`/admin/events`:** Admins create/edit events (`AdminCreateEvent`, `AdminEditEvent`, `EventManagement`), manage media galleries, exports (CSV/PDF in admin service), etc.
- **Featured flags, categories, ticket_link** (external URL) settable from admin paths.

### 5.6 Events hub (`/events`) — **EventsPage**

**Tabs (`EventsTab`):**

- **`discover`:** Default browse; **`eventService.queryEvents`** with filters, sort, pagination; supports **pastOnly** off.
- **`for-you`:** Same query machinery with **recommendation tags** from onboarding/preferences (`recommendationTags`, `useEventFilters`).
- **`attending`:** **Saved events** — `eventService.getSavedEvents(user.id)` (not the main paged query).
- **`past`:** Query with **pastOnly** mode.

**UI:**

- **Hero** shows metrics (total, this week, curated city counts, featured count) depending on tab.
- **Toolbar:** search, open filters sheet, view mode **grid | list | map**, sort (soonest, latest, newest, price).
- **Filters panel:** category, location, tags, date range, featured only, radius + user coordinates when available.
- **Results:** Cards link to **`/events/:eventId`**.

**Wiring:** `useEventFilters` owns filter state; TanStack Query keys include filters + tab + coords so cache stays correct.

### 5.7 Event details (`/events/:eventId`)

**Load:**

- **`eventService.getEventById`** → single **`events`** row.
- **`storyService.getEventStories`** → **Event Highlights** grid.
- **`ticketService.getEventTickets`** → for analytics / counts as needed.

**User sees:**

1. **Hero** — cover `image_url`, title, category badge, date range, time, location, capacity, back + favorite + share.
2. **Event Highlights** — story thumbnails; **Add Story** opens **`StoryModal`**.
3. **About** — paragraphized description.
4. **Sidebar — Get Tickets:**
   - If **`event.ticket_link`** → primary button opens external URL.
   - Else if authenticated → placeholder toast **“Ticket purchase coming soon”** (in-app purchase path not fully wired on this button).
   - Else → **Login required** dialog → `/login`.
5. **Location** — `MapView` (MapLibre/Mapbox integration) + **Open location** if `location_url` set.
6. **Sponsors** — `EventSponsorsSection` loads sponsor placements for this `eventId`.

**Post story:**

- **`handleShareStory`** → `storyService.createStory` with `event_id`, caption, `media_url`, etc., guarded by **media/legal consent** wrapper.
- On success, invalidates **`eventStories`** query.

**Favorite button:** Local optimistic UI + toast (builder: verify if persisted to `saved_events` elsewhere — PRD notes UI toggles state on page).

### 5.8 Discover (`/discover`, `/discover/:id`)

**Intent:** Full-screen, **vertical scroll-snap** (“stories” experience).

**Layout:**

- **Container:** `100vh`, `overflow-y-auto`, `scroll-snap-type: y mandatory`.
- **DiscoverHeader** overlay (transparent).
- **DiscoverSwipeHint** — one-time horizontal swipe coachmark.
- **DiscoverFeed** — main content.

**DiscoverFeed — data:**

1. **Events:** `eventService.queryEvents` large page size, **`includePast: true`** for discover context.
2. **Stories with events:** `storyService.getRecentVerifiedEventStoriesForDiscover` + merge extra events by id.
3. **Ungrouped community stories:** `storyService.getUngroupedStories`.
4. **Engagement score:** function of likes, comments, views, **recency boost** (so new content surfaces).
5. **Grouping:** Content grouped by **event** into **`EventDiscoverSection`** blocks; each block can show carousels / reels (`ReelsFeed`, `ContentCard`, etc.).
6. **Interactions:** Like → RPC `create_like_notification` + sound; may create **notifications** row for content owner.
7. **Navigation:** `/discover/:id` sets **`targetContentId`** so feed scrolls to that story after load.

**Bottom nav:** Hides when user scrolls content (`DiscoverUIContext.setUiVisible`).

### 5.9 Home (`/home`)

- **Onboarding redirect** if preferences missing (§5.2).
- **Feeds:** `eventService.getHomeFeedEvents`, `storyService.getAllStories`.
- **Trending** — derived from story engagement scores mapped to events; fallback featured / upcoming.
- **Sections:** carousels, AI recommendations component, ticket modal (`TicketPurchaseModal`), circular gallery, onboarding reminders.
- **Side effect:** Delayed **`onboardingNotifications.sendNearbyEventsNotification`** for logged-in users.

### 5.10 Tickets

- **`ticketService`** reads/writes **`tickets`** table.
- **Purchase:** `purchaseTicket` loads event price; inserts ticket; **`mpesa`** → `pending` + toast “check your phone”; **card/cash** → `confirmed` (simplified).
- **M-Pesa:** Repo has Edge Functions **`mpesa`**, **`mpesa-callback`** — full payment orchestration may extend beyond client stub.
- **`/tickets` / `/tickets/:ticketId`:** List and detail (QR, status, etc. — builder inspect `MyTickets.tsx`, `TicketDetail.tsx`).

### 5.11 Chat (`/chat`, `/chat/:conversationId`)

- **`conversationsService.getConversations`**, **`messagesService.getMessages`**, **`sendMessage`**.
- UI: **`ConversationsList`**, **`ChatHeader`**, **`MessageList`**, **`MessageInput`**.
- Realtime: verify `chat` lib for Supabase realtime subscriptions (builder reads `src/lib/chat`).

### 5.12 Notifications

- **Dropdown:** `NotificationsDropdown` — `notificationService.getUserNotifications`, mark read, links by `resource_type` (event → `/events/:id`, post → `/discover/:id`, ticket → `/tickets/:id`).
- **Full page:** `/notifications`.
- **Data:** **`notifications`** table; **not** native push in current codebase (separate mobile project).

### 5.13 Profile & settings

- **`/profile`:** Avatar, posts, events attended, edit profile modals, follow/friends patterns (see `ProfileHeader`, `PostsGrid`, etc.).
- **`/settings`:** Profile fields, **email/push toggles** (persisted on `profiles`), theme, **GDPR** export/delete via `gdprService` + edge **`delete-my-account`**.
- **`/users` / `/users/:userId`:** Directory and public profile.

### 5.14 Stories (`/stories`)

- Grid / creation flows; ties to **`storyService`** and AI generators where used.

### 5.15 AI Assistance (`/ai-assistance`)

- Tabs: **AIEventRecommendations**, **AIStoryGenerator**, **AIImageGenerator**, **AIEventCategorizer**, **AIEventAssistant** — mostly **client-side / API-assisted** UX (builder: trace each component for external API keys and limits).

### 5.16 Surveys

- **Create** `/surveys/create`, **take** `/surveys/:surveyId`, **results** `/surveys/:surveyId/results`.
- Components: `SurveyQuestion`, `EventSurveys`, etc.

### 5.17 Sponsors

- **`/sponsors`**, **`/sponsors/:sponsorId`** — listings and sponsor zone blocks (`SponsorZoneBlock`, analytics for admin).

### 5.18 Organizer analytics

- **`/analytics`**, **`/analytics/events/:eventId`**, **`/analytics/event/:eventId`** — dashboards for event performance (components in `components/analytics`).

### 5.19 Public event media gallery

1. Admin or system creates **share link** via edge **`create-event-media-gallery`** (see `getCreateEventMediaShareUrl`, `event-media-share.ts`).
2. Public user opens **`/share/event-media/:token`**.
3. **`fetchPublicEventMediaGallery`** calls **`public-event-media-gallery`** function with token.
4. Page renders grid of image/video with filters; **no auth** required if token valid.

### 5.20 Feedback

- **`/feedback`:** Authenticated users submit to **`app_feedback`**.
- **`/admin/feedback`:** Admin triage (`AdminFeedbackPanel`).

### 5.21 Search & categories

- **`/search`:** Global search (events, users, content — implementation in `Search.tsx`).
- **`/categories/:slug`:** Category landing.

---

## 6. Key backend touchpoints (Supabase)

**Illustrative — not exhaustive schema:**

- **`profiles`** — user display, consent versions, notification prefs, `user_type`, account status.
- **`events`** — core event records; `event_last_day` used for “upcoming” queries.
- **`proposals`** — host proposals from `/request-event`.
- **`stories`** — discover/event highlights; likes/comments counts.
- **`tickets`** — purchases, statuses, reference codes.
- **`notifications`** — in-app notification inbox.
- **`conversations`**, **`messages`** — chat.
- **`app_feedback`** — feedback tickets.
- **Surveys / sponsors / event_sponsors / saved_events** — align with services in `src/lib`.

**Storage buckets (examples):** `event-images` (proposals, media), others per upload helpers.

---

## 7. Edge Functions (repo)

| Function | Role |
|----------|------|
| `mpesa` / `mpesa-callback` | M-Pesa payment initiation and callback handling. |
| `request-password-reset` | Password reset email/link flow helper. |
| `delete-my-account` | GDPR / account deletion orchestration. |
| `create-event-media-share` | Create tokenized public gallery links. |
| `public-event-media-gallery` | Serve gallery payload for a token. |
| `admin-get-ghost-user-ids` | Admin ghost tooling. |
| `process-ghost-actions` | Scheduled / batch ghost engagement processing. |

---

## 8. Non-functional & builder notes

- **Theming:** `ThemeProvider` + dark/light (see `next-themes` / mode toggle).
- **Analytics:** Vercel Analytics component in `App`.
- **Accessibility:** Radix primitives; bottom nav uses `safe-area-bottom`.
- **Forum:** Deprecated routes redirect to Discover — do not rebuild `/forum` as primary UX.
- **Capacitor:** Native build uses **`dist`**; **Live Updates** disabled in code until stable.

---

## 9. PRD change log

| Date | Change |
|------|--------|
| (doc created) | Initial full-route and flow inventory from `src/App.tsx` and core pages/services. |

---

*End of PRD — for questions on a single flow, search this file for the route (e.g. `/request-event`) or the section number.*
