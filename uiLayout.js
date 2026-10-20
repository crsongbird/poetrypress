/**
 * uiLayout.js — the page's layout: its size, the preview's scale, pan and zoom, the tabs, the phone's layout, focus mode
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $, ASPECTS, SIZE_LIMITS } from './appOptions.js';
import { PAGE_SAYS, fill } from './strings.js';
import { PREVIEW } from './tunables.js';
import { SURFACE_HUE_KEYS, capsFor, paramsFor } from './textureGenerators.js';
import { applyEscapes, buildLines, tokenizeInline } from './textParsers.js';
import { describeLook } from './altText.js';
import { elementsFor } from './textureElements.js';
import { lowerOn, pickLayer, surfaceNameOf } from './uiLayers.js';
import { paintDice } from './uiLocks.js';
import { resolvedPoemText, scheduleRender, setRenderScale, surfaceFromDom } from './canvasRenderer.js';
import { seedCamera } from './uiDials.js';
import { state } from './uiState.js';
import { toast } from './uiGuard.js';
import { canvas, safeColoris, setActiveRadioValue } from './appEvents.js';
import { modalPrompt, repaintEditor } from './uiControls.js';

/** Applies a page size, mirroring it into the custom boxes so switching to
 *  Custom starts from whatever you were just looking at. */
function setPageSize(w, h, mirror){
  // the EXPORT size; the preview canvas is drawn smaller (see the preview's scale)
  state.page.exportW = w; state.page.exportH = h;
  if(mirror !== false){ $('customW').value = w; $('customH').value = h; }
  applyPreviewScale();
}
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
export function applyPreviewScale(allowDown = true){
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
export const applyPreviewScaleSoon = () => { clearTimeout(previewScaleTimer); previewScaleTimer = setTimeout(() => applyPreviewScale(false), 150); };
export const clampSize = (n) =>
  Math.max(SIZE_LIMITS.min, Math.min(SIZE_LIMITS.max, Math.round(+n || 0)));
export function pickAspect(v){
  if(!ASPECTS[v]) return;
  state.page.aspect = v;
  const [w, h] = ASPECTS[v];
  setPageSize(w, h);
  // the two groups are one choice; clear the other's selection
  setActiveRadioValue('aspectGroup', v);
  setActiveRadioValue('aspectGroupWide', v);
  scheduleRender();
}
export function applyCustomSize(said){
  const w = clampSize($('customW').value);
  const h = clampSize($('customH').value);
  // a size typed past the range is said, not quietly changed (the usability review)
  if(said && (String(w) !== String($('customW').value).trim() || String(h) !== String($('customH').value).trim())) toast(fill(PAGE_SAYS.sizeClamped, w + ' × ' + h));
  $('customW').value = w; $('customH').value = h;
  state.page.aspect = 'custom';
  setPageSize(w, h, false);
  scheduleRender();
}
export function syncCustomSize(){
  const on = $('customSizeToggle').checked;
  if(document.body && document.body.classList) document.body.classList.toggle('custom-size', on);
  if(on) applyCustomSize();
  else if(ASPECTS[state.page.aspect]) pickAspect(state.page.aspect);
  else pickAspect('9:16');
}
export function randomSeed(){ return Math.floor(Math.random()*2**31); }
export function maybeRerollSeed(explicitSeed){
  // the seed field's lock is the one control for this now
  if(state.locks.has('textureSeedValue')) return;
  $('textureSeedValue').value = (explicitSeed !== undefined) ? explicitSeed : randomSeed();
  if(explicitSeed === undefined) seedCamera();
}
// THE CREDIT IS KEPT (Ruby: "save the username/credit in the local storage so the user doesn't have to keep entering it.
// It should persist forever"): whatever is typed is kept in this browser, and every visit starts with it. It is never
// part of a look (vault.js NOT_PART_OF_A_LOOK), so no preset, spell or shared look changes it; clearing the field clears it.
export const CREDIT_KEY = 'uv.credit.v1';
// The Summon buttons roll the way last chosen on any die (dieLevel): as usual, their known-good
// schemes; gently or wildly, their whole section that way. A locked control is never touched.
export const summonCard = id => { const b = $(id); return b && b.closest ? b.closest('details.card') : null; };
// NEW BACKDROP: only the backdrop's own colours (every stop in use) and the
// gradient's angle — nothing else on the page changes (Ruby). The colours are
// a small scheme around one hue (near, split or across the wheel), dark under
// light text and pale under dark text, so the words stay readable.
export function backdropColours(n){
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
export function hslHex(h, s, l){
  const f = k => { const a = s*Math.min(l, 1 - l), kk = (k + h/30) % 12; return l - a*Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); };
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v*255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function hexToRgbObj(hex){ const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16) || 0; return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; }
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
export function generateFilenameBase(){
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
export function poemAltText(){
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
export function offerAltText(alt){
  if(!alt) return;
  toast('Saved, with its alt text inside.', { label: 'Copy alt text', act: async () => {
    try { await navigator.clipboard.writeText(alt); toast('Alt text copied.'); }
    catch(e){ modalPrompt({ title: 'The alt text', body: 'Copy it from here.', input: true, defaultValue: alt, rows: 6, confirmLabel: 'Done', alert: true }); } } });
}
// Deliberately device detection, not a media query. A narrow desktop window
// is still a desktop: it has a mouse, and its keyboard never covers half the
// screen. Only an actual phone should get the phone layout.
export function detectMobile(){
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
export function applyLayout(){
  if(!document.body || !document.body.classList) return;
  const on = wantPhoneLayout(), was = document.body.classList.contains('is-mobile');
  if(on) setupPhoneLayout();
  document.body.classList.toggle('is-mobile', on);
  if(on !== was) setTimeout(() => paintDice(), 0);   // (later: this runs at boot, before the dice exist)
  if(was !== on && typeof document.dispatchEvent === 'function' && typeof CustomEvent === 'function') document.dispatchEvent(new CustomEvent('vellum-layout', { detail: { phone: on } }));
}
// WRITING ON A PHONE (Ruby): the editor fills the room between the preview and the keyboard (or the Return bar)
// and never runs under them: it scrolls inside itself, with a thin bar, and its empty room below the last line
// is still the text area, so a tap there writes at the end. The room is measured, not left to nested flexboxes
// (which, when one of them refused to shrink, once left the last lines out of reach).
const WRITING_LINES = 12;
// (…unless the divider is dragged while the keyboard is up, Ruby: "it was kind of nice that we could adjust it": the
//  preview keeps the height dragged to, at least a strip and leaving at least three lines, until a double-tap resets it)
let KB_STAGE_DRAGGED = null;
export function fitEditorRoom(){
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
