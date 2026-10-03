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

import { texturesSettled } from './textureService.js';
import { STITCH_STYLES, STITCH_LABELS } from './stitches.js';
import { EFFECT_DEFS, EFFECT_TYPES, legacyOutline, legacyTypeEffect } from './effects.js';
import { $, FONTS, PRESETS, ASPECTS, SIZE_LIMITS, DEV_TEMPLATE, isProductionHost, OPEN_ON_POEM } from './appOptions.js';
import { applyEscapes, tokenizeInline } from './textParsers.js';
import { render, scheduleRender, invalidateTextMeasurements, setRenderScale } from './canvasRenderer.js';
import { paramsFor, capsFor, paramReadout, clearTextureCache } from './textureGenerators.js';
import { createVault, stripToLook } from './vault.js';
import { applyTheme, savedTheme } from './theme.js';
import { registerServiceWorker } from './pwa.js';
import { moonPhase, moonGlyph, moonGlyphURI, phaseName } from './moon.js';
import { moonForSeed } from './texWhimsy.js';
import { paintPresetSwatch } from './swatches.js';
import { deriveThemePalette } from './palette.js';
import { installEditor } from './editor.js';
import { PREVIEW, SWATCH, DEFAULTS } from './tunables.js';
import { applyStrings, fill, PICKER } from './strings.js';

// the border's stitch menu and the help's stitch list, from the library itself
{ const bs = $('borderStitch');
  if(bs && 'innerHTML' in bs) bs.innerHTML = STITCH_STYLES.map(k => `<option value="${k}">${STITCH_LABELS[k]}</option>`).join('');
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
  page: { align: 'left', valign: 'center', aspect: '1:1', bgStops: 2, textStops: 2, exportW: 0, exportH: 0 },
  ui:   { tintBySystem: false, tintFollows: [true, true], poemTimer: null, palette: [], pickingField: null, zoom: 1, fullPreview: false, saving: false, previewMeasured: false },
  locks: new Set(),
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
function safeColoris(config){
  if(typeof Coloris !== 'function') return;
  try {
    Coloris(config);
  } catch(e){
    console.warn('Coloris call failed, continuing without it:', e);
  }
}

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

// ---------- lock state ----------
// The lock set itself lives in `state.locks` (top of the file). This is the
// list of controls that CAN be locked.
const LOCKABLE = [
  'bgColor1Hex','bgColor2Hex','bgColor3Hex','bgColor4Hex',
  'textColorHex','textColor2Hex','textColor3Hex','textColor4Hex',
  'accent1ColorHex','accent2ColorHex','borderColorHex',
  'fontFamily','textureType','textureOpacity','textureBlend','textureLight',
  'textureTint1Hex','textureTint2Hex','texP1','texP2','texP3','texP4','texP5','textureSeedValue',
];
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
FONTS.forEach((f,i)=>{
  const opt = document.createElement('option');
  opt.value = i; opt.textContent = f.label;
  fontSelect.appendChild(opt);
});
fontSelect.value = 3;

$('fontIndexList').innerHTML = FONTS.map((f,i)=>`${i} &nbsp;${f.family}`).join('<br>');

const canvas = $('poemCanvas');
const ctx = canvas.getContext('2d');

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

function toggleSubblock(checkboxId, blockId){
  const box = $(checkboxId), block = $(blockId);
  const sync = ()=>{ block.classList.toggle('open', box.checked); scheduleRender(); };
  box.addEventListener('change', sync);
  sync();
}

function bindAngle(rangeId, labelId){
  const r = $(rangeId), l = $(labelId);
  r.addEventListener('input', ()=>{ l.textContent = r.value+'°'; scheduleRender(); });
}

function bindRadioGroup(containerId, onSelect){
  const group = $(containerId);
  group.querySelectorAll('.radio-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.radio-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.val);
    });
  });
}
function setActiveRadioValue(containerId, val){
  const group = $(containerId);
  group.querySelectorAll('.radio-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.val === String(val));
  });
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
  setRenderScale(w / state.page.exportW);
  scheduleRender();
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

