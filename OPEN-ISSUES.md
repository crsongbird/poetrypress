# Open issues

Production: poetrypress.unfixable.place · development: vellum.unfixable.place
Release: see release.js (`node build.mjs --next` to advance). Look before
judging: `node tools/texture-gallery.mjs --only <names>` (run when asked).
Prior art and recommendations: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations" (Claude Docs).

## 0 · Performance (decide first)
See PERFORMANCE-AUDIT.md. A–I are done. Next: measure on Ruby's phone
(Chrome and Firefox; is lighting on the GPU there?), then the next GPU
candidates (Dream Bloom's convolution first). J (Linen at preview) waits.
New heavier ones to watch on a phone: Black Hole (~0.6 s preview, ~2 s
export), tilted Dune Ripples (~1.4 s export at the default tilt, ~2.6 s at
full), Scrying Pool (~1 s preview).

## 1 · Light, like a game engine
`lightHeights` (texCore) lights HEIGHTS by the dial — diffuse, specular per
material, cast shadows, occlusion; NORMAL MAPS and MATERIAL hues; `lightSparse`
for scattered details. On it now: Dune Ripples, Kintsugi, Moss on Stone, Rain
on Glass, Facet Field, Cup Ring, Old Paper, Poured Wax, Cold Press, Fractured
Glaze, Crystal Leaf, Metal Spangle, Linen, Sigil Scatter and Brushstrokes
(impasto); Scattered Polygons' Sheen tilts each flake to the dial. Cartomancy lays its cards under the dial
(shadows, curl, gilt edges). Past the dial's rim these sink the light toward
4° (long raking shadows); the rest keep the rim.
- The camera TILT is on Dune Ripples, Scrying Pool, Moss on Stone (texCore
  `obliqueFrame` / `obliqueRender` / `fieldOn`) and, as the camera's pitch,
  Painted Landscape.
- Next: normal-map detail where heights are awkward (weave, crazing);
  per-material gloss where one won't do.

## 2 · Ruby to judge (rebuilt this round, from her notes and the prior art)
- Crystal Leaf: a druse of six-faced quartz points, each face lit, striated,
  edge-worn, with a thin-film sheen; the refracted layer behind; fire and
  phantoms. (The old metal look is Metal Spangle.)
- Scrying Pool: a PLACE by the seed — koi pond, pebbled stream, wishing well —
  things at their depths, refracted and fading; shadows on the floor; Tilt.
- Dune Ripples: transverse, barchanoid or linear dunes; ripples only where
  the wind works; heavy grains in the troughs; Tilt (default 40).
- Brushstrokes (impasto) and Cartomancy (the Vellum deck: elemental suits,
  an arcana, Saturn / Enceladus / the Kitsune as rare cards).
- Scattered Polygons: the original Metal Leaf, restored exactly (its gilding
  rebuild is gone); Shape, Sheen and Glitter at 0 draw the original.
- The presets: four Simple first, then eight per element, under headings;
  Ruby's Dusk Letter (now the default) and Event Horizon applied exactly as
  she made them; boxes and blends where a texture needs them (Homebound,
  Insomnia, Stillwater, Omen, Nocturne, Homesick, Mirage, Lucid, Projection);
  the literal names renamed.
- The themes: each an element (Rose = Whimsy, Aether = Sharpness, Fathom =
  Chaos, Vellum = Touch) with a complementary second accent, slight depth,
  square corners.
- The seed: last in the tools, one line, a hair-thin scroller; what is typed
  (words or a number) stays, and is saved with its number.

## 3 · Colour, light and material — the rest of the pass
Every colour has one job (test/colorRoles.test.mjs). Unused hues are now
HIDDEN, like unused sliders. The dial is a joystick where a texture has no
light (Wind, Blend Direction, Position — now to the very corners — View),
with a centre mark and ◎ centre button, a halfway ring that catches, and ⚄
a random angle.
- Still to go: Glows for Night City (city glow) and Deep Field (airglow);
  the dial for angle-only textures (Harsh Rain's slant, the hatch).
- Metal Spangle is slow (~2–3 s at preview): its grain search looks at 25
  neighbours. Worth a lattice speed-up.

## Pinned
- Desktop: PAN AND ZOOM the preview — wheel zooms at the cursor, pinch on
  touch, bounded panning, a fit button (panzoom, Figma). (The Esoterica
  drawer, the faded sidebar and the resizable sidebar are built.)
- Weighted rare traits per seed (Fidenza's weighted choices) instead of flat
  coin-flips: the falling star, the rare cards.
- Share a look as a link (state in the URL hash), beside the spell code.
- Hover previews on presets (desktop).

## Later
- Dream Bloom as the basis for a new texture (its five knobs make a rich engine).
- Split appEvents.js (~2,200 lines) into modules.
- Texture layers (a base texture under the main one).
- Alt text on export (the poem's words); PDF export for print.

## Check on a phone
- The occasional blank page (Moto G Stylus 2022): frames draw into a back
  buffer and reach the page only when whole.
- The dial's three buttons and the seed's phrase box in the narrow column.
- Chrome vs Firefox speed; the 'two pages at once' ghost never returns.
- Textures are made in a worker: the page stays responsive while one is made.

## Worth knowing
- WORD SEEDS (seedWords.js): every 32-bit seed has exactly one phrase and
  back; the banks and their order are FROZEN (test/seedWords.test.mjs anchors
  phrases). Saves hold the number, and (textureSeedWords) whatever was typed.
- FULL presets (`full: true`) are whole saved looks, applied by
  restoreSettings except the page size.
- The camera tilt (texCore `obliqueFrame`/`obliqueRender`): build the ground
  on the frame's patch (larger than the page), light it from above, then
  render; tilt 0 returns `flat` and the texture is exactly its top-down self.
- Dream Bloom is a thin-lens camera (50 mm f/1.8): blur is a real convolution.
- Textures are made off the page's thread (textureWorker.js). Textures that
  draw text in web fonts (Transmutation Circles, Cartomancy) stay on the page.
- PML stays backward compatible: test/fixtures/pml-golden.json is never
  regenerated; font order is frozen.
- Textures measure in canonical pixels (cpx, canonArea, canonDiv); check new
  ones with tools/scale-audit.mjs.
- Blend modes can hide an inset box (Darken shows only a darker box…).
