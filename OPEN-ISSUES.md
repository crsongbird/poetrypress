# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new in Jupiter–Sponde)
- THE LIGHT ENGINE is a part: picture + heights lit by the dial, with relief,
  gloss (or a gloss map), shine, shadow, occlusion, ambient, and the shade,
  highlight and light hues. OIL PAINT repaints any picture in strokes along
  its forms, with the paint's heights; CANVAS WEAVE is the cloth. A new
  starter, Oil on Canvas, puts them together.
- PAINTED LANDSCAPE is oil on canvas the dial lights: a sixth slider,
  Impasto (0 is the old flat painting).
- THE ATHANOR: parts wear the color of what they make (as their dots and
  wires do); a tapped part comes to the front; the wheel zooms toward the
  pointer and zooms out further; larger type in the parts; on a phone the
  bar is one row (⋯ holds Kept, Help, Revert, Clear; the zoom buttons are
  gone); the teaching note sits beside the parts list, dims the grid, and
  closes with a click anywhere. Its old Esoterica card is gone.
- PRESETS: built-ins alphabetical in each heading; ＋ Save this look at the
  end of Custom Presets.
- CARTOMANCY'S WEAR has far more range: at the top nearly every card is
  marked, many two or three times.

## 1a · Ruby to judge (from Jupiter–Carme)
- INLINE CODE works again. The crash was mine: the code's backdrop read a
  color as the wrong shape, so every frame with `code` in it failed and the
  preview kept its last good picture. Not Firefox only. A test now holds it.
- THE PREVIEW (desktop): the viewer is the whole right pane, whatever the
  page's shape; the picture fits inside it, so the aspect ratio changes the
  picture, never the viewer. The buttons (fit, undo, redo, filmstrip, Save
  image) sit in a strip along the pane's foot, off the picture. A zoom
  (Ctrl or ⌘ + wheel) fills the whole pane. The phone is unchanged.
- PRESETS: Built-In Presets (was Known Rituals) and a new card under it,
  Custom Presets: your saved looks, alphabetical, in as many rows as they
  need. The saved looks in Esoterica → Spellcrafting are alphabetical too,
  and wrap into rows instead of scrolling sideways.
- THE OPENING PAGE is Ruby's "WTF is PoetryPress?", in 9:16 (now the
  default shape). A first visit also finds the Instrument Panel (the old
  opening page) in the Grimoire, dated the release, and one plain example
  look in Custom Presets ("Example · Linen Page": warm paper, dark ink,
  Alegreya, a little linen). Each is added once; deleted, it stays deleted.
- ROSÉ is the plum-charcoal again (Ruby: it grew on her, on OLED most).
- THE BUILD keeps one archive: `node build.mjs --zip` deletes the old ones
  in release/ first.

## 1b · Ruby's notes to act on (her verdicts on Taygete and earlier; the rest she approved)
- CARTOMANCY: the clutter and its lighting read as cartoony — light the
  table, cards and objects with the Light Engine (now a part). Scramble
  everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but
  with its own lore and rules.
- PAINTED LANDSCAPE: more variety in the water and land textures.
- THE ATHANOR: textures inside a graph sometimes need swapping to show
  (not reproduced yet: which texture, and what showed?). Check the zoom no
  longer locks (Sponde: the wheel zooms toward the pointer, farther out).
- OIL PAINT loses small things (distant trees) at Impasto 50; a finer pass
  where the picture has small detail.
- REROLLING: some elements stay unexpectedly when rerolling; Ruby wants
  toggles to reset or reroll individual elements and states, for mixing
  and matching (a proposal went with the Sponde release: per-section dice and keep-locks; waiting on Ruby's pick).

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
  as a graph, mixable, kept and shared as one's own). 9 of 47 are chains:
  Harsh Rain, Silverpoint Hatch, Linen Tooth, Fractured Glaze, Cartomancy,
  Sleep Haze, Scattered Polygons, Stained Glass, Painted Landscape. Still to
  take apart (each when touched, or in passes): Dream Bloom, Deep Field,
  Euphoria Dust, Burning Mana, First Snow, Film Grain, Lotus Pond, Painter's
  Frustration, Halftone, Rain on Glass, Sigil Scatter, Machine Glyphs,
  Transmutation Circles, Ink Blot, Old Paper, Crystal Leaf, Spangle, Cold
  Press, Cup Ring, Guilloche, Chladni, Contour Map, Suminagashi, Watercolour,
  Flow-Field Ink, Turing Skin, Hoarfrost, Burnt Letter, Poured Wax, Dunes,
  Kintsugi, Moss, City at Night, Black Hole, Scrying Pool, Moon, Aurora,
  Tessellate. Likely shared parts first: a Scatter of marks (snow, embers,
  dust, sparkles), a Light-heights engine part (most 🜚 Touch textures), a
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
