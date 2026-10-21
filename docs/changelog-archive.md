# Changelog, older releases

The releases before the newest twenty (CHANGELOG.md), newest first.

## Uranus–Juliet (2026-10-20)

- **The Painted Ringworld up close**: small things stand near you, each world its own: fences and mailboxes in the
  wilds; lamps, benches, hydrants and bicycles in town; barrels and crates in the ruins; signs; now and then a
  person, for scale. A building near enough shows its door, its step, a lamp lit at night and a planter.
- **Fields in the distance**: where people farm, the land below each crest is a patchwork of crops (ripe, green,
  fallow, now and then in flower), hedged with dark lines.
- **Drapery's crumpled sheet** folds as cloth does, every which way, not along the lines of its grid.

### Under the hood
- The ring's small things are in its world store with everything else (`pkProp`, `PK_PROPS`).

## Uranus–Desdemona (2026-10-20)

- **Nothing shakes while a control is used.** Dragging a fader whose value is a name (Species, say) once resized its
  column, and every knob beside it moved; the columns are now a fixed width. The display line keeps its room and only
  fades in and out. A value is said once: on the display line while the control moves, at the fader's foot otherwise.
  The Controls heading counts its sliders only while it is closed.
- **Sliders that pick a kind** (a species, a world, a fabric) hold to their marks from the start (⊹ frees them), a
  fader is easier to take hold of, and nothing draws a box round a control your finger is on.
- **Knobs turn as a thumb moves round them**, in an arc: the angle swept about a knob's middle turns it by as much
  (near the middle, up and down still works).
- **Up to ten sliders a surface**, where the rack uses the room well; an Athanor graph's Knob has slots 1–10.
- **A locked control looks held**: it fades, its ring breaks into dashes, its reset with it.
- **Haptics on a phone**: a light tick as a tab changes or a drawer opens, and a good buzz when a long save is done.
- **The Painted Ringworld, reworked.** Straight ridges again, and the spans and bridges of light as they were.
  Everything stands in the world: trees, buildings, rocks, grass and the small things to find are sown in places of
  their own, so the camera sweeps and the world stays. It is painted as a game engine draws: what nearer hills and
  things hide is found first and never drawn, the rest painted back to front, each standing on ground that shows.
  Everything has a size in metres, so a cottage, a spruce and a tower stand in true proportion (no more buildings the
  size of shrubs), and a city rises away from you into a skyline. Works turned well down.
- **A far bigger painted kit**, shared by the Painted Ringworld, Ring in the Sky and Night City: 23 kinds of tree,
  chosen by the land's climate (dry country, warm, jungle, the cold heights, a magic world's fey places with giant
  mushrooms and crystal trees), and 31 of building, from cottages, barns, windmills and stave churches to pagodas,
  torii, castles, lighthouses, cathedrals, mosques, clock towers, factories, capsule towers, megablocks, geodomes,
  observatories and wind turbines. The wilds have villages and farms. Each stands where it belongs: lighthouses on
  the coast, windmills, turbines, castles and observatories on rises, barns and silos at a town's edge, cathedrals and
  clock towers at its heart; trees thin out round towns, and boulders gather under slopes.
- **The ring's walls and its unfinished stretches**: the rim walls are plated, and carry their builders' glowing
  script, the cities' and neon's screens, and graffiti at the foot; on some rings a stretch of the far floor was never
  laid, its bare frame showing, scaffolding along its edges and cranes leaning over it.
- **Robots and droids**, as life where they belong: helpers on one wheel and humming drones in the builders' and
  cities' worlds, sentries and stalking walkers in the neon, scavengers in the ruins, and now and then a giant fallen
  long ago, kneeling in the grass.
- **Drapery, a new surface**: a sheet of cloth simulated as it hangs or falls (from a rod in gathers, from two
  corners, from one, twisted, or seen from above over a hidden form, crumpled, laid flat) in nine fabrics, silk to
  velvet. Its weave follows every fold, and the Light Engine lights it from its maps: satin shines, burlap doesn't,
  light comes through the gaps. New parts for any graph: Drape, Weave Maps and Detail Normals.
- **Linen Tooth, remade on the cloth parts and the Light Engine**: cloth laid flat with the creases of having been
  folded and the soft rises of cloth set down, its threads woven as each of nine fabrics weaves them (silk to velvet),
  lit from its maps. Weave is now Fabric, and Details gives way to Creases; older looks keep their nearest fabric.
- **The sun can slip behind Saturn.** Turn the light dial until the sun meets it: Saturn turns its night side to you,
  ringed with lit air, its rings backlit and shining, a bead of light where the sun slips out.
- **The 3D Ringworld is retired**: it led to the Painted Ringworld, which takes its place. Looks made with it open as
  the Painted Ringworld, keeping their band, landforms, altitude, builders, camera and day.
- **Cartomancy on the Light Engine**: the table always blended over the page's own backdrop, the cards and coins lit
  from height and gloss maps, so their shadows, rims and shine follow the light dial.
- **Crystal Leaf, remade on the Light Engine**: a druse seen through its faces, the inclusions inside the stone, each
  face turning to the light on its own, the clear stone translucent, its fire a light of its own. The Light Engine
  takes a Normal Map.
- **Fairies**: now and then a small fairy light drifts over the Idyllic Meadow's grass or the Windward Sea, and one
  Macro Bloom visitor in 66 is a fairy. Fairy Light, a part for any graph.
- **Sounds, retuned**: home raised to D4, where a phone's speaker carries it; a knob's marks rise with its value, its
  ends knock, a reset falls a fifth; locks a latch, dice a tumble; bursts sound twice, then rest; nothing while the
  page is hidden, and the person's own music keeps playing where the browser allows.

### Under the hood
- `tools/still.mjs` sweeps every slider of every surface on a phone and names anything on the page that moves.
- paintKit.js: the painted things the three skylines share, each with a size in metres (`PK_SIZE`). Research: real
  sizes for 33 trees, 62 buildings, rocks and small things, and how games build big kits from few parts
  (docs/prior-art/painted-ringworld.md); cloth simulation, folds and woven sheen (docs/prior-art/cloth.md).
- Work happens on main now, without feature branches.
- Housekeeping: pruned the stylesheet.

## Uranus–Cressida (2026-10-20)

- **The surface's controls are a rack.** Its sliders are drawn as the light and camera dials are:
  - three or fewer sliders stay sliders;
  - four sit as knobs in a row;
  - with more, knobs cluster at the left and faders two rows tall at the right (the sliders with named marks), with
    any others as sliders underneath.

  Each control has a display line with its name, its value and − / + buttons, a ⊹ to reset it, and on a phone a
  haptic tick at each mark. Shape Strength shows only while Shape Aware is on, and a slider no longer keeps the
  previous surface's marks.
- **Floral Imprints, remade.** Whole plants of each species, laid as a herbarium sheet shows them, root down on the
  page: their habit, their leaves by outline, margin, division and arrangement, roots or bulb, buds and seed. They
  are developed in fifteen media, cyanotype to risograph, on the page's own colours.
- **Macro Bloom no longer crashes a phone.** It used far less memory, and a phone now works it on a smaller grid. A
  flower seen from the side sits on its stem with a calyx, and grows its own species' leaves, prickles and hairs.
- **Crystal Leaf's inclusions lie inside the stone.** The needles and bubbles are seen through the faces, bent where
  each face tilts and tinted by the stone. Bubbles are drawn as quartz holds them.
- **The Windward Sea's wind is about a third calmer**, with fewer and shorter gusts.
- **The interface evens out:**
  - the search fields wear every field's skin and no longer look disabled;
  - menus and text fields stand the same height;
  - Share, Sound, Haptics and Hints read as their neighbours do;
  - the preset buttons (Summon Variation, Mutate Gently, Freeze This Seed) speak in the buttons' small capitals;
  - the preset groups lose their counts;
  - the surface menu's group names sit flush under its search.
- **Sliders that pick a kind are marked**, Species and Chladni's Mode among them. Feathers' Markings are named Light
  and Bold Bars.
- **An old Instrument Panel loses its rune names** wherever it was saved: in the Grimoire and in the draft.

### Under the hood
- New parts:
  - **Grass Blades**: toon grass blade by blade, for any surface with grass in it.
  - **Specimen**: whole plants.
  - **floraKit.js**: what Bloom and Specimen share.
- Phone memory:
  - a canvas read back by the Athanor is let go at once;
  - outputs that no part reads are dropped;
  - every phone works graphs on a capped grid.
- Plans: every surface brought onto the new renderer (docs/renderer-pass.md), and new scenes to build
  (docs/scene-ideas.md). Both sit in the roadmap before the presets.
- New research, every claim with its source:
  - botanical specimens;
  - interface sound;
  - cel-shaded wind and grass;
  - painted worlds and camera-stable placement.
- Housekeeping: reviewed the tests:
  - the list naming each surface's slider count became one rule (two to eight sliders);
  - the rack's rule has a suite of its own;
  - nothing else had outlived what it tests.

## Uranus–Bianca (2026-10-20)

- **The tab bar lines up**: the five tabs were already the same width, but
  their glyphs were drawn at different sizes (the Inscription knot small,
  the Rituals pentagram and the Materia diamond large) and the Thoughtforms
  glyph sat low; each glyph now fills the same box at the same centre, with
  the same weight of line, and a faint line parts the tabs, as the app's
  other buttons are parted.
- **The editor is called Inscription Editor (PML).**
- **Controls is plainly a drawer**: a bar across the panel with room above
  it, saying how many sliders it holds and with a chevron at its right,
  shut or open.
- **Opacity stops short of the edge**, as every other slider now does.

## Uranus–Ophelia (2026-10-20)

- **An eye on the Incantation Editor** takes the poem off the page and puts
  it back; its words stay in the editor, and a saved look remembers it.
- **Script Highlighting is an eye**, and every other checkbox is now a
  switch: an eye wherever something is shown or hidden, a switch wherever a
  feature is turned on (Text Aware, Shape Aware, Cut Out by Text, Blend with
  Text, Custom Resolution, Points Outward, Rounded Corners, Shape Linked to
  Border, Full-Size Preview). The Athanor's Steps is an eye too.

## Uranus–Cordelia (2026-10-20)

- **The camera's Zoom is a slider above its dial**, where the light's Main
  and Rim sit, so the two dials stand level and take the same room; the
  Zoom box beneath is gone (the slider, a wheel or a pinch on the dial
  zoom as before).
- The first release named for a moon of Uranus.

### Under the hood
- Four checks kept in the repo instead of rebuilt each time: shipping a
  release (tools/ship.sh), the registry as data for before-and-after
  (tools/snapshot.mjs), the GPU's results before and after
  (tools/gpu-ab.mjs) and the page on a phone (tools/phone-shot.mjs).
- New research, every claim with its source: synth and image-synth control
  panels, touch knobs, faders and haptics on the web
  (docs/prior-art/synth-controls.md); photographic floral imprints in many
  media and ornamental borders (docs/prior-art/floral-imprints.md,
  docs/prior-art/ornamental-borders.md); and real-time painterly rendering
  on phones, for the game someday (docs/prior-art/realtime-game.md).

## Saturn–Thiazzi (2026-10-20)

- **The surface's sliders sit under one heading, Controls**, that folds
  shut and stays the way you left it; Opacity stays outside it, always in
  reach.
- **A little room on the right to scroll with** on a phone: the panel keeps
  a slightly wider margin, and every slider stops a few pixels short of the
  edge.

### Under the hood
- After Saturn's moons, the releases take Uranus's names, then Neptune's.

## Saturn–Geirrod (2026-10-20)

Nothing you see changes in this release: it is the rest of the work to make
the code smaller and simpler, with every surface drawing exactly as before
and every control behaving as it did.

### Under the hood
- The interface's code is split along its sections: appEvents.js keeps the
  wiring (every listener and every call made as the page starts, in the
  same order) and goes from 4,805 lines to about 1,550; its functions live
  in eleven modules beside it (the look, locks, layers, the surface's
  controls, the dials, the layout, history, dialogs, the Athanor's place in
  the page, the other controls, the working line). Those modules hold
  declarations only, and a test keeps it so.
- Reviewed the tests: every suite shares one check harness instead of its
  own copy, and the few checks that read the interface's code read all of it
  as one. A new click-through check (tools/smoke.mjs) presses every kind of
  control on a desk and on a phone and reports any page error: none, before
  the split or after.
- The protocol: AGENTS.md keeps the rules (2,061 lines → about 920); the long
  reference moved beside it to docs/ (light, the page's machinery, the
  Athanor's graphs and editor, each surface's notes, the pitfalls), read when
  its subject is touched.
- One review sheet for every round (tools/review.mjs): a surface's four
  readings, four seeds, the light turned round and the camera moved, and with
  `--ref` the older readings above them.
- The changelog keeps the newest twenty releases; the older ones are in
  docs/changelog-archive.md.
- An unused helper (a moon glyph as a data URI) was found and removed.

## Saturn–Alvaldi (2026-10-20)

- **The page is half the size**: 2.7 MB instead of 5.6 MB (about 0.8 MB
  instead of 1.7 MB as it travels), so it opens sooner, above all on a
  phone. The surfaces' code used to come twice, once for the page and once
  for the background worker that paints them; it now comes once and serves
  both. The notes written in the code stay in the code and no longer travel
  with the page. Nothing you see changes: every surface draws exactly as it
  did.

### Under the hood
- Smaller and simpler (docs/SIMPLIFY.md), each step proved to change no
  picture: the surfaces' dispatch is one table; each part's description is
  written once (its wiki line); the chains take their sliders' names and
  defaults from the slider list instead of repeating them, and a wire names
  a setting by its key; the slider list is compact (its own file), with the
  blend lists named; every Athanor part is one object, as the families'
  parts already were; WebGL is opened one way, and the worker holds one
  context for the lighting and the GPU passes instead of two.
