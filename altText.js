/**
 * altText.js — the saved image's ALT TEXT, written to be useful to someone
 * who cannot see it: the poem's own words first (no markup), then a few
 * plain English sentences on what the picture looks like — the typeface and
 * its colour, the background, the surface texture (what it is, how strong,
 * which colours, and its settings in words), the frame. At most 1500
 * characters: a long poem gives way before the description does.
 *
 *   describeLook(look) → the whole alt text      (look: see LookFacts below)
 *   colourName(hex)    → "deep plum", "pale gold", "near-black"…
 *
 * Everything here is plain data in, words out (no page access), so the
 * page gathers the facts (appEvents lookForAltText) and this writes them.
 */
export const ALT_MAX = 1500;

/** What each surface looks like, in a phrase (an image description, not a name). */
export const TEXTURE_LOOKS = {
  clouds: 'drifting haze and smoke', bokeh: 'soft, out-of-focus orbs of light', astral: 'a field of stars and nebula',
  magicparticles: 'swirling trails of sparkling dust', embers: 'flying sparks and embers', snow: 'falling snow',
  aurora: 'hanging curtains of aurora light', moon: 'a large moon among clouds', landscape: 'a painted range of hills and mountains',
  flowfield: 'flowing ink lines that never cross', suminagashi: 'marbled rings of floating ink', grain: 'fine film grain',
  metalleaf: 'scattered flakes of metal leaf', flowers: 'lotus blossoms floating on water', brushstrokes: 'broad, expressive brushstrokes',
  halftone: 'a halftone dot screen', rainstreaks: 'slanting streaks of hard rain', hatch: 'fine hatched pencil lines',
  cityscape: 'a city skyline at night, its windows lit, over water', guilloche: 'engraved rosettes, like those on a banknote',
  stainedglass: 'panes of stained glass held in lead', sigils: 'scattered hand-drawn sigils', mathnoise: 'a pattern of small binary glyphs',
  summoning: 'a transmutation circle of rings, stars and glyphs', inkbleed: 'a mirrored ink blot, like a Rorschach test',
  crackedglaze: 'cracked and crazed ceramic glaze', tessellate: 'a field of faceted triangles', cards: 'scattered tarot cards',
  blackhole: 'a black hole ringed by a bright, swirling disc', turing: 'organic spots and stripes, like animal skin or coral',
  chladni: 'sand gathered along the still lines of a vibrating plate', linen: 'woven linen cloth', coldpress: 'textured watercolour paper',
  spangle: 'crystalline metal spangle', crystal: 'faceted crystal', oldpaper: 'old, stained and folded paper', cupring: 'rings left by a cup',
  ash: 'charred paper, ash and embers', wax: 'pools of sealing wax', dunes: 'wind-rippled sand dunes', kintsugi: 'pottery mended with seams of gold',
  moss: 'moss growing on stone', water: 'rippling water', glassrain: 'raindrops running down a window', frost: 'feathery frost crystals',
  contour: 'a topographic map of contour lines', watercolour: 'soft washes of watercolour', athanor: 'a surface made in the Athanor node editor',
};

const BLEND_WORDS = {
  'source-over': 'laid over the page', 'screen': 'glowing over the page', 'lighten': 'glowing over the page', 'color-dodge': 'shining over the page',
  'multiply': 'printed into the page', 'darken': 'printed into the page', 'color-burn': 'burned into the page',
  'overlay': 'worked into the page', 'soft-light': 'softly worked into the page', 'hard-light': 'pressed into the page',
  'luminosity': 'laid over the page', 'color': 'tinting the page',
};
const EFFECT_WORDS = { outline: 'an outline', shadow: 'a drop shadow', longshadow: 'a long cast shadow', glow: 'a soft glow', letterpress: 'a letterpress impression',
  bevel: 'a raised bevel', chromatic: 'a red and blue colour split', doublestrike: 'a double strike', erosion: 'worn, eroded edges' };

// ---- colours, named as a person would ----
const hsl = hex => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(hex || '')); if(!m) return null;
  const r = parseInt(m[1], 16)/255, g = parseInt(m[2], 16)/255, b = parseInt(m[3], 16)/255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn)/2, d = mx - mn;
  if(d < 1e-6) return { h: 0, s: 0, l };
  const s = d/(1 - Math.abs(2*l - 1));
  let h = mx === r ? ((g - b)/d) % 6 : mx === g ? (b - r)/d + 2 : (r - g)/d + 4;
  h = (h*60 + 360) % 360;
  return { h, s, l };
};
const HUES = [[12, 'red'], [32, 'orange'], [46, 'amber'], [64, 'yellow'], [80, 'olive'], [150, 'green'], [178, 'teal'], [198, 'cyan'],
  [228, 'blue'], [255, 'indigo'], [285, 'violet'], [318, 'purple'], [342, 'magenta'], [361, 'red']];
