# Unfixable Vellum — open issues

## Features

**Per-texture tint for monochrome textures.** Sigils, Summoning, Cartomancy,
Hatch etc. are `tints: 0` with disabled pickers. Real colour means each
generator consuming it; a post-hoc colorize would stain the neutral ground.

**Texture-by-texture evaluation.** Needs its own session.

**Arcane Guidance body text.** The PML reference itself is still plain and
instructional. May want to stay that way — decide before rewriting.

## Possible backport

Landscape now uses a two-column split (preview | divider | controls) driven by
the same `--preview-frac` as portrait. If it reads well on a tablet, the
desktop layout could adopt the same draggable divider — desktop is already two
columns but the split is fixed.

## Editor follow-ups

- bracket-pair matching under the caret
- per-wrap-row glyph (a gutter `⤶` stands in for it now)

## Editor invariants — do not break

Focus mode has exactly ONE scroller: `.controls`. The editor must not become
a scroll box; nesting scrollers inside flex items requires every ancestor to
agree to shrink below its content, and when one refuses the last lines become
unreachable.

Mirror and textarea must shape text identically: no ligatures, no kerning, no
per-line block boxes, no font-weight changes, no hanging indent. Any of these
desynchronises the caret from the visible text.

Anything the settings serializer reads must be declared ABOVE it — it runs
during boot, and a `const` below it is still in its temporal dead zone. This
has bitten twice.

All three are test-guarded.

## Fixed constraints

Dark mode only. 🜚 = Touch, also the Return glyph. Touch stays 7 textures /
4 presets. Oxblood allowed in Sealed. Minimal animation. Bottom-bar symbols
are hand-drawn scratchy: every stroke gone over two or three times with small
offsets, never clean vector. Spells are stored, never derived.
