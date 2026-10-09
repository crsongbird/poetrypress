# Open issues

Production: poetrypress.unfixable.place · development: vellum.unfixable.place
Release: see release.js (`node build.mjs --next` to advance). Look before
judging: `node tools/texture-gallery.mjs --only <names>` (run when asked).

## 0 · Performance (decide first)
See PERFORMANCE-AUDIT.md. A–I are done. Next: measure on Ruby's phone
(Chrome and Firefox; is lighting on the GPU there?), then the next GPU
candidates (Dream Bloom's convolution first). J (Linen at preview) waits.

## 1 · Light, like a game engine
`lightHeights` (texCore) is built: a texture gives HEIGHTS; it returns them
lit by the dial — diffuse, a specular per material, cast shadows (soft,
longer as the light lowers; none overhead), occlusion in crevices. Dune
Ripples, Kintsugi, Moss on Stone and Rain on Glass use it. Next: bring the
other lit textures onto it (Cold Press, Fractured Glaze, Linen, Sigil
relief). Facet Field, Cup Ring, Fold Ghost and Poured Wax are on it, and a texture
can carry its own default light (Facet Field starts overhead). Watch the cost on phones:
these take ~0.2–0.6 s at preview size and up to ~2 s at export here,
in the worker (the page stays responsive).

## 2 · Texture plan (Ruby's audit, by group)

**A · great — touch-ups only**
- Sleep Haze: read as smoke in a dusty room, not water — smoke rings,
  motes catching light.
- Pixie Dust: a third knob, Chaos; a little more variety.
- Waking Grain: a third knob, grain type (silver, film, paper, digital).
- Metal Leaf: keep. A NEW Touch texture beside it: crystalline leaf, faceted,
  using the lighting module.

**B · great, plus a third knob and/or the light**
- First Snow: third knob / light TBD (its flakes are crystals now).
- Aurora Veil: the dial as the BLEND direction; third
  knob Bloom, NOISY bloom (I + α·Blur(Bright(I))·N).
- Painted Landscape: more landscape patterns and stroke kinds; third knob
  Wetness.
- Lotus Pond: light and shading by the dial (lightHeights); a better
  seed-pod form.
- Painter's Frustration: third knob Wetness (paint blending).
- Sigil Scatter: true RELIEF from the light (carved/raised via the lighting
  module); Glow becomes Chaos (a scratchy, unsteady hand, medium noise).
- Transmutation Circles: ONE circle; Count → complexity; the dial → where on
  the page; third knob Organic ↔ Technological, with noisy bloom rising
  toward the digital end. Possibly a new name.
- Rorschach Test: revisit with the gallery tool, side by side with Ruby.
- Fractured Glaze: peeling enamel, not a dry riverbed; lit with shadows;
  third knob Enameling (bubbling, chipping; 0 = unbroken).
- Cartomancy: divination cards, not playing cards — custom suits from the
  app's own glyphs and magical language; more realism and variation; the
  best home for easter eggs (Saturn, Enceladus, the kitsune).
- Black Hole: look for uses of the third knob and the dial.
- Linen: realistic details; details cast shadows.
- Cold Press: more variation; lit with shadows.
- Foxing: not a Touch texture (it has no light) — move it, or give it
  relief. (It represents age spots on old paper.)

**C · replace or rethink**
- Fractal Moon: rolled back to Ruby's preferred version and touched up
  (soft terminator, no target ring, no hard contour lines). Ruby to judge.
- Scrying Pool: a physically based water surface — the light dial, a
  Turbulence knob, Haze and Murk (how cloudy and dirty the water is).

## Pinned
- Saturn and its moons as a rare easter egg in a couple of presets.

## Later
- Dream Bloom as the basis for a new texture (its five knobs — focal plane,
  count, aperture, object shape, color variation — make a rich engine).
- Split appEvents.js (~2,000 lines) into modules.
- Texture layers (a base texture under the main one).
- Alt text on export (the poem's words).
- The light dial for angle-only textures (Harsh Rain's slant, the hatch).

## Check on a phone
- The occasional blank page: frames now draw into a back buffer and reach
  the page only when whole; a failed frame keeps the last picture and
  retries. Does it still happen on the Moto G Stylus (2022)?
- Chrome vs Firefox speed, now that the page canvas is a CPU canvas (Chrome
  was slower); and that the 'two pages at once' ghost never returns.
- The colour picker's Done; undo / redo; the preview's scale steps.
- Textures are made in a worker (textureService.js): the page should stay
  responsive while one is made; older Safari (before 16.4) makes them on the
  page, as before.

## Worth knowing
- Dream Bloom is a thin-lens camera (50 mm f/1.8): blur is the object
  convolved with the aperture's own outline, light is conserved and clips like
  a sensor, with spherical aberration and cat's-eye vignetting. Dots render in
  well under 0.1 s; extended objects (leaves, snowflakes) take 1–2 s, in the
  worker, since each is a real convolution.
- Textures are made off the page's thread (textureWorker.js, embedded by
  build.mjs). Textures that draw text in web fonts (Transmutation Circles,
  Cartomancy) stay on the page — a worker can't see the page's fonts.
- PML stays backward compatible: test/fixtures/pml-golden.json is never
  regenerated; font order is frozen.
- Textures measure in canonical pixels (cpx, canonArea, canonDiv); check new
  ones with tools/scale-audit.mjs.
- Blend modes can hide an inset box (Darken shows only a darker box…).
