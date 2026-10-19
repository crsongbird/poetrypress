# Space Scenes Prior Art: Pixel-Art Space and JWST False Colour

**Key to confidence:** **[src]** = stated in a consulted source (see Sources). **[mem]** = from general knowledge; not confirmed this session because the page was blocked or not fetched. **[est]** = my aesthetic or implementation estimate; tune it by eye.

**Hue roles.** The user supplies up to six hues, H1–H6. No colour is hard-coded. Each hue is expanded into a ramp in OKLCh by stepping lightness and chroma. Hue-shifted shading is done by **interpolating toward a neighbouring role hue**, not toward a fixed blue or yellow: a role's shadow step leans toward H1, and its highlight step leans toward the star/light hue [est]. This keeps the pixel-art habit of shifting hue as value changes, while every pixel stays derived from user input.

| Role | Surface A (pixel art) | Surface B (JWST) |
|---|---|---|
| H1 | ground / deep sky | deep sky |
| H2 | mid sky | dust shadow |
| H3 | nebula heart | dust body |
| H4 | nebula rim | dust highlight |
| H5 | accent | star / ionized gas |
| H6 | stars | accent |

**No procedural borders.** Every kind fills the canvas edge to edge. Do not use vignettes, frames or rounded masks. Large bodies may be cropped by the edge, which pixel artists do on purpose for scale.

---

## A. Pixel-art space

### A.1 The canon and what it teaches

- **Deep-Fold, Pixel Space Background Generator** (itch.io, MIT source at GitHub `Deep-Fold/PixelSpace`):
  - Features [src]: layers of stars, nebulae, dust, planets and asteroids; every colour editable; built-in palettes; a pixel-size control; a dithering on/off toggle (added 2021 because dithered backgrounds flicker when they scroll); seamless tiling, but only at integer aspect ratios.
  - Layer names in the repo are said to be BigStar, Star, Nebulae, Dust and Planet [mem: GitHub was blocked this session].
  - **Lesson:** a scene is a stack of a few noise layers, each run through a short palette with optional dither.
- **Deep-Fold, Pixel Planet Generator:**
  - Features [src]: 8 planet types (named in a devlog: gas giant with ring, ice world, lava world, dry terran, among others), plus black holes, galaxies, stars and asteroids. The light position is dragged with the mouse. Rotation exports as spritesheets. Palettes import and export as newline-separated hex lists. Dither is a toggle.
  - **Lesson:** the planet look comes from a sphere UV plus noise, a light direction and a posterized ramp. Porting these is the clearest prior art for our light dial.
- **"Space Generator" nebula tutorial** (itch devlog 761088):
  - Controls [src]: Threshold sets coverage; Density sets shape scale; a modulation noise drives colour and/or alpha.
  - "Mod Steps" quantizes the noise into discrete brightness bands, chosen deliberately to look like pixel art [src].
  - Dither is applied **only at borders between palette colours** [src].
  - **Lesson:** posterize first, then dither only at the band seams.
- **Asset packs:**
  - Ansimuz Space Background: layered, seamless backgrounds; the expansions are 276×160 px [src].
  - Kenney's Space Shooter Redux on OpenGameArt: the flat, clean counter-style [mem].
  - Both confirm the typical base resolution is about 256–400 px wide.
- **Pixel artists:**
  - Twinkle animation is usually a rotate-and-flash, or a pulse that brightens while shrinking (PixelJoint thread) [src].
  - Banding, short ramps, hue-shifted shadows and 1-px stars with sparse sparkles are the shared vocabulary across itch and Lospec work [mem].

### A.2 Lospec-style palettes (as reference for ramp shapes, not for direct use)

Verified on Lospec this session [src]:
- **Berry Nebula** (LostInIndigo, 8): `#6ceded #6cb9c9 #6d85a5 #6e5181 #6f1d5c #4f1446 #2e0a30 #0d001a`. This is a single hue-shifted ramp from cyan to grape: the model for "nebula heart → rim → deep sky".
- **COSMIC / SPACE** (Paleto, 16, CC0): `#020208 #06060f #0c0a20 #14103a #1e1860 #2c2898 #4848d0 #7070ff #ff4488 #ff88cc #00ddff #88ffee #ffdd44 #ff8822 #ccccff #ffffff`. Eight-step void-to-indigo ramp, then accent pairs (pink, cyan, gold, orange).
- **NebulaSpace** (SteelSoldier, 16): `#0a401a #6d852c #b3a724 #e6eb6a #ede8e1 #a7dbbb #5d858c #3d476e #32244d #27142b #d6c2ba #bf9684 #a66372 #733754 #451e3e #2e0f29`.
- **Planets** (Jude Buffum, 13): `#050816 #10192e #1f3b73 #6d95ca #c3d5eb #486846 #89ad84 #844136 #bb6a52 #c9783e #d6aa4f #746b61 #8a8177`.

