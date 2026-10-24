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
import { lightHeights, lightRig, parseHex, withSeed, cpx, scaleNow, fxaaImage } from './texCore.js';
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
// v4: more settings take a map point by point (Blur's Radius, the noises' Scale, Motion Blur, Grow & Shrink,
// Twirl, Edge Detect, Scatter's Size, the lights' Relief and the Light Engine's Gloss: each part's `maps` (steps.js),
// `name:4`); a v3 graph still reads those whole, as it did.
// v5: GROUPS and PORTS BY NAME (ROADMAP A3, A10). A group's own graph is another of the editor's modules (Drawflow's
// drawflow.<name>), and a v5 graph is saved with its ports by name ('in:field', 'set:scale', 'out:image'), so a part
// that gains a port never moves a saved wire. Neither changes what is made: a v5 graph draws as a v4 one, and every
// older graph loads (and is walked) as it always was.
export const ATHANOR_VERSION = 5;
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
export const ATHANOR_LIMITS = { nodes: 255, cost: 160, previews: 150 };   // (Ruby: 255 parts, rendered in stages (textureService); the step previews only up to 150)
export function athanorBudget(graph){
  const nodes = Object.values(athanorFlat(graph).nodes);   // (a group counts every part inside it)
  let cost = 0;
  for(const n of nodes){ const f = (STEPS[n.name] || {}).cost; cost += f ? f(n.data || {}) : 1;
    if(n.name === 'surface' && ((n.inputs || {}).input_2 || {}).connections && n.inputs.input_2.connections.length) cost += 14; }
  const tooMany = nodes.length > ATHANOR_LIMITS.nodes;
  return { nodes: nodes.length, cost: Math.round(cost), tooMany, scale: tooMany ? 1 : Math.min(3, Math.max(1, Math.sqrt(cost/ATHANOR_LIMITS.cost))) };
}

/** The graph's nodes (its top level, Home), by id, with their ports numbered as the editor draws them ({} if it can't be read). */
export function athanorNodes(graph){
  try { let g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {});
    if(athanorIsNamed(g)) g = athanorNumbered(g);
    return ((g.drawflow || {}).Home || {}).data || {}; }
  catch(e){ return {}; }
}

// ---- PORTS BY NAME (A10) ----
// Drawflow knows a node's ports only by their place ('input_3'); a part that gained an input moved every saved ⚙ wire
// after it. Saved, a port is its meaning: a data input `in:<its name>`, a ⚙ port `set:<the setting's key>`, an output
// `out:<its name>`; a Group's are its insides' (`in:<the inner part's id>`, `out:<1…>`). Translated to places only
// for the editor and the walk (athanorNumbered), and back when saved (athanorNamed).
const PORT_PLACE = /^(input|output)_\d+$/;
const portSlug = x => String(x).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'port';
const PORT_NAMES = new Map();
/** A part's ports by name, in its ports' order: { ins, outs } (null for an unknown part). */
export function stepPortNames(name){
  if(PORT_NAMES.has(name)) return PORT_NAMES.get(name);
  const S = STEPS[name]; if(!S) return null;
  const dedupe = list => { const seen = {}; return list.map(x => (seen[x] = (seen[x] || 0) + 1) > 1 ? x + '-' + seen[x] : x); };
  const r = { ins: dedupe(S.ins.slice(0, S.dataIns).map(x => 'in:' + portSlug(x))).concat(S.paramPorts.map(k => 'set:' + k)),
              outs: dedupe(S.outs.map(x => 'out:' + portSlug(x))) };
  PORT_NAMES.set(name, r); return r;
}
export function athanorPortNamesReset(){ PORT_NAMES.clear(); }   // test hook: names read again (a test that gives a part another port)
/** A port's place (1-based) among a list of names, from either form ('input_3' or its name); 0 if it has none. */
const placeOf = (key, names, kind) => { const k = String(key); if(PORT_PLACE.test(k)) return k.startsWith(kind) ? +k.slice(kind.length + 1) : 0; const i = names.indexOf(k); return i + 1; };
/**
 * A GROUP's ports, from what is inside it (a module's { data }): its inputs, each Group Input and Knob inside in the
 * order they were made ({ id, name, kind }), and how many outputs it has (the last result wired to its Group Result;
 * at least one).
 */
export function groupPorts(mod){
  const data = (mod && mod.data) || {};
  const ins = Object.values(data).filter(n => n && (n.name === 'groupin' || n.name === 'knob')).sort((a, b) => (+a.id || 0) - (+b.id || 0))
    .map(n => ({ id: String(n.id), name: String((n.data || {}).name || (n.name === 'knob' ? 'Amount' : 'Input')).slice(0, 24), kind: n.name === 'knob' ? 'value' : 'field' }));
  let outs = 1; const R = Object.values(data).find(n => n && n.name === 'groupout'), rn = stepPortNames('groupout').ins;
  if(R) for(const [k, v] of Object.entries(R.inputs || {})) if(((v || {}).connections || []).length) outs = Math.max(outs, placeOf(k, rn, 'input'));
  return { ins, outs: Math.min(4, outs) };
}
/** A node's ports by name: a part's own, or a Group's from its module. */
function portsOf(n, mods){
  if(n && n.name === 'group'){ const P = groupPorts(mods[String((n.data || {}).module || '')]); return { ins: P.ins.map(m => 'in:' + m.id), outs: Array.from({ length: P.outs }, (_, k) => 'out:' + (k + 1)) }; }
  return n ? stepPortNames(n.name) : null;
}
/** Whether a graph has any port saved by name. */
export function athanorIsNamed(g){
  for(const M of Object.values((g && g.drawflow) || {})) for(const n of Object.values((M && M.data) || {})){
    if(!n) continue;
    for(const k of Object.keys(n.inputs || {})) if(!PORT_PLACE.test(k)) return true;
    for(const k of Object.keys(n.outputs || {})) if(!PORT_PLACE.test(k)) return true; }
  return false;
}
// one graph's ports, every module, turned to names (toNames) or to places; a port or wire with no counterpart is let go
function translatePorts(graph, toNames){
  const g = JSON.parse(JSON.stringify(typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {})));
  const mods = g.drawflow || {};
  // (every module's ports are read from it as it came, before any is turned)
  const ports = new Map();
  for(const [mn, M] of Object.entries(mods)) for(const [id, n] of Object.entries((M && M.data) || {})) ports.set(mn + '\u0000' + id, portsOf(n, mods));
  const key = (names, place, kind) => toNames ? names[place - 1] : kind + '_' + place;
  for(const [mn, M] of Object.entries(mods)) for(const [id, n] of Object.entries((M && M.data) || {})){
    const P = ports.get(mn + '\u0000' + id); if(!P || !n) continue;
    const of = other => ports.get(mn + '\u0000' + String(other));
    const ins = {}, outs = {};
    for(const [k, v] of Object.entries(n.inputs || {})){ const j = placeOf(k, P.ins, 'input'), name = j && key(P.ins, j, 'input'); if(!name || j > P.ins.length) continue;
      ins[name] = { connections: ((v || {}).connections || []).map(c => { const Q = c && of(c.node), o = Q && placeOf(c.input, Q.outs, 'output');
        return o && o <= Q.outs.length ? { node: String(c.node), input: key(Q.outs, o, 'output') } : null; }).filter(Boolean) }; }
    for(const [k, v] of Object.entries(n.outputs || {})){ const j = placeOf(k, P.outs, 'output'), name = j && key(P.outs, j, 'output'); if(!name || j > P.outs.length) continue;
      outs[name] = { connections: ((v || {}).connections || []).map(c => { const Q = c && of(c.node), o = Q && placeOf(c.output, Q.ins, 'input');
        return o && o <= Q.ins.length ? { node: String(c.node), output: key(Q.ins, o, 'input') } : null; }).filter(Boolean) }; }
    n.inputs = ins; n.outputs = outs;
  }
  return g;
}
/** The graph with its ports by name, as it is saved (v5). */
export function athanorNamed(graph){ return translatePorts(graph, true); }
/** The graph with its ports by place ('input_3'), as the editor draws it and the walk reads it. */
export function athanorNumbered(graph){ return translatePorts(graph, false); }

