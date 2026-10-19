# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- MACRO BLOOM'S VISITORS AND SHADOWS (sheets sent): most seeds bring a visitor near the flower's heart — a ladybird,
  a jumping spider, a hoverfly, an ant, aphids, a fallen petal or a seed's fluff — in a new Visitor Hue (it replaces the
  Second Bokeh Hue, which now follows the first and the key light), lit with the flower: a ladybird's shell shines, a
  spider's eyes catch the light, a hoverfly's wings let it through, and each casts its shadow on the petal. Dew drops
  are little lenses: a dark rim, a highlight, a bright tail beyond them. A blade of grass or leaves between the sun and
  the flower cast a soft shadow along the light, and now and then cross the frame near the lens. Other visitors wanted
  (a bee, a snail, a caterpillar, a damselfly)?
- WINDWARD SEA (branch `cel`, sheets sent; not on main): the first love letter to a video game, a sea and sky in the
  cel-shaded sailing look. Light in two to four flat bands (Toon Bands), heaped clouds curled by Swirls, long white
  wind streams, foam in flattened rounds and the waves' white lines receding to the horizon, islands, and a sun the
  dial places (it sets into the sea as the light's height sinks). Readings: Fair Wind, Sunset Sail, Squall, Morning
  Breeze. In Places & Scenes. Merge it? What to change?
- THE SURFACE MENU'S GROUPS, REARRANGED: Burnt Letter and Cup Ring to Paper & Grounds; Veins of Light and Moss on Stone
  to Grown & Generated; Knotwork to Pattern & Order; Light, Sparks & Dust is now Light, Dust & Feathers (the two
  feathers were there); the Paving Stones and Brick Wall starters to Materials & Craft; the Packet Rain study to Screens
  & Signals. Anything else still in a strange place?
- THE HUES IN THREE GROUPS: Light Colors (Main Light, Rim Light, Ambient Light, beside the dial), Surface Colors (the
  surface's own, up to six, named by the surface; a Ground or Snow Hue joins them), Material Colors (Glow, Shine and
  Shadow Hues), each under a small heading that hides when none of its hues shows. Names right?
- THE BLACK HOLE: the light dial places it (its way from the page's middle, its height how far out; at the middle, the
  page's middle), and the disc's wireframe stands there while either dial moves. The seed now also chooses hot spots in
  the disc, how much nebula and dust lies behind, and sometimes a galaxy right behind it, lensed into arcs. Older looks
  and Event Horizon keep their camera and stand at the page's middle.
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
(nothing)

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

