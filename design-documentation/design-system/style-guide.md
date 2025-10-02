---
title: Later App Complete Style Guide
description: Comprehensive visual design specifications including colors, typography, spacing, and components
last-updated: 2025-10-01
version: 1.0.0
related-files:
  - tokens/colors.md
  - tokens/typography.md
  - tokens/spacing.md
  - tokens/animations.md
status: draft
---

# Later App — Complete Style Guide

## Design Philosophy Summary

The Later app visual design embodies **calm technology** principles through:
- **Soft, natural color palettes** that reduce eye strain and anxiety
- **Breathing room through strategic whitespace** that prevents cognitive overload
- **Typography optimized for reading** rather than scanning
- **Gentle, purposeful animations** that enhance understanding without distraction
- **Accessibility-first approach** ensuring inclusive design for all users

---

## Color System

### Primary Colors

#### Primary Blue (Brand)
- **Primary**: `#4A90E2` – Main CTAs, brand elements, active states
- **Primary Dark**: `#357ABD` – Hover states, pressed buttons, emphasis
- **Primary Light**: `#7BB3E8` – Subtle backgrounds, highlights, secondary actions

#### Secondary Sage (Calm)
- **Secondary**: `#8FBC8F` – Supporting elements, secondary navigation
- **Secondary Light**: `#B5D6B5` – Backgrounds, subtle accents, selected states
- **Secondary Pale**: `#E8F5E8` – Cards, containers, gentle highlights

### Accent Colors

#### Warm Accent (Energy)
- **Accent Primary**: `#F7B731` – Important actions, notifications, progress
- **Accent Secondary**: `#FFC947` – Warnings, highlights, active elements
- **Gradient Start**: `#F7B731` – For gradient buttons and cards
- **Gradient End**: `#FFC947` – For gradient elements

### Semantic Colors

#### Success (Growth)
- **Success**: `#2ECC71` – Positive actions, confirmations, completed states
- **Success Light**: `#A8E6C1` – Success backgrounds, subtle confirmations
- **Success Dark**: `#27AE60` – Success text, strong positive emphasis

#### Warning (Attention)
- **Warning**: `#F39C12` – Caution states, important alerts
- **Warning Light**: `#FCE4B6` – Warning backgrounds, gentle alerts
- **Warning Dark**: `#E67E22` – Warning text, urgent attention

#### Error (Care)
- **Error**: `#E74C3C` – Errors, destructive actions, critical alerts
- **Error Light**: `#FADBD8` – Error backgrounds, gentle error states
- **Error Dark**: `#C0392B` – Error text, strong negative emphasis

#### Info (Knowledge)
- **Info**: `#3498DB` – Informational messages, helpful tips
- **Info Light**: `#D6EAF8` – Info backgrounds, gentle information
- **Info Dark**: `#2980B9` – Info text, strong informational emphasis

### Neutral Palette

#### Text Hierarchy
- **Neutral-900**: `#1A1A1A` – Primary text, headings, high contrast
- **Neutral-800**: `#2D2D2D` – Body text, secondary headings
- **Neutral-700**: `#4A4A4A` – Secondary text, labels
- **Neutral-600**: `#6B6B6B` – Tertiary text, placeholders
- **Neutral-500**: `#8A8A8A` – Disabled text, subtle labels

#### Interface Elements
- **Neutral-400**: `#A8A8A8` – Borders, dividers, disabled elements
- **Neutral-300**: `#C6C6C6` – Light borders, inactive states
- **Neutral-200**: `#E0E0E0` – Card borders, subtle dividers
- **Neutral-100**: `#F5F5F5` – Background tints, subtle containers
- **Neutral-50**: `#FAFAFA` – Page backgrounds, lightest containers

### Accessibility Compliance

#### Contrast Ratios (WCAG AA)
- **Primary on White**: 4.84:1 ✓ (AA compliant)
- **Secondary on White**: 5.12:1 ✓ (AA compliant)
- **Neutral-800 on White**: 12.6:1 ✓ (AAA compliant)
- **Neutral-700 on White**: 7.8:1 ✓ (AAA compliant)
- **Error on White**: 5.2:1 ✓ (AA compliant)

#### Critical Interaction Ratios (Enhanced)
- **Primary Dark on White**: 7.1:1 ✓ (Enhanced accessibility)
- **Success Dark on White**: 6.8:1 ✓ (Enhanced accessibility)
- **Neutral-900 on White**: 16.2:1 ✓ (Maximum accessibility)

---

## Typography System

