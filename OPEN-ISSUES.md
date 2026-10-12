# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new in Jupiter–Pasiphae)
- THE ATHANOR'S HANDS: with a mouse a part drags from anywhere on it (not
  only its title), except its fields and ports. The wheel zooms on Firefox
  too: it counted wheel steps as pixels, so each step barely moved. Wires
  are redrawn whenever the Athanor opens or its fonts arrive (the stray
  wires in the screenshot came from wires drawn while the panel was hidden:
  the graph itself was always intact).
- UNDO and REDO in the Athanor (↶ ↷ in its bar; Ctrl/⌘+Z, Shift+Ctrl+Z or
  Ctrl+Y), 100 steps, for every move, wire and setting. Ctrl+D duplicates a
  part, F fits the view, Delete removes what's selected (asking first, as
  before). Copying the Surface is refused with a knock.
- THE OIL ON CANVAS STARTER is back (Start from… → Oil on Canvas): any
  texture → Oil Paint → a little Canvas Weave → the Light Engine.
- PARTICLES is a part: flakes, sparks or motes, over any picture, in any two
  colors, blown by the dial. First Snow, Burning Mana and Euphoria Dust are
  now chains of it, and draw exactly as before (Euphoria is unchanged).

## 1c · Ruby's notes to act on (her verdicts on Taygete and earlier; the rest she approved)
- CARTOMANCY: the clutter and its lighting read as cartoony — light the
  table, cards and objects with the Light Engine (now a part). Scramble
  everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but
  with its own lore and rules.
- PAINTED LANDSCAPE: more variety in the water and land textures.
- REROLLING: the dice are in (Kalyke); tell me what still sticks.
- THE ATHANOR: textures inside a graph sometimes need swapping to show
  (not reproduced yet: which texture, and what showed?).
- OIL PAINT loses small things (distant trees) at Impasto 50; a finer pass
  where the picture has small detail.

## 2 · Waiting on Ruby
- SOUNDS — the instrument itself, when Ruby wants it back:
  - a STRING instrument, something unusual (plucked string by physical model;
    ideas: an Aeolian harp, strings sounded by wind; sympathetic strings that
    ring when another is struck; a koto-like pluck that bends up)
  - a way to PLAY it by hand (a big, forgiving pad to strum, pluck or bow,
    recorded straight into a composition) instead of typing degrees
  - Ruby's design from the Murmur Studio goes into murmur.js MURMUR_DESIGN.
- The PRESETS pass — "not yet" (the lore words are ready for it).
- Harsh Rain and Silverpoint Hatch cost ~0.1–0.3 s as chains (were ~0.05 s).
  Fine, or keep a fast path?

## 3 · Long horizon
- THE SATURN RELEASE (Ruby): once every texture is taken apart into parts, a
  creative enough user should be able to make in the Athanor anything Filter
  Forge or Blender's shader nodes can — shaders and blending included. Blend
  modes and shader components get rethought then, as parts. Custom Presets
  are where that library grows (until the built-in ones aren't needed).
- IMPORTS: a tab of images placed on the page, each a LAYER (position, size,
  turn, opacity, a blend mode, a lock, an eye) — and the text, the surface,
  the box and the border as layers too, each with its own blend. A layer list
  is the general tool; what keeps it this app's is what the layers ARE.
- WIDER WITHOUT LOSING ITSELF (a brainstorm):
  - every layer can be a SPELL: a look kept by name, so "a poem on a photo"
    is still a spell, carried and shared as one
  - the Athanor takes an imported image as an input (a Picture node): a photo
    run through Levels, Warp, Kaleidoscope, lit by the dial — Filter Forge's
    reason to exist, in this app's terms
  - a MASK from the poem: the words cut through a surface or an image (type
    as a window), and the reverse — a surface only where the words are
  - CROP AND FRAME presets for where the image goes (a post, a story, a
    print, a book page), each its own safe area shown while working
  - a PRINT size: inches and DPI beside pixels, with bleed for print
  - BATCH: one look, many poems (a chapbook's pages, a series of posts)
  - imported images keep the app's grammar: four readings of a photo (🜂 warm
    and burned, 🜄 cool and soft, 🜁 pale and airy, 🜃 grained and dark)
  - what stays its own: the elements, the seeds as phrases, the spells, the
    readings, the Athanor's parts, the witchiness of the words. A general
    tool, with a voice.

## 4 · Next (no input needed)
- EVERY TEXTURE INTO THE ATHANOR (Ruby's long horizon: loadable, viewable
  as a graph, mixable, kept and shared as one's own). 15 of 47 are chains:
  Harsh Rain, Silverpoint Hatch, Linen Tooth, Fractured Glaze, Cartomancy,
  Sleep Haze, Scattered Polygons, Stained Glass, Painted Landscape, Painter's
  Frustration, Halftone, Film Grain, First Snow, Burning Mana, Euphoria Dust.
  Still to take apart (each when touched, or in passes): Dream Bloom, Deep
  Field, Lotus Pond, Rain on Glass, Sigil Scatter, Machine Glyphs,
  Transmutation Circles, Ink Blot, Old Paper, Crystal Leaf, Spangle, Cold
  Press, Cup Ring, Guilloche, Chladni, Contour Map, Suminagashi, Watercolour,
  Flow-Field Ink, Turing Skin, Hoarfrost, Burnt Letter, Poured Wax, Dunes,
  Kintsugi, Moss, City at Night, Black Hole, Scrying Pool, Moon, Aurora,
  Tessellate. Likely shared parts first: the Particles part (done, Pasiphae:
  Deep Field's stars and Dream Bloom's motes may join it), the Light Engine part (done, Sponde: most 🜚 Touch textures
  can end in it now), a
  Marbling part (Suminagashi, Ink Blot).
- The Athanor on a phone, still: haptics on a long press, an accessibility
  pass.
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- Split appEvents.js (~2,900 lines) into modules — the tests read its source
  by regex, so they move with it.

## 5 · Check on a phone (new)
- The Athanor: hold a setting, a wire, a port, the empty grid; tap a wire and
  ✂; one finger pans; the parts drawer scrolls; the dock is out of the way.
- Share on Firefox: the box stays put.
- Save image: the alt text is copied (or the Copy button works) and pastes
  into Bluesky's alt text box with its headings and line breaks.
- Sounds: on, the volume, and that iOS's silent switch silences them.
