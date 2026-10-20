/**
 * uiSurface.js — the surface's controls: its sliders and tools, its four readings, the Athanor's surfaces in the menu, the menus as tiles
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $ } from './appOptions.js';
import { BLEND_NAMES, HUE5_HINTS, KEPT, UI_STRINGS, fill } from './strings.js';
import { LIGHT_DEFAULT, cameraStart, keepGround, labelText, lightsReach, putCamera, setKnobTicks, setLabelText, setLight, syncCameraPad, syncHueHeads, syncLightPad } from './uiDials.js';
import { LIGHT_TURNED, SURFACE_HUE_KEYS, capsFor, paramReadout, paramsFor } from './textureGenerators.js';
import { SURFACE_BLENDS, graphUsesPoem, scheduleRender, textLayoutNow } from './canvasRenderer.js';
import { SWATCH_STAMP } from './release.js';
import { askSure, hardNo, toast } from './uiGuard.js';
import { athanorCurves, athanorKnobs, athanorName, athanorStarter, validateGraph } from './athanor.js';
import { commitSoon } from './uiHistory.js';
import { curveAt, curveFromPoints, curvePoints } from './steps.js';
import { elementsFor } from './textureElements.js';
import { forgeCopy, forgeNameSurface, forgeShelf, forgeShelfPut, forgeShelfWrite, forgeWiringText, openForge } from './forge.js';
import { halfRound } from './uiLook.js';
import { keptByValue, openAthanorNow, paintShelfOptions, revealSurface, whenTexture } from './uiAthanor.js';
import { openSheetMenu, withLocksPreserved } from './uiLocks.js';
import { setDrafting } from './textureService.js';
import { state } from './uiState.js';
import { CHOOSERS, canvas, setColorField, surfaceChooser, surfaceTiles } from './appEvents.js';
import { modalPrompt } from './uiControls.js';

// Each texture declares two knobs (see TEXTURE_PARAMS). The sliders relabel
// and re-range themselves when the texture changes, so a control never says
// "value 1" -- it says Sigil zoom, or Slant, or Nebula density.
export function syncTextureParams(useDefaults){
  const defs = paramsFor($('textureType').value);
  // two knobs for every texture, a third (Form) for many, up to five for the
  // richest (Dream Bloom), six where a camera tilts (Scrying Pool), eight at
  // most (Lichtenberg's camera, Circuit Board's Era); a knob a texture doesn't
  // have is hidden
  [0,1,2,3,4,5,6,7].forEach(i=>{
    const def = defs[i];
    const row = $('texP'+(i+1)).parentElement;
    const slider = $('texP'+(i+1));
    const label = $('texP'+(i+1)+'Label');
    const out = $('texP'+(i+1)+'Val');
    if(!def){
      if(row) row.style.display = 'none';
      return;
    }
    if(row) row.style.display = def.hidden ? 'none' : '';
    slider.min = def.min; slider.max = def.max;
    // a knob that is an angle gets 45° ticks and ∡; a knob with its own ticks
    // (Lotus's species, Linen's weaves, bokeh shapes) gets those and ⊹, which
    // locks it to the nearest tick; any other knob gets neither
    setKnobTicks(slider, i, def);
    if(useDefaults || slider.value === '' || +slider.value < def.min || +slider.value > def.max){
      slider.value = def.def;
    }
    setLabelText(label, def.label);            // (never textContent: it wiped the knob's padlock)
    out.textContent = paramReadout(def, +slider.value);
  });
  syncCurveControls();
}
// THE CURVE CONTROLS (ROADMAP D4, Filter Forge's Curve control): a graph's Curve Control parts that reach its Surface,
// each a small pad under the sliders where the curve is drawn by hand. Its points are kept as "x,y;x,y" (0–100) in a
// hidden field, saved with the look like a knob ('' is the graph's own curve). Drag a point; tap or click the empty
// pad to add one; double-click, double-tap or hold a point to take it away (two always stay); ↺ the graph's own.
let curveDefs = [];
function syncCurveControls(){
  const g = ($('textureType') || {}).value === 'athanor' ? (($('forgeGraph') || {}).value || '') : '';
  curveDefs = g ? athanorCurves(g) : [];
  for(const k of [1, 2]){ const row = $('texCurve' + k + 'Row'), d = curveDefs.find(c => c.slot === k);
    if(row && row.classList) row.classList.toggle('tool-hidden', !d);
    if(d && $('texCurve' + k + 'Label')) $('texCurve' + k + 'Label').textContent = d.label;
    paintCurvePad(k); }
}
export const curveOf = k => { const d = curveDefs.find(c => c.slot === k); return curvePoints((($('textureCurve' + k) || {}).value) || (d ? d.def : '')); };
export function paintCurvePad(k){
  const cv = $('texCurve' + k + 'Pad'); if(!cv || !cv.getContext || !curveDefs.some(c => c.slot === k)) return;
  const x = cv.getContext('2d'); if(!x) return;
  const W = cv.width, H = cv.height, pad = 14, cs = getComputedStyle(document.body), col = n => (cs.getPropertyValue(n) || '').trim();
  const accent = col('--accent') || '#E7A0B8', dim = col('--text-dim') || '#888', line = col('--line') || '#444';
  const X = v => pad + v/100*(W - 2*pad), Y = v => H - pad - v/100*(H - 2*pad);
  x.clearRect(0, 0, W, H);
  x.strokeStyle = line; x.lineWidth = 1; for(const q of [0, 25, 50, 75, 100]){ x.beginPath(); x.moveTo(X(q), Y(0)); x.lineTo(X(q), Y(100)); x.moveTo(X(0), Y(q)); x.lineTo(X(100), Y(q)); x.stroke(); }
  const pts = curveOf(k), c = curveFromPoints(pts.map(p => p.join(',')).join(';'));
  x.strokeStyle = accent; x.lineWidth = 3; x.beginPath();
  for(let i = 0; i <= 96; i++){ const t = i/96, v = curveAt(c, t)*100; i ? x.lineTo(X(t*100), Y(Math.max(-2, Math.min(102, v)))) : x.moveTo(X(t*100), Y(v)); }
  x.stroke();
  for(const [px, py] of pts){ x.beginPath(); x.arc(X(px), Y(py), 7, 0, Math.PI*2); x.fillStyle = accent; x.fill(); x.lineWidth = 2; x.strokeStyle = dim; x.stroke(); }
}
export function paintCurves(){ for(const k of [1, 2]) paintCurvePad(k); }
export function setCurvePoints(k, pts, commit){
  const el = $('textureCurve' + k); if(!el) return;
  el.value = pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1])).join(';');
  paintCurvePad(k); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
// While a texture knob (or the light) is being dragged, slow textures are
// drafted at half resolution; a quarter-second after it stops, they sharpen.
export let draftTimer = null;
export function draftWhileDragging(){
  setDrafting(true);
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => setDrafting(false), 250);
}
/** What the light dial moves on a surface where it isn't the light, in one word for the Main button (caps.dial's first
 *  word; Position is Pos, Daylight is Day). */
