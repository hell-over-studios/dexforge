# Design

Dexforge's visual system, as shipped. Product truth lives in `PRODUCT.md`, decisions in
`docs/DECISIONS.md` (ADR-008), the landing direction contract in
`.impeccable/surfaces/home.md`, tokens and component classes in `src/styles/global.css`.

## Identity

**Dexforge** is a fan-made, game-accurate Pokémon team builder. The current rendition is
**Pixel-cozy v2 «Pergamino»** (owner-approved 2026-11-16): parchment panels over a deep
forest ground, ink text on paper, ember primary actions, solid canonical type chips.

- **Mood:** a trainer's field journal opened on a mossy log at the trailhead. Warm, worn,
  legible — even when the news is "four of your six are weak to Ice".
- **Not:** a dark SaaS dashboard, glassmorphism, neon glow, gradient meshes, 3D renders,
  ripped game assets, chart libraries.
- Pixel art comes from chunky CSS/SVG scenes, Pixelify Sans, hard offset shadows and
  square corners. Cozy comes from parchment, moss and generous spacing.

## Principles

1. **Paper first.** Content that matters sits on parchment; the forest ground is the
   desk it lies on. Don't put body copy straight on dark green if a paper panel fits.
2. **The mechanism is visible.** Diorama, team sheet, heatmap and radar show how the
   product works; decoration never stands in for data.
3. **Legible before charming.** AA contrast, an 11px functional-text floor and written
   multipliers beat a prettier chip that can't be read.
4. **One accent action per view.** Ember marks the primary action and the weakness/hot
   state; moss marks resists and positive states. Nothing else competes.
5. **Cozy is restraint.** Grain at 3–5 % alpha, one rotated prop, one idle bob. No
   stripes, no glow, no stacked borders, no eyebrow labels.

## Color

| Token            | Hex                 | Use                                            |
| ---------------- | ------------------- | ---------------------------------------------- |
| `forest-950`     | `#08130d`           | Page ground, shadows on paper                  |
| `forest-900`     | `#0d1f15`           | Dark bands, quiet-button hover                 |
| `forest-800`     | `#143021`           | Band borders, dividers on dark                 |
| `forest-700/600` | `#1d4430`–`#2a5c3e` | Decorative pixel shapes, scrollbar             |
| `paper-50`       | `#fbf5e6`           | Soft panels, inset fields, table quiet cells   |
| `paper-100`      | `#f4e8cf`           | Default paper panel                            |
| `paper-200`      | `#ead8b4`           | Inset/stamp surfaces                           |
| `paper-300/400`  | `#dcc49a`–`#c3a473` | Tape, muted rules, borders on dark             |
| `paper-500`      | `#a7855a`           | Hairlines only; never body text                |
| `ink-950`        | `#1a140d`           | Borders, hard shadows, headings                |
| `ink-900/800`    | `#241c12`–`#33281a` | Body text on paper                             |
| `ink-600/700`    | `#5f4b30`–`#463722` | Secondary text on paper (AA-safe floor)        |
| `ink-500`        | `#7c6442`           | Placeholders and non-essential meta only       |
| `ink-400`        | `#9a805a`           | Decorative glyphs only; never functional text  |
| `ember-500`      | `#f7931e`           | Primary buttons, weakness cells, active accent |
| `ember-300/400`  | `#ffd08a`–`#ffb454` | Accent text on forest, hover                   |
| `ember-700`      | `#a85408`           | Links and icon accents on paper                |
| `moss-500`       | `#62a85a`           | Resists, "good" states                         |
| `moss-300/700`   | `#b7d99a`–`#356637` | Positive cells, notes                          |

Rules:

- Text on paper uses **ink-600 or darker** for anything smaller than large text. `ink-500`
  only for placeholders; `ink-400` never carries meaning.
- Text on forest uses **paper-100/paper-50**; secondary text is `paper-300` minimum.
- **Type chips** take their background from `public/data/types.json` and their text from
  `typeChipStyle()` in `src/lib/contrast.ts`. The helper picks ink or paper by WCAG
  contrast and darkens mid-luminance colors (poison) until paper text clears 4.5:1.
  Never hardcode chip text colors.
- Weakness = ember, resist = moss, immunity = ink, neutral = quiet paper. Color is never
  the only carrier: multipliers and labels are always written.

## Typography

- **Display:** `Pixelify Sans` (`--font-display`) — headings, buttons, type chips, tabular
  numbers, stamps. Weight 400–700; tracking stays near `0.01em` except small caps labels.
- **Body:** `Nunito` (`--font-body`) — paragraphs, inputs, helper text.
- **Scale:** hero `clamp(2.9rem, 6vw, 4.6rem)/0.94`; page title `4xl → 5xl`; section
  heading `4xl → 5xl`; panel heading `2xl`; card heading `lg–xl`; body `sm/base`;
  labels `11–12px` uppercase with `0.14–0.18em` tracking.
- **Rules:** headings carry their own weight — no kicker/eyebrow label above a heading.
  No numbered section labels. Don't letterspace body text. Don't set paragraphs in the
  pixel font.
- **Floor:** functional UI text never below 11px; 10px only for non-interactive legal
  smallprint. Inputs stay at body size (16px) so mobile browsers don't zoom.

