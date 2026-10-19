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
1. **Old work never changes without Ruby's say-so.** By default, existing
   poems, looks, presets and graphs draw exactly as before: you *add* (a
   version, an id, an option), you don't redefine. **But a better app wins**
   (Ruby):
   - A texture may be **replaced** by a better or faster method, and a test
     or invariant that stands in the way of a better app may be
     **loosened**.
   - Either one needs **Ruby's approval from test renders**: make them with
     `tools/compare.mjs`, send them, and wait for Ruby's yes before
     shipping.
   - See §7 and §8 "Replace a texture's method". The exceptions that never
     bend are PML (poems people wrote) and the frozen word-seed banks.
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
11. **The help moves with the app** (Ruby). A change isn't done until what
    teaches it is current, in the same pass:
    - **the Athanor's wiki** (`athanorWiki.js` articles, `athanorWikiParts.js`
      part pages), every TEACH note that names what changed, and the menus'
      hints;
    - **the app's own help**: tooltips and hidden help in `strings.js` and
      index.html, the PML guide (in-app and PML.md);
    - this file, wherever it names the thing.
    A new part, port, setting, menu item, wire kind or feature gets its
    explanation; a rename or removal is followed everywhere the old name
    appears (`grep` for it). `test/wiki.test.mjs` catches the mechanical
    half (undocumented ports and settings, dead links, menu labels and part
    names the code no longer has, retired names); whether the help still
    *teaches* is judged by reading it (§11, Three voices).
12. **Nothing goes stale** (Ruby: the project's documentation enforces
    itself). `test/hygiene.test.mjs` fails, so staleness can't ship, when:
    - code, a string, a CSS class, a fixture or a tool is unused
      (`node tools/prune.mjs` lists them; a name kept on purpose says why
      on its line: `// test hook: …` or `// kept: …`);
    - a doc names a function, file or command that doesn't exist, states a
      count the code disagrees with, or leaves a module or tool out of its
      map; the changelog doesn't lead with this release; OPEN-ISSUES or
      ROADMAP keep finished work;
    - PML.md or the in-app guide teaches a directive that does nothing;
    - a test reads a surface's source, repeats another suite's check, or
      doesn't name itself.
    Beyond what it can see: **retire things whole** (the code, its strings,
    CSS, tests, docs and wiki go together), **merge what repeats** (one
    list, one table, one source for a number), and keep the tests to
    behavior and invariants (§8 Add a test). Every few releases, prune the
    stylesheet and review the tests (§3 step 6); the hygiene test checks
    the changelog says it happened.

**Every pass:** read the parts of this file you'll touch → read ROADMAP.md
if it's Athanor work → do the work → `sh test.sh` green → look at it →
update the wiki and help text it touches (rule 11) → delete what the change
left unused (rule 12: `node tools/prune.mjs`) → update CHANGELOG /
OPEN-ISSUES / this file → ship (§3).

---

## 2 · Commands

```sh
node build.mjs            # flatten every module into dist/index.html (+ the texture worker, sw.js, manifest)
sh test.sh                # parse check + build + every test suite — must end "all N suites passed"
sh check.sh file.js …     # syntax-check modules (really parses them; `node --check` passes broken modules here)
node build.mjs --next     # advance release.js to the next moon — once per shipped release
node build.mjs --notes    # print the newest CHANGELOG section (the release's commit message)
node build.mjs --zip      # archive the project into release/ (old archives deleted first)

npm install --no-save @napi-rs/canvas          # once, for the tools below (node_modules is git-ignored)
node tools/look.mjs '<json>' out.png <cols>    # a quick look at specific texture settings
node tools/scale-audit.mjs [--knobs min|max]   # does a texture look the same drawn small?
node tools/texture-gallery.mjs --only a,b      # four backgrounds each — ONLY when a visual review is asked for
python tools/page-audit.py                     # whole pages, every preset (needs Playwright)
python3 tools/fit-audit.py                     # does every control fit its panel? Every tab at 360, 412 and 1280 px, hints out (needs Playwright)
python3 tools/icons.py                         # redraw the nav glyphs, the sigil and the app icons
node test/textureFingerprints.test.mjs --update   # accept new texture renders — only those you meant to change
node tools/compare.mjs a,b [--ref HEAD]          # before/after renders of a texture's readings, for Ruby's approval
node tools/prune.mjs                           # what has gone unused: names, strings, CSS, fixtures, tools (test/hygiene fails on any)
python3 tools/css-audit.py                     # which CSS declarations never win, in any state (desk, phone, tabs, Athanor, themes)
python3 tools/css-prune.py [--write]           # remove those, verified: no drawn element computes differently in any state
node tools/make-murmur-studio.mjs              # rebuild tools/murmur-studio.html from its template and murmur.js
```

The site must work **both built and unbuilt** (served straight from the
source files). Deploy is the whole `dist/` folder: the page, `sw.js`,
`manifest.webmanifest` and `icons/`. The service worker must be its own
file, or the app won't install or work offline.

---

## 3 · A pass, and shipping a release

