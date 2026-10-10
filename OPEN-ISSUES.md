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
longer as the light lowers; none overhead), occlusion in crevices. On it:
Dune Ripples, Kintsugi, Moss on Stone, Rain on Glass, Facet Field, Cup Ring,
Old Paper, Poured Wax, Cold Press, Fractured Glaze, Crystal Leaf, Metal
Spangle, Linen's details and Sigil Scatter's relief. It takes detail NORMAL MAPS (Cold Press: fibres and
undulation) and MATERIAL hues (Highlight, Shade); `lightSparse` lights only
the tiles near a detail, for details scattered on flat ground (Linen,
Sigils). A texture can carry its own default light (Facet Field starts
overhead). Next: normal-map detail where heights are awkward (weave,
crazing), and a per-material gloss where one gloss won't do. Watch the cost
on phones: these take ~0.2–0.6 s at preview size and up to ~2 s at export
here, in the worker (the page stays responsive).

## 2 · Texture plan (Ruby's audit, by group)
- Cartomancy: divination cards, not playing cards — custom suits from the
  app's own glyphs and magical language; more realism and variation; the
  best home for easter eggs (Saturn, Enceladus, the kitsune).
- Ruby to judge (rebuilt from her notes): Crystal Leaf (now looking INTO a
  crystal — facets, a refracted layer behind, fire with dispersion, phantoms,
  rutile; its old brushed-metal look lives on as Metal Spangle, and old
  Crystal Leaf saves open there); Black Hole (ray-traced: Schwarzschild
  bending, the disc's gas and dust, Doppler beaming, lensed jets and sky —
  ~0.6 s at preview, ~2 s at export, in the worker); Fractal Moon (Clouds,
  Night Sky, earthshine, halo, falling stars); Rorschach (a different card
  each seed, Wetness, Color: black → black and red → pastel plates).

## 3 · Colour, light and material — the rest of the pass
Built: every colour has one job (test/colorRoles.test.mjs) — Light, Dark,
Material (a grey texture's surface), Highlight, Shade, Glow (a coloured
texture's emitted light); First Snow got a Snow Hue. Every texture lit by
the engine takes Highlight and Shade. The dial is a joystick where a
texture has no light: Wind Direction (First Snow), Blend Direction (Aurora),
Position (Transmutation Circle), View (Black Hole).
- Still to go through, one by one: Glows for Metal Leaf, Night City
  (city glow), Deep Field (airglow); the dial for angle-only textures
  (Harsh Rain's slant, the hatch); gloss/metallicity knobs where one gloss
  won't do.
- Metal Spangle (the old Crystal Leaf) is slow (~2–3 s here at preview
  size): the grain search looks at 25 neighbours since grains vary in size.
  Worth a lattice speed-up.

## Pinned
- Desktop: PAN AND ZOOM the preview (wheel / pinch to zoom, drag to pan,
  a button back to fit). Built so far: Esoterica opens in its own drawer
  with the left panel still open, faded; the left sidebar resizes by
  dragging its edge (remembered; double-click resets) and the image fits the
  space between. The preview "zooming out on every aspect click" didn't
  reproduce here (1440×900 and 1280×720 at 2×, every ratio, back and forth:
  the same size each time) — asked Ruby for her window size and steps.
- Saturn and its moons as a rare easter egg in a couple of presets.
- *Low:* WORD seeds, like RimWorld's. A seed is a phrase that evaluates to
  a number ("Enceladus's quiet lantern", "ember turning", "hollow tide");
  numbers still work, and every number has its own phrase, so old seeds
  keep their exact textures. Phrase patterns: "noun verb-ing", "proper
  noun's adjective noun", "adjective noun", and others. Word bank: named
  planets, moons and stars, esoteric and magical words, space concepts,
  every word of every haiku in the app, the code's own variable names.
  Decided: pinned for later — the number ↔ phrase mapping must be exactly
  reversible before it ships, and it touches save/load/share.

## Later
- Dream Bloom as the basis for a new texture (its five knobs — focal plane,
  count, aperture, object shape, color variation — make a rich engine).
- Split appEvents.js (~2,000 lines) into modules.
- Texture layers (a base texture under the main one).
- Alt text on export (the poem's words).

## Check on a phone
- The occasional blank page: frames now draw into a back buffer and reach
  the page only when whole; a failed frame keeps the last picture and
  retries. Does it still happen on the Moto G Stylus (2022)?
- The material pickers (Highlight Hue, Shade Hue) under a lit texture's hues.
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

## LAST · the preset review (do this at the very end)
Go through every preset with Ruby, one by one: what it's for, whether it's
redundant, whether it needs changing. Some are unique enough already, some
seem redundant. The element of each is recorded in appOptions.js — presets
1–4 Whimsy ♡, 5–8 Sharpness √, 9–12 Chaos ∆, 13–16 Touch 🜚 (confirmed by
Ruby) — keep it there whatever changes.

