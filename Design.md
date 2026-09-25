---
name: MyCOD Marketplace
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b4039'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#907067'
  outline-variant: '#e4beb4'
  surface-tint: '#b02f00'
  primary: '#b02f00'
  on-primary: '#ffffff'
  primary-container: '#ff5722'
  on-primary-container: '#541200'
  inverse-primary: '#ffb5a0'
  secondary: '#5f5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfe1'
  on-secondary-container: '#636264'
  tertiary: '#5d5c5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#767474'
  on-tertiary-container: '#f7feff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a0'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#862200'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: 0.37px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0.36px
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.35px
  body-lg:
    fontFamily: Lexend
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.41px
  body-md:
    fontFamily: Lexend
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.24px
  label-caps:
    fontFamily: Syne
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
  caption:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 16px
  margin-desktop: 24px
  gutter: 16px
  inset-padding: 12px 16px
---

## Brand & Style
This design system is built on the principles of **Efficiency, Security, and Locality**. It draws heavy inspiration from the iOS Human Interface Guidelines (HIG), emphasizing a premium, tool-like aesthetic that facilitates trust between anonymous buyers and sellers in a local environment.

The visual style is **High-Contrast Modernism**. In this light-mode execution, the system emphasizes cleanliness and airiness while maintaining structural clarity through strict 1pt borders. The interface prioritizes "Social Proof" by giving prominence to verified badges and ratings, ensuring that "Safety First" is not just a policy but a visual constant.

**Target Audience:** Urban professionals and local community members who value speed, reliability, and premium mobile-first experiences.

## Colors
The palette is optimized for high-contrast legibility in a clean, light-mode environment.

- **Crisp White (#FFFFFF):** The base canvas. It provides a clean, open, and professional environment that emphasizes content clarity.
- **Vibrant Orange (#FF5722):** Used exclusively for high-priority actions (Buy, Contact, Post) and trust-related indicators (Verified status, Secure Pay).
- **Slate Grey (#2C2C2E):** The secondary color, used for high-contrast text elements, headers, and primary iconography against the white background.
- **Deep Charcoal (#121212):** Reserved for tertiary accents and deep-contrast UI elements to ensure structural definition.
- **Stroke/Border:** A solid Slate Grey or a light neutral grey for the mandatory 1pt hair lines.

## Typography
The system uses a sophisticated trio of typefaces to balance character with extreme readability.

- **Headlines:** **Noto Sans** (as a sturdy, approachable proxy for structural titles) provides a universal feel for headers, ensuring clarity at large sizes.
- **Body Text:** **Lexend** is utilized for all descriptions and transactional data. Designed specifically to reduce visual stress, it improves reading speed and comprehension in high-density marketplace listings.
- **Labels & UI Accents:** **Syne** brings a modern, geometric edge to labels and micro-copy, giving trust indicators and meta-data a distinctive, professional character.

## Layout & Spacing
The layout follows a strict **8pt grid system**. 

- **Inset Grouped Style:** On mobile, content is organized into "Inset Grouped" sections. Cards do not span the full width of the screen but are inset by 16px with a rounded corner.
- **Vertical Rhythm:** Components are spaced in increments of 8px (8, 16, 24, 32, 48).
- **Navigation:** Top navigation bars are represented by solid #FFFFFF fills with a 1pt border at the bottom to define the edge.

## Elevation & Depth
In this system, depth is communicated through **tonal layering and borders** rather than shadows, optimized for light mode clarity.

- **Level 0 (Base):** #FFFFFF background.
- **Level 1 (Surfaces):** Light grey (e.g., #F2F2F7) for grouped list cells and item cards to provide subtle contrast against the base.
- **Structural Definition:** Every surface transition must be defined by a strict **1pt hair-line border**. Use a Slate Grey or a low-opacity neutral to ensure the border is visible but not distracting.
- **No Shadows:** Shadows are strictly prohibited. Visual hierarchy is achieved through color contrast (Vibrant Orange vs. Slate Grey) and physical containment (Inset Groups).

## Shapes
The shape language is "Squircle-adjacent," following standard iOS radii to maintain a premium feel.

- **Large Containers:** 16px (1rem) corner radius for main cards and inset groups.
- **Buttons:** Pill-shaped (fully rounded) for primary actions to distinguish them from structural elements.
- **Input Fields:** 10px - 12px radius to sit comfortably within the 16px containers.

## Components
- **Pill Buttons:** Primary buttons are fully rounded (pill-shaped), filled with #FF5722, using White text in Semi-Bold. Secondary buttons use a Slate Grey fill with White text.
- **Segmented Controls:** A horizontal container with a light grey background and a 1pt border. The active segment is white or outlined in Vibrant Orange.
- **Lists / Inset Grouped Cells:** High-contrast rows with 1pt dividers. Every row should have a 16px horizontal padding.
- **Input Fields:** Flat light grey background, no shadow, with a 1pt border that turns Vibrant Orange on focus.
- **Trust Badges:** Small, pill-shaped chips with an orange border and a tiny orange check icon, used to indicate "Verified Seller" or "Secure Transaction."
- **Cards:** Product cards use the Inset Grouped style, with the image at the top and metadata (price, distance) in the light grey container below.