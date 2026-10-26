# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Scorpius–Alniyat (2026-10-26)

- The Ringworld's land is now drawn with WebGPU wherever the browser has it: current Chrome and Edge (including on
  Android), Safari 26 and Firefox 141. All the land's polygons go in one pass instead of thousands of separate fills.
  The ground's brush strokes and marks are worked out on the GPU from where each point lies in the world, so they cost
  the processor nothing and stay put as the camera moves. Browsers without WebGPU, and computers with only a software
  version of it, draw the land the old way. Adding ?cpuland to the address also draws it the old way, to compare frame
  times.
- The land is now laid down whole first, and then everything standing on it. Each thing is trimmed only where nearer
  land rises in front of it.
- Hedgerows no longer sit on a flat dark slab. Their bushes come down to the ground in shade, with a soft shadow
  underneath.

### Under the hood
- New module ringGpu.js: `ringGpuInit`, `ringGpuBatch` and `ringGpuDraw`, with a WGSL shader that lays the ground's
  marks on world-fixed grids.
- The texture worker and the page open WebGPU once at start (`setRingGpu`). Software adapters are refused unless ?softgl
  is set.
- The painter's back-to-front step changed. The floor (cells, ways, fields, walls) is drawn first. Things follow, each
  clipped by its depth bucket's horizon where its box meets it. There are now 96 depth buckets, and mist and fog are
  folded into the haze by depth (`mistAt`).
- New tool tools/gpu-ring.mjs draws the WebGPU land above the canvas land in a headless Chromium and times each.
- The Ringworld suite checks the canvas fallback and the GPU batch.
- New research notes: docs/prior-art/ringworld-gpu.md (why WebGPU, what moved, and a PS1/PS2 look for the engine).

## Scorpius–Antares (2026-10-26)

- The ground's painted marks and brush strokes are now fixed to the land itself. They no longer flicker or reshuffle as
  the camera moves or the drone flies. Close up they are fewer and larger instead of finer, which is also quicker to
  draw.
- Less pop-in. A thing near the edge of being hidden by a hill or a tree is now drawn rather than flicking on as the
  camera moves.
- Things smaller than about two pixels are no longer drawn at all, which saves work. As they come nearer they fade in
  over the next pixel and a half instead of popping on.
- Drone flights are more fun:
  - faster (about 27 mph);
  - weaving across the route;
  - a low run just over the land and the treetops, lifting before a hill or a wood rather than going through it;
  - a pop-up as it reaches the subject, then a long climb away.
  The first moment uses the camera as it was set; after that the drone takes over where it looks.
- Solar fields are no longer flat pictures. Each panel stands on its own tracker and turns to face the sun, then lies
  flat at night. Seen from in front it is dark blue, catching the sky and the sun's glint; from behind you see its grey
  frame. Each panel casts its shadow on the ground.

