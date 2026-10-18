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
import { buildLines } from '../textParsers.js';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const golden = JSON.parse(readFileSync(new URL('./fixtures/pml-golden.json', import.meta.url), 'utf8'));
// the poem the fixture was captured from ("Wanting", the default page until Taygete — the app now
// opens on a welcome page, so the poem is kept here, exactly as it was in index.html)
const poem = readFileSync(new URL('./fixtures/wanting.pml', import.meta.url), 'utf8');

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

// (every typeface effect PML has ever accepted still translates into the effect stack: typeEffects.test.mjs)

// ---- Ruby's Aether (both pieces, as written in PML): captured when it joined the fixtures, never regenerated ----
{
  const text = readFileSync(new URL('./fixtures/aether.pml.txt', import.meta.url), 'utf8');
  const pieces = text.split(/^=== .* ===\s*$/m).map(s => s.trim()).filter(Boolean);
  const want = JSON.parse(readFileSync(new URL('./fixtures/aether-golden.json', import.meta.url), 'utf8'));
  check('Aether still parses exactly as it did (the square card and the full piece)', pieces.length === want.length && pieces.every((p, i) => strip(buildLines(p, true, true)) === want[i]));
}

// (that every field a directive sets survives the line rebuild, and reaches the segment's style, is a source
// scan: invariants.test.mjs §7)

// ---- fonts: /f:N picks by position, so the order is frozen (AGENTS.md §7) ----
{
  const { FONTS, FONT_GROUPS } = await import('../appOptions.js');
  const FROZEN = ['Bodoni Moda','Cormorant Garamond','Crimson Pro','EB Garamond','Literata','Playfair Display','Merriweather',
    'Courier Prime','Space Mono','JetBrains Mono','Cinzel','Oswald','Architects Daughter','Caveat','Shadows Into Light','Inter',
    'Poppins','Nunito','Roboto','Work Sans','Josefin Sans','Unica One'];
  check('the first 22 fonts keep their positions (PML /f:N selects by position; new fonts are appended)', FROZEN.every((f, i) => FONTS[i].family === f));
  check('every font is labelled "Style · Family"', FONTS.every(f => / · /.test(f.label)));
  const grouped = FONT_GROUPS.flatMap(g => g[1]);
  check('every font sits in exactly one picker group, and every group name is a real font',
    FONTS.every(f => grouped.filter(n => n === f.family).length === 1) && grouped.every(n => FONTS.some(f => f.family === n)));
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  check('every page font is requested from Google Fonts', FONTS.every(f => html.includes('family=' + f.family.replace(/ /g, '+'))));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
