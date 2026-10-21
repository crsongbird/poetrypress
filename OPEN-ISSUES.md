# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- THE RINGWORLD'S SKY AND CLOUDS IN A FILM: the clouds drift slower and live in stages (gathering, standing, thinning,
  gone), billowing as one body; their shadows sweep the land; the small motions slowed a little; the droids wander
  long paths; nothing cut before it leaves the frame; the sky glows round the sun and at dusk (the Belt of Venus
  opposite), clouds lit from below at dusk, silver linings, curtains of rain, far showers. Does a film read right now?
- SUNRISE SCROLL'S LANDS: by the seed (or the new Land knob) misty towers, a coast with a great curling wave, the snowy
  north, a bamboo grove, a village with its gate and pagoda, a great tree over terraced fields, a cursed land; things
  stand on the scroll's own ridges. Which land reads best, which needs more, and should the curse take the petals?
- PAINTED LANDSCAPE'S RIVER, remade: one winding course in perspective (broad bends near, level slivers far), the sky
  in it by the angle you see it at, its banks' lines and reflections, trees along it. Does it read as water now?
- THE COUNTRYSIDE FROM A HEIGHT (asked: look at it from a little height and say what it needs). What it needed, and
  now has: fields laid over each other (now none crosses another, a way or a yard); houses standing alone all over
  the fields (now farmsteads, laid out linear, courtyard or clustered, and hamlets, with lanes to the road and
  windbreaks in windy country; villages only round a town's heart; lights only there by night); rocks in the fields
  (now cleared, heaped at the edges); every slope terraced and flooded (now only where the country terraces); the
  ridges' lit bands and facets hanging like panes when looked down on (now thinner, facets only where the land is
  steep). New: orchards and olive groves, a field half ploughed with gulls waiting by the tractor. Still to look at:
  the spiky conifers read cartoony from above; plain green is left between farms (rough grazing) where a fuller
  patchwork might be wanted; the research's next ones (dew ponds, gates with cattle watching, tramlines, field
  margins). Does it read as farmland now?
- PAINTED LANDSCAPE'S LAND AND WATER: every country has its own marks now (fields as a patchwork with hedges, dune
  crests and slip faces, honami and flower drifts, canopy masses, mesa beds, tundra polygons, a volcano's gullies and
  lava), one wind per seed turning them, and the water's mood as a Beaufort number (puffs, foam lines, a mirror strip,
  white horses). Under the default Impasto the oil strokes soften the finer marks; with Impasto at 0 they show whole.
  Is that balance right, and which country still looks plain?
- TURNED THINGS IN DEPTH: what turns with the camera is drawn as a solid now: the buildings as boxes taking their
  shape and colours from their own fronts (setbacks, stilts, gables, battlements), the boxlike props, cars, tractors,
  carts, crates, shrines and cargo, windmills' sails, gates narrowing edge on; the round ones the same from every side.
  Does it read as depth in the style of the rest, and what still looks cheap turned?
- MACRO BLOOM ON A PHONE: Chrome's worker and Firefox ran out of memory; it now uses far less and works on a capped
  grid. Does it hold?

## 2 · Ruby's notes to act on
- THE RING, NEXT (Ruby, 2026-10-20): keep widening the library each pass, in a less cartoony hand throughout; more
  interactions nobody asked for.
- GENTLE MATERIALS: metallic, albedo and displacement used with a light touch in the remakes.
- THE GPU (Ruby: "implement most of these things on the GPU to accelerate rendering as much as inhumanly possible"):
  only the Light Engine's shadow march, occlusion and shine run on the GPU; blur, focal blur, warp, blend, posterize,
  Scatter and the rest of a graph run on the CPU. Move them (PERFORMANCE-AUDIT, ROADMAP).
- CARTOMANCY (beyond the branch above): the table's objects still painted lit, to bring onto the Light Engine.
  Scramble everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but with its own lore and rules.

## 3 · Found, not yet fixed
- CONTOUR MAP at a quarter-size preview differs from its export more than
  most (scale-audit 17% at 768, "close"; 10% at 1024, "fine"). Not the
  hillshade (the Hillshade knob doesn't move the score) and not the Terrain's
  heights (its lines fall in the same places): the preview's lines carry about
  7% less ink, more as the interval closes, though their width works out the
  same on paper at both grids (768 at a quarter, 1536 at the export).

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
- THE NEXT TEST REVIEW: mobileCss.test reads the stylesheet rule by rule; its phone invariants belong in
  invariants.test (§7 Phones) and the rest as behavior (mobileLayout, or the built page on a phone in Playwright).

