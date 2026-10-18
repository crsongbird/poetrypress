/**
 * forge.js — THE ATHANOR (the alchemist's furnace; beneath the name, "Surface
 * texture node editor"): a node editor for making new surfaces out of the
 * pieces Vellum already has (generators, noises, the light engine, stitches,
 * blends, hues, the eight knobs, the dial, the seed). The graph is made into a
 * texture by athanor.js (in the texture worker); it shows as "The Athanor"
 * at the bottom of Surface Variant.
 *
 * Built on Drawflow (jerosoler/Drawflow, MIT): vanilla JS, touch-friendly,
 * small — loaded only when the Athanor is first opened. It works on its own
 * graph, the bench (Drawflow's export JSON, kept in this browser); a surface
 * on the page is the look's graph (#forgeGraph), saved and shared with it.
 *
 * No imports of app state: the page hands in what it needs (deps).
 */
import { ATHANOR_STUDIES } from './athanorStudies.js';
import { ATHANOR_VERSION, ATHANOR_LIMITS, ATHANOR_STARTERS, athanorVersion, athanorBudget, athanorStarter, athanorGraphOf, layoutAthanor, ATHANOR_NODE, groupPorts, athanorNamed, athanorNumbered, athanorIsNamed } from './athanor.js';
import { STEPS, STEP_BLENDS, STEP_CATEGORIES, VALUE_TYPES } from './steps.js';
import { TEXTURE_CHAINS } from './chains.js';
import { TEXTURE_GROUPS, ATHANOR_BASICS } from './appOptions.js';
import { KEPT, FORGE_BAR, fill } from './strings.js';
import { wikiArticleHtml, wikiContentsHtml, wikiSearch, wikiTitle, wikiWalkNeighbors, wikiWalks, WIKI_FIGURES } from './athanorWiki.js';

const FORGE_DF_JS  = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
const FORGE_DF_CSS = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.css';

// ---- the parts: every node a step of steps.js (shared with the textures
// rebuilt as chains) — ports, params and category as the editor shows them
export const FORGE_NODES = Object.fromEntries(Object.entries(STEPS).map(([k, s]) => [k, { cat: s.cat, label: s.label, doc: s.doc || '', ins: s.ins, outs: s.outs, params: s.params,
  inTypes: s.inTypes, outTypes: s.outTypes, dataIns: s.dataIns, paramPorts: s.paramPorts, required: s.required || [], maps: s.maps || [], mapsSince: s.mapsSince || {}, hidden: !!s.hidden }]));
export const FORGE_CATEGORIES = STEP_CATEGORIES;
/**
 * COLOUR CARRIES MEANING in the grid, whatever the app's theme: each part's
 * category tints its title (whimsical, as the four elements are), and every
 * port and wire wears the colour of what travels on it — a grey map, a
 * picture, one colour, one number. A ⚙ port (a param taking a wire) is a
 * small diamond in the number's colour.
 */
export const FORGE_TYPE_NAMES = { field: 'a gray map', image: 'a picture', colour: 'one color', value: 'one number', curve: 'a curve' };
/** A PART'S COLOR is the kind of thing it makes (its first output's type), the same color its
 *  output dots and wires wear (Ruby: node, wire and connector colors as data types). The Surface keeps its own. */
export const forgePartColour = N => !N ? '#999' : N.cat === 'Output' ? FORGE_CAT_COLOURS.Output : `var(--t-${(N.outTypes && N.outTypes[0]) || 'field'})`;
export const FORGE_CAT_COLOURS = { 'Inputs': '#E9C46A', 'Noise': '#AE8CFF', 'Marks': '#FF8FB4', 'Textures': '#5ED6C3', 'Shape': '#80B9FF', 'Curves': '#93D98A', 'Combine': '#E6A8D7', 'Light & Color': '#FFB070', 'Output': '#F3ECF8' };
/** THE RIGHT VERB for the hand in use (Ruby: "tap" on a desk is wrong): click with a mouse, tap on touch. */
export function forgeTouch(){ try { return !!(document.body && document.body.classList.contains('is-mobile')) || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches); } catch(e){ return false; } }
export function forgeClick(cap){ const w = forgeTouch() ? 'tap' : 'click'; return cap ? w[0].toUpperCase() + w.slice(1) : w; }
export function forgeHoldWord(){ return forgeTouch() ? 'Hold' : 'Right-click'; }
/** What each category holds, in a line (the parts list and the Help). */
export const FORGE_CAT_DOCS = {
  'Inputs': 'Page values (sliders, hues, accents, light, seed, the poem) and constants.',
  'Noise': 'Generators: noise, cells, patterns, gradients, masks.',
  'Marks': 'Strokes and objects drawn over the input: scatter, rain, hatching, cards.',
  'Textures': 'Larger techniques from the app\'s textures: weave, table, sky, any menu texture.',
  'Shape': 'Filters for gray maps: levels, blur, warp, distort.',
  'Curves': '0–1 curves, and parts that remap through them.',
  'Combine': 'Blending, mixing, switching, and channel split/merge.',
  'Light & Color': 'Coloring and lighting: gradient maps, tints, the Light Engine.',
  'Output': 'The Surface: whatever reaches it is the texture.',
};
/**
 * Each category's NAME as shown, and its GLYPH: a Runology Archetype whose
 * meaning it shares (Symbology's metadata) — Dyna is will and imagination
 * (what the page hands in), Chaos change and the wild (noise), Sound's neume a
 * written mark (marks), Vitrum a stored technique and record (whole
 * textures), Fire conversion and transfer (shaping), Quintessence light and
 * shimmer (light and color), Contract a bond (combining), Creation what is
 * made (the output), and Life (ᘓ), a rune of the Balance tier: a curve weighs
 * light against dark (curves).
 */
export const FORGE_CAT_GLYPHS = { 'Inputs': '🝆', 'Noise': '🝢', 'Marks': '𝀶', 'Textures': '⎐', 'Shape': '🜂', 'Curves': 'ᘓ', 'Combine': 'ᛯ', 'Light & Color': '🜚', 'Output': '🜉' };
export const FORGE_CAT_NAMES = { 'Inputs': 'Page Inputs', 'Noise': 'Noise & Pattern', 'Marks': 'Drawn Marks', 'Textures': 'Whole Textures', 'Shape': 'Shape & Transform', 'Curves': 'Curves', 'Combine': 'Combine & Mask', 'Light & Color': 'Light & Color', 'Output': 'Output' };
export const forgeCatName = cat => FORGE_CAT_NAMES[cat] || cat;
const forgeCatClass = cat => 'forge-' + cat.toLowerCase().replace(/[^a-z]+/g, '-');

// ---- a node's face: ROWS that line up with its ports (each row one port's
// height), so a ⚙ port sits beside the slider it drives; params without a
// port follow; a small preview of the node's own result at the foot ----
const forgeEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// a port's name as shown (the names are the parts' own words; the app speaks American English)
// port names as people read them: 'field' and 'image' are the code's words for a gray map and a picture
export const forgeWord = s => String(s).replace(/colour/g, 'color').replace(/Colour/g, 'Color').replace(/\bgrey\b/g, 'gray').replace(/^field$/, 'map').replace(/^image$/, 'picture');
/**
 * A GROUP as the editor shows it: a part whose ports are its insides' (athanor.js groupPorts) — each Group Input and
 * Knob inside an input, named after it; each result wired to its Group Result an output, of the kind that reaches it.
 * `mod`: the group's module ({ data }), its ports numbered.
 */