From memory, not verified this session [mem]:
- **SLSO8**: `#0d2b45 #203c56 #544e68 #8d697a #d08159 #ffaa5e #ffd4a3 #ffecd6`
- **Oil 6**: `#272744 #494d7e #8b6d9c #c69fa5 #f2d3ab #fbf5ef`
- **Twilight 5**: `#292831 #333f58 #4a7a96 #ee8695 #fbbbad`
- **Midnight Ablaze**: `#130208 #1f0510 #31051e #460e2b #7c183c #d53c6a #ff8274`

Other Lospec palettes tagged space or galaxy that are worth a look: Spectral Scarab, Divination, Neon Space, Nebulosa, Red is Dead [src: names only].

**Takeaway [est]:** space palettes are one long dark ramp of 5–8 steps that shifts in hue, plus 2–4 saturated accents and a near-white. Build the same structure from the hues:
- H1 → H2 → H3 → H4 is the long ramp, interpolated in OKLCh with 2 steps between each pair.
- H5 is the accent.
- H6 is lifted to L ≈ 0.95 for stars.

### A.3 Pixel techniques to encode

- **Banding:** posterize each noise to 3–6 levels before applying the gradient map. Never leave smooth gradients at output resolution.
- **Dither styles:**
  - Ordered Bayer 4×4 gives the classic retro look; it is busy on large areas.
  - A 50% checker band (2×2) placed only at the seam between two levels is the "hand" look and the most common in nebulae.
  - Sparse noise dither (blue-noise threshold) suits dust.
  - Make the style a per-scene seed choice, and allow it to be turned off (it flickers under animation [src]).
- **Hue-shifted shading:** shadow steps move toward H1, light steps toward H6. Saturation peaks in the mid-tones.
- **Star marks** (all available from the scatter part with a mark library):
  1. 1-px dot, in two or three values (the bulk, 85–95%).
  2. 2×2 or 1-px + 4-neighbour "plus" (5 px).
  3. 4-point sparkle: arms of 2–4 px with a 1-px diagonal glow ("X" at half value).
  4. 8-point big star: plus arms of 5–7 px, diagonals of 2–3 px, a 3×3 core.
  5. Soft halo: a blurred blob under 3 and 4.

  Distribution [est]: about 1 sparkle per 400 px² of dots, and 0–3 big stars per scene. Glow is a blur of the star mask added back, then posterized to 2 levels so it stays pixelly.
- **Planets:**
  - Banding in the sphere's latitude for gas giants.
  - A **terminator** from the dot product of the sphere normal with the light-dial vector, posterized to 3–4 steps, with one dither seam.
  - A rim/atmosphere ring: a one-pixel outline in H4 on the lit side only.
  - Rings: an ellipse annulus split into a back half (drawn behind) and a front half (in front), plus the planet's shadow on the ring.
- **Pixel scale:** a working canvas of 160–400 px on its long side, then nearest-neighbour upscale by 2–8. Stars are always 1 working-pixel at their smallest.

### A.4 Recommended single new part: **Orb**

Generic parts cannot map noise onto a sphere or handle front/back ring occlusion. Make one part that outputs:
- a disc mask;
- sphere UV (longitude/latitude, with rotation);
- the lambert term against the app light dial;
- an optional ring annulus with front/back masks and a shadow mask.

Planets, moons, stars, asteroids (with the edge displaced by noise), black holes (a ring around a black disc) and tilted galaxy discs can all use it [est]. Everything else in this document uses existing parts.

### A.5 Scene kinds (seed picks one, then its parameters)

The pixel-scale range is given for each kind as ×N.

1. **Quiet starfield** (×3–6)
   - H1 base with a 2-level posterized low-frequency noise into H2.
   - Dots in 3 values of H6, sparse sparkles, 0–1 big star.
   - Use: a background for long poems.
