/**
 * typeEffects.test.mjs — the text effect stack (effects.js + canvasRenderer).
 *
 * Renders through the app with the canvas mock: every effect page-wide and
 * per segment (on both drawing paths), underlines, the older /fx1 /fx2
 * /effect forms, the slot UI, and old saved looks translating into slots.
 *
 * Run: node test/typeEffects.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { render } = await import('../canvasRenderer.js');
const { TYPE_EFFECT_NAMES } = await import('../textParsers.js');
const E = await import('../effects.js');
const St = await import('../stitches.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const cr = readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const fire = (id, type) => { const el = reg[id]; if(el && el.dispatchEvent) el.dispatchEvent({ type }); };
const calls = () => { const ctx = reg['poemCanvas'].getContext('2d'); return ctx._stats ? (ctx._stats.fillText || 0) + (ctx._stats.strokeText || 0) : 0; };

// ---- the definitions ----
const types = E.EFFECT_TYPES.filter(t => t !== 'none');
check('nine effects, each with two knobs', types.length === 9 && types.every(t => E.EFFECT_DEFS[t].k1 && E.EFFECT_DEFS[t].k2));
check('the old halo and bloom became one Glow', !E.EFFECT_DEFS.halo && !E.EFFECT_DEFS.bloom && !!E.EFFECT_DEFS.glow);
check('the old underline effects are not effects any more', !E.EFFECT_DEFS.wavyline && St.STITCH_STYLES.includes('double') && St.STITCH_STYLES.includes('dotted'));

// ---- page-wide: every effect renders, and actually draws ----
reg['poemText'].value = '## Wanting\nmerged with anguish'; fire('poemText', 'input');
reg['fx1Type'].value = 'none'; fire('fx1Type', 'change');
const before = (() => { render(); return calls(); })();
const bad = [], silent = [];
for(const t of types){
  reg['fx1Type'].value = t; fire('fx1Type', 'change');
  try { render(); if(t !== 'erosion' && calls() <= before) silent.push(t); } catch(err){ bad.push(t + ': ' + err.message); }
}
check('every effect renders page-wide', bad.length === 0);
if(bad.length) console.log('   ' + bad.join('\n   '));
check('every effect draws something beyond the plain text', silent.length === 0);
if(silent.length) console.log('   silent: ' + silent.join(', '));
reg['fx1Type'].value = 'none'; fire('fx1Type', 'change');

// ---- three slots stack ----
reg['fx1Type'].value = 'outline'; fire('fx1Type', 'change');
reg['fx2Type'].value = 'glow'; fire('fx2Type', 'change');
reg['fx3Type'].value = 'longshadow'; fire('fx3Type', 'change');
let threw = null; try { render(); } catch(err){ threw = err; }
check('three effects stack, in order', threw === null && /for\(const e of fx\)/.test(cr));
for(const i of [1, 2, 3]){ reg['fx'+i+'Type'].value = 'none'; fire('fx'+i+'Type', 'change'); }

// ---- the slot UI follows the effect ----
reg['fx1Type'].value = 'shadow'; fire('fx1Type', 'change');
check('a slot\'s knobs take the effect\'s names', reg['fx1K1Label'].textContent === 'Blur' && reg['fx1K2Label'].textContent === 'Distance');
check('choosing an effect sets its defaults', reg['fx1K1'].value == 14 && reg['fx1K2'].value == 10);
reg['fx1Type'].value = 'glow'; fire('fx1Type', 'change');
check('the angle shows only for effects with a direction', reg['fx1AngleField'].style.display === 'none');
reg['fx1Type'].value = 'none'; fire('fx1Type', 'change');

// ---- per segment, on both drawing paths ----
reg['poemText'].value = types.map((t, i) => `<w${i}/${i % 2 ? 'jitter:150/' : ''}fx:${t}(#f0a,60,70,30)>`).join(' ')
  + ' <stack/fx:outline(#fff,4)+glow(#fd0,40,70)> <plain/fx:none>';
fire('poemText', 'input');
threw = null; try { render(); } catch(err){ threw = err; }
check('every effect renders per segment, on both drawing paths', threw === null);

// ---- underlines, in any stitch ----
reg['poemText'].value = St.STITCH_STYLES.slice(0, 20).map((s, i) => `<u${i}/under:${s},#c33,150>`).join(' ');
fire('poemText', 'input');
threw = null; try { render(); } catch(err){ threw = err; }
check('underlines draw in any stitch', threw === null && /drawStitch\(ctx, pathFromPoints\(\[\[x, cursorY \+ size\*0\.95\]/.test(cr));

// ---- the older forms keep working ----
reg['poemText'].value = '<a/fx1,#abc,3> <b/fx2,#f0f,10,4,4> <c/fx0> '
  + TYPE_EFFECT_NAMES.filter(n => n !== 'none').map((n, i) => `<e${i}/effect:${n},80,#336,30,120,40>`).join(' ');
fire('poemText', 'input');
threw = null; try { render(); } catch(err){ threw = err; }
check('the old /fx1 /fx2 /fx0 and every old /effect still render', threw === null);
check('every old /effect translates', TYPE_EFFECT_NAMES.filter(n => n !== 'none').every(n => { const L = E.legacyTypeEffect(n, 60, '#000', 45, 100, 30); return !!(L.fx || L.under); }));
check('an old outline becomes an outline; an old shadow keeps its offset',
  E.legacyOutline('outline', '#fff', 4).type === 'outline' &&
  (() => { const s = E.legacyOutline('shadow', '#000', 0, 10, 3, 4); return s.type === 'shadow' && Math.abs(s.k2 - 5) < 1e-9; })());

// ---- old saved looks and presets translate into the slots ----
check('a look saved before the stack translates into the slots', /if\(s\.fx1Type === undefined && \(s\.outlineMode !== undefined \|\| s\.typeEffect !== undefined\)\) applyLegacyEffects\(s\);/.test(ev));
check('presets do too', /else applyLegacyEffects\(p\);/.test(ev));

// ---- PML ----
check('/fx: parses a stack, in order', (() => { const s = E.parseFxList('outline(#fff,4)+glow(#fd0,40,70)+chromatic(,30,80,90)');
  return s.length === 3 && s[0].type === 'outline' && s[1].color === '#fd0' && s[2].angle === 90; })());
check('/fx:none clears', E.parseFxList('none').length === 0);
check('/under: takes a stitch, a colour and a weight', (() => { const u = E.parseUnder('vine,#c33,150', St.STITCH_STYLES); return u.style === 'vine' && u.color === '#c33' && u.weight === 150; })());

// ---- every field a segment can set reaches its style ----
// resolvePartStyle returns early for a segment with "nothing of its own"; a
// field missing from that guard is silently ignored (that hid /fx: and /under:)
{
  const tp = readFileSync(new URL('../textParsers.js', import.meta.url), 'utf8');
  const fields = [...new Set([...tp.matchAll(/part\.(custom\w+|under)\s*=/g)].map(m => m[1]))].filter(f => !['customSize', 'customFontIdx', 'customBasis'].includes(f));   // these position the part; they are read directly, not through its style
  const guard = (cr.match(/if\(!part\.customColor[^\n]*return baseStyle;/) || [''])[0];
  const missing = fields.filter(f => !guard.includes(f));
  check('every styling field a segment can set is in resolvePartStyle\'s guard', missing.length === 0);
  if(missing.length) console.log('   missing: ' + missing.join(', '));
}

// ---- the debug line ----
check('§TypeEffect describes the stack compactly',
  E.describeStack([E.makeEffect('shadow', '#000', 14, 10, 45)], { style: 'wave' }) === 'drop shadow 14px 10px ∠45° #000 · under wave');

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
