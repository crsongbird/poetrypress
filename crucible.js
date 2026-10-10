/**
 * crucible.js — THE CRUCIBLE's evaluator: a graph from the node editor
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
import { makeNoiseGrid, sampleNoiseGrid, lightHeights, parseHex, canonDiv } from './texCore.js';
import { drawStitch, pathFromPoints, roundRectPoints } from './stitches.js';

/** The graph's nodes, by id ({} if it can't be read). */
export function crucibleNodes(graph){
  try { const g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {}); return ((g.drawflow || {}).Home || {}).data || {}; }
  catch(e){ return {}; }
}
/** The sliders a graph offers: its Knob nodes, by slot (1–6). */
export function crucibleKnobs(graph){
  const out = [];
  for(const n of Object.values(crucibleNodes(graph))){
    if(n.name !== 'knob') continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(6, parseInt(d.slot, 10) || 1));
    if(!out.find(k => k.slot === slot)) out.push({ slot, label: String(d.name || 'Knob ' + slot).slice(0, 24), def: Math.max(0, Math.min(100, +d.def || 50)) });
  }
  return out.sort((a, b) => a.slot - b.slot);
}
/** The hues a graph uses: its Hue nodes, by slot (1–2). */
export function crucibleHues(graph){
  const out = [];
  for(const n of Object.values(crucibleNodes(graph))){
    if(n.name !== 'hue') continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(2, parseInt(d.slot, 10) || 1));
    if(!out.find(h => h.slot === slot)) out.push({ slot, label: String(d.name || (slot === 1 ? 'Light Hue' : 'Dark Hue')).slice(0, 24) });
  }
  return out.sort((a, b) => a.slot - b.slot);
}
/** The Surface node's name (what the texture is called in the list). */
export function crucibleName(graph){
  const s = Object.values(crucibleNodes(graph)).find(n => n.name === 'surface');
  return s ? String((s.data || {}).name || 'My Surface').slice(0, 32) : '';
}
/** A short hash of the graph, for the texture cache (positions don't count). */
export function crucibleHash(graph){
  const nodes = crucibleNodes(graph);
  const sig = JSON.stringify(Object.keys(nodes).sort().map(id => { const n = nodes[id];
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
export function evalCrucible(graph, ww, wh, ctx, deps = {}){
  const nodes = crucibleNodes(graph);
  const surface = Object.values(nodes).find(n => n.name === 'surface');
  if(!surface) return null;
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
    try { out = RUN(n); } catch(e){ out = null; }
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
        if(type === 'crucible') return null;              // never itself
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
