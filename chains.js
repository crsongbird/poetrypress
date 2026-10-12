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
  plainnoise: { label: 'Plain Noise', div: 2, teach: 'This is Plain Noise, a soft cloudy ground. Value Noise makes the clouds: Scale sets how many across the page, Detail adds finer clouds over them (octaves). Levels sets the Contrast by moving its dark and light points toward each other. Try: wire this noise into another part\'s gray input, a Warp or a Color Ramp.', nodes: [
      ['knob', { slot: '1', name: 'Scale', def: 30 }, 40, 40],                     // 1
      ['knob', { slot: '2', name: 'Detail', def: 50 }, 40, 140],                   // 2
      ['knob', { slot: '3', name: 'Contrast', def: 20 }, 40, 240],                 // 3
      ['noise', { scale: 60, '~scale': '5,200', octaves: 4, '~octaves': '1,6' }, 320, 60],   // 4
      ['levels', { lo: 0, '~lo': '0,40', hi: 100, '~hi': '100,60', gamma: 50 }, 600, 120],  // 5
      ['surface', { name: 'Plain Noise', ground: 'grey' }, 880, 120]],             // 6
    wires: [[1, 1, 4, paramPort('noise', 'scale')], [2, 1, 4, paramPort('noise', 'octaves')], [3, 1, 5, paramPort('levels', 'lo')], [3, 1, 5, paramPort('levels', 'hi')],
      [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🜛 Stripes: Waves → Threshold
  stripes: { label: 'Stripes', div: 2, teach: 'This is Stripes. Waves makes smooth bands of light and dark; Threshold cuts them into stripes. Where Threshold cuts sets the Stripe Width, and its Softness blurs the edges back toward waves. Angle turns the Waves. Try: wire a Value Noise into the Waves\' Warp input to make the stripes wander like wood grain.', nodes: [
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
  polka: { label: 'Polka Dots', div: 2, teach: 'This is Polka Dots, made from Cells. With no Jitter, Cells puts one point in the middle of every square of a grid; its first output is how far each spot is from the nearest point. Threshold keeps what is near: a round dot about every point. Spacing is Cells\' Scale, Dot Size is where Threshold cuts, and Scatter is the Jitter that throws the points out of their rows. Try: wire the Cells\' Edges output into the Surface instead.', nodes: [
      ['knob', { slot: '1', name: 'Spacing', def: 50 }, 40, 40],                   // 1
      ['knob', { slot: '2', name: 'Dot Size', def: 45 }, 40, 140],                 // 2
      ['knob', { slot: '3', name: 'Scatter', def: 0 }, 40, 240],                   // 3
      ['cells', { scale: 110, '~scale': '200,30', jitter: 0, '~jitter': '0,100' }, 320, 60],  // 4
      ['threshold', { at: 25, '~at': '8,46', soft: 4, '~soft': '2,6' }, 600, 120], // 5
      ['surface', { name: 'Polka Dots', ground: 'grey' }, 880, 120]],              // 6
    wires: [[1, 1, 4, paramPort('cells', 'scale')], [3, 1, 4, paramPort('cells', 'jitter')], [2, 1, 5, paramPort('threshold', 'at')],
      [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🜛 Checkerboard: two Waves, across and down, each cut by Threshold; Math (difference) crosses them
  checker: { label: 'Checkerboard', div: 2, teach: 'This is Checkerboard. Two Waves, one across and one down, are each cut into stripes by Threshold. Math, set to Difference, keeps a square where exactly one of the two stripes is light: that is a checkerboard. One Knob (Squares) sets both Waves\' Frequency, Softness both Thresholds, and Turn both Angles, so the squares stay square. Try: set Math to Multiply for a grid of windows, or Max for a plaid.', nodes: [
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
  softgradient: { label: 'Gradient', div: 4, teach: 'This is Gradient, a smooth fall from dark to light. There are two Gradient parts, one straight and one round (Invert turns the round one into a glow, light in the middle); Mix blends between them by Roundness, so the ramp can bend into a glow. Angle turns the straight one. Levels\' Gamma is the Falloff: how quickly the light gives way. Try: wire a Value Noise into Mix\'s amount instead of the Knob.', nodes: [
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
  cells: { label: 'Cells', div: 2, teach: 'This is Cells, like pebbles, cobbles or a sponge. Cells gives the distance to each cell\'s middle and the lines between cells; Invert turns each the right way up (light in the middle). Mix blends the round domes into flat cells with crisp lines by Lines. The same picture goes into the Surface\'s Height, scaled by Relief, so the dial lights it. Try: turn the light dial on the page, then set Order to 0 for a grid of tiles.', nodes: [
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
  rainstreaks: { label: 'Harsh Rain', div: 2, teach: 'This is Harsh Rain. The Light Dial sets the direction the rain comes from. The first Streaks part draws far, soft sheets of rain; the second draws near streaks over them. The two Knobs are this texture\'s sliders on the page (Rain Zoom and Gusts), wired into the settings they move. Try: turn the dial, then raise Gusts.', nodes: [
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
  hatch: { label: 'Silverpoint Hatch', div: 2, teach: 'This is Silverpoint Hatch. Soft Forms makes a few large shapes that say where the drawing is dark. Hatching draws pencil strokes that gather in those dark places, along the dial\'s direction. Two Colors, mixed by the Age knob, make the ink, and a Color Ramp lays the ink over a gray ground. Try: raise Cross-Hatching, then change Soft Forms\' Size.', nodes: [
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
  linen: { label: 'Linen Tooth', teach: 'This is Linen Tooth. Weave makes the threads, as shading and sheen. Cloth & Details colors them with two Hues and adds seams and stitching, lit by the dial. The Knobs are this texture\'s sliders on the page. Try: move the Weave knob from silk to burlap.', grid: (w, h, S, k) => weaveGridDiv(w, h, S, (50 + (k[0] ?? 14.3)*3.5)/100), nodes: [
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
  crackedglaze: { label: 'Fractured Glaze', div: 2, teach: 'This is Fractured Glaze. Crazing makes four maps of cracked glaze: its heights, the glaze, grime in the cracks, and the finest cracks. Brushwork says how thickly the glaze was painted. Glaze lights and colors all of these with two Hues. Try: raise Enameling to see the glaze age and peel.', nodes: [
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
  cards: { label: 'Cartomancy', canvas: true, teach: 'This is Cartomancy. Table draws a table top under a lamp; Deal lays a card game on it. The menus left at “seed” let the seed choose (the game, the table, the cards, the coins); pick one to fix it. The four suits are the page\'s two Accents and the texture\'s two Hues. The Knobs are this texture\'s sliders: Cards in Play, Scatter, Stakes, Clutter (what else is on the table) and Wear (how damaged the cards are). Try: set Game to “ring”, then press ⟳ Seed. A Table Objects part lays the same candles, cups and letters on any picture.', nodes: [
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
  clouds: { label: 'Sleep Haze', canvas: true, teach: 'This is Sleep Haze. Smoke makes a density map: haze in layers and wisps rising (Lift and Drag set how). A Light Shaft shines from the Light Dial\'s direction through that density, so the smoke glows inside the beam; its second output is the beam itself. Dust Motes draws specks that show only where the beam catches them. Try: wire a Value Noise into the Light Shaft instead of the Smoke.', nodes: [
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
  metalleaf: { label: 'Scattered Polygons', canvas: true, teach: 'This is Scattered Polygons. Flakes lays translucent flakes of leaf, in the Leaf Hue, over whatever comes into its Base (here nothing, so a gray ground). Shape makes them polygons of every kind, Sheen tilts each toward the dial\'s light, and Glitter speckles them. Its Mask output shows where the flakes lie, so Mix can lay them onto another picture. Try: wire a Value Noise into Base.', nodes: [
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
  stainedglass: { label: 'Stained Glass', div: 3, teach: 'This is Stained Glass. Panes lays out the window (random shards, a lattice, a rose window or a grid, chosen by Shape) and hands on four maps: the lead, the distance from it, a number for each pane, and each pane\'s color slot. Glass lights them: from behind, toward the dial\'s sun, and from the front, where each domed pane catches the light. Try: wire Cells into Glass instead of Panes.', nodes: [
      ['knob', { slot: '1', name: 'Pane Size', def: 25 }, 40, 40],                // 1  (100 of 50–250)
      ['knob', { slot: '2', name: 'Leading', def: 32 }, 40, 140],                 // 2  (100 of 30–250)
      ['knob', { slot: '3', name: 'Shape', def: 25 }, 40, 240],                   // 3
      ['hue', { slot: '1', name: 'Glass Hue' }, 40, 340],                         // 4
      ['hue', { slot: '2', name: 'Second Glass Hue' }, 40, 440],                  // 5
      ['panes', { size: 100, leading: 100, shape: 25 }, 320, 60],                 // 6
      ['glass', { relief: 100 }, 600, 140],                                       // 7
      ['surface', { name: 'Stained Glass', ground: 'colour' }, 880, 180]],        // 8
    wires: [[1, 1, 6, paramPort('panes', 'size')], [2, 1, 6, paramPort('panes', 'leading')], [3, 1, 6, paramPort('panes', 'shape')],
      [6, 1, 7, 1], [6, 2, 7, 2], [6, 3, 7, 3], [6, 4, 7, 4], [4, 1, 7, 5], [5, 1, 7, 6], [7, 1, 8, 1]] },
  // ⛰ Painted Landscape: a painted sky, the country's ridges painted over it, a watercolour wash
  // 🜚 Contour Map: Terrain → Contour Lines, inked over the land lit by the Light Engine (the hillshade)
  contour: { label: 'Contour Map', div: 2, teach: 'This is Contour Map, a survey of an imagined land. Terrain makes the land\'s heights. The Light Engine lights a plain gray picture by those heights (the hillshade), and Mix fades it toward plain gray by the Hillshade knob. Contour Lines draws the lines of equal height, every fifth heavier; the last Mix inks them over the hillshade in the Ink color. Try: wire another texture, or a Gradient, into Contour Lines instead of the Terrain.', nodes: [
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
  turing: { label: 'Turing Skin', div: 2, teach: 'This is Turing Skin. Turing Pattern grows the marks of an animal\'s skin or a coral (Pattern slides from spots to holes). Map Range turns it into a picture, the marks a little lighter than the skin between, and the Light Engine raises the marks by Relief and lights them by the dial. Try: wire the Turing Pattern into a Color Ramp first, or set Pattern to Maze.', nodes: [
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
  watercolour: { label: 'Watercolor Wash', div: 2, teach: 'This is Watercolor Wash. Washes lays the shapes of two pigments, each a blob drawn forty times over, a little differently each time, so its edges go soft. Each Pigment part lays one of them on the paper as watercolor does: darker at the drying edge, settling in the paper\'s tooth, running toward where the dial points. The second Pigment paints over the first, so where they overlap the colors mix. Try: wire a Cells or a Plain Noise into a Pigment\'s Density instead.', nodes: [
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
  flowfield: { label: 'Flow-Field Ink', canvas: true, teach: 'This is Flow-Field Ink. One part makes it: Flow Lines, which grows evenly spaced ink lines along a current and stops each one short of the others. The Light Dial goes into Flow From, so the current runs the way the dial points; Turbulence bends it into eddies. The two Hues are the inks. Try: wire a Terrain or a Value Noise into Angle Map, then turn Turbulence up.', nodes: [
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
  snow: { label: 'First Snow', canvas: true, teach: 'This is First Snow. One part makes it: Particles, set to flakes. The Light Dial goes into Wind From, so the wind blows from where the dial points, and the Wind knob says how hard. The flakes are colored by the Snow Hue (or anything wired into Color A). Try: turn the dial with Wind up, then set Kind to sparks.', nodes: [
      ['knob', { slot: '1', name: 'Flake Size', def: 14 }, 40, 40],                // 1  (100 of 60–340)
      ['knob', { slot: '2', name: 'Snowfall', def: 33 }, 40, 140],                 // 2  (100 of 20–260)
      ['knob', { slot: '3', name: 'Wind', def: 0 }, 40, 240],                      // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['particles', { kind: 'flakes', amount: 100, '~amount': '20,260', size: 100, '~size': '60,340', form: 0, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'First Snow', ground: 'grey' }, 600, 120]],              // 6
    wires: [[1, 1, 5, paramPort('particles', 'size')], [2, 1, 5, paramPort('particles', 'amount')], [3, 1, 5, paramPort('particles', 'form')], [4, 1, 5, 4], [5, 1, 6, 1]] },
  embers: { label: 'Burning Mana', canvas: true, teach: 'This is Burning Mana. One part makes it: Particles, set to sparks, each flung out and bent down by gravity, white-hot at the head. The two Hues color the sparks (they follow the page\'s accents until you set them). Hue Drift lets each spark\'s color stray. Try: wire a Texture into Over to rain sparks on it.', nodes: [
      ['knob', { slot: '1', name: 'Ember Size', def: 7 }, 40, 40],                 // 1  (100 of 60–600)
      ['knob', { slot: '2', name: 'Ember Count', def: 17 }, 40, 140],              // 2  (100 of 20–500)
      ['knob', { slot: '3', name: 'Hue Drift', def: 10 }, 40, 240],                // 3
      ['hue', { slot: '1', name: 'Ember Hue' }, 40, 340], ['hue', { slot: '2', name: 'Spark Hue' }, 40, 420],   // 4, 5
      ['particles', { kind: 'sparks', amount: 100, '~amount': '20,500', size: 100, '~size': '60,600', form: 10, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Burning Mana', ground: 'grey' }, 600, 120]],            // 7
    wires: [[1, 1, 6, paramPort('particles', 'size')], [2, 1, 6, paramPort('particles', 'amount')], [3, 1, 6, paramPort('particles', 'form')], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  magicparticles: { label: 'Euphoria Dust', canvas: true, teach: 'This is Euphoria Dust. One part makes it: Particles, set to motes. The two Hues color them (they follow the page\'s accents until you set them). Chaos gathers the dust into trails at 0, scatters it at 50 and bursts it at 100. Try: set Chaos to 0, then 100.', nodes: [
      ['knob', { slot: '1', name: 'Sparkle Size', def: 44 }, 40, 40],              // 1  (100 of 20–200)
      ['knob', { slot: '2', name: 'Sparkle Count', def: 23 }, 40, 140],            // 2  (100 of 10–400)
      ['knob', { slot: '3', name: 'Chaos', def: 50 }, 40, 240],                    // 3
      ['hue', { slot: '1', name: 'Sparkle Hue' }, 40, 340], ['hue', { slot: '2', name: 'Glow Hue' }, 40, 420],   // 4, 5
      ['particles', { kind: 'motes', amount: 100, '~amount': '10,400', size: 100, '~size': '20,200', form: 50, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Euphoria Dust', ground: 'grey' }, 600, 120]],           // 7
    wires: [[1, 1, 6, paramPort('particles', 'size')], [2, 1, 6, paramPort('particles', 'amount')], [3, 1, 6, paramPort('particles', 'form')], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  // √ Halftone: a soft Value Noise for the tone, printed as a Halftone Screen of dots.
  halftone: { label: 'Halftone', canvas: true, teach: 'This is Halftone. A Value Noise with one octave makes a soft, slow tone; Halftone Screen prints it as dots, each as big as the tone is bright there. Dot Scale is the screen\'s cell size and Dot Weight how heavy the dots print. Try: wire another texture into the Halftone Screen\'s tone, or turn its Screen Angle.', nodes: [
      ['knob', { slot: '1', name: 'Dot Scale', def: 14 }, 40, 40],                 // 1  (100 of 50–400)
      ['knob', { slot: '2', name: 'Dot Weight', def: 33 }, 40, 140],               // 2  (100 of 30–240)
      ['noise', { scale: 10, octaves: 1 }, 320, 40],                               // 3
      ['screen', { scale: 100, weight: 100, angle: 0 }, 600, 80],                  // 4
      ['surface', { name: 'Halftone', ground: 'grey' }, 880, 100]],                // 5
    wires: [[1, 1, 4, paramPort('screen', 'scale')], [2, 1, 4, paramPort('screen', 'weight')], [3, 1, 4, 1], [4, 1, 5, 1]] },
  // √ Film Grain: one part, its Kind sliding from silver to digital
  grain: { label: 'Film Grain', canvas: true, teach: 'This is Film Grain. One part makes it: Film Grain, whose Kind slides from silver halide through film and paper to a digital sensor, blending neighbours in between. The Knobs are the texture\'s sliders: Grain Size, Contrast and Grain (the Kind). Try: set Kind to 66 for paper, then blend the grain over another texture with Blend.', nodes: [
      ['knob', { slot: '1', name: 'Grain Size', def: 0 }, 40, 40],                 // 1  (100 of 100–600)
      ['knob', { slot: '2', name: 'Contrast', def: 33 }, 40, 140],                 // 2  (100 of 30–240)
      ['knob', { slot: '3', name: 'Grain', def: 33 }, 40, 240],                    // 3
      ['grain', { size: 100, contrast: 100, kind: 33 }, 320, 80],                  // 4
      ['surface', { name: 'Film Grain', ground: 'grey' }, 600, 100]],              // 5
    wires: [[1, 1, 4, paramPort('grain', 'size')], [2, 1, 4, paramPort('grain', 'contrast')], [3, 1, 4, paramPort('grain', 'kind')], [4, 1, 5, 1]] },
  // √ Painter's Frustration: Angry Strokes lays the paint and its thickness; a little Canvas Weave
  // goes into the thickness (the oil-on-canvas module: weave, Mix, Light Engine, right before the
  // Surface); the Light Engine lights the impasto by the dial. Wetness also flattens and glosses it.
  brushstrokes: { label: "Painter's Frustration", canvas: true, teach: 'This is Painter\'s Frustration. Angry Strokes lays a few fast swipes of gray paint and gives a second output, the paint\'s thickness. Before the Surface sits the oil-on-canvas module: Mix lays a little Canvas Weave into that thickness, and the Light Engine lights the paint by the dial. The Wetness knob goes to four places: the strokes (mixing, bleeding, drips) and the Light Engine\'s Relief, Gloss and Shine, because wet paint is flatter and shinier. Try: turn the light dial, then raise Wetness.', nodes: [
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
  landscape: { label: 'Painted Landscape', canvas: true, teach: 'This is Painted Landscape. Painted Sky paints the time of day, a sun or a moon, and clouds. Painted Ridges paints the seed\'s country over whatever sky comes in, band behind band. Watercolor Wash bleeds the painting (Wetness). Oil Paint repaints it in brushstrokes with the paint\'s heights, and the Light Engine lights those by the dial; the Impasto knob drives both (0: no strokes, as it used to be). Notice that one Knob can drive two parts: Distance, Tilt and Color each go to both the sky and the ridges, so they agree. Try: set the Ridges\' Country, then raise Color.', nodes: [
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
