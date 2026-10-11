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
  let html = `<div class="forge-node-title"><span class="forge-node-glyph" aria-hidden="true">${FORGE_CAT_GLYPHS[N.cat] || ''}</span>${forgeEsc(N.label)}</div><div class="forge-rows">`;
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
 * Opens the Athanor over the page. deps: { $, textures: [ids], stitches: [ids],
 * onSave(json), preview(json, canvas), steps(json, paint), use(), ask(opts) →
 * Promise<bool>, sound(name), validate(json) → { ok, graph, problems } }.
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
  const F = openForge;
  F.deps = deps;
  const sound = name => { if(F.quiet || !deps.sound) return; try { deps.sound(name); } catch(e){} };
  const ask = o => deps.ask ? deps.ask(o) : Promise.resolve(true);
  if(!F.editor){
    const ed = F.editor = new Drawflow(area);
    // zoom in small steps (Drawflow's 0.1 a wheel-notch is far too quick on a trackpad or a pinch)
    ed.reroute = true; ed.curvature = 0.4; ed.zoom_min = 0.3; ed.zoom_max = 1.8; ed.zoom_value = 0.04;
    ed.start();
    const lists = { textures: deps.textures || [], stitches: deps.stitches || [] };
    const nodesOf = () => ((ed.export().drawflow || {}).Home || {}).data || {};
    // ---- colour: ports and wires by what travels on them; rows show which params a wire drives ----
    const paintNode = id => {
      const el = area.querySelector('#node-' + id), n = ed.getNodeFromId(id), N = n && FORGE_NODES[n.name]; if(!el || !N) return;
      el.style.setProperty('--cat', FORGE_CAT_COLOURS[N.cat] || '#999');
      el.querySelectorAll('.inputs .input').forEach((d, j) => { d.dataset.t = N.inTypes[j] || 'field'; d.classList.toggle('pp', j >= N.dataIns); d.title = (N.ins[j] || '') + ' — ' + (FORGE_TYPE_NAMES[N.inTypes[j]] || ''); });
      el.querySelectorAll('.outputs .output').forEach((d, j) => { d.dataset.t = N.outTypes[j] || 'field'; d.title = (N.outs[j] || '') + ' — ' + (FORGE_TYPE_NAMES[N.outTypes[j]] || ''); });
      N.paramPorts.forEach((key, j) => { const wired = ((n.inputs['input_' + (N.dataIns + j + 1)] || {}).connections || []).length > 0;
        const row = el.querySelector(`.forge-param[data-p="${key}"]`); if(row) row.classList.toggle('wired', wired); });
      el.querySelectorAll('.forge-param output').forEach(o => { const inp = o.parentElement.querySelector('input'); if(inp) o.textContent = inp.value; });
    };
    const paintWires = () => area.querySelectorAll('svg.connection').forEach(svg => {
      const c = svg.getAttribute('class') || '', a = /node_out_node-(\d+)/.exec(c), o = /output_(\d+)/.exec(c); if(!a || !o) return;
      const n = ed.getNodeFromId(a[1]), N = n && FORGE_NODES[n.name]; svg.dataset.t = (N && N.outTypes[+o[1] - 1]) || 'field';
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
    const save = () => { const json = JSON.stringify(slim()); const f = $('forgeGraph'); if(f){ f.value = json; } if(deps.onSave) deps.onSave(json); if(status) status.textContent = describeForge(json); previews(); };
    F.save = save;
    // what has changed since the graph was opened or loaded (the guards ask only then)
    const touched = () => { F.dirty = true; };
    ed.on('nodeCreated', id => { paintNode(id); save(); touched(); sound('nodeAdd'); });
    ed.on('nodeRemoved', () => { save(); touched(); sound('nodeRemove'); });
    ed.on('connectionCreated', c => { paintNode(c.input_id); paintWires(); save(); touched(); sound('wireConnect'); });
    ed.on('connectionRemoved', c => { paintNode(c.input_id); save(); touched(); sound('wireDisconnect'); });
    ed.on('nodeMoved', () => save());
    ed.on('nodeDataChanged', () => { save(); touched(); });
    ed.on('import', () => setTimeout(paintAll, 0));
    const load = g => { F.quiet = true; ed.clear(); ed.import(faces(g)); F.quiet = false; paintAll(); save(); F.dirty = false; };
    F.load = load;
    const add = (type, x, y) => {
      const N = FORGE_NODES[type]; if(!N) return;
      const rect = area.getBoundingClientRect(), z = ed.zoom || 1;
      // tapped in from the palette: near the middle, each a little further along (never stacked)
      const k = (F.placed = (F.placed || 0) + 1) % 9, cols = rect.width > 700 ? 3 : 1;
      const px = x !== undefined ? x : (rect.width/2 - ed.canvas_x)/z - 300*(cols > 1 ? 1 : 0.3) + (k % cols)*230 + Math.floor(k/cols)*14,
            py = y !== undefined ? y : (rect.height/2 - ed.canvas_y)/z - 160 + Math.floor(k/cols)*150 + (k % cols)*10 - (cols > 1 ? 0 : 200);
      ed.addNode(type, N.ins.length, N.outs.length, px, py, forgeCatClass(N.cat), forgeNodeData(type), forgeNodeHtml(type, lists));
    };
    // ---- the palette: categories that fold; tap to add in the middle, or drag onto the canvas ----
    if(palette){
      palette.innerHTML = FORGE_CATEGORIES.map(cat => `<details class="forge-cat" open style="--cat:${FORGE_CAT_COLOURS[cat]}"><summary><span aria-hidden="true">${FORGE_CAT_GLYPHS[cat] || ''}</span> ${forgeEsc(cat)}</summary>` +
        Object.entries(FORGE_NODES).filter(([, n]) => n.cat === cat).map(([type, n]) => `<button type="button" class="forge-part" draggable="true" data-type="${type}">${forgeEsc(n.label)}</button>`).join('') + `</details>`).join('');
      palette.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b) add(b.dataset.type); });
      palette.addEventListener('dragstart', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b && e.dataTransfer) e.dataTransfer.setData('text/forge', b.dataset.type); });
    }
    area.addEventListener('dragover', e => e.preventDefault());
    area.addEventListener('drop', e => { e.preventDefault(); const type = e.dataTransfer && e.dataTransfer.getData('text/forge'); if(!type) return;
      const rect = area.getBoundingClientRect(), z = ed.zoom || 1; add(type, (e.clientX - rect.left - ed.canvas_x)/z, (e.clientY - rect.top - ed.canvas_y)/z); });
    // ---- the guards: deleting work asks first (a node that carries settings or wires, once anything has changed) ----
    const carries = id => { const n = ed.getNodeFromId(id); if(!n) return false; const N = FORGE_NODES[n.name];
      const wired = [...Object.values(n.inputs || {}), ...Object.values(n.outputs || {})].some(p => (p.connections || []).length);
      const changed = N && N.params.some(p => n.data && n.data[p[0]] !== undefined && String(n.data[p[0]]) !== String(p[3]));
      return wired || changed; };
    const removeAsked = async id => {
      if(F.dirty && carries(id)){
        const n = ed.getNodeFromId(id), label = (FORGE_NODES[n.name] || {}).label || n.name;
        if(!await ask({ title: `Remove the ${label}?`, body: 'Its settings and its wires go with it.', confirmLabel: 'Remove', danger: true })) return;
      }
      ed.removeNodeId('node-' + id);
    };
    document.addEventListener('keydown', e => {
      if(veil.hidden || !(e.key === 'Delete' || e.key === 'Backspace')) return;
      const t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if(ed.node_selected){ e.preventDefault(); e.stopImmediatePropagation(); removeAsked(String(ed.node_selected.id).replace('node-', '')); }
    }, true);
    for(const evName of ['mousedown', 'touchstart']) area.addEventListener(evName, e => {
      const d = e.target.closest && e.target.closest('.drawflow-delete'); if(!d) return;
      const nodeEl = d.closest('.drawflow-node'); if(!nodeEl) return;            // a wire's ✕: let it go
      e.preventDefault(); e.stopImmediatePropagation(); removeAsked(nodeEl.id.replace('node-', ''));
    }, true);
    // ---- the bar ----
    const count = () => Object.keys(nodesOf()).length;
    if($('forgeClear')) $('forgeClear').addEventListener('click', async () => {
      if(count() && F.dirty && !await ask({ title: 'Clear the whole graph?', body: 'Every node and wire goes. (Revert brings back the graph as it was when the Athanor opened.)', confirmLabel: 'Clear', danger: true })) return;
      F.quiet = true; ed.clear(); F.quiet = false; F.version = ATHANOR_VERSION; save(); F.dirty = false; sound('nodeRemove');
    });
    if($('forgeRevert')) $('forgeRevert').addEventListener('click', async () => {
      if(!F.opened) return;
      if(F.dirty && !await ask({ title: 'Go back to how it was?', body: 'Everything changed since the Athanor opened is undone.', confirmLabel: 'Revert', danger: true })) return;
      load(JSON.parse(F.opened)); sound('graphLoad');
    });
    // the starters: a working graph to take apart, and Vellum's own textures as their chains of steps
    const st = $('forgeStarter');
    if(st){
      st.innerHTML = '<option value="">Start from…</option>'
        + '<optgroup label="Starters">' + Object.entries(ATHANOR_STARTERS).map(([k, v]) => `<option value="${k}">${forgeEsc(v.label)}</option>`).join('') + '</optgroup>'
        + '<optgroup label="Vellum’s textures">' + Object.entries(TEXTURE_CHAINS).map(([k, v]) => `<option value="${k}">${forgeEsc(v.label)}</option>`).join('') + '</optgroup>';
      st.addEventListener('change', async () => {
        const k = st.value; st.value = ''; const g = athanorStarter(k); if(!g) return;
        const label = (ATHANOR_STARTERS[k] || TEXTURE_CHAINS[k]).label;
        if(count() && F.dirty && !await ask({ title: `Replace this graph with “${label}”?`, body: 'The graph on the grid now is set aside. (Revert brings back the graph as it was when the Athanor opened.)', confirmLabel: 'Replace', danger: true })) return;
        load(g); sound('graphLoad');
      });
    }
    if($('forgeUseBtn') && deps.use) $('forgeUseBtn').addEventListener('click', () => deps.use());
    if($('forgeZoomIn')) $('forgeZoomIn').addEventListener('click', () => ed.zoom_in());
    if($('forgeZoomOut')) $('forgeZoomOut').addEventListener('click', () => ed.zoom_out());
    // the step previews: each node shows what it makes (worked out in the texture worker); off while you work, if you like
    const sp = $('forgeSteps');
    if(sp){ try { sp.checked = localStorage.getItem('uv.forge.steps') !== '0'; } catch(e){ sp.checked = true; }
      area.classList.toggle('steps-on', sp.checked);
      sp.addEventListener('change', () => { area.classList.toggle('steps-on', sp.checked); try { localStorage.setItem('uv.forge.steps', sp.checked ? '1' : '0'); } catch(e){} previews(); }); }
    // the legend: what each colour carries
    const lg = $('forgeLegend');
    if(lg) lg.innerHTML = Object.entries(FORGE_TYPE_COLOURS).map(([t, c]) => `<span><i style="background:${c}"></i>${forgeEsc(FORGE_TYPE_NAMES[t])}</span>`).join('')
      + `<span><i class="pp" style="background:${FORGE_TYPE_COLOURS.value}"></i>⚙ a slider taking a wire</span>`;
  }
  // the graph saved with the look (checked first: a graph from anywhere can't break the page), or a first one
  const ed = F.editor;
  let saved = null; const raw = ($('forgeGraph') || {}).value || '';
  if(raw){ const v = deps.validate ? deps.validate(raw) : { ok: true, graph: JSON.parse(raw), problems: [] };
    if(v.ok) saved = v.graph; if(v.problems && v.problems.length && deps.warn) deps.warn(v.problems); }
  if(saved && saved.drawflow) F.load(saved);
  else { F.quiet = true; ed.clear(); F.version = ATHANOR_VERSION; F.quiet = false;
    const add = (type, x, y) => { const N = FORGE_NODES[type]; ed.addNode(type, N.ins.length, N.outs.length, x, y, forgeCatClass(N.cat), forgeNodeData(type), forgeNodeHtml(type, { textures: deps.textures || [], stitches: deps.stitches || [] })); };
    F.quiet = true; add('noise', 40, 60); add('surface', 420, 90); F.quiet = false; F.paintAll(); F.save(); }
  F.opened = JSON.stringify(ed.export());
  F.dirty = false;
}
export function closeForge(deps){
  const veil = deps.$('forgeVeil'); if(veil) veil.hidden = true;
  if(document.body && document.body.classList) document.body.classList.remove('forge-open');
}
