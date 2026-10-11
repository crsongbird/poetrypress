# Performance audit — Jupiter–Ersa

Measured, not guessed: Chrome as a Pixel-sized phone and Node for textures,
on a development machine. **A phone is roughly 3–5× slower**, so multiply
every number here for the experience on a real device.

---

## 1 · Where the time goes

**Steady state is fine.** Once textures are cached, a frame costs 0–5 ms for
every preset. The app feels slow because of what happens *when something
changes*:

| What | Where | Cost here | Cost on a phone (est.) |
|---|---|---|---|
| Re-fitting the text | main thread | up to ~500 ms per fit | 1.5–2.5 s |
| Start-up | main thread | ~1.1 s busy, longest freeze 668 ms | 3–5 s |
| Heavy textures | worker | 0.6–1.5 s each at preview size | 2–7 s each |
| Preset tiles | main thread, at start-up | ~280 ms | ~1–1.4 s |

**Interactions** (Chrome, phone-sized):

| Interaction | Longest freeze | Total blocked |
|---|---|---|
| Typing 20 characters | 0 ms | 0 ms |
| Opening each tab | 0 ms | 0 ms |
| Choosing Moss on Stone, dragging its knob | 0 ms | 0 ms (the worker works) |
| Dragging Lotus Form | 52 ms | 155 ms |
| Dragging text size | **194 ms** | 544 ms |
| Switching presets (6) | **367 ms** | 1,127 ms |

**Main-thread CPU across those interactions: ~70% is measuring text**
(`measureText` 56%, `measureSegWidth` 8%, plus `fontPx`, `fitHeight`,
`fitTextSize`). Next: `drawImage` 7%, `fillText` 6%, garbage collection 4%.

**Textures** (generation time, preview 1024 px / export 3072 px). 27 of 36
take under ~200 ms (median 37 ms). The slow ones:

| Texture | Preview | Export | Why |
|---|---|---|---|
| Linen Tooth | 1,484 | 1,643 | always computed on the export grid (its threads alias otherwise) |
| Moss on Stone | 972 | 2,184 | lighting + noise on a grid barely smaller than export's |
| Dune Ripples | 965 | 2,075 | same |
| Kintsugi | 903 | 2,201 | same |
| Cup Ring | 803 | 1,370 | same |
| Rain on Glass | 679 | 1,689 | same |
| Facet Field | 607 | 1,340 | same |
| Deep Field | 561 | 540 | per-pixel noise on a fixed grid (no cheaper when small) |
| Scrying Pool | 476 | 460 | same |
| Sleep Haze | 425 | 651 | same |

The lit textures' working grid is `canonDiv(2)`: at preview size that is the
preview's own resolution, so a preview costs half an export — not a ninth.

**Start-up** (busy ~1.1 s): the text is fully fitted **four times** — first
paint, `fonts.ready`, and two unconditional timers at 300 ms and 900 ms that
re-fit even when nothing changed. The symbol font arriving **clears the whole
texture cache**, so every texture is generated again (only two need it). The
16 preset tiles generate their textures synchronously on the main thread.

Memory is healthy: a 10 MB JS heap after visiting every preset.

---

## 2 · Proposed changes

Gains are estimates from the measurements above; "identical" means the
output must be byte-for-byte unchanged, proven by the existing render
fingerprints.

### A · Fit text in ~3 passes instead of dozens — *identical*
`fitTextSize` steps down 2 px at a time from the maximum size, re-measuring
every line at each step. Width scales in proportion to size, so measure once,
predict the size, then check the step grid around it (down while it doesn't
fit, up while the next one does) — returning exactly the size today's search
returns.
- **Gain:** the biggest. Most of that 70% of main-thread time; text-size
  drags and preset switches stop freezing.
- **Pros:** no visible change; small, contained code. **Cons:** none known.
- **Risk:** low — compare every preset's render against today's.