## Surfaces, borders, depth

- Page ground: `forest-950` plus one soft radial moss light at the top. No scanlines, no
  repeating stripe overlays.
- `.paper-panel`: 2px ink border, `paper-100`, 6px hard ink shadow. `.paper-panel-soft`:
  `paper-50`, 4px shadow. Both set ink text.
- Shadows are always **hard, unblurred, down-right**, in ink on paper and `forest-950` on
  dark. Light source: top-left.
- Corners are square. The only rotation allowed is a physical prop (±1–2°: framed
  diorama, tape, dex stamp).
- **Never nest a bordered card inside a bordered card.** Separate with spacing or a
  `border-t/border-b` divider at 15 % ink. The defensive notes and analysis panels follow
  this.
- Grain: `paper-grain` / `forest-grain` at 3–5 % alpha. No `dither`-style heavier texture.

## Components

- **Buttons** (`.pixel-btn`): primary ember/ink text; paper for secondary on paper; quiet
  outline for dark ground. Hover lifts 1px, active presses 2px; 120ms stepped transitions.
- **Type chip** (`.type-chip`): 2px ink border, 0.7rem pixel caps, canonical background +
  `typeChipStyle` text.
- **Inputs:** `paper-50` field, 2px ink border, `ink-500` placeholder, ember focus ring.
- **Team slots:** 3×2 grid. Filled: `paper-50` inset, official artwork, 11px name, type
  chips, remove control. Empty: dashed ink/30 outline, `+`, short hint. Slot counter 11px.
- **Detail drawer:** in-place paper sheet under the picker, not a modal. Artwork left,
  name/types/abilities/stats right; ember bars on an ink track; short ability effects.
- **Defensive table:** rows are the selected game's own attacking types. Quiet ×1 cells,
  ember ×2/×4, moss ×¼/×½, ink ×0; solid readable type badges in member headers.
- **Notes:** divider list under the table, one sentence per finding, glyph + text — never
  a nested card.
- **Radar:** hand-rolled SVG. Ink/parchment grid, ember polygon at 22 % fill, square data
  points, 10–11px axis labels. No chart library (ADR-005).
- **Toasts:** paper card with ink border, bottom center, above sheets; live region.

## Layout

- Container `max-w-6xl`, `px-5 → px-8`; landing sections `py-16 → py-24`.
- Landing: hero journal spread (text left, framed diorama right) → game card grid
  (`1/2/3` columns) → three how-it-works steps → two-column feature cards → CTA → footer.
- Game page: back link → paper header (title, gen/region/count, flat dex stamp) → workbench
  grid `lg:[1fr_22rem]` with the team sheet sticky at `top-24` → detail drawer → defensive
  analysis → team profile.
- Mobile-first from 360px: one column; team sheet follows the picker; analysis switches
  from the matrix to stacked per-member cards below `md`.

## Motion

- Entrance: `fade-rise` 0.4s / `fade-in` 0.3s; popovers `pop-in` 0.3s `steps(3)`.
- Idle: `bob` 3.4s only on decorative scene artwork; `blink` only on loading text.
- Interaction: 120ms `steps(2)` translate/box-shadow; no layout-property animation.
- `prefers-reduced-motion` clamps every animation/transition to 0.01ms globally.

## Accessibility

- AA contrast for text and data chips; large text/UI ≥ 3:1. The `typeChipStyle` unit test
  covers every canonical type color.
- Keyboard-first combobox/listbox with visible 3px ember focus rings on every control.
- Touch targets sized for thumbs; no hover-only information.
- Color never the sole signal: multipliers, labels and notes spell out the meaning.
- Language: ES default, EN first-class; `data-i18n` on plain-text elements only, islands
  follow the live toggle via `useLang`.

## Voice and content

- Spanish default, English authored alongside; plain verbs, sentence case.
- Labels that ship: "Elige tu juego", "Busca y añade", "Tu equipo", "Análisis defensivo",
  "Perfil del equipo", "Copiar enlace para compartir el equipo".
- Empty states say what to do next. Errors stay in the interface's voice.
- No fabricated proof — no user counts, testimonials, benchmarks or partnerships.
- Type and Pokémon names come from the datasets, never hardcoded.

## Imagery

- Species visuals are **official artwork only** (PokeAPI sprites URL stored in the
  dataset); in-game sprites render with `image-rendering: pixelated`.
- PixelScene dioramas are hand-built CSS/SVG pixel shapes, not bitmaps; no ripped 3D
  models or fan art.
- Every raster has provenance: the landing captions and footer credit official artwork /
  PokeAPI.

## Quality gates

- `pnpm pre-commit` (lint, format, typecheck, tests) and `pnpm build` before every PR.
- Impeccable detector: **0 warnings** at 1280×800 and 390×844 on the landing and a
  populated game page. Remaining advisories (hard pixel shadows, grain textures) are
  intentional; waive individual cases with `data-impeccable-ignore` and a reason.
- Screenshots in ES and EN, desktop and mobile, populated and empty; console must be
  clean.
- New or changed type chips must go through `typeChipStyle` and keep
  `tests/contrast.test.ts` green.