// ---- GROUPS (A3) ----
/** How deep groups may sit inside groups. */
export const ATHANOR_GROUP_DEPTH = 4;
/** How many times a loop may run (each pass counts toward the part limit). */
export const ATHANOR_LOOP_MAX = 16;
const hasGroups = g => { for(const n of Object.values((((g || {}).drawflow || {}).Home || {}).data || {})) if(n && n.name === 'group') return true; return false; };
/**
 * THE GRAPH MADE FLAT: every group replaced by the parts inside it, wired where the group was — what is wired into a
 * group's input comes out of the part inside it stands for, what reads a group's output reads what reaches its
 * result. Parts keep their ids (so their randomness: a group draws exactly what its parts drew loose); a module used
 * twice is renamed the second time ('<group id>/<id>'). A Knob inside a group, its port unwired, is still its page
 * slider (grouping changes nothing on the page); wired, the wire takes its place.
 * Returns { nodes (numbered, by id), alias (a group's id → the part its first result comes from, for its preview) }.
 */
export function athanorFlat(graph){
  let g; try { g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {}); } catch(e){ return { nodes: {}, alias: new Map() }; }
  if(!hasGroups(g)) return { nodes: athanorNodes(g), alias: new Map() };
  const mods = athanorNumbered(g).drawflow || {}, used = new Set(), alias = new Map();
  const expand = (data, prefix, stack) => {
    const out = {};
    for(const [id, n] of Object.entries(data || {})){ if(!n || (stack.length && n.name === 'surface')) continue;   // (a Surface belongs at the top)
      const nid = prefix + id;
      out[nid] = { ...n, id: nid, data: { ...(n.data || {}) }, outputs: {},
        inputs: Object.fromEntries(Object.entries(n.inputs || {}).map(([k, v]) => [k, { connections: ((v || {}).connections || []).map(c => ({ node: prefix + c.node, input: c.input })) }])) }; }
    const rewire = (from, to) => { for(const n of Object.values(out)) for(const v of Object.values(n.inputs || {}))
      v.connections = v.connections.flatMap(c => c.node !== from ? [c] : to ? [to(c)].filter(Boolean) : []); };
    for(const id of Object.keys(out)){
      const G = out[id]; if(!G || G.name !== 'group') continue;
      const mod = String((G.data || {}).module || ''), M = mods[mod];
      if(!M || mod === 'Home' || stack.includes(mod) || stack.length >= ATHANOR_GROUP_DEPTH){ delete out[id]; rewire(id, null); continue; }
      const P = groupPorts(M), reps = Math.max(1, Math.min(ATHANOR_LOOP_MAX, Math.round(+((G.data || {}).repeats) || 1)));
      // A LOOP (A4): the insides laid out once per pass, each pass's first input what the pass before gave (its first
      // result: Accumulated), its Iteration a Number (0 … 1 across the passes); the first pass is the group as it is
      let prev = null, R = null;
      for(let k = 0; k < reps; k++){
        const ip = k === 0 ? (used.has(mod) ? id + '/' : prefix) : id + '#' + k + '/'; if(k === 0) used.add(mod);
        const inner = expand(M.data, ip, stack.concat(mod));
        const redirect = (from, src) => { for(const n of Object.values(inner)) for(const v of Object.values(n.inputs || {}))
          v.connections = v.connections.flatMap(c => c.node !== from ? [c] : src ? [{ node: src.node, input: src.input }] : []); };
        P.ins.forEach((m, j) => { const I = ip + m.id; if(!inner[I]) return;
          const src = j === 0 && k > 0 ? prev : (((G.inputs || {})['input_' + (j + 1)] || {}).connections || [])[0];
          if(src){ redirect(I, src); delete inner[I]; } });
        for(const n of Object.values(inner)) if(n.name === 'loopiter') inner[n.id] = { ...n, name: 'number', data: { value: reps > 1 ? k/(reps - 1)*100 : 0 } };
        R = Object.values(inner).find(n => n.name === 'groupout');
        prev = R ? ((R.inputs.input_1 || {}).connections || [])[0] || null : null;
        Object.assign(out, inner);
        for(const n of Object.values(inner)) if(n.name === 'groupout') delete out[n.id];
      }
      delete out[id];
      rewire(id, c => { const s = R && (((R.inputs || {})['input_' + (parseInt(String(c.input).slice(7), 10) || 1)] || {}).connections || [])[0]; return s ? { node: s.node, input: s.input } : null; });
      if(R){ const s0 = ((R.inputs.input_1 || {}).connections || [])[0]; if(s0) alias.set(id, s0.node); }
    }
    return out;
  };
  return { nodes: expand((mods.Home || {}).data, '', []), alias };
}

