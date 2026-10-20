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
import { STITCH_STYLES, STITCH_LABELS } from './stitches.js';
import { setBoxFxSoftware, boxFxBackend } from './boxFx.js';
import { forgeNameSurface, openForge, closeForge } from './forge.js';
import { validateGraph } from './athanor.js';
import { graphScattersGlyphs } from './stepsPatterns.js';
import { elementsFor, TEXTURE_ELEMENTS } from './textureElements.js';
import { attachChooser } from './chooser.js';
import { withAltText } from './jpegMeta.js';
import { createMurmur } from './murmur.js';
import { EFFECT_DEFS, EFFECT_TYPES } from './effects.js';
import { $, FONTS, FONT_GROUPS, PRESETS, PRESET_GROUPS, DEV_TEMPLATE, DEV_TEMPLATE_TITLE, WELCOME_POEM, TEXTURE_GROUPS, STUDY_GROUPS, STUDY_GROUP_EXTRA } from './appOptions.js';
import { RELEASE_DATE, TEXTURE_STAMPS, SWATCH_STAMP } from './release.js';
import { render, scheduleRender, noteUserActivity, TYPING_SETTLE_MS, setRenderScale, resetBackBuffer, setSurfaceSource, fontIndexByName } from './canvasRenderer.js';
import { paramsFor, capsFor, paramReadout, dropLargeTextures, clearTexturesOfTypes, TEXTURE_PARAMS, textureKeyFor, peekTexture } from './textureGenerators.js';
import { seedFromText } from './seedWords.js';
import { createVault, stripToLook } from './vault.js';
import { applyTheme, savedTheme } from './theme.js';
import { registerServiceWorker } from './pwa.js';
import { moonPhase, moonGlyph, phaseName } from './moon.js';
import { paintPresetSwatch, setSwatchTextureSource, swatchTexturesArrived } from './swatches.js';
import { deriveThemePalette } from './palette.js';
import { installEditor } from './editor.js';
import { DEFAULTS } from './tunables.js';
import { applyStrings, PML_GUIDE, PICKER, CHOOSER, DIE, FORGE_BAR } from './strings.js';
import { state } from './uiState.js';
import { setWorking } from './uiWorking.js';
import { clickId, commitHistory, commitSoon, notePoemSoon, poemHistoryNow, setFilmstrip, showShortcuts, stepAny } from './uiHistory.js';
import { EXAMPLE_LOOK, FIRST_VISIT_KEY, GUARDED, guardWork, hardNo, markFresh, needsGuard, reconcileControls, remeasureAndRender, restoreDraft, resyncSurfaceControls, safeRestore, saveDraft, saveDraftSoon, settingsForSpell, toast } from './uiGuard.js';
import { applyAthanorGraph, forgeDeps, keptByValue, openAthanorNow, paintForgeSummary, paintReveal, paintShelfOptions, paintTryOptions, protectText, revealSurface, tryGraphOf } from './uiAthanor.js';
import { DIAL_R, LIGHT_DEFAULT, RIM_DEFAULT, addAngleSnap, cameraNow, cameraStart, dialMax, drawCameraGuide, drawDialGuide, keepGround, lightPick, movePicked, paintKnobDial, pickedNow, putRim, seedCamera, setCamera, setLight, setRimOn, setRimStrength, syncCameraPad, syncLightPad } from './uiDials.js';
import { HINTS_ON, LOCKABLE, closeDieMenu, dieLevel, dieMenu, installHeadings, installLocks, linkCopy, paintMasterLocks, paintMoons, paintSeedMoon, refreshHints, rollByLabel, rollSection, showHints, syncLinkedBox, syncStopFields, withLocksPreserved } from './uiLocks.js';
import { editLayer, freshLower, lowerOn, paintLayerWords, pickLayer, readingOf, swapLayers, syncBaseUi } from './uiLayers.js';
import { CREDIT_KEY, applyCustomSize, applyLayout, applyPreviewScale, applyPreviewScaleSoon, backdropColours, detectMobile, fitEditorRoom, generateFilenameBase, maybeRerollSeed, offerAltText, pickAspect, poemAltText, randomSeed, summonCard, syncCustomSize } from './uiLayout.js';
import { aimPointer, applyPreset, applyThemePalette, filterPresets, freezeSeed, groupHead, groupTile, markPicking, mutateGently, pickPreset, pickerPointer, pickerSwatches, presetTile, rafOr, renderSavedPresets, serializeCurrentSettings, summonVariation, tileQueue } from './uiLook.js';
import { applyElement, curveOf, draftTimer, draftWhileDragging, followAccents, holdSurface, keptHash, keptThumb, openTileStamp, openTileThumb, paintCurvePad, paintCurves, paintElements, setCurvePoints, syncTextureParams, syncTextureTools, textureNameOf } from './uiSurface.js';
import { EFFECT_SLOT_DEFAULTS, RANGE_UNITS, SOUND_ON, SOUND_VOL, modalPrompt, refreshReadouts, repaintEditor, syncAllFxSlots, syncFrameVisibility, syncFxSlot, syncSeedWords } from './uiControls.js';
export { EFFECT_SLOT_DEFAULTS, applyLegacyEffects, modalPrompt, refreshReadouts, repaintEditor, syncAllFxSlots, syncFrameVisibility, syncSeedWords } from './uiControls.js';
export { applyElement, draftWhileDragging, holdSurface, keptOpts, openTileStamp, openTileThumb, syncTextureParams, syncTextureTools } from './uiSurface.js';
export { checkLitPreset, paintFreeze, restoreSettings, restoreSurfaceLayer, serializeCurrentSettings } from './uiLook.js';
export { clampSize, hexToRgbObj, hslHex, maybeRerollSeed, pickAspect, randomSeed, syncCustomSize } from './uiLayout.js';
export { pickLayer } from './uiLayers.js';
export { LOCK_GLYPH, eyeBlock, guardLabelTaps, headingTaps } from './uiLocks.js';
export { cameraNow, dialGuideMarks, dialGuidePlace, seedCamera, syncCameraPad } from './uiDials.js';
export { toast } from './uiGuard.js';
// (a starter's or a Surface Study's place in the surface menu: 'starter:agate', 'study:fibers'; see paintTryOptions)
export const TRY_GRAPH = /^(starter|study):/;
// soft interface sounds (murmur.js); made here so every handler below can use it
export const murmur = createMurmur({ enabled: false });

