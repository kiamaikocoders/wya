# WYA — Google Stitch design brief

Source: codebase inventory (`/src/App.tsx`, `src/index.css`, `tailwind.config.ts`, layout components, `capacitor.config.ts`). Use this document as global context when using **Google Stitch** (or similar) for **redesign** mockups. Product in code: **WYA — “Where You At”**, Kenya-focused events. Domain referenced for native builds: **https://www.wya254.com** (254 = Kenya country code).

---

## Brand & positioning

| Item | What the app uses |
|------|-------------------|
| **Name** | **WYA** |
| **Tagline** | **WHERE YOU AT** (optional under logo) |
| **Topic** | Discover and host events in Kenya |
| **Logo** | Image: `/WYA_LOGO_2-*.webp` / `.avif`; fallback text lockup with orange → amber gradient chip and **WYA** on **kenya-dark** |
| **Browser theme color** | `#FF8000` |
| **Native app** | `appId`: `com.wya.whereyouat`, `appName`: **WYA - Where You At** |

---

## Typography

| Role | Font | Weights loaded |
|------|------|----------------|
| **Body (UI)** | [Inter](https://fonts.google.com/specimen/Inter) | 300–700 |
| **Headings (`h1`–`h6`)** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | 400–800 |
| **Tailwind** | `font-sans` → Inter; `font-display` → Plus Jakarta Sans | |
| **Heading tracking** | Slightly tight: `-0.02em` | |
| **Inter features** | `font-feature-settings: "ss01", "ss02", "cv01"` on `.font-sans` | |

Fonts load from Google Fonts in `index.html`.

---

## Color palette

### Semantic tokens (CSS variables in `src/index.css`)

Light and dark themes are defined; **`ThemeContext` currently forces dark mode** on the document.

- **Primary / CTAs / focus ring:** orange (comments in CSS reference ~`#F97316`); brand accent **`#FF8000`** also used as `kenya-orange`.
- **Accent:** violet (~`#8B5CF6`).
- **Destructive:** red family.
- **Light surfaces:** background ~`#F8FAFC`, cards white, slate borders.
- **Dark surfaces:** background **`#0B1121`**, cards ~`#151F32`, slate-leaning borders.

### Named brand colors (`tailwind.config.ts`)

| Token | Hex |
|------|-----|
| `kenya.orange` | `#FF8000` |
| `kenya.dark` | `#181410` |
| `kenya.brown` | `#3A3027` |
| `kenya.brown.light` | `#BCAB9A` |
| `kenya.brown.dark` | `#28211B` |
| Custom `slate.950` | `#0B1121` |

### Gradients & utilities

- **Hero light:** `#EEF2FF` → `#F5F3FF` (`hero-gradient-light`)
- **Hero dark:** `#0B1121` → `#171638` (`hero-gradient-dark`)
- **Text:** purple → pink (`text-gradient`); orange → amber (`text-gradient-orange`)
- **Glow:** violet radial (`subtle-glow-light` / `subtle-glow-dark`)
- **Glass:** backdrop blur + translucent white/slate (`glass-effect`)
- **Calendar (day picker):** accent `#FF8000`, orange-tinted selection

### `bg-gradient-promo`

Many screens use **`bg-gradient-promo`**, but it is **not defined** in `tailwind.config.ts` at time of writing. For mockups, treat promo backgrounds like **`hero-gradient-dark`** with optional orange/violet accents and frosted cards—consistent with the rest of the theme.

---

## Layout chrome

**Main shell** (`Layout.tsx`):

- **Top:** Navbar — hidden on login, signup, and full-screen Discover.
- **Bottom:** fixed **BottomNav** — Overview (`/` or `/home`), Discover, Events, Host (`/request-event`), Profile (`/profile`).
- **Footer:** full footer on **landing** only; elsewhere minimal footer.
- **Discover:** full-height scroll; bottom nav can hide on scroll; no default navbar.
- **Main:** extra bottom padding when navbar present (`pb-20` / `md:pb-24`).

**Marketing shell** (`MarketingLayout.tsx`): full-height dark promo-style background, white text.

---

## Route map

All routes from `src/App.tsx`. **Protected** = requires login. **Admin** = admin-only.

### Marketing

| Path | Page |
|------|------|
| `/` | Landing |
| `/download` | DownloadApp |

### Admin (`/admin/...`, separate layout)

| Path | Page |
|------|------|
| `/admin` | AdminDashboard |
| `/admin/events` | AdminEvents |
| `/admin/proposals` | AdminProposals |
| `/admin/users` | AdminUsers |
| `/admin/moderation` | AdminModeration |
| `/admin/media-gallery` | AdminMediaGallery |
| `/admin/analytics` | AdminAnalytics |
| `/admin/sponsor-analytics` | AdminSponsorAnalytics |
| `/admin/ghost` | AdminGhost |

### Main app

**Auth & account**

| Path | Protected | Notes |
|------|:---------:|--------|
| `/login` | No | No top navbar |
| `/signup` | No | Consent / marketing checkboxes |
| `/admin-login` | No | Staff |
| `/forgot-password` | No | |
| `/reset-password` | No | |
| `/auth/callback` | No | |
| `/auth/confirm` | No | |
| `/email-confirmation-pending` | No | |

**Core**

| Path | Protected | Notes |
|------|:---------:|--------|
| `/home` | No | Feed, carousels, AI recommendations, onboarding redirect |
| `/onboarding` | Yes | Preferences wizard |
| `/events` | No | Filters, toolbar, mobile sheets |
| `/events/:eventId` | No | Detail, tickets, maps, AI similar |
| `/categories/:slug` | No | |
| `/discover` | No | Full-screen reel-style feed |
| `/discover/:id` | No | Deep link |
| `/search` | No | |
| `/stories` | No | |
| `/request-event` | No | Host CTA from tab bar |
| `/create-event` | Yes | |

**Social**

| Path | Protected | Notes |
|------|:---------:|--------|
| `/profile` | Yes | Own profile |
| `/settings` | Yes | Account, media consent |
| `/users/:userId` | No | Public profile |
| `/users` | No | Directory |
| `/chat` | Yes | |
| `/chat/:conversationId` | Yes | |
| `/notifications` | Yes | |
| `/favorites` | Yes | |
| `/forum` | Yes | |
| `/forum/:postId` | Yes | |

**Tickets & sponsors**

| Path | Protected |
|------|:---------:|
| `/tickets` | Yes |
| `/tickets/:ticketId` | Yes |
| `/sponsors` | No |
| `/sponsors/:sponsorId` | No |

**Surveys**

| Path | Protected |
|------|:---------:|
| `/surveys/:surveyId` | Yes |
| `/surveys/:surveyId/results` | Yes |
| `/surveys/create` | Yes |

**Analytics (user/organizer)**

| Path | Protected |
|------|:---------:|
| `/analytics` | Yes |
| `/analytics/events/:eventId` | Yes |
| `/analytics/event/:eventId` | Yes |

**AI & legal**

| Path | Protected |
|------|:---------:|
| `/ai-assistance` | No |
| `/privacy-policy` | No |
| `/terms-of-service` | No |
| `/media-consent` | No |

**Fallback**

| Path | Page |
|------|------|
| `*` | NotFound |

---

## Using this in Stitch

1. One frame per route (or per major state: guest vs logged-in, loading, empty).
2. Paste **Brand**, **Typography**, and **Color palette** as global instructions.
3. Design **mobile-first**: bottom nav, safe areas, Discover full-bleed.
4. Align tokens: primary **`#FF8000` / `#F97316`**, dark base **`#0B1121`**, accent violet **`#8B5CF6`**, **Inter** + **Plus Jakarta Sans**.
5. Stitch outputs are for **visual direction**; implementation stays in this React + Capacitor codebase for web and store shells.

---

## Related files (for engineers)

- Routes: `src/App.tsx`
- Tokens: `src/index.css`, `tailwind.config.ts`
- Theme: `src/contexts/ThemeContext.tsx`
- Logo: `src/components/ui/Logo.tsx`
- Shell: `src/components/layout/Layout.tsx`, `MarketingLayout.tsx`, `BottomNav.tsx`
- Native: `capacitor.config.ts`
