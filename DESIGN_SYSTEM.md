# WYA Design System

## Typography

### Fonts
- **Body**: `Inter` (300, 400, 500, 600, 700)
- **Display/Headings**: `Plus Jakarta Sans` (400, 500, 600, 700, 800)

### Usage
```tsx
// Headings automatically use Plus Jakarta Sans
<h1 className="text-4xl font-bold">Heading</h1>

// Body text uses Inter
<p className="text-base">Body content</p>

// Force display font on any element
<span className="font-display font-bold">Display Text</span>
```

## Color Palette

### Light Mode
- **Background**: `#F8FAFC` (Slate-50) - `bg-background`
- **Card**: `#FFFFFF` - `bg-card`
- **Surface**: `#F1F5F9` (Slate-100) - `bg-muted`
- **Primary**: `#F97316` (Orange-500) - `bg-primary`
- **Secondary**: `#64748B` (Slate-500) - `bg-secondary`
- **Accent**: `#8B5CF6` (Violet-500) - `bg-accent`
- **Border**: Slate-200 - `border-border`

### Dark Mode
- **Background**: `#0B1121` (Deep Slate-950) - `bg-background`
- **Card**: `#151F32` (Custom Slate-900) - `bg-card`
- **Surface**: `#1E293B` (Slate-800) - `bg-muted`
- **Primary**: `#F97316` (Orange-500) - `bg-primary`
- **Secondary**: `#94A3B8` (Slate-400) - `bg-secondary`
- **Accent**: `#8B5CF6` (Violet-500) - `bg-accent`
- **Border**: Slate-800 - `border-border`

## Gradient Utilities

### Text Gradients
```tsx
// Purple to Pink gradient text
<h1 className="text-gradient">
  Discover what's happening in Kenya
</h1>

// Orange to Amber gradient text
<span className="text-gradient-orange font-bold">
  Premium
</span>
```

### Background Gradients
```tsx
// Hero section gradient (auto light/dark)
<section className="bg-hero-gradient">
  {/* Hero content */}
</section>

// Subtle purple glow overlay
<div className="relative">
  <div className="absolute inset-0 bg-subtle-glow -z-10" />
  {/* Content */}
</div>

// Tailwind config gradients
<div className="bg-hero-gradient-light dark:bg-hero-gradient-dark">
  {/* Explicitly controlled gradient */}
</div>
```

## Effects

### Glass Morphism
```tsx
// Modern glass effect with backdrop blur
<nav className="glass-effect">
  {/* Navbar content */}
</nav>

// Manual glass effect
<div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
  {/* Content */}
</div>
```

### Shadows & Glows
```tsx
// Soft shadow
<div className="shadow-sm">Card</div>

// Glow effect for primary actions
<button className="shadow-lg shadow-orange-500/20">
  Click me
</button>

// Dark mode glow
<button className="shadow-lg shadow-orange-900/40 dark:shadow-orange-900/20">
  Click me
</button>
```

## Border Radius

- **Default**: `0.5rem` - `rounded`
- **Large**: `1rem` - `rounded-xl`
- **Extra Large**: `1.5rem` - `rounded-2xl`

## Common Patterns

### Card with Gradient Border
```tsx
<div className="relative overflow-hidden rounded-2xl bg-card border border-pink-200 dark:border-pink-900/30 shadow-sm p-6">
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-rose-400" />
  {/* Card content */}
</div>
```

### Primary Button
```tsx
<button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium shadow-md shadow-orange-500/20 transition-all transform hover:scale-105">
  Explore Events
</button>
```

### Badge/Pill
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
  Curated for you
</span>
```

### Stat Card
```tsx
<div className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
  <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
    Happening now
  </h4>
  <div className="text-3xl font-display font-bold text-foreground mb-2">
    2+
  </div>
  <p className="text-xs text-muted-foreground leading-relaxed">
    Live events across Nairobi, Mombasa, Kisumu, Eldoret, and more.
  </p>
</div>
```

## Dark Mode

The entire design system is dark mode aware. Use the `dark:` prefix for dark mode variants:

```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  {/* Content automatically adapts */}
</div>
```

All CSS variables automatically switch based on the `.dark` class on the `<html>` element.

## Migration Tips

### From Old to New

| Old | New |
|-----|-----|
| `bg-kenya-dark` | `bg-background` |
| `text-white` | `text-foreground` |
| `bg-kenya-brown` | `bg-card` or `bg-muted` |
| `text-kenya-orange` | `text-primary` |
| `border-kenya-brown-dark` | `border-border` |

### Keep Kenya Colors for Brand Elements
The kenya color palette (`kenya-orange`, `kenya-dark`, `kenya-brown`) is still available for specific brand elements that need the exact Kenya theme colors.

