/**
 * swatches.js — the painted preset and spell tiles.
 *
 * Each tile is a small canvas: the ground, a hint of its surface, its
 * border, and its glyphs. The texture is generated at tile size rather than
 * rendered full and scaled down, so sixteen tiles cost about one repaint.
 */
import { capsFor, getTextureCanvas } from './textureGenerators.js';

// WHERE A SWATCH'S TEXTURE COMES FROM. By default it is made here, at once
// (Node's tests; the old way). The page hands in a source that only ever
// returns a texture already made — and asks the worker for the rest — so a
// tile (a preset, a history frame) never holds the page up making one (a
// Turing Skin froze the page for a second each time the filmstrip repainted).
// A tile painted without its texture is painted again when it arrives.
let swatchSource = null;
const swatchWaiting = new Map();          // canvas → [p, w, h, onPainted]
export function setSwatchTextureSource(fn){ swatchSource = fn; }
export function swatchTexturesArrived(){
  if(!swatchWaiting.size) return;
  const again = [...swatchWaiting]; swatchWaiting.clear();
  // (a canvas off the page is repainted too when someone waits on it: the surface menus' thumbnails are made off the page)
  for(const [canvas, args] of again) if(canvas.isConnected !== false || args[3]) paintPresetSwatch(canvas, ...args);
}
import { buildLines } from './textParsers.js';
import { spellToPML } from './spell.js';
import { SWATCH } from './tunables.js';
import { CANVAS_BLENDS } from './boxFx.js';

/**
 * Paints one swatch: the ground, a hint of its surface, its border, and its
 * glyphs. The texture is generated at swatch size rather than scaled down
 * from a full render — a few thousand pixels each, cached like any other
 * texture, so sixteen of them cost about one ordinary repaint.
 */
/** One surface layer onto a swatch, in small: false while its texture is still being made. */
function swLayer(c, L, w, h){
  try {
    const caps = capsFor(L.textureType);
    const type = L.textureType === 'astral' ? 'astral_stars' : L.textureType;
    // (a canvas mixes the canvas's own blends; the per-pixel ones (⚡) show as the surface's first)
    const blend = L.textureBlend && (caps.blends.includes(L.textureBlend) || CANVAS_BLENDS.includes(L.textureBlend)) ? L.textureBlend : caps.blends[0];
    // every knob and hue the look sets, so a tile is the look in small
    const opts = { accent1: L.accent1, accent2: L.accent2, seed: (L.textureSeed != null ? L.textureSeed : SWATCH.fallbackSeed), p1: L.texP1, p2: L.texP2, p3: L.texP3, p4: L.texP4, p5: L.texP5, p6: L.texP6, p7: L.texP7, p8: L.texP8,
      light: L.textureLight != null ? +L.textureLight : 315, lightTilt: L.textureLightTilt != null ? +L.textureLightTilt : undefined,
      tint1: L.textureTint1 || null, tint2: L.textureTint2 || null, tint3: L.textureTint3 || null, tint4: L.textureTint4 || null, tint5: L.textureTint5 || null, tint6: L.textureTint6 || null,
      blend: L.textureGround || blend,
      // the look's own backdrop, for a surface made of it (Rain on Glass, Circuit Board)
      env: [L.bg1, ...(L.bgGradient ? [L.bg2, L.bg3, L.bg4] : [])].filter(Boolean).join(',') || undefined };
    const tex = swatchSource ? swatchSource(type, w, h, opts) : getTextureCanvas(type, w, h, opts);
    if(!tex) return !swatchSource;
    c.save();
    c.globalCompositeOperation = blend || 'overlay';
    c.globalAlpha = Math.min(1, (L.textureOpacity || 30) / 100);
    c.drawImage(tex, 0, 0, w, h);
    c.restore();
  } catch(e){ /* a swatch is never worth failing a render over */ }
  return true;
}

export function paintPresetSwatch(canvas, p, w, h, onPainted = null){
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

  // surface: the lower one first, when the look has two (a look's lower surface keeps the upper's keys)
  if(p.texture && p.textureType){
    const page = { accent1: p.accent1, accent2: p.accent2, bg1: p.bg1, bg2: p.bg2, bg3: p.bg3, bg4: p.bg4, bgGradient: p.bgGradient };
    if(p.baseToggle && p.baseLayer && p.baseLayer.textureType && !swLayer(c, { ...p.baseLayer, ...page }, w, h)){
      swatchWaiting.set(canvas, [p, w, h, onPainted]); onPainted = null; }
    else if(!swLayer(c, p, w, h)){ swatchWaiting.set(canvas, [p, w, h, onPainted]); onPainted = null; }
    else swatchWaiting.delete(canvas);
  }

  // the inset box and the border, scaled down from the page: both share one
  // rounded rectangle, the box beneath and the border stroked on its edge
  const bw = Math.max(1.5, Math.round(h * SWATCH.borderScale));
  const inset = bw * 1.6;
  const radius = p.borderRounded ? Math.min(h * 0.28, (parseFloat(p.borderRadius) || 60) * h / 900) : 0;
  const frame = () => {
    const x = inset, y = inset, fw = w - inset*2, fh = h - inset*2, r = Math.min(radius, fw/2, fh/2);
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + fw - r, y); c.arcTo(x + fw, y, x + fw, y + r, r);
    c.lineTo(x + fw, y + fh - r); c.arcTo(x + fw, y + fh, x + fw - r, y + fh, r);
    c.lineTo(x + r, y + fh); c.arcTo(x, y + fh, x, y + fh - r, r);
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
  };
  if(p.cardToggle){
    c.save();
    frame();
    c.globalAlpha = Math.max(0, Math.min(100, parseFloat(p.cardOpacity ?? 70))) / 100;
    c.globalCompositeOperation = p.cardBlend || 'source-over';
    if(p.cardGradientToggle && p.cardColor2){
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, p.cardColor1 || '#FFF6EE'); g.addColorStop(1, p.cardColor2);
      c.fillStyle = g;
    } else c.fillStyle = p.cardColor1 || '#FFF6EE';
    c.fill();
    c.restore();
  }
  if(p.border && p.borderColor){
    c.save();
    c.strokeStyle = p.borderColor;
    c.lineWidth = bw;
    frame(); c.stroke();
    c.restore();
  }

  // glyphs, in the preset's own accents, at the size the swatch allows
  if(p.spell){
    const segs = buildLines(spellToPML(p.spell), true, true)[0].segments;
    const size = Math.max(6, Math.round(h * SWATCH.glyphScale));
    c.font = `${size}px "Noto Sans Symbols", "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif`;
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
  if(onPainted) try { onPainted(canvas); } catch(e){}
}