2. **Cloud nebula**, the Deep-Fold classic (×3–4)
   - Warped fbm, thresholded, then a gradient map H1→H2→H4→H3, with H3 as the brightest core and H4 at the rim.
   - Checker dither at the seams.
   - Stars sit over the nebula; a few H5 accent pockets come from cells.
3. **Veil filaments**, a supernova-wisp look (×3)
   - Ridged noise, domain-warped twice, thresholded thin: H4 lines with H3 cores on H1.
   - Light motion blur along the warp direction.
4. **Dark nebula with backlit rim** (×3–4)
   - A dense noise silhouette in H1 that is darker than the sky (H2 sky behind).
   - Emboss toward the light dial gives a 1-px H4 rim on the lit edge.
   - Stars masked out behind the cloud.
5. **Planet close-up** (×2–4)
   - One huge Orb, 60–120% of the canvas height and cropped.
   - Banding and craters from cells, terminator from the light dial, H5 atmosphere rim.
   - Starfield behind.
6. **Ringed giant with moons** (×3)
   - An Orb with a ring, plus 1–3 small Orbs (moons) placed along the ring plane.
   - Each moon shaded by the same light.
7. **Limb horizon** (×2–3)
   - The centre of an enormous Orb sits below the canvas, so only an arc shows.
   - A layered atmosphere glow: a 3-band H4/H5 halo, posterized.
   - A star or sun rising at the limb as an 8-point mark.
8. **Eclipse / corona** (×3)
   - A dark Orb in front of a bright disc.
   - Corona = radial motion blur of noise around the disc, posterized to 3 bands of H5→H6.
   - A diamond-ring sparkle at the contact point.
9. **Spiral galaxy, face-on** (×3)
   - Polar warp of fbm into a log-spiral (arms = sin(k·θ − a·ln r) masked by noise).
   - Bright H6/H5 core; arms H3 → H4.
   - Dust lanes in H1 along the inner arm edges.
10. **Galaxy field** with edge-on and elliptical galaxies (×4)
    - 5–30 marks: soft ellipses (ellipticals), thin spindles with a dark mid-line (edge-on), small spirals.
    - Colours spread across H3/H4/H5.
    - Reads as "deep space" without any nebula.
11. **Black hole** (×3)
    - A black disc (H1 darkened).
    - An accretion annulus (Orb ring) whose back half is also drawn bent over the top as an arc: the lensed far side [mem].
    - A thin H6 photon ring; brighter on the approaching side (left/right asymmetry, Doppler beaming) [mem].
    - Stars near the disc pushed outward by a radial warp.
12. **Star cluster** (×3–5)
    - Scatter density ∝ exp(−r²/σ²) around a seeded centre (globular), or 3–5 clumps (open cluster).
    - The core blurs to a glow; outer stars are sparkles.
13. **Comet** (×3)
    - A small bright head (sparkle + glow).
    - The dust tail is a directional motion blur pointing **away from the light dial**, curved by a slight warp, in H4.
    - A straighter, narrower ion tail in H5.
14. **Asteroid belt** (×2–4)
    - 20–80 small Orbs with noise-displaced edges at several sizes, all lit by the light dial.
    - Large ones in the foreground, a dust band of tiny dots behind.
    - Optional motion blur for parallax speed.
15. **Close star / binary sun** (×3)
    - 1–2 large glowing discs with posterized limb darkening.
    - Prominence loops (ridged noise in an annulus), pixel rays (8-point mark scaled up).
16. **Milky Way band** (×4–6)
    - A diagonal band where star density and a soft H2/H3 glow rise.
    - An H1 dust lane down the middle (warped noise).
    - The most "night-sky" kind.
17. **Planetary ring nebula** (×3)
    - Annulus mask × fbm: H3 inner ring, H4 outer, H5 cavity tint.
    - A central star mark; cell-noise knots on the outer edge.
18. **Distant beacon / station** (×3–5)
    - A tiny silhouette (a few rectangles plus a ring, built from scatter marks) far off against a nebula.
    - 1–3 blinking 1-px H5 lights.
    - Implementation effort is uncertain [est]; it needs a "glyph" mark, so treat it as optional.

**Seed variety within a kind [est]:** the seed also picks the layer count (2–4 nebula layers), warp strength, posterize levels (3–6), dither style, star density, body count and placement (rule-of-thirds anchors), and rotation. The seed should **not** remap which hue plays which role, because users expect their colours to keep their jobs.

---

