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
import { evalAthanor, athanorHash, athanorBudget, athanorStarter, athanorVersion, athanorStepIds, athanorAA, ATHANOR_LIMITS, ATHANOR_CHANNELS } from './athanor.js';
import { TEXTURE_CHAINS } from './chains.js';
import { withSeed, withScale, withPage, wordsRoom, withLightTilt, withLightRig, lightRigOf, scaleNow, blendFamily, pixelPass, CPU, materialOf, noMaterialHue, parseHex, resolveAlpha, canonDiv, cappedDiv } from './texCore.js';
import { genAstralFog, genAstralStars } from './texWhimsy.js';

// TEXTURE_PARAMS, every surface's sliders: textureParams.js (re-exported here, where the app has always found it)
export { TEXTURE_PARAMS } from './textureParams.js';
import { TEXTURE_PARAMS } from './textureParams.js';

/**
 * TEXTURE_CAPS — what tools each texture can actually use.
 *
 * This is what lets the UI grey out controls instead of offering knobs that
 * do nothing. `blends` is the list of composite modes that make sense for a
 * texture (the first is its default); `light` says whether it reads as
 * relief and therefore responds to a light direction; `tints` is how many
 * colours it accepts, with `tintLabels` naming them in the texture's own
 * terms rather than "color 1".
 *
 * Only textures that genuinely consume a colour declare tints. The rest are
 * monochrome by construction and take their colour from the blend against
 * the page, which is why their tint controls are disabled rather than
 * silently ignored.
 */
/**
 * THE SURFACES WHOSE LIGHT TURNED HALF ROUND when the dial's handle became the light itself (texCore lightVec): before,
 * they read the handle as the way the light travelled and were lit from its other side. Their older looks, presets and
 * readings are turned half round as they are put on (appEvents lightTurned), so each keeps the picture it had. The rest
 * already lit from the handle (the rings, the lotus, the water, glass under glass, the webs, the shards, the shaft of
 * light), or use the dial as a direction or a place (wind, flow, rain, a breath, where a circle stands), and keep theirs.
 * A graph from the Athanor turns unless it holds one of LIGHT_KEPT_PARTS.
 */
/** THE SURFACE'S OWN HUES (ROADMAP L0, Ruby: "always use as many user inputs as humanly possible"): up to six pickers,
 *  `caps.tints` how many a surface uses, `tintLabels`/`tintDefaults` in that order. The first two are the old Hue and
 *  Second Hue fields; the four more have ids of their own (the 3rd–8th tints already being the material and light hues). */
export const SURFACE_HUE_KEYS = ['textureTint1', 'textureTint2', 'textureTint9', 'textureTint10', 'textureTint11', 'textureTint12'];
export const LIGHT_TURNED = new Set(['circuit', 'veins', 'crackle', 'knotwork', 'lichtenberg', 'growth', 'cells', 'landscape', 'metalleaf', 'brushstrokes',
  'glassrain', 'rainwater', 'sigils', 'crackedglaze', 'oldpaper', 'crystal', 'spangle', 'tessellate', 'cards', 'linen', 'coldpress', 'cupring', 'guilloche',
  'chladni', 'contour', 'stainedglass', 'turing', 'frost', 'ash', 'wax', 'dunes', 'kintsugi', 'moss']);
export const LIGHT_KEPT_PARTS = ['ringsky', 'ringarch', 'ringland', 'ringview', 'shards', 'dewwebs', 'shaft', 'glasspane', 'shapeland', 'lotus', 'water',
  'curtains', 'ribbons', 'streaks', 'hatching', 'marbling', 'flowlines', 'particles', 'transmutation', 'blackhole', 'washes', 'pigment'];
