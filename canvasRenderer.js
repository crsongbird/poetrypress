/**
 * canvasRenderer.js — turns the poem and every control into pixels.
 *
 * SECTIONS
 *   Emoji helpers        isEmojiCodePoint, segmentHasEmoji — drawTextRun
 *                        uses them to decide whether to tint an emoji
 *   Colour maths         makeGradient (N-stop), hexToHsl / hslToHex, paintGradient
 *                        (linear, radial, rectangular),
 *                        collectGradientColors (reads the stop pickers)
 *   Measuring text       fontString, emphasisTracking (the letter-spacing
 *                        stand-in for fonts without an italic), measureSegWidth
 *   Text effects         drawEffects (the stack, effects.js), drawErodedText — extra
 *                        passes that never move text or change its width
 *   Drawing a run        tintedEmojiCanvas, resolvePartStyle (a segment's own
 *                        overrides), drawTextRun (outline, shadow, tracking,
 *                        underline, gradient fill, emoji tint)
 *   Layout               fitTextSize (the auto-size search), blockHeight,
 *                        the cached parse of the poem
 *   §Variables           pmlVarContext — what the poem can report about the
 *                        page; resolved (pmlVars.js) before the poem is parsed
 *   render()             reads every control, lays out and draws the lines,
 *                        then the texture, border, vignette, credit and spell
 *
 * Exports render, scheduleRender, invalidateTextMeasurements, hexToHsl,
 * hslToHex. Inline glyphs (glyphs.js) are installed on the canvas at load.
 */

import { $, FONTS, getActiveRadioValue } from './appOptions.js';
import { buildLines, TYPE_EFFECT_NAMES } from './textParsers.js';
import { spellForSeed, spellToPML, validateSpell, GLYPH_FONT } from './spell.js';
import { getTextureCanvas, capsFor, defaultBlendFor, paramsFor, paramReadout, textureCacheMB, dropLargeTextures, graphUsesBackdrop, graphUsesBox, graphUsesCurves, chainReadsPoem, layerLights } from './textureGenerators.js';
import { athanorKnobs, athanorHues, athanorName } from './athanor.js';
import { POEM_PUNCT, punctMark } from './steps.js';
import { fill, CHOOSER } from './strings.js';
import { resolvePmlVariables } from './pmlVars.js';
import { seedPhrase } from './seedWords.js';
import { moonPhase } from './moon.js';
import { moonForSeed } from './texWhimsy.js';
import { installInlineGlyphs, clearMeasureCache } from './glyphs.js';
import { drawStitch, pathFromPoints, roundRectPoints, stitchInnerEdge, STITCH_STYLES } from './stitches.js';
import { boxGlass, boxBlend, BOX_GPU_BLENDS, CANVAS_BLENDS } from './boxFx.js';
import { makeEffect, legacyOutline, legacyTypeEffect, describeStack } from './effects.js';
import { requestTexture, onTextureReady, textureServiceInfo } from './textureService.js';
import { ensureFonts, fontsRequested } from './fonts.js';
import { mixHex } from './texCore.js';
import { EFFECTS, MARKS, READABLE } from './tunables.js';


function isEmojiCodePoint(cp){
  return (cp>=0x1F300 && cp<=0x1FAFF) ||
         (cp>=0x2600 && cp<=0x27BF) ||
         (cp>=0x1F1E6 && cp<=0x1F1FF) ||
         (cp>=0x2B00 && cp<=0x2BFF) ||
         cp===0xFE0F || cp===0x200D || cp===0x20E3;
}
function segmentHasEmoji(text){
  for(const ch of text){ if(isEmojiCodePoint(ch.codePointAt(0))) return true; }
  return false;
}

// ---------- inline tokenizer (nesting-aware) ----------
// A stack-based scanner rather than a single regex pass — this is what actually
// makes **bold [accent] still bold** work: every character gets a snapshot of
// whichever styles are currently "open" on the stack, and consecutive characters
// with identical snapshots get coalesced into one run at the end. Handles bold,
// italic, underline, strikethrough, both accent colors, and the hidden gradient
// wraps {[...]} / [{...]} — all freely combinable and nestable.

function collectGradientColors(color1, color2Id, color3Id, color4Id, stopCount){
  const colors = [color1, $(color2Id).value];
  if(stopCount >= 3) colors.push($(color3Id).value);
  if(stopCount >= 4) colors.push($(color4Id).value);
  return colors;
}

function makeGradient(ctx, w, h, angleDeg, colors, shape){
  // the text's shapes: LINEAR (as ever), MIRRORED (there and back), RADIAL
  // (from the middle of the page out), SWEEP (turning about the middle)
  if(shape === 'radial'){
    const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h)*0.62);
    colors.forEach((c, i) => g.addColorStop(colors.length > 1 ? i/(colors.length-1) : 0, c)); return g;
  }
  if(shape === 'conic' && typeof ctx.createConicGradient === 'function'){
    const g = ctx.createConicGradient((angleDeg - 90)*Math.PI/180, w/2, h/2), ring = colors.concat([colors[0]]);
    ring.forEach((c, i) => g.addColorStop(i/(ring.length-1), c)); return g;
  }
  if(shape === 'mirror') colors = colors.concat(colors.slice(0, -1).reverse());
  const rad = angleDeg * Math.PI/180;
  const cx = w/2, cy = h/2;
  const len = Math.sqrt(w*w+h*h)/2;
  const x0 = cx - Math.cos(rad)*len, y0 = cy - Math.sin(rad)*len;
  const x1 = cx + Math.cos(rad)*len, y1 = cy + Math.sin(rad)*len;
  const g = ctx.createLinearGradient(x0,y0,x1,y1);
  colors.forEach((c,i)=>{ g.addColorStop(colors.length>1 ? i/(colors.length-1) : 0, c); });
  return g;
}


// ---------- gradients for the backdrop and the inset box ----------
/**
 * Fills a rectangle with a gradient of any shape:
 *   linear  along an angle across the rectangle (what the backdrop always did)
 *   radial  circles out from a centre point (cx, cy as 0–1 of the rectangle)
 *           to a radius (r, as a share of its longer side)
 *   rect    concentric boxes from that centre — a framed glow, and the basis
 *           for vignettes that follow the page's shape
 *   conic   SWEEP: the colours turn about the centre from the angle
 *   mirror  linear, there and back again
 * The caller sets any clip (rounded corners) beforehand.
 */
function hexRgb(h){ const n = parseInt(String(h).replace('#','').slice(0,6), 16); return [n>>16, (n>>8)&255, n&255]; }
function paintGradient(ctx, x, y, w, h, spec, colors){
  const stops = colors.length > 1 ? colors : [colors[0], colors[0]];
  if(spec.type === 'radial'){
    const cx = x + w*spec.cx, cy = y + h*spec.cy, r = Math.max(w, h)*spec.r;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, r));
    stops.forEach((c, i) => g.addColorStop(i/(stops.length-1), c));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  } else if(spec.type === 'rect'){
    // no native box gradient: computed small and scaled up, which keeps it
    // smooth and costs a few thousand pixels, not millions
    const S = 128, small = document.createElement('canvas'); small.width = S; small.height = S;
    const sx = small.getContext('2d', { willReadFrequently: true }), img = sx.createImageData(S, S), d = img.data;
    const rgb = stops.map(hexRgb), n = rgb.length - 1;
    const hx = Math.max(spec.cx, 1 - spec.cx), hy = Math.max(spec.cy, 1 - spec.cy);
    for(let py = 0; py < S; py++) for(let px = 0; px < S; px++){
      const u = (px + 0.5)/S, v = (py + 0.5)/S;
      let t = Math.max(Math.abs(u - spec.cx)/hx, Math.abs(v - spec.cy)/hy) / Math.max(0.05, spec.r/0.75);
      t = Math.max(0, Math.min(1, t)) * n;
      const k = Math.min(n - 1, Math.floor(t)), f = t - k, a = rgb[k], b = rgb[k+1] || a, i = (py*S + px)*4;
      d[i] = a[0] + (b[0]-a[0])*f; d[i+1] = a[1] + (b[1]-a[1])*f; d[i+2] = a[2] + (b[2]-a[2])*f; d[i+3] = 255;
    }
    sx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(small, x, y, w, h);
  } else if(spec.type === 'conic'){
    // SWEEP: the colours turn about the centre, from the angle, and close the circle
    const cx = x + w*spec.cx, cy = y + h*spec.cy, rad = ((spec.angle || 0) - 90) * Math.PI/180, ring = stops.concat([stops[0]]);
    if(typeof ctx.createConicGradient === 'function'){
      const g = ctx.createConicGradient(rad, cx, cy);
      ring.forEach((c, i) => g.addColorStop(i/(ring.length-1), c));
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else {
      const S = 128, small = document.createElement('canvas'); small.width = S; small.height = S;
      const sx = small.getContext('2d', { willReadFrequently: true }), img = sx.createImageData(S, S), d = img.data, rgb = ring.map(hexRgb), n = rgb.length - 1;
      for(let py = 0; py < S; py++) for(let px = 0; px < S; px++){
        const u = (px + 0.5)/S*w + x - cx, v = (py + 0.5)/S*h + y - cy;
        let t = ((Math.atan2(v, u) - rad)/(2*Math.PI)) % 1; if(t < 0) t += 1; t *= n;
        const k = Math.min(n - 1, Math.floor(t)), f = t - k, a = rgb[k], b = rgb[k+1] || a, i = (py*S + px)*4;
        d[i] = a[0] + (b[0]-a[0])*f; d[i+1] = a[1] + (b[1]-a[1])*f; d[i+2] = a[2] + (b[2]-a[2])*f; d[i+3] = 255;
      }
      sx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(small, x, y, w, h);
    }
  } else {
    // LINEAR along the angle; MIRRORED runs the colours there and back again
    const rad = (spec.angle || 0) * Math.PI/180, cx = x + w/2, cy = y + h/2, len = Math.hypot(w, h)/2;
    const g = ctx.createLinearGradient(cx - Math.cos(rad)*len, cy - Math.sin(rad)*len, cx + Math.cos(rad)*len, cy + Math.sin(rad)*len);
    const run = spec.type === 'mirror' ? stops.concat(stops.slice(0, -1).reverse()) : stops;
    run.forEach((c, i) => g.addColorStop(i/(run.length-1), c));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
}
/** A rectangle path with rounded corners (radius 0 is square). */
/** The gradient settings for a surface: 'bg' (the backdrop) or 'card' (the inset box). */
function gradientSpec(which){
  const v = (id, d) => { const el = $(id); const n = el ? parseFloat(el.value) : NaN; return isNaN(n) ? d : n; };
  if(which === 'card') return { type: ($('cardGradientType') || {}).value || 'linear', angle: v('cardGradientAngle', 90), cx: 0.5, cy: 0.5, r: 0.75 };
  return { type: ($('bgGradientType') || {}).value || 'linear', angle: v('bgGradientAngle', 135),
           cx: v('bgRadialX', 50)/100, cy: v('bgRadialY', 50)/100, r: v('bgRadialR', 75)/100 };
}
function roundRectPath(ctx, x, y, w, h, r){
  r = Math.max(0, Math.min(r, w/2, h/2));
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}
/** Two small speckle tiles for border grain, made once: dark specks and bright ones. */
let GRAIN_TILES = null;
/** One scratch canvas for the bloom and erosion text effects, reused for every
 *  segment. Setting its size also clears it and resets its state. */
let SCRATCH = null;
function scratchCanvas(w, h){
  if(!SCRATCH) SCRATCH = document.createElement('canvas');
  SCRATCH.width = w; SCRATCH.height = h;
  return SCRATCH;
}
/** BLEND WITH TEXT (Ruby: the second surface "uses the text as a blend layer"): while the words are drawn, each glyph is
 *  also filled white on this mask (the same font, place and turn), so the surface can be blended into the letters alone.
 *  Kept between renders; null when no surface asks for it. */
let GLYPH_MASK = null, GLYPH_CANVAS = null, FILL_CANVAS = null, CUT_CANVAS = null;
function maskGlyphs(ctx, str, x, y){
  const M = GLYPH_MASK; if(!M) return;
  M.save(); if(typeof ctx.getTransform === 'function' && typeof M.setTransform === 'function') M.setTransform(ctx.getTransform());
  M.font = ctx.font; M.textBaseline = ctx.textBaseline; M.textAlign = ctx.textAlign; M.globalAlpha = ctx.globalAlpha; M.fillStyle = '#fff';
  M.fillText(str, x, y); M.restore();
}
function maskImage(ctx, img, x, y){
  const M = GLYPH_MASK; if(!M) return;
  M.save(); if(typeof ctx.getTransform === 'function' && typeof M.setTransform === 'function') M.setTransform(ctx.getTransform()); M.drawImage(img, x, y); M.restore();
}
/** The inset box's own layer, kept between renders (see the box, in render()). */
let CARD_LAYER = null;
function cardLayer(w, h){
  if(!CARD_LAYER){ CARD_LAYER = document.createElement('canvas'); }
  if(CARD_LAYER.width !== w || CARD_LAYER.height !== h){ CARD_LAYER.width = w; CARD_LAYER.height = h; }
  return CARD_LAYER;
}
// WHERE THE WORDS ARE (the future-directions doc: "readability as part of the shader"): each frame records
// its text's runs as fractions of the page — "x0,y0,x1,y1,line,stanza;…" — for Text Clearing below and for
// the Athanor's The Poem part. A surface drawn before the text reads the last frame's record; a change in
// it asks for one more frame, which then agrees with itself.
let TEXT_LAYOUT = '';
export function textLayoutNow(){ return TEXT_LAYOUT; }
// PUNCTUATION (ROADMAP G2): where each mark sits, recorded after the runs as "x,y,mark" (three numbers: every reader of
// the runs passes them over). drawTextRun notes them while PUNCT_NOW is a list, which it is for the poem's own lines.
let PUNCT_NOW = null;
function notePunct(ctx, text, x, w, top, size, along){
  const all = ctx.measureText(text).width || 1, k = w/all, chars = Array.from(text); let i = 0, j = -1;
  // (an apostrophe inside a word, as in don't or it's, is part of the word, not a mark: Ruby)
  const letter = c => !!c && /\p{L}/u.test(c);
  for(const ch of text){ j++; const m = (ch === "'" || ch === '’') && letter(chars[j - 1]) && letter(chars[j + 1]) ? 0 : punctMark(ch);
    if(m){ const cx = x + (ctx.measureText(text.slice(0, i)).width + ctx.measureText(ch).width/2)*k, sh = along ? along(cx) : null;
      PUNCT_NOW.push([cx + (sh ? sh.dx : 0), top + size*POEM_PUNCT[m - 1].at + (sh ? sh.dy : 0), m]); }
    i += ch.length; }
}
/** A graph that asks for the poem (its The Poem part) is made with the layout; any other graph never sees it. */
export function graphUsesPoem(graph){ return /"name":\s*"poem"/.test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
// TEXT CLEARING: a surface quieted behind the words. The mask is made small (192 across, in page fractions,
// so the preview and the export agree), blurred there, and scaled up: soft by construction, and cheap.
let CLEAR_LAYER = null, CLEAR_MASK = { key: '', canvas: null };
function clearingMask(W, H){
  const mw = 192, mh = Math.max(8, Math.round(192*H/W)), key = TEXT_LAYOUT + '|' + mw + 'x' + mh;
  if(CLEAR_MASK.key === key) return CLEAR_MASK.canvas;
  const c = CLEAR_MASK.canvas || document.createElement('canvas'); c.width = mw; c.height = mh;
  const x = c.getContext('2d', { willReadFrequently: true }), a = new Float32Array(mw*mh), runs = [];
  for(const part of TEXT_LAYOUT.split(';')){ const v = part.split(',').map(Number); if(v.length >= 4 && v.every(isFinite)) runs.push(v); }
  let hsum = 0;
  for(const [x0, y0, x1, y1] of runs){ const h = (y1 - y0)*mh, p = h*0.35; hsum += h;
    for(let yy = Math.max(0, Math.floor(y0*mh - p)); yy < Math.min(mh, Math.ceil(y1*mh + p)); yy++)
      for(let xx = Math.max(0, Math.floor(x0*mw - p)); xx < Math.min(mw, Math.ceil(x1*mw + p)); xx++) a[yy*mw + xx] = 1; }
  // two box blurs, about a line's height across: the clearing fades out around the words rather than stopping
  const rad = Math.max(1, Math.round(runs.length ? hsum/runs.length*0.7 : 2)), t = new Float32Array(mw*mh);
  for(let pass = 0; pass < 2; pass++){
    for(let yy = 0; yy < mh; yy++){ let acc = 0, n = 0; for(let xx = -rad; xx < mw + rad; xx++){ if(xx + rad < mw){ acc += a[yy*mw + xx + rad]; n++; } if(xx - rad - 1 >= 0){ acc -= a[yy*mw + xx - rad - 1]; n--; } if(xx >= 0 && xx < mw) t[yy*mw + xx] = acc/Math.max(1, n); } }
    for(let xx = 0; xx < mw; xx++){ let acc = 0, n = 0; for(let yy = -rad; yy < mh + rad; yy++){ if(yy + rad < mh){ acc += t[(yy + rad)*mw + xx]; n++; } if(yy - rad - 1 >= 0){ acc -= t[(yy - rad - 1)*mw + xx]; n--; } if(yy >= 0 && yy < mh) a[yy*mw + xx] = acc/Math.max(1, n); } }
  }
  const im = x.createImageData(mw, mh);
  for(let i = 0; i < mw*mh; i++){ im.data[i*4] = im.data[i*4 + 1] = im.data[i*4 + 2] = 255; im.data[i*4 + 3] = Math.round(Math.min(1, a[i]*1.4)*255); }
  x.putImageData(im, 0, 0);
  CLEAR_MASK = { key, canvas: c };
  return c;
}
// PROTECT THE TEXT (ROADMAP G3): how well the words stand off what they sit on. Asked for, a frame keeps a
// small copy of itself just before its words are drawn (backdrop, surfaces, vignette, box, border: all the
// ground) and measures each line on it: the ink against the ground beneath, as a contrast ratio (WCAG's).
// The probe is a fixed size in page fractions, so the preview and the export measure alike.
let GROUND_PROBE = null, PROBE_LAYER = null, PROBE_INK_LAYER = null, PROBE_INKS = null;
const LIN = new Float32Array(256).map((_, v) => { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v + 0.055)/1.055, 2.4); });
/** A color the words are written in, as [r, g, b, alpha] (a quote is written fainter); null if it isn't a hex. */
function inkOf(c, alpha = 1){ let h = String(c || '').trim().replace('#', '');
  if(/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, c => c + c);
  if(!/^[0-9a-f]{6}/i.test(h)) return null;
  const n = parseInt(h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, alpha]; }
