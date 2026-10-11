# AGENTS.md — Unfixable Vellum

Guidance for AI agents (and people) working on this codebase. Read it before
changing anything. Rules here were set by Ruby, the poet who owns this
project; where a reason is given, the reason is what matters.

---

## What this is

**Unfixable Vellum** (a.k.a. PoetryPress) turns a poem into an image people
stop to read. It is a single-page, phone-first web app, written in **plain
ES modules — no framework, no dependencies**. Poems are written in **PML**
(Poetic Magick Language), a small markup language; the page is drawn on a
canvas with generated textures, borders, an inset box and text effects; the
result is saved as a 3072 px JPEG.

- Production: `poetrypress.unfixable.place` · development: `vellum.unfixable.place`
- Releases are named for moons (`release.js`): Jupiter's, in order of
  distance from the barycentre; Saturn's after the final release.

---

## Commands

```sh
node build.mjs            # flatten all modules into dist/index.html (+ the texture worker, sw.js, manifest)
sh test.sh                # parse check + build + all test suites — must end "all N suites passed"
sh check.sh file.js …     # syntax-check modules quickly
node build.mjs --zip      # archive the project into release/ (keep only the latest archive)
node build.mjs --next     # advance release.js to the next moon — once per shipped release

npm install @napi-rs/canvas                    # once, for the tools below
node tools/texture-gallery.mjs --only a,b      # render textures on four backgrounds — ONLY when a visual review is asked for
node tools/scale-audit.mjs [--knobs min|max]   # does a texture look the same drawn small?
python tools/page-audit.py                     # the same for whole pages, every preset (needs Playwright)
node tools/look.mjs '<json>' out.png <cols>    # quick look at specific texture settings
python3 tools/icons.py                         # redraw the nav glyphs, the sigil and the app icons
```

Releases are named for moons, in order from their planet (release.js, shown by
`§Build`; `Jupiter–Io`: an en dash, as a slash would split a PML segment).
Jupiter now; Saturn after the final release. Don't trust `node --check`
here: with no package.json declaring modules it passes broken files that
contain `export`; `sh check.sh` parses for real. The README is for people,
not builders: brief, with room left for discovery (Ruby) — technical matter
lives here, the markup in PML.md.

