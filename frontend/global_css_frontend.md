# SkySure Global CSS Design System & Style Guide

This document establishes the **mandatory visual and functional template** for the SkySure Parametric Platform. All future updates, whether by human developers or AI agents, must strictly adhere to these protocols to ensure pristine uniformity and an industry-grade professional aesthetic.

---

## 🎨 Global Color Palette (Resilience Blue)
Strictly avoid using Red or generic browser colors. The platform uses a high-contrast Obsidian and Blue theme.

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **`--primary`** | `#1848B5` | Brand Core, Active States, Key Logos |
| **`--primary-light`** | `#416DD1` | Hover States, Secondary Buttons, Gradients |
| **`--primary-deep`** | `#0F348E` | Background Infills, Deep Typography |
| **`--accent`** | `#00E0FF` | Interactive highlights, Pulsing Signals, Cyan Accents |
| **`--bg`** | `#FFFFFF` | Primary Content Background |
| **`--bg-subtle`** | `#F8FAFC` | Section Dividers, Off-White Tonal Surfaces |
| **`--bg-deep`** | `#0F172A` | Obsidian Dark Backgrounds for Data Sections |
| **`--text-main`** | `#0F172A` | Primary Body and Heading Text |
| **`--text-muted`** | `#64748B` | Subtitles, Secondary Metadata |
| **`--border`** | `#E2E8F0` | Default Component Strokes |

---

## ✍️ Typography Infrastructure
Use these font-family and scale presets for consistency.

- **Display (Headings)**: `Outfit`, system-ui, sans-serif
  - *Traits*: Extra-Bold/Black weights, Tracking `-0.04em`.
- **Body (Interactions)**: `Plus Jakarta Sans`, system-ui, sans-serif
  - *Traits*: Medium/Semi-Bold weights for high readability.
- **Technical (Data)**: `JetBrains Mono`, monospace
  - *Traits*: Used for numeric telemetry, code readouts, and metadata labels.

---

## 🔳 Core Layout Templates (Aether Class)
Standard components must follow these specific structures:

### 1. The Pro-Nav
- **Look**: Transparent-to-Solid Glassmorphism (High-blur).
- **Height**: 90px fixed.
- **Interaction**: Blue active underlining on the current route.

### 2. The Numbered Bento Grid
- **Structure**: 01-04 Numbered cards (large numbers in background).
- **Style**: High-radius (32px), white background, 1px border.
- **Span Type**: 12-Column grid with asymmetric spanning (e.g., 2/3 width cards).

### 3. The Protection Tiers (Pricing)
- **Structure**: 3-Card layout.
- **Style**: Featured card (Tier 02) must use a 2px Primary border and a "Most Popular" floating badge.
- **Button Weight**: Solid Primary for featured, Outline or Subtle for secondary.

---

## ✨ Essential Traits & Interactions
Every component should feel "Resilient" and "Alive" through these three interactions:

- **1. Magnetic Aura**:
  - *Function*: On hover, internal elements (icons/text) must subtly shift toward the cursor (`translate3d`).
  - *Visual*: Soft primary-to-accent gradient glow on the border.
- **2. Multi-Stage Parallax**:
  - *Function*: Background dots, Parallax text (e.g., "01. TRIGGER"), and foreground content must scroll at different speeds.
- **3. Neural Weather Mesh**:
  - *Function*: Hero backgrounds must use CSS/SVG patterns (grids, dots, waves) instead of photographic images.

---

## 🛠 Usage Instructions for Agents
1. **Import `landing.css`** for all landing-specific advanced interactions.
2. **Import `index.css`** for global design tokens and base resets.
3. **NEVER** use inline colors or Tailwind classes that aren't mapped to the CSS variables above.
4. **ALWAYS** refer to this template before creating a new section or component.

---

> [!IMPORTANT]
> **NO RED ALLOWED**. SkySure is pure **Blue**, **Obsidian**, and **Cyan**.