### Under the hood
- `rgGroundGrid` lays the ground's marks and strokes on world-fixed octaves (2 m and up), crossfading between them.
- `rgSolarField` builds the trackers in world space through the camera's own projection.
- The visibility test (`vis`) hides a thing only with a margin to spare.
- The drone's route now carries an absolute camera tilt (`lift`) and reads the ground and woods ahead (`ground`).
- The Ringworld suite checks that one cell or four lay the same ground marks.
- New research notes:
  - docs/prior-art/ringworld-painted.md §5–6 (the ground's paint, solar trackers);
  - docs/prior-art/film-animation.md (the livelier drone).

## Scorpius–Paikauhale (2026-10-25)

- Hunters have come to the Ringworld, fewer than the animals they hunt and each in its own country:
  - stoats bounding along with their backs arched, turning white in winter apart from a black tail tip;
  - badgers out at dusk, grey with a striped white face;
  - spotted, tufted lynx creeping low through the cold woods;
  - wolf packs trotting and lying up in the north and on the tundra;
  - jackals in dry country.
  Now and then a small one turns up near you.
- Overhead, a barn owl quarters the fields from dusk, and by day a kestrel hangs on the wind over one spot, head still,
  then slides on or drops into the grass.
- Fantastic creatures for the magic world:
  - drakes, two-legged and winged, soaring like hawks;
  - moonharts, pale deer with one spiral horn and a mane in the region's light;
  - lantern moths glowing softly at night;
  - on any ring with magic in it, pods of vast sky rays rowing slowly through the high air.
- New weathers, each picked by where the seed puts you:
  - a sunshower, with its rainbow when the sun is low enough;
  - blowing dust in dry country, the air turning ochre;
  - the aurora in the cold, its curtains drifting slowly;
  - blossom drifting down in spring;
  - motes of light rising in the magic world;
  - ash falling over the ruins.
  None of them ever flashes. The Weather setting offers all six.
- Fixed boats, jetties and ducks sitting on dry sand on rings with the builders' terraces. The terraces were levelling
  low coasts to exactly the waterline, which drew them as dry land.

### Under the hood
- wildKit gained the hunters' forms (`WK_HUNT`, `wkHunter`), the owl, kestrel, drake, sky ray and lantern moth painters,
  and two new ways to move: `hover`, a kestrel's hunt, and `cruise`, a sky ray's wide circle.
- The rarer weathers stand on a common sky (`RG_WX_BASE`) and drift in the snow and rain shells (`RG_FALLS`).
  `rgWeatherOf` reads the biomes where you stand.
- landKit: the lowest terrace step is now a bank rising from the water instead of a shelf at the waterline.
- New research notes:
  - docs/prior-art/ringworld-wildlife.md §9 (the hunters);
  - docs/prior-art/ringworld-magic-creatures.md §3–6;
  - docs/prior-art/ringworld-weather.md §4.
- The wildlife suite checks:
  - the hunters are fewer than their prey;
  - the fantastic creatures stay in the magic world;
  - the badger's face and the stoat's winter coat;
  - each weather appears only where it belongs;
  - the new kinds' top speeds.

## Scorpius–Jabbah (2026-10-25)

- Drone flights follow a route of the seed's own. The route heads out toward the most picturesque thing within reach (a
  coast, a town, a summit or a lake), passes it to one side and carries on. The drone climbs to a proper height of about
  25 to 80 m, turns to watch the subject as it goes by, and looks down a little. It keeps clear of the hills it crosses.
- Drone films render faster. Land the drone has already flown over is kept, so it is not worked out again, and shadows
  no longer have to be recomputed every frame.
- No more World slider. Every Ringworld is now wild over about half its length, with two to four other worlds (cities,
  neon, the builders', magic, ruins), picked by the seed, in stretches of their own. Saved looks keep all their other
  settings.
- Paved towns have proper streets. Wherever a world paves its roads, the streets follow one grid turned to suit the
  seed: local streets block by block, a collector every third street and a wide arterial every ninth, laid out by how
  dense the town is. Paved roads between towns run straight. Dirt and gravel paths still wander with the land.
- Rows of houses sit under one long roof, its ridge running along the street, with chimneys between the houses and a
  dormer here and there. They no longer look like a cluster of spikes when seen at an angle.
- It snows less: only in a seed's winter, and more lightly.

### Under the hood
- `rgDroneRoute` plans each seed's route, and the film sends only how far along it the camera is (`fly.route`). The
  route's world is built once, scattered along its whole line (`L.path` is now a line of points).
- Corner data for the land is now looked up by its place in the world, wrapping round in each ring's store (`kAt`), so
  land the camera has passed is reused.
- `rkRegions` gained `half`: the wilds and the seed's clustered worlds. `rgWorldOf` picks a ring's worlds, and the
  Ringworld's knobs each moved down a place. Saved looks are converted from format 11 to 12.
- The streets' grid and their hierarchy (`PAVED`, `PAVES`), and engineered paved roads (`walk`'s stiff).
- Reviewed the tests: the regions suite now checks the half-wild rings and their clustered worlds instead of the World
  slider. The audit suite checks the format-12 conversion. The Ringworld and moving suites check the drone's route.