// the border's stitch menu and the help's stitch list, from the library itself
{ const bs = $('borderStitch');
  if(bs && 'innerHTML' in bs) bs.innerHTML = STITCH_STYLES.map(k => `<option value="${k}">${STITCH_LABELS[k]}</option>`).join('');
  const cs = $('cardStitch');   // the inset box cuts its edge with the same stitches
  if(cs && 'innerHTML' in cs) cs.innerHTML = STITCH_STYLES.map(k => `<option value="${k}">${STITCH_LABELS[k]}</option>`).join('');
  const sl = $('stitchList');
  if(sl && 'innerHTML' in sl) sl.innerHTML = STITCH_STYLES.map(k => `<code>${k}</code>`).join(' '); }

// ---------- the app's working state, in one place ----------

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
export function safeColoris(config){
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
// …and EVERY slider and menu in the four making tabs (Ruby: all sliders can lock),
// found in the markup, so a new one is lockable the day it is added
if(typeof document.querySelectorAll === 'function'){
  const NOT_LOCKABLE = new Set(['soundVolume', 'uiTheme', 'cameraZoomSlider', 'textureAmbient', 'rimStrength']);   // (the zoom's slider is a view of the camera, locked with it; the Ambient slider is the light's, locked with it)
  for(const el of document.querySelectorAll('.card[data-tab="write"] input[type=range][id], .card[data-tab="style"] input[type=range][id], .card[data-tab="type"] input[type=range][id], .card[data-tab="page"] input[type=range][id], '
      + '.card[data-tab="type"] select[id], .card[data-tab="page"] select[id], .card[data-tab="style"] select[id]'))
    if(!LOCKABLE.includes(el.id) && !NOT_LOCKABLE.has(el.id)) LOCKABLE.push(el.id);
}

// id -> its lock button, so saved lock state can be reflected in the UI
export const lockButtons = new Map();

export const fontSelect = $('fontFamily');
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

export const canvas = $('poemCanvas');
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


// ---------- generic bindings ----------
function bindColorField(hexId, onChange){
  $(hexId).addEventListener('input', onChange);
}
export function setColorField(hexId, hex){
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
export function refreshUi(){
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
export const CHOOSERS = [];

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
export function setActiveRadioValue(containerId, val){
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
export const LAYER_LOCK_IDS = new Set(['textureType', 'textureOpacity', 'textureBlend', 'textureLight', 'cameraTurn', 'textureSeedValue',
  'texP1', 'texP2', 'texP3', 'texP4', 'texP5', 'texP6', 'texP7', 'texP8', 'textureShapeStrength', 'textureTint1Hex', 'textureTint2Hex', 'textureTint3Hex', 'textureTint4Hex', 'textureTint5Hex', 'textureTint6Hex', 'textureTint7Hex', 'textureTint8Hex', 'textureTint9Hex', 'textureTint10Hex', 'textureTint11Hex', 'textureTint12Hex']);
for(const id of ['textureTextAware', 'textureTextBlend', 'textureShapeAware', 'textureTextCut']) if($(id) && $(id).addEventListener) $(id).addEventListener('change', () => { paintLayerWords(); scheduleRender(); commitSoon(); });
if($('layerSeg') && $('layerSeg').addEventListener) $('layerSeg').addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('[data-layer]') : null; if(b) editLayer(b.dataset.layer); });
if($('layerSwap') && $('layerSwap').addEventListener) $('layerSwap').addEventListener('click', swapLayers);
if($('baseToggle') && $('baseToggle').addEventListener) $('baseToggle').addEventListener('change', () => {
  if(lowerOn() && !state.layers.other && state.layers.editing === 'upper'){ state.layers.other = freshLower(); state.layers.otherUi = { element: null, follows: [true, true] }; }
  syncBaseUi(); scheduleRender(); });
// the renderer draws the layer the controls don't show from here
setSurfaceSource(() => ({ editing: state.layers.editing, other: state.layers.other, lowerOn: lowerOn(), otherReading: readingOf(state.layers.other, state.layers.otherUi) }));
toggleSubblock('vignetteToggle','vignetteBlock');
$('vignetteBlend').addEventListener('change', scheduleRender);
$('vignetteIntensity').addEventListener('input', ()=>{ $('vignetteIntensityVal').textContent=$('vignetteIntensity').value+'%'; scheduleRender(); });

bindAngle('textGradientAngle','textGradientAngleVal');
bindAngle('bgGradientAngle','bgGradientAngleVal');

bindRadioGroup('alignGroup', v=>{ state.page.align=v; scheduleRender(); });
bindRadioGroup('valignGroup', v=>{ state.page.valign=v; scheduleRender(); });
// ---------- page size ----------

// ---------- the preview's scale ----------
if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', applyPreviewScaleSoon);

bindRadioGroup('aspectGroup', pickAspect);
bindRadioGroup('aspectGroupWide', pickAspect);

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
if($('usernameField') && $('usernameField').addEventListener){
  const keepCredit = () => { try { localStorage.setItem(CREDIT_KEY, String($('usernameField').value || '').slice(0, 120)); } catch(e){} };
  $('usernameField').addEventListener('input', keepCredit); $('usernameField').addEventListener('change', keepCredit);
  try { const k = typeof localStorage === 'undefined' ? null : localStorage.getItem(CREDIT_KEY); if(k != null && !$('usernameField').value) $('usernameField').value = k; } catch(e){}
}

// (typing: the page is drawn again once the keys have rested a moment, TYPING_SETTLE_MS, not on every key)
$('poemText').addEventListener('keydown', () => noteUserActivity(TYPING_SETTLE_MS));
$('poemText').addEventListener('input', ()=>{
  noteUserActivity(TYPING_SETTLE_MS);
  scheduleRender();
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

// ---------- settings: save and restore (the Workbench JSON, spells) ----------





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
export const presetGrid = $('presetGrid');

let tileFrame = 0;
function drainTiles(){
  tileFrame = 0;
  const job = tileQueue.shift(); if(job) job();
  if(tileQueue.length) tileFrame = requestAnimationFrame(drainTiles);
}
export const tileWatch = (typeof IntersectionObserver === 'function' && typeof requestAnimationFrame === 'function')
  ? new IntersectionObserver(entries => {
      for(const en of entries) if(en.isIntersecting){ tileWatch.unobserve(en.target); const job = en.target._paint; en.target._paint = null; if(job) tileQueue.push(job); }
      if(tileQueue.length && !tileFrame) tileFrame = requestAnimationFrame(drainTiles);
    }, { rootMargin: '200px' })
  : null;


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

// ---- THE LIT LOOK (Ruby): a preset or spell stays lit after it is applied,

for(const [id, act] of [['summonVariationBtn', summonVariation], ['mutateGentlyBtn', mutateGently], ['freezeSeedBtn', freezeSeed]])
  if($(id) && $(id).addEventListener) $(id).addEventListener('click', () => act());

// CUSTOM PRESETS (Ruby): the saved spells, in a card of their own under the built-in
// ones, alphabetical, in as many rows as they need (never a sideways scroller) — a
// library that can grow until the built-in ones aren't needed. Rebuilt whenever the
// saved set changes.
export const customGrid = $('customPresetGrid');



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

document.addEventListener('open', (e)=>{
  if(e.target && e.target.matches && e.target.matches('[data-coloris]')){
    safeColoris({ swatches: pickerSwatches(e.target.value) });
  }
});



// ---------- mobile layout ----------

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



// ---------- the light dial ----------
   // a cool light from the far side; on at 60%
// typing the dial's numbers turns the chosen light exactly
for(const id of ['lightDegIn', 'lightTiltIn']) if($(id) && $(id).addEventListener) $(id).addEventListener('change', () => {
  const deg = parseFloat($('lightDegIn').value), tilt = parseFloat($('lightTiltIn').value);
  const p = pickedNow(); movePicked(isNaN(deg) ? p.deg : deg, isNaN(tilt) ? p.tilt : tilt, true);
});
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
syncLightPad();
$('textureBlend').addEventListener('change', () => { keepGround(''); scheduleRender(); });
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

// ---------- locks ----------
// A locked control survives Randomize and preset changes. Rather than
// teaching every one of those paths about every control, the locked values
// are snapshotted before the change and written back after -- which works
// for any control, including ones added later.




// ---------- MASTER LOCKS and EYES, in the headings ----------
// ---------- THE DICE (Ruby): a die beside every section's lock rerolls only that section ----------
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
export const dieRolls = new Map(), diePending = new Map();
if(typeof document.addEventListener === 'function'){
  document.addEventListener('pointerdown', e => { if(dieMenu && !dieMenu.contains(e.target) && !(e.target.closest && e.target.closest('.die-more'))) closeDieMenu(); }, true);
  document.addEventListener('keydown', e => { if(dieMenu && e.key === 'Escape'){ closeDieMenu(); } });
}


$('textureType').addEventListener('change', ()=>{ syncTextureTools(true); scheduleRender(); });
syncTextureTools(true);

// ---------- the four readings of a surface (🜂 🜄 🜁 🜃) ----------
// textureElements.js: each texture's Fire, Water, Wind and Earth — one of
// them its default. A button sets what that reading names (knobs, hues, blend,
// light) the way ⚄ Randomize does: a LOCKED control keeps its value, so
// readings can be mixed (lock the hues of one, apply another's knobs).
// (the surface menu's chooser, once it is attached: the applied reading's name rides in its field)
export let surfaceChooser = null;
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
export const pmlEditor = installEditor({
  textarea: $('poemText'),
  mirror: $('poemMirror'),
  gutter: $('poemGutter'),
  hint: $('poemHint'),
  knownFont: name => fontIndexByName(name) >= 0,
});

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

   // (the poem's lines kept in view while the keyboard is up; the preview has the rest)
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
if(document.querySelectorAll) document.querySelectorAll('input[data-angle]').forEach(addAngleSnap);


// ---------- text effects: three slots (effects.js) ----------
for(const i of [1, 2, 3]) Object.assign(EFFECT_SLOT_DEFAULTS, { ['fx'+i+'Type']:'none', ['fx'+i+'Color']:'#ffffff', ['fx'+i+'K1']:'40', ['fx'+i+'K2']:'70', ['fx'+i+'Angle']:'45' });
EFFECT_SLOT_DEFAULTS.underAll = '';
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
/** A texture made in the worker, handed to `done` when it is ready (the newest wish per slot wins). */
export const workerWish = new Map();
if(document.addEventListener) for(const ev of ['input', 'change']) document.addEventListener(ev, e => {
  const t = e.target; if(!t || t.id !== 'textureType' || !TRY_GRAPH.test(String(t.value))) return;
  const g = tryGraphOf(t.value), v = g ? validateGraph(JSON.stringify(g)) : { ok: false, problems: ['it is not in this version'] };
  if(!v.ok){ t.value = 'athanor'; hardNo('That surface can’t be used', v.problems.join('; ') + '.'); return; }
  // (only the PAGE takes it: the Athanor's bench keeps its work)
  $('forgeGraph').value = JSON.stringify(v.graph); t.value = 'athanor';
  applyAthanorGraph(true); paintForgeSummary();
  if(openForge.paintPage) openForge.paintPage();
}, true);
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
setTimeout(paintShelfOptions, 0); setTimeout(paintTryOptions, 0);
if($('protectTextBtn') && $('protectTextBtn').addEventListener) $('protectTextBtn').addEventListener('click', () => { protectText(); });
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
if($('cardLink') && $('cardLink').addEventListener) $('cardLink').addEventListener('change', () => { syncLinkedBox(); scheduleRender(); });


// ---------- word seeds ----------
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

// ---------- asking first, and saying no ----------
          // (the action's own history step brings it to 0)
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




export const vault = createVault({
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
    vaultTick = setTimeout(()=>vault.refresh(), 300);   // (once the hand rests: a refresh reads every setting)
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
try { restoreDraft(); } catch(e){ /* a draft never stops the app opening: the welcome page stands */ }
if(typeof window !== 'undefined' && window.addEventListener){
  window.addEventListener('load', () => { reconcileControls(); setTimeout(reconcileControls, 2500); }, { once: true });
  window.addEventListener('pageshow', e => { if(e && e.persisted) reconcileControls(); });
  if(typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') resyncSurfaceControls(); });
  for(const b of (document.querySelectorAll ? document.querySelectorAll('.tab-btn[data-tab="page"]') : [])) b.addEventListener('click', resyncSurfaceControls); }
// every way a poem or look changes passes through one of these (typing, sliders, presets, the
// Grimoire, spells, JSON, undo); the save reads the page as it is when the moment is up
for(const type of ['input', 'change', 'click', 'keydown']) document.addEventListener(type, saveDraftSoon, true);
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') saveDraft(); });
if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', saveDraft);
// Fonts are fetched on first use now (fonts.js, asked for by the renderer);
// the first render happens as soon as the page is ready.
render();
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

// ---------- the history FILMSTRIP ----------
// The last eight looks in history, as small frames inside the preview; the
// one you're on is lit; a click goes straight back (or forward) to it — as a
// step of undo, so nothing is lost. 🎞 (or H) shows and hides it; whether it
// shows is remembered per browser (it is part of the app, not of a look).
export const FILM_MAX = 8, filmCache = new Map();
{
  let open = !detectMobile();                               // on by default on a desktop
  try { const v = localStorage.getItem('uv.filmstrip.v1'); if(v !== null) open = v === '1'; } catch(e){}
  setTimeout(() => setFilmstrip(open), 0);
  if($('filmBtn') && $('filmBtn').addEventListener) $('filmBtn').addEventListener('click', () => {
    const wrap = $('filmstrip').parentElement; setFilmstrip(!(wrap.classList && wrap.classList.contains('film-open'))); });
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
if($('shortcutBtn') && $('shortcutBtn').addEventListener) $('shortcutBtn').addEventListener('click', () => showShortcuts(true));
if($('shortcutSheet') && $('shortcutSheet').addEventListener) $('shortcutSheet').addEventListener('click', (e) => { if(e.target === $('shortcutSheet')) showShortcuts(false); });
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
export const workingLine = $('workingLine');
if(document.addEventListener) document.addEventListener('vellum-working', e => setWorking(e && e.detail && e.detail.what));

// tiles take their textures from the cache or the worker, never made here (swatches.js)
setSwatchTextureSource((type, w, h, opts) => {
  const hit = peekTexture(textureKeyFor(type, w, h, opts)); if(hit) return hit;
  requestTexture('swatch:' + textureKeyFor(type, w, h, opts), type, w, h, opts);
  return peekTexture(textureKeyFor(type, w, h, opts)) || null;
});
onTextureReady(() => swatchTexturesArrived());

// ---------- SURFACES MADE IN THE ATHANOR, in the surface menu ----------

// THE ATHANOR'S OPEN, AS TILES: a graph's thumbnail (a starter, a study) made in the worker and kept by its wiring;
// an app texture's is the surface menu's own, from the same keeping; a kept surface's is its shelf thumbnail
export let surfaceTiles = null;
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
