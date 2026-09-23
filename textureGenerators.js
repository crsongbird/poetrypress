/**
 * textureGenerators.js — the texture system's tables, cache and dispatch.
 *
 * The generators themselves live by element:
 *   texWhimsy.js     ♡  clouds, bokeh, deep field, euphoria dust, burning mana,
 *                       first snow, aurora
 *   texSharpness.js  √  lotus, 90s dots, still rain, painter's frustration,
 *                       silverpoint hatch, metal leaf
 *   texChaos.js      ∆  sigils, enochian noise, summoning circles, Rorschach,
 *                       fractured glaze, facet field, cartomancy
 *   texTouch.js      🜚  linen, cold press, foxing, fold ghost, cup ring,
 *                       poured wax, raked substrate
 *   texCore.js          noise grids, colour mixing, the seeded random source
 * Waking grain is a plain pixel loop and lives in buildTexture below.
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
import { withSeed, invertTextureCanvas } from './texCore.js';
import { genClouds, genAstralFog, genAstralStars, genBokeh, genEmbers, genSnow, genMagicParticles, genAuroraVeil } from './texWhimsy.js';
import { genFlowers, genHalftone, genRainStreaks, genBrushstrokes, genSilverpointHatch, genMetalLeaf } from './texSharpness.js';
import { genSigils, genMathNoise, genSummoningCircles, genInkBleed, genCrackedGlaze, genTessellate, genCartomanticDrift } from './texChaos.js';
import { genLinenTooth, genColdPress, genFoxing, genFoldGhost, genCupRing, genPouredWax, genWhorl } from './texTouch.js';

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
  clouds:        [{key:'zoom',  label:'Cloud Scale',     min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Billow',          min:30, max:220, def:100, unit:'%'}],
  bokeh:         [{key:'zoom',  label:'Orb Size',        min:50, max:300, def:100, unit:'%'},
                  {key:'amt',   label:'Orb Count',       min:20, max:260, def:100, unit:'%', base:67}],
  astral:        [{key:'stars', label:'Star Density',    min:10, max:300, def:100, unit:'%'},
                  {key:'fog',   label:'Nebula Density',  min:0,  max:260, def:100, unit:'%'}],
  magicparticles:[{key:'zoom',  label:'Sparkle Size',    min:60, max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Sparkle Count',   min:20, max:400, def:100, unit:'%', base:1124}],
  embers:        [{key:'zoom',  label:'Ember Size',      min:60, max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Ember Count',     min:20, max:500, def:100, unit:'%', base:2950}],
  snow:          [{key:'zoom',  label:'Flake Size',      min:60, max:340, def:100, unit:'%'},
                  {key:'amt',   label:'Snowfall',        min:20, max:260, def:100, unit:'%', base:2950}],
  grain:         [{key:'zoom',  label:'Grain Size',      min:100,max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Contrast',        min:30, max:240, def:100, unit:'%'}],
  metalleaf:     [{key:'zoom',  label:'Leaf Size',       min:60, max:360, def:100, unit:'%'},
                  {key:'amt',   label:'Coverage',        min:20, max:260, def:100, unit:'%', base:165}],
  flowers:       [{key:'zoom',  label:'Bloom Size',      min:50, max:450, def:150, unit:'%'},
                  {key:'amt',   label:'Bloom Count',     min:10, max:300, def:60,  unit:'%', base:33}],
  brushstrokes:  [{key:'zoom',  label:'Stroke Width',    min:60, max:380, def:100, unit:'%'},
                  {key:'amt',   label:'Stroke Count',    min:20, max:260, def:100, unit:'%', base:111}],
  halftone:      [{key:'zoom',  label:'Dot Scale',       min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Dot Weight',      min:30, max:240, def:100, unit:'%'}],
  rainstreaks:   [{key:'zoom',  label:'Rain Zoom',       min:100,max:500, def:100, unit:'%'},
                  {key:'angle', label:'Slant',           min:-45,max:45,  def:0,   unit:'°'}],
  sigils:        [{key:'zoom',  label:'Sigil Zoom',      min:100,max:500, def:100, unit:'%'},
                  {key:'amt',   label:'Sigil Count',     min:15, max:260, def:100, unit:'%', base:2484, base:51}],
  mathnoise:     [{key:'zoom',  label:'Glyph Zoom',      min:100,max:500, def:140, unit:'%'},
                  {key:'amt',   label:'Emergence',       min:30, max:240, def:130, unit:'%'}],
  summoning:     [{key:'zoom',  label:'Circle Size',     min:40, max:500, def:100, unit:'%'},
                  {key:'amt',   label:'Circle Count',    min:20, max:700, def:100, unit:'%', base:3}],
  inkbleed:      [{key:'zoom',  label:'Blot Scale',      min:60, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Spread',          min:30, max:240, def:100, unit:'%'}],
  crackedglaze:  [{key:'zoom',  label:'Fracture Scale',  min:60, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Crack Density',   min:10, max:900, def:100, unit:'%', base:26}],
  linen:         [{key:'zoom',  label:'Weave Scale',     min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Slub Frequency',  min:0,  max:400, def:100, unit:'%'}],
  coldpress:     [{key:'zoom',  label:'Tooth Scale',     min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Tooth Depth',     min:20, max:300, def:100, unit:'%'}],
  foxing:        [{key:'zoom',  label:'Bloom Size',      min:40, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Spot Count',      min:20, max:400, def:100, unit:'%', base:7}],
  foldghost:     [{key:'zoom',  label:'Crease Depth',    min:30, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Fold Count',      min:25, max:300, def:100, unit:'%', base:3}],
  cupring:       [{key:'zoom',  label:'Ring Size',       min:40, max:320, def:100, unit:'%'},
                  {key:'amt',   label:'Ring Count',      min:30, max:300, def:100, unit:'%', base:2}],
  wax:           [{key:'zoom',  label:'Pool Size',       min:40, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Pool Count',      min:25, max:300, def:100, unit:'%', base:3}],
  whorl:         [{key:'zoom',  label:'Furrow Spacing',  min:50, max:360, def:100, unit:'%'},
                  {key:'amt',   label:'Rake Passes',     min:25, max:400, def:100, unit:'%', base:2}],
  aurora:        [{key:'zoom',  label:'Curtain Height',  min:40, max:220, def:100, unit:'%', base:100, absUnit:'%'},
                  {key:'amt',   label:'Ribbon Count',    min:20, max:900, def:100, unit:'%', base:9, absUnit:''}],
  hatch:         [{key:'angle', label:'Hatch Angle',     min:-90,max:90,  def:35,  unit:'°'},
                  {key:'amt',   label:'Line Density',    min:25, max:400, def:100, unit:'%'}],
  cards:         [{key:'amt',   label:'Fragment Count',  min:20, max:400, def:100, unit:'%', base:23},
                  {key:'angle', label:'Angular Scatter', min:0,  max:90,  def:35,  unit:'°'}],
  tessellate:    [{key:'zoom',  label:'Facet Size',      min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Irregularity',    min:0,  max:240, def:100, unit:'%'}],
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
  clouds:        { blends:['overlay','soft-light','screen','multiply'], light:false, tints:0 },
  bokeh:         { blends:['overlay','screen','lighten','soft-light'],  light:false, tints:0 },
  astral:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Star Hue','Nebula Hue'], tintDefaults:['accent1','accent2'] },
  magicparticles:{ blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Sparkle Hue','Glow Hue'], tintDefaults:['accent1','accent2'] },
  embers:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Ember Hue','Spark Hue'], tintDefaults:['accent1','accent2'] },
  snow:          { blends:['lighten','screen','overlay','soft-light'],  light:false, tints:0 },
  aurora:        { blends:['screen','lighten','overlay','soft-light'],  light:false, tints:1,
                   tintLabels:['Curtain Hue'], tintDefaults:['accent1'] },
  // — sharpness —
  grain:         { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 },
  metalleaf:     { blends:['overlay','soft-light','hard-light','screen'], light:false, tints:1,
                   tintLabels:['Leaf Hue'], tintDefaults:['#D9B45B'] },
  flowers:       { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 },
  brushstrokes:  { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 },
  halftone:      { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  rainstreaks:   { blends:['overlay','soft-light','screen','lighten'],  light:false, tints:0 },
  hatch:         { blends:['overlay','multiply','soft-light','hard-light'], light:false, tints:0 },
  // — chaos —
  sigils:        { blends:['overlay','multiply','soft-light','color-burn'], light:false, tints:0 },
  mathnoise:     { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  summoning:     { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  inkbleed:      { blends:['color-burn','multiply','overlay','darken'], light:false, tints:0 },
  crackedglaze:  { blends:['overlay','multiply','soft-light','hard-light'], light:false, tints:0 },
  tessellate:    { blends:['overlay','soft-light','multiply','hard-light'], light:false, tints:0 },
  cards:         { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  // — 🜚 touch — relief, so soft-light leads and light direction applies
  linen:         { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
  coldpress:     { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
  foxing:        { blends:['multiply','soft-light','overlay','color-burn'], light:false, tints:1,
                   tintLabels:['Spot Hue'], tintDefaults:['#8A6A3C'] },
  foldghost:     { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
  cupring:       { blends:['multiply','soft-light','overlay','color-burn'], light:true, tints:1,
                   tintLabels:['Stain Hue'], tintDefaults:['#6B4A2F'] },
  wax:           { blends:['hard-light','soft-light','overlay','multiply'], light:true, tints:1,
                   tintLabels:['Wax Hue'], tintDefaults:['#7A2B2B'] },
  whorl:         { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
};

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

// Cache of already-generated textures, keyed by type+dims+colors+invert+seed.
// A plain object here never shrinks -- a long session of seed-rerolling and
// texture-browsing accumulates many multi-megapixel offscreen canvases with
// nothing ever freed, which matters more on mobile (memory pressure gets you
// tab-killed, not just slow). A Map's insertion-order iteration gives
// oldest-first (FIFO) eviction in one line; real LRU would need to track
// access order too, which this app's actual usage doesn't call for.
const TEXTURE_CACHE_MAX_ENTRIES = TEXTURES.cacheEntries;
const textureCache = new Map();

function buildTexture(type, w, h, accent1, accent2, amt, angle, zoom, light, tint1, tint2){
  let result;  if(type === 'clouds'){
    result = genClouds(w,h,amt,zoom);
  } else if(type === 'flowers'){
    result = genFlowers(w,h,amt,zoom);
  } else if(type === 'inkbleed'){
    result = genInkBleed(w,h,amt,zoom);
  } else if(type === 'crackedglaze'){
    result = genCrackedGlaze(w,h,amt,zoom);
  } else if(type === 'bokeh'){
    result = genBokeh(w,h,amt,zoom);
  } else if(type === 'embers'){
    result = genEmbers(w,h,accent1,accent2,amt,zoom);
  } else if(type === 'tessellate'){
    result = genTessellate(w,h,amt,zoom);
  } else if(type === 'astral_fog'){
    result = genAstralFog(w,h,amt,zoom,light,tint1);
  } else if(type === 'astral_stars'){
    result = genAstralStars(w,h,accent1,accent2,amt,zoom);
  } else if(type === 'snow'){
    result = genSnow(w,h,amt,zoom);
  } else if(type === 'magicparticles'){
    result = genMagicParticles(w,h,accent1,accent2,amt,zoom);
  } else if(type === 'rainstreaks'){
    result = genRainStreaks(w,h,amt,angle,zoom);
  } else if(type === 'halftone'){
    result = genHalftone(w,h,amt,zoom);
  } else if(type === 'brushstrokes'){
    result = genBrushstrokes(w,h,amt,zoom);
  } else if(type === 'sigils'){
    result = genSigils(w,h,amt,zoom);
  } else if(type === 'mathnoise'){
    result = genMathNoise(w,h,amt,zoom);
  } else if(type === 'linen'){
    result = genLinenTooth(w,h,amt,zoom,light);
  } else if(type === 'coldpress'){
    result = genColdPress(w,h,amt,zoom,light);
  } else if(type === 'foxing'){
    result = genFoxing(w,h,amt,zoom,light,tint1);
  } else if(type === 'foldghost'){
    result = genFoldGhost(w,h,amt,zoom,light);
  } else if(type === 'cupring'){
    result = genCupRing(w,h,amt,zoom,light,tint1);
  } else if(type === 'wax'){
    result = genPouredWax(w,h,amt,zoom,light,tint1);
  } else if(type === 'whorl'){
    result = genWhorl(w,h,amt,zoom,light);
  } else if(type === 'aurora'){
    result = genAuroraVeil(w,h,amt,zoom,light,tint1);
  } else if(type === 'hatch'){
    result = genSilverpointHatch(w,h,amt,zoom,angle);
  } else if(type === 'cards'){
    result = genCartomanticDrift(w,h,amt,zoom,angle);
  } else if(type === 'summoning'){
    result = genSummoningCircles(w,h,amt,zoom);
  } else if(type === 'metalleaf'){
    result = genMetalLeaf(w,h,amt,zoom,light,tint1);
  } else {
    let genW = w, genH = h;
    if(type==='grain'){ const gz = 5*zoom; genW=Math.max(1,Math.round(w/gz)); genH=Math.max(1,Math.round(h/gz)); }

    const small = document.createElement('canvas');
    small.width = genW; small.height = genH;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(genW,genH);
    const d = img.data;
    for(let i=0;i<d.length;i+=4){
      let v;
      if(type==='grain') v = 128+(Math.random()*2-1)*100*amt;
      else v = 205+(Math.random()*2-1)*32;
      d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
    }
    sctx.putImageData(img,0,0);

    const full = document.createElement('canvas');
    full.width = w; full.height = h;
    const fctx = full.getContext('2d');
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
export function getTextureCanvas(type, w, h, accent1, accent2, invert, seed, p1, p2, light, tint1, tint2){
  const defs = paramsFor(type);
  const v1 = (p1 == null) ? (defs[0] ? defs[0].def : 100) : p1;
  const v2 = (p2 == null) ? (defs[1] ? defs[1].def : 100) : p2;

  const colorKeyed = (type === 'embers' || type === 'magicparticles' || type === 'astral_stars');
  const key = (colorKeyed ? `${type}_${w}_${h}_${accent1}_${accent2}` : `${type}_${w}_${h}`)
            + (invert ? '_inv' : '') + `_s${seed}` + `_${v1}_${v2}`
            + (light != null ? `_l${light}` : '')
            + (tint1 ? `_t${tint1}` : '') + (tint2 ? `_u${tint2}` : '');
  if(textureCache.has(key)) return textureCache.get(key);

  let zoom = 1, amt = 1, angle = 0;
  const readParam = (def, val) => {
    if(!def) return;
    if(def.key === 'zoom') zoom = Math.max(1, val/100);
    else if(def.key === 'angle') angle = val;
    else amt = Math.max(0.02, val/100);
  };
  readParam(defs[0], v1);
  readParam(defs[1], v2);
  // sub-textures of a composite (astral_fog / astral_stars) declare no params
  // of their own; the caller passes their amount through p1
  if(defs.length === 0 && p1 != null) amt = Math.max(0.02, p1/100);

  // Zoom is handed to the generator as a size multiplier, NOT applied by
  // generating small and scaling up. That earlier trick changed three things
  // at once: element size (intended), element COUNT (counts derive from w*h,
  // so rain thinned out as it zoomed) and sharpness (upscaling just looked
  // low-resolution). Size and count are now genuinely independent knobs.
  // an explicit tint overrides the accent a colour-keyed texture would
  // otherwise inherit
  const c1 = tint1 || accent1, c2 = tint2 || accent2;
  let result = withSeed(seed, () => buildTexture(type, w, h, c1, c2, amt, angle, zoom, light, tint1, tint2));

  if(invert) result = invertTextureCanvas(result);
  if(textureCache.size >= TEXTURE_CACHE_MAX_ENTRIES){
    textureCache.delete(textureCache.keys().next().value);
  }
  textureCache.set(key, result);
  return result;
}

// ---------- main render ----------