/**
 * swatches.js — the painted preset and spell tiles.
 *
 * Each tile is a small canvas: the ground, a hint of its surface, its
 * border, and its glyphs. The texture is generated at tile size rather than
 * rendered full and scaled down, so sixteen tiles cost about one repaint.
 */
import { capsFor, getTextureCanvas } from './textureGenerators.js';
import { buildLines } from './textParsers.js';
import { spellToPML } from './spell.js';
import { SWATCH } from './tunables.js';

/**
 * Paints one swatch: the ground, a hint of its surface, its border, and its
 * glyphs. The texture is generated at swatch size rather than scaled down
 * from a full render — a few thousand pixels each, cached like any other
 * texture, so sixteen of them cost about one ordinary repaint.
 */
export function paintPresetSwatch(canvas, p, w, h){
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
      const blend = p.textureBlend && caps.blends.includes(p.textureBlend) ? p.textureBlend : caps.blends[0];
      const tex = getTextureCanvas(type, w, h, { accent1: p.accent1, accent2: p.accent2, seed: (p.textureSeed != null ? p.textureSeed : SWATCH.fallbackSeed), p1: p.texP1, p2: p.texP2, light: 315, tint1: p.textureTint1 || null, tint2: p.textureTint2 || null, blend });
      if(tex){
        c.save();
        c.globalCompositeOperation = blend || 'overlay';
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
}
