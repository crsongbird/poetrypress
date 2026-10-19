# Lit Maps Prior Art: painting a surface as maps, and letting the light do the rest

**Why this file exists.** Ruby, on the florals (2026-10-19): "since you have access to albedo, specularity, and all of
these other lighting features.. it should not be a struggle for you to make things that do not look cartoony, and that
do not have lighting artifacts … if you generate all of these maps in a painted look and make them physically accurate,
you're going to end up with a really incredible render... Consider that for all of the textures going forward!!!"
AGENTS.md §8 (Add a texture, step 1b) makes it a rule. This file is the method and where it comes from.

**Key:** [src] stated in a source read this session (Sources, below). [est] my design decision.

---

## 1. What a renderer is given, and what each map is for

- **Albedo** (diffuse colour): the surface's colour with no light in it. Habel et al.'s leaf model keeps the
  non-directional part of the subsurface light "included in the albedo map" and nothing else [src: Habel 2007].
  A painted look lives here: the Arcane-style artist's "Diffuse map is the true star of this workflow", hand-painted
  "glaze-like brushstrokes with clearly defined shapes" [src: 80.lv].
- **Normals and heights**: the shape. Habel's leaves carry high-resolution normal maps for the specular detail, and
  horizon maps for self-shadowing, because ridges and bulges shade the leaf before light enters [src: Habel 2007].
  "At grazing angles [a leaf] shows high-frequency details" that a flat model cannot [src: Habel 2007].
- **Gloss / roughness**: what shines. In the painted asset, "The Roughness map matched the Diffuse map almost
  perfectly", so highlights follow the painted shapes [src: 80.lv]. Crysis's foliage multiplies its specular by a
  gloss map [src: GPU Gems 3 ch. 16].
- **Thickness / translucency**: where light comes through. Habel's leaves have a thickness map d(x) (how far light
  diffuses through) and an average translucency map (its colour) [src: Habel 2007]; Crysis's leaves a back-diffuse
  map, "an artist-made texture that can encode internal detail like veins" [src: GPU Gems 3 ch. 16].
- **Occlusion**: a crevice's darkness, from the shape (the engine's own, from the heights).

## 2. How a thin thing is lit (what this app's Light Engine now does with a Translucency map)

- **Wrapped diffuse:** `(N·L + wrap) / (1 + wrap)` — the light reaches round past the terminator, softening it
  [src: GPU Gems ch. 16, Green]. The engine wraps by the map: thin points wrap more.
- **The scatter band:** a narrow band of colour where light turns to shadow (Green's
  `smoothstep(0, w, NdotL) * smoothstep(2w, w, NdotL)`, added in a scatter colour) [src: GPU Gems ch. 16]. Here the
  colour is the surface's own pigment.
- **Transmission:** light through the back of a leaf, in Crysis `saturate(dot(-N, L)*0.6 + 0.4)` times the
  back-diffuse map [src: GPU Gems 3 ch. 16]; through a thicker path, `exp(-s·σ)` less [src: GPU Gems ch. 16]. A page
  has no back face to light, so [est]: the transmitted share grows as the dial's light sinks toward and past the
  horizon, and with a second light from behind; thick points (petals overlapping, veins) let less through.
- **Its colour:** a petal's pigment sits in the epidermis and filters the light "on the way in and again on the way
  out" [src: Stavenga et al. 2020]; transmitted light is filtered once. So what comes through is the pigment's hue at
  full strength, deepened, however dark the face we see is lit [est from src].
- **Gloss of real petals:** conical epidermal cells "effectively reduce gloss" on the upper side, so most petals are
  matte and saturated; the smoother underside is glossier; buttercups instead shine, from a thin carotenoid film
  [src: Stavenga et al. 2020; Journal of Pollination Ecology 2021]. Sunflower rays are near-diffuse, small florets'
  bases more specular [src: gamedev.net thread].

## 3. What a height map can't do, and Facing

A height map scaled to a surface's relief (the engine's Relief, at most 6% of the page) gives gentle slopes: right for
grain, wrong for a cupped petal that turns half away from the light [est, measured: light from opposite sides changed a
lit poppy's mean by under 0.2%]. Habel's leaves and every game asset use true normals for the object's shape and heights
or normal maps for its detail [src: Habel 2007; 80.lv]. So a process part that knows its object's 3D shape hands on
**Facing**: how squarely each point faces the dial, from its true normals (Bloom: at each petal's base and tip, and
turned across its width by its cup), wrapped a little. The graph multiplies it into the albedo; the Light Engine adds
the surface's own light (heights, shadows, occlusion, gloss, translucency) on top.

## 4. The method, for every surface with form

1. Draw the **albedo** unlit, with the painted look in it (brushwork, colour variation, patches), never an outline or
   a highlight standing in for light.
2. Draw **Facing** where the part knows an object's shape (flowers, feathers, cards, worlds).
3. Draw **heights** for the surface's own shape and detail (cross-sections, sunk veins, grain, crinkle), and let the
   engine's shadows and occlusion come from them.
4. Draw **gloss** by material (matte petal, waxy petal, leaf cuticle, wet, metal), matching the albedo's shapes.
5. Draw **thickness** where light can come through, adding where layers overlap.
6. Light it with the Light Engine: the dial, a rim light, the ambient hue. **Turn the light round before calling it
   done**: from the front, from the side, from behind and low. A picture right from only one side was painted, not lit.

## 5. Where this stands (Saturn series)

- Bloom: Lit By (Bloom, or the Light Engine), and outputs Gloss and Facing; Thickness adds where petals overlap and
  along the veins; Height has each petal's cross-section and sunk veins.
- The Light Engine: Translucency takes a map (graphs v4 and later): wrap, scatter band, transmission in the pigment's
  colour. A texture's chain opts into map semantics with its own version (`v: 5` on its entry; chains.js).
- Macro Bloom is the first surface made this way. Next: carry a picture's maps through Scatter together (one throw,
  several maps), so Fallen Petals, Bouquets and the Meadow's near flowers can be lit the same way; then every surface
  with form, as the textures are remade (ROADMAP).

## Sources

- Habel, Kusternig, Wimmer, "Physically Based Real-Time Translucency for Leaves" (EGSR 2007), preprint:
  https://www.cg.tuwien.ac.at/research/publications/2007/Habel_2007_RTT/Habel_2007_RTT-Preprint.pdf
- Simon Green, "Real-Time Approximations to Subsurface Scattering", GPU Gems ch. 16:
  https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-16-real-time-approximations-subsurface-scattering
- Tiago Sousa, "Vegetation Procedural Animation and Shading in Crysis", GPU Gems 3 ch. 16:
  https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch16.html
- Stavenga, Staal, van der Kooi, "Conical epidermal cells cause velvety colouration and enhanced patterning in
  Mandevilla flowers", Faraday Discussions 223 (2020): https://pubs.rsc.org/en/content/articlehtml/2020/fd/d0fd00055h
- "Conical flower cells reduce surface gloss and improve colour signal integrity for free-flying bumblebees", Journal
  of Pollination Ecology (2021), abstract: https://pollinationecology.org/index.php/jpe/article/view/606
- "Creating a Game-Ready Cannon in an Arcane-Inspired Style", 80.lv:
  https://80.lv/articles/creating-a-game-ready-cannon-in-an-arcane-inspired-style
- "Lighting model for flower petals", gamedev.net forum: https://gamedev.net/forums/topic/687271-lighting-model-for-flower-petals

**Read but not used:** the Stanford CS348B flower renderings (student pages; no method stated). **Not read:** the US
patent on translucent rendering (a PDF behind a print service).
