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
| Parameter mapping (a picture on a setting varies it point by point) | ⚙ ports. In v3 graphs a map is per point for the settings a part declares (`maps`; the wiki marks them "by point"); v2 graphs average it | ✅ (a setting that can't vary, such as a count of octaves, takes the average) |
| Remappers (limit or reverse a control's range per target; one slider, many ranges) | `'~key': 'lo,hi'` per wired ⚙ (lo > hi reverses) | ✅ engine; ⇄ Reverse and two handles in the menu (Saturn–Erriapus) |
| Required inputs (red; a stand-in image keeps the rest working) | `STEP_REQUIRED`: a red port with "!", and a "!"-in-a-circle stand-in in step previews only | ✅ |
| Result: Simple vs Surface (lit by Surface Color, Height, Reflectivity, Reflection Blur, Metallic) | Surface: picture, height, reflectivity, reflection blur, metallic and emission (Saturn–Albiorix); the Light Engine as a part | ✅ (environment reflections: C4) |
| Render channels (Final, Diffuse, Bump, Normal, Specular, Metallic, Occlusion) | Step previews show each part's first output | **B2** |
| Global Size (all distances relative; resolution-independent) | Canonical pixels everywhere; the Surface's **Size** (25–400) scales a graph | ✅ |
| Global Variation (one seed into every random part, plus each part's own) | The page seed; v2 seeds each node from (seed, id); every random part has a Variation | ✅ |
| Seamless Tiling | Not needed: a page is not tiled | parked |
| Anti-aliasing: supersampling, "edges only" by AA zones | The Surface's Anti-aliasing: edges only (FXAA on the grid), all pixels (a grid twice as fine, within the budget) | ✅ (Saturn–Bebhionn) |
| Lighting tab: HDRI environment, ambient color, any number of area lights (color, negative light, backlight, angular width, diffuse/specular influence), ambient and reflective occlusion with a quality setting | One dial light, ambient, materials (Highlight, Shade, Diffuse hues), soft shadows, AO | **C1–C4** |
| Control components (Slider, IntSlider, Angle, Checkbox, Value, Color, Grayscale, Curve control); only those reaching the Result are shown; order of controls | Knob (8 slots), Hue (2), Curve Control (2 pads), Accent, Number, Random Number, Light Dial. Only controls reaching the Surface are offered | ✅ (the Angle's dial, the Curve Control: Saturn–Erriapus) |
| Groups (control components inside a group define its inputs) | **Group** parts: their insides a module of the editor's; each Group Input and Knob inside an input, the Group Result its outputs; laid out flat before drawing | ✅ (Saturn–Paaliaq) |
| Loop and its slaves (Iteration, Accumulated, Randomizer); Bitmap Cache; Lua script components | A group's Repeats (the first result fed back as Accumulated; an Iteration part); results kept automatically (ATHANOR_KEPT) | ✅ (Saturn–Albiorix); scripts parked (security) |
| Note component | **Note** part | ✅ |
| Randomizer: Next Variant / Back, per-parameter locks, Ctrl-click one setting, High/Medium/Low levels (color relationships kept) | A die and a lock on every section, with Gently / As usual / Wildly and Back; Ctrl-click (or hold) a control's name to roll it alone | **E4** |
| Presets tab (snapshots of a filter's settings) | Presets, readings (🜂 🜄 🜁 🜃), Grimoire, kept surfaces | **H2** |
| Obsolete component versions kept for old filters | Graph `v`, RETIRED ids, hidden options | ✅ |

---

## 2 · Work items

Each item lists its **files**, what it **depends on**, and how to **prove** it.
IDs are for cross-reference. They are not priorities (see §3 for the order).

### A · The engine (athanor.js, steps.js)

- **A7 · Anti-aliasing for the menu's textures.** The Surface's Anti-aliasing
  is for graphs; a texture's chain stays v2 and draws as it always did. A
  reading or a knob could switch it on for the hard-edged textures (Circuit
  Board, Stained Glass, Knotwork), each through compare.mjs and Ruby's eye.
  - Measure on the baseline phone first: all pixels is four times the work.

### B · The output stage (the Surface)

- **B2 · Channels in the Athanor preview.** A selector under the preview:
  Final, Height, Normal, Occlusion, Specular.
  - View only, for understanding a surface; no export.

### C · Lighting (texCore.js lightHeights + shader; the dial UI)

- **C1 · Ambient light color.** A hue for the light that comes from
  everywhere. Its "none" draws exactly as today (colour roles rule).
- **C2 · More lights.** A rim light or backlight beside the dial's light:
  color (negative allowed: it draws light out), softness (Filter Forge's
  angular width), diffuse-only or specular-only.
  - Depends on: C1.
  - Prove: GPU = CPU; with one light, fingerprints unchanged.
- **C3 · Occlusion quality.** Low, medium or high presets for the AO march
  and the shadow trace, chosen per device. The baseline phone uses medium.
- **C4 · An environment from the page, everywhere.** The lit Surface already
  reflects a sky over a ground (the page's backdrop when the graph has a Page
  Backdrop, else its two hues). Still to do: the Light Engine and the
  textures' own lighting reflecting it too.
- **C5 · The camera dial for other textures** (a standing goal: AGENTS
  "The two dials"; Ruby: any tilt, pan or position slider belongs on the
  camera dial, any light on the light dial). Done for Lichtenberg Figures,
  Ringworld, Broken Glass, Scrying Pool, Dune Ripples and Moss on Stone.
  Still to judge, each by its renders:
  - Rain on Water: its View knob, but rain is the same every way round,
    so the dial's Turn would change nothing. It needs a turn that means
    something first (the wind driving the rain, a far bank) or a dial
    without one.
  - Contour Map and Painted Landscape (a land seen from above or across;
    Painted Landscape's Tilt);
  - Black Hole (the camera's orbit) and Night City (where you stand);
  - Knotwork, Ruffled Growth and Discharge's Slide (a position along the
    light dial's line): a pan, perhaps, if it stays intuitive.
  - Prove: at the old knob's values the picture is unchanged (fingerprints).

### E · The randomizer

- **E4 · An author's default locks.** A preset or graph can ship with locks
  set (Filter Forge's "Reset Locks to Default").
  - Depends on: H2.

### F · Primitives still missing (Filter Forge's list, ordered by what they unlock)

- **F5 · Alpha** is a design decision: the Athanor has no alpha today. Park
  it unless needed. (Channels as RGB, HSB and Lab are done.)
- **F7 · Refraction** (needs F1).
- **F11 · Shader parts** (Ruby: the pixel-shader parts, Oil Paint and the
  per-pixel blends, are fast and versatile): more parts run as fragment
  shaders on the GPU, with the CPU path beside each (AGENTS §5.5), and a way
  to make new ones from shader parts.
- **F10 · Bezier curves**: handles on the Curve Control's points (its pad is
  the editor), for curves a monotone cubic can't make.

### G · The poem as an input (Ruby's future-directions doc)

Done: The Poem (words, distance, lines, stanzas, rhymes), Text Clearing,
Ripples from the Words, Protect the Text, Ink.

- **G2 · Punctuation positions.** A layout of points where punctuation sits,
  for "Punctuation Particles", for Scatter to throw marks from.
- **G4 · Emotional Seed.** One knob driving color, density, turbulence and
  contrast together.
  - A group whose one input fans out through remappers.
- **G6 · Text as a mask** (Ruby). Done: letters filled with a surface (the
  second surface's Blend with Text, with Shape Aware), Text Aware for each
  surface, Shape Aware round the words on the page, and Cut Out by Text.
  Still to do: the letters' own shape (not only the lines' boxes) as a mask
  any part can take, which means handing the worker the glyph mask. More
  parts that answer Shape Aware (Ruby: "literally anything that generates
  high contrast patterns all over the page") as they are touched.

### H · The three levels (Ruby's future-directions doc)

Done: H1, the preset level (thumbnail, seed, intensity, the chooser; Summon
Variation, Mutate Gently and Freeze This Seed above the presets; 🜉 Open in
the Athanor).

- **H2 · Presets as graphs with exposed settings.** A preset stores:
  - its graph;
  - its exposed controls (4–8, by D1/D2);
  - its default seed and palette bindings (which hues follow the accents);
  - its recommended blend;
  - a readability profile (a Text Clearing amount, a contrast target).

  "Customize Surface" shows only the exposed controls; "All settings" shows
  the rest.
  - Depends on: D1, D2, and the texture being a chain (Stage 3 lists
    those that aren't yet).
  - PERSISTED keys stay frozen: a preset-as-graph saves through forgeGraph
    and the existing keys.
- **H3 · Crossbreed.** Two graphs with Surfaces: the result takes one's
  picture chain and the other's height chain, or blends their Surfaces by a
  noise mask.
  - Depends on: H2. Offer only between graphs both of which are chains.
- **H4 · Bind to Ink.** The surface's hues follow the text color
  (palette.js). This is a palette binding (H2) set by one action.

### I · Surfaces from the document (Stage 3: as textures in the menu, each with four readings; presets wait for Stage 4)

All 36 exist as **Surface Studies** (athanorStudies.js; Open →
Surface Studies): graphs of general parts with TEACH and Knobs, first
drafts tuned by eye. Stage 3 turns each into a texture: a chain in chains.js
(knobs bound to sliders), four readings, alt-text words, a fingerprint. Its
study stays as the graph to learn from.

| Study | Status | What it waits for |
|---|---|---|
| Moonlit Fibers, Ink Thirst, Carbon Copy, Dead Channel, Deep-Space Dust, Constellation Without Stars, Compression Garden, Drowned Light, Lichen Signal, Misremembered Grid, CRT Séance, Poured Mineral, Broken Rosette, Holographic Foil, Polarized Dream, Memory Leak, No-Signal Halo, Frozen Breath, Salt Bloom, Registration Ghost, Thermal Receipt, Sigil Weather, Packet Rain, Impossible Cartography, Cathedral Interference, Breath on Glass, Terminal Afterimage, Cracked Lacquer | a graph of general parts | Stage 3: become textures |
| Mycelial Letter, Aether Current | general parts plus a process primitive (Tendrils, Flow Lines) | nothing: process primitives stay single parts (§J) |
| Letterpress Bed, Moth-Eaten Velvet, Scar Tissue | lit by the Light Engine | the lit Surface's material maps, to be at their best |
| Orbit Script | Ellipse rings, sigils scattered along them | writing along a path |
| Transmutation Engine | **approximation**: rings, folded spokes, ring marks | a circle-diagram part (glyphs at stations), after J's Transmutation Circle |
| Magnetic Aurora | uses Starfield and Aurora Curtains, whole-sky parts | J: Curtains taken apart |

### J · Black boxes to take apart (Ruby: "a good start")

A **process primitive** is one algorithm someone reaches for on its own: it
stays one part. Discharge (Laplacian growth), Differential Growth (on a spatial
hash), Turing Pattern (Gray–Scott), Tendrils (space colonization),
Knotwork, Flow Lines, Terrain.

A **whole-texture part** draws a finished picture and hides its working. Each
comes apart into general parts plus, at most, one process primitive:

| Part | Comes apart into |
|---|---|
| Texture from the Menu | nothing: it stays for old graphs; every texture becomes a chain (Stage 3), so a graph never needs it |
| Panes · Glass (Stained Glass) | Cells-like panes (Voronoi with a window outline), Threshold lead, Gradient Map glass, Light Engine |
| Deal · Table (Cartomancy) | Scatter of card shapes (its On Top layers), a card-face part, the Light Engine for shadows |
| Painted Sky · Painted Ridges (Landscape) | Gradient + Perlin sky; ridges as stacked Profile Gradients through Noise curves; Watercolour Wash |
| Particles (Snow, Mana, Dust) | Scatter with glow (dots, sparks), Blur, screen |
| Smoke | Perlin warped by Perlin, Levels, Motion Blur |
| Aurora Curtains · Starfield | curtains as Profile Gradients along a warped curve, rays as Motion Blur of noise; stars as Scatter (sparks) |
| Oil Paint · Paint Swipes | Scatter of strokes (dashes) turned by a flow map, Light Engine |
| Growth Medium (Veins of Light) | Cells, Perlin and Threshold for its "ways" |

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
- **F7, F10**, the rest of Filter Forge's primitives, in the order of
  what they unlock (§2 F).

### Stage 2 · Features: the engine, the controls, the poem
- **B2** channels view.
- **C1–C4** lighting; **C5** the camera dial on more textures.
- **G2** punctuation, **G4** Emotional Seed.

### Stage 3 · Textures: built from the parts
- **I**: the 36 Surface Studies become textures in the menu, each a chain
  with four readings. The approximations wait on their parts (§2 I).
- **J**: whole-texture parts taken apart (§2 J), each through compare.mjs and
  Ruby's approval when its look changes.
- **Rebuild the textures that aren't chains yet**, so every texture is a
  graph. The list (menu ids; test/hygiene keeps it the code's, so delete
  one here when it becomes a chain):
  <!-- not-chains -->
  - astral (Deep Field: two layers, each blended with the page in turn, so
    it needs a graph that can hand the page more than one layer)
  <!-- /not-chains -->
  - Each keeps its exact look: the fingerprints must not change.
  - Stage 4 can only offer what is a chain.

### Stage 4 · Presets: the last pass
- **H2** presets as graphs with exposed settings (needs D1, D2 and every
  texture a chain).
- **H3** Crossbreed, **H4** Bind to Ink, **E4** an author's default locks.
- **The presets pass**:
  - Ruby decides which presets are redundant or superseded.
  - Old presets are reworked onto the new parts and features.
  - New presets are made for the Stage 3 textures, as many as the groups
    need (each group a multiple of four; readable, contrast ≥ 3:1).
  - Andromeda, Euphoria, Lotus Bloom, Gateway and Sealed stay verbatim.
  - The presets use what has been built (Ruby): the text as an input (Text
    Clearing, Protect the Text, Ink, G6), the lit surfaces and the shader
    parts.
  - Sky scenes (Ruby may make these here): a day sky and weather, the light
    from the dial; clouds mostly, now and then something flying across
    (aircraft and contrails, birds, balloons, dragons, witches), seeded.
  - Presets for Ringworld (Ruby: in this pass), Rain on Water, Circuit
    Board's eras and Markings, Lichtenberg's camera, and Under Glass over
    another surface (Two Surfaces).

```
 STAGE 1 · COMPONENTS        STAGE 2 · FEATURES                 STAGE 3 · TEXTURES          STAGE 4 · PRESETS
 Scatter ───────────────────► G2 punctuation ─────────────────► I studies → textures ───┐
                                                                J black boxes apart  ───┤
 F5–F10 primitives ──────────────────────────────────────────► I's approximations    ───┤
 A7 AA for textures                                            Deep Field (layers)   ───┼─► H2 PRESETS AS GRAPHS
 (groups, loops) ─┬───────                                                              │      ├─► H3 Crossbreed
                 └──────────► G4 Emotional Seed                                          │      ├─► H4 Bind to Ink
                              (controls: dial, two handles, curves) ─────────────────────┘      ├─► E4 author locks
                                                                                                └─► THE PRESETS PASS
                              B2 channels ─► C1 ─► C2 ─► C4; C3
```

**Suggested passes** (one release each, AGENTS' recipe):

1. Stage 2: B2 channels; then C1–C4.
2. Stage 2: G2, G4.
3. Stage 1: F7 Refraction (with F1), F10 Bezier curves.
4. Stage 3: the Surface Studies become textures, a few per pass; black boxes
   taken apart and the rest rebuilt as chains, two or three per pass.
5. Stage 4: H2, H3, H4, E4, then the presets pass.

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
