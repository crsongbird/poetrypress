# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

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

## Uranus–Portia (2026-10-20)

- **Things to find on the Painted Ringworld**, nods to two old ring-world and wasteland games in designs of its own,
  each to its world and its place, rarer the louder it is (and never more than one loud one in a view):
  - a pair of **lantern wardens**, lens-bodied drones trailing light, drifting where the builders worked;
  - a **cog door** rolled aside in a hillside, its apron and striped bollards, far from any village;
  - an **atomic diner** by the road, its boomerang roof and starburst sign, a finned car parked outside;
  - **finned wrecks** along the roads, now and then grown through;
  - a peeling **moon-grin billboard**, an older poster showing under it;
  - **bottle caps** in the grass;
  - rarer: a **keyless gate** in a cliff, a **drop pod** opened like a flower in a meadow, a kneeling **rust suit**
    of armour gone to moss;
  - rarest: a **pulse spire** on a crest sending its light up to the arch, and on a ruined world, far off and
    barely there, a faint mushroom cloud.

### Under the hood
- The finds are painted by `pkEgg` from `PK_EGGS` (each kind's worlds, its chance and whether it is loud) and sown in
  the ring's world store like everything else; the research and the line drawn between a nod and a copy are in
  docs/prior-art/painted-ringworld-2.md.

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
