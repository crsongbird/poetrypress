# The Athanor: graphs, Filter Forge's lessons, the editor

Graphs (their versions, groups, loops, starters, limits), what the Athanor took from Filter Forge, and the editor (forge.js). Moved from AGENTS.md §6.3–6.5; read it before touching athanor.js or forge.js.

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
  - v4: more settings take maps (those marked `key:4` in a part's `maps`).
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
  - At most 640 KB (`ATHANOR_MAX_JSON`) and 255 nodes; twice that is refused
    outright.
  - Unknown steps, bad wires and out-of-range params are reported and fixed.
  - Every param is clamped.
  - The work budget draws a heavy graph on a coarser grid.
  - Above 150 nodes (`ATHANOR_LIMITS.previews`) the step previews rest; below, the step sheet is at most 512 px a side.
  - Memory (Firefox on a phone): a part's scratch canvas is given back the moment it is read (texCore `freeCanvas`:
    width and height 0); on Firefox on a phone a graph works on a grid of at most a megapixel (texCore `setGridCap`,
    set per job by textureService); a slow texture comes first as a quarter-size draft, then at full size (stages); a
    worker that dies on a large job tries it again at half size.
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
  settings a part declares (its `maps`; `key:4` from v4), read with `E.map`/`E.at`. The evaluator maps only those; the wiki
  marks them "by point" and the setting's menu says so. Any other setting,
  and every setting in a v2 graph, takes the map's average.
  - A number from `E.map` keeps the old code path, so a v2 graph draws
    exactly as before; filterforge.test checks every declared setting both
    ways.
- **Curves:** `{ curve: Float32Array(257) }`, read with `curveAt`.
  - Laid where a map goes, a curve runs across the page left to right.
  - Where a number goes, it gives its mean.
  - In previews it is drawn as its graph.
- **Required inputs** (a part's `req`):
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
