/**
 * textureGenerators.js — the texture system's tables, cache and dispatch.
 *
 * The generators themselves live by element:
 *   texWhimsy.js     ♡  clouds, bokeh, deep field, euphoria dust, burning mana,
 *                       first snow, aurora
 *   texSharpness.js  √  lotus, 90s dots, still rain, painter's frustration,
 *                       silverpoint hatch, metal leaf, waking grain
 *   texChaos.js      ∆  sigils, enochian noise, summoning circles, Rorschach,
 *                       fractured glaze, facet field, cartomancy
 *   texTouch.js      🜚  linen, cold press, old paper, cup ring,
 *                       poured wax, raked substrate
 *   texCore.js          noise grids, colour mixing, the seeded random source
 *
 * What stays here:
 *   TEXTURE_PARAMS    the two named knobs each texture exposes
 *   TEXTURE_CAPS      which blend modes, light and tints each can use
 *   getTextureCanvas  THE public entry point: builds (or recalls) a texture
 *                     at a size, seed and knob setting, as an offscreen canvas
 *
 * Generation is deterministic: withSeed swaps Math.random for a seeded source
 * for the length of one build, so every generator can call Math.random()
 * normally and the same seed always draws the same texture. The cache key
 * includes everything that changes the output.
 *
 * A NOTE ON COLOR-BURN (the Rorschach): color-burn only clamps to true black
 * when the SOURCE pixel is genuinely near 0 — "dark" (say 60/255) reads as a
 * barely-visible midtone however high the opacity goes. Any texture blended
 * through color-burn needs its darkest values pushed close to 0. This bit
 * twice before it stuck.
 */

import { TEXTURES } from './tunables.js';
import { withSeed, withScale, withLightTilt, scaleNow, blendFamily, pixelPass, CPU, materialOf, noMaterialHue, parseHex, resolveAlpha } from './texCore.js';
import { genClouds, genAstralFog, genAstralStars, genBokeh, genEmbers, genSnow, genMagicParticles, genAuroraVeil, genMoon, genLandscape } from './texWhimsy.js';
import { genFlowers, genHalftone, genRainStreaks, genBrushstrokes, genSilverpointHatch, genMetalLeaf, genCityscape, genGrain } from './texSharpness.js';
import { genSigils, genMathNoise, genSummoningCircles, genInkBleed, genCrackedGlaze, genTessellate, genCartomanticDrift, genBlackHole } from './texChaos.js';
import { genLinenTooth, genColdPress, genOldPaper, genCupRing, genPouredWax, genDunes, genKintsugi, genMoss, genGlassRain, genWater, genSpangle, genCrystalLeaf } from './texTouch.js';

/**
 * TEXTURE_PARAMS — the two knobs each texture exposes, in order.
 *
 * A param whose key is 'zoom' is handled generically by getTextureCanvas:
 * the texture is generated at reduced dimensions and scaled back up, which
 * magnifies the pattern without any generator needing to know about it.
 * Every other param arrives at the generator as `amt`, a plain multiplier
 * around 1.0 that each one applies to whatever its dominant quantity is.
 */
