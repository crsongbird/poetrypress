/**
 * glyphs.js — drawn symbols that can sit inside canvas text.
 *
 * The navigation glyphs, the moon phases and the Vellum sigil are drawings,
 * not font characters, so no font can set them. Each one is given a
 * character from Unicode's Private Use Area, which no real text contains.
 * installInlineGlyphs() wraps canvas text drawing so that those characters
 * are MEASURED as a glyph's width and DRAWN as the vector shape, in the
 * current fill colour. Everything that lays out text — wrapping, centring,
 * jitter, tracking, typeface effects — goes through measureText and
 * fillText, so it all works on glyphs without knowing they exist.
 *
 * Only the PML variable resolver (pmlVars.js) produces these characters, so
 * they can only reach the canvas through the poem.
 */
import { litPath } from './moon.js';

// ---- the shapes, in a 24-unit box (the same geometry as tools/icons.py) ----
const NAV = {
  input:       [['path', 'M6.6 4.2A2.5 2.5 0 0 1 9.1 6.7V9.1h5.9V6.6A2.5 2.5 0 1 1 17.5 9.1H15v5.9h2.4A2.5 2.5 0 1 1 15 17.4V15H9.1v2.4A2.5 2.5 0 1 1 6.6 15H9V9.1H6.6A2.5 2.5 0 0 1 6.6 4.2Z']],
  ritual:      [['path', 'M12 20.9 6.7 4.7 20.5 14.7H3.5L17.3 4.7Z'], ['ring', 12, 11.6, 9.6]],
  thoughtform: [['path', 'M4.4 4.6H19.6L12 15.9Z'], ['path', 'M12 7.4V12.4'], ['path', 'M2.4 16.1H21.6'], ['ring', 12, 20, 2.25]],
  materia:     [['path', 'M12 2.7 21.3 12 12 21.3 2.7 12Z'], ['fill', 'M12 7.9 16.1 12 12 16.1 7.9 12Z']],
  esoterica:   [['path', 'M12 2.9 19.9 7.5v9L12 21.1 4.1 16.5v-9Z'], ['path', 'M12 2.9v2.2M12 18.9v2.2'], ['ring', 12, 12, 3.3]],
  // the Touch mark; the Return button carries it, so return is the same glyph
  touch:       [['ring', 12, 12, 8.4], ['dot', 12, 12, 2.1]],
};
NAV.return = NAV.touch;
const SIGIL = [['path', 'M12 1.9 21.9 12 12 22.1 2.1 12Z'], ['path', 'M12 7.1 16.9 12 12 16.9 7.1 12Z'], ['path', 'M12 4.4V19.6']];
const SIGIL_PASSES = [['#6FA8FF', 0.55, -0.35], ['#9B7FE8', -0.4, 0.3], ['#E0526F', 0, 0]];   // colour, dx, dy

// ---- the private characters ----
export const GLYPH_NAMES = ['input', 'ritual', 'thoughtform', 'materia', 'esoterica', 'touch', 'return', 'sigil'];
const GLYPH_BASE = 0xE100;                 // one character per named glyph
const MOON_BASE = 0xE200, MOON_STEPS = 64; // the moon, in 64 phases
export const glyphChar = name => {
  const i = GLYPH_NAMES.indexOf(name);
  return i < 0 ? null : String.fromCharCode(GLYPH_BASE + i);
};
/** The moon at phase p (0 new, 0.5 full, 1 new again) as one character. */
export const moonChar = p => {
  const k = Math.round((((p % 1) + 1) % 1) * MOON_STEPS) % MOON_STEPS;
  return String.fromCharCode(MOON_BASE + k);
};
const INLINE = /[\uE100-\uE107\uE200-\uE23F]/;
const decode = code =>
  code >= MOON_BASE && code < MOON_BASE + MOON_STEPS ? { moon: (code - MOON_BASE) / MOON_STEPS }
  : code >= GLYPH_BASE && code < GLYPH_BASE + GLYPH_NAMES.length ? { name: GLYPH_NAMES[code - GLYPH_BASE] }
  : null;

// ---- drawing one glyph ----
const ADVANCE = 1.08;                      // a glyph's width, in ems
const paths = new Map();
const pathOf = d => { if(!paths.has(d)) paths.set(d, new Path2D(d)); return paths.get(d); };

function drawShapes(ctx, shapes, colour){
  for(const [kind, a, b, c] of shapes){
    if(kind === 'path') ctx.stroke(pathOf(a));
    else if(kind === 'fill'){ ctx.fillStyle = colour; ctx.fill(pathOf(a)); }
    else if(kind === 'ring'){ ctx.beginPath(); ctx.arc(a, b, c, 0, Math.PI * 2); ctx.stroke(); }
    else if(kind === 'dot'){ ctx.fillStyle = colour; ctx.beginPath(); ctx.arc(a, b, c, 0, Math.PI * 2); ctx.fill(); }
  }
}

