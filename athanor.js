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
 *
 * What each node DOES is its step's (steps.js, shared with the textures
 * rebuilt as chains: chains.js); this file walks the graph, keeps results,
 * keeps the budget, and resolves bound params ('@k2', '@dial').
 *
 * A CANVAS PASS (ctx.canvas): a graph whose parts can PAINT (draw on a canvas
 * at full size, as Cartomancy's Table and Deal do) is made that way on the
 * page — pictures travel as canvases, numbers and colours as ever, and the
 * Surface hands back the canvas it is given. Used for a texture lettered in
 * web fonts, which must be drawn at full size; the same graph on the
 * Athanor's grid runs each part's RUN instead.
 */
import { lightHeights, parseHex, withSeed, cpx, scaleNow } from './texCore.js';
import { STEPS, stepRange, paramPort, curveAt } from './steps.js';
import { TEXTURE_CHAINS } from './chains.js';
import { ATHANOR_STUDIES } from './athanorStudies.js';

/**
 * A graph's VERSION, so an old graph keeps making what it made. Version 1
 * drew every node's randomness from one stream, in the order the graph was
 * walked; from version 2 each node has its own (from the seed and its id), so
 * a node makes the same field whatever else changes — which is what lets a
 * node's result be kept between edits (below). A new graph is always the
 * newest version; one loaded keeps its own.
 */
// v3 (Filter Forge's MAP INPUTS): a picture wired into a part's ⚙ setting sets it point by point, wherever
// the part can use it so (E.map); v2 took the picture's average. The textures' own chains stay v2, so
// they draw exactly as they did.
export const ATHANOR_VERSION = 3;
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
export function athanorBudget(graph){
  const nodes = Object.values(athanorNodes(graph));
  let cost = 0;
  for(const n of nodes){ const f = (STEPS[n.name] || {}).cost; cost += f ? f(n.data || {}) : 1;
    if(n.name === 'surface' && ((n.inputs || {}).input_2 || {}).connections && n.inputs.input_2.connections.length) cost += 14; }
  const tooMany = nodes.length > ATHANOR_LIMITS.nodes;
  return { nodes: nodes.length, cost: Math.round(cost), tooMany, scale: tooMany ? 1 : Math.min(3, Math.max(1, Math.sqrt(cost/ATHANOR_LIMITS.cost))) };
}

/** The graph's nodes, by id ({} if it can't be read). */
export function athanorNodes(graph){
  try { const g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {}); return ((g.drawflow || {}).Home || {}).data || {}; }
  catch(e){ return {}; }
}
/** The nodes whose work reaches the Surface (Filter Forge: a control that doesn't reach the Result isn't shown). */
export function athanorReach(graph){
  const nodes = athanorNodes(graph), seen = new Set(), s = Object.values(nodes).find(n => n.name === 'surface');
  const walk = id => { if(seen.has(id) || !nodes[id]) return; seen.add(id);
    for(const inp of Object.values(nodes[id].inputs || {})) for(const c of inp.connections || []) walk(String(c.node)); };
  if(s) walk(String(s.id));
  return seen;
}
/** The sliders a graph offers: its Knob nodes, by slot (1–6) — those that reach the Surface by a wire, or whose
 *  slot a part on the way binds ('@k3'); a Knob left unwired offers nothing (it would move nothing). */
