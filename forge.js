/**
 * forge.js — THE ATHANOR (the alchemist's furnace; beneath the name, "Surface
 * texture node editor"): a node editor for making new surfaces out of the
 * pieces Vellum already has (generators, noises, the light engine, stitches,
 * blends, hues, the six knobs, the dial, the seed). The graph is made into a
 * texture by athanor.js (in the texture worker); it shows as "The Athanor"
 * at the bottom of Surface Variant.
 *
 * Built on Drawflow (jerosoler/Drawflow, MIT): vanilla JS, touch-friendly,
 * small — loaded only when the Athanor is first opened. Its graph (Drawflow's
 * own export JSON) is kept in the hidden #forgeGraph field, so it is saved,
 * loaded, shared and shown in the JSON like every other setting.
 *
 * No imports of app state: the page hands in what it needs (deps).
 */
import { ATHANOR_VERSION, ATHANOR_LIMITS, ATHANOR_STARTERS, athanorVersion, athanorBudget, athanorStarter } from './athanor.js';
import { STEPS, STEP_BLENDS, STEP_CATEGORIES } from './steps.js';
import { TEXTURE_CHAINS } from './chains.js';

const FORGE_DF_JS  = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
const FORGE_DF_CSS = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.css';

// ---- the parts: every node a step of steps.js (shared with the textures
// rebuilt as chains) — ports, params and category as the editor shows them
export const FORGE_BLENDS = STEP_BLENDS;
export const FORGE_NODES = Object.fromEntries(Object.entries(STEPS).map(([k, s]) => [k, { cat: s.cat, label: s.label, ins: s.ins, outs: s.outs, params: s.params }]));
export const FORGE_CATEGORIES = STEP_CATEGORIES;

// ---- a node's face: its params as small controls bound with df-* ----
const forgeEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function forgeNodeHtml(type, lists = {}, data = {}){
  const N = FORGE_NODES[type]; if(!N) return '';
  const ports = (names, cls) => names.length ? `<div class="forge-ports ${cls}">${names.map(n => `<span>${forgeEsc(n)}</span>`).join('')}</div>` : '';
  const ctl = ([key, label, kind, def, x]) => {
    // a param bound to a slider or the dial ('@k2', '@dial'): shown as written, and editable
    const v = data[key];
    if(typeof v === 'string' && v[0] === '@') return `<label class="forge-param forge-bound" title="Bound: @k1–@k6 a slider, @dial the dial; [lo,hi] its range"><span>${forgeEsc(label)}</span><input type="text" df-${key} value="${forgeEsc(v)}"></label>`;
    if(kind === 'range') return `<label class="forge-param"><span>${forgeEsc(label)}</span><input type="range" df-${key} min="${x.min}" max="${x.max}" value="${def}"></label>`;
    if(kind === 'select') return `<label class="forge-param"><span>${forgeEsc(label)}</span><select df-${key}>${x.options.map(o => `<option value="${forgeEsc(o)}">${forgeEsc(o)}</option>`).join('')}</select></label>`;
    if(kind === 'texture' || kind === 'stitch'){ const opts = (kind === 'texture' ? lists.textures : lists.stitches) || [def];
      return `<label class="forge-param"><span>${forgeEsc(label)}</span><select df-${key}>${opts.map(o => `<option value="${forgeEsc(o)}">${forgeEsc(o)}</option>`).join('')}</select></label>`; }
    return `<label class="forge-param"><span>${forgeEsc(label)}</span><input type="text" df-${key} value="${forgeEsc(def)}"></label>`;
  };
  return `<div class="forge-node-title">${forgeEsc(N.label)}</div>${ports(N.ins, 'in')}${ports(N.outs, 'out')}${N.params.map(ctl).join('')}`;
}
/** A new node's data: each param at its default. */
export function forgeNodeData(type){
  const N = FORGE_NODES[type]; if(!N) return {};
  return Object.fromEntries(N.params.map(p => [p[0], p[3]]));
}
/** What a saved graph holds, in a few words (for the card). */
export function describeForge(json){
  try {
    const g = typeof json === 'string' ? JSON.parse(json || '{}') : json;
    const nodes = Object.values(((g.drawflow || {}).Home || {}).data || {});
    if(!nodes.length) return 'Empty — open the Athanor to begin.';
    let wires = 0; for(const n of nodes) for(const o of Object.values(n.outputs || {})) wires += (o.connections || []).length;
    const out = nodes.find(n => n.name === 'surface');
    // the work budget (athanor.js): say when a graph is drawn coarser, or not at all
    const B = athanorBudget(g);
    const load = B.tooMany ? ` — too many nodes (${ATHANOR_LIMITS.nodes} at most): not drawn` : B.scale > 1.05 ? ' — heavy: drawn at reduced detail' : '';
    return `${nodes.length} node${nodes.length === 1 ? '' : 's'}, ${wires} wire${wires === 1 ? '' : 's'}` + (out ? ` → “${(out.data || {}).name || 'Surface'}”` : ' (no Surface yet)') + load;
  } catch(e){ return 'The saved graph could not be read.'; }
}

