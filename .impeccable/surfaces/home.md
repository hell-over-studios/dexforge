# Surface brief — Home (`/`)

**Scope:** the public landing page plus the shared site shell (header, footer, body
ground) that every route inherits. **Mode:** Persuade.

## Audience, job, action

A Pokémon player who already has a game in mind and is deciding whether Dexforge is
worth their time. In one viewport they must recognise "this is a team builder for the
game I'm playing", believe it respects that game's rules, and take the next action:
choose Red/Blue, Gold/Silver or Emerald. Secondary action: understand how it works
before choosing.

## Proof / content

Real, existing proof only: three supported games (151 / 251 / 202 species), official
artwork from the datasets, game-accurate type charts, defensive table and team roles.
No invented user counts, testimonials or benchmarks. Featured species: the Hoenn trio
(Treecko, Torchic, Mudkip) in the hero diorama; Pikachu, Cyndaquil and Treecko on the
three game cards.

## Constraints

Pixel art + cozy (ADR-008); owner-pinned "Pergamino" revision: parchment panels over a
deep forest ground, ink text on paper, ember primary actions, solid canonical type
chips. Spanish default + English. Mobile-first at 360px. `prefers-reduced-motion`.
Static Astro; no runtime PokeAPI. Official artwork only. Do not disturb the in-page
language toggle contract (`#lang-toggle`).

## Chosen direction and memorable moment

A trainer's field journal opened on a mossy log at the trailhead: a large parchment
spread holds the headline, while a framed pixel diorama stages three official artworks
in a stepped forest clearing. Memorable moment: the diorama's Pokémon idle-bob above
the caption "Ruta 101 · Hoenn" while the game cards wait below like trail markers.

## Unresolved decisions

None for this surface. Future game additions will reuse the same card grammar.

## Direction contract

**THESIS:** A field journal on a forest floor, not a dark dashboard: paper and ink over
deep green, with the product's mechanism staged as a diorama and a team sheet. Refuses
the category default of a dark hero plus feature-chip wall.

**OWN-WORLD:** Ground `#0b1710`, panel paper `#f5ead2` / `#fbf4e4`, ink `#231b12`,
ember `#f28b1f`, moss `#5f9e5a`; 2px ink borders, 4–6px hard offset shadows, stepped
pixel corners, dither grain, Pixelify Sans display + Nunito body, solid canonical type
chips.

**STORY:** "This is a Pokémon team builder that respects the game I picked." The visitor
sees the diorama, reads the promise, then picks one of three game cards and lands in
that game's builder.

**FIRST VIEWPORT:** Shared paper-and-forest header. Left 55%: kicker, oversized
two-line headline ("Tu equipo, forjado para tu juego"), supporting paragraph, primary
ember CTA "Elige tu juego" plus ghost "Cómo funciona", and a three-item proof strip.
Right 45%: a thick paper-framed pixel diorama (stepped hills, pixel trees, fireflies)
with Treecko, Torchic and Mudkip on the ground and a caption plate. Primary action sits
below the paragraph, above the fold.

**FORM:** Field-journal / trailhead composition, ranked first of seven candidates for a
user-pinned direction; the predictable opposite (dark instrument dashboard) is refused.
seed: none (unavailable)

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
