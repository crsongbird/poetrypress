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
import { ATHANOR_VERSION, ATHANOR_LIMITS, ATHANOR_STARTERS, athanorVersion, athanorBudget, athanorStarter, layoutAthanor } from './athanor.js';
import { STEPS, STEP_BLENDS, STEP_CATEGORIES } from './steps.js';
import { TEXTURE_CHAINS } from './chains.js';

const FORGE_DF_JS  = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
const FORGE_DF_CSS = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.css';

// ---- the parts: every node a step of steps.js (shared with the textures
// rebuilt as chains) — ports, params and category as the editor shows them
export const FORGE_BLENDS = STEP_BLENDS;
export const FORGE_NODES = Object.fromEntries(Object.entries(STEPS).map(([k, s]) => [k, { cat: s.cat, label: s.label, ins: s.ins, outs: s.outs, params: s.params,
  inTypes: s.inTypes, outTypes: s.outTypes, dataIns: s.dataIns, paramPorts: s.paramPorts }]));
export const FORGE_CATEGORIES = STEP_CATEGORIES;
/**
 * COLOUR CARRIES MEANING in the grid, whatever the app's theme: each part's
 * category tints its title (whimsical, as the four elements are), and every
 * port and wire wears the colour of what travels on it — a grey map, a
 * picture, one colour, one number. A ⚙ port (a param taking a wire) is a
 * small diamond in the number's colour.
 */
export const FORGE_TYPE_COLOURS = { field: '#CFC8DD', image: '#EE7FF5', colour: '#F4C44E', value: '#54D3EA' };
export const FORGE_TYPE_NAMES = { field: 'a grey map', image: 'a picture', colour: 'one colour', value: 'one number' };
export const FORGE_CAT_COLOURS = { 'Inputs': '#E9C46A', 'Noise': '#AE8CFF', 'Marks': '#FF8FB4', 'Textures': '#5ED6C3', 'Shape': '#80B9FF', 'Light & Colour': '#FFB070', 'Output': '#F3ECF8' };
export const FORGE_CAT_GLYPHS = { 'Inputs': '☽', 'Noise': '✧', 'Marks': '✎', 'Textures': '❀', 'Shape': '◈', 'Light & Colour': '☼', 'Output': '🜉' };
const forgeCatClass = cat => 'forge-' + cat.toLowerCase().replace(/[^a-z]+/g, '-');

