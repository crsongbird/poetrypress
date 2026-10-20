/**
 * uiLayers.js — the surface's two layers: the controls of the one being edited, the other one kept, the swap
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $ } from './appOptions.js';
import { RIM_DEFAULT } from './uiDials.js';
import { SURFACE_HUE_KEYS, capsFor, paramsFor } from './textureGenerators.js';
import { SURFACE_LAYERS } from './strings.js';
import { athanorTitleOf, scheduleRender, surfaceFromDom } from './canvasRenderer.js';
import { commitSoon } from './uiHistory.js';
import { elementsFor } from './textureElements.js';
import { state } from './uiState.js';
import { toast } from './uiGuard.js';
import { LAYER_LOCK_IDS, refreshUi } from './appEvents.js';
import { restoreSurfaceLayer } from './uiLook.js';

// Two surfaces, one above the other. The controls show ONE of them (the layer bar picks which); the
// other's settings wait in state.layers.other, under the same keys the upper saves with. A look always
// saves the upper under its own keys and the lower as `baseLayer`, whichever the controls show; Swap
// trades the two whole, locks included.
const LAYER_KEYS = ['textureType', 'texP1', 'texP2', 'texP3', 'texP4', 'texP5', 'texP6', 'texP7', 'texP8', 'texP9', 'texP10', 'textureOpacity', 'textureBlend', 'textureLight', 'textureLightTilt', 'cameraTurn', 'cameraView', 'cameraZoom',
  'textureRim', 'textureRimTilt', 'textureAmbient', 'textureTint7', 'textureTint8',
  'textureTint1', 'textureTint2', 'textureTint3', 'textureTint4', 'textureTint5', 'textureTint6', 'textureTint9', 'textureTint10', 'textureTint11', 'textureTint12', 'textureSeedWords', 'textureSeed', 'forgeGraph', 'textureGround',
  'textureTextAware', 'textureTextBlend', 'textureShapeAware', 'textureTextCut', 'textureShapeStrength', 'textureCurve1', 'textureCurve2'];
export const pickLayer = s => Object.fromEntries(LAYER_KEYS.filter(k => s[k] !== undefined).map(k => [k, s[k]]));
export const lowerOn = () => !!($('baseToggle') && $('baseToggle').checked && $('textureToggle').checked);
/** A new lower surface: Waking Grain beneath, as the base layer always began, on its own seed. */
export function freshLower(){
  const defs = paramsFor('grain'), caps = capsFor('grain');
  const L = { textureType: 'grain', textureOpacity: 50, textureBlend: 'overlay', textureLight: $('textureLight').value, textureLightTilt: '100', cameraTurn: '0', cameraView: '0', cameraZoom: '100',
    textureRim: String(RIM_DEFAULT.deg), textureRimTilt: String(RIM_DEFAULT.tilt), textureAmbient: '100', textureTint7: RIM_DEFAULT.hex + '00', textureTint8: '#FFFFFF',
    textureSeed: ((parseInt($('textureSeedValue').value, 10) || 0) ^ 0x5bd1e995) >>> 0, textureSeedWords: '', forgeGraph: '' };
  defs.forEach((d, i) => { L['texP' + (i + 1)] = String(d.def); });
  (caps.tintDefaults || []).forEach((c, i) => { if(SURFACE_HUE_KEYS[i]) L[SURFACE_HUE_KEYS[i]] = c === 'accent1' ? $('accent1ColorHex').value : c === 'accent2' ? $('accent2ColorHex').value : c; });
  return L;
}
/** The controls show the other layer, and the one they showed waits (its locks with it, the reading it wears
 *  and whether its hues follow the accents). Not a change to the look. */
