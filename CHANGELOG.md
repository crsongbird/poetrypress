# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Uranus–Desdemona (2026-10-20)

- **Nothing shakes while a control is used.** Dragging a fader whose value is a name (Species, say) once resized its
  column, and every knob beside it moved; the columns are now a fixed width. The display line keeps its room and only
  fades in and out. A value is said once: on the display line while the control moves, at the fader's foot otherwise.
  The Controls heading counts its sliders only while it is closed.
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
  observatories and wind turbines. The wilds have villages and farms.
- **Drapery, a new surface**: a sheet of cloth simulated as it hangs or falls (from a rod in gathers, from two
  corners, from one, twisted, or seen from above over a hidden form, crumpled, laid flat) in nine fabrics, silk to
  velvet. Its weave follows every fold, and the Light Engine lights it from its maps: satin shines, burlap doesn't,
  light comes through the gaps. New parts for any graph: Drape, Weave Maps and Detail Normals.
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
