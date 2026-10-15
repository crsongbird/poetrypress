# ROADMAP — the surface engine, from here

A plan for agents (and people) carrying the texture system forward. It merges
two concept documents Ruby gave:

1. **The future-directions document**: the three levels of complexity, the
   poetry-specific inputs, the preset system and 36 surface ideas.
2. **The Filter Forge help pages** (the project's prior art): its components,
   its rendering engine, its output stage, its controls and remappers, its
   randomizer.

**Ruby's two end goals for the project:**
1. **Every surface in the future-directions document is a node graph in the
   Athanor.** Done as a first draft: all 36 are Surface Studies (§2 I). Stage
   3 makes each a texture in the menu.
2. **Textures are graphs of general parts, not black boxes.** A part that
   draws a whole texture is a good start, not the end: §2 J lists them and
   what they come apart into.

Ruby may approve a texture's look changing for a better or faster method, from
compare.mjs's sheets (AGENTS §8): rebuilding a black box needn't be
pixel-identical if Ruby says yes.

Read AGENTS.md first: its invariants and standing rules bind everything
here. This file says **what** to build and **in what order**. When an item is
finished, delete it from here and from OPEN-ISSUES.md. Don't leave a history.

---

## 0 · Principles (from both documents)

- **Readability is part of the shader, not a warning afterwards.** Every
  surface can know where the poem is and quiet itself there. This is what
  makes these poetry backgrounds, not textures borrowed from another kind of
  tool.
- **Three levels, one engine.**
  1. **Preset**: a tile, a seed, a few big gestures.
  2. **Customize Surface**: 4–8 controls the preset's author chose.
  3. **The Athanor**: the full graph.
  A preset is a saved graph with some of its settings exposed. Nothing at
  levels 1 and 2 needs anything level 3 can't express.
- **Filter Forge's three ideas that matter most:**
  - **Parameter mapping**: any setting can be a picture, so it varies across
    the page.
  - **One Size**: every distance is measured against it, so a surface is
    resolution-independent and scales with one slider.
  - **A Result that defines the output stage**: a flat picture, or a lit
    surface.
- **Small library, composable parts.** Make a part someone would reach for
  twice (the componentizing rule). Group parts rather than grow giant graphs.
- **Old work never changes.** Graph versions (`v`), texture fingerprints, and
  PML golden files: add a version, never redefine one.

---

## 1 · What Filter Forge taught, and where Vellum stands

| Filter Forge | Vellum today | Status |
|---|---|---|
| Map / Curve / Numeric components; ports colored by type | Five wire kinds: gray map, picture, color, number, **curve** (green, dotted) | ✅ (curves added in Jupiter–Hegemone) |
| Parameter mapping (a picture on a setting varies it point by point) | ⚙ ports. In v3 graphs a map is per point where a part reads `E.map`; v2 graphs average it | ✅ for Levels, Threshold, Warp, Mix, Posterize, Map Range, Blend, Hue & Saturation, Chromatic Offset, Brightness & Contrast, High Pass, Sharpen, Perlin Noise, Tone Curve. **A1** for the rest |
| Remappers (limit or reverse a control's range per target; one slider, many ranges) | `'~key': 'lo,hi'` per wired ⚙ (lo > hi reverses) | ✅ engine; **D3** UI |
| Required inputs (red; a stand-in image keeps the rest working) | `STEP_REQUIRED`: a red port with "!", and a "!"-in-a-circle stand-in in step previews only | ✅ |
| Result: Simple vs Surface (lit by Surface Color, Height, Reflectivity, Reflection Blur, Metallic) | Surface (picture + height) and the Light Engine as a part | **B1** |
| Render channels (Final, Diffuse, Bump, Normal, Specular, Metallic, Occlusion) | Step previews show each part's first output | **B2** |
| Global Size (all distances relative; resolution-independent) | Canonical pixels everywhere; the Surface's **Size** (25–400) scales a graph | ✅ |
| Global Variation (one seed into every random part, plus each part's own) | The page seed; v2 seeds each node from (seed, id); some parts have Variant | **A9** (Variation on every random part) |
| Seamless Tiling | Not needed: a page is not tiled | parked |
| Anti-aliasing: supersampling, "edges only" by AA zones | Grids drawn at a divisor and scaled up smooth | **A6** |
| Lighting tab: HDRI environment, ambient color, any number of area lights (color, negative light, backlight, angular width, diffuse/specular influence), ambient and reflective occlusion with a quality setting | One dial light, ambient, materials (Highlight, Shade, Diffuse hues), soft shadows, AO | **C1–C4** |
| Control components (Slider, IntSlider, Angle, Checkbox, Value, Color, Grayscale, Curve control); only those reaching the Result are shown; order of controls | Knob (6 slots), Hue (2), Accent, Number, Random Number, Light Dial. Only controls reaching the Surface are offered | ✅ reach rule; **D1, D2** |
| Groups (control components inside a group define its inputs) | none | **A3** |
| Loop and its slaves (Iteration, Accumulated, Randomizer); Bitmap Cache; Lua script components | Results kept automatically (ATHANOR_KEPT) | **A4**; scripts parked (security) |
| Note component | **Note** part | ✅ |
| Randomizer: Next Variant / Back, per-parameter locks, Ctrl-click one setting, High/Medium/Low levels (color relationships kept) | A die and a lock on every section, with Gently / As usual / Wildly and Back (E1, E2 done) | **E3–E4** |
| Presets tab (snapshots of a filter's settings) | Presets, readings (🜂 🜄 🜁 🜃), Grimoire, kept surfaces | **H2** |
| Obsolete component versions kept for old filters | Graph `v`, RETIRED ids, hidden options | ✅ |

---

## 2 · Work items

Each item lists its **files**, what it **depends on**, and how to **prove** it.
IDs are for cross-reference. They are not priorities (see §3 for the order).

### A · The engine (athanor.js, steps.js)

- **A1 · Map inputs everywhere they make sense.** Give every per-point
  setting `E.map`/`E.at`: Blur radius (a variable-radius blur), noise
  scales, Grow & Shrink, Twirl, Motion Blur length, the Light Engine's relief
  and gloss.
  - Files: steps.js and its families.
  - Prove: a v3 graph with a gradient on the ⚙ varies across the page; the
    same graph at v2 doesn't; fingerprints unchanged.
- **A3 · Groups.** A selection of parts saved as one part (Filter Forge's
  groups; Unreal's material functions):
  - Knob, Hue and Number nodes inside a group become its inputs.
  - Its Surface-like "Group Result" becomes its output.
  - It is kept on the shelf, shared as JSON, and shown collapsed with an
    "open" action.
  - Files: athanor.js (evaluate a group as a sub-graph with its own memo),
    forge.js (collapse, expand, edit inside), steps.js (a `group` step that
    carries its graph).
  - Depends on: A3a, the graph format's sub-graph field. Add a version (v4):
    a v3 graph must load unchanged.
  - Prove: a grouped Agate draws identically to the ungrouped one; validateGraph
    limits nodes inside groups too.
- **A4 · Loop.** Repeat a sub-graph N times, feeding each pass the last, with
  Iteration (0..1) and Accumulated as inputs. For recursive patterns and
  growth by steps.
  - Depends on: A3, because a loop body is a group.
  - Prove: a budget test (a loop counts its body × N against
    ATHANOR_LIMITS).
- **A6 · Edges-only supersampling.** Parts that draw hard edges (Threshold,
  Bricks, Pixelate, Step curves) report an edge mask; the Surface
  re-evaluates those pixels at 2× and averages. Filter Forge's "AA zones".
  - Prove: scale-audit improves on Bricks and Threshold; cost measured on the
    baseline phone (AGENTS: measure on the right machine).
- **A10 · Ports saved by name, not by number** (Ruby's question, after
  Halftone2's wires were drawn on the wrong rows). Nodes already have unique
  ids. Ports are still saved as `input_N`, and a ⚙ port's N is
  `dataIns + its place among the settings`, so a part that gains an input
  would quietly shift every saved ⚙ wire on it.
  - Save ports by their meaning (`in:tone`, `set:scale`) and translate to
    Drawflow's `input_N` only when the editor draws. (The editor still lines
    ports up by order; `faces` sorting them stays.)
  - Old graphs load through a v4 translation; `validateGraph` checks names.
  - Prove: add an input to a part in a test, and an old graph's wires still
    reach the same settings.
- **A9 · Variation on every random part.** Done for Value Noise, Perlin
  Noise, Cells, Curve (noise) and Scatter (`variation` mixed into the node's
  seed; 0 is the old stream). Still to do: map the older parts' own Variant
  params (Tendrils, Flow Lines, Discharge…) onto it, so one setting means the
  same thing everywhere.

### B · The output stage (the Surface)

- **B1 · A lit Surface.** Surface inputs beside picture and height:
  Reflectivity, Reflection Blur, Metallic and Emission, all maps, with the
  mode chosen on the Surface (flat or lit).
  - Reflection Blur maps to a Phong exponent: `10^((1 − blur)·4)`.
  - Metallic tints the specular with the surface color; dielectrics reflect
    about 5% head-on (a Fresnel term).
  - Files: steps.js `surface`, texCore.js `lightHeights` and **the WebGL2
    shader in the same change** (AGENTS: CPU and GPU agree to 1/255).
  - Depends on: nothing; C builds on it.
  - Prove: a flat-mode graph renders bit-identically; GPU and CPU compared.
- **B2 · Channels in the Athanor preview.** A selector under the preview:
  Final, Height, Normal, Occlusion, Specular.
  - View only, for understanding a surface; no export.
  - Depends on: B1 for Specular.

### C · Lighting (texCore.js lightHeights + shader; the dial UI)

- **C1 · Ambient light color.** A hue for the light that comes from
  everywhere. Its "none" draws exactly as today (colour roles rule).
- **C2 · More lights.** A rim light or backlight beside the dial's light:
  color (negative allowed: it draws light out), softness (Filter Forge's
  angular width), diffuse-only or specular-only.
  - Depends on: C1, B1.
  - Prove: GPU = CPU; with one light, fingerprints unchanged.
- **C3 · Occlusion quality.** Low, medium or high presets for the AO march
  and the shadow trace, chosen per device. The baseline phone uses medium.
- **C4 · An environment from the page.** The page's own backdrop colors as
  the sky the surface reflects: Filter Forge's HDRI, cheaply.
  - Depends on: B1.

### D · Controls (Filter Forge's control components and remappers)

- **D1 · Control kinds.** A Knob gets a kind:
  - slider;
  - steps (an IntSlider: ticks and names);
  - angle (drawn as a dial);
  - switch (a checkbox: two ticks).
  - Files: steps.js `knob`, appEvents applyAthanorGraph (relabels the page's
    sliders with ticks/names), forge.js.
  - Prove: a switch knob's slider has two ticks named Off/On on the page.
- **D2 · Order of controls.** The Surface lists which slot each control takes
  (Filter Forge's "Order of Controls"). The menu can reorder them.
- **D3 · Remapper UI.** A wired ⚙'s menu shows its range as two handles, with
  a ⇄ to reverse it. The engine already supports `~key` with lo > hi.
- **D4 · A Curve control.** A curve the person draws (a small curve editor
  on the page), feeding curve ports.
  - Depends on: curves (done), D1.
  - The hard part is the editor on a phone: test on the baseline phone.

### E · The randomizer

- **E3 · One control at random.** A long press (phone) or Ctrl-click
  (desktop) on a control's label.
- **E4 · An author's default locks.** A preset or graph can ship with locks
  set (Filter Forge's "Reset Locks to Default").
  - Depends on: H2.

### F · Primitives still missing (Filter Forge's list, ordered by what they unlock)

- **F2 · Glyph Scatter, the rest.** Scatter (Marks) exists: dots, rings,
  stars, crosses, dashes, diamonds, sparks, drawn sigils or any picture, with
  where/which-way maps and per-mark outputs. Still to do:
  - glyphs from symbolLore.js in web fonts (a canvas pass on the page, see
    ON_PAGE);
  - layers (which mark is on top) and a per-mark color input.
- **F3 · Border Mask from the inset box.** Border Mask frames the page's
  edges; the box's edges wait for G5 (ctx.box from the renderer, like
  ctx.text).
- **F4 · Noise Gradient.** (Gradient Map with five stops and Spectrum are
  done.)
- **F5 · Channels.**
  - Extract/Assemble HSB and Lab (RGB exists as Split/Merge).
  - Alpha is a design decision: the Athanor has no alpha today. Park it
    unless needed.
- **F6 · More noises and patterns.**
  - Noises: Blocks, Pyramids, Stones, Techno.
  - Patterns: Tiles, Pavements, Ellipse (Orbit Script wants true ellipses),
    Polygon. (Grid & Dots covers checker, grid lines, dots, hex dots,
    diamonds and stripes.)
  - The Basics' chains can become starters using them.
- **F7 · Processing.**
  - Median, Percentile, Refraction (needs F1), Smudge.
  - Map Switch: choose among N pictures by a map.
  - Multiblend.
  - (Displace by a map's slope is done: Displace.)
- **F8 · Transform.** Rotate and Scale as their own parts (Tile & Rotate does
  both today), Flip, Perspective.
- **F9 · The rest of RGB Math.** Abs, floor/ceil/round, lerp, log, if. Done
  so far: divide, power, average, screen, modulo, sine.
- **F10 · Curve ops still missing.** Transition, Fade, Bezier, and Circular
  Arc variants (Bezier needs D4's editor).

### G · The poem as an input (Ruby's future-directions doc)

Done: The Poem (words, distance, lines, stanzas, rhymes), Text Clearing,
Ripples from the Words.

- **G2 · Punctuation positions.** A layout of points where punctuation sits,
  for "Punctuation Particles". Needs F2 to scatter from them.
- **G3 · What the text sits on.**
  - Inputs: the ink color (foreground), and the luminance behind the text.
  - A Protect Text action raises Text Clearing until each run reaches a
    minimum contrast (pmlVars has the 3:1 test).
- **G4 · Emotional Seed.** One knob driving color, density, turbulence and
  contrast together.
  - Depends on: A3 (a group whose one input fans out through remappers).
- **G5 · The inset box as an input** (shared with F3).

### H · The three levels (Ruby's future-directions doc)

- **H1 · Preset level.**
  - Done: thumbnail, seed, intensity (opacity), the chooser.
  - To add:
    - **Summon Variation** (the Surface die, as usual);
    - **Mutate Gently** (every die, gently, at once);
    - **Freeze This Seed** (the seed's lock, surfaced as an action);
    - **Reveal Spell Graph**: opens the texture's chain in the Athanor,
      which exists today as Start from…. Make it a button on the Surface
      card.
- **H2 · Presets as graphs with exposed settings.** A preset stores:
  - its graph;
  - its exposed controls (4–8, by D1/D2);
  - its default seed and palette bindings (which hues follow the accents);
  - its recommended blend;
  - a readability profile (a Text Clearing amount, a contrast target).

  "Customize Surface" shows only the exposed controls; "All settings" shows
  the rest.
  - Depends on: A3, D1, D2, and the texture being a chain (27 still aren't:
    bokeh astral flowers glassrain sigils mathnoise summoning inkbleed
    oldpaper crystal spangle coldpress cupring guilloche chladni suminagashi
    frost ash dunes kintsugi moss cityscape blackhole water moon aurora
    tessellate).
  - PERSISTED keys stay frozen: a preset-as-graph saves through forgeGraph
    and the existing keys.
- **H3 · Crossbreed.** Two graphs with Surfaces: the result takes one's
  picture chain and the other's height chain, or blends their Surfaces by a
  noise mask.
  - Depends on: H2. Offer only between graphs both of which are chains.
- **H4 · Bind to Ink.** The surface's hues follow the text color
  (palette.js). This is a palette binding (H2) set by one action.

### I · Surfaces from the document (Stage 3: as textures in the menu, each with four readings; presets wait for Stage 4)

All 36 exist as **Surface Studies** (athanorStudies.js; Start from… →
Surface Studies): graphs of general parts with TEACH and Knobs, first
drafts tuned by eye. Stage 3 turns each into a texture: a chain in chains.js
(knobs bound to sliders), four readings, alt-text words, a fingerprint. Its
study stays as the graph to learn from.

| Study | Status | What it waits for |
|---|---|---|
| Moonlit Fibers, Ink Thirst, Carbon Copy, Dead Channel, Compression Garden, Drowned Light, Lichen Signal, Misremembered Grid, CRT Séance, Poured Mineral, Broken Rosette, Holographic Foil, Polarized Dream, Memory Leak, No-Signal Halo, Frozen Breath, Salt Bloom, Registration Ghost, Thermal Receipt, Sigil Weather, Packet Rain, Impossible Cartography, Cathedral Interference, Breath on Glass, Terminal Afterimage, Cracked Lacquer | a graph of general parts | Stage 3: become textures |
| Mycelial Letter, Aether Current | general parts plus a process primitive (Tendrils, Flow Lines) | nothing: process primitives stay single parts (§J) |
| Letterpress Bed, Moth-Eaten Velvet, Scar Tissue | lit by the Light Engine | B1 (a lit Surface) to be at their best |
| Deep-Space Dust | general parts | F4 Noise Gradient would give its color drift |
| Constellation Without Stars | **approximation**: Cells edges stand in for star lines | a Delaunay-edges part (F6) |
| Orbit Script | **approximation**: radial rings, sigils scattered on them | F6 Ellipse; writing along a path |
| Transmutation Engine | **approximation**: rings, folded spokes, ring marks | a circle-diagram part (glyphs at stations), after J's Transmutation Circle |
| Magnetic Aurora | uses Starfield and Aurora Curtains, whole-sky parts | J: Curtains taken apart |

### J · Black boxes to take apart (Ruby: "a good start")

A **process primitive** is one algorithm someone reaches for on its own: it
stays one part. Discharge (Laplacian growth), Growing Line (differential
growth), Turing Pattern (Gray–Scott), Tendrils (space colonization),
Knotwork, Flow Lines, Terrain.

A **whole-texture part** draws a finished picture and hides its working. Each
comes apart into general parts plus, at most, one process primitive:

| Part | Comes apart into |
|---|---|
| Texture from the Menu | nothing: it stays for old graphs; every texture becomes a chain (Stage 3), so a graph never needs it |
| Panes · Glass (Stained Glass) | Cells-like panes (Voronoi with a window outline), Threshold lead, Gradient Map glass, Light Engine |
| Deal · Table (Cartomancy) | Scatter of card shapes (F2 layers), a card-face part, the Light Engine for shadows |
| Painted Sky · Painted Ridges (Landscape) | Gradient + Perlin sky; ridges as stacked Profile Gradients through Noise curves; Watercolour Wash |
| Particles (Snow, Mana, Dust) | Scatter with glow (dots, sparks), Blur, screen |
| Smoke | Perlin warped by Perlin, Levels, Motion Blur |
| Aurora Curtains · Starfield | curtains as Profile Gradients along a warped curve, rays as Motion Blur of noise; stars as Scatter (sparks) |
| Oil Paint · Angry Strokes | Scatter of strokes (dashes) turned by a flow map, Light Engine |
| Matrix (Veins of Light) | Cells, Perlin and Threshold for its "ways" |

Prove each: compare.mjs sheets to Ruby; a pixel-identical rebuild needs no
approval, a changed one does.

---

## 3 · Order of work: four stages, presets last (Ruby)

Ruby's order: **build the components, then the new features, then the new
textures with the node components, then the presets.** A preset is the last
thing made, because it is a look *over* everything else. Made earlier, it
would have to be remade each time a part or a texture changed under it.

**Until Stage 4: no new presets, and no preset removed or reworked.** A new
texture ships with its four readings (🜂 🜄 🜁 🜃, which are not presets) and
no preset of its own. Questions about presets (which are redundant or
superseded) wait for Stage 4.

### Stage 1 · Components: the parts library
- **F2** Glyph Scatter's rest, **F3** from the box.
- **F4–F10**, the rest of Filter Forge's primitives, in the order of what
  they unlock (§2 F).
- **A1** map inputs on every per-point setting.
- **A9** the older Variant params onto Variation.
- **A10** ports saved by name (with A3's v4: both change the format once).
- **A3** Groups (v4), then **A4** Loop (its body is a group).
- **A6** edges-only supersampling.

### Stage 2 · Features: the engine, the controls, the poem
- **B1** a lit Surface (CPU and shader together), then **B2** channels view.
- **C1–C4** lighting (C needs B1).
- **D1** control kinds, **D2** order of controls, **D3** remap UI,
  **D4** curve control.
- **E3** one control at random (E1 levels and E2 Back are done).
- **G2** punctuation (needs F2), **G3** Protect Text,
  **G4** Emotional Seed (needs A3), **G5** the box as an input.
- **H1**'s actions that aren't presets: Summon Variation, Mutate Gently,
  Freeze This Seed, Reveal Spell Graph.

### Stage 3 · Textures: built from the parts
- **I**: the 36 Surface Studies become textures in the menu, each a chain
  with four readings. The approximations wait on their parts (§2 I).
- **J**: whole-texture parts taken apart (§2 J), each through compare.mjs and
  Ruby's approval when its look changes.
- **Rebuild the 27 textures that aren't chains yet**, so every texture is a
  graph:
  - bokeh astral flowers glassrain sigils mathnoise summoning inkbleed
    oldpaper crystal spangle coldpress cupring guilloche chladni
    suminagashi frost ash dunes kintsugi moss cityscape blackhole water
    moon aurora tessellate.
  - Each keeps its exact look: the fingerprints must not change.
  - Stage 4 can only offer what is a chain.

### Stage 4 · Presets: the last pass
- **H2** presets as graphs with exposed settings (needs A3, D1, D2 and every
  texture a chain).
- **H3** Crossbreed, **H4** Bind to Ink, **E4** an author's default locks.
- **The presets pass**:
  - Ruby decides which presets are redundant or superseded.
  - Old presets are reworked onto the new parts and features.
  - New presets are made for the Stage 3 textures, as many as the groups
    need (each group a multiple of four; readable, contrast ≥ 3:1).
  - Andromeda, Euphoria, Lotus Bloom, Gateway and Sealed stay verbatim.

```
 STAGE 1 · COMPONENTS        STAGE 2 · FEATURES                 STAGE 3 · TEXTURES          STAGE 4 · PRESETS
 F2 Glyph Scatter (rest) ───► G2 punctuation ─────────────────► I studies → textures ───┐
 F3 from the box ────────────► G5 box input                      J black boxes apart  ───┤
 F4–F10 primitives ──────────────────────────────────────────► I's approximations    ───┤
 A1 map inputs · A9 Variant→Variation · A6 AA                    27 rebuilt as chains ───┼─► H2 PRESETS AS GRAPHS
 A3 GROUPS (v4) ─┬─► A4 Loop                                                             │      ├─► H3 Crossbreed
                 └──────────► G4 Emotional Seed                                          │      ├─► H4 Bind to Ink
                              D1 control kinds ─► D2 order ─► D4 curve control ──────────┤      ├─► E4 author locks
                              D3 remap UI · E3 one at random · H1 actions  ──────────────┘      └─► THE PRESETS PASS
                              B1 LIT SURFACE ─► B2 channels; ─► C1 ─► C2 ─► C4; C3
                              G3 Protect Text
```

**Suggested passes** (one release each, AGENTS' recipe):

1. Stage 1: A3 Groups (v4) + A1 (the remaining map inputs).
2. Stage 1: F6 noises and patterns (Ellipse, Delaunay edges) + F2's rest.
3. Stage 2: D1–D3 controls + E3 one control at random.
4. Stage 2: B1 lit Surface + B2 channels; then C1–C4.
5. Stage 2: G2–G5 + H1's actions.
6. Stage 3: the Surface Studies become textures, a few per pass; black boxes
   taken apart and the 27 rebuilt as chains, two or three per pass.
7. Stage 4: H2, H3, H4, E4, then the presets pass.

The stages overlap at their edges: a texture whose parts all exist may be
built while the next part is being written. The order that matters is that
**presets come last**.

---

## 4 · Rules of the road for these items

- A change in what a graph draws → a new ATHANOR_VERSION. Starters take the
  newest; texture chains keep theirs (their pictures never change).
- A new part needs: STEP_PARTS entry, STEP_RUN, a STEP_DOCS sentence (teacher
  to student), STEP_IO for non-field ports, STEP_COST, STEP_REQUIRED if it
  needs its first input, a test in test/filterforge.test.mjs or its own file,
  and a render looked at by eye.
- A new wire kind: VALUE_TYPES, FORGE_TYPE_COLOURS/NAMES, `--t-<kind>` in
  both themes, help text, and conversions in athanor.js (asField, asImage,
  num).
- The light engine's CPU and WebGL2 paths change together and are compared.
- A control on the page follows the persistence rule; a preference (folded
  groups, chooser thumbnails) lives in localStorage, never in a look.
- Phones first: the Moto G Stylus 5G (2022) is the baseline. Time it there,
  or say it wasn't.
