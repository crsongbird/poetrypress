/**
 * typeEffects.test.mjs — the typeface effects.
 *
 * The rule every effect must keep: it may add ink or remove it, but it must
 * never change where text sits or how wide it measures. Fitting, wrapping and
 * the editor mirror all depend on the measured width being the same with or
 * without an effect.
 *
 * Run: node test/typeEffects.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { render } = await import('../canvasRenderer.js');
const { TYPE_EFFECT_NAMES, buildLines } = await import('../textParsers.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const cr = readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

check('twelve effects, counting none', TYPE_EFFECT_NAMES.length === 12);

// every effect renders page-wide without throwing
let bad = [];
for(const fx of TYPE_EFFECT_NAMES){
  reg['typeEffect'].value = fx; reg['typeEffectStrength'].value = '90';
  try { render(); } catch(e){ bad.push(fx + ': ' + e.message); }
}
check('every effect renders page-wide', bad.length === 0);
if(bad.length) console.log('   ' + bad.join('\n   '));

// and per segment, including the per-character path jitter/track force
reg['typeEffect'].value = 'none';
reg['poemText'].value = TYPE_EFFECT_NAMES.filter(n => n !== 'none')
  .map((n, i) => `<w${i}/${i % 2 ? 'jitter:150/' : ''}effect:${n},80>`).join(' ');
let segThrew = null;
try { render(); } catch(e){ segThrew = e; }
check('every effect renders per segment, on both drawing paths', segThrew === null);

// ---- effects must not move or resize text ----
const eff = (cr.match(/function drawTypeEffect[\s\S]*?\n\}/) || [''])[0];
check('effects never change the font', !/ctx\.font\s*=/.test(eff));
check('effects never touch text alignment or baseline',
  !/ctx\.textAlign\s*=/.test(eff) && !/ctx\.textBaseline\s*=/.test(eff));
check('effects restore the context afterwards',
  /ctx\.save\(\)/.test(eff) && /ctx\.restore\(\)/.test(eff));

// ---- the effects that follow the light ----
check('every directional effect follows the Angle control',
  /const ang = \(style\.typeEffectAngle/.test(eff) && /const dx = Math\.cos\(ang\), dy = Math\.sin\(ang\)/.test(eff));
check('the long shadow steps along that angle', /kind === 'longshadow'[\s\S]*?px \+ dx \* step \* i/.test(eff));
check('the bevel is shadowed where the angle points and lit opposite',
  /kind === 'bevel'[\s\S]*?px \+ dx \* d[\s\S]*?px - dx \* d/.test(eff));
check('distance scales the offsets', /style\.typeEffectDistance/.test(eff));
check('underlines use the word\'s own colour, with no sentinel value',
  /ctx\.strokeStyle = fill;/.test(eff) && !/#1A0B12/.test(eff));

// ---- erosion ----
const ero = (cr.match(/function drawErodedText[\s\S]*?\n\}/) || [''])[0];
check('erosion cuts on its own canvas, not the page', /document\.createElement\('canvas'\)/.test(ero) &&
  /o\.globalCompositeOperation = 'destination-out'/.test(ero) && !/ctx\.globalCompositeOperation = 'destination-out'/.test(ero));
check('erosion keeps gradient fills aligned', /o\.translate\(pad - px, pad - py\)/.test(ero));
check('erosion bites are seeded, so they do not crawl on repaint',
  /seededRand\(hashText\(str, px, py\)\)/.test(ero) && !/Math\.random/.test(ero));
check('erosion replaces the fill on both drawing paths',
  (cr.match(/(?<!function )drawErodedText\(ctx,/g) || []).length === 2);   // calls, not the definition

// ---- underlines ----
check('underlines are drawn in the segment\'s own fill', /ctx\.strokeStyle = fill;/.test(eff));
check('wavy underlines are anchored to the page so adjacent words line up',
  /Math\.sin\(\(x \/ wave\)/.test(eff));
check('a dashed underline resets the dash afterwards', /setLineDash\(\[\]\)/.test(eff));

// ---- the picker, PML and the guide all agree ----
const opts = [...html.matchAll(/<select id="typeEffect">([\s\S]*?)<\/select>/g)][0][1];
const ui = [...opts.matchAll(/value="(\w+)"/g)].map(m => m[1]);
check('the picker offers every effect PML accepts', ui.length === TYPE_EFFECT_NAMES.length &&
  TYPE_EFFECT_NAMES.every(n => ui.includes(n)));
check('the in-app guide lists the new effects', /dottedline or bloom/.test(html));
const p = buildLines('<w/effect:wavyline,70>', true, true)[0].parts.find(x => x.customTypeEffect);
check('PML reaches the new effects', p && p.customTypeEffect.type === 'wavyline');

// ---- bloom ----
const bloom = (cr.match(/function drawBloom[\s\S]*?\n\}/) || [''])[0];
check('bloom is screened, so it only ever lightens', /ctx\.globalCompositeOperation = 'screen'/.test(bloom));
check('bloom is built on its own canvas', /document\.createElement\('canvas'\)/.test(bloom));
check('bloom grain is cut on that canvas, not the page',
  /o\.globalCompositeOperation = 'destination-out'/.test(bloom));
check('bloom grain is seeded, so it does not shimmer', /seededRand\(hashText\(str, px, py\)/.test(bloom) && !/Math\.random/.test(bloom));

// ---- PML carries the new fields, and older forms still read the same ----
const full = buildLines('<w/effect:longshadow,80,#123456,200,150,40>', true, true)[0].parts.find(x => x.customTypeEffect);
check('PML reads angle, distance and grain',
  full.customTypeEffect.angle === 200 && full.customTypeEffect.distance === 150 && full.customTypeEffect.grain === 40);
const short = buildLines('<w/effect:halo,70,#fff>', true, true)[0].parts.find(x => x.customTypeEffect);
check('the three-field form still reads exactly as before, with the new fields empty',
  short.customTypeEffect.strength === 70 && short.customTypeEffect.color === '#fff' &&
  short.customTypeEffect.angle === null && short.customTypeEffect.distance === null);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
