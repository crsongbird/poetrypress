/**
 * pmlCompat.test.mjs — existing PML must render exactly as it always has.
 *
 * PML is a contract with everyone who has written a poem in it. New
 * directives may be added; the meaning of old ones may never change. The
 * golden fixture holds the parser's output for a set of existing poems and
 * directives, captured BEFORE any extension. Every future parse is compared
 * against it.
 *
 * If this fails, an existing poem now renders differently. Do not regenerate
 * the fixture to make it pass — find what changed the meaning.
 *
 * Run: node test/pmlCompat.test.mjs
 */
import { readFileSync } from 'fs';
import { buildLines, TYPE_EFFECT_NAMES } from '../textParsers.js';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const golden = JSON.parse(readFileSync(new URL('./fixtures/pml-golden.json', import.meta.url), 'utf8'));
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const poem = html.match(/<textarea id="poemText"[^>]*>([\s\S]*?)<\/textarea>/)[1];

const SAMPLES = [poem,
  '<word/fx0>', '<word/fx1>', '<word/fx1,#ff0000,5>', '<word/fx2>', '<word/fx2,#fff,10,4,4>',
  '<a/#:ff00ff/f:4/scale:150/track:130/basis:40/jitter:80/r/fx2,#ff0,10,5,5>',
  '[acc] {two} {[g]} [{r]} [x/lg] {y/rg} **b** *i* _u_ ~~s~~',
  '## h', '-# a', '> q', '#D d', '#S s', 'rhyme~A/r', '<l/l><r/r>', '\\[lit\\]',
  '<x/rainbow> <y/trans:rev> <z/lesbian> <w/grad:1#f00,2#00f>'];

// fields added later appear as null in old parses; a null addition changes
// nothing about how a poem renders, so it is set aside for the comparison
const LATER_FIELDS = ['customTypeEffect'];
const strip = o => JSON.stringify(o, (k, v) => LATER_FIELDS.includes(k) && v == null ? undefined : v);

check('the golden fixture covers every sample', golden.length === SAMPLES.length);
SAMPLES.forEach((src, i) => {
  const label = i === 0 ? 'the default poem' : JSON.stringify(src).slice(0, 48);
  check(`unchanged: ${label}`, strip(buildLines(src, true, true)) === golden[i]);
});

// ---- the new directive ----
const partOf = s => buildLines(s, true, true)[0].parts.find(p => p.customTypeEffect);
const e1 = partOf('<w/effect:longshadow,80,#123456>');
check('/effect:NAME,strength,hue is read in full',
  e1 && e1.customTypeEffect.type === 'longshadow' &&
  e1.customTypeEffect.strength === 80 && e1.customTypeEffect.color === '#123456');
const bare = partOf('<w/effect>');
check('bare /effect is a halo at 60', bare && bare.customTypeEffect.type === 'halo' && bare.customTypeEffect.strength === 60);
check('an unknown effect is ignored, not guessed', !partOf('<w/effect:bogus>'));
check('strength is clamped to 100', partOf('<w/effect:halo,250>').customTypeEffect.strength === 100);
check('an effect can sit alongside an outline',
  (()=>{ const p = buildLines('<w/fx1,#000,3/effect:halo>', true, true)[0].parts[0];
         return p.customEffect && p.customEffect.type === 'outline' && p.customTypeEffect; })());

// ---- one list, owned by the parser ----
const cr = readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8');
check('the renderer reads the parser\'s list rather than its own copy',
  /TYPE_EFFECTS = TYPE_EFFECT_NAMES/.test(cr));
const ui = [...html.matchAll(/<select id="typeEffect">([\s\S]*?)<\/select>/g)][0][1];
const uiNames = [...ui.matchAll(/value="(\w+)"/g)].map(m => m[1]);
check('the picker offers exactly the effects PML accepts',
  uiNames.length === TYPE_EFFECT_NAMES.length && uiNames.every(n => TYPE_EFFECT_NAMES.includes(n)));

// ---- fields must survive the rebuild ----
// buildLines copies each part into a fresh object field by field; a field a
// directive sets but the copy omits is parsed and then silently dropped.
const tp = readFileSync(new URL('../textParsers.js', import.meta.url), 'utf8');
const setFields = [...new Set([...tp.matchAll(/part\.(custom\w+)\s*=/g)].map(m => m[1]))];
const copyLine = (tp.match(/return \{ justify:p\.justify,[^}]*\}/) || [''])[0];
const dropped = setFields.filter(f => !copyLine.includes(f + ':p.' + f));
check('every field a directive sets is carried through', dropped.length === 0);
if(dropped.length) console.log('   dropped:', dropped.join(', '));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
