/**
 * uiGuard.js — asking first, and saying no: the confirmations, the toasts, the guards on unsaved work and the draft
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $, ASPECTS, WELCOME_POEM } from './appOptions.js';
import { invalidateTextMeasurements, render, scheduleRender } from './canvasRenderer.js';
import { state } from './uiState.js';
import { stripToLook } from './vault.js';
import { validateGraph } from './athanor.js';
import { murmur, refreshUi } from './appEvents.js';
import { modalPrompt, repaintEditor } from './uiControls.js';
import { syncTextureParams, syncTextureTools } from './uiSurface.js';
import { restoreSettings, serializeCurrentSettings } from './uiLook.js';
import { clampSize, pickAspect, syncCustomSize } from './uiLayout.js';
import { pickLayer } from './uiLayers.js';
import { syncCameraPad } from './uiDials.js';

// ARE YOU SURE (the soft no): a question before something that would undo work.
export async function askSure({ title, body, confirmLabel = 'Go ahead', danger = true }){
  murmur.play('confirm');
  return (await modalPrompt({ title, body, confirmLabel, cancelLabel: 'Keep my work', danger })) === true;
}
// THE HARD NO: something that would break the page, refused, and said why.
export function hardNo(title, body){
  murmur.play('hardNo');
  return modalPrompt({ title, body, confirmLabel: 'Understood', alert: true, hard: true });
}
// a quiet note at the foot of the page (errors that were caught, things cleaned up)
let toastTimer = 0;
export function toast(text, action){
  let t = document.getElementById && document.getElementById('toast');
  if(!t && document.createElement && document.body){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  if(!t) return;
  // (a tap anywhere on it but its button puts it away: on a phone it sits over the tabs — the usability review)
  if(!t._tap && t.addEventListener){ t._tap = true; t.addEventListener('click', e => { if(!(e.target && e.target.closest && e.target.closest('.toast-act'))){ t.hidden = true; clearTimeout(toastTimer); } }); }
  t.textContent = text; t.hidden = false; clearTimeout(toastTimer);
  // a toast may carry one action (Copy alt text): it then stays a little longer
  if(action && document.createElement){ const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-act'; b.textContent = action.label;
    b.addEventListener('click', () => { t.hidden = true; action.act(); }); t.appendChild(document.createTextNode(' ')); t.appendChild(b); }
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 9000 : 5200);
}
// WORK SINCE A FRESH START: settled changes counted since the last preset,
// spell, load or summon; past a handful, those ask before replacing them
const GUARD_EDITS = 6;
export const needsGuard = () => (state.ui.edits || 0) >= GUARD_EDITS;
export function markFresh(){ state.ui.edits = -1; }
export async function guardWork(label, what){
  if(!needsGuard()) return true;
  return askSure({ title: `${label}?`, body: `You've made ${state.ui.edits} changes since the last fresh start. ${what} replaces them; Undo can still bring them back.`, confirmLabel: label });
}
// buttons that replace the look ask first (a click from the keyboard too); after, the count starts again
export const GUARDED = { randomFontBtn: ['Summon a new typeface', 'A new typeface'], randomBgBtn: ['Summon a new backdrop', 'A new backdrop'], randomSurfaceBtn: ['Summon a new surface', 'A new surface'],
  spellApplyBtn: ['Invoke this spell', 'The spell'], advancedLoadBtn: ['Load this JSON', 'The JSON'] };
/**
 * A LOOK FROM ANYWHERE (the Workbench JSON, a shared link, an imported
 * spell) is checked before it touches the page: an object, not huge, its
 * Athanor graph cleaned (validateGraph); if restoring it fails anyway, the
 * look as it was comes back. Returns whether it was applied.
 */