function applyCustomSize(){
  const w = clampSize($('customW').value);
  const h = clampSize($('customH').value);
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
  else pickAspect('1:1');
}
$('customSizeToggle').addEventListener('change', syncCustomSize);
['customW','customH'].forEach(id => $(id).addEventListener('change', ()=>{
  if($('customSizeToggle').checked) applyCustomSize();
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
}
$('textureSeedValue').addEventListener('input', scheduleRender);
$('textureSeedReroll').addEventListener('click', ()=>{
  $('textureSeedValue').value = randomSeed();
  scheduleRender();
});


['fontFamily','maxSize','borderThickness','borderOffset','usernameField'].forEach(id=>{
  $(id).addEventListener('input', scheduleRender);
});
$('usernameCorner').addEventListener('change', scheduleRender);

$('poemText').addEventListener('input', ()=>{
  clearTimeout(state.ui.poemTimer);
  state.ui.poemTimer = setTimeout(scheduleRender, 150);
});

$('lineSpacing').addEventListener('input', ()=>{
  const spacing = Math.pow(2, parseFloat($('lineSpacing').value) || 0);
  $('lineSpacingVal').textContent = spacing.toFixed(2)+'x';
  scheduleRender();
});

$('randomFontBtn').addEventListener('click', ()=>{
  // locked controls are restored after the randomiser runs
  withLocksPreserved(()=>{
  fontSelect.value = Math.floor(Math.random()*FONTS.length);
  setColorField('textColorHex', randHex());

  const gradOn = Math.random() < 0.6;
  $('textGradientToggle').checked = gradOn;
  $('gradientBlock').classList.toggle('open', gradOn);
  if(gradOn){
    setColorField('textColor2Hex', randHex());
    $('textGradientAngle').value = Math.floor(Math.random()*360);
    $('textGradientAngleVal').textContent = $('textGradientAngle').value+'°';
  }

  setColorField('accent1ColorHex', randHex());
  setColorField('accent2ColorHex', randHex());

  scheduleRender();
  });
});
$('randomBgBtn').addEventListener('click', ()=>{
  // locked controls are restored after the randomiser runs
  withLocksPreserved(()=>{
  maybeRerollSeed();
  setColorField('bgColor1Hex', randHex());

  const bgGradOn = Math.random() < 0.7;
  $('bgGradientToggle').checked = bgGradOn;
  $('bgGradientBlock').classList.toggle('open', bgGradOn);
  if(bgGradOn){
    setColorField('bgColor2Hex', randHex());
    $('bgGradientAngle').value = Math.floor(Math.random()*360);
    $('bgGradientAngleVal').textContent = $('bgGradientAngle').value+'°';
  }

  const texOn = Math.random() < 0.5;
  $('textureToggle').checked = texOn;
  $('textureBlock').classList.toggle('open', texOn);
  if(texOn){
    const types = ['clouds','bokeh','astral','magicparticles','embers','snow','grain','metalleaf','flowers','brushstrokes','halftone','rainstreaks','sigils','mathnoise','summoning','inkbleed','crackedglaze','tessellate','aurora','hatch','cards',
      'linen','coldpress','foxing','foldghost','cupring','wax','glassrain','dunes','kintsugi','moss'];
    $('textureType').value = types[Math.floor(Math.random()*types.length)];
    const op = Math.floor(Math.random()*22)+4;
    $('textureOpacity').value = op;
    paintMoons();
  }

  const borderOn = Math.random() < 0.4;
  $('borderToggle').checked = borderOn;
  $('borderBlock').classList.toggle('open', borderOn);
  if(borderOn){
    setColorField('borderColorHex', randHex());
    $('borderThickness').value = Math.floor(Math.random()*6)+1;
    $('borderOffset').value = Math.floor(Math.random()*40);
  }

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
  state.ui.saving = true; btn.textContent = 'Saving…'; btn.disabled = true;
  if(document.body && document.body.classList) document.body.classList.add('saving');
  const pw = canvas.width, ph = canvas.height;
  try {
    canvas.width = state.page.exportW || pw; canvas.height = state.page.exportH || ph;
    setRenderScale(1); render();
    await texturesSettled();
    render();
    link.href = canvas.toDataURL('image/jpeg', 1.0);
  } finally {
    canvas.width = pw; canvas.height = ph;
    setRenderScale(pw / (state.page.exportW || pw));
    state.ui.saving = false; btn.textContent = label; btn.disabled = false;
    if(document.body && document.body.classList) document.body.classList.remove('saving');
    render();
  }
  link.click();
});

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
  ['bgRadialX',            'bgRadialX',            'text', '%'],
  ['bgRadialY',            'bgRadialY',            'text', '%'],
  ['bgRadialR',            'bgRadialR',            'text', '%'],
  ['borderGrain',          'borderGrain',          'text', '%'],
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

function serializeCurrentSettings(){
  return {
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

    accent1: $('accent1Toggle').checked ? $('accent1ColorHex').value : undefined,
    accent2: $('accent2Toggle').checked ? $('accent2ColorHex').value : undefined,


    texture: $('textureToggle').checked,
    textureType: $('textureType').value,
    // the mechanical controls, from the PERSISTED table above
    ...collectPersisted(),
    spell: $('activeSpell').value,
    highlight: $('highlightToggle') ? $('highlightToggle').checked : true,
    // which controls the user has pinned against Randomize and presets
    locks: Array.from(state.locks),
    textureBlend: $('textureBlend').value,
    textureLight: $('textureLight').value,
    textureLightTilt: $('textureLightTilt') ? $('textureLightTilt').value : '100',
    textureTint1: $('textureTint1Hex').value,
    textureTint2: $('textureTint2Hex').value,
    texP1: $('texP1').value,
    texP2: $('texP2').value,
    texP3: $('texP3').value,
    texP4: $('texP4').value,
    texP5: $('texP5').value,
    textureOpacity: parseFloat($('textureOpacity').value),
    textureSeed: parseInt($('textureSeedValue').value, 10),

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

    poemText: $('poemText').value,
  };
}

function restoreSettings(s){
  // a look saved with the retired Zen Garden opens as Dune Ripples
  if(s && s.textureType === 'whorl') s = { ...s, textureType: 'dunes' };
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
  // the mechanical controls, from the PERSISTED table
  applyPersisted(s);
  if(typeof refreshReadouts === 'function'){ refreshReadouts(); syncFrameVisibility(); }
  if(s.spell !== undefined) $('activeSpell').value = s.spell;
  if(s.highlight !== undefined && $('highlightToggle')){
    $('highlightToggle').checked = !!s.highlight;
    if(document.body && document.body.classList) document.body.classList.toggle('plain-editor', !s.highlight);
  }
  if(Array.isArray(s.locks)) restoreLockState(s.locks);
  if(s.textureBlend) $('textureBlend').value = s.textureBlend;
  if(s.textureLight !== undefined || s.textureLightTilt !== undefined){
    if(s.textureLight !== undefined) $('textureLight').value = s.textureLight;
    // looks saved before the dial had raking light only: 100
    if($('textureLightTilt')) $('textureLightTilt').value = s.textureLightTilt !== undefined ? s.textureLightTilt : '100';
    syncLightPad(); }
  if(s.textureTint1) setColorField('textureTint1Hex', s.textureTint1);
  if(s.textureTint2) setColorField('textureTint2Hex', s.textureTint2);
  if(s.texP1 !== undefined) $('texP1').value = s.texP1;
  if(s.texP2 !== undefined) $('texP2').value = s.texP2;
  if(s.texP3 !== undefined) $('texP3').value = s.texP3;
  if(s.texP4 !== undefined) $('texP4').value = s.texP4;
  if(s.texP5 !== undefined) $('texP5').value = s.texP5;
  syncTextureParams(false);
  if(s.textureOpacity!==undefined){ $('textureOpacity').value=s.textureOpacity; paintMoons(); }
  if(s.textureSeed!==undefined) $('textureSeedValue').value = s.textureSeed;

  $('borderToggle').checked = !!s.border;
  $('borderBlock').classList.toggle('open', !!s.border);
  if(s.borderColor) setColorField('borderColorHex', s.borderColor);
  if(s.borderThickness!==undefined) $('borderThickness').value = s.borderThickness;
  if(s.borderOffset!==undefined) $('borderOffset').value = s.borderOffset;

  $('vignetteToggle').checked = !!s.vignette;
  $('vignetteBlock').classList.toggle('open', !!s.vignette);
  if(s.vignetteBlend) $('vignetteBlend').value = s.vignetteBlend;
  if(s.vignetteIntensity!==undefined){ $('vignetteIntensity').value=s.vignetteIntensity; $('vignetteIntensityVal').textContent=s.vignetteIntensity+'%'; }

  if(s.align){ state.page.align=s.align; setActiveRadioValue('alignGroup', s.align); }
  if(s.valign){ state.page.valign=s.valign; setActiveRadioValue('valignGroup', s.valign); }
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

  if(s.username!==undefined) $('usernameField').value = s.username;
  if(s.usernameCorner) $('usernameCorner').value = s.usernameCorner;
  if(s.poemText!==undefined){ $('poemText').value = s.poemText; repaintEditor(); }

  scheduleRender();
  paintMoons();
  paintSeedMoon();
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
  try{
    const obj = JSON.parse($('advancedJson').value);
    restoreSettings(obj);
  } catch(e){
    alert("That JSON couldn't be parsed — check for a stray comma or missing bracket.");
  }
});
// populate once on load so there's something to see/copy immediately
$('advancedJson').value = JSON.stringify(serializeCurrentSettings(), null, 2);

// ---------- presets ----------
const presetGrid = $('presetGrid');
const PRESET_COLUMNS = 4;

/** One tile: painted snapshot above its name. */
function presetTile(p, onPick, extraClass){
  const btn = document.createElement('div');
  btn.className = 'preset-btn' + (extraClass ? ' ' + extraClass : '');
  const swatch = document.createElement('canvas');
  swatch.className = 'preset-swatch';
  paintPresetSwatch(swatch, p, SWATCH.width, SWATCH.height);
  const label = document.createElement('span');
  label.className = 'preset-label';
  label.textContent = p.name;
  btn.appendChild(swatch);
  btn.appendChild(label);
  if(onPick) btn.addEventListener('click', onPick);
  return btn;
}

PRESETS.forEach(p => presetGrid.appendChild(presetTile(p, ()=>applyPreset(p))));

// Saved spells join the same grid rather than living only in Esoterica.
// Everything from the divider down is rebuilt whenever the saved set changes,
// so the built-in tiles above it are never touched.
const builtInCount = presetGrid.children.length;

function renderSavedPresets(saved){
  while(presetGrid.children.length > builtInCount){
    presetGrid.removeChild(presetGrid.children[presetGrid.children.length - 1]);
  }
  if(!saved || !saved.length) return;

  const divider = document.createElement('p');
  divider.className = 'preset-divider';
  divider.textContent = 'Bound Spells';
  presetGrid.appendChild(divider);

  for(const rec of saved){
    const shot = Object.assign({ name: rec.name }, rec.settings, { spell: rec.spell });
    presetGrid.appendChild(presetTile(shot, ()=>{
      // the same filter as applying from Esoterica — a spell is a look
      restoreSettings(stripToLook(Object.assign({}, rec.settings, { spell: rec.spell })));
      if(document.body && document.body.dataset) document.body.dataset.lookName = rec.name || '';
      scheduleRender();
    }, 'preset-custom'));
  }

  // blanks so a part-filled last row stays rectangular
  const remainder = saved.length % PRESET_COLUMNS;
  if(remainder){
    for(let i = remainder; i < PRESET_COLUMNS; i++){
      const blank = document.createElement('div');
      blank.className = 'preset-btn preset-empty';
      blank.setAttribute('aria-hidden', 'true');
      presetGrid.appendChild(blank);
    }
  }
}

function applyThemePalette(colors){
  state.ui.palette = colors;
  safeColoris({ swatches: colors });
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

// The 16th swatch: the field's own current value, appended as its picker
// opens, so you can audition the theme's colours and still get back to what
// you had. (On phones the picker's position is set by CSS: docked above the
// keyboard at the bottom right.)
document.addEventListener('open', (e)=>{
  if(e.target && e.target.matches && e.target.matches('[data-coloris]')){
    safeColoris({ swatches: [...state.ui.palette, e.target.value] });
  }
});

function applyPreset(p){
  // a locked control is put back exactly as it was once the preset lands
  const __locks = snapshotLocked();
  try {
  applyThemePalette(deriveThemePalette(p));
  maybeRerollSeed(p.textureSeed);
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
    refreshReadouts(); syncFrameVisibility();
    const pcaps = capsFor($('textureType').value);
    if(p.textureBlend && pcaps.blends.includes(p.textureBlend)) $('textureBlend').value = p.textureBlend;
    // a preset's own tint is a choice, like a hand-picked one: it stops
    // following the accents, so changing an accent later won't replace it
    if(p.textureTint1){ setColorField('textureTint1Hex', p.textureTint1); state.ui.tintFollows[0] = false; }
    if(p.textureTint2){ setColorField('textureTint2Hex', p.textureTint2); state.ui.tintFollows[1] = false; }
    syncLightPad();
    restoreLocked(__locks);
    // a preset changes opacity and seed without anyone touching them
    paintMoons();
    paintSeedMoon();
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
  function activateTab(name){
    // Esoterica is the options menu: on a desktop it opens as a drawer, and
    // choosing it again closes it, back to whatever was open before
    if(name === 'more' && current === 'more') name = before;
    if(name !== current){ before = current; current = name; }
    if(document.body && document.body.classList){
      document.body.classList.toggle('more-open', name === 'more');
      const bar = document.getElementById && document.getElementById('tabBar');
      if(name === 'more' && bar && bar.getBoundingClientRect && document.documentElement.style)
        document.documentElement.style.setProperty('--desk-top', Math.round(bar.getBoundingClientRect().bottom) + 'px');
    }
    panels.forEach(p => p.classList.toggle('tab-active', p.dataset.tab === name));
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    // a tab change is a context change; start it from the top
    if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo({top:0, behavior:'instant'});
    const ctl = document.querySelector && document.querySelector('.controls'); if(ctl) ctl.scrollTop = 0;
  }
  tabBtns.forEach(b => b.addEventListener('click', () => activateTab(b.dataset.tab)));
  activateTab('write');
}

if(detectMobile() && typeof document.querySelectorAll === 'function'){
  document.body.classList.add('is-mobile');


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
    // One variable drives both orientations: in portrait it is a share of
    // height, in landscape a share of width. The handle reads whichever axis
    // it is actually dividing.
    const sideBySide = () => window.innerWidth > window.innerHeight;
    const fracFor = (e) => {
      const r = stageEl.getBoundingClientRect();
      if(sideBySide()) return (e.clientX - r.left) / (window.innerWidth || 1);
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
    handle.addEventListener('pointermove', (e)=>{ if(dragging){ setFrac(fracFor(e)); e.preventDefault(); } });
    ['pointerup','pointercancel'].forEach(t => handle.addEventListener(t, ()=>{
      dragging = false;
      document.body.classList.remove('dragging-divider');
    }));
    // a double-tap on the grip restores the default split
    let lastTap = 0;
    handle.addEventListener('pointerup', ()=>{
      const now = Date.now();
      if(now - lastTap < 320) setFrac(0.30);
      lastTap = now;
    });
  }

  // ---- pinch to zoom, drag to pan ----
  // Transform-only: the canvas bitmap is untouched, so the downloaded image
  // is never affected by how it is being inspected.
  const wrap = typeof document.querySelector === 'function' ? document.querySelector('.canvas-wrap') : null;
  const cv = $('poemCanvas');
  if(wrap && cv && wrap.addEventListener){
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

// ---------- texture parameters ----------
// Each texture declares two knobs (see TEXTURE_PARAMS). The sliders relabel
// and re-range themselves when the texture changes, so a control never says
// "value 1" -- it says Sigil zoom, or Slant, or Nebula density.
function syncTextureParams(useDefaults){
  const defs = paramsFor($('textureType').value);
  // two knobs for every texture, a third (Form) for many, up to five for the
  // richest (Dream Bloom); a knob a texture doesn't have is hidden
  [0,1,2,3,4].forEach(i=>{
    const def = defs[i];
    const row = $('texP'+(i+1)).parentElement;
    const slider = $('texP'+(i+1));
    const label = $('texP'+(i+1)+'Label');
    const out = $('texP'+(i+1)+'Val');
    if(!def){
      if(row) row.style.display = 'none';
      return;
    }
    if(row) row.style.display = '';
    slider.min = def.min; slider.max = def.max;
    // a knob that is an angle gets 45° ticks and ∡; a knob with its own ticks
    // (Lotus's species, Linen's weaves, bokeh shapes) gets those and ⊹, which
    // locks it to the nearest tick; any other knob gets neither
    setKnobTicks(slider, i, def);
    if(useDefaults || slider.value === '' || +slider.value < def.min || +slider.value > def.max){
      slider.value = def.def;
    }
    label.textContent = def.label;
    out.textContent = paramReadout(def, +slider.value);
  });
}

['texP1','texP2','texP3','texP4','texP5'].forEach(id=>{
  $(id).addEventListener('input', ()=>{
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
  const lt = (capsFor($('textureType').value) || {}).lightTilt;
  if(lt != null && $('textureLightTilt')){ $('textureLightTilt').value = String(lt); syncLightPad(); }
  scheduleRender();
});
syncTextureParams(true);


// ---------- texture tools ----------
// Blend mode, light direction and tints are declared per texture (see
// TEXTURE_CAPS). Anything a texture cannot use is disabled rather than left
// live and inert -- a control that silently does nothing is worse than one
// that is visibly unavailable.
const BLEND_LABELS = {
  'source-over':'Normal',
  'overlay':'Overlay', 'soft-light':'Soft Light', 'hard-light':'Hard Light',
  'multiply':'Multiply', 'screen':'Screen', 'lighten':'Lighten',
  'darken':'Darken', 'color-burn':'Color Burn', 'color-dodge':'Color Dodge',
};

function syncTextureTools(resetToDefaults){
  const type = $('textureType').value;
  const caps = capsFor(type);

  // blend list is rebuilt per texture; the first entry is that texture's default
  const sel = $('textureBlend');
  const previous = sel.value;
  sel.innerHTML = '';
  caps.blends.forEach((b, i)=>{
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = BLEND_LABELS[b] || b;
    if(i === 0) opt.textContent += ' (default)';
    sel.appendChild(opt);
  });
  sel.value = (!resetToDefaults && caps.blends.includes(previous)) ? previous : caps.blends[0];

  const lightRow = $('lightRow');
  if(lightRow) lightRow.classList.toggle('tool-off', !caps.light);

  const t1 = $('tint1Row'), t2 = $('tint2Row');
  if(t1) t1.classList.toggle('tool-off', caps.tints < 1);
  if(t2) t2.classList.toggle('tool-off', caps.tints < 2);
  if(caps.tints >= 1) $('tint1Label').textContent = (caps.tintLabels||[])[0] || 'Tint';
  if(caps.tints >= 2) $('tint2Label').textContent = (caps.tintLabels||[])[1] || 'Second tint';

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
    state.ui.tintBySystem = false;
    // a freshly defaulted tint follows its source until you pick one by hand
    state.ui.tintFollows[0] = state.ui.tintFollows[1] = true;
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
  const ids = ['textureTint1Hex', 'textureTint2Hex'];
  let changed = false;
  for(let i = 0; i < Math.min(caps.tints || 0, 2); i++){
    const src = defs[i] === 'accent1' ? 'accent1ColorHex' : defs[i] === 'accent2' ? 'accent2ColorHex' : null;
    if(!src || !state.ui.tintFollows[i] || state.locks.has(ids[i])) continue;
    state.ui.tintBySystem = true;
    setColorField(ids[i], $(src).value);
    state.ui.tintBySystem = false;
    changed = true;
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
function syncLightPad(){
  const deg = parseFloat($('textureLight').value) || 0, tilt = $('textureLightTilt') ? parseFloat($('textureLightTilt').value) : 100;
  const k = Math.max(0, Math.min(100, isNaN(tilt) ? 100 : tilt)) / 100, a = deg * Math.PI / 180;
  const set = (id, attrs) => { const el = $(id); if(el && el.setAttribute) for(const key in attrs) el.setAttribute(key, attrs[key]); };
  // the dot slides from the heart of ☉ toward the rim
  set('lightHandle', { cx: (Math.sin(a) * 15 * k).toFixed(2), cy: (-Math.cos(a) * 15 * k).toFixed(2) });
  // 🜚's spike grows out of the rim the same way: longer and stronger as the light lowers
  const tip = 26 + 3 + 15 * k;
  set('lightSpikeBody', { points: `-3.4,-24.5 3.4,-24.5 0,${(-tip).toFixed(2)}` });
  set('lightSpike', { transform: `rotate(${deg.toFixed(1)})`, opacity: k < 0.04 ? 0 : (0.35 + 0.65 * k).toFixed(2) });
  const dial = $('lightDial');
  if(dial && dial.querySelectorAll) dial.querySelectorAll('.ld-tick').forEach(t => t.classList.toggle('active', tilt >= 99 && Math.abs(((deg - +t.dataset.deg + 540) % 360) - 180) < 0.5));
  if(dial && dial.setAttribute) dial.setAttribute('aria-valuetext', `${Math.round(deg)}°, ${Math.round(tilt)}% low`);
}
function setLight(deg, tilt, commit){
  $('textureLight').value = String(Math.round(((deg % 360) + 360) % 360));
  if($('textureLightTilt')) $('textureLightTilt').value = String(Math.round(Math.max(0, Math.min(100, tilt))));
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
if($('lightDial') && $('lightDial').addEventListener){
  const dial = $('lightDial');
  const fromPointer = (e, snapTicks) => {
    const rc = dial.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * 100 - 50, y = (e.clientY - rc.top) / rc.height * 100 - 50;
    let deg = Math.atan2(x, -y) * 180 / Math.PI, tilt = Math.min(1, Math.hypot(x, y) / 30) * 100;   // the rim of ☉ is full
    // near a tick on the rim, take its exact direction at the horizon
    if(snapTicks || tilt > 88){ const nearest = Math.round(deg / 45) * 45; if(Math.abs(nearest - deg) < 7){ deg = nearest; if(tilt > 88) tilt = 100; } }
    setLight(deg, tilt, false);
  };
  let dragging = false;
  dial.addEventListener('pointerdown', e => { dragging = true; if(dial.setPointerCapture) dial.setPointerCapture(e.pointerId); fromPointer(e, e.target && e.target.classList && e.target.classList.contains('ld-tick')); });
  dial.addEventListener('pointermove', e => { if(dragging) fromPointer(e, false); });
  const end = () => { if(dragging){ dragging = false; if(typeof commitSoon === 'function') commitSoon(); } };
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  // keys: arrows turn it by 15°, page up/down raise and lower it
  dial.addEventListener('keydown', e => {
    const deg = parseFloat($('textureLight').value) || 0, tilt = parseFloat(($('textureLightTilt') || {}).value) || 100;
    const map = { ArrowRight: [15, 0], ArrowDown: [15, 0], ArrowLeft: [-15, 0], ArrowUp: [-15, 0], PageUp: [0, -10], PageDown: [0, 10] };
    if(map[e.key]){ e.preventDefault(); setLight(deg + map[e.key][0], tilt + map[e.key][1], true); }
  });
}
if($('lightReset') && $('lightReset').addEventListener) $('lightReset').addEventListener('click', () => setLight(LIGHT_DEFAULT.deg, LIGHT_DEFAULT.tilt, true));
syncLightPad();
$('textureBlend').addEventListener('change', scheduleRender);
// choosing a tint yourself stops it following the accents
bindColorField('textureTint1Hex', ()=>{ if(!state.ui.tintBySystem) state.ui.tintFollows[0] = false; scheduleRender(); });
bindColorField('textureTint2Hex', ()=>{ if(!state.ui.tintBySystem) state.ui.tintFollows[1] = false; scheduleRender(); });

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
    btn.title = 'Lock this — Randomize and presets will leave it alone';
    btn.innerHTML = LOCK_GLYPH;
    const paint = ()=>{
      const on = state.locks.has(id);
      btn.classList.toggle('locked', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on ? 'Locked — Randomize and presets leave this alone'
                     : 'Lock this against Randomize and presets';
      // the control itself dims, so a locked setting is obvious at a glance
      if(field && field.classList) field.classList.toggle('field-locked', on);
    };
    btn.addEventListener('click', ()=>{
      if(state.locks.has(id)) state.locks.delete(id); else state.locks.add(id);
      paint();
    });
    btn._paint = paint;
    lockButtons.set(id, btn);
    if(host && host.appendChild) host.appendChild(btn);
  }
}

/** Rebuilds the lock set and the buttons' appearance from a saved list. */
function restoreLockState(ids){
  state.locks.clear();
  for(const id of ids) if(LOCKABLE.includes(id)) state.locks.add(id);
  for(const [, btn] of lockButtons) if(btn._paint) btn._paint();
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
  for(const id in snap){
    const n = $(id);
    if(!n) continue;
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
  const snap = snapshotLocked();
  fn();
  restoreLocked(snap);
}

$('textureType').addEventListener('change', ()=>{ syncTextureTools(true); scheduleRender(); });
syncTextureTools(true);
syncLightPad();
installLocks();

// ---------- PML editor ----------
// The mirror carries the colour; the textarea keeps the caret, the selection
// and the system keyboard. Repainted on input, and again whenever anything
// else writes to the field (presets, the Grimoire, restored settings).
const pmlEditor = installEditor({
  textarea: $('poemText'),
  mirror: $('poemMirror'),
  gutter: $('poemGutter'),
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
  const moreLabel = moreBtn ? moreBtn.textContent : '';
  const moreIcon = moreBtn && moreBtn.innerHTML;

  function enterFocus(){
    if(!body.classList || body.classList.contains('focus-mode')) return;
    body.classList.add('focus-mode');
    const card = poem.closest ? poem.closest('.card') : null;
    if(card) card.classList.add('focus-keep');
    // Schema becomes Return, carrying the Touch mark — the glyph the app
    // uses to mean "touch this"
    // the box changes size as the class lands; repaint once it has
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(repaintEditor);
    if(moreBtn) moreBtn.innerHTML = '<span class="tab-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><circle cx="12.3" cy="11.7" r="8.9" opacity=".5"/><circle cx="11.7" cy="12.3" r="7.9" opacity=".32"/><circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none"/><circle cx="12.2" cy="11.8" r="2.5" opacity=".45"/></svg></span>' + 'Return';
  }
  function exitFocus(){
    if(!body.classList || !body.classList.contains('focus-mode')) return;
    body.classList.remove('focus-mode');
    document.querySelectorAll('.focus-keep').forEach(c => c.classList.remove('focus-keep'));
    if(moreBtn && moreIcon) moreBtn.innerHTML = moreIcon;
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
  // the phone's own back gesture should leave focus mode, not the page
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('popstate', ()=>{
      if(body.classList && body.classList.contains('focus-mode')) exitFocus();
    });
  }
}

// reset the preview to its default framing
if($('resetViewBtn') && $('resetViewBtn').addEventListener){
  $('resetViewBtn').addEventListener('click', ()=>{
    const root2 = document.documentElement;
    if(root2 && root2.style) root2.style.setProperty('--preview-frac', '0.30');
    const cv = $('poemCanvas');
    if(cv && cv.style) cv.style.transform = '';
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
  slider.step = '1'; if(slider.dataset) delete slider.dataset.snapTicks;
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
  } else { if(slider.removeAttribute) slider.removeAttribute('list'); hideBtn(); }
  // 🎲 — a knob that asks for one (Object Shape) gets a die that picks a mark at random
  if(!slider._dice && def.dice && document.createElement && slider.parentNode && slider.parentNode.insertBefore){
    const d = document.createElement('button'); d.type = 'button'; d.className = 'snap-btn dice-btn'; d.textContent = '🎲'; d.title = 'Pick one at random';
    d.addEventListener('click', () => { const t = (slider.dataset.ticks || '').split(',').map(Number).filter(n => !isNaN(n));
      if(t.length){ slider.value = t[Math.floor(Math.random()*t.length)]; slider.dispatchEvent(new Event('input', { bubbles: true })); } });
    slider.parentNode.insertBefore(d, (slider._snapBtn && slider._snapBtn.nextSibling) || slider.nextSibling); slider._dice = d;
  }
  if(slider._dice && slider._dice.style) slider._dice.style.display = def.dice ? '' : 'none';
}

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
    if($('fx'+i+k+'Label')) $('fx'+i+k+'Label').textContent = def[0];
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
  borderGrain:'%', borderRadius:'px', cardGradientAngle:'°' };
function refreshReadouts(){
  for(const [id, unit] of Object.entries(RANGE_UNITS)){ const el = $(id), out = $(id + 'Val'); if(el && out) out.textContent = el.value + unit; }
  paintMoons();
}
/** Shows each control only when it applies. */
function syncFrameVisibility(){
  const show = (id, on) => { const el = $(id); if(el && el.style) el.style.display = on ? '' : 'none'; };
  const bgType = ($('bgGradientType') || {}).value || 'linear';
  show('bgAngleField', bgType === 'linear');
  for(const id of ['bgCenterXField','bgCenterYField','bgRadiusField']) show(id, bgType !== 'linear');
  show('borderRadiusField', $('borderRounded') && $('borderRounded').checked);
  // sections open with the class the stylesheet keys on (.subblock.open);
  // setting display directly loses to that rule
  const card = $('cardToggle') && $('cardToggle').checked, grad = card && $('cardGradientToggle').checked;
  if($('cardBlock')) $('cardBlock').classList.toggle('open', !!card);
  const bgrad = $('borderGradientToggle') && $('borderGradientToggle').checked;
  show('borderColor2Field', bgrad); show('borderColor3Field', bgrad); show('borderAngleField', bgrad);
  for(const id of ['cardColor2Field','cardTypeField']) show(id, grad);
  show('cardAngleField', grad && $('cardGradientType').value === 'linear');
}
for(const id of [...Object.keys(RANGE_UNITS), 'bgGradientType', 'borderRounded', 'borderGradientToggle', 'cardToggle', 'cardGradientToggle',
                 'cardGradientType', 'cardOpacity', 'cardBlend', 'borderBlend', 'borderBloomBlend', 'borderStitch', 'borderStitchOut']){
  const el = $(id); if(!el || !el.addEventListener) continue;
  const on = ()=>{ refreshReadouts(); syncFrameVisibility(); scheduleRender(); };
  el.addEventListener('input', on); el.addEventListener('change', on);
}
bindColorField('cardColor1Hex', scheduleRender);
bindColorField('cardColor2Hex', scheduleRender);

/** Settings a preset doesn't mention start from these, so one preset's box
 *  or rounded frame never leaks into the next. */
const FRAME_DEFAULTS = { bgGradientType:'linear', bgRadialX:'50', bgRadialY:'50', bgRadialR:'75', borderGrain:'0',
  borderRounded:false, borderRadius:'60', cardToggle:false, cardColor1:'#FFF6EE', cardGradientToggle:false,
  cardColor2:'#F2E2EA', cardGradientType:'linear', cardGradientAngle:'90', cardOpacity:'70', cardBlend:'source-over',
  borderBlend:'source-over', borderBloomBlend:'source-over', borderGradientAngle:'45',
  borderStitch:'solid', borderStitchOut:false };

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

    titleEl.textContent = opts.title || '';
    bodyEl.textContent = opts.body || '';
    input.hidden = !wantsInput;
    input.value = wantsInput ? (opts.defaultValue || '') : '';
    input.rows = opts.rows || 1;
    input.setAttribute('rows', String(opts.rows || 1));
    ok.textContent = opts.confirmLabel || 'OK';
    cancel.textContent = opts.cancelLabel || 'Cancel';
    ok.className = opts.danger ? 'btn-danger' : 'btn-major';
    veil.hidden = false;

    const finish = (val)=>{
      veil.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = ()=> finish(wantsInput ? input.value : true);
    const onCancel = ()=> finish(null);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

// A spell is the look, never the words -- the poem belongs to the Grimoire.
function settingsForSpell(){
  return stripToLook(serializeCurrentSettings());
}

const vault = createVault({
  $,
  getSettings: settingsForSpell,
  applySettings: (settings, name)=>{ restoreSettings(stripToLook(settings));
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
// Every build opens on the §Variables instrument panel for now; at launch,
// OPEN_ON_POEM (appOptions.js) lets production open on a poem instead.
if(!(OPEN_ON_POEM && isProductionHost())){ $('poemText').value = DEV_TEMPLATE; repaintEditor(); }
// Fonts are fetched on first use now (fonts.js, asked for by the renderer);
// the first render happens as soon as the page is ready.
render();
// The first paint uses fallback metrics, and the fitted size is cached — so
// once the real fonts land the measurements have to be thrown away, or the
// page keeps a size that was measured against the wrong typeface.
function remeasureAndRender(){
  invalidateTextMeasurements();
  render();
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureAndRender);
// Textures that draw alchemical glyphs (transmutation circles) must not keep
// a copy generated before the symbol font arrived — it would be empty boxes.
if(document.fonts && document.fonts.load){
  document.fonts.load('32px "Noto Sans Symbols"', '\u{1F701}')
    .then(()=>{ clearTextureCache(); scheduleRender(); }).catch(()=>{});
}
setTimeout(remeasureAndRender, 300);
setTimeout(remeasureAndRender, 900);

// ---------- undo ☋ and redo ☊ ----------
// History is a stack of LOOK snapshots — the same filtered snapshot a saved
// spell uses, so it covers every setting but never the poem (the text box has
// its own undo), your locks, or your name. A change is recorded a moment after
// you stop adjusting, so one slider drag is one step, not one per pixel.
const HISTORY_MAX = 60;
function lookSnapshot(){ return JSON.stringify(stripToLook(serializeCurrentSettings())); }
function paintHistoryButtons(){
  const h = state.history;
  if($('undoBtn')) $('undoBtn').disabled = h.index <= 0;
  if($('redoBtn')) $('redoBtn').disabled = h.index >= h.stack.length - 1;
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
  paintHistoryButtons();
}
function commitSoon(){ clearTimeout(state.history.timer); state.history.timer = setTimeout(commitHistory, 450); }
function stepHistory(dir){
  const h = state.history, to = h.index + dir;
  if(to < 0 || to >= h.stack.length) return;
  clearTimeout(h.timer);
  h.index = to; h.restoring = true;
  try { restoreSettings(JSON.parse(h.stack[to])); } finally { h.restoring = false; }
  scheduleRender(); paintHistoryButtons();
}
if($('undoBtn')) $('undoBtn').addEventListener('click', ()=>stepHistory(-1));
if($('redoBtn')) $('redoBtn').addEventListener('click', ()=>stepHistory(1));
// any change in the controls — typed, dragged, picked, or a button that
// rewrites many at once (presets, randomize, spells) — records a step
const NOT_A_LOOK = new Set(['poemText', 'usernameField', 'advancedJson']);
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
// Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y), except while typing in a field
document.addEventListener('keydown', (e)=>{
  if(!(e.ctrlKey || e.metaKey)) return;
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if(tag === 'TEXTAREA' || tag === 'INPUT') return;
  const k = (e.key || '').toLowerCase();
  if(k === 'z'){ e.preventDefault(); stepHistory(e.shiftKey ? 1 : -1); }
  else if(k === 'y'){ e.preventDefault(); stepHistory(1); }
});

// Full-size preview: renders the preview at the export's own size, for
// comparing it with the screen-sized preview (slower; not part of a look)
if($('fullPreview')) $('fullPreview').addEventListener('change', ()=>{ state.ui.fullPreview = $('fullPreview').checked; applyPreviewScale(); });
// the box the preview sits in changes with the divider and the layout
if(typeof ResizeObserver === 'function' && document.querySelector && document.querySelector('.canvas-wrap'))
  new ResizeObserver(applyPreviewScaleSoon).observe(document.querySelector('.canvas-wrap'));
// the look the page opened on is the first step of history
commitHistory();
