<!-- Visual direction for WYA marketing landing page -->

# Visual Direction – WYA Landing Page

## Palette Strategy
- **Base:** retain `kenya-dark` (#181410) background with subtle vertical gradient (`#211a14 → #181410`) for depth.
- **Primary Accent:** keep `kenya-orange` (#FF8000) for CTAs; introduce gradient accent `linear-gradient(135deg, #FF8000 0%, #FFA94D 100%)` for hero buttons and highlight chips.
- **Secondary Accent:** expand `kenya-brown.light` (#BCAB9A) for typography highlights and statistic callouts; complement with desaturated teal (`#1C6F6F`) sparingly for AI/tech cues.
- **Surface Layers:** use glassmorphism cards (`bg-white/[0.04]` + border `white/10`) to contrast marketing sections against dark background.
- **Typography Colors:** headings in pure white; body copy at 80% opacity; emphasize keywords with the orange gradient text utility.

## Imagery & Illustration
- **Hero Background:** blurred evening city skyline or concert crowd with warm lighting; apply dark overlay (`bg-black/60`) to preserve contrast.
- **Feature Icons:** refine existing line icons with amber glow or minimal duotone to align with brand.
- **Community Stories:** use portrait photography with soft vignette, integrate circular masks to mirror app avatars.
- **AI Section:** include floating cards or holographic grid patterns leveraging teal accent; subtle animated particles (CSS) for motion.
- **Mobile Showcase:** use mockups of current mobile UI placed over gradient backdrop with shadow depth.

## Layout References
- **Hero:** full-height viewport, left-aligned copy on desktop, centered on mobile; include inline signup form or CTA group.
- **Trust Bar:** horizontal flex row with metrics; collapse to stacked cards on mobile.
- **Feature Grid:** responsive three-column cards (`md:grid-cols-3`, `sm:grid-cols-1`) with icon, heading, short description.
- **Story Section:** two-column layout pairing testimonial text with imagery; animate on scroll using existing fade-in utilities.
- **FAQ Accordion:** reuse `Accordion` component from UI library (if available) with accent borders.
- **Footer CTA:** wide banner with gradient background and dual buttons.

## Motion & Micro-interactions
- Apply existing `animate-fade-in-up` utility on section entrance.
- CTA buttons: scale to 102% on hover, glow shadow `shadow-[0_0_25px_rgba(255,128,0,0.35)]`.
- Feature cards: border highlight on hover using `border-kenya-orange/60`.
- Add scroll indicator chevron in hero for subtle guidance.

## Accessibility Considerations
- Maintain contrast ratios ≥ 4.5:1 for text; ensure gradient buttons have accessible text color (#181410).
- Provide alternative text for all imagery; avoid relying solely on color to convey meaning.
- Respect reduced-motion preferences by disabling particle animations for `prefers-reduced-motion`.


