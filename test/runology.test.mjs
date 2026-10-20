/**
 * runology.test.mjs — Ruby's Runology in Vellum (runology.js): the Archetypes,
 * Accent Runes and Chroma, as Symbology carries them: its words in the seed
 * phrases, its glyphs among the spell glyphs, a look's glyph spell read in
 * Runology, and the §Variables that write them into a poem.
 */
import { readFileSync } from 'fs';
import { check, done } from './harness.mjs';
const R = await import('../runology.js');
const { resolvePmlVariables } = await import('../pmlVars.js');
const { DEV_TEMPLATE } = await import('../appOptions.js');
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

check('twenty-two Archetypes in four tiers and Quintessence, twelve Accent Runes, eleven Chroma',
  R.ARCHETYPES.length === 23 && ['Primal', 'Balance', 'Sapient', 'Cosmological'].every(t => R.ARCHETYPES.some(a => a.tier === t))
  && R.ARCHETYPES.at(-1).name === 'Quintessence' && R.ACCENTS.length === 12 && R.CHROMA.length === 11);
check('the Primal Four are the readings\' elements, with their Chroma (Fire red, Wind green, Water blue, Earth yellow)',
  ['🜂Fire Red', '🜁Wind Green', '🜄Water Blue', '🜃Earth Yellow'].every(x => R.ARCHETYPES.some(a => a.glyph + a.name + ' ' + a.chroma === x)));
check('🜉 is Creation, the Athanor\'s glyph', R.ARCHETYPES.find(a => a.glyph === '🜉').name === 'Creation');

// its words and glyphs, where the app already uses such things
{
  const S = await import('../seedWords.js'), SP = await import('../spell.js');
  check('its words are in the seed phrases (an Archetype names a seed: "No wood that strayed toward Creation")', S.seedPhrase(66).includes('Creation'));
  check('its glyphs are spell glyphs (so spells and the Transmutation Circle draw them)',
    [...R.ARCHETYPES, ...R.ACCENTS].every(r => SP.GLYPHS.includes(r.glyph)));
}

// spells and looks
check('a glyph spell is read in Runology: its Archetypes by name, in order, once each',
  JSON.stringify(R.readSpell('[[🜁🜂]]{{⚹🜛}}🜜🜁')) === JSON.stringify(['Wind', 'Fire', 'Aether']));

// in a poem
const ctx = { seed: 792826347, spell: '[[🜁🜂]]{{⚹🜛}}🜜', spellName: 'Event Horizon', reading: '🜂 Smoulder' };
check('§Rune!name, §Glyph!name (Runology names too), §SpellRunes and §Reading resolve',
  resolvePmlVariables('§Rune!astral §Rune!lance', ctx) === '🝊 ⯤' && resolvePmlVariables('§Glyph!quintessence', ctx) === '🜚'
  && resolvePmlVariables('§SpellRunes', ctx) === '(Wind · Fire · Aether)'
  && resolvePmlVariables('§Reading', ctx) === '🜂 Smoulder' && resolvePmlVariables('§Rune!nonsense', ctx) === '§Rune!nonsense');
check('the report shows the surface\'s reading, and the spell\'s runes without spelling out their names (Ruby)', DEV_TEMPLATE.includes('§Reading') && !DEV_TEMPLATE.includes('§SpellRunes') && !/§SeedRune|§PresetRune/.test(DEV_TEMPLATE));
check('their fonts are loaded and in the glyph stack (Math, Runic, Music, Canadian Aboriginal, Cherokee)',
  ['Noto+Sans+Math', 'Noto+Sans+Runic', 'Noto+Music', 'Noto+Sans+Canadian+Aboriginal', 'Noto+Sans+Cherokee'].every(f => src('index.html').includes(f))
  && ['Noto Sans Runic', 'Noto Music', 'Noto Sans Canadian Aboriginal', 'Noto Sans Cherokee'].every(f => src('spell.js').includes(f)));

done();
