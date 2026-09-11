# Brand Spec — "Senate" Theme

Source: 6 user-uploaded images (`image.png`, `image-1.png`, `image-2.png`, `image-3.png`, `image-4.png`, `image-6.png`) — Roman senate/forum oil-painting scenes + 2 flat-illustration Roman/Greek pieces (aqueduct, trireme). Colors and type below are read directly off these images, not invented.

**One-sentence summary:** A warm marble-and-gold "Roman Senate" theme — parchment surfaces, antique-gold accents, carved-inscription display type, and the user's own Roman/Greek artwork as page-specific hero backgrounds — as a switchable counterpart to the existing dark-navy "Classic" theme.

## Tokens (OKLch)

| Token | Value | Read off |
|---|---|---|
| `--bg` | `oklch(0.95 0.015 80)` | warm parchment/marble floor tone (image-2, image-3) |
| `--surface` | `oklch(0.90 0.02 75)` | deeper marble stone (columns, floor slabs) |
| `--fg` | `oklch(0.22 0.02 50)` | warm charcoal ink — never pure black |
| `--muted` | `oklch(0.55 0.03 70)` | weathered stone gray (shadowed marble) |
| `--border` | `oklch(0.78 0.02 70)` | pale marble veining |
| `--accent` | `oklch(0.70 0.13 75)` | antique gold/bronze — podium wood, sunbeams (image-2), aqueduct glow (image-4) |

**Reserved status color (not the decorative accent, used sparingly for tags/badges only):** imperial red `oklch(0.40 0.15 25)` — senator cushions/trim/carpet (image-2, image-3).

**Secondary cool note (small accents only — footer/dividers, from image-6's trireme sea):** deep Aegean teal `oklch(0.50 0.08 195)`.

## Type

- **Display** (H1/H2, wordmark, nav): `'Cinzel', Georgia, serif` — carved-inscription capitals, matches the epigraphic lettering style implied by the marble/column imagery.
- **Body/UI**: keep the app's existing self-hosted **Hikasami Sans** — preserves continuity with the Classic theme and avoids a second font-loading cost.
- **Mono** (only if a page needs it): `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

## Observed rules

1. Warm marble/parchment backgrounds replace flat gray; text is always warm charcoal, never pure black.
2. Gold is the single decorative accent (CTAs, active states, dividers), appearing at most twice per screen. Red is reserved separately for status/tag emphasis, not used as a second decorative accent.
3. Every photo background gets a consistent warm-dark gradient scrim so text sits at ≥4.5:1 contrast — these are busy oil-painting scenes, not flat color.
4. Headlines set in Cinzel, letter-spaced, often in small caps, to read as carved stone inscriptions; body copy stays in Hikasami Sans for legibility.
5. Cards/panels use soft marble-stone borders and warm, soft shadows — never sharp black drop-shadows (that would fight the "Classic" theme's cooler chrome look).
