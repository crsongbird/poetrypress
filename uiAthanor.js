/**
 * uiAthanor.js — the Athanor's place in the page: opening it, its surfaces in the menu
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $, STUDY_GROUPS, STUDY_GROUP_EXTRA, TEXTURE_GROUPS } from './appOptions.js';
import { ATHANOR_STARTERS, athanorCamera, athanorHues, athanorKnobs, athanorName, athanorNodes, athanorStarter, athanorStarterAt, athanorStepIds, validateGraph } from './athanor.js';
import { ATHANOR_STUDIES } from './athanorStudies.js';
import { CHOOSER, FORGE_BAR, PROTECT, fill } from './strings.js';
import { READABLE } from './tunables.js';
import { STITCH_STYLES } from './stitches.js';
import { TEXTURE_CAPS, TEXTURE_PARAMS, athanorSheetLayout, graphUsesBackdrop, graphUsesBox, layerLights, paramsFor, peekTexture, textureKeyFor } from './textureGenerators.js';
import { TEXTURE_CHAINS } from './chains.js';
import { askSure, hardNo, toast } from './uiGuard.js';
import { athanorTitleOf, boxNow, graphUsesPoem, measureTextGround, pageEnvNow, scheduleRender, textLayoutNow } from './canvasRenderer.js';
import { attachChooser } from './chooser.js';
import { commitSoon } from './uiHistory.js';
import { describeForge, forgeShelf, openForge } from './forge.js';
import { onTextureReady, requestTexture, texturesSettled } from './textureService.js';
import { state } from './uiState.js';
import { CHOOSERS, murmur, workerWish } from './appEvents.js';
import { modalPrompt } from './uiControls.js';
import { holdSurface, keptOpts, openTileStamp, openTileThumb, syncTextureParams, syncTextureTools } from './uiSurface.js';
import { randomSeed } from './uiLayout.js';
import { LOCK_GLYPH } from './uiLocks.js';
import { cameraNow, seedCamera } from './uiDials.js';

// A node editor for new surfaces, over the page; its graph lives in the hidden
// #forgeGraph field (saved, loaded and shared with the look).
export function paintForgeSummary(){ if($('forgeSummary')) $('forgeSummary').textContent = describeForge(($('forgeGraph') || {}).value); }
/** The Athanor's surface, as the page offers it: its Knob nodes become the
 *  texture's sliders (named, ranged, defaulted), its Hue nodes its hues, its
 *  Surface's name the option at the bottom of Surface Variant. (The worker
 *  keeps six plain knobs; only the page's labels change.) */
// A Knob's KIND (ROADMAP D1) as its slider shows it: steps and a switch are marks it locks to, named (or numbered);
// an angle reads in degrees, marked every 45°. The value is 0–100 all the same (the Knob makes it what its kind is).
function knobKind(k){
  if(k.kind === 'switch') return { ticks: [0, 100], names: k.names.length >= 2 ? k.names.slice(0, 2) : ['Off', 'On'], snap: true };
  if(k.kind === 'steps'){ const n = k.steps, ticks = Array.from({ length: n }, (_, i) => Math.round(i/(n - 1)*1000)/10);
    return { ticks, names: ticks.map((t, i) => k.names[i] || String(i + 1)), snap: true, step: 0.1 }; }
  if(k.kind === 'angle') return { ticks: [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100], deg: true, step: 0.5 };
  return {};
}
export function applyAthanorGraph(redraw = true){
  const g = ($('forgeGraph') || {}).value || '';
  const knobs = athanorKnobs(g), hues = athanorHues(g), name = athanorName(g);
  const top = knobs.reduce((m, k) => Math.max(m, k.slot), 0);
  TEXTURE_PARAMS.athanor = Array.from({ length: Math.max(1, top) }, (_, i) => { const k = knobs.find(k2 => k2.slot === i + 1);
    // (a graph with no Knob keeps one slot, as every surface has a first knob, but hidden: a slider that moves nothing
    //  only puzzles — the usability review)
    return { key: 'k' + (i + 1), label: k ? k.label : 'Knob ' + (i + 1), min: 0, max: 100, def: k ? k.def : 50, unit: '', ...(k ? knobKind(k) : {}), ...(top ? {} : { hidden: true }) }; });
  const caps = TEXTURE_CAPS.athanor;
  if(caps){ caps.tints = hues.length ? Math.max(...hues.map(h => h.slot)) : 0;
    caps.tintLabels = [1, 2, 3, 4, 5, 6].map(sl => (hues.find(h => h.slot === sl) || {}).label || (sl === 1 ? 'Light Hue' : sl === 2 ? 'Dark Hue' : 'Hue ' + sl));
    // THE CAMERA DIAL for a graph whose Camera Dial reaches its Surface (Ruby: it never appeared for one). A graph that
    // is a menu texture's chain, by name, starts where that texture's camera starts; its wireframe guide only where it
    // is a plane's (a ring's or an ellipse's guide reads the texture's own sliders)
    if(athanorCamera(g)){ const from = Object.keys(TEXTURE_CHAINS).find(t => TEXTURE_CHAINS[t].label === name && (TEXTURE_CAPS[t] || {}).camera), c = from ? TEXTURE_CAPS[from].camera : {};
      caps.camera = { turn: c.turn ?? 0, view: c.view ?? 0, zoom: c.zoom ?? 100, guide: !from || c.guide === 'plane' ? 'plane' : null }; }
    else delete caps.camera; }
  if($('athanorOption')) $('athanorOption').textContent = athanorTitleOf(g);
  // (the surface menu's face names the graph: it said "(empty)" after Apply until something else refreshed it)
  for(const ch of CHOOSERS){ try { ch.refresh(); } catch(e){} }
  if(redraw && $('textureType') && $('textureType').value === 'athanor'){ syncTextureParams(false); syncTextureTools(false); scheduleRender(); }
}
/** What the Athanor's pictures are made with: the page's seed, dial and hues;
 *  the sliders' values when the Athanor is the Surface, else the graph's own defaults. */
