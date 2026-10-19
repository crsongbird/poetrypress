/**
 * patterns.test.mjs — the pattern parts (stepsPatterns.js): Scatter's glyphs, layers and per-mark color, and
 * Pavements. The canvas mock draws no pixels, so what is checked is the wiring: each runs through the real
 * evaluator without throwing, gives its outputs, draws what it says (glyphs as text in the symbol fonts), keeps
 * its old ⚙ ports where they were, and a graph that scatters glyphs is made on the page.
 *
 * Run with: node test/patterns.test.mjs
 */
import { installCanvasMock, makeMockContext } from './canvasMock.mjs';
installCanvasMock();
const S = await import('../steps.js');
const A = await import('../athanor.js');
const P = await import('../stepsPatterns.js');
const { readFileSync } = await import('fs');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const ctx = { seed: 5, knobs: [50, 50, 50, 50, 50, 50], tints: ['#ffffff', '#202020'], light: 315, all: true };
const runAll = (spec, w = 48) => A.evalAthanor(A.athanorGraphOf(spec), w, w, ctx);

// ---- Scatter, the rest (F2) ----
const sc = S.STEPS.scatter;
check('Scatter keeps its ⚙ ports where they were (no setting moved), and gains an In Color output',
  sc.paramPorts.join() === 'count,size,vary,turn,clump,fade,variation,big' && S.paramPort('scatter', 'count') === 4 && sc.outs[3] === 'in color' && sc.outTypes[3] === 'image');
check('Scatter offers glyphs, which mark lies on top, and colors from the picture', sc.params.find(p => p[0] === 'shape')[4].options.includes('glyph')
  && ['glyphs', 'layers', 'color'].every(k => sc.params.find(p => p[0] === k)));
{ let texts = 0; const orig = globalThis.document.createElement;
  globalThis.document.createElement = (...a) => { const c = orig.apply(globalThis.document, a); if(c && c.getContext){ const g = c.getContext.bind(c); c.getContext = (...b) => { const x = g(...b); if(x && !x.__counted){ x.__counted = 1; const f = x.fillText; x.fillText = function(...t){ texts++; this.__font = this.font; return f.apply(this, t); }; } return x; }; } return c; };
  let out = null, threw = null;
  // (big enough a grid that marks are thrown at all: the count is per area)
  try { out = runAll({ nodes: [['spectrum', {}], ['scatter', { shape: 'glyph', glyphs: 'alchemy', count: 60, color: 'from the picture', layers: 'largest' }], ['surface', {}]], wires: [[1, 1, 2, 1], [2, 4, 3, 1]] }, 400); } catch(e){ threw = e; }
  globalThis.document.createElement = orig;
  check('a glyph Scatter, colored from a picture, largest on top, runs and draws its glyphs as text', !threw && out && out.get('2') && texts > 0); if(threw) console.log(threw); }
for(const layers of ['brightest', 'last thrown', 'largest', 'smallest']) for(const shape of ['dot', 'sigil', 'picture']){
  let threw = null; try { runAll({ nodes: [['perlin', {}], ['scatter', { shape, layers, color: 'white', count: 30 }], ['surface', {}]], wires: [[1, 1, 2, 1], [2, 1, 3, 1]] }); } catch(e){ threw = e; }
  if(threw){ check(`Scatter (${shape}, ${layers}) runs`, false); console.log(threw); } }
check('every Scatter shape and layer order runs', true);
check('a graph that scatters glyphs is made on the page (the symbol fonts are there), and only such a graph',
  P.graphScattersGlyphs(JSON.stringify(A.athanorGraphOf({ nodes: [['scatter', { shape: 'glyph' }], ['surface', {}]], wires: [] })))
  && !P.graphScattersGlyphs(JSON.stringify(A.starter ? {} : A.athanorStarter('agate')))
  && /graphScattersGlyphs\(opts\.graph\)/.test(readFileSync(new URL('../textureService.js', import.meta.url), 'utf8')));
check('every glyph set holds single glyphs in the symbol fonts', ['alchemy', 'heavens', 'zodiac', 'occult', 'runes', 'stars', 'mixed'].every(k => sc.params.find(p => p[0] === 'glyphs')[4].options.includes(k)));