- Tests reviewed: they now run two at a time and each is timed (the full
  run takes about 3 minutes); `sh test.sh --quick` leaves out the four slow
  texture suites while working. The build proves the page without comments
  is the same code, token for token and line break for line break.
- Stylesheet pruned (tools/css-prune.py: nothing left to remove).

## Saturn–Skrymir (2026-10-19)

- **The light selector says Main and Rim again**, and where the dial moves
  something other than the light, Main says what, in one word: Pos on the
  Black Hole, Wind on First Snow, Rain on Harsh Rain, and so on.
- **Panning the Scrying Pool is steady.** Its waves, stones, fish, weed and
  leaves now stay where they are in the pool as the camera turns, tips or
  zooms (they used to be thrown afresh across whatever the camera saw), and
  the quick draft while you drag shows the same pool as the finished
  picture.

## Saturn–Gunnlod (2026-10-19)

- **New surface: Sunrise Scroll**, the second love letter to a video game:
  a land painted in ink on old paper, in Places & Scenes. Mountains stand
  band behind band, washes of ink lit in flat bands, the far ones craggy,
  their ridges brushed thick and thin with dry-brush breaks, their feet
  fading into mist; a woodblock print's graded sky, a red sun the light
  dial sets behind the peaks, long rounded bands of mist, cherry petals,
  and paper darkened at its edges with age. Readings: Spring Scroll,
  Vermilion Dusk, Indigo Print and Bare Ink.
- **The camera dial and the light selector always show**, faded when a
  surface doesn't use them, so the Materia panel keeps its shape from
  surface to surface; the surface's colours sit in two columns beneath
  them. The light selector's buttons say what they move: Main Light and
  Rim Light.
- **Positioning is the camera dial's**: the Transmutation Circle is placed
  with the camera dial (its turn the way from the middle, its view how far),
  with a guide on the page; Rain on Water's View and the Painted
  Landscape's Tilt are the camera dial's View. Saved looks keep their
  pictures.
- **Opening the page with a saved surface**: Materia's controls match it
  at once (on a phone, Firefox could put old values back after the page
  had loaded; the controls are read again then, when the page comes back
  into view, and each time Materia opens).
- **The instrument panel** no longer spells out every rune's name beside
  the spell.
- **Under the hood:** reviewed the tests. The generator smoke test takes
  its surfaces from the registry (every one, at a tiny size, with fixed
  seeds; it had a hand list that still named a retired surface) and draws
  the two production sizes for three surfaces instead of sixty renders:
  about 9 seconds. A proposal for a smaller, simpler app, its tests and
  its protocol is written up (docs/SIMPLIFY.md, ROADMAP S).

## Saturn–Gerd (2026-10-19)

- **Macro Bloom is drawn in depth order, and casts its shadows from the
  depth.** Everything nearer the lens is drawn over what lies behind it, and
  the same depth gives the shadows, as a game engine's depth buffer does: a
  leaf crossing near the lens shadows the petals, an insect shadows the
  petal it stands on, and all of it turns with the light. The far
  background is too far away to catch a flower's shadow.
