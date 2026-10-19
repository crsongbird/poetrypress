/**
 * appEvents.js — the entry point: wires every control in index.html to the
 * app's state, and asks for a render after anything changes. The glue for
 * this page's HTML specifically; the other modules don't know the DOM's shape.
 *
 * SECTIONS, in file order
 *   lock state          which controls are locked, applied and restored
 *   generic bindings    colour fields, angles, radio groups, stop counts
 *   page size           aspect ratios and custom size
 *   settings            PERSISTED (mechanical controls) plus
 *                       serializeCurrentSettings / restoreSettings, which the
 *                       Workbench JSON and saved spells both use
 *   presets             applyPreset: each texture starts from its own
 *                       defaults, then takes what the preset specifies
 *   colour picker       the swatch palette, the keyboard, and the pointer
 *                       that rings the field being edited
 *   mobile layout       device detection, the preview divider, the viewport
 *   texture tools       knobs, blend, light pad, hues (and hues that follow
 *                       the accents), the seed
 *   locks · PML editor · focus mode · typeface effects · border extras
 *   the moon            in the header, the opacity readout, the seed button
 *   theme · Spellcrafting & Grimoire · the boot sequence (at the bottom)
 *
 * Exports nothing: it is the entry point, and nothing imports from it.
 */

import { texturesSettled, setDrafting, requestTexture, onTextureReady } from './textureService.js';
import { STITCH_STYLES, STITCH_LABELS, stitchSided } from './stitches.js';
import { setBoxFxSoftware, boxFxBackend } from './boxFx.js';
import { forgeShelf, forgeShelfPut, forgeShelfWrite, forgeNameSurface, forgeWiringText, forgeCopy, openForge, closeForge, describeForge } from './forge.js';
import { athanorKnobs, athanorHues, athanorName, athanorNodes, athanorStarter, athanorStarterAt, validateGraph, athanorStepIds, athanorCamera, athanorCurves, ATHANOR_STARTERS } from './athanor.js';
import { ATHANOR_STUDIES } from './athanorStudies.js';
import { curvePoints, curveFromPoints, curveAt } from './steps.js';
import { TEXTURE_CHAINS } from './chains.js';
import { cameraGuide, ringSunGuide } from './stepsGenerative.js';
import { graphScattersGlyphs } from './stepsPatterns.js';
import { elementsFor, TEXTURE_ELEMENTS } from './textureElements.js';
import { attachChooser, chMatches } from './chooser.js';
import { withAltText } from './jpegMeta.js';
import { describeLook } from './altText.js';
import { createMurmur } from './murmur.js';
import { EFFECT_DEFS, EFFECT_TYPES, legacyOutline, legacyTypeEffect } from './effects.js';
import { $, FONTS, FONT_GROUPS, PRESETS, PRESET_GROUPS, ASPECTS, SIZE_LIMITS, DEV_TEMPLATE, DEV_TEMPLATE_TITLE, WELCOME_POEM, TEXTURE_GROUPS, STUDY_GROUPS, STUDY_GROUP_EXTRA } from './appOptions.js';
import { RELEASE_DATE, TEXTURE_STAMPS, SWATCH_STAMP } from './release.js';
import { applyEscapes, tokenizeInline, buildLines } from './textParsers.js';
import { render, scheduleRender, invalidateTextMeasurements, setRenderScale, resetBackBuffer, resolvedPoemText, textLayoutNow, graphUsesPoem, measureTextGround, SURFACE_BLENDS, surfaceFromDom, setSurfaceSource, athanorTitleOf, pageEnvNow, fontIndexByName, boxNow } from './canvasRenderer.js';
import { LIGHT_TURNED, LIGHT_KEPT_PARTS, SURFACE_HUE_KEYS, paramsFor, capsFor, paramReadout, clearTextureCache, dropLargeTextures, clearTexturesOfTypes, TEXTURE_PARAMS, TEXTURE_CAPS, getTextureCanvas, textureKeyFor, peekTexture, athanorSheetLayout, graphUsesBackdrop, graphUsesBox, layerLights } from './textureGenerators.js';
import { seedPhrase, seedFromText } from './seedWords.js';
import { createVault, stripToLook } from './vault.js';
import { applyTheme, savedTheme, DEFAULT_THEME } from './theme.js';
import { registerServiceWorker } from './pwa.js';
import { moonPhase, moonGlyph, moonGlyphURI, phaseName } from './moon.js';
import { moonForSeed } from './texWhimsy.js';
import { blendFamily, pageSunAt } from './texCore.js';
import { paintPresetSwatch, setSwatchTextureSource, swatchTexturesArrived } from './swatches.js';
import { deriveThemePalette } from './palette.js';
import { installEditor } from './editor.js';
import { PREVIEW, SWATCH, DEFAULTS, READABLE } from './tunables.js';
import { applyStrings, fill, PML_GUIDE, PICKER, CHOOSER, DIE, KEPT, BLEND_NAMES, SURFACE_LAYERS, FORGE_BAR, PROTECT, PRESET_ACTS, PAGE_SAYS, HUE5_HINTS, MODAL_RANGE, EYE_OFF } from './strings.js';
// (a starter's or a Surface Study's place in the surface menu: 'starter:agate', 'study:fibers'; see paintTryOptions)
const TRY_GRAPH = /^(starter|study):/;
// soft interface sounds (murmur.js); made here so every handler below can use it
const murmur = createMurmur({ enabled: false });

// the border's stitch menu and the help's stitch list, from the library itself
{ const bs = $('borderStitch');
  if(bs && 'innerHTML' in bs) bs.innerHTML = STITCH_STYLES.map(k => `<option value="${k}">${STITCH_LABELS[k]}</option>`).join('');
  const cs = $('cardStitch');   // the inset box cuts its edge with the same stitches
  if(cs && 'innerHTML' in cs) cs.innerHTML = STITCH_STYLES.map(k => `<option value="${k}">${STITCH_LABELS[k]}</option>`).join('');
  const sl = $('stitchList');
  if(sl && 'innerHTML' in sl) sl.innerHTML = STITCH_STYLES.map(k => `<code>${k}</code>`).join(' '); }

// ---------- the app's working state, in one place ----------
/**
 * Everything the app remembers that the controls themselves don't hold.
 *   page   the look's own settings that live outside an <input>: alignment
 *          and aspect (radio groups) and the gradient stop counts
 *   ui     working flags that are not part of a look
 *   locks  which controls the person has pinned
 * One object, so undo can take a snapshot, texture layers can hold more than
 * one surface, and nothing can read a half-declared variable during boot.
 */
const state = {
  page: { align: 'left', valign: 'center', aspect: '9:16', bgStops: 2, textStops: 2, exportW: 0, exportH: 0 },
  ui:   { tintBySystem: false, tintFollows: [true, true, true, true, true, true], poemTimer: null, palette: [], pickingField: null, zoom: 1, fullPreview: false, saving: false, previewMeasured: false, element: null, edits: 0 },
  locks: new Set(),
  // SURFACE LAYERS: which one the controls show (upper or lower), the other one's settings (a layer: the
  // upper's own keys), its locks, and its reading and hue-following; see the surface layers section
  layers: { editing: 'upper', other: null, otherLocks: [], otherUi: null },
  // undo/redo: look snapshots (see the history section)
  history: { stack: [], index: -1, restoring: false, timer: null },
};

// Coloris is loaded from an external CDN (see index.html). Two separate
// failure modes can happen there, and this guards against both:
//   1. The CDN fails to load at all (network hiccup, CDN issue) -- Coloris
//      is undefined, and calling it directly throws a ReferenceError.
//   2. Coloris loads fine and IS callable, but throws internally anyway
//      (this actually happened: a specific pinned version threw
//      "Cannot set properties of undefined (setting 'className')" from
//      inside its own init code, for reasons outside this app's control).
// Either way, without this guard, the throw happens during this file's
// synchronous top-level execution and takes down everything that runs
// after it -- INCLUDING the preset grid further down. With it, the failure
// degrades to "color pickers lose their custom styling/swatches" instead of
// "the whole app doesn't load".
// 3. Coloris builds its picker when the page finishes loading. Configured
//    after the page is parsed but BEFORE that moment — which is exactly when
//    the app's code runs when it's served as modules (the dev site) — it tries
//    to style a picker that doesn't exist yet, throws, and every setting is
//    lost: no Done, an alpha slider, the wrong layout; the first swatch update
//    afterwards then starts it on its defaults. So settings wait in a queue
//    until the picker exists, and are applied in order.
const colorisQueue = [];
let colorisReady = false;
function callColoris(config){
  if(typeof Coloris !== 'function') return;
  try {
    if(config.instance){ const { instance, ...rest } = config; if(typeof Coloris.setInstance === 'function') Coloris.setInstance(instance, rest); return; }
    Coloris(config);
  } catch(e){
    console.warn('Coloris call failed, continuing without it:', e);
  }
}
function safeColoris(config){
  if(colorisReady){ callColoris(config); return; }
  colorisQueue.push(config);
}
(function whenPickerExists(tries){
  if(typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  if(typeof Coloris === 'function' && document.getElementById('clr-picker')){
    colorisReady = true;
    for(const c of colorisQueue.splice(0)) callColoris(c);
    return;
  }
  // (Coloris is a plain script in the head: if it isn't here once the page
  // has loaded, it never will be — so nothing waits forever, and in Node,
  // where there is no Coloris, nothing waits at all)
  const pageLoaded = document.readyState === 'complete';
  if(typeof Coloris !== 'function' && (pageLoaded || typeof window === 'undefined' || !window.addEventListener)) return;
  if(tries > 200) return;
  setTimeout(() => whenPickerExists(tries + 1), 25);
})(0);

// Base Coloris config. Must run before any later safeColoris({swatches:...})
// call (see applyThemePalette below) -- Coloris merges/updates options at
// runtime rather than replacing them, so this establishes theme/alpha/etc
// once, and subsequent calls only ever touch swatches on top of it.
// On a touch screen the picker must NOT focus its own hex field when it
// opens: that is what summoned the keyboard every time, pushing the picker
// out of reach. The hex field still works when tapped on purpose.
const COARSE_POINTER = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
safeColoris({
  el: '[data-coloris]',
  theme: 'polaroid',
  themeMode: 'dark',
  alpha: false,
  format: 'hex',
  clearButton: false,
  // a clear way out: confirms the colour, closes the picker, and (below)
  // dismisses the keyboard if one is up
  closeButton: true,
  closeLabel: PICKER.done,
  focusInput: !COARSE_POINTER,
});
// the lighting hues keep an ALPHA slider: how much of the colour to use, so
// each effect is optional (a glow at 0% alpha is no glow at all)
safeColoris({ instance: '#textureTint3Hex, #textureTint4Hex, #textureTint5Hex, #textureTint6Hex, #textureTint7Hex, #textureTint8Hex', alpha: true, format: 'hex' });

// ---------- lock state ----------
// The lock set itself lives in `state.locks` (top of the file). This is the
// list of controls that CAN be locked.
const LOCKABLE = [
  'bgColor1Hex','bgColor2Hex','bgColor3Hex','bgColor4Hex',
  'textColorHex','textColor2Hex','textColor3Hex','textColor4Hex',
  'accent1ColorHex','accent2ColorHex','borderColorHex',
  'fontFamily','textureType','textureOpacity','textureBlend','textureLight','cameraTurn',
  'textureTint1Hex','textureTint2Hex','textureTint3Hex','textureTint4Hex','textureTint5Hex','textureTint6Hex','textureTint7Hex','textureTint8Hex','textureTint9Hex','textureTint10Hex','textureTint11Hex','textureTint12Hex','texP1','texP2','texP3','texP4','texP5','texP6','texP7','texP8','textureSeedValue',
];
// …and EVERY slider and menu in the four making tabs (Ruby: all sliders can lock),
// found in the markup, so a new one is lockable the day it is added
if(typeof document.querySelectorAll === 'function'){
  const NOT_LOCKABLE = new Set(['soundVolume', 'uiTheme', 'cameraZoomSlider', 'textureAmbient', 'rimStrength']);   // (the zoom's slider is a view of the camera, locked with it; the Ambient slider is the light's, locked with it)
  for(const el of document.querySelectorAll('.card[data-tab="write"] input[type=range][id], .card[data-tab="style"] input[type=range][id], .card[data-tab="type"] input[type=range][id], .card[data-tab="page"] input[type=range][id], '
      + '.card[data-tab="type"] select[id], .card[data-tab="page"] select[id], .card[data-tab="style"] select[id]'))
    if(!LOCKABLE.includes(el.id) && !NOT_LOCKABLE.has(el.id)) LOCKABLE.push(el.id);
}
// A padlock in the same scratchy hand as the tab glyphs — the shackle swings
// open when unlocked, which reads at a glance without colour.
const LOCK_GLYPH =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
  'stroke-linecap="round" stroke-linejoin="round">' +
  '<rect class="lk-body" x="4.6" y="10.4" width="14.8" height="10.2" rx="1.6"/>' +
  '<rect class="lk-body" x="4.9" y="10.7" width="14.2" height="9.6" rx="1.6" opacity=".45"/>' +
  '<path class="lk-shackle" d="M8.1 10.4V7.3a3.9 3.9 0 0 1 7.8 0v3.1"/>' +
  '<path class="lk-shackle" d="M8.3 10.2V7.2a3.9 3.9 0 0 1 7.6 0v3" opacity=".45"/>' +
  '<circle cx="12" cy="15.4" r="1.5"/>' +
  '</svg>';

// id -> its lock button, so saved lock state can be reflected in the UI
const lockButtons = new Map();

const fontSelect = $('fontFamily');
// grouped (Serif, Sans, … Pixel & Game); each option keeps its /f:N index as
// its value, so the order of the groups never changes a poem
{
  const optFor = i => { const opt = document.createElement('option'); opt.value = i; opt.textContent = FONTS[i].label; return opt; };
  const placed = new Set();
  for(const [name, families] of (FONT_GROUPS || [])){
    const g = document.createElement('optgroup'); g.label = name; let n = 0;
    families.forEach(fam => { const i = FONTS.findIndex(f => f.family === fam); if(i >= 0 && !placed.has(i)){ placed.add(i); g.appendChild(optFor(i)); n++; } });
    if(n) fontSelect.appendChild(g);
  }
  FONTS.forEach((f, i) => { if(!placed.has(i)) fontSelect.appendChild(optFor(i)); });   // (any not yet grouped)
}
fontSelect.value = 3;

$('fontIndexList').innerHTML = FONTS.map((f,i)=>`${i} &nbsp;${f.family}`).join('<br>');
// THE GUIDE'S EXAMPLES: ⤓ Try puts one in the poem where the cursor is, on lines of its own (its input event makes it a step of the poem's undo)
if($('formattingGuidePanel') && $('formattingGuidePanel').querySelectorAll) $('formattingGuidePanel').querySelectorAll('.pml-ex[data-try]').forEach(p => {
  if(typeof document.createElement !== 'function') return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost pml-try'; b.textContent = PML_GUIDE.try; b.title = PML_GUIDE.tryHint; p.appendChild(b); });
if($('formattingGuidePanel') && $('formattingGuidePanel').addEventListener) $('formattingGuidePanel').addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('.pml-try') : null; if(!b) return;
  const host = b.closest ? b.closest('.pml-ex') : null, ta = $('poemText'), ex = (host && host.getAttribute('data-try')) || ''; if(!ta || !ex) return;
  // (at the cursor once one has been placed in the poem; before that, at the end — never above its title)
  const v = ta.value, at = state.ui.poemCaret && typeof ta.selectionEnd === 'number' ? ta.selectionEnd : v.length;
  const before = v.slice(0, at), after = v.slice(at);
  const text = (before && !before.endsWith('\n') ? '\n' : '') + ex + (after && !after.startsWith('\n') ? '\n' : '');
  ta.value = before + text + after;
  try { ta.selectionStart = ta.selectionEnd = before.length + text.length; } catch(err){}
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  if(typeof repaintEditor === 'function') repaintEditor();
  toast(PML_GUIDE.tried);
});

const canvas = $('poemCanvas');
// A CPU canvas, like every layer and texture drawn into it: in Chrome a GPU
// page canvas re-uploaded each CPU layer on every frame (slower than Firefox
// on phones, and heavy on graphics memory). This is the FIRST request for this
// canvas's context, so its settings stick.
const ctx = canvas.getContext('2d', { willReadFrequently: true });
// Android Chrome may throw a canvas's pixels away (memory pressure, a tab left
// in the background). When it gives them back, or the tab returns, draw again.
if(canvas && canvas.addEventListener){
  canvas.addEventListener('contextlost', e => { if(e && e.preventDefault) e.preventDefault(); });
  canvas.addEventListener('contextrestored', () => { resetBackBuffer(); scheduleRender(); });
}
if(typeof document.addEventListener === 'function'){
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible'){ resetBackBuffer(); scheduleRender(); } });
}

function syncStopFields(count, field3Id, field4Id){
  $(field3Id).style.display = count >= 3 ? 'block' : 'none';
  $(field4Id).style.display = count >= 4 ? 'block' : 'none';
}

// ---------- generic bindings ----------
function bindColorField(hexId, onChange){
  $(hexId).addEventListener('input', onChange);
}
function setColorField(hexId, hex){
  const el = $(hexId);
  el.value = hex.toUpperCase();
  el.dispatchEvent(new Event('input', {bubbles:true}));
}
function randHex(){ return '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0'); }

// every switch → section pair and angle → readout pair, so refreshUi() can
// put each view right after anything sets values directly (a load, undo, a preset)
const SUBBLOCKS = [], ANGLES = [];
function toggleSubblock(checkboxId, blockId){
  const box = $(checkboxId), block = $(blockId);
  const sync = ()=>{ block.classList.toggle('open', box.checked); scheduleRender(); };
  box.addEventListener('change', sync);
  SUBBLOCKS.push([box, block]);
  sync();
}

function bindAngle(rangeId, labelId){
  const r = $(rangeId), l = $(labelId);
  r.addEventListener('input', ()=>{ l.textContent = r.value+'°'; scheduleRender(); });
  ANGLES.push([r, l]);
}

/**
 * THE ONE REFRESH: every view of a value made to match the value — sections
 * open as their switches say, readouts, moons, the dial, the readings, locks
 * and master locks, the seed's words. Cheap, and safe to run any time; run
 * after anything that writes values without firing their events (Ruby: "UI
 * elements not updating when certain elements are refreshed").
 */
function refreshUi(){
  for(const [box, block] of SUBBLOCKS) if(box && block && block.classList) block.classList.toggle('open', !!box.checked);
  for(const [r, l] of ANGLES) if(r && l) l.textContent = r.value + '°';
  const run = fn => { try { if(typeof fn === 'function') fn(); } catch(e){} };
  run(refreshReadouts); run(syncFrameVisibility); run(syncBaseUi); run(paintMoons); run(paintSeedMoon); run(syncLightPad);
  run(paintElements); run(() => { for(const [, b] of lockButtons) if(b._paint) b._paint(); }); run(paintMasterLocks); run(paintReveal);
  run(() => syncSeedWords(false));
  run(() => { for(const ch of CHOOSERS) ch.refresh(); });
  run(refreshHints);
  run(() => { for(let i = 1; i <= 8; i++) paintKnobDial($('texP' + i)); });
  run(paintCurves);
}
// the surface menus as tiles (chooser.js), filled in below once the swatch source is set
const CHOOSERS = [];

// (a radio group is a row of tiles: for a keyboard and a screen reader, each is a radio that Tab reaches and Enter or
// Space chooses — the usability review: they were bare tiles no keyboard could reach)
const radioAria = group => group.querySelectorAll('.radio-btn').forEach(b => { if(b.setAttribute) b.setAttribute('aria-checked', b.classList.contains('active') ? 'true' : 'false'); });
function bindRadioGroup(containerId, onSelect){
  const group = $(containerId);
  if(group.setAttribute) group.setAttribute('role', 'radiogroup');
  group.querySelectorAll('.radio-btn').forEach(btn=>{
    if(btn.setAttribute){ btn.setAttribute('role', 'radio'); btn.tabIndex = 0; }
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.radio-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); radioAria(group);
      onSelect(btn.dataset.val);
    });
    if(btn.addEventListener) btn.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); btn.click(); } });
  });
  radioAria(group);
}
function setActiveRadioValue(containerId, val){
  const group = $(containerId);
  group.querySelectorAll('.radio-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.val === String(val));
  });
  radioAria(group);
}

bindColorField('textColorHex', scheduleRender);
bindColorField('textColor2Hex', scheduleRender);
bindColorField('textColor3Hex', scheduleRender);
bindColorField('textColor4Hex', scheduleRender);
bindColorField('bgColor1Hex', scheduleRender);
bindColorField('bgColor2Hex', scheduleRender);
bindColorField('bgColor3Hex', scheduleRender);
bindColorField('bgColor4Hex', scheduleRender);
bindColorField('borderColorHex', scheduleRender);
bindColorField('accent1ColorHex', ()=>{ followAccents(); scheduleRender(); });
bindColorField('accent2ColorHex', ()=>{ followAccents(); scheduleRender(); });

toggleSubblock('textGradientToggle','gradientBlock');
toggleSubblock('bgGradientToggle','bgGradientBlock');
toggleSubblock('borderToggle','borderBlock');
toggleSubblock('accent1Toggle','accent1Block');
toggleSubblock('accent2Toggle','accent2Block');
toggleSubblock('textureToggle','textureBlock');

// ---------- SURFACE LAYERS (Ruby: "all controls for the second layer, a swap, every blend") ----------
// Two surfaces, one above the other. The controls show ONE of them (the layer bar picks which); the
// other's settings wait in state.layers.other, under the same keys the upper saves with. A look always
// saves the upper under its own keys and the lower as `baseLayer`, whichever the controls show; Swap
// trades the two whole, locks included.
const LAYER_KEYS = ['textureType', 'texP1', 'texP2', 'texP3', 'texP4', 'texP5', 'texP6', 'texP7', 'texP8', 'textureOpacity', 'textureBlend', 'textureLight', 'textureLightTilt', 'cameraTurn', 'cameraView', 'cameraZoom',
  'textureRim', 'textureRimTilt', 'textureAmbient', 'textureTint7', 'textureTint8',
  'textureTint1', 'textureTint2', 'textureTint3', 'textureTint4', 'textureTint5', 'textureTint6', 'textureTint9', 'textureTint10', 'textureTint11', 'textureTint12', 'textureSeedWords', 'textureSeed', 'forgeGraph', 'textureGround',
  'textureTextAware', 'textureTextBlend', 'textureShapeAware', 'textureTextCut', 'textureShapeStrength', 'textureCurve1', 'textureCurve2'];
const LAYER_LOCK_IDS = new Set(['textureType', 'textureOpacity', 'textureBlend', 'textureLight', 'cameraTurn', 'textureSeedValue',
  'texP1', 'texP2', 'texP3', 'texP4', 'texP5', 'texP6', 'texP7', 'texP8', 'textureShapeStrength', 'textureTint1Hex', 'textureTint2Hex', 'textureTint3Hex', 'textureTint4Hex', 'textureTint5Hex', 'textureTint6Hex', 'textureTint7Hex', 'textureTint8Hex', 'textureTint9Hex', 'textureTint10Hex', 'textureTint11Hex', 'textureTint12Hex']);
const pickLayer = s => Object.fromEntries(LAYER_KEYS.filter(k => s[k] !== undefined).map(k => [k, s[k]]));
const lowerOn = () => !!($('baseToggle') && $('baseToggle').checked && $('textureToggle').checked);
/** A new lower surface: Waking Grain beneath, as the base layer always began, on its own seed. */
function freshLower(){
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
function editLayer(which){
  if(which === 'lower' && !lowerOn()) which = 'upper';
  if(which === state.layers.editing) { paintLayerBar(); return; }
  exchangeLayers(); state.layers.editing = which; paintLayerWords();
  refreshUi(); scheduleRender();
}
/** Trade the two surfaces (Ruby: everything about each, blend and locks too): the controls keep their place. */
function swapLayers(){
  if(!lowerOn()) return;
  exchangeLayers(); refreshUi(); scheduleRender(); commitSoon();
  toast(state.layers.editing === 'upper' ? SURFACE_LAYERS.swappedUp : SURFACE_LAYERS.swappedDown);
}
/** A surface's name as its menu shows it (an Athanor surface's from its own graph). */
function surfaceNameOf(type, graph){
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
function syncBaseUi(){ if(!lowerOn() && state.layers.editing === 'lower') editLayer('upper'); paintLayerBar(); }
/** Shape Aware needs the words: on the first surface, it waits (greyed) while the surface is not Text Aware. Cut Out by
 *  Text means nothing for a surface drawn only inside the letters, so it waits while Blend with Text is on. */
function paintLayerWords(){ const lower = state.layers && state.layers.editing === 'lower', chk = id => !!($(id) && $(id).checked);
  const grey = (id, off) => { const el = $(id); if(!el) return; el.disabled = off; if(el.closest){ const row = el.closest('.check-row'); if(row && row.classList) row.classList.toggle('off', off); } };
  grey('textureShapeAware', !lower && !chk('textureTextAware')); grey('textureTextCut', lower && chk('textureTextBlend'));
  grey('textureShapeStrength', !chk('textureShapeAware') || !!($('textureShapeAware') || {}).disabled); }
for(const id of ['textureTextAware', 'textureTextBlend', 'textureShapeAware', 'textureTextCut']) if($(id) && $(id).addEventListener) $(id).addEventListener('change', () => { paintLayerWords(); scheduleRender(); commitSoon(); });
if($('layerSeg') && $('layerSeg').addEventListener) $('layerSeg').addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('[data-layer]') : null; if(b) editLayer(b.dataset.layer); });
if($('layerSwap') && $('layerSwap').addEventListener) $('layerSwap').addEventListener('click', swapLayers);
if($('baseToggle') && $('baseToggle').addEventListener) $('baseToggle').addEventListener('change', () => {
  if(lowerOn() && !state.layers.other && state.layers.editing === 'upper'){ state.layers.other = freshLower(); state.layers.otherUi = { element: null, follows: [true, true] }; }
  syncBaseUi(); scheduleRender(); });
// the renderer draws the layer the controls don't show from here
setSurfaceSource(() => ({ editing: state.layers.editing, other: state.layers.other, lowerOn: lowerOn(), otherReading: readingOf(state.layers.other, state.layers.otherUi) }));
/** The reading a waiting surface wears, as its row would say it (§Reading). */
function readingOf(L, ui){
  if(!L || !ui || !ui.element) return '';
  const v = elementsFor(L.textureType).find(e => e.el === ui.element);
  return v ? `${v.glyph} ${v.name}` : '';
}
/** A look's layers, as it saves them: the upper under its own keys, the lower as baseLayer (and its locks). */
function layersIntoLook(s){
  const L = state.layers;
  if(L.editing === 'lower'){
    const shown = pickLayer(s), shownLocks = (s.locks || []).filter(id => LAYER_LOCK_IDS.has(id));
    Object.assign(s, L.other || {});
    s.locks = [...(s.locks || []).filter(id => !LAYER_LOCK_IDS.has(id)), ...(L.otherLocks || [])];
    s.baseLayer = shown; s.baseLocks = shownLocks;
  } else if(L.other){ s.baseLayer = { ...L.other }; s.baseLocks = [...(L.otherLocks || [])]; }
  return s;
}
toggleSubblock('vignetteToggle','vignetteBlock');
$('vignetteBlend').addEventListener('change', scheduleRender);
$('vignetteIntensity').addEventListener('input', ()=>{ $('vignetteIntensityVal').textContent=$('vignetteIntensity').value+'%'; scheduleRender(); });

bindAngle('textGradientAngle','textGradientAngleVal');
bindAngle('bgGradientAngle','bgGradientAngleVal');

bindRadioGroup('alignGroup', v=>{ state.page.align=v; scheduleRender(); });
bindRadioGroup('valignGroup', v=>{ state.page.valign=v; scheduleRender(); });
// ---------- page size ----------
/** Applies a page size, mirroring it into the custom boxes so switching to
 *  Custom starts from whatever you were just looking at. */
function setPageSize(w, h, mirror){
  // the EXPORT size; the preview canvas is drawn smaller (see the preview's scale)
  state.page.exportW = w; state.page.exportH = h;
  if(mirror !== false){ $('customW').value = w; $('customH').value = h; }
  applyPreviewScale();
}

// ---------- the preview's scale ----------
// The preview is drawn at the size it is SHOWN — its box on screen times the
// screen's pixel density, times any pinch-zoom — not at the export's 3072px,
// which the phone then shrank. S (render size ÷ export size) is one of a few
// fixed steps, so textures cache cleanly instead of regenerating at slightly
// different sizes. Every texture and the renderer measure in canonical pixels
// (texCore.js), so the preview looks like the export scaled down; Save image
// renders the full export.
const S_STEPS = [1/4, 1/3, 1/2, 2/3, 1];
function previewScale(){
  if(state.ui.fullPreview || !state.page.exportW) return 1;   // (null below means: not measurable yet)
  const wrap = typeof document.querySelector === 'function' ? document.querySelector('.canvas-wrap') : null;
  const boxW = wrap && wrap.clientWidth, boxH = wrap && wrap.clientHeight;
  if(!boxW || !boxH) return null;                              // not laid out yet: no measurement
  const ratio = state.page.exportW / state.page.exportH;
  const shownW = Math.min(boxW, boxH * ratio);               // the canvas fits its box
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  // at least as large as it is shown, so the layout can never shrink it
  const need = shownW * dpr * Math.max(1, state.ui.zoom) / state.page.exportW;
  return S_STEPS.find(s => s >= need) || 1;
}
// Steps UP at once when more detail is needed, but DOWN only on deliberate
// changes (page size, zoom reset, the comparison switch) — never on a passing
// layout change: dragging the divider or opening the keyboard would otherwise
// step the scale down and back up, regenerating every texture each time.
function applyPreviewScale(allowDown = true){
  // never while Save image is rendering the full export
  if(!state.page.exportW || state.ui.saving) return;
  let S = previewScale();
  if(S === null) return;                                       // try again once the layout settles
  // The FIRST real measurement may always step down: at launch the box can't
  // be measured, the preview starts full size, and holding it there (the rule
  // below) left desktops drawing 3072px for the whole session.
  if(!state.ui.previewMeasured){ state.ui.previewMeasured = true; allowDown = true; }
  const current = canvas.width / state.page.exportW;
  if(!allowDown && !state.ui.fullPreview && S < current - 1e-6) S = current;
  const w = Math.max(1, Math.round(state.page.exportW * S)), h = Math.max(1, Math.round(state.page.exportH * S));
  if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  // never SHOWN larger than the image it previews: a small custom size is
  // shown at its own size (in the screen's real pixels), not blown up to fill
  // the box
  capPreviewDisplay();
  setRenderScale(w / state.page.exportW, [state.page.exportW, state.page.exportH]);
  scheduleRender();
}
function capPreviewDisplay(){
  if(!canvas || !canvas.style || !state.page.exportW) return;
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const capW = state.page.exportW / dpr, capH = state.page.exportH / dpr;
  // let the layout size it first; only where that is LARGER than the image's
  // own pixels does the cap take over (it is then the tighter limit anyway)
  canvas.style.maxWidth = ''; canvas.style.maxHeight = '';
  const settle = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f => f());
  settle(() => {
    const shown = canvas.clientWidth || 0;
    if(shown > capW + 0.5){ canvas.style.maxWidth = capW.toFixed(1) + 'px'; canvas.style.maxHeight = capH.toFixed(1) + 'px'; }
  });
}
let previewScaleTimer = null;
// layout changes (resize, the divider, the keyboard) never step the scale down
const applyPreviewScaleSoon = () => { clearTimeout(previewScaleTimer); previewScaleTimer = setTimeout(() => applyPreviewScale(false), 150); };
if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', applyPreviewScaleSoon);
const clampSize = (n) =>
  Math.max(SIZE_LIMITS.min, Math.min(SIZE_LIMITS.max, Math.round(+n || 0)));

function pickAspect(v){
  if(!ASPECTS[v]) return;
  state.page.aspect = v;
  const [w, h] = ASPECTS[v];
  setPageSize(w, h);
  // the two groups are one choice; clear the other's selection
  setActiveRadioValue('aspectGroup', v);
  setActiveRadioValue('aspectGroupWide', v);
  scheduleRender();
}
bindRadioGroup('aspectGroup', pickAspect);
bindRadioGroup('aspectGroupWide', pickAspect);

function applyCustomSize(said){
  const w = clampSize($('customW').value);
  const h = clampSize($('customH').value);
  // a size typed past the range is said, not quietly changed (the usability review)
  if(said && (String(w) !== String($('customW').value).trim() || String(h) !== String($('customH').value).trim())) toast(fill(PAGE_SAYS.sizeClamped, w + ' × ' + h));
  $('customW').value = w; $('customH').value = h;
  state.page.aspect = 'custom';
  setPageSize(w, h, false);
  scheduleRender();
}
function syncCustomSize(){
  const on = $('customSizeToggle').checked;
  if(document.body && document.body.classList) document.body.classList.toggle('custom-size', on);
  if(on) applyCustomSize();
  else if(ASPECTS[state.page.aspect]) pickAspect(state.page.aspect);
  else pickAspect('9:16');
}
$('customSizeToggle').addEventListener('change', syncCustomSize);
['customW','customH'].forEach(id => $(id).addEventListener('change', ()=>{
  if($('customSizeToggle').checked) applyCustomSize(true);
}));
bindRadioGroup('bgStopsGroup', v=>{
  state.page.bgStops = parseInt(v,10);
  syncStopFields(state.page.bgStops, 'bgColor3Field', 'bgColor4Field');
  scheduleRender();
});
bindRadioGroup('textStopsGroup', v=>{
  state.page.textStops = parseInt(v,10);
  syncStopFields(state.page.textStops, 'textColor3Field', 'textColor4Field');
  scheduleRender();
});

$('textureType').addEventListener('change', scheduleRender);
$('textureOpacity').addEventListener('input', ()=>{ paintMoons(); scheduleRender(); });

function randomSeed(){ return Math.floor(Math.random()*2**31); }
function maybeRerollSeed(explicitSeed){
  // the seed field's lock is the one control for this now
  if(state.locks.has('textureSeedValue')) return;
  $('textureSeedValue').value = (explicitSeed !== undefined) ? explicitSeed : randomSeed();
  if(explicitSeed === undefined) seedCamera();
}
$('textureSeedValue').addEventListener('input', scheduleRender);
$('textureSeedReroll').addEventListener('click', ()=>{
  $('textureSeedValue').value = randomSeed(); seedCamera();
  scheduleRender();
});


['fontFamily','maxSize','borderThickness','borderOffset','usernameField'].forEach(id=>{
  $(id).addEventListener('input', scheduleRender);
});
$('usernameCorner').addEventListener('change', scheduleRender);
$('spellMark').addEventListener('change', scheduleRender);
// THE CREDIT IS KEPT (Ruby: "save the username/credit in the local storage so the user doesn't have to keep entering it.
// It should persist forever"): whatever is typed is kept in this browser, and every visit starts with it. It is never
// part of a look (vault.js NOT_PART_OF_A_LOOK), so no preset, spell or shared look changes it; clearing the field clears it.
const CREDIT_KEY = 'uv.credit.v1';
if($('usernameField') && $('usernameField').addEventListener){
  const keepCredit = () => { try { localStorage.setItem(CREDIT_KEY, String($('usernameField').value || '').slice(0, 120)); } catch(e){} };
  $('usernameField').addEventListener('input', keepCredit); $('usernameField').addEventListener('change', keepCredit);
  try { const k = typeof localStorage === 'undefined' ? null : localStorage.getItem(CREDIT_KEY); if(k != null && !$('usernameField').value) $('usernameField').value = k; } catch(e){}
}

$('poemText').addEventListener('input', ()=>{
  clearTimeout(state.ui.poemTimer);
  state.ui.poemTimer = setTimeout(scheduleRender, 150);
  notePoemSoon();
});
// (where the cursor is counts only once the poem has been touched: ⤓ Try goes at the end until then)
for(const ev of ['focus', 'click', 'keyup']) if($('poemText').addEventListener) $('poemText').addEventListener(ev, () => { state.ui.poemCaret = true; });

// Text Margins: how much room the text keeps from the page edges and the frame
// (100% is the layout as it always was; lower lets the poem grow)
$('textMargin').addEventListener('input', ()=>{ $('textMarginVal').textContent = $('textMargin').value + '%'; scheduleRender(); });
$('lineSpacing').addEventListener('input', ()=>{
  const spacing = Math.pow(2, parseFloat($('lineSpacing').value) || 0);
  $('lineSpacingVal').textContent = spacing.toFixed(2)+'x';
  scheduleRender();
});