### B · Cache measured widths — *identical*
Memoise `measureText` by font + text, cleared when fonts load. Repeated
renders and refits re-measure the same strings constantly.
- **Gain:** large, on top of A. **Pros:** invisible. **Cons:** a little
  memory. **Risk:** low (must clear when a font arrives).

### C · Start-up: refit only when something changed — *identical*
Drop the 300 ms / 900 ms re-fit timers in favour of refitting when a font
actually arrives (`document.fonts` `loadingdone`). Clear only the textures
that draw symbols (Transmutation Circles, Cartomancy) when the symbol font
arrives, not the whole cache.
- **Gain:** roughly halves start-up work; no duplicate texture generation.
- **Pros:** invisible. **Cons:** none. **Risk:** low.

### D · Preset tiles off the critical path — *identical tiles*
Generate them in the worker, and only when Rituals is first opened.
- **Gain:** ~280 ms off start-up (~1 s on a phone).
- **Pros:** invisible. **Cons:** tiles appear a moment after opening Rituals.

### E · Smooth fields on a lattice — *near-identical*
Deep Field, Scrying Pool and Sleep Haze sample noise at every pixel for
fields that change over dozens of pixels. Sampling every few pixels and
blending (as Moss on Stone already does) made Moss ~3× faster with no visible
change.
- **Gain:** ~3–5× on those three. **Pros:** proven pattern. **Cons:**
  fingerprints move (tiny value changes); must be checked by eye.

### F · Lit textures: a coarser grid for the PREVIEW — *a visible trade*
Compute lighting for the preview on a grid half the preview's resolution
(the export keeps today's grid). Lighting is smooth; sand grain and fibres
are not.
- **Gain:** ~3–4× faster previews for the seven lit textures.
- **Pros:** the slowest textures become quick to drag. **Cons:** the preview
  is softer than the export — breaks "the preview is the export scaled down"
  slightly; Save image is unaffected.

### G · Lighting on the GPU — *a big step*
`lightHeights` (diffuse, specular, shadows, occlusion) is a textbook
fragment shader: WebGL in the worker would do it in milliseconds.
- **Gain:** the lit textures' lighting cost to ~nothing.
- **Pros:** the largest possible speed-up for them; opens richer lighting.
- **Cons:** a second implementation to keep identical to the CPU one; GPU
  differences between phones; phones without WebGL in workers need the CPU
  path anyway; a real project (days, not hours).

### H · More than one worker
Deep Field's nebula and stars, and the texture vs tiles, queue behind each
other. Two or three workers (by `navigator.hardwareConcurrency`) run them
side by side.
- **Gain:** up to ~2× on multi-layer looks. **Cons:** more memory (each
  worker holds the generator code); phones have few fast cores.

### I · Stop wasted work while dragging
A texture knob drag finishes every generation it starts. Restart the worker
when a newer request arrives for a slow texture (the old one is abandoned),
and/or show a quick half-resolution version first, then the full preview.
- **Gain:** perceived — the newest position appears sooner. **Cons:**
  restarting costs ~50–100 ms; the quick version flickers in.

### J · Linen at preview — *done (Jupiter, the chains release)*
Linen's grid now keeps its threads at least ~3 px apart and no finer: the
canvas's own grid for a preview, the export's when the weave is fine. Its
thread edges are a pixel soft (no stair-steps), so the coarser preview does
not alias. With an integer hash (no Math.sin in the loop), tabled curves and
half the work at a weave keyframe: preview 2.9 s → 0.6 s, export 2.9 s → 1.75 s.

---

## Done: A–D (Jupiter–Himalia)
Proven identical: 192 renders (16 presets × 3 poems × 2 text sizes × 2 page
shapes) match the previous release pixel for pixel. Measured (Chrome, phone):

| | Before | After |
|---|---|---|
| Start-up: longest freeze / blocked | 800 / 1,034 ms | 216 / 216 ms |
| Switching presets: longest / blocked | 561 / 1,289 ms | 102 / 152 ms |
| Dragging text size: longest / blocked | 111 / 392 ms | 62 / 62 ms |

## Done: E–I (Jupiter–Pandia)
- **E** · Deep Field's nebula 423 → 108 ms, Sleep Haze 456 → 197 ms (smooth
  fields on a lattice; checked by eye — indistinguishable). Scrying Pool's
  caustics are sharp lines a lattice would smear: left for its rebuild.