/** How a run's words are colored, at a point of the probe: its span's ink (a span is one segment of the line). */
function spanInks(sp, fx, x, y, gw, inkField){
  if(sp.ramp){ const n = sp.ramp.length, t = Math.max(0, Math.min(1, (fx - sp.x0)/Math.max(1e-6, sp.x1 - sp.x0)))*(n - 1), i = Math.min(n - 2, Math.floor(t)), f = t - i;
    if(n < 2) return sp.ramp; const a = sp.ramp[i], b = sp.ramp[i + 1];
    return [[a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f, a[2] + (b[2] - a[2])*f, a[3]]]; }
  if(sp.page){ const i = (y*gw + x)*4; return [[inkField[i], inkField[i + 1], inkField[i + 2], sp.alpha]]; }
  return sp.inks;
}
/** Each run's contrast against its ground: the ground's pixels (RGBA, gw × gh) under the run's box (page
 *  fractions), against the ink written there (a faint ink laid over the ground as it is drawn), read where only
 *  `allowance` of the ground falls lower. A run is { box: [x0, y0, x1, y1], line, words, inks } (held to the worst of
 *  its inks), or carries `spans` across it: { x0, x1, inks }, a ramp of colors along it ({ ramp }), or the
 *  page's own ink read from `inkField` ({ page, alpha }: a text gradient laid across the page). */
export function groundContrast(data, gw, gh, runs, allowance = READABLE.allowance, inkField = null){
  const lines = [], ink = k => Array.isArray(k) ? k : inkOf(k);
  for(const run of runs){ const [x0, y0, x1, y1] = run.box;
    const spans = (run.spans || [{ x0, x1, inks: run.inks }]).map(sp => ({ ...sp, inks: (sp.inks || []).map(ink).filter(Boolean), ramp: sp.ramp && sp.ramp.map(ink).filter(Boolean) }))
      .filter(sp => sp.inks.length || (sp.ramp && sp.ramp.length) || (sp.page && inkField));
    if(!spans.length) continue;
    const r = [];
    for(let x = Math.max(0, Math.floor(x0*gw)); x < Math.min(gw, Math.ceil(x1*gw)); x++){
      const fx = (x + 0.5)/gw;
      let sp = spans[0], d = Infinity;   // the span written here, or the nearest (the room between them)
      for(const s of spans){ const dd = fx < s.x0 ? s.x0 - fx : fx > s.x1 ? fx - s.x1 : 0; if(dd < d){ d = dd; sp = s; } }
      for(let y = Math.max(0, Math.floor(y0*gh)); y < Math.min(gh, Math.ceil(y1*gh)); y++){
        const i = (y*gw + x)*4, R = data[i], G = data[i + 1], B = data[i + 2], g = 0.2126*LIN[R] + 0.7152*LIN[G] + 0.0722*LIN[B];
        let m = Infinity;
        for(const [kr, kg, kb, a] of spanInks(sp, fx, x, y, gw, inkField)){
          const k = 0.2126*LIN[Math.round(kr*a + R*(1 - a))] + 0.7152*LIN[Math.round(kg*a + G*(1 - a))] + 0.0722*LIN[Math.round(kb*a + B*(1 - a))];
          const c = (Math.max(k, g) + 0.05)/(Math.min(k, g) + 0.05); if(c < m) m = c; }
        r.push(m); } }
    if(!r.length) continue;
    r.sort((a, b) => a - b);
    lines.push({ line: run.line, words: run.words || '', ratio: r[Math.min(r.length - 1, Math.floor(r.length*allowance))] });
  }
  const worst = lines.reduce((w, l) => !w || l.ratio < w.ratio ? l : w, null);
  return { lines, worst: worst ? worst.ratio : Infinity, line: worst ? worst.line : -1, words: worst ? worst.words : '' };
}
/** Draw a frame and measure it: each line of the poem against what it sits on (null with no words). */
export function measureTextGround(){
  GROUND_PROBE = { ask: true };
  try { render(); } finally { PROBE_INKS = null; }
  const got = GROUND_PROBE; GROUND_PROBE = null;
  return got && got.result && got.result.lines.length ? got.result : null;
}
/** A surface with the words' clearing taken out of it (destination-out), on a layer kept between frames. */
export function clearedSurface(t, W, H, amount){   // test hook: exported so textRender.test can clear a surface as render() does
  if(!TEXT_LAYOUT || amount <= 0) return t;
  if(!CLEAR_LAYER) CLEAR_LAYER = document.createElement('canvas');
  if(CLEAR_LAYER.width !== W || CLEAR_LAYER.height !== H){ CLEAR_LAYER.width = W; CLEAR_LAYER.height = H; }
  const c = CLEAR_LAYER.getContext('2d', { willReadFrequently: true });
  c.globalCompositeOperation = 'copy'; c.globalAlpha = 1; c.drawImage(t, 0, 0, W, H);
  c.globalCompositeOperation = 'destination-out'; c.globalAlpha = Math.min(1, amount); c.imageSmoothingEnabled = true;
  c.drawImage(clearingMask(W, H), 0, 0, W, H);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  return CLEAR_LAYER;
}
/** The bloom's own layer, kept between renders and resized only when the page is. */
let BLOOM_LAYER = null;
function bloomLayer(w, h){
  if(!BLOOM_LAYER){ BLOOM_LAYER = document.createElement('canvas'); }
  if(BLOOM_LAYER.width !== w || BLOOM_LAYER.height !== h){ BLOOM_LAYER.width = w; BLOOM_LAYER.height = h; }
  return BLOOM_LAYER;
}
function grainTiles(){
  if(GRAIN_TILES) return GRAIN_TILES;
  const make = (tone) => { const T = 96, c = document.createElement('canvas'); c.width = T; c.height = T;
    const x = c.getContext('2d', { willReadFrequently: true }); let seed = tone === 0 ? 7 : 13;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;      // stable, so grain never shimmers
    for(let i = 0; i < 420; i++){ x.globalAlpha = 0.35 + rand()*0.65; x.fillStyle = tone ? '#fff' : '#000';
      x.fillRect(rand()*T, rand()*T, 1 + rand()*1.6, 1 + rand()*1.6); }
    return c; };
  return (GRAIN_TILES = { dark: make(0), bright: make(255) });
}

// the face for `code` segments (Courier Prime is loaded with the page)
const CODE_FONT = { label:'code', family:'Courier Prime', weight:'400' };

function fontString(fontDef, seg, size){
  const weight = seg.bold ? '700' : fontDef.weight;
  const useItalic = seg.italic && !fontDef.noItalic;
  const italic = useItalic ? 'italic ' : '';
  // falls back to the symbol fonts, so spell glyphs in the poem draw
  return `${italic}${weight} ${size}px "${fontDef.family}", ${GLYPH_FONT}`;
}

// For fonts with no italic face at all (e.g. Cinzel — Roman capitals never had a
// cursive form), *italic* markup and > quote lines fall back to letter-spaced
// "spaced caps" emphasis instead — a period-appropriate stand-in, and also just
// how classical inscriptional type actually signals emphasis without slanting.
function emphasisTracking(fontDef, seg, size){
  return (fontDef.noItalic && seg.italic) ? size*0.14 : 0;
}

// Shared between measureSegWidth and drawTextRun -- both MUST agree, or a
// small-caps line's measured width (used for layout, alignment, and the
// rhyme-marker position) disagrees with what's actually drawn. This is
// exactly the bug that already happened once with tracking: drawTextRun
// used style.customTracking but measureSegWidth had no idea it existed,
// so a /track:140 word measured narrow but drew wide, and the text after
// it ended up drawn on top of it.
const SMALL_CAP_RATIO = 0.78;

// trackingOverridePercent and smallCaps must match whatever drawTextRun is
// about to actually use for this same segment -- see the comment above.
function measureSegWidth(ctx, fontDef, seg, size, trackingOverridePercent, smallCaps){
  ctx.font = fontString(fontDef, seg, size);
  const tracking = trackingOverridePercent!=null ? size*0.14*(trackingOverridePercent/100) : emphasisTracking(fontDef, seg, size);
  if(!smallCaps && tracking === 0) return ctx.measureText(seg.text).width;
  let w = 0;
  for(const ch of seg.text){
    const isLower = smallCaps && ch !== ch.toUpperCase() && ch === ch.toLowerCase();
    if(isLower) ctx.font = fontString(fontDef, seg, size*SMALL_CAP_RATIO);
    w += ctx.measureText(isLower ? ch.toUpperCase() : ch).width + tracking;
    if(isLower) ctx.font = fontString(fontDef, seg, size);
  }
  return w;
}

// Canvas glyphs for emoji ignore fillStyle entirely (they're full-color bitmap
// glyphs, not shape-based). To "colorize" one: draw it once to a transparent
// offscreen canvas, then flat-fill with 'source-atop' so the new color only
// lands where the glyph itself has any alpha — a silhouette tint.
// Tinted glyphs, remembered: the same glyph, font, colour and size is the
// same image, and building one per glyph per render was a third of a render.
// (A gradient fill is a new object each render, so those aren't remembered.)
// CPU canvases, like the page they're drawn into — no copy back from the GPU.
const TINTED = new Map();
function tintedEmojiCanvas(ch, font, fillStyle, size){
  const key = typeof fillStyle === 'string' ? ch + '\u0001' + font + '\u0001' + fillStyle + '\u0001' + size : null;
  if(key && TINTED.has(key)) return TINTED.get(key);
  const dim = Math.ceil(size*2);
  const off = document.createElement('canvas');
  off.width = dim; off.height = dim;
  const octx = off.getContext('2d', { willReadFrequently: true });
  octx.font = font;
  octx.textBaseline = 'top';
  octx.textAlign = 'left';
  octx.fillStyle = '#000';
  octx.fillText(ch, 0, 0);
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = fillStyle;
  octx.fillRect(0,0,dim,dim);
  if(key){ if(TINTED.size > 400) TINTED.clear(); TINTED.set(key, off); }
  return off;
}

// Draws one run of segments (a whole line, or one chunk of a split-alignment
// line) starting at startX/cursorY. Handles outline/shadow, the no-italic-font
// letter-spacing fallback, underline/strikethrough, per-segment gradient fill
// (for the {[...]}/[{...]} hidden feature), and emoji colorization — all as one
// shared path so normal lines and split-alignment chunks render identically.
/**
 * A `code` segment's backdrop, drawn just before its text. Its colour comes
 * from the look's first accent; its LIGHTNESS from the page right behind it,
 * read from the canvas as it stands: over a light area a dark backdrop with
 * light text, over a dark area the reverse. Returns the style the text
 * should be drawn with.
 */
