# The renderer pass: every surface onto the new renderer

Ruby (2026-10-20): "Create a comprehensive plan to improve every surface not yet improved with the new renderer
features (for after current roadmap items before the presets pass)."

This plan sits in ROADMAP Stage 3. It starts once the current roadmap items are done, and it ends before Stage 4,
the presets pass.

**What "the new renderer" means.**
- A surface is a chain of general parts, with at most one process part.
- It is made as maps (albedo, height or normals, gloss, translucency, emission) and lit by the Light Engine.
  It is never drawn already lit.
- Every colour comes from a hue input.
- The light dial moves the light, and anything with a position uses the camera dial.
- The seed gives real variety.
- Tools that exist today:
  - the Light Engine, with a second light, the light hue, translucency maps and (2026-10-20) a Normal Map input;
  - Lens Blur on the GPU;
  - Scatter, Curves, Profile Gradient, Streamers, Grass Blades, Bloom and Specimen (floraKit);
  - the painted things kit (paintKit.js);
  - the Surface's reflectivity, metallic and emission maps.

**Where every surface stands today.** The source is the audit of 2026-10-20 (78 visible surfaces):

| Kind | Count |
|---|---|
| Legacy generator in a one-part wrapper | 29 |
| Single-texture parts that draw and light themselves | 16 |
| Graphs with one legacy part still inside | 6 |
| Graphs of general parts, lit from maps | 14 |
| Flat or self-lit by design | 13 |

**Already done, or being done now:**
- On the new renderer:
  - macro, imprints, circuit, veins and lichtenberg;
  - wax, rainwater, petals, bouquets, growth, turing, knotwork and contour;
  - windsea, botline, ditsy, hatch, rainstreaks, halftone, pixelspace, liminal and webb;
  - meadow, and the four light overlays.
- In progress (Ruby to judge):
  - Crystal Leaf: branch `crystal`;
  - Cartomancy: branch `cartomancy`;
  - the Painted Ringworld, Ring in the Sky's land and Night City's skyline: branch `ringpass`.

---

## Phase R0 · The general parts first (each unlocks several surfaces)

Build these before any remake. Without them, each remake would invent its own copy. Each one gets a wiki page and a
test, as AGENTS §8 requires.

