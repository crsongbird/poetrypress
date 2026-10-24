# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Hyades–Chamukuy (2026-10-24)

- Rain on Glass sees through: laid over another surface with See Through on, each raindrop is a little lens over what
  lies beneath, turning it over, and shows only its dark rim, the sky in its edge and its highlight, so the surface
  below shows in it. Laid alone, or with See Through off, it draws as it did.

### Under the hood
- A whole generator can leave its offsets on its canvas (`kitWhole` hands them on as the part's lens, in canonical
  pixels); `genGlassRain` does, and draws its drops for seeing through when its part is asked for a lens. No
  fingerprint moved.

## Hyades–Secunda Hyadum (2026-10-24)

- Any setting can move in a film. The Moving Image has an Also moving row: choose one of the surface's sliders, or the
  light (the sun, on the Ringworld) or its height, and how it moves (it sways round where it stands, sweeps out to its
  far end and back, or drifts), how far (a little, some, much) and how many times in the film. Mark as many as you
  like; the line under the row says which are moving. Each comes back to where it began by the film's end, so a film
  that loops still loops, and every control is put back after.

### Under the hood
- `markValue` gives a marked control's value through the film (test/moving.test.mjs checks it starts and ends where
  it stands, sweeps without snapping, keeps to its ends and wraps an angle); a marked slider is set to step freely during
  the film, so a slow sway never stair-steps.

## Hyades–Prima Hyadum (2026-10-24)

- The Moving Image can rest at its ends: None, half a second or a second held still at the start and the end (and at
  the turn, there and back), the move between them. It is dimmed where the film loops round.
- To a shot: a fourth Turn, beside Quarter, Half and Full round. Set the shot… tucks the sheet away while the camera dial
  is turned to the shot; Done keeps it, shown on the sheet, and puts the camera back. The film then eases from the
  camera as it is to the shot, the short way round, closing in or drawing back evenly; There and back makes it loop.

### Under the hood
- `moveAlong` takes a rest; `shotAlong` gives the camera between two shots; Set it now takes a mode, so the same tuck
  sets a look or a shot. test/moving.test.mjs checks both.

## Hyades–Ain (2026-10-24)

- New things in the Wilds, each where it belongs: a fire lookout on a high place, its cabin lit by night; a bothy of
  rough stone in the open hills, slate- or turf-roofed, its chimney smoking now and then and its window lit; charcoal
  stacks smoking in the woods, glowing red at the vent by night; a wild camp by a wood, a ridge tent and a ring of
  stones with its fire coming up at dusk; a raised hunting hide at a wood's edge. Groves now stand in open country as
  well as by a wood, so they are the commonest of the Wilds' places.
- In town, a fountain in a square and a bandstand on the green.

### Under the hood
- Seven new kinds in the kit (`pkProp`: camp, charcoal, hide, bothy, lookout, bandstand, fountain), each sized in
  `PK_SIZE`; the Wilds' places chosen by weight among those whose ground fits. docs/prior-art/ringworld-motion-and-
  variety.md §8 item 19 begun.

## Hyades–Lembu (2026-10-24)

- Farms belong to the cities now: farmsteads, hamlets and their fields stand in the countryside round a city's edge,
  and the Wilds are wild. In their place the Wilds have places of their own: sacred groves (a ring of great trees round
  a greater one, a standing stone among them, lights in them where there is magic), stone rows across the open moors
  with a cairn at one end, holy wells at a wood's edge under their tree, and the columns of an older people standing in
  the grass.
- More colour by the seed: each region of a ring paints by one rule, as real towns do. Some are Burano's strong colours
  house by house, some Jaipur's rose, the whitewash of the Cyclades, Roussillon's ochres, Falu red, or the dark wood of
  Kyoto's streets, and some keep their own colours.
- Flat roofs gather aerials, dishes and the boxes of their plant, each building its own.
- The comet travels across the sky in a film, about half a degree a second, as well as turning with the stars. Its
  ion tail points straight away from the star, blue and thin; its dust tail is broad and white-gold, curving back
  along its way; a faint green coma hangs round its head.
- Shooting stars live their second in a real-time film: the head runs across the sky, the streak grows behind it and
  fades from its tail, and a faint train lingers.
- The aurora is coloured by height: a pink hem on a strong night, its body in its hue, its tops reddening as they
  fade, with fine rays up it. It drifts and breathes slowly, and now and then hangs over any world, not only magic and
  the builders'.
