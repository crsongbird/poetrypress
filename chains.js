/**
 * chains.js — Vellum's textures REBUILT AS CHAINS OF STEPS (steps.js): each a
 * graph the Athanor can open as a template ("Start from…" → Vellum's own
 * textures), and which the texture itself is made from — the same graph,
 * evaluated by athanor.js on the texture's grid.
 *
 * The long refactor: every texture we touch is rebuilt this way, its steps
 * added to the shared library when the library lacks them. A chain is:
 *   label   its name in the Athanor's menu
 *   div     its working grid, in canonical pixels per cell (1: full detail)
 *   nodes   [step, data, x, y]           (1-based in the wires)
 *   wires   [from, output, to, input]
 *   grid    (optional) its own working grid: (w, h, scale, knobs) → divisor
 * Its sliders are the texture's own (TEXTURE_PARAMS): a step's param bound
 * to '@k2[10,700]' reads slider 2 across that slider's range, so the graph
 * reads exactly what the slider says. The Knob nodes are the sliders' legend
 * in the Athanor (unwired: the bindings do the work), their defaults the
 * sliders' defaults as a share of their ranges.
 */
import { weaveGridDiv } from './stepsTouch.js';

export const TEXTURE_CHAINS = {
  // √ Harsh Rain: far sheets, then near streaks drawn over them; the dial is
  // where the rain comes from, Gusts swings it about that
  rainstreaks: { label: 'Harsh Rain', div: 2, nodes: [
      ['knob', { slot: '1', name: 'Rain Zoom', def: 0 }, 40, 40],
      ['knob', { slot: '2', name: 'Gusts', def: 0 }, 40, 200],
      ['streaks', { kind: 'sheets', angle: '@dial', spread: '@k2[0,40]', length: 100, count: 100, light: 75, strength: 50 }, 300, 40],
      ['streaks', { kind: 'streaks', angle: '@dial', spread: '@k2[0,40]', length: '@k1[100,500]', count: 100, light: 75, strength: 50 }, 580, 80],
      ['surface', { name: 'Harsh Rain', ground: 'grey' }, 860, 120]],
    wires: [[3, 1, 4, 1], [4, 1, 5, 1]] },
  // √ Silverpoint Hatch: soft forms say where the drawing is dark; hatching
  // gathers there, along the dial; the ink tarnishes with Age
  hatch: { label: 'Silverpoint Hatch', div: 2, nodes: [
      ['knob', { slot: '1', name: 'Cross-Hatching', def: 38 }, 40, 40],
      ['knob', { slot: '2', name: 'Line Density', def: 13 }, 40, 180],
      ['knob', { slot: '3', name: 'Age', def: 30 }, 40, 320],
      ['forms', { count: 5, size: 50, noise: 50 }, 300, 40],
      ['hatching', { angle: '@dial', density: '@k2[10,700]', size: 100, cross: '@k1', crossAngle: 54, weight: 50 }, 560, 40],
      ['colour', { hex: '#2C303A' }, 300, 300],
      ['colour', { hex: '#5C3214' }, 300, 420],
      ['mix', { t: 30 }, 560, 320],
      ['colour', { hex: '#808080' }, 560, 460],
      ['ramp', { mid: 50 }, 820, 160],
      ['surface', { name: 'Silverpoint Hatch', ground: 'grey' }, 1060, 160]],
    // the ink laid on the grey ground as far as it covers (a ramp: one colour, never a page of them)
    wires: [[4, 1, 5, 1], [6, 1, 8, 1], [7, 1, 8, 2], [3, 1, 8, 3], [5, 1, 10, 1], [9, 1, 10, 2], [8, 1, 10, 3], [10, 1, 11, 1]] },
  // 🜚 Linen: the weave (a normal map, lit by the dial) → the cloth coloured
  // and its details laid on as heights, lit. Its grid keeps the threads at
  // least three pixels apart, and no finer (a preview no longer pays the export's price)
  linen: { label: 'Linen Tooth', grid: (w, h, S, k) => weaveGridDiv(w, h, S, (50 + (k[0] ?? 14.3)*3.5)/100), nodes: [
      ['knob', { slot: '1', name: 'Weave Scale', def: 14 }, 40, 40],
      ['knob', { slot: '2', name: 'Details', def: 42 }, 40, 180],
      ['knob', { slot: '3', name: 'Weave', def: 50 }, 40, 320],
      ['weave', { weave: '@k3', scale: '@k1[50,400]' }, 300, 60],
      ['hue', { slot: '1', name: 'Fabric Hue' }, 300, 300],
      ['hue', { slot: '2', name: 'Light Hue' }, 300, 420],
      ['cloth', { details: '@k2', scale: '@k1[50,400]' }, 580, 120],
      ['surface', { name: 'Linen Tooth', ground: 'grey' }, 860, 160]],
    wires: [[4, 1, 7, 1], [4, 2, 7, 2], [5, 1, 7, 3], [6, 1, 7, 4], [7, 1, 8, 1]] },
  // ∆ Fractured Glaze: the crazing (heights, glaze, grime, the finest cracks)
  // and the brushwork (how thick it was painted) → the glaze lit and coloured
  crackedglaze: { label: 'Fractured Glaze', div: 2, nodes: [
      ['knob', { slot: '1', name: 'Fracture Scale', def: 12 }, 40, 40],
      ['knob', { slot: '2', name: 'Crack Density', def: 10 }, 40, 180],
      ['knob', { slot: '3', name: 'Enameling', def: 0 }, 40, 320],
      ['crazing', { scale: '@k1[60,400]', density: '@k2[10,900]', age: '@k3' }, 300, 40],
      ['brushwork', { streaks: 55, runs: 30, pools: 60 }, 300, 300],
      ['hue', { slot: '1', name: 'Glaze Hue' }, 300, 440],
      ['hue', { slot: '2', name: 'Base Hue' }, 300, 560],
      ['glaze', { scale: '@k1[60,400]', gloss: 85, grime: 40 }, 600, 160],
      ['surface', { name: 'Fractured Glaze', ground: 'colour' }, 880, 200]],
    wires: [[4, 1, 8, 1], [4, 2, 8, 2], [4, 3, 8, 3], [4, 4, 8, 4], [5, 1, 8, 5], [6, 1, 8, 6], [7, 1, 8, 7], [8, 1, 9, 1]] },
};
