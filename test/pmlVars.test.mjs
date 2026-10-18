/**
 * pmlVars.test.mjs — §Variables (pmlVars.js): what each resolves to, the moon
 * scale, glyphs by name, `code` segments, the editor's highlighting of them,
 * and the inline-glyph wrapper that draws them on a canvas (glyphs.js).
 *
 * Run: node test/pmlVars.test.mjs
 */
import { readFileSync } from 'fs';
const { resolvePmlVariables, phaseFromSigned, BUILD } = await import('../pmlVars.js');
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
check('§SurfParamsA names every knob, the third and beyond too',
  (() => { const t = resolvePmlVariables('§SurfParamsA', { params: [{ label: 'Focal Plane', value: '70%' }, { label: 'Orb Count', value: '67' }, { label: 'Aperture', value: 'Round' }, { label: 'Object Shape', value: 'Flower' }, { label: 'Color Variation', value: '120°' }], opacity: 50 });
    return t.includes('Object Shape: [Flower]') && t.includes('Color Variation: [120°]'); })());
check('§SurfParamsB draws each hue in its own color', R('§SurfParamsB') === 'Light Bloom Hue: <#E0B38D/#:E0B38D>');
check('§SurfParamsB lays hues out in rows (5 → 3 + 2), and a -# prefix carries to each row',
  resolvePmlVariables('§SurfParamsB', { hues: [1,2,3,4,5].map(i => ({ label: 'H'+i, hex: '#00000'+i })) }).split('\n').length === 2
  && resolvePmlVariables('-# §SurfParamsB', { hues: [1,2,3,4].map(i => ({ label: 'H'+i, hex: '#00000'+i })) }).split('\n')[1].startsWith('-# '));
check('unknown variables are left visible, not swallowed', R('§Nope!x and §Also') === '§Nope!x and §Also');
check('\\§ writes a literal §', R('\\§SurfName') === '§SurfName');
check('text without § passes through untouched', R('plain *PML* [here]') === 'plain *PML* [here]');
check('§SpellName names the look last applied', R('§SpellName') === 'Unnamed Look' &&
  resolvePmlVariables('§SpellName', { spellName: 'Lotus Bloom' }) === 'Lotus Bloom');
check('§RenderMs, §CacheMB, §Fonts, §Profile and §Scale report the machinery',
  resolvePmlVariables('§RenderMs|§CacheMB|§Fonts', { renderMs: 42, cacheMB: '37.7', fonts: 3 }) === '42|37.7|3'
  && resolvePmlVariables('§Profile', { profile: 'text 4 ms' }) === 'text 4 ms'
  && resolvePmlVariables('§Scale', { scale: 1 }) === '1' && resolvePmlVariables('§Scale', { scale: 1/3 }) === '0.333');
{
  const E = await import('../effects.js');
  check('§TypeEffect lists the whole effect stack, compressed', E.describeStack([E.makeEffect('glow', '#fd0', 40, 70)]) === 'glow 40% 70% #fd0');
}
{
  const off = { ...ctx, surfName: 'None', surfOff: true };
  const t = 'Uses Surface: "[§SurfName]"\n<§SurfParamsA/scale:90>\nBlend Mode: [§SurfBlendMode]  Light: [§LightDir]\n§SurfParamsB\n-# Seed: [§SeedPhrase] · §TextureSeed\nAfter';
  check('with the surface off, its readout lines step aside (Uses Surface: None stays; knobs, hues, light and seed go)',
    resolvePmlVariables(t, off) === 'Uses Surface: "[None]"\nAfter' && R(t).split('\n').length >= 6);
}

// ---- §Build: the release's name ----
{
  const T = await import('../textParsers.js');
  check('§Build names the release (a moon of Jupiter or Saturn), even unbuilt', /^(Jupiter|Saturn)–\w+/.test(BUILD) && resolvePmlVariables('§Build', {}) === BUILD);
  // a slash in the stamp was read as a directive, leaving only "Jupiter": the name is written with an en dash
  const line = T.buildLines(resolvePmlVariables('<[\\<§Build\\>]/right/basis:140>', {}), true, true)[0];
  const text = (line.parts || [{ segments: line.segments }]).flatMap(p => p.segments).map(s => s.text).join('');
  check('the build stamp prints whole inside a segment with directives', text.includes(BUILD));
}

// ---- the moon scale: -1 new, 0 full, +1 new ----
check('0 is full', phaseFromSigned(0) === 0.5);
check('-1 and +1 are both new', phaseFromSigned(-1) === 0 && phaseFromSigned(1) === 1);
check('negative waxes, positive wanes', phaseFromSigned(-0.5) === 0.25 && phaseFromSigned(0.5) === 0.75);
check('§MoonPhase:0.0 is the full moon', R('§MoonPhase:0.0') === G.moonChar(0.5));
check('§MoonPhase!tonight and !seed read their phases',
  R('§MoonPhase!tonight') === G.moonChar(0.43) && R('§MoonPhase!seed') === G.moonChar(0.2));

// ---- glyphs by name ----
for(const n of ['input','ritual','thoughtform','materia','esoterica','touch','return','sigil'])
  check(`§Glyph!${n} resolves to a drawn glyph`, R(`§Glyph!${n}`) === G.glyphChar(n) && /[-]/.test(R(`§Glyph!${n}`)));
