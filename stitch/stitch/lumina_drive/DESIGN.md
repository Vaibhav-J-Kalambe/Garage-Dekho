# Design System Document

## 1. Overview & Creative North Star: "The Digital Concierge"

The automotive industry is often perceived as gritty, complex, and opaque. This design system aims to dismantle that perception by repositioning car maintenance as a high-end, effortless utility. Our Creative North Star is **The Digital Concierge**: a design philosophy that prioritizes calm, authoritative clarity through an Apple-inspired editorial lens.

We move beyond the "standard aggregator" look by employing **Soft Minimalism**. This is achieved through intentional asymmetry—where large, bold typography acts as a structural anchor—and a sophisticated layering of surfaces that feels more like a physical object than a digital interface. By utilizing generous whitespace (Scale 16-24) and eliminating harsh borders, we create an environment of trust and premium accessibility for users aged 18 to 60.

---

## 2. Colors: Tonal Depth over Structural Lines

Our palette is rooted in high-contrast clarity. We use a sophisticated Indigo-Blue as our primary engine, supported by a rich range of neutral surfaces.

### Primary Action & Soul
- **Primary (`#0056b7`):** The main action driver. Use for critical CTAs.
- **Secondary (`#4c4aca`):** An elegant violet-indigo for secondary interactions or highlighting "Premium" features.
- **The "Glass & Gradient" Rule:** Hero sections and primary buttons should utilize a subtle vertical gradient from `primary` to `primary_container` (`#006de6`). This adds a tactile "soul" to the UI, preventing the flat, sterile look of standard apps.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Boundaries must be defined through **background shifts**. 
- A card should not have an outline; it should be a `surface_container_lowest` (`#ffffff`) element sitting atop a `surface_container_low` (`#f3f3f8`) background.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested, semi-transparent layers:
1. **Base:** `surface` (`#f9f9fe`)
2. **Sectioning:** `surface_container_low` (`#f3f3f8`)
3. **Interactive Cards:** `surface_container_lowest` (`#ffffff`)
4. **Floating Modals:** Use Glassmorphism—a semi-transparent `surface` with a 20px backdrop-blur to allow the automotive imagery or map colors to bleed through softly.

---

## 3. Typography: Editorial Authority

We use **Inter** (as a high-performance alternative to San Francisco) to establish a clear information hierarchy. The scale is intentionally dramatic to ensure readability for older demographics while maintaining a modern edge.

- **Display Scale:** Use `display-lg` (3.5rem) for high-impact hero statements (e.g., "Your car, cared for."). Use tight letter-spacing (-0.02em) for that premium editorial feel.
- **Headline Scale:** `headline-lg` (2rem) is the anchor for garage names and service categories.
- **The Body/Label Relationship:** `body-lg` (1rem) is the workhorse for descriptions, while `label-md` (0.75rem) in `on_surface_variant` is reserved for metadata like "Distance" or "Open hours."
- **Visual Weight:** Always pair a `headline-md` Bold with a `body-md` Regular to create a high-contrast "News" look that conveys professionalism.

---

## 4. Elevation & Depth: Tonal Layering

We avoid the "floating in a void" look. Depth is achieved through ambient physics.

- **The Layering Principle:** Instead of shadows, stack `surface_container_high` elements on `surface` backgrounds. This creates a "milled" look, as if the interface was carved from a single block of material.
- **Ambient Shadows:** When a modal or floating action button (FAB) requires lift, use a diffuse shadow:
  - Blur: 32px-64px
  - Opacity: 4-6%
  - Color: Derived from `on_surface` (`#1a1c1f`) but tinted with `primary` for a more natural, sky-lit appearance.
- **The Ghost Border Fallback:** If a border is required for high-glare environments, use `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components: Precision Primitives

### Buttons
- **Primary:** `primary` background, `on_primary` text, `DEFAULT` (8px) or `md` (12px) rounded corners. Use a subtle inner-glow (1px white at 10% opacity) on the top edge for a premium finish.
- **Secondary:** `surface_container_high` background with `primary` text. No border.

### Cards & Lists
- **The Divider Proscription:** Never use line dividers between list items. Use **Vertical Spacing Scale 4 (1.4rem)** to create a natural "gutter" of whitespace.
- **Garage Cards:** Use `surface_container_lowest` for the card body. The header should use a `headline-sm` with a thin-stroke icon (2px) from the `primary` color set.

### Input Fields
- **Search & Text Entry:** Use `surface_container_lowest` with a "Ghost Border" of 10% `outline`. On focus, transition the border to `primary` and add a 4px soft outer glow of the same color.

### Location Selection (Context Specific)
- **Selection Chips:** Use `secondary_container` for the "Active" state. The roundedness should be `full` (9999px) to contrast against the more architectural `md` corners of the service cards.

---

## 6. Do's and Don'ts

### Do
- **DO** use the `24` (8.5rem) spacing token for top-level page margins to create an "Apple Store" sense of space.
- **DO** use high-quality, thin-stroke icons (Linear style).
- **DO** utilize `title-lg` for "Empty States" to make them feel like intentional design choices rather than errors.

### Don't
- **DON'T** use pure black `#000000`. Always use `on_surface` (`#1a1c1f`) for text to maintain a soft, premium legibility.
- **DON'T** use sharp 0px corners. This design system is built on "friendly precision," requiring a minimum of 8px (`DEFAULT`) rounding.
- **DON'T** crowd the screen. If you have more than 5 elements in a single view, use a horizontal scroll (Carousel) or a "Show More" secondary page to maintain the minimalist ethos.