- **Back in Macro Bloom**: the stem (the seed's whether), leaves overhead
  as well as a blade of grass between the sun and the flower, and now and
  then that blade or those leaves crossing the frame near the lens, blurred
  by it.
- **The Athanor holds up to 255 parts.** A slow surface now comes in two
  stages: a quarter-size draft at once, then the full picture.
- **Large graphs on Firefox on a phone**: a part's scratch canvas gives its
  memory back as soon as it has been read, and there a graph works on a
  grid of at most a megapixel, drawn up to the page. A render that runs out
  of memory is tried again at half size instead of taking the page down.
- **Step previews**: above 150 parts they rest; below, the whole sheet of
  them is at most 512 pixels a side.
- **Under the hood:** pruned the stylesheet (every declaration it questioned
  still mattered somewhere; nothing removed). The test canvas keeps what was
  drawn on a canvas that has been given back, so the knob probes still see
  it.

## Saturn–Beli (2026-10-19)

- **Macro Bloom is seen through a real lens.** Everything in the picture
  has a depth, and one lens focuses it all: points in front of the focus
  blur quickly, points behind it soften to a limit, and the lights behind
  the flower become round discs. On a device with a graphics chip the lens
  runs there.
- **The camera dial frames the flower**: Zoom goes from the whole flower in
  its setting to its heart filling the page, View tips it from face-on to
  the side, and Turn says which way it tips and moves it toward that
  side's third. A wireframe of its rim and heart shows where it will be
  while the dial moves. Each seed starts from its own shot.
- **Every slider does one thing**: Species, Stage, Aperture (how wide the
  lens is open: the only blur control), Focus (where the plane of focus
  lies), Lights Behind (how many points of light become discs), Dew,
  Translucency and Visitors.
- **Insects are rare and smaller**: about one seed in eight at the default
  Visitors, never more than two, each on a petal partway out from the
  heart, a quarter smaller than before, lit with the flower.
- **New part in the Athanor: Lens Blur.** A picture and a depth map, a
  Focus and an Aperture: the focal plane of a real lens, with round or
  bladed discs. Bloom has a new Head Turn setting.

## Saturn–Angrboda (2026-10-19)

- **A reload brings back the page as it was left.** The surface, its
  sliders and their names come back whatever the poem is: an empty page
  stays empty, and the welcome poem stays the welcome, each at the look it
  was left at. Before, an empty poem or the welcome poem opened on the
  opening look, and the browser then put back the old slider values on its
  own, so the controls named one surface while another was drawn. Now, once
  the page has loaded, the controls are read again as they stand, so their
  names, readouts and hues always match what is drawn. For a fresh start,
  use ⟲.

## Saturn–Eggther (2026-10-19)

- **New surface: Windward Sea**, the first love letter to a video game: a
  sea and sky in the cel-shaded look of the great sailing games, in
  Places & Scenes. Light falls in a few flat bands (Toon Bands), never a
  gradient. Clouds heap above the horizon and curl into swirls; foam and
  the waves' long white lines grow smaller toward the horizon; islands
  stand on it; the sun follows the light dial and sets into the sea as
  the light sinks.
- **The weather is the seed's**: clear, fair, overcast, or now and then a
  storm, with a slate sky, a choppy sea and wind everywhere. The Weather
  knob leans it fairer or stormier.
- **The wind is drawn in the world, not on the sky**: ribbons that run
  with the wind and end in tightening curls, near ones large and far ones
  small, twisting to show both faces, lit in the same bands as the
  clouds.
- Four readings: Fair Wind, Sunset Sail, Squall and Morning Breeze.
- **New part in the Athanor: Streamers.** Ribbons swept along curves in
  3D space (a gust with a curl, a spiral, a loop, a wave) and seen through
  a camera; it hands on maps (the ribbons, how they face the light, which
  face shows, how near) for a graph to light.

## Saturn–Gridr (2026-10-19)

- **Macro Bloom has visitors.** Most seeds bring something near the
  flower's heart, as real macro photographs so often do: a ladybird, a
  jumping spider, a hoverfly, an ant, aphids, a fallen petal or a seed's
  fluff, in a new Visitor Hue. Each is lit with the flower: a ladybird's
  shell shines, a spider's eyes catch the light, a hoverfly's wings let it
  through, and each casts its shadow on the petal.
- **Dew drops are little lenses**: a dark rim, a highlight, and a bright
  tail beyond each drop where it focuses the light.
- **Shadows from outside the frame**: a blade of grass or leaves between
  the sun and the flower cast a soft shadow along the light, and now and
  then cross the frame close to the lens.
- **Typing redraws sooner**: the page is drawn 250 ms after the last key.
- The Second Bokeh Hue is replaced by the Visitor Hue; the second bokeh
  now follows the first and the key light.
- **Under the hood:** reviewed the tests. The knob probe now sees a
  picture stamped at a size (the flowers' petal sizes were invisible to
  it), and draws at 360 px instead of 600 (as telling, and the slowest
  suite a fifth quicker); the tests that named the Emotional Seed now use
  other starters; the starter and texture counts follow what is there.

## Saturn–Fornjot (2026-10-19)

- **Typing and sliders are quick again on a phone.** Nothing redraws while
  a hand is on the controls: the page is drawn once they have rested for a
  moment (150 ms; typing waits 400 ms, since keys come slower). The poem
  editor redraws once a key instead of three times, and only the line that
  changed. On a phone-speed processor, dragging a slider went from 30–86%
  busy to 4–7%, and typing from 45% to 24%. With nothing touched, the page
  does nothing at all.
- **New surface: Liminal Spaces.** An empty place built for passing
  through, seen as a camera sees it: a lobby, a warehouse, tunnels, the
  poolrooms, a hotel corridor, a school, a hospital, a subway, a garage, a
  mall or an office, each laid out by the seed, its lamps and where the
  camera stands. The camera dial looks round.
- **New group of surfaces: Flowers**, with Lotus Pond and seven new ones,
  all drawn from 23 real species:
  - **Floral Imprints**: cyanotypes, inked stamps, a crest folded from one
    flower, or flowers pressed on the page.
  - **Bouquets**: a posy, a bundle, a crown or a wreath.
  - **Fallen Petals**: wilting flowers and petals on wood, linen or stone,
    browning as they age.
  - **Meadow**: a wildflower meadow seen from inside it, a hedgerow along
    the horizon, fields beyond, the nearest grass out of focus.
  - **Macro Bloom**: one flower close, framed by the seed from the whole
    flower to its heart filling the page, lit like a real material: light
    wraps round its petals and comes through them in their own colour when
    the light is low or behind, showing the veins.
  - **Ditsy Print**: tiny flowers and sprigs all over cloth.
  - **Botanical Line**: plants drawn in a fine ink line, with a loose wash
    of colour or none.
- **Veins of Light is back, remade as a network**: lines that join up into
  loops, as a leaf's veins, a slime mould's tubes, a street plan or a
  circuit do, each as wide as the flow it carries, from organic curves to
  circuit traces with pads, buses and pulses. It glows more as the light
  sinks. Eight knobs and six hues; readings Circuit Marble, Leaf Lumen and
  Undercity.
- **New parts:** Room Caster (an empty interior, ray-cast), Bloom (a flower
  of a real species, or a sheet of them; it can hand on its colour unlit,
  with maps of its shape, gloss and thinness, for the Light Engine to
  light), Network (a graph with loops). **Better parts:** Scatter throws a
  picture or a sheet of pictures, black as clear, with clean edges; the
  Light Engine's Translucency can be a map, light coming through thin
  parts in their own colour.
- **The Surface menu is regrouped**: Burnt Letter and Cup Ring are with
  Paper & Grounds, Veins of Light and Moss on Stone with Grown & Generated,
  Knotwork with Pattern & Order; Light, Sparks & Dust is now Light, Dust &
  Feathers; some starters and studies moved to where they belong.
- **Removed**: the Emotional Seed part and its starter, Weather of Feeling.

## Saturn–Loge (2026-10-19)

- **Your credit is remembered.** The name or handle signed on the image is
  kept in this browser, so every visit starts with it. Presets, spells and
  shared looks never change it; clearing the field clears it.

## Saturn–Ymir (2026-10-19)

- **New surface: Pixel Space.** Space in pixel art, after the generators
  pixel artists use: a nebula, worlds and stars on a grid of square pixels,
  stepped into bands with dithered seams, every colour from six hues. The
  seed picks the scene: a nebula band, drifting clouds, a veil of
  filaments, a galaxy (alone, or lying in the band), a ring nebula round
  its star; and the worlds: none, one, a close one cropped by the page, a
  horizon, an eclipse with its corona, a belt of rocks, a little system, a
  black hole with its glowing disc, a pulsar with its beams. The light dial
  moves the nebula's rim and every world's lit side. Clouds are never
  white; white is for stars, a galaxy's heart, a corona.
- **New surface: Webb Sky.** Deep space as the Webb telescope sees it:
  dust lit from inside in smooth gradients, stars with six long spikes and
  two short ones, small galaxies behind everything. The seed picks the
  dust: globules streaming away from the light, cosmic cliffs, a shell
  round a dying star, smoke, or a deep field of galaxies with lensed arcs.
- **New parts:** Orbs (worlds in the dial's light, with rings, moons,
  eclipses, black holes and pulsars) and Diffraction Spikes (a telescope's
  starfield, Webb's spikes or Hubble's).
- **Better parts:** Posterize can dither where two steps meet (ordered,
  checker or scattered, on Pixelate's cells); Pixelate can let each cell
  take its brightest point, so a tiny star still lights a pixel; Scatter
  can count its marks for the whole page; the Light Dial part has a Way
  output, the way the light travels, as Motion Blur and Smudge read angles.
  A graph with Pixelate in it is enlarged pixel for pixel.
- **The Black Hole** is placed by the light dial now: its way from the
  page's middle, and how far out. Its disc's wireframe stands where the
  hole will be while either dial moves. The seed adds more: hot spots in
  the disc, more or less nebula and dust behind, and sometimes a galaxy
  right behind the hole, bent into arcs. Older looks keep their camera,
  the hole at the page's middle.
- **The hues are grouped**: Light Colors (main, rim and ambient light,
  beside the dial), Surface Colors (the surface's own) and Material Colors
  (glow, shine, shadow), each under a small heading.
- **Starters and Surface Studies sit with their kind** in the Surface menu
  and the Athanor's Open drawer, marked as a starter or a study; screen and
  signal studies have a group of their own, Screens & Signals.
- **Dappled Leaves and Window Light** throw their light along the dial, as
  they should have (they were a quarter turn off).
- **The Painted Landscape's sun** follows the light dial.
- **Punctuation Particles** no longer spark on an apostrophe inside a word.
- **Writing on a phone:** the preview's divider can be dragged again while
  the keyboard is up; a double-tap gives back the dozen lines.
- Under the hood: a stray link was taken out of the repository, and
  shipping now refuses one. Floral prior art written for the floral
  surfaces to come.

## Saturn–Kari (2026-10-19)

- **New surface: Feathers.** Procedural feathers on a transparent ground,
  to lie on the page's colour or over another surface: shafts and barbed
  vanes that split and fluff to down at the foot, lit by the light dial and
  lifted off the page by their shadows. Sliders for size, how many, fluff,
  curl, splits, markings (bars, or eyes near the tips), depth and lift; six
  hues colour all of it, a faint sheen included.
- **New surface: Corvid Feathers.** The crow family's feathers, the bird on
  a slider: crow, raven, magpie and blue jay. Their sheen is structural
  colour, as a real feather's is: it turns between two sheen hues with the
  angle to the light dial, strongest on the raven. Every colour is a hue.
- **New group, Light to Lay Over,** four surfaces of light made to blend
  over a page or another surface: **Dappled Leaves** (sunlight through
  leaves, the shadows thrown along the light dial and stretched as it
  lowers, the sun's round spots between), **Window Light** (a window's panes
  thrown across the page, a plant on the sill sometimes), **Pool Caustics**
  (the bright net rippling water casts) and **Light Leaks** (film's warm
  leaks, in three hues). Each is built in the Athanor from general parts, so
  each opens there as a graph to take apart, and the seed changes them:
  how many panes and where the window falls, which edge the light leaks
  from.

## Saturn–Surtur (2026-10-19)

- **A surface can have up to six hues of its own.** Where a surface draws
  more colours than two, each gets its own picker under Surface, named for
  what it colours, starting at the colour it was designed with. They are
  saved with the look, carried by its readings and by the lower surface,
  and locked like the others.
- **In the Athanor, a Hue part reads any of the six.** A graph shows a
  picker on the page for every Hue slot that reaches its Surface.
- **Under the hood:** reviewed the tests. The phone suite checked twice that
  the download button sits in the preview frame (once its rule, once its
  markup); it is one check now.
  The prior-art research for the liminal spaces is kept in the repository
  (docs/prior-art), and looking up the prior art is now the first step of
  making any new surface.

## Saturn–Fenrir (2026-10-19)

- **The light dial's handle reaches the ring again.** At full height it
  sits on the ring, under your finger, and past the rim (on surfaces lit
  from below the horizon) it goes on outside it, to the dashed circle. The
  camera dial's handle does the same. The halfway mark moved out with it.
- **🜚's curls grow as the light lowers:** small with the light high,
  flaring as it sinks toward the horizon.
- **Where the main and rim shadows cross on the dial, they mix to white**
  (black on a light theme), as the two handles do.
- **Under the hood:** pruned the stylesheet (every declaration it questioned
  still mattered somewhere; nothing removed). The roadmap records Ruby's rules
  for the new surfaces: built in the Athanor from general parts, varied by
  the seed, every colour on a hue input.

## Saturn–Bestla (2026-10-19)

- **The Black Hole is seen from the camera dial.** Its Turn turns the disc
  in the sky, its View tips it from face-on at the middle to edge-on at the
  rim, and its zoom brings it closer. While the dial moves, a wireframe of
  the disc shows over the page. Looks and presets made before keep their
  pictures.
- **Crystal takes the rim light and the Ambient slider.** Its facets light
  with them, as the other engine-lit surfaces do.
- **Seven more surfaces can be lit from below the horizon:** Veins of Light,
  Knotwork, Lichtenberg, Ruffled Growth, Cells, Painted Landscape and Rain on
  Water. Their light dial can be pulled past its rim for the low, raking
  light the others have.

## Saturn–Aegir (2026-10-19)

- **The light dial shows on the page what it places, before the picture is
  made.** While the dial moves, and until the new picture has landed, a
  guide over the page shows:
  - the light, as a sun where it comes from, on every lit surface (the rim
    light's too, in its own colour);
  - where Crackle's cracks burst from;
  - where the Transmutation Circle stands, and how big it is;
  - how the Black Hole's disc is seen;
  - the way the wind, rain, flow or pigment runs (Snow, Harsh Rain, Flow
    Lines, Silk Ribbons, Watercolour Wash), and the line the strokes lie
    along (Silverpoint Hatch, Suminagashi, Aurora).
- **The camera's wireframe stays up until the picture has landed** too,
  instead of fading after a moment.

## Saturn–Thrymr (2026-10-19)

- **The light dial's handle is the light.** Drag it round like a lamp
  round the page: every surface is now lit from the handle's side, and its
  shadows fall the other way. Many surfaces had been lit from the opposite
  side (Crystal, Spangle, Crackle, Cells, Turing Pattern, Stained Glass,
  Old Paper, Linen and others). Looks, presets and readings made before
  keep their pictures: their light is turned half round when they open, so
  the handle now stands where their light really is.
- **🜚's spike points where the shadows fall,** out of the dial's far side
  from the light. The rim light has a spike of its own, in its colour.
- **Water's shadows fall away from the light** too. Ringworld's land is lit
  from the handle's side, a little.

## Saturn–Farbauti (2026-10-19)

- **`$` works wherever `§` does in PML.** `$moon`, `$spell` and the other
  names are filled in just as `§moon` is, and the editor colours them the
  same. A `$` that isn't one of the names (a price, `$5`) is left as it is.
- **The rim light has its own strength slider.** With Rim chosen above the
  light dial, the slider and number under it set how bright the rim light
  is (0 turns it off); with Main chosen they are Ambient, as before. The
  rim handle on the dial fades as the rim light weakens, and the rim light
  has its own spike, in its own colour.
- **The light and camera dials sit level** side by side, also when Main /
  Rim is showing above the light dial.
- **Writing on a phone keeps more of the preview.** While the keyboard is
  up, the poem keeps about a dozen lines and the preview takes the room
  above them, instead of folding to a strip.
- **The PML guide opens over the preview while you write on a phone,** and
  the keyboard stays up, so the poem stays where it was.
- **The ⓘ hints button goes dark when you turn hints off** on a phone. A
  tap had left it lit.
- **Under the hood:** reviewed the tests. The check that the die's words
  live in strings.js read the app's source from the interface suite; it is
  with the other source checks now, as the invariant it is. The new rim
  controls are listed as views of the rim light's colour in the
  persistence check.

## Saturn–Hati (2026-10-18)

- **The saved image's text is the size the preview shows.** Max Text Size
  is in the saved image's pixels, but the preview, drawn smaller, used it
  as its own, so its cap was two or three times too generous: when the
  margins and Breathing Room left room for the poem to grow past the cap,
  the preview showed it bigger than the image saved. The preview now
  scales the cap, and steps through text sizes in the saved image's
  pixels, so both pick the same size.

## Saturn–Suttungr (2026-10-18)

- **Ring in the Sky has depth.** The ring is a solid band now, not a flat
  disc: its land runs along the inside, facing the star; a rim wall stands
  in from each edge to hold its air, its top catching the light; across the
  near side you see the band's hull, its panels lit by the light dial. It is
  seen in a gentle perspective, so the near side is nearer and larger than
  the far. The camera dial's View now raises your eye above the ring's
  plane: low, the band crosses in front of the star like a wall; high, you
  look down into it. The camera's wireframe guide matches the new ring.
- **Border Options and Inset Box no longer open empty** while switched off.
  A section switched off by the eye in its heading (Surface, Border, Inset
  Box, Vignette) shows its controls faded, under a line that says it is off;
  changing any of them switches it on. The dice never switch it on.
- **The sun guide points the way the light dial does** on a tall page. It
  had stood nearer upright than the dial.
- **Shape Strength sets how far a surface built on The Poem keeps clear of
  the words** (Ripples from the Words, Circuit Board, the starters and your
  own graphs). At 100% it keeps its own margin; lower, the margin shrinks
  toward the letters; at 0% nothing is kept clear. With Shape Aware off, a
  graph keeps its own margin, as before. Rings and fades farther out keep
  their spacing.

## Saturn–Narvi (2026-10-18)

- **Every Athanor starter and Surface Study is in the Surface menu**, to try
  on the page without opening the Athanor: 🜈 Athanor Starters (Weather of
  Feeling and Punctuation Particles among them) and 🜍 Surface Studies, each
  with its picture. Choosing one puts it on the page, its knobs on the
  sliders and its hues on the pickers, as choosing one of Your Surfaces
  does. New Random Surface and the dice pass over them.
- The starters wear 🜈 in the Athanor's Open too (🝆 is Grown & Generated's).
- **Under the hood:** the open issues trimmed to what is still open, and a
  standing rule to keep them so.

## Saturn–Bergelmir (2026-10-18)

- **The Emotional Seed**, a new part under Page Inputs: one feeling, from
  calm to fierce, turned at once into a color and three numbers, Density,
  Turbulence and Contrast, to wire into any settings. Wire a Knob into its
  Feeling and one slider on the page moves them all together.
  - Its Mood says how each answers: a **storm** gathers fast and hardens
    toward red; **joy** fills and brightens toward gold; **longing** empties,
    stirs a little and blurs toward a deep blue.
  - **Accents** runs from the page's Conjunction Hue (calm) to its
    Opposition Hue (fierce); **Page Hues** from the surface's second hue to
    its first, and puts both pickers on the page.
  - A Curve wired onto a number's port reshapes how that number answers
    the feeling.
  - New starter, **Weather of Feeling**: one Feeling knob sets a cloud's
    color, size, roughness, swirl and contrast.
- **The Poem knows where the punctuation is.** The page now records where
  every comma, full stop, dash, quote and bracket sits, and The Poem has a
  ninth output, **Punctuation**: a soft glow on each mark.
  - Its **Punctuation** setting picks which marks glow: every mark, the
    stops, the pauses, the dashes, or the quotes and brackets. **Punctuation
    Glow** sets how far each glow reaches.
  - Into a Scatter's Where, marks are thrown from the poem's punctuation.
  - New starter, **Punctuation Particles**: sparks thrown from every mark,
    lit by the dial.

## Saturn–Mundilfari (2026-10-18)

- **The Painted Ringworld's sun is where the light dial puts it.** The
  dial's direction is where the sun stands around you, read the way the
  camera dial's turn is read: turn the camera to the light's angle and you
  face the sun. Turning the camera now turns past the sun instead of
  carrying it along. The dial's height is how high it stands: at the middle
  it is overhead, the ring's own star on the arch; at the rim it sets on the
  horizon; past the rim it is night. The land, the things on it and Saturn
  are lit from the sun's side, so the light always comes from where the sun
  is.
- **A sun guide on the image while the light dial moves**, drawn at once
  before the surface is made, as the camera's wireframe is:
  - On the Painted Ringworld, the sun where it will stand in the picture,
    with an arrow at the edge when it is out of the frame.
  - On any other surface lit by the dial, a sun where the light comes from:
    the middle of the page when overhead, the edge at the dial's rim.
  - The rim light's own sun shows in its own color.
- **Under the hood:** reviewed the tests. Old looks are checked in one
  place, with every other old look. A retired suite's two checks moved:
  the stylesheet's fallbacks to the invariants, its count of dead rules to
  the hygiene checks. The color pickers' alpha sliders are tested on the
  booted page rather than in the code. The check that no suite reads a
  surface's code also sees the suites' own helpers. The lit surfaces'
  response to the page's lights is measured on real pixels.

## Saturn–Tarvos (2026-10-18)

- **A rim light on the light dial.** Surfaces lit by the dial now have a
  second light: a second handle on the dial, in the second accent color,
  under the first. **Main** and **Rim** above the dial choose which one your
  finger moves. Moving the rim light turns it on; ⟲ with Rim chosen turns
  it off. It casts its own shadows and catches its own shine, so the edges
  facing it light up. Where the two handles overlap they mix to white (to
  black on the Vellum theme), as two lights do.
- **The Ambient slider** sits under the dial, as the camera's zoom does: the
  light from everywhere. Halfway is the surface as it was; to the left the
  shadows deepen, to the right they soften.
- **The lights' colors sit beside the dial:**
  - **Main Light Hue**: the dial's light (it was Diffuse Hue on the surfaces
    that had one, and is now on every surface the dial lights).
  - **Rim Light Hue**: its alpha is how strong the rim light is, and the row
    fades while it is off.
  - **Ambient Hue**: the color of the fill, strongest in the shade.
- These are on 25 surfaces, among them Kintsugi, Moss on Stone, Dune
  Ripples, Poured Wax, Turing Skin, Painter's Frustration, Lichtenberg Figures, Cold
  Press, Old Paper, Circuit Board and the Athanor's own. Each surface keeps
  its own lights, Two Surfaces too. At their defaults every look draws
  exactly as before.
- **On a desk**, a surface's hues sit in two columns under the dial.
- **In the Athanor:** with no Second Light of its own, the Light Engine takes
  the page's rim light as its second light. Its empty light hue and ambient
  hue inputs take the page's hues.
- **Under the hood:** pruned the stylesheet (every rule it questioned still
  does something, so nothing was cut); the rim light runs on the graphics
  card as it does on the processor, line for line.

## Saturn–Jarnsaxa (2026-10-18)

- **Fixed:** in Firefox on a phone, tapping a section's name (Border
  Options, Inset Box, Vignette) did not open it. A section's name now opens
  and folds it in every browser; a tap on its eye, die, lock or ⓘ still
  only does that control's work.
- **More room on a phone:** the line under each tab saying what it holds is
  gone.
- **Cut Out by Text** sits on Shape Aware's row, at its right; Shape
  Strength has the row beneath to itself.

## Saturn–Hyrrokkin (2026-10-17)

- **A second light in the Athanor.** The Light Engine can light a surface
  from a second way, as a photographer's rim light, fill or backlight:
  - **Second Light**: how strong (0 is none, as before; below 0 it draws
    light out, for a shadowed side darker still).
  - **Second Light From**: where it comes from, turned from the dial's
    light (180: straight behind).
  - **Second Light Height**: read as Light Height; past 100 it only grazes
    the edges facing it, a rim.
  - **Second Light Softness**: a point or a broad light.
  - **Second Light Gives**: light and shine, the light alone, or the shine
    alone.
  - A **second light hue** input for its color: a cool rim against a warm
    key is the classic portrait's light.

## Saturn–Greip (2026-10-17)

- **See what a surface is made of.** A menu under the Athanor's preview
  shows one channel at a time, as Filter Forge's do:
  - **Final**: the picture, lit.
  - **Height**: what is wired into the Surface's Height, as gray.
  - **Normal**: the slopes it makes, as a normal map's colors.
  - **Occlusion**: the shade in the hollows.
  - **Specular**: the shine.
  It is only a view: the page always shows the final picture. Normal,
  Occlusion and Specular are drawn at full contrast, so you see where each
  falls. The wiki's Height maps and light page explains each.
- **Colored ambient light.** The Light Engine has a new input, **Ambient
  Hue**: the color of the light that comes from everywhere (a blue sky's, a
  warm room's). It tints the shaded sides most. Left empty, nothing changes.

## Saturn–Tarqeq (2026-10-17)

- **Ringworld orbits Saturn too**, one ring in four: Saturn hangs huge in
  the sky beyond the ring, banded and ringed, lit by the ring's star, with
  the rings' shadow across it and its own across the rings. It stands fixed
  in the world where the opening shot looks, so the first picture shows it
  and turning the camera turns past it; the shadow squares and the day's air
  pass in front of it. Now and then Enceladus is beside it. Ringworld View's
  new **Saturn** setting in the Athanor chooses: by the seed, never, or
  always.
- **Smoother edges** on Knotwork, Contour Map, Ruffled Growth, Fractured
  Glaze, Stained Glass, Dewy Webs, Rain on Water and Circuit Board (as Ruby
  chose from the sheets): their Surface's Anti-aliasing is now edges only,
  so lines and borders that ran at a slant no longer come out in small
  steps. Most take a little longer to make; Stained Glass takes no longer.
- **Saturn among the stars is now faint under an atmosphere:** in Aurora's
  sky it is a dim point, as Saturn is from the ground; out in space (Ring in
  the Sky) it is still a small ringed disk.
- **Under the hood:**
  - reviewed the tests: checks that read the app's source where behavior
    could be tested now test the behavior (the Athanor's graph is no undo
    step, the sound settings stay out of a look, kept surfaces rename their
    Surface, the preset tiles' frames and glyphs, the readings' marks); checks
    of things long gone and copies of other suites' checks are gone; two
    pitfalls joined the invariants (Drawflow's escaped lookups; highlighting
    never moves text, now one check over every PML mark); suites named for a
    pass are named for what they guard, and the slow ones say why. What is
    left for the next review is in OPEN-ISSUES.

## Saturn–Siarnaq (2026-10-17)

- **The Painted Ringworld orbits Saturn**, one ring in four: Saturn hangs
  huge in its sky beyond the far arch, its rings open, lit from the ring's
  star, with the arch and its haze passing in front. Now and then Enceladus
  is beside it, its plume rising. The Arch's new **Saturn** setting in the
  Athanor chooses: by the seed, never, or always. A kept graph with The
  Arch in it shows Saturn on the same seeds; set Saturn to never for the
  sky it had.
- **Easter eggs**, rare:
  - On rings that don't orbit Saturn, the far planet is now and then
    Saturn.
  - About one starry sky in thirty-six has a small Saturn among its stars
    (Aurora, Ring in the Sky, the Painted Ringworld, any graph with a
    Starfield).
  - Circuit Board's Markings now and then print a stamp about Saturn,
    Enceladus or the old stories of space, and a little picture of
    Enceladus.
  - Pictures without an egg draw exactly as before.
- **Under the hood:** the Athanor's Anti-aliasing (edges only) is about
  twice as fast on pictures full of edges, with the same result.

## Saturn–Skoll (2026-10-17)

- **Plainer words** (from the usability review, as approved):
  - **Credit** (was Witch / Artificer) starts empty, with "Your name or
    @handle" as its hint. Empty signs nothing.
  - **Text Color** 1–4 (was Inscription Hue), **Gradient Text?** (was Radial
    Gradient Text?), **Background Gradient?** (was Radial Aura?), **Gradient
    Stops** and **Gradient Stop** 2–4 (were Aura Stops).
  - Dialog buttons say what they do: **Save Look** / **Cancel**, **Delete** /
    **Keep**, **Record Poem** / **Cancel**.
  - Kept as they were: West, Neutral and East; Breathing Room; the Opposition
    and Conjunction Hues (the PML guide now names them where it explains
    accents).
- **Easier to find your way:**
  - Each tab opens with a line saying what it holds.
  - **Two Surfaces** and its Upper / Lower / Swap now sit above the surface
    picker they switch. The four readings are labeled **Readings**.
  - Options that turn a feature on (Gradient Text?, Background Gradient?, the
    Allow switches, Two Surfaces, Gradient Border?, Box Gradient?) are
    switches; an eye now only shows or hides something.
  - Undo and redo are ↶ and ↷.
  - Return is **Close** on a desk and **Done Writing** on a phone.
- **Writing on a phone:**
  - **PML** in the bar opens the guide while you write; ⤓ Try still writes
    into the poem.
  - While the keyboard is up, the preview folds to a strip so the poem has
    the room. Tap the strip to put the keyboard away.
- **The camera dial's zoom is a slider** under the dial (100% in the middle,
  25% and 400% at the ends), in place of ＋ and −.
- **The light dial hides Height** for surfaces where only the direction does
  anything (Aurora, Silk Ribbons, First Snow, Harsh Rain, Silverpoint
  Hatch, Suminagashi, Flow-Field Ink).
- **Painted Ringworld:** the little creatures are gone. In their place, on
  some rings, small life to find rather than see: insects over the grass,
  fairies, a patch of flowers, slime, each world its own mix (fairies where
  there is magic, slime in the ruins). Only where it can be seen: never
  behind a nearer forest or off the frame. A picture without them is
  unchanged.
- **Fixed:**
  - With hints written out, a hint beside a row of buttons (New Random
    Surface and Edit in the Athanor, the seed's moon, Sounds, the guide's
    ⤓ Try) pushed its section past a phone's screen, and the panel slid
    sideways. Each hint now takes its own line.
  - On narrow phones (360 px) the PML guide's list of marks ran off the
    screen. It fits.
- **Under the hood:**
  - `tools/fit-audit.py` opens every tab at 360, 412 and 1280 px with the
    hints out and every section unfolded, and names anything wider than its
    panel.
  - The release's commit message no longer holds its notes twice.

## Saturn–Erriapus (2026-10-17)

- **Draw a curve on the page.** A new Athanor part, **Curve Control**
  (Inputs), becomes a pad under the Surface's sliders when its graph is on
  the page:
  - Drag a point to shape the curve.
  - Tap or click the empty pad to add a point; double-click, double-tap or
    hold a point to take it away.
  - ↺ puts back the graph's own curve.
  - The curve runs smoothly through every point and never bulges past them.
  - It's saved with the look, as a knob is. Up to two per graph.
  - New starter, **Hand-Drawn Tones**: clouds whose light and dark you draw.
- **Angles on a dial.** A Knob of the Angle kind now has a small dial beside
  its slider. Drag round it to turn it; 0° is up.
- **Wire ranges by two handles.** Set wire range… and a binding's Set its
  range… now show two sliders, one for each end, instead of a box to type
  two numbers in. Setting the first above the second reverses the wire, and
  the dialog says so.
- **Fixed:**
  - The surface menu said "The Athanor (empty)" just after Apply; it now names
    the graph.
  - A graph with no Knob showed a "Knob 1" slider that moved nothing. It's
    gone.

## Saturn–Bebhionn (2026-10-17)

- **Anti-aliasing in the Athanor.** The Surface has Filter Forge's
  **Anti-aliasing** setting, for graphs with hard edges (a Threshold, bricks,
  polygons), which came out in small steps where they ran at a slant:
  - **edges only** smooths the steps along each edge and leaves soft areas
    alone. It costs little (the method is FXAA, a standard in games).
  - **all pixels** draws the whole graph on a grid twice as fine, then
    smooths it: sharper edges and fine lines that hold, for up to four times
    the work. A heavy graph keeps the grid its budget allows.
  - **off** is how every graph drew before, and how every saved graph still
    draws. A new graph starts at edges only. The menu's textures don't
    change.
- **Five new starters,** each a lesson in one pattern part, colored by your
  two Hues and lit by the dial: **Paving Stones** (Pavements), **Brick Wall**
  (Bricks), **Pyramid Studs** (Pyramids), **Dot Grid** (Grid & Dots) and
  **Techno Blocks** (Blocks), in Open › Starters to take apart.
- The wiki's Size and resolution page explains anti-aliasing, with a thing to
  try.

## Saturn–Albiorix (2026-10-17)

- **Loops in the Athanor.** Set a group's **Repeats** above 1 and it runs that
  many times (up to 16), its first result fed back into its first input each
  time. An **Iteration** part inside counts the passes, from 0 to 1, so a
  setting can change from pass to pass.
- **Scatter, the rest:**
  - **Glyph** marks: symbols from Symbology's sets (alchemy, the heavens,
    the zodiac, occult signs, runes, stars), in the app's symbol fonts.
  - **On Top** chooses which mark covers which: the brightest (as before),
    the last thrown, the largest or the smallest.
  - **Mark Colors: from the picture** colors each mark by the picture where
    it lands, in a new **In Color** output.