// The Summon buttons roll the way last chosen on any die (dieLevel): as usual, their known-good
// schemes; gently or wildly, their whole section that way. A locked control is never touched.
const summonCard = id => { const b = $(id); return b && b.closest ? b.closest('details.card') : null; };
$('randomFontBtn').addEventListener('click', ()=>{
  const lv = dieLevel(), card = summonCard('randomFontBtn');
  if(lv !== 'usual' && card){ rollSection(card, lv, { summon: true }); return; }
  const free = id => !state.locks.has(id);
  withLocksPreserved(()=>{
  if(free('fontFamily')) fontSelect.value = Math.floor(Math.random()*FONTS.length);
  if(free('textColorHex')) setColorField('textColorHex', randHex());

  // the gradient's switch belongs to its colours: when they are locked, it stays
  if(free('textColor2Hex') && free('textGradientAngle')){
    const gradOn = Math.random() < 0.6;
    $('textGradientToggle').checked = gradOn;
    $('gradientBlock').classList.toggle('open', gradOn);
    if(gradOn){
      setColorField('textColor2Hex', randHex());
      $('textGradientAngle').value = Math.floor(Math.random()*360);
      $('textGradientAngleVal').textContent = $('textGradientAngle').value+'°';
    }
  }

  if(free('accent1ColorHex')) setColorField('accent1ColorHex', randHex());
  if(free('accent2ColorHex')) setColorField('accent2ColorHex', randHex());

  scheduleRender();
  });
});
// NEW BACKDROP: only the backdrop's own colours (every stop in use) and the
// gradient's angle — nothing else on the page changes (Ruby). The colours are
// a small scheme around one hue (near, split or across the wheel), dark under
// light text and pale under dark text, so the words stay readable.
function backdropColours(n){
  const t = hexToRgbObj($('textColorHex').value || '#EEEEEE'), lum = (0.2126*t.r + 0.7152*t.g + 0.0722*t.b)/255;
  const dark = lum > 0.5, h0 = Math.random()*360, scheme = Math.floor(Math.random()*4);
  const hueAt = i => scheme === 0 ? h0 + (i - (n - 1)/2)*18                       // near: neighbours
                   : scheme === 1 ? h0 + (i % 2 ? 150 : 0) + i*8                  // split across the wheel
                   : scheme === 2 ? h0 + i*120                                    // three apart
                   : h0;                                                          // one hue, light to dark
  const out = [];
  for(let i = 0; i < n; i++){
    const s = 0.25 + Math.random()*0.45, step = n > 1 ? i/(n - 1) : 0;
    const l = dark ? 0.06 + Math.random()*0.10 + (scheme === 3 ? step*0.16 : Math.random()*0.08)
                   : 0.80 + Math.random()*0.08 + (scheme === 3 ? -step*0.14 : Math.random()*0.06);
    out.push(hslHex(((hueAt(i) % 360) + 360) % 360, s, Math.max(0.03, Math.min(0.96, l))));
  }
  return out;
}
function hslHex(h, s, l){
  const f = k => { const a = s*Math.min(l, 1 - l), kk = (k + h/30) % 12; return l - a*Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); };
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v*255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function hexToRgbObj(hex){ const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16) || 0; return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; }
$('randomBgBtn').addEventListener('click', ()=>{
  const lv = dieLevel(), card = summonCard('randomBgBtn');
  if(lv !== 'usual' && card){ rollSection(card, lv, { summon: true }); return; }
  // locked controls are never set, and restored after the randomiser runs
  withLocksPreserved(()=>{
    const grad = $('bgGradientToggle').checked, n = grad ? (state.page.bgStops || 2) : 1;
    const cols = backdropColours(n);
    ['bgColor1Hex', 'bgColor2Hex', 'bgColor3Hex', 'bgColor4Hex'].slice(0, n).forEach((id, i) => { if(!state.locks.has(id)) setColorField(id, cols[i]); });
    if(grad && $('bgGradientAngle') && !state.locks.has('bgGradientAngle')){ $('bgGradientAngle').value = Math.floor(Math.random()*360); if($('bgGradientAngleVal')) $('bgGradientAngleVal').textContent = $('bgGradientAngle').value + '°'; }
    scheduleRender();
  });
});
// RANDOM SURFACE: a texture from the menu, one of its four readings (known-good
// settings, which respect locks), and a new seed — nothing else on the page
if($('randomSurfaceBtn') && $('randomSurfaceBtn').addEventListener) $('randomSurfaceBtn').addEventListener('click', ()=>{
  const lv = dieLevel(), card = summonCard('randomSurfaceBtn');
  if(lv !== 'usual' && card){
    // gently: the same surface, nudged; wildly: anything (the surface switched on, as Summon always does)
    if(lv === 'wild' && !$('textureToggle').checked){ $('textureToggle').checked = true; $('textureToggle').dispatchEvent(new Event('change', { bubbles: true })); }
    rollSection(card, lv, { summon: true }); return;
  }
  withLocksPreserved(()=>{
    if(!$('textureToggle').checked){ $('textureToggle').checked = true; $('textureToggle').dispatchEvent(new Event('change', { bubbles: true })); }
    if(!state.locks.has('textureType')){
      const graph = (($('forgeGraph') || {}).value || '').length > 40;
      const types = [...$('textureType').options].filter(o => !o.hidden).map(o => o.value).filter(v => v && !TRY_GRAPH.test(v) && (v !== 'athanor' || graph) && v !== $('textureType').value);
      $('textureType').value = types[Math.floor(Math.random()*types.length)];
      $('textureType').dispatchEvent(new Event('change', { bubbles: true }));
    }
    const els = ['fire', 'water', 'wind', 'earth'];
    if(typeof applyElement === 'function') applyElement(els[Math.floor(Math.random()*4)]);
    maybeRerollSeed();
    scheduleRender();
  });
});
function plainTextFromLine(rawContent, accent1On, accent2On){
  const escaped = applyEscapes(rawContent);
  const segments = tokenizeInline(escaped, accent1On, accent2On);
  return segments.map(s=>s.text).join('');
}
function slugifyForFilename(text){
  const alnumAndSpaces = text.replace(/[^a-zA-Z0-9\s]/g, '');
  const slug = alnumAndSpaces.trim().replace(/\s+/g, '-');
  return slug;
}
function generateFilenameBase(){
  const accent1On = $('accent1Toggle').checked;
  const accent2On = $('accent2Toggle').checked;
  const rawLines = $('poemText').value.replace(/\r\n/g,'\n').split('\n');

  let sourceLine = null;

  for(const rawLine of rawLines){
    if(rawLine.startsWith('## ')){
      sourceLine = rawLine.slice(3);
      break;
    }
  }

  if(sourceLine === null){
    for(const rawLine of rawLines){
      if(rawLine.trim() === '') continue;
      let content = rawLine;
      if(content.startsWith('-# ')) content = content.slice(3);
      else if(content.startsWith('> ')) content = content.slice(2);
      sourceLine = content;
      break;
    }
  }

  if(sourceLine === null) return 'poem';

  const plain = plainTextFromLine(sourceLine, accent1On, accent2On);
  const truncated = plain.slice(0, 40);
  const slug = slugifyForFilename(truncated);
  return slug || 'poem';
}

/** The saved image's alt text (altText.js): the poem's words — read as the
 *  page reads them, by PML's own parser, its markup, §variables and rules
 *  gone — then what the page looks like, from the controls as they stand. */
function poemAltText(){
  const v = id => ($(id) || {}).value, on = id => !!($(id) && $(id).checked);
  const text = id => { const e = $(id); const o = e && e.selectedOptions && e.selectedOptions[0]; return o ? o.textContent.replace(/\s*\(default\)\s*$/i, '').trim() : ''; };
  const a1 = on('accent1Toggle'), a2 = on('accent2Toggle');
  // the poem as the page shows it: §Variables filled in (a report reads as its values); any left are dropped
  const filled = typeof resolvedPoemText === 'function' ? resolvedPoemText() : null;
  const raw = String(filled != null ? filled : (v('poemText') || '')).replace(/§[A-Za-z]+(?:![A-Za-z0-9_-]+|:-?\d*\.?\d+)?/g, '');
  let poem = [];
  try {
    poem = buildLines(raw, a1, a2).map(l => l.isBlank ? '' : (l.parts || [{ segments: l.segments || [] }])
      .map(p => (p.segments || []).map(s => s.text || '').join('')).join(' ').replace(/[\uE100-\uE23F]/g, '').replace(/\s+/g, ' ').trim());
  } catch(e){ poem = raw.split('\n'); }
  // the two surfaces, whichever the controls show (a reading belongs to the one shown)
  const shown = pickLayer(surfaceFromDom()), editingLower = state.layers.editing === 'lower';
  const upperL = editingLower ? (state.layers.other || {}) : shown, lowerL = editingLower ? shown : state.layers.other;
  const row = $('elementRow'), applied = row && row.dataset && row.dataset.applied;
  const describeSurface = (L, isShown) => {
    const t = L.textureType, caps = capsFor(t) || {}, defs = paramsFor(t) || [];
    const reading = isShown && applied ? elementsFor(t).find(e => e.el === state.ui.element) : null;
    return { type: t, name: surfaceNameOf(t, L.forgeGraph), reading: reading && !reading.isDefault ? reading.name : null, element: reading ? reading.element : null,
      opacity: +L.textureOpacity || 0, blend: L.textureBlend,
      knobs: defs.map((d, i) => ({ label: d.label, value: +L['texP' + (i + 1)], min: d.min, max: d.max })),
      hues: SURFACE_HUE_KEYS.map(k => L[k]).slice(0, caps.tints || 0),
      light: caps.light && !caps.dial ? { deg: +L.textureLight || 0, tilt: +L.textureLightTilt } : null };
  };
  return describeLook({
    poem,
    font: text('fontFamily'),
    textColours: [v('textColorHex'), on('textGradientToggle') ? v('textColor2Hex') : null, a1 ? v('accent1ColorHex') : null, a2 ? v('accent2ColorHex') : null],
    effects: ['fx1Type', 'fx2Type', 'fx3Type'].map(v).filter(t => t && t !== 'none'),
    background: [v('bgColor1Hex'), on('bgGradientToggle') ? v('bgColor2Hex') : null],
    surface: on('textureToggle') && upperL.textureType ? describeSurface(upperL, !editingLower) : null,
    base: lowerOn() && lowerL && lowerL.textureType ? { name: surfaceNameOf(lowerL.textureType, lowerL.forgeGraph), inText: !!lowerL.textureTextBlend } : null,
    cut: on('textureToggle') && ((upperL.textureType && upperL.textureTextCut) || (lowerOn() && lowerL && lowerL.textureType && lowerL.textureTextCut && !lowerL.textureTextBlend)),
    border: on('borderToggle') ? { colour: v('borderColorHex'), stitch: text('borderStitch').toLowerCase() } : null,
    box: on('cardToggle'), vignette: on('vignetteToggle'),
    // the credit, as words (any PML colour markup is only colour)
    credit: (() => { const u = String(v('usernameField') || '').trim(); if(!u) return '';
      try { const ln = buildLines(u, true, true)[0] || {}; return (ln.parts || [{ segments: ln.segments || [] }]).map(p => (p.segments || []).map(s => s.text || '').join('')).join(' ').replace(/\s+/g, ' ').trim(); } catch(e){ return u; } })(),
  });
}
$('downloadBtn').addEventListener('click', async ()=>{
  if(state.ui.saving) return;
  const base = generateFilenameBase();
  const ts = Math.floor(Date.now()/1000);
  const link = document.createElement('a');
  link.download = `poetrypress-${base}-${ts}.jpg`;
  // Render the FULL export for the file, then go back to the preview. The
  // full-size textures are made in the texture worker, so the page stays
  // responsive; the first render asks for them, the second draws them.
  const btn = $('downloadBtn'), label = btn.textContent;
  state.ui.saving = true; btn.textContent = 'Saving…'; btn.disabled = true; if(typeof setWorking === 'function') setWorking('saving');
  if(document.body && document.body.classList) document.body.classList.add('saving');
  const pw = canvas.width, ph = canvas.height;
  try {
    canvas.width = state.page.exportW || pw; canvas.height = state.page.exportH || ph;
    setDrafting(false); clearTimeout(draftTimer);
    setRenderScale(1, [canvas.width, canvas.height]); render();
    await texturesSettled();
    render();
    // the poem's words go inside the file as its alt text (jpegMeta.js)
    state.ui.lastAlt = poemAltText();
    link.href = withAltText(canvas.toDataURL('image/jpeg', 1.0), state.ui.lastAlt);
  } finally {
    canvas.width = pw; canvas.height = ph;
    setRenderScale(pw / (state.page.exportW || pw), [state.page.exportW || pw, state.page.exportH || ph]);
    state.ui.saving = false; btn.textContent = label; btn.disabled = false; setWorking(null);
    // the full-size textures go: a phone shouldn't keep several 38 MB textures it won't reuse soon
    dropLargeTextures((state.page.exportW || pw)*(state.page.exportH || ph));
    if(document.body && document.body.classList) document.body.classList.remove('saving');
    render();
  }
  link.click();
  murmur.play('saveImage');
  // Bluesky (and most places) don't read alt text from inside the file: it is
  // offered for pasting too, as the toast's button (never copied unasked: the
  // clipboard is the person's — the usability review)
  offerAltText(state.ui.lastAlt);
});
function offerAltText(alt){
  if(!alt) return;
  toast('Saved, with its alt text inside.', { label: 'Copy alt text', act: async () => {
    try { await navigator.clipboard.writeText(alt); toast('Alt text copied.'); }
    catch(e){ modalPrompt({ title: 'The alt text', body: 'Copy it from here.', input: true, defaultValue: alt, rows: 6, confirmLabel: 'Done', alert: true }); } } });
}

// ---------- settings: save and restore (the Workbench JSON, spells) ----------
/**
 * Controls whose save/restore is purely mechanical: read the element, write
 * it back. Adding a control here is the whole job — it is then saved in
 * settings, restored from them, and carried by exported spells.
 *
 * Each row: [key in the saved JSON, element id, kind, readout suffix].
 *   kind  'text'  -> element.value as saved
 *         'check' -> element.checked
 *         'color' -> element.value, restored through setColorField
 * A readout suffix means a sibling `${id}Val` span shows the value.
 *
 * Key names and value types are frozen: spells already saved in people's
 * browsers use exactly these, so renaming one would silently drop that
 * setting on load. Controls with real logic of their own — conditional
 * gradient stops, the font by name, locks, page size — stay hand-written
 * in serializeCurrentSettings and restoreSettings below.
 */
const PERSISTED = [
  ['bgGradientType',       'bgGradientType',       'text'],
  ['textGradientType',     'textGradientType',     'text'],     // the text gradient's shape (linear, mirrored, radial, sweep)
  ['bgRadialX',            'bgRadialX',            'text', '%'],
  ['bgRadialY',            'bgRadialY',            'text', '%'],
  ['bgRadialR',            'bgRadialR',            'text', '%'],
  ['borderGrain',          'borderGrain',          'text', '%'],
  ['textureClearing',      'textureClearing',      'text', '%'],   // the surface quieted behind the words (canvasRenderer clearedSurface)
  ['borderRounded',        'borderRounded',        'check'],
  ['borderRadius',         'borderRadius',         'text', 'px'],
  ['cardToggle',           'cardToggle',           'check'],
  ['cardColor1',           'cardColor1Hex',        'color'],
  ['cardGradientToggle',   'cardGradientToggle',   'check'],
  ['cardColor2',           'cardColor2Hex',        'color'],
  ['cardGradientType',     'cardGradientType',     'text'],
  ['cardGradientAngle',    'cardGradientAngle',    'text', '°'],
  ['cardOpacity',          'cardOpacity',          'text'],
  ['cardBlend',            'cardBlend',            'text'],
  ['cardLink',             'cardLink',             'check'],
  ['cardOffset',           'cardOffset',           'text', 'px'],
  ['cardThickness',        'cardThickness',        'text', 'px'],
  ['cardRounded',          'cardRounded',          'check'],
  ['cardRadius',           'cardRadius',           'text', 'px'],
  ['cardStitch',           'cardStitch',           'text'],
  ['cardStitchOut',        'cardStitchOut',        'check'],
  ['cardFx',               'cardFx',               'text'],
  ['cardFxAmount',         'cardFxAmount',         'text', ''],
  ['cardFxScale',          'cardFxScale',          'text', ''],
  ['forgeGraph',           'forgeGraph',           'text'],      // the Athanor's graph (Drawflow's JSON)
  ['textureCurve1',        'textureCurve1',        'text', ''],  // the graph's Curve Controls as drawn on the page ('': the graph's own)
  ['textureCurve2',        'textureCurve2',        'text', ''],
  ['baseToggle',           'baseToggle',           'check'],     // Two Surfaces: the lower one drawn (its settings are the look's baseLayer)
  ['borderBlend',          'borderBlend',          'text'],
  ['borderGradientAngle',  'borderGradientAngle',  'text', '°'],
  ['borderStitch',         'borderStitch',         'text'],
  ['borderStitchOut',      'borderStitchOut',      'check'],
  ['borderBloomBlend',     'borderBloomBlend',     'text'],
  ['borderGradientToggle', 'borderGradientToggle', 'check'],
  ['borderColor2',         'borderColor2Hex',      'color'],
  ['borderColor3',         'borderColor3Hex',      'color'],
  ['borderBloom',          'borderBloom',          'text', ''],
  ['vignetteAperture',     'vignetteAperture',     'text', ''],
  ['vignetteCx',           'vignetteCx',           'text', ''],
  ['vignetteCy',           'vignetteCy',           'text', ''],
  ['vignetteNoise',        'vignetteNoise',        'text', ''],
  ['fx1Type',             'fx1Type',             'text'],
  ['fx1Color',            'fx1Color',            'color'],
  ['fx1K1',               'fx1K1',               'text'],
  ['fx1K2',               'fx1K2',               'text'],
  ['fx1Angle',            'fx1Angle',            'text', '°'],
  ['fx2Type',             'fx2Type',             'text'],
  ['fx2Color',            'fx2Color',            'color'],
  ['fx2K1',               'fx2K1',               'text'],
  ['fx2K2',               'fx2K2',               'text'],
  ['fx2Angle',            'fx2Angle',            'text', '°'],
  ['fx3Type',             'fx3Type',             'text'],
  ['fx3Color',            'fx3Color',            'color'],
  ['fx3K1',               'fx3K1',               'text'],
  ['fx3K2',               'fx3K2',               'text'],
  ['fx3Angle',            'fx3Angle',            'text', '°'],
  ['underAll',             'underAll',             'text'],
];

function collectPersisted(){
  const out = {};
  for(const [key, id, kind] of PERSISTED){
    const el = $(id);
    if(!el) continue;
    out[key] = kind === 'check' ? el.checked : el.value;
  }
  return out;
}

function applyPersisted(s){
  for(const [key, id, kind, unit] of PERSISTED){
    if(s[key] === undefined) continue;
    const el = $(id);
    if(!el) continue;
    if(kind === 'check') el.checked = !!s[key];
    else if(kind === 'color'){ if(s[key]) setColorField(id, s[key]); }
    else el.value = s[key];
    if(unit !== undefined){
      const out = $(id + 'Val');
      if(out) out.textContent = s[key] + unit;
    }
  }
}

// a look's FORMAT: 2 since the dial took over Harsh Rain's slant and Silverpoint
// Hatch's angle (their sliders took new jobs); 3 every blend for every surface; 4 Ringworld's day on the light dial and
// Circuit Board's five eras; 5 Ringworld's Stand At slider becoming Traffic; 6 the dial's handle the light (looks lit
// from its far side turned half round); 7 the Black Hole seen from the camera dial.
// Older looks are translated on load
const LOOK_VERSION = 7;
function serializeCurrentSettings(){
  return layersIntoLook({
    lookVersion: LOOK_VERSION,
    bg1: $('bgColor1Hex').value,
    bgGradient: $('bgGradientToggle').checked,
    bg2: $('bgColor2Hex').value,
    bg3: state.page.bgStops>=3 ? $('bgColor3Hex').value : undefined,
    bg4: state.page.bgStops>=4 ? $('bgColor4Hex').value : undefined,
    bgAngle: parseFloat($('bgGradientAngle').value),

    text1: $('textColorHex').value,
    textGradient: $('textGradientToggle').checked,
    text2: $('textColor2Hex').value,
    text3: state.page.textStops>=3 ? $('textColor3Hex').value : undefined,
    text4: state.page.textStops>=4 ? $('textColor4Hex').value : undefined,
    textAngle: parseFloat($('textGradientAngle').value),

    font: FONTS[fontSelect.value].family,
    maxSize: parseFloat($('maxSize').value),
    lineSpacing: parseFloat($('lineSpacing').value),
    textMargin: parseFloat($('textMargin').value),

    accent1: $('accent1Toggle').checked ? $('accent1ColorHex').value : undefined,
    accent2: $('accent2Toggle').checked ? $('accent2ColorHex').value : undefined,


    texture: $('textureToggle').checked,
    // the mechanical controls, from the PERSISTED table above
    ...collectPersisted(),
    // the surface the controls show (layersIntoLook puts the upper here, whichever it is)
    ...surfaceFromDom(),
    spell: $('activeSpell').value,
    highlight: $('highlightToggle') ? $('highlightToggle').checked : true,
    // which controls the user has pinned against Randomize and presets
    locks: Array.from(state.locks),

    border: $('borderToggle').checked,
    borderColor: $('borderColorHex').value,
    borderThickness: parseFloat($('borderThickness').value),
    borderOffset: parseFloat($('borderOffset').value),

    vignette: $('vignetteToggle').checked,
    vignetteBlend: $('vignetteBlend').value,
    vignetteIntensity: parseFloat($('vignetteIntensity').value),

    align: state.page.align,
    valign: state.page.valign,
    aspect: state.page.aspect,
    customSize: $('customSizeToggle').checked,
    customW: $('customW').value,
    customH: $('customH').value,

    username: $('usernameField').value,
    usernameCorner: $('usernameCorner').value,
    lookName: (document.body && document.body.dataset && document.body.dataset.lookName) || '',   // the look's name (a preset's, a spell's): spells, shares and JSON carry it
    spellMark: $('spellMark').checked,   // the spell code in the corner: part of the look, so spells and shared links keep it

    poemText: $('poemText').value,
  });
}

/** A look made with a texture that has since been retired, as its successor.
 *  Zen Garden became Dune Ripples; Foxing and Fold Ghost merged into Old
 *  Paper — their knobs translated so the look stays close to what it was. */
function retireLook(s){ return retireFormat7(retireFormat6(retireFormat5(retireFormat4(retireCamera(retireBaseLayer(retireBlend(retireLookOnce(s)))))))); }
/** THE BLACK HOLE ON THE CAMERA DIAL (format 7; Ruby: any view belongs on the camera dial): it was seen from the light
 *  dial, its turn 315° the disc level, its height how edge-on. A look from before keeps its picture: the dial's turn
 *  past 315° becomes the camera's Turn, its height the camera's View, the lens as it was. */
const blackHoleCamera = (light, tilt) => ({ cameraTurn: String(Math.round((((+(light ?? 315) || 0) - 315) % 360 + 360) % 360)),
  cameraView: String(Math.round(Math.max(0, Math.min(100, tilt === undefined || tilt === '' || isNaN(+tilt) ? 100 : +tilt)))), cameraZoom: '100' });
function retireFormat7Layer(L){ return L && L.textureType === 'blackhole' ? { ...L, ...blackHoleCamera(L.textureLight, L.textureLightTilt), textureLightTilt: 0 } : L; }
function retireFormat7(s){ if(!s || +s.lookVersion >= 7) return s; let o = retireFormat7Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat7Layer(o.baseLayer) }; return o; }
/** THE DIAL'S HANDLE BECAME THE LIGHT (format 6; Ruby: the light dial "goes the opposite direction that I would expect"):
 *  most surfaces had been lit from the handle's other side (textureGenerators LIGHT_TURNED). A look, preset or reading
 *  made before is turned half round on such a surface, the main light and the rim alike, so it keeps its picture and
 *  its handle now stands where its light really is. */
function lightTurned(L){
  if(!L || !L.textureType) return false;
  if(L.textureType === 'athanor'){ const g = String(L.forgeGraph || ''); return !!g && !LIGHT_KEPT_PARTS.some(p => g.includes('"name":"' + p + '"')); }
  return LIGHT_TURNED.has(L.textureType);
}
const halfRound = v => String(((Math.round(+v || 0) + 180) % 360 + 360) % 360);
function retireFormat6Layer(L){
  if(!lightTurned(L)) return L;
  const o = { ...L, textureLight: halfRound(L.textureLight ?? 315) };
  if(L.textureRim !== undefined && L.textureRim !== '') o.textureRim = halfRound(L.textureRim);
  return o;
}
function retireFormat6(s){ if(!s || +s.lookVersion >= 6) return s; let o = retireFormat6Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat6Layer(o.baseLayer) }; return o; }
/** A look from before format 5 (Saturn–Hyperion and earlier): Ringworld's eighth slider was Stand At (where across the
 *  band you stood); it is Traffic now, at its middle (the ships as they were), and the seed says where you stand.
 *  Terrain and Structures keep their values as Landforms and Cities (the same relief, the same works). */
function retireFormat5Layer(L){ return L && L.textureType === 'ringworld' ? { ...L, texP8: '50' } : L; }
function retireFormat5(s){ if(!s || +s.lookVersion >= 5) return s; let o = retireFormat5Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat5Layer(o.baseLayer) }; return o; }
/** A look from before format 4 (Saturn–Titan and earlier): Ringworld's Daylight slider (6) onto the light dial (noon at
 *  its middle, dusk at its rim, midnight past it), the sixth slider becoming Builders, by the seed; Circuit Board's Era
 *  from four eras to five (the one that was Magitech is Atomic now, at 75 where it stood at 100); and the Tilt sliders of
 *  Dune Ripples (4), Moss on Stone (4) and Scrying Pool (6) onto the camera dial's View (Ruby: "anytime we use a tilt …
 *  we should set it for the camera"), the camera unturned at its own lens, so the picture is the one it was. */
const FORMAT4_TILTS = { dunes: [4, 40], moss: [4, 30], water: [6, 35] };
function retireFormat4Layer(L){
  if(!L) return L;
  if(L.textureType === 'circuit' && +L.texP7 > 0) return { ...L, texP7: String(Math.round(+L.texP7*0.75)) };
  const tl = FORMAT4_TILTS[L.textureType];
  if(tl){ const v = L['texP' + tl[0]], t = (v === undefined || v === null || v === '' || isNaN(+v)) ? tl[1] : +v, o = { ...L, cameraTurn: '0', cameraView: String(Math.round(Math.max(0, Math.min(100, t)))), cameraZoom: '100' };
    delete o['texP' + tl[0]]; return o; }
  if(L.textureType !== 'ringworld') return L;
  const d = Math.max(0, Math.min(100, +L.texP6 >= 0 ? +L.texP6 : 80)), reach = d >= 50 ? (100 - d)*2 : 100 + (50 - d)*0.6;
  return { ...L, texP6: '0', textureLight: '90', textureLightTilt: String(Math.round(reach)) };
}
function retireFormat4(s){ if(!s || +s.lookVersion >= 4) return s; let o = retireFormat4Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat4Layer(o.baseLayer) }; return o; }
/** A look from before the camera dial (Saturn–Rhea and earlier): Lichtenberg's camera sliders (Zoom, Turn, View) and
 *  Ringworld's light dial (it was the camera) onto the camera dial; Lichtenberg's sliders as they are now (the strike
 *  where the light dial pointed; Embers as charred wood with a Glow Hue; Slide moved to the last slider). */
function retireCameraLayer(L){
  if(!L || L.cameraTurn !== undefined) return L;
  const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
  if(L.textureType === 'lichtenberg'){
    const m = n(L.texP4, 0), out = { ...L, texP4: String(m >= 75 ? 100 : 0), texP5: String(n(L.textureLight, 315)), texP6: '50', texP7: '100', texP8: String(n(L.texP6, 0)),
      cameraTurn: String(n(L.texP7, 0)), cameraView: String(n(L.texP8, 0)), cameraZoom: String(n(L.texP5, 100)) };
    if(m >= 25 && m < 75 && (!L.textureTint5 || /^#?0{6}/i.test(L.textureTint5))) out.textureTint5 = '#FF6A1A';
    return out;
  }
  if(L.textureType === 'ringworld'){
    const lens = n(L.texP8, 75), zoom = Math.round(100*Math.tan(37.5*Math.PI/180)/Math.tan(lens*Math.PI/360));
    return { ...L, texP8: '0', cameraTurn: String(n(L.textureLight, 40)), cameraView: String(Math.min(100, n(L.textureLightTilt, 55))), cameraZoom: String(zoom) };
  }
  return L;
}
function retireCamera(s){ if(!s) return s; let o = retireCameraLayer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireCameraLayer(o.baseLayer) }; return o; }
/** Before every blend was offered (format 3), a surface's blend menu held only the blends made for it, and
 *  a saved blend it didn't hold fell back to the first of them: so it does here. */
function retireBlend(s){
  if(!s || +s.lookVersion >= 3 || !s.textureType || !s.textureBlend) return s;
  const caps = capsFor(s.textureType);
  return caps && caps.blends && !caps.blends.includes(s.textureBlend) ? { ...s, textureBlend: caps.blends[0] } : s;
}
/** A look saved with the old base layer (its variant, two knobs, opacity and blend; the page's light, the
 *  seed turned, the variant's own hues) as a lower surface that draws the same. */
function retireBaseLayer(s){
  if(!s || s.baseType === undefined || s.baseLayer !== undefined) return s;
  const t = s.baseType, caps = capsFor(t), defs = paramsFor(t);
  const a1 = s.accent1 || ($('accent1ColorHex') || {}).value, a2 = s.accent2 || ($('accent2ColorHex') || {}).value;
  const L = { textureType: t, textureOpacity: s.baseOpacity !== undefined ? +s.baseOpacity : 50, textureBlend: s.baseBlend || 'overlay',
    textureLight: s.textureLight !== undefined ? s.textureLight : '315', textureLightTilt: s.textureLightTilt !== undefined ? s.textureLightTilt : '100',
    textureTint3: '#FFFFFF', textureTint4: '#FFFFFF', textureTint5: hue5Default(t), textureTint6: '#FFFFFF',
    textureSeed: ((parseInt(s.textureSeed, 10) || 0) ^ 0x5bd1e995) >>> 0, textureSeedWords: '', forgeGraph: '' };
  // (a grey surface was made on the ground of its own first blend when the chosen one wasn't made for it)
  if(caps.ground === 'grey' && !caps.blends.includes(L.textureBlend) && blendFamily(L.textureBlend) !== blendFamily(caps.blends[0])) L.textureGround = caps.blends[0];
  defs.forEach((d, i) => { L['texP' + (i + 1)] = String(i === 0 && s.baseP1 !== undefined ? s.baseP1 : i === 1 && s.baseP2 !== undefined ? s.baseP2 : d.def); });
  (caps.tintDefaults || []).forEach((c, i) => { if(SURFACE_HUE_KEYS[i]) L[SURFACE_HUE_KEYS[i]] = c === 'accent1' ? a1 : c === 'accent2' ? a2 : c; });
  const out = { ...s, baseLayer: L };
  for(const k of ['baseType', 'baseP1', 'baseP2', 'baseOpacity', 'baseBlend']) delete out[k];
  return out;
}
function retireLookOnce(s){
  if(!s) return s;
  if(s.textureType === 'whorl') return { ...s, textureType: 'dunes' };
  if(s.textureType === 'crucible') return { ...s, textureType: 'athanor' };   // the node editor's surface, briefly named the Crucible
  if(s.textureType === 'crystalleaf') return { ...s, textureType: 'spangle' };   // same knobs, same metal look
  // Rorschach's hues were Light/Dark (white, black); now they are Ink and Accent
  if(s.textureType === 'inkbleed' && /^#?FFFFFF$/i.test(s.textureTint1 || '') && /^#?000000$/i.test(s.textureTint2 || ''))
    return { ...s, textureTint1: '#141414', textureTint2: '#B0283A' };
  const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));
  // before format 2 the dial did nothing on Harsh Rain and Silverpoint Hatch:
  // their Slant and Hatch Angle sliders become the dial's direction, and the
  // sliders' new jobs start where the old look was (no gusts; the old cross-hatching)
  if(!(+s.lookVersion >= 2)){
    const deg = v => String(Math.round(((v % 360) + 360) % 360));
    if(s.textureType === 'rainstreaks') s = { ...s, textureLight: deg(-n(s.texP2, 0)), textureLightTilt: '100', ...(s.texP2 !== undefined ? { texP2: '0' } : {}) };
    if(s.textureType === 'hatch') s = { ...s, textureLight: deg(n(s.texP1, 35) + 90), textureLightTilt: '100', ...(s.texP1 !== undefined ? { texP1: '38' } : {}) };
    if(s.baseType === 'rainstreaks' && s.baseP2 !== undefined) s = { ...s, baseP2: '0' };
    if(s.baseType === 'hatch' && s.baseP1 !== undefined) s = { ...s, baseP1: '38' };
  }
  if(s.textureType === 'foxing')      // Bloom Size, Spot Count, Cockle → Scale, (no folds), Age, Crinkle
    return { ...s, textureType: 'oldpaper', texP1: n(s.texP1, 100), texP2: 0, texP3: clamp(20 + (n(s.texP2, 100) - 100)*0.08, 10, 60), texP4: clamp(n(s.texP3, 10), 0, 100) };
  if(s.textureType === 'foldghost')   // Crease Depth, Fold Count, Crumple → Scale, Folds, (clean), Crinkle
    return { ...s, textureType: 'oldpaper', texP1: n(s.texP1, 100), texP2: clamp(n(s.texP2, 100)*0.35, 5, 100), texP3: 5, texP4: clamp(n(s.texP3, 30), 0, 100) };
  return s;
}
function restoreSettings(s){
  s = retireLook(s);
  // the layers: the controls take the upper (the look's own keys); the lower waits. If the controls were
  // showing the lower, they show it again at the end (an undo keeps its place)
  const wasEditing = state.layers.editing;
  state.layers.editing = 'upper';
  state.layers.other = s.baseLayer && typeof s.baseLayer === 'object' ? pickLayer(s.baseLayer) : null;
  state.layers.otherLocks = Array.isArray(s.baseLocks) ? s.baseLocks.filter(id => LAYER_LOCK_IDS.has(id)) : [];
  state.layers.otherUi = null;
  // the look's Athanor graph first: a Athanor surface's sliders are named from it
  if(s.forgeGraph !== undefined && $('forgeGraph')){ $('forgeGraph').value = s.forgeGraph; if(typeof applyAthanorGraph === 'function') applyAthanorGraph(false); }
  if(s.bg1) setColorField('bgColor1Hex', s.bg1);
  $('bgGradientToggle').checked = !!s.bgGradient;
  $('bgGradientBlock').classList.toggle('open', !!s.bgGradient);
  if(s.bg2) setColorField('bgColor2Hex', s.bg2);
  if(s.bg3) setColorField('bgColor3Hex', s.bg3);
  if(s.bg4) setColorField('bgColor4Hex', s.bg4);
  state.page.bgStops = s.bg4 ? 4 : (s.bg3 ? 3 : 2);
  syncStopFields(state.page.bgStops, 'bgColor3Field', 'bgColor4Field');
  setActiveRadioValue('bgStopsGroup', state.page.bgStops);
  if(s.bgAngle!==undefined){ $('bgGradientAngle').value=s.bgAngle; $('bgGradientAngleVal').textContent=s.bgAngle+'°'; }

  if(s.text1) setColorField('textColorHex', s.text1);
  $('textGradientToggle').checked = !!s.textGradient;
  $('gradientBlock').classList.toggle('open', !!s.textGradient);
  if(s.text2) setColorField('textColor2Hex', s.text2);
  if(s.text3) setColorField('textColor3Hex', s.text3);
  if(s.text4) setColorField('textColor4Hex', s.text4);
  state.page.textStops = s.text4 ? 4 : (s.text3 ? 3 : 2);
  syncStopFields(state.page.textStops, 'textColor3Field', 'textColor4Field');
  setActiveRadioValue('textStopsGroup', state.page.textStops);
  if(s.textAngle!==undefined){ $('textGradientAngle').value=s.textAngle; $('textGradientAngleVal').textContent=s.textAngle+'°'; }

  if(s.font){ const idx = FONTS.findIndex(f=>f.family===s.font); if(idx>=0) fontSelect.value = idx; }
  if(s.maxSize!==undefined) $('maxSize').value = s.maxSize;
  if(s.textMargin!==undefined){ $('textMargin').value = s.textMargin; $('textMarginVal').textContent = s.textMargin + '%'; }
  if(s.lineSpacing!==undefined){ $('lineSpacing').value=s.lineSpacing; $('lineSpacingVal').textContent = Math.pow(2, s.lineSpacing).toFixed(2)+'x'; }

  $('accent1Toggle').checked = !!s.accent1;
  $('accent1Block').classList.toggle('open', !!s.accent1);
  if(s.accent1) setColorField('accent1ColorHex', s.accent1);
  $('accent2Toggle').checked = !!s.accent2;
  $('accent2Block').classList.toggle('open', !!s.accent2);
  if(s.accent2) setColorField('accent2ColorHex', s.accent2);

  // a look saved before the effect stack: translate its outline/shadow and
  // typeface effect into the slots (the slots themselves restore via PERSISTED)
  if(s.fx1Type === undefined && (s.outlineMode !== undefined || s.typeEffect !== undefined)) applyLegacyEffects(s);

  $('textureToggle').checked = !!s.texture;
  $('textureBlock').classList.toggle('open', !!s.texture);
  if(s.textureType) $('textureType').value = s.textureType;
  // relabel/re-range for the incoming texture BEFORE restoring the knob
  // values, or they would be clamped against the previous texture's range
  syncTextureParams(true);
  syncTextureTools(true);
  // the mechanical controls, from the PERSISTED table (a look saved before the
  // box had its own shape takes the border's: linked)
  applyPersisted(s.cardLink === undefined ? { ...s, cardLink: true } : s);
  if(typeof refreshReadouts === 'function'){ refreshReadouts(); syncFrameVisibility(); }
  syncBaseUi();
  if(s.spell !== undefined) $('activeSpell').value = s.spell;
  if(s.highlight !== undefined && $('highlightToggle')){
    $('highlightToggle').checked = !!s.highlight;
    if(document.body && document.body.classList) document.body.classList.toggle('plain-editor', !s.highlight);
  }
  if(Array.isArray(s.locks)) restoreLockState(s.locks);
  restoreSurfaceDetails(s);


  $('borderToggle').checked = !!s.border;
  $('borderBlock').classList.toggle('open', !!s.border);
  if(s.borderColor) setColorField('borderColorHex', s.borderColor);
  if(s.borderThickness!==undefined) $('borderThickness').value = s.borderThickness;
  if(s.borderOffset!==undefined) $('borderOffset').value = s.borderOffset;
  if(s.cardLink === undefined) syncLinkedBox();   // (a linked look saved its mirrored values already)

  $('vignetteToggle').checked = !!s.vignette;
  $('vignetteBlock').classList.toggle('open', !!s.vignette);
  if(s.vignetteBlend) $('vignetteBlend').value = s.vignetteBlend;
  if(s.vignetteIntensity!==undefined){ $('vignetteIntensity').value=s.vignetteIntensity; $('vignetteIntensityVal').textContent=s.vignetteIntensity+'%'; }

  if(s.align){ state.page.align=s.align; setActiveRadioValue('alignGroup', s.align); }
  if(s.valign){ state.page.valign=s.valign; setActiveRadioValue('valignGroup', s.valign); }
  restoreShape(s);

  if(s.username!==undefined) $('usernameField').value = s.username;
  if(s.usernameCorner) $('usernameCorner').value = s.usernameCorner;
  if(typeof s.lookName === 'string' && document.body && document.body.dataset) document.body.dataset.lookName = s.lookName.slice(0, 80);
  if(s.spellMark !== undefined) $('spellMark').checked = !!s.spellMark;
  if(s.poemText!==undefined){ $('poemText').value = s.poemText; repaintEditor(); }

  if(wasEditing === 'lower' && lowerOn()) editLayer('lower');
  scheduleRender();
  paintMoons();
  paintSeedMoon();
  refreshUi();
}
/** One surface layer into the controls (the keys a look saves the upper with): its graph and kind first,
 *  so its sliders are named and ranged before their values. */
