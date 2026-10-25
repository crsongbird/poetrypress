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
  - **Its lands** (Ruby: "the game had a wide variety of lands, so the seed should paint them with more depth";
    docs/prior-art/scroll-lands.md): one process part, `scrolllands` (stepsScroll.js), takes the five band masks
    (far to near: nodes 49, 102, 146, 186, 226), reads each crest and stands the land's things on them, each hidden by
    the nearer bands; its six maps are laid after the near ridge's ink and before the petals, one Blend each, in the
    hues by role. Knob 9, Land: 0 the seed's (`scrollLandOf`; Peaks, the scroll as it was, most often, the curse the
    rarest), then each land along its range. Depth by the five grades of ink (`grade`), and a walker or a boat for the
    scale. Only original lands in the tradition: no game's places, creatures or marks.
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
  - Water has a mood by the seed (still, ruffled, choppy). The river country (in `LAND_BIOMES`) is two in five of
    grassland's seeds, by its own stream so no other seed's country changes: the hills open into a valley where it
    runs, and each band paints its reach of the river down to where the next band takes over. The river (Ruby: "needs
    work"; docs/prior-art/painted-rivers.md) is one course on the valley floor seen in perspective (`rvAt`): its
    direction a sine of the distance along it, a bend every 13–18 widths, so it winds broad and diagonal at your feet
    and its far bends flatten into level slivers; each band paints the part of it at its own depths, clipped to itself,
    so the reaches meet exactly. Its value is the sky's by Schlick's Fresnel at the angle down to it (light far, dark
    near), its colour the sky's at the height it mirrors; a dark strip under the far bank, a light water line there and
    a dark lip under the near bank; level ripples; glitter only in the sun's column; trees and bushes along its banks.
  - Each band carries its country's own marks (`landMarks`; Ruby: "more variety in the water and land textures";
    docs/prior-art/painted-landscape.md), on a stream of their own so nothing else in a painting moves. A mark is sized
    by how near the ground under it is, not by its band (a far band's face can reach your feet): what stands up only
    shrinks, what lies on the ground also flattens by the angle down to it, and the air takes their contrast. They are
    broad value shapes, so the Oil Paint over them keeps them; its finer ones show whole with Impasto at 0.
    Grassland: honami, flower drifts (a soft mass, single blooms near), now and then a strip field, leaning tufts with
    seed heads. Fields: a patchwork in perspective, tiers down the face, parcels bounded by lines to one vanishing point,
    sown in converging rows, level strips or pasture, hedges along the bounds. Forest and jungle: crowns massed in rows
    and a few large masses, a clearing, the jungle's emergents and low mist, the far forest's spiky edge. Mountains:
    cracks dipping one way, dark with a light lip; scree aprons. The volcano: gullies converging on the summit (an old
    cone deeply cut), a lava tongue, blocky or lobed. Mesas: cliff-and-bench beds, a caprock, desert varnish, talus.
    Desert: sinuous dune crests over their slip faces, ripples near, scrub, an outcrop. Tundra: patterned ground, ponds,
    heath, snow streaks. The coast: wet sand, swash, lines of surf.
  - One wind per seed (`landScene` gives it): the grass's lean, which side of a dune is its slip face, the snow
    streaks, the volcano's plume, the water's puffs and foam lines, the point the fields' rows run back to.
  - The water's mood carries a Beaufort number (`waterMarks`): still 0 or 1, ruffled 1 or 2, choppy 3 to 5. Wind lines
    cut through quiet reflections; a lake keeps a mirror strip under its far shore; dark puffs; foam lines along a
    light steady wind, running back to its point on the horizon; on rough water pointed waves, larger near, white
    crests, and on the sea one great swell at your feet.
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
  - **Sealed** (Ruby: "it definitely shouldn't be" loadable in the Athanor; "it's
    pretty special"): its chain draws the page but never opens in the Athanor
    (the Surface card's button greyed, `paintReveal`), The Arch and Land on the
    Ring are hidden parts (`sealed`), and a graph holding them has them left out
    (`validateGraph`), so its insides can grow into an engine of its own
    (PERFORMANCE-AUDIT.md: the Ringworld as an engine).
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
  - One world for both (`rgView`), and its land is the land kit's (landKit.js, `lkLand`; Ruby, 2026-10-25: "real
    landmasses and biomes by the seed … nothing morphing as the camera rises or turns"; docs/prior-art/ringworld-terrain.md):
    heights a pure function of the seed and the place, in metres inside (the band 4000 m across), every noise periodic
    round the ring. Continents and seas from domain-warped noise, the sea's share by the seed; a coast rising to plains
    and plateaus; mountain belts of ridged noise inland and the spill mountains at the walls' feet, eased under the rim
    walls (Ruby: "no mountain above the rim walls"); hills crested and folded where erosion has not worn them flat;
    escarpments stepping up in long cliffs; rivers winding across the lowlands to the sea, lakes in the wet ones, canyons
    cut stepwise through the dry uplands; how rugged the land is by the seed (`rug`); a landing where the seed stands
    you, kept gentle and clear of the water. Climate: warmth by the seed and region, cooled with height; moisture by
    region, wetter by the coasts; ten biomes by both on Whittaker's diagram (`LK_BIOMES`), each a weight fading into the
    next over a transition as wide as Detail asks. The ground's colour (`rgGround`) mixes the biomes' grounds (each the
    Land Hue leaning toward its own, `RG_BIOME_GROUND`), the forest's dark canopy, a town's grey, rock where it is steep,
    sand at the water, snow above the snowline; the patchwork of fields far off (`rgFieldPatch`). Far land is drawn up to
    3.2 times taller than it is (a painter's exaggeration, by how far along the floor it lies from where you stand, so
    still the land's and not the camera's: `exH`), never above the walls; its colours by its true height.
  - **World** (`RG_WORLDS`, `RG_PROF`): By the Seed, Wilds, Cities, Neon,
    Builders, Magic, Ruins, Mixed (three, region by region). Each world's
    weights say what it raises; its ground, its lights (the page's accents for
    Neon and Magic, through two Accent parts: `ringpaint` is colorKeyed), its
    air's tint.
  - **The camera sweeps; the world stays** (Ruby: "we should be able to sweep
    the camera and see it not really change much but get a different
    perspective"). **The land is a mesh fixed in the world** (Ruby, 2026-10-25: "nothing morphing as the camera rises or
    turns"; docs/prior-art/ringworld-terrain.md §4): nested rings of square cells, each ring's twice the last (a geometry
    clipmap), the finest round where you stand, each corner's height the land kit's at its own place asked for detail
    down to its cell's size (`vh`); each ring's outer part eases into the next coarser ring's shape, so their edges meet.
    Rising, tilting, turning or zooming the camera changes how the grid is seen, never the grid; finer rings are left out
    only where their cells would be smaller than a pixel from the eye's height. Detail sets the cells' size on the page
    (some 16 to 7.5 pixels) and how far the land reaches. Things are ordered by
    their true distance, stand on the land as the mesh draws it (`meshH`), and choose their detail by their size at
    their true distance (`lodOf`, handed to the kit as `lod`), so a turn never changes a tree's or a building's stage;
    every feature drawn only at some sizes has a stream of its own, so a stage gained moves nothing else; the smallest
    trees fade in; a wall's grain and a road's wear are keyed to the world, not the screen; the one loud nod, the four
    dust devils and the bolt's cloud are chosen from the world. Everything else stands in the WORLD: trees, buildings, rocks, grass
    and finds are sown in cells keyed by where they are (`scatter`: a cell
    doubles in size with each doubling of distance, so the screen holds about
    as many at every depth), the works in their own cells, roads cut into world
    lengths; the sky's things stand in directions of the world (`skyAt`), and
    the stars behind stand on a skybox of the world (`rgPanSky`).
  - **How it is painted** (Ruby's method from game development): the cells in view are walked nearest first, and in
    each column of the page the highest land yet is kept (the occlusion horizon), snapshotted at forty depths. Where a
    farther cell rises above it from behind it, the land below was a crest: Ruby's bands are kept there (Ruby: "the
    bands kept to mark drops in elevation and sharp borders"), each face lit along its top and deepening a band below
    (`bandAt`), its crest a bright line. Then every thing is measured nearest first, the solid heart of each laid in its
    columns; a thing wholly below the nearer land, or wholly inside what nearer things cover, is never drawn (`vis`).
    Then every cell, thing, run of way and piece of field is painted far to near, a thing just after the cells under its
    nearest edge. A cell takes its corners' colours (`vcol`), so a border between two grounds runs smoothly across the
    cells; it is lit by its slope against the sun (raking at dusk), its hollows darker, cloud shadows and low mist over
    it, water with its shallows and a line of foam where the land meets it; near, it carries marks of its ground
    (`rgGroundMarks`: blades, ripples, cracks, sastrugi, lichen, tussocks, paving), placed by its own place in the world.
    About nine in ten things in a city are culled before they are drawn.
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
  - **The view's reach** (Ruby: "make the drawing script aware of the view frustum"): the land is kept as far round as
    the page sees, its corners included (`PHI`); fields and ways are drawn after the land under their nearest edge, so
    no cell they lie on paints over them; a thing is kept while any of it can be in view; the lens is held under 118°
    (`ringParams`). The far floor on the arch is laid as a map (`rgPaintArch`): patches a few pixels across by their
    true distance, on a grid of the world's, each of the land kit's broad regions where it lies and shaded by its
    relief, so lakes and ranges read as shapes, not squares.
  - **Light on the land** (Ruby: "shadows cast by the sun where it stands … nearby lights lighting what is near them
    more … rocks of different stones"): each corner of the land, each thing and each field looks toward the sun over the
    land as it is drawn (`litAt`): where a hill or a rim wall stands above the line, it lies in its shadow, softer the
    farther the hill, so a low sun throws the hills' and the walls' shadows across the band. A cell whose corners differ
    is drawn as two triangles, each shaded smoothly between its corners (`fillTri`), so a shadow's or a border's edge
    never steps; the cells at your feet are a fraction of a metre. By night a street lamp lays its pool of light on the
    ground about it. A region's boulders are of one stone (`rgStoneOf`, `PK_STONES`: granite, sandstone, basalt,
    limestone, slate, each its own shape and marks), set into the slope they lie on (`slopeAt`). The neon world's
    districts each have their own pair of neons (`RG_NEON_DISTRICTS`), the ground faintly of their hue; glowing trees
    keep their glow close.
  - **The desert's plants** (Ruby: "saguaros with more limbs as they grow taller … blooming only in their season; growth
    stages"; docs/prior-art/ringworld-desert-plants.md): every plant's stage comes from its own height (`hM` handed to
    the kit), regular for its kind. A saguaro keeps its true width at any height, arms from some 3.3 m, about one more
    for every 1.7 m, never the same count twice, each at its own bearing round the column, those behind drawn first and
    in its shade; flowers on its crowns from late April to mid June, red fruit after, by the seed's season (`season`).
    Organ pipes, barrel cacti, prickly pears, chollas, ocotillos and agaves grow in the dry country with it (`RG_CACTI`),
    each blooming in its own months; a young saguaro stands beside its nurse tree, and ivy climbs some old trunks in the
    wet woods.
  - **Highways** (the neon world's main roads; Ruby: the roads that floated, made highways): an elevated expressway on a
    line of columns some 42 m apart, its deck some 12 m over the highest ground beneath it, eased along, over land and
    water alike.
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
    radiant, caught by each frame's shutter), lightning strikes now and then, rain and snow fall, the grass sways in
    travelling gusts, insects dance, the droids go about their rounds (`RG_MOVES`), lights flicker and go out and on
    through the night, glints move on the water, chimney smoke rises and leans downwind (`pkSmoke`), kites nod on their
    strings, and the windows (`pkLit`) are most of them lit as the evening begins, fewer as the night deepens, each
    going on and off in its own time, hours apart. Two slower clocks keep a film from looking sped up (Ruby: "slower time
    lapse animation in general … just a lil"): clouds on `rgCloudTime`, the small motions (grass, droids, rain and snow,
    flicker, smoke) on `rgMotionTime`, the water's glints and swell on `rgWaterTime`. In a film each clock runs from
    the frame itself (`rgClock`: the frame times the film's mean step, held to its cap), so it runs evenly and only
    forward however the hours are spread over the frames (Ruby: "clouds should fade instead of jumping around"), and
    the Ringworld's dusk comes round the same way the whole film long. Movers keep timetables (`RG_MOVES`,
    docs/prior-art/ringworld-life-and-views.md): stops drawn one by one round home, each independent of the last, so no path closes
    into a circle; they walk a leg, arrive gently and wait. People walk up and down the street beside them, and by the
    hour go in: by day nearly all are out, by night about one in twelve, the night watch with a lantern (a neon city's
    stay out). Each has a door (Ruby: "people need to go to doors"): the nearest house with one within a quarter of a
    kilometre; at its own moment of the dusk it walks there and fades in at the door, and comes out again at its dawn
    (`toDoor`, from how far the dusk has come where it stands, so nothing is remembered). Nothing is cut until it is wholly out of the frame (`nearCut`,
    the visibility boxes as wide as each thing can reach). The Moving Image's sun follows `sunPath`: a real day's arc at 48° in
    early summer, days of fourteen hours (`SUN_DAY`), long dusks. Time passes in a Camera Round too (Ruby: "time
    should pass during the camera pan"), as much as the sheet says, from the light as it is or from dawn, midday, dusk
    or night.
  - **Flora, Fauna, Detail** (Ruby, 2026-10-25: "Retiring the paint filter and remapping those sliders"): the oil paint is
    gone from the chain; Life is Flora (trees, grass, hedges, flowers), the seventh slider Fauna (the wild things, the
    small finds, the droids), the eighth Detail (`RG_DETAIL`: how much farther and closer together the things round the eye
    are sown, `sowD`; Medium is 1). Older looks meet Fauna and Detail at their defaults (format 11). Every thing in the
    store has an id and tags (`rgTagsOf`; the same thing the same id from any view), and `ringStateOf` gives its state at a
    moment, a wild group's members each by the group's id and their number.
  - **The stars in the world** (Ruby: "the starfield should be pretty static"; locked to the camera the whole ring seemed
    to turn): the star field is a skybox, a cube round the eye whose faces are cut into patches and projected through the
    ring's camera (`rgPanSky`, `RG_SKY_FACES`), so turning the camera turns past the stars as it does past the arch; only
    the ring's spin moves them, kept to a sixth of the true one (`RG_SPIN`). In rain, a storm or snow an overcast ceiling
    covers the sky, thin enough that the arch always shows: rings of a plane under two kilometres up, darkest overhead,
    and soft darker rolls.
  - **The wild things** (Ruby: "wildlife still travel on short predictable paths and do not really move or scatter";
    wildKit.js, docs/prior-art/ringworld-wildlife.md). Each herd, flock or creature is a store record (`c: 'wild'`) at a
    home of its own; its members' places come from `wkAt` alone, by the group's seed and `rgMotionTime`, so a film can
    start anywhere and nothing is remembered. A group lives in eras ending in a move (a herd walking on or bolting and
    fanning out, a flock flushed together and wheeling down elsewhere, a heron's long flight down the shore), each leg
    held inside its era so it never jumps at the turn; between moves each member drifts on noise (`wkWander`). Groups come
    and go one by one with their hours and weather (`rgWildHere`), and are drawn half again their size
    (`RG_WILD_LICENCE`) so they are found at all; the sheep, gulls, insects, fairies and kites drift on the same noise.
  - **Motion without flicker** (Ruby: "clouds and smoke should follow the wind and never flicker";
    docs/prior-art/ringworld-motion-and-variety.md). The bands and the cirrus ride the wind along chords wide enough that
    they fade in and out low over the horizon, never leaping across the sky; the cirrus is combed along the wind as the
    page sees it, larger as it nears. A heap's billows are dealt once (64, in the order it grows them) and shown by its
    size and growth, so it builds turret by turret on its own clock (`rgGrowTime`) and never re-deals. What pulses or
    flickers runs on the film's own seconds (`rgFilmTime`, from the film's frame rate), under one cycle a second at any
    pace through the hours. A window, a far light and a dusk light ease on and off (`pkLit` gives a level, `pkDm` eases
    the kit's dusk lights), and a turned building's proof is read with its windows dark. Smoke is a plume of puffs, each
    placed by its age alone (`pkSmoke`): leaning downwind as the page sees the wind there, rising as the two-thirds power
    of its age, born faint. A thing that moves farther in a frame than its own size is drawn faint, as a long exposure
    would show it. Lightning strikes in the film's own seconds (`rgStrike`): never in the first second and a half, never
    two within 2.5 s, rising over a quarter second and fading over two thirds; it lights the land from its side, cold and
    hard, its strength held by measure so no tenth of the frame changes by more than 0.06 of relative luminance.
    The comet travels by the film's seconds with its tails away from the star; a meteor lives its second in real time;
    the aurora is coloured by height; warning lights pulse together (`pkBeacon`), a lighthouse sweeps by its character
    (`PK_LIGHTS`), turbines and windmills turn, a pylon carries a climbing light and glows breathe (`pkBreathe`).
  - **What stands where, and its colours.** Farmsteads stand in the belt where a city meets the country (`beltAt`), never
    in the Wilds, whose places are their own: sacred groves, stone rows, holy wells and the old ones' columns. Each region
    paints by a palette family the seed chose (`rgPaletteOf`); flat roofs gather their clutter (`pkRoofThings`). The
    Wilds' hills and woods hold lookouts, bothies, charcoal stacks, camps and hides; towns, fountains and bandstands.
  - **Clouds in the world** (Ruby: "distance, lod, parallaxing, transparency, blending, and to not clip with other
    objects"): the heaps stand over the band at their own heights and are drawn among the land by their distance
    (`paintHeap`), each on its own sheet laid at once so its billows never darken each other, every billow a gradient
    so its edges are soft; its billows grown each from one already there inside the heap's dome, so none floats free;
    a cauliflower's smaller billows on its outline as it nears; lit as one body (a gradient over the whole sheet,
    `source-atop`) and its edge broken into faint wisps; rain falls from a heap's base in a curtain of streaks (virga
    under some heaps in plain cloudy weather, never reaching the ground), lightning strikes from one down to the land
    (an event over some ten frames: the leader creeping down, the bolt, then dimming; the heap lit softly from within, eased; never the whole scene, Ruby: photosensitivity). With the clock (Ruby: "clouds need to move slower, billow and gather … clean
    transition states"; the Wind Waker's, docs/prior-art/ringworld-time.md §4) they drift on their own slow clock
    (`rgCloudTime`), their billows breathe and roll, and each heap lives in stages: it gathers from scattered wisps,
    stands, thins and is gone, and a new shape gathers only from nothing; a heap swelling past half the frame as it
    nears fades. Each heap's shadow lies on the land under it (`cloudShadeAt`): darkening each cell it falls on,
    before what stands on it, and the things themselves lit by the sun that reaches them (`cday`). The light on a
    heap follows the sun's height: from above by day, from below at dawn and dusk (warm undersides, violet tops), and
    with the sun behind it a dark heart and a shining edge. High and far, the cirrus and the clear sky's low bands
    stay in the sky.
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
    bunded; on the steep, terraces stepped along the contour. The land paints them piece by piece in its order, as
    the ways (a wash near you, so the land's relief shows through). What a field holds is placed in its frame: bales,
    ricks, a flock (`pkSolidProp`'s sheep) and its shepherd droid, a scarecrow, hives, a harvester. Trees keep back from
    a house's walls and out of the fields, except along a hedge. On a town's shore, boats moored at their jetties (ways
    laid as a deck); where the builders were, now and then a bridge of hard light across the water. By night a house
    too far to draw, a lamp, and the lights between the houses (`glim`) are points of light, coming on through the dusk.
  - **The countryside from a height** (Ruby: "look at it in a wide view from a little height, and say what it needs";
    docs/prior-art/ringworld-countryside.md §12–17): out in the country (the wilds and magic) a village stands only
    round a town's heart, closest there and thinning to its edge; the rest of the buildings gather at seats
    (`seatOf`), some 600 to 900 m apart: a farmstead's house and its barns and sheds round one yard (`RG_FARM`, by its
    region's tradition), laid out as the Peak District's are (four in ten a linear range, nearly as many a courtyard,
    the rest a loose cluster; a cold country's yard keeps one tree), or a hamlet round a green with its well; each
    has a lane walked out to the nearest way, and by night only they show lights. In windy country a farmstead has a
    windbreak on its two windward sides, an L of three rows from the tallest trees inside to shrubs outside. A field
    is tested against every other on all four axes they are turned on (`fieldClash`), against buildings, yards and
    windbreaks and against the ways, and tried a third smaller before it gives up a place. Terraces only where the
    country terraces and the slope is steep, a flooded paddy only where it is warm and wet. Rocks keep out of the
    fields; the stones cleared off them lie in low heaps at their edges (`stonepile`). Traditional orchards and olive
    groves stand on their grids (`fruit`, `olive` trees, apples 9 m apart, cherries 20, olives 10 to 12), modern ones
    and hedgerow groves are rows painted as a crop. Now and then a field is half ploughed, the tractor on the line
    between, the gulls (`gulls`) waiting level with it, a few in the air; the same gulls follow a harvester.
  - **Things in three dimensions** (`pkSpace`, `pkBox3`): the newest things are built of solids in their own frame and
    carried to the page as the eye sees them turned, a little from above (the sheep, the boats, the vehicles below,
    and the droids that walk or roll on tracks, `PK_BOTS3`).
  - **Buildings turned in depth** (`pkTurned`, `PK_BOX3`): a house, a barn, a chapel, a block or a tower turned from
    the eye is a box: its own painted face laid on its front plane and foreshortened, the side turned toward you with
    its windows, a gable roof running back to the ridge (both slopes seen end on from a little above) or a flat top,
    and from behind its plain back wall and gable. Its shape is read off a small proof of its own face
    (`pkFaceProof`): how wide its walls stand, the steps of a setback tower (a box for each), where its eaves and ridge
    are, a granary's stilts, a castle's battlements along every top edge; its walls and roof are the colours its face was painted in (a terrace's sides each the end
    house's own). What stands above the roof (a spire, a belfry, a water tank, chimneys and their smoke) is upright and
    never narrowed to nothing edge on; a glasshouse's sides are glass. A thing is seen from above only so far as
    the eye is above it (`seen`, the view's `eyePx`): what stands at the eye's height is edge on and higher is seen
    from below, so a factory beside the camera never shows its roof; the painter's eye stands up to three times
    higher for what is far off, the town over there seen a little from above. The boxlike things go the same way (`PK_PROP3`):
    a pair of vending machines, each side its own machine's colour and their plain backs from behind; a phone box; a
    mailbox up on its one post; a container; a trough.
  - **Eight views** (Ruby: "at least eight… front, sides, back, and the half-turned states… mirrored the other direction,
    except for the ones that have text"): each thing in the store has a `face`, the way it turns (a house its street, a
    car along its kerb, a board the road), and `viewOf` gives how it is turned from the camera. A building is narrowed
    as a box (above); the round ones (`PK_ROUND`: a silo, a lighthouse, a water tower, a pagoda, a domed mosque) are the
    same from every side; a gate (a torii, an arch) narrows to its post's or its pier's thickness edge on; the rest
    (a temple) mirrored as they turn. A windmill's
    tower is round, its cap and sails turned with it: the sails a cross in their own plane, narrowed edge on, behind the
    tower when it faces away. A parked car or a rusted hulk, a tractor, a food cart, a stack of crates, a wayside shrine and the builders' cargo are solids
    (`PK_SOLIDS`): their bodies and cabs prisms of their outlines
    (`pkPrism`), their wheels discs turned with them (`pkWheel3`). Bicycles, scooters and benches (`PK_SIDE_NATIVE`) are
    drawn end on when met
    head on or from behind (`pkPropEnd`), otherwise narrowed and mirrored. Boards, signs and milestones are never
    mirrored and show their bare backs from behind (`PK_BACKED`, `c.back`). Whatever is mirrored keeps its light on
    the sun's side (`pkFlip`). Trees are mirrored by the seed.
  - **Weather** (`rgWeatherOf`, the parts' Weather setting): by the seed clear, clouds, fog, rain, storm or snow; heaps of
    cloud lit from the sun's side, rain in veils, lightning, a rainbow opposite a low sun, rays from a low or clouded
    sun, the sun's glare low over the land, mist thickening with depth, rain and snow falling over it all. The
    air round the sun (docs/prior-art/ringworld-sky.md): the sky brightens toward the sun and the horizon under it glows,
    burning orange and red at dusk and lingering after the sun has gone; opposite it at dusk and dawn, the Belt of
    Venus over the blue-grey of the world's shadow. Cirrus combed into fine strands, some hooked (mares' tails). By day in clear weather
    over dry country, now and then a dust devil (a tapering column of dust, lit on the sun's side, its strands winding
    up it) wanders and dies away; at dusk on some rings a murmuration of starlings folds over open country.
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
  - **The trees** (Ruby: "make sure all the trees match the current art style
    and none have disconnected pieces … variations in size and form within
    species … shading on all trees … texture when close … leaf translucency …
    subsurface scattering"): each tree draws its own form from its stream
    (`pkTreeForm`: how wide, how tall, its lean, the side it grew toward, how
    open, how old, a touch of its own green), so no two of a kind match. A
    crown is grown, not scattered (`pkGrow`: each lobe set against one already
    there, inside an envelope), so nothing floats; limbs (`pkLimb`, one smooth
    tapering shape) leave the trunk below its top and end inside the lobes
    they hold. Every crown is shaded the same way (`pkLobes`): far, lobes in
    shadow with a lit cap; near, ragged clusters, the lower inside darkest,
    sky through it, and close by small leaves of the tree's own shape. With the
    sun behind a tree (the sun's `back`, from how far the camera looks toward
    it) its shade lifts toward yellow-green and the crown's true outline glows
    (`pkBacklit`: only arcs that face open air). Conifers (`pkConifer`) are
    tiers drawn bottom-up, each side its own width, a skirt in shade, a lit
    band on the sun's side and needles near; a mature pine is clumps at their
    own heights on their own limbs, a cedar flat shelves, a stone pine and an
    acacia one squashed dome on limbs that reach it. Palms and tree ferns carry
    feathered fronds (`pkFrond`: leaflets that hang, or spread flat).
  - **Standing on the land** (Ruby: "make sure buildings are never floating in the air or on water … up to 16 points
    of rotation for buildings … overly wide objects … broken up into smaller objects and positioned individually";
    docs/prior-art/ringworld-life-and-views.md §5, §6): a building's footprint is sampled at its four corners and middle,
    two metres out all round; none stands on the water or within a step of it, nor where its ground falls more than
    seven tenths of its width, and on a slope it stands level on a stone plinth (`pkBuilding`'s `plinth`) reaching down
    to the ground at its lowest corner. A pagoda and a mosque are built in the round (`pkPagoda3`, `pkMosque3`), so
    they turn with the eye through every angle like the boxes do. A wall, a hedgerow or a fence is a run of short pieces
    laid along its own line, each standing and sorted where it stands (`runW`), so the run recedes and turns.
  - **Saturn** (Ruby: "Ringworld should sometimes be orbiting Saturn"): by the
    seed (one ring in four) or The Arch's Saturn setting, the ring orbits it as
    the old games' rings orbit their gas giants, and Saturn hangs huge in the
    sky beyond the far arch, lit from the ring's star (`paintSaturn`), drawn
    before the arch and its air so they pass in front; now and then Enceladus
    beside it. It takes the far planet's place.
  - **Small life** (`rgSmallLife`; Ruby: "insects, fairies, flowers, slime
    creatures … all subtle"): on some rings (`lively`, by the seed), finds are
    sown in the world as everything else is (more with Life), and drawn in their
    place in the order, so nearer land or a nearer thing covers them as it would
    anything; never where nearer land hides them. The kind is by the world (fairies in
    magic, slime in ruins); every mark has a floor in canonical pixels. Now and
    then someone flies a kite in the fields or a city's green: high and downwind by
    the ring's wind (`rgWind`), nodding on its string and its tail of bows waving with
    the clock, put away by dusk and in rain, fog or snow.
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
  - Refraction needs what is under the glass: in a graph, the starter A
    Picture Under Glass (Texture from the Menu into the Pane's Picture); on
    the page, See Through (Two Surfaces, below): the Pane hands its bend on as
    a lens and the page beneath is bent through it.
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
  - **See Through** (Ruby: glass and water "should take the texture below as an input and do something creative with it";
    docs/prior-art/surface-beneath.md): a surface whose caps say `seeThrough` (Under Glass, Broken Glass, Crystal Leaf,
    Poured Wax, Rain on Glass so far) shows the layer's switch. On, its request asks for the lens too: the worker stacks it beneath the
    picture on one canvas twice as tall (`seeStack`, `seeLens`; red and green the offset, `SEE_REACH` canonical pixels at
    most), made from the height a Light Engine lit (`ltLensed`) or the bend a glass part works out itself (Glass Pane,
    Glass Shards, and a whole generator's own offsets left on its canvas, which `kitWhole` hands on: Rain on Glass, whose
    drops, seeing through, show only their rims and highlights so the bent page shows in them, turned over). `drawSurfaceLayer` bends the page drawn so far through it (`bendBeneath`: the nearest pixel in the
    preview, smooth in the saved image), then lays the picture by its blend. A look saved before the switch has it off
    (`seeByDefault`: a look with a version); the app's own looks, with none, have it on.
  - A new lower starts as Waking Grain on `seed ^ 0x5bd1e995`. Presets clear
    it (unless something of it is locked). Old looks' `baseType`… keys become
    `baseLayer` in `retireBaseLayer`.

---