- Warning lights on masts, needles, glass towers and turbines pulse calmly together, twenty-five times a minute. A
  lighthouse has a character of its own: its beams sweep round once in four to fifteen seconds, alone or in groups of
  two or three, and its lantern blazes up as a beam turns toward you. Turbines and windmills turn. A pylon's line of
  light carries a bright spot climbing it, and the glows of pylons, arches, circles and pillars of light breathe.
- Rain falls at its own pace in a time-lapse, so the curtain slides instead of flickering; snow drifts gently; the low
  mist breathes on the clouds' clock. Fireflies swell and fade instead of blinking.
- The rim walls rise out of a haze along their foot and stand crisper above it, for a little more sense of their size.

### Under the hood
- docs/prior-art/ringworld-motion-and-variety.md §8: items 8 to 13 built, and the first of 15 to 18. The kit's
  `pkBeacon`, `pkBreathe`, `PK_LIGHTS` and `pkRoofThings`; the Ringworld's `beltAt` (farmsteads where a city meets the
  country), the wild places, `RG_PALETTES` and `rgPaletteOf`. The Ringworld's fingerprints moved for all of this; no
  other surface's did.
- Reviewed the tests the Ringworld's motion leans on (test/moving.test.mjs, test/ringworldView.test.mjs and the
  fingerprints) and swept 90 scenes across seeds, worlds, hours and films for any part that fails: none did.

## Ursa Major–Phecda (2026-10-24)

- The Ringworld's sky no longer flickers in a film. The cirrus and the long low bands used to leap across the sky at a
  film's first frame and pop in and out later; now they drift on the wind and fade in and out low over the horizon,
  and the cirrus is combed along the way the wind blows.
- Clouds build. In a time-lapse a heap of cumulus grows billow by billow, its top climbing, then thins and is gone, in
  seconds of film while the wind barely moves it. A heap drifting nearer gains billows one at a time instead of
  reshuffling.
- Smoke follows the wind: each chimney's plume leans the way the wind crosses the page there, bends over as it rises,
  and its puffs are born faint, so none pops out of the pot.
- Lights live gently. Windows, far lights and signs fade on and off over a moment instead of switching in one frame,
  a town's lights come up through the dusk rather than all at once, and what pulses (the lights on the rim walls, a
  flickering lamp) runs at the same calm pace at any frame rate and any speed of time passing.
- Lightning lights the scene: while a bolt burns, the land takes a cold, hard light from its side and the far side
  falls darker. It is held by measure under the photosensitivity limit, rises over a quarter of a second, never comes in
  a film's first second and a half, and never twice within two and a half seconds.
- In a fast time-lapse, a drone or a walker that would jump across the page from frame to frame is drawn faint while it
  moves, as a long exposure shows it.

### Under the hood
- The cloud drift's chord now holds its start well inside it (docs/prior-art/ringworld-motion-and-variety.md §1.2). A
  film's frame rate reaches the surface (`setSceneTime`, the camera's `fps`) for `rgFilmTime`; `rgStep` gives a
  real-time film its true step. `pkLit` returns a level; `pkDm` eases the kit's dusk lights in films; `rgGrowTime` runs
  a heap's life; the heap's billows are dealt from a fixed list of 64; a large heap is drawn on a smaller sheet instead
  of left out. `rgStrike` times a storm's strikes, and test/moving.test.mjs now checks their timing at every seed and
  the scene's light per tenth of the frame. Its fingerprints held.

## Ursa Major–Mizar (2026-10-24)

- The Moving Image's easing has four shapes: Even, Ease in (setting off slowly), Ease out (arriving slowly), and In
  and out.
- A Camera round can do something else as it turns, chosen under Also: Push in, Pull back, Tilt (across the view and
  back, so a full round still loops) or Spiral out (pulling back and leaning as it goes). The camera goes back to where
  it was when the film is done, and the summary line says when a film ends where it goes rather than looping.
- To another look can now be any look at all: Set it now… tucks the sheet into a bar at the foot of the page, and the
  page itself is changed, anything on it, the Athanor too. Done keeps that as the look the film moves to (listed as
  "The look you set") and puts the page back as it was; Cancel just puts it back. The changes leave no steps in the
  undo history.

### Under the hood
- `moveAlong` takes a shape (`'in'`, `'out'`, `'ease'`) where it took a yes or no; `cameraAlso` gives the view and zoom
  for a camera round's second move, its amounts in `FILM_CAMERA`; the history is held and put back whole around Set it
  now (`historyHold`, `historyPutBack`). docs/prior-art/film-animation.md says what was built and what is still to come.