## B. JWST false-colour deep sky

### B.1 What makes an image read as "Webb"

- **Chromatic ordering:** each infrared filter is greyscale and assigned a hue by wavelength, with the shortest shown blue and the longest red [src: Physics Today]. Example, Pillars [src NASA]: F090W purple, F187N/F770W blue, F200W cyan, F1130W green, F335M yellow, F444W orange, F470N/F1500W red.
  - **For us:** order H1…H5 as a "wavelength" axis. Dense, cold dust is mapped long (warm hues); stars and hot ionized gas are mapped short.
- **Typical palette:**
  - Dust reads orange-red-brown in MIRI and near-infrared composites [src: Pillars, Cas A, Cartwheel].
  - Densest dust is deep indigo [src Pillars].
  - Stars are blue-white.
  - Young embedded stars are red dots [src Carina].
  - Molecular hydrogen jets are red [src Rho Oph].
  - PAH-lit dust is pale yellow [src Rho Oph].
  - **Dust becomes translucent:** NIRCam sees into and through clouds, so stars appear inside and behind them. Hubble's optical Pillars, by contrast, are opaque, greenish-brown columns on a teal ionized background [mem].
- **Spikes:**
  - Six bright spikes come from the 18 hexagonal mirror segments; each edge diffracts perpendicular to itself [src].
  - Two fainter horizontal spikes come from the vertical strut of the three-strut support; the two angled struts (150° from the vertical one) add spikes that overlap the diagonals [src NASA transcript; Sky at Night].
  - Brighter stars give brighter spikes [src].
  - Segment gaps put "rough lines of light" inside the spikes [src].
  - Hubble gives 4 spikes [src]. Never mix the two styles.
- **Spike geometry for rendering:**
  - Main spikes at 90°, 30° and 150° from the x-axis, plus their opposites.
  - Short spikes at 0° and 180°, about 40–60% of the length and intensity [est].
  - Intensity ∝ 1/r with a beaded modulation of (0.75 + 0.25·sin(r·k)).
  - Spike length ∝ √brightness.
  - The tip is tinted toward the star's hue and the core is white. Longer wavelengths diffract wider, so the outer spike reddens [est].
  - Only the brightest 1–3% of stars get spikes. The rest are soft round dots, and many are faint pinpoints.
- **Galaxies everywhere:** the background is full of tiny smudges: orange/red dusty ones, blue star-rich ones, and lensed arcs [src: SMACS 0723].
- **Hot, smooth gradients**, not banding; this is the opposite of Surface A. Dust is "steam", "cliffs", "smoke" [src Carina, Cas A].

### B.2 Faking Webb dust with general parts

1. **Height:** fbm plus ridged noise, domain-warped (warp by a second low-frequency noise at 0.3–0.8 strength). Ridged noise gives cliffs and filaments; plain fbm gives smoke.
2. **Erosion toward the light:** the app light dial = the ionizing source. Bias the threshold so dust density falls toward the light, which makes pillars and cliff fronts point at it.
3. **Lit edge:** emboss the height along the light vector. Positive values add H4 (highlight); negative values add H2 (dust shadow). Add glow (blur + screen) on the H4 rim.
4. **Streaming steam:** radial motion blur of the lit rim, centred on the light position but blurring **away** from the dust (outflow toward the source) [est]. Composite at 30–50%. This is the Carina "steam" streaming from the peaks [src].
5. **Body colour:** gradient map density → H1 (empty) → H5 at low alpha (ionized glow) → H3 (dust body) → H2 (densest; per [src Pillars], densest = deep indigo). Mapping the densest dust to a *cool* hue is the Webb tell.
6. **Stars:** scatter in three populations: pinpoints (most), soft blue-white dots in H5, and spike stars. Add red embedded dots in H6 placed *inside* dense dust.
7. **Galaxies:** small elliptical smudges (scatter of blurred ellipses, random rotation, aspect 1–4) in H3, H4 and H5, at very low density over everything.
8. **Lensing arcs:** a scatter of elongated smudges oriented **tangentially** to a seeded cluster centre, at radius 0.15–0.35 of the canvas. Alternatively apply a polar-coordinate warp that stretches the angle. Repeat 2–3 copies of the same arc pattern (multiple images) [est].

### B.3 Scene kinds

