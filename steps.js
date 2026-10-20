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
import { makeNoiseGrid, sampleNoiseGrid, canonDiv, smoothField, CPU, wordsRoom, litT, litS } from './texCore.js';
import { drawStitch, pathFromPoints, roundRectPoints } from './stitches.js';
import { TOUCH_STEPS } from './stepsTouch.js';
import { WHIMSY_STEPS } from './stepsWhimsy.js';
import { LIGHT_STEPS } from './stepsLight.js';
import { SHARP_STEPS } from './stepsSharpness.js';
import { CHAOS_STEPS } from './stepsChaos.js';
import { GEN_STEPS } from './stepsGenerative.js';
import { RING_STEPS } from './stepsRing.js';
import { ROOM_STEPS } from './stepsRoom.js';
import { FLORA_STEPS } from './stepsFlora.js';
import { NETWORK_STEPS } from './stepsNetwork.js';
import { STREAMER_STEPS } from './stepsStreamers.js';
import { LENS_STEPS } from './stepsLens.js';
import { IMPRINT_STEPS } from './stepsImprint.js';
import { SPECIMEN_STEPS } from './stepsSpecimen.js';
import { GRASS_STEPS } from './stepsGrass.js';
import { PATTERN_STEPS } from './stepsPatterns.js';
import { CARD_STEPS } from './cartomancy.js';

const STEP_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const STEP_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
// PUNCTUATION (ROADMAP G2): the marks the page records, each by its number (1-based) in the layout's "x,y,mark" points
// (three numbers, so every reader of the runs passes them over), and how far down its line each sits (0 top, 1 bottom)
export const POEM_PUNCT = [{ marks: '.', at: 0.74 }, { marks: ',', at: 0.76 }, { marks: ';', at: 0.6 }, { marks: ':', at: 0.55 }, { marks: '!', at: 0.45 },
  { marks: '?', at: 0.45 }, { marks: '—–-', at: 0.5 }, { marks: '…', at: 0.74 }, { marks: '"“”‘’\'«»', at: 0.2 }, { marks: '()[]{}', at: 0.5 }];
export function punctMark(ch){ for(let i = 0; i < POEM_PUNCT.length; i++) if(POEM_PUNCT[i].marks.includes(ch)) return i + 1; return 0; }
const POEM_MARK_SETS = { 'every mark': null, 'stops . ! ? …': [1, 5, 6, 8], 'pauses , ; :': [2, 3, 4], 'dashes': [7], 'quotes and brackets': [9, 10] };
/** The punctuation the page recorded: [x, y, mark] in fractions of the page. */
export function poemMarks(text){
  const out = [];
  for(const part of String(text || '').split(';')){ const v = part.split(',').map(Number); if(v.length === 3 && v.every(isFinite) && v[2] >= 1) out.push(v); }
  return out;
}
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

/** A curve's value at t (0..1), between its samples ({ curve: Float32Array(257) }). */
export function curveAt(c, t){ const s = c.curve, n = s.length - 1, x = Math.max(0, Math.min(1, t))*n, i = Math.min(n - 1, Math.floor(x)), f = x - i; return s[i] + (s[i + 1] - s[i])*f; }
const stepCurve = fn => { const s = new Float32Array(257); for(let i = 0; i <= 256; i++) s[i] = Math.max(-1, Math.min(2, fn(i/256))); return { curve: s }; };
/** A curve's points as written ("x,y;x,y", each 0–100), read: sorted by x, inside the square, at least the two ends. */
export function curvePoints(text){
  const pts = String(text || '').split(';').map(p => p.split(',').map(Number)).filter(p => p.length === 2 && p.every(isFinite))
    .map(([x, y]) => [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))]).sort((a, b) => a[0] - b[0])
    .filter((p, i, a) => i === 0 || p[0] > a[i - 1][0]).slice(0, 16);
  return pts.length >= 2 ? pts : [[0, 0], [100, 100]];
}
/** The curve through those points, smooth and never overshooting them (a monotone cubic: Fritsch and Carlson, 1980,
 *  as curve editors use, so a hand-set point is where the curve goes and no bump appears between two), flat past the
 *  first and the last. */
export function curveFromPoints(text){
  const P = curvePoints(text), n = P.length, x = P.map(p => p[0]/100), y = P.map(p => p[1]/100);
  const d = x.slice(0, -1).map((_, i) => (y[i + 1] - y[i])/Math.max(1e-6, x[i + 1] - x[i]));
  const m = y.map((_, i) => i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1]*d[i] <= 0 ? 0 : (d[i - 1] + d[i])/2);
  for(let i = 0; i < n - 1; i++){ if(d[i] === 0){ m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i]/d[i], b = m[i + 1]/d[i], h = a*a + b*b; if(h > 9){ const t = 3/Math.sqrt(h); m[i] = t*a*d[i]; m[i + 1] = t*b*d[i]; } }
  return stepCurve(t => { if(t <= x[0]) return y[0]; if(t >= x[n - 1]) return y[n - 1];
    let i = 0; while(i < n - 2 && t > x[i + 1]) i++;
    const h = x[i + 1] - x[i], u = (t - x[i])/h, u2 = u*u, u3 = u2*u;
    return (2*u3 - 3*u2 + 1)*y[i] + (u3 - 2*u2 + u)*h*m[i] + (-2*u3 + 3*u2)*y[i + 1] + (u3 - u2)*h*m[i + 1]; });
}
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

// ---- a noise whose Scale is a map ----
// A noise at a scale that varies by point (Filter Forge's mapped Scale): layers an octave apart (cells = scale/10),
// each point read between the two nearest, mixed so the pattern keeps its contrast (two unrelated layers simply
// averaged would flatten it). `layer(cells)` gives a function (x, y, q) → a value around 0.5.
function stepScaleByPoint(E, SC, layer){
  const { ww, wh, N } = E; let lo = Infinity, hi = -Infinity;
  for(let i = 0; i < N; i++){ const c = Math.max(1, SC[i])/10; if(c < lo) lo = c; if(c > hi) hi = c; }
  const K = Math.max(1, Math.ceil(Math.log2(hi/lo) - 1e-9)), layers = Array.from({ length: K + 1 }, (_, j) => layer(lo*Math.pow(2, j))), o = new Float32Array(N);
  for(let y = 0, q = 0; y < wh; y++) for(let x = 0; x < ww; x++, q++){
    const p = Math.log2(Math.max(1, SC[q])/10/lo), j = Math.min(K - 1, Math.floor(p)), t = Math.max(0, Math.min(1, p - j));
    const a = layers[j](x, y, q) - 0.5, b = t > 0 ? layers[j + 1](x, y, q) - 0.5 : 0;
    o[q] = Math.max(0, Math.min(1, 0.5 + (a*(1 - t) + b*t)/Math.sqrt((1 - t)*(1 - t) + t*t)));
  }
  return o;
}