## Ursa Major–Alioth (2026-10-24)

- See Through: a glass surface laid over another now bends the surface beneath it. Under Glass refracts what is behind
  each pane by the pane's own slope (its seams and bubbles turn the lines beneath), Broken Glass offsets the picture
  under each shard by that shard's tilt, and Crystal Leaf and Poured Wax bend it by their relief. The switch sits with
  the surface's tools when it can see through: on for a new page; a look saved before keeps its old picture, and
  saving a look keeps the choice.

### Under the hood
- A surface that can see through hands its lens to the page under its picture: the Light Engine keeps the height it lit
  (`ltLensed`), the glass pane and the shards keep their own offsets, and the texture stacks the lens, as offsets and
  coverage, below the picture (`seeLens`, `seeStack`, reaching `SEE_REACH` canonical pixels). The page bends what is
  already drawn through it before the layer is laid (`bendBeneath`); a look without a version turns it on
  (`seeByDefault`). No fingerprint moved: a surface draws its lens only when asked.

## Ursa Major–Alcor (2026-10-24)

- The Ringworld holds still while the camera moves. Each ridge of land is now cut round the eye, its points fixed in
  the world, so a turn no longer swings the cuts through the hills: the land stops swelling and sinking, the facets no
  longer crawl, and what stands on the land stays at its height. A still picture looks as it did.
- Trees and buildings keep their shape as the camera turns: how much of each is drawn is chosen by how far away it truly
  is, not by how large the painter's perspective draws it toward the frame's edges; nearer things are drawn over
  farther ones by their true distance, so buildings no longer pop over each other; the cracks and wear on a road, and
  the grain on a wall, belong to the road and the wall.
- Things are drawn a little farther off, the smallest trees are kept down to a speck and fade in as they grow, and a
  narrow conifer hides only what is really behind it.
- People go home at dusk: each walks to the nearest door and goes in, and comes out again at dawn.
- Lightning never strikes on a film's first frame.

