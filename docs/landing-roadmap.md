<!-- Implementation roadmap for WYA landing page -->

# Implementation Roadmap – WYA Landing Page

## Preparation
1. **Routing Setup**
   - Create `src/pages/Landing.tsx` (or `src/routes/landing.tsx`) to host marketing content.
   - Update router to serve landing page for `/` when user is unauthenticated; redirect authenticated users to `Home`.
   - Ensure header/footer components handle logged-out state (e.g., hide dashboard nav).

2. **Asset Collection**
   - Source hero background image, community photos, and mobile mockups (optimize via `public/` directory).
   - Prepare testimonial quotes and metrics data.

## Development Steps
1. **Scaffold Section Components**
   - Implement components listed in `docs/landing-components.md` under `src/components/marketing/`.
   - Define static content objects (copy, metrics, FAQ) in `src/data/landing.ts`.
2. **Hero & CTA Logic**
   - Build `LandingHero` with dynamic CTA labels based on `useAuth`.
   - Add gradient overlay, background media, and scroll indicator.
3. **Core Sections**
   - Assemble Trust Bar, Feature Grid, Personalization, Community Stories, How-It-Works in order.
   - Integrate animation classes and responsive layouts.
4. **Optional Sections**
   - Implement Mobile Showcase if assets available; otherwise hide behind feature flag.
   - Build FAQ using `Accordion`.
5. **Final CTA & Footer**
   - Create final banner with dual CTAs; ensure links route to `Signup`, `RequestEvent`, or organizer contact.

## Styling & Theming
1. Extend Tailwind theme if needed for gradient tokens (`bg-hero-glow`, `shadow-cta`).
2. Create shared marketing CSS utilities (e.g., `.glow-border`, `.pill`).
3. Verify contrast ratios and text readability per `docs/landing-visual-direction.md`.

## Responsive & QA
1. Test breakpoints (`sm`, `md`, `lg`, `xl`) for layout integrity.
2. Validate performance (image optimization, lazy loading).
3. Ensure accessibility: semantic headings, aria labels, keyboard navigation, reduced-motion support.
4. Write integration/unit tests (Jest/React Testing Library) for conditional routing and CTA behavior.

## Launch Checklist
1. Update navigation to include “Landing” entry for logged-out state.
2. Configure metadata (`<Helmet>` or `vite` config) for SEO and social sharing.
3. Capture screenshots & run stakeholder review.
4. Deploy to staging for final sign-off.


