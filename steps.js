/**
 * steps.js — THE STEPS: the small operations Vellum's surfaces are made of,
 * shared by the Athanor (its parts) and the textures rebuilt as chains of them
 * (chains.js). One library, so a texture is a graph of steps anyone can open,
 * take apart and make their own.
 *
 * A step: { cat, label, ins, outs, params, cost, run(E, n) }
 *   ins / outs   port names, in order (Drawflow numbers them from 1)
 *   params       [key, label, kind, default, extra] — kind: range (min, max),
 *                select (options), text, texture, stitch
 *   cost         about how many passes over the page it makes (the budget)
 *   run          (E, n) → [outputs]: E is the evaluator's working set
 *                (athanor.js evalAthanor), n the node (its data are the params)
 * Values travel as fields (Float32Array, 0..1), images ({ r, g, b } fields),
 * colours ([r, g, b]) and plain numbers — see athanor.js.
 *
 * A param may be BOUND instead of set (the long refactor's knob-driven steps):
 *   '@k1'…'@k6'   that slider of the surface, across the param's own range
 *   '@k2[10,700]' …or across the range written (a texture's own slider range)
 *   '@dial'       the dial's direction, in degrees (0: from above, clockwise)
 *   '@tilt'       how low the dial's light is (0..130)
 * so one step serves a texture's slider directly (athanor.js resolves them).
 *
 * Families of steps live beside this file and are gathered here: stepsTouch.js
 * (weave, cloth — Linen; panes, glass — Stained Glass; flakes — Scattered
 * Polygons), stepsChaos.js (crazing, brushwork, glaze — Fractured Glaze),
 * stepsWhimsy.js (smoke, light shaft, dust motes — Sleep Haze; painted sky,
 * painted ridges, watercolour wash — Painted Landscape), cartomancy.js (table,
 * deal, coins).
 *
 * MARKS steps (streaks, hatching) draw strokes on a canvas the size of the
 * working grid and read it back as a field — the generators' own way of
 * drawing, kept inside a step. Their sizes are in canonical pixels (E.px).
 */
import { makeNoiseGrid, sampleNoiseGrid, canonDiv, smoothField } from './texCore.js';
import { drawStitch, pathFromPoints, roundRectPoints } from './stitches.js';
import { TOUCH_STEPS } from './stepsTouch.js';
import { WHIMSY_STEPS } from './stepsWhimsy.js';
import { LIGHT_STEPS } from './stepsLight.js';
import { SHARP_STEPS } from './stepsSharpness.js';
import { CHAOS_STEPS } from './stepsChaos.js';
import { GEN_STEPS } from './stepsGenerative.js';
import { PATTERN_STEPS } from './stepsPatterns.js';
import { CARD_STEPS } from './cartomancy.js';

const STEP_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const STEP_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
export const STEP_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'darken', 'lighten', 'color-dodge', 'color-burn',
  'difference', 'exclusion', 'vivid-light', 'linear-light', 'pin-light', 'linear-burn', 'subtract', 'divide'];
export const STEP_CATEGORIES = ['Inputs', 'Noise', 'Marks', 'Textures', 'Shape', 'Curves', 'Combine', 'Light & Color', 'Output'];

// ---- blends, as the canvas and the GPU do them (per channel, 0..1) ----
const STEP_SOFT = (b, s) => s <= 0.5 ? b - (1 - 2*s)*b*(1 - b) : b + (2*s - 1)*((b <= 0.25 ? ((16*b - 12)*b + 4)*b : Math.sqrt(b)) - b);
export const STEP_BLEND_FN = {
  'normal': (b, s) => s, 'source-over': (b, s) => s,
  'multiply': (b, s) => b*s, 'screen': (b, s) => 1 - (1 - b)*(1 - s),
  'overlay': (b, s) => b < 0.5 ? 2*b*s : 1 - 2*(1 - b)*(1 - s), 'hard-light': (b, s) => s < 0.5 ? 2*b*s : 1 - 2*(1 - b)*(1 - s),
  'soft-light': STEP_SOFT, 'darken': Math.min, 'lighten': Math.max,
  'color-dodge': (b, s) => s >= 1 ? 1 : Math.min(1, b/(1 - s)), 'color-burn': (b, s) => s <= 0 ? 0 : 1 - Math.min(1, (1 - b)/s),
  'difference': (b, s) => Math.abs(b - s), 'exclusion': (b, s) => b + s - 2*b*s,
  'vivid-light': (b, s) => s < 0.5 ? (s <= 0 ? 0 : 1 - (1 - b)/(2*s)) : (s >= 1 ? 1 : b/(2*(1 - s))),
  'linear-light': (b, s) => b + 2*s - 1, 'pin-light': (b, s) => s < 0.5 ? Math.min(b, 2*s) : Math.max(b, 2*s - 1),
  'linear-burn': (b, s) => b + s - 1, 'subtract': (b, s) => b - s, 'divide': (b, s) => b/Math.max(s, 1/255),
};

