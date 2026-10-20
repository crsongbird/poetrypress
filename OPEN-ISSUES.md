# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- THE DIALS ALWAYS SHOW: the camera dial and Main Light / Rim Light faded where a surface doesn't use them; the colours
  two columns beneath. The Transmutation Circle placed by the camera dial (with its guide); Rain on Water's View and the
  Painted Landscape's Tilt on the camera dial's View. Right?
- MACRO BLOOM IN DEPTH ORDER: drawn back to front, and its shadows from the depth (a leaf near the lens shadows the
  petals, an insect the petal it stands on); the stem, leaves overhead and the caster crossing near the lens are back.
- LARGE GRAPHS ON FIREFOX (Ruby's crash): measured, one Macro Bloom render on a phone made 99 canvases, about 170
  megapixels, and held up to 27 results of about 20 MB each: memory Chrome reclaimed in time and Firefox, it seems, did
  not (there is no Firefox here to try it on). Now scratch canvases are given back at once, Firefox on a phone works on
  a grid of at most a megapixel, slow surfaces come in two stages, and a render that runs out of memory is tried again
  at half size. The Athanor holds 255 parts; step previews rest above 150. Does Firefox hold now?
- MACRO BLOOM THROUGH A REAL LENS: one Lens Blur focuses the whole picture from a depth map (in front of the focus
  blurs fast, behind it softens to a limit, the lights behind become discs; on the GPU where there is one). The camera
  dial frames the flower with a wireframe guide (Zoom, View, Turn); the sliders are Species, Stage, Aperture, Focus,
  Lights Behind, Dew, Translucency, Visitors, each one thing; insects rare (about one seed in eight), at most two, on a
  petal, a quarter smaller. Right, and is the default blur creamy enough?
- A RELOAD KEEPS THE LOOK: an empty poem no longer starts fresh (that was the opening look, the default theme and every
  slider new); the surface and sliders come back with the page empty, and ⟲ is the fresh start. Right?
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
- WINDWARD SEA: the wind about 30% less dramatic (fewer, smaller gusts by default).
- A FAIRY now and then (Ruby: "both Hyrule Field and the wind waker need an occasional fairy showing up from the
  game"): small, a glowing nod and never the character itself, in the Meadow and the Windward Sea, and in Macro Bloom
  as a visitor at a 1-in-66 chance (small).
- SUNRISE SCROLL: Ruby loves the nod to the game's box art; the game had a wide variety of lands, so the
  seed should paint them with more depth: misty peaks, a coast with curling waves, the snowy north, a bamboo forest, a
  village of roofs and gates, fields under a great tree, a cursed land under red miasma.
- THE GPU (Ruby: "implement most of these things on the GPU to accelerate rendering as much as inhumanly possible"):
  only the Light Engine's shadow march, occlusion and shine run on the GPU; blur, focal blur, warp, blend, posterize,
  Scatter and the rest of a graph run on the CPU. Move them (PERFORMANCE-AUDIT, ROADMAP).
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
- SMALLER AND SIMPLER (docs/SIMPLIFY.md, ROADMAP S): which first? Suggested: the refactors (S1, each proved by unchanged
  pictures), then the page phones download (S2: −2.8 MB), then the tests (S3), then the protocol (S4).

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

