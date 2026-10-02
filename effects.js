/**
 * effects.js — text effects, as ONE stack.
 *
 * An effect is { type, color, k1, k2, angle }: two knobs whose meaning
 * follows the type (like the texture knobs), and an angle where direction
 * matters. A stack is up to three, drawn in order beneath the glyphs.
 *
 * Page-wide, the stack comes from three effect slots in the UI. A segment can
 * replace it with  <text/fx:outline(#fff,4)+glow(#fd0,40,70)>  — arguments in
 * order: colour, knob 1, knob 2, angle (any may be left out). /fx:none clears.
 *
 * Underlines are not effects: they are segment DECORATIONS drawn by the
 * stitch library —  <text/under:wave>  or  /under:vine,#c33,150  (style,
 * colour, weight %).
 *
 * Older forms keep working exactly: the Outline/Shadow mode and the typeface
 * effect (saved looks, presets), and PML's /fx0 /fx1 /fx2 /effect — each is
 * translated into the stack here. The parser still records them as it always
 * did, so poems parse byte-identically (test/fixtures/pml-golden.json).
 *
 * Pure data and arithmetic: no DOM, no drawing.
 */

// knob: label, range, default, unit; px knobs are canonical pixels
export const EFFECT_DEFS = {
  none:        { label: 'None' },
  outline:     { label: 'Outline',      color: '#ffffff', k1: ['Width', 0, 40, 4, 'px'],    k2: ['Opacity', 0, 100, 100, '%'] },
  shadow:      { label: 'Drop Shadow',  color: '#000000', k1: ['Blur', 0, 80, 14, 'px'],   k2: ['Distance', 0, 80, 10, 'px'], angle: 45 },
  longshadow:  { label: 'Long Shadow',  color: '#000000', k1: ['Length', 0, 100, 40, '%'],  k2: ['Opacity', 0, 100, 60, '%'],  angle: 45 },
  glow:        { label: 'Glow',         color: '#fff3c4', k1: ['Radius', 0, 100, 40, '%'],  k2: ['Intensity', 0, 100, 70, '%'] },
  letterpress: { label: 'Letterpress',  k1: ['Depth', 0, 100, 40, '%'],   k2: ['Strength', 0, 100, 70, '%'], angle: 45 },
  bevel:       { label: 'Bevel',        k1: ['Depth', 0, 100, 40, '%'],   k2: ['Strength', 0, 100, 70, '%'], angle: 45 },
  chromatic:   { label: 'Chromatic',    k1: ['Spread', 0, 100, 30, '%'],  k2: ['Strength', 0, 100, 70, '%'], angle: 0 },
  doublestrike:{ label: 'Double Strike',k1: ['Offset', 0, 100, 30, '%'],  k2: ['Ink', 0, 100, 60, '%'],      angle: 20 },
  erosion:     { label: 'Erosion',      k1: ['Wear', 0, 100, 50, '%'],    k2: ['Grain', 0, 100, 40, '%'] },
};
export const EFFECT_TYPES = Object.keys(EFFECT_DEFS);

/** A complete effect of `type`, defaults filled in. */
export function makeEffect(type, color, k1, k2, angle){
  const d = EFFECT_DEFS[type] || EFFECT_DEFS.none;
  const num = (v, def) => (v === undefined || v === null || v === '' || isNaN(+v)) ? def : +v;
  return { type: EFFECT_DEFS[type] ? type : 'none',
           color: color || d.color || '#000000',
           k1: num(k1, d.k1 ? d.k1[3] : 0), k2: num(k2, d.k2 ? d.k2[3] : 0),
           angle: num(angle, d.angle != null ? d.angle : 0) };
}

