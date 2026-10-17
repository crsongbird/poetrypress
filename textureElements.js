/**
 * textureElements.js — four readings of every texture, one per Primal
 * Archetype of Runology (Ruby's magic system, as Symbology carries it):
 *
 *   🜂 Fire   red chroma     flame, heat, conversion, a burst of energy
 *   🜄 Water  blue chroma    flow, cooling, dilution, the tide
 *   🜁 Wind   green chroma   weather, gale, motion, flight, things cut thin
 *   🜃 Earth  yellow chroma  stone, metal, gravity, the molten underneath
 *
 * Each texture's DEFAULT (its knobs, hues, blend and light as they have always
 * been) is one of the four — `def` names which; the other three are known-good
 * variations, chosen by rendering them and looking, to show how far one engine
 * can go: Sleep Haze as smoulder or sea-fret, Lotus Pond as a fire lotus, Night
 * City as a neon district. They are starting places, not answers.
 *
 * The four buttons under Surface Variant apply one the way ⚄ Randomize does:
 * every control it names is set unless that control is LOCKED, so a locked hue
 * keeps its colour while the knobs change, and two elements can be mixed.
 *
 * A variant names only what it changes:
 *   name   what it is called (shown when applied)
 *   k      the knobs, in order (p1, p2, …): every knob the texture has
 *   t      the hues, in order (Tint 1, Tint 2), as many as the texture uses
 *   t5     the fifth hue (Glow / Material / Snow Hue) where it matters
 *   blend  a blend mode from the texture's own list
 *   light  [direction°, distance 0–100 (past 100: lower, where allowed)]
 *   cam    [turn°, view 0–100, zoom %] for a texture with a camera dial
 * The default element carries only its name: applying it puts the texture's
 * own defaults back.
 *
 * test/textureElements.test.mjs holds every entry to the texture's own ranges,
 * blend list and hue count, and renders each one (none may come out blank).
 */
export const PRIMAL_ELEMENTS = [
  { id: 'fire',  glyph: '🜂', name: 'Fire',  chroma: 'red'    },
  { id: 'water', glyph: '🜄', name: 'Water', chroma: 'blue'   },
  { id: 'wind',  glyph: '🜁', name: 'Wind',  chroma: 'green'  },
  { id: 'earth', glyph: '🜃', name: 'Earth', chroma: 'yellow' },
];