export function forgeGroupPart(mod, data = {}){
  const G = FORGE_NODES.group, P = groupPorts(mod), inner = (mod && mod.data) || {};
  const R = Object.values(inner).find(n => n && n.name === 'groupout');
  const outTypes = Array.from({ length: P.outs }, (_, k) => { const c = R && (((R.inputs || {})['input_' + (k + 1)] || {}).connections || [])[0], src = c && inner[String(c.node)];
    const N = src && (src.name === 'group' ? null : FORGE_NODES[src.name]); return (N && N.outTypes[(parseInt(String(c.input).slice(7), 10) || 1) - 1]) || 'image'; });
  return { ...G, label: String(data.name || G.label).slice(0, 32), group: true,
    ins: P.ins.map(m => m.name), inTypes: P.ins.map(m => m.kind), dataIns: P.ins.length, paramPorts: [], required: [],
    outs: Array.from({ length: P.outs }, (_, k) => P.outs > 1 ? 'result ' + (k + 1) : 'result'), outTypes };
}
export function forgeNodeHtml(type, lists = {}, data = {}, part = null){
  const N = part || FORGE_NODES[type]; if(!N) return '';
  const ctl = ([key, label, kind, def, x]) => {
    // a param bound to a slider or the dial ('@k2', '@dial'): shown as written, and editable
    const v = data[key];
    if(typeof v === 'string' && v[0] === '@') return `<label class="forge-param forge-bound" data-p="${key}" title="Bound to a page slider (@k1–@k8) or the light dial (@dial); [lo,hi] sets its range"><span>${forgeEsc(label)}</span><input type="text" df-${key} value="${forgeEsc(v)}"></label>`;
    if(kind === 'range') return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><input type="range" df-${key} min="${x.min}" max="${x.max}" value="${def}"><output>${def}</output></label>`;
    if(kind === 'select') return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><select df-${key}>${x.options.map(o => `<option value="${forgeEsc(o)}">${forgeEsc(forgeWord(o))}</option>`).join('')}</select></label>`;
    if(kind === 'texture' || kind === 'stitch'){ const opts = (kind === 'texture' ? lists.textures : lists.stitches) || [def];
      return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><select df-${key}>${opts.map(o => `<option value="${forgeEsc(o)}">${forgeEsc(o)}</option>`).join('')}</select></label>`; }
    return `<label class="forge-param" data-p="${key}"><span>${forgeEsc(label)}</span><input type="text" df-${key} value="${forgeEsc(def)}"></label>`;
  };
  const rows = Math.max(N.ins.length, N.outs.length), byKey = Object.fromEntries(N.params.map(p => [p[0], p]));
  // the title bar is the handle (a node moves only by it), with a pin and a menu at its end
  let html = `<div class="forge-node-title"><span class="forge-node-glyph" aria-hidden="true">${FORGE_CAT_GLYPHS[N.cat] || ''}</span><span class="forge-node-name">${forgeEsc(N.label)}</span>`
    + `<button type="button" class="forge-node-btn forge-pin" data-act="pin" title="Pin in place" aria-label="Pin in place">${lists.lock || '⌖'}</button>`
    + `<button type="button" class="forge-node-btn" data-act="menu" title="This part’s menu" aria-label="This part’s menu">⋯</button></div><div class="forge-rows">`;

  for(let i = 0; i < rows; i++){
    const left = i < N.dataIns ? `<span class="fp-in" data-t="${N.inTypes[i]}">${forgeEsc(forgeWord(N.ins[i]))}</span>` : i < N.ins.length ? ctl(byKey[N.paramPorts[i - N.dataIns]]) : '<span></span>';
    const right = i < N.outs.length ? `<span class="fp-out" data-t="${N.outTypes[i]}">${forgeEsc(forgeWord(N.outs[i]))}</span>` : '';
    html += `<div class="forge-row">${left}${right}</div>`;
  }
  // (a setting that matters only for some choice of another, `when: 'kind:steps|switch'`, shows only then: paintNode)
  html += N.params.filter(p => !N.paramPorts.includes(p[0])).map(p => `<div class="forge-row extra"${p[4] && p[4].when ? ` data-when="${forgeEsc(p[4].when)}"` : ''}>${ctl(p)}</div>`).join('');
  // (a group opens, to show and change what is inside it)
  if(N.group) html += `<div class="forge-row extra"><button type="button" class="forge-node-btn forge-open-group" data-act="open" title="Open the group to see and edit its parts">Open the group ▸</button></div>`;
  return html + `</div><canvas class="forge-node-preview" width="64" height="64" aria-hidden="true"></canvas>`;
}
/**
 * THE HELP DOCUMENT (the Athanor's Help): how the editor works, in plain
 * instructive language — a teacher explaining to a student. Its last section
 * lists every part with what it does (the parts' own docs, steps.js).
 */
export function forgeHelpHtml(){
  return `<div class="fd-head"><b>The Athanor · Wiki</b><span class="wk-tools"><input type="search" class="wk-search" placeholder="Search the wiki…" aria-label="Search the wiki" autocomplete="off" spellcheck="false">`
    + `<button type="button" class="fd-close wk-contents-btn" data-doc="contents" aria-label="Contents">☰ Contents</button><button type="button" class="fd-close wk-back" data-doc="back" aria-label="Back" disabled>‹ Back</button>`
    + `<button type="button" class="fd-close" data-doc="close" aria-label="Close the wiki">✕ Close</button></span></div>`
    + `<div class="wk-body"><nav class="wk-nav" aria-label="Contents">${wikiContentsHtml(forgeWikiCtx())}</nav><div class="wk-page" tabindex="-1"></div></div>`
    + `<nav class="wk-pager" aria-label="Previous and next page"></nav>`;
}
/** The bar along the wiki's foot: the pages before and after this one, in the contents' order. */
export function forgePagerHtml(id){
  const { prev, next } = wikiWalkNeighbors(id);
  const side = (p, dir) => p ? `<a href="#" class="wk-${dir}" data-wiki="${forgeEsc(p.id)}"><small>${dir === 'prev' ? '‹ Previous' : 'Next ›'}</small><span>${forgeEsc(p.title)}</span></a>` : '<span></span>';
  return side(prev, 'prev') + side(next, 'next');
}
/** What the wiki needs from the editor: category names and lines, and the node limit. */
export function forgeWikiCtx(){ return { catName: forgeCatName, catDoc: c => FORGE_CAT_DOCS[c] || '', categories: FORGE_CATEGORIES.slice(), nodes: ATHANOR_LIMITS.nodes }; }
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
/** Puts a surface on the shelf, in place of one by the same name (any case). */
export function forgeShelfPut(rec){
  const list = forgeShelf(), at = list.findIndex(r => r.name.toLowerCase() === rec.name.toLowerCase());
  if(at >= 0) list[at] = rec; else list.push(rec);
  return forgeShelfWrite(list);
}
// ONE NAME (Ruby): a surface's name is its Surface part's name, and the name it is kept under — the
// same name in both places, always. Keeping it under a new name renames its Surface part.
const forgeSurfaceNode = g => Object.values((((g || {}).drawflow || {}).Home || {}).data || {}).find(n => n && n.name === 'surface') || null;
export function forgeSurfaceNameOf(g){ const n = forgeSurfaceNode(g); return n && n.data && n.data.name ? String(n.data.name).trim() : ''; }
export function forgeNameSurface(g, name){ const n = forgeSurfaceNode(g); if(n) n.data = { ...(n.data || {}), name }; return g; }
/** A surface's wiring as text to copy or share: the shelf file's form (no thumbnails: they are made again). */
export function forgeWiringText(recs){
  return JSON.stringify({ kind: 'unfixable-vellum-surfaces', surfaces: recs.map(r => ({ name: r.name, graph: r.graph, savedAt: r.savedAt })) }, null, 1);
}
/** Surfaces read from text someone pasted or a file: a shelf file, one kept surface, or a bare graph.
 *  Each is checked by validate(json) → { ok, graph }, and named as its Surface part is. null: none at all. */
export function forgeReadSurfaces(text, validate){
  let data; try { data = typeof text === 'string' ? JSON.parse(text.trim()) : text; } catch(e){ return null; }
  const raw = Array.isArray(data) ? data : data && Array.isArray(data.surfaces) ? data.surfaces
    : data && typeof data.graph === 'string' ? [data] : data && data.drawflow ? [{ name: '', graph: JSON.stringify(data) }] : null;
  if(!raw) return null;
  const surfaces = []; let bad = 0;
  for(const r of raw){
    if(!r || typeof r.graph !== 'string'){ bad++; continue; }
    let v; try { v = validate ? validate(r.graph) : { ok: true, graph: JSON.parse(r.graph) }; } catch(e){ v = { ok: false }; }
    if(!v.ok || !v.graph){ bad++; continue; }
    const name = String((typeof r.name === 'string' && r.name.trim()) || forgeSurfaceNameOf(v.graph) || 'Surface').trim().slice(0, 60);
    surfaces.push({ name, graph: JSON.stringify(forgeNameSurface(v.graph, name)), savedAt: r.savedAt || new Date().toISOString() });
  }
  return { surfaces, bad };
}
/** Copies text; false when the browser won't (the caller shows the text instead). */
export async function forgeCopy(text){
  try { if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(text); return true; } } catch(e){}
  try { const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
    const ok = document.execCommand && document.execCommand('copy'); t.remove(); return !!ok; } catch(e){ return false; }
}

/**
 * Opens the Athanor over the page. deps: { $, textures: [ids], stitches: [ids],
 * bench(), setBench(json), unkept(), onSave(json), preview(json, canvas), steps(json, paint), use(), ask(opts) →
 * Promise<bool>, prompt(opts) → Promise<string|null>, sound(name),
 * validate(json) → { ok, graph, problems }, warn(problems), lock (an icon) }.
 * THE BENCH (Ruby: choosing a kept surface for the page must not take away the work in progress): the
 * Athanor works on a graph of its own, deps.bench() / deps.setBench(json). The page's graph is the look's
 * (#forgeGraph); while the page shows the bench's graph, every change to the bench reaches the page too.
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
 *    part (or a port) → "Connect its output…" (or "Connect an input…"); a bar says what is
 *    being wired; then tap or hold the other part and choose its port from a
 *    list, each in its colour, the ones that carry the same kind first
 *  - a starter or a texture opened from Open says what it teaches
 */
export async function openForge(deps){
  const { $ } = deps;
  const veil = $('forgeVeil'), area = $('forgeCanvas'), palette = $('forgePalette'), status = $('forgeStatus');
  if(!veil || !area) return;
  veil.hidden = false;
  if(document.body && document.body.classList) document.body.classList.add('forge-open');
  const ok = await loadDrawflow();
  if(!ok){ if(status) status.textContent = 'The node editor couldn’t load (are you offline?). Try again once connected.'; return; }
  const F = openForge;
  F.deps = deps;
  const sound = name => { if(F.quiet || !deps.sound) return; try { deps.sound(name); } catch(e){} };
  const ask = o => deps.ask ? deps.ask(o) : Promise.resolve(true);
  const promptFor = o => deps.prompt ? deps.prompt(o) : Promise.resolve(null);
  if(!F.editor){
    // Drawflow finds a node's fields by the selector [df-KEY], unescaped; a wire's range ('~relief') is a key too, and
    // '[df-~relief]' is no selector — it threw, and a graph with ranges (Painter's Frustration, Contour Map…) loaded
    // only its first few parts. Such selectors are escaped here (only the [df-…] ones, only when they need it).
    if(typeof Element !== 'undefined' && !Element.prototype.querySelectorAll.__forgeSafe){
      const qsa = Element.prototype.querySelectorAll;
      const safe = function(sel){ const m = typeof sel === 'string' && /^\[df-(.+)\]$/.exec(sel);
        if(m && /[^\w-]/.test(m[1]) && typeof CSS !== 'undefined' && CSS.escape) sel = '[df-' + CSS.escape(m[1]) + ']';
        return qsa.call(this, sel); };
      safe.__forgeSafe = true; Element.prototype.querySelectorAll = safe;
    }
    const ed = F.editor = new Drawflow(area);
    // zoom in small steps (Drawflow's 0.1 a wheel-notch is far too quick on a trackpad or a pinch)
    ed.reroute = true; ed.curvature = 0.4; ed.zoom_min = 0.12; ed.zoom_max = 1.8; ed.zoom_value = 0.04;
    ed.draggable_inputs = false;                         // a slider slides; it never drags its node
    ed.start();
    const lists = { textures: deps.textures || [], stitches: deps.stitches || [], lock: deps.lock || '' };
    // (the module shown: Home, or the inside of the group opened)
    const nodesOf = () => ((ed.export().drawflow || {})[ed.module] || {}).data || {};
    const rawNodes = () => ((ed.drawflow.drawflow || {})[ed.module] || {}).data || {};
    const mods = () => ((ed.drawflow || {}).drawflow) || {};
    // a node's part: its step's, or a group's, from what is inside it
    const partOf = n => !n ? null : n.name === 'group' ? forgeGroupPart(mods()[String((n.data || {}).module || '')], n.data || {}) : FORGE_NODES[n.name];
    const nodeOf = id => rawNodes()[id];
    const labelOf = id => { const n = nodeOf(id); return n ? ((partOf(n) || {}).label || n.name) : '?'; };
    const isPinned = id => { const n = nodeOf(id); return !!(n && n.data && n.data._pin); };
    // ---- colour: ports and wires by what travels on them; rows show which params a wire drives ----
    const paintNode = id => {
      const el = area.querySelector('#node-' + id), n = ed.getNodeFromId(id), N = n && partOf(n); if(!el || !N) return;
      el.style.setProperty('--cat', forgePartColour(N));
      el.classList.toggle('pinned', !!(n.data && n.data._pin));
      el.querySelectorAll('[data-when]').forEach(r => { const [k, vals] = r.dataset.when.split(':'), P = N.params.find(p => p[0] === k);
        r.hidden = !vals.split('|').includes(String((n.data || {})[k] ?? (P ? P[3] : ''))); });
      const pin = el.querySelector('.forge-pin'); if(pin){ pin.classList.toggle('locked', !!(n.data && n.data._pin)); pin.title = n.data && n.data._pin ? `Pinned — ${forgeClick()} to unpin` : 'Pin in place'; }
      el.querySelectorAll('.inputs .input').forEach((d, j) => { d.dataset.t = N.inTypes[j] || 'field'; d.classList.toggle('pp', j >= N.dataIns);
        // a REQUIRED input still empty is marked (Filter Forge's red port): the part has nothing to work on yet
        const need = (N.required || []).includes(j + 1) && !(((n.inputs || {})['input_' + (j + 1)] || {}).connections || []).length;
        d.classList.toggle('req', need); const lab = el.querySelectorAll('.fp-in')[j]; if(lab) lab.classList.toggle('req', need);
        d.title = forgeWord(N.ins[j] || '') + ': an input that takes ' + (FORGE_TYPE_NAMES[N.inTypes[j]] || '') + (need ? ' (required: the part needs it to work)' : ''); });
      el.querySelectorAll('.outputs .output').forEach((d, j) => { d.dataset.t = N.outTypes[j] || 'field'; d.title = forgeWord(N.outs[j] || '') + ': an output that gives ' + (FORGE_TYPE_NAMES[N.outTypes[j]] || ''); });
      el.querySelectorAll('.forge-param output').forEach(o => { const inp = o.parentElement.querySelector('input'); if(inp) o.textContent = inp.value; });
      N.paramPorts.forEach((key, j) => { const wired = ((n.inputs['input_' + (N.dataIns + j + 1)] || {}).connections || []).length > 0;
        const row = el.querySelector(`.forge-param[data-p="${key}"]`); if(!row) return; row.classList.toggle('wired', wired);
        const own = n.data && n.data['~' + key], o = row.querySelector('output');
        if(o && wired) o.textContent = own ? String(own).replace(/\s*,\s*/, '–') : 'all'; });
    };
    // every wire: its colour (what it carries), and a wide, invisible twin that is easy to tap
    const paintWires = () => area.querySelectorAll('svg.connection').forEach(svg => {
      const c = svg.getAttribute('class') || '', a = /node_out_node-(\d+)/.exec(c), o = /output_(\d+)/.exec(c); if(!a || !o) return;
      const n = ed.getNodeFromId(a[1]), N = n && partOf(n); svg.dataset.t = (N && N.outTypes[+o[1] - 1]) || 'field';
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
      clearTimeout(thumbT); thumbT = setTimeout(() => { const c = $('forgePreview'); if(c && deps.preview) try { deps.preview(deps.bench(), c, ($('forgeChannel') || {}).value || 'final'); } catch(e){} }, 250);
      clearTimeout(stepsT);
      if(area.classList.contains('steps-on') && deps.steps) stepsT = setTimeout(() => { try { deps.steps(deps.bench(), paintSteps); } catch(e){} }, 450);
    };
    const paintSteps = (sheet, ids, t, cols) => ids.forEach((id, i) => { const cv = area.querySelector(`#node-${id} .forge-node-preview`); if(!cv) return;
      const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(sheet, (i % cols)*t, Math.floor(i/cols)*t, t, t, 0, 0, cv.width, cv.height); });
    // saved without each node's face (it is drawn again from the parts list on
    // load): a graph stays small, and an old graph gets the newest controls
    // (and with its VERSION: a graph loaded keeps its own, a new one is the newest — athanor.js)
    // (every module: Home and each group's insides; a group's insides no group reaches any more are let go; the ports
    // are saved by name, v5)
    const slim = () => { const g = ed.export(), df = g.drawflow || {};
      for(const M of Object.values(df)) for(const n of Object.values((M || {}).data || {})) n.html = '';
      const keep = new Set(['Home', ed.module]), walk = m => { for(const n of Object.values((df[m] || {}).data || {})) if(n && n.name === 'group'){ const k = String((n.data || {}).module || ''); if(df[k] && !keep.has(k)){ keep.add(k); walk(k); } } };
      walk('Home'); for(const k of Object.keys(df)) if(!keep.has(k)) delete df[k];
      g.v = F.version || ATHANOR_VERSION; return athanorNamed(g); };
    // each wire listed at both its ends, from its input's end (a group made or opened rewires by its inputs alone)
    const syncOutputs = data => { for(const n of Object.values(data)) for(const o of Object.values(n.outputs || {})) o.connections = [];
      for(const [id, n] of Object.entries(data)) for(const [k, v] of Object.entries(n.inputs || {})){
        v.connections = (v.connections || []).filter(c => { const src = data[String(c.node)], o = parseInt(String(c.input).slice(7), 10); if(!src || !(o >= 1)) return false;
          ((src.outputs ||= {})[c.input] ||= { connections: [] }).connections.push({ node: String(id), output: k }); return true; }); } };
    const faces = g => { F.version = athanorVersion(g);
      const df = g.drawflow || {};
      for(const M of Object.values(df)) for(const n of Object.values((M || {}).data || {})){
        const P = n.name === 'group' ? forgeGroupPart(df[String((n.data || {}).module || '')], n.data || {}) : FORGE_NODES[n.name]; if(!P) continue;
        n.html = forgeNodeHtml(n.name, lists, n.data || {}, n.name === 'group' ? P : null); n.class = forgeCatClass(P.cat);
        // (a group has the ports its insides give it now: none past them)
        if(n.name === 'group'){ for(const k of Object.keys(n.inputs || {})) if(+k.slice(6) > P.ins.length) delete n.inputs[k];
          for(const k of Object.keys(n.outputs || {})) if(+k.slice(7) > P.outs.length) delete n.outputs[k]; }
        // every port the part has, wired or not (a starter, or a part that gained one, lists only its wires)
        n.inputs = n.inputs || {}; n.outputs = n.outputs || {};
        P.ins.forEach((_, j) => { n.inputs['input_' + (j + 1)] = n.inputs['input_' + (j + 1)] || { connections: [] }; });
        P.outs.forEach((_, j) => { n.outputs['output_' + (j + 1)] = n.outputs['output_' + (j + 1)] || { connections: [] }; });
        // ports in their own order. Drawflow makes a node's ports in the order its list has them, and
        // the face lines each port up with its row by that order: a graph whose wires were made in
        // another order ({input_2, input_3, input_1}) drew its wires to the wrong rows (Ruby's Halftone)
        const ordered = (o, pre) => Object.fromEntries(Object.keys(o).sort((a, b) => (+a.slice(pre.length) || 0) - (+b.slice(pre.length) || 0)).map(k => [k, o[k]]));
        n.inputs = ordered(n.inputs, 'input_'); n.outputs = ordered(n.outputs, 'output_'); }
      for(const M of Object.values(df)) syncOutputs((M || {}).data || {});
      return g; };
    F.faces = faces;
    const save = () => { const json = JSON.stringify(slim()); deps.setBench(json); if(deps.onSave) deps.onSave(json); if(status){ status.textContent = describeForge(json); status.title = status.textContent; } previews(); snapshot(); };
    F.save = save;
    // ---- UNDO AND REDO (Ruby): every change to the graph is a step back — a part added, moved,
    // removed, a wire, a setting, a whole graph opened. ↶ ↷ in the bar; Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or
    // Ctrl+Y. (A burst of changes, a slider dragged, settles into one step.)
    const hist = F.hist || (F.hist = { stack: [], at: -1, timer: 0, applying: false });
    const paintHist = () => { const u = $('forgeUndo'), r = $('forgeRedo'); if(u) u.disabled = hist.at <= 0; if(r) r.disabled = hist.at >= hist.stack.length - 1; };
    const pushNow = () => { const j = JSON.stringify(slim()); if(hist.stack[hist.at] === j) return;
      hist.stack = hist.stack.slice(0, hist.at + 1); hist.stack.push(j); if(hist.stack.length > 100) hist.stack.shift(); hist.at = hist.stack.length - 1; paintHist(); };
    function snapshot(){ if(hist.applying || F.quiet) return; clearTimeout(hist.timer); hist.timer = setTimeout(pushNow, 300); }
    const stepHist = d => { clearTimeout(hist.timer); pushNow(); const to = hist.at + d;
      if(to < 0 || to >= hist.stack.length){ sound('nothingToUndo'); return; }
      hist.at = to; hist.applying = true; try { load(JSON.parse(hist.stack[to]), true, ed.module); F.dirty = true; } finally { hist.applying = false; } paintHist(); sound(d < 0 ? 'undo' : 'redo'); };
    F.undo = () => stepHist(-1); F.redo = () => stepHist(1); F.pushHist = pushNow; F.paintHist = paintHist;
    // what has changed since the graph was opened or loaded (the guards ask only then)
    const touched = () => { F.dirty = true; };
    ed.on('nodeCreated', id => { paintNode(id); save(); touched(); sound('nodeAdd'); });
    ed.on('nodeRemoved', () => { save(); touched(); sound('nodeRemove'); });
    ed.on('connectionCreated', c => { paintNode(c.input_id); paintWires(); save(); touched(); sound('wireConnect'); });
    ed.on('connectionRemoved', c => { paintNode(c.input_id); save(); touched(); sound('wireDisconnect'); hideCut(); });
    ed.on('nodeMoved', id => { if(F.snapNode) F.snapNode(id); paintWires(); save(); });
    ed.on('nodeDataChanged', id => { save(); touched(); if(id != null) paintNode(id); });
    ed.on('import', () => setTimeout(paintAll, 0));
    // EVERY WIRE REDRAWN from where its ports are now: a wire is drawn once, when it is made, and a
    // part whose face changes size afterwards (its fonts arriving, its rows redrawn, the editor opened
    // again later) left its wires pointing at where the ports used to be (Ruby's screenshot)
    const redrawWires = () => { try { for(const id of Object.keys(rawNodes())) ed.updateConnectionNodes('node-' + id); paintWires(); } catch(e){} };
    const redrawSoon = () => { redrawWires(); requestAnimationFrame(() => { redrawWires(); setTimeout(redrawWires, 250); }); };
    F.redrawWires = redrawSoon;
    if(document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { if(!veil.hidden) redrawSoon(); });
    // (`module`: which of the graph's modules to show — the group open, kept through an undo; Home if it is gone)
    const load = (g, keepDirty, module) => { const was = F.dirty; F.quiet = true;
      const gn = athanorIsNamed(g) ? athanorNumbered(g) : g; if(!gn.drawflow || !gn.drawflow.Home) gn.drawflow = { ...(gn.drawflow || {}), Home: { data: {} } };
      const at = module && gn.drawflow[module] ? module : 'Home';
      if(at === 'Home') F.path = []; else F.path = (F.path || []).filter(p => gn.drawflow[p.module]);
      ed.module = 'Home'; ed.clear(); ed.module = at; ed.import(faces(gn));
      // (a graph from anywhere, without a Surface: it gets one)
      if(at === 'Home' && !Object.values(rawNodes()).some(n => n.name === 'surface')) add('surface', 900, 120);
      F.quiet = false; paintAll(); save(); F.dirty = keepDirty ? was : false; redrawSoon(); if(F.fillOpen) F.fillOpen(); if(F.paintCrumb) F.paintCrumb(); };
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
      // tapped in from the palette: the free place nearest the middle of the view, clear of every part and of the
      // preview dock (the usability review: a new part landed on the Surface, or under the dock on a phone)
      const id = ed.addNode(type, N.ins.length, N.outs.length, x ?? 0, y ?? 0, forgeCatClass(N.cat), Object.assign(forgeNodeData(type), data || {}), forgeNodeHtml(type, lists, data || {}));
      if(x === undefined && id){ const el = document.getElementById('node-' + id);
        // (placed once it is drawn, by its own size: a part with a preview is far taller than its ports say)
        const at = freeSpot(el ? el.offsetWidth : 210, el ? el.offsetHeight : 260, el);
        const n = nodeOf(id); if(n){ n.pos_x = at.x; n.pos_y = at.y; }
        if(el){ el.style.left = at.x + 'px'; el.style.top = at.y + 'px'; if(ed.updateConnectionNodes) ed.updateConnectionNodes('node-' + id); }
        if(at.pan){ const r = area.getBoundingClientRect(), s = toScreen(at.x + (el ? el.offsetWidth/2 : 105), at.y + 80); ed.canvas_x += r.left + r.width/2 - s.x; ed.canvas_y += r.top + r.height/2 - s.y;
          ed.precanvas.style.transform = `translate(${ed.canvas_x}px, ${ed.canvas_y}px) scale(${ed.zoom})`; }
        if(el && el.classList){ el.classList.add('forge-new'); setTimeout(() => el.classList.remove('forge-new'), 1400); } }
      return id;
    };
    const freeSpot = (NW, NH, self) => {
      const r = area.getBoundingClientRect();
      const boxes = [...area.querySelectorAll('.drawflow-node')].filter(el => el !== self).map(el => { const x0 = parseFloat(el.style.left) || 0, y0 = parseFloat(el.style.top) || 0;
        return [x0 - 24, y0 - 24, x0 + el.offsetWidth + 24, y0 + el.offsetHeight + 24]; });
      const dock = $('forgeDock'), dr = dock && !dock.hidden && dock.getBoundingClientRect ? dock.getBoundingClientRect() : null;
      const free = (gx, gy) => !boxes.some(b => gx < b[2] && gx + NW > b[0] && gy < b[3] && gy + NH > b[1]);
      const seen = (gx, gy) => { const a = toScreen(gx, gy), b = toScreen(gx + NW, gy + Math.min(NH, 160));
        if(a.x < r.left + 4 || a.y < r.top + 4 || b.x > r.right - 4 || b.y > r.bottom - 4) return false;
        return !(dr && b.x > dr.left && a.x < dr.right && b.y > dr.top && a.y < dr.bottom); };
      const c = toGrid(r.left + r.width/2, r.top + r.height/2), cx = c.x - NW/2, cy = c.y - NH/2;
      for(let ring = 0; ring < 16; ring++){ const n = Math.max(1, ring*8);
        for(let k = 0; k < n; k++){ const a = k/n*Math.PI*2, gx = cx + Math.cos(a)*ring*48, gy = cy + Math.sin(a)*ring*40; if(free(gx, gy) && seen(gx, gy)) return { x: gx, y: gy }; } }
      // nowhere free in view: beside the whole graph, on the right, and the view goes to it
      const right = boxes.length ? Math.max(...boxes.map(b => b[2])) : cx, top = boxes.length ? Math.min(...boxes.map(b => b[1])) + 24 : cy;
      return { x: right, y: top, pan: true };
    };
    // a point on the screen, as a place on the grid (the grid scales about its middle)
    const toGrid = (cx, cy) => {
      const r = area.getBoundingClientRect(), z = ed.zoom || 1, mx = r.width/2, my = r.height/2;
      return { x: (cx - r.left - ed.canvas_x - mx)/z + mx, y: (cy - r.top - ed.canvas_y - my)/z + my };
    };
    // and back: a place on the grid, as a point on the screen
    const toScreen = (gx, gy) => {
      const r = area.getBoundingClientRect(), z = ed.zoom || 1, mx = r.width/2, my = r.height/2;
      return { x: (gx - mx)*z + mx + ed.canvas_x + r.left, y: (gy - my)*z + my + ed.canvas_y + r.top };
    };
    // ---- the palette: categories that fold; tap to add in the middle, or drag onto the canvas (with a mouse) ----
    const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
    if(palette){
      // THE PARTS LIST: a search, then each category (its glyph, its name, what it holds) and
      // its parts, each with what it does in a line. (No Output: every graph has its Surface.)
      palette.innerHTML = `<input type="search" class="forge-find" id="forgeFind" placeholder="Find a part…" aria-label="Find a part" autocomplete="off">`
        + FORGE_CATEGORIES.filter(cat => cat !== 'Output').map(cat => `<details class="forge-cat" open style="--cat:var(--fg-dim)"><summary><span class="forge-cat-glyph" aria-hidden="true">${FORGE_CAT_GLYPHS[cat] || ''}</span> ${forgeEsc(forgeCatName(cat))}</summary>`
        + `<p class="forge-cat-doc">${forgeEsc(FORGE_CAT_DOCS[cat] || '')}</p>`
        + Object.entries(FORGE_NODES).filter(([, n]) => n.cat === cat && !n.hidden).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([type, n]) => `<button type="button" class="forge-part"${finePointer ? ' draggable="true"' : ''} data-type="${type}" style="--cat:${forgePartColour(n)}" title="${forgeEsc(n.doc)}"><span class="fpart-name">${forgeEsc(n.label)}</span><span class="fpart-doc">${forgeEsc(n.doc)}</span></button>`).join('') + `</details>`).join('');
      const find = palette.querySelector('#forgeFind');
      if(find) find.addEventListener('input', () => { const q = find.value.trim().toLowerCase();
        palette.querySelectorAll('.forge-cat').forEach(c => { let any = 0;
          c.querySelectorAll('.forge-part').forEach(b => { const hit = !q || b.textContent.toLowerCase().includes(q); b.hidden = !hit; if(hit) any++; });
          c.hidden = !any; if(q && any) c.open = true; }); });
      palette.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b){ add(b.dataset.type); setParts(false); } });
      palette.addEventListener('dragstart', e => { const b = e.target.closest && e.target.closest('.forge-part'); if(b && e.dataTransfer) e.dataTransfer.setData('text/forge', b.dataset.type); });
    }
    // on a phone the parts are a drawer (＋ Parts), so the grid has the whole screen
    const partsBtn = $('forgePartsBtn');
    // ON A PHONE ONE THING OPENS AT A TIME (Ruby): the parts drawer, the wiki and a menu each close the others;
    // a desk has room for them side by side
    const phoneNow = () => !!(document.body && document.body.classList && document.body.classList.contains('is-mobile'));
    const onlyThis = keep => { if(!phoneNow()) return; if(keep !== 'parts') setParts(false); if(keep !== 'doc' && F.showDoc && doc0 && !doc0.hidden) F.showDoc(false);
      if(keep !== 'menu' && F.closeMenu) F.closeMenu(); if(keep !== 'open' && F.openCh) F.openCh.close(); };
    const doc0 = $('forgeDoc');
    const setParts = open => { if(!partsBtn) return; if(open) onlyThis('parts'); veil.classList.toggle('parts-open', open); partsBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    F.onlyThis = onlyThis;
    if(partsBtn) partsBtn.addEventListener('click', () => setParts(!veil.classList.contains('parts-open')));
    area.addEventListener('dragover', e => e.preventDefault());
    area.addEventListener('drop', e => { e.preventDefault(); const type = e.dataTransfer && e.dataTransfer.getData('text/forge'); if(!type) return;
      const p = toGrid(e.clientX, e.clientY); add(type, p.x, p.y); });
    // ---- PANNING (Ruby: it locked, or the browser began dragging a ghost) ----
    // Drawflow pans only when the pressed element's FIRST class is 'parent-drawflow' or 'drawflow': the container
    // was 'forge-canvas …', so wherever the sheet had been panned or zoomed away from, a press did nothing and
    // the browser selected text instead (the markup now lists parent-drawflow first; this keeps it so).
    if(area.classList[0] !== 'parent-drawflow'){ const cls = [...area.classList].filter(c => c !== 'parent-drawflow'); area.className = ['parent-drawflow', ...cls].join(' '); }
    // never the browser's own drag (a preview's ghost, selected text)
    area.addEventListener('dragstart', e => e.preventDefault());
    area.addEventListener('selectstart', e => { if(!(e.target.closest && e.target.closest('input, textarea'))) e.preventDefault(); });
    // the middle button (or Space held) pans from anywhere, over parts too, as in Blender and ComfyUI
    let spaceHeld = false, panFrom = null;
    document.addEventListener('keydown', e => { if(e.code === 'Space' && !veil.hidden && !(e.target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName))){ spaceHeld = true; e.preventDefault(); } });
    document.addEventListener('keyup', e => { if(e.code === 'Space') spaceHeld = false; });
    area.addEventListener('pointerdown', e => {
      if(e.pointerType !== 'mouse' || !(e.button === 1 || (e.button === 0 && spaceHeld))) return;
      e.preventDefault(); e.stopImmediatePropagation();
      panFrom = { x: e.clientX, y: e.clientY, cx: ed.canvas_x, cy: ed.canvas_y }; area.classList.add('panning');
      try { area.setPointerCapture(e.pointerId); } catch(_){}
    }, true);
    area.addEventListener('mousedown', e => { if(panFrom || e.button === 1){ e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    area.addEventListener('pointermove', e => { if(!panFrom) return; e.stopImmediatePropagation();
      ed.canvas_x = panFrom.cx + e.clientX - panFrom.x; ed.canvas_y = panFrom.cy + e.clientY - panFrom.y;
      ed.precanvas.style.transform = `translate(${ed.canvas_x}px, ${ed.canvas_y}px) scale(${ed.zoom})`; }, true);
    for(const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) area.addEventListener(ev, () => { if(panFrom){ panFrom = null; area.classList.remove('panning'); } }, true);
    area.addEventListener('auxclick', e => { if(e.button === 1) e.preventDefault(); });
    // ---- moving: a node only by its title bar (and not when pinned); anywhere else, the grid pans ----
    let ptrKind = 'mouse';
    area.addEventListener('pointerdown', e => { ptrKind = e.pointerType || 'mouse'; }, true);
    ed.on('clickEnd', e => {
      const t = e && e.target; if(!t || !t.closest) return;
      const nodeEl = t.closest('.drawflow-node'); if(!nodeEl) return;
      if(t.closest('.forge-node-btn')){ ed.drag = false; return; }
      if(t.closest('.forge-node-title')){ if(isPinned(nodeEl.id.slice(5))) ed.drag = false; return; }
      // WITH A MOUSE a part moves from anywhere on it but its controls and ports (Ruby: dragging only by the
      // title felt like it worked when it liked); on a touch screen only its title moves it, so a finger can pan
      if(ptrKind === 'mouse' && !isPinned(nodeEl.id.slice(5)) && !t.closest('input, select, textarea, button, .input, .output, output, label')) return;
      ed.drag = false;
      if(!t.closest('input, select, textarea, button, .input, .output, output')) ed.editor_selected = true;
    });
    // the title bar's pin and menu
    area.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('.forge-node-btn'); if(!b) return;
      const nodeEl = b.closest('.drawflow-node'); if(!nodeEl) return; const id = nodeEl.id.slice(5);
      e.preventDefault(); e.stopPropagation();
      if(b.dataset.act === 'pin'){ setData(id, { _pin: isPinned(id) ? undefined : true }); }
      else if(b.dataset.act === 'open'){ if(F.openGroup) F.openGroup(id); }
      else { const r = b.getBoundingClientRect(); openMenu(r.left, r.bottom, nodeMenu(id)); }
    });
    // ---- the guards: deleting work asks first (a node that carries settings or wires, once anything has changed) ----
    const carries = id => { const n = ed.getNodeFromId(id); if(!n) return false; const N = partOf(n);
      const wired = [...Object.values(n.inputs || {}), ...Object.values(n.outputs || {})].some(p => (p.connections || []).length);
      const changed = N && N.params.some(p => n.data && n.data[p[0]] !== undefined && String(n.data[p[0]]) !== String(p[3]));
      return wired || changed; };
    const isSurface = id => ((nodeOf(id) || {}).name === 'surface');
    const removeAsked = async id => {
      // every graph keeps its Surface: it is where the texture comes out (Ruby)
      if(isSurface(id)){ if(deps.warn) deps.warn(['the Surface stays: every graph ends in one. To start over, cut its wires or use Clear the grid']); sound('nothingToUndo'); return; }
      if(F.dirty && carries(id)){
        const label = labelOf(id);
        if(!await ask({ title: `Delete ${label}?`, body: 'Its wires go too. Undo brings it back.', confirmLabel: 'Delete', danger: true })) return;
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
    // a part tapped or clicked comes to the front, over any it overlaps (Ruby)
    let frontZ = 2;
    const toFront = id => { const el = area.querySelector('#node-' + id); if(el) el.style.zIndex = String(++frontZ); };
    ed.on('nodeSelected', id => { hideCut(); toFront(id); });
    area.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('.drawflow-node'); if(el && el.id) toFront(el.id.replace('node-', '')); }, true);
    if(cut) cut.addEventListener('click', () => { cutWire(F.cutWire); });
    document.addEventListener('keydown', e => {
      if(veil.hidden) return;
      if(e.key === 'Escape' && menu && !menu.hidden){ e.preventDefault(); closeMenu(); return; }
      if(e.key === 'Escape' && pending){ e.preventDefault(); stopWire(); return; }
      const t = e.target, typing = t && ((t.tagName === 'INPUT' && t.type !== 'range') || t.tagName === 'TEXTAREA' || t.isContentEditable), mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase();
      // THE KEYS other editors have: undo, redo, copy a part, fit the view
      if(mod && k === 'z' && !typing){ e.preventDefault(); e.stopImmediatePropagation(); e.shiftKey ? stepHist(1) : stepHist(-1); return; }
      if(mod && k === 'y' && !typing){ e.preventDefault(); e.stopImmediatePropagation(); stepHist(1); return; }
      if(mod && k === 'd' && !typing && ed.node_selected){ e.preventDefault(); e.stopImmediatePropagation(); const id = String(ed.node_selected.id).replace('node-', ''), n = nodeOf(id);
        if(!n) return; if(n.name === 'surface' || n.name === 'groupout'){ sound('blocked'); if(deps.warn) deps.warn([n.name === 'surface' ? 'a graph has one Surface' : 'a group has one Group Result']); return; }
        if(n.name === 'group'){ F.dupGroup(id); return; }
        const d = JSON.parse(JSON.stringify(n.data || {})); delete d._pin; add(n.name, n.pos_x + 30, n.pos_y + 40, d); return; }
      if(!mod && !e.altKey && k === 'f' && !typing && !(t && t.tagName === 'SELECT')){ e.preventDefault(); fitView(); return; }
      if(!(e.key === 'Delete' || e.key === 'Backspace')) return;
      if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
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
          + `${it.colour ? ` style="--mc:${it.colour}"` : ''}><span class="mi-glyph" aria-hidden="true">${forgeEsc(it.glyph || '')}</span>`
          // (the hint under the label, whole: a menu says what each thing does, never cut short)
          + `<span class="mi-text"><span class="mi-label">${forgeEsc(it.label)}</span>${it.hint ? `<small>${forgeEsc(it.hint)}</small>` : ''}</span></button>`).join('');
      const first = menu.querySelector('.forge-menu-item:not([disabled])'); if(first && finePointer) first.focus();
    };
    const openMenu = (x, y, m) => {
      if(!menu || !m) return; F.onlyThis('menu'); menuStack = [m]; menu.hidden = false; drawMenu();
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
    const N_ = id => partOf(nodeOf(id)) || null;
    const wireDesc = w => { const a = N_(w.outId), b = N_(w.inId); const oi = +w.output.slice(7) - 1, ii = +w.input.slice(6) - 1;
      return { label: `${labelOf(w.outId)} → ${labelOf(w.inId)}`, hint: `${forgeWord((a && a.outs[oi]) || '')} into ${forgeWord((b && b.ins[ii]) || '')}`, colour: `var(--t-${(a && a.outTypes[oi]) || 'field'})`, glyph: '〰' }; };
    // ---- WIRING BY MENU: choose one end, then the other (no dragging) ----
    let pending = null;                                        // { from: 'out' | 'in', id, port: 'output_k' | 'input_k' }
    const pendBar = (() => { let el = $('forgePending'); if(!el && body){ el = document.createElement('div'); el.id = 'forgePending'; el.className = 'forge-pending'; el.hidden = true; el.setAttribute('role', 'status'); body.appendChild(el); } return el; })();
    const portInfo = (id, side, j) => { const N = N_(id); return N ? { name: forgeWord(side === 'out' ? N.outs[j] : N.ins[j]), t: (side === 'out' ? N.outTypes[j] : N.inTypes[j]) || 'field' } : { name: '?', t: 'field' }; };
    const showPending = () => { if(!pendBar) return;
      if(!pending){ pendBar.hidden = true; pendBar.innerHTML = ''; return; }
      const j = +pending.port.replace(/\D+/g, '') - 1, P = portInfo(pending.id, pending.from, j);
      pendBar.innerHTML = `<i style="background:var(--t-${P.t})"></i><span>${pending.from === 'out'
        ? `Wiring from ${forgeEsc(labelOf(pending.id))}\u2019s <b>${forgeEsc(P.name)}</b>: ${forgeClick()} the part it should feed.`
        : `Wiring into ${forgeEsc(labelOf(pending.id))}\u2019s <b>${forgeEsc(P.name)}</b>: ${forgeClick()} the part it should come from.`}</span><button type="button" class="forge-pending-x">Cancel</button>`;
      pendBar.hidden = false; };
    const startWire = (from, id, port) => { pending = { from, id: String(id), port }; showPending(); area.classList.add('wiring'); hideCut(); };
    const stopWire = () => { pending = null; showPending(); area.classList.remove('wiring'); };
    F.stopWire = stopWire; F.startWire = startWire; F.pending = () => pending;
    if(pendBar) pendBar.addEventListener('click', e => { if(e.target.closest && e.target.closest('.forge-pending-x')) stopWire(); });

    // ---- GROUPS (ROADMAP A3, Filter Forge's groups): parts chosen and made one; a group opened, its insides
    // shown in place of the graph, and closed again. Each group's insides are a module of Drawflow's own. ----
    const bar = (id, cls) => { let el = $(id); if(!el && body){ el = document.createElement('div'); el.id = id; el.className = cls; el.hidden = true; el.setAttribute('role', 'status'); body.appendChild(el); } return el; };
    // the way back out: which group is open, inside which
    const crumb = bar('forgeCrumb', 'forge-pending forge-crumb');
    const paintCrumb = () => { if(!crumb) return; const path = F.path || [];
      const inside = ed.module !== 'Home' && path.length > 0; veil.classList.toggle('in-group', inside);
      if(!inside){ crumb.hidden = true; crumb.innerHTML = ''; return; }
      const top = path[path.length - 1], up = path.length > 1 ? path[path.length - 2].name : 'the graph';
      crumb.innerHTML = `<button type="button" class="forge-pending-x" data-act="close">‹ Back to ${forgeEsc(up)}</button><span>Inside <b>${forgeEsc(top.name)}</b><span class="fc-how">: its Group Inputs and Knobs are its inputs; whatever reaches its Group Result is its output.</span></span>`;
      crumb.hidden = false; };
    F.paintCrumb = paintCrumb;
    const openGroup = id => { const n = nodeOf(id); if(!n || n.name !== 'group') return; const mod = String((n.data || {}).module || ''); if(!mods()[mod]) return;
      stopWire(); stopPick(); closeMenu();
      F.path = (F.path || []).concat({ module: mod, from: ed.module, name: labelOf(id) }); load(slim(), true, mod); setTimeout(fitView, 30); sound('graphLoad'); };
    const closeGroup = () => { const path = F.path || []; if(!path.length) return; const top = path[path.length - 1];
      stopWire(); stopPick(); F.path = path.slice(0, -1); load(slim(), true, top.from); setTimeout(fitView, 30); sound('graphLoad'); };
    F.openGroup = openGroup; F.closeGroup = closeGroup;
    if(crumb) crumb.addEventListener('click', e => { if(e.target.closest && e.target.closest('[data-act="close"]')) closeGroup(); });
    // CHOOSING THE PARTS for a group: a tap adds a part or takes it away (the Surface stays out)
    let picking = null;
    const pickBar = bar('forgePick', 'forge-pending forge-pick');
    const paintPick = () => {
      area.querySelectorAll('.drawflow-node').forEach(el => el.classList.toggle('picked', !!picking && picking.has(el.id.slice(5))));
      area.classList.toggle('picking', !!picking);
      if(!pickBar) return;
      if(!picking){ pickBar.hidden = true; pickBar.innerHTML = ''; return; }
      pickBar.innerHTML = `<span><b>${picking.size}</b> ${picking.size === 1 ? 'part' : 'parts'} chosen. ${forgeClick(true)} parts to add or remove, or drag a box around them.</span>`
        + `<button type="button" class="forge-pending-x" data-act="make"${picking.size ? '' : ' disabled'}>Make the group</button><button type="button" class="forge-pending-x" data-act="cancel">Cancel</button>`;
      pickBar.hidden = false; };
    const startPick = id => { stopWire(); picking = new Set(id != null ? [String(id)] : []); paintPick(); };
    function stopPick(){ if(!picking) return; picking = null; paintPick(); }
    F.startPick = startPick; F.picking = () => picking;
    if(pickBar) pickBar.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-act]'); if(!b) return;
      if(b.dataset.act === 'make'){ const ids = [...(picking || [])]; stopPick(); makeGroup(ids); } else stopPick(); });
    { let at = null;
      area.addEventListener('pointerdown', e => { at = picking ? { x: e.clientX, y: e.clientY, t: Date.now() } : null; }, true);
      area.addEventListener('pointerup', e => { const t0 = at; at = null; if(!picking || !t0) return;
        if(Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > 10 || Date.now() - t0.t > 500) return;
        const el = document.elementFromPoint(e.clientX, e.clientY), nodeEl = el && el.closest && el.closest('.drawflow-node'); if(!nodeEl || el.closest('input, select, textarea, button')) return;
        const id = nodeEl.id.slice(5), n = nodeOf(id); if(!n) return;
        if(n.name === 'surface' || n.name === 'groupout'){ sound('blocked'); return; }
        picking.has(id) ? picking.delete(id) : picking.add(id); paintPick(); e.preventDefault(); }, true);
      document.addEventListener('keydown', e => { if(e.key === 'Escape' && picking && !veil.hidden){ e.preventDefault(); stopPick(); } }, true); }
    // A BOX DRAWN ACROSS THE GRID chooses every part it touches (Ruby): while choosing parts for a group, a drag on the
    // empty grid draws the box instead of panning; with a mouse, Shift and a drag starts choosing with a box anywhere
    { let box = null, boxEl = null, fingers = 0;
      const draw = () => { if(!boxEl){ boxEl = document.createElement('div'); boxEl.className = 'forge-box'; (body || area).appendChild(boxEl); }
        const r = (body || area).getBoundingClientRect(), x0 = Math.min(box.x0, box.x1), y0 = Math.min(box.y0, box.y1);
        Object.assign(boxEl.style, { left: (x0 - r.left) + 'px', top: (y0 - r.top) + 'px', width: Math.abs(box.x1 - box.x0) + 'px', height: Math.abs(box.y1 - box.y0) + 'px' }); boxEl.hidden = false; };
      const end = () => { box = null; if(boxEl) boxEl.hidden = true; };
      area.addEventListener('pointerdown', e => {
        if(e.pointerType === 'touch') fingers++;
        if(fingers > 1){ end(); return; }                                   // (two fingers: a pinch, never a box)
        const onGrid = !(e.target.closest && e.target.closest('.drawflow-node, .forge-menu, input, select, button'));
        if(!onGrid || e.button > 0) return;
        if(!picking && !(e.shiftKey && e.pointerType === 'mouse')) return;
        if(!picking) startPick(null);
        box = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY, id: e.pointerId };
        e.preventDefault(); e.stopImmediatePropagation(); try { area.setPointerCapture(e.pointerId); } catch(_){}
      }, true);
      // (Drawflow pans on mousedown and touchstart: not while a box is drawn)
      for(const ev of ['mousedown', 'touchstart']) area.addEventListener(ev, e => { if(box){ e.stopImmediatePropagation(); if(e.cancelable) e.preventDefault(); } }, { capture: true, passive: false });
      area.addEventListener('pointermove', e => { if(!box || e.pointerId !== box.id) return; e.stopImmediatePropagation(); box.x1 = e.clientX; box.y1 = e.clientY;
        if(Math.hypot(box.x1 - box.x0, box.y1 - box.y0) > 6) draw(); }, true);
      const lift = e => { if(e.pointerType === 'touch') fingers = Math.max(0, fingers - 1); if(!box || e.pointerId !== box.id) return;
        const b = box; end(); if(Math.hypot(b.x1 - b.x0, b.y1 - b.y0) <= 6 || !picking) return;
        const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
        area.querySelectorAll('.drawflow-node').forEach(el => { const r = el.getBoundingClientRect(), id = el.id.slice(5), n = nodeOf(id);
          if(!n || n.name === 'surface' || n.name === 'groupout') return;
          if(r.right >= x0 && r.left <= x1 && r.bottom >= y0 && r.top <= y1) picking.add(id); });
        paintPick(); sound('nodeAdd'); };
      area.addEventListener('pointerup', lift, true); area.addEventListener('pointercancel', e => { if(e.pointerType === 'touch') fingers = Math.max(0, fingers - 1); end(); }, true); }
    // the next id free in every module (Drawflow numbers its nodes across them all)
    const nextId = df => { let next = 1; for(const m of Object.values(df)) for(const id of Object.keys((m || {}).data || {})) next = Math.max(next, (+id || 0) + 1); return next; };
    const bare = (id, name, data, x, y) => ({ id, name, data, class: forgeCatClass(FORGE_NODES[name].cat), html: '', typenode: false, inputs: {}, outputs: {}, pos_x: Math.round(x), pos_y: Math.round(y) });
    /**
     * MAKE A GROUP of the parts chosen: they move into a module of their own, in their places; every wire that came
     * in from a part outside comes through a Group Input (one for each output outside that fed them), and every
     * result read outside goes out through the Group Result (at most four). The group stands where they stood and
     * is wired where they were, so the picture doesn't change.
     */
    const makeGroup = ids => {
      const g = athanorNumbered(slim()), df = g.drawflow, here = ed.module, M = (df[here] || {}).data || {};
      const pick = new Set(ids.map(String).filter(id => M[id] && M[id].name !== 'surface' && M[id].name !== 'groupout'));
      if(!pick.size){ sound('blocked'); return; }
      // (the results read outside, counted first: a group gives at most four)
      const outKeys = new Set(); for(const [id, n] of Object.entries(M)) if(!pick.has(id)) for(const v of Object.values(n.inputs || {})) for(const c of v.connections || []) if(pick.has(String(c.node))) outKeys.add(c.node + '.' + c.input);
      if(outKeys.size > 4){ sound('blocked'); if(deps.warn) deps.warn([`a group has at most four outputs, but these parts send out ${outKeys.size}: choose fewer parts, or include the parts that read them`]); return; }
      let next = nextId(df), mod = 'g' + next; while(df[mod]) mod += 'x';
      const inner = {}; let x0 = Infinity, x1 = -Infinity, ys = 0;
      for(const id of pick){ const n = M[id]; inner[id] = n; delete M[id]; x0 = Math.min(x0, n.pos_x); x1 = Math.max(x1, n.pos_x); ys += n.pos_y; }
      const ym = ys/pick.size, gid = next++, rid = next++;
      const G = bare(gid, 'group', { name: 'Group', module: mod }, (x0 + x1)/2, ym), R = bare(rid, 'groupout', {}, x1 + ATHANOR_NODE.w + 80, ym);
      // wires in: each output outside that feeds the chosen parts, one Group Input named after it
      const ins = new Map();
      for(const n of Object.values(inner)) for(const v of Object.values(n.inputs || {})) v.connections = (v.connections || []).map(c => {
        if(pick.has(String(c.node))) return c;
        const key = c.node + '.' + c.input;
        if(!ins.has(key)){ const src = M[String(c.node)], SP = src && (src.name === 'group' ? forgeGroupPart(df[String((src.data || {}).module || '')], src.data || {}) : FORGE_NODES[src.name]);
          const o = (parseInt(String(c.input).slice(7), 10) || 1) - 1, name = SP ? (SP.outs.length > 1 ? SP.label + ' ' + forgeWord(SP.outs[o] || '') : SP.label) : 'Input';
          const id = next++; inner[id] = bare(id, 'groupin', { name: name.slice(0, 24), def: 50 }, x0 - ATHANOR_NODE.w - 80, 0); ins.set(key, { id: String(id), src: { node: String(c.node), input: c.input } }); }
        return { node: ins.get(key).id, input: 'output_1' }; });
      [...ins.values()].forEach((m, i) => { inner[m.id].pos_y = Math.round(ym + (i - (ins.size - 1)/2)*140); });
      // wires out: each result read outside, one of the Group Result's, and the group's output in its place
      const outs = new Map();
      for(const n of Object.values(M)) for(const v of Object.values(n.inputs || {})) v.connections = (v.connections || []).map(c => {
        if(!pick.has(String(c.node))) return c;
        const key = c.node + '.' + c.input;
        if(!outs.has(key)){ outs.set(key, outs.size + 1); R.inputs['input_' + outs.size] = { connections: [{ node: String(c.node), input: c.input }] }; }
        return { node: String(gid), input: 'output_' + outs.get(key) }; });
      inner[rid] = R;
      // the group's own inputs, in the order its insides give them
      groupPorts({ data: inner }).ins.forEach((m, j) => { const hit = [...ins.values()].find(q => q.id === m.id); if(hit) G.inputs['input_' + (j + 1)] = { connections: [hit.src] }; });
      M[gid] = G; df[mod] = { data: inner };
      syncOutputs(M); syncOutputs(inner);
      load(g, true, here); touched(); sound('nodeAdd');
      setTimeout(() => toFront(String(gid)), 0);
    };
    F.makeGroup = makeGroup;
    // a group copied: its insides copied too (new ids), so changing one never changes the other
    const dupGroup = id => {
      const g = athanorNumbered(slim()), df = g.drawflow, here = ed.module, n = ((df[here] || {}).data || {})[id]; if(!n) return;
      const from = df[String((n.data || {}).module || '')]; if(!from) return;
      let next = nextId(df), mod = 'g' + next; while(df[mod]) mod += 'x';
      const map = {}, inner = {}; for(const oid of Object.keys(from.data || {})) map[oid] = String(next++);
      for(const [oid, m] of Object.entries(from.data || {})){ const c = JSON.parse(JSON.stringify(m)); c.id = +map[oid];
        for(const v of Object.values(c.inputs || {})) v.connections = (v.connections || []).filter(q => map[q.node]).map(q => ({ node: map[q.node], input: q.input }));
        c.outputs = {}; inner[map[oid]] = c; }
      syncOutputs(inner); df[mod] = { data: inner };
      const gid = next++, d = JSON.parse(JSON.stringify(n.data || {})); delete d._pin; d.module = mod;
      df[here].data[gid] = bare(gid, 'group', d, n.pos_x + 30, n.pos_y + 40);
      load(g, true, here); touched(); sound('nodeAdd');
    };
    F.dupGroup = dupGroup;
    /**
     * UNGROUP: the parts back out where the group stood, wired as the group was — what came into a port goes
     * straight to the parts it fed (a Group Input left unwired becomes a Number at its Default; a Knob stays a Knob),
     * and what read a result reads the part that gave it. The picture doesn't change.
     */
    const ungroup = id => {
      const g = athanorNumbered(slim()), df = g.drawflow, here = ed.module, M = (df[here] || {}).data || {}, G = M[id]; if(!G || G.name !== 'group') return;
      const mod = String((G.data || {}).module || ''), from = df[mod]; if(!from) return;
      // (insides another group also uses are copied out, with ids of their own)
      const shared = Object.values(df).some(m => Object.values((m || {}).data || {}).some(n => n && n !== G && n.name === 'group' && String((n.data || {}).module || '') === mod));
      let next = nextId(df); const map = {}; for(const oid of Object.keys(from.data || {})) map[oid] = shared ? String(next++) : oid;
      const inner = {}; for(const [oid, m] of Object.entries(from.data || {})){ const c = JSON.parse(JSON.stringify(m)); c.id = +map[oid];
        for(const v of Object.values(c.inputs || {})) v.connections = (v.connections || []).filter(q => map[q.node]).map(q => ({ node: map[q.node], input: q.input })); inner[map[oid]] = c; }
      const redirect = (from_, src) => { for(const n of Object.values(inner)) for(const v of Object.values(n.inputs || {}))
        v.connections = (v.connections || []).flatMap(c => c.node !== from_ ? [c] : src ? [{ node: src.node, input: src.input }] : []); };
      groupPorts(from).ins.forEach((m, j) => { const I = map[m.id], src = (((G.inputs || {})['input_' + (j + 1)] || {}).connections || [])[0]; if(!inner[I]) return;
        if(src){ redirect(I, src); delete inner[I]; }
        else if(inner[I].name === 'groupin') inner[I] = { ...inner[I], name: 'number', class: forgeCatClass(FORGE_NODES.number.cat), data: { value: Math.max(0, Math.min(100, +((inner[I].data || {}).def ?? 50))) } }; });
      const R = Object.values(inner).find(n => n.name === 'groupout');
      for(const n of Object.values(M)) for(const v of Object.values(n.inputs || {})) v.connections = (v.connections || []).flatMap(c => {
        if(c.node !== String(id)) return [c];
        const s = R && (((R.inputs || {})['input_' + (parseInt(String(c.input).slice(7), 10) || 1)] || {}).connections || [])[0]; return s ? [{ node: s.node, input: s.input }] : []; });
      for(const n of Object.values(inner)) if(n.name !== 'groupout') M[n.id] = n;
      delete M[id]; if(!shared) delete df[mod];
      syncOutputs(M); load(g, true, here); touched(); sound('nodeRemove');
    };
    F.ungroup = ungroup;
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
      if(String(id) === pending.id) return { title: 'That is the same part', hint: 'A part can\'t be wired into itself. Choose another.', items: [{ glyph: '✕', label: 'Cancel wiring', act: stopWire }] };
      const j0 = +pending.port.replace(/\D+/g, '') - 1, from = portInfo(pending.id, pending.from, j0);
      const side = pending.from === 'out' ? 'in' : 'out', list = (side === 'in' ? N.ins : N.outs).map((name, j) => {
        const t = (side === 'in' ? N.inTypes[j] : N.outTypes[j]) || 'field', key = (side === 'in' ? 'input_' : 'output_') + (j + 1);
        const wired = side === 'in' && ((((n.inputs || {})[key] || {}).connections || []).length > 0);
        return { j, t, key, same: t === from.t, glyph: side === 'in' ? (j >= N.dataIns ? '⚙' : '▸') : '◂', label: forgeWord(String(name).replace(/^⚙\s*/, '')), colour: `var(--t-${t})`,
          hint: (FORGE_TYPE_NAMES[t] || '') + (t === from.t ? '' : ' (converted)') + (wired ? ' — replaces its wire' : ''),
          act: () => side === 'in' ? connect(pending.id, pending.port, String(id), key) : connect(String(id), key, pending.id, pending.port) }; });
      if(!list.length) return { title: labelOf(id), hint: side === 'in' ? 'This part has no inputs.' : 'This part has no outputs.', items: [{ glyph: '✕', label: 'Cancel wiring', act: stopWire }] };
      list.sort((a, b) => (b.same - a.same) || (a.j - b.j));
      return { title: side === 'in' ? `Into ${labelOf(id)}…` : `From ${labelOf(id)}…`, hint: `${from.name}: ${FORGE_TYPE_NAMES[from.t]}`, items: [...list, { sep: true }, { glyph: '✕', label: 'Cancel wiring', act: stopWire }] };
    };
    // "Connect its output…" / "Connect an input…": straight away when there is one port, else a list of them
    const wireStart = (id, side) => { const N = N_(id); if(!N) return null; const names = side === 'out' ? N.outs : N.ins;
      const go = j => startWire(side, id, (side === 'out' ? 'output_' : 'input_') + (j + 1));
      if(names.length === 1) return { act: () => go(0) };
      return { sub: () => ({ title: side === 'out' ? `Wire from ${labelOf(id)}: which output?` : `Wire into ${labelOf(id)}: which input?`, items: names.map((name, j) => { const t = (side === 'out' ? N.outTypes[j] : N.inTypes[j]) || 'field';
        return { glyph: side === 'out' ? '◂' : (j >= N.dataIns ? '⚙' : '▸'), label: forgeWord(String(name).replace(/^⚙\s*/, '')), hint: FORGE_TYPE_NAMES[t], colour: `var(--t-${t})`, act: () => go(j) }; }) }) }; };
    // while wiring, a TAP on another part chooses it (a pointer that goes down and up in place:
    // a phone's tap never reaches the grid as a click; a hold is answered by the menu instead)
    // A TAP ON A PORT (touch; the usability review: on a phone a port was too small to drag from, and a tap did
    // nothing): it starts a wire from that port, and while wiring, a tap on a port of the other side ends it there
    let tapAt = null;
    area.addEventListener('pointerdown', e => { const touch = e.pointerType === 'touch' || e.pointerType === 'pen';
      tapAt = pending || touch ? { x: e.clientX, y: e.clientY, t: Date.now(), touch, el: e.target } : null; }, true);
    area.addEventListener('pointerup', e => {
      const t0 = tapAt; tapAt = null; if(!t0 || answered) return;
      if(Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > 10 || Date.now() - t0.t > 500) return;
      const th = t0.touch ? thingAt(t0.el) : null, N0 = th && N_(th.id);
      if(N0 && (th.kind === 'port' || th.kind === 'param') && !(t0.el.closest && t0.el.closest('.forge-param'))){
        const j = th.kind === 'port' ? th.j : N0.dataIns + N0.paramPorts.indexOf(th.p), side = th.kind === 'port' ? th.side : 'in';
        const key = (side === 'out' ? 'output_' : 'input_') + (j + 1);
        // (Drawflow began dragging a wire from it: that one is let go)
        if(ed.connection){ ed.connection = false; if(ed.connection_ele){ ed.connection_ele.remove(); ed.connection_ele = null; } }
        if(!pending){ e.preventDefault(); startWire(side, th.id, key); return; }
        if(th.id !== pending.id && side !== pending.from){ e.preventDefault();
          if(side === 'in') connect(pending.id, pending.port, th.id, key); else connect(th.id, key, pending.id, pending.port); return; }
      }
      if(!pending) return;
      const el = document.elementFromPoint(e.clientX, e.clientY), nodeEl = el && el.closest && el.closest('.drawflow-node'); if(!nodeEl) return;
      if(el.closest('input, select, textarea')) return;
      const id = nodeEl.id.slice(5); if(id === pending.id) return;
      e.preventDefault(); const x = e.clientX, y = e.clientY; setTimeout(() => openMenu(x, y, connectMenu(id)), 0);
    }, true);
    // ---- menus for each kind of thing ----
    const wireMenu = w => { const d = wireDesc(w); return { title: 'A wire', hint: d.label + ' (' + d.hint + ')', items: [
      { glyph: '✂', label: 'Cut this wire', act: () => cutWire(w) }] }; };
    // THE ORDER OF THE SLIDERS (Filter Forge's Order of Controls, ROADMAP D2): which page slider each Knob is, from the
    // Surface's menu; moving one swaps it with the Knob in the slider it moves to
    const knobsBySlot = () => { const by = {}; for(const [id, m] of Object.entries(rawNodes())) if(m.name === 'knob'){ const sl = String((m.data || {}).slot || '1'); (by[sl] ||= []).push(id); } return by; };
    const moveSlot = (a, b) => { const by = knobsBySlot(); for(const id of by[a] || []) setData(id, { slot: b }); for(const id of by[b] || []) setData(id, { slot: a }); sound('nodeAdd'); };
    const orderSpec = () => { const by = knobsBySlot(), name = sl => (by[sl] || []).map(id => String((nodeOf(id).data || {}).name || 'Knob')).filter((v, i, a) => a.indexOf(v) === i).join(', ');
      return { title: 'Order of the sliders', hint: 'The Knobs’ sliders appear in this order under Surface Texture on the page. Choose one to move it.', items: ['1', '2', '3', '4', '5', '6'].map(sl => {
        const used = !!(by[sl] || []).length, k = +sl;
        return { glyph: sl, label: used ? name(sl) : '(no Knob)', disabled: !used, hint: used ? `slider ${sl}` : 'no Knob uses this slider yet',
          sub: () => ({ title: name(sl), hint: `now slider ${sl}`, items: [
            { glyph: '↑', label: k > 1 ? `Move up, to slider ${k - 1}` : 'Already first', disabled: k <= 1, hint: by[String(k - 1)] ? `${name(String(k - 1))} moves down in its place` : '', act: () => moveSlot(sl, String(k - 1)) },
            { glyph: '↓', label: k < 8 ? `Move down, to slider ${k + 1}` : 'Already last', disabled: k >= 8, hint: by[String(k + 1)] ? `${name(String(k + 1))} moves up in its place` : '', act: () => moveSlot(sl, String(k + 1)) }] }) }; }) }; };
    const nodeMenu = id => { const n = nodeOf(id), N = N_(id); if(!n || !N) return null;
      const wires = [...Object.values(n.inputs || {}), ...Object.values(n.outputs || {})].reduce((a, p) => a + ((p.connections || []).length), 0);
      const from = N.outs.length ? wireStart(id, 'out') : null, into = N.ins.length ? wireStart(id, 'in') : null;
      const groupable = n.name !== 'surface' && n.name !== 'groupout';
      return { title: labelOf(id), hint: N.doc || forgeCatName(N.cat), items: [
        { glyph: '?', label: 'About this part', hint: 'its wiki page: what it does, and each input, output and setting', act: () => F.goWiki && F.goWiki('part:' + n.name) },
        { sep: true },
        ...(n.name === 'group' ? [{ glyph: '▸', label: 'Open the group', hint: 'see and edit the parts inside it', act: () => openGroup(id) },
          { glyph: '⊟', label: 'Ungroup', hint: 'put its parts back on the grid, wired as before', act: () => ungroup(id) }, { sep: true }] : []),
        ...(from ? [{ glyph: '⟿', label: 'Connect its output…', hint: (N.outs.length === 1 ? `${forgeWord(N.outs[0])}: ` : 'choose an output, then ') + `${forgeClick()} the part it should feed`, ...from }] : []),
        ...(into ? [{ glyph: '⟾', label: 'Connect an input…', hint: `choose an input, then ${forgeClick()} the part it should come from`, ...into }] : []),
        ...(from || into ? [{ sep: true }] : []),
        ...(n.name === 'surface' && Object.keys(knobsBySlot()).length ? [{ glyph: '☰', label: 'Order of the sliders…', hint: 'which page slider each Knob controls; reorder them', sub: orderSpec }, { sep: true }] : []),
        { glyph: '⌖', label: isPinned(id) ? 'Unpin it' : 'Pin it in place', hint: isPinned(id) ? 'it can be moved and tidied again' : 'it can’t be dragged, and Tidy leaves it in place', act: () => setData(id, { _pin: isPinned(id) ? undefined : true }) },
        { glyph: '⧉', label: 'Duplicate', disabled: n.name === 'surface' || n.name === 'groupout', hint: n.name === 'surface' ? 'a graph has exactly one Surface' : n.name === 'groupout' ? 'a group has exactly one Group Result' : n.name === 'group' ? 'a copy of the group and everything inside it, without wires' : 'a copy with the same settings, without wires',
          act: () => { if(n.name === 'group'){ dupGroup(id); return; } const d = JSON.parse(JSON.stringify(n.data || {})); delete d._pin; add(n.name, n.pos_x + 30, n.pos_y + 40, d); } },
        ...(groupable ? [{ glyph: '▣', label: 'Make a group…', hint: `${forgeClick()} parts or drag a box around them, then Make the group`, act: () => startPick(id) }] : []),
        { glyph: '↺', label: 'Reset all settings', hint: 'every setting back to its default', disabled: !N.params.length, act: () => { const d = forgeNodeData(n.name); const patch = {};
            for(const k of Object.keys(n.data || {})) if(k[0] !== '_') patch[k] = undefined; Object.assign(patch, d); setData(id, patch); } },
        { glyph: '✂', label: wires ? `Disconnect all wires (${wires})` : 'No wires connected', hint: wires ? 'removes its wires; the part stays' : '', disabled: !wires, act: () => { ed.removeConnectionNodeId('node-' + id); paintNode(id); save(); touched(); } },
        { sep: true },
        n.name === 'surface' ? { glyph: '✕', label: 'The Surface can’t be deleted', hint: 'every graph ends in exactly one', disabled: true }
          : { glyph: '✕', label: 'Delete this part', hint: 'its wires go with it', danger: true, act: () => removeAsked(id) }] }; };
    const portMenu = (id, side, j) => { const n = nodeOf(id), N = N_(id); if(!n || !N) return null;
      const key = (side === 'in' ? 'input_' : 'output_') + (j + 1), p = (side === 'in' ? n.inputs : n.outputs)[key] || { connections: [] }, cnt = (p.connections || []).length;
      const name = forgeWord(side === 'in' ? N.ins[j] : N.outs[j]), t = side === 'in' ? N.inTypes[j] : N.outTypes[j];
      return { title: `${labelOf(id)}: ${name}`, hint: `${side === 'in' ? 'An input: takes' : 'An output: gives'} ${FORGE_TYPE_NAMES[t] || ''}`, items: [
        side === 'out' ? { glyph: '⟿', label: 'Connect to…', hint: `then ${forgeClick()} the part it should feed`, act: () => startWire('out', id, key) }
          : { glyph: '⟾', label: cnt ? 'Replace its connection…' : 'Connect from…', hint: `then ${forgeClick()} the part it should come from`, act: () => startWire('in', id, key) },
        { glyph: '?', label: `What is ${FORGE_TYPE_NAMES[t] || 'this'}?`, hint: 'in the wiki', act: () => F.goWiki && F.goWiki(({ field: 'graymap', image: 'picture', colour: 'color', value: 'number', curve: 'curve' })[t] || 'kinds') },
        { glyph: '✂', label: cnt ? (cnt === 1 ? 'Disconnect' : `Disconnect all ${cnt}`) : 'Nothing connected', disabled: !cnt, act: () => {
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
          items.push({ glyph: '↔', label: 'Set wire range…', hint: 'how much of the setting’s range the wire sweeps: ' + (n.data['~' + key] ? String(n.data['~' + key]).replace(',', ' to ') : `now all of it, ${lo} to ${hi}`), act: async () => {
            // (two handles, ROADMAP D3: where the setting is with the wire at 0, and at 1; the first above the second reverses it)
            const cur = n.data['~' + key] ? String(n.data['~' + key]).split(',').map(Number) : [lo, hi];
            const r = await promptFor({ title: `${label}: wire range`, body: `What the setting is when the wire is at its lowest (0) and at its highest (1).`, range: { lo, hi, a: cur[0], b: cur[1], low: 'Wire at 0', high: 'Wire at 1' }, confirmLabel: 'Set' });
            if(!Array.isArray(r)) return; const a = Math.max(lo, Math.min(hi, r[0])), b = Math.max(lo, Math.min(hi, r[1]));
            setData(id, { ['~' + key]: (a === lo && b === hi) ? undefined : `${a},${b}` }); } });
          // ⇄ (ROADMAP D3, Filter Forge's remapper): the same wire, the other way round
          { const cur = n.data['~' + key] ? String(n.data['~' + key]).split(',').map(Number) : [lo, hi];
            items.push({ glyph: '⇄', label: 'Reverse the wire', hint: `its lowest now gives ${cur[1]}, its highest ${cur[0]}`, act: () => setData(id, { ['~' + key]: cur[1] === lo && cur[0] === hi ? undefined : `${cur[1]},${cur[0]}` }) }); }
          if(n.data['~' + key]) items.push({ glyph: '⟷', label: 'Use the full range again', hint: `${lo} to ${hi}`, act: () => setData(id, { ['~' + key]: undefined }) });
          items.push({ glyph: '?', label: 'About wire ranges', hint: 'in the wiki', act: () => F.goWiki && F.goWiki('ranges') });
          items.push({ glyph: '✂', label: 'Disconnect the wire', hint: 'the setting’s own slider takes over again', act: () => { const p = n.inputs['input_' + port]; for(const c of [...(p.connections || [])]) ed.removeSingleConnection(c.node, id, c.input, 'input_' + port); } });
        } else {
          const bindTo = (src, range) => setData(id, { [key]: '@' + src + (range ? `[${range[0]},${range[1]}]` : '') });
          const curRange = bound ? (/\[([^\]]+)\]/.exec(v) || [])[1] : null;
          items.push({ glyph: '◐', label: 'Bind to a page slider', hint: 'it follows one of the eight sliders under Surface Texture, without a wire', sub: () => ({ title: `${label}: bind to a slider`, hint: 'The slider moves it across its range.', items:
            [1, 2, 3, 4, 5, 6, 7, 8].map(k => ({ glyph: String(k), label: `Slider ${k}`, act: () => bindTo('k' + k, curRange && curRange.split(',')) })) }) });
          items.push({ glyph: '☼', label: 'Bind to the light dial', hint: 'it follows the dial\'s direction', act: () => bindTo('dial', curRange && curRange.split(',')) });
          if(port){
            items.push({ glyph: '⟾', label: 'Connect from…', hint: `then ${forgeClick()} the part that should drive it`, act: () => startWire('in', id, 'input_' + port) });
            items.push({ glyph: '☽', label: 'Add a Knob for it', hint: 'a page slider, wired in and named after this setting', act: () => wireIn(id, key, port, 'knob') });
            items.push({ glyph: '☼', label: 'Add a Light Dial for it', hint: 'the light\'s direction drives it', act: () => wireIn(id, key, port, 'dial') });
            items.push({ glyph: '?', label: 'About ⚙ settings', hint: 'in the wiki', act: () => F.goWiki && F.goWiki('ports') });
          }
          if(bound){
            items.push({ glyph: '↔', label: 'Set its range…', hint: 'the values at the slider\'s two ends: ' + (curRange ? curRange.replace(',', ' to ') : `now ${lo} to ${hi}`), act: async () => {
              const cur = curRange ? curRange.split(',').map(Number) : [lo, hi];
              const r = await promptFor({ title: `${label}: range`, body: `What the setting is with the slider (or dial) at its lowest and at its highest.`, range: { lo, hi, a: cur[0], b: cur[1], low: 'Slider at its lowest', high: 'Slider at its highest' }, confirmLabel: 'Set' });
              if(!Array.isArray(r)) return;
              const a = Math.max(lo, Math.min(hi, r[0])), b = Math.max(lo, Math.min(hi, r[1]));
              setData(id, { [key]: v.replace(/\[.*$/, '') + `[${a},${b}]` }); } });
            items.push({ glyph: '⊘', label: 'Unbind', hint: 'a plain setting again', act: () => setData(id, { [key]: def }) });
          }
        }
      }
      items.push({ glyph: '↺', label: `Reset to default (${def})`, act: () => setData(id, { [key]: def }) });
      // (a setting that takes a map says so: what a gray map on its ⚙ does)
      // (in a graph older than the setting's map input, a map is still averaged: the graph draws as it did)
      const byPoint = (N.maps || []).includes(key) && (F.version || ATHANOR_VERSION) >= ((N.mapsSince || {})[key] || 3) ? '; a gray map on its ⚙ sets it point by point' : port ? '; a map on its ⚙ gives it the map’s average' : '';
      return { title: `${label}`, hint: `a setting of ${labelOf(id)}` + (wired ? ', driven by a wire' : bound ? `, bound to ${v.slice(1).replace(/\[.*$/, '').replace(/^k/, 'slider ')}` : '') + byPoint, items };
    };
    // a Knob (or the Light Dial) set beside a node and wired into one of its ⚙ ports
    const wireIn = (id, key, port, kind) => {
      const n = nodeOf(id); if(!n) return;
      const P = (N_(id).params.find(p => p[0] === key) || []), x = P[4] || { min: 0, max: 100 };
      const cur = parseFloat(n.data[key]); const at = isFinite(cur) ? Math.round((cur - x.min)/((x.max - x.min) || 1)*100) : 50;
      const used = new Set(Object.values(rawNodes()).filter(m => m.name === 'knob').map(m => String((m.data || {}).slot || '1')));
      const slot = ['1', '2', '3', '4', '5', '6', '7', '8'].find(s => !used.has(s)) || '1';
      const nid = add(kind, n.pos_x - 250, n.pos_y + 10 + (port - 1)*22, kind === 'knob' ? { slot, name: P[1] || 'Amount', def: Math.max(0, Math.min(100, at)) } : {});
      if(nid != null) ed.addConnection(nid, id, 'output_1', 'input_' + port);
    };
    const canvasMenu = (cx, cy) => { const g = toGrid(cx, cy); return { title: 'The grid', items: [
      { glyph: '＋', label: 'Add a part here', sub: () => ({ title: 'Add a part here', items: FORGE_CATEGORIES.map(cat => ({ glyph: FORGE_CAT_GLYPHS[cat] || '', label: forgeCatName(cat), colour: FORGE_CAT_COLOURS[cat],
        sub: () => ({ title: forgeCatName(cat), items: Object.entries(FORGE_NODES).filter(([, nn]) => nn.cat === cat && !nn.hidden).map(([type, nn]) => ({ glyph: FORGE_CAT_GLYPHS[cat] || '', label: nn.label, colour: forgePartColour(nn), act: () => add(type, g.x, g.y) })) }) })) }) },
      { glyph: '⌖', label: 'Fit everything in view', act: () => fitView() },
      { glyph: '▦', label: 'Tidy into columns', hint: 'left to right, in the order data flows; pinned parts stay put', act: () => tidy() }] }; };
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
      const N = N_(t.id), colour = N ? forgePartColour(N) : '';
      if(t.kind === 'node') return { glyph: N ? FORGE_CAT_GLYPHS[N.cat] : '', label: labelOf(t.id), hint: 'part', colour };
      if(t.kind === 'param'){ const P = N.params.find(p => p[0] === t.p) || []; return { glyph: '⚙', label: P[1] || t.p, hint: `a setting on ${labelOf(t.id)}`, colour: 'var(--t-value)' }; }
      const name = t.side === 'in' ? N.ins[t.j] : N.outs[t.j], ty = t.side === 'in' ? N.inTypes[t.j] : N.outTypes[t.j];
      return { glyph: t.side === 'in' ? '▸' : '◂', label: `${labelOf(t.id)}’s ${forgeWord(name)}`, hint: `${t.side === 'in' ? 'takes' : 'gives'} ${FORGE_TYPE_NAMES[ty]}`, colour: `var(--t-${ty})` };
    };
    // a long press: one thing → its menu; several close together → which did you mean?
    const menuAt = (x, y, touch) => {
      if(touch){ ed.drag = false; ed.editor_selected = false; if(ed.connection){ ed.connection = false; if(ed.connection_ele){ ed.connection_ele.remove(); ed.connection_ele = null; } } }
      hideCut();
      const all = thingsNear(x, y, touch ? 18 : 5);
      // while wiring: the part held is the other end
      if(pending){ const t = all.find(q => q.id && q.id !== pending.id);
        openMenu(x, y, t ? connectMenu(t.id) : { title: 'Wiring', hint: `${forgeClick(true)} the part to wire to.`, items: [{ glyph: '✕', label: 'Cancel wiring', act: stopWire }] }); return; }
      const own = all.length > 1 && all[0].kind !== 'node' ? all.filter(t => !(t.kind === 'node' && t.id === all[0].id)) : all;
      if(!own.length){ openMenu(x, y, canvasMenu(x, y)); return; }
      if(own.length === 1){ const m = menuFor(own[0], x, y); if(m && own[0].kind !== 'node' && own[0].id){ m.items.push({ sep: true }, { glyph: '◇', label: `The ${labelOf(own[0].id)} node`, sub: () => nodeMenu(own[0].id) }); } openMenu(x, y, m); return; }
      openMenu(x, y, { title: 'Which did you mean?', hint: 'Several things are close together here. Choose one.', items: own.slice(0, 6).map(t => ({ ...describe(t), sub: () => menuFor(t, x, y) })) });
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
        // (on a touch screen never below 0.6: a big graph is panned, not shrunk past touching — the usability review)
        const W = r.width - dw, H = r.height, zMin = forgeTouch() ? Math.max(ed.zoom_min, 0.6) : ed.zoom_min, z = Math.max(zMin, Math.min(1, (W - pad*2)/(x1 - x0), (H - pad*2)/(y1 - y0)));
        const mx = r.width/2, my = r.height/2;
        ed.zoom = z; ed.zoom_last_value = z;
        // the grid scales about its middle: place the nodes' corner at (pad, pad), centred in what is left
        const fx = pad + Math.max(0, (W - pad*2 - (x1 - x0)*z)/2), fy = pad + Math.max(0, (H - pad*2 - (y1 - y0)*z)/2);
        ed.canvas_x = fx - mx - (x0 - mx)*z; ed.canvas_y = fy - my - (y0 - my)*z;
      }
      ed.precanvas.style.transform = `translate(${ed.canvas_x}px, ${ed.canvas_y}px) scale(${ed.zoom})`;
    };
    F.fitView = fitView;
    // THE WHEEL zooms toward the pointer, with or without Ctrl (Drawflow's own zoomed only with Ctrl,
    // about the middle, and a big texture's graph opened at the farthest zoom out could not go
    // further: Ruby's "the zoom locks"). The view's centre is its origin, as fitView has it.
    area.addEventListener('wheel', e => {
      if(e.target.closest && e.target.closest('input, select, textarea, .forge-menu')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const r = area.getBoundingClientRect(), mx = r.width/2, my = r.height/2, sx = e.clientX - r.left, sy = e.clientY - r.top, z0 = ed.zoom || 1;
      // a mouse wheel in Firefox counts LINES (3 a notch), a trackpad pixels: lines and pages become pixels
      const dy = e.deltaY*(e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
      const z = Math.max(ed.zoom_min, Math.min(ed.zoom_max, z0*Math.exp(-Math.max(-60, Math.min(60, dy))*0.0022)));
      const px = (sx - ed.canvas_x - mx)/z0 + mx, py = (sy - ed.canvas_y - my)/z0 + my;
      ed.zoom = z; ed.zoom_last_value = z; ed.canvas_x = sx - mx - (px - mx)*z; ed.canvas_y = sy - my - (py - my)*z;
      ed.precanvas.style.transform = `translate(${ed.canvas_x}px, ${ed.canvas_y}px) scale(${ed.zoom})`;
    }, { capture: true, passive: false });
    const tidy = (spread = 1) => {
      const g = athanorNumbered(slim()), data = (g.drawflow[ed.module] || g.drawflow.Home).data, pins = {};
      for(const [id, n] of Object.entries(data)) if(n.data && n.data._pin) pins[id] = [n.pos_x, n.pos_y];
      layoutAthanor(data, spread); for(const [id, p] of Object.entries(pins)){ data[id].pos_x = p[0]; data[id].pos_y = p[1]; }
      load(g, true, ed.module); touched(); setTimeout(fitView, 30);
    };
    // PINCH (Ruby: the zoom was touchy): Drawflow zoomed a fixed step on every move of two fingers, so quick fingers
    // flew. Here the zoom follows the fingers' spread (twice as far apart, twice as near), about the point between
    // them, and the grid doesn't pan under a pinch until every finger has lifted.
    { const fingers = new Map(); let pinch = null, held = false;
      const between = () => { const [a, b] = [...fingers.values()]; return { x: (a.x + b.x)/2, y: (a.y + b.y)/2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };
      area.addEventListener('pointerdown', e => { if(e.pointerType !== 'touch') return; fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if(fingers.size === 2){ const m = between(); pinch = { d: Math.max(24, m.d), z: ed.zoom || 1, cx: ed.canvas_x, cy: ed.canvas_y, x: m.x, y: m.y }; held = true; e.stopImmediatePropagation(); } }, true);
      area.addEventListener('pointermove', e => {
        if(!fingers.has(e.pointerId)) return; fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if(!pinch || fingers.size < 2){ if(held) e.stopImmediatePropagation(); return; }
        e.stopImmediatePropagation(); e.preventDefault();
        const m = between(), r = area.getBoundingClientRect(), W2 = r.width/2, H2 = r.height/2, z = Math.max(ed.zoom_min, Math.min(ed.zoom_max, pinch.z*m.d/pinch.d));
        // the grid point first under the fingers stays under them
        const px = (pinch.x - r.left - pinch.cx - W2)/pinch.z + W2, py = (pinch.y - r.top - pinch.cy - H2)/pinch.z + H2;
        ed.zoom = z; ed.zoom_last_value = z; ed.canvas_x = m.x - r.left - W2 - (px - W2)*z; ed.canvas_y = m.y - r.top - H2 - (py - H2)*z;
        ed.precanvas.style.transform = `translate(${ed.canvas_x}px, ${ed.canvas_y}px) scale(${ed.zoom})`; }, true);
      const lift = e => { fingers.delete(e.pointerId); if(fingers.size < 2) pinch = null; if(!fingers.size) held = false; };
      for(const ev of ['pointerup', 'pointercancel']) area.addEventListener(ev, lift, true);
      area.addEventListener('touchmove', e => { if(held || e.touches.length > 1){ e.stopImmediatePropagation(); if(e.cancelable) e.preventDefault(); } }, { capture: true, passive: false }); }
    // SNAP TO THE GRID (Ruby): a moved part settles on the grid, when asked (an app preference)
    const SNAP_KEY = 'uv.forge.snap', SNAP = 24;
    const snapOn = () => { try { return localStorage.getItem(SNAP_KEY) === '1'; } catch(e){ return false; } };
    const snapNode = id => { const n = (((ed.drawflow || {}).drawflow || {})[ed.module] || {}).data, d = n && n[id]; if(!d) return;
      const x = Math.round(d.pos_x/SNAP)*SNAP, y = Math.round(d.pos_y/SNAP)*SNAP; if(x === d.pos_x && y === d.pos_y) return;
      d.pos_x = x; d.pos_y = y; const el = area.querySelector('#node-' + id); if(el){ el.style.left = x + 'px'; el.style.top = y + 'px'; } ed.updateConnectionNodes('node-' + id); };
    F.snapNode = id => { if(snapOn()) snapNode(id); };
    // ---- the bar ----
    const count = () => Object.keys(nodesOf()).length;
    const clearAll = async () => {
      if(count() && F.dirty && !await ask({ title: 'Clear the whole graph?', body: 'Every part and wire is removed. Undo or Revert can bring them back.', confirmLabel: 'Clear', danger: true })) return;
      F.quiet = true; ed.module = 'Home'; F.path = []; ed.clear(); add('surface', 420, 90); F.quiet = false; F.version = ATHANOR_VERSION; save(); F.dirty = false; sound('nodeRemove'); if(F.paintCrumb) F.paintCrumb();
    };
    const revert = async () => {
      if(!F.opened) return;
      if(F.dirty && !await ask({ title: 'Revert to how it was?', body: 'Every change since the Athanor opened is undone.', confirmLabel: 'Revert', danger: true })) return;
      load(JSON.parse(F.opened)); sound('graphLoad'); setTimeout(fitView, 30);
    };
    // open a graph (a starter, a template, a kept surface) in place of this one — asking first if this one has changed
    // (asked: whoever calls has asked already — the Surface card's Open in the Athanor)
    const openGraph = async (g, label, teach, asked) => {
      if(!asked && count() && (F.dirty || (deps.unkept && deps.unkept())) && !await ask({ title: `Replace this graph with “${label}”?`, body: 'The graph on the grid is replaced. Undo or Revert can bring it back.', confirmLabel: 'Replace', danger: true })) return false;
      stopWire(); load(g); sound('graphLoad'); setTimeout(fitView, 30); showNote(label, teach); return true;
    };
    F.openGraph = openGraph;
    // WHAT A GRAPH TEACHES: a note over the grid when a starter or a texture is opened
    const note = (() => { let el = $('forgeNote'); if(!el && body){ el = document.createElement('div'); el.id = 'forgeNote'; el.className = 'forge-note'; el.hidden = true; body.appendChild(el); } return el; })();
    const showNote = (label, teach) => { if(!note) return; if(!teach){ note.hidden = true; veil.classList.remove('note-open'); return; }
      note.innerHTML = `<b>${forgeEsc(label)}</b><p>${forgeEsc(teach)}</p><p class="forge-note-how">${forgeHoldWord()} any part for its menu; <b>About this part</b> opens its page in the wiki.</p><button type="button" class="forge-note-x" aria-label="Close">✕</button>`;
      note.hidden = false; veil.classList.add('note-open'); };
    F.showNote = showNote;
    // the note stays until it is closed — by its ✕ or by a click anywhere else (Ruby); while it shows,
    // the grid dims a little behind it, so the note is what is read first
    const hideNote = () => { if(note && !note.hidden){ note.hidden = true; veil.classList.remove('note-open'); } };
    if(note) note.addEventListener('click', e => { if(e.target.closest && e.target.closest('.forge-note-x')) hideNote(); });
    veil.addEventListener('pointerdown', e => { if(note && !note.hidden && !(e.target.closest && e.target.closest('.forge-note'))) hideNote(); }, true);
    // OPEN, AS A DRAWER (Ruby: one place for everything there is to begin from, shown as the surface menu shows its
    // surfaces): your kept surfaces, the starters, the Basics, the Surface Studies and the app's own textures by
    // group, as tiles. A hidden <select> holds them and the page's tile drawer (chooser.js) shows it: it drops from
    // the bar on a desk and slides in from the side on a phone. Its face names the graph on the grid.
    const openSel = $('forgeOpenSelect'), openActs = new Map(), openWords = new Map();
    let openCh = null;
    const fillOpen = () => { if(!openSel) return;
      openSel.innerHTML = ''; openActs.clear(); openWords.clear();
      // (its face: what is on the grid — on a phone, its name alone)
      const now = document.createElement('option'); now.value = ''; now.hidden = true; now.textContent = phoneNow() ? surfaceName() : fill(FORGE_BAR.openNow, surfaceName()); openSel.appendChild(now);
      const group = (glyph, label, items) => { if(!items.length) return; const g = document.createElement('optgroup'); g.label = glyph + ' ' + label;
        for(const [v, text, act, words] of items){ const o = document.createElement('option'); o.value = v; o.textContent = text; g.appendChild(o); openActs.set(v, act); openWords.set(v, words || ''); }
        openSel.appendChild(g); };
      const starter = (k, S) => async () => { const g = athanorStarter(k); if(g) await openGraph(g, S.label, S.teach); };
      const chained = TEXTURE_GROUPS.map(g => [g, g.types.filter(t => TEXTURE_CHAINS[t]).sort((p, q) => TEXTURE_CHAINS[p].label.localeCompare(TEXTURE_CHAINS[q].label))]).filter(([, ts]) => ts.length);
      group('🜉', FORGE_BAR.yours, forgeShelf().slice().reverse().map(rec => ['kept:' + encodeURIComponent(rec.name), rec.name, () => openKept(rec)]));
      group('🜈', FORGE_BAR.starters, Object.entries(ATHANOR_STARTERS).map(([k, S]) => ['starter:' + k, S.label, starter(k, S), S.teach]));
      group(ATHANOR_BASICS.glyph, FORGE_BAR.basics, ATHANOR_BASICS.types.filter(t => TEXTURE_CHAINS[t]).map(k => [k, TEXTURE_CHAINS[k].label, starter(k, TEXTURE_CHAINS[k]), TEXTURE_CHAINS[k].teach]));
      group('🜍', FORGE_BAR.studies, Object.entries(ATHANOR_STUDIES).sort((p, q) => p[1].label.localeCompare(q[1].label)).map(([k, S]) => ['study:' + k, S.label, starter(k, S), S.teach]));
      for(const [g, ts] of chained) group(g.glyph, g.name, ts.map(k => [k, TEXTURE_CHAINS[k].label, starter(k, TEXTURE_CHAINS[k]), TEXTURE_CHAINS[k].teach]));
      openSel.value = ''; if(openCh) openCh.refresh(); };
    F.fillOpen = fillOpen;
    // WHETHER THE PAGE SHOWS THIS GRAPH: said in the bar, and a tap puts it there when it doesn't (what Use did)
    const paintPage = () => { const b = $('forgePageBtn'); if(!b) return; const on = !!(deps.onPage && deps.onPage());
      // (on a phone, its glyph alone: ✓ or ⇱; its title says the rest)
      const phone = !!(document.body && document.body.classList.contains('is-mobile')), txt = on ? FORGE_BAR.onPage : FORGE_BAR.toPage;
      b.textContent = phone ? txt.split(' ')[0] : txt; b.title = on ? FORGE_BAR.onPageHint : FORGE_BAR.toPageHint; b.setAttribute('aria-label', txt.slice(2));
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    const toPage = () => { if(deps.use && !(deps.onPage && deps.onPage())){ deps.use(); sound('nodeAdd'); } paintPage(); };
    F.paintPage = paintPage;
    if($('forgePageBtn')) $('forgePageBtn').addEventListener('click', toPage);
    // ⋯: everything else, on every device
    if($('forgeMoreBtn')) $('forgeMoreBtn').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(), onPage = !!(deps.onPage && deps.onPage());
      openMenu(r.left, r.bottom + 4, { title: FORGE_BAR.more, items: [
        ...(onPage ? [] : [{ glyph: '⇱', label: FORGE_BAR.toPageItem, hint: FORGE_BAR.toPageHint, act: toPage }]),
        { glyph: '⧉', label: KEPT.copy, hint: KEPT.copyHint, act: () => copyKept(onGrid()) },
        ...(canShare() ? [{ glyph: '⇗', label: KEPT.share, act: () => shareKept(onGrid()) }] : []),
        { glyph: '🜉', label: FORGE_BAR.shelf, hint: FORGE_BAR.shelfHint, sub: shelfMenu },
        { sep: true },
        { glyph: '▦', label: FORGE_BAR.tidy, hint: FORGE_BAR.tidyHint, act: () => tidy() },
        { glyph: '⇹', label: FORGE_BAR.spread, hint: FORGE_BAR.spreadHint, act: () => tidy(2.2) },
        { glyph: '⌗', label: snapOn() ? FORGE_BAR.snapOff : FORGE_BAR.snapOn, hint: FORGE_BAR.snapHint,
          act: () => { try { localStorage.setItem(SNAP_KEY, snapOn() ? '0' : '1'); } catch(e){} } },
        { glyph: '↶', label: FORGE_BAR.revert, hint: FORGE_BAR.revertHint, act: revert },
        { glyph: '✕', label: FORGE_BAR.clear, hint: FORGE_BAR.clearHint, danger: true, act: clearAll },
        { sep: true },
        { glyph: '?', label: FORGE_BAR.help, hint: FORGE_BAR.helpHint, act: () => F.showDoc && F.showDoc(true) }] }); });
    // ---- the shelf: keep a surface by name, open one kept, carry them as a file ----
    const surfaceId = () => { const e = Object.entries(rawNodes()).find(([, n]) => n.name === 'surface'); return e ? e[0] : null; };
    const surfaceName = () => { const s = Object.values((mods().Home || {}).data || {}).find(n => n.name === 'surface'); return ((s && s.data && s.data.name) || 'My Surface').trim(); };
    // ONE NAME: the name it is kept under is the Surface part's name; keeping it under another renames the part
    const keep = async () => {
      if(!count()){ if(deps.warn) deps.warn(['there is nothing on the grid to keep']); return; }
      const name = await promptFor({ title: KEPT.keepAsk, body: KEPT.keepBody, input: true, defaultValue: surfaceName(), confirmLabel: KEPT.keep });
      const clean = String(name || '').trim().slice(0, 60); if(!clean) return;
      const at = forgeShelf().find(r => r.name.toLowerCase() === clean.toLowerCase());
      if(at && !await ask({ title: fill(KEPT.replaceAsk, at.name), body: KEPT.replaceBody, confirmLabel: KEPT.replace, danger: true })) return;
      const sid = surfaceId(); if(sid && surfaceName() !== clean) setData(sid, { name: clean });
      if(!forgeShelfPut({ name: clean, graph: JSON.stringify(slim()), savedAt: new Date().toISOString() })){ if(deps.warn) deps.warn(['this browser couldn’t save it (storage is full or blocked)']); return; }
      sound('nodeAdd'); if(deps.onShelf) deps.onShelf(); fillOpen();
    };
    // a kept surface replaced by the graph on the grid (it keeps its own name, and so does the Surface part)
    const replaceKept = async rec => {
      if(!count()){ if(deps.warn) deps.warn(['there is nothing on the grid to keep']); return; }
      if(!await ask({ title: fill(KEPT.replaceWithAsk, rec.name), body: KEPT.replaceWithBody, confirmLabel: KEPT.replace, danger: true })) return;
      const sid = surfaceId(); if(sid && surfaceName() !== rec.name) setData(sid, { name: rec.name });
      forgeShelfPut({ name: rec.name, graph: JSON.stringify(slim()), savedAt: new Date().toISOString() }); sound('nodeAdd'); if(deps.onShelf) deps.onShelf();
    };
    const openKept = async rec => {
      const v = deps.validate ? deps.validate(rec.graph) : { ok: true, graph: JSON.parse(rec.graph), problems: [] };
      if(!v.ok){ if(deps.refuse) deps.refuse('That kept surface can’t be opened', v.problems.join('; ') + '. Nothing was changed.'); return; }
      if(v.problems.length && deps.warn) deps.warn(v.problems);
      await openGraph(forgeNameSurface(v.graph, rec.name), rec.name);
    };
    // (Open's drawer is filled once the shelf's helpers above exist)
    if(openSel){
      fillOpen();
      openCh = F.openCh = deps.chooser ? deps.chooser(openSel, { title: FORGE_BAR.openTitle, extra: v => openWords.get(v) || '' }) : null;
      openSel.addEventListener('change', async () => { const act = openActs.get(openSel.value); if(act) await act(); fillOpen(); });
      if(openCh && openCh.button){ openCh.button.classList.add('forge-open'); openCh.button.addEventListener('click', () => F.onlyThis && F.onlyThis('open'), true); }
    }
    const dropKept = async rec => {
      if(!await ask({ title: `Remove “${rec.name}” from the shelf?`, body: 'Looks that use it keep their own copy.', confirmLabel: 'Remove', danger: true })) return;
      forgeShelfWrite(forgeShelf().filter(r => r.name !== rec.name)); if(deps.onShelf) deps.onShelf(); fillOpen();
    };
    const copyKept = async rec => { const text = forgeWiringText([rec]);
      if(await forgeCopy(text)){ if(deps.toast) deps.toast(fill(KEPT.copied, rec.name)); }
      else await promptFor({ title: KEPT.copy, body: KEPT.copyFailed, input: true, rows: 8, defaultValue: text, confirmLabel: 'Done', alert: true }); };
    const shareKept = rec => { try { navigator.share({ title: rec.name, text: forgeWiringText([rec]) }).catch(() => {}); } catch(e){} };
    const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    // the graph on the grid, as a kept surface would carry it (for Copy and Share before it is kept)
    const onGrid = () => ({ name: surfaceName(), graph: JSON.stringify(slim()), savedAt: new Date().toISOString() });
    // surfaces pasted as text (what Copy the wiring makes): onto the shelf, asking before one replaces another
    const takeIn = async (read) => {
      if(!read || !read.surfaces.length){ if(deps.refuse) deps.refuse(KEPT.pasteAsk, KEPT.pasteNone); return 0; }
      const have = new Set(forgeShelf().map(r => r.name.toLowerCase())), clash = read.surfaces.filter(r => have.has(r.name.toLowerCase()));
      if(clash.length && !await ask({ title: fill(KEPT.replaceAsk, clash.map(r => r.name).join('”, “')), body: KEPT.replaceBody, confirmLabel: KEPT.replace, danger: true })) return 0;
      for(const r of read.surfaces) forgeShelfPut(r);
      if(deps.onShelf) deps.onShelf();
      if(deps.warn) deps.warn([`${read.surfaces.length} surface${read.surfaces.length === 1 ? '' : 's'} put on the shelf` + (read.bad ? `, ${read.bad} left out (unreadable)` : '')]);
      return read.surfaces.length;
    };
    const pasteKept = async () => {
      const text = await promptFor({ title: KEPT.pasteAsk, body: KEPT.pasteBody, input: true, rows: 6, defaultValue: '', confirmLabel: 'Put it on the shelf' });
      if(text == null || !String(text).trim()) return;
      await takeIn(forgeReadSurfaces(String(text), deps.validate));
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
        const read = forgeReadSurfaces(await f.text(), deps.validate);
        if(!read){ if(deps.refuse) deps.refuse('That isn’t readable JSON', 'Nothing was changed.'); return; }
        await takeIn(read);
      });
      inp.click();
    };
    const shelfMenu = () => { const list = forgeShelf(); return { title: FORGE_BAR.shelf.replace('…', ''), hint: list.length ? 'Kept in this browser.' : 'Nothing kept yet. Keep, in the bar, saves the graph here.', items: [
      ...list.slice().reverse().map(rec => ({ glyph: '🜉', label: rec.name, hint: String(rec.savedAt || '').slice(0, 10), sub: () => ({ title: rec.name, items: [
        { glyph: '⇩', label: 'Open it in the editor', act: () => openKept(rec) },
        { glyph: '⟲', label: KEPT.replaceWith, danger: true, act: () => replaceKept(rec) },
        { glyph: '⧉', label: KEPT.copy, hint: KEPT.copyHint, act: () => copyKept(rec) },
        ...(canShare() ? [{ glyph: '⇗', label: KEPT.share, act: () => shareKept(rec) }] : []),
        { glyph: '✕', label: KEPT.drop, danger: true, act: () => dropKept(rec) }] }) })),
      { sep: true },
      { glyph: '⎘', label: KEPT.paste, act: pasteKept },
      { glyph: '⇪', label: 'Save the shelf as a file', hint: 'every kept surface, to back up or share', disabled: !list.length, act: exportShelf },
      { glyph: '⇣', label: 'Bring surfaces in from a file…', act: importShelf }] }; };
    // Keep, one tap from the bar (Ruby: it was two menus deep)
    if($('forgeKeepBtn')) $('forgeKeepBtn').addEventListener('click', () => keep());
    if($('forgeUndo')) $('forgeUndo').addEventListener('click', () => stepHist(-1));
    if($('forgeRedo')) $('forgeRedo').addEventListener('click', () => stepHist(1));
    if($('forgeZoomIn')) $('forgeZoomIn').addEventListener('click', () => ed.zoom_in());
    if($('forgeZoomOut')) $('forgeZoomOut').addEventListener('click', () => ed.zoom_out());
    if($('forgeFit')) $('forgeFit').addEventListener('click', () => fitView());
    // the step previews: each node shows what it makes (worked out in the texture worker); off while you work, if you like
    const sp = $('forgeSteps');
    if(sp){ try { sp.checked = localStorage.getItem('uv.forge.steps') !== '0'; } catch(e){ sp.checked = true; }
      area.classList.toggle('steps-on', sp.checked);
      sp.addEventListener('change', () => { area.classList.toggle('steps-on', sp.checked); try { localStorage.setItem('uv.forge.steps', sp.checked ? '1' : '0'); } catch(e){} previews(); }); }
    // the preview's channel (ROADMAP B2): one thing the Surface is made of at a time; view only, Final when it opens again
    const ch = $('forgeChannel'); if(ch && ch.addEventListener) ch.addEventListener('change', () => previews());
    // the preview: tap for large, tap again for small
    const pv = $('forgePreview'); if(pv) pv.addEventListener('click', () => { const d = $('forgeDock'); if(d) d.classList.toggle('big'); });
    // the help: what each colour carries, and the few things worth knowing
    // THE HELP: an organized document over the grid (never over the parts list), from the bar's
    // Help or the dock's ?; its sections are forgeHelpHtml's, its parts glossary the parts' own docs
    const doc = $('forgeDoc');
    // THE WIKI (Ruby): an encyclopedia of the editor — contents beside the page on a desk, folded away on a phone;
    // links between pages, a search, and Back. A part's own menu opens its page (About this part).
    const wiki = { at: 'welcome', back: [] };
    const page = () => doc && doc.querySelector('.wk-page');
    // A FIGURE: its little graph made in the worker, every part's picture laid into its tile (WIKI_FIGURES)
    const paintFigures = root => { if(!deps.figure || !root || !root.querySelectorAll) return;
      root.querySelectorAll('.wk-fig[data-fig]').forEach(fig => { const spec = WIKI_FIGURES[fig.dataset.fig]; if(!spec) return;
        deps.figure(JSON.stringify(athanorGraphOf(spec)), fig.dataset.fig, (sheet, ids, T, cols) => {
          fig.querySelectorAll('canvas[data-n]').forEach(cv => { const i = ids.indexOf(String(cv.dataset.n)); if(i < 0) return;
            cv.getContext('2d').drawImage(sheet, (i % cols)*T, Math.floor(i/cols)*T, T, T, 0, 0, cv.width, cv.height); }); }); }); };
    const goWiki = (id, push = true) => { const pg = page(); if(!pg) return;
      if(push && wiki.at && wiki.at !== id) wiki.back.push(wiki.at); wiki.at = id;
      pg.innerHTML = wikiArticleHtml(id, forgeWikiCtx()); pg.scrollTop = 0; doc.scrollTop = 0; paintFigures(pg);
      // (Previous and Next only where pages are read in order: Getting Started — Ruby)
      const pager = doc.querySelector('.wk-pager'); if(pager){ const w = wikiWalks(id); pager.innerHTML = w ? forgePagerHtml(id) : ''; pager.hidden = !w; }
      doc.classList.remove('wk-show-nav');
      doc.querySelectorAll('.wk-nav a').forEach(a => a.classList.toggle('on', a.dataset.wiki === id));
      // (the category a part is in opens in the contents, so the part shows there)
      doc.querySelectorAll('.wk-nav details.wk-nav-cat').forEach(d => { if(d.querySelector(`a[data-wiki="${CSS.escape(id)}"]`)) d.open = true; });
      const b = doc.querySelector('.wk-back'); if(b) b.disabled = !wiki.back.length; };
    const showDoc = (on, id) => { if(!doc) return; if(on) F.onlyThis('doc'); if(on && !doc.dataset.built){ doc.innerHTML = forgeHelpHtml(); doc.dataset.built = '1'; goWiki(wiki.at, false); }
      doc.hidden = !on; if(on && id) goWiki(id);
      { const b = $('forgeHelpBtn'); if(b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); } };
    F.showDoc = showDoc; F.goWiki = id => showDoc(true, id);
    if($('forgeHelpBtn')) $('forgeHelpBtn').addEventListener('click', () => showDoc(!!(doc && doc.hidden)));
    if(doc) doc.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest('[data-doc]');
      if(t){ const d = t.dataset.doc; if(d === 'close') showDoc(false); else if(d === 'contents') doc.classList.toggle('wk-show-nav'); else if(d === 'back' && wiki.back.length) goWiki(wiki.back.pop(), false); return; }
      const j = e.target.closest && e.target.closest('[data-wiki]'); if(j){ e.preventDefault(); goWiki(j.dataset.wiki); } });
    if(doc) doc.addEventListener('input', e => {
      if(!e.target.classList || !e.target.classList.contains('wk-search')) return;
      const q = e.target.value, pg = page(); if(!pg) return;
      if(!q.trim()){ goWiki(wiki.at, false); return; }
      const hits = wikiSearch(q);
      { const pager = doc.querySelector('.wk-pager'); if(pager) pager.hidden = true; }
      pg.innerHTML = `<h2>Search: ${forgeEsc(q)}</h2>` + (hits.length ? '<ul class="wk-hits">' + hits.map(h => `<li><a href="#" data-wiki="${forgeEsc(h.id)}">${forgeEsc(h.title)}</a>${h.id.startsWith('part:') ? ' <span class="wk-tag">part</span>' : ''}${h.snip ? `<span class="wk-snip">${forgeEsc(h.snip)}</span>` : ''}</li>`).join('') + '</ul>' : '<p>Nothing found. Try another word, or browse the contents.</p>'); });
    // A NEW SEED, from inside the Athanor: every part's own randomness comes from the page's seed
    if($('forgeSeedBtn') && deps.reseed) $('forgeSeedBtn').addEventListener('click', () => { deps.reseed(); previews(); });
    const lg = $('forgeLegend');
    if(lg) lg.innerHTML = VALUE_TYPES.map(t => `<span><i style="background:var(--t-${t})"></i>${forgeEsc(FORGE_TYPE_NAMES[t])}</span>`).join('')
      + `<span><i class="pp" style="background:var(--t-value)"></i>⚙ a setting that takes a wire</span>`;
  }
  // the graph saved with the look (checked first: a graph from anywhere can't break the page), or a first one
  const ed = F.editor;
  let saved = null; const raw = deps.bench() || '';
  if(raw){ const v = deps.validate ? deps.validate(raw) : { ok: true, graph: JSON.parse(raw), problems: [] };
    if(v.ok) saved = v.graph; if(v.problems && v.problems.length && deps.warn) deps.warn(v.problems); }
  if(saved && saved.drawflow) F.load(saved);
  else { F.quiet = true; ed.clear(); F.version = ATHANOR_VERSION; F.quiet = false;
    const add = (type, x, y, data) => { const N = FORGE_NODES[type], d = Object.assign(forgeNodeData(type), data || {}); return ed.addNode(type, N.ins.length, N.outs.length, x, y, forgeCatClass(N.cat), d, forgeNodeHtml(type, { textures: deps.textures || [], stitches: deps.stitches || [], lock: deps.lock || '' }, d)); };
    // (wired, so the first preview is a picture, not flat gray — the usability review)
    // (a new graph's Surface smooths its edges: Anti-aliasing, edges only — A6; older graphs keep drawing as they did)
    F.quiet = true; const a = add('noise', 40, 60), b = add('surface', 420, 90, { aa: 'edges only' }); if(a && b) ed.addConnection(a, b, 'output_1', 'input_1'); F.quiet = false; F.paintAll(); F.save(); }
  F.opened = JSON.stringify(ed.export());
  F.dirty = false;
  if(F.paintPage) F.paintPage();
  if(F.pushHist){ F.pushHist(); F.paintHist(); }           // the graph as it opened is the first step back
  setTimeout(() => { if(F.fitView) F.fitView(); if(F.redrawWires) F.redrawWires(); }, 40);
}
/** Close the Athanor. Returns whether the graph changed while it was open (the page offers to show it). */
export function closeForge(deps){
  const F = openForge, changed = !!(F.editor && F.opened && JSON.stringify(F.editor.export()) !== F.opened);
  const veil = deps.$('forgeVeil'); if(veil){ veil.hidden = true; veil.classList.remove('parts-open'); }
  if(openForge.closeMenu) openForge.closeMenu();
  if(openForge.stopWire) openForge.stopWire();
  if(document.body && document.body.classList) document.body.classList.remove('forge-open');
  return changed;
}
