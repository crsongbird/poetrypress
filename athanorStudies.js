/**
 * athanorStudies.js — the surfaces from Ruby's future-directions doc, built
 * as graphs of parts: SURFACE STUDIES, offered in the Athanor's Start from…
 *
 *   Thirty-six surfaces,
 *   each one a recipe of parts
 *   anyone can change.
 *
 * Ruby: every surface and shader the doc suggested is to be a node graph in the
 * Athanor by the end of the project, not a black box. Each study is a graph of
 * general parts only (no "Texture from the Menu"), with its TEACH, and Knobs on
 * the settings worth turning. They become textures in the menu in Stage 3 and
 * get presets in Stage 4 (ROADMAP). ROADMAP §2 I keeps the list of which are done.
 *
 * Written with a small builder so a graph reads like the chain it is:
 *   add(type, data) → its number;  wire(from, out, to, in) — `in` may be a
 *   setting's key, meaning that setting's ⚙ port.
 */
import { paramPort } from './steps.js';

function studyGraph(label, teach, build){
  const nodes = [], wires = [];
  const add = (type, data = {}) => { nodes.push([type, data, 0, 0]); return nodes.length; };
  const wire = (a, ao, b, bi) => wires.push([a, ao, b, typeof bi === 'string' ? paramPort(nodes[b - 1][0], bi) : bi]);
  // a quieter copy of a map: Math (multiply) by a Number
  const fade = (from, out, value) => { const k = add('number', { value }), m = add('math', { op: 'multiply' }); wire(from, out, m, 1); wire(k, 1, m, 2); return m; };
  build(add, wire, fade);
  return { label, teach, study: true, nodes, wires };
}
// the usual ends: two hues from the page, and the Surface
const studyHues = add => [add('hue', { slot: '1', name: 'Light Hue' }), add('hue', { slot: '2', name: 'Dark Hue' })];

