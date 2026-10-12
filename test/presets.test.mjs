/**
 * presets.test.mjs — the built-in looks and how the grid groups them.
 *
 * The groups go by what a person is looking for (Ruby: "group them in a way
 * that makes more sense to users"), each headed by a Runology Archetype, as
 * the texture menu's groups are. Every preset sits in exactly one group.
 *
 * Run: node test/presets.test.mjs
 */
const { PRESETS, PRESET_GROUPS, FONTS } = await import('../appOptions.js');
const { ARCHETYPES } = await import('../runology.js');
const { validateSpell } = await import('../spell.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const names = PRESETS.map(p => p.name);
const listed = PRESET_GROUPS.flatMap(g => g.presets);
check('48 built-in presets, every name unique', PRESETS.length === 48 && new Set(names).size === names.length);
check('every preset is in exactly one group', listed.length === names.length && names.every(n => listed.filter(m => m === n).length === 1));
const stray = listed.filter(n => !names.includes(n));
check('every name in a group is a preset', stray.length === 0);
if(stray.length) console.log('   strays:', stray.join(', '));
check('groups are named for what they hold, each glyph a Runology Archetype (no emoji, no element signs)',
  PRESET_GROUPS.every(g => g.name && ARCHETYPES.some(a => a.glyph === g.glyph) && !/[♡√∆]/.test(g.name)));
check('the basic scenes come first (Ruby\'s grouping)', PRESET_GROUPS[0].name === 'Basic Scenes' && PRESET_GROUPS[0].presets.includes('Plainsong'));
check('no group is a lonely one: three or more in each', PRESET_GROUPS.every(g => g.presets.length >= 3));
check('the Basics are the Athanor\'s: no preset uses one (Ruby: too plain for a look of their own)',
  !['plainnoise', 'stripes', 'polka', 'checker', 'softgradient', 'cells'].some(t => PRESETS.some(p => p.textureType === t)));
check('the grown and generated textures have presets of their own', ['lichtenberg', 'growth', 'aurorasky'].every(t => PRESETS.some(p => p.textureType === t)));
check('the five Ruby called perfect are still here', ['Andromeda', 'Euphoria', 'Lotus Bloom', 'Gateway', 'Sealed'].every(n => names.includes(n)));
const families = new Set(FONTS.map(f => f.family));
const badFont = PRESETS.filter(p => p.font && !families.has(p.font));
check('every preset\'s font is one of the app\'s fonts', badFont.length === 0);
if(badFont.length) console.log('   offenders:', badFont.map(p => p.name + ' (' + p.font + ')').join(', '));
check('every spell is a valid one', PRESETS.every(p => validateSpell(p.spell || '').ok));

console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