/** The parts whose previews the editor shows (the step sheet): every module's, a group's insides too, by id. */
export function athanorStepIds(graph){
  let g; try { g = typeof graph === 'string' ? JSON.parse(graph || '{}') : (graph || {}); } catch(e){ return []; }
  const ids = new Set(); for(const M of Object.values(g.drawflow || {})) for(const id of Object.keys((M && M.data) || {})) ids.add(id);
  return [...ids].sort((a, b) => +a - +b);
}
/** The nodes whose work reaches the Surface (Filter Forge: a control that doesn't reach the Result isn't shown). */
export function athanorReach(graph){
  const nodes = athanorFlat(graph).nodes, seen = new Set(), s = Object.values(nodes).find(n => n.name === 'surface');
  const walk = id => { if(seen.has(id) || !nodes[id]) return; seen.add(id);
    for(const inp of Object.values(nodes[id].inputs || {})) for(const c of inp.connections || []) walk(String(c.node)); };
  if(s) walk(String(s.id));
  return seen;
}
/** The curves a graph offers on the page (D4): its Curve Controls that reach the Surface, by slot (1–2), each with its
 *  name and its Default points; two on one slot are one curve, the first one's name and default. */
export function athanorCurves(graph){
  const all = athanorFlat(graph).nodes, reach = athanorReach(graph), out = [];
  for(const n of Object.values(all)){ if(n.name !== 'curvectl' || !reach.has(String(n.id))) continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(2, parseInt(d.slot, 10) || 1));
    if(!out.some(c => c.slot === slot)) out.push({ slot, label: String(d.name || 'Curve').slice(0, 32), def: String(d.points || '0,0;100,100').slice(0, 200) }); }
  return out.sort((a, b) => a.slot - b.slot);
}
/** Whether a graph's Camera Dial reaches its Surface: then the page shows the camera dial for it, as for a menu
 *  texture with a camera (Ruby: on a graph from the Athanor the dial never appeared). */
export function athanorCamera(graph){
  const all = athanorFlat(graph).nodes, reach = athanorReach(graph);
  return Object.values(all).some(n => n.name === 'camdial' && reach.has(String(n.id)));
}
/** The sliders a graph offers: its Knob nodes, by slot (1–8) — those that reach the Surface by a wire, or whose
 *  slot a part on the way binds ('@k3'); a Knob left unwired offers nothing (it would move nothing). */
