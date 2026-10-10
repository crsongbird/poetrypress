/**
 * athanor.js — THE ATHANOR's evaluator: a graph from the node editor
 * (forge.js; Drawflow's export JSON) made into a texture.
 *
 * The model is Material Maker's and Substance Designer's: each node is a
 * small operation, images in and images out. The graph is walked from its
 * Surface node backwards (each node once, remembered), on the same working
 * grid the generators use (canonical pixels, canonDiv(2)), so a preview is
 * the export at a smaller size. Values travel as:
 *   field   a grey picture, 0..1 per pixel (Float32Array)
 *   image   colour, { r, g, b } fields
 *   colour  one colour, [r, g, b] in 0..1
 *   value   one number, 0..1
 * and become one another where a port asks (a field is a grey image; an image
 * read as a field is its brightness; a value is a flat field).
 *
 * Runs in the texture worker like any texture (the cache keys the graph).
 * Another Vellum texture used as a node comes from `deps.texture`.
 */
import { makeNoiseGrid, sampleNoiseGrid, lightHeights, parseHex, canonDiv, withSeed } from './texCore.js';
import { drawStitch, pathFromPoints, roundRectPoints } from './stitches.js';

/**
 * A graph's VERSION, so an old graph keeps making what it made. Version 1
 * drew every node's randomness from one stream, in the order the graph was
 * walked; from version 2 each node has its own (from the seed and its id), so
 * a node makes the same field whatever else changes — which is what lets a
 * node's result be kept between edits (below). A new graph is always the
 * newest version; one loaded keeps its own.
 */
export const ATHANOR_VERSION = 2;
export function athanorVersion(graph){
  try { const g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {}); return Math.max(1, parseInt(g.v, 10) || 1); }
  catch(e){ return 1; }
}
/**
 * The work budget: no graph may freeze a phone. Each part costs about as many
 * passes over the page as it makes (a blur four, the light engine fourteen,
 * another texture forty…). Past the budget the graph is made on a coarser
 * grid (up to three times coarser; it is soft, never stuck); past the node
 * limit it is not made at all, and the editor says why.
 */
export const ATHANOR_LIMITS = { nodes: 64, cost: 160 };
const ATHANOR_COST = { noise: d => Math.max(1, +d.octaves || 3), cells: () => 9, turing: () => 60, texture: () => 40, stitch: () => 8,
  blur: () => 4, warp: () => 1.5, mix: () => 1.5, light: () => 14, tint: () => 1.5, ramp: () => 2, blend: () => 3, page: () => 3,
  transform: () => 1.5, edges: () => 2 };
export function athanorBudget(graph){
  const nodes = Object.values(athanorNodes(graph));
  let cost = 0;
  for(const n of nodes){ const f = ATHANOR_COST[n.name]; cost += f ? f(n.data || {}) : 1;
    if(n.name === 'surface' && ((n.inputs || {}).input_2 || {}).connections && n.inputs.input_2.connections.length) cost += 14; }
  const tooMany = nodes.length > ATHANOR_LIMITS.nodes;
  return { nodes: nodes.length, cost: Math.round(cost), tooMany, scale: tooMany ? 1 : Math.min(3, Math.max(1, Math.sqrt(cost/ATHANOR_LIMITS.cost))) };
}