function restoreSurfaceLayer(L){
  if($('forgeGraph')){ $('forgeGraph').value = L.forgeGraph || ''; if(typeof applyAthanorGraph === 'function') applyAthanorGraph(false); }
  if(L.textureType) $('textureType').value = L.textureType;
  syncTextureParams(true);
  syncTextureTools(true);
  restoreSurfaceDetails(L);
}
/** A surface's blend, light, hues, knobs, opacity and seed into the controls. */
function restoreSurfaceDetails(s){
  if(s.textureBlend) $('textureBlend').value = s.textureBlend;
  // the surface and the words (a look from before them: aware, as every surface was; neither blended into the letters)
  { const set = (id, v) => { if($(id)) $(id).checked = v; };
    set('textureTextAware', s.textureTextAware !== false); set('textureTextBlend', !!s.textureTextBlend); set('textureShapeAware', !!s.textureShapeAware); set('textureTextCut', !!s.textureTextCut);
    // (how strongly: a look from before the slider, fully)
    if($('textureShapeStrength')){ $('textureShapeStrength').value = s.textureShapeStrength ?? 100; if($('textureShapeStrengthVal')) $('textureShapeStrengthVal').textContent = $('textureShapeStrength').value + '%'; }
    paintLayerWords(); }
  keepGround(s.textureGround);
  if(s.textureLight !== undefined || s.textureLightTilt !== undefined){
    if(s.textureLight !== undefined) $('textureLight').value = s.textureLight;
    // looks saved before the dial had raking light only: 100
    if($('textureLightTilt')) $('textureLightTilt').value = s.textureLightTilt !== undefined ? s.textureLightTilt : '100';
    syncLightPad(); }
  // THE PAGE'S LIGHTS: the rim light (off, unless the look has one), the Ambient slider (the surface's own), their hues
  { putRim(s.textureRim !== undefined ? s.textureRim : RIM_DEFAULT.deg, s.textureRimTilt !== undefined ? s.textureRimTilt : RIM_DEFAULT.tilt);
    if($('textureAmbient')) $('textureAmbient').value = s.textureAmbient !== undefined ? String(s.textureAmbient) : '100';
    setColorField('textureTint7Hex', s.textureTint7 || RIM_DEFAULT.hex + '00'); setColorField('textureTint8Hex', s.textureTint8 || '#FFFFFF');
    syncLightPad(); }
  // the camera: the look's own, or where its surface's camera starts
  { const d = cameraStart(s.textureType || $('textureType').value);
    putCamera(s.cameraTurn !== undefined ? s.cameraTurn : d.turn, s.cameraView !== undefined ? s.cameraView : d.view, s.cameraZoom !== undefined ? s.cameraZoom : d.zoom); }
  if(s.textureTint1) setColorField('textureTint1Hex', s.textureTint1);
  if(s.textureTint2) setColorField('textureTint2Hex', s.textureTint2);
  if(s.textureTint9) setColorField('textureTint9Hex', s.textureTint9);
  if(s.textureTint10) setColorField('textureTint10Hex', s.textureTint10);
  if(s.textureTint11) setColorField('textureTint11Hex', s.textureTint11);
  if(s.textureTint12) setColorField('textureTint12Hex', s.textureTint12);
  // material hues: white (none) unless the look carries them
  setColorField('textureTint3Hex', s.textureTint3 || '#FFFFFF');
  setColorField('textureTint4Hex', s.textureTint4 || '#FFFFFF');
  // the fifth hue: its role's "none" unless the look carries one
  setColorField('textureTint5Hex', s.textureTint5 || hue5Default(s.textureType || $('textureType').value));
  setColorField('textureTint6Hex', s.textureTint6 || '#FFFFFF');
  if(s.texP1 !== undefined) $('texP1').value = s.texP1;
  if(s.texP2 !== undefined) $('texP2').value = s.texP2;
  if(s.texP3 !== undefined) $('texP3').value = s.texP3;
  if(s.texP4 !== undefined) $('texP4').value = s.texP4;
  if(s.texP5 !== undefined) $('texP5').value = s.texP5;
  if(s.texP6 !== undefined) $('texP6').value = s.texP6;
  if(s.texP7 !== undefined) $('texP7').value = s.texP7;
  if(s.texP8 !== undefined) $('texP8').value = s.texP8;
  for(const k of [1, 2]) if($('textureCurve' + k)) $('textureCurve' + k).value = s['textureCurve' + k] || '';
  syncTextureParams(false);
  if(s.textureOpacity!==undefined){ $('textureOpacity').value=s.textureOpacity; paintMoons(); }
  if(s.textureSeed!==undefined) $('textureSeedValue').value = s.textureSeed;
  // the words go back only if they are still this seed's (else its phrase is shown)
  { const box = $('textureSeedWords'), n = parseInt($('textureSeedValue').value, 10) || 0;
    if(box){ if(typeof s.textureSeedWords === 'string' && s.textureSeedWords && seedFromText(s.textureSeedWords) === n){ box.value = s.textureSeedWords; if(box.dataset) box.dataset.seed = String(n); }
      else syncSeedWords(true); } }
}

$('advancedRefreshBtn').addEventListener('click', ()=>{
  $('advancedJson').value = JSON.stringify(serializeCurrentSettings(), null, 2);
});
$('advancedCopyBtn').addEventListener('click', async ()=>{
  const btn = $('advancedCopyBtn');
  const original = btn.textContent;
  try{
    await navigator.clipboard.writeText($('advancedJson').value);
    btn.textContent = '✓ Copied';
  } catch(e){
    // clipboard API can be blocked in some contexts — fall back to manual select
    $('advancedJson').select();
    btn.textContent = 'Select-and-copy';
  }
  setTimeout(()=>{ btn.textContent = original; }, 1400);
});
$('advancedLoadBtn').addEventListener('click', ()=>{
  let obj;
  try { obj = JSON.parse($('advancedJson').value); }
  catch(e){ hardNo('That isn’t readable JSON', 'Check for a stray comma or a missing bracket. Nothing was changed.'); return; }
  safeRestore(obj, 'This JSON');
});
// populate once on load so there's something to see/copy immediately
$('advancedJson').value = JSON.stringify(serializeCurrentSettings(), null, 2);

// ---------- presets ----------
const presetGrid = $('presetGrid');

// Preset tiles paint when they come into view (Rituals may never be opened),
// one per animation frame so even opening it never freezes the page. Where
// visibility can't be observed, they paint at once, as before.
const tileQueue = [];
let tileFrame = 0;
function drainTiles(){
  tileFrame = 0;
  const job = tileQueue.shift(); if(job) job();
  if(tileQueue.length) tileFrame = requestAnimationFrame(drainTiles);
}
const tileWatch = (typeof IntersectionObserver === 'function' && typeof requestAnimationFrame === 'function')
  ? new IntersectionObserver(entries => {
      for(const en of entries) if(en.isIntersecting){ tileWatch.unobserve(en.target); const job = en.target._paint; en.target._paint = null; if(job) tileQueue.push(job); }
      if(tileQueue.length && !tileFrame) tileFrame = requestAnimationFrame(drainTiles);
    }, { rootMargin: '200px' })
  : null;
function paintWhenSeen(canvasEl, paint){
  if(!tileWatch){ paint(); return; }
  canvasEl._paint = paint; tileWatch.observe(canvasEl);
}

/** One tile: painted snapshot above its name. */
function presetTile(p, onPick, extraClass){
  const btn = document.createElement('div');
  btn.className = 'preset-btn' + (extraClass ? ' ' + extraClass : '');
  if(btn.dataset) btn.dataset.name = p.name || '';
  // (a tile a keyboard reaches and Enter or Space chooses)
  if(btn.setAttribute){ btn.setAttribute('role', 'button'); btn.tabIndex = 0; }
  if(btn.addEventListener) btn.addEventListener('keydown', e => { if((e.key === 'Enter' || e.key === ' ') && e.target === btn){ e.preventDefault(); btn.click(); } });
  const swatch = document.createElement('canvas');
  swatch.className = 'preset-swatch';
  paintWhenSeen(swatch, () => paintPresetSwatch(swatch, p, SWATCH.width, SWATCH.height));
  const label = document.createElement('span');
  label.className = 'preset-label';
  label.textContent = p.name;
  btn.appendChild(swatch);
  btn.appendChild(label);
  if(onPick) btn.addEventListener('click', onPick);
  return btn;
}

// THE GRID'S GROUPS FOLD, and a search finds a look by its name, its group, its surface or its surface's
// readings. Folded groups are remembered in this browser (an app preference, never part of a look).
const PRESET_FOLD_KEY = 'uv.presets.folded';
const presetFolded = () => { try { return new Set(JSON.parse(localStorage.getItem(PRESET_FOLD_KEY) || '[]')); } catch(e){ return new Set(); } };
function groupTile(tile, group){ if(tile.dataset) tile.dataset.group = group; return tile; }
function groupHead(g){
  const hd = document.createElement('button'); hd.type = 'button'; hd.className = 'preset-group-head';
  if(hd.dataset) hd.dataset.group = g.name;
  for(const [cls, text] of [['pg-glyph', g.glyph || ''], ['pg-name', g.name], ['pg-count', String((g.presets || []).length)]]){
    const sp = document.createElement('span'); sp.className = cls; sp.textContent = text; hd.appendChild(sp); }
  const open = !presetFolded().has(g.name); hd.setAttribute('aria-expanded', String(open));
  if(hd.addEventListener) hd.addEventListener('click', () => {
    if(presetSearchText()) return;                      // while searching, the search decides what shows
    const s = presetFolded(), nowOpen = s.has(g.name); if(nowOpen) s.delete(g.name); else s.add(g.name);
    try { localStorage.setItem(PRESET_FOLD_KEY, JSON.stringify([...s])); } catch(e){}
    filterPresets();
  });
  return hd;
}
const presetSearchText = () => { const f = $('presetSearch'); return f && f.value ? String(f.value).trim() : ''; };
function presetWords(p){
  const t = p.textureType, o = t && $('textureType') && Array.from($('textureType').options || []).find(o => o.value === t);
  const E = t && TEXTURE_ELEMENTS[t]; const readings = E ? Object.values(E).map(r => r && r.name || '').join(' ') : '';
  return [p.name, o ? o.textContent : '', readings, p.font || ''].join(' ');
}
function filterPresets(){
  if(!presetGrid || !presetGrid.querySelectorAll) return;
  const q = presetSearchText(), shut = presetFolded(), byName = new Map(PRESETS.map(p => [p.name, p]));
  const shown = new Map();
  presetGrid.querySelectorAll('.preset-btn').forEach(b => {
    const g = b.dataset.group || '', p = byName.get(b.dataset.name);
    const hit = !q || chMatches(q, { text: b.dataset.name || '', value: '' }, g, p ? presetWords(p) : '');
    b.hidden = q ? !hit : shut.has(g);
    if(hit) shown.set(g, (shown.get(g) || 0) + 1);
  });
  presetGrid.querySelectorAll('.preset-group-head').forEach(h => {
    const g = h.dataset.group, n = shown.get(g) || 0, total = PRESET_GROUPS.find(x => x.name === g)?.presets.length || 0;
    h.hidden = !!q && !n;
    h.setAttribute('aria-expanded', String(q ? true : !shut.has(g)));
    const c = h.querySelector('.pg-count'); if(c) c.textContent = q ? n + ' / ' + total : total;
  });
  const none = $('presetNone'); if(none) none.hidden = !q || shown.size > 0;
}
if($('presetSearch') && $('presetSearch').addEventListener) $('presetSearch').addEventListener('input', filterPresets);

// the built-in looks, each group under its own heading (Simple first), alphabetical within it (Ruby)
// (groups by what a person is looking for — PRESET_GROUPS names each one's presets; any left out come last)
{ const byName = (a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' });
  const placed = new Set();
  for(const g of (PRESET_GROUPS || [])){
    if(g.name && typeof document.createElement === 'function') presetGrid.appendChild(groupHead(g));
    PRESETS.filter(p => (g.presets || []).includes(p.name) && !placed.has(p)).sort(byName).forEach(p => { placed.add(p); presetGrid.appendChild(groupTile(presetTile(p, ()=>pickPreset(p)), g.name)); });
  }
  PRESETS.filter(p => !placed.has(p)).sort(byName).forEach(p => presetGrid.appendChild(groupTile(presetTile(p, ()=>pickPreset(p)), '')));
  try { filterPresets(); } catch(e){}
}

// (hover previews on desktop were retired, Ruby: some surfaces took seconds to try on. A tile is applied by a click.)
// a click applies the preset, as one step of history.
// Every click is a NEW SEED (Ruby); clicking the look that is still lit (nothing
// meaningful changed since) keeps it and only rerolls — and now and then takes
// another of its surface's readings (🜂 🜄 🜁 🜃)
async function pickPreset(p){
  const again = litPreset.name === p.name && !litPresetChanged();
  if(!again && needsGuard() && !await guardWork('Apply this preset', `“${p.name}”`)) return;
  markFresh();
  if(again){ maybeRerollSeed(); if(Math.random() < 0.45) swapReading(); scheduleRender(); commitSoon(); }
  else applyPreset(p);
  lightPreset(p.name);
  murmur.play('preset');
}
// ---- THE LIT LOOK (Ruby): a preset or spell stays lit after it is applied,
// until a MEANINGFUL change (anything but the seed and the look's name) ----
// (the look settles over a moment — textures, tints that follow accents — so its
// signature is taken at the first history step after it lands: that step IS the look)
const litPreset = { name: null, sig: null };
function meaningfulSig(){ try { const o = JSON.parse(lookSnapshot()); delete o.textureSeedValue; delete o.lookName; return JSON.stringify(o); } catch(e){ return ''; } }
function litPresetChanged(){ return !!litPreset.name && litPreset.sig != null && meaningfulSig() !== litPreset.sig; }
function paintLitPreset(){ for(const g of [presetGrid, $('customPresetGrid')]) if(g && g.querySelectorAll) g.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('lit', !!litPreset.name && !!b.dataset && b.dataset.name === litPreset.name)); }
function lightPreset(name){ litPreset.name = name || null; litPreset.sig = null; paintLitPreset(); }
function checkLitPreset(){
  if(!litPreset.name) return;
  if(litPreset.sig == null){ litPreset.sig = meaningfulSig(); return; }
  if(litPresetChanged()){ litPreset.name = null; litPreset.sig = null; paintLitPreset(); }
}
/** Another of the surface's readings, not the one showing (a click on a lit look, now and then). */
function swapReading(){
  const list = elementsFor($('textureType').value).filter(e => e.el !== state.ui.element);
  if(!list.length) return;
  applyElement(list[Math.floor(Math.random()*list.length)].el);
}

// THE PRESET LEVEL'S ACTIONS (ROADMAP H1), above the presets: more of the look on the page without opening a section.
// SUMMON VARIATION grows the same look again (what a click on a lit preset does): a new seed, now and then another
// reading; a frozen seed leaves only the reading to change. MUTATE GENTLY rolls every die at once, gently (menus,
// switches and locks stay). FREEZE THIS SEED is the seed's padlock, as an action.
function summonVariation(){
  const lit = litPreset.name && !litPresetChanged() ? litPreset.name : null, frozen = state.locks.has('textureSeedValue');
  if(!$('textureToggle').checked){ toast(PRESET_ACTS.noSurface); murmur.play('blocked'); return; }
  const before = state.ui.element;
  if(frozen || Math.random() < 0.45) swapReading();
  if(frozen){ if(state.ui.element === before){ toast(PRESET_ACTS.frozenStill); murmur.play('blocked'); return; } toast(PRESET_ACTS.frozenReading); }
  else maybeRerollSeed();
  scheduleRender(); commitSoon(); murmur.play('reroll');
  if(lit) lightPreset(lit);                    // (still the look it was: it stays lit)
}
function mutateGently(){
  if(typeof document.querySelectorAll !== 'function') return;
  for(const card of document.querySelectorAll('details.card[data-tab]:not([data-tab="more"])')) if(lockablesIn(card).length) rollSection(card, 'gentle');
  refreshUi(); scheduleRender(); commitSoon(); murmur.play('reroll');
}
function freezeSeed(){
  const b = lockButtons.get('textureSeedValue');
  if(b) b.click(); else { state.locks.has('textureSeedValue') ? state.locks.delete('textureSeedValue') : state.locks.add('textureSeedValue'); paintMasterLocks(); }
  toast(state.locks.has('textureSeedValue') ? PRESET_ACTS.frozen : PRESET_ACTS.thawed);
}
// (its label says which it is: frozen, it reads as the way to thaw — the usability review)
function paintFreeze(){ const b = $('freezeSeedBtn'), on = state.locks.has('textureSeedValue'); if(!b || !b.setAttribute) return;
  b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? PRESET_ACTS.thawLabel : PRESET_ACTS.freezeLabel; }
for(const [id, act] of [['summonVariationBtn', summonVariation], ['mutateGentlyBtn', mutateGently], ['freezeSeedBtn', freezeSeed]])
  if($(id) && $(id).addEventListener) $(id).addEventListener('click', () => act());

// CUSTOM PRESETS (Ruby): the saved spells, in a card of their own under the built-in
// ones, alphabetical, in as many rows as they need (never a sideways scroller) — a
// library that can grow until the built-in ones aren't needed. Rebuilt whenever the
// saved set changes.
const customGrid = $('customPresetGrid');

function renderSavedPresets(saved){
  if(!customGrid) return;
  customGrid.innerHTML = '';
  const empty = $('customPresetsEmpty');
  if(empty) empty.style.display = (saved && saved.length) ? 'none' : '';
  // the last tile saves the look on the page as a new custom preset (Ruby: "omg yes")
  const addSave = () => { if(typeof document.createElement !== 'function') return;
    const t = document.createElement('div'); t.className = 'preset-btn preset-save'; t.setAttribute('role', 'button'); t.tabIndex = 0;
    t.title = 'Save the look on the page as a preset of your own';
    t.innerHTML = '<span class="preset-save-plus" aria-hidden="true">＋</span><span class="preset-label">Save this look</span>';
    const go = () => { if(typeof vault !== 'undefined' && vault.create) vault.create(); };
    t.addEventListener('click', go); t.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    customGrid.appendChild(t); };
  if(!saved || !saved.length){ addSave(); return; }

  for(const rec of saved){
    const shot = Object.assign({ name: rec.name }, rec.settings, { spell: rec.spell });
    customGrid.appendChild(presetTile(shot, ()=>{
      // a spell is YOUR look: the first click puts it back exactly, seed and all;
      // a click while it is still lit rerolls the seed (and now and then the reading)
      if(litPreset.name === rec.name && !litPresetChanged()){ maybeRerollSeed(); if(Math.random() < 0.45) swapReading(); scheduleRender(); commitSoon(); lightPreset(rec.name); return; }
      // the same filter as applying from Esoterica — a spell is a look
      safeRestore(stripToLook(Object.assign({}, rec.settings, { spell: rec.spell })), 'This spell');
      if(document.body && document.body.dataset) document.body.dataset.lookName = rec.name || '';
      scheduleRender(); lightPreset(rec.name);
    }, 'preset-custom'));
  }
  addSave();
  paintLitPreset();
}

function applyThemePalette(colors){
  state.ui.palette = colors;
  safeColoris({ swatches: pickerSwatches(colors[0]) });
}

// the opening palette comes from the default preset named in tunables.js
const defaultPalettePreset = PRESETS.find(p=>p.name===DEFAULTS.preset) || PRESETS[0];
applyThemePalette(deriveThemePalette(defaultPalettePreset));

// Closing the picker also dismisses the phone keyboard. Coloris fires 'close'
// on the field it was editing; if its hex input still holds focus, the
// keyboard would otherwise stay up over the page.
document.addEventListener('close', (e)=>{
  const t = e.target;
  if(!t || !t.matches || !t.matches('[data-coloris]')) return;
  const active = document.activeElement;
  if(active && active.blur && (active.id === 'clr-color-value' || active === t)) active.blur();
});