// THE PARTS as the editor shows them, each one whole, as the families keep theirs:
//   { cat, label, ins, outs, params, cost, io, req, maps, run }
// - cost: its weight in the budget (1 if it doesn't say).
// - io: its port types, where they aren't gray maps.
// - req (REQUIRED INPUTS, Filter Forge): it has nothing to work on without its first input. The editor marks the port
//   while it is empty, and a step preview shows a warning pattern in its place, so the rest of the part still shows
//   what it does; the Surface itself never sees the stand-in (an old graph draws as it did).
// - maps (SETTINGS THAT TAKE A MAP, Filter Forge's parameter mapping): in a v3 graph a gray map or a picture on one
//   of these ⚙ ports sets it point by point (athanor.js E.map); any other setting reads a map's average. The
//   evaluator maps only these, the wiki marks them, the editor's menu says so. `key:4`: from graph version 4 on
//   (an older graph reads it whole, as it always did).
// - run(E, n): what it does.
const STEP_PARTS = {
  // inputs: what the finished texture offers on the page
  knob: { cat: 'Inputs', label: 'Knob', ins: [], outs: ['value'], params: [STEP_SEL('slot', 'Slider', ['1','2','3','4','5','6','7','8','9','10']), ['name', 'Name', 'text', 'Amount'], STEP_R('def', 'Default', 50),
    STEP_SEL('kind', 'Kind', ['slider', 'steps', 'angle', 'switch']), [...STEP_R('steps', 'Steps', 3, 2, 12).slice(0, 4), { min: 2, max: 12, when: 'kind:steps' }],
    ['names', 'Mark Names', 'text', '', { when: 'kind:steps|switch' }]], io: { outs: ['value'] },
    run(E, n){ const { ctx, num, P } = E;
    const v = Math.max(0, Math.min(100, +((ctx.knobs || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] ?? num(n, 'def', 50))))/100, kind = P(n, 'kind', 'slider');
    // a Knob of steps hands on only its marks, a switch only off or on (whatever the slider between them says)
    if(kind === 'steps'){ const k = Math.max(2, Math.min(12, Math.round(num(n, 'steps', 3)))) - 1; return [Math.round(v*k)/k]; }
    if(kind === 'switch') return [v >= 0.5 ? 1 : 0];
    return [v];
  } },
  hue: { cat: 'Inputs', label: 'Hue', ins: [], outs: ['colour'], params: [STEP_SEL('slot', 'Hue', ['1','2','3','4','5','6']), ['name', 'Name', 'text', 'Light Hue']], io: { outs: ['colour'] },
    run(E, n){ const { ctx, P, hexCol } = E, t = (ctx.tints || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1];
    // an empty picker reads as white, and says so (`none`): a whole texture as a part then uses its own color
    const c = hexCol(t || '#FFFFFF'); if(!/^#?[0-9a-f]{6}/i.test(t || '')) c.none = true; return [c];
  } },
  glowhue: { cat: 'Inputs', label: 'Glow Hue', ins: [], outs: ['colour'], params: [],
    run(E, n){ const g = E.ctx.glow; return [g ? [g.r, g.g, g.b] : [0, 0, 0]]; } },   // (glowOf: channels 0–1)
  dial: { cat: 'Inputs', label: 'Light Dial', ins: [], outs: ['direction', 'height', 'way'], params: [], io: { outs: ['value', 'value', 'value'] },
    run(E, n){ const { ctx } = E;
    // (WAY: the way the light travels, away from the handle, as an angle counted from the right as Motion Blur, Smudge
    //  and Rotate count theirs; Direction is counted from the top, as the dial is)
    const d = ((ctx.light ?? 315) % 360 + 360) % 360;
    return [d/360, Math.max(0, Math.min(1.3, (ctx.lightTilt ?? 100)/100)), ((d + 90) % 360)/360];
  } },
  camdial: { cat: 'Inputs', label: 'Camera Dial', ins: [], outs: ['turn', 'view', 'zoom'], params: [], io: { outs: ['value', 'value', 'value'] },
    run(E, n){ const c = E.ctx.camera || {}, z = c.zoom ?? 100;
    return [((c.turn ?? 0) % 360 + 360) % 360/360, Math.max(0, Math.min(1.3, (c.view ?? 0)/100)), Math.max(0, Math.min(1, (z - 25)/375))]; } },
  // THE CURVE CONTROL (ROADMAP D4, Filter Forge's Curve control): a curve drawn by hand on the page, under Surface
  curvectl: { cat: 'Inputs', label: 'Curve Control', ins: [], outs: ['curve'], params: [STEP_SEL('slot', 'Curve', ['1', '2']), ['name', 'Name', 'text', 'Curve'], ['points', 'Default', 'text', '0,0;100,100']], io: { outs: ['curve'] },
    // the CAMERA DIAL (Ruby: a second dial, for the camera, so the light dial is the light's alone): its turn as 0–1 round
    // the dial, its view as how far the handle is drawn out (0 overhead, 1 at the rim, up to 1.3 past it), its zoom as
    // where it sits from 25% (0) to 400% (1) — wire each into a setting with a range ('~lens': '25,400')
    run(E, n){ const { ctx, P } = E, sl = Math.max(1, Math.min(2, parseInt(P(n, 'slot', '1'), 10) || 1));
    // (the curve drawn on the page when the graph is the page's surface; else the part's own Default)
    const drawn = (ctx.curves || [])[sl - 1];
    return [curveFromPoints(drawn || P(n, 'points', '0,0;100,100'))];
  } },
  seed: { cat: 'Inputs', label: 'Seed', ins: [], outs: ['seed'], params: [], io: { outs: ['value'] },
    run(E, n){ const { ctx } = E;
    return [((ctx.seed >>> 0) % 1000)/1000];
  } },
  page: { cat: 'Inputs', label: 'Page Coordinates', ins: [], outs: ['x', 'y', 'radius'], params: [], cost: () => 3,
    run(E, n){ const { field } = E;
    return [field(u => u), field((u, v) => v), field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
  } },
  // makers
  noise: { cat: 'Noise', label: 'Value Noise', ins: ['seed'], outs: ['field'], params: [STEP_R('scale', 'Scale', 40, 1, 200), STEP_R('octaves', 'Octaves', 3, 1, 6), STEP_R('variation', 'Variation', 0, 0, 99)], cost: d => Math.max(1, +d.octaves || 3), io: { ins: ['value'] }, maps: ['scale:4'],
    run(E, n){ const { unit, input, num, map, field } = E;
    const SC = map(n, 'scale', 40);
    const cells = Math.max(1, typeof SC === 'number' ? SC : 40)/10, oct = Math.max(1, Math.min(6, Math.round(num(n, 'octaves', 3))));
    const s0 = input(n, 1), off = typeof s0 === 'number' ? s0*97 : 0;
    // one layer of noise at `cells` across the short side, its octaves each half as strong
    const layer = cells => { const grids = []; for(let o = 0; o < oct; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; grids.push({ g, grid: makeNoiseGrid(g, g), a: Math.pow(0.5, o) }); }
      const norm = grids.reduce((s, o) => s + o.a, 0);
      return (x, y) => { let s = 0; for(const o of grids) s += sampleNoiseGrid(o.grid, o.g, o.g, x/unit*(o.g - 1) + off, y/unit*(o.g - 1) + off*1.7)*o.a; return s/norm; }; };
    // square cells, `scale/10` of them across the page's short side
    if(typeof SC === 'number'){ const one = layer(cells); return [field((u, v, x, y) => one(x, y))]; }
    // SCALE BY POINT (a map on its ⚙): layers an octave apart, each point read between the two nearest
    return [stepScaleByPoint(E, SC, layer)];
  } },
  cells: { cat: 'Noise', label: 'Cells', ins: ['seed'], outs: ['distance', 'edges', 'id', 'stones'], params: [STEP_R('scale', 'Scale', 30, 2, 200), STEP_R('jitter', 'Jitter', 80), STEP_R('variation', 'Variation', 0, 0, 99), STEP_R('gap', 'Gap', 25)], cost: () => 9, io: { ins: ['value'] },
    run(E, n){ const { ww, wh, N, unit, num } = E;
    const sc = Math.max(2, num(n, 'scale', 30))/10, jit = num(n, 'jitter', 80)/100, cs = unit/sc;
    const gx = Math.ceil(ww/cs) + 2, gy = Math.ceil(wh/cs) + 2, pts = new Float32Array(gx*gy*3);
    for(let i = 0; i < gx*gy; i++){ pts[i*3] = 0.5 + (Math.random() - 0.5)*jit; pts[i*3+1] = 0.5 + (Math.random() - 0.5)*jit; pts[i*3+2] = Math.random(); }
    const d1 = new Float32Array(N), ed = new Float32Array(N), id = new Float32Array(N), st = new Float32Array(N), gap = num(n, 'gap', 25)/100*0.3;
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const cx = Math.floor(x/cs) + 1, cy = Math.floor(y/cs) + 1; let a = 1e9, b = 1e9, ia = 0;
      for(let j = cy - 1; j <= cy + 1; j++) for(let i = cx - 1; i <= cx + 1; i++){ if(i < 0 || j < 0 || i >= gx || j >= gy) continue;
        const k = (j*gx + i)*3, px = (i - 1 + pts[k])*cs, py = (j - 1 + pts[k+1])*cs, d = Math.hypot(px - x, py - y);
        if(d < a){ b = a; a = d; ia = pts[k+2]; } else if(d < b) b = d; }
      const q = y*ww + x; d1[q] = Math.min(1, a/cs); ed[q] = 1 - Math.min(1, (b - a)/cs*4); id[q] = ia;
      // STONES (Filter Forge's Stones): each cell a rounded stone, highest in its middle, with Gap between them
      const t = Math.max(0, Math.min(1, ((b - a)/cs - gap)/0.5)); st[q] = 1 - (1 - t)**3;
    }
    return [d1, ed, id, st];
  } },
  waves: { cat: 'Noise', label: 'Waves', ins: ['warp'], outs: ['field'], params: [STEP_R('freq', 'Frequency', 12, 1, 120), STEP_R('angle', 'Angle', 0, 0, 360)],
    run(E, n){ const { ww, wh, unit, input, num, field, asField } = E;
    const fq = Math.max(1, num(n, 'freq', 12)), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
    const wf = asField(input(n, 1)), asp = ww/unit, asq = wh/unit;
    return [field((u, v, x, y) => 0.5 + 0.5*Math.sin(((u*asp*ca + v*asq*sa)*fq + (wf ? wf[y*ww + x]*2 : 0))*Math.PI*2))];
  } },
  gradient: { cat: 'Noise', label: 'Gradient', ins: [], outs: ['field'], params: [STEP_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular']), STEP_R('angle', 'Angle', 90, 0, 360)],
    run(E, n){ const { num, P, field } = E;
    const shape = P(n, 'shape', 'linear'), an = num(n, 'angle', 90)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
    if(shape === 'radial') return [field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
    if(shape === 'rectangular') return [field((u, v) => Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5))*2)];
    return [field((u, v) => Math.max(0, Math.min(1, 0.5 + ((u - 0.5)*ca + (v - 0.5)*sa))))];
  } },
  turing: { cat: 'Noise', label: 'Reaction–Diffusion (old)', ins: ['seed'], outs: ['field'], params: [STEP_SEL('pattern', 'Pattern', ['spots', 'coral', 'maze', 'worms', 'holes']), STEP_R('scale', 'Scale', 100, 50, 250)], cost: () => 60, io: { ins: ['value'] },
    run(E, n){ const { ww, wh, ctx, deps, num, P, readCanvas, lum } = E;
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
  } },
  texture: { cat: 'Textures', label: 'Texture from the Menu', ins: ['seed'], outs: ['image', 'grey'], params: [['type', 'Texture', 'texture', 'linen'], STEP_R('p1', 'Knob 1', 100, 0, 400), STEP_R('p2', 'Knob 2', 100, 0, 400), STEP_R('p3', 'Knob 3', 50)], cost: () => 40, io: { ins: ['value'], outs: ['image', 'field'] },
    run(E, n){ const { ww, wh, ctx, deps, num, P, readCanvas, lum } = E;
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
  } },
  stitch: { cat: 'Textures', label: 'Stitch Border', ins: [], outs: ['mask'], params: [['style', 'Stitch', 'stitch', 'scallop'], STEP_R('offset', 'Offset', 14, 0, 400), STEP_R('size', 'Size', 4, 1, 40)], cost: () => 8,
    run(E, n){ const { ww, wh, unit, num, P, readCanvas, lum } = E;
    const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d', CPU);
    x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh);
    const k = unit/1536, off = num(n, 'offset', 14)*k*2, sz = Math.max(1, num(n, 'size', 4))*k*2;
    drawStitch(x, pathFromPoints(roundRectPoints(off, off, ww - off*2, wh - off*2, 0), true), String(P(n, 'style', 'scallop')),
      { period: sz*6 + unit*0.012, amp: sz*2 + unit*0.004, width: sz, color: '#fff', side: 1 });
    return [lum(readCanvas(c))];
  } },
  // shaping
  levels: { cat: 'Shape', label: 'Levels', ins: ['field'], outs: ['field'], params: [STEP_R('lo', 'Black Point', 0), STEP_R('hi', 'White Point', 100), STEP_R('gamma', 'Gamma', 50)], req: true, maps: ['lo', 'hi', 'gamma'],
    run(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const LO = map(n, 'lo', 0), HI = map(n, 'hi', 100), GA = map(n, 'gamma', 50), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const lo = at(LO, i)/100, hi = Math.max(lo + 0.01, at(HI, i)/100), g = Math.pow(2, (at(GA, i) - 50)/25);
      o[i] = Math.pow(Math.max(0, Math.min(1, (f[i] - lo)/(hi - lo))), g); }
    return [o];
  } },
  threshold: { cat: 'Shape', label: 'Threshold', ins: ['field'], outs: ['mask'], params: [STEP_R('at', 'Cutoff', 50), STEP_R('soft', 'Softness', 10)], req: true, maps: ['at', 'soft'],
    run(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const AT = map(n, 'at', 50), SF = map(n, 'soft', 10), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const a = at(AT, i)/100, sf = Math.max(0.002, at(SF, i)/200), t = Math.max(0, Math.min(1, (f[i] - a + sf)/(2*sf))); o[i] = t*t*(3 - 2*t); }
    return [o];
  } },
  blur: { cat: 'Shape', label: 'Blur', ins: ['field'], outs: ['field'], params: [STEP_R('radius', 'Radius', 8, 0, 100)], cost: () => 4, req: true, maps: ['radius:4'],
    run(E, n){ const { N, unit, input, map, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null;
    const RA = map(n, 'radius', 8);
    if(typeof RA === 'number') return [boxBlur(f, RA*unit/1536*1.2)];
    // RADIUS BY POINT (a map on its ⚙): the field blurred at a few radii (a blur stack), each point read between the two nearest
    const k = unit/1536*1.2; let lo = Infinity, hi = -Infinity; for(let i = 0; i < N; i++){ const r = RA[i]*k; if(r < lo) lo = r; if(r > hi) hi = r; }
    const eff = r => r < 0.5 ? 0 : Math.max(1, Math.round(r)), radii = [...new Set(Array.from({ length: 7 }, (_, j) => eff(lo + (hi - lo)*(j/6)**2)))].sort((a, b) => a - b);
    if(radii.length === 1) return [boxBlur(f, radii[0])];
    const stack = radii.map(r => boxBlur(f, r)), o = new Float32Array(N), L = radii.length;
    for(let i = 0; i < N; i++){ const r = RA[i]*k; let j = 0; while(j < L - 2 && r > radii[j + 1]) j++;
      const t = Math.max(0, Math.min(1, (r - radii[j])/(radii[j + 1] - radii[j]))); o[i] = stack[j][i] + (stack[j + 1][i] - stack[j][i])*t; }
    return [o];
  } },
  warp: { cat: 'Shape', label: 'Warp', ins: ['field', 'by'], outs: ['field'], params: [STEP_R('amount', 'Strength', 20)], cost: () => 1.5, req: true, maps: ['amount'],
    run(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)), by = asField(input(n, 2)); if(!f) return null; if(!by) return [f];
    const AM = E.map(n, 'amount', 20), o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, a = by[q]*Math.PI*2, A = E.at(AM, q)/100*unit*0.08;
      const sx = Math.max(0, Math.min(ww - 1, Math.round(x + Math.cos(a)*A))), sy = Math.max(0, Math.min(wh - 1, Math.round(y + Math.sin(a)*A))); o[q] = f[sy*ww + sx]; }
    return [o];
  } },
  math: { cat: 'Combine', label: 'Math', ins: ['a', 'b'], outs: ['result'], params: [STEP_SEL('op', 'Operation', ['add', 'multiply', 'max', 'min', 'difference', 'subtract', 'divide', 'power', 'average', 'screen', 'modulo', 'sine', 'round', 'floor', 'ceiling', 'greater', 'less', 'log'])],
    run(E, n){ const { N, input, P, flat, asField } = E;
    const a = asField(input(n, 1), 0), b = asField(input(n, 2), 0); if(!a && !b) return null;
    const A = a || flat(0), B = b || flat(0), op = P(n, 'op', 'add'), o = new Float32Array(N);
    const f = { add: (x, y) => x + y, multiply: (x, y) => x*y, max: Math.max, min: Math.min, difference: (x, y) => Math.abs(x - y), subtract: (x, y) => x - y,
      // Filter Forge's RGB Math, the useful few: b as a divisor, an exponent (0..1 → 0..4), a mean, a screen, a remainder, a wave
      divide: (x, y) => y > 1e-4 ? x/y : 1, power: (x, y) => Math.pow(Math.max(0, x), (b ? y : 0.25)*4), average: (x, y) => (x + y)/2,
      screen: (x, y) => 1 - (1 - x)*(1 - y), modulo: (x, y) => y > 1e-4 ? (x % y)/y : 0, sine: (x, y) => 0.5 + 0.5*Math.sin((x + y)*Math.PI*2),
      // a to steps of b (round, floor, ceiling); 1 where a is greater (or less) than b, else 0; a logarithm, which lifts the darks
      round: (x, y) => y > 1e-4 ? Math.round(x/y)*y : x, floor: (x, y) => y > 1e-4 ? Math.floor(x/y + 1e-9)*y : x, ceiling: (x, y) => y > 1e-4 ? Math.ceil(x/y - 1e-9)*y : x,
      greater: (x, y) => x > y ? 1 : 0, less: (x, y) => x < y ? 1 : 0, log: (x, y) => Math.log(1 + Math.max(0, x)*(1 + y*99))/Math.log(2 + y*99) }[op] || ((x, y) => x + y);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f(A[i], B[i])));
    return [o];
  } },
  mix: { cat: 'Combine', label: 'Mix', ins: ['a', 'b', 'amount'], outs: ['result'], params: [STEP_R('t', 'Amount', 50)], cost: () => 1.5, io: { ins: ['image', 'image', 'field'], outs: ['image'] }, maps: ['t'],
    run(E, n){ const { N, input, num, map, asField, asImage } = E;
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
  } },
  invert: { cat: 'Shape', label: 'Invert', ins: ['field'], outs: ['field'], params: [], req: true,
    run(E, n){ const { N, input, asField, isImg } = E; const v = input(n, 1); if(v == null) return null;
    if(isImg(v)){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ o.r[i] = 1 - v.r[i]; o.g[i] = 1 - v.g[i]; o.b[i] = 1 - v.b[i]; } return [o]; }
    const f = asField(v), o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = 1 - f[i]; return [o];
  } },
  posterize: { cat: 'Shape', label: 'Posterize', ins: ['field'], outs: ['field'], params: [STEP_R('steps', 'Steps', 5, 2, 16), STEP_R('dither', 'Dither', 0), STEP_R('cell', 'Dither Cell', 20, 2, 200), STEP_SEL('pattern', 'Dither Pattern', ['ordered', 'checker', 'scattered'])], req: true, maps: ['steps'],
    run(E, n){ const { ww, wh, N, unit, input, map, at, num, P, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    // DITHER (pixel art's own): a threshold pattern on cells as Pixelate's (the same Cell Size lines them up), so
    // where two steps meet they interleave instead of meeting in a hard line; a little dither only touches the seams
    const K = map(n, 'steps', 5), o = new Float32Array(N), D = num(n, 'dither', 0)/100;
    if(D <= 0){ for(let i = 0; i < N; i++){ const k = Math.max(2, Math.min(16, Math.round(at(K, i)))); o[i] = Math.min(k - 1, Math.floor(Math.max(0, f[i])*k))/(k - 1); } return [o]; }
    const c = Math.max(1, num(n, 'cell', 20)*unit/1536*1.2), pat = P(n, 'pattern', 'ordered');
    const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], hash = (a, b) => { let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0)/4294967296; };
    for(let y = 0; y < wh; y++){ const cy = Math.floor(y/c);
      for(let x = 0; x < ww; x++){ const q = y*ww + x, cx = Math.floor(x/c), k = Math.max(2, Math.min(16, Math.round(at(K, q))));
        const t = pat === 'checker' ? ((cx + cy) & 1)*0.5 + 0.25 : pat === 'scattered' ? hash(cx, cy) : (B4[(cy & 3)*4 + (cx & 3)] + 0.5)/16;
        o[q] = Math.min(k - 1, Math.max(0, Math.floor(Math.max(0, f[q])*k + (t - 0.5)*D)))/(k - 1); } }
    return [o];
  } },
  transform: { cat: 'Shape', label: 'Tile & Rotate', ins: ['field'], outs: ['field'], params: [STEP_R('scale', 'Scale', 100, 25, 400), STEP_R('angle', 'Angle', 0, 0, 360)], cost: () => 1.5, req: true,
    run(E, n){ const { ww, wh, N, input, num, asField } = E;
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
  } },
  edges: { cat: 'Shape', label: 'Edge Detect', ins: ['field'], outs: ['edges'], params: [STEP_R('strength', 'Strength', 50)], cost: () => 2, req: true, maps: ['strength:4'],
    run(E, n){ const { ww, wh, N, unit, input, map, asField } = E;
    // Sobel: where the field changes fastest
    const f = asField(input(n, 1)); if(!f) return null;
    const SM = map(n, 'strength', 50), K = typeof SM === 'number' ? SM/50*unit/96 : 0, o = new Float32Array(N), at = (x, y) => f[Math.max(0, Math.min(wh - 1, y))*ww + Math.max(0, Math.min(ww - 1, x))];
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const gx = at(x+1,y-1) + 2*at(x+1,y) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x-1,y) - at(x-1,y+1);
      const gy = at(x-1,y+1) + 2*at(x,y+1) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x,y-1) - at(x+1,y-1);
      const k = typeof SM === 'number' ? K : SM[y*ww + x]/50*unit/96;   // (STRENGTH BY POINT: a map on its ⚙)
      o[y*ww + x] = Math.min(1, Math.hypot(gx, gy)*k/8);
    }
    return [o];
  } },
  // light and colour
  light: { cat: 'Light & Color', label: 'Simple Lighting', ins: ['height', 'dial'], outs: ['light', 'highlight'], params: [STEP_R('relief', 'Relief', 50), STEP_R('gloss', 'Gloss', 30), STEP_R('shadow', 'Shadow', 60)], cost: () => 14, io: { ins: ['field', 'value'] }, req: true, maps: ['relief:4'],
    run(E, n){ const { N, unit, ctx, input, num, flat, asField, lightOf } = E;
    const h0 = asField(input(n, 1)); if(!h0) return null;
    const dial = input(n, 2), deg = typeof dial === 'number' ? dial*360 : (ctx.light ?? 315);
    // (RELIEF BY POINT: a map on its ⚙ raises the heights more in some places than others)
    const H = new Float32Array(N), RM = E.map(n, 'relief', 50), rel = typeof RM === 'number' ? RM/100*unit*0.02 : 0;
    for(let i = 0; i < N; i++) H[i] = h0[i]*(typeof RM === 'number' ? rel : RM[i]/100*unit*0.02);
    const L = lightOf(H, deg, 1, num(n, 'gloss', 30)/100, num(n, 'shadow', 60)/100), lf = new Float32Array(N), sp = new Float32Array(N);
    for(let i = 0; i < N; i++){ lf[i] = Math.min(1, L.light[i]/L.flat*0.5); sp[i] = L.spec[i]; }
    return [lf, sp];
  } },
  tint: { cat: 'Light & Color', label: 'Tint', ins: ['field', 'light hue', 'dark hue'], outs: ['image'], params: [], cost: () => 1.5, io: { ins: ['field', 'colour', 'colour'], outs: ['image'] }, req: true,
    run(E, n){ const { N, ctx, input, asField, asColour, hexCol } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const lc = asColour(input(n, 2), hexCol((ctx.tints || [])[0] || '#FFFFFF')), dc = asColour(input(n, 3), hexCol((ctx.tints || [])[1] || '#000000'));
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const t = f[i]; o.r[i] = dc[0] + (lc[0] - dc[0])*t; o.g[i] = dc[1] + (lc[1] - dc[1])*t; o.b[i] = dc[2] + (lc[2] - dc[2])*t; }
    return [o];
  } },
  ramp: { cat: 'Light & Color', label: 'Color Ramp', ins: ['field', 'color a', 'color b'], outs: ['image'], params: [STEP_R('mid', 'Midpoint', 50)], cost: () => 2, io: { ins: ['field', 'colour', 'colour'], outs: ['image'] }, req: true,
    run(E, n){ const { N, input, num, asField, asColour } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const a = asColour(input(n, 2), [0, 0, 0]), b = asColour(input(n, 3), [1, 1, 1]), mid = Math.max(0.02, Math.min(0.98, num(n, 'mid', 50)/100));
    const g = Math.log(0.5)/Math.log(mid), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const t = Math.pow(Math.max(0, Math.min(1, f[i])), g); o.r[i] = a[0] + (b[0] - a[0])*t; o.g[i] = a[1] + (b[1] - a[1])*t; o.b[i] = a[2] + (b[2] - a[2])*t; }
    return [o];
  } },
  blend: { cat: 'Combine', label: 'Blend', ins: ['base', 'layer', 'mask'], outs: ['image'], params: [STEP_SEL('mode', 'Mode', STEP_BLENDS), STEP_R('opacity', 'Opacity', 100)], cost: () => 3, io: { ins: ['image', 'image', 'field'], outs: ['image'] }, maps: ['opacity'],
    run(E, n){ const { N, input, P, asField, asImage } = E;
    const base = asImage(input(n, 1) ?? 0.5), lay = input(n, 2), m = asField(input(n, 3));
    if(lay == null) return [base];
    // (a single color is read as itself, as a flat picture of it would hold it; where the mask is black, the base passes)
    const col = Array.isArray(lay) ? lay.map(Math.fround) : null, L = col ? null : asImage(lay);
    const fn = STEP_BLEND_FN[P(n, 'mode', 'normal')] || STEP_BLEND_FN.normal, OP = E.map(n, 'opacity', 100);
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, OR = o.r, OG = o.g, OB = o.b, BR = base.r, BG = base.g, BB = base.b;
    const LR = L && L.r, LG = L && L.g, LB = L && L.b, cl = v => Math.max(0, Math.min(1, v));
    for(let i = 0; i < N; i++){ const k = E.at(OP, i)/100*(m ? m[i] : 1), r0 = BR[i], g0 = BG[i], b0 = BB[i];
      if(k === 0){ OR[i] = r0; OG[i] = g0; OB[i] = b0; continue; }
      OR[i] = r0 + (cl(fn(r0, col ? col[0] : LR[i])) - r0)*k; OG[i] = g0 + (cl(fn(g0, col ? col[1] : LG[i])) - g0)*k; OB[i] = b0 + (cl(fn(b0, col ? col[2] : LB[i])) - b0)*k; }
    return [o];
  } },
  // the end
  // (A LIT SURFACE, ROADMAP B1: beside picture and height, maps for how it reflects, how blurred its reflection, how
  // metallic it is and where it glows; with none of them wired it draws exactly as it always has)
  surface: { cat: 'Output', label: 'Surface', ins: ['image', 'height', 'reflectivity', 'reflection blur', 'metallic', 'emission'], outs: [], params: [['name', 'Name', 'text', 'My Surface'], STEP_SEL('ground', 'Ground', ['grey', 'colour']),
              // Filter Forge's SIZE: every distance in the graph is measured against it, so one slider scales the whole surface
              STEP_R('size', 'Size', 100, 25, 400),
              // ANTI-ALIASING (Filter Forge's menu, ROADMAP A6): off as every graph always drew; edges only smooths the hard
              // edges where they step across the grid (FXAA); all pixels also draws the whole graph on a grid twice as fine
              STEP_SEL('aa', 'Anti-aliasing', ['off', 'edges only', 'all pixels'])], io: { ins: ['image', 'field', 'field', 'field', 'field', 'field'] },
    run(E, n){ const { N, unit, ctx, input, flat, asField, asImage, lightOf } = E;
    const img = asImage(input(n, 1) ?? 0.5), h0 = asField(input(n, 2));
    // ONE CHANNEL for the preview (ROADMAP B2; view only): the height as gray, the normals it makes (a normal map's colors:
    // flat is (0.5, 0.5, 1), green up), the light that reaches into its hollows (occlusion), its shine (specular). Each but
    // the height is drawn at full contrast, so you see WHERE it falls (gentle slopes steepened until the usual one reads at
    // about 35°; the deepest hollow black, the brightest shine white): Final shows how strong it really is.
    if(ctx.channel && ctx.channel !== 'final'){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, put = (i, r, g, b) => { o.r[i] = r; o.g[i] = g; o.b[i] = b; };
      const { ww, wh } = E, H = new Float32Array(N); if(h0) for(let i = 0; i < N; i++) H[i] = h0[i]*unit*0.01;
      if(ctx.channel === 'height'){ for(let i = 0; i < N; i++){ const v = h0 ? Math.max(0, Math.min(1, h0[i])) : 0.5; put(i, v, v, v); } return [o]; }
      if(ctx.channel === 'normal'){ const GX = new Float32Array(N), GY = new Float32Array(N), mags = [];
        for(let y = 0, i = 0; y < wh; y++) for(let x = 0; x < ww; x++, i++){ GX[i] = (H[y*ww + Math.min(ww - 1, x + 1)] - H[y*ww + Math.max(0, x - 1)])*0.5; GY[i] = (H[Math.min(wh - 1, y + 1)*ww + x] - H[Math.max(0, y - 1)*ww + x])*0.5;
          if(i % Math.max(1, N >> 12) === 0) mags.push(Math.hypot(GX[i], GY[i])); }
        mags.sort((a, b) => a - b); const p90 = mags[Math.floor(mags.length*0.9)] || 0, k = p90 > 1e-9 ? Math.max(1, Math.min(32, 0.7/p90)) : 1;
        for(let i = 0; i < N; i++){ const gx = GX[i]*k, gy = GY[i]*k, nl = Math.hypot(gx, gy, 1); put(i, 0.5 - gx/nl*0.5, 0.5 + gy/nl*0.5, 0.5 + 0.5/nl); } return [o]; }
      const L = lightOf(H, ctx.light ?? 315, 1, 0.3, 0.6, { components: true }), A = ctx.channel === 'occlusion' ? L.occl : L.spec;
      let top = 0; for(let i = 0; i < N; i++) if(A[i] > top) top = A[i];
      for(let i = 0; i < N; i++){ const t = h0 && top > 1e-6 ? Math.max(0, Math.min(1, A[i]/top)) : 0, v = ctx.channel === 'occlusion' ? 1 - t : t; put(i, v, v, v); }
      return [o]; }
    // THE LIT SURFACE (B1): only when one of its material maps is wired, so every older graph draws as it did
    const RF = asField(input(n, 3)), BL = asField(input(n, 4)), MT = asField(input(n, 5)), EM = asField(input(n, 6));
    if(RF || BL || MT || EM){
      const H = new Float32Array(N); if(h0) for(let i = 0; i < N; i++) H[i] = h0[i]*unit*0.01;
      // reflection blur is the gloss turned over (0: a mirror's sharp highlight; 1: a broad, soft one)
      const gloss = BL ? (() => { const g = new Float32Array(N); for(let i = 0; i < N; i++) g[i] = 1 - Math.max(0, Math.min(1, BL[i])); return g; })() : null;
      const L = lightOf(H, ctx.light ?? 315, 1, 0.3, 0.6, gloss ? { glossMap: gloss } : null), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      // WHAT IT REFLECTS (ROADMAP C4, cheaply — Filter Forge's HDRI): a sky over a ground, from the page's backdrop when the
      // graph has it, else the surface's two hues; each point reflects the part of it its slope faces (the viewer overhead)
      const { ww, wh, hexCol } = E, env = Array.isArray(ctx.env) && ctx.env.length ? ctx.env.map(c => hexCol(String(c))) : null;
      const t = ctx.tints || [], sky = env ? env[0] : hexCol(t[0] || '#E8ECF2'), ground = env ? env[env.length - 1] : hexCol(t[1] || '#2A2622');
      for(let y = 0, i = 0; y < wh; y++) for(let x = 0; x < ww; x++, i++){
        const k = L.light[i]/L.flat, rf = RF ? Math.max(0, Math.min(1, RF[i])) : 0.6, mt = MT ? Math.max(0, Math.min(1, MT[i])) : 0, em = EM ? Math.max(0, EM[i]) : 0;
        const gx = (H[y*ww + Math.min(ww - 1, x + 1)] - H[y*ww + Math.max(0, x - 1)])*0.5, gy = (H[Math.min(wh - 1, y + 1)*ww + x] - H[Math.max(0, y - 1)*ww + x])*0.5;
        const nl = Math.hypot(gx, gy, 1), ny = -gy/nl, nz = 1/nl, ry = 2*nz*ny, rz = 2*nz*nz - 1;
        const u = Math.max(0, Math.min(1, 0.5 + (rz*0.6 - ry*0.4)*0.8)), er = ground[0] + (sky[0] - ground[0])*u, eg = ground[1] + (sky[1] - ground[1])*u, eb = ground[2] + (sky[2] - ground[2])*u;
        // a metal shows little diffuse light and mirrors the sky in its own color; anything else reflects a little of it,
        // white (a dielectric's few percent head-on, more at a slant), with a highlight
        const fres = 0.04 + 0.96*Math.pow(1 - nz, 5), dk = k*(1 - 0.85*mt), s = L.spec[i]*Math.max(0.05*(1 - mt), rf);
        const rm = rf*mt*(0.35 + 0.65*k), rd = rf*(1 - mt)*fres*0.6;
        const r = img.r[i], g = img.g[i], b = img.b[i];
        o.r[i] = r*dk + er*(r*rm + rd) + s*(1 - mt + mt*r) + r*em;
        o.g[i] = g*dk + eg*(g*rm + rd) + s*(1 - mt + mt*g) + g*em;
        o.b[i] = b*dk + eb*(b*rm + rd) + s*(1 - mt + mt*b) + b*em;
        // (the page's coloured lights: their shift of the light on each channel, and the rim's colour on its shine)
        if(L.hue){ const f = (1 - 0.85*mt)/L.flat;
          o.r[i] += r*litT(L, i, 0)*f + s*(1 - mt + mt*r)*(litS(null, 0, L, i) - 1);
          o.g[i] += g*litT(L, i, 1)*f + s*(1 - mt + mt*g)*(litS(null, 1, L, i) - 1);
          o.b[i] += b*litT(L, i, 2)*f + s*(1 - mt + mt*b)*(litS(null, 2, L, i) - 1); } }
      return [o];
    }
    if(!h0) return [img];
    // heights: the picture lit by the dial, as the engine lights a texture
    const H = new Float32Array(N); for(let i = 0; i < N; i++) H[i] = h0[i]*unit*0.01;
    const L = lightOf(H, ctx.light ?? 315, 1, 0.3, 0.6), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = L.light[i]/L.flat, s = L.spec[i]*0.6; o.r[i] = img.r[i]*k + s; o.g[i] = img.g[i]*k + s; o.b[i] = img.b[i]*k + s; }
    // (the page's coloured lights, ROADMAP C1, C2: the Ambient Hue and the rim light's hue on each channel)
    if(L.hue) for(let i = 0; i < N; i++){ const s = L.spec[i]*0.6;
      o.r[i] += img.r[i]*litT(L, i, 0)/L.flat + s*(litS(null, 0, L, i) - 1);
      o.g[i] += img.g[i]*litT(L, i, 1)/L.flat + s*(litS(null, 1, L, i) - 1);
      o.b[i] += img.b[i]*litT(L, i, 2)/L.flat + s*(litS(null, 2, L, i) - 1); }
    return [o];
  } },
  // a NOTE on the graph (Filter Forge's Note component): words for whoever opens it next; it makes nothing
  note: { cat: 'Inputs', label: 'Note', ins: [], outs: [], params: [['text', 'Note', 'text', 'A note to the next reader']], cost: () => 0,
    run(){ return []; } },
  // newer parts (the chains' own)
  colour: { cat: 'Inputs', label: 'Color', ins: [], outs: ['colour'], params: [['hex', 'Color', 'text', '#808080']], io: { outs: ['colour'] },
    run(E, n){ const { P, hexCol } = E;
    return [hexCol(String(P(n, 'hex', '#808080')))];
  } },
  // the page's own two accent colors (Cartomancy's first two suits)
  accent: { cat: 'Inputs', label: 'Accent', ins: [], outs: ['colour'], params: [STEP_SEL('slot', 'Accent', ['1', '2']), ['name', 'Name', 'text', 'Accent']], io: { outs: ['colour'] },
    run(E, n){ const { ctx, P, hexCol } = E, k = (parseInt(P(n, 'slot', '1'), 10) || 1) - 1;
    return [hexCol((ctx.accents || [])[k] || ['#B0303A', '#C9A33A'][k] || '#808080')];
  } },
  // the poem's own ink (ROADMAP G3): a surface that keeps its distance from the words' color
  ink: { cat: 'Inputs', label: 'Ink', ins: [], outs: ['colour'], params: [['name', 'Name', 'text', 'Ink']], io: { outs: ['colour'] },
    // (the page's text color; a gradient's first stop. The Athanor's own previews, with no page, write in the default ink)
    run(E){ return [E.hexCol((E.ctx.accents || [])[2] || '#F2F2EF')]; } },
  // the page's own backdrop (Materia's color or gradient): what a surface drawn over the whole page can be made of
  backdrop: { cat: 'Inputs', label: 'Page Backdrop', ins: [], outs: ['picture'], params: [], io: { outs: ['image'] },
    // the backdrop's colors, top to bottom (a board's green where there is no page: the Athanor's own previews)
    run(E){ const { ww, wh, N, ctx, hexCol } = E;
    const cols = (Array.isArray(ctx.env) && ctx.env.length ? ctx.env : ['#16382B', '#0B2219']).map(c => hexCol(String(c))), last = cols.length - 1;
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let y = 0; y < wh; y++){ const f = (wh > 1 ? y/(wh - 1) : 0)*last, i = Math.min(Math.max(0, last - 1), Math.floor(f)), u = last ? f - i : 0, A = cols[i], B = cols[Math.min(last, i + 1)];
      const r = A[0] + (B[0] - A[0])*u, g = A[1] + (B[1] - A[1])*u, b = A[2] + (B[2] - A[2])*u;
      o.r.fill(r, y*ww, y*ww + ww); o.g.fill(g, y*ww, y*ww + ww); o.b.fill(b, y*ww, y*ww + ww); }
    return [o];
  } },
  forms: { cat: 'Noise', label: 'Soft Forms', ins: [], outs: ['tone'], params: [STEP_R('count', 'Forms', 5, 1, 12), STEP_R('size', 'Size', 50), STEP_R('noise', 'Noise', 50)], cost: () => 2,
    // a few large soft shapes and a little noise: where a drawing is dark
    run(E, n){ const { ww, wh, unit, num } = E;
    const k = Math.max(1, Math.round(num(n, 'count', 5))), sz = num(n, 'size', 50)/50, nz = num(n, 'noise', 50)/100;
    const blobs = []; for(let i = 0; i < k; i++) blobs.push({ x: Math.random(), y: Math.random(), r: (0.18 + Math.random()*0.28)*sz, s: 0.5 + Math.random()*0.6 });
    const g = makeNoiseGrid(6, 6);
    // broad shapes: sampled on a lattice and blended between (smoothField), not at every pixel
    return [smoothField(ww, wh, Math.max(2, unit/96), (u, v) => { let t = 0; for(const b of blobs){ const q = ((u - b.x)**2 + (v - b.y)**2)/(b.r*b.r); t += b.s*Math.exp(-q*1.6); }
      return Math.max(0, Math.min(1, t*0.75 + (sampleNoiseGrid(g, 6, 6, u*5, v*5) - 0.5)*nz)); })];
  } },
  streaks: { cat: 'Marks', label: 'Streaks', ins: ['base'], outs: ['field'], params: [STEP_SEL('kind', 'Kind', ['streaks', 'sheets']), STEP_R('angle', 'From', 0, 0, 360),
              STEP_R('spread', 'Gusts', 0, 0, 40), STEP_R('length', 'Length', 100, 100, 500), STEP_R('count', 'Count', 100, 0, 400), STEP_R('light', 'Light Share', 75), STEP_R('strength', 'Strength', 50)], cost: () => 4,
    // RAIN in depth: far back, soft wide sheets; nearer, streaks blurred by
    // their motion (fading at both ends). They come FROM the angle (the dial's
    // way); GUSTS swing them, page-wide, as a gust front would — near streaks
    // swing together with their neighbours, not each its own way.
    run(E, n){ const { ww, wh, unit, input, num, P, asField, marks, px, carea } = E;
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
  } },
  hatching: { cat: 'Marks', label: 'Hatching', ins: ['tone'], outs: ['ink'], params: [STEP_R('angle', 'Direction', 125, 0, 360), STEP_R('density', 'Density', 100, 10, 700),
              STEP_R('size', 'Patch Size', 100, 25, 400), STEP_R('cross', 'Cross-Hatching', 38), STEP_R('crossAngle', 'Cross Angle', 54, 10, 90), STEP_R('weight', 'Weight', 50)], cost: () => 6,
    // The plate is scratched
    // in one direction, always.
    // Patience, then a line.
    //
    // SILVERPOINT hatching: patches of short strokes, parallel, tapered at both
    // ends, slightly curved, heavier where the stylus pressed; the patches
    // gather where the TONE is high, and where it is highest a second layer
    // crosses (CROSS-HATCHING: none at 0, everywhere at 100). The strokes run
    // along the angle (the dial's way). Out: how much ink covers each point.
    run(E, n){ const { ww, wh, unit, input, num, asField, marks, px } = E;
    const tone = asField(input(n, 1)), at = (u, v) => tone ? tone[Math.min(wh - 1, (v*wh) | 0)*ww + Math.min(ww - 1, (u*ww) | 0)] : 0.5;
    // (Shape Aware: round the words, the strokes stop short of them and fade as they near, leaving the lines on clean
    //  paper; in the letters, the patches are smaller, to show in a stroke)
    const room = wordsRoom(E.ctx, ww, wh, 0.25, 1.3), roomAt = (x, y) => room ? room[Math.min(wh - 1, Math.max(0, y | 0))*ww + Math.min(ww - 1, Math.max(0, x | 0))] : 1;
    const base = (num(n, 'angle', 125) - 90)*Math.PI/180, cross = num(n, 'cross', 38)/100, ca2 = num(n, 'crossAngle', 54)*Math.PI/180;
    const f = +E.ctx.fill || 0, zoom = num(n, 'size', 100)/100*(1 - 0.5*f), patches = Math.round(150*num(n, 'density', 100)/100*(1 + 2*f)), wt = num(n, 'weight', 50)/50;
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
            const press = 0.6 + Math.random()*0.4, ra = la + (Math.random() - 0.5)*0.06, bend = len*(Math.random() - 0.5)*0.08;
            const rm = room ? Math.min(roomAt(sx, sy), roomAt(sx + Math.cos(ra)*len*0.5, sy + Math.sin(ra)*len*0.5), roomAt(sx - Math.cos(ra)*len*0.5, sy - Math.sin(ra)*len*0.5)) : 1;
            if(rm > 0.08) stroke(sx, sy, ra, len, px(2.6 + t*3)*press*wt, bend, (0.5 + t*0.45)*press*rm);
          }
        }
      }
    })];
  } },
  // the way Filter Forge folds a picture: mirror it round the centre, or wrap it into rings
  kaleidoscope: { cat: 'Shape', label: 'Kaleidoscope', ins: ['field'], outs: ['field'], params: [STEP_R('folds', 'Folds', 6, 2, 16), STEP_R('turn', 'Turn', 0, 0, 360), STEP_R('zoom', 'Zoom', 100, 25, 400)], cost: () => 1.5, req: true,
    // fold the picture into N mirrored wedges about the centre (a kaleidoscope)
    run(E, n){ const { ww, wh, N, input, num, asField } = E;
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
  } },
  polar: { cat: 'Shape', label: 'Polar Wrap', ins: ['field'], outs: ['field'], params: [STEP_R('rings', 'Rings', 100, 25, 400), STEP_R('turn', 'Turn', 0, 0, 360)], cost: () => 1.5, req: true,
    // the picture wrapped round the centre: its left edge the middle, its rows rings
    run(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const rings = Math.max(0.25, num(n, 'rings', 100)/100), turn = num(n, 'turn', 0)/360, cx = ww/2, cy = wh/2, R = unit*0.5, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = x - cx, dy = y - cy, u = (((Math.atan2(dy, dx)/(Math.PI*2) + 0.5 + turn) % 1) + 1) % 1, v = (Math.hypot(dx, dy)/R*rings) % 1;
      o[y*ww + x] = f[Math.min(wh - 1, Math.floor(v*wh))*ww + Math.min(ww - 1, Math.floor(u*ww))];
    }
    return [o];
  } },
  // numbers to wire into any ⚙ setting (Ruby: some settings could only be set by a wire — now anything can be random)
  number: { cat: 'Inputs', label: 'Number', ins: [], outs: ['value'], params: [STEP_R('value', 'Value', 50)], io: { outs: ['value'] },
    run(E, n){ return [Math.max(0, Math.min(100, E.num(n, 'value', 50)))/100]; } },
  // GROUPS (Filter Forge's groups, ROADMAP A3): a Group carries a graph of its own (one of the editor's modules), and is
  // made into its parts before the graph is walked (athanor.js athanorFlat), so nothing runs as a group. Its ports are
  // its insides': each Group Input and Knob inside is an input, each result wired to its Group Result an output.
  group: { cat: 'Combine', label: 'Group', ins: [], outs: [], params: [['name', 'Name', 'text', 'Group'],
              // A LOOP (ROADMAP A4, Filter Forge's Loop): Repeats above 1 makes the group run again and again, its first
              // result fed back into its first input each time (Accumulated); an Iteration inside counts the passes
              [...STEP_R('repeats', 'Repeats', 1, 1, 16)]], hidden: true,
    run(){ return null; } },
  loopiter: { cat: 'Inputs', label: 'Iteration', ins: [], outs: ['iteration'], params: [],
    run(){ return [0]; } },   // (inside a loop each pass's Iteration is made a Number: athanorFlat)
  groupin: { cat: 'Inputs', label: 'Group Input', ins: [], outs: ['input'], params: [['name', 'Name', 'text', 'Input'], STEP_R('def', 'Default', 50)],
    // (a group and its result are made into their parts before the walk; a Group Input left unwired gives its Default)
    run(E, n){ return [Math.max(0, Math.min(100, E.num(n, 'def', 50)))/100]; } },
  groupout: { cat: 'Output', label: 'Group Result', ins: ['result', 'result 2', 'result 3', 'result 4'], outs: [], params: [], hidden: true,
    run(){ return null; } },
  random: { cat: 'Inputs', label: 'Random Number', ins: [], outs: ['value'], params: [STEP_R('lo', 'Lowest', 0), STEP_R('hi', 'Highest', 100)], io: { outs: ['value'] },
    // the node's own random stream (from the page's seed and the node's id): the same number until the seed changes
    run(E, n){ const lo = E.num(n, 'lo', 0), hi = E.num(n, 'hi', 100); return [(lo + (hi - lo)*Math.random())/100]; } },
  // reshaping a grey map's values; masks drawn from shapes
  maprange: { cat: 'Shape', label: 'Map Range', ins: ['field'], outs: ['field'], params: [STEP_R('inLo', 'From Low', 0), STEP_R('inHi', 'From High', 100), STEP_R('outLo', 'To Low', 0), STEP_R('outHi', 'To High', 100)], cost: () => 1, req: true, maps: ['inLo', 'inHi', 'outLo', 'outHi'],
    run(E, n){ const { N, input, map, at, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const A = map(n, 'inLo', 0), B = map(n, 'inHi', 100), C = map(n, 'outLo', 0), D = map(n, 'outHi', 100), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const a = at(A, i)/100, b = at(B, i)/100, c = at(C, i)/100, d = at(D, i)/100, k = Math.abs(b - a) < 1e-6 ? 0 : 1/(b - a);
      const t = Math.max(0, Math.min(1, (f[i] - a)*k)); o[i] = c + (d - c)*t; }
    return [o]; } },
  shape: { cat: 'Noise', label: 'Shape Mask', ins: [], outs: ['mask'], params: [STEP_SEL('form', 'Shape', ['circle', 'ring', 'square', 'diamond', 'star', 'vignette']),
              STEP_R('size', 'Size', 60, 5, 150), STEP_R('soft', 'Softness', 10), STEP_R('x', 'Across', 50), STEP_R('y', 'Down', 50)], cost: () => 1.5,
    run(E, n){ const { ww, wh, unit, P, num, field } = E;
    const form = String(P(n, 'form', 'circle')), R = num(n, 'size', 60)/200, sf = Math.max(0.002, num(n, 'soft', 10)/200), cx = num(n, 'x', 50)/100*ww/unit, cy = num(n, 'y', 50)/100*wh/unit;
    const edge = d => { const t = Math.max(0, Math.min(1, (R - d + sf)/(2*sf))); return t*t*(3 - 2*t); };
    return [field((u, v, x, y) => { const px = x/unit - cx, py = y/unit - cy, r = Math.hypot(px, py);
      if(form === 'ring'){ const t = Math.abs(r - R*0.8); return Math.max(0, Math.min(1, 1 - (t - R*0.12)/(sf*2 + 1e-3))); }
      if(form === 'square') return edge(Math.max(Math.abs(px), Math.abs(py)));
      if(form === 'diamond') return edge((Math.abs(px) + Math.abs(py))*0.75);
      if(form === 'star'){ const a = Math.atan2(py, px); return edge(r/(0.65 + 0.35*Math.cos(a*5))); }
      if(form === 'vignette') return 1 - Math.max(0, Math.min(1, (r - R*0.6)/(R*0.9 + sf*4)));
      return edge(r); })]; } },
  // the COMBINE family: pictures taken apart and put together
  split: { cat: 'Combine', label: 'Split Channels', ins: ['picture'], outs: ['red', 'green', 'blue', 'brightness'], params: [], cost: () => 1, io: { ins: ['image'] }, req: true,
    run(E, n){ const { N, input, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const y = new Float32Array(N); for(let i = 0; i < N; i++) y[i] = 0.299*im.r[i] + 0.587*im.g[i] + 0.114*im.b[i];
    return [im.r, im.g, im.b, y]; } },
  merge: { cat: 'Combine', label: 'Merge Channels', ins: ['red', 'green', 'blue'], outs: ['picture'], params: [], cost: () => 1, io: { outs: ['image'] },
    run(E, n){ const { N, input, asField } = E; const r = asField(input(n, 1)), g = asField(input(n, 2)), b = asField(input(n, 3));
    if(!r && !g && !b) return null; const z = new Float32Array(N);
    return [{ r: r || z, g: g || z, b: b || z }]; } },
  switch: { cat: 'Combine', label: 'Switch', ins: ['a', 'b', 'choose'], outs: ['result'], params: [STEP_R('at', 'Switch At', 50)], io: { ins: ['image', 'image', 'value'], outs: ['image'] },
    run(E, n){ const { input, num, asField } = E;
    const c = input(n, 3), at = num(n, 'at', 50)/100;
    const v = typeof c === 'number' ? c : c == null ? 0 : (() => { const f = asField(c); let t = 0; for(let i = 0; i < f.length; i++) t += f[i]; return f.length ? t/f.length : 0; })();
    const pick = v >= at ? input(n, 2) : input(n, 1);
    return pick == null ? null : [pick]; } },
  // FILTER FORGE'S SMUDGE (ROADMAP F7): the picture smeared one way, as a finger drags paint — each point takes what lies
  // behind it along the stroke, the nearest most; and MULTIBLEND: four layers laid over a base at once, one mode
  smudge: { cat: 'Shape', label: 'Smudge', ins: ['picture', 'which way'], outs: ['picture'], params: [STEP_R('angle', 'Direction', 0, 0, 360), STEP_R('length', 'Length', 25), STEP_R('strength', 'Strength', 70), STEP_R('trail', 'Trail', 50)], cost: () => 6, io: { ins: ['image', 'field'], outs: ['image'] }, req: true, maps: ['length', 'strength'],
    run(E, n){ const { ww, wh, N, unit, input, map, at, num, asImage, asField } = E; const img = asImage(input(n, 1)); if(!img) return null;
    const way = asField(input(n, 2)), LM = map(n, 'length', 25), SM = map(n, 'strength', 70), a0 = num(n, 'angle', 0)*Math.PI/180;
    const tr = Math.max(0, Math.min(1, num(n, 'trail', 50)/100)), K = 16, pw = 0.4 + (1 - tr)*3;
    const W = Array.from({ length: K }, (_, k) => Math.pow(1 - k/K, pw)), Wt = W.reduce((s, v) => s + v, 0);
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, L = at(LM, q)/100*unit*0.25, st = Math.max(0, Math.min(1, at(SM, q)/100));
      if(L < 0.5 || st === 0){ o.r[q] = img.r[q]; o.g[q] = img.g[q]; o.b[q] = img.b[q]; continue; }
      const an = way ? way[q]*Math.PI*2 : a0, dx = -Math.cos(an)*L/K, dy = -Math.sin(an)*L/K;
      let r = 0, g = 0, b = 0;
      for(let k = 0; k < K; k++){ const sx = Math.min(ww - 1, Math.max(0, Math.round(x + dx*k))), sy = Math.min(wh - 1, Math.max(0, Math.round(y + dy*k))), p = sy*ww + sx, w = W[k];
        r += img.r[p]*w; g += img.g[p]*w; b += img.b[p]*w; }
      o.r[q] = img.r[q] + (r/Wt - img.r[q])*st; o.g[q] = img.g[q] + (g/Wt - img.g[q])*st; o.b[q] = img.b[q] + (b/Wt - img.b[q])*st; }
    return [o];
  } },
  multiblend: { cat: 'Combine', label: 'Multiblend', ins: ['base', 'layer 1', 'layer 2', 'layer 3', 'layer 4'], outs: ['picture'],
              params: [STEP_SEL('mode', 'Mode', STEP_BLENDS), STEP_R('op1', 'Layer 1', 100), STEP_R('op2', 'Layer 2', 100), STEP_R('op3', 'Layer 3', 100), STEP_R('op4', 'Layer 4', 100)], cost: () => 2, io: { ins: ['image', 'image', 'image', 'image', 'image'], outs: ['image'] }, maps: ['op1', 'op2', 'op3', 'op4'],
    run(E, n){ const { N, input, P, asImage } = E;
    let o = asImage(input(n, 1) ?? 0.5); const fn = STEP_BLEND_FN[P(n, 'mode', 'normal')] || STEP_BLEND_FN.normal, cl = v => Math.max(0, Math.min(1, v));
    for(let j = 2; j <= 5; j++){ const lay = input(n, j); if(lay == null) continue;
      const col = Array.isArray(lay) ? lay : null, L = col ? null : asImage(lay), OP = E.map(n, 'op' + (j - 1), 100);
      const nx = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const k = E.at(OP, i)/100, r0 = o.r[i], g0 = o.g[i], b0 = o.b[i];
        nx.r[i] = r0 + (cl(fn(r0, col ? col[0] : L.r[i])) - r0)*k; nx.g[i] = g0 + (cl(fn(g0, col ? col[1] : L.g[i])) - g0)*k; nx.b[i] = b0 + (cl(fn(b0, col ? col[2] : L.b[i])) - b0)*k; }
      o = nx; }
    return [o];
  } },
  hsv: { cat: 'Light & Color', label: 'Hue & Saturation', ins: ['picture'], outs: ['picture'], params: [STEP_R('hue', 'Hue Turn', 0, 0, 360), STEP_R('sat', 'Saturation', 100, 0, 200), STEP_R('val', 'Brightness', 100, 0, 200)], cost: () => 2, io: { ins: ['image'], outs: ['image'] }, req: true, maps: ['hue', 'sat', 'val'],
    run(E, n){ const { N, input, map, at, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const TU = map(n, 'hue', 0), SA = map(n, 'sat', 100), VA = map(n, 'val', 100);
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const turn = at(TU, i)/360, sat = at(SA, i)/100, val = at(VA, i)/100;
      const r = im.r[i], g = im.g[i], b = im.b[i], mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
      let h = 0; if(dl > 1e-6) h = mx === r ? ((g - b)/dl + 6) % 6 : mx === g ? (b - r)/dl + 2 : (r - g)/dl + 4; h = h/6 + turn; h -= Math.floor(h);
      const s = mx > 1e-6 ? Math.min(1, dl/mx*sat) : 0, v = Math.min(1, mx*val), k = n2 => { const t = (n2 + h*6) % 6; return v - v*s*Math.max(0, Math.min(t, 4 - t, 1)); };
      o.r[i] = k(5); o.g[i] = k(3); o.b[i] = k(1);
    }
    return [o]; } },
  // CURVES (Filter Forge's third kind of part): a shape from 0 to 1 that other parts read through — a tone curve,
  // a gradient's profile, a bevel. Made by Curve, changed by Curve Ops, used by Tone Curve and Profile Gradient.
  curve: { cat: 'Curves', label: 'Curve', ins: [], outs: ['curve'], params: [STEP_SEL('shape', 'Shape', ['linear', 'bias', 'gain', 'gamma', 'gaussian', 'impulse', 'stairs', 'step', 'wave', 'arc', 'noise', 'arc slow', 'half circle', 'quarter circles']),
              STEP_R('amount', 'Bend', 50), STEP_R('count', 'Count', 4, 1, 24), STEP_R('low', 'Lowest', 0), STEP_R('high', 'Highest', 100), STEP_R('variation', 'Variation', 0, 0, 99)], cost: () => 0.1, io: { outs: ['curve'] },
    run(E, n){ const { num, P } = E;
    const shape = P(n, 'shape', 'linear'), a = num(n, 'amount', 50)/100, k = Math.max(1, Math.round(num(n, 'count', 4))), lo = num(n, 'low', 0)/100, hi = num(n, 'high', 100)/100;
    // the noise curve's knots come from the node's own random stream (seed + id), the same until the seed changes
    const knots = shape === 'noise' ? Array.from({ length: k + 2 }, () => Math.random()) : null;
    const f = {
      linear: t => t, bias: t => stepBias(t, a), gain: t => stepGain(t, a), gamma: t => Math.pow(t, Math.pow(2, (0.5 - a)*4)),
      gaussian: t => Math.exp(-((t - 0.5)**2)/(2*(0.02 + a*0.3)**2)),
      impulse: t => { const c = Math.max(0.001, Math.min(0.999, a)); return t < c ? t/c : (1 - t)/(1 - c); },
      stairs: t => Math.min(k, Math.floor(t*(k + 1)))/k, step: t => t >= a ? 1 : 0,
      wave: t => 0.5 - 0.5*Math.cos(t*k*Math.PI*2), arc: t => Math.sqrt(Math.max(0, 1 - (1 - t)**2)),
      // (Filter Forge's Circular Arc, its other ways: rising slowly, a half circle, and a row of quarter circles)
      'arc slow': t => 1 - Math.sqrt(Math.max(0, 1 - t*t)), 'half circle': t => Math.sqrt(Math.max(0, 1 - (2*t - 1)**2)),
      'quarter circles': t => { const x = t*k, u = x - Math.min(k - 1, Math.floor(x)); return Math.sqrt(Math.max(0, 1 - (1 - u)**2)); },
      noise: t => { const x = t*(k + 1), i = Math.min(k, Math.floor(x)), u = x - i, w = u*u*(3 - 2*u); return knots[i] + (knots[i + 1] - knots[i])*w; },
    }[shape] || (t => t);
    return [stepCurve(t => lo + (hi - lo)*f(t))];
  } },
  curveops: { cat: 'Curves', label: 'Curve Ops', ins: ['curve', 'curve b'], outs: ['curve'], params: [STEP_SEL('op', 'Operation', ['frequency', 'phase', 'repeat', 'reverse', 'invert', 'amplitude', 'blend', 'multiply', 'max', 'min', 'transition', 'fade']),
              STEP_R('amount', 'Amount', 50), STEP_R('count', 'Times', 2, 1, 16)], cost: () => 0.1, io: { ins: ['curve', 'curve'], outs: ['curve'] }, req: true,
    run(E, n){ const { input, num, P, isCurve } = E;
    const c = input(n, 1), b = input(n, 2); if(!isCurve(c)) return null;
    const op = P(n, 'op', 'frequency'), a = num(n, 'amount', 50)/100, k = Math.max(1, Math.round(num(n, 'count', 2))), cb = isCurve(b) ? b : null;
    const frac = x => (x >= 1 && x === Math.floor(x)) ? 1 : x - Math.floor(x);   // (the last point stays the curve's end)
    const g = { frequency: t => curveAt(c, frac(t*k)), phase: t => curveAt(c, (t + a) % 1),
      repeat: t => { const x = t*k, i = Math.floor(x), u = x - i; return curveAt(c, i % 2 ? 1 - u : u); },
      reverse: t => curveAt(c, 1 - t), invert: t => 1 - curveAt(c, t), amplitude: t => 0.5 + (curveAt(c, t) - 0.5)*a*2,
      blend: t => cb ? curveAt(c, t) + (curveAt(cb, t) - curveAt(c, t))*a : curveAt(c, t), multiply: t => curveAt(c, t)*(cb ? curveAt(cb, t) : 1),
      max: t => Math.max(curveAt(c, t), cb ? curveAt(cb, t) : -Infinity), min: t => Math.min(curveAt(c, t), cb ? curveAt(cb, t) : Infinity),
      // (Filter Forge's Transition: the first curve on the left, the second on the right, crossing over a width set by
      // Amount; and Fade: the curve eased to nothing at both ends, over Amount of its length)
      transition: t => { const w = Math.max(0.02, a), u = Math.max(0, Math.min(1, (t - (0.5 - w/2))/w)), s = u*u*(3 - 2*u);
        return cb ? curveAt(c, t) + (curveAt(cb, t) - curveAt(c, t))*s : curveAt(c, t)*(1 - s); },
      fade: t => { const w = Math.max(0.01, a*0.5), e = Math.min(1, t/w, (1 - t)/w), s = e*e*(3 - 2*e); return curveAt(c, t)*s; } }[op] || (t => curveAt(c, t));
    return [stepCurve(g)];
  } },
  tonecurve: { cat: 'Curves', label: 'Tone Curve', ins: ['picture', 'curve'], outs: ['picture'], params: [STEP_R('mix', 'Strength', 100)], cost: () => 1, io: { ins: ['image', 'curve'], outs: ['image'] }, req: true, maps: ['mix'],
    run(E, n){ const { N, input, map, at, isCurve, isImg, asField } = E;
    const v = input(n, 1), c = input(n, 2); if(v == null) return null; if(!isCurve(c)) return [v];
    const MX = map(n, 'mix', 100), tone = (x, i) => { const m = at(MX, i)/100; return x + (curveAt(c, x) - x)*m; };
    if(isImg(v)){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ o.r[i] = tone(v.r[i], i); o.g[i] = tone(v.g[i], i); o.b[i] = tone(v.b[i], i); } return [o]; }
    const f = asField(v), o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = tone(f[i], i); return [o];
  } },
  profile: { cat: 'Curves', label: 'Profile Gradient', ins: ['curve', 'along'], outs: ['field'], params: [STEP_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular', 'along a map']), STEP_R('angle', 'Angle', 90, 0, 360), STEP_R('repeat', 'Repeat', 1, 1, 12)], cost: () => 1, io: { ins: ['curve', 'field'] },
    run(E, n){ const { ww, wh, N, input, num, P, isCurve, asField } = E;
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
  } },
  // FILTER FORGE'S PRIMITIVES that were missing (Adjustments, Processing, Transform, Noise, Patterns)
  bricon: { cat: 'Light & Color', label: 'Brightness & Contrast', ins: ['picture'], outs: ['picture'], params: [STEP_R('bright', 'Brightness', 0, -100, 100), STEP_R('contrast', 'Contrast', 0, -100, 100)], cost: () => 1, io: { ins: ['image'], outs: ['image'] }, req: true, maps: ['bright', 'contrast'],
    run(E, n){ const { N, input, map, at, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const BR = map(n, 'bright', 0), CO = map(n, 'contrast', 0), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const b = at(BR, i)/100, c = at(CO, i)/100, k = c >= 0 ? 1/Math.max(0.01, 1 - c) : 1 + c;
      for(const ch of ['r', 'g', 'b']) o[ch][i] = Math.max(0, Math.min(1, (im[ch][i] - 0.5)*k + 0.5 + b)); }
    return [o];
  } },
  highpass: { cat: 'Shape', label: 'High Pass', ins: ['field'], outs: ['field'], params: [STEP_R('radius', 'Radius', 10, 1, 100), STEP_R('gain', 'Gain', 50)], cost: () => 1.5, req: true, maps: ['gain'],
    run(E, n){ const { N, unit, input, num, map, at, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null;
    const lo = boxBlur(f, num(n, 'radius', 10)*unit/1536*1.2), G = map(n, 'gain', 50), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, 0.5 + (f[i] - lo[i])*(1 + at(G, i)/10)));
    return [o];
  } },
  sharpen: { cat: 'Shape', label: 'Sharpen', ins: ['field'], outs: ['field'], params: [STEP_R('amount', 'Amount', 50, 0, 200), STEP_R('radius', 'Radius', 4, 1, 50)], cost: () => 1.5, req: true, maps: ['amount'],
    run(E, n){ const { N, unit, input, num, map, at, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null;
    const lo = boxBlur(f, num(n, 'radius', 4)*unit/1536*1.2), A = map(n, 'amount', 50), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f[i] + (f[i] - lo[i])*at(A, i)/50));
    return [o];
  } },
  motionblur: { cat: 'Shape', label: 'Motion Blur', ins: ['field'], outs: ['field'], params: [STEP_R('length', 'Length', 20, 0, 100), STEP_R('angle', 'Angle', 0, 0, 360)], cost: () => 3, req: true, maps: ['length:4', 'angle:4'],
    run(E, n){ const { ww, wh, N, unit, input, map, at, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const LM = map(n, 'length', 20), AM = map(n, 'angle', 0);
    if(typeof LM !== 'number' || typeof AM !== 'number'){
      // LENGTH AND ANGLE BY POINT (a map on a ⚙): each point smeared along its own stroke
      const o = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, L = at(LM, q)/100*unit*0.15, an = at(AM, q)*Math.PI/180;
        if(L < 0.5){ o[q] = f[q]; continue; }
        const S = Math.max(2, Math.min(48, Math.round(L))), dx = Math.cos(an)*L, dy = Math.sin(an)*L; let t = 0;
        for(let k = 0; k < S; k++){ const s = k/(S - 1) - 0.5, sx = Math.min(ww - 1, Math.max(0, Math.round(x + dx*s))), sy = Math.min(wh - 1, Math.max(0, Math.round(y + dy*s))); t += f[sy*ww + sx]; }
        o[q] = t/S; }
      return [o];
    }
    const L = LM/100*unit*0.15, an = AM*Math.PI/180; if(L < 0.5) return [f];
    const S = Math.max(2, Math.min(48, Math.round(L))), dx = Math.cos(an)*L, dy = Math.sin(an)*L, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ let t = 0;
      for(let k = 0; k < S; k++){ const s = k/(S - 1) - 0.5, sx = Math.min(ww - 1, Math.max(0, Math.round(x + dx*s))), sy = Math.min(wh - 1, Math.max(0, Math.round(y + dy*s))); t += f[sy*ww + sx]; }
      o[y*ww + x] = t/S; }
    return [o];
  } },
  offset: { cat: 'Shape', label: 'Offset', ins: ['field'], outs: ['field'], params: [STEP_R('x', 'Across', 0, -100, 100), STEP_R('y', 'Down', 0, -100, 100)], cost: () => 0.5, req: true,
    run(E, n){ const { ww, wh, N, input, num, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const ox = Math.round(num(n, 'x', 0)/100*ww), oy = Math.round(num(n, 'y', 0)/100*wh), o = new Float32Array(N);
    // wrapped, as Filter Forge's Offset: what leaves one side comes back on the other
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) o[y*ww + x] = f[(((y - oy) % wh) + wh) % wh*ww + (((x - ox) % ww) + ww) % ww];
    return [o];
  } },
  perlin: { cat: 'Noise', label: 'Perlin Noise', ins: ['seed'], outs: ['field'], params: [STEP_R('scale', 'Scale', 40, 1, 200), STEP_R('details', 'Octaves', 4, 1, 8), STEP_R('rough', 'Roughness', 50), STEP_R('contrast', 'Contrast', 30), STEP_R('variation', 'Variation', 0, 0, 99)], cost: () => 2.5, io: { ins: ['value'] }, maps: ['scale:4', 'rough', 'contrast'],
    run(E, n){ const { unit, input, num, map, at, field } = E;
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
    const SC = map(n, 'scale', 40);
    const cells = Math.max(1, typeof SC === 'number' ? SC : 40)/10, det = Math.max(1, Math.min(8, Math.round(num(n, 'details', 4)))), R = map(n, 'rough', 50), C = map(n, 'contrast', 30);
    if(typeof SC === 'number'){
      let q = -1;
      return [field((u, v, x, y) => { q++; const rough = 0.25 + at(R, q)/100*0.6; let t = 0, a = 1, norm = 0, fr = 1;
        for(let o = 0; o < det; o++){ t += noise(x/unit*cells*fr + off + o*17.3, y/unit*cells*fr + off*1.7 + o*31.1)*a; norm += a; a *= rough; fr *= 2; }
        const k = 1 + at(C, q)/100*3; return Math.max(0, Math.min(1, 0.5 + t/norm*k)); })];
    }
    // SCALE BY POINT (a map on its ⚙): the same noise at scales an octave apart, each point read between the two nearest
    const layer = cells => (x, y, q) => { const rough = 0.25 + at(R, q)/100*0.6; let t = 0, a = 1, norm = 0, fr = 1;
      for(let o = 0; o < det; o++){ t += noise(x/unit*cells*fr + off + o*17.3, y/unit*cells*fr + off*1.7 + o*31.1)*a; norm += a; a *= rough; fr *= 2; }
      return 0.5 + t/norm*(1 + at(C, q)/100*3); };
    const o = stepScaleByPoint(E, SC, layer); for(let i = 0; i < o.length; i++) o[i] = Math.max(0, Math.min(1, o[i]));
    return [o];
  } },
  bricks: { cat: 'Noise', label: 'Bricks', ins: ['bevel'], outs: ['bricks', 'mortar', 'each brick'], params: [STEP_R('rows', 'Rows', 12, 2, 60), STEP_R('ratio', 'Length', 200, 100, 400),
              STEP_R('mortar', 'Mortar', 12, 0, 40), STEP_R('stagger', 'Stagger', 50), STEP_R('bevel', 'Bevel', 30), STEP_R('vary', 'Variety', 30)], cost: () => 1, io: { ins: ['curve'] },
    run(E, n){ const { ww, wh, N, unit, input, num, isCurve } = E;
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
  } },
  // THE POEM ITSELF as an input (the doc of future directions: "readability as part of the shader"): where its words,
  // lines and stanzas sit on the page, measured by the page as it sets the text (canvasRenderer's text layout)
  poem: { cat: 'Inputs', label: 'The Poem', ins: [], outs: ['words', 'distance', 'lines', 'stanzas', 'rhymes', 'aware', 'in the letters', 'round the words', 'punctuation'],
              params: [STEP_R('padding', 'Padding', 40, 0, 200), STEP_R('softness', 'Softness', 40), STEP_R('reach', 'Reach', 35, 5, 100),
                STEP_SEL('rhyme', 'Rhymes', ['every rhyme', 'A', 'B', 'C', 'D', 'E', 'F']),
                // (G2: where the punctuation sits, each mark a soft glow; which marks, and how far each glows, in line heights)
                STEP_SEL('marks', 'Punctuation', Object.keys(POEM_MARK_SETS)), STEP_R('glow', 'Punctuation Glow', 100, 10, 400)], cost: () => 2, io: { outs: ['field', 'field', 'field', 'field', 'field', 'value', 'value', 'value', 'field'] },
    run(E, n){ const { ctx, ww, wh, N, num, P, boxBlur } = E;
    // (two globals: whether this surface is Text Aware, and whether it fills the letters themselves — Blend with Text,
    //  Shape Aware — so a graph can answer either; a surface that is not aware is handed no words at all)
    // (and a third: Shape Aware on a surface drawn on the page, asking it to shape itself round the words)
    // (each how strongly: Shape Strength, 0..1)
    const aware = ctx.aware === false ? 0 : 1, inside = Math.min(1, +ctx.fill || 0), around = Math.min(1, +ctx.around || 0);
    const runs = poemRuns(ctx.text);
    if(!runs.length) return [new Float32Array(N), new Float32Array(N).fill(1), new Float32Array(N), new Float32Array(N), new Float32Array(N), aware, inside, around, new Float32Array(N)];
    // RHYMES (Ruby's doc, a rhyme group's mask): the words of the lines that rhyme (~A, ~B…: the run's 7th number, A = 1)
    const want = P(n, 'rhyme', 'every rhyme'), wantN = want === 'every rhyme' ? -1 : want.charCodeAt(0) - 64, rhymeHard = new Float32Array(N);
    const pad = num(n, 'padding', 40)/100, soft = num(n, 'softness', 40)/100, reach = Math.max(0.05, num(n, 'reach', 35)/100);
    const heights = runs.map(r => (r[3] - r[1])*wh).sort((a, b) => a - b), lh = Math.max(1, heights[heights.length >> 1]);
    // SHAPE STRENGTH (Ruby: it should move "the threshold" of a graph built on The Poem): under Shape Aware on the page, how
    // far the surface keeps clear of the words. The Words (and Rhymes) masks spread by the Padding times it, fading out
    // over its last tenth; the Distance is measured from that margin and reads farther near the words by the same measure
    // (a margin read off it shrinks by it). Shape Aware off: the graph's own margin, as it always was.
    const keep = around > 0 ? around : 1, keepFade = Math.min(1, keep*10);
    const lines = new Float32Array(N), stanzas = new Float32Array(N), hard = new Float32Array(N), hardK = keep < 1 ? new Float32Array(N) : hard;
    const nLines = Math.max(...runs.map(r => r[4])) + 1, nSt = Math.max(...runs.map(r => r[5])) + 1;
    for(const r of runs){
      const h = (r[3] - r[1])*wh, p = h*pad;
      const x0 = Math.max(0, Math.floor(r[0]*ww - p)), x1 = Math.min(ww, Math.ceil(r[2]*ww + p)), y0 = Math.max(0, Math.floor(r[1]*wh - p)), y1 = Math.min(wh, Math.ceil(r[3]*wh + p));
      const rh = r[6] || 0, isRhyme = rh > 0 && (wantN < 0 || rh === wantN);
      for(let y = y0; y < y1; y++) for(let x = x0; x < x1; x++) hard[y*ww + x] = 1;
      const pk = p*keep, kx0 = Math.max(0, Math.floor(r[0]*ww - pk)), kx1 = Math.min(ww, Math.ceil(r[2]*ww + pk)), ky0 = Math.max(0, Math.floor(r[1]*wh - pk)), ky1 = Math.min(wh, Math.ceil(r[3]*wh + pk));
      for(let y = ky0; y < ky1; y++) for(let x = kx0; x < kx1; x++){ hardK[y*ww + x] = 1; if(isRhyme) rhymeHard[y*ww + x] = 1; }
      // a line is a band across the whole page at the line's own height, its gray rising line by line
      const ly0 = Math.max(0, Math.floor(r[1]*wh)), ly1 = Math.min(wh, Math.ceil(r[3]*wh)), lv = (r[4] + 1)/nLines;
      for(let y = ly0; y < ly1; y++) for(let x = 0; x < ww; x++) lines[y*ww + x] = Math.max(lines[y*ww + x], lv);
    }
    // a stanza owns the page from halfway after the stanza above it to halfway before the one below
    const span = []; for(const r of runs){ const s = span[r[5]] || (span[r[5]] = [Infinity, -Infinity]); s[0] = Math.min(s[0], r[1]); s[1] = Math.max(s[1], r[3]); }
    const cuts = []; for(let i = 0; i + 1 < span.length; i++) if(span[i] && span[i + 1]) cuts.push((span[i][1] + span[i + 1][0])/2*wh);
    for(let y = 0; y < wh; y++){ let k = 0; while(k < cuts.length && y >= cuts[k]) k++; const sv = (k + 1)/nSt; for(let x = 0; x < ww; x++) stanzas[y*ww + x] = sv; }
    // (the Distance from the margin as Shape Strength spreads it; its first quarter, where a graph takes its margin, drawn in
    //  by the strength, and the rest moved in by what that saves, so rings and fades farther out keep their spacing)
    const dist = stepDistance(hardK, ww, wh), far = reach*Math.max(ww, wh), T0 = 0.25, kk = Math.max(keep, 1e-6);
    for(let i = 0; i < N; i++){ const d = Math.min(1, dist[i]/far); dist[i] = keep >= 1 ? d : d < kk*T0 ? d/kk : Math.min(1, d + T0*(1 - keep)); }
    const words = soft > 0 ? boxBlur(hardK, lh*soft*0.8) : hardK;
    if(keepFade < 1){ for(let i = 0; i < N; i++){ words[i] *= keepFade; rhymeHard[i] *= keepFade; } }
    // PUNCTUATION (G2): each mark a soft round glow, 1 at the mark, gone a Glow's line heights away (the brightest wins)
    const pick = POEM_MARK_SETS[P(n, 'marks', 'every mark')], R = Math.max(1, num(n, 'glow', 100)/100*lh*0.75), punct = new Float32Array(N);
    for(const [mx, my, m] of poemMarks(ctx.text)){ if(pick && !pick.includes(m)) continue;
      const cx = mx*ww, cy = my*wh, x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(ww, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(wh, Math.ceil(cy + R));
      for(let y = y0; y < y1; y++) for(let x = x0; x < x1; x++){ const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)/R; if(d < 1){ const v = (1 - d)*(1 - d)*(1 + 2*d), q = y*ww + x; if(v > punct[q]) punct[q] = v; } } }
    return [words, dist, soft > 0 ? boxBlur(lines, lh*soft*0.25) : lines, stanzas, soft > 0 ? boxBlur(rhymeHard, lh*soft*0.8) : rhymeHard, aware, inside, around, punct];
  } },
  // more ways to reshape a gray map (Filter Forge's and Blender's staples)
  grow: { cat: 'Shape', label: 'Grow & Shrink', ins: ['field'], outs: ['field'], params: [STEP_R('amount', 'Amount', 60, 0, 100), STEP_R('radius', 'Radius', 12, 1, 100)], cost: () => 2, req: true, maps: ['amount:4'],
    run(E, n){ const { ww, wh, N, unit, input, num, map, at, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const AM = map(n, 'amount', 60), rad = Math.max(1, Math.round(num(n, 'radius', 12)*unit/1536*1.2));
    // a max (or min) filter, separable, by the radius; mixed with the original by how far Amount is from 50
    const filter = up => { const pass = (src, dst, horiz) => { const L = horiz ? ww : wh, M = horiz ? wh : ww;
        for(let j = 0; j < M; j++) for(let i = 0; i < L; i++){ let m = up ? -Infinity : Infinity;
          for(let k = Math.max(0, i - rad), e = Math.min(L - 1, i + rad); k <= e; k++){ const v = src[horiz ? j*ww + k : k*ww + j]; m = up ? (v > m ? v : m) : (v < m ? v : m); }
          dst[horiz ? j*ww + i : i*ww + j] = m; } };
      const tmp = new Float32Array(N), o = new Float32Array(N); pass(f, tmp, true); pass(tmp, o, false); return o; };
    if(typeof AM !== 'number'){
      // AMOUNT BY POINT (a map on its ⚙): grown where the map is past 50, shrunk where it is below
      let g = null, s = null; for(let i = 0; i < N; i++){ if(AM[i] > 50 && !g) g = filter(true); if(AM[i] < 50 && !s) s = filter(false); }
      const o = new Float32Array(N); for(let i = 0; i < N; i++){ const a = at(AM, i), t = Math.abs(a - 50)/50, F = a >= 50 ? g : s; o[i] = F ? f[i] + (F[i] - f[i])*t : f[i]; }
      return [o];
    }
    const a = AM, up = a >= 50, t = Math.abs(a - 50)/50;
    if(t === 0) return [f];
    const o = filter(up);
    for(let i = 0; i < N; i++) o[i] = f[i] + (o[i] - f[i])*t;
    return [o];
  } },
  pixelate: { cat: 'Shape', label: 'Pixelate', ins: ['field'], outs: ['field'], params: [STEP_R('size', 'Cell Size', 20, 2, 200), STEP_SEL('cell', 'Cells', ['squares', 'bricks', 'diamonds']), STEP_SEL('take', 'Each Cell Takes', ['the average', 'the brightest'])], cost: () => 1.5, req: true,
    run(E, n){ const { ww, wh, N, unit, input, num, P, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const c = Math.max(1, num(n, 'size', 20)*unit/1536*1.2), kind = P(n, 'cell', 'squares'), most = P(n, 'take', 'the average') === 'the brightest';
    // (EACH CELL TAKES THE BRIGHTEST: a star smaller than a cell still lights it, as a pixel artist's one-pixel star)
    const cellOf = kind === 'diamonds' ? (x, y) => { const u = Math.floor((x + y)/c), v = Math.floor((x - y)/c); return (u + 65536)*131072 + v + 65536; }
      : (x, y) => { const row = Math.floor(y/c), sx = kind === 'bricks' && row % 2 ? x + c/2 : x; return (row + 1)*131072 + Math.floor(sx/c) + 1; };
    const sum = new Map(), id = new Float64Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, k = cellOf(x, y); id[q] = k; const s = sum.get(k);
      if(!s) sum.set(k, [f[q], 1]); else if(most){ if(f[q] > s[0]) s[0] = f[q]; } else { s[0] += f[q]; s[1]++; } }
    const o = new Float32Array(N); for(let q = 0; q < N; q++){ const s = sum.get(id[q]); o[q] = most ? s[0] : s[0]/s[1]; }
    return [o];
  } },
  twirl: { cat: 'Shape', label: 'Twirl', ins: ['field'], outs: ['field'], params: [STEP_R('angle', 'Twist', 180, -720, 720), STEP_R('radius', 'Radius', 70, 5, 150), STEP_R('x', 'Across', 50), STEP_R('y', 'Down', 50)], cost: () => 1.5, req: true, maps: ['angle:4'],
    run(E, n){ const { ww, wh, N, input, num, map, at, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    // (TWIST BY POINT: a map on its ⚙ turns each point by its own angle)
    const TW = map(n, 'angle', 180), turn = typeof TW === 'number' ? TW*Math.PI/180 : 0, R = Math.max(1, num(n, 'radius', 70)/100*Math.min(ww, wh)/2), cx = num(n, 'x', 50)/100*ww, cy = num(n, 'y', 50)/100*wh, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), q = y*ww + x;
      if(r >= R){ o[q] = f[q]; continue; }
      const t = 1 - r/R, a = Math.atan2(dy, dx) + (typeof TW === 'number' ? turn : at(TW, q)*Math.PI/180)*t*t;
      const sx = Math.min(ww - 1, Math.max(0, Math.round(cx + Math.cos(a)*r))), sy = Math.min(wh - 1, Math.max(0, Math.round(cy + Math.sin(a)*r)));
      o[q] = f[sy*ww + sx]; }
    return [o];
  } },
  mirror: { cat: 'Shape', label: 'Mirror', ins: ['field'], outs: ['field'], params: [STEP_SEL('axis', 'Mirror', ['left to right', 'top to bottom', 'both', 'diagonal']), STEP_R('at', 'Fold At', 50)], cost: () => 1, req: true,
    run(E, n){ const { ww, wh, N, input, num, P, asField } = E; const f = asField(input(n, 1)); if(!f) return null;
    const axis = P(n, 'axis', 'left to right'), at = num(n, 'at', 50)/100, fx = at*ww, fy = at*wh, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      let sx = x, sy = y;
      if((axis === 'left to right' || axis === 'both') && x > fx) sx = Math.round(2*fx - x);
      if((axis === 'top to bottom' || axis === 'both') && y > fy) sy = Math.round(2*fy - y);
      if(axis === 'diagonal' && x/ww > y/wh){ sx = Math.round(y/wh*ww); sy = Math.round(x/ww*wh); }
      o[y*ww + x] = f[Math.min(wh - 1, Math.max(0, sy))*ww + Math.min(ww - 1, Math.max(0, sx))]; }
    return [o];
  } },
  chroma: { cat: 'Light & Color', label: 'Chromatic Offset', ins: ['picture'], outs: ['picture'], params: [STEP_R('amount', 'Offset', 20), STEP_R('angle', 'Angle', 0, 0, 360), STEP_R('edge', 'Toward the Edges', 0)], cost: () => 1.5, io: { ins: ['image'], outs: ['image'] }, req: true, maps: ['amount'],
    run(E, n){ const { ww, wh, N, unit, input, num, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const AM = E.map(n, 'amount', 20), ang = num(n, 'angle', 0)*Math.PI/180, edge = num(n, 'edge', 0)/100;
    const o = { r: new Float32Array(N), g: im.g.slice ? im.g.slice() : Float32Array.from(im.g), b: new Float32Array(N) };
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const q = y*ww + x, A = E.at(AM, q)/100*unit*0.02, k = edge > 0 ? (1 - edge) + edge*Math.min(1, Math.hypot(x/ww - 0.5, y/wh - 0.5)/0.7071) : 1;
      const dx = Math.cos(ang)*A*k, dy = Math.sin(ang)*A*k;
      const at = (ox, oy) => Math.min(wh - 1, Math.max(0, Math.round(y + oy)))*ww + Math.min(ww - 1, Math.max(0, Math.round(x + ox)));
      o.r[q] = im.r[at(dx, dy)]; o.b[q] = im.b[at(-dx, -dy)]; }
    return [o];
  } },
};


