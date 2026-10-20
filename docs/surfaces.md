# Surface notes

The non-obvious facts about particular surfaces, alphabetical. Moved from AGENTS.md §9; read a surface's entry before changing it, and add to it when you learn something about it.

Alphabetical. These are the non-obvious facts about particular surfaces.

- **Aurora** (chain `aurorasky`, canvas): Starfield → Aurora Curtains
  (green low, red high, a pink hem; rays). The old `aurora` id is **Silk
  Ribbons** (the same look, renamed).
- **The Basics** (plainnoise, stripes, polka, checker, softgradient, cells;
  `ATHANOR_BASICS`):
  - In the Athanor's Open menu only; hidden options so old looks open.
  - No preset uses one.
  - They are quiet grounds of two or three general parts, with every slider
    a plain 0–100. They are the Athanor's easiest lessons.
- **Pixel Space** (chain `pixelspace`; one process part, `orbs`, genOrbs in
  stepsGenerative.js; prior art docs/prior-art/space-scenes.md part A):
  - Every grey map goes through Pixelate, then Posterize with Dither on the
    same cell (the Pixel Size knob drives both), then a Gradient Map. The
    chain is `crisp: true`, so genChain enlarges it pixel for pixel. A user
    graph with a Pixelate in it is enlarged crisp too.
  - The seed picks the nebula (a Map Switch fed by a Random Number): band,
    clouds, filaments, or a nested switch of galaxy, galaxy in the band, and
    ring nebula. Orbs picks its own framing: none, centred, close, horizon,
    eclipse, belt, system, black hole or pulsar.
  - **White is never a cloud colour** (Ruby). The nebula ramp tops out at a
    Mix of the Nebula Hue and Starlight. White belongs to stars, a galaxy's
    heart, a corona and a photon ring.
  - The rim: a Smudge of the nebula toward the handle, less the nebula.
    Smudge and Motion Blur read angles from the right (0° = +x); the dial
    reads from the top. Convert with clamped Math, as the chain does:
    (dial − ¼) + (dial < ¼)·(dial + ¾).
- **Liminal Spaces** (chain `liminal`; one process part, `roomcaster`,
  stepsRoom.js; prior art docs/prior-art/liminal-spaces.md):
  - The seed picks one of eleven kinds (ROOM_KINDS, weighted), its layout
    (corridor, open plan, maze, hall, pools, garage), lamps and camera.
  - Its light is a light map spread through open cells only, so it never
    leaks through walls. Colour is the graph's: a banded Gradient Map of
    Surface, then Pattern, Light, Lamps, haze, grain.
  - The camera dial looks round; its guide ('room') is the horizon and the
    floor's lines. No light dial: the lamps are the light.
- **The Flowers** (ᘓ; one process part, `bloom`, stepsFlora.js; prior art docs/prior-art/florals.md):
  Floral Imprints, Bouquets, Fallen Petals, Meadow, Macro, Ditsy Print, Botanical Line (and Lotus Pond).
  - Bloom's picture is on black, its half-covered edge pixels given their colour back and a hair of
    coverage left black, so Scatter's "black is clear" stamps have no dark rim; Scatter does the same for
    its own stamps (their coverage kept apart). No petal outlines: Ruby found them cartoony.
  - Macro's framing is the seed's, a continuum from the whole flower to its heart filling the page; the
    Meadow is seen from inside it, never a green hill under blue and white cumulus (Ruby: "Bliss").
- **Veins of Light** (chain `veins`; one process part, `network`, stepsNetwork.js; prior art
  docs/prior-art/veins-network.md): a graph with loops, never a tree. Weave picks how the nodes join;
  widths follow the flow from the hubs (the poem's punctuation, else the seed's); Organic ↔ Circuit
  routes from curves to 45°/90° traces with pads and buses. The glow wakes as the dial's light sinks.