function dialWord(dial){ const w = String(dial).split(/[\s&]+/)[0]; return ({ Position: 'Pos', Daylight: 'Day' })[w] || w; }
export function syncTextureTools(resetToDefaults){
  const type = $('textureType').value;
  const caps = capsFor(type);

  // EVERY BLEND for every surface (Ruby): the ones made for this surface first (its default at their
  // head), then every other one a layer can take
  const sel = $('textureBlend');
  const previous = sel.value;
  sel.innerHTML = '';
  const group = (label, list) => {
    const g = document.createElement('optgroup'); g.label = label;
    for(const b of list){ const opt = document.createElement('option'); opt.value = b;
      opt.textContent = (BLEND_NAMES[b] || b) + (b === caps.blends[0] ? BLEND_NAMES.default : ''); g.appendChild(opt); }
    sel.appendChild(g);
  };
  group(BLEND_NAMES.suits, caps.blends);
  group(BLEND_NAMES.others, SURFACE_BLENDS.filter(b => !caps.blends.includes(b)));
  sel.value = (!resetToDefaults && SURFACE_BLENDS.includes(previous)) ? previous : caps.blends[0];
  if(resetToDefaults) keepGround('');

  const lightRow = $('lightRow');
  if(lightRow){
    lightRow.classList.toggle('tool-off', !caps.light);
    const dl = $('lightDial'); if(dl && dl.classList) dl.classList.toggle('low-ok', !!caps.lowLight);
    const lt = $('textureLightTilt'); if(lt && !caps.lowLight && +lt.value > 100){ lt.value = '100'; syncLightPad(); }
    // a texture may use the dial for something else, and says so: First Snow's wind
    const lbl = lightRow.querySelector('label');
    if(lbl){ if(!lbl.dataset.lightName) lbl.dataset.lightName = labelText(lbl); setLabelText(lbl, caps.dial || lbl.dataset.lightName); }
    // (and the Main button says it in one word, Ruby: Main, or what the dial moves instead: Pos, Wind, Rain, Hatch…)
    { const mb = $('lightSeg') && $('lightSeg').querySelector ? $('lightSeg').querySelector('[data-light="main"] [data-str]') : null;
      if(mb) mb.textContent = caps.dial ? dialWord(caps.dial) : (UI_STRINGS['button.light_main'] || 'Main'); }
    // (a dial that is only a direction has no height to show)
    const hf = $('lightTiltField'); if(hf && hf.style) hf.style.display = caps.dirOnly ? 'none' : '';
  }

  // THE CAMERA DIAL: always beside the light dial (Ruby: "Always show the camera dial. Faded out when it isn't in use"),
  // faded for a surface with no camera; the hues below it in two columns
  { const cam = caps.camera, row = $('cameraRow'), tools = $('textureToolRow');
    if(row && row.classList){ row.classList.remove('tool-hidden'); row.classList.toggle('tool-idle', !cam); if(row.title !== undefined) row.title = cam ? '' : 'This surface has no camera'; }
    if(tools && tools.classList) tools.classList.add('has-camera');
    if(cam && resetToDefaults && !state.locks.has('cameraTurn')){ const d = cameraStart(($('textureType') || {}).value); putCamera(d.turn, d.view, d.zoom); }
    else syncCameraPad(); }

  const t1 = $('tint1Row'), t2 = $('tint2Row');
  // a hue the texture doesn't use is HIDDEN, as an unused slider is (Ruby)
  ['tint1Row','tint2Row','tint3Row','tint4Row','tint5Row','tint6Row','tint7Row','tint8Row','tint9Row','tint10Row','tint11Row','tint12Row'].forEach(id => { const r = $(id); if(r && r.classList) r.classList.remove('tool-off'); });
  if(t1) t1.classList.toggle('tool-hidden', caps.tints < 1);
  if(t2) t2.classList.toggle('tool-hidden', caps.tints < 2);
  [9, 10, 11, 12].forEach((n, i) => { const r = $('tint' + n + 'Row'); if(r && r.classList) r.classList.toggle('tool-hidden', (caps.tints || 0) < i + 3);
    setLabelText($('tint' + n + 'Label'), (caps.tintLabels || [])[i + 2] || ['Third', 'Fourth', 'Fifth', 'Sixth'][i] + ' Hue'); });
  // material hues, for lit textures that are coloured (not the grey ones that blend)
  ['tint3Row', 'tint4Row'].forEach(id => { const r = $(id); if(r) r.classList.toggle('tool-hidden', !caps.material); });
  if(resetToDefaults){ setColorField('textureTint3Hex', '#FFFFFF'); setColorField('textureTint4Hex', '#FFFFFF'); setColorField('textureTint6Hex', '#FFFFFF'); }
  // THE LIGHTS' COLOURS: the main light's (a surface's Diffuse Hue, or the page's light's where the page's lights reach),
  // the rim light's and the ambient's (where they reach)
  const reach = lightsReach(type), r6 = $('tint6Row'); if(r6) r6.classList.toggle('tool-hidden', !caps.diffuse && !reach);
  ['tint7Row', 'tint8Row'].forEach(id => { const r = $(id); if(r && r.classList) r.classList.toggle('tool-hidden', !reach); });
  { const rt = $('textureRimTilt'); if(rt && !caps.lowLight && +rt.value > 100) rt.value = '100'; }
  syncLightPad();
  // the fifth hue: Glow, Material or Snow Hue, by what the texture has (or none)
  const r5 = $('tint5Row');
  if(r5){
    r5.classList.toggle('tool-hidden', !caps.hue5);
    if(caps.hue5){ setLabelText($('tint5Label'), caps.hue5.label); $('tint5Label').title = fill(HUE5_HINTS[caps.hue5.role] || '{name}', caps.hue5.why); }
    if(resetToDefaults || !caps.hue5) setColorField('textureTint5Hex', caps.hue5 ? caps.hue5.def : '#000000');
  }
  // (a hue the texture doesn't have says so plainly, not the last texture's name)
  setLabelText($('tint1Label'), caps.tints >= 1 ? ((caps.tintLabels||[])[0] || 'First Hue') : 'First Hue');
  setLabelText($('tint2Label'), caps.tints >= 2 ? ((caps.tintLabels||[])[1] || 'Second Hue') : 'Second Hue');
  // THE HUES' THREE GROUPS: a Ground or Snow Hue is the surface's own colour (it stands with the Surface Colors), a Glow
  // is the material's; each group's heading shows only while one of its hues does
  { const r5 = $('tint5Row'), hm = $('hueHeadMaterial');
    if(r5 && hm && hm.parentNode && r5.parentNode === hm.parentNode){ const own = caps.hue5 && caps.hue5.role !== 'glow';
      if(own) hm.parentNode.insertBefore(r5, hm); else if(hm.nextSibling !== r5) hm.parentNode.insertBefore(r5, hm.nextSibling); }
    syncHueHeads(); }

  // a texture that takes its colour from the accents starts there
  if(resetToDefaults && caps.tints >= 1){
    const defs = caps.tintDefaults || [];
    const resolve = (d, fallback) =>
      d === 'accent1' ? $('accent1ColorHex').value
      : d === 'accent2' ? $('accent2ColorHex').value
      : (d || fallback);
    state.ui.tintBySystem = true;
    setColorField('textureTint1Hex', resolve(defs[0], '#7A2B2B'));
    if(caps.tints >= 2) setColorField('textureTint2Hex', resolve(defs[1], '#8A6A3C'));
    for(let i = 2; i < Math.min(6, caps.tints); i++) setColorField(SURFACE_HUE_KEYS[i] + 'Hex', resolve(defs[i], '#808080'));
    state.ui.tintBySystem = false;
    // a freshly defaulted tint follows its source until you pick one by hand
    state.ui.tintFollows = [true, true, true, true, true, true];
  }
}
/**
 * Re-derives any tint that defaults to an accent, when that accent changes.
 * Skipped for a tint you have locked, and for one you have set by hand —
 * picking a colour yourself is the signal that it should stay put.
 */