/** A colour's everyday name: "deep plum", "pale gold", "warm grey", "near-black". */
export function colourName(hex){
  const c = hsl(hex); if(!c) return '';
  const { h, s, l } = c;
  if(l < 0.07) return 'near-black';
  if(l > 0.95 && s < 0.5) return 'white';
  if(s < 0.12){
    const tone = l < 0.25 ? 'charcoal' : l < 0.45 ? 'dark grey' : l < 0.7 ? 'grey' : l < 0.88 ? 'light grey' : 'off-white';
    return s > 0.04 ? (h < 70 || h > 300 ? 'warm ' : 'cool ') + tone : tone;
  }
  let name = HUES.find(([lim]) => h < lim)[1];
  // the colours that have names of their own
  if((name === 'orange' || name === 'amber') && l < 0.35) name = 'brown';
  if(name === 'amber' && l >= 0.35 && l < 0.7 && s > 0.45) name = 'gold';
  if((name === 'red' || name === 'magenta') && l > 0.62) name = 'pink';
  if(name === 'orange' && l > 0.68) name = 'peach';
  if((name === 'orange' || name === 'amber') && s < 0.55 && l >= 0.45 && l <= 0.8) name = 'tan';
  if(name === 'purple' && l < 0.3) name = 'plum';
  if((name === 'orange' || name === 'amber' || name === 'yellow') && l > 0.82 && s < 0.6) name = 'cream';
  if(name === 'blue' && l < 0.25) name = 'navy';
  if(name === 'red' && l < 0.3) name = 'maroon';
  const light = l < 0.2 ? 'very dark ' : l < 0.35 ? 'deep ' : l > 0.85 ? 'very pale ' : l > 0.7 ? 'pale ' : '';
  const sat = s < 0.3 && !['brown', 'cream', 'plum', 'navy', 'maroon', 'tan', 'peach'].includes(name) ? 'muted ' : s > 0.85 && l > 0.35 && l < 0.7 ? 'vivid ' : '';
  return (light + sat + name).replace(/^very pale cream$/, 'cream').trim();
}
const unique = list => list.filter((x, i) => x && list.indexOf(x) === i);
const andList = list => list.length < 2 ? (list[0] || '') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
const amount = (v, min, max) => { const p = (v - min)/Math.max(1e-6, max - min); return p < 0.2 ? 'very low' : p < 0.4 ? 'low' : p < 0.6 ? 'medium' : p < 0.8 ? 'high' : 'very high'; };
/** Where light comes from, by the dial's degrees (0: above, clockwise). */
export function lightFrom(deg, tilt){
  if(tilt != null && tilt < 25) return 'from overhead';
  const dirs = ['above', 'the upper right', 'the right', 'the lower right', 'below', 'the lower left', 'the left', 'the upper left'];
  return 'from ' + dirs[Math.round((((+deg || 0) % 360) + 360) % 360/45) % 8];
}

/**
 * LookFacts: {
 *   poem: [plain lines], font, textColours: [hex], effects: [type],
 *   background: [hex], surface: null | { type, name, reading, element, opacity, blend,
 *     knobs: [{label, value, min, max}], hues: [hex], light: null | {deg, tilt} },
 *   base: null | { name }, border: null | { colour, stitch }, box: bool, vignette: bool
 * }
 */
export function describeLook(L){
  const s = [];
  s.push('An image created with Unfixable Vellum (PoetryPress), an open source art tool.');
  // the words
  const tc = unique((L.textColours || []).map(colourName)), fx = unique((L.effects || []).map(e => EFFECT_WORDS[e]));
  const bg = unique((L.background || []).map(colourName));
  let t = 'The poem is set in ' + (L.font || 'a serif typeface');
  if(tc.length) t += ', in ' + andList(tc);
  if(fx.length) t += ', with ' + andList(fx);
  if(bg.length) t += ', on a ' + (bg.length > 1 ? bg[0] + ' background shading to ' + andList(bg.slice(1)) : bg[0] + ' background');
  s.push(t + '.');
  // the surface
  const S = L.surface;
  if(S){
    const what = TEXTURE_LOOKS[S.type] || 'a texture';
    const strength = S.opacity < 35 ? 'faintly ' : S.opacity > 80 ? 'strongly ' : '';
    let u = `Its surface is ${S.name}${S.reading ? ` (its ${S.reading} reading${S.element ? ', ' + S.element : ''})` : ''}: ${what}, ${strength}${BLEND_WORDS[S.blend] || 'laid over the page'}`;
    const hc = unique((S.hues || []).map(colourName)).filter(n => n !== 'white' && n !== 'near-black');
    if(hc.length) u += ', in ' + andList(hc);
    if(S.light) u += ', lit ' + lightFrom(S.light.deg, S.light.tilt);
    s.push(u + '.');
    const k = (S.knobs || []).filter(x => x && x.label && isFinite(x.value) && x.max > x.min).map(x => `${x.label.toLowerCase()} ${amount(x.value, x.min, x.max)}`);
    if(k.length) s.push('Its settings: ' + k.join(', ') + '.');
  }
  if(L.base) s.push(`Beneath it, a second surface: ${L.base.name}.`);
  const frame = [];
  if(L.border) frame.push(`a ${L.border.stitch && L.border.stitch !== 'solid' ? L.border.stitch + ' ' : ''}border in ${colourName(L.border.colour) || 'a single colour'}`);
  if(L.box) frame.push('an inset panel behind the words');
  if(L.vignette) frame.push('darkened edges');
  if(frame.length) s.push('The page has ' + andList(frame) + '.');
  const desc = s.join(' ');
  // the poem first; it gives way (cut at a line, then a word) before the description does
  const poem = (L.poem || []).map(x => String(x).trim()).filter(Boolean).join('\n');
  const room = ALT_MAX - desc.length - 2;
  let words = poem;
  if(words.length > room){
    words = room > 1 ? words.slice(0, Math.max(0, room - 1)) : '';
    const cut = Math.max(words.lastIndexOf('\n'), words.lastIndexOf(' '));
    if(cut > room*0.6) words = words.slice(0, cut);
    words = words ? words.trimEnd() + '…' : '';
  }
  return (words ? words + '\n\n' + desc : desc).slice(0, ALT_MAX);
}
