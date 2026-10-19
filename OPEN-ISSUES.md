# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- LIMINAL SPACES (new, branch `liminal`, sheet sent): the Room Caster ray-casts an empty place of one of eleven kinds
  (lobby, warehouse, tunnels, poolrooms, hotel, school, hospital, subway, garage, mall, office), the seed's layout, lamps
  and camera; general parts colour, light, haze and grain it. Six hues (walls, floor, ceiling, accent and water, light,
  dark); the camera dial looks round. More kinds wanted (a stairwell, a playplace, an airport, an endless suburb)?
- FLOWERS (new, branch `florals`, sheets sent): five surfaces in a new ᘓ Flowers group (Lotus Pond moves there),
  built from general parts and one new part, Bloom, which draws 23 real species (front, side, any stage from bud to
  spent; one flower, a sheet of them, a single petal or a leaf). Floral Imprints (the seed's cyanotype, stamp, crest
  or pressed flowers), Bouquets (posy, bundle, crown, wreath), Fallen Petals (wilting heads and petals on wood, linen
  or stone), Meadow (a hill of wildflowers under sky), Macro (one flower close, bokeh and dew, a second of its kind
  out of focus behind). Scatter can now throw a picture or a sheet of them, with black as clear. Species right? More?
- VEINS OF LIGHT, REBUILT (branch `veins`, built on `florals`, sheets sent; back in the menu there): a network with
  loops, not a tree. A new part, Network, joins nodes one of six ways (Weave: Tree + Loops, Relative, Gabriel, Slime,
  Streets, Subdivided), widens each line by the flow it carries from the hubs (the poem's punctuation, else the seed's),
  and routes it from organic curves to circuit traces (Organic ↔ Circuit), with pads, buses and pulses. Eight knobs
  (Material and Weave each start at Seeded), six hues; the glow wakes as the dial's light sinks. Readings: Circuit
  Marble, Leaf Lumen, Undercity. The Circuitry look moved to its new knobs.
- THE HUES IN THREE GROUPS: Light Colors (Main Light, Rim Light, Ambient Light, beside the dial), Surface Colors (the
  surface's own, up to six, named by the surface; a Ground or Snow Hue joins them), Material Colors (Glow, Shine and
  Shadow Hues), each under a small heading that hides when none of its hues shows. Names right?
- THE BLACK HOLE: the light dial places it (its way from the page's middle, its height how far out; at the middle, the
  page's middle), and the disc's wireframe stands there while either dial moves. The seed now also chooses hot spots in
  the disc, how much nebula and dust lies behind, and sometimes a galaxy right behind it, lensed into arcs. Older looks
  and Event Horizon keep their camera and stand at the page's middle.
- STARTERS AND STUDIES BY KIND: each sits in its Surface menu group after that group's surfaces, marked "(starter)" or
  "(study)"; the screen-and-signal studies have a group of their own, 🜳 Screens & Signals (Radio). The Athanor's Open
  drawer groups them the same way. Right homes?
- DAPPLED LEAVES and WINDOW LIGHT now throw along the light (Window Light had the same quarter turn). The Light Dial part
  has a third output, Way, for this.
- THE PAINTED LANDSCAPE'S SUN follows the light dial (kept just above the horizon when the dial would set it lower).
- WRITING ON A PHONE: drag the divider while the keyboard is up to size the preview again (at least three lines of poem
  stay); a double-tap gives back the dozen lines.

## 2 · Ruby's notes to act on
- CARTOMANCY: the clutter and its lighting read as cartoony — light the
  table, cards and objects with the Light Engine (now a part). Scramble
  everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but
  with its own lore and rules.
- PAINTED LANDSCAPE: more variety in the water and land textures.

## 3 · Found, not yet fixed
- CONTOUR MAP at a quarter-size preview differs from its export more than
  most (scale-audit 26%, was 31%: the hillshade's shadows at that grid). Not
  new; worth a look when the Terrain is next touched.

## 4 · Waiting on Ruby
- THE EMOTIONAL SEED (Weather of Feeling): Ruby isn't sure it wants the feature any more. It stays, a starter in
  🜁 Weather, until Ruby says to retire it.
- SOUNDS — the instrument itself, when Ruby wants it back:
  - a STRING instrument, something unusual (plucked string by physical model;
    ideas: an Aeolian harp, strings sounded by wind; sympathetic strings that
    ring when another is struck; a koto-like pluck that bends up)
  - a way to PLAY it by hand (a big, forgiving pad to strum, pluck or bow,
    recorded straight into a composition) instead of typing degrees
  - Ruby's design from the Murmur Studio goes into murmur.js MURMUR_DESIGN.

## 5 · Long horizon
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

- A PHONE HELD SIDEWAYS: the parked side-by-side layout (preview left, panels right) was removed with
  the dead code; `git log -S "orientation: landscape" -- poetrypress.css` finds it, if it is wanted on a
  laptop or a tablet.

## 6 · Next (no input needed)
- EVERY TEXTURE INTO THE ATHANOR (Ruby's long horizon): only Deep Field is left (ROADMAP.md Stage 3).
  It is two layers, each blended with the page in turn, so one graph can't draw it exactly: it waits for a
  graph that can hand the page more than one layer. Then the whole-texture parts are taken apart (§2 J):
  likely shared parts first: Particles (Deep Field's stars, Dream Bloom's motes), Terrain (Dunes, Moss),
  Pigment (Suminagashi's inks), the Light Engine (most 🜚 Touch textures), a Marbling part (Suminagashi,
  Ink Blot).
- The Athanor on a phone, still: haptics on a long press, an accessibility
  pass.
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- Split appEvents.js into modules — the tests read its source
  by regex, so they move with it.
- THE NEXT TEST REVIEW (left by Saturn–Tarqeq's and Saturn–Mundilfari's, larger rewrites): persistenceCoverage slices
  appEvents' functions out of its source (rewrite on audit.test's save-and-load harness, every control in index.html);
  poem.test's renderer checks (the layout record, Text Clearing) as behavior; mobileCss's phone invariants into
  invariants.test (§7 Phones) and the rest as behavior in mobileLayout.