// the two common blend lists; ledBlends(x, set) puts a surface's default first and keeps the rest in order
const GREY_BLENDS = ['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'];
const LIT_BLENDS = ['source-over','multiply','screen','luminosity','overlay','soft-light','hard-light','lighten','darken'];
const ledBlends = (first, set) => [first, ...set.filter(b => b !== first)];
export const TEXTURE_CAPS = {
  // the board is made of the page's own backdrop (pageEnv), so Normal is its default; its traces wear the accents
  circuit:       { blends:['source-over','screen','lighten','hard-light','overlay','soft-light','luminosity','multiply'], light:true, material:true, tints:2, pageEnv:true,
                   tintLabels:['Trace Hue','Data Hue'], tintDefaults:['accent1','accent2'] },
  veins:         { blends:['source-over','overlay','soft-light','hard-light','multiply','screen','lighten','luminosity'], light:true, dial:'Flow From & Light', material:true, tints:6,
                   tintLabels:['Material Hue','Second Material Hue','Line Hue','Glow Hue','Node Hue','Pulse Hue'], tintDefaults:['#B8A48C','#8E7C68','#C8913A','#4FE3FF','#F2D27A','#DFFBFF'] },
  crackle:       { blends:['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten','source-over'], light:true, material:true, dial:'Impact & Light', tints:2,
                   tintLabels:['Glaze Hue','Body Hue'], tintDefaults:['#A9B4B0','#7A6A5E'] },
  knotwork:      { blends:GREY_BLENDS, ground:'grey', light:true, material:true, tints:2, genericTint:true,
                   tintLabels:['Ribbon Hue','Outline Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // light on black, screened over the page (as Deep Field is); the dial is the field lines: the rays lean and the hem arcs
  aurorasky:     { blends:['screen','lighten','color-dodge','overlay','soft-light','hard-light','source-over'], light:true, dial:'Field Lines', tints:0 },
  // the dial: the light alone; the camera dial turns, tips and zooms the plank (Ruby); the Glow Hue lights the channels
  lichtenberg:   { blends:['source-over','multiply','overlay','soft-light','hard-light','screen','lighten','luminosity'], light:true, material:true, tints:2,
                   tintLabels:['Wood Hue','Grain Hue'], tintDefaults:['#CCA373','#6B4226'],
                   hue5:{ role:'glow', def:'#000000', label:'Glow Hue', why:'the light the strike leaves in its channels, as if they still burned' },
                   camera:{ turn:0, view:0, zoom:100, guide:'plane' } },
  // the dial: the sun it grows toward, and the light on it
  growth:        { blends:GREY_BLENDS, ground:'grey', light:true, dial:'Sun', material:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  plainnoise:    { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  stripes:       { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  polka:         { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  checker:       { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  softgradient:  { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // the cells' heights lit by the dial (the Surface's Height)
  cells:         { blends:GREY_BLENDS, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // — whimsy —
  clouds:        { blends:ledBlends('screen', GREY_BLENDS), material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  bokeh:         { blends:ledBlends('screen', GREY_BLENDS), ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  astral:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Star Hue','Nebula Hue'], tintDefaults:['accent1','accent2'] },
  magicparticles:{ blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Sparkle Hue','Glow Hue'], tintDefaults:['accent1','accent2'] },
  embers:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Ember Hue','Spark Hue'], tintDefaults:['accent1','accent2'] },
  // the dial is the WIND here, not a light (dial: its name for this texture)
  snow:          { blends:['lighten','screen','overlay','soft-light'],  light:true, dial:'Wind Direction', tints:0 },
  landscape:     { blends:ledBlends('hard-light', GREY_BLENDS), ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'], camera:{ turn:0, view:0, zoom:100, guide:'plane' } },   // (View: the camera's pitch, as painted to looking down)
  cityscape:     { blends:ledBlends('hard-light', GREY_BLENDS), ground:'grey', light:false, tints:2,
                   tintLabels:['Window Hue','Water Hue'], tintDefaults:['#FFE3A8','#2E4F6E'] },
  // (seen from the camera dial: Turn turns its disc, View how edge-on, Zoom the lens; the light dial is not its)
  blackhole:     { blends:['hard-light','screen','overlay','soft-light','multiply','color-burn','darken','color-dodge','lighten'], ground:'grey', tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'], camera:{ turn:0, view:100, zoom:100, guide:'disc' }, light:true, dial:'Position', lightTilt:35 },
  // water is tinted by the page itself: neutral by default, like all of Touch
  water:         { blends:ledBlends('soft-light', GREY_BLENDS), material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'], camera:{ turn:0, view:35, zoom:100, guide:'plane' } },
  moon:          { blends:['hard-light','multiply','overlay','soft-light','color-burn','darken','screen','color-dodge','lighten'], ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // Remapped for every blend EXCEPT screen: its grey ground under screen
  // lightens the page a little, and that is part of how the favourite looks.
  aurora:        { blends:ledBlends('screen', GREY_BLENDS),
                   // the dial is the direction the two hues blend in, not a light
                   ground:'grey', keepGround:['screen'], light:true, dial:'Blend Direction', tints:2,
                   tintLabels:['Curtain Hue','Hem Hue'], tintDefaults:['accent1','accent1'] },
  // — sharpness —
  grain:         { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // Scattered Polygons (genMetalLeaf): flat flakes as ever; the dial lights them only when Sheen is up
  metalleaf:     { blends:ledBlends('color-dodge', GREY_BLENDS), ground:'grey', light:true, tints:1,
                   tintLabels:['Leaf Hue'], tintDefaults:['#E0B38D'] },
  // (the crow family: every colour a hue, defaults a raven's; Sheen turns with the light dial)
  corvids:       { blends:['source-over','multiply','screen','soft-light','overlay','luminosity','lighten','darken','hard-light'], light:true, tints:6,
                   tintLabels:['Feather Hue','Tip Hue','Sheen Hue','Second Sheen Hue','Pale Hue','Dark Hue'], tintDefaults:['#0E0E14','#0A0A10','#5A3AC8','#2A8AA8','#F2F2F0','#060608'] },
  // (pixel-art space: every colour a hue, defaults those of Ruby's own pixel nebula; the light dial lights the rims and the worlds)
  pixelspace:    { blends:['source-over','screen','lighten','luminosity','overlay','soft-light','hard-light','multiply'], light:true, tints:6,
                   tintLabels:['Deep Sky Hue','Mid Sky Hue','Nebula Hue','Rim Hue','World Hue','Starlight Hue'], tintDefaults:['#0E0726','#3A1C78','#E2367F','#46A8E6','#9A6BE0','#FFF4FA'] },
  // (liminal spaces: every colour a hue, defaults the teal-grey of Ruby's reference; the camera dial looks round the place)
  liminal:       { blends:LIT_BLENDS, tints:6,
                   tintLabels:['Wall Hue','Floor Hue','Ceiling Hue','Accent Hue','Light Hue','Dark Hue'], tintDefaults:['#7FA0A2','#6E8486','#5E7476','#8FA9AA','#E8F4F6','#050A0C'],
                   camera:{ turn:0, view:100, zoom:100, guide:'room' } },
  // (Webb's false colour: every colour a hue, defaults its orange dust and blue stars; the light dial lights the dust and streams it)
  webb:          { blends:['source-over','screen','lighten','luminosity','overlay','soft-light','hard-light','multiply'], light:true, tints:6,
                   tintLabels:['Deep Sky Hue','Dust Shadow Hue','Dust Hue','Dust Light Hue','Starlight Hue','Ionized Gas Hue'], tintDefaults:['#04050E','#3A1406','#C2581A','#FFC774','#A9C4FF','#3E5CC8'] },
  imprints:      { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Paper Hue', 'Ink Hue', 'Petal Hue', 'Center Hue', 'Leaf Hue', 'Second Ink Hue'], tintDefaults:['#F2EFE4', '#1F4E8C', '#C8506A', '#E8B21C', '#5E7A4A', '#C8402E'] },
  bouquets:      { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Ground Hue', 'Main Bloom Hue', 'Second Bloom Hue', 'Filler Hue', 'Foliage Hue', 'Wrap Hue'], tintDefaults:['#E8DFD2', '#C2264B', '#F3C6CF', '#F5F3EC', '#4E6E3A', '#C8A880'] },
  petals:        { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Surface Hue', 'Petal Hue', 'Aged Petal Hue', 'Center Hue', 'Leaf Hue', 'Light Hue'], tintDefaults:['#7A5A40', '#C2264B', '#7A3A2A', '#3A2418', '#5A6A3A', '#FFE8C8'] },
  meadow:        { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Sky Hue', 'Far Land Hue', 'Grass Hue', 'Flower Hue', 'Second Flower Hue', 'Sunlight Hue'], tintDefaults:['#C9D3D6', '#6E7F6A', '#7A8A45', '#D9332B', '#F2EFE6', '#FFD9A0'] },
  macro:         { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Bokeh Hue', 'Visitor Hue', 'Petal Hue', 'Center Hue', 'Foliage Hue', 'Key Light Hue'], tintDefaults:['#F2D27A', '#C8281E', '#D7261E', '#1A1414', '#5E7F3A', '#FFF2D8'],
                   camera:{ turn:0, view:20, zoom:100, guide:'bloom', seeded:{ turn:[0, 360], view:[0, 55], zoom:[70, 190] } } },
  ditsy:         { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Ground Hue', 'Flower Hue', 'Second Flower Hue', 'Third Flower Hue', 'Center Hue', 'Sprig Hue'], tintDefaults:['#F4EEE2', '#C8506A', '#5A7AC8', '#E8B21C', '#F2D27A', '#6E8A4A'] },
  botline:       { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Paper Hue', 'Ink Hue', 'Petal Wash Hue', 'Center Wash Hue', 'Leaf Wash Hue', 'Second Ink Hue'], tintDefaults:['#F4EFE4', '#2A2420', '#D88098', '#E8C040', '#8AA87A', '#4E6A3A'] },
  windsea:       { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Sky Hue', 'Sea Hue', 'Deep Sea Hue', 'Foam Hue', 'Island Hue', 'Sun Hue'], tintDefaults:['#3A7BD5', '#1F6FB8', '#0E4A8A', '#F4F8FF', '#5FA040', '#FFF2A8'] },
  inkscroll:     { blends:LIT_BLENDS, light:true, tints:6,
                   tintLabels:['Paper Hue', 'Ink Hue', 'Sky Hue', 'Mountain Hue', 'Blossom Hue', 'Sun Hue'], tintDefaults:['#EADCBA', '#1E1A18', '#2E5A88', '#5E7A62', '#E07A8E', '#D23A2A'] },
  // (light to lay over a page, on mid-grey: Soft Light and Overlay leave the page as it was where nothing is)
  dappled:       { blends:['overlay','soft-light','hard-light','multiply','screen','luminosity','color-dodge','color-burn','lighten','darken'], ground:'grey', light:true, tints:2, tintLabels:['Light Hue','Shade Hue'], tintDefaults:['#FFF1D6','#2A3550'] },
  windowlight:   { blends:['overlay','soft-light','hard-light','multiply','screen','luminosity','color-dodge','color-burn','lighten','darken'], ground:'grey', light:true, tints:2, tintLabels:['Light Hue','Shade Hue'], tintDefaults:['#FFF1D6','#2A3550'] },
  caustics:      { blends:['overlay','soft-light','hard-light','multiply','screen','luminosity','color-dodge','color-burn','lighten','darken'], ground:'grey', tints:2, tintLabels:['Light Hue','Shade Hue'], tintDefaults:['#FFF1D6','#2A3550'] },
  // (light leaks on black, for Screen)
  lightleaks:    { blends:['screen','lighten','color-dodge','soft-light','overlay','hard-light','luminosity','source-over'], tints:3, tintLabels:['Gold Hue','Orange Hue','Red Hue'], tintDefaults:['#FFD27A','#FF8A3A','#D8322E'] },
  // feathers on a transparent ground, made to lie on the page's colour or a simple surface (Ruby): Normal as painted,
  // Multiply on a pale page, Screen on a dark one, Soft Light or Overlay into another surface
  feathers:      { blends:['source-over','multiply','screen','soft-light','overlay','luminosity','lighten','darken','hard-light'],
                   light:true, tints:6, tintLabels:['Feather Hue','Tip Hue','Sheen Hue','Second Sheen Hue','Pale Hue','Dark Hue'], tintDefaults:['#ECE6DC','#7C6A5C','#C9D6E8','#E8D6C9','#FFF4D6','#1E2238'] },
  // real colour on a transparent ground: Normal shows the flowers as painted
  flowers:       { blends:['source-over','hard-light','overlay','soft-light','multiply','screen','lighten','darken','color-dodge','color-burn'],
                   light:true, tints:2, tintLabels:['Petal Hue','Heart Hue'], tintDefaults:['#E8739E','#F2B33D'] },
  // impasto: the paint's thickness lit by the dial (genBrushstrokes)
  brushstrokes:  { blends:GREY_BLENDS, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  halftone:      { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // glass in front of the page: transparent, the drops showing the outdoors
  // made from the page's own colours (pageEnv), so Normal is its default
  glassrain:     { blends:['source-over','screen','overlay','soft-light','hard-light','lighten','multiply'], material:true, light:true, tints:0, pageEnv:true },
  // the camera dial is the camera: its turn where you look round the ring, its view how far up (the middle: the arch
  // overhead), its zoom the lens. The light dial is the day (the star never moves; the shadow squares do): at its middle
  // noon, at its rim dusk, past it night; its direction which way round the dusk comes
  skyring:       { blends:['source-over','screen','overlay','soft-light','hard-light','luminosity','multiply'], light:true, tints:2,
                   tintLabels:['Land Hue','Sky Hue'], tintDefaults:['#6F8F55','#86AEDC'], camera:{ turn:8, view:35, zoom:100, guide:'ellipse', seeded:{ turn:[0, 360], view:[8, 70], zoom:[80, 145] } } },
  ringpaint:     { blends:['source-over','screen','overlay','soft-light','hard-light','luminosity','multiply'], light:true, lowLight:true, dial:'Daylight', lightTilt:40, tints:2,
                   tintLabels:['Land Hue','Sky Hue'], tintDefaults:['#6F8F55','#86AEDC'], camera:{ turn:50, view:55, zoom:100, guide:'ring', seeded:{ turn:[0, 360], view:[35, 75], zoom:[75, 135] } } },
  ringworld:     { blends:['source-over','screen','overlay','soft-light','hard-light','luminosity','multiply'], light:true, lowLight:true, dial:'Daylight', lightTilt:40, tints:2,
                   tintLabels:['Land Hue','Sky Hue'], tintDefaults:['#6F8F55','#86AEDC'], camera:{ turn:40, view:55, zoom:100, guide:'ring' } },
  rainwater:     { blends:['source-over','screen','overlay','soft-light','luminosity','multiply'], light:true, tints:2,
                   tintLabels:['Water Hue','Sky Hue'], tintDefaults:['#0E1A26','#8FA8BC'], camera:{ turn:0, view:41, zoom:100, guide:'plane' } },   // (View: overhead to across the water)
  // the dial is where the rain comes from (lightDeg: where it starts when chosen — straight down, as before)
  rainstreaks:   { blends:GREY_BLENDS, ground:'grey',  light:true, dial:'Rain Direction', lightDeg:0, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // the dial is the way the strokes run (125°: the old 35° hatching)
  hatch:         { blends:GREY_BLENDS, ground:'grey', light:true, dial:'Hatch Direction', lightDeg:125, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // — chaos —
  sigils:        { blends:GREY_BLENDS, material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  mathnoise:     { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  summoning:     { blends:GREY_BLENDS, ground:'grey', light:false, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'], camera:{ turn:315, view:0, zoom:100, guide:'circle' } },   // (the camera dial places it: Turn the way from the middle, View how far)
  // ink on clear paper (genInkBleed): its own colours, Ink and Accent
  inkbleed:      { blends:['multiply','source-over','darken','color-burn','overlay','soft-light','hard-light'], light:false, tints:2,
                   tintLabels:['Ink Hue','Accent Hue'], tintDefaults:['#141414','#B0283A'] },
  // a painted glaze over a clay body, coloured as a game engine would (see genCrackedGlaze)
  crackedglaze:  { blends:['overlay','soft-light','hard-light','source-over','multiply','color-burn','darken','screen','color-dodge','lighten'], material:true, light:true, tints:2,
                   tintLabels:['Glaze Hue','Base Hue'], tintDefaults:['#A9B4B0','#7A6A5E'] },
  // a carved surface: Light Hue is the light's color, Dark Hue the material's; it starts lit from overhead
  // Old Paper: Foxing and Fold Ghost, merged (see genOldPaper)
  oldpaper:      { blends:ledBlends('multiply', GREY_BLENDS), material:true, ground:'grey', light:true, tints:2,
                   tintLabels:['Age Hue','Mold Hue'], tintDefaults:['#8A6A3C','#5F6A4E'] },
  // looking into a crystal (genCrystalLeaf): its own colours, lit
  crystal:   { blends:['overlay','source-over','soft-light','hard-light','screen','color-dodge','multiply','lighten','darken','color-burn'], material:true, light:true, tints:2,
                   tintLabels:['Crystal Hue','Inclusion Hue'], tintDefaults:['#B9A6D8','#D9A441'] },
  spangle:       { blends:['overlay','soft-light','hard-light','color-dodge','multiply','screen','lighten','darken','color-burn'], material:true, ground:'grey', light:true, tints:1,
                   tintLabels:['Metal Hue'], tintDefaults:['#C9CED6'] },
  tessellate:    { blends:GREY_BLENDS, ground:'grey', light:true, material:true, lightTilt:0, tints:2,
                   tintLabels:['Light Hue','Facet Hue'], tintDefaults:['#FFFFFF','#808080'] },
  // a divination deck on a table, lit by the dial (shadows, curl, gilt edges)
  // a game in its own colours: the four suits are the page's two accents and these two hues (cartomancy.js)
  cards:         { blends:['source-over','overlay','soft-light','hard-light','multiply','luminosity','screen','color'], ground:'colour', light:true, tints:2,
                   tintLabels:['Third Suit Hue','Fourth Suit Hue'], tintDefaults:['#3E7D4F','#2E5FA8'] },
  // — 🜚 touch — relief, so soft-light leads and light direction applies
  linen:         { blends:['soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten','source-over'], ground:'grey', light:true, tints:2,
                   tintLabels:['Fabric Hue','Light Hue'], tintDefaults:['#808080','#FFFFFF'] },
  coldpress:     { blends:ledBlends('soft-light', GREY_BLENDS), material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  cupring:       { blends:ledBlends('multiply', GREY_BLENDS), ground:'grey', light:true, material:true, tints:1,
                   tintLabels:['Stain Hue'], tintDefaults:['#6B4A2F'] },
  athanor:      { blends:['source-over','overlay','soft-light','hard-light','multiply','screen','darken','lighten','color-dodge','color-burn','difference','exclusion'],
                   light:true, tints:2, tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#F2E6D8','#2A2230'] },
  guilloche:     { blends:GREY_BLENDS, material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  chladni:       { blends:['overlay','soft-light','hard-light','screen','lighten','multiply','darken','color-dodge','color-burn'], ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  contour:       { blends:ledBlends('multiply', GREY_BLENDS), material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  stainedglass:  { blends:['source-over','overlay','soft-light','hard-light','multiply','screen','luminosity','color'], light:true, tints:2,
                   tintLabels:['Glass Hue','Second Glass Hue'], tintDefaults:['#2148A8','#A8182C'] },
  // shards on mid-gray: Screen keeps only the light they catch; Hard Light lays their shadows too. The camera dial lays them on a plane
  brokenglass:   { blends:['screen','hard-light','soft-light','overlay','lighten','color-dodge','multiply','darken','color-burn'], ground:'grey', light:true, lowLight:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Shadow Hue'], tintDefaults:['#FFFFFF','#000000'], camera:{ turn:0, view:0, zoom:100, guide:'plane' } },
  // webs on mid-gray: the dial is the light the silk and dew catch
  dewwebs:       { blends:['screen','hard-light','soft-light','overlay','lighten','color-dodge','multiply','darken','color-burn'], ground:'grey', light:true, lowLight:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  // the light the glass catches, on mid-gray: Screen adds only that; Hard Light adds it and darkens too (grime, a thick edge), on any page
  underglass:    { blends:['screen','hard-light','soft-light','overlay','lighten','color-dodge','multiply','darken','color-burn'], ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Reflection Hue','Grime Hue'], tintDefaults:['#FFFFFF','#000000'] },
  suminagashi:   { blends:['multiply','darken','color-burn','source-over','overlay','soft-light'], light:true, dial:'Breath Direction', tints:2,
                   tintLabels:['Ink Hue','Second Ink Hue'], tintDefaults:['#1C1C26','#2C4C8E'] },
  watercolour:   { blends:['multiply','darken','color-burn','source-over','overlay','soft-light'], light:true, dial:'Wash Direction', tints:2,
                   tintLabels:['Pigment Hue','Second Pigment Hue'], tintDefaults:['accent1','accent2'] },
  flowfield:     { blends:['multiply','source-over','darken','color-burn','overlay','soft-light','screen','lighten'], light:true, dial:'Flow Direction', tints:2,
                   tintLabels:['Ink Hue','Second Ink Hue'], tintDefaults:['accent1','accent2'] },
  turing:        { blends:GREY_BLENDS, material:true, ground:'grey', light:true, tints:2, genericTint:true,
                   tintLabels:['Light Hue','Dark Hue'], tintDefaults:['#FFFFFF','#000000'] },
  frost:         { blends:['screen','soft-light','overlay','hard-light','lighten','multiply','color-dodge','darken','color-burn'], ground:'grey', light:true, material:true, tints:1,
                   tintLabels:['Frost Hue'], tintDefaults:['#EAF4FF'] },
  ash:           { blends:ledBlends('soft-light', GREY_BLENDS), ground:'grey', light:true, material:true, tints:2,
                   tintLabels:['Ash Hue','Ember Hue'], tintDefaults:['#D6D0C6','#FF5A1E'] },
  wax:           { blends:ledBlends('hard-light', GREY_BLENDS), ground:'grey', light:true, material:true, tints:1,
                   tintLabels:['Wax Hue'], tintDefaults:['#7A2B2B'] },
  dunes:         { blends:['source-over','soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'],
                   light:true, material:true, tints:2, tintLabels:['Sand Hue','Sun Hue'], tintDefaults:['#D9B98C','#FFF1D8'], camera:{ turn:0, view:40, zoom:100, guide:'plane' } },
  kintsugi:      { blends:['source-over','soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'],
                   light:true, material:true, tints:2, tintLabels:['Glaze Hue','Gold Hue'], tintDefaults:['#E8E1D3','#D4AF37'] },
  moss:          { blends:['source-over','soft-light','overlay','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'],
                   light:true, material:true, tints:2, tintLabels:['Stone Hue','Moss Hue'], tintDefaults:['#8A8579','#5F7E34'], camera:{ turn:0, view:30, zoom:100, guide:'plane' } },
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
  crackle:     'uranium glaze, fluorescing',
  oldpaper:    'the foxing spots fluorescing, as they do under ultraviolet',
  flowers:     'lit seeds in the lotus pod, or a glowing heart',
  tessellate:  'molten light in the seams between facets',
  wax:         'candlelight in the thick of the wax',
  kintsugi:    'the gold seams glowing',
  moss:        'bioluminescent moss tips',
  dunes:       'afterglow along the crests',
  cupring:     'a faint glow where the stain dried at its edge',
  spangle:     'light caught in the metal\'s flecks',
  cityscape:   'city glow: the sky above the lights, lit from below',
  frost:       'moonlight caught in the ice',
  astral:      'airglow: the sky\'s own faint light, in slow waves',
  linen:       'luminous thread in the stitching',
  circuit:     'an aura round the glowing traces, as if the board were lit from within',
};
for(const [type, why] of Object.entries(GLOWS)) TEXTURE_CAPS[type].hue5 = { label: 'Glow Hue', role: 'glow', def: '#000000', why };
// DIFFUSE (the light's own colour) where nothing else already says it: not
// where a texture has its own Sun or Light hue, and not on grey textures
// (their Light hue colours the lit marks)
for(const t of ['kintsugi', 'moss', 'wax', 'spangle', 'crackedglaze', 'crackle', 'crystal']) TEXTURE_CAPS[t].diffuse = true;
// lit by the engine (lightHeights / lightSparse): the dial may be pulled past
// its rim for lower, rakier light than 12° (to 4°). The rest keep the rim.
for(const t of ['brushstrokes', 'crackedglaze', 'crackle', 'sigils', 'tessellate', 'coldpress', 'crystal', 'cupring', 'dunes', 'glassrain', 'kintsugi', 'linen', 'moss', 'oldpaper', 'wax', 'spangle', 'ash', 'turing', 'frost', 'contour', 'guilloche', 'stainedglass', 'circuit',
  'veins', 'knotwork', 'lichtenberg', 'growth', 'cells', 'landscape', 'rainwater']) TEXTURE_CAPS[t].lowLight = true;   // (the last seven from the lighting audit: engine-lit, rigged, held at the rim)
// THE DIAL AS A DIRECTION ONLY: where a texture reads only which way the dial points (a wind, a hatch, a flow), its
// Height means nothing and the page hides it (the usability review: "Reach %" beside Hatch Direction). Measured, not
// guessed: each of these draws the same picture at every height.
for(const t of ['aurorasky', 'aurora', 'snow', 'rainstreaks', 'hatch', 'suminagashi', 'flowfield']) TEXTURE_CAPS[t].dirOnly = true;
// THE PAGE'S LIGHTS (ROADMAP C1, C2: the dial's rim light, the Ambient slider under it, the Main Light, Rim Light and
// Ambient Hues) for the surfaces the engine lights whose dial is a light. Measured, not guessed: each of these changes
// under them (texCore withLightRig); the rest draw as they always did and never show them. (Linen Tooth, Stained Glass
// and Rain on Glass changed too little to offer them; the Ringworlds' dial is the day. Crystal's facets take them since its
// kept structure is keyed on them: before, its cache showed the light it was first made with.)
for(const t of ['crystal', 'circuit', 'veins', 'crackle', 'knotwork', 'lichtenberg', 'growth', 'cells', 'landscape', 'brushstrokes', 'rainwater', 'sigils', 'crackedglaze',
  'oldpaper', 'spangle', 'tessellate', 'coldpress', 'guilloche', 'contour', 'turing', 'frost', 'ash', 'wax', 'dunes', 'kintsugi', 'moss']) TEXTURE_CAPS[t].rig = true;
TEXTURE_CAPS.snow.hue5 = { label: 'Snow Hue', role: 'base', def: '#FFFFFF', why: 'the color of the flakes' };
for(const c of Object.values(TEXTURE_CAPS)) if(c.genericTint && !c.hue5) c.hue5 = { label: 'Ground Hue', role: 'ground', def: '#808080', why: 'the surface itself, between its light and dark marks' };

// the fifth hue as a generator wants it: glow as 0–1 channels (null: none);
// a base colour as 0–255 (null: none)
function glowOf(type, t5){ const h = (TEXTURE_CAPS[type] || (type === 'astral_stars' ? TEXTURE_CAPS.astral : {})).hue5; if(!t5 || !h || h.role !== 'glow') return null; const c = parseHex(t5); return { r: c.r/255, g: c.g/255, b: c.b/255 }; }
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
  // an Athanor Knob that is an angle: its 0–100 read as a turn (D1)
  if(def.deg) return Math.round(value*3.6) + '°';
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

// THE SURFACES MADE BY THEIR CHAINS (chains.js), and which hues each is handed: none, the first, both, the page's two
// accents, or a hue with a fallback of its own where that differs from the surface's default (genChain falls back to
// TEXTURE_CAPS tintDefaults). One line per kind of hand, not one branch per surface.
const chainTintSet = (spec, types) => Object.fromEntries(types.map(t => [t, spec ? spec.split(' ').map(a => a.split('|')) : []]));
const CHAIN_TINTS = {
  ...chainTintSet('tint1 tint2', ['clouds', 'corvids', 'liminal', 'webb', 'pixelspace', 'imprints', 'bouquets', 'petals']),
  ...chainTintSet('tint1 tint2', ['meadow', 'ditsy', 'botline', 'windsea', 'inkscroll', 'dappled', 'windowlight', 'caustics']),
  ...chainTintSet('tint1 tint2', ['lightleaks', 'feathers', 'flowers', 'inkbleed', 'crackedglaze', 'bokeh', 'tessellate', 'rainstreaks']),
  ...chainTintSet('tint1 tint2', ['veins', 'crackle', 'lichtenberg', 'growth', 'linen', 'oldpaper', 'stainedglass', 'suminagashi']),
  ...chainTintSet('tint1 tint2', ['skyring', 'ringpaint', 'ringworld', 'rainwater', 'ash', 'dunes', 'kintsugi', 'moss']),
  ...chainTintSet('tint1 tint2', ['landscape', 'cityscape', 'aurora', 'cards', 'metalleaf', 'crystal']),
  ...chainTintSet('tint1 tint2|#E8A0B8', ['macro']),
  ...chainTintSet('accent1 accent2', ['embers', 'magicparticles', 'circuit']),
  ...chainTintSet('', ['snow', 'glassrain', 'halftone', 'knotwork', 'aurorasky', 'plainnoise', 'stripes', 'polka']),
  ...chainTintSet('', ['checker', 'softgradient', 'cells', 'brushstrokes', 'sigils', 'mathnoise', 'coldpress', 'guilloche']),
  ...chainTintSet('', ['chladni', 'contour', 'brokenglass', 'dewwebs', 'underglass', 'turing', 'blackhole', 'water']),
  ...chainTintSet('', ['moon', 'hatch', 'summoning', 'grain']),
  ...chainTintSet('tint1', ['cupring', 'frost', 'wax', 'spangle']),
  ...chainTintSet('tint1|#2E5C8A tint2|#B0465A', ['watercolour']),
  ...chainTintSet('tint1|#2B2A3A tint2|#7A4A6A', ['flowfield']),
};
function buildTexture(type, w, h, accent1, accent2, amt, angle, zoom, light, tint1, tint2, form, extra = {}){
  let result;
  if(CHAIN_TINTS[type]){ const pick = { tint1, tint2, accent1, accent2 };
    result = genChain(type, w, h, light, extra, ...CHAIN_TINTS[type].map(([k, fb]) => pick[k] || fb)); }
  else if(type === 'astral_fog'){
    result = genAstralFog(w,h,amt,zoom,light,tint1,form);
  } else if(type === 'astral_stars'){
    result = genAstralStars(w,h,accent1,accent2,amt,zoom,form,extra.glow,wordsRoom({ around: extra.around, text: extra.text ? poemLines(extra.text) : '' }, w, h, 0.4, 1.8));
  } else if(type === 'athanor'){
    result = genAthanor(w,h,light,tint1,tint2,extra);
  } else if(type === 'athanorsteps'){
    result = genAthanorSteps(w,h,light,tint1,tint2,extra);
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
const RETIRED = { whorl: 'dunes', foxing: 'oldpaper', foldghost: 'oldpaper', crystalleaf: 'spangle', crucible: 'athanor' };   // Crystal Leaf's metal became Metal Spangle; the new crystal is 'crystal'
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
// the poem's layout, as a short key (FNV-1a): every character counts
/** Does a graph hold a Page Backdrop part, or Rain on Glass (which shows the page through its drops), and so want the page's own colors? */
/** Whether a graph reads the page's camera dial (then it is given the camera, and keyed by it). */
export function graphUsesCamera(graph){ return /"name":\s*"camdial"/.test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
/** The camera a request means (a texture with a camera, or a graph with a Camera Dial): whole numbers, so the key is stable. */
function cameraOf(type, opts){
  const has = (TEXTURE_CAPS[RETIRED[type] || type] || {}).camera || ((type === 'athanor' || type === 'athanorsteps') && graphUsesCamera(opts.graph));
  if(!has) return null;
  const c = opts.camera || {}, d = (TEXTURE_CAPS[RETIRED[type] || type] || {}).camera || {};
  const num = (v, dv) => { const x = +v; return isFinite(x) ? x : dv; };
  return { turn: Math.round(((num(c.turn, d.turn ?? 0) % 360) + 360) % 360), view: Math.round(Math.max(0, Math.min(130, num(c.view, d.view ?? 0)))), zoom: Math.round(Math.max(25, Math.min(400, num(c.zoom, d.zoom ?? 100)))) };
}
// THE PAGE'S TRUE SHAPE (Ruby: the saved image's board was not the preview's): the parts that grow by chance on
// their grid (texCore `pageGrid`) are given the export's own size, and grow on its grid at every size. A request
// carries it (`page`, keyed `_p`) only for a surface holding one of them, and only when it is the canvas's shape.
const PAGE_PARTS = ['traces', 'cracks', 'growline', 'hoarfrost'];
export function graphUsesPage(graph){ return new RegExp('"name":\\s*"(?:' + PAGE_PARTS.join('|') + ')"').test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
const PAGE_CHAINS = new Map();
function pageOf(type, w, h, opts){
  const ath = type === 'athanor' || type === 'athanorsteps', c = TEXTURE_CHAINS[RETIRED[type] || type];
  if(ath ? !graphUsesPage(opts.graph) : !c) return null;
  if(!ath){ if(!PAGE_CHAINS.has(type)) PAGE_CHAINS.set(type, (c.nodes || []).some(nd => PAGE_PARTS.includes(nd[0]))); if(!PAGE_CHAINS.get(type)) return null; }
  const p = opts.page; if(!Array.isArray(p) || !(p[0] > 0) || !(p[1] > 0)) return null;
  const PW = Math.round(p[0]), PH = Math.round(p[1]);
  return Math.abs(PH/PW - h/w) <= 0.02*(h/w) ? [PW, PH] : null;
}
// (and a graph's working grid, as the export makes it: the page over the grid's divisor there)
const gridAtExport = (page, d) => page ? [Math.ceil(page[0]/Math.max(1, d)), Math.ceil(page[1]/Math.max(1, d))] : null;
/** Whether a graph reads the inset box (an Inset Box part, or a Border Mask from it): it is then made with the box's place. */
/** Whether a graph draws with a Curve Control (D4): only then does a curve drawn on the page key it. */
export function graphUsesCurves(graph){ return /"name":\s*"curvectl"/.test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
export function graphUsesBox(graph){ return /"name":\s*"insetbox"|"shape":\s*"inset box"/.test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
export function graphUsesBackdrop(graph){ return /"name":\s*"(?:backdrop|glassrain)"/.test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
/** The poem's layout as whole LINES, each box rounded out to 1/64 of the page (a chain with `poem: 'lines'` reads
 *  only this: typing within a line changes nothing, so the surface is drawn again only when a line grows past a step). */
export function poemLines(text){
  const by = new Map();
  for(const part of String(text || '').split(';')){ const v = part.split(',').map(Number); if(v.length < 6 || !v.every(isFinite)) continue;
    const b = by.get(v[4]); if(b){ b[0] = Math.min(b[0], v[0]); b[1] = Math.min(b[1], v[1]); b[2] = Math.max(b[2], v[2]); b[3] = Math.max(b[3], v[3]); } else by.set(v[4], v.slice(0, 6)); }
  const q = 64, dn = x => Math.floor(x*q)/q, up = x => Math.ceil(x*q)/q;
  return [...by.values()].map(b => [dn(b[0]), dn(b[1]), up(b[2]), up(b[3]), b[4], b[5], 0].join(',')).join(';');
}
/** Whether a texture's own chain reads the poem (and so is given its layout). A chain marked `poem: 'shape'` reads it only
 *  while Shape Aware asks it to (`shaped`): round the words, or filling the letters. */
export function chainReadsPoem(type, shaped = true){ const c = TEXTURE_CHAINS[RETIRED[type] || type], p = c ? c.poem : (type === 'astral' || type === 'astral_stars') ? 'shape' : null;   // (Deep Field's stars too)
  return !!(p && (p !== 'shape' || shaped)); }
function layoutHash(str){ let h = 0x811c9dc5; for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + str.length.toString(36); }
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
  // (Deep Field's star layer carries its airglow: the composite's own hue)
  const h5 = (TEXTURE_CAPS[RETIRED[type] || type] || (type === 'astral_stars' ? TEXTURE_CAPS.astral : {})).hue5;
  const o5 = h5 ? resolveAlpha(opts.tint5, h5.def) : null;
  const t5 = (h5 && o5 && o5.toUpperCase() !== h5.def.toUpperCase()) ? o5.toUpperCase() : null;
  // the page's own colours, for a texture that shows the world behind the glass
  // (an Athanor graph has them when it holds a Page Backdrop part)
  const env = (((TEXTURE_CAPS[RETIRED[type] || type] || {}).pageEnv || ((type === 'athanor' || type === 'athanorsteps') && graphUsesBackdrop(opts.graph))) && opts.env) ? String(opts.env).toUpperCase() : null;
  // canonical-pixel scale (texCore.js): 1 at export size; keys unchanged at 1
  const scale = (opts.scale > 0 && isFinite(opts.scale)) ? opts.scale : 1;
  // how low the light is, 0–100 (100: the horizon, as it always was)
  // up to 130 for the engine-lit textures (past the dial's rim: lower light); 100 for the rest
  const tiltMax = (TEXTURE_CAPS[RETIRED[type] || type] || {}).lowLight ? 130 : 100;
  const lightTilt = (opts.lightTilt >= 0) ? Math.round(Math.min(tiltMax, opts.lightTilt)) : 100;
  // THE PAGE'S LIGHTS (ROADMAP C1, C2): the Ambient slider and hue, and the rim light (the dial's second handle), for a
  // surface they light (`rig`, measured) or a graph; any other surface never sees them, and keys as it always did
  const rig = ((TEXTURE_CAPS[type] || {}).rig || type === 'athanor' || type === 'athanorsteps')
    ? lightRigOf({ ambient: opts.ambient, ambientHue: opts.ambientHue, rimDeg: opts.rimDeg, rimTilt: opts.rimTilt == null ? null : Math.min(tiltMax, +opts.rimTilt), rimHue: opts.rimHue,
        // (the main light's colour: a surface with a Diffuse Hue has it as that, in its material)
        mainHue: (TEXTURE_CAPS[type] || {}).diffuse ? null : opts.tint6 }) : null;
  const defs = paramsFor(type === 'athanorsteps' ? 'athanor' : type);
  const v1 = (p1 == null) ? (defs[0] ? defs[0].def : 100) : p1;
  const v2 = (p2 == null) ? (defs[1] ? defs[1].def : 100) : p2;
  // a composite's sub-layers (astral_fog / astral_stars) take their Form via p3
  const v3 = defs[2] ? ((p3 == null) ? defs[2].def : p3) : (defs.length === 0 && p3 != null ? p3 : null);
  // knobs four and five (Dream Bloom)
  const v4 = defs[3] ? ((opts.p4 == null) ? defs[3].def : opts.p4) : null, v5 = defs[4] ? ((opts.p5 == null) ? defs[4].def : opts.p5) : null;
  // a sixth: a camera's Tilt (Scrying Pool); a seventh and eighth (Lichtenberg's camera, Circuit Board's Era)
  const v6 = defs[5] ? ((opts.p6 == null) ? defs[5].def : opts.p6) : null;
  const v7 = defs[6] ? ((opts.p7 == null) ? defs[6].def : opts.p7) : null, v8 = defs[7] ? ((opts.p8 == null) ? defs[7].def : opts.p8) : null;

  // (Cartomancy's first two suits are the accents; an Athanor graph with an Accent node reads them too)
  const colorKeyed = (type === 'embers' || type === 'magicparticles' || type === 'astral_stars' || type === 'cards' || type === 'ringpaint'
    || ((type === 'athanor' || type === 'athanorsteps') && /"name":\s*"accent"/.test(typeof opts.graph === 'string' ? opts.graph : JSON.stringify(opts.graph || ''))));
  // (and a graph with an Ink part changes with the poem's ink; any other surface never sees it)
  const inkKeyed = (type === 'athanor' || type === 'athanorsteps') && /"name":\s*"ink"/.test(typeof opts.graph === 'string' ? opts.graph : JSON.stringify(opts.graph || ''));
  const key = (colorKeyed ? `${type}_${w}_${h}_${accent1}_${accent2}` : `${type}_${w}_${h}`)
            + `_s${seed}` + `_${v1}_${v2}` + (v3 == null ? '' : `_f${v3}`) + (v4 == null ? '' : `_k${v4}`) + (v5 == null ? '' : `_h${v5}`) + (v6 == null ? '' : `_v${v6}`) + (v7 == null ? '' : `_j${v7}`) + (v8 == null ? '' : `_o${v8}`) + (scale === 1 ? '' : `_x${scale}`) + (lightTilt === 100 ? '' : `_t${lightTilt}`)
            + (light != null ? `_l${light}` : '')
            + (rig ? `_L${rigKey(rig)}` : '')
            + (tint1 ? `_t${tint1}` : '') + (tint2 ? `_u${tint2}` : '') + (Array.isArray(opts.hues) && opts.hues.some(Boolean) ? `_hu${opts.hues.map(h => h || '').join(',')}` : '')
            + (blend ? `_b${blendFamily(blend)}` : '')
            + (t3 ? `_m${t3}` : '') + (t4 ? `_n${t4}` : '') + (t5 ? `_g${t5}` : '') + (t6 ? `_d${t6}` : '')
            + (env ? `_e${env}` : '')
            + ((type === 'athanor' || type === 'athanorsteps') ? `_c${athanorHash(opts.graph)}` : '')
            // (the inset box's place, for a graph that reads it)
            + ((type === 'athanor' || type === 'athanorsteps') && opts.box && graphUsesBox(opts.graph) ? `_x${opts.box}` : '')
            // (the curves drawn on the page, for a graph with a Curve Control)
            + ((type === 'athanor' || type === 'athanorsteps') && Array.isArray(opts.curves) && opts.curves.some(Boolean) && graphUsesCurves(opts.graph) ? `_cv${layoutHash(opts.curves.join('|'))}` : '')
            + (type === 'athanor' && ATHANOR_CHANNELS.includes(opts.channel) && opts.channel !== 'final' ? `_ch${opts.channel}` : '')
            // the poem's layout, for a graph with The Poem in it (and only then: any other surface never changes with the text)
            + ((type === 'athanor' || type === 'athanorsteps') && opts.text ? `_q${layoutHash(String(opts.text))}` : '')
            + (chainReadsPoem(type) && opts.text ? `_q${layoutHash(poemLines(opts.text))}` : '')
            // (whether it is Text Aware, and whether it fills the letters, only for a surface that reads the poem)
            + ((type === 'athanor' || type === 'athanorsteps' || chainReadsPoem(type)) ? (opts.fill ? '_F' + Math.round(+opts.fill*100) : '') + (opts.around ? '_R' + Math.round(+opts.around*100) : '') + (opts.aware === false ? '_A0' : '') : '')
            + ((cam => cam ? `_cm${cam.turn}_${cam.view}_${cam.zoom}` : '')(cameraOf(type, opts)))
            + (inkKeyed ? `_i${opts.ink || ''}` : '')
            + ((pg => pg ? `_p${pg[0]}x${pg[1]}` : '')(pageOf(type, w, h, opts)));
  return { type, key, t3, t4, t5, t6, env, defs, v1, v2, v3, v4, v5, v6, v7, v8, scale, lightTilt, rig, camera: cameraOf(type, opts), page: pageOf(type, w, h, opts) };
}
/** A surface layer's lights (the look's keys) as a request's (ROADMAP C1, C2): the Ambient slider (0–200; 100 the
 *  surface's own) and the Ambient Hue, and the rim light, the light dial's second handle (its way and height; its hue,
 *  whose alpha is its strength). */
export function layerLights(L){ return { ambient: L.textureAmbient, ambientHue: L.textureTint8, rimDeg: L.textureRim, rimTilt: L.textureRimTilt, rimHue: L.textureTint7 }; }
// the page's lights in a texture's key: the ambient (×100), its hue, and the rim (way, height, strength, hue)
function rigKey(r){ const q = v => v.map(x => Math.round(x*1000)).join('.');
  return Math.round(r.amb*100) + (r.ambHue ? 'a' + q(r.ambHue) : '') + (r.mainHue ? 'm' + q(r.mainHue) : '') + (r.rim ? `r${r.rim.deg},${Math.round(r.rim.tilt*100)},${Math.round(r.rim.k*255)}` + (r.rim.hue ? ',' + q(r.rim.hue) : '') : ''); }
// A Athanor surface: its graph evaluated (athanor.js) on the working grid,
// then laid on the page. Another texture inside the graph is made here, the
// usual way. No graph, or no Surface in it: a flat mid-grey (nothing shows).
function genAthanor(w, h, light, tint1, tint2, extra){
  // the work budget: a heavy graph is made on a coarser grid; too many nodes, not at all
  const B = athanorBudget(extra.graph || '');
  // ANTI-ALIASING, all pixels (A6): the graph drawn on a grid twice as fine and laid down smaller, as far as the budget
  // allows (four times the work: a heavy graph keeps the grid its budget gives it). A v3 graph and newer, whose sizes
  // and counts are canonical, so the finer grid draws the same picture, finer.
  const fine = athanorAA(extra.graph || '') === 'all pixels' && athanorVersion(extra.graph || '') >= 3 && !B.tooMany;
  const k = fine ? Math.min(3, Math.max(1, Math.sqrt(B.cost*4/ATHANOR_LIMITS.cost)))/2 : B.scale;
  const div = cappedDiv(canonDiv(2)*k, w, h), ww = Math.ceil(w/div), wh = Math.ceil(h/div);
  const img = B.tooMany ? null : evalAthanor(extra.graph || '', ww, wh,
    // (a v3 graph is told its grid's divisor, as a texture's own chain always was: canonical sizes and counts come out true;
    //  an older graph keeps drawing as it did, a quarter of the marks at twice the size)
    { knobs: extra.knobs, tints: [tint1, tint2, ...(extra.hues || [])], light, lightTilt: extra.lightTilt, seed: extra.seed, scale: scaleNow(), accents: extra.accents || null, text: extra.text || '', box: extra.box || null, curves: extra.curves || null, env: extra.env || null, camera: extra.camera || null,
      channel: ATHANOR_CHANNELS.includes(extra.channel) && extra.channel !== 'final' ? extra.channel : null, aware: extra.aware !== false, fill: +extra.fill || 0, around: +extra.around || 0, page: gridAtExport(extra.page, 2*k), ...(athanorVersion(extra.graph || '') >= 3 ? { div } : {}) },
    { texture: (t, tw, th, opts) => getTextureCanvas(t, tw, th, opts) });
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sx = small.getContext('2d', CPU), im = sx.createImageData(ww, wh), d = im.data;
  for(let i = 0, q = 0; i < ww*wh; i++, q += 4){
    if(img){ d[q] = Math.max(0, Math.min(255, img.r[i]*255)); d[q+1] = Math.max(0, Math.min(255, img.g[i]*255)); d[q+2] = Math.max(0, Math.min(255, img.b[i]*255)); }
    else { d[q] = d[q+1] = d[q+2] = 128; }
    d[q+3] = 255;
  }
  sx.putImageData(im, 0, 0);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  // (a graph with Pixelate in it, pixel art, is enlarged pixel for pixel; every other is smoothed)
  const cx = c.getContext('2d', CPU); cx.imageSmoothingEnabled = !/"pixelate"/.test(typeof extra.graph === 'string' ? extra.graph : JSON.stringify(extra.graph || '')); cx.drawImage(small, 0, 0, w, h);
  return c;
}
// The Athanor's STEP PREVIEWS: every node's first output, small, as tiles of
// one sheet (in the order of the nodes' ids, filling rows of ⌈√n⌉) — made in
// the texture worker like any texture, so the editor stays responsive.
export function athanorSheetLayout(n){ const cols = Math.max(1, Math.ceil(Math.sqrt(n))); return { cols, rows: Math.max(1, Math.ceil(n/cols)) }; }
function genAthanorSteps(w, h, light, tint1, tint2, extra){
  const ids = athanorStepIds(extra.graph || '');   // (a group's insides too: the editor shows them when it is opened)
  const { cols } = athanorSheetLayout(ids.length), t = Math.max(8, Math.floor(w/cols));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const cx = c.getContext('2d', CPU); cx.fillStyle = '#000'; cx.fillRect(0, 0, w, h);
  if(!ids.length || athanorBudget(extra.graph || '').tooMany) return c;
  const all = evalAthanor(extra.graph || '', t, t, { knobs: extra.knobs, tints: [tint1, tint2, ...(extra.hues || [])], light, lightTilt: extra.lightTilt, seed: extra.seed, scale: scaleNow(), div: 1, all: true, accents: extra.accents || null, text: extra.text || '', box: extra.box || null, curves: extra.curves || null, env: extra.env || null, camera: extra.camera || null },
    { texture: (ty, tw, th, opts) => getTextureCanvas(ty, tw, th, opts) });
  const tile = document.createElement('canvas'); tile.width = t; tile.height = t;
  const tx = tile.getContext('2d', CPU);
  [...all.keys()].forEach((id, i) => {
    const img = all.get(id); if(!img) return;
    const im = tx.createImageData(t, t), d = im.data;
    for(let k = 0, q = 0; k < t*t; k++, q += 4){ d[q] = Math.max(0, Math.min(255, img.r[k]*255)); d[q+1] = Math.max(0, Math.min(255, img.g[k]*255)); d[q+2] = Math.max(0, Math.min(255, img.b[k]*255)); d[q+3] = 255; }
    tx.putImageData(im, 0, 0); cx.drawImage(tile, (i % cols)*t, Math.floor(i/cols)*t);
  });
  return c;
}
// A texture rebuilt as a chain of steps (chains.js): its graph evaluated on
// its own grid, its sliders read across their own ranges (the graph's bound
// params, '@k2[10,700]', read the slider's own value back).
const chainGraphs = new Map();
/** A chain's hues, slots 1–6: the two pickers, then the four more a surface may ask for (ROADMAP L0), each its default
 *  when empty. */
const chainHues = (td, t1, t2, more) => [t1 || td[0], t2 || td[1], ...[0, 1, 2, 3].map(i => ((more || [])[i]) || td[i + 2])];
function genChain(type, w, h, light, extra, tint1, tint2){
  const chain = TEXTURE_CHAINS[type];
  if(!chainGraphs.has(type)) chainGraphs.set(type, athanorStarter(type));
  const defs = paramsFor(type), knobs = (extra.knobs || []).map((v, i) => { const d = defs[i]; if(!d || v == null) return 50;
    return Math.max(0, Math.min(100, (v - d.min)/Math.max(1e-6, d.max - d.min)*100)); });
  // its grid: canonical cells (chain.div), or its own rule (chain.grid: Linen keeps its threads ≥3 px apart)
  const td = (TEXTURE_CAPS[type] || {}).tintDefaults || [];
  if(chain.canvas){
    // a CANVAS PASS: its parts paint at full size (athanor.js ctx.canvas)
    const out = evalAthanor(chainGraphs.get(type), w, h, { knobs, tints: chainHues(td, tint1, tint2, extra.hues), light, lightTilt: extra.lightTilt, seed: extra.seed, scale: scaleNow(), div: 1,
      accents: extra.accents || null, mat: extra.mat || null, glow: extra.glow || null, base: extra.base || null, env: extra.env || null, camera: extra.camera || null, canvas: true,
      text: chain.poem && extra.text ? poemLines(extra.text) : '', aware: extra.aware !== false, fill: +extra.fill || 0, around: +extra.around || 0, page: gridAtExport(extra.page, 1) }, { texture: (t, tw, th, opts) => getTextureCanvas(t, tw, th, opts) });
    if(out) return out;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d', CPU); cx.fillStyle = '#808080'; cx.fillRect(0, 0, w, h); return c;
  }
  const div = cappedDiv(chain.grid ? chain.grid(w, h, scaleNow(), knobs) : canonDiv(chain.div || 1), w, h), ww = Math.ceil(w/div), wh = Math.ceil(h/div);
  const img = evalAthanor(chainGraphs.get(type), ww, wh, { knobs, tints: chainHues(td, tint1, tint2, extra.hues), light, lightTilt: extra.lightTilt, seed: extra.seed, scale: scaleNow(), div,
      mat: extra.mat || null, glow: extra.glow || null, env: extra.env || null, text: chain.poem && extra.text ? poemLines(extra.text) : '', camera: extra.camera || null,
      aware: extra.aware !== false, fill: +extra.fill || 0, around: +extra.around || 0, page: chain.grid ? null : gridAtExport(extra.page, chain.div || 1) },
    { texture: (t, tw, th, opts) => getTextureCanvas(t, tw, th, opts) });
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sx = small.getContext('2d', CPU), im = sx.createImageData(ww, wh), d = im.data;
  for(let i = 0, q = 0; i < ww*wh; i++, q += 4){
    if(img){ d[q] = Math.max(0, Math.min(255, img.r[i]*255)); d[q+1] = Math.max(0, Math.min(255, img.g[i]*255)); d[q+2] = Math.max(0, Math.min(255, img.b[i]*255)); }
    else { d[q] = d[q+1] = d[q+2] = 128; }
    d[q+3] = 255;
  }
  sx.putImageData(im, 0, 0);
  if(ww === w && wh === h) return small;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  // (a CRISP chain, pixel art, is enlarged pixel for pixel; every other is smoothed)
  const cx = c.getContext('2d', CPU); cx.imageSmoothingEnabled = !chain.crisp; cx.drawImage(small, 0, 0, w, h);
  return c;
}
export function getTextureCanvas(type, w, h, opts = {}){
  const req = describeRequest(type, w, h, opts);
  const { key, defs, v1, v2, v3, v4, v5, v6, v7, v8, scale, lightTilt, rig, t3, t4, t5, t6, env, camera, page } = req;
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
  let result = withLightRig(rig, () => withPage(page, () => withScale(scale, () => withLightTilt(lightTilt/100, () => withSeed(seed, () => buildTexture(type, w, h, c1, c2, amt, angle, zoom, light, tint1, tint2, form, { shape, hueSpread, tilt: camTilt, mat: materialOf(t3, t4, t6), glow: glowOf(type, t5), base: baseOf(type, t5), env: env ? env.split(',') : null,
    knobs: [v1, v2, v3, v4, v5, v6, v7, v8], hues: Array.isArray(opts.hues) ? opts.hues : null, graph: opts.graph, text: opts.text || '', box: opts.box || null, curves: Array.isArray(opts.curves) ? opts.curves : null, channel: type === 'athanor' ? opts.channel || null : null, aware: opts.aware !== false, fill: +opts.fill || 0, around: +opts.around || 0, page, seed, lightTilt, camera, accents: [accent1, accent2, opts.ink || null] }))))));


  // A monochrome texture's tint moves its light marks toward the colour and
  // leaves the grey ground alone; white means no tint at all.
  const caps = capsFor(type);
  // tint and blend remap together, in one pass over the texture itself
  // (a texture painted in its own colour keeps them: Dream Bloom's coloured motes, a Painted Landscape in colour)
  const doRemap = caps.ground === 'grey' && blend && !(caps.keepGround || []).includes(blend) && !(type === 'landscape' && hueSpread > 0);
  // Dream Bloom with Colour Variation colours its own motes; the grey tint pass would erase their hues
  const ownColour = (type === 'bokeh' || type === 'landscape') && hueSpread > 0;
  const tintNow = caps.genericTint && !ownColour;
  const ground = (tintNow && caps.hue5 && caps.hue5.role === 'ground') ? t5 : null;
  if(result && ((tintNow && (tint1 || tint2 || ground)) || doRemap))
    result = pixelPass(result, tintNow ? tint1 : null, tintNow ? tint2 : null, doRemap ? blendFamily(blend) : null, ground);
  storeTexture(key, result);
  return result;
}

// ---------- main render ----------