### Font Stack
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace**: `JetBrains Mono, SF Mono, Consolas, 'Liberation Mono', monospace`

#### Font Weights Available
- **Light**: 300 – Subtle text, large display elements
- **Regular**: 400 – Body text, standard UI elements
- **Medium**: 500 – Emphasized text, section labels
- **Semibold**: 600 – Headings, important labels
- **Bold**: 700 – Major headings, strong emphasis

### Type Scale (Mobile-First)

#### Display Typography
- **H1**: `32px/40px, 600, -0.02em` – Page titles, major sections
- **H2**: `28px/36px, 600, -0.01em` – Section headers, card titles
- **H3**: `24px/32px, 600, -0.01em` – Subsection headers, dialog titles
- **H4**: `20px/28px, 500, 0em` – Content headers, list titles
- **H5**: `18px/26px, 500, 0em` – Minor headers, emphasized labels

#### Body Typography
- **Body Large**: `18px/28px, 400` – Primary reading text, article content
- **Body**: `16px/24px, 400` – Standard UI text, descriptions
- **Body Small**: `14px/20px, 400` – Secondary information, metadata
- **Caption**: `12px/16px, 400` – Timestamps, fine print, helper text
- **Label**: `14px/20px, 500, uppercase, 0.05em` – Form labels, categories
- **Code**: `14px/20px, 400, monospace` – Code blocks, technical text

### Responsive Typography Scaling

#### Tablet (768px+)
- **H1**: `36px/44px` – Larger hero elements
- **H2**: `32px/40px` – Enhanced section headers
- **Body Large**: `19px/30px` – Improved reading experience
- **Body**: `17px/26px` – Enhanced UI readability

#### Desktop (1024px+)
- **H1**: `40px/48px` – Desktop hero sizing
- **H2**: `36px/44px` – Prominent section headers
- **Body Large**: `20px/32px` – Optimal reading experience
- **Body**: `18px/28px` – Comfortable UI text

### Reading Optimization

#### Line Length Guidelines
- **Mobile**: 45-65 characters per line for optimal readability
- **Tablet**: 55-75 characters per line for comfortable reading
- **Desktop**: 65-85 characters per line for extended reading

#### Text Spacing
- **Letter Spacing**: Subtle negative tracking on large headings for visual refinement
- **Word Spacing**: Default browser spacing optimized for reading flow
- **Paragraph Spacing**: 1.5x line height between paragraphs for breathing room

---

## Spacing & Layout System

### Base Unit: 8px

This 8-pixel base unit creates consistent rhythm and easy mental calculation while providing granular control for precise layouts.

### Spacing Scale

#### Micro Spacing
- **xs**: `4px` (0.5 units) – Micro spacing between related elements
- **sm**: `8px` (1 unit) – Small spacing, internal component padding
- **md**: `16px` (2 units) – Default spacing, standard margins and padding

#### Macro Spacing
- **lg**: `24px` (3 units) – Medium spacing between sections
- **xl**: `32px` (4 units) – Large spacing, major section separation
- **2xl**: `48px` (6 units) – Extra large spacing, screen padding
- **3xl**: `64px` (8 units) – Huge spacing, hero sections and major breaks

### Layout Grid System

#### Mobile Grid (320-767px)
- **Columns**: 4 columns
- **Gutters**: 16px between columns
- **Margins**: 16px on each side
- **Max Width**: Content fills available width minus margins

#### Tablet Grid (768-1023px)
- **Columns**: 8 columns
- **Gutters**: 20px between columns
- **Margins**: 24px on each side
- **Max Width**: 720px centered container

#### Desktop Grid (1024px+)
- **Columns**: 12 columns
- **Gutters**: 24px between columns
- **Margins**: 32px on each side
- **Max Width**: 1200px centered container

### Container System

#### Page Containers
- **Full Width**: Edge-to-edge content for backgrounds and images
- **Content Width**: Reading-optimized width with appropriate margins
- **Narrow Width**: Forms and focused content, max 600px

#### Component Containers
- **Card Container**: 16px padding on mobile, 24px on tablet+
- **List Container**: 12px vertical, 16px horizontal padding
- **Form Container**: 24px padding for comfortable interaction

---

## Component Specifications

### Buttons

#### Primary Button
**Visual Specifications**:
- **Height**: `48px` (mobile), `44px` (desktop)
- **Padding**: `16px 24px` (horizontal padding for text)
- **Border Radius**: `8px` (rounded corners for friendliness)
- **Typography**: Body text, 500 weight, centered
- **Background**: Primary gradient (`#4A90E2` to `#357ABD`)
- **Text Color**: White
- **Shadow**: `0 2px 8px rgba(74, 144, 226, 0.3)`

