# Institutional Intelligence Dashboard - Design Guidelines

**Version 1.0 | January 2026**

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout & Grid](#layout--grid)
5. [Components](#components)
6. [Spacing & Sizing](#spacing--sizing)
7. [Visual Effects](#visual-effects)
8. [Iconography](#iconography)
9. [Interactive States](#interactive-states)
10. [Data Visualization](#data-visualization)
11. [Accessibility](#accessibility)
12. [Responsive Behavior](#responsive-behavior)

---

## Design Philosophy

### Core Principles

**Glass Morphism with Warmth**: The design employs a sophisticated glass morphism aesthetic layered over warm, earthy tones, creating a professional yet approachable interface.

**Information Hierarchy**: Clear visual hierarchy guides users through critical financial data with thermal gradient accents highlighting the most important metrics.

**Subtle Sophistication**: Understated elegance through refined shadows, gentle transitions, and careful use of blur effects rather than heavy visual elements.

**Enterprise Credibility**: Professional color palette and structured layouts convey trust and reliability for institutional financial management.

---

## Color System

### Primary Palette

```
Primary Blue: #1152d4
├─ Lighter variant: #0a3bb0 (for gradients)
├─ Use: Primary actions, active states, key data points
└─ Contrast ratio: Ensure 4.5:1 minimum against white
```

### Background Colors

```
Light Mode Background: #F0EEE9 (Cloud Dancer)
├─ Warmth: Slightly off-white with beige undertone
├─ Use: Body background, creates warm canvas
└─ Never use pure white (#FFFFFF) for backgrounds

Dark Mode Background: #101622
├─ Use: Future dark mode implementation
└─ Deep blue-black for contrast
```

### Neutrals

```
Walnut (Primary Text): #48403C
├─ Use: Headings, body text, primary content
├─ Opacity variants:
│   ├─ 100%: Primary text
│   ├─ 70%: Secondary text, inactive nav items
│   ├─ 60%: Tertiary text, subtitles
│   ├─ 50%: Placeholder text
│   ├─ 40%: Labels, metadata
│   ├─ 20%: Decorative elements
│   └─ 10%: Subtle borders, dividers
└─ Never use pure black (#000000)
```

### Accent Colors

```
Sunwashed Olive: #9CAF88
├─ Use: Success states, positive trends, organic accents
├─ Opacity variants:
│   ├─ 100%: Success indicators
│   └─ 10%: Success backgrounds
└─ Pairs well with walnut and primary blue

Scrollbar Gray: #D1CEC7
├─ Use: Scrollbar track, subtle dividers
└─ Hover: Darkens to walnut (#48403C)

Red (Error/Negative): Standard red-600
├─ Text: From Tailwind red-600
├─ Background: red-100
└─ Use: Negative trends, errors, warnings
```

### Glass Effect Colors

```
Glass Background: rgba(255, 255, 255, 0.45)
├─ 45% white opacity
├─ Must be paired with backdrop blur
└─ Use: Cards, panels, sidebar

Glass Border: rgba(255, 255, 255, 0.7)
├─ 70% white opacity
├─ Always 1px solid
└─ Creates definition on glass panels

Glass Active Background: rgba(255, 255, 255, 0.6)
├─ 60% white opacity
├─ Use: Hover states on glass panels
└─ Slightly more opaque than default

White Background (Nested): rgba(255, 255, 255, 0.3-0.4)
├─ Use: Icons backgrounds inside glass panels
└─ Creates depth within glass elements
```

### Thermal Gradient (Signature Element)

```
Thermal Gradient (Purple to Orange):
├─ Start: #8A2BE2 (Blue Violet)
├─ End: #FFA500 (Orange)
├─ Angle: 135deg
├─ Use: 
│   ├─ Large metrics display ($1.2M)
│   ├─ Chart line primary color
│   ├─ Data visualization highlights
│   └─ Never for buttons or backgrounds
└─ Implementation:
    ├─ Background: linear-gradient(135deg, #8A2BE2, #FFA500)
    ├─ -webkit-background-clip: text
    └─ -webkit-text-fill-color: transparent
```

### Color Usage Rules

1. **Never mix pure white backgrounds** with the Cloud Dancer (#F0EEE9) base
2. **Always use rgba() for glass effects**, never solid colors
3. **Thermal gradient is reserved** for hero metrics and data visualization only
4. **Maintain consistent opacity levels** across similar UI elements
5. **Primary blue is for actions only**, not decorative use
6. **Olive green indicates positive metrics only**, not neutral states

---

## Typography

### Font Family

```
Primary: 'Manrope', sans-serif
├─ Weights: 200, 300, 400, 500, 600, 700, 800
├─ Variable font for smooth weight transitions
├─ Source: Google Fonts
└─ Fallback: system sans-serif
```

### Type Scale

```
Hero Large (Display):
├─ Size: 48px / 3rem (lg), 36px / 2.25rem (base)
├─ Weight: 800 (Extrabold)
├─ Line Height: Tight (1.1)
├─ Letter Spacing: -0.025em (tighter tracking)
├─ Use: Page titles, "Welcome back, Acme Corp"
└─ Color: Walnut (#48403C)

Metric Display (Thermal):
├─ Size: 60px / 3.75rem (lg), 48px / 3rem (base)  
├─ Weight: 900 (Black)
├─ Line Height: None (1)
├─ Letter Spacing: -0.05em (very tight)
├─ Use: Hero metrics with thermal gradient
└─ Color: Thermal gradient

Large Metric:
├─ Size: 30px / 1.875rem
├─ Weight: 700 (Bold)
├─ Line Height: Tight (1.2)
├─ Letter Spacing: -0.025em
├─ Use: Stat card values ($2,450,000)
└─ Color: Walnut (#48403C)

Heading Large:
├─ Size: 24px / 1.5rem
├─ Weight: 700 (Bold)
├─ Line Height: Tight (1.25)
├─ Letter Spacing: -0.0125em
├─ Use: Section headings, "Intelligence Feed"
└─ Color: Walnut (#48403C)

Heading Medium:
├─ Size: 18px / 1.125rem
├─ Weight: 700 (Bold)
├─ Line Height: 1.4
├─ Use: Chart titles, panel headers
└─ Color: Walnut (#48403C)

Heading Small (Feed Items):
├─ Size: 16px / 1rem
├─ Weight: 700 (Bold)
├─ Line Height: Snug (1.375)
├─ Use: Feed item titles, card headings
└─ Color: Walnut (#48403C), transitions to Primary on hover

Body Large:
├─ Size: 18px / 1.125rem
├─ Weight: 700 (Bold)
├─ Line Height: 1.4
├─ Use: Status messages, important body text
└─ Color: Walnut (#48403C)

Body Base:
├─ Size: 14px / 0.875rem
├─ Weight: 500 (Medium)
├─ Line Height: Relaxed (1.625)
├─ Use: Descriptions, feed item body text
└─ Color: Walnut 60% opacity (#48403C with 0.6 alpha)

Label Large (Metadata):
├─ Size: 14px / 0.875rem
├─ Weight: 500 (Medium)
├─ Use: Stat card labels, chart subtitles
└─ Color: Walnut 60% opacity

Label Small (Metadata):
├─ Size: 12px / 0.75rem
├─ Weight: 500 (Medium)
├─ Letter Spacing: 0.05em (wide)
├─ Text Transform: Uppercase
├─ Use: Timestamps, secondary metadata
└─ Color: Walnut 40-60% opacity

Badge/Tag:
├─ Size: 10px / 0.625rem
├─ Weight: 700 (Bold)
├─ Letter Spacing: 0.1em (wider)
├─ Text Transform: Uppercase
├─ Use: Category tags, status badges
└─ Color: Walnut 60% opacity

Button Text:
├─ Size: 14px / 0.875rem
├─ Weight: 600-700 (Semibold to Bold)
├─ Use: All button labels
└─ Color: Depends on button type

Navigation Text:
├─ Size: 14px / 0.875rem
├─ Weight: 500 (Medium) inactive, 600 (Semibold) active
├─ Use: Sidebar navigation items
└─ Color: Walnut 70% inactive, Walnut 100% active

Micro Label:
├─ Size: 12px / 0.75rem
├─ Weight: 700 (Bold)
├─ Letter Spacing: 0.1em
├─ Text Transform: Uppercase
├─ Use: "ENTERPRISE", axis labels, small metadata
└─ Color: Walnut 60% opacity
```

### Typography Rules

1. **Never use font sizes smaller than 10px** (tags/badges minimum)
2. **Always reduce letter spacing on large display text** (hero, metrics)
3. **Increase letter spacing on uppercase labels** for readability
4. **Use font weight changes** to create hierarchy, not just size
5. **Pair tight line-height** (1.1-1.2) with bold weights for impact
6. **Use relaxed line-height** (1.6+) for body text readability
7. **Semibold (600) is the minimum** for interactive elements
8. **Extrabold (800) and Black (900)** reserved for hero text only

---

## Layout & Grid

### Overall Structure

```
Container Layout:
├─ Display: flex, flex-row
├─ Min Height: 100vh
├─ Width: 100%
└─ Components: Sidebar (fixed) + Main Content (flex-1)
```

### Sidebar Specifications

```
Desktop Sidebar (lg and up):
├─ Width: 256px / 16rem
├─ Position: sticky, top: 0
├─ Height: 100vh
├─ Padding: 24px / 1.5rem
├─ Glass panel: Full height, rounded-2xl (16px)
└─ Shrink: 0 (never collapses)

Mobile/Tablet Sidebar (below lg):
├─ Width: 80px / 5rem
├─ Position: sticky, top: 0  
├─ Height: 100vh
├─ Padding: 16px / 1rem
├─ Icons only, text hidden
└─ Glass panel: Full height, rounded-2xl
```

### Main Content Area

```
Container:
├─ Flex: 1
├─ Display: flex, flex-col
├─ Padding: 24px (lg), 16px (base)
├─ Padding-left: 0 on lg (sidebar handles spacing)
├─ Gap: 32px (lg), 24px (base)
├─ Overflow-y: auto
└─ Height: 100vh

Maximum Content Width:
├─ No fixed max-width
└─ Responsive to viewport
```

### Grid Systems

```
3-Column Stats Grid:
├─ Grid: grid-cols-1 (mobile), grid-cols-3 (md and up)
├─ Gap: 24px / 1.5rem
└─ Equal column widths

Dashboard Main Grid (2/3 + 1/3):
├─ Grid: grid-cols-1 (mobile), grid-cols-3 (lg and up)
├─ Gap: 32px (lg), 24px (base)
├─ Left Column: lg:col-span-2 (chart area)
├─ Right Column: lg:col-span-1 (feed)
└─ Maintains proportions at all breakpoints

2-Column Metrics Grid:
├─ Grid: grid-cols-2
├─ Gap: 24px / 1.5rem
└─ Use: Secondary metrics below chart
```

### Breakpoints (Tailwind defaults)

```
Mobile: < 640px (base styles)
├─ Stack all grids to single column
├─ Reduce padding to 16px
└─ Collapse sidebar to icons only

Tablet: 640px - 1024px (sm, md)
├─ Stats grid goes to 3 columns
├─ Main dashboard stays stacked
└─ Sidebar stays collapsed

Desktop: ≥ 1024px (lg, xl, 2xl)
├─ Full sidebar with text
├─ 2/3 + 1/3 dashboard layout
└─ All grids at full width
```

### Layout Rules

1. **Never set max-width on main content** – let it be fluid
2. **Sidebar is always sticky**, never scrolls independently
3. **Main content scrolls** with sidebar remaining visible
4. **Maintain consistent gaps** across all grid systems (24px/32px)
5. **Never overlap glass panels** – always use gap spacing
6. **Preserve aspect ratios** on charts when resizing

---

## Components

### Buttons

#### Primary Button (Liquid Metal)

```css
Style:
├─ Background: linear-gradient(145deg, #1152d4, #0a3bb0)
├─ Border: 1px solid rgba(255,255,255,0.2)
├─ Padding: 10px 24px (py-2.5 px-6)
├─ Border Radius: 8px (rounded-lg)
├─ Font: 14px, 600-700 weight, white
├─ Shadow: inset 0 2px 0 rgba(255,255,255,0.2),
│          0 5px 15px rgba(17, 82, 212, 0.25)
├─ Icon: Material Symbols, 18px, white, 8px gap
└─ Shine Effect: Horizontal sweep on hover

Hover State:
├─ Shadow: Increased to 0 5px 20px
├─ Shine animation: left sweep
└─ Cursor: pointer

Active State:
├─ Transform: scale(0.95)
└─ Transition: 150ms

Use Cases:
└─ Primary actions: "Execute Transfer", "Submit", "Confirm"
```

#### Secondary Button (Glass)

```css
Style:
├─ Background: rgba(255, 255, 255, 0.45)
├─ Backdrop Filter: blur(20px)
├─ Border: 1px solid rgba(255, 255, 255, 0.7)
├─ Padding: 10px 16px (py-2.5 px-4)
├─ Border Radius: 8px (rounded-lg)
├─ Font: 14px, 600 weight, walnut
├─ Shadow: glass shadow
├─ Icon: Material Symbols, 18px, walnut, 8px gap
└─ No gradient

Hover State:
├─ Background: rgba(255, 255, 255, 0.6)
├─ Transform: none
└─ Transition: all 300ms

Use Cases:
└─ Secondary actions: "Export Data", "Cancel", "Back"
```

#### Text Button

```css
Style:
├─ Background: None
├─ Font: 14px, 600 weight, primary blue (#1152d4)
├─ Padding: 0
├─ Underline: On hover only
└─ No border, no shadow

Use Cases:
└─ Tertiary actions: "View All", inline links
```

### Cards

#### Glass Panel (Base)

```css
Class: glass-panel
├─ Background: rgba(255, 255, 255, 0.45)
├─ Backdrop Filter: blur(20px)
├─ Border: 1px solid rgba(255, 255, 255, 0.7)
├─ Border Radius: 16px (rounded-2xl) for large panels
│                 12px (rounded-xl) for medium cards
├─ Padding: Varies by content
│   ├─ Large panels: 32px (p-8)
│   ├─ Medium cards: 24px (p-6)
│   └─ Small cards: 20px (p-5)
└─ Shadow: 0 10px 40px -10px rgba(72, 64, 60, 0.05)

Hover State (Interactive):
├─ Background: rgba(255, 255, 255, 0.5-0.6)
├─ Transform: translateY(-4px) (lift effect)
├─ Transition: all 300ms
└─ Cursor: pointer (if clickable)
```

#### Stat Card

```css
Structure:
├─ Base: Glass panel, padding 24px, rounded-xl
├─ Top Row: Icon + Trend Badge (flex, justify-between)
│   ├─ Icon Container:
│   │   ├─ Size: 40px × 40px
│   │   ├─ Background: rgba(255, 255, 255, 0.4)
│   │   ├─ Border Radius: 8px
│   │   ├─ Icon: Material Symbols, 24px, walnut
│   │   └─ Hover: scale(1.1), transition 300ms
│   └─ Trend Badge:
│       ├─ Padding: 4px 8px
│       ├─ Border Radius: 9999px (full)
│       ├─ Font: 12px, 700 weight
│       ├─ Icon: 14px Material Symbol
│       ├─ Gap: 4px
│       └─ Colors:
│           ├─ Positive: bg-olive/10, text-olive
│           └─ Negative: bg-red-100, text-red-600
├─ Label: 14px, 500 weight, walnut 60%, margin-bottom 4px
├─ Value: 30px, 700 weight, walnut, tight tracking
└─ Spacing: 16px gap between rows

Hover Effect:
└─ Background: rgba(255, 255, 255, 0.5)
```

#### Feed Item Card

```css
Structure:
├─ Base: Glass panel, padding 20px, rounded-xl
├─ Left Border Accent:
│   ├─ Position: absolute, left 0, top 0
│   ├─ Width: 4px (w-1)
│   ├─ Height: 100%
│   ├─ Default: Category color at 30% opacity
│   └─ Hover: Category color at 100% opacity
├─ Header Row: Category + Timestamp (flex, justify-between)
│   ├─ Category Badge:
│   │   ├─ Padding: 2px 8px
│   │   ├─ Border: 1px walnut/10
│   │   ├─ Background: rgba(255,255,255,0.3)
│   │   ├─ Font: 10px, 700 weight, uppercase, wide tracking
│   │   └─ Color: walnut 60%
│   └─ Timestamp: 12px, walnut 40%
├─ Title: 16px, 700 weight, walnut, line-height snug
│   └─ Hover: Changes to category color
├─ Description: 14px, 500 weight, walnut 60%, relaxed line-height
│   └─ Line clamp: 2 lines maximum
└─ Spacing: 8px between elements

Hover Effect:
├─ Background: rgba(255, 255, 255, 0.6)
├─ Transform: translateY(-4px)
├─ Transition: all 300ms
├─ Border Accent: Full color
├─ Title: Category color
└─ Cursor: pointer

Category Colors:
├─ Macro: #1152d4 (primary)
├─ Market: #9CAF88 (olive)
├─ Internal: #48403C with 40% opacity
└─ Custom: Define as needed
```

#### Metric Status Card

```css
Structure:
├─ Base: Glass panel, padding 20px, rounded-xl
├─ Layout: flex, items-center, gap 16px
├─ Icon Container:
│   ├─ Size: 48px × 48px
│   ├─ Border Radius: 9999px (full circle)
│   ├─ Background: Status color at 10% opacity
│   ├─ Icon: Material Symbol, status color
│   └─ Shrink: 0
├─ Text Content:
│   ├─ Label: 12px, 700 weight, uppercase, wide tracking, walnut 50%
│   └─ Value: 18px, 700 weight, walnut
└─ No hover effect (informational only)

Status Colors:
├─ Success: Olive (#9CAF88)
├─ Warning: Primary (#1152d4)
└─ Error: Red
```

### Navigation

#### Sidebar Navigation Item

```css
Default State:
├─ Layout: flex, items-center, gap 12px
├─ Padding: 12px (p-3)
├─ Border Radius: 8px (rounded-lg)
├─ Icon: Material Symbol, 24px, walnut 70%
├─ Text: 14px, 500 weight, walnut 70%
│   └─ Display: hidden on mobile/tablet, block on lg+
└─ Transition: all 200ms

Hover State:
├─ Background: rgba(255, 255, 255, 0.4)
├─ Icon Color: walnut 100%
├─ Text Color: walnut 100%
└─ Cursor: pointer

Active State:
├─ Background: rgba(255, 255, 255, 0.6)
├─ Border: 1px solid rgba(255, 255, 255, 0.4)
├─ Shadow: 0 1px 3px rgba(0,0,0,0.1)
├─ Icon Color: primary (#1152d4)
├─ Text: 14px, 600 weight, walnut 100%
└─ Distinguishing marker: Blue icon + slightly bolder text

Mobile Behavior (< lg):
└─ Show icon only, center-aligned
```

### Form Elements

**Note**: No form inputs visible in reference design. Follow these principles when needed:

```css
Text Input (Suggested):
├─ Base: Glass panel effect
├─ Border: 1px rgba(255,255,255,0.7)
├─ Padding: 12px 16px
├─ Border Radius: 8px
├─ Font: 14px, 500 weight, walnut
├─ Placeholder: walnut 40%
├─ Focus: Border changes to primary, shadow ring
└─ Background: rgba(255,255,255,0.6)
```

---

## Spacing & Sizing

### Spacing Scale (Tailwind)

```
Micro (2px):     0.5    → Tight icon gaps, fine adjustments
Tiny (4px):      1      → Badge padding, minimal spacing
Small (8px):     2      → Component internal spacing
Base (12px):     3      → Default component padding
Medium (16px):   4      → Card internal spacing, gaps
Large (20px):    5      → Card padding (small)
XL (24px):       6      → Card padding (medium), grid gaps
2XL (32px):      8      → Card padding (large), section gaps
3XL (48px):      12     → Major section spacing
4XL (64px):      16     → Page-level spacing
```

### Component-Specific Spacing

```
Sidebar:
├─ Outer Padding: 24px (lg), 16px (base)
├─ Inner Panel Padding: 24px (lg), 16px (base)
├─ Navigation Gap: 8px between items
└─ Section Gap: 24px between nav groups

Main Content:
├─ Top/Bottom/Right Padding: 24px (lg), 16px (base)
├─ Left Padding: 0 (lg, sidebar handles it), 16px (base)
├─ Section Gap: 32px (lg), 24px (base)
└─ Grid Gaps: 24px standard, 32px for major grids

Cards:
├─ Large Panel: 32px padding
├─ Medium Card: 24px padding
├─ Small Card: 20px padding
├─ Internal Spacing: 8-16px between elements
└─ Icon-Text Gap: 12px standard

Buttons:
├─ Padding Y: 10px (py-2.5)
├─ Padding X: 16-24px (px-4 to px-6)
├─ Icon Gap: 8px
└─ Min Width: None (fluid)
```

### Sizing Standards

```
Icons:
├─ Navigation: 24px
├─ Buttons: 18px
├─ Stat Cards: 24px
├─ Status Icons: 20-24px
└─ Feed Tags: 14px (micro)

Avatar/Logo:
└─ Sidebar Logo: 40px × 40px

Icon Containers:
├─ Stat Cards: 40px × 40px
├─ Status Cards: 48px × 48px
└─ Padding: 8px internal

Chart:
├─ Min Height: 300px
├─ Flex: 1 (grows to fill)
└─ Aspect Ratio: Free-form (not fixed)
```

---

## Visual Effects

### Shadows

```css
Glass Shadow (Default):
box-shadow: 0 10px 40px -10px rgba(72, 64, 60, 0.05);
├─ Use: All glass panels
├─ Soft, diffused, barely visible
└─ Color: Walnut at 5% opacity

Metal Shadow (Buttons):
box-shadow: inset 0 2px 0 rgba(255,255,255,0.2),
            0 5px 15px rgba(17, 82, 212, 0.25);
├─ Use: Primary liquid metal buttons
├─ Two-part: Inset highlight + outer glow
└─ Outer glow uses primary color

Elevated Shadow (Hover):
box-shadow: 0 5px 20px rgba(17, 82, 212, 0.3);
├─ Use: Button hover states
└─ Increased spread and intensity

Card Shadow (Active):
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
├─ Use: Active navigation item
└─ Subtle depth indicator
```

### Blur Effects

```css
Glass Blur:
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
├─ Use: All glass panels
├─ Amount: 20px standard
└─ Always pair with semi-transparent background

Chart Glow Blur:
filter: url(#glow);
├─ Use: SVG chart line
├─ Gaussian Blur: stdDeviation="4"
└─ Creates thermal glow effect on data line
```

### Gradients

```css
Thermal Gradient (Purple → Orange):
background: linear-gradient(135deg, #8A2BE2, #FFA500);
├─ Angle: 135deg (diagonal)
├─ Use: Text gradient for hero metrics
└─ Applied via background-clip technique

Thermal Fill Gradient (Chart):
<linearGradient id="thermalFill" x1="0%" y1="0%" x2="0%" y2="100%">
  <stop offset="0%" stop-color="#8A2BE2" stop-opacity="0.2"/>
  <stop offset="100%" stop-color="#FFA500" stop-opacity="0"/>
</linearGradient>
├─ Direction: Vertical (top to bottom)
├─ Use: Chart area fill under line
└─ Fades from purple to transparent orange

Thermal Line Gradient (Chart):
<linearGradient id="thermalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="#8A2BE2"/>
  <stop offset="100%" stop-color="#FFA500"/>
</linearGradient>
├─ Direction: Horizontal (left to right)
├─ Use: Chart stroke line
└─ Full opacity across spectrum

Button Gradient (Liquid Metal):
background: linear-gradient(145deg, #1152d4, #0a3bb0);
├─ Angle: 145deg
├─ Two blues: Primary to darker variant
└─ Creates dimensional effect
```

### Animations & Transitions

```css
Default Transition:
transition: all 300ms ease;
├─ Properties: all (background, transform, colors)
├─ Duration: 300ms standard
├─ Easing: ease (or ease-in-out)
└─ Use: Most hover effects

Quick Transition:
transition: all 200ms ease;
├─ Duration: 200ms
├─ Use: Navigation items, quick interactions
└─ Easing: ease

Button Active:
transition: transform 150ms ease;
├─ Duration: 150ms
├─ Property: transform only
└─ Use: Active/click state

Liquid Shine Animation:
.btn-liquid::after {
  transition: 0.5s;
  left: -100% → 100%;
}
├─ Duration: 500ms
├─ Trigger: Hover
├─ Effect: Horizontal light sweep
└─ Pseudo-element with white gradient

Bounce Animation (Icon):
animation: bounce;
├─ Use: "Expand more" icon in feed
├─ Tailwind class: animate-bounce
└─ Indicates scrollable content
```

### Opacity Usage

```
Text Opacity Levels:
├─ 100%: Primary text, headings
├─ 70%:  Secondary text, inactive nav
├─ 60%:  Tertiary text, labels
├─ 50%:  Subtle labels
├─ 40%:  Metadata, timestamps
└─ 20%:  Decorative elements

Background Opacity Levels:
├─ 90%:  Tooltip backgrounds
├─ 60%:  Active glass panels
├─ 45%:  Default glass panels
├─ 40%:  Nested white backgrounds
├─ 30%:  Tag backgrounds
├─ 10%:  Success/status backgrounds
└─ 5%:   Grid lines, subtle dividers

Border Opacity:
├─ 70%: Glass panel borders
├─ 40%: Active state borders
├─ 10%: Subtle dividers
└─ 5%:  Grid lines
```

---

## Iconography

### Icon System

```
Library: Material Symbols Outlined
├─ CDN: Google Fonts
├─ Weight Range: 100-700
├─ Fill: 0-1 (outlined style, fill=0)
└─ Optical Size: Default

Icon Classes:
<span class="material-symbols-outlined">icon_name</span>
```

### Icon Sizes

```
Navigation Icons:      24px (text-2xl)
Button Icons:          18px (text-lg)
Stat Card Icons:       24px (text-2xl)
Status Icons:          20-24px
Trend Badge Icons:     14px (text-sm)
Feed Tag Icons:        12px (smaller icons)
Micro Icons:           16px (text-base)
```

### Icon Inventory (From Design)

```
Navigation:
├─ grid_view          → Dashboard (active state)
├─ payments           → Cash Flow
├─ monitoring         → Intelligence
├─ description        → Reports
└─ settings           → Settings

Actions:
├─ download           → Export Data
├─ bolt               → Execute Transfer
├─ expand_more        → Scroll indicator

Stats & Metrics:
├─ account_balance_wallet  → Liquidity
├─ local_fire_department   → Burn rate
├─ credit_card             → Credit utilization
├─ check_circle            → System status (success)
├─ pending                 → Pending approvals

Trends:
├─ trending_up        → Positive trend
├─ trending_down      → Negative trend

UI:
└─ schedule           → Time/date indicator
```

### Icon Color Rules

```
Default State:
├─ Navigation (inactive): walnut 70%
├─ Navigation (active): primary (#1152d4)
├─ Buttons: Inherits button text color
├─ Stat Cards: walnut
└─ Status: Status color (olive, primary, red)

Hover State:
├─ Navigation: walnut 100%
├─ Feed Items: Category color
└─ Cards: No color change (transform only)

Sizing Rules:
├─ Always use even pixel sizes (16, 18, 20, 24)
├─ Maintain optical balance with surrounding text
├─ Add 8-12px gap between icon and text
└─ Never use fill=1 (always outlined)
```

---

## Interactive States

### Hover States

```
Cards (Interactive):
├─ Background: Increase opacity by 10-15%
├─ Transform: translateY(-4px)
├─ Transition: all 300ms
├─ Cursor: pointer
└─ Optional: Text color change (feed items)

Buttons (Primary):
├─ Shadow: Increase intensity
├─ Shine: Trigger horizontal sweep
├─ Transform: None
└─ Cursor: pointer

Buttons (Secondary):
├─ Background: Increase opacity to 60%
├─ Transform: None
├─ Transition: all 300ms
└─ Cursor: pointer

Navigation:
├─ Background: rgba(255,255,255,0.4)
├─ Icon Color: walnut 100%
├─ Text Color: walnut 100%
└─ Transition: all 200ms

Links:
├─ Text Decoration: underline
├─ Color: primary (already applied)
└─ Cursor: pointer

Icons (in containers):
├─ Transform: scale(1.1)
├─ Transition: transform 300ms
└─ Parent card hover triggers this
```

### Active States

```
Buttons:
├─ Transform: scale(0.95)
├─ Transition: transform 150ms
├─ Duration: Brief (click feedback)
└─ Returns to normal immediately

Navigation (Selected):
├─ Background: rgba(255,255,255,0.6)
├─ Border: 1px rgba(255,255,255,0.4)
├─ Shadow: 0 1px 3px rgba(0,0,0,0.1)
├─ Icon Color: primary (#1152d4)
├─ Text Weight: 600 (semibold)
└─ Persistent until navigation changes
```

### Focus States

```
Keyboard Focus (Accessibility):
├─ Outline: 2px solid primary
├─ Outline Offset: 2px
├─ Border Radius: Matches element
└─ Visible on tab navigation only

Focus-Visible (Recommended):
├─ Use :focus-visible for modern browsers
├─ Removes outline on mouse clicks
└─ Shows outline on keyboard navigation
```

### Disabled States

```
Buttons:
├─ Opacity: 0.5
├─ Cursor: not-allowed
├─ No hover effects
└─ Maintained visual structure

Cards/Links:
├─ Opacity: 0.6
├─ Cursor: not-allowed
└─ Remove hover transforms
```

### Loading States

```
Buttons:
├─ Show spinner icon replacing text icon
├─ Text: "Loading..." or keep original
├─ Cursor: wait or progress
└─ Disabled interaction

Cards:
├─ Overlay: rgba(255,255,255,0.8)
├─ Spinner: Centered, primary color
└─ Blur content slightly (optional)
```

---

## Data Visualization

### Chart Specifications

#### Line Chart (Cash Velocity)

```
Container:
├─ Min Height: 300px
├─ Flex: 1 (grows to fill)
├─ Aspect Ratio: Flexible (responsive)
└─ SVG: preserveAspectRatio="none", viewBox="0 0 800 300"

Grid Lines:
├─ Color: rgba(72, 64, 60, 0.05)
├─ Stroke Width: 1px
├─ Spacing: 3-4 horizontal lines
├─ Y-axis only (no vertical lines)
└─ Very subtle, barely visible

Area Fill:
├─ Gradient: url(#thermalFill)
├─ Direction: Top to bottom
├─ Start: Purple 20% opacity
├─ End: Orange 0% opacity
└─ Fill underneath line path

Main Line:
├─ Stroke: url(#thermalGradient)
├─ Stroke Width: 4px
├─ Stroke Linecap: round
├─ Fill: none
├─ Filter: url(#glow) - Gaussian blur stdDeviation="4"
└─ Smooth curves (Bezier curves in path)

Data Points:
├─ Circle: 6px radius
├─ Fill: #F0EEE9 (background color)
├─ Stroke: #8A2BE2 (purple from gradient)
├─ Stroke Width: 3px
└─ Show on hover or for current/highlighted point

Axis Labels:
├─ X-axis: Bottom, centered under grid
├─ Font: 12px, 700 weight, uppercase, wide tracking
├─ Color: walnut 40%
├─ Labels: Month abbreviations (May, Jun, Jul...)
├─ Y-axis: Not shown (values inferred from tooltip/context)
└─ Spacing: Flex justify-between
```

#### Tooltip

```
Structure:
├─ Position: absolute, near data point
├─ Transform: -translate-x-1/2, -translate-y-full
├─ Offset: Bottom margin 8px from point
├─ Background: rgba(255,255,255,0.9)
├─ Backdrop Filter: blur(16px)
├─ Border: 1px rgba(255,255,255,0.5)
├─ Border Radius: 8px
├─ Padding: 12px
├─ Shadow: glass shadow
└─ Pointer Events: none

Content:
├─ Date Label: 12px, 700 weight, walnut, margin-bottom 2px
├─ Value: 14px, 700 weight, primary color
├─ Format: "$420k Spend" (abbreviated with context)
└─ Alignment: Left

Behavior:
├─ Trigger: Hover over data point
├─ Show: Fade in 200ms
├─ Hide: Fade out 200ms
└─ Follow cursor or snap to nearest point
```

### Trend Indicators

```
Badge Structure:
├─ Container: inline-flex, items-center, gap 4px
├─ Padding: 4px 8px (py-1 px-2)
├─ Border Radius: 9999px (full pill)
├─ Font: 12px, 700 weight
└─ Icon: 14px Material Symbol

Positive Trend:
├─ Background: rgba(156, 175, 136, 0.1) - olive 10%
├─ Text Color: #9CAF88 (olive)
├─ Icon: trending_up
└─ Format: "+12.5%" (include + sign)

Negative Trend:
├─ Background: rgba(239, 68, 68, 0.1) - red 10%
├─ Text Color: #EF4444 (red-600)
├─ Icon: trending_down
└─ Format: "-1.5%" (include - sign)

Placement:
└─ Top-right corner of stat cards
```

### Metric Display Formats

```
Currency (Large):
├─ Format: $2,450,000
├─ Comma separators: Yes
├─ Decimals: None for whole numbers
└─ Never abbreviate in stat cards

Currency (Hero):
├─ Format: $1.2M
├─ Abbreviated: Yes (M for millions, K for thousands)
├─ Decimals: One decimal place
└─ Thermal gradient styling

Currency (Small):
├─ Format: $420k
├─ Abbreviated: Yes
└─ Lowercase k/m suffix

Rate/Frequency:
├─ Format: $45,200/mo
├─ Size: Large number + smaller suffix
├─ Suffix: "/mo", "/yr", etc.
└─ Suffix styling: Smaller size, walnut 40%

Percentage:
├─ Format: 15.4%
├─ Decimals: One decimal place
└─ No space before %

Trend Percentage:
├─ Format: +12.5% or -1.5%
├─ Sign: Always show (+ or -)
├─ Decimals: One decimal place
└─ Color-coded (green/red)
```

---

## Accessibility

### Color Contrast

```
Required Ratios (WCAG AA):
├─ Normal Text (< 18px): 4.5:1 minimum
├─ Large Text (≥ 18px): 3:1 minimum
├─ UI Components: 3:1 minimum
└─ Graphical Objects: 3:1 minimum

Tested Combinations:
├─ Walnut on Cloud Dancer: ✓ Pass (high contrast)
├─ Walnut 60% on Cloud Dancer: ✓ Pass
├─ Walnut 40% on Cloud Dancer: Use for large text only
├─ Primary Blue on White: ✓ Pass
└─ White on Primary Blue: ✓ Pass

Avoid:
├─ Walnut 20% for text (decorative only)
└─ Relying solely on color for information
```

### Keyboard Navigation

```
Tab Order:
├─ Logical: Top to bottom, left to right
├─ Skip to main content: Provide skip link
├─ Sidebar navigation → Header actions → Main content
└─ Interactive elements only (buttons, links, inputs)

Focus Indicators:
├─ Visible on keyboard focus
├─ 2px outline, primary color
├─ 2px offset from element
└─ Use :focus-visible to avoid mouse focus rings

Keyboard Shortcuts:
├─ Enter/Space: Activate buttons and links
├─ Tab: Forward navigation
├─ Shift+Tab: Backward navigation
└─ Arrow keys: Navigate within components (if applicable)
```

### Screen Readers

```
Semantic HTML:
├─ <header>, <main>, <aside>, <nav>
├─ Proper heading hierarchy (h1 → h2 → h3)
├─ <button> for clickable actions
└─ <a> for navigation links

ARIA Labels:
├─ aria-label: For icon-only buttons
├─ aria-labelledby: Link labels to headings
├─ aria-describedby: Additional context
└─ role: Use semantic HTML instead when possible

Alt Text:
├─ Logo: "Acme Institution logo"
├─ Icons: Descriptive text or aria-label
└─ Decorative: Empty alt="" or aria-hidden="true"

Live Regions:
├─ aria-live="polite": For status updates
├─ aria-live="assertive": For critical alerts
└─ Update notifications without page reload
```

### Motion & Animation

```
Respect Prefers-Reduced-Motion:
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
├─ Disable animations for users who request it
├─ Keep essential transitions (focus indicators)
└─ Provide alternative feedback mechanisms
```

### Touch Targets

```
Minimum Size:
├─ Buttons: 44px × 44px minimum
├─ Links: 44px × 44px minimum (with padding)
├─ Icons: 24px icon + 10px padding = 44px target
└─ Spacing: 8px minimum between targets

Current Implementation:
├─ Navigation items: 48px height (12px padding × 2 + 24px icon)
├─ Buttons: ~44px height (10px padding × 2 + 24px content)
└─ Cards: Large touch area (entire card clickable)
```

---

## Responsive Behavior

### Breakpoint Strategy

```
Mobile First Approach:
├─ Base styles: < 640px
├─ Add complexity at larger breakpoints
└─ Never hide critical content

Breakpoint Progression:
Mobile (default):  < 640px
├─ Single column layouts
├─ Icon-only sidebar
├─ Stacked stats
└─ Full-width cards

Tablet (sm, md):   640px - 1024px
├─ Expand stats to 3-column grid
├─ Sidebar still icon-only
├─ Dashboard still stacked
└─ Maintain vertical scrolling

Desktop (lg+):     ≥ 1024px
├─ Full sidebar with text
├─ 2/3 + 1/3 dashboard split
├─ All features visible
└─ Optimal layout
```

### Component Responsive Rules

#### Sidebar

```
Mobile/Tablet (< lg):
├─ Width: 80px
├─ Padding: 16px
├─ Logo text: hidden
├─ Nav text: hidden (icons only)
├─ Center-align all content
└─ Maintain sticky position

Desktop (lg+):
├─ Width: 256px
├─ Padding: 24px
├─ Logo text: visible
├─ Nav text: visible
├─ Left-align content
└─ Maintain sticky position
```

#### Header

```
Mobile:
├─ Flex-wrap: wrap
├─ Title: Full width, 36px font
├─ Buttons: Stack or side-by-side
└─ Reduce padding

Desktop:
├─ Flex-wrap: nowrap (unless overflow)
├─ Title: 48px font
├─ Buttons: Side-by-side, right-aligned
└─ Full padding
```

#### Stat Cards Grid

```
Mobile:
├─ Grid: single column
├─ Stack vertically
└─ Full width cards

Tablet+ (md):
├─ Grid: 3 columns
├─ Equal width distribution
└─ Maintain consistent gaps
```

#### Dashboard Grid

```
Mobile/Tablet (< lg):
├─ Grid: single column
├─ Chart section: Full width
├─ Feed section: Full width below chart
└─ Stack vertically

Desktop (lg+):
├─ Grid: 3 columns
├─ Chart section: col-span-2
├─ Feed section: col-span-1
└─ Side-by-side layout
```

#### Chart

```
All Breakpoints:
├─ Width: 100% of container
├─ Height: Min 300px, flex-grows
├─ Responsive SVG (viewBox scales)
└─ Maintain aspect ratio flexibility

Adjustments:
├─ Mobile: Reduce x-axis labels (fewer months)
├─ Desktop: Show all labels
└─ Tooltip: Always positioned relative to point
```

#### Feed Items

```
All Breakpoints:
├─ Full width of container
├─ No grid, vertical stack
└─ Consistent padding

Content Adjustments:
├─ Mobile: Line-clamp 2 for descriptions
├─ Desktop: Line-clamp 2 (same)
└─ Truncate long titles gracefully
```

### Typography Responsive

```
Scale Font Sizes:
├─ Hero: 36px → 48px (base → lg)
├─ Thermal Metric: 48px → 60px
├─ Other text: Generally consistent
└─ Use Tailwind responsive classes (text-3xl lg:text-4xl)

Line Height:
├─ Tighter on mobile for space efficiency
└─ Slightly more relaxed on desktop

Letter Spacing:
└─ Consistent across breakpoints
```

### Spacing Responsive

```
Container Padding:
├─ Mobile: 16px
├─ Desktop: 24px
└─ Sidebar left padding: 0 on lg (handled by sidebar)

Grid Gaps:
├─ Mobile: 24px
├─ Desktop: 32px (on major grids)
└─ Cards: 24px consistent

Component Padding:
├─ Large panels: 32px desktop, 24px mobile
├─ Cards: 24px desktop, 20px mobile
└─ Scale proportionally
```

### Images & Icons

```
Icons:
├─ Same size across breakpoints
├─ 24px navigation, 18px buttons
└─ No scaling needed

Logo:
├─ 40px × 40px on all breakpoints
└─ Consistent size for brand recognition

Chart SVG:
├─ Scales fluidly with container
└─ Maintains viewBox proportions
```

---

## Implementation Notes

### CSS Architecture

```
Recommended Structure:
1. Use Tailwind CSS for utility-first approach
2. Custom classes for glass morphism effects
3. CSS variables for theme colors (optional)
4. Minimal custom CSS (focus on utilities)

Custom CSS Requirements:
├─ .glass-panel (base glass effect)
├─ .thermal-text (gradient text)
├─ .btn-liquid (metal button + shine animation)
└─ Scrollbar styling
```

### Performance

```
Optimizations:
├─ Use will-change for animated elements
├─ Backdrop-filter: Limit to essential panels
├─ GPU acceleration: Transform instead of position
├─ Lazy load feed items if list grows long
└─ Optimize SVG chart (remove unnecessary nodes)

Will-Change:
├─ Hover transforms: will-change: transform
├─ Backdrop-filter: will-change: backdrop-filter
└─ Remove after animation completes
```

### Browser Support

```
Modern Browsers:
├─ Chrome/Edge: Full support
├─ Firefox: Full support
├─ Safari: Full support (with -webkit-backdrop-filter)
└─ Mobile browsers: iOS Safari 14+, Chrome Android

Fallbacks:
├─ Backdrop-filter: Solid background fallback
├─ Gradients: Single color fallback
└─ Custom properties: Direct values fallback

Critical:
├─ Always include -webkit-backdrop-filter
├─ Test glass effects on Safari
└─ Provide high-contrast mode alternative
```

### Dark Mode Preparation

```
Variables Defined:
├─ background-dark: #101622
├─ Ready for future implementation
└─ Would require color inversions

Considerations:
├─ Glass panels: Darker with different opacity
├─ Text: Lighter shades of walnut or white
├─ Borders: Lighter, more visible
├─ Shadows: Lighter shadows or glows
└─ Thermal gradient: Same (already vibrant)
```

---

## Usage Examples

### Creating a New Stat Card

```html
<div class="glass-panel p-6 rounded-xl hover:bg-white/50 transition-colors group">
  <div class="flex justify-between items-start mb-4">
    <div class="p-2 bg-white/40 rounded-lg text-walnut group-hover:scale-110 transition-transform">
      <span class="material-symbols-outlined block">icon_name</span>
    </div>
    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-olive/10 text-olive text-xs font-bold">
      <span class="material-symbols-outlined text-sm">trending_up</span>
      +X.X%
    </span>
  </div>
  <p class="text-walnut/60 text-sm font-medium mb-1">Metric Label</p>
  <p class="text-walnut text-3xl font-bold tracking-tight">$X,XXX,XXX</p>
</div>
```

### Creating a Feed Item

```html
<div class="glass-panel p-5 rounded-xl hover:-translate-y-1 hover:bg-white/60 transition-all duration-300 cursor-pointer relative overflow-hidden group">
  <div class="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
  <div class="flex justify-between items-start mb-2">
    <span class="px-2 py-0.5 rounded border border-walnut/10 bg-white/30 text-[10px] font-bold uppercase tracking-wider text-walnut/60">
      CATEGORY
    </span>
    <span class="text-walnut/40 text-xs">Xh ago</span>
  </div>
  <h3 class="text-walnut font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors">
    Item Title Here
  </h3>
  <p class="text-walnut/60 text-sm leading-relaxed line-clamp-2">
    Description text that provides context and detail about the feed item.
  </p>
</div>
```

### Creating a Button

```html
<!-- Primary Button -->
<button class="btn-liquid px-6 py-2.5 rounded-lg text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2">
  <span class="material-symbols-outlined text-lg">icon_name</span>
  Button Text
</button>

<!-- Secondary Button -->
<button class="glass-panel px-4 py-2.5 rounded-lg text-sm font-semibold text-walnut hover:bg-white/60 transition-all flex items-center gap-2">
  <span class="material-symbols-outlined text-lg">icon_name</span>
  Button Text
</button>
```

---

## Quick Reference

### Color Quick Pick

```
Primary Action:     #1152d4
Success/Positive:   #9CAF88
Error/Negative:     red-600 (Tailwind)
Primary Text:       #48403C
Secondary Text:     #48403C at 60%
Background:         #F0EEE9
Glass Panel:        rgba(255,255,255,0.45)
Glass Border:       rgba(255,255,255,0.7)
```

### Font Size Quick Pick

```
Hero:        text-4xl (36px) → lg:text-5xl (48px)
Metric:      text-5xl (48px) → lg:text-6xl (60px)
Large Value: text-3xl (30px)
Heading:     text-xl (20px) → text-2xl (24px)
Body:        text-sm (14px)
Label:       text-xs (12px)
Micro:       text-[10px]
```

### Spacing Quick Pick

```
Card Padding Large:  p-8 (32px)
Card Padding Medium: p-6 (24px)
Card Padding Small:  p-5 (20px)
Section Gap:         gap-8 (32px)
Grid Gap:            gap-6 (24px)
Element Gap:         gap-4 (16px)
Icon Gap:            gap-3 (12px)
```

### Border Radius Quick Pick

```
Sidebar Panel:  rounded-2xl (16px)
Large Card:     rounded-2xl (16px)
Medium Card:    rounded-xl (12px)
Button:         rounded-lg (8px)
Icon Container: rounded-lg (8px)
Badge/Pill:     rounded-full (9999px)
```

---

## Version History

**v1.0** - January 2026
- Initial design guidelines created
- Based on Institutional Intelligence Dashboard reference
- Covers all major components and patterns

---

## Questions or Additions?

For any ambiguities or new components not covered in this guide, refer back to the core principles:

1. **Glass morphism** with warm, earthy tones
2. **Thermal gradient** for hero elements only
3. **Subtle interactions** with gentle transitions
4. **Professional, trustworthy** aesthetic
5. **Accessibility first** in all implementations

When in doubt, simplify and maintain consistency with existing patterns.