/** The graph's nodes, by id ({} if it can't be read). */
export function athanorNodes(graph){
  try { const g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {}); return ((g.drawflow || {}).Home || {}).data || {}; }
  catch(e){ return {}; }
}
/** The sliders a graph offers: its Knob nodes, by slot (1–6). */
export function athanorKnobs(graph){
  const out = [];
  for(const n of Object.values(athanorNodes(graph))){
    if(n.name !== 'knob') continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(6, parseInt(d.slot, 10) || 1));
    if(!out.find(k => k.slot === slot)) out.push({ slot, label: String(d.name || 'Knob ' + slot).slice(0, 24), def: Math.max(0, Math.min(100, +d.def || 50)) });
  }
  return out.sort((a, b) => a.slot - b.slot);
}
/** The hues a graph uses: its Hue nodes, by slot (1–2). */
export function athanorHues(graph){
  const out = [];
  for(const n of Object.values(athanorNodes(graph))){
    if(n.name !== 'hue') continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(2, parseInt(d.slot, 10) || 1));
    if(!out.find(h => h.slot === slot)) out.push({ slot, label: String(d.name || (slot === 1 ? 'Light Hue' : 'Dark Hue')).slice(0, 24) });
  }
  return out.sort((a, b) => a.slot - b.slot);
}
/** The Surface node's name (what the texture is called in the list). */
export function athanorName(graph){
  const s = Object.values(athanorNodes(graph)).find(n => n.name === 'surface');
  return s ? String((s.data || {}).name || 'My Surface').slice(0, 32) : '';
}
/** A short hash of the graph, for the texture cache (positions don't count). */
export function athanorHash(graph){
  const nodes = athanorNodes(graph);
  const sig = athanorVersion(graph) + JSON.stringify(Object.keys(nodes).sort().map(id => { const n = nodes[id];
    return [id, n.name, n.data, Object.values(n.inputs || {}).map(i => (i.connections || []).map(c => c.node + ':' + c.input))]; }));
  let h = 2166136261; for(let i = 0; i < sig.length; i++){ h ^= sig.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// ---- blends, as the canvas and the GPU do them (per channel, 0..1) ----
const CR_SOFT = (b, s) => s <= 0.5 ? b - (1 - 2*s)*b*(1 - b) : b + (2*s - 1)*((b <= 0.25 ? ((16*b - 12)*b + 4)*b : Math.sqrt(b)) - b);
const CR_BLEND = {
  'normal': (b, s) => s, 'source-over': (b, s) => s,
  'multiply': (b, s) => b*s, 'screen': (b, s) => 1 - (1 - b)*(1 - s),
  'overlay': (b, s) => b < 0.5 ? 2*b*s : 1 - 2*(1 - b)*(1 - s), 'hard-light': (b, s) => s < 0.5 ? 2*b*s : 1 - 2*(1 - b)*(1 - s),
  'soft-light': CR_SOFT, 'darken': Math.min, 'lighten': Math.max,
  'color-dodge': (b, s) => s >= 1 ? 1 : Math.min(1, b/(1 - s)), 'color-burn': (b, s) => s <= 0 ? 0 : 1 - Math.min(1, (1 - b)/s),
  'difference': (b, s) => Math.abs(b - s), 'exclusion': (b, s) => b + s - 2*b*s,
  'vivid-light': (b, s) => s < 0.5 ? (s <= 0 ? 0 : 1 - (1 - b)/(2*s)) : (s >= 1 ? 1 : b/(2*(1 - s))),
  'linear-light': (b, s) => b + 2*s - 1, 'pin-light': (b, s) => s < 0.5 ? Math.min(b, 2*s) : Math.max(b, 2*s - 1),
  'linear-burn': (b, s) => b + s - 1, 'subtract': (b, s) => b - s, 'divide': (b, s) => b/Math.max(s, 1/255),
};

/**
 * The graph as a picture: { r, g, b } fields on a ww × wh grid, or null when
 * there is no Surface to show. ctx: { knobs: [six 0..100], tints: [hex, hex],
 * light (degrees), seed, scale }. deps.texture(type, w, h, opts) → a canvas.
 */
// ---- each node's result, kept between edits (version 2 graphs) ----
// Keyed by the node's whole upstream (its parts, settings and wiring, not
// where it sits), the grid, and what the page gives (seed, knobs, hues, dial):
// change one node and only it and what lies downstream are made again. A few
// dozen MB at most, the least recently used let go first.
const ATHANOR_KEPT = new Map(); let athanorKeptBytes = 0, athanorHits = 0;
const ATHANOR_KEEP_BYTES = 48*1024*1024;
const keptSize = outs => (outs || []).reduce((s, v) => s + (v instanceof Float32Array ? v.length*4 : v && v.r ? v.r.length*12 : 8), 0);
function athanorKeep(key, outs){
  if(ATHANOR_KEPT.has(key)) return;
  const b = keptSize(outs); if(b > ATHANOR_KEEP_BYTES/4) return;
  ATHANOR_KEPT.set(key, { outs, b }); athanorKeptBytes += b;
  for(const [k, v] of ATHANOR_KEPT){ if(athanorKeptBytes <= ATHANOR_KEEP_BYTES) break; ATHANOR_KEPT.delete(k); athanorKeptBytes -= v.b; }
}
/** What is kept (for the tests and the debug view). */
export function athanorCacheInfo(){ return { entries: ATHANOR_KEPT.size, bytes: athanorKeptBytes, hits: athanorHits }; }
export function clearAthanorCache(){ ATHANOR_KEPT.clear(); athanorKeptBytes = 0; athanorHits = 0; }
const fnv = str => { let h = 2166136261; for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

export function evalAthanor(graph, ww, wh, ctx, deps = {}){
  const nodes = athanorNodes(graph);
  const surface = Object.values(nodes).find(n => n.name === 'surface');
  if(!surface) return null;
  const v2 = athanorVersion(graph) >= 2;
  const ctxSig = JSON.stringify([ww, wh, ctx.seed, ctx.knobs, ctx.tints, ctx.light, ctx.lightTilt, ctx.scale]);
  // a node's upstream, as a signature (loops cut)
  const sigs = new Map(), sigBusy = new Set();
  const sigOf = id => {
    if(sigs.has(id)) return sigs.get(id);
    if(sigBusy.has(id)) return 'loop';
    const n = nodes[id]; if(!n) return '-';
    sigBusy.add(id);
    const ins = Object.keys(n.inputs || {}).sort().map(k => k + '<' + ((n.inputs[k].connections || []).map(c => sigOf(String(c.node)) + '.' + c.input).join(',')));
    sigBusy.delete(id);
    const s = n.name + JSON.stringify(n.data || {}) + '[' + ins.join(';') + ']#' + id;
    sigs.set(id, s); return s;
  };
  const N = ww*wh, unit = Math.min(ww, wh);
  const memo = new Map(), busy = new Set();
  const flat = v => new Float32Array(N).fill(v);
  const lum = img => { const f = new Float32Array(N); for(let i = 0; i < N; i++) f[i] = 0.299*img.r[i] + 0.587*img.g[i] + 0.114*img.b[i]; return f; };
  const isImg = v => v && typeof v === 'object' && v.r instanceof Float32Array;
  const asField = (v, d = 0) => v == null ? null : typeof v === 'number' ? flat(v) : v instanceof Float32Array ? v
    : isImg(v) ? lum(v) : Array.isArray(v) ? flat(0.299*v[0] + 0.587*v[1] + 0.114*v[2]) : flat(d);
  const asImage = v => v == null ? null : isImg(v) ? v : v instanceof Float32Array ? { r: v, g: v, b: v }
    : Array.isArray(v) ? { r: flat(v[0]), g: flat(v[1]), b: flat(v[2]) } : typeof v === 'number' ? { r: flat(v), g: flat(v), b: flat(v) } : null;
  const asColour = (v, d) => Array.isArray(v) ? v : v == null ? d : d;
  const hexCol = hex => { const c = parseHex(hex || '#808080'); return [c.r/255, c.g/255, c.b/255]; };
  const P = (n, k, d) => { const v = (n.data || {})[k]; return v === undefined || v === '' ? d : v; };
  const num = (n, k, d) => { const v = parseFloat(P(n, k, d)); return isNaN(v) ? d : v; };
  // the value arriving at a node's j-th input (1-based), or undefined
  const input = (n, j) => {
    const c = ((n.inputs || {})['input_' + j] || {}).connections || [];
    if(!c.length) return undefined;
    const outs = evalNode(String(c[0].node)), k = parseInt(String(c[0].input).replace('output_', ''), 10) - 1;
    return outs ? outs[k] : undefined;
  };
  const evalNode = id => {
    if(memo.has(id)) return memo.get(id);
    if(busy.has(id)) return null;                       // a loop: cut it
    const n = nodes[id]; if(!n) return null;
    busy.add(id);
    let out = null;
    const key = v2 ? fnv(sigOf(id)) + ':' + sigOf(id).length + ':' + ctxSig : null;
    const kept = key && ATHANOR_KEPT.get(key);
    if(kept){ ATHANOR_KEPT.delete(key); ATHANOR_KEPT.set(key, kept); athanorHits++; out = kept.outs; }
    else {
      // version 2: the node's own randomness, from the seed and its id
      try { out = v2 ? withSeed(fnv((ctx.seed >>> 0) + ':' + id), () => RUN(n)) : RUN(n); } catch(e){ out = null; }
      if(key && out) athanorKeep(key, out);
    }
    busy.delete(id); memo.set(id, out);
    return out;
  };
  // a value field the size of the page, from a function of (u, v) in 0..1
  const field = fn => { const f = new Float32Array(N); for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) f[y*ww + x] = fn(x/ww, y/wh, x, y); return f; };
  const boxBlur = (f, r) => {
    if(r < 0.5) return f;
    const R = Math.max(1, Math.round(r)), t = new Float32Array(N), o = new Float32Array(N);
    for(let pass = 0; pass < 2; pass++){
      const src = pass ? o : f, mid = t;
      for(let y = 0; y < wh; y++){ let s = 0, c = 0; for(let x = -R; x <= R; x++){ if(x >= 0 && x < ww){ s += src[y*ww + x]; c++; } }
        for(let x = 0; x < ww; x++){ mid[y*ww + x] = s/c; const a = x - R, b = x + R + 1; if(a >= 0){ s -= src[y*ww + a]; c--; } if(b < ww){ s += src[y*ww + b]; c++; } } }
      for(let x = 0; x < ww; x++){ let s = 0, c = 0; for(let y = -R; y <= R; y++){ if(y >= 0 && y < wh){ s += mid[y*ww + x]; c++; } }
        for(let y = 0; y < wh; y++){ o[y*ww + x] = s/c; const a = y - R, b = y + R + 1; if(a >= 0){ s -= mid[a*ww + x]; c--; } if(b < wh){ s += mid[b*ww + x]; c++; } } }
    }
    return o;
  };
  const readCanvas = (cv) => {
    // a canvas (another texture, a stitch) read back at the working size
    const c = document.createElement('canvas'); c.width = ww; c.height = wh;
    const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.drawImage(cv, 0, 0, ww, wh);
    const d = x.getImageData(0, 0, ww, wh).data, r = new Float32Array(N), g = new Float32Array(N), b = new Float32Array(N);
    for(let i = 0; i < N; i++){ r[i] = d[i*4]/255; g[i] = d[i*4+1]/255; b[i] = d[i*4+2]/255; }
    return { r, g, b };
  };
  const lightOf = (H, dialDeg, relief, gloss, shadow) => lightHeights(H, ww, wh, { light: dialDeg, relief, gloss, shadow, ao: 0.3, ambient: 0.4 });

  const RUN = n => {
    switch(n.name){
      case 'knob':  return [Math.max(0, Math.min(100, +((ctx.knobs || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] ?? num(n, 'def', 50))))/100];
      case 'hue':   return [hexCol((ctx.tints || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] || '#FFFFFF')];
      case 'dial':  return [((ctx.light ?? 315) % 360)/360, Math.max(0, Math.min(1.3, (ctx.lightTilt ?? 100)/100))];
      case 'seed':  return [((ctx.seed >>> 0) % 1000)/1000];
      case 'page':  return [field(u => u), field((u, v) => v), field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
      case 'noise': {
        const cells = Math.max(1, num(n, 'scale', 40))/10, oct = Math.max(1, Math.min(6, Math.round(num(n, 'octaves', 3))));
        const s0 = input(n, 1), off = typeof s0 === 'number' ? s0*97 : 0;
        const grids = []; for(let o = 0; o < oct; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; grids.push({ g, grid: makeNoiseGrid(g, g), a: Math.pow(0.5, o) }); }
        const norm = grids.reduce((s, o) => s + o.a, 0);
        // square cells, `scale/10` of them across the page's short side
        return [field((u, v, x, y) => { let s = 0; for(const o of grids) s += sampleNoiseGrid(o.grid, o.g, o.g, x/unit*(o.g - 1) + off, y/unit*(o.g - 1) + off*1.7)*o.a; return s/norm; })];
      }
      case 'cells': {
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
      }
      case 'waves': {
        const fq = Math.max(1, num(n, 'freq', 12)), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
        const wf = asField(input(n, 1)), asp = ww/unit, asq = wh/unit;
        return [field((u, v, x, y) => 0.5 + 0.5*Math.sin(((u*asp*ca + v*asq*sa)*fq + (wf ? wf[y*ww + x]*2 : 0))*Math.PI*2))];
      }
      case 'gradient': {
        const shape = P(n, 'shape', 'linear'), an = num(n, 'angle', 90)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
        if(shape === 'radial') return [field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
        if(shape === 'rectangular') return [field((u, v) => Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5))*2)];
        return [field((u, v) => Math.max(0, Math.min(1, 0.5 + ((u - 0.5)*ca + (v - 0.5)*sa))))];
      }
      case 'turing': case 'texture': {
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
      }
      case 'stitch': {
        const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d');
        x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh);
        const k = unit/1536, off = num(n, 'offset', 14)*k*2, sz = Math.max(1, num(n, 'size', 4))*k*2;
        drawStitch(x, pathFromPoints(roundRectPoints(off, off, ww - off*2, wh - off*2, 0), true), String(P(n, 'style', 'scallop')),
          { period: sz*6 + unit*0.012, amp: sz*2 + unit*0.004, width: sz, color: '#fff', side: 1 });
        return [lum(readCanvas(c))];
      }
      case 'levels': {
        const f = asField(input(n, 1), 0.5); if(!f) return null;
        const lo = num(n, 'lo', 0)/100, hi = Math.max(lo + 0.01, num(n, 'hi', 100)/100), g = Math.pow(2, (num(n, 'gamma', 50) - 50)/25), o = new Float32Array(N);
        for(let i = 0; i < N; i++) o[i] = Math.pow(Math.max(0, Math.min(1, (f[i] - lo)/(hi - lo))), g);
        return [o];
      }
      case 'threshold': {
        const f = asField(input(n, 1), 0.5); if(!f) return null;
        const at = num(n, 'at', 50)/100, sf = Math.max(0.002, num(n, 'soft', 10)/200), o = new Float32Array(N);
        for(let i = 0; i < N; i++){ const t = Math.max(0, Math.min(1, (f[i] - at + sf)/(2*sf))); o[i] = t*t*(3 - 2*t); }
        return [o];
      }
      case 'blur': { const f = asField(input(n, 1)); if(!f) return null; return [boxBlur(f, num(n, 'radius', 8)*unit/1536*1.2)]; }
      case 'warp': {
        const f = asField(input(n, 1)), by = asField(input(n, 2)); if(!f) return null; if(!by) return [f];
        const A = num(n, 'amount', 20)/100*unit*0.08, o = new Float32Array(N);
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, a = by[q]*Math.PI*2;
          const sx = Math.max(0, Math.min(ww - 1, Math.round(x + Math.cos(a)*A))), sy = Math.max(0, Math.min(wh - 1, Math.round(y + Math.sin(a)*A))); o[q] = f[sy*ww + sx]; }
        return [o];
      }
      case 'math': {
        const a = asField(input(n, 1), 0), b = asField(input(n, 2), 0); if(!a && !b) return null;
        const A = a || flat(0), B = b || flat(0), op = P(n, 'op', 'add'), o = new Float32Array(N);
        const f = { add: (x, y) => x + y, multiply: (x, y) => x*y, max: Math.max, min: Math.min, difference: (x, y) => Math.abs(x - y), subtract: (x, y) => x - y }[op] || ((x, y) => x + y);
        for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f(A[i], B[i])));
        return [o];
      }
      case 'mix': {
        const ia = input(n, 1), ib = input(n, 2), t = asField(input(n, 3)), tp = num(n, 't', 50)/100;
        if(ia == null && ib == null) return null;
        const A = asImage(ia ?? 0), B = asImage(ib ?? 0), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
        for(let i = 0; i < N; i++){ const k = t ? t[i] : tp; o.r[i] = A.r[i] + (B.r[i] - A.r[i])*k; o.g[i] = A.g[i] + (B.g[i] - A.g[i])*k; o.b[i] = A.b[i] + (B.b[i] - A.b[i])*k; }
        return [o];
      }
      case 'posterize': {
        const f = asField(input(n, 1)); if(!f) return null;
        const k = Math.max(2, Math.min(16, Math.round(num(n, 'steps', 5)))), o = new Float32Array(N);
        for(let i = 0; i < N; i++) o[i] = Math.min(k - 1, Math.floor(Math.max(0, f[i])*k))/(k - 1);
        return [o];
      }
      case 'transform': {
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
      }
      case 'edges': {
        // Sobel: where the field changes fastest
        const f = asField(input(n, 1)); if(!f) return null;
        const k = num(n, 'strength', 50)/50*unit/96, o = new Float32Array(N), at = (x, y) => f[Math.max(0, Math.min(wh - 1, y))*ww + Math.max(0, Math.min(ww - 1, x))];
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
          const gx = at(x+1,y-1) + 2*at(x+1,y) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x-1,y) - at(x-1,y+1);
          const gy = at(x-1,y+1) + 2*at(x,y+1) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x,y-1) - at(x+1,y-1);
          o[y*ww + x] = Math.min(1, Math.hypot(gx, gy)*k/8);
        }
        return [o];
      }
      case 'invert': { const v = input(n, 1); if(v == null) return null;
        if(isImg(v)){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ o.r[i] = 1 - v.r[i]; o.g[i] = 1 - v.g[i]; o.b[i] = 1 - v.b[i]; } return [o]; }
        const f = asField(v), o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = 1 - f[i]; return [o]; }
      case 'light': {
        const h0 = asField(input(n, 1)); if(!h0) return null;
        const dial = input(n, 2), deg = typeof dial === 'number' ? dial*360 : (ctx.light ?? 315);
        const H = new Float32Array(N), rel = num(n, 'relief', 50)/100*unit*0.02;
        for(let i = 0; i < N; i++) H[i] = h0[i]*rel;
        const L = lightOf(H, deg, 1, num(n, 'gloss', 30)/100, num(n, 'shadow', 60)/100), lf = new Float32Array(N), sp = new Float32Array(N);
        for(let i = 0; i < N; i++){ lf[i] = Math.min(1, L.light[i]/L.flat*0.5); sp[i] = L.spec[i]; }
        return [lf, sp];
      }
      case 'tint': {
        const f = asField(input(n, 1), 0.5); if(!f) return null;
        const lc = asColour(input(n, 2), hexCol((ctx.tints || [])[0] || '#FFFFFF')), dc = asColour(input(n, 3), hexCol((ctx.tints || [])[1] || '#000000'));
        const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
        for(let i = 0; i < N; i++){ const t = f[i]; o.r[i] = dc[0] + (lc[0] - dc[0])*t; o.g[i] = dc[1] + (lc[1] - dc[1])*t; o.b[i] = dc[2] + (lc[2] - dc[2])*t; }
        return [o];
      }
      case 'ramp': {
        const f = asField(input(n, 1), 0.5); if(!f) return null;
        const a = asColour(input(n, 2), [0, 0, 0]), b = asColour(input(n, 3), [1, 1, 1]), mid = Math.max(0.02, Math.min(0.98, num(n, 'mid', 50)/100));
        const g = Math.log(0.5)/Math.log(mid), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
        for(let i = 0; i < N; i++){ const t = Math.pow(Math.max(0, Math.min(1, f[i])), g); o.r[i] = a[0] + (b[0] - a[0])*t; o.g[i] = a[1] + (b[1] - a[1])*t; o.b[i] = a[2] + (b[2] - a[2])*t; }
        return [o];
      }
      case 'blend': {
        const base = asImage(input(n, 1) ?? 0.5), lay = input(n, 2), m = asField(input(n, 3));
        if(lay == null) return [base];
        const L = asImage(lay), fn = CR_BLEND[P(n, 'mode', 'normal')] || CR_BLEND.normal, op = num(n, 'opacity', 100)/100;
        const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
        for(let i = 0; i < N; i++){ const k = op*(m ? m[i] : 1);
          for(const c of ['r', 'g', 'b']){ const b0 = base[c][i]; o[c][i] = b0 + (Math.max(0, Math.min(1, fn(b0, L[c][i]))) - b0)*k; } }
        return [o];
      }
      case 'surface': {
        const img = asImage(input(n, 1) ?? 0.5), h0 = asField(input(n, 2));
        if(!h0) return [img];
        // heights: the picture lit by the dial, as the engine lights a texture
        const H = new Float32Array(N); for(let i = 0; i < N; i++) H[i] = h0[i]*unit*0.01;
        const L = lightOf(H, ctx.light ?? 315, 1, 0.3, 0.6), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
        for(let i = 0; i < N; i++){ const k = L.light[i]/L.flat, s = L.spec[i]*0.6; o.r[i] = img.r[i]*k + s; o.g[i] = img.g[i]*k + s; o.b[i] = img.b[i]*k + s; }
        return [o];
      }
    }
    return null;
  };
  const res = evalNode(String(surface.id));
  return res && res[0] ? asImage(res[0]) : null;
}

