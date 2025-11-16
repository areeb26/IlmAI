# IlmAI UI Design System

**Version 1.0.0** | **Last Updated:** November 2024

---

## 📐 Overview

This document outlines the complete design system for IlmAI, a beautiful, modern Chrome extension for AI-powered Urdu video note-taking. Our design philosophy emphasizes clarity, accessibility, and cultural sensitivity while maintaining a premium, professional aesthetic.

---

## 🎨 Design Principles

### 1. **Clarity First**
- Clean, uncluttered interfaces
- Clear visual hierarchy
- Purposeful use of color and typography
- Generous white space

### 2. **Accessibility for All**
- WCAG 2.1 AA compliant
- High contrast ratios (4.5:1 minimum)
- Keyboard navigation support
- Screen reader friendly
- RTL (Right-to-Left) support for Urdu and Arabic

### 3. **Cultural Sensitivity**
- Beautiful Urdu typography (Noto Nastaliq Urdu)
- Proper Arabic diacritics (Noto Naskh Arabic)
- Islamic color palette (respectful greens)
- Bilingual support throughout

### 4. **Performance & Polish**
- Smooth 60fps animations
- Instant feedback on interactions
- Optimized for low-end devices
- Progressive enhancement

---

## 🌈 Color System

### Primary Color Palette

Our primary blue represents **trust, wisdom, and learning** - core values of IlmAI.

```css
/* Primary Blue */
--color-primary-50:  #EFF6FF;  /* Lightest tint */
--color-primary-100: #DBEAFE;
--color-primary-200: #BFDBFE;
--color-primary-300: #93C5FD;
--color-primary-400: #60A5FA;
--color-primary-500: #3B82F6;  /* Base color */
--color-primary-600: #2563EB;  /* Primary action color */
--color-primary-700: #1D4ED8;
--color-primary-800: #1E40AF;
--color-primary-900: #1E3A8A;  /* Darkest shade */
```

**Usage:**
- **500-600**: Primary buttons, links, active states
- **100-200**: Backgrounds, highlights
- **700-900**: Text on light backgrounds

### Semantic Colors

```css
/* Success Green */
--color-success-500: #10B981;  /* Confirmations, success states */
--color-success-600: #059669;

/* Warning Amber */
--color-warning-500: #F59E0B;  /* Warnings, alerts */
--color-warning-600: #D97706;

/* Error Red */
--color-error-500: #EF4444;    /* Errors, destructive actions */
--color-error-600: #DC2626;

/* Info Cyan */
--color-info-500: #06B6D4;     /* Informational messages */
--color-info-600: #0891B2;
```

### Cultural Colors

```css
/* Islamic Green - for Islamic content */
--color-islamic-500: #16A34A;
--color-islamic-600: #15803D;

/* Urdu Purple - for language-related features */
--color-urdu-500: #9333EA;
--color-urdu-600: #7C3AED;
```

### Gradients

```css
/* Primary Gradient */
--gradient-primary: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);

/* AI Gradient - for AI-powered features */
--gradient-ai: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%);

/* Success Gradient */
--gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);
```

### Neutral Colors

**Light Mode:**
```css
--color-background: #FFFFFF;      /* Page background */
--color-surface: #F8FAFC;         /* Card backgrounds */
--color-surface-hover: #F1F5F9;   /* Hover states */
--color-border: #E2E8F0;          /* Default borders */
--color-border-strong: #CBD5E1;   /* Emphasized borders */
--color-text-primary: #1E293B;    /* Primary text */
--color-text-secondary: #64748B;  /* Secondary text */
--color-text-tertiary: #94A3B8;   /* Tertiary text */
```

**Dark Mode:**
```css
--color-background: #0F172A;      /* Page background */
--color-surface: #1E293B;         /* Card backgrounds */
--color-surface-hover: #334155;   /* Hover states */
--color-border: #334155;          /* Default borders */
--color-border-strong: #475569;   /* Emphasized borders */
--color-text-primary: #F1F5F9;    /* Primary text */
--color-text-secondary: #94A3B8;  /* Secondary text */
--color-text-tertiary: #64748B;   /* Tertiary text */
```

### Contrast Ratios

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| Primary 600 on White | 7.5:1 | AAA |
| Text Primary on Background | 14:1 | AAA |
| Text Secondary on Background | 4.6:1 | AA |
| Error 500 on White | 4.5:1 | AA |

---

## ✍️ Typography

### Font Families