- **New parts:**
  - **Pavements**: paving stones in rows, each row and stone its own size,
    a little out of true, with joints, rounded corners and a bevel for the
    Light Engine.
  - **Smudge**: the picture smeared one way, as a finger drags wet paint,
    or along a map of directions.
  - **Multiblend**: up to four layers over a base at once, in one mode.
- **The Surface is a material.** Four new inputs beside picture and height:
  **reflectivity**, **reflection blur**, **metallic** and **emission**, each
  a gray map. One surface can be part polished metal, part matte stone, with
  spots that glow. Left unwired, the Surface draws as it always has.
- **The inset box reaches the Athanor:**
  - A new **Inset Box** part gives the box as masks: inside it, a rise in
    from its edge, and its line. It follows the box's offset, thickness and
    corners. With the box off, it gives the page's own edges.
  - **Border Mask** can frame from the inset box.
- **Curves:** three more shapes (Arc Slow, Half Circle, Quarter Circles),
  and Curve Ops gains Transition (one curve into another across the page)
  and Fade (a curve eased to nothing at both ends).
- **Every part's Variant is now called Variation,** the same name as on the
  other parts. It works as it did.
- **Easier to use** (from a usability review):
  - **Hints you can read on a phone.** ⓘ in a section's heading writes its
    hints out, small, under the controls (a touch screen never showed them).
    **Hints** in Esoterica → Interface writes them out everywhere. The page's
    own notes are a little smaller too.
- **The camera dial for graphs from the Athanor.** A graph whose Camera Dial
  part reaches its Surface now shows the dial on the page (it never
  appeared). One opened from a menu texture starts where that texture's
  camera starts.
  - **Undo for the poem.** ☋ and ☊ step the poem's text when it was the
    last thing changed. Cutting most of a poem offers Undo at once, and
    ⤓ Try is one undo step. ⤓ Try adds its example at the end until the
    cursor has been placed in the poem.
  - **The Athanor on a phone:** tap a port to start a wire, then tap a port
    on another part to finish it. Fit never shrinks a graph below 60%, so
    ports stay within reach. New parts land in free space, never on another
    part or under the preview. The first graph is wired, so its preview
    shows a picture.
  - **Done asks** whether to put a changed graph on the page.
  - **The Grimoire:** a recorded poem is chosen at once, a grayed Record says
    why, and Spellcrafting and the Grimoire each say what they keep. Poem
    titles leave out PML's marks ("WTF is PoetryPress?", not "WTF is
    PoetryPress ?").
  - **The keyboard** reaches the choice tiles (alignment, aspect, stops),
    the presets and the Grimoire's poems: Tab, then Enter or Space.
  - **Small things:** Freeze This Seed reads "Seed Frozen · Thaw" while
    frozen. Points Outward? is grayed for stitches with no side (Solid,
    Dashed, Dotted). A custom size past 256–4096 px says so. Save image no
    longer copies to the clipboard unasked: Copy alt text is the toast's
    button. The wiki's search puts titles first and shows a line from each
    page. The shortcut sheet says Ctrl/⌘ + wheel zooms the preview. Each
    Summon button says what it rolls.
- **Clearer words.** The tooltips and notes are shorter and more specific,
  and the border, inset box, vignette, Esoterica's buttons and the eyes have
  the hints they lacked.
- **Fixed:** the vignette's Center sliders reach past the page's edges, as
  their range says, and 0 is 0 (it jumped to the middle). A look saved with a
  center outside 0–100 now draws it where it was set.
- **Under the hood:**
  - reviewed the tests: checks that tested nothing, or only read the app's
    source, are gone or now test what the app does; repeated checks are
    merged; The Poem's and the presets' checks moved to their own suites and
    the PML source scans to the invariants; six suites named for a pass or a
    fix joined the suites of their concern. A new suite covers undo and redo,
    the poem's and the look's.
  - pruned the stylesheet: two declarations that never won anywhere are gone,
    checked in every state (no drawn element changed).

## Saturn–Skathi (2026-10-17)

- **Your name stays inside the frame.** With a border or an inset box on, the
  credit and the spell code now sit inside the innermost frame, clear of its
  line, its stitch and its rounded corner. Before, a wide border could put
  them on the line or outside it.
- **The spell code is much fainter,** and its checkbox has moved to
  Esoterica → Grimoire.