function drawCodeBackdrop(ctx, x, y, w, size, style){
  let behind = 0.5;
  try {
    const px = ctx.getImageData(Math.max(0, Math.round(x + w/2)), Math.max(0, Math.round(y + size*0.55)), 1, 1).data;
    behind = (px[0]*0.299 + px[1]*0.587 + px[2]*0.114) / 255;
  } catch(e){ /* unreadable canvas: assume a midtone */ }
  // (hexToHsl gives { h, s, l }, s and l in percent; hslToHex takes the same — an array read of it threw
  // here, and every frame with inline code failed: the preview froze on its last good picture)
  const { h: hue } = hexToHsl(/^#[0-9a-f]{6}$/i.test(style.accent1Color || '') ? style.accent1Color : '#9B7FE8');
  const light = behind < 0.5;                          // dark page: light backdrop
  const back = hslToHex(hue, light ? 32 : 28, light ? 88 : 15);
  const ink  = hslToHex(hue, light ? 45 : 30, light ? 14 : 92);
  const padX = size*0.24, top = y - size*0.06, h = size*1.2, r = size*0.18;
  ctx.save();
  ctx.globalAlpha = 0.62; ctx.fillStyle = back;
  ctx.beginPath();
  ctx.moveTo(x - padX + r, top); ctx.lineTo(x + w + padX - r, top); ctx.arcTo(x + w + padX, top, x + w + padX, top + r, r);
  ctx.lineTo(x + w + padX, top + h - r); ctx.arcTo(x + w + padX, top + h, x + w + padX - r, top + h, r);
  ctx.lineTo(x - padX + r, top + h); ctx.arcTo(x - padX, top + h, x - padX, top + h - r, r);
  ctx.lineTo(x - padX, top + r); ctx.arcTo(x - padX, top, x - padX + r, top, r);
  ctx.fill();
  ctx.restore();
  return { ...style, baseFillStyle: ink, customGradient: null };
}

function resolvePartStyle(part, baseStyle){
  // nothing of its own: the run's style stands (every field a segment can set must be listed here)
  if(!part.customColor && !part.customEffect && !part.customTypeEffect && !part.customFx && !part.under && !part.customGradient && part.customTracking==null && part.customJitter==null && part.customOpacity==null && !part.customBlend && part.customArc==null && !part.customWave) return baseStyle;
  const s = { ...baseStyle };
  // /op: and /blend: — how the part's ink lies on the page; /arc and /wave — the path its letters follow
  if(part.customOpacity!=null) s.opacity = part.customOpacity/100;
  if(part.customBlend) s.blend = part.customBlend;
  if(part.customArc!=null && part.customArc !== 0) s.arc = part.customArc;
  if(part.customWave && part.customWave.amp) s.wave = part.customWave;
  if(part.customColor){
    s.baseFillStyle = part.customColor;
    s.accent1Color = part.customColor;
    s.accent2Color = part.customColor;
  }
  if(part.customGradient){
    s.customGradientColors = part.customGradient;
  }
  if(part.customTracking!=null){
    s.customTracking = part.customTracking;
  }
  if(part.customJitter!=null){
    s.customJitter = part.customJitter;
  }
  // the effect stack for this segment: /fx:… replaces the page's stack; the
  // older /fx0 /fx1 /fx2 and /effect forms translate into it (effects.js)
  if(part.customFx){ s.fx = part.customFx; }
  else if(part.customEffect || part.customTypeEffect){
    const fx = [];
    const ce = part.customEffect;
    if(ce && ce.type === 'outline') fx.push(makeEffect('outline', ce.color, ce.width, 100));
    else if(ce && ce.type === 'shadow') fx.push(legacyOutline('shadow', ce.color, 0, ce.blur, ce.x, ce.y));
    if(part.customTypeEffect){
      const t = part.customTypeEffect, L = legacyTypeEffect(t.type, t.strength, t.color, t.angle, t.distance, t.grain);
      if(L.fx) fx.push(L.fx);
      if(L.under) s.under = L.under;
    } else if(!ce || ce.type !== 'none') fx.push(...(baseStyle.fx || []).filter(e => e.type !== 'outline' && e.type !== 'shadow'));
    s.fx = fx;
  }
  if(part.under) s.under = part.under;
  return s;
}

// Cheap deterministic pseudo-random in roughly [-1, 1], seeded by a
// character's position and codepoint -- a classic sin-hash trick (common in
// shader code) rather than a real PRNG, chosen specifically so /jitter
// doesn't need the texture-seed system threaded through the whole call
// chain just to be reproducible. Same text always jitters the same way.
function charJitterOffset(seedBase){
  const x = Math.sin(seedBase) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}


/**
 * Typeface effects. Each is extra passes of the same glyphs drawn UNDER the
 * real fill, so none of them changes where text sits or how it measures —
 * which is what keeps fitting, wrapping and the editor mirror in agreement.
 *
 *   letterpress  pressed into the page: dark edge above, light edge below
 *   longshadow   a cast shadow stepping away from the light direction
 *   doublestrike misregistered second impression, as on an old press
 *   chromatic    red and blue fringes pulled to either side
 *   halo         a soft glow, distinct from the hard outline
 *   bevel        raised: lit edge toward the light, shadowed edge away
 *   erosion      worn type — bites taken out of the glyphs themselves
 *   doubleline   two rules beneath
 *   wavyline     a wavy rule beneath
 *   dottedline   a dotted rule beneath
 *
 * Erosion is the one that cannot be an underlay: it has to REMOVE ink. It is
 * drawn through drawErodedText instead of the plain fill, and its bites are
 * seeded from the text and its position, so they stay put while you type
 * rather than crawling on every repaint.
 */

/**
 * Draws a segment's effect stack (effects.js) beneath its glyphs, in order.
 * Distances in px are canonical pixels; the rest scale with the text. While
 * effects draw, the sigil draws as a silhouette in the effect's colour.
 */
function drawEffects(ctx, str, x, y, size, fill, fx){
  if(!fx || !fx.length) return;
  ctx.__vellumEffectPass = true;
  try { for(const e of fx){ if(e && e.type !== 'none' && e.type !== 'erosion'){ ctx.save(); EFFECT_DRAW[e.type](ctx, str, x, y, size, fill, e); ctx.restore(); } } }
  finally { ctx.__vellumEffectPass = false; }
}
const along = (e, d) => { const a = (e.angle || 0) * Math.PI/180; return [Math.cos(a)*d, Math.sin(a)*d]; };
/**
 * The letters, softened by r (a standard deviation, in the page's pixels), in
 * one colour. Drawn as a canvas SHADOW of letters set far off the page: a
 * shadow's blur works on the glyphs' own coverage mask, which browsers do
 * quickly (on the GPU where there is one), where ctx.filter = blur() blurs a
 * whole layer per call — measured ~100× slower (1.3 s against 10 ms for 24
 * glowing words), and per LETTER when a run is tracked or jittered. The shadow
 * sits exactly where filter's blur did (mean difference 1/255). Shadows work in
 * the device's pixels, so the offset and blur are carried through the current
 * transform (rotated letters, scaled glyphs).
 */
function softText(ctx, str, x, y, r, colour){
  if(!(r > 0.3) || typeof ctx.getTransform !== 'function'){ ctx.fillStyle = colour; ctx.fillText(str, x, y); return; }
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1;
  const K = ((ctx.canvas ? ctx.canvas.width + ctx.canvas.height : 8192) * 2 + r * 8) / sc;   // far enough off that only the shadow lands
  ctx.save();
  ctx.fillStyle = '#000'; ctx.shadowColor = colour; ctx.shadowBlur = 2 * r * sc;
  ctx.shadowOffsetX = m.a * K; ctx.shadowOffsetY = m.b * K;
  ctx.fillText(str, x - K, y);
  ctx.restore();
}
const EFFECT_DRAW = {
  outline(ctx, str, x, y, size, fill, e){
    ctx.globalAlpha = e.k2/100; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = rpx(e.k1)*2; ctx.strokeStyle = e.color; ctx.strokeText(str, x, y);
  },
  shadow(ctx, str, x, y, size, fill, e){
    const [dx, dy] = along(e, rpx(e.k2));
    softText(ctx, str, x + dx, y + dy, rpx(e.k1)/2, e.color);
  },
  longshadow(ctx, str, x, y, size, fill, e){
    const L = size*0.7*e.k1/100, step = Math.max(rpx(1), size*0.025), n = Math.max(1, Math.ceil(L/step));
    const [ux, uy] = along(e, 1); ctx.fillStyle = e.color;
    for(let i = n; i >= 1; i--){ ctx.globalAlpha = (e.k2/100)*(1 - (i - 1)/n*0.85); ctx.fillText(str, x + ux*step*i, y + uy*step*i); }
  },
  glow(ctx, str, x, y, size, fill, e){
    const r = Math.max(rpx(1), size*0.45*e.k1/100);
    ctx.globalAlpha = e.k2/100; softText(ctx, str, x, y, r, e.color);
    softText(ctx, str, x, y, r*0.4, e.color);                           // a tighter, brighter core
  },
  letterpress(ctx, str, x, y, size, fill, e){
    // pressed INTO the page: a light edge on the side away from the light, a shadow toward it
    const d = Math.max(rpx(1), size*0.05*e.k1/100), [dx, dy] = along(e, d), a = e.k2/100;
    ctx.globalAlpha = a*0.85; ctx.fillStyle = '#ffffff'; ctx.fillText(str, x + dx, y + dy);
    ctx.globalAlpha = a*0.6;  ctx.fillStyle = '#000000'; ctx.fillText(str, x - dx*0.6, y - dy*0.6);
  },
  bevel(ctx, str, x, y, size, fill, e){
    // raised OUT of the page: lit toward the light, shadowed away, softened like a rounded edge
    const d = Math.max(rpx(1), size*0.06*e.k1/100), [dx, dy] = along(e, d), a = e.k2/100;
    ctx.globalAlpha = a*0.75; softText(ctx, str, x + dx, y + dy, d*0.35, '#000000');
    ctx.globalAlpha = a*0.9;  softText(ctx, str, x - dx, y - dy, d*0.35, '#ffffff');
  },
  chromatic(ctx, str, x, y, size, fill, e){
    // a true colour split, visible on light and dark pages alike
    const d = Math.max(rpx(1), size*0.06*e.k1/100), [dx, dy] = along(e, d);
    ctx.globalAlpha = e.k2/100;
    ctx.fillStyle = '#ff2a55'; ctx.fillText(str, x + dx, y + dy);
    ctx.fillStyle = '#1ab8ff'; ctx.fillText(str, x - dx, y - dy);
  },
  doublestrike(ctx, str, x, y, size, fill, e){
    // the typewriter's second, slightly misaligned strike, in the text's own ink
    const d = Math.max(rpx(1), size*0.05*e.k1/100), [dx, dy] = along(e, d);
    ctx.globalAlpha = (e.k2/100)*0.75; ctx.fillStyle = fill; ctx.fillText(str, x + dx, y + dy);
  },
};
/** The erosion in a stack (it changes how the glyphs themselves are filled). */
const erosionOf = fx => (fx || []).find(e => e && e.type === 'erosion');

/** Small deterministic generator, so erosion does not shift on repaint. */
function seededRand(seed){
  let t = seed >>> 0 || 1;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function hashText(str, x, y){
  let h = 2166136261;
  const key = str + '|' + Math.round(x) + '|' + Math.round(y);
  for(let i = 0; i < key.length; i++){ h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h;
}

/**
 * Worn type. The glyphs are drawn on their own small canvas, bites are cut
 * out of them there with destination-out, and the result is placed on the
 * page. Cutting on the page itself would punch holes straight through the
 * background as well. A gradient fill still lines up, because the offscreen
 * canvas is translated so its coordinates match the page's.
 */
function drawErodedText(ctx, str, px, py, fill, size, k){
  const w = Math.ceil(ctx.measureText(str).width);
  if(w <= 0) return;
  const pad = Math.ceil(size * 0.25);
  const h = Math.ceil(size * 1.45) + pad * 2;
  const off = scratchCanvas(w + pad * 2, h);
  const o = off.getContext('2d', { willReadFrequently: true });
  o.font = ctx.font;
  o.textBaseline = ctx.textBaseline;
  o.textAlign = 'left';
  o.translate(pad - px, pad - py);
  o.fillStyle = fill;
  o.fillText(str, px, py);
  o.setTransform(1, 0, 0, 1, 0, 0);

  const rand = seededRand(hashText(str, px, py));
  o.globalCompositeOperation = 'destination-out';
  const bites = Math.round((off.width * off.height) / 70 * k);
  o.beginPath();                       // every bite in ONE path, one fill (the same union, far fewer calls)
  for(let i = 0; i < bites; i++){
    const r = size * (0.008 + rand() * 0.03) * (0.6 + k);
    const bx = rand() * off.width, by = rand() * off.height;
    o.moveTo(bx + r, by); o.arc(bx, by, r, 0, Math.PI * 2);
  }
  o.fill();
  ctx.drawImage(off, px - pad, py - pad);
}

/** /arc and /wave: where a letter sits on its run's path. Given how far along the run (0 … its width) a letter's middle
 *  is, how far the letter moves and turns — so the letters follow a circle's arc (positive bows up, like a rainbow;
 *  negative sags, like a bowl; N is the degrees of circle the run spans) or a wave (amp a share of the size, so many
 *  cycles across the run). Neither changes the run's width, so fitting and alignment are as for a straight line. */
export function runShape(style, total, size){
  const arc = style.arc ? style.arc*Math.PI/180 : 0, wave = style.wave && style.wave.amp ? style.wave : null;
  if(!(total > 0) || (!arc && !wave)) return null;
  const R = arc ? total/arc : 0, A = wave ? wave.amp/100*size : 0, k = wave ? 2*Math.PI*wave.cycles/total : 0;
  // (the arc is hung about the line's own height: its middle rises half as far as its ends fall)
  const sag = arc ? R*(1 - Math.cos(arc/2))/2 : 0;
  return s => {
    let dx = 0, dy = 0, rot = 0; const m = s - total/2;
    if(arc){ const f = m/R; dx = R*Math.sin(f) - m; dy = R*(1 - Math.cos(f)) - sag; rot = f; }
    if(wave){ dy -= A*Math.sin(k*s); rot += Math.atan(-A*k*Math.cos(k*s)); }
    return { dx, dy, rot };
  };
}

function drawTextRun(ctx, segments, startX, cursorY, size, lineHeight, fontDef, style){
  const { baseFillStyle, accent1Color, accent2Color, quoteAlpha } = style;
  const fx = style.fx || [], erode = erosionOf(fx);

  const widths = segments.map(seg=>measureSegWidth(ctx, fontDef, seg, size, style.customTracking, style.smallCaps));
  const shape = runShape(style, widths.reduce((a, b) => a + b, 0), size);
  // a rule along the run (an underline, a strike, an /under: stitch), v below the letters' top: straight, or on the run's path
  const runPath = (x0, x1, v) => {
    if(!shape) return [[x0, cursorY + v], [x1, cursorY + v]];
    const n = Math.max(2, Math.ceil((x1 - x0)/(size*0.15))), a = v - size/2, pts = [];
    for(let j = 0; j <= n; j++){ const xx = x0 + (x1 - x0)*j/n, sh = shape(xx - startX);
      pts.push([xx + sh.dx - Math.sin(sh.rot)*a, cursorY + size/2 + sh.dy + Math.cos(sh.rot)*a]); }
    return pts;
  };
  let x = startX;
  let charSeed = 0; // advances across the whole run, not just per-segment, so jitter doesn't repeat identically at the start of every segment

  for(let i=0;i<segments.length;i++){
    const seg = segments[i];
    const w = widths[i];
    ctx.save();
    ctx.font = fontString(fontDef, seg, size);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = quoteAlpha*(style.opacity != null ? style.opacity : 1);
    if(style.blend) ctx.globalCompositeOperation = style.blend;

    let segFill = baseFillStyle;
    if(style.customGradientColors && style.customGradientColors.length>=2){
      const colors = style.customGradientColors;
      const g = ctx.createLinearGradient(x, cursorY, x+Math.max(w,1), cursorY);
      colors.forEach((c,idx)=>{ g.addColorStop(idx/(colors.length-1), c); });
      segFill = g;
    } else if(seg.color==='accent1') segFill = accent1Color;
    else if(seg.color==='accent2') segFill = accent2Color;
    else if(seg.color==='gradFwd' || seg.color==='gradRev'){
      const c1 = seg.color==='gradFwd' ? accent1Color : accent2Color;
      const c2 = seg.color==='gradFwd' ? accent2Color : accent1Color;
      const g = ctx.createLinearGradient(x, cursorY, x+Math.max(w,1), cursorY);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      segFill = g;
    } else if(seg.color==='lgAccent1' || seg.color==='rgAccent1' || seg.color==='lgAccent2' || seg.color==='rgAccent2'){
      const accentColor = (seg.color==='lgAccent1' || seg.color==='rgAccent1') ? accent1Color : accent2Color;
      const isLeftGrad = seg.color==='lgAccent1' || seg.color==='lgAccent2';
      const c1 = isLeftGrad ? style.plainTextColor : accentColor;
      const c2 = isLeftGrad ? accentColor : style.plainTextColor;
      const g = ctx.createLinearGradient(x, cursorY, x+Math.max(w,1), cursorY);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      segFill = g;
    }

    // (protecting the text: the color this segment is written in, across its width, faint as a quote is)
    if(PROBE_INKS){ const PW = ctx.canvas.width, sp = { x0: x/PW, x1: (x + Math.max(w, 1))/PW }, k = c => inkOf(c, quoteAlpha), c = seg.color;
      const ramp = style.customGradientColors && style.customGradientColors.length>=2 ? style.customGradientColors
        : c==='gradFwd' ? [accent1Color, accent2Color] : c==='gradRev' ? [accent2Color, accent1Color]
        : c==='lgAccent1' ? [style.plainTextColor, accent1Color] : c==='rgAccent1' ? [accent1Color, style.plainTextColor]
        : c==='lgAccent2' ? [style.plainTextColor, accent2Color] : c==='rgAccent2' ? [accent2Color, style.plainTextColor] : null;
      const solid = c==='accent1' ? accent1Color : c==='accent2' ? accent2Color : typeof baseFillStyle === 'string' ? baseFillStyle : null;
      PROBE_INKS.now.push(ramp ? { ...sp, ramp: ramp.map(k).filter(Boolean) } : solid ? { ...sp, inks: [k(solid)].filter(Boolean) } : { ...sp, page: true, alpha: quoteAlpha });
      PROBE_INKS.words += seg.text || ''; }

    const emojiTint = style.customGradientColors && style.customGradientColors.length>=2
      ? (m=>`rgb(${m.r},${m.g},${m.b})`)(mixHex(style.customGradientColors[0], style.customGradientColors[style.customGradientColors.length-1], 0.5))
      : (seg.color==='accent1') ? accent1Color
      : (seg.color==='accent2') ? accent2Color
      : (seg.color==='gradFwd' || seg.color==='gradRev' || seg.color==='lgAccent1' || seg.color==='rgAccent1' || seg.color==='lgAccent2' || seg.color==='rgAccent2')
        ? (seg.color==='lgAccent1' || seg.color==='rgAccent1' ? accent1Color : seg.color==='lgAccent2' || seg.color==='rgAccent2' ? accent2Color
          : (m=>`rgb(${m.r},${m.g},${m.b})`)(mixHex(accent1Color, accent2Color, 0.5)))
        : null;
    const hasEmoji = emojiTint && segmentHasEmoji(seg.text);

    // An explicit /track wins outright over the automatic no-italic-font
    // emphasis fallback (see emphasisTracking) -- same base magnitude
    // (size*0.14) either way, just scaled by the user's percentage instead
    // of the fixed 1x the fallback uses.
    const tracking = style.customTracking!=null ? size*0.14*(style.customTracking/100) : emphasisTracking(fontDef, seg, size);
    const jitterMag = style.customJitter!=null ? size*0.06*(style.customJitter/100) : 0;

    // glyphs draw with no leftover shadow: effects are their own passes
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;

    const needsPerChar = tracking !== 0 || hasEmoji || style.smallCaps || jitterMag > 0 || !!shape;

    if(!needsPerChar){
      drawEffects(ctx, seg.text, x, cursorY, size, segFill, fx);
      ctx.fillStyle = segFill;
      if(erode && erode.k1 > 0){
        drawErodedText(ctx, seg.text, x, cursorY, segFill, size, erode.k1/100);
      } else {
        ctx.fillText(seg.text, x, cursorY);
      }
      maskGlyphs(ctx, seg.text, x, cursorY);
    } else {
      const normalFont = ctx.font;
      const seed0 = charSeed;
      // Letter by letter, in TWO passes over the same positions: first every
      // glyph's effect and outline, then every glyph on top. Drawing each
      // letter's effect just before that letter let the NEXT letter's shadow
      // fall across the one before it — parts of the text looked as if the
      // effect had skipped them. Both passes replay the same jitter (charSeed
      // is rewound), so nothing moves.
      const walk = (draw) => {
        let cx = x; charSeed = seed0;
        for(const ch of seg.text){
          const isLower = style.smallCaps && ch !== ch.toUpperCase() && ch === ch.toLowerCase();
          const drawCh = isLower ? ch.toUpperCase() : ch;
          if(isLower) ctx.font = fontString(fontDef, seg, size*SMALL_CAP_RATIO);
          const chW = ctx.measureText(drawCh).width;
          // Biased hard toward vertical: sideways jitter mostly reads as bad
          // kerning, whereas vertical displacement reads as a shaking hand.
          const jx = jitterMag > 0 ? charJitterOffset(charSeed*12.9898) * jitterMag * 0.28 : 0;
          const jy = jitterMag > 0 ? charJitterOffset(charSeed*78.233 + 4.12) * jitterMag * 1.15 : 0;
          // Rotation scales with the jitter percentage but hard-stops at 12deg;
          // past that letters stop reading as letters.
          const maxRot = Math.min(12, 4 * ((style.customJitter || 0) / 100)) * Math.PI / 180;
          const rot = jitterMag > 0 ? charJitterOffset(charSeed*31.7 + 9.3) * maxRot : 0;
          // (on an /arc or a /wave, the letter moves onto the path and turns with it)
          const sh = shape ? shape(cx - startX + chW/2) : null;
          const gx = cx + jx + (sh ? sh.dx : 0);
          const py = cursorY + jy + (isLower ? size*(1-SMALL_CAP_RATIO) : 0) + (sh ? sh.dy : 0);
          const turn = rot + (sh ? sh.rot : 0);
          // Rotate ABOUT the glyph's centre while keeping absolute coordinates,
          // so a gradient fill (defined in absolute space) stays aligned.
          const rotating = turn !== 0;
          if(rotating){
            const rx = gx + chW/2, ry = py + size/2;
            ctx.save(); ctx.translate(rx, ry); ctx.rotate(turn); ctx.translate(-rx, -ry);
          }
          draw(ch, drawCh, gx, py);
          if(rotating) ctx.restore();
          if(isLower) ctx.font = normalFont;
          cx += chW + tracking;
          charSeed++;
        }
      };
      const isEmojiChar = ch => hasEmoji && isEmojiCodePoint(ch.codePointAt(0));
      // pass 1: effects and outlines, under the whole run
      walk((ch, drawCh, gx, gy) => {
        if(isEmojiChar(ch)) return;
        drawEffects(ctx, drawCh, gx, gy, size, segFill, fx);
      });
      // pass 2: the glyphs themselves, on top (a drop shadow belongs to the fill)
      walk((ch, drawCh, gx, gy) => {
        if(isEmojiChar(ch)){
          const tinted = tintedEmojiCanvas(ch, ctx.font, emojiTint, size);
          ctx.shadowColor='transparent'; ctx.shadowBlur=0;
          ctx.drawImage(tinted, gx, gy); maskImage(ctx, tinted, gx, gy);
          return;
        }
        ctx.fillStyle = segFill;
        if(erode && erode.k1 > 0){
          drawErodedText(ctx, drawCh, gx, gy, segFill, size, erode.k1/100);
        } else {
          ctx.fillText(drawCh, gx, gy);
        }
        maskGlyphs(ctx, drawCh, gx, gy);
      });
    }

    // (where its punctuation sits, for The Poem: across the segment as measured, on its arc or wave if it has one)
    if(PUNCT_NOW && /[^\p{L}\p{N}\s]/u.test(seg.text || '')) notePunct(ctx, seg.text, x, w, cursorY, size, shape ? (px => shape(px - startX)) : null);
    if(style.under){
      // an underline decoration (/under:…), drawn by the stitch library
      const u = style.under, wt = (u.weight || 100)/100;
      drawStitch(ctx, pathFromPoints(runPath(x, x + w, size*0.95), false), u.style,
        { period: size*0.38, amp: size*0.075, width: Math.max(rpx(1), size*0.04*wt),
          color: u.color || (typeof segFill === 'string' ? segFill : (style.plainTextColor || '#000')), side: 1 });
    }
    if(seg.underline || seg.strike){
      const pts = runPath(x, x + w, seg.underline ? size*0.92 : size*0.55);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for(let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.strokeStyle = segFill;
      ctx.lineWidth = Math.max(rpx(1), size*0.045);
      ctx.stroke();
    }

    ctx.restore();
    x += w;
  }
  return x;
}

/** A part drawn: its letters as drawTextRun draws them, turned by /rot about the part's middle, or — for /glass and
 *  /cut — as windows (drawWindowRun). `prep(c)` draws what goes under the letters (a code backdrop) and returns the
 *  style to draw them in. Returns where the run ends, as drawTextRun does (a turn moves no other part). */
function drawPartRun(ctx, part, x, y, w, size, lineHeight, fontDef, prep){
  const rot = part.customRotate ? part.customRotate*Math.PI/180 : 0;
  const turn = c => { if(!rot) return; const rx = x + w/2, ry = y + size*0.55; c.translate(rx, ry); c.rotate(rot); c.translate(-rx, -ry); };
  let end = x + w;
  ctx.save(); turn(ctx);
  try {
    const style = prep(ctx);
    // (a cut needs a surface to cut: with none on the page, the letters are plain ink — Ruby)
    if(part.glass || (part.cut && CUT_LIVE)){ ctx.restore(); ctx.save(); drawWindowRun(ctx, part, x, y, w, size, lineHeight, fontDef, style, rot, turn); }
    else end = drawTextRun(ctx, part.segments, x, y, size, lineHeight, fontDef, style);
  } finally { ctx.restore(); }
  return end;
}

/** GLASS AND CUT LETTERS. The letters, white, on a small layer the size of the run's reach; what shows in them is
 *  laid into that shape (source-in): for /glass, the page behind them as it is now, softened through the inset box's
 *  own glass (boxFx.js — frosted, or for glass:clear only bent) and lit; for /cut, the page as it was before the
 *  surfaces (kept as UNDER_CANVAS when the poem asks for it), so the letters are windows through the surface. Their
 *  edges are drawn inside them — a shadow thrown by the letters' outside: light along the top and shade along the
 *  bottom for glass, the surface's own edge for a cut — and the layer goes onto the page with the part's /op and
 *  /blend. Effects (/fx) are not drawn for windows; the letters still count for Blend with Text and Cut Out by Text. */
const WIN_LAYERS = [null, null, null];
function winLayer(i, w, h){
  const c = WIN_LAYERS[i] || (WIN_LAYERS[i] = document.createElement('canvas'));
  if(c.width !== w || c.height !== h){ c.width = w; c.height = h; }
  const x = c.getContext('2d', { willReadFrequently: true });
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetX = 0; x.shadowOffsetY = 0; x.clearRect(0, 0, w, h);
  return [c, x];
}
let UNDER_CANVAS = null, UNDER_NOW = false, CUT_LIVE = false;
function drawWindowRun(ctx, part, x, y, w, size, lineHeight, fontDef, style, rot, turn){
  const PW = ctx.canvas.width, PH = ctx.canvas.height;
  // the run's reach: its box, bowed by an arc, lifted by a wave, turned by /rot, and room for its edges
  const arcA = style.arc ? Math.min(Math.PI*1.9, Math.abs(style.arc)*Math.PI/180) : 0;
  const bend = (arcA ? (w/arcA)*(1 - Math.cos(arcA/2)) : 0) + (style.wave ? Math.abs(style.wave.amp)/100*size : 0);
  const bh0 = size*1.2 + 2*bend, cs = Math.abs(Math.cos(rot)), sn = Math.abs(Math.sin(rot));
  const hw = (cs*w + sn*bh0)/2 + size*0.4, hh = (sn*w + cs*bh0)/2 + size*0.4, cx = x + w/2, cy = y + size*0.55;
  const bx = Math.max(0, Math.floor(cx - hw)), by = Math.max(0, Math.floor(cy - hh));
  const bw = Math.min(PW, Math.ceil(cx + hw)) - bx, bh = Math.min(PH, Math.ceil(cy + hh)) - by;
  if(bw < 2 || bh < 2) return;
  // 1. the letters' shapes (no ink sampling for Protect the Text: what shows in them is the page itself)
  const [M, mx] = winLayer(0, bw, bh);
  mx.translate(-bx, -by); turn(mx);
  const keepMask = GLYPH_MASK, keepInks = PROBE_INKS; GLYPH_MASK = null; PROBE_INKS = null;
  try {
    drawTextRun(mx, part.segments, x, y, size, lineHeight, fontDef, { ...style, baseFillStyle: '#fff', accent1Color: '#fff', accent2Color: '#fff',
      plainTextColor: '#fff', customGradientColors: null, fx: [], under: style.under ? { ...style.under, color: '#fff' } : null, opacity: null, blend: null, quoteAlpha: 1 });
  } finally { GLYPH_MASK = keepMask; PROBE_INKS = keepInks; }
  mx.setTransform(1, 0, 0, 1, 0, 0);
  if(GLYPH_MASK){ GLYPH_MASK.save(); GLYPH_MASK.setTransform(1, 0, 0, 1, 0, 0); GLYPH_MASK.globalAlpha = style.quoteAlpha; GLYPH_MASK.drawImage(M, bx, by); GLYPH_MASK.restore(); }
  // 2. what shows through them
  const [L, lx] = winLayer(1, bw, bh), S = RENDER_SCALE, ink = typeof style.baseFillStyle === 'string' ? style.baseFillStyle : (style.plainTextColor || '#000');
  lx.drawImage(M, 0, 0); lx.globalCompositeOperation = 'source-in'; lx.imageSmoothingEnabled = true;
  if(part.cut) lx.drawImage(UNDER_NOW && UNDER_CANVAS ? UNDER_CANVAS : ctx.canvas, bx, by, bw, bh, 0, 0, bw, bh);
  else {
    // (its strength, 0–100: 50 is the glass as it first was; more frosts and tints it further)
    const g = part.glass, clear = g.kind === 'clear', k = Math.max(0, Math.min(2, (g.strength ?? 50)/50));
    const amt = Math.max(0, Math.min(1, (size*(clear ? 0.05 : 0.12)*k/S - 3)/57));
    const soft = boxGlass(ctx.canvas, { x: bx, y: by, w: bw, h: bh }, clear ? 'lens' : 'frost', clear ? Math.min(1, 0.35*k) : amt, clear ? 0.15 : 0.35, S, 11);
    lx.drawImage(soft || ctx.canvas, ...(soft ? [0, 0, soft.width, soft.height] : [bx, by, bw, bh]), 0, 0, bw, bh);
    // lit like frosted glass, and coloured: by its tint, or faintly by the ink the words would have had
    lx.globalCompositeOperation = 'source-atop';
    if(!clear && !g.tint){ lx.globalAlpha = Math.min(0.6, 0.16*k); lx.fillStyle = '#fff'; lx.fillRect(0, 0, bw, bh); }
    lx.globalAlpha = Math.min(0.85, (g.tint ? 0.34 : clear ? 0.12 : 0.22)*k); lx.fillStyle = g.tint || ink; lx.fillRect(0, 0, bw, bh); lx.globalAlpha = 1;
  }
  // 3. the edges, inside the letters: the letters' outside (a sheet with letter-shaped holes), its shadow thrown in
  const [O, ox] = winLayer(2, bw, bh), e = Math.max(S, size*0.028), blur = Math.max(S, size*0.035);
  ox.fillStyle = '#000'; ox.fillRect(0, 0, bw, bh); ox.globalCompositeOperation = 'destination-out'; ox.drawImage(M, 0, 0);
  const edge = (color, dx, dy, b) => { lx.save(); lx.globalCompositeOperation = 'source-atop'; lx.shadowColor = color; lx.shadowBlur = b;
    lx.shadowOffsetX = dx; lx.shadowOffsetY = dy; lx.globalAlpha = 1; lx.drawImage(O, -PW*4, 0); lx.restore(); };
  // (drawn far off the layer, its shadow brought back by the offset: only the shadow falls inside the letters)
  const off = PW*4;
  if(part.cut){ edge('rgba(0,0,0,0.55)', off + e, e, blur); edge('rgba(255,255,255,0.22)', off - e*0.6, -e*0.6, blur); }
  else { edge('rgba(255,255,255,0.75)', off + e, e, blur); edge('rgba(0,0,0,0.32)', off - e, -e, blur); }
  // 4. onto the page
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = (style.quoteAlpha || 1)*(style.opacity != null ? style.opacity : 1);
  if(style.blend) ctx.globalCompositeOperation = style.blend;
  ctx.drawImage(L, bx, by); ctx.restore();
}

// Computes a line's full width once, with measureSegWidth — the same measure
// the draw loop uses, including the tracking fallback that fonts without an
// italic use for emphasis. Fitting and drawing must measure identically, or
// the size is chosen for a width that isn't the one drawn.
// Shared between the measurement pass (below) and the draw loop -- both
// MUST agree on this, or a part's measured width (used for layout/alignment)
// and its actually-drawn size would disagree. Percentage-based: /scale:150
// means 150% of the line's own fitted size, not 150 absolute pixels.
function partSizeFor(part, size){
  return part.customSize!=null ? size * (part.customSize/100) : size;
}

function computeLineWidths(ctx, line, baseSize, fontDef){
  const size = baseSize*line.scale;
  if(line.parts){
    const partWidths = line.parts.map(part=>{
      const partFontDef = part.code ? CODE_FONT : (part.customFontIdx!=null && FONTS[part.customFontIdx]) ? FONTS[part.customFontIdx] : fontDef;
      const partSize = partSizeFor(part, size);
      let total = 0;
      for(const seg of part.segments) total += measureSegWidth(ctx, partFontDef, seg, partSize, part.customTracking, line.smallCaps);
      return total;
    });
    const flowingTotal = line.parts.reduce((sum,p,i)=>p.justify===null ? sum+partWidths[i] : sum, 0);
    return { total: partWidths.reduce((a,b)=>a+b,0), partWidths, flowingTotal };
  }
  let total = 0;
  for(const seg of line.segments) total += measureSegWidth(ctx, fontDef, seg, size, null, line.smallCaps);
  return { total, partWidths: null, flowingTotal: null };
}

// Returns { size, widths } -- widths is a Map from line -> the same shape
// computeLineWidths returns, measured at the winning size, so the draw pass
// can look these up instead of remeasuring everything from scratch a second
// time immediately after this function already measured it once.
function fitTextSize(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing, S = 1){
  // (S, this render's scale: the grid and the floor are in EXPORT pixels, so the preview picks the size the saved
  //  image will — Ruby: the text came out smaller in the saved image than in the preview)
  // The largest size, on the grid maxSizePx, maxSizePx-2, … (above 8), at
  // which every line fits — exactly what stepping down 2px at a time from the
  // top finds, but in ~3 measuring passes instead of dozens. Width grows in
  // proportion to size and height exactly so, so one measurement at the top
  // predicts the answer; the grid around the prediction is then checked with
  // real measurements (down while it doesn't fit, up while the next does,
  // peeking two further steps up in case rounding made fit non-monotonic).
  const minSize = 8*S, step = 2*S;
  const measureAt = size => {
    let maxLineWidth = 0, totalHeight = 0;
    const widths = new Map();
    for(const line of lines){
      if(line.isBlank){ totalHeight += size*0.55*spacing; continue; }
      const w = computeLineWidths(ctx, line, size, fontDef);
      totalHeight += size*line.scale*1.32*spacing*lineGapK(line) + lineBend(line, w.partWidths, size*line.scale);
      widths.set(line, w);
      if(w.total > maxLineWidth) maxLineWidth = w.total;
    }
    return { size, widths, fits: maxLineWidth <= maxWidth && totalHeight <= maxHeight, maxLineWidth, totalHeight };
  };
  const onGrid = s => { const k = (maxSizePx - s)/step; return s > minSize && s <= maxSizePx + 1e-9 && Math.abs(k - Math.round(k)) < 1e-6; };
  const top = measureAt(maxSizePx);
  if(top.fits || maxSizePx <= minSize){
    if(top.fits) return { size: top.size, widths: top.widths };
  } else {
    // predict, snapped down onto the grid
    const byW = top.maxLineWidth > 0 ? maxSizePx*maxWidth/top.maxLineWidth : maxSizePx;
    const byH = top.totalHeight > 0 ? maxSizePx*maxHeight/top.totalHeight : maxSizePx;
    let s = maxSizePx - step*Math.max(1, Math.ceil((maxSizePx - Math.min(byW, byH))/step - 1e-9));
    const tried = new Map([[maxSizePx, top]]);
    const at = size => { if(!tried.has(size)) tried.set(size, measureAt(size)); return tried.get(size); };
    // (each size on the grid by its step count from the top, so a fraction of a pixel never drifts it off the grid)
    const atK = k => maxSizePx - k*step;
    let k = Math.round((maxSizePx - s)/step);
    // down until it fits
    while(onGrid(atK(k)) && !at(atK(k)).fits) k++;
    s = atK(k);
    if(onGrid(s)){
      // up while a larger size on the grid fits (peeking two steps past a miss)
      for(;;){
        if(onGrid(atK(k - 1)) && at(atK(k - 1)).fits){ k -= 1; s = atK(k); continue; }
        if(onGrid(atK(k - 2)) && at(atK(k - 2)).fits){ k -= 2; s = atK(k); continue; }
        if(onGrid(atK(k - 3)) && at(atK(k - 3)).fits){ k -= 3; s = atK(k); continue; }
        break;
      }
      return { size: s, widths: at(s).widths };
    }
  }
  const widths = new Map();
  for(const line of lines){
    if(!line.isBlank) widths.set(line, computeLineWidths(ctx, line, minSize, fontDef));
  }
  return { size: minSize, widths };
}

// How much bigger the first letter of a #D (drop cap) line renders, as a
// multiple of that line's own font size. Shared between blockHeight (so the
// extra space actually gets reserved, and later lines don't overlap the big
// letter) and the actual draw code.
const DROP_CAP_SCALE = 2.2;

/** /gap:N — the room a line takes, grown (or, below 0, drawn in) by N% of its own height (100: a line's worth more). */
function lineGapK(line){ return line.gap != null ? Math.max(0.2, 1 + line.gap/100) : 1; }
/** How far a line's /arc or /wave carries its letters up and down, all told (partWidths: its parts' widths at `size`,
 *  the line's own size): room the line is given besides its height, half above it and half below. 0 for a straight line. */
function lineBend(line, partWidths, size){
  if(!line.parts || !partWidths) return 0;
  let b = 0;
  line.parts.forEach((p, i) => {
    const w = partWidths[i] || 0, ps = partSizeFor(p, size);
    let e = 0;
    if(p.customArc){ const a = Math.min(Math.PI*1.9, Math.abs(p.customArc)*Math.PI/180); e += (w/a)*(1 - Math.cos(a/2)); }
    if(p.customWave && p.customWave.amp) e += 2*Math.abs(p.customWave.amp)/100*ps;
    if(e > b) b = e;
  });
  return b;
}

function blockHeight(lines, size, spacing, widths){
  let total = 0;
  for(const line of lines){
    if(line.isBlank){ total += size*0.55*spacing; continue; }
    const lineOwnHeight = size*line.scale*1.32*spacing;
    total += (line.dropCap ? Math.max(lineOwnHeight, size*line.scale*DROP_CAP_SCALE*1.05) : lineOwnHeight) + lineOwnHeight*(lineGapK(line) - 1)
      + (widths && widths.get(line) ? lineBend(line, widths.get(line).partWidths, size*line.scale) : 0);
  }
  return total;
}

// ---------- color math for watermark ----------
export function hexToHsl(hex){
  hex = hex.replace('#','');
  const r=parseInt(hex.substr(0,2),16)/255, g=parseInt(hex.substr(2,2),16)/255, b=parseInt(hex.substr(4,2),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0, l=(max+min)/2;
  if(max!==min){
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return {h:h*360, s:s*100, l:l*100};
}
export function hslToHex(h,s,l){
  h=((h%360)+360)%360; s=Math.max(0,Math.min(100,s))/100; l=Math.max(0,Math.min(100,l))/100;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  const toHex = v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
  return '#'+toHex(r)+toHex(g)+toHex(b);
}

// A=accent1, B=accent2 directly. C/D are each accent's split-complement
// (base hue +150°) -- one of the two hues flanking the true complement
// (+180°), a standard, defensible choice when only one derived color is
// needed rather than the customary two.
function resolveRhymeColor(letter, accent1Color, accent2Color){
  if(letter==='A') return accent1Color;
  if(letter==='B') return accent2Color;
  if(letter==='C'){ const {h,s,l} = hexToHsl(accent1Color); return hslToHex(h+150, s, l); }
  if(letter==='D'){ const {h,s,l} = hexToHsl(accent2Color); return hslToHex(h+150, s, l); }
  return null;
}

// ---------- texture generation ----------
// buildLines/fitTextSize are pure functions of a small set of inputs, but
// were being called fresh on every single render() -- including renders
// triggered by things that can't possibly change their output, like
// dragging a border-thickness slider. Cache both, invalidated only when
// something that actually feeds them changes. (Module-level state, so it
// survives across render() calls -- that's the whole point.)
// inline glyphs on every canvas (idempotent: glyphs.js also installs itself)
if(typeof CanvasRenderingContext2D !== 'undefined') installInlineGlyphs(CanvasRenderingContext2D.prototype);
if(typeof OffscreenCanvasRenderingContext2D !== 'undefined') installInlineGlyphs(OffscreenCanvasRenderingContext2D.prototype);

/** The page's effect stack, from the three effect slots in the UI. */
function pageEffectStack(){
  const out = [];
  for(const i of [1, 2, 3]){
    const t = $('fx' + i + 'Type'); if(!t || !t.value || t.value === 'none') continue;
    const v = id => ($('fx' + i + id) || {}).value;
    out.push(makeEffect(t.value, v('Color'), v('K1'), v('K2'), v('Angle')));
  }
  return out;
}

// ---------- §Variables: what the poem can report about the page ----------
const optionText = id => {
  const el = $(id);
  if(!el) return '';
  const o = el.selectedOptions && el.selectedOptions[0];
  return (o && o.textContent) || el.value || '';
};
const ARROWS = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
function lightArrow(deg){
  // the direction the light TRAVELS, as the light pad draws it
  // (0 is a direction — straight down from above — not 'unset')
  const d = deg === '' || deg == null || !isFinite(+deg) ? 315 : +deg, a = (d - 90) * Math.PI / 180;
  const ang = Math.atan2(-Math.sin(a), -Math.cos(a));
  return ARROWS[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
}
/** The poem as the page draws it: its words, or none while the inscription's eye is shut (the words stay in the editor). */
export function poemSource(){ const eye = $('poemShown'); return eye && eye.checked === false ? '' : (($('poemText') || {}).value || ''); }
/** The poem with its §Variables filled in, as the page shows them (the alt text reads this). */
export function resolvedPoemText(){
  const cv = $('poemCanvas'), W = (cv && cv.width) || 3072, H = (cv && cv.height) || 3072;
  try { return $('poemText') ? resolvePmlVariables(poemSource(), pmlVarContext(W, H)) : null; } catch(e){ return null; }
}
function pmlVarContext(W, H){
  const on = !$('textureToggle') || $('textureToggle').checked;
  // the report tells of the surface on top, whichever one the layer bar shows (Two Surfaces): showing the
  // lower to change it never changes the page
  const src = SURFACE_SOURCE ? SURFACE_SOURCE() : null, waiting = src && src.editing === 'lower' && src.other ? src.other : null;
  const L = waiting || surfaceFromDom();
  const type = L.textureType || '';
  const caps = capsFor(type), defs = paramsFor(type) || [];
  const seed = parseInt(L.textureSeed, 10) || 0;
  const hex = n => String(L['textureTint' + n] || '');
  const hues = [];
  for(let i = 0; i < Math.min(6, caps.tints || 0); i++) hues.push({ label: (caps.tintLabels || [])[i] || (i ? 'Hue ' + (i + 1) : 'Hue'), hex: hex([1, 2, 9, 10, 11, 12][i]) });
  // the material hues and the fifth, when they are in use (not their "none")
  if(caps.material) [[3, 'Specular Hue'], [4, 'Shadow Hue']].forEach(([n, label]) => { if(hex(n) && hex(n).toUpperCase() !== '#FFFFFF') hues.push({ label, hex: hex(n) }); });
  const lit = caps.diffuse || caps.rig || type === 'athanor';
  if(lit && hex(6) && !/^#?FFFFFF([0-9a-f]{2})?$/i.test(hex(6)) && !/^#[0-9a-f]{6}00$/i.test(hex(6))) hues.push({ label: 'Main Light Hue', hex: hex(6) });
  // (the page's lights: the rim light while it is on, the Ambient Hue when it is set)
  if((caps.rig || type === 'athanor') && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex(7)) && !/^#[0-9a-f]{6}00$/i.test(hex(7))) hues.push({ label: 'Rim Light Hue', hex: hex(7) });
  if((caps.rig || type === 'athanor') && hex(8) && !/^#?FFFFFF([0-9a-f]{2})?$/i.test(hex(8)) && !/^#[0-9a-f]{6}00$/i.test(hex(8))) hues.push({ label: 'Ambient Hue', hex: hex(8) });
  if(caps.hue5 && hex(5) && hex(5).toUpperCase() !== caps.hue5.def.toUpperCase() && !/^#[0-9a-f]{6}00$/i.test(hex(5))) hues.push({ label: caps.hue5.label, hex: hex(5) });   // (fully transparent is none)
  const optionOf = (id, value) => { const el = $(id), o = el && el.querySelector ? el.querySelector(`option[value="${value}"]`) : null; return (o && o.textContent) || value || ''; };
  const tilt = +L.textureLightTilt;
  return {
    surfName: on ? (waiting ? (type === 'athanor' ? athanorTitleOf(L.forgeGraph) : optionOf('textureType', type)) : optionText('textureType')) : 'None',
    surfOff: !on,                                   // the surface's own lines step aside
    blendName: (waiting ? optionOf('textureBlend', L.textureBlend) : optionText('textureBlend')).replace(/\s*\(default\)\s*$/i, ''),
    // the arrow, and how high the light is when it isn't at the horizon
    lightArrow: caps.light ? lightArrow(L.textureLight)
      + (caps.dial ? ' (' + caps.dial.split(' ')[0].toLowerCase() + ')' : (tilt < 100 ? ' ' + Math.round(tilt) + '%' : '')) : 'n/a',
    seed,
    seedPhrase: seedPhrase(seed),
    // the reading (🜂 🜄 🜁 🜃) last applied to this surface, if any (appEvents marks it on its row, and keeps the waiting one's)
    reading: !on ? '' : waiting ? (src.otherReading || '') : ($('elementRow') && $('elementRow').dataset ? ($('elementRow').dataset.applied || '') : ''),
    // every knob the texture has, by its own label and readout (up to five)
    params: defs.map((d, i) => ({ label: d.label, value: waiting ? paramReadout(d, +L['texP' + (i + 1)]) : (($('texP' + (i + 1) + 'Val') || {}).textContent || '') })),
    opacity: Math.round(+L.textureOpacity || 0),
    hues,
    moonTonight: moonPhase(new Date()),
    moonSeed: moonForSeed(seed),
    spell: ($('activeSpell') && $('activeSpell').value) || '',
    spellName: (document.body && document.body.dataset && document.body.dataset.lookName) || '',
    font: optionText('fontFamily'),
    canvas: Math.round(W / RENDER_SCALE) + '×' + Math.round(H / RENDER_SCALE),   // the EXPORT size
    // the whole effect stack, compressed onto one line
    typeEffect: describeStack(pageEffectStack(), ($('underAll') && $('underAll').value) ? { style: $('underAll').value } : null),
    renderMs: Math.round(LAST_RENDER_MS),
    scale: RENDER_SCALE,
    profile: LAST_PROFILE,
    cacheMB: textureCacheMB().toFixed(1),
    fonts: fontsRequested(),
    blendOpacity: null,
  };
}

/** A font by its name: the family exactly (any case, spaces or none), then a family that starts with it, then a label
 *  that holds it ("Cinzel", "cormorant", "Bodoni"); -1 when none does. */
export function fontIndexByName(name){
  const k = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''), n = k(name);
  if(!n) return -1;
  let i = FONTS.findIndex(f => k(f.family) === n);
  if(i < 0) i = FONTS.findIndex(f => k(f.family).startsWith(n));
  if(i < 0) i = FONTS.findIndex(f => k(f.label).includes(n));
  return i;
}

let linesCacheKey = null;
let linesCacheValue = null;
function getCachedLines(rawText, accent1On, accent2On){
  const key = rawText + '\u0000' + accent1On + '\u0000' + accent2On;
  if(key === linesCacheKey) return linesCacheValue;
  linesCacheValue = buildLines(rawText, accent1On, accent2On);
  // (/font:Name — a face by its name, found among the page's fonts; an unknown name leaves the line's own)
  for(const ln of linesCacheValue) if(ln.parts) for(const pt of ln.parts) if(pt.customFontName && pt.customFontIdx == null){ const i = fontIndexByName(pt.customFontName); if(i >= 0) pt.customFontIdx = i; }
  linesCacheKey = key;
  return linesCacheValue;
}

let fitCacheKey = null;
let fitCacheValue = null;

/**
 * Throws away the measured text size and line breakdown.
 *
 * Needed once at boot: the first render happens with fallback metrics because
 * the webfonts have not arrived, and the fitted size is cached against a key
 * that does not mention which font actually painted. Without this the page
 * keeps that wrong size until the poem is edited — which is why the default
 * poem ran off the canvas until you touched it.
 */
export function invalidateTextMeasurements(){
  clearMeasureCache();                 // remembered widths were measured against the old font
  TINTED.clear();                      // and the tinted glyphs were drawn in it
  fitCacheKey = null;
  fitCacheValue = null;
  fitCacheLines = null;
  linesCacheKey = null;
  linesCacheValue = null;
}
let fitCacheLines = null;
function getCachedFit(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing, shapeKey, S = 1){
  // The key is the layout's SHAPE (shapeKey: the text with live numbers —
  // §RenderMs, §Profile, §CacheMB — by their shape, not their digits), so a
  // stat ticking over doesn't refit a page whose layout hasn't changed. With
  // no live numbers in the poem it is exactly linesCacheKey, as before.
  const key = [shapeKey != null ? shapeKey : linesCacheKey, fontDef.family, fontDef.weight, maxWidth, maxHeight, maxSizePx, spacing, S].join('|');
  if(key === fitCacheKey){
    if(fitCacheLines === lines) return fitCacheValue;
    // the same layout with live numbers changed: keep the size, measure these lines once
    const widths = new Map();
    for(const line of lines) if(!line.isBlank) widths.set(line, computeLineWidths(ctx, line, fitCacheValue.size, fontDef));
    fitCacheValue = { size: fitCacheValue.size, widths }; fitCacheLines = lines;
    return fitCacheValue;
  }
  fitCacheValue = fitTextSize(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing, S);
  fitCacheKey = key; fitCacheLines = lines;
  return fitCacheValue;
}

let LAST_RENDER_MS = 0, LAST_PROFILE = '';
// S: this render's scale against the canonical export canvas (texCore.js): the preview is drawn at the size it is
// shown, the saved image at 1. PAGE_SIZE is the export's own size, which the preview's rounding can't tell exactly
// (a surface laid out in whole cells counts them from it: textureGenerators `pageOf`).
let RENDER_SCALE = 1, PAGE_SIZE = null;
// THE SCENE'S CLOCK (the Moving Image's Time Passing): seconds since the film began, handed to a surface with a camera
// (the Ringworld's clouds drift, its stars wheel, its lights flicker); 0 at rest, so a still is as it always was
let SCENE_TIME = 0, SCENE_DT = 0;
export function setSceneTime(t, dt = 0){ SCENE_TIME = t > 0 && isFinite(t) ? t : 0; SCENE_DT = SCENE_TIME && dt > 0 ? dt : 0; }
// a texture finished in the worker: draw the page again
onTextureReady(() => scheduleRender());
export function setRenderScale(s, page){ RENDER_SCALE = (s > 0 && isFinite(s)) ? s : 1; if(page && page[0] > 0 && page[1] > 0) PAGE_SIZE = [Math.round(page[0]), Math.round(page[1])]; }
/** n canonical pixels at this render's scale — for code outside render()
 *  (the text effects) that can't see its S. Identical at S = 1. */
const rpx = n => n * RENDER_SCALE;
// A debug hook: lets the page-level scale audit (and, later, a switch that
// renders the preview full size for comparison) set S from outside.
if(typeof window !== 'undefined') window.vellumDebug = {
  setRenderScale: s => setRenderScale(s), renderScale: () => RENDER_SCALE, render: () => render(),
  textures: () => textureServiceInfo(),
  profile: () => LAST_PROFILE, renderMs: () => LAST_RENDER_MS,
};
// ---------- SURFACE LAYERS ----------
let SURFACE_SOURCE = null;
/** appEvents tells the renderer about the layer the controls are not showing: () → { editing, other, lowerOn }. */
export function setSurfaceSource(fn){ SURFACE_SOURCE = fn; }
/** Every blend a surface layer can take (Ruby): the canvas's own, and the ones mixed per pixel (boxFx.js). */
export const SURFACE_BLENDS = [...CANVAS_BLENDS, ...BOX_GPU_BLENDS];
/** The page's backdrop colors, as a surface made of them is told them: the color, or the gradient's stops. */
/**
 * THE INSET BOX'S PLACE (ROADMAP G5), for a graph that reads it: its line's middle as fractions of the page
 * ("x0,y0,x1,y1,corner,thickness", corner and thickness as fractions of the page's shorter side, three decimals),
 * or '' with the box off. The same reading the renderer draws the box by (offset, thickness, corners).
 */
export function boxNow(){
  if(!($('cardToggle') && $('cardToggle').checked)) return '';
  const n = (id, d) => { const el = $(id), v = el ? parseFloat(el.value) : NaN; return isNaN(v) ? d : v; };
  const page = PAGE_SIZE || [3072, 3072], Wc = page[0], Hc = page[1], m = Math.min(Wc, Hc);
  const thick = Math.max(1, n('cardThickness', n('borderThickness', 1))), off = Math.max(0, n('cardOffset', n('borderOffset', 0))), inset = off + thick/2;
  const rounded = $('cardRounded') ? $('cardRounded').checked : !!($('borderRounded') && $('borderRounded').checked);
  const corner = rounded ? Math.max(0, n('cardRadius', n('borderRadius', 0))) : 0, f = v => Math.round(v*1000)/1000;
  return [f(inset/Wc), f(inset/Hc), f(1 - inset/Wc), f(1 - inset/Hc), f(corner/m), f(thick/m)].join(',');
}
export function pageEnvNow(stops = parseInt(getActiveRadioValue('bgStopsGroup'), 10) || 2, bg1 = $('bgColor1Hex').value){
  return ($('bgGradientToggle').checked ? collectGradientColors(bg1, 'bgColor2Hex', 'bgColor3Hex', 'bgColor4Hex', stops) : [bg1]).join(',');
}
/** The surface the controls show, as a layer: the same keys a look saves. */
export function surfaceFromDom(){
  const v = id => { const el = $(id); return el ? el.value : undefined; }, chk = (id, d) => { const el = $(id); return el ? !!el.checked : d; };
  const b = $('textureBlend'), ds = (b && b.dataset) || {};
  const ground = ds.ground && ds.groundFor === b.value ? ds.ground : '';   // (appEvents keepGround)
  return { textureType: v('textureType'), texP1: v('texP1'), texP2: v('texP2'), texP3: v('texP3'), texP4: v('texP4'), texP5: v('texP5'), texP6: v('texP6'), texP7: v('texP7'), texP8: v('texP8'), texP9: v('texP9'), texP10: v('texP10'),
    textureOpacity: parseFloat(v('textureOpacity')), textureBlend: v('textureBlend'), textureLight: v('textureLight'),
    textureLightTilt: $('textureLightTilt') ? v('textureLightTilt') : '100',
    cameraTurn: v('cameraTurn'), cameraView: v('cameraView'), cameraZoom: v('cameraZoom'),
    textureTint1: v('textureTint1Hex'), textureTint2: v('textureTint2Hex'), textureTint3: v('textureTint3Hex'),
    textureTint4: v('textureTint4Hex'), textureTint5: v('textureTint5Hex'), textureTint6: v('textureTint6Hex'),
    // (a surface's third to sixth hues: ROADMAP L0)
    textureTint9: v('textureTint9Hex'), textureTint10: v('textureTint10Hex'), textureTint11: v('textureTint11Hex'), textureTint12: v('textureTint12Hex'),
    // the page's lights (ROADMAP C1, C2): the rim light, the light dial's second handle; the Ambient slider; their hues
    textureRim: v('textureRim'), textureRimTilt: v('textureRimTilt'), textureAmbient: v('textureAmbient'), textureTint7: v('textureTint7Hex'), textureTint8: v('textureTint8Hex'),
    textureSeedWords: v('textureSeedWords') || '', textureSeed: parseInt(v('textureSeedValue'), 10), forgeGraph: v('forgeGraph') || '',
    textureCurve1: v('textureCurve1') || '', textureCurve2: v('textureCurve2') || '',
    textureTextAware: chk('textureTextAware', true), textureTextBlend: chk('textureTextBlend', false), textureShapeAware: chk('textureShapeAware', false), textureTextCut: chk('textureTextCut', false), textureShapeStrength: parseFloat(v('textureShapeStrength') ?? 100),
    ...(ground ? { textureGround: ground } : {}) };
}
/** An Athanor surface's own sliders and hues, read from its graph (each layer may carry a different one):
 *  the highest slider it offers and how many hues. Remembered for the last graph asked about. */
let athanorShapeMemo = { graph: null, top: 0, tints: 0 };
/** An Athanor surface's line in the surface menu, from its own graph. */
export const athanorTitleOf = graph => { const n = athanorName(graph || ''); return n ? fill(CHOOSER.athanorNamed, n) : CHOOSER.athanorEmpty; };
function athanorShape(graph){
  if(athanorShapeMemo.graph !== graph){
    const knobs = athanorKnobs(graph), hues = athanorHues(graph);
    athanorShapeMemo = { graph, top: knobs.reduce((m, k) => Math.max(m, k.slot), 0), tints: hues.length ? Math.max(...hues.map(h => h.slot)) : 0 };
  }
  return athanorShapeMemo;
}
// (where a surface layer's texture is asked for: the service, or, looking ahead for a film, a list)
let SURFACE_REQUEST = requestTexture;
/**
 * THE FILM'S LOOK AHEAD (the Moving Image): the textures the page as it stands would ask for, at w×h, without drawing
 * anything: each { type, w, h, opts }, exactly as the frame's drawing will ask for them, so a film can have them made
 * ahead on spare workers and find them waiting.
 */
export function surfaceRequests(w, h){
  const asked = [], stub = { save(){}, restore(){}, drawImage(){}, canvas: { width: w, height: h } };
  if(!($('textureToggle') && $('textureToggle').checked)) return asked;
  const bgStopCount = parseInt(getActiveRadioValue('bgStopsGroup'), 10) || 2, bg1 = $('bgColor1Hex').value, env = () => pageEnvNow(bgStopCount, bg1);
  const src = SURFACE_SOURCE ? SURFACE_SOURCE() : null, dom = surfaceFromDom();
  const upper = !src || src.editing !== 'lower' ? dom : src.other, lower = src && src.lowerOn ? (src.editing === 'lower' ? dom : src.other) : null;
  SURFACE_REQUEST = (slot, type, W, H, opts) => { asked.push({ type, w: W, h: H, opts }); return null; };
  try { for(const [L, slot] of [[lower, 'base'], [upper, 'main']]) if(L && L.textureType) drawSurfaceLayer(stub, L, slot, { W: w, H: h, S: RENDER_SCALE, canvas: stub, clearing: 0, env }); }
  finally { SURFACE_REQUEST = requestTexture; }
  return asked;
}
/** One surface layer onto the page: its texture made (or found in the cache), cleared around the words, blended. */
function drawSurfaceLayer(ctx, L, slot, { W, H, S, canvas, clearing, env }){
  const type = L.textureType, caps = capsFor(type), defs = paramsFor(type);
  const num = x => { const n = parseFloat(x); return isNaN(n) ? null : n; };
  const opacity = Math.max(0, num(L.textureOpacity) ?? 0)/100;
  const chosen = L.textureBlend;
  const blend = SURFACE_BLENDS.includes(chosen) ? chosen : defaultBlendFor(type);
  // the ground the surface is made on: its blend's (a look from before every blend was offered may keep the
  // ground it was drawn on then, `textureGround`, until its blend is changed)
  const groundFor = SURFACE_BLENDS.includes(L.textureGround) ? L.textureGround : blend;
  const gpu = BOX_GPU_BLENDS.includes(blend);
  const light = caps.light ? (num(L.textureLight) || 0) : null;
  const lightTilt = caps.light ? (num(L.textureLightTilt) ?? 100) : 100;
  const shape = type === 'athanor' ? athanorShape(L.forgeGraph || '') : null;
  const tints = shape ? shape.tints : caps.tints;
  const tint = (n, on) => on ? (L['textureTint' + n] || null) : null;
  const tint1 = tint(1, tints >= 1), tint2 = tint(2, tints >= 2), tint3 = tint(3, caps.material), tint4 = tint(4, caps.material);
  // (its third to sixth hues, where it has them: ROADMAP L0)
  const hues = tints > 2 ? [9, 10, 11, 12].map((n, i) => tint(n, tints >= i + 3)) : undefined;
  // (the Main Light Hue: a surface's Diffuse Hue, or the page's light's colour where the page's lights reach it)
  const tint5 = tint(5, !!caps.hue5), tint6 = tint(6, !!caps.diffuse || !!caps.rig || type === 'athanor');
  // the page's lights: the rim light, the Ambient slider and hue (a surface they reach, or a graph)
  const lights = caps.rig || type === 'athanor' ? layerLights(L) : {};
  // the page's own colors: for a surface made of them (Rain on Glass, Circuit Board), or a graph with a Page Backdrop
  const envs = caps.pageEnv || (type === 'athanor' && graphUsesBackdrop(L.forgeGraph || '')) ? env() : undefined;
  const seed = parseInt(L.textureSeed, 10) || 0;
  const p1 = num(L.texP1), p2 = num(L.texP2), p3 = num(L.texP3);
  // knobs four to eight only where the surface has them (an Athanor surface: where its graph offers them)
  const has = i => (shape ? shape.top : defs.length) >= i;
  const p4 = has(4) ? num(L.texP4) : null, p5 = has(5) ? num(L.texP5) : null, p6 = has(6) ? num(L.texP6) : null, p7 = has(7) ? num(L.texP7) : null, p8 = has(8) ? num(L.texP8) : null, p9 = has(9) ? num(L.texP9) : null, p10 = has(10) ? num(L.texP10) : null;
  const accent1 = $('accent1ColorHex').value, accent2 = $('accent2ColorHex').value;
  // the camera dial's (a texture with a camera, or a graph with a Camera Dial; the request keys it only then)
  const camera = L.cameraTurn !== undefined ? { turn: +L.cameraTurn, view: +L.cameraView, zoom: +L.cameraZoom, ...(SCENE_TIME > 0 ? { time: SCENE_TIME, dt: SCENE_DT } : {}) } : undefined;
  const name = s => slot === 'main' ? s : 'base' + (s === 'main' ? '' : s);
  // a texture that can't be drawn is skipped, never allowed to abort the frame
  const put = t => { if(!t) return; try {
    const img = clearing > 0 ? clearedSurface(t, canvas.width, canvas.height, clearing) : t;
    if(gpu){   // the blends a canvas can't do, mixed per pixel at full size (the GPU when there is one)
      const m = boxBlend(ctx.canvas, { x: 0, y: 0, w: ctx.canvas.width, h: ctx.canvas.height }, img, { x: 0, y: 0, w: img.width, h: img.height }, blend, opacity, true);
      if(m){ ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(m, 0, 0, W, H); ctx.restore(); return; }
    }
    ctx.drawImage(img, 0, 0, W, H);
  } catch(err){ if(typeof console !== 'undefined') console.warn('texture skipped:', err && err.message); } };
  const layer = (gco, t) => { ctx.save(); ctx.globalAlpha = gpu ? 1 : opacity; ctx.globalCompositeOperation = gpu ? 'source-over' : gco; put(t); ctx.restore(); };
  // (Shape Strength, how strongly: `fill` and `around` are 0..1, 0 when off)
  const strength = Math.max(0, Math.min(1, (isFinite(+L.textureShapeStrength) ? +L.textureShapeStrength : 100)/100));
  if(type === 'astral'){
    // the light slot stays empty here; the nebula colour is a TINT
    layer(blend === 'lighten' ? 'overlay' : blend, SURFACE_REQUEST(name('fog'), 'astral_fog', W, H, { seed, p1: p2, p3, tint1: tint2, scale: S }));
    // (Shape Aware on the page: its stars fade round the words)
    const around = slot !== 'base' || !L.textureTextBlend ? (L.textureTextAware !== false && L.textureShapeAware ? strength : 0) : 0;
    layer(blend, SURFACE_REQUEST(name('stars'), 'astral_stars', W, H, { accent1, accent2, seed, p1, p3, tint1, tint5, scale: S, ...(around ? { around, text: TEXT_LAYOUT } : {}) }));   // (tint5: the airglow's own colour)
  } else if(type === 'embers' || type === 'magicparticles' || type === 'snow' || type === 'cards'){
    layer(blend, SURFACE_REQUEST(name('main'), type, W, H, { accent1, accent2, seed, p1, p2, p3, light, lightTilt, tint1, tint2, tint3, tint4, tint5, tint6, hues, env: envs, blend: groundFor, scale: S, p4, p5, p6, p7, p8, p9, p10, camera }));
  } else {
    // (an Athanor surface carries its graph: the worker makes it from that)
    const graph = type === 'athanor' ? (L.forgeGraph || '') : undefined;
    // (the poem's layout, only for a graph that asks for it, and only while the surface is Text Aware or fills the
    //  letters Shape Aware; `fill` tells it it is inside them)
    // (Shape Aware on a surface drawn on the page, `around`: it shapes itself round the words — keeps off them, flows round
    //  them — Ruby: "the option to make it avoid the text or highlight the text or interact with the text")
    // (`around` stays above 0 while Shape Aware is on, even at a Shape Strength of 0: The Poem keeps no margin then, where
    //  Shape Aware off leaves a graph its own)
    const filling = slot === 'base' && !!L.textureTextBlend && !!L.textureShapeAware, fill = filling ? strength : 0, aware = L.textureTextAware !== false;
    const around = !filling && aware && !!L.textureShapeAware ? Math.max(strength, 0.001) : 0;
    const text = ((graph && graphUsesPoem(graph)) || chainReadsPoem(type, fill || around)) && (aware || fill) ? TEXT_LAYOUT : undefined;
    // (the inset box's place, for a graph that reads it)
    const box = graph && graphUsesBox(graph) ? boxNow() : undefined;
    // (the curves drawn under Surface, for a graph with a Curve Control: '' is the control's own Default)
    const curves = graph && graphUsesCurves(graph) ? [L.textureCurve1 || '', L.textureCurve2 || ''] : undefined;
    layer(blend, SURFACE_REQUEST(name('main'), type, W, H, { seed, p1, p2, p3, light, lightTilt, tint1, tint2, tint3, tint4, tint5, tint6, hues, env: envs, blend: groundFor, scale: S, p4, p5, p6, p7, p8, p9, p10, camera, graph, text, box, curves, aware, fill, around, page: PAGE_SIZE, ...lights, ...(graph ? { accent1, accent2, ink: $('textColorHex').value } : {}) }));
  }
}

// §Profile: where the last render's time went, stage by stage
const clock = () => (typeof performance !== 'undefined' ? performance : Date).now();
function renderInto(canvas){
  const renderStart = clock();
  const laps = []; let lapAt = renderStart;
  const S = RENDER_SCALE;
  // (a texture from the texture service is drawn scaled to the page, since the one shown while a new one
  // is made may have been made at another preview size; drawSurfaceLayer skips one that can't be drawn:
  // a frame abandoned mid-blend once left two pages showing at once)
  const clearing = Math.max(0, Math.min(100, parseFloat(($('textureClearing') || {}).value) || 0))/100;
  const lap = name => { const t = clock(); laps.push(`${name} ${Math.round(t - lapAt)}`); lapAt = t; };
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  // Every frame starts from a clean slate — nothing a previous frame left set
  // (a blend, an opacity, a transform, a filter, unbalanced save()s) may leak in.
  if(typeof ctx.reset === 'function') ctx.reset();
  else {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if('filter' in ctx) ctx.filter = 'none';
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    if(ctx.setLineDash) ctx.setLineDash([]);
    ctx.clearRect(0, 0, W, H);
  }

  const currentAlign = getActiveRadioValue('alignGroup') || 'left';
  const currentValign = getActiveRadioValue('valignGroup') || 'center';
  const bgStopCount = parseInt(getActiveRadioValue('bgStopsGroup'), 10) || 2;
  const textStopCount = parseInt(getActiveRadioValue('textStopsGroup'), 10) || 2;

  const bg1 = $('bgColor1Hex').value;
  if($('bgGradientToggle').checked){
    const colors = collectGradientColors(bg1, 'bgColor2Hex', 'bgColor3Hex', 'bgColor4Hex', bgStopCount);
    paintGradient(ctx, 0, 0, W, H, gradientSpec('bg'), colors);
  } else {
    ctx.fillStyle = bg1;
    ctx.fillRect(0,0,W,H);
  }
  // (/cut letters are windows to the page under the surfaces: when the poem has one, the page is kept as it is now)
  UNDER_NOW = /\/cut(?![a-z0-9])/i.test(($('poemText') || {}).value || '');
  if(UNDER_NOW){ if(!UNDER_CANVAS) UNDER_CANVAS = document.createElement('canvas'); if(UNDER_CANVAS.width !== W || UNDER_CANVAS.height !== H){ UNDER_CANVAS.width = W; UNDER_CANVAS.height = H; }
    const ux = UNDER_CANVAS.getContext('2d', { willReadFrequently: true }); ux.globalCompositeOperation = 'copy'; ux.globalAlpha = 1; ux.drawImage(canvas, 0, 0); ux.globalCompositeOperation = 'source-over'; }

  let textFill = null, textCut = false, surfaced = false;
  // SURFACE LAYERS (Ruby: every control for both, any blend for each): the lower first, then the upper,
  // each drawn the same way from its settings. appEvents hands over the layer the controls are not
  // showing (setSurfaceSource); the one they show is read from the page.
  if($('textureToggle').checked){
    const env = () => pageEnvNow(bgStopCount, bg1);
    const src = SURFACE_SOURCE ? SURFACE_SOURCE() : null;
    const dom = surfaceFromDom();
    const upper = !src || src.editing !== 'lower' ? dom : src.other;
    const lower = src && src.lowerOn ? (src.editing === 'lower' ? dom : src.other) : null;
    for(const [L, slot] of [[lower, 'base'], [upper, 'main']]){
      if(!L || !L.textureType) continue;
      if(slot === 'base' && L.textureTextBlend){ textFill = { L, env }; continue; }   // (drawn into the letters, after them)
      // CUT OUT BY TEXT (Ruby: "should the words also be able to cut a surface out, so the page shows through the letters?
      // Yes"): the page as it is before the first such surface, kept, to be laid back inside the letters after them
      if(L.textureTextCut && !textCut){ textCut = true; if(!CUT_CANVAS) CUT_CANVAS = document.createElement('canvas'); CUT_CANVAS.width = W; CUT_CANVAS.height = H;
        const kx = CUT_CANVAS.getContext('2d', { willReadFrequently: true }); kx.globalCompositeOperation = 'source-over'; kx.globalAlpha = 1; kx.drawImage(canvas, 0, 0); }
      drawSurfaceLayer(ctx, L, slot, { W, H, S, canvas, clearing, env }); surfaced = true;
    }
  }
  CUT_LIVE = surfaced;

  // --- vignette (drawn here, before border/text, so it only affects the
  // background+texture layers underneath rather than the whole composed image) ---
  if($('vignetteToggle').checked){
    const intensity = Math.max(0, parseFloat($('vignetteIntensity').value) || 0) / 100;
    const blend = $('vignetteBlend').value;
    // aperture moves where the darkening BEGINS: low pulls it inward until
    // the whole page is falling off, high pushes it out to the corners only
    const aperture = Math.max(0, Math.min(100, parseFloat($('vignetteAperture').value) || 0)) / 100;
    // the center across the slider's whole range (−50 to 150: past the page's edge), and 0 is 0, not the middle
    const vcOf = id => { const v = parseFloat($(id).value); return Number.isFinite(v) ? Math.max(-50, Math.min(150, v)) : 50; };
    const vcx = W * vcOf('vignetteCx') / 100, vcy = H * vcOf('vignetteCy') / 100;
    const grit = Math.max(0, Math.min(100, parseFloat($('vignetteNoise').value) || 0)) / 100;
    // off-centre means one corner is further away than the others; reach to
    // the furthest so the falloff still covers the page
    const outerR = Math.max(
      Math.hypot(vcx, vcy), Math.hypot(W - vcx, vcy),
      Math.hypot(vcx, H - vcy), Math.hypot(W - vcx, H - vcy));
    const vgrad = ctx.createRadialGradient(vcx,vcy,outerR*aperture*0.9, vcx,vcy,outerR*1.02);
    // lighten/color-dodge are brightening blend modes — a black source is
    // mathematically a no-op for both (lighten never picks black over anything
    // brighter, and color-dodge's dst/(1-src) reduces to plain dst when src=0).
    // They need a white source to have any visible effect at all.
    const vignetteRGB = (blend === 'lighten' || blend === 'color-dodge') ? '255,255,255' : '0,0,0';
    vgrad.addColorStop(0, `rgba(${vignetteRGB},0)`);
    vgrad.addColorStop(1, `rgba(${vignetteRGB},${intensity})`);
    ctx.save();
    ctx.globalCompositeOperation = blend;
    ctx.fillStyle = vgrad;
    ctx.fillRect(0,0,W,H);
    // Grit breaks the smooth ramp: speckle weighted by the same falloff, so
    // it gathers where the vignette is strongest instead of dusting evenly.
    if(grit > 0){
      // counted over the EXPORT's area and sized in its pixels (rpx), so a preview is the saved image scaled down
      const dots = Math.round((W*H)/(RENDER_SCALE*RENDER_SCALE)/EFFECTS.gritDensity * grit);
      for(let i=0;i<dots;i++){
        const x = Math.random()*W, y = Math.random()*H;
        const d = Math.hypot(x-vcx, y-vcy) / outerR;
        if(d < aperture) continue;
        const falloff = Math.min(1, (d - aperture) / Math.max(0.05, 1 - aperture));
        ctx.globalAlpha = falloff * intensity * grit * (0.25 + Math.random()*0.55);
        ctx.fillStyle = vignetteRGB === '255,255,255' ? '#fff' : '#000';
        ctx.fillRect(x, y, rpx(1 + Math.random()*1.6), rpx(1 + Math.random()*1.6));
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  lap('backdrop+texture');
  // ---------- the inset box and the border ----------
  // The box sits ABOVE the backdrop, texture and vignette and BELOW the text,
  // so words stay readable over a busy surface. The border, when on, strokes
  // the box's edge; both share the offset and the rounded corners.
  // your border settings are canonical pixels: the same size on the page at any S
  const bThick = Math.max(rpx(1), (parseFloat($('borderThickness').value) || 1) * S);
  const bOffset = Math.max(0, parseFloat($('borderOffset').value) || 0) * S;
  const inset = bOffset + bThick/2;
  const frameCorner = ($('borderRounded') && $('borderRounded').checked) ? Math.max(0, parseFloat($('borderRadius').value) || 0) * S : 0;
  const framePath = () => { ctx.beginPath(); roundRectPath(ctx, inset, inset, W - inset*2, H - inset*2, frameCorner); };
  // The border's stitch, worked out once (the border draws it)
  const stitchSpec = { period: Math.max(rpx(6), bThick*6 + Math.min(W, H)*0.012), amp: Math.max(rpx(3), bThick*2 + Math.min(W, H)*0.004),
    width: bThick, side: ($('borderStitchOut') && $('borderStitchOut').checked) ? -1 : 1 };
  const framePoints = () => roundRectPoints(inset, inset, W - inset*2, H - inset*2, frameCorner);

  // THE INSET BOX has a shape of its own — offset, thickness, corners and a
  // stitch — linked to the border's by default (Inset Box card): the stitch
  // CUTS the box (stitches.js: every motif's silhouette), so a scalloped
  // border makes a scalloped box, beads bite it, and with the border off the
  // box still keeps the shape. Old looks, without these, take the border's.
  const cNum = (id, d) => { const el = $(id), v = el ? parseFloat(el.value) : NaN; return isNaN(v) ? d : v; };
  const cThick = Math.max(rpx(1), cNum('cardThickness', parseFloat($('borderThickness').value) || 1) * S);
  const cOffset = Math.max(0, cNum('cardOffset', parseFloat($('borderOffset').value) || 0)) * S;
  const cInset = cOffset + cThick/2;
  const cRounded = $('cardRounded') ? $('cardRounded').checked : !!($('borderRounded') && $('borderRounded').checked);
  const cCorner = cRounded ? Math.max(0, cNum('cardRadius', parseFloat(($('borderRadius') || {}).value) || 0)) * S : 0;
  const cStitch = ($('cardStitch') && $('cardStitch').value) || 'solid';
  const cSpec = { period: Math.max(rpx(6), cThick*6 + Math.min(W, H)*0.012), amp: Math.max(rpx(3), cThick*2 + Math.min(W, H)*0.004),
    width: cThick, side: ($('cardStitchOut') && $('cardStitchOut').checked) ? -1 : 1 };
  const cardOn = !!($('cardToggle') && $('cardToggle').checked);

  if(cardOn){
    const edge = cStitch !== 'solid' ? stitchInnerEdge(pathFromPoints(roundRectPoints(cInset, cInset, W - cInset*2, H - cInset*2, cCorner), true), cStitch, cSpec) : null;
    const cardShape = (c) => { c.beginPath();
      if(edge){ edge.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
      else roundRectPath(c, cInset, cInset, W - cInset*2, H - cInset*2, cCorner); };
    // the box's rectangle on the page (the glass and the GPU blends work on it)
    let bx0 = cInset, by0 = cInset, bx1 = W - cInset, by1 = H - cInset;
    if(edge){ bx0 = by0 = Infinity; bx1 = by1 = -Infinity; for(const p of edge){ bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); } }
    bx0 = Math.max(0, Math.floor(bx0)); by0 = Math.max(0, Math.floor(by0)); bx1 = Math.min(W, Math.ceil(bx1)); by1 = Math.min(H, Math.ceil(by1));
    const boxR = { x: bx0, y: by0, w: Math.max(0, bx1 - bx0), h: Math.max(0, by1 - by0) };

    // GLASS first: what lies behind the box, seen through it (boxFx.js — the
    // GPU when there is one), inside the box's shape
    const glassMode = ($('cardFx') && $('cardFx').value) || 'none';
    if(glassMode !== 'none' && boxR.w > 2 && boxR.h > 2){
      const g = boxGlass(ctx.canvas, boxR, glassMode, cNum('cardFxAmount', 50)/100, cNum('cardFxScale', 50)/100, S, 7);
      if(g){ ctx.save(); cardShape(ctx); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(g, boxR.x, boxR.y, boxR.w, boxR.h); ctx.restore(); }
    }

    // The box is painted on its OWN layer first, then placed on the page with
    // its blend — the same route textures take. Filling it straight through a
    // rounded clip while blending (Hard Light, Darken…) made phone GPUs copy
    // the whole 3072px page to blend against, and under memory pressure Chrome
    // silently skipped the drawing: the box "sometimes didn't appear". The
    // layer is half resolution (a soft gradient loses nothing) and reused.
    const L = cardLayer(Math.ceil(W/2), Math.ceil(H/2)), lx = L.getContext('2d', { willReadFrequently: true });
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, L.width, L.height);
    lx.save();
    lx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    cardShape(lx);
    lx.clip();
    const c1 = $('cardColor1Hex').value;
    if($('cardGradientToggle').checked) paintGradient(lx, boxR.x, boxR.y, boxR.w, boxR.h, gradientSpec('card'), [c1, $('cardColor2Hex').value]);
    else { lx.fillStyle = c1; lx.fillRect(0, 0, W, H); }
    lx.restore();
    const cardAlpha = Math.max(0, Math.min(100, parseFloat($('cardOpacity').value) || 0)) / 100;
    const cardBlendMode = $('cardBlend').value || 'source-over';
    // the blends a canvas can't do (Vivid Light, Linear Light…) are mixed per
    // pixel, on the GPU when it can
    const mixed = BOX_GPU_BLENDS.includes(cardBlendMode) && boxR.w > 2 && boxR.h > 2
      ? boxBlend(ctx.canvas, boxR, L, { x: boxR.x/2, y: boxR.y/2, w: boxR.w/2, h: boxR.h/2 }, cardBlendMode, cardAlpha) : null;
    ctx.save();
    if(mixed){ cardShape(ctx); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(mixed, boxR.x, boxR.y, boxR.w, boxR.h); }
    else {
      ctx.globalAlpha = cardAlpha;
      ctx.globalCompositeOperation = BOX_GPU_BLENDS.includes(cardBlendMode) ? 'source-over' : cardBlendMode;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(L, 0, 0, W, H);
    }
    ctx.restore();
  }

  if($('borderToggle').checked){
    const bColor = $('borderColorHex').value;
    const bloom = Math.max(0, Math.min(100, parseFloat($('borderBloom').value) || 0)) / 100;
    const grain = Math.max(0, Math.min(100, parseFloat(($('borderGrain') || {}).value) || 0)) / 100;

    let stroke = bColor;
    if($('borderGradientToggle').checked){
      // along an angle across the whole page (45°, the default, is corner to
      // corner), so each side of the frame passes through the stops
      // (0° is an angle like any other: straight across. It once fell back to 45°, as if unset.)
      const gv = parseFloat(($('borderGradientAngle') || {}).value), ga = (isFinite(gv) ? gv : 45) * Math.PI/180, half = Math.hypot(W, H)/2;
      const g = ctx.createLinearGradient(W/2 - Math.cos(ga)*half, H/2 - Math.sin(ga)*half, W/2 + Math.cos(ga)*half, H/2 + Math.sin(ga)*half);
      const stops = [bColor, $('borderColor2Hex').value, $('borderColor3Hex').value].filter(Boolean);
      stops.forEach((col, i) => g.addColorStop(stops.length > 1 ? i/(stops.length-1) : 0, col));
      stroke = g;
    }

    // The bloom glows in the border's own colour, on a layer of its own, and
    // the grain works INSIDE that layer: dark specks thin the glow, bright
    // specks catch the light (blurred, so they glow too). The layer is then laid
    // under the border, which stays a solid line. Grain never touches the page
    // or the line itself. The glow is soft, so its layer is half resolution,
    // reused from render to render.
    if(bloom > 0){
      const L = bloomLayer(Math.ceil(W/2), Math.ceil(H/2)), lx = L.getContext('2d', { willReadFrequently: true });
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, L.width, L.height);
      lx.setTransform(0.5, 0, 0, 0.5, 0, 0);
      lx.lineJoin = 'round';
      const passes = EFFECTS.bloomPasses;
      for(let i = passes; i >= 1; i--){
        lx.globalAlpha = Math.min(1, (bloom * EFFECTS.bloomAlpha * 1.6) / i);
        // wider: grows with the page as well as the stroke, so a thin border can still glow far
        lx.lineWidth = bThick * (1 + i * EFFECTS.bloomSpread * bloom) + i * Math.min(W, H) * 0.007 * bloom;
        lx.strokeStyle = stroke;
        lx.beginPath(); roundRectPath(lx, inset, inset, W - inset*2, H - inset*2, frameCorner); lx.stroke();
      }
      lx.globalAlpha = 1;
      if(grain > 0 && typeof lx.createPattern === 'function'){
        const tiles = grainTiles();
        lx.setTransform(1, 0, 0, 1, 0, 0);
        lx.globalAlpha = grain;
        lx.globalCompositeOperation = 'destination-out';            // dark specks: gaps in the glow
        const grainPattern = tile => { const pt = lx.createPattern(tile, 'repeat');
          // the speckle tile is canonical pixels: scaled with S, untouched at 1
          if(S !== 1 && pt && pt.setTransform && typeof DOMMatrix !== 'undefined') pt.setTransform(new DOMMatrix([S, 0, 0, S, 0, 0]));
          return pt; };
        lx.fillStyle = grainPattern(tiles.dark); lx.fillRect(0, 0, L.width, L.height);
        lx.globalCompositeOperation = 'source-atop';                // bright specks: only where glow is
        lx.filter = `blur(${Math.max(rpx(0.5), bThick*bloom*0.18).toFixed(1)}px)`;
        lx.fillStyle = grainPattern(tiles.bright); lx.fillRect(0, 0, L.width, L.height);
        lx.filter = 'none';
        lx.globalCompositeOperation = 'source-over'; lx.globalAlpha = 1;
      }
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = ($('borderBloomBlend') || {}).value || 'source-over';
      ctx.drawImage(L, 0, 0, W, H);
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = ($('borderBlend') || {}).value || 'source-over';
    ctx.lineWidth = bThick;
    ctx.strokeStyle = stroke;
    const stitch = ($('borderStitch') || {}).value || 'solid';
    if(stitch === 'solid'){ framePath(); ctx.stroke(); }
    else {
      // a decorative stitch around the frame (stitches.js), inward unless
      // asked to point out; its size follows the border's thickness
      drawStitch(ctx, pathFromPoints(framePoints(), true), stitch, { ...stitchSpec, color: stroke });
    }
    ctx.restore();
  }

  // --- text prep ---
  const accent1On = $('accent1Toggle').checked;
  const accent2On = $('accent2Toggle').checked;
  const accent1Color = $('accent1ColorHex').value;
  const accent2Color = $('accent2ColorHex').value;

  // §Variables resolve first, to plain text and PML, before the parser sees
  // the poem; the resolved text keys the line cache, so a changed value
  // re-lays the poem
  const varCtx = pmlVarContext(W, H);
  const rawText = resolvePmlVariables(poemSource(), varCtx);
  // the same text with live numbers by their shape (digits as 0): the fit's key
  const shapeOf = v => String(v).replace(/\d/g, '0');
  const shapeText = resolvePmlVariables(poemSource(), { ...varCtx, renderMs: shapeOf(varCtx.renderMs), profile: shapeOf(varCtx.profile), cacheMB: shapeOf(varCtx.cacheMB) });
  const lines = getCachedLines(rawText, accent1On, accent2On);

  const fontDef = FONTS[$('fontFamily').value];
  // fetch only the faces this page uses; when one arrives, re-measure and redraw
  {
    const used = [fontDef, CODE_FONT];
    for(const ln of lines) if(ln.parts) for(const pt of ln.parts) if(pt.customFontIdx != null && FONTS[pt.customFontIdx]) used.push(FONTS[pt.customFontIdx]);
    ensureFonts(used, () => { invalidateTextMeasurements(); scheduleRender(); });
  }
  // (Max Text Size is in the saved image's pixels, like the border's: at this render's scale here)
  const maxSizePx = Math.max(10, parseFloat($('maxSize').value) || 120)*S;
  const lineSpacing = Math.pow(2, parseFloat($('lineSpacing').value) || 0);

  lap('frame');
  // Text keeps clear of the frame: with a border or box on, the margins grow
  // to the frame's inner edge plus breathing room, instead of a fixed share of
  // the page that a wide offset or thick border would overrun.
  // TEXT MARGINS scales the room that is a matter of taste — the page-share
  // margins and the breathing room inside a frame — never the frame itself,
  // so text can come close to a border but not cross it. 100% is as it was.
  const marginK = Math.max(0.2, Math.min(1.5, (parseFloat(($('textMargin') || {}).value) || 100)/100));
  const frameOn = $('borderToggle').checked || cardOn;
  // the innermost of the border and the box (each has its own offset now)
  const frameIn = Math.max($('borderToggle').checked ? bOffset + bThick : 0, cardOn ? cOffset + cThick : 0);
  const frameEdge = frameOn ? frameIn + Math.min(W, H)*0.04*marginK : 0;
  const paddingX = Math.max(W*0.09*marginK, frameEdge);
  const paddingY = Math.max(H*0.07*marginK, frameEdge);
  const maxWidth = W - paddingX*2;
  const maxHeight = H - paddingY*2;

  const shapeKey = (linesCacheKey && linesCacheKey.startsWith(rawText)) ? shapeText + linesCacheKey.slice(rawText.length) : null;
  const { size: baseSize, widths: fitWidths } = getCachedFit(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, lineSpacing, shapeKey, S);
  const totalHeight = blockHeight(lines, baseSize, lineSpacing, fitWidths);

  let startY;
  if(currentValign==='top') startY = paddingY;
  else if(currentValign==='bottom') startY = paddingY + (maxHeight - totalHeight);
  else startY = paddingY + (maxHeight - totalHeight)/2;
  startY = Math.max(paddingY, startY);

  let baseFillStyle;
  if($('textGradientToggle').checked){
    const textColors = collectGradientColors($('textColorHex').value, 'textColor2Hex', 'textColor3Hex', 'textColor4Hex', textStopCount);
    baseFillStyle = makeGradient(ctx, W, H, parseFloat($('textGradientAngle').value), textColors, ($('textGradientType') || {}).value || 'linear');
  } else {
    baseFillStyle = $('textColorHex').value;
  }

  // the page's effect stack, from the three effect slots (effects.js)
  const pageFx = pageEffectStack();
  const pageUnder = ($('underAll') && $('underAll').value) ? { style: $('underAll').value, color: null, weight: 100 } : null;

  // asked to protect the text: keep the ground, small, before the words are drawn on it
  if(GROUND_PROBE && GROUND_PROBE.ask){ const gw = READABLE.probeWidth, gh = Math.max(8, Math.round(gw*H/W));
    if(!PROBE_LAYER) PROBE_LAYER = document.createElement('canvas');
    PROBE_LAYER.width = gw; PROBE_LAYER.height = gh;
    const px = PROBE_LAYER.getContext('2d', { willReadFrequently: true });
    px.imageSmoothingEnabled = true; px.drawImage(canvas, 0, 0, gw, gh);
    // (a text gradient is laid across the page: the ink at each point is read from the gradient drawn as small)
    let inkField = null;
    if(typeof baseFillStyle !== 'string'){ if(!PROBE_INK_LAYER) PROBE_INK_LAYER = document.createElement('canvas');
      PROBE_INK_LAYER.width = gw; PROBE_INK_LAYER.height = gh;
      const ix = PROBE_INK_LAYER.getContext('2d', { willReadFrequently: true });
      ix.setTransform(gw/W, 0, 0, gh/H, 0, 0); ix.fillStyle = baseFillStyle; ix.fillRect(0, 0, W, H); ix.setTransform(1, 0, 0, 1, 0, 0);
      inkField = ix.getImageData(0, 0, gw, gh).data; }
    GROUND_PROBE.ground = { data: px.getImageData(0, 0, gw, gh).data, gw, gh, runs: [], inkField };
    PROBE_INKS = { now: [], words: '' }; }
  let cursorY = startY;
  ctx.textBaseline = 'top';
  // (Blend with Text, Cut Out by Text: the letters' shapes gathered as they are drawn)
  if(textFill || textCut){ if(!GLYPH_CANVAS) GLYPH_CANVAS = document.createElement('canvas'); GLYPH_CANVAS.width = W; GLYPH_CANVAS.height = H;
    GLYPH_MASK = GLYPH_CANVAS.getContext('2d', { willReadFrequently: true }); GLYPH_MASK.clearRect(0, 0, W, H); }
  // where the words land, for the next frame's surfaces (see TEXT_LAYOUT)
  const textRuns = []; let lineNo = 0, stanza = 0, inStanza = false, rhyme = 0; PUNCT_NOW = [];
  const rec = (x0, x1, top, h) => { if(!(x1 > x0) || !(h > 0)) return; textRuns.push([x0/W, top/H, x1/W, (top + h)/H, lineNo, stanza, rhyme].map((v, i) => i < 4 ? Math.round(v*10000)/10000 : v).join(','));
    if(PROBE_INKS){ GROUND_PROBE.ground.runs.push({ box: [x0/W, top/H, x1/W, (top + h)/H], line: lineNo, spans: PROBE_INKS.now, words: PROBE_INKS.words.replace(/\s+/g, ' ').trim() }); PROBE_INKS.now = []; PROBE_INKS.words = ''; } };

  // the effect stack and underline the page gives every run (a segment may replace them)
  const runStyle = { fx: pageFx, under: pageUnder, baseFillStyle, plainTextColor: $('textColorHex').value,
    accent1Color, accent2Color, quoteAlpha: 1 };

  for(const line of lines){
    if(line.isBlank){ if(inStanza){ stanza++; inStanza = false; } } else { if(textRuns.length) lineNo++; inStanza = true; }
    // (a line's rhyme letter, ~A → 1: the 7th number of its runs, for The Poem's Rhymes)
    rhyme = !line.isBlank && line.rhymeLetter ? Math.max(0, String(line.rhymeLetter).toUpperCase().charCodeAt(0) - 64) : 0;
    if(line.isBlank){
      if(line.rule){
        // a horizontal rule, centred in the blank line's height; its width is a
        // share of the text block, aligned within it
        const r = line.rule, gap = baseSize*0.55*lineSpacing;
        const w = maxWidth * r.width;
        const x0 = r.align === 'l' ? paddingX : r.align === 'r' ? paddingX + maxWidth - w : paddingX + (maxWidth - w)/2;
        ctx.save();
        ctx.strokeStyle = r.customColor || (r.color === 'accent1' ? accent1Color : r.color === 'accent2' ? accent2Color
                        : (typeof baseFillStyle === 'string' ? baseFillStyle : $('textColorHex').value));
        ctx.lineWidth = Math.max(rpx(1), baseSize*0.045*((r.weight || 100)/100)); ctx.lineCap = 'round';
        if(!r.style || r.style === 'solid'){
          ctx.beginPath(); ctx.moveTo(x0, cursorY + gap/2); ctx.lineTo(x0 + w, cursorY + gap/2); ctx.stroke();
        } else {
          // a decorative stitch along the rule, pointing in or out
          const sz = (r.size || 100)/100, wt = (r.weight || 100)/100;
          drawStitch(ctx, pathFromPoints([[x0, cursorY + gap/2], [x0 + w, cursorY + gap/2]], false), r.style,
            { period: baseSize*0.55*sz, amp: baseSize*0.2*sz, width: Math.max(rpx(1), baseSize*0.045*wt), color: ctx.strokeStyle, side: r.side || 1 });
        }
        ctx.restore();
      }
      cursorY += baseSize*0.55*lineSpacing; continue;
    }
    const size = baseSize*line.scale;
    const lineHeight = size*1.32*lineSpacing;
    const style = { ...runStyle, quoteAlpha: line.type==='quote' ? 0.68 : 1, smallCaps: !!line.smallCaps };

    const drawRhymeMarker = (afterX) => {
      if(!line.rhymeLetter) return;
      const rhymeColor = resolveRhymeColor(line.rhymeLetter, accent1Color, accent2Color);
      const barWidth = Math.max(2, size*0.06);
      const barGap = size*0.35;
      ctx.fillStyle = rhymeColor;
      ctx.fillRect(afterX + barGap, cursorY + size*0.05, barWidth, lineHeight*0.85);
    };

    if(line.parts){
      const cached = fitWidths.get(line);
      const partWidthMap = new Map(line.parts.map((p,i)=>[p, cached.partWidths[i]]));
      // (a line on an arc or a wave is given room for it: half above, and half below, after it's drawn)
      const bend = lineBend(line, cached.partWidths, size);
      cursorY += bend/2;
      const flowingParts = line.parts.filter(p=>p.justify===null);
      const anchoredParts = line.parts.filter(p=>p.justify!==null);

      const partFont = p => p.code ? CODE_FONT : (p.customFontIdx!=null && FONTS[p.customFontIdx]) ? FONTS[p.customFontIdx] : fontDef;

      // Scaling stays visually centered by default: a bigger/smaller part's
      // draw position is nudged by half its size delta from the line's own
      // size, so it grows/shrinks symmetrically rather than only downward
      // from a shared top edge (textBaseline is 'top' throughout). An
      // explicit /basis then adds a further, deliberate raise/lower on top,
      // computed as a percentage of THIS part's own final (post-scale) size
      // -- so a raised, scaled-up word raises by a proportionally sensible
      // amount rather than a fixed amount that would look tiny or huge
      // relative to its own size.
      const partCursorY = (part, partSize) => {
        const centering = -(partSize - size) / 2;
        const basis = part.customBasis!=null ? -(part.customBasis/100) * partSize : 0;
        return cursorY + centering + basis;
      };

      // Flowing parts render as one continuous sequence, positioned as a whole
      // block using the line's own alignment — this is what makes "plain text
      // <right side/r>" read as normal flowing text plus one anchored chunk,
      // rather than every plain segment being independently pinned to the
      // left margin.
      const flowingTotalWidth = cached.flowingTotal;
      const lineAlign = line.alignOverride || currentAlign;
      let flowX = lineAlign==='center' ? (W/2 - flowingTotalWidth/2)
        : lineAlign==='right' ? (W - paddingX - flowingTotalWidth)
        : paddingX;

      if(line.type==='quote'){
        const barWidth = Math.max(2, size*0.06);
        const barGap = size*0.35;
        ctx.fillStyle = accent1On ? accent1Color : baseFillStyle;
        ctx.fillRect(flowX - barGap - barWidth, cursorY + size*0.05, barWidth, lineHeight*0.85);
      }

      for(const part of flowingParts){
        const partSize = partSizeFor(part, size), pY = partCursorY(part, partSize), pW = partWidthMap.get(part), at = flowX;
        flowX = drawPartRun(ctx, part, at, pY, pW, partSize, lineHeight, partFont(part), c => {
          const pStyle = resolvePartStyle(part, style);
          return part.code ? drawCodeBackdrop(c, at, pY, pW, partSize, pStyle) : pStyle; });
      }

      drawRhymeMarker(flowX);
      { const fx0 = lineAlign==='center' ? (W/2 - flowingTotalWidth/2) : lineAlign==='right' ? (W - paddingX - flowingTotalWidth) : paddingX; rec(fx0, flowX, cursorY, size*1.15); }

      for(const part of anchoredParts){
        const partSize = partSizeFor(part, size);
        const pWidth = partWidthMap.get(part);
        const pX = part.justify==='center' ? (W/2 - pWidth/2)
          : part.justify==='right' ? (W - paddingX - pWidth)
          : paddingX;
        const pY = partCursorY(part, partSize);
        drawPartRun(ctx, part, pX, pY, pWidth, partSize, lineHeight, partFont(part), c => {
          const pStyle = resolvePartStyle(part, style);
          return part.code ? drawCodeBackdrop(c, pX, pY, pWidth, partSize, pStyle) : pStyle; });
        rec(pX, pX + pWidth, pY, partSize*1.15);
      }

      cursorY += lineHeight*lineGapK(line) + bend/2;
      continue;
    }

    // Drop caps only apply to plain lines (no Segmentation Operator parts) --
    // a self-contained special case rather than trying to reach into or
    // reserve space across subsequent lines, which this per-line renderer
    // isn't architected for. The first character renders at DROP_CAP_SCALE
    // its line's size, top-aligned with where the line would normally
    // start; the rest of the line draws at normal size immediately after it.
    if(line.dropCap && line.segments.length && line.segments[0].text.length){
      const firstSeg = line.segments[0];
      const bigChar = firstSeg.text[0];
      const restOfFirst = firstSeg.text.slice(1);
      const dropCapSize = size*DROP_CAP_SCALE;

      const bigSegment = { ...firstSeg, text: bigChar };
      const restSegments = [
        ...(restOfFirst ? [{ ...firstSeg, text: restOfFirst }] : []),
        ...line.segments.slice(1),
      ];

      const dropCapWidth = measureSegWidth(ctx, fontDef, bigSegment, dropCapSize, null, line.smallCaps);
      drawTextRun(ctx, [bigSegment], paddingX, cursorY, dropCapSize, lineHeight, fontDef, style);
      let afterX = paddingX + dropCapWidth;
      if(restSegments.length){
        afterX = drawTextRun(ctx, restSegments, afterX, cursorY, size, lineHeight, fontDef, style);
      }
      drawRhymeMarker(afterX);
      rec(paddingX, afterX, cursorY, Math.max(size*1.15, dropCapSize*1.05));

      cursorY += Math.max(lineHeight, dropCapSize*1.05);
      continue;
    }

    const totalWidth = fitWidths.get(line).total;
    const lineAlign = line.alignOverride || currentAlign;
    const startX = lineAlign==='center' ? (W/2 - totalWidth/2) : (lineAlign==='right' ? (W - paddingX - totalWidth) : paddingX);

    if(line.type==='quote'){
      const barWidth = Math.max(2, size*0.06);
      const barGap = size*0.35;
      ctx.fillStyle = accent1On ? accent1Color : baseFillStyle;
      ctx.fillRect(startX - barGap - barWidth, cursorY + size*0.05, barWidth, lineHeight*0.85);
    }

    drawTextRun(ctx, line.segments, startX, cursorY, size, lineHeight, fontDef, style);
    drawRhymeMarker(startX + totalWidth);
    rec(startX, startX + totalWidth, cursorY, size*1.15);
    cursorY += lineHeight;
  }
  // CUT OUT BY TEXT: inside the letters, the page as it was before the surface (the ink goes with the surface; the
  // effects round the letters stay)
  if(textCut && GLYPH_MASK){
    try { const kx = CUT_CANVAS.getContext('2d', { willReadFrequently: true }); kx.globalCompositeOperation = 'destination-in'; kx.globalAlpha = 1; kx.drawImage(GLYPH_CANVAS, 0, 0); kx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(CUT_CANVAS, 0, 0); ctx.restore();
    } catch(err){ if(typeof console !== 'undefined') console.warn('text cut skipped:', err && err.message); } }
  // BLEND WITH TEXT: the page as it is now, the second surface blended onto it (its own blend and opacity), kept only
  // inside the letters, laid back over the page
  if(textFill && GLYPH_MASK){ GLYPH_MASK = null;
    try { if(!FILL_CANVAS) FILL_CANVAS = document.createElement('canvas'); FILL_CANVAS.width = W; FILL_CANVAS.height = H;
      const fx = FILL_CANVAS.getContext('2d', { willReadFrequently: true });
      fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = 1; fx.drawImage(canvas, 0, 0);
      drawSurfaceLayer(fx, textFill.L, 'base', { W, H, S, canvas: FILL_CANVAS, clearing: 0, env: textFill.env });
      fx.globalCompositeOperation = 'destination-in'; fx.globalAlpha = 1; fx.drawImage(GLYPH_CANVAS, 0, 0); fx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(FILL_CANVAS, 0, 0); ctx.restore();
    } catch(err){ if(typeof console !== 'undefined') console.warn('text blend skipped:', err && err.message); } }
  GLYPH_MASK = null;
  // the layout changed: a surface that reads it is drawn again, once, with the new one
  { const marks = (PUNCT_NOW || []).map(([x, y, m]) => [Math.round(x/W*10000)/10000, Math.round(y/H*10000)/10000, m].join(',')); PUNCT_NOW = null;
    const lay = textRuns.concat(marks).join(';');
    if(GROUND_PROBE && GROUND_PROBE.ground){ const { data, gw, gh, runs, inkField } = GROUND_PROBE.ground;
      GROUND_PROBE.result = groundContrast(data, gw, gh, runs, READABLE.allowance, inkField);
      GROUND_PROBE.result.settled = lay === TEXT_LAYOUT; GROUND_PROBE.ground = null; PROBE_INKS = null; }
    if(lay !== TEXT_LAYOUT){ TEXT_LAYOUT = lay;
      const reads = L => !!L && ((L.textureType === 'athanor' && graphUsesPoem(L.forgeGraph || '')) || chainReadsPoem(L.textureType, !!L.textureShapeAware));
      const src = SURFACE_SOURCE ? SURFACE_SOURCE() : null, g = reads(surfaceFromDom()) || !!(src && src.lowerOn && reads(src.other));
      if($('textureToggle').checked && (clearing > 0 || g)) setTimeout(scheduleRender, 0); } }

  // the spell is tied to the texture seed even when textures are off
  const seedForSpell = parseInt($('textureSeedValue').value, 10) || 0;

  // --- watermark ---
  const username = ($('usernameField').value.trim()) || '';
  const corner = $('usernameCorner').value;
  const isTop = corner.startsWith('top');
  const isRight = corner.endsWith('right');
  lap('text');
  // The credit is written in the page's own ink — no computed "watermark"
  // tone — and may carry PML colour: [accent], {accent}, <text/#:hex>. Only
  // colour: it is a signature, not a poem, and §Variables never apply here.
  // A line comes back as `segments` when it is plain, or as `parts` when it
  // holds <segments>; the credit takes either (reading only `parts` drew
  // nothing for an ordinary name like @ruby).
  const creditLine = username ? (buildLines(username, true, true)[0] || {}) : {};
  const creditParts = creditLine.parts || (creditLine.segments ? [{ segments: creditLine.segments }] : []);
  const ink = typeof baseFillStyle === 'string' ? baseFillStyle : $('textColorHex').value;
  ctx.save();
  ctx.font = `${fontDef.weight} ${Math.round(((W + H)/2)*MARKS.scale)}px "${fontDef.family}"`;
  ctx.globalAlpha = 0.9;
  ctx.textBaseline = isTop ? 'top' : 'alphabetic';
  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
  // INSIDE THE FRAME (Ruby: the name was sometimes badly placed): with a border or an inset box drawn, the credit and
  // the spell sit inside the innermost of them — past its line, its stitch and the round of its corner — rather than
  // at a fixed share of the page, where a wide offset put them on the line or outside it
  const markIn = (() => { const pad = Math.max(rpx(4), Math.min(W, H)*0.018); let m = 0;
    if($('borderToggle').checked) m = Math.max(m, bOffset + bThick + ((($('borderStitch') || {}).value || 'solid') !== 'solid' ? stitchSpec.amp : 0) + frameCorner*0.3);
    if(cardOn) m = Math.max(m, cOffset + cThick + (cStitch !== 'solid' ? cSpec.amp : 0) + cCorner*0.3);
    return m > 0 ? m + pad : 0; })();
  const mX = Math.max(W*MARKS.insetX, markIn), mY = Math.max(H*MARKS.insetY, markIn);
  const wmX = isRight ? (W - mX) : mX;
  const wmY = isTop ? mY : (H - mY);
  const runs = [];
  for(const part of creditParts) for(const sg of part.segments) runs.push({ text: sg.text,
    color: part.customColor || (sg.color === 'accent1' ? accent1Color : sg.color === 'accent2' ? accent2Color : ink) });
  let total = 0; for(const r of runs) total += ctx.measureText(r.text).width;
  let cx = isRight ? wmX - total : wmX;
  ctx.textAlign = 'left';
  for(const r of runs){ ctx.fillStyle = r.color; ctx.fillText(r.text, cx, wmY); cx += ctx.measureText(r.text).width; }
  ctx.restore();

  // --- the spell ---
  // Diagonally opposite the credit, at the same size, fully rendered rather
  // than faded. Derived from the texture seed, so a given look always carries
  // the same glyphs instead of reshuffling on every repaint. Written in PML
  // and parsed by the app's own parser, which is the whole joke: the accent
  // colouring and the visible brackets come from the language, not from a
  // special case here.
  // A stored spell wins: it identifies which preset a page came from, so it
  // must not change when the texture seed rerolls. Deriving is only the
  // fallback for a look that has never been saved.
  const storedSpell = $('activeSpell').value;
  const activeSpell = (storedSpell && validateSpell(storedSpell).ok)
    ? storedSpell
    : spellForSeed(seedForSpell);
  // the author may hide the spell code (Write → Show Spell Code?); spells and shared looks carry the choice
  const showSpell = !$('spellMark') || $('spellMark').checked !== false;
  const spellSegs = showSpell ? buildLines(spellToPML(activeSpell), true, true)[0].segments : [];
  ctx.save();
  const spellSize = Math.round(((W + H)/2)*MARKS.scale);
  // (faint, Ruby: a mark to find, not to read first)
  ctx.globalAlpha = MARKS.spellAlpha;
  ctx.textBaseline = isTop ? 'alphabetic' : 'top';
  ctx.textAlign = isRight ? 'left' : 'right';
  ctx.shadowColor='transparent'; ctx.shadowBlur=0;
  // Noto Sans Symbols (the first one) carries the alchemical block — 66 of
  // the 67 glyphs; Symbols 2 has only one of them. The UI face almost
  // certainly does not, hence the explicit stack rather than the poem's font
  const spellFont = `${spellSize}px "Noto Sans Symbols", "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif`;
  const spX = isRight ? mX : (W - mX);
  const spY = isTop ? (H - mY) : mY;
  ctx.font = spellFont;
  let spellW = 0;
  for(const sg of spellSegs) spellW += ctx.measureText(sg.text).width;
  let sx = ctx.textAlign === 'right' ? spX - spellW : spX;
  ctx.textAlign = 'left';
  for(const sg of spellSegs){
    // the bare segment takes the page's own ink, not the credit's muted tone
    ctx.fillStyle = sg.color === 'accent1' ? accent1Color
                  : sg.color === 'accent2' ? accent2Color
                  : (typeof baseFillStyle === 'string' ? baseFillStyle : $('textColorHex').value);
    ctx.fillText(sg.text, sx, spY);
    sx += ctx.measureText(sg.text).width;
  }
  ctx.restore();
  lap('marks');
  LAST_RENDER_MS = clock() - renderStart;
  LAST_PROFILE = laps.join(' · ') + ' ms';
}

// ---------- the back buffer: a frame reaches the page only when it is whole ----------
// Each frame is drawn into a hidden canvas and copied to the page at the end.
// If drawing fails part-way — on an older phone, most often a canvas that
// can't be allocated when memory is short — the page keeps its last good
// picture instead of going blank, the big caches are let go, and the frame is
// tried once more. (Where there is no OffscreenCanvas — Node's tests, old
// Safari — frames are drawn on the page directly, as before.)
let BACK = null, retrying = false, failures = 0;
export function render(){
  const page = $('poemCanvas');
  if(typeof OffscreenCanvas !== 'function'){ renderInto(page); return; }
  try {
    if(!BACK || BACK.width !== page.width || BACK.height !== page.height){
      BACK = null;                                   // free the old one before making the new
      BACK = new OffscreenCanvas(page.width, page.height);
    }
    const bctx = BACK.getContext('2d', { willReadFrequently: true });
    if(!bctx || (bctx.isContextLost && bctx.isContextLost())){ BACK = null; throw new Error('back buffer lost'); }
    renderInto(BACK);
    const v = page.getContext('2d', { willReadFrequently: true });
    v.setTransform(1, 0, 0, 1, 0, 0); v.globalAlpha = 1; v.globalCompositeOperation = 'copy';
    v.drawImage(BACK, 0, 0);
    v.globalCompositeOperation = 'source-over';
    failures = 0;
  } catch(err){
    failures++;
    if(typeof console !== 'undefined') console.warn('frame failed, keeping the last one:', err && err.message);
    // let memory go: the back buffer, remembered glyphs, the larger textures
    BACK = null; TINTED.clear(); dropLargeTextures(Math.max(1, page.width*page.height));
    if(!retrying && failures <= 3){
      retrying = true;
      setTimeout(() => { retrying = false; scheduleRender(); }, 250*failures);
    }
  }
}
/** The canvas was lost and restored, or the tab came back: start the back buffer afresh. */
export function resetBackBuffer(){ BACK = null; failures = 0; }

// Most controls call this instead of render() directly. requestAnimationFrame
// naturally caps how often a render can actually happen to the display's own
// refresh rate, and coalesces multiple synchronous triggers within the same
// frame into a single call — e.g. applyPreset() touches a dozen+ fields, each
// of which would otherwise ask for its own full render.
let renderScheduled = false;
// At most 24 renders a second, for renders nobody's hand is behind (a texture
// arriving from the worker, a font loading).
const MIN_RENDER_GAP = 1000 / 24;
let lastRenderAt = 0;
// THE SETTLE (Ruby: "a very brief delay … after the user is done making selections before the rendering begins"):
// while a hand is on the controls (a key, a slider's step, a dial dragged, a select changed) nothing renders; the
// render begins once they have been still for SETTLE_MS. A render takes a phone a tenth of a second or more, and
// one started mid-gesture holds up the next touch. Typing waits a little longer (TYPING_SETTLE_MS): people pause
// longer between keys than between a slider's steps. (PERFORMANCE-AUDIT.md, "the interface at rest".)
export const SETTLE_MS = 150, TYPING_SETTLE_MS = 250;
let quietAt = 0;
const nowMs = () => (typeof performance !== 'undefined' ? performance : Date).now();
/** A hand on the controls: no render begins until `ms` from now. */
export function noteUserActivity(ms = SETTLE_MS){ quietAt = Math.max(quietAt, nowMs() + ms); }
if(typeof document !== 'undefined' && document.addEventListener){
  const busy = () => noteUserActivity();
  for(const t of ['input', 'change', 'keydown', 'pointerdown']) document.addEventListener(t, busy, { capture: true, passive: true });
  // (a finger held down and moving: a slider or a dial being dragged; a mouse merely passing over counts for nothing)
  document.addEventListener('pointermove', e => { if(e.buttons || e.pointerType === 'touch') busy(); }, { capture: true, passive: true });
}
export function scheduleRender(){
  if(renderScheduled) return;
  renderScheduled = true;
  const go = ()=>requestAnimationFrame(()=>{
    renderScheduled = false;
    lastRenderAt = nowMs();
    render();
  });
  // wait for the hand to be still (and the gap since the last render); checked again when the wait ends, as the
  // hand may have moved on in the meantime
  const tick = () => { const t = nowMs(), wait = Math.max(quietAt - t, MIN_RENDER_GAP - (t - lastRenderAt));
    wait > 0 ? setTimeout(tick, wait) : go(); };
  tick();
}
