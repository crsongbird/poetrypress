# Feathers and Light Overlays: Prior Art and Generator Catalogue

**Confidence key:** **[src]** stated in a consulted source (see Sources). **[std]** general knowledge or standard optics, not checked this session. **[der]** my derivation; verify in a test render. **[est]** aesthetic estimate (hex values, ranges). **[?]** uncertain.

Part names are the Athanor's. "Feathers" is the existing feather part. I assume it outputs `height`, `mask`, `barbdir` (barb direction) and `id` (per feather). Add any of these it lacks.

---

## 0. Shared contracts

**Mid-grey overlays.**
- Each light overlay (B1–B4) renders onto **#808080** for Soft Light or Overlay.
- 50% grey is neutral in both modes [std]. Soft Light suits paper; Overlay is harsher.
- Colour comes from tinting the lit and shaded parts away from grey.
- Keep luminance within about 0.25–0.80 so text never sits in black or white bands [est].
- Commercial packs recommend Soft Light and Overlay, plus Multiply or Linear Burn for shadows and Screen for leaks [src: Cudos, Medialoot].

**Hue slots.**
- Slots: H1 light, H2 shadow, H3–H5 accents, H6 base.
- Sunlit shadows are bluish because skylight fills them [src: Wikipedia Shadow].
- Default H1 is cream `#F2DDB0`; default H2 is blue-grey `#6E7A8C` [est].