// ---- the parts as the editor shows them ----
const STEP_PARTS = {
  // inputs: what the finished texture offers on the page
  knob:     { cat: 'Inputs', label: 'Knob', ins: [], outs: ['value'], params: [STEP_SEL('slot', 'Slider', ['1','2','3','4','5','6']), ['name', 'Name', 'text', 'Amount'], STEP_R('def', 'Default', 50)] },
  hue:      { cat: 'Inputs', label: 'Hue', ins: [], outs: ['colour'], params: [STEP_SEL('slot', 'Hue', ['1','2']), ['name', 'Name', 'text', 'Light Hue']] },
  glowhue:  { cat: 'Inputs', label: 'Glow Hue', ins: [], outs: ['colour'], params: [] },
  dial:     { cat: 'Inputs', label: 'Light Dial', ins: [], outs: ['direction', 'height'], params: [] },
  seed:     { cat: 'Inputs', label: 'Seed', ins: [], outs: ['seed'], params: [] },
  page:     { cat: 'Inputs', label: 'Page Coordinates', ins: [], outs: ['x', 'y', 'radius'], params: [] },
  // makers
  noise:    { cat: 'Noise', label: 'Value Noise', ins: ['seed'], outs: ['field'], params: [STEP_R('scale', 'Scale', 40, 1, 200), STEP_R('octaves', 'Octaves', 3, 1, 6), STEP_R('variation', 'Variation', 0, 0, 99)] },
  cells:    { cat: 'Noise', label: 'Cells', ins: ['seed'], outs: ['distance', 'edges', 'id'], params: [STEP_R('scale', 'Scale', 30, 2, 200), STEP_R('jitter', 'Jitter', 80), STEP_R('variation', 'Variation', 0, 0, 99)] },
  waves:    { cat: 'Noise', label: 'Waves', ins: ['warp'], outs: ['field'], params: [STEP_R('freq', 'Frequency', 12, 1, 120), STEP_R('angle', 'Angle', 0, 0, 360)] },
  gradient: { cat: 'Noise', label: 'Gradient', ins: [], outs: ['field'], params: [STEP_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular']), STEP_R('angle', 'Angle', 90, 0, 360)] },
  turing:   { cat: 'Noise', label: 'Reaction–Diffusion', ins: ['seed'], outs: ['field'], params: [STEP_SEL('pattern', 'Pattern', ['spots', 'coral', 'maze', 'worms', 'holes']), STEP_R('scale', 'Scale', 100, 50, 250)] },
  texture:  { cat: 'Textures', label: 'Texture from the Menu', ins: ['seed'], outs: ['image', 'grey'], params: [['type', 'Texture', 'texture', 'linen'], STEP_R('p1', 'Knob 1', 100, 0, 400), STEP_R('p2', 'Knob 2', 100, 0, 400), STEP_R('p3', 'Knob 3', 50)] },
  stitch:   { cat: 'Textures', label: 'Stitch Border', ins: [], outs: ['mask'], params: [['style', 'Stitch', 'stitch', 'scallop'], STEP_R('offset', 'Offset', 14, 0, 400), STEP_R('size', 'Size', 4, 1, 40)] },
  // shaping
  levels:   { cat: 'Shape', label: 'Levels', ins: ['field'], outs: ['field'], params: [STEP_R('lo', 'Low', 0), STEP_R('hi', 'High', 100), STEP_R('gamma', 'Gamma', 50)] },
  threshold:{ cat: 'Shape', label: 'Threshold', ins: ['field'], outs: ['mask'], params: [STEP_R('at', 'At', 50), STEP_R('soft', 'Softness', 10)] },
  blur:     { cat: 'Shape', label: 'Blur', ins: ['field'], outs: ['field'], params: [STEP_R('radius', 'Radius', 8, 0, 100)] },
  warp:     { cat: 'Shape', label: 'Warp', ins: ['field', 'by'], outs: ['field'], params: [STEP_R('amount', 'Amount', 20)] },
  math:     { cat: 'Combine', label: 'Math', ins: ['a', 'b'], outs: ['result'], params: [STEP_SEL('op', 'Operation', ['add', 'multiply', 'max', 'min', 'difference', 'subtract', 'divide', 'power', 'average', 'screen', 'modulo', 'sine'])] },
  mix:      { cat: 'Combine', label: 'Mix', ins: ['a', 'b', 'amount'], outs: ['result'], params: [STEP_R('t', 'Amount', 50)] },
  invert:   { cat: 'Shape', label: 'Invert', ins: ['field'], outs: ['field'], params: [] },
  posterize:{ cat: 'Shape', label: 'Posterize', ins: ['field'], outs: ['field'], params: [STEP_R('steps', 'Steps', 5, 2, 16)] },
  transform:{ cat: 'Shape', label: 'Tile & Rotate', ins: ['field'], outs: ['field'], params: [STEP_R('scale', 'Scale', 100, 25, 400), STEP_R('angle', 'Angle', 0, 0, 360)] },
  edges:    { cat: 'Shape', label: 'Edge Detect', ins: ['field'], outs: ['edges'], params: [STEP_R('strength', 'Strength', 50)] },
  // light and colour
  light:    { cat: 'Light & Color', label: 'Light (heights)', ins: ['height', 'dial'], outs: ['light', 'highlight'], params: [STEP_R('relief', 'Relief', 50), STEP_R('gloss', 'Gloss', 30), STEP_R('shadow', 'Shadow', 60)] },
  tint:     { cat: 'Light & Color', label: 'Tint', ins: ['field', 'light hue', 'dark hue'], outs: ['image'], params: [] },
  ramp:     { cat: 'Light & Color', label: 'Color Ramp', ins: ['field', 'color a', 'color b'], outs: ['image'], params: [STEP_R('mid', 'Middle', 50)] },
  blend:    { cat: 'Combine', label: 'Blend', ins: ['base', 'layer', 'mask'], outs: ['image'], params: [STEP_SEL('mode', 'Mode', STEP_BLENDS), STEP_R('opacity', 'Opacity', 100)] },
  // the end
  surface:  { cat: 'Output', label: 'Surface', ins: ['image', 'height'], outs: [], params: [['name', 'Name', 'text', 'My Surface'], STEP_SEL('ground', 'Ground', ['grey', 'colour']),
              // Filter Forge's SIZE: every distance in the graph is measured against it, so one slider scales the whole surface
              STEP_R('size', 'Size', 100, 25, 400)] },
  // a NOTE on the graph (Filter Forge's Note component): words for whoever opens it next; it makes nothing
  note:     { cat: 'Inputs', label: 'Note', ins: [], outs: [], params: [['text', 'Note', 'text', 'A note to the next reader']] },
  // newer parts (the chains' own)
  colour:   { cat: 'Inputs', label: 'Color', ins: [], outs: ['colour'], params: [['hex', 'Color', 'text', '#808080']] },
  // the page's own two accent colors (Cartomancy's first two suits)
  accent:   { cat: 'Inputs', label: 'Accent', ins: [], outs: ['colour'], params: [STEP_SEL('slot', 'Accent', ['1', '2']), ['name', 'Name', 'text', 'Accent']] },
  forms:    { cat: 'Noise', label: 'Soft Forms', ins: [], outs: ['tone'], params: [STEP_R('count', 'Forms', 5, 1, 12), STEP_R('size', 'Size', 50), STEP_R('noise', 'Noise', 50)] },
  streaks:  { cat: 'Marks', label: 'Streaks', ins: ['base'], outs: ['field'], params: [STEP_SEL('kind', 'Kind', ['streaks', 'sheets']), STEP_R('angle', 'From', 0, 0, 360),
              STEP_R('spread', 'Gusts', 0, 0, 40), STEP_R('length', 'Length', 100, 100, 500), STEP_R('count', 'Count', 100, 0, 400), STEP_R('light', 'Light Share', 75), STEP_R('strength', 'Strength', 50)] },
  hatching: { cat: 'Marks', label: 'Hatching', ins: ['tone'], outs: ['ink'], params: [STEP_R('angle', 'Direction', 125, 0, 360), STEP_R('density', 'Density', 100, 10, 700),
              STEP_R('size', 'Patch Size', 100, 25, 400), STEP_R('cross', 'Cross-Hatching', 38), STEP_R('crossAngle', 'Cross Angle', 54, 10, 90), STEP_R('weight', 'Weight', 50)] },
  // the way Filter Forge folds a picture: mirror it round the centre, or wrap it into rings
  kaleidoscope: { cat: 'Shape', label: 'Kaleidoscope', ins: ['field'], outs: ['field'], params: [STEP_R('folds', 'Folds', 6, 2, 16), STEP_R('turn', 'Turn', 0, 0, 360), STEP_R('zoom', 'Zoom', 100, 25, 400)] },
  polar:    { cat: 'Shape', label: 'Polar Wrap', ins: ['field'], outs: ['field'], params: [STEP_R('rings', 'Rings', 100, 25, 400), STEP_R('turn', 'Turn', 0, 0, 360)] },
  // numbers to wire into any ⚙ setting (Ruby: some settings could only be set by a wire — now anything can be random)
  number:   { cat: 'Inputs', label: 'Number', ins: [], outs: ['value'], params: [STEP_R('value', 'Value', 50)] },
  random:   { cat: 'Inputs', label: 'Random Number', ins: [], outs: ['value'], params: [STEP_R('lo', 'Lowest', 0), STEP_R('hi', 'Highest', 100)] },
  // reshaping a grey map's values; masks drawn from shapes
  maprange: { cat: 'Shape', label: 'Map Range', ins: ['field'], outs: ['field'], params: [STEP_R('inLo', 'From Low', 0), STEP_R('inHi', 'From High', 100), STEP_R('outLo', 'To Low', 0), STEP_R('outHi', 'To High', 100)] },
  shape:    { cat: 'Noise', label: 'Shape Mask', ins: [], outs: ['mask'], params: [STEP_SEL('form', 'Shape', ['circle', 'ring', 'square', 'diamond', 'star', 'vignette']),
              STEP_R('size', 'Size', 60, 5, 150), STEP_R('soft', 'Softness', 10), STEP_R('x', 'Across', 50), STEP_R('y', 'Down', 50)] },
  // the COMBINE family: pictures taken apart and put together
  split:    { cat: 'Combine', label: 'Split Channels', ins: ['picture'], outs: ['red', 'green', 'blue', 'brightness'], params: [] },
  merge:    { cat: 'Combine', label: 'Merge Channels', ins: ['red', 'green', 'blue'], outs: ['picture'], params: [] },
  switch:   { cat: 'Combine', label: 'Switch', ins: ['a', 'b', 'choose'], outs: ['result'], params: [STEP_R('at', 'Switch At', 50)] },
  hsv:      { cat: 'Light & Color', label: 'Hue & Saturation', ins: ['picture'], outs: ['picture'], params: [STEP_R('hue', 'Hue Turn', 0, 0, 360), STEP_R('sat', 'Saturation', 100, 0, 200), STEP_R('val', 'Brightness', 100, 0, 200)] },
  // CURVES (Filter Forge's third kind of part): a shape from 0 to 1 that other parts read through — a tone curve,
  // a gradient's profile, a bevel. Made by Curve, changed by Curve Ops, used by Tone Curve and Profile Gradient.
  curve:    { cat: 'Curves', label: 'Curve', ins: [], outs: ['curve'], params: [STEP_SEL('shape', 'Shape', ['linear', 'bias', 'gain', 'gamma', 'gaussian', 'impulse', 'stairs', 'step', 'wave', 'arc', 'noise']),
              STEP_R('amount', 'Bend', 50), STEP_R('count', 'Count', 4, 1, 24), STEP_R('low', 'Lowest', 0), STEP_R('high', 'Highest', 100), STEP_R('variation', 'Variation', 0, 0, 99)] },
  curveops: { cat: 'Curves', label: 'Curve Ops', ins: ['curve', 'curve b'], outs: ['curve'], params: [STEP_SEL('op', 'Operation', ['frequency', 'phase', 'repeat', 'reverse', 'invert', 'amplitude', 'blend', 'multiply', 'max', 'min']),
              STEP_R('amount', 'Amount', 50), STEP_R('count', 'Times', 2, 1, 16)] },
  tonecurve:{ cat: 'Curves', label: 'Tone Curve', ins: ['picture', 'curve'], outs: ['picture'], params: [STEP_R('mix', 'Strength', 100)] },
  profile:  { cat: 'Curves', label: 'Profile Gradient', ins: ['curve', 'along'], outs: ['field'], params: [STEP_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular', 'along a map']), STEP_R('angle', 'Angle', 90, 0, 360), STEP_R('repeat', 'Repeat', 1, 1, 12)] },
  // FILTER FORGE'S PRIMITIVES that were missing (Adjustments, Processing, Transform, Noise, Patterns)
  bricon:   { cat: 'Light & Color', label: 'Brightness & Contrast', ins: ['picture'], outs: ['picture'], params: [STEP_R('bright', 'Brightness', 0, -100, 100), STEP_R('contrast', 'Contrast', 0, -100, 100)] },
  highpass: { cat: 'Shape', label: 'High Pass', ins: ['field'], outs: ['field'], params: [STEP_R('radius', 'Radius', 10, 1, 100), STEP_R('gain', 'Gain', 50)] },
  sharpen:  { cat: 'Shape', label: 'Sharpen', ins: ['field'], outs: ['field'], params: [STEP_R('amount', 'Amount', 50, 0, 200), STEP_R('radius', 'Radius', 4, 1, 50)] },
  motionblur:{ cat: 'Shape', label: 'Motion Blur', ins: ['field'], outs: ['field'], params: [STEP_R('length', 'Length', 20, 0, 100), STEP_R('angle', 'Angle', 0, 0, 360)] },
  offset:   { cat: 'Shape', label: 'Offset', ins: ['field'], outs: ['field'], params: [STEP_R('x', 'Across', 0, -100, 100), STEP_R('y', 'Down', 0, -100, 100)] },
  perlin:   { cat: 'Noise', label: 'Perlin Noise', ins: ['seed'], outs: ['field'], params: [STEP_R('scale', 'Scale', 40, 1, 200), STEP_R('details', 'Details', 4, 1, 8), STEP_R('rough', 'Roughness', 50), STEP_R('contrast', 'Contrast', 30), STEP_R('variation', 'Variation', 0, 0, 99)] },
  bricks:   { cat: 'Noise', label: 'Bricks', ins: ['bevel'], outs: ['bricks', 'mortar', 'each brick'], params: [STEP_R('rows', 'Rows', 12, 2, 60), STEP_R('ratio', 'Length', 200, 100, 400),
              STEP_R('mortar', 'Mortar', 12, 0, 40), STEP_R('stagger', 'Stagger', 50), STEP_R('bevel', 'Bevel', 30), STEP_R('vary', 'Variety', 30)] },
  // THE POEM ITSELF as an input (the doc of future directions: "readability as part of the shader"): where its words,
  // lines and stanzas sit on the page, measured by the page as it sets the text (canvasRenderer's text layout)
  poem:     { cat: 'Inputs', label: 'The Poem', ins: [], outs: ['words', 'distance', 'lines', 'stanzas', 'rhymes'],
              params: [STEP_R('padding', 'Padding', 40, 0, 200), STEP_R('softness', 'Softness', 40), STEP_R('reach', 'Reach', 35, 5, 100),
                STEP_SEL('rhyme', 'Rhymes', ['every rhyme', 'A', 'B', 'C', 'D', 'E', 'F'])] },
  // more ways to reshape a gray map (Filter Forge's and Blender's staples)
  grow:     { cat: 'Shape', label: 'Grow & Shrink', ins: ['field'], outs: ['field'], params: [STEP_R('amount', 'Amount', 60, 0, 100), STEP_R('radius', 'Radius', 12, 1, 100)] },
  pixelate: { cat: 'Shape', label: 'Pixelate', ins: ['field'], outs: ['field'], params: [STEP_R('size', 'Cell Size', 20, 2, 200), STEP_SEL('cell', 'Cells', ['squares', 'bricks', 'diamonds'])] },
  twirl:    { cat: 'Shape', label: 'Twirl', ins: ['field'], outs: ['field'], params: [STEP_R('angle', 'Twist', 180, -720, 720), STEP_R('radius', 'Radius', 70, 5, 150), STEP_R('x', 'Across', 50), STEP_R('y', 'Down', 50)] },
  mirror:   { cat: 'Shape', label: 'Mirror', ins: ['field'], outs: ['field'], params: [STEP_SEL('axis', 'Mirror', ['left to right', 'top to bottom', 'both', 'diagonal']), STEP_R('at', 'Fold At', 50)] },
  chroma:   { cat: 'Light & Color', label: 'Chromatic Offset', ins: ['picture'], outs: ['picture'], params: [STEP_R('amount', 'Offset', 20), STEP_R('angle', 'Angle', 0, 0, 360), STEP_R('edge', 'Toward the Edges', 0)] },
};
/** A curve's value at t (0..1), between its samples ({ curve: Float32Array(257) }). */
export function curveAt(c, t){ const s = c.curve, n = s.length - 1, x = Math.max(0, Math.min(1, t))*n, i = Math.min(n - 1, Math.floor(x)), f = x - i; return s[i] + (s[i + 1] - s[i])*f; }
const stepCurve = fn => { const s = new Float32Array(257); for(let i = 0; i <= 256; i++) s[i] = Math.max(-1, Math.min(2, fn(i/256))); return { curve: s }; };
// Perlin's bias and gain (Perlin & Hoffert 1989), the curves Filter Forge names after them
const stepBias = (t, b) => { b = Math.max(0.001, Math.min(0.999, b)); return Math.pow(Math.max(0, t), Math.log(b)/Math.log(0.5)); };
const stepGain = (t, g) => t < 0.5 ? stepBias(2*t, 1 - g)/2 : 1 - stepBias(2 - 2*t, 1 - g)/2;
// The poem's runs, as the page measured them: "x0,y0,x1,y1,line,stanza;…" in fractions of the page
export function poemRuns(text){
  const out = [];
  for(const part of String(text || '').split(';')){ const v = part.split(',').map(Number); if(v.length >= 6 && v.every(isFinite)) out.push(v); }
  return out;
}
// one row (or column) of an exact distance transform (Felzenszwalb & Huttenlocher 2012): squared distances in place
function stepEdt1(f, n, d, v, z){
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for(let q = 1; q < n; q++){
    let s2 = ((f[q] + q*q) - (f[v[k]] + v[k]*v[k]))/(2*q - 2*v[k]);
    while(s2 <= z[k]){ k--; s2 = ((f[q] + q*q) - (f[v[k]] + v[k]*v[k]))/(2*q - 2*v[k]); }
    k++; v[k] = q; z[k] = s2; z[k + 1] = Infinity;
  }
  k = 0; for(let q = 0; q < n; q++){ while(z[k + 1] < q) k++; d[q] = (q - v[k])*(q - v[k]) + f[v[k]]; }
}
/** The distance (in cells) from every cell to the nearest cell of a mask (> 0.5): exact, linear time. */
export function stepDistance(mask, ww, wh){
  const BIG = 1e12, g = new Float64Array(ww*wh), m = Math.max(ww, wh);
  const f = new Float64Array(m), d = new Float64Array(m), v = new Int32Array(m), z = new Float64Array(m + 1);
  for(let x = 0; x < ww; x++){ for(let y = 0; y < wh; y++) f[y] = mask[y*ww + x] > 0.5 ? 0 : BIG; stepEdt1(f, wh, d, v, z); for(let y = 0; y < wh; y++) g[y*ww + x] = d[y]; }
  const out = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++){ for(let x = 0; x < ww; x++) f[x] = g[y*ww + x]; stepEdt1(f, ww, d, v, z); for(let x = 0; x < ww; x++) out[y*ww + x] = Math.sqrt(d[x]); }
  return out;
}
/**
 * WHAT EACH PART DOES, in a sentence a person can use (the parts list, the
 * menus and the Help show these). Plain and instructive: what goes in, what
 * comes out, what to try.
 */
export const STEP_DOCS = {
  knob: 'One of the six page sliders, as 0–1. Wire it into a ⚙ to drive that setting from the page; Name labels the slider.',
  hue: 'One of the texture\'s two hue pickers, as a color.',
  glowhue: 'The texture\'s Glow Hue, as a color (black when off). Screen it in through a mask.',
  pours: 'Poured pools that merge where they touch. Splatter flings drops away from the dial\'s direction. Feed it to Meniscus.',
  meniscus: 'Gives pooled liquid a surface. Outputs: height, coverage, thin areas (translucent) and thick areas.',
  accent: 'One of the page\'s two accent colors (set under Thoughtforms).',
  colour: 'A fixed color, typed as a hex code.',
  dial: 'The light dial: direction (0–1 around the circle) and height.',
  seed: 'The page seed, as 0–1. Wire into a seed port to shift a pattern with the seed.',
  page: 'Page coordinates per point: x, y, and radius from the center, each 0–1.',
  number: 'A constant, 0–1. Wire into a ⚙ to set it exactly.',
  random: 'A random number between Lowest and Highest, new with each page seed.',
  noise: 'Value noise (gray map). Scale: features across the page. Octaves: added fine detail.',
  cells: 'Voronoi cells. Outputs: distance to center, cell edges, and a random gray per cell.',
  waves: 'Sine stripes. A gray map in Warp bends them.',
  gradient: 'Linear, radial or square gradient.',
  turing: 'Reaction–diffusion: spots, coral, mazes, worms. Kept for older graphs; Turing Pattern is the newer part.',
  forms: 'A few large soft shapes, dark where a drawing is dark.',
  shape: 'A shape mask: circle, ring, square, diamond, star or vignette.',
  panes: 'Stained-glass panes: shards, lattice, rose or grid, optionally framed as a lancet, arcade or round window. Outputs: lead, distance to lead, pane id, color slot, window, joints.',
  smoke: 'Layered haze and rising wisps. Output: density.',
  brushwork: 'Paint thickness as a gray map: streaks, runs and pools.',
  streaks: 'Rain streaks, from far sheets to near strokes, over the input. From sets direction; Gusts varies it.',
  hatching: 'Pencil hatching, denser where the input is dark, at the angle you set.',
  flakes: 'Metal-leaf flakes over the input, in the leaf hue. Second output: their mask.',
  motes: 'Dust specks, visible only inside a beam (from Light Shaft).',
  ridges: 'Painted mountain ridges in receding bands, over the sky that comes in.',
  deal: 'Cards and coins from one of eleven games, laid over a Table. The four color ports are the suits. Clutter adds objects; Wear damages cards.',
  objects: 'Objects left on a table (candles, cups, dice, keys, letters…). Kind seed lets the seed choose and keeps them to the edges.',
  coins: 'Scattered and stacked coins. Second output: their mask.',
  texture: 'Any texture from the Surface menu, as a picture to process further.',
  stitch: 'A stitched border around the page, as a mask.',
  weave: 'Woven fabric: silk, twill, linen, canvas or burlap.',
  cloth: 'Colors a weave with two hues and adds seams, stitching and buttons, lit by the dial.',
  crazing: 'Fine crazing in old glaze. Outputs: height, glaze, grime, fine cracks.',
  table: 'A tabletop under a lamp: felt, velvet, wood, marble, slate or linen.',
  sky: 'A painted sky: time of day, sun or moon, clouds.',
  levels: 'Input levels: Low and High set the black and white points; Gamma moves the midtones.',
  threshold: 'Black and white at a cutoff. Softness feathers the edge.',
  blur: 'Box blur. Radius sets the width.',
  warp: 'Displaces a gray map by a second map.',
  invert: 'Inverts a gray map: black becomes white.',
  posterize: 'Quantizes a gray map into flat steps.',
  transform: 'Scales and rotates a gray map, tiling past its edges.',
  edges: 'Edge detection: bright where the map changes fastest.',
  kaleidoscope: 'Mirrors a gray map into wedges around the center.',
  note: 'A text note on the graph. Does nothing; takes no wires.',
  bricon: 'Brightness and contrast. Both accept a gray map, so they can vary across the page.',
  highpass: 'High-pass filter: keeps fine detail around mid-gray. Good input for a height map\'s grain.',
  sharpen: 'Unsharp mask: pushes each value away from its local blur, for crisper edges.',
  motionblur: 'Directional blur. Try it on noise for rain or brushed metal.',
  offset: 'Shifts a gray map across and down, wrapping at the edges.',
  perlin: 'Perlin noise (fBm). Details: octaves. Roughness: persistence. Contrast pushes toward black and white.',
  bricks: 'Brick pattern. Outputs: beveled height (a curve can shape the bevel), mortar mask, and a gray per brick.',
  curve: 'A 0–1 curve: bias, gain, gamma, gaussian, impulse, stairs, step, wave, arc or noise. Feeds Tone Curve and Profile Gradient.',
  curveops: 'Edits a curve: repeat, phase, reverse, invert, amplitude, or combine with a second curve.',
  tonecurve: 'Runs a gray map or picture through a curve, like Curves in a photo editor.',
  profile: 'A gradient shaped by a curve: linear, radial, rectangular, or along any gray map.',
  poem: 'The poem\'s layout. Words: text mask. Distance: 0 at the text, 1 far away. Lines, Stanzas: a gray each. Rhymes: lines that rhyme (all, or one letter).',
  grow: 'Dilate (Amount above 50) or erode (below 50) the bright areas, by Radius.',
  pixelate: 'Averages a gray map into cells: squares, bricks or diamonds.',
  twirl: 'Twists a gray map around a point, strongest at the center, none past Radius.',
  mirror: 'Mirrors a gray map: left–right, top–bottom, both, or diagonal.',
  chroma: 'Chromatic aberration: shifts red and blue apart. Toward the Edges keeps the center sharp.',
  polar: 'Polar transform: wraps a gray map into rings around the center.',
  maprange: 'Remaps values from one range (From Low–High) to another (To Low–High).',
  wash: 'Watercolor wash over any picture: bleeding, and blooms when wet.',
  math: 'Combines two gray maps: add, multiply, max, min, difference, subtract, divide, power, average, screen, modulo, sine.',
  mix: 'Lerps A to B. Amount is a number or a gray-map mask.',
  blend: 'Layers one picture over another with a blend mode, optionally through a mask.',
  split: 'Splits a picture into R, G, B and luminance gray maps.',
  merge: 'Combines three gray maps into R, G, B.',
  switch: 'Outputs A, or B when Choose is above Switch At. Wire a Knob into Choose to switch from the page.',
  light: 'Shades a gray map as a height map from the dial: diffuse and specular. (The Light Engine does more.)',
  tint: 'Maps a gray map from Dark Hue (black) to Light Hue (white).',
  ramp: 'Two-color gradient map. Middle shifts the midpoint.',
  hsv: 'Hue rotation, saturation and value.',
  glass: 'Renders panes as stained glass: backlit toward the dial, domed panes, flat dark lead, soldered joints. Scene can show a picture through the glass.',
  glaze: 'Lights and colors crazed glaze from its maps.',
  material: 'The lighting engine: lights a picture by a height map from the dial, with shadows, AO and specular. Gloss Map varies shine; the hue ports color shade, shine and light.',
  oilpaint: 'Repaints a picture in oil strokes that follow its shapes, coarse to fine. Second output: paint height, for the Light Engine.',
  flowlines: 'Evenly spaced, non-crossing streamlines (Jobard–Lefer). They follow the dial, or any gray map wired into Angle Map. Lines: spacing.',
  grayscott: 'Gray–Scott reaction–diffusion. Pattern goes from spots through coral and mazes to holes; Growth: iterations; Scale: feature size.',
  washes: 'Two watercolor pigment shapes, each layered ~40 times with variation for soft edges (Tyler Hobbs\'s method). Feed each into Pigment.',
  pigment: 'Lays a gray map onto a picture as one watercolor pigment: darker drying edges, paper grain, bleed toward the dial. Chain two to mix colors.',
  cracks: 'Spreading glaze cracks (Tarbell\'s Substrate): long early cracks, short later ones. Outputs: height, glaze, grime, fine cracks; feed all four into Glaze.',
  matrix: 'A material to grow through: strata, pebbles, sand, fibers or skin. Outputs: gray picture, height, and Ways (seams and gaps).',
  tendrils: 'Space-colonization growth (like leaf veins) through the Ways map, thicker where it carries more. Wire the Light Dial into Grow From to set the side.',
  knotwork: 'Celtic knotwork (Cromwell\'s method) inside a Shape; Breaks turn strands back. Outputs: picture and height (blur the height a little, then light it).',
  discharge: 'A Lichtenberg figure (fast Laplacian growth). Strike From: entry point; Branching: bushy or thin; Poles: one or two that meet. Feed into Burn.',
  wood: 'Wood plank: picture and height, with growth rings and grain. Rings: spacing. Figure: waviness. Two color inputs change the wood.',
  burn: 'Burns a gray map into a picture: charred wood at 0, embers at 50, etched acrylic at 100. Scorch: spread. Depth: sink.',
  growline: 'Differential growth: a line that ruffles as it grows, like lettuce or coral. Outputs: the line, the filled shape, a height map.',
  starfield: 'Stars over the input (or black), colored by temperature; the brightest get spikes. Atmosphere adds twinkle and horizon fade.',
  curtains: 'Aurora curtains: fine vertical rays over a folded hem, green low and red high, added as light. Wire the Light Dial into Field From to lean them.',
  terrain: 'Height map of an invented landscape: rolling hills, a few sharp crests. Variant gives another land on the same seed.',
  contours: 'Contour lines (isolines) of any gray map. Levels: line count. Index Every: every Nth line heavier.',
  particles: 'Airborne particles over the input: snowflakes, falling sparks or motes. Last setting: wind, hue spread or scatter by kind. Use a different Variant per copy.',
  strokes: 'A few fast, loaded paint swipes with bristle marks and droplets. Wetness: mixing and drips. Second output: paint thickness.',
  screen: 'Halftone: one dot per cell, sized by the tone. Screen Angle rotates the grid.',
  grain: 'Film grain, from silver grain through film and paper to digital sensor noise. Centered on mid-gray: blend it over anything.',
  canvasweave: 'Plain-weave canvas as a height map. Mix into paint heights so the canvas shows through.',
  shaft: 'A light shaft from the dial through any density map. Second output: the beam alone.',
  surface: 'The output. Image is the texture; an optional Height is lit by the dial. Name is the surface\'s name everywhere. One per graph.',
};
const STEP_COST = {
  noise: d => Math.max(1, +d.octaves || 3),
  cells: () => 9,
  turing: () => 60,
  texture: () => 40,
  stitch: () => 8,
  blur: () => 4,
  warp: () => 1.5,
  mix: () => 1.5,
  light: () => 14,
  tint: () => 1.5,
  ramp: () => 2,
  blend: () => 3,
  page: () => 3,
  transform: () => 1.5,
  edges: () => 2,
  forms: () => 2, streaks: () => 4, hatching: () => 6,
};

// ---- what each part does ----
const STEP_RUN = {
  knob(E, n){ const { ctx, num, P } = E;
    return [Math.max(0, Math.min(100, +((ctx.knobs || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] ?? num(n, 'def', 50))))/100];
  },
  glowhue(E, n){ const g = E.ctx.glow; return [g ? [g.r/255, g.g/255, g.b/255] : [0, 0, 0]]; },
  hue(E, n){ const { ctx, P, hexCol } = E;
    return [hexCol((ctx.tints || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] || '#FFFFFF')];
  },
  dial(E, n){ const { ctx } = E;
    return [((ctx.light ?? 315) % 360)/360, Math.max(0, Math.min(1.3, (ctx.lightTilt ?? 100)/100))];
  },
  seed(E, n){ const { ctx } = E;
    return [((ctx.seed >>> 0) % 1000)/1000];
  },
  page(E, n){ const { field } = E;
    return [field(u => u), field((u, v) => v), field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
  },
  noise(E, n){ const { unit, input, num, field } = E;
    const cells = Math.max(1, num(n, 'scale', 40))/10, oct = Math.max(1, Math.min(6, Math.round(num(n, 'octaves', 3))));
    const s0 = input(n, 1), off = typeof s0 === 'number' ? s0*97 : 0;
    const grids = []; for(let o = 0; o < oct; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; grids.push({ g, grid: makeNoiseGrid(g, g), a: Math.pow(0.5, o) }); }
    const norm = grids.reduce((s, o) => s + o.a, 0);
    // square cells, `scale/10` of them across the page's short side
    return [field((u, v, x, y) => { let s = 0; for(const o of grids) s += sampleNoiseGrid(o.grid, o.g, o.g, x/unit*(o.g - 1) + off, y/unit*(o.g - 1) + off*1.7)*o.a; return s/norm; })];
  },
  cells(E, n){ const { ww, wh, N, unit, num } = E;
    const sc = Math.max(2, num(n, 'scale', 30))/10, jit = num(n, 'jitter', 80)/100, cs = unit/sc;
    const gx = Math.ceil(ww/cs) + 2, gy = Math.ceil(wh/cs) + 2, pts = new Float32Array(gx*gy*3);
    for(let i = 0; i < gx*gy; i++){ pts[i*3] = 0.5 + (Math.random() - 0.5)*jit; pts[i*3+1] = 0.5 + (Math.random() - 0.5)*jit; pts[i*3+2] = Math.random(); }
    const d1 = new Float32Array(N), ed = new Float32Array(N), id = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const cx = Math.floor(x/cs) + 1, cy = Math.floor(y/cs) + 1; let a = 1e9, b = 1e9, ia = 0;
      for(let j = cy - 1; j <= cy + 1; j++) for(let i = cx - 1; i <= cx + 1; i++){ if(i < 0 || j < 0 || i >= gx || j >= gy) continue;
        const k = (j*gx + i)*3, px = (i - 1 + pts[k])*cs, py = (j - 1 + pts[k+1])*cs, d = Math.hypot(px - x, py - y);
        if(d < a){ b = a; a = d; ia = pts[k+2]; } else if(d < b) b = d; }
      const q = y*ww + x; d1[q] = Math.min(1, a/cs); ed[q] = 1 - Math.min(1, (b - a)/cs*4); id[q] = ia;
    }
    return [d1, ed, id];
  },
  waves(E, n){ const { ww, wh, unit, input, num, field, asField } = E;
    const fq = Math.max(1, num(n, 'freq', 12)), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
    const wf = asField(input(n, 1)), asp = ww/unit, asq = wh/unit;
    return [field((u, v, x, y) => 0.5 + 0.5*Math.sin(((u*asp*ca + v*asq*sa)*fq + (wf ? wf[y*ww + x]*2 : 0))*Math.PI*2))];
  },
  gradient(E, n){ const { num, P, field } = E;
    const shape = P(n, 'shape', 'linear'), an = num(n, 'angle', 90)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
    if(shape === 'radial') return [field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
    if(shape === 'rectangular') return [field((u, v) => Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5))*2)];
    return [field((u, v) => Math.max(0, Math.min(1, 0.5 + ((u - 0.5)*ca + (v - 0.5)*sa))))];
  },
  turing(E, n){ const { ww, wh, ctx, deps, num, P, readCanvas, lum } = E;
    if(!deps.texture) return null;
    const type = n.name === 'turing' ? 'turing' : String(P(n, 'type', 'linen'));
    if(type === 'athanor') return null;              // never itself
    const opts = n.name === 'turing'
      ? { p1: num(n, 'scale', 100), p2: 80, p3: ['spots', 'coral', 'maze', 'worms', 'holes'].indexOf(P(n, 'pattern', 'coral'))*25, p4: 0 }
      : { p1: num(n, 'p1', 100), p2: num(n, 'p2', 100), p3: num(n, 'p3', 50) };
    const cv = deps.texture(type, ww*canonDiv(2) | 0, wh*canonDiv(2) | 0, { ...opts, seed: ctx.seed, light: ctx.light, scale: ctx.scale });
    if(!cv) return null;
    const img = readCanvas(cv);
    return n.name === 'turing' ? [lum(img)] : [img, lum(img)];
  },
  texture(E, n){ const { ww, wh, ctx, deps, num, P, readCanvas, lum } = E;
    if(!deps.texture) return null;
    const type = n.name === 'turing' ? 'turing' : String(P(n, 'type', 'linen'));
    if(type === 'athanor') return null;              // never itself
    const opts = n.name === 'turing'
      ? { p1: num(n, 'scale', 100), p2: 80, p3: ['spots', 'coral', 'maze', 'worms', 'holes'].indexOf(P(n, 'pattern', 'coral'))*25, p4: 0 }
      : { p1: num(n, 'p1', 100), p2: num(n, 'p2', 100), p3: num(n, 'p3', 50) };
    const cv = deps.texture(type, ww*canonDiv(2) | 0, wh*canonDiv(2) | 0, { ...opts, seed: ctx.seed, light: ctx.light, scale: ctx.scale });
    if(!cv) return null;
    const img = readCanvas(cv);
    return n.name === 'turing' ? [lum(img)] : [img, lum(img)];
  },
  stitch(E, n){ const { ww, wh, unit, num, P, readCanvas, lum } = E;
    const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh);
    const k = unit/1536, off = num(n, 'offset', 14)*k*2, sz = Math.max(1, num(n, 'size', 4))*k*2;
    drawStitch(x, pathFromPoints(roundRectPoints(off, off, ww - off*2, wh - off*2, 0), true), String(P(n, 'style', 'scallop')),
      { period: sz*6 + unit*0.012, amp: sz*2 + unit*0.004, width: sz, color: '#fff', side: 1 });
    return [lum(readCanvas(c))];
  },
  levels(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const LO = map(n, 'lo', 0), HI = map(n, 'hi', 100), GA = map(n, 'gamma', 50), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const lo = at(LO, i)/100, hi = Math.max(lo + 0.01, at(HI, i)/100), g = Math.pow(2, (at(GA, i) - 50)/25);
      o[i] = Math.pow(Math.max(0, Math.min(1, (f[i] - lo)/(hi - lo))), g); }
    return [o];
  },
  threshold(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const AT = map(n, 'at', 50), SF = map(n, 'soft', 10), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const a = at(AT, i)/100, sf = Math.max(0.002, at(SF, i)/200), t = Math.max(0, Math.min(1, (f[i] - a + sf)/(2*sf))); o[i] = t*t*(3 - 2*t); }
    return [o];
  },
  blur(E, n){ const { unit, input, num, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null; return [boxBlur(f, num(n, 'radius', 8)*unit/1536*1.2)];
  },
  warp(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)), by = asField(input(n, 2)); if(!f) return null; if(!by) return [f];
    const AM = E.map(n, 'amount', 20), o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, a = by[q]*Math.PI*2, A = E.at(AM, q)/100*unit*0.08;
      const sx = Math.max(0, Math.min(ww - 1, Math.round(x + Math.cos(a)*A))), sy = Math.max(0, Math.min(wh - 1, Math.round(y + Math.sin(a)*A))); o[q] = f[sy*ww + sx]; }
    return [o];
  },
  math(E, n){ const { N, input, P, flat, asField } = E;
    const a = asField(input(n, 1), 0), b = asField(input(n, 2), 0); if(!a && !b) return null;
    const A = a || flat(0), B = b || flat(0), op = P(n, 'op', 'add'), o = new Float32Array(N);
    const f = { add: (x, y) => x + y, multiply: (x, y) => x*y, max: Math.max, min: Math.min, difference: (x, y) => Math.abs(x - y), subtract: (x, y) => x - y,
      // Filter Forge's RGB Math, the useful few: b as a divisor, an exponent (0..1 → 0..4), a mean, a screen, a remainder, a wave
      divide: (x, y) => y > 1e-4 ? x/y : 1, power: (x, y) => Math.pow(Math.max(0, x), (b ? y : 0.25)*4), average: (x, y) => (x + y)/2,
      screen: (x, y) => 1 - (1 - x)*(1 - y), modulo: (x, y) => y > 1e-4 ? (x % y)/y : 0, sine: (x, y) => 0.5 + 0.5*Math.sin((x + y)*Math.PI*2) }[op] || ((x, y) => x + y);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f(A[i], B[i])));
    return [o];
  },
  mix(E, n){ const { N, input, num, map, asField, asImage } = E;
    const ia = input(n, 1), ib = input(n, 2), ta0 = input(n, 3), tm = map(n, 't', 50), tp = typeof tm === 'number' ? tm/100 : num(n, 't', 50)/100;
    // (a map on ⚙ Amount is the amount point by point, as a gray map on its amount input is)
    const ta = ta0 == null && typeof tm !== 'number' ? tm.map(v => v/100) : ta0;
    if(ia == null && ib == null) return null;
    // two colours by one amount: one colour (never a page of them)
    if(Array.isArray(ia) && Array.isArray(ib) && (ta == null || typeof ta === 'number')){ const k = ta == null ? tp : ta; return [[0, 1, 2].map(c => ia[c] + (ib[c] - ia[c])*k)]; }
    const t = asField(ta);
    const A = asImage(ia ?? 0), B = asImage(ib ?? 0), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = t ? t[i] : tp; o.r[i] = A.r[i] + (B.r[i] - A.r[i])*k; o.g[i] = A.g[i] + (B.g[i] - A.g[i])*k; o.b[i] = A.b[i] + (B.b[i] - A.b[i])*k; }
    return [o];
  },
  invert(E, n){ const { N, input, asField, isImg } = E; const v = input(n, 1); if(v == null) return null;
    if(isImg(v)){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ o.r[i] = 1 - v.r[i]; o.g[i] = 1 - v.g[i]; o.b[i] = 1 - v.b[i]; } return [o]; }
    const f = asField(v), o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = 1 - f[i]; return [o];
  },
  posterize(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const K = map(n, 'steps', 5), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const k = Math.max(2, Math.min(16, Math.round(at(K, i)))); o[i] = Math.min(k - 1, Math.floor(Math.max(0, f[i])*k))/(k - 1); }
    return [o];
  },
  transform(E, n){ const { ww, wh, N, input, num, asField } = E;
    // tiled and turned about the page's centre (it repeats past its edges)
    const f = asField(input(n, 1)); if(!f) return null;
    const sc = Math.max(0.25, num(n, 'scale', 100)/100), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an), o = new Float32Array(N);
    const cx = ww/2, cy = wh/2;
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = (x - cx)/sc, dy = (y - cy)/sc;
      let sx = Math.round(cx + dx*ca + dy*sa), sy = Math.round(cy - dx*sa + dy*ca);
      sx = ((sx % ww) + ww) % ww; sy = ((sy % wh) + wh) % wh; o[y*ww + x] = f[sy*ww + sx];
    }
    return [o];
  },
  edges(E, n){ const { ww, wh, N, unit, input, num, field, asField } = E;
    // Sobel: where the field changes fastest
    const f = asField(input(n, 1)); if(!f) return null;
    const k = num(n, 'strength', 50)/50*unit/96, o = new Float32Array(N), at = (x, y) => f[Math.max(0, Math.min(wh - 1, y))*ww + Math.max(0, Math.min(ww - 1, x))];
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const gx = at(x+1,y-1) + 2*at(x+1,y) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x-1,y) - at(x-1,y+1);
      const gy = at(x-1,y+1) + 2*at(x,y+1) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x,y-1) - at(x+1,y-1);
      o[y*ww + x] = Math.min(1, Math.hypot(gx, gy)*k/8);
    }
    return [o];
  },
  light(E, n){ const { N, unit, ctx, input, num, flat, asField, lightOf } = E;
    const h0 = asField(input(n, 1)); if(!h0) return null;
    const dial = input(n, 2), deg = typeof dial === 'number' ? dial*360 : (ctx.light ?? 315);
    const H = new Float32Array(N), rel = num(n, 'relief', 50)/100*unit*0.02;
    for(let i = 0; i < N; i++) H[i] = h0[i]*rel;
    const L = lightOf(H, deg, 1, num(n, 'gloss', 30)/100, num(n, 'shadow', 60)/100), lf = new Float32Array(N), sp = new Float32Array(N);
    for(let i = 0; i < N; i++){ lf[i] = Math.min(1, L.light[i]/L.flat*0.5); sp[i] = L.spec[i]; }
    return [lf, sp];
  },
  tint(E, n){ const { N, ctx, input, asField, asColour, hexCol } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const lc = asColour(input(n, 2), hexCol((ctx.tints || [])[0] || '#FFFFFF')), dc = asColour(input(n, 3), hexCol((ctx.tints || [])[1] || '#000000'));
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const t = f[i]; o.r[i] = dc[0] + (lc[0] - dc[0])*t; o.g[i] = dc[1] + (lc[1] - dc[1])*t; o.b[i] = dc[2] + (lc[2] - dc[2])*t; }
    return [o];
  },
  ramp(E, n){ const { N, input, num, asField, asColour } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const a = asColour(input(n, 2), [0, 0, 0]), b = asColour(input(n, 3), [1, 1, 1]), mid = Math.max(0.02, Math.min(0.98, num(n, 'mid', 50)/100));
    const g = Math.log(0.5)/Math.log(mid), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const t = Math.pow(Math.max(0, Math.min(1, f[i])), g); o.r[i] = a[0] + (b[0] - a[0])*t; o.g[i] = a[1] + (b[1] - a[1])*t; o.b[i] = a[2] + (b[2] - a[2])*t; }
    return [o];
  },
  blend(E, n){ const { N, input, num, P, asField, asImage } = E;
    const base = asImage(input(n, 1) ?? 0.5), lay = input(n, 2), m = asField(input(n, 3));
    if(lay == null) return [base];
    const L = asImage(lay), fn = STEP_BLEND_FN[P(n, 'mode', 'normal')] || STEP_BLEND_FN.normal, OP = E.map(n, 'opacity', 100);
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = E.at(OP, i)/100*(m ? m[i] : 1);
      for(const c of ['r', 'g', 'b']){ const b0 = base[c][i]; o[c][i] = b0 + (Math.max(0, Math.min(1, fn(b0, L[c][i]))) - b0)*k; } }
    return [o];
  },
  surface(E, n){ const { N, unit, ctx, input, flat, asField, asImage, lightOf } = E;
    const img = asImage(input(n, 1) ?? 0.5), h0 = asField(input(n, 2));
    if(!h0) return [img];
    // heights: the picture lit by the dial, as the engine lights a texture
    const H = new Float32Array(N); for(let i = 0; i < N; i++) H[i] = h0[i]*unit*0.01;
    const L = lightOf(H, ctx.light ?? 315, 1, 0.3, 0.6), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = L.light[i]/L.flat, s = L.spec[i]*0.6; o.r[i] = img.r[i]*k + s; o.g[i] = img.g[i]*k + s; o.b[i] = img.b[i]*k + s; }
    return [o];
  },
  colour(E, n){ const { P, hexCol } = E;
    return [hexCol(String(P(n, 'hex', '#808080')))];
  },
  accent(E, n){ const { ctx, P, hexCol } = E, k = (parseInt(P(n, 'slot', '1'), 10) || 1) - 1;
    return [hexCol((ctx.accents || [])[k] || ['#B0303A', '#C9A33A'][k] || '#808080')];
  },
  // a few large soft shapes and a little noise: where a drawing is dark
  forms(E, n){ const { ww, wh, unit, num } = E;
    const k = Math.max(1, Math.round(num(n, 'count', 5))), sz = num(n, 'size', 50)/50, nz = num(n, 'noise', 50)/100;
    const blobs = []; for(let i = 0; i < k; i++) blobs.push({ x: Math.random(), y: Math.random(), r: (0.18 + Math.random()*0.28)*sz, s: 0.5 + Math.random()*0.6 });
    const g = makeNoiseGrid(6, 6);
    // broad shapes: sampled on a lattice and blended between (smoothField), not at every pixel
    return [smoothField(ww, wh, Math.max(2, unit/96), (u, v) => { let t = 0; for(const b of blobs){ const q = ((u - b.x)**2 + (v - b.y)**2)/(b.r*b.r); t += b.s*Math.exp(-q*1.6); }
      return Math.max(0, Math.min(1, t*0.75 + (sampleNoiseGrid(g, 6, 6, u*5, v*5) - 0.5)*nz)); })];
  },
  // RAIN in depth: far back, soft wide sheets; nearer, streaks blurred by
  // their motion (fading at both ends). They come FROM the angle (the dial's
  // way); GUSTS swing them, page-wide, as a gust front would — near streaks
  // swing together with their neighbours, not each its own way.
  streaks(E, n){ const { ww, wh, unit, input, num, P, asField, marks, px, carea } = E;
    const base = asField(input(n, 1)), kind = P(n, 'kind', 'streaks');
    const from = num(n, 'angle', 0)*Math.PI/180, spread = num(n, 'spread', 0)*Math.PI/180;
    const share = num(n, 'light', 75)/100, k = num(n, 'strength', 50)/50, long = Math.max(ww, wh);
    const gust = makeNoiseGrid(5, 5), dirAt = (x, y) => from + (spread ? (sampleNoiseGrid(gust, 5, 5, x/ww*4, y/wh*4) - 0.5)*2*spread : 0);
    return [marks(base, 0.5, g => {
      if(kind === 'sheets'){
        for(let i = 0; i < 9; i++){
          const x = Math.random()*ww*1.4 - ww*0.2, bw = unit*(0.05 + Math.random()*0.13), len = long*1.6, a = dirAt(x, wh/2);
          const t = Math.random() < share*0.8 ? 230 : 60, al = (0.05 + Math.random()*0.07)*k;
          const gr = g.createLinearGradient(x - bw, 0, x + bw, 0);
          gr.addColorStop(0, `rgba(${t},${t},${t},0)`); gr.addColorStop(0.5, `rgba(${t},${t},${t},${al})`); gr.addColorStop(1, `rgba(${t},${t},${t},0)`);
          g.save(); g.translate(x, wh/2); g.rotate(a); g.translate(-x, -wh/2);
          g.fillStyle = gr; g.fillRect(x - bw, wh/2 - len/2, bw*2, len); g.restore();
        }
        return;
      }
      const count = Math.round(carea/7600*num(n, 'count', 100)/100), zoom = num(n, 'length', 100)/100;
      g.lineCap = 'round';
      for(let i = 0; i < count; i++){
        const len = (Math.random()*0.09 + 0.04)*long*zoom;
        const x = Math.random()*(ww + len) - len*0.5, y = Math.random()*(wh + len) - len, a = dirAt(x, y) + (Math.random() - 0.5)*spread*0.15;
        const dx = Math.sin(a)*len, dy = -Math.cos(a)*len;
        const t = Math.random() < share ? 205 + Math.random()*45 : 40 + Math.random()*30, al = Math.min(1, (0.22 + Math.random()*0.3)*k);
        const gr = g.createLinearGradient(x, y, x + dx, y + dy);
        gr.addColorStop(0, `rgba(${t|0},${t|0},${t|0},0)`); gr.addColorStop(0.5, `rgba(${t|0},${t|0},${t|0},${al})`); gr.addColorStop(1, `rgba(${t|0},${t|0},${t|0},0)`);
        g.strokeStyle = gr; g.lineWidth = px(2.4 + Math.random()*3.6);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
      }
    })];
  },
  // The plate is scratched
  // in one direction, always.
  // Patience, then a line.
  //
  // SILVERPOINT hatching: patches of short strokes, parallel, tapered at both
  // ends, slightly curved, heavier where the stylus pressed; the patches
  // gather where the TONE is high, and where it is highest a second layer
  // crosses (CROSS-HATCHING: none at 0, everywhere at 100). The strokes run
  // along the angle (the dial's way). Out: how much ink covers each point.
  hatching(E, n){ const { ww, wh, unit, input, num, asField, marks, px } = E;
    const tone = asField(input(n, 1)), at = (u, v) => tone ? tone[Math.min(wh - 1, (v*wh) | 0)*ww + Math.min(ww - 1, (u*ww) | 0)] : 0.5;
    const base = (num(n, 'angle', 125) - 90)*Math.PI/180, cross = num(n, 'cross', 38)/100, ca2 = num(n, 'crossAngle', 54)*Math.PI/180;
    const zoom = num(n, 'size', 100)/100, patches = Math.round(150*num(n, 'density', 100)/100), wt = num(n, 'weight', 50)/50;
    const noise = makeNoiseGrid(6, 6);
    return [marks(null, 0, g => {
      const stroke = (x, y, a, len, wd, bend, alpha) => {
        const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, L = [], R = [];
        for(let k = 0; k <= 10; k++){ const t = k/10, along = (t - 0.5)*len, off = Math.sin(t*Math.PI)*bend;
          const qx = x + ca*along + nx*off, qy = y + sa*along + ny*off, half = wd*Math.pow(Math.sin(t*Math.PI), 0.7)/2;
          L.push([qx + nx*half, qy + ny*half]); R.push([qx - nx*half, qy - ny*half]); }
        g.fillStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
        g.beginPath(); g.moveTo(L[0][0], L[0][1]); for(const p of L) g.lineTo(p[0], p[1]);
        for(let k = R.length - 1; k >= 0; k--) g.lineTo(R[k][0], R[k][1]); g.closePath(); g.fill(); };
      for(let i = 0; i < patches; i++){
        let u, v, t, tries = 0;
        do { u = Math.random(); v = Math.random(); t = at(u, v); tries++; } while(tries < 6 && Math.random() > 0.15 + 0.85*t);
        const qx = u*ww, qy = v*wh, size = unit*(0.045 + Math.random()*0.06)*zoom;
        const a = base + (sampleNoiseGrid(noise, 6, 6, u*5 + 2, v*5 + 2) - 0.5)*0.7;
        const layers = cross > 0 && t > 1 - cross ? 2 : 1;
        for(let l = 0; l < layers; l++){
          const la = a + l*ca2, k = Math.round(7 + t*12), gap = size/k;
          for(let j = 0; j < k; j++){
            const off = (j - (k - 1)/2)*gap, len = size*(0.55 + Math.random()*0.45)*Math.sqrt(1 - Math.min(0.9, (off/size*1.6)**2));
            const sx = qx - Math.sin(la)*off + (Math.random() - 0.5)*gap*0.4, sy = qy + Math.cos(la)*off + (Math.random() - 0.5)*gap*0.4;
            const press = 0.6 + Math.random()*0.4;
            stroke(sx, sy, la + (Math.random() - 0.5)*0.06, len, px(2.6 + t*3)*press*wt, len*(Math.random() - 0.5)*0.08, (0.5 + t*0.45)*press);
          }
        }
      }
    })];
  },
};

