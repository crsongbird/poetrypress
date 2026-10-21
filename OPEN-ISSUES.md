# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- TIME ON THE RINGWORLD: the Moving Image's Time Passing (an hour to two days), the clouds now standing among the hills,
  the gas giants, the moving droids and the swaying grass. Is the pace right, and what else should move?
- MACRO BLOOM ON A PHONE: Chrome's worker and Firefox ran out of memory; it now uses far less and works on a capped
  grid. Does it hold?

## 2 · Ruby's notes to act on
- THE RING, NEXT (Ruby, 2026-10-20): keep widening the library each pass, in a less cartoony hand throughout; more
  interactions nobody asked for. The countryside is newly in (fields, terraces, flocks, boats, a town's lights by
  night): look at it in a wide view from a little height, and say what it needs.
- TURNED THINGS IN DEPTH (Ruby, 2026-10-20, for later): some of the eight views look cheap (a sprite squeezed flat).
  Each turned thing should be drawn as a solid in three-dimensional space, though painted flat: its sides, top and
  ends foreshortened and lit as the rest of the flat objects are, matching their style. The box-built buildings are
  boxes now, and so are the vending machines, phone boxes, mailboxes, containers and troughs; a parked car is a
  solid. Still squeezed: the crates and cargo (drawn half turned already), the shrines, the temples, castles and
  windmills, the tractors, carts and bicycles seen half turned.
- GENTLE MATERIALS: metallic, albedo and displacement used with a light touch in the remakes.
- SUNRISE SCROLL: Ruby loves the nod to the game's box art; the game had a wide variety of lands, so the
  seed should paint them with more depth: misty peaks, a coast with curling waves, the snowy north, a bamboo forest, a
  village of roofs and gates, fields under a great tree, a cursed land under red miasma.
- THE GPU (Ruby: "implement most of these things on the GPU to accelerate rendering as much as inhumanly possible"):
  only the Light Engine's shadow march, occlusion and shine run on the GPU; blur, focal blur, warp, blend, posterize,
  Scatter and the rest of a graph run on the CPU. Move them (PERFORMANCE-AUDIT, ROADMAP).
- CARTOMANCY (beyond the branch above): the table's objects still painted lit, to bring onto the Light Engine.
  Scramble everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but with its own lore and rules.
- PAINTED LANDSCAPE: more variety in the water and land textures.

## 3 · Found, not yet fixed
- CONTOUR MAP at a quarter-size preview differs from its export more than
  most (scale-audit 26%, was 31%: the hillshade's shadows at that grid). Not
  new; worth a look when the Terrain is next touched.

## 4 · Waiting on Ruby
- Nothing.

## 5 · Long horizon
- A GAME, IN ITS OWN REPO SOMEDAY (Ruby, the extreme long term): a fork that explores the ringworlds, finds the idyllic
  places and has quests, around a story Ruby will write. It means some of these scenes must one day draw in (semi)
  real time at phone sizes: the node graphs go, their parts compiled into small fast blocks drawn at once, and world
  state machines added. Prior art: docs/prior-art/realtime-game.md. Keep it in mind when a scene's speed is chosen.
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
- SMALLER AND SIMPLER, continued (ROADMAP S): one record per surface (the menu built from the groups); the texture
  suites' one sweep (measured: it would save about a minute of the three); persistenceCoverage on behaviour, not
  slices of the source; AGENTS.md from ~920 lines to ~600 (each rule said once).
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
- THE NEXT TEST REVIEW (left by Saturn–Tarqeq's and Saturn–Mundilfari's, larger rewrites): persistenceCoverage slices
  appEvents' functions out of its source (rewrite on audit.test's save-and-load harness, every control in index.html);
  poem.test's renderer checks (the layout record, Text Clearing) as behavior; mobileCss's phone invariants into
  invariants.test (§7 Phones) and the rest as behavior in mobileLayout.