One pass of work ends in one release. Releases are named for moons
(`release.js`): Jupiter's, in order of distance from the barycentre (they
ran out at Kore), now Saturn's (`SATURN` in build.mjs). The name is written
`Saturn–Pan` with an **en dash**, because a slash would split a PML
segment.

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
   **Every pass, not only at a release** (Ruby: "You can just remove resolved
   issues!!"): when Ruby answers an item, speaks to it, or asks for it to be
   changed, delete it (what she asks for becomes the work, or a ROADMAP
   item). A question she passes over once she has seen it is settled: it
   goes too. "Ruby to judge" holds only what she hasn't seen yet, a line or
   two each; it is never a history of releases.
   Check the help is current (§1 rule 11): for each CHANGELOG line, the
   wiki page, tooltip or guide that explains it says what the app now does.
   **Housekeeping** (§1 rule 12), said in that release's notes under **Under
   the hood** (the hygiene test looks): the stylesheet at least once in every
   ten releases (Ruby: the prune is slow), the tests once in every five.
   - *pruned the stylesheet*: `node build.mjs && python3 tools/css-prune.py
     --write` (it removes only declarations that never win, and proves no
     drawn element changes in any state), then look at the page;
   - *reviewed the tests*: read the suites against §8 Add a test; delete
     what tests a retired thing or an implementation, merge what repeats,
     move a check to the suite of its concern.
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
| `textParsers.js` · `pmlVars.js` · `effects.js` | PML → lines and segments (`buildLines`) · `§Variables` and named styles (`§style`), resolved before PML parses · the text effect stack and `/fx:` |
| `stitches.js` | decorative motifs along any path (rules, borders, seams, inner edges) |
| `boxFx.js` | the inset box's glass and GPU blends |
| `chooser.js` · `swatches.js` | the surface menus shown as tiles (thumbnails kept in localStorage `uv.thumbs.v2`, each with a stamp: its surface's fingerprints, written into release.js by the build, the look it wears and the painter; only a changed surface is painted again) · the painted preset tiles |
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
| `texCore.js` | shared maths: seeded random, noise, `pixelPass`, canonical pixels, `lightHeights` (the lighting engine, CPU and WebGL2), FXAA (`fxaaImage`), the steps' kit |
| `texWhimsy.js` `texSharpness.js` `texChaos.js` `texTouch.js` | the older generators, one file per element (being taken apart into steps) |
| `textureElements.js` | each texture's four readings (🜂 🜄 🜁 🜃), one of them its default |
| `cartomancy.js` · `cartomancyTable.js` | Cartomancy and its parts · what else is on its table (bundled BEFORE cartomancy.js) |

**The Athanor (the node editor)**

| File | Role |
|---|---|
| `steps.js` | THE PARTS: the general library (`STEP_PARTS`, `STEP_RUN`, `STEP_DOCS`, `STEP_IO`, `STEP_COST`, `STEP_REQUIRED`) and the merged `STEPS` table. Also The Poem, curves and Filter Forge's primitives |
| `stepsTouch.js` `stepsChaos.js` `stepsWhimsy.js` `stepsLight.js` `stepsSharpness.js` `stepsGenerative.js` | each family's own parts, and the older textures as whole parts (`kitWhole`) until they are taken apart. Generative: Discharge, Wood, Burn, Differential Growth, Knotwork, Growth Medium, Tendrils, Circuit Traces. Light: the Light Engine, Oil Paint, Canvas Weave, Paint Swipes. Touch: also the glass (Scratches, Smudges, Window Reflection, Shatter, Glass Pane) |
| `stepsRing.js` | the Painted Ringworld's parts (`RING_STEPS`): The Arch (`rgPaintArch`) and Land on the Ring (`rgPaintLand`), seen through Ringworld's own camera (`ringCamera`) in a painter's curved perspective, with the Worlds (`RG_WORLDS`, `RG_PROF`) and their painted things |
| `stepsPatterns.js` | general pattern parts (`PATTERN_STEPS`): Scatter, Grid & Dots, Ellipse, Polygon, Triangle Mesh (`patDelaunay`), Blocks, Pyramids, Border Mask, Lookup, Displace, Gradient Map, Noise Gradient, Spectrum; Split and Merge HSB and Lab, Median (`patRank`), Map Switch, Flip, Perspective, Rotate and Scale (`patResample`) |
| `chains.js` | the textures rebuilt as graphs of parts (`TEXTURE_CHAINS`, each with its TEACH) |
| `athanorStudies.js` | the 36 Surface Studies (`ATHANOR_STUDIES`): the future-directions doc's surfaces as graphs of general parts, in the Athanor's Open menu; bundled before chains.js |
| `athanor.js` | the graph evaluator (in the worker), its cache (`ATHANOR_KEPT`), budget, versions, groups (`athanorFlat`) and port names, starters, `validateGraph` |
| `athanorWiki.js` · `athanorWikiParts.js` | the Athanor's wiki: concept articles, the first-surface tutorial, glossary, search (`WIKI_ARTICLES`, `wikiArticleHtml`, `wikiSearch`), and figures (`WIKI_FIGURES`, `{{fig:key}}`: a small graph whose every part the worker draws when the page opens) · every part's page (`WIKI_PARTS`). Bundled before forge.js |
| `forge.js` | the editor UI (Drawflow): menus, wiring, the wiki panel, the shelf of kept surfaces |

**The rest:** `release.js` (the release name), `build.mjs` (the bundler; its
`ORDER` lists every module after its imports), `test/` (one suite per
concern; `invariants` holds the source scans, `hygiene` keeps the project
current), `tools/` (§2).

---

## 5 · How the app works

### 5.1 · Rendering
`render()` draws, in order:
1. backdrop;
2. the surface: the lower layer first (Two Surfaces), then the upper;
3. vignette;
4. inset box;
5. border (its bloom on its own half-resolution layer);
6. text (effects under the glyphs, then the glyphs), and a lower surface set
   to Blend with Text blended into the letters;
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
- Every length a control sets in pixels is the saved image's, so times S in
  `renderInto`: the border's and the box's, and Max Text Size. The text fit
  steps by 2·S from the cap (`fitTextSize`), so the preview picks the size the
  saved image will (Ruby: the saved text came out smaller than the preview's
  once the margins left room past an unscaled cap).

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
    `checkLook` (quietly), then `safeRestore`, then its own page shape
    (`restoreShape`). An empty poem is a fresh start: the welcome page, the
    default theme, every slider and lock new. Anything else opens the
    welcome page.
  - `test/draft.test.mjs`.
- **THE PAGE SHAPE is the person's.** `safeRestore` drops aspect and custom
  size from every look loaded from outside; the draft keeps it between
  visits.
- **App preferences** (theme, sounds, folded groups, the chooser's
  thumbnails, step previews on or off) live in localStorage, **never** in a
  look.

### 5.5 · Light
- The ☉/🜚 dial sets a direction and a height (`textureLight`,
  `textureLightTilt`). `lightVec` scales by height.
- **The handle is the light** (Ruby: "dragging a light around an object in
  the center … it projects a shadow"). Every surface is lit from the
  handle's side, and shadows fall away from it; 🜚's spike on the dial (and
  the rim light's, in its colour) points where they fall.
  - `lightVec` is the way the light travels (away from the handle);
    `dialVec` is the handle's own way, for a dial that is a direction or a
    place (wind, a breath, Pigment's flow, where a circle stands); Athanor
    parts take `genDial(E, n, port)` (travel), or `light: false` for an
    angle of their own (Lichtenberg's strike).
  - Older looks (format < 6), presets and readings on the surfaces that were
    lit from the far side (`LIGHT_TURNED`; an Athanor look unless its graph
    holds a `LIGHT_KEPT_PARTS` part) are turned half round on load
    (`retireFormat6`, `halfRound`), so their pictures stay. A new surface
    reads `lightVec`/`dialVec` and is never added to `LIGHT_TURNED`.
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
  - The Shadow Hue colours what's darker than flat ground (`L.flat`), the
    Specular Hue the shine. Hues are normalised to white's brightness.
  - Caps `material: true` show the two pickers (`textureTint3Hex`,
    `textureTint4Hex`).
  - `opts.components` returns diffuse and occlusion apart.
  - `opts.marchSteps` passes the whole field's shadow march to each sparse
    piece.
  - **With white hues a texture draws exactly as before** (the fingerprints
    prove it).
  - The Athanor's Light Engine also takes a color for the ambient light (its
    eighth input, `ambient hue`; ROADMAP C1): the ambient share of the light (`ambient × (1 −
    occlusion)`, from `opts.components`) is tinted by it per channel, so the
    shade, lit mostly by it, takes its color most. Empty or white: unchanged.
  - And a **Second Light** (ROADMAP C2): the same engine called again from
    another way (turned from the dial's: 180 a backlight), at its own height
    (read as Light Height: past 100 it grazes, a rim light), soft as three
    ways averaged, its direct light and shine alone (`ltSecondK`,
    `ltSecondS`), in its own color (the ninth input); negative draws light
    out. At 0 the loops are the old ones exactly. The GPU path is the same
    engine, so it stays line for line with the CPU.
- **The page's lights** (ROADMAP C1, C2 on the page; texCore
  `withLightRig`, built by `lightRigOf` from a layer's keys through
  `layerLights`): set round one texture's making, as `withLightTilt` is.
  - The **rim light** is the light dial's second handle (`textureRim`,
    `textureRimTilt`; its hue `textureTint7Hex`, whose alpha is its
    strength: 0 is off). lightHeights adds its direct light and shine, with
    shadows marched its own way (`lightWay`); lightSparse widens its margins
    to both lights' reach. Flat ground's `flat` includes it. With Rim
    chosen above the dial, the slider under it is that alpha (`rimStrength`,
    `setRimStrength`; a view, not saved on its own), and the rim handle
    fades with it.
  - The **Ambient slider** (`textureAmbient`, 0–200, 100 the surface's own)
    scales the ambient share's odds against the direct light, so 200% is
    twice the fill and never more than all the light.
  - The **light hues**: Main Light (`textureTint6Hex`: a Diffuse Hue
    surface's material `di`, else the rig's `mainHue`), Rim Light, Ambient.
    lightHeights then returns the shares (`aa`, `ma`, `ra`, `rs`) and `hue`;
    `litK` adds `litT(L, i, c)` and `litS(M, c, L, i)` colours a rim's own
    shine. A texture compositing its own way takes `litT`/`litS` where it
    uses the light (Cold Press and Old Paper through `litGrey`, Sigil
    Scatter, Guilloché, the Surface's heights).
  - The Light Engine takes the ambient (`rig: 'ambient'`) and makes the
    page's rim its Second Light when its own is 0; unwired, its Diffuse and
    Ambient Hue inputs are the page's.
  - Which surfaces: `TEXTURE_CAPS[t].rig`, measured (each changes under
    them; tools: a sheet of real pixels). Never a dial that is only a
    direction or the day. Others never see the rig and key as before.
  - Null rig, white hues, alpha 0, ambient 100: no rig at all; the
    fingerprints prove it. The GPU agrees with the CPU to 0.01/255
    (compared under `?softgl`-style SwiftShader).
- **GPU lighting:** the WebGL2 shader must stay line-for-line with the CPU
  `lightHeights`.
  - Change both together and compare them (`opts.cpuLight`; they agree to
    within 1/255).
  - Node always runs the CPU path, so the fingerprints test it.
  - `?softgl` in the address lets a machine without a GPU test the GPU path.
- **The dial as a joystick:** `caps.dial` renames it (Wind Direction,
  View…).
  - Rename labels with `setLabelText`, never `textContent` (that wiped the
    padlocks: the surface knobs' locks vanished this way twice).
  - Point things FROM the dial's handle: (cos a, sin a) with
    a = (deg − 90)°.

### 5.6 · Knobs and colour roles
- A texture declares **2–8 knobs** in `TEXTURE_PARAMS`, read by position as
  `texP1`…`texP8` (Ruby: eight at most). The usual keys are zoom, amt, form,
  shape, hue and tilt; the seventh and eighth are a chain's own (a camera's
  Turn and View, Circuit Board's Era). An Athanor graph's Knob has slots 1–8.
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
  - Specular / Shadow: glints and cast shadow.
  - Main Light / Rim Light / Ambient: the three lights' colours (the rim's
    alpha is its strength), shown beside the dial where the page's lights
    reach.
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
  - A die beside each lock rerolls only that section (`rollSection(root, level)`).
    - Three ways (Ruby): **gently** (sliders ±8%; colours drift together and
      a touch apart; the light turns a little; menus and switches stay, so the
      surface never changes; a typeface may become a similar one,
      `similarFont`), **as usual**, **wildly** (whole ranges, every menu, any
      colour, the light anywhere; never a switch).
    - The way is chosen from a long press on a phone, ▾ beside the die on a
      desk, and **remembered** (localStorage `uv.dice.level`, an app
      preference). Every die, the three Summon buttons and the light's ⚄
      roll that way; seed-only buttons don't. Dice show it (⚁ ⚄ ⚅).
    - **Back** (`dieBack`) puts back only what the section's last roll
      changed. A Summon that asks first is recorded once its work has run.
    - On the Surface, Shift-click (or a desk's long press) rolls only the
      seed; on a phone that is a menu item.
    - **One control alone** (`rollByLabel`, `rollControl`): Ctrl- or ⌘-click
      a control's name on a desk, or hold it on a phone; the dice's way.
  - **Above the presets** (ROADMAP H1, the preset level): **Summon
    Variation** (a new seed, now and then another reading: what a click on
    a lit preset does; a frozen seed leaves only the reading), **Mutate
    Gently** (every section's die, gently, at once) and **Freeze This Seed**
    (the seed's padlock as a button; `paintFreeze` keeps it pressed with the
    lock).
  - **Locks supersede every roll** (Ruby): rolls skip locked controls, and
    `restoreLocked` puts menus back before sliders (a surface put back resets
    its sliders).
- **Hints written out** (Ruby: readable on a phone, and switchable for
  density): every card's heading has ⓘ (`addHintsButton`), which writes each
  control's `title` under it as a small `.tip-line` (`writeHints`, kept current
  by `refreshHints` in `refreshUi`); the **Hints** switch (Esoterica →
  Interface, localStorage `uv.hints.on`, an app preference) writes them out
  everywhere. A `.hint-extra` note shows only with its card's hints. So a
  control's tooltip is its phone hint too: write it as one. A hint takes its own
  line in any row it is written into (`:has(> .tip-line)` wraps the row): one
  laid beside a row of buttons once slid a phone's panel sideways, and
  `tools/fit-audit.py` looks for that.
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
  - The textarea is grown to its content (one line of slack, `fitHeight`)
    inside the scrolling `.editor-wrap`, and must never scroll itself: a
    scroll on it is undone and the height refitted (Firefox measured long
    edits short, and the last lines could not be reached). Fonts arriving
    and the room changing (`fitEditorRoom`) repaint it.
  - While the phone's keyboard is up, `fitEditorRoom` leaves the poem
    `WRITING_LINES` (12) and gives the preview the rest (`--kb-stage-h`).
    The PML guide opened then lies over the preview (`--guide-top`,
    `--guide-h`); a press on PML or in the guide never takes the poem's
    focus, so the keyboard stays up.
- **Text layout:** fitting predicts the size and checks the grid around it.
  Widths are remembered and cleared when a font arrives. Keep new text
  layout on that path: text measurement once took ~70% of the page's CPU.
- **THE POEM'S LAYOUT** (`TEXT_LAYOUT`, `textLayoutNow()`):
  - Each frame records its text runs as `x0,y0,x1,y1,line,stanza,rhyme;…` in page
    fractions.
  - After the runs come the punctuation marks as `x,y,mark` (`notePunct` in
    drawTextRun, while `PUNCT_NOW` is a list; `POEM_PUNCT` and `punctMark` in
    steps.js; `poemMarks` reads them). They are three numbers so every reader
    of the runs (which all want four or more) passes them over: keep it so.
    The Poem's ninth output, Punctuation, glows on them.
  - A surface drawn before the text reads the previous frame's record. A
    change asks for one more frame, and only when something reads it.
  - **Text Clearing** (`textureClearing`) takes a soft mask of the runs out
    of each surface layer. The mask is 192 px across, blurred there.
  - **Protect the Text** (`protectText`, ROADMAP G3) raises Text Clearing to
    the least that brings every line to `READABLE.ratio` (tunables.js).
    `measureTextGround()` draws a frame that keeps a small copy of its ground
    just before the words, and `groundContrast` reads each run against it,
    segment by segment in the ink written there (accents, a gradient along
    a segment, the page's text gradient, a quote's faintness). It never
    lowers the clearing and a lock holds it; a line clearing can't help is
    named by its words and left out of the aim.
  - The **Ink** part hands a graph the text color (after the two accents in
    `ctx.accents`); only a graph with one keys its cache on the ink.
  - **The surface and the words** (Ruby; layer keys `textureTextAware`,
    `textureTextBlend`, `textureShapeAware`, `textureTextCut`, saved with
    each layer, a look without them aware, unblended and uncut):
    - **Text Aware** (the first surface's box, ticked by default): only an
      aware surface is handed the layout; unticked, it is drawn as if the
      page had no words. The Poem's `aware` output says which.
    - **Blend with Text** (the second surface's box): the lower layer is not
      drawn under the page; while the words are drawn, every glyph fill is
      mirrored white onto `GLYPH_MASK` (`maskGlyphs`, with the context's own
      transform), and after them the page is copied, the surface drawn onto
      the copy with its own blend and opacity (`drawSurfaceLayer`), the copy
      cut to the mask and laid back. Effects and underlines stay unfilled.
    - **Shape Aware** (either surface; greyed on the first while it is not
      Text Aware). In the letters (with Blend with Text) the request carries
      `fill` (keyed `_F` for a poem-reading surface) → `ctx.fill`; The
      Poem's `in the letters` is 1. Parts that answer it read `ctx.fill`
      and the lines (`genLinesOf(ctx.text)`): Glass Shards lies only on the
      lines, Dewy Webs strings a web across each; Circuit Traces, Halftone
      Screen, Hatching, Flow Lines and Terrain go finer. On the page it
      carries `around` (keyed `_R`) → `ctx.around`, The Poem's `round the
      words`: the surface gives way round the words (Ruby: "literally
      anything that generates high contrast patterns all over the page …
      avoid the text or highlight the text or interact with the text").
      **Shape Strength** (`textureShapeStrength`, per layer, 100 for a look
      without it; Ruby: "a slider to soften the shape awareness") makes both
      numbers 0..1 (`fill`, `around`; keyed `_F` and `_R` followed by the strength); a part scales
      what it does by them. `wordsRoom(ctx, ww, wh, pad, reach)` (texCore)
      is 0 on and about each line, 1 a reach away (below full strength the
      words keep `1 - strength` of it): Halftone Screen's dots and
      Hatching's strokes shrink by it, Flow Lines bend along its contour and
      end on the words, Terrain levels the land under them to one height
      (contours ring the poem), Circuit Traces routes round what Keep Clear
      gives, Glass Shards drops a shard that would touch a line, Dewy Webs
      keeps a web to its hub's room, Knotwork leaves the cells out
      (`o.hole`), Panes sets the poem in one pale pane (`chamferDistance` for
      the came round it), Facet Field flattens whole facets, Turing Pattern
      kills its second chemical there, and Deep Field's star layer fades its
      stars (the renderer hands `astral_stars` the layout under Shape
      Aware). A chain that
      answers always says `poem: 'lines'`; one that answers only Shape Aware
      says `poem: 'shape'` (handed the layout only then, so typing never
      redraws it otherwise; `chainReadsPoem(type, shaped)`).
    - **Cut Out by Text** (either surface; Ruby: "so the page shows through
      the letters"): the page as it is before the first such surface is
      kept (`CUT_CANVAS`), and after the words it is laid back inside the
      glyph mask: the letters are windows, their effects still round them.
    - Text Aware used quietly (readability, never dramatic): a shard on a
      line is a small one; a web's hub is never on the words.
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
- **The camera dial** (right of the light dial; Ruby: the light dial is only
  the light):
  - A texture opts in with `caps.camera {turn, view, zoom, guide}` (its
    defaults; guide `'plane'` or `'ring'`). Its chain takes the camera from a
    `camdial` part (Turn, View, Zoom), wired like a knob.
  - An Athanor graph gets the dial when its Camera Dial reaches the Surface
    (`athanorCamera`; `applyAthanorGraph` sets `TEXTURE_CAPS.athanor.camera`,
    from the menu texture of the same name when there is one).
  - `opts.camera` → `cameraOf()` → the cache key `_cm` and `ctx.camera`; only
    a texture with the caps keys on it. Layer keys `cameraTurn/View/Zoom`,
    locked with the light (LOCKABLE), saved and restored (`putCamera`).
  - Deterministic: the same camera draws the same picture. While it moves,
    `cameraGuide()` draws a wireframe of the shot over the preview (fast, no
    render); the render follows on release.
  - Phone: the two dials side by side, the hues under both in two columns.
- **The two dials, a standing goal** (Ruby: "every time you look at a
  texture that has a camera and a viewport you should consider improvements
  to usability using these dials"):
  - Any tilt, pan, turn, zoom or position slider belongs on the camera
    dial (Turn, View, Zoom). Any light is placed with the light dial
    (direction and height; `caps.lowLight` lets it past the rim).
  - Use them creatively where it stays intuitive (Ringworld: the light dial
    is the time of day).
  - **The sun's guide** (`drawSunGuide`; Ruby: "a sun position guide that
    shows up on the image also before the render"): while the light dial
    moves, a sun over the page where the light comes from, at once: the
    Painted Ringworld's where it will stand in the picture
    (`ringSunGuide`, an arrow at the edge when out of the frame); any other
    surface lit by the dial at the dial's place stretched onto the page,
    turned against a camera that turns the ground; the rim light's in the
    second accent. Not for a dial that is a wind, a flow or the day. But every control on a dial must do what its
    handle suggests: a turn that changes nothing is worse than no dial.
  - Done: Lichtenberg, Ringworld, Broken Glass, Scrying Pool, Dune Ripples,
    Moss on Stone. Waiting: ROADMAP C5.
- **The oblique camera's turn and lens** (texCore `obliqueFrame(ww, wh,
  tilt, hRange, cam)`, `cam {turn, zoom}`):
  - Turn spins the ground about the view's centre the way `groundCam`
    does, so the dial means one thing everywhere. Zoom is the lens, 60% to
    400% (the patch grows as the square of zooming out).
  - Tilt 0 with a turn or zoom is a straight-down camera, not `flat`: no
    haze, no sky mirrored in the water.
  - The kitWhole parts read Turn and Camera Zoom with `wholeCam` and turn
    the light against the camera (`wholeTurned`), so the sun stays where
    the light dial points while the ground turns under it.
  - Old looks: the Tilt slider's value became the camera's View (format 4,
    `retireFormat4Layer`); at the defaults the pictures are unchanged.
- **The report:** pmlVars drops a line whose surface variable has nothing to
  say (`LINE_DROP`, `ctx.surfOff`). `§Build` shows the release name.
- **`$` for `§`** (Ruby; `§` is hard to reach on a keyboard): pmlVars
  `dollarsAsSections` turns `$` into `§` before a known name
  (`PML_VAR_NAMES`) or `style`, first thing; `$5` and `\$` stay as typed.
  The editor's `varAt` marks the same names.
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
avoided because the work is large. ROADMAP.md (Stage 3) keeps the one list
of menu textures that aren't chains yet; the hygiene test keeps it the code's.

### 6.2 · Anatomy of a part
A part is `{ cat, label, ins, outs, params, run(E, n) }`:
- **Where it is defined:**
  - in steps.js, across `STEP_PARTS`, `STEP_RUN`, `STEP_DOCS`, `STEP_IO`,
    `STEP_COST` and `STEP_REQUIRED`;
  - or in one family object (`TOUCH_STEPS`, …) carrying its own `cost`,
    `io` and `doc`.
- **Its doc and its wiki page:** every part has an entry in
  `athanorWikiParts.js` (`WIKI_PARTS`): `line` (one instructive sentence,
  shown in the parts list and menus; the part's `doc` is the same text),
  `about`, and what each input, output and setting does (`ins`, `outs`,
  `set`, keyed by port name and setting key), `tips`, `see`. A test fails
  if a part lacks one, leaves a port or setting unexplained, or names one
  it doesn't have. Voice: §11 (Three voices).
  - Renaming a part, port or setting: change its wiki page, every article
    and TEACH note that names it, and add the old name to `RETIRED_NAMES`
    in test/wiki.test.mjs so it can't creep back.
  - In articles, write menu items and settings in `<b>…</b>` exactly as the
    app shows them, and a part's port as `<b>Part › Port</b>`: the test
    checks those against the code.
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
  Discharge, Differential Growth.
- **A whole texture as one part** (`kitWhole` in texCore.js) wraps an older
  generator, so its texture is a chain before it is taken apart (Stage 3 J):
  - `prep(E, n, w, h)` reads the inputs and settings, then returns the
    drawing, which runs under the texture's own stream (+ Variant·7919).
  - `wholeDial` gives back the whole degrees the generator was always given;
    `wholeZoom`, `wholeAmt`, `wholeShare` read settings as `readParam` did.
  - `wholeHex` turns a wired color into a hex, or null when nothing is wired
    or the Hue's picker is empty (the Hue part marks that color `none`): the
    generator then uses its own default, as it always did.
- **Variation** (Filter Forge's local Variation): a part's `variation`
  setting (0–99) is mixed into its node seed in `evalNode`. 0 is the old
  stream, so old graphs draw as before. Give it to every new random part.

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
  - v3: map inputs (§6.4). A v3 graph is also told its grid's divisor
    (`div`), so `E.px` and `E.carea` are true canonical sizes and counts;
    older graphs keep the old (coarser) reading.
  - v4: more settings take maps (those marked `key:4` in `STEP_MAPS`).
    Kept results are keyed by the version, so a v3 graph never borrows a v4
    result.
  - v5 (Saturn–Paaliaq): GROUPS and PORTS BY NAME. Neither changes a
    picture: a v5 graph walks as a v4 one.
    - A group's insides are a module of Drawflow's own
      (`drawflow.<module>`; the group node's `data.module`). Its ports come
      from inside (`groupPorts`): each `groupin` and `knob` an input, in id
      order; the `groupout`'s last wired result its output count (≤ 4).
    - `athanorFlat` lays the graph out flat before the walk, the budget, the
      knobs, the hues and the hash: parts keep their ids (and so their
      seeds), a module used twice is renamed (`<group id>/<id>`), a group
      that holds itself or whose module is gone gives nothing. An unwired
      Knob inside a group is still its page slider.
    - Saved, every port is a name (`athanorNamed`): `in:<label>`,
      `set:<param key>`, `out:<label>`, and a group's `in:<inner id>`,
      `out:<k>`. The editor and the walk work by place (`athanorNumbered`;
      `athanorNodes` translates). Either form loads, at any version.
    - **Port names are frozen** like saved keys: a part's input and output
      labels and its range params' keys are what saved wires hold. Rename
      one only with a way for the old name to still be read.
  - **Texture chains stay v2**, so their pictures never change. Starters
    take the newest.
- **THE SURFACE STAYS:** exactly one per graph, never removed or copied.
  Clear leaves one; a graph without one gets one.
  - The Surface's **Size** (25–400) scales `unit`, `px` and `carea` for the
    whole graph (Filter Forge's Size). At 100 nothing changes.
  - The Surface's **Anti-aliasing** (`aa`, Filter Forge's menu; `athanorAA`):
    absent or `off` draws as every graph always did; `edges only` runs FXAA
    3.11 (`fxaaImage`, texCore.js) on the result at the end of `evalAthanor`;
    `all pixels` also halves `genAthanor`'s grid divisor, as far as the work
    budget allows, for v3+ graphs (whose sizes are canonical). A new graph's
    Surface starts at edges only. A texture's chain has none, so it draws as
    it always did, but for the eight Ruby chose from compare sheets
    (Saturn–Tarqeq): Knotwork, Contour Map, Ruffled Growth, Fractured Glaze,
    Stained Glass, Dewy Webs, Rain on Water and Circuit Board, whose Surface
    is at edges only (FXAA runs on the working grid, before it is scaled).
- **Safety** (`validateGraph`):
  - A graph holds only its work in flight: each part's result is let go once
    every part that reads it has run (the step previews keep them all).
  - At most 256 KB (`ATHANOR_MAX_JSON`) and 96 nodes; twice that is refused
    outright.
  - Unknown steps, bad wires and out-of-range params are reported and fixed.
  - Every param is clamped.
  - The work budget draws a heavy graph on a coarser grid.
- **Every chain, starter and study carries TEACH:** a few lines the Athanor
  shows when it opens.
- **Surface Studies** (athanorStudies.js): written with a small builder
  (`add`, `wire` by port number or by a setting's key, `fade`). General parts
  only, never Texture from the Menu. Each wired Knob gets a useful sweep with
  `'~key': 'lo,hi'`. TEACH: what it is, how its parts make it (and why),
  and one "Try:".
  test/studies.test.mjs checks them.
- **The reach rule** (`athanorReach`): only Knobs and Hues that reach the
  Surface are offered on the page. A slot bound by `'@kN'` counts.
  - A Knob of the **Angle** kind is drawn with a dial beside its slider
    (`knobDial`, 0° up and clockwise, as the light dial reads).
  - **Curve Controls** (`curvectl`, `athanorCurves`, two slots) become pads
    under the sliders (`syncCurveControls`), drawn by hand. Their points live in
    hidden fields `textureCurve1/2` ("x,y;x,y", 0–100; '' is the graph's own
    Default), saved per layer like the knobs; the request carries them as
    `curves` (keyed `_cv`, only for a graph with one) → `ctx.curves`.
    `curveFromPoints` is a monotone cubic (it never overshoots a point).
  - A wired ⚙'s range and a binding's range are set with two handles
    (`modalPrompt({ range })`).
  - The **Emotional Seed** (`feeling`) turns one feeling into a color and
    three numbers (density, turbulence, contrast) through its mood's curves
    (`FEELING_MOODS`), or through a Curve wired onto a number's port. Its
    Page Hues mood reads both pickers, so `athanorHues` offers them for it.
    Starter: Weather of Feeling.
- **The poem as input:** the **The Poem** part (words, distance, lines,
  stanzas, rhymes, punctuation, and three numbers: aware, in the letters,
  round the words) gets the layout as
  `ctx.text`, and only when its graph contains it (`graphUsesPoem`) and the
  surface is Text Aware or fills the letters. Under Shape Aware on the page,
  `around` is the Shape Strength (kept above 0 while Shape Aware is on, so 0%
  is told from off), and The Poem keeps clear by it: Words and Rhymes spread
  by Padding × strength; Distance is measured from that margin, its first
  quarter (where graphs take their margins) drawn in by the strength and the
  rest moved in by what that saves, so rings farther out keep their spacing.
  Off: the graph's own margin. The cache key carries it then
  (`_q`, with `_F` and `_A0`), never otherwise.

### 6.4 · What the Athanor took from Filter Forge
The full study and what is still to do are in ROADMAP.md §1.
- **Param ports (⚙):** a wire into a setting sweeps its range, or the part
  of it set by `'~key': 'lo,hi'`. lo > hi reverses it (Filter Forge's
  remapper).
- **Map inputs** (v3 graphs on): a gray map on a ⚙ is per point for the
  settings a part declares (`STEP_MAPS` in steps.js, or a family part's
  `maps`; `key:4` from v4), read with `E.map`/`E.at`. The evaluator maps only those; the wiki
  marks them "by point" and the setting's menu says so. Any other setting,
  and every setting in a v2 graph, takes the map's average.
  - A number from `E.map` keeps the old code path, so a v2 graph draws
    exactly as before; filterforge.test checks every declared setting both
    ways.
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
  fixed colours, by kind (`--t-<kind>` in poetrypress.css, both themes). Node titles are marked by
  category.
- **Moving and menus:**
  - A node moves only by its title, so the grid can pan.
  - A long press or right-click opens THE MENU for the thing under it.
  - `thingsNear()` asks "Which did you mean?" when two things are close.
- **Wires:** each has an invisible wide twin (`.forge-hit`) that is easy to
  tap.
- **Wiring by menu:** hold a part → "Connect its output…" or "Connect an
  input…" (a port: "Connect to…" / "Connect from…") → tap the other part →
  choose a port. Every menu item has a hint saying what it does; a new item
  gets one, and the wiki's [[menus]], [[mouse]] and [[touch]] articles name
  it.
  - A phone's tap is a pointer down and up in place; it never arrives as a
    click.
  - Escape or Cancel stops.
- **The bar** (Ruby: "Start… Kept, Keep, Use: Use feels redundant"):
  **Open ▾** (every graph to begin from: your kept surfaces, the starters,
  the Basics, the Surface Studies, the app's textures by group, each with
  the first line of its TEACH as its hint), **Keep**, ↶ ↷, the zoom, **⋯**
  (Show it on the page, Copy and Share the wiring, Your shelf…, Tidy,
  Revert, Clear the grid, the wiki), the page chip (`forgePageBtn`: ✓ On the
  Page, or ⇱ Show on Page, which is what Use did; `deps.onPage`), **Done**.
  - `closeForge` returns whether the graph changed while open; Done then
    asks whether to put a changed graph the page doesn't show on the page
    (Apply to Page / Not Now). Bar words live in strings.js `FORGE_BAR`.
- **Asking first:** before Clear, Revert, Open, or deleting a node,
  the editor asks whenever the grid has work on it.
- **Kept surfaces:** localStorage `uv.forge.kept.v1` (`forgeShelf`,
  `forgeShelfPut`), each validated on opening and import.
  - **One name** (Ruby): the name a surface is kept under is its Surface
    part's name. Keeping under a new name renames the part
    (`forgeNameSurface`).
  - **Keep** is in the bar; opening one is in Open; managing them (replace,
    copy, share, remove, paste, the shelf as a file) is ⋯ › Your shelf….
    Replacing a kept surface asks first (the soft no).
  - **Wiring as text:** `forgeWiringText` (the shelf file's form, without
    thumbnails) for Copy and Share; `forgeReadSurfaces` reads it back from a
    paste or a file (a shelf, one surface, or a bare graph).
  - **In the surface menu** they are options `kept:<name>`, chosen by name.
    Their thumbnails (`keptThumb`) are drawn at canonical settings in the
    worker and stored with the surface (`thumb: { of, url }`) until its
    wiring changes. A long press or right-click on one (chooser
    `opts.hold`) opens its menu (`holdSurface`).
  - **The starters and the Surface Studies** are in the surface menu too
    (Ruby: to try them on the page): options `starter:<key>` and
    `study:<key>` in two groups before Your Surfaces (`paintTryOptions`).
    Choosing one puts its graph on the page as a kept surface does, so the
    value becomes `athanor`. The dice pass over them (`TRY_GRAPH`).
- **Ports in their own order:** `faces` sorts a node's inputs and outputs by
  number before Drawflow draws them. Drawflow makes ports in list order and
  the face lines them up by that order, so a graph wired in another order
  drew wires to the wrong rows.
- **Step previews:** one sheet made in the worker (`athanorsteps`),
  switchable (`#forgeSteps`, localStorage `uv.forge.steps`).
- **The preview's channels** (`#forgeChannel`, `ATHANOR_CHANNELS`; ROADMAP
  B2): Final, Height, Normal, Occlusion, Specular, view only. The request
  carries `channel` (keyed `_ch`, never for Final; `ctx.channel`) and the
  Surface hands that one: the height as gray, a normal map from it, the
  occlusion and the shine from `lightOf`'s components, each but the height
  drawn at full contrast (where it falls; Final shows how strong).
- **Drawflow** (like Panzoom and Coloris) loads from jsdelivr at an exact
  version, only when the Athanor opens. The app must work without them.
  - This sandbox can't reach jsdelivr. To test the editor, inject the npm
    copy (`npm pack drawflow@0.0.60`) with Playwright's `add_script_tag`.

---

## 7 · Invariants — never break these

Each is guarded by a test. If one fails after a deliberate change, update
the test to the new intent; never weaken it just to pass.

**These serve the app, not the other way round** (Ruby).
- When an invariant or a test stands between the app and a better version of
  itself (a better or faster texture, a cleaner control), propose loosening
  it.
- Show Ruby what changes (renders for anything visual, made with
  `tools/compare.mjs`) and loosen it once Ruby approves.
- Then rewrite the test to the new intent and note the change here.
- Two never bend: **PML** (poems people wrote must keep rendering) and the
  **word-seed banks** (phrases people have seen).
- **What people saved, break only on purpose** (Ruby: "it's inevitable that
  we are going to break things so we should only do so with intention").
  Keep old looks and graphs working as far as you can; a definite
  improvement needn't preserve them exactly. When it can't, break knowingly:
  bump `LOOK_VERSION`, translate the old look in `retireLook` so it lands as
  near as it can, and say what moved in the CHANGELOG.

- **PML is a contract.** Every existing poem renders identically.
  - `test/fixtures/pml-golden.json` is **never** regenerated: find what
    changed.
  - Add directives; never redefine `/fx0 /fx1 /fx2`, the bracket accents, or
    any line prefix.
  - New parser fields are absent (or `undefined`) when unused.
  - Every styling field a segment can set is listed in `resolvePartStyle`'s
    early-return guard, or it is silently ignored.
  - Breaks so far, each approved by Ruby and noted in PML.md: brackets over
    lines (Saturn–Ijiraq); bold and italic over lines, and `<3` always a
    heart (Saturn–Phoebe).
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
- **Textures change only on purpose, and visibly only with Ruby's
  approval.** Fingerprints (`test/fixtures/texture-fingerprints.json`) are
  updated with `--update` only for the textures you meant to change.
  - A change Ruby can see goes through `tools/compare.mjs` first.
  - A replacement Ruby approved may keep its id; Ruby decides whether old
    looks should keep the old picture under a new id instead.
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
3. Read per-point settings with `E.map` where the loop allows, and declare
   them (`STEP_MAPS` or the part's `maps`). A setting that already exists
   and starts to take a map does so from a new graph version (`key:5`…),
   so an older graph still reads it whole.
4. Add a test (test/filterforge.test.mjs or the part's own suite).
5. Its wiki page in `WIKI_PARTS` (line, about, every input, output and
   setting, a tip, see-also); link it from the articles where it belongs.
6. **Render it and look at it.**

**Rename, change or remove a part, setting or menu item:** the wiki page,
every article and TEACH note that names it, the menu hint, `RETIRED_NAMES`
in test/wiki.test.mjs for the old name, and this file.

**Add a wire kind:** `VALUE_TYPES`; `FORGE_TYPE_NAMES`; its color as
`--t-<kind>` in both themes; its own wiki article (what it is, where it
comes from, what it converts to) linked from [[kinds]] and [[convert]], and
the port menu's "What is …?" entry; conversions in athanor.js (`asField`,
`asImage`, `num`); the preview's drawing of it.

**Rebuild a texture as a chain** (a long refactor, one texture at a time)
1. Find or write its parts.
2. Add the chain to chains.js:
   - nodes and wires;
   - Knob nodes as the sliders' legend;
   - its working grid (`div` or `grid`), or `canvas: true`;
   - each slider bound to the params it drives, across the slider's own
     range;
   - TEACH (what it is, how its parts make it, one "Try:").
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
   - alt-text words;
   - its TEACH note, and any new part's wiki page.
4. If it draws text in web fonts, add it to `ON_PAGE`.
5. Accept its first fingerprint. Check `scale-audit`. Look at it.
6. **No preset for it until the presets pass** (ROADMAP Stage 4).

**Replace a texture's method** (Ruby: allowed when the result is better or
faster, with Ruby's approval from test renders)
1. Build the new method, as a chain of parts.
2. `node tools/compare.mjs <texture> --ref HEAD`: its four readings, the old
   code above and the new below, with timings and how much changed.
3. Send Ruby the sheet and say what is better (the look, the speed, or
   both) and what is lost. **Wait for Ruby's yes.**
4. Once approved:
   - accept its fingerprints;
   - say in CHANGELOG that the texture was remade;
   - if Ruby wants old looks to keep the old picture, give the new method a
     NEW id and retire the old one to it (§7). Otherwise keep the id.
5. Never ship a visible replacement unapproved. Leave it on a branch or
   behind a hidden option until Ruby has seen it.

**Add a setting:**
- markup;
- a `PERSISTED` row (or an explicit save and restore);
- preset handling (`FRAME_DEFAULTS`, so presets reset it);
- the `audit.test.mjs` mutation table;
- a `strings.js` label, and a tooltip that says plainly what it does (§11).

`persistenceCoverage.test.mjs` fails until it is saved and restored.

**Add PML:** parse in textParsers.js (the field is absent when unused); add
it to the line-rebuild copy list and to `resolvePartStyle`'s guard (or, for
what acts on the whole part — `/rot`, `/glass`, `/cut` — to `drawPartRun`);
add its name to `DIRECTIVE_NAMES`, so the editor's hints know it; document
it in the in-app help and PML.md, with an example (§11: teaching, not
shortening). Anything that moves letters off their line (`/arc`, `/wave`)
must also give the line room (`lineBend`), in fitting, the block's height
and the draw loop alike.

**Add a test** (keep the suite worth running)
1. Test **behavior**: call the module, or boot the app in the mock (`load` a
   look, act, read the look back, as locks.test and audit.test do).
2. A source scan only for an invariant or a pitfall (§7, §10), in
   invariants.test.mjs, naming its section. Never a surface's source: the
   fingerprints guard the pictures.
3. Put it in the suite of its concern (persistence, locks, PML, …), never
   in a suite named for a pass or a round.
4. A suite opens by naming itself and what it guards
   (`/**\n * name.test.mjs — …`).
5. Retire a test with the thing it tests; don't keep "it is gone" checks for
   things long gone.
6. Keep it quick: a boot costs ~0.2 s in the mock. A suite over half a
   minute needs a reason (the texture suites render).

**Retire something** (a feature, a part, a control, a texture's old way):
the code, its strings, its CSS, its tests, its wiki page and every doc that
names it go in the same pass; old saves still open (§7: retire ids by
`RETIRED`/`retireLook`, stitches by alias). `node tools/prune.mjs` and the
hygiene test show what was left behind.

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
  - In the Athanor's Open menu only; hidden options so old looks open.
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
- **Circuit Board** (chain `circuit`, Pattern & Order; it replaced Veins of
  Light, which stays hidden for old looks and the Circuitry preset):
  - Circuit Traces routes it in cells (`genCircuit`): chips first, then buses
    of 1–8 traces from pins, edges and vias that turn together (a mitred
    offset), ending in vias or pads; an occupancy grid keeps buses apart.
  - Each Trace (a gray per trace, a bus's alike) goes through three
    Thresholds on Charge; Math dims it for the glow and the sparks, so Charge
    reaches them later. A param's `'~key'` range is clamped to the param's own,
    so an onset past 0 needs a dimmed input, not a range past 100.
  - The board is the page's backdrop (`pageEnv`, the Page Backdrop part);
    its hues default to the accents (`tintDefaults`); data pulses are hashed
    per trace, so more Data Flow adds pulses and moves none.
  - **Era** (7) and **Markings** (8), both 0 by default (the board exactly as
    before). Each chip, name and trace takes its era from its own hash
    (`level` in `genCircuit`), so the slider turns the board part by part;
    `cirEraChip` draws the future's, quantum, atomic and magitech chips, and
    what of them lights is copper with the chip's grey, so Charge powers it.
    Five eras: Today, Future, Quantum, Atomic, Magitech. The
    Markings are placed last, in room the board left (`CIR_SAYS`, `CIR_EGGS`,
    runes a–l in `CIR_FONT`): every word made up, no real marks or brands.
    Each era prints its own kinds of stamp (`CIR_STAMPS`: lines of words,
    titles, barcodes, warning triangles, test points, makers' marks, code
    matrices, moon phases, the little pictures), and among its words some of
    the page's own (poetry and type); by hash, Markings also prints a maker's
    code and date on today's chips and values beside today's small parts.
  - **Nothing written on anything** (Ruby: collision detection at high
    density): every name, value, rune and stamp takes its cells (`taken`)
    and is placed only where no copper, part or other word lies; a
    magitech chip's hologram stays close about its circle and its name
    stands above it.
  - **Atomic** (the fourth era; it was called Magitech until format 4, and
    Ruby kept it: "Fallout … do more of that"): brass gears and riveted bars
    set with crystals, valves, coils wound round traces; the brass is its own
    output (`brass`), laid over the chips. No sigils.
  - **Magitech** (the fifth; Ruby: Final Fantasy, not Fallout: sparks,
    optical computing, crystals set in the board, holography, runes,
    summoning circles): `cirMagitekChip` draws a summoning circle with a
    star and runes, a faceted gem in a bezel, light guides curving to the
    used pins, broken hologram rings, and on long chips a crystal rod in a
    cradle. Its traces are light pipes. What glows is its own output,
    `arcana`: the chain powers it (×13), blurs it, screens it cyan with a
    violet halo, and scatters gold sparks along it.
  - An old look's Era is rescaled ×0.75 (format 4), so a board saved at the
    old Magitech is Atomic still.
  - **The poem kept clear** (Ruby): The Poem's lines go into Keep Clear set
    to "cutting it away": the board is routed as ever, then what lies under
    the lines is lifted (a cut trace ends in a via). The chain says
    `poem: 'lines'`, so it is given the layout as whole lines rounded to
    1/64 (`poemLines`): typing inside a line draws nothing again. A trace
    keeps its own `id` through the cut (its data pulses and era hash by it).
    A structural fingerprint change (an extra canvas) with identical pixels
    is accepted only after proof (a pixel comparison with HEAD) that no pixel
    moved.
- **Contour Map:** Terrain → Contour Lines (any gray map's isolines), inked
  by Mix over the Light Engine's hillshade.
- **Crackle** (Fractured Glaze, chain `crackle`):
  - Tarbell's Substrate on an ID grid: a crack stops at another's cell or
    its 4-neighbours.
  - Polylines, not chords.
  - The old crazed glaze is `crackedglaze`, hidden.
- **Deep Field** is two requests (`astral_fog`, `astral_stars`). Its Glow
  Hue rides on `astral_stars`.
- **Easter eggs** (Ruby: "Easter eggs should include Saturn", and Enceladus and
  sci-fi "peppered into various surfaces and generators when it makes sense as
  a rare Easter egg"; Saturn is Ruby's favorite planet, Enceladus its moon).
  Rare, and decided by a stream of their own (`seedChoice(seed, '<name>')`),
  never the texture's own: a picture without an egg draws exactly as before.
  The painters are shared (stepsWhimsy.js): `paintSaturn` (bands, rings with
  the Cassini gap, the night side, the globe's shadow on the rings, the rings'
  in front) and `paintEnceladus` (white, tiger stripes, the plume).
  - Painted Ringworld: one ring in four orbits Saturn (The Arch's Saturn), and
    now and then Enceladus beside it; otherwise the far planet is sometimes
    Saturn. Ringworld likewise (Ringworld View's Saturn).
  - Starfield's small Saturn follows its Atmosphere: in space a ringed disk,
    under air (Aurora's) a faint point (Ruby: "much dimmer and fainter").
  - Starfield: about one sky in thirty-six, a small Saturn among the stars
    (Aurora, Ring in the Sky, the Painted Ringworld and any graph with one).
  - Circuit Board's Markings: a stamp now and then speaks of Saturn, Enceladus
    or the old stories of space, by its era (`CIR_SPACE`), and a little
    picture is Enceladus (`CIR_ENCELADUS`).
  - Cartomancy's rare cards (Saturn, Enceladus, the Kitsune), the stitches
    Saturn and Enceladus, the seed words.
- **Dream Bloom** is a thin-lens camera (50 mm f/1.8): its blur is a real
  convolution.
- **Flow-Field Ink:** Flow Lines (Jobard–Lefer spacing). An Angle Map input
  bends it by any gray map.
- **Grown & Generated** (stepsGenerative.js): between a plain pattern and a
  scene. A process is simulated, laid on a material, and lit.
  - **Lichtenberg Figures:**
    - Discharge (Kim–Sewall–Lin fast Laplacian growth) → Burn into Wood →
      Light Engine.
    - One, two or three poles (Ruby chose this first growth over one whose
      poles always joined).
    - It grows as it always did; Reach and Slide place it.
    - The camera dial is the ground camera (`groundCam`, a pinhole camera
      on the page's plane, with zoom), wired into the material and Discharge
      both. Turn 0 and View 0 are no camera at all. Past the page's top the
      rings straighten (they never close round the pith), and far rings and
      channels fade rather than shimmer.
    - The light dial is only the light; Strike Angle (a slider) is where
      the strike enters. Materials: Charred Wood, Slate (fixed grays),
      Brass, Acrylic; Depth cuts the channels; the Glow Hue (black: none)
      lights them as if they still burned.
  - **Ruffled Growth:** Differential Growth (on a spatial
    hash).
  - **Positioning:** generated textures take Zoom and Slide (along the
    dial's axis).
- **Knotwork:** Cromwell's construction.
  - Cells sit at odd doubled coordinates, crossings at edge midpoints.
  - Boundary edges and hashed symmetric breaks become turns.
  - Crossings alternate over and under.
- **Painted Landscape** (chain `landscape`, canvas): Painted Sky → Painted
  Ridges → Watercolor Bleed.
  - `landScene(seed, …)` is the shared scene.
  - Color keeps the grey painting's value and sets only its hue
    (`landPalette`). Color 0 is exactly the grey of before.
- **Painted Ringworld** (chain `ringpaint`, canvas, stepsRing.js; Ruby: "a
  generative art piece that still looks like being on a ringworld … the same
  logic as the 3D generator but 2D", and of the flat style, "simplified, but
  cosmic"): Starfield → The Arch → Land on the Ring → Oil Paint (Paint 0: the
  flat shapes alone).
  - Both parts see through Ringworld's own camera (`ringCamera`, from
    `ringParams`, so the 'ring' guide shows the shot; `curved` draws it the
    same way) in a **stereographic** projection: a pinhole draws the arch, a
    great circle through the eye's plane, as a straight line; the painter's
    curved perspective bows it across the sky. `proj` returns the depth that
    sizes things there (F over it is pixels per ring unit).
  - **The sun is placed by the light dial, in the world** (Ruby: "the light
    dial sets the sun position consistently and independently from the ring
    rotation"; `ringSunDir`): its way round is the dial's direction, read as
    the camera's Turn reads (so the two dials agree, and turning the camera
    turns past it); its height the dial's reach (the middle overhead, where
    it is the ring's own star on the arch; the rim the horizon; past it
    night, and no sun). The land's facets and the painted things are lit
    from its side of the screen and from above as it rises (`V.sun.LT`,
    `V.sun.sd`); Saturn takes its light from it. The shadow squares and
    `L.side` still make the arch's days.
  - One world for both (`rgView`): the land's heights (`rgTerrain`: ridged big
    octaves, ranges at the walls' feet, flatter in cities, terraced by the
    builders), the sea below the camera's ground, the biomes by world
    coordinates (`rgGround`), the camera standing on the land (`Px` lifted by
    its height). Far land is drawn up to 3.2× taller than it is (a painter's
    exaggeration), its colour by its true height (`T.true`).
  - **World** (`RG_WORLDS`, `RG_PROF`): By the Seed, Wilds, Cities, Neon,
    Builders, Magic, Ruins, Mixed (three, region by region). Each world's
    weights say what it raises; its ground, its lights (the page's accents for
    Neon and Magic, through two Accent parts: `ringpaint` is colorKeyed), its
    air's tint.
  - The land is 16 ridges at distances growing from your feet to the walls'
    feet, each a cross-section of the terrain: a wash (lit crest, deeper
    below), facets where steep, a bright rim; on each crest what grows and
    stands (trees, buildings, rocks, grass, by stochastic counts so
    small segments still get their share). The works stand in world cells
    (`cw`), drawn between the ridges they lie between (so hills hide them),
    roads slab by slab; nothing anchored is drawn larger than it can be seen
    whole (`big`), and spans only where they are far and seen along.
  - **Saturn** (Ruby: "Ringworld should sometimes be orbiting Saturn"): by the
    seed (one ring in four) or The Arch's Saturn setting, the ring orbits it as
    the old games' rings orbit their gas giants, and Saturn hangs huge in the
    sky beyond the far arch, lit from the ring's star (`paintSaturn`), drawn
    before the arch and its air so they pass in front; now and then Enceladus
    beside it. It takes the far planet's place.
  - **Small life** (`rgSmallLife`; Ruby: "insects, fairies, flowers, slime
    creatures … all subtle", in place of the little creatures): on some rings
    (`lively`), a few finds (more with Life), each on its own ridge whose crest
    is in the frame and near enough to see, nearer ones likelier. A ridge offers
    eight places across the frame; once it is painted their pixels are noted
    (`rgSpot`), and at the end the find goes to the first place nothing nearer
    has covered since, drawn on top (the forest of a ridge below the frame rises
    over most of the land; `rgSame` allows a passing glow). The kind is by the
    world (fairies in magic, slime in ruins); every mark has a floor in
    canonical pixels. Each find draws from its own stream (a seed rolled when
    it is chosen), so whether one is seen never changes another: a preview and
    its export show the same finds, though where a nearer edge passes close by
    one may stand at another of its ridge's places. A picture without small
    life draws exactly as it did.
- **Particles** (First Snow, Burning Mana, Euphoria Dust) draw under
  `withSeed(ctx.seed + Scatter·7919)`. This keeps them pixel-identical;
  Euphoria is a perfect preset.
- **Poured Wax** (chain `wax`): Pours (Splatter after every pour's draws) →
  Meniscus → colour by thickness → Light Engine with Translucency → Glow
  Hue screened where thick.
- **Ring in the Sky** (chain `skyring`; Ruby: "a beautiful background layer
  … that simplified, but cosmic"): Starfield → Ring in the Sky (stepsWhimsy.js
  `paintRingSky`) → Oil Paint (Paint 0). The ring is an annulus opened by
  View and a ribbon closed by it, so its band keeps its width edge-on and
  face-on; its far arc in blocks three across with blocks of cloud, the halo
  of the air it holds one wide faint stroke. The camera guide is 'ellipse'
  (Star Height from the knob keyed `height`). Land of Shapes, made for its
  first painting, stays an Athanor part: wired after it, a land beneath.
- **Ringworld** (chain `ringworld`, Sky & Cosmos; Ruby: abstract, lit by
  its star; the camera dial the camera, the light dial the day):
  - Ringworld View (`genRingView`) follows each pixel's ray to the floor, a
    rim wall, the star, the shadow squares or space, and hands on MAPS (along
    and across in band widths, distance, detail, daylight, air). It draws
    nothing; Noise at Coordinates lays the land and clouds on those maps.
  - The camera dial is the camera (turn: where you look round the ring;
    view: how far up; zoom: the lens). Where across the band you stand is
    the seed's (`ringPlaceOf`, the part's Stand set to "where the seed
    says"; an Athanor graph keeps Stand At).
  - **The eight sliders** (Ruby kept eight; format 5 turned Stand At into
    Traffic): Band Width, **Landforms** (the relief, the rim walls at half
    its range, the spill mountains, and the land's own forms), Seas,
    **Cities** (the works' amount as Structures was; past 25 `moreCity`
    spreads city cover and towers whoever built the ring), Atmosphere,
    Builders, Altitude, **Traffic** (ships ×0–2.5, its middle the old count;
    past it lanes of small craft; the streets' lamps).
  - The light dial is the day (`caps.dial: 'Daylight'`, `lowLight`): its
    height is the time (the middle noon, the rim dusk, past it night), its
    direction which side dusk comes from (`L.side`). The part maps it onto
    Daylight (the slider is gone; old looks: format 4). The Light Engine
    takes its own light height from Daylight Here, as the star never moves.
  - Daylight places the shadow squares: 0 midnight, 50 the dusk line, 100
    noon. The haze is lit by the day where the camera stands; stars fade by
    day.
  - **Builders** (the sixth slider: By the Seed, Wilds, Engineers, Cities,
    Magi, Ruins; `RING_WORKS` weights per builder). Everything of theirs is
    a primitive in `L.prims` (beams, ship ellipsoids, crystal octahedra,
    pillars of light, circles, trails, engines), each count and size from
    the seed's own stream (`ringRand`), sizes power-law so a few are huge.
    Cities are a third map (`ringCity`: blocks by day, lamps and windows at
    night). The shadow-square size (`RING_SQS`) and the ring's spin
    (`L.side`) come from the seed too.
  - Rays test only what lies in their 16-pixel tile (`ringBin`): a long
    thing is binned by its two ends' projections (clipped to the near
    plane) widened by its width, the rest by a bounding cube. Looking
    straight up once took 1.7 s; keep the binning when adding works.
  - Clouds are their own crossing of a layer just under the air
    (`Rc`), with their shadow laid on the far land (outs 21–24).
  - **Arches** (Ruby: "as if they contain the atmosphere", then "only in
    some designs … only always edge to edge"): every ring raises one or two
    forms, by its builders (`RING_ARCHES`): spans from wall top to wall top,
    each holding a field (`k: 7`, a glow in its plane, brighter edge-on and
    along the arch); flying buttresses in rows (a quarter ellipse from under
    a wall's top to a pier); arcades on piers with a deck, along the ring or
    across it; gates; the land's own stone arches (rock, heaviest at the
    feet). All are tubes of thick beams whose joints overlap (`tube`). Domes
    of glass (`k: 8`, glow only, the rim catching light) stand over the city.
  - **Nothing floats but the ships** (Ruby: "artistic cohesion, nothing
    floating"): crystals grow from the land in clusters, sunk a third; a
    standing ring of light rests on a stone plinth; a ruin's arch breaks in
    its middle and stands as two stubs (`brk`), never a loose piece; the
    floating isles are gone. Nothing stands where the camera is, nor looms
    over it (a tower, mesa or stone closer than its height; an arch about
    it): seen from under them, with their feet out of the frame, they read
    as slabs in the sky.
  - **The Forerunners' way** (Ruby: Halo, "push it more that way"): the
    Engineers' lights are blue; rim towers stand on the walls' tops (`rt`),
    and bars of hard light run from wall to wall (`br`, a `k: 3` glow with
    `even`).
  - **Landforms** (`RING_LANDS`: alpine, mesa country, boulder fields,
    hoodoos, karst, mixed, by the seed): ranges along both walls' feet
    (Ruby: "better landforms around the border mountains": a peak with two
    lower shoulders and foothills before it, never above the wall's top),
    peaks (cones, snow on the tall ones), mesas and pinnacles (beams with
    `cap`: the ray meets the flat top too), boulders (rock ellipsoids, half
    sunk, never larger than a tenth of their distance), the karst's stone
    arches. Rock works hand on `rock` and `snow` (outs 25, 26) and their own
    Across (`ac`: where they stand, rising with height), so the land noise
    lays stone on them; the chain mixes the walls' metal toward rock by it.
  - Corner rays are shared between pixels for its edges; keep `Math.hypot`
    out of its loops (it was a third of the time).
  - **The construction** (`ringBuild`, from the seed; Ruby: never bare):
    spires (tapering towers along each spot's own up, beacons at their tips),
    scaffolding (unfinished floor: a lattice box-filtered by the pixel's
    footprint, the void seen through it), spill mountains (in the chain:
    Across → Map Range → × the land → added, by Landforms). Cities raises the
    builders' works;
    at 0 a few still stand. About one ring in fifty shows the world's seam.
  - **Saturn** (Ruby: "Ringworld should sometimes be orbiting Saturn"; one
    ring in four by `seedChoice(seed, 'ring saturn')`, or the part's Saturn
    setting): `ringSaturn` fixes it in the world where the opening shot
    (turn 40, view 55) looks, a little off by the seed, 6–11° across;
    `ringSatSee` meets each space ray with its globe (banded by latitude, lit
    by the star at the ring's middle, the rings' shadow on it) and its ring
    plane (`RING_SAT_BANDS`: C, B, the Cassini gap, A and Encke's; the globe's
    shadow on them), and now and then Enceladus. Outputs 27 and 28 (saturn,
    saturn cover); the chain mixes it over the stars (part 100), before the
    shadow squares and the air.
  - The air is sampled densely where it is (near the camera, near the far
    floor) and thins away past the walls; an even spacing stepped past the
    thin air beside a low wall and left a black band.
- **Rain on Water** (chain `rainwater`, Weather): Raindrops → Tint (sky to
  water by distance) → Displace by the ripples → Material → Glow on the
  splashes.
  - Drops are hashed per ground cell, so more Rain adds drops and moves none.
  - Each drop is laid only across its ring's band, row by row, under a
    perspective camera (View, the fifth knob, tilts it as the Perspective
    part does).
  - Rings finer than a pixel (far off) calm rather than flicker.
- **Rain on Glass** simulates on the EXPORT's grid at every size, then
  scales. A chaotic simulation fed sizes that differ by a fraction drifts
  apart. Its part shows the page through the drops, so a graph holding it
  is given the page's colors (`graphUsesBackdrop`), as one with a Page
  Backdrop is.
- **Scattered Polygons** (chain `metalleaf`): Flakes over any base. At 0 on
  Shape, Sheen and Glitter it draws exactly the original flakes.
- **Sleep Haze** (chain `clouds`): Smoke → Light Shaft (a Dial port) → Dust
  Motes.
- **Stained Glass** (chain `stainedglass`, grid at div 3):
  - Panes (lead, edge, pane number, palette slot, window, joints) → Stained Glass (the part).
    A pane's look comes from its number.
  - The Window setting: None · Lancet · Arcade · Round (Round kept at the top
    of the slider).
  - Outside the outline is border glass, never stone.
  - The lead is flat and dark, soldered at the joints.
  - The extra knobs draw nothing at 0, and the Scene is evaluated only when
    above 0.
- **Turing Skin:** Turing Pattern (Gray–Scott) → Map Range → Light Engine.
  The old Reaction–Diffusion part stays for old graphs.
- **Under Glass** (chain `underglass`, Materials & Craft; Ruby: a glass to
  lay over another surface): Window Reflection, Scratches, Smudges and
  Shatter → Glass Pane over mid-gray (stepsTouch.js, `ug…`).
  - The Glass Pane adds what the glass catches as a screen does, so with
    every knob at 0 the texture is exactly 128 (chains.test proves it) and
    any overlay blend leaves the page alone. Screen adds only light; Hard
    Light also darkens, and works on dark pages (Overlay and Soft Light are
    weak there).
  - Refraction needs what is under the glass, so it happens only in a graph
    (the starter A Picture Under Glass: Texture from the Menu into the
    Pane's Picture). Two Surfaces is a blend: no bending.
  - Scratches glint where they lie across the way to the light's own
    reflection (`ugUnit`: the page's middle overhead, toward the light as
    the dial is drawn out), so swirls ring the light.
  - Each scratch, print, spot and speck is its own `mulberry32` draw: more
    of one adds and moves none. Fingerprint ridges finer than the grid fade
    into their smudge (a preview shows smudges, the export ridges).
- **Broken Glass** (chain `brokenglass`, Materials & Craft; Ruby: "glass
  fragments laying on nothing"): Glass Shards (stepsGenerative.js, `gs…`)
  over mid-gray.
  - Shards are polygons of 3–5 corners, power-law sizes, heaped about one
    to three piles and flung wider (and some anywhere) as Spread rises;
    each its own `mulberry32` draw. Each is evaluated per pixel by its
    signed distance (`gsDist`) through a uniform grid of cells.
  - A face flashes where its tilt lies between the light and the eye; the
    edge band is split per colour channel (dispersion) and clear glass's
    edge is green. The caustic is the shard scaled toward its middle and
    cast away from the light by its lift, brightest at its rim, inside a
    pale shadow.
  - The camera dial is the ground camera (`groundCam`); with a Picture the
    shard bends it by its tilt (A Dropped Frame starter, over Aurora).
- **Dewy Webs** (chain `dewwebs`, Weather): Dewy Webs (`dw…`) → silk, dew
  and glints screened onto mid-gray, the drops darkened round.
  - Orb webs: frame and anchors, spokes, a hub mesh, the sticky spiral from
    a free zone out to the frame, sagging between spokes; tears remove a
    patch of spiral across some turns and leave loose ends hanging.
  - Dew beads only where a wet thread would (Plateau–Rayleigh: a drop and
    often a small satellite), larger low in the web; each drop a lens: a
    point of light toward the light, a crescent on its far side.
  - Silk glints by how far it runs across the light's way (`across³`), in
    colours by Iridescence (`dwHue`). Line and drop floors are canonical
    pixels (`E.px`): a thread finer than that fades.
- **Veins of Light** (hidden): Growth Medium (strata, pebbles, sand, fibres, skin; its
  "ways") → Tendrils (Runions' space colonization, steered into the ways).
- **Watercolor Wash:** Washes → Pigment → Pigment (any gray map laid as
  watercolor).
- **Two Surfaces** (the surface layers, appEvents `SURFACE LAYERS`): one set
  of controls edits whichever layer the layer bar shows; the other waits in
  `state.layers.other` under the same keys (its locks, reading and
  hue-following beside it).
  - A look saves the upper under its own keys and the lower as `baseLayer`
    (`baseLocks`), whichever is shown. `exchangeLayers` trades the controls
    with the waiting layer; Swap is that, kept as a step.
  - The renderer draws both with `drawSurfaceLayer` (the lower in the `base`
    slots): the shown one from the page (`surfaceFromDom`), the waiting one
    from `setSurfaceSource`. The report (§Surf…) always tells of the upper.
  - Every blend for every layer (`SURFACE_BLENDS`: the canvas's own and the ⚡
    ones mixed per pixel by `boxBlend`). A grey surface is made on its blend's
    neutral ground (`blendFamily`); `textureGround` keeps an older look's
    ground until its blend is changed.
  - A new lower starts as Waking Grain on `seed ^ 0x5bd1e995`. Presets clear
    it (unless something of it is locked). Old looks' `baseType`… keys become
    `baseLayer` in `retireBaseLayer`.

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
- **A layout grown by chance on its grid follows the grid's rounding**
  (Ruby: the saved Circuit Board was not the preview's). A preview's grid
  can be a row taller than the export's in proportion (the canvas and
  `ceil(w/div)` both round), and a board routed in whole cells, cracks
  walking pixel by pixel, frost colonizing its room or growth on the
  grid's shape then grow another picture. Such parts grow on the EXPORT's
  grid at every size and are drawn scaled: the request carries the page's
  export size (`page`, from `setRenderScale(s, page)`; keyed `_p`, only for
  a surface holding one of `PAGE_PARTS`), `ctx.page` is the export's grid
  for a chain's own grid (`gridAtExport`), and `pageGrid(ww, wh, d)`
  (texCore) gives it to a whole-texture generator. At the export nothing
  changes. A new part that grows by chance on its grid joins `PAGE_PARTS`.
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
- **A heading opens and folds its section itself** (`headingTaps`; Ruby, in
  Firefox on a phone: tapping Border Options did nothing). Firefox on a
  phone moves a tap that lands on something it thinks cannot be tapped to
  the nearest thing that can: a `<summary>` whose only listeners were on its
  eye, die, lock and ⓘ lost its own taps. Every `details > summary` listens
  for clicks, cancels the browser's toggle and toggles once; a tap on its
  own controls is left to them. A `<details>` made later (the chooser's
  groups) does the same through `headingTaps(root)` if Firefox misbehaves
  there too.

- **Drawflow's `[df-…]` lookups are escaped** (forge.js wraps
  `querySelectorAll` with `CSS.escape`): a wire's range is kept as `'~key'`
  in a node's data, and Drawflow finds data as `[df-KEY]`. Unescaped, a graph
  carrying a range threw mid-load and opened half-built.

**Tests and tools**
- The Node canvas mock has no `Path2D` or `isPointInPath`, and doesn't parse
  `innerHTML`. Build elements with `createElement` if the tests boot that
  code.
- In the DOM mock nothing is ever on screen: the preset tiles don't paint at
  boot (`IntersectionObserver.showAll()` paints them). Painting them made
  every boot take 12 s. Selects have no `options` unless a test gives them
  (locks.test gives the texture menu the page's).
- **`pkill -f name` matches its own shell** (the command line holds the
  name) and kills the command running it. Match with a bracket:
  `pkill -f "[c]ss-prune"`.
- **A pipe's status is its last command's:** `sh test.sh | tail -1 && git
  commit` commits on a failure (a release once shipped with a red suite).
  Check the words: `sh test.sh > out; grep -q "suites passed" out && …`.
- **`css-prune.py --write` outlasts a 10-minute command:** run it in the
  background and read its log; don't build while it runs.
- **Never `git stash` to compare with HEAD.** A long test inside a stash
  that times out leaves the work stashed. Use a worktree:
  `git worktree add <scratch>/wt HEAD`.
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
- The light dial is ☉ at rest and grows 🜚's spike as it is pulled. Its
  second handle, the rim light's, is a smaller dot in the second accent
  under the first, hollow while off; where the two overlap they mix to
  white (black on Vellum). ☉ Main / ◐ Rim above it choose which the finger
  moves (each button's dot its handle's colour), as Upper and Lower do.
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

**Three voices** (Ruby).
- **The Athanor teaches.** Its wiki, part pages, menus and teaching notes are
  for an adult who may never have used a node editor, and should leave them
  able to (a skill that carries to Blender, Substance, Filter Forge).
  Filter Forge's help is the model: key facts, worked examples, links
  between pages.
  - Informative and approachable; technically correct; never talking down,
    never cynical, nothing that reads as generated filler.
  - Organized like a wiki: concepts explained once in their own article and
    linked from everywhere else ("What is a picture?" has an answer).
  - Shortening is not the goal; teaching is. Say what a thing is, why
    you'd use it, and one thing to try.
  - Part and setting names are plain and correct ("Black Point", "Cutoff",
    "Simple Lighting"); menus say what each action does in a hint.
- **Help elsewhere in the app** (tooltips, hidden help) is clear and
  instructive.
- **Flavor text** (names, headings, lore, the welcome, empty states) keeps
  the app's voice: witchy, symbolic, metaphorical, astral. Flavor never
  replaces the instruction; it sits beside it.
- **The right verb for the hand:** click with a mouse, tap on touch; hold on
  touch, right-click on a desk (forge.js `forgeClick`, `forgeHoldWord`).

**Language.**
- Ritual and arcane, but readable: someone who doesn't code must understand
  every control. When flavour and clarity conflict, clarity wins ("Script
  Highlighting", not "Illuminate the script").
- Names must be honest: describe what a thing actually does.
- Vary the vocabulary: three "…Drift"s was a failure.
- **Dialogs** say what each button does, plainly (Ruby approved, from the
  usability review): *Save Look* / *Cancel*, *Delete* / *Keep*. The flavour
  is in the title ("Tear out this page?"). Confirm on the left, cancel on the
  right; a dialog with nothing to cancel has one button.
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
- **Don't replace what Ruby loves without asking; add beside it by
  default.** A texture Ruby liked keeps its exact look at its defaults: a new
  idea becomes a knob, or a new texture. A better or faster method may
  replace it once Ruby approves the test renders (§8).
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
  or Ruby has answered it, delete it; don't edit it into a history (§3, step 6).
- Hand-editable text lives in `strings.js`; hand-editable numbers in
  `tunables.js`.
