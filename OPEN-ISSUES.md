# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new since Jupiter–Iocaste)
- SOUNDS (Esoterica → Appearance → Sounds): off by default, one key (D
  dorian), three instruments with one job each — glass for the interface, a
  pad for the ground, bells for arrivals. Tabs, the four readings (their
  Chroma chords), presets, undo/redo, locks, saving, the Athanor, summoning.
- THE DIAL on Harsh Rain is where the rain comes from; on Silverpoint Hatch,
  the way the strokes run. The freed sliders: GUSTS (rain swinging about the
  dial's way, page-wide) and CROSS-HATCHING (none → the darkest third, as it
  was → everywhere). Older looks open as they were.
- STEPS AND CHAINS, the long refactor's first four: Harsh Rain, Silverpoint
  Hatch, Linen Tooth and Fractured Glaze are now chains of shared steps, and
  open in the Athanor (Start from… → Vellum's textures). A param bound to a
  slider or the dial shows as written (`@k2[10,700]`, `@dial`).
- LINEN: preview ~5× faster, export ~1.6×; soft thread edges (no stair-steps),
  each thread its own tone. FRACTURED GLAZE: 2–3× faster; crazing reads as
  hairlines with grime in them, not embossed grooves; a gentler curl.
- ALT TEXT: the poem, then the look in plain English (colours named), ≤1500.
- Runology's words are in the seed banks (some seed phrases changed); its
  glyphs are among the spell glyphs. Marble is Agate.

## 2 · Waiting on Ruby
- The PRESETS pass — "not yet".
- Binding a param in the Athanor by hand (today only a template's bindings
  exist, editable as text): a small "bind to slider / dial" menu on a param?
- Harsh Rain and Silverpoint Hatch now cost ~0.1–0.3 s (they were plain canvas
  drawing, ~0.05 s): the price of being chains. Fine, or keep a fast path?

## 3 · Next (no input needed)
- More textures as chains, as each is touched (AGENTS.md: "Rebuild a texture
  as a chain").
- The Athanor on a phone — a desktop UI for now: accessibility pass, pinning
  nodes, haptics, larger grab radii, drag tweaks (its zoom steps are smaller
  now: the first of these).
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- Split appEvents.js (~2,800 lines) into modules — the tests read its source
  by regex, so they move with it.

## 4 · Check on a phone (new)
- Sounds: on, the volume, and that iOS's silent switch silences them.
- Linen Tooth and Fractured Glaze speed.
- Harsh Rain and Silverpoint Hatch: turning the dial feels like steering them.
