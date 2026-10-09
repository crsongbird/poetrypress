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
Fold Ghost, Poured Wax, Cold Press, Fractured Glaze, Linen's details and
Sigil Scatter's relief. It takes detail NORMAL MAPS (Cold Press: fibres and
undulation) and MATERIAL hues (Highlight, Shade); `lightSparse` lights only
the tiles near a detail, for details scattered on flat ground (Linen,
Sigils). A texture can carry its own default light (Facet Field starts
overhead). Next: normal-map detail where heights are awkward (weave,
crazing), and a per-material gloss where one gloss won't do. Watch the cost
on phones: these take ~0.2–0.6 s at preview size and up to ~2 s at export
here, in the worker (the page stays responsive).

## 2 · Texture plan (Ruby's audit, by group)

**B · great, plus a third knob and/or the light**
- Lotus Pond: light and shading by the dial (lightHeights); a better
  seed-pod form.
- Transmutation Circles: ONE circle; Count → complexity; the dial → where on
  the page; third knob Organic ↔ Technological, with noisy bloom rising
  toward the digital end. Possibly a new name.
- Rorschach Test: revisit with the gallery tool, side by side with Ruby.
- Cartomancy: divination cards, not playing cards — custom suits from the
  app's own glyphs and magical language; more realism and variation; the
  best home for easter eggs (Saturn, Enceladus, the kitsune).
- Black Hole: look for uses of the third knob and the dial.
- Foxing: not a Touch texture (it has no light) — move it, or give it
  relief. (It represents age spots on old paper.)

**C · replace or rethink**
- Fractal Moon: rolled back to Ruby's preferred version and touched up
  (soft terminator, no target ring, no hard contour lines). Ruby to judge.
- Scrying Pool: a physically based water surface — the light dial, a
  Turbulence knob, Haze and Murk (how cloudy and dirty the water is).

## 3 · Ruby's notes, 2026-10-09 (after Jupiter–Euporie)
- **Materials everywhere** (Ruby: "use these features to the fullest extent
  of the law"). Every texture the light touches gets the full material
  controls — highlight (specular) colour, shade colour, and where it fits
  gloss and metallicity. First: Fractured Glaze, Sleep Haze (its lit smoke
  and its shadowed smoke), Cold Press, Crystal Leaf — then go through every
  texture, one by one, and use the engine wherever it makes it better.
- **The light dial as a joystick**: textures that don't use light can use
  the dial for something else, renamed to say what it does (Aurora: blend
  direction; Transmutation Circles: where on the page; …). The label comes
  from the texture's caps (`dial:`). First uses: First Snow's Wind
  Direction, Aurora Veil's Blend Direction.
- **Crystal Leaf**: the dendrites are too regular (they read as snowflakes)
  and grow the wrong way; more variation, perhaps a slider for it. Add a
  BRUSHED relief running across the light's direction, like brushed steel,
  and tiny flecks like reflections inside the crystal. Terraces don't quite
  read as bismuth yet.
- *Medium:* one more colour value, to balance the hue column (four hues
  beside the dial and the seed) — wired into the lighting and texture engine
  where it fits. Ask Ruby what it should be before building it.
- *Medium:* the dial: centre it in its space, move the reset button to a
  corner, flip the curl of the reset glyph so it points out, not in.
- Done in Jupiter–Euporie+1: randomising the background now changes the
  texture as a person would — the knobs relabel. (It also offered only some
  textures; now it offers the whole menu. A locked texture keeps its knobs.)

## Pinned
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
- The light dial for angle-only textures (Harsh Rain's slant, the hatch).

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

