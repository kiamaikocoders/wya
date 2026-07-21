# WYA — Where You At

Social discovery for events in Kenya. Find what’s on tonight, pin your place, request experiences, and show up with your people.

## Features

- **Marketing site** — Concept D landing, Get the App modal (QR + App Store / Google Play), FAQ, Contact, Feedback, Privacy, Attendee Terms, Media consent
- **Events** — Browse by vibe, grid + Mapbox map, event detail popup, tickets/save flows
- **Location** — Search / typeahead + My Location at signup & settings; Mapbox maps for events (Photon / Nominatim fallbacks when needed)
- **Auth** — Email signup/login, consent gates, password reset, profile settings
- **Community** — Discover, favorites, feedback, push notifications (OneSignal)
- **Admin console** — Events, users, marketplace, ghost users, moderation, analytics, notifications
- **Mobile** — Capacitor Android shell with OTA-ready live updates

## Tech stack

| Layer | Stack |
|--------|--------|
| App | React 18, TypeScript, Vite 8, React Router |
| UI | Tailwind CSS, shadcn/ui, Framer Motion |
| Design | Figma (WYA design system · Concept D and related screens) |
| Data | Supabase (Auth, Postgres, RLS, Edge Functions) |
| Maps | Mapbox GL (`react-map-gl`) |
| Push | OneSignal |
| Mobile | Capacitor 7 (Android) |

## Getting started

### Requirements

- **Node.js 18+** (20+ recommended)
- npm

### Clone & install

```bash
git clone https://github.com/kiamaikocoders/wya.git
cd wya
npm install
```

### Environment

Copy the example env and fill in what you need:

```bash
cp .env.example .env
```

Key client variables (see `.env.example` for the full list):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (also used for functions / redirects) |
| `VITE_MAPBOX_ACCESS_TOKEN` | **Public** Mapbox token (`pk.…`) for search & maps — never put a secret `sk.` token in Vite |
| `VITE_ONESIGNAL_APP_ID` | Web push App ID |
| `VITE_ONESIGNAL_SAFARI_WEB_ID` | Safari web push ID |
| `VITE_ALLOWED_REDIRECT_ORIGINS` | Allowed auth redirect origins |
| `VITE_AI_PROXY_BASE_URL` | Optional origin for `/api/ai` if not same-host |

Server-only (Vercel / Edge Functions — **not** `VITE_`):

- `VERCEL_AI_API_KEY` — AI gateway
- `ONESIGNAL_REST_API_KEY`, `ALLOWED_ORIGINS`, etc. — set in Supabase / Vercel dashboards

> The generated Supabase client under `src/integrations/supabase/client.ts` may already embed project URL/anon key for this repo. Prefer env-driven config for forks and new environments.

### Run locally

```bash
npm run dev
```

Vite serves the app (default `http://localhost:8080` or the port shown in the terminal).

Other useful scripts:

```bash
npm run build          # production build
npm run preview        # preview production build
npm run lint           # ESLint
npm run optimize:images
npm run android:build  # web build + Capacitor sync
```

## Project structure

```
src/
  pages/           # Routes (Landing, Events, Auth, Admin, Legal, …)
  components/      # UI, maps, marketing, admin, events
  lib/             # Services (events, location, auth, admin, …)
  contexts/        # Auth, theme
  integrations/    # Supabase client & types
  legal/           # Legal page copy helpers
supabase/
  migrations/      # SQL migrations
  functions/       # Edge Functions
public/            # Static assets (landing, auth, events, legal)
docs/              # Product & engineering notes
```

## Location notes

- Signup / Settings: search-only picker (typeahead, Search, My Location) — no map
- Admin create/edit events: LocationPicker with map pin; lat/lng required; `location_url` can auto-fill
- Events map: theme-aware Mapbox style (light streets / dark); pin hover cards open the event popup
- Details: [`docs/LOCATION_USAGE.md`](docs/LOCATION_USAGE.md)

Apply DB migrations that touch profiles/events (e.g. `handle_new_user` location metadata) via your Supabase workflow before relying on signup location persistence.

## Design

UI is designed in **Figma** (WYA design system) and implemented in this repo. Screens that track Figma closely include landing (Concept D), events browse + detail popup, auth shells, admin console, and legal/help pages (FAQ, Privacy, Terms, Media consent, Contact, Feedback).

- Coral accent `#FF6B35` on dark-first Concept D surfaces; light mode supported site-wide
- Theme toggle persisted (`wya-theme`)
- Marketing and legal pages share `SiteFooter` + hero shells
- Visual / content notes: [`docs/landing-visual-direction.md`](docs/landing-visual-direction.md), [`docs/stitch-design-brief.md`](docs/stitch-design-brief.md)

## Deployment

- **Web:** Vercel (or any static host for the Vite build). Set env vars in the host dashboard.
- **Supabase:** Migrations + Edge Function secrets in the Supabase project.
- **Android:** `npm run android:build` then open/run with Capacitor / Android Studio.

## Docs

See [`docs/`](docs/) for PRDs, auth, notifications, ghost users, landing direction, and security notes.

## Contributing

Use feature branches and pull requests against `main`. Keep changes focused; match existing patterns in `src/` before inventing new ones.
