/**
 * runology.js — the Runes of Power, as Ruby's universe knows them (the same
 * vocabulary Symbology carries: its Runology and Chroma groups).
 *
 *   ARCHETYPES  twenty-two, in four tiers — Primal, Balance, Sapient,
 *               Cosmological — and Quintessence, the 108th Concept
 *   ACCENTS     twelve Accent Runes; a spell is an Archetype with an Accent
 *               ("Astral Lance", 🝊⯤), as Symbology's Spell form writes it
 *   CHROMA      the colours of the magic, each tied to an Archetype
 *
 * Where it shows in Vellum:
 *   - its WORDS are in the seed phrases' banks (seedWords.js): Archetypes
 *     among the names, Accents among the nouns, the Chroma among the colours
 *   - its GLYPHS are among the spell glyphs (spell.js GLYPHS), so spells and
 *     the Transmutation Circle draw them
 *   - a look's glyph SPELL (spell.js) is read in Runology where its glyphs are
 *     Archetypes (readSpell; §SpellRunes) — "It means nothing. Yet." has its yet
 *   - §Rune!name writes any Archetype or Accent by name (§Rune!astral → 🝊)
 *   - the four readings of a texture are the Primal Four (textureElements.js)
 *   - 🜉 Creation is the Athanor's glyph
 *
 * Hand-editing: a rune is [glyph, name, tier, chroma?]. Glyphs outside the
 * alchemical block need their fonts (Runic, Music, Canadian Aboriginal,
 * Cherokee, Math — loaded beside the symbol fonts; spell.js GLYPH_FONT).
 */
export const ARCHETYPES = [
  ['🜂', 'Fire',        'Primal',       'Red'],
  ['🜁', 'Wind',        'Primal',       'Green'],
  ['🜄', 'Water',       'Primal',       'Blue'],
  ['🜃', 'Earth',       'Primal',       'Yellow'],
  ['ᕕ',  'Amber',       'Primal',       'Amber'],
  ['⎐',  'Vitrum',      'Primal',       'Purple'],
  ['𝀶',  'Sound',       'Primal',       'Pink'],
  ['🜳', 'Radio',       'Primal',       'Brown'],
  ['🝓', 'Order',       'Balance',      'White'],
  ['🝢', 'Chaos',       'Balance',      'Black'],
  ['ᘓ',  'Life',        'Balance'],
  ['ᘒ',  'Death',       'Balance'],
  ['🝆', 'Dyna',        'Sapient'],
  ['🜛', 'Aether',      'Sapient'],
  ['Ᏹ',  'Materia',     'Sapient'],
  ['🜞', 'Sovereign',   'Sapient'],
  ['ᛯ',  'Contract',    'Sapient'],
  ['🝰', 'Time',        'Cosmological'],
  ['🝊', 'Astral',      'Cosmological'],
  ['🜥', 'Planar',      'Cosmological'],
  ['🜉', 'Creation',    'Cosmological'],
  ['🝧', 'Destruction', 'Cosmological'],
  ['🜚', 'Quintessence','The 108th Concept', 'Shimmer'],
].map(([glyph, name, tier, chroma]) => ({ glyph, name, tier, chroma: chroma || null }));

export const ACCENTS = [
  ['⯢', 'Bolt'], ['⯠', 'Arrow'], ['⯤', 'Lance'], ['⯚', 'Beam'], ['⯦', 'Blast'], ['⯗', 'Empower'],
  ['⯔', 'Short'], ['⯡', 'Bound'], ['⯘', 'Phase'], ['⯣', 'Volley'], ['⯙', 'Precise'], ['⯧', 'Magnetic'],
].map(([glyph, name]) => ({ glyph, name }));

/** The Chroma: each with the hue Vellum draws it in and what it carries. */
export const CHROMA = [
  { name: 'Red',     glyph: '🔴', hex: '#C8402E', carries: 'fire, flame, combustion' },
  { name: 'Green',   glyph: '🟢', hex: '#4E9A5A', carries: 'wind, storm, severing' },
  { name: 'Blue',    glyph: '🔵', hex: '#2F62B0', carries: 'water, dilution, the cold' },
  { name: 'Yellow',  glyph: '🟡', hex: '#D8B23A', carries: 'earth, quakes, metal' },
  { name: 'Amber',   glyph: '🟠', hex: '#E0882A', carries: 'lightning, magnetism' },
  { name: 'Purple',  glyph: '🟣', hex: '#8A5AC8', carries: 'vitrum, crystal, memory' },
  { name: 'Pink',    glyph: '🩷', hex: '#E07AA8', carries: 'sound, music, rupture' },
  { name: 'Brown',   glyph: '🟤', hex: '#7A5234', carries: 'radio, emission, mutation' },
  { name: 'White',   glyph: '⚪', hex: '#ECE8E0', carries: 'order, faith, light' },
  { name: 'Black',   glyph: '⚫', hex: '#1A161C', carries: 'chaos, corruption, change' },
  { name: 'Shimmer', glyph: '🌈', hex: '#B9A6D8', carries: 'quintessence, the iridescent' },
];

const BY_GLYPH = new Map([...ARCHETYPES.map(a => [a.glyph, a]), ...ACCENTS.map(a => [a.glyph, { ...a, tier: 'Accent' }])]);
/** Every Archetype and Accent by lowercased name (§Rune!astral). */
export const RUNE_BY_NAME = Object.fromEntries([...ARCHETYPES, ...ACCENTS].map(r => [r.name.toLowerCase(), r.glyph]));

/** What a glyph is in Runology, or null. */
export function runeOf(glyph){ return BY_GLYPH.get(glyph) || null; }

/** A glyph spell (spell.js) read in Runology: the names of its Archetypes, in order. */
export function readSpell(spell){
  const out = [];
  for(const ch of Array.from(String(spell || ''))){ const r = BY_GLYPH.get(ch); if(r && !out.includes(r.name)) out.push(r.name); }
  return out;
}