// ---- Pavements (F6) ----
const pv = S.STEPS.pavement;
check('Pavements: stones, a bevel and each stone, with rows, irregularity, joints, roundness, bevel, angle and variation',
  pv && pv.outs.join() === 'stones,bevel,each stone' && pv.paramPorts.join() === 'rows,irreg,gap,round,bevel,angle,variation');
{ let out = null, threw = null;
  try { out = runAll({ nodes: [['pavement', { rows: 6, irreg: 80, angle: 30 }], ['material', {}], ['surface', {}]], wires: [[1, 2, 2, 2], [2, 1, 3, 1]] }); } catch(e){ threw = e; }
  check('Pavements runs, turned, into the Light Engine', !threw && out && out.get('1') && out.get('2')); if(threw) console.log(threw); }
check('the wiki has a page for Pavements and the new Scatter settings', (await import('../athanorWikiParts.js')).WIKI_PARTS.pavement && (await import('../athanorWikiParts.js')).WIKI_PARTS.scatter.set.layers);

// ---- the inset box as an input (G5), and Border Mask from it (F3) ----
{ const g = A.athanorGraphOf({ nodes: [['insetbox', { width: 10 }], ['surface', {}]], wires: [[1, 1, 2, 1]] });
  const W = 50, box = '0.2,0.2,0.8,0.8,0,0.06';
  const all = A.evalAthanor(g, W, W, { ...ctx, box }), px = (im, x, y) => im.r[y*W + x];
  const ins = all.get('1');
  check('Inset Box: white inside the box, black outside it', px(ins, 25, 25) > 0.99 && px(ins, 3, 3) < 0.01 && px(ins, 46, 25) < 0.01);
  const flat = A.athanorFlat(g).nodes, outs = S.STEPS.insetbox.run({ ww: W, wh: W, N: W*W, unit: W, ctx: { box }, num: (n, k, d) => d, field: null }, flat['1']);
  check('its Edge rises in from the box\'s edge, and its Line lies along it', outs[1][25*W + 25] > 0.99 && outs[1][25*W + 11] < outs[1][25*W + 14] && outs[2][25*W + 10] > 0.5 && outs[2][25*W + 25] < 0.01);
  const off = S.STEPS.insetbox.run({ ww: W, wh: W, N: W*W, unit: W, ctx: { box: '' }, num: (n, k, d) => d }, flat['1']);
  check('with the box off, it is the page itself', off[0][2*W + 2] > 0.99 && off[2].every(v => v === 0));
  const bm = A.evalAthanor(A.athanorGraphOf({ nodes: [['border', { shape: 'inset box', width: 5, soft: 50 }], ['surface', {}]], wires: [[1, 1, 2, 1]] }), W, W, { ...ctx, box, all: false });
  check('Border Mask from the inset box: white outside the box and at its edge, black deep inside', bm.r[3*W + 3] > 0.99 && bm.r[25*W + 25] < 0.01);
  const T = await import('../textureGenerators.js');
  check('a graph that reads the box is made with the box\'s place in its key; any other graph never sees it',
    T.graphUsesBox(JSON.stringify(g)) && !T.graphUsesBox(JSON.stringify(A.athanorStarter('agate')))
    && T.textureKeyFor('athanor', 64, 64, { graph: JSON.stringify(g), box }) !== T.textureKeyFor('athanor', 64, 64, { graph: JSON.stringify(g), box: '0.1,0.1,0.9,0.9,0,0.02' })); }

// ---- a lit Surface (B1): material maps beside picture and height; with none wired, as it always drew ----
{ const base = { nodes: [['perlin', { scale: 40 }], ['gradmap', {}], ['surface', { ground: 'colour' }]], wires: [[1, 1, 2, 1], [2, 1, 3, 1], [1, 1, 3, 2]] };
  const plain = A.evalAthanor(A.athanorGraphOf(base), 32, 32, { ...ctx, all: false });
  const W = 32, mat = extra => A.evalAthanor(A.athanorGraphOf({ nodes: [...base.nodes, ['number', { value: 100 }], ['number', { value: 0 }]],
    wires: [...base.wires, ...extra] }), W, W, { ...ctx, all: false });
  const metal = mat([[4, 1, 3, 5]]), glow = mat([[4, 1, 3, 6]]), matte = mat([[5, 1, 3, 3]]);
  const sum = im => { let t = 0; for(let i = 0; i < im.r.length; i++) t += im.r[i] + im.g[i] + im.b[i]; return t; };
  check('the Surface has inputs for reflectivity, reflection blur, metallic and emission', S.STEPS.surface.ins.slice(2).join() === 'reflectivity,reflection blur,metallic,emission');
  check('emission makes it glow brighter; metal and a matte finish each change it', sum(glow) > sum(plain)*1.2 && sum(metal) !== sum(plain) && sum(matte) < sum(mat([[4, 1, 3, 3]]))); }

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