/** Draws glyph `code` in an em box whose top-left is (x, top), `size` px tall. */
function drawGlyph(ctx, code, x, top, size, colour){
  const g = decode(code);
  if(!g) return;
  const s = size / 24;
  ctx.save();
  ctx.translate(x + size * (ADVANCE - 1) / 2, top);
  ctx.scale(s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = 1.7;
  ctx.shadowBlur = ctx.shadowBlur / s;       // keep any shadow the effect set in page pixels
  if(g.moon !== undefined){
    ctx.strokeStyle = colour; ctx.fillStyle = colour;
    ctx.beginPath(); ctx.arc(12, 12, 9.2, 0, Math.PI * 2); ctx.stroke();
    if(Math.min(g.moon, 1 - g.moon) > 0.015) ctx.fill(pathOf(litPath(g.moon, 12, 12, 9.2)));
  } else if(g.name === 'sigil'){
    // the sigil keeps its own whimsy colours, whatever the text colour is
    for(const [col, dx, dy] of SIGIL_PASSES){
      ctx.save(); ctx.translate(dx, dy); ctx.strokeStyle = col; ctx.lineWidth = 1.35;
      ctx.globalAlpha *= 0.9; drawShapes(ctx, SIGIL, col); ctx.restore();
    }
    ctx.fillStyle = '#E0526F'; ctx.beginPath(); ctx.arc(12, 12, 1.4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = colour;
    drawShapes(ctx, NAV[g.name], colour);
    // a second, fainter pass a hair off: the same unsteady hand as the UI
    ctx.globalAlpha *= 0.4; ctx.translate(0.35, -0.3);
    drawShapes(ctx, NAV[g.name], colour);
  }
  ctx.restore();
}

// ---- the wrapper around canvas text ----
const fontPx = ctx => { const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font || ''); return m ? +m[1] : 16; };
function parts(str){
  const out = []; let run = '';
  for(const ch of str){
    const code = ch.charCodeAt(0);
    if(ch.length === 1 && decode(code)){ if(run){ out.push({ text: run }); run = ''; } out.push({ code }); }
    else run += ch;
  }
  if(run) out.push({ text: run });
  return out;
}
// where the top of an em box sits for each baseline, as a fraction of size
const TOP = { top: 0, hanging: 0.05, middle: -0.5, alphabetic: -0.8, ideographic: -0.9, bottom: -1 };

let installed = false;
/** Wraps a 2D context prototype's text methods so inline glyphs work. */
export function installInlineGlyphs(proto){
  if(installed || !proto || !proto.fillText || typeof Path2D === 'undefined') return false;
  installed = true;
  const fill = proto.fillText, stroke = proto.strokeText, measure = proto.measureText;
  const widthOf = (ctx, str) => {
    const size = fontPx(ctx); let w = 0;
    for(const p of parts(str)) w += p.text ? measure.call(ctx, p.text).width : size * ADVANCE;
    return w;
  };
  proto.measureText = function(str){
    str = String(str);
    if(!INLINE.test(str)) return measure.call(this, str);
    // metrics of the text with glyphs stood in by 'M', but the true width
    const base = measure.call(this, str.replace(/[\uE100-\uE107\uE200-\uE23F]/g, 'M'));
    const out = {};
    for(const k of ['actualBoundingBoxAscent', 'actualBoundingBoxDescent', 'actualBoundingBoxLeft',
                    'actualBoundingBoxRight', 'fontBoundingBoxAscent', 'fontBoundingBoxDescent']) out[k] = base[k];
    out.width = widthOf(this, str);
    return out;
  };
  const draw = (orig, mode) => function(str, x, y, maxWidth){
    str = String(str);
    if(!INLINE.test(str)) return maxWidth === undefined ? orig.call(this, str, x, y) : orig.call(this, str, x, y, maxWidth);
    const size = fontPx(this), total = widthOf(this, str);
    const align = this.textAlign;
    let cx = align === 'center' ? x - total / 2 : (align === 'right' || align === 'end') ? x - total : x;
    const top = y + (TOP[this.textBaseline] ?? -0.8) * size;
    const savedAlign = this.textAlign; this.textAlign = 'left';
    const colour = mode === 'stroke' ? this.strokeStyle : this.fillStyle;
    for(const p of parts(str)){
      if(p.text){ orig.call(this, p.text, cx, y); cx += measure.call(this, p.text).width; }
      else { drawGlyph(this, p.code, cx, top, size, colour); cx += size * ADVANCE; }
    }
    this.textAlign = savedAlign;
  };
  proto.fillText = draw(fill, 'fill');
  proto.strokeText = draw(stroke, 'stroke');
  return true;
}

// in a browser, install at load; in tests there is no canvas prototype
if(typeof CanvasRenderingContext2D !== 'undefined') installInlineGlyphs(CanvasRenderingContext2D.prototype);
