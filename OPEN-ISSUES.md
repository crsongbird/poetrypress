# Unfixable Vellum — open issues

Design language: `DESIGN.md`. Building, testing, deploying: `README.md`.
This file holds only what is still open.

## Decisions for Ruby

**Element balance.** Whimsy has 9 textures; Sharpness, Chaos and Touch have 8.
Equal weight was the rule: retire one Whimsy texture (First Snow was called
redundant), or relax the rule?

## Needs checking on a phone

Built and tested here, but only a real phone in Chrome can confirm:
- the tab bar stays above the keyboard, with no gap (follows the visible
  bottom edge, including Chrome's pan over an overlaid keyboard)
- the colour picker: themed, right-aligned, Done dismisses the keyboard,
  no scrollbars, and opening it no longer summons the keyboard
- less padding at the top and bottom of the controls
- the texture panel: light pad left, a thin rule, fields at full width
- the moon in the header, on the opacity thumb, and on the reroll button
- installing from the site (the app icon, offline use)

## Next

**appEvents.js's stateful core.** The canvas, alignment, stop counts and lock
set are shared mutable variables. Splitting the file further needs that state
gathered into one object first — a design change, not a move.

**Editor:** a glyph per wrapped row (a gutter `⤶` stands in for it now).

## Later

**Layering textures.** A stack of surfaces, each with its own blend,
reorderable by drag and drop, with its own UI. Design texture code on the
assumption that one texture per page will go away.

**Landscape layout.** Complete, parked behind a `min-width: 4000px` no device
reaches. Reconsider on a laptop.

## Invariants

Each is explained where it lives in the code and guarded by a test; this is
the index.

- Typeface effects never move text or change its measured width.
- Focus mode has exactly one scroller: `.controls`.
- The editor mirror shapes text exactly as the textarea does.
- The bundle puts every module after what it imports; top-level names are
  unique across modules.
- Anything the settings serializer reads is declared above it.
- The preview's focus guard exempts anything interactive inside it.
- The theme lives in its own storage key, never in settings or spells.
- A spell is a look: never `poemText`, `locks`, `highlight` or `username`.
- Mechanically saved controls go in the `PERSISTED` table; shipped key names
  and value types are frozen.
- `applyStrings` replaces an element's own text only.
- A property repeated inside one CSS block is a fallback; never dedupe it.
- Existing PML parses identically forever; its golden fixture is never
  regenerated. Every PML field is copied in `buildLines`'s rebuild.
- Texture fingerprints change only on purpose (`--update`).