| # | Part (or feature) | What it is | Unlocks |
|---|---|---|---|
| R0.1 | **Scatter that carries maps** (C8) | Scatter stamps a picture's albedo, height, gloss and translucency together, so each thing it lays is lit as one object | bouquets, petals, metalleaf, sigils, chladni, magicparticles, embers, snow, feathers |
| R0.2 | **Paper Tooth** | Cold Press taken apart: the paper's fibres and tooth as height, its translucency held to light, a hue for its colour | coldpress, oldpaper, ash, cupring, inkscroll (frees it of the whole Cold Press part), watercolour, botline, suminagashi, inkbleed |
| R0.3 | **Bevel** (distance from an edge, as height) | texCore's `chamferDistance` offered as a part: a mask in, a rounded or chamfered rise out | kintsugi's seams, stainedglass's came, tessellate, cupring's dried rim, guilloche's engraving, the cards' gilt edges |
| R0.4 | **Dome / Sphere** | a height and normals for discs: a lens, a coin, a planet, a bubble, an orb | moon (lit by the dial: its phase from the light), bokeh orbs, pixelspace orbs, Cartomancy's coins, snow globes |
| R0.5 | **Facet Normals** | faceted normals from any Cells or Triangle Mesh: each cell a tilted plane. It feeds the Light Engine's new Normal Map input | tessellate, spangle, crystal (done its own way), stainedglass, metalleaf, broken glass |
| R0.6 | **Starfield and Particles taken apart** (J) | stars as Scatter plus glow plus Lens Blur by depth, laid in sky directions so a camera turns past them (as the Painted Ringworld's stars now pan) | aurorasky, skyring, ringpaint, ringworld, snow, embers, magicparticles, Deep Field |
| R0.7 | **Marbling** | one part for floating ink: drops, combs and breath, traced back exactly as Suminagashi does | suminagashi, inkbleed (Rorschach), and new marbled papers |
| R0.8 | **Environment Reflection** (C4) | the Light Engine reflects the page's backdrop, or a picture (a sky, a room), by each point's normal and gloss, with a Fresnel rise at a slant | water, kintsugi's gold, rainwater, glassrain, spangle, coins, dewwebs |
| R0.9 | **Refraction** (F7) | Displace a picture by a normal map, with a small chromatic split: what is behind glass or water, bent | glassrain, brokenglass, underglass, dewwebs, water, crystal's Inside, raindrop and snow-globe scenes |
| R0.10 | **Emission, wired** | the Surface's emission input used at last: windows, embers and runes giving light rather than being screened on | cityscape windows, embers, magicparticles, summoning, kintsugi's glow, veins |
| R0.11 | **Depth everywhere** | every process part that knows depth hands it on, so Lens Blur and haze can follow | the Room Caster (liminal), Night City, snow, meadow, bokeh, the Painted Ringworld |
| R0.12 | **Paint Detail** | branch `oil-detail` merged: Oil Paint's fine pass, so a painterly finish holds up close | landscape, ringpaint, skyring, brushstrokes, every painted scene in docs/scene-ideas.md |

---

## Phase R1 · The remakes, in order of what each gains

Each remake follows the poetrypress-surface-work routine:
- research its prior art for real;
- build it as a chain of parts, lit from its maps;
- make the review sheet;
- keep it on a branch until Ruby says yes.

Its sliders keep their names wherever they still mean the same. Where they don't, bump LOOK_VERSION and add a
`retireLook` entry.

### R1.1 · Asked for, or plainly behind

**Lotus Pond** (`flowers`)
- Build: Bloom's lotus and water lily (add them to the species list if they are missing) on pads drawn as floraKit
  leaves, on a Waves height for the water.
- Lighting:
  - the Light Engine, with translucency on the petals and the pads;
  - environment reflection on the water (R0.8);
  - each bloom's reflection, upside down and broken by the waves (R0.9).
- The seed's variety: pond, lake or temple basin; dawn, noon or night with lanterns; koi.

**Painted Landscape** (`landscape`)
- Build: ridges from Curves and Profile Gradient, as Sunrise Scroll does; a Gradient and Perlin sky.
- Use the painted kit for trees and buildings, and the Painted Ringworld's camera-stable placement.
- The seed's variety: countries and lands (the OPEN-ISSUES §2 list); water as lake, river, sea or none.
- Real hue inputs.

**Aurora** (`aurorasky`)
- Build: curtains as Profile Gradients along a warped Curve; rays by Motion Blur; stars by R0.6.
- Hue inputs for the oxygen green, the red top and the nitrogen violet hem.
- Use the camera dial for where you stand under it.

**Night City** (`cityscape`)
- Build: the skyline from the kit (begun in `ringpass`); lit windows as emission (R0.10); city bokeh by Lens Blur
  from a depth map; the reflection in the water by R0.9.
- Use the camera dial for where you stand: across the water, on a roof, or at street level.

### R1.2 · The Touch family (lit inside today at fixed settings: consistency, and real maps)

All of these use the Light Engine, so they gain the page's rim light, the ambient hue, gloss and translucency.

| Surface | What it is made of | Maps |
|---|---|---|
| Dune Ripples | Terrain, plus warped Waves for the ripples | troughs wet as gloss; a Journey-style glitter as fine gloss sparkle; already on the camera dial |
| Moss on Stone | Cells stones, moss by Perlin, fronds like Grass Blades | damp gloss; moss translucent |
| Kintsugi | Spreading Cracks, then Bevel (R0.3) for the seams | gold as metallic gloss with environment reflection (R0.8); the glow as emission |
| Metal Spangle | Cells grains and dendrites | Facet Normals (R0.5); a brushed gloss |
| Fractured Glaze | — | its own Glaze engine swapped for the Light Engine, with height and gloss from the glaze map (C7.2) |
| Old Paper | Paper Tooth; Perlin folds and crinkle; age through a Gradient Map | translucency, as paper held to light |
| Burnt Letter | Paper Tooth; the Burn part (Lichtenberg's); a Scatter of flakes (R0.1) | embers as emission |
| Cold Press | Paper Tooth itself | — |
| Cup Ring | Ellipse rings, Displace, a Gradient Map stain | the dried rim by Bevel; a gloss map |
| Hoarfrost | Tendrils- or Discharge-like dendrites | height, gloss and ice's translucency |
| Facet Field | Triangle Mesh | Facet Normals |
| Sigil Scatter | a Scatter of glyph stamps carrying height (R0.1) | ink hues |
| Stained Glass | Cells panes, a Threshold for the lead, a Gradient Map for the glass | translucency (the sun behind); the came by Bevel |
| Guilloché | Curves and Polar Wrap for the rosette lines, Profile Gradient | an engraved height with a metal gloss; environment reflection |

### R1.3 · Water and glass (after R0.8 and R0.9)

**Scrying Pool** (`water`)
- Build: Waves and Perlin height, with high gloss.
- Lighting:
  - environment reflection of the page's backdrop;
  - caustics from Pool Caustics' parts, laid on the bottom and seen through the water by Refraction.

**Rain on Glass**
- Build: the Raindrops part, then Refraction of the Page Backdrop through each drop.
- Lens Blur on the world outside.

**Dewy Webs, Broken Glass, Under Glass**
- Swap their hand-lit glints for Refraction and reflection where it reads better.
- Keep what Ruby already likes. Sheets decide.

### R1.4 · Objects, feathers and particles

**Feathers and Corvid Feathers**
- Branch `feathers` first.
- Each feather as maps: albedo, the rachis and barbs as height, the structural sheen as gloss with the light hue,
  the facing.
- Laid by R0.1, lit by the Light Engine.

**Scattered Polygons**
- A Scatter of Polygons carrying height and gloss (R0.1).

**Chladni Sand**
- A Chladni field part, then a Scatter of grains carrying height.

**Linen Tooth**
- The Weave's shading into height and its sheen into gloss, for the Light Engine.

**Dream Bloom**
- Scatter orbs (R0.4) through Lens Blur, in place of its own convolution (OPEN-ISSUES §6).

**First Snow, Sparkler, Pixie Dust**
- Scatter carrying a depth (R0.6, R0.11), Motion Blur along the wind, emission for sparks.
- A snow hue (First Snow has none).

**Sleep Haze**
- J's Smoke recipe (Perlin warped by Perlin, Levels, Motion Blur); motes by Scatter and Lens Blur.
- Keep its volumetric shaft, which is right to be its own.

**Silk Ribbons**
- Streamers ribbons with their facing and side maps, into the Light Engine with a silk gloss and translucency.

### R1.5 · Ink and paint

**Suminagashi and Rorschach Test**
- Marbling (R0.7) and Pigment's edge pooling, on Paper Tooth; a wet gloss.

**Flow-Field Ink and Watercolor Wash**
- Paper Tooth heights under the wash, and a wet-ink sheen, for the Light Engine.

**Painter's Frustration**
- J: a Scatter of dashes turned by a flow map, into the Light Engine.
- Real paint hues.

### R1.6 · Sky stragglers

**Fractal Moon**
- Dome (R0.4) plus crater noise, so the light dial gives the phase.
- K2: the Enceladus egg.

**Ring in the Sky**
- Take the whole Ring in the Sky part apart: Ellipse rings plus Gradients; stars by R0.6.

**Ringworld and the Painted Ringworld**
- Stars by R0.6.
- Gloss and translucency maps.
- More than two hues for a whole world.

**Black Hole**
- Keep the tracer as a process part.
- Hues for the disc, emission for it, glow for the jets.

**Transmutation Circle**
- A circle-diagram part (ROADMAP I): Ellipse rings, Polar Wrap, glyphs at stations; its lines as emission.

**Deep Field**
- Blocked until a graph can hand the page two layers. Then Scatter stars and Perlin fog.

### R1.7 · Already on the renderer: the small finishing touches

- **webb, meadow:**
  - the old Simple Lighting swapped for the Light Engine, with translucency;
  - meadow's near grass from Grass Blades;
  - meadow's fairy egg.
- **petals, wax:** translucency maps in place of the flat values.
- **bouquets:** R0.1, so each bloom lights as Macro Bloom's does.
- **liminal:** Lens Blur from the caster's depth; wet and tiled floors as gloss.
- **contour:** the Dial node wired explicitly; the scale-audit issue.
- **lichtenberg, turing, growth, knotwork:**
  - hue inputs where they still lack them;
  - translucency for the thin ruffles;
  - knotwork's Slide on the camera dial.

---

## How each remake is judged (the same every time)

1. **The review sheet** (`node tools/review.mjs <surface> --ref main`):
   - the readings;
   - four seeds;
   - the light turned: every surface with form must change when the light turns;
   - the camera moved: anything with a position must stay put while the camera sweeps (the Painted Ringworld's rule).
2. **`scale-audit`**: the surface looks the same drawn small.
3. **Its time on a phone:** the frugal grid, and nothing slower than the old version without a reason.
4. **Ruby's yes** before merging. Old looks are translated with `retireLook` where a slider's job changed.

## Order, in one line

R0.1 → R0.2 → R0.8 → R0.9 → R0.10 → R0.4 → R0.3 → R0.5 → R0.6 → R0.7 → R0.11 → R0.12, then R1.1 → R1.7. The
scenes in docs/scene-ideas.md come after R0, using the same parts, and before the presets pass.
