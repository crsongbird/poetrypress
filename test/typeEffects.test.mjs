/**
 * typeEffects.test.mjs — the text effect stack (effects.js + canvasRenderer).
 *
 * Renders through the app with the canvas mock: every effect page-wide and
 * per segment (on both drawing paths), underlines, the older /fx1 /fx2
 * /effect forms, the slot UI, and old saved looks translating into slots.
 *
 * Run: node test/typeEffects.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';
installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { render } = await import('../canvasRenderer.js');
const { TYPE_EFFECT_NAMES } = await import('../textParsers.js');
const E = await import('../effects.js');
const St = await import('../stitches.js');

const fire = (id, type) => { const el = reg[id]; if(el && el.dispatchEvent) el.dispatchEvent({ type }); };
const calls = () => { const ctx = reg['poemCanvas'].getContext('2d'); return ctx._stats ? (ctx._stats.fillText || 0) + (ctx._stats.strokeText || 0) : 0; };

// ---- the definitions ----
const types = E.EFFECT_TYPES.filter(t => t !== 'none');
check('nine effects, each with two knobs', types.length === 9 && types.every(t => E.EFFECT_DEFS[t].k1 && E.EFFECT_DEFS[t].k2));

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
check('three effects stack (an outline, a glow and a long shadow at once)', threw === null);
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
check('underlines draw in any stitch', threw === null);

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
{ const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
  const load = o => { reg['advancedJson'].value = JSON.stringify(o); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
  const settle = () => new Promise(r => setTimeout(r, 60));
  const { fx1Type, fx2Type, fx3Type, ...old } = save(); void fx1Type, fx2Type, fx3Type;
  load({ ...old, outlineMode: 'outline', outlineColor: '#FFFFFF', outlineThickness: '4', typeEffect: 'halo', typeEffectStrength: '60' }); await settle();
  const s = save();
  check('a look saved before the stack translates into the slots (an outline, then its halo as a Glow)', s.fx1Type === 'outline' && s.fx2Type === 'glow' && s.fx3Type === 'none');
  // Starbloom, a preset that predates the stack, knows only an old shadow
  const walk = (n, out = []) => { for(const c of n.children || []){ if(String(c.className || '').split(' ').includes('preset-btn')) out.push(c); walk(c, out); } return out; };
  const tile = walk(reg['presetGrid']).find(t => t.dataset.name === 'Starbloom');
  if(tile){ tile.dispatchEvent({ type: 'click' }); await settle(); }
  check('presets do too (Starbloom\'s old shadow is a Shadow in the first slot)', !!tile && save().fx1Type === 'shadow' && save().lookName === 'Starbloom'); }

// ---- PML ----
check('/fx: parses a stack, in order', (() => { const s = E.parseFxList('outline(#fff,4)+glow(#fd0,40,70)+chromatic(,30,80,90)');
  return s.length === 3 && s[0].type === 'outline' && s[1].color === '#fd0' && s[2].angle === 90; })());
check('/fx:none clears', E.parseFxList('none').length === 0);
check('/under: takes a stitch, a colour and a weight', (() => { const u = E.parseUnder('vine,#c33,150', St.STITCH_STYLES); return u.style === 'vine' && u.color === '#c33' && u.weight === 150; })());

// (that every styling field a segment can set is in resolvePartStyle's guard is a source scan: invariants.test.mjs §7)

// ---- the debug line ----
check('§TypeEffect describes the stack compactly',
  E.describeStack([E.makeEffect('shadow', '#000', 14, 10, 45)], { style: 'wave' }) === 'drop shadow 14px 10px ∠45° #000 · under wave');

done();