- **PML:**
  - `/glass` takes a strength from 0 to 100: `/glass:80`, `/glass:rose,30`,
    `/glass:clear,70`. 50 is the glass as it was.
  - `/cut` letters are plain letters when no surface is on, since there is
    nothing to cut through.
- **The Athanor:** while choosing parts for a group, drag a box across the
  grid to choose every part it touches. With a mouse, Shift and a drag
  starts choosing with a box.
- **The wiki is easier to find your way in:**
  - The contents are in sections, with subsections inside them, and Parts
    folds open by category to list every part.
  - Every section has its own page listing what it holds, with a line
    about each page.
  - Each page shows where it sits, and ends with links to the pages beside
    it. Previous and Next appear only in Getting Started, where the pages
    are read in order.

## Saturn–Paaliaq (2026-10-17)

- **Groups in the Athanor.** Several parts can now be made one:
  - **Make a group…** in a part's menu, then click or tap the other parts
    that belong in it and choose **Make the group**. The parts move inside
    the group and it takes their place, wired as they were, so the picture
    doesn't change.
  - **Open the group** shows its parts in place of the graph; **Back**
    closes it again. A group can hold other groups.
  - Each **Group Input** and **Knob** inside is one of the group's inputs,
    named after it. Each result wired to its **Group Result** is one of its
    outputs, up to four. A Knob inside a group, left unwired, is still its
    slider on the page.
  - **Ungroup** puts the parts back out, wired as they were. **Duplicate**
    copies a group with everything inside it. Every part inside counts
    toward the part limit.
  - The wiki has a page on groups, and one for each new part.
- **Graphs save their wires by port name.** A part that gains a new input in
  a later release no longer shifts the wires saved on its settings (as
  Halftone's once were drawn to the wrong rows). Graphs saved before load
  and draw as they did.
- **Under the hood:** graph version 5. A group's insides are a module of the
  editor's own, and the graph is laid out flat before it is drawn. Saved
  ports are named (`in:field`, `set:scale`, `out:image`).

## Saturn–Phoebe (2026-10-17)

- **PML: glass, cut, blends and shaped lines.** Each also works bare.
  - **Glass letters.** `/glass` makes frosted letters: the page behind them
    is blurred and lit, with light along their top edges. `/glass:clear`
    only bends the page, and `/glass:rose` (or any color) tints the glass.
  - **Cut letters.** `/cut` makes the letters windows through the surface,
    to the page under it.
  - **Blends and opacity.** `/blend:multiply` presses the ink into the paper.
    Screen, overlay, soft-light and the other blends work too. `/op:60`
    sets the opacity.
  - **Shaped lines.** `/arc:30` sets the words on an arc (a negative arc
    sags), and `/wave:25,2` on a wave. The line is given room for the curve.
    `/rot:-8` turns the words about their middle, and `/gap:100` leaves room
    after the line (a negative gap draws the next line in).
- **PML: friendlier names.**
  - `/font:Cinzel` picks a typeface by its name, beside `/f:N`.
  - `/color:rose` picks a color by its name: any web color name, or one of
    the app's own (rose, oxblood, moss, bone, parchment, graphite, teastain,
    clay, sage, ink, starlight, ember).
  - **Named styles.** `§style ember = /color:ember/glass` on a line of its
    own names a style; `<coals/@ember>` uses it. The naming line isn't
    drawn, and a style can use another.
- **The editor points out mistakes.** A directive PML can't read is
  underlined: a misspelt name, a value it doesn't take, or a style or
  typeface no one has named. The line under the poem says why, and suggests
  the nearest name (`/glas` → `/glass`).
- **PML, two changes to old poems:**
  - **Bold and italic run over lines,** as brackets do. Before, `**` or `*`
    left open at a line's end showed as text and stopped there.
  - **`<3` is always a heart.** Before, a line such as `<3 you <word/c>`
    read the heart's `<` as the start of the segment.
- **The seed places the camera.** On Painted Ringworld and Ring in the Sky,
  each new seed starts from its own shot: a turn, a view and a zoom within a
  pleasing range. The camera dial still moves it, and locking the camera
  keeps it put.
- **One face for the controls.** Number fields, dropdowns, slider readouts
  and the color pickers' buttons now use the same sans-serif as the rest of
  the controls, and a dialog's buttons are set in small capitals like the
  other large buttons.

## Saturn–Ijiraq (2026-10-17)

- **Two new surfaces in Sky & Cosmos:**
  - **Painted Ringworld.** The view from a ringworld's floor, painted in flat
    shapes. The land rises into the arch, which bows across the sky through
    its star, and the rim wall stands at the horizon. Hills, forests and
    whatever the builders left are drawn ridge behind ridge.
    - **World** chooses who and what lives there: By the Seed, Wilds, Cities,
      Neon, Builders, Magic, Ruins, or Mixed (three worlds side by side).
      Rings can also have little creatures, crashed ships, ships overhead,
      roads, great spans from wall to wall, spires, summoning circles and
      crystals.
    - **Life**, **Works** and **Altitude** (from the grass to high over the
      land) set how much grows, how much is built, and how high you stand.
    - The camera dial is the camera, as on Ringworld. The light dial is the
      time of day: at night the cities light, and the arch still shines
      where its own day is.
    - The lights take the page's accents.
    - **Paint** lays oil paint over the shapes with the **Brush** you choose.
      At 0 the shapes stay flat.
  - **Ring in the Sky.** A ring round its star, seen from out in space, in
    flat blocks of land, sea and cloud: a simple, cosmic page to lay behind a
    poem. The camera dial spins it, opens it from edge-on to a full circle,
    and sizes it. Star Height places it on the page.
- **Oil Paint has four brushes** in the Athanor: Round (as before), Flat,
  Palette Knife and Dry.
- **Shape Aware:**
  - **Shape Strength**, a new slider beside it, softens how strongly the
    surface answers the words, from barely to fully.
  - **More surfaces answer it.** Knotwork leaves its cells off the lines.
    Stained Glass sets the poem in one pale pane. Facet Field lies flat under
    the words. Turing Skin thins out there. Deep Field's stars fade. Broken
    Glass keeps its shards off the lines, and Dewy Webs keeps its webs off
    them.
- **PML:**
  - **Blocks over many lines.** A bracket left open on one line and closed
    on a later one now colors every line between. So does a segment
    (`<…/dirs>`).
  - **Directives after a bracket.** Directives straight after a bracket's
    closer make it a segment of its own, so `[words]/jitter:150` works
    without angle brackets, also over lines. An alignment alone after a
    block's last line (`…]/c`) aligns the whole block.
  - **Nesting.** A segment inside a segment takes both sets of directives,
    its own last. A bracket runs through a segment inside it.
  - **Changed:** a poem that left a bracket open on one line and wrote its
    closer on a later line used to show that closer as text. The block now
    runs between them. Everything else reads as it did.
- **Under the hood:**
  - The Painted Ringworld's parts (The Arch, Land on the Ring) live in
    stepsRing.js and share Ringworld's camera.
  - Ring in the Sky and Land of Shapes are Athanor parts.

## Saturn–Kiviuq (2026-10-17)

- **The preview is the saved image again.** Circuit Board could save a
  different board from the one on screen (on some page shapes and scales the
  preview's grid came out a row taller, and the whole board was routed
  anew). It, Fractured Glaze, Hoarfrost and Ruffled Growth now grow on the
  saved image's own grid at every size and are drawn scaled, so what you
  see is what you save. Saved images don't change.
- **Circuit Board:**
  - **More to read.** Markings now prints far more: each era's own words
    (power rails, test pads, revisions, made-up physics, witchy brass, runes,
    and now and then a line about poems and type), barcodes, warning
    triangles, test points, makers' marks, moon phases, and fourteen new
    little pictures (a moth, a cat, a ghost, a quill, an inkwell, an open
    book…). By the same slider, today's chips carry a maker's code and a date,
    and today's small parts their values.
  - **Nothing on top of anything.** Every name, value, rune and stamp is
    placed only where no copper, part or other word lies; a magitech chip's
    hologram stays close about its circle. Boards with names that collided
    lose the later name.
- **Ringworld:**
  - **Arches on every ring**, of one or two forms by whoever built it: the
    great spans from wall top to wall top, rows of flying buttresses from the
    walls down to the land, arcades striding on piers along the ring or
    across it, gates, and the land's own stone arches.
  - **Nothing floats but the ships.** Crystals grow from the land in
    clusters, rings of light stand on stone plinths, a ruined arch stands as
    two stubs, and the floating isles are gone. Nothing stands over the
    camera.
  - **Mountains at the walls:** ranges along both rims' feet, with shoulders
    and foothills, snow on the tallest.
  - **Thicker:** spires are tapering towers now, and every arch is heavier.
  - **The Forerunners' way:** the Engineers' lights are blue, towers stand
    on the walls' tops, and bars of hard light run from wall to wall.
  - The seam shows on about one ring in fifty (it was one in seven).
- **The surface and the words:**
  - **Shape Aware** is on both surfaces now. On a surface drawn on the page
    it shapes itself round the words: Halftone's dots and Silverpoint
    Hatch's strokes leave each line on clean paper, Flow-Field Ink flows
    round the lines like water round stones, Contour Map's land is a plateau
    under them so its contours ring the poem, and Circuit Board is routed
    round them. In the letters, those four go finer too.
  - **Cut Out by Text**, a new box on either surface: the words cut that
    surface away, and the page beneath it shows through the letters.
  - In the Athanor, The Poem has a third number, **Round the Words**.
- **Under the hood:**
  - reviewed the tests: checks that read the code for a refactor long done,
    or for what a behavior check now proves, are gone; new checks prove the
    preview grows the saved image's picture, and which surfaces read the
    poem when.

## Saturn–Iapetus (2026-10-17)

- **The surface and the words**, two new boxes under the surface's name:
  - **Text Aware** (on the first surface, ticked to begin with): the
    surface knows where the poem is. Broken Glass keeps the shards that fall
    on a line small, Dewy Webs never hangs a web's hub on the words, and
    Circuit Board cuts clear of the lines. Untick it and the surface is
    drawn as if the page had no words.
  - **Blend with Text** (on the second of Two Surfaces): that surface fills
    the letters of the poem, with its own blend and opacity, and leaves the
    rest of the page alone. **Shape Aware** beside it tells the surface it
    is filling letters: Broken Glass then lies only on the lines, sized to
    the words, Dewy Webs strings a web across each line, and Circuit Board
    routes finer to show in the strokes.
  - In the Athanor, The Poem has two new numbers, **Aware** and **In the
    Letters**, so a graph of your own can answer either.
- **Ringworld**, reworked within its eight sliders:
  - **Landforms** (it was Terrain) raises the land itself: the relief, the
    rim walls and the mountains against them, and each seed's own country of
    snow-capped peaks, mesas, boulders strewn near you, pinnacles and, where
    the magi built, floating isles.
  - **Cities** (it was Structures) still raises the builders' works, and
    past its first quarter spreads cities, towers and glass domes whoever
    built the ring.
  - **Traffic** (it was Stand At) fills the sky with ships, and past its
    middle with lanes of small craft whose engines draw dotted lines of
    light; the streets get busier at night. Where you stand across the band
    is now the seed's.
  - The great arches across the band now spring from the tops of the rim
    walls, the air they hold shimmering beneath them.
  - Looks saved before keep their relief and works; their Stand At becomes
    Traffic at its middle.
- **In the Athanor:** two new parts, **Rotate** and **Scale**: a picture
  turned or made larger or smaller about any center, repeated, mirrored or
  stretched past its edges.

## Saturn–Hyperion (2026-10-16)

- **Ringworld's builders.** A new Builders slider chooses who raised the
  ring: By the Seed, Wilds, Engineers, Cities, Magi or Ruins. They build
  arches across the band and gateways, cities whose windows and streets
  light up at night, ships trailing their engines, crystals, pillars of
  light, glowing summoning circles and rings of standing stones. Ruins are
  broken. Every seed also sets the size of the shadow squares and which way
  the ring turns, so no two rings are alike. Clouds now cast their shadows on
  the far land.
  - **The light dial is the time of day:** noon at its middle, dusk at its
    rim, night past it, and its direction says which side dusk comes from.
    The Daylight slider is gone; looks saved before keep their hour.
- **Circuit Board has five eras.** The brass-and-valves era is now called
  **Atomic**, and a new **Magitech** follows it: summoning
  circles and runes on the chips, gems set in the board, light guides,
  floating holograms, and gold sparks over a cyan glow. A board saved at the
  old Magitech stays Atomic.
- **Broken Glass**, a new surface under Materials & Craft: shards of glass
  lying on nothing, sharp and a little tilted. Their faces flash, their
  edges split the light into colors, and each throws a bright caustic beside
  it. Clear, bottle green, amber, cobalt, sea glass and violet. Use the
  light dial to light it (pull it past the rim for long caustics), and the
  camera dial to lay the glass on a floor.
- **Dewy Webs**, a new surface under Weather: orb webs at dawn, beaded with
  dew. Each drop is a tiny lens, and the silk glints where it crosses the
  light, in rainbow colors with Iridescence. Webs can sag and tear.
- **The camera dial on more surfaces:** Scrying Pool, Dune Ripples and Moss
  on Stone. Their Tilt slider is now the dial's View, and they can also turn
  (the sun stays put while the ground turns under it) and zoom. Looks saved
  before keep their view.
