# Open issues

Production: poetrypress.unfixable.place · development: vellum.unfixable.place
Release: see release.js (`node build.mjs --next` to advance). Look before
judging: `node tools/texture-gallery.mjs --only <names>` (run when asked).
Prior art and recommendations: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations" (Claude Docs).

## 0 · Performance (decide first)
See PERFORMANCE-AUDIT.md. A–I are done. Next: measure on Ruby's phone
(Chrome and Firefox; is lighting on the GPU there?), then the next GPU
candidates (Dream Bloom's convolution first). J (Linen at preview) waits.
New heavier ones to watch on a phone: Black Hole (~0.6 s preview, ~2 s
export), tilted Dune Ripples (~1.4 s export at the default tilt, ~2.6 s at
full), Scrying Pool (~1 s preview), Burnt Letter (~1.1 s preview, ~2.6 s
export, with its piles), Turing Skin (~1.2 s at any size: its own grid),
Hoarfrost (~0.9 s preview, ~1.5 s export), Rain on Glass (~0.8 s, ~1.4 s),
Guilloché (~0.5 s, ~1.1 s), Chladni Sand (~0.7 s, ~1.2 s), Contour Map
(~0.9 s, ~2.1 s), Flow-Field Ink (~0.1 s), Stained Glass (~0.8 s, ~1.4 s),
Suminagashi (~0.8 s, ~1.4 s), Watercolour Wash (~0.4 s, ~1.2 s) — CPU light;
less where the light runs on the GPU. An Athanor surface costs what its parts
cost (a Vellum Texture node costs that texture), within its work budget.
- TEXT EFFECTS are fast now: glow, shadow and bevel blur as canvas shadows of
  off-page letters (canvasRenderer `softText`), not ctx.filter — glow went from
  ~200 ms a frame to ~10 ms (three stacked: ~350 → ~17 ms); measured with the
  canvas flushed. Check the feel on Ruby's phone, Chrome and Firefox.
- Scale audit (tools/scale-audit.mjs; preview vs export): Flow-Field and
  Turing Skin fine, Contour close; Chladni, Guilloché, Burnt Letter and
  Hoarfrost are softer at preview size (Ruby: soft is fine); Stained Glass,
  Suminagashi and Watercolour Wash fine.
The inset box's glass runs on the GPU when there is one (boxFx.js) — check
its speed on the phone, and that 'glass' reads gpu there.

## 1 · Light, like a game engine
`lightHeights` (texCore) lights HEIGHTS by the dial — diffuse, specular per
material, cast shadows, occlusion; NORMAL MAPS and MATERIAL hues; `lightSparse`
for scattered details. On it now: Dune Ripples, Kintsugi, Moss on Stone, Rain
on Glass, Facet Field, Cup Ring, Old Paper, Poured Wax, Cold Press, Fractured
Glaze, Crystal Leaf, Metal Spangle, Linen, Sigil Scatter, Brushstrokes
(impasto) and Burnt Letter; Scattered Polygons' Sheen tilts each flake to the dial. Cartomancy lays its cards under the dial
(shadows, curl, gilt edges). Past the dial's rim these sink the light toward
4° (long raking shadows); the rest keep the rim.
- The camera TILT is on Dune Ripples, Scrying Pool, Moss on Stone (texCore
  `obliqueFrame` / `obliqueRender` / `fieldOn`) and, as the camera's pitch,
  Painted Landscape.
- Next: normal-map detail where heights are awkward (weave, crazing);
  per-material gloss where one won't do.

## 2 · Ruby to judge (this round)
- The node editor is THE ATHANOR again, subtitled "Surface texture node
  editor". Looks saved while it was the Crucible open with it (retireLook,
  RETIRED). Stages 4–5: a VERSION per graph (v2: each node's own randomness),
  node results KEPT between edits, a WORK BUDGET (coarser past it; 64 nodes at
  most), five STARTER graphs ("Start from…": Marble, Leaded Window, Lit
  Terrain, Woven Waves, Reaction Bloom), three new parts (Posterize, Tile &
  Rotate, Edge Detect).
- Text effects (glow above all) are ~20× faster.
- The last three approved textures: Stained Glass (√; shards → rose window,
  lead lit by the dial, glass lit from behind), Suminagashi (♡; Jaffer's
  marbling maths, rings swept by the breath), Watercolour Wash (🜚; Hobbs's
  layered polygons, edge darkening, granulation, a graded wash).
- Prior art for node editors is in Ruby's doc (Material Maker, Substance,
  Blender groups, TextureLab, NodeToy, the TSL editor; Drawflow vs Rete vs
  LiteGraph).

## 3 · Colour, light and material — the rest of the pass
Every colour has one job (test/colorRoles.test.mjs). Unused hues are now
HIDDEN, like unused sliders. The dial is a joystick where a texture has no
light (Wind, Blend Direction, Position — now to the very corners — View),
with a centre mark and ◎ centre button, a halfway ring that catches, and ⚄
a random angle.
- Still to go: the dial for angle-only textures (Harsh Rain's slant, the
  hatch) — waiting on Ruby (see the open questions).