// ---- a node's face: ROWS that line up with its ports (each row one port's
// height), so a ⚙ port sits beside the slider it drives; params without a
// port follow; a small preview of the node's own result at the foot ----
const forgeEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function forgeNodeHtml(type, lists = {}, data = {}){
  const N = FORGE_NODES[type]; if(!N) return '';
  const ctl = ([key, label, kind, def, x]) => {
    // a param bound to a slider or the dial ('@k2', '@dial'): shown as written, and editable
    const v = data[key];
    if(typeof v === 'string' && v[0] === '@') return `<label class="forge-param forge-bound" data-p="${key}" title="Bound: @k1–@k6 a slider, @dial the dial; [lo,hi] its range"><span>${forgeEsc(label)}</span><input type="text" df-${key} value="${forgeEsc(v)}"></label>`;
    if(kind === 'range') return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><input type="range" df-${key} min="${x.min}" max="${x.max}" value="${def}"><output>${def}</output></label>`;
    if(kind === 'select') return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><select df-${key}>${x.options.map(o => `<option value="${forgeEsc(o)}">${forgeEsc(o)}</option>`).join('')}</select></label>`;
    if(kind === 'texture' || kind === 'stitch'){ const opts = (kind === 'texture' ? lists.textures : lists.stitches) || [def];
      return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><select df-${key}>${opts.map(o => `<option value="${forgeEsc(o)}">${forgeEsc(o)}</option>`).join('')}</select></label>`; }
    return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><input type="text" df-${key} value="${forgeEsc(def)}"></label>`;
  };
  const rows = Math.max(N.ins.length, N.outs.length), byKey = Object.fromEntries(N.params.map(p => [p[0], p]));
  // the title bar is the handle (a node moves only by it), with a pin and a menu at its end
  let html = `<div class="forge-node-title"><span class="forge-node-glyph" aria-hidden="true">${FORGE_CAT_GLYPHS[N.cat] || ''}</span><span class="forge-node-name">${forgeEsc(N.label)}</span>`
    + `<button type="button" class="forge-node-btn forge-pin" data-act="pin" title="Pin in place" aria-label="Pin in place">${lists.lock || '⌖'}</button>`
    + `<button type="button" class="forge-node-btn" data-act="menu" title="What it can do" aria-label="What it can do">⋯</button></div><div class="forge-rows">`;
  for(let i = 0; i < rows; i++){
    const left = i < N.dataIns ? `<span class="fp-in" data-t="${N.inTypes[i]}">${forgeEsc(N.ins[i])}</span>` : i < N.ins.length ? ctl(byKey[N.paramPorts[i - N.dataIns]]) : '<span></span>';
    const right = i < N.outs.length ? `<span class="fp-out" data-t="${N.outTypes[i]}">${forgeEsc(N.outs[i])}</span>` : '';
    html += `<div class="forge-row">${left}${right}</div>`;
  }
  html += N.params.filter(p => !N.paramPorts.includes(p[0])).map(p => `<div class="forge-row extra">${ctl(p)}</div>`).join('');
  return html + `</div><canvas class="forge-node-preview" width="64" height="64" aria-hidden="true"></canvas>`;
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
 * THE SHELF: surfaces kept by name in this browser (localStorage), to open
 * again, export as a file, or bring in from one. A kept surface is the same
 * graph JSON a look carries in forgeGraph.
 */
export const FORGE_SHELF_KEY = 'uv.forge.kept.v1';
export function forgeShelf(){
  try { const a = JSON.parse(localStorage.getItem(FORGE_SHELF_KEY) || '[]'); return Array.isArray(a) ? a.filter(r => r && typeof r.name === 'string' && typeof r.graph === 'string') : []; }
  catch(e){ return []; }
}
export function forgeShelfWrite(list){
  try { localStorage.setItem(FORGE_SHELF_KEY, JSON.stringify(list)); return true; } catch(e){ return false; }
}

/**
 * Opens the Athanor over the page. deps: { $, textures: [ids], stitches: [ids],
 * onSave(json), preview(json, canvas), steps(json, paint), use(), ask(opts) →
 * Promise<bool>, prompt(opts) → Promise<string|null>, sound(name),
 * validate(json) → { ok, graph, problems }, warn(problems), lock (an icon) }.
 * The graph is read from and written back to deps.$('forgeGraph').
 *
 * HOW IT IS HANDLED (Ruby: precise pokes are not a thing on a phone):
 *  - a node moves only by its title bar, unless pinned (the lock in its bar);
 *    a drag anywhere else on the grid — on a node's body too — pans the view
 *  - a long press (or a right-click, or a node's ⋯) opens a menu of what the
 *    thing under the finger can do. When several things are under it (two
 *    wires, a port by a slider) it first asks which was meant, each named and
 *    in its own colour
 *  - a wire is cut by tapping it (✂ appears where it was tapped), from its
 *    menu, or with Delete
 *  - WIRING WITHOUT DRAGGING (Ruby: drawing wires on a phone is hard): hold a
 *    part (or a port) → "Wire from it…" (or "…into it"); a bar says what is
 *    being wired; then tap or hold the other part and choose its port from a
 *    list, each in its colour, the ones that carry the same kind first
 *  - a starter or a texture opened from "Start from…" says what it teaches
 */
export async function openForge(deps){
  const { $ } = deps;
  const veil = $('forgeVeil'), area = $('forgeCanvas'), palette = $('forgePalette'), status = $('forgeStatus');
  if(!veil || !area) return;
  veil.hidden = false;
  if(document.body && document.body.classList) document.body.classList.add('forge-open');
  const ok = await loadDrawflow();
  if(!ok){ if(status) status.textContent = 'The node editor could not be loaded (offline?). Try again when connected.'; return; }
  const F = openForge;
  F.deps = deps;
  const sound = name => { if(F.quiet || !deps.sound) return; try { deps.sound(name); } catch(e){} };
  const ask = o => deps.ask ? deps.ask(o) : Promise.resolve(true);
  const promptFor = o => deps.prompt ? deps.prompt(o) : Promise.resolve(null);
  if(!F.editor){
    const ed = F.editor = new Drawflow(area);
    // zoom in small steps (Drawflow's 0.1 a wheel-notch is far too quick on a trackpad or a pinch)
    ed.reroute = true; ed.curvature = 0.4; ed.zoom_min = 0.3; ed.zoom_max = 1.8; ed.zoom_value = 0.04;
    ed.draggable_inputs = false;                         // a slider slides; it never drags its node
    ed.start();
    const lists = { textures: deps.textures || [], stitches: deps.stitches || [], lock: deps.lock || '' };
    const nodesOf = () => ((ed.export().drawflow || {}).Home || {}).data || {};
    const rawNodes = () => ((ed.drawflow.drawflow || {})[ed.module] || {}).data || {};
    const nodeOf = id => rawNodes()[id];
    const labelOf = id => { const n = nodeOf(id); return n ? ((FORGE_NODES[n.name] || {}).label || n.name) : '?'; };
    const isPinned = id => { const n = nodeOf(id); return !!(n && n.data && n.data._pin); };
    // ---- colour: ports and wires by what travels on them; rows show which params a wire drives ----
    const paintNode = id => {
      const el = area.querySelector('#node-' + id), n = ed.getNodeFromId(id), N = n && FORGE_NODES[n.name]; if(!el || !N) return;
      el.style.setProperty('--cat', FORGE_CAT_COLOURS[N.cat] || '#999');
      el.classList.toggle('pinned', !!(n.data && n.data._pin));
      const pin = el.querySelector('.forge-pin'); if(pin){ pin.classList.toggle('locked', !!(n.data && n.data._pin)); pin.title = n.data && n.data._pin ? 'Pinned — tap to let it move' : 'Pin in place'; }
      el.querySelectorAll('.inputs .input').forEach((d, j) => { d.dataset.t = N.inTypes[j] || 'field'; d.classList.toggle('pp', j >= N.dataIns); d.title = (N.ins[j] || '') + ' — ' + (FORGE_TYPE_NAMES[N.inTypes[j]] || ''); });
      el.querySelectorAll('.outputs .output').forEach((d, j) => { d.dataset.t = N.outTypes[j] || 'field'; d.title = (N.outs[j] || '') + ' — ' + (FORGE_TYPE_NAMES[N.outTypes[j]] || ''); });
      el.querySelectorAll('.forge-param output').forEach(o => { const inp = o.parentElement.querySelector('input'); if(inp) o.textContent = inp.value; });
      N.paramPorts.forEach((key, j) => { const wired = ((n.inputs['input_' + (N.dataIns + j + 1)] || {}).connections || []).length > 0;
        const row = el.querySelector(`.forge-param[data-p="${key}"]`); if(!row) return; row.classList.toggle('wired', wired);
        const own = n.data && n.data['~' + key], o = row.querySelector('output');
        if(o && wired) o.textContent = own ? String(own).replace(/\s*,\s*/, '–') : 'all'; });
    };
    // every wire: its colour (what it carries), and a wide, invisible twin that is easy to tap
    const paintWires = () => area.querySelectorAll('svg.connection').forEach(svg => {
      const c = svg.getAttribute('class') || '', a = /node_out_node-(\d+)/.exec(c), o = /output_(\d+)/.exec(c); if(!a || !o) return;
      const n = ed.getNodeFromId(a[1]), N = n && FORGE_NODES[n.name]; svg.dataset.t = (N && N.outTypes[+o[1] - 1]) || 'field';
      const vis = svg.children[0]; if(!vis) return;
      let hit = svg.querySelector('.forge-hit');
      if(!hit){ hit = document.createElementNS('http://www.w3.org/2000/svg', 'path'); hit.setAttribute('class', 'main-path forge-hit'); svg.appendChild(hit); }
      hit.setAttribute('d', vis.getAttribute('d') || '');
    });
    const paintAll = () => { Object.keys(nodesOf()).forEach(paintNode); paintWires(); };
    F.paintAll = paintAll;
    area.addEventListener('input', e => { const o = e.target.parentElement && e.target.parentElement.querySelector('output'); if(o && e.target.type === 'range') o.textContent = e.target.value; });
    // ---- saving, the previews ----
    let thumbT = 0, stepsT = 0;
    const previews = () => {
      clearTimeout(thumbT); thumbT = setTimeout(() => { const c = $('forgePreview'); if(c && deps.preview) try { deps.preview(($('forgeGraph') || {}).value, c); } catch(e){} }, 250);
      clearTimeout(stepsT);
      if(area.classList.contains('steps-on') && deps.steps) stepsT = setTimeout(() => { try { deps.steps(($('forgeGraph') || {}).value, paintSteps); } catch(e){} }, 450);
    };
    const paintSteps = (sheet, ids, t, cols) => ids.forEach((id, i) => { const cv = area.querySelector(`#node-${id} .forge-node-preview`); if(!cv) return;
      const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(sheet, (i % cols)*t, Math.floor(i/cols)*t, t, t, 0, 0, cv.width, cv.height); });
    // saved without each node's face (it is drawn again from the parts list on
    // load): a graph stays small, and an old graph gets the newest controls
    // (and with its VERSION: a graph loaded keeps its own, a new one is the newest — athanor.js)
    const slim = () => { const g = ed.export(); for(const n of Object.values(((g.drawflow || {}).Home || {}).data || {})) n.html = ''; g.v = F.version || ATHANOR_VERSION; return g; };
    const faces = g => { F.version = athanorVersion(g);
      for(const n of Object.values(((g.drawflow || {}).Home || {}).data || {})){ const P = FORGE_NODES[n.name]; if(!P) continue;
        n.html = forgeNodeHtml(n.name, lists, n.data || {}); n.class = forgeCatClass(P.cat);
        // every port the part has, wired or not (a starter, or a part that gained one, lists only its wires)
        n.inputs = n.inputs || {}; n.outputs = n.outputs || {};
        P.ins.forEach((_, j) => { n.inputs['input_' + (j + 1)] = n.inputs['input_' + (j + 1)] || { connections: [] }; });
        P.outs.forEach((_, j) => { n.outputs['output_' + (j + 1)] = n.outputs['output_' + (j + 1)] || { connections: [] }; }); }
      return g; };
    F.faces = faces;
    const save = () => { const json = JSON.stringify(slim()); const f = $('forgeGraph'); if(f){ f.value = json; } if(deps.onSave) deps.onSave(json); if(status){ status.textContent = describeForge(json); status.title = status.textContent; } previews(); };
    F.save = save;
    // what has changed since the graph was opened or loaded (the guards ask only then)
    const touched = () => { F.dirty = true; };
    ed.on('nodeCreated', id => { paintNode(id); save(); touched(); sound('nodeAdd'); });
    ed.on('nodeRemoved', () => { save(); touched(); sound('nodeRemove'); });
    ed.on('connectionCreated', c => { paintNode(c.input_id); paintWires(); save(); touched(); sound('wireConnect'); });
    ed.on('connectionRemoved', c => { paintNode(c.input_id); save(); touched(); sound('wireDisconnect'); hideCut(); });
    ed.on('nodeMoved', () => { paintWires(); save(); });
    ed.on('nodeDataChanged', () => { save(); touched(); });
    ed.on('import', () => setTimeout(paintAll, 0));
    const load = (g, keepDirty) => { const was = F.dirty; F.quiet = true; ed.clear(); ed.import(faces(g)); F.quiet = false; paintAll(); save(); F.dirty = keepDirty ? was : false; };
    F.load = load;
    // a node's face drawn again from its data (a param bound or unbound changes its control)
    const reface = id => {
      const n = nodeOf(id), box = area.querySelector('#node-' + id + ' .drawflow_content_node'); if(!n || !box) return;
      n.html = forgeNodeHtml(n.name, lists, n.data || {}); box.innerHTML = n.html;
      for(const [k, v] of Object.entries(n.data || {})) box.querySelectorAll('[df-' + CSS.escape(k) + ']').forEach(el => { el.value = v; });
      paintNode(id);
    };
    // change a node's settings (undefined removes one): its face, the save, the previews
    const setData = (id, patch) => {
      const n = nodeOf(id); if(!n) return;
      const d = Object.assign({}, n.data || {}, patch); for(const k of Object.keys(patch)) if(patch[k] === undefined) delete d[k];
      n.data = d; reface(id); save(); touched();
    };
    const add = (type, x, y, data) => {
      const N = FORGE_NODES[type]; if(!N) return null;
      const rect = area.getBoundingClientRect(), z = ed.zoom || 1;
      // tapped in from the palette: near the middle, each a little further along (never stacked)
      const k = (F.placed = (F.placed || 0) + 1) % 9, cols = rect.width > 700 ? 3 : 1;
      const px = x !== undefined ? x : (rect.width/2 - ed.canvas_x)/z - 300*(cols > 1 ? 1 : 0.3) + (k % cols)*230 + Math.floor(k/cols)*14,
            py = y !== undefined ? y : (rect.height/2 - ed.canvas_y)/z - 160 + Math.floor(k/cols)*150 + (k % cols)*10 - (cols > 1 ? 0 : 200);
      return ed.addNode(type, N.ins.length, N.outs.length, px, py, forgeCatClass(N.cat), Object.assign(forgeNodeData(type), data || {}), forgeNodeHtml(type, lists, data || {}));
    };
    // a point on the screen, as a place on the grid (the grid scales about its middle)
    const toGrid = (cx, cy) => {
      const r = area.getBoundingClientRect(), z = ed.zoom || 1, mx = r.width/2, my = r.height/2;
      return { x: (cx - r.left - ed.canvas_x - mx)/z + mx, y: (cy - r.top - ed.canvas_y - my)/z + my };
    };
    // ---- the palette: categories that fold; tap to add in the middle, or drag onto the canvas (with a mouse) ----
    const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
    if(palette){
      palette.innerHTML = FORGE_CATEGORIES.map(cat => `<details class="forge-cat" open style="--cat:${FORGE_CAT_COLOURS[cat]}"><summary><span aria-hidden="true">${FORGE_CAT_GLYPHS[cat] || ''}</span> ${forgeEsc(cat)}</summary>` +
        Object.entries(FORGE_NODES).filter(([, n]) => n.cat === cat).map(([type, n]) => `<button type="button" class="forge-part"${finePointer ? ' draggable="true"' : ''} data-type="${type}">${forgeEsc(n.label)}</button>`).join('') + `</details>`).join('');
      palette.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b){ add(b.dataset.type); setParts(false); } });
      palette.addEventListener('dragstart', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b && e.dataTransfer) e.dataTransfer.setData('text/forge', b.dataset.type); });
    }
    // on a phone the parts are a drawer (＋ Parts), so the grid has the whole screen
    const partsBtn = $('forgePartsBtn');
    const setParts = open => { if(!partsBtn) return; veil.classList.toggle('parts-open', open); partsBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    if(partsBtn) partsBtn.addEventListener('click', () => setParts(!veil.classList.contains('parts-open')));
    area.addEventListener('dragover', e => e.preventDefault());
    area.addEventListener('drop', e => { e.preventDefault(); const type = e.dataTransfer && e.dataTransfer.getData('text/forge'); if(!type) return;
      const p = toGrid(e.clientX, e.clientY); add(type, p.x, p.y); });
    // ---- moving: a node only by its title bar (and not when pinned); anywhere else, the grid pans ----
    ed.on('clickEnd', e => {
      const t = e && e.target; if(!t || !t.closest) return;
      const nodeEl = t.closest('.drawflow-node'); if(!nodeEl) return;
      if(t.closest('.forge-node-btn')){ ed.drag = false; return; }
      if(t.closest('.forge-node-title')){ if(isPinned(nodeEl.id.slice(5))) ed.drag = false; return; }
      ed.drag = false;
      if(!t.closest('input, select, textarea, button, .input, .output, output')) ed.editor_selected = true;
    });
    // the title bar's pin and menu
    area.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('.forge-node-btn'); if(!b) return;
      const nodeEl = b.closest('.drawflow-node'); if(!nodeEl) return; const id = nodeEl.id.slice(5);
      e.preventDefault(); e.stopPropagation();
      if(b.dataset.act === 'pin'){ setData(id, { _pin: isPinned(id) ? undefined : true }); }
      else { const r = b.getBoundingClientRect(); openMenu(r.left, r.bottom, nodeMenu(id)); }
    });
    // ---- the guards: deleting work asks first (a node that carries settings or wires, once anything has changed) ----
    const carries = id => { const n = ed.getNodeFromId(id); if(!n) return false; const N = FORGE_NODES[n.name];
      const wired = [...Object.values(n.inputs || {}), ...Object.values(n.outputs || {})].some(p => (p.connections || []).length);
      const changed = N && N.params.some(p => n.data && n.data[p[0]] !== undefined && String(n.data[p[0]]) !== String(p[3]));
      return wired || changed; };
    const removeAsked = async id => {
      if(F.dirty && carries(id)){
        const label = labelOf(id);
        if(!await ask({ title: `Remove the ${label}?`, body: 'Its settings and its wires go with it.', confirmLabel: 'Remove', danger: true })) return;
      }
      ed.removeNodeId('node-' + id);
    };
    // ---- wires: tap one and ✂ appears where it was tapped ----
    const cut = $('forgeCut'), body = area.parentElement;
    let lastPt = { x: 0, y: 0 };
    area.addEventListener('pointerdown', e => { lastPt = { x: e.clientX, y: e.clientY }; }, true);
    function hideCut(){ if(cut) cut.hidden = true; area.querySelectorAll('svg.connection .main-path.selected').forEach(p => p.classList.remove('selected')); }
    const wireOf = svg => { const c = svg.getAttribute('class') || '';
      const i = /node_in_node-(\d+)/.exec(c), o = /node_out_node-(\d+)/.exec(c), oc = /\b(output_\d+)\b/.exec(c), ic = /\b(input_\d+)\b/.exec(c);
      return i && o && oc && ic ? { inId: i[1], outId: o[1], output: oc[1], input: ic[1] } : null; };
    const cutWire = w => { if(w) ed.removeSingleConnection(w.outId, w.inId, w.output, w.input); hideCut(); };
    ed.on('connectionSelected', () => {
      const p = ed.connection_selected; if(!p || !cut || !body) return;
      p.parentElement.querySelectorAll('.main-path').forEach(x => x.classList.add('selected'));
      const r = body.getBoundingClientRect();
      cut.style.left = Math.round(lastPt.x - r.left + 10) + 'px'; cut.style.top = Math.round(lastPt.y - r.top - 38) + 'px'; cut.hidden = false;
      F.cutWire = wireOf(p.parentElement);
    });
    ed.on('connectionUnselected', hideCut);
    ed.on('nodeSelected', hideCut);
    if(cut) cut.addEventListener('click', () => { cutWire(F.cutWire); });
    document.addEventListener('keydown', e => {
      if(veil.hidden) return;
      if(e.key === 'Escape' && menu && !menu.hidden){ e.preventDefault(); closeMenu(); return; }
      if(e.key === 'Escape' && pending){ e.preventDefault(); stopWire(); return; }
      if(!(e.key === 'Delete' || e.key === 'Backspace')) return;
      const t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if(ed.connection_selected){ e.preventDefault(); e.stopImmediatePropagation(); cutWire(wireOf(ed.connection_selected.parentElement)); return; }
      if(ed.node_selected){ e.preventDefault(); e.stopImmediatePropagation(); removeAsked(String(ed.node_selected.id).replace('node-', '')); }
    }, true);
    for(const evName of ['mousedown', 'touchstart']) area.addEventListener(evName, e => {
      const d = e.target.closest && e.target.closest('.drawflow-delete'); if(!d) return;
      const nodeEl = d.closest('.drawflow-node'); if(!nodeEl) return;            // a wire's ✕: let it go
      e.preventDefault(); e.stopImmediatePropagation(); removeAsked(nodeEl.id.replace('node-', ''));
    }, true);

    // ---- THE MENU: what the thing under a long press (or a right-click) can do ----
    const menu = $('forgeMenu');
    let menuStack = [];
    const closeMenu = () => { if(menu){ menu.hidden = true; menu.innerHTML = ''; } menuStack = []; };
    F.closeMenu = closeMenu;
    const drawMenu = () => {
      const m = menuStack[menuStack.length - 1]; if(!m || !menu) return;
      menu.innerHTML = `<div class="forge-menu-head">${menuStack.length > 1 ? '<button type="button" class="forge-menu-back" aria-label="Back">‹</button>' : ''}<span>${forgeEsc(m.title)}</span>`
        + `<button type="button" class="forge-menu-x" aria-label="Close">✕</button></div>`
        + (m.hint ? `<p class="forge-menu-hint">${forgeEsc(m.hint)}</p>` : '')
        + m.items.map((it, i) => it.sep ? '<hr>' : `<button type="button" class="forge-menu-item${it.danger ? ' danger' : ''}${it.sub ? ' has-sub' : ''}" data-i="${i}"${it.disabled ? ' disabled' : ''}`
          + `${it.colour ? ` style="--mc:${it.colour}"` : ''}><span class="mi-glyph" aria-hidden="true">${forgeEsc(it.glyph || '')}</span><span class="mi-label">${forgeEsc(it.label)}</span>`
          + `${it.hint ? `<small>${forgeEsc(it.hint)}</small>` : ''}</button>`).join('');
      const first = menu.querySelector('.forge-menu-item:not([disabled])'); if(first && finePointer) first.focus();
    };
    const openMenu = (x, y, m) => {
      if(!menu || !m) return; menuStack = [m]; menu.hidden = false; drawMenu();
      // beside the finger on a desk; a sheet from the bottom on a phone (CSS)
      const r = veil.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
      menu.style.left = Math.max(6, Math.min(r.width - w - 6, x - r.left + 4)) + 'px';
      menu.style.top = Math.max(6, Math.min(r.height - h - 6, y - r.top + 4)) + 'px';
    };
    if(menu){
      menu.addEventListener('click', e => {
        const b = e.target.closest && e.target.closest('button'); if(!b) return;
        if(b.classList.contains('forge-menu-x')){ closeMenu(); return; }
        if(b.classList.contains('forge-menu-back')){ menuStack.pop(); drawMenu(); return; }
        const it = (menuStack[menuStack.length - 1] || { items: [] }).items[+b.dataset.i]; if(!it || it.disabled) return;
        if(it.sub){ menuStack.push(typeof it.sub === 'function' ? it.sub() : it.sub); drawMenu(); return; }
        closeMenu(); if(it.act) it.act();
      });
      document.addEventListener('pointerdown', e => { if(!menu.hidden && !menu.contains(e.target)) closeMenu(); }, true);
    }
    // what each thing is called in a menu, and its colour
    const N_ = id => FORGE_NODES[(nodeOf(id) || {}).name] || null;
    const wireDesc = w => { const a = N_(w.outId), b = N_(w.inId); const oi = +w.output.slice(7) - 1, ii = +w.input.slice(6) - 1;
      return { label: `${labelOf(w.outId)} → ${labelOf(w.inId)}`, hint: `${(a && a.outs[oi]) || ''} into ${(b && b.ins[ii]) || ''}`, colour: `var(--t-${(a && a.outTypes[oi]) || 'field'})`, glyph: '〰' }; };
    // ---- WIRING BY MENU: choose one end, then the other (no dragging) ----
    let pending = null;                                        // { from: 'out' | 'in', id, port: 'output_k' | 'input_k' }
    const pendBar = (() => { let el = $('forgePending'); if(!el && body){ el = document.createElement('div'); el.id = 'forgePending'; el.className = 'forge-pending'; el.hidden = true; el.setAttribute('role', 'status'); body.appendChild(el); } return el; })();
    const portInfo = (id, side, j) => { const N = N_(id); return N ? { name: side === 'out' ? N.outs[j] : N.ins[j], t: (side === 'out' ? N.outTypes[j] : N.inTypes[j]) || 'field' } : { name: '?', t: 'field' }; };
    const showPending = () => { if(!pendBar) return;
      if(!pending){ pendBar.hidden = true; pendBar.innerHTML = ''; return; }
      const j = +pending.port.replace(/\D+/g, '') - 1, P = portInfo(pending.id, pending.from, j);
      pendBar.innerHTML = `<i style="background:var(--t-${P.t})"></i><span>${pending.from === 'out'
        ? `Wiring from ${forgeEsc(labelOf(pending.id))}\u2019s <b>${forgeEsc(P.name)}</b>: tap or hold the part it goes into.`
        : `Wiring into ${forgeEsc(labelOf(pending.id))}\u2019s <b>${forgeEsc(P.name)}</b>: tap or hold the part it comes from.`}</span><button type="button" class="forge-pending-x">Cancel</button>`;
      pendBar.hidden = false; };
    const startWire = (from, id, port) => { pending = { from, id: String(id), port }; showPending(); area.classList.add('wiring'); hideCut(); };
    const stopWire = () => { pending = null; showPending(); area.classList.remove('wiring'); };
    F.stopWire = stopWire; F.startWire = startWire; F.pending = () => pending;
    if(pendBar) pendBar.addEventListener('click', e => { if(e.target.closest && e.target.closest('.forge-pending-x')) stopWire(); });
    // an input takes one wire: a new one replaces what was there
    const connect = (outId, output, inId, input) => {
      const n = nodeOf(inId); if(!n) return;
      for(const c of [...(((n.inputs || {})[input] || {}).connections || [])]) ed.removeSingleConnection(c.node, inId, c.input, input);
      ed.addConnection(outId, inId, output, input); stopWire();
    };
    // the other end: the ports of the part chosen, those carrying the same kind first (others are converted on the way)
    const connectMenu = id => {
      if(!pending) return null;
      const N = N_(id), n = nodeOf(id); if(!N || !n) return null;
      if(String(id) === pending.id) return { title: 'That is the same part', hint: 'Choose another part to wire to.', items: [{ glyph: '✕', label: 'Stop wiring', act: stopWire }] };
      const j0 = +pending.port.replace(/\D+/g, '') - 1, from = portInfo(pending.id, pending.from, j0);
      const side = pending.from === 'out' ? 'in' : 'out', list = (side === 'in' ? N.ins : N.outs).map((name, j) => {
        const t = (side === 'in' ? N.inTypes[j] : N.outTypes[j]) || 'field', key = (side === 'in' ? 'input_' : 'output_') + (j + 1);
        const wired = side === 'in' && ((((n.inputs || {})[key] || {}).connections || []).length > 0);
        return { j, t, key, same: t === from.t, glyph: side === 'in' ? (j >= N.dataIns ? '⚙' : '▸') : '◂', label: String(name).replace(/^⚙\s*/, ''), colour: `var(--t-${t})`,
          hint: (FORGE_TYPE_NAMES[t] || '') + (t === from.t ? '' : ' (converted)') + (wired ? ' — replaces its wire' : ''),
          act: () => side === 'in' ? connect(pending.id, pending.port, String(id), key) : connect(String(id), key, pending.id, pending.port) }; });
      if(!list.length) return { title: labelOf(id), hint: side === 'in' ? 'It takes nothing in.' : 'It gives nothing out.', items: [{ glyph: '✕', label: 'Stop wiring', act: stopWire }] };
      list.sort((a, b) => (b.same - a.same) || (a.j - b.j));
      return { title: side === 'in' ? `Into ${labelOf(id)}…` : `From ${labelOf(id)}…`, hint: `${from.name}: ${FORGE_TYPE_NAMES[from.t]}`, items: [...list, { sep: true }, { glyph: '✕', label: 'Stop wiring', act: stopWire }] };
    };
    // "Wire from it…" / "Wire into it…": straight away when there is one port, else a list of them
    const wireStart = (id, side) => { const N = N_(id); if(!N) return null; const names = side === 'out' ? N.outs : N.ins;
      const go = j => startWire(side, id, (side === 'out' ? 'output_' : 'input_') + (j + 1));
      if(names.length === 1) return { act: () => go(0) };
      return { sub: () => ({ title: side === 'out' ? `Wire from ${labelOf(id)}: which?` : `Wire into ${labelOf(id)}: which?`, items: names.map((name, j) => { const t = (side === 'out' ? N.outTypes[j] : N.inTypes[j]) || 'field';
        return { glyph: side === 'out' ? '◂' : (j >= N.dataIns ? '⚙' : '▸'), label: String(name).replace(/^⚙\s*/, ''), hint: FORGE_TYPE_NAMES[t], colour: `var(--t-${t})`, act: () => go(j) }; }) }) }; };
    // while wiring, a TAP on another part chooses it (a pointer that goes down and up in place:
    // a phone's tap never reaches the grid as a click; a hold is answered by the menu instead)
    let tapAt = null;
    area.addEventListener('pointerdown', e => { tapAt = pending ? { x: e.clientX, y: e.clientY, t: Date.now() } : null; }, true);
    area.addEventListener('pointerup', e => {
      const t0 = tapAt; tapAt = null; if(!pending || !t0 || answered) return;
      if(Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > 10 || Date.now() - t0.t > 500) return;
      const el = document.elementFromPoint(e.clientX, e.clientY), nodeEl = el && el.closest && el.closest('.drawflow-node'); if(!nodeEl) return;
      if(el.closest('input, select, textarea')) return;
      const id = nodeEl.id.slice(5); if(id === pending.id) return;
      e.preventDefault(); const x = e.clientX, y = e.clientY; setTimeout(() => openMenu(x, y, connectMenu(id)), 0);
    }, true);
    // ---- menus for each kind of thing ----
    const wireMenu = w => { const d = wireDesc(w); return { title: 'A wire', hint: d.label + ' (' + d.hint + ')', items: [
      { glyph: '✂', label: 'Cut this wire', act: () => cutWire(w) }] }; };
    const nodeMenu = id => { const n = nodeOf(id), N = N_(id); if(!n || !N) return null;
      const wires = [...Object.values(n.inputs || {}), ...Object.values(n.outputs || {})].reduce((a, p) => a + ((p.connections || []).length), 0);
      const from = N.outs.length ? wireStart(id, 'out') : null, into = N.ins.length ? wireStart(id, 'in') : null;
      return { title: labelOf(id), hint: N.cat, items: [
        ...(from ? [{ glyph: '⟿', label: 'Wire from it…', hint: N.outs.length === 1 ? N.outs[0] : 'choose which', ...from }] : []),
        ...(into ? [{ glyph: '⟾', label: 'Wire into it…', hint: 'choose which', ...into }] : []),
        ...(from || into ? [{ sep: true }] : []),
        { glyph: '⌖', label: isPinned(id) ? 'Let it move again' : 'Pin it in place', act: () => setData(id, { _pin: isPinned(id) ? undefined : true }) },
        { glyph: '⧉', label: 'Make a copy', act: () => { const d = JSON.parse(JSON.stringify(n.data || {})); delete d._pin; add(n.name, n.pos_x + 30, n.pos_y + 40, d); } },
        { glyph: '↺', label: 'Every setting back to its default', disabled: !N.params.length, act: () => { const d = forgeNodeData(n.name); const patch = {};
            for(const k of Object.keys(n.data || {})) if(k[0] !== '_') patch[k] = undefined; Object.assign(patch, d); setData(id, patch); } },
        { glyph: '✂', label: wires ? `Cut its ${wires} wire${wires === 1 ? '' : 's'}` : 'No wires to cut', disabled: !wires, act: () => { ed.removeConnectionNodeId('node-' + id); paintNode(id); save(); touched(); } },
        { sep: true },
        { glyph: '✕', label: 'Remove it', danger: true, act: () => removeAsked(id) }] }; };
    const portMenu = (id, side, j) => { const n = nodeOf(id), N = N_(id); if(!n || !N) return null;
      const key = (side === 'in' ? 'input_' : 'output_') + (j + 1), p = (side === 'in' ? n.inputs : n.outputs)[key] || { connections: [] }, cnt = (p.connections || []).length;
      const name = side === 'in' ? N.ins[j] : N.outs[j], t = side === 'in' ? N.inTypes[j] : N.outTypes[j];
      return { title: `${labelOf(id)}: ${name}`, hint: `${side === 'in' ? 'Takes' : 'Gives'} ${FORGE_TYPE_NAMES[t] || ''}`, items: [
        side === 'out' ? { glyph: '⟿', label: 'Wire this to…', hint: 'then tap the part it goes into', act: () => startWire('out', id, key) }
          : { glyph: '⟾', label: cnt ? 'Wire something else into this…' : 'Wire something into this…', hint: 'then tap the part it comes from', act: () => startWire('in', id, key) },
        { glyph: '✂', label: cnt ? (cnt === 1 ? 'Cut its wire' : `Cut its ${cnt} wires`) : 'Nothing wired here', disabled: !cnt, act: () => {
          for(const c of [...p.connections]) side === 'in' ? ed.removeSingleConnection(c.node, id, c.input, key) : ed.removeSingleConnection(id, c.node, key, c.output); } }] }; };
    const paramMenu = (id, key) => {
      const n = nodeOf(id), N = N_(id); if(!n || !N) return null;
      const P = N.params.find(p => p[0] === key); if(!P) return null;
      const [, label, kind, def, x] = P, v = (n.data || {})[key], bound = typeof v === 'string' && v[0] === '@';
      const port = N.paramPorts.indexOf(key) >= 0 ? N.dataIns + N.paramPorts.indexOf(key) + 1 : 0;
      const wired = port && (((n.inputs || {})['input_' + port] || {}).connections || []).length > 0;
      const items = [];
      if(kind === 'range'){
        const lo = x.min, hi = x.max;
        if(wired){
          items.push({ glyph: '↔', label: 'Set the range the wire sweeps…', hint: n.data['~' + key] ? String(n.data['~' + key]).replace(',', ' to ') : `all of it: ${lo} to ${hi}`, act: async () => {
            const r = await promptFor({ title: `${label}: the range a wire sweeps`, body: `Two numbers between ${lo} and ${hi}: where it is at the wire's least, and at its most. (They can run backwards.)`, input: true, defaultValue: String(n.data['~' + key] || `${lo}, ${hi}`), confirmLabel: 'Set' });
            const m = r && /(-?[\d.]+)\D+(-?[\d.]+)/.exec(r); if(!m) return; const a = Math.max(lo, Math.min(hi, +m[1])), b = Math.max(lo, Math.min(hi, +m[2]));
            setData(id, { ['~' + key]: (a === lo && b === hi) ? undefined : `${a},${b}` }); } });
          if(n.data['~' + key]) items.push({ glyph: '⟷', label: 'Sweep the whole range again', act: () => setData(id, { ['~' + key]: undefined }) });
          items.push({ glyph: '✂', label: 'Cut the wire into it', act: () => { const p = n.inputs['input_' + port]; for(const c of [...(p.connections || [])]) ed.removeSingleConnection(c.node, id, c.input, 'input_' + port); } });
        } else {
          const bindTo = (src, range) => setData(id, { [key]: '@' + src + (range ? `[${range[0]},${range[1]}]` : '') });
          const curRange = bound ? (/\[([^\]]+)\]/.exec(v) || [])[1] : null;
          items.push({ glyph: '◐', label: 'Bind to a page slider', hint: 'one of the six under Surface', sub: () => ({ title: `${label}: bind to a slider`, hint: 'The slider moves it across its range.', items:
            [1, 2, 3, 4, 5, 6].map(k => ({ glyph: String(k), label: `Slider ${k}`, act: () => bindTo('k' + k, curRange && curRange.split(',')) })) }) });
          items.push({ glyph: '☼', label: 'Bind to the light dial', hint: 'its direction', act: () => bindTo('dial', curRange && curRange.split(',')) });
          if(port){
            items.push({ glyph: '⟾', label: 'Wire something into it…', hint: 'then tap the part it comes from', act: () => startWire('in', id, 'input_' + port) });
            items.push({ glyph: '☽', label: 'Wire a Knob into it', hint: 'a page slider, shown as a node', act: () => wireIn(id, key, port, 'knob') });
            items.push({ glyph: '☼', label: 'Wire the Light Dial into it', act: () => wireIn(id, key, port, 'dial') });
          }
          if(bound){
            items.push({ glyph: '↔', label: 'Set its range…', hint: curRange ? curRange.replace(',', ' to ') : `all of it: ${lo} to ${hi}`, act: async () => {
              const r = await promptFor({ title: `${label}: its range`, body: `Two numbers: where it is with the slider (or the dial) at its least, and at its most. Between ${lo} and ${hi}.`, input: true, defaultValue: curRange || `${lo}, ${hi}`, confirmLabel: 'Set' });
              const m = r && /(-?[\d.]+)\D+(-?[\d.]+)/.exec(r); if(!m) return;
              const a = Math.max(lo, Math.min(hi, +m[1])), b = Math.max(lo, Math.min(hi, +m[2]));
              setData(id, { [key]: v.replace(/\[.*$/, '') + `[${a},${b}]` }); } });
            items.push({ glyph: '⊘', label: 'Unbind (a plain number again)', act: () => setData(id, { [key]: def }) });
          }
        }
      }
      items.push({ glyph: '↺', label: `Back to its default (${def})`, act: () => setData(id, { [key]: def }) });
      return { title: `${label}`, hint: `on ${labelOf(id)}` + (wired ? ' — driven by a wire' : bound ? ` — bound: ${v}` : ''), items };
    };
    // a Knob (or the Light Dial) set beside a node and wired into one of its ⚙ ports
    const wireIn = (id, key, port, kind) => {
      const n = nodeOf(id); if(!n) return;
      const P = (N_(id).params.find(p => p[0] === key) || []), x = P[4] || { min: 0, max: 100 };
      const cur = parseFloat(n.data[key]); const at = isFinite(cur) ? Math.round((cur - x.min)/((x.max - x.min) || 1)*100) : 50;
      const used = new Set(Object.values(rawNodes()).filter(m => m.name === 'knob').map(m => String((m.data || {}).slot || '1')));
      const slot = ['1', '2', '3', '4', '5', '6'].find(s => !used.has(s)) || '1';
      const nid = add(kind, n.pos_x - 250, n.pos_y + 10 + (port - 1)*22, kind === 'knob' ? { slot, name: P[1] || 'Amount', def: Math.max(0, Math.min(100, at)) } : {});
      if(nid != null) ed.addConnection(nid, id, 'output_1', 'input_' + port);
    };
    const canvasMenu = (cx, cy) => { const g = toGrid(cx, cy); return { title: 'The grid', items: [
      { glyph: '＋', label: 'Add a part here', sub: () => ({ title: 'Add a part here', items: FORGE_CATEGORIES.map(cat => ({ glyph: FORGE_CAT_GLYPHS[cat] || '', label: cat, colour: FORGE_CAT_COLOURS[cat],
        sub: () => ({ title: cat, items: Object.entries(FORGE_NODES).filter(([, nn]) => nn.cat === cat).map(([type, nn]) => ({ glyph: FORGE_CAT_GLYPHS[cat] || '', label: nn.label, colour: FORGE_CAT_COLOURS[cat], act: () => add(type, g.x, g.y) })) }) })) }) },
      { glyph: '⌖', label: 'Everything in view', act: () => fitView() },
      { glyph: '▦', label: 'Tidy into columns', hint: 'pinned nodes stay put', act: () => tidy() }] }; };
    // ---- what is under a point: the things there, nearest first ----
    const thingAt = el => {
      if(!el || !area.contains(el)) return null;
      if(el.classList && el.classList.contains('main-path')){ const w = wireOf(el.parentElement); return w ? { kind: 'wire', key: 'w' + w.outId + w.output + w.inId + w.input, w } : null; }
      const nodeEl = el.closest && el.closest('.drawflow-node'); if(!nodeEl) return null; const id = nodeEl.id.slice(5);
      const port = el.closest('.input, .output');
      if(port){ const side = port.classList.contains('input') ? 'in' : 'out'; const j = [...port.parentElement.children].indexOf(port);
        const N = N_(id); if(side === 'in' && N && j >= N.dataIns){ return { kind: 'param', key: 'p' + id + N.paramPorts[j - N.dataIns], id, p: N.paramPorts[j - N.dataIns] }; }
        return { kind: 'port', key: 'o' + id + side + j, id, side, j }; }
      const row = el.closest('.forge-param'); if(row) return { kind: 'param', key: 'p' + id + row.dataset.p, id, p: row.dataset.p };
      return { kind: 'node', key: 'n' + id, id };
    };
    const thingsNear = (x, y, r) => {
      const found = new Map(), pts = [[0, 0]];
      if(r) for(let a = 0; a < 8; a++) pts.push([Math.cos(a*Math.PI/4)*r, Math.sin(a*Math.PI/4)*r]);
      for(const [dx, dy] of pts){ const d = Math.hypot(dx, dy);
        for(const el of document.elementsFromPoint(x + dx, y + dy)){ const t = thingAt(el); if(!t) continue;
          if(!found.has(t.key) || found.get(t.key).d > d) found.set(t.key, { ...t, d }); break; } }
      const rank = { param: 0, port: 1, wire: 2, node: 3 };
      return [...found.values()].sort((a, b) => (a.d - b.d) || (rank[a.kind] - rank[b.kind]));
    };
    const menuFor = (t, x, y) => t.kind === 'wire' ? wireMenu(t.w) : t.kind === 'node' ? nodeMenu(t.id) : t.kind === 'port' ? portMenu(t.id, t.side, t.j) : t.kind === 'param' ? paramMenu(t.id, t.p) : canvasMenu(x, y);
    const describe = t => {
      if(t.kind === 'wire') return wireDesc(t.w);
      const N = N_(t.id), colour = N ? FORGE_CAT_COLOURS[N.cat] : '';
      if(t.kind === 'node') return { glyph: N ? FORGE_CAT_GLYPHS[N.cat] : '', label: `The ${labelOf(t.id)} node`, hint: 'move, pin, copy, remove', colour };
      if(t.kind === 'param'){ const P = N.params.find(p => p[0] === t.p) || []; return { glyph: '⚙', label: P[1] || t.p, hint: `a setting on ${labelOf(t.id)}`, colour: 'var(--t-value)' }; }
      const name = t.side === 'in' ? N.ins[t.j] : N.outs[t.j], ty = t.side === 'in' ? N.inTypes[t.j] : N.outTypes[t.j];
      return { glyph: t.side === 'in' ? '▸' : '◂', label: `${labelOf(t.id)}'s ${name}`, hint: `${t.side === 'in' ? 'takes' : 'gives'} ${FORGE_TYPE_NAMES[ty]}`, colour: `var(--t-${ty})` };
    };
    // a long press: one thing → its menu; several close together → which did you mean?
    const menuAt = (x, y, touch) => {
      if(touch){ ed.drag = false; ed.editor_selected = false; if(ed.connection){ ed.connection = false; if(ed.connection_ele){ ed.connection_ele.remove(); ed.connection_ele = null; } } }
      hideCut();
      const all = thingsNear(x, y, touch ? 18 : 5);
      // while wiring: the part held is the other end
      if(pending){ const t = all.find(q => q.id && q.id !== pending.id);
        openMenu(x, y, t ? connectMenu(t.id) : { title: 'Wiring', hint: 'Tap or hold the part to wire to.', items: [{ glyph: '✕', label: 'Stop wiring', act: stopWire }] }); return; }
      const own = all.length > 1 && all[0].kind !== 'node' ? all.filter(t => !(t.kind === 'node' && t.id === all[0].id)) : all;
      if(!own.length){ openMenu(x, y, canvasMenu(x, y)); return; }
      if(own.length === 1){ const m = menuFor(own[0], x, y); if(m && own[0].kind !== 'node' && own[0].id){ m.items.push({ sep: true }, { glyph: '◇', label: `The ${labelOf(own[0].id)} node`, sub: () => nodeMenu(own[0].id) }); } openMenu(x, y, m); return; }
      openMenu(x, y, { title: 'Which did you mean?', hint: 'Several things are under your finger.', items: own.slice(0, 6).map(t => ({ ...describe(t), sub: () => menuFor(t, x, y) })) });
    };
    F.menuAt = menuAt;
    // right-click, or a phone's own long press (it sends a contextmenu); a timer for the browsers that don't
    // one menu per press: whichever comes first (the timer, or the browser's own contextmenu) answers it
    let pressT = 0, pressAt = null, answered = false;
    area.addEventListener('contextmenu', e => {
      if(e.target.closest && e.target.closest('input[type=text], textarea')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if(answered) return;
      answered = true; clearTimeout(pressT); menuAt(e.clientX, e.clientY, F.lastTouch);
    }, true);
    area.addEventListener('pointerdown', e => {
      answered = false;
      F.lastTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
      if(!F.lastTouch || (e.target.closest && e.target.closest('input, select, textarea'))) return;
      pressAt = { x: e.clientX, y: e.clientY }; clearTimeout(pressT);
      pressT = setTimeout(() => { if(answered || !pressAt) return; answered = true; menuAt(pressAt.x, pressAt.y, true); }, 560);
    }, true);
    area.addEventListener('pointermove', e => { if(pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 10) clearTimeout(pressT); }, true);
    for(const ev of ['pointerup', 'pointercancel']) area.addEventListener(ev, () => { clearTimeout(pressT); pressAt = null; }, true);
    // ---- the view: everything in sight, and tidying ----
    const fitView = () => {
      const els = [...area.querySelectorAll('.drawflow-node')]; const r = area.getBoundingClientRect(); if(!r.width) return;
      if(!els.length){ ed.zoom = 1; ed.zoom_last_value = 1; ed.canvas_x = 0; ed.canvas_y = 0; }
      else {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for(const el of els){ const x = parseFloat(el.style.left) || 0, y = parseFloat(el.style.top) || 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + el.offsetWidth); y1 = Math.max(y1, y + el.offsetHeight); }
        const dock = $('forgeDock'), dw = dock && !dock.hidden ? dock.offsetWidth + 16 : 0, pad = 24;
        const W = r.width - dw, H = r.height, z = Math.max(ed.zoom_min, Math.min(1, (W - pad*2)/(x1 - x0), (H - pad*2)/(y1 - y0)));
        const mx = r.width/2, my = r.height/2;
        ed.zoom = z; ed.zoom_last_value = z;
        // the grid scales about its middle: place the nodes' corner at (pad, pad), centred in what is left
        const fx = pad + Math.max(0, (W - pad*2 - (x1 - x0)*z)/2), fy = pad + Math.max(0, (H - pad*2 - (y1 - y0)*z)/2);
        ed.canvas_x = fx - mx - (x0 - mx)*z; ed.canvas_y = fy - my - (y0 - my)*z;
      }
      ed.precanvas.style.transform = `translate(${ed.canvas_x}px, ${ed.canvas_y}px) scale(${ed.zoom})`;
    };
    F.fitView = fitView;
    const tidy = () => {
      const g = slim(), data = g.drawflow.Home.data, pins = {};
      for(const [id, n] of Object.entries(data)) if(n.data && n.data._pin) pins[id] = [n.pos_x, n.pos_y];
      layoutAthanor(data); for(const [id, p] of Object.entries(pins)){ data[id].pos_x = p[0]; data[id].pos_y = p[1]; }
      load(g, true); touched(); setTimeout(fitView, 30);
    };
    // ---- the bar ----
    const count = () => Object.keys(nodesOf()).length;
    if($('forgeClear')) $('forgeClear').addEventListener('click', async () => {
      if(count() && F.dirty && !await ask({ title: 'Clear the whole graph?', body: 'Every node and wire goes. (Revert brings back the graph as it was when the Athanor opened.)', confirmLabel: 'Clear', danger: true })) return;
      F.quiet = true; ed.clear(); F.quiet = false; F.version = ATHANOR_VERSION; save(); F.dirty = false; sound('nodeRemove');
    });
    if($('forgeRevert')) $('forgeRevert').addEventListener('click', async () => {
      if(!F.opened) return;
      if(F.dirty && !await ask({ title: 'Go back to how it was?', body: 'Everything changed since the Athanor opened is undone.', confirmLabel: 'Revert', danger: true })) return;
      load(JSON.parse(F.opened)); sound('graphLoad'); setTimeout(fitView, 30);
    });
    // open a graph (a starter, a template, a kept surface) in place of this one — asking first if this one has changed
    const openGraph = async (g, label, teach) => {
      if(count() && F.dirty && !await ask({ title: `Replace this graph with “${label}”?`, body: 'The graph on the grid now is set aside. (Revert brings back the graph as it was when the Athanor opened.)', confirmLabel: 'Replace', danger: true })) return false;
      stopWire(); load(g); sound('graphLoad'); setTimeout(fitView, 30); showNote(label, teach); return true;
    };
    // WHAT A GRAPH TEACHES: a note over the grid when a starter or a texture is opened
    const note = (() => { let el = $('forgeNote'); if(!el && body){ el = document.createElement('div'); el.id = 'forgeNote'; el.className = 'forge-note'; el.hidden = true; body.appendChild(el); } return el; })();
    const showNote = (label, teach) => { if(!note) return; if(!teach){ note.hidden = true; return; }
      note.innerHTML = `<b>${forgeEsc(label)}</b><p>${forgeEsc(teach)}</p><p class="forge-note-how">Read it left to right: each part shows what it makes; every wire carries it on. Hold a part to see what it can do.</p><button type="button" class="forge-note-x" aria-label="Close">✕</button>`;
      note.hidden = false; };
    F.showNote = showNote;
    if(note) note.addEventListener('click', e => { if(e.target.closest && e.target.closest('.forge-note-x')) note.hidden = true; });
    // the starters: a working graph to take apart, and Vellum's own textures as their chains of steps
    const st = $('forgeStarter');
    if(st){
      st.innerHTML = '<option value="">Start from…</option>'
        + '<optgroup label="Starters">' + Object.entries(ATHANOR_STARTERS).map(([k, v]) => `<option value="${k}">${forgeEsc(v.label)}</option>`).join('') + '</optgroup>'
        + '<optgroup label="PoetryPress textures">' + Object.entries(TEXTURE_CHAINS).map(([k, v]) => `<option value="${k}">${forgeEsc(v.label)}</option>`).join('') + '</optgroup>';
      st.addEventListener('change', async () => {
        const k = st.value; st.value = ''; const g = athanorStarter(k); if(!g) return;
        const S = ATHANOR_STARTERS[k] || TEXTURE_CHAINS[k]; await openGraph(g, S.label, S.teach);
      });
    }
    // ---- the shelf: keep a surface by name, open one kept, carry them as a file ----
    const surfaceName = () => { const s = Object.values(rawNodes()).find(n => n.name === 'surface'); return ((s && s.data && s.data.name) || 'My Surface').trim(); };
    const keep = async () => {
      if(!count()){ if(deps.warn) deps.warn(['there is nothing on the grid to keep']); return; }
      const name = await promptFor({ title: 'Keep this surface?', body: 'Give it a name. It stays on this browser’s shelf, to open again.', input: true, defaultValue: surfaceName(), confirmLabel: 'Keep' });
      const clean = String(name || '').trim().slice(0, 60); if(!clean) return;
      const list = forgeShelf(), at = list.findIndex(r => r.name.toLowerCase() === clean.toLowerCase());
      if(at >= 0 && !await ask({ title: `Replace the kept “${list[at].name}”?`, body: 'A surface on the shelf already has that name.', confirmLabel: 'Replace', danger: true })) return;
      const rec = { name: clean, graph: JSON.stringify(slim()), savedAt: new Date().toISOString() };
      if(at >= 0) list[at] = rec; else list.push(rec);
      if(!forgeShelfWrite(list)){ if(deps.warn) deps.warn(['this browser would not keep it (storage is full or blocked)']); return; }
      sound('nodeAdd'); if(deps.onShelf) deps.onShelf();
    };
    const openKept = async rec => {
      const v = deps.validate ? deps.validate(rec.graph) : { ok: true, graph: JSON.parse(rec.graph), problems: [] };
      if(!v.ok){ if(deps.refuse) deps.refuse('That kept surface can’t be opened', v.problems.join('; ') + '. Nothing was changed.'); return; }
      if(v.problems.length && deps.warn) deps.warn(v.problems);
      await openGraph(v.graph, rec.name);
    };
    const dropKept = async rec => {
      if(!await ask({ title: `Take “${rec.name}” off the shelf?`, body: 'It is gone from this browser. (Looks that use it keep their own copy.)', confirmLabel: 'Take it off', danger: true })) return;
      forgeShelfWrite(forgeShelf().filter(r => r.name !== rec.name)); if(deps.onShelf) deps.onShelf();
    };
    const exportShelf = () => {
      const blob = new Blob([JSON.stringify({ kind: 'unfixable-vellum-surfaces', surfaces: forgeShelf() }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vellum-surfaces.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    const importShelf = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.addEventListener('change', async () => {
        const f = inp.files && inp.files[0]; if(!f) return;
        if(f.size > 4*1024*1024){ if(deps.refuse) deps.refuse('That file is too large', 'A shelf file is at most 4 MB. Nothing was changed.'); return; }
        let data; try { data = JSON.parse(await f.text()); } catch(e){ if(deps.refuse) deps.refuse('That isn’t readable JSON', 'Nothing was changed.'); return; }
        const incoming = Array.isArray(data) ? data : (data && Array.isArray(data.surfaces) ? data.surfaces : []);
        const list = forgeShelf(); let added = 0, bad = 0;
        for(const r of incoming){ if(!r || typeof r.name !== 'string' || typeof r.graph !== 'string'){ bad++; continue; }
          const v = deps.validate ? deps.validate(r.graph) : { ok: true, graph: JSON.parse(r.graph) }; if(!v.ok){ bad++; continue; }
          const rec = { name: r.name.trim().slice(0, 60) || 'Surface', graph: JSON.stringify(v.graph), savedAt: r.savedAt || new Date().toISOString() };
          const at = list.findIndex(x => x.name.toLowerCase() === rec.name.toLowerCase()); if(at >= 0) list[at] = rec; else list.push(rec); added++; }
        forgeShelfWrite(list); if(deps.onShelf) deps.onShelf();
        if(deps.warn) deps.warn([`${added} surface${added === 1 ? '' : 's'} put on the shelf` + (bad ? `, ${bad} left out (unreadable)` : '')]);
      });
      inp.click();
    };
    const shelfMenu = () => { const list = forgeShelf(); return { title: 'Kept surfaces', hint: list.length ? 'Kept in this browser.' : 'Nothing kept yet.', items: [
      { glyph: '✚', label: 'Keep this surface…', act: keep },
      ...(list.length ? [{ sep: true }] : []),
      ...list.slice().reverse().map(rec => ({ glyph: '🜉', label: rec.name, hint: String(rec.savedAt || '').slice(0, 10), sub: () => ({ title: rec.name, items: [
        { glyph: '⇩', label: 'Open it', act: () => openKept(rec) },
        { glyph: '✕', label: 'Take it off the shelf', danger: true, act: () => dropKept(rec) }] }) })),
      { sep: true },
      { glyph: '⇪', label: 'Save the shelf as a file', disabled: !list.length, act: exportShelf },
      { glyph: '⇣', label: 'Bring surfaces in from a file…', act: importShelf }] }; };
    if($('forgeKeptBtn')) $('forgeKeptBtn').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); openMenu(r.left, r.bottom + 4, shelfMenu()); });
    if($('forgeUseBtn') && deps.use) $('forgeUseBtn').addEventListener('click', () => deps.use());
    if($('forgeZoomIn')) $('forgeZoomIn').addEventListener('click', () => ed.zoom_in());
    if($('forgeZoomOut')) $('forgeZoomOut').addEventListener('click', () => ed.zoom_out());
    if($('forgeFit')) $('forgeFit').addEventListener('click', () => fitView());
    // the step previews: each node shows what it makes (worked out in the texture worker); off while you work, if you like
    const sp = $('forgeSteps');
    if(sp){ try { sp.checked = localStorage.getItem('uv.forge.steps') !== '0'; } catch(e){ sp.checked = true; }
      area.classList.toggle('steps-on', sp.checked);
      sp.addEventListener('change', () => { area.classList.toggle('steps-on', sp.checked); try { localStorage.setItem('uv.forge.steps', sp.checked ? '1' : '0'); } catch(e){} previews(); }); }
    // the preview: tap for large, tap again for small
    const pv = $('forgePreview'); if(pv) pv.addEventListener('click', () => { const d = $('forgeDock'); if(d) d.classList.toggle('big'); });
    // the help: what each colour carries, and the few things worth knowing
    const hb = $('forgeHelpBtn'), hp = $('forgeHelp');
    if(hb && hp) hb.addEventListener('click', () => { hp.hidden = !hp.hidden; hb.setAttribute('aria-expanded', hp.hidden ? 'false' : 'true'); });
    const lg = $('forgeLegend');
    if(lg) lg.innerHTML = Object.entries(FORGE_TYPE_COLOURS).map(([t]) => `<span><i style="background:var(--t-${t})"></i>${forgeEsc(FORGE_TYPE_NAMES[t])}</span>`).join('')
      + `<span><i class="pp" style="background:var(--t-value)"></i>⚙ a setting that takes a wire</span>`;
  }
  // the graph saved with the look (checked first: a graph from anywhere can't break the page), or a first one
  const ed = F.editor;
  let saved = null; const raw = ($('forgeGraph') || {}).value || '';
  if(raw){ const v = deps.validate ? deps.validate(raw) : { ok: true, graph: JSON.parse(raw), problems: [] };
    if(v.ok) saved = v.graph; if(v.problems && v.problems.length && deps.warn) deps.warn(v.problems); }
  if(saved && saved.drawflow) F.load(saved);
  else { F.quiet = true; ed.clear(); F.version = ATHANOR_VERSION; F.quiet = false;
    const add = (type, x, y) => { const N = FORGE_NODES[type]; ed.addNode(type, N.ins.length, N.outs.length, x, y, forgeCatClass(N.cat), forgeNodeData(type), forgeNodeHtml(type, { textures: deps.textures || [], stitches: deps.stitches || [], lock: deps.lock || '' })); };
    F.quiet = true; add('noise', 40, 60); add('surface', 420, 90); F.quiet = false; F.paintAll(); F.save(); }
  F.opened = JSON.stringify(ed.export());
  F.dirty = false;
  setTimeout(() => { if(F.fitView) F.fitView(); }, 40);
}
export function closeForge(deps){
  const veil = deps.$('forgeVeil'); if(veil){ veil.hidden = true; veil.classList.remove('parts-open'); }
  if(openForge.closeMenu) openForge.closeMenu();
  if(openForge.stopWire) openForge.stopWire();
  if(document.body && document.body.classList) document.body.classList.remove('forge-open');
}
