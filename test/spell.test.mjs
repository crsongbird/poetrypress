/**
 * spell.test.mjs — the glyph spells.
 *
 * The property that matters and is easiest to break: every glyph here is an
 * astral-plane character, i.e. a surrogate PAIR. Any code that counts with
 * .length or slices with .split('') will cut glyphs in half and silently
 * produce invalid spells. These tests count by code point throughout.
 *
 * Run: node test/spell.test.mjs
 */
import { GLYPHS, SPELL_PRIMES, isPrime, generateSpell, validateSpell, spellToPML, spellForSeed } from '../spell.js';
import { buildLines } from '../textParsers.js';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

check('the safe glyph set is non-trivial', GLYPHS.length >= 60);
check('no duplicate glyphs in the safe set', new Set(GLYPHS).size === GLYPHS.length);
check('every safe glyph is a single code point', GLYPHS.every(g => Array.from(g).length === 1));
check('isPrime agrees with the allowed lengths', SPELL_PRIMES.every(isPrime));

// 400 spells, every one valid
let bad = null, lengths = new Set();
for(let i=0;i<400;i++){
  const s = generateSpell();
  const v = validateSpell(s);
  if(!v.ok && !bad) bad = { s, msg: v.msg };
  if(v.ok) lengths.add(v.length);
}
check('400 generated spells all validate', bad === null);
if(bad) console.log('   first bad:', bad.s, '->', bad.msg);
check('generated lengths are all allowed primes', [...lengths].every(n => SPELL_PRIMES.includes(n)));
check('more than one length actually occurs', lengths.size > 1);

// structure
const one = generateSpell();
check('a spell contains exactly one [[ ]] group', (one.match(/\[\[/g)||[]).length === 1);
check('a spell contains exactly one {{ }} group', (one.match(/\{\{/g)||[]).length === 1);

// malformed input must be rejected, not crash
for(const [inp, why] of [
  ['[[🜁🜂]]{{⚹🜛}}', 'only two segments'],
  ['[[🜁🜂]]🜜', 'no curly group'],
  ['[[🜁🜂]]{{⚹🜛}}🜜🜝🜞🜟', 'length not prime'],
  ['[[🜁🜁]]{{⚹🜛}}🜜', 'repeated glyph'],
  ['[[🜁🜂]]{{⚹🜛}}X', 'glyph outside the set'],
  ['[[🜁🜂{{⚹🜛}}🜜', 'unclosed wrapper'],
]){
  check(`rejected: ${why}`, validateSpell(inp).ok === false);
}

// PML round trip — the whole point is that the app's own parser renders it
const pml = spellToPML('[[🜁🜂]]{{⚹🜛}}🜜');
const segs = buildLines(pml, true, true)[0].segments;
const rendered = segs.map(s => s.text).join('');
check('PML form prints the inner brackets', rendered === '[🜁🜂]{⚹🜛}🜜');
check('the square group takes accent one', segs.some(s => s.color === 'accent1' && s.text.includes('[')));
check('the curly group takes accent two', segs.some(s => s.color === 'accent2' && s.text.includes('{')));
check('the bare segment stays in the page ink', segs.some(s => s.color === null && s.text === '🜜'));
check('nothing renders as a gradient', segs.every(s => !String(s.color||'').startsWith('grad')));

// seeded spells are stable
check('the same seed gives the same spell', spellForSeed(12345) === spellForSeed(12345));
check('different seeds give different spells', spellForSeed(1) !== spellForSeed(2));
check('a seeded spell is valid', validateSpell(spellForSeed(99)).ok);

// ---- stored spells on the presets ----
// A spell identifies which preset a page came from, so it must be DATA on the
// preset, not something re-derived from the texture seed (which changes when
// the seed rerolls).
const { PRESETS, FONTS } = await import('../appOptions.js');
check('every preset carries a stored spell', PRESETS.every(p => typeof p.spell === 'string' && p.spell));
const invalid = PRESETS.filter(p => !validateSpell(p.spell || '').ok);
check('every stored spell validates', invalid.length === 0);
if(invalid.length) console.log('   bad:', invalid.map(p => p.name + ': ' + validateSpell(p.spell||'').msg).join('; '));
check('no two presets share a spell', new Set(PRESETS.map(p => p.spell)).size === PRESETS.length);

// This guard exists because a bad edit once appended preset objects into the
// FONTS array instead of PRESETS — the arrays are adjacent and both end in
// "];", so a naive replace hit the wrong one and the damage was invisible
// until font indices were inspected.
check('FONTS contains only fonts', FONTS.every(f => f && f.family && f.label && !f.spell));
check('PRESETS contains only presets', PRESETS.every(p => p && p.name && p.bg1 && !p.family));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
