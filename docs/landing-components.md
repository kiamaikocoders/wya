<!-- Component breakdown for WYA landing page -->

# Landing Page Component Breakdown

## Page Structure
- `LandingPage` route component orchestrates sections in order:
  1. `LandingHero`
  2. `LandingTrustBar`
  3. `LandingFeatureGrid`
  4. `LandingPersonalization`
  5. `LandingCommunityStories`
  6. `LandingHowItWorks`
  7. `LandingMobileShowcase` (optional based on assets)
  8. `LandingFAQ`
  9. `LandingFinalCTA`

## New Components
- `LandingHero`: full-viewport hero; props for headline, subheadline, CTAs, background media. Uses `Button`, `Link`, optional inline input.
- `LandingTrustBar`: displays metrics or partner logos using responsive flex/grid.
- `LandingFeatureGrid`: accepts array of features (icon, title, description); uses existing `Card` UI if available (`components/ui/card`).
- `LandingPersonalization`: split layout with copy + illustrative media; optionally reuses `Badge`/`Button`.
- `LandingCommunityStories`: testimonial slider or static cards leveraging `Avatar`, `Quote` icons.
- `LandingHowItWorks`: three-step timeline; reuse `StepCard` if exists, else simple flex with numbered badges.
- `LandingMobileShowcase`: image mockups with gradient background; optional if assets ready.
- `LandingFAQ`: wraps `Accordion` UI component with prefilled questions.
- `LandingFinalCTA`: gradient banner with dual CTAs; reuse `Button`.

## Reuse from Existing Library
- `Button` (`components/ui/button`)
- `Section` (`components/ui/Section`) for consistent spacing
- `Badge`, `Card`, `Avatar`, `Separator` (verify presence under `components/ui`)
- `Accordion` for FAQ
- `Container` or layout utilities from Tailwind + global `container` class

## Shared Utilities
- `cn` helper from `@/lib/utils`
- Animation utility classes (`animate-fade-in`, `animate-fade-in-up`)
- Color tokens (`bg-kenya-dark`, `text-gradient`)

## Data & Hooks
- Basic marketing content can be static in the route file (or extracted to `src/data/landing.ts`).
- Use `useAuth` (from `hooks/use-auth`) to tailor CTAs for logged-in state (e.g., “Go to Dashboard” vs “Get Started”).

## Responsive Considerations
- Each section should stack vertically on `sm` breakpoints (`flex-col`, `grid-cols-1`).
- Use `aspect-video` / `object-cover` for imagery to maintain ratio.
- Ensure CTA buttons expand to full width on mobile.


