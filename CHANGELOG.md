# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

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

## Uranus–Miranda (2026-10-20)

- **Time Passing**, a new move in the Moving Image (on the Ringworld): an hour, six hours, a day or two days go by in
  the film. The sun keeps a real day's path, an arc up the sky and a long slow slide along the horizon, with days a
  little longer than nights and dusks that linger. The wind carries the clouds across the sky, the stars and the giant
  planet turn slowly overhead as the ring spins, meteors cross by night (on some rings a whole shower from one point),
  lights flicker, and windows go out and on again through the night.
- **Every Ringworld film has a little life in it:** the grass sways in gusts that travel across the field, insects
  dance, drones hover and dip, droids go about their rounds (a harvester working its field, a shepherd droid circling
  its flock, a beachcomber along the tideline), sheep take a few steps, rain and snow fall, glints move on the water,
  and lightning flashes now and then.
- **Frame rate:** 30, 48 or 60 a second; and films can run to **30 seconds**.
- **Clouds in the world.** The heaps of cloud now stand over the land at their own distance and height, drawn among the
  hills: a nearer hill hides one, a far range stands behind it, a high peak pokes through it, and from high up you look
  down on them. They're soft-edged and see-through at their rims, hazier the further off, finer in their billows the
  nearer they come. Rain falls from a cloud's base to the ground beneath it, and lightning strikes down to the land.
- **Gas giants.** The giant the ring orbits may be Saturn (now with Titan), Jupiter with its four great moons and the
  Great Red Spot, Neptune with its dark spot and white streaks, or pale Uranus lying on its side with its thin rings.
  The Arch's setting for it is now called **Gas Giant**.
- **An aurora** now and then by night where there is magic or the builders' fields.
- **The rim walls:** the builders' script is a band of runes between ruled lines; graffiti at a wall's foot is runes
  too, thrown up in outline in the towns and scrawled in the ruins, paint running down. Near, the walls show their
  seams, weathering, hatches, and lights along their tops.
- **Close up**, large painted surfaces show a faint grain of their material; the lit band under a gentle hill's crest
  runs on without steps; magic worlds farm fewer moonflowers, in a quieter silver.

### Under the hood
- The camera carries the scene's clock (`setSceneTime`; keyed only when set, so stills are as they were); turns and
  tilts are kept to a hundredth of a degree so a film's camera and sun move smoothly. moving.js's `sunPath`;
  stepsRing.js's `farAt`, `paintHeap`, `rgGiant`, `rgRune`; paintKit's `pkGrain`.
- Reviewed the tests: the Moving Image's suite gained the sun's day (it comes round, longer than the night, an arc
  without jumps, a lingering dusk); the persistence suite's seven Moving Image exemptions became one list; the
  remaining "it is retired" checks were read and kept, as invariants for old looks, stitches and names.

## Uranus–Mab (2026-10-20)

- **The Ringworld's countryside.** Round every village and town the land is farmed now: a patchwork of fields laid
  out on each farm's own lines, thinning toward the wild, in the crops its climate grows (wheat, barley, hay with its
  mowing stripes, pasture, the plough's furrows, rapeseed, maize; lavender and vines in dry country; rice in the warm
  and wet; the builders' gardens, the magic world's moonflowers glowing at night, the ruins gone to fallow). Fields are
  hedged in wet country and walled in dry, and on the steep near a town the land is terraced along its contours.
- **What the fields hold:** round bales on the stubble, ricks in the hay, a flock grazing on the pasture (now and then
  with its shepherd droid), a scarecrow in the corn, hives beside the flowers, a harvester droid at work, a tractor at
  the field's end. A tree is left standing in a hedge here and there; elsewhere trees keep out of the fields and back
  from a house's walls.
- **The shore:** where a town comes down to the water, boats moored off it at the end of wooden jetties, and a
  beachcomber droid along the tideline. Where the builders were, now and then a bridge of hard light crosses the water.
- **A town's lights at night.** Far off, every house too small to draw is a lit window, every street lamp a point on its
  string, and the lights between the houses come on one by one through the dusk. A lamplighter droid makes its round at
  dusk.
- **Drawn in the round.** The sheep, the boats and the harvester are built as solids and drawn as the eye sees them
  turned, a little from above, the way the turned things will go next.

### Under the hood
- The store lays `out.fields` (`RG_CROPS`), the jetties and bridges as ways laid at a deck's height, and the town's
  `glim` lights; the land paints fields piece by piece with the ridges, as it paints the ways. paintKit's `pkSpace` and
  `pkBox3` draw a thing's solids in its own frame; `pkSolidProp` draws the sheep and the boats; four new robots in
  `pkRobot`.

## Uranus–Puck (2026-10-20)