function athanorOpts(json, n){
  const k = (id, d) => { const v = parseFloat(($(id) || {}).value); return isNaN(v) ? d : v; };
  const own = ($('textureType') || {}).value === 'athanor', defs = athanorKnobs(json), knob = i => own ? k('texP' + i, 50) : ((defs.find(x => x.slot === i) || {}).def ?? 50);
  return { graph: json, seed: parseInt(($('textureSeedValue') || {}).value, 10) || 0, scale: n/3072, light: k('textureLight', 315), lightTilt: k('textureLightTilt', 100), camera: cameraNow(),
    ...layerLights({ textureRim: k('textureRim', 135), textureRimTilt: k('textureRimTilt', 100), textureAmbient: k('textureAmbient', 100), textureTint7: ($('textureTint7Hex') || {}).value, textureTint8: ($('textureTint8Hex') || {}).value }),
    tint6: ($('textureTint6Hex') || {}).value,
    tint1: ($('textureTint1Hex') || {}).value, tint2: ($('textureTint2Hex') || {}).value, accent1: ($('accent1ColorHex') || {}).value, accent2: ($('accent2ColorHex') || {}).value, ink: ($('textColorHex') || {}).value, p1: knob(1), p2: knob(2), p3: knob(3), p4: knob(4), p5: knob(5), p6: knob(6), p7: knob(7), p8: knob(8),
    text: graphUsesPoem(json) ? textLayoutNow() : undefined,   // (the poem's layout, for a graph that reads it)
    env: graphUsesBackdrop(json) ? pageEnvNow() : undefined,   // (the page's backdrop, for a graph with a Page Backdrop)
    box: graphUsesBox(json) ? boxNow() : undefined,   // (the inset box's place, for a graph that reads it)
    curves: own ? [1, 2].map(i => (($('textureCurve' + i) || {}).value) || '') : undefined };   // (the curves drawn on the page)
}
export function whenTexture(slot, type, w, h, opts, done){
  const key = textureKeyFor(type, w, h, opts); workerWish.set(slot, key);
  const tryNow = () => { if(workerWish.get(slot) !== key) return true; const t = peekTexture(key); if(!t) return false; done(t); return true; };
  requestTexture(slot, type, w, h, opts);
  if(tryNow()) return;
  const off = onTextureReady(() => { if(tryNow()) off(); });
  setTimeout(off, 20000);
}
/** The Athanor's large preview: what the graph makes, made off the page's thread. */
function previewAthanor(json, cv, channel){
  const n = cv.width || 320;
  whenTexture('athanorPreview', 'athanor', n, n, { ...athanorOpts(json, n), channel: channel || 'final' }, tex => {
    const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(tex, 0, 0, cv.width, cv.height); });
}
/** The STEP PREVIEWS: every node's own result, as one sheet of tiles made in the worker. */
function athanorStepSheet(json, paint){
  const ids = athanorStepIds(json); if(!ids.length) return;
  // (the whole sheet at most 512 px a side (Ruby): a large graph's previews smaller, so the every-part picture stays light)
  const { cols, rows } = athanorSheetLayout(ids.length), T = Math.max(24, Math.min(64, Math.floor(512/Math.max(cols, rows))));
  whenTexture('athanorSteps', 'athanorsteps', cols*T, rows*T, athanorOpts(json, T), sheet => paint(sheet, ids, T, cols));
}
// KEPT SURFACES in the texture menu (🜉 Yours): each by name, after "From the
// Athanor". Choosing one puts its graph in the Athanor and shows it — the
// menu's value is then 'athanor', so a look saves exactly as before.
export function paintShelfOptions(){
  const g = $('athanorGroup'); if(!g || typeof document.createElement !== 'function' || !g.querySelectorAll) return;
  g.querySelectorAll('option.kept').forEach(o => o.remove());
  // by name, not by place on the shelf: a tile's thumbnail and a long press stay with their surface
  forgeShelf().forEach(rec => { const o = document.createElement('option'); o.value = 'kept:' + encodeURIComponent(rec.name); o.className = 'kept'; o.textContent = rec.name; g.appendChild(o); });
  if(typeof CHOOSERS !== 'undefined') CHOOSERS.forEach(c => c && c.refresh && c.refresh());
}
// THE ATHANOR'S STARTERS AND SURFACE STUDIES in the texture menu too (Ruby: to try them on the page), in groups of
// their own before Your Surfaces. Choosing one puts its graph on the page as choosing a kept surface does (the menu's
// value is then 'athanor', so a look saves as before); the dice pass over them (TRY_GRAPH).
let tryGroupsPainted = false;
export function paintTryOptions(){
  const sel = $('textureType'), before = $('athanorGroup');
  if(tryGroupsPainted || !sel || typeof document.createElement !== 'function') return;
  tryGroupsPainted = true;
  // (each in its own group, after the group's surfaces, by name; Screens & Signals, a group of studies alone, before Yours)
  const groups = [...(sel.querySelectorAll ? sel.querySelectorAll('optgroup') : [])];
  for(const [name, keys] of Object.entries(STUDY_GROUPS)){
    const tg = TEXTURE_GROUPS.find(t => t.name === name), head = (tg || STUDY_GROUP_EXTRA).glyph + ' ' + name;
    let g = groups.find(o => o.label === head);
    if(!g){ g = document.createElement('optgroup'); g.label = head; g.className = 'try-graphs'; if(before && typeof sel.insertBefore === 'function') sel.insertBefore(g, before); else sel.appendChild(g); }
    for(const [v, text] of keys.map(k => [k, tryLabelOf(k)]).filter(([, t]) => t).sort((p, q) => p[1].localeCompare(q[1]))){
      const o = document.createElement('option'); o.value = v; o.textContent = text; o.className = 'try-graph'; g.appendChild(o); }
  }
  if(typeof CHOOSERS !== 'undefined') CHOOSERS.forEach(c => c && c.refresh && c.refresh());
}
/** A starter's or a study's name in the menus, marked as one ('Agate (starter)'), or '' when there is none such. */
function tryLabelOf(key){ const m = /^(starter|study):(.+)$/.exec(String(key)), S = m && (m[1] === 'study' ? ATHANOR_STUDIES : ATHANOR_STARTERS)[m[2]];
  return S ? fill(m[1] === 'study' ? CHOOSER.studyMark : CHOOSER.starterMark, S.label) : ''; }
