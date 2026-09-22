/**
 * appEvents.js — the entry point. Wires every control in index.html to the
 * app's actual state and triggers a render() after anything changes. Unlike
 * the other four modules, this one isn't a portable concept on its own --
 * it's specifically the glue for THIS page's specific HTML structure.
 *
 * TABLE OF CONTENTS
 *   Field/control binders   syncStopFields, bindColorField, setColorField,
 *                           randHex, toggleSubblock, bindAngle,
 *                           bindRadioGroup, setActiveRadioValue,
 *                           syncOutlineFields -- small generic helpers that
 *                           wire one control (or a small cluster of related
 *                           ones) to its DOM behavior. Below the function
 *                           definitions, the actual addEventListener calls
 *                           that use them for every control in the sidebar.
 *   Texture seed             randomSeed, maybeRerollSeed -- rerolls the
 *                           texture seed on preset-apply / randomize,
 *                           unless the Lock checkbox is on.
 *   Filename generation      plainTextFromLine, slugifyForFilename,
 *                           generateFilenameBase -- reuses applyEscapes +
 *                           tokenizeInline from textParsers.js (the same
 *                           logic that decides what actually renders) so
 *                           the generated filename can never drift out of
 *                           sync with what the poem actually says.
 *   Full-state JSON          serializeCurrentSettings, restoreSettings --
 *                           the Advanced panel's export/import. This is a
 *                           superset of what a preset covers (also captures
 *                           alignment, aspect ratio, username, the poem
 *                           text itself, the texture seed + lock state).
 *   Presets                  applyPreset -- reads one entry from PRESETS
 *                           and pushes every field it specifies into the
 *                           matching control; fields a preset omits are
 *                           left at whatever they currently are.
 *   (below the functions)   Every addEventListener binding for every
 *                           control, the PRESETS grid construction, and
 *                           finally the boot sequence: preload fonts, then
 *                           render (see bottom of file).
 *
 * Imports: $, FONTS, PRESETS, ASPECTS from appOptions.js; applyEscapes,
 * tokenizeInline from textParsers.js; render from canvasRenderer.js.
 * Exports: nothing -- this is the entry point, nothing imports FROM it.
 */

import { $, FONTS, PRESETS, ASPECTS, SIZE_LIMITS } from './appOptions.js';
import { applyEscapes, tokenizeInline, buildLines } from './textParsers.js';
import { render, scheduleRender, hexToHsl, hslToHex, invalidateTextMeasurements } from './canvasRenderer.js';
import { paramsFor, capsFor, getTextureCanvas } from './textureGenerators.js';
import { spellToPML } from './spell.js';
import { createVault } from './vault.js';
import { installEditor } from './editor.js';
import { PREVIEW, SWATCH } from './tunables.js';
import { applyStrings, DIALOGS, THEME_NOTES, fill } from './strings.js';

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
safeColoris({
  el: '[data-coloris]',
  theme: 'polaroid',
  themeMode: 'dark',
  alpha: false,
  format: 'hex',
  clearButton: false,
});