const rafOr = f => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 0));
function pickerPointer(){
  let el = document.getElementById && document.getElementById('clrPointer');
  if(!el && document.createElement && document.body && document.body.appendChild){
    el = document.createElement('div');
    el.id = 'clrPointer';
    if(el.setAttribute) el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}
function markPicking(field, on){
  if(!field || !field.classList) return;
  field.classList.toggle('is-picking', on);
  const wrap = field.closest && field.closest('.clr-field');
  if(wrap && wrap.classList) wrap.classList.toggle('is-picking', on);
}
function aimPointer(){
  const picker = document.getElementById && document.getElementById('clr-picker');
  const ptr = pickerPointer();
  if(!ptr) return;
  if(!picker || !state.ui.pickingField || !picker.getBoundingClientRect || !state.ui.pickingField.getBoundingClientRect){ ptr.hidden = true; return; }
  const f = state.ui.pickingField.getBoundingClientRect(), p = picker.getBoundingClientRect();
  const up = f.bottom <= p.top + 2, down = f.top >= p.bottom - 2;
  if(!p.width || (!up && !down)){ ptr.hidden = true; return; }       // beside it: nothing to point at
  const x = Math.max(p.left + 16, Math.min(p.right - 16, f.left + Math.min(f.width, 140) / 2));
  ptr.dataset.dir = up ? 'up' : 'down';
  ptr.style.left = x + 'px';
  ptr.style.top = (up ? p.top : p.bottom) + 'px';
  ptr.hidden = false;
}
document.addEventListener('open', (e)=>{
  const t = e.target;
  if(!t || !t.matches || !t.matches('[data-coloris]')) return;
  if(state.ui.pickingField) markPicking(state.ui.pickingField, false);
  state.ui.pickingField = t;
  markPicking(t, true);
  rafOr(()=>{
    const picker = document.getElementById && document.getElementById('clr-picker');
    if(!picker || !picker.getBoundingClientRect || !t.getBoundingClientRect) return;
    const f = t.getBoundingClientRect(), p = picker.getBoundingClientRect();
    const scroller = document.querySelector && document.querySelector('.controls');
    const mobile = document.body && document.body.classList && document.body.classList.contains('is-mobile');
    if(mobile && scroller && scroller.scrollBy && f.bottom > p.top - 12){
      scroller.scrollBy({ top: f.bottom - p.top + 28, behavior: 'smooth' });
      setTimeout(aimPointer, 360);                     // after the scroll settles
    } else aimPointer();
  });
});
document.addEventListener('close', (e)=>{
  const t = e.target;
  if(!t || !t.matches || !t.matches('[data-coloris]')) return;
  markPicking(t, false);
  if(state.ui.pickingField === t) state.ui.pickingField = null;
  const ptr = pickerPointer(); if(ptr) ptr.hidden = true;
});
// keep the tail on target while things move under it
if(typeof window !== 'undefined' && window.addEventListener){
  window.addEventListener('resize', ()=>{ if(state.ui.pickingField) aimPointer(); });
}
document.addEventListener('scroll', ()=>{ if(state.ui.pickingField) aimPointer(); }, true);

// The swatches: EIGHTEEN, three even rows of six. First the field's own
// colour as the picker opens (ringed: tap it to get back to what you had),
// then the theme's fifteen, then white and black. (On phones the picker's
// position is set by CSS: docked above the keyboard at the bottom right.)
function pickerSwatches(original){
  return [original || '#808080', ...state.ui.palette.slice(0, 15), '#FFFFFF', '#000000'];
}
document.addEventListener('open', (e)=>{
  if(e.target && e.target.matches && e.target.matches('[data-coloris]')){
    safeColoris({ swatches: pickerSwatches(e.target.value) });
  }
});

function applyPreset(p){
  // a FULL preset is a whole saved look (as a spell is saved), applied exactly
  if(p.full) return applyFullPreset(p);
  // a preset dresses the upper surface: the controls show it first, and the lower goes (unless something
  // of it is locked: then it waits, switched off, for its switch)
  if(state.layers.editing === 'lower') editLayer('upper');
  if(!state.locks.has('baseToggle') && !(state.layers.otherLocks || []).length){ state.layers.other = null; state.layers.otherLocks = []; state.layers.otherUi = null; }
  // a locked control is put back exactly as it was once the preset lands
  const __locks = snapshotLocked();
  try {
  applyThemePalette(deriveThemePalette(p));
  maybeRerollSeed();                 // every application a new seed (Ruby): a ritual is cast fresh each time
  setColorField('bgColor1Hex', p.bg1);
  $('bgGradientToggle').checked = !!p.bgGradient;
  $('bgGradientBlock').classList.toggle('open', !!p.bgGradient);
  if(p.bg2) setColorField('bgColor2Hex', p.bg2);
  if(p.bg3) setColorField('bgColor3Hex', p.bg3);
  if(p.bg4) setColorField('bgColor4Hex', p.bg4);
  state.page.bgStops = p.bg4 ? 4 : (p.bg3 ? 3 : 2);
  syncStopFields(state.page.bgStops, 'bgColor3Field', 'bgColor4Field');
  setActiveRadioValue('bgStopsGroup', state.page.bgStops);
  if(p.bgAngle!==undefined){ $('bgGradientAngle').value=p.bgAngle; $('bgGradientAngleVal').textContent=p.bgAngle+'°'; }

  setColorField('textColorHex', p.text1);
  $('textGradientToggle').checked = !!p.textGradient;
  $('gradientBlock').classList.toggle('open', !!p.textGradient);
  if(p.text2) setColorField('textColor2Hex', p.text2);
  if(p.text3) setColorField('textColor3Hex', p.text3);
  if(p.text4) setColorField('textColor4Hex', p.text4);
  state.page.textStops = p.text4 ? 4 : (p.text3 ? 3 : 2);
  syncStopFields(state.page.textStops, 'textColor3Field', 'textColor4Field');
  setActiveRadioValue('textStopsGroup', state.page.textStops);
  if(p.textAngle!==undefined){ $('textGradientAngle').value=p.textAngle; $('textGradientAngleVal').textContent=p.textAngle+'°'; }

  // effects: a preset's own slots, or its older outline/typeface fields translated
  if(p.fx1Type !== undefined) applyPersisted(Object.fromEntries(Object.keys(EFFECT_SLOT_DEFAULTS).map(k => [k, p[k] !== undefined ? p[k] : EFFECT_SLOT_DEFAULTS[k]])));
  else applyLegacyEffects(p);
  syncAllFxSlots();
  // the light's height: a preset's own, or raking (the only light presets knew)
  if($('textureLightTilt')){ $('textureLightTilt').value = p.textureLightTilt !== undefined ? p.textureLightTilt : '100'; syncLightPad(); }
  // and its direction: a preset's own, or where its texture's dial starts (Harsh Rain: straight down)
  // (a preset's own light, from before the handle became the light, turned half round where its surface's light turned)
  { const ld = p.textureLight !== undefined ? (lightTurned(p) ? halfRound(p.textureLight) : p.textureLight) : (capsFor(p.textureType || $('textureType').value) || {}).lightDeg;
    if(ld != null){ $('textureLight').value = String(ld); syncLightPad(); } }
  // and its camera: the preset's own, or where its texture's camera starts
  // (a Black Hole preset from before format 7 says its view with the light dial: onto the camera, as its looks are)
  { const d = cameraStart(p.textureType || $('textureType').value), bh = p.textureType === 'blackhole' && p.cameraTurn === undefined && p.textureLight !== undefined ? blackHoleCamera(p.textureLight, p.textureLightTilt) : {};
    putCamera(p.cameraTurn ?? bh.cameraTurn ?? d.turn, p.cameraView ?? bh.cameraView ?? d.view, p.cameraZoom ?? bh.cameraZoom ?? d.zoom);
    // (…and now the light dial places the hole: such a preset's hole stands at the page's middle)
    if(bh.cameraTurn !== undefined && $('textureLightTilt')){ $('textureLightTilt').value = '0'; syncLightPad(); } }

  if(p.font){
    const idx = FONTS.findIndex(f=>f.family===p.font);
    if(idx>=0) fontSelect.value = idx;
  }

  $('textureToggle').checked = !!p.texture;
  $('textureBlock').classList.toggle('open', !!p.texture);
  // the preset's own spell travels with it
  $('activeSpell').value = p.spell || '';
  $('borderGradientToggle').checked = !!p.borderGradient;
  if(p.borderColor2) setColorField('borderColor2Hex', p.borderColor2);
  if(p.borderColor3) setColorField('borderColor3Hex', p.borderColor3);
  $('borderBloom').value = p.borderBloom != null ? p.borderBloom : 0;
  if($('borderBloomVal')) $('borderBloomVal').textContent = $('borderBloom').value;
  if(p.textureType) $('textureType').value = p.textureType;
  // re-range for the new texture first, then apply the preset's own knobs;
  // a preset that names none simply gets that texture's defaults
  syncTextureParams(true);
  if(p.texP1 !== undefined) $('texP1').value = p.texP1;
  if(p.texP2 !== undefined) $('texP2').value = p.texP2;
  if(p.texP3 !== undefined) $('texP3').value = p.texP3;
  if(p.texP4 !== undefined) $('texP4').value = p.texP4;
  if(p.texP5 !== undefined) $('texP5').value = p.texP5;
  if(p.texP6 !== undefined) $('texP6').value = p.texP6;
  if(p.texP7 !== undefined) $('texP7').value = p.texP7;
  if(p.texP8 !== undefined) $('texP8').value = p.texP8;
  syncTextureParams(false);
  if(p.textureOpacity!==undefined){ $('textureOpacity').value=p.textureOpacity; paintMoons(); }

  if(p.accent1){ $('accent1Toggle').checked=true; $('accent1Block').classList.add('open'); setColorField('accent1ColorHex', p.accent1); }
  else { $('accent1Toggle').checked=false; $('accent1Block').classList.remove('open'); }
  if(p.accent2){ $('accent2Toggle').checked=true; $('accent2Block').classList.add('open'); setColorField('accent2ColorHex', p.accent2); }
  else { $('accent2Toggle').checked=false; $('accent2Block').classList.remove('open'); }

  $('borderToggle').checked = !!p.border;
  $('borderBlock').classList.toggle('open', !!p.border);
  if(p.borderColor) setColorField('borderColorHex', p.borderColor);
  if(p.borderThickness!==undefined) $('borderThickness').value = p.borderThickness;
  if(p.borderOffset!==undefined) $('borderOffset').value = p.borderOffset;

  $('vignetteToggle').checked = !!p.vignette;
  $('vignetteBlock').classList.toggle('open', !!p.vignette);
  if(p.vignetteBlend) $('vignetteBlend').value = p.vignetteBlend;
  if(p.vignetteIntensity!==undefined){ $('vignetteIntensity').value=p.vignetteIntensity; $('vignetteIntensityVal').textContent=p.vignetteIntensity+'%'; }

  scheduleRender();
  } finally {
    // Sync FIRST, restore locks LAST: syncTextureTools rebuilds the blend
    // select and re-clamps the texture params, overwriting anything restored
    // before it runs.
    //
    // true = start from the new texture's own defaults, so one preset's blend
    // and tints never leak into the next; then take whatever this preset
    // specifies on top.
    syncTextureTools(true);
    if(document.body && document.body.dataset) document.body.dataset.lookName = p.name || '';
    // the frame and box: defaults, then whatever this preset specifies
    applyPersisted({ ...FRAME_DEFAULTS, ...Object.fromEntries(Object.keys(FRAME_DEFAULTS).filter(k => p[k] !== undefined).map(k => [k, p[k]])) });
    syncLinkedBox();
    refreshReadouts(); syncFrameVisibility(); syncBaseUi();
    const pcaps = capsFor($('textureType').value);
    if(p.textureBlend && pcaps.blends.includes(p.textureBlend)) $('textureBlend').value = p.textureBlend;
    // a preset's own tint is a choice, like a hand-picked one: it stops
    // following the accents, so changing an accent later won't replace it
    if(p.textureTint1){ setColorField('textureTint1Hex', p.textureTint1); state.ui.tintFollows[0] = false; }
    if(p.textureTint2){ setColorField('textureTint2Hex', p.textureTint2); state.ui.tintFollows[1] = false; }
    [9, 10, 11, 12].forEach((n, i) => { if(p['textureTint' + n]){ setColorField('textureTint' + n + 'Hex', p['textureTint' + n]); state.ui.tintFollows[i + 2] = false; } });
    setColorField('textureTint3Hex', p.textureTint3 || '#FFFFFF');
    setColorField('textureTint4Hex', p.textureTint4 || '#FFFFFF');
    setColorField('textureTint5Hex', p.textureTint5 || hue5Default(p.textureType || $('textureType').value));
    setColorField('textureTint6Hex', p.textureTint6 || '#FFFFFF');
    // the page's lights: the preset's own, else none (a locked light keeps its rim and ambient too)
    if(!state.locks.has('textureLight')){ putRim(p.textureRim ?? RIM_DEFAULT.deg, p.textureRimTilt ?? RIM_DEFAULT.tilt); if($('textureAmbient')) $('textureAmbient').value = String(p.textureAmbient ?? 100);
      setColorField('textureTint7Hex', p.textureTint7 || RIM_DEFAULT.hex + '00'); setColorField('textureTint8Hex', p.textureTint8 || '#FFFFFF'); }
    syncLightPad();
    restoreLocked(__locks);
    // a preset changes opacity and seed without anyone touching them
    paintMoons();
    paintSeedMoon();
    // every view of every value made to match (Ruby: the surface's menu showed the surface before)
    refreshUi();
  }
}

/** A preset that is a whole look, made in the app and kept exactly: every
 *  setting it has is restored as a saved spell's would be — except the page
 *  size, which a preset never changes. Its own spell names it. */
function applyFullPreset(p){
  const __locks = snapshotLocked();
  try {
    applyThemePalette(deriveThemePalette(p));
    const s = { ...p }; for(const k of ['name', 'full', 'aspect', 'customSize', 'customW', 'customH']) delete s[k];
    restoreSettings(s);
    $('activeSpell').value = p.spell || '';
    if(document.body && document.body.dataset) document.body.dataset.lookName = p.name || '';
    maybeRerollSeed();                 // a built-in look is cast fresh each time, as the others are
    scheduleRender();
  } finally {
    restoreLocked(__locks);
    paintMoons(); paintSeedMoon(); refreshUi();
  }
}

// ---------- mobile layout ----------
// Deliberately device detection, not a media query. A narrow desktop window
// is still a desktop: it has a mouse, and its keyboard never covers half the
// screen. Only an actual phone should get the phone layout.
function detectMobile(){
  if(typeof navigator === 'undefined') return false;
  // the modern answer, where it exists (Chrome/Android reports this directly)
  if(navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean'){
    return navigator.userAgentData.mobile;
  }
  const ua = navigator.userAgent || '';
  if(/Android|iPhone|iPod|Opera Mini|IEMobile|Mobile Safari|webOS|BlackBerry/i.test(ua)) return true;
  // iPadOS reports itself as a Mac and has done for years; touch points give it away
  if(/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

// ---------- the tabs: one panel at a time, on every device ----------
// (On a desktop they sit under the logo, website-fashion; on a phone, along
// the bottom. Everything phone-only — the divider, the keyboard — is below.)
if(typeof document.querySelectorAll === 'function'){
  const panels = Array.from(document.querySelectorAll('.card[data-tab]'));
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  let current = 'write', before = 'write';
  // On a desktop, Esoterica's cards live in a drawer of their own on the
  // right, so the panel on the left can stay open (faded) beside them. They
  // move there the first time it opens; on a phone they never leave.
  const desktopNow = () => !(document.body && document.body.classList && document.body.classList.contains('is-mobile'))
    && typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;
  let drawer = null;
  const placeEsoterica = () => {
    const ctl = document.querySelector && document.querySelector('.controls'), app = document.querySelector && document.querySelector('.app');
    if(!ctl || !app || typeof document.createElement !== 'function') return;
    const more = panels.filter(p => p.dataset.tab === 'more');
    if(desktopNow()){
      if(!drawer){ drawer = document.createElement('aside'); drawer.className = 'eso-drawer'; drawer.id = 'esoDrawer'; app.appendChild(drawer); }
      more.forEach(p => { if(p.parentNode !== drawer) drawer.appendChild(p); });
    } else if(drawer) more.forEach(p => { if(p.parentNode !== ctl) ctl.appendChild(p); });   // a narrowed window: back in the panel
  };
  function activateTab(name){
    // Esoterica is the options menu: on a desktop it opens as a drawer, and
    // choosing it again closes it, back to whatever was open before
    if(name === 'more' && current === 'more') name = before;
    if(name !== current){ before = current; current = name; }
    const desk = desktopNow();
    if(name === 'more') placeEsoterica();
    if(document.body && document.body.classList){
      document.body.classList.toggle('more-open', name === 'more');
      const bar = document.getElementById && document.getElementById('tabBar');
      if(name === 'more' && bar && bar.getBoundingClientRect && document.documentElement.style)
        document.documentElement.style.setProperty('--desk-top', Math.round(bar.getBoundingClientRect().bottom) + 'px');
    }
    // (on a desktop the panel that was open stays open beside the drawer)
    panels.forEach(p => p.classList.toggle('tab-active', p.dataset.tab === name || (desk && name === 'more' && p.dataset.tab === before)));
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    // a tab change is a context change; start it from the top
    if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo({top:0, behavior:'instant'});
    const ctl = document.querySelector && document.querySelector('.controls'); if(ctl && name !== 'more') ctl.scrollTop = 0;
    if(drawer && name === 'more') drawer.scrollTop = 0;
  }
  tabBtns.forEach((b, i) => b.addEventListener('click', () => { if(!b.classList.contains('active')) murmur.play('tab', { index: i }); activateTab(b.dataset.tab); }));
  activateTab('write');
  // ESOTERICA ON A DESK (Ruby): a click anywhere outside its drawer closes it
  // (not inside a picker, a dialog or the Athanor, which float above the page);
  // while it is open its button reads Return (CSS: body.more-open)
  document.addEventListener('pointerdown', e => {
    if(current !== 'more' || !desktopNow() || !e.target || !e.target.closest) return;
    if(e.target.closest('#esoDrawer, .tab-btn[data-tab="more"], #clr-picker, .modal-veil, .sheet-veil, .forge-veil, .toast, [role="dialog"]')) return;
    activateTab(before);
  }, true);
  document.addEventListener('vellum-layout', () => { if(current === 'more') activateTab(before); placeEsoterica(); });
  // THE SIDEBAR'S WIDTH: its right edge drags (desktop); remembered in this
  // browser — it is how the person likes the room, not part of a look
  const app = document.querySelector && document.querySelector('.app');
  if(app && typeof document.createElement === 'function' && document.documentElement && document.documentElement.style){
    const root = document.documentElement, KEY = 'pp.sideWidth';
    const clampW = (v) => Math.max(320, Math.min(Math.max(320, (window.innerWidth || 1200) - 420), Math.round(v)));
    const setW = (v) => root.style.setProperty('--side-w', clampW(v) + 'px');
    try { const saved = +localStorage.getItem(KEY); if(saved) setW(saved); } catch(e){}
    const grip = document.createElement('div'); grip.className = 'side-resize'; grip.title = 'Drag to resize · double-click to reset';
    grip.setAttribute('role', 'separator'); grip.setAttribute('aria-orientation', 'vertical');
    app.appendChild(grip);
    let dragging = false;
    grip.addEventListener('pointerdown', (e) => { dragging = true; document.body.classList.add('side-dragging'); try { grip.setPointerCapture(e.pointerId); } catch(_){} e.preventDefault(); });
    grip.addEventListener('pointermove', (e) => { if(dragging) setW(e.clientX); });
    const end = () => { if(!dragging) return; dragging = false; document.body.classList.remove('side-dragging');
      try { localStorage.setItem(KEY, String(parseInt(getComputedStyle(root).getPropertyValue('--side-w')) || 460)); } catch(_){} };
    grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
    grip.addEventListener('dblclick', () => { root.style.removeProperty('--side-w'); try { localStorage.removeItem(KEY); } catch(_){} });
  }
  // ESOTERICA'S DRAWER: its left edge drags the same way (desktop), remembered too
  if(app && typeof document.createElement === 'function' && document.documentElement && document.documentElement.style){
    const root = document.documentElement, KEY = 'pp.drawerWidth';
    const clampD = v => Math.max(320, Math.min(Math.max(320, (window.innerWidth || 1200) - (parseInt(getComputedStyle(root).getPropertyValue('--side-w')) || 460) - 360), Math.round(v)));
    const setD = v => root.style.setProperty('--drawer-w', clampD(v) + 'px');
    try { const saved = +localStorage.getItem(KEY); if(saved) setD(saved); } catch(e){}
    const grip = document.createElement('div'); grip.className = 'drawer-resize side-resize-like'; grip.title = 'Drag to resize · double-click to reset';
    grip.setAttribute('role', 'separator'); grip.setAttribute('aria-orientation', 'vertical');
    app.appendChild(grip);
    let dragging = false;
    grip.addEventListener('pointerdown', e => { dragging = true; document.body.classList.add('side-dragging'); try { grip.setPointerCapture(e.pointerId); } catch(_){} e.preventDefault(); });
    grip.addEventListener('pointermove', e => { if(dragging) setD((window.innerWidth || 0) - e.clientX); });
    const end = () => { if(!dragging) return; dragging = false; document.body.classList.remove('side-dragging');
      try { localStorage.setItem(KEY, String(parseInt(getComputedStyle(root).getPropertyValue('--drawer-w')) || 440)); } catch(_){} };
    grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
    grip.addEventListener('dblclick', () => { root.style.removeProperty('--drawer-w'); try { localStorage.removeItem(KEY); } catch(_){} });
  }
}

// THE PHONE LAYOUT (Ruby): a phone, and ANY window as tall as 2:3 or taller
// (width ÷ height ≤ 2/3) — by its SHAPE, never a fixed width, which suits some
// screens and not others; a desktop window that shape gets it too, live, as it
// is resized. Anything squarer is the desktop's two panes, at any width. Its
// setup runs once, the first time it is wanted; it is harmless on a desk.
const PHONE_RATIO = 2/3;
function wantPhoneLayout(){
  if(detectMobile()) return true;
  if(typeof window === 'undefined' || !window.innerWidth || !window.innerHeight) return false;
  return window.innerWidth/window.innerHeight <= PHONE_RATIO + 1e-6;
}
let phoneSetUp = false;
function setupPhoneLayout(){
  if(phoneSetUp || typeof document.querySelectorAll !== 'function') return;
  phoneSetUp = true;


  // Keyboard awareness. visualViewport shrinks when the soft keyboard opens,
  // which is the only reliable signal there is -- window.innerHeight does not
  // budge on Android Chrome. The measured height becomes a CSS variable so the
  // tab bar rides above the keyboard instead of hiding behind it.
  const root = document.documentElement;
  const tabBar = $('tabBar');

  // The tab bar's height is measured rather than assumed -- it changes with
  // the device's own font scaling, and a wrong constant here is exactly what
  // lets the bar sit on top of the last control in a panel.
  const syncBarHeight = () => {
    const h = tabBar && tabBar.offsetHeight;
    if(h) root.style.setProperty('--tabbar-h', h + 'px');
  };

  const vv = window.visualViewport;
  let baselineVisible = 0;
  const syncViewport = () => {
    // visualViewport.height is what is ACTUALLY visible: it already excludes
    // the browser's URL bar and the soft keyboard. vh does not, which is why
    // nothing sized in vh fits on an Android phone.
    const visible = vv ? vv.height : window.innerHeight;
    root.style.setProperty('--vvh', visible + 'px');
    // The visible area's BOTTOM EDGE, in page coordinates. When Chrome lays the
    // keyboard over the page instead of resizing it, it pans the visible area
    // (offsetTop); a bar placed by height alone then sits under the keyboard or
    // leaves a gap, depending on the pan. offsetTop + height is where the bar
    // belongs in both cases.
    const bottom = vv ? (vv.offsetTop + vv.height) : window.innerHeight;
    root.style.setProperty('--vv-bottom', bottom + 'px');
    // visualViewport shrinks for the URL bar AND for the keyboard, so raw
    // shrinkage alone would read a tall bottom URL bar as a keyboard and
    // float the tab bar up over empty space. Requiring a focused text field
    // as well is what distinguishes the two.
    if(visible > baselineVisible) baselineVisible = visible;
    const shrink = Math.max(0, baselineVisible - visible);
    const ae = typeof document.activeElement === 'object' ? document.activeElement : null;
    const typing = !!ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT');
    const keyboard = typing && shrink > 140;
    root.style.setProperty('--kb-height', keyboard ? shrink + 'px' : '0px');
    // The preview keeps the height it had before the keyboard appeared --
    // watching it shrink while typing was worse than losing the space.
    if(!keyboard) root.style.setProperty('--vvh-stable', visible + 'px');
    document.body.classList.toggle('keyboard-open', keyboard);
    syncBarHeight();
    fitEditorRoom();
  };

  if(vv){
    vv.addEventListener('resize', syncViewport);
    // the pan changes without any resize, so it has to be watched separately
    vv.addEventListener('scroll', syncViewport);
    vv.addEventListener('scroll', syncViewport);
  }
  if(window.addEventListener) window.addEventListener('orientationchange', syncViewport);
  syncViewport();

  // Polaroid is the compact build -- the pill theme leaves a dead band where
  // the alpha slider would be and pushes the preview bubble off to one side.
  safeColoris({ theme: 'polaroid', themeMode: 'dark', alpha: false });

  // ---- draggable divider ----
  // An image editor whose image you cannot see is not an image editor. The
  // preview's share of the screen is a variable, and this drags it.
  // ?grip in the URL paints the divider and its hit area — a way to see
  // whether the handle is where you think it is, and how big it really is.
  // hash as well as query: a content:// or file:// URL may drop the query string
  if(typeof location !== 'undefined' &&
     (/[?&]grip\b/.test(location.search || '') || /grip/.test(location.hash || ''))){
    if(document.body && document.body.classList) document.body.classList.add('debug-grip');
  }

  const handle = $('dragHandle');
  const stageEl = typeof document.querySelector === 'function' ? document.querySelector('.stage') : null;
  if(handle && handle.addEventListener && stageEl){
    let dragging = false;
    const setFrac = (f) => root.style.setProperty('--preview-frac',
    Math.min(PREVIEW.maxFraction, Math.max(PREVIEW.minFraction, f)).toFixed(3));
    // the preview's share of the visible height (the phone layout is always one column)
    const fracFor = (e) => {
      const r = stageEl.getBoundingClientRect();
      const visible = parseFloat(getComputedStyle(root).getPropertyValue('--vvh')) || window.innerHeight;
      return (e.clientY - r.top) / visible;
    };
    handle.addEventListener('pointerdown', (e)=>{
      // Do NOT let this steal focus. Resizing the preview mid-edit should not
      // close the keyboard and drop you out of focus mode — preventing the
      // default action on pointerdown is what stops the browser moving focus,
      // while leaving the drag itself working normally.
      e.preventDefault();
      dragging = true;
      if(handle.setPointerCapture) handle.setPointerCapture(e.pointerId);
      document.body.classList.add('dragging-divider');
    });
    handle.addEventListener('pointermove', (e)=>{ if(!dragging) return; e.preventDefault();
      // (with the keyboard up the preview is measured in pixels, not a share: the divider sets them)
      if(document.body.classList.contains('keyboard-open') && document.body.classList.contains('focus-mode')){ KB_STAGE_DRAGGED = Math.round(e.clientY - stageEl.getBoundingClientRect().top); fitEditorRoom(); }
      else setFrac(fracFor(e)); });
    ['pointerup','pointercancel'].forEach(t => handle.addEventListener(t, ()=>{
      dragging = false;
      document.body.classList.remove('dragging-divider');
    }));
    // a double-tap on the grip restores the default split
    let lastTap = 0;
    handle.addEventListener('pointerup', ()=>{
      const now = Date.now();
      if(now - lastTap < 320){ setFrac(0.30); KB_STAGE_DRAGGED = null; fitEditorRoom(); }
      lastTap = now;
    });
  }

  // ---- pinch to zoom, drag to pan ----
  // Transform-only: the canvas bitmap is untouched, so the downloaded image
  // is never affected by how it is being inspected. With Panzoom loaded (the
  // usual case) the phone uses it too — it pinches toward the fingers — and
  // this hand-made pinch is only the fallback when the library isn't there.
  const wrap = typeof document.querySelector === 'function' ? document.querySelector('.canvas-wrap') : null;
  const cv = $('poemCanvas');
  if(wrap && cv && wrap.addEventListener && typeof Panzoom !== 'function'){
    let scale = 1, tx = 0, ty = 0;
    let pinchStart = 0, scaleStart = 1, panX = 0, panY = 0, mode = null;
    const apply = () => { cv.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; };
    const reset = () => { scale = 1; tx = 0; ty = 0; apply(); if(state.ui.zoom !== 1){ state.ui.zoom = 1; setTimeout(() => applyPreviewScale(true), 150); } };
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    // Same reasoning as the divider: pinching or panning must not pull focus
    // out of the poem. But the Save and reset buttons live INSIDE the preview,
    // and preventDefault on pointerdown suppresses their click — which is
    // exactly why Save stopped working. Controls are exempt.
    const isControl = (e) => !!(e.target && e.target.closest && e.target.closest('button'));
    wrap.addEventListener('pointerdown', (e)=>{ if(!isControl(e)) e.preventDefault(); });

    wrap.addEventListener('touchstart', (e)=>{
      if(!isControl(e) && e.preventDefault) e.preventDefault();
      if(e.touches.length === 2){
        mode = 'pinch'; pinchStart = dist(e.touches); scaleStart = scale;
      } else if(e.touches.length === 1 && scale > 1.01){
        mode = 'pan'; panX = e.touches[0].clientX - tx; panY = e.touches[0].clientY - ty;
      } else { mode = null; }
    }, {passive:false});

    wrap.addEventListener('touchmove', (e)=>{
      if(mode === 'pinch' && e.touches.length === 2 && pinchStart > 0){
        scale = Math.min(6, Math.max(1, scaleStart * (dist(e.touches) / pinchStart)));
        if(scale <= 1.01){ tx = 0; ty = 0; }
        apply(); e.preventDefault();
      } else if(mode === 'pan' && e.touches.length === 1){
        tx = e.touches[0].clientX - panX; ty = e.touches[0].clientY - panY;
        apply(); e.preventDefault();
      }
    }, {passive:false});

    // when a pinch ends, re-render sharp enough for the new magnification
    wrap.addEventListener('touchend', ()=>{ if(mode === 'pinch'){ state.ui.zoom = scale; applyPreviewScaleSoon(); } mode = null; }, {passive:true});

    // Changing the aspect ratio resizes the canvas underneath a transform that
    // was computed for the old shape, which is what threw the preview
    // off-centre and clipped it. Any change to the bitmap's dimensions drops
    // the zoom back to neutral.
    // Only a change of SHAPE resets: the preview's pixel size also changes
    // when its scale steps up or down, or while Save image renders the export.
    if(typeof MutationObserver === 'function'){
      let lastRatio = cv.width / cv.height;
      new MutationObserver(()=>{ const r = cv.width / cv.height;
        if(Math.abs(r - lastRatio) > 0.01){ lastRatio = r; reset(); } }).observe(cv, { attributes: true, attributeFilter: ['width','height'] });
    }

    // double-tap the preview to zoom back out
    let lastPreviewTap = 0;
    wrap.addEventListener('touchend', (e)=>{
      if(e.touches && e.touches.length) return;
      const now = Date.now();
      if(now - lastPreviewTap < 320) reset();
      lastPreviewTap = now;
    }, {passive:true});
  }
}
function applyLayout(){
  if(!document.body || !document.body.classList) return;
  const on = wantPhoneLayout(), was = document.body.classList.contains('is-mobile');
  if(on) setupPhoneLayout();
  document.body.classList.toggle('is-mobile', on);
  if(on !== was) setTimeout(() => paintDice(), 0);   // (later: this runs at boot, before the dice exist)
  if(was !== on && typeof document.dispatchEvent === 'function' && typeof CustomEvent === 'function') document.dispatchEvent(new CustomEvent('vellum-layout', { detail: { phone: on } }));
}
if(typeof document.querySelectorAll === 'function'){
  applyLayout();
  if(typeof window !== 'undefined' && window.addEventListener){ let lt = 0; window.addEventListener('resize', () => { clearTimeout(lt); lt = setTimeout(applyLayout, 120); }); }
}

// ---- the preview: pan and zoom (desktop and phone) ----
// Panzoom (timmywil/panzoom, the established library) rather than our own:
// on a desktop the wheel zooms toward the cursor; on a phone two fingers
// pinch toward where they are; a drag pans once zoomed in; a double-click or
// double-tap (or ⟲) fits it again. Transform-only: the image itself is never
// touched. When the zoom settles, the preview redraws sharp enough for it
// (state.ui.zoom). Without the library (offline before it was ever cached) a
// phone falls back to its own pinch and a desktop simply doesn't zoom.
let previewPanzoom = null;
if(typeof Panzoom === 'function' && typeof document.querySelector === 'function'){
  const wrap = document.querySelector('.canvas-wrap'), cv = $('poemCanvas'), phone = detectMobile();
  if(wrap && cv && wrap.addEventListener){
    try{
      const pz = previewPanzoom = Panzoom(cv, { minScale: 1, maxScale: phone ? 6 : 8, step: 0.25, panOnlyWhenZoomed: true, cursor: 'default', animate: true, duration: 160, touchAction: 'none' });
      let settle = null;
      const zoomSettled = () => { clearTimeout(settle); settle = setTimeout(() => {
        const z = pz.getScale(); if(Math.abs(z - (state.ui.zoom || 1)) < 0.01) return;
        const down = z < (state.ui.zoom || 1); state.ui.zoom = z; applyPreviewScale(down && z <= 1.01); }, 200); };
      // never pan the picture off its frame: at least a quarter of it stays in view
      const bound = () => { const z = pz.getScale(), p = pz.getPan();
        if(z <= 1.01){ if(p.x || p.y) pz.pan(0, 0, { animate: false, force: true }); return; }
        const lim = (cv.offsetWidth || 0)*0.5*(1 - 0.5/z)/1, limY = (cv.offsetHeight || 0)*0.5*(1 - 0.5/z);
        const x = Math.max(-lim, Math.min(lim, p.x)), y = Math.max(-limY, Math.min(limY, p.y));
        if(x !== p.x || y !== p.y) pz.pan(x, y, { animate: false, force: true }); };
      // the wheel zooms only with Ctrl or ⌘ held (a trackpad's pinch sends that too): a plain
      // scroll over the image used to zoom it by surprise (Ruby's "pillarbox" screenshot)
      wrap.addEventListener('wheel', (e) => { if(e.target && e.target.closest && e.target.closest('button')) return; if(!(e.ctrlKey || e.metaKey)) return; pz.zoomWithWheel(e); bound(); zoomSettled(); }, { passive: false });
      // the window changes shape: fit the picture again
      if(typeof window !== 'undefined' && window.addEventListener){ let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if(pz.getScale() > 1.01){ pz.reset({ animate: false }); zoomSettled(); } }, 150); }); }
      cv.addEventListener('panzoomchange', () => { wrap.classList.toggle('zoomed', pz.getScale() > 1.01); });
      cv.addEventListener('panzoomend', () => { bound(); zoomSettled(); });
      cv.addEventListener('dblclick', () => { pz.reset(); zoomSettled(); });
      if(phone){
        // double-tap fits it again; and touching the preview never pulls focus
        // out of the poem (the buttons inside it still work)
        let lastTap = 0;
        wrap.addEventListener('touchend', (e) => { if(e.touches && e.touches.length) return; const now = Date.now(); if(now - lastTap < 320){ pz.reset(); zoomSettled(); } lastTap = now; }, { passive: true });
        wrap.addEventListener('pointerdown', (e) => { if(!(e.target && e.target.closest && e.target.closest('button'))) e.preventDefault(); });
      }
      if(typeof MutationObserver === 'function'){
        let lastRatio = cv.width / cv.height;
        new MutationObserver(() => { const r = cv.width / cv.height;
          if(Math.abs(r - lastRatio) > 0.01){ lastRatio = r; pz.reset({ animate: false }); zoomSettled(); } }).observe(cv, { attributes: true, attributeFilter: ['width','height'] });
      }
    } catch(e){ previewPanzoom = null; }
  }
}

// ---------- texture parameters ----------
// Each texture declares two knobs (see TEXTURE_PARAMS). The sliders relabel
// and re-range themselves when the texture changes, so a control never says
// "value 1" -- it says Sigil zoom, or Slant, or Nebula density.
function syncTextureParams(useDefaults){
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
const curveOf = k => { const d = curveDefs.find(c => c.slot === k); return curvePoints((($('textureCurve' + k) || {}).value) || (d ? d.def : '')); };
function paintCurvePad(k){
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
function paintCurves(){ for(const k of [1, 2]) paintCurvePad(k); }
function setCurvePoints(k, pts, commit){
  const el = $('textureCurve' + k); if(!el) return;
  el.value = pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1])).join(';');
  paintCurvePad(k); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
for(const k of [1, 2]){
  const cv = $('texCurve' + k + 'Pad'); if(!cv || !cv.addEventListener) continue;
  let drag = -1, pts = null, held = 0, lastTap = { t: 0, i: -1 };
  const at = e => { const r = cv.getBoundingClientRect(), pad = 14*r.width/cv.width;
    return [Math.max(0, Math.min(100, (e.clientX - r.left - pad)/(r.width - 2*pad)*100)), Math.max(0, Math.min(100, (r.bottom - pad - e.clientY)/(r.height - 2*pad)*100))]; };
  const near = (p, e) => { const r = cv.getBoundingClientRect(), sx = (r.width - 28*r.width/cv.width)/100, sy = (r.height - 28*r.height/cv.height)/100, reach = e.pointerType === 'mouse' ? 10 : 20;
    let best = -1, bd = Infinity; pts.forEach(([px, py], i) => { const d = Math.hypot((px - p[0])*sx, (py - p[1])*sy); if(d < bd){ bd = d; best = i; } }); return bd <= reach ? best : -1; };
  const remove = i => { if(pts.length <= 2 || i < 0) return; pts.splice(i, 1); drag = -1; setCurvePoints(k, pts, true); };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); pts = curveOf(k).map(p => [...p]); const p = at(e); let i = near(p, e);
    // (a second tap on the same point, quickly: it goes)
    if(i >= 0 && Date.now() - lastTap.t < 380 && lastTap.i === i){ remove(i); lastTap = { t: 0, i: -1 }; return; }
    lastTap = { t: Date.now(), i };
    if(i < 0){ pts.push(p); pts.sort((a, b) => a[0] - b[0]); i = pts.indexOf(p); }
    drag = i; try { cv.setPointerCapture(e.pointerId); } catch(err){}
    clearTimeout(held); held = setTimeout(() => { if(drag === i && pts.length > 2) remove(i); }, 650);
    setCurvePoints(k, pts, false); });
  cv.addEventListener('pointermove', e => { if(drag < 0) return; clearTimeout(held);
    const p = at(e), lo = drag > 0 ? pts[drag - 1][0] + 1 : 0, hi = drag < pts.length - 1 ? pts[drag + 1][0] - 1 : 100;
    pts[drag] = [Math.max(lo, Math.min(hi, p[0])), p[1]]; draftWhileDragging(); setCurvePoints(k, pts, false); });
  for(const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, () => { clearTimeout(held); if(drag < 0) return; drag = -1; setCurvePoints(k, pts, true); });
  const reset = $('texCurve' + k + 'Reset');
  if(reset && reset.addEventListener) reset.addEventListener('click', () => { $('textureCurve' + k).value = ''; paintCurvePad(k); scheduleRender(); commitSoon(); });
}

// While a texture knob (or the light) is being dragged, slow textures are
// drafted at half resolution; a quarter-second after it stops, they sharpen.
let draftTimer = null;
function draftWhileDragging(){
  setDrafting(true);
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => setDrafting(false), 250);
}
['texP1','texP2','texP3','texP4','texP5','texP6','texP7','texP8'].forEach(id=>{
  $(id).addEventListener('input', ()=>{
    draftWhileDragging();
    const defs = paramsFor($('textureType').value);
    const i = +id.slice(4) - 1;
    if(defs[i]) $(id+'Val').textContent = paramReadout(defs[i], +$(id).value);
    scheduleRender();
  });
});
$('textureType').addEventListener('change', ()=>{
  syncTextureParams(true);
  // a texture with a light of its own starts there when chosen (Facet Field:
  // overhead); saved looks and presets keep theirs, as they don't come through here
  const lt = (capsFor($('textureType').value) || {}).lightTilt, ld = (capsFor($('textureType').value) || {}).lightDeg;
  if(lt != null && $('textureLightTilt')){ $('textureLightTilt').value = String(lt); syncLightPad(); }
  // …and one that uses the dial for a direction starts at its own (Harsh Rain: straight down)
  if(ld != null && !state.locks.has('textureLight')){ $('textureLight').value = String(ld); if($('textureLightTilt')) $('textureLightTilt').value = '100'; syncLightPad(); }
  scheduleRender();
});
syncTextureParams(true);


// ---------- texture tools ----------
// Blend mode, light direction and tints are declared per texture (see
// TEXTURE_CAPS). Anything a texture cannot use is disabled rather than left
// live and inert -- a control that silently does nothing is worse than one
// that is visibly unavailable.

