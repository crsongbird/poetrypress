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
```

Deploy: upload the whole `dist/` folder. The site may also be served straight
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

## Recipes

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
