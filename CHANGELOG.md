# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

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

## Neptune–Galatea (2026-10-21)

- Ringworld's clouds are remade. Each heap's billows grow out of one another into one body, so none floats free as a
  ball; the heap is lit as a whole and its edge breaks into faint wisps; drawn near, it shows a cauliflower's smaller
  billows. The light on it follows the sun: from above by day; from below at dawn and dusk, the undersides warm and the
  tops gone violet; and with the sun behind it, a dark heart and a shining edge.
- In a film the clouds drift slowly, breathe and roll, and each lives in clean stages: it gathers from scattered wisps,
  stands, thins and is gone, and a new shape only ever gathers from nothing. A heap that swells overhead fades away.
- Clouds cast shadows on the land, soft and lumpy, which sweep the hills as the clouds drift; whatever stands in a
  shadow darkens with the ground under it.
- Rain falls from a heap in a curtain of streaks, swaying with the wind; some heaps trail rain that never reaches the
  ground; in cloudy weather a far heap may rain a shower out over the land; lightning lights the whole scene a moment.
  Cloudy weather has more heaps, more of them nearer.
- The sky glows round the sun and along the horizon under it, burning orange and red low down at dusk and lingering
  after the sun has gone; at dusk and dawn the pink Belt of Venus rises opposite, over the blue-grey of the world's
  shadow. Cirrus are combed into fine strands, some hooked.
- New in the air: by day over dry country, now and then a dust devil wanders and dies away; at dusk on some rings a
  murmuration of starlings folds over the fields.
- Films move a little slower: the grass, the droids, rain and snow, flicker and smoke run on a gentler clock, and the
  droids, walkers and flocks wander long smooth paths instead of shuttling back and forth.
- Nothing is cut off before it leaves the frame: big near buildings, rocks, boards and droids are drawn until they are
  wholly out of view. A wall filling the frame shows a fine mottle, never grey blots.

### Under the hood
- `rgCloudTime` and `rgMotionTime` (the clouds' clock and the small motions'), `cloudShadeAt` (a cloud's shade at a
  point of the floor) and the shadow sheet laid on each ridge's face before what stands on it; `RG_MOVES` as two slow
  sines whose periods never line up. Wind Waker's cloud code (as noclip.website reads it) is in
  docs/prior-art/ringworld-time.md §4, and the sky's prior art in docs/prior-art/ringworld-sky.md.
- chains.test.mjs compares the gas giant's drawings warm: the kit keeps a building's face once it has read it, so a
  first drawing makes canvases a second never does.
- Fingerprints: Ringworld's only, for its clouds, their shadows and the sky.

## Neptune–Despina (2026-10-21)

- Nothing you'll see yet: after Neptune's last moon, releases will be named for stars, each cluster and one of its
  members (`Pleiades–Maia`), the nearest clusters first and each one's members nearest first: Ursa Major, the Hyades,
  Crux, the Pleiades, Lupus, Scorpius, Alpha Persei, the Beehive, Perseus and Orion's belt, forty-six names.

### Under the hood
- `CLUSTERS` in build.mjs, from docs/prior-art/star-cluster-names.md (every star's IAU name, its distance and its
  membership, with the sources and the disputed members); the release notes' name now reads a name with a space in it.

## Neptune–Thalassa (2026-10-21)

- Films are made faster: while one frame is drawn and encoded, the frames to come are made side by side, one on each
  spare core of the machine (up to eight; a phone keeps to its usual one or two). Each frame is drawn once, never first
  with the last frame's surface, and a slow surface is no longer made first as a small draft nobody sees. The note says
  how many frames are being drawn ahead.
- The screen is kept awake while a film is made, and asked for again if the page is hidden and shown again.
- Nothing stops a film by accident: closing the sheet, Escape or a tap outside it now says the film is still being made
  and carries on; Stop asks first (tap it twice); leaving or closing the page asks first too.
- A film keeps going in a tab in the background: it waits on the encoder's own signal, not on a timer the browser slows.

### Under the hood
- Housekeeping: reviewed the tests: nothing checked that a film's frames made ahead are the ones its drawing asks for
  (if the two keys ever differ, every frame is made twice); moving.test.mjs now boots the page and checks it, and fails
  when the look ahead's scale is off.
- `surfaceRequests` (the textures the page would ask for, without drawing), `prefetchTexture`, `adoptPrefetched` and
  `setFilmPool` (a worker per spare core while a film is made); PERFORMANCE-AUDIT.md has the measurements. A building's
  face is read back once per look and kept (`pkFaceProof`), from a canvas the CPU keeps.

## Neptune–Naiad (2026-10-21)

