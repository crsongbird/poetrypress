# Pitfalls we hit

Mistakes made once, so they aren't made twice. Moved from AGENTS.md §10; skim it before a large change, and add to it when something bites.

**JavaScript and the bundle**
- `-x**2` is a SyntaxError: write `-(x**2)`. It has bitten five textures,
  and `node --check` may not catch it. Run `sh check.sh`, or render.
- build.mjs flattens `export async function` too. A module statement that
  survives flattening fails the build.
- The generators ship once: the worker's modules are the page's first script
  (`#vellum-texture-worker`), its text also the worker's, with textureWorker.js
  (`#vellum-worker-main`, inert) added. Both come before the page's own script:
  they have to exist before it first asks for a texture. A worker module imports
  only worker modules.
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
- **Scatter's Count is per canonical area.** On a real page (3072 px wide)
  a Count of 100 throws about 2,000 marks. A dev harness that renders at
  scale 1 on a small grid shows thirty to forty times fewer, so a graph tuned
  there floods the page. Render through getTextureCanvas with
  `scale: width/3072`, or set Scatter's Count Is to "for the page" (Count is
  then the number of marks on the whole page) for stars and sparkles.
- Perlin Noise's Scale is a frequency: bigger is finer.
- **Measure on the right machine.** This sandbox has one core and no GPU.
  Parallel workers and shaders can't show their gains here, and timing
  harnesses lie easily. Count events rather than infer them.

---
