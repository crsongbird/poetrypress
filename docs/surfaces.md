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
  - **The table takes the page's colours** (Ruby: "always blend the table
    generated against the page color gradient"): Table → Blend (Overlay) over
    the Page Backdrop (`pageEnv`) → Card Deal.
  - **Lit by the Light Engine** (Card Deal's Lit By): the cards and coins are
    painted flat (`look.engine`: no baked shadows, sheen or glints), and the
    deal hands on its Height (each card a step above what it lies on, so it
    shades the ones beneath; coins domed, rimmed, their mark struck in; the
    table's grain faintly) and Gloss (the stock's own, gilt and metal bright)
    to a Light Engine (`crtPaintMaps`). The table's objects keep their own
    painting for now, standing on low mounds in the height.
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
- **Crystal Leaf** (chain `crystal`, grid ÷2; Ruby: "couldn't the crystal
  renderer be improved with reflectance, albedo, displacement, distortion"):
  Crystal Druse (stepsTouch.js `druseMaps`) → Light Engine → Blend (Screen,
  the fire) → Surface. The druse hands on maps, nothing in them lit: the albedo
  (inside the stone: its hue deepening inward, the crystals behind and the
  inclusions seen through each face and bent by its tilt, phantoms), height
  (shadows between the points), NORMALS (each face's facing: a height map of
  big pyramids is too gentle for the engine's relief, so the faces are given
  outright through the Light Engine's Normal Map input), gloss, the veil
  (inverted: the Light Engine's translucency) and the fire (an emission).
  The page's rim light is its second light. The old part (`crystal`,
  genCrystalLeaf) stays for older graphs.
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
  - Ringworld: one ring in four orbits Saturn (The Arch's Saturn), and
    now and then Enceladus beside it; otherwise the far planet is sometimes
    Saturn.
  - Starfield's small Saturn follows its Atmosphere: in space a ringed disk,
    under air (Aurora's) a faint point (Ruby: "much dimmer and fainter").
  - Starfield: about one sky in thirty-six, a small Saturn among the stars
    (Aurora, Ring in the Sky, the Ringworld and any graph with one).
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
- **Drapery** (chain `drapery`, stepsCloth.js; Ruby: "replace those with node graphs and run a full cloth
  simulation"; docs/prior-art/cloth.md): Drape → Weave Maps (along its U and V) → a Gradient Map of the Tone
  (weft hue to warp hue) → Detail Normals (the threads over the folds' facing) → Light Engine (Relief 100, the
  threads' Gloss, their Gaps as Translucency) → Blend over the Ground Hue where the Cloth is.
  - **The simulation** (`clSettle`) is XPBD as Ten Minute Physics teaches it: structural, shear and skip-one
    bending distance constraints, Gauss–Seidel in a fixed order, tethers to the pins (a hanging sheet would
    stretch about a third without them), 2 substeps × 5 iterations, damped and clamped, 80 frames (110 seen from
    above). Float64 and no sin, cos or exp inside the loop (they round differently between browsers, and a
    settle amplifies it): every start shape is made with parabolas and half-angle tangents. Structural
    constraints give a little in compression (Marvelous Designer's Buckling Ratio), so folds form crisply.
  - It is kept per hang, fabric, folds, detail, shape and seed (`CL_KEPT`): a light, hue or weave changed never
    simulates again. About 0.5 s for the default sheet in Node.
  - **Seeing it** (`clRaster`): Catmull-Rom through the particles, three times finer, rasterized with a z-buffer;
    hanging sheets fill the page (a curtain is the page), the rest are framed with room round them. Normals are
    the mesh's own (never rebuilt from the depth: they are exact across a fold's edge); the height is the true
    depth in pixels, so the Light Engine's shadows fall where they would.
  - **Wrinkles** too fine for the particles are drawn where the cloth is gathered more than its folds take up,
    across the way it is gathered, their size by the fabric's stiffness (fold width ∝ bending^¼), their phase
    wandering and their length limited by noise, so they never read as ruled lines.
  - **Weave Maps** (`clWeave`): a draft per fabric (plain, 3/1 twill, 5-harness satin, basket, herringbone),
    threads across the cloth by the fabric (burlap 32, silk 420), slub, gaps and fuzz; where a thread falls under
    about 1.2 pixels it fades to its average (no moiré on a fold's steep wall).
- **Ringworld** (chain `ringpaint`, canvas, stepsRing.js; Ruby: "a
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
  - **The camera sweeps; the world stays** (Ruby: "we should be able to sweep
    the camera and see it not really change much but get a different
    perspective"). The land is 16 straight ridges across the view (arcs were
    tried, and the land looked worse: Ruby), each the land's true height along
    one cut; a facet's choices come from the world's own smooth noise where it
    stands (`wn`), so a cut moving with the camera changes smoothly, never
    jumps. Everything else stands in the WORLD: trees, buildings, rocks, grass
    and finds are sown in cells keyed by where they are (`scatter`: a cell
    doubles in size with each doubling of distance, so the screen holds about
    as many at every depth), the works in their own cells, roads cut into world
    lengths; the sky's things stand in directions of the world (`skyAt`), and
    the stars behind are panned with the camera (`rgPanSky`).
  - **How it is painted** (Ruby's method from game development): the ridges are
    found first; for each, the highest of the nearer crests in every column is
    its occlusion horizon. Then every thing is measured nearest first, the
    solid heart of each (a crown, a building's lower body, a boulder) laid in
    its columns; a thing wholly below the nearer ridges, or wholly inside what
    nearer things cover, is never drawn (`vis`). Then all is painted back to
    front, each thing after the ridge behind it, standing on the ground that
    shows (never above that ridge's crest: `stand`). About nine in ten things
    in a city are culled before they are drawn.
  - **One ruler** (Ruby: "buildings that are the size (small) of lil shrubs"):
    every thing has a size in metres (paintKit's `PK_SIZE`), drawn at the
    ring's px per metre where it stands (`W·0.00025·F` over its depth); a
    building's archetype is chosen first, then sized, tall ones where a city is
    densest; anything larger than the view is culled, never shrunk. Trees by
    the land's climate (`PK_FLORA`: dry country, warm, jungle, the cold
    heights, a magic world's fey places); a few villages and farms in the wilds.
  - **Less cartoony, and a wider library** (Ruby: "a slightly less cartoony art style", "a wider variety of things";
    docs/prior-art/ringworld-sprites.md): the kit's things are finished as things in the world (shaded from the sky
    down, a cast shadow, weathering, their own materials lit by the scene through `colsOf`'s `mat`; no faces). A
    village in the wilds builds in its region's one tradition (`rgVernacular`, `PK_VERNACULAR`); the small things are
    placed by what they need (`propFits`: hay in open fields, a windpump on dry pasture, the town's furniture in town,
    the larger ones sown further off); poles carry wires along the roads (`pkWires`); boards stand beside the roads,
    each world's own and the jokey ones rare (`PK_BOARDS`, a serial verse now and then, `PK_SERIALS`); the wilds'
    standing stones are a stone circle at true scale, in the world (`pkStone`, `pkLintel`).
  - **The view's reach** (Ruby: "make the drawing script aware of the view frustum"): each cut of the land runs as far
    round as the page sees, its corners included (`PHI`), straight ahead and bending round the eye as a circle past 55°
    (`smax`), so a wide lens never shows a cut's end; a thing is kept while any of it can be in view; the lens is held
    under 118° (`ringParams`).
  - **Ways and Clutter** (Ruby: streets "related to works … destroyed … fairly uncommon … different materials … curved
    … follow the contour of the land"): the main roads and, from the heart of each town Works raises, a few ways out and
    one to the next town, each walked a step at a time toward the level and away from the steep (the store's `ways`);
    each of one of its world's materials (`RG_WAYMAT`: asphalt, cobbles, brick, gravel, earth, flagstones, stepping
    stones in moss, the builders' pale and light paths) and worn by the seed (cracks, potholes, weeds; broken through in
    the ruins). The town's furniture stands along them, facing them (lamps lighting them, cars at the kerb, a bench and
    a bike, a signal), poles carry wires along the main roads out of town, and buildings and trees keep off them. The
    Clutter knob (`V.clutter`) sets all the small things and boards, apart from Works. Things are set into the ground a
    little; the ruins' wrecks half buried (`sink`, clipped at the ground).
  - **Time** (Ruby: "the simulation actually needs a time t / ∆t … nothing cartoony, only minor things";
    docs/prior-art/ringworld-time.md): the camera carries the scene's clock (`setSceneTime`, keyed with the camera, 0 in
    a still so a still is unchanged), read as `V.time` and `V.dt`. With it the wind carries the clouds, the stars and
    everything beyond the ring turn with its spin (`RG_SPIN`, `farAt`), meteors cross by night (a shower's from one
    radiant, caught by each frame's shutter), lightning flashes now and then, rain and snow fall, the grass sways in
    travelling gusts, insects dance, the droids go about their rounds (`RG_MOVES`), lights flicker and go out and on
    through the night, glints move on the water. The Moving Image's sun follows `sunPath`: a real day's arc at 48° in
    early summer, days of fourteen hours, long dusks.
  - **Clouds in the world** (Ruby: "distance, lod, parallaxing, transparency, blending, and to not clip with other
    objects"): the heaps stand over the band at their own heights and are drawn among the ridges by their distance
    (`paintHeap`), each on its own sheet laid at once so its billows never darken each other, every billow a gradient
    so its edges are soft; more and smaller billows the nearer the cloud; rain falls from a heap's base to the ground
    below it, lightning strikes from one down to the land. High and far, the cirrus and the clear sky's low bands stay
    in the sky.
  - **Gas giants** (`rgGiant`, `RG_GIANTS`): The Arch's Gas Giant setting hangs Saturn (with Titan), Jupiter, Neptune or
    Uranus in the sky, by the seed, with their moons along their equators.
  - **Runes on the walls** (`rgRune`): the builders' script on the rim walls is a band of runes between ruled lines;
    graffiti at a wall's foot is runes too, thrown up outlined in the towns, scrawled in the ruins, paint running.
    Near, the walls show their plates' seams, weather run down them, hatches, lights along their tops for the ships.
  - **The surface near** (`pkGrain`): a painted face large on the page shows a faint mottle and streaks of its material.
  - **The countryside** (Ruby: "farmland in rings round a town", "terraces", "a settlement's lights at night", "trees
    kept back from a house"; docs/prior-art/ringworld-countryside.md): the store lays fields (`out.fields`) round each
    gathering of houses (the farms' hearts, where the houses gather as the buildings are placed), on each farm's own
    lines, thinning outward, never over a neighbour's; each a crop of its climate (`RG_CROPS`), hedged, walled or
    bunded; on the steep, terraces stepped along the contour. The land paints them piece by piece with the ridges, as
    the ways (a wash near you, so the land's relief shows through). What a field holds is placed in its frame: bales,
    ricks, a flock (`pkSolidProp`'s sheep) and its shepherd droid, a scarecrow, hives, a harvester. Trees keep back from
    a house's walls and out of the fields, except along a hedge. On a town's shore, boats moored at their jetties (ways
    laid as a deck); where the builders were, now and then a bridge of hard light across the water. By night a house
    too far to draw, a lamp, and the lights between the houses (`glim`) are points of light, coming on through the dusk.
  - **Things in three dimensions** (`pkSpace`, `pkBox3`): the newest things are built of solids in their own frame and
    carried to the page as the eye sees them turned, a little from above (the sheep, the boats, the harvester); the
    way the eight views will go for the rest (OPEN-ISSUES).
  - **Buildings turned in depth** (`pkTurned`, `PK_BOX3`): a house, a barn, a chapel, a block or a tower turned from
    the eye is a box: its own painted face laid on its front plane and foreshortened, the side turned toward you with
    its windows, a gable roof running back to the ridge (both slopes seen end on from a little above) or a flat top,
    and from behind its plain back wall and gable. Its shape is read off a small proof of its own face
    (`pkFaceProof`): how wide its walls stand, the steps of a setback tower (a box for each), where its eaves and ridge
    are, a granary's stilts; its walls and roof are the colours its face was painted in (a terrace's sides each the end
    house's own). What stands above the roof (a spire, a belfry, a water tank, chimneys and their smoke) is upright and
    never narrowed to nothing edge on; a glasshouse's sides are glass. The boxlike things go the same way (`PK_PROP3`):
    a pair of vending machines, each side its own machine's colour and their plain backs from behind; a phone box; a
    mailbox up on its one post; a container; a trough.
  - **Eight views** (Ruby: "at least eight… front, sides, back, and the half-turned states… mirrored the other direction,
    except for the ones that have text"): each thing in the store has a `face`, the way it turns (a house its street, a
    car along its kerb, a board the road), and `viewOf` gives how it is turned from the camera. A building is narrowed
    as a box (above); the round ones (`PK_ROUND`) are the same from every side, and the rest (a temple, a windmill)
    narrowed as they turn and mirrored. Cars, tractors, carts, bicycles and benches (`PK_SIDE_NATIVE`) are drawn end on when met
    head on or from behind (`pkPropEnd`), otherwise narrowed and mirrored. Boards, signs and milestones are never
    mirrored and show their bare backs from behind (`PK_BACKED`, `c.back`). Whatever is mirrored keeps its light on
    the sun's side (`pkFlip`). Trees are mirrored by the seed.
  - **Weather** (`rgWeatherOf`, the parts' Weather setting): by the seed clear, clouds, fog, rain, storm or snow; heaps of
    cloud lit from the sun's side, rain in veils, lightning, a rainbow opposite a low sun, rays from a low or clouded
    sun, the sun's glare low over the land, mist thickening between the ridges, rain and snow falling over it all.
  - **Works** (Ruby: "works needs to be turned down significantly"): 35 by
    default, and fewer of each at any setting; the spans and bridges of light
    across the band as they were (Ruby: "the bridges and the spans were fine").
  - **The painted things are paintKit.js's**, shared with Ring in the Sky's
    land and Night City's skyline (docs/prior-art/painted-ringworld.md §5):
    23 kinds of tree (spruce, fir, the pines, cedar, cypress, palm, baobab,
    acacia, saguaro, Joshua tree, bamboo, tree fern, giant mushroom, crystal
    tree, cherry, bush and the rest) and 31 of building (glass, Art Deco, slab,
    brick, cottage, A-frame, barn, silo, windmill, stave church, terrace,
    pagoda, torii, castle, lighthouse, cathedral, mosque, clock tower, factory,
    water tower, capsule tower, megablock, geodome, observatory, wind turbine,
    the builders' pylons and arches, the magi's towers and onion domes), each
    style its own mix (`pkArchOf`); rocks in three facets; spires, monoliths,
    domes, crystals. Each thing takes ONE number from its caller's stream and
    keys its features to streams of its own (`pkSub`).
  - **Saturn** (Ruby: "Ringworld should sometimes be orbiting Saturn"): by the
    seed (one ring in four) or The Arch's Saturn setting, the ring orbits it as
    the old games' rings orbit their gas giants, and Saturn hangs huge in the
    sky beyond the far arch, lit from the ring's star (`paintSaturn`), drawn
    before the arch and its air so they pass in front; now and then Enceladus
    beside it. It takes the far planet's place.
  - **Small life** (`rgSmallLife`; Ruby: "insects, fairies, flowers, slime
    creatures … all subtle"): on some rings (`lively`, by the seed), finds are
    sown in the world as everything else is (more with Life), and drawn in their
    place in the order, so a nearer ridge or thing covers them as it would
    anything; never where nearer land hides them. The kind is by the world (fairies in
    magic, slime in ruins); every mark has a floor in canonical pixels.
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
