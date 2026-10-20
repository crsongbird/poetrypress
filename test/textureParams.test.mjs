/**
 * textureParams.test.mjs — the two user-facing knobs per texture.
 *
 * Guards the things that would silently produce a broken control: a texture
 * in the picker with no params declared (two sliders labelled "—"), a param
 * whose default sits outside its own range, a preset pointing at a texture
 * that no longer exists, and generation blowing up at either extreme.
 * Slow (longer than half a minute): it renders every texture at its knobs' extremes.
 *
 * Run: node test/textureParams.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();
const { TEXTURE_PARAMS, TEXTURE_CAPS, paramsFor, paramReadout, getTextureCanvas, clearTextureCache } = await import('../textureGenerators.js');
const { clearAthanorCache } = await import('../athanor.js');
// a probe measures the drawing itself: a texture (or a chain's part) served from a cache draws nothing
const fresh = () => { clearTextureCache(); clearAthanorCache(); };
const { PRESETS } = await import('../appOptions.js');

let failures = 0;
const check = (label, cond) => { cond ? console.log('ok:', label) : (failures++, console.log('FAIL:', label)); };

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pickerTypes = [...html.matchAll(/<option value="([a-zA-Z]+)"[^>]*>([^<]+)<\/option>/g)]
  .filter(m => !['1:1','2:3'].includes(m[2]))
  .map(m => m[1]);
const textureTypes = pickerTypes.filter(t => TEXTURE_PARAMS[t] || t === 'astral');

// 29: the Fractal Moon joined Whimsy, which now has eight. Whether one
// retires to restore seven-per-element is Ruby's call — see OPEN-ISSUES.
// 33: Painted Landscape (♡), Night City (√), Black Hole (∆) and the
// Scrying Pool (🜚) joined
// Saturn–Kiviuq on: the Painted Ringworld and Ring in the Sky joined Sky & Cosmos
check('the picker offers 85 textures (seven hidden: the Basics and the first Fractured Glaze), and the Athanor\'s own', new Set(textureTypes).size === 86 && textureTypes.includes('athanor'));   // (a Set: the box's Frosted Glass is also value="frost")

// every pickable texture must declare exactly two labelled knobs
const missing = textureTypes.filter(t => paramsFor(t).length !== 2);
// a third knob is always Form; Dream Bloom alone goes on to five (Object Shape, Colour Variation)
check('every texture declares two params, plus an optional third that must be Form (and a fourth and fifth on a few: Dream Bloom, Crystal Leaf, Cartomancy…)',
  Object.entries(TEXTURE_PARAMS).every(([t, d]) => d.length === 2 || (d.length === 3 && d[2].key === 'form')
    || ((t === 'bokeh' || t === 'crystal' || t === 'spangle' || t === 'metalleaf' || t === 'cards' || t === 'crackle' || t === 'rainwater' || t === 'water') && d.length === 5 && d[2].key === 'form' && d[3].key === 'shape' && d[4].key === 'hue')
    // (a camera's Tilt is the camera dial's View now: Scrying Pool five, Dune Ripples and Moss on Stone three)
    // (Lichtenberg: its camera on the camera dial; eight of its own — the strike's angle, depth, channel width, slide)
    || (t === 'lichtenberg' && d.length === 8 && d[2].key === 'form' && d[3].key === 'shape' && d[4].key === 'angle' && d[7].key === 'slide')
    // (Ringworld: eight, its camera on the camera dial, its day on the light dial, Builders the sixth)
    || (t === 'ringworld' && d.length === 8 && d[5].label === 'Builders')
    // (the Painted Ringworld: eight, World third, Altitude sixth, Paint and Brush last; Ring in the Sky: seven, Paint and Brush last)
    || (t === 'ringpaint' && d.length === 8 && d[2].label === 'World' && d[5].key === 'alt' && d[7].label === 'Brush')
    || (t === 'skyring' && d.length === 7 && d[4].label === 'Star Height' && d[6].label === 'Brush')
    // (Corvid Feathers: eight, its Bird first; the light to lay over: three, or four)
    || (t === 'corvids' && d.length === 8 && d[0].key === 'bird') || (t === 'pixelspace' && d.length === 8 && d[0].key === 'pixel') || (t === 'webb' && d.length === 8 && d[0].key === 'amount') || (t === 'liminal' && d.length === 8 && d[0].key === 'reach') || (t === 'veins' && d.length === 8 && d[0].key === 'material' && d[1].key === 'weave') || (['imprints', 'bouquets', 'petals', 'meadow', 'macro', 'ditsy', 'botline', 'windsea', 'inkscroll'].includes(t) && d.length === 8) || (['dappled', 'windowlight', 'caustics', 'lightleaks'].includes(t) && d.length === 3)
    // (Feathers: eight, each how much of one thing, Lift last)
    || (t === 'feathers' && d.length === 8 && d[2].key === 'fluff' && d[7].key === 'lift')
    // (Under Glass: eight, each a thing the glass catches, Cracks and Edge last but one and last)
    || (t === 'underglass' && d.length === 8 && d[5].label === 'Cracks' && d[7].label === 'Edge')
    // (Broken Glass: eight, its camera on the camera dial, its light the light dial; Dewy Webs: eight, Iridescence seventh)
    || (t === 'brokenglass' && d.length === 8 && d[0].label === 'Shards' && d[7].label === 'Shadows')
    || (t === 'dewwebs' && d.length === 8 && d[0].label === 'Webs' && d[6].label === 'Iridescence')
    // (Circuit Board's Era and Markings: seventh and eighth)
    || (t === 'circuit' && d.length === 8 && d[2].key === 'form' && d[3].key === 'shape' && d[4].key === 'hue' && d[5].key === 'tilt' && d[6].key === 'era' && d[7].key === 'marks')
    || ((t === 'wax' || t === 'stainedglass' || t === 'growth' || t === 'aurorasky' || t === 'knotwork') && d.length === 6 && d[2].key === 'form' && d[3].key === 'shape' && d[4].key === 'hue' && d[5].key === 'tilt')
    // (Painted Landscape: Tilt, then Color — grey as it was, or painted in colour)
    || (t === 'landscape' && d.length === 6 && d[2].key === 'form' && d[3].key === 'tilt' && d[4].key === 'hue' && d[5].key === 'shape')
    || ((t === 'oldpaper' || t === 'moon' || t === 'inkbleed' || t === 'ash' || t === 'turing' || t === 'frost' || t === 'stripes' || t === 'cells') && d.length === 4 && d[2].key === 'form' && d[3].key === 'shape')
    // the Athanor: eight plain knobs, named on the page from its graph's Knob nodes
    || (t === 'athanor' && d.length === 8 && d.every((p, i) => p.key === 'k' + (i + 1)))));

const unlabelled = textureTypes.filter(t => paramsFor(t).some(d => !d.label || /value/i.test(d.label)));
check('every param has a real label, not "value 1"', unlabelled.length === 0);

const badRange = textureTypes.filter(t => paramsFor(t).some(d => !(d.min < d.max && d.def >= d.min && d.def <= d.max)));
check('every default sits inside its own min/max', badRange.length === 0);
if(badRange.length) console.log('   offenders:', badRange.join(', '));

// generation must survive both extremes of both knobs (the corners where both are low or both high are drawn
// by textureFingerprints already; the two crossed corners are drawn here, at the same small size)
let broke = 0;
for(const t of Object.keys(TEXTURE_PARAMS)){
  const [a, b] = TEXTURE_PARAMS[t];
  for(const [v1, v2] of [[a.min,b.max],[a.max,b.min]]){
    try {
      const c = getTextureCanvas(t, 320, 320, { accent1: '#c9a876', accent2: '#7a8ca3', seed: 99, p1: v1, p2: v2 });
      if(!c || c.width !== 320 || c.height !== 320) throw new Error('wrong size');
    } catch(e){ broke++; console.log('   FAIL', t, v1, v2, e.message); }
  }
}
check('every texture generates at the crossed corners of its two knobs (one low, one high), filling the size asked for', broke === 0);
// (that a zoom knob really changes the picture is the knob probes' below: every first knob must move it)

// presets
const presetTex = PRESETS.filter(p => !p.full && p.textureType).map(p => p.textureType + '|' + (p.textureBlend || 'default'));
// (a FULL preset is a look Ruby made in the app — Dusk Letter, Event Horizon — and may repeat another's;
//  the rest may share a texture only in a different blend: the same surface shown another way)
check('no two presets use the same texture in the same blend (Ruby\'s own full looks excepted)', new Set(presetTex).size === presetTex.length);
const orphans = PRESETS.map(p => p.textureType).filter(t => t && !textureTypes.includes(t));
check('no preset points at a texture that is not in the picker', orphans.length === 0);
if(orphans.length) console.log('   orphans:', orphans.join(', '));

// a preset's stored knobs must be legal for the texture it names
const outOfRange = PRESETS.filter(p => {
  const d = paramsFor(p.textureType);
  if(!d.length || p.texP1 === undefined) return false;
  return p.texP1 < d[0].min || p.texP1 > d[0].max || p.texP2 < d[1].min || p.texP2 > d[1].max;
});
check('preset knob values are inside their texture\'s range', outOfRange.length === 0);
if(outOfRange.length) console.log('   offenders:', outOfRange.map(p=>p.name).join(', '));

// (names that were lies, Non-Euclid Cracks and the rest, are kept out by test/wiki.test.mjs's RETIRED_NAMES)

// ---- every knob must actually do something ----
// This is the check that was missing when zoom was faked by generating at a
// lower resolution: draw-call counts were identical, so nothing caught it.
// The mock records geometry (arc radii, path lengths) and the sizes of the
// internal canvases some textures work on, which between them can tell a
// real size change from a no-op.
const M = await import('./canvasMock.mjs');
// (drawn at 360 px: as telling as 600 for every knob, and the suite a fifth quicker now the flowers are in it)
function probe(type, v1, v2){
  fresh(); M.resetCreatedCanvases();
  const c = getTextureCanvas(type, 360, 360, { accent1: '#c9a876', accent2: '#7a8ca3', seed: 5, p1: v1, p2: v2 });
  // Several textures do their real work on an internal downscaled canvas, so
  // the returned canvas's own stats say nothing about them. Aggregate across
  // every canvas created during generation instead.
  let geo = 0;
  for(const cv of M.createdCanvases){
    const st = cv.getContext('2d')._stats;
    // rects and rotations count too: a texture may express a knob purely as
    // filled area (Aurora's ribbons) or purely as angle (Cartomantic scatter)
    geo += st.radiusSum + st.pathLen + st.pathDx + st.pixelSum/500 + (st.pixelVar||0)/5
         + st.rectArea/500 + st.rotSum*2000
         // signed as well as absolute: a symmetric angle range (-90..90) gives
         // identical |rotation| at both ends. Weighted heavily because radians
         // are small numbers next to accumulated path lengths, and would
         // otherwise be lost in the noise of a texture that also draws a lot.
         + st.rotSigned*5000;
  }
  // the marks alone (no pixels), and where every written pixel's tone lies
  let lines = 0, hash = 0;
  for(const cv of M.createdCanvases){ const st = cv.getContext('2d')._stats; lines += st.radiusSum + st.pathLen + st.pathDx + st.rectArea/500; hash = (Math.imul(hash, 31) + (st.pixelHash || 0)) >>> 0; }
  let scl = 0; for(const cv of M.createdCanvases) scl += cv.getContext('2d')._stats.scaleSum || 0;
  return { geo, lines, hash, scl, dims: M.createdCanvases.map(x=>x.width+'x'+x.height).join(',') };
}
function movesWith(type, i){
  const d = TEXTURE_PARAMS[type];
  // an ANGLE knob's two ends are the same orientation (lines have no
  // direction: -90° is +90°), so for angles compare one end with the middle
  const span = k => d[k].key === 'angle' ? [d[k].min, (d[k].min + d[k].max) / 2] : [d[k].min, d[k].max];
  const [a0, a1] = span(i);
  const lo = i === 0 ? probe(type, a0, d[1].def) : probe(type, d[0].def, a0);
  const hi = i === 0 ? probe(type, a1, d[1].def) : probe(type, d[0].def, a1);
  return Math.abs(hi.geo - lo.geo) > Math.max(0.25, lo.geo * 0.002) || lo.dims !== hi.dims || lo.hash !== hi.hash
    // marks drawn and read back (a chain's parts) show only in their geometry: weigh it apart from the pixels
    || Math.abs(hi.lines - lo.lines) > Math.max(0.25, lo.lines * 0.002)
    // pictures stamped at a size (a Scatter of Bloom's petals) show only in the scale they are drawn at
    || Math.abs(hi.scl - lo.scl) > Math.max(0.25, lo.scl * 0.002);
}
// 'astral' is a composite assembled in canvasRenderer from astral_fog and
// astral_stars; probing the composite name directly is meaningless, so its
// two halves are checked instead.
const probeTypes = Object.keys(TEXTURE_PARAMS).filter(t => t !== 'astral' && t !== 'athanor');   // (the Athanor's knobs are whatever its graph makes them)
const deadFirst  = probeTypes.filter(t => !movesWith(t, 0));
const deadSecond = probeTypes.filter(t => !movesWith(t, 1));
check('every texture\'s FIRST knob changes the output', deadFirst.length === 0);
if(deadFirst.length) console.log('   inert:', deadFirst.join(', '));
check('every texture\'s SECOND knob changes the output', deadSecond.length === 0);
if(deadSecond.length) console.log('   inert:', deadSecond.join(', '));

// zoom must change size WITHOUT changing how many things are drawn -- the
// old implementation coupled them, which is why rain thinned as it zoomed
const rainLo = probe('rainstreaks', 100, 100), rainHi = probe('rainstreaks', 500, 100);
const strokesOf = (v1) => { fresh(); M.resetCreatedCanvases();
  const c = getTextureCanvas('rainstreaks', 600, 600, { seed: 5, p1: v1, p2: 100 });
  return c.getContext('2d')._stats.strokes; };
check('zooming rain changes streak size, not streak count',
  strokesOf(100) === strokesOf(500) && rainHi.lines > rainLo.lines * 1.5);

// the composite's two halves, which is where its knobs actually land
const starsLo = probe('astral_stars', 20, 100), starsHi = probe('astral_stars', 300, 100);
check('Starfield density knob changes the stars', Math.abs(starsHi.geo - starsLo.geo) > 1);
const fogLo = probe('astral_fog', 10, 100), fogHi = probe('astral_fog', 260, 100);
check('Nebula density knob changes the fog', Math.abs(fogHi.geo - fogLo.geo) > 1 || fogLo.dims !== fogHi.dims);

// ---- the Rorschach must leave the card mostly empty ----
// It previously drew opaque lobes across most of the half and, through
// color-burn, turned the whole card black.
M.resetCreatedCanvases();
getTextureCanvas('inkbleed', 800, 800, { seed: 3, p1: 100, p2: 100 });
let inkArea = 0;
for(const cv of M.createdCanvases) inkArea += cv.getContext('2d')._stats.radiusSum;
check('the Rorschach covers only a small part of the card', inkArea < 800 * 2);

// ---- aurora must paint something ----
M.resetCreatedCanvases();
getTextureCanvas('aurora', 800, 800, { seed: 3, p1: 100, p2: 100 });
let auroraGeo = 0;
for(const cv of M.createdCanvases) auroraGeo += cv.getContext('2d')._stats.pathLen;
check('the aurora draws visible ribbons, not invisible slices', auroraGeo > 1000);

// ---- readouts ----
// A count slider should say how many things it draws, not what percentage of
// some invisible default it is at.
const counted = Object.keys(TEXTURE_PARAMS).filter(t => TEXTURE_PARAMS[t].some(d => d.base != null));
check('most textures report an absolute count', counted.length >= 13);
const badBase = Object.keys(TEXTURE_PARAMS).filter(t =>
  TEXTURE_PARAMS[t].some(d => d.base != null && !(d.base > 0)));
check('every declared base is a positive count', badBase.length === 0);
// the readout must stay sane at both ends: a count slider at its lowest still draws something
const sample = TEXTURE_PARAMS['magicparticles'][1], count = v => parseInt(paramReadout(sample, v).replace(/\D/g, ''), 10);
check('an absolute readout never reaches zero', sample.base > 0 && count(sample.min) >= 1 && count(0) >= 1 && count(sample.max) > count(sample.min));

// ---- tints reach their generators ----
for(const t of ['metalleaf','aurora','astral'])
  check(`${t} accepts a tint`, (TEXTURE_CAPS[t] || {}).tints >= 1);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