/** PML: "outline(#fff,4)+glow(#fd0,40,70)" → a stack; "none" → empty. */
export function parseFxList(str){
  const out = [];
  for(const item of String(str).split('+')){
    const m = /^\s*([a-z]+)\s*(?:\(([^)]*)\))?\s*$/i.exec(item);
    if(!m) continue;
    const type = m[1].toLowerCase();
    if(type === 'none') return [];
    if(!EFFECT_DEFS[type]) continue;
    const a = (m[2] || '').split(',').map(s => s.trim());
    const color = a[0] && /^#?[0-9a-f]{3,8}$/i.test(a[0]) ? (a[0][0] === '#' ? a[0] : '#' + a[0]) : undefined;
    out.push(makeEffect(type, color, a[1], a[2], a[3]));
    if(out.length === 3) break;
  }
  return out;
}

/** PML: "wave,#c33,150" → an underline decoration. */
export function parseUnder(str, stitchStyles){
  const a = String(str).split(',').map(s => s.trim());
  const style = (a[0] || 'solid').toLowerCase();
  return { style: stitchStyles.includes(style) ? style : 'solid',
           color: a[1] && /^#?[0-9a-f]{3,8}$/i.test(a[1]) ? (a[1][0] === '#' ? a[1] : '#' + a[1]) : null,
           weight: a[2] && !isNaN(+a[2]) ? +a[2] : 100 };
}

// the old typeface effects that were really underlines
const LEGACY_UNDER = { doubleline: 'double', wavyline: 'wave', dottedline: 'dotted' };

/** An old typeface effect ({ name, strength, hue, angle, distance, grain })
 *  as one stack effect — or, for the old underline effects, an underline. */
export function legacyTypeEffect(name, strength, color, angle, distance, grain){
  if(!name || name === 'none') return {};
  if(LEGACY_UNDER[name]) return { under: { style: LEGACY_UNDER[name], color: null, weight: 100 } };
  const s = strength == null ? 60 : +strength, d = distance == null ? 100 : +distance;
  const map = {
    letterpress:  () => makeEffect('letterpress', null, Math.min(100, d*0.4), s, angle),
    longshadow:   () => makeEffect('longshadow', color, Math.min(100, d*0.4), s, angle),
    doublestrike: () => makeEffect('doublestrike', null, Math.min(100, d*0.3), s, angle),
    chromatic:    () => makeEffect('chromatic', null, Math.min(100, d*0.3), s, angle),
    halo:         () => makeEffect('glow', color, Math.min(100, d*0.4), s),
    bloom:        () => makeEffect('glow', color, Math.min(100, d*0.5), s),
    bevel:        () => makeEffect('bevel', null, Math.min(100, d*0.4), s, angle),
    erosion:      () => makeEffect('erosion', null, s, grain == null ? 40 : +grain),
  };
  return map[name] ? { fx: map[name]() } : {};
}

/** An old Outline/Shadow setting as one stack effect. */
export function legacyOutline(mode, color, width, blur, x, y){
  if(mode === 'outline' && +width > 0) return makeEffect('outline', color, +width, 100);
  if(mode === 'shadow'){
    const dx = +x || 0, dy = +y || 0;
    return makeEffect('shadow', color, +blur || 0, Math.hypot(dx, dy), Math.atan2(dy, dx)*180/Math.PI);
  }
  return null;
}

/** The whole effect stack, compressed onto one line for §TypeEffect. */
export function describeStack(stack, under){
  const parts = (stack || []).filter(e => e && e.type !== 'none').map(e => {
    const d = EFFECT_DEFS[e.type], bits = [d.label.toLowerCase()];
    if(d.k1) bits.push(`${Math.round(e.k1)}${d.k1[4]}`);
    if(d.k2) bits.push(`${Math.round(e.k2)}${d.k2[4]}`);
    if(d.angle != null) bits.push(`∠${Math.round(e.angle)}°`);
    if(d.color) bits.push(e.color);
    return bits.join(' ');
  });
  if(under) parts.push(`under ${under.style}`);
  return parts.length ? parts.join(' · ') : 'none';
}