function syncTextureTools(resetToDefaults){
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
    // (a dial that is only a direction has no height to show)
    const hf = $('lightTiltField'); if(hf && hf.style) hf.style.display = caps.dirOnly ? 'none' : '';
  }

  // THE CAMERA DIAL: shown for a surface with a camera, beside the light dial, the hues below in two columns
  { const cam = caps.camera, row = $('cameraRow'), tools = $('textureToolRow');
    if(row && row.classList) row.classList.toggle('tool-hidden', !cam);
    if(tools && tools.classList) tools.classList.toggle('has-camera', !!cam);
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
function followAccents(){
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

// ---------- the light dial ----------
// The centre is light from straight overhead; drag outward toward where the
// light comes FROM. Direction is degrees clockwise from north (as the old pad
// was, so saved looks keep their light); distance is how LOW the light is:
// at the rim, raking (100, the old behaviour), at the centre, overhead (0).
// The arrow points the way the light travels and strengthens as it lowers.
// Eight ticks on the rim snap to 45°; ⟲ resets.
const LIGHT_DEFAULT = { deg: 315, tilt: 100 };
// THE RIM LIGHT (ROADMAP C2; Ruby: a second handle on the dial, in a second colour, under the first, chosen with a
// button as Two Surfaces' Upper and Lower are): a second light from its own place on the dial, in its own colour. Its
// hue (textureTint7Hex) holds its strength in its alpha: 0 is off. Moving its handle turns it on, at RIM_ON; ⟲ while it
// is chosen turns it off. Where the page's lights reach a surface (caps.rig) the dial shows ☉ Main / ◐ Rim, the Ambient
// slider and the light hues; the finger moves the light chosen.
const RIM_DEFAULT = { deg: 135, tilt: 100, hex: '#CFE3FF' }, RIM_ON = '99';   // a cool light from the far side; on at 60%
/** Whether the page's lights reach this surface (the rim, the Ambient slider, the light hues). */
function lightsReach(type = ($('textureType') || {}).value){ return !!((capsFor(type) || {}).rig || type === 'athanor'); }
function rimHex(){ const v = String(($('textureTint7Hex') || {}).value || ''); return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : RIM_DEFAULT.hex + '00'; }
/** The rim light now: its way and height (as the dial's), and whether it is on (its hue's alpha above 0). */
function rimNow(){ const d = parseFloat(($('textureRim') || {}).value), t = parseFloat(($('textureRimTilt') || {}).value), h = rimHex();
  return { deg: isNaN(d) ? RIM_DEFAULT.deg : d, tilt: isNaN(t) ? RIM_DEFAULT.tilt : t, on: h.length === 7 || h.slice(7, 9).toUpperCase() !== '00' }; }
/** Which light the finger moves: 'main', or 'rim' (only where the page's lights reach). */
function lightPick(){ return state.ui.lightPick === 'rim' && lightsReach() ? 'rim' : 'main'; }
/** The rim light's place into its two hidden fields (no render: a look or a preset is being put back). */
function putRim(deg, tilt){
  const set = (id, v) => { const el = $(id); if(el) el.value = String(v); };
  set('textureRim', Math.round((((+deg || 0) % 360) + 360) % 360)); set('textureRimTilt', Math.round(Math.max(0, Math.min(dialMax(), isNaN(+tilt) ? RIM_DEFAULT.tilt : +tilt))));
}
/** The rim light on (at RIM_ON, its own colour kept) or off (its alpha 0). */
function setRimOn(on){ const h = rimHex().slice(0, 7); setColorField('textureTint7Hex', h + (on ? RIM_ON : '00')); }
/** THE DIALS' REACH (Ruby: "we used to be able to move this right to the edge"): a handle at 100% sits on ☉'s ring, under
 *  the finger, its centre this far from the middle (in the dial's 100-unit box); past the rim (to 130%, an engine-lit
 *  surface's lower light) it goes on outside the ring, to the dashed circle. The camera's View the same. */
const DIAL_R = 26;
function syncLightPad(){
  const deg = parseFloat($('textureLight').value) || 0, tilt = $('textureLightTilt') ? parseFloat($('textureLightTilt').value) : 100;
  const k = Math.max(0, Math.min(130, isNaN(tilt) ? 100 : tilt)) / 100, a = deg * Math.PI / 180;
  const set = (id, attrs) => { const el = $(id); if(el && el.setAttribute) for(const key in attrs) el.setAttribute(key, attrs[key]); };
  // the dot slides from the heart of ☉ toward the rim
  const hx = Math.sin(a) * DIAL_R * k, hy = -Math.cos(a) * DIAL_R * k;
  set('lightHandle', { cx: hx.toFixed(2), cy: hy.toFixed(2) }); set('lightMainClipDot', { cx: hx.toFixed(2), cy: hy.toFixed(2) });
  // 🜚 AS A SHADOW (Ruby): the ☉ at the middle casts it away from the light, out of the rim on the far side, longer and
  // darker as the light lowers (none overhead); the rim light casts its own, as strong as the rim light is
  // (its curls grow with it, small with the light high, flaring as it lowers: Ruby)
  const shadowOf = (body, group, d, kk, strength) => { const kc = Math.min(1.3, kk), tip = 26 + 3 + 16*kc, curl = (0.55 + 0.5*kc).toFixed(3);
    const shape = { points: `-3.4,-24.5 3.4,-24.5 0,${(-tip).toFixed(2)}` }, curls = { transform: `translate(0 -24.5) scale(${curl}) translate(0 24.5)` }, turn = `rotate(${((d + 180) % 360).toFixed(1)})`;
    const op = kk < 0.04 || strength <= 0 ? 0 : (0.35 + 0.65*Math.min(1, kk))*strength;
    set(body, shape); set(body.replace('Body', 'Curls'), curls); set(group, { transform: turn, opacity: op.toFixed(2) });
    return { shape, curls, turn, op }; };
  const mainShadow = shadowOf('lightSpikeBody', 'lightSpike', deg, k, 1);
  // the rim light's handle, under the main's: hollow while it is off, fainter as it is weaker; where the two meet, the
  // lens they share mixes to white
  const reach = lightsReach(), R = rimNow(), rk = Math.max(0, Math.min(130, R.tilt))/100, ra = R.deg*Math.PI/180;
  const rx = Math.sin(ra)*DIAL_R*rk, ry = -Math.cos(ra)*DIAL_R*rk, rs = rimStrengthNow();
  set('lightRimHandle', { cx: rx.toFixed(2), cy: ry.toFixed(2), opacity: R.on ? (0.35 + 0.65*rs/100).toFixed(2) : '1' }); set('lightOverlap', { cx: rx.toFixed(2), cy: ry.toFixed(2) });
  const rimShadow = shadowOf('lightRimSpikeBody', 'lightRimSpike', R.deg, rk, reach && R.on ? rs/100 : 0);
  // where the two shadows cross, the overlap colour (the rim's shadow seen through the main's), as the handles mix
  set('lightSpikeMaskG', { transform: mainShadow.turn }); set('lightSpikeMaskBody', mainShadow.shape); set('lightSpikeMaskCurls', mainShadow.curls);
  set('lightSpikeOverlapG', { transform: rimShadow.turn }); set('lightSpikeOverlapBody', rimShadow.shape); set('lightSpikeOverlapCurls', rimShadow.curls);
  set('lightSpikeOverlap', { opacity: Math.min(mainShadow.op, rimShadow.op).toFixed(2) });
  const pick = lightPick();
  const dial = $('lightDial');
  if(dial && dial.classList){ dial.classList.toggle('has-rim', reach); dial.classList.toggle('rim-on', reach && R.on); dial.classList.toggle('pick-rim', pick === 'rim'); }
  const row = $('lightRow'); if(row && row.classList){ row.classList.toggle('has-rig', reach); row.classList.toggle('pick-rim', reach && pick === 'rim'); }
  // THE TWO DIALS SIDE BY SIDE (Ruby: "always aligned … it looks good when it was symmetrical"): with Main / Rim above
  // the light dial, the camera dial steps down as far, so the two sit level
  { const seg = $('lightSeg'), tr = row && row.closest ? row.closest('.tool-row') : null;
    if(tr && tr.classList && tr.style){ const on = reach && !!seg && !!seg.getBoundingClientRect;
      tr.classList.toggle('has-seg', on);
      if(on && typeof getComputedStyle === 'function'){ const r = seg.getBoundingClientRect(), cs = getComputedStyle(seg), h = r.height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
        if(h > 0) tr.style.setProperty('--light-seg-h', h.toFixed(1) + 'px'); } } }
  { const seg = $('lightSeg'); if(seg && seg.querySelectorAll) seg.querySelectorAll('[data-light]').forEach(b => { const me = b.dataset.light === pick; b.classList.toggle('active', me); b.setAttribute('aria-pressed', String(me)); b.classList.toggle('dim', b.dataset.light === 'rim' && !R.on); }); }
  { const r7 = $('tint7Row'); if(r7 && r7.classList) r7.classList.toggle('rim-off', !R.on); }
  // the numbers beneath are the chosen light's
  const pd = pick === 'rim' ? R.deg : deg, pt = pick === 'rim' ? R.tilt : tilt;
  if(dial && dial.querySelectorAll) dial.querySelectorAll('.ld-tick').forEach(t => t.classList.toggle('active', pt >= 99 && Math.abs(((pd - +t.dataset.deg + 540) % 360) - 180) < 0.5));
  if(dial && dial.setAttribute) dial.setAttribute('aria-valuetext', `${pick === 'rim' ? 'rim light ' : ''}${Math.round(pd)}°, ${Math.round(isNaN(pt) ? 100 : pt)}% low`);
  if(dial && dial.classList) dial.classList.toggle('past-rim', tilt > 100);
  // its numbers, beneath (not while one is being typed)
  const di = $('lightDegIn'), ti = $('lightTiltIn'), ai = $('lightAmbIn'), ae = typeof document !== 'undefined' ? document.activeElement : null;
  if(di && ae !== di) di.value = String(Math.round(pd)); if(ti && ae !== ti){ ti.value = String(Math.round(isNaN(pt) ? 100 : pt)); ti.max = String(dialMax()); }
  if(ai && ae !== ai) ai.value = String(Math.round(parseFloat(($('textureAmbient') || {}).value) || 0));
  // the rim light's strength, under the dial while Rim is chosen
  const rki = $('lightRimKIn'), rkr = $('rimStrength');
  if(rki && ae !== rki) rki.value = String(rs); if(rkr && ae !== rkr) rkr.value = String(rs);
}
/** The rim light's strength, 0–100 (its hue's alpha; 0 while it is off). */
function rimStrengthNow(){ const h = rimHex(); return h.length === 7 ? 100 : Math.round(parseInt(h.slice(7, 9), 16)/255*100); }
/** The rim light to a strength (0 turns it off; its colour and place kept). */
function setRimStrength(v, commit){
  if(!commit) draftWhileDragging();
  const a = Math.round(Math.max(0, Math.min(100, +v || 0))/100*255);
  setColorField('textureTint7Hex', rimHex().slice(0, 7) + a.toString(16).padStart(2, '0').toUpperCase());
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
// typing the dial's numbers turns the chosen light exactly
for(const id of ['lightDegIn', 'lightTiltIn']) if($(id) && $(id).addEventListener) $(id).addEventListener('change', () => {
  const deg = parseFloat($('lightDegIn').value), tilt = parseFloat($('lightTiltIn').value);
  const p = pickedNow(); movePicked(isNaN(deg) ? p.deg : deg, isNaN(tilt) ? p.tilt : tilt, true);
});
function setLight(deg, tilt, commit){
  if(!commit) draftWhileDragging();
  $('textureLight').value = String(Math.round(((deg % 360) + 360) % 360));
  if($('textureLightTilt')) $('textureLightTilt').value = String(Math.round(Math.max(0, Math.min(dialMax(), tilt))));
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
/** The rim light moved (and so on, if it was off: a light moved that gives nothing would be a control that does nothing). */
function setRim(deg, tilt, commit){
  if(!commit) draftWhileDragging();
  putRim(deg, tilt); if(!rimNow().on) setRimOn(true);
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
/** The chosen light to (deg, tilt). */
// (the dial's own moves show the sun's guide: held while dragging, a moment after a click, a key or a typed number)
function movePicked(deg, tilt, commit){ if(lightPick() === 'rim') setRim(deg, tilt, commit); else setLight(deg, tilt, commit); drawDialGuide(true, !!commit); }
function pickedNow(){ if(lightPick() === 'rim'){ const R = rimNow(); return { deg: R.deg, tilt: R.tilt }; }
  const t = parseFloat(($('textureLightTilt') || {}).value); return { deg: parseFloat($('textureLight').value) || 0, tilt: isNaN(t) ? 100 : t }; }
if($('lightSeg') && $('lightSeg').addEventListener) $('lightSeg').addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('[data-light]') : null; if(!b) return;
  state.ui.lightPick = b.dataset.light === 'rim' ? 'rim' : 'main'; syncLightPad(); });
if($('lightDial') && $('lightDial').addEventListener){
  const dial = $('lightDial');
  const fromPointer = (e, snapTicks) => {
    const rc = dial.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * 100 - 50, y = (e.clientY - rc.top) / rc.height * 100 - 50;
    // the rim of ☉ is 100; an engine-lit texture lets it be pulled further out (to 130: lower light)
    let deg = Math.atan2(x, -y) * 180 / Math.PI;
    // THE RIM HOLDS (Ruby): the light SNAPS to 100% reach as the finger nears
    // the rim, and stays there until it is pulled well past it; beyond, it
    // moves more slowly, like pulling against a detent (to 130, only for the
    // engine-lit textures)
    const raw = Math.hypot(x, y) / DIAL_R * 100;
    let tilt = raw < 93 ? raw : raw < 118 ? 100 : Math.min(dialMax(), 100 + (raw - 118) * 0.6);
    tilt = Math.min(dialMax(), tilt);
    if(tilt === 100 && fromPointer.was !== 100 && typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate(8); } catch(_){}
    fromPointer.was = tilt;
    // near a tick on the rim, take its exact direction
    if(snapTicks || tilt > 88){ const nearest = Math.round(deg / 45) * 45; if(Math.abs(nearest - deg) < 7) deg = nearest; }
    // the halfway ring catches lightly
    if(Math.abs(tilt - 50) < 4) tilt = 50;
    movePicked(deg, tilt, false);
  };
  let dragging = false;
  dial.addEventListener('pointerdown', e => { dragging = true; if(dial.setPointerCapture) dial.setPointerCapture(e.pointerId); fromPointer(e, e.target && e.target.classList && e.target.classList.contains('ld-tick')); });
  dial.addEventListener('pointermove', e => { if(dragging) fromPointer(e, false); });
  const end = () => { if(dragging){ dragging = false; drawDialGuide(false); if(typeof commitSoon === 'function') commitSoon(); } };
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  // keys: arrows turn it by 15°, page up/down raise and lower it
  dial.addEventListener('keydown', e => {
    const p = pickedNow();
    const map = { ArrowRight: [15, 0], ArrowDown: [15, 0], ArrowLeft: [-15, 0], ArrowUp: [-15, 0], PageUp: [0, -10], PageDown: [0, 10] };
    if(map[e.key]){ e.preventDefault(); movePicked(p.deg + map[e.key][0], p.tilt + map[e.key][1], true); }
  });
}
// ⟲ resets the chosen light (the rim light: off, back where it starts)
if($('lightReset') && $('lightReset').addEventListener) $('lightReset').addEventListener('click', () => {
  if(lightPick() === 'rim'){ putRim(RIM_DEFAULT.deg, RIM_DEFAULT.tilt); setRimOn(false); syncLightPad(); scheduleRender(); if(typeof commitSoon === 'function') commitSoon(); return; }
  setLight(LIGHT_DEFAULT.deg, LIGHT_DEFAULT.tilt, true); drawDialGuide(true, true); });
// ◎ to the centre (overhead / the middle of the page), keeping the angle; ⚄ a
// random angle, keeping the distance. Neither is sticky. Each moves the chosen light.
if($('lightCentre') && $('lightCentre').addEventListener) $('lightCentre').addEventListener('click', () => movePicked(pickedNow().deg, 0, true));
if($('lightRandom') && $('lightRandom').addEventListener) $('lightRandom').addEventListener('click', () => {
  // a locked light stays; otherwise it turns the way the dice roll (a little, anywhere, or anywhere and any height)
  if(state.locks.has('textureLight')){ toast(DIE.locked); murmur.play('blocked'); return; }
  const lv = dieLevel(), { deg, tilt: t } = pickedNow();
  if(lv === 'gentle') movePicked(deg + (Math.random()*2 - 1)*15, t + (Math.random()*2 - 1)*8, true);
  else if(lv === 'wild') movePicked(Math.random()*360, Math.random()*dialMax(), true);
  else movePicked(Math.random()*360, t, true); });
// THE AMBIENT SLIDER (Ruby: under the dial, as the camera's zoom), and its number
if($('textureAmbient') && $('textureAmbient').addEventListener){
  $('textureAmbient').addEventListener('input', () => { draftWhileDragging(); syncLightPad(); scheduleRender(); });
  $('textureAmbient').addEventListener('change', () => { syncLightPad(); scheduleRender(); if(typeof commitSoon === 'function') commitSoon(); });
}
if($('rimStrength') && $('rimStrength').addEventListener){
  $('rimStrength').addEventListener('input', () => setRimStrength($('rimStrength').value, false));
  $('rimStrength').addEventListener('change', () => setRimStrength($('rimStrength').value, true));
}
if($('lightRimKIn') && $('lightRimKIn').addEventListener) $('lightRimKIn').addEventListener('change', () => { const v = parseFloat($('lightRimKIn').value); if(!isNaN(v)) setRimStrength(v, true); });
if($('lightAmbIn') && $('lightAmbIn').addEventListener) $('lightAmbIn').addEventListener('change', () => {
  const v = parseFloat($('lightAmbIn').value); if(!isNaN(v) && $('textureAmbient')) $('textureAmbient').value = String(Math.round(Math.max(0, Math.min(200, v))));
  syncLightPad(); scheduleRender(); if(typeof commitSoon === 'function') commitSoon(); });
// ---------- THE CAMERA DIAL ----------
// (Ruby: a second dial for the camera, so the light dial is the light's alone.) Its handle is where the camera stands:
// round the dial, its turn; drawn out from the middle, how low it looks (the middle straight down — or, on Ringworld,
// straight up — the rim low across); the slider under it, a wheel or a pinch zoom it. While it moves, a guide of the shot is drawn
// over the page at once (a plank's grid, a ring's edges), and the surface follows when it has been made.
/** Where a surface's camera starts. */
function cameraStart(type){ const c = (capsFor(type) || {}).camera || {};
  // a surface whose camera the seed places (Ruby: "randomize the initial camera position with the seed"): each seed its
  // own shot within the ranges it names, still the dial's to change
  if(c.seeded){ const seed = parseInt(($('textureSeedValue') || {}).value, 10) || 0, r = k => { let h = Math.imul((seed ^ 0x3C6EF372) >>> 0, 2654435761) ^ Math.imul(k + 1, 0x85EBCA6B); h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D); return ((h ^ (h >>> 13)) >>> 0)/4294967296; };
    const at = (rg, k) => Math.round(rg[0] + (rg[1] - rg[0])*r(k)); return { turn: at(c.seeded.turn, 1), view: at(c.seeded.view, 2), zoom: at(c.seeded.zoom, 3) }; }
  return { turn: c.turn ?? 0, view: c.view ?? 0, zoom: c.zoom ?? 100 }; }
// a new seed rolled: a surface whose camera the seed places takes its new shot (unless the camera is locked)
function seedCamera(){ const type = ($('textureType') || {}).value, c = (capsFor(type) || {}).camera;
  if(!c || !c.seeded || state.locks.has('cameraTurn')) return; const d = cameraStart(type); putCamera(d.turn, d.view, d.zoom); }
function cameraNow(){ const v = id => parseFloat(($(id) || {}).value); const t = v('cameraTurn'), w = v('cameraView'), z = v('cameraZoom');
  return { turn: isNaN(t) ? 0 : t, view: isNaN(w) ? 0 : w, zoom: isNaN(z) ? 100 : z }; }
/** The camera into its three hidden fields (no render: a look or a preset is being put back). */
function putCamera(turn, view, zoom){
  const set = (id, v) => { const el = $(id); if(el) el.value = String(v); };
  set('cameraTurn', Math.round(((+turn || 0) % 360 + 360) % 360)); set('cameraView', Math.round(Math.max(0, Math.min(100, +view || 0))));
  set('cameraZoom', Math.round(Math.max(25, Math.min(400, +zoom || 100)))); syncCameraPad();
}
function syncCameraPad(){
  const c = cameraNow(), k = Math.max(0, Math.min(100, c.view))/100, a = c.turn*Math.PI/180;
  const set = (id, attrs) => { const el = $(id); if(el && el.setAttribute) for(const key in attrs) el.setAttribute(key, attrs[key]); };
  const hx = Math.sin(a)*DIAL_R*k, hy = -Math.cos(a)*DIAL_R*k;
  set('cameraHandle', { cx: hx.toFixed(2), cy: hy.toFixed(2) });
  set('cameraSight', { x1: hx.toFixed(2), y1: hy.toFixed(2), x2: '0', y2: '0', opacity: k < 0.04 ? '0' : '0.8' });
  // the frame: what the camera sees, turned with it, smaller as it zooms in
  const f = Math.max(0.2, Math.min(2.4, 100/c.zoom)), w = 16*f, h = 22*f;
  set('cameraFrame', { x: (-w/2).toFixed(2), y: (-h/2).toFixed(2), width: w.toFixed(2), height: h.toFixed(2), transform: `rotate(${c.turn.toFixed(1)})` });
  const dial = $('cameraDial');
  if(dial && dial.querySelectorAll) dial.querySelectorAll('.ld-tick').forEach(t => t.classList.toggle('active', c.view >= 99 && Math.abs(((c.turn - +t.dataset.deg + 540) % 360) - 180) < 0.5));
  if(dial && dial.setAttribute) dial.setAttribute('aria-valuetext', `turned ${Math.round(c.turn)}°, ${Math.round(c.view)}% low, zoom ${Math.round(c.zoom)}%`);
  const ae = typeof document !== 'undefined' ? document.activeElement : null;
  for(const [id, v] of [['cameraTurnIn', c.turn], ['cameraViewIn', c.view], ['cameraZoomInput', c.zoom]]){ const el = $(id); if(el && ae !== el) el.value = String(Math.round(v)); }
  { const z = $('cameraZoomSlider'); if(z && ae !== z) z.value = String(Math.round(Math.log2(Math.max(25, Math.min(400, c.zoom))/100)*100)); }
}
function setCamera(turn, view, zoom, commit){
  if(!commit) draftWhileDragging();
  putCamera(turn, view, zoom); scheduleRender(); drawCameraGuide(!commit);
  if(commit && typeof commitSoon === 'function') commitSoon();
}
// THE GUIDE: the shot as lines over the page, at once, while the surface is still being made
/** A guide's canvas over the page (made the first time), sized to it now; null where there is no page to draw over. */
function guideCanvas(cls){
  const pc = $('poemCanvas'), wrap = pc && pc.parentElement;
  if(!pc || !wrap || typeof document.createElement !== 'function' || !pc.getBoundingClientRect) return null;
  let g = wrap.querySelector && wrap.querySelector('.' + cls);
  if(!g){ g = document.createElement('canvas'); g.className = cls; g.setAttribute('aria-hidden', 'true'); wrap.appendChild(g); }
  return { g, size(){ const r = pc.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), dpr = Math.min(1.5, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    Object.assign(g.style, { left: (r.left - wr.left) + 'px', top: (r.top - wr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
    g.width = Math.max(1, Math.round(r.width*dpr)); g.height = Math.max(1, Math.round(r.height*dpr)); return dpr; } };
}
/** The Ringworlds' view as the guides need it (the camera's, and where on the ring you stand). */
function ringGuideOf(kind, type, c){
  const v = id => parseFloat(($(id) || {}).value);
  // (Ringworld's walls follow Landforms, half its range; where you stand across the band is the seed's)
  // (a knob found by its key: Altitude is the seventh on Ringworld, the sixth on the Painted Ringworld)
  const slot = key => 'texP' + (paramsFor(type).findIndex(p => p.key === key) + 1);
  return kind === 'ring' ? { band: v('texP1'), walls: v('texP2')*0.5, altitude: v(slot('alt')), placeBy: 'where the seed says', seed: v('textureSeedValue') >>> 0, lens: 75, zoom: c.zoom, look: c.turn, up: c.view/100, curved: type === 'ringpaint' }
    : kind === 'ellipse' ? { centre: 0.15 + 0.7*(v(slot('height')) || 0)/100 } : null;
}
function drawCameraGuide(on){
  const caps = capsFor(($('textureType') || {}).value) || {}, kind = caps.camera && caps.camera.guide;
  const G = kind ? guideCanvas('cam-guide') : null; if(!G) return;
  const g = G.g;
  if(!on){ holdGuideUntilMade(g); return; }
  g._seq = (g._seq || 0) + 1;
  const dpr = G.size(), x = g.getContext('2d'); if(!x) return;
  const u = Math.min(g.width, g.height), aspX = g.width/u, aspY = g.height/u, c = cameraNow();
  const type = ($('textureType') || {}).value, deg0 = parseFloat(($('textureLight') || {}).value) || 0, t0 = parseFloat(($('textureLightTilt') || {}).value);
  // (the Black Hole's disc stands where the light dial places it)
  const ring = kind === 'disc' ? { place: dialGuidePlace({ k: 'place' }, deg0, isNaN(t0) ? 100 : t0, aspX, aspY) } : ringGuideOf(kind, type, c);
  const lines = cameraGuide(kind, aspX, aspY, c, ring);
  x.clearRect(0, 0, g.width, g.height); x.lineCap = 'round'; x.lineJoin = 'round';
  const accent = (getComputedStyle(document.body).getPropertyValue('--accent') || '#E7A0B8').trim() || '#E7A0B8';
  for(const pass of [0, 1]) for(const L of lines){
    x.strokeStyle = pass ? accent : 'rgba(0,0,0,.55)'; x.globalAlpha = L.bold ? 0.95 : 0.6;
    x.lineWidth = (L.bold ? 2.2 : 1)*dpr*(pass ? 1 : 2.6);
    x.beginPath(); L.pts.forEach((p, i) => i ? x.lineTo(p[0]*u, p[1]*u) : x.moveTo(p[0]*u, p[1]*u)); x.stroke(); }
  g.classList.add('on');
}
// THE SUN'S GUIDE (Ruby: "a sun position guide that shows up on the image also before the render"): while the light dial
// moves, where the light comes from is drawn over the page at once, before the surface is made: the Painted Ringworld's
// sun where it will stand in the picture (an arrow at the edge when it is out of the frame); any other lit surface's
// light as a sun at the dial's place on the page (the middle overhead, the rim the page's edge), turned with the camera
// where the camera turns the ground under it; the rim light's in its own colour
/** Whether the light dial is a light this surface shows from somewhere (not a wind, a flow, or the Ringworlds' day). */
/** WHAT THE LIGHT DIAL PLACES, for its guide (Ruby: "anytime we use a light dial as a position selector or a light
 *  selector we need some kind of indicator of where on screen we are positioning a thing before the render"): a list of
 *  marks, each drawn over the page at once while the dial moves and until the new picture has landed.
 *   sun      the light, where it comes from (the dial laid on the page; the Painted Ringworld's through its camera)
 *   impact   where Crackle's cracks burst from (on the far side from the light, as the Spreading Cracks part strikes)
 *   place    where a thing stands (Transmutation Circle: its centre, by dialSquare, and its circle's size)
 *   arrow    a heading the dial gives (wind, rain, a flow, a breath): `way` +1 toward the handle, −1 away from it
 *   axis     a line the dial lays (hatching, field lines): along the handle's line, or across it (`across`)
 *  (A surface whose dial is the day, Ringworld, has its camera's guide only.) */
const DIAL_GUIDES = {
  crackle:     [{ k: 'sun' }, { k: 'impact' }],
  summoning:   [{ k: 'place' }],
  blackhole:   [{ k: 'disc' }],                              // (the light dial places the hole: its disc's wireframe there)
  snow:        [{ k: 'arrow', fall: true }],                 // (the wind blows from the handle, the flakes fall with it: Wind is how far)
  rainstreaks: [{ k: 'arrow', way: -1 }],                    // (the rain comes from the handle)
  hatch:       [{ k: 'axis' }],                              // (strokes along the handle's line)
  suminagashi: [{ k: 'axis' }],                              // (the breaths push both ways along it)
  flowfield:   [{ k: 'arrow', way: 1 }],                     // (the current runs toward the handle)
  aurora:      [{ k: 'arrow', way: 1 }],                     // (Hem Hue to Curtain Hue, toward the handle)
  aurorasky:   [{ k: 'axis', lean: true }],                  // (the rays' tops lean toward the handle's side)
  watercolour: [{ k: 'arrow', way: 1, tilted: true }],       // (the pigment runs toward the handle, more as it lowers)
  ringworld:   [],
  landscape:   [{ k: 'sun' }],      // (its painted sun follows the dial, kept above the horizon)
};
export function dialGuideMarks(type){
  if(type === 'ringpaint') return [{ k: 'sun', ring: true }];
  if(DIAL_GUIDES[type]) return DIAL_GUIDES[type];
  const caps = capsFor(type) || {};
  return caps.light && !caps.dirOnly && (!caps.dial || /Light|Sun/.test(caps.dial)) ? [{ k: 'sun' }] : [];
}
/** Where the guide marks stand on a page aspX × aspY (the shorter side 1), for a dial at deg, tilt (0–100+). */
export function dialGuidePlace(mark, deg, tilt, aspX, aspY, knobs = {}){
  const a = (deg - 90)*Math.PI/180, hx = Math.cos(a), hy = Math.sin(a), k = Math.max(0, tilt)/100;
  if(mark.k === 'impact') return { x: aspX*(0.5 - hx*0.38), y: aspY*(0.5 - hy*0.38) };
  if(mark.k === 'place'){ const kk = Math.min(1, k), m = Math.max(Math.abs(hx), Math.abs(hy)) || 1;
    return { x: aspX*(0.5 + hx/m*kk/2), y: aspY*(0.5 + hy/m*kk/2), r: 0.34*(knobs.size || 100)/100 }; }
  if(mark.k === 'arrow' || mark.k === 'axis'){ const s = mark.k === 'arrow' ? mark.way || 1 : 1;
    let t = [hx*s, hy*s];
    if(mark.fall){ const w = Math.max(0, Math.min(1, (knobs.wind ?? 50)/100)); t = [-hx*1.6*w, 1 - hy*1.6*w]; }   // (genSnow: gravity and the wind)
    if(mark.lean) t = [0.35*hx, -1];                                                                         // (whimAurora: hem to top)
    const m = Math.hypot(t[0], t[1]) || 1;
    return { x: aspX/2, y: aspY/2, dx: t[0]/m, dy: t[1]/m, strength: mark.tilted ? Math.min(1, k) : 1 }; }
  return null;
}
/** Keep a guide up until the picture it shows has been made (Ruby: "renders can take a long time even for simple
 *  textures"), at least `min` ms after the last move, at most a minute; then fade it. A move meanwhile (`g._seq`) keeps it. */
function holdGuideUntilMade(g, min = 700){
  const seq = g._seq = (g._seq || 0) + 1, t0 = Date.now();
  setTimeout(() => { if(seq !== g._seq) return;
    let fired = false; const once = () => { if(fired || seq !== g._seq) return; fired = true;
      setTimeout(() => { if(seq === g._seq) g.classList.remove('on'); }, Math.max(0, min - (Date.now() - t0))); };
    texturesSettled().then(once); setTimeout(once, 60000); }, 140);   // (after the render has asked for its surface)
}
function drawDialGuide(on, linger){
  const type = ($('textureType') || {}).value, marks = dialGuideMarks(type), G = marks.length ? guideCanvas('sun-guide') : null; if(!G) return;
  const g = G.g;
  if(!on){ holdGuideUntilMade(g); return; }
  g._seq = (g._seq || 0) + 1;
  const dpr = G.size(), x = g.getContext('2d'); if(!x) return;
  const u = Math.min(g.width, g.height), aspX = g.width/u, aspY = g.height/u, c = cameraNow(), caps = capsFor(type) || {};
  const cs = getComputedStyle(document.body), col = n => (cs.getPropertyValue(n) || '').trim();
  const main = col('--accent') || '#E7A0B8', rimC = col('--accent-2') || '#9FD0E8', dark = 'rgba(0,0,0,.55)';
  // a light's place on the page: the Painted Ringworld's sun through its camera; else the dial laid on the page, its middle
  // the page's, in the dial's own direction exactly (Ruby: "light guide seems off": stretched to a tall page it stood
  // nearer upright than the dial), as far out as the dial's handle is, its rim at the page's edge along that way; turned
  // against a camera that turns the ground
  const turn = caps.camera && caps.camera.guide === 'plane' ? c.turn : 0;
  const sunOf = (ring, deg, tilt) => {
    if(ring){ const p = ringSunGuide(aspX, aspY, ringGuideOf('ring', type, c), deg, tilt/100); return p ? { x: p.x, y: p.y, up: p.up } : null; }
    return { ...pageSunAt(deg - turn, tilt, aspX, aspY), up: true }; };
  const deg0 = parseFloat($('textureLight').value) || 0, t0 = parseFloat(($('textureLightTilt') || {}).value), tilt0 = isNaN(t0) ? 100 : t0;
  const lights = [[deg0, tilt0, main]];
  if(lightsReach(type)){ const R = rimNow(); if(R.on || lightPick() === 'rim') lights.push([R.deg, R.tilt, rimC]); }
  x.clearRect(0, 0, g.width, g.height); x.lineCap = 'round'; x.lineJoin = 'round';
  // each mark drawn twice: a dark halo, then its colour, so it reads on any picture
  const twice = (fn, colr) => { for(const pass of [0, 1]){ x.strokeStyle = x.fillStyle = pass ? colr : dark; fn(pass, (pass ? 2 : 5)*dpr); } };
  const head = (X, Y, a, len, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(X, Y); x.lineTo(X - Math.cos(a - 0.45)*len, Y - Math.sin(a - 0.45)*len); x.moveTo(X, Y); x.lineTo(X - Math.cos(a + 0.45)*len, Y - Math.sin(a + 0.45)*len); x.stroke(); };
  // (the knobs a mark needs, found by their labels: the Transmutation Circle's size, the snow's wind)
  const knob = label => { const i = paramsFor(type).findIndex(q => q.label === label); const v = i < 0 ? NaN : parseFloat(($('texP' + (i + 1)) || {}).value); return isNaN(v) ? undefined : v; };
  const knobs = { size: knob('Circle Size') ?? 100, wind: knob('Wind') };
  for(const mark of marks){
    // (the Black Hole's disc where the light dial puts it, as the camera dial sees it)
    if(mark.k === 'disc'){ const L = cameraGuide('disc', aspX, aspY, c, { place: dialGuidePlace({ k: 'place' }, deg0, tilt0, aspX, aspY) });
      twice((pass, w) => { for(const ln of L){ x.lineWidth = w*(ln.bold ? 1 : 0.5); x.beginPath(); ln.pts.forEach((p, i) => i ? x.lineTo(p[0]*u, p[1]*u) : x.moveTo(p[0]*u, p[1]*u)); x.stroke(); } }, main);
      continue; }
    if(mark.k === 'sun'){
      for(const [deg, t, colr] of lights){ const p = sunOf(mark.ring, deg, isNaN(t) ? 100 : t); if(!p) continue;
        // (out of the frame: at its edge, with an arrow pointing out toward it)
        const m = 0.045, ex = Math.max(m, Math.min(aspX - m, p.x)), ey = Math.max(m, Math.min(aspY - m, p.y)), out = ex !== p.x || ey !== p.y;
        const X = ex*u, Y = ey*u, rs = u*0.022;
        x.globalAlpha = p.up ? 0.95 : 0.5;
        twice((pass, w) => { x.lineWidth = w; x.beginPath(); x.arc(X, Y, rs, 0, Math.PI*2); pass ? x.fill() : x.stroke();
          for(let q = 0; q < 8; q++){ const a = q*Math.PI/4; x.beginPath(); x.moveTo(X + Math.cos(a)*rs*1.6, Y + Math.sin(a)*rs*1.6); x.lineTo(X + Math.cos(a)*rs*2.6, Y + Math.sin(a)*rs*2.6); x.stroke(); }
          if(out){ const a = Math.atan2(p.y - ey, p.x - ex); head(X + Math.cos(a)*rs*3.6, Y + Math.sin(a)*rs*3.6, a, rs*1.4, w); } }, colr); }
      continue; }
    const p = dialGuidePlace(mark, deg0, tilt0, aspX, aspY, knobs); if(!p) continue;
    const X = p.x*u, Y = p.y*u; x.globalAlpha = 0.95;
    if(mark.k === 'impact') twice((pass, w) => { const r = u*0.03; x.lineWidth = w; x.beginPath();
      for(let q = 0; q < 6; q++){ const a = q*Math.PI/3 + 0.3; x.moveTo(X + Math.cos(a)*r*0.35, Y + Math.sin(a)*r*0.35); x.lineTo(X + Math.cos(a)*r*(q % 2 ? 1.6 : 1.1), Y + Math.sin(a)*r*(q % 2 ? 1.6 : 1.1)); }
      x.stroke(); }, main);
    else if(mark.k === 'place') twice((pass, w) => { const r = p.r*u, cr = u*0.025; x.lineWidth = w;
      x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.setLineDash([u*0.02, u*0.015]); x.stroke(); x.setLineDash([]);
      x.beginPath(); x.moveTo(X - cr, Y); x.lineTo(X + cr, Y); x.moveTo(X, Y - cr); x.lineTo(X, Y + cr); x.stroke(); }, main);
    else if(mark.k === 'arrow' || mark.k === 'axis'){
      // a heading or a line through the page's middle; three of them, the outer two fainter, as wind or hatching reads
      const L = Math.min(aspX, aspY)*0.36*u, a = Math.atan2(p.dy, p.dx), nx = -p.dy, ny = p.dx;
      for(const [off, al] of [[0, 0.95], [-0.22, 0.45], [0.22, 0.45]]){ x.globalAlpha = al*(0.45 + 0.55*Math.max(0.15, p.strength));
        const cx = X + nx*off*u, cy = Y + ny*off*u, len = off ? L*0.7 : L;
        twice((pass, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(cx - p.dx*len, cy - p.dy*len); x.lineTo(cx + p.dx*len, cy + p.dy*len); x.stroke();
          if(mark.k === 'arrow') head(cx + p.dx*len, cy + p.dy*len, a, u*0.04, w); }, main); } }
  }
  x.globalAlpha = 1; g.classList.add('on');
  if(linger) holdGuideUntilMade(g, 900);
}
if($('cameraDial') && $('cameraDial').addEventListener){
  const dial = $('cameraDial'), ptrs = new Map();
  let pinch0 = 0, zoom0 = 100, dragging = false;
  const fromPointer = (e, snapTicks) => {
    const rc = dial.getBoundingClientRect(), x = (e.clientX - rc.left)/rc.width*100 - 50, y = (e.clientY - rc.top)/rc.height*100 - 50;
    let turn = Math.atan2(x, -y)*180/Math.PI, view = Math.min(100, Math.hypot(x, y)/DIAL_R*100);
    if(snapTicks || view > 88){ const nearest = Math.round(turn/45)*45; if(Math.abs(nearest - turn) < 7) turn = nearest; }
    if(Math.abs(view - 50) < 4) view = 50;
    if(view > 96) view = 100;
    const c = cameraNow(); setCamera(turn, view, c.zoom, false);
  };
  dial.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); if(dial.setPointerCapture) dial.setPointerCapture(e.pointerId);
    if(ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; zoom0 = cameraNow().zoom; dragging = false; return; }
    dragging = true; fromPointer(e, e.target && e.target.classList && e.target.classList.contains('ld-tick')); });
  dial.addEventListener('pointermove', e => { if(!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    // two fingers: a pinch zooms, as on a photo
    if(ptrs.size === 2){ const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, c = cameraNow(); setCamera(c.turn, c.view, zoom0*d/pinch0, false); return; }
    if(dragging) fromPointer(e, false); });
  const end = e => { ptrs.delete(e.pointerId); if(ptrs.size === 0){ dragging = false; drawCameraGuide(false); if(typeof commitSoon === 'function') commitSoon(); } };
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  dial.addEventListener('wheel', e => { e.preventDefault(); const c = cameraNow(); setCamera(c.turn, c.view, c.zoom*Math.exp(-e.deltaY*0.0015), false); clearTimeout(dial._wt); dial._wt = setTimeout(() => { drawCameraGuide(false); if(typeof commitSoon === 'function') commitSoon(); }, 350); }, { passive: false });
  // keys: arrows turn it by 15°, page up/down lower and raise it, + and − zoom
  dial.addEventListener('keydown', e => { const c = cameraNow();
    const map = { ArrowRight: [15, 0, 1], ArrowDown: [15, 0, 1], ArrowLeft: [-15, 0, 1], ArrowUp: [-15, 0, 1], PageUp: [0, -10, 1], PageDown: [0, 10, 1], '+': [0, 0, 1.25], '=': [0, 0, 1.25], '-': [0, 0, 0.8] };
    if(map[e.key]){ e.preventDefault(); const [dt, dv, dz] = map[e.key]; setCamera(c.turn + dt, c.view + dv, c.zoom*dz, true); } });
}
// the zoom's slider: twice as close for every hundred to the right (100% at its middle, 25% and 400% at its ends)
{ const z = $('cameraZoomSlider');
  if(z && z.addEventListener){
    z.addEventListener('input', () => { const c = cameraNow(); setCamera(c.turn, c.view, 100*Math.pow(2, (+z.value || 0)/100), false); });
    z.addEventListener('change', () => { const c = cameraNow(); setCamera(c.turn, c.view, 100*Math.pow(2, (+z.value || 0)/100), true); }); } }
if($('cameraReset') && $('cameraReset').addEventListener) $('cameraReset').addEventListener('click', () => { const d = cameraStart($('textureType').value); setCamera(d.turn, d.view, d.zoom, true); });
// typing the camera's numbers sets it exactly
for(const id of ['cameraTurnIn', 'cameraViewIn', 'cameraZoomInput']) if($(id) && $(id).addEventListener) $(id).addEventListener('change', () => {
  const c = cameraNow(), n = k => { const v = parseFloat(($(k) || {}).value); return isNaN(v) ? null : v; };
  setCamera(n('cameraTurnIn') ?? c.turn, n('cameraViewIn') ?? c.view, n('cameraZoomInput') ?? c.zoom, true); });
/** How far the dial reaches: past its rim (130) only for engine-lit textures. */
function dialMax(){ const t = $('textureType'); return (t && (capsFor(t.value) || {}).lowLight) ? 130 : 100; }
syncLightPad();
$('textureBlend').addEventListener('change', () => { keepGround(''); scheduleRender(); });
/** The ground an older look's surface was made on, kept while its blend is the one it was saved with
 *  (canvasRenderer `textureGround`: before every blend was offered, a lower surface on a blend not made for
 *  it was drawn on its own first blend's ground). Choosing a blend lets it go. */
function keepGround(ground){
  const b = $('textureBlend'); if(!b || !b.dataset) return;
  b.dataset.ground = ground && SURFACE_BLENDS.includes(ground) ? ground : '';
  b.dataset.groundFor = b.dataset.ground ? b.value : '';
}
// choosing a tint yourself stops it following the accents
bindColorField('textureTint1Hex', ()=>{ if(!state.ui.tintBySystem) state.ui.tintFollows[0] = false; scheduleRender(); });
bindColorField('textureTint2Hex', ()=>{ if(!state.ui.tintBySystem) state.ui.tintFollows[1] = false; scheduleRender(); });
[9, 10, 11, 12].forEach((n, i) => bindColorField('textureTint' + n + 'Hex', ()=>{ if(!state.ui.tintBySystem) state.ui.tintFollows[i + 2] = false; scheduleRender(); }));
bindColorField('textureTint3Hex', ()=>scheduleRender());
bindColorField('textureTint4Hex', ()=>scheduleRender());
bindColorField('textureTint5Hex', ()=>scheduleRender());
bindColorField('textureTint6Hex', ()=>scheduleRender());
bindColorField('textureTint7Hex', ()=>{ syncLightPad(); scheduleRender(); });   // (the rim light: its alpha turns it on and off)
bindColorField('textureTint8Hex', ()=>scheduleRender());
/** A label's own words, leaving what else lives in it (its padlock) alone —
 *  writing textContent wiped the lock off every hue whose name changes. */
// (a function, not a const: labels are renamed at boot, before this line runs)
function textNode(el){ return (el && el.childNodes && typeof el.childNodes[Symbol.iterator] === 'function') ? [...el.childNodes].find(n => n.nodeType === 3) : null; }
function labelText(el){ const t = textNode(el); return t ? t.nodeValue.trim() : String(el.textContent || '').trim(); }
/** Each hue group's heading (Light, Surface, Material Colors) shows while one of the hues after it, up to the next
 *  heading, does. */
function syncHueHeads(){
  for(const id of ['hueHeadLight', 'hueHeadSurface', 'hueHeadMaterial']){ const h = $(id); if(!h || !h.classList) continue;
    let any = false; for(let r = h.nextElementSibling; r && !(r.classList && r.classList.contains('hue-head')) && r.id !== 'seedRow'; r = r.nextElementSibling)
      if(r.classList && !r.classList.contains('tool-hidden')) any = true;
    h.classList.toggle('tool-hidden', !any); }
}
function setLabelText(el, text){
  if(!el) return;
  if(!el.childNodes || typeof el.childNodes[Symbol.iterator] !== 'function'){ el.textContent = text; return; }   // (a bare stand-in element)
  const t = textNode(el);
  if(t) t.nodeValue = text; else el.insertBefore(document.createTextNode(text), el.firstChild);
}
/** The fifth hue's "none" for a texture: black for a glow, mid-grey for a
 *  grey texture's material, white for a base colour. */
function hue5Default(type){ const h = (capsFor(type) || {}).hue5; return h ? h.def : '#000000'; }

// ---------- locks ----------
// A locked control survives Randomize and preset changes. Rather than
// teaching every one of those paths about every control, the locked values
// are snapshotted before the change and written back after -- which works
// for any control, including ones added later.

/** The nearest enclosing .field / .check-row, however deeply the control is
 *  wrapped. Used so a lock always lands next to its setting's name. */
function nearestField(node){
  let el = node, firstField = null;
  for(let i = 0; i < 7 && el; i++){
    const isField = el.classList &&
      (el.classList.contains('field') || el.classList.contains('check-row'));
    if(isField){
      if(!firstField) firstField = el;
      // Keep walking past a field that holds no label of its own — the
      // texture seed, for one, sits in a bare inner .field inside a labelled
      // outer one, and stopping at the inner one left its lock stranded
      // below the input with nothing to sit beside.
      if(el.querySelector && el.querySelector('label')) return el;
    }
    el = el.parentElement;
  }
  return firstField || node.parentElement;
}

function installLocks(){
  for(const id of LOCKABLE){
    const node = $(id);
    if(!node || !node.parentElement) continue;
    // Several controls sit inside a wrapper (.angle-wrap, .color-pair, .row),
    // so the input's immediate parent is NOT the field and holds no label —
    // the lock then fell through to the wrapper and rendered underneath the
    // control instead of beside its name. Walk up to the real field first.
    const field = nearestField(node);
    const host = (field && field.querySelector && field.querySelector('label')) || field;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lock-btn';
    btn.title = PAGE_SAYS.lock;
    btn.innerHTML = LOCK_GLYPH;
    const paint = ()=>{
      const on = state.locks.has(id);
      btn.classList.toggle('locked', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on ? PAGE_SAYS.locked : PAGE_SAYS.lock;
      // the control itself dims, so a locked setting is obvious at a glance
      if(field && field.classList) field.classList.toggle('field-locked', on);
    };
    btn.addEventListener('click', ()=>{
      if(state.locks.has(id)) state.locks.delete(id); else state.locks.add(id);
      murmur.play(state.locks.has(id) ? 'lock' : 'unlock');
      paint(); paintMasterLocks();
    });
    btn._paint = paint;
    lockButtons.set(id, btn);
    if(host && host.appendChild) host.appendChild(btn);
    guardLabelTaps(host, btn);
  }
}

/** A LABEL HANDS ITS TAPS TO THE FIRST BUTTON IN IT (Ruby: a scroll that began on a control's name locked it):
 *  a label holding a padlock keeps them, so only the padlock itself locks. */
export function guardLabelTaps(host, btn){   // test hook: locks.test taps a name and a padlock
  if(host && host.tagName === 'LABEL' && !host.htmlFor && host.addEventListener)
    host.addEventListener('click', e => { if(e.target !== btn && !(btn.contains && btn.contains(e.target))) e.preventDefault(); });
}
/** Rebuilds the lock set and the buttons' appearance from a saved list. */
function restoreLockState(ids){
  state.locks.clear();
  for(const id of ids) if(LOCKABLE.includes(id)) state.locks.add(id);
  for(const [, btn] of lockButtons) if(btn._paint) btn._paint();
  paintMasterLocks();
}

// ---------- MASTER LOCKS and EYES, in the headings ----------
// Every section's heading has a master lock: it locks (or, when all are
// locked, unlocks) every lockable control beneath it — a card, or a sub-section
// within one. Half-closed when only some are locked. The checkboxes that
// switched a section on are EYES now (open: shown); a card's own eye sits in
// its heading, beside its lock, far enough from the fold not to be hit by it.
const masterLocks = [];
function lockablesIn(root){ return LOCKABLE.filter(id => { const el = $(id); return el && root.contains && root.contains(el); }); }
function paintMasterLocks(){
  for(const m of masterLocks){
    const ids = lockablesIn(m.root), n = ids.filter(id => state.locks.has(id)).length;
    m.btn.classList.toggle('locked', ids.length > 0 && n === ids.length); m.btn.classList.toggle('partial', n > 0 && n < ids.length);
    m.btn.title = n === ids.length && n ? 'Everything here is locked. Click to unlock it all.' : n ? `${n} of ${ids.length} locked here. Click to lock them all.` : 'Lock everything in this section against dice and presets';
    m.btn.setAttribute('aria-pressed', n === ids.length && n ? 'true' : n ? 'mixed' : 'false');
  }
  paintFreeze();          // (the seed's lock has a button of its own above the presets)
}
function headTools(head){
  let t = head.querySelector(':scope > .head-tools');
  if(!t){ t = document.createElement('span'); t.className = 'head-tools'; head.insertBefore(t, head.firstChild); }
  return t;
}
// THE HINTS, WRITTEN OUT (the usability review: some two hundred hints lived only in title attributes, which a touch
// screen never shows): ⓘ in a card's heading writes each hint under the control it belongs to, as it reads now
// (some change with the surface), and takes them away again
const HINT_SKIP = '.head-tools, .lock-btn, .die-pair, .tip-line, option, .grimoire-row, .chip, .preset-btn, .preset-grid, .filmstrip';
function writeHints(card){
  for(const t of card.querySelectorAll('.tip-line')) t.remove();
  const said = new Map();          // each place's hints so far: a hint said once there is said once
  for(const el of card.querySelectorAll('[title]')){
    const text = String(el.title || '').trim(); if(!text || (el.closest && el.closest(HINT_SKIP))) continue;
    // (a box whose own label has a hint: the label's is the one said)
    if(el.tagName === 'INPUT' && el.id && card.querySelector(`label[for="${el.id}"][title]`)) continue;
    const home = (el.tagName === 'LABEL' || el.tagName === 'INPUT' || el.tagName === 'SELECT') ? nearestField(el) : (el.closest && el.closest('.btn-row, .field, .check-row, .row')) || el.parentElement;
    if(!home) continue;
    const here = said.get(home) || new Set(); if(here.has(text)) continue; here.add(text); said.set(home, here);
    // (a button among others is named in its hint; one alone, or a hint shorter than a phrase, needs no more)
    if(text.length < 8) continue;
    const name = el.tagName === 'BUTTON' && [...(home.children || [])].filter(c => c.tagName === 'BUTTON' && c.title).length > 1 ? String(el.textContent || el.getAttribute('aria-label') || '').trim() : '';
    const tip = document.createElement('small'); tip.className = 'tip-line';
    tip.textContent = name && name.length < 40 ? name + ': ' + text : text;
    home.appendChild(tip);
  }
}
// a card's hints shown or taken away (opened: its section unfolds too, as ⓘ was pressed to read it)
function showHints(card, on, unfold){
  card.classList.toggle('hints-open', on);
  if(on){ writeHints(card); if(unfold && !card.open) card.open = true; } else for(const t of card.querySelectorAll('.tip-line')) t.remove();
  const btn = card.querySelector(':scope > summary .hint-btn');
  if(btn){ btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.title = on ? PAGE_SAYS.hintsHide : PAGE_SAYS.hintsShow; btn.setAttribute('aria-label', btn.title); }
}
function addHintsButton(card, head){
  if(!card || !head || !card.querySelector('[title]')) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'hint-btn'; btn.textContent = 'ⓘ';
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();                     // never folds the section it sits in
    showHints(card, !card.classList.contains('hints-open'), true);
    if(btn.blur && e.pointerType !== 'keyboard' && e.detail > 0) btn.blur();   // (a tap leaves no focus ring that reads as "on")
  });
  headTools(head).appendChild(btn); showHints(card, false);
}
// THE HINTS SWITCH (Esoterica → Interface; Ruby: smaller, and switchable — "information density is necessary too"):
// on, every section's hints are written out (and kept current as the page changes); off, only where ⓘ asks.
// This browser's preference, never part of a look.
const HINTS_ON = 'uv.hints.on';
function hintsEverywhere(){ const b = $('hintsToggle'); return !!(b && b.checked); }
function refreshHints(){ if(typeof document.querySelectorAll !== 'function') return;
  for(const card of document.querySelectorAll('details.card[data-tab]')) if(card.querySelector(':scope > summary .hint-btn')){
    if(hintsEverywhere()) showHints(card, true, false); else if(card.classList.contains('hints-open')) writeHints(card); } }
function addMasterLock(root, head){
  if(!root || !head || !lockablesIn(root).length) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'lock-btn master-lock'; btn.innerHTML = LOCK_GLYPH;
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();                     // never folds the section it sits in
    const ids = lockablesIn(root), all = ids.every(id => state.locks.has(id));
    for(const id of ids) all ? state.locks.delete(id) : state.locks.add(id);
    murmur.play(all ? 'unlock' : 'lock');
    for(const [, b] of lockButtons) if(b._paint) b._paint();
    paintMasterLocks();
  });
  headTools(head).appendChild(btn); masterLocks.push({ root, btn });
}
// ---------- THE DICE (Ruby): a die beside every section's lock rerolls only that section ----------
// Locked controls are never touched: a roll skips them, and withLocksPreserved puts back anything a
// change set off in them (Ruby: locks supersede randomization). On the Surface, Shift-click rolls
// only the seed: the same texture, a new pattern (the seed keeps its own lock too).
// THREE WAYS (Ruby, ROADMAP E1), chosen from a long press on a phone and ▾ beside the die on a desk.
// The way last chosen is REMEMBERED (an app preference) and every die and Summon button rolls that way:
//   gentle — sliders ±8% of their range; colours drift together; the light dial moves a little;
//            menus and switches stay, so the surface never changes; a typeface may become a similar one
//   usual  — the Summon buttons' known-good schemes; elsewhere every slider, menu and colour in reason
//   wild   — sliders anywhere in their range, every menu, any colour, the light anywhere (never a switch)
// and BACK (E2): the section returns to how it was before its last roll, whatever else has changed since.
const DIE_SUMMONS = { randomBgBtn: 1, randomSurfaceBtn: 1, randomFontBtn: 1 };
const DIE_GENTLE = 0.08, DIE_LEVELS = ['gentle', 'usual', 'wild'], DIE_LEVEL_KEY = 'uv.dice.level';
const DIE_GLYPH = { gentle: '⚁', usual: '⚄', wild: '⚅' };
function dieLevel(){ try { const v = localStorage.getItem(DIE_LEVEL_KEY); if(DIE_LEVELS.includes(v)) return v; } catch(e){} return 'usual'; }
function setDieLevel(level){ if(!DIE_LEVELS.includes(level)) return; try { localStorage.setItem(DIE_LEVEL_KEY, level); } catch(e){} paintDice(); }
const dieWord = level => DIE[level + 'Word'] || level;
function dieHsl(hex){ const { r, g, b } = hexToRgbObj(hex || '#808080'), R = r/255, G = g/255, B = b/255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn)/2, d = mx - mn;
  if(!d) return [0, 0, l];
  const s = d/(1 - Math.abs(2*l - 1)), h = mx === R ? ((G - B)/d + 6) % 6 : mx === G ? (B - R)/d + 2 : (R - G)/d + 4;
  return [h*60, Math.min(1, s), l]; }
const dieClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dieRollable = id => { const el = $(id); return !!el && !el.disabled && !state.locks.has(id) && !(el.closest && el.closest('.tool-hidden')); };
/** A typeface close to this one: the same family of faces (FONT_GROUPS), never the same one. */
function similarFont(i){
  const fam = (FONTS[i] || {}).family, group = (FONT_GROUPS.find(([, fs]) => fs.includes(fam)) || [null, []])[1];
  const near = FONTS.map((f, k) => k).filter(k => k !== i && group.includes(FONTS[k].family));
  return near.length ? near[Math.floor(Math.random()*near.length)] : i;
}
/** The menus a roll may choose among (the Athanor only when there is a graph to draw; a surface's blend
 *  among those made for it, unless the roll is wild). */
function dieOptions(el, level){
  const graph = (($('forgeGraph') || {}).value || '').length > 40;
  const suits = el.id === 'textureBlend' && level !== 'wild' ? capsFor($('textureType').value).blends : null;
  return [...el.options].filter(o => !o.disabled && !o.hidden && o.value !== '' && !(el.id === 'textureType' && (TRY_GRAPH.test(o.value) || (o.value === 'athanor' && !graph))) && (!suits || suits.includes(o.value)));
}
function rollSection(root, level = 'usual', opts = {}){
  const shift = (Math.random()*2 - 1)*15;     // gently: every colour drifts by the same few degrees…
  withLocksPreserved(() => {
    const ids = () => lockablesIn(root).filter(id => dieRollable(id) && id !== 'textureSeedValue' && id !== 'textureLight');
    // menus first: a new surface relabels its sliders, which are rolled after it
    for(const id of ids().filter(id => $(id).tagName === 'SELECT')){ const el = $(id);
      if(level === 'gentle'){
        // the surface (and every other menu) stays; a typeface may become a similar one
        if(id === 'fontFamily' && (opts.summon || Math.random() < 0.6)){ const k = similarFont(+el.value); if(String(k) !== el.value){ el.value = String(k); el.dispatchEvent(new Event('change', { bubbles: true })); } }
        continue;
      }
      const o = dieOptions(el, level);
      if(o.length > 1){ el.value = o[Math.floor(Math.random()*o.length)].value; el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    for(const id of ids().filter(id => $(id).tagName !== 'SELECT')) rollControl(id, level, shift);
    // the light dial: a little way round when gentle, anywhere when wild
    if(root.contains && $('textureLight') && root.contains($('textureLight')) && dieRollable('textureLight') && level !== 'usual'){
      const deg = parseFloat($('textureLight').value) || 0, tilt = parseFloat(($('textureLightTilt') || {}).value); const t = isNaN(tilt) ? 100 : tilt;
      if(level === 'gentle') setLight(deg + (Math.random()*2 - 1)*15, t + (Math.random()*2 - 1)*8, false);
      else setLight(Math.random()*360, Math.random()*dialMax(), false);
    }
    if(level === 'wild' && root.contains && $('textureSeedValue') && root.contains($('textureSeedValue'))) maybeRerollSeed();
    scheduleRender();
  });
}
/** One slider or color, rolled the die's way (a section's roll goes through here, control by control). */
function rollControl(id, level, shift = 0){ const el = $(id); if(!el) return;
  if(el.type === 'range'){ const lo = +el.min || 0, hi = +el.max || 100, st = +el.step || 1;
    const v = level === 'gentle' ? dieClamp((+el.value || 0) + (Math.random()*2 - 1)*DIE_GENTLE*(hi - lo), lo, hi)
      : lo + (level === 'wild' ? Math.random() : 0.1 + Math.random()*0.8)*(hi - lo);
    el.value = String(Math.round(v/st)*st); el.dispatchEvent(new Event('input', { bubbles: true })); }
  else if(/Hex$/.test(id)){
    // (the rim light's hue rolls its colour only: its alpha is whether it is on, and how strongly)
    const keepA = id === 'textureTint7Hex' && /^#[0-9a-f]{8}$/i.test(el.value || '') ? el.value.slice(7, 9) : '', set = (k, v) => setColorField(k, keepA ? v.slice(0, 7) + keepA : v);
    // …and each moves a touch of its own
    if(level === 'gentle'){ const [h, sa, l] = dieHsl(el.value);
      set(id, hslHex((((h + shift + (Math.random()*2 - 1)*4) % 360) + 360) % 360, dieClamp(sa + (Math.random()*2 - 1)*0.05, 0, 1), dieClamp(l + (Math.random()*2 - 1)*0.03, 0.02, 0.98))); }
    else if(level === 'wild') set(id, hslHex(Math.random()*360, Math.random(), 0.05 + Math.random()*0.9));
    else { const c = hexToRgbObj(el.value || '#808080'), l = (Math.max(c.r, c.g, c.b) + Math.min(c.r, c.g, c.b))/510;
      set(id, hslHex(Math.random()*360, 0.3 + Math.random()*0.5, dieClamp(l + (Math.random() - 0.5)*0.2, 0.08, 0.92))); } }
  else if(el.tagName === 'SELECT' && level !== 'gentle'){ const o = dieOptions(el, level); if(o.length > 1){ el.value = o[Math.floor(Math.random()*o.length)].value; el.dispatchEvent(new Event('change', { bubbles: true })); } }
  // (switches are never rolled: they show and hide whole sections, and sit beside the locks)
}
// ONE CONTROL AT RANDOM (ROADMAP E3, Filter Forge's Ctrl-click): Ctrl- or ⌘-click a control's name on a desk, or
// hold it on a phone, and only that control rolls, the dice's way. A locked control stays, and says so.
function rollByLabel(label){
  const field = label.closest && label.closest('.field'); if(!field) return false;
  const ids = lockablesIn(field).filter(id => $(id).tagName === 'SELECT' || $(id).type === 'range' || /Hex$/.test(id)); if(!ids.length) return false;
  const free = ids.filter(dieRollable); if(!free.length){ toast(DIE.oneLocked); return true; }
  const before = serializeCurrentSettings();
  withLocksPreserved(() => { for(const id of free) rollControl(id, dieLevel()); scheduleRender(); });
  if(JSON.stringify(before) !== JSON.stringify(serializeCurrentSettings())){ murmur.play('reroll'); commitSoon(); }
  return true;
}
if(document.addEventListener){
  // (a control's name: its label, never a button or a field inside it — the padlock sits in the label)
  const labelOf = e => { const t = e.target; if(!t || !t.closest || t.closest('button, input, select, a')) return null; return t.closest('label'); };
  document.addEventListener('click', e => { if(!(e.ctrlKey || e.metaKey)) return; const l = labelOf(e); if(l && rollByLabel(l)){ e.preventDefault(); e.stopPropagation(); } }, true);
  let hold = null;
  document.addEventListener('pointerdown', e => { if(e.pointerType !== 'touch') return; const l = labelOf(e); if(!l) return;
    const x0 = e.clientX, y0 = e.clientY; hold = { l, x0, y0, t: setTimeout(() => { if(hold && hold.l === l){ hold.fired = rollByLabel(l); } }, 550) }; }, true);
  const end = e => { if(!hold) return; clearTimeout(hold.t); if(hold.fired && e && e.cancelable) e.preventDefault(); hold = null; };
  document.addEventListener('pointermove', e => { if(hold && Math.hypot(e.clientX - hold.x0, e.clientY - hold.y0) > 10){ clearTimeout(hold.t); hold = null; } }, true);
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
}
// BACK: each section remembers the look just before and just after its last roll; Back puts back
// only what that roll changed, so edits made since in other sections stay.
const dieRolls = new Map(), diePending = new Map();
const summonIn = root => Object.keys(DIE_SUMMONS).map(id => $(id)).find(b => b && root.contains && root.contains(b));
function rollWithBack(root, level){
  const before = serializeCurrentSettings(), own = summonIn(root);
  if(own){
    // a section with a Summon button rolls through it (it rolls the remembered way). It may ask first
    // (past a few edits): the roll is recorded when its own work has run
    const old = diePending.get(root); if(old) own.removeEventListener('click', old);
    const rec = () => { diePending.delete(root); setTimeout(() => dieRolls.set(root, { before, after: serializeCurrentSettings() }), 0); };
    diePending.set(root, rec); own.addEventListener('click', rec, { once: true });
    own.click(); return;                       // (it plays its own sound)
  }
  try { rollSection(root, level); } finally { dieRolls.set(root, { before, after: serializeCurrentSettings() }); }
  murmur.play('reroll'); commitSoon();
}
function dieBack(root){
  const r = dieRolls.get(root); if(!r) return false;
  const now = serializeCurrentSettings(), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for(const k of new Set([...Object.keys(r.before), ...Object.keys(r.after)])) if(!same(r.before[k], r.after[k])) now[k] = r.before[k];
  dieRolls.delete(root);
  withLocksPreserved(() => restoreSettings(now));
  scheduleRender(); commitHistory(); murmur.play('undo');
  return true;
}
// every die shows the way it will roll (⚁ gently, ⚄ as usual, ⚅ wildly), and says so
const dieButtons = [];
function paintDice(){
  const lv = dieLevel(), phone = !!(document.body && document.body.classList && document.body.classList.contains('is-mobile'));
  for(const d of dieButtons){ d.btn.textContent = DIE_GLYPH[lv];
    d.btn.title = fill(phone ? DIE.titlePhone : d.surface ? DIE.titleSurface : DIE.title, dieWord(lv)); d.btn.setAttribute('aria-label', d.btn.title); d.btn.dataset.level = lv; }
  for(const id of Object.keys(DIE_SUMMONS)){ const b = $(id); if(b && b.setAttribute){ b.title = fill((DIE.summon && DIE.summon[id]) || DIE.summonTitle, dieWord(lv)); b.dataset.level = lv; } }
}
// the dice's menu: beside the die on a desk, a sheet from the bottom on a phone (CSS)
let dieMenu = null;
function closeDieMenu(){ if(dieMenu){ dieMenu.remove(); dieMenu = null; } }
/** A small menu of actions: beside its anchor on a desk, a sheet from the bottom on a phone (the dice's,
 *  and a kept surface's long press). items: { glyph, label, hint, act, disabled, danger, checked, now }. */
function openSheetMenu(anchor, title, items){
  closeDieMenu();
  const m = document.createElement('div'); m.className = 'die-menu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', title);
  const head = document.createElement('div'); head.className = 'die-menu-head'; head.textContent = title; m.appendChild(head);
  for(const it of items){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'die-menu-item' + (it.danger ? ' danger' : '') + (it.checked ? ' current' : ''); b.disabled = !!it.disabled;
    b.setAttribute('role', it.checked !== undefined ? 'menuitemradio' : 'menuitem'); if(it.checked !== undefined) b.setAttribute('aria-checked', it.checked ? 'true' : 'false');
    const g = document.createElement('span'); g.className = 'die-menu-glyph'; g.textContent = it.glyph || ''; g.setAttribute('aria-hidden', 'true');
    const t = document.createElement('span'); t.className = 'die-menu-text';
    const n = document.createElement('span'); n.className = 'die-menu-label'; n.textContent = it.label; t.appendChild(n);
    if(it.hint){ const h = document.createElement('span'); h.className = 'die-menu-hint'; h.textContent = it.hint; t.appendChild(h); }
    if(it.now){ const w = document.createElement('span'); w.className = 'die-menu-now'; w.textContent = it.now; t.appendChild(w); }
    b.appendChild(g); b.appendChild(t);
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); closeDieMenu(); it.act(); });
    m.appendChild(b);
  }
  document.body.appendChild(m); dieMenu = m;
  if(!document.body.classList.contains('is-mobile') && anchor && anchor.getBoundingClientRect){
    const r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    m.style.left = Math.max(8, Math.min(vw - w - 8, r.right - w)) + 'px';
    m.style.top = (r.bottom + 6 + h > vh - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
  }
  const first = m.querySelector('.die-menu-item:not([disabled])'); if(first && first.focus) first.focus({ preventScroll: true });
}
function openDieMenu(root, anchor, surface){
  const lv = dieLevel(), has = dieRolls.has(root);
  openSheetMenu(anchor, DIE.menuTitle, [
    ...DIE_LEVELS.map(way => ({ glyph: DIE_GLYPH[way], label: DIE[way], hint: DIE[way + 'Hint'], checked: way === lv, now: way === lv ? DIE.now : '',
      act: () => { setDieLevel(way); rollWithBack(root, way); } })),
    ...(surface ? [{ glyph: '⁂', label: DIE.seed, hint: DIE.seedHint, act: () => { maybeRerollSeed(); scheduleRender(); murmur.play('reroll'); } }] : []),
    { glyph: '↶', label: DIE.back, hint: has ? DIE.backHint : DIE.backNone, disabled: !has, act: () => dieBack(root) }]);
}
if(typeof document.addEventListener === 'function'){
  document.addEventListener('pointerdown', e => { if(dieMenu && !dieMenu.contains(e.target) && !(e.target.closest && e.target.closest('.die-more'))) closeDieMenu(); }, true);
  document.addEventListener('keydown', e => { if(dieMenu && e.key === 'Escape'){ closeDieMenu(); } });
}
function addDie(root, head){
  if(!root || !head || !lockablesIn(root).length) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'die-btn'; btn.textContent = '⚄';
  const surface = !!($('randomSurfaceBtn') && root.contains && root.contains($('randomSurfaceBtn')));
  const phone = () => !!(document.body && document.body.classList && document.body.classList.contains('is-mobile'));
  btn.setAttribute('aria-haspopup', 'menu'); dieButtons.push({ btn, surface });
  // a long press: on a phone, the menu (as soon as it is held); on a desk, the Surface's seed alone
  let held = false, timer = 0;
  btn.addEventListener('pointerdown', () => { held = false; clearTimeout(timer);
    timer = setTimeout(() => { held = true; if(phone()) openDieMenu(root, btn, surface); }, 500); });
  btn.addEventListener('pointerup', () => clearTimeout(timer));
  btn.addEventListener('pointercancel', () => clearTimeout(timer));
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();                     // never folds the section it sits in
    const wasHeld = held; held = false;
    if(wasHeld && phone()) return;                               // (the menu is already open)
    if(surface && (e.shiftKey || wasHeld)){ maybeRerollSeed(); scheduleRender(); murmur.play('reroll'); return; }
    rollWithBack(root, dieLevel());
  });
  // (a long press must not open the phone's context menu)
  btn.addEventListener('contextmenu', e => e.preventDefault());
  // on a desk: ▾ beside the die opens the same menu
  const more = document.createElement('button'); more.type = 'button'; more.className = 'die-more'; more.textContent = '▾';
  more.title = DIE.more; more.setAttribute('aria-label', DIE.more); more.setAttribute('aria-haspopup', 'menu');
  more.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if(dieMenu){ closeDieMenu(); return; } openDieMenu(root, more, surface); });
  const pair = document.createElement('span'); pair.className = 'die-pair'; pair.appendChild(btn); pair.appendChild(more);
  headTools(head).appendChild(pair);
}
// the switches that show a whole card, moved into its heading as an eye
const CARD_EYES = { textureToggle: 'Show the surface', borderToggle: 'Show the border', cardToggle: 'Show the inset box', vignetteToggle: 'Show the vignette' };
// inside a card, an eye only where a box shows or hides something (the spell code); an option that turns a feature on
// is a switch (Ruby approved, from the usability review: eyes on Gradient Border? and Allow [Opposition] read as
// show/hide when they are not)
const EYES = ['spellMark'];
const SWITCHES = ['bgGradientToggle', 'textGradientToggle', 'accent1Toggle', 'accent2Toggle', 'baseToggle', 'borderGradientToggle', 'cardGradientToggle'];
// A SECTION'S NAME OPENS AND FOLDS IT, in every browser (Ruby, in Firefox on a phone: tapping Border Options, Inset Box
// or Vignette did nothing). Firefox on a phone moves a tap that lands on something it thinks cannot be tapped to the
// nearest thing that can, and a heading whose only tappable parts are its eye, die, lock and ⓘ lost its taps. A heading
// that listens for taps counts as tappable there; it opens or folds its section itself, once (the browser's own toggle
// is cancelled), and leaves a tap on its own controls to them.
export function headingTaps(root){   // test hook: interface.test taps a heading and its eye
  if(!root || typeof root.querySelectorAll !== 'function') return;
  for(const s of root.querySelectorAll('details > summary')){
    if(s._taps || !s.addEventListener) continue; s._taps = true;
    s.addEventListener('click', e => {
      const d = s.parentElement, t = e.target, ctl = t && t.closest ? t.closest('button, input, select, textarea, a, label') : null;
      if(!d || d.tagName !== 'DETAILS' || (ctl && ctl !== s && s.contains(ctl))) return;
      e.preventDefault(); d.open = !d.open;
    });
  }
}
// A SECTION SWITCHED OFF still shows what it holds (Ruby, on a phone: Border Options and Inset Box "flicker" and open
// empty: all their controls live in the block their eye shows): faded under a line that says it is off, and the first
// change made there by hand (a tap, a slide, a choice; never the dice or a loaded look, whose events aren't the
// person's) switches it on, as moving the rim light does
const EYE_BLOCKS = { textureToggle: 'textureBlock', borderToggle: 'borderBlock', cardToggle: 'cardBlock', vignetteToggle: 'vignetteBlock' };
export function eyeBlock(box, card){   // test hook: textureLayers.test wakes a section that is off (the mock has no headings to install)
  const block = $(EYE_BLOCKS[box.id]); if(!block || !block.classList || !card.contains || !card.contains(block)) return;
  block.classList.add('eye-block');
  if(EYE_OFF[box.id] && typeof document.createElement === 'function' && block.insertBefore){
    const note = document.createElement('p'); note.className = 'eye-off-note'; note.textContent = EYE_OFF[box.id]; block.insertBefore(note, block.firstChild); }
  const wake = e => {
    if(box.checked || !e.isTrusted) return;
    const t = e.target; if(!t || !t.closest || !t.closest('input, select, textarea, button, label, .clr-field') || t.closest('.eye-off-note')) return;
    box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true }));
  };
  for(const ev of ['click', 'input', 'change']) block.addEventListener(ev, wake, true);
}
function installHeadings(){
  if(typeof document.querySelectorAll !== 'function') return;
  headingTaps(document);
  for(const [id, title] of Object.entries(CARD_EYES)){
    const box = $(id), card = box && box.closest && box.closest('details.card'), head = card && card.querySelector(':scope > summary');
    if(!head) continue;
    const row = box.closest('.check-row');
    box.classList.add('eye'); box.title = title; box.setAttribute('aria-label', title);
    // a click on the eye shows or hides; it never opens or folds the section
    box.addEventListener('click', e => { e.stopPropagation(); const was = card.open; setTimeout(() => { if(card.open !== was) card.open = was; }, 0); });
    headTools(head).appendChild(box);
    if(row) row.hidden = true;
    eyeBlock(box, card);
  }
  for(const id of EYES){ const box = $(id); if(box && box.classList){ box.classList.add('eye'); if(!box.title) box.title = 'Show or hide'; } }
  for(const id of SWITCHES){ const box = $(id); if(box && box.classList) box.classList.add('switch'); }
  for(const card of document.querySelectorAll('details.card[data-tab]:not([data-tab="more"])')){ addDie(card, card.querySelector(':scope > summary')); addMasterLock(card, card.querySelector(':scope > summary')); }
  for(const card of document.querySelectorAll('details.card[data-tab]')) addHintsButton(card, card.querySelector(':scope > summary'));
  // a sub-section's lock sits in the row that switches it on (its eye and name)
  for(const sub of document.querySelectorAll('.subblock[id]')){
    const prev = sub.previousElementSibling; if(prev && prev.classList && prev.classList.contains('check-row') && !prev.hidden) addMasterLock(sub, prev);
  }
  paintMasterLocks(); paintDice();
}