export function athanorKnobs(graph){
  const out = [], reach = athanorReach(graph), all = athanorFlat(graph).nodes;
  const boundSlots = new Set(); for(const id of reach) for(const v of Object.values((all[id] || {}).data || {})){ const m = typeof v === 'string' && /^@k(10|[1-9])/.exec(v); if(m) boundSlots.add(+m[1]); }
  for(const n of Object.values(all)){
    if(n.name !== 'knob') continue;
    if(!reach.has(String(n.id)) && !boundSlots.has(Math.max(1, Math.min(8, parseInt((n.data || {}).slot, 10) || 1)))) continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(8, parseInt(d.slot, 10) || 1));
    if(!out.find(k => k.slot === slot)) out.push({ slot, label: String(d.name || 'Knob ' + slot).slice(0, 24), def: Math.max(0, Math.min(100, d.def === '' || d.def == null || isNaN(+d.def) ? 50 : +d.def)),   // (a Default of 0 is 0)
      // its kind (D1): a plain slider, steps (marks, named or numbered), an angle, or a switch
      kind: ['steps', 'angle', 'switch'].includes(d.kind) ? d.kind : 'slider', steps: Math.max(2, Math.min(12, Math.round(+d.steps || 3))),
      names: String(d.names || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 12).map(x => x.slice(0, 18)) });
  }
  // a param bound to a slider ('@k3') offers that slider, named after the param
  for(const n of Object.values(all)) if(reach.has(String(n.id))) for(const [k, v] of Object.entries(n.data || {})){
    const m = typeof v === 'string' && /^@k(10|[1-9])/.exec(v); if(!m) continue;
    const slot = +m[1]; if(out.find(q => q.slot === slot)) continue;
    const part = ((STEPS[n.name] || {}).params || []).find(q => q[0] === k);
    out.push({ slot, label: String(part ? part[1] : 'Knob ' + slot).slice(0, 24), def: 50 });
  }
  return out.sort((a, b) => a.slot - b.slot);
}
/** The hues a graph uses: its Hue nodes, by slot (1–2). */
export function athanorHues(graph){
  const out = [], reach = athanorReach(graph);
  for(const n of Object.values(athanorFlat(graph).nodes)){
    if(n.name !== 'hue' || !reach.has(String(n.id))) continue;
    const d = n.data || {}, slot = Math.max(1, Math.min(6, parseInt(d.slot, 10) || 1));   // (up to six: ROADMAP L0)
    if(!out.find(h => h.slot === slot)) out.push({ slot, label: String(d.name || (slot === 1 ? 'Light Hue' : slot === 2 ? 'Dark Hue' : 'Hue ' + slot)).slice(0, 24) });
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
  const nodes = athanorFlat(graph).nodes;
  const sig = athanorVersion(graph) + JSON.stringify(Object.keys(nodes).sort().map(id => { const n = nodes[id];
    return [id, n.name, athanorWork(n.data), Object.values(n.inputs || {}).map(i => (i.connections || []).map(c => c.node + ':' + c.input))]; }));
  let h = 2166136261; for(let i = 0; i < sig.length; i++){ h ^= sig.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/**
 * The graph as a picture: { r, g, b } fields on a ww × wh grid, or null when
 * there is no Surface to show. ctx: { knobs: [ten 0..100], tints: [hex, hex],
 * light (degrees), seed, scale, and what the page gives: text, aware, fill, around, camera, page (the export's
 * [w, h], for a part laid out in whole cells) }. deps.texture(type, w, h, opts) → a canvas.
 */
// ---- each node's result, kept between edits (version 2 graphs) ----
// Keyed by the node's whole upstream (its parts, settings and wiring, not
// where it sits), the grid, and what the page gives (seed, knobs, hues, dial):
// change one node and only it and what lies downstream are made again. A few
// dozen MB at most, the least recently used let go first.
const ATHANOR_KEPT = new Map(); let athanorKeptBytes = 0, athanorHits = 0, athanorPeak = 0;
const ATHANOR_KEEP_BYTES = 48*1024*1024;
const keptSize = outs => (outs || []).reduce((s, v) => s + (v instanceof Float32Array ? v.length*4 : v && v.r ? v.r.length*12 : 8), 0);
function athanorKeep(key, outs){
  if(ATHANOR_KEPT.has(key)) return;
  const b = keptSize(outs); if(b > ATHANOR_KEEP_BYTES/4) return;
  ATHANOR_KEPT.set(key, { outs, b }); athanorKeptBytes += b;
  for(const [k, v] of ATHANOR_KEPT){ if(athanorKeptBytes <= ATHANOR_KEEP_BYTES) break; ATHANOR_KEPT.delete(k); athanorKeptBytes -= v.b; }
}
/** What is kept (for the tests and the debug view). */
export function athanorCacheInfo(){ return { entries: ATHANOR_KEPT.size, bytes: athanorKeptBytes, hits: athanorHits, peak: athanorPeak }; }   // test hook: the cache's size and hits, and the most results held at once by the last graph
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
  const flatG = athanorFlat(graph), nodes = flatG.nodes;
  const surface = Object.values(nodes).find(n => n.name === 'surface');
  if(!surface && !ctx.all) return null;
  const gv = athanorVersion(graph), v2 = gv >= 2, v3 = gv >= 3;
  // the Surface's SIZE (Filter Forge's global Size): every distance in the graph is measured against it (100: as it always was)
  const sizeK = surface ? Math.max(0.25, Math.min(4, (parseFloat((surface.data || {}).size) || 100)/100)) : 1;
  const ctxSig = JSON.stringify([ww, wh, ctx.seed, ctx.knobs, ctx.tints, ctx.light, ctx.lightTilt, ctx.scale, ctx.mat || null, ctx.glow || null, ctx.accents || null, ctx.base || null, ctx.text || null, ctx.box || null, ctx.env || null, ctx.camera || null, ctx.curves || null, ctx.channel || null, sizeK, +ctx.fill || 0, +ctx.around || 0, ctx.aware === false ? 0 : 1, ctx.page || null, lightRig()]);   // (the page's lights, set round the making: texCore withLightRig)
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
  const memo = new Map(), busy = new Set(); athanorPeak = 0;
  // MEMORY (Ruby: Circuit Board ran Firefox on a phone out of memory): a part's result is let go as soon as every
  // part that reads it has run, so only the work in flight is held, not the whole graph's (the step previews,
  // which show every part, keep them all). What is worth keeping between edits stays in ATHANOR_KEPT.
  const readers = new Map();
  if(!ctx.all) for(const n of Object.values(nodes)) for(const p of Object.values(n.inputs || {})) for(const c of p.connections || []){ const s = String(c.node); readers.set(s, (readers.get(s) || 0) + 1); }
  // (and the outputs no part reads are let go the moment a part has run: Bloom hands on eight maps, a graph may read two —
  //  Ruby: Macro Bloom took a phone's worker, and Firefox, down at the saved image's size)
  const usedOuts = new Map();
  if(!ctx.all) for(const n of Object.values(nodes)) for(const p of Object.values(n.inputs || {})) for(const c of p.connections || []){ const s = String(c.node), k = parseInt(String(c.input || '').replace('output_', ''), 10) - 1;
    if(k >= 0) (usedOuts.get(s) || usedOuts.set(s, new Set()).get(s)).add(k); }
  const trimOuts = (id, out) => { const u = usedOuts.get(id); if(ctx.all || !Array.isArray(out) || !u || ctx.channel) return out; return out.map((v, i) => u.has(i) ? v : null); };
  const usedSig = id => { const u = usedOuts.get(id); return ctx.all || !u || ctx.channel ? '' : ':u' + [...u].sort((a, b) => a - b).join('.'); };
  const doneReading = n => { if(ctx.all) return;
    for(const p of Object.values(n.inputs || {})) for(const c of p.connections || []){ const s = String(c.node), left = (readers.get(s) || 0) - 1; readers.set(s, left); if(left <= 0) memo.delete(s); } };
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
    const m = /^@(k10|k[1-9]|dial|tilt)(?:\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\])?$/.exec(s.trim()); if(!m) return d;
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
    const S = STEPS[n.name] || {}, port = v3 && (S.maps || []).includes(k) && gv >= ((S.mapsSince || {})[k] || 3) ? paramPort(n.name, k) : 0;
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
    const key = v2 && !ctx.canvas ? fnv(sigOf(id)) + ':' + sigOf(id).length + ':' + ctxSig + (v3 ? ':v' + gv : '') + (ctx.all ? ':all' : '') + usedSig(id) : null;   // (a preview may hold a stand-in: never handed to the real thing)
    const kept = key && ATHANOR_KEPT.get(key);
    if(kept){ ATHANOR_KEPT.delete(key); ATHANOR_KEPT.set(key, kept); athanorHits++; out = kept.outs; }
    else {
      // version 2: the node's own randomness, from the seed and its id
      // (a part's own VARIATION, Filter Forge's local Variation, turns its draw without moving the page's seed; 0 is as before)
      const vr = Math.round(+((n.data || {}).variation) || 0);
      try { out = v2 ? withSeed(fnv((ctx.seed >>> 0) + ':' + id + (vr ? '~' + vr : '')), () => RUN(n)) : RUN(n); } catch(e){ out = null; }
      const lens = out && out.lens; out = trimOuts(id, out); if(lens && out) out.lens = lens;   // (a lit surface's height, kept with it: See Through)
      if(key && out) athanorKeep(key, out);
    }
    // (SEE THROUGH: the last lit surface's height, for the page to bend what lies beneath by)
    if(ctx.lens && out && out.lens) Object.assign(ctx.lens, out.lens);
    busy.delete(id); memo.set(id, out); if(memo.size > athanorPeak) athanorPeak = memo.size; doneReading(n);
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
    // a canvas (another texture, a stitch) read back at the working size, through a copy that is let go at once (Ruby:
    // Macro Bloom took the worker down; every read left a canvas of the grid's size waiting for the collector, a hundred
    // and more of them in one graph)
    const c = document.createElement('canvas'); c.width = ww; c.height = wh;
    const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.drawImage(cv, 0, 0, ww, wh);
    const d = x.getImageData(0, 0, ww, wh).data, r = new Float32Array(N), g = new Float32Array(N), b = new Float32Array(N);
    for(let i = 0; i < N; i++){ r[i] = d[i*4]/255; g[i] = d[i*4+1]/255; b[i] = d[i*4+2]/255; }
    c.width = 0; c.height = 0;
    return { r, g, b };
  };
  const lightOf = (H, dialDeg, relief, gloss, shadow, more) => lightHeights(H, ww, wh, { light: dialDeg, relief, gloss, shadow, ao: 0.3, ambient: 0.4, ...(more || {}) });
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
    c.width = 0; c.height = 0;   // (its pixels let go of at once: texCore freeCanvas)
    return o;
  };
  // TAKEN, NOT COPIED (the Ringworld's speed: a canvas pass copied each picture from part to part): in a canvas pass, a
  // part may take the canvas arriving on input j as its own to paint on, when it is the last part to read it and the
  // part that made it paints a fresh one (its step says `fresh`), so no other part, nor any cache, ever sees it changed
  //  (counted by output: a part may read two outputs of another, each its own canvas, and take the one only it reads)
  const outReaders = new Map(); if(ctx.canvas && !ctx.all) for(const m of Object.values(nodes)) for(const p of Object.values(m.inputs || {})) for(const c of p.connections || []){ const k = String(c.node) + ':' + c.input; outReaders.set(k, (outReaders.get(k) || 0) + 1); }
  const take = (n, j) => { if(!ctx.canvas || ctx.all) return null; const c = ((n.inputs || {})['input_' + j] || {}).connections || []; if(c.length !== 1) return null;
    const src = String(c[0].node), sn = nodes[src]; if(!sn || !(STEPS[sn.name] || {}).fresh || outReaders.get(src + ':' + c[0].input) !== 1) return null;
    const outs = evalNode(src), v = input(n, j); if(!(v && typeof v === 'object' && typeof v.getContext === 'function') || !outs || outs.indexOf(v) !== outs.lastIndexOf(v)) return null; return v; };
  const E = { ww, wh, N, unit, ctx, deps, input, take, num, map, at, P, field, flat, asField, asImage, asColour, isCurve, hexCol, boxBlur, readCanvas, lightOf, isImg, lum, marks, px, carea, canvasPass: !!ctx.canvas };
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
    // (a group shows what its first result shows)
    for(const [gid, src] of flatG.alias) if(out.has(src)) out.set(gid, out.get(src));
    return out;
  }
  const res = evalNode(String(surface.id));
  if(ctx.canvas) return res && res[0] && typeof res[0].getContext === 'function' ? res[0] : null;
  const img = res && res[0] ? asImage(res[0]) : null;
  // ANTI-ALIASING (A6): the hard edges smoothed where they step across the grid, at either setting (all pixels is also
  // drawn on a finer grid: textureGenerators genAthanor); absent, off, as every graph always drew
  return img && athanorAA(flatG) !== 'off' ? fxaaImage(img, ww, wh) : img;
}
/** The Surface's Anti-aliasing: 'off' (absent, as every graph drew before it), 'edges only' or 'all pixels'. */
// THE PREVIEW'S CHANNELS (ROADMAP B2; Filter Forge's own): what the Surface is made of, one at a time, for understanding a
// surface (view only: the page always draws the final picture). The Surface hands the one asked for (ctx.channel).
export const ATHANOR_CHANNELS = ['final', 'height', 'normal', 'occlusion', 'specular'];
export function athanorAA(graph){
  const s = Object.values(graph && graph.nodes ? graph.nodes : athanorFlat(graph).nodes).find(n => n.name === 'surface'), v = s && (s.data || {}).aa;
  return v === 'edges only' || v === 'all pixels' ? v : 'off';
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
  // a picture under glass (Ruby: the glass made to go over another surface): the Glass Pane over Texture from the Menu
  vitrine: { label: 'A Picture Under Glass', teach: 'A picture seen through a pane of glass. Texture from the Menu makes the picture, and the Glass Pane lays the glass over it. Old glass is never quite flat: a soft Perlin Noise, smoothed by Blur, is its waviness, and the Glass Pane bends what you see through it along the slopes, more as the Waviness knob rises. Window Reflection, Scratches and Smudges add the light the glass catches, as light adds, so where the glass is clean the picture shows as it is. Shatter breaks the pane, and through each shard the picture is bent its own way. Try: raise Cracks, then choose another texture in Texture from the Menu.', nodes: [
      ['texture', { type: 'cityscape', p1: 100, p2: 100, p3: 50 }, 40, 40], ['dial', {}, 40, 300],
      ['perlin', { scale: 8, details: 2, rough: 40, contrast: 30 }, 40, 440], ['blur', { radius: 6 }, 280, 440],
      ['reflection', { bands: 2, width: 100, soft: 35, slant: 20, sky: 30, ripple: 50 }, 740, 300], ['scratches', { count: 35, length: 50, swirl: 30, width: 100, sharp: 50 }, 740, 140],
      ['smudges', { prints: 30, smears: 25, spots: 15, dust: 30, size: 100 }, 740, 540], ['shatter', { breaks: 0, '~breaks': '0,100', reach: 100, rays: 50, rings: 50, width: 100 }, 740, 720],
      ['glasspane', { reflect: 45, glint: 80, smudge: 60, dust: 70, bend: 40, '~bend': '0,100', edge: 30 }, 1000, 220],
      ['knob', { slot: '1', name: 'Waviness', def: 40 }, 740, 880], ['knob', { slot: '2', name: 'Cracks', def: 0 }, 500, 880],
      ['surface', { name: 'A Picture Under Glass', ground: 'colour' }, 1240, 220]],
    wires: [[1, 1, 9, 1], [2, 1, 5, 1], [2, 2, 5, 2], [2, 1, 6, 1], [2, 2, 6, 2], [3, 1, 4, 1], [4, 1, 5, 3], [4, 1, 9, 9],
      [5, 1, 9, 2], [6, 2, 9, 3], [7, 1, 9, 4], [7, 3, 9, 5], [7, 2, 9, 6], [8, 1, 9, 7], [8, 2, 9, 8],
      [10, 1, 9, paramPort('glasspane', 'bend')], [11, 1, 8, paramPort('shatter', 'breaks')], [9, 1, 12, 1]] },
  // a dropped frame (Ruby: "more ways to do crazy things with glass"): Glass Shards lying over Texture from the Menu
  droppedframe: { label: 'A Dropped Frame', teach: 'A framed picture dropped face up, its glass in pieces on it. Texture from the Menu makes the picture, and Glass Shards lays the broken glass over it: through each shard the picture is bent by the shard\'s tilt and tinted by its glass, and beside each the light it gathers falls on the picture, inside a pale shadow. The Light Dial is the light (Light From and Light Height), and the Camera Dial tips the frame away from you (Turn, View and Camera Zoom). Try: turn Shards up, draw the light past the dial\'s rim for long caustics, or choose another texture in Texture from the Menu.', nodes: [
      ['texture', { type: 'aurorasky' }, 40, 40], ['dial', {}, 40, 300], ['camdial', {}, 40, 420],
      ['shards', { count: 45, '~count': '0,100', size: 120, spread: 60, slivers: 35, caustics: 70, glints: 70, colors: 10, shadows: 60, turn: 0, '~turn': '0,360', view: 0, '~view': '0,100', lens: 100, '~lens': '25,400' }, 320, 200],
      ['knob', { slot: '1', name: 'Shards', def: 45 }, 40, 560],
      ['surface', { name: 'A Dropped Frame', ground: 'colour' }, 600, 220]],
    wires: [[1, 1, 4, 1], [2, 1, 4, 2], [2, 2, 4, 3], [3, 1, 4, paramPort('shards', 'turn')], [3, 2, 4, paramPort('shards', 'view')], [3, 3, 4, paramPort('shards', 'lens')],
      [5, 1, 4, paramPort('shards', 'count')], [4, 1, 6, 1]] },
  // THE PATTERN PARTS AS STARTERS (ROADMAP F6): each a working lesson in one general pattern part, colored by your two
  // Hues, raised by the dial, and anti-aliased (their edges are hard: Surface › Anti-aliasing, edges only)
  paving: { label: 'Paving Stones', teach: 'A path of laid stones. Pavements lays the stones in rows and gives three maps: the stones (white, with dark joints), a bevel rising from each joint, and a different gray for each stone. A Color Ramp turns those grays into stone colors between your two Hues; Blend, set to Multiply, darkens the joints; and the bevel goes into the Surface\'s height, so the dial lights every stone\'s edge. Try: turn Irregularity up for an old road, then the Rows knob down for flagstones.', nodes: [
      ['pavement', { rows: 7, '~rows': '3,30', irreg: 55, gap: 25, round: 45, bevel: 40, angle: 0 }, 40, 80], ['knob', { slot: '1', name: 'Rows', def: 15 }, 40, 420],
      ['knob', { slot: '2', name: 'Irregularity', def: 55 }, 40, 540], ['hue', { slot: '1', name: 'Stone Hue' }, 300, 300], ['hue', { slot: '2', name: 'Second Stone Hue' }, 300, 420],
      ['ramp', { mid: 50 }, 300, 60], ['blend', { mode: 'multiply', opacity: 100 }, 540, 60], ['surface', { name: 'Paving Stones', ground: 'colour', aa: 'edges only' }, 780, 100]],
    wires: [[1, 3, 6, 1], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1], [1, 1, 7, 2], [7, 1, 8, 1], [1, 2, 8, 2], [2, 1, 1, paramPort('pavement', 'rows')], [3, 1, 1, paramPort('pavement', 'irreg')]] },
  brickwall: { label: 'Brick Wall', teach: 'Bricks in courses. Bricks gives the wall\'s heights (each brick raised, its edges bevelled), the mortar, and a gray for each brick. A Color Ramp colors each brick between your two Hues, so no two are quite alike; Blend, set to Multiply, lays the wall\'s heights over the colors to shade the mortar; and the heights go into the Surface\'s height for the dial to light. Try: raise Mortar, then set Bricks\' Stagger to 0 for a stack bond.', nodes: [
      ['bricks', { rows: 12, '~rows': '6,40', ratio: 220, mortar: 14, stagger: 50, bevel: 35, vary: 40 }, 40, 80], ['knob', { slot: '1', name: 'Mortar', def: 35 }, 40, 420],
      ['knob', { slot: '2', name: 'Courses', def: 20 }, 40, 540], ['hue', { slot: '1', name: 'Brick Hue' }, 300, 300], ['hue', { slot: '2', name: 'Second Brick Hue' }, 300, 420],
      ['ramp', { mid: 50 }, 300, 60], ['blend', { mode: 'multiply', opacity: 100 }, 540, 60], ['surface', { name: 'Brick Wall', ground: 'colour', aa: 'edges only' }, 780, 100]],
    wires: [[1, 3, 6, 1], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1], [1, 1, 7, 2], [7, 1, 8, 1], [1, 1, 8, 2], [2, 1, 1, paramPort('bricks', 'mortar')], [3, 1, 1, paramPort('bricks', 'rows')]] },
  studs: { label: 'Pyramid Studs', teach: 'Rows of studs, like a rivet plate or a cut gem\'s facets. Pyramids raises a pyramid in each square of a grid and gives a gray for each square; its heights go into the Surface\'s height, so the dial lights one face of every pyramid and shades the other. A Color Ramp colors the squares between your two Hues. Roundness turns the pyramids into domes. Try: raise Pyramids\' Octaves for smaller studs among the large.', nodes: [
      ['pyramids', { scale: 12, '~scale': '4,40', octaves: 1, round: 0, vary: 30 }, 40, 80], ['knob', { slot: '1', name: 'Roundness', def: 0 }, 40, 380],
      ['knob', { slot: '2', name: 'Studs', def: 15 }, 40, 500], ['hue', { slot: '1', name: 'Metal Hue' }, 300, 300], ['hue', { slot: '2', name: 'Second Metal Hue' }, 300, 420],
      ['ramp', { mid: 50 }, 300, 60], ['surface', { name: 'Pyramid Studs', ground: 'colour', aa: 'edges only' }, 560, 100]],
    wires: [[1, 2, 6, 1], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1], [1, 1, 7, 2], [2, 1, 1, paramPort('pyramids', 'round')], [3, 1, 1, paramPort('pyramids', 'scale')]] },
  dotgrid: { label: 'Dot Grid', teach: 'Even dots in rows, as on a halftone print or a perforated sheet. Grid & Dots draws a regular pattern (here, dots) as a gray map: white dots on black. Tint colors it between your two Hues. Dot Size is its Line or Dot Size, and Turn its Angle (a Knob of the Angle kind reads in degrees). Try: set the Pattern to hex dots, or to grid lines for graph paper.', nodes: [
      ['grid', { kind: 'dots', cells: 16, weight: 45, angle: 45, soft: 0 }, 40, 80], ['knob', { slot: '1', name: 'Dot Size', def: 45 }, 40, 340],
      ['knob', { slot: '2', name: 'Turn', def: 12.5, kind: 'angle' }, 40, 460], ['hue', { slot: '1', name: 'Dot Hue' }, 300, 260], ['hue', { slot: '2', name: 'Ground Hue' }, 300, 380],
      ['tint', {}, 300, 60], ['surface', { name: 'Dot Grid', ground: 'colour', aa: 'edges only' }, 540, 80]],
    wires: [[1, 1, 6, 1], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1], [2, 1, 1, paramPort('grid', 'weight')], [3, 1, 1, paramPort('grid', 'angle')]] },
  techno: { label: 'Techno Blocks', teach: 'Rectangles inside rectangles, like a city seen from above or a circuit\'s floor plan. Blocks splits the page again and again (each Octave a finer split) and gives the blocks, a gray each, and their outlines. A Color Ramp colors the blocks between your two Hues, Blend (Screen) lays the outlines over them as light, and the blocks go into the Surface\'s height so the dial raises them. Density sets how many blocks are filled. Try: raise Blocks\' Octaves, then the Line Width.', nodes: [
      ['blocks', { scale: 6, octaves: 3, fill: 60, line: 12 }, 40, 80], ['knob', { slot: '1', name: 'Density', def: 60 }, 40, 380],
      ['hue', { slot: '1', name: 'Block Hue' }, 300, 260], ['hue', { slot: '2', name: 'Ground Hue' }, 300, 380],
      ['ramp', { mid: 50 }, 300, 60], ['blend', { mode: 'screen', opacity: 100 }, 540, 60], ['surface', { name: 'Techno Blocks', ground: 'colour', aa: 'edges only' }, 780, 100]],
    wires: [[1, 1, 5, 1], [3, 1, 5, 2], [4, 1, 5, 3], [5, 1, 6, 1], [1, 2, 6, 2], [6, 1, 7, 1], [1, 1, 7, 2], [2, 1, 1, paramPort('blocks', 'fill')]] },
  // the Curve Control (D4): a curve drawn by hand on the page
  tones: { label: 'Hand-Drawn Tones', teach: 'Clouds whose light and dark you draw by hand. A Perlin Noise makes soft clouds; Tone Curve runs every gray of them through a curve, as a photo editor\'s Curves does; and the curve comes from a Curve Control, which becomes a pad under the sliders when this is the page\'s surface. A Color Ramp colors the result between your two Hues. Try: on the page, drag the curve\'s middle points apart for hard-edged islands, or add a dip for rings.', nodes: [
      ['perlin', { scale: 8, details: 4, rough: 50, contrast: 40 }, 40, 60], ['curvectl', { slot: '1', name: 'Tones', points: '0,0;35,12;65,88;100,100' }, 40, 360],
      ['tonecurve', { mix: 100 }, 300, 140], ['hue', { slot: '1', name: 'Light Hue' }, 300, 360], ['hue', { slot: '2', name: 'Dark Hue' }, 300, 480],
      ['ramp', { mid: 50 }, 540, 140], ['surface', { name: 'Hand-Drawn Tones', ground: 'colour', aa: 'edges only' }, 780, 160]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [3, 1, 6, 1], [5, 1, 6, 2], [4, 1, 6, 3], [6, 1, 7, 1]] },
  // the poem's punctuation (G2): marks thrown from where the commas and full stops sit
  sparks: { label: 'Punctuation Particles', teach: 'Sparks thrown from your poem\'s punctuation. The Poem\'s Punctuation output is a soft glow on every comma, full stop, dash and quote; Scatter throws its marks only where a map is light, so the sparks gather round the marks and thin out away from them. Tint colors them with your two Hues, and their heights go to the Surface, so the dial lights them. Try: set The Poem\'s Punctuation to Pauses, or turn up its Punctuation Glow; then type a line with more commas.', nodes: [
      ['poem', { padding: 30, softness: 0, reach: 35, marks: 'every mark', glow: 180 }, 40, 80],
      ['scatter', { shape: 'spark', count: 160, size: 16, vary: 70, turn: 100, clump: 0, fade: 45 }, 300, 80],
      ['hue', { slot: '1', name: 'Spark Hue' }, 300, 420], ['hue', { slot: '2', name: 'Ground Hue' }, 300, 540],
      ['tint', {}, 560, 160], ['surface', { name: 'Punctuation Particles', ground: 'colour' }, 800, 160]],
    wires: [[1, 9, 2, 2], [2, 1, 5, 1], [3, 1, 5, 2], [4, 1, 5, 3], [5, 1, 6, 1], [2, 2, 6, 2]] },
};
/** A starter as a graph (Drawflow's export form, without node faces). */
export function athanorStarter(name){
  const S = ATHANOR_STARTERS[name] || ATHANOR_STUDIES[name] || TEXTURE_CHAINS[name]; if(!S) return null;
  // (a texture's own chain stays v2: its picture never changes; a starter to learn from is the newest)
  // (a chain remade to light its maps (AGENTS §8, step 1b) says so with its own version, `v`: maps on settings then work)
  return athanorGraphOf(S, ATHANOR_STARTERS[name] || ATHANOR_STUDIES[name] ? ATHANOR_VERSION : (S.v || 2));
}
/** A graph from a spec of nodes [type, data, x?, y?] and wires [from, output, to, input] (1-based), laid out to read. */
/**
 * A texture's chain as it stands on the page (the Surface card's Open in the Athanor): its Knobs set to the
 * sliders' values, each as its share of the slider's range (`defs`: the texture's TEXTURE_PARAMS).
 */
