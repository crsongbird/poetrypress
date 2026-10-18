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

check('the banks: 256 adjectives · 256 nouns · 128 names · 128 + 128 verbs · 64 times · 32 codas · 16 places, no word twice in a bank',
  S.ADJ.length === 256 && S.NOUN.length === 256 && S.NAME.length === 128 && S.VT.length === 128 && S.VI.length === 128
  && S.WHEN.length === 64 && S.TAG.length === 32 && S.PREP.length === 16
  && [S.ADJ, S.NOUN, S.NAME, S.VT, S.VI, S.WHEN, S.TAG, S.PREP].every(b => new Set(b.map(w => w.toLowerCase().split('|')[0])).size === b.length));

// a fixed spread of numbers plus pseudo-random ones (repeatable)
let x = 2463534242, bad = 0, seen = new Set();
const sample = [0, 1, 2, 3, 4, 255, 256, 65535, 65536, 12345, 2**31 - 1, 2**31, 2**32 - 1, 2**28 - 1, 2**28, 15*2**28, 15*2**28 + 2**27];
for(let k = 0; k < 30000; k++){ x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; sample.push(x); }
const norm = t => t.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim();
for(const n of sample){ const p = S.seedPhrase(n); if(S.phraseSeed(p) !== (n >>> 0)) bad++; seen.add(norm(p)); }
check('every number reads back from its own phrase, exactly (30,000 numbers across all 32 bits, every shape)', bad === 0);
check('…and different numbers get different phrases (even ignoring case and punctuation)', seen.size === new Set(sample.map(n => n >>> 0)).size);

// varied: many shapes and tenses, and almost never an -ing at the end
{
  let ing = 0, q = 0, first = new Set(); const N = 20000; let y = 99;
  for(let k = 0; k < N; k++){ y ^= y << 13; y >>>= 0; y ^= y >>> 17; y ^= y << 5; y >>>= 0; const p = S.seedPhrase(y);
    if(/ing$/.test(p.replace(/[?.]$/, '')) && !/(ring|spring|wing|king|nothing)$/.test(p)) ing++; if(p.endsWith('?')) q++; first.add(p.split(' ')[0].toLowerCase()); }
  check('the phrases take many shapes: questions, toasts, fragments, past, present and future', q > N*0.03 && first.size > 120
    && /\bwill\b/.test(Array.from({ length: 64 }, (_, i) => S.seedPhrase(i*977)).join(' ')));
  check('…and only about one in five hundred ends in -ing', ing < N*0.006);
}
check('phrases are anchored: 0, 12345 and 1527554733 keep their words (since the phrases took many shapes)',
  S.seedPhrase(0) === 'Mercury kindled the lantern at dusk'
  && S.seedPhrase(12345) === 'Aldebaran, calm and led at first light'
  && S.seedPhrase(1527554733) === 'Taygeta, slow and blessed in the dark');
{
  const R = await import('../runology.js');
  const has = (bank, w) => bank.some(b => b.toLowerCase() === w.toLowerCase());
  check('Runology\'s words are in the banks: every Archetype among the names, every Accent among the nouns, the Chroma among the colours',
    R.ARCHETYPES.every(a => has(S.NAME, a.name)) && R.ACCENTS.every(a => has(S.NOUN, a.name) || has(S.ADJ, a.name) || has(S.ADJ, a.name + 'ed'))
    && ['red', 'green', 'blue', 'yellow', 'purple', 'pink', 'brown', 'white', 'black', 'amber'].every(c => has(S.ADJ, c))
    && ['primal', 'sapient', 'cosmological'].every(t => has(S.ADJ, t)) && has(S.NOUN, 'shimmer') && has(S.NOUN, 'runist'));
  check('…and the lore\'s: the athanor, the alembic, the crucible; Pallas, Juno, Vesta, Chiron, Ophiuchus; calcined, saturnine, hermetic',
    ['athanor', 'alembic', 'crucible', 'retort', 'caduceus', 'lodestone'].every(w => has(S.NOUN, w)) && ['Pallas', 'Juno', 'Vesta', 'Chiron', 'Ophiuchus'].every(w => has(S.NAME, w))
    && ['calcined', 'saturnine', 'hermetic'].every(w => has(S.ADJ, w)) && S.VT.some(v => v.startsWith('transmute')));
}

check('a phrase reads back however it is typed (case, spaces, a full stop, curly apostrophes)',
  S.phraseSeed("  MERCURY kindled   the lantern at dusk. ") === 0 && S.phraseSeed('who closed NO runist around thoth') === 1);
check('numbers typed still work, exactly', S.seedFromText('12345') === 12345 && S.seedFromText(' 1527554733 ') === 1527554733);
check('any other words become a seed too (hashed, one way, like a game\'s seed phrase)',
  Number.isInteger(S.seedFromText('my cat Lily')) && S.seedFromText('my cat Lily') === S.seedFromText('My Cat Lily') && S.seedFromText('a') !== S.seedFromText('b'));
check('a negative number shows the phrase of the seed the textures actually use (32 bits)', S.seedPhrase(-1) === S.seedPhrase(2**32 - 1));

const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8'), html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
check('the seed field shows the phrase; the number stays the saved value (as a tooltip only — no number on show)',
  html.includes('id="textureSeedWords"') && /id="textureSeedValue"[^>]*hidden/.test(html) && /const n = seedFromText\(box\.value\);/.test(ev));
// (what was typed is kept with the look while it is still that seed's: audit.test.mjs, by behavior)
check('one line, the whole width, last in the tools; a hair-thin themed scroller when the words overflow (no native bar)',
  /<input type="text" id="textureSeedWords"/.test(html) && html.includes('id="textureSeedScroll"')
  && /\.tool-row > #seedRow, body\.is-mobile \.tool-row > #seedRow\{ grid-column:1 \/ -1 !important;/.test(readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8')));
{ const { resolvePmlVariables } = await import('../pmlVars.js');
  check('the report can print it: §SeedPhrase', resolvePmlVariables('[§SeedPhrase]', { seed: 0, seedPhrase: S.seedPhrase(0) }) === '[' + S.seedPhrase(0) + ']'); }

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
