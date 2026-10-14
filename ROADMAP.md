# ROADMAP — the surface engine, from here

A plan for agents (and people) carrying the texture system forward. It merges
two concept documents Ruby gave:

1. **The future-directions document**: the three levels of complexity, the
   poetry-specific inputs, the preset system and 36 surface ideas.
2. **The Filter Forge help pages** (the project's prior art): its components,
   its rendering engine, its output stage, its controls and remappers, its
   randomizer.

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
| Randomizer: Next Variant / Back, per-parameter locks, Ctrl-click one setting, High/Medium/Low levels (color relationships kept) | A die and a lock on every section; undo | **E1–E4** |
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
- **A9 · Variation on every random part.** A `variation` param (0–99) mixed
  into the node's seed, as Filter Forge's local Variation. The existing
  Variant params map onto it.
  - Prove: two Perlin Noises in one graph differ with different Variation;
    old graphs unchanged (default 0 = today's stream).

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

- **E1 · Levels.**
  - Low: Mutate Gently. Sliders move ±8% of their range; menus and switches
    stay; hues turn together.
  - Medium: today's die.
  - High: menus too, and hues independently.
  - Files: appEvents rollSection.
  - **Ask Ruby** where the choice lives (long press on the die, or a menu
    beside it). It is a UI decision.
- **E2 · Back.** A die's own undo: one press returns the section as it was.
  Today it is undo's general step.
- **E3 · One control at random.** A long press (phone) or Ctrl-click
  (desktop) on a control's label.
- **E4 · An author's default locks.** A preset or graph can ship with locks
  set (Filter Forge's "Reset Locks to Default").
  - Depends on: H2.

### F · Primitives still missing (Filter Forge's list, ordered by what they unlock)

- **F1 · Lookup.** Sample a picture at coordinates given by two gray maps.
  It unlocks refraction, holographic foil, polarized interference and
  Memory Leak.
- **F2 · Bomber / Glyph Scatter.** Scatter copies of a picture or a glyph:
  - count, size, rotation and layer, each randomizable;
  - per-particle outputs (Filter Forge's Bomber Plus slaves);
  - glyphs from spell.js and symbolLore.js, so in a canvas pass on the page:
    web fonts, see ON_PAGE.
  - Unlocks: Sigil Weather, Packet Rain, Letterpress Bed's stray
    impressions, Broken Rosette.
- **F3 · Border Mask.** A soft frame from the page's edges, or from the
  inset box's edges (ctx.box from the renderer, like ctx.text).
  - Unlocks: Frozen Breath, Salt Bloom, No-Signal Halo, Registration Ghost.
- **F4 · Gradients.**
  - 3- and 5-color gradients, and a Color Ramp with more stops (Filter
    Forge's Elevation Gradient).
  - Spectrum.
  - Noise Gradient.
- **F5 · Channels.**
  - Extract/Assemble HSB and Lab (RGB exists as Split/Merge).
  - Alpha is a design decision: the Athanor has no alpha today. Park it
    unless needed.
- **F6 · More noises and patterns.**
  - Noises: Blocks, Pyramids, Stones, Techno.
  - Patterns: Checker, Tiles, Pavements, Ellipse, Polygon.
  - The Basics' chains can become starters using them.
- **F7 · Processing.**
  - Median, Percentile, Refraction (needs F1), Smudge.
  - Map Switch: choose among N pictures by a map.
  - Multiblend.
  - Displace by a map's slope.
- **F8 · Transform.** Rotate and Scale as their own parts (Tile & Rotate does
  both today), Flip, Perspective.
- **F9 · The rest of RGB Math.** Abs, floor/ceil/round, lerp, log, if. Done
  so far: divide, power, average, screen, modulo, sine.
- **F10 · Curve ops still missing.** Transition, Fade, Bezier, and Circular
  Arc variants (Bezier needs D4's editor).

### G · The poem as an input (Ruby's future-directions doc)

Done: The Poem (words, distance, lines, stanzas), Text Clearing, Ripples
from the Words.

- **G1 · Rhyme groups.** A mask per rhyme letter (`~A`, `~B`), from the
  layout's per-line rhyme letter. TEXT_LAYOUT gains a 7th field; the parser
  must keep old layouts.
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
    - **Summon Variation** (E1 medium on the surface only);
    - **Mutate Gently** (E1 low);
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

### I · Surfaces from the document (build as chains, each with TEACH and four readings)

Buildable **now** with existing parts:
- **Ink Thirst**: Perlin → Levels → Grow & Shrink (feathered) → multiply.
- **Moonlit Fibers**: Value Noise → Motion Blur → High Pass → Threshold
  (soft) → Tint.
- **Carbon Copy**: Perlin → Motion Blur (pressure bands) → Tint (blue-black),
  with erased patches by Cells.
- **Dead Channel**: Perlin → Motion Blur (vertical) → Posterize → Chromatic
  Offset.
- **Compression Garden**: Pixelate (squares) → Chromatic Offset → Sharpen
  (ringing).
- **Drowned Light**: Cells edges → Warp → Blur → screen.
- **Lichen Signal**: Cells at three scales → Math → Ramp.
- **Misremembered Grid**: Waves (two) → Math max → Warp → dropout by Cells id.
- **Mycelial Letter**: Tendrils over the poem's distance (G is done).
- **Aether Current**: Flow Lines bent by the poem's distance (an Angle Map
  input).
- **CRT Séance**: Waves (scanlines) → Twirl at the edges (curvature) →
  Chromatic Offset → glow.
- **Poured Mineral**: Agate starter + Profile Gradient along a distance field.

Need **F1 Lookup**: Polarized Dream, Holographic Foil, Memory Leak.

Need **F2 Bomber/Glyph Scatter**: Sigil Weather, Packet Rain, Letterpress Bed,
Broken Rosette, Constellation Without Stars (plus a Delaunay-edges part).

Need **F3 Border Mask**: Frozen Breath, Salt Bloom, No-Signal Halo,
Registration Ghost.

Need **B1 lit Surface** to be at their best: Letterpress Bed, Moth-Eaten
Velvet, Scar Tissue, Thermal Receipt (heat bloom as emission).

Already exist (rebuild as chains when touched): Transmutation Engine (=
Transmutation Circle → a node group, A3), Magnetic Aurora (Aurora),
Cracked Lacquer (Fractured Glaze), Breath on Glass (Rain on Glass + poem
distance).

---

## 3 · Order of work (what depends on what)

```
             ┌──────────── F1 Lookup ─────────► I (foil, polarized, memory leak)
             ├──────────── F2 Bomber ─────────► I (sigil weather, packet rain…) ─► G2
 (today) ────┼──────────── F3 Border Mask ────► I (frozen breath, salt bloom…)
             ├── A1 map inputs (anytime, small, per part)
             ├── A9 Variation ─────────────────────────────┐
             ├── D1 control kinds ─► D2 order ─┐           │
             │                      D3 remap UI│           │
             ├── A3 GROUPS (v4) ───────────────┼─► H2 PRESETS AS GRAPHS ─► H3 Crossbreed
             │        └─► A4 Loop             │           │              └─► E4 author locks
             │        └─► G4 Emotional Seed   │           └─► H1 Summon / Mutate (with E1)
             ├── E1 randomizer levels (ask Ruby where) ───┘
             ├── B1 LIT SURFACE (CPU + shader) ─► C1 ambient ─► C2 more lights ─► C4 environment
             │        └─► B2 channels view                 └─► C3 occlusion quality
             └── G1 rhymes · G3 Protect Text (needs ctx ink + luminance)
```

**Suggested passes** (one release each, AGENTS' recipe):
1. F3 Border Mask + G1 rhymes + I: the eight "buildable now" surfaces, as
   chains with presets.
2. D1 control kinds + D3 remap UI + E1–E3 (after asking Ruby about E1's
   placement).
3. A3 Groups (v4) + G4 Emotional Seed as its first lesson.
4. B1 lit Surface (CPU + GPU together) + B2 channels.
5. F1 Lookup + F2 Bomber (+ the surfaces they unlock).
6. H2 presets as graphs (start with the textures already chains) + H1
   actions + D2.
7. C1–C4 lighting, then H3 Crossbreed, A4 Loop, A6 edges-only AA, the
   remaining F items.

Alongside every pass: **rebuild one or two of the 27 remaining textures as
chains** (the componentizing rule). H2 can only offer what is a chain.

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