export const ATHANOR_STUDIES = {
  fibers: studyGraph('Moonlit Fibers', 'Paper seen close under moonlight: long fibers lying mostly one way. Value Noise is smeared along one direction by Motion Blur (the Light Dial turns it), High Pass keeps only the fine strands, and a soft Threshold picks the brightest. Tint colors them between your two hues. Try: turn Fiber Length up for silk, down for felt.', (add, wire, fade) => {
    const n = add('noise', { scale: 160, octaves: 3 }), mb = add('motionblur', { length: 80, angle: 20 }), hp = add('highpass', { radius: 4, gain: 70 }),
      th = add('threshold', { at: 58, soft: 40, '~at': '40,70' }), [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Moonlit Fibers', ground: 'colour' });
    const k1 = add('knob', { slot: '1', name: 'Fiber Length', def: 80 }), k2 = add('knob', { slot: '2', name: 'Density', def: 50 }), dial = add('dial');
    wire(n, 1, mb, 1); wire(mb, 1, hp, 1); wire(hp, 1, th, 1); wire(th, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1);
    wire(k1, 1, mb, 'length'); wire(k2, 1, th, 'at'); wire(dial, 1, mb, 'angle');
  }),
  inkthirst: studyGraph('Ink Thirst', 'Paper that drinks ink unevenly: dark patches that feather at their edges instead of stopping. Perlin Noise gives the thirst, Levels decides how much of the page drinks, Grow & Shrink and Blur feather the edges. Try: raise Thirst for a page soaked through.', (add, wire, fade) => {
    const p = add('perlin', { scale: 25, details: 6, rough: 60, contrast: 40 }), lv = add('levels', { lo: 45, hi: 80, gamma: 50, '~lo': '70,25' }), gr = add('grow', { amount: 62, radius: 10 }),
      b = add('blur', { radius: 6, '~radius': '1,16' }), inv = add('invert'), [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Ink Thirst', ground: 'colour' });
    const k1 = add('knob', { slot: '1', name: 'Thirst', def: 40 }), k2 = add('knob', { slot: '2', name: 'Feather', def: 40 });
    wire(p, 1, lv, 1); wire(lv, 1, gr, 1); wire(gr, 1, b, 1); wire(b, 1, inv, 1); wire(inv, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1);
    wire(k1, 1, lv, 'lo'); wire(k2, 1, b, 'radius');
  }),
  carbon: studyGraph('Carbon Copy', 'A carbon copy: blue-black pigment pressed in bands as the hand moved, rubbed away in patches. Perlin Noise smeared sideways by Motion Blur gives the pressure bands; Cells, thresholded, cut erased patches out of it. Tint colors the pigment with your Dark Hue. Try: raise Erasing.', (add, wire, fade) => {
    const p = add('perlin', { scale: 160, details: 5, rough: 55, contrast: 40 }), mb = add('motionblur', { length: 100, angle: 0 }), lv = add('levels', { lo: 30, hi: 70, gamma: 50 }),
      c = add('cells', { scale: 30, jitter: 90 }), th = add('threshold', { at: 22, soft: 30, '~at': '0,40' }), m = add('math', { op: 'multiply' }), inv = add('invert'),
      [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Carbon Copy', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Erasing', def: 30 });
    wire(p, 1, mb, 1); wire(mb, 1, lv, 1); wire(c, 1, th, 1); wire(lv, 1, m, 1); wire(th, 1, m, 2); wire(m, 1, inv, 1); wire(inv, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1);
    wire(k1, 1, th, 'at');
  }),
  deadchannel: studyGraph('Dead Channel', 'A television tuned to a dead channel: near-black noise, torn into horizontal bands by a failing sync, the colors slipping apart. Perlin Noise smeared sideways, Posterize for the bands, Grid & Dots stripes for the scanlines, a Color Ramp, then Chromatic Offset. Try: raise Tearing.', (add, wire, fade) => {
    const p = add('perlin', { scale: 140, details: 3, contrast: 60 }), mb = add('motionblur', { length: 100, angle: 0 }), po = add('posterize', { steps: 6 }),
      g = add('grid', { kind: 'stripes', cells: 120, weight: 55, angle: 90, soft: 60 }), m = add('math', { op: 'multiply' }), [l, d] = studyHues(add), r = add('ramp', { mid: 40 }),
      ch = add('chroma', { amount: 40, angle: 0 }), s = add('surface', { name: 'Dead Channel', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Tearing', def: 40 });
    wire(p, 1, mb, 1); wire(mb, 1, po, 1); wire(po, 1, m, 1); wire(g, 1, m, 2); wire(m, 1, r, 1); wire(d, 1, r, 2); wire(l, 1, r, 3); wire(r, 1, ch, 1); wire(ch, 1, s, 1);
    wire(k1, 1, ch, 'amount');
  }),
  compression: studyGraph('Compression Garden', 'A picture compressed until its blocks show, kept as a mosaic on purpose: square cells, colors in bands, the red and blue slipping at the edges. Perlin Noise, Pixelate, a banded Gradient Map, Chromatic Offset. Try: change Block Size.', (add, wire, fade) => {
    const p = add('perlin', { scale: 18, details: 4 }), px = add('pixelate', { size: 40, cell: 'squares' }), gm = add('gradmap', { stops: 5, blend: 'bands', c1: '#141018', c2: '#3E5C4A', c3: '#9AB070', c4: '#E8D8A0', c5: '#F4B0B8' }),
      ch = add('chroma', { amount: 30, angle: 0 }), s = add('surface', { name: 'Compression Garden', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Block Size', def: 25 });
    wire(p, 1, px, 1); wire(px, 1, gm, 1); wire(gm, 1, ch, 1); wire(ch, 1, s, 1); wire(k1, 1, px, 'size');
  }),
  drowned: studyGraph('Drowned Light', 'Light seen through deep water: the bright web of caustics, slowed and blurred. The edges of Cells make the web; Warp by Perlin Noise bends it as water does; Blur softens it; a Color Ramp lights it. Try: raise Depth to blur it further.', (add, wire, fade) => {
    const c = add('cells', { scale: 45, jitter: 100 }), p = add('perlin', { scale: 12, details: 3 }), w = add('warp', { amount: 45 }), b = add('blur', { radius: 3, '~radius': '1,12' }), lv = add('levels', { lo: 50, hi: 95, gamma: 40 }),
      [l, d] = studyHues(add), r = add('ramp', { mid: 40 }), s = add('surface', { name: 'Drowned Light', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Depth', def: 20 });
    wire(c, 2, w, 1); wire(p, 1, w, 2); wire(w, 1, b, 1); wire(b, 1, lv, 1); wire(lv, 1, r, 1); wire(d, 1, r, 2); wire(l, 1, r, 3); wire(r, 1, s, 1); wire(k1, 1, b, 'radius');
  }),
  lichen: studyGraph('Lichen Signal', 'Lichen on stone: colonies with colored rims and dark centers, at more than one scale. Cells give the colonies (their distance is dark at the center), Perlin Noise decides where they grow, Edge Detect draws their rims, and a Gradient Map colors stone, rim and center. Try: raise Colonies.', (add, wire, fade) => {
    const c = add('cells', { scale: 60, jitter: 90 }), p = add('perlin', { scale: 25, details: 4 }), th = add('threshold', { at: 52, soft: 12, '~at': '70,35' }), m = add('math', { op: 'multiply' }),
      e = add('edges', { strength: 80 }), a = add('math', { op: 'max' }), gm = add('gradmap', { stops: 4, c1: '#3A3A36', c2: '#6E7A56', c3: '#C8A848', c4: '#E8E0C0' }),
      s = add('surface', { name: 'Lichen Signal', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Colonies', def: 50 });
    wire(p, 1, th, 1); wire(c, 1, m, 1); wire(th, 1, m, 2); wire(m, 1, e, 1); wire(m, 1, a, 1); wire(e, 1, a, 2); wire(a, 1, gm, 1); wire(gm, 1, s, 1);
    wire(k1, 1, th, 'at');
  }),
  misgrid: studyGraph('Misremembered Grid', 'A grid that forgets itself: its lines bend, some cells drop out, and a faint second copy sits beside the first. Grid & Dots draws the lines, Warp bends them by noise, Offset makes the afterimage, and Cells, thresholded, punch out the dropouts. Try: raise Drift.', (add, wire, fade) => {
    const g = add('grid', { kind: 'grid lines', cells: 12, weight: 14, soft: 20 }), p = add('perlin', { scale: 6, details: 3 }), w = add('warp', { amount: 18, '~amount': '0,50' }),
      o = add('offset', { x: 1, y: 1 }), mx = add('math', { op: 'max' }),
      c = add('cells', { scale: 60 }), th = add('threshold', { at: 12, soft: 0 }), m = add('math', { op: 'multiply' }),
      [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Misremembered Grid', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Drift', def: 18 });
    wire(g, 1, w, 1); wire(p, 1, w, 2); wire(w, 1, o, 1); const lv = fade(o, 1, 40); wire(w, 1, mx, 1); wire(lv, 1, mx, 2);
    wire(c, 3, th, 1); wire(mx, 1, m, 1); wire(th, 1, m, 2); wire(m, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1);
    wire(k1, 1, w, 'amount');
  }),
  mycelial: studyGraph('Mycelial Letter', 'Mycelium growing toward the poem: fine threads branching out from the page\'s edge and gathering where the words are. The Poem\'s Distance (inverted) gives Tendrils the ways to grow along; their glow is screened over a dark page. Try: type more lines and watch it find them.', (add, wire, fade) => {
    const po = add('poem', { padding: 60, softness: 30, reach: 60 }), inv = add('invert'), td = add('tendrils', { amount: 70, branching: 60, roots: 4, keep: 80 }),
      [l, d] = studyHues(add), r = add('ramp', { mid: 30 }), s = add('surface', { name: 'Mycelial Letter', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Growth', def: 70 });
    wire(po, 2, inv, 1); wire(inv, 1, td, 1); wire(td, 2, r, 1); wire(d, 1, r, 2); wire(l, 1, r, 3); wire(r, 1, s, 1); wire(k1, 1, td, 'amount');
  }),
  aether: studyGraph('Aether Current', 'A current flowing around the poem, as water flows around stones. Flow Lines draws the ribbons; The Poem\'s Distance, wired into its Angle Map, bends them around the words. Try: raise Turbulence.', (add, wire, fade) => {
    const po = add('poem', { padding: 60, softness: 60, reach: 40 }), [l, d] = studyHues(add), fl = add('flowlines', { amount: 100, size: 100, turbulence: 30 }),
      s = add('surface', { name: 'Aether Current', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Turbulence', def: 30 });
    wire(po, 2, fl, 2); wire(l, 1, fl, 3); wire(d, 1, fl, 4); wire(fl, 1, s, 1); wire(k1, 1, fl, 'turbulence');
  }),
  crt: studyGraph('CRT Séance', 'An old monitor at a séance: scanlines, a glow of phosphor noise, colors slipping at the edges, darker toward the curved rim. Grid & Dots stripes are the scanlines, Perlin Noise the phosphor, a Border Mask (oval) the falloff, then a Color Ramp and Chromatic Offset strongest at the edges. Try: raise Damage.', (add, wire, fade) => {
    const g = add('grid', { kind: 'stripes', cells: 120, weight: 45, angle: 90, soft: 70 }), p = add('perlin', { scale: 200, details: 2, contrast: 40 }), m = add('math', { op: 'multiply' }),
      bm = add('border', { shape: 'oval', width: 30, soft: 100 }), inv = add('invert'), m2 = add('math', { op: 'multiply' }), [l, d] = studyHues(add), r = add('ramp', { mid: 50 }),
      ch = add('chroma', { amount: 50, angle: 0, edge: 100 }), s = add('surface', { name: 'CRT Séance', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Damage', def: 50 });
    wire(g, 1, m, 1); wire(p, 1, m, 2); wire(bm, 1, inv, 1); wire(m, 1, m2, 1); wire(inv, 1, m2, 2); wire(m2, 1, r, 1); wire(d, 1, r, 2); wire(l, 1, r, 3); wire(r, 1, ch, 1); wire(ch, 1, s, 1);
    wire(k1, 1, ch, 'amount');
  }),
  mineral: studyGraph('Poured Mineral', 'Poured stone: agate, or oxidized metal, its bands following a shape that wanders. Perlin Noise is warped by itself, and a Profile Gradient reads it through a Wave curve, so it bands; a Gradient Map colors the bands. Try: raise Bands.', (add, wire, fade) => {
    const p = add('perlin', { scale: 8, details: 5 }), p2 = add('perlin', { scale: 4, details: 3 }), w = add('warp', { amount: 60 }), cv = add('curve', { shape: 'wave', count: 7 }),
      pg = add('profile', { shape: 'along a map' }), gm = add('gradmap', { stops: 5, c1: '#2A1418', c2: '#7A3A2A', c3: '#D89A68', c4: '#F0E0C8', c5: '#8A5040' }),
      s = add('surface', { name: 'Poured Mineral', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Bands', def: 30 });
    wire(p, 1, w, 1); wire(p2, 1, w, 2); wire(cv, 1, pg, 1); wire(w, 1, pg, 2); wire(pg, 1, gm, 1); wire(gm, 1, s, 1); wire(k1, 1, cv, 'count');
  }),
  rosette: studyGraph('Broken Rosette', 'A rosette whose symmetry fails: a pattern folded into a kaleidoscope, with wedges missing where Cells say so. Grid & Dots diamonds folded by Kaleidoscope make the rose; a thresholded Cells id knocks pieces out; Tint colors it. Try: change Folds.', (add, wire, fade) => {
    const g = add('grid', { kind: 'diamonds', cells: 9, weight: 70, soft: 20 }), k = add('kaleidoscope', { folds: 12, zoom: 100 }), c = add('cells', { scale: 5 }), th = add('threshold', { at: 20, soft: 0 }),
      m = add('math', { op: 'multiply' }), sh = add('shape', { form: 'circle', size: 95, soft: 20 }), m2 = add('math', { op: 'multiply' }), [l, d] = studyHues(add), t = add('tint'),
      s = add('surface', { name: 'Broken Rosette', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Folds', def: 50 });
    wire(g, 1, k, 1); wire(c, 3, th, 1); wire(k, 1, m, 1); wire(th, 1, m, 2); wire(m, 1, m2, 1); wire(sh, 1, m2, 2); wire(m2, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1);
    wire(k1, 1, k, 'folds');
  }),
  foil: studyGraph('Holographic Foil', 'Holographic foil: rainbow bands that move with the angle you hold it at, crossed by fine diffraction lines. A Spectrum is read through Lookup at the places Waves (bent by Perlin Noise) say; Grid & Dots stripes are screened over it for the diffraction. Try: turn the Light Dial.', (add, wire, fade) => {
    const sp = add('spectrum', { sat: 60, light: 64, repeat: 2 }), w = add('waves', { freq: 3, angle: 30 }), p = add('perlin', { scale: 6, details: 3 }), lk = add('lookup', { amount: 100, edges: 'mirror' }),
      g = add('grid', { kind: 'stripes', cells: 60, weight: 30, angle: 60, soft: 80 }), bl = add('blend', { mode: 'screen', opacity: 12 }), s = add('surface', { name: 'Holographic Foil', ground: 'colour' }),
      dial = add('dial');
    wire(p, 1, w, 1); wire(sp, 1, lk, 1); wire(w, 1, lk, 2); wire(p, 1, lk, 3); wire(lk, 1, bl, 1); wire(g, 1, bl, 2); wire(bl, 1, s, 1); wire(dial, 1, w, 'angle');
  }),
  polarized: studyGraph('Polarized Dream', 'Light through stressed glass between polarizers: interference bands in every color, flowing. Two sets of Waves, warped by noise, are multiplied into an interference pattern, and a Spectrum is laid along it. Hue & Saturation keeps it soft. Try: change Saturation, or the Waves\' Frequency.', (add, wire, fade) => {
    const p = add('perlin', { scale: 5, details: 4 }), w1 = add('waves', { freq: 3, angle: 20 }), w2 = add('waves', { freq: 4, angle: 110 }), m = add('math', { op: 'multiply' }), sp = add('spectrum', { shape: 'along a map', repeat: 2, sat: 45, light: 58 }),
      hs = add('hsv', { hue: 0, sat: 80, val: 100 }), s = add('surface', { name: 'Polarized Dream', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Saturation', def: 40 });
    wire(p, 1, w1, 1); wire(p, 1, w2, 1); wire(w1, 1, m, 1); wire(w2, 1, m, 2); wire(m, 1, sp, 1); wire(sp, 1, hs, 1); wire(hs, 1, s, 1); wire(k1, 1, hs, 'sat');
  }),
  memoryleak: studyGraph('Memory Leak', 'A picture with its memory leaking: rectangles of it come loose and land somewhere else, their colors slipping. The same Perlin Noise is colored twice, once slid by Offset; a Mix shows the slid copy only in the blocks that pixelated, thresholded Value Noise picks; Chromatic Offset finishes it. Try: raise Leaking.', (add, wire, fade) => {
    const p = add('perlin', { scale: 40, details: 6 }), o = add('offset', { x: 30, y: 8 }), gmA = add('gradmap', { stops: 3 }), gmB = add('gradmap', { stops: 3, c2: '#305A78', c3: '#C8E0D0' }),
      c = add('noise', { scale: 30, octaves: 1 }), px = add('pixelate', { size: 50, cell: 'bricks' }), th = add('threshold', { at: 75, soft: 0, '~at': '90,50' }), mx = add('mix', { t: 50 }),
      ch = add('chroma', { amount: 45, angle: 0 }), s = add('surface', { name: 'Memory Leak', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Leaking', def: 30 });
    wire(p, 1, gmA, 1); wire(p, 1, o, 1); wire(o, 1, gmB, 1); wire(c, 1, px, 1); wire(px, 1, th, 1); wire(gmA, 1, mx, 1); wire(gmB, 1, mx, 2); wire(th, 1, mx, 3); wire(mx, 1, ch, 1); wire(ch, 1, s, 1);
    wire(k1, 1, th, 'at');
  }),
  nosignal: studyGraph('No-Signal Halo', 'A quiet center ringed by a failing signal: calm in the middle, more broken toward the edges. A Border Mask (oval) is the Mix amount between a still dark page and loud noise colored by a Ramp, with Chromatic Offset strongest at the edges. Try: raise Width to bring the noise in.', (add, wire, fade) => {
    const p = add('perlin', { scale: 160, details: 2, contrast: 80 }), [l, d] = studyHues(add), r = add('ramp', { mid: 50 }), ch = add('chroma', { amount: 70, edge: 100 }), base = add('colour', { hex: '#0E0C12' }),
      bm = add('border', { shape: 'oval', width: 40, soft: 100 }), mx = add('mix', { t: 50 }), s = add('surface', { name: 'No-Signal Halo', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Width', def: 40 });
    wire(p, 1, r, 1); wire(d, 1, r, 2); wire(l, 1, r, 3); wire(r, 1, ch, 1); wire(base, 1, mx, 1); wire(ch, 1, mx, 2); wire(bm, 1, mx, 3); wire(mx, 1, s, 1); wire(k1, 1, bm, 'width');
  }),
  frozenbreath: studyGraph('Frozen Breath', 'Frost on a window, thickest at the edges, leaving the middle clear to read through. A Border Mask, roughened by noise, says where it grows; High Pass of noise, thresholded, gives the crystals; Tint colors them white. Try: raise Frost Reach.', (add, wire, fade) => {
    const p = add('perlin', { scale: 30, details: 6, rough: 70 }), bm = add('border', { shape: 'rounded', width: 30, soft: 60, rough: 80, '~width': '5,45' }), hp = add('highpass', { radius: 3, gain: 80 }),
      th = add('threshold', { at: 54, soft: 30 }), m = add('math', { op: 'multiply' }), [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Frozen Breath', ground: 'colour' }),
      k1 = add('knob', { slot: '1', name: 'Frost Reach', def: 30 });
    wire(p, 1, bm, 1); wire(p, 1, hp, 1); wire(hp, 1, th, 1); wire(th, 1, m, 1); wire(bm, 1, m, 2); wire(m, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, bm, 'width');
  }),
  saltbloom: studyGraph('Salt Bloom', 'Salt drying out of a page: crystals gathering at the margins, merging where they crowd. Scatter throws clumped dots where a Border Mask allows; Grow & Shrink and Blur merge them; the Light Engine gives them relief. Try: raise Salt.', (add, wire, fade) => {
    const bm = add('border', { shape: 'square', width: 35, soft: 90 }), sc = add('scatter', { shape: 'dot', count: 260, size: 8, vary: 80, clump: 60 }), gr = add('grow', { amount: 80, radius: 5 }),
      b = add('blur', { radius: 2 }), [l, d] = studyHues(add), t = add('tint'), le = add('material', { relief: 18, gloss: 40, shine: 40, shadow: 30, occlusion: 40, ambient: 55 }),
      s = add('surface', { name: 'Salt Bloom', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Salt', def: 60 });
    wire(bm, 1, sc, 2); wire(sc, 1, gr, 1); wire(gr, 1, b, 1); wire(b, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, le, 1); wire(b, 1, le, 2); wire(le, 1, s, 1); wire(k1, 1, sc, 'count');
  }),
  registration: studyGraph('Registration Ghost', 'Print whose plates slipped: cyan and magenta halftone echoes, faint, mostly near the edges where the slip shows. Grid & Dots makes the halftone, its dot size mapped by noise; one copy is slid by Offset; each is tinted and multiplied; a Border Mask keeps them to the margins. Try: raise Slip.', (add, wire, fade) => {
    const p = add('perlin', { scale: 10, details: 3 }), g = add('grid', { kind: 'hex dots', cells: 70, weight: 40 }), o = add('offset', { x: 1, y: 0 }),
      cyan = add('colour', { hex: '#40B8D0' }), mag = add('colour', { hex: '#D0408A' }), white = add('colour', { hex: '#F4EEE4' }), ra = add('ramp', { mid: 50 }), rb = add('ramp', { mid: 50 }),
      bl = add('blend', { mode: 'multiply', opacity: 80 }), bm = add('border', { shape: 'square', width: 30, soft: 100 }), bl2 = add('blend', { mode: 'normal', opacity: 100 }),
      s = add('surface', { name: 'Registration Ghost', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Slip', def: 20 });
    wire(p, 1, g, 'weight'); wire(g, 1, o, 1); wire(g, 1, ra, 1); wire(white, 1, ra, 2); wire(cyan, 1, ra, 3); wire(o, 1, rb, 1); wire(white, 1, rb, 2); wire(mag, 1, rb, 3);
    wire(ra, 1, bl, 1); wire(rb, 1, bl, 2); wire(white, 1, bl2, 1); wire(bl, 1, bl2, 2); wire(bm, 1, bl2, 3); wire(bl2, 1, s, 1); wire(k1, 1, o, 'x');
  }),
  thermal: studyGraph('Thermal Receipt', 'Thermal paper: off-white, faint vertical banding from the printer\'s head, blooms where heat touched it, darker toward the edges with age. Grid & Dots stripes are the banding, blurred Perlin Noise the heat bloom, a Border Mask the aging, all colored by a Gradient Map. Try: raise Heat.', (add, wire, fade) => {
    const g = add('grid', { kind: 'stripes', cells: 90, weight: 50, soft: 100 }), lv = fade(g, 1, 12), p = add('perlin', { scale: 6, details: 2 }), b = add('blur', { radius: 8 }),
      th = add('levels', { lo: 55, hi: 90, gamma: 50, '~lo': '65,30' }), bm = add('border', { shape: 'square', width: 16, soft: 100 }), m = add('math', { op: 'max' }), m2 = add('math', { op: 'max' }), mf = add('math', { op: 'average' }),
      gm = add('gradmap', { stops: 3, c1: '#F4F0E6', c2: '#C8BEB0', c3: '#6A5E5A' }), s = add('surface', { name: 'Thermal Receipt', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Heat', def: 45 });
    wire(p, 1, b, 1); wire(b, 1, th, 1); wire(th, 1, m, 1); wire(bm, 1, m, 2); wire(m, 1, m2, 1); wire(lv, 1, mf, 1); wire(m2, 1, mf, 2); wire(mf, 1, gm, 1); wire(gm, 1, s, 1);
    wire(k1, 1, th, 'lo');
  }),
  letterpress: studyGraph('Letterpress Bed', 'A printer\'s bed after years of use: a field of shallow dents, a few stray impressions, lit from the side. Scatter drops faint rectangles (stray type); blurred Perlin Noise is the worn bed; their sum is the height, and the Light Engine lights it by the dial. Try: turn the Light Dial low.', (add, wire, fade) => {
    const p = add('perlin', { scale: 30, details: 4, contrast: 10 }), sc = add('scatter', { shape: 'dash', count: 30, size: 12, vary: 40, turn: 0, fade: 60 }), b = add('blur', { radius: 2 }),
      inv = add('invert'), m = add('math', { op: 'average' }), [l, d] = studyHues(add), t = add('tint'), le = add('material', { relief: 40, gloss: 15, shine: 15, shadow: 70, occlusion: 50, ambient: 45 }),
      s = add('surface', { name: 'Letterpress Bed', ground: 'colour' }), dial = add('dial'), k1 = add('knob', { slot: '1', name: 'Depth', def: 40 });
    wire(sc, 1, b, 1); wire(b, 1, inv, 1); wire(p, 1, m, 1); wire(inv, 1, m, 2); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(m, 1, t, 1); wire(t, 1, le, 1); wire(m, 1, le, 2); wire(dial, 1, le, 7); wire(le, 1, s, 1);
    wire(k1, 1, le, 'relief');
  }),
  velvet: studyGraph('Moth-Eaten Velvet', 'Velvet, dense and dark, worn through in places where the light comes up from underneath. Fine Perlin Noise is the pile; Scatter, grown and thresholded, eats the holes; a Mix shows your Light Hue through them. Try: raise Moths.', (add, wire, fade) => {
    const p = add('perlin', { scale: 200, details: 2, contrast: 20 }), [l, d] = studyHues(add), r = add('ramp', { mid: 30 }), sc = add('scatter', { shape: 'dot', count: 50, size: 10, vary: 90, clump: 50, '~count': '10,200' }),
      p2 = add('perlin', { scale: 40 }), w = add('warp', { amount: 30 }), th = add('threshold', { at: 40, soft: 60 }), mx = add('mix', { t: 50 }), s = add('surface', { name: 'Moth-Eaten Velvet', ground: 'colour' }),
      k1 = add('knob', { slot: '1', name: 'Moths', def: 30 });
    wire(p, 1, r, 1); wire(d, 1, r, 2); wire(d, 1, r, 3); wire(sc, 1, w, 1); wire(p2, 1, w, 2); wire(w, 1, th, 1); wire(r, 1, mx, 1); wire(l, 1, mx, 2); wire(th, 1, mx, 3); wire(mx, 1, s, 1);
    wire(k1, 1, sc, 'count');
  }),
  scar: studyGraph('Scar Tissue', 'A surface of fibers, stretched and interrupted and grown back together: closer to handmade paper than to anatomy. Noise is smeared into fibers by Motion Blur, warped where it was stretched, broken where Scatter\'s dashes cross it, and lit by the Light Engine. Try: raise Stretch.', (add, wire, fade) => {
    const n = add('noise', { scale: 140, octaves: 3 }), mb = add('motionblur', { length: 90, angle: 10 }), p = add('perlin', { scale: 5 }), w = add('warp', { amount: 35 }),
      sc = add('scatter', { shape: 'dash', count: 40, size: 20, turn: 30 }), b = add('blur', { radius: 3 }), inv = add('invert'), m = add('math', { op: 'multiply' }),
      [l, d] = studyHues(add), t = add('tint'), le = add('material', { relief: 55, gloss: 20, shine: 25, shadow: 50, occlusion: 40, ambient: 50 }), s = add('surface', { name: 'Scar Tissue', ground: 'colour' }),
      k1 = add('knob', { slot: '1', name: 'Stretch', def: 35 });
    wire(n, 1, mb, 1); wire(mb, 1, w, 1); wire(p, 1, w, 2); wire(sc, 1, b, 1); wire(b, 1, inv, 1); wire(w, 1, m, 1); wire(inv, 1, m, 2); wire(m, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3);
    wire(t, 1, le, 1); wire(m, 1, le, 2); wire(le, 1, s, 1); wire(k1, 1, w, 'amount');
  }),
  spacedust: studyGraph('Deep-Space Dust', 'Dust between stars: specks gathered into faint filaments over an uneven dark, its color drifting. Perlin Noise, steepened by Levels, says where the filaments lie; Scatter throws clumped specks only there; a Spectrum, dimmed, drifts the color. Try: raise Emptiness.', (add, wire, fade) => {
    const p = add('perlin', { scale: 6, details: 6, rough: 65, contrast: 50 }), lv = add('levels', { lo: 50, hi: 85, gamma: 50 }), sc = add('scatter', { shape: 'dot', count: 400, size: 2, vary: 90, clump: 30, fade: 70 }),
      fogL = add('levels', { lo: 40, hi: 100, gamma: 40 }), fog = fade(fogL, 1, 60), m = add('math', { op: 'screen' }), sp = add('spectrum', { shape: 'along a map', sat: 35, light: 50 }), bl = add('blend', { mode: 'multiply', opacity: 100 }),
      s = add('surface', { name: 'Deep-Space Dust', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Emptiness', def: 50 });
    wire(p, 1, lv, 1); wire(lv, 1, sc, 2); wire(p, 1, fogL, 1); wire(sc, 1, m, 1); wire(fog, 1, m, 2); wire(m, 1, bl, 1); wire(p, 1, sp, 1); wire(sp, 1, bl, 2); wire(bl, 1, s, 1); wire(k1, 1, lv, 'lo');
  }),
  sigilweather: studyGraph('Sigil Weather', 'Weather made of signs: sigils carried on a wind, gathering into fronts and storms and leaving clear sky between. Scatter throws small sigils where Perlin Noise is high, and turns each the way a second noise blows (Which Way). Try: raise Storm.', (add, wire, fade) => {
    const p = add('perlin', { scale: 14, details: 4, contrast: 40 }), lv = add('levels', { lo: 40, hi: 75, gamma: 50 }), wind = add('perlin', { scale: 4, details: 2 }),
      sc = add('scatter', { shape: 'sigil', count: 90, size: 22, vary: 60, turn: 40, clump: 20 }), [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Sigil Weather', ground: 'colour' }),
      k1 = add('knob', { slot: '1', name: 'Storm', def: 40 });
    wire(p, 1, lv, 1); wire(lv, 1, sc, 2); wire(wind, 1, sc, 3); wire(sc, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, sc, 'count');
  }),
  packetrain: studyGraph('Packet Rain', 'Rain made of data: short dashes falling in columns, gathered into masses rather than evenly everywhere. Scatter throws dashes, all turned straight down (a Number into Which Way), only where stretched Perlin Noise is high. Try: raise Downpour.', (add, wire, fade) => {
    const p = add('perlin', { scale: 6, details: 3, contrast: 30 }), tr = add('motionblur', { length: 100, angle: 90 }), lv = add('levels', { lo: 30, hi: 60, gamma: 50 }), down = add('number', { value: 25 }),
      sc = add('scatter', { shape: 'dash', count: 260, size: 10, vary: 70, turn: 0, fade: 40 }), [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Packet Rain', ground: 'colour' }),
      k1 = add('knob', { slot: '1', name: 'Downpour', def: 60 });
    wire(p, 1, tr, 1); wire(tr, 1, lv, 1); wire(lv, 1, sc, 2); wire(down, 1, sc, 3); wire(sc, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, sc, 'count');
  }),
  constellation: studyGraph('Constellation Without Stars', 'A star chart with the stars taken out: only the lines that joined them remain, faint, and the barest dots where they met. The edges of Cells are the joining lines; tiny Scatter dots mark the meetings; both are faded and tinted. Try: raise Lines.', (add, wire, fade) => {
    const c = add('cells', { scale: 9, jitter: 100 }), th = add('threshold', { at: 88, soft: 10 }), lv = fade(th, 1, 35), sc = add('scatter', { shape: 'dot', count: 40, size: 2, vary: 60, fade: 50 }),
      m = add('math', { op: 'max' }), [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Constellation Without Stars', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Lines', def: 50 });
    wire(c, 2, th, 1); wire(lv, 1, m, 1); wire(sc, 1, m, 2); wire(m, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, c, 'scale');
  }),
  cartography: studyGraph('Impossible Cartography', 'A map of nowhere: contour lines, a few unlabeled symbols, a faint grid, on old paper. Terrain gives the land; Contour Lines draw it; Scatter places rings and crosses; Grid & Dots lays a survey grid; a Gradient Map colors the paper. Try: raise Relief for steeper country.', (add, wire, fade) => {
    const tr = add('terrain', { scale: 100, crests: 50 }), ct = add('contours', { levels: 18, weight: 120, index: 5, strength: 80 }), sc = add('scatter', { shape: 'ring', count: 10, size: 8, vary: 40 }),
      sc2 = add('scatter', { shape: 'cross', count: 8, size: 6, turn: 0 }), g = add('grid', { kind: 'grid lines', cells: 8, weight: 6, soft: 0 }), lv = fade(g, 1, 20),
      m = add('math', { op: 'max' }), m2 = add('math', { op: 'max' }), m3 = add('math', { op: 'max' }), inv = add('invert'),
      gm = add('gradmap', { stops: 3, c1: '#4A3628', c2: '#A08060', c3: '#EAD8B8' }), s = add('surface', { name: 'Impossible Cartography', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Relief', def: 50 });
    wire(tr, 1, ct, 1); wire(ct, 1, m, 1); wire(sc, 1, m, 2); wire(m, 1, m2, 1); wire(sc2, 1, m2, 2); wire(m2, 1, m3, 1); wire(lv, 1, m3, 2); wire(m3, 1, inv, 1); wire(inv, 1, gm, 1); wire(gm, 1, s, 1);
    wire(k1, 1, ct, 'levels');
  }),
  cathedral: studyGraph('Cathedral Interference', 'Window tracery passed through interference: the lead lines of pointed arches, doubled and shifted until they beat against each other. Panes draws an arcade window\'s leading; Warp bends one copy by Waves; their Difference makes the interference. Try: raise Interference, gently.', (add, wire, fade) => {
    const pn = add('panes', { size: 140, leading: 120, shape: 60, frame: 70 }), w = add('waves', { freq: 8, angle: 90 }), wp = add('warp', { amount: 6, '~amount': '0,30' }), m = add('math', { op: 'difference' }),
      [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Cathedral Interference', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Interference', def: 6 });
    wire(pn, 1, wp, 1); wire(w, 1, wp, 2); wire(pn, 1, m, 1); wire(wp, 1, m, 2); wire(m, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, wp, 'amount');
  }),
  magaurora: studyGraph('Magnetic Aurora', 'An aurora pulled by a magnetic field: luminous bands that split and merge, displaced together by one wind. Starfield and Aurora Curtains make the sky; Displace by Perlin Noise bends it all the same way. Try: raise Field.', (add, wire, fade) => {
    const sf = add('starfield', { amount: 100, atmosphere: 30 }), cu = add('curtains', { curtains: 3, rays: 100, height: 110, red: 30 }), p = add('perlin', { scale: 4, details: 3 }),
      dp = add('displace', { amount: 40, blur: 30 }), s = add('surface', { name: 'Magnetic Aurora', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Field', def: 40 });
    wire(sf, 1, cu, 1); wire(cu, 1, dp, 1); wire(p, 1, dp, 2); wire(dp, 1, s, 1); wire(k1, 1, dp, 'amount');
  }),
  breathglass: studyGraph('Breath on Glass', 'Breath on a cold window: fog gathered unevenly, tiny droplets, and a few clear trails where drops ran down. Blurred Perlin Noise is the fog; Scatter dots are the droplets; Scatter dashes, smeared downward by Motion Blur, are the trails; a Border Mask cools the edges. Try: raise Fog.', (add, wire, fade) => {
    const p = add('perlin', { scale: 10, details: 4 }), lv = add('levels', { lo: 20, hi: 80, gamma: 60, '~lo': '45,0' }), dr = add('scatter', { shape: 'dot', count: 300, size: 2, vary: 70, fade: 40 }),
      tr = add('scatter', { shape: 'dot', count: 8, size: 5, vary: 50 }), mb = add('motionblur', { length: 100, angle: 90 }), lt = add('levels', { lo: 0, hi: 15, gamma: 50 }),
      m = add('math', { op: 'max' }), m2 = add('math', { op: 'subtract' }), bm = add('border', { shape: 'rounded', width: 20, soft: 100 }), m3 = add('math', { op: 'max' }),
      [l, d] = studyHues(add), t = add('tint'), s = add('surface', { name: 'Breath on Glass', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Fog', def: 50 });
    wire(p, 1, lv, 1); wire(lv, 1, m, 1); wire(dr, 1, m, 2); wire(tr, 1, mb, 1); wire(mb, 1, lt, 1); wire(m, 1, m2, 1); wire(lt, 1, m2, 2); wire(m2, 1, m3, 1); wire(bm, 1, m3, 2);
    wire(m3, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, lv, 'lo');
  }),
  afterimage: studyGraph('Terminal Afterimage', 'The ghost an old terminal leaves: soft persistence trails in green or amber, and faint rectangles where windows used to be. Scatter throws blocks that Motion Blur smears into trails; faint scanlines from Grid & Dots; a Color Ramp in your hues; Chromatic Offset barely. Try: raise Persistence.', (add, wire, fade) => {
    const sc = add('scatter', { shape: 'dash', count: 25, size: 40, vary: 60, turn: 0, fade: 70 }), mb = add('motionblur', { length: 60, angle: 0 }), b = add('blur', { radius: 10 }),
      g = add('grid', { kind: 'stripes', cells: 120, weight: 30, angle: 90, soft: 80 }), lv = fade(g, 1, 16), m = add('math', { op: 'max' }),
      [l, d] = studyHues(add), r = add('ramp', { mid: 40 }), ch = add('chroma', { amount: 10 }), s = add('surface', { name: 'Terminal Afterimage', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Persistence', def: 60 });
    wire(sc, 1, mb, 1); wire(mb, 1, b, 1); wire(b, 1, m, 1); wire(lv, 1, m, 2); wire(m, 1, r, 1); wire(d, 1, r, 2); wire(l, 1, r, 3); wire(r, 1, ch, 1); wire(ch, 1, s, 1);
    wire(k1, 1, mb, 'length');
  }),
  orbit: studyGraph('Orbit Script', 'Writing that circles: rings of an orrery, with signs strung along them like beads. A Profile Gradient (radial) read through a Wave curve makes the rings; Threshold thins them to lines; Scatter strings small sigils only where the rings are. An approximation: true ellipses and writing along a path wait for their own parts. Try: raise Rings.', (add, wire, fade) => {
    const cv = add('curve', { shape: 'wave', count: 6 }), pg = add('profile', { shape: 'radial' }), th = add('threshold', { at: 94, soft: 8 }), near = add('blur', { radius: 2 }),
      sc = add('scatter', { shape: 'sigil', count: 70, size: 14, vary: 40, turn: 100 }), m = add('math', { op: 'max' }), [l, d] = studyHues(add), t = add('tint'),
      s = add('surface', { name: 'Orbit Script', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Rings', def: 25 });
    const ring = fade(th, 1, 55);
    wire(cv, 1, pg, 1); wire(pg, 1, th, 1); wire(th, 1, near, 1); wire(near, 1, sc, 2); wire(ring, 1, m, 1); wire(sc, 1, m, 2); wire(m, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1);
    wire(k1, 1, cv, 'count');
  }),
  transmutation: studyGraph('Transmutation Engine', 'A circle diagram of an alchemical engine: concentric rings, spokes folded into symmetry, a few stations marked. Rings come from a radial Profile Gradient through a Stairs curve and Edge Detect; Grid & Dots lines folded by Kaleidoscope make the spokes; a Shape Mask keeps it in the circle. An approximation: the true diagram part (with glyphs at the stations) is still to come. Try: change Folds.', (add, wire, fade) => {
    const cv = add('curve', { shape: 'stairs', count: 5 }), pg = add('profile', { shape: 'radial' }), e = add('edges', { strength: 100 }), g = add('grid', { kind: 'grid lines', cells: 6, weight: 8, soft: 10 }),
      k = add('kaleidoscope', { folds: 8, zoom: 100 }), sk = fade(k, 1, 60), m = add('math', { op: 'max' }), sh = add('shape', { form: 'circle', size: 90, soft: 4 }), m2 = add('math', { op: 'multiply' }),
      sc = add('scatter', { shape: 'ring', count: 12, size: 10, vary: 20 }), m3 = add('math', { op: 'max' }), [l, d] = studyHues(add), t = add('tint'),
      s = add('surface', { name: 'Transmutation Engine', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Folds', def: 43 });
    wire(cv, 1, pg, 1); wire(pg, 1, e, 1); wire(g, 1, k, 1); wire(e, 1, m, 1); wire(sk, 1, m, 2); wire(m, 1, m2, 1); wire(sh, 1, m2, 2); wire(sh, 1, sc, 2);
    wire(m2, 1, m3, 1); wire(sc, 1, m3, 2); wire(m3, 1, t, 1); wire(l, 1, t, 2); wire(d, 1, t, 3); wire(t, 1, s, 1); wire(k1, 1, k, 'folds');
  }),
  lacquer: studyGraph('Cracked Lacquer', 'Old lacquer, crazed into islands: each a little domed, a dark fracture between them, a narrow highlight at the rim. Cells give the islands (their distance is the dome), a Threshold of their edges the fractures, and the Light Engine the gloss. Try: Cells and Fracture Width move separately.', (add, wire, fade) => {
    const c = add('cells', { scale: 22, jitter: 85, '~scale': '40,160' }), p = add('perlin', { scale: 8 }), w = add('warp', { amount: 20 }), inv = add('invert'), e = add('threshold', { at: 92, soft: 6 }), fr = add('invert'),
      m = add('math', { op: 'multiply' }), gm = add('gradmap', { stops: 3, c1: '#120606', c2: '#5A0E12', c3: '#A82028' }), le = add('material', { relief: 50, gloss: 80, shine: 70, shadow: 40, occlusion: 50, ambient: 40 }),
      s = add('surface', { name: 'Cracked Lacquer', ground: 'colour' }), k1 = add('knob', { slot: '1', name: 'Cells', def: 50 }), k2 = add('knob', { slot: '2', name: 'Fracture Width', def: 92 });
    wire(c, 1, w, 1); wire(p, 1, w, 2); wire(w, 1, inv, 1); wire(c, 2, e, 1); wire(e, 1, fr, 1); wire(inv, 1, m, 1); wire(fr, 1, m, 2); wire(m, 1, gm, 1); wire(gm, 1, le, 1); wire(m, 1, le, 2); wire(le, 1, s, 1);
    wire(k1, 1, c, 'scale'); wire(k2, 1, e, 'at');
  }),
};