function exchangeLayers(){
  const L = state.layers, shown = pickLayer(surfaceFromDom()), shownLocks = [...state.locks].filter(id => LAYER_LOCK_IDS.has(id));
  const shownUi = { element: state.ui.element, follows: [...state.ui.tintFollows] };
  const fresh = !L.other, next = L.other || freshLower(), nextLocks = L.otherLocks || [];
  const nextUi = L.otherUi || { element: null, follows: fresh ? [true, true] : [false, false] };
  const was = state.history.restoring; state.history.restoring = true;   // (not a step of its own)
  try {
    for(const id of LAYER_LOCK_IDS) state.locks.delete(id);
    restoreSurfaceLayer(next);
    for(const id of nextLocks) state.locks.add(id);
  } finally { state.history.restoring = was; }
  state.ui.element = nextUi.element; state.ui.tintFollows = [...nextUi.follows];
  L.other = shown; L.otherLocks = shownLocks; L.otherUi = shownUi;
}
/** Show the upper or the lower layer's settings. */
export function editLayer(which){
  if(which === 'lower' && !lowerOn()) which = 'upper';
  if(which === state.layers.editing) { paintLayerBar(); return; }
  exchangeLayers(); state.layers.editing = which; paintLayerWords();
  refreshUi(); scheduleRender();
}
/** Trade the two surfaces (Ruby: everything about each, blend and locks too): the controls keep their place. */
export function swapLayers(){
  if(!lowerOn()) return;
  exchangeLayers(); refreshUi(); scheduleRender(); commitSoon();
  toast(state.layers.editing === 'upper' ? SURFACE_LAYERS.swappedUp : SURFACE_LAYERS.swappedDown);
}
/** A surface's name as its menu shows it (an Athanor surface's from its own graph). */
export function surfaceNameOf(type, graph){
  if(type === 'athanor' && graph !== undefined) return athanorTitleOf(graph);
  const sel = $('textureType'), o = sel && sel.querySelector ? sel.querySelector(`option[value="${type}"]`) : null;
  return o ? o.textContent.replace(/\s*\(default\)\s*$/i, '').trim() : String(type || '');
}
function paintLayerBar(){
  const on = lowerOn(), bar = $('layerBar');
  if(bar && bar.classList) bar.classList.toggle('two', on);
  const seg = $('layerSeg');
  if(seg && seg.querySelectorAll) seg.querySelectorAll('[data-layer]').forEach(b => {
    const me = b.dataset.layer === state.layers.editing; b.classList.toggle('active', me); b.setAttribute('aria-pressed', String(me)); });
  if(document.body && document.body.classList) document.body.classList.toggle('editing-lower', on && state.layers.editing === 'lower');
}
export function syncBaseUi(){ if(!lowerOn() && state.layers.editing === 'lower') editLayer('upper'); paintLayerBar(); }
/** Shape Aware needs the words: on the first surface, it waits (greyed) while the surface is not Text Aware. Cut Out by
 *  Text means nothing for a surface drawn only inside the letters, so it waits while Blend with Text is on. Shape
 *  Strength is hidden while Shape Aware is off. */
export function paintLayerWords(){ const lower = state.layers && state.layers.editing === 'lower', chk = id => !!($(id) && $(id).checked);
  const grey = (id, off) => { const el = $(id); if(!el) return; el.disabled = off; if(el.closest){ const row = el.closest('.check-row'); if(row && row.classList) row.classList.toggle('off', off); } };
  grey('textureShapeAware', !lower && !chk('textureTextAware')); grey('textureTextCut', lower && chk('textureTextBlend'));
  const strengthOff = !chk('textureShapeAware') || !!($('textureShapeAware') || {}).disabled;
  grey('textureShapeStrength', strengthOff);
  // (Ruby: Shape Strength only shows while Shape Aware is on)
  const sf = $('textureShapeStrength'), row = sf && sf.closest && sf.closest('.field'); if(row && row.classList) row.classList.toggle('hidden-off', strengthOff); }
/** The reading a waiting surface wears, as its row would say it (§Reading). */
export function readingOf(L, ui){
  if(!L || !ui || !ui.element) return '';
  const v = elementsFor(L.textureType).find(e => e.el === ui.element);
  return v ? `${v.glyph} ${v.name}` : '';
}
/** A look's layers, as it saves them: the upper under its own keys, the lower as baseLayer (and its locks). */
export function layersIntoLook(s){
  const L = state.layers;
  if(L.editing === 'lower'){
    const shown = pickLayer(s), shownLocks = (s.locks || []).filter(id => LAYER_LOCK_IDS.has(id));
    Object.assign(s, L.other || {});
    s.locks = [...(s.locks || []).filter(id => !LAYER_LOCK_IDS.has(id)), ...(L.otherLocks || [])];
    s.baseLayer = shown; s.baseLocks = shownLocks;
  } else if(L.other){ s.baseLayer = { ...L.other }; s.baseLocks = [...(L.otherLocks || [])]; }
  return s;
}