```css
/* English & UI Text */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Urdu Text */
--font-family-urdu: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;

/* Arabic Text */
--font-family-arabic: 'Noto Naskh Arabic', 'Traditional Arabic', serif;

/* Code & Monospace */
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| Display | 48px | 56px (1.16) | 700 | Hero titles |
| H1 | 36px | 44px (1.22) | 700 | Page titles |
| H2 | 30px | 38px (1.26) | 600 | Section titles |
| H3 | 24px | 32px (1.33) | 600 | Subsection titles |
| H4 | 20px | 28px (1.4) | 600 | Card titles |
| Body Large | 18px | 28px (1.55) | 400 | Emphasized body |
| Body | 16px | 24px (1.5) | 400 | Default text |
| Body Small | 14px | 20px (1.42) | 400 | Supporting text |
| Caption | 12px | 16px (1.33) | 500 | Labels, metadata |
| Tiny | 10px | 14px (1.4) | 600 | Timestamps, badges |

### Font Weights

```css
--font-weight-normal: 400;    /* Body text */
--font-weight-medium: 500;    /* Labels, captions */
--font-weight-semibold: 600;  /* Headings, emphasis */
--font-weight-bold: 700;      /* Strong emphasis */
```

### Usage Examples

```html
<!-- Display -->
<h1 class="text-display font-bold">IlmAI</h1>

<!-- Page Title -->
<h1 class="text-h1 font-bold">My Notes</h1>

<!-- Section Title -->
<h2 class="text-h2 font-semibold">Recent Activity</h2>

<!-- Body Text -->
<p class="text-body">This is a paragraph of body text...</p>

<!-- Urdu Text -->
<p class="font-urdu text-h2" dir="rtl">علم کی روشنی</p>

<!-- Arabic Text -->
<p class="font-arabic text-body" dir="rtl">بِسْمِ اللهِ</p>
```

---

## 📏 Spacing System

Based on an 8px grid for visual rhythm and consistency.

```css
--space-xs:  4px;   /* 0.25rem - Tight spacing */
--space-sm:  8px;   /* 0.5rem  - Small gaps */
--space-md:  16px;  /* 1rem    - Default spacing */
--space-lg:  24px;  /* 1.5rem  - Section spacing */
--space-xl:  32px;  /* 2rem    - Large gaps */
--space-2xl: 48px;  /* 3rem    - Major sections */
--space-3xl: 64px;  /* 4rem    - Page margins */
```

### Usage Guidelines

- **4px (xs)**: Icon gaps, tight element spacing
- **8px (sm)**: Button padding, small gaps
- **16px (md)**: Default padding, card spacing
- **24px (lg)**: Section margins, larger padding
- **32px (xl)**: Component separation
- **48px (2xl)**: Major section dividers
- **64px (3xl)**: Page-level spacing

---

## 🔲 Border Radius

```css
--radius-sm:   4px;     /* Badges, tags */
--radius-md:   8px;     /* Inputs, small cards */
--radius-lg:   12px;    /* Buttons, cards */
--radius-xl:   16px;    /* Large cards */
--radius-2xl:  24px;    /* Modals, panels */
--radius-full: 9999px;  /* Pills, circles */
```

---

## 🌓 Shadows & Elevation

### Shadow Scale

```css
/* Subtle elevation */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Default cards */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Elevated cards, dropdowns */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Modals, popovers */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Floating elements */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Inset shadows */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);

/* Colored glow (focus states) */
--shadow-glow: 0 0 20px rgba(37, 99, 235, 0.4);
```

### Usage

- **sm**: Subtle hover effects, minor elevation
- **md**: Resting state cards
- **lg**: Hover state cards, dropdown menus
- **xl**: Modals, sidepanels
- **2xl**: Toast notifications, floating action buttons
- **glow**: Focus states, active elements, recording indicator

---

## 🎭 Components

### Buttons

#### Primary Button
```html
<button class="btn btn-primary">
  <i data-lucide="play"></i>
  Start Recording
</button>
```

**States:**
- Default: Blue gradient with shadow
- Hover: Elevated shadow, slight lift (-2px)
- Active: Returns to default position
- Focus: Blue ring (2px, 10% opacity)
- Disabled: 50% opacity, no hover effects

#### Secondary Button
```html
<button class="btn btn-secondary">
  <i data-lucide="settings"></i>
  Settings
</button>
```

#### Icon Button
```html
<button class="btn btn-icon" aria-label="Favorite">
  <i data-lucide="heart"></i>
</button>
```

### Cards

```html
<div class="card">
  <div class="card-image">
    <!-- Image content -->
  </div>
  <div class="card-content">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Card description...</p>
  </div>
</div>
```

**Variants:**
- `.card-hover` - Adds hover lift effect
- `.card-glass` - Glassmorphism style

### Form Inputs

```html
<!-- Text Input -->
<input type="text" class="input" placeholder="Enter text...">