export function athanorStarterAt(name, defs, values){
  if((TEXTURE_CHAINS[name] || {}).sealed) return null;   // (the Ringworld never opens in the Athanor)
  const g = athanorStarter(name); if(!g) return null;
  for(const n of Object.values(athanorNodes(g))) if(n.name === 'knob'){
    const s = parseInt((n.data || {}).slot, 10) || 1, d = (defs || [])[s - 1], v = parseFloat((values || [])[s - 1]);
    if(d && !isNaN(v)) n.data = { ...n.data, def: Math.max(0, Math.min(100, (v - d.min)/Math.max(1e-6, d.max - d.min)*100)) }; }
  return g;
}
export function athanorGraphOf(S, v = ATHANOR_VERSION){
  const data = {};
  S.nodes.forEach(([type, d, x = 0, y = 0], i) => { const id = i + 1;
    data[id] = { id, name: type, data: { ...d }, class: '', html: '', typenode: false, inputs: {}, outputs: {}, pos_x: x, pos_y: y }; });
  for(const [a, o, b, j] of S.wires){
    ((data[b].inputs['input_' + j] ||= { connections: [] }).connections).push({ node: String(a), input: 'output_' + o });
    ((data[a].outputs['output_' + o] ||= { connections: [] }).connections).push({ node: String(b), output: 'input_' + j });
  }
  layoutAthanor(data);
  return { v, drawflow: { Home: { data } } };
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
export function layoutAthanor(data, spread = 1){
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
    // (spread: the gaps between columns and between parts, wider, so the wires can be followed — Ruby's Spread Out)
    for(const id of list){ data[id].pos_x = 30 + +c*(ATHANOR_NODE.w + ATHANOR_NODE.colGap*spread); data[id].pos_y = y; y += athanorNodeHeight(data[id].name) + ATHANOR_NODE.gap*spread; }
  }
  return data;
}