1. **Cosmic Cliffs** (Carina NGC 3324) [src]
   - A ridge boundary across the lower 40–60%: ridged-fbm cliffs with peaks.
   - Above it, a cavity glow (H5 → H1). The light dial sits above the frame.
   - Steam blur rising off the peaks; red H6 protostar dots in the dark lower dust; 1–3 tiny bipolar jets (short opposed lines) [src].
2. **Pillars** (Eagle) [src]
   - 2–4 tapering columns, made by stretching noise along an axis toward the light.
   - Translucent bodies in H3, a V-shaped orange veil across the top in H4/H3 [src], dark dense cores in H2.
   - Wavy red "lava" at the tips (H6) [src]; dense spike-star field.
3. **Planetary nebula shells** (Southern Ring, Ring Nebula) [src]
   - A tilted oval: annulus × warped fbm.
   - Inner cavity filled with hot gas (H5); main ring H3 with a thin H4 band; clumpy cell knots on the outer edge (about 20,000 globules in M57 [src]).
   - About 10 faint concentric arcs outside [src]; central star with spikes; optional faint radial "spokes".
4. **Deep field** (SMACS 0723) [src]
   - Black H1 sky; hundreds of galaxy smudges.
   - A central clump of large yellowish ellipticals (cluster) in H4.
   - Lensing arcs around it in H3 and H6; 3–8 foreground spike stars.
5. **Supernova shell** (Cas A) [src]
   - Thick annulus: inner shell of shattered-glass filaments (ridged noise, H3/H4); outer wispy smoke curtains (soft fbm, H3) [src].
   - A loop of accent H6 inside the cavity (the "Green Monster") [src].
6. **Pulsar cage** (Crab) [src]
   - A lattice of filaments (cell-edge noise warped) in H3/H4.
   - Interior milky smoke (blurred fbm, H5 desaturated).
   - Concentric ripples around a central white dot, and thin white ribbons (H5) [src].
7. **Bipolar outflow** (HH 211, HH 46/47) [src]
   - An axis through a central spike star; dark shadow cones from an unseen disc [src].
   - Fan-shaped lobes (H3/H4) on each side, one brighter.
   - Chains of bow-shock arcs along the axis with mirror-symmetric wiggle [src].
   - Thin H5 thread jets; a Bok-globule cloud in H2 with an orange H4 rim [src].
8. **Reflection cave** (Rho Ophiuchi) [src]
   - A pale arch (H4) around a bright star, wisping off to one side.
   - Small dark disc silhouettes, pinched in the middle with light escaping above and below [src].
   - Long red H2-gas jets (H6) crossing the frame [src].
