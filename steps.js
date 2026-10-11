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
 * (weave, cloth — Linen), stepsChaos.js (crazing, brushwork, glaze — Fractured
 * Glaze).
 *
 * MARKS steps (streaks, hatching) draw strokes on a canvas the size of the
 * working grid and read it back as a field — the generators' own way of
 * drawing, kept inside a step. Their sizes are in canonical pixels (E.px).
 */
import { makeNoiseGrid, sampleNoiseGrid, canonDiv, smoothField } from './texCore.js';
import { drawStitch, pathFromPoints, roundRectPoints } from './stitches.js';
import { TOUCH_STEPS } from './stepsTouch.js';
import { CHAOS_STEPS } from './stepsChaos.js';

const STEP_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const STEP_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
export const STEP_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'darken', 'lighten', 'color-dodge', 'color-burn',
  'difference', 'exclusion', 'vivid-light', 'linear-light', 'pin-light', 'linear-burn', 'subtract', 'divide'];
export const STEP_CATEGORIES = ['Inputs', 'Noise', 'Marks', 'Textures', 'Shape', 'Light & Colour', 'Output'];

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
  dial:     { cat: 'Inputs', label: 'Light Dial', ins: [], outs: ['direction', 'height'], params: [] },
  seed:     { cat: 'Inputs', label: 'Seed', ins: [], outs: ['seed'], params: [] },
  page:     { cat: 'Inputs', label: 'Page Coordinates', ins: [], outs: ['x', 'y', 'radius'], params: [] },
  // makers
  noise:    { cat: 'Noise', label: 'Value Noise', ins: ['seed'], outs: ['field'], params: [STEP_R('scale', 'Scale', 40, 1, 200), STEP_R('octaves', 'Octaves', 3, 1, 6)] },
  cells:    { cat: 'Noise', label: 'Cells', ins: ['seed'], outs: ['distance', 'edges', 'id'], params: [STEP_R('scale', 'Scale', 30, 2, 200), STEP_R('jitter', 'Jitter', 80)] },
  waves:    { cat: 'Noise', label: 'Waves', ins: ['warp'], outs: ['field'], params: [STEP_R('freq', 'Frequency', 12, 1, 120), STEP_R('angle', 'Angle', 0, 0, 360)] },
  gradient: { cat: 'Noise', label: 'Gradient', ins: [], outs: ['field'], params: [STEP_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular']), STEP_R('angle', 'Angle', 90, 0, 360)] },
  turing:   { cat: 'Noise', label: 'Reaction–Diffusion', ins: ['seed'], outs: ['field'], params: [STEP_SEL('pattern', 'Pattern', ['spots', 'coral', 'maze', 'worms', 'holes']), STEP_R('scale', 'Scale', 100, 50, 250)] },
  texture:  { cat: 'Textures', label: 'Vellum Texture', ins: ['seed'], outs: ['image', 'grey'], params: [['type', 'Texture', 'texture', 'linen'], STEP_R('p1', 'Knob 1', 100, 0, 400), STEP_R('p2', 'Knob 2', 100, 0, 400), STEP_R('p3', 'Knob 3', 50)] },
  stitch:   { cat: 'Textures', label: 'Stitch Border', ins: [], outs: ['mask'], params: [['style', 'Stitch', 'stitch', 'scallop'], STEP_R('offset', 'Offset', 14, 0, 400), STEP_R('size', 'Size', 4, 1, 40)] },
  // shaping
  levels:   { cat: 'Shape', label: 'Levels', ins: ['field'], outs: ['field'], params: [STEP_R('lo', 'Low', 0), STEP_R('hi', 'High', 100), STEP_R('gamma', 'Gamma', 50)] },
  threshold:{ cat: 'Shape', label: 'Threshold', ins: ['field'], outs: ['mask'], params: [STEP_R('at', 'At', 50), STEP_R('soft', 'Softness', 10)] },
  blur:     { cat: 'Shape', label: 'Blur', ins: ['field'], outs: ['field'], params: [STEP_R('radius', 'Radius', 8, 0, 100)] },
  warp:     { cat: 'Shape', label: 'Warp', ins: ['field', 'by'], outs: ['field'], params: [STEP_R('amount', 'Amount', 20)] },
  math:     { cat: 'Shape', label: 'Math', ins: ['a', 'b'], outs: ['result'], params: [STEP_SEL('op', 'Operation', ['add', 'multiply', 'max', 'min', 'difference', 'subtract'])] },
  mix:      { cat: 'Shape', label: 'Mix', ins: ['a', 'b', 'amount'], outs: ['result'], params: [STEP_R('t', 'Amount', 50)] },
  invert:   { cat: 'Shape', label: 'Invert', ins: ['field'], outs: ['field'], params: [] },
  posterize:{ cat: 'Shape', label: 'Posterize', ins: ['field'], outs: ['field'], params: [STEP_R('steps', 'Steps', 5, 2, 16)] },
  transform:{ cat: 'Shape', label: 'Tile & Rotate', ins: ['field'], outs: ['field'], params: [STEP_R('scale', 'Scale', 100, 25, 400), STEP_R('angle', 'Angle', 0, 0, 360)] },
  edges:    { cat: 'Shape', label: 'Edge Detect', ins: ['field'], outs: ['edges'], params: [STEP_R('strength', 'Strength', 50)] },
  // light and colour
  light:    { cat: 'Light & Colour', label: 'Light (heights)', ins: ['height', 'dial'], outs: ['light', 'highlight'], params: [STEP_R('relief', 'Relief', 50), STEP_R('gloss', 'Gloss', 30), STEP_R('shadow', 'Shadow', 60)] },
  tint:     { cat: 'Light & Colour', label: 'Tint', ins: ['field', 'light hue', 'dark hue'], outs: ['image'], params: [] },
  ramp:     { cat: 'Light & Colour', label: 'Colour Ramp', ins: ['field', 'colour a', 'colour b'], outs: ['image'], params: [STEP_R('mid', 'Middle', 50)] },
  blend:    { cat: 'Light & Colour', label: 'Blend', ins: ['base', 'layer', 'mask'], outs: ['image'], params: [STEP_SEL('mode', 'Mode', STEP_BLENDS), STEP_R('opacity', 'Opacity', 100)] },
  // the end
  surface:  { cat: 'Output', label: 'Surface', ins: ['image', 'height'], outs: [], params: [['name', 'Name', 'text', 'My Surface'], STEP_SEL('ground', 'Ground', ['grey', 'colour'])] },
  // newer parts (the chains' own)
  colour:   { cat: 'Inputs', label: 'Colour', ins: [], outs: ['colour'], params: [['hex', 'Colour', 'text', '#808080']] },
  forms:    { cat: 'Noise', label: 'Soft Forms', ins: [], outs: ['tone'], params: [STEP_R('count', 'Forms', 5, 1, 12), STEP_R('size', 'Size', 50), STEP_R('noise', 'Noise', 50)] },
  streaks:  { cat: 'Marks', label: 'Streaks', ins: ['base'], outs: ['field'], params: [STEP_SEL('kind', 'Kind', ['streaks', 'sheets']), STEP_R('angle', 'From', 0, 0, 360),
              STEP_R('spread', 'Gusts', 0, 0, 60), STEP_R('length', 'Length', 100, 25, 500), STEP_R('count', 'Count', 100, 0, 400), STEP_R('light', 'Light Share', 75), STEP_R('strength', 'Strength', 50)] },
  hatching: { cat: 'Marks', label: 'Hatching', ins: ['tone'], outs: ['ink'], params: [STEP_R('angle', 'Direction', 125, 0, 360), STEP_R('density', 'Density', 100, 10, 700),
              STEP_R('size', 'Patch Size', 100, 25, 400), STEP_R('cross', 'Cross-Hatching', 38), STEP_R('crossAngle', 'Cross Angle', 54, 10, 90), STEP_R('weight', 'Weight', 50)] },
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
  levels(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const lo = num(n, 'lo', 0)/100, hi = Math.max(lo + 0.01, num(n, 'hi', 100)/100), g = Math.pow(2, (num(n, 'gamma', 50) - 50)/25), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.pow(Math.max(0, Math.min(1, (f[i] - lo)/(hi - lo))), g);
    return [o];
  },
  threshold(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const at = num(n, 'at', 50)/100, sf = Math.max(0.002, num(n, 'soft', 10)/200), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const t = Math.max(0, Math.min(1, (f[i] - at + sf)/(2*sf))); o[i] = t*t*(3 - 2*t); }
    return [o];
  },
  blur(E, n){ const { unit, input, num, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null; return [boxBlur(f, num(n, 'radius', 8)*unit/1536*1.2)];
  },
  warp(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)), by = asField(input(n, 2)); if(!f) return null; if(!by) return [f];
    const A = num(n, 'amount', 20)/100*unit*0.08, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, a = by[q]*Math.PI*2;
      const sx = Math.max(0, Math.min(ww - 1, Math.round(x + Math.cos(a)*A))), sy = Math.max(0, Math.min(wh - 1, Math.round(y + Math.sin(a)*A))); o[q] = f[sy*ww + sx]; }
    return [o];
  },
  math(E, n){ const { N, input, P, flat, asField } = E;
    const a = asField(input(n, 1), 0), b = asField(input(n, 2), 0); if(!a && !b) return null;
    const A = a || flat(0), B = b || flat(0), op = P(n, 'op', 'add'), o = new Float32Array(N);
    const f = { add: (x, y) => x + y, multiply: (x, y) => x*y, max: Math.max, min: Math.min, difference: (x, y) => Math.abs(x - y), subtract: (x, y) => x - y }[op] || ((x, y) => x + y);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f(A[i], B[i])));
    return [o];
  },
  mix(E, n){ const { N, input, num, asField, asImage } = E;
    const ia = input(n, 1), ib = input(n, 2), ta = input(n, 3), tp = num(n, 't', 50)/100;
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
  posterize(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const k = Math.max(2, Math.min(16, Math.round(num(n, 'steps', 5)))), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.min(k - 1, Math.floor(Math.max(0, f[i])*k))/(k - 1);
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
    const L = asImage(lay), fn = STEP_BLEND_FN[P(n, 'mode', 'normal')] || STEP_BLEND_FN.normal, op = num(n, 'opacity', 100)/100;
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = op*(m ? m[i] : 1);
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

/** Every step: the part, its cost and what it does. */
export const STEPS = { ...Object.fromEntries(Object.entries(STEP_PARTS).map(([k, part]) =>
  [k, { ...part, cost: STEP_COST[k] || (() => 1), run: STEP_RUN[k] }])),
  // the surfaces' own steps (each file a family; their parts carry their own cost and run)
  ...TOUCH_STEPS, ...CHAOS_STEPS };
/** A param's range (for a bound param with no range of its own), or null. */
export function stepRange(name, key){
  const p = ((STEPS[name] || {}).params || []).find(q => q[0] === key);
  return p && p[2] === 'range' ? [p[4].min, p[4].max] : null;
}
