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
9. [Texture notes](#9--texture-notes) (in docs/surfaces.md)
10. [Pitfalls we hit](#10--pitfalls-we-hit) (in docs/pitfalls.md)
11. [Design language](#11--design-language)
12. [Working with Ruby](#12--working-with-ruby)

Related files:
- **ROADMAP.md**: what to build next, in four stages.
- **OPEN-ISSUES.md**: open items only.
- **CHANGELOG.md**: the newest twenty releases (older ones: docs/changelog-archive.md).
- **docs/**: the long reference, read when you touch its subject: light.md, ui-machinery.md, athanor.md,
  surfaces.md (each surface's notes), pitfalls.md; SIMPLIFY.md; prior-art/ (the research behind each surface);
  renderer-pass.md (every surface onto the new renderer) and scene-ideas.md (scenes to build), both ROADMAP Stage 3.
  ring-ideas.md: the Ringworld's idea book, every idea toward the game it may become.
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
    behavior and invariants (§8 Add a test). Every few releases, review the
    tests (§3 step 6); the hygiene test checks the changelog says it
    happened.

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
node build.mjs --next     # advance release.js to the next name (moon, then star) — once per shipped release (and archive the changelog past twenty releases)
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
node tools/review.mjs a,b [--ref HEAD]           # the standard review sheet: readings, seeds, the light turned, the camera moved (every round, the same)
node tools/prune.mjs                           # what has gone unused: names, strings, CSS, fixtures, tools (test/hygiene fails on any)
python3 tools/css-audit.py                     # which CSS declarations never win, in any state (desk, phone, tabs, Athanor, themes)
python3 tools/css-prune.py [--write]           # remove those, verified: no drawn element computes differently in any state
node tools/make-murmur-studio.mjs              # rebuild tools/murmur-studio.html from its template and murmur.js
node tools/ui-profile.mjs [rate] [out]          # the interface on a slowed phone: idle, typing, sliders, selects (PERFORMANCE-AUDIT §0; needs Playwright)
node tools/still.mjs [surface|all]             # sweep every slider on a phone: does anything on the page move? (Nothing moves under a hand, §11)
node tools/smoke.mjs                           # click every kind of control, desk and phone: any page error? (after UI work; needs Playwright)
node tools/phone-shot.mjs out.png [--tex t] [--tab page] [--at id]   # the built page on a phone: look at a change before shipping it
node tools/snapshot.mjs [repo] <out>            # the registry as data (chains, starters, sliders, caps, parts): cmp before/after a refactor
node tools/gpu-ab.mjs [repo]                     # GPU lighting, a GPU pass and the box's glass on software WebGL: diff before/after (needs Playwright)
SHIP_TRAILER='…' sh tools/ship.sh               # build, every suite, commit with the release notes (+ the session's attribution) and push main
```

The site must work **both built and unbuilt** (served straight from the
source files). Deploy is the whole `dist/` folder: the page, `sw.js`,
`manifest.webmanifest` and `icons/`. The service worker must be its own
file, or the app won't install or work offline.

---

## 3 · A pass, and shipping a release

One pass of work ends in one release. Releases are named for moons
(`release.js`): Jupiter's, Saturn's, Uranus's and Neptune's, each in order of
distance from the barycentre; after Neptune, for stars (Ruby: "star cluster →
member, sorted by distance from earth"): `CLUSTERS` in build.mjs, the nearest
cluster first and its members nearest first (docs/prior-art/star-cluster-names.md).
The name is written `Saturn–Pan` or `Ursa Major–Merak` with an **en dash**,
because a slash would split a PML segment.

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
   the hood** (the hygiene test looks): the tests at least once in every five
   releases. (The stylesheet prune is no longer a standing step; run
   `tools/css-prune.py` when the stylesheet is touched.)
   - *reviewed the tests*: read the suites against §8 Add a test; delete
     what tests a retired thing or an implementation, merge what repeats,
     move a check to the suite of its concern.
   **No feature branches** (Ruby, 2026-10-20: "I usually don't make separate branches for every little feature"):
   work happens on `main`, committed locally; pushing is the release. Visible new work is shown to Ruby as sheets
   before the release that carries it.
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
| `appEvents.js` | the entry point and the UI's WIRING: every listener and every call made as the page starts, in the order they run, section by section; the values made by running something (`vault`, the controls found by id) and the variables more than one section sets. Generic bindings (`PERSISTED`) |
| `uiState.js` | the app's state: ONE object (`state`) |
| `uiSkins.js` | the surface's controls given skins: knobs and faders drawn as the dials are (a knob turns by the angle a finger sweeps round it, a fader by up and down), the display line (name, value, − / +), haptic ticks, and the rack's rule (`rackPlan`: rows for three or fewer; faders for the sliders with marks, knobs for the rest; a slider's `as` overrides). The native slider stays beneath each skin |
| `uiLook.js` · `uiLocks.js` · `uiLayers.js` · `uiSurface.js` · `uiDials.js` · `uiLayout.js` · `uiHistory.js` · `uiGuard.js` · `uiAthanor.js` · `uiControls.js` · `uiWorking.js` · `uiMoving.js` | the UI's functions and tables, split from appEvents.js along its section banners: a look saved and restored, presets and the lit look · locks, master locks, dice, linked controls · the surface's two layers · its sliders, tools, readings and menus · the light and camera dials · page size, preview scale, pan and zoom, tabs, phone layout, focus mode · undo, redo, the filmstrip · asking first, toasts, the draft · the Athanor in the page · the editor, effects, border, moon, frame, seeds, theme, sounds, Grimoire · what's working · the Moving Image sheet. **Declarations only**: nothing in them runs when they load (a listener or a call goes in appEvents.js, where its section is), so they may name each other and the entry freely. Tests read them all as one (`uiSource()`, test/harness.mjs) |
| `canvasRenderer.js` | `render()`: backdrop, texture, vignette, box, border, text, credit, spell. Also the poem's layout (`TEXT_LAYOUT`) and Text Clearing |
| `textParsers.js` · `pmlVars.js` · `effects.js` | PML → lines and segments (`buildLines`) · `§Variables` and named styles (`§style`), resolved before PML parses · the text effect stack and `/fx:` |
| `stitches.js` | decorative motifs along any path (rules, borders, seams, inner edges) |
| `boxFx.js` | the inset box's glass and GPU blends |
| `chooser.js` · `swatches.js` | the surface menus shown as tiles (thumbnails kept in localStorage `uv.thumbs.v2`, each with a stamp: its surface's fingerprints, written into release.js by the build, the look it wears and the painter; only a changed surface is painted again) · the painted preset tiles |
| `appOptions.js` | fonts, presets (`PRESETS`, `PRESET_GROUPS`), aspects, the welcome poem |
| `strings.js` · `tunables.js` | every user-facing string · hand-editable numbers |
| `spell.js` · `vault.js` | glyph spells · saving, sharing, the Grimoire |
| `altText.js` · `jpegMeta.js` | the saved image's alt text (the poem, then the look in words, ≤1500) · written into the JPEG as XMP |
| `moving.js` · `uiMoving.js` | the Moving Image (a long press or a right-click on Save image opens its sheet): a look eased toward another (`blendLooks`), and the MP4, WebM and zip written byte by byte (`mp4Parts`, `webmBytes`, `zipParts`) · how far along its move a frame is (`moveAlong`: evenly or eased, once through or there and back) · the sheet (four groups of radios: move, length, size, output; the rows a move doesn't use dimmed in place), and the frames drawn offline and encoded by the browser (WebCodecs) in `makeMoving`. Its listeners are in appEvents.js |
| `glyphs.js` `moon.js` `fonts.js` `palette.js` `theme.js` `pwa.js` `editor.js` | inline glyphs, moon phases, lazy fonts, theme palettes, installability, the PML editor |
| `murmur.js` | soft interface sounds (off until turned on) |
| `runology.js` · `symbolLore.js` · `seedWords.js` | Ruby's Runes of Power · Symbology's glyphs and names · seeds as phrases |

**Surfaces (textures)**

| File | Role |
|---|---|
| `textureParams.js` | every surface's sliders (`TEXTURE_PARAMS`): `sliderOf(key, label, def, { min, max, unit, ticks, names, dice })`, 0–100 and no unit unless it says |
| `textureGenerators.js` | the registry (`TEXTURE_CAPS`: what each can do; blends as `GREY_BLENDS`, `LIT_BLENDS` or `ledBlends(first, set)`), dispatch (`CHAIN_TINTS`: which hues a chain is handed), the cache and its keys |
| `textureService.js` · `textureWorker.js` | textures made off the page's thread |
| `webgl.js` | the one way WebGL2 is opened: `glOpen` (a context, or null on none or a software emulator) and `glProgram` (a quad drawn by a fragment shader). The worker's lighting and GPU passes share one context |
| `texCore.js` | shared maths: seeded random, noise, `pixelPass`, canonical pixels, `lightHeights` (the lighting engine, CPU and WebGL2), FXAA (`fxaaImage`), the steps' kit |
| `texWhimsy.js` `texSharpness.js` `texChaos.js` `texTouch.js` | the older generators, one file per element (being taken apart into steps) |
| `textureElements.js` | each texture's four readings (🜂 🜄 🜁 🜃), one of them its default |
| `cartomancy.js` · `cartomancyTable.js` | Cartomancy and its parts · what else is on its table (bundled BEFORE cartomancy.js) |

**The Athanor (the node editor)**

| File | Role |
|---|---|
| `steps.js` | THE PARTS: the general library (`STEP_PARTS`, each part one object) and the merged `STEPS` table. Also The Poem, curves and Filter Forge's primitives |
| `stepsTouch.js` `stepsChaos.js` `stepsWhimsy.js` `stepsLight.js` `stepsSharpness.js` `stepsGenerative.js` | each family's own parts, and the older textures as whole parts (`kitWhole`) until they are taken apart. Generative: Discharge, Wood, Burn, Differential Growth, Knotwork, Growth Medium, Tendrils, Circuit Traces. Light: the Light Engine, Oil Paint, Canvas Weave, Paint Swipes. Touch: also the glass (Scratches, Smudges, Window Reflection, Shatter, Glass Pane) |
| `floraKit.js` | what Bloom and Specimen share: the colour helpers (`flCss`, `flMix`), leaf outlines (`SPC_SHAPES`, `spcBlade`), leaves of every kind (`spcLeaf`), each species' leaves (`SPC_LEAVES`, `SPC_STEM_LEAF`), stems with hairs or prickles (`spcBand`) |
| `stepsFlora.js` | the floral surfaces' Bloom (`FLORA_STEPS`): a flower of one of 23 species, or a sheet of them, petal by petal, lit from the dial |
| `stepsSpecimen.js` | Specimen (`SPECIMEN_STEPS`): a whole plant of Bloom's species as a herbarium sheet shows it (docs/prior-art/botanical-specimens.md): its habit, leaves by outline, margin, division and arrangement, roots or cut end, its flowers (Bloom's `flDrawBloom`) among buds and seed; one, a sheet, or several laid on the page |
| `stepsGrass.js` | Grass Blades (`GRASS_STEPS`): toon grass blade by blade in two flat tones, by clumps, leaning with one wind and bowed and paled where a gust map says, shrinking to a horizon; a part for any surface with grass in it |
| `stepsImprint.js` | Imprint (`IMPRINT_STEPS`): a specimen's maps (shape; layers, part and height packed in a picture; its colours; the paper's tooth; the page beneath) developed in one of fifteen media, cyanotype to risograph; lays its marks on the page under Normal, on the blend's neutral under any other blend (`ctx.neutral`); hands on colour, height and gloss for the Light Engine |
| `stepsLens.js` | Lens Blur (`LENS_STEPS`): a thin-lens focal plane from a depth map, gathered on a golden-angle spiral (background capped at twice the point's own disc), lights brighter than white first; on the GPU through texCore's `gpuKernel`, else the same gather on the CPU |
| `stepsStreamers.js` | Windward Sea's Streamers (`STREAMER_STEPS`): ribbons swept along 3D paths (gust with a tightening curl, spiral, loop, wave) through a camera level with the horizon, twisted to show both faces; maps only: ribbons, facing, side, depth |
| `stepsScroll.js` | Sunrise Scroll's Scroll Lands (`SCROLL_STEPS`; docs/prior-art/scroll-lands.md): the land by the seed (`scrollLandOf`: Peaks, Misty Peaks, Coast, Snowy North, Bamboo, Village, Great Tree, Cursed), its things standing on the scroll's own bands (their masks in, each crest read off, hidden by the nearer bands); maps only: ink, wash, water, paper, accent, bloom |
| `stepsNetwork.js` | Veins of Light's Network (`NETWORK_STEPS`): a graph with loops (tree + loops, relative, Gabriel, slime, streets, subdivided), widened by flow from hubs, routed organic to circuit; lines, core, order, nodes, pulses, loops, height |
| `stepsRoom.js` | Liminal Spaces' Room Caster (`ROOM_STEPS`): a ray-cast empty interior of eleven kinds, handed on as grey buffers (surface, depth, light, pattern, lamps, water, shade) |
| `paintKit.js` | the painted things (`pkTree`, `pkBuilding`, `pkRock`, `pkStone`, `pkSpire`, `pkMonolith`, `pkDome`, `pkCrystals`, `pkSilhouette`; the small things `pkProp`, the robots `pkRobot`, the nods `pkEgg`, the billboards and signs `pkBoard`), shared by the Ringworld, Ring in the Sky's land and Night City's skyline: flat shapes finished as things in the world (shaded from the sky down, a cast shadow, weathering, materials lit by the scene; docs/prior-art/ringworld-sprites.md), detail only where large, each thing's features keyed to streams of its own (`pkSub`) |
| `wildKit.js` | the wild things (`WK_KINDS`): herds, flocks and single creatures (deer, hares, a fox; rooks, starlings, pigeons; ducks, swans, a heron; a raptor, swallows, swifts, bats, geese, butterflies, dragonflies), each member's place a pure function of its group's seed and the clock (`wkAt`: eras ending in a move, a bolt or a flush, and a drift on noise between, never a loop), and painted in a few flat shapes (`wkPaint`); the Ringworld sows and draws them (docs/prior-art/ringworld-wildlife.md) |
| `landKit.js` | the land of a ring (`lkLand`): heights, seas, climates and biomes as pure functions of the seed and a place on the floor (continents and seas from warped noise, mountain belts under the rim walls, hills, escarpments, rivers, lakes, canyons, a landing where the seed stands you; ten biomes by warmth and moisture, `LK_BIOMES`, blending as widely as Detail asks); its own periodic gradient noise (`lkNoise`); the Ringworld lays its mesh on it (docs/prior-art/ringworld-terrain.md) |
| `regionKit.js` | the regions of a ring (`rkRegions`): the floor parted into named regions (a jittered grid's Voronoi cells, their borders wandering, round the ring), each held by a faction with its banner (`RK_TINCTURES`, `RK_DIVISIONS`), each its world on a Mixed ring and its element in the magic world (`RK_ELEMENTS`, Runology's Primal Archetypes); names and town names from the seed banks (docs/prior-art/ringworld-regions.md) |
| `stepsCloth.js` | cloth (`CLOTH_STEPS`; docs/prior-art/cloth.md): Drape (a sheet simulated as it hangs or falls, position-based as games do it, settled once and kept, `clSettle`; seen in front or from above and rasterized into maps, `clRaster`: height, normals, u, v, gather, the cloth, its back), Weave Maps (threads by a loom's draft at any u, v, fading where too fine: `clWeave`, `clDraft`), Detail Normals (a fine height laid over a normal map) |
| `stepsRing.js` | the Ringworld's parts (`RING_STEPS`): The Arch (`rgPaintArch`) and Land on the Ring (`rgPaintLand`), seen through Ringworld's own camera (`ringCamera`) in a painter's curved perspective, with the Worlds (`RG_WORLDS`, `RG_PROF`) and their painted things |
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
2. the surface: the lower layer first (Two Surfaces), then the upper; a layer that sees through bends what is drawn
   beneath it first (See Through, docs/surfaces.md);
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

### 5.4a · The credit
- The Credit field (`usernameField`) is kept in localStorage (`uv.credit.v1`,
  appEvents) on every edit and filled from it at start (Ruby: "persist
  forever"). It is never part of a look (vault.js `NOT_PART_OF_A_LOOK`).

### 5.4b · A surface's own hues
- Up to six (ROADMAP L0; Ruby: "always use as many user inputs as humanly
  possible and set the defaults to being what I expect them to be"):
  `caps.tints` says how many, `tintLabels` and `tintDefaults` name and seed
  them in order. They live in `SURFACE_HUE_KEYS` (textureGenerators.js):
  the first two are `textureTint1`/`textureTint2`, the four more
  `textureTint9`–`textureTint12` (3–8 are the material, fifth and light
  hues). Requests carry the four as `opts.hues`; a chain's Hue parts read
  slots 1–6 (`chainHues`); a graph shows a picker per Hue slot it reaches.
- A new surface puts every colour it draws on a hue, never a fixed colour.
- **The page shows the hues in three groups** (Ruby), each under a heading
  that hides when none of its hues shows (`syncHueHeads`):
  - Light Colors: Main Light, Rim Light, Ambient Light (tint6, 7, 8).
  - Surface Colors: the surface's own, named by `tintLabels` (First to
    Sixth Hue when it names none), and a Ground or Snow Hue (tint5 when its
    role isn't glow; appEvents moves the row there).
  - Material Colors: Glow Hue (tint5 as a glow), Shine Hue, Shadow Hue.
  - No surface names a colour of its own "Material …": that word is the
    third group's.

### 5.5 · Light
How light works (the dial, the engine, the rig, shine and shadows): **docs/light.md**. Read it before touching light or a lit surface.

### 5.6 · Knobs and colour roles
- A texture declares **2–10 knobs** in `TEXTURE_PARAMS`, read by position as
  `texP1`…`texP10` (Ruby: ten at most, 2026-10-20, where the rack uses the room well). The usual keys are zoom, amt, form,
  shape, hue and tilt; the seventh and eighth are a chain's own (a camera's
  Turn and View, Circuit Board's Era). An Athanor graph's Knob has slots 1–10.
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
How the interface works (tabs, phone layout, preview, locks and dice, undo and the filmstrip, dialogs, the draft, the dials): **docs/ui-machinery.md**. Read it before touching the interface.

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
A part is one object, `{ cat, label, ins, outs, params, cost, io, req, maps, run(E, n) }`, in steps.js's
`STEP_PARTS` or a family's (`TOUCH_STEPS`, …): `cost` its weight (1 if it doesn't say), `io` its port types where
they aren't gray maps, `req: true` if it needs its first input, `maps` its settings that take a map.
- **Its doc and its wiki page:** every part has an entry in
  `athanorWikiParts.js` (`WIKI_PARTS`): `line` (one instructive sentence,
  shown in the parts list and menus: the one copy of the part's description),
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
Graphs (versions, groups, loops, starters, limits), what the Athanor took from Filter Forge, and the editor (forge.js): **docs/athanor.md** (§6.3–6.5). Read it before touching athanor.js or forge.js.

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
  approval.** A texture gaining a capability (moved onto the Light Engine, given
  maps, metallic, displacement) may change its look to suit it — more stylized,
  more fitting — rather than imitate the old picture (Ruby, 2026-10-20). Fingerprints (`test/fixtures/texture-fingerprints.json`) are
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
   - `io` for anything that isn't a gray map;
   - `cost`;
   - `req: true` if it needs its first input.
3. Read per-point settings with `E.map` where the loop allows, and declare
   them (the part's `maps`). A setting that already exists
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
   - Knob nodes as the sliders' legend: `['knob', { slot }]` takes the slider's name and
     default from `TEXTURE_PARAMS` (write `name` or `def` only where the knob differs);
     a wire names a setting by its key (`[1, 1, 4, 'scale']`), the port found on the
     target part;
   - its working grid (`div` or `grid`), or `canvas: true`;
   - each slider bound to the params it drives, across the slider's own
     range;
   - TEACH (what it is, how its parts make it, one "Try:").
3. In textureGenerators.js, give the type its row in `CHAIN_TINTS` (which hues the chain is handed). Delete the old
   generator, but keep its haiku beside the part that inherited it.
4. **Its fingerprint must not change.** If a slider's job did change: bump
   `LOOK_VERSION`, translate older looks in `retireLook`, and update the
   four readings.
5. Render it, time it.

**Add a texture** (and remake one, and answer Ruby's notes on one: the same steps)
0. **Research the prior art for real, first, for anything Ruby asks to be
   generated** (Ruby: "looking up prior art tends to give you ideas for what
   to make, and also how to make it unique"; and, 2026-10-19: "You should also
   look up prior art… You're not really doing that.").
   - Look first where Ruby says the best prior art is (2026-10-20): **game development, art assets, frontend design,
     user interfaces and scientific research** — GDC talks and studio breakdowns, asset-kit and shader write-ups,
     design-system and interaction guides, papers.
   - Research is searching and READING, not remembering: search the web, open
     the sources (papers, photographs and the photographers' notes, artists'
     breakdowns, botany or physics of the real thing, how games and films
     render it), and take what each one teaches. A doc of things you already
     believed, marked [gen], is not research.
   - Write it up in docs/prior-art/ (one file per subject, as
     docs/prior-art/liminal-spaces.md): each claim with its source [src], what
     makes the subject recognizable, how the real thing gets its look (its
     material and its light, not only its shape), the kinds the seed chooses
     among, and what this app can do that the others don't.
   - Every round of Ruby's notes on a surface is researched again: the note
     names what is wrong ("too cartoony", "the Bliss wallpaper"); find out
     what the real thing does instead, cite it, and add it to the doc.
   - Never wait to be asked.
1. Build it as a chain of parts (above), general parts with at most one new
   process part (ROADMAP §2 L, §J). A whole-picture part is not allowed.
   Every colour on a hue input, the seed giving real variety.
1b. **Light it with every map the engine takes** (Ruby, 2026-10-19: "you have
   access to albedo, specularity, and all of these other lighting features…
   Use them!! We built these tools so you could use them!"). Anything with
   form is made as maps and lit, never drawn already lit:
   - **albedo**: the colour with no light in it (no shading, no highlights, no
     outline strokes standing in for edges); the painted look lives here, in
     its brushwork and colour variation;
   - **height**: the true shape (a petal's cup and curl, a stone's bevel, a
     ridge's crest), not one ramp per piece, plus its fine surface (crinkle,
     grain, fibre) — the Light Engine's shadows and occlusion come from it;
   - **gloss**: what shines and what doesn't (a buttercup's wax, a velvet
     petal's matte, a dew drop's mirror, a leaf's satin);
   - **thickness / translucency**: where light comes through (a thin petal or
     leaf backlit, wax, jade, skin), for the Light Engine's Translucency map;
   - and the engine's light: the dial, the rim (second) light, the ambient
     hue. Maps that match one another (gloss and height following the painted
     shapes, as in a painted PBR texture) give a painted picture that is also
     physically right. Render it lit from several sides before showing Ruby:
     a picture that only works from one light was painted, not lit.
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
5. Accept its first fingerprint. Check `scale-audit`. Look at it: `node tools/review.mjs <surface>` makes the
   sheet Ruby reviews (readings, seeds, the light turned, the camera moved; `--ref` adds the before).
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
The non-obvious facts about particular surfaces, alphabetical: **docs/surfaces.md**. Read a surface's entry before changing it; add to it what you learn.

## 10 · Pitfalls we hit
Mistakes made once, so they aren't made twice: **docs/pitfalls.md**. Skim it before a large change; add to it when something bites.

## 11 · Design language

**A spell synthesizer, not a music one** (Ruby). Controls are drawn as the light and camera dials are: thin lines,
glyphs, rings and tick dots; flat, never skeuomorphic.

**Corners, a little blunted** (Ruby, 2026-10-24: "just, like, 2px of rounding … only the ones that make sense to
round"; docs/prior-art/corner-radii.md): windows 3px, controls 2px, small marks 1px, from the `--r-` steps on `:root`
(poetrypress.css, SHAPE); circles stay circles. A group of choices is one shape, blunted on its outside corners only.
What runs to the screen's edge, a line, a picture and the Athanor's ports stay square. Focus rings follow the shape.

**One language for toggles** (Ruby: "my favorite one is the eye"): an **eye** where something is shown or hidden (a
section in its heading, the inscription, highlighting, the spell code, step previews); a **switch** where a feature is
turned on (Text Aware, Rounded Corners, Sound…). No plain checkbox: uiLocks.js's `EYES` and `SWITCHES` say which.

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
  pentagram) · Thoughtforms (Ruby's glyph) · Materia ◈ · Kinesis ☿ (a desk's
  only: the Moving Image's cards) · Esoterica ⌬.
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

**Nothing moves under a hand** (Ruby, 2026-10-20: "never ever add [something] that moves the UI around while, or
immediately after the user has interacted with it"). Anything that appears as a control is used (the display line,
a hint, a readout) keeps its room always and only fades; no panel grows, shrinks or scrolls because a control was
touched.

**Motion.** Minimal: animation mostly advertises how well the browser is
coping. The one exception is the busy shimmer (a texture being made, or a
save), shown only after a moment and replaced by a fade for reduced motion.

**Photosensitivity, in films and everywhere** (Ruby, 2026-10-21: "ALL OF YOUR EFFECTS should be mildly photosensitive
safe … large regions cannot flash for brief periods"). No large region of a picture may brighten or darken suddenly
and come back, not even for one frame: no full-frame flash, ever. Small lights may turn on and off (windows, lamps), but
whatever flickers, pulses or swings runs on a gentle clock (the Ringworld's `rgSwayTime`), never blinking frame to
frame. An event that lights things (lightning) is drawn artistically, eased over several frames: a creeping leader,
the bolt, a slow dimming, the light it casts local and soft, at most one a second.

**PML's purpose** is to override the page's globals per segment: that is
what makes shaped poetry possible. Page-level settings (border, vignette,
background) don't belong in it.

---

## 12 · Working with Ruby

- **Address Ruby indirectly** ("Ruby", not "you"), as Ruby prefers.
- **Use what has been done already:** before building a technique, look up
  the prior art (a published method, an established library, a known
  shader) and adopt it. Look it up: search, open and read, every time (§8, Add
  a texture, step 0), for a technique as much as for a subject.
- **Use the lighting tools** for every surface with form: albedo, height,
  gloss and translucency maps lit by the Light Engine (§8, step 1b). Drawn-on
  shading, outlines and baked highlights read as cartoons (Ruby, the
  florals).
  - Reinvent only for a good reason, and say what it is.
  - The prior art so far: the Claude Doc "Unfixable Vellum — Prior Art &
    Recommendations", and the Filter Forge study (ROADMAP.md §1).
- **Don't replace what Ruby loves without asking; add beside it by
  default.** A texture Ruby liked keeps its exact look at its defaults: a new
  idea becomes a knob, or a new texture. A better or faster method may
  replace it once Ruby approves the test renders (§8).
- **Be creative** (Ruby, 2026-10-20: "you are allowed to be creative and express yourself while working on this
  project"). Think about interactions first, and surprise Ruby with them: the sun slipping behind Saturn, a
  lighthouse lit at dusk, a fairy drawn to a lantern. What nobody asked for, but the world would do, is welcome.
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
