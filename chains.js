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
 *   canvas  (optional) made by a CANVAS PASS on the page, at full size (its
 *           parts paint: athanor.js) — Cartomancy, whose faces are lettered
 *   teach   what it shows, in a few lines (the Athanor says it on opening)
 */
import { weaveGridDiv } from './stepsTouch.js';
import { paramPort } from './steps.js';

export const TEXTURE_CHAINS = {
  // ═══ 🜛 BASICS: quiet grounds, two or three parts each — the easiest graphs to open and learn from ═══
  // 🜛 Plain Noise: Value Noise → Levels
  plainnoise: { label: 'Plain Noise', div: 2, teach: 'Value Noise → Levels. Scale and Detail set the noise; Contrast moves the Levels points together. Try: feed it into a Warp or a Color Ramp.', nodes: [
      ['knob', { slot: '1', name: 'Scale', def: 30 }, 40, 40],                     // 1
      ['knob', { slot: '2', name: 'Detail', def: 50 }, 40, 140],                   // 2
      ['knob', { slot: '3', name: 'Contrast', def: 20 }, 40, 240],                 // 3
      ['noise', { scale: 60, '~scale': '5,200', octaves: 4, '~octaves': '1,6' }, 320, 60],   // 4
      ['levels', { lo: 0, '~lo': '0,40', hi: 100, '~hi': '100,60', gamma: 50 }, 600, 120],  // 5
      ['surface', { name: 'Plain Noise', ground: 'grey' }, 880, 120]],             // 6
    wires: [[1, 1, 4, paramPort('noise', 'scale')], [2, 1, 4, paramPort('noise', 'octaves')], [3, 1, 5, paramPort('levels', 'lo')], [3, 1, 5, paramPort('levels', 'hi')],
      [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🜛 Stripes: Waves → Threshold
  stripes: { label: 'Stripes', div: 2, teach: 'Waves → Threshold. Stripe Width is the threshold; Softness blends back toward a sine. Try: Value Noise into the Waves\' Warp for wood grain.', nodes: [
      ['knob', { slot: '1', name: 'Stripe Count', def: 20 }, 40, 40],              // 1
      ['knob', { slot: '2', name: 'Stripe Width', def: 50 }, 40, 140],             // 2
      ['knob', { slot: '3', name: 'Softness', def: 20 }, 40, 240],                 // 3
      ['knob', { slot: '4', name: 'Angle', def: 50 }, 40, 340],                    // 4
      ['waves', { freq: 20, '~freq': '3,60', angle: 90, '~angle': '0,180' }, 320, 60],     // 5
      ['threshold', { at: 50, '~at': '97,3', soft: 20, '~soft': '1,100' }, 600, 140],    // 6
      ['surface', { name: 'Stripes', ground: 'grey' }, 880, 140]],                 // 7
    wires: [[1, 1, 5, paramPort('waves', 'freq')], [4, 1, 5, paramPort('waves', 'angle')], [2, 1, 6, paramPort('threshold', 'at')], [3, 1, 6, paramPort('threshold', 'soft')],
      [5, 1, 6, 1], [6, 1, 7, 1]] },
  // 🜛 Polka Dots: Cells (in rows, no jitter) → Threshold of the distance to each center
  polka: { label: 'Polka Dots', div: 2, teach: 'Cells (no jitter = a grid) → Threshold of the distance: one dot per point. Spacing is the cell scale; Scatter is the jitter. Try: wire Cells\' Edges into the Surface instead.', nodes: [
      ['knob', { slot: '1', name: 'Spacing', def: 50 }, 40, 40],                   // 1
      ['knob', { slot: '2', name: 'Dot Size', def: 45 }, 40, 140],                 // 2
      ['knob', { slot: '3', name: 'Scatter', def: 0 }, 40, 240],                   // 3
      ['cells', { scale: 110, '~scale': '200,30', jitter: 0, '~jitter': '0,100' }, 320, 60],  // 4
      ['threshold', { at: 25, '~at': '8,46', soft: 4, '~soft': '2,6' }, 600, 120], // 5
      ['surface', { name: 'Polka Dots', ground: 'grey' }, 880, 120]],              // 6
    wires: [[1, 1, 4, paramPort('cells', 'scale')], [3, 1, 4, paramPort('cells', 'jitter')], [2, 1, 5, paramPort('threshold', 'at')],
      [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🜛 Checkerboard: two Waves, across and down, each cut by Threshold; Math (difference) crosses them
  checker: { label: 'Checkerboard', div: 2, teach: 'Two Waves (across and down), each thresholded, combined with Math › Difference. One Knob drives both frequencies so the squares stay square. Try: Math › Multiply for windows, Max for plaid.', nodes: [
      ['knob', { slot: '1', name: 'Squares', def: 20 }, 40, 40],                   // 1
      ['knob', { slot: '2', name: 'Softness', def: 10 }, 40, 160],                 // 2
      ['knob', { slot: '3', name: 'Turn', def: 0 }, 40, 280],                      // 3
      ['waves', { freq: 12, '~freq': '2,40', angle: 0, '~angle': '0,90' }, 320, 40],       // 4
      ['waves', { freq: 12, '~freq': '2,40', angle: 90, '~angle': '90,180' }, 320, 240],   // 5
      ['threshold', { at: 50, soft: 4, '~soft': '1,60' }, 600, 40],                // 6
      ['threshold', { at: 50, soft: 4, '~soft': '1,60' }, 600, 240],               // 7
      ['math', { op: 'difference' }, 860, 140],                                    // 8
      ['surface', { name: 'Checkerboard', ground: 'grey' }, 1100, 140]],           // 9
    wires: [[1, 1, 4, paramPort('waves', 'freq')], [1, 1, 5, paramPort('waves', 'freq')], [3, 1, 4, paramPort('waves', 'angle')], [3, 1, 5, paramPort('waves', 'angle')],
      [2, 1, 6, paramPort('threshold', 'soft')], [2, 1, 7, paramPort('threshold', 'soft')],
      [4, 1, 6, 1], [5, 1, 7, 1], [6, 1, 8, 1], [7, 1, 8, 2], [8, 1, 9, 1]] },
  // 🜛 Gradient: a straight and a round Gradient, Mixed by Roundness; Levels bends the falloff
  softgradient: { label: 'Gradient', div: 4, teach: 'A linear and a radial Gradient, mixed by Roundness; Levels\' gamma is the falloff. Try: Value Noise into Mix\'s amount.', nodes: [
      ['knob', { slot: '1', name: 'Angle', def: 25 }, 40, 40],                     // 1
      ['knob', { slot: '2', name: 'Roundness', def: 0 }, 40, 160],                 // 2
      ['knob', { slot: '3', name: 'Falloff', def: 50 }, 40, 280],                  // 3
      ['gradient', { shape: 'linear', angle: 90, '~angle': '0,360' }, 320, 40],    // 4
      ['gradient', { shape: 'radial', angle: 90 }, 320, 200],                      // 5
      ['mix', { t: 0, '~t': '0,100' }, 800, 100],                                  // 6
      ['levels', { lo: 0, hi: 100, gamma: 50, '~gamma': '0,100' }, 1040, 120],     // 7
      ['surface', { name: 'Gradient', ground: 'grey' }, 1280, 120],                // 8
      ['invert', {}, 560, 200]],                                                   // 9 (light in the middle: a glow)
    wires: [[1, 1, 4, paramPort('gradient', 'angle')], [2, 1, 6, paramPort('mix', 't')], [3, 1, 7, paramPort('levels', 'gamma')],
      [4, 1, 6, 1], [5, 1, 9, 1], [9, 1, 6, 2], [6, 1, 7, 1], [7, 1, 8, 1]] },
  // 🜛 Cells: Cells' distance (inverted: domes) and edges (inverted: flat cells), Mixed by Lines; lit by the dial
  cells: { label: 'Cells', div: 2, teach: 'Cells → Invert, mixing domes and flat cells by Lines. The same map feeds Height (scaled by Relief), so the dial lights it. Try: Order at 0 for tiles.', nodes: [
      ['knob', { slot: '1', name: 'Cell Size', def: 40 }, 40, 40],                 // 1
      ['knob', { slot: '2', name: 'Order', def: 20 }, 40, 140],                    // 2
      ['knob', { slot: '3', name: 'Lines', def: 50 }, 40, 240],                    // 3
      ['knob', { slot: '4', name: 'Relief', def: 40 }, 40, 340],                   // 4
      ['cells', { scale: 60, '~scale': '200,20', jitter: 80, '~jitter': '100,0' }, 300, 60],  // 5
      ['invert', {}, 540, 20], ['invert', {}, 540, 140],                           // 6, 7
      ['mix', { t: 50, '~t': '0,100' }, 760, 80],                                  // 8
      ['levels', { lo: 10, hi: 95, gamma: 50 }, 980, 80],                          // 9
      ['math', { op: 'multiply' }, 980, 260],                                      // 10
      ['surface', { name: 'Cells', ground: 'grey' }, 1220, 140]],                  // 11
    wires: [[1, 1, 5, paramPort('cells', 'scale')], [2, 1, 5, paramPort('cells', 'jitter')], [5, 1, 6, 1], [5, 2, 7, 1], [6, 1, 8, 1], [7, 1, 8, 2], [3, 1, 8, paramPort('mix', 't')],
      [8, 1, 9, 1], [9, 1, 11, 1], [9, 1, 10, 1], [4, 1, 10, 2], [10, 1, 11, 2]] },
  // √ Harsh Rain: far sheets, then near streaks drawn over them; the dial is
  // where the rain comes from, Gusts swings it about that
  rainstreaks: { label: 'Harsh Rain', div: 2, teach: 'Two Streaks parts: far sheets, then near streaks. The Light Dial sets the direction. Try: turn the dial, then raise Gusts.', nodes: [
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
  hatch: { label: 'Silverpoint Hatch', div: 2, teach: 'Soft Forms → Hatching along the dial\'s direction; Age mixes two inks, laid on gray by a Color Ramp. Try: raise Cross-Hatching, then change Soft Forms\' Size.', nodes: [
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
  linen: { label: 'Linen Tooth', teach: 'Weave → Cloth & Details (two hues, seams, stitching, lit by the dial). Try: move Weave from silk to burlap.', grid: (w, h, S, k) => weaveGridDiv(w, h, S, (50 + (k[0] ?? 14.3)*3.5)/100), nodes: [
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
  crackedglaze: { label: 'Fractured Glaze', div: 2, teach: 'Crazing (height, glaze, grime, fine cracks) + Brushwork (glaze thickness) → Glaze. Try: raise Enameling.', nodes: [
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
  // 🜍 Cartomancy: a Table under a lamp, and a game Dealt onto it. The seed
  // picks the game, the table, the cards and the coin (each 'seed' setting:
  // choose one instead to fix it). Its four suits are the page's two Accents
  // and the texture's two Hues. Drawn on the page at full size (a canvas pass).
  cards: { label: 'Cartomancy', canvas: true, teach: 'Table → Deal. Menus left at “seed” let the seed choose game, table, cards and coins. Suits come from the accents and hues. Try: Game › ring, then ⟳ Seed.', nodes: [
      ['knob', { slot: '1', name: 'Cards in Play', def: 29 }, 40, 40],            // 1  (100 of 20–300)
      ['knob', { slot: '2', name: 'Scatter', def: 22 }, 40, 140],                 // 2  (20 of 0–90)
      ['knob', { slot: '3', name: 'Stakes', def: 50 }, 40, 240],                  // 3
      ['accent', { slot: '1', name: 'First Suit' }, 40, 340],                     // 4
      ['accent', { slot: '2', name: 'Second Suit' }, 40, 420],                    // 5
      ['hue', { slot: '1', name: 'Third Suit Hue' }, 40, 500],                    // 6
      ['hue', { slot: '2', name: 'Fourth Suit Hue' }, 40, 580],                   // 7
      ['table', { mat: 'seed', lamp: 50 }, 320, 40],                              // 8
      ['deal', { game: 'seed', stock: 'seed', gilt: 'seed', suits: 'seed', coinage: 'seed', count: 100, size: 100, scatter: 20, stakes: 50, clutter: 40, wear: 30 }, 600, 120],   // 9
      ['surface', { name: 'Cartomancy', ground: 'colour' }, 880, 160],            // 10
      ['knob', { slot: '4', name: 'Clutter', def: 40 }, 320, 300],                // 11
      ['knob', { slot: '5', name: 'Wear', def: 30 }, 320, 400]],                  // 12
    wires: [[8, 1, 9, 1], [4, 1, 9, 2], [5, 1, 9, 3], [6, 1, 9, 4], [7, 1, 9, 5],
      [1, 1, 9, paramPort('deal', 'count')], [2, 1, 9, paramPort('deal', 'scatter')], [3, 1, 9, paramPort('deal', 'stakes')],
      [11, 1, 9, paramPort('deal', 'clutter')], [12, 1, 9, paramPort('deal', 'wear')], [9, 1, 10, 1]] },
  // ♡ Sleep Haze: smoke rising in a dusty room, a shaft of light through it
  // from the dial's way, dust catching the light. Drawn by a canvas pass (the
  // smoke on its own soft grid, the motes at full size).
  clouds: { label: 'Sleep Haze', canvas: true, teach: 'Smoke (density) → Light Shaft from the dial → Dust Motes inside the beam. Try: Value Noise into the Light Shaft instead of Smoke.', nodes: [
      ['knob', { slot: '1', name: 'Lift', def: 29 }, 40, 40],                     // 1  (100 of 40–250)
      ['knob', { slot: '2', name: 'Drag', def: 30 }, 40, 140],                    // 2  (60 of 0–200)
      ['knob', { slot: '3', name: 'Dust', def: 35 }, 40, 240],                    // 3
      ['dial', {}, 40, 340],                                                      // 4
      ['smoke', { lift: 100, drag: 60 }, 320, 40],                                // 5
      ['shaft', { dust: 35 }, 600, 120],                                          // 6
      ['motes', { dust: 35 }, 880, 160],                                          // 7
      ['surface', { name: 'Sleep Haze', ground: 'grey' }, 1160, 180]],            // 8
    wires: [[1, 1, 5, paramPort('smoke', 'lift')], [2, 1, 5, paramPort('smoke', 'drag')], [5, 1, 6, 1], [4, 1, 6, 2], [3, 1, 6, paramPort('shaft', 'dust')],
      [6, 1, 7, 1], [6, 2, 7, 2], [3, 1, 7, paramPort('motes', 'dust')], [7, 1, 8, 1]] },
  // √ Scattered Polygons: flakes of leaf over a grey ground, in the leaf's hue
  metalleaf: { label: 'Scattered Polygons', canvas: true, teach: 'Flakes over its Base (empty here: gray). Shape, Sheen and Glitter vary the flakes; Mask lets Mix place them on another picture. Try: Value Noise into Base.', nodes: [
      ['knob', { slot: '1', name: 'Leaf Size', def: 13 }, 40, 40],                // 1  (100 of 60–360)
      ['knob', { slot: '2', name: 'Coverage', def: 33 }, 40, 140],                // 2  (100 of 20–260)
      ['knob', { slot: '3', name: 'Shape', def: 0 }, 40, 240],                    // 3
      ['knob', { slot: '4', name: 'Sheen', def: 0 }, 40, 340],                    // 4
      ['knob', { slot: '5', name: 'Glitter', def: 0 }, 40, 440],                  // 5
      ['hue', { slot: '1', name: 'Leaf Hue' }, 40, 540],                          // 6
      ['flakes', { size: 100, coverage: 100, shape: 0, sheen: 0, glitter: 0 }, 340, 160],   // 7
      ['surface', { name: 'Scattered Polygons', ground: 'grey' }, 640, 200]],     // 8
    wires: [[1, 1, 7, paramPort('flakes', 'size')], [2, 1, 7, paramPort('flakes', 'coverage')], [3, 1, 7, paramPort('flakes', 'shape')], [4, 1, 7, paramPort('flakes', 'sheen')],
      [5, 1, 7, paramPort('flakes', 'glitter')], [6, 1, 7, 2], [7, 1, 8, 1]] },
  // 🜚 Stained Glass: the window's panes (four kinds), then the glass lit from behind and in front
  stainedglass: { label: 'Stained Glass', div: 3, teach: 'Panes (layout, window shape, lead, pane ids) → Glass (backlit toward the dial; texture from cathedral to opalescent). Scene shows a Painted Sky and Ridges through the panes, Tiffany-style. Try: raise Scene, or wire any texture into it.', nodes: [
      ['knob', { slot: '1', name: 'Pane Size', def: 25 }, 40, 40],                // 1  (100 of 50–250)
      ['knob', { slot: '2', name: 'Leading', def: 32 }, 40, 140],                 // 2  (100 of 30–250)
      ['knob', { slot: '3', name: 'Shape', def: 25 }, 40, 240],                   // 3
      ['hue', { slot: '1', name: 'Glass Hue' }, 40, 340],                         // 4
      ['hue', { slot: '2', name: 'Second Glass Hue' }, 40, 440],                  // 5
      ['panes', { size: 100, leading: 100, shape: 25, variety: 0, '~variety': '0,45', frame: 0, '~frame': '0,100' }, 320, 60],   // 6
      ['glass', { relief: 100, scene: 0, '~scene': '0,100', texture: 0, '~texture': '0,100', reflect: 100 }, 600, 140],   // 7
      ['surface', { name: 'Stained Glass', ground: 'colour' }, 880, 180],         // 8
      ['knob', { slot: '4', name: 'Scene', def: 0 }, 40, 540],                    // 9
      ['knob', { slot: '5', name: 'Glass Texture', def: 0 }, 40, 640],            // 10
      ['knob', { slot: '6', name: 'Window', def: 0 }, 40, 740],                   // 11
      ['sky', { time: 'seed', clouds: 'seed', size: 100, tilt: 0, colour: 100 }, 320, 560],   // 12 (the scene behind the glass)
      ['ridges', { country: 'seed', time: 'seed', bands: 100, distance: 100, tilt: 0, colour: 100 }, 320, 700]],   // 13
    wires: [[1, 1, 6, paramPort('panes', 'size')], [2, 1, 6, paramPort('panes', 'leading')], [3, 1, 6, paramPort('panes', 'shape')],
      [6, 1, 7, 1], [6, 2, 7, 2], [6, 3, 7, 3], [6, 4, 7, 4], [4, 1, 7, 5], [5, 1, 7, 6], [6, 5, 7, 7], [7, 1, 8, 1],
      [9, 1, 7, paramPort('glass', 'scene')], [10, 1, 7, paramPort('glass', 'texture')], [11, 1, 6, paramPort('panes', 'frame')], [12, 1, 13, 1], [13, 1, 7, 8], [6, 6, 7, 9],
      [9, 1, 6, paramPort('panes', 'variety')]] },   // (Scene also sets Size Variety: a scene wants small panes for its detail)
  // ⛰ Painted Landscape: a painted sky, the country's ridges painted over it, a watercolour wash
  // 🝊 Aurora: Deep Field's stars, then curtains of rays over them
  aurorasky: { label: 'Aurora', canvas: true, teach: 'Starfield → Aurora Curtains: rays over a folded hem, green low, red high. The Light Dial leans the rays. Screened over the page. Try: raise Red Sky and Curtain Height.', nodes: [
      ['knob', { slot: '1', name: 'Curtain Height', def: 43 }, 40, 40],           // 1  (100 of 40–180)
      ['knob', { slot: '2', name: 'Rays', def: 35 }, 40, 140],                     // 2  (100 of 20–250)
      ['knob', { slot: '3', name: 'Curtains', def: 25 }, 40, 240],                 // 3  (2 of 1–5)
      ['knob', { slot: '4', name: 'Red Sky', def: 30 }, 40, 340],                  // 4
      ['knob', { slot: '5', name: 'Stars', def: 29 }, 40, 440],                    // 5  (100 of 20–300)
      ['dial', {}, 40, 540],                                                       // 6
      ['starfield', { amount: 100, '~amount': '20,300', atmosphere: 30 }, 320, 360],   // 7
      ['curtains', { curtains: 2, '~curtains': '1,5', rays: 100, '~rays': '20,250', height: 100, '~height': '40,180', red: 30, '~red': '0,100', fringe: 50, glow: 100, horizon: 50, '~horizon': '0,100' }, 600, 160],   // 8
      ['surface', { name: 'Aurora', ground: 'colour' }, 880, 200],                 // 9
      ['knob', { slot: '6', name: 'Horizon', def: 50 }, 40, 620]],                 // 10
    wires: [[1, 1, 8, paramPort('curtains', 'height')], [2, 1, 8, paramPort('curtains', 'rays')], [3, 1, 8, paramPort('curtains', 'curtains')], [4, 1, 8, paramPort('curtains', 'red')],
      [5, 1, 7, paramPort('starfield', 'amount')], [6, 1, 8, 2], [7, 1, 8, 1], [8, 1, 9, 1], [10, 1, 8, paramPort('curtains', 'horizon')]] },
  // 🜚 Fractured Glaze (the second): cracks that SPREAD — Tarbell's Substrate — lit as glaze by the dial
  crackle: { label: 'Fractured Glaze', div: 2, teach: 'Spreading Cracks (Tarbell\'s Substrate: long early cracks, shorter later ones at right angles) + Brushwork → Glaze. From One Point bursts them from the dial. Try: raise Chipping, or From One Point at 100.', nodes: [
      ['knob', { slot: '1', name: 'Crack Scale', def: 20 }, 40, 40],              // 1  (100 of 50–300)
      ['knob', { slot: '2', name: 'Cracks', def: 21 }, 40, 130],                  // 2  (100 of 20–400)
      ['knob', { slot: '3', name: 'From One Point', def: 30 }, 40, 220],          // 3
      ['knob', { slot: '4', name: 'Wander', def: 40 }, 40, 310],                  // 4
      ['knob', { slot: '5', name: 'Chipping', def: 0 }, 40, 400],                 // 5
      ['dial', {}, 40, 490],                                                      // 6
      ['cracks', { scale: 100, '~scale': '50,300', count: 100, '~count': '20,400', spread: 30, '~spread': '0,100', wander: 40, '~wander': '0,100', age: 0, '~age': '0,100' }, 320, 60],   // 7
      ['brushwork', { streaks: 55, runs: 30, pools: 60 }, 320, 380],              // 8
      ['hue', { slot: '1', name: 'Glaze Hue' }, 320, 500], ['hue', { slot: '2', name: 'Body Hue' }, 320, 600],   // 9, 10
      ['glaze', { scale: 100, gloss: 85, grime: 40 }, 620, 160],                  // 11
      ['surface', { name: 'Fractured Glaze', ground: 'colour' }, 900, 220]],      // 12
    wires: [[1, 1, 7, paramPort('cracks', 'scale')], [2, 1, 7, paramPort('cracks', 'count')], [3, 1, 7, paramPort('cracks', 'spread')], [4, 1, 7, paramPort('cracks', 'wander')], [5, 1, 7, paramPort('cracks', 'age')],
      [6, 1, 7, 1], [1, 1, 11, paramPort('glaze', 'scale')], [7, 1, 11, 1], [7, 2, 11, 2], [7, 3, 11, 3], [7, 4, 11, 4], [8, 1, 11, 5], [9, 1, 11, 6], [10, 1, 11, 7], [11, 1, 12, 1]] },
  // 🝆 Veins of Light: a network grown (space colonization) through a material's ways, glowing inside it
  veins: { label: 'Veins of Light', div: 2, teach: 'Matrix (material + Ways: seams, gaps, creases) → Tendrils (space colonization from the dial\'s side). Wires are cut into the height, lit by the Light Engine; Glow Hue screened along them. Try: Material › Pebbles, then turn the dial.', nodes: [
      ['knob', { slot: '1', name: 'Material', def: 10 }, 40, 40],                  // 1
      ['knob', { slot: '2', name: 'Reach', def: 60 }, 40, 130],                    // 2
      ['knob', { slot: '3', name: 'Branching', def: 50 }, 40, 220],                // 3
      ['knob', { slot: '4', name: 'Glow', def: 70 }, 40, 310],                     // 4
      ['knob', { slot: '5', name: 'Scale', def: 23 }, 40, 400],                    // 5  (100 of 40–300)
      ['knob', { slot: '6', name: 'Slide', def: 50 }, 40, 490],                    // 6
      ['dial', {}, 40, 580],                                                       // 7
      ['hue', { slot: '1', name: 'Material Hue' }, 40, 660], ['hue', { slot: '2', name: 'Glow Hue' }, 40, 740],   // 8, 9
      ['matrix', { kind: 10, '~kind': '0,100', scale: 100, '~scale': '40,300', angle: 0 }, 300, 60],   // 10
      ['tendrils', { amount: 60, '~amount': '0,100', branching: 50, '~branching': '0,100', roots: 2, inner: 0, slide: 0, '~slide': '-100,100', zoom: 100, '~zoom': '40,300', width: 100 }, 300, 320],   // 11
      ['colour', { hex: '#17120F' }, 300, 560],                                    // 12 (the material's dark)
      ['tint', {}, 560, 60],                                                       // 13
      ['math', { op: 'subtract' }, 560, 240],                                      // 14 (the wires cut into it)
      ['material', { relief: 45, gloss: 30, shine: 25, shadow: 55, occlusion: 45, ambient: 35 }, 800, 120],   // 15
      ['blend', { mode: 'screen', opacity: 70, '~opacity': '0,100' }, 1040, 200],  // 16
      ['surface', { name: 'Veins of Light', ground: 'colour' }, 1280, 220]],       // 17
    wires: [[1, 1, 10, paramPort('matrix', 'kind')], [5, 1, 10, paramPort('matrix', 'scale')], [5, 1, 11, paramPort('tendrils', 'zoom')], [2, 1, 11, paramPort('tendrils', 'amount')], [3, 1, 11, paramPort('tendrils', 'branching')],
      [6, 1, 11, paramPort('tendrils', 'slide')], [7, 1, 11, 2], [10, 3, 11, 1], [10, 1, 13, 1], [8, 1, 13, 2], [12, 1, 13, 3], [10, 2, 14, 1], [11, 1, 14, 2],
      [13, 1, 15, 1], [14, 1, 15, 2], [15, 1, 16, 1], [9, 1, 16, 2], [11, 2, 16, 3], [4, 1, 16, paramPort('blend', 'opacity')], [16, 1, 17, 1]] },
  // ⎐ Knotwork: Cromwell's plait and breaks → Blur (the ribbon rounded) → Light Engine
  knotwork: { label: 'Knotwork', div: 2, teach: 'Knotwork (Cromwell\'s plait; Breaks turn strands back into knots inside an outline) → Blur the height → Light Engine. Try: Breaks 0 for a plain plait, or more Strands.', nodes: [
      ['knob', { slot: '1', name: 'Size', def: 23 }, 40, 40],                      // 1  (100 of 40–300)
      ['knob', { slot: '2', name: 'Strands', def: 14 }, 40, 130],                  // 2  (6 of 3–24)
      ['knob', { slot: '3', name: 'Breaks', def: 45 }, 40, 220],                   // 3
      ['knob', { slot: '4', name: 'Shape', def: 0 }, 40, 310],                     // 4
      ['knob', { slot: '5', name: 'Ribbon Width', def: 50 }, 40, 400],             // 5  (55 of 20–90)
      ['knob', { slot: '6', name: 'Slide', def: 50 }, 40, 490],                    // 6
      ['dial', {}, 40, 580],                                                       // 7
      ['knotwork', { size: 100, '~size': '40,300', cells: 6, '~cells': '3,24', breaks: 45, '~breaks': '0,100', shape: 0, '~shape': '0,100', width: 55, '~width': '20,90', offset: 0, '~offset': '-100,100' }, 320, 160],   // 8
      ['blur', { radius: 5 }, 600, 260],                                           // 9
      ['material', { relief: 30, gloss: 45, shine: 40, shadow: 60, occlusion: 45, ambient: 40 }, 840, 180],   // 10
      ['surface', { name: 'Knotwork', ground: 'grey' }, 1080, 200]],               // 11
    wires: [[1, 1, 8, paramPort('knotwork', 'size')], [2, 1, 8, paramPort('knotwork', 'cells')], [3, 1, 8, paramPort('knotwork', 'breaks')], [4, 1, 8, paramPort('knotwork', 'shape')],
      [5, 1, 8, paramPort('knotwork', 'width')], [6, 1, 8, paramPort('knotwork', 'offset')], [7, 1, 8, 1], [8, 2, 9, 1], [8, 1, 10, 1], [9, 1, 10, 2], [10, 1, 11, 1]] },
  // 🜉 Lichtenberg Figures: Discharge → Burn into Wood → Light Engine (the dial: where the strike enters, and the light)
  lichtenberg: { label: 'Lichtenberg Figures', div: 2, teach: 'Discharge (Laplacian growth from Strike From) → Burn into Wood → Light Engine. Material moves from char to embers to acrylic. Try: Poles 1, or Contour Lines into Burn\'s Channels.', nodes: [
      ['knob', { slot: '1', name: 'Reach', def: 50 }, 40, 40],                     // 1
      ['knob', { slot: '2', name: 'Branching', def: 50 }, 40, 140],                // 2
      ['knob', { slot: '3', name: 'Poles', def: 100 }, 40, 240],                   // 3  (2 of 1–2)
      ['knob', { slot: '4', name: 'Material', def: 0 }, 40, 340],                  // 4
      ['dial', {}, 40, 440],                                                       // 5
      ['hue', { slot: '1', name: 'Wood Hue' }, 40, 520], ['hue', { slot: '2', name: 'Grain Hue' }, 40, 600],   // 6, 7
      ['wood', { rings: 40, figure: 50 }, 300, 520],                               // 8
      ['discharge', { reach: 50, '~reach': '0,100', branching: 50, '~branching': '0,100', poles: 2, '~poles': '1,2', grain: 30, width: 100, zoom: 100, '~zoom': '50,400', offset: 0, '~offset': '-100,100' }, 300, 120],   // 9
      ['burn', { material: 0, '~material': '0,100', scorch: 50, depth: 55 }, 580, 300],   // 10
      ['material', { relief: 35, gloss: 30, shine: 25, shadow: 55, occlusion: 40, ambient: 40 }, 840, 300],   // 11
      ['surface', { name: 'Lichtenberg Figures', ground: 'colour' }, 1100, 320],   // 12
      ['knob', { slot: '5', name: 'Zoom', def: 14 }, 40, 680], ['knob', { slot: '6', name: 'Slide', def: 50 }, 40, 760]],   // 13 (100 of 50–400), 14
    wires: [[1, 1, 9, paramPort('discharge', 'reach')], [2, 1, 9, paramPort('discharge', 'branching')], [3, 1, 9, paramPort('discharge', 'poles')], [4, 1, 10, paramPort('burn', 'material')],
      [5, 1, 9, 1], [5, 1, 11, 7], [6, 1, 8, 1], [7, 1, 8, 2], [8, 1, 10, 1], [9, 1, 10, 2], [10, 1, 11, 1], [10, 2, 11, 2], [11, 1, 12, 1], [13, 1, 9, paramPort('discharge', 'zoom')], [14, 1, 9, paramPort('discharge', 'offset')]] },
  // 🜉 Ruffled Growth: a Growing Line, its body raised and lit
  growth: { label: 'Ruffled Growth', div: 2, teach: 'Growing Line (differential growth toward the dial\'s Sun) → body as picture and height → Light Engine. Try: raise Seeds, or burn the line into Wood.', nodes: [
      ['knob', { slot: '1', name: 'Growth', def: 55 }, 40, 40],                    // 1
      ['knob', { slot: '2', name: 'Fold Size', def: 25 }, 40, 140],                // 2  (100 of 50–250)
      ['knob', { slot: '3', name: 'Seeds', def: 0 }, 40, 240],                     // 3  (1 of 1–7)
      ['knob', { slot: '4', name: 'Relief', def: 50 }, 40, 340],                   // 4
      ['dial', {}, 40, 440],                                                       // 5
      ['growline', { growth: 55, '~growth': '0,100', fold: 100, '~fold': '50,250', seeds: 1, '~seeds': '1,7', photo: 40, zoom: 100, '~zoom': '50,400', offset: 0, '~offset': '-100,100' }, 300, 120],   // 6
      ['number', { value: 40 }, 300, 380], ['number', { value: 74 }, 300, 460],   // 7, 8 (the ground, the body)
      ['mix', { t: 50 }, 560, 300],                                                // 9
      ['number', { value: 18 }, 560, 460],                                         // 10 (the line's crease)
      ['mix', { t: 50 }, 780, 300],                                                // 11
      ['material', { relief: 40, '~relief': '0,90', gloss: 35, shine: 30, shadow: 55, occlusion: 45, ambient: 40 }, 1000, 200],   // 12
      ['surface', { name: 'Ruffled Growth', ground: 'grey' }, 1240, 220],          // 13
      ['knob', { slot: '5', name: 'Zoom', def: 14 }, 40, 540], ['knob', { slot: '6', name: 'Slide', def: 50 }, 40, 620]],   // 14 (100 of 50–400), 15
    wires: [[1, 1, 6, paramPort('growline', 'growth')], [2, 1, 6, paramPort('growline', 'fold')], [3, 1, 6, paramPort('growline', 'seeds')], [4, 1, 12, paramPort('material', 'relief')],
      [5, 1, 6, 1], [7, 1, 9, 1], [8, 1, 9, 2], [6, 2, 9, 3], [9, 1, 11, 1], [10, 1, 11, 2], [6, 1, 11, 3], [11, 1, 12, 1], [6, 3, 12, 2], [12, 1, 13, 1], [14, 1, 6, paramPort('growline', 'zoom')], [15, 1, 6, paramPort('growline', 'offset')]] },
  // 🜚 Poured Wax (Ruby: waxier, and a slider from wax to a fluid's spatter): Pours → Meniscus → colour → Light Engine
  wax: { label: 'Poured Wax', div: 2, teach: 'Pours → Meniscus → color by thickness → Light Engine with Translucency; Glow Hue screened where thick. Splatter flings drops from the dial. Try: Splatter 80, Viscosity 0 for spilt ink.', nodes: [
      ['knob', { slot: '1', name: 'Pool Size', def: 17 }, 40, 40],                 // 1  (100 of 40–400)
      ['knob', { slot: '2', name: 'Pool Count', def: 27 }, 40, 130],               // 2  (100 of 25–300)
      ['knob', { slot: '3', name: 'Viscosity', def: 45 }, 40, 220],                // 3
      ['knob', { slot: '4', name: 'Splatter', def: 0 }, 40, 310],                  // 4
      ['knob', { slot: '5', name: 'Height', def: 50 }, 40, 400],                   // 5
      ['knob', { slot: '6', name: 'Sheen', def: 50 }, 40, 490],                    // 6
      ['dial', {}, 40, 580],                                                       // 7
      ['hue', { slot: '1', name: 'Wax Hue' }, 300, 420], ['glowhue', {}, 1040, 460],   // 8, 9
      ['pours', { size: 100, '~size': '40,400', count: 100, '~count': '25,300', viscosity: 45, '~viscosity': '0,100', splatter: 0, '~splatter': '0,100' }, 300, 60],   // 10
      ['meniscus', { viscosity: 45, '~viscosity': '0,100', height: 50, '~height': '0,100', lumps: 50 }, 560, 60],   // 11
      ['hsv', { hue: 0, sat: 92, val: 145 }, 560, 420],                            // 12 (the wax where it is thin: lighter)
      ['mix', { t: 50 }, 800, 380],                                                // 13
      ['number', { value: 50 }, 800, 520],                                         // 14 (the page beneath)
      ['mix', { t: 50 }, 1040, 300],                                               // 15
      ['material', { relief: 58, gloss: 60, '~gloss': '20,100', shine: 50, '~shine': '10,90', shadow: 45, occlusion: 20, ambient: 42, translucency: 45 }, 1280, 160],   // 16
      ['blend', { mode: 'screen', opacity: 85 }, 1520, 220],                       // 17
      ['surface', { name: 'Poured Wax', ground: 'grey' }, 1760, 240]],             // 18
    wires: [[1, 1, 10, paramPort('pours', 'size')], [2, 1, 10, paramPort('pours', 'count')], [3, 1, 10, paramPort('pours', 'viscosity')], [3, 1, 11, paramPort('meniscus', 'viscosity')], [4, 1, 10, paramPort('pours', 'splatter')],
      [5, 1, 11, paramPort('meniscus', 'height')], [6, 1, 16, paramPort('material', 'gloss')], [6, 1, 16, paramPort('material', 'shine')], [7, 1, 10, 1], [7, 1, 16, 7],
      [10, 1, 11, 1], [8, 1, 12, 1], [8, 1, 13, 1], [12, 1, 13, 2], [11, 3, 13, 3], [14, 1, 15, 1], [13, 1, 15, 2], [11, 2, 15, 3],
      [15, 1, 16, 1], [11, 1, 16, 2], [16, 1, 17, 1], [9, 1, 17, 2], [11, 4, 17, 3], [17, 1, 18, 1]] },
  // 🜚 Contour Map: Terrain → Contour Lines, inked over the land lit by the Light Engine (the hillshade)
  contour: { label: 'Contour Map', div: 2, teach: 'Terrain → hillshade (Light Engine), faded by Hillshade; Contour Lines inked over it. Try: a Gradient or another texture into Contour Lines.', nodes: [
      ['knob', { slot: '1', name: 'Terrain Scale', def: 23 }, 40, 40],             // 1  (100 of 40–300)
      ['knob', { slot: '2', name: 'Contour Interval', def: 32 }, 40, 160],         // 2  (100 of 30–250)
      ['knob', { slot: '3', name: 'Hillshade', def: 45 }, 40, 280],                // 3
      ['terrain', { scale: 100, '~scale': '40,300', crests: 22, variant: 0 }, 300, 40],   // 4
      ['number', { value: 50 }, 300, 220],                                         // 5  (a plain gray picture)
      ['material', { relief: 200, gloss: 5, shine: 0, shadow: 35, occlusion: 15, ambient: 45 }, 560, 160],   // 6
      ['mix', { t: 45, '~t': '0,100' }, 820, 200],                                 // 7  (the hillshade, faded to gray)
      ['contours', { levels: 20, '~levels': '6,50', weight: 100, index: 5, strength: 90 }, 560, 0],   // 8
      ['colour', { hex: '#222222' }, 820, 20],                                     // 9  (the ink)
      ['mix', { t: 50 }, 1060, 100],                                               // 10 (the lines inked over it)
      ['surface', { name: 'Contour Map', ground: 'grey' }, 1300, 100]],            // 11
    wires: [[1, 1, 4, paramPort('terrain', 'scale')], [2, 1, 8, paramPort('contours', 'levels')], [3, 1, 7, paramPort('mix', 't')],
      [5, 1, 6, 1], [4, 1, 6, 2], [5, 1, 7, 1], [6, 1, 7, 2], [4, 1, 8, 1], [7, 1, 10, 1], [9, 1, 10, 2], [8, 1, 10, 3], [10, 1, 11, 1]] },
  // ∆ Turing Skin: Turing Pattern → raised by the Light Engine
  turing: { label: 'Turing Skin', div: 2, teach: 'Turing Pattern (Gray–Scott) → Map Range → Light Engine by Relief. Try: Pattern › Maze, or a Color Ramp before lighting.', nodes: [
      ['knob', { slot: '1', name: 'Pattern Scale', def: 25 }, 40, 40],             // 1  (100 of 50–250)
      ['knob', { slot: '2', name: 'Growth', def: 75 }, 40, 140],                   // 2  (80 of 20–100)
      ['knob', { slot: '3', name: 'Pattern', def: 25 }, 40, 240],                  // 3
      ['knob', { slot: '4', name: 'Relief', def: 50 }, 40, 340],                   // 4
      ['grayscott', { pattern: 25, '~pattern': '0,100', growth: 80, '~growth': '20,100', scale: 100, '~scale': '50,250', variant: 0 }, 300, 80],   // 5
      ['maprange', { inLo: 0, inHi: 100, outLo: 31, outHi: 69 }, 560, 40],          // 6  (the skin 128 ∓ 48)
      ['material', { relief: 23, '~relief': '6,40', gloss: 35, shine: 47, shadow: 45, occlusion: 40, ambient: 45 }, 800, 120],   // 7
      ['surface', { name: 'Turing Skin', ground: 'grey' }, 1060, 140]],            // 8
    wires: [[1, 1, 5, paramPort('grayscott', 'scale')], [2, 1, 5, paramPort('grayscott', 'growth')], [3, 1, 5, paramPort('grayscott', 'pattern')], [4, 1, 7, paramPort('material', 'relief')],
      [5, 1, 6, 1], [6, 1, 7, 1], [5, 1, 7, 2], [7, 1, 8, 1]] },
  // 🜚 Watercolor Wash: Washes lays two pigments' shapes; a Pigment part lays each on the paper
  watercolour: { label: 'Watercolor Wash', div: 2, teach: 'Washes (two layered blob shapes) → Pigment → Pigment; overlaps mix, edges darken, paint runs toward the dial. Try: Cells or noise into a Pigment\'s Density.', nodes: [
      ['knob', { slot: '1', name: 'Wash Size', def: 29 }, 40, 40],                 // 1  (100 of 40–250)
      ['knob', { slot: '2', name: 'Pigment', def: 32 }, 40, 140],                  // 2  (100 of 30–250)
      ['knob', { slot: '3', name: 'Wetness', def: 50 }, 40, 240],                  // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Pigment Hue' }, 40, 420], ['hue', { slot: '2', name: 'Second Pigment Hue' }, 40, 500],   // 5, 6
      ['washes', { amount: 100, '~amount': '30,250', size: 100, '~size': '40,250', wet: 50, '~wet': '0,100' }, 300, 60],   // 7
      ['pigment', { wet: 50, '~wet': '0,100' }, 560, 60],                          // 8
      ['pigment', { wet: 50, '~wet': '0,100' }, 800, 160],                         // 9
      ['surface', { name: 'Watercolor Wash', ground: 'colour' }, 1040, 160]],      // 10
    wires: [[1, 1, 7, paramPort('washes', 'size')], [2, 1, 7, paramPort('washes', 'amount')], [3, 1, 7, paramPort('washes', 'wet')], [3, 1, 8, paramPort('pigment', 'wet')], [3, 1, 9, paramPort('pigment', 'wet')],
      [7, 1, 8, 2], [5, 1, 8, 3], [4, 1, 8, 4], [8, 1, 9, 1], [7, 2, 9, 2], [6, 1, 9, 3], [4, 1, 9, 4], [9, 1, 10, 1]] },
  // ♡ Flow-Field Ink: one Flow Lines part, the dial its current
  flowfield: { label: 'Flow-Field Ink', canvas: true, teach: 'Flow Lines: evenly spaced streamlines along the dial\'s direction, bent by Turbulence. The two hues are the inks. Try: Terrain or noise into Angle Map.', nodes: [
      ['knob', { slot: '1', name: 'Scale', def: 29 }, 40, 40],                     // 1  (100 of 40–250)
      ['knob', { slot: '2', name: 'Lines', def: 26 }, 40, 140],                    // 2  (100 of 30–300)
      ['knob', { slot: '3', name: 'Turbulence', def: 50 }, 40, 240],               // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Ink Hue' }, 40, 420], ['hue', { slot: '2', name: 'Second Ink Hue' }, 40, 500],   // 5, 6
      ['flowlines', { amount: 100, '~amount': '30,300', size: 100, '~size': '40,250', turbulence: 50, '~turbulence': '0,100' }, 320, 140],   // 7
      ['surface', { name: 'Flow-Field Ink', ground: 'colour' }, 600, 160]],        // 8
    wires: [[1, 1, 7, paramPort('flowlines', 'size')], [2, 1, 7, paramPort('flowlines', 'amount')], [3, 1, 7, paramPort('flowlines', 'turbulence')],
      [4, 1, 7, 5], [5, 1, 7, 3], [6, 1, 7, 4], [7, 1, 8, 1]] },
  // ♡ First Snow, Burning Mana and Euphoria Dust: one Particles part each, of its own kind
  snow: { label: 'First Snow', canvas: true, teach: 'Particles › flakes. The Light Dial sets the wind direction; Wind its strength. Try: Kind › sparks.', nodes: [
      ['knob', { slot: '1', name: 'Flake Size', def: 14 }, 40, 40],                // 1  (100 of 60–340)
      ['knob', { slot: '2', name: 'Snowfall', def: 33 }, 40, 140],                 // 2  (100 of 20–260)
      ['knob', { slot: '3', name: 'Wind', def: 0 }, 40, 240],                      // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['particles', { kind: 'flakes', amount: 100, '~amount': '20,260', size: 100, '~size': '60,340', form: 0, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'First Snow', ground: 'grey' }, 600, 120]],              // 6
    wires: [[1, 1, 5, paramPort('particles', 'size')], [2, 1, 5, paramPort('particles', 'amount')], [3, 1, 5, paramPort('particles', 'form')], [4, 1, 5, 4], [5, 1, 6, 1]] },
  embers: { label: 'Burning Mana', canvas: true, teach: 'Particles › sparks: ballistic arcs, white-hot heads. Hues follow the accents until set; Hue Drift varies each spark. Try: a texture into Over.', nodes: [
      ['knob', { slot: '1', name: 'Ember Size', def: 7 }, 40, 40],                 // 1  (100 of 60–600)
      ['knob', { slot: '2', name: 'Ember Count', def: 17 }, 40, 140],              // 2  (100 of 20–500)
      ['knob', { slot: '3', name: 'Hue Drift', def: 10 }, 40, 240],                // 3
      ['hue', { slot: '1', name: 'Ember Hue' }, 40, 340], ['hue', { slot: '2', name: 'Spark Hue' }, 40, 420],   // 4, 5
      ['particles', { kind: 'sparks', amount: 100, '~amount': '20,500', size: 100, '~size': '60,600', form: 10, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Burning Mana', ground: 'grey' }, 600, 120]],            // 7
    wires: [[1, 1, 6, paramPort('particles', 'size')], [2, 1, 6, paramPort('particles', 'amount')], [3, 1, 6, paramPort('particles', 'form')], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  magicparticles: { label: 'Euphoria Dust', canvas: true, teach: 'Particles › motes. Chaos: trails at 0, scattered at 50, bursts at 100. Try: Chaos at 0, then 100.', nodes: [
      ['knob', { slot: '1', name: 'Sparkle Size', def: 44 }, 40, 40],              // 1  (100 of 20–200)
      ['knob', { slot: '2', name: 'Sparkle Count', def: 23 }, 40, 140],            // 2  (100 of 10–400)
      ['knob', { slot: '3', name: 'Chaos', def: 50 }, 40, 240],                    // 3
      ['hue', { slot: '1', name: 'Sparkle Hue' }, 40, 340], ['hue', { slot: '2', name: 'Glow Hue' }, 40, 420],   // 4, 5
      ['particles', { kind: 'motes', amount: 100, '~amount': '10,400', size: 100, '~size': '20,200', form: 50, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Euphoria Dust', ground: 'grey' }, 600, 120]],           // 7
    wires: [[1, 1, 6, paramPort('particles', 'size')], [2, 1, 6, paramPort('particles', 'amount')], [3, 1, 6, paramPort('particles', 'form')], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  // √ Halftone: a soft Value Noise for the tone, printed as a Halftone Screen of dots.
  halftone: { label: 'Halftone', canvas: true, teach: 'Value Noise (one octave) → Halftone Screen. Dot Scale: cell size; Dot Weight: ink. Try: another texture into the tone, or turn Screen Angle.', nodes: [
      ['knob', { slot: '1', name: 'Dot Scale', def: 14 }, 40, 40],                 // 1  (100 of 50–400)
      ['knob', { slot: '2', name: 'Dot Weight', def: 33 }, 40, 140],               // 2  (100 of 30–240)
      ['noise', { scale: 10, octaves: 1 }, 320, 40],                               // 3
      ['screen', { scale: 100, weight: 100, angle: 0 }, 600, 80],                  // 4
      ['surface', { name: 'Halftone', ground: 'grey' }, 880, 100]],                // 5
    wires: [[1, 1, 4, paramPort('screen', 'scale')], [2, 1, 4, paramPort('screen', 'weight')], [3, 1, 4, 1], [4, 1, 5, 1]] },
  // √ Film Grain: one part, its Kind sliding from silver to digital
  grain: { label: 'Film Grain', canvas: true, teach: 'Film Grain. Kind runs from silver halide through film and paper to digital sensor noise. Try: Kind 66 (paper), then Blend it over another texture.', nodes: [
      ['knob', { slot: '1', name: 'Grain Size', def: 0 }, 40, 40],                 // 1  (100 of 100–600)
      ['knob', { slot: '2', name: 'Contrast', def: 33 }, 40, 140],                 // 2  (100 of 30–240)
      ['knob', { slot: '3', name: 'Grain', def: 33 }, 40, 240],                    // 3
      ['grain', { size: 100, contrast: 100, kind: 33 }, 320, 80],                  // 4
      ['surface', { name: 'Film Grain', ground: 'grey' }, 600, 100]],              // 5
    wires: [[1, 1, 4, paramPort('grain', 'size')], [2, 1, 4, paramPort('grain', 'contrast')], [3, 1, 4, paramPort('grain', 'kind')], [4, 1, 5, 1]] },
  // √ Painter's Frustration: Angry Strokes lays the paint and its thickness; a little Canvas Weave
  // goes into the thickness (the oil-on-canvas module: weave, Mix, Light Engine, right before the
  // Surface); the Light Engine lights the impasto by the dial. Wetness also flattens and glosses it.
  brushstrokes: { label: "Painter's Frustration", canvas: true, teach: 'Angry Strokes → thickness mixed with Canvas Weave → Light Engine. Wetness drives the strokes and the engine\'s Relief, Gloss and Shine. Try: turn the dial, then raise Wetness.', nodes: [
      ['knob', { slot: '1', name: 'Stroke Width', def: 13 }, 40, 40],              // 1  (100 of 60–380)
      ['knob', { slot: '2', name: 'Stroke Count', def: 33 }, 40, 140],             // 2  (100 of 20–260)
      ['knob', { slot: '3', name: 'Wetness', def: 0 }, 40, 240],                   // 3
      ['strokes', { width: 100, count: 100, wet: 0 }, 320, 60],                    // 4
      ['canvasweave', { pitch: 100 }, 320, 320],                                   // 5
      ['mix', { t: 4 }, 600, 220],                                                 // 6
      ['material', { relief: 87, '~relief': '87,39', gloss: 25, '~gloss': '25,85', shine: 22, '~shine': '22,65', shadow: 55, occlusion: 30, ambient: 45 }, 860, 80],   // 7
      ['surface', { name: "Painter's Frustration", ground: 'grey' }, 1120, 120]],  // 8
    wires: [[1, 1, 4, paramPort('strokes', 'width')], [2, 1, 4, paramPort('strokes', 'count')], [3, 1, 4, paramPort('strokes', 'wet')],
      [3, 1, 7, paramPort('material', 'relief')], [3, 1, 7, paramPort('material', 'gloss')], [3, 1, 7, paramPort('material', 'shine')],
      [4, 1, 7, 1], [4, 2, 6, 1], [5, 1, 6, 2], [6, 1, 7, 2], [7, 1, 8, 1]] },
  landscape: { label: 'Painted Landscape', canvas: true, teach: 'Painted Sky → Painted Ridges → Watercolor Wash → Oil Paint → Light Engine. Distance, Tilt and Color each drive sky and ridges together. Try: set Country, then raise Color.', nodes: [
      ['knob', { slot: '1', name: 'Distance', def: 29 }, 40, 40],                 // 1  (100 of 60–200)
      ['knob', { slot: '2', name: 'Ridges', def: 35 }, 40, 140],                  // 2  (100 of 20–250)
      ['knob', { slot: '3', name: 'Wetness', def: 0 }, 40, 240],                  // 3
      ['knob', { slot: '4', name: 'Tilt', def: 0 }, 40, 340],                     // 4
      ['knob', { slot: '5', name: 'Color', def: 0 }, 40, 440],                    // 5
      ['sky', { time: 'seed', clouds: 'seed', size: 100, tilt: 0, colour: 0 }, 320, 40],                                  // 6
      ['ridges', { country: 'seed', time: 'seed', bands: 100, distance: 100, tilt: 0, colour: 0 }, 600, 120],            // 7
      ['wash', { wet: 0 }, 880, 160],                                             // 8
      ['surface', { name: 'Painted Landscape', ground: 'grey' }, 1720, 180],     // 9
      ['oilpaint', { amount: 50, size: 100, length: 100, detail: 50, vary: 40 }, 1160, 160],   // 10
      ['material', { relief: 20, '~relief': '0,40', gloss: 25, shine: 30, shadow: 50, occlusion: 30, ambient: 45 }, 1440, 180],   // 11
      ['knob', { slot: '6', name: 'Impasto', def: 50 }, 880, 400]],               // 12
    wires: [[1, 1, 6, paramPort('sky', 'size')], [1, 1, 7, paramPort('ridges', 'distance')], [2, 1, 7, paramPort('ridges', 'bands')], [3, 1, 8, paramPort('wash', 'wet')],
      [4, 1, 6, paramPort('sky', 'tilt')], [4, 1, 7, paramPort('ridges', 'tilt')], [5, 1, 6, paramPort('sky', 'colour')], [5, 1, 7, paramPort('ridges', 'colour')],
      [6, 1, 7, 1], [7, 1, 8, 1], [8, 1, 10, 1], [10, 1, 11, 1], [10, 2, 11, 2], [11, 1, 9, 1],
      [12, 1, 10, paramPort('oilpaint', 'amount')], [12, 1, 11, paramPort('material', 'relief')]] },
};