Object.assign(STEP_RUN, {
  // fold the picture into N mirrored wedges about the centre (a kaleidoscope)
  kaleidoscope(E, n){ const { ww, wh, N, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const k = Math.max(2, Math.round(num(n, 'folds', 6))), wedge = Math.PI*2/k, turn = num(n, 'turn', 0)*Math.PI/180, z = Math.max(0.25, num(n, 'zoom', 100)/100);
    const cx = ww/2, cy = wh/2, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)/z; let a = Math.atan2(dy, dx) - turn;
      a = ((a % wedge) + wedge) % wedge; if(a > wedge/2) a = wedge - a;            // mirrored inside each wedge
      const sx = Math.round(cx + Math.cos(a + turn)*r), sy = Math.round(cy + Math.sin(a + turn)*r);
      o[y*ww + x] = f[Math.min(wh - 1, Math.max(0, sy))*ww + Math.min(ww - 1, Math.max(0, sx))];
    }
    return [o];
  },
  // the picture wrapped round the centre: its left edge the middle, its rows rings
  polar(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const rings = Math.max(0.25, num(n, 'rings', 100)/100), turn = num(n, 'turn', 0)/360, cx = ww/2, cy = wh/2, R = unit*0.5, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = x - cx, dy = y - cy, u = (((Math.atan2(dy, dx)/(Math.PI*2) + 0.5 + turn) % 1) + 1) % 1, v = (Math.hypot(dx, dy)/R*rings) % 1;
      o[y*ww + x] = f[Math.min(wh - 1, Math.floor(v*wh))*ww + Math.min(ww - 1, Math.floor(u*ww))];
    }
    return [o];
  },
});
Object.assign(STEP_COST, { note: () => 0, bricon: () => 1, highpass: () => 1.5, sharpen: () => 1.5, motionblur: () => 3, offset: () => 0.5, perlin: () => 2.5, bricks: () => 1, curve: () => 0.1, curveops: () => 0.1, tonecurve: () => 1, profile: () => 1, kaleidoscope: () => 1.5, polar: () => 1.5, poem: () => 2, grow: () => 2, pixelate: () => 1.5, twirl: () => 1.5, mirror: () => 1, chroma: () => 1.5 });
Object.assign(STEP_RUN, {
  number(E, n){ return [Math.max(0, Math.min(100, E.num(n, 'value', 50)))/100]; },
  // the node's own random stream (from the page's seed and the node's id): the same number until the seed changes
  random(E, n){ const lo = E.num(n, 'lo', 0), hi = E.num(n, 'hi', 100); return [(lo + (hi - lo)*Math.random())/100]; },
  maprange(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const A = map(n, 'inLo', 0), B = map(n, 'inHi', 100), C = map(n, 'outLo', 0), D = map(n, 'outHi', 100), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const a = at(A, i)/100, b = at(B, i)/100, c = at(C, i)/100, d = at(D, i)/100, k = Math.abs(b - a) < 1e-6 ? 0 : 1/(b - a);
      const t = Math.max(0, Math.min(1, (f[i] - a)*k)); o[i] = c + (d - c)*t; }
    return [o]; },
  shape(E, n){ const { ww, wh, unit, P, num, field } = E;
    const form = String(P(n, 'form', 'circle')), R = num(n, 'size', 60)/200, sf = Math.max(0.002, num(n, 'soft', 10)/200), cx = num(n, 'x', 50)/100*ww/unit, cy = num(n, 'y', 50)/100*wh/unit;
    const edge = d => { const t = Math.max(0, Math.min(1, (R - d + sf)/(2*sf))); return t*t*(3 - 2*t); };
    return [field((u, v, x, y) => { const px = x/unit - cx, py = y/unit - cy, r = Math.hypot(px, py);
      if(form === 'ring'){ const t = Math.abs(r - R*0.8); return Math.max(0, Math.min(1, 1 - (t - R*0.12)/(sf*2 + 1e-3))); }
      if(form === 'square') return edge(Math.max(Math.abs(px), Math.abs(py)));
      if(form === 'diamond') return edge((Math.abs(px) + Math.abs(py))*0.75);
      if(form === 'star'){ const a = Math.atan2(py, px); return edge(r/(0.65 + 0.35*Math.cos(a*5))); }
      if(form === 'vignette') return 1 - Math.max(0, Math.min(1, (r - R*0.6)/(R*0.9 + sf*4)));
      return edge(r); })]; },
  split(E, n){ const { N, input, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const y = new Float32Array(N); for(let i = 0; i < N; i++) y[i] = 0.299*im.r[i] + 0.587*im.g[i] + 0.114*im.b[i];
    return [im.r, im.g, im.b, y]; },
  merge(E, n){ const { N, input, asField } = E; const r = asField(input(n, 1)), g = asField(input(n, 2)), b = asField(input(n, 3));
    if(!r && !g && !b) return null; const z = new Float32Array(N);
    return [{ r: r || z, g: g || z, b: b || z }]; },
  switch(E, n){ const { input, num, asField } = E;
    const c = input(n, 3), at = num(n, 'at', 50)/100;
    const v = typeof c === 'number' ? c : c == null ? 0 : (() => { const f = asField(c); let t = 0; for(let i = 0; i < f.length; i++) t += f[i]; return f.length ? t/f.length : 0; })();
    const pick = v >= at ? input(n, 2) : input(n, 1);
    return pick == null ? null : [pick]; },
  note(){ return []; },
  bricon(E, n){ const { N, input, map, at, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const BR = map(n, 'bright', 0), CO = map(n, 'contrast', 0), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const b = at(BR, i)/100, c = at(CO, i)/100, k = c >= 0 ? 1/Math.max(0.01, 1 - c) : 1 + c;
      for(const ch of ['r', 'g', 'b']) o[ch][i] = Math.max(0, Math.min(1, (im[ch][i] - 0.5)*k + 0.5 + b)); }
    return [o];
  },
  highpass(E, n){ const { N, unit, input, num, map, at, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null;
    const lo = boxBlur(f, num(n, 'radius', 10)*unit/1536*1.2), G = map(n, 'gain', 50), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, 0.5 + (f[i] - lo[i])*(1 + at(G, i)/10)));
    return [o];
  },
  sharpen(E, n){ const { N, unit, input, num, map, at, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null;
    const lo = boxBlur(f, num(n, 'radius', 4)*unit/1536*1.2), A = map(n, 'amount', 50), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f[i] + (f[i] - lo[i])*at(A, i)/50));
    return [o];
  },
  motionblur(E, n){ const { ww, wh, N, unit, input, num, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const L = num(n, 'length', 20)/100*unit*0.15, an = num(n, 'angle', 0)*Math.PI/180; if(L < 0.5) return [f];
    const S = Math.max(2, Math.min(48, Math.round(L))), dx = Math.cos(an)*L, dy = Math.sin(an)*L, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ let t = 0;
      for(let k = 0; k < S; k++){ const s = k/(S - 1) - 0.5, sx = Math.min(ww - 1, Math.max(0, Math.round(x + dx*s))), sy = Math.min(wh - 1, Math.max(0, Math.round(y + dy*s))); t += f[sy*ww + sx]; }
      o[y*ww + x] = t/S; }
    return [o];
  },
  offset(E, n){ const { ww, wh, N, input, num, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const ox = Math.round(num(n, 'x', 0)/100*ww), oy = Math.round(num(n, 'y', 0)/100*wh), o = new Float32Array(N);
    // wrapped, as Filter Forge's Offset: what leaves one side comes back on the other
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) o[y*ww + x] = f[(((y - oy) % wh) + wh) % wh*ww + (((x - ox) % ww) + ww) % ww];
    return [o];
  },
  perlin(E, n){ const { unit, input, num, map, at, field } = E;
    // gradient noise (Perlin 2002, improved): a permutation from the node's own stream, octaves by Details, each Roughness weaker
    const perm = new Uint8Array(512), p = Array.from({ length: 256 }, (_, i) => i);
    for(let i = 255; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for(let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const s0 = input(n, 1), off = typeof s0 === 'number' ? s0*311 : 0;
    const fade = t => t*t*t*(t*(t*6 - 15) + 10), lerp = (a, b, t) => a + (b - a)*t;
    const grad = (h, x, y) => { const g = h & 7, u = g < 4 ? x : y, v = g < 4 ? y : x; return ((g & 1) ? -u : u) + ((g & 2) ? -2*v : 2*v); };
    const noise = (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = fade(x), v = fade(y);
      const a = perm[X] + Y, b = perm[X + 1] + Y;
      return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v)/2.2; };
    const cells = Math.max(1, num(n, 'scale', 40))/10, det = Math.max(1, Math.min(8, Math.round(num(n, 'details', 4)))), R = map(n, 'rough', 50), C = map(n, 'contrast', 30);
    let q = -1;
    return [field((u, v, x, y) => { q++; const rough = 0.25 + at(R, q)/100*0.6; let t = 0, a = 1, norm = 0, fr = 1;
      for(let o = 0; o < det; o++){ t += noise(x/unit*cells*fr + off + o*17.3, y/unit*cells*fr + off*1.7 + o*31.1)*a; norm += a; a *= rough; fr *= 2; }
      const k = 1 + at(C, q)/100*3; return Math.max(0, Math.min(1, 0.5 + t/norm*k)); })];
  },
  bricks(E, n){ const { ww, wh, N, unit, input, num, isCurve } = E;
    const rows = Math.max(2, Math.round(num(n, 'rows', 12))), bh = wh/rows, bw = bh*num(n, 'ratio', 200)/100, mo = num(n, 'mortar', 12)/100*bh*0.5;
    const stag = num(n, 'stagger', 50)/100, bev = Math.max(1e-3, num(n, 'bevel', 30)/100*bh*0.5), vary = num(n, 'vary', 30)/100, cv = input(n, 1);
    const hash = (i, j) => { let h = Math.imul(i*374761393 + j*668265263, 1274126177) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
    const B = new Float32Array(N), M = new Float32Array(N), I = new Float32Array(N);
    for(let y = 0; y < wh; y++){ const row = Math.floor(y/bh), sh = (row % 2)*stag*bw, ly = y - row*bh;
      for(let x = 0; x < ww; x++){ const col = Math.floor((x + sh)/bw), lx = x + sh - col*bw, q = y*ww + x;
        // the distance in from the brick's nearest edge, past the mortar; the bevel's profile is the curve, if one comes in
        const d = Math.min(lx, bw - lx, ly, bh - ly) - mo;
        if(d <= 0){ M[q] = 1; continue; }
        const t = Math.min(1, d/bev), h = isCurve(cv) ? curveAt(cv, t) : Math.sin(t*Math.PI/2), id = hash(col, row);
        B[q] = h*(1 - vary + vary*id); I[q] = id; } }
    return [B, M, I];
  },
  curve(E, n){ const { num, P } = E;
    const shape = P(n, 'shape', 'linear'), a = num(n, 'amount', 50)/100, k = Math.max(1, Math.round(num(n, 'count', 4))), lo = num(n, 'low', 0)/100, hi = num(n, 'high', 100)/100;
    // the noise curve's knots come from the node's own random stream (seed + id), the same until the seed changes
    const knots = shape === 'noise' ? Array.from({ length: k + 2 }, () => Math.random()) : null;
    const f = {
      linear: t => t, bias: t => stepBias(t, a), gain: t => stepGain(t, a), gamma: t => Math.pow(t, Math.pow(2, (0.5 - a)*4)),
      gaussian: t => Math.exp(-((t - 0.5)**2)/(2*(0.02 + a*0.3)**2)),
      impulse: t => { const c = Math.max(0.001, Math.min(0.999, a)); return t < c ? t/c : (1 - t)/(1 - c); },
      stairs: t => Math.min(k, Math.floor(t*(k + 1)))/k, step: t => t >= a ? 1 : 0,
      wave: t => 0.5 - 0.5*Math.cos(t*k*Math.PI*2), arc: t => Math.sqrt(Math.max(0, 1 - (1 - t)**2)),
      noise: t => { const x = t*(k + 1), i = Math.min(k, Math.floor(x)), u = x - i, w = u*u*(3 - 2*u); return knots[i] + (knots[i + 1] - knots[i])*w; },
    }[shape] || (t => t);
    return [stepCurve(t => lo + (hi - lo)*f(t))];
  },
  curveops(E, n){ const { input, num, P, isCurve } = E;
    const c = input(n, 1), b = input(n, 2); if(!isCurve(c)) return null;
    const op = P(n, 'op', 'frequency'), a = num(n, 'amount', 50)/100, k = Math.max(1, Math.round(num(n, 'count', 2))), cb = isCurve(b) ? b : null;
    const frac = x => (x >= 1 && x === Math.floor(x)) ? 1 : x - Math.floor(x);   // (the last point stays the curve's end)
    const g = { frequency: t => curveAt(c, frac(t*k)), phase: t => curveAt(c, (t + a) % 1),
      repeat: t => { const x = t*k, i = Math.floor(x), u = x - i; return curveAt(c, i % 2 ? 1 - u : u); },
      reverse: t => curveAt(c, 1 - t), invert: t => 1 - curveAt(c, t), amplitude: t => 0.5 + (curveAt(c, t) - 0.5)*a*2,
      blend: t => cb ? curveAt(c, t) + (curveAt(cb, t) - curveAt(c, t))*a : curveAt(c, t), multiply: t => curveAt(c, t)*(cb ? curveAt(cb, t) : 1),
      max: t => Math.max(curveAt(c, t), cb ? curveAt(cb, t) : -Infinity), min: t => Math.min(curveAt(c, t), cb ? curveAt(cb, t) : Infinity) }[op] || (t => curveAt(c, t));
    return [stepCurve(g)];
  },
  tonecurve(E, n){ const { N, input, map, at, isCurve, isImg, asField } = E;
    const v = input(n, 1), c = input(n, 2); if(v == null) return null; if(!isCurve(c)) return [v];
    const MX = map(n, 'mix', 100), tone = (x, i) => { const m = at(MX, i)/100; return x + (curveAt(c, x) - x)*m; };
    if(isImg(v)){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ o.r[i] = tone(v.r[i], i); o.g[i] = tone(v.g[i], i); o.b[i] = tone(v.b[i], i); } return [o]; }
    const f = asField(v), o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = tone(f[i], i); return [o];
  },
  profile(E, n){ const { ww, wh, N, input, num, P, isCurve, asField } = E;
    const c = input(n, 1), along = asField(input(n, 2)), shape = P(n, 'shape', 'linear'), an = num(n, 'angle', 90)*Math.PI/180, rep = Math.max(1, Math.round(num(n, 'repeat', 1)));
    const ca = Math.cos(an), sa = Math.sin(an), o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const u = x/ww - 0.5, v = y/wh - 0.5, q = y*ww + x;
      let t = shape === 'radial' ? Math.min(1, Math.hypot(u, v)/0.5) : shape === 'rectangular' ? Math.min(1, Math.max(Math.abs(u), Math.abs(v))/0.5)
        : shape === 'along a map' ? (along ? along[q] : 0) : Math.max(0, Math.min(1, 0.5 + (u*ca + v*sa)/(Math.abs(ca) + Math.abs(sa))));
      t = rep > 1 ? (t*rep) % 1 : t;
      o[q] = isCurve(c) ? curveAt(c, t) : t;
    }
    return [o];
  },
  poem(E, n){ const { ctx, ww, wh, N, num, P, boxBlur } = E;
    const runs = poemRuns(ctx.text);
    if(!runs.length) return [new Float32Array(N), new Float32Array(N).fill(1), new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    // RHYMES (Ruby's doc, a rhyme group's mask): the words of the lines that rhyme (~A, ~B…: the run's 7th number, A = 1)
    const want = P(n, 'rhyme', 'every rhyme'), wantN = want === 'every rhyme' ? -1 : want.charCodeAt(0) - 64, rhymeHard = new Float32Array(N);
    const pad = num(n, 'padding', 40)/100, soft = num(n, 'softness', 40)/100, reach = Math.max(0.05, num(n, 'reach', 35)/100);
    const heights = runs.map(r => (r[3] - r[1])*wh).sort((a, b) => a - b), lh = Math.max(1, heights[heights.length >> 1]);
    const lines = new Float32Array(N), stanzas = new Float32Array(N), hard = new Float32Array(N);
    const nLines = Math.max(...runs.map(r => r[4])) + 1, nSt = Math.max(...runs.map(r => r[5])) + 1;
    for(const r of runs){
      const h = (r[3] - r[1])*wh, p = h*pad;
      const x0 = Math.max(0, Math.floor(r[0]*ww - p)), x1 = Math.min(ww, Math.ceil(r[2]*ww + p)), y0 = Math.max(0, Math.floor(r[1]*wh - p)), y1 = Math.min(wh, Math.ceil(r[3]*wh + p));
      const rh = r[6] || 0, isRhyme = rh > 0 && (wantN < 0 || rh === wantN);
      for(let y = y0; y < y1; y++) for(let x = x0; x < x1; x++){ hard[y*ww + x] = 1; if(isRhyme) rhymeHard[y*ww + x] = 1; }
      // a line is a band across the whole page at the line's own height, its gray rising line by line
      const ly0 = Math.max(0, Math.floor(r[1]*wh)), ly1 = Math.min(wh, Math.ceil(r[3]*wh)), lv = (r[4] + 1)/nLines;
      for(let y = ly0; y < ly1; y++) for(let x = 0; x < ww; x++) lines[y*ww + x] = Math.max(lines[y*ww + x], lv);
    }
    // a stanza owns the page from halfway after the stanza above it to halfway before the one below
    const span = []; for(const r of runs){ const s = span[r[5]] || (span[r[5]] = [Infinity, -Infinity]); s[0] = Math.min(s[0], r[1]); s[1] = Math.max(s[1], r[3]); }
    const cuts = []; for(let i = 0; i + 1 < span.length; i++) if(span[i] && span[i + 1]) cuts.push((span[i][1] + span[i + 1][0])/2*wh);
    for(let y = 0; y < wh; y++){ let k = 0; while(k < cuts.length && y >= cuts[k]) k++; const sv = (k + 1)/nSt; for(let x = 0; x < ww; x++) stanzas[y*ww + x] = sv; }
    const dist = stepDistance(hard, ww, wh), far = reach*Math.max(ww, wh);
    for(let i = 0; i < N; i++) dist[i] = Math.min(1, dist[i]/far);
    const words = soft > 0 ? boxBlur(hard, lh*soft*0.8) : hard;
    return [words, dist, soft > 0 ? boxBlur(lines, lh*soft*0.25) : lines, stanzas, soft > 0 ? boxBlur(rhymeHard, lh*soft*0.8) : rhymeHard];
  },
  grow(E, n){ const { ww, wh, N, unit, input, num, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const a = num(n, 'amount', 60), rad = Math.max(1, Math.round(num(n, 'radius', 12)*unit/1536*1.2)), up = a >= 50, t = Math.abs(a - 50)/50;
    if(t === 0) return [f];
    // a max (or min) filter, separable, by the radius; mixed with the original by how far Amount is from 50
    const pass = (src, dst, horiz) => { const L = horiz ? ww : wh, M = horiz ? wh : ww;
      for(let j = 0; j < M; j++) for(let i = 0; i < L; i++){ let m = up ? -Infinity : Infinity;
        for(let k = Math.max(0, i - rad), e = Math.min(L - 1, i + rad); k <= e; k++){ const v = src[horiz ? j*ww + k : k*ww + j]; m = up ? (v > m ? v : m) : (v < m ? v : m); }
        dst[horiz ? j*ww + i : i*ww + j] = m; } };
    const tmp = new Float32Array(N), o = new Float32Array(N); pass(f, tmp, true); pass(tmp, o, false);
    for(let i = 0; i < N; i++) o[i] = f[i] + (o[i] - f[i])*t;
    return [o];
  },
  pixelate(E, n){ const { ww, wh, N, unit, input, num, P, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const c = Math.max(1, num(n, 'size', 20)*unit/1536*1.2), kind = P(n, 'cell', 'squares');
    const cellOf = (x, y) => { if(kind === 'diamonds'){ const u = (x + y)/c, v = (x - y)/c; return Math.floor(u) + ':' + Math.floor(v); }
      const row = Math.floor(y/c), sx = kind === 'bricks' && row % 2 ? x + c/2 : x; return Math.floor(sx/c) + ':' + row; };
    const sum = new Map(), id = new Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, k = cellOf(x, y); id[q] = k; const s = sum.get(k) || [0, 0]; s[0] += f[q]; s[1]++; sum.set(k, s); }
    const o = new Float32Array(N); for(let q = 0; q < N; q++){ const s = sum.get(id[q]); o[q] = s[0]/s[1]; }
    return [o];
  },
  twirl(E, n){ const { ww, wh, N, input, num, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const turn = num(n, 'angle', 180)*Math.PI/180, R = Math.max(1, num(n, 'radius', 70)/100*Math.min(ww, wh)/2), cx = num(n, 'x', 50)/100*ww, cy = num(n, 'y', 50)/100*wh, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), q = y*ww + x;
      if(r >= R){ o[q] = f[q]; continue; }
      const t = 1 - r/R, a = Math.atan2(dy, dx) + turn*t*t;
      const sx = Math.min(ww - 1, Math.max(0, Math.round(cx + Math.cos(a)*r))), sy = Math.min(wh - 1, Math.max(0, Math.round(cy + Math.sin(a)*r)));
      o[q] = f[sy*ww + sx]; }
    return [o];
  },
  mirror(E, n){ const { ww, wh, N, input, num, P, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const axis = P(n, 'axis', 'left to right'), at = num(n, 'at', 50)/100, fx = at*ww, fy = at*wh, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      let sx = x, sy = y;
      if((axis === 'left to right' || axis === 'both') && x > fx) sx = Math.round(2*fx - x);
      if((axis === 'top to bottom' || axis === 'both') && y > fy) sy = Math.round(2*fy - y);
      if(axis === 'diagonal' && x/ww > y/wh){ sx = Math.round(y/wh*ww); sy = Math.round(x/ww*wh); }
      o[y*ww + x] = f[Math.min(wh - 1, Math.max(0, sy))*ww + Math.min(ww - 1, Math.max(0, sx))]; }
    return [o];
  },
  chroma(E, n){ const { ww, wh, N, unit, input, num, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const AM = E.map(n, 'amount', 20), ang = num(n, 'angle', 0)*Math.PI/180, edge = num(n, 'edge', 0)/100;
    const o = { r: new Float32Array(N), g: im.g.slice ? im.g.slice() : Float32Array.from(im.g), b: new Float32Array(N) };
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const q = y*ww + x, A = E.at(AM, q)/100*unit*0.02, k = edge > 0 ? (1 - edge) + edge*Math.min(1, Math.hypot(x/ww - 0.5, y/wh - 0.5)/0.7071) : 1;
      const dx = Math.cos(ang)*A*k, dy = Math.sin(ang)*A*k;
      const at = (ox, oy) => Math.min(wh - 1, Math.max(0, Math.round(y + oy)))*ww + Math.min(ww - 1, Math.max(0, Math.round(x + ox)));
      o.r[q] = im.r[at(dx, dy)]; o.b[q] = im.b[at(-dx, -dy)]; }
    return [o];
  },
  hsv(E, n){ const { N, input, map, at, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const TU = map(n, 'hue', 0), SA = map(n, 'sat', 100), VA = map(n, 'val', 100);
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const turn = at(TU, i)/360, sat = at(SA, i)/100, val = at(VA, i)/100;
      const r = im.r[i], g = im.g[i], b = im.b[i], mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
      let h = 0; if(dl > 1e-6) h = mx === r ? ((g - b)/dl + 6) % 6 : mx === g ? (b - r)/dl + 2 : (r - g)/dl + 4; h = h/6 + turn; h -= Math.floor(h);
      const s = mx > 1e-6 ? Math.min(1, dl/mx*sat) : 0, v = Math.min(1, mx*val), k = n2 => { const t = (n2 + h*6) % 6; return v - v*s*Math.max(0, Math.min(t, 4 - t, 1)); };
      o.r[i] = k(5); o.g[i] = k(3); o.b[i] = k(1);
    }
    return [o]; },
});
Object.assign(STEP_COST, { maprange: () => 1, shape: () => 1.5, split: () => 1, merge: () => 1, hsv: () => 2 });

