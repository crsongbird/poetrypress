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
import { getTextureCanvas, capsFor, defaultBlendFor, paramsFor, textureCacheMB, dropLargeTextures } from './textureGenerators.js';
import { resolvePmlVariables } from './pmlVars.js';
import { moonPhase } from './moon.js';
import { moonForSeed } from './texWhimsy.js';
import { installInlineGlyphs, clearMeasureCache } from './glyphs.js';
import { drawStitch, pathFromPoints, roundRectPoints, stitchInnerEdge, STITCH_STYLES } from './stitches.js';
import { makeEffect, legacyOutline, legacyTypeEffect, describeStack } from './effects.js';
import { requestTexture, onTextureReady, textureServiceInfo } from './textureService.js';
import { ensureFonts, fontsRequested } from './fonts.js';
import { mixHex } from './texCore.js';
import { EFFECTS, MARKS } from './tunables.js';


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

function makeGradient(ctx, w, h, angleDeg, colors){
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
    const sx = small.getContext('2d'), img = sx.createImageData(S, S), d = img.data;
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
  } else {
    const rad = (spec.angle || 0) * Math.PI/180, cx = x + w/2, cy = y + h/2, len = Math.hypot(w, h)/2;
    const g = ctx.createLinearGradient(cx - Math.cos(rad)*len, cy - Math.sin(rad)*len, cx + Math.cos(rad)*len, cy + Math.sin(rad)*len);
    stops.forEach((c, i) => g.addColorStop(i/(stops.length-1), c));
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
/** The inset box's own layer, kept between renders (see the box, in render()). */
let CARD_LAYER = null;
function cardLayer(w, h){
  if(!CARD_LAYER){ CARD_LAYER = document.createElement('canvas'); }
  if(CARD_LAYER.width !== w || CARD_LAYER.height !== h){ CARD_LAYER.width = w; CARD_LAYER.height = h; }
  return CARD_LAYER;
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
    const x = c.getContext('2d'); let seed = tone === 0 ? 7 : 13;
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
  const [hue] = hexToHsl(style.accent1Color || '#9B7FE8');
  const light = behind < 0.5;                          // dark page: light backdrop
  const back = hslToHex(hue, light ? 0.32 : 0.28, light ? 0.88 : 0.15);
  const ink  = hslToHex(hue, light ? 0.45 : 0.3,  light ? 0.14 : 0.92);
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
  if(!part.customColor && !part.customEffect && !part.customTypeEffect && !part.customFx && !part.under && !part.customGradient && part.customTracking==null && part.customJitter==null) return baseStyle;
  const s = { ...baseStyle };
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
const blurred = (ctx, r) => { if(r > 0.3 && 'filter' in ctx) ctx.filter = `blur(${r.toFixed(1)}px)`; };
const EFFECT_DRAW = {
  outline(ctx, str, x, y, size, fill, e){
    ctx.globalAlpha = e.k2/100; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = rpx(e.k1)*2; ctx.strokeStyle = e.color; ctx.strokeText(str, x, y);
  },
  shadow(ctx, str, x, y, size, fill, e){
    const [dx, dy] = along(e, rpx(e.k2));
    blurred(ctx, rpx(e.k1)/2); ctx.fillStyle = e.color; ctx.fillText(str, x + dx, y + dy);
  },
  longshadow(ctx, str, x, y, size, fill, e){
    const L = size*0.7*e.k1/100, step = Math.max(rpx(1), size*0.025), n = Math.max(1, Math.ceil(L/step));
    const [ux, uy] = along(e, 1); ctx.fillStyle = e.color;
    for(let i = n; i >= 1; i--){ ctx.globalAlpha = (e.k2/100)*(1 - (i - 1)/n*0.85); ctx.fillText(str, x + ux*step*i, y + uy*step*i); }
  },
  glow(ctx, str, x, y, size, fill, e){
    const r = Math.max(rpx(1), size*0.45*e.k1/100); ctx.fillStyle = e.color;
    ctx.globalAlpha = e.k2/100; blurred(ctx, r); ctx.fillText(str, x, y);
    blurred(ctx, r*0.4); ctx.fillText(str, x, y);                       // a tighter, brighter core
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
    blurred(ctx, d*0.35);
    ctx.globalAlpha = a*0.75; ctx.fillStyle = '#000000'; ctx.fillText(str, x + dx, y + dy);
    ctx.globalAlpha = a*0.9;  ctx.fillStyle = '#ffffff'; ctx.fillText(str, x - dx, y - dy);
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
  const o = off.getContext('2d');
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
  for(let i = 0; i < bites; i++){
    const r = size * (0.008 + rand() * 0.03) * (0.6 + k);
    o.beginPath();
    o.arc(rand() * off.width, rand() * off.height, r, 0, Math.PI * 2);
    o.fill();
  }
  ctx.drawImage(off, px - pad, py - pad);
}

function drawTextRun(ctx, segments, startX, cursorY, size, lineHeight, fontDef, style){
  const { baseFillStyle, accent1Color, accent2Color, quoteAlpha } = style;
  const fx = style.fx || [], erode = erosionOf(fx);

  const widths = segments.map(seg=>measureSegWidth(ctx, fontDef, seg, size, style.customTracking, style.smallCaps));
  let x = startX;
  let charSeed = 0; // advances across the whole run, not just per-segment, so jitter doesn't repeat identically at the start of every segment

  for(let i=0;i<segments.length;i++){
    const seg = segments[i];
    const w = widths[i];
    ctx.save();
    ctx.font = fontString(fontDef, seg, size);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = quoteAlpha;

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

    const needsPerChar = tracking !== 0 || hasEmoji || style.smallCaps || jitterMag > 0;

    if(!needsPerChar){
      drawEffects(ctx, seg.text, x, cursorY, size, segFill, fx);
      ctx.fillStyle = segFill;
      if(erode && erode.k1 > 0){
        drawErodedText(ctx, seg.text, x, cursorY, segFill, size, erode.k1/100);
      } else {
        ctx.fillText(seg.text, x, cursorY);
      }
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
          const py = cursorY + jy + (isLower ? size*(1-SMALL_CAP_RATIO) : 0);
          // Rotate ABOUT the glyph's centre while keeping absolute coordinates,
          // so a gradient fill (defined in absolute space) stays aligned.
          const rotating = rot !== 0;
          if(rotating){
            const rx = cx + jx + chW/2, ry = py + size/2;
            ctx.save(); ctx.translate(rx, ry); ctx.rotate(rot); ctx.translate(-rx, -ry);
          }
          draw(ch, drawCh, cx + jx, py);
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
          ctx.drawImage(tinted, gx, gy);
          return;
        }
        ctx.fillStyle = segFill;
        if(erode && erode.k1 > 0){
          drawErodedText(ctx, drawCh, gx, gy, segFill, size, erode.k1/100);
        } else {
          ctx.fillText(drawCh, gx, gy);
        }
      });
    }

    if(style.under){
      // an underline decoration (/under:…), drawn by the stitch library
      const u = style.under, wt = (u.weight || 100)/100;
      drawStitch(ctx, pathFromPoints([[x, cursorY + size*0.95], [x + w, cursorY + size*0.95]], false), u.style,
        { period: size*0.38, amp: size*0.075, width: Math.max(rpx(1), size*0.04*wt),
          color: u.color || (typeof segFill === 'string' ? segFill : (style.plainTextColor || '#000')), side: 1 });
    }
    if(seg.underline || seg.strike){
      const lineY = seg.underline ? cursorY + size*0.92 : cursorY + size*0.55;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x+w, lineY);
      ctx.strokeStyle = segFill;
      ctx.lineWidth = Math.max(rpx(1), size*0.045);
      ctx.stroke();
    }

    ctx.restore();
    x += w;
  }
  return x;
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
function fitTextSize(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing){
  // The largest size, on the grid maxSizePx, maxSizePx-2, … (above 8), at
  // which every line fits — exactly what stepping down 2px at a time from the
  // top finds, but in ~3 measuring passes instead of dozens. Width grows in
  // proportion to size and height exactly so, so one measurement at the top
  // predicts the answer; the grid around the prediction is then checked with
  // real measurements (down while it doesn't fit, up while the next does,
  // peeking two further steps up in case rounding made fit non-monotonic).
  const minSize = 8;
  const measureAt = size => {
    let maxLineWidth = 0, totalHeight = 0;
    const widths = new Map();
    for(const line of lines){
      if(line.isBlank){ totalHeight += size*0.55*spacing; continue; }
      totalHeight += size*line.scale*1.32*spacing;
      const w = computeLineWidths(ctx, line, size, fontDef);
      widths.set(line, w);
      if(w.total > maxLineWidth) maxLineWidth = w.total;
    }
    return { size, widths, fits: maxLineWidth <= maxWidth && totalHeight <= maxHeight, maxLineWidth, totalHeight };
  };
  const onGrid = s => s > minSize && s <= maxSizePx && ((maxSizePx - s) % 2 === 0);
  const top = measureAt(maxSizePx);
  if(top.fits || maxSizePx <= minSize){
    if(top.fits) return { size: top.size, widths: top.widths };
  } else {
    // predict, snapped down onto the grid
    const byW = top.maxLineWidth > 0 ? maxSizePx*maxWidth/top.maxLineWidth : maxSizePx;
    const byH = top.totalHeight > 0 ? maxSizePx*maxHeight/top.totalHeight : maxSizePx;
    let s = maxSizePx - 2*Math.max(1, Math.ceil((maxSizePx - Math.min(byW, byH))/2));
    const tried = new Map([[maxSizePx, top]]);
    const at = size => { if(!tried.has(size)) tried.set(size, measureAt(size)); return tried.get(size); };
    // down until it fits
    while(onGrid(s) && !at(s).fits) s -= 2;
    if(onGrid(s)){
      // up while a larger size on the grid fits (peeking two steps past a miss)
      for(;;){
        if(onGrid(s + 2) && at(s + 2).fits){ s += 2; continue; }
        if(onGrid(s + 4) && at(s + 4).fits){ s += 4; continue; }
        if(onGrid(s + 6) && at(s + 6).fits){ s += 6; continue; }
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

function blockHeight(lines, size, spacing){
  let total = 0;
  for(const line of lines){
    if(line.isBlank){ total += size*0.55*spacing; continue; }
    const lineOwnHeight = size*line.scale*1.32*spacing;
    total += line.dropCap ? Math.max(lineOwnHeight, size*line.scale*DROP_CAP_SCALE*1.05) : lineOwnHeight;
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
  const a = ((+deg || 315) - 90) * Math.PI / 180;
  const ang = Math.atan2(-Math.sin(a), -Math.cos(a));
  return ARROWS[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
}
function pmlVarContext(W, H){
  const on = !$('textureToggle') || $('textureToggle').checked;
  const type = $('textureType') ? $('textureType').value : '';
  const caps = capsFor(type), defs = paramsFor(type) || [];
  const seed = parseInt($('textureSeedValue') && $('textureSeedValue').value, 10) || 0;
  const hues = [];
  for(let i = 0; i < Math.min(2, caps.tints || 0); i++){
    const el = $(i ? 'textureTint2Hex' : 'textureTint1Hex');
    if(el) hues.push({ label: (caps.tintLabels || [])[i] || (i ? 'Second Hue' : 'Hue'), hex: el.value });
  }
  // the material hues and the fifth, when they are in use (not their "none")
  if(caps.material) [['textureTint3Hex', 'Highlight Hue'], ['textureTint4Hex', 'Shade Hue']].forEach(([id, label]) => {
    const el = $(id); if(el && el.value.toUpperCase() !== '#FFFFFF') hues.push({ label, hex: el.value }); });
  if(caps.hue5){ const el = $('textureTint5Hex'); if(el && el.value.toUpperCase() !== caps.hue5.def.toUpperCase()) hues.push({ label: caps.hue5.label, hex: el.value }); }
  return {
    surfName: on ? optionText('textureType') : 'None',
    blendName: optionText('textureBlend').replace(/\s*\(default\)\s*$/i, ''),
    // the arrow, and how high the light is when it isn't at the horizon
    lightArrow: caps.light ? lightArrow($('textureLight') && $('textureLight').value)
      + (caps.dial ? ' (' + caps.dial.split(' ')[0].toLowerCase() + ')'
        : (($('textureLightTilt') && +$('textureLightTilt').value < 100) ? ' ' + Math.round(+$('textureLightTilt').value) + '%' : '')) : 'n/a',
    seed,
    // every knob the texture has, by its own label and readout (up to five)
    params: defs.map((d, i) => ({ label: d.label, value: ($('texP' + (i + 1) + 'Val') || {}).textContent || '' })),
    opacity: Math.round(+($('textureOpacity') && $('textureOpacity').value) || 0),
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

let linesCacheKey = null;
let linesCacheValue = null;
function getCachedLines(rawText, accent1On, accent2On){
  const key = rawText + '\u0000' + accent1On + '\u0000' + accent2On;
  if(key === linesCacheKey) return linesCacheValue;
  linesCacheValue = buildLines(rawText, accent1On, accent2On);
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
function getCachedFit(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing, shapeKey){
  // The key is the layout's SHAPE (shapeKey: the text with live numbers —
  // §RenderMs, §Profile, §CacheMB — by their shape, not their digits), so a
  // stat ticking over doesn't refit a page whose layout hasn't changed. With
  // no live numbers in the poem it is exactly linesCacheKey, as before.
  const key = [shapeKey != null ? shapeKey : linesCacheKey, fontDef.family, fontDef.weight, maxWidth, maxHeight, maxSizePx, spacing].join('|');
  if(key === fitCacheKey){
    if(fitCacheLines === lines) return fitCacheValue;
    // the same layout with live numbers changed: keep the size, measure these lines once
    const widths = new Map();
    for(const line of lines) if(!line.isBlank) widths.set(line, computeLineWidths(ctx, line, fitCacheValue.size, fontDef));
    fitCacheValue = { size: fitCacheValue.size, widths }; fitCacheLines = lines;
    return fitCacheValue;
  }
  fitCacheValue = fitTextSize(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing);
  fitCacheKey = key; fitCacheLines = lines;
  return fitCacheValue;
}

let LAST_RENDER_MS = 0, LAST_PROFILE = '';
// S: this render's scale against the canonical export canvas (texCore.js).
// Always 1 today — the preview IS the export size. setRenderScale is where a
// screen-sized preview will set it, once every generator measures in cpx().
let RENDER_SCALE = 1;
// a texture finished in the worker: draw the page again
onTextureReady(() => scheduleRender());
export function setRenderScale(s){ RENDER_SCALE = (s > 0 && isFinite(s)) ? s : 1; }
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
// §Profile: where the last render's time went, stage by stage
const clock = () => (typeof performance !== 'undefined' ? performance : Date).now();
function renderInto(canvas){
  const renderStart = clock();
  const laps = []; let lapAt = renderStart;
  const S = RENDER_SCALE;
  // a texture from the texture service: scaled to the page, since the one shown
  // while a new one is made may have been made at another preview size
  // A texture that can't be drawn is skipped, never allowed to abort the frame:
  // a frame abandoned mid-blend left the canvas in that blend, and the next
  // frame blended over the old one (two pages showing at once).
  const drawTex = t => { if(!t) return; try { ctx.drawImage(t, 0, 0, W, H); } catch(err){ if(typeof console !== 'undefined') console.warn('texture skipped:', err && err.message); } };
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

  if($('textureToggle').checked){
    const type = $('textureType').value;
    const opacity = Math.max(0, parseFloat($('textureOpacity').value) || 0) / 100;
    const accent1Color = $('accent1ColorHex').value;
    const accent2Color = $('accent2ColorHex').value;
    // blend, light and tints are now chosen per texture rather than inferred
    const caps = capsFor(type);
    const chosen = $('textureBlend').value;
    const blend = caps.blends.includes(chosen) ? chosen : defaultBlendFor(type);
    const light = caps.light ? (parseFloat($('textureLight').value) || 0) : null;
    const lightTilt = caps.light && $('textureLightTilt') ? parseFloat($('textureLightTilt').value) : 100;
    const tint1 = caps.tints >= 1 ? $('textureTint1Hex').value : null;
    const tint2 = caps.tints >= 2 ? $('textureTint2Hex').value : null;
    // material hues (white = none), for the coloured lit textures
    const tint3 = caps.material ? ($('textureTint3Hex') || {}).value || null : null;
    const tint4 = caps.material ? ($('textureTint4Hex') || {}).value || null : null;
    // the fifth hue (glow, material or base), where the texture has one
    const tint5 = caps.hue5 ? ($('textureTint5Hex') || {}).value || null : null;
    const seed = parseInt($('textureSeedValue').value, 10) || 0;

    const tp1 = parseFloat($('texP1').value);
    const tp2 = parseFloat($('texP2').value);
    const p1 = isNaN(tp1) ? null : tp1;
    const p2 = isNaN(tp2) ? null : tp2;
    const tp3 = $('texP3') ? parseFloat($('texP3').value) : NaN;
    const p3 = isNaN(tp3) ? null : tp3;
    // knobs four and five, for the textures that have them (Dream Bloom)
    const knob = id => { const el = $(id), f = el && el.parentElement; const v = el ? parseFloat(el.value) : NaN;
      return (isNaN(v) || (f && f.style && f.style.display === 'none')) ? null : v; };
    const p4 = knob('texP4'), p5 = knob('texP5');

    if(type === 'astral'){
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend === 'lighten' ? 'overlay' : blend;
      // the light slot stays empty here; the nebula colour is a TINT
      drawTex(requestTexture('fog', 'astral_fog', W, H, { seed, p1: p2, p3, tint1: tint2, scale: S }));
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend;
      drawTex(requestTexture('stars', 'astral_stars', W, H, { accent1: accent1Color, accent2: accent2Color, seed, p1, p3, tint1, scale: S }));
      ctx.restore();
    } else if(type === 'inkbleed'){
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend;
      drawTex(requestTexture('main', type, W, H, { seed, p1, p2, p3, light, lightTilt, tint1, tint2, tint3, tint4, tint5, blend, scale: S, p4, p5 }));
      ctx.restore();
    } else if(type === 'embers' || type === 'magicparticles' || type === 'snow'){
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend;
      drawTex(requestTexture('main', type, W, H, { accent1: accent1Color, accent2: accent2Color, seed, p1, p2, p3, light, lightTilt, tint1, tint2, tint3, tint4, tint5, blend, scale: S, p4, p5 }));
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend;
      drawTex(requestTexture('main', type, W, H, { seed, p1, p2, p3, light, lightTilt, tint1, tint2, tint3, tint4, tint5, blend, scale: S, p4, p5 }));
      ctx.restore();
    }
  }

  // --- vignette (drawn here, before border/text, so it only affects the
  // background+texture layers underneath rather than the whole composed image) ---
  if($('vignetteToggle').checked){
    const intensity = Math.max(0, parseFloat($('vignetteIntensity').value) || 0) / 100;
    const blend = $('vignetteBlend').value;
    // aperture moves where the darkening BEGINS: low pulls it inward until
    // the whole page is falling off, high pushes it out to the corners only
    const aperture = Math.max(0, Math.min(100, parseFloat($('vignetteAperture').value) || 0)) / 100;
    const vcx = W * (Math.max(0, Math.min(100, parseFloat($('vignetteCx').value) || 50)) / 100);
    const vcy = H * (Math.max(0, Math.min(100, parseFloat($('vignetteCy').value) || 50)) / 100);
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
      const dots = Math.round((W*H)/EFFECTS.gritDensity * grit);
      for(let i=0;i<dots;i++){
        const x = Math.random()*W, y = Math.random()*H;
        const d = Math.hypot(x-vcx, y-vcy) / outerR;
        if(d < aperture) continue;
        const falloff = Math.min(1, (d - aperture) / Math.max(0.05, 1 - aperture));
        ctx.globalAlpha = falloff * intensity * grit * (0.25 + Math.random()*0.55);
        ctx.fillStyle = vignetteRGB === '255,255,255' ? '#fff' : '#000';
        ctx.fillRect(x, y, 1 + Math.random()*1.6, 1 + Math.random()*1.6);
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
  // The border's stitch, worked out once: the border draws it, and the inset
  // box follows its inner edge — a scalloped border makes a scalloped box.
  const stitchStyle = ($('borderToggle').checked && ($('borderStitch') || {}).value) || 'solid';
  const stitchSpec = { period: Math.max(rpx(6), bThick*6 + Math.min(W, H)*0.012), amp: Math.max(rpx(3), bThick*2 + Math.min(W, H)*0.004),
    width: bThick, side: ($('borderStitchOut') && $('borderStitchOut').checked) ? -1 : 1 };
  const framePoints = () => roundRectPoints(inset, inset, W - inset*2, H - inset*2, frameCorner);

  if($('cardToggle') && $('cardToggle').checked){
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
    lx.beginPath();
    if(stitchStyle !== 'solid'){
      // inside a stitched border, the box stops at the stitch's inner edge
      const edge = stitchInnerEdge(pathFromPoints(framePoints(), true), stitchStyle, stitchSpec);
      edge.forEach((p, i) => i ? lx.lineTo(p[0], p[1]) : lx.moveTo(p[0], p[1])); lx.closePath();
    } else roundRectPath(lx, inset, inset, W - inset*2, H - inset*2, frameCorner);
    lx.clip();
    const c1 = $('cardColor1Hex').value;
    if($('cardGradientToggle').checked) paintGradient(lx, inset, inset, W - inset*2, H - inset*2, gradientSpec('card'), [c1, $('cardColor2Hex').value]);
    else { lx.fillStyle = c1; lx.fillRect(inset, inset, W - inset*2, H - inset*2); }
    lx.restore();
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(100, parseFloat($('cardOpacity').value) || 0)) / 100;
    ctx.globalCompositeOperation = $('cardBlend').value || 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(L, 0, 0, W, H);
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
      const ga = (parseFloat(($('borderGradientAngle') || {}).value) || 45) * Math.PI/180, half = Math.hypot(W, H)/2;
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
  const rawText = resolvePmlVariables($('poemText').value, varCtx);
  // the same text with live numbers by their shape (digits as 0): the fit's key
  const shapeOf = v => String(v).replace(/\d/g, '0');
  const shapeText = resolvePmlVariables($('poemText').value, { ...varCtx, renderMs: shapeOf(varCtx.renderMs), profile: shapeOf(varCtx.profile), cacheMB: shapeOf(varCtx.cacheMB) });
  const lines = getCachedLines(rawText, accent1On, accent2On);

  const fontDef = FONTS[$('fontFamily').value];
  // fetch only the faces this page uses; when one arrives, re-measure and redraw
  {
    const used = [fontDef, CODE_FONT];
    for(const ln of lines) if(ln.parts) for(const pt of ln.parts) if(pt.customFontIdx != null && FONTS[pt.customFontIdx]) used.push(FONTS[pt.customFontIdx]);
    ensureFonts(used, () => { invalidateTextMeasurements(); scheduleRender(); });
  }
  const maxSizePx = Math.max(10, parseFloat($('maxSize').value) || 120);
  const lineSpacing = Math.pow(2, parseFloat($('lineSpacing').value) || 0);

  lap('frame');
  // Text keeps clear of the frame: with a border or box on, the margins grow
  // to the frame's inner edge plus breathing room, instead of a fixed share of
  // the page that a wide offset or thick border would overrun.
  // TEXT MARGINS scales the room that is a matter of taste — the page-share
  // margins and the breathing room inside a frame — never the frame itself,
  // so text can come close to a border but not cross it. 100% is as it was.
  const marginK = Math.max(0.2, Math.min(1.5, (parseFloat(($('textMargin') || {}).value) || 100)/100));
  const frameOn = $('borderToggle').checked || ($('cardToggle') && $('cardToggle').checked);
  const frameEdge = frameOn ? bOffset + bThick + Math.min(W, H)*0.04*marginK : 0;
  const paddingX = Math.max(W*0.09*marginK, frameEdge);
  const paddingY = Math.max(H*0.07*marginK, frameEdge);
  const maxWidth = W - paddingX*2;
  const maxHeight = H - paddingY*2;

  const shapeKey = (linesCacheKey && linesCacheKey.startsWith(rawText)) ? shapeText + linesCacheKey.slice(rawText.length) : null;
  const { size: baseSize, widths: fitWidths } = getCachedFit(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, lineSpacing, shapeKey);
  const totalHeight = blockHeight(lines, baseSize, lineSpacing);

  let startY;
  if(currentValign==='top') startY = paddingY;
  else if(currentValign==='bottom') startY = paddingY + (maxHeight - totalHeight);
  else startY = paddingY + (maxHeight - totalHeight)/2;
  startY = Math.max(paddingY, startY);

  let baseFillStyle;
  if($('textGradientToggle').checked){
    const textColors = collectGradientColors($('textColorHex').value, 'textColor2Hex', 'textColor3Hex', 'textColor4Hex', textStopCount);
    baseFillStyle = makeGradient(ctx, W, H, parseFloat($('textGradientAngle').value), textColors);
  } else {
    baseFillStyle = $('textColorHex').value;
  }

  // the page's effect stack, from the three effect slots (effects.js)
  const pageFx = pageEffectStack();
  const pageUnder = ($('underAll') && $('underAll').value) ? { style: $('underAll').value, color: null, weight: 100 } : null;

  let cursorY = startY;
  ctx.textBaseline = 'top';

  // the effect stack and underline the page gives every run (a segment may replace them)
  const runStyle = { fx: pageFx, under: pageUnder, baseFillStyle, plainTextColor: $('textColorHex').value,
    accent1Color, accent2Color, quoteAlpha: 1 };

  for(const line of lines){
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
        const partSize = partSizeFor(part, size);
        let pStyle = resolvePartStyle(part, style);
        if(part.code) pStyle = drawCodeBackdrop(ctx, flowX, partCursorY(part, partSize), partWidthMap.get(part), partSize, pStyle);
        flowX = drawTextRun(ctx, part.segments, flowX, partCursorY(part, partSize), partSize, lineHeight, partFont(part), pStyle);
      }

      drawRhymeMarker(flowX);

      for(const part of anchoredParts){
        const partSize = partSizeFor(part, size);
        const pWidth = partWidthMap.get(part);
        const pX = part.justify==='center' ? (W/2 - pWidth/2)
          : part.justify==='right' ? (W - paddingX - pWidth)
          : paddingX;
        let pStyle = resolvePartStyle(part, style);
        if(part.code) pStyle = drawCodeBackdrop(ctx, pX, partCursorY(part, partSize), pWidth, partSize, pStyle);
        drawTextRun(ctx, part.segments, pX, partCursorY(part, partSize), partSize, lineHeight, partFont(part), pStyle);
      }

      cursorY += lineHeight;
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
    cursorY += lineHeight;
  }

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
  const wmX = isRight ? (W - W*MARKS.insetX) : (W*MARKS.insetX);
  const wmY = isTop ? (H*MARKS.insetY) : (H - H*MARKS.insetY);
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
  const spellSegs = buildLines(spellToPML(activeSpell), true, true)[0].segments;
  ctx.save();
  const spellSize = Math.round(((W + H)/2)*MARKS.scale);
  ctx.globalAlpha = 0.95;
  ctx.textBaseline = isTop ? 'alphabetic' : 'top';
  ctx.textAlign = isRight ? 'left' : 'right';
  ctx.shadowColor='transparent'; ctx.shadowBlur=0;
  // Noto Sans Symbols (the first one) carries the alchemical block — 66 of
  // the 67 glyphs; Symbols 2 has only one of them. The UI face almost
  // certainly does not, hence the explicit stack rather than the poem's font
  const spellFont = `${spellSize}px "Noto Sans Symbols", "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif`;
  const spX = isRight ? (W*MARKS.insetX) : (W - W*MARKS.insetX);
  const spY = isTop ? (H - H*MARKS.insetY) : (H*MARKS.insetY);
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
// At most 24 renders a second: dragging a slider fires far faster than that,
// and 24 is plenty to feel live while leaving the phone room to breathe. The
// last change always renders — a pending render picks up the latest state.
const MIN_RENDER_GAP = 1000 / 24;
let lastRenderAt = 0;
export function scheduleRender(){
  if(renderScheduled) return;
  renderScheduled = true;
  const wait = Math.max(0, MIN_RENDER_GAP - ((typeof performance !== 'undefined' ? performance : Date).now() - lastRenderAt));
  const go = ()=>requestAnimationFrame(()=>{
    renderScheduled = false;
    lastRenderAt = (typeof performance !== 'undefined' ? performance : Date).now();
    render();
  });
  wait > 0 ? setTimeout(go, wait) : go();
}