check('element marks resolve as characters', R('§Glyph!whimsy §Glyph!sharpness §Glyph!chaos') === '♡ √ ∆');
check('every spell glyph can be named: §Glyph!fire §Glyph!salt §Glyph!black-moon-lilith',
  R('§Glyph!fire §Glyph!salt §Glyph!black-moon-lilith') === '🜂 🜔 ⚸');
check('names are case-insensitive', R('§Glyph!FIRE') === '🜂');
check('§UVIcon draws the sigil', R('§UVIcon') === R('§Glyph!sigil'));

// ---- only the poem is resolved ----
{
  const cr = src('canvasRenderer.js');
  // three times: to draw, with live numbers by their shape (the fit's key), and for the alt text
  check('nothing but the poem is resolved, and it is resolved before it is parsed',
    (cr.match(/resolvePmlVariables\(/g) || []).length === 3 && (cr.match(/resolvePmlVariables\(\$\('poemText'\)\.value, /g) || []).length === 3
    && /const rawText = resolvePmlVariables\(\$\('poemText'\)\.value, varCtx\);/.test(cr));
}

// ---- `code` segments ----
{
  const P = await import('../textParsers.js');
  const r = resolvePmlVariables('Seed `§TextureSeed **not bold** [x] §Glyph!fire` after', { seed: 4242 });
  const part = P.buildLines(r, true, true)[0].parts.find(p => p.code);
  check('backticks become a code segment', !!part);
  check('inside code, PML prints literally and variables resolve, except glyphs',
    part && part.segments.map(x => x.text).join('') === '4242 **not bold** [x] §Glyph!fire');
  check('an escaped backtick is not code', !/code/.test(resolvePmlVariables('a \\`b\\` c', {})));
  check('poems without code parse with no code key at all (the golden fixture stays exact)',
    !('code' in P.buildLines('<a/#:ff0000> plain', true, true)[0].parts[0]));
}

// ---- the editor highlights §Variables without moving text ----
{
  const { highlightDocument } = await import('../editor.js');
  const t = '[§SurfName] <§MoonPhase:-0.5/f:12> \\§Plain §Glyph!materia';
  const h = highlightDocument(t);
  const text = h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/​/g, '');
  check('§Variables are highlighted, in and out of segments', (h.match(/pml-var"/g) || []).length === 3);
  check('their !param and :number are highlighted too', (h.match(/pml-varp/g) || []).length === 2);
  check('an escaped \\§ is not a variable', !/pml-var">§Plain/.test(h));
  check('highlighting never changes the text', text === t);
  check('the variable colors cannot move text (the editor\'s mirror must match the textarea)',
    !/\.pml-varp?\s*\{[^}]*(font-weight|letter-spacing|padding|margin)/.test(src('poetrypress.css')));
}

// ---- the inline-glyph wrapper: glyphs measure as a glyph's width and draw as shapes ----
{
  globalThis.Path2D = class { constructor(d){ this.d = d; } };
  const calls = [];
  const proto = {
    font: '20px serif', textAlign: 'left', textBaseline: 'alphabetic', fillStyle: '#fff', strokeStyle: '#fff',
    globalAlpha: 1, shadowBlur: 0, lineWidth: 1,
    measureText(s){ return { width: s.length * 10 }; },
    fillText(s, x){ calls.push(['text', s, x]); }, strokeText(s, x){ calls.push(['stroke', s, x]); },
    save(){}, restore(){}, translate(){}, scale(){}, beginPath(){}, arc(){}, fill(){ calls.push(['shape']); },
    stroke(){ calls.push(['shape']); },
  };
  check('the wrapper installs once per prototype', G.installInlineGlyphs(proto) === true && G.installInlineGlyphs(proto) === false);
  const glyph = G.glyphChar('materia');
  check('a glyph measures as 1.08em beside the text around it', proto.measureText('ab' + glyph + 'cd').width === 20 + 20 * 1.08 + 20);
  calls.length = 0;
  proto.fillText('ab' + glyph + 'cd', 100, 50);
  const texts = calls.filter(c => c[0] === 'text');
  check('the text around a glyph is drawn as text, split at the glyph', texts.length === 2 && texts[0][1] === 'ab' && texts[1][1] === 'cd');
  check('the text after the glyph starts past the glyph', Math.abs(texts[1][2] - (100 + 20 + 20 * 1.08)) < 1e-9);
  check('the glyph itself is drawn as shapes', calls.some(c => c[0] === 'shape'));
  calls.length = 0;
  proto.fillText('no glyphs here', 0, 0);
  check('text without glyphs goes straight to the original', calls.length === 1 && calls[0][1] === 'no glyphs here');
}

// ---- named styles (Saturn–Phoebe) ----
{
  const out = resolvePmlVariables('§style ember = /color:ember/op:80\n§style hot = /@ember /glass\n<embers/@hot/s:120> and <x/@nope>\n`a /@ember`', {});
  check('a style line is not drawn', !/§style/.test(out));
  check('a style stands for its directives, one style using another', out.split('\n')[0] === '<embers/color:ember/op:80/glass/s:120> and <x/@nope>');
  check('an unknown style stays as written', /\/@nope/.test(out));
  check('a style in code is shown as typed', /\\\/@ember\/code>/.test(out.split('\n')[1]));
  check('a definition written without its first slash works', resolvePmlVariables('§style a = color:rose\n<w/@a>', {}) === '<w/color:rose>');
  check('a style that names itself stops', typeof resolvePmlVariables('§style a = /@a\n<w/@a>', {}) === 'string');
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
