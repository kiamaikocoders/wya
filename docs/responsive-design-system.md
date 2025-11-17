# WYA Responsive Design System

## 📱 Mobile-First Approach

WYA follows a **mobile-first design strategy**, meaning we design for mobile devices first, then progressively enhance for larger screens.

### Core Principles

1. **Content Priority**: Essential content is always visible on mobile
2. **Progressive Enhancement**: Add features and layout complexity as screen size increases
3. **Touch-First**: All interactive elements are optimized for touch (minimum 44x44px)
4. **Performance**: Mobile experience is fast and lightweight

---

## 🎯 Breakpoints

We use Tailwind CSS breakpoints:

| Breakpoint | Width | Device Type | Usage |
|------------|-------|-------------|-------|
| `sm` | 640px | Large Mobile | Small tablets, large phones |
| `md` | 768px | Tablet | Tablets, small laptops |
| `lg` | 1024px | Desktop | Laptops, desktops |
| `xl` | 1280px | Large Desktop | Large monitors |
| `2xl` | 1536px | Extra Large | Ultra-wide monitors |

### Breakpoint Strategy

**✅ DO (Mobile-First):**
```tsx
// Base styles apply to mobile, then enhance for larger screens
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2">Content</div>
</div>
```

**❌ DON'T (Desktop-First):**
```tsx
// This hides content on mobile - BAD!
<div className="hidden md:block">Content</div>
```

---

## 📐 Layout Patterns

### 1. Stack → Row Pattern

**Mobile**: Vertical stack (flex-col)  
**Desktop**: Horizontal row (flex-row)

```tsx
<div className="flex flex-col gap-4 md:flex-row md:items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 2. Single Column → Multi-Column Grid

**Mobile**: 1 column  
**Tablet**: 2 columns  
**Desktop**: 3+ columns

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

### 3. Content Reordering

**Mobile**: AI Feed appears first  
**Desktop**: AI Feed appears in sidebar

```tsx
<div className="space-y-8">
  {/* Mobile: Shows first */}
  <div className="block md:hidden">
    <AIFeed />
  </div>
  
  {/* Desktop: Shows in grid */}
  <div className="grid md:grid-cols-[1.2fr_0.8fr]">
    <MainContent />
    <div className="hidden md:block">
      <AIFeed />
    </div>
  </div>
</div>
```

---

## 🎨 Typography Scale

Use responsive text sizing:

```tsx
// Mobile: text-3xl, Desktop: text-5xl
<h1 className="text-3xl md:text-5xl">Title</h1>

// Mobile: text-base, Desktop: text-lg
<p className="text-base md:text-lg">Description</p>
```

### Typography Scale Reference

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| H1 | `text-3xl` (30px) | `text-4xl` (36px) | `text-5xl` (48px) |
| H2 | `text-2xl` (24px) | `text-3xl` (30px) | `text-4xl` (36px) |
| H3 | `text-xl` (20px) | `text-2xl` (24px) | `text-3xl` (30px) |
| Body | `text-base` (16px) | `text-base` (16px) | `text-lg` (18px) |
| Small | `text-sm` (14px) | `text-sm` (14px) | `text-base` (16px) |

---

## 🎯 Touch Targets

All interactive elements must meet minimum touch target sizes:

- **Minimum Size**: 44x44px (Apple HIG) / 48x48px (Material Design)
- **Spacing**: Minimum 8px between touch targets
- **Use Class**: `touch-target` utility class

```tsx
<Button className="touch-target">Click Me</Button>
```

---

## 📦 Component Patterns

### ResponsiveContent Component

Reorder content based on screen size:

```tsx
import { ResponsiveContent } from '@/components/layout/ResponsiveContent';

<ResponsiveContent mobileOrder={1} desktopOrder={2}>
  <AIFeed />
</ResponsiveContent>
```

### MobileFirstGrid Component

Create responsive grids:

```tsx
import { MobileFirstGrid } from '@/components/layout/ResponsiveContent';

<MobileFirstGrid 
  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="gap-4"