export function athanorKnobs(graph){
  const out = [], reach = athanorReach(graph), all = athanorNodes(graph);
  const boundSlots = new Set(); for(const id of reach) for(const v of Object.values((all[id] || {}).data || {})){ const m = typeof v === 'string' && /^@k([1-6])/.exec(v); if(m) boundSlots.add(+m[1]); }
  for(const n of Object.values(all)){
    if(n.name !== 'knob') continue;
    if(!reach.has(String(n.id)) && !boundSlots.has(Math.max(1, Math.min(6, parseInt((n.data || {}).slot, 10) || 1)))) continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(6, parseInt(d.slot, 10) || 1));
    if(!out.find(k => k.slot === slot)) out.push({ slot, label: String(d.name || 'Knob ' + slot).slice(0, 24), def: Math.max(0, Math.min(100, +d.def || 50)) });
  }
  // a param bound to a slider ('@k3') offers that slider, named after the param
  for(const n of Object.values(all)) if(reach.has(String(n.id))) for(const [k, v] of Object.entries(n.data || {})){
    const m = typeof v === 'string' && /^@k([1-6])/.exec(v); if(!m) continue;
    const slot = +m[1]; if(out.find(q => q.slot === slot)) continue;
    const part = ((STEPS[n.name] || {}).params || []).find(q => q[0] === k);
    out.push({ slot, label: String(part ? part[1] : 'Knob ' + slot).slice(0, 24), def: 50 });
  }
  return out.sort((a, b) => a.slot - b.slot);
}
/** The hues a graph uses: its Hue nodes, by slot (1–2). */
export function athanorHues(graph){
  const out = [], reach = athanorReach(graph);
  for(const n of Object.values(athanorNodes(graph))){
    if(n.name !== 'hue' || !reach.has(String(n.id))) continue;
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
/** A node's settings that change what it makes: not '_pin' and its kin (the editor's own marks). */
export function athanorWork(data){
  const o = {}; for(const k of Object.keys(data || {})) if(k[0] !== '_') o[k] = data[k];
  return o;
}
export function athanorHash(graph){
  const nodes = athanorNodes(graph);
  const sig = athanorVersion(graph) + JSON.stringify(Object.keys(nodes).sort().map(id => { const n = nodes[id];
    return [id, n.name, athanorWork(n.data), Object.values(n.inputs || {}).map(i => (i.connections || []).map(c => c.node + ':' + c.input))]; }));
  let h = 2166136261; for(let i = 0; i < sig.length; i++){ h ^= sig.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

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
export function athanorCacheInfo(){ return { entries: ATHANOR_KEPT.size, bytes: athanorKeptBytes, hits: athanorHits }; }   // test hook: the cache's size and hits
export function clearAthanorCache(){ ATHANOR_KEPT.clear(); athanorKeptBytes = 0; athanorHits = 0; }   // test hook: a cold cache, so a test measures a first run
const fnv = str => { let h = 2166136261; for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** A curve drawn as its graph (the step previews): a bright line over a faint grid on dark. */
function curvePlot(c, ww, wh){
  const N = ww*wh, f = new Float32Array(N).fill(0.08), lw = Math.max(1, Math.min(ww, wh)/40), pad = Math.min(ww, wh)*0.08;
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const u = (x - pad)/(ww - 2*pad), v = 1 - (y - pad)/(wh - 2*pad), q = y*ww + x;
    if(u < 0 || u > 1 || v < -0.02 || v > 1.02){ f[q] = 0.04; continue; }
    if(Math.abs(u*4 - Math.round(u*4)) < 0.012 || Math.abs(v*4 - Math.round(v*4)) < 0.012) f[q] = 0.16;
    const d = Math.abs(curveAt(c, u) - v)*(wh - 2*pad); if(d < lw) f[q] = Math.max(f[q], 1 - 0.5*d/lw);
  }
  return { r: f, g: f, b: f };
}
export function evalAthanor(graph, ww, wh, ctx, deps = {}){
  const nodes = athanorNodes(graph);
  const surface = Object.values(nodes).find(n => n.name === 'surface');
  if(!surface && !ctx.all) return null;
  const v2 = athanorVersion(graph) >= 2, v3 = athanorVersion(graph) >= 3;
  // the Surface's SIZE (Filter Forge's global Size): every distance in the graph is measured against it (100: as it always was)
  const sizeK = surface ? Math.max(0.25, Math.min(4, (parseFloat((surface.data || {}).size) || 100)/100)) : 1;
  const ctxSig = JSON.stringify([ww, wh, ctx.seed, ctx.knobs, ctx.tints, ctx.light, ctx.lightTilt, ctx.scale, ctx.mat || null, ctx.glow || null, ctx.accents || null, ctx.base || null, ctx.text || null, ctx.env || null, sizeK]);
  // a node's upstream, as a signature (loops cut)
  const sigs = new Map(), sigBusy = new Set();
  const sigOf = id => {
    if(sigs.has(id)) return sigs.get(id);
    if(sigBusy.has(id)) return 'loop';
    const n = nodes[id]; if(!n) return '-';
    sigBusy.add(id);
    const ins = Object.keys(n.inputs || {}).sort().map(k => k + '<' + ((n.inputs[k].connections || []).map(c => sigOf(String(c.node)) + '.' + c.input).join(',')));
    sigBusy.delete(id);
    const s = n.name + JSON.stringify(athanorWork(n.data)) + '[' + ins.join(';') + ']#' + id;
    sigs.set(id, s); return s;
  };
  const N = ww*wh, unit = Math.min(ww, wh)*sizeK;
  const memo = new Map(), busy = new Set();
  const flat = v => new Float32Array(N).fill(v);
  const lum = img => { const f = new Float32Array(N); for(let i = 0; i < N; i++) f[i] = 0.299*img.r[i] + 0.587*img.g[i] + 0.114*img.b[i]; return f; };
  const isImg = v => v && typeof v === 'object' && v.r instanceof Float32Array;
  // (a CANVAS — what a painting part hands on in a canvas pass — is read back at the grid's size, so
  // every part can take one: before, a Mix between Paint Swipes and the Light Engine got nothing)
  const isCv = v => !!(v && typeof v === 'object' && typeof v.getContext === 'function');
  // A CURVE (Filter Forge's curve components): a shape from 0 to 1, { curve: 257 samples }. Wired where a map
  // is wanted it is laid across the page left to right; where a number is wanted, its average.
  const isCurve = v => !!(v && typeof v === 'object' && v.curve instanceof Float32Array);
  const curveField = c => { const f = new Float32Array(N); for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) f[y*ww + x] = curveAt(c, ww > 1 ? x/(ww - 1) : 0); return f; };
  const asField = (v, d = 0) => v == null ? null : typeof v === 'number' ? flat(v) : v instanceof Float32Array ? v
    : isImg(v) ? lum(v) : isCv(v) ? lum(readCanvas(v)) : Array.isArray(v) ? flat(0.299*v[0] + 0.587*v[1] + 0.114*v[2]) : isCurve(v) ? curveField(v) : flat(d);
  const asImage = v => v == null ? null : isImg(v) ? v : v instanceof Float32Array ? { r: v, g: v, b: v } : isCv(v) ? readCanvas(v) : isCurve(v) ? (f => ({ r: f, g: f, b: f }))(curveField(v))
    : Array.isArray(v) ? { r: flat(v[0]), g: flat(v[1]), b: flat(v[2]) } : typeof v === 'number' ? { r: flat(v), g: flat(v), b: flat(v) } : null;
  const asColour = (v, d) => Array.isArray(v) ? v : v == null ? d : d;
  const hexCol = hex => { const c = parseHex(hex || '#808080'); return [c.r/255, c.g/255, c.b/255]; };
  const P = (n, k, d) => { const v = (n.data || {})[k]; return v === undefined || v === '' ? d : v; };
  // a param bound to a slider or the dial ('@k2', '@k2[10,700]', '@dial', '@tilt')
  const bound = (n, k, s, d) => {
    const m = /^@(k[1-6]|dial|tilt)(?:\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\])?$/.exec(s.trim()); if(!m) return d;
    const r = m[2] != null ? [+m[2], +m[3]] : null;
    if(m[1] === 'dial'){ const deg = ((ctx.light ?? 315) % 360 + 360) % 360; return r ? r[0] + (r[1] - r[0])*deg/360 : deg; }
    if(m[1] === 'tilt'){ const t = ctx.lightTilt ?? 100; return r ? r[0] + (r[1] - r[0])*t/130 : t; }
    const t = Math.max(0, Math.min(100, +((ctx.knobs || [])[+m[1].slice(1) - 1] ?? 50)))/100, R = r || stepRange(n.name, k) || [0, 100];
    return R[0] + (R[1] - R[0])*t;
  };
  // a param: WIRED (a value on its ⚙ port, across the param's range), BOUND ('@k2'), or as set;
  // always kept inside its range — a graph from anywhere can't ask a step for a billion marks
  const num = (n, k, d) => {
    const R = stepRange(n.name, k), port = paramPort(n.name, k);
    let v;
    if(port && (((n.inputs || {})['input_' + port] || {}).connections || []).length){
      const w = input(n, port), t = typeof w === 'number' ? w : w instanceof Float32Array ? mean(w) : Array.isArray(w) ? 0.299*w[0] + 0.587*w[1] + 0.114*w[2] : isImg(w) ? mean(lum(w)) : isCurve(w) ? mean(w.curve) : null;
      // a wired param sweeps its whole range, or the part of it set by hand ('~key': 'lo,hi')
      const own = /^\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/.exec(String(P(n, '~' + k, '')));
      const W = own && R ? [Math.max(R[0], Math.min(R[1], +own[1])), Math.max(R[0], Math.min(R[1], +own[2]))] : R;
      if(t != null && W) v = W[0] + (W[1] - W[0])*Math.max(0, Math.min(1, t));
    }
    if(v === undefined){ v = P(n, k, d); if(typeof v === 'string' && v[0] === '@') v = bound(n, k, v, d); v = parseFloat(v); }
    if(isNaN(v) || !isFinite(v)) return d;
    return R ? Math.max(R[0], Math.min(R[1], v)) : v;
  };
  // Filter Forge's stand-in for missing data (its "!" in a red circle): red and pale stripes round a ring
  let standInPic = null;
  const standIn = () => standInPic || (standInPic = (() => { const r = new Float32Array(N), g = new Float32Array(N), b = new Float32Array(N), cx = ww/2, cy = wh/2, R = Math.min(ww, wh)*0.3;
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, d = Math.abs(Math.hypot(x - cx, y - cy) - R) < R*0.12, st = ((x + y)/Math.max(4, Math.min(ww, wh)/10) | 0) % 2;
      const on = d || (Math.abs(x - cx) < R*0.09 && y > cy - R*0.55 && y < cy + R*0.2) || (Math.hypot(x - cx, y - (cy + R*0.42)) < R*0.1);
      r[q] = on ? 0.95 : st ? 0.62 : 0.32; g[q] = on ? 0.95 : st ? 0.16 : 0.08; b[q] = on ? 0.92 : st ? 0.2 : 0.1; }
    return { r, g, b }; })());
  const mean = f => { let t = 0; for(let i = 0; i < f.length; i++) t += f[i]; return f.length ? t/f.length : 0; };
  // A MAP INPUT (Filter Forge's parameter mapping): a setting with a gray map or a picture on its ⚙ port is
  // a value per point, across its range (or its own '~key' part of it); otherwise the setting as num() reads it.
  // Only in a v3 graph: before, a wired map was averaged, and an old graph must draw as it always did.
  const map = (n, k, d) => {
    const port = v3 ? paramPort(n.name, k) : 0;
    if(port && (((n.inputs || {})['input_' + port] || {}).connections || []).length){
      const w = input(n, port);
      if(w instanceof Float32Array || isImg(w) || isCv(w)){
        const f = asField(w), R = stepRange(n.name, k) || [0, 100];
        const own = /^\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/.exec(String(P(n, '~' + k, '')));
        const W = own ? [Math.max(R[0], Math.min(R[1], +own[1])), Math.max(R[0], Math.min(R[1], +own[2]))] : R;
        const o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = W[0] + (W[1] - W[0])*Math.max(0, Math.min(1, f[i]));
        return o;
      }
    }
    return num(n, k, d);
  };
  // a mapped setting at one point (a number, or one value of a map)
  const at = (m, i) => typeof m === 'number' ? m : m[i];
  // the value arriving at a node's j-th input (1-based), or undefined
  const input = (n, j) => {
    const c = ((n.inputs || {})['input_' + j] || {}).connections || [];
    // an empty REQUIRED input, in the step previews only: a warning pattern stands in, so the part still shows its work
    if(!c.length) return ctx.all && ((STEPS[n.name] || {}).required || []).includes(j) ? standIn() : undefined;
    const outs = evalNode(String(c[0].node)), k = parseInt(String(c[0].input).replace('output_', ''), 10) - 1;
    return outs ? outs[k] : undefined;
  };
  const evalNode = id => {
    if(memo.has(id)) return memo.get(id);
    if(busy.has(id)) return null;                       // a loop: cut it
    const n = nodes[id]; if(!n) return null;
    busy.add(id);
    let out = null;
    const key = v2 && !ctx.canvas ? fnv(sigOf(id)) + ':' + sigOf(id).length + ':' + ctxSig + (v3 ? ':v3' : '') + (ctx.all ? ':all' : '') : null;   // (a preview may hold a stand-in: never handed to the real thing)
    const kept = key && ATHANOR_KEPT.get(key);
    if(kept){ ATHANOR_KEPT.delete(key); ATHANOR_KEPT.set(key, kept); athanorHits++; out = kept.outs; }
    else {
      // version 2: the node's own randomness, from the seed and its id
      // (a part's own VARIATION, Filter Forge's local Variation, turns its draw without moving the page's seed; 0 is as before)
      const vr = Math.round(+((n.data || {}).variation) || 0);
      try { out = v2 ? withSeed(fnv((ctx.seed >>> 0) + ':' + id + (vr ? '~' + vr : '')), () => RUN(n)) : RUN(n); } catch(e){ out = null; }
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
  // MARKS: strokes drawn on a canvas the grid's size, over a grey field (or a
  // flat grey), read back as a field; sizes in canonical pixels (px)
  const div = ctx.div > 0 ? ctx.div : 1, S = scaleNow();
  const px = v => cpx(v)/div*sizeK, carea = ww*wh*div*div/(S*S)/(sizeK*sizeK);
  const marks = (base, fill, draw) => {
    const c = document.createElement('canvas'); c.width = ww; c.height = wh;
    const x = c.getContext('2d', { willReadFrequently: true });
    if(base){ const im = x.createImageData(ww, wh), d = im.data;
      for(let i = 0, q = 0; i < N; i++, q += 4){ const g = Math.max(0, Math.min(255, base[i]*255)); d[q] = d[q+1] = d[q+2] = g; d[q+3] = 255; }
      x.putImageData(im, 0, 0); }
    else { const g = Math.round(fill*255); x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(0, 0, ww, wh); }
    draw(x);
    const d = x.getImageData(0, 0, ww, wh).data, o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = (0.299*d[i*4] + 0.587*d[i*4+1] + 0.114*d[i*4+2])/255;
    return o;
  };
  const E = { ww, wh, N, unit, ctx, deps, input, num, map, at, P, field, flat, asField, asImage, asColour, isCurve, hexCol, boxBlur, readCanvas, lightOf, isImg, lum, marks, px, carea, canvasPass: !!ctx.canvas };
  const RUN = n => { const step = STEPS[n.name]; if(!step) return null;
    // a canvas pass: a part that paints, paints; the Surface hands on what it is given
    if(ctx.canvas){ if(step.paint) return step.paint(E, n); if(n.name === 'surface') return [input(n, 1)]; }
    return step.run(E, n); };
  if(ctx.all){
    // every node's first output, as a picture (the step previews)
    const out = new Map();
    for(const id of Object.keys(nodes).sort((a, b) => +a - +b)){ const r = evalNode(id); const v = r && r[0];
      // (a curve previews as its graph: a line on dark, the way a curve editor shows it)
      out.set(id, v == null ? null : isCurve(v) ? curvePlot(v, ww, wh) : asImage(v)); }
    return out;
  }
  const res = evalNode(String(surface.id));
  if(ctx.canvas) return res && res[0] && typeof res[0].getContext === 'function' ? res[0] : null;
  return res && res[0] ? asImage(res[0]) : null;
}

// ---- starter graphs: a few to begin from (Material Maker's and Blender's
// way: a working graph to take apart, rather than an empty page) ----
// each: nodes [type, data, x, y] and wires [from, output, to, input] (1-based)
// TEACH: what each shows, in a few lines (the Athanor shows it when the graph is opened)
export const ATHANOR_STARTERS = {
  agate: { label: 'Agate', teach: 'Banded stone. A Value Noise is turned up by a Knob (Turbulence) with Math, and that bends a set of Waves, so the stripes wander like agate. Levels sharpens the bands, and a Color Ramp colors them between your two Hues. Try: turn the Turbulence knob, then change the Waves\' Frequency.', nodes: [
      ['noise', { scale: 14, octaves: 6 }, 40, 60], ['knob', { slot: '1', name: 'Turbulence', def: 85 }, 40, 260],
      ['math', { op: 'multiply' }, 280, 120], ['waves', { freq: 4, angle: 30 }, 500, 120], ['levels', { lo: 0, hi: 100, gamma: 78 }, 720, 120],
      ['hue', { slot: '1', name: 'Stone Hue' }, 720, 320], ['hue', { slot: '2', name: 'Vein Hue' }, 720, 440],
      ['ramp', { mid: 70 }, 960, 160], ['surface', { name: 'Agate', ground: 'colour' }, 1200, 160]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1], [4, 1, 5, 1], [5, 1, 8, 1], [7, 1, 8, 2], [6, 1, 8, 3], [8, 1, 9, 1]] },
  leaded: { label: 'Leaded Window', teach: 'A leaded window. Cells gives three maps: the distance to each cell\'s center, the edges between cells, and a number for each cell. The edges go through Threshold and Invert to become the lead; the cell numbers go through a Color Ramp to color the glass. Blend lays the lead over the glass, and the lead also goes into the Surface\'s Height, so the dial lights it as if raised. Try: change Cells\' Scale and Jitter.', nodes: [
      ['cells', { scale: 70, jitter: 85 }, 40, 80], ['knob', { slot: '1', name: 'Leading', def: 60 }, 40, 300], ['math', { op: 'multiply' }, 280, 60],
      ['threshold', { at: 45, soft: 8 }, 500, 40], ['invert', {}, 720, 40],
      ['hue', { slot: '1', name: 'Glass Hue' }, 300, 300], ['hue', { slot: '2', name: 'Second Glass Hue' }, 300, 420],
      ['ramp', { mid: 50 }, 540, 260], ['blend', { mode: 'multiply', opacity: 100 }, 940, 140], ['surface', { name: 'Leaded Window', ground: 'colour' }, 1180, 140]],
    wires: [[1, 2, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1], [4, 1, 5, 1], [1, 3, 8, 1], [6, 1, 8, 2], [7, 1, 8, 3], [8, 1, 9, 1], [5, 1, 9, 2], [9, 1, 10, 1], [4, 1, 10, 2]] },
  terrain: { label: 'Lit Terrain', teach: 'Lit hills. One Value Noise is used twice: a Color Ramp colors it between two Hues for the picture, and a Knob scales it for the Surface\'s Height, which the dial lights. Try: turn the light dial on the page and watch the shadows move, then raise the Relief knob.', nodes: [
      ['noise', { scale: 18, octaves: 6 }, 40, 80], ['knob', { slot: '1', name: 'Relief', def: 60 }, 40, 280], ['math', { op: 'multiply' }, 280, 220],
      ['hue', { slot: '1', name: 'High Hue' }, 280, 20], ['hue', { slot: '2', name: 'Low Hue' }, 280, 120],
      ['ramp', { mid: 45 }, 520, 60], ['surface', { name: 'Lit Terrain', ground: 'colour' }, 760, 120]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [1, 1, 6, 1], [5, 1, 6, 2], [4, 1, 6, 3], [6, 1, 7, 1], [3, 1, 7, 2]] },
  woven: { label: 'Woven Waves', teach: 'Woven cloth. Two Waves, one across and one down, are combined with Math (max) to make threads. A Knob thins them, Levels hardens them, and Tint colors them between your two Hues. The threads also go into the Surface\'s Height, so the dial lights the weave. Try: change one Waves\' Angle.', nodes: [
      ['waves', { freq: 14, angle: 0 }, 40, 40], ['waves', { freq: 14, angle: 90 }, 40, 220], ['math', { op: 'max' }, 280, 120],
      ['knob', { slot: '1', name: 'Thread', def: 80 }, 280, 300], ['math', { op: 'multiply' }, 500, 160],
      ['levels', { lo: 20, hi: 100, gamma: 50 }, 720, 120], ['tint', {}, 940, 120], ['surface', { name: 'Woven Waves', ground: 'colour' }, 1160, 120],
      ['hue', { slot: '1', name: 'Thread Hue' }, 720, 300], ['hue', { slot: '2', name: 'Shadow Hue' }, 720, 420]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [3, 1, 5, 1], [4, 1, 5, 2], [5, 1, 6, 1], [6, 1, 7, 1], [9, 1, 7, 2], [10, 1, 7, 3], [7, 1, 8, 1], [6, 1, 8, 2]] },
  bloom: { label: 'Reaction Bloom', teach: 'Soft coral. Reaction–Diffusion (old) grows a pattern; Blur softens a copy of it; Mix blends the two, by an amount a Knob (Bloom) sets. A Color Ramp colors the result between two Hues, and the mix also gives the Surface its Height. Try: change the Reaction–Diffusion Pattern.', nodes: [
      ['turing', { pattern: 'coral', scale: 100 }, 40, 80], ['blur', { radius: 10 }, 300, 160], ['knob', { slot: '1', name: 'Bloom', def: 40 }, 300, 300],
      ['mix', { t: 50 }, 520, 80],
      ['hue', { slot: '1', name: 'Light Hue' }, 520, 300], ['hue', { slot: '2', name: 'Dark Hue' }, 520, 420],
      ['ramp', { mid: 50 }, 760, 160], ['surface', { name: 'Reaction Bloom', ground: 'colour' }, 1000, 160]],
    wires: [[1, 1, 2, 1], [1, 1, 4, 1], [2, 1, 4, 2], [3, 1, 4, 3], [4, 1, 7, 1], [6, 1, 7, 2], [5, 1, 7, 3], [7, 1, 8, 1], [4, 1, 8, 2]] },
  oil: { label: 'Oil on Canvas', teach: 'An oil painting of any texture, one the dial can light. It is a tutorial in putting parts together: each part does one job and hands it to the next. Texture from the Menu makes a picture; Oil Paint repaints it in brushstrokes and gives a second output, the paint\'s heights. Mix lays a little Canvas Weave into those heights, so the cloth shows where the paint is thin. The Light Engine takes the painting and its heights and lights them by the dial, and a Knob (Impasto) sets how thick the paint stands. Try: turn the light dial on the page, then choose another texture in Texture from the Menu.', nodes: [
      ['texture', { type: 'stainedglass', p1: 100, p2: 100, p3: 50 }, 40, 80], ['oilpaint', { amount: 100, size: 100, length: 100, detail: 50, vary: 50 }, 300, 60],
      ['canvasweave', { pitch: 100 }, 300, 340], ['mix', { t: 15 }, 560, 260], ['knob', { slot: '1', name: 'Impasto', def: 55 }, 560, 440],
      ['material', { relief: 22, '~relief': '0,45', gloss: 25, shine: 35, shadow: 55, occlusion: 35, ambient: 40 }, 800, 100], ['surface', { name: 'Oil on Canvas', ground: 'colour' }, 1060, 120]],
    wires: [[1, 1, 2, 1], [2, 1, 6, 1], [2, 2, 4, 1], [3, 1, 4, 2], [4, 1, 6, 2], [5, 1, 6, paramPort('material', 'relief')], [6, 1, 7, 1]] },
  // the poem as an input (The Poem): rings spreading from the words, quiet where the words are
  ripples: { label: 'Ripples from the Words', teach: 'A surface that knows where your poem is. The Poem hands on a Distance map: 0 at the words, rising to 1 far from them. A Value Noise warps it a little, and Contour Lines draws a line at every step of it, so rings spread out from the text like ripples from a stone. Levels turns the Distance into a mask that is dark only right around the words, and Math multiplies the rings by it, so they fade out close to the text and it stays clear. Try: change The Poem\'s Reach, or type more lines and watch the rings move.', nodes: [
      ['poem', { padding: 30, softness: 0, reach: 70 }, 40, 80], ['noise', { scale: 8, octaves: 3 }, 40, 320],
      ['warp', { amount: 40 }, 300, 160], ['contours', { levels: 22, weight: 280, index: 4, strength: 100 }, 520, 160],
      ['math', { op: 'multiply' }, 740, 160], ['hue', { slot: '1', name: 'Ring Hue' }, 740, 340], ['hue', { slot: '2', name: 'Ground Hue' }, 740, 460],
      ['ramp', { mid: 50 }, 960, 200], ['surface', { name: 'Ripples from the Words', ground: 'colour' }, 1180, 200],
      ['levels', { lo: 4, hi: 16, gamma: 50 }, 520, 360]],
    wires: [[1, 2, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1], [4, 1, 5, 1], [1, 2, 10, 1], [10, 1, 5, 2], [5, 1, 8, 1], [7, 1, 8, 2], [6, 1, 8, 3], [8, 1, 9, 1]] },
};
/** A starter as a graph (Drawflow's export form, without node faces). */
export function athanorStarter(name){
  const S = ATHANOR_STARTERS[name] || ATHANOR_STUDIES[name] || TEXTURE_CHAINS[name]; if(!S) return null;
  const data = {};
  S.nodes.forEach(([type, d, x, y], i) => { const id = i + 1;
    data[id] = { id, name: type, data: { ...d }, class: '', html: '', typenode: false, inputs: {}, outputs: {}, pos_x: x, pos_y: y }; });
  for(const [a, o, b, j] of S.wires){
    ((data[b].inputs['input_' + j] ||= { connections: [] }).connections).push({ node: String(a), input: 'output_' + o });
    ((data[a].outputs['output_' + o] ||= { connections: [] }).connections).push({ node: String(b), output: 'input_' + j });
  }
  layoutAthanor(data);
  // (a texture's own chain stays v2: its picture never changes; a starter to learn from is the newest)
  return { v: ATHANOR_STARTERS[name] || ATHANOR_STUDIES[name] ? ATHANOR_VERSION : 2, drawflow: { Home: { data } } };
}
/**
 * Lays a graph out to read left to right: each node in the column of its
 * longest path from an input, stacked down the column with room for its
 * rows and its step preview (the editor's node faces: forge.js). Used for
 * the starters and templates, so they never overlap.
 */
export const ATHANOR_NODE = { w: 200, colGap: 44, title: 26, row: 22, extra: 26, preview: 190, pad: 18, gap: 28 };
export function athanorNodeHeight(name){
  const S = STEPS[name]; if(!S) return 120;
  const rows = Math.max(S.ins.length, S.outs.length), extras = S.params.length - S.paramPorts.length;
  const preview = (S.cat === 'Inputs' || S.cat === 'Output') ? 0 : ATHANOR_NODE.preview;
  return ATHANOR_NODE.title + rows*ATHANOR_NODE.row + extras*ATHANOR_NODE.extra + preview + ATHANOR_NODE.pad;
}
export function layoutAthanor(data){
  const ids = Object.keys(data), depth = {}, busy = new Set();
  const d = id => { if(depth[id] !== undefined) return depth[id]; if(busy.has(id)) return 0; busy.add(id);
    let m = 0; for(const p of Object.values(data[id].inputs || {})) for(const c of p.connections || []) if(data[c.node]) m = Math.max(m, d(String(c.node)) + 1);
    busy.delete(id); return depth[id] = m; };
  ids.forEach(d);
  const cols = {};
  // within a column, nodes in the order of the first node they feed (wires cross less)
  const feedsY = id => { let best = Infinity; for(const p of Object.values(data[id].outputs || {})) for(const c of p.connections || []) best = Math.min(best, +c.node); return best; };
  ids.sort((a, b) => (depth[a] - depth[b]) || (feedsY(a) - feedsY(b)) || (+a - +b)).forEach(id => (cols[depth[id]] ||= []).push(id));
  for(const [c, list] of Object.entries(cols)){
    let y = 30;
    for(const id of list){ data[id].pos_x = 30 + +c*(ATHANOR_NODE.w + ATHANOR_NODE.colGap); data[id].pos_y = y; y += athanorNodeHeight(data[id].name) + ATHANOR_NODE.gap; }
  }
  return data;
}

/**
 * A graph from anywhere (a pasted look, an old save, a hand-edited JSON),
 * checked before it is used: known parts only, plain settings, wires between
 * real ports, within the limits. Returns { ok, graph, problems } — the graph
 * cleaned (what can be kept is kept), or ok:false when nothing safe remains.
 */
export const ATHANOR_MAX_JSON = 256*1024;
export function validateGraph(json){
  const problems = [];
  if(json == null || json === '') return { ok: true, graph: null, problems };
  const text = typeof json === 'string' ? json : (() => { try { return JSON.stringify(json); } catch(e){ return ''; } })();
  if(text.length > ATHANOR_MAX_JSON) return { ok: false, graph: null, problems: [`the graph is too large (${Math.round(text.length/1024)} KB; at most ${ATHANOR_MAX_JSON/1024} KB)`] };
  let g; try { g = JSON.parse(text); } catch(e){ return { ok: false, graph: null, problems: ['the graph is not readable JSON'] }; }
  const data = (((g || {}).drawflow || {}).Home || {}).data;
  if(!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, graph: null, problems: ['it is not an Athanor graph'] };
  const ids = Object.keys(data);
  if(ids.length > ATHANOR_LIMITS.nodes*2) return { ok: false, graph: null, problems: [`it has ${ids.length} nodes (at most ${ATHANOR_LIMITS.nodes})`] };
  const clean = {};
  for(const id of ids){
    const n = data[id];
    if(!n || typeof n !== 'object' || !STEPS[n.name]){ problems.push(`an unknown part (${String(n && n.name).slice(0, 24)}) was left out`); continue; }
    const d = {};
    for(const [k, v] of Object.entries(n.data || {})){
      if(typeof v === 'number' && isFinite(v)) d[k] = v;
      else if(typeof v === 'string' && v.length <= 64) d[k] = v;
      else if(typeof v === 'boolean') d[k] = v;
      else problems.push(`a setting of ${n.name} was not plain and was left out`);
    }
    clean[id] = { id: isFinite(+n.id) ? +n.id : +id, name: n.name, data: d, class: String(n.class || '').slice(0, 64), html: '', typenode: false,
      inputs: {}, outputs: {}, pos_x: isFinite(+n.pos_x) ? +n.pos_x : 0, pos_y: isFinite(+n.pos_y) ? +n.pos_y : 0, _in: n.inputs, _out: n.outputs };
  }
  // wires only between parts that exist, on ports they have
  for(const n of Object.values(clean)){
    const S = STEPS[n.name];
    for(const [k, v] of Object.entries(n._in || {})){ const j = parseInt(String(k).replace('input_', ''), 10); if(!(j >= 1 && j <= S.ins.length)) continue;
      n.inputs['input_' + j] = { connections: ((v || {}).connections || []).filter(c => c && clean[String(c.node)] && /^output_\d+$/.test(c.input || '')
        && parseInt(c.input.slice(7), 10) <= STEPS[clean[String(c.node)].name].outs.length).map(c => ({ node: String(c.node), input: c.input })) }; }
    for(const [k, v] of Object.entries(n._out || {})){ const j = parseInt(String(k).replace('output_', ''), 10); if(!(j >= 1 && j <= S.outs.length)) continue;
      n.outputs['output_' + j] = { connections: ((v || {}).connections || []).filter(c => c && clean[String(c.node)] && /^input_\d+$/.test(c.output || '')
        && parseInt(c.output.slice(6), 10) <= STEPS[clean[String(c.node)].name].ins.length).map(c => ({ node: String(c.node), output: c.output })) }; }
    delete n._in; delete n._out;
  }
  const out = { v: Math.max(1, parseInt(g.v, 10) || 1), drawflow: { Home: { data: clean } } };
  if(Object.keys(clean).length > ATHANOR_LIMITS.nodes) problems.push(`it has more than ${ATHANOR_LIMITS.nodes} nodes, so it will not be drawn`);
  return { ok: true, graph: out, problems };
}