/**
 * What travels on each port: field (a grey map), image (colour), colour (one
 * colour), value (one number). The editor colours ports and wires by these;
 * the evaluator converts between them wherever a port asks (athanor.js).
 */
export const VALUE_TYPES = ['field', 'image', 'colour', 'value', 'curve'];
const STEP_IO = {
  knob: { outs: ['value'] }, hue: { outs: ['colour'] }, colour: { outs: ['colour'] }, accent: { outs: ['colour'] }, number: { outs: ['value'] }, random: { outs: ['value'] },
  split: { ins: ['image'] }, merge: { outs: ['image'] }, chroma: { ins: ['image'], outs: ['image'] },
  bricon: { ins: ['image'], outs: ['image'] }, bricks: { ins: ['curve'] }, perlin: { ins: ['value'] },
  curve: { outs: ['curve'] }, curveops: { ins: ['curve', 'curve'], outs: ['curve'] }, tonecurve: { ins: ['image', 'curve'], outs: ['image'] }, profile: { ins: ['curve', 'field'] }, switch: { ins: ['image', 'image', 'value'], outs: ['image'] }, hsv: { ins: ['image'], outs: ['image'] }, dial: { outs: ['value', 'value'] }, seed: { outs: ['value'] },
  noise: { ins: ['value'] }, cells: { ins: ['value'] }, turing: { ins: ['value'] }, texture: { ins: ['value'], outs: ['image', 'field'] },
  mix: { ins: ['image', 'image', 'field'], outs: ['image'] }, light: { ins: ['field', 'value'] },
  tint: { ins: ['field', 'colour', 'colour'], outs: ['image'] }, ramp: { ins: ['field', 'colour', 'colour'], outs: ['image'] },
  blend: { ins: ['image', 'image', 'field'], outs: ['image'] }, surface: { ins: ['image', 'field'] },
  cloth: { ins: ['field', 'field', 'colour', 'colour'], outs: ['image'] },
  glaze: { ins: ['field', 'field', 'field', 'field', 'field', 'colour', 'colour'], outs: ['image'] },
};
// FILTER FORGE'S LESSON: every slider can take a wire. A step's range params
// each get an input port after its own (⚙ Name); a value wired there sets the
// param across its range (0 → its min, 1 → its max), so a Knob or the Dial
// can drive any of them — and a template shows its wiring instead of hiding it.
const PARAM_PORTS_OFF = new Set(['Inputs', 'Output']);

