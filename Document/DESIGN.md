# Smart Library UI Design System

## Source and adaptation
**Authoritative visual reference:** User-provided `IP-DESIGN.md` (*Flip7 Design System*). This document **adapts** its retro-playful teal–coral–gold design language for a library-management app; it does not claim the original source is about libraries. Retain the original `IP-DESIGN.md` for full reference.

### Reuse faithfully
- Colors, typography intent, 8rpx spacing rhythm, border radii, accent-glow shadows, pill CTA buttons, cream-colored input surfaces, white cards with teal accent bars, dashed section separators, and brief tactile interactions.
- Original design uses **rpx** (WeChat mini-program units). This project is a **web React application**: use approximately **1 CSS px per 2 rpx** as a starting translation, tuning for accessibility and readability. This conversion is an adaptation, not a rule in the original file.

### Do not transplant game-only UI
- No FLIP7 logo, fan of game cards, BOOM/Flip7 buttons, victory rankings, crown animation, confetti or score podiums. These are game-specific components in the source and not part of the library scope.
- A simple `📚 Smart Library` heading may have a subtle cream/teal banner motif; do not spend time building a complex Flip7 logo.

## Palette (exact values from source)
| Token | Hex | Library usage |
|---|---|---|
| `--teal` | `#2BA8A2` | Navigation selection, branding, focus |
| `--teal-light` | `#3CC4BD` | Hover and highlights |
| `--teal-dark` | `#1E8C86` | Strong teal text |
| `--teal-bg` | `#E8F6F5` | Soft backdrop |
| `--gold` | `#FFD23F` | Main Add / Register / Issue / Return CTAs |
| `--gold-light` | `#FFE47A` | Hover/active glints |
| `--gold-dark` | `#E6B800` | Gold depth |
| `--coral` | `#EF6C4A` | Issued/warning highlights |
| `--coral-light` | `#FF8A6A` | Warning surface hints |
| `--coral-dark` | `#D45233` | Warning emphasis |
| `--cream` | `#FFF8E7` | Input backgrounds |
| `--sky` | `#5DADE2` | Optional info state |
| `--page` | `#EFF8F7` | Page background |
| `--card` | `#FFFFFF` | Content cards |
| `--success` | `#27AE60` | Available/success |
| `--error` | `#E74C3C` | Form and API errors |

## Typography
Original uses system fonts and heavy (800) wide-spaced headings. For web:
```css
font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
```
- h1: 28–32px, font-weight 800, modest tracking; h2: 20–24px, weight 800; h3: 18px, bold; body: 15–16px; supporting text: 13–14px.
- Use clear type for table values; preserve focus and readability over decorative letter spacing.

## Spacing, radii and surfaces
Source's spacing increments: 8, 16, 24, 32, 48 **rpx**; web starting equivalents: 4, 8, 12, 16, 24 **px**. Increase spacious form/card padding where needed.
- Small radius: 4px; medium: 8px; large: 12px; extra-large: 16px; pill: 999px.
- Page: pale teal `#EFF8F7`; forms: cream inputs; content: white cards with small colored left border and teal-tinted shadow.
- Original colored-glow style: teal/gold/coral shadows instead of heavy plain black shadows on controls.

## Screen layouts
### Shared header and tabs
- Branded library heading and short one-line subtitle.
- Three accessible pill-style navigation buttons: **Books**, **Members**, **Issue / Return**. Highlight selected tab with teal fill.

### Books tab
- **Add Book** card with Title, Author and gold Add Book CTA.
- **Book Catalog** card containing a search box (title or author), availability selector (All Books / Available Only), and table.
- Status: **Available** in green, **Issued** in coral; do not rely on color alone—show status text.

### Members tab
- Cream input for name, gold Register CTA, table with member ID and name.

### Issue / Return tab
- Two responsive white cards; issue form uses Book ID and Member ID; return form uses Book ID.
- Success message (teal/green tone) shows due date or fine; error message (coral/error tone) explains what failed.
- Keep 7-day loan / ₹5-per-day reminders in small supporting text.

## Components and behavior
- Gold pill primary buttons with subtle gradient/glow; short pressed scale (around 0.98) and transition under 500ms.
- Cream inputs with teal focus ring; labels always visible, especially for numeric-ID forms.
- Cards with ~3px teal or gold left border; use dashed teal-tinted dividers as optional detail.
- Respect keyboard focus and reduced-motion preference (`prefers-reduced-motion`).
- For web usability, touch targets should be **at least 40–44 CSS px**; original source specifies 72rpx for WeChat, not a literal 72px web target.
- At narrow widths, stack form controls and issue/return cards; allow tables to scroll horizontally when needed.

## Minimal CSS variable starter
```css
:root {
  --teal: #2BA8A2; --teal-dark: #1E8C86;
  --gold: #FFD23F; --coral: #EF6C4A;
  --cream: #FFF8E7; --page: #EFF8F7;
  --card: #FFFFFF; --success: #27AE60; --error: #E74C3C;
}
```

## Implementation status
These are **design requirements for a visual pass**. The existing `frontend/src/App.css` is a functional baseline and may not yet implement all tokens, shadows, radii, and interactions in this document. See `TASKS.md` for the optional scoped styling pass.