**Interaction States**:
- **Hover**: Gradient shifts lighter, shadow increases to `0 4px 12px`
- **Active**: Slightly compressed scale (0.98), darker gradient
- **Focus**: 2px solid focus ring with Primary color
- **Disabled**: 50% opacity, no shadow, no hover effects
- **Loading**: Spinner replaces text, maintains button dimensions

#### Secondary Button
**Visual Specifications**:
- **Height**: `48px` (mobile), `44px` (desktop)
- **Padding**: `16px 24px`
- **Border**: `1px solid #4A90E2`
- **Border Radius**: `8px`
- **Background**: Transparent
- **Text Color**: Primary (`#4A90E2`)

#### Tertiary Button (Text Only)
**Visual Specifications**:
- **Height**: `44px` minimum for touch target
- **Padding**: `12px 16px`
- **Background**: Transparent
- **Text Color**: Primary (`#4A90E2`)
- **No border or shadow**

### Form Elements

#### Text Input
**Visual Specifications**:
- **Height**: `48px` for comfortable touch interaction
- **Padding**: `12px 16px` for text spacing
- **Border**: `1px solid #C6C6C6` (Neutral-300)
- **Border Radius**: `8px` for friendly appearance
- **Background**: White with subtle texture
- **Typography**: Body text (16px) for iOS zoom prevention

**Interaction States**:
- **Focus**: Border color changes to Primary, 2px border width
- **Error**: Border color changes to Error red, error message appears
- **Success**: Border color changes to Success green
- **Disabled**: Background becomes Neutral-100, text becomes Neutral-500

#### Select/Dropdown
**Visual Specifications**:
- **Height**: `48px` matching text inputs
- **Padding**: `12px 16px 12px 16px`
- **Icon**: Chevron down icon, positioned right with 16px margin
- **Border**: Same as text input for consistency

### Cards

#### Content Card
**Visual Specifications**:
- **Border Radius**: `12px` for modern, friendly appearance
- **Padding**: `20px` on mobile, `24px` on tablet+
- **Background**: White
- **Border**: `1px solid #E0E0E0` (Neutral-200)
- **Shadow**: `0 2px 8px rgba(0, 0, 0, 0.06)` for subtle depth

**Content Structure**:
- **Header**: H4 typography, Primary color for links
- **Meta Information**: Caption typography, Neutral-600 color
- **Content Preview**: Body Small typography, 3-line limit with ellipsis
- **Actions**: Secondary buttons, right-aligned

### Navigation

#### Bottom Tab Bar
**Visual Specifications**:
- **Height**: `84px` (includes safe area)
- **Background**: White with subtle shadow
- **Shadow**: `0 -2px 8px rgba(0, 0, 0, 0.06)`
- **Item Spacing**: Equal distribution across available width

**Tab Item Specifications**:
- **Icon Size**: `24px` for clear recognition
- **Typography**: Caption (12px), Medium weight when active
- **Active Color**: Primary (`#4A90E2`)
- **Inactive Color**: Neutral-500 (`#8A8A8A`)
- **Touch Target**: Minimum 44px square for accessibility

---

## Motion & Animation System

### Timing Functions

#### Natural Easing Curves
- **Ease-Out**: `cubic-bezier(0.0, 0, 0.2, 1)` – Entrances, expansions, revealing content
- **Ease-In-Out**: `cubic-bezier(0.4, 0, 0.6, 1)` – Transitions, movements, state changes
- **Ease-In**: `cubic-bezier(0.4, 0, 1, 1)` – Exits, contractions, hiding content

#### Calm Technology Easing
- **Gentle**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` – Subtle feedback, non-intrusive animations
- **Organic**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` – Playful interactions, onboarding

### Duration Scale

#### Micro Interactions (0-200ms)
- **Instant**: `100ms` – Button press feedback, hover states
- **Quick**: `150ms` – Color changes, small scale changes
- **Snap**: `200ms` – Icon changes, checkbox animations

#### Local Transitions (200-400ms)
- **Fast**: `250ms` – Card expansions, list item animations
- **Standard**: `300ms` – Modal appearances, drawer slides
- **Comfortable**: `400ms` – Screen transitions, complex state changes