- **In the Athanor:** new parts Glass Shards and Dewy Webs. A new starter,
  **A Dropped Frame**, lays broken glass over a picture, bent through each
  shard. Circuit Traces has an Arcana output (Magitech's glow), and
  Ringworld View takes the sun's height and direction.
- **Fixes:**
  - The poem box scrolls all the way to the end of a long edit.
  - Edit in the Athanor on an empty Athanor surface opens the editor
    instead of saying it isn't a graph yet.

## Saturn–Titan (2026-10-16)

- **The Camera Dial**, a second dial beside the light dial, for surfaces seen
  through a camera. Turn it to look round, draw it out to look lower and
  across, and zoom with ＋ and −, a pinch or the wheel. While it moves, a
  wireframe of the shot is drawn over the page, and the picture follows when
  you let go. The light dial is now only the light.
  - Lichtenberg Figures and Ringworld have it; looks saved before keep their
    view.
  - On a phone the two dials sit side by side, the hues under them in two
    columns.
- **Under Glass**, a new surface under Materials & Craft: a sheet of glass
  laid over the page. It shows a window's reflection, scratches that glint
  toward the light (wiped ones ring it), fingerprints, smears, water spots
  and dust, and cracks if you break it.
  - Clean glass changes nothing, so it goes over any other surface: choose
    it as the Upper of Two Surfaces. Screen adds only what the glass
    catches; Hard Light also darkens.
  - In the Athanor, five new parts make it: Window Reflection, Scratches,
    Smudges, Shatter and Glass Pane. The starter **A Picture Under Glass**
    puts any texture under the pane, where old glass's waves and each
    broken shard bend it.
- **Lichtenberg Figures:** the strike's angle is a slider of its own; Depth
  sinks the channels; a Glow Hue lights them as if they still burned; and the
  plank can be Charred Wood, Slate, Brass or Acrylic. Its readings are new.
- **Ringworld is never bare.** Each seed builds its own world: spires with
  beacons at their tips, unfinished scaffolding with the void showing
  through, mountains spilled against the walls, and now and then the ring's
  seam. Structures raises all of it, and Stand At places you across the band.
- **Circuit Board** keeps clear of your poem: the traces under its lines are
  cut away, each ending in a via, and typing within a line doesn't redraw
  the board. Its Magitech is now steampunk: brass gears and riveted bars set
  with crystals, valves, and coils wound round the traces.
- **The Surface section**, reordered: the surface and its reading on one line
  with the four readings beside it, then New Random Surface and Edit in the
  Athanor, then Two Surfaces with Upper, Lower and Swap.
- **Firefox on a phone:** textures are made one at a time and the menu's
  tiles are painted only as they scroll into view, so it should no longer
  run out of memory. The Athanor shows a bar while it works.
- **New parts in the Athanor:** Camera Dial (the page's second dial) and
  Ground Coordinates (the page's plane as a camera sees it).

## Saturn–Rhea (2026-10-16)

- **Ringworld**, a new surface under Sky & Cosmos. You stand on the inside of a
  ring round its star. Land and seas are sharp at your feet and smooth where
  the ring rises into the arch overhead. Rim walls hold in the air, and
  shadow squares circling the star make the nights.
  - The Light Dial is the camera: turn it to look along the ring, toward a
    wall or back; draw it toward the middle to look up at the arch.
  - Daylight is the one light: night, the dusk line, or noon.
  - It is built from two new parts anyone can use, Ringworld View and Noise
    at Coordinates.
- **Rain on Water**, for your poem: rings spread where the drops strike still
  water, and the newest ones still splash. View looks down on it or across it
  toward the horizon.
- **A surface can have up to eight sliders.**
  - Lichtenberg Figures: **Turn** and **View**, a camera that circles the
    plank and tips to look across it. At 0 the figure is exactly as before.
  - Circuit Board: **Era** (Today, Future, Quantum, Magitech) turns the board
    toward the next era chip by chip. **Markings** adds stamps, codes and now
    and then a little picture, in the room the board leaves. With both at 0
    it is the board as before.
  - An Athanor Knob can be any of the eight.
- Changing the preset now updates the Surface panel under Materia.
- Only the padlock toggles a lock, so tapping a name or scrolling past one
  no longer locks it by accident.
- Typing the poem on a phone: the text area fills the room above the
  keyboard and scrolls inside it. A tap below the last line puts the cursor
  at the end.
- An empty poem starts fresh: the welcome page, the default theme, and every
  slider and lock as new. Otherwise the page's shape is kept between visits.
- **The Athanor:**
  - The bar: ＋ Parts on the left, then Open, Apply and Keep together, and
    Done, with ⋯ on the far right. Show on Page is now **Apply**.
  - Open is a drawer of tiles. On a tall phone it is a sidebar.
  - Pinch zoom follows your fingers, parts can snap to a grid, and ⋯ has
    **Spread Out**: wide columns, so every wire can be followed.
  - The logo is embossed on the workbench, and parts sit over it.
  - A graph can have up to 96 parts and holds far less in memory while it
    works, so Circuit Board no longer crashes Firefox on a phone. A new
    **Glow** part makes a bloom in one step.
  - The Light Engine can take a light height of its own, for a graph whose
    dial does something else.
- **Oil Paint's impasto** is merged: thick in the lights and thin in the
  darks, with a stroke's load thinning along it.
- **Under the hood:** the stylesheet is pruned every ten releases and the
  tests are reviewed every five.

## Saturn–Polydeuces (2026-10-15)

- **Lichtenberg Figures grow as they first did:** one strike, or two or
  three poles, each branching on its own (the version whose two poles always
  joined is gone). Zoom and Slide are now a camera on the finished figure:
  Zoom brings it closer, larger and with wider channels, and Slide frames
  it along the dial's line. At 100% and no slide, it is the first figure
  exactly.
- **Oil Paint keeps small things:** a last pass with a fine brush repaints
  whatever the big strokes lost, so distant trees and windows keep their
  shape. Painted Landscape shows it most.
- **The Athanor is a workbench of its own.** Choosing a kept surface (your
  Halftone2, say) in the Surface menu puts it on the page and leaves the work
  in the Athanor alone. While the page shows the Athanor's graph, every
  change there shows on the page as before. 🜉 Open in the Athanor asks
  before it replaces work that isn't kept anywhere.
- On a phone, the Athanor opens one thing at a time: the parts drawer, the
  wiki and a menu each close the others. The wiki's Close sits apart from
  Contents and Back.
- While you type the poem on a phone, the spell code's switch and the credit
  step aside.
- **Under the hood:**
  - pruned the stylesheet: checked in every state, nothing in it goes unused;
  - reviewed the tests: a slow suite no longer draws the texture corners the
    fingerprints already draw, so a full run is about half a minute shorter.

## Saturn–Helene (2026-10-15)

- **Three new buttons above the presets**, for more of the look you have
  without opening a section:
  - **⟳ Summon Variation**: the same look grown again, with a new seed for
    its surface and now and then another of its four readings. (Clicking a
    lit preset again does the same.)
  - **≈ Mutate Gently**: every section's die rolled gently at once. Sliders
    move a little, colors drift together, the light turns a touch; menus,
    switches and anything locked stay.
  - **❄︎ Freeze This Seed**: locks the surface's seed, so presets, dice and
    variations keep this exact pattern. It is the same lock as the padlock
    beside the seed; press again to thaw it.

## Saturn–Dione (2026-10-15)

- **◐ Protect the Text**, a new button under Text Clearing (in Text
  Effects): it measures every line of the poem against what it sits on and
  raises Text Clearing just far enough that each stands at 3:1 contrast or
  better. Each line is read in the inks it is really written in (accents,
  gradients, a quote's faintness). It never lowers the clearing, and a lock
  on Text Clearing holds it. A line whose own ink is too close to the
  backdrop can't be helped by clearing: it is named by its words, and the
  rest are protected without it.
- **Ink**, a new part in the Athanor: the color the poem is written in,
  brought into a graph, so a surface can be built in the poem's own ink.
- Under the hood: the page is now assembled with the code copied in exactly
  as written (a `$&` in the code could have been read as a pattern).

## Saturn–Calypso (2026-10-15)

- **A Knob has a Kind.** In the Athanor a Knob can be a plain slider;
  **Steps**, a few marks the slider locks to, named as you like
  ("Calm, Restless, Storm"); an **Angle**, read in degrees and marked every
  45°; or a **Switch**, off or on. The graph sees only the marks, or 0 and 1.
- **Order of the sliders**, in the Surface's menu (hold it or right-click
  it): choose which slider on the page each Knob is.
- **Reverse the wire**, in a wired setting's menu: the same wire, the other
  way round.
- **Roll one control alone:** Ctrl-click (⌘-click) a control's name, or hold
  it on a phone, and only that control rolls, the dice's way. A locked one
  stays.
- Fixed: a Knob whose Default is 0 started at 50.

## Saturn–Telesto (2026-10-15)

- **🜉 Open in the Athanor**, a new button under the Surface: it opens the
  surface you are using in the node editor, as the graph of parts it is made
  of. Its sliders stand where yours do, and it uses your hues and light, so
  what you see there is what the page shows. Change it there and keep it as
  your own; the page keeps its surface until you show yours. (Deep Field is
  not a graph yet, so for it the button rests.)

## Saturn–Tethys (2026-10-15)

- **More new parts in the Athanor**, from Filter Forge's list:
  - **Split HSB** and **Merge HSB**: a picture as hue, saturation and
    brightness, and back. Wire a Gradient into Merge HSB's Hue for a
    rainbow.
  - **Split Lab** and **Merge Lab**: lightness as the eye sees it, and two
    color axes, to work on the light without shifting the colors.
  - **Median**: each point takes the middle of its neighbors, so specks
    vanish and edges stay sharp. Its Percentile darkens or lightens instead.
  - **Map Switch**: a gray map chooses which of up to four pictures shows,
    band by band (sand, grass, rock and snow by height, say).
  - **Flip**: a picture turned over, left to right or top to bottom.
  - **Perspective**: a picture laid flat on the ground and seen at a slant,
    repeating toward the horizon, like a tiled floor.
- Each has its own wiki page.
- Fixed: a border gradient set to 0° drew at 45°, as if unset. It now runs
  straight across, as the slider says.
- Fixed: the vignette's grit was coarser in the preview than in the saved
  image. It is now measured in the saved image's pixels, so the preview is
  the saved image scaled down.
- **Under the hood:**
  - pruned the stylesheet: it was checked in every state, and nothing in it
    goes unused;
  - reviewed the tests: the frame's suite now checks what the real render
    draws (the gradient's line, the bloom's passes, the vignette's circles
    and grit) instead of reading the code, which is how the two fixes above
    were found; a check for a long-gone panel was dropped.

## Saturn–Enceladus (2026-10-15)

- **New parts in the Athanor**, from Filter Forge's list:
  - **Ellipse**: an ellipse, or rings of them like orbits, drawn as lines
    or filled in bands; it also gives how far out from its center each
    point is, and how far around.
  - **Polygon**: 3 to 12 sides, or a star, or rings of them, with a Bevel
    that rises to its center for faceted heights.
  - **Triangle Mesh**: scattered points joined into triangles (Delaunay's).
    Thin Out keeps only the shorter lines, for constellations; Facets gives
    each triangle its own gray, for a low-polygon look.
  - **Blocks**: rectangles of random gray at several sizes. Their outlines
    alone are a circuitry of lines.
  - **Pyramids**: a grid of pyramids, cones or domes, for studs and rivets.
  - **Noise Gradient**: a gradient between two colors whose many stops
    drift, for nebulae and old dyes.
  - **Cells** also gives **Stones**: rounded stones with a gap between them
    (its new Gap setting).
  - **Math** can now Round, Floor and Ceiling (terraces), compare (Greater,
    Less) and take a Log.
- **Three Surface Studies use them:**
  - Constellation Without Stars draws its lines with Triangle Mesh;
  - Orbit Script draws its orbits with Ellipse;
  - Deep-Space Dust drifts its color with Noise Gradient.
- Each new part has its own wiki page.

## Saturn–Pallene (2026-10-15)

- **More settings follow a map.** In the Athanor, a gray map wired into one
  of these settings' ⚙ now sets it point by point instead of as one average:
  Blur's Radius (sharp in places, soft in others), the Scale of Value Noise
  and Perlin Noise, Motion Blur's Length and Angle, Grow & Shrink's Amount,
  Twirl's Twist, Edge Detect's Strength, Scatter's Size (each mark sized
  where it lands), the Relief of both lights, and the Light Engine's Gloss.
- **Each part's wiki page marks the settings that take a map** ("by point",
  linked to the page that explains maps), and a setting's menu says whether
  a map on its ⚙ works point by point or as an average.
- Surfaces you kept before draw exactly as they did: they read these
  settings as one average, as before. Graphs begun from now on (from
  **Open**, or ⋯ › Clear the grid) take them point by point.
- Fixed: the wiki said a higher Scale gives Value Noise and Perlin Noise
  bigger blobs. It gives more, smaller ones.

## Saturn–Anthe (2026-10-15)

- **Every texture in the menu but Deep Field now opens in the Athanor.**
  Eighteen more are graphs: Cold Press, Old Paper, Dream Bloom, Silk
  Ribbons, Hoarfrost, Rain on Glass, Dune Ripples, Lotus Pond, Night City,
  Scrying Pool, Suminagashi, Burnt Letter, Crystal Leaf, Cup Ring, Kintsugi,
  Metal Spangle, Moss on Stone and Transmutation Circle. Open one from
  **Open** › The app's own textures to see its sliders, hues and dial wired
  in, and use its part in your own surfaces. Each looks exactly as it did.
- **Eighteen new parts**, one for each, with a wiki page saying what it
  does, how it does it and what each setting changes. **Variant** on these
  parts gives another of the same kind; at 0 the part draws exactly what the
  texture draws.
- A Rain on Glass part in your own graph shows the page's colors through
  its drops, as the texture does on the page.

## Saturn–Methone (2026-10-15)

- **Eight more textures open in the Athanor.** Binary Pattern, Chladni
  Sand, Guilloché, Sigil Scatter, Rorschach Test, Facet Field, Black Hole
  and Fractal Moon are now graphs: open one from **Open** › The app's own
  textures to see its sliders wired in, and take its part into your own
  surfaces. Each looks exactly as it did.
- **New parts:** Bit Grid, Chladni Sand, Guilloché, Sigils, Ink Blot, Facet
  Field, Black Hole and Fractal Moon. Bit Grid and Chladni Sand can follow
  any gray map wired into their **Where**; Guilloché also gives its lines
  alone, to light or color another way.

## Saturn–Mimas (2026-10-15)

- **The Arcane Guidance teaches.** The PML guide in the Inscription tab now
  says what each kind of mark is and why you'd use it, then gives an
  example. **⤓ Try** puts the example in your poem where the cursor is, and
  undo takes it back.
- The guide now also teaches the effect stack (`/fx:outline(…)+glow(…)`)
  and stitched underlines (`/under:wave,…`), which until now only PML.md
  explained.
- **Under the hood:**
  - pruned the stylesheet: three declarations that never won anywhere are
    gone, checked against every screen;
  - reviewed the tests: the save-and-load suite that repeated the audit is
    gone (its own checks moved to the audit and the coverage suite), the
    themes have a suite of their own, tested by behavior, and checks for
    names and controls long since gone were folded into one list of retired
    names.

## Saturn–Aegaeon (2026-10-15)

- **The wiki shows what it teaches.** Each concept page in the Athanor's
  wiki now has a figure: a small working graph, with what each of its parts
  makes, and a line saying what to see. There are eleven: gray maps,
  pictures, colors, numbers, curves, driving a setting with a map, wire
  ranges, masks, blend modes, heights, and seeds. They are drawn live by the
  app, so they always show what the parts really do.

## Saturn–Janus (2026-10-15)

- **The Athanor's bar, simpler.** It now reads: Open, Keep, undo and redo,
  the view, ⋯, whether the page shows your graph, and Done.
  - **Open** is the one place to begin from. It lists your kept surfaces,
    the starters, the Basics, the Surface Studies and the app's own textures
    by group, each with a line saying what it teaches.
  - **⋯** holds everything else: copy or share the wiring, your shelf of
    kept surfaces, Tidy, Revert, Clear the grid, and the wiki.
  - **Use** is gone. The bar says **✓ On the Page** when the page shows
    this graph, and **⇱ Show on Page** puts it there when it doesn't. If you
    press Done after changing a graph the page isn't showing, the app offers
    to show it.
  - **Kept** is gone too: opening a kept surface is under Open, and the rest
    is under ⋯ › Your shelf….
- **Every menu in the Athanor** shows each item's hint in full, under its
  name, instead of cutting it short.

## Saturn–Epimetheus (2026-10-15)

- **Circuit Board**, a new surface in Pattern & Order, in place of Veins of
  Light. Chips and buses of copper traces, routed the way boards are: the
  traces run side by side and turn together, ending in vias and pads, with
  small parts and their printed names between.
  - **Charge** decides how many traces carry current: none (bare copper on
    the board), then colored, then glowing, then sparking.
  - **Data Flow** sends bright pulses and packets of bits along the powered
    traces, in the Data Hue.
  - **Bends** turns the corners square (like Factorio's belts) or at 45°
    (like a board's), and **Traces**, **Components** and **Scale** set how
    full and how fine it is.
  - The board is made of your backdrop's own colors, the traces wear your
    accents until you choose their hues, the Glow Hue adds an aura, and the
    light dial lights it all.
- Veins of Light leaves the menu. Looks made with it, and the Circuitry
  preset, still open as they were.
- **New in the Athanor:** Circuit Traces, the part that routes the board,
  and **Page Backdrop**, which brings the page's backdrop into a graph as a
  picture.
- The Glow Hue now glows in Poured Wax (it had been too faint to see).
- Preset and history tiles show surfaces made of the page in that look's
  own colors.
- The Athanor's Blend part is several times faster.

## Saturn–Prometheus (2026-10-15)

- **Two Surfaces, each with every control.** Turn on Two Surfaces in the
  Surface Texture card and a second surface lies beneath the first. Upper
  and Lower choose which one the controls below change: its variant, every
  slider, its hues, its light, its seed, its readings and its locks. (The
  old base layer had only two sliders; looks made with it open as before.)
- **Swap** trades the two surfaces whole, blend and locks included.
- **Every blend for every surface.** The Blend Mode menu lists the blends
  made for the surface first, then every other: the canvas's own and six
  more mixed pixel by pixel (Vivid Light, Linear Light, Pin Light, Linear
  Burn, Subtract, Divide, marked ⚡). A grey surface is made on the ground
  that suits the blend it is given, so the blend changes only its marks.
- **Text Clearing** moved to the Text Effects card, beside the effects it
  works with. It quiets both surfaces behind the words.
- Preset and history tiles show both surfaces of a look.
- The saved image's alt text names the surface beneath, and the report's
  §Surf variables always describe the surface on top, whichever the
  controls show.

## Saturn–Atlas (2026-10-15)

- **The wiki turns its own pages.** Every page of the Athanor's wiki ends in a
  bar with the page before and the page after, in the order of the contents,
  and the bar stays at the foot of the screen while you read.
- **Surface tiles are remembered.** The thumbnails in the surface menus stay
  in your browser from one visit and one release to the next; a tile is
  painted again only when its surface really changed.
- On a phone held sideways, the divider under the preview now always drags
  up and down (it used to read the wrong direction).
- The tree trunks in Painted Landscape keep their fine lines in the small
  preview, as in the saved image.
- **Under the hood:**
  - pruned the stylesheet: the declarations that never won anywhere are
    gone, checked against every screen (desk and phone, each tab, the
    Athanor, its wiki, each theme), and the parked sideways layout went
    with them;
  - reviewed the tests: suites by concern instead of by session, behavior
    instead of copies of the code, a dozen duplicates and snapshots gone,
    and a test boot 70 times faster;
  - the project now checks itself: unused code, strings, styles and files
    fail the tests, and so do docs that name what no longer exists or
    count differently from the code.

## Saturn–Daphnis (2026-10-15)

- **The help keeps up with the app.** The rules for working on Vellum now
  say that a change isn't finished until the wiki, the tooltips and the
  guides that explain it are current. A test checks the parts that can be
  checked: every input, output and setting has its explanation, and the
  wiki names only menu items and parts the editor still has.
- The old Reaction–Diffusion part's page now explains its input, output and
  settings.
- The wiki's tidy instructions use the menu's real name: Tidy into columns.

## Saturn–Pan (2026-10-15)

The first release named for Saturn's moons: Jupiter's ran out.

- **The Athanor has a wiki.** Help is now an encyclopedia of the editor,
  with contents, search, Back and links between pages:
  - **Start here:** what a node editor is, a step-by-step first surface, and
    how to read a graph.
  - **Data and wires:** what a gray map, a picture, a color, a number and a
    curve each are, what happens when kinds don't match, ⚙ settings,
    required inputs, driving a setting with a map, and wire ranges, with
    worked examples.
  - **Techniques:** masks and blending, blend modes, height maps and light,
    seeds and Variation, size and resolution.
  - **A page for every part:** what it does and why you'd use it, its
    inputs, outputs and settings each explained, things to try, and related
    pages.
  - A glossary.
- **About this part** in every part's menu opens its page. A port's menu can
  explain what it carries.
- **Menus explain themselves:** each action has a plain name and a line
  saying what it does ("Connect its output…: click the part it should
  feed", "Set wire range…: which part of its range the wire sweeps").
- **Clearer names:** Levels has Black Point and White Point, Threshold a
  Cutoff, Perlin Noise Octaves; ports read "map" and "picture" rather than
  "field" and "image". Some parts are renamed for what they do: Simple
  Lighting, Paint Swipes, Growth Medium, Differential Growth, Watercolor
  Bleed, Stained Glass, Card Deal.
- The notes shown when a graph opens explain how it is built again, and what
  to try.
- Tooltips elsewhere in the app are full sentences again.

## Jupiter–Kore (2026-10-14)

- **Clearer, shorter text in the Athanor.** Part descriptions, the notes
  shown when a graph opens, the Help and the menus are rewritten for someone
  who knows the basics of graphics: short, in standard terms, without the
  hand-holding. Menus say "Wire in…", "Set wire range…", "Reset all
  settings" instead of full sentences.
- Instructions say **click** with a mouse and **tap** on a touch screen.
- Fixed: tapping the Athanor's preview on a phone didn't enlarge it.
- A few long tooltips elsewhere in the app are shorter.

## Jupiter–Cyllene (2026-10-14)

- **Fixed: wires drawn to the wrong row.** In a graph whose wires were made
  in a different order from its ports, the Athanor drew them into the wrong
  settings, although they were really connected to the right ones (Ruby's
  Halftone showed this). Every wire now lands on the port it is connected to.
- **One name for a surface.** The Surface part's name is now also the name
  it is kept under. Keep it under a new name and the Surface part takes that
  name too. Choosing a kept surface in the surface menu shows it by the same
  name, so it no longer looks like the menu picked something else.
- **Keep is one tap**, in the Athanor's bar (and first in its ⋯ menu).
- **Replace:** a kept surface can be replaced with the graph on the grid,
  and keeping a surface under a name already taken asks before replacing it.
- **Your Surfaces have pictures.** Each kept surface's tile shows the
  surface, drawn at its default settings, and the picture is redrawn when its
  wiring changes.
- **Share the wiring.** Hold a surface you made in the surface menu (or
  right-click it) to use it, open it in the Athanor, share or copy its
  wiring as text, or take it off the shelf. The Athanor's Kept menu can copy
  and share wiring too, and **Paste a surface's wiring…** puts copied wiring
  back on a shelf, yours or someone else's.

## Jupiter–Callirrhoe (2026-10-14)

- **The dice remember how you like to roll.** Choose Gently, As usual or
  Wildly from any die (hold it on a phone, or tap ▾ beside it on a computer)
  and every die rolls that way from then on, along with the Summon New
  Typeface, Backdrop and Surface buttons and the light dial's ⚄. Each die
  shows the way it will roll: ⚁ gently, ⚄ as usual, ⚅ wildly.
- **Gently** now also turns the light dial a little, lets colors drift
  together with a touch of their own, never changes the surface, and when it
  changes the typeface picks a similar one (a serif for a serif).
- **Wildly** no longer flips switches.
- **Locks win.** Nothing a lock holds is changed by any die, Summon button,
  the light's ⚄ or a preset:
  - Fixed: renaming a surface's knobs wiped their padlocks, so the knobs of
    most surfaces couldn't stay locked. The same was true of the base
    layer's knobs and the text effects' settings.
  - Fixed: a locked surface put back after a roll could reset its own locked
    knobs.
  - The light's ⚄ says so when the light is locked, instead of turning it.

## Jupiter–Kallichore (2026-10-14)

- **Three ways to roll a section.** A tap on a section's die rolls it as
  before. Hold the die on a phone, or tap the ▾ beside it on a computer, to
  choose:
  - **Gently:** sliders move a little, menus and switches stay, and colors
    turn together, so the look stays itself.
  - **As usual:** what a tap does.
  - **Wildly:** anything goes, every slider across its whole range, menus,
    switches too.
  - **Back:** returns that section to how it was before its last roll,
    without undoing changes you made elsewhere since.
  - On the Surface, **Only a new seed** is there too (Shift-click still works
    on a computer).

## Jupiter–Aoede (2026-10-14)

- **Surface Studies.** All 36 surfaces from the future-directions document can
  now be opened in the Athanor (Start from… → Surface Studies), each built from
  general parts you can see, rewire and change, with a short lesson and a few
  knobs: Moonlit Fibers, Ink Thirst, Carbon Copy, Dead Channel, Holographic
  Foil, Memory Leak, Frozen Breath, Sigil Weather, Cracked Lacquer and the
  rest. These are first drafts. Orbit Script, Transmutation Engine and
  Constellation Without Stars are approximations until their own parts exist.
  They become textures in the Surface menu later.
- **New parts in the Athanor:**
  - **Scatter (Marks):** dots, rings, stars, crosses, dashes, diamonds,
    sparks, sigils or any picture, thrown across the page. A map can say where
    they fall and another which way they turn.
  - **Grid & Dots:** checker, grid lines, dots, hex dots, diamonds, stripes.
  - **Border Mask:** a soft frame from the page's edges, square, rounded or
    oval, roughened by any map.
  - **Lookup:** reads a picture at places given by two gray maps.
  - **Displace:** pushes a picture along the slope of a map.
  - **Gradient Map:** colors a gray map with up to five colors, smooth or in
    bands.
  - **Spectrum:** a rainbow, straight, round, around a point or laid along a
    map.
- **Variation** on Value Noise, Perlin Noise, Cells and Curve: change the
  number for a different pattern from the same settings.
- **The Poem** part has a **Rhymes** output: the words of lines that rhyme,
  every rhyme or one letter at a time.
- Fixed: in graphs made in the Athanor, marks, sizes and counts now come out
  at their true size at every resolution.

## Jupiter–Hegemone (2026-10-13)

- The Athanor learns from Filter Forge:
  - **Map inputs.** In a new graph, a gray map wired into a part's ⚙ setting
    sets it point by point (a threshold that changes across the page, a
    blend stronger in some places). Graphs made before still take the map's
    average, and the textures draw exactly as before.
  - **Curves**, a new kind of wire (green, dotted):
    - Curve makes one: bias, gain, gamma, a bell, a peak, stairs, a step, a
      wave, an arc, a wobble.
    - Curve Ops repeats, shifts, flips or combines curves.
    - Tone Curve runs a picture through one.
    - Profile Gradient shapes a gradient with one.
  - **New parts:** Perlin Noise, Bricks (a curve can shape the bevel),
    Brightness & Contrast, High Pass, Sharpen, Motion Blur and Offset.
  - **Math** gains divide, power, average, screen, modulo and sine.
  - A part that needs an input shows its empty port in red, and its preview
    shows a warning in its place until something is wired in.
  - **Note**: words on the graph for whoever opens it next.
  - The Surface has a **Size** that scales everything in the graph.
  - Only controls that reach the Surface appear on the page.
- ROADMAP.md is the plan for the surface engine, for whoever works on it next.

## Jupiter–Sinope (2026-10-13)

- Your poem and its look are kept as you work, so a closed or dropped tab
  opens again where you left off. A first visit still opens on the welcome
  page. (Lain's work.)
- The surface menus (Surface Variant and Base Surface) are now tiles. Each
  shows a small picture of the surface as a preset wears it. Groups fold, and
  a search finds a surface by its name, its group, or the names of its
  readings ("rose" finds Stained Glass). The pictures are made once per
  release and kept in your browser, so they appear at once after that.
- Built-In Presets has a search, and its groups fold. Folded groups are
  remembered.
- Text Clearing (Surface Texture): quiets the surface behind your words,
  fading out around them, so small text stays readable over a busy surface.
  Fixed: Base Surface's menu showed empty groups.
- The Athanor can read your poem. The Poem is a new part that hands on four
  maps:
  - Words: where the words are.
  - Distance: how far each point is from the words.
  - Lines: a band for each line.
  - Stanzas: a region for each stanza.
  A new starter, Ripples from the Words, draws rings spreading out from the
  text.
- New Athanor parts: Grow & Shrink, Pixelate, Twirl, Mirror and Chromatic
  Offset.
- Preset tiles now show every knob and hue their preset sets.

## Jupiter–Megaclite (2026-10-12)

- New textures:
  - Knotwork: interlaced ribbons that go over and under, built on Cromwell's
    grid the way Celtic knots are drawn. Choose the strands, the breaks, the
    outline's shape and the ribbon's width. It is carved and lit by the dial.
  - Fractured Glaze is now cracks spreading across a glaze: each crack runs
    until it meets another and new ones branch off at right angles. From One
    Point starts them at an impact set by the dial. Cracks are carved and lit;
    Chipping flakes the glaze at the edges. The old crazed glaze stays
    available for old looks.
  - Veins of Light: glowing wires, tiny machines or colored fibers growing
    through rock layers, pebbles, sand, fibers or skin. The growth follows the
    material's gaps and lights the surface around it.
- You can place what you see: Lichtenberg Figures and Ruffled Growth gain Zoom
  and Slide, Aurora gains Horizon, and Veins and Knotwork have Slide. The dial
  sets the direction.
- Lichtenberg Figures: always one pole or two. Two poles always meet with one
  joined channel between them. Zoom carries the figure to the page's edges.
- Stained Glass: Window now draws arches out of the glass itself, in a lancet,
  an arcade of three or a round window. The outline is heavier lead, and the
  border glass beyond it has its own colors. The stone is gone. The lead is
  flat, dark and satin, with soldered joints, no longer a silver pipe.
- New default poem.
- The page's aspect ratio stays as you set it. Loading a look, spell or JSON
  never changes it.
- Removed the preset previews on mouse-over (desktop).
- Twelve new presets, so every preset group fills whole rows of four:
  Aftertaste, Margins, Night Swim, Afterglow, Rimed, Monsoon, Tidepool,
  Circuitry, Undergrowth, Windward, Highlands and Interlace. Hourglass now
  wears the new cracked glaze.
- Spell codes are written only in Runology's runes (its Archetypes and
  Accents). Every preset has a new spell, and old spells still load.

## Jupiter–Eirene (2026-10-12)

- Layout: the phone layout now follows the window's shape, not its width. Any
  window 2:3 or taller gets it; anything squarer gets the two desktop panes
  at any width. Fixed the half-empty stacked layout at in-between widths.
- Crystal Leaf (Lucid) draws about a quarter faster, and changing its hues
  redraws in a fraction of the time (its lit structure is kept). The picture
  is identical.
- Presets are regrouped by Ruby's categories: Basic Scenes, Paper &
  Stationery, Skies & Stars, Weather & Water, Particle Systems, Geometric,
  Nature, Materials & Craft, Grown & Generated, and Rituals & Magic.
  - Removed: Riverbed, Gingham, Ruled and First Frost.
  - Reworked: Sea Glass (a deeper sea), Sunroom (the backdrop's own round
    gradient), Sundress (engraved rosettes), Hush (cold-press paper), Signal
    (the glyphs shown bright) and Rose Window (a round window in stone).
  - New: Struck, Coral, Leopard and Borealis.
- The six Basics now live only in the Athanor (Start from… → Basics). Looks
  saved with one still open.
- New textures, in a new group, Grown & Generated:
  - Lichtenberg Figures: the branching path electricity burns, grown the way
    lightning is simulated. Use one strike or two or three poles. Choose
    charred wood, live embers or a strike lit inside clear acrylic. The dial
    sets where it enters.
  - Ruffled Growth: a line that grows, crowds itself and folds like coral or
    lettuce, toward the dial's sun.
- New texture, Aurora: curtains of fine rays over Deep Field's stars, green low
  and red high, with a pink hem. The dial leans the rays.
- Aurora Veil is now called Silk Ribbons. Same look; saved looks keep it.
- Poured Wax is waxier: light sinks into it and comes back out (translucency).
  New sliders:
  - Splatter takes it from poured wax to flung paint or ink.
  - Height sets how thick it stands.
  - Sheen goes from matte to wet.
  New readings: Spilt Ink, Paint Spatter and Lacquer Seals.
- Stained Glass gains three sliders: Scene, Glass Texture and Window.
  - Scene colors each pane from a painted landscape behind it.
  - Glass Texture runs from cathedral through hammered and seedy to
    opalescent.
  - Window sets the glass in a lancet arch or a round window in stone.
  At 0 it draws exactly as before.
- New Athanor parts: Discharge, Wood, Burn, Growing Line, Starfield, Aurora
  Curtains, Pours, Meniscus and Glow Hue. The Light Engine gains Translucency;
  Panes and Glass gain the stained-glass options above.

## Jupiter–Eukelade (2026-10-12)

- Fixed: panning the Athanor's grid often did nothing, or started selecting
  text. Wherever the grid had been panned or zoomed away from, a press landed
  on the panel behind it, which the graph editor didn't treat as the grid.
  Now it pans from anywhere empty. The middle mouse button, or Space held,
  pans from anywhere, over parts too.
- Fixed: some graphs opened in the Athanor with only their first few parts
  (Painter's Frustration, Painted Landscape, Oil on Canvas). A part whose
  wire sweeps only part of a setting's range stopped the graph loading
  partway.
- New texture group, Basics, first in the menu: Cells, Checkerboard,
  Gradient, Plain Noise, Polka Dots and Stripes. They are quiet grounds that
  leave room for a poem, and each is only two or three Athanor parts, so they
  are also the easiest graphs to open and learn from. Cells takes the light.
  Each has four readings.
- Presets are now grouped by what you might be looking for: Quiet Pages,
  Bright & Playful, Night & Stars, Glow & Glitter, Weather & Water, Places,
  Paper & Keepsakes, Bold & Graphic, and Ritual & Omen.
- Twelve new presets: Hush, Ruled, Gingham, Sundress, Sunroom, Postcard,
  Riverbed, Fernlight, Wayfinder, First Frost, Marbled and Rose Window.
- New Athanor parts:
  - Terrain: an imagined land's heights.
  - Contour Lines: the contour lines of any gray map.
  - Turing Pattern: spots, coral, mazes, worms or holes that grow by
    themselves.
  - Flow Lines: evenly spaced ink lines along a current, which any gray map
    can bend.
  - Washes: the shapes of two watercolor pigments.
  - Pigment: lays any gray map on a picture as watercolor.
- Contour Map, Turing Skin, Flow-Field Ink and Watercolor Wash are now built
  from those parts and look as they did; Flow-Field Ink draws exactly as
  before.

## Jupiter–Pasiphae (2026-10-12)

- The Athanor is easier to handle with a mouse:
  - A part drags from anywhere on it, not only its title (its fields and
    ports still work as before).
  - The scroll wheel zooms on Firefox. Firefox reports wheel steps in lines,
    which were being read as pixels, so each step barely moved.
- Fixed: wires sometimes pointed to the wrong places when the Athanor was
  opened again later. They had been drawn while the panel was hidden; they
  are now redrawn on every opening and when the fonts arrive. The graph
  itself was never damaged.
- Undo and redo in the Athanor: ↶ and ↷ in its bar, or Ctrl/⌘+Z and
  Shift+Ctrl+Z (or Ctrl+Y), 100 steps deep. Ctrl+D duplicates a part, F fits
  the view, and Delete removes the selection (asking first, as always).
- The Oil on Canvas starter is back: any texture, painted in oil on a little
  canvas weave and lit by the Light Engine. It shows how parts fit together.
- New part, Particles: snowflakes, sparks or glittering motes, drawn over any
  picture in any two colors, with the wind taken from the dial. First Snow,
  Burning Mana and Euphoria Dust are now built from it, and draw exactly as
  they did.

## Jupiter–Kalyke (2026-10-12)

- Dice: a die (⚄) now sits beside the lock in every section's heading, and
  rolls only that section.
  - Backdrop, Surface and Typeface roll the way their Summon buttons do.
  - Every other section rolls each of its sliders, menus and colors within
    reason.
  - Locked controls stay put, and the lock beside the die keeps the whole
    section through any roll.
  - On the Surface, Shift-click or a long press on the die rolls only the
    seed: the same texture with a new pattern.
- Painter's Frustration is now built from Athanor parts: Angry Strokes (the
  paint and its thickness), a little Canvas Weave, then the Light Engine
  before the output. That is the same oil-on-canvas module as Painted
  Landscape. Wetness also flattens the paint and makes it glossier.
- Halftone and Film Grain are built from Athanor parts too. Halftone Screen
  can print any tone as dots at an angle; Film Grain can go over anything.
- The Oil on Canvas starter is gone; its parts now live inside the textures
  that use them.
- Fixed: on the page, a part without its own drawing code (Mix, Levels and
  the like) could not read a picture made by a part that has it. This is what
  had kept Painter's Frustration from being lit.

## Jupiter–Sponde (2026-10-12)

- The Athanor has the app's lighting engine as a part, the Light Engine. Wire
  a picture and its heights into it and the light dial lights them. Its
  settings are Relief, Gloss (or a gloss map, for shine in some places only),
  Shine, Shadow, Occlusion and Ambient. It also has hue ports for the shadow,
  highlight and light colors; left empty, it uses the page's own material
  hues.
- Oil Paint: a new part that repaints any picture in oil brushstrokes. Big
  strokes go down first, then smaller ones where there is detail; each
  follows the picture's shapes and stops at its edges. Its second output is
  the paint's heights (ridges, bristle grooves, paint piled at the ends), for
  the Light Engine.
- Canvas Weave: a new part, the cloth under a painting, as heights.
- A new starter, Oil on Canvas: any texture turned into an oil painting the
  dial lights.
- Painted Landscape is now oil on canvas that the light dial lights. A sixth
  slider, Impasto, sets how thick the paint stands; 0 is the old flat
  painting.
- Athanor:
  - each part wears the color of what it makes, the same color as its
    output dots and wires;
  - a tapped or clicked part comes to the front;
  - the mouse wheel zooms toward the pointer, and the view can zoom out
    further on big graphs;
  - larger type in the parts;
  - on a phone, the top bar is one row: ⋯ holds Kept, Help, Revert and
    Clear, and the zoom buttons are gone (pinch to zoom);
  - the teaching note sits beside the parts list instead of over it, dims
    the grid while it shows, and closes with a click anywhere;
  - its old card in Esoterica is gone; it opens from the top bar.
- Presets: the built-in presets are alphabetical within each heading.
  Custom Presets ends with a "＋ Save this look" tile.
- Cartomancy: Wear has far more range. At the top, nearly every card is
  marked, many two or three times.

## Jupiter–Carme (2026-10-12)

- Inline code works again. Its background box read a color the wrong way, so
  every frame with `code` in it failed and the preview froze on its last
  picture. This happened in every browser.
- Desktop preview: the viewer is now the whole right pane, and the picture
  fits inside it. The aspect ratio buttons change only the picture, not the
  viewer. The fit, undo, redo, filmstrip and Save image buttons sit in a strip
  at the bottom of the pane instead of on the image. Zooming with Ctrl or ⌘
  and the wheel fills the whole pane. The phone layout is unchanged.
- Presets:
  - Known Rituals is now Built-In Presets.
  - Custom Presets is its own card underneath: saved looks, alphabetical,
    wrapping onto as many rows as needed.
  - The saved looks in Esoterica → Spellcrafting are alphabetical too, and
    wrap instead of scrolling sideways.
- Opening page: "WTF is PoetryPress?", written in PML. 9:16 is now the
  default shape.
- First visit: two things are added once, and stay deleted if deleted:
  - Grimoire: the old instrument panel, "PoetryPress Instrument Panel",
    dated the release day.
  - Custom Presets: a plain example look, "Example · Linen Page" (warm paper,
    dark ink, Alegreya, a little linen).
- Rosé: the plum-charcoal colors are back.
- Build: `node build.mjs --zip` deletes the old archive in release/ before
  writing the new one; `node build.mjs --notes` prints these notes.

## Jupiter–Taygete (2026-10-12)

- Painted Landscape in Bob Ross's manner: evergreens laid in with a fan
  brush, knife-painted mountains with snow, mist at the foot of far ranges.
  Coasts stand in the water, each headland with its reflection; cliffs step
  down in ledges with foam at their foot.
- Cartomancy: eleven implied games, none quite a real one; card backs in one
  family (ten patterns, ten medallions); games played for beads or beans when
  not for money; two new sliders, Wear (damaged cards) and Clutter (candles,
  cups, letters, a crystal ball… kept toward the edges); about twenty easter
  eggs. A Table Objects part in the Athanor.