const LOOK_MAX_JSON = 512*1024;
function checkLook(obj, what = 'This look'){
  if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, why: `${what} isn't a Vellum look (it should be an object of settings).` };
  let size = 0; try { size = JSON.stringify(obj).length; } catch(e){ return { ok: false, why: `${what} can't be read.` }; }
  if(size > LOOK_MAX_JSON) return { ok: false, why: `${what} is ${Math.round(size/1024)} KB; a look is at most ${LOOK_MAX_JSON/1024} KB.` };
  const look = { ...obj }, notes = [];
  if(look.forgeGraph !== undefined && look.forgeGraph !== ''){
    const v = validateGraph(look.forgeGraph);
    if(!v.ok){ notes.push('its Athanor graph was set aside (' + v.problems.join('; ') + ')'); delete look.forgeGraph; }
    else if(v.problems.length){ look.forgeGraph = JSON.stringify(v.graph); notes.push('its Athanor graph was cleaned (' + v.problems.slice(0, 2).join('; ') + ')'); }
  }
  for(const [k, v] of Object.entries(look)) if(typeof v === 'string' && v.length > 20000 && k !== 'forgeGraph'){ delete look[k]; notes.push(`${k} was too long and was left out`); }
  // the lower surface: an object of a layer's settings, its own graph checked as the upper's is
  if(look.baseLayer !== undefined){
    if(!look.baseLayer || typeof look.baseLayer !== 'object' || Array.isArray(look.baseLayer)){ delete look.baseLayer; notes.push('its lower surface was set aside'); }
    else {
      const L = pickLayer(look.baseLayer);
      for(const [k, v] of Object.entries(L)) if(typeof v === 'string' && v.length > 20000 && k !== 'forgeGraph') delete L[k];
      if(L.forgeGraph){ const v = validateGraph(L.forgeGraph);
        if(!v.ok){ notes.push('its lower surface\'s Athanor graph was set aside (' + v.problems.join('; ') + ')'); L.forgeGraph = ''; }
        else if(v.problems.length){ L.forgeGraph = JSON.stringify(v.graph); notes.push('its lower surface\'s Athanor graph was cleaned'); } }
      look.baseLayer = L;
    }
  }
  if(look.baseLocks !== undefined && !Array.isArray(look.baseLocks)) delete look.baseLocks;
  return { ok: true, look, notes };
}
/** The page's shape from a look: its aspect ratio, or its own width and height. */
export function restoreShape(s){
  if((s.customSize || s.aspect === 'custom') && s.customW && s.customH){
    $('customSizeToggle').checked = true;
    $('customW').value = clampSize(s.customW);
    $('customH').value = clampSize(s.customH);
    syncCustomSize();
  } else if(s.aspect && ASPECTS[s.aspect]){
    $('customSizeToggle').checked = false;
    if(document.body && document.body.classList) document.body.classList.remove('custom-size');
    pickAspect(s.aspect);
  }
}
export function safeRestore(obj, what = 'This look'){
  const c = checkLook(obj, what);
  if(!c.ok){ hardNo('That can’t be loaded', c.why + ' Nothing was changed.'); return false; }
  const before = serializeCurrentSettings();
  // THE PAGE'S SHAPE IS THE PERSON'S (Ruby): once an aspect ratio is chosen it stays until they choose another;
  // a look loaded from anywhere (JSON, a spell, the Grimoire, a saved tile) never changes it, even if it saved one
  const look = { ...c.look }; for(const k of ['aspect', 'customSize', 'customW', 'customH']) delete look[k];
  try { restoreSettings(look); }
  catch(e){
    try { restoreSettings(before); } catch(_){}
    hardNo('That look broke on loading', `Vellum put your look back as it was. (${String(e && e.message || e).slice(0, 120)})`);
    return false;
  }
  if(c.notes.length) toast(what + ' loaded; ' + c.notes.join('; ') + '.');
  scheduleRender();
  return true;
}
// the example look a first visit finds among the custom presets: plain on purpose (warm paper,
// dark ink, Alegreya, a little linen) — something to try, change, or delete
export const FIRST_VISIT_KEY = 'uv.firstvisit.v1';
export const EXAMPLE_LOOK = { name: 'Example · Linen Page', settings: {
  bg1: '#EDE6D8', bgGradient: true, bg2: '#DCCFB8', bgAngle: 160, bgGradientType: 'linear',
  text1: '#2A2320', textGradient: false, font: 'Alegreya', accent1: '#9C3D54', accent2: '#3D6A8A',
  texture: true, textureType: 'linen', textureOpacity: 45, textureBlend: 'soft-light',
  border: false, cardToggle: false, vignette: true, vignetteBlend: 'multiply', vignetteIntensity: 18,
  fx1Type: 'none', fx2Type: 'none', fx3Type: 'none', outlineMode: 'off' } };