### Under the hood
- Painted Ringworld (docs/prior-art/ringworld-stability.md): ridges are circles about the eye (`RG_ROUND_CUTS`), their
  samples at bearings fixed in the world (`NB`); a facet grows out of the lit band by the land's slope (`fw2`); each
  ridge's band, wash, day and seam are read smoothly round the middle of the view (`vw`); the land's finest octave fades
  in by its size; fields and ways are drawn with the ridge before their nearest end. Things choose their detail by
  their size at their true distance (`lodOf`, handed to the kit as its colours' `lod`); every detail drawn only at some
  sizes takes its own stream (`pkSub` from 6 on), a wall's grain is keyed to the thing (`pkGrain`) and a road's wear to
  where each piece lies; the loud nod, the dust devils and a film's lightning cloud are chosen from the world; walkers
  have doors (`toDoor`, `RG_DOORLESS`). The kit's windows, streaks, limbs and trunks read the detail size too. Its
  fingerprints moved for all of this; no other surface's did.
- Reviewed the tests that cover what this pass and the last touched (the Ringworld, the kit, the corners, the release
  names): nothing stale was found. A new suite, test/ringworldView.test.mjs, checks that a tree or a building drawn
  larger toward a frame's corner keeps the stage of detail its true distance gives it.

## Ursa Major–Megrez (2026-10-24)

- Corners are a little rounded, in steps: windows (cards, sheets, dialogs, menus, toasts, the color picker) 3 pixels,
  buttons and fields 2, small marks (keys, code, swatches) 1; circles stay circles. A row of choices is one shape,
  rounded only on its outside corners: the radio rows, the Moving Image's blocks, the Athanor's zoom and Keep buttons.
  What runs to the screen's edge, a line or a picture stays square.
- The thin lines down the left edge of the cards and of the groups inside them are gone.
- A keyboard focus ring follows each control's own shape, and no longer changes it.

### Under the hood
- SHAPE: the corners' steps are tokens on the root (--r-0 to --r-3), in place of the block that squared everything;
  radii that never drew are gone, and each rounded rule says its step (docs/prior-art/corner-radii.md). Pruned the
  stylesheet with tools/css-prune.py.
- New research notes: the Ringworld held still under a moving camera (docs/prior-art/ringworld-stability.md).

## Ursa Major–Merak (2026-10-24)

- Painted Ringworld is sealed: it no longer opens in the Athanor. The Surface card's Edit in the Athanor button is
  greyed for it, with a note saying why, and its parts are in no menu. Its chain still draws the page, but its
  insides can now grow into an engine of its own.
- And it is faster: a still about a third faster, a film's frames more than that, with the same picture to the pixel.
  Ring in the Sky got quicker on the way.
- The Ringworld's countryside follows Works: each farmstead farms its own fields round its yard, as many as Works
  raises. At a little Works the grazing between farms stays open; at much, the patchwork fills in.
- Sunrise Scroll's cursed land keeps its petals: they drift down through the ash and lie on the dead ground,
  blighted at their edges.

### Under the hood
- The Ringworld's chain is `sealed`: `athanorStarterAt` gives nothing for it, `paintReveal` greys the button,
  `revealSurface` says why, the Athanor's Open drawer leaves it out, and The Arch and Land on the Ring are hidden
  parts that `validateGraph` leaves out of any graph. chains.test.mjs checks all of it.
- Speed (PERFORMANCE-AUDIT.md, the Ringworld as an engine): in a canvas pass a part may take the canvas arriving on an
  input instead of copying it (`E.take`, `kitOwn`, steps marked `fresh`), counted by output so the Light Engine can
  take its picture; Oil Paint at nothing passes its picture through; the Light Engine lights flat ground once; a
  board's ink is kept (`pkInkKept`); a place's rise is worked out only when asked; a field's cheaper tests come
  first; building proofs are read once a size band. Measured pixel-identical against the release before on Painted
  Ringworld, Ring in the Sky, Painted Landscape, Brushstrokes and Sunrise Scroll; their fingerprints moved because
  the drawing calls did. Painted Ringworld's also for the farmsteads' fields.
- The first release named for a star: the §Build test reads a star cluster and its member as well as a planet and its
  moon. New research notes for what comes next: corner radii, surfaces that bend the one beneath, and films with any
  setting (docs/prior-art/).

## Neptune–Neso (2026-10-22)

- Painted Ringworld's buildings stand on the land. None is built on the water or at its very edge (each keeps two
  metres back from a shore), and none where the ground falls too steeply across it. On a slope a building stands
  level on a stone plinth that reaches down to the ground at its lowest corner, so no corner hangs in the air.
- The pagoda and the mosque turn with the camera now, through every angle, as the other buildings do: a pagoda's
  square tiers and the four slopes of each roof, a mosque's hall under its domes with a minaret at each corner, the
  far ones behind it and the near ones before it. Before, they were drawn the same from every side, so they seemed to
  turn with you.
- Walls, hedgerows and fences are runs of short pieces laid along their own line, each standing where it stands, so
  a long wall recedes into the distance and turns as the camera goes round it, instead of always facing you.

### Under the hood
- stepsRing.js: `footing` samples a building's footprint (its corners two metres out and its middle) and keeps how far
  its ground rises and falls across it; the painter lifts it to its uphill corner on a plinth. Runs are split into
  pieces at the end of `rgStore`, each with its own place, axis and length. paintKit.js: `pkPagoda3`, `pkMosque3`
  (built with `pkSpace` and `pkBox3`), `pkBuilding`'s `plinth`, `pkProp`'s `runW` for a piece of a wall, hedge or
  fence. About a tenth fewer buildings stand on steep or shore ground. turned.test.mjs checks that a pagoda and a
  mosque are wider on their corner than face on, and that a plinth reaches the ground. Fingerprints: Painted
  Ringworld (buildings off the shores and steeps, on plinths; the runs in pieces).

## Neptune–Psamathe (2026-10-22)

- Painted Ringworld's people walk now: up and down the street or lane beside them, at their own pace, stopping now and
  then, their legs moving as they go. By the hour they go in: by day nearly everyone is out, at night about one in
  twelve, the night watch carrying a lantern. Each goes in at their own point of the dusk and comes out at their own
  of the dawn, fading over many frames. A neon city's people stay out at all hours.
- Nothing moves in circles any more. Every moving thing keeps a timetable of stops round its home, each chosen afresh,
  so its path never closes into a loop: a drone flies short straight legs between hovers, a harvester goes up and down
  its rows, a sheep takes a step or two as it grazes.