// ---------- lock state ----------
// Declared up here, not beside the lock UI further down: the settings
// serializer runs during boot and reads `locked`, and a const is in its
// temporal dead zone until its declaration is evaluated. Reading it earlier
// throws — which it did.
const LOCKABLE = [
  'bgColor1Hex','bgColor2Hex','bgColor3Hex','bgColor4Hex',
  'textColorHex','textColor2Hex','textColor3Hex','textColor4Hex',
  'accent1ColorHex','accent2ColorHex','outlineColorHex','borderColorHex',
  'fontFamily','textureType','textureOpacity','textureBlend','textureLight',
  'textureTint1Hex','textureTint2Hex','texP1','texP2','textureSeedValue',
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

const locked = new Set();
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
let currentAlign = 'left';
let currentValign = 'center';
let currentAspect = '1:1';
let bgStopCount = 2;
let textStopCount = 2;

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
bindColorField('outlineColorHex', scheduleRender);
bindColorField('bgColor1Hex', scheduleRender);
bindColorField('bgColor2Hex', scheduleRender);
bindColorField('bgColor3Hex', scheduleRender);
bindColorField('bgColor4Hex', scheduleRender);
bindColorField('borderColorHex', scheduleRender);
bindColorField('accent1ColorHex', scheduleRender);
bindColorField('accent2ColorHex', scheduleRender);

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

bindRadioGroup('alignGroup', v=>{ currentAlign=v; scheduleRender(); });
bindRadioGroup('valignGroup', v=>{ currentValign=v; scheduleRender(); });
// ---------- page size ----------
/** Applies a page size, mirroring it into the custom boxes so switching to
 *  Custom starts from whatever you were just looking at. */
function setPageSize(w, h, mirror){
  canvas.width = w; canvas.height = h;
  if(mirror !== false){ $('customW').value = w; $('customH').value = h; }
}
const clampSize = (n) =>
  Math.max(SIZE_LIMITS.min, Math.min(SIZE_LIMITS.max, Math.round(+n || 0)));

function pickAspect(v){
  if(!ASPECTS[v]) return;
  currentAspect = v;
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
  currentAspect = 'custom';
  setPageSize(w, h, false);
  scheduleRender();
}
function syncCustomSize(){
  const on = $('customSizeToggle').checked;
  if(document.body && document.body.classList) document.body.classList.toggle('custom-size', on);
  if(on) applyCustomSize();
  else if(ASPECTS[currentAspect]) pickAspect(currentAspect);
  else pickAspect('1:1');
}
$('customSizeToggle').addEventListener('change', syncCustomSize);
['customW','customH'].forEach(id => $(id).addEventListener('change', ()=>{
  if($('customSizeToggle').checked) applyCustomSize();
}));
bindRadioGroup('bgStopsGroup', v=>{
  bgStopCount = parseInt(v,10);
  syncStopFields(bgStopCount, 'bgColor3Field', 'bgColor4Field');
  scheduleRender();
});
bindRadioGroup('textStopsGroup', v=>{
  textStopCount = parseInt(v,10);
  syncStopFields(textStopCount, 'textColor3Field', 'textColor4Field');
  scheduleRender();
});

$('textureType').addEventListener('change', scheduleRender);
$('textureOpacity').addEventListener('input', ()=>{ $('textureOpacityVal').textContent=$('textureOpacity').value+'%'; scheduleRender(); });

function randomSeed(){ return Math.floor(Math.random()*2**31); }
function maybeRerollSeed(explicitSeed){
  // the seed field's lock is the one control for this now
  if(locked.has('textureSeedValue')) return;
  $('textureSeedValue').value = (explicitSeed !== undefined) ? explicitSeed : randomSeed();
}
$('textureSeedValue').addEventListener('input', scheduleRender);
$('textureSeedReroll').addEventListener('click', ()=>{
  $('textureSeedValue').value = randomSeed();
  scheduleRender();
});

const outlineModeSel = $('outlineMode');
function syncOutlineFields(){
  const mode = outlineModeSel.value;
  $('outlineColorField').style.display = mode==='off' ? 'none' : 'block';
  $('outlineThicknessField').style.display = mode==='outline' ? 'block' : 'none';
  $('shadowThicknessField').style.display = mode==='shadow' ? 'flex' : 'none';
  scheduleRender();
}
outlineModeSel.addEventListener('change', syncOutlineFields);
syncOutlineFields();

['fontFamily','outlineThickness','shadowBlur','shadowX','shadowY','maxSize','borderThickness','borderOffset','usernameField'].forEach(id=>{
  $(id).addEventListener('input', scheduleRender);
});
$('usernameCorner').addEventListener('change', scheduleRender);

// Typing fires far more often than any other input in this app, and a full
// DSL reparse + autofit search on every keystroke is real, avoidable work.
// Debounce specifically here rather than everywhere -- sliders and color
// pickers feel worse with any added delay, since people expect those to
// track their input directly; scheduleRender's rAF-coalescing alone is
// enough for those.
let poemTextDebounceTimer = null;
$('poemText').addEventListener('input', ()=>{
  clearTimeout(poemTextDebounceTimer);
  poemTextDebounceTimer = setTimeout(scheduleRender, 150);
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
      'linen','coldpress','foxing','foldghost','cupring','wax','whorl'];
    $('textureType').value = types[Math.floor(Math.random()*types.length)];
    const op = Math.floor(Math.random()*22)+4;
    $('textureOpacity').value = op;
    $('textureOpacityVal').textContent = op+'%';
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

$('downloadBtn').addEventListener('click', ()=>{
  const base = generateFilenameBase();
  const ts = Math.floor(Date.now()/1000);
  const link = document.createElement('a');
  link.download = `poetrypress-${base}-${ts}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 1.0);
  link.click();
});

// ---------- advanced: full settings snapshot (export/import as JSON) ----------
function serializeCurrentSettings(){
  return {
    bg1: $('bgColor1Hex').value,
    bgGradient: $('bgGradientToggle').checked,
    bg2: $('bgColor2Hex').value,
    bg3: bgStopCount>=3 ? $('bgColor3Hex').value : undefined,
    bg4: bgStopCount>=4 ? $('bgColor4Hex').value : undefined,
    bgAngle: parseFloat($('bgGradientAngle').value),

    text1: $('textColorHex').value,
    textGradient: $('textGradientToggle').checked,
    text2: $('textColor2Hex').value,
    text3: textStopCount>=3 ? $('textColor3Hex').value : undefined,
    text4: textStopCount>=4 ? $('textColor4Hex').value : undefined,
    textAngle: parseFloat($('textGradientAngle').value),

    font: FONTS[fontSelect.value].family,
    maxSize: parseFloat($('maxSize').value),
    lineSpacing: parseFloat($('lineSpacing').value),

    accent1: $('accent1Toggle').checked ? $('accent1ColorHex').value : undefined,
    accent2: $('accent2Toggle').checked ? $('accent2ColorHex').value : undefined,

    outlineMode: $('outlineMode').value,
    outlineColor: $('outlineColorHex').value,
    outlineThickness: parseFloat($('outlineThickness').value),
    shadowBlur: parseFloat($('shadowBlur').value),
    shadowX: parseFloat($('shadowX').value),
    shadowY: parseFloat($('shadowY').value),

    texture: $('textureToggle').checked,
    textureType: $('textureType').value,
    borderGradientToggle: $('borderGradientToggle').checked,
    borderColor2: $('borderColor2Hex').value,
    borderColor3: $('borderColor3Hex').value,
    borderBloom: $('borderBloom').value,
    vignetteAperture: $('vignetteAperture').value,
    vignetteCx: $('vignetteCx').value,
    vignetteCy: $('vignetteCy').value,
    vignetteNoise: $('vignetteNoise').value,
    spell: $('activeSpell').value,
    highlight: $('highlightToggle') ? $('highlightToggle').checked : true,
    // which controls the user has pinned against Randomize and presets
    locks: Array.from(locked),
    textureBlend: $('textureBlend').value,
    textureLight: $('textureLight').value,
    textureTint1: $('textureTint1Hex').value,
    textureTint2: $('textureTint2Hex').value,
    texP1: $('texP1').value,
    texP2: $('texP2').value,
    textureOpacity: parseFloat($('textureOpacity').value),
    textureSeed: parseInt($('textureSeedValue').value, 10),

    border: $('borderToggle').checked,
    borderColor: $('borderColorHex').value,
    borderThickness: parseFloat($('borderThickness').value),
    borderOffset: parseFloat($('borderOffset').value),

    vignette: $('vignetteToggle').checked,
    vignetteBlend: $('vignetteBlend').value,
    vignetteIntensity: parseFloat($('vignetteIntensity').value),

    align: currentAlign,
    valign: currentValign,
    aspect: currentAspect,
    customSize: $('customSizeToggle').checked,
    customW: $('customW').value,
    customH: $('customH').value,

    username: $('usernameField').value,
    usernameCorner: $('usernameCorner').value,

    poemText: $('poemText').value,
  };
}

function restoreSettings(s){
  if(s.bg1) setColorField('bgColor1Hex', s.bg1);
  $('bgGradientToggle').checked = !!s.bgGradient;
  $('bgGradientBlock').classList.toggle('open', !!s.bgGradient);
  if(s.bg2) setColorField('bgColor2Hex', s.bg2);
  if(s.bg3) setColorField('bgColor3Hex', s.bg3);
  if(s.bg4) setColorField('bgColor4Hex', s.bg4);
  bgStopCount = s.bg4 ? 4 : (s.bg3 ? 3 : 2);
  syncStopFields(bgStopCount, 'bgColor3Field', 'bgColor4Field');
  setActiveRadioValue('bgStopsGroup', bgStopCount);
  if(s.bgAngle!==undefined){ $('bgGradientAngle').value=s.bgAngle; $('bgGradientAngleVal').textContent=s.bgAngle+'°'; }

  if(s.text1) setColorField('textColorHex', s.text1);
  $('textGradientToggle').checked = !!s.textGradient;
  $('gradientBlock').classList.toggle('open', !!s.textGradient);
  if(s.text2) setColorField('textColor2Hex', s.text2);
  if(s.text3) setColorField('textColor3Hex', s.text3);
  if(s.text4) setColorField('textColor4Hex', s.text4);
  textStopCount = s.text4 ? 4 : (s.text3 ? 3 : 2);
  syncStopFields(textStopCount, 'textColor3Field', 'textColor4Field');
  setActiveRadioValue('textStopsGroup', textStopCount);
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

  if(s.outlineMode){ outlineModeSel.value = s.outlineMode; syncOutlineFields(); }
  if(s.outlineColor) setColorField('outlineColorHex', s.outlineColor);
  if(s.outlineThickness!==undefined) $('outlineThickness').value = s.outlineThickness;
  if(s.shadowBlur!==undefined) $('shadowBlur').value = s.shadowBlur;
  if(s.shadowX!==undefined) $('shadowX').value = s.shadowX;
  if(s.shadowY!==undefined) $('shadowY').value = s.shadowY;

  $('textureToggle').checked = !!s.texture;
  $('textureBlock').classList.toggle('open', !!s.texture);
  if(s.textureType) $('textureType').value = s.textureType;
  // relabel/re-range for the incoming texture BEFORE restoring the knob
  // values, or they would be clamped against the previous texture's range
  syncTextureParams(true);
  syncTextureTools(true);
  if(s.borderGradientToggle!==undefined) $('borderGradientToggle').checked = s.borderGradientToggle;
  if(s.borderColor2) setColorField('borderColor2Hex', s.borderColor2);
  if(s.borderColor3) setColorField('borderColor3Hex', s.borderColor3);
  if(s.borderBloom!==undefined){ $('borderBloom').value = s.borderBloom; const o=$('borderBloomVal'); if(o) o.textContent = s.borderBloom; }
  if(s.vignetteAperture!==undefined){ $('vignetteAperture').value = s.vignetteAperture; const o=$('vignetteApertureVal'); if(o) o.textContent = s.vignetteAperture; }
  if(s.vignetteCx!==undefined){ $('vignetteCx').value = s.vignetteCx; const o=$('vignetteCxVal'); if(o) o.textContent = s.vignetteCx; }
  if(s.vignetteCy!==undefined){ $('vignetteCy').value = s.vignetteCy; const o=$('vignetteCyVal'); if(o) o.textContent = s.vignetteCy; }
  if(s.vignetteNoise!==undefined){ $('vignetteNoise').value = s.vignetteNoise; const o=$('vignetteNoiseVal'); if(o) o.textContent = s.vignetteNoise; }
  if(s.spell !== undefined) $('activeSpell').value = s.spell;
  if(s.highlight !== undefined && $('highlightToggle')){
    $('highlightToggle').checked = !!s.highlight;
    if(document.body && document.body.classList) document.body.classList.toggle('plain-editor', !s.highlight);
  }
  if(Array.isArray(s.locks)) restoreLockState(s.locks);
  if(s.textureBlend) $('textureBlend').value = s.textureBlend;
  if(s.textureLight !== undefined){ $('textureLight').value = s.textureLight; syncLightPad(); }
  if(s.textureTint1) setColorField('textureTint1Hex', s.textureTint1);
  if(s.textureTint2) setColorField('textureTint2Hex', s.textureTint2);
  if(s.texP1 !== undefined) $('texP1').value = s.texP1;
  if(s.texP2 !== undefined) $('texP2').value = s.texP2;
  syncTextureParams(false);
  if(s.textureOpacity!==undefined){ $('textureOpacity').value=s.textureOpacity; $('textureOpacityVal').textContent=s.textureOpacity+'%'; }
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

  if(s.align){ currentAlign=s.align; setActiveRadioValue('alignGroup', s.align); }
  if(s.valign){ currentValign=s.valign; setActiveRadioValue('valignGroup', s.valign); }
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


// ---------- preset snapshots ----------
/**
 * Paints one swatch: the ground, a hint of its surface, its border, and its
 * glyphs. The texture is generated at swatch size rather than scaled down
 * from a full render — a few thousand pixels each, cached like any other
 * texture, so sixteen of them cost about one ordinary repaint.
 */
function paintPresetSwatch(canvas, p, w, h){
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d');

  // ground
  if(p.bgGradient && p.bg2){
    const a = ((p.bgAngle || 135) - 90) * Math.PI / 180;
    const g = c.createLinearGradient(
      w/2 - Math.cos(a)*w/2, h/2 - Math.sin(a)*h/2,
      w/2 + Math.cos(a)*w/2, h/2 + Math.sin(a)*h/2);
    [p.bg1, p.bg2, p.bg3, p.bg4].filter(Boolean).forEach((col, i, all) => {
      g.addColorStop(all.length > 1 ? i/(all.length-1) : 0, col);
    });
    c.fillStyle = g;
  } else {
    c.fillStyle = p.bg1 || '#111';
  }
  c.fillRect(0, 0, w, h);

  // surface
  if(p.texture && p.textureType){
    try {
      const caps = capsFor(p.textureType);
      const type = p.textureType === 'astral' ? 'astral_stars' : p.textureType;
      const tex = getTextureCanvas(type, w, h, p.accent1, p.accent2, false,
        (p.textureSeed != null ? p.textureSeed : SWATCH.fallbackSeed), p.texP1, p.texP2, 315);
      if(tex){
        c.save();
        c.globalCompositeOperation = caps.blends[0] || 'overlay';
        c.globalAlpha = Math.min(1, (p.textureOpacity || 30) / 100);
        c.drawImage(tex, 0, 0, w, h);
        c.restore();
      }
    } catch(e){ /* a swatch is never worth failing a render over */ }
  }

  // border
  if(p.border && p.borderColor){
    c.strokeStyle = p.borderColor;
    c.lineWidth = Math.max(1.5, Math.round(h * SWATCH.borderScale));
    // half the stroke sits outside the path, so inset by at least that much
    // or the top and bottom edges fall off the canvas
    const inset = c.lineWidth;
    c.strokeRect(inset, inset, w - inset*2, h - inset*2);
  }

  // glyphs, in the preset's own accents, at the size the swatch allows
  if(p.spell){
    const segs = buildLines(spellToPML(p.spell), true, true)[0].segments;
    const size = Math.max(6, Math.round(h * SWATCH.glyphScale));
    c.font = `${size}px "Noto Sans Symbols 2","Segoe UI Symbol",sans-serif`;
    c.textBaseline = 'middle';
    let total = 0;
    for(const sg of segs) total += c.measureText(sg.text).width;
    let x = (w - total) / 2;          // centred horizontally
    const y = h / 2;                  // and vertically
    c.globalAlpha = 0.92;
    for(const sg of segs){
      c.fillStyle = sg.color === 'accent1' ? (p.accent1 || '#fff')
                  : sg.color === 'accent2' ? (p.accent2 || '#fff')
                  : (p.text1 || '#fff');
      c.fillText(sg.text, x, y);
      x += c.measureText(sg.text).width;
    }
    c.globalAlpha = 1;
  }
}

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
      restoreSettings(Object.assign({}, rec.settings, { spell: rec.spell }));
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

// Derives a 15-color Coloris swatch palette from a theme's own colors, so
// the color picker's swatches change to match whichever preset is active
// (a 16th, the color currently being edited, gets appended live -- see the
// 'open' event listener near the bottom of this file).
//
//   6 base colors   — text1, text2, accent1, accent2, bg1, bg2 (text2/bg2
//                     fall back to a derived tone for presets with no
//                     gradient second stop, so every theme yields 6)
//   3 relationships — complementary of text1, a triadic point from accent1,
//                     a tonal sibling of bg1
//   6 tonal siblings — one per base color, nudged lighter+more saturated if
//                     it's currently dark, darker+less saturated if light
//                     (the same "move toward a punchier midtone" rule
//                     watermarkColor() already uses, just reused here)
//
// 6 + 3 + 6 = 15.
function tonalSibling(hex){
  const {h,s,l} = hexToHsl(hex);
  const lNudge = l > 50 ? -18 : 18;
  const sNudge = l > 50 ? -12 : 12;
  return hslToHex(h, Math.max(0,Math.min(100, s+sNudge)), Math.max(0,Math.min(100, l+lNudge)));
}
function hueShift(hex, degrees){
  const {h,s,l} = hexToHsl(hex);
  // On a near-neutral colour a hue shift does essentially nothing -- rotate
  // grey and you get grey. The 🜚 Touch presets are neutral by design, so
  // without this branch all fifteen of their swatches collapse into the same
  // beige. Vary lightness and warmth instead, which is what actually
  // separates one neutral from another.
  if(s < 12){
    const warm = ((degrees % 360) + 360) % 360 < 180;
    const lShift = (degrees / 180) * 22;
    return hslToHex(warm ? 34 : 210,
                    Math.min(100, s + 7 + Math.abs(degrees)/40),
                    Math.max(4, Math.min(96, l + (l > 50 ? -lShift : lShift))));
  }
  return hslToHex(h+degrees, s, l);
}
function deriveThemePalette({text1, text2, accent1, accent2, bg1, bg2}){
  const t2 = text2 || hueShift(text1, 30);
  const b2 = bg2 || tonalSibling(bg1);
  const base = [text1, t2, accent1, accent2, bg1, b2];

  const complementaryOfText = hueShift(text1, 180);
  const triadicOfAccent = hueShift(accent1, 120);
  const bgVariant = tonalSibling(bg1);

  return [...base, complementaryOfText, triadicOfAccent, bgVariant, ...base.map(tonalSibling)];
}

let currentThemePalette = [];
function applyThemePalette(colors){
  currentThemePalette = colors;
  safeColoris({ swatches: colors });
}

// Quintessence opens the grid and opens the app -- the first Whimsy, and
// the face the page wears before anything is chosen.
const defaultPalettePreset = PRESETS.find(p=>p.name==='Quintessence') || PRESETS[0];
applyThemePalette(deriveThemePalette(defaultPalettePreset));

// The page opens on a real preset rather than a scatter of static HTML
// defaults that no longer correspond to anything -- one source of truth,
// so the opening view is always a coherent Element rather than whatever
// the markup happened to hardcode.
// Applied during the boot sequence at the bottom of this file instead:
// applyPreset now snapshots the lock set, and `locked` is a const declared
// further down, so reading it this early is a temporal-dead-zone error.


// The 16th swatch: whatever THIS specific field's current value is, appended
// live right as its picker opens -- lets you audition one of the 15 theme
// colors and still get back to what you had. Coloris fires 'open' on the
// bound input itself when its picker is about to show.
// Coloris positions its picker against the page, but on mobile .controls is
// the thing that scrolls (the page itself does not), so the picker could open
// nowhere near the field it belongs to. Re-anchor it to the field's own
// on-screen rect, flipping above when there is no room below, and keeping it
// clear of the tab bar.
function positionPickerNearField(field){
  const picker = document.getElementById('clr-picker');
  if(!picker || !field.getBoundingClientRect) return;
  const rootStyle = getComputedStyle(document.documentElement);
  const num = (name, fallback) => parseFloat(rootStyle.getPropertyValue(name)) || fallback;
  const visible = num('--vvh', window.innerHeight);
  const barH = num('--tabbar-h', 58);
  const gap = 8;

  const r = field.getBoundingClientRect();
  const pw = picker.offsetWidth || 240;
  const ph = picker.offsetHeight || 260;

  let top = r.bottom + gap;
  if(top + ph > visible - barH){
    const above = r.top - ph - gap;          // flip above the field
    top = above >= gap ? above : Math.max(gap, visible - barH - ph - gap);
  }
  const left = Math.min(Math.max(gap, r.left), Math.max(gap, window.innerWidth - pw - gap));

  picker.style.position = 'fixed';
  picker.style.top = top + 'px';
  picker.style.left = left + 'px';
  picker.style.margin = '0';
}

document.addEventListener('open', (e)=>{
  if(e.target && e.target.matches && e.target.matches('[data-coloris]')){
    safeColoris({ swatches: [...currentThemePalette, e.target.value] });
    if(document.body && document.body.classList && document.body.classList.contains('is-mobile')
       && typeof requestAnimationFrame === 'function'){
      // after Coloris has done its own positioning, not before
      requestAnimationFrame(()=>positionPickerNearField(e.target));
    }
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
  bgStopCount = p.bg4 ? 4 : (p.bg3 ? 3 : 2);
  syncStopFields(bgStopCount, 'bgColor3Field', 'bgColor4Field');
  setActiveRadioValue('bgStopsGroup', bgStopCount);
  if(p.bgAngle!==undefined){ $('bgGradientAngle').value=p.bgAngle; $('bgGradientAngleVal').textContent=p.bgAngle+'°'; }

  setColorField('textColorHex', p.text1);
  $('textGradientToggle').checked = !!p.textGradient;
  $('gradientBlock').classList.toggle('open', !!p.textGradient);
  if(p.text2) setColorField('textColor2Hex', p.text2);
  if(p.text3) setColorField('textColor3Hex', p.text3);
  if(p.text4) setColorField('textColor4Hex', p.text4);
  textStopCount = p.text4 ? 4 : (p.text3 ? 3 : 2);
  syncStopFields(textStopCount, 'textColor3Field', 'textColor4Field');
  setActiveRadioValue('textStopsGroup', textStopCount);
  if(p.textAngle!==undefined){ $('textGradientAngle').value=p.textAngle; $('textGradientAngleVal').textContent=p.textAngle+'°'; }

  outlineModeSel.value = p.outlineMode || 'off';
  if(p.outlineColor) setColorField('outlineColorHex', p.outlineColor);
  if(p.outlineThickness!==undefined) $('outlineThickness').value = p.outlineThickness;
  if(p.shadowBlur!==undefined) $('shadowBlur').value = p.shadowBlur;
  if(p.shadowX!==undefined) $('shadowX').value = p.shadowX;
  if(p.shadowY!==undefined) $('shadowY').value = p.shadowY;
  syncOutlineFields();

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
  syncTextureParams(false);
  if(p.textureOpacity!==undefined){ $('textureOpacity').value=p.textureOpacity; $('textureOpacityVal').textContent=p.textureOpacity+'%'; }

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
    // Sync FIRST, restore locks LAST. syncTextureTools rebuilds the blend
    // select and re-clamps the texture params, so restoring before it ran
    // meant those values were immediately overwritten — which is why locks
    // held on colours but not on the texture tools.
    syncTextureTools(false);
    syncLightPad();
    restoreLocked(__locks);
  }
}

// ---------- gradient geometry ----------


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

if(detectMobile() && typeof document.querySelectorAll === 'function'){
  document.body.classList.add('is-mobile');

  const panels = Array.from(document.querySelectorAll('.card[data-tab]'));
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));

  function activateTab(name){
    panels.forEach(p => p.classList.toggle('tab-active', p.dataset.tab === name));
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    // a tab change is a context change; start it from the top
    if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo({top:0, behavior:'instant'});
  }
  tabBtns.forEach(b => b.addEventListener('click', () => activateTab(b.dataset.tab)));
  activateTab('write');

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
    const reset = () => { scale = 1; tx = 0; ty = 0; apply(); };
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

    wrap.addEventListener('touchend', ()=>{ mode = null; }, {passive:true});

    // Changing the aspect ratio resizes the canvas underneath a transform that
    // was computed for the old shape, which is what threw the preview
    // off-centre and clipped it. Any change to the bitmap's dimensions drops
    // the zoom back to neutral.
    if(typeof MutationObserver === 'function'){
      new MutationObserver(reset).observe(cv, { attributes: true, attributeFilter: ['width','height'] });
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
  [0,1].forEach(i=>{
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
    if(useDefaults || slider.value === '' || +slider.value < def.min || +slider.value > def.max){
      slider.value = def.def;
    }
    label.textContent = def.label;
    out.textContent = paramReadout(def, +slider.value);
  });
}

['texP1','texP2'].forEach(id=>{
  $(id).addEventListener('input', ()=>{
    const defs = paramsFor($('textureType').value);
    const i = id === 'texP1' ? 0 : 1;
    if(defs[i]) $(id+'Val').textContent = paramReadout(defs[i], +$(id).value);
    scheduleRender();
  });
});
$('textureType').addEventListener('change', ()=>{ syncTextureParams(true); scheduleRender(); });
syncTextureParams(true);



/**
 * What a slider should read. A param declaring `base` — the number of things
 * drawn at 100% on a default page — shows that number instead of a
 * percentage, because "1124 sparkles" says more than "100%". Size params keep
 * percentages, since they scale with the page rather than counting anything.
 */
function paramReadout(def, value){
  if(!def) return '';
  if(def.base != null){
    const n = Math.max(1, Math.round(def.base * (value / 100)));
    return n.toLocaleString() + (def.absUnit != null ? def.absUnit : '');
  }
  return value + (def.unit || '');
}

// ---------- texture tools ----------
// Blend mode, light direction and tints are declared per texture (see
// TEXTURE_CAPS). Anything a texture cannot use is disabled rather than left
// live and inert -- a control that silently does nothing is worse than one
// that is visibly unavailable.
const BLEND_LABELS = {
  'overlay':'Overlay', 'soft-light':'Soft light', 'hard-light':'Hard light',
  'multiply':'Multiply', 'screen':'Screen', 'lighten':'Lighten',
  'darken':'Darken', 'color-burn':'Colour burn', 'color-dodge':'Colour dodge',
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
    setColorField('textureTint1Hex', resolve(defs[0], '#7A2B2B'));
    if(caps.tints >= 2) setColorField('textureTint2Hex', resolve(defs[1], '#8A6A3C'));
  }
}

// The light pad is a compass, not a slider: eight directions around a centre,
// which reads the same on a phone as on a desktop and needs no dragging.
function syncLightPad(){
  const deg = $('textureLight').value;
  const pad = $('lightPad');
  if(!pad || !pad.querySelectorAll) return;
  pad.querySelectorAll('button').forEach(b=>{
    b.classList.toggle('active', b.dataset.deg === String(deg));
  });
}
if($('lightPad') && $('lightPad').addEventListener){
  $('lightPad').addEventListener('click', (e)=>{
    const btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if(!btn || !btn.dataset.deg) return;
    $('textureLight').value = btn.dataset.deg;
    syncLightPad();
    scheduleRender();
  });
}
$('textureBlend').addEventListener('change', scheduleRender);
bindColorField('textureTint1Hex', scheduleRender);
bindColorField('textureTint2Hex', scheduleRender);

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
      const on = locked.has(id);
      btn.classList.toggle('locked', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on ? 'Locked — Randomize and presets leave this alone'
                     : 'Lock this against Randomize and presets';
      // the control itself dims, so a locked setting is obvious at a glance
      if(field && field.classList) field.classList.toggle('field-locked', on);
    };
    btn.addEventListener('click', ()=>{
      if(locked.has(id)) locked.delete(id); else locked.add(id);
      paint();
    });
    btn._paint = paint;
    lockButtons.set(id, btn);
    if(host && host.appendChild) host.appendChild(btn);
  }
}

/** Rebuilds the lock set and the buttons' appearance from a saved list. */
function restoreLockState(ids){
  locked.clear();
  for(const id of ids) if(LOCKABLE.includes(id)) locked.add(id);
  for(const [, btn] of lockButtons) if(btn._paint) btn._paint();
}

function snapshotLocked(){
  const snap = {};
  for(const id of locked){
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
    // the field for an instant, which used to throw you out of focus mode
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

// ---------- theme ----------
// Kept out of the settings JSON on purpose: a theme is how YOU like the app
// to look, not part of a saved page, so it lives in its own key and does not
// travel with an exported spell.
const THEME_KEY = 'uv.theme.v1';
function applyTheme(name){
  const themes = Object.keys(THEME_NOTES);
  const theme = themes.includes(name) ? name : 'cinder';
  if(document.documentElement && document.documentElement.setAttribute){
    document.documentElement.setAttribute('data-theme', theme);
  }
  if($('uiTheme')) $('uiTheme').value = theme;
  if($('themeNote')) $('themeNote').textContent = THEME_NOTES[theme];
  try { localStorage.setItem(THEME_KEY, theme); } catch(e){ /* private mode */ }
}
if($('uiTheme') && $('uiTheme').addEventListener){
  $('uiTheme').addEventListener('change', ()=> applyTheme($('uiTheme').value));
}
let savedTheme = 'cinder';
try { savedTheme = localStorage.getItem(THEME_KEY) || 'cinder'; } catch(e){ /* private mode */ }
applyTheme(savedTheme);

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
  const snapshot = serializeCurrentSettings();
  delete snapshot.poemText;
  return snapshot;
}

const vault = createVault({
  $,
  getSettings: settingsForSpell,
  applySettings: (settings)=>{ restoreSettings(settings); scheduleRender(); },
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
const fontFaces = [];
FONTS.forEach(f=>{
  const combos = new Set([
    `${f.weight} 40px`,
    `700 40px`,
    `italic ${f.weight} 40px`,
    `italic 700 40px`,
  ]);
  combos.forEach(c=>{
    fontFaces.push(document.fonts.load(`${c} "${f.family}"`).catch(()=>{}));
  });
});
Promise.all(fontFaces).then(render).catch(render);
// The first paint uses fallback metrics, and the fitted size is cached — so
// once the real fonts land the measurements have to be thrown away, or the
// page keeps a size that was measured against the wrong typeface.
function remeasureAndRender(){
  invalidateTextMeasurements();
  render();
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureAndRender);
setTimeout(remeasureAndRender, 300);
setTimeout(remeasureAndRender, 900);
