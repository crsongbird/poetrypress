/**
 * rack.test.mjs — the Controls rack follows Ruby's rules (uiSkins.js rackPlan, 2026-10-19):
 *   three or fewer: sliders; four: four knobs in a row; more: two rows, the marked ones faders at the far right (only
 *   where there are two rows), the knobs clustered at the left, what doesn't fit a slider underneath; eight with two
 *   marked are four knobs, two faders, two sliders; a slider may declare itself. Every surface is laid out by it.
 */
import { readFileSync } from 'fs';
import { check, done } from './harness.mjs';
globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null }) };
const { rackPlan, RACK } = await import('../uiSkins.js');
const { paramsFor } = await import('../textureGenerators.js');
const { TEXTURE_PARAMS } = await import('../textureParams.js');

const F = (ticks, declared = null) => ticks.map((t, i) => ({ i: i + 1, shown: true, ticks: t, declared: declared && declared[i] || null }));
const count = plan => ['knob', 'fader', 'row'].map(k => plan.filter(p => p.as === k).length).join('/');

check('three or fewer are sliders', count(rackPlan(F([0, 0, 7]), 360, 'auto')) === '0/0/3' && count(rackPlan(F([0]), 360, 'auto')) === '0/0/1');
check('four are four knobs in a row, even with marks (no faders on one row)', count(rackPlan(F([0, 4, 0, 5]), 360, 'auto')) === '4/0/0'
  && rackPlan(F([0, 4, 0, 5]), 360, 'auto').knobCols === 4);
check('eight with two marked: four knobs, two faders, two sliders (Ruby\'s optimal eight)', count(rackPlan(F([0, 0, 8, 0, 0, 0, 0, 4]), 360, 'auto')) === '4/2/2');
check('eight with five marked still four knobs, two faders, two sliders', count(rackPlan(F([3, 4, 5, 6, 7, 0, 0, 0]), 360, 'auto')) === '4/2/2');
check('eight plain: eight knobs, four by two', (p => count(p) === '8/0/0' && p.knobCols === 4)(rackPlan(F([0, 0, 0, 0, 0, 0, 0, 0]), 360, 'auto')));
check('eight with one marked: six knobs and the fader fill the rack, one slider', count(rackPlan(F([0, 0, 0, 0, 0, 6, 0, 0]), 360, 'auto')) === '6/1/1');
check('five with three marked: two knobs, three faders', count(rackPlan(F([0, 4, 5, 6, 0]), 360, 'auto')) === '2/3/0');
{ const p = rackPlan(F([0, 0, 8, 0, 0, 0, 0, 4]), 360, 'auto'), fs = p.filter(q => q.as === 'fader');
  check('the faders stand at the far right, in the columns after the knobs\'', p.knobCols === 2 && fs.map(q => q.col).join() === '3,4' && p.knobCols + p.faders <= RACK.cols);
  check('the sliders are the last knobs (in their order), not the faders', p.filter(q => q.as === 'row').map(q => q.i).join() === '6,7'); }
check('a declared slider stays a slider; a declared fader is a fader', (p => p[0].as === 'row' && p[1].as === 'fader')(rackPlan(F([0, 0, 0, 0, 0, 0], ['slider', 'fader']), 360, 'auto')));
check('the rows button lays every one as a slider', count(rackPlan(F([0, 4, 0, 5, 0, 0]), 360, 'rows')) === '0/0/6');
check('a hidden slider takes no place', count(rackPlan([...F([0, 0, 0]), { i: 4, shown: false, ticks: 0 }], 360, 'auto')) === '0/0/3');

// every surface, laid out: the rack never wider than four columns or taller than two rows; faders only on two rows
let bad = [];
for(const type of Object.keys(TEXTURE_PARAMS)){
  const defs = paramsFor(type); if(!defs.length) continue;
  const p = rackPlan(defs.map((d, i) => ({ i: i + 1, shown: true, ticks: (d.ticks || []).length, declared: d.as || null })), 360, 'auto');
  const k = p.filter(q => q.as === 'knob').length, f = p.filter(q => q.as === 'fader').length, r = p.filter(q => q.as === 'row').length;
  if(k + 2*f > RACK.cols*RACK.rows || (p.knobCols || 0) + f > RACK.cols || (f && k + 2*f <= RACK.cols) || (defs.length <= 3 && r !== defs.length)) bad.push(type);
}
check('every surface fits the rack by the rules', !bad.length, bad.join(', '));

// the details that keep it honest in the page
const dials = readFileSync(new URL('../uiDials.js', import.meta.url), 'utf8');
check('a slider loses the marks of the surface before (they were drawn on its skin)', /delete slider\.dataset\.ticks/.test(dials));
const layers = readFileSync(new URL('../uiLayers.js', import.meta.url), 'utf8');
check('Shape Strength only shows while Shape Aware is on', /hidden-off', strengthOff/.test(layers));
done();