// A spell is the look, never the words -- the poem belongs to the Grimoire.
export function settingsForSpell(){
  return stripToLook(serializeCurrentSettings());
}
// THE DRAFT: a phone drops a background tab without an unload event, so the poem in progress and
// its look are kept in this browser (DRAFT_KEY: { poem, look, savedAt }) a moment after each change
// and at once when the page is hidden. The next visit opens on the draft, at the page's own shape (Lain and
// Ruby: the shape is kept between visits). No draft, a draft of the welcome poem itself, or one that won't load
// opens on the welcome page as before; an EMPTY poem is a fresh start: the welcome page, the default theme, and
// every slider and lock as new.
const DRAFT_KEY = 'uv.draft.v1', DRAFT_WAIT_MS = 1000;
let draftSaveTimer = null;
export function saveDraft(){
  clearTimeout(draftSaveTimer); draftSaveTimer = null;
  try {
    if(typeof localStorage === 'undefined') return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ poem: $('poemText').value, look: stripToLook(serializeCurrentSettings()), savedAt: Date.now() }));
  } catch(e){ /* private mode or a full store: the draft just isn't kept */ }
}
export function saveDraftSoon(){ clearTimeout(draftSaveTimer); draftSaveTimer = setTimeout(saveDraft, DRAFT_WAIT_MS); }
export function restoreDraft(){
  let d = null;
  try { d = typeof localStorage === 'undefined' ? null : JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch(e){ return false; }
  if(!d || typeof d !== 'object' || typeof d.poem !== 'string') return false;
  // the look comes back whatever the poem is: an empty page, or the welcome still in it, is no reason to lose a surface
  // someone chose (the controls showed the welcome's while the browser put back the old values: Ruby, 2026-10-19)
  // a look that fails the check is passed over quietly (no dialog at start-up); one that throws is rolled back by safeRestore
  if(!checkLook(d.look, 'The draft').ok || !safeRestore(d.look, 'The draft')) return false;
  try { restoreShape(d.look); } catch(e){ /* the default shape stands */ }
  if(d.poem !== WELCOME_POEM){ $('poemText').value = d.poem; repaintEditor(); }
  return true;
}
// THE BROWSER'S OWN MEMORY OF THE CONTROLS: on a reload a browser may put back the controls' last values by itself,
// after the app has set them and without an event (Ruby saw one surface's slider names over another's values, the
// other drawn). Once the page has loaded, the controls are read as they stand and put back through the app's own
// path, so the names, readouts and hues agree with what is drawn.
// Firefox on a phone revives a discarded tab by putting its fields back AFTER the page has loaded (session restore),
// still without an event (Ruby: the Materia controls only caught up after switching surfaces): so they are read again a
// moment after loading and whenever the page comes back into view, and the surface's own controls are put right each
// time Materia opens (a light pass: names, readouts, swatches, dials; no values change).
export function reconcileControls(){ try { restoreSettings(serializeCurrentSettings()); scheduleRender(); } catch(e){ /* the page stands as it is */ } }
export function resyncSurfaceControls(){ try { syncTextureParams(false); syncTextureTools(false); syncCameraPad(); refreshUi(); scheduleRender(); } catch(e){ /* the page stands as it is */ } }
// The first paint uses fallback metrics, and the fitted size is cached — so
// once the real fonts land the measurements have to be thrown away, or the
// page keeps a size that was measured against the wrong typeface.
export function remeasureAndRender(){
  invalidateTextMeasurements();
  render();
  // (the editor's own font may be what arrived: its text wraps anew, so its height is measured again)
  repaintEditor();
}
