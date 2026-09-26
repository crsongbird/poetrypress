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
}