## Pinned
- Rain on Glass: make the preview's drops the export's (Ruby: acceptable for
  now, but needed). The simulation is chaotic, so tiny size differences grow:
  run it on the canonical grid at every size (as Turing Skin does) and scale
  the result — about half a run, mostly checking the look still holds.
- TEMPLATES in the Athanor (Ruby): open an existing texture as a graph of its
  parts. Each texture must first be written as a chain of shared steps
  (noise → warp → levels → light); Material Maker's "make editable" and
  Blender's groups are the model; Drawflow's modules can hold the inner graph.
  First: Clouds, Cold Press, Contour Map, Flow-Field Ink.
- The Athanor's GPU passes (blur, warp, light inside a graph) — the light
  already uses the GPU where texCore's does.
- Then: generate and revisit the PRESETS (Ruby: once the open items are done)
  — Turing Skin, Hoarfrost and the ten newest textures have none yet.

## Later
- Dream Bloom as the basis for a new texture (its five knobs make a rich engine).
- Split appEvents.js (~2,500 lines) into modules.
- Alt text on export (the poem's words).
- Preset tiles draw the inset box as a plain rectangle (not its stitch shape
  or glass) — cheap to add if wanted.

## Check on a phone
- The occasional blank page (Moto G Stylus 2022): frames draw into a back
  buffer and reach the page only when whole.
- The dial's three buttons and the seed's phrase box in the narrow column.
- Chrome vs Firefox speed; the 'two pages at once' ghost never returns.
- Textures are made in a worker: the page stays responsive while one is made.
- The new fonts' sizes in the narrow column (ANDROMEDA just fits at 360px).
- Panzoom's pinch on the preview (toward the fingers), double-tap to fit.
- The Athanor on a phone: the palette below, tap a part to add it; a
  Athanor surface's speed on the phone.
- The box's glass speed; the 58-font picker's groups.

## Worth knowing
- WORD SEEDS (seedWords.js): every 32-bit seed has exactly one phrase and
  back; the banks and their order are FROZEN (test/seedWords.test.mjs anchors
  phrases). Saves hold the number, and (textureSeedWords) whatever was typed.
- FULL presets (`full: true`) are whole saved looks, applied by
  restoreSettings except the page size.
- The camera tilt (texCore `obliqueFrame`/`obliqueRender`): build the ground
  on the frame's patch (larger than the page), light it from above, then
  render; tilt 0 returns `flat` and the texture is exactly its top-down self.
- Dream Bloom is a thin-lens camera (50 mm f/1.8): blur is a real convolution.
- Textures are made off the page's thread (textureWorker.js). Textures that
  draw text in web fonts (Transmutation Circles, Cartomancy) stay on the page.
- PML stays backward compatible: test/fixtures/pml-golden.json is never
  regenerated; font order is frozen.
- Textures measure in canonical pixels (cpx, canonArea, canonDiv); check new
  ones with tools/scale-audit.mjs.
- Blend modes can hide an inset box (Darken shows only a darker box…).
- WEIGHTED traits: texCore `pickWeighted([[value, weight], …], roll)` — one
  draw, like the coin-flip it replaces, so seeds keep their other features.
- The report drops a line whose surface variable has nothing to say
  (pmlVars LINE_DROP, ctx.surfOff).
- Panzoom and Coloris load from jsdelivr at exact versions (Drawflow too,
  only when the Athanor opens); the app must work without them.
- STITCHES: STITCH_STYLES is the menu; STITCH_ALIASES maps the retired to
  their relatives; parse with STITCH_NAMES, draw through stitchOf(). Every
  kept motif has an `edge` (its silhouette) — a new motif needs one too.
- LINKED CONTROLS: `data-link="<id>"` + `data-link-switch="<checkbox>"` mirror
  two controls both ways while the switch is on (the box ⛓ border).
- The box's glass and GPU blends: boxFx.js; `?softgl` in the address lets a
  machine without a GPU test the GPU path (body[data-glass] says which ran).
- The Athanor's graph is Drawflow's export JSON in #forgeGraph (PERSISTED,
  but not an undo step), saved WITHOUT node faces (forge.js redraws them from
  FORGE_NODES on load). athanor.js evaluates it; type 'athanor' in the
  texture tables has six plain knobs (k1–k6) — the page relabels them from the
  graph (applyAthanorGraph), and the cache key carries athanorHash(graph).
- The Athanor's graphs carry `v` (athanor.js ATHANOR_VERSION). v1 drew all
  nodes' randomness from one stream; v2 seeds each node from (seed, id), which
  is what makes the kept results (ATHANOR_KEPT) safe. Never change what an
  old version makes: add a version.
- Text effects never blur with ctx.filter: use softText (a shadow of off-page
  letters, carried through the transform).
- Texture layers: the base layer is drawn first, in its own slot ('base'),
  with the main seed ^ 0x5bd1e995; presets turn it off (FRAME_DEFAULTS).