// ---- starter graphs: a few to begin from (Material Maker's and Blender's
// way: a working graph to take apart, rather than an empty page) ----
// each: nodes [type, data, x, y] and wires [from, output, to, input] (1-based)
export const ATHANOR_STARTERS = {
  marble: { label: 'Marble', nodes: [
      ['noise', { scale: 14, octaves: 6 }, 40, 60], ['knob', { slot: '1', name: 'Turbulence', def: 85 }, 40, 260],
      ['math', { op: 'multiply' }, 280, 120], ['waves', { freq: 4, angle: 30 }, 500, 120], ['levels', { lo: 0, hi: 100, gamma: 78 }, 720, 120],
      ['hue', { slot: '1', name: 'Stone Hue' }, 720, 320], ['hue', { slot: '2', name: 'Vein Hue' }, 720, 440],
      ['ramp', { mid: 70 }, 960, 160], ['surface', { name: 'Marble', ground: 'colour' }, 1200, 160]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1], [4, 1, 5, 1], [5, 1, 8, 1], [7, 1, 8, 2], [6, 1, 8, 3], [8, 1, 9, 1]] },
  leaded: { label: 'Leaded Window', nodes: [
      ['cells', { scale: 70, jitter: 85 }, 40, 80], ['knob', { slot: '1', name: 'Leading', def: 60 }, 40, 300], ['math', { op: 'multiply' }, 280, 60],
      ['threshold', { at: 45, soft: 8 }, 500, 40], ['invert', {}, 720, 40],
      ['hue', { slot: '1', name: 'Glass Hue' }, 300, 300], ['hue', { slot: '2', name: 'Second Glass Hue' }, 300, 420],
      ['ramp', { mid: 50 }, 540, 260], ['blend', { mode: 'multiply', opacity: 100 }, 940, 140], ['surface', { name: 'Leaded Window', ground: 'colour' }, 1180, 140]],
    wires: [[1, 2, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1], [4, 1, 5, 1], [1, 3, 8, 1], [6, 1, 8, 2], [7, 1, 8, 3], [8, 1, 9, 1], [5, 1, 9, 2], [9, 1, 10, 1], [4, 1, 10, 2]] },
  terrain: { label: 'Lit Terrain', nodes: [
      ['noise', { scale: 18, octaves: 6 }, 40, 80], ['knob', { slot: '1', name: 'Relief', def: 60 }, 40, 280], ['math', { op: 'multiply' }, 280, 220],
      ['hue', { slot: '1', name: 'High Hue' }, 280, 20], ['hue', { slot: '2', name: 'Low Hue' }, 280, 120],
      ['ramp', { mid: 45 }, 520, 60], ['surface', { name: 'Lit Terrain', ground: 'colour' }, 760, 120]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [1, 1, 6, 1], [5, 1, 6, 2], [4, 1, 6, 3], [6, 1, 7, 1], [3, 1, 7, 2]] },
  woven: { label: 'Woven Waves', nodes: [
      ['waves', { freq: 14, angle: 0 }, 40, 40], ['waves', { freq: 14, angle: 90 }, 40, 220], ['math', { op: 'max' }, 280, 120],
      ['knob', { slot: '1', name: 'Thread', def: 80 }, 280, 300], ['math', { op: 'multiply' }, 500, 160],
      ['levels', { lo: 20, hi: 100, gamma: 50 }, 720, 120], ['tint', {}, 940, 120], ['surface', { name: 'Woven Waves', ground: 'colour' }, 1160, 120]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [3, 1, 5, 1], [4, 1, 5, 2], [5, 1, 6, 1], [6, 1, 7, 1], [7, 1, 8, 1], [6, 1, 8, 2]] },
  bloom: { label: 'Reaction Bloom', nodes: [
      ['turing', { pattern: 'coral', scale: 100 }, 40, 80], ['blur', { radius: 10 }, 300, 160], ['knob', { slot: '1', name: 'Bloom', def: 40 }, 300, 300],
      ['mix', { t: 50 }, 520, 80],
      ['hue', { slot: '1', name: 'Light Hue' }, 520, 300], ['hue', { slot: '2', name: 'Dark Hue' }, 520, 420],
      ['ramp', { mid: 50 }, 760, 160], ['surface', { name: 'Reaction Bloom', ground: 'colour' }, 1000, 160]],
    wires: [[1, 1, 2, 1], [1, 1, 4, 1], [2, 1, 4, 2], [3, 1, 4, 3], [4, 1, 7, 1], [6, 1, 7, 2], [5, 1, 7, 3], [7, 1, 8, 1], [4, 1, 8, 2]] },
};
/** A starter as a graph (Drawflow's export form, without node faces). */
export function athanorStarter(name){
  const S = ATHANOR_STARTERS[name]; if(!S) return null;
  const data = {};
  S.nodes.forEach(([type, d, x, y], i) => { const id = i + 1;
    data[id] = { id, name: type, data: { ...d }, class: '', html: '', typenode: false, inputs: {}, outputs: {}, pos_x: x, pos_y: y }; });
  for(const [a, o, b, j] of S.wires){
    ((data[b].inputs['input_' + j] ||= { connections: [] }).connections).push({ node: String(a), input: 'output_' + o });
    ((data[a].outputs['output_' + o] ||= { connections: [] }).connections).push({ node: String(b), output: 'input_' + j });
  }
  return { v: ATHANOR_VERSION, drawflow: { Home: { data } } };
}