9. **Interacting galaxies** (Stephan's Quintet, Arp 142) [src]
   - 2–5 galaxy bodies: Orb-like discs with spiral warp, plus a compact elliptical with spikes.
   - Tidal tails (strongly warped spiral arms) and a shock or bridge glow in H5 between them (Arp 142's blue U [src]).
   - Background smudges. "The Rose" is likely Arp 273 (a Hubble image, not Webb) [mem]; it fits the same recipe.
10. **Ring galaxy** (Cartwheel) [src]
    - A bright core; an inner ring; an outer clumpy ring of H5 star-forming knots.
    - Red-tinted dust spokes between the rings (H3/H6) [src]; 1–2 small companion galaxies.
11. **Spike-star cluster over dust** [est]
    - A dense young cluster (density falloff from a centre) with 15–40 spike stars.
    - A faint dust veil in H2/H3 behind it. Webb's NGC 346, Westerlund 1 and NGC 604 have this look [mem].
12. **Edge-on disc / hourglass** [mem: HH 30-type objects; not researched this session]
    - A dark horizontal lane (H2) splitting two bright bowl-shaped reflection lobes (H4).
    - A thin vertical jet in H6.

---

## C. Making it this app's own

- **Light dial = the physics:** it sets the planet terminator, the comet tail direction, the dust rim, pillar erosion and the steam blur direction in one gesture. Most generators fix the light per object; tying all of them to one dial is distinctive.
- **The poem as sky [est]:**
  - The poem's words seed star placement: a hash of each word gives a star, and a word's length sets its brightness.
  - Line breaks become constellation segments (thin 1-px lines in A, absent in B).
  - The title's star can be the single spike star or the big sparkle.
  - Keep the text legible: dim the stars under the text block, or keep a low-density zone there.
- **Seeded variety:** seed → kind → parameters. The same seed with different hues gives the same composition in new colours. That is useful for series.
- **The two surfaces are siblings:** A = posterized, dithered, 1-px stars, 4- and 8-point sparkles; B = smooth gradients, Webb 6+2 spikes. Never put Hubble 4-spikes or pixel sparkles in B, or smooth gradients in A.

**Avoid:**
- Copying a specific JWST frame's composition exactly; evoke the kind instead.
- Hard-coded "space purple".
- Vignettes or frames (owner rule).
- Uniform star density, which reads as noise; always use 2–3 populations.
- Too many big sparkles (more than about 3).
- Dithering under animation without the off toggle [src].
- Lensing arcs that are not tangential.
- Spike lengths that are all equal.
- Spikes on galaxies, except compact ellipticals [src Arp 142 Egg].

---

## Sources

- Deep-Fold, Pixel Space Background Generator: https://deep-fold.itch.io/space-background-generator
- Deep-Fold, Pixel Planet Generator: https://deep-fold.itch.io/pixel-planet-generator
- Deep-Fold devlog, "More planets & exporting to png": https://deep-fold.itch.io/pixel-planet-generator/devlog/197898/more-planets-exporting-to-png
- Blocked this session (permission timeout): https://github.com/Deep-Fold/PixelSpace
- Space Generator, "Tutorial: Nebula layers": https://itch.io/devlog/761088/tutorial-nebula-layers.amp
- Ansimuz, Space Background: https://ansimuz.itch.io/space-background
- PixelJoint thread on star twinkles: https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=14523
- Paleto, Cosmic / Space: https://paleto.itch.io/paleto-cosmic-space
- Lospec palettes:
  - https://lospec.com/palette-list/tag/space
  - https://lospec.com/palette-list/berry-nebula
  - https://lospec.com/palette-list/cosmic-space
  - https://lospec.com/palette-list/nebulaspace
  - https://lospec.com/palette-list/planets
  - https://lospec.com/palette-list/tag/moody
  - https://lospec.com/palette-list/tag/%20magic
  - Individual SLSO8, Nyx8, Twilight 5 and Midnight Ablaze pages were blocked.
- Astronomy.com, "Why do stars look so pointy…": https://www.astronomy.com/space-exploration/why-do-stars-look-so-pointy-in-james-webb-space-telescope-images/
- Wikipedia, Diffraction spike: https://en.wikipedia.org/wiki/Diffraction_spike
- NASA/STScI, diffraction spikes transcript: https://science.nasa.gov/wp-content/uploads/2023/07/webb-diffractionspikestranscriptstsci-01g77dqfw6pd35sh619tyxt8gt.pdf
- Sky at Night, eight diffraction spikes: https://www.skyatnightmagazine.com/space-science/why-stars-in-webb-images-have-eight-diffraction-spikes
- NASA, About Webb Images: https://science.nasa.gov/?p=54371
- Physics Today, "Bringing JWST images to life": https://physicstoday.aip.org/news/bringing-jwst-images-to-life
- NASA, Pillars of Creation NIRCam+MIRI: https://science.nasa.gov/asset/webb/pillars-of-creation-nircam-and-miri-composite-image
- ESA/Webb, Pillars comparison: https://esawebb.org/images/comparisons/weic2218a/
- ESA/Webb weic2205 (Carina): https://esawebb.org/news/weic2205/
- ESA/Webb, Southern Ring: https://esawebb.org/images/southernring3/
- ESA/Webb weic2209 (SMACS 0723): https://esawebb.org/news/weic2209/
- ESA/Webb weic2322 (HH 211): https://esawebb.org/news/weic2322/
- ESA/Webb weic2319 (HH 46/47): https://esawebb.org/news/weic2319/
- ESA/Webb weic2330c (Cas A): https://esawebb.org/images/weic2330c/
- ESA/Webb weic2316a (Rho Ophiuchi): https://esawebb.org/images/weic2316a/
- ESA/Webb weic2211 (Cartwheel): https://esawebb.org/news/weic2211/
- ESA/Webb weic2208 (Stephan's Quintet): https://esawebb.org/news/weic2208/
- ESA/Webb weic2326 (Crab): https://esawebb.org/news/weic2326
- ESA/Webb weic2420f (Arp 142): https://esawebb.org/images/weic2420f/
- ESA, Ring Nebula: https://www.esa.int/Science_Exploration/Space_Science/Webb/Webb_captures_detailed_beauty_of_Ring_Nebula