- **GPU passes** (texCore `gpuKernel(name, body, w, h, textures, uniforms)`): a part's per-pixel pass as a WebGL2 fragment
  shader (texelFetch, row 0 the grid's first row), one shared context, a program per kernel; null when there is no
  WebGL2, an emulator, or `setGpuPasses(false)`, and the part then runs its CPU path (Node and the tests always do).
  Write the CPU path first, then the kernel, and check them against each other in Chromium with `setGpuSoftware(true)`
  (ROADMAP C9: the graph's passes move here one by one).
- **Sunrise Scroll** (chain `inkscroll`, `v: 5`; general parts only; prior art docs/prior-art/cel-shaded.md §7):
  ink-wash mountains band behind band. A ridge is a 1D noise (a Curve's noise through a Profile Gradient), never a 2D
  noise cut by a gradient (that makes blobs, not profiles); far ridges folded into crags. A Number's value is 0–100
  (num(50) is a half): a multiply by num(0.9) is nearly nothing.
- **Windswept Hills** (chain `windhills`; one process part, `grass`, stepsGrass.js; prior art docs/prior-art/cel-shaded.md
  §8): toon grass and rolling hills in wind. Hills: a Gradient mixed with three broad Perlins, each cut by a Threshold
  (far, middle, near; Hills sets how far the Perlins raise the land, Horizon where it begins). The far band wears the
  Far Hills Hue under a haze of the Sky Hue (Haze). Grass Blades fills from the middle band down. Gusts: a slow Perlin
  through Levels into a Map Range (Wind its top); the same knob leans and bends the blades. Clouds: a Perlin in the
  upper sky, blurred and cut crisp, shaded beneath by the sky (a Warp straight down, inverted, times the clouds). The
  Light Engine lights the land's crests and rolling rise (blurred band, Perlin) and the blades' height; its light,
  spread by Levels and posterized (Toon Bands), multiplies the land only (the sky and clouds keep their own tones).
  Mountains: a Gradient mixed with two Curves (noise, and finer noise, added) and cut: a Curve laid across the page
  varies only across it, so the range has one skyline and never islands; the Far Hills Hue under 60% Sky Hue. Trees:
  a Scatter of clumped dots on the middle band (the middle threshold minus the near), the Grass Hue multiplied in, and
  their domes (Scatter's heights) in the height the Light Engine reads. Wind trails: Streamers (Wind is its count, the
  horizon its own), blowing from a Number (74, the west), white in the Cloud Hue.
- **Windward Sea** (chain `windsea`, `v: 5`; one process part, `streamers`, stepsStreamers.js; prior art
  docs/prior-art/cel-shaded.md): the first love letter to a video game, cel-shaded. Light in bands: the Light
  Engine's light (or Streamers' Facing) through a Posterize (Toon Bands) into a three-stop Gradient Map. The
  seed picks the weather (Weather only leans it; storms darken toward slate, chop the sea, raise the wind). The
  wind is ribbons in the world, never painted on the sky; it blows across the view, since a gust heading at the
  eye shows only its edge. The sun follows the dial's way and height and sets into the sea.
- **Webb Sky** (chain `webb`; one process part, `spikes`, genSpikes in
  stepsGenerative.js; docs/prior-art/space-scenes.md part B): smooth, never posterized. The
  seed picks globules, cliffs, a shell, smoke, or a deep field. Every kind
  is broken into clumps by a fine Perlin and streamed along the light by a
  Motion Blur (Streaming). Spikes are six and two (Webb), never four, unless
  someone sets the part to Hubble.
- **Feathers and Corvid Feathers** (one process part, `feathers`;
  genFeathers in texWhimsy.js; prior art docs/prior-art/feathers-and-light.md):
  - Bird is a setting in fifths (`FEATHER_BIRDS`: plain, crow, raven, magpie,
    blue jay), so a Knob can drive it; it picks the feathers' kinds and their
    patterns, never their colours.
  - Six hues: feather, tip, two sheens, pale, dark. The sheen is structural:
    each barb mixes between the two sheen hues by its angle to the light,
    strongest facing it (`shk` per bird: raven 1, crow 0.4).
- **The light to lay over a page** (Dappled Leaves, Window Light, Pool
  Caustics, Light Leaks): graphs of general parts only (chains.js), on
  mid-grey (Light Leaks on black, for Screen), every colour a Hue; the seed
  reaches them through Random Numbers (panes, the window's place, the leak's
  edge) and the Scatters' and noises' own streams.
- **Black Hole:**
  - Ray-traced on every other working pixel; the in-between pixels are
    traced only where neighbours differ.
  - The sky is sampled at full size through the lens map.
  - Stars shear tangentially far from the hole: that's physics.
  - Seen from the camera dial: Turn turns the disc (0 is the old light dial's
    315°), View how edge-on, Zoom the lens (`lens` scales the hole). A graph
    from before, whose part has no Turn, still reads the light dial.
- **Cartomancy** (cartomancy.js, chain `cards`, canvas, ON_PAGE; its parts
  are `CARD_STEPS`; cartomancyTable.js gets its drawing kit `CRT_KIT` from
  cartomancy.js when it loads):
  - "STAKES" is how likely money lies on the table, and how much.
  - The seed picks a game (eleven `CARD_GAMES`), its players, the suits, the
    table, the card stock and the coinage.
  - `crtDeal` returns what lies where; each thing is drawn with its own
    shadow (the page's light vector).
  - Suits come from the page's accents and the texture's two hues.
  - **Wear** (knob 5): a damage changes a card's outline (`crtCardPath`).
  - **Clutter** (knob 4): `crtTableObjects` places `TABLE_OBJECTS`.
  - Draw order: under → flat → the game → tall.
  - To add an object: an entry with a painter that draws from above, lit by
    `crtLight`, with `tobKit.shadow`.
- **Circuit Board** (chain `circuit`, Pattern & Order; it replaced Veins of
  Light, which stays hidden for old looks and the Circuitry preset):
  - Circuit Traces routes it in cells (`genCircuit`): chips first, then buses
    of 1–8 traces from pins, edges and vias that turn together (a mitred
    offset), ending in vias or pads; an occupancy grid keeps buses apart.
  - Each Trace (a gray per trace, a bus's alike) goes through three
    Thresholds on Charge; Math dims it for the glow and the sparks, so Charge
    reaches them later. A param's `'~key'` range is clamped to the param's own,
    so an onset past 0 needs a dimmed input, not a range past 100.
  - The board is the page's backdrop (`pageEnv`, the Page Backdrop part);
    its hues default to the accents (`tintDefaults`); data pulses are hashed
    per trace, so more Data Flow adds pulses and moves none.
  - **Era** (7) and **Markings** (8), both 0 by default (the board exactly as
    before). Each chip, name and trace takes its era from its own hash
    (`level` in `genCircuit`), so the slider turns the board part by part;
    `cirEraChip` draws the future's, quantum, atomic and magitech chips, and
    what of them lights is copper with the chip's grey, so Charge powers it.
    Five eras: Today, Future, Quantum, Atomic, Magitech. The
    Markings are placed last, in room the board left (`CIR_SAYS`, `CIR_EGGS`,
    runes a–l in `CIR_FONT`): every word made up, no real marks or brands.
    Each era prints its own kinds of stamp (`CIR_STAMPS`: lines of words,
    titles, barcodes, warning triangles, test points, makers' marks, code
    matrices, moon phases, the little pictures), and among its words some of
    the page's own (poetry and type); by hash, Markings also prints a maker's
    code and date on today's chips and values beside today's small parts.
  - **Nothing written on anything** (Ruby: collision detection at high
    density): every name, value, rune and stamp takes its cells (`taken`)
    and is placed only where no copper, part or other word lies; a
    magitech chip's hologram stays close about its circle and its name
    stands above it.
  - **Atomic** (the fourth era; it was called Magitech until format 4, and
    Ruby kept it: "Fallout … do more of that"): brass gears and riveted bars
    set with crystals, valves, coils wound round traces; the brass is its own
    output (`brass`), laid over the chips. No sigils.
  - **Magitech** (the fifth; Ruby: Final Fantasy, not Fallout: sparks,
    optical computing, crystals set in the board, holography, runes,
    summoning circles): `cirMagitekChip` draws a summoning circle with a
    star and runes, a faceted gem in a bezel, light guides curving to the
    used pins, broken hologram rings, and on long chips a crystal rod in a
    cradle. Its traces are light pipes. What glows is its own output,
    `arcana`: the chain powers it (×13), blurs it, screens it cyan with a
    violet halo, and scatters gold sparks along it.
  - An old look's Era is rescaled ×0.75 (format 4), so a board saved at the
    old Magitech is Atomic still.
  - **The poem kept clear** (Ruby): The Poem's lines go into Keep Clear set
    to "cutting it away": the board is routed as ever, then what lies under
    the lines is lifted (a cut trace ends in a via). The chain says
    `poem: 'lines'`, so it is given the layout as whole lines rounded to
    1/64 (`poemLines`): typing inside a line draws nothing again. A trace
    keeps its own `id` through the cut (its data pulses and era hash by it).
    A structural fingerprint change (an extra canvas) with identical pixels
    is accepted only after proof (a pixel comparison with HEAD) that no pixel
    moved.
- **Contour Map:** Terrain → Contour Lines (any gray map's isolines), inked
  by Mix over the Light Engine's hillshade.
- **Crackle** (Fractured Glaze, chain `crackle`):
  - Tarbell's Substrate on an ID grid: a crack stops at another's cell or
    its 4-neighbours.
  - Polylines, not chords.
  - The old crazed glaze is `crackedglaze`, hidden.
- **Deep Field** is two requests (`astral_fog`, `astral_stars`). Its Glow
  Hue rides on `astral_stars`.
- **Easter eggs** (Ruby: "Easter eggs should include Saturn", and Enceladus and
  sci-fi "peppered into various surfaces and generators when it makes sense as
  a rare Easter egg"; Saturn is Ruby's favorite planet, Enceladus its moon).
  Rare, and decided by a stream of their own (`seedChoice(seed, '<name>')`),
  never the texture's own: a picture without an egg draws exactly as before.
  The painters are shared (stepsWhimsy.js): `paintSaturn` (bands, rings with
  the Cassini gap, the night side, the globe's shadow on the rings, the rings'
  in front) and `paintEnceladus` (white, tiger stripes, the plume).
  - Painted Ringworld: one ring in four orbits Saturn (The Arch's Saturn), and
    now and then Enceladus beside it; otherwise the far planet is sometimes
    Saturn. Ringworld likewise (Ringworld View's Saturn).
  - Starfield's small Saturn follows its Atmosphere: in space a ringed disk,
    under air (Aurora's) a faint point (Ruby: "much dimmer and fainter").
  - Starfield: about one sky in thirty-six, a small Saturn among the stars
    (Aurora, Ring in the Sky, the Painted Ringworld and any graph with one).
  - Circuit Board's Markings: a stamp now and then speaks of Saturn, Enceladus
    or the old stories of space, by its era (`CIR_SPACE`), and a little
    picture is Enceladus (`CIR_ENCELADUS`).
  - Cartomancy's rare cards (Saturn, Enceladus, the Kitsune), the stitches
    Saturn and Enceladus, the seed words.
- **Dream Bloom** is a thin-lens camera (50 mm f/1.8): its blur is a real
  convolution.
- **Flow-Field Ink:** Flow Lines (Jobard–Lefer spacing). An Angle Map input
  bends it by any gray map.
- **Grown & Generated** (stepsGenerative.js): between a plain pattern and a
  scene. A process is simulated, laid on a material, and lit.
  - **Lichtenberg Figures:**
    - Discharge (Kim–Sewall–Lin fast Laplacian growth) → Burn into Wood →
      Light Engine.
    - One, two or three poles (Ruby chose this first growth over one whose
      poles always joined).
    - It grows as it always did; Reach and Slide place it.
    - The camera dial is the ground camera (`groundCam`, a pinhole camera
      on the page's plane, with zoom), wired into the material and Discharge
      both. Turn 0 and View 0 are no camera at all. Past the page's top the
      rings straighten (they never close round the pith), and far rings and
      channels fade rather than shimmer.
    - The light dial is only the light; Strike Angle (a slider) is where
      the strike enters. Materials: Charred Wood, Slate (fixed grays),
      Brass, Acrylic; Depth cuts the channels; the Glow Hue (black: none)
      lights them as if they still burned.
  - **Ruffled Growth:** Differential Growth (on a spatial
    hash).
  - **Positioning:** generated textures take Zoom and Slide (along the
    dial's axis).
- **Knotwork:** Cromwell's construction.
  - Cells sit at odd doubled coordinates, crossings at edge midpoints.
  - Boundary edges and hashed symmetric breaks become turns.
  - Crossings alternate over and under.
- **Painted Landscape** (chain `landscape`, canvas): Painted Sky → Painted
  Ridges → Watercolor Bleed.
  - `landScene(seed, …)` is the shared scene.
  - Color keeps the grey painting's value and sets only its hue
    (`landPalette`). Color 0 is exactly the grey of before.
- **Painted Ringworld** (chain `ringpaint`, canvas, stepsRing.js; Ruby: "a
  generative art piece that still looks like being on a ringworld … the same
  logic as the 3D generator but 2D", and of the flat style, "simplified, but
  cosmic"): Starfield → The Arch → Land on the Ring → Oil Paint (Paint 0: the
  flat shapes alone).
  - Both parts see through Ringworld's own camera (`ringCamera`, from
    `ringParams`, so the 'ring' guide shows the shot; `curved` draws it the
    same way) in a **stereographic** projection: a pinhole draws the arch, a
    great circle through the eye's plane, as a straight line; the painter's
    curved perspective bows it across the sky. `proj` returns the depth that
    sizes things there (F over it is pixels per ring unit).
  - **The sun is placed by the light dial, in the world** (Ruby: "the light
    dial sets the sun position consistently and independently from the ring
    rotation"; `ringSunDir`): its way round is the dial's direction, read as
    the camera's Turn reads (so the two dials agree, and turning the camera
    turns past it); its height the dial's reach (the middle overhead, where
    it is the ring's own star on the arch; the rim the horizon; past it
    night, and no sun). The land's facets and the painted things are lit
    from its side of the screen and from above as it rises (`V.sun.LT`,
    `V.sun.sd`); Saturn takes its light from it. The shadow squares and
    `L.side` still make the arch's days.
  - One world for both (`rgView`): the land's heights (`rgTerrain`: ridged big
    octaves, ranges at the walls' feet, flatter in cities, terraced by the
    builders), the sea below the camera's ground, the biomes by world
    coordinates (`rgGround`), the camera standing on the land (`Px` lifted by
    its height). Far land is drawn up to 3.2× taller than it is (a painter's
    exaggeration), its colour by its true height (`T.true`).
  - **World** (`RG_WORLDS`, `RG_PROF`): By the Seed, Wilds, Cities, Neon,
    Builders, Magic, Ruins, Mixed (three, region by region). Each world's
    weights say what it raises; its ground, its lights (the page's accents for
    Neon and Magic, through two Accent parts: `ringpaint` is colorKeyed), its
    air's tint.
  - The land is 16 ridges at distances growing from your feet to the walls'
    feet, each a cross-section of the terrain: a wash (lit crest, deeper
    below), facets where steep, a bright rim; on each crest what grows and
    stands (trees, buildings, rocks, grass, by stochastic counts so
    small segments still get their share). The works stand in world cells
    (`cw`), drawn between the ridges they lie between (so hills hide them),
    roads slab by slab; nothing anchored is drawn larger than it can be seen
    whole (`big`), and spans only where they are far and seen along.
  - **Saturn** (Ruby: "Ringworld should sometimes be orbiting Saturn"): by the
    seed (one ring in four) or The Arch's Saturn setting, the ring orbits it as
    the old games' rings orbit their gas giants, and Saturn hangs huge in the
    sky beyond the far arch, lit from the ring's star (`paintSaturn`), drawn
    before the arch and its air so they pass in front; now and then Enceladus
    beside it. It takes the far planet's place.
  - **Small life** (`rgSmallLife`; Ruby: "insects, fairies, flowers, slime
    creatures … all subtle", in place of the little creatures): on some rings
    (`lively`), a few finds (more with Life), each on its own ridge whose crest
    is in the frame and near enough to see, nearer ones likelier. A ridge offers
    eight places across the frame; once it is painted their pixels are noted
    (`rgSpot`), and at the end the find goes to the first place nothing nearer
    has covered since, drawn on top (the forest of a ridge below the frame rises
    over most of the land; `rgSame` allows a passing glow). The kind is by the
    world (fairies in magic, slime in ruins); every mark has a floor in
    canonical pixels. Each find draws from its own stream (a seed rolled when
    it is chosen), so whether one is seen never changes another: a preview and
    its export show the same finds, though where a nearer edge passes close by
    one may stand at another of its ridge's places. A picture without small
    life draws exactly as it did.
- **Particles** (First Snow, Burning Mana, Euphoria Dust) draw under
  `withSeed(ctx.seed + Scatter·7919)`. This keeps them pixel-identical;
  Euphoria is a perfect preset.
- **Poured Wax** (chain `wax`): Pours (Splatter after every pour's draws) →
  Meniscus → colour by thickness → Light Engine with Translucency → Glow
  Hue screened where thick.
- **Ring in the Sky** (chain `skyring`; Ruby: "a beautiful background layer
  … that simplified, but cosmic"): Starfield → Ring in the Sky (stepsWhimsy.js
  `paintRingSky`) → Oil Paint (Paint 0). The ring is an annulus opened by
  View and a ribbon closed by it, so its band keeps its width edge-on and
  face-on; its far arc in blocks three across with blocks of cloud, the halo
  of the air it holds one wide faint stroke. The camera guide is 'ellipse'
  (Star Height from the knob keyed `height`). Land of Shapes, made for its
  first painting, stays an Athanor part: wired after it, a land beneath.
- **Ringworld** (chain `ringworld`, Sky & Cosmos; Ruby: abstract, lit by
  its star; the camera dial the camera, the light dial the day):
  - Ringworld View (`genRingView`) follows each pixel's ray to the floor, a
    rim wall, the star, the shadow squares or space, and hands on MAPS (along
    and across in band widths, distance, detail, daylight, air). It draws
    nothing; Noise at Coordinates lays the land and clouds on those maps.
  - The camera dial is the camera (turn: where you look round the ring;
    view: how far up; zoom: the lens). Where across the band you stand is
    the seed's (`ringPlaceOf`, the part's Stand set to "where the seed
    says"; an Athanor graph keeps Stand At).
  - **The eight sliders** (Ruby kept eight; format 5 turned Stand At into
    Traffic): Band Width, **Landforms** (the relief, the rim walls at half
    its range, the spill mountains, and the land's own forms), Seas,
    **Cities** (the works' amount as Structures was; past 25 `moreCity`
    spreads city cover and towers whoever built the ring), Atmosphere,
    Builders, Altitude, **Traffic** (ships ×0–2.5, its middle the old count;
    past it lanes of small craft; the streets' lamps).
  - The light dial is the day (`caps.dial: 'Daylight'`, `lowLight`): its
    height is the time (the middle noon, the rim dusk, past it night), its
    direction which side dusk comes from (`L.side`). The part maps it onto
    Daylight (the slider is gone; old looks: format 4). The Light Engine
    takes its own light height from Daylight Here, as the star never moves.
  - Daylight places the shadow squares: 0 midnight, 50 the dusk line, 100
    noon. The haze is lit by the day where the camera stands; stars fade by
    day.
  - **Builders** (the sixth slider: By the Seed, Wilds, Engineers, Cities,
    Magi, Ruins; `RING_WORKS` weights per builder). Everything of theirs is
    a primitive in `L.prims` (beams, ship ellipsoids, crystal octahedra,
    pillars of light, circles, trails, engines), each count and size from
    the seed's own stream (`ringRand`), sizes power-law so a few are huge.
    Cities are a third map (`ringCity`: blocks by day, lamps and windows at
    night). The shadow-square size (`RING_SQS`) and the ring's spin
    (`L.side`) come from the seed too.
  - Rays test only what lies in their 16-pixel tile (`ringBin`): a long
    thing is binned by its two ends' projections (clipped to the near
    plane) widened by its width, the rest by a bounding cube. Looking
    straight up once took 1.7 s; keep the binning when adding works.
  - Clouds are their own crossing of a layer just under the air
    (`Rc`), with their shadow laid on the far land (outs 21–24).
  - **Arches** (Ruby: "as if they contain the atmosphere", then "only in
    some designs … only always edge to edge"): every ring raises one or two
    forms, by its builders (`RING_ARCHES`): spans from wall top to wall top,
    each holding a field (`k: 7`, a glow in its plane, brighter edge-on and
    along the arch); flying buttresses in rows (a quarter ellipse from under
    a wall's top to a pier); arcades on piers with a deck, along the ring or
    across it; gates; the land's own stone arches (rock, heaviest at the
    feet). All are tubes of thick beams whose joints overlap (`tube`). Domes
    of glass (`k: 8`, glow only, the rim catching light) stand over the city.
  - **Nothing floats but the ships** (Ruby: "artistic cohesion, nothing
    floating"): crystals grow from the land in clusters, sunk a third; a
    standing ring of light rests on a stone plinth; a ruin's arch breaks in
    its middle and stands as two stubs (`brk`), never a loose piece; the
    floating isles are gone. Nothing stands where the camera is, nor looms
    over it (a tower, mesa or stone closer than its height; an arch about
    it): seen from under them, with their feet out of the frame, they read
    as slabs in the sky.
  - **The Forerunners' way** (Ruby: Halo, "push it more that way"): the
    Engineers' lights are blue; rim towers stand on the walls' tops (`rt`),
    and bars of hard light run from wall to wall (`br`, a `k: 3` glow with
    `even`).
  - **Landforms** (`RING_LANDS`: alpine, mesa country, boulder fields,
    hoodoos, karst, mixed, by the seed): ranges along both walls' feet
    (Ruby: "better landforms around the border mountains": a peak with two
    lower shoulders and foothills before it, never above the wall's top),
    peaks (cones, snow on the tall ones), mesas and pinnacles (beams with
    `cap`: the ray meets the flat top too), boulders (rock ellipsoids, half
    sunk, never larger than a tenth of their distance), the karst's stone
    arches. Rock works hand on `rock` and `snow` (outs 25, 26) and their own
    Across (`ac`: where they stand, rising with height), so the land noise
    lays stone on them; the chain mixes the walls' metal toward rock by it.
  - Corner rays are shared between pixels for its edges; keep `Math.hypot`
    out of its loops (it was a third of the time).
  - **The construction** (`ringBuild`, from the seed; Ruby: never bare):
    spires (tapering towers along each spot's own up, beacons at their tips),
    scaffolding (unfinished floor: a lattice box-filtered by the pixel's
    footprint, the void seen through it), spill mountains (in the chain:
    Across → Map Range → × the land → added, by Landforms). Cities raises the
    builders' works;
    at 0 a few still stand. About one ring in fifty shows the world's seam.
  - **Saturn** (Ruby: "Ringworld should sometimes be orbiting Saturn"; one
    ring in four by `seedChoice(seed, 'ring saturn')`, or the part's Saturn
    setting): `ringSaturn` fixes it in the world where the opening shot
    (turn 40, view 55) looks, a little off by the seed, 6–11° across;
    `ringSatSee` meets each space ray with its globe (banded by latitude, lit
    by the star at the ring's middle, the rings' shadow on it) and its ring
    plane (`RING_SAT_BANDS`: C, B, the Cassini gap, A and Encke's; the globe's
    shadow on them), and now and then Enceladus. Outputs 27 and 28 (saturn,
    saturn cover); the chain mixes it over the stars (part 100), before the
    shadow squares and the air.
  - The air is sampled densely where it is (near the camera, near the far
    floor) and thins away past the walls; an even spacing stepped past the
    thin air beside a low wall and left a black band.
- **Rain on Water** (chain `rainwater`, Weather): Raindrops → Tint (sky to
  water by distance) → Displace by the ripples → Material → Glow on the
  splashes.
  - Drops are hashed per ground cell, so more Rain adds drops and moves none.
  - Each drop is laid only across its ring's band, row by row, under a
    perspective camera (View, the fifth knob, tilts it as the Perspective
    part does).
  - Rings finer than a pixel (far off) calm rather than flicker.
- **Rain on Glass** simulates on the EXPORT's grid at every size, then
  scales. A chaotic simulation fed sizes that differ by a fraction drifts
  apart. Its part shows the page through the drops, so a graph holding it
  is given the page's colors (`graphUsesBackdrop`), as one with a Page
  Backdrop is.
- **Scattered Polygons** (chain `metalleaf`): Flakes over any base. At 0 on
  Shape, Sheen and Glitter it draws exactly the original flakes.
- **Sleep Haze** (chain `clouds`): Smoke → Light Shaft (a Dial port) → Dust
  Motes.
- **Stained Glass** (chain `stainedglass`, grid at div 3):
  - Panes (lead, edge, pane number, palette slot, window, joints) → Stained Glass (the part).
    A pane's look comes from its number.
  - The Window setting: None · Lancet · Arcade · Round (Round kept at the top
    of the slider).
  - Outside the outline is border glass, never stone.
  - The lead is flat and dark, soldered at the joints.
  - The extra knobs draw nothing at 0, and the Scene is evaluated only when
    above 0.
- **Turing Skin:** Turing Pattern (Gray–Scott) → Map Range → Light Engine.
  The old Reaction–Diffusion part stays for old graphs.
- **Under Glass** (chain `underglass`, Materials & Craft; Ruby: a glass to
  lay over another surface): Window Reflection, Scratches, Smudges and
  Shatter → Glass Pane over mid-gray (stepsTouch.js, `ug…`).
  - The Glass Pane adds what the glass catches as a screen does, so with
    every knob at 0 the texture is exactly 128 (chains.test proves it) and
    any overlay blend leaves the page alone. Screen adds only light; Hard
    Light also darkens, and works on dark pages (Overlay and Soft Light are
    weak there).
  - Refraction needs what is under the glass, so it happens only in a graph
    (the starter A Picture Under Glass: Texture from the Menu into the
    Pane's Picture). Two Surfaces is a blend: no bending.
  - Scratches glint where they lie across the way to the light's own
    reflection (`ugUnit`: the page's middle overhead, toward the light as
    the dial is drawn out), so swirls ring the light.
  - Each scratch, print, spot and speck is its own `mulberry32` draw: more
    of one adds and moves none. Fingerprint ridges finer than the grid fade
    into their smudge (a preview shows smudges, the export ridges).
- **Broken Glass** (chain `brokenglass`, Materials & Craft; Ruby: "glass
  fragments laying on nothing"): Glass Shards (stepsGenerative.js, `gs…`)
  over mid-gray.
  - Shards are polygons of 3–5 corners, power-law sizes, heaped about one
    to three piles and flung wider (and some anywhere) as Spread rises;
    each its own `mulberry32` draw. Each is evaluated per pixel by its
    signed distance (`gsDist`) through a uniform grid of cells.
  - A face flashes where its tilt lies between the light and the eye; the
    edge band is split per colour channel (dispersion) and clear glass's
    edge is green. The caustic is the shard scaled toward its middle and
    cast away from the light by its lift, brightest at its rim, inside a
    pale shadow.
  - The camera dial is the ground camera (`groundCam`); with a Picture the
    shard bends it by its tilt (A Dropped Frame starter, over Aurora).
- **Dewy Webs** (chain `dewwebs`, Weather): Dewy Webs (`dw…`) → silk, dew
  and glints screened onto mid-gray, the drops darkened round.
  - Orb webs: frame and anchors, spokes, a hub mesh, the sticky spiral from
    a free zone out to the frame, sagging between spokes; tears remove a
    patch of spiral across some turns and leave loose ends hanging.
  - Dew beads only where a wet thread would (Plateau–Rayleigh: a drop and
    often a small satellite), larger low in the web; each drop a lens: a
    point of light toward the light, a crescent on its far side.
  - Silk glints by how far it runs across the light's way (`across³`), in
    colours by Iridescence (`dwHue`). Line and drop floors are canonical
    pixels (`E.px`): a thread finer than that fades.
- **Veins of Light** (hidden): Growth Medium (strata, pebbles, sand, fibres, skin; its
  "ways") → Tendrils (Runions' space colonization, steered into the ways).
- **Watercolor Wash:** Washes → Pigment → Pigment (any gray map laid as
  watercolor).
- **Two Surfaces** (the surface layers, appEvents `SURFACE LAYERS`): one set
  of controls edits whichever layer the layer bar shows; the other waits in
  `state.layers.other` under the same keys (its locks, reading and
  hue-following beside it).
  - A look saves the upper under its own keys and the lower as `baseLayer`
    (`baseLocks`), whichever is shown. `exchangeLayers` trades the controls
    with the waiting layer; Swap is that, kept as a step.
  - The renderer draws both with `drawSurfaceLayer` (the lower in the `base`
    slots): the shown one from the page (`surfaceFromDom`), the waiting one
    from `setSurfaceSource`. The report (§Surf…) always tells of the upper.
  - Every blend for every layer (`SURFACE_BLENDS`: the canvas's own and the ⚡
    ones mixed per pixel by `boxBlend`). A grey surface is made on its blend's
    neutral ground (`blendFamily`); `textureGround` keeps an older look's
    ground until its blend is changed.
  - A new lower starts as Waking Grain on `seed ^ 0x5bd1e995`. Presets clear
    it (unless something of it is locked). Old looks' `baseType`… keys become
    `baseLayer` in `retireBaseLayer`.

---