**Light Dial mapping.**
- Direction is the sun's azimuth. Height is its elevation, about 90° × (1 − height) [der].
- Projections stretch by cot(elevation) [src: Wikipedia Shadow]. A pinhole dapple becomes an ellipse stretched by about 1/sin(elevation) [std].
- The **Rim** handle (the Light Engine's second light) acts as the feathers' backlight.

**Penumbra rule.**
- The sun spans 0.53°, so an edge blurs by about **0.0093 × occluder distance** [std].
- A pinhole spot has the same size, about 2.8 cm from 3 m up [src: Richmond, as summarised].
- Shadows soften and grow with distance; a fence's shadow can even invert [src: Wikipedia Shadow].

**The one new part: Sun Cast (a gobo projector).**
- Inputs: an Occluder mask (white blocks), a Distance map, and the Light Dial.
- Shears the occluder along the azimuth by cot(elevation).
- Blurs it by the penumbra rule.
- Pinhole mode turns each small gap into a sun disc (a crescent on an eclipse seed).
- Outputs: `light` (0–1), and `mid` (the same light mapped H2→H1 around 0.5).
- Gobo sharpness depends on its distance from the source and the surface [src: Oseman].
- Everything else here is built from general parts.

---

## A. Feathers

### Facts
**Anatomy.**
- The calamus is the hollow base with no barbs; the rachis is the shaft that carries them [src: FWS].
- Barbs carry barbules, whose hooks zip neighbours into a flat vane. Unzipped barbs make splits, and preening re-zips them [src: backyardnature].
- Contour feathers are zipped toward the tip and fluffy (plumulaceous) at the base [src: FWS].
- Down: barbs spring from one point atop the calamus.
- Semiplume: a loose vane. Filoplume: a bare shaft with a tip tuft. Bristle: barbs only at the base [src: backyardnature].
- Afterfeather: a small second plume at the base of the vane [std].
- Primaries are asymmetric with a narrow leading vane. Their vane step-ins are emarginations on the leading vane and notches on the trailing one [src: FWS].

**Splits in production tools.** Houdini drives split frequency with noise and uses clumping to pull barbs to the split edges. It randomizes barb length (fray) and bend [src: SideFX]. All of these work well as seeds.

**Corvid colour.**
- Three schemes, from a study of 8 corvid species [src: DGIST]:
  - matte black or brown, made in both barbs and barbules;
  - non-iridescent blue, grey or white, made in the barbs (the jay);
  - iridescence, made only in the distal barbules.
- **Magpie** [src: Stavenga 2018]:
  - Colour comes from 2–4 layers of hollow melanosomes.
  - The tail shades green at the base through purple to blue at the tip; the secondaries are blue.
  - The rest of each barbule is black and lies under the coloured parts of its neighbours.
  - The modelled hue shift is weak except at grazing angles. The dial should move the sheen's brightness and position more than its hue.
- **Raven vs crow** [src: NatureMapping]:
  - Ravens are "highly glossed" in greens, blues and purples; crows show purple and blue "with less sheen."
  - Ravens have shaggy throat hackles, pointed wings and wedge tails. Crows have blunt, splayed wingtips and fan tails.

**Other feathers.**
- **Angle shifts colour blue.** Pheasant barbules blue-shift strongly from 20° to 50°. A thicker keratin cortex moves the peak from about 470 to 489 nm (blue toward green) [src: sciencepod]. Peak ∝ cos(internal angle) [std].
- **Blue jay** [src: Smithsonian, Reconnect]:
  - The blue is made by an air–keratin nanostructure over brown melanin.
  - It does not shift with angle, and a backlit feather looks brown.
  - The black bars and white tips are melanin and its absence [std].
- **Peacock** [src: Atmospheric Optics]:
  - A lattice of melanin rods sets the hue by its spacing: blue about 140 nm, then green, yellow, brown.
  - Single colours are pastel and shift with angle, while the whole display stays bright from every direction.
- **Owl** [src: AskNature]: a comb of serrations on the leading edge, a hair-like trailing fringe, and a velvety surface.

**Graphics research.**
- Baron et al. add barbules at shading time from barb (u,v) coordinates [src: NSF PAR].
- Padrón-Griffe et al. use a barb-tangent texture plus a rachis/vane mask, and get view-dependent hue and opacity from masking [src: Unizar].
- Neither paper models iridescence with wave optics, so a 2-D fake is no worse than the state of the art.

### Recipe skeleton
1. **Feathers** gives `height`, `mask`, `barbdir`, `id`.
2. **Sheen** [der]:
   - Math: `s = |cos(barbdir − dialDir)|^p`, so the glint runs across the barbs.
   - Multiply by the Light Engine's `highlight`.
   - Gradient Map through H3→H4→H5, longest wavelength first.
   - Lower dial height shifts the map toward blue.
3. **Light Engine**:
   - picture = base colour; height = Feathers height.
   - Gloss low for matte, high for gloss; Rim for the edge light.
4. A tiny **Glow** on the brightest sheen. Blend through `mask`.

### Variations
1. **Crow.**
   - Base `#121217`, sheen `#3A3E6A`/`#4B3866`, gloss 15, sheen 0.15 [est].
   - Fan tips, Perlin fray.
   - The dial barely matters, which is correct for a crow.
2. **Raven.**
   - Base `#0A0A10`, sheen blue-green `#2E5A7A` → blue `#3B3FA0` → violet `#5B2E86`, gloss 70 [est].
   - Pointed feathers; a hackle seed adds shaggy lanceolate feathers.
   - Turning the dial slides the violet band along each vane.
3. **Magpie.**
   - Threshold of `id` or Perlin splits black `#0B0B0E` from white `#EDEBE6`.
   - Tail mode: a gradient along each feather, green `#2F7A4A` → purple `#6A3C8E` → blue `#2F55A8` (order [src], hex [est]).
   - Sheen on the black only.
4. **Blue jay.**
   - Blue `#3D7FC9`–`#6FA8DC`.
   - Bars: Waves plus Warp, 8–14 per feather, `#141414` [est].
   - White tip: Threshold past 0.85 of the length.
   - No hue shift with the dial. A strong Rim behind it mixes toward brown `#6B5E52`.
5. **Fallen feathers.**
   - Scatter (Shape: picture = a Feathers render) places 3–9 feathers with seeded turn and slight Perspective.
   - Shadow: blurred mask, offset away from the dial. A Where map keeps the poem clear.
6. **Owl flight feather.**
   - Buff `#C8A877`, barred `#5A4128` with Waves and Warp [est].
   - Comb teeth along the leading edge; an unhooked fringe on the trailing edge (Blur 1–2 px, fading alpha).
   - Highlight near zero, occlusion up.
7. **Owl down velvet.**
   - Cells 6–12 px with radial streaks become tufts.
   - Blur 1 px, then Gradient Map H6→H1.
   - Reads as a soft, matte page.
8. **Peacock eye.**
   - Concentric map from the centre: navy `#1B2350`, blue `#2B6CB0`, bronze `#9A7A2E`, green `#2F8A55`, copper `#8C5A2B` [est from the src order].
   - Barbs turn hair-like away from the eye.
   - The dial makes only pastel shifts.
9. **Pheasant scallops.**
   - Shingled contour feathers: Scatter on an offset grid.
   - Copper `#B0602A` with a black U margin; a neck seed is green-purple.
   - The sheen blue-shifts as the dial lowers.
10. **Down drift.**
    - Radial-barb sprites with no rachis, scattered sparsely.
    - Blur 0.5–1.5 px by a seeded depth.
    - Pale H1; suits elegies.
11. **Quill.**
    - One diagonal primary: asymmetric vane, an emargination, seeded splits near the tip.
    - Translucent calamus (Light Engine Translucency).
    - An optional ink stain at the nib.
12. **Plume.**
    - Loose, curling barbs with no hooks: Warp along `barbdir`, high split frequency.
    - White `#F4F1EA`, or dyed H3.
13. **Corvid plumage field.**
    - Full page of #9's layout coloured like #2 or #3.
    - The dial sweeps a band of sheen across it; the strongest dial demo of the set.

**Unique:** sheen that slides as the dial turns; a jay that browns under the Rim; seeded splits, fray and feather count; Where maps that keep feathers off the text.
**Avoid:** oil-slick rainbows (corvid colour is dark and subtle); symmetric flight vanes; evenly spaced barbs (vary them ±20% [est]); sheen on magpie white; pure `#000`, which flattens the Light Engine.

---

## B1. Dappled sunlight (komorebi)

**Physics.**
- Komorebi (木漏れ日) means tree, leaking, sun [src: Chicago Botanic].
- Small leaf gaps act as pinholes and cast round, inverted suns whatever their shape; in an eclipse the spots are crescents [src: Richmond].
- Large gaps show their own shape, blurred [std].
- Spot size is set by height, not by the gap: about height/107 [std].

**Base graph.**
1. Perlin plus Cells gives leaf clumps; Threshold by a Canopy knob gives the occluder.
2. Seeded per-layer distances.
3. **Sun Cast** in Pinhole mode.
4. Its `mid` output.

| # | Variation | Recipe delta | Hues |
|---|---|---|---|
| 1 | High canopy circles | Pinhole, distance 6–15 m, gaps 2–5% | H1 warm, H2 blue-grey |
| 2 | Low sun ellipses | dial height drives elongation along azimuth | + H3 amber |
| 3 | Eclipse (rare seed, ~1/40) | crescents sharing one orientation | cooler H1 |
| 4 | Near leaves | distance 0.3–1 m, Scatter of leaf marks, nearly crisp | H2 green `#6F7D66` |
| 5 | Mixed depth | layers at 1, 4, 12 m: crisp + soft + spots | all |
| 6 | Palm fronds | Scatter of rib-and-blade marks at 2–4 m | warm, contrasty |
| 7 | Winter branches | branching lines as the occluder, no leaves | H1 `#E8E2D4`, H2 lavender |
| 8 | Breeze | Motion Blur 4–12 px at a seeded wind angle, small Warp | as 1 |
| 9 | Pergola | crisp bars at 1 m + soft leaf scatter | H3 wisteria in shadows |
| 10 | Glade | whole field tinted `#9FB07A` at 15% | H4 green |

**Unique:** dapples that stretch and turn with the dial as at sunset; canopy height sets spot size; a rare eclipse.
**Avoid:** identical round spots; crisp shapes from far canopy; stripes through the poem. Feed the text box in as a mask that pulls contrast toward grey.

---

## B2. Window light

**Facts.**
- The window's shape shears along the azimuth by cot(elevation) [src: Wikipedia Shadow]. It softens with the gap between frame and wall (the penumbra rule).
- Gaffers fake frames with a chair or pipes, blinds with strips of tape, and summer dapple with branches [src: Oseman].
- Overlay packs sell window types from two angles as blurred PNGs, used with Linear Burn or Multiply [src: Medialoot]. Others offer black, brown, grey or pink variants [src: MasterBundles], or warm accents under Screen and Soft Light [src: MixPixBox].

**Base graph.** Grid, Border and Shape make the window (white = glass). Sun Cast takes a Room Depth knob as its distance. Use `mid`, with Glow on the lit panes for golden hour.

| # | Variation | Recipe delta | Hues |
|---|---|---|---|
| 1 | Four-pane cross | 2×2, thick mullion | H1 `#F4D9A6`, H2 `#707C90` |
| 2 | Georgian | 3×4 to 4×6, thin bars | as 1 |
| 3 | Venetian blinds | Waves → Threshold; a Tilt knob sets slat duty | warmer |
| 4 | Vertical blinds | rotated 90°, slight Warp sway | neutral |
| 5 | Arched | arch Shape over a grid; stained-glass seed | H3 rose |
| 6 | Sheer curtain | × vertical Waves warped by Perlin, Blur 8–20 px | cream, low contrast |
| 7 | Lace curtain | × fine Cells or Rosettes, Blur 1–3 px | H2 grey-violet |
| 8 | Plant on the sill | + Scatter of leaf silhouettes at the bottom edge, crisper than the frame | H2 green-grey |
| 9 | Golden hour | dial height ≥ 0.8: a long parallelogram, Glow on its edges | H1 `#FFC27A`, H3 `#FF9A5A` |
| 10 | Rain on glass | × the Raindrops part: bright-rimmed dots | H1 `#D8E2EE` |
| 11 | Shoji | dense lattice, heavy Blur, low contrast | warm, near grey |

**Unique:** the window swings across the page with the dial; Room Depth softens it; the poem can sit in a lit pane.
**Avoid:** an unsheared grid (it reads as a pattern); crisp edges at a deep Room Depth; shadows with no blue.

---

## B3. Film light leaks

**Facts.**
- Causes: body or lens gaps, under-advanced film, loose canisters [src: ExpertPhotography].
- Where: the right edge (the roll's start), the top and bottom (roll film), or random blotches [src: ExpertPhotography].
- Colour is usually red-orange [src: ExpertPhotography]. That it comes through the orange film base is forum opinion **[?]** [src: TalkPhotography].
- Pack variety: the 122-file Cudos LOMO pack covers frame leaks, side streaks, burns, bokeh glows, prism leaks and colour glows [src]. Chris Spooner made his leaks with "a camera, a torch and coloured film", used under Screen [src].

**Base graph.**
1. A Gradient or Ellipse from a seeded edge, Warp by low Perlin, a large Blur.
2. Gradient Map: H6 grey → H3 `#B0302A` → H4 `#F07A2A` → H5 `#FFD37A` → H1 near white [est].
3. Untouched areas stay at 0.5.

| # | Variation | Recipe delta |
|---|---|---|
| 1 | Edge flare | band hugging one edge, ragged inner edge, hot core |
| 2 | Roll bands | two soft horizontal bands, uneven widths |
| 3 | Corner bloom | Ellipse at a seeded corner, magenta fringe `#C2407A` |
| 4 | Frame burn | half the frame washed, Glow on the core |
| 5 | Prism leak | diagonal streak split by Chromatic Offset into bands |
| 6 | Bokeh leak | Scatter of discs with lognormal sizes, Blur |
| 7 | Redscale wash | warm cast over the whole field, heavier at one edge |
| 8 | Sprocket ghosts | rounded rectangles along an edge, blurred **[?]** |
| 9 | Fogged start | blotches from Threshold of large Perlin, Blur, grain |

**Unique:** the leak comes from the dial's direction; a seed picks the edge and how bad it is; the poem's length can set its height [est].
**Avoid:** leaks over the text; centred or symmetric leaks; rainbows on every seed (prism leaks should be the rare case).

---

## B4. Pool caustics

**Physics.**
- A wavy surface refracts sunlight into caustic sheets where rays cross. Two sheets meet at a cusp and spread apart with depth.
- The floor shows a slice of this moving network, so it flickers but keeps its structure [src: Atmospheric Optics].
- **Evan Wallace's method:** refract a grid of rays onto the floor, with brightness ∝ original area / refracted area, taken from screen-space derivatives [src: Wallace].
- **Heckel's version:** squares the ratio for contrast, then softens it with per-channel offsets that double as chromatic aberration [src: Heckel].
- **Voronoi fake:** outlines → blur → Maximum to thin → levels → invert, with Screen for colour [src: Katsbits]. Blender tutorials also use Voronoi [src: 80.lv, Lester Banks].

**Area ratio from general parts [der].**
- Displacement is about k·d·∇h, so brightness ≈ 1/(1 + k·d·∇²h).
- Highpass (h − blur h) is ∝ −∇²h.
- Graph: Perlin or Waves → Highpass (radius = wave scale) → Math `1/max(0.05, 1 − K·x)` → clamp → Levels.
- A higher K (depth) gives sharper, brighter lines, which matches the depth behaviour above.

| # | Variation | Recipe | Hues |
|---|---|---|---|
| 1 | Classic network | Cells F2−F1 → invert → pow 3–6, Perlin Warp | H1 `#EAF6FF`, H2 `#6E8FA8` |
| 2 | Area ratio | the recipe above | as 1 |
| 3 | Shallow | low K, Blur 2–4 px, broad blobs | warm white |
| 4 | Deep | high K, two octaves, thin tangled lines | cooler |
| 5 | Tiled floor | × Grid of tile lines warped by the same height | H3 `#7FD1D8`, H4 `#9AA6AE` |
| 6 | Chromatic | Chromatic Offset 1–3 px | faint fringes |
| 7 | Wall reflection | stretched 1:3 along azimuth with Perspective, lower contrast | warmer |
| 8 | Sand ripples | Waves as the height: banded caustics | H2 `#8C7E66` |
| 9 | Two-layer shimmer | min() of two maps at ×1 and ×1.7, rotated 30° **[?]** | as 1 |

The dial moves the pattern: offset the projection along the azimuth by depth × cot(elevation). The Rim handle can add a faint second offset [est]. The existing **Water** part already draws floor caustics; reuse its code instead of writing a third.

**Unique:** the pattern slides and sharpens with the dial and a Depth knob; each seeded wave field gives a stable, distinct pattern.
**Avoid:** even-width Voronoi lines (they read as crazing); brightening everywhere (caustics move light around, so the gaps should darken); oversaturated cyan.

---

## Seeding
- Use separate seeds for layout, form, and rare events (1/20 to 1/40) [est].
- Keep hue slots fixed across seeds.
- Treat the poem as soft input only: its length, and its text box as a readability mask.

---

## Sources (consulted)
- https://backyardnature.net/birdfthr.htm
- https://www.fws.gov/lab/featheratlas/glossary.html
- Stavenga et al. 2018, J Exp Biol: https://cdn.unifr.ch/ami-db/uploads/file/9bca6e5e-09c4-4448-b519-2fbd2558b926/jeb174656.full.pdf
- https://dgist.elsevierpure.com/en/publications/evolution-of-plumage-coloration-in-the-crow-family-corvidae-with-/
- https://magazine.sciencepod.net/?p=416949
- https://naturemappingfoundation.org/natmap/facts/crow_vs_raven.html
- https://www.smithsonianmag.com/science-nature/why-are-some-feathers-blue-100492890/
- https://reconnectwithnature.org/news-events/the-buzz/nature-curiosity-why-are-blue-jays-blue
- https://www.atoptics.co.uk/fz777.htm
- https://asknature.org/strategy/wing-feathers-enable-near-silent-flight/
- Baron et al., SIGGRAPH '21 poster: https://par.nsf.gov/servlets/purl/10410854
- Padrón-Griffe et al., SIGGRAPH '24 poster: https://graphics.unizar.es/projects/FeathersAppearance_2024/A%20Surface-based%20Appearance%20Model%20for%20Pennaceous%20Feathers_files/feathers_appearance_SIGGRAPH_2024_abstract.pdf
- https://www.sidefx.com/docs/houdini/feathers/splitting.html and https://www.sidefx.com/docs/houdini/feathers/randomizing.html
- https://www.chicagobotanic.org/nature-and-wellness/komorebi
- https://blog.richmond.edu/physicsbunn/?p=1141
- https://en.wikipedia.org/wiki/Shadow
- https://neiloseman.com/?p=6680
- https://creativemarket.com/Cudos/4198048-SHADE-48-Natural-Shadow-Light-FX
- https://medialoot.com/item/windows-shadows-overlays/
- https://masterbundles.com/dslava/light-and-shadows-window-overlays/
- https://creativemarket.com/MixPixBox/13463560-Warm-Radiance-Photo-Overlays
- https://creativemarket.com/Cudos/4886382-LOMO-100-Analog-Light-Leaks-FX
- https://creativemarket.com/chrisspooner/10970939-80-Light-Leak-Overlays
- https://expertphotography.com/light-leaks
- https://www.talkphotography.co.uk/threads/what-causes-light-leaks-to-produce-different-colours.688637/
- https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c
- https://blog.maximeheckel.com/posts/caustics-in-webgl
- https://old.atoptics.co.uk/fz776.htm
- https://www.katsbits.com/codex/?p=6769
- https://80.lv/articles/tutorial-making-an-easy-caustics-effect-in-blender and https://lesterbanks.com/2021/09/an-easy-way-to-fake-caustics-in-blender/

**Not reachable:** the Evan Wallace WebGL Water demo (fetch refused) and PMC 3107640 (captcha). The Wallace claims come from his Medium article.