function snapshotLocked(){
  const snap = {};
  for(const id of state.locks){
    const n = $(id);
    if(n) snap[id] = (n.type === 'checkbox') ? n.checked : n.value;
  }
  return snap;
}
function restoreLocked(snap){
  // menus first: putting back a surface resets its sliders, which are put back after it
  const ids = Object.keys(snap), isMenu = id => { const n = $(id); return !!n && n.tagName === 'SELECT'; };
  for(const id of [...ids.filter(isMenu), ...ids.filter(id => !isMenu(id))]){
    const n = $(id);
    if(!n) continue;
    // unchanged: nothing to restore, and no change to announce (a texture
    // "changed" to itself would reset its knobs to their defaults)
    if((n.type === 'checkbox' ? n.checked : n.value) === snap[id]) continue;
    if(n.type === 'checkbox') n.checked = snap[id];
    else n.value = snap[id];
    // value readouts and swatches listen for these; writing .value alone
    // leaves the slider number and the colour chip showing the old value
    if(n.dispatchEvent && typeof Event === 'function'){
      n.dispatchEvent(new Event('input', { bubbles: true }));
      n.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}
/** Runs a change, then puts every locked control back the way it was. */
function withLocksPreserved(fn){
  try { return withLocksPreservedInner(fn); } finally { if(typeof refreshUi === 'function') refreshUi(); }
}
function withLocksPreservedInner(fn){
  const snap = snapshotLocked();
  fn();
  restoreLocked(snap);
}

$('textureType').addEventListener('change', ()=>{ syncTextureTools(true); scheduleRender(); });
syncTextureTools(true);

// ---------- the four readings of a surface (🜂 🜄 🜁 🜃) ----------
// textureElements.js: each texture's Fire, Water, Wind and Earth — one of
// them its default. A button sets what that reading names (knobs, hues, blend,
// light) the way ⚄ Randomize does: a LOCKED control keeps its value, so
// readings can be mixed (lock the hues of one, apply another's knobs).
// (the surface menu's chooser, once it is attached: the applied reading's name rides in its field)
let surfaceChooser = null;
function paintElements(){
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
function applyElement(id){
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
if($('elementRow') && $('elementRow').addEventListener){
  $('elementRow').addEventListener('click', e => { const b = e.target.closest && e.target.closest('.el-btn'); if(b && !b.disabled){ applyElement(b.dataset.el); murmur.play('reading' + b.dataset.el.charAt(0).toUpperCase() + b.dataset.el.slice(1)); } });
}
// a new texture: no reading applied yet (its default is what it shows)
$('textureType').addEventListener('change', () => { state.ui.element = null; paintElements(); });
paintElements();
syncLightPad();
installLocks();
installHeadings();

// ---------- PML editor ----------
// The mirror carries the colour; the textarea keeps the caret, the selection
// and the system keyboard. Repainted on input, and again whenever anything
// else writes to the field (presets, the Grimoire, restored settings).
const pmlEditor = installEditor({
  textarea: $('poemText'),
  mirror: $('poemMirror'),
  gutter: $('poemGutter'),
  hint: $('poemHint'),
  knownFont: name => fontIndexByName(name) >= 0,
});
function repaintEditor(){ if(pmlEditor) pmlEditor.paint(); }

// A way out. Highlighting is an overlay of two layers that must agree about
// where every glyph lands; if they ever disagree on a given device, this turns
// the mirror off and hands back a plain, exact textarea. Writing must never be
// blocked by a colouring bug.
if($('highlightToggle') && $('highlightToggle').addEventListener){
  const applyHighlightPref = ()=>{
    const on = $('highlightToggle').checked;
    if(document.body && document.body.classList) document.body.classList.toggle('plain-editor', !on);
    if(on) repaintEditor();
  };
  $('highlightToggle').addEventListener('change', applyHighlightPref);
  applyHighlightPref();
}

// The editor is repainted explicitly wherever the box changes size, since an
// observer on the textarea would loop against its own height write.
if(typeof window !== 'undefined' && window.visualViewport && window.visualViewport.addEventListener){
  window.visualViewport.addEventListener('resize', repaintEditor);
}

// ---------- focus mode ----------
// The Inscribe page collapses to five things when the poem field is focused:
// header, preview, editor, bar, keyboard. Chrome hides its own title bar as
// the keyboard opens, which changes the layout viewport underneath a
// fixed-height app and lets the page scroll into empty space. Removing every
// other scrollable element removes the opportunity.
if(typeof document.querySelectorAll === 'function'){
  const poem = $('poemText');
  const body = document.body;
  const moreBtn = Array.from(document.querySelectorAll('.tab-btn'))
    .find(b => b.dataset.tab === 'more');

  function enterFocus(){
    // (only in the phone layout: on a desk the editor is simply typed in — Ruby)
    if(!body.classList || body.classList.contains('focus-mode') || !body.classList.contains('is-mobile')) return;
    body.classList.add('focus-mode');
    const card = poem.closest ? poem.closest('.card') : null;
    if(card) card.classList.add('focus-keep');
    // Schema becomes Return, carrying the Touch mark — the glyph the app
    // uses to mean "touch this"
    // the box changes size as the class lands; repaint once it has, and give the editor the room there is
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(() => { repaintEditor(); fitEditorRoom(); });
    // (Esoterica's button shows its Return face: CSS, body.focus-mode)
  }
  function exitFocus(){
    if(!body.classList || !body.classList.contains('focus-mode')) return;
    body.classList.remove('focus-mode', 'editor-fit', 'guide-open');
    if($('pmlTabBtn') && $('pmlTabBtn').setAttribute) $('pmlTabBtn').setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.focus-keep').forEach(c => c.classList.remove('focus-keep'));
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(repaintEditor);
    if(poem.blur) poem.blur();
  }

  if(poem.addEventListener){
    poem.addEventListener('focus', enterFocus);
    // Deliberately NOT leaving on blur: double-tapping to select a word blurs
    // the field for an instant, and would throw you out of focus mode
    // mid-selection. Return and the back gesture are the ways out.
  }
  if(moreBtn && moreBtn.addEventListener){
    moreBtn.addEventListener('click', (e)=>{
      if(body.classList && body.classList.contains('focus-mode')){
        e.preventDefault(); e.stopPropagation();
        exitFocus();
      }
    }, true);
  }
  // THE GUIDE WHILE WRITING (the usability review: on a phone the PML guide was out of reach in writing mode): PML in
  // the bar opens it as a sheet above the bar; ⤓ Try still writes into the poem
  const pmlBtn = $('pmlTabBtn');
  if(pmlBtn && pmlBtn.addEventListener) pmlBtn.addEventListener('click', e => {
    e.preventDefault(); const on = !body.classList.contains('guide-open');
    body.classList.toggle('guide-open', on); pmlBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    const g = $('formattingGuidePanel'); if(on && g && 'open' in g) g.open = true; fitEditorRoom(); });
  // (Ruby: opening the guide while writing keeps the keyboard up, and the guide lies over the preview, not the poem: a
  //  press on PML, or anywhere in the guide, never takes the focus from the poem; a tap on ⤓ Try still writes)
  for(const el of [pmlBtn, $('formattingGuidePanel')]) if(el && el.addEventListener) el.addEventListener('mousedown', e => {
    if(body.classList.contains('focus-mode') && !(e.target && e.target.closest && e.target.closest('input, textarea, select'))) e.preventDefault(); });
  // WHILE THE KEYBOARD IS UP the preview folds to a strip, so the poem has the room (the usability review: four lines
  // of editor under a full preview); a tap on the strip puts the keyboard away, and the preview opens again with it
  const stage = typeof document.querySelector === 'function' ? document.querySelector('.stage') : null;
  if(stage && stage.addEventListener) stage.addEventListener('pointerdown', () => {
    if(body.classList.contains('focus-mode') && body.classList.contains('keyboard-open') && poem.blur) poem.blur(); });
  // the phone's own back gesture should leave focus mode, not the page
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('popstate', ()=>{
      if(body.classList && body.classList.contains('focus-mode')) exitFocus();
    });
  }
}

// WRITING ON A PHONE (Ruby): the editor fills the room between the preview and the keyboard (or the Return bar)
// and never runs under them: it scrolls inside itself, with a thin bar, and its empty room below the last line
// is still the text area, so a tap there writes at the end. The room is measured, not left to nested flexboxes
// (which, when one of them refused to shrink, once left the last lines out of reach).
const WRITING_LINES = 12;   // (the poem's lines kept in view while the keyboard is up; the preview has the rest)
// (…unless the divider is dragged while the keyboard is up, Ruby: "it was kind of nice that we could adjust it": the
//  preview keeps the height dragged to, at least a strip and leaving at least three lines, until a double-tap resets it)
let KB_STAGE_DRAGGED = null;
function fitEditorRoom(){
  const b = document.body;
  if(!b || !b.classList || !b.classList.contains('focus-mode') || typeof document.querySelector !== 'function') return;
  const wrap = document.querySelector('.editor-wrap'), bar = document.querySelector('.tabbar');
  if(!wrap || !wrap.getBoundingClientRect) return;
  const vv = typeof window !== 'undefined' ? window.visualViewport : null, bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const br = bar && bar.getBoundingClientRect ? bar.getBoundingClientRect() : null, barTop = br && br.height > 0 && br.top > 0 ? br.top : bottom;   // (a fixed bar has no offsetParent)
  // WHILE THE KEYBOARD IS UP (Ruby: "reduce the minimum lines to like… 10 or 14 so I can still see the preview"): the
  // editor keeps about a dozen lines and the preview takes the rest of the room above them, never less than its strip
  const stage = document.querySelector('.stage'), input = document.querySelector('.editor-input');
  if(stage && stage.getBoundingClientRect && b.classList.contains('keyboard-open')){
    const cs = input && typeof getComputedStyle === 'function' ? getComputedStyle(input) : null, lh = cs ? parseFloat(cs.lineHeight) || parseFloat(cs.fontSize)*1.5 || 20 : 20;
    const free = Math.min(bottom, barTop) - stage.getBoundingClientRect().top - (wrap.getBoundingClientRect().top - stage.getBoundingClientRect().bottom) - 6;
    const sh = KB_STAGE_DRAGGED != null ? Math.max(64, Math.min(Math.floor(free - 3*lh - 16), KB_STAGE_DRAGGED)) : Math.max(64, Math.floor(free - WRITING_LINES*lh - 16));
    if(document.documentElement.style.getPropertyValue('--kb-stage-h') !== sh + 'px') document.documentElement.style.setProperty('--kb-stage-h', sh + 'px');
  }
  // (the PML guide, open while writing, lies over the preview: from its top down to the poem's)
  if(stage && stage.getBoundingClientRect){ const st = Math.max(0, stage.getBoundingClientRect().top), gh = Math.max(110, wrap.getBoundingClientRect().top - st - 2);
    document.documentElement.style.setProperty('--guide-top', st + 'px'); document.documentElement.style.setProperty('--guide-h', gh + 'px'); }
  const room = Math.floor(Math.min(bottom, barTop) - wrap.getBoundingClientRect().top - 6);
  if(!(room > 0)) return;
  const was = b.classList.contains('editor-fit') && document.documentElement.style.getPropertyValue('--editor-room');
  document.documentElement.style.setProperty('--editor-room', Math.max(96, room) + 'px');
  b.classList.add('editor-fit');
  // (a new room can change the editor's width — its scrollbar comes or goes — and so where its lines wrap: measure again)
  if(was !== Math.max(96, room) + 'px' && typeof requestAnimationFrame === 'function') requestAnimationFrame(repaintEditor);
}
// (the preview's divider moves the editor's top: the room follows)
if(typeof ResizeObserver === 'function' && typeof document.querySelector === 'function' && document.querySelector('.stage'))
  new ResizeObserver(() => fitEditorRoom()).observe(document.querySelector('.stage'));

// reset the preview to its default framing
if($('resetViewBtn') && $('resetViewBtn').addEventListener){
  $('resetViewBtn').addEventListener('click', ()=>{
    const root2 = document.documentElement;
    if(root2 && root2.style) root2.style.setProperty('--preview-frac', '0.30');
    const cv = $('poemCanvas');
    if(previewPanzoom){ previewPanzoom.reset(); if(state.ui.zoom !== 1){ state.ui.zoom = 1; setTimeout(() => applyPreviewScale(true), 200); } }
    else if(cv && cv.style) cv.style.transform = '';
  });
}

// ---------- angle sliders: tick marks every 45°, and a snap toggle ----------
// Every slider marked data-angle gets the shared tick list and, beside it, a
// small toggle (∡) that snaps it to 15° steps. Texture knobs that are angles
// join in when their texture is chosen (syncTextureParams).
function snapToTick(input){
  const ticks = (input.dataset.ticks || '').split(',').map(Number).filter(n => !isNaN(n));
  if(!ticks.length) return;
  const v = parseFloat(input.value);
  input.value = ticks.reduce((best, t) => Math.abs(t - v) < Math.abs(best - v) ? t : best, ticks[0]);
}
function addAngleSnap(input){
  if(!input || input.dataset == null || input.dataset.snapReady) return;
  input.dataset.snapReady = '1';
  if(input.setAttribute) input.setAttribute('list', 'angleTicks');
  if(!input.parentNode || !document.createElement) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'snap-btn'; b.textContent = '∡'; b.title = 'Snap to 15°';
  if(b.setAttribute) b.setAttribute('aria-pressed', 'false');
  b.addEventListener && b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if(b._ticks && input.dataset.ticks){ input.dataset.snapTicks = on ? '1' : ''; snapToTick(input); }
    else { input.step = on ? '15' : '1'; if(on) input.value = Math.round(parseFloat(input.value) / 15) * 15; }
    input.dispatchEvent && input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // a knob locked to its ticks jumps to the nearest one as it moves
  input.addEventListener && input.addEventListener('input', () => { if(input.dataset.snapTicks === '1') snapToTick(input); });
  if(input.parentNode.insertBefore) input.parentNode.insertBefore(b, input.nextSibling);
  input._snapBtn = b;
}
if(document.querySelectorAll) document.querySelectorAll('input[data-angle]').forEach(addAngleSnap);

// texture knobs: angle ticks, their own ticks, or none — set as the texture changes
function setKnobTicks(slider, i, def){
  const btn = () => slider._snapBtn;
  const hideBtn = () => { if(btn() && btn().style){ btn().style.display = 'none'; btn().setAttribute('aria-pressed', 'false'); } };
  slider.step = String(def.step || 1); if(slider.dataset) delete slider.dataset.snapTicks;
  if(def.key === 'angle'){
    addAngleSnap(slider); if(slider.setAttribute) slider.setAttribute('list', 'angleTicks');
    if(btn()){ btn().textContent = '∡'; btn().title = 'Snap to 15°'; btn().style.display = ''; btn().setAttribute('aria-pressed', 'false'); }
  } else if(def.ticks && def.ticks.length){
    const id = 'texP' + (i + 1) + 'Ticks';
    let dl = $(id);
    if(!dl && document.createElement && document.body && document.body.appendChild){ dl = document.createElement('datalist'); dl.id = id; document.body.appendChild(dl); }
    if(dl && 'innerHTML' in dl) dl.innerHTML = def.ticks.map(t => `<option value="${t}"></option>`).join('');
    if(slider.setAttribute) slider.setAttribute('list', id);
    if(slider.dataset) slider.dataset.ticks = def.ticks.join(',');
    addAngleSnap(slider);                       // the same toggle, set to lock to ticks
    if(btn()){ btn().textContent = '⊹'; btn().title = 'Lock to the marks'; btn().style.display = ''; btn().setAttribute('aria-pressed', 'false'); btn()._ticks = true; }
    // (a Knob of steps or a switch is locked to its marks from the start)
    if(def.snap && slider.dataset){ slider.dataset.snapTicks = '1'; if(btn()) btn().setAttribute('aria-pressed', 'true'); }
  } else { if(slider.removeAttribute) slider.removeAttribute('list'); hideBtn(); }
  // 🎲 — a knob that asks for one (Object Shape) gets a die that picks a mark at random
  if(!slider._dice && def.dice && document.createElement && slider.parentNode && slider.parentNode.insertBefore){
    const d = document.createElement('button'); d.type = 'button'; d.className = 'snap-btn dice-btn'; d.textContent = '🎲'; d.title = 'Pick one at random';
    d.addEventListener('click', () => { const t = (slider.dataset.ticks || '').split(',').map(Number).filter(n => !isNaN(n));
      if(t.length){ slider.value = t[Math.floor(Math.random()*t.length)]; slider.dispatchEvent(new Event('input', { bubbles: true })); } });
    slider.parentNode.insertBefore(d, (slider._snapBtn && slider._snapBtn.nextSibling) || slider.nextSibling); slider._dice = d;
  }
  if(slider._dice && slider._dice.style) slider._dice.style.display = def.dice ? '' : 'none';
  // an Angle knob is turned on a dial (D1); any other knob has none
  const dial = def.deg ? knobDial(slider) : slider._knobDial;
  if(dial && dial.style) dial.style.display = def.deg ? '' : 'none';
  if(slider.parentNode && slider.parentNode.classList) slider.parentNode.classList.toggle('has-dial', !!def.deg);
  paintKnobDial(slider);
}
// AN ANGLE IS A DIAL (ROADMAP D1, Filter Forge's Angle control): beside an Angle knob's slider, a small dial whose hand
// is the angle (0° up, turning clockwise, as the light dial reads); drag round it to turn it. The slider stays: the
// keyboard, the lock, the saving and the 45° marks are its.
function knobDial(slider){
  if(slider._knobDial) return slider._knobDial;
  if(typeof document.createElementNS !== 'function' || !slider.parentNode || !slider.parentNode.insertBefore) return null;
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-20 -20 40 40'); svg.setAttribute('class', 'knob-dial'); svg.setAttribute('aria-hidden', 'true');
  const ticks = [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a*Math.PI/180, x = Math.sin(r), y = -Math.cos(r);
    return `<line class="kd-tick" x1="${(x*15).toFixed(2)}" y1="${(y*15).toFixed(2)}" x2="${(x*18).toFixed(2)}" y2="${(y*18).toFixed(2)}"/>`; }).join('');
  svg.innerHTML = `<circle class="kd-rim" r="17"/>${ticks}<g class="kd-hand"><line x1="0" y1="0" x2="0" y2="-13"/><circle cx="0" cy="-13" r="3"/></g><circle class="kd-hub" r="2"/>`;
  slider.parentNode.insertBefore(svg, slider);
  const turn = e => { const r = svg.getBoundingClientRect(), dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
    let deg = (Math.atan2(dx, -dy)*180/Math.PI + 360) % 360;
    // (with ∡ or ⊹ pressed it settles on the marks, as the slider does)
    if(slider.dataset && slider.dataset.snapTicks === '1') deg = Math.round(deg/45)*45 % 360;
    slider.value = String(Math.round(deg/3.6*2)/2); slider.dispatchEvent(new Event('input', { bubbles: true })); };
  svg.addEventListener('pointerdown', e => { if(state.locks.has(slider.id)) return; e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch(err){} svg._turning = true; turn(e); });
  svg.addEventListener('pointermove', e => { if(svg._turning) turn(e); });
  for(const ev of ['pointerup', 'pointercancel']) svg.addEventListener(ev, () => { if(!svg._turning) return; svg._turning = false; slider.dispatchEvent(new Event('change', { bubbles: true })); });
  slider.addEventListener('input', () => paintKnobDial(slider));
  slider._knobDial = svg;
  return svg;
}
function paintKnobDial(slider){ const d = slider && slider._knobDial; if(!d || !d.querySelector) return;
  const h = d.querySelector('.kd-hand'); if(h) h.setAttribute('transform', `rotate(${((+slider.value || 0)*3.6).toFixed(1)})`); }

// ---------- text effects: three slots (effects.js) ----------
// Each slot is a type, a colour, two knobs whose labels follow the type (like
// the texture knobs), and an angle for effects with a direction.
const EFFECT_SLOT_DEFAULTS = {};
for(const i of [1, 2, 3]) Object.assign(EFFECT_SLOT_DEFAULTS, { ['fx'+i+'Type']:'none', ['fx'+i+'Color']:'#ffffff', ['fx'+i+'K1']:'40', ['fx'+i+'K2']:'70', ['fx'+i+'Angle']:'45' });
EFFECT_SLOT_DEFAULTS.underAll = '';
function syncFxSlot(i, resetToDefaults){
  const t = ($('fx'+i+'Type') || {}).value || 'none', d = EFFECT_DEFS[t] || EFFECT_DEFS.none;
  const show = (id, on) => { const el = $(id); if(el && el.style) el.style.display = on ? '' : 'none'; };
  show('fx'+i+'ColorField', !!d.color); show('fx'+i+'AngleField', d.angle != null);
  for(const k of ['K1', 'K2']){
    const def = d[k.toLowerCase()]; show('fx'+i+k+'Field', !!def);
    if(!def) continue;
    const el = $('fx'+i+k);
    if($('fx'+i+k+'Label')) setLabelText($('fx'+i+k+'Label'), def[0]);
    el.min = def[1]; el.max = def[2];
    if(resetToDefaults) el.value = def[3];
    if($('fx'+i+k+'Val')) $('fx'+i+k+'Val').textContent = el.value + def[4];
  }
  if(resetToDefaults){ if(d.color) setColorField('fx'+i+'Color', d.color); if(d.angle != null) $('fx'+i+'Angle').value = d.angle; }
  if($('fx'+i+'AngleVal')) $('fx'+i+'AngleVal').textContent = $('fx'+i+'Angle').value + '°';
}
function syncAllFxSlots(){ for(const i of [1, 2, 3]) syncFxSlot(i, false); }
/** Older looks and presets: the Outline/Shadow mode and typeface effect, as slots. */
function applyLegacyEffects(src){
  const stack = [], o = legacyOutline(src.outlineMode, src.outlineColor, src.outlineThickness, src.shadowBlur, src.shadowX, src.shadowY);
  if(o) stack.push(o);
  const t = legacyTypeEffect(src.typeEffect, src.typeEffectStrength, src.typeEffectColor, src.typeEffectAngle, src.typeEffectDistance, src.typeEffectGrain);
  if(t.fx) stack.push(t.fx);
  const vals = { ...EFFECT_SLOT_DEFAULTS, underAll: t.under ? t.under.style : '' };
  stack.slice(0, 3).forEach((fx, n) => { const i = n + 1;
    Object.assign(vals, { ['fx'+i+'Type']: fx.type, ['fx'+i+'Color']: fx.color, ['fx'+i+'K1']: String(fx.k1), ['fx'+i+'K2']: String(fx.k2), ['fx'+i+'Angle']: String(Math.round(((fx.angle % 360) + 360) % 360)) }); });
  applyPersisted(vals); syncAllFxSlots();
}
for(const i of [1, 2, 3]){
  const sel = $('fx'+i+'Type');
  if(sel && 'innerHTML' in sel) sel.innerHTML = EFFECT_TYPES.map(t => `<option value="${t}">${EFFECT_DEFS[t].label}</option>`).join('');
  if(sel && sel.addEventListener) sel.addEventListener('change', () => { syncFxSlot(i, true); scheduleRender(); });
  for(const k of ['K1', 'K2', 'Angle']){ const el = $('fx'+i+k); if(el && el.addEventListener) el.addEventListener('input', () => { syncFxSlot(i, false); scheduleRender(); }); }
  bindColorField('fx'+i+'Color', scheduleRender);
}
syncAllFxSlots();

// ---------- border & vignette extras ----------
$('borderGradientToggle').addEventListener('change', scheduleRender);
bindColorField('borderColor2Hex', scheduleRender);
bindColorField('borderColor3Hex', scheduleRender);
$('borderBloom').addEventListener('input', scheduleRender);
$('vignetteAperture').addEventListener('input', scheduleRender);
$('vignetteCx').addEventListener('input', scheduleRender);
$('vignetteCy').addEventListener('input', scheduleRender);
$('vignetteNoise').addEventListener('input', scheduleRender);
['borderBloom','vignetteAperture','vignetteCx','vignetteCy','vignetteNoise'].forEach(id=>{
  const out = $(id + 'Val');
  if(out) $(id).addEventListener('input', ()=>{ out.textContent = $(id).value; });
});

// every data-str element takes its text from the table in strings.js
applyStrings(document);

// ---------- the moon, in three places ----------
// Tonight's real moon, small, at the left of the header — an easter egg.
{
  const hm = $('headerMoon');
  if(hm){
    const p = moonPhase(new Date());
    hm.innerHTML = moonGlyph(p, { size: 17 });
    hm.title = phaseName(p) + ' tonight';
  }
}
// ---------- frame and box controls: readouts, visibility, moons ----------
const RANGE_UNITS = { borderGradientAngle:'°', bgRadialX:'%', bgRadialY:'%', bgRadialR:'%', borderThickness:'px', borderOffset:'px',
  borderGrain:'%', textureClearing:'%', textureShapeStrength:'%', borderRadius:'px', cardGradientAngle:'°', cardOffset:'px', cardThickness:'px', cardRadius:'px', cardFxAmount:'', cardFxScale:'' };
function refreshReadouts(){
  for(const [id, unit] of Object.entries(RANGE_UNITS)){ const el = $(id), out = $(id + 'Val'); if(el && out) out.textContent = el.value + unit; }
  paintMoons();
}
/** Shows each control only when it applies. */
function syncFrameVisibility(){
  const show = (id, on) => { const el = $(id); if(el && el.style) el.style.display = on ? '' : 'none'; };
  const bgType = ($('bgGradientType') || {}).value || 'linear';
  // the angle where a gradient has a direction; the centre where it has one; the radius for rings and boxes
  show('bgAngleField', ['linear', 'mirror', 'conic'].includes(bgType));
  for(const id of ['bgCenterXField','bgCenterYField']) show(id, ['radial', 'rect', 'conic'].includes(bgType));
  show('bgRadiusField', bgType === 'radial' || bgType === 'rect');
  show('textAngleField', ((($('textGradientType') || {}).value) || 'linear') !== 'radial');
  show('borderRadiusField', $('borderRounded') && $('borderRounded').checked);
  // sections open with the class the stylesheet keys on (.subblock.open);
  // setting display directly loses to that rule
  const card = $('cardToggle') && $('cardToggle').checked, grad = card && $('cardGradientToggle').checked;
  if($('cardBlock')) $('cardBlock').classList.toggle('open', !!card);
  const bgrad = $('borderGradientToggle') && $('borderGradientToggle').checked;
  show('borderColor2Field', bgrad); show('borderColor3Field', bgrad); show('borderAngleField', bgrad);
  for(const id of ['cardColor2Field','cardTypeField']) show(id, grad);
  show('cardAngleField', grad && ['linear', 'mirror', 'conic'].includes($('cardGradientType').value));
  show('cardRadiusField', $('cardRounded') && $('cardRounded').checked);
  // Points Outward? only where the stitch has a side to point (a solid line is the same either way); its tick is kept
  for(const [sel, box] of [['borderStitch', 'borderStitchOut'], ['cardStitch', 'cardStitchOut']]){
    const b = $(box), on = stitchSided((($(sel) || {}).value) || 'solid');
    if(b) b.disabled = !on; }
  // the glass's knobs only with glass, and the second named for what it moves
  const glass = ($('cardFx') && $('cardFx').value) || 'none';
  show('cardFxAmountField', glass !== 'none'); show('cardFxScaleField', glass !== 'none' && glass !== 'lens');
  const scaleName = { frost: 'Grit', reeded: 'Flute Width', pixel: 'Cell Size', emboss: 'Depth', prism: 'Split' }[glass];
  if($('cardFxScaleLabel') && scaleName) setLabelText($('cardFxScaleLabel'), scaleName);
}
for(const id of [...Object.keys(RANGE_UNITS), 'bgGradientType', 'textGradientType', 'borderRounded', 'borderGradientToggle', 'cardToggle', 'cardGradientToggle',
                 'cardGradientType', 'cardOpacity', 'cardBlend', 'borderBlend', 'borderBloomBlend', 'borderStitch', 'borderStitchOut',
                 'cardLink', 'cardRounded', 'cardStitch', 'cardStitchOut', 'cardFx']){
  const el = $(id); if(!el || !el.addEventListener) continue;
  const on = ()=>{ refreshReadouts(); syncFrameVisibility(); scheduleRender(); };
  el.addEventListener('input', on); el.addEventListener('change', on);
}
bindColorField('cardColor1Hex', scheduleRender);
bindColorField('cardColor2Hex', scheduleRender);

// For testing the glass on a machine without a GPU (?softgl): allow software
// WebGL, which the app otherwise declines (it is slower than the CPU path).
if(typeof location !== 'undefined' && /[?&]softgl\b/.test(location.search || '')) setBoxFxSoftware(true);
if(typeof document !== 'undefined' && document.body && document.body.dataset) document.body.dataset.glass = 'pending';
// (which way the glass runs here — 'gpu' or 'cpu' — for the curious, on the body)
setTimeout(() => { try { if(document.body && document.body.dataset) document.body.dataset.glass = boxFxBackend(); } catch(e){} }, 0);

// ---------- THE ATHANOR (forge.js) ----------
// A node editor for new surfaces, over the page; its graph lives in the hidden
// #forgeGraph field (saved, loaded and shared with the look).
function paintForgeSummary(){ if($('forgeSummary')) $('forgeSummary').textContent = describeForge(($('forgeGraph') || {}).value); }
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
function applyAthanorGraph(redraw = true){
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
/** A texture made in the worker, handed to `done` when it is ready (the newest wish per slot wins). */
const workerWish = new Map();
function whenTexture(slot, type, w, h, opts, done){
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
  const T = 64, { cols, rows } = athanorSheetLayout(ids.length);
  whenTexture('athanorSteps', 'athanorsteps', cols*T, rows*T, athanorOpts(json, T), sheet => paint(sheet, ids, T, cols));
}
// KEPT SURFACES in the texture menu (🜉 Yours): each by name, after "From the
// Athanor". Choosing one puts its graph in the Athanor and shows it — the
// menu's value is then 'athanor', so a look saves exactly as before.
function paintShelfOptions(){
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
function paintTryOptions(){
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
const tryGraphOf = value => { const m = /^(starter|study):(.+)$/.exec(String(value)); if(!m) return null;
  const S = (m[1] === 'study' ? ATHANOR_STUDIES : ATHANOR_STARTERS)[m[2]]; return S ? athanorStarter(m[2]) : null; };
if(document.addEventListener) for(const ev of ['input', 'change']) document.addEventListener(ev, e => {
  const t = e.target; if(!t || t.id !== 'textureType' || !TRY_GRAPH.test(String(t.value))) return;
  const g = tryGraphOf(t.value), v = g ? validateGraph(JSON.stringify(g)) : { ok: false, problems: ['it is not in this version'] };
  if(!v.ok){ t.value = 'athanor'; hardNo('That surface can’t be used', v.problems.join('; ') + '.'); return; }
  // (only the PAGE takes it: the Athanor's bench keeps its work)
  $('forgeGraph').value = JSON.stringify(v.graph); t.value = 'athanor';
  applyAthanorGraph(true); paintForgeSummary();
  if(openForge.paintPage) openForge.paintPage();
}, true);
const keptByValue = value => { const name = decodeURIComponent(String(value).slice(5)); return forgeShelf().find(r => r.name === name) || null; };
if(document.addEventListener) for(const ev of ['input', 'change']) document.addEventListener(ev, e => {
  const t = e.target; if(!t || t.id !== 'textureType' || !String(t.value).startsWith('kept:')) return;
  const rec = keptByValue(t.value);
  const v = rec ? validateGraph(rec.graph) : { ok: false, problems: ['it is no longer on the shelf'] };
  if(!v.ok){ t.value = 'athanor'; hardNo('That kept surface can’t be used', v.problems.join('; ') + '.'); return; }
  // one name: the page calls it what the shelf does. Only the PAGE takes it: the Athanor's bench keeps its work
  $('forgeGraph').value = JSON.stringify(forgeNameSurface(v.graph, rec.name)); t.value = 'athanor';
  applyAthanorGraph(true); paintForgeSummary();
  if(openForge.paintPage) openForge.paintPage();
}, true);
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
setTimeout(paintShelfOptions, 0); setTimeout(paintTryOptions, 0);
const forgeDeps = () => ({ $, bench, setBench, unkept: benchUnkept,
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
function openAthanorNow(){ return openForge(forgeDeps()); }
// REVEAL (ROADMAP H1, Reveal Spell Graph): the page's surface opened in the Athanor as the graph it is made of,
// its Knobs set to the sliders' own values, so the Athanor shows exactly what the page does
async function revealSurface(){
  const type = ($('textureType') || {}).value || '';
  // an Athanor surface: the page's own graph onto the bench (it is the bench's already while the page shows it)
  if(type === 'athanor' && benchOnPage()){ openAthanorNow(); return; }
  const page = type === 'athanor' ? (() => { const v = validateGraph(($('forgeGraph') || {}).value || ''); return v.ok ? v.graph : null; })() : null;
  // the empty Athanor (no graph on the page yet): the editor opens as it is, to start one (Ruby: it is where anyone would go)
  if(type === 'athanor' && !page){ openAthanorNow(); return; }
  const chain = TEXTURE_CHAINS[type], g = page || (chain && athanorStarterAt(type, paramsFor(type), [1, 2, 3, 4, 5, 6, 7, 8].map(i => ($('texP' + i) || {}).value)));
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
async function protectText(){
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
if($('protectTextBtn') && $('protectTextBtn').addEventListener) $('protectTextBtn').addEventListener('click', () => { protectText(); });
function paintReveal(){ const b = $('revealSurfaceBtn'), t = ($('textureType') || {}).value || ''; if(b) b.disabled = !(t === 'athanor' || TEXTURE_CHAINS[t]); }
if($('revealSurfaceBtn') && $('revealSurfaceBtn').addEventListener) $('revealSurfaceBtn').addEventListener('click', () => { revealSurface(); });
$('textureType').addEventListener('change', paintReveal);
if($('athanorTopBtn') && $('athanorTopBtn').addEventListener) $('athanorTopBtn').addEventListener('click', () => openAthanorNow());
// Done: closed; a graph changed here that the page doesn't show is offered to it (Ruby: Use was redundant), and
// asked outright: a toast was easy to miss, and the page looked as though the edit had been lost (the usability review)
if($('forgeCloseBtn') && $('forgeCloseBtn').addEventListener) $('forgeCloseBtn').addEventListener('click', async () => {
  const d = forgeDeps(), changed = closeForge(d); paintForgeSummary();
  if(!changed || d.onPage()) return;
  murmur.play('confirm');
  if((await modalPrompt({ title: FORGE_BAR.applyAskTitle, body: FORGE_BAR.applyAskBody, confirmLabel: FORGE_BAR.applyAskYes, cancelLabel: FORGE_BAR.applyAskNo, danger: false })) === true) d.use(); });
setTimeout(() => { paintForgeSummary(); applyAthanorGraph(true); }, 0);

// ---------- LINKED CONTROLS ----------
// A control marked data-link="<other id>" mirrors that control, both ways,
// while its switch (data-link-switch, a checkbox) is on. The inset box's
// shape is linked to the border's this way (Ruby: duplicate the values, and
// have one change the other); any pair of controls can be linked the same.
let linking = false;
function linkCopy(from, to){
  if(!from || !to) return;
  if(to.type === 'checkbox') to.checked = from.checked; else to.value = from.value;
}
const linkedEls = typeof document.querySelectorAll === 'function' ? Array.from(document.querySelectorAll('[data-link]')) : [];
for(const el of linkedEls){
  if(!el.addEventListener) continue;
  for(const type of ['input', 'change']) el.addEventListener(type, () => {
    if(linking) return;
    const sw = $(el.dataset.linkSwitch); if(sw && !sw.checked) return;
    const other = $(el.dataset.link); if(!other) return;
    linking = true;
    try { linkCopy(el, other); if(typeof Event === 'function') other.dispatchEvent(new Event(type, { bubbles: true })); }
    finally { linking = false; }
  });
}
/** The box's shape and the border's, brought together (the border's wins),
 *  while they are linked: after a load, a preset or Randomize, and the moment
 *  the link is switched back on. */
const BOX_LINKS = [['cardOffset','borderOffset'], ['cardThickness','borderThickness'], ['cardRounded','borderRounded'],
  ['cardRadius','borderRadius'], ['cardStitch','borderStitch'], ['cardStitchOut','borderStitchOut']];
function syncLinkedBox(){
  if(!$('cardLink') || !$('cardLink').checked) return;
  for(const [box, border] of BOX_LINKS) linkCopy($(border), $(box));
  if(typeof refreshReadouts === 'function'){ refreshReadouts(); syncFrameVisibility(); }
}
if($('cardLink') && $('cardLink').addEventListener) $('cardLink').addEventListener('change', () => { syncLinkedBox(); scheduleRender(); });

/** Settings a preset doesn't mention start from these, so one preset's box
 *  or rounded frame never leaks into the next. */
const FRAME_DEFAULTS = { bgGradientType:'linear', textGradientType:'linear', bgRadialX:'50', bgRadialY:'50', bgRadialR:'75', borderGrain:'0',
  borderRounded:false, borderRadius:'60', cardToggle:false, cardColor1:'#FFF6EE', cardGradientToggle:false,
  cardColor2:'#F2E2EA', cardGradientType:'linear', cardGradientAngle:'90', cardOpacity:'70', cardBlend:'source-over',
  borderBlend:'source-over', borderBloomBlend:'source-over', borderGradientAngle:'45',
  borderStitch:'solid', borderStitchOut:false, cardLink:true, cardFx:'none', cardFxAmount:'50', cardFxScale:'50', baseToggle:false, textureClearing:'0' };

// Every opacity READOUT (any slider marked data-moon) is a moon that waxes with the value — new at 0%, full
// at 100% — in place of a percentage. (It was once drawn on the slider's
// thumb; styling the thumb makes Chrome and Firefox drop native drawing for
// the whole slider, which is what turned it into a white box.)
function paintMoons(){
  const els = document.querySelectorAll ? document.querySelectorAll('input[data-moon]') : [];
  for(const el of els){
    const out = $(el.id + 'Val');
    if(!out) continue;
    const pct = Math.max(0, Math.min(100, Math.round(+el.value || 0)));
    out.innerHTML = moonGlyph(pct / 200, { size: 18 });
    out.title = pct + '%';
    if(out.setAttribute) out.setAttribute('aria-label', 'Opacity ' + pct + '%');
  }
}
// The seed button shows the phase the Fractal Moon will take for this seed,
// so rerolling is watching the moon turn.
function paintSeedMoon(){
  const b = $('textureSeedReroll');
  if(!b) return;
  const p = moonForSeed(parseInt($('textureSeedValue').value, 10) || 0);
  b.innerHTML = moonGlyph(p, { size: 20 });
  b.title = 'Reroll · ' + phaseName(p);
}
// ---------- word seeds ----------
// The seed field shows the seed's PHRASE (seedWords.js); the number itself
// stays in #textureSeedValue (what saves, shares and locks hold). Typing a
// phrase, a number or any words at all sets the number; whatever else sets
// it (a reroll, a preset, a load, undo) shows its phrase here.
function syncSeedWords(force){
  const box = $('textureSeedWords'), num = $('textureSeedValue'); if(!box || !num) return;
  const n = parseInt(num.value, 10) || 0;
  if(force || (typeof document !== 'undefined' && document.activeElement !== box)){ if(force || box.dataset == null || box.dataset.seed !== String(n)){ box.value = seedPhrase(n); if(box.dataset) box.dataset.seed = String(n); } }
  if('title' in box) box.title = '№ ' + n;   // the number is only a tooltip now; the phrase is the seed
  if(state.ui.seedFit) requestAnimationFrame(state.ui.seedFit);
}
if($('textureSeedWords') && $('textureSeedWords').addEventListener){
  const box = $('textureSeedWords');
  box.addEventListener('input', () => {
    const n = seedFromText(box.value);
    $('textureSeedValue').value = String(n); if(box.dataset) box.dataset.seed = String(n);
    $('textureSeedValue').dispatchEvent(new Event('input', { bubbles: true }));
    box.title = '№ ' + n;
  });
  // Enter finishes; whatever was typed (a number, a phrase, any words) stays as typed, with its number
  box.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); box.blur(); } });
  box.addEventListener('blur', () => { if(typeof commitSoon === 'function') commitSoon(); });
  // the hair-thin scroller, for words longer than the field
  const bar = $('textureSeedScroll'), thumb = bar && bar.querySelector ? bar.querySelector('.seed-thumb') : null;
  const fit = () => { if(!bar || !thumb) return; const sw = box.scrollWidth, cw = box.clientWidth, over = sw > cw + 1;
    bar.classList.toggle('on', over); if(!over) return;
    const wPct = cw/sw*100, lPct = box.scrollLeft/(sw - cw)*(100 - wPct); thumb.style.width = wPct + '%'; thumb.style.left = lPct + '%'; };
  ['input', 'scroll', 'keyup', 'click', 'select', 'focus', 'blur'].forEach(ev => box.addEventListener(ev, () => requestAnimationFrame(fit)));
  if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', fit);
  if(bar && bar.addEventListener){ let drag = false;
    const go = e => { const rc = bar.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - rc.left)/rc.width)); box.scrollLeft = f*(box.scrollWidth - box.clientWidth); fit(); };
    bar.addEventListener('pointerdown', e => { drag = true; bar.classList.add('dragging'); try { bar.setPointerCapture(e.pointerId); } catch(_){} go(e); e.preventDefault(); });
    bar.addEventListener('pointermove', e => { if(drag) go(e); });
    const stop = () => { drag = false; bar.classList.remove('dragging'); }; bar.addEventListener('pointerup', stop); bar.addEventListener('pointercancel', stop); }
  state.ui.seedFit = fit;
  // anything else that sets the number (rerolls, presets, loads, undo) shows here
  let lastSeen = null;
  setInterval(() => { const v = $('textureSeedValue').value; if(v !== lastSeen){ lastSeen = v; syncSeedWords(false); } }, 200);
  syncSeedWords(true);
}
if($('textureOpacity').addEventListener){
  $('textureOpacity').addEventListener('input', paintMoons);
  $('textureSeedValue').addEventListener('input', paintSeedMoon);
  $('textureSeedReroll').addEventListener('click', ()=> setTimeout(paintSeedMoon, 0));
}
paintMoons();
refreshReadouts();
syncFrameVisibility();
paintSeedMoon();

// ---------- theme ----------  (see theme.js)
if($('uiTheme') && $('uiTheme').addEventListener){
  $('uiTheme').addEventListener('change', ()=> applyTheme($('uiTheme').value));
}
applyTheme(savedTheme());

// ---------- sounds ----------  (see murmur.js) — off until turned on; the
// switch and volume belong to this browser, not to a look
const SOUND_ON = 'uv.sound.on', SOUND_VOL = 'uv.sound.volume';
{
  let on = false, vol = 0.4;
  try { on = localStorage.getItem(SOUND_ON) === '1'; const v = parseFloat(localStorage.getItem(SOUND_VOL)); if(isFinite(v)) vol = Math.min(1, Math.max(0, v)); } catch(e){}
  murmur.setEnabled(on); murmur.setVolume(vol);
  const box = $('soundToggle'), range = $('soundVolume');
  if(box){ box.checked = on; if(box.addEventListener) box.addEventListener('change', () => {
    murmur.setEnabled(box.checked); try { localStorage.setItem(SOUND_ON, box.checked ? '1' : '0'); } catch(e){}
    if(range) range.disabled = !box.checked;
    if(box.checked) setTimeout(() => murmur.play('soundOn'), 60); }); }
  if(range){ range.value = String(Math.round(vol * 100)); range.disabled = !on;
    if(range.addEventListener){
      range.addEventListener('input', () => { murmur.setVolume(+range.value / 100); try { localStorage.setItem(SOUND_VOL, String(+range.value / 100)); } catch(e){} });
      range.addEventListener('change', () => murmur.play('soundOn')); } }
  if(document.addEventListener) murmur.bind(document);
}

{ const box = $('hintsToggle');
  if(box){ try { box.checked = localStorage.getItem(HINTS_ON) === '1'; } catch(e){}
    if(box.addEventListener) box.addEventListener('change', () => { try { localStorage.setItem(HINTS_ON, box.checked ? '1' : '0'); } catch(e){}
      if(typeof document.querySelectorAll === 'function') for(const card of document.querySelectorAll('details.card[data-tab]')) if(card.querySelector(':scope > summary .hint-btn')) showHints(card, box.checked, false); });
    if(box.checked) setTimeout(refreshHints, 0); } }

// installable, and usable offline once visited (on https only)
registerServiceWorker();

// ---------- Spellcrafting & Grimoire ----------
// One modal serves every confirm/name/paste flow. Resolves to the typed
// string when it has an input, `true` for a plain confirm, or null on cancel.
function modalPrompt(opts){
  return new Promise((resolve)=>{
    const veil = $('modalVeil');
    if(!veil){ resolve(null); return; }
    const titleEl = $('modalTitle'), bodyEl = $('modalBody'), input = $('modalInput');
    const ok = $('modalConfirm'), cancel = $('modalCancel');
    const wantsInput = !!opts.input;
    // A RANGE BY TWO HANDLES (opts.range { lo, hi, a, b, step, low, high }: ROADMAP D3, Filter Forge's remapper drawn
    // as two sliders): the answer is [a, b]; the first may sit above the second, which reverses the sweep
    const R = opts.range || null, rb = $('modalRange');
    if(rb) rb.hidden = !R;
    if(R && rb){
      const step = R.step || ((R.hi - R.lo) > 20 ? 1 : 0.01), fmt = v => String(Math.round(v/step)*step).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
      const say = () => { $('modalRangeAVal').textContent = fmt(+$('modalRangeA').value); $('modalRangeBVal').textContent = fmt(+$('modalRangeB').value);
        $('modalRangeNote').textContent = +$('modalRangeA').value > +$('modalRangeB').value ? MODAL_RANGE.reversed : +$('modalRangeA').value === +$('modalRangeB').value ? MODAL_RANGE.still : ''; };
      for(const [id, v, lab] of [['modalRangeA', R.a, R.low || MODAL_RANGE.low], ['modalRangeB', R.b, R.high || MODAL_RANGE.high]]){
        const el = $(id); el.min = String(R.lo); el.max = String(R.hi); el.step = String(step); el.value = String(v); el.oninput = say; $(id + 'Label').textContent = lab; }
      say();
    }
    titleEl.textContent = opts.title || '';
    bodyEl.textContent = opts.body || '';
    input.hidden = !wantsInput;
    input.value = wantsInput ? (opts.defaultValue || '') : '';
    input.rows = opts.rows || 1;
    input.setAttribute('rows', String(opts.rows || 1));
    ok.textContent = opts.confirmLabel || 'OK';
    cancel.textContent = opts.cancelLabel || 'Cancel';
    cancel.hidden = !!opts.alert;                       // a plain notice: one button
    const box = veil.querySelector('.modal'); if(box && box.classList) box.classList.toggle('modal-hard', !!opts.hard);
    ok.className = opts.danger ? 'btn-danger' : 'btn-major';
    veil.hidden = false;

    const finish = (val)=>{
      veil.hidden = true; cancel.hidden = false;
      document.removeEventListener('keydown', onKey, true);
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = ()=> finish(R ? [+$('modalRangeA').value, +$('modalRangeB').value] : wantsInput ? input.value : true);
    const onCancel = ()=> finish(null);
    // Escape cancels, Enter confirms (outside a text box); the safe choice has the focus
    const onKey = e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); finish(opts.alert ? true : null); }
      else if(e.key === 'Enter' && !wantsInput){ e.preventDefault(); e.stopPropagation(); onOk(); } };
    document.addEventListener('keydown', onKey, true);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    setTimeout(() => { try { (R ? $('modalRangeA') : wantsInput ? input : (opts.danger && !opts.alert ? cancel : ok)).focus(); } catch(e){} }, 0);
  });
}