- **F** · while a knob or the light is dragged, slow textures (over 250 ms)
  are drafted at half resolution and drawn scaled up: a 2 s drag of Moss on
  Stone showed 4 drafts instead of at most 1; it sharpens after you stop.
- **G** · `lightHeights` has a WebGL2 fragment-shader path in the workers.
  It matches the CPU to within 1/255 on all six lit textures. Software-
  emulated WebGL (no GPU; it measured ~2× SLOWER than the CPU) steps aside.
  Real-GPU speed is unmeasured here — the next phone test will tell.
- **H** · one worker per spare core, up to two.
- **I** · a new wish starts at once on a free worker; stale work finishes
  alongside and shows only if nothing newer has. Killing stale work was tried
  and measured SLOWER (a fresh worker runs cold, unoptimised code) — so
  nothing is killed.
- Also: tinted glyphs are remembered (a third of each render), and live
  numbers in the poem (§RenderMs, §Profile, §CacheMB) no longer refit the
  page — a render during a Dream Bloom drag fell from 335 to 238 ms here.

## Next on the GPU (candidates)
Dream Bloom's convolution (splatting the aperture is what GPUs do best);
noise fields (nebula, smoke, water, moss); `pixelPass` tint/remap; the border
bloom and glow blurs. Keep results on the GPU end to end where possible —
reading back to the CPU stalls it.

## Texture timings (Jupiter series, measured in node with CPU light)

Preview (768 px) · export (3072 px). Less where the light runs on the GPU.

| Texture | Preview | Export |
|---|---|---|
| Linen Tooth | ~0.6 s (was 2.9) | ~1.75 s (was 2.9) — a chain of steps; threads ≥3 px |
| Fractured Glaze | ~0.7 s (was 1.5) | ~2.4 s (was 6.5) — a chain; its crack nets allocate nothing per pixel |
| Harsh Rain · Silverpoint Hatch | ~0.08 s · ~0.12 s | ~0.24 s · ~0.28 s — chains on a half grid (were ~0.05 s as plain canvas drawing) |
| Contour Map | ~0.9 s | ~2.1 s |
| Burnt Letter | ~1.1 s | ~2.6 s |
| Black Hole | ~0.6 s | ~2 s |
| Dune Ripples (tilted) | — | ~1.4 s default, ~2.6 s full tilt |
| Turing Skin | ~1.2 s | ~1.2 s (its own grid) |
| Hoarfrost | ~0.9 s | ~1.5 s |
| Rain on Glass | ~0.8 s | ~1.4 s (one simulation at every size) |
| Stained Glass · Suminagashi | ~0.8 s | ~1.4 s |
| Chladni Sand | ~0.7 s | ~1.2 s |
| Guilloché | ~0.5 s | ~1.1 s |
| Watercolour Wash | ~0.4 s | ~1.2 s |
| Flow-Field Ink | ~0.1 s | — |

An Athanor surface costs what its parts cost, inside its work budget.

Text effects: glow, shadow and bevel blur as canvas shadows (`softText`), not
`ctx.filter` — glow ~200 → ~10 ms a frame, three stacked ~350 → ~17 ms.

## 3 · Decisions for Ruby

1. ~~A–D~~ — done.
2–6. ~~E, F, G, H, I~~ — done.
7. **Chrome on your phone:** the page canvas became a CPU canvas last
   release (Chrome re-uploaded every layer to the GPU each frame). Please
   compare Chrome and Firefox again before we decide anything GPU-related.

**Suggested order:** A + B + C + D (one release, provably identical) → measure
on your phone → E + F + I → measure → decide on G and H.