// REQUIRED INPUTS (Filter Forge): a part that has nothing to work on without its first input. The editor marks
// the port while it is empty, and a step preview shows a warning pattern in its place, so the rest of the
// part still shows what it does; the Surface itself never sees the stand-in (an old graph draws as it did).
const STEP_REQUIRED = new Set(['levels', 'threshold', 'blur', 'warp', 'invert', 'posterize', 'transform', 'edges', 'light', 'tint', 'ramp', 'kaleidoscope', 'polar',
  'maprange', 'split', 'hsv', 'curveops', 'tonecurve', 'bricon', 'highpass', 'sharpen', 'motionblur', 'offset', 'grow', 'pixelate', 'twirl', 'mirror', 'chroma',
  'meniscus', 'pigment', 'contours', 'glaze', 'burn']);
/** Every step: the part, its cost and what it does. */
const STEPS_RAW = { ...Object.fromEntries(Object.entries(STEP_PARTS).map(([k, part]) =>
  [k, { ...part, cost: STEP_COST[k] || (() => 1), run: STEP_RUN[k] }])),
  // the surfaces' own steps (each file a family; their parts carry their own cost and run)
  ...TOUCH_STEPS, ...CHAOS_STEPS, ...CARD_STEPS, ...WHIMSY_STEPS, ...LIGHT_STEPS, ...SHARP_STEPS, ...GEN_STEPS, ...PATTERN_STEPS };