// ---------- asking first, and saying no ----------
// ARE YOU SURE (the soft no): a question before something that would undo work.
async function askSure({ title, body, confirmLabel = 'Go ahead', danger = true }){
  murmur.play('confirm');
  return (await modalPrompt({ title, body, confirmLabel, cancelLabel: 'Keep my work', danger })) === true;
}
// THE HARD NO: something that would break the page, refused, and said why.
function hardNo(title, body){
  murmur.play('hardNo');
  return modalPrompt({ title, body, confirmLabel: 'Understood', alert: true, hard: true });
}
// a quiet note at the foot of the page (errors that were caught, things cleaned up)
let toastTimer = 0;
function toast(text, action){
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
const needsGuard = () => (state.ui.edits || 0) >= GUARD_EDITS;
function markFresh(){ state.ui.edits = -1; }          // (the action's own history step brings it to 0)
async function guardWork(label, what){
  if(!needsGuard()) return true;
  return askSure({ title: `${label}?`, body: `You've made ${state.ui.edits} changes since the last fresh start. ${what} replaces them; Undo can still bring them back.`, confirmLabel: label });
}
// buttons that replace the look ask first (a click from the keyboard too); after, the count starts again
const GUARDED = { randomFontBtn: ['Summon a new typeface', 'A new typeface'], randomBgBtn: ['Summon a new backdrop', 'A new backdrop'], randomSurfaceBtn: ['Summon a new surface', 'A new surface'],
  spellApplyBtn: ['Invoke this spell', 'The spell'], advancedLoadBtn: ['Load this JSON', 'The JSON'] };
let guardPass = null;
if(document.addEventListener) document.addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest(Object.keys(GUARDED).map(id => '#' + id).join(',')) : null;
  if(!b) return;
  if(guardPass === b){ guardPass = null; markFresh(); return; }
  // what would be refused anyway is refused first, not asked about
  if(b.id === 'advancedLoadBtn'){ try { JSON.parse($('advancedJson').value); } catch(_){ return; } }
  if(!needsGuard()){ markFresh(); return; }
  e.preventDefault(); e.stopImmediatePropagation();
  const [label, what] = GUARDED[b.id];
  guardWork(label, what).then(ok => { if(ok){ guardPass = b; b.click(); } });
}, true);
// a control that is switched off answers with a dull, hollow knock
if(document.addEventListener) document.addEventListener('pointerdown', e => {
  const t = e.target && e.target.closest ? e.target.closest('button:disabled, input:disabled, select:disabled, .tool-off, [aria-disabled="true"]') : null;
  if(t) murmur.play('blocked');
}, true);
// errors are caught, said quietly, and never take the page down with them
let lastErr = 0;
if(typeof window !== 'undefined' && window.addEventListener){
  const caught = msg => { const now = Date.now(); if(now - lastErr < 4000) return; lastErr = now;
    toast('Something went wrong (' + String(msg || 'unknown').slice(0, 90) + '). Your work is safe.'); };
  window.addEventListener('error', e => caught(e && (e.message || (e.error && e.error.message))));
  window.addEventListener('unhandledrejection', e => caught(e && e.reason && (e.reason.message || e.reason)));
}

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
function restoreShape(s){
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
function safeRestore(obj, what = 'This look'){
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
const FIRST_VISIT_KEY = 'uv.firstvisit.v1';
const EXAMPLE_LOOK = { name: 'Example · Linen Page', settings: {
  bg1: '#EDE6D8', bgGradient: true, bg2: '#DCCFB8', bgAngle: 160, bgGradientType: 'linear',
  text1: '#2A2320', textGradient: false, font: 'Alegreya', accent1: '#9C3D54', accent2: '#3D6A8A',
  texture: true, textureType: 'linen', textureOpacity: 45, textureBlend: 'soft-light',
  border: false, cardToggle: false, vignette: true, vignetteBlend: 'multiply', vignetteIntensity: 18,
  fx1Type: 'none', fx2Type: 'none', fx3Type: 'none', outlineMode: 'off' } };

// A spell is the look, never the words -- the poem belongs to the Grimoire.
function settingsForSpell(){
  return stripToLook(serializeCurrentSettings());
}

const vault = createVault({
  $,
  getSettings: settingsForSpell,
  setName: name => { if(document.body && document.body.dataset) document.body.dataset.lookName = name; scheduleRender(); },
  applySettings: (settings, name)=>{ if(!safeRestore(stripToLook(settings), 'This spell')) return;
    if(name && document.body && document.body.dataset) document.body.dataset.lookName = name;
    scheduleRender(); },
  getText: ()=> $('poemText').value,
  setText: (t)=>{ $('poemText').value = t; repaintEditor(); },
  onChange: scheduleRender,
  prompt: modalPrompt,
  paintSwatch: paintPresetSwatch,
  onSpellsChanged: renderSavedPresets,
});

// Create/Save stay hollow until something has actually diverged, so the
// buttons have to re-evaluate whenever any control moves.
if(document.addEventListener){
  let vaultTick = null;
  const nudge = ()=>{
    clearTimeout(vaultTick);
    vaultTick = setTimeout(()=>vault.refresh(), 120);
  };
  document.addEventListener('input', nudge);
  document.addEventListener('change', nudge);
}

// The opening face of the app, applied once every control, tool and lock exists.
applyPreset(defaultPalettePreset);

// Wait for fonts before first paint so sizing is accurate -- preload every
// weight/style combo actually used by FONTS, then render once as soon as
// they're ready (or on a couple of timeout fallbacks, in case a font load
// event never fires for some reason).
// The canvas starts at the size the markup gives it — the export size. Record
// that, then draw the preview at the size it is shown.
if(!state.page.exportW){ state.page.exportW = canvas.width; state.page.exportH = canvas.height; }
applyPreviewScale();
// Every visit opens on the welcome page (Ruby's own words: what this is and how to begin).
$('poemText').value = WELCOME_POEM; repaintEditor();
// FIRST VISIT: the instrument panel waits in the Grimoire, dated the release (it shows how the
// Grimoire keeps a poem), and one plain example look waits among the custom presets. Once only:
// deleted, they stay deleted.
try {
  if(typeof localStorage !== 'undefined' && !localStorage.getItem(FIRST_VISIT_KEY)){
    const [y, mo, d] = String(RELEASE_DATE).split('-').map(Number), ts = new Date(y, (mo || 1) - 1, d || 1, 12, 0).getTime();
    vault.seed({ poem: { title: DEV_TEMPLATE_TITLE, text: DEV_TEMPLATE, savedTs: ts },
                 spell: { name: EXAMPLE_LOOK.name, settings: { ...settingsForSpell(), ...EXAMPLE_LOOK.settings, lookName: EXAMPLE_LOOK.name } } });
    localStorage.setItem(FIRST_VISIT_KEY, '1');
  }
} catch(e){ /* storage refused: the app works the same without the examples */ }
// THE DRAFT: a phone drops a background tab without an unload event, so the poem in progress and
// its look are kept in this browser (DRAFT_KEY: { poem, look, savedAt }) a moment after each change
// and at once when the page is hidden. The next visit opens on the draft, at the page's own shape (Lain and
// Ruby: the shape is kept between visits). No draft, a draft of the welcome poem itself, or one that won't load
// opens on the welcome page as before; an EMPTY poem is a fresh start: the welcome page, the default theme, and
// every slider and lock as new.
const DRAFT_KEY = 'uv.draft.v1', DRAFT_WAIT_MS = 1000;
let draftSaveTimer = null;
function saveDraft(){
  clearTimeout(draftSaveTimer); draftSaveTimer = null;
  try {
    if(typeof localStorage === 'undefined') return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ poem: $('poemText').value, look: stripToLook(serializeCurrentSettings()), savedAt: Date.now() }));
  } catch(e){ /* private mode or a full store: the draft just isn't kept */ }
}
function saveDraftSoon(){ clearTimeout(draftSaveTimer); draftSaveTimer = setTimeout(saveDraft, DRAFT_WAIT_MS); }
function restoreDraft(){
  let d = null;
  try { d = typeof localStorage === 'undefined' ? null : JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch(e){ return false; }
  if(!d || typeof d !== 'object' || typeof d.poem !== 'string') return false;
  if(!d.poem.trim()){ try { localStorage.removeItem(DRAFT_KEY); } catch(e){} applyTheme(DEFAULT_THEME); return false; }
  if(d.poem === WELCOME_POEM) return false;
  // a look that fails the check is passed over quietly (no dialog at start-up); one that throws is rolled back by safeRestore
  if(!checkLook(d.look, 'The draft').ok || !safeRestore(d.look, 'The draft')) return false;
  try { restoreShape(d.look); } catch(e){ /* the default shape stands */ }
  $('poemText').value = d.poem; repaintEditor();
  return true;
}
try { restoreDraft(); } catch(e){ /* a draft never stops the app opening: the welcome page stands */ }
// every way a poem or look changes passes through one of these (typing, sliders, presets, the
// Grimoire, spells, JSON, undo); the save reads the page as it is when the moment is up
for(const type of ['input', 'change', 'click', 'keydown']) document.addEventListener(type, saveDraftSoon, true);
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') saveDraft(); });
if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', saveDraft);
// Fonts are fetched on first use now (fonts.js, asked for by the renderer);
// the first render happens as soon as the page is ready.
render();
// The first paint uses fallback metrics, and the fitted size is cached — so
// once the real fonts land the measurements have to be thrown away, or the
// page keeps a size that was measured against the wrong typeface.
function remeasureAndRender(){
  invalidateTextMeasurements();
  render();
  // (the editor's own font may be what arrived: its text wraps anew, so its height is measured again)
  repaintEditor();
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureAndRender);
// Textures that draw alchemical glyphs (transmutation circles) must not keep
// a copy generated before the symbol font arrived — it would be empty boxes.
if(document.fonts && document.fonts.load){
  document.fonts.load('32px "Noto Sans Symbols"', '\u{1F701}')
    .then(()=>{ clearTexturesOfTypes(['summoning', 'cards', ...(graphScattersGlyphs(($('forgeGraph') || {}).value || '') ? ['athanor', 'athanorsteps'] : [])]); scheduleRender(); }).catch(()=>{});   // only those that draw symbols
}
// Re-measure when a font actually ARRIVES (the browser says so), coalescing a
// burst into one — rather than on blind timers that re-fit even when nothing
// had changed (two full re-fits at every start-up).
if(document.fonts && document.fonts.addEventListener){
  let fontTimer = null;
  document.fonts.addEventListener('loadingdone', () => { clearTimeout(fontTimer); fontTimer = setTimeout(remeasureAndRender, 60); });
}

// ---------- undo ↶ and redo ↷ ----------
// History is a stack of LOOK snapshots — the same filtered snapshot a saved
// spell uses, so it covers every setting but never the poem (the text box has
// its own undo), your locks, or your name. A change is recorded a moment after
// you stop adjusting, so one slider drag is one step, not one per pixel.
const HISTORY_MAX = 60;
function lookSnapshot(){ return JSON.stringify(stripToLook(serializeCurrentSettings())); }
function paintHistoryButtons(){
  const h = state.history, p = state.poemHist || { index: 0, stack: [] }, poemLast = state.ui.lastEdit === 'poem';
  if($('undoBtn')) $('undoBtn').disabled = h.index <= 0 && !(poemLast && p.index > 0);
  if($('redoBtn')) $('redoBtn').disabled = h.index >= h.stack.length - 1 && !(poemLast && p.index < p.stack.length - 1);
  paintFilmstrip();
}

// ---------- the history FILMSTRIP ----------
// The last eight looks in history, as small frames inside the preview; the
// one you're on is lit; a click goes straight back (or forward) to it — as a
// step of undo, so nothing is lost. 🎞 (or H) shows and hides it; whether it
// shows is remembered per browser (it is part of the app, not of a look).
const FILM_MAX = 8, filmCache = new Map();
function filmFrameFor(snap){
  let c = filmCache.get(snap);
  if(!c){
    c = document.createElement('canvas');
    try { paintPresetSwatch(c, JSON.parse(snap), 144, 80); } catch(e){ /* a frame that can't paint stays blank */ }
    filmCache.set(snap, c);
    if(filmCache.size > 40) filmCache.delete(filmCache.keys().next().value);
  }
  return c;
}
function paintFilmstrip(){
  const fs = $('filmstrip'), wrap = fs && fs.parentElement;
  if(!fs || typeof document.createElement !== 'function' || !(wrap && wrap.classList && wrap.classList.contains('film-open'))) return;
  const h = state.history, from = Math.max(0, h.stack.length - FILM_MAX);
  fs.innerHTML = '';
  for(let i = from; i < h.stack.length; i++){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'film-frame' + (i === h.index ? ' current' : '');
    b.title = i === h.index ? 'Now' : i < h.index ? (h.index - i) + ' back' : (i - h.index) + ' ahead';
    const src = filmFrameFor(h.stack[i]), c = document.createElement('canvas');
    c.width = src.width || 144; c.height = src.height || 80;
    try { c.getContext('2d').drawImage(src, 0, 0); } catch(e){}
    b.appendChild(c);
    b.addEventListener('click', () => stepHistory(i - state.history.index));
    fs.appendChild(b);
  }
  if(fs.scrollLeft !== undefined) fs.scrollLeft = 1e6;     // the newest in view
}
function setFilmstrip(open){
  const wrap = $('filmstrip') && $('filmstrip').parentElement;
  if(!wrap || !wrap.classList) return;
  wrap.classList.toggle('film-open', !!open);
  try { localStorage.setItem('uv.filmstrip.v1', open ? '1' : '0'); } catch(e){}
  paintFilmstrip();
}
{
  let open = !detectMobile();                               // on by default on a desktop
  try { const v = localStorage.getItem('uv.filmstrip.v1'); if(v !== null) open = v === '1'; } catch(e){}
  setTimeout(() => setFilmstrip(open), 0);
  if($('filmBtn') && $('filmBtn').addEventListener) $('filmBtn').addEventListener('click', () => {
    const wrap = $('filmstrip').parentElement; setFilmstrip(!(wrap.classList && wrap.classList.contains('film-open'))); });
}
function commitHistory(){
  const h = state.history;
  if(h.restoring) return;
  const snap = lookSnapshot();
  if(h.stack[h.index] === snap) return;                      // nothing actually changed
  h.stack = h.stack.slice(0, h.index + 1);                   // a new change drops the redo branch
  h.stack.push(snap);
  if(h.stack.length > HISTORY_MAX) h.stack.shift();
  h.index = h.stack.length - 1;
  state.ui.edits = (state.ui.edits || 0) + 1;
  state.ui.lastEdit = 'look';
  paintHistoryButtons();
  checkLitPreset();
}
function commitSoon(){ clearTimeout(state.history.timer); state.history.timer = setTimeout(commitHistory, 450); }
function stepHistory(dir){
  const h = state.history, to = h.index + dir;
  if(to < 0 || to >= h.stack.length){ murmur.play('nothingToUndo'); return; }
  murmur.play(dir < 0 ? 'undo' : 'redo');
  clearTimeout(h.timer);
  h.index = to; h.restoring = true;
  try { restoreSettings(JSON.parse(h.stack[to])); } finally { h.restoring = false; }
  refreshUi(); scheduleRender(); paintHistoryButtons(); checkLitPreset();
}
// THE POEM'S OWN HISTORY (the usability review: on a phone nothing undid a cleared poem — Android's keyboards have no
// undo): the text kept a moment after typing stops (at once when much of it vanishes), and ↶ ↷ step it while the poem
// is what was last changed; once it is back at its start, ↶ goes on through the look's history
const POEM_MAX = 80;
function poemHistoryNow(){ const h = state.poemHist || (state.poemHist = { stack: [], index: -1, timer: null, restoring: false }); return h; }
function notePoem(){
  const h = poemHistoryNow(), t = $('poemText') ? $('poemText').value : ''; if(h.restoring) return;
  clearTimeout(h.timer); if(h.stack[h.index] === t) return;
  h.stack = h.stack.slice(0, h.index + 1); h.stack.push(t); if(h.stack.length > POEM_MAX) h.stack.shift(); h.index = h.stack.length - 1;
  if(h.stack.length > 1) state.ui.lastEdit = 'poem';
  paintHistoryButtons();
}
function notePoemSoon(){ const h = poemHistoryNow(), t = $('poemText') ? $('poemText').value : '', was = h.stack[h.index] || '';
  clearTimeout(h.timer);
  // (a big cut is kept at once, so one ↶ brings it all back)
  if(was.length > 40 && t.length < was.length*0.5){ notePoemFirst(was); notePoem(); toast(PAGE_SAYS.poemCut, { label: PAGE_SAYS.undo, act: () => stepPoem(-1) }); return; }
  h.timer = setTimeout(notePoem, 700); }
// (the text as it was before a change, if it was never kept: the first keystroke after a pause)
function notePoemFirst(t){ const h = poemHistoryNow(); if(h.stack[h.index] !== t){ h.stack = h.stack.slice(0, h.index + 1); h.stack.push(t); h.index = h.stack.length - 1; } }
function stepPoem(dir){
  const h = poemHistoryNow(); clearTimeout(h.timer); notePoem();
  const to = h.index + dir; if(to < 0 || to >= h.stack.length) return false;
  h.index = to; h.restoring = true;
  try { $('poemText').value = h.stack[to]; repaintEditor(); scheduleRender(); } finally { h.restoring = false; }
  murmur.play(dir < 0 ? 'undo' : 'redo'); paintHistoryButtons(); return true;
}
function stepAny(dir){
  const p = poemHistoryNow();
  if(state.ui.lastEdit === 'poem' && ((dir < 0 && p.index > 0) || (dir > 0 && p.index < p.stack.length - 1))){ stepPoem(dir); return; }
  stepHistory(dir);
}
if($('undoBtn')) $('undoBtn').addEventListener('click', ()=>stepAny(-1));
if($('redoBtn')) $('redoBtn').addEventListener('click', ()=>stepAny(1));
setTimeout(() => { const h = poemHistoryNow(); if(!h.stack.length && $('poemText')) { h.stack = [$('poemText').value]; h.index = 0; } }, 0);
// any change in the controls — typed, dragged, picked, or a button that
// rewrites many at once (presets, randomize, spells) — records a step
const NOT_A_LOOK = new Set(['poemText', 'usernameField', 'advancedJson', 'forgeGraph']);   // (the Athanor keeps its own edits)
for(const type of ['input', 'change']){
  document.addEventListener(type, (e)=>{
    const t = e.target;
    if(!t || NOT_A_LOOK.has(t.id) || state.history.restoring) return;
    commitSoon();
  }, true);
}
document.addEventListener('click', (e)=>{
  const t = e.target && e.target.closest ? e.target.closest('button, .preset-btn, .radio-btn') : null;
  if(t && t.id !== 'undoBtn' && t.id !== 'redoBtn') commitSoon();
}, true);
// KEYS (the ? sheet lists them): Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y), Ctrl+S,
// and single keys — none of them while typing in a field
function showShortcuts(on){ const s = $('shortcutSheet'); if(s) s.hidden = !on; }
if($('shortcutBtn') && $('shortcutBtn').addEventListener) $('shortcutBtn').addEventListener('click', () => showShortcuts(true));
if($('shortcutSheet') && $('shortcutSheet').addEventListener) $('shortcutSheet').addEventListener('click', (e) => { if(e.target === $('shortcutSheet')) showShortcuts(false); });
const clickId = id => { const b = $(id); if(b && typeof b.click === 'function') b.click(); };
document.addEventListener('keydown', (e)=>{
  const ae = document.activeElement, tag = (ae && ae.tagName) || '';
  if(tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || (ae && ae.isContentEditable)) return;
  const k = (e.key || '').toLowerCase();
  if(e.ctrlKey || e.metaKey){
    if(k === 'z'){ e.preventDefault(); stepAny(e.shiftKey ? 1 : -1); }
    else if(k === 'y'){ e.preventDefault(); stepAny(1); }
    else if(k === 's'){ e.preventDefault(); clickId('downloadBtn'); }
    return;
  }
  if(e.altKey) return;
  const sheetOpen = $('shortcutSheet') && !$('shortcutSheet').hidden;
  if(e.key === 'Escape'){ if(sheetOpen) showShortcuts(false); return; }
  if(e.key === '?'){ e.preventDefault(); showShortcuts(!sheetOpen); return; }
  if(sheetOpen) return;
  if(k === 'r') clickId('textureSeedReroll');
  else if(k === 'b') clickId('randomBgBtn');
  else if(k === 'f') clickId('randomFontBtn');
  else if(k === 'h'){ const wrap = $('filmstrip') && $('filmstrip').parentElement; if(wrap && wrap.classList) setFilmstrip(!wrap.classList.contains('film-open')); }
  else if(k === '0') clickId('resetViewBtn');
  else if(/^[1-5]$/.test(k)){ const tabs = document.querySelectorAll ? document.querySelectorAll('.tab-btn') : []; const t = tabs[+k - 1]; if(t && t.click) t.click(); }
  else if(k === '[' || k === ']'){
    // step through the presets in their order, from the one on the page
    const name = (document.body && document.body.dataset && document.body.dataset.lookName) || '';
    const at = PRESETS.findIndex(p => p.name === name), next = PRESETS[((at < 0 ? -1 : at) + (k === ']' ? 1 : -1) + PRESETS.length) % PRESETS.length];
    if(next){ pickPreset(next); commitSoon(); }
  }
  else return;
  e.preventDefault();
});

// Full-size preview: renders the preview at the export's own size, for
// comparing it with the screen-sized preview (slower; not part of a look)
if($('fullPreview')) $('fullPreview').addEventListener('change', ()=>{ state.ui.fullPreview = $('fullPreview').checked; applyPreviewScale(); });
// the box the preview sits in changes with the divider and the layout
if(typeof ResizeObserver === 'function' && document.querySelector && document.querySelector('.canvas-wrap'))
  new ResizeObserver(applyPreviewScaleSoon).observe(document.querySelector('.canvas-wrap'));
// the look the page opened on is the first step of history
commitHistory();

// ---------- WHAT'S WORKING ----------
// While something slow is being made, a quiet line over the image says what —
// each true to what is actually happening, put the way a workshop would
// ("Convolving the bokeh" is literally what Dream Bloom does). It waits a
// moment before it shows (fast work never flickers it) and stays a moment
// once shown; it and the shimmer above it keep moving even while the page
// itself is busy (they run on the compositor).
const WORKING_WORDS = {
  veins: 'Weaving the network', circuit: 'Routing the traces', knotwork: 'Plaiting the knot', lichtenberg: 'Striking the arc', growth: 'Growing the line',
  plainnoise: 'Stirring the noise', stripes: 'Ruling the stripes', polka: 'Spotting the dots', checker: 'Laying the squares', softgradient: 'Grading the light', cells: 'Growing the cells',
  bokeh: 'Convolving the bokeh', astral: 'Counting the stars', astral_fog: 'Thickening the nebula', astral_stars: 'Counting the stars',
  clouds: 'Folding the haze', magicparticles: 'Scattering the dust', embers: 'Throwing sparks', snow: 'Letting the snow settle',
  aurora: 'Combing the silk', aurorasky: 'Hanging the curtains of light', moon: 'Iterating the moon', landscape: 'Priming the canvas', flowfield: 'Tracing the flow lines',
  suminagashi: 'Floating the ink', grain: 'Developing the grain', metalleaf: 'Laying the leaf', flowers: 'Opening the lotuses', feathers: 'Letting the feathers fall', corvids: 'Gathering the crows’ feathers', dappled: 'Hanging the leaves', windowlight: 'Opening the window', lightleaks: 'Letting the light in', caustics: 'Rippling the water',
  brushstrokes: 'Loading the brush', halftone: 'Screening the dots', rainstreaks: 'Driving the rain', hatch: 'Hatching the shadows',
  cityscape: 'Lighting the windows', guilloche: 'Turning the rose engine', stainedglass: 'Leading the glass', underglass: 'Wiping the glass', brokenglass: 'Sweeping up the glass', dewwebs: 'Beading the silk', sigils: 'Inscribing the sigils',
  mathnoise: 'Flipping the bits', summoning: 'Chalking the circle', inkbleed: 'Folding the blot', crackedglaze: 'Firing the glaze', crackle: 'Letting the glaze crack',
  tessellate: 'Cutting the facets', cards: 'Shuffling the deck', blackhole: 'Bending the light', pixelspace: 'Placing the pixels', webb: 'Unfolding the mirror', macro: 'Focusing the lens', meadow: 'Walking into the meadow', petals: 'Letting the petals fall', bouquets: 'Gathering the flowers', imprints: 'Pressing the flowers', liminal: 'Finding the way back', turing: 'Letting the reaction diffuse',
  chladni: 'Bowing the plate', linen: 'Weaving the warp', coldpress: 'Pressing the paper', spangle: 'Galvanising the steel',
  crystal: 'Growing the crystals', oldpaper: 'Ageing the paper', cupring: 'Setting down the cup', ash: 'Burning the letter',
  wax: 'Pouring the wax', dunes: 'Letting the wind shape the dunes', kintsugi: 'Mending with gold', moss: 'Growing the moss',
  water: 'Stilling the pool', glassrain: 'Beading the glass', rainwater: 'Letting the rain fall', ringworld: 'Raising the arch', ringpaint: 'Painting the ring', skyring: 'Hanging the ring', frost: 'Growing the frost', contour: 'Surveying the contours',
  watercolour: 'Wetting the wash', athanor: 'Stoking the athanor', athanorsteps: 'Showing each step', saving: 'Pressing the page at full size',
};
const workingLine = $('workingLine');
let workShowT = 0, workHideT = 0, workShownAt = 0;
function setWorking(what){
  if(!workingLine || !workingLine.classList) return;
  clearTimeout(workShowT); clearTimeout(workHideT);
  // (the Athanor, over the page, shows the same words over its preview)
  const fw = $('forgeWorking'), both = f => { f(workingLine); if(fw && fw.classList) f(fw); };
  if(what){
    const words = WORKING_WORDS[what] || 'Making the surface';
    workShowT = setTimeout(() => { both(el => { el.textContent = words + '…'; el.classList.add('on'); }); workShownAt = Date.now(); }, 400);
  } else {
    const stay = Math.max(0, 700 - (Date.now() - workShownAt));
    workHideT = setTimeout(() => both(el => el.classList.remove('on')), workingLine.classList.contains('on') ? stay : 0);
  }
}
if(document.addEventListener) document.addEventListener('vellum-working', e => setWorking(e && e.detail && e.detail.what));

// tiles take their textures from the cache or the worker, never made here (swatches.js)
setSwatchTextureSource((type, w, h, opts) => {
  const hit = peekTexture(textureKeyFor(type, w, h, opts)); if(hit) return hit;
  requestTexture('swatch:' + textureKeyFor(type, w, h, opts), type, w, h, opts);
  return peekTexture(textureKeyFor(type, w, h, opts)) || null;
});
onTextureReady(() => swatchTexturesArrived());

// ---------- SURFACES MADE IN THE ATHANOR, in the surface menu ----------
// THEIR THUMBNAILS (Ruby): drawn at the canonical settings (the graph's own knob defaults, one seed, the
// light from the upper left, plain hues), in the worker, and kept with the surface on the shelf until its
// wiring changes. (Not in the chooser's per-release cache: a kept surface can be replaced under its name.)
const keptHash = text => { let h = 2166136261; for(let i = 0; i < text.length; i++){ h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + text.length; };
function keptOpts(json, n){
  const defs = athanorKnobs(json), knob = i => (defs.find(x => x.slot === i) || {}).def ?? 50;
  return { graph: json, seed: 4242, scale: n/3072, light: 315, lightTilt: 100, tint1: '#F2E6D8', tint2: '#2A2230', accent1: '#E07A8A', accent2: '#7A8AE8', ink: '#F2F2EF',
    p1: knob(1), p2: knob(2), p3: knob(3), p4: knob(4), p5: knob(5), p6: knob(6), p7: knob(7), p8: knob(8), text: graphUsesPoem(json) ? textLayoutNow() : undefined };
}
function keptThumb(rec, canvas, unsaved){
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
function holdSurface(value, tile){
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

// THE ATHANOR'S OPEN, AS TILES: a graph's thumbnail (a starter, a study) made in the worker and kept by its wiring;
// an app texture's is the surface menu's own, from the same keeping; a kept surface's is its shelf thumbnail
let surfaceTiles = null;
const textureNameOf = v => { const o = Array.from((($('textureType') || {}).options) || []).find(o => o.value === v); return o ? String(o.textContent || '').trim() : ''; };
function openTileThumb(value, canvas, done){
  const v = String(value);
  if(v.startsWith('kept:')) return keptThumb(keptByValue(v), canvas);
  const k = v.replace(/^(starter|study):/, '');
  if(v !== k){ const g = athanorStarter(k); if(!g) return false; const n = canvas.width, x = canvas.getContext('2d');
    whenTexture('openTile:' + v, 'athanor', n, n, keptOpts(JSON.stringify(g), n), tex => { x.fillStyle = '#1A1720'; x.fillRect(0, 0, n, n); x.drawImage(tex, 0, 0, n, n); done(); });
    return true; }
  return surfaceTiles ? surfaceTiles.thumb(v, canvas, done) : false;
}
function openTileStamp(value){
  const v = String(value), k = v.replace(/^(starter|study):/, '');
  if(v.startsWith('kept:') || !v) return '';
  if(v !== k){ const g = athanorStarter(k); return g ? keptHash(JSON.stringify(g)) + '|' + SWATCH_STAMP : ''; }
  return surfaceTiles ? surfaceTiles.stamp(v) : '';
}
// ---------- THE SURFACE MENUS AS TILES ----------
// Each surface's tile is the surface as a preset wears it (its ground, hues, blend and knobs), or, worn by
// none, its defaults on a ground that suits its blend. Thumbnails are kept in the browser until what they are
// painted from changes (chooser.js): the surface (its fingerprints' stamp), the look it wears, the painter.
{
  const backFor = b => /multiply|darken|burn/.test(b) ? '#EEE4D2' : /screen|lighten|dodge/.test(b) ? '#100E16' : /overlay|soft|hard/.test(b) ? '#6A3A4E' : '#1A1720';
  const wornBy = type => PRESETS.find(p => p.textureType === type && p.texture);
  const thumbLook = type => {
    const P = wornBy(type);
    if(P) return { ...P, spell: '', border: false, cardToggle: false, textureOpacity: Math.max(60, P.textureOpacity ?? 100) };
    const caps = capsFor(type);
    return { bg1: backFor(caps.blends[0]), texture: true, textureType: type, textureOpacity: 100, accent1: '#E07A8A', accent2: '#7A8AE8' };
  };
  const thumb = (value, canvas, done) => {
    if(String(value).startsWith('kept:')) return keptThumb(keptByValue(value), canvas);
    if(TRY_GRAPH.test(String(value))) return openTileThumb(value, canvas, done);
    if(value === 'athanor') return keptThumb({ name: '', graph: ($('forgeGraph') || {}).value || '' }, canvas, true);
    if(!TEXTURE_PARAMS[value]) return false;
    // made at three times the tile and drawn down: grown and simulated surfaces need room to show what they are
    const big = document.createElement('canvas');
    paintPresetSwatch(big, thumbLook(value), canvas.width*3, canvas.height*3, () => {
      const c = canvas.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(big, 0, 0, canvas.width, canvas.height); done(); });
    return true;
  };
  const stamp = value => TRY_GRAPH.test(String(value)) ? openTileStamp(value) : String(value).startsWith('kept:') || value === 'athanor' ? ''
    : `${TEXTURE_STAMPS[value] || ''}|${SWATCH_STAMP}|${keptHash(JSON.stringify(thumbLook(value)))}`;
  // a search finds a surface by its readings' names too (Rose Window, Seedy Amber…)
  const extra = value => { const E = TEXTURE_ELEMENTS[value]; if(!E) return ''; return Object.values(E).map(r => r && r.name || '').join(' '); };
  const glyphFor = value => { if(value === 'athanor' || String(value).startsWith('kept:')) return '🜉';
    const name = Object.keys(STUDY_GROUPS).find(n => STUDY_GROUPS[n].includes(String(value))); if(!name) return '◈';
    return (TEXTURE_GROUPS.find(t => t.name === name) || STUDY_GROUP_EXTRA).glyph; };
  surfaceTiles = { thumb, stamp, extra };
  // (one menu serves both surfaces: the layer bar says which one it changes)
  const sel = $('textureType');
  // (Ruby) the reading applied, when it isn't the surface's own name, rides quietly in the field: "Deep Field · Quasar"
  const sub = value => { if(value !== ($('textureType') || {}).value) return ''; const v = elementsFor(value).find(e => e.el === state.ui.element); return v && !v.isDefault && v.name !== textureNameOf(value) ? v.name : ''; };
  try { if(sel) CHOOSERS.push(surfaceChooser = attachChooser(sel, { id: sel.id, title: CHOOSER.surfaceTitle, thumb, extra, glyphFor, stamp, size: 160, hold: holdSurface, sub })); } catch(e){ /* the plain menu still works */ }
}