/** A starter's or a study's graph, by its menu value ('starter:agate', 'study:fibers'). */
export const tryGraphOf = value => { const m = /^(starter|study):(.+)$/.exec(String(value)); if(!m) return null;
  const S = (m[1] === 'study' ? ATHANOR_STUDIES : ATHANOR_STARTERS)[m[2]]; return S ? athanorStarter(m[2]) : null; };
export const keptByValue = value => { const name = decodeURIComponent(String(value).slice(5)); return forgeShelf().find(r => r.name === name) || null; };
// THE BENCH (Ruby): the Athanor's own graph, kept in this browser (an app preference, never a look). The page's
// surface graph is the look's (#forgeGraph). They are one while the page shows the bench's graph: then each change
// on the bench reaches the page. Choosing a kept surface, or loading a look, changes only the page. The first time,
// the bench starts as the page's graph, so nothing in progress is lost.
const BENCH_KEY = 'uv.forge.bench.v1';
let benchJson = null;
function bench(){
  if(benchJson == null){ try { benchJson = localStorage.getItem(BENCH_KEY); } catch(e){} if(benchJson == null) benchJson = ($('forgeGraph') || {}).value || ''; }
  return benchJson;
}
const benchOnPage = (json = bench()) => !!($('textureToggle') && $('textureToggle').checked && $('textureType') && $('textureType').value === 'athanor'
  && json && ($('forgeGraph') || {}).value === json);
