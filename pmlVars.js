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
 *   §SeedPhrase         the seed as words ("Enceladus's quiet lantern, turning")
 *   §MoonPhase!tonight  tonight's real moon
 *   §MoonPhase!seed     the moon the Fractal Moon draws for this seed
 *   §MoonPhase!opacity  the texture opacity, as a moon
 *   §MoonPhase:x        x from -1 to 1: 0 is full, ±1 new; negative waxes,
 *                       positive wanes
 *   §Glyph!name         input ritual thoughtform materia esoterica touch
 *                       return sigil — drawn glyphs; whimsy sharpness chaos
 *                       — the element marks; and every spell glyph by its
 *                       Unicode name: fire water air earth gold salt sulfur
 *                       black-moon-lilith … (see GLYPH_BY_NAME in spell.js)
 *   §Spell              the current look's glyph spell
 *   §SpellName          the name of the preset or saved spell last applied
 *   §Font               the typeface
 *   §Canvas             the page size, e.g. 3072×3072
 *   §TypeEffect         the typeface effect, or none
 *   §Today              today's date
 *   §UVIcon             the Unfixable Vellum sigil, as on the app icon
 *   §RenderMs           how long the last render took, in milliseconds
 *   §Profile            that time by stage: backdrop+texture · frame · text · marks
 *   §Scale              this render's size against the export (1 = full size)
 *   §CacheMB            memory held by the texture cache, in megabytes
 *   §Fonts              how many typeface families have been fetched
 *   §Build              which build this is (stamped by build.mjs)
 *
 * `code` — backticks mark a code segment: its PML prints literally, its
 * §Variables resolve except §Glyph and §MoonPhase, and it is drawn in a
 * monospace face on a backdrop that contrasts with the page behind it.
 */
import { glyphChar, moonChar } from './glyphs.js';
import { GLYPH_BY_NAME } from './spell.js';
import { RELEASE } from './release.js';

// The release's name always (release.js), and — when built — the date and a
// hash of the code. A page served from the source files, unbuilt, still names
// its release instead of showing the bare placeholder.
const STAMP = '__BUILD_STAMP__';
export const BUILD = RELEASE + (STAMP.startsWith('__') ? '' : ' · ' + STAMP);

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
  if(!text || (text.indexOf('§') === -1 && text.indexOf('`') === -1)) return text;
  const one = (name, param, num) => {
    switch(name){
      case 'SurfName':      return ctx.surfName;
      case 'SurfBlendMode': return ctx.blendName;
      case 'LightDir':      return ctx.lightArrow;
      case 'TextureSeed':   return String(ctx.seed);
      case 'SeedPhrase':    return ctx.seedPhrase || String(ctx.seed);
      case 'SurfParamsA':
        // every knob by its own label (Form, Weave, Aperture… — no more "Hidden Value")
        return [...(ctx.params || []).map(p => `${p.label}: [${p.value}]`),
                `Opacity: [${ctx.opacity}%] {§MoonPhase!opacity}`].join('  ');
      case 'SurfParamsB': {
        const hs = (ctx.hues || []).map(h => `${h.label}: <${h.hex}/#:${h.hex.replace('#', '')}>`);
        if(!hs.length) return 'no hues';
        // a grid, so a long list never runs off the line (Ruby): up to three
        // on one line; four are 2×2, five 3+2, six 3+3, more in threes. Rows
        // break with ROW_BREAK; each new row repeats the line's own marker.
        const cols = hs.length <= 3 ? hs.length : hs.length <= 6 ? Math.ceil(hs.length/2) : 3, rows = [];
        for(let i = 0; i < hs.length; i += cols) rows.push(hs.slice(i, i + cols).join('  '));
        return rows.join(ROW_BREAK);
      }
      case 'MoonPhase': {
        if(num !== undefined) return moonChar(phaseFromSigned(parseFloat(num)));
        if(param === 'tonight') return moonChar(ctx.moonTonight);
        if(param === 'seed') return moonChar(ctx.moonSeed);
        if(param === 'opacity') return moonChar((ctx.opacity || 0) / 200);
        return null;
      }
      case 'UVIcon':     return glyphChar('sigil');          // the Vellum sigil, in its own colours
      case 'Glyph': {
        if(!param) return null;
        const k = param.toLowerCase();
        // the app's drawn glyphs first, then the element marks, then every
        // spell glyph by its Unicode name
        return glyphChar(k) || (k !== 'touch' && ELEMENTS[k]) || GLYPH_BY_NAME[k] || null;
      }
      case 'Spell':      return ctx.spell || '';
      case 'SpellName':  return ctx.spellName || 'Unnamed Look';
      case 'Font':       return ctx.font;
      case 'Canvas':     return ctx.canvas;
      case 'TypeEffect': return ctx.typeEffect;
      case 'Scale':      return ctx.scale == null ? '1' : String(+(+ctx.scale).toFixed(3));
      case 'Profile':    return ctx.profile || '';
      case 'RenderMs':   return ctx.renderMs == null ? '' : String(ctx.renderMs);
      case 'CacheMB':    return ctx.cacheMB == null ? '' : String(ctx.cacheMB);
      case 'Fonts':      return ctx.fonts == null ? '' : String(ctx.fonts);
      case 'Build':      return BUILD;
      case 'Today':      return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      default:           return null;
    }
  };
  // `code`: PML inside is NOT applied — every PML character is escaped, so it
  // prints literally — and §Variables resolve, except the drawn ones (§Glyph,
  // §MoonPhase), which stay as their names. The span becomes a /code segment.
  let out = text.replace(/(^|[^\\])`([^`\n]*)`/g, (m, pre, inner) => {
    const resolved = inner.replace(TOKEN, (t, esc, name, param, num) => {
      if(esc || name === 'Glyph' || name === 'MoonPhase') return t;
      const v = one(name, param, num); return v == null ? t : String(v);
    });
    const literal = resolved.replace(/[\\*_~\[\]{}<>\/]/g, ch => '\\' + ch).replace(/§/g, '\\§');
    return `${pre}<${literal}/code>`;
  });
  // two passes: §SurfParamsA expands to text that itself contains a variable
  for(let pass = 0; pass < 2; pass++){
    out = out.replace(TOKEN, (m, esc, name, param, num) => {
      if(esc) return pass === 1 ? '§' + m.slice(2) : m;       // \§ stays literal
      const v = one(name, param, num);
      return v == null ? m : String(v);
    });
  }
  // a variable that broke into rows: each row its own line, carrying the
  // marker its line began with (## heading, -# small…)
  if(out.indexOf(ROW_BREAK) !== -1)
    out = out.split('\n').map(line => {
      if(line.indexOf(ROW_BREAK) === -1) return line;
      const lead = (line.match(/^\s*(?:#{1,6}|-#|>)\s+/) || [''])[0];
      return line.split(ROW_BREAK).join('\n' + lead);
    }).join('\n');
  return out;
}
const ROW_BREAK = '\u0001';
