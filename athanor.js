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
 */
import { lightHeights, parseHex, withSeed, cpx, scaleNow } from './texCore.js';
import { STEPS, stepRange } from './steps.js';
import { TEXTURE_CHAINS } from './chains.js';

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
/** The sliders a graph offers: its Knob nodes, by slot (1–6). */
export function athanorKnobs(graph){
  const out = [];
  for(const n of Object.values(athanorNodes(graph))){
    if(n.name !== 'knob') continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(6, parseInt(d.slot, 10) || 1));
    if(!out.find(k => k.slot === slot)) out.push({ slot, label: String(d.name || 'Knob ' + slot).slice(0, 24), def: Math.max(0, Math.min(100, +d.def || 50)) });
  }
  // a param bound to a slider ('@k3') offers that slider, named after the param
  for(const n of Object.values(athanorNodes(graph))) for(const [k, v] of Object.entries(n.data || {})){
    const m = typeof v === 'string' && /^@k([1-6])/.exec(v); if(!m) continue;
    const slot = +m[1]; if(out.find(q => q.slot === slot)) continue;
    const part = ((STEPS[n.name] || {}).params || []).find(q => q[0] === k);
    out.push({ slot, label: String(part ? part[1] : 'Knob ' + slot).slice(0, 24), def: 50 });
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
  const ctxSig = JSON.stringify([ww, wh, ctx.seed, ctx.knobs, ctx.tints, ctx.light, ctx.lightTilt, ctx.scale, ctx.mat || null, ctx.glow || null]);
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
  // a param bound to a slider or the dial ('@k2', '@k2[10,700]', '@dial', '@tilt')
  const bound = (n, k, s, d) => {
    const m = /^@(k[1-6]|dial|tilt)(?:\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\])?$/.exec(s.trim()); if(!m) return d;
    const r = m[2] != null ? [+m[2], +m[3]] : null;
    if(m[1] === 'dial'){ const deg = ((ctx.light ?? 315) % 360 + 360) % 360; return r ? r[0] + (r[1] - r[0])*deg/360 : deg; }
    if(m[1] === 'tilt'){ const t = ctx.lightTilt ?? 100; return r ? r[0] + (r[1] - r[0])*t/130 : t; }
    const t = Math.max(0, Math.min(100, +((ctx.knobs || [])[+m[1].slice(1) - 1] ?? 50)))/100, R = r || stepRange(n.name, k) || [0, 100];
    return R[0] + (R[1] - R[0])*t;
  };
  const num = (n, k, d) => { let v = P(n, k, d); if(typeof v === 'string' && v[0] === '@') v = bound(n, k, v, d); v = parseFloat(v); return isNaN(v) ? d : v; };
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
  // MARKS: strokes drawn on a canvas the grid's size, over a grey field (or a
  // flat grey), read back as a field; sizes in canonical pixels (px)
  const div = ctx.div > 0 ? ctx.div : 1, S = scaleNow();
  const px = v => cpx(v)/div, carea = ww*wh*div*div/(S*S);
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
  const E = { ww, wh, N, unit, ctx, deps, input, num, P, field, flat, asField, asImage, asColour, hexCol, boxBlur, readCanvas, lightOf, isImg, lum, marks, px, carea };
  const RUN = n => { const step = STEPS[n.name]; return step ? step.run(E, n) : null; };
  const res = evalNode(String(surface.id));
  return res && res[0] ? asImage(res[0]) : null;
}

// ---- starter graphs: a few to begin from (Material Maker's and Blender's
// way: a working graph to take apart, rather than an empty page) ----
// each: nodes [type, data, x, y] and wires [from, output, to, input] (1-based)
export const ATHANOR_STARTERS = {
  agate: { label: 'Agate', nodes: [
      ['noise', { scale: 14, octaves: 6 }, 40, 60], ['knob', { slot: '1', name: 'Turbulence', def: 85 }, 40, 260],
      ['math', { op: 'multiply' }, 280, 120], ['waves', { freq: 4, angle: 30 }, 500, 120], ['levels', { lo: 0, hi: 100, gamma: 78 }, 720, 120],
      ['hue', { slot: '1', name: 'Stone Hue' }, 720, 320], ['hue', { slot: '2', name: 'Vein Hue' }, 720, 440],
      ['ramp', { mid: 70 }, 960, 160], ['surface', { name: 'Agate', ground: 'colour' }, 1200, 160]],
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
  const S = ATHANOR_STARTERS[name] || TEXTURE_CHAINS[name]; if(!S) return null;
  const data = {};
  S.nodes.forEach(([type, d, x, y], i) => { const id = i + 1;
    data[id] = { id, name: type, data: { ...d }, class: '', html: '', typenode: false, inputs: {}, outputs: {}, pos_x: x, pos_y: y }; });
  for(const [a, o, b, j] of S.wires){
    ((data[b].inputs['input_' + j] ||= { connections: [] }).connections).push({ node: String(a), input: 'output_' + o });
    ((data[a].outputs['output_' + o] ||= { connections: [] }).connections).push({ node: String(b), output: 'input_' + j });
  }
  return { v: ATHANOR_VERSION, drawflow: { Home: { data } } };
}
