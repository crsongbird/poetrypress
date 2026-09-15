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

import { $, FONTS, PRESETS, ASPECTS } from './appOptions.js';
import { applyEscapes, tokenizeInline } from './textParsers.js';
import { render, scheduleRender, hexToHsl, hslToHex } from './canvasRenderer.js';

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
bindRadioGroup('aspectGroup', v=>{
  currentAspect=v;
  const [w,h] = ASPECTS[v];
  canvas.width=w; canvas.height=h;
  scheduleRender();
});
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
$('textureInvert').addEventListener('change', scheduleRender);

function randomSeed(){ return Math.floor(Math.random()*2**31); }
function maybeRerollSeed(explicitSeed){
  if($('textureSeedLock').checked) return;
  $('textureSeedValue').value = (explicitSeed !== undefined) ? explicitSeed : randomSeed();
}
$('textureSeedValue').addEventListener('input', scheduleRender);
$('textureSeedReroll').addEventListener('click', ()=>{
  $('textureSeedValue').value = randomSeed();
  scheduleRender();
});
$('textureSeedLock').addEventListener('change', scheduleRender);

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
$('randomBgBtn').addEventListener('click', ()=>{
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
    const types = ['clouds','bokeh','astral','magicparticles','embers','snow','grain','metalleaf','flowers','brushstrokes','halftone','rainstreaks','sigils','mathnoise','noise','inkbleed','crackedglaze','tessellate'];
    $('textureType').value = types[Math.floor(Math.random()*types.length)];
    const op = Math.floor(Math.random()*22)+4;
    $('textureOpacity').value = op;
    $('textureOpacityVal').textContent = op+'%';
    $('textureInvert').checked = Math.random() < 0.25;
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
    textureOpacity: parseFloat($('textureOpacity').value),
    textureInvert: $('textureInvert').checked,
    textureSeed: parseInt($('textureSeedValue').value, 10),
    textureSeedLock: $('textureSeedLock').checked,

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
  if(s.textureOpacity!==undefined){ $('textureOpacity').value=s.textureOpacity; $('textureOpacityVal').textContent=s.textureOpacity+'%'; }
  if(s.textureInvert!==undefined) $('textureInvert').checked = s.textureInvert;
  if(s.textureSeed!==undefined) $('textureSeedValue').value = s.textureSeed;
  if(s.textureSeedLock!==undefined) $('textureSeedLock').checked = s.textureSeedLock;

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
  if(s.aspect && ASPECTS[s.aspect]){
    currentAspect=s.aspect;
    const [w,h] = ASPECTS[s.aspect];
    canvas.width=w; canvas.height=h;
    setActiveRadioValue('aspectGroup', s.aspect);
  }

  if(s.username!==undefined) $('usernameField').value = s.username;
  if(s.usernameCorner) $('usernameCorner').value = s.usernameCorner;
  if(s.poemText!==undefined) $('poemText').value = s.poemText;

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

// ---------- presets ----------
const presetGrid = $('presetGrid');
PRESETS.forEach(p=>{
  const btn = document.createElement('div');
  btn.className = 'preset-btn';
  const swatch = document.createElement('div');
  swatch.className = 'preset-swatch';
  swatch.style.background = p.bgGradient ? `linear-gradient(${p.bgAngle||135}deg, ${p.bg1}, ${p.bg2})` : p.bg1;
  const label = document.createElement('span');
  label.className = 'preset-label';
  label.textContent = p.name;
  btn.appendChild(swatch); btn.appendChild(label);
  btn.addEventListener('click', ()=>applyPreset(p));
  presetGrid.appendChild(btn);
});

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
applyPreset(defaultPalettePreset);

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
  if(p.textureType) $('textureType').value = p.textureType;
  if(p.textureOpacity!==undefined){ $('textureOpacity').value=p.textureOpacity; $('textureOpacityVal').textContent=p.textureOpacity+'%'; }
  $('textureInvert').checked = !!p.textureInvert;

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
  const handle = $('dragHandle');
  const stageEl = typeof document.querySelector === 'function' ? document.querySelector('.stage') : null;
  if(handle && handle.addEventListener && stageEl){
    let dragging = false;
    const setFrac = (f) => root.style.setProperty('--preview-frac', Math.min(0.72, Math.max(0.14, f)).toFixed(3));
    const fracFor = (clientY) => {
      const visible = parseFloat(getComputedStyle(root).getPropertyValue('--vvh')) || window.innerHeight;
      const top = stageEl.getBoundingClientRect().top;
      return (clientY - top) / visible;
    };
    handle.addEventListener('pointerdown', (e)=>{
      dragging = true;
      if(handle.setPointerCapture) handle.setPointerCapture(e.pointerId);
      document.body.classList.add('dragging-divider');
    });
    handle.addEventListener('pointermove', (e)=>{ if(dragging){ setFrac(fracFor(e.clientY)); e.preventDefault(); } });
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

    wrap.addEventListener('touchstart', (e)=>{
      if(e.touches.length === 2){
        mode = 'pinch'; pinchStart = dist(e.touches); scaleStart = scale;
      } else if(e.touches.length === 1 && scale > 1.01){
        mode = 'pan'; panX = e.touches[0].clientX - tx; panY = e.touches[0].clientY - ty;
      } else { mode = null; }
    }, {passive:true});

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
document.fonts.ready.then(render);
setTimeout(render, 300);
setTimeout(render, 900);
