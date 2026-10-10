/**
 * forge.js — THE CRUCIBLE (the alchemist's vessel; in plain words, a forge for
 * new surfaces): a node editor for making new surfaces out of the
 * pieces Vellum already has (generators, noises, the light engine, stitches,
 * blends, hues, the six knobs, the dial, the seed). The graph is made into a
 * texture by crucible.js (in the texture worker); it shows as "The Crucible"
 * at the bottom of Surface Variant.
 *
 * Built on Drawflow (jerosoler/Drawflow, MIT): vanilla JS, touch-friendly,
 * small — loaded only when the Crucible is first opened. Its graph (Drawflow's
 * own export JSON) is kept in the hidden #forgeGraph field, so it is saved,
 * loaded, shared and shown in the JSON like every other setting.
 *
 * No imports of app state: the page hands in what it needs (deps).
 */

const FORGE_DF_JS  = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
const FORGE_DF_CSS = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.css';

// ---- the parts: every node a primitive Vellum already has ----
// ports: in/out names (Drawflow numbers them; the names are drawn on the node)
// params: [key, label, kind, default, extra] — kind: range (min,max), select (options), hue
const FORGE_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const FORGE_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
export const FORGE_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'darken', 'lighten', 'color-dodge', 'color-burn',
  'difference', 'exclusion', 'vivid-light', 'linear-light', 'pin-light', 'linear-burn', 'subtract', 'divide'];
