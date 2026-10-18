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
check('60 built-in presets, every name unique', PRESETS.length === 60 && new Set(names).size === names.length);
check('every preset is in exactly one group', listed.length === names.length && names.every(n => listed.filter(m => m === n).length === 1));
const stray = listed.filter(n => !names.includes(n));
check('every name in a group is a preset', stray.length === 0);
if(stray.length) console.log('   strays:', stray.join(', '));
check('groups are named for what they hold, each glyph a Runology Archetype (no emoji, no element signs)',
  PRESET_GROUPS.every(g => g.name && ARCHETYPES.some(a => a.glyph === g.glyph) && !/[♡√∆]/.test(g.name)));
check('the basic scenes come first (Ruby\'s grouping)', PRESET_GROUPS[0].name === 'Basic Scenes' && PRESET_GROUPS[0].presets.includes('Plainsong'));
check('no group is a lonely one, and each fills whole rows: a multiple of four in each (Ruby)', PRESET_GROUPS.every(g => g.presets.length >= 4 && g.presets.length % 4 === 0));
check('the Basics are the Athanor\'s: no preset uses one (Ruby: too plain for a look of their own)',
  !['plainnoise', 'stripes', 'polka', 'checker', 'softgradient', 'cells'].some(t => PRESETS.some(p => p.textureType === t)));
check('the grown and generated textures have presets of their own', ['lichtenberg', 'growth', 'aurorasky', 'veins', 'knotwork'].every(t => PRESETS.some(p => p.textureType === t)));
check('the five Ruby called perfect are still here', ['Andromeda', 'Euphoria', 'Lotus Bloom', 'Gateway', 'Sealed'].every(n => names.includes(n)));
const families = new Set(FONTS.map(f => f.family));
const badFont = PRESETS.filter(p => p.font && !families.has(p.font));
check('every preset\'s font is one of the app\'s fonts', badFont.length === 0);
if(badFont.length) console.log('   offenders:', badFont.map(p => p.name + ' (' + p.font + ')').join(', '));
// ---- stored spells ----
// A spell identifies which preset a page came from, so it must be DATA on the
// preset, not something re-derived from the texture seed (which changes when
// the seed rerolls).
check('every preset carries a stored spell', PRESETS.every(p => typeof p.spell === 'string' && p.spell));
const invalid = PRESETS.filter(p => !validateSpell(p.spell || '').ok);
check('every stored spell validates', invalid.length === 0);
if(invalid.length) console.log('   bad:', invalid.map(p => p.name + ': ' + validateSpell(p.spell||'').msg).join('; '));
check('no two presets share a spell', new Set(PRESETS.map(p => p.spell)).size === PRESETS.length);
{ const { PANDORAN_RUNES } = await import('../spell.js');
  check('every preset\'s spell is written in Pandoran runes only (Ruby: Runology\'s Archetypes and Accents)', PRESETS.every(p => Array.from(p.spell.replace(/[\[\]{}]/g, '')).every(g => PANDORAN_RUNES.includes(g))) && PANDORAN_RUNES.length === 35); }

// This guard exists because a bad edit once appended preset objects into the
// FONTS array instead of PRESETS — the arrays are adjacent and both end in
// "];", so a naive replace hit the wrong one and the damage was invisible
// until font indices were inspected.
check('FONTS contains only fonts', FONTS.every(f => f && f.family && f.label && !f.spell));
check('PRESETS contains only presets', PRESETS.every(p => p && p.name && p.bg1 && !p.family));


// ---- every preset is readable (AGENTS.md §5.8: 3:1 or better against what is behind the text) ----
{
  const lum = h => { const n = parseInt(h.replace('#','').slice(0,6), 16);
    return [n>>16, (n>>8)&255, n&255].map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; })
      .reduce((a, v, i) => a + v*[0.2126, 0.7152, 0.0722][i], 0); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05)/(y + 0.05); };
  // with an inset box (Normal blend) the text sits on the page mixed toward the box color by its opacity;
  // other box blends fall back to the page, the stricter case
  const mixHex = (a, b, t) => { const A = parseInt(a.slice(1,7),16), B = parseInt(b.slice(1,7),16);
    const ch = s => Math.round(((A>>s)&255) + (((B>>s)&255) - ((A>>s)&255))*t);
    return '#' + [16,8,0].map(ch).map(v => v.toString(16).padStart(2,'0')).join(''); };
  const low = [];
  for(const p of PRESETS){
    let bgs = [p.bg1, p.bg2, p.bg3, p.bg4].filter(Boolean);
    if(p.cardToggle && (p.cardBlend || 'source-over') === 'source-over'){
      const o = (parseFloat(p.cardOpacity ?? 70) || 0)/100, box = p.cardColor1 || '#FFF6EE';
      bgs = bgs.map(b => mixHex(b, box, o));
    }
    for(const k of ['text1','text2','text3','text4','accent1','accent2']){
      if(!p[k]) continue;
      const worst = Math.min(...bgs.map(b => ratio(p[k], b)));
      if(worst < 3) low.push(`${p.name} ${k} ${worst.toFixed(1)}:1`);
    }
  }
  check('every preset\'s text and accents reach 3:1 against the worst stop of what is behind them (box or page)' + (low.length ? ': ' + low.slice(0, 4).join(', ') : ''), low.length === 0);
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