Deploy: upload the whole `dist/` folder (the page, `sw.js`, `manifest.webmanifest`, `icons/` — the
service worker must be its own file, or the app won't install or work offline). The site may also be served straight
from the source files (unbuilt) — everything must work both ways.

---

## Repository map

| File | Role |
|---|---|
| `index.html` · `poetrypress.css` | markup and all styles |
| `appEvents.js` | UI wiring and the entry point; the app's state lives in ONE object (`state`) at its top |
| `canvasRenderer.js` | `render()`: backdrop, texture, vignette, box, border, text, credit, spell |
| `textParsers.js` | PML → lines/segments (`buildLines`, `parseRule`) |
| `pmlVars.js` | `§Variables`, resolved before PML parses |
| `effects.js` | the text effect stack (definitions, `/fx:` parsing, old forms translated) |
| `stitches.js` | decorative motifs along any path (rules, borders, seams, inner edges) |
| `textureGenerators.js` | texture registry (`TEXTURE_PARAMS`, `TEXTURE_CAPS`), dispatch, cache, cache keys |
| `texCore.js` | shared texture maths: seeded RNG, noise, `pixelPass`, canonical pixels, `lightHeights` |
| `texWhimsy.js` · `texSharpness.js` · `texChaos.js` · `texTouch.js` | generators, one file per element |
| `textureService.js` · `textureWorker.js` | textures made off the main thread |
| `textureElements.js` | each texture's four readings (🜂 🜄 🜁 🜃), one its default |
| `steps.js` · `stepsTouch.js` · `stepsChaos.js` | THE STEPS: the operations surfaces are made of — the Athanor's parts, and the textures rebuilt as chains |
| `cartomancy.js` | Cartomancy: a card game in progress, and its parts — table, card, coin, the deal by a game's rules — also the Athanor's Table, Deal and Coins steps (CARD_STEPS) |
| `chains.js` | textures rebuilt as chains of steps (Harsh Rain, Silverpoint Hatch, Linen Tooth, Fractured Glaze); each an Athanor template |
| `athanor.js` · `forge.js` | the Athanor: graph walker, cache and budget (in the worker) · node editor UI (Drawflow) |
| `boxFx.js` | the inset box's glass and GPU blends |
| `runology.js` | Ruby's Runes of Power: Archetypes, Accent Runes, Chroma (its words in the seed banks, its glyphs among the spell glyphs) |
| `altText.js` · `jpegMeta.js` | the saved image's alt text: the poem, then the look in words (≤1500) · written into the JPEG (XMP) |
| `symbolLore.js` | Symbology's glyphs with names and families (spell glyphs, circles, cards) |
| `murmur.js` | soft interface sounds (Symbology's engine, Vellum's sounds); off until turned on |
| `appOptions.js` | fonts, presets, aspects, defaults, the opening template |
| `strings.js` · `tunables.js` | hand-editable text · hand-editable numbers |
| `spell.js` · `vault.js` | glyph spells; saving, sharing and the Grimoire |
| `glyphs.js` · `moon.js` · `fonts.js` · `palette.js` · `theme.js` · `swatches.js` · `pwa.js` · `editor.js` | inline glyphs, moon phases, lazy fonts, theme palettes, preset tiles, installability, the PML editor |
| `release.js` · `build.mjs` · `test/` · `tools/` | release name · bundler · tests · dev tools |
| `OPEN-ISSUES.md` | the to-do list (open items only) · `README.md` — the human-facing reference |

---

## How it works (the parts that bite)

- **Rendering.** `render()` draws in this order: backdrop → texture(s) →
  vignette → inset box → border (bloom on its own half-resolution layer) →
  text (effects under the glyphs, then glyphs) → credit and spell. Stages are
  timed (`§Profile`).
- **Canonical pixels.** Everything is measured in pixels of the 3072 px
  EXPORT, times a scale `S` (render size ÷ export size): `cpx(n)`,
  `canonArea(w,h)`, `canonDiv(d)` in `texCore.js`; `rpx(n)` in the renderer.
  The preview is drawn at screen size (S in steps ¼ ⅓ ½ ⅔ 1) and must look
  like the export scaled down.
- **Textures in a worker.** The renderer asks `textureService.requestTexture
  (slot, …)`; a cached texture returns at once, otherwise the worker makes it
  while the slot shows its previous texture. Requests coalesce (only the
  latest per slot waits). Save image awaits `texturesSettled()`. Textures that
  draw text in web fonts (`summoning`, `cards`) stay on the page — a worker
  can't see the page's fonts. The page and worker share `textureKeyFor()`.
- **Light.** The ☉/🜚 dial sets a direction and a height (`textureLight`,
  `textureLightTilt`). `lightVec` scales by height; `lightHeights(H, …)`
  lights a height field like a game engine (diffuse, specular by material,
  soft cast shadows, ambient occlusion). New lit textures should build a
  height field and use it.
- **Knobs.** A texture declares 2–5 knobs in `TEXTURE_PARAMS`; the third is
  always `form` (Dream Bloom alone has a 4th `shape` and 5th `hue`). Knobs may
  carry `ticks`, `names` and `dice`.
- **Effects.** One stack of up to three effects, page-wide (UI slots) or per
  segment (`/fx:`); underlines are stitch decorations (`/under:`).
- **Persistence.** The `PERSISTED` table in `appEvents.js` maps saved keys to
  controls; `stripToLook()` removes the poem, locks and credit from a look.

---

## Invariants — never break these

Each is guarded by a test; if one fails after a deliberate change, update the
test to the new intent, never weaken it until it passes.

- **PML is a contract.** Every existing poem must render identically.
  `test/fixtures/pml-golden.json` is NEVER regenerated — find what changed.
  Add directives; never redefine `/fx0 /fx1 /fx2`, the bracket accents, or
  any line prefix. New parser fields must be absent (or `undefined`) when
  unused.
- **Every styling field a segment can set** must be listed in
  `resolvePartStyle`'s early-return guard, or it is silently ignored.
- **Font order is frozen** (`/f:N` picks by position): append only.
- **Word-seed banks are frozen** (seedWords.js): every phrase anyone has seen
  depends on the banks' words and order. Never edit, reorder or append.
- **Presets the person called perfect** (Andromeda, Euphoria, Lotus Bloom,
  Gateway, Sealed) are copied verbatim; the grid's groups live in
  PRESET_GROUPS, not on the presets.
- **Saved keys are frozen.** `PERSISTED` key names and value types never
  change once shipped; old looks translate forward (see `applyLegacyEffects`,
  `RETIRED`, the light-tilt default). A texture whose LOOK is replaced gets a
  NEW id and the old id is retired to whatever kept the old look: Crystal
  Leaf's metal is `spangle` (Metal Spangle), the new crystal is `crystal`,
  and `crystalleaf` → `spangle` in both `RETIRED` and `retireLook`. Never
  reuse an id for a different picture: saves carry no version.
- **Textures change only on purpose.** `test/fixtures/texture-fingerprints.json`
  is updated with `--update` only for the textures you meant to change —
  check the "changed textures" list first.
- **Canonical pixels.** No raw `(w*h)/K` counts, no fixed-pixel line floors,
  working grids via `canonDiv` — at S = 1 every conversion must be
  pixel-identical.
- **Texture options by name**, never by position (a tint once landed in the
  light slot).
- **The built page is a plain script**: no `import.meta` anywhere in it; no
  duplicate top-level names across modules; each module bundled after its
  imports.
- **Phones:** vertical sizing uses `--vvh`, never bare `vh`; one scroller in
  focus mode; the editor mirror matches the textarea's metrics.
- **Text:** user-facing strings live in `strings.js`, American spelling, no
  HTML entities (text nodes don't decode them). `applyStrings` replaces a
  node's own text only.

---

## The persistence rule (Ruby's standing rule)

ANY control a person can change — a field, slider, colour, toggle, menu —
must be captured by the look: saved (`serializeCurrentSettings`, usually a
row in `PERSISTED`), restored (`restoreSettings`), and therefore carried by
the Workbench JSON, the Grimoire and shared spells (local storage), and
undo/redo, which are all built on those two functions. Presets that don't set
it must reset it (a value must never leak from one preset into the next).
`test/persistenceCoverage.test.mjs` finds every control on the page by itself
and fails on any that isn't saved and restored; the only exceptions are in its
EXEMPT list, each with its reason (app preferences, the JSON box, dialogs).
`test/audit.test.mjs` checks the other direction (every saved key round-trips).

## The componentizing rule (Ruby's standing rule)

Every texture touched is taken apart as it is touched: its working parts
become STEPS (steps.js and its siblings), general enough for the Athanor and
for other textures, and the texture becomes a CHAIN of them (chains.js) with
a canonical wiring a person can read — inputs (Knobs, the Dial, Hues) on the
left, wired into ⚙ ports, the Surface on the right (layoutAthanor). Before
writing a new part, look for one to reuse or generalise; a part made for one
texture is a debt. Aim between too general (a noise) and too specific (one
picture): a part someone would reach for twice.

The texture MENU grows by the same thinking: groups by how a surface is made
and what it is for (index.html #textureType), each alphabetical. Add a group
when a kind of surface appears, but never one with fewer than three in it.

## Recipes

**Rebuild a texture as a chain** (Ruby: every texture we touch is rebuilt
this way — a long refactor, one texture at a time)
1. Find (or write) its STEPS in the library: `steps.js` for general ones,
   a family file (`stepsTouch.js`, `stepsChaos.js`, …) for a surface's own.
   A step is `{ cat, label, ins, outs, params, cost, run(E, n) }`; it reads
   params through `E.num` (so they may be BOUND: `'@k2[10,700]'`, `'@dial'`),
   draws marks with `E.marks`, sizes in canonical pixels with `E.px`.
2. Add the chain to `chains.js`: nodes, wires, Knob nodes as the sliders'
   legend, `div` (or `grid`) for its working grid. Bind each slider to the
   step params it drives, across the slider's own range.
3. In `textureGenerators.js`, dispatch the type to `genChain`; delete the old
   generator (keep its haiku, beside the step that inherited it).
4. If a slider's job changed, bump `LOOK_VERSION` (appEvents.js) and
   translate older looks in `retireLook`; update the four readings.
5. Render it (the readings sheet), time it, accept new fingerprints.

**Add a texture**
1. Write `genX(w,h,amt,zoom,…)` in the element's file. Measure in canonical
   pixels; draw on `document.createElement('canvas')` with `CPU`; no DOM
   beyond that (it runs in a worker); no `Path2D` or `isPointInPath`
   dependence (use plain geometry — see `apertureOutline`).
2. Register it: `TEXTURE_PARAMS`, `TEXTURE_CAPS`, the dispatch in
   `buildTexture`, the picker `<option>` (inside its element's `<optgroup>`)
   with a `strings.js` entry, and the randomiser list in `appEvents.js`.
3. If it draws text in web fonts, add it to `ON_PAGE` in `textureService.js`.
4. Run the tests, accept its first fingerprint, check `scale-audit`, and look
   at it (`texture-gallery`) before calling it done.

**Add a setting** — markup, `PERSISTED` row (or explicit save + restore),
preset handling (reset when a preset doesn't set it), the `audit.test.mjs`
mutation table, a `strings.js` label. `persistenceCoverage.test.mjs` will
fail until it is saved and restored. Frame settings reset at
preset-apply (`FRAME_DEFAULTS`) so one preset never leaks into the next.

**Add PML** — parse in `textParsers.js` (field absent when unused), add it to
the line-rebuild copy list and to `resolvePartStyle`'s guard, document it in
the in-app help (terse) and `README.md`.

**Add a §Variable** — `pmlVars.js` (and its context in the renderer). A value
must never contain `/` if it may land inside a segment (that is why the
release reads `Jupiter–Io`, with an en dash).

**Ship a release** — tests green → `node build.mjs --next` → build → `--zip`
(remove the previous archive) → unpack the archive and run its tests →
present the archive once.

---

## Performance

`PERFORMANCE-AUDIT.md` holds the measurements and the open proposals. Text
measurement once took ~70% of the page's CPU: fitting predicts the size and
checks the grid around it, and widths are remembered (cleared when a font
arrives) — keep any new text layout on that path. Prove a speed-up with the
before/after measurements AND an identical-render comparison.

- **The lighting engine** (`lightHeights`, texCore) takes a HEIGHT field
  (bump mapping: normals by finite differences; heights also cast the shadows
  and darken crevices) and optionally a detail NORMAL MAP (`opts.normals`,
  x y z per pixel, blended by adding slopes). `opts.components` returns
  diffuse and occlusion apart; `L.flat` is open flat ground's light.
  MATERIALS: `materialOf(highlight, shade)` (null when both white),
  `litK(L, i, ambient, M, c)` / `litS(M, c)` per channel — the Shade hue
  colours what's darker than flat ground, the Highlight hue the shine; hues
  are normalised to white's brightness. With white hues a texture must draw
  exactly as before (the fingerprints prove it). Caps `material: true` show
  the two pickers (`textureTint3Hex`, `textureTint4Hex`).
  Heights or normals? Heights for anything that should CAST a shadow (the
  shadow tracer marches over them); normals for detail that only shades
  (fibres, gentle undulation) — see Cold Press. Keep a lit texture's height
  range to what casts shadows: the trace length follows it.
  SPARSE details on flat ground (seams and buttons on cloth, carved sigils)
  use `lightSparse(H, …)`: it lights only the tiles a detail's shadow can
  reach (one-sided margins: shadows fall away from the light) and is exact
  — it passes the whole field's march (`opts.marchSteps`) to every piece.
  Open ground gets `flat` light, so far from a detail the texture is untouched.
- **Colour roles** (textureGenerators `hue5`, test/colorRoles.test.mjs):
  every hue has ONE job — Light / Dark (lighter and darker marks), Material
  (a grey texture's surface, through `pixelPass`'s ground), Highlight /
  Shade (glints and cast shadow, `material: true`), Glow (a coloured
  texture's emitted light, `hue5.role: 'glow'`). Each hue's "none" (white,
  black, mid-grey) must draw exactly as before. `pixelPass` keeps a mark's
  own colour, so materials survive the Light/Dark tint.
- **The dial as a joystick**: `caps.dial` renames it (Wind Direction, View…);
  rename labels with `setLabelText`, never `textContent` (that wiped the
  padlocks). Point things FROM the dial's handle: (cos a, sin a) with
  a = (deg − 90)° points toward it.
- **GPU lighting** (`texCore.js`): the WebGL2 shader must stay line-for-line
  the CPU `lightHeights` — change both together, and compare them (the
  worker takes `opts.cpuLight`; they agree to within 1/255 today). Emulated
  WebGL steps aside. Node always runs the CPU path, so fingerprints test it.
- **Measure on the right machine.** This sandbox has one core and no GPU:
  parallel workers and shaders can't show their gains here, and timing
  harnesses lie easily (renders are scheduled a frame later). Count events
  rather than infer them from idle states.

## Pitfalls we hit (so you don't)

- `amt` is floored at 2%; a knob that must reach 0 needs its own key (`stones`).
- build.mjs flattens every module into ONE scope: two modules declaring the
  same top-level name (a `clamp255` helper, say) break the bundle. Name
  helpers per module.
- A sixth knob exists (texP6, key `tilt`): a camera's Tilt. New knob keys must
  be wired through describeRequest (cache key), readParam, the extra object,
  appEvents (persist, restore, presets, listeners) and test/audit.test.mjs.
- `-x**2` is a SyntaxError in JS; write `-(x**2)`. It has bitten five
  textures. `node --check` does not always catch it in a module: render.
- The canvas mock's pixel sum is RGB: black ink sums to ~0, so a knob that
  only changes black pixels looks "inert" (Rorschach) — make some drawn mark
  respond to it too, or the probe can't see it.
- Ray-traced textures (Black Hole) trace every OTHER working pixel and only
  trace the in-between ones where neighbours differ; the sky is sampled at
  full size through the lens map so stars stay sharp. Lensing shears stars
  tangentially far from the hole — that is physics, not a bug.
- A canvas mock in Node backs the tests: it has no `Path2D`, no
  `isPointInPath`, and only counts what it counts — if a knob "has no
  effect", check whether the probe can see it before changing the texture.
- The worker's script block must be in `<head>` (it must exist before the
  page script first asks for a texture).
- The preview's first real measurement may step its scale down; later layout
  changes may not (hysteresis). A desktop once drew 3072 px all session.
- `__BUILD_STAMP__` unreplaced reads as underline markup in PML.
- **Two pages at once** (a ghost of the previous look under the new one)
  came from a frame aborted mid-blend: the next frame inherited the blend.
  `render()` now resets the context first; keep it that way, and never let a
  draw call abort a frame. Never `close()` a cached ImageBitmap — the texture
  service may still be showing it.
- **Every 2D context prototype gets the inline-glyph hook** (`glyphs.js`):
  the page canvas AND OffscreenCanvas (the back buffer). Missing one draws
  every inline glyph as the font's missing-character box.
- **Blank pages on phones**: `render()` draws into a back buffer
  (`renderInto(BACK)`) and copies it to the page only when the frame is whole;
  a failed frame keeps the last picture, frees caches and retries. Don't draw
  to `#poemCanvas` from inside `renderInto`. The baseline phone is a Moto G
  Stylus 5G (2022) — mid-range, 2022.
- The page canvas is a CPU canvas (`willReadFrequently`), like every layer
  drawn into it; a GPU page canvas re-uploads CPU layers every frame (Chrome).
- Blend modes can hide an inset box (Darken only shows a darker box…).
- Grey-ground textures are neutral at 128; colour-keyed ones inherit accents
  unless a tint is given.

---
- build.mjs flattens `export async function` too (it used to stop at
  `export function`); a module statement that survives flattening fails the build.
- Weighted choices: texCore `pickWeighted`; pass an existing roll to keep a
  seed's other draws where they were (the falling star reuses `shootP`).
- A glow (hue5 role 'glow') is black by default and must be a no-op when
  black — screen it, or skip when the colour sums to ~0.
- Deep Field is two requests (astral_fog, astral_stars); its Glow Hue rides
  on astral_stars (describeRequest and glowOf map it to astral's caps).
- Glass for the inset box (boxFx.js) works on the page's own canvas: it reads
  ctx.canvas for the box's rectangle, so it must run after the backdrop,
  texture and vignette and before the text.
- A texture whose option value is also used elsewhere in the markup (the
  box's Frosted Glass is value="frost") is counted once (tests use a Set).
- Stitches are retired by ALIAS, never deleted outright (old poems parse them).
- A generator must not draw Math.random once PER PIXEL before its main
  features (the count changes with the size, so a preview and its export get
  different features): hash the canonical position instead (see Burnt
  Letter's piles), or make per-pixel randomness the last thing drawn.
- Counts and sizes are canonical (canonArea, cpx, or fractions of the working
  grid's unit) — never "per pixel of this canvas".
- Text effects never blur with ctx.filter (a whole layer per call, ~100×
  slower than a shadow, and per LETTER when a run is tracked): use softText in
  canvasRenderer, a shadow of letters set off the page. Measure canvas work
  with the canvas FLUSHED (getImageData of one pixel): draws are deferred, and
  a timer around them alone reads ~1 ms whatever they cost.
- The Athanor's graphs carry a version (`v`). Never change what an old
  version makes; add a version instead (athanor.js ATHANOR_VERSION).
- Rain on Glass simulates on the EXPORT's grid at every size, then scales: a
  chaotic sim fed sizes that differ by a fraction drifts apart.
- Detail too fine for heights is a NORMAL MAP (Cold Press fibres, Linen's
  weave, the glaze's fine crazing); a surface of two materials takes a
  `glossMap` (Kintsugi's gold, Moss beside stone, glaze beside bare body).

## Systems worth knowing
- WORD SEEDS (seedWords.js): every 32-bit seed has exactly one phrase and
  back; the banks and their order are FROZEN (test/seedWords.test.mjs anchors
  phrases — the last re-cut was Ruby's, for variety). The top 4 bits of
  mix(n) pick one of 16 sentence SHAPES (SW_SHAPES), the 16th split into six
  small ones (SW_SMALL) so every shape spends exactly its bits. Verbs are
  'base' or 'base|past|participle' (swForms makes the tenses); time phrases
  never end in -ing. Parsing is a backtracking match, kept only if the number
  regenerates the same text. Internal names are sw/SW_ (the bundle is one
  scope). Saves hold the number, and (textureSeedWords) whatever was typed;
  the page shows only the phrase (the number is its tooltip).
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
- Panzoom and Coloris load from jsdelivr at exact versions (Drawflow too,
  only when the Athanor opens); the app must work without them.
- STITCHES: STITCH_STYLES is the menu; STITCH_ALIASES maps the retired to
  their relatives; parse with STITCH_NAMES, draw through stitchOf(). Every
  kept motif has an `edge` (its silhouette) — a new motif needs one too.
- LINKED CONTROLS: `data-link="<id>"` + `data-link-switch="<checkbox>"` mirror
  two controls both ways while the switch is on (the box ⛓ border).
- The box's glass and GPU blends: boxFx.js; `?softgl` in the address lets a
  machine without a GPU test the GPU path (body[data-glass] says which ran).
- The Athanor's graph is Drawflow's export JSON in #forgeGraph (PERSISTED,
  but not an undo step), saved WITHOUT node faces (forge.js redraws them from
  FORGE_NODES on load). athanor.js evaluates it; type 'athanor' in the
  texture tables has six plain knobs (k1–k6) — the page relabels them from the
  graph (applyAthanorGraph), and the cache key carries athanorHash(graph).
- The Athanor's graphs carry `v` (athanor.js ATHANOR_VERSION). v1 drew all
  nodes' randomness from one stream; v2 seeds each node from (seed, id), which
  is what makes the kept results (ATHANOR_KEPT) safe. Never change what an
  old version makes: add a version.
- Text effects never blur with ctx.filter: use softText (a shadow of off-page
  letters, carried through the transform).
- THE FOUR READINGS (textureElements.js): a new texture needs all four (the
  test says so), its default marked by `def`. Check a new reading by
  rendering it; keep its knobs inside the texture's ranges.
- Texture layers: the base layer is drawn first, in its own slot ('base'),
  with the main seed ^ 0x5bd1e995; presets turn it off (FRAME_DEFAULTS).
- RUNOLOGY (runology.js): Ruby's Runes of Power — Archetypes, Accent Runes,
  Chroma — as Symbology carries them. Its WORDS are in the seed banks, its
  GLYPHS among the spell glyphs (Ruby: no rune of its own for a seed or a
  look). §Rune!name, §SpellRunes. 'Chrysm' and 'Pandorans' are words Ruby set
  aside: Vitrum and Runists instead.
- ALT TEXT (altText.js → jpegMeta.js): the poem without markup, then the look
  in plain English (typeface, colours named, surface and its settings in
  words, frame), clipped to 1500 — the poem gives way first. Written into the
  JPEG as XMP (IPTC AltTextAccessibility and dc:description).
- STEPS AND CHAINS (steps.js, chains.js): one library of operations for the
  Athanor and the textures. A texture in TEXTURE_CHAINS is made by evaluating
  its chain (genChain → evalAthanor) on its own grid, its sliders read through
  bound params. Node results are kept (ATHANOR_KEPT): a hue change on a chain
  texture reuses its structure. The chain's ctx carries tints, material hues
  (mat) and glow; the cache signature must include anything a step reads.
- ASKING AND REFUSING (appEvents.js): `askSure({title, body, confirmLabel,
  danger})` — the app's own modal (never confirm()), the soft no; `hardNo(title,
  body)` — an alert in the modal-hard style; `toast(text)` — a quiet line,
  also what window errors become. state.ui.edits counts commits since the last
  fresh start (markFresh); past GUARD_EDITS (6), the GUARDED buttons (random
  font, random backdrop, apply spell, load JSON) and presets ask first. Every
  look that comes from outside (JSON, a spell, a saved tile) goes through
  safeRestore: checkLook (≤ LOOK_MAX_JSON, the Athanor graph through
  validateGraph), then restoreSettings, rolled back whole on a throw.
- THE ATHANOR'S SAFETY (athanor.js validateGraph): ≤ ATHANOR_MAX_JSON
  (256 KB) and ≤ 64 nodes (twice that is refused outright, not trimmed);
  unknown steps, bad wires and out-of-range params are reported and fixed.
  forge.js asks (askSure) before Clear, Revert, Start from…, and deleting a
  node, whenever the grid has anything on it and F.dirty.
- THE ATHANOR'S FACE (forge.js, poetrypress.css "forge"): the app's theme
  (--fg-* map to --bg-deep, --bg-panel, --bg-card, --line, --text-*, --accent);
  only ports and wires keep fixed colours by TYPE (FORGE_TYPE_COLOURS: field,
  image, colour, value — deeper on the light Vellum theme), node titles are
  marked by CATEGORY (FORGE_CAT_COLOURS). PARAM PORTS (steps.js paramPort,
  the ⚙ diamonds) are Filter Forge's idea: a wire into a param maps a value
  (a number, a field's mean, a colour's luminance) across the param's range —
  or across '~key' ('lo,hi', set from the param's menu); every param is
  clamped. Data keys starting with '_' (`_pin`) are the editor's own marks:
  athanorWork() leaves them out of every cache key. STEP PREVIEWS are one
  sheet made in the worker ('athanorsteps'), switchable (#forgeSteps,
  localStorage uv.forge.steps).
- THE ATHANOR'S HANDLING (forge.js openForge): a node moves only by its title
  (clickEnd: ed.drag off elsewhere, ed.editor_selected on, so the grid pans);
  a long press (a timer, or the browser's contextmenu — one per press) or a
  right-click opens THE MENU for the thing under it; thingsNear() samples a
  ring of points (18 px on touch) and asks "Which did you mean?" when two or
  more things are there. Each wire has an invisible wide twin (.forge-hit,
  class "main-path" so Drawflow selects it) kept in step by paintWires. ⌖ is
  fitView (the grid scales about its middle: see the maths there). KEPT
  surfaces: localStorage uv.forge.kept.v1 (forgeShelf), each validated on
  opening and on import. Drawflow's own ✕ is hidden; the menus replace it.
- CARTOMANCY (cartomancy.js): the seed picks a GAME (reading, trick, patience,
  wager, pairs), its players, the suits in the deck (2–4), the TABLE material,
  the card STOCK and edge, and the COINAGE; STAKES is how likely and how much
  money lies on it. crtDeal returns what lies where (a list), then each thing
  is drawn with its own shadow (canvas shadows: their offset is never turned
  with the drawing, so it is the page's own light vector). Suits: the page's
  accents (passed raw in extra.accents) and the texture's two hues; the
  texture is colour-ground. Drawn on the page (web fonts), never a chain; the
  same parts are steps (Table, Deal, Coins) and the Card Table starter wires them.
- LANDSCAPE COLOR (texWhimsy genLandscape): paint(tone, colour) keeps the grey
  painting's VALUE and sets only its hue (atValue), so Color 0 is exactly the
  grey of before and any Color holds together; a landscape in colour skips
  the grey tint pass and the blend remap (ownColour), as Dream Bloom's
  coloured motes do.
- SYMBOL LORE (symbolLore.js): Symbology's glyphs with their names and
  families (LORE). Its single-code-point glyphs are among the spell glyphs;
  PLANETS and ZODIAC feed Transmutation Circles; Cartomancy's lore cards draw
  their emblem as text (`glyph:X`, GLYPH_FONT).
- LOCKS (appEvents LOCKABLE): the listed ids plus every slider and menu in the
  making tabs, found in the markup at boot. MASTER LOCKS (addMasterLock) sit
  in each card's heading and in each sub-section's switch row; EYES are the
  old enable checkboxes (class "eye"), a card's own moved into its heading
  (CARD_EYES). Both live in .head-tools, which never folds its section.
- refreshUi() (appEvents): THE refresh — every view of a value made to match
  it. Called at the end of restoreSettings, undo/redo and every
  withLocksPreserved (presets, randomisers, readings). A new view of a value
  registers there (or in SUBBLOCKS / ANGLES).
- WHAT'S WORKING: textureService announces each job ('vellum-working'); the
  page shows WORKING_WORDS[type] after 400 ms. The shimmer (.work-bar i) moves
  by transform, so it runs while the main thread is busy. A texture made on
  the page (ON_PAGE, or no worker) is made after two frames, so the line has
  painted; Save image still waits for it (texturesSettled).
- TILES (swatches.js) never make textures on the page: the page sets
  setSwatchTextureSource (cache, else the worker) and repaints waiting tiles
  when textures arrive. (A Turing Skin used to freeze the page for a second
  every time the history filmstrip repainted.)
- THE SPELL CODE (canvasRenderer, #spellMark): hideable; part of the look
  (spells, shares and JSON keep it); presets leave it as it is.
- LOOK_VERSION (appEvents.js): saved in every look; a look older than a
  slider's new job is translated in retireLook (format 2: the dial took Harsh
  Rain's slant and the Hatch's angle).
- SOUNDS (murmur.js, design v2): a SOUND DESIGN is data (MURMUR_DESIGN): a
  scale (D aeolian, an octave down), room, warmth, humanize; instruments (a
  body of real partials, shaped — glass, bell, pad, tick, tine, thud);
  compositions (events in scale degrees, so always in key); and a MAP from
  each UI function (MURMUR_FUNCTIONS) to a composition or null (silent). Most
  are silent: sounds are for long work finishing, complicated actions, and
  asking. `confirm` is the SOFT NO (a falling pad, every askSure dialog);
  `hardNo` (two knocks) is for what would break the app; `blocked` (one
  dull knock) is a disabled control. The Athanor has its own: open/close,
  blipUp/blipDown (nodes), plugIn/plugOut (wires), lit (a graph loaded). The app plays UI functions (`murmur.play('saveImage')`,
  `data-sound="athanorOpen"`), never notes. Ruby shapes it in the Murmur Studio
  (tools/murmur-studio.html, made from murmur.js by tools/make-murmur-studio.mjs;
  the tests check it is current) and pastes the design back into
  MURMUR_DESIGN. Off by default; its switch and volume are in localStorage
  (uv.sound.on, uv.sound.volume), never in a look.

## Design language

**The four elements.** Every preset, texture and colour decision belongs to
one. Each owns a different visual channel, so they combine without competing.

| | Element | Owns | Palette | Feeling |
|---|---|---|---|---|
| ♡ | **Whimsy** | hue | red, purple **and** blue | sleep, starlight advancing or receding |
| √ | **Sharpness** | value | off-white against blacks with blue in them; metal at the edges | waking |
| ∆ | **Chaos** | pattern | sigils, binary pattern, geometry going wrong | pain, dysphoria |
| 🜚 | **Touch** | surface | neutrals — parchment, bone, tea-stain, graphite | contact |

- Whimsy is three hues; purple is over-used — reach for reds and blues on purpose.
- Touch claims no hue of its own (its one permitted colour: oxblood, in the
  wax). It is what the page is made of and what has happened to it — the only
  element that requires another person to have been there. Touch textures
  read as relief and take the light.
- **Equal weight**: no element is smaller because it is quieter. Today:
  9 · 8 · 8 · 11 textures, 4 presets each.

**Symbols.** 🜚 is Touch, the Return glyph, and the app's mark for "touch
this" — this exact variant; it is personally significant, never substitute
it. The light dial is ☉ at rest and grows 🜚's spike as it is pulled.
Navigation glyphs are hand-drawn and scratchy (each stroke gone over two or
three times, never clean vector); they relax when deselected and stiffen
when selected — state must read standing still. The lock is a drawn padlock
in the same hand, never an emoji. Tabs: Inscription ⌘ (the Bowen knot) ·
Rituals (inverted pentagram) · Thoughtforms (Ruby's glyph) · Materia ◈ ·
Esoterica ⌬.

**Spells** identify which preset or look a page came from. A prime number of
alchemical glyphs (5–17), in three segments — one in `[[ ]]`, one in `{{ }}`,
one bare — no repeats, only from `spell.js`'s safe set. Stored, never
derived. Written in PML and drawn by its own parser, opposite the credit, in
the page ink.

**Language.** Ritual and arcane, but readable — someone who doesn't code must
understand every control; when flavour and clarity conflict, clarity wins
("Script Highlighting", not "Illuminate the script"). Names must be honest
(describe what a thing actually does). Vary the vocabulary (three "…Drift"s
was a failure). Dialogs pair a plain verb with a flavoured one — *Yes
(Inscribe)* / *No (Ignore)* — confirm left, cancel right, a light touch.
Light mode is gently shamed: the moths will find you. Code comments may be
haiku, especially on texture generators; comments explain WHY.

**Colour.** Dark by default; the default theme is **Rosé** (rosy, grey, dark;
a touch redder and darker on desktop), the original violet-and-gold kept as
**Aether**. Don't reach for violet-and-gold by reflex: violet belongs in
accents, never grounds. Colours carry a subtle breath of nature — moss,
clay, tea, sage — never loud.

**Motion.** Minimal: animation mostly advertises how well the browser is
coping. The one deliberate exception is the busy shimmer (a texture being
made, or a save), shown only after a moment and replaced by a fade for
reduced motion.

**PML's purpose** is to override the page's globals per segment — that is
what makes shaped poetry possible. Page-level settings (border, vignette,
background) don't belong in it.

---

## Working with Ruby

- **Use what has been done already** (Ruby): before building a technique,
  look up the prior art — a published method, an established library, a known
  shader — and adopt it; reinvent only for a good reason, and say what it is.
  The recommendations doc (Claude Docs, "Unfixable Vellum — Prior Art &
  Recommendations") is the list so far.
- **Don't replace what Ruby loves; add beside it.** A texture she liked keeps
  its exact look at its defaults (Scattered Polygons: new knobs at 0 draw the
  original); a new idea becomes a knob or a new texture.
- **Do the work** rather than talking about it; attention is finite.
- **Find the cause** instead of guessing twice. Screenshots are evidence —
  read them closely. Prove a fix (render it, measure it), don't assume it.
- If a request is ambiguous, or two voices in it disagree, **ask** before
  building. Requests marked "bonus points" are real requests.
- When a texture is asked to look like something, **look at it** — render it
  and judge it by eye — but run the gallery tool only when a visual review is
  asked for.
- `OPEN-ISSUES.md` holds open items only, kept short: when something is
  finished, delete it rather than editing it into a history.
- Hand-editable text lives in `strings.js`; hand-editable numbers in `tunables.js`.