// ---- loading Drawflow when it's first wanted ----
let forgeLoad = null;
function loadDrawflow(){
  if(typeof Drawflow === 'function') return Promise.resolve(true);
  if(forgeLoad) return forgeLoad;
  forgeLoad = new Promise(resolve => {
    try {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = FORGE_DF_CSS; document.head.appendChild(css);
      const js = document.createElement('script'); js.src = FORGE_DF_JS; js.async = true;
      js.onload = () => resolve(typeof Drawflow === 'function'); js.onerror = () => { forgeLoad = null; resolve(false); };
      document.head.appendChild(js);
    } catch(e){ forgeLoad = null; resolve(false); }
  });
  return forgeLoad;
}

/**
 * Opens the Athanor over the page. deps: { $, textures: [ids], stitches: [ids], onSave(json) }.
 * The graph is read from and written back to deps.$('forgeGraph').
 */
export async function openForge(deps){
  const { $ } = deps;
  const veil = $('forgeVeil'), area = $('forgeCanvas'), palette = $('forgePalette'), status = $('forgeStatus');
  if(!veil || !area) return;
  veil.hidden = false;
  if(document.body && document.body.classList) document.body.classList.add('forge-open');
  const ok = await loadDrawflow();
  if(!ok){ if(status) status.textContent = 'The node editor could not be loaded (offline?). Try again when connected.'; return; }
  if(!openForge.editor){
    const ed = openForge.editor = new Drawflow(area);
    // zoom in small steps (Drawflow's 0.1 a wheel-notch is far too quick on a trackpad or a pinch)
    ed.reroute = true; ed.curvature = 0.4; ed.zoom_min = 0.3; ed.zoom_max = 1.8; ed.zoom_value = 0.04;
    ed.start();
    const lists = { textures: deps.textures || [], stitches: deps.stitches || [] };
    let thumbT = 0;
    const thumb = json => { clearTimeout(thumbT); thumbT = setTimeout(() => { const c = $('forgeThumb'); if(c && deps.preview) try { deps.preview(json, c); } catch(e){} }, 250); };
    // saved without each node's face (it is drawn again from the parts list on
    // load): a graph stays small, and an old graph gets the newest controls
    // (and with its VERSION: a graph loaded keeps its own, a new one is the newest — athanor.js)
    const slim = () => { const g = ed.export(); for(const n of Object.values(((g.drawflow || {}).Home || {}).data || {})) n.html = ''; g.v = openForge.version || ATHANOR_VERSION; return g; };
    const faces = g => { openForge.version = athanorVersion(g);
      for(const n of Object.values(((g.drawflow || {}).Home || {}).data || {})){ const P = FORGE_NODES[n.name]; if(!P) continue;
        n.html = forgeNodeHtml(n.name, lists, n.data || {}); n.class = n.class || 'forge-' + P.cat.toLowerCase().replace(/[^a-z]+/g, '-');
        // every port the part has, wired or not (a starter, or a part that gained one, lists only its wires)
        n.inputs = n.inputs || {}; n.outputs = n.outputs || {};
        P.ins.forEach((_, j) => { n.inputs['input_' + (j + 1)] = n.inputs['input_' + (j + 1)] || { connections: [] }; });
        P.outs.forEach((_, j) => { n.outputs['output_' + (j + 1)] = n.outputs['output_' + (j + 1)] || { connections: [] }; }); }
      return g; };
    openForge.faces = faces;
    const save = () => { const json = JSON.stringify(slim()); const f = $('forgeGraph'); if(f){ f.value = json; } if(deps.onSave) deps.onSave(json); if(status) status.textContent = describeForge(json); thumb(json); };
    for(const ev of ['nodeCreated', 'nodeRemoved', 'connectionCreated', 'connectionRemoved', 'nodeMoved', 'nodeDataChanged']) ed.on(ev, save);
    const add = (type, x, y) => {
      const N = FORGE_NODES[type]; if(!N) return;
      const rect = area.getBoundingClientRect(), z = ed.zoom || 1;
      // tapped in from the palette: near the middle, each a little further along (never stacked)
      const k = (openForge.placed = (openForge.placed || 0) + 1) % 9, cols = rect.width > 700 ? 3 : 1;
      const px = x !== undefined ? x : (rect.width/2 - ed.canvas_x)/z - 300*(cols > 1 ? 1 : 0.3) + (k % cols)*210 + Math.floor(k/cols)*14,
            py = y !== undefined ? y : (rect.height/2 - ed.canvas_y)/z - 160 + Math.floor(k/cols)*(cols > 1 ? 150 : 150) + (k % cols)*10 - (cols > 1 ? 0 : 200);
      ed.addNode(type, N.ins.length, N.outs.length, px, py, 'forge-' + N.cat.toLowerCase().replace(/[^a-z]+/g, '-'), forgeNodeData(type), forgeNodeHtml(type, lists));
    };
    // the palette: tap to add in the middle, or drag onto the canvas
    if(palette){
      palette.innerHTML = FORGE_CATEGORIES.map(cat => `<div class="forge-cat">${forgeEsc(cat)}</div>` +
        Object.entries(FORGE_NODES).filter(([, n]) => n.cat === cat).map(([type, n]) => `<button type="button" class="forge-part" draggable="true" data-type="${type}">${forgeEsc(n.label)}</button>`).join('')).join('');
      palette.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b) add(b.dataset.type); });
      palette.addEventListener('dragstart', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b && e.dataTransfer) e.dataTransfer.setData('text/forge', b.dataset.type); });
    }
    area.addEventListener('dragover', e => e.preventDefault());
    area.addEventListener('drop', e => { e.preventDefault(); const type = e.dataTransfer && e.dataTransfer.getData('text/forge'); if(!type) return;
      const rect = area.getBoundingClientRect(), z = ed.zoom || 1; add(type, (e.clientX - rect.left - ed.canvas_x)/z, (e.clientY - rect.top - ed.canvas_y)/z); });
    // the saved graph, or a first one: a Surface waiting for something to show
    let saved = null; try { saved = JSON.parse(($('forgeGraph') || {}).value || 'null'); } catch(e){}
    if(saved && saved.drawflow) ed.import(faces(saved));
    else { openForge.version = ATHANOR_VERSION; add('noise', 40, 60); add('surface', 420, 90); }
    openForge.save = save; openForge.add = add;
    if($('forgeClear')) $('forgeClear').addEventListener('click', () => { ed.clear(); openForge.version = ATHANOR_VERSION; save(); });
    // the starters: a working graph to take apart (replacing this one, if it is more than a start)
    const st = $('forgeStarter');
    if(st){
      // the starters, and Vellum's own textures as their chains of steps (chains.js)
      st.innerHTML = '<option value="">Start from…</option>'
        + '<optgroup label="Starters">' + Object.entries(ATHANOR_STARTERS).map(([k, v]) => `<option value="${k}">${forgeEsc(v.label)}</option>`).join('') + '</optgroup>'
        + '<optgroup label="Vellum’s textures">' + Object.entries(TEXTURE_CHAINS).map(([k, v]) => `<option value="${k}">${forgeEsc(v.label)}</option>`).join('') + '</optgroup>';
      st.addEventListener('change', () => {
        const k = st.value; st.value = ''; const g = athanorStarter(k); if(!g) return;
        const n = Object.keys(((ed.export().drawflow || {}).Home || {}).data || {}).length;
        if(n > 2 && typeof confirm === 'function' && !confirm(`Replace this graph with “${(ATHANOR_STARTERS[k] || TEXTURE_CHAINS[k]).label}”?`)) return;
        ed.clear(); ed.import(faces(g)); save();
      });
    }
    if($('forgeUseBtn') && deps.use) $('forgeUseBtn').addEventListener('click', () => deps.use());
    if($('forgeZoomIn')) $('forgeZoomIn').addEventListener('click', () => ed.zoom_in());
    if($('forgeZoomOut')) $('forgeZoomOut').addEventListener('click', () => ed.zoom_out());
    save();
  } else {
    // a look loaded since: show its graph
    let saved = null; try { saved = JSON.parse(($('forgeGraph') || {}).value || 'null'); } catch(e){}
    if(saved && saved.drawflow && openForge.faces) openForge.editor.import(openForge.faces(saved));
    if(status) status.textContent = describeForge(($('forgeGraph') || {}).value);
    const c = $('forgeThumb'); if(c && deps.preview) try { deps.preview(($('forgeGraph') || {}).value, c); } catch(e){}
  }
}
export function closeForge(deps){
  const veil = deps.$('forgeVeil'); if(veil) veil.hidden = true;
  if(document.body && document.body.classList) document.body.classList.remove('forge-open');
}