>
  {items}
</MobileFirstGrid>
```

### ShowOnMobile / ShowOnDesktop

Conditionally show content:

```tsx
import { ShowOnMobile, ShowOnDesktop } from '@/components/layout/ResponsiveContent';

<ShowOnMobile>
  <MobileNavigation />
</ShowOnMobile>

<ShowOnDesktop>
  <DesktopSidebar />
</ShowOnDesktop>
```

---

## 🚫 Common Mistakes to Avoid

### 1. Hiding Essential Content on Mobile

**❌ BAD:**
```tsx
<div className="hidden md:block">
  <AIFeed /> {/* Users can't access this on mobile! */}
</div>
```

**✅ GOOD:**
```tsx
{/* Mobile version */}
<div className="block md:hidden">
  <AIFeedMobile />
</div>

{/* Desktop version */}
<div className="hidden md:block">
  <AIFeedDesktop />
</div>
```

### 2. Desktop-First Breakpoints

**❌ BAD:**
```tsx
<div className="hidden md:flex"> {/* Starts hidden */}
```

**✅ GOOD:**
```tsx
<div className="flex flex-col md:flex-row"> {/* Starts visible */}
```

### 3. Fixed Widths on Mobile

**❌ BAD:**
```tsx
<div className="w-96"> {/* Fixed width breaks on small screens */}
```

**✅ GOOD:**
```tsx
<div className="w-full max-w-md"> {/* Responsive width */}
```

### 4. Small Touch Targets

**❌ BAD:**
```tsx
<Button className="h-8 w-8"> {/* Too small for touch */}
```

**✅ GOOD:**
```tsx
<Button className="h-11 w-11 touch-target"> {/* Proper touch target */}
```

---

## 📱 Mobile-Specific Considerations

### Safe Areas

Use safe area insets for notched devices:

```tsx
<div className="safe-area-top safe-area-bottom">
  Content
</div>
```

### Horizontal Scrolling

Prevent horizontal scroll:

```tsx
// In index.css
@media (max-width: 768px) {
  html, body, #root {
    overflow-x: hidden;
    max-width: 100vw;
  }
}
```

### Viewport Meta Tag

Ensure proper viewport configuration:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
```

---

## 🎨 Spacing Scale

Use consistent spacing:

| Size | Value | Usage |
|------|-------|-------|
| `gap-2` | 8px | Tight spacing (icons) |
| `gap-4` | 16px | Standard spacing (cards) |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Large section spacing |

**Mobile**: Use tighter spacing  
**Desktop**: Use more generous spacing

```tsx
<div className="space-y-4 md:space-y-8">
  {items}
</div>
```

---

## 🔍 Testing Checklist

See `docs/testing-checklist.md` for comprehensive testing guidelines.

### Quick Visual Checks

1. ✅ All content visible on mobile (320px width)
2. ✅ No horizontal scrolling
3. ✅ Touch targets are 44x44px minimum
4. ✅ Text is readable (minimum 16px)
5. ✅ Images scale properly
6. ✅ Navigation works on all screen sizes

---

## 📚 Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Responsive Layout](https://material.io/design/layout/responsive-layout-grid.html)
- [Web.dev Responsive Design](https://web.dev/responsive-web-design-basics/)

---

## 🛠️ Utility Classes

### Custom Utilities in `index.css`

- `.touch-target` - Minimum 44x44px touch target
- `.safe-area-top` - Top safe area padding
- `.safe-area-bottom` - Bottom safe area padding
- `.scrollbar-hide` - Hide scrollbar but keep scrolling

---

## 📝 Code Review Checklist

When reviewing responsive code, check:

- [ ] Uses mobile-first breakpoints (`md:` not `hidden md:block`)
- [ ] Essential content visible on mobile
- [ ] Touch targets meet minimum size
- [ ] No fixed widths that break on mobile
- [ ] Text scales appropriately
- [ ] Images are responsive
- [ ] Spacing adapts to screen size
- [ ] No horizontal scrolling issues