export function followAccents(){
  const caps = capsFor($('textureType').value);
  const defs = caps.tintDefaults || [];
  const ids = SURFACE_HUE_KEYS.map(k => k + 'Hex');
  let changed = false;
  for(let i = 0; i < Math.min(caps.tints || 0, 6); i++){
    const src = defs[i] === 'accent1' ? 'accent1ColorHex' : defs[i] === 'accent2' ? 'accent2ColorHex' : null;
    if(!src || !state.ui.tintFollows[i] || state.locks.has(ids[i])) continue;
    state.ui.tintBySystem = true;
    setColorField(ids[i], $(src).value);
    state.ui.tintBySystem = false;
    changed = true;
  }
  // the surface waiting behind the layer bar follows its accents too, unless its hue was chosen or is locked
  const O = state.layers.other, ou = state.layers.otherUi;
  if(O && ou && O.textureType){
    const oc = capsFor(O.textureType), od = oc.tintDefaults || [];
    for(let i = 0; i < Math.min(oc.tints || 0, 6); i++){
      const src = od[i] === 'accent1' ? 'accent1ColorHex' : od[i] === 'accent2' ? 'accent2ColorHex' : null;
      if(!src || !ou.follows[i] || (state.layers.otherLocks || []).includes(ids[i]) || O[SURFACE_HUE_KEYS[i]] === $(src).value) continue;
      O[SURFACE_HUE_KEYS[i]] = $(src).value; changed = true;
    }
  }
  if(changed) scheduleRender();
}
export function paintElements(){
  const list = elementsFor($('textureType').value), on = state.ui.element;
  const row = $('elementRow'); if(!row || !row.querySelectorAll) return;
  row.querySelectorAll('.el-btn').forEach(b => {
    const v = list.find(e => e.el === b.dataset.el);
    b.disabled = !v; if(!v) return;
    b.title = `${v.glyph} ${v.element}: ${v.name}${v.isDefault ? ' (the default)' : ''}`;
    b.setAttribute('aria-label', `${v.element}: ${v.name}`);
    b.classList.toggle('is-default', !!v.isDefault);
    b.classList.toggle('on', on === v.el);
  });
  const v = list.find(e => e.el === on);
  if(row.dataset) row.dataset.applied = v ? `${v.glyph} ${v.name}` : '';      // (§Reading in a poem)
  // the reading's name shows in the variant's own field (Ruby); this quiet line is for screen readers
  if(surfaceChooser && surfaceChooser.refresh) surfaceChooser.refresh();
  const name = $('elementName'); if(!name) return;
  name.textContent = v ? `${v.name}, ${v.element}${v.isDefault ? ', the default' : ''}` : '';
}
export function applyElement(id){
  const type = $('textureType').value, v = elementsFor(type).find(e => e.el === id);
  if(!v) return;
  const caps = capsFor(type), defs = paramsFor(type);
  const fire = el => { if(el && el.dispatchEvent){ el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
  withLocksPreserved(() => {
    if(v.isDefault){
      // the texture as it always was: its knobs, hues, blend and light
      syncTextureParams(true); syncTextureTools(true);
      if(!state.locks.has('textureLight')) setLight(caps.lightDeg != null ? caps.lightDeg : LIGHT_DEFAULT.deg, caps.lightTilt != null ? caps.lightTilt : LIGHT_DEFAULT.tilt, false);
      if(caps.camera && !state.locks.has('cameraTurn')){ const d = cameraStart(type); putCamera(d.turn, d.view, d.zoom); }
      return;
    }
    (v.k || []).forEach((x, i) => { const d = defs[i], el = $('texP' + (i + 1)); if(!d || !el) return;
      el.value = String(Math.max(d.min, Math.min(d.max, x))); fire(el); });
    (v.t || []).slice(0, Math.min(6, caps.tints || 0)).forEach((hex, i) => { setColorField(SURFACE_HUE_KEYS[i] + 'Hex', hex); state.ui.tintFollows[i] = false; });
    if(v.t5 && caps.hue5) setColorField('textureTint5Hex', v.t5);
    if(v.blend && caps.blends.includes(v.blend)){ $('textureBlend').value = v.blend; fire($('textureBlend')); }
    // (a reading's light, set before the handle became the light, turned half round where its surface's light turned)
    if(v.light && caps.light && !state.locks.has('textureLight')) setLight(LIGHT_TURNED.has($('textureType').value) ? +halfRound(v.light[0]) : v.light[0], v.light[1], false);
    if(v.cam && caps.camera && !state.locks.has('cameraTurn')) putCamera(v.cam[0], v.cam[1], v.cam[2]);
  });
  state.ui.element = id;
  paintElements(); scheduleRender();
  if(typeof commitSoon === 'function') commitSoon();
}
// THEIR THUMBNAILS (Ruby): drawn at the canonical settings (the graph's own knob defaults, one seed, the
// light from the upper left, plain hues), in the worker, and kept with the surface on the shelf until its
// wiring changes. (Not in the chooser's per-release cache: a kept surface can be replaced under its name.)
export const keptHash = text => { let h = 2166136261; for(let i = 0; i < text.length; i++){ h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + text.length; };
export function keptOpts(json, n){
  const defs = athanorKnobs(json), knob = i => (defs.find(x => x.slot === i) || {}).def ?? 50;
  return { graph: json, seed: 4242, scale: n/3072, light: 315, lightTilt: 100, tint1: '#F2E6D8', tint2: '#2A2230', accent1: '#E07A8A', accent2: '#7A8AE8', ink: '#F2F2EF',
    p1: knob(1), p2: knob(2), p3: knob(3), p4: knob(4), p5: knob(5), p6: knob(6), p7: knob(7), p8: knob(8), text: graphUsesPoem(json) ? textLayoutNow() : undefined };
}
export function keptThumb(rec, canvas, unsaved){
  if(!rec || !rec.graph || rec.graph.length < 40) return false;
  const of = keptHash(rec.graph), x = canvas.getContext('2d');
  const paint = src => { x.fillStyle = '#1A1720'; x.fillRect(0, 0, canvas.width, canvas.height); x.drawImage(src, 0, 0, canvas.width, canvas.height); };
  if(rec.thumb && rec.thumb.of === of && /^data:image\/jpeg;base64,/.test(rec.thumb.url || '')){ const im = new Image(); im.onload = () => paint(im); im.src = rec.thumb.url; return true; }
  const n = 192;
  whenTexture('keptThumb:' + (rec.name || '~page'), 'athanor', n, n, keptOpts(rec.graph, n), tex => {
    paint(tex);
    if(unsaved) return;
    try { const url = canvas.toDataURL('image/jpeg', 0.8); const now = forgeShelf().find(r => r.name === rec.name);
      if(now && keptHash(now.graph) === of) forgeShelfPut({ ...now, thumb: { of, url } }); } catch(e){}
  });
  return true;
}
// A LONG PRESS on a surface made in the Athanor (Ruby): share its wiring, copy it, open it, take it off the shelf
async function copyWiring(rec){
  const text = forgeWiringText([rec]);
  if(await forgeCopy(text)) toast(fill(KEPT.copied, rec.name));
  else await modalPrompt({ title: KEPT.copy, body: KEPT.copyFailed, input: true, rows: 8, defaultValue: text, confirmLabel: 'Done', alert: true });
}
export function holdSurface(value, tile){
  const kept = String(value).startsWith('kept:'), page = value === 'athanor';
  if(!kept && !page) return false;
  const graph = kept ? (keptByValue(value) || {}).graph : ($('forgeGraph') || {}).value || '';
  if(!graph || graph.length < 40) return false;
  const name = kept ? keptByValue(value).name : (athanorName(graph) || 'My Surface');
  const rec = kept ? keptByValue(value) : { name, graph, savedAt: new Date().toISOString() };
  const share = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  // (opened on the Athanor's bench: the page keeps its surface; the bench's own work is replaced only when asked)
  const open = async () => {
    if(!kept){ if(($('textureType') || {}).value === 'athanor') revealSurface(); else openAthanorNow(); return; }
    const v = validateGraph(rec.graph); if(!v.ok){ hardNo('That kept surface can’t be opened', v.problems.join('; ') + '.'); return; }
    await openAthanorNow(); if(openForge.openGraph) openForge.openGraph(forgeNameSurface(v.graph, name), name); };
  openSheetMenu(tile, kept ? name : KEPT.current + ': ' + name, [
    ...(kept ? [{ glyph: '◈', label: KEPT.use, act: () => { const t = $('textureType'); t.value = value; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); CHOOSERS.forEach(c => c && c.close && c.close()); } }] : []),
    { glyph: '🜉', label: KEPT.open, act: () => { CHOOSERS.forEach(c => c && c.close && c.close()); open(); } },
    ...(share ? [{ glyph: '⇗', label: KEPT.share, act: () => { try { navigator.share({ title: name, text: forgeWiringText([rec]) }).catch(() => {}); } catch(e){} } }] : []),
    { glyph: '⧉', label: KEPT.copy, hint: KEPT.copyHint, act: () => copyWiring(rec) },
    ...(kept ? [{ glyph: '✕', label: KEPT.drop, danger: true, act: async () => {
      if(!await askSure({ title: `Take “${name}” off the shelf?`, body: 'It is gone from this browser. (Looks that use it keep their own copy.)', confirmLabel: 'Take it off', danger: true })) return;
      forgeShelfWrite(forgeShelf().filter(r => r.name !== name)); paintShelfOptions(); } }] : [])]);
  return true;
}
export const textureNameOf = v => { const o = Array.from((($('textureType') || {}).options) || []).find(o => o.value === v); return o ? String(o.textContent || '').trim() : ''; };
export function openTileThumb(value, canvas, done){
  const v = String(value);
  if(v.startsWith('kept:')) return keptThumb(keptByValue(v), canvas);
  const k = v.replace(/^(starter|study):/, '');
  if(v !== k){ const g = athanorStarter(k); if(!g) return false; const n = canvas.width, x = canvas.getContext('2d');
    whenTexture('openTile:' + v, 'athanor', n, n, keptOpts(JSON.stringify(g), n), tex => { x.fillStyle = '#1A1720'; x.fillRect(0, 0, n, n); x.drawImage(tex, 0, 0, n, n); done(); });
    return true; }
  return surfaceTiles ? surfaceTiles.thumb(v, canvas, done) : false;
}
export function openTileStamp(value){
  const v = String(value), k = v.replace(/^(starter|study):/, '');
  if(v.startsWith('kept:') || !v) return '';
  if(v !== k){ const g = athanorStarter(k); return g ? keptHash(JSON.stringify(g)) + '|' + SWATCH_STAMP : ''; }
  return surfaceTiles ? surfaceTiles.stamp(v) : '';
}