/**
 * What travels on each port: field (a grey map), image (colour), colour (one
 * colour), value (one number). The editor colours ports and wires by these;
 * the evaluator converts between them wherever a port asks (athanor.js).
 */
export const VALUE_TYPES = ['field', 'image', 'colour', 'value', 'curve'];
// FILTER FORGE'S LESSON: every slider can take a wire. A step's range params
// each get an input port after its own (⚙ Name); a value wired there sets the
// param across its range (0 → its min, 1 → its max), so a Knob or the Dial
// can drive any of them — and a template shows its wiring instead of hiding it.
const PARAM_PORTS_OFF = new Set(['Inputs', 'Output']);

const stepMapKeys = list => (list || []).map(m => String(m).split(':')[0]);
const stepMapsSince = list => Object.fromEntries((list || []).filter(m => String(m).includes(':')).map(m => String(m).split(':')).map(([k, v]) => [k, +v]));
/** Every step: the part, its cost and what it does. */
const STEPS_RAW = { ...Object.fromEntries(Object.entries(STEP_PARTS).map(([k, part]) => [k, { ...part, cost: part.cost || (() => 1) }])),
  // the surfaces' own steps (each file a family; their parts carry their own cost and run)
  ...TOUCH_STEPS, ...CHAOS_STEPS, ...CARD_STEPS, ...WHIMSY_STEPS, ...LIGHT_STEPS, ...SHARP_STEPS, ...GEN_STEPS, ...RING_STEPS, ...ROOM_STEPS, ...FLORA_STEPS, ...NETWORK_STEPS, ...STREAMER_STEPS, ...LENS_STEPS, ...IMPRINT_STEPS, ...SPECIMEN_STEPS, ...GRASS_STEPS, ...PATTERN_STEPS };
export const STEPS = Object.fromEntries(Object.entries(STEPS_RAW).map(([k, s]) => {
  const io = s.io || {};
  const paramPorts = PARAM_PORTS_OFF.has(s.cat) ? [] : s.params.filter(p => p[2] === 'range').map(p => p[0]);
  return [k, { ...s, required: s.req ? [1] : [],
    maps: stepMapKeys(s.maps), mapsSince: stepMapsSince(s.maps),
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
