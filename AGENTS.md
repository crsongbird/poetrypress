# AGENTS.md — Unfixable Vellum

How to work on this codebase, for agents and people. Rules here were set by
**Ruby**, the poet who owns the project; where a reason is given, the reason
is what matters.

**Read §1 before changing anything.** The rest is reference: jump to what
you're touching.

1. [Start here](#1--start-here)
2. [Commands](#2--commands)
3. [A pass, and shipping a release](#3--a-pass-and-shipping-a-release)
4. [Repository map](#4--repository-map)
5. [How the app works](#5--how-the-app-works)
6. [The Athanor: parts, chains and graphs](#6--the-athanor-parts-chains-and-graphs)
7. [Invariants](#7--invariants--never-break-these)
8. [Recipes](#8--recipes)
9. [Texture notes](#9--texture-notes)
10. [Pitfalls we hit](#10--pitfalls-we-hit)
11. [Design language](#11--design-language)
12. [Working with Ruby](#12--working-with-ruby)

Related files:
- **ROADMAP.md**: what to build next, in four stages.
- **OPEN-ISSUES.md**: open items only.
- **CHANGELOG.md**: the releases.
- **PERFORMANCE-AUDIT.md**: the measurements.
- **PML.md**: the markup.
- **README.md**: for people, not builders. Keep it brief, with room left for
  discovery (Ruby).

---

## 1 · Start here

**What this is.** Unfixable Vellum (also called PoetryPress) turns a poem
into an image people stop to read.
- It is a single-page, phone-first web app in **plain ES modules: no
  framework, no dependencies**.
- Poems are written in **PML** (Poetic Magick Language).
- The page is drawn on a canvas: a backdrop, generated surfaces
  ("textures"), an inset box, a border, text effects.
- It is saved as a 3072 px JPEG.
- Production is `poetrypress.unfixable.place` (the `main` branch of
  crsongbird/poetrypress, served by GitHub Pages). Development is
  `vellum.unfixable.place`.

**The rules most often broken.** Each has a test that will catch you:
1. **Old work never changes.** Existing poems, looks, presets and graphs
   must draw exactly as before. You *add* (a version, an id, an option); you
   never redefine. See §7.
2. **Every control is saved.** Anything a person can change goes into the
   look: saved, restored, and reset by presets. This is the persistence
   rule, §5.4.
3. **Every texture you touch becomes a chain of parts** (the componentizing
   rule, §6.1), and every part has a one-sentence doc.
4. **Canonical pixels.** Measure in pixels of the 3072 px export, never "per
   pixel of this canvas" (§5.2).
5. **One scope.** The build flattens every module into one script: no two
   modules may declare the same top-level name, and no `import.meta`.
6. **User-facing words live in `strings.js`**, in American spelling, plain
   and honest (§11).
7. **Look at what you made.** Render it and judge it by eye; prove a fix by
   measuring it. Tests passing is not the same as looking right.
8. **Phones first.** The baseline phone is a Moto G Stylus 5G (2022). Use
   `--vvh`, never bare `vh`.
9. **Presets come last** (Ruby): parts, then features, then textures, then
   presets. No new or reworked presets until ROADMAP Stage 4.
10. **Ask when it's ambiguous**, or when two of Ruby's wishes disagree. Don't
    guess twice: find the cause.

**Every pass:** read the parts of this file you'll touch → read ROADMAP.md
if it's Athanor work → do the work → `sh test.sh` green → look at it →
update CHANGELOG / OPEN-ISSUES / this file → ship (§3).

---

## 2 · Commands

```sh
node build.mjs            # flatten every module into dist/index.html (+ the texture worker, sw.js, manifest)
sh test.sh                # parse check + build + every test suite — must end "all N suites passed"
sh check.sh file.js …     # syntax-check modules (really parses them; `node --check` passes broken modules here)
node build.mjs --next     # advance release.js to the next moon — once per shipped release
node build.mjs --notes    # print the newest CHANGELOG section (the release's commit message)
node build.mjs --zip      # archive the project into release/ (old archives deleted first)

npm install @napi-rs/canvas                    # once, for the tools below
node tools/look.mjs '<json>' out.png <cols>    # a quick look at specific texture settings
node tools/scale-audit.mjs [--knobs min|max]   # does a texture look the same drawn small?
node tools/texture-gallery.mjs --only a,b      # four backgrounds each — ONLY when a visual review is asked for
python tools/page-audit.py                     # whole pages, every preset (needs Playwright)
python3 tools/icons.py                         # redraw the nav glyphs, the sigil and the app icons
node test/textureFingerprints.test.mjs --update   # accept new texture renders — only those you meant to change
```

The site must work **both built and unbuilt** (served straight from the
source files). Deploy is the whole `dist/` folder: the page, `sw.js`,
`manifest.webmanifest` and `icons/`. The service worker must be its own
file, or the app won't install or work offline.

---

## 3 · A pass, and shipping a release

One pass of work ends in one release. Releases are named for moons
(`release.js`): Jupiter's, in order of distance from the barycentre, then
Saturn's after the final Jupiter release. The name is written `Jupiter–Io`
with an **en dash**, because a slash would split a PML segment.

**Ship a release:**
1. `sh test.sh` ends "all N suites passed".
2. Texture fingerprints changed only for the textures you meant to change.
   If so, `node test/textureFingerprints.test.mjs --update` and check its
   "changed textures" list.
3. `node build.mjs --next`.
4. Write the release's section at the top of CHANGELOG.md: plain patch
   notes for people, not a diary.
5. `node build.mjs`, then `sh test.sh` again.
6. Update OPEN-ISSUES.md (delete what's done; add what Ruby should judge)
   and ROADMAP.md (delete what shipped).
7. Commit to `main` with `node build.mjs --notes` as the message, then push.
   **Main is live.** The working copy is the clone of crsongbird/poetrypress
   and keeps its CNAME; release/ and node_modules are never committed.

Screenshots only when asked, or when they help the work. No picture sets by
default.

---

## 4 · Repository map

**The page**

| File | Role |
|---|---|
| `index.html` · `poetrypress.css` | markup and all styles |
| `appEvents.js` | UI wiring and the entry point. The app's state is ONE object (`state`) at its top. Persistence (`PERSISTED`), presets, locks, dice, undo, the draft, dialogs |
| `canvasRenderer.js` | `render()`: backdrop, texture, vignette, box, border, text, credit, spell. Also the poem's layout (`TEXT_LAYOUT`) and Text Clearing |
| `textParsers.js` · `pmlVars.js` · `effects.js` | PML → lines and segments (`buildLines`) · `§Variables`, resolved before PML parses · the text effect stack and `/fx:` |
| `stitches.js` | decorative motifs along any path (rules, borders, seams, inner edges) |
| `boxFx.js` | the inset box's glass and GPU blends |
| `chooser.js` · `swatches.js` | the surface menus shown as tiles (thumbnails kept per release in localStorage `uv.thumbs.v1`) · the painted preset tiles |
| `appOptions.js` | fonts, presets (`PRESETS`, `PRESET_GROUPS`), aspects, the welcome poem |
| `strings.js` · `tunables.js` | every user-facing string · hand-editable numbers |
| `spell.js` · `vault.js` | glyph spells · saving, sharing, the Grimoire |
| `altText.js` · `jpegMeta.js` | the saved image's alt text (the poem, then the look in words, ≤1500) · written into the JPEG as XMP |
| `glyphs.js` `moon.js` `fonts.js` `palette.js` `theme.js` `pwa.js` `editor.js` | inline glyphs, moon phases, lazy fonts, theme palettes, installability, the PML editor |
| `murmur.js` | soft interface sounds (off until turned on) |
| `runology.js` · `symbolLore.js` · `seedWords.js` | Ruby's Runes of Power · Symbology's glyphs and names · seeds as phrases |

**Surfaces (textures)**

| File | Role |
|---|---|
| `textureGenerators.js` | the registry (`TEXTURE_PARAMS`: knobs; `TEXTURE_CAPS`: what each can do), dispatch, the cache and its keys |
| `textureService.js` · `textureWorker.js` | textures made off the page's thread |
| `texCore.js` | shared maths: seeded random, noise, `pixelPass`, canonical pixels, `lightHeights` (the lighting engine, CPU and WebGL2), the steps' kit |
| `texWhimsy.js` `texSharpness.js` `texChaos.js` `texTouch.js` | the older generators, one file per element (being taken apart into steps) |
| `textureElements.js` | each texture's four readings (🜂 🜄 🜁 🜃), one of them its default |
| `cartomancy.js` · `cartomancyTable.js` | Cartomancy and its parts · what else is on its table (bundled BEFORE cartomancy.js) |

**The Athanor (the node editor)**

| File | Role |
|---|---|
| `steps.js` | THE PARTS: the general library (`STEP_PARTS`, `STEP_RUN`, `STEP_DOCS`, `STEP_IO`, `STEP_COST`, `STEP_REQUIRED`) and the merged `STEPS` table. Also The Poem, curves and Filter Forge's primitives |
| `stepsTouch.js` `stepsChaos.js` `stepsWhimsy.js` `stepsLight.js` `stepsSharpness.js` `stepsGenerative.js` | each family's own parts. Generative: Discharge, Wood, Burn, Growing Line, Knotwork, Matrix, Tendrils. Light: the Light Engine, Oil Paint, Canvas Weave, Angry Strokes |
| `chains.js` | the textures rebuilt as graphs of parts (`TEXTURE_CHAINS`, each with its TEACH) |
| `athanor.js` | the graph evaluator (in the worker), its cache (`ATHANOR_KEPT`), budget, versions, starters, `validateGraph` |
| `forge.js` | the editor UI (Drawflow): menus, wiring, help, the shelf of kept surfaces |

**The rest:** `release.js` (the release name), `build.mjs` (the bundler; its
`ORDER` lists every module after its imports), `test/` (one suite per
concern), `tools/`.

---

## 5 · How the app works

### 5.1 · Rendering
`render()` draws, in order:
1. backdrop;
2. texture(s): the base layer first, then the main one;
3. vignette;
4. inset box;
5. border (its bloom on its own half-resolution layer);
6. text (effects under the glyphs, then the glyphs);
7. credit and spell.

Stages are timed (`§Profile`).
- `render()` draws into a back buffer (`renderInto(BACK)`) and copies it to
  the page only when the frame is whole. A failed frame keeps the last
  picture, frees caches and retries.
- Never draw to `#poemCanvas` from inside `renderInto`.
- `render()` resets the context first: a frame aborted mid-blend once left
  two pages showing at once.

### 5.2 · Canonical pixels
- Everything is measured in pixels of the **3072 px export**, times a scale
  `S` (render size ÷ export size).
- Helpers: `cpx(n)`, `canonArea(w,h)`, `canonDiv(d)` in texCore.js; `rpx(n)`
  in the renderer.
- The preview is drawn at screen size (S in steps of ¼ ⅓ ½ ⅔ 1) and must
  look like the export scaled down.
- At S = 1 every conversion is pixel-identical.

### 5.3 · Textures in a worker
- The renderer asks `textureService.requestTexture(slot, …)`.
  - A cached texture returns at once.
  - Otherwise the worker makes it while the slot shows its previous texture.
  - Requests coalesce: only the latest per slot waits.
- Save image awaits `texturesSettled()`. The page and worker share
  `textureKeyFor()`.
- Textures that draw text in **web fonts** (Transmutation Circle,
  Cartomancy) are made on the page (`ON_PAGE` in textureService.js): a
  worker can't see the page's fonts.
- **Tiles** (preset tiles, the history filmstrip, the chooser's thumbnails)
  never make textures on the page. They take them from the cache or the
  worker (`setSwatchTextureSource`) and repaint when textures arrive.
- **What's working:** the service announces each job (`vellum-working`);
  the page shows `WORKING_WORDS[type]` after 400 ms. The shimmer moves by
  transform, so it runs while the main thread is busy.

### 5.4 · Persistence (Ruby's standing rule)
**Any control a person can change** must be captured by the look:
- saved: `serializeCurrentSettings`, usually a row in `PERSISTED`;
- restored: `restoreSettings`.

Everything else is built on those two, so it all follows: the Workbench
JSON, the Grimoire, shared spells, undo/redo, and the draft.

**Presets that don't set a control must reset it.** A value never leaks
from one preset into the next. Frame and box settings reset through
`FRAME_DEFAULTS`.

The tests:
- `test/persistenceCoverage.test.mjs` finds every control on the page and
  fails on any that isn't saved and restored. The exceptions are in its
  EXEMPT list, each with its reason (app preferences, the JSON box,
  dialogs, search fields).
- `test/audit.test.mjs` checks the other direction: every saved key
  round-trips.

Other parts of a look:
- **Saved keys are frozen** (§7). `stripToLook()` removes the poem, locks
  and credit from a look.
- **LOOK_VERSION** is saved in every look. When a slider's job changes, an
  older look is translated in `retireLook`.
- **THE DRAFT** (`uv.draft.v1`: `{ poem, look, savedAt }`):
  - Saved 1 s after the last input, change, click or keydown, and at once on
    `visibilitychange` → hidden and on `pagehide`. Phones drop tabs without
    an unload event.
  - At boot, a draft whose poem isn't `WELCOME_POEM` comes back through
    `checkLook` (quietly), then `safeRestore`. Anything else opens the
    welcome page.
  - `test/draft.test.mjs`.
- **THE PAGE SHAPE is the person's.** `safeRestore` drops aspect and custom
  size from every look loaded from outside.
- **App preferences** (theme, sounds, folded groups, the chooser's
  thumbnails, step previews on or off) live in localStorage, **never** in a
  look.

### 5.5 · Light
- The ☉/🜚 dial sets a direction and a height (`textureLight`,
  `textureLightTilt`). `lightVec` scales by height.
- `lightHeights(H, …)` lights a height field like a game engine: diffuse,
  specular by material, soft cast shadows, ambient occlusion. New lit
  textures build a height field and use it.
- **Heights or normals?**
  - Heights for anything that should cast a shadow (the shadow tracer
    marches over them). Keep the height range to what casts shadows: the
    trace length follows it.
  - A detail normal map (`opts.normals`) for detail that only shades: Cold
    Press fibres, Linen's weave, the glaze's fine crazing.
  - A `glossMap` for a surface of two materials: Kintsugi's gold, moss
    beside stone.
- **Sparse details** on flat ground (seams, buttons, carved sigils) use
  `lightSparse(H, …)`. It lights only the tiles a shadow can reach, and is
  exact.
- **Materials:** `materialOf(highlight, shade)` (null when both are white),
  then per channel `litK(L, i, ambient, M, c)` and `litS(M, c)`.
  - The Shade hue colours what's darker than flat ground (`L.flat`), the
    Highlight hue the shine. Hues are normalised to white's brightness.
  - Caps `material: true` show the two pickers (`textureTint3Hex`,
    `textureTint4Hex`).
  - `opts.components` returns diffuse and occlusion apart.
  - `opts.marchSteps` passes the whole field's shadow march to each sparse
    piece.
  - **With white hues a texture draws exactly as before** (the fingerprints
    prove it).
- **GPU lighting:** the WebGL2 shader must stay line-for-line with the CPU
  `lightHeights`.
  - Change both together and compare them (`opts.cpuLight`; they agree to
    within 1/255).
  - Node always runs the CPU path, so the fingerprints test it.
  - `?softgl` in the address lets a machine without a GPU test the GPU path.
- **The dial as a joystick:** `caps.dial` renames it (Wind Direction,
  View…).
  - Rename labels with `setLabelText`, never `textContent` (that wiped the
    padlocks).
  - Point things FROM the dial's handle: (cos a, sin a) with
    a = (deg − 90)°.

### 5.6 · Knobs and colour roles
- A texture declares **2–6 knobs** in `TEXTURE_PARAMS`, read by position as
  `texP1`…`texP6`. The usual keys are zoom, amt, form, shape, hue and tilt.
- A knob may carry `ticks`, `names` and `dice`. A new knob key must be wired
  through:
  - `describeRequest` (the cache key);
  - `readParam`;
  - the extra object;
  - appEvents (persist, restore, presets, listeners);
  - the audit test.
- **Every hue has one job** (`hue5` in textureGenerators; colorRoles test):
  - Light / Dark: lighter and darker marks.
  - Material: a grey texture's surface.
  - Highlight / Shade: glints and cast shadow.
  - Glow (`hue5.role: 'glow'`): a coloured texture's emitted light. It is
    black by default, and must be a no-op when black: screen it, or skip it
    when the colour sums to ~0.
- **Each hue's "none" draws exactly as before:** white, black or mid-grey.
- Under Multiply, a grey texture's Dark Hue shows twice as light: pick it
  half as bright.

### 5.7 · The page's machinery
- **`refreshUi()`** is THE refresh: every view of a value made to match it.
  - It is called after `restoreSettings`, undo/redo, and every
    `withLocksPreserved` (presets, randomisers, readings).
  - A new view of a value registers there, or in `SUBBLOCKS` / `ANGLES`.
- **Locks and dice:**
  - `LOCKABLE` covers the listed ids plus every slider and menu in the
    making tabs.
  - Master locks (`addMasterLock`) sit in each card's heading and in each
    sub-section's switch row.
  - Eyes are the old enable checkboxes (class `eye`); a card's own is moved
    into its heading (`CARD_EYES`). Both live in `.head-tools`, which never
    folds its section.
  - A die beside each lock rerolls only that section (`rollSection`).
- **Asking and refusing:**
  - `askSure({title, body, confirmLabel, danger})` is the soft no, the app's
    own modal (never `confirm()`).
  - `hardNo(title, body)` is the hard no.
  - `toast(text)` is a quiet line; window errors become toasts too.
  - `state.ui.edits` counts commits since the last fresh start
    (`markFresh`). Past `GUARD_EDITS` (6), the `GUARDED` buttons (random
    font, random backdrop, random surface, apply spell, load JSON) and the
    presets ask first.
- **Every look from outside** (JSON, a spell, a saved tile) goes through
  `safeRestore`:
  - `checkLook` first (at most `LOOK_MAX_JSON`, and the Athanor graph
    through `validateGraph`);
  - then `restoreSettings`;
  - rolled back whole on a throw.
- **Layout:** `wantPhoneLayout` is the window's SHAPE (w/h ≤ 2/3), not its
  width.
  - The phone's rules are scoped to `body.is-mobile`.
  - In focus mode there is one scroller.
  - The editor's mirror matches the textarea's metrics.
- **Text layout:** fitting predicts the size and checks the grid around it.
  Widths are remembered and cleared when a font arrives. Keep new text
  layout on that path: text measurement once took ~70% of the page's CPU.
- **THE POEM'S LAYOUT** (`TEXT_LAYOUT`, `textLayoutNow()`):
  - Each frame records its text runs as `x0,y0,x1,y1,line,stanza;…` in page
    fractions.
  - A surface drawn before the text reads the previous frame's record. A
    change asks for one more frame, and only when something reads it.
  - **Text Clearing** (`textureClearing`) takes a soft mask of the runs out
    of each surface layer. The mask is 192 px across, blurred there.
- **Stitches** (stitches.js):
  - `STITCH_STYLES` is the menu; parse with `STITCH_NAMES`; draw through
    `stitchOf()`.
  - `STITCH_ALIASES` maps retired stitches to their relatives.
  - Every motif has an `edge` (its silhouette); a new motif needs one too.
- **Linked controls:** `data-link="<id>"` with
  `data-link-switch="<checkbox>"` mirrors two controls both ways while the
  switch is on (the box ⛓ border).
- **The camera tilt** (texCore `obliqueFrame` / `obliqueRender`):
  - Build the ground on the frame's patch (larger than the page), light it
    from above, then render.
  - Tilt 0 returns `flat`: the texture is exactly its top-down self.
- **The report:** pmlVars drops a line whose surface variable has nothing to
  say (`LINE_DROP`, `ctx.surfOff`). `§Build` shows the release name.
- **Sounds** (murmur.js): a sound design is data (`MURMUR_DESIGN`).
  - It holds a scale (D aeolian), instruments made of real partials, and
    compositions in scale degrees, so everything is in key.
  - `MURMUR_FUNCTIONS` maps each UI function to a composition, or to
    silence.
  - The app plays UI functions (`murmur.play('saveImage')`,
    `data-sound="athanorOpen"`), never notes. Most are silent: sounds are
    for long work finishing, complicated actions, and asking.
  - `confirm` is the soft no, `hardNo` two knocks, `blocked` one knock.
  - Ruby shapes it in tools/murmur-studio.html; the tests check the studio
    is current.
  - Off by default; its switch and volume are in localStorage.

### 5.8 · Presets, spells, seeds
- **Presets** (`PRESETS`, `appOptions.js`) sit in `PRESET_GROUPS` as Ruby
  named them:
  - Each group is headed by a Runology Archetype and is alphabetical within.
  - Every preset is in exactly one group, and each group holds a multiple of
    four.
  - Two presets may share a texture only in different blends.
  - Each must be readable: text and accents at 3:1 or better against what's
    behind them.
  - `full: true` presets are whole saved looks.
  - The grid has a search and folding groups.
- **Spells** identify which preset or look a page came from:
  - A prime number (5–17) of glyphs, in three segments: one in `[[ ]]`, one
    in `{{ }}`, one bare.
  - No repeats; new spells use only `PANDORAN_RUNES` (Runology's Archetypes
    and Accents). Old spells still validate.
  - Stored, never derived.
  - Drawn by PML's parser, opposite the credit, in the page ink. Hideable,
    and part of the look.
- **Word seeds** (seedWords.js):
  - Every 32-bit seed has exactly one phrase and back.
  - **The banks and their order are frozen**: test/seedWords anchors
    phrases.
  - The top 4 bits pick one of 16 sentence shapes (`SW_SHAPES`); the 16th is
    split into six small ones (`SW_SMALL`), so every shape spends exactly
    its bits.
  - Verbs are `'base'` or `'base|past|participle'`; time phrases never end
    in -ing.
  - Parsing is a backtracking match, kept only if the number regenerates the
    same text.
  - Saves hold the number, plus whatever was typed (`textureSeedWords`). The
    page shows only the phrase; the number is its tooltip.
- **Symbol lore** (symbolLore.js): Symbology's glyphs with their names and
  families (`LORE`).
  - `PLANETS` and `ZODIAC` feed Transmutation Circle.
  - Cartomancy's lore cards draw their emblem as text (`glyph:X`,
    `GLYPH_FONT`).
- **Alt text** (altText.js → jpegMeta.js): the poem without markup, then the
  look in plain English, clipped to 1500 characters (the poem gives way
  first). It is written into the JPEG as XMP: IPTC AltTextAccessibility and
  dc:description.

---

## 6 · The Athanor: parts, chains and graphs

### 6.1 · The componentizing rule (Ruby's standing rule)
**Every texture touched is taken apart as it is touched.**
- Its working parts become **steps** (parts) in steps.js or a family file,
  general enough for other textures and for the Athanor.
- The texture becomes a **chain** of them in chains.js, with a canonical
  wiring a person can read: inputs (Knobs, the Dial, Hues) on the left,
  wired into ⚙ ports, the Surface on the right (`layoutAthanor`).
- Before writing a part, look for one to reuse or generalise. A part made
  for one texture is a debt. Aim between too general (a noise) and too
  specific (one picture): **a part someone would reach for twice.**

**THE LONG HORIZON** (Ruby): every texture loadable in the Athanor, viewable
as a graph, mixable with parts of other textures, and kept and shared as a
person's own (Filter Forge, ComfyUI and Blender's way). Old textures are not
avoided because the work is large. 32 textures are chains today; ROADMAP.md
lists the 27 that aren't.

### 6.2 · Anatomy of a part
A part is `{ cat, label, ins, outs, params, run(E, n) }`:
- **Where it is defined:**
  - in steps.js, across `STEP_PARTS`, `STEP_RUN`, `STEP_DOCS`, `STEP_IO`,
    `STEP_COST` and `STEP_REQUIRED`;
  - or in one family object (`TOUCH_STEPS`, …) carrying its own `cost`,
    `io` and `doc`.
- **Its doc:** every part has one plain, instructive sentence: what goes in,
  what comes out, what to try. A test fails without it.
  - Docs, TEACH and the Help are a teacher talking to a student.
  - Names and lore may riddle; the instructions never do.
- **Its category:** one of `STEP_CATEGORIES`, each with a name, glyph and
  colour in forge.js (`FORGE_CAT_*`). Every category keeps at least three
  parts.
- **Its params:** `STEP_R(key, label, def, min, max)` for a range (each gets
  a ⚙ port), `STEP_SEL` for a menu, `[key, label, 'text', def]` for text.
- **What it reads from `E`, the evaluator's kit:**
  - `E.num(n, key, def)` reads a param. A param may be **bound**
    (`'@k2[10,700]'`, `'@dial'`) or **wired** (⚙).
  - `E.map(n, key)` with `E.at(m, i)` reads it point by point (§6.4).
  - `E.input(n, j)` reads the j-th input (1-based).
  - `E.field(fn)`, `asField`, `asImage`, `boxBlur`.
  - `E.px` is canonical pixels; `E.unit` is the grid's short side; `E.marks`
    draws strokes.
  - Its own randomness is `Math.random()` under a seed set per node.
- **Wire kinds** (`VALUE_TYPES`), coloured by kind in the editor:
  - **gray map** (field), **picture** (image), **color**, **number**
    (value), **curve**;
  - converted wherever a port asks (athanor.js `asField`, `asImage`, …).
- **The steps' kit** (texCore.js): `kitCanvas`, `kitPicture`, `kitField`,
  `kitFieldCanvas`, `kitImage`. A part that paints works on either a canvas
  (a canvas pass) or fields (the grid), so one part serves both.
- **Canvas passes:** a texture drawn in web fonts or needing full size is
  still a chain.
  - Its parts **paint** (`step.paint`) as well as run.
  - The texture is made by a canvas pass (`chain.canvas` → `evalAthanor`
    with `ctx.canvas`).
  - A part may work on its own grid inside a pass and hand on a small
    canvas.
- **Seed choices shared between parts** (the landscape's country, time and
  sun) come from `seedChoice(ctx.seed, name)`, never from a part's own
  stream, so the parts agree.
- **Parts that keep a texture's own randomness** draw under
  `withSeed(ctx.seed + Variant·7919)`, so the texture they came from keeps
  its exact look: Particles, Terrain, Turing Pattern, Flow Lines, Washes,
  Discharge, Growing Line.

### 6.3 · Graphs
- **The format:** a graph is Drawflow's export JSON, kept in `#forgeGraph`
  (PERSISTED, but not an undo step) and saved without node faces. forge.js
  redraws the faces from `FORGE_NODES`.
  - Data keys starting with `_` (`_pin`) are the editor's own marks;
    `athanorWork()` leaves them out of every cache key.
  - The texture type `athanor` has six plain knobs (k1–k6). The page
    relabels them from the graph (`applyAthanorGraph`).
  - The cache key carries `athanorHash(graph)`.
- **Versions** (`v`, `ATHANOR_VERSION`): **never change what an old version
  makes; add a version.**
  - v1: one random stream for all nodes.
  - v2: each node seeded from (seed, id). This is what makes the kept
    results (`ATHANOR_KEPT`) safe.
  - v3: map inputs (§6.4).
  - **Texture chains stay v2**, so their pictures never change. Starters
    take the newest.
- **THE SURFACE STAYS:** exactly one per graph, never removed or copied.
  Clear leaves one; a graph without one gets one.
  - The Surface's **Size** (25–400) scales `unit`, `px` and `carea` for the
    whole graph (Filter Forge's Size). At 100 nothing changes.
- **Safety** (`validateGraph`):
  - At most 256 KB (`ATHANOR_MAX_JSON`) and 64 nodes; twice that is refused
    outright.
  - Unknown steps, bad wires and out-of-range params are reported and fixed.
  - Every param is clamped.
  - The work budget draws a heavy graph on a coarser grid.
- **Every chain and starter carries TEACH:** a few lines the Athanor shows
  when it opens.
- **The reach rule** (`athanorReach`): only Knobs and Hues that reach the
  Surface are offered on the page. A slot bound by `'@kN'` counts.
- **The poem as input:** the **The Poem** part (words, distance, lines,
  stanzas) gets the layout as `ctx.text`, and only when its graph contains
  it (`graphUsesPoem`). The cache key carries it then (`_q`), never
  otherwise.

### 6.4 · What the Athanor took from Filter Forge
The full study and what is still to do are in ROADMAP.md §1.
- **Param ports (⚙):** a wire into a setting sweeps its range, or the part
  of it set by `'~key': 'lo,hi'`. lo > hi reverses it (Filter Forge's
  remapper).
- **Map inputs** (v3 graphs only): a gray map on a ⚙ is per point wherever
  the part reads `E.map`/`E.at`. v2 graphs average the map.
- **Curves:** `{ curve: Float32Array(257) }`, read with `curveAt`.
  - Laid where a map goes, a curve runs across the page left to right.
  - Where a number goes, it gives its mean.
  - In previews it is drawn as its graph.
- **Required inputs** (`STEP_REQUIRED`):
  - The editor marks an empty one red.
  - Step previews (`ctx.all`, with their own cache keys) substitute a "!"
    stand-in.
  - The stand-in never reaches the Surface.
- **Note:** a part that makes nothing.

### 6.5 · The editor (forge.js)
- **Theme:** its face follows the app's theme. Only ports and wires keep
  fixed colours, by kind (`FORGE_TYPE_COLOURS`). Node titles are marked by
  category.
- **Moving and menus:**
  - A node moves only by its title, so the grid can pan.
  - A long press or right-click opens THE MENU for the thing under it.
  - `thingsNear()` asks "Which did you mean?" when two things are close.
- **Wires:** each has an invisible wide twin (`.forge-hit`) that is easy to
  tap.
- **Wiring by menu:** hold a part or port → "Wire from it…" → tap the other
  part → choose a port.
  - A phone's tap is a pointer down and up in place; it never arrives as a
    click.
  - Escape or Cancel stops.
- **Asking first:** before Clear, Revert, Start from…, or deleting a node,
  the editor asks whenever the grid has work on it.
- **Kept surfaces:** localStorage `uv.forge.kept.v1` (`forgeShelf`), each
  validated on opening and import.
- **Step previews:** one sheet made in the worker (`athanorsteps`),
  switchable (`#forgeSteps`, localStorage `uv.forge.steps`).
- **Drawflow** (like Panzoom and Coloris) loads from jsdelivr at an exact
  version, only when the Athanor opens. The app must work without them.
  - This sandbox can't reach jsdelivr. To test the editor, inject the npm
    copy (`npm pack drawflow@0.0.60`) with Playwright's `add_script_tag`.

---

## 7 · Invariants — never break these

Each is guarded by a test. If one fails after a deliberate change, update
the test to the new intent; never weaken it just to pass.

- **PML is a contract.** Every existing poem renders identically.
  - `test/fixtures/pml-golden.json` is **never** regenerated: find what
    changed.
  - Add directives; never redefine `/fx0 /fx1 /fx2`, the bracket accents, or
    any line prefix.
  - New parser fields are absent (or `undefined`) when unused.
  - Every styling field a segment can set is listed in `resolvePartStyle`'s
    early-return guard, or it is silently ignored.
- **Font order is frozen** (`/f:N` picks by position): append only.
- **Word-seed banks are frozen:** never edit, reorder or append.
- **The perfect presets** (Andromeda, Euphoria, Lotus Bloom, Gateway,
  Sealed) are copied verbatim. The grid's groups live in `PRESET_GROUPS`,
  not on the presets.
- **Saved keys are frozen.** `PERSISTED` key names and value types never
  change once shipped; old looks translate forward (`applyLegacyEffects`,
  `RETIRED`, `retireLook`).
  - **A texture whose LOOK is replaced gets a NEW id**, and the old id is
    retired to whatever kept the old look (example: `crystalleaf` →
    `spangle`, in both `RETIRED` and `retireLook`).
  - Saves carry no version, so never reuse an id for a different picture.
    Old ids stay loadable as hidden `<option>`s.
- **Textures change only on purpose.** Fingerprints
  (`test/fixtures/texture-fingerprints.json`) are updated with `--update`
  only for the textures you meant to change.
- **Athanor versions:** never change what an old graph version makes (§6.3).
- **Canonical pixels:**
  - no raw `(w*h)/K` counts;
  - no fixed-pixel line floors;
  - working grids through `canonDiv`.
- **Texture options by name,** never by position: a tint once landed in the
  light slot.
- **The built page is a plain script:**
  - no `import.meta` anywhere;
  - no duplicate top-level names across modules: two `clamp255` helpers
    once broke the bundle. Name helpers per module: `ch…`, `sw…`, `crt…`;
  - each module bundled after its imports.
- **Phones:**
  - vertical sizing uses `--vvh`, never bare `vh`;
  - one scroller in focus mode;
  - the editor mirror matches the textarea's metrics.
- **Text:** user-facing strings live in `strings.js`, in American spelling,
  with no HTML entities (text nodes don't decode them). `applyStrings`
  replaces a node's own text only.

---

## 8 · Recipes

**Add a part (a step)**
1. Look for a part to reuse or generalise first (§6.1).
2. Define it (§6.2):
   - its params;
   - `run` (and `paint` if it works in canvas passes);
   - `STEP_DOCS`;
   - `STEP_IO` for anything that isn't a gray map;
   - `STEP_COST`;
   - `STEP_REQUIRED` if it needs its first input.
3. Read per-point settings with `E.map` where the loop allows (v3).
4. Add a test (test/filterforge.test.mjs or the part's own suite).
5. **Render it and look at it.**

**Add a wire kind:** `VALUE_TYPES`; `FORGE_TYPE_COLOURS`/`NAMES`;
`--t-<kind>` in both themes; the Help text; conversions in athanor.js
(`asField`, `asImage`, `num`); the preview's drawing of it.

**Rebuild a texture as a chain** (a long refactor, one texture at a time)
1. Find or write its parts.
2. Add the chain to chains.js:
   - nodes and wires;
   - Knob nodes as the sliders' legend;
   - its working grid (`div` or `grid`), or `canvas: true`;
   - each slider bound to the params it drives, across the slider's own
     range;
   - TEACH.
3. In textureGenerators.js, dispatch the type to `genChain`. Delete the old
   generator, but keep its haiku beside the part that inherited it.
4. **Its fingerprint must not change.** If a slider's job did change: bump
   `LOOK_VERSION`, translate older looks in `retireLook`, and update the
   four readings.
5. Render it, time it.

**Add a texture**
1. Build it as a chain of parts (above). A standalone `genX` only if it
   truly can't be.
2. Measure in canonical pixels. Draw on `document.createElement('canvas')`
   with no other DOM (it runs in a worker). No `Path2D` or `isPointInPath`:
   use plain geometry, as `apertureOutline` does.
3. Register it:
   - `TEXTURE_PARAMS`, `TEXTURE_CAPS`, the dispatch in `buildTexture`;
   - an `<option>` inside the right `<optgroup>` (index.html; groups by how
     a surface is made, alphabetical, never fewer than three in a group);
   - a `strings.js` entry;
   - `WORKING_WORDS`;
   - its four readings (textureElements.js);
   - alt-text words.
4. If it draws text in web fonts, add it to `ON_PAGE`.
5. Accept its first fingerprint. Check `scale-audit`. Look at it.
6. **No preset for it until the presets pass** (ROADMAP Stage 4).

**Add a setting:**
- markup;
- a `PERSISTED` row (or an explicit save and restore);
- preset handling (`FRAME_DEFAULTS`, so presets reset it);
- the `audit.test.mjs` mutation table;
- a `strings.js` label.

`persistenceCoverage.test.mjs` fails until it is saved and restored.

**Add PML:** parse in textParsers.js (the field is absent when unused); add
it to the line-rebuild copy list and to `resolvePartStyle`'s guard; document
it in the in-app help (tersely) and PML.md.

**Add a §Variable:** in pmlVars.js, and its context in the renderer. A value
must never contain `/` if it may land inside a segment.

**Ship a release:** §3.

---

## 9 · Texture notes

Alphabetical. These are the non-obvious facts about particular surfaces.

- **Aurora** (chain `aurorasky`, canvas): Starfield → Aurora Curtains
  (green low, red high, a pink hem; rays). The old `aurora` id is **Silk
  Ribbons** (the same look, renamed).
- **The Basics** (plainnoise, stripes, polka, checker, softgradient, cells;
  `ATHANOR_BASICS`):
  - In the Athanor's Start from… only; hidden options so old looks open.
  - No preset uses one.
  - They are quiet grounds of two or three general parts, with every slider
    a plain 0–100. They are the Athanor's easiest lessons.
- **Black Hole:**
  - Ray-traced on every other working pixel; the in-between pixels are
    traced only where neighbours differ.
  - The sky is sampled at full size through the lens map.
  - Stars shear tangentially far from the hole: that's physics.
- **Cartomancy** (cartomancy.js, chain `cards`, canvas, ON_PAGE; its parts
  are `CARD_STEPS`; cartomancyTable.js gets its drawing kit `CRT_KIT` from
  cartomancy.js when it loads):
  - "STAKES" is how likely money lies on the table, and how much.
  - The seed picks a game (eleven `CARD_GAMES`), its players, the suits, the
    table, the card stock and the coinage.
  - `crtDeal` returns what lies where; each thing is drawn with its own
    shadow (the page's light vector).
  - Suits come from the page's accents and the texture's two hues.
  - **Wear** (knob 5): a damage changes a card's outline (`crtCardPath`).
  - **Clutter** (knob 4): `crtTableObjects` places `TABLE_OBJECTS`.
  - Draw order: under → flat → the game → tall.
  - To add an object: an entry with a painter that draws from above, lit by
    `crtLight`, with `tobKit.shadow`.
- **Contour Map:** Terrain → Contour Lines (any gray map's isolines), inked
  by Mix over the Light Engine's hillshade.
- **Crackle** (Fractured Glaze, chain `crackle`):
  - Tarbell's Substrate on an ID grid: a crack stops at another's cell or
    its 4-neighbours.
  - Polylines, not chords.
  - The old crazed glaze is `crackedglaze`, hidden.
- **Deep Field** is two requests (`astral_fog`, `astral_stars`). Its Glow
  Hue rides on `astral_stars`.
- **Dream Bloom** is a thin-lens camera (50 mm f/1.8): its blur is a real
  convolution.
- **Flow-Field Ink:** Flow Lines (Jobard–Lefer spacing). An Angle Map input
  bends it by any gray map.
- **Grown & Generated** (stepsGenerative.js): between a plain pattern and a
  scene. A process is simulated, laid on a material, and lit.
  - **Lichtenberg Figures:**
    - Discharge (Kim–Sewall–Lin fast Laplacian growth) → Burn into Wood →
      Light Engine.
    - One or two poles; two always join.
    - It grows at zoom 1 and is transformed afterwards.
  - **Ruffled Growth:** Growing Line (differential growth on a spatial
    hash).
  - **Positioning:** generated textures take Zoom and Slide (along the
    dial's axis).
- **Knotwork:** Cromwell's construction.
  - Cells sit at odd doubled coordinates, crossings at edge midpoints.
  - Boundary edges and hashed symmetric breaks become turns.
  - Crossings alternate over and under.
- **Painted Landscape** (chain `landscape`, canvas): Painted Sky → Painted
  Ridges → Watercolour Wash.
  - `landScene(seed, …)` is the shared scene.
  - Color keeps the grey painting's value and sets only its hue
    (`landPalette`). Color 0 is exactly the grey of before.
- **Particles** (First Snow, Burning Mana, Euphoria Dust) draw under
  `withSeed(ctx.seed + Scatter·7919)`. This keeps them pixel-identical;
  Euphoria is a perfect preset.
- **Poured Wax** (chain `wax`): Pours (Splatter after every pour's draws) →
  Meniscus → colour by thickness → Light Engine with Translucency → Glow
  Hue screened where thick.
- **Rain on Glass** simulates on the EXPORT's grid at every size, then
  scales. A chaotic simulation fed sizes that differ by a fraction drifts
  apart.
- **Scattered Polygons** (chain `metalleaf`): Flakes over any base. At 0 on
  Shape, Sheen and Glitter it draws exactly the original flakes.
- **Sleep Haze** (chain `clouds`): Smoke → Light Shaft (a Dial port) → Dust
  Motes.
- **Stained Glass** (chain `stainedglass`, grid at div 3):
  - Panes (lead, edge, pane number, palette slot, window, joints) → Glass.
    A pane's look comes from its number.
  - The Window setting: None · Lancet · Arcade · Round (Round kept at the top
    of the slider).
  - Outside the outline is border glass, never stone.
  - The lead is flat and dark, soldered at the joints.
  - The extra knobs draw nothing at 0, and the Scene is evaluated only when
    above 0.
- **Turing Skin:** Turing Pattern (Gray–Scott) → Map Range → Light Engine.
  The old Reaction–Diffusion part stays for old graphs.
- **Veins of Light:** Matrix (strata, pebbles, sand, fibres, skin; its
  "ways") → Tendrils (Runions' space colonization, steered into the ways).
- **Watercolor Wash:** Washes → Pigment → Pigment (any gray map laid as
  watercolor).
- **Texture layers:** the base layer is drawn first, in its own slot,
  seeded `seed ^ 0x5bd1e995`. Presets turn it off.

---

## 10 · Pitfalls we hit

**JavaScript and the bundle**
- `-x**2` is a SyntaxError: write `-(x**2)`. It has bitten five textures,
  and `node --check` may not catch it. Run `sh check.sh`, or render.
- build.mjs flattens `export async function` too. A module statement that
  survives flattening fails the build.
- The worker's script block must be in `<head>`: it has to exist before the
  page first asks for a texture.
- `__BUILD_STAMP__` left unreplaced reads as underline markup in PML.

**Textures**
- `amt` is floored at 2%. A knob that must reach 0 needs its own key
  (`stones`).
- Never draw `Math.random` once **per pixel** before a texture's main
  features. The count changes with the size, so a preview and its export
  would differ. Hash the canonical position instead, or make per-pixel
  randomness the last thing drawn.
- **Weighted choices:** `pickWeighted([[value, weight], …], roll)`. Pass an
  existing roll to keep a seed's other draws where they were: the falling
  star reuses `shootP`.
- Grey-ground textures are neutral at 128. Colour-keyed ones inherit the
  accents unless a tint is given.
- Blend modes can hide an inset box: Darken shows only a darker box.

**The canvas, the page, the phone**
- **Never `close()` a cached ImageBitmap:** the texture service may still be
  showing it.
- **Every 2D context prototype gets the inline-glyph hook** (glyphs.js): the
  page canvas AND OffscreenCanvas. Missing one draws every inline glyph as
  a missing-character box.
- The page canvas is a CPU canvas (`willReadFrequently`), like every layer
  drawn into it. A GPU page canvas re-uploads CPU layers every frame.
- **Text effects** are one stack of up to three effects, page-wide (the UI
  slots) or per segment (`/fx:`). Underlines are stitch decorations
  (`/under:`).
- **Text effects never blur with `ctx.filter`:** a whole layer per call, and
  per LETTER when a run is tracked (~100× slower). Use `softText`, a shadow
  of off-page letters.
- **Measure canvas work with the canvas flushed** (`getImageData` of one
  pixel). Draws are deferred, and a timer alone reads ~1 ms whatever they
  cost.
- The preview's first real measurement may step its scale down; later
  layout changes may not (hysteresis).
- The box's glass (boxFx.js) reads the page's own canvas, so it must run
  after the backdrop, texture and vignette, and before the text.

**Tests and tools**
- The Node canvas mock has no `Path2D` or `isPointInPath`, and doesn't parse
  `innerHTML`. Build elements with `createElement` if the tests boot that
  code.
- The mock's pixel sum is RGB, so black ink sums to ~0. A knob that only
  changes black pixels looks "inert": make some mark respond, or check
  whether the probe can see it before changing the texture.
- A texture's option value used elsewhere in the markup (the box's Frosted
  Glass is `value="frost"`) is counted once: the tests use a Set.
- Stitches are retired by ALIAS, never deleted (old poems parse them).
- **Measure on the right machine.** This sandbox has one core and no GPU.
  Parallel workers and shaders can't show their gains here, and timing
  harnesses lie easily. Count events rather than infer them.

---

## 11 · Design language

**The four elements.** Every preset, texture and colour decision belongs to
one. Each owns a different visual channel, so they combine without
competing.

| | Element | Owns | Palette | Feeling |
|---|---|---|---|---|
| ♡ | **Whimsy** | hue | red, purple **and** blue | sleep, starlight advancing or receding |
| √ | **Sharpness** | value | off-white against blacks with blue in them; metal at the edges | waking |
| ∆ | **Chaos** | pattern | sigils, binary pattern, geometry going wrong | pain, dysphoria |
| 🜚 | **Touch** | surface | neutrals: parchment, bone, tea-stain, graphite | contact |

- Whimsy is three hues. Purple is over-used: reach for reds and blues on
  purpose.
- Touch claims no hue of its own; its one permitted colour is oxblood, in
  the wax.
  - It is what the page is made of and what has happened to it: the only
    element that requires another person to have been there.
  - Touch textures read as relief and take the light.
- **Equal weight:** no element is smaller because it is quieter.

**Symbols.**
- **🜚** is Touch, the Return glyph, and the app's mark for "touch this". Use
  this exact variant: it is personally significant, so never substitute it.
- The light dial is ☉ at rest and grows 🜚's spike as it is pulled.
- **Navigation glyphs** are hand-drawn and scratchy: each stroke gone over
  two or three times, never clean vector.
  - They relax when deselected and stiffen when selected. State must read
    standing still.
  - The lock is a drawn padlock in the same hand, never an emoji.
- **Tabs:** Inscription ⌘ (the Bowen knot) · Rituals (an inverted
  pentagram) · Thoughtforms (Ruby's glyph) · Materia ◈ · Esoterica ⌬.
- **Runology** (runology.js): Ruby's Runes of Power, as Symbology carries
  them.
  - Archetypes head the preset groups, the texture groups and the Athanor's
    categories, chosen by meaning.
  - Its words are in the seed banks; its glyphs in the spells.
  - "Chrysm" and "Pandorans" are words Ruby set aside: use Vitrum and
    Runists.

**Language.**
- Ritual and arcane, but readable: someone who doesn't code must understand
  every control. When flavour and clarity conflict, clarity wins ("Script
  Highlighting", not "Illuminate the script").
- Names must be honest: describe what a thing actually does.
- Vary the vocabulary: three "…Drift"s was a failure.
- **Dialogs** pair a plain verb with a flavoured one: *Yes (Inscribe)* /
  *No (Ignore)*. Confirm on the left, cancel on the right, a light touch.
- Light mode is gently shamed: the moths will find you.
- Code comments may be haiku, especially on texture generators. Comments
  explain WHY.

**Colour.**
- Dark by default. The default theme is **Rosé**: rosy, grey, dark, a touch
  redder and darker on desktop. The original violet-and-gold is kept as
  **Aether**.
- Don't reach for violet-and-gold by reflex: violet belongs in accents,
  never grounds.
- Colours carry a subtle breath of nature (moss, clay, tea, sage), never
  loud.

**Motion.** Minimal: animation mostly advertises how well the browser is
coping. The one exception is the busy shimmer (a texture being made, or a
save), shown only after a moment and replaced by a fade for reduced motion.

**PML's purpose** is to override the page's globals per segment: that is
what makes shaped poetry possible. Page-level settings (border, vignette,
background) don't belong in it.

---

## 12 · Working with Ruby

- **Address Ruby indirectly** ("Ruby", not "you"), as Ruby prefers.
- **Use what has been done already:** before building a technique, look up
  the prior art (a published method, an established library, a known
  shader) and adopt it.
  - Reinvent only for a good reason, and say what it is.
  - The prior art so far: the Claude Doc "Unfixable Vellum — Prior Art &
    Recommendations", and the Filter Forge study (ROADMAP.md §1).
- **Don't replace what Ruby loves; add beside it.** A texture Ruby liked
  keeps its exact look at its defaults: a new idea becomes a knob, or a new
  texture.
- **Do the work** rather than talking about it: attention is finite.
- **Find the cause** instead of guessing twice. Screenshots are evidence:
  read them closely. Prove a fix by rendering or measuring it.
- **Ask** when a request is ambiguous, or when two of its voices disagree.
  Requests marked "bonus points" are real requests.
- **When a texture is asked to look like something, look at it:** render it
  and judge it by eye. Run the gallery tool only when a visual review is
  asked for.
- **Presets come last:** parts → features → textures → presets (ROADMAP.md).
- **OPEN-ISSUES.md holds open items only.** When something is finished,
  delete it; don't edit it into a history.
- Hand-editable text lives in `strings.js`; hand-editable numbers in
  `tunables.js`.
