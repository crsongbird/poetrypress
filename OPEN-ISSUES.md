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
full), Scrying Pool (~1 s preview), Burnt Letter (~0.6 s preview, ~1.2 s
export). Metal Spangle is ~35% faster (same pixels).

## 1 · Light, like a game engine
`lightHeights` (texCore) lights HEIGHTS by the dial — diffuse, specular per
material, cast shadows, occlusion; NORMAL MAPS and MATERIAL hues; `lightSparse`
for scattered details. On it now: Dune Ripples, Kintsugi, Moss on Stone, Rain
on Glass, Facet Field, Cup Ring, Old Paper, Poured Wax, Cold Press, Fractured
Glaze, Crystal Leaf, Metal Spangle, Linen, Sigil Scatter, Brushstrokes
(impasto) and Burnt Letter; Scattered Polygons' Sheen tilts each flake to the dial. Cartomancy lays its cards under the dial
(shadows, curl, gilt edges). Past the dial's rim these sink the light toward
4° (long raking shadows); the rest keep the rim.
- The camera TILT is on Dune Ripples, Scrying Pool, Moss on Stone (texCore
  `obliqueFrame` / `obliqueRender` / `fieldOn`) and, as the camera's pitch,
  Painted Landscape.
- Next: normal-map detail where heights are awkward (weave, crazing);
  per-material gloss where one won't do.

## 2 · Ruby to judge (this round)
- Fonts: Fraunces (full softness) for the title, card headings, tabs and big
  buttons; Literata for the rest; Courier Prime for code. Hints, chips and
  buttons 12.5px, tile names 11px, inputs 16px on phones. (There was no 76px
  tile: tiles were already ~95–105px; four per row now never fall below 80px.)
- Burnt Letter (new, 🜚): the ash a burnt page leaves — curled flakes charred
  black to pale rims, crazed along the page's lines, some still alight
  (Embers, Ember Hue). Ashfall is built on it now (hatch stays Dusk Letter's).
- The report: with the surface off, its knob, hue, light and seed lines go.
- Desktop: pan and zoom the preview (Panzoom): wheel at the cursor, drag once
  zoomed, double-click or ⟲ to fit; it redraws sharp for the zoom.
- Hover a preset (desktop) to try it on the page; off the grid, your look
  comes back exactly; a click keeps it. Never an undo step.
- Share: with no spell chosen, Share sends the look on the page now; links
  are deflated (about half as long). Old links still open.
- Weighted traits: the falling star (one, a fireball, a pair, or none) kept
  in view; the rare cards Saturn 3 : Enceladus 2 : the Kitsune 1.
- Glows: Night City's city glow (Insomnia has it), Deep Field's airglow in
  fine waves (both the Glow Hue; black is none).

## 3 · Colour, light and material — the rest of the pass
Every colour has one job (test/colorRoles.test.mjs). Unused hues are now
HIDDEN, like unused sliders. The dial is a joystick where a texture has no
light (Wind, Blend Direction, Position — now to the very corners — View),
with a centre mark and ◎ centre button, a halfway ring that catches, and ⚄
a random angle.
- Still to go: the dial for angle-only textures (Harsh Rain's slant, the
  hatch) — waiting on Ruby (see the open questions).

## Pinned
- (Built this round: pan and zoom, weighted traits, share the look as a
  link, hover previews.) Next candidates are in the brainstorm in Ruby's doc.

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
- The new fonts' sizes in the narrow column (ANDROMEDA just fits at 360px).

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
- WEIGHTED traits: texCore `pickWeighted([[value, weight], …], roll)` — one
  draw, like the coin-flip it replaces, so seeds keep their other features.
- The report drops a line whose surface variable has nothing to say
  (pmlVars LINE_DROP, ctx.surfOff).
- Panzoom and Coloris load from jsdelivr at exact versions; the app must
  work without either (offline before first cache).
