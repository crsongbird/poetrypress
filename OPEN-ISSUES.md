# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- THE RINGWORLD, SEALED AND FASTER: it no longer opens in the Athanor (the Surface card's button greyed, its parts in no
  menu); stills about a third faster, a film's frames more so (PERFORMANCE-AUDIT.md). Does it feel quicker on the phone?
- THE COUNTRYSIDE BY WORKS: each farmstead now farms its own fields round its yard, as many as Works raises: at a little
  Works the grazing between farms stays open, at much the patchwork fills in. Is the balance right at the default?
- SUNRISE SCROLL'S CURSED LAND: the petals drift down through its ash and lie on the dead ground, blighted at their
  edges. Enough of them?
- THE RINGWORLD UNDER A MOVING CAMERA: the land cut round the eye, everything chosen by its true distance (the film
  sent shows a slow turn before and after). In a turn of your own, does anything still swim, pop or jump? Zooming still
  changes a tree's stage at a few sizes (fades between stages are the next step).
- DOORS: at dusk each walker goes to the nearest house with a door, within a quarter of a kilometre, and goes in.
- CORNERS: windows 3px, buttons and fields 2px, small marks 1px; a group of choices blunted only on its outside corners
  (the radio rows, the film sheet's blocks, the Athanor's joined buttons); circles kept round. "Circles barely any" was
  read as: the smallest things get the least. The left-edge lines on the cards and sub-blocks are gone. Right weight?
- SEE THROUGH: Under Glass, Broken Glass, Crystal Leaf, Poured Wax and now Rain on Glass laid over another surface bend
  it (the switch with the surface's tools; on for a new page): each raindrop shows the surface beneath it turned over in
  its lens. The bend is gentle at the defaults: strong enough, or should it reach farther?
- THE RINGWORLD WITHOUT FLICKER: the cirrus and bands drift and fade instead of leaping; heaps build billow by billow;
  smoke plumes lean with the wind; lights ease on and off; lightning lights the land, cold and from its side (the film
  sent shows the clouds before and after). Is the lightning stark enough, and the building quick enough?
- THE WILDS AND THE CITIES' COUNTRY: no farms in the Wilds now; groves, stone rows, holy wells and old columns instead;
  farmsteads in the belt round each city. Each region's palette by the seed (Burano, Jaipur, the Cyclades, ochres,
  Falu red, Kyoto). The comet travelling, meteors living their second, the aurora by height, lighthouses with their
  characters, turbines turning. Right amounts?
- THE FILM'S NEW MOVES: Also moving (any slider, the light or its height swaying, sweeping or drifting); a rest at the
  ends; To a shot (Set the shot… on the dial); four easings; Also under Camera round (Push in, Pull back, Tilt, Spiral
  out); Set it now… for the look a film moves to, set on the page itself with the sheet tucked to a bar at the foot. Do
  the amounts feel right?

## 2 · Ruby's notes to act on
- RUBY'S AFTERNOON NOTES (2026-10-24), what is left: cloud lighting with depth and faked subsurface scattering; a
  depth pass over all the drawings; clouds more dramatic in the rain and storms that look like storms; wind on trees in
  the rain that shows its strength and way; a few good buildings near the eye where they don't block the view; planets
  and moons with more variety, the ring's distance from its planet by the seed, the star's light on them (color,
  Rayleigh scattering, their air); fictional star systems, other light colors, an accurate Milky Way, skies from other
  galaxies; the generators kept fast and portable for a game; gem walkers and other constructs in magic worlds, elves
  and fae in place of people in the wilds, demonic and eldritch things, truly weird rare worlds (a candy world first);
  Martian, Venusian and Enceladian rings as extremely rare seeds with their own buildings, plants and animals; the
  Kinesis tab (desktop: after Materia, its panel in the left column, the preview playing the film as it renders; the
  phone: a long press on Save, the page behind hidden), with two cameras, the sun's arc, and keyframes on a timeline.
- THE FILM, ANY SETTING (Ruby: "more settings so we can do a wider variety of animations, arbitrary settings maybe").
  Next: marking controls on the page itself (a ∿ in each lock's place) and during To another look; the seed drifting.
  An hour of time passing during a pan is the right default. A film's motion stays out of looks and spells (the draft keeps it).
  docs/prior-art/film-animation.md.
- THE RINGWORLD'S VARIETY (Ruby, 2026-10-24), what is left: more small variations on buildings (the table in
  docs/prior-art/ringworld-motion-and-variety.md §8 item 15), more of the wider library of kinds by world (item 19:
  begun with the Wilds' lookout, bothy, charcoal, camp and hide and the towns' fountain and bandstand), and more of
  the sense of scale by layering (item 18: a cloud deck below the far horizon, rows of pylons running back, a ship's
  light crawling along the wall's top).
- SEE THROUGH, MORE SURFACES: Stained Glass, Water (the pool's floor become the surface beneath), Frost and the dew webs
  could bend what is beneath too, once their parts hand on a lens (docs/prior-art/surface-beneath.md); Scrying Pool and
  Hoarfrost are whole generators, as Rain on Glass is, and can leave their offsets on their canvas the same way.
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