- The clouds no longer jump about in a film of time passing. The scene's clocks ran unevenly, now and then backward,
  when a film gave dawn and dusk more frames than noon; they now run evenly from frame to frame. And in a film where
  the sun's bearing passed straight ahead or behind, the whole land's day and night flipped between two frames; the
  Ringworld now keeps its dusk coming the same way round for the whole film.
- The sea moves a little: its glints drift with the wind and rise and fade as they come and go instead of blinking,
  and near you a faint line of swell comes in every eight to eleven seconds.

### Under the hood
- stepsRing.js: `rgClock` (each clock from the frame times the film's mean step, held to its cap), `rgWaterTime`;
  `RG_MOVES` as timetables of stops (no sines); people by the hour in the prop painter; `setSceneTime` takes the
  frame, the mean step and the dusk's side, keyed with the camera. paintKit.js: a person's stride (`stride`) and
  lantern (`lantern`). Research: docs/prior-art/ringworld-life-and-views.md. moving.test.mjs checks that the clouds'
  clock steps evenly forward through a day whose hours are spread unevenly, which the old one did not.
  Fingerprints: Painted Ringworld (people in by night, the water's glints fading rather than cut off).

## Neptune–Laomedeia (2026-10-22)

- The Moving Image's sheet, rewritten. Four groups in order: Move, Length, Size, Output. Every choice is a row of
  buttons you can see at once (and move along with the arrow keys), with a line at the foot that says what the film
  will be: "12 s · 30 fps · 360 frames · 1080 × 1920 · MP4, about 14 MB".
- Time passes while the camera turns. On the Ringworld a Camera Round runs an hour by default, or real time, six
  hours, a day or two days; the sun moves, the clouds drift and the lights come on as it turns. It can begin as lit,
  or at dawn, midday, dusk or night. The foot line says how fast: "a day at 2 hours a second".
- New choices for the move: a quarter, half or full turn; even or eased in and out; once through, or there and back
  (which loops any move; with time passing, the sun returns the way it came). A full round goes evenly and a part turn
  eases, until easing is chosen by hand.
- Frame rates read 24, 30, 48 and 60 fps (24 is new), each with what it is for. Sizes say their shape and pixels
  ("Tall · 9:16 · 1080 × 1920"); the page's own shows its pixels. Rows a move doesn't use stay in place, dimmed.
- While a film is made, the note says how long is left once a few frames are done.

### Under the hood
- uiMoving.js reads radio groups (`movingPick`); `moveAlong` (moving.js) says how far along its move a frame is,
  replacing `moveAt`; `SUN_DAY` is the sun's day, from which a film begins at a time of day. The research is in
  docs/prior-art/film-export.md. The tree research landed too, in docs/prior-art/ringworld-trees.md.
- Housekeeping: reviewed the tests: nothing checked the film's moves apart from an eased look, nor the sheet's markup.
  moving.test.mjs now checks that a full round loops with no frame twice, a part turn ends on its last frame, there
  and back returns, easing leaves and arrives slowly, every choice on the sheet has exactly one default, the rates
  read in fps and in order, and the sheet reads every group it offers. No fingerprint changed.

## Neptune–Sao (2026-10-22)

- The trees, remade in the style of the rest. No two of a kind are alike now: each grows its own crown, wide or narrow
  for its height, leaning, fuller on one side, open or dense, young and pointed or old and broad, with a touch of its
  own green. A crown is grown lobe on lobe, so no piece of a tree floats, and its limbs leave the trunk and end
  inside the clumps they hold.
- Every tree is shaded: its lower inside darkest, the sky through it here and there, and close by, small leaves of its
  own shape. With the sun behind a tree, its leaves glow: the shade lifts toward yellow-green and the crown's outline
  is lit from behind.
- The conifers: a spruce's drooping tiers and a fir's narrow spire, each side of each tier its own width, the lower
  boughs dead on an old one. A young pine is a rough cone; a mature pine is a tall trunk with clumps of needles at
  their own heights on their own limbs. A cedar's shelves sit on limbs that reach them.
- Palms and tree ferns have feathered fronds, the palm's leaflets hanging and the fern's spread flat; a palm keeps a
  dead frond or two and its coconuts. A baobab's branches are thick and stubby with leaves at their ends; an acacia
  forks low into limbs that hold its flat crown; an olive is silver-grey and open.

### Under the hood
- paintKit.js: `pkTreeForm` (a tree's own form from its stream), `pkTreeTint`, `pkGrow` (crowns grown, not
  scattered), `pkLobes` near and far, `pkBacklit` (only the arcs of the crown's true outline), `pkLimb` as one
  tapering shape, `pkConifer`, `pkFrond`. stepsRing.js gives the trees the sun's `back` (how far the camera looks
  toward it). Research for the next passes (people, water, clouds, turning and grounding things) is in
  docs/prior-art/ringworld-life-and-views.md. No fingerprint changed.

## Neptune–Halimede (2026-10-21)

- Painted Ringworld's countryside, seen from a little height, reads as farmland now. Fields no longer lie over one
  another, across a road or over a yard; each is laid only where it fits, and a smaller one fills a corner left
  between others. Out in the country the houses gather into farmsteads some 600 to 900 m apart (a house with its
  barns and sheds round one yard in the region's own tradition, laid out in a row, round a courtyard or as a loose
  cluster) and hamlets round a green with a well, each with a lane out to the road; villages stand round a town's
  heart, closest there and thinning to their edges. By night only they show lights, the farmland between them dark.
  In windy country a farmstead has a windbreak on its windward sides, tall trees inside and shrubs outside.
- Terraces only where the country terraces and the slope is steep, and flooded paddies only where it is warm and wet,
  so the hills no longer look glazed. Rocks are cleared out of the fields and lie in low heaps at their edges.
- New in the fields: orchards on their grids (apples or plums on some, cherries in blossom), modern orchards in
  rows, olive groves; and now and then a field half ploughed, the tractor on the line between ploughed and stubble,
  the gulls waiting level with it and a few in the air. The same gulls follow a harvester. Near, a furrow's ridge
  catches the light.
- Looked down on, the land's ridges are painted thinner along their lit bands, with facets only where the land itself
  is steep, so they no longer hang across the country like panes of glass. At the usual height little changes.
- Painted Landscape: the foam lines on a lake lie side by side along the one wind, as they do.

### Under the hood
- `rgStore` (stepsRing.js): `seatOf` and `RG_FARM` for the farmsteads and hamlets, their lanes walked with the ways;
  `fieldClash` tests fields' rectangles on all four axes; fields keep off yards and windbreaks. New things in
  paintKit.js: the `stonepile` prop, `fruit` and `olive` trees; `gulls` in the small life. The research is in
  docs/prior-art/ringworld-countryside.md §12–17. A large ring takes about a tenth longer. Fingerprints: Painted
  Ringworld's only.

## Neptune–Nereid (2026-10-21)

- Painted Landscape's countries each have their own marks now, sized by how near the ground under them is, so the near
  part of a band is worked large and its far part small. Fields are a patchwork seen in perspective: parcels in tiers
  down the hills, bounded by lines running back to one point of the horizon, sown in converging rows, level strips or
  pasture, with hedges along the bounds. Grassland has patches where the wind bends the grass, drifts of flowers
  (a soft mass far off, single blooms near), now and then a strip field, and tufts leaning with the wind. Forests are
  crowns massed in rows with a few large masses and a clearing, the far forest's edge spiky; jungles have emergent
  trees and a low mist. Mountains have cracks dipping one way and aprons of scree; a volcano's cone has gullies
  converging on its summit (an old cone deeply cut) and a lava tongue, blocky or lobed. Mesas show their beds, cliff
  and bench, under a light caprock. Deserts have sinuous dune crests over their slip faces, ripples near and scrub.
  Tundra has its patterned ground, ponds and heath. Coasts have wet sand and lines of surf.
- One wind blows through each painting: the grass leans with it, dunes put their slip faces on its lee, the volcano's
  plume leans on it, and it writes on the water.
- Water has more moods: a mirror, scales of ripple, glassy wavelets, then white horses a few, frequent or many. Wind
  lines cut through the reflections on quiet water, a lake keeps a mirror strip under its far shore, gusts lie dark on
  it, and on a light steady wind lines of foam run back along the wind; rough water has pointed waves, larger near,
  and the sea one great swell at your feet.

### Under the hood
- `landMarks` and `waterMarks` (stepsWhimsy.js), each on its own seeded stream so nothing else in a painting moves;
  `landScene` gives the seed's `wind`. The research is in docs/prior-art/painted-landscape.md. The fields' parcels are
  drawn as their own shapes rather than clipped, which kept them cheap; a full-size landscape takes about 3 s now.
  Fingerprints: Painted Landscape's only.

## Neptune–Triton (2026-10-21)

- Sunrise Scroll paints many lands now, by the seed or by its new Land knob: the scroll as it was (Peaks), Misty
  Peaks (towers standing out of the mist, washed darkest at their tops and gone to paper at their feet, pines on top),
  a Coast (the sea in rows of arcs, a great wave curling in from one side with its claws of foam, a small wave behind,
  boats), the Snowy North (snow left bare under every crest, the sky dark down to the hills, flakes, laden pines), a
  Bamboo grove (three depths, jointed stalks, leaves in twos, threes and fives), a Village (houses on a hillside, a
  gate, now and then a pagoda, a cloud band across it), a Great Tree over terraced fields (its rope and paper
  streamers, a crown of blossom or evergreen) and, rarely, a Cursed land under a miasma rising from the ground. The
  land's things stand on the scroll's own ridges, paler the farther they stand and hidden by the ridges in front of
  them, with one tiny walker or boat for the scale. Their colours are the scroll's own hues. Its readings: Indigo
  Print now shows the coast and its wave, Bare Ink a bamboo grove; Vermilion Dusk and Spring Scroll keep the seed's land.

### Under the hood
- `scrolllands` (stepsScroll.js, `SCROLL_STEPS`), one process part: the five band masks in, each band's crest read off
  them; ink, wash, water, paper, accent and bloom maps out, laid by six Blends between the near ridge's ink and the
  petals. Knob 9, Land (`scrollLandOf`). The research is in docs/prior-art/scroll-lands.md; scrollLands.test.mjs
  checks the odds, the setting, each land's maps and that a far band's things are hidden. Fingerprints: Sunrise
  Scroll's only.

## Neptune–Proteus (2026-10-21)

- Loading a look or a preset puts everything back to that look's own: a third or fourth gradient stop it doesn't use
  goes back to the page's own colour, and a surface's third to sixth hues to that surface's defaults, never the last
  look's colours left behind (you'd have met them on adding a stop, or on an older look whose surface has more hues).

### Under the hood
- Housekeeping: reviewed the tests. persistenceCoverage.test no longer slices the app's functions out of its source:
  on the booted page it changes every control in index.html as a person would, saves the look, loads another, loads
  the saved one, and reads the control back; it also checks that loading a look never leaves the last look's value
  behind (which found the stops and hues above) and never moves the page's shape. poem.test's two checks that read
  the renderer's source are now behaviour in textRender.test: the layout the page records (a run per line, in
  fractions of the page) and Text Clearing's mask taken out of a surface (`clearedSurface`, exported for it). The DOM
  mock's inputs carry their `defaultValue`, as a browser's do.