- Painted Landscape has a new country, a river: green hills opening into a valley, the river winding down it toward
  you and widening as it comes, glints on it and its banks dark. It is two in five of the grassland seeds (no other
  seed's country changes), and the Country menu offers it.
- The Painted Landscape's water has a mood by the seed: still as a mirror with its reflections whole, ruffled as it
  was, or choppy, short strokes crowding with white on their crests.

### Under the hood
- Contour Map's preview gap narrowed down, not yet fixed (OPEN-ISSUES §3): not the hillshade, not the Terrain; the
  preview's lines carry a little less ink. Texture fingerprints updated for the landscapes with water.

## Uranus–Ferdinand (2026-10-21)

- The Ringworld's walkers, shepherd droids and tracked crawlers turn with the camera instead of only flipping: a
  walker coming toward you is its head between four legs, the far legs behind its body and the near ones before it;
  a shepherd's head is turned as it goes; a crawler shows both tracks and its wheels from the side, its arm over it.

### Under the hood
- `PK_BOTS3` names the droids drawn in the round (with the harvester); the Ringworld passes them their view and its
  eye. Texture fingerprints updated for scenes with these droids.

## Uranus–Setebos (2026-10-21)

- Windows keep the hours: as the evening begins most of a town's windows are lit, and as the night deepens toward its
  middle fewer stay on. In a Time Passing film each window goes on and off in its own time, hours apart: an evening's
  comings and goings, a light left burning, a kitchen before dawn.

### Under the hood
- `pkLit` decides every window (the blocks' grids and ribbons, the houses' framed windows, the turned buildings'
  sides) from the night's depth and the scene's clock. Texture fingerprints updated for night scenes with buildings.

## Uranus–Prospero (2026-10-21)

- Fixed: standing right beside a factory on the Ringworld could fill the bottom of the picture with a vast flat roof.
  Turned buildings and things are now seen from above only as far as the eye is above them: a roof at your own
  height is seen edge on, a taller one from below, and a building's front leans in as a tall wall does when you stand
  near it. Far off, the town is still seen a little from above, as the painting likes it.
- A terrace of houses keeps its roof when turned (its row of gables had been read as a flat top).

### Under the hood
- `pkSpace` takes the eye's height over a thing's foot (the view's `eyePx`): its tilt runs from seen-from-above at
  the ground to edge on at the eye and seen-from-below over it, and `pkTurned` lays a face in strips when that changes
  across it. The Ringworld passes the camera's own eye near and a higher painter's eye far (`seen`). Found by rendering
  forty seeds from random cameras and looking at them. Texture fingerprints updated for the Ringworld's buildings.

## Uranus–Margaret (2026-10-21)

- Fixed: on some Ringworld seeds a rune of wall graffiti hung in the sky, as big as a moon. Graffiti, the builders'
  glowing script and the city screens painted on a far wall seen almost edge on spilled off it; now whatever is
  painted on a wall stays inside that wall, and a word of graffiti slants as a hand would write it.

### Under the hood
- Housekeeping: reviewed the tests: the Ringworld's walls had no check that their art stays on them; chains.test.mjs
  now renders the reported seed and finds no mark bigger than a star standing free in its sky (it fails on the old
  code, 366 pixels). The hygiene suite's stylesheet window went with that step; no suite still tests the retired end-on
  drawings of cars, tractors and carts. AGENTS.md's rule 12 no longer lists pruning the stylesheet.
- Texture fingerprints updated for the Ringworld's walls.

## Uranus–Sycorax (2026-10-21)

- Nothing you'll see: a housekeeping release.

### Under the hood
- The stylesheet prune is no longer a standing step of every ten releases: AGENTS.md and the hygiene test ask only
  that the tests be reviewed within every five. tools/css-prune.py stays for when the stylesheet is touched.

## Uranus–Trinculo (2026-10-21)

- Nothing you'll see: a housekeeping release.

### Under the hood
- Housekeeping: pruned the stylesheet: tools/css-prune.py audited all 2,530 lines and found 323 declarations that
  looked overridden in every state, but each, taken out, changed some drawn element somewhere (a drawer's rows, a
  sheet's width, a dial's turning point), so all went back. Nothing was removed; the stylesheet carries no dead weight
  the audit can find.

## Uranus–Stephano (2026-10-21)

- A castle turned from the camera keeps its battlements along every wall, not only along its front.
- Now and then on a fair, windy day someone flies a kite in the fields or a city's green: high and downwind by the
  ring's own wind, nodding on its string, its tail of bows waving as time passes. Kites are put away by dusk and in
  rain, fog or snow.
- Chimney smoke leans with the ring's wind (blown nearly flat in a strong one) and, as time passes, rises from the pot
  and thins away; a factory's saw-tooth roof no longer leaves its teeth floating beside it when seen from the side.

### Under the hood
- `pkSmoke` draws the chimneys' smoke from the wind and the clock the Ringworld passes down; `PK_BOX3` takes a fifth
  entry, how far above a flat top what stands on it begins. Texture fingerprints updated for the smoke, the castles,
  the factories and the kites.

## Uranus–Caliban (2026-10-21)

- Tractors, food carts, crates, wayside shrines and the builders' cargo are solid when the camera turns: a tractor's
  bonnet and glazed cab with its great wheels outside it, a cart's box on its wheels under its round umbrella, crates
  braced on every face and stacked a little askew, a shrine's niche on the side toward the road under a hipped roof.
- A windmill's tower is the same from every side, and its sails turn with it: narrowed edge on, behind the tower when
  the mill faces away.
- Cathedrals and castles turn as boxes; a torii or an arch narrows to its post or its pier edge on.
- A terrace of houses is as shallow as a terrace is, not as deep as it is long.

### Under the hood
- `pkPrism`, `pkWheel3` and `pkWheelsSplit` build the vehicles; the end-on drawings they replace are gone. Texture
  fingerprints updated for the new solids, the windmills and the gates.

## Uranus–Francisco (2026-10-21)

- Parked cars and rusted hulks are solid: a body and a glasshouse with their roof, windscreen and boot each lit by the
  side it turns to the sun, four wheels turned with the car, headlamps or tail lamps on whichever end you see. Half
  turned, a car shows its length and its width, never a shortened side.
- Silos, lighthouses, water towers, observatories, wizards' towers, pagodas, onion domes and domed mosques are the same
  from every side instead of narrowing as the camera turns.

### Under the hood
- Housekeeping: reviewed the tests: the turned-in-depth drawing had no suite of its own; turned.test.mjs now checks it
  on a real canvas (a block side on shows its depth, half turned its front and side; a side wall is its face's colour;
  a chapel side on is its nave with its belfry standing; a granary keeps its stilts; a car half turned is not shrunk; a
  vending machine's top shows), and each of those checks fails with the turning switched off. Texture fingerprints
  updated for the solid cars and the round buildings.

## Uranus–Oberon (2026-10-21)

- Vending machines, phone boxes, mailboxes, shipping containers and troughs turned from the camera are solid too: a
  pair of vending machines shows each machine's own colour down its side and their plain backs from behind, a mailbox
  stands on its one post, a container shows its end and its long side in depth.
- A building on stilts (a kubo, a granary) has its walls painted the colour of its walls, not of the ground between
  its posts.

### Under the hood
- The turned box is general now: `pkTurned` takes the thing's own face to draw, and buildings and the boxlike props
  (`PK_PROP3`) both go through it; a prop whose face can't be read is squeezed as before. Texture fingerprints updated
  for the turned props.

## Uranus–Titania (2026-10-21)

- Buildings turned from the camera are solid now, not a picture squeezed thin: a cottage, a barn, a chapel, a terrace,
  a brick block or a tower shows its painted front foreshortened, the side turned toward you with its own windows, a
  gable roof running back to the ridge or a flat roof seen from a little above, and its plain back and gable from
  behind, every face lit by the sun's side.
- Each box takes its shape and colours from the building's own front: as wide and as tall as its walls, a setback
  tower stepping back in boxes, a granary up on its pillars, the roof and walls the same thatch, slate, brick or paint
  as the front (a terrace's ends each the end house's colour), a glasshouse's long sides glass.
- Spires, belfries, water tanks, chimneys and their smoke stand upright from every side instead of vanishing edge on;
  a stave church's spire now rises from its roof turret instead of floating above it.

### Under the hood
- `pkBuilding3` draws a box-built building in `pkSpace`, its kinds and depths in `PK_BOX3`; `pkFaceProof` reads the
  front's outline and colours back from a small proof drawn off the page. Texture fingerprints updated for the turned
  buildings on the Ringworld and its kin.

## Uranus–Umbriel (2026-10-20)

- **Slower, truer clouds.** The wind is a fair-weather breeze now (three to seven metres a second, faster under a storm),
  and in a film of hours the clouds move as a time-lapse moves them, at most two seconds of wind from one frame to the
  next, so they drift instead of racing. Each cloud lives a quarter of an hour or so of that: it thins and is gone, and
  another builds in its place.
- **Films up to a minute** (45 seconds and a minute added to Length).

### Under the hood
- stepsRing.js's `rgWind` and `rgCloudTime`; each heap's life cycle keyed to the clouds' clock, so a still is unchanged.

## Uranus–Ariel (2026-10-20)

- **Dawn and dusk linger in a film.** Time Passing and the Ringworld's day give the hours near sunrise and sunset about
  three times more of the film than the rest, as games keep their clocks, so a day squeezed into seconds still has a
  sunrise and a sunset to watch, and loops where it began.
- **Fireflies.** At dusk and by night the Ringworld's insects are fireflies, each flashing its cold yellow-green light
  for most of a second every five or six, each in its own time.
- **Mist in the low land** at dawn and dusk on still days, lying along the foot of the low ridges.
- The stars turn with the ring's spin at a degree and a half an hour (Niven's ring: once in 225 hours), and clouds in a
  fast film drift from frame to frame instead of leaping.

### Under the hood
- moving.js's `filmHours` (the film's clock through a day, slowest near the horizon); the Moving Image suite checks it
  runs forward from start to end and gives dawn and dusk their share.
