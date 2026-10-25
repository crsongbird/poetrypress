# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Pleiades–Alcyone (2026-10-25)

- The Ringworld's people are every kind of person. Each one's age (a child, an adult, an elder with a stoop and now and
  then a cane), build, skin, hair (short or long, grey with age, dyed in the neon world), beard, skirt or dress, and hat
  or headscarf is their own, chosen independently, so no kind of person is tied to a costume. Skin comes in ten tones,
  lightest to deepest.
- Clothes follow the world: coats in the cities, dark jackets edged with light in the neon world, cloaks and packs in
  the wilds, robes and pointed hats in the magic world, rags and masks in the ruins, pale suits among the builders.
- Other folk where the world has them: elves (tall, slender, pointed ears), dwarves (short, broad, bearded) and fae
  (small, winged, with a light about them) in the magic world and now and then in the wilds; androids with lit seams
  among the builders.
- Deer no longer graze without end. Between their moves each keeps its own slow rhythm, grazing, standing to look
  round, or lying down to rest with its head up, so a herd at any moment holds some of each.
- Rooks, pigeons, starlings and sparrows on the ground hop now and then, flicking their wings.

### Under the hood
- `pkPerson` paints a person from their own stream; `PK_SKINS` is the Monk Skin Tone Scale's ten.
- `wkAt` gives a grazing animal its `lie` and a ground bird its hop; `wkQuad` lays a deer down, its legs folded.
- docs/prior-art/ringworld-folk.md is the research (figure proportions, the Monk scale, a red deer's day).

## Pleiades–Atlas (2026-10-25)

- Saguaros grow as saguaros do. Each keeps its true slender width at any height and has no arms until it is over 3 m
  tall. After that it gains about one arm for every 1.7 m of height, never the same count twice, and now and then one
  never arms at all. Each arm goes out at its own bearing round the column: the arms behind are drawn in the column's
  shade, the arms in front in the light. Old saguaros' arms sometimes droop before they turn up, and now and then an arm
  grows from an arm.
- Each ring has its season, by the seed. From late April to mid June saguaros wear white flowers with yellow hearts on
  every crown, then red fruit into July.
- More of the desert grows in the dry country:
  - clumps of organ pipes;
  - barrel cacti leaning south, ringed with yellow and orange flowers in summer;
  - prickly pears of flat pads, yellow-flowered, then purple-red with fruit;
  - teddy-bear chollas, their silvery spines catching the light;
  - ocotillos, bare grey canes in leaf after the rains and red-tipped in spring;
  - agaves, a few old ones sending up their one tall flower stalk.
- Plants meet: a young saguaro grows beside its nurse tree, and ivy climbs some old trunks in the wet woods.
- Every plant's form follows its size, so a small one is young and a tall one old, regular for its kind.
- Some rings are drier on the whole than others, so dry country and its plants turn up more often.

### Under the hood
- `pkTree` takes the plant's height in metres (`hM`) and the season from its caller.
- docs/prior-art/ringworld-desert-plants.md is the research (the Park Service's saguaro growth, arms and flowering pages,
  and the other cacti's).
- The land kit's moisture spreads wider, each seed with its own aridity.
- The Ringworld's fingerprint updated (its plants, intended).

## Pleiades–Electra (2026-10-25)

- The Ringworld's sun casts the land's shadows now: hills and the rim walls shade what lies behind them from the sun, the
  shadows long and soft-edged at dawn and dusk, sweeping across the band as the sun goes down. Trees, creatures,
  buildings and fields standing in a hill's shadow are darkened with it.
- A shadow's edge, a forest's edge or a field's runs smoothly over the land, never in steps; the ground at your feet is
  drawn far more finely.
- By night street lamps lay pools of light on the ground about them.
- Boulders are of five stones, one to a region: rounded, speckled granite; blocky sandstone with its beds laid level;
  dark basalt in columns; pale, pitted limestone; slate in tilted slabs. A boulder on a slope is set into it.
- In the neon world each district has its own pair of neons, and its ground leans faintly to their hue.
- Glowing trees keep their glow close about their crowns, and there are fewer of them in the neon world.

### Under the hood
- `litAt` walks toward the sun over the drawn land from each corner, thing and field. A corner's light is kept with the
  mesh for that sun.
- `fillTri` shades a triangle exactly between its corners' colours with one linear gradient laid along the way the
  colour changes. A cell whose corners differ is drawn as two of them, and so is a field's wash.
- `rgStoneOf` chooses a region's stone; `pkRock` takes the stone (`PK_STONES`) and shapes and marks the boulder by it,
  its marks clipped to its outline. `slopeAt` sets things into slopes.
- `RG_NEON_DISTRICTS` and `lightsAt` give the neon world its districts' lights.
- The Ringworld's fingerprint updated (its light and stones, intended).

## Pleiades–Taygeta (2026-10-25)

- The Ringworld's land is generated now, the same land however the camera looks at it. Each seed lays real landmasses:
  continents and seas (some rings mostly land, some half water), plains and plateaus rising from the coasts, mountain
  belts inland and the spill mountains at the walls' feet, hills folding one behind another, escarpments stepping up in
  long cliffs, rivers winding across the lowlands to the sea, lakes, canyons cut stepwise through the dry uplands. How
  rugged the land is changes from seed to seed, and no mountain rises above the rim walls.
- Ten biomes by warmth and moisture (ice, tundra, taiga, meadow, forest, steppe, desert, savanna, jungle, marsh) fade
  into one another over transition zones, patchy at their edges as real ones are. The land cools with height, so the
  hills show their treelines and the high ranges stand white. The woods grow where the climate is wet enough, in patches
  with clearings.
- Raising, lowering, tilting or turning the camera no longer changes the land: the floor is a mesh fixed in the world,
  finest round where you stand. The far ranges are still drawn taller than they are, as before, but by how far they lie
  from where you stand, so they too stay put.
- The lit bands are kept where the land really drops away behind a crest, each face lit along its top with a bright line
  on the crest, and the land between is shaded by its slope against the sun, raking across the hills at dusk.
- Water has clear shores: sand at the edge, lighter shallows, a line of foam, and the far water holding the sky.
- Near, the ground carries the marks of its kind: grass blades, sand ripples, cracks and pebbles on rock, sastrugi on
  snow, lichen on the tundra, tussocks and pools in the marsh, a town's paving.
- The far floor on the arch overhead is laid as a map of its regions and shaded by its relief, so lakes and ranges read
  as shapes, not a checkerboard.
- In the neon world the main roads ride high as elevated highways on lines of columns.
- Detail now sets how fine the land is drawn, how far it reaches, and how widely the biomes blend.
- Fewer crashed ships lie about the countryside.
- In the film window, From and To now set the light as well as the camera. On the Ringworld the light dial shows the
  sun's arc over the film, a ring where it starts and a dot where it ends. As Time passes grows, the end turns round the
  arc, and a light set To is carried there along the sun's own way, rising and setting. Length now reaches three minutes.

### Under the hood
- The land kit (landKit.js, `lkLand`) holds the heights, seas, climates and biomes as pure functions of the seed and a
  place, its own periodic gradient noise (`lkNoise`) going round the ring. docs/prior-art/ringworld-terrain.md is the
  research behind it.
- The painter lays a geometry clipmap fixed in the world (`vh`, `meshH`). It finds the crests from the mesh's own
  occlusion horizon (`bandAt`), and paints every cell, thing, way and field far to near, each thing after the cells
  under its nearest edge.
- A cell takes its corners' ground colours (`vcol`) and cloud shadows, so borders and shadows run smoothly across the
  cells. The corners are kept between views of the same world, so turns and film frames ask nothing twice.
- Reviewed the tests:
  - test/land.test.mjs is new. It checks the land is a pure function and meets itself round the ring, nothing rises
    above the walls, the sea's share comes from the seed, there is land where you stand, the biomes blend as Detail
    asks, and the mesh keeps every corner however the camera rises, turns or tilts.
  - The graffiti check now tells a mark hanging free in the night from a bright stretch of the arch.
  - The tree-id check counts the trees this world grows.
- The Ringworld's fingerprint updated (its land redrawn, intended).

## Pleiades–Merope (2026-10-25)

- The Ringworld's stars are fixed to the sky now, as a skybox's are: turning the camera turns past them, the same way the
  arch and the land go by, so the ring no longer seems to swing round with the camera. Only the ring's slow spin moves
  them, and gently.
- The film window has the page's own light and camera dials in it, in a Camera and Light card at its top (on a desktop's
  Kinesis tab and in a phone's sheet; they go back to Materia when you leave). The Camera's From and To share the dial:
  From is where the film starts, the page's camera; choose To and set where it ends on the same dial, and the film then
  turns to that shot.
- Length is a slider now, two seconds to a minute, its ticks named; Time passes is a slider too, from real time through
  five minutes to two days, spread by how long it feels.
- Size is two choices: the Aspect (the page's own, 9:16, 4:5, 1:1 or 16:9) and the Resolution (720p, 1080p, 1440p or
  2160p as the short side, or Custom, your own width and height, which sets the shape too). A film is 1080p by default.
- In rain, a storm or snow the overcast lets the arch show through, just: the ring always looms.
- A crashed ship's smoke rises puff by puff and leans the way the wind blows, harder as it blows harder.

### Under the hood
- The star field is laid on a cube round the eye, each face cut into patches projected through the ring's camera
  (`rgPanSky`), every face its picture turned its own way so none repeats beside another.
- `movingDials` moves the light and camera rows into the window and back, `movingLeave` keeps the shot and puts the
  page's camera back; the film's size is the Aspect and the Resolution (`movingDims`); the time span's slider is a log of
  five minutes to two days (`movingSpanSecs`).

## Pleiades–Maia (2026-10-25)

- The Ringworld's stars are a backdrop now: they stay where they are as the camera turns, tilts or zooms, and drift only
  a little with the ring's own slow spin, a sixth of what it was, as do the planets and the nebula beyond it.
- Rain is rarer (about one seed in twenty-two, storms one in forty), and whenever it rains, storms or snows an overcast
  ceiling covers the sky: darkest overhead, thinning to a paler band at the horizon, mottled with the darker bases of its
  rolls, riding the wind. No sun rays shine through it.
- Field gates were drawn the size of the rare keyless gate in a cliff, as tall as a house; they are a gate's size again.
  The keyless gate keeps its own.
- The Ringworld's oil paint is retired. Life is now Flora (trees, grass, hedges, flowers); its seventh slider is Fauna
  (the wild things, the small finds and the droids), 40 by default, with smaller flocks; its eighth is Detail: Low,
  Medium, High or Ultra, how far out and how closely the plants, stones and small things round you are sown (Medium is
  how it always was; each step up takes longer to make). An older look opens with Fauna and Detail at their defaults.
- The neon world's ground is a lit grey now, not near black.
- The Moving Image on a phone is a column: the preview at the top and Make the film at the bottom hold still while the
  choices scroll between them; in the Kinesis tab the summary and the buttons follow the choices, so nothing lies over
  the file formats any more.

### Under the hood
- Every thing in the Ringworld's store has an id and tags (what it is, its world, what it does: npc, animal, plant,
  building, moves, flies…), the same thing keeping its id from any view; `ringStateOf` captures its state at a moment of
  the clock, a wild group's members each under the group's id and their number. The ids and states are tested.
- The keyless gate is `slabgate`: two tables shared the name gate, and the later won.
- The orders of the 24th and 25th are written into OPEN-ISSUES.md as the list being built, in order.
- Reviewed the tests: the editor's two-layer style checks moved from mobileCss.test to editor.test, the suite of their
  concern, and the helper both read (`effective`) into the shared harness; the Ringworld's slider remap is tested where
  the looks are (audit.test), and the things' ids where the wild things are (wildlife.test).

## Crux–Matza (2026-10-24)

- On a phone the Moving Image is the whole screen now, the page hidden behind it, with a preview at its top that always
  keeps its height: the page before a film, each frame as it is made with a thin line along its foot for how far the
  film has come, and once it is made, the film itself playing over and over until the sheet is closed. What the film
  will be and Make the film stay held at the bottom as the choices scroll under them; on a desktop they stay at the
  foot of the Kinesis column.
- Esoterica has a Moving Image card: Make a film of the page… opens it (the sheet on a phone, the Kinesis tab on a
  desktop), so holding Save image is no longer the only way in.

### Under the hood
- The preview box is drawn from the page's canvas after each frame is handed to the encoder (`movingShow`), and the
  film made plays from its own file in a video beside it, its address let go when the sheet closes. A stray Python
  cache that slipped into the last release is gone, and ignored from now on.

## Crux–Hadar (2026-10-24)

- Kinesis, a new tab on a desktop after Materia (its glyph ☿, the messenger's mark): the Moving Image's choices as a
  card in the left column, with the page beside them on the stage. While a film is made the stage shows each frame as
  it is drawn, at the film's own shape, so you watch it come together. Holding or right-clicking Save image on a
  desktop opens the tab; on a phone it stays the sheet it was. Set it now… and Set the shot… come back to the tab.
- While a film is made, nothing else on the page can be touched: the tabs, the other cards, undo and redo, the
  filmstrip and the keyboard's shortcuts wait, faded, until it is done or stopped, so no change can slip in between two
  frames.

### Under the hood
- The film's cards (`#movingBody`) move between the sheet and the Kinesis tab with the layout (`placeKinesis`), as
  Esoterica's do; their choices are listened to on the cards themselves. `movingInert` makes the rest of the page inert
  while a film is made, and the preview's scale holds then (`applyPreviewScale`), so the canvas never resizes between
  frames.

## Crux–Acrux (2026-10-24)

- The Ringworld has wild things now, and they move as wild things do. Deer and elk at the edge of the woods graze, lift
  their heads, walk on, and now and then bolt, fanning out as they run and closing up again where they stop. Hares sit,
  hop and sometimes dash; a fox trots the field edges toward dusk and now and then ends a trot in the mouser's pounce.
  Rooks, starlings, sparrows and pigeons peck about the grass and lift all at once, wheel round and come down somewhere
  else. Ducks and swans drift by the shore with a wake behind them and up-end to feed; a heron stands still at the edge
  and now and then flies slowly down the shore. A hawk circles up a thermal and glides on to the next; swallows and
  swifts hawk over the fields and the towns, bats come out at dusk, butterflies and dragonflies are found near you, and
  sometimes a skein of geese goes over against the wind.
- They keep their hours and their weather: the day's birds go to roost at dusk, swallows fly low and hawks are grounded
  in rain, butterflies stay down in it, and each group comes or goes one at a time, so a time-lapse thins or fills
  gently. They are drawn half again their true size, as a painter draws the creatures in a landscape, so they are found.
- Nothing on a loop: the grazing sheep, the gulls behind the plough (now each down in the furrow and up again in its own
  time), the insects, the fairies and the kites all drift on paths of their own that never come round again.
- The antenna dishes are built in the round: a bowl a third of its width deep with its rim catching the light, the feed
  held at the focus on four legs, the hub and its struts behind, the axle between the yoke's arms, the turntable on its
  pedestal, every piece joined to the next and lit from where the sun is, however the dish is turned.
- Now and then a well-made building stands close to where you are (a row house, a cottage, a chapel, a motel, an
  observatory, a wizard's tower), facing you, and fades away before it could fill the frame.

### Under the hood
- wildKit.js: the wild things, each member's place a pure function of its group's seed and the clock (`wkAt`): eras
  ending in a move, each leg held inside its era so nothing jumps at the turn, a drift on noise between (`wkWander`);
  painted in a few flat shapes (`wkPaint`). The Ringworld sows them by world and ground and paints them
  (`rgPaintWild`). A new suite, wildlife.test.mjs: no creature faster than it can go between two frames, a herd never
  back to the same spot, a flock lifting together, a bolt fanning out, every kind painted in every pose.
- `pkDish` builds the dish from points in its own space, painted far to near, its mount kept behind the bowl while the
  bowl faces you. Smoke and turned things keep a faded thing's transparency.
- The research: docs/prior-art/ringworld-wildlife.md and docs/prior-art/arena-on-a-ringworld.md (the long horizon's
  game); docs/prior-art/film-studio.md (the film studio to come); and docs/ring-ideas.md, the Ringworld's idea book.

## Crux–Imai (2026-10-24)

- Antenna dishes move together, as an array's do: they all listen to one source in the sky at a time, tracking it
  slowly, then slew to the next every few seconds of a film, each starting a moment after another. Each dish is drawn
  turned in the round: its bowl when it faces you, its ribbed back when it faces away, its feed out along its axis.
- Rain falls from a cloud as two to five curtains across its base, each its own width and weight, nearer or farther,
  slanting with the wind and swelling and ebbing on its own slow time, so a shower moves along the cloud and comes and
  goes instead of hanging as one panel.
- The Save image button says "hold for video" in small letters under its label when the surface shown can make a film
  by itself (it has a clock, a camera or a light to turn); the button stays the same size.

### Under the hood
- `rgDishAim` gives the array's aim at a moment of the film; `pkDish` draws a dish turned to a bearing and tipped to a
  height. A surface says whether it can make a film by itself through its caps (`canFilm`); `syncSaveHint` shows the
  hint. No fingerprint moved.

## Crux–Mimosa (2026-10-24)

- Rain on Glass seen through keeps its drops: each now has a faint body, its dark rim and its highlight over the bent
  surface beneath, where before, seeing through, the drops all but vanished at the preview's size.

### Under the hood
- `genGlassRain` lays a seeing-through drop as a rim and a highlight over a faint body, composited by their own
  coverage. No fingerprint moved.
- Reviewed the tests the film and See Through lean on (test/moving.test.mjs, test/textureLayers.test.mjs,
  test/persistenceCoverage.test.mjs, where the film sheet's mark controls are left out of the look as the sheet's other
  controls are): nothing stale.

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