export const STEPS = Object.fromEntries(Object.entries(STEPS_RAW).map(([k, s]) => {
  const io = STEP_IO[k] || s.io || {};          // (a family's part may carry its own port types)
  const paramPorts = PARAM_PORTS_OFF.has(s.cat) ? [] : s.params.filter(p => p[2] === 'range').map(p => p[0]);
  return [k, { ...s, doc: STEP_DOCS[k] || s.doc || '', required: STEP_REQUIRED.has(k) || s.req ? [1] : [],
    dataIns: s.ins.length,
    ins: s.ins.concat(paramPorts.map(key => '⚙ ' + s.params.find(p => p[0] === key)[1])),
    inTypes: s.ins.map((_, i) => (io.ins || [])[i] || 'field').concat(paramPorts.map(() => 'value')),
    outTypes: s.outs.map((_, i) => (io.outs || [])[i] || 'field'),
    paramPorts }];
}));
/** The input port (1-based) that drives a param, or 0 if it has none. */
export function paramPort(name, key){ const s = STEPS[name]; if(!s) return 0; const i = s.paramPorts.indexOf(key); return i < 0 ? 0 : s.dataIns + i + 1; }
/** A param's range (for a bound param with no range of its own), or null. */
export function stepRange(name, key){
  const p = ((STEPS[name] || {}).params || []).find(q => q[0] === key);
  return p && p[2] === 'range' ? [p[4].min, p[4].max] : null;
}
