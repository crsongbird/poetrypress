/**
 * seedWords.test.mjs — word seeds: every number has exactly one phrase, and
 * every phrase reads back to exactly its number. The banks are FROZEN: the
 * anchors below are phrases people may already have; if one changes, a bank
 * was edited or reordered (don't — see seedWords.js).
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const S = await import('../seedWords.js');

check('the banks are exactly 256 · 256 · 128 · 128, no word twice in a bank (2 + 8 + 8 + 7 + 7 = 32 bits)',
  S.ADJ.length === 256 && S.NOUN.length === 256 && S.VERB.length === 128 && S.NAME.length === 128
  && [S.ADJ, S.NOUN, S.VERB, S.NAME].every(b => new Set(b.map(w => w.toLowerCase())).size === b.length));

// a fixed spread of numbers plus pseudo-random ones (repeatable)
let x = 2463534242, bad = 0, seen = new Set();
const sample = [0, 1, 2, 3, 4, 255, 256, 65535, 65536, 12345, 2**31 - 1, 2**31, 2**32 - 1];
for(let k = 0; k < 50000; k++){ x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; sample.push(x); }
for(const n of sample){ const p = S.seedPhrase(n); if(S.phraseSeed(p) !== (n >>> 0)) bad++; seen.add(p); }
check('every number reads back from its own phrase, exactly (50,000 numbers across all 32 bits)', bad === 0);
check('…and different numbers get different phrases', seen.size === new Set(sample.map(n => n >>> 0)).size);

check('phrases are anchored (frozen): 0, 12345 and 1527554733 keep their words',
  S.seedPhrase(0) === "Mercury's quiet lantern, turning"
  && S.seedPhrase(12345) === 'The breath of Mintaka, honest and closing'
  && S.seedPhrase(1527554733) === 'The minnow of Alnitak, turbulent and shedding');

check('a phrase reads back however it is typed (case, spaces, a full stop, curly apostrophes)',
  S.phraseSeed("  mercury’s QUIET   lantern, turning. ") === 0);
check('numbers typed still work, exactly', S.seedFromText('12345') === 12345 && S.seedFromText(' 1527554733 ') === 1527554733);
check('any other words become a seed too (hashed, one way, like a game\'s seed phrase)',
  Number.isInteger(S.seedFromText('my cat Lily')) && S.seedFromText('my cat Lily') === S.seedFromText('My Cat Lily') && S.seedFromText('a') !== S.seedFromText('b'));
check('a negative number shows the phrase of the seed the textures actually use (32 bits)', S.seedPhrase(-1) === S.seedPhrase(2**32 - 1));

const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8'), html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
check('the seed field shows the phrase; the number stays the saved value (and shows small beneath)',
  html.includes('id="textureSeedWords"') && /id="textureSeedValue"[^>]*hidden/.test(html) && /const n = seedFromText\(box\.value\);/.test(ev));
check('the report can print it: §SeedPhrase', /case 'SeedPhrase':/.test(readFileSync(new URL('../pmlVars.js', import.meta.url), 'utf8')));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
