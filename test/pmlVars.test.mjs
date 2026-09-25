/**
 * pmlVars.test.mjs — §Variables, inline glyphs, the opacity moon, and the
 * colour picker's pointer.
 *
 * Run: node test/pmlVars.test.mjs
 */
import { readFileSync } from 'fs';
const { resolvePmlVariables, phaseFromSigned } = await import('../pmlVars.js');
const G = await import('../glyphs.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const ctx = { surfName: 'Lotus Pond', blendName: 'Hard Light', lightArrow: '↘', seed: 4242,
  params: [{ label: 'Bloom Size', value: '210%' }, { label: 'Bloom Count', value: '15' }], opacity: 95,
  hues: [{ label: 'Light Bloom Hue', hex: '#E0B38D' }], moonTonight: 0.43, moonSeed: 0.2,
  spell: '🜁🜂', font: 'Cormorant', canvas: '3072×3072', typeEffect: 'none' };
const R = t => resolvePmlVariables(t, ctx);

// ---- resolution ----
check('names resolve', R('[§SurfName] §SurfBlendMode §LightDir §TextureSeed') === '[Lotus Pond] Hard Light ↘ 4242');
check('§SurfParamsA expands to PML with the knobs and an opacity moon',
  R('§SurfParamsA') === 'Bloom Size: [210%]  Bloom Count: [15]  Opacity: [95%] {' + G.moonChar(95/200) + '}');
check('§SurfParamsB draws each hue in its own colour', R('§SurfParamsB') === 'Light Bloom Hue: <#E0B38D/#:E0B38D>');
check('unknown variables are left visible, not swallowed', R('§Nope!x and §Also') === '§Nope!x and §Also');
check('\\§ writes a literal §', R('\\§SurfName') === '§SurfName');
check('text without § passes through untouched, and fast', R('plain *PML* [here]') === 'plain *PML* [here]');

// ---- the moon scale: -1 new, 0 full, +1 new ----
check('0 is full', phaseFromSigned(0) === 0.5);
check('-1 and +1 are both new', phaseFromSigned(-1) === 0 && phaseFromSigned(1) === 1);
check('negative waxes, positive wanes', phaseFromSigned(-0.5) === 0.25 && phaseFromSigned(0.5) === 0.75);
check('§MoonPhase:0.0 is the full moon', R('§MoonPhase:0.0') === G.moonChar(0.5));
check('§MoonPhase!tonight and !seed read their phases',
  R('§MoonPhase!tonight') === G.moonChar(0.43) && R('§MoonPhase!seed') === G.moonChar(0.2));

// ---- glyphs ----
for(const n of ['input','ritual','thoughtform','materia','esoterica','touch','return','sigil'])
  check(`§Glyph!${n} resolves to a drawn glyph`, R(`§Glyph!${n}`) === G.glyphChar(n) && /[\uE100-\uE107]/.test(R(`§Glyph!${n}`)));
check('element marks resolve as characters', R('§Glyph!whimsy §Glyph!sharpness §Glyph!chaos') === '♡ √ ∆');

// ---- the canvas wrapper: glyphs measure as a glyph's width and draw as shapes ----
globalThis.Path2D = class { constructor(d){ this.d = d; } };
const calls = [];
const proto = {
  font: '20px serif', textAlign: 'left', textBaseline: 'alphabetic', fillStyle: '#fff', strokeStyle: '#fff',
  globalAlpha: 1, shadowBlur: 0, lineWidth: 1,
  measureText(s){ return { width: s.length * 10 }; },
  fillText(s, x, y){ calls.push(['text', s, x]); }, strokeText(s, x, y){ calls.push(['stroke', s, x]); },
  save(){}, restore(){}, translate(){}, scale(){}, beginPath(){}, arc(){}, fill(){ calls.push(['shape']); },
  stroke(){ calls.push(['shape']); },
};
check('the wrapper installs', G.installInlineGlyphs(proto) === true);
const glyph = G.glyphChar('materia');
check('a glyph measures as 1.08em beside the text around it',
  proto.measureText('ab' + glyph + 'cd').width === 20 + 20 * 1.08 + 20);
calls.length = 0;
proto.fillText('ab' + glyph + 'cd', 100, 50);
const texts = calls.filter(c => c[0] === 'text');
check('the text around a glyph is drawn as text, split at the glyph',
  texts.length === 2 && texts[0][1] === 'ab' && texts[1][1] === 'cd');
check('the text after the glyph starts past the glyph', Math.abs(texts[1][2] - (100 + 20 + 20 * 1.08)) < 1e-9);
check('the glyph itself is drawn as shapes', calls.some(c => c[0] === 'shape'));
calls.length = 0;
proto.fillText('no glyphs here', 0, 0);
check('text without glyphs goes straight to the original', calls.length === 1 && calls[0][1] === 'no glyphs here');

// ---- only the poem is resolved ----
const cr = src('canvasRenderer.js');
check('the renderer resolves the poem, before parsing it',
  /const rawText = resolvePmlVariables\(\$\('poemText'\)\.value, pmlVarContext\(W, H\)\);/.test(cr));