- New research notes: docs/prior-art/ringworld-streets.md (road hierarchy, block sizes, procedural cities).

## Scorpius–Iklil (2026-10-25)

- Drone flights. In the film window, Camera round now has a new Also choice, Drone flight. The camera itself flies ahead
  in the direction it first faces, at a drone's fly-over speed (so a longer film flies farther, never faster). It skims
  low, then climbs as it goes, its gaze dipping a little; it sets off and arrives gently, and it can turn as it flies.
  It flies over the land as it is: towns, walls, woods and fields pass beneath it and stay where they are from frame to
  frame, and it never sinks into a hill it crosses.
- The camera can now stand anywhere along and across the ring, not only where the seed puts you. This is the first step
  toward moving through the world freely.
- Far mountain peaks are coloured by their true height, so their snow and rock no longer shift with how tall the
  painter draws them.

### Under the hood
- The eye's place (`L.a0`, `L.z0`) is kept apart from the seed's own place (`L.zS`). The land kit and its landing stay
  with the seed, and points are drawn from wherever the eye stands. The film tells each frame where the eye has flown
  (`setSceneFly`; the camera request's `fly`, which is in its cache key).
- A flight's world is built once, sown along the whole line it flies (`L.path`), so every frame of the film reads the
  same things.
- The land's rings sit around the eye on the world's grid, each corner keeping its true height by place (`aOf`, `tH`).
  The painter's added height for far land is laid on per view, and the arch's patches follow in whole steps.
- New checks: the drone flight's speed and climb (moving suite), and that a flight's world is the same at its start,
  middle and end (Ringworld suite). The Ringworld's fingerprint changed only for the far peaks' true-height colours.

## Scorpius–Acrab (2026-10-25)

- No more grid in the sky. In rain, storm and snow, the overcast ceiling showed a faint grid at film sizes such as
  720p, because every seam between its pieces was painted twice. It is now laid as one solid sheet.
- Rocks, huts and other things no longer show the ground through their lower parts. Each is painted after all the
  land beneath it.
- Fewer, bigger, more colourful birds. There are about half as many flocks, drawn larger, with new kinds: magpies,
  jays, goldfinches, parakeets, robins and egrets. Each bird has its own markings (a jay's blue wing patch, a
  goldfinch's red face and yellow bar, a robin's orange breast) and is shaded so it looks round. Rooks, starlings and
  pigeons get their own markings too.
- Snow and rain fall with depth. Instead of a flat curtain over the picture, flakes and streaks fall in the world
  around the camera at every distance: big, soft flakes close by, smaller ones farther off. They move with the camera,
  drift with the wind and hide behind hills. Far away, the falling snow or rain becomes a veil that softens the land.
- Snow settles. When it snows, snow lies on open ground, along conifer branches, in caps on other trees, on bare twigs
  and on roofs; meadow flowers close and the grass turns frosty.

### Under the hood
- `rgFalling` draws the falling weather in layers by distance, hidden by the land's distance map. The land's haze
  (`hazeOf`) thickens in falling weather and takes on the snow's white or the rain's grey.
- Each thing's reach toward the camera (`radOf`) decides when it is painted, so it is drawn after every patch of land
  beneath it.
- New bird kinds in `WK_KINDS` with their markings; `wkSongbirdUp` and `wkSongbirdDown` paint them, and `WK_BIRDS` are
  drawn larger. A new check in the wildlife suite makes sure each colourful kind paints its markings.
- New research notes: docs/prior-art/ringworld-weather.md (how fast snow and rain fall, how far you can see through
  them) and a section on birds in docs/prior-art/ringworld-wildlife.md.

## Scorpius–Dschubba (2026-10-25)

- Walled towns fly their colours. Every other tower on a town's wall now flies the square banner of the faction that
  holds the region, its field above and its charge below. Banners stream downwind and ripple in films. Ruined walls fly
  none.

### Under the hood
- The tower painter lays each banner on a pole five metres over the tower's top, coloured from the region's faction
  (`RK_TINCTURES`). The Ringworld's fingerprint did not change: its test picture shows no walled town.

## Lupus–Xamidimura (2026-10-25)

- The Ringworld's trees keep their seasons. Each seed's season now reaches its broadleaf trees, birches, poplars,
  willows and orchards:
  - Spring brings a fresher green and pink or white orchard blossom.
  - From late September the leaves turn: birches, poplars and willows go gold, and broadleaf trees go scarlet, orange
    or russet, each tree on its own few days.
  - Through the winter they stand bare: a purplish-brown haze of twigs, a willow's curtain of thin yellow whips, and
    snow along the twigs when it snows.
- The grass goes straw-coloured in winter and a little gold in autumn, and the meadow flowers close for the winter.

### Under the hood
- `rgSeasonOf` gives each tree its stage from the year's turn and its own record. `pkBareCrown` and `pkBlossom` paint
  bare and blossoming crowns, and `rgWinter` tints the grassy ground. The tree sheets are kept per stage, so a film
  never sees a tree change.
- The Ringworld's fingerprint did not change: its test picture shows no tree in a season that changes it.
- Reviewed the tests: the regions suite now also checks that every building stands where its ground falls no more
  than its kind allows, that no cactus grows in the green or cold biomes, and how the trees' seasons go.

## Lupus–Pipirima (2026-10-25)

- Shadows follow the sun. Every tree, building, rock and small thing in the Ringworld now casts its shadow the way the
  sun throws it where it stands, rather than always to one side of the screen. Shadows are long at dawn and dusk and
  short at noon. They fall toward you when the sun is behind a thing, sideways when the sun is to the side, and turn as
  the sun moves through a film. A shadow falling away from you is kept short, so it never lies over things farther off.
- Trees have a small dark contact shadow at their foot, so they sit on the ground.
- The land's gleam toward the sun is a little softer.

### Under the hood
- `shadowOf` works out each thing's shadow direction on the page from the sun's height and bearing at its place, and
  `pkShadowWay` lays the kit's cast shadows along it. A tree's shadow is drawn under its kept sheet, never baked into it.
- A new check in the Ringworld suite covers shadow direction: shadows toward you, away from you, to the side, and the
  fallback by night.

## Lupus–Uridim (2026-10-25)

- Buildings stand on the ground. Each kind of building has a steepest slope it can be built on (a row of houses or a
  factory only on nearly level ground, a pueblo or a castle on its hill much steeper), and the land under each is
  levelled and eased back to the slope around it, so no building floats and every door meets the ground. Fields are
  sown only on gentle ground, terraces only up to a moderate slope, and a field whose corners fall too far is left as
  grazing.
- Trees and shrubs grow by the land's moisture, warmth and steepness: saguaros and Joshua trees only in desert,
  acacias, baobabs and shrubs on the savanna, birches and firs on the tundra, warm-country trees only where it is warm.
  On steep slopes only spruces and shrubs hold on.
- The Ringworld looks painted. The near ground carries broad strokes of a few shared colours, the sky has soft long
  strokes, the gas giants are stroked along their bands, near town walls are damp at the foot and streaked by rain,
  roofs are laid in courses with weathered patches, and each house in a row has its own slate or tile. Cacti carry a
  pale-gold rim of spines, a corky foot and patches of yellower and bluer green.
- The lit lines along the land's crests and shelves are gone. In their place the land gleams where it turns toward the
  sun, brightest when looking into the sun, and the gleam slides over the hills as the sun moves. Rock, sand and snow
  gleam more than grass.
- In the city worlds the land is less stepped.

### Under the hood
- `floraAt` picks a tree from the biomes at its place (`RG_BIOME_FLORA`, `RG_STEEP_OK`). `RG_FALL` holds each
  building's steepest ground, and `rgPads` levels the land under the buildings it allows.
- The land's gleam is Blinn's half-way term at each corner (`specAt`), kept by place for the frame. The land kit no
  longer reports its steps (the lips it served are gone).
- New research notes: docs/prior-art/ringworld-painted.md (Dishonored's painted textures, Blinn's highlight) and
  docs/prior-art/ringworld-buildings-ground.md (levelling under buildings, FAO's slope limits for fields and terraces,
  plants by biome).

## Lupus–Heng (2026-10-25)

- Films draw faster again. Each cell of the land keeps its biomes, its far field colour and the kind of ground it shows
  once they are worked out. The small marks on the ground make no waste from frame to frame, and the stars are drawn
  once per sky instead of once per frame.
- In the rain a rainbow now appears only where the overcast breaks, about one rainy ring in three. The brightening
  inside a rainbow eases away at its edge instead of ending in a hard circle.

### Under the hood
- The ground marks' path lists are flat lists of numbers, reused cell after cell (`rgPathRec`).
- The Starfield part keeps its stars by seed, size and colours (`WHIM_STARS`). Aurora Sky's fingerprint changed only
  because its stars now come from that store; its picture is the same.
- Tree sheets are kept to about ten million pixels per worker, so a film's several workers stay light on memory.

## Pleiades–Celaeno (2026-10-25)

- The Ringworld's land is laid in steps again, closer to the first painted ring's ridge-behind-ridge look. The land
  rises in shelves, each a broad level ending in a short rise to the next, and each shelf's lip is drawn as a lit line.
  Some regions are more stepped than others, the highest crags keep their own ridges, and Landforms makes the steps
  taller.
- Films hold still. Each tree is drawn once and reused, whole at every size, so trees no longer change shape or size
  as the camera zooms or the ring turns. Each building's shape is read once, so buildings no longer flash as the camera
  pans. The land is kept corner by corner as it is first worked out, so turning, zooming or rising never makes the ring
  work it out again. Later frames of a film draw faster.
- Hills are shaded smoothly from corner to corner instead of in rows of flat facets, and a slope no longer shades
  itself in stripes when the sun glances across it.
- The bright line along a crest is one clean line again, not a row of stitches.
- In rain the overcast now covers the whole sky; some seeds had a hole in it straight overhead.
- The far land on the arch is laid in finer patches, so it no longer looks like a checkerboard when zoomed in on.
- With the sun behind a tree, the crown's edge now glows thin and bright, the light spilling past it, instead of a
  yellow band inside its outline.

### Under the hood
- `rgSprite` keeps each tree's sheet by its id, kind, sizes and light; `rgStep2` steps sizes by the square root of two.
- paintKit's proofs are drawn at one size and unlit (`raw`, `lightRaw` from the colours), keyed by the building
  alone, and lit where they are used.
- The mesh keeps each ring's corners by world place (`rawH`, its step `stepQ`, its colour and sunlight), however many
  cells the camera draws; `kSunAt` gives each corner its own turn to the sun; `litAt` begins past the corner's cell.
- `lkLand` lays its steps and tells each place's step (`stepQ`); `RG_ARCH_KEPT` keeps the arch's patches.
- docs/prior-art/ringworld-terrain.md §12 is the research (terraces in libnoise and Gaea, shadow acne and its bias,
  Gouraud shading, impostors).

## Pleiades–Asterope (2026-10-25)

- The magic world has creatures of its own. Slimes are low, see-through mounds of jelly with a darker heart inside and
  two small eyes. They hop every second or two, sitting or on their way, gathering themselves flat before each leap,
  stretching in the air and squashing as they land, with a jelly's wobble after. Each takes its region's element for
  its colour and glows faintly by night. One to four of them wander the meadows and the edges of the woods.
- Striders are tall runners of the magic world's open country, built the way emus are built. They stand about two
  metres tall, with shaggy plumes, a long bare neck, a fan of plumes on the crown, little wings and long bare legs
  that never quite straighten. Their plumage takes their region's element. Two to five graze together, put their heads
  down to feed, sit to rest, and bolt with their necks stretched forward.

### Under the hood
- `WK_KINDS` has `slimes` and `striders`; `wkAt` gives a slime its own bounce and its squash and stretch (`sq`);
  `wkSlime` and `wkStrider` paint them.
- Reviewed the tests the Ringworld leans on (test/wildlife.test.mjs, test/regions.test.mjs, test/land.test.mjs,
  test/ringworldView.test.mjs and test/chains.test.mjs). The Ringworld's checks moved out of chains.test into the suites
  of their concern: the choice of worlds to regions.test, the lens, the sun and Saturn to ringworldView.test. The
  wildlife suite's speed limits now cover the new creatures, and its stand-in canvas draws curves.
- docs/prior-art/ringworld-magic-creatures.md is the research (slimes in games and fiction, squash and stretch, how
  ostriches and emus run, and how a strider keeps its distance from a chocobo).

## Pleiades–Pleione (2026-10-25)

- The Ringworld's floor is parted into regions, each about five kilometres along and two across, with borders that
  wander as real ones do. Every region has a name drawn from the seed words and the old words for a country (the
  Hollow Weald, Vale of Titan, Odin's Reach; a borough or a ward in the cities, a sector in the neon world).
- Each region is held by a faction of a few neighbouring regions: a house, an order of Runists, a compact or a band,
  with its own banner, a metal and a colour parted as heraldry parts a field.
- A Mixed ring now shares its worlds out region by region, so a medieval march lies beside a robot-haunted waste with
  a clear border between them, their grounds meeting over some twenty metres.
- Borders are marked where the roads cross them. A boundary stone stands at the roadside with each side's rune cut on
  the face toward it, and where two factions meet, each flies its banner a few metres into its own land. In the
  cities, the neon world and the builders' world, a sign each way names the region you are entering. Towns have names
  too, on a sign where their road leaves them (Titanwell, Rheaford, Port Vega).
- Some towns in the wilds and the magic world are walled: a stone curtain six to ten metres high with merlons along
  its top, round towers under cones of slate or tile every thirty-odd metres, and paired towers at each gate where the
  roads go through. The walls stop at the water's edge. In the ruins the old walls stand broken, whole lengths fallen.
  Nothing is built or grows on a wall.
- Magic is ruled by element, region by region. Each magic region belongs to one of Runology's Primal Archetypes: Fire,
  Wind, Water or Earth most often, Amber, Vitrum, Sound or Radio rarely. The element colours the region's ground, its
  trees' leaves, its lights, its crystals and its mushrooms, so the magic world is no longer all red.
- Glowing trees are rare now, and glow in their region's colours.

### Under the hood
- regionKit.js is new: `rkRegions` gives the region at any place (a Voronoi cell of a jittered grid, warped, round the
  ring), with how far it lies inside its border and the region over it, and each region's name, world, element and
  faction (`RK_ELEMENTS`, `RK_TINCTURES`, `RK_DIVISIONS`; `rkTownName`). The worker now carries seedWords.js for the
  names.
- Every thing in the Ringworld's store knows its region and holders (`region`, `held`, read by `ringStateOf`).
- The store's `walls` hold each walled town's circuit, gates and towers; `paintWallPiece` draws them in the painter's
  list. `onWall` keeps buildings, trees and props off them.
- The rune painter moved into the paint kit as `pkRune`, shared by the rim walls' script and the boundary stones.
- test/regions.test.mjs is new. It checks the regions are pure and go round the ring, every region is named and held,
  Mixed rings share their worlds, magic regions have elements, borders are marked, walls stand only in the old worlds,
  and no building stands on a wall.
- docs/prior-art/ringworld-regions.md is the research (town walls, boundary stones and signs, heraldry, political
  borders in map generators, place names).

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