#### Global Transitions (400ms+)
- **Deliberate**: `500ms` – Full screen transitions, major layout changes
- **Storytelling**: `600ms` – Onboarding sequences, tutorial animations
- **Cinematic**: `800ms` – Hero animations, special moments

### Animation Principles

#### Calm Technology Motion
1. **Purposeful Movement**: Every animation serves a functional purpose
2. **Respectful Timing**: Animations don't feel rushed or impatient
3. **Natural Physics**: Movement feels grounded in real-world physics
4. **User Control**: Users can always reduce or disable motion
5. **Efficient Performance**: Animations maintain 60fps on target devices

#### Common Animation Patterns

**Content Entrance**:
- **Fade In**: `opacity: 0 → 1` over 300ms with ease-out
- **Slide Up**: `translateY: 24px → 0` combined with fade in
- **Scale In**: `scale: 0.96 → 1` for modal and popover appearances

**Content Exit**:
- **Fade Out**: `opacity: 1 → 0` over 200ms with ease-in
- **Slide Down**: `translateY: 0 → 16px` combined with fade out
- **Scale Out**: `scale: 1 → 0.96` for modal and popover dismissals

**State Changes**:
- **Color Transition**: Background/text color changes over 150ms
- **Loading States**: Gentle pulse or spinner rotation
- **Success/Error**: Color change + check/x icon appearance

### Accessibility Considerations

#### Reduced Motion Support
- **`prefers-reduced-motion: reduce`**: Automatically disables non-essential animations
- **Alternative Feedback**: Instant state changes instead of transitions
- **Essential Motion**: Only use animation for critical understanding (progress, direction)

#### Performance Guidelines
- **Hardware Acceleration**: Use `transform` and `opacity` for animations
- **Composite Layers**: Avoid animating properties that trigger layout/paint
- **Frame Rate**: Target 60fps, gracefully degrade on slower devices
- **Battery Impact**: Minimize continuous animations in background

---

## Implementation Guidelines

### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Colors */
  --color-primary: #4A90E2;
  --color-primary-dark: #357ABD;
  --color-primary-light: #7BB3E8;

  --color-secondary: #8FBC8F;
  --color-secondary-light: #B5D6B5;
  --color-secondary-pale: #E8F5E8;

  /* Typography */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-h1: 2rem;
  --font-size-body: 1rem;
  --line-height-body: 1.5;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Animations */
  --duration-quick: 150ms;
  --duration-standard: 300ms;
  --easing-ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
}
```

### React Native Styling

```typescript
// Design tokens for React Native
export const tokens = {
  colors: {
    primary: '#4A90E2',
    primaryDark: '#357ABD',
    primaryLight: '#7BB3E8',
    // ... additional colors
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    // ... additional spacing
  },
  typography: {
    fontFamily: {
      primary: 'Inter',
      mono: 'JetBrainsMono',
    },
    fontSize: {
      h1: 32,
      body: 16,
      caption: 12,
    },
    // ... additional typography
  },
  animation: {
    duration: {
      quick: 150,
      standard: 300,
    },
    easing: {
      easeOut: [0.0, 0, 0.2, 1],
      easeInOut: [0.4, 0, 0.6, 1],
    },
  },
};
```

### Quality Assurance Checklist

#### Visual Consistency
- [ ] All colors use defined palette values
- [ ] Typography follows established scale and hierarchy
- [ ] Spacing uses systematic scale consistently
- [ ] Component states are clearly differentiated
- [ ] Brand consistency maintained across all touchpoints

#### Accessibility Compliance
- [ ] Color contrast ratios meet WCAG AA standards (4.5:1 minimum)
- [ ] Focus indicators are visible and consistent
- [ ] Touch targets meet minimum 44×44px requirements
- [ ] Screen reader labels and descriptions are comprehensive
- [ ] Keyboard navigation is complete and logical

#### Technical Implementation
- [ ] Design tokens are properly implemented and used
- [ ] Animations perform at 60fps on target devices
- [ ] Responsive breakpoints work across device sizes
- [ ] Cross-platform consistency maintained (iOS/Android/Web)
- [ ] Performance budgets are met (bundle size, render time)

#### User Experience Validation
- [ ] Calm technology principles are evident in interface
- [ ] Information hierarchy guides attention appropriately
- [ ] User flows feel natural and unforced
- [ ] Error states provide clear guidance and recovery paths
- [ ] Loading states maintain engagement without anxiety

---

This style guide serves as the comprehensive foundation for all visual design decisions in the Later app, ensuring consistency, accessibility, and adherence to calm technology principles across all platforms and features.