- **Moving Image.** Hold Save image (or right-click it) for a small sheet that makes the page into a short film, drawn
  frame by frame at full quality: the poem when it is shown, the credit line always. Moves: **Camera round** (a
  seamless turn of the camera, for a surface that has one), **Light round** (on the Ringworld, **a day passing**: the
  sun up over noon, down to dusk, through the night and back to dawn), and **To another look**, or **there and back**,
  easing every control from this look to one of your spells or to the look before your last change, and fading across
  where the surface itself changes. Wide (1920 × 1080), tall (1080 × 1920), square or the page's own size; 6, 12 or 24
  seconds at 30 frames a second; an MP4, a WebM, or the PNG frames in a zip. Every loop ends where it began, so it
  repeats without a seam. Nothing is downloaded to make it: the browser's own video encoder does the work, and a
  browser without one still makes the PNG frames.

### Under the hood
- moving.js: `blendLooks`, `wholeChanges` and `moveAt`, and the containers written byte by byte (`mp4Parts`, with its
  index before the frames; `webmBytes`; `zipParts`, stored, with `crc32`). uiMoving.js: the sheet and `makeMoving`,
  the frames drawn offline at the film's size and given to WebCodecs' encoder. A click in the sheet is not a step of
  history. A new suite, test/moving.test.mjs, reads each container back.
- A film at the page's own size is held to 4K's area; the PNG frames stop short of a zip's 4 GB. Prior art:
  docs/prior-art/moving-image.md.
- Pruned the stylesheet: every declaration verified in use (none removed).

## Uranus–Perdita (2026-10-20)

- **Eight views.** Everything in the Ringworld now turns a way of its own (a house toward its street, a car along its
  kerb, a bench to its path, a billboard to the road) and is drawn as the camera sees it: from the front, half turned,
  side on, from behind. Houses narrow as they turn and show a side wall in sun or shade; round things (yurts, domes,
  trulli, oast houses) look the same all round. A car met head on shows its headlamps, from behind its tail lights;
  tractors, carts, bicycles and benches the same. A billboard from behind shows its bracing and the bare backs of its
  sheets; a road sign its blank back; vending machines their vents. Anything turned the other way is mirrored, with its
  light still on the sun's side, except what carries writing. Trees are mirrored by the seed, so a row of one kind
  varies.

### Under the hood
- `viewOf` in the Ringworld's painter; `pkFlip`, `pkPropEnd`, `PK_SIDE_NATIVE`, `PK_WRITTEN`, `PK_BACKED`,
  `PK_BOXLIKE` and `PK_ROUND` in the paint kit; buildings, the ways' furniture and the boards keep a `face`.

## Uranus–Belinda (2026-10-20)

- **Ways, not a grid.** The Ringworld's streets were a grid laid over every town; now they are ways, and fewer: the
  main roads, and from the heart of each town (as many as Works builds) a few ways out and one on to the next town,
  each walked across the land curving toward the level and away from the steep, so it follows the contours. Each is
  made of something of its world's: asphalt, cobbles, brick, gravel, packed earth with its ruts, flagstones, stepping
  stones in moss, the builders' pale paths and paths of light. They wear: cracked, potholed, weeds at the edges, and in
  the ruins broken right through. The lamps, cars, benches and signs stand along them and face them; poles carry the
  wires along the main roads out of town; buildings and trees keep off them.
- **Cumulus** clouds sit on flatter, softer bases.

### Under the hood
- The store walks its ways (`RG_WAYMAT`, `RG_WAYHALF`, `RG_WAYCOL`, `RG_LIT_WAYS`) and the land paints them piece by
  piece with the ridges.

## Uranus–Cupid (2026-10-20)

- **The Ringworld fills a wide view.** The land reaches the page's edges at any lens and any shape of page (it showed
  flat bars of colour at the sides of a wide page, even at the usual lens); things at the frame's edge slide out of it
  instead of vanishing when their middle crosses it; and the widest lens is held back before the world turns inside out.
- **Clutter**, a new knob for the Ringworld: how much stands about the streets and roads (lamps, signs, billboards,
  benches, bicycles, vending machines, parked cars, hay in the fields), apart from Works. At its middle there is less
  than before.
- **Streets.** Towns are laid out on streets now (lanes in the villages, broken streets in the ruins), and the
  furniture stands along them instead of being scattered: lamps along every street, lighting it at night with pools on
  the ground; cars parked at the kerb; a bench with a bicycle against it, a bus stop, a food cart; a signal, a sign, a
  phone box or vending machines at the crossings; mailboxes along the village lanes; in the ruins, rusted cars sunk into
  the verge and tank traps across the way. Buildings front the streets instead of standing in them, and the main roads
  through town are lit.
- **Nothing floats.** Things are set into the ground a little, and the ruins' wrecks, bikes and barrels are half buried.
- **Weather**, by the seed: mostly clear (now and then high cirrus and low bands of cloud), often heaped cumulus lit
  from the sun's side, sometimes fog in the valleys, rarely rain falling in veils (and a rainbow opposite a low sun),
  a storm with lightning, or snow lying down to your feet. Rays fan from a low or clouded sun, and its glare lies over
  the land when it is low.

