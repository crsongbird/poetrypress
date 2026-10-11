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
 * Its sliders are the texture's own (TEXTURE_PARAMS), as KNOB nodes WIRED to
 * the ⚙ ports of the params they drive (steps.js: every slider of a step can
 * take a wire), and the dial as a DIAL node wired the same way — so a
 * template teaches by its wiring. A wired value sets a param across the
 * param's own range, so each step's range matches the slider it answers to.
 * Knob defaults are the sliders' defaults as a share of their ranges.
 */
import { weaveGridDiv } from './stepsTouch.js';
import { paramPort } from './steps.js';

export const TEXTURE_CHAINS = {
  // √ Harsh Rain: far sheets, then near streaks drawn over them; the dial is
  // where the rain comes from, Gusts swings it about that
  rainstreaks: { label: 'Harsh Rain', div: 2, nodes: [
      ['knob', { slot: '1', name: 'Rain Zoom', def: 0 }, 40, 300],                 // 1
      ['knob', { slot: '2', name: 'Gusts', def: 0 }, 40, 170],                     // 2
      ['dial', {}, 40, 40],                                                        // 3
      ['streaks', { kind: 'sheets', angle: 0, spread: 0, length: 100, count: 100, light: 75, strength: 50 }, 320, 40],   // 4
      ['streaks', { kind: 'streaks', angle: 0, spread: 0, length: 100, count: 100, light: 75, strength: 50 }, 600, 120],  // 5
      ['surface', { name: 'Harsh Rain', ground: 'grey' }, 880, 160]],             // 6
    wires: [[3, 1, 4, paramPort('streaks', 'angle')], [3, 1, 5, paramPort('streaks', 'angle')], [2, 1, 4, paramPort('streaks', 'spread')], [2, 1, 5, paramPort('streaks', 'spread')],
      [1, 1, 5, paramPort('streaks', 'length')], [4, 1, 5, 1], [5, 1, 6, 1]] },
  // √ Silverpoint Hatch: soft forms say where the drawing is dark; hatching
  // gathers there, along the dial; the ink tarnishes with Age
  hatch: { label: 'Silverpoint Hatch', div: 2, nodes: [
      ['knob', { slot: '1', name: 'Cross-Hatching', def: 38 }, 40, 180],          // 1
      ['knob', { slot: '2', name: 'Line Density', def: 13 }, 40, 300],            // 2
      ['knob', { slot: '3', name: 'Age', def: 30 }, 320, 560],                    // 3
      ['forms', { count: 5, size: 50, noise: 50 }, 40, 420],                      // 4
      ['hatching', { angle: 125, density: 100, size: 100, cross: 38, crossAngle: 54, weight: 50 }, 320, 120],   // 5
      ['colour', { hex: '#2C303A' }, 320, 360],                                   // 6
      ['colour', { hex: '#5C3214' }, 320, 460],                                   // 7
      ['mix', { t: 30 }, 600, 400],                                               // 8
      ['colour', { hex: '#808080' }, 600, 280],                                   // 9
      ['ramp', { mid: 50 }, 860, 200],                                            // 10
      ['surface', { name: 'Silverpoint Hatch', ground: 'grey' }, 1120, 220],      // 11
      ['dial', {}, 40, 40]],                                                      // 12
    // the ink laid on the grey ground as far as it covers (a ramp: one colour, never a page of them)
    wires: [[4, 1, 5, 1], [12, 1, 5, paramPort('hatching', 'angle')], [1, 1, 5, paramPort('hatching', 'cross')], [2, 1, 5, paramPort('hatching', 'density')],
      [6, 1, 8, 1], [7, 1, 8, 2], [3, 1, 8, 3], [5, 1, 10, 1], [9, 1, 10, 2], [8, 1, 10, 3], [10, 1, 11, 1]] },
  // 🜚 Linen: the weave (a normal map, lit by the dial) → the cloth coloured
  // and its details laid on as heights, lit. Its grid keeps the threads at
  // least three pixels apart, and no finer (a preview no longer pays the export's price)
  linen: { label: 'Linen Tooth', grid: (w, h, S, k) => weaveGridDiv(w, h, S, (50 + (k[0] ?? 14.3)*3.5)/100), nodes: [
      ['knob', { slot: '1', name: 'Weave Scale', def: 14 }, 40, 40],              // 1
      ['knob', { slot: '2', name: 'Details', def: 42 }, 40, 300],                 // 2
      ['knob', { slot: '3', name: 'Weave', def: 50 }, 40, 170],                   // 3
      ['weave', { weave: 50, scale: 100 }, 320, 60],                              // 4
      ['hue', { slot: '1', name: 'Fabric Hue' }, 320, 300],                       // 5
      ['hue', { slot: '2', name: 'Light Hue' }, 320, 420],                        // 6
      ['cloth', { details: 42, scale: 100 }, 600, 140],                           // 7
      ['surface', { name: 'Linen Tooth', ground: 'grey' }, 880, 180]],            // 8
    wires: [[3, 1, 4, paramPort('weave', 'weave')], [1, 1, 4, paramPort('weave', 'scale')], [1, 1, 7, paramPort('cloth', 'scale')], [2, 1, 7, paramPort('cloth', 'details')],
      [4, 1, 7, 1], [4, 2, 7, 2], [5, 1, 7, 3], [6, 1, 7, 4], [7, 1, 8, 1]] },
  // ∆ Fractured Glaze: the crazing (heights, glaze, grime, the finest cracks)
  // and the brushwork (how thick it was painted) → the glaze lit and coloured
  crackedglaze: { label: 'Fractured Glaze', div: 2, nodes: [
      ['knob', { slot: '1', name: 'Fracture Scale', def: 12 }, 40, 40],           // 1
      ['knob', { slot: '2', name: 'Crack Density', def: 10 }, 40, 170],           // 2
      ['knob', { slot: '3', name: 'Enameling', def: 0 }, 40, 300],                // 3
      ['crazing', { scale: 100, density: 100, age: 0 }, 320, 40],                 // 4
      ['brushwork', { streaks: 55, runs: 30, pools: 60 }, 320, 330],              // 5
      ['hue', { slot: '1', name: 'Glaze Hue' }, 320, 460],                        // 6
      ['hue', { slot: '2', name: 'Base Hue' }, 320, 580],                         // 7
      ['glaze', { scale: 100, gloss: 85, grime: 40 }, 620, 160],                  // 8
      ['surface', { name: 'Fractured Glaze', ground: 'colour' }, 900, 220]],      // 9
    wires: [[1, 1, 4, paramPort('crazing', 'scale')], [2, 1, 4, paramPort('crazing', 'density')], [3, 1, 4, paramPort('crazing', 'age')], [1, 1, 8, paramPort('glaze', 'scale')],
      [4, 1, 8, 1], [4, 2, 8, 2], [4, 3, 8, 3], [4, 4, 8, 4], [5, 1, 8, 5], [6, 1, 8, 6], [7, 1, 8, 7], [8, 1, 9, 1]] },
};
