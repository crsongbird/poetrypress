/**
 * pmlVars.js — §Variables in the poem, resolved BEFORE PML is parsed.
 *
 *   §Name            §SurfName
 *   §Name!param      §MoonPhase!tonight   §Glyph!materia
 *   §Name:number     §MoonPhase:0.0
 *
 * A variable becomes plain text — often PML itself, which the parser then
 * reads as if it had been typed — or an inline glyph (see glyphs.js).
 * Anything unknown is left exactly as written, so a typo shows on the page
 * instead of vanishing. \§ writes a literal §.
 *
 * Resolution applies to the poem only. Usernames, titles and every other
 * field are never passed through here.
 *
 * VARIABLES
 *   §SurfName           the surface texture's name ("None" when it is off)
 *   §SurfBlendMode      its blend mode
 *   §SurfParamsA        "Knob: [value]  Knob: [value]  Opacity: [moon]" as PML
 *   §SurfParamsB        the texture's hues, each drawn in its own colour, as PML
 *   §LightDir           the light's direction as an arrow, or n/a
 *   §TextureSeed        the seed
 *   §MoonPhase!tonight  tonight's real moon
 *   §MoonPhase!seed     the moon the Fractal Moon draws for this seed
 *   §MoonPhase!opacity  the texture opacity, as a moon
 *   §MoonPhase:x        x from -1 to 1: 0 is full, ±1 new; negative waxes,
 *                       positive wanes
 *   §Glyph!name         input ritual thoughtform materia esoterica touch
 *                       return sigil — drawn glyphs; whimsy sharpness chaos
 *                       — the element marks
 *   §Spell              the current look's glyph spell
 *   §Font               the typeface
 *   §Canvas             the page size, e.g. 3072×3072
 *   §TypeEffect         the typeface effect, or none
 *   §Today              today's date
 */
import { glyphChar, moonChar } from './glyphs.js';

const ELEMENTS = { whimsy: '♡', sharpness: '√', chaos: '∆', touch: '🜚' };
const TOKEN = /(\\?)§([A-Za-z]+)(?:!([A-Za-z0-9_-]+)|:(-?\d*\.?\d+))?/g;

/** p (0 new, 0.5 full, 1 new) from Ruby's scale: -1 new, 0 full, +1 new. */
export const phaseFromSigned = x => (Math.max(-1, Math.min(1, x)) + 1) / 2;

/**
 * ctx: everything the variables report, gathered by the renderer:
 *   surfName, blendName, lightArrow, seed, params:[{label, value}],
 *   opacity (0..100), hues:[{label, hex}], moonTonight, moonSeed (0..1 phases),
 *   spell, font, canvas, typeEffect
 */
export function resolvePmlVariables(text, ctx){
  if(!text || text.indexOf('§') === -1) return text;
  const one = (name, param, num) => {
    switch(name){
      case 'SurfName':      return ctx.surfName;
      case 'SurfBlendMode': return ctx.blendName;
      case 'LightDir':      return ctx.lightArrow;
      case 'TextureSeed':   return String(ctx.seed);
      case 'SurfParamsA':
        return [...(ctx.params || []).map(p => `${p.label}: [${p.value}]`),
                `Opacity: [${ctx.opacity}%] {§MoonPhase!opacity}`].join('  ');
      case 'SurfParamsB':
        return (ctx.hues || []).length
          ? ctx.hues.map(h => `${h.label}: <${h.hex}/#:${h.hex.replace('#', '')}>`).join('  ')
          : 'no hues';
      case 'MoonPhase': {
        if(num !== undefined) return moonChar(phaseFromSigned(parseFloat(num)));
        if(param === 'tonight') return moonChar(ctx.moonTonight);
        if(param === 'seed') return moonChar(ctx.moonSeed);
        if(param === 'opacity') return moonChar((ctx.opacity || 0) / 200);
        return null;
      }
      case 'Glyph':
        if(param && ELEMENTS[param.toLowerCase()] && param.toLowerCase() !== 'touch') return ELEMENTS[param.toLowerCase()];
        return param ? glyphChar(param.toLowerCase()) : null;
      case 'Spell':      return ctx.spell || '';
      case 'Font':       return ctx.font;
      case 'Canvas':     return ctx.canvas;
      case 'TypeEffect': return ctx.typeEffect;
      case 'Today':      return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      default:           return null;
    }
  };
  // two passes: §SurfParamsA expands to text that itself contains a variable
  let out = text;
  for(let pass = 0; pass < 2; pass++){
    out = out.replace(TOKEN, (m, esc, name, param, num) => {
      if(esc) return pass === 1 ? '§' + m.slice(2) : m;       // \§ stays literal
      const v = one(name, param, num);
      return v == null ? m : String(v);
    });
  }
  return out;
}