## Neptune–Hippocamp (2026-10-21)

- Painted Landscape's river is remade. It is one river winding down its valley, seen in perspective: broad bends
  near you, its far bends flattening into thin level slivers that step back toward the horizon, hidden here and there
  behind the hills, and it no longer starts right under the sun. It holds the sky the way water does, light far off
  and darker at your feet where you look down into it, with the sky's own colour at the height it mirrors. A dark
  strip lies under the far bank (the bank reflected), with a light water line along the far shore and a dark lip
  under the near bank; level ripples, a glitter only where it crosses under the sun, and trees and bushes along its
  banks. River seeds paint differently from before; no other country changes.

### Under the hood
- `rvAt`, the river's course walked up the valley (its direction a sine of the distance along it) and projected;
  each band paints the reach at its own depths, clipped to itself. The research is in
  docs/prior-art/painted-rivers.md.

## Neptune–Larissa (2026-10-21)

- Ringworld's films are kinder to the eyes. Lightning no longer lights the whole scene for a frame: a strike now plays
  over some ten frames, its leader creeping down from the cloud, the bolt touching the land, then dimming away, the
  cloud lit softly from within and a small glow where it lands, never more than one strike a second. It strikes from
  a cloud you can see.
- Nothing blinks from frame to frame any more: the lights on the rim walls pulse slowly instead of switching on and
  off, fires and flickering lamps waver gently, the aurora ripples slowly, and the grass, the drones, the insects and
  the snow sway on a gentle clock.

### Under the hood
- `rgSwayTime`, the clock for whatever swings, sways or flickers (at most a quarter second a frame); lightning as an
  eased event on the small motions' clock. AGENTS.md §11 gains the photosensitivity rule; docs/pitfalls.md the lesson.
- moving.test.mjs renders a storm frame by frame while lightning strikes and fails if any frame brightens or darkens
  the scene as a whole.