export const TEXTURE_ELEMENTS = {
  aurorasky: { def: 'wind', wind: { name: 'Aurora' },
    fire:  { name: 'Red Aurora',      k: [160, 90, 1, 95, 80, 30],  light: [30, 100] },
    water: { name: 'Quiet Arc',       k: [70, 60, 1, 10, 160, 25],  light: [0, 40] },
    earth: { name: 'Corona Storm',    k: [180, 220, 5, 55, 60, 60], light: [200, 100] } },
  // k: Traces, Bends, Charge, Data Flow, Components, Scale
  circuit: { def: 'earth', earth: { name: 'Circuit Board' },
    fire:  { name: 'Overclocked',    k: [75, 70, 100, 80, 50, 100, 0, 0], t: ['#FF6A3D', '#FFE9A8'], light: [300, 100] },
    water: { name: 'Cold Storage',   k: [60, 90, 30, 25, 35, 70, 0, 0],   t: ['#6FA8FF', '#D8F0FF'] },
    wind:  { name: 'Factory Floor',  k: [85, 0, 70, 60, 25, 120, 0, 0],   t: ['#F2A83C', '#7CF29A'], light: [210, 100] } },
  veins: { def: 'earth', earth: { name: 'Veins of Light' },
    fire:  { name: 'Molten Seams',   k: [10, 80, 40, 85, 80, 0],   t: ['#4A3A34', '#FF7A2A'], light: [300, 100] },
    water: { name: 'Fibre Optics',   k: [70, 70, 70, 75, 100, 30], t: ['#2C3640', '#7AE0FF'] },
    wind:  { name: 'Mycelial Skin',  k: [90, 60, 30, 55, 120, -30], t: ['#C8A090', '#B6FF7A'] } },
  knotwork: { def: 'earth', earth: { name: 'Knotwork' },
    fire:  { name: 'Gilded Cross',    k: [120, 10, 60, 50, 50, 0],  t: ['#F2C25A', '#3A1206'], blend: 'hard-light', light: [300, 100] },
    water: { name: 'Endless Page',    k: [100, 12, 35, 84, 60, 0],  t: ['#D8ECFF', '#0E2440'], blend: 'overlay' },
    wind:  { name: 'Quatrefoil Seal', k: [90, 7, 70, 67, 65, 30],   t: ['#E8F2DC', '#22301A'], blend: 'soft-light' } },
  // 🝆 grown and generated
  lichtenberg: { def: 'earth', earth: { name: 'Lichtenberg Figures' },
    fire:  { name: 'Live Embers',     k: [70, 55, 2, 0, 300, 55, 110, 0],    t: ['#B88A5C', '#5A3820'], t5: '#FF6A1A', light: [300, 100], cam: [0, 0, 140] },
    water: { name: 'Acrylic Strike',  k: [75, 40, 1, 100, 330, 50, 100, -20], t: ['#B88A5C', '#5A3820'], light: [330, 100], cam: [0, 0, 120] },
    wind:  { name: 'Etched Brass',    k: [80, 60, 2, 67, 20, 65, 90, 0],     t: ['#E8C98A', '#5A4020'], t5: '#9FE0FF', light: [20, 100], cam: [30, 45, 115] } },
  growth: { def: 'earth', earth: { name: 'Ruffled Growth' },
    fire:  { name: 'Brain Coral',     k: [90, 130, 2, 70, 160, 20], t: ['#FFD2B8', '#5A1A12'], blend: 'overlay' },
    water: { name: 'Sea Lettuce',     k: [60, 220, 3, 45, 100, 0], t: ['#D8FFF0', '#0E3A3A'], blend: 'soft-light' },
    wind:  { name: 'Many Seeds',      k: [100, 90, 7, 40, 100, 0], t: ['#F2F6E8', '#26301F'], blend: 'overlay' } },
  // 🜛 the Basics
  plainnoise: { def: 'wind', wind: { name: 'Plain Noise' },
    fire:  { name: 'Smoulder',  k: [55, 80, 60], t: ['#FFC27A', '#3A0C06'], blend: 'overlay' },
    water: { name: 'Fog Bank',  k: [12, 30, 10], t: ['#DCEBFA', '#1E2E44'], blend: 'soft-light' },
    earth: { name: 'Sandstone', k: [80, 100, 45], t: ['#F0D9A8', '#5A3A1E'], blend: 'multiply' } },
  stripes: { def: 'earth', earth: { name: 'Stripes' },
    fire:  { name: 'Candy Stripe',  k: [12, 50, 6, 25],  t: ['#FFF2EC', '#C8283A'], blend: 'multiply' },
    water: { name: 'Sailor Stripe', k: [8, 60, 4, 50],   t: ['#F4F8FF', '#1F3F8A'], blend: 'multiply' },
    wind:  { name: 'Pinstripe',     k: [30, 92, 12, 0],  t: ['#F2F6EE', '#3E5A44'], blend: 'overlay' } },
  polka: { def: 'wind', wind: { name: 'Polka Dots' },
    fire:  { name: 'Cherry Dots',  k: [65, 55, 0],  t: ['#FFF4EE', '#C21E32'], blend: 'multiply' },
    water: { name: 'Bubbles',      k: [40, 35, 85], t: ['#EAF6FF', '#2C6FA8'], blend: 'overlay' },
    earth: { name: 'Mustard Seed', k: [15, 30, 40], t: ['#F7E9C0', '#8A6414'], blend: 'multiply' } },
  checker: { def: 'earth', earth: { name: 'Checkerboard' },
    fire:  { name: 'Gingham',        k: [30, 30, 0],   t: ['#FFF6F2', '#D2444A'], blend: 'multiply' },
    water: { name: 'Tilework',       k: [15, 4, 50],   t: ['#F2F8FC', '#2A5C8C'], blend: 'multiply' },
    wind:  { name: 'Garden Trellis', k: [35, 16, 50],  t: ['#EEF6E6', '#3F6A3A'], blend: 'overlay' } },
  softgradient: { def: 'water', water: { name: 'Gradient' },
    fire:  { name: 'Sunset Glow',  k: [90, 100, 70], t: ['#FFD08A', '#5A1020'], blend: 'soft-light' },
    wind:  { name: 'Morning Haze', k: [270, 30, 30], t: ['#F2FAEE', '#2E4A3A'], blend: 'soft-light' },
    earth: { name: 'Lamplight',    k: [90, 85, 40],  t: ['#FFE2A8', '#1E1408'], blend: 'overlay' } },
  cells: { def: 'earth', earth: { name: 'Cells' },
    fire:  { name: 'Lava Crust', k: [50, 30, 100, 70], t: ['#FFB25A', '#2A0604'], blend: 'hard-light', light: [300, 100] },
    water: { name: 'Sea Sponge', k: [20, 10, 0, 60],   t: ['#CFE8FF', '#0E2A44'], blend: 'overlay',    light: [330, 100] },
    wind:  { name: 'Leaf Veins', k: [15, 0, 85, 25],   t: ['#E6F4D8', '#24401E'], blend: 'soft-light', light: [315, 100] } },
  // ---- ♡ Whimsy ----
  clouds: { def: 'wind', wind: { name: 'Sleep Haze' },
    // the haze lit from below, coals under smoke
    fire:  { name: 'Smolder',    k: [70, 140, 75],  t: ['#FF9A4D', '#2A0606'], blend: 'screen',    light: [150, 90] },
    // sea-fret: lifted high, barely dragged, no dust
    water: { name: 'Sea Fret',    k: [160, 20, 0],   t: ['#CFE8F2', '#0A1C2E'], blend: 'screen',    light: [0, 30] },
    earth: { name: 'Dust Storm',  k: [110, 190, 100], t: ['#E8C27A', '#3B2A14'], blend: 'overlay',  light: [250, 100] } },
  bokeh: { def: 'water', water: { name: 'Dream Bloom' },
    fire:  { name: 'Lantern Festival', k: [160, 70, 50, 0, 40],   t: ['#FFB347', '#3A1205'], blend: 'screen' },
    wind:  { name: 'Dandelion Drift',  k: [60, 220, 25, 60, 20],  t: ['#E9FFE0', '#10251A'], blend: 'screen' },
    earth: { name: 'Gilded Hour',      k: [260, 50, 75, 100, 15], t: ['#F2C94C', '#2B1D0E'], blend: 'overlay' } },
  astral: { def: 'water', water: { name: 'Deep Field' },
    fire:  { name: 'Stellar Nursery', k: [140, 240, 40], t: ['#FFE2B0', '#FF4F3A'], t5: '#3A0A10', blend: 'screen' },
    wind:  { name: 'Aurora Field',    k: [220, 120, 70], t: ['#E8FFF4', '#3DDC97'], t5: '#06261A', blend: 'screen' },
    earth: { name: 'Dust Lanes',      k: [90, 260, 10],  t: ['#FFF1C9', '#E0A050'], t5: '#2A1A08', blend: 'screen' } },
  magicparticles: { def: 'wind', wind: { name: 'Pixie Dust' },
    fire:  { name: 'Sparkfall',       k: [80, 300, 85], t: ['#FFD27A', '#FF4A1C'], blend: 'screen' },
    water: { name: 'Bioluminescence', k: [60, 260, 25], t: ['#9BFFF1', '#1F6BFF'], blend: 'screen' },
    earth: { name: 'Gold Dust',       k: [40, 400, 10], t: ['#F6D365', '#8C5A1E'], blend: 'color-dodge' } },
  embers: { def: 'fire', fire: { name: 'Sparkler' },
    water: { name: 'Phosphor Tide',  k: [180, 420, 60],  t: ['#9FF6FF', '#2E7BFF'], blend: 'screen' },
    wind:  { name: 'Firefly Meadow', k: [300, 60, 30],  t: ['#E6FF8A', '#7BE36A'], blend: 'screen' },
    earth: { name: 'Forge Sparks',   k: [140, 500, 5],  t: ['#FFB000', '#FF5A00'], blend: 'lighten' } },
  snow: { def: 'water', water: { name: 'First Snow' },
    fire:  { name: 'Ash Rain', k: [200, 240, 30],  t5: '#FFB38A', blend: 'screen', light: [200, 100] },
    wind:  { name: 'Blizzard', k: [160, 260, 100], t5: '#F2FBFF', light: [90, 100] },
    earth: { name: 'Pollen',   k: [300, 70, 20],  t5: '#F2D46B', light: [120, 60] } },
  aurora: { def: 'wind', wind: { name: 'Silk Ribbons' },
    fire:  { name: 'Solar Flare',   k: [180, 400, 70], t: ['#FF6A3D', '#FFD36E'], blend: 'screen' },
    water: { name: 'Undertow',      k: [90, 1200, 30], t: ['#2FD5C9', '#1B3B8C'], blend: 'overlay' },
    earth: { name: 'Desert Mirage', k: [60, 200, 50],  t: ['#F2C46B', '#A8642A'], blend: 'overlay' } },
  moon: { def: 'water', water: { name: 'Fractal Moon' },
    fire:  { name: 'Blood Moon',    k: [130, 120, 15, 85], t: ['#FF8A5C', '#2A0505'] },
    wind:  { name: 'Moon in Cloud', k: [80, 80, 90, 50],   t: ['#E6F2EC', '#1A2420'] },
    earth: { name: 'Harvest Moon',  k: [150, 160, 10, 60], t: ['#FFD27F', '#2E1C08'] } },
  landscape: { def: 'earth', earth: { name: 'Painted Landscape' },
    fire:  { name: 'Volcanic Dusk', k: [120, 200, 20, 30, 0, 65], t: ['#FFA060', '#180303'] },
    water: { name: 'Misty Fjord',   k: [180, 90, 85, 10, 0, 25],  t: ['#CDE7F0', '#0E2A3A'] },
    wind:  { name: 'High Plains',   k: [80, 140, 20, 60, 85, 55],  t: ['#F4FFE0', '#12200E'] } },
  flowfield: { def: 'wind', wind: { name: 'Flow-Field Ink' },
    fire:  { name: 'Flame Tongues', k: [80, 160, 85],  t: ['#C2261B', '#F29A2E'], light: [0, 100] },
    water: { name: 'Current',       k: [160, 120, 25], t: ['#1D4E89', '#3FA7B5'], light: [90, 100] },
    earth: { name: 'Wood Grain',    k: [220, 260, 35], t: ['#5A3A1E', '#9C6B30'], light: [10, 100] } },
  suminagashi: { def: 'water', water: { name: 'Suminagashi' },
    fire:  { name: 'Vermilion Ink',   k: [80, 180, 55],  t: ['#B3261E', '#E8A33D'] },
    wind:  { name: 'Breath on Water', k: [130, 120, 95], t: ['#3E5C4A', '#9DB8A0'] },
    earth: { name: 'Agate Slice',     k: [60, 250, 15],  t: ['#6B4423', '#C08A3E'] } },

  // ---- √ Sharpness ----
  grain: { def: 'earth', earth: { name: 'Waking Grain' },
    fire:  { name: 'Film Burn',     k: [140, 200, 70], t: ['#FFC48A', '#4A0C06'], blend: 'overlay' },
    water: { name: 'Silver Halide', k: [160, 160, 20], t: ['#E8F6FF', '#0A1A2A'], blend: 'overlay' },
    wind:  { name: 'Sandblown',     k: [380, 150, 60], t: ['#F3F7E8', '#3A4430'], blend: 'soft-light' } },
  metalleaf: { def: 'earth', earth: { name: 'Scattered Polygons' },
    fire:  { name: 'Copper Foil',   k: [140, 200, 30, 100, 60], t: ['#E0703A'], blend: 'screen' },
    water: { name: 'Abalone',       k: [90, 220, 70, 90, 60],  t: ['#5CC8D6'], blend: 'screen' },
    wind:  { name: 'Silver Leaves', k: [220, 80, 100, 60, 10], t: ['#D8E6E0'], blend: 'overlay' } },
  flowers: { def: 'water', water: { name: 'Lotus Pond' },
    fire:  { name: 'Fire Lotus',        k: [120, 90, 80],  t: ['#E8452C', '#FFD23F'], t5: '#5A1408' },
    wind:  { name: 'White Lotus Drift', k: [90, 140, 20],  t: ['#F4F1EA', '#E8D27A'] },
    earth: { name: 'Golden Lotus',      k: [260, 25, 60],  t: ['#E8B04A', '#B5562A'] } },
  brushstrokes: { def: 'earth', earth: { name: "Painter's Frustration" },
    fire:  { name: 'Ember Strokes',  k: [140, 160, 20], t: ['#FFB067', '#5A0E08'], blend: 'overlay' },
    water: { name: 'Wet Ink',        k: [220, 90, 40],  t: ['#B8E4FF', '#041420'], blend: 'hard-light' },
    wind:  { name: 'Dry Brush Gale', k: [70, 240, 0],   t: ['#EEF5E6', '#26301F'], blend: 'overlay' } },
  halftone: { def: 'wind', wind: { name: 'Retro Dots' },
    fire:  { name: 'Pop Red',    k: [160, 180], t: ['#FFD6C2', '#C81E1E'], blend: 'hard-light' },
    water: { name: 'Cyan Print', k: [90, 120],  t: ['#E6FAFF', '#1C6FB0'], blend: 'multiply' },
    earth: { name: 'Newsprint',  k: [80, 140],  t: ['#EDE2C8', '#1E160C'], blend: 'multiply' } },
  rainstreaks: { def: 'water', water: { name: 'Harsh Rain' },
    // (the dial is where it comes from; Gusts swings it)
    fire:  { name: 'Meteor Shower', k: [300, 10], t: ['#FFD08A', '#3A0A04'], blend: 'screen',  light: [30, 100] },
    wind:  { name: 'Squall',        k: [160, 65], t: ['#EAF6F0', '#1A2A24'], blend: 'overlay', light: [320, 100] },
    earth: { name: 'Sand Rain',     k: [120, 25], t: ['#F2D090', '#2A1A08'], blend: 'overlay', light: [15, 100] } },
  hatch: { def: 'wind', wind: { name: 'Silverpoint Hatch' },
    // (the dial is the way the strokes run; the first slider, how much crosses)
    fire:  { name: 'Red Chalk',      k: [20, 180, 50], t: ['#FFD9C2', '#8C1E12'], blend: 'multiply', light: [50, 100] },
    water: { name: 'Blue Engraving', k: [75, 450, 10], t: ['#E3F2FF', '#1A3D73'], blend: 'multiply', light: [90, 100] },
    earth: { name: 'Ochre Hatching', k: [45, 260, 80], t: ['#D8C0A0', '#3A2008'], blend: 'multiply', light: [150, 100] } },
  cityscape: { def: 'water', water: { name: 'Night City' },
    fire:  { name: 'Neon District', k: [160, 280], t: ['#FF4FA3', '#3A0F2E'], t5: '#5A0A3A' },
    wind:  { name: 'Dawn Haze',     k: [80, 40],   t: ['#FFF4D6', '#A9C4C9'] },
    earth: { name: 'Foundry Town',  k: [120, 160], t: ['#FFB347', '#3A2E22'], t5: '#3A1A00' } },
  guilloche: { def: 'earth', earth: { name: 'Guilloché' },
    fire:  { name: 'Sunburst Seal', k: [160, 160, 85], t: ['#FFD27A', '#6A1206'], blend: 'hard-light' },
    water: { name: 'Banknote Blue', k: [100, 180, 30], t: ['#BFE6F0', '#0A2A4A'], blend: 'hard-light' },
    wind:  { name: 'Spirograph',    k: [70, 100, 60],  t: ['#F2FFF0', '#1E3A2A'], blend: 'hard-light' } },
  // Broken Glass: its knobs Shards, Size, Spread, Slivers, Caustics, Glints, Colored Glass, Shadows
  brokenglass: { def: 'earth', earth: { name: 'Broken Glass' },
    fire:  { name: 'Shattered Bottle', k: [50, 120, 35, 30, 85, 70, 90, 45],  t: ['#FFE2B0', '#1A0E00'], light: [200, 115] },
    water: { name: 'Cobalt Spill',     k: [35, 80, 75, 15, 70, 55, 100, 35], t: ['#DDEBFF', '#06122A'], light: [30, 45] },
    wind:  { name: 'Shards Underfoot', k: [75, 80, 70, 45, 60, 70, 15, 55],  t: ['#FFFFFF', '#000000'], cam: [20, 65, 100], light: [300, 100] } },
  // Under Glass: its knobs Reflection, Scratches, Swirl, Smudges, Dust & Spots, Cracks, Waviness, Edge
  underglass: { def: 'wind', wind: { name: 'Under Glass' },
    fire:  { name: 'Shattered Pane',     k: [45, 30, 15, 20, 25, 70, 25, 0],   t: ['#FFF0DC', '#000000'], light: [300, 70] },
    water: { name: 'Rain-Spotted Window', k: [55, 15, 10, 25, 100, 0, 55, 0],  t: ['#D4E8FF', '#000000'], light: [20, 60] },
    earth: { name: 'Old Shop Window',    k: [40, 75, 75, 70, 55, 0, 70, 60],  t: ['#FFF0D2', '#2A2418'], blend: 'hard-light', light: [135, 85] } },
  stainedglass: { def: 'water', water: { name: 'Stained Glass' },
    fire:  { name: 'Rose Window',      k: [70, 110, 70, 0, 34, 100],   t: ['#C8102E', '#1E3FA0'], light: [180, 80] },
    wind:  { name: 'Landscape Window', k: [80, 70, 10, 100, 75, 50],   t: ['#BFD8C8', '#E8EEE0'] },
    earth: { name: 'Seedy Amber',      k: [70, 160, 5, 0, 67, 0],      t: ['#B5651D', '#E3B04B'] } },

  // ---- ∆ Chaos ----
  sigils: { def: 'wind', wind: { name: 'Sigil Scatter' },
    fire:  { name: 'Branded',      k: [220, 120, 60], t: ['#FFC58A', '#6A0E06'], blend: 'overlay' },
    water: { name: 'Tide Marks',   k: [140, 220, 10], t: ['#CFF1FF', '#0A2A40'], blend: 'hard-light' },
    earth: { name: 'Carved Runes', k: [350, 40, 0],   t: ['#E8D5A8', '#3A2A14'], blend: 'hard-light' } },
  mathnoise: { def: 'wind', wind: { name: 'Binary Pattern' },
    fire:  { name: 'Overclock',     k: [200, 240], t: ['#FFB86B', '#4A0A00'], blend: 'hard-light' },
    water: { name: 'Deep Sea Data', k: [400, 240], t: ['#7FF0FF', '#00203A'], blend: 'hard-light' },
    earth: { name: 'Punch Cards',   k: [420, 160], t: ['#F0DDB0', '#3A2814'], blend: 'multiply' } },
  summoning: { def: 'wind', wind: { name: 'Transmutation Circle' },
    fire:  { name: 'Fire Seal',     k: [140, 260, 60], t: ['#FFB25B', '#5A0C04'] },
    water: { name: 'Lunar Circle',  k: [180, 120, 15], t: ['#BFE8FF', '#0C2440'] },
    earth: { name: 'Hermetic Seal', k: [110, 200, 95], t: ['#F2D58A', '#2E2410'] } },
  inkbleed: { def: 'water', water: { name: 'Rorschach Test' },
    fire:  { name: 'Bloodbloom', k: [160, 200, 60, 60], t: ['#3A0606', '#E0301E'] },
    wind:  { name: 'Moth Wing',  k: [120, 120, 20, 50], t: ['#3A4A3A', '#9FBF8A'] },
    earth: { name: 'Iron Oxide', k: [240, 160, 80, 70], t: ['#2A1A0E', '#B5651D'] } },
  crackedglaze: { def: 'earth', earth: { name: 'Fractured Glaze' },
    fire:  { name: 'Raku',        k: [140, 300, 60], t: ['#2A2422', '#C8642A'], t5: '#FF5A1E' },
    water: { name: 'Celadon',     k: [100, 500, 80], t: ['#9CC7B5', '#5C7A6E'] },
    wind:  { name: 'Ice Crackle', k: [260, 120, 20], t: ['#E8F2F6', '#9AB0BA'] } },
  crackle: { def: 'earth', earth: { name: 'Fractured Glaze' },
    fire:  { name: 'Raku Crackle',  k: [160, 140, 20, 70, 0],  t: ['#2A2422', '#C8642A'], t5: '#FF5A1E' },
    water: { name: 'Celadon Craze', k: [80, 260, 0, 30, 0],    t: ['#9CC7B5', '#5C7A6E'] },
    wind:  { name: 'Struck Ice',    k: [120, 120, 90, 20, 40], t: ['#E8F2F6', '#9AB0BA'], light: [20, 100] } },
  tessellate: { def: 'wind', wind: { name: 'Facet Field' },
    fire:  { name: 'Garnet Facets', k: [80, 120],  t: ['#FFD0B0', '#8C1A1A'], t5: '#3A0400' },
    water: { name: 'Ice Mosaic',    k: [200, 40],  t: ['#F0FAFF', '#3A7EA8'] },
    earth: { name: 'Pyrite',        k: [120, 220], t: ['#FFF2B0', '#8C7A2E'] } },
  cards: { def: 'wind', wind: { name: 'Cartomancy' },
    fire:  { name: 'Burning Deck', k: [160, 60, 100, 75, 70], t: ['#D9822B', '#8E1B1B'], blend: 'source-over' },
    water: { name: 'Tide-Spread',  k: [60, 8, 0, 30, 5],    t: ['#2E8A9A', '#2E4FA8'] },
    earth: { name: 'Old Tarot',    k: [120, 25, 30, 60, 75], t: ['#7A5A2E', '#4A6A2E'], blend: 'multiply' } },
  blackhole: { def: 'water', water: { name: 'Black Hole' },
    fire:  { name: 'Quasar',        k: [180, 260, 90], t: ['#FFD9A0', '#2A0602'], blend: 'screen' },
    wind:  { name: 'Event Horizon', k: [60, 30, 100],  t: ['#DFFFF0', '#03140C'], blend: 'screen' },
    earth: { name: 'Accretion',     k: [220, 200, 30], t: ['#F2C46B', '#1E1206'] } },
  turing: { def: 'water', water: { name: 'Turing Skin' },
    fire:  { name: 'Leopard',          k: [80, 80, 0, 40],   t: ['#F2B24A', '#3A1A06'] },
    wind:  { name: 'Fingerprint Maze', k: [70, 100, 50, 20], t: ['#F0F5EC', '#3A4A3A'] },
    earth: { name: 'Brain Coral',      k: [160, 90, 75, 85], t: ['#E2D2B0', '#5A4228'] } },
  chladni: { def: 'earth', earth: { name: 'Chladni Sand' },
    fire:  { name: 'Ember Plate',  k: [80, 160, 70],  t: ['#FFB25B', '#2A0A04'], blend: 'screen' },
    water: { name: 'Cymatics',     k: [60, 160, 90],  t: ['#9BE8FF', '#08203A'], blend: 'screen' },
    wind:  { name: 'Salt Figure',  k: [120, 90, 15],  t: ['#F4F8F0', '#2E3A30'] } },

  // ---- 🜚 Touch ----
  linen: { def: 'earth', earth: { name: 'Linen Tooth' },
    fire:  { name: 'Madder Red',      k: [140, 40, 25], t: ['#A8322A', '#FFE2C8'] },
    water: { name: 'Indigo Chambray', k: [90, 30, 75],  t: ['#2E4E7A', '#DDEBFF'], blend: 'hard-light' },
    wind:  { name: 'Muslin',          k: [220, 10, 0],  t: ['#C8D2BE', '#FFFFFF'] } },
  coldpress: { def: 'earth', earth: { name: 'Cold Press' },
    fire:  { name: 'Kiln-Dried', k: [180, 260, 80], t: ['#FFD0A0', '#3A0E04'], blend: 'overlay' },
    water: { name: 'Wet Rag',    k: [150, 160, 0],  t: ['#D8EEF8', '#0A2A3A'], blend: 'overlay' },
    wind:  { name: 'Hot Press',  k: [300, 40, 100], t: ['#F6F8F2', '#5A6450'] } },
  spangle: { def: 'earth', earth: { name: 'Metal Spangle' },
    fire:  { name: 'Bismuth',          k: [140, 30, 90, 80, 0],  t: ['#E8A0C8'] },
    water: { name: 'Galvanised Rain',  k: [80, 70, 0, 20, 40],   t: ['#B8D4E0'] },
    wind:  { name: 'Brushed Steel',    k: [220, 20, 0, 30, 100], t: ['#DDE2E6'] } },
  crystal: { def: 'wind', wind: { name: 'Crystal Leaf' },
    fire:  { name: 'Fire Opal',    k: [120, 60, 100, 20, 30], t: ['#FF8A4A', '#FFD23F'] },
    water: { name: 'Aquamarine',   k: [180, 95, 40, 10, 5],   t: ['#7FD6E0', '#2E8CA8'] },
    earth: { name: 'Smoky Quartz', k: [90, 40, 20, 70, 70],   t: ['#8C7460', '#3A2A1E'] } },
  oldpaper: { def: 'earth', earth: { name: 'Old Paper' },
    fire:  { name: 'Scorched Letter', k: [140, 20, 85, 40], t: ['#6A2A0E', '#2A1408'] },
    water: { name: 'Water-Stained',   k: [180, 10, 50, 70], t: ['#6A7A8A', '#3A5A5A'] },
    wind:  { name: 'Folded Map',      k: [100, 90, 15, 10], t: ['#9A8A60', '#7A8A6A'] } },
  cupring: { def: 'earth', earth: { name: 'Cup Ring' },
    fire:  { name: 'Red Wine',  k: [140, 80, 60],  t: ['#7A1A2A'] },
    water: { name: 'Ink Rings', k: [100, 220, 20], t: ['#2A4A6A'] },
    wind:  { name: 'Matcha',    k: [70, 260, 10],  t: ['#6A8A3A'] } },
  ash: { def: 'fire', fire: { name: 'Burnt Letter' },
    water: { name: 'Doused',          k: [160, 200, 95, 0],  t: ['#5A6A78', '#2A4A6A'] },
    wind:  { name: 'Ash on the Wind', k: [60, 380, 20, 10],  t: ['#E8E6E0', '#FF8A3A'] },
    earth: { name: 'Volcanic Fall',   k: [200, 300, 90, 50], t: ['#5A5450', '#FF3A0A'] } },
  // (Ruby: the white and yellow waxes read as bodily fluids; the readings now show the texture's range instead)
  wax: { def: 'fire', fire: { name: 'Poured Wax' },
    water: { name: 'Spilt Ink',     k: [110, 120, 5, 85, 25, 90],  t: ['#1E2C5A'] },
    wind:  { name: 'Paint Spatter', k: [70, 200, 20, 70, 40, 75],  t: ['#2F7A5A'] },
    earth: { name: 'Lacquer Seals', k: [160, 70, 85, 0, 85, 70],   t: ['#2A2018'] } },
  // (Dune Ripples, Moss on Stone and Scrying Pool: their camera the camera dial — cam: [turn, view, zoom], view their old Tilt)
  dunes: { def: 'earth', earth: { name: 'Dune Ripples' },
    fire:  { name: 'Red Desert',   k: [140, 70, 70], t: ['#C8582A', '#FFD0A0'], light: [250, 110], cam: [35, 60, 100] },
    water: { name: 'Tidal Flats',  k: [60, 30, 10],  t: ['#9AA8A0', '#E8F4F8'], light: [100, 80], cam: [0, 20, 100] },
    wind:  { name: 'Ripple Field', k: [40, 100, 15], t: ['#E8D8B8', '#FFFFFF'], light: [270, 120], cam: [0, 0, 160] } },
  kintsugi: { def: 'earth', earth: { name: 'Kintsugi' },
    fire:  { name: 'Red Lacquer',  k: [140, 160, 85], t: ['#8A1A14', '#E8C060'] },
    water: { name: 'Indigo Bowl',  k: [80, 260, 60],  t: ['#1E3A6A', '#D8DDE6'] },
    wind:  { name: 'Jade Mend',    k: [60, 80, 40],   t: ['#B8D4C0', '#C8A040'] } },
  moss: { def: 'earth', earth: { name: 'Moss on Stone' },
    fire:  { name: 'Lichen on Basalt', k: [120, 35, 0],  t: ['#3A3634', '#D88A2A'], cam: [0, 30, 100] },
    water: { name: 'Riverbed',         k: [70, 70, 100], t: ['#6A7A80', '#3A6A3A'], cam: [0, 15, 100] },
    wind:  { name: 'Highland Cairn',   k: [200, 20, 10], t: ['#A8A89A', '#9AAA5A'], cam: [20, 60, 100] } },
  water: { def: 'water', water: { name: 'Scrying Pool' },
    fire:  { name: 'Molten Pool',    k: [80, 60, 50, 30, 0],  t: ['#FFC27A', '#5A0A04'], blend: 'hard-light', cam: [0, 40, 100] },
    wind:  { name: 'Windswept Lake', k: [160, 90, 20, 30, 0], t: ['#E6F5EE', '#1E3A30'], cam: [300, 60, 100] },
    earth: { name: 'Bog Water',      k: [120, 15, 80, 40, 80], t: ['#B8A870', '#141008'], blend: 'overlay', cam: [0, 20, 100] } },
  // (its knobs Band Width, Landforms, Seas, Cities, Atmosphere, Builders (40 Engineers, 80 Magi, 100 Ruins), Altitude, Traffic;
  //  its light the day: [which way dusk comes, how far from noon])
  ringworld: { def: 'wind', wind: { name: 'Ringworld' },
    fire:  { name: 'Burning Arch', k: [55, 70, 25, 40, 70, 40, 40, 70],  t: ['#B8643A', '#E8885A'], cam: [40, 55, 100], light: [90, 100] },
    water: { name: 'Ocean Ring',   k: [65, 40, 75, 45, 60, 80, 55, 35],  t: ['#5E8F6A', '#7FB4E6'], cam: [330, 50, 84], light: [90, 30] },
    earth: { name: 'Iron Desert',  k: [40, 80, 5, 60, 30, 100, 30, 10],  t: ['#C8925A', '#D9B48A'], cam: [15, 48, 110], light: [270, 16] } },
  // Dewy Webs: its knobs Webs, Size, Dew, Drop Size, Torn, Sag, Iridescence, Threads
  dewwebs: { def: 'water', water: { name: 'Dewy Webs' },
    fire:  { name: 'Golden Hour Web', k: [20, 150, 55, 110, 10, 40, 75, 50], t: ['#FFD9A0', '#2A1600'], blend: 'screen', light: [250, 115] },
    wind:  { name: 'Gale-Torn Silk',  k: [45, 100, 40, 90, 85, 80, 45, 40],  t: ['#E8F4FF', '#0A1622'], light: [320, 80] },
    earth: { name: 'Cellar Webs',     k: [85, 70, 8, 70, 60, 65, 25, 80],   t: ['#F0E8D8', '#1A140C'], blend: 'hard-light', light: [135, 70] } },
  rainwater: { def: 'water', water: { name: 'Rain on Water' },
    fire:  { name: 'Lantern Pond',   k: [120, 35, 70, 60, 70], t: ['#1A0E08', '#F2A24A'], light: [200, 60] },
    wind:  { name: 'Downpour',       k: [70, 95, 25, 90, 40], t: ['#141C22', '#C9D4DC'], light: [320, 100] },
    earth: { name: 'Last Drops',     k: [160, 12, 95, 15, 10], t: ['#0A1410', '#6E8A70'], light: [300, 80] } },
  glassrain: { def: 'water', water: { name: 'Rain on Glass' },
    fire:  { name: 'Steam',       k: [60, 60, 100], blend: 'screen' },
    wind:  { name: 'Driven Rain', k: [70, 280, 10], light: [60, 100] },
    earth: { name: 'Heavy Drops', k: [260, 80, 20] } },
  frost: { def: 'water', water: { name: 'Hoarfrost' },
    fire:  { name: 'Fire and Ice',   k: [140, 120, 80, 10], t: ['#FFB38A'], t5: '#5A1A0A' },
    wind:  { name: 'Rime Gale',      k: [70, 180, 20, 90],  t: ['#E8FFF4'] },
    earth: { name: 'Frost on Slate', k: [200, 160, 95, 50], t: ['#D8D0C0'] } },
  contour: { def: 'earth', earth: { name: 'Contour Map' },
    fire:  { name: 'Lava Field',  k: [80, 160, 70], t: ['#FFC07A', '#5A0E04'], blend: 'hard-light' },
    water: { name: 'Bathymetry',  k: [160, 120, 30], t: ['#CDEBF5', '#0A2A4A'] },
    wind:  { name: 'Isobars',     k: [260, 140, 0], t: ['#F0F8F0', '#2A4A3A'] } },
  watercolour: { def: 'water', water: { name: 'Watercolor Wash' },
    fire:  { name: 'Sunset Wash',  k: [160, 160, 70], t: ['#E8502A', '#F2B63D'], light: [180, 80] },
    wind:  { name: 'Sage Sketch',  k: [70, 70, 15],   t: ['#7A9A6A', '#B8C8A0'] },
    earth: { name: 'Umber Study',  k: [120, 220, 30], t: ['#8A5A2A', '#4A3A2A'] } },

  // ---- 🜉 The Athanor: its knobs mean whatever the graph makes them ----
  athanor: { def: 'earth', earth: { name: 'As Made' },
    fire:  { name: 'Calcined', k: [85, 85, 85, 85, 85, 85, 50, 50], t: ['#FFD08A', '#5A0E08'] },
    water: { name: 'Dissolved', k: [25, 40, 25, 40, 25, 40, 50, 50], t: ['#CFF0FF', '#0A2440'] },
    wind:  { name: 'Sublimed',   k: [60, 15, 60, 15, 60, 15, 50, 50], t: ['#F0FFF4', '#2E4A3A'] } },
};

/** A texture's four readings, in button order (🜂 🜄 🜁 🜃): each its
 *  variant's own fields (name, k, t, …) with `el` (fire…), `glyph`, `element`
 *  (Fire…), `chroma`, and `isDefault`. */
export function elementsFor(type){
  const E = TEXTURE_ELEMENTS[type]; if(!E) return [];
  return PRIMAL_ELEMENTS.filter(el => E[el.id]).map(el => ({ ...E[el.id], el: el.id, glyph: el.glyph, element: el.name, chroma: el.chroma, isDefault: E.def === el.id }));
}