function setBench(json){
  const linked = benchOnPage();
  benchJson = json; try { localStorage.setItem(BENCH_KEY, json); } catch(e){}
  if(linked) $('forgeGraph').value = json;
}
/** Whether the bench holds work found nowhere else: not on the shelf, not on the page (replacing it asks first). */
function benchUnkept(){ const j = bench(); return Object.keys(athanorNodes(j)).length > 2 && !benchOnPage(j) && !forgeShelf().some(r => r.graph === j); }
export const forgeDeps = () => ({ $, bench, setBench, unkept: benchUnkept,
  chooser: (sel, o) => attachChooser(sel, { id: 'forgeOpen', thumb: openTileThumb, stamp: openTileStamp, glyphFor: () => '🜉', size: 160, side: true, wide: true, hold: holdSurface, ...o }),
  reseed: () => { const f = $('textureSeedValue'); if(!f) return; f.value = randomSeed(); seedCamera(); f.dispatchEvent(new Event('input', { bubbles: true })); scheduleRender(); commitSoon(); }, textures: Object.keys(TEXTURE_PARAMS).filter(t => t !== 'athanor'), stitches: STITCH_STYLES,
  onSave: () => { if(!benchOnPage()) return; paintForgeSummary(); applyAthanorGraph(true); if(typeof commitSoon === 'function') commitSoon(); },
  preview: previewAthanor, steps: athanorStepSheet,
  // a wiki figure: every part of its little graph, at canonical settings, each in its own slot so figures don't wait on each other
  figure: (json, key, paint) => { const ids = Object.keys(athanorNodes(json)).sort((a, b) => +a - +b); if(!ids.length) return;
    const T = 112, { cols, rows } = athanorSheetLayout(ids.length);
    whenTexture('wikiFig:' + key, 'athanorsteps', cols*T, rows*T, keptOpts(json, T), sheet => paint(sheet, ids, T, cols)); },
  ask: o => askSure(o), prompt: o => modalPrompt(o), refuse: (t, b) => hardNo(t, b), sound: fn => murmur.play(fn), lock: LOCK_GLYPH, toast: t => toast(t),
  onShelf: () => { if(typeof paintShelfOptions === 'function') paintShelfOptions(); },
  validate: json => validateGraph(json),
  warn: problems => toast('The graph was cleaned on loading: ' + problems.slice(0, 2).join('; ') + (problems.length > 2 ? '…' : '')),
  // whether the page's surface is this graph, and putting it there (the bar says which, and does it)
  onPage: () => benchOnPage(),
  use: () => { const t = $('textureType'); if(!t) return; $('textureToggle').checked = true; if($('textureBlock')) $('textureBlock').classList.add('open');
    $('forgeGraph').value = bench(); for(const k of [1, 2]) if($('textureCurve' + k)) $('textureCurve' + k).value = '';
    t.value = 'athanor'; t.dispatchEvent(new Event('change', { bubbles: true })); applyAthanorGraph(true); paintForgeSummary(); scheduleRender(); commitSoon(); } });