<!-- Search Bar -->
<div class="search-bar">
  <i data-lucide="search" class="search-bar-icon"></i>
  <input type="search" class="input" placeholder="Search...">
</div>

<!-- Select -->
<select class="input">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>

<!-- With icon -->
<span class="badge badge-primary">
  <i data-lucide="star" size="12"></i>
  Featured
</span>
```

---

## ⚡ Animations

### Transition Speeds

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Animation Classes

```html
<!-- Entrance animations -->
<div class="animate-fade-in">Fades in</div>
<div class="animate-fade-in-up">Fades in and slides up</div>
<div class="animate-slide-in-right">Slides in from right</div>
<div class="animate-scale-in">Scales in</div>

<!-- Continuous animations -->
<div class="animate-pulse-glow">Pulsing glow effect</div>
<div class="animate-spin">Spinning (for loaders)</div>
<div class="animate-bounce">Bouncing effect</div>
```

### Micro-interactions

- **Button hover**: 150ms ease-out, slight lift
- **Card hover**: 200ms ease-out, shadow change + lift
- **Input focus**: 200ms ease-in-out, ring appears
- **Loading**: Smooth infinite spin (1s linear)
- **Toast appearance**: Slide in from right (300ms)

---

## 🌍 RTL (Right-to-Left) Support

### Urdu & Arabic Text

```html
<!-- Urdu -->
<div dir="rtl" lang="ur" class="font-urdu">
  یہ اردو میں ہے
</div>

<!-- Arabic -->
<div dir="rtl" lang="ar" class="font-arabic">
  هذا نص عربي
</div>
```

### RTL-Aware CSS

```css
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}

[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}
```

---

## ♿ Accessibility

### Focus Management

- All interactive elements have visible focus states
- Focus indicators are minimum 2px, high contrast
- Tab order follows logical flow
- Skip links for keyboard navigation

### Screen Readers

```html
<!-- Hidden text for screen readers -->
<span class="sr-only">Close modal</span>

<!-- ARIA labels -->
<button aria-label="Close">
  <i data-lucide="x"></i>
</button>

<!-- ARIA live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true">
  Note saved successfully
</div>
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search |
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + S` | Save |
| `Esc` | Close modals |
| `Tab` | Navigate forward |
| `Shift + Tab` | Navigate backward |

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first approach */
@media (max-width: 640px)  { /* Mobile */ }
@media (min-width: 641px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

### Utility Classes

```html
<!-- Show/hide based on screen size -->
<div class="mobile-only">Mobile content</div>
<div class="desktop-only">Desktop content</div>
```

---

## 🎯 Usage Guidelines

### Do's ✅

- Use the established color palette consistently
- Maintain consistent spacing (8px grid)
- Follow the type scale for all text
- Provide proper contrast ratios
- Include focus states for all interactive elements
- Use appropriate semantic HTML
- Support RTL for Urdu/Arabic content
- Test on both light and dark modes

### Don'ts ❌

- Don't create custom colors outside the palette
- Don't use arbitrary spacing values
- Don't skip heading levels (h1 → h2 → h3)
- Don't rely solely on color to convey meaning
- Don't disable focus outlines
- Don't use images without alt text
- Don't forget to test keyboard navigation
- Don't assume LTR text direction

---

## 🔧 Implementation

### Quick Start

1. **Include design system CSS:**
```html
<link rel="stylesheet" href="styles/design-system.css">
```

2. **Include Lucide icons:**
```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

3. **Use utility classes:**
```html
<div class="card p-lg rounded-xl shadow-md">
  <h2 class="text-h2 font-semibold mb-md">Title</h2>
  <p class="text-body text-secondary">Content...</p>
</div>
```

### Component Library

View the complete component library at:
```
/component-library.html
```

This interactive showcase includes:
- All color swatches
- Typography samples
- Button variants
- Form controls
- Cards and layouts
- Loading states
- Animations

---

## 📚 Resources

### Design Files
- Component Library: `/component-library.html`
- Design System CSS: `/styles/design-system.css`

### External Resources
- [Lucide Icons](https://lucide.dev) - Icon library
- [Inter Font](https://rsms.me/inter/) - UI font
- [Noto Nastaliq Urdu](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu) - Urdu font
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility

### Inspiration
- Material Design 3
- Apple Human Interface Guidelines
- Tailwind CSS
- Radix UI
- Shadcn/ui

---

## 📊 Design Tokens Export

For integration with design tools:

```json
{
  "colors": {
    "primary": {
      "50": "#EFF6FF",
      "500": "#3B82F6",
      "600": "#2563EB"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  }
}
```

---

**Made with ❤️ for the Urdu learning community**

**Version:** 1.0.0
**Last Updated:** November 2024
**Maintained by:** IlmAI Team