export const TEXTURE_PARAMS = {
  clouds:        [{key:'zoom',  label:'Lift',            min:40, max:250, def:100, unit:'%'},
                  {key:'amt',   label:'Drag',            min:0,  max:200, def:60,  unit:'%'},
                  // a shaft of light from the dial: the smoke in it glows, dust motes catch it
                  {key:'form',  label:'Dust',            min:0,  max:100, def:35,  unit:''}],
  bokeh:         [{key:'zoom',  label:'Focal Plane',     min:25, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Orb Count',       min:20, max:260, def:100, unit:'%', base:67},
                  // a camera's aperture: round, then 7, 6 and 5 blades, then a heart
                  {key:'form',  label:'Aperture',        min:0,  max:100, def:0,   unit:'', ticks:[0,25,50,75,100],
                   names:['Round','7 Blades','6 Blades','5 Blades','Heart']},
                  // what the motes ARE: dot (as before), petal, leaf, star, snowflake,
                  // droplet, crescent, flower — and a die to pick one at random
                  {key:'shape', label:'Object Shape',    min:0,  max:100, def:0,   unit:'', ticks:[0,14,29,43,57,71,86,100],
                   names:['Dot','Petal','Leaf','Star','Snowflake','Droplet','Crescent','Flower'], dice:true},
                  // each mote's hue, rotated at random within this spread around Light Hue
                  {key:'hue',   label:'Color Variation', min:0,  max:180, def:0,   unit:'°'}],
  astral:        [{key:'stars', label:'Star Density',    min:10, max:300, def:100, unit:'%'},
                  {key:'fog',   label:'Nebula Density',  min:0,  max:260, def:100, unit:'%'},
                  // 0 is deep space; up the scale, twinkle, colour fringes, airglow
                  {key:'form',  label:'Atmosphere',      min:0,  max:100, def:20,  unit:''}],
  magicparticles:[{key:'zoom',  label:'Sparkle Size',    min:20, max:200, def:100, unit:'%'},
                  {key:'amt',   label:'Sparkle Count',   min:10, max:400, def:100, unit:'%', base:225},
                  // trails (0) → scattered, as it was (50) → bursts (100)
                  {key:'form',  label:'Chaos',           min:0,  max:100, def:50,  unit:'', ticks:[0,50,100]}],
  embers:        [{key:'zoom',  label:'Ember Size',      min:60, max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Ember Count',     min:20, max:500, def:100, unit:'%', base:590},
                  // how far each spark's colour may stray from its ember hue
                  {key:'form',  label:'Hue Drift',       min:0,  max:100, def:10,  unit:''}],
  snow:          [{key:'zoom',  label:'Flake Size',      min:60, max:340, def:100, unit:'%'},
                  {key:'amt',   label:'Snowfall',        min:20, max:260, def:100, unit:'%', base:2950},
                  // still air at 0; the dial says where the wind blows from
                  {key:'form',  label:'Wind',            min:0,  max:100, def:0,   unit:''}],
  grain:         [{key:'zoom',  label:'Grain Size',      min:100,max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Contrast',        min:30, max:240, def:100, unit:'%'},
                  // the kind of grain, blended between neighbours; Film is the original
                  {key:'form',  label:'Grain',           min:0,  max:100, def:33,  unit:'', ticks:[0,33,66,100],
                   names:['Silver','Film','Paper','Digital']}],
  metalleaf:     [{key:'zoom',  label:'Leaf Size',       min:60, max:360, def:100, unit:'%'},
                  {key:'amt',   label:'Coverage',        min:20, max:260, def:100, unit:'%', base:165},
                  // the original flakes (0) → shards, slivers, squares of leaf, curled shavings
                  {key:'form',  label:'Shape',           min:0,  max:100, def:0,   unit:''},
                  // flat, as it always was (0) → each flake tilting to the dial's light, a band of reflection inside
                  {key:'shape', label:'Sheen',           min:0,  max:100, def:0,   unit:''},
                  // soft speckled, noisy highlights over the flakes (0: none)
                  {key:'hue',   label:'Glitter',         min:0,  max:100, def:0,   unit:''}],
  flowers:       [{key:'zoom',  label:'Bloom Size',      min:50, max:450, def:150, unit:'%'},
                  {key:'amt',   label:'Bloom Count',     min:10, max:300, def:60,  unit:'%', base:18},
                  // the third, unusual knob: which flower. 50 is the lotus
                  // ticks at the seven species: bud, cherry, lily, lotus, daisy, rosette, hydrangea
                  {key:'form',  label:'Form',            min:0,  max:100, def:50,  unit:'', ticks:[0,25,38,50,65,82,100]}],
  brushstrokes:  [{key:'zoom',  label:'Stroke Width',    min:60, max:380, def:100, unit:'%'},
                  {key:'amt',   label:'Stroke Count',    min:20, max:260, def:100, unit:'%', base:111},
                  // dry (as before) → wet: mixing, levelled bristles, bleeding edges, drips
                  {key:'form',  label:'Wetness',         min:0,  max:100, def:0,   unit:''}],
  halftone:      [{key:'zoom',  label:'Dot Scale',       min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Dot Weight',      min:30, max:240, def:100, unit:'%'}],
  glassrain:     [{key:'zoom',  label:'Drop Size',       min:40, max:300, def:100, unit:'%'},
                  {key:'amt',   label:'Rain',            min:20, max:300, def:100, unit:'%'},
                  // a fine mist of tiny droplets between the drops
                  {key:'form',  label:'Condensation',    min:0,  max:100, def:30,  unit:''}],
  rainstreaks:   [{key:'zoom',  label:'Rain Zoom',       min:100,max:500, def:100, unit:'%'},
                  {key:'angle', label:'Slant',           min:-45,max:45,  def:0,   unit:'°'}],
  sigils:        [{key:'zoom',  label:'Sigil Zoom',      min:100,max:500, def:100, unit:'%'},
                  {key:'amt',   label:'Sigil Count',     min:15, max:260, def:100, unit:'%', base:51},
                  // the hand: steady → trembling, the nib skipping into scratches
                  {key:'form',  label:'Chaos',           min:0,  max:100, def:20,  unit:''}],
  mathnoise:     [{key:'zoom',  label:'Glyph Zoom',      min:100,max:500, def:140, unit:'%'},
                  {key:'amt',   label:'Emergence',       min:30, max:240, def:130, unit:'%'}],
  summoning:     [{key:'zoom',  label:'Circle Size',     min:40, max:200, def:100, unit:'%'},
                  // how many bands, polygrams and planets the one circle is built from
                  {key:'amt',   label:'Complexity',      min:20, max:300, def:100, unit:'%'},
                  // drawn by hand, vines and moons (0) → machined, gauges and circuits, glowing (100)
                  {key:'form',  label:'Organic ↔ Tech',  min:0,  max:100, def:30,  unit:''}],
  inkbleed:      [{key:'zoom',  label:'Blot Scale',      min:60, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Spread',          min:30, max:240, def:100, unit:'%'},
                  // crisp and solid (0) → wet: pooled rims, pale mottled middles, wicking, drips, splatter
                  {key:'form',  label:'Wetness',         min:0,  max:100, def:50,  unit:''},
                  // black ink alone (0) → red joins it → whole pastel figures (100); the seed decides within it
                  {key:'shape', label:'Color',           min:0,  max:100, def:35,  unit:''}],
  crackedglaze:  [{key:'zoom',  label:'Fracture Scale',  min:60, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Crack Density',   min:10, max:900, def:100, unit:'%', base:26},
                  // how far the glaze has gone: crazed only → blistered → chipped → peeling to the body
                  {key:'form',  label:'Enameling',       min:0,  max:100, def:0,   unit:'', ticks:[0,33,66,100], names:['Unbroken','Bubbled','Chipped','Peeling']}],
  linen:         [{key:'zoom',  label:'Weave Scale',     min:50, max:400, def:100, unit:'%'},
                  // stitching → slubs → buttons → rivets
                  {key:'amt',   label:'Details',         min:0,  max:100, def:42,  unit:'', ticks:[15,42,68,95]},
                  // silk → twill → linen → canvas → burlap
                  {key:'form',  label:'Weave',           min:0,  max:100, def:50,  unit:'', ticks:[0,25,50,75,100]}],
  oldpaper:      [{key:'zoom',  label:'Scale',           min:40, max:400, def:100, unit:'%'},
                  // folds across the sheet; past three-quarters they tear
                  {key:'amt',   label:'Folds',           min:0,  max:100, def:35,  unit:''},
                  // clean → yellowed → foxed → mildewed → scorched
                  {key:'form',  label:'Age',             min:0,  max:100, def:30,  unit:'', ticks:[0,30,60,90], names:['Clean','Foxed','Mildewed','Scorched']},
                  // the gentle unevenness of once-damp paper, and pocket creases
                  {key:'shape', label:'Crinkle',         min:0,  max:100, def:25,  unit:''}],
  crystal:   [{key:'zoom',  label:'Facet Size',      min:40, max:300, def:100, unit:'%'},
                  // milky and veiled (0) → clear and deep (100)
                  {key:'amt',   label:'Clarity',         min:0,  max:100, def:70,  unit:''},
                  // light caught inside: flashing internal planes, split into colours
                  {key:'form',  label:'Fire',            min:0,  max:100, def:50,  unit:''},
                  // ghost crystals inside, the faces it had as it grew
                  {key:'shape', label:'Phantoms',        min:0,  max:100, def:30,  unit:''},
                  // rutile needles and tiny bubbles
                  {key:'hue',   label:'Inclusions',      min:0,  max:100, def:20,  unit:''}],
  spangle:       [{key:'zoom',  label:'Crystal Size',    min:40, max:300, def:100, unit:'%'},
                  // feathered six-armed growth inside each grain (zinc spangle)
                  {key:'amt',   label:'Dendrites',       min:0,  max:100, def:50,  unit:''},
                  // flat facets → stepped hopper crystals (bismuth)
                  {key:'form',  label:'Terraces',        min:0,  max:100, def:0,   unit:''},
                  // orderly as a snowflake (0) → every crystal its own
                  {key:'shape', label:'Variation',       min:0,  max:100, def:40,  unit:''},
                  // fine lines brushed across the light, like brushed steel
                  {key:'hue',   label:'Brushing',        min:0,  max:100, def:0,   unit:''}],
  coldpress:     [{key:'zoom',  label:'Tooth Scale',     min:75, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Tooth Depth',     min:20, max:300, def:100, unit:'%'},
                  // how the paper was made: pressed hot and smooth, cold, or left rough
                  {key:'form',  label:'Press',           min:0,  max:100, def:50,  unit:'', ticks:[0,50,100], names:['Hot Press','Cold Press','Rough']}],
  cupring:       [{key:'zoom',  label:'Ring Size',       min:40, max:320, def:100, unit:'%'},
                  {key:'amt',   label:'Ring Count',      min:30, max:300, def:100, unit:'%', base:2},
                  // drips, and the faint wash inside the ring
                  {key:'form',  label:'Spill',           min:0,  max:100, def:35,  unit:''}],
  wax:           [{key:'zoom',  label:'Pool Size',       min:40, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Pool Count',      min:25, max:300, def:100, unit:'%', base:3},
                  // thin and spreading → thick and lumpy
                  {key:'form',  label:'Viscosity',       min:0,  max:100, def:45,  unit:''}],
  dunes:         [{key:'zoom',  label:'Ripple Size',     min:40, max:300, def:100, unit:'%'},
                  {key:'amt',   label:'Wind',            min:0,  max:100, def:50,  unit:''},
                  {key:'form',  label:'Dune Height',     min:0,  max:100, def:40,  unit:''},
                  // the camera: straight down (0, a flat texture) → tipped toward the horizon, the far dunes hazy
                  {key:'tilt',  label:'Tilt',            min:0,  max:100, def:40,  unit:''}],
  kintsugi:      [{key:'zoom',  label:'Seam Width',      min:50, max:300, def:100, unit:'%'},
                  {key:'amt',   label:'Fractures',       min:20, max:400, def:100, unit:'%'},
                  {key:'form',  label:'Gloss',           min:0,  max:100, def:70,  unit:''}],
  moss:          [{key:'zoom',  label:'Stone Scale',     min:40, max:300, def:100, unit:'%'},
                  {key:'amt',   label:'Moss',            min:0,  max:100, def:45,  unit:''},
                  {key:'form',  label:'Dampness',        min:0,  max:100, def:30,  unit:''},
                  // the camera: straight down (0) → tipped, the far stone in haze
                  {key:'tilt',  label:'Tilt',            min:0,  max:100, def:30,  unit:''}],
  landscape:     [{key:'zoom',  label:'Distance',        min:60, max:200, def:100, unit:'%'},
                  {key:'amt',   label:'Ridges',          min:20, max:250, def:100, unit:'%'},
                  // dry, worked paint (as before) → watercolour: bleeding edges, blooms
                  {key:'form',  label:'Wetness',         min:0,  max:100, def:0,   unit:''},
                  // the camera's pitch: as painted (0) → looking down from higher: the horizon rises, the near ground grows
                  {key:'tilt',  label:'Tilt',            min:0,  max:100, def:0,   unit:''}],
  cityscape:     [{key:'zoom',  label:'Skyline Height',  min:60, max:180, def:100, unit:'%'},
                  {key:'amt',   label:'Lit Windows',     min:0,  max:300, def:100, unit:'%'}],
  blackhole:     [{key:'zoom',  label:'Chaos',           min:40, max:250, def:100, unit:'%'},
                  {key:'amt',   label:'Particles',       min:10, max:300, def:100, unit:'%'},
                  // twin plasma jets along the spin axis (0: none, as before)
                  {key:'form',  label:'Jets',            min:0,  max:100, def:0,   unit:''}],
  water:         [{key:'zoom',  label:'Wave Scale',      min:40, max:250, def:100, unit:'%'},
                  // long calm swells (0) → short choppy wind waves (100)
                  {key:'amt',   label:'Turbulence',      min:0,  max:100, def:35,  unit:''},
                  // shallow: a fine sharp net; deep: it swells, blurs and fades
                  {key:'form',  label:'Depth',           min:0,  max:100, def:35,  unit:''},
                  // milky water, scattering the light
                  {key:'shape', label:'Haze',            min:0,  max:100, def:10,  unit:''},
                  // dirty water: light absorbed, silt hanging in it
                  {key:'hue',   label:'Murk',            min:0,  max:100, def:0,   unit:''},
                  // the camera: straight down (0) → tipped toward the far bank; the far water mirrors the sky
                  {key:'tilt',  label:'Tilt',            min:0,  max:100, def:35,  unit:''}],
  moon:          [{key:'zoom',  label:'Moon Size',       min:60, max:150, def:100, unit:'%'},
                  {key:'amt',   label:'Fractal Depth',   min:20, max:190, def:100, unit:'%'},
                  // banks drifting in front of the moon and stars, silver-lined, a halo in their veils (0: none)
                  {key:'form',  label:'Clouds',          min:0,  max:100, def:30,  unit:''},
                  // the night around it: stars, the Milky Way, earthshine on the dark side (0: the page, as before)
                  {key:'shape', label:'Night Sky',       min:0,  max:100, def:70,  unit:''}],
  aurora:        [{key:'zoom',  label:'Curtain Height',  min:40, max:220, def:100, unit:'%', base:100, absUnit:'%'},
                  {key:'amt',   label:'Ribbon Count',    min:20, max:1800, def:100, unit:'%', base:9, absUnit:''},
                  // a noisy glow spilling from the brightest light (0: none, as before)
                  {key:'form',  label:'Bloom',           min:0,  max:100, def:0,   unit:''}],
  hatch:         [{key:'angle', label:'Hatch Angle',     min:-90,max:90,  def:35,  unit:'°'},
                  {key:'amt',   label:'Line Density',    min:10, max:700, def:100, unit:'%'},
                  // fresh cool grey to warm tarnished brown
                  {key:'form',  label:'Age',             min:0,  max:100, def:30,  unit:''}],
  cards:         [{key:'amt',   label:'Card Count',      min:20, max:400, def:100, unit:'%', base:16},
                  // dealt in neat rows (0) → drifting, turned, reversed, some torn (90)
                  {key:'angle', label:'Scatter',         min:0,  max:90,  def:35,  unit:'°'}],
  tessellate:    [{key:'zoom',  label:'Facet Size',      min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Irregularity',    min:0,  max:240, def:0,   unit:'%'}],
};

/**
 * TEXTURE_CAPS — what tools each texture can actually use.
 *
 * This is what lets the UI grey out controls instead of offering knobs that
 * do nothing. `blends` is the list of composite modes that make sense for a
 * texture (the first is its default); `light` says whether it reads as
 * relief and therefore responds to a light direction; `tints` is how many
 * colours it accepts, with `tintLabels` naming them in the texture's own
 * terms rather than "colour 1".
 *
 * Only textures that genuinely consume a colour declare tints. The rest are
 * monochrome by construction and take their colour from the blend against
 * the page, which is why their tint controls are disabled rather than
 * silently ignored.
 */
export const TEXTURE_CAPS = {
  // — whimsy —
  clouds:        { blends:['screen','overlay','soft-light','hard-light','multiply','color-burn','darken','color-dodge','lighten'], material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  bokeh:         { blends:['screen','overlay','soft-light','hard-light','multiply','color-burn','darken','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  astral:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Star Hue','Nebula Hue'], tintDefaults:['accent1','accent2'] },
  magicparticles:{ blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Sparkle Hue','Glow Hue'], tintDefaults:['accent1','accent2'] },
  embers:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Ember Hue','Spark Hue'], tintDefaults:['accent1','accent2'] },
  // the dial is the WIND here, not a light (dial: its name for this texture)
  snow:          { blends:['lighten','screen','overlay','soft-light'],  light:true, dial:'Wind Direction', tints:0 },
  landscape:     { blends:['hard-light','overlay','soft-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  cityscape:     { blends:['hard-light','overlay','soft-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2,
                   tintLabels:['Window Hue','Water Hue'], tintDefaults:['#FFE3A8','#2E4F6E'] },
  blackhole:     { blends:['hard-light','screen','overlay','soft-light','multiply','color-burn','darken','color-dodge','lighten'], ground:'grey', light:true, dial:'View', tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // water is tinted by the page itself: neutral by default, like all of Touch
  water:         { blends:['soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  moon:          { blends:['hard-light','multiply','overlay','soft-light','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // Remapped for every blend EXCEPT screen: its grey ground under screen
  // lightens the page a little, and that is part of how the favourite looks.
  aurora:        { blends:['screen','overlay','soft-light','hard-light','multiply','color-burn','darken','color-dodge','lighten'],
                   // the dial is the direction the two hues blend in, not a light
                   ground:'grey', keepGround:['screen'], light:true, dial:'Blend Direction', tints:2,
                   tintLabels:['Curtain Hue','Hem Hue'], tintDefaults:['accent1','accent1'] },
  // — sharpness —
  grain:         { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // Scattered Polygons (genMetalLeaf): flat flakes as ever; the dial lights them only when Sheen is up
  metalleaf:     { blends:['color-dodge','overlay','soft-light','hard-light','multiply','color-burn','darken','screen','lighten'], ground:'grey', light:true, tints:1,
                   tintLabels:['Leaf Hue'], tintDefaults:['#E0B38D'] },
  // real colour on a transparent ground: Normal shows the flowers as painted
  flowers:       { blends:['source-over','hard-light','overlay','soft-light','multiply','screen','lighten','darken','color-dodge','color-burn'],
                   light:true, tints:2, tintLabels:['Petal Hue','Heart Hue'], tintDefaults:['#E8739E','#F2B33D'] },
  // impasto: the paint's thickness lit by the dial (genBrushstrokes)
  brushstrokes:  { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  halftone:      { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // glass in front of the page: transparent, the drops showing the outdoors
  // made from the page's own colours (pageEnv), so Normal is its default
  glassrain:     { blends:['source-over','screen','overlay','soft-light','hard-light','lighten','multiply'], material:true, light:true, tints:0, pageEnv:true },
  rainstreaks:   { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey',  light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  hatch:         { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // — chaos —
  sigils:        { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  mathnoise:     { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  summoning:     { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:true, dial:'Position', lightTilt:0, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // ink on clear paper (genInkBleed): its own colours, Ink and Accent
  inkbleed:      { blends:['multiply','source-over','darken','color-burn','overlay','soft-light','hard-light'], light:false, tints:2,
                   tintLabels:['Ink Hue','Accent Hue'], tintDefaults:['#141414','#B0283A'] },
  // a painted glaze over a clay body, coloured as a game engine would (see genCrackedGlaze)
  crackedglaze:  { blends:['overlay','soft-light','hard-light','source-over','multiply','color-burn','darken','screen','color-dodge','lighten'], material:true, light:true, tints:2,
                   tintLabels:['Glaze Hue','Base Hue'], tintDefaults:['#A9B4B0','#7A6A5E'] },
  // a carved surface: Light Hue is the light's colour, Dark Hue the material's; it starts lit from overhead
  // Old Paper: Foxing and Fold Ghost, merged (see genOldPaper)
  oldpaper:      { blends:['multiply','overlay','soft-light','hard-light','color-burn','darken','screen','color-dodge','lighten'], material:true, ground:'grey', light:true, tints:2,
                   tintLabels:['Age Hue','Mould Hue'], tintDefaults:['#8A6A3C','#5F6A4E'] },
  // looking into a crystal (genCrystalLeaf): its own colours, lit
  crystal:   { blends:['overlay','source-over','soft-light','hard-light','screen','color-dodge','multiply','lighten','darken','color-burn'], material:true, light:true, tints:2,
                   tintLabels:['Crystal Hue','Inclusion Hue'], tintDefaults:['#B9A6D8','#D9A441'] },
  spangle:       { blends:['overlay','soft-light','hard-light','color-dodge','multiply','screen','lighten','darken','color-burn'], material:true, ground:'grey', light:true, tints:1,
                   tintLabels:['Metal Hue'], tintDefaults:['#C9CED6'] },
  tessellate:    { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:true, material:true, lightTilt:0, tints:2,
                   tintLabels:['Light Hue','Material Hue'], tintDefaults:['#FFFFFF','#808080'] },
  // a divination deck on a table, lit by the dial (shadows, curl, gilt edges)
  cards:         { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // — 🜚 touch — relief, so soft-light leads and light direction applies
  linen:         { blends:['soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten','source-over'], ground:'grey', light:true, tints:2,
                   tintLabels:['Fabric Hue','Light Hue'], tintDefaults:['#808080','#FFFFFF'] },
  coldpress:     { blends:['soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'], material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  cupring:       { blends:['multiply','overlay','soft-light','hard-light','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:true, material:true, tints:1,
                   tintLabels:['Stain Hue'], tintDefaults:['#6B4A2F'] },
  wax:           { blends:['hard-light','overlay','soft-light','multiply','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:true, material:true, tints:1,
                   tintLabels:['Wax Hue'], tintDefaults:['#7A2B2B'] },
  dunes:         { blends:['source-over','soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'],
                   light:true, material:true, tints:2, tintLabels:['Sand Hue','Sun Hue'], tintDefaults:['#D9B98C','#FFF1D8'] },
  kintsugi:      { blends:['source-over','soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'],
                   light:true, material:true, tints:2, tintLabels:['Glaze Hue','Gold Hue'], tintDefaults:['#E8E1D3','#D4AF37'] },
  moss:          { blends:['source-over','soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'],
                   light:true, material:true, tints:2, tintLabels:['Stone Hue','Moss Hue'], tintDefaults:['#8A8579','#5F7E34'] },
};


/**
 * The FIFTH hue (Ruby: a texture that has a base colour gets a GLOW; one that
 * doesn't gets a MATERIAL colour), and how each is used:
 *   glow    light the texture gives off, in its own places (kintsugi's gold,
 *           thick wax, moss tips…) — black: none
 *   ground  a grey texture's own colour: the surface where it is mid-grey,
 *           which the Light and Dark hues never touch — mid-grey: none
 *   base    the colour of a texture that had none (First Snow) — white: none
 * So every colour has its own job: Light (lighter marks), Dark (darker marks),
 * Material (the surface between), Highlight (glints), Shade (cast shadow),
 * Glow (emitted light). See test/colorRoles.test.mjs.
 */
const GLOWS = {
  crystal: 'the fire inside the crystal, lit from within',
  crackedglaze:'uranium glaze, fluorescing',
  oldpaper:    'the foxing spots fluorescing, as they do under ultraviolet',
  flowers:     'lit seeds in the lotus pod, or a glowing heart',
  tessellate:  'molten light in the seams between facets',
  wax:         'candlelight in the thick of the wax',
  kintsugi:    'the gold seams glowing',
  moss:        'bioluminescent moss tips',
  dunes:       'afterglow along the crests',
  cupring:     'a faint glow where the stain dried at its edge',
  spangle:     'light caught in the metal\'s flecks',
  linen:       'luminous thread in the stitching',
};
for(const [type, why] of Object.entries(GLOWS)) TEXTURE_CAPS[type].hue5 = { label: 'Glow Hue', role: 'glow', def: '#000000', why };
// DIFFUSE (the light's own colour) where nothing else already says it: not
// where a texture has its own Sun or Light hue, and not on grey textures
// (their Light hue colours the lit marks)
for(const t of ['kintsugi', 'moss', 'wax', 'spangle', 'crackedglaze', 'crystal']) TEXTURE_CAPS[t].diffuse = true;
// lit by the engine (lightHeights / lightSparse): the dial may be pulled past
// its rim for lower, rakier light than 12° (to 4°). The rest keep the rim.
for(const t of ['brushstrokes', 'crackedglaze', 'sigils', 'tessellate', 'coldpress', 'crystal', 'cupring', 'dunes', 'glassrain', 'kintsugi', 'linen', 'moss', 'oldpaper', 'wax', 'spangle']) TEXTURE_CAPS[t].lowLight = true;
TEXTURE_CAPS.snow.hue5 = { label: 'Snow Hue', role: 'base', def: '#FFFFFF', why: 'the colour of the flakes' };
for(const c of Object.values(TEXTURE_CAPS)) if(c.genericTint && !c.hue5) c.hue5 = { label: 'Material Hue', role: 'ground', def: '#808080', why: 'the surface itself, between its light and dark marks' };

// the fifth hue as a generator wants it: glow as 0–1 channels (null: none);
// a base colour as 0–255 (null: none)
function glowOf(type, t5){ const h = (TEXTURE_CAPS[type] || {}).hue5; if(!t5 || !h || h.role !== 'glow') return null; const c = parseHex(t5); return { r: c.r/255, g: c.g/255, b: c.b/255 }; }
function baseOf(type, t5){ const h = (TEXTURE_CAPS[type] || {}).hue5; if(!t5 || !h || h.role !== 'base') return null; return parseHex(t5); }
export function capsFor(type){
  return TEXTURE_CAPS[type] || { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 };
}
export function defaultBlendFor(type){ return capsFor(type).blends[0]; }

/**
 * What a slider should read. A param declaring `base` — the number of things
 * drawn at 100% on a default page — shows that number instead of a
 * percentage, because "1124 sparkles" says more than "100%". Size params keep
 * percentages, since they scale with the page rather than counting anything.
 */
export function paramReadout(def, value){
  if(!def) return '';
  // a knob whose marks have names reads as the nearest mark's name (Object Shape)
  if(def.names && def.ticks){ let k = 0; def.ticks.forEach((t, i) => { if(Math.abs(t - value) < Math.abs(def.ticks[k] - value)) k = i; }); return def.names[k]; }
  if(def.base != null){
    const n = Math.max(1, Math.round(def.base * (value / 100)));
    return n.toLocaleString() + (def.absUnit != null ? def.absUnit : '');
  }
  return value + (def.unit || '');
}

export function paramsFor(type){ return TEXTURE_PARAMS[type] || []; }

// ---------- 🜚 TOUCH ----------
// These differ from the other three elements in what they claim: not hue
// (Whimsy), not value (Sharpness), not pattern (Chaos), but SURFACE -- what
// the page is made of and what has happened to it. They are the only
// textures that read as relief rather than as image, which is why they take
// a light direction and composite through soft-light rather than overlay.
// Light is given in degrees, 0 = from the top, running clockwise.

// Cache of already-generated textures, keyed by everything that changes one.
// A plain object here never shrinks -- a long session of seed-rerolling and
// texture-browsing accumulates many multi-megapixel offscreen canvases with
// nothing ever freed, which matters more on mobile (memory pressure gets you
// tab-killed, not just slow). A Map's insertion-order iteration gives
// oldest-first (FIFO) eviction in one line; real LRU would need to track
// access order too, which this app's actual usage doesn't call for.
const TEXTURE_CACHE_MAX_ENTRIES = TEXTURES.cacheEntries;
const textureCache = new Map();

/** Forget every generated texture. For when something a texture draws with
 *  — the symbol font, say — has only just arrived. */
export function clearTextureCache(){ textureCache.clear(); }
/** What the texture cache holds, in megabytes (4 bytes a pixel). */
export function textureCacheMB(){ let px = 0; for(const c of textureCache.values()) px += (c && c.width * c.height) || 0; return px * 4 / 1e6; }

function buildTexture(type, w, h, accent1, accent2, amt, angle, zoom, light, tint1, tint2, form, extra = {}){
  let result;  if(type === 'clouds'){
    result = genClouds(w,h,amt,zoom,light,form,extra.mat);
  } else if(type === 'flowers'){
    result = genFlowers(w,h,amt,zoom,tint1,tint2,form,light,extra.glow);
  } else if(type === 'inkbleed'){
    result = genInkBleed(w,h,amt,zoom,form,extra.shape/100,tint1,tint2);
  } else if(type === 'crackedglaze'){
    result = genCrackedGlaze(w,h,amt,zoom,light,form,tint1,tint2,extra.mat,extra.glow);
  } else if(type === 'bokeh'){
    result = genBokeh(w,h,amt,zoom,form,extra.shape,extra.hueSpread,tint1);
  } else if(type === 'embers'){
    result = genEmbers(w,h,accent1,accent2,amt,zoom,form);
  } else if(type === 'tessellate'){
    result = genTessellate(w,h,amt,zoom,light,tint1,tint2,extra.mat,extra.glow);
  } else if(type === 'astral_fog'){
    result = genAstralFog(w,h,amt,zoom,light,tint1,form);
  } else if(type === 'astral_stars'){
    result = genAstralStars(w,h,accent1,accent2,amt,zoom,form);
  } else if(type === 'snow'){
    result = genSnow(w,h,amt,zoom,light,form,extra.base);
  } else if(type === 'magicparticles'){
    result = genMagicParticles(w,h,accent1,accent2,amt,zoom,form);
  } else if(type === 'glassrain'){
    result = genGlassRain(w,h,amt,zoom,light,form,extra.mat,extra.env);
  } else if(type === 'rainstreaks'){
    result = genRainStreaks(w,h,amt,angle,zoom);
  } else if(type === 'halftone'){
    result = genHalftone(w,h,amt,zoom);
  } else if(type === 'brushstrokes'){
    result = genBrushstrokes(w,h,amt,zoom,form,light);
  } else if(type === 'sigils'){
    result = genSigils(w,h,amt,zoom,light,form,extra.mat);
  } else if(type === 'mathnoise'){
    result = genMathNoise(w,h,amt,zoom);
  } else if(type === 'linen'){
    result = genLinenTooth(w,h,amt,zoom,light,tint1,tint2,form,extra.glow);
  } else if(type === 'coldpress'){
    result = genColdPress(w,h,amt,zoom,light,form,extra.mat);
  } else if(type === 'oldpaper'){
    result = genOldPaper(w,h,amt,zoom,light,tint1,tint2,form,extra.shape/100,extra.mat,extra.glow);
  } else if(type === 'cupring'){
    result = genCupRing(w,h,amt,zoom,light,tint1,form,extra.mat,extra.glow);
  } else if(type === 'wax'){
    result = genPouredWax(w,h,amt,zoom,light,tint1,form,extra.mat,extra.glow);
  } else if(type === 'dunes'){
    result = genDunes(w,h,amt,zoom,light,tint1,tint2,form,extra.tilt,extra.mat,extra.glow);
  } else if(type === 'kintsugi'){
    result = genKintsugi(w,h,amt,zoom,light,tint1,tint2,form,extra.mat,extra.glow);
  } else if(type === 'moss'){
    result = genMoss(w,h,amt,zoom,light,tint1,tint2,form,extra.tilt,extra.mat,extra.glow);
  } else if(type === 'landscape'){
    result = genLandscape(w,h,amt,zoom,form,extra.tilt);
  } else if(type === 'cityscape'){
    result = genCityscape(w,h,amt,zoom,tint1,tint2);
  } else if(type === 'blackhole'){
    result = genBlackHole(w,h,amt,zoom,light,form);
  } else if(type === 'water'){
    result = genWater(w,h,amt,zoom,light,form,extra.shape/100,extra.hueSpread/100,extra.tilt,extra.mat);
  } else if(type === 'moon'){
    result = genMoon(w,h,amt,zoom,form,extra.shape/100);
  } else if(type === 'aurora'){
    result = genAuroraVeil(w,h,amt,zoom,light,tint1,tint2,form);
  } else if(type === 'hatch'){
    result = genSilverpointHatch(w,h,amt,zoom,angle,form);
  } else if(type === 'cards'){
    result = genCartomanticDrift(w,h,amt,zoom,angle,light);
  } else if(type === 'summoning'){
    result = genSummoningCircles(w,h,amt,zoom,light,form);
  } else if(type === 'metalleaf'){
    result = genMetalLeaf(w,h,amt,zoom,light,tint1,form,extra.shape/100,extra.hueSpread/100);
  } else if(type === 'crystal'){
    result = genCrystalLeaf(w,h,amt,zoom,light,tint1,tint2,form,extra.shape/100,extra.hueSpread/100,extra.mat,extra.glow);
  } else if(type === 'spangle'){
    result = genSpangle(w,h,amt,zoom,light,tint1,form,extra.shape/100,extra.hueSpread/100,extra.mat,extra.glow);
  } else if(type === 'grain'){
    result = genGrain(w,h,amt,zoom,form);
  } else {
    let genW = w, genH = h;

    const small = document.createElement('canvas');
    small.width = genW; small.height = genH;
    const sctx = small.getContext('2d', CPU);
    const img = sctx.createImageData(genW,genH);
    const d = img.data;
    for(let i=0;i<d.length;i+=4){
      let v;
      v = 205+(Math.random()*2-1)*32;
      d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
    }
    sctx.putImageData(img,0,0);

    const full = document.createElement('canvas');
    full.width = w; full.height = h;
    const fctx = full.getContext('2d', CPU);
    fctx.imageSmoothingEnabled = true;
    fctx.drawImage(small,0,0,w,h);
    result = full;
  }
  return result;
}

/**
 * The public export. p1/p2 are the two user-facing knobs declared in
 * TEXTURE_PARAMS, both percentages. A param keyed 'zoom' is applied HERE
 * rather than inside any generator: the texture is built at reduced
 * dimensions and scaled back up, which magnifies the pattern uniformly --
 * and costs less to generate, since the work scales with area.
 */
/**
 * Builds (or recalls) a texture as an offscreen canvas.
 *   getTextureCanvas(type, w, h, { accent1, accent2, seed, p1, p2, light,
 *                                  tint1, tint2, blend })
 * Options are NAMED: with thirteen positional arguments, a tint twice landed
 * in the light slot unnoticed.
 */
// the Zen Garden was retired: looks saved with it open as Dune Ripples
const RETIRED = { whorl: 'dunes', foxing: 'oldpaper', foldghost: 'oldpaper', crystalleaf: 'spangle' };   // Crystal Leaf's metal became Metal Spangle; the new crystal is 'crystal'
/** A texture's cache key — shared by the page and the texture worker, so a
 *  texture made in the worker files where the page will look for it. */
export function textureKeyFor(type, w, h, opts = {}){ return describeRequest(type, w, h, opts).key; }
/** Forgets every cached texture of these types (e.g. the two that draw symbols, when the symbol font arrives). */
export function clearTexturesOfTypes(types){ for(const k of [...textureCache.keys()]) if(types.some(t => k.startsWith(t + '_'))) textureCache.delete(k); }
/** Drops every cached texture at least `px` pixels big (after a full-size save,
 *  so a phone isn't left holding several 38 MB textures it won't reuse soon). */
export function dropLargeTextures(px){ for(const [k, c] of [...textureCache]) if(c && c.width*c.height >= px) textureCache.delete(k); }
/** The texture under `key`, if it is cached. */
export function peekTexture(key){ return textureCache.has(key) ? textureCache.get(key) : null; }
// The cache's budget follows the device's memory (navigator.deviceMemory, in
// GB, rounded down: a 4–6 GB phone reports 4): a third of the full budget
// at 2 GB or less, two thirds at 4, all of it at 8. Where it isn't reported
// (Firefox, Safari, Node), the full budget, as before.
const DEVICE_GB = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 0;
const CACHE_BUDGET = TEXTURES.cachePixels * (!DEVICE_GB || DEVICE_GB >= 8 ? 1 : DEVICE_GB >= 4 ? 2/3 : 1/3);
/** Files a finished texture (a canvas, or an ImageBitmap from the worker). */
export function storeTexture(key, result){
  // Bounded by MEMORY, not just count: one full page is 3072×3072 pixels,
  // about 38 MB, and forty of them is far more than a phone browser survives
  // while knobs are dragged (every position is a new entry). Tile-sized
  // textures cost almost nothing, so many of those still fit.
  const px = c => (c && c.width * c.height) || 0;
  textureCache.set(key, result);
  let total = 0;
  for(const c of textureCache.values()) total += px(c);
  while(textureCache.size > 1 && (total > CACHE_BUDGET || textureCache.size > TEXTURE_CACHE_MAX_ENTRIES)){
    const oldest = textureCache.keys().next().value;
    const gone = textureCache.get(oldest);
    total -= px(gone);
    textureCache.delete(oldest);
    // (never close() it here: the texture service may still be showing it
    // while a new one is made, and drawing a closed bitmap throws mid-render)
  }
  return result;
}
// everything a request means: its normalised knobs, and its key
function describeRequest(type, w, h, opts){
  type = RETIRED[type] || type;
  const { accent1, accent2, seed, p1, p2, p3, light, tint1, tint2, blend } = opts;
  // material hues (lit textures): only when set — white is "none"
  // (a picker's alpha is how much of its colour to use: resolved here, once)
  const o3 = resolveAlpha(opts.tint3, '#FFFFFF'), o4 = resolveAlpha(opts.tint4, '#FFFFFF'), o6 = resolveAlpha(opts.tint6, '#FFFFFF');
  const t3 = (o3 && !noMaterialHue(o3)) ? o3 : null, t4 = (o4 && !noMaterialHue(o4)) ? o4 : null;
  // the sixth: DIFFUSE, the light's own colour (white: none)
  const t6 = (o6 && !noMaterialHue(o6) && (TEXTURE_CAPS[RETIRED[type] || type] || {}).diffuse) ? o6 : null;
  // the fifth hue: only when it differs from its role's "none"
  const h5 = (TEXTURE_CAPS[RETIRED[type] || type] || {}).hue5;
  const o5 = h5 ? resolveAlpha(opts.tint5, h5.def) : null;
  const t5 = (h5 && o5 && o5.toUpperCase() !== h5.def.toUpperCase()) ? o5.toUpperCase() : null;
  // the page's own colours, for a texture that shows the world behind the glass
  const env = ((TEXTURE_CAPS[RETIRED[type] || type] || {}).pageEnv && opts.env) ? String(opts.env).toUpperCase() : null;
  // canonical-pixel scale (texCore.js): 1 at export size; keys unchanged at 1
  const scale = (opts.scale > 0 && isFinite(opts.scale)) ? opts.scale : 1;
  // how low the light is, 0–100 (100: the horizon, as it always was)
  // up to 130 for the engine-lit textures (past the dial's rim: lower light); 100 for the rest
  const tiltMax = (TEXTURE_CAPS[RETIRED[type] || type] || {}).lowLight ? 130 : 100;
  const lightTilt = (opts.lightTilt >= 0) ? Math.round(Math.min(tiltMax, opts.lightTilt)) : 100;
  const defs = paramsFor(type);
  const v1 = (p1 == null) ? (defs[0] ? defs[0].def : 100) : p1;
  const v2 = (p2 == null) ? (defs[1] ? defs[1].def : 100) : p2;
  // a composite's sub-layers (astral_fog / astral_stars) take their Form via p3
  const v3 = defs[2] ? ((p3 == null) ? defs[2].def : p3) : (defs.length === 0 && p3 != null ? p3 : null);
  // knobs four and five (Dream Bloom)
  const v4 = defs[3] ? ((opts.p4 == null) ? defs[3].def : opts.p4) : null, v5 = defs[4] ? ((opts.p5 == null) ? defs[4].def : opts.p5) : null;
  // a sixth: a camera's Tilt (Scrying Pool)
  const v6 = defs[5] ? ((opts.p6 == null) ? defs[5].def : opts.p6) : null;

  const colorKeyed = (type === 'embers' || type === 'magicparticles' || type === 'astral_stars');
  const key = (colorKeyed ? `${type}_${w}_${h}_${accent1}_${accent2}` : `${type}_${w}_${h}`)
            + `_s${seed}` + `_${v1}_${v2}` + (v3 == null ? '' : `_f${v3}`) + (v4 == null ? '' : `_k${v4}`) + (v5 == null ? '' : `_h${v5}`) + (v6 == null ? '' : `_v${v6}`) + (scale === 1 ? '' : `_x${scale}`) + (lightTilt === 100 ? '' : `_t${lightTilt}`)
            + (light != null ? `_l${light}` : '')
            + (tint1 ? `_t${tint1}` : '') + (tint2 ? `_u${tint2}` : '')
            + (blend ? `_b${blendFamily(blend)}` : '')
            + (t3 ? `_m${t3}` : '') + (t4 ? `_n${t4}` : '') + (t5 ? `_g${t5}` : '') + (t6 ? `_d${t6}` : '')
            + (env ? `_e${env}` : '');
  return { type, key, t3, t4, t5, t6, env, defs, v1, v2, v3, v4, v5, v6, scale, lightTilt };
}
export function getTextureCanvas(type, w, h, opts = {}){
  const req = describeRequest(type, w, h, opts);
  const { key, defs, v1, v2, v3, v4, v5, v6, scale, lightTilt, t3, t4, t5, t6, env } = req;
  type = req.type;
  const { accent1, accent2, seed, p1, p3, light, tint1, tint2, blend } = opts;
  if(textureCache.has(key)) return textureCache.get(key);

  let zoom = 1, amt = 1, angle = 0, form = 0.5, shape = 0, hueSpread = 0, camTilt = 0;
  const readParam = (def, val) => {
    if(!def) return;
    // below 100% must shrink things too — clamping at 1 made the whole
    // 50–100% range identical. 0.25 is the floor: finer than that the
    // generators produce more marks than is useful.
    if(def.key === 'zoom') zoom = Math.max(0.25, val/100);
    else if(def.key === 'form') form = Math.max(0, Math.min(1, val/100));
    // a count read exactly (amt is floored at 2%, which made 0 stones become 2)
    else if(def.key === 'stones') amt = Math.max(0, Math.round(val))/100;
    else if(def.key === 'angle') angle = val;
    else if(def.key === 'shape') shape = val;
    else if(def.key === 'hue') hueSpread = val;
    // the camera's tilt, for textures seen at an angle (0: straight down)
    else if(def.key === 'tilt') camTilt = Math.max(0, Math.min(1, val/100));
    else amt = Math.max(0.02, val/100);
  };
  readParam(defs[0], v1);
  readParam(defs[1], v2);
  if(defs[2]) readParam(defs[2], v3);
  if(defs[3]) readParam(defs[3], v4);
  if(defs[4]) readParam(defs[4], v5);
  if(defs[5]) readParam(defs[5], v6);
  // sub-textures of a composite (astral_fog / astral_stars) declare no params
  // of their own; the caller passes their amount through p1
  if(defs.length === 0 && p1 != null) amt = Math.max(0.02, p1/100);
  if(defs.length === 0 && p3 != null) form = Math.max(0, Math.min(1, p3/100));

  // Zoom is handed to the generator as a size multiplier, NOT applied by
  // generating small and scaling up. That earlier trick changed three things
  // at once: element size (intended), element COUNT (counts derive from w*h,
  // so rain thinned out as it zoomed) and sharpness (upscaling just looked
  // low-resolution). Size and count are now genuinely independent knobs.
  // an explicit tint overrides the accent a colour-keyed texture would
  // otherwise inherit
  const c1 = tint1 || accent1, c2 = tint2 || accent2;
  let result = withScale(scale, () => withLightTilt(lightTilt/100, () => withSeed(seed, () => buildTexture(type, w, h, c1, c2, amt, angle, zoom, light, tint1, tint2, form, { shape, hueSpread, tilt: camTilt, mat: materialOf(t3, t4, t6), glow: glowOf(type, t5), base: baseOf(type, t5), env: env ? env.split(',') : null }))));


  // A monochrome texture's tint moves its light marks toward the colour and
  // leaves the grey ground alone; white means no tint at all.
  const caps = capsFor(type);
  // tint and blend remap together, in one pass over the texture itself
  const doRemap = caps.ground === 'grey' && blend && !(caps.keepGround || []).includes(blend);
  // Dream Bloom with Colour Variation colours its own motes; the grey tint pass would erase their hues
  const ownColour = type === 'bokeh' && hueSpread > 0;
  const tintNow = caps.genericTint && !ownColour;
  const ground = (tintNow && caps.hue5 && caps.hue5.role === 'ground') ? t5 : null;
  if(result && ((tintNow && (tint1 || tint2 || ground)) || doRemap))
    result = pixelPass(result, tintNow ? tint1 : null, tintNow ? tint2 : null, doRemap ? blendFamily(blend) : null, ground);
  storeTexture(key, result);
  return result;
}

// ---------- main render ----------