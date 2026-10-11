# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new in Jupiter–Philophrosyne)
- SOUNDS, re-cut (Esoterica → Appearance → Sounds; still off by default): D
  aeolian, an octave down, mostly SILENT. What still sounds: saving an image,
  a preset or spell arriving, summoning, keeping a spell or poem, locks (a
  tick), and the Athanor (open/close, a node in/out, a wire in/out, a graph
  lit). The SOFT NO is every "are you sure?"; a HARD NO (two knocks) is a
  refusal; a disabled control gives one dull knock. Readings, tabs, rerolls,
  undo/redo: silent.
- ASKING: after 6+ edits since a fresh start, Randomize (font, backdrop),
  presets, applying a spell and Load JSON ask first — in the app's own modal.
  The Athanor asks before Clear, Revert, Start from… and deleting a node,
  whenever the grid holds anything changed.
- REFUSING: a JSON look, a shared spell or a saved tile that would break the
  page is refused and the page rolled back; a graph over 64 nodes or 256 KB
  is refused (twice the limit outright), a broken one repaired and reported.
  Uncaught errors show as a quiet line at the bottom instead of nothing.
- THE ATHANOR, re-faced: its own night palette; wires and ports coloured by
  what they carry (field lilac, image pink, colour gold, value cyan, dashed);
  node headers by family; ⚙ diamond ports on settings (Filter Forge's idea: a
  wire into a setting drives it across its range). The templates now show
  their wiring (Knobs and the Dial into ⚙ ports). Bigger preview; a preview
  under every node, made off the page's thread, with a checkbox to turn them
  off; Wire colours and How it works fold away below. New steps:
  Kaleidoscope, Polar.
- SYMBOLS from Symbology (198, with names and families): among the spell
  glyphs (190 now); Transmutation Circles draw real planet and zodiac rings;
  Cartomancy has eight lore cards (The Alembic, Caput Mortuum, The Crucible,
  The Comet, Lilith, The Caduceus, Sedna, Quintessence).
- SEED PHRASES, re-cut (every seed's phrase changed): sixteen sentence shapes,
  past and present tenses, alchemical words, -ing endings rare ("Mercury
  kindled the lantern at dusk", "No wood that strayed toward Creation"). Only
  the phrase shows now (the number is its tooltip); the moon button sits level
  with it.
- NAMES: four readings renamed from the lore — Transmutation Circle's Earth is
  Hermetic Seal; the Athanor's Fire/Water/Wind are Calcined, Dissolved,
  Sublimed. Preset names left alone (the PRESETS pass is "not yet").
- SHOW SPELL CODE? (Write, under the credit): hides the spell in the corner.
  Part of the look: spells, shared links and JSON keep it; presets leave it
  alone.
- Still unjudged from Jupiter–Ananke: the Dial on Harsh Rain / Silverpoint
  Hatch (Gusts, Cross-hatching), the four chain textures, Linen and Glaze
  speed, alt text.

## 2 · Waiting on Ruby
- SOUNDS — the instrument itself, when Ruby wants it back:
  - a STRING instrument, something unusual (plucked string by physical model;
    ideas: an Aeolian harp, strings sounded by wind; sympathetic strings that
    ring when another is struck; a koto-like pluck that bends up)
  - a way to PLAY it by hand (a big, forgiving pad to strum, pluck or bow,
    recorded straight into a composition) instead of typing degrees
  - Ruby's design from the Murmur Studio goes into murmur.js MURMUR_DESIGN.
- The PRESETS pass — "not yet" (the lore words are ready for it).
- How many edits before Randomize asks (6 now)? Should the readings ask too
  (they replace knobs and hues, but respect locks)?
- Binding a param in the Athanor by hand is now a wire into its ⚙ port; is a
  "bind to slider / dial" menu still wanted?
- Harsh Rain and Silverpoint Hatch cost ~0.1–0.3 s as chains (were ~0.05 s).
  Fine, or keep a fast path?

## 3 · Next (no input needed)
- More textures as chains, as each is touched (AGENTS.md: "Rebuild a texture
  as a chain").
- The Athanor on a phone — a desktop UI for now: accessibility pass, pinning
  nodes, haptics, larger grab radii, drag tweaks.
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- Split appEvents.js (~2,900 lines) into modules — the tests read its source
  by regex, so they move with it.

## 4 · Check on a phone (new)
- Sounds: on, the volume, and that iOS's silent switch silences them.
- The ask / refuse modals: big enough to hit, Escape-free (a phone has none).
- The seed row: the phrase and the moon button level.
- Linen Tooth and Fractured Glaze speed; turning the Dial on Harsh Rain and
  Silverpoint Hatch feels like steering them.