/**
 * A graph from anywhere (a pasted look, an old save, a hand-edited JSON),
 * checked before it is used: known parts only, plain settings, wires between
 * real ports, within the limits. Returns { ok, graph, problems } — the graph
 * cleaned (what can be kept is kept), or ok:false when nothing safe remains.
 */
export const ATHANOR_MAX_JSON = 640*1024;   // (room for 255 parts: about 2.5 KB each, wires and settings)
export function validateGraph(json){
  const problems = [];
  if(json == null || json === '') return { ok: true, graph: null, problems };
  const text = typeof json === 'string' ? json : (() => { try { return JSON.stringify(json); } catch(e){ return ''; } })();
  if(text.length > ATHANOR_MAX_JSON) return { ok: false, graph: null, problems: [`the graph is too large (${Math.round(text.length/1024)} KB; at most ${ATHANOR_MAX_JSON/1024} KB)`] };
  let g; try { g = JSON.parse(text); } catch(e){ return { ok: false, graph: null, problems: ['the graph is not readable JSON'] }; }
  const df = (g || {}).drawflow, home = ((df || {}).Home || {}).data;
  if(!home || typeof home !== 'object' || Array.isArray(home)) return { ok: false, graph: null, problems: ['it is not an Athanor graph'] };
  // its modules: Home, and each group's own (a name, a few dozen at most)
  const names = Object.keys(df).filter(m => m === 'Home' || (/^[A-Za-z][\w-]{0,31}$/.test(m) && df[m] && typeof (df[m].data || null) === 'object' && !Array.isArray(df[m].data))).slice(0, 33);
  if(Object.keys(df).length > names.length) problems.push('a part of the graph that was not a group was left out');
  let total = 0; for(const m of names) total += Object.keys(df[m].data || {}).length;
  if(total > ATHANOR_LIMITS.nodes*2) return { ok: false, graph: null, problems: [`it has ${total} nodes (at most ${ATHANOR_LIMITS.nodes})`] };
  // (ports saved by name are checked by place, and saved by name again)
  const named = athanorIsNamed(g);
  let src; try { src = named ? athanorNumbered({ drawflow: Object.fromEntries(names.map(m => [m, df[m]])) }).drawflow : df; } catch(e){ return { ok: false, graph: null, problems: ['the graph is not readable'] }; }
  const cleanMods = {};
  for(const m of names){
    const data = (src[m] || {}).data || {}, clean = {};
    for(const id of Object.keys(data)){
      const n = data[id];
      if(!n || typeof n !== 'object' || !STEPS[n.name]){ problems.push(`an unknown part (${String(n && n.name).slice(0, 24)}) was left out`); continue; }
      // (a sealed part, the Ringworld's own, never opens in the Athanor)
      if(STEPS[n.name].sealed){ problems.push(`${STEPS[n.name].label} belongs to the Ringworld alone and was left out`); continue; }
      if(m !== 'Home' && n.name === 'surface'){ problems.push('a Surface inside a group was left out'); continue; }
      const d = {};
      for(const [k, v] of Object.entries(n.data || {})){
        if(typeof v === 'number' && isFinite(v)) d[k] = v;
        else if(typeof v === 'string' && v.length <= 64) d[k] = v;
        else if(typeof v === 'boolean') d[k] = v;
        else problems.push(`a setting of ${n.name} was not plain and was left out`);
      }
      if(n.name === 'group' && !(typeof d.module === 'string' && d.module !== 'Home' && names.includes(d.module))){ problems.push('a group whose insides were missing was left out'); continue; }
      clean[id] = { id: isFinite(+n.id) ? +n.id : +id, name: n.name, data: d, class: String(n.class || '').slice(0, 64), html: '', typenode: false,
        inputs: {}, outputs: {}, pos_x: isFinite(+n.pos_x) ? +n.pos_x : 0, pos_y: isFinite(+n.pos_y) ? +n.pos_y : 0, _in: n.inputs, _out: n.outputs };
    }
    cleanMods[m] = { data: clean };
  }
  // wires only between parts that exist, on ports they have (a group's are its insides')
  const insOf = n => n.name === 'group' ? groupPorts(cleanMods[n.data.module]).ins.length : STEPS[n.name].ins.length;
  const outsOf = n => n.name === 'group' ? groupPorts(cleanMods[n.data.module]).outs : STEPS[n.name].outs.length;
  for(const m of names){ const clean = cleanMods[m].data;
    for(const n of Object.values(clean)){
      const ni = insOf(n), no = outsOf(n);
      for(const [k, v] of Object.entries(n._in || {})){ const j = parseInt(String(k).replace('input_', ''), 10); if(!(j >= 1 && j <= ni)) continue;
        n.inputs['input_' + j] = { connections: ((v || {}).connections || []).filter(c => c && clean[String(c.node)] && /^output_\d+$/.test(c.input || '')
          && parseInt(c.input.slice(7), 10) <= outsOf(clean[String(c.node)])).map(c => ({ node: String(c.node), input: c.input })) }; }
      for(const [k, v] of Object.entries(n._out || {})){ const j = parseInt(String(k).replace('output_', ''), 10); if(!(j >= 1 && j <= no)) continue;
        n.outputs['output_' + j] = { connections: ((v || {}).connections || []).filter(c => c && clean[String(c.node)] && /^input_\d+$/.test(c.output || '')
          && parseInt(c.output.slice(6), 10) <= insOf(clean[String(c.node)])).map(c => ({ node: String(c.node), output: c.output })) }; }
      delete n._in; delete n._out;
    }
  }
  let out = { v: Math.max(1, parseInt(g.v, 10) || 1), drawflow: cleanMods };
  // (the limit counts every part inside every group, as the walk will meet them)
  if(Object.keys(athanorFlat(out).nodes).length > ATHANOR_LIMITS.nodes) problems.push(`it has more than ${ATHANOR_LIMITS.nodes} nodes, so it will not be drawn`);
  if(named) out = athanorNamed(out);
  return { ok: true, graph: out, problems };
}
