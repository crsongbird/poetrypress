/**
 * textureParams.js — every menu surface's sliders, in order: the one registry the menu's sliders, the surfaces' chains
 * (chains.js reads a knob's name and default here) and the generators all read. A module of its own so that chains.js
 * can read it without a cycle (textureGenerators imports chains).
 */
/**
 * TEXTURE_PARAMS — the two knobs each texture exposes, in order.
 *
 * A param whose key is 'zoom' is handled generically by getTextureCanvas:
 * the texture is generated at reduced dimensions and scaled back up, which
 * magnifies the pattern without any generator needing to know about it.
 * Every other param arrives at the generator as `amt`, a plain multiplier
 * around 1.0 that each one applies to whatever its dominant quantity is.
 */
// a slider: its key, label and default; 0–100 and no unit unless it says otherwise (min, max, unit, ticks, names)
const sliderOf = (key, label, def, more) => ({ key, label, min: 0, max: 100, def, unit: '', ...more });
export const TEXTURE_PARAMS = {
  clouds:        [sliderOf('zoom', 'Lift', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('amt', 'Drag', 60, { max:200, unit:'%' }),
                  // a shaft of light from the dial: the smoke in it glows, dust motes catch it
                  sliderOf('form', 'Dust', 35)],
  bokeh:         [sliderOf('zoom', 'Focal Plane', 100, { min:25, max:400, unit:'%' }),
                  sliderOf('amt', 'Orb Count', 100, { min:20, max:260, unit:'%', base:67 }),
                  // a camera's aperture: round, then 7, 6 and 5 blades, then a heart
                  sliderOf('form', 'Aperture', 0, { ticks:[0,25,50,75,100], names:['Round','7 Blades','6 Blades','5 Blades','Heart'] }),
                  // what the motes ARE: dot (as before), petal, leaf, star, snowflake,
                  // droplet, crescent, flower — and a die to pick one at random
                  sliderOf('shape', 'Object Shape', 0, { ticks:[0,14,29,43,57,71,86,100], names:['Dot','Petal','Leaf','Star','Snowflake','Droplet','Crescent','Flower'], dice:true }),
                  // each mote's hue, rotated at random within this spread around Light Hue
                  sliderOf('hue', 'Color Variation', 0, { max:180, unit:'°' })],
  astral:        [sliderOf('stars', 'Star Density', 100, { min:10, max:300, unit:'%' }),
                  sliderOf('fog', 'Nebula Density', 100, { max:260, unit:'%' }),
                  // 0 is deep space; up the scale, twinkle, colour fringes, airglow
                  sliderOf('form', 'Atmosphere', 20)],
  magicparticles:[sliderOf('zoom', 'Sparkle Size', 100, { min:20, max:200, unit:'%' }),
                  sliderOf('amt', 'Sparkle Count', 100, { min:10, max:400, unit:'%', base:225 }),
                  // trails (0) → scattered, as it was (50) → bursts (100)
                  sliderOf('form', 'Chaos', 50, { ticks:[0,50,100] })],
  embers:        [sliderOf('zoom', 'Ember Size', 100, { min:60, max:600, unit:'%' }),
                  sliderOf('amt', 'Ember Count', 100, { min:20, max:500, unit:'%', base:590 }),
                  // how far each spark's colour may stray from its ember hue
                  sliderOf('form', 'Hue Drift', 10)],
  snow:          [sliderOf('zoom', 'Flake Size', 100, { min:60, max:340, unit:'%' }),
                  sliderOf('amt', 'Snowfall', 100, { min:20, max:260, unit:'%', base:2950 }),
                  // still air at 0; the dial says where the wind blows from
                  sliderOf('form', 'Wind', 0)],
  grain:         [sliderOf('zoom', 'Grain Size', 100, { min:100, max:600, unit:'%' }),
                  sliderOf('amt', 'Contrast', 100, { min:30, max:240, unit:'%' }),
                  // the kind of grain, blended between neighbours; Film is the original
                  sliderOf('form', 'Grain', 33, { ticks:[0,33,66,100], names:['Silver','Film','Paper','Digital'] })],
  metalleaf:     [sliderOf('zoom', 'Leaf Size', 100, { min:60, max:360, unit:'%' }),
                  sliderOf('amt', 'Coverage', 100, { min:20, max:260, unit:'%', base:165 }),
                  // the original flakes (0) → convex polygons of every kind, drawn out long at the top
                  sliderOf('form', 'Shape', 0),
                  // flat, as it always was (0) → each flake tilting to the dial's light, a band of reflection inside
                  sliderOf('shape', 'Sheen', 0),
                  // soft speckled, noisy highlights over the flakes (0: none)
                  sliderOf('hue', 'Glitter', 0)],
  // ── Corvid Feathers and the light to lay over a page (ROADMAP §2 L5, L6) ──
  corvids:        [sliderOf('bird', 'Bird', 50, { ticks:[0,25,50,75,100], names:['Plain','Crow','Raven','Magpie','Blue Jay'] }),
                  sliderOf('zoom', 'Feather Size', 100, { min:40, max:250 }),
                  sliderOf('amt', 'Feathers', 25),
                  sliderOf('fluff', 'Fluff', 10),
                  sliderOf('splits', 'Splits', 30),
                  sliderOf('sheen', 'Sheen', 70),
                  sliderOf('depth', 'Depth', 40),
                  sliderOf('lift', 'Lift', 60)],
  pixelspace:     [sliderOf('pixel', 'Pixel Size', 40),
                  sliderOf('amount', 'Nebula', 55),
                  sliderOf('stars', 'Stars', 50),
                  sliderOf('sparkles', 'Sparkles', 40),
                  sliderOf('worlds', 'Worlds', 50),
                  sliderOf('dither', 'Dither', 40),
                  sliderOf('swirl', 'Swirl', 50),
                  sliderOf('bands', 'Bands', 45)],
  liminal:        [sliderOf('reach', 'Reach', 50),
                  sliderOf('ceiling', 'Ceiling', 50),
                  sliderOf('width', 'Width', 50),
                  sliderOf('lights', 'Lights', 60),
                  sliderOf('failing', 'Failing Lights', 25),
                  sliderOf('haze', 'Haze', 30),
                  sliderOf('grain', 'Grain', 35),
                  sliderOf('strange', 'Strangeness', 30)],
  webb:           [sliderOf('amount', 'Dust', 55),
                  sliderOf('streaming', 'Streaming', 45),
                  sliderOf('stars', 'Stars', 50),
                  sliderOf('spiked', 'Spiked Stars', 30),
                  sliderOf('length', 'Spike Length', 50),
                  sliderOf('galaxies', 'Galaxies', 40),
                  sliderOf('glow', 'Glow', 50),
                  sliderOf('detail', 'Detail', 50)],
  imprints:       [sliderOf('species', 'Species', 98),
                  sliderOf('prints', 'Prints', 40),
                  sliderOf('size', 'Print Size', 50),
                  sliderOf('ink', 'Ink', 55),
                  sliderOf('paper', 'Paper', 45),
                  sliderOf('misreg', 'Misregistration', 25),
                  sliderOf('wear', 'Wear', 30),
                  sliderOf('turn', 'Turn', 50)],
  bouquets:       [sliderOf('main', 'Main Flower', 41),
                  sliderOf('second', 'Second Flower', 43),
                  sliderOf('blooms', 'Blooms', 50),
                  sliderOf('size', 'Bouquet Size', 55),
                  sliderOf('foliage', 'Foliage', 50),
                  sliderOf('filler', 'Filler', 45),
                  sliderOf('shadow', 'Shadow', 50),
                  sliderOf('wrap', 'Wrap', 50)],
  petals:         [sliderOf('petals', 'Petals', 45),
                  sliderOf('petalsize', 'Petal Size', 50),
                  sliderOf('wilting', 'Wilting', 60),
                  sliderOf('fallen', 'Fallen Flowers', 30),
                  sliderOf('clump', 'Clumping', 55),
                  sliderOf('shadow', 'Shadow', 55),
                  sliderOf('surface', 'Surface', 50),
                  sliderOf('species', 'Species', 41)],
  meadow:         [sliderOf('flowers', 'Flowers', 55),
                  sliderOf('grass', 'Grass', 60),
                  sliderOf('wind', 'Wind', 45),
                  sliderOf('petals', 'Petals in the Air', 35),
                  sliderOf('horizon', 'Horizon', 30),
                  sliderOf('clouds', 'Clouds', 45),
                  sliderOf('second', 'Second Flower', 40),
                  sliderOf('species', 'Species', 27)],
  macro:          [sliderOf('species', 'Species', 27),
                  sliderOf('stage', 'Stage', 45),
                  sliderOf('aperture', 'Aperture', 60),
                  sliderOf('focus', 'Focus', 50),
                  sliderOf('lights', 'Lights Behind', 45),
                  sliderOf('dew', 'Dew', 35),
                  sliderOf('translucency', 'Translucency', 55),
                  sliderOf('visitors', 'Visitors', 20)],
  ditsy:          [sliderOf('flowers', 'Flowers', 55),
                  sliderOf('size', 'Flower Size', 35),
                  sliderOf('sprigs', 'Sprigs', 45),
                  sliderOf('colors', 'Colors', 50),
                  sliderOf('cloth', 'Cloth', 40),
                  sliderOf('cluster', 'Clustering', 30),
                  sliderOf('turn', 'Turn', 70),
                  sliderOf('species', 'Species', 98)],
  botline:        [sliderOf('plants', 'Plants', 35),
                  sliderOf('size', 'Plant Size', 55),
                  sliderOf('line', 'Line', 45),
                  sliderOf('detail', 'Detail', 55),
                  sliderOf('wash', 'Wash', 40),
                  sliderOf('slip', 'Wash Slip', 30),
                  sliderOf('paper', 'Paper', 40),
                  sliderOf('species', 'Species', 98)],
  windsea:        [sliderOf('horizon', 'Horizon', 45),
                  sliderOf('weather', 'Weather', 50),
                  sliderOf('swirls', 'Swirls', 45),
                  sliderOf('waves', 'Waves', 50),
                  sliderOf('foam', 'Foam', 45),
                  sliderOf('wind', 'Wind', 35),
                  sliderOf('islands', 'Islands', 40),
                  sliderOf('bands', 'Toon Bands', 30)],
  inkscroll:      [sliderOf('peaks', 'Peaks', 55),
                  sliderOf('mist', 'Mist', 50),
                  sliderOf('ink', 'Ink', 50),
                  sliderOf('wash', 'Wash', 55),
                  sliderOf('clouds', 'Clouds', 45),
                  sliderOf('blossoms', 'Blossoms', 35),
                  sliderOf('age', 'Age', 40),
                  sliderOf('bands', 'Toon Bands', 30)],
  dappled:        [sliderOf('size', 'Leaf Size', 50),
                  sliderOf('amount', 'Leaves', 50),
                  sliderOf('softness', 'Softness', 50)],
  windowlight:    [sliderOf('size', 'Window Size', 50),
                  sliderOf('amount', 'Brightness', 50),
                  sliderOf('softness', 'Softness', 40)],
  caustics:       [sliderOf('size', 'Net Size', 50),
                  sliderOf('amount', 'Brightness', 50),
                  sliderOf('softness', 'Softness', 40)],
  lightleaks:     [sliderOf('size', 'Bloom Size', 50),
                  sliderOf('amount', 'Leaks', 50),
                  sliderOf('softness', 'Softness', 50)],
  feathers:      [sliderOf('zoom', 'Feather Size', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('amt', 'Feathers', 30),
                  sliderOf('fluff', 'Fluff', 15),
                  sliderOf('curl', 'Curl', 30),
                  sliderOf('splits', 'Splits', 30),
                  sliderOf('marks', 'Markings', 0, { ticks:[0,33,66,100], names:['Plain','Bars','Bars','Eyes'] }),
                  sliderOf('depth', 'Depth', 50),
                  sliderOf('lift', 'Lift', 50)],
  flowers:       [sliderOf('zoom', 'Bloom Size', 150, { min:50, max:450, unit:'%' }),
                  sliderOf('amt', 'Bloom Count', 60, { min:10, max:300, unit:'%', base:18 }),
                  // the third, unusual knob: which flower. 50 is the lotus
                  // ticks at the seven species: bud, cherry, lily, lotus, daisy, rosette, hydrangea
                  sliderOf('form', 'Form', 50, { ticks:[0,25,38,50,65,82,100] })],
  brushstrokes:  [sliderOf('zoom', 'Stroke Width', 100, { min:60, max:380, unit:'%' }),
                  sliderOf('amt', 'Stroke Count', 100, { min:20, max:260, unit:'%', base:111 }),
                  // dry (as before) → wet: mixing, levelled bristles, bleeding edges, drips
                  sliderOf('form', 'Wetness', 0)],
  halftone:      [sliderOf('zoom', 'Dot Scale', 100, { min:50, max:400, unit:'%' }),
                  sliderOf('amt', 'Dot Weight', 100, { min:30, max:240, unit:'%' })],
  // RINGWORLD (chains.js 'ringworld'; Ruby: the camera on the camera dial, the day on the light dial; who built it, by the seed or chosen)
  // ◯ RING IN THE SKY (chains.js 'skyring'; Ruby: "a beautiful background layer … simplified, but cosmic"): the camera dial moves the ring
  skyring:       [sliderOf('zoom', 'Ring Width', 45),
                  sliderOf('amt', 'Stars', 50),
                  sliderOf('form', 'Nebula', 50),
                  sliderOf('shape', 'Air', 60),
                  sliderOf('height', 'Star Height', 45),
                  sliderOf('paint', 'Paint', 0),
                  sliderOf('brush', 'Brush', 37, { ticks:[12,37,62,88], names:['Round','Flat','Knife','Dry'] })],
  // ◯ PAINTED RINGWORLD (chains.js 'ringpaint'; Ruby: "a generative art piece that still looks like being on a ringworld"): Ringworld's camera, painted
  ringpaint:     [sliderOf('zoom', 'Band Width', 45),
                  sliderOf('amt', 'Landforms', 50),
                  // who and what: the seed's own world, or one chosen; Mixed lays three side by side
                  sliderOf('world', 'World', 0, { ticks:[0,14,29,43,57,71,86,100], names:['By the Seed','Wilds','Cities','Neon','Builders','Magic','Ruins','Mixed'] }),
                  sliderOf('shape', 'Life', 50),
                  sliderOf('form', 'Works', 50),
                  sliderOf('alt', 'Altitude', 15),
                  sliderOf('paint', 'Paint', 0),
                  sliderOf('brush', 'Brush', 37, { ticks:[12,37,62,88], names:['Round','Flat','Knife','Dry'] })],
  ringworld:     [sliderOf('zoom', 'Band Width', 45),
                  // the land's relief, its rim walls and the mountains against them, and the seed's own landforms (ranges at the walls, peaks, mesas, boulders, pinnacles, stone arches)
                  sliderOf('amt', 'Landforms', 50),
                  sliderOf('form', 'Seas', 40),
                  // how built-up the ring is: the builders' works, and past a quarter, cities whoever built it
                  sliderOf('shape', 'Cities', 25),
                  sliderOf('hue', 'Atmosphere', 50),
                  // who built the ring (its works, its lights): the seed's own pair, or one chosen
                  sliderOf('builders', 'Builders', 0, { ticks:[0,20,40,60,80,100], names:['By the Seed','Wilds','Engineers','Cities','Magi','Ruins'] }),
                  sliderOf('alt', 'Altitude', 15),
                  // ships in the sky (the middle: what the builders fly), and past it lanes of small craft; busier streets at night
                  // (where across the band you stand is the seed's now; the lens is the camera dial's zoom)
                  sliderOf('traffic', 'Traffic', 50)],
  // RAIN ON WATER (chains.js 'rainwater'): each drop a ring wave on still water; View looks across it to the horizon
  rainwater:     [sliderOf('zoom', 'Ripple Size', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('amt', 'Rain', 50),
                  // fresh drops' small tight rings (0) → wide, old, overlapping rings (100)
                  sliderOf('form', 'Spread', 50),
                  sliderOf('shape', 'Splashes', 40)],   // (its View is the camera dial's)
  glassrain:     [sliderOf('zoom', 'Drop Size', 100, { min:40, max:300, unit:'%' }),
                  sliderOf('amt', 'Rain', 100, { min:20, max:300, unit:'%' }),
                  // a fine mist of tiny droplets between the drops
                  sliderOf('form', 'Condensation', 30)],
  // the dial says where the rain comes from (it was the Slant slider)
  rainstreaks:   [sliderOf('zoom', 'Rain Zoom', 100, { min:100, max:500, unit:'%' }),
                  // still air (0, as it was) → gusts swinging the rain about the dial's way, page-wide
                  sliderOf('gusts', 'Gusts', 0)],
  sigils:        [sliderOf('zoom', 'Sigil Zoom', 100, { min:100, max:500, unit:'%' }),
                  sliderOf('amt', 'Sigil Count', 100, { min:15, max:260, unit:'%', base:51 }),
                  // the hand: steady → trembling, the nib skipping into scratches
                  sliderOf('form', 'Chaos', 20)],
  mathnoise:     [sliderOf('zoom', 'Glyph Zoom', 140, { min:100, max:500, unit:'%' }),
                  sliderOf('amt', 'Emergence', 130, { min:30, max:240, unit:'%' })],
  summoning:     [sliderOf('zoom', 'Circle Size', 100, { min:40, max:200, unit:'%' }),
                  // how many bands, polygrams and planets the one circle is built from
                  sliderOf('amt', 'Complexity', 100, { min:20, max:300, unit:'%' }),
                  // drawn by hand, vines and moons (0) → machined, gauges and circuits, glowing (100)
                  sliderOf('form', 'Organic ↔ Tech', 30)],
  inkbleed:      [sliderOf('zoom', 'Blot Scale', 100, { min:60, max:400, unit:'%' }),
                  sliderOf('amt', 'Spread', 100, { min:30, max:240, unit:'%' }),
                  // crisp and solid (0) → wet: pooled rims, pale mottled middles, wicking, drips, splatter
                  sliderOf('form', 'Wetness', 50),
                  // black ink alone (0) → red joins it → whole pastel figures (100); the seed decides within it
                  sliderOf('shape', 'Color', 35)],
  crackedglaze:  [sliderOf('zoom', 'Fracture Scale', 100, { min:60, max:400, unit:'%' }),
                  sliderOf('amt', 'Crack Density', 100, { min:10, max:900, unit:'%', base:26 }),
                  // how far the glaze has gone: crazed only → blistered → chipped → peeling to the body
                  sliderOf('form', 'Enameling', 0, { ticks:[0,33,66,100], names:['Unbroken','Bubbled','Chipped','Peeling'] })],
  linen:         [sliderOf('zoom', 'Weave Scale', 100, { min:50, max:400, unit:'%' }),
                  // stitching → slubs → buttons → rivets
                  sliderOf('amt', 'Details', 42, { ticks:[15,42,68,95] }),
                  // silk → twill → linen → canvas → burlap
                  sliderOf('form', 'Weave', 50, { ticks:[0,25,50,75,100] })],
  oldpaper:      [sliderOf('zoom', 'Scale', 100, { min:40, max:400, unit:'%' }),
                  // folds across the sheet; past three-quarters they tear
                  sliderOf('amt', 'Folds', 35),
                  // clean → yellowed → foxed → mildewed → scorched
                  sliderOf('form', 'Age', 30, { ticks:[0,30,60,90], names:['Clean','Foxed','Mildewed','Scorched'] }),
                  // the gentle unevenness of once-damp paper, and pocket creases
                  sliderOf('shape', 'Crinkle', 25)],
  crystal:   [sliderOf('zoom', 'Facet Size', 100, { min:40, max:300, unit:'%' }),
                  // milky and veiled (0) → clear and deep (100)
                  sliderOf('amt', 'Clarity', 70),
                  // light caught inside: flashing internal planes, split into colours
                  sliderOf('form', 'Fire', 50),
                  // ghost crystals inside, the faces it had as it grew
                  sliderOf('shape', 'Phantoms', 30),
                  // rutile needles and tiny bubbles
                  sliderOf('hue', 'Inclusions', 20)],
  spangle:       [sliderOf('zoom', 'Crystal Size', 100, { min:40, max:300, unit:'%' }),
                  // feathered six-armed growth inside each grain (zinc spangle)
                  sliderOf('amt', 'Dendrites', 50),
                  // flat facets → stepped hopper crystals (bismuth)
                  sliderOf('form', 'Terraces', 0),
                  // orderly as a snowflake (0) → every crystal its own
                  sliderOf('shape', 'Variation', 40),
                  // fine lines brushed across the light, like brushed steel
                  sliderOf('hue', 'Brushing', 0)],
  coldpress:     [sliderOf('zoom', 'Tooth Scale', 100, { min:75, max:400, unit:'%' }),
                  sliderOf('amt', 'Tooth Depth', 100, { min:20, max:300, unit:'%' }),
                  // how the paper was made: pressed hot and smooth, cold, or left rough
                  sliderOf('form', 'Press', 50, { ticks:[0,50,100], names:['Hot Press','Cold Press','Rough'] })],
  cupring:       [sliderOf('zoom', 'Ring Size', 100, { min:40, max:320, unit:'%' }),
                  sliderOf('amt', 'Ring Count', 100, { min:30, max:300, unit:'%', base:2 }),
                  // drips, and the faint wash inside the ring
                  sliderOf('form', 'Spill', 35)],
  // THE ATHANOR: a surface made in the node editor. Its knobs are the
  // graph's Knob nodes (the page relabels them from the graph; here, eight
  // plain ones, so a request always has its values)
  athanor:      [1,2,3,4,5,6,7,8].map(i => ({ key:'k'+i, label:'Knob '+i, min:0, max:100, def:50, unit:'' })),
  guilloche:     [sliderOf('zoom', 'Rosette Size', 100, { min:50, max:250, unit:'%' }),
                  sliderOf('amt', 'Line Density', 100, { min:30, max:200, unit:'%' }),
                  // how many lobes each rosette turns: a few broad petals → a fine crown
                  sliderOf('form', 'Lobes', 45)],
  chladni:       [sliderOf('zoom', 'Grain Size', 100, { min:50, max:300, unit:'%' }),
                  sliderOf('amt', 'Sand', 100, { min:20, max:300, unit:'%' }),
                  // the plate's mode: a few lines → many
                  sliderOf('form', 'Mode', 40)],
  contour:       [sliderOf('zoom', 'Terrain Scale', 100, { min:40, max:300, unit:'%' }),
                  sliderOf('amt', 'Contour Interval', 100, { min:30, max:250, unit:'%' }),
                  // the land lit beneath its lines: none (lines only) → strong relief
                  sliderOf('form', 'Hillshade', 45)],
  stainedglass:  [sliderOf('zoom', 'Pane Size', 100, { min:50, max:250, unit:'%' }),
                  sliderOf('amt', 'Leading', 100, { min:30, max:250, unit:'%' }),
                  // the window's kind: random shards (0–30) → a patterned lattice → a rose window (55–80) → an ordered grid (80+)
                  sliderOf('form', 'Shape', 25),
                  // the palette's colors (0, as before) → a painted landscape behind the glass, each pane its color there (Tiffany's windows)
                  sliderOf('shape', 'Scene', 0),
                  sliderOf('hue', 'Glass Texture', 0, { ticks:[0,33,67,100], names:['Cathedral','Hammered','Seedy','Opalescent'] }),
                  sliderOf('tilt', 'Window', 0, { ticks:[0,42,68,100], names:['Whole Page','Lancet Arch','Arcade','Round Window'] })],
  // UNDER GLASS (chains.js 'underglass'; Ruby: a glass to lay over another surface): what the glass catches, on mid-gray
  // BROKEN GLASS (chains.js 'brokenglass'; Ruby: "glass fragments laying on nothing"): shards and the light they catch, on mid-gray
  brokenglass:   [sliderOf('count', 'Shards', 40),
                  sliderOf('size', 'Size', 100, { min:30, max:300, unit:'%' }),
                  // heaped where it fell (0) → flung across the page
                  sliderOf('spread', 'Spread', 55),
                  // broad pieces (0) → long slivers
                  sliderOf('sliver', 'Slivers', 35),
                  // the light each shard gathers onto the ground beside it
                  sliderOf('caustic', 'Caustics', 60),
                  sliderOf('glint', 'Glints', 60),
                  // how many shards are bottle green, amber, cobalt, sea glass or violet
                  sliderOf('colors', 'Colored Glass', 25),
                  sliderOf('shadow', 'Shadows', 50)],
  // DEWY WEBS (chains.js 'dewwebs'; Ruby: "dewy spider webs getting caught by the light"): silk, dew and glints on mid-gray
  dewwebs:       [sliderOf('webs', 'Webs', 30),
                  sliderOf('size', 'Size', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('dew', 'Dew', 60),
                  sliderOf('drop', 'Drop Size', 100, { min:30, max:300, unit:'%' }),
                  sliderOf('torn', 'Torn', 20),
                  sliderOf('sag', 'Sag', 40),
                  // white glints (0) → the colours thin silk splits the light into
                  sliderOf('irid', 'Iridescence', 50),
                  // the spiral's turns: open (0) → close-wound
                  sliderOf('threads', 'Threads', 50)],
  underglass:    [sliderOf('reflect', 'Reflection', 55),
                  sliderOf('scratch', 'Scratches', 40),
                  // straight, in bunches (0) → wiped round and round by a cloth (100)
                  sliderOf('swirl', 'Swirl', 30),
                  // fingerprints and smears
                  sliderOf('smudge', 'Smudges', 35),
                  sliderOf('dust', 'Dust & Spots', 30),
                  // 0: whole; a blow's cracks and rings, then a second and third blow
                  sliderOf('cracks', 'Cracks', 0),
                  // old glass's waves: they ripple the reflection (and in a graph, bend what is under it)
                  sliderOf('wave', 'Waviness', 30),
                  // a thick sheet's bevelled edge round the page (0: none)
                  sliderOf('edge', 'Edge', 0)],
  suminagashi:   [sliderOf('zoom', 'Ring Size', 100, { min:50, max:250, unit:'%' }),
                  sliderOf('amt', 'Drops', 100, { min:30, max:250, unit:'%' }),
                  // still concentric rings → swept by breath and fan
                  sliderOf('form', 'Breath', 40)],
  watercolour:   [sliderOf('zoom', 'Wash Size', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('amt', 'Pigment', 100, { min:30, max:250, unit:'%' }),
                  // dry, hard rims → wet, soft and spreading
                  sliderOf('form', 'Wetness', 50)],
  flowfield:     [sliderOf('zoom', 'Scale', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('amt', 'Lines', 100, { min:30, max:300, unit:'%' }),
                  // the field: a steady current (0) → eddies and swirls
                  sliderOf('form', 'Turbulence', 50)],
  turing:        [sliderOf('zoom', 'Pattern Scale', 100, { min:50, max:250, unit:'%' }),
                  // how long the pattern has had to grow: colonies still spreading → the whole page
                  sliderOf('amt', 'Growth', 80, { min:20, unit:'%' }),
                  // along the feed/kill map
                  sliderOf('form', 'Pattern', 25, { ticks:[0,25,50,75,100], names:['Spots','Coral','Maze','Worms','Holes'] }),
                  sliderOf('shape', 'Relief', 50)],
  frost:         [sliderOf('zoom', 'Crystal Size', 100, { min:50, max:250, unit:'%' }),
                  sliderOf('amt', 'Frost', 100, { min:20, max:250, unit:'%' }),
                  // needles off the twigs, at sixty degrees
                  sliderOf('form', 'Feathering', 55),
                  // the matte of fine crystals toward the frame
                  sliderOf('shape', 'Rime', 30)],
  ash:           [sliderOf('zoom', 'Flake Size', 100, { min:40, max:300, unit:'%' }),
                  sliderOf('amt', 'Ashfall', 100, { min:20, max:400, unit:'%' }),
                  // pale ash, burnt through (0) → black char, barely burnt (100)
                  sliderOf('form', 'Char', 55),
                  // how many flakes are still alight along their edge
                  sliderOf('shape', 'Embers', 20)],
  wax:           [sliderOf('zoom', 'Pool Size', 100, { min:40, max:400, unit:'%' }),
                  sliderOf('amt', 'Pool Count', 100, { min:25, max:300, unit:'%', base:3 }),
                  // thin and spreading → thick and lumpy
                  sliderOf('form', 'Viscosity', 45),
                  // wax (0) → a fluid's spatter: drops flung away from the dial, crowned pools (Ruby)
                  sliderOf('shape', 'Splatter', 0),
                  sliderOf('hue', 'Height', 50),
                  // matte (0) → wet and glossy (100)
                  sliderOf('tilt', 'Sheen', 50)],
  dunes:         [sliderOf('zoom', 'Ripple Size', 100, { min:40, max:300, unit:'%' }),
                  sliderOf('amt', 'Wind', 50),
                  sliderOf('form', 'Dune Height', 40)],
                  // (its camera — straight down, or tipped toward the horizon, the far dunes hazy — is the camera dial)
  kintsugi:      [sliderOf('zoom', 'Seam Width', 100, { min:50, max:300, unit:'%' }),
                  sliderOf('amt', 'Fractures', 100, { min:20, max:400, unit:'%' }),
                  sliderOf('form', 'Gloss', 70)],
  moss:          [sliderOf('zoom', 'Stone Scale', 100, { min:40, max:300, unit:'%' }),
                  sliderOf('amt', 'Moss', 45),
                  sliderOf('form', 'Dampness', 30)],
                  // (its camera — straight down, or tipped, the far stone in haze — is the camera dial)
  landscape:     [sliderOf('zoom', 'Distance', 100, { min:60, max:200, unit:'%' }),
                  sliderOf('amt', 'Ridges', 100, { min:20, max:250, unit:'%' }),
                  // dry, worked paint (as before) → watercolour: bleeding edges, blooms
                  sliderOf('form', 'Wetness', 0),
                  // (the camera's pitch, as painted → looking down from higher, is the camera dial's View)
                  // grey, tinted by the hues (0, as it was) → painted in colour: a time of day, aerial perspective, broken colour
                  sliderOf('hue', 'Color', 0),
                  // brushwork the dial lights: none (0, the old flat painting) → thick oil, every stroke standing up
                  sliderOf('shape', 'Impasto', 50)],
  cityscape:     [sliderOf('zoom', 'Skyline Height', 100, { min:60, max:180, unit:'%' }),
                  sliderOf('amt', 'Lit Windows', 100, { max:300, unit:'%' })],
  blackhole:     [sliderOf('zoom', 'Chaos', 100, { min:40, max:250, unit:'%' }),
                  sliderOf('amt', 'Particles', 100, { min:10, max:300, unit:'%' }),
                  // twin plasma jets along the spin axis (0: none, as before)
                  sliderOf('form', 'Jets', 0)],
  water:         [sliderOf('zoom', 'Wave Scale', 100, { min:40, max:250, unit:'%' }),
                  // long calm swells (0) → short choppy wind waves (100)
                  sliderOf('amt', 'Turbulence', 35),
                  // shallow: a fine sharp net; deep: it swells, blurs and fades
                  sliderOf('form', 'Depth', 35),
                  // milky water, scattering the light
                  sliderOf('shape', 'Haze', 10),
                  // dirty water: light absorbed, silt hanging in it
                  sliderOf('hue', 'Murk', 0)],
                  // (its camera — straight down, or tipped toward the far bank, the far water mirroring the sky — is the camera dial)
  moon:          [sliderOf('zoom', 'Moon Size', 100, { min:60, max:150, unit:'%' }),
                  sliderOf('amt', 'Fractal Depth', 100, { min:20, max:190, unit:'%' }),
                  // banks drifting in front of the moon and stars, silver-lined, a halo in their veils (0: none)
                  sliderOf('form', 'Clouds', 30),
                  // the night around it: stars, the Milky Way, earthshine on the dark side (0: the page, as before)
                  sliderOf('shape', 'Night Sky', 70)],
  aurora:        [sliderOf('zoom', 'Curtain Height', 100, { min:40, max:220, unit:'%', base:100, absUnit:'%' }),
                  sliderOf('amt', 'Ribbon Count', 100, { min:20, max:1800, unit:'%', base:9, absUnit:'' }),
                  // a noisy glow spilling from the brightest light (0: none, as before)
                  sliderOf('form', 'Bloom', 0)],
  // the dial says which way the strokes run (it was the Hatch Angle slider)
  hatch:         [sliderOf('cross', 'Cross-Hatching', 38),  // none → the darkest third (as it was) → everywhere
                  sliderOf('amt', 'Line Density', 100, { min:10, max:700, unit:'%' }),
                  // fresh cool grey to warm tarnished brown
                  sliderOf('form', 'Age', 30)],
  cards:         [sliderOf('amt', 'Cards in Play', 100, { min:20, max:300, unit:'%', base:16 }),
                  // dealt square (0) → the table swept about (90)
                  sliderOf('angle', 'Scatter', 20, { max:90, unit:'°' }),
                  // whether there is money on the table, and how much: none (0) → high stakes
                  sliderOf('form', 'Stakes', 50),
                  // what else is on the table: nothing (0) → a candle, a cup, a letter, a feather… crowding the edges
                  sliderOf('shape', 'Clutter', 40),
                  // the cards new (0) → dog-eared, torn, ringed, burnt, waxed, marked
                  sliderOf('hue', 'Wear', 30)],
  tessellate:    [sliderOf('zoom', 'Facet Size', 100, { min:50, max:400, unit:'%' }),
                  sliderOf('amt', 'Irregularity', 0, { max:240, unit:'%' })],
  // 🝊 Aurora: curtains of rays over Deep Field's stars (chains.js 'aurorasky')
  aurorasky:     [sliderOf('zoom', 'Curtain Height', 100, { min:40, max:180, unit:'%' }),
                  sliderOf('amt', 'Rays', 100, { min:20, max:250, unit:'%' }),
                  sliderOf('form', 'Curtains', 2, { min:1, max:5 }),
                  // oxygen's red, high up: rare and strong (100) → none (0)
                  sliderOf('shape', 'Red Sky', 30),
                  sliderOf('hue', 'Stars', 100, { min:20, max:300, unit:'%' }),
                  // where the curtains hang: low on the page (0) → high (100)
                  sliderOf('tilt', 'Horizon', 50)],
  // 🜚 Fractured Glaze, the second (chains.js 'crackle'): Spreading Cracks → Glaze
  crackle:       [sliderOf('zoom', 'Crack Scale', 100, { min:50, max:300, unit:'%' }),
                  sliderOf('amt', 'Cracks', 100, { min:20, max:400, unit:'%' }),
                  // everywhere at once (0) → bursting from one point of impact, where the dial points (100)
                  sliderOf('form', 'From One Point', 30),
                  sliderOf('shape', 'Wander', 40),
                  sliderOf('hue', 'Chipping', 0)],
  // 🝓 Circuit Board (chains.js 'circuit'): Charge powers more traces, from bare copper to colored, glowing and sparking
  circuit:       [sliderOf('amt', 'Traces', 55),
                  // square corners (Factorio's belts) → 45° chamfers (a board's)
                  sliderOf('zoom', 'Bends', 70),
                  sliderOf('form', 'Charge', 55, { ticks:[0,18,50,84], names:['Substrate','Color','Glow','Sparks'] }),
                  sliderOf('shape', 'Data Flow', 40),
                  sliderOf('hue', 'Components', 45),
                  sliderOf('tilt', 'Scale', 100, { min:40, max:300, unit:'%' }),
                  // (Ruby: slider 7) more of the board turns to the next era's parts, names and silkscreen
                  sliderOf('era', 'Era', 0, { ticks:[0,25,50,75,100], names:['Today','Future','Quantum','Atomic','Magitech'] }),
                  // stamps, codes and a little picture (the board's Easter eggs), in room the board left
                  sliderOf('marks', 'Markings', 0)],
  // 🝆 Veins of Light (chains.js 'veins')
  veins:         [sliderOf('material', 'Material', 0, { ticks:[8,25,42,58,75,92], names:['Seeded','Strata','Pebbles','Sand','Fibres','Skin'] }),
                  sliderOf('weave', 'Weave', 0, { ticks:[7,21,36,50,64,79,93], names:['Seeded','Tree + Loops','Relative','Gabriel','Slime','Streets','Subdivided'] }),
                  sliderOf('density', 'Density', 45),
                  sliderOf('loops', 'Loops', 50),
                  sliderOf('style', 'Organic ↔ Circuit', 65),
                  sliderOf('order', 'Hierarchy', 60),
                  sliderOf('glow', 'Glow', 65),
                  sliderOf('pulses', 'Pulses', 30)],
  // ⎐ Knotwork (chains.js 'knotwork')
  knotwork:      [sliderOf('zoom', 'Size', 100, { min:40, max:300, unit:'%' }),
                  sliderOf('amt', 'Strands', 6, { min:3, max:24 }),
                  // a plain plait (0) → a knot full of turns (100)
                  sliderOf('form', 'Breaks', 45),
                  sliderOf('shape', 'Shape', 0, { ticks:[0,17,34,50,67,84], names:['Circle','Square','Diamond','Cross','Quatrefoil','Whole Page'] }),
                  sliderOf('hue', 'Ribbon Width', 55, { min:20, max:90 }),
                  // slid along the dial's line (the dial also lights it)
                  sliderOf('tilt', 'Slide', 0, { min:-100 })],
  // 🜉 GENERATIVE: processes simulated, laid on a material, lit (stepsGenerative.js; chains.js)
  // (Ruby: the camera on a dial of its own, the light dial the light's alone, a slider for where the strike enters,
  //  depth, glow with a hue, and more materials than embers)
  lichtenberg:   [sliderOf('zoom', 'Reach', 50),
                  // bushy (high) → one thin strike (low)
                  sliderOf('amt', 'Branching', 50),
                  sliderOf('form', 'Poles', 2, { min:1, max:3, ticks:[1,2,3], names:['One Strike','Two Poles','Three Poles'] }),
                  sliderOf('shape', 'Material', 0, { ticks:[0,33,67,100], names:['Charred Wood','Slate','Brass','Acrylic'] }),
                  // where the strike enters (it was the light dial's angle)
                  sliderOf('angle', 'Strike Angle', 315, { max:360, unit:'°' }),
                  sliderOf('depth', 'Depth', 50),
                  sliderOf('width', 'Channel Width', 100, { min:30, max:300, unit:'%' }),
                  // the figure slid along the strike's line
                  sliderOf('slide', 'Slide', 0, { min:-100 })],
  growth:        [sliderOf('zoom', 'Growth', 55),
                  sliderOf('amt', 'Fold Size', 100, { min:50, max:250, unit:'%' }),
                  sliderOf('form', 'Seeds', 1, { min:1, max:7 }),
                  sliderOf('shape', 'Relief', 50),
                  sliderOf('hue', 'Zoom', 100, { min:50, max:400, unit:'%' }),
                  // slid along the sun's line (the dial turns it)
                  sliderOf('tilt', 'Slide', 0, { min:-100 })],
  // 🜛 BASICS: quiet grounds, each a chain of two or three parts (chains.js); every slider a plain 0–100
  plainnoise:    [sliderOf('zoom', 'Scale', 30),
                  sliderOf('amt', 'Detail', 50),
                  sliderOf('form', 'Contrast', 20)],
  stripes:       [sliderOf('zoom', 'Stripe Count', 20),
                  sliderOf('amt', 'Stripe Width', 50),
                  sliderOf('form', 'Softness', 20),
                  // 0 upright, 50 level (ruled lines), 100 upright again
                  sliderOf('shape', 'Angle', 50, { ticks:[0,25,50,75,100] })],
  polka:         [sliderOf('zoom', 'Spacing', 50),
                  sliderOf('amt', 'Dot Size', 45),
                  // in rows (0) → thrown about (100)
                  sliderOf('form', 'Scatter', 0)],
  checker:       [sliderOf('zoom', 'Squares', 20),
                  sliderOf('amt', 'Softness', 10),
                  sliderOf('form', 'Turn', 0, { ticks:[0,50,100] })],
  softgradient:  [sliderOf('angle', 'Angle', 90, { max:360, unit:'°' }),
                  sliderOf('amt', 'Roundness', 0),
                  sliderOf('form', 'Falloff', 50, { ticks:[50] })],
  cells:         [sliderOf('zoom', 'Cell Size', 40),
                  sliderOf('amt', 'Order', 20),
                  // round domes (0) → flat cells with crisp lines (100)
                  sliderOf('form', 'Lines', 50),
                  sliderOf('shape', 'Relief', 40)],
};