export const FORGE_NODES = {
  // inputs: what the finished texture offers on the page
  knob:     { cat: 'Inputs', label: 'Knob', ins: [], outs: ['value'], params: [FORGE_SEL('slot', 'Slider', ['1','2','3','4','5','6']), ['name', 'Name', 'text', 'Amount'], FORGE_R('def', 'Default', 50)] },
  hue:      { cat: 'Inputs', label: 'Hue', ins: [], outs: ['colour'], params: [FORGE_SEL('slot', 'Hue', ['1','2']), ['name', 'Name', 'text', 'Light Hue']] },
  dial:     { cat: 'Inputs', label: 'Light Dial', ins: [], outs: ['direction', 'height'], params: [] },
  seed:     { cat: 'Inputs', label: 'Seed', ins: [], outs: ['seed'], params: [] },
  page:     { cat: 'Inputs', label: 'Page Coordinates', ins: [], outs: ['x', 'y', 'radius'], params: [] },
  // makers
  noise:    { cat: 'Noise', label: 'Value Noise', ins: ['seed'], outs: ['field'], params: [FORGE_R('scale', 'Scale', 40, 1, 200), FORGE_R('octaves', 'Octaves', 3, 1, 6)] },
  cells:    { cat: 'Noise', label: 'Cells', ins: ['seed'], outs: ['distance', 'edges', 'id'], params: [FORGE_R('scale', 'Scale', 30, 2, 200), FORGE_R('jitter', 'Jitter', 80)] },
  waves:    { cat: 'Noise', label: 'Waves', ins: ['warp'], outs: ['field'], params: [FORGE_R('freq', 'Frequency', 12, 1, 120), FORGE_R('angle', 'Angle', 0, 0, 360)] },
  gradient: { cat: 'Noise', label: 'Gradient', ins: [], outs: ['field'], params: [FORGE_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular']), FORGE_R('angle', 'Angle', 90, 0, 360)] },
  turing:   { cat: 'Noise', label: 'Reaction–Diffusion', ins: ['seed'], outs: ['field'], params: [FORGE_SEL('pattern', 'Pattern', ['spots', 'coral', 'maze', 'worms', 'holes']), FORGE_R('scale', 'Scale', 100, 50, 250)] },
  texture:  { cat: 'Textures', label: 'Vellum Texture', ins: ['seed'], outs: ['image', 'grey'], params: [['type', 'Texture', 'texture', 'linen'], FORGE_R('p1', 'Knob 1', 100, 0, 400), FORGE_R('p2', 'Knob 2', 100, 0, 400), FORGE_R('p3', 'Knob 3', 50)] },
  stitch:   { cat: 'Textures', label: 'Stitch Border', ins: [], outs: ['mask'], params: [['style', 'Stitch', 'stitch', 'scallop'], FORGE_R('offset', 'Offset', 14, 0, 400), FORGE_R('size', 'Size', 4, 1, 40)] },
  // shaping
  levels:   { cat: 'Shape', label: 'Levels', ins: ['field'], outs: ['field'], params: [FORGE_R('lo', 'Low', 0), FORGE_R('hi', 'High', 100), FORGE_R('gamma', 'Gamma', 50)] },
  threshold:{ cat: 'Shape', label: 'Threshold', ins: ['field'], outs: ['mask'], params: [FORGE_R('at', 'At', 50), FORGE_R('soft', 'Softness', 10)] },
  blur:     { cat: 'Shape', label: 'Blur', ins: ['field'], outs: ['field'], params: [FORGE_R('radius', 'Radius', 8, 0, 100)] },
  warp:     { cat: 'Shape', label: 'Warp', ins: ['field', 'by'], outs: ['field'], params: [FORGE_R('amount', 'Amount', 20)] },
  math:     { cat: 'Shape', label: 'Math', ins: ['a', 'b'], outs: ['result'], params: [FORGE_SEL('op', 'Operation', ['add', 'multiply', 'max', 'min', 'difference', 'subtract'])] },
  mix:      { cat: 'Shape', label: 'Mix', ins: ['a', 'b', 'amount'], outs: ['result'], params: [FORGE_R('t', 'Amount', 50)] },
  invert:   { cat: 'Shape', label: 'Invert', ins: ['field'], outs: ['field'], params: [] },
  // light and colour
  light:    { cat: 'Light & Colour', label: 'Light (heights)', ins: ['height', 'dial'], outs: ['light', 'highlight'], params: [FORGE_R('relief', 'Relief', 50), FORGE_R('gloss', 'Gloss', 30), FORGE_R('shadow', 'Shadow', 60)] },
  tint:     { cat: 'Light & Colour', label: 'Tint', ins: ['field', 'light hue', 'dark hue'], outs: ['image'], params: [] },
  ramp:     { cat: 'Light & Colour', label: 'Colour Ramp', ins: ['field', 'colour a', 'colour b'], outs: ['image'], params: [FORGE_R('mid', 'Middle', 50)] },
  blend:    { cat: 'Light & Colour', label: 'Blend', ins: ['base', 'layer', 'mask'], outs: ['image'], params: [FORGE_SEL('mode', 'Mode', FORGE_BLENDS), FORGE_R('opacity', 'Opacity', 100)] },
  // the end
  surface:  { cat: 'Output', label: 'Surface', ins: ['image', 'height'], outs: [], params: [['name', 'Name', 'text', 'My Surface'], FORGE_SEL('ground', 'Ground', ['grey', 'colour'])] },
};
export const FORGE_CATEGORIES = ['Inputs', 'Noise', 'Textures', 'Shape', 'Light & Colour', 'Output'];

// ---- a node's face: its params as small controls bound with df-* ----
const forgeEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function forgeNodeHtml(type, lists = {}){
  const N = FORGE_NODES[type]; if(!N) return '';
  const ports = (names, cls) => names.length ? `<div class="forge-ports ${cls}">${names.map(n => `<span>${forgeEsc(n)}</span>`).join('')}</div>` : '';
  const ctl = ([key, label, kind, def, x]) => {
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
    if(!nodes.length) return 'Empty — open the Crucible to begin.';
    let wires = 0; for(const n of nodes) for(const o of Object.values(n.outputs || {})) wires += (o.connections || []).length;
    const out = nodes.find(n => n.name === 'surface');
    return `${nodes.length} node${nodes.length === 1 ? '' : 's'}, ${wires} wire${wires === 1 ? '' : 's'}` + (out ? ` → “${(out.data || {}).name || 'Surface'}”` : ' (no Surface yet)');
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
 * Opens the Crucible over the page. deps: { $, textures: [ids], stitches: [ids], onSave(json) }.
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
    ed.reroute = true; ed.curvature = 0.4; ed.zoom_min = 0.3; ed.zoom_max = 1.8;
    ed.start();
    const lists = { textures: deps.textures || [], stitches: deps.stitches || [] };
    let thumbT = 0;
    const thumb = json => { clearTimeout(thumbT); thumbT = setTimeout(() => { const c = $('forgeThumb'); if(c && deps.preview) try { deps.preview(json, c); } catch(e){} }, 250); };
    // saved without each node's face (it is drawn again from the parts list on
    // load): a graph stays small, and an old graph gets the newest controls
    const slim = () => { const g = ed.export(); for(const n of Object.values(((g.drawflow || {}).Home || {}).data || {})) n.html = ''; return g; };
    const faces = g => { for(const n of Object.values(((g.drawflow || {}).Home || {}).data || {})){ if(FORGE_NODES[n.name]){ n.html = forgeNodeHtml(n.name, lists); n.class = n.class || 'forge-' + FORGE_NODES[n.name].cat.toLowerCase().replace(/[^a-z]+/g, '-'); } } return g; };
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
    else { add('noise', 40, 60); add('surface', 420, 90); }
    openForge.save = save; openForge.add = add;
    if($('forgeClear')) $('forgeClear').addEventListener('click', () => { ed.clear(); save(); });
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