### Under the hood
- The cuts follow the view's reach (`PHI`, `smax`, `angOf`, `cutOf`); the store lays the streets and their furniture
  (`RG_STREET_KINDS`, `RG_SINKS`) and the weather is chosen once for both parts (`rgWeatherOf`).
- Housekeeping: reviewed the tests: no suite repeats another's check; the dial-guide check no longer names the retired
  3D Ringworld; a new check holds the Ringworld's widest lens.

## Uranus–Rosalind (2026-10-20)

- **The Painted Ringworld is now the Ringworld.**
- **A less cartoony hand** for everything the Ringworld paints (and Ring in the Sky and Night City, which share the
  kit): every wall is shaded from the sky down to its foot and throws its shadow on the ground; weather streaks down
  concrete and rust down steel; things are made of their own materials (wood, stone, brick, rust, paint, galvanised
  steel) lit by the scene's light instead of all one grey; windows hold the sky by day, with sills and lintels when
  near, and are lit in clusters by night; tree crowns are clumps of leaves with ragged edges and gaps, not balls;
  trunks flare into their roots; boulders are many-faceted, cracked and lichened, grass grown up round them. No faces
  on anything.
- **The old sprites brought up to the new**: the city's towers have lobbies, piers and crowns, shopfronts under
  striped awnings, cornices, fire escapes, raised blocks on their columns, domes on colonnades behind porticos; the
  cottages, barns, silos, windmills, terraces, castles, lighthouses, cathedrals, clock towers, factories and water
  towers all gained their doors, frames, boards, slates and smoke; the wizard's tower its ivy and pennant; the onion
  domes their gores and gilt.
- **The row of five pale squares was a stone circle** drawn as slabs at the size of a skyscraper. Now it is one: rough,
  leaning, lichened stones of two to seven metres round a ring, standing in the world, some gone, one fallen, some
  joined by lintels; and now and then one near enough to walk to.
- **Billboards**: the grinning moon is gone. In its place thirty-eight boards for brands that never were, beside the
  roads and on the approaches to towns, each world its own and the jokey ones rare: Old Pale Dairy ("from cows who
  never saw night"), Coriolis Cider ("pours a little to the left"), Edgeward Mutual ("fell off the edge? You're
  covered."), Shadowsquare Blinds ("night, sold by the metre"), the Starless Cinema, Prior Tenants Relic Removal, a
  builders' plaque ("back in 40,000 years"), Canned Daylight, Ring Bonds, a hand-painted survivors' sign; spin
  advisories, a missing-robot poster, a faded political poster, a map that says you are here (and, eventually, here
  too); and now and then a verse on five little boards along a country road. Each is a real thing: a timber board on
  posts, a pasted poster on steel with its catwalk and lamps, neon tubes that light at night, a seamless slab, a
  hanging shingle. Some are faded, peeling, torn through to an older board, or half-pasted with the crew still up there.
- **A far wider library**: poles carrying wires along the roads; stone walls, hedgerows, gates; round bales, haystacks,
  troughs, a windpump, a well, a scarecrow, beehives, cairns, milestones, a wayside shrine, a tractor, grain bins; bus
  stops, a red phone box, vending machines, traffic lights, kiosks, food carts, parked cars and scooters; rubble,
  broken columns, a toppled statue, rusted cars, shipping containers, tank traps; dishes, solar fields, beacons, pipes,
  cargo and a surveyor's tripod; standing stones, dolmens, fairy rings, will-o'-the-wisps, giant flowers, toadstool
  houses, a moon gate, a wishing well. People are drawn as people (seven and a half heads tall, coats and trousers).
- **Villages build in one tradition each**, by their region and climate: thatched cottages and oast houses, prairie
  barns and grain elevators, yurts on the steppe, rondavels on the savanna, trulli, granaries on stone pillars, adobe
  pueblos, machiya and steep-thatched farmhouses, stilt huts in the tropics, stave churches in the north; and in town a
  filling station, a motel with its arrow sign, a chapel, greenhouses, a radio mast.

### Under the hood
- The kit's finish (`pkShade`, `pkCast`, `pkStreaks`, `pkMat`, `pkFrame`, `pkIvy`), the boards (`pkBoard`, `PK_BOARDS`,
  `PK_SERIALS`), the stones (`pkStone`, `pkLintel`, `rgHenge`), the wires (`pkWires`), the vernacular
  (`PK_VERNACULAR`, `rgVernacular`); the small things placed by what they need (`propFits`) and the larger ones sown
  further off (`PK_PROPS_BIG`); roads shared by the land and the store (`rgRoadsOf`). The research is in
  docs/prior-art/ringworld-sprites.md.
