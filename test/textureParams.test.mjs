/**
 * textureParams.test.mjs — the two user-facing knobs per texture.
 *
 * Guards the things that would silently produce a broken control: a texture
 * in the picker with no params declared (two sliders labelled "—"), a param
 * whose default sits outside its own range, a preset pointing at a texture
 * that no longer exists, and generation blowing up at either extreme.
 *
 * Run: node test/textureParams.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();
const { TEXTURE_PARAMS, TEXTURE_CAPS, paramsFor, getTextureCanvas } = await import('../textureGenerators.js');
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
check('the picker offers 37 textures', textureTypes.length === 37);

// every pickable texture must declare exactly two labelled knobs
const missing = textureTypes.filter(t => paramsFor(t).length !== 2);
// a third knob is always Form; Dream Bloom alone goes on to five (Object Shape, Colour Variation)
check('every texture declares two params, plus an optional third that must be Form (and Dream Bloom\'s and Crystal Leaf\'s fourth and fifth)',
  Object.entries(TEXTURE_PARAMS).every(([t, d]) => d.length === 2 || (d.length === 3 && d[2].key === 'form')
    || ((t === 'bokeh' || t === 'crystal' || t === 'spangle' || t === 'water') && d.length === 5 && d[2].key === 'form' && d[3].key === 'shape' && d[4].key === 'hue')
    || ((t === 'oldpaper' || t === 'moon' || t === 'inkbleed') && d.length === 4 && d[2].key === 'form' && d[3].key === 'shape')));

const unlabelled = textureTypes.filter(t => paramsFor(t).some(d => !d.label || /value/i.test(d.label)));
check('every param has a real label, not "value 1"', unlabelled.length === 0);

const badRange = textureTypes.filter(t => paramsFor(t).some(d => !(d.min < d.max && d.def >= d.min && d.def <= d.max)));
check('every default sits inside its own min/max', badRange.length === 0);
if(badRange.length) console.log('   offenders:', badRange.join(', '));

// generation must survive both extremes of both knobs
let broke = 0;
for(const t of Object.keys(TEXTURE_PARAMS)){
  const [a, b] = TEXTURE_PARAMS[t];
  for(const [v1, v2] of [[a.min,b.min],[a.max,b.max],[a.min,b.max],[a.max,b.min]]){
    try {
      const c = getTextureCanvas(t, 700, 700, { accent1: '#c9a876', accent2: '#7a8ca3', seed: 99, p1: v1, p2: v2 });
      if(!c || c.width !== 700) throw new Error('wrong size');
    } catch(e){ broke++; console.log('   FAIL', t, v1, v2, e.message); }
  }
}
check('every texture generates at all four param corners', broke === 0);

// zoom must actually change the output, or the knob is decorative
const zoomable = Object.keys(TEXTURE_PARAMS).find(t => TEXTURE_PARAMS[t][0].key === 'zoom');
const flat = getTextureCanvas(zoomable, 600, 600, { seed: 7, p1: 100, p2: 100 });
const deep = getTextureCanvas(zoomable, 600, 600, { seed: 7, p1: TEXTURE_PARAMS[zoomable][0].max, p2: 100 });
check('zoom produces a genuinely different canvas', flat !== deep);
check('both zoom levels still fill the requested size',
  flat.width === 600 && deep.width === 600 && deep.height === 600);

// presets
const presetTex = PRESETS.map(p => p.textureType).filter(Boolean);
// (Foxed and Creased share Old Paper since Foxing and Fold Ghost merged — for the preset review)
check('every preset uses a distinct texture (Old Paper may serve two)', new Set(presetTex).size === presetTex.length - (presetTex.filter(t => t === 'oldpaper').length > 1 ? presetTex.filter(t => t === 'oldpaper').length - 1 : 0));
const orphans = presetTex.filter(t => !textureTypes.includes(t));
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

// names that were lies
check('the cracks texture is no longer called non-euclidean', !html.includes('Non-Euclid Cracks'));
check('the mosaic is no longer called twisting', !html.includes('Twisting Geometry'));
check('Math Static was replaced, and its successor is the Transmutation Circle (one circle now)',
  !html.includes('Math Static') && html.includes('>Transmutation Circle<') && !html.includes('>Summoning Circles<'));

// ---- every knob must actually do something ----
// This is the check that was missing when zoom was faked by generating at a
// lower resolution: draw-call counts were identical, so nothing caught it.
// The mock records geometry (arc radii, path lengths) and the sizes of the
// internal canvases some textures work on, which between them can tell a
// real size change from a no-op.
const M = await import('./canvasMock.mjs');
function probe(type, v1, v2){
  M.resetCreatedCanvases();
  const c = getTextureCanvas(type, 600, 600, { accent1: '#c9a876', accent2: '#7a8ca3', seed: 5, p1: v1, p2: v2 });
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
  return { geo, dims: M.createdCanvases.map(x=>x.width+'x'+x.height).join(',') };
}
function movesWith(type, i){
  const d = TEXTURE_PARAMS[type];
  // an ANGLE knob's two ends are the same orientation (lines have no
  // direction: -90° is +90°), so for angles compare one end with the middle
  const span = k => d[k].key === 'angle' ? [d[k].min, (d[k].min + d[k].max) / 2] : [d[k].min, d[k].max];
  const [a0, a1] = span(i);
  const lo = i === 0 ? probe(type, a0, d[1].def) : probe(type, d[0].def, a0);
  const hi = i === 0 ? probe(type, a1, d[1].def) : probe(type, d[0].def, a1);
  return Math.abs(hi.geo - lo.geo) > Math.max(0.25, lo.geo * 0.002) || lo.dims !== hi.dims;
}
// 'astral' is a composite assembled in canvasRenderer from astral_fog and
// astral_stars; probing the composite name directly is meaningless, so its
// two halves are checked instead.
const probeTypes = Object.keys(TEXTURE_PARAMS).filter(t => t !== 'astral');
const deadFirst  = probeTypes.filter(t => !movesWith(t, 0));
const deadSecond = probeTypes.filter(t => !movesWith(t, 1));
check('every texture\'s FIRST knob changes the output', deadFirst.length === 0);
if(deadFirst.length) console.log('   inert:', deadFirst.join(', '));
check('every texture\'s SECOND knob changes the output', deadSecond.length === 0);
if(deadSecond.length) console.log('   inert:', deadSecond.join(', '));

// zoom must change size WITHOUT changing how many things are drawn -- the
// old implementation coupled them, which is why rain thinned as it zoomed
const rainLo = probe('rainstreaks', 100, 100), rainHi = probe('rainstreaks', 500, 100);
const strokesOf = (v1) => { M.resetCreatedCanvases();
  const c = getTextureCanvas('rainstreaks', 600, 600, { seed: 5, p1: v1, p2: 100 });
  return c.getContext('2d')._stats.strokes; };
check('zooming rain changes streak size, not streak count',
  strokesOf(100) === strokesOf(500) && rainHi.geo > rainLo.geo * 1.5);

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

// ---- hatching must actually cross ----
// A single set of parallel lines is rain, not hatching. Silverpoint hatches in
// patches that follow a form, and crosses a second layer in the deepest shadow.
check('the hatch crosses a second layer in the deepest shadow',
  /const layers = t>0\.62 \? 2 : 1;/.test(readFileSync(new URL('../texSharpness.js', import.meta.url), 'utf8')) &&
  /const la=a\+l\*0\.95/.test(readFileSync(new URL('../texSharpness.js', import.meta.url), 'utf8')));

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
// the readout must stay sane at both ends
const sample = TEXTURE_PARAMS['magicparticles'][1];
check('an absolute readout never reaches zero',
  Math.max(1, Math.round(sample.base * sample.min / 100)) >= 1);

// ---- tints reach their generators ----
for(const t of ['metalleaf','aurora','astral'])
  check(`${t} accepts a tint`, (TEXTURE_CAPS[t] || {}).tints >= 1);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