// THE ATHANOR opens from the top bar, on every device
export function openAthanorNow(){ return openForge(forgeDeps()); }
// REVEAL (ROADMAP H1, Reveal Spell Graph): the page's surface opened in the Athanor as the graph it is made of,
// its Knobs set to the sliders' own values, so the Athanor shows exactly what the page does
export async function revealSurface(){
  const type = ($('textureType') || {}).value || '';
  // an Athanor surface: the page's own graph onto the bench (it is the bench's already while the page shows it)
  if(type === 'athanor' && benchOnPage()){ openAthanorNow(); return; }
  const page = type === 'athanor' ? (() => { const v = validateGraph(($('forgeGraph') || {}).value || ''); return v.ok ? v.graph : null; })() : null;
  // the empty Athanor (no graph on the page yet): the editor opens as it is, to start one (Ruby: it is where anyone would go)
  if(type === 'athanor' && !page){ openAthanorNow(); return; }
  const chain = TEXTURE_CHAINS[type], g = page || (chain && athanorStarterAt(type, paramsFor(type), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ($('texP' + i) || {}).value)));
  if(!g){ toast(FORGE_BAR.revealNone); return; }
  const label = page ? (athanorName(JSON.stringify(page)) || 'My Surface') : chain.label;
  // the bench's work, if it is kept nowhere else, is replaced only when asked (Revert brings it back)
  if(benchUnkept() && !await askSure({ title: FORGE_BAR.revealAskTitle.replace('{name}', label), body: FORGE_BAR.revealAskBody, confirmLabel: FORGE_BAR.revealAskYes, danger: false })) return;
  await openAthanorNow();
  if(openForge.openGraph && await openForge.openGraph(g, label, page ? null : chain.teach, true) && page){
    $('forgeGraph').value = bench(); paintForgeSummary(); if(openForge.paintPage) openForge.paintPage(); }   // (the page and the bench are one again)
}
// PROTECT THE TEXT (ROADMAP G3): Text Clearing raised just far enough that every line of the poem stands off
// what it sits on at READABLE.ratio, measured on the frame itself (canvasRenderer measureTextGround), each line
// in its own inks. It never lowers the clearing, and a lock holds it. A line clearing can't bring there (its ink
// as close to the backdrop beneath) is named and left out of the aim, so it can't cost the others their
// surface; when no line can be helped it says so and changes nothing. Clearing is monotone: search by halves.
export async function protectText(){
  const el = $('textureClearing'); if(!el) return;
  if(state.locks.has('textureClearing')){ toast(PROTECT.locked); murmur.play('blocked'); return; }
  await texturesSettled();
  const need = READABLE.ratio, at = v => { el.value = String(v); let m = measureTextGround(); if(m && !m.settled) m = measureTextGround(); return m; };
  const words = l => { const w = (l && l.words) || '…'; return w.length > 30 ? w.slice(0, 28).trimEnd() + '…' : w; };
  const say = (k, l, amount) => PROTECT[k].replace('{words}', words(l)).replace('{ratio}', l ? (Math.floor(l.ratio*10)/10).toFixed(1) : '')
    .replace('{need}', need).replace('{amount}', amount);
  const done = (v, text) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); scheduleRender(); commitSoon(); toast(text); };
  const faintest = (m, which = () => true) => m.lines.reduce((w, l, i) => which(i) && (!w || l.ratio < w.ratio) ? l : w, null);
  const from = Math.max(0, Math.min(100, Math.round(parseFloat(el.value) || 0))), here = at(from);
  if(!here) return done(from, PROTECT.noWords);
  if(here.worst >= need) return done(from, say('already', faintest(here)));
  const full = from < 100 ? at(100) : here;
  // the lines clearing can bring to the aim, and those it can't (their own ink is the trouble)
  const helps = i => full && full.lines.length === here.lines.length && full.lines[i].ratio >= need, stuck = i => !helps(i);
  const wanted = here.lines.some((l, i) => helps(i) && l.ratio < need), lost = faintest(full || here, stuck);
  if(!wanted){
    if(full && full.worst > here.worst + 0.05) return done(100, say('short', lost, 100));
    return done(from, say($('textureToggle').checked ? 'cannot' : 'noSurface', faintest(here)));
  }
  let lo = from, hi = 100;          // lo falls short, hi reaches the aim (on every line it can)
  const reaches = m => m && m.lines.length === full.lines.length && m.lines.every((l, i) => !helps(i) || l.ratio >= need);
  while(hi - lo > 1){ const mid = (lo + hi) >> 1; if(reaches(at(mid))) hi = mid; else lo = mid; }
  const got = at(hi);
  done(hi, lost ? say('raisedBut', faintest(full, stuck), hi) : say('raised', faintest(got), hi));
}
export function paintReveal(){ const b = $('revealSurfaceBtn'), t = ($('textureType') || {}).value || ''; if(b) b.disabled = !(t === 'athanor' || TEXTURE_CHAINS[t]); }