check('nothing else is resolved', (cr.match(/resolvePmlVariables\(/g) || []).length === 1);
check('the glyph modules are bundled before the renderer',
  (b => b.indexOf("'glyphs.js'") < b.indexOf("'canvasRenderer.js'") && b.indexOf("'pmlVars.js'") < b.indexOf("'canvasRenderer.js'"))(src('build.mjs')));

// ---- the opacity moon ----
const ev = src('appEvents.js'), css = src('poetrypress.css');
check('the opacity readout is a waxing moon, not a percentage',
  /out\.innerHTML = moonGlyph\(pct \/ 200/.test(ev) && !/textureOpacityVal'\)\.textContent/.test(ev));
check('the slider itself stays native (styling its thumb broke it into a white box)',
  !/#textureOpacity::-(webkit-slider|moz-range)-thumb/.test(css));

// ---- the picker points at its field ----
check('the field being edited is ringed', /markPicking\(t, true\)/.test(ev) && /\.is-picking\{/.test(css));
check('the picker grows a tail toward the field', /ptr\.dataset\.dir = up \? 'up' : 'down'/.test(ev) && /#clrPointer\[data-dir="up"\]/.test(css));
check('on a phone the field is scrolled into view above the picker first',
  /scroller\.scrollBy\(\{ top: f\.bottom - p\.top \+ 28/.test(ev));
check('closing the picker clears the ring and the tail', /markPicking\(t, false\)/.test(ev) && /ptr\.hidden = true/.test(ev));

// ---- getTextureCanvas takes NAMED options ----
{
  const fs = await import('fs');
  const files = fs.readdirSync(new URL('..', import.meta.url)).filter(f => f.endsWith('.js'));
  const positional = [];
  for(const f of files){
    const code = src(f);
    for(const m of code.matchAll(/getTextureCanvas\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)){
      if(/^type, w, h, opts/.test(m[1])) continue;                  // the definition
      const parts = m[1].split(',');
      if(parts.length > 3 && !/\{/.test(m[1])) positional.push(f);
    }
  }
  check('no call passes texture options by position (a tint twice landed in the light slot)', positional.length === 0);
  check('the Deep Field stars receive their tint as a tint',
    /getTextureCanvas\('astral_stars', W, H, \{[^}]*\btint1\b[^}]*\}\)/.test(cr));
  check('the dead invert path is gone', !/invertTextureCanvas|invert \? '_inv'/.test(src('textureGenerators.js') + src('texCore.js')));
}

// ---- the editor highlights §Variables without moving text ----
{
  const { highlightDocument } = await import('../editor.js');
  const t = '[§SurfName] <§MoonPhase:-0.5/f:12> \\§Plain §Glyph!materia';
  const h = highlightDocument(t);
  const text = h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\u200b/g, '');
  check('§Variables are highlighted, in and out of segments', (h.match(/pml-var"/g) || []).length === 3);
  check('their !param and :number are highlighted too', (h.match(/pml-varp/g) || []).length === 2);
  check('an escaped \\§ is not a variable', !/pml-var">§Plain/.test(h));
  check('highlighting never changes the text', text === t);
  check('the variable colours cannot move text',
    !/\.pml-varp?\s*\{[^}]*(font-weight|letter-spacing|padding|margin)/.test(css));
}

// ---- `code` segments ----
{
  const P = await import('../textParsers.js');
  const r = resolvePmlVariables('Seed `§TextureSeed **not bold** [x] §Glyph!fire` after', { seed: 4242 });
  const part = P.buildLines(r, true, true)[0].parts.find(p => p.code);
  check('backticks become a code segment', !!part);
  check('inside code, PML prints literally and variables resolve — except glyphs',
    part && part.segments.map(x => x.text).join('') === '4242 **not bold** [x] §Glyph!fire');
  check('an escaped backtick is not code', !/code/.test(resolvePmlVariables('a \\`b\\` c', {})));
  check('poems without code parse with no code key at all (the golden fixture stays exact)',
    !('code' in P.buildLines('<a/#:ff0000> plain', true, true)[0].parts[0]));
  check('code is drawn on a backdrop that reads the page behind it',
    /const px = ctx\.getImageData\(/.test(cr) && /const light = behind < 0\.5;/.test(cr));
  check('code segments are measured in the code face they are drawn in',
    /const partFontDef = part\.code \? CODE_FONT/.test(cr) && /const partFont = p => p\.code \? CODE_FONT/.test(cr));
}

// ---- spell glyphs by name ----
check('every spell glyph can be named: §Glyph!fire §Glyph!salt §Glyph!black-moon-lilith',
  R('§Glyph!fire §Glyph!salt §Glyph!black-moon-lilith') === '🜂 🜔 ⚸');
check('names are case-insensitive', R('§Glyph!FIRE') === '🜂');
check('the poem fonts fall back to the symbol fonts, so spell glyphs draw', /\$\{GLYPH_FONT\}`;/.test(cr));

// ---- performance: a phone must survive every knob at every setting ----
{
  const tg = src('textureGenerators.js'), tu = src('tunables.js');
  check('the texture cache is bounded by memory, not only by count',
    /total > TEXTURES\.cachePixels/.test(tg) && /cachePixels: 3072 \* 3072 \* 3/.test(tu));
  check('Cold Press caps its pits (uncapped, its smallest tooth made millions of calls)',
    /const MAX_PITS = 16000;/.test(src('texTouch.js')));
  check('the Sparkler is a fifth of its old count', /\(w\*h\)\/130000 \* amt/.test(src('texWhimsy.js')));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
