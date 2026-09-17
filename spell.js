/**
 * spell.js — the magic.
 *
 *   A prime of symbols,
 *   three segments, none repeating.
 *   It means nothing. Yet.
 *
 * Every preset and every saved spell carries one of these: a short string of
 * alchemical glyphs, split into exactly three segments, one wrapped in
 * double square brackets and one in double curly. Stored as PML, so the app
 * renders it with its own parser rather than any special-casing — the
 * brackets survive to the page precisely because PML colours what is inside
 * them and prints what is escaped.
 *
 * Format:  [[🜁🜂]]{{⚹🜛}}🜜      (segments may appear in any order)
 * Renders: [🜁🜂] in accent one, {⚹🜛} in accent two, 🜜 in the page ink.
 *
 * NOTE ON UNICODE: every glyph here is astral-plane (U+1F700 and up), which
 * means each is a surrogate PAIR in JavaScript. `.split('')` and `.length`
 * both cut those in half. Everything below counts and slices by CODE POINT,
 * via Array.from and the spread operator, which is the only reason the
 * prime-length guarantee holds.
 */

/** The only glyphs considered safe to render. Noto Sans Symbols 2 covers these. */
export const GLYPHS = [
  "🜁","🜂","🜃","🜄","🜅","🜆","🜇","🜈","🜉","🜊","🜋","🜌","🜍","🜎",
  "🜔","🜕","🜖","🜗","🜘","🜙","🜚","🜛","🜜","🜝","🜞","🜟","🜠","🜢",
  "🜣","🜥","🜦","🜧","🜨","🜩","🜪","🜫","🜬","🜭","🜮","🜯","🜱",
  "🜶","🜹","🜺","🜻","🜼","🜾","🜿",
  "☊","☋","☌","☍",
  "⚸","⚻","⚹","⚺","⚼",
  "⛤","⛧","⚝","✡","✝","☥","🝆","🝊","🝓","♡",
];

export const SPELL_PRIMES = [5, 7, 11, 13, 17];

export function isPrime(n){
  if(!Number.isInteger(n) || n < 2) return false;
  for(let i = 2; i*i <= n; i++) if(n % i === 0) return false;
  return true;
}

function shuffled(arr, rand){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds one spell. `rand` is injectable so a preset's spell can be derived
 * deterministically from its seed rather than changing on every render.
 */
export function generateSpell(rand){
  const r = rand || Math.random;
  const total = SPELL_PRIMES[Math.floor(r() * SPELL_PRIMES.length)];

  // drawn WITHOUT replacement: no glyph repeats inside one spell
  const picked = shuffled(GLYPHS, r).slice(0, total);

  // two cuts give three non-empty segments
  const cuts = [];
  while(cuts.length < 2){
    const c = Math.floor(r() * (total - 1)) + 1;
    if(!cuts.includes(c)) cuts.push(c);
  }
  cuts.sort((a,b) => a-b);
  const parts = [
    picked.slice(0, cuts[0]),
    picked.slice(cuts[0], cuts[1]),
    picked.slice(cuts[1]),
  ].map(p => p.join(''));

  // exactly one square, one curly, one bare — in a random order, and
  // assigned to segments in a random order
  const wrappers = shuffled(['[[%]]', '{{%}}', '%'], r);
  const wrapped = shuffled(parts.map((p,i) => wrappers[i].replace('%', p)), r);
  return wrapped.join('');
}

/**
 * The PML form. The outer bracket pair is the colour marker; the inner pair
 * is escaped so it actually prints. Without the escapes PML would treat all
 * four brackets as nesting and swallow them, which is what the app's own
 * parser does — checked, not assumed.
 */
export function spellToPML(spell){
  return String(spell)
    .replace(/\[\[([^\]]*)\]\]/g, '[\\[$1\\]]')
    .replace(/\{\{([^}]*)\}\}/g, '{\\{$1\\}}');
}

/** Splits a spell into its three raw segments, wrappers included. */
function segmentsOf(spell){
  const chars = Array.from(String(spell));
  const out = [];
  let i = 0;
  const startsWith = (pair, at) => chars[at] === pair[0] && chars[at+1] === pair[0];
  while(i < chars.length){
    if(startsWith('[', i)){
      let j = i + 2;
      while(j < chars.length && !(chars[j] === ']' && chars[j+1] === ']')) j++;
      if(j >= chars.length) return null;
      out.push(chars.slice(i, j+2).join(''));
      i = j + 2;
    } else if(startsWith('{', i)){
      let j = i + 2;
      while(j < chars.length && !(chars[j] === '}' && chars[j+1] === '}')) j++;
      if(j >= chars.length) return null;
      out.push(chars.slice(i, j+2).join(''));
      i = j + 2;
    } else {
      let j = i;
      while(j < chars.length && !startsWith('[', j) && !startsWith('{', j)) j++;
      out.push(chars.slice(i, j).join(''));
      i = j;
    }
  }
  return out.filter(s => s.length > 0);
}

export function validateSpell(spell){
  const segs = segmentsOf(spell);
  if(!segs) return { ok:false, msg:'Unclosed wrapper' };
  if(segs.length !== 3) return { ok:false, msg:`Expected 3 segments, found ${segs.length}` };

  const square = segs.filter(s => s.startsWith('[[') && s.endsWith(']]'));
  const curly  = segs.filter(s => s.startsWith('{{') && s.endsWith('}}'));
  if(square.length !== 1) return { ok:false, msg:'Need exactly one [[ ]] segment' };
  if(curly.length !== 1)  return { ok:false, msg:'Need exactly one {{ }} segment' };

  const strip = s =>
    (s.startsWith('[[') || s.startsWith('{{')) ? s.slice(2, -2) : s;
  const glyphs = segs.flatMap(s => Array.from(strip(s)));

  if(!isPrime(glyphs.length) || !SPELL_PRIMES.includes(glyphs.length))
    return { ok:false, msg:`Length ${glyphs.length} is not one of ${SPELL_PRIMES.join(', ')}` };

  for(const g of glyphs)
    if(!GLYPHS.includes(g)) return { ok:false, msg:`Glyph outside the safe set: ${g}` };

  if(new Set(glyphs).size !== glyphs.length)
    return { ok:false, msg:'A glyph repeats' };

  return { ok:true, msg:'Valid spell', length: glyphs.length };
}

/**
 * A spell derived from a seed — same seed, same spell, every time. Used so a
 * preset's glyphs belong to that preset rather than flickering on each
 * render.
 */
export function spellForSeed(seed){
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
  return generateSpell(rand);
}
