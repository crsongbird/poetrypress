/**
 * moon.js — the moon's phase, and a glyph to draw it.
 *
 * phase: 0 new · 0.25 first quarter · 0.5 full · 0.75 last quarter.
 * Calculated from the synodic month and a known new moon (2000-01-06 18:14
 * UTC); accurate to within a few hours, which is plenty for a glyph.
 */
export const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW = Date.UTC(2000, 0, 6, 18, 14) / 86400000;

export function moonPhase(date){
  const days = (date instanceof Date ? date.getTime() : +date) / 86400000;
  let p = ((days - KNOWN_NEW) % SYNODIC_DAYS) / SYNODIC_DAYS;
  return p < 0 ? p + 1 : p;
}

export const PHASE_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
                            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
export function phaseName(p){ return PHASE_NAMES[Math.round(p * 8) % 8]; }

/**
 * The lit part of the disc as an SVG path. The terminator is half an ellipse
 * whose width follows cos(2πp): it bulges toward the dark side as a crescent
 * and toward the lit side as a gibbous.
 */
export function litPath(p, cx, cy, r){
  const k = Math.cos(2 * Math.PI * p);            // 1 new · 0 quarter · -1 full
  const rx = Math.abs(k) * r;
  const waxing = p < 0.5;
  const outer = waxing ? 1 : 0;                   // down the lit side's rim
  const inner = (k > 0) === waxing ? 0 : 1;       // back up the terminator
  const f = n => +n.toFixed(2);
  return `M${f(cx)} ${f(cy - r)}A${f(r)} ${f(r)} 0 0 ${outer} ${f(cx)} ${f(cy + r)}` +
         `A${f(rx)} ${f(r)} 0 0 ${inner} ${f(cx)} ${f(cy - r)}Z`;
}

/**
 * A moon glyph: a thin rim with the lit part filled. The rim is drawn twice,
 * a hair apart, in the same unsteady hand as the navigation glyphs.
 *   lit    colour of the lit part (default: currentColor)
 *   rim    colour of the outline  (default: currentColor)
 */
export function moonGlyph(p, { size = 16, lit = 'currentColor', rim = 'currentColor', title = '' } = {}){
  const t = title ? `<title>${title}</title>` : '';
  const near = Math.min(p, 1 - p) < 0.02;          // new moon: nothing lit to fill
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ` +
         `class="moon-glyph" role="img" aria-label="${phaseName(p)}">${t}` +
         `<circle cx="12" cy="12" r="9.2" fill="none" stroke="${rim}" stroke-width="1.3" opacity="0.9"/>` +
         `<circle cx="12.35" cy="11.75" r="9.35" fill="none" stroke="${rim}" stroke-width="0.7" opacity="0.4"/>` +
         (near ? '' : `<path d="${litPath(p, 12, 12, 9.2)}" fill="${lit}"/>`) +
         `</svg>`;
}

/** The same glyph as a data: URI, for CSS backgrounds such as a slider thumb. */
export function moonGlyphURI(p, opts){
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(moonGlyph(p, opts));
}
