# Cel-Shaded Worlds Prior Art: the first love letters to video games

**The brief (Ruby, 2026-10-19):** "we should come up with other filters that are love letters to video games. I am a
game dev first after all" — all of cel-shaded worlds, painted 2D, retro hardware, atmospheric journeys, city simulators
and space games, eventually; "focus on cell shaded stuff at first". A nod to a look, never a character, a logo or a
name (ROADMAP L5). What could live in another group hides there and only nods (the Meadow already reads as a famous
green field).

**Key:** [src] read this session (Sources). [est] my design.

---

## 1. What cel shading is

- Lighting is computed as usual, then "quantized to a small number of discrete shades", so shadows and highlights are
  flat blocks of colour, not gradients [src: Wikipedia, Cel shading].
- The name comes from the painted acetate cels of 2D animation; it first meant the flat shading, and only later the ink
  outlines too [src: Wikipedia].
- Outlines, when there are any: an inverted hull (the back faces drawn black, slightly enlarged) or edge detection on
  depth and normals [src: Wikipedia]; or a hard cutoff where the surface turns from the eye, N·V < 0.2 [src: Flax].
- A practical recipe: the brightest light's N·L into three bands, with hard thresholds — highlight above 0.9, key
  above 0.4, shadow below — each band its own colour [src: Flax Engine].

## 2. The sea and sky of the great cel-shaded sailing game (2002)

- Its art director chose the style so that puzzles and objects read clearly: photorealism "would have made information
  harder to convey" [src: Wikipedia, quoting Takizawa].
- Wind comes "in beautiful, large streams", fires in "wide bursts", and waves are "actual giant lines on the ocean";
  effects that don't try to be real are why it hasn't dated [src: Source Gaming].
- Its clouds were "affected by the wind" [src: Zelda Universe]; its effects are drawn through black-and-white masks
  ("the ocean, fire and particle effects") because the hardware had no shaders [src: Gordon, Medium].
- A faithful fan shader of its water: three colours only (water, second water, foam), sampled from the original; the
  foam is about a hundred hand-placed circles in a seamless tile, the coordinates warped by noise so the pattern isn't
  rigid; a second, reversed layer of the same pattern adds more foam [src: Godot Shaders].
- Stylized water generally: simplified forms, "very reduced gravity waves", hand-drawn foam lines, a muted art-directed
  palette, caustics kept because they "felt right" [src: 80.lv, Nimue].

## 3. Its successors, and the ink-painted one

- The open-world successor kept the toon lineage but aimed for "an information-dense, mature art style" and a slogan
  of "Refreshing and full-flavoured" for its shaders, lighting and weather [src: Zelda Universe; Thumbsticks].
- The ink-painted wolf game "abandoned the realistic style" for traditional Japanese art, to capture the countryside's
  beauty [src: Wikipedia, Cel shading]. (Its brush-and-paper look is a later love letter: §5.)

## 4. The first surface: Windward Sea [est]

A sea and sky in the cel-shaded sailing look, built from general parts and no new part:
- **Light in bands.** The Light Engine lights the clouds' and islands' rounded heights from the dial; its light is
  posterized into two to four bands (Toon Bands) and each band mapped to a hue: the shadow, the key, a bright edge.
- **The sea: three colours.** Sea, a second deeper sea, and foam. Foam is circles (Cells' distance, thresholded) warped
  by noise, as the fan shader does; the "giant lines" of the waves are thin bands of Waves, warped, white; both laid
  into Perspective so they recede to the horizon. The sun's path is a column of flat glints on the water.
- **Clouds** that read as drawn: noise thresholded hard into puffs, Twirl curling them into the swirls (Swirls), lit in
  bands; **wind** in long white streams (Flow Lines, thinned).
- **Islands** on the horizon, toon-lit hills (Islands: none to several).
- **The sun** stands where the dial lays it: across by the light's way, as high as its height, so a low light sets it
  into the sea behind the islands (Sunset Sail).
- **As built:** the foam is Scatter's dots, not Cells, and the waves' lines Scatter's dashes, both thrown smaller with
  depth (Scatter's Size as a map) and flattened: Perspective over a tile that isn't seamless showed seams. Wind is
  Flow Lines thinned and let through only where a broad noise allows, wider as Wind rises.
- **Six hues:** Sky, Sea, Deep Sea, Foam (also the clouds' lit side), Island, Sun.
- **Its home:** Places & Scenes (a sea could live there; it only nods).

## 5. Later love letters (ROADMAP L5)

- **Ink and brush** (the wolf game): sumi-e strokes, a parchment ground, the outline as a brush.
- **Painted 2D** (Hollow Knight, Ori, Gris): layered parallax silhouettes, glowing motes, watercolour washes.
- **Retro hardware**, in a Video Games group: PS1 (affine wobble, dithering, fog), a handheld's four greens, a CRT
  arcade, 16-bit parallax.
- **Atmospheric journeys**: glittering dunes, vast ruins in mist, a lone tower.
- **City simulators**: a city from above, zoning colours, traffic and night lights.
- **Space games**: a cockpit's star map, a jump gate in a nebula.
- **Small nods**: stitches and underlines with a game's grammar (a row of hearts, a dialogue box), a pixel font, a
  Sierpiński triangle's first steps (mathematics, under a name of its own).

## Sources

- Wikipedia, "Cel shading": https://en.wikipedia.org/wiki/Cel_shading
- Flax Engine manual, "Cel Shading": https://docs.flaxengine.com/manual/graphics/shaders/cel-shading.html
- Source Gaming, "Holism: The Wind Waker's cel-shaded graphics":
  https://sourcegaming.info/2017/08/10/holism-the-wind-wakers-cel-shaded-graphics/
- Zelda Universe, "Cloudscape": https://zeldauniverse.net/2005/08/15/cloudscape/
- Nathan Gordon, "Wind Waker Graphics Analysis" (Medium): https://medium.com/@gordonnl/wind-waker-graphics-analysis-a0b575a31127
- Godot Shaders, "Wind Waker water – no textures needed": https://godotshaders.com/shader/wind-waker-water-no-textures-needed/
- 80.lv, "How to Build a Stylized Water Shader" (Nimue):
  https://80.lv/articles/how-to-build-stylized-water-shader-design-implementation-for-nimue/
- Zelda Universe, "Takizawa explains how the Wind Waker HD inspired the visual style for Breath of the Wild":
  https://zeldauniverse.net/2017/03/14/takizawa-explains-how-the-wind-waker-hd-inspired-the-visual-style-for-breath-of-the-wild/
- Thumbsticks, "GDC17: Designing Zelda: Breath of the Wild": https://www.thumbsticks.com/gdc17-designing-zelda-breath-of-the-wild/

**Read but thin:** Zelda Dungeon's summary of a Polycount analysis (the analysis itself is linked, not reproduced).
**Not read:** Wikipedia's Okami page (the fetch timed out); its facts here come from the Cel shading page.
