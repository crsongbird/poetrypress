/**
 * chains.js — Vellum's textures REBUILT AS CHAINS OF STEPS (steps.js): each a
 * graph the Athanor can open as a template (Open → the app's own
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
import { paramPort, STEPS } from './steps.js';
import { TEXTURE_PARAMS } from './textureParams.js';

export const TEXTURE_CHAINS = {
  // ═══ 🜛 BASICS: quiet grounds, two or three parts each — the easiest graphs to open and learn from ═══
  // 🜛 Plain Noise: Value Noise → Levels
  plainnoise: { label: 'Plain Noise', div: 2, teach: 'A soft cloudy ground. Value Noise makes the clouds: Scale sets how many across the page, Detail adds finer clouds over them (octaves). Levels sets the Contrast by moving its dark and light points toward each other. Try: wire this noise into another part\'s gray input, a Warp or a Color Ramp.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1
      ['knob', { slot: '2' }, 40, 140],                   // 2
      ['knob', { slot: '3' }, 40, 240],                 // 3
      ['noise', { scale: 60, '~scale': '5,200', octaves: 4, '~octaves': '1,6' }, 320, 60],   // 4
      ['levels', { lo: 0, '~lo': '0,40', hi: 100, '~hi': '100,60', gamma: 50 }, 600, 120],  // 5
      ['surface', { name: 'Plain Noise', ground: 'grey' }, 880, 120]],             // 6
    wires: [[1, 1, 4, 'scale'], [2, 1, 4, 'octaves'], [3, 1, 5, 'lo'], [3, 1, 5, 'hi'],
      [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🜛 Stripes: Waves → Threshold
  stripes: { label: 'Stripes', div: 2, teach: 'Waves makes smooth bands of light and dark; Threshold cuts them into stripes. Where Threshold cuts sets the Stripe Width, and its Softness blurs the edges back toward waves. Angle turns the Waves. Try: wire a Value Noise into the Waves\' Warp input to make the stripes wander like wood grain.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1
      ['knob', { slot: '2' }, 40, 140],             // 2
      ['knob', { slot: '3' }, 40, 240],                 // 3
      ['knob', { slot: '4' }, 40, 340],                    // 4
      ['waves', { freq: 20, '~freq': '3,60', angle: 90, '~angle': '0,180' }, 320, 60],     // 5
      ['threshold', { at: 50, '~at': '97,3', soft: 20, '~soft': '1,100' }, 600, 140],    // 6
      ['surface', { name: 'Stripes', ground: 'grey' }, 880, 140]],                 // 7
    wires: [[1, 1, 5, 'freq'], [4, 1, 5, 'angle'], [2, 1, 6, 'at'], [3, 1, 6, 'soft'],
      [5, 1, 6, 1], [6, 1, 7, 1]] },
  // 🜛 Polka Dots: Cells (in rows, no jitter) → Threshold of the distance to each center
  polka: { label: 'Polka Dots', div: 2, teach: 'Polka dots, made from Cells. With no Jitter, Cells puts one point in the middle of every square of a grid; its first output is how far each spot is from the nearest point. Threshold keeps what is near: a round dot about every point. Spacing is Cells\' Scale, Dot Size is where Threshold cuts, and Scatter is the Jitter that throws the points out of their rows. Try: wire the Cells\' Edges output into the Surface instead.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                   // 1
      ['knob', { slot: '2' }, 40, 140],                 // 2
      ['knob', { slot: '3' }, 40, 240],                   // 3
      ['cells', { scale: 110, '~scale': '200,30', jitter: 0, '~jitter': '0,100' }, 320, 60],  // 4
      ['threshold', { at: 25, '~at': '8,46', soft: 4, '~soft': '2,6' }, 600, 120], // 5
      ['surface', { name: 'Polka Dots', ground: 'grey' }, 880, 120]],              // 6
    wires: [[1, 1, 4, 'scale'], [3, 1, 4, 'jitter'], [2, 1, 5, 'at'],
      [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🜛 Checkerboard: two Waves, across and down, each cut by Threshold; Math (difference) crosses them
  checker: { label: 'Checkerboard', div: 2, teach: 'Two Waves, one across and one down, are each cut into stripes by Threshold. Math, set to Difference, keeps a square where exactly one of the two stripes is light: that is a checkerboard. One Knob (Squares) sets both Waves\' Frequency, Softness both Thresholds, and Turn both Angles, so the squares stay square. Try: set Math to Multiply for a grid of windows, or Max for a plaid.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                   // 1
      ['knob', { slot: '2' }, 40, 160],                 // 2
      ['knob', { slot: '3' }, 40, 280],                      // 3
      ['waves', { freq: 12, '~freq': '2,40', angle: 0, '~angle': '0,90' }, 320, 40],       // 4
      ['waves', { freq: 12, '~freq': '2,40', angle: 90, '~angle': '90,180' }, 320, 240],   // 5
      ['threshold', { at: 50, soft: 4, '~soft': '1,60' }, 600, 40],                // 6
      ['threshold', { at: 50, soft: 4, '~soft': '1,60' }, 600, 240],               // 7
      ['math', { op: 'difference' }, 860, 140],                                    // 8
      ['surface', { name: 'Checkerboard', ground: 'grey' }, 1100, 140]],           // 9
    wires: [[1, 1, 4, 'freq'], [1, 1, 5, 'freq'], [3, 1, 4, 'angle'], [3, 1, 5, 'angle'],
      [2, 1, 6, 'soft'], [2, 1, 7, 'soft'],
      [4, 1, 6, 1], [5, 1, 7, 1], [6, 1, 8, 1], [7, 1, 8, 2], [8, 1, 9, 1]] },
  // 🜛 Gradient: a straight and a round Gradient, Mixed by Roundness; Levels bends the falloff
  softgradient: { label: 'Gradient', div: 4, teach: 'A smooth fall from dark to light. There are two Gradient parts, one straight and one round (Invert turns the round one into a glow, light in the middle); Mix blends between them by Roundness, so the ramp can bend into a glow. Angle turns the straight one. Levels\' Gamma is the Falloff: how quickly the light gives way. Try: wire a Value Noise into Mix\'s amount instead of the Knob.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1
      ['knob', { slot: '2' }, 40, 160],                 // 2
      ['knob', { slot: '3' }, 40, 280],                  // 3
      ['gradient', { shape: 'linear', angle: 90, '~angle': '0,360' }, 320, 40],    // 4
      ['gradient', { shape: 'radial', angle: 90 }, 320, 200],                      // 5
      ['mix', { t: 0, '~t': '0,100' }, 800, 100],                                  // 6
      ['levels', { lo: 0, hi: 100, gamma: 50, '~gamma': '0,100' }, 1040, 120],     // 7
      ['surface', { name: 'Gradient', ground: 'grey' }, 1280, 120],                // 8
      ['invert', {}, 560, 200]],                                                   // 9 (light in the middle: a glow)
    wires: [[1, 1, 4, 'angle'], [2, 1, 6, 't'], [3, 1, 7, 'gamma'],
      [4, 1, 6, 1], [5, 1, 9, 1], [9, 1, 6, 2], [6, 1, 7, 1], [7, 1, 8, 1]] },
  // 🜛 Cells: Cells' distance (inverted: domes) and edges (inverted: flat cells), Mixed by Lines; lit by the dial
  cells: { label: 'Cells', div: 2, teach: 'Like pebbles, cobbles or a sponge. Cells gives the distance to each cell\'s middle and the lines between cells; Invert turns each the right way up (light in the middle). Mix blends the round domes into flat cells with crisp lines by Lines. The same picture goes into the Surface\'s Height, scaled by Relief, so the dial lights it. Try: turn the light dial on the page, then set Order to 0 for a grid of tiles.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1
      ['knob', { slot: '2' }, 40, 140],                    // 2
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['knob', { slot: '4' }, 40, 340],                   // 4
      ['cells', { scale: 60, '~scale': '200,20', jitter: 80, '~jitter': '100,0' }, 300, 60],  // 5
      ['invert', {}, 540, 20], ['invert', {}, 540, 140],                           // 6, 7
      ['mix', { t: 50, '~t': '0,100' }, 760, 80],                                  // 8
      ['levels', { lo: 10, hi: 95, gamma: 50 }, 980, 80],                          // 9
      ['math', { op: 'multiply' }, 980, 260],                                      // 10
      ['surface', { name: 'Cells', ground: 'grey' }, 1220, 140]],                  // 11
    wires: [[1, 1, 5, 'scale'], [2, 1, 5, 'jitter'], [5, 1, 6, 1], [5, 2, 7, 1], [6, 1, 8, 1], [7, 1, 8, 2], [3, 1, 8, 't'],
      [8, 1, 9, 1], [9, 1, 11, 1], [9, 1, 10, 1], [4, 1, 10, 2], [10, 1, 11, 2]] },
  // √ Harsh Rain: far sheets, then near streaks drawn over them; the dial is
  // where the rain comes from, Gusts swings it about that
  rainstreaks: { label: 'Harsh Rain', div: 2, teach: 'The Light Dial sets the direction the rain comes from. The first Streaks part draws far, soft sheets of rain; the second draws near streaks over them. The two Knobs are this texture\'s sliders on the page (Rain Zoom and Gusts), wired into the settings they move. Try: turn the dial, then raise Gusts.', nodes: [
      ['knob', { slot: '1' }, 40, 300],                 // 1
      ['knob', { slot: '2' }, 40, 170],                     // 2
      ['dial', {}, 40, 40],                                                        // 3
      ['streaks', { kind: 'sheets', angle: 0, spread: 0, length: 100, count: 100, light: 75, strength: 50 }, 320, 40],   // 4
      ['streaks', { kind: 'streaks', angle: 0, spread: 0, length: 100, count: 100, light: 75, strength: 50 }, 600, 120],  // 5
      ['surface', { name: 'Harsh Rain', ground: 'grey' }, 880, 160]],             // 6
    wires: [[3, 1, 4, 'angle'], [3, 1, 5, 'angle'], [2, 1, 4, 'spread'], [2, 1, 5, 'spread'],
      [1, 1, 5, 'length'], [4, 1, 5, 1], [5, 1, 6, 1]] },
  // √ Silverpoint Hatch: soft forms say where the drawing is dark; hatching
  // gathers there, along the dial; the ink tarnishes with Age
  hatch: { label: 'Silverpoint Hatch', poem: 'shape', div: 2, teach: 'Soft Forms makes a few large shapes that say where the drawing is dark. Hatching draws pencil strokes that gather in those dark places, along the dial\'s direction. Two Colors, mixed by the Age knob, make the ink, and a Color Ramp lays the ink over a gray ground. With Shape Aware ticked the strokes stop short of your words. Try: raise Cross-Hatching, then change Soft Forms\' Size.', nodes: [
      ['knob', { slot: '1' }, 40, 180],          // 1
      ['knob', { slot: '2' }, 40, 300],            // 2
      ['knob', { slot: '3' }, 320, 560],                    // 3
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
    wires: [[4, 1, 5, 1], [12, 1, 5, 'angle'], [1, 1, 5, 'cross'], [2, 1, 5, 'density'],
      [6, 1, 8, 1], [7, 1, 8, 2], [3, 1, 8, 3], [5, 1, 10, 1], [9, 1, 10, 2], [8, 1, 10, 3], [10, 1, 11, 1]] },
  // 🜚 Linen: the weave (a normal map, lit by the dial) → the cloth coloured
  // and its details laid on as heights, lit. Its grid keeps the threads at
  // least three pixels apart, and no finer (a preview no longer pays the export's price)
  linen: { label: 'Linen Tooth', div: 2, teach: 'Cloth laid flat under the poem, remade on the cloth parts and lit from its maps. Drape lays a sheet down (Hang on Laid Flat) and lets it settle with as many soft creases as Creases asks, as stiff or as supple as its Fabric. Weave Maps lays the threads along it, over and under as the fabric\'s loom lays them (silk and satin fine and smooth, linen slubbed, denim twilled, canvas in pairs, tweed in a herringbone, burlap open), and hands on their height, gloss, tone and gaps. The Fabric Hue is coloured by the threads\' Tone (Blend, Soft Light); Detail Normals lays the threads over the creases\' facing; a Light Engine lights it all from the Light Dial in the Light Hue, satin shining and burlap not. Try: Fabric on Burlap, Weave Scale high, the dial low.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1  Weave Scale
      ['knob', { slot: '2' }, 40, 140],             // 2  Creases
      ['knob', { slot: '3' }, 40, 240],             // 3  Fabric
      ['hue', { slot: '1', name: 'Fabric Hue' }, 40, 360],                        // 4
      ['hue', { slot: '2', name: 'Light Hue' }, 40, 440],                         // 5
      ['drape', { hang: 93, fabric: 39, '~fabric': '0,100', folds: 30, '~folds': '0,100', detail: 40, wrinkles: 40, '~wrinkles': '0,100' }, 320, 60],   // 6
      ['weavemaps', { fabric: 39, '~fabric': '0,100', size: 100, '~size': '50,400' }, 600, 60],   // 7
      ['blend', { mode: 'soft-light', opacity: 70 }, 880, 40],                     // 8 (the fabric's hue, coloured by the threads)
      ['detailnormals', { strength: 30 }, 880, 200],                               // 9 (the threads over the creases' facing)
      ['material', { relief: 100, gloss: 35, shine: 25, shadow: 50, occlusion: 50, ambient: 40, translucency: 15 }, 1160, 60],   // 10
      ['surface', { name: 'Linen Tooth', ground: 'grey' }, 1440, 120]],           // 11
    wires: [[1, 1, 7, 'size'], [2, 1, 6, 'folds'], [2, 1, 6, 'wrinkles'], [3, 1, 6, 'fabric'], [3, 1, 7, 'fabric'],
      [6, 3, 7, 1], [6, 4, 7, 2], [4, 1, 8, 1], [7, 3, 8, 2], [6, 2, 9, 1], [7, 1, 9, 2],
      [8, 1, 10, 1], [6, 1, 10, 2], [7, 2, 10, 3], [5, 1, 10, 6], [9, 1, 10, 10], [7, 4, 10, 'translucency'], [10, 1, 11, 1]] },
  // ∆ Fractured Glaze: the crazing (heights, glaze, grime, the finest cracks)
  // and the brushwork (how thick it was painted) → the glaze lit and coloured
  crackedglaze: { label: 'Fractured Glaze', div: 2, teach: 'Crazing makes four maps of cracked glaze: its heights, the glaze, grime in the cracks, and the finest cracks. Brushwork says how thickly the glaze was painted. Glaze lights and colors all of these with two Hues. Try: raise Enameling to see the glaze age and peel.', nodes: [
      ['knob', { slot: '1' }, 40, 40],           // 1
      ['knob', { slot: '2' }, 40, 170],           // 2
      ['knob', { slot: '3' }, 40, 300],                // 3
      ['crazing', { scale: 100, density: 100, age: 0 }, 320, 40],                 // 4
      ['brushwork', { streaks: 55, runs: 30, pools: 60 }, 320, 330],              // 5
      ['hue', { slot: '1', name: 'Glaze Hue' }, 320, 460],                        // 6
      ['hue', { slot: '2', name: 'Base Hue' }, 320, 580],                         // 7
      ['glaze', { scale: 100, gloss: 85, grime: 40 }, 620, 160],                  // 8
      ['surface', { name: 'Fractured Glaze', ground: 'colour' }, 900, 220]],      // 9
    wires: [[1, 1, 4, 'scale'], [2, 1, 4, 'density'], [3, 1, 4, 'age'], [1, 1, 8, 'scale'],
      [4, 1, 8, 1], [4, 2, 8, 2], [4, 3, 8, 3], [4, 4, 8, 4], [5, 1, 8, 5], [6, 1, 8, 6], [7, 1, 8, 7], [8, 1, 9, 1]] },
  // 🜍 Cartomancy: a Table under a lamp, and a game Dealt onto it. The seed
  // picks the game, the table, the cards and the coin (each 'seed' setting:
  // choose one instead to fix it). Its four suits are the page's two Accents
  // and the texture's two Hues. Drawn on the page at full size (a canvas pass).
  cards: { label: 'Cartomancy', canvas: true, teach: 'Table draws a table top under a lamp, and a Blend lays it over the Page Backdrop in Overlay, so the table always takes the page\'s own colors; Card Deal lays a card game on it, flat, and hands its Height and Gloss to a Light Engine, which lights the cards and coins from the Light Dial (each card\'s shadow on the ones beneath, the coins\' domes and rims, gilt and metal shining). The menus left at “seed” let the seed choose (the game, the table, the cards, the coins); pick one to fix it. The four suits are the page\'s two Accents and the texture\'s two Hues. The Knobs are this texture\'s sliders: Cards in Play, Scatter, Stakes, Clutter (what else is on the table) and Wear (how damaged the cards are). Try: set Game to “ring”, then press ⟳ Seed. A Table Objects part lays the same candles, cups and letters on any picture.', nodes: [
      ['knob', { slot: '1' }, 40, 40],            // 1  (100 of 20–300)
      ['knob', { slot: '2' }, 40, 140],                 // 2  (20 of 0–90)
      ['knob', { slot: '3' }, 40, 240],                  // 3
      ['accent', { slot: '1', name: 'First Suit' }, 40, 340],                     // 4
      ['accent', { slot: '2', name: 'Second Suit' }, 40, 420],                    // 5
      ['hue', { slot: '1', name: 'Third Suit Hue' }, 40, 500],                    // 6
      ['hue', { slot: '2', name: 'Fourth Suit Hue' }, 40, 580],                   // 7
      ['table', { mat: 'seed', lamp: 50 }, 320, 40],                              // 8
      ['deal', { game: 'seed', stock: 'seed', gilt: 'seed', suits: 'seed', coinage: 'seed', count: 100, size: 100, scatter: 20, stakes: 50, clutter: 40, wear: 30, lighting: 'the light engine' }, 880, 120],   // 9
      ['surface', { name: 'Cartomancy', ground: 'colour' }, 1440, 160],           // 10
      ['knob', { slot: '4' }, 320, 300],                // 11
      ['knob', { slot: '5' }, 320, 400],                   // 12
      ['backdrop', {}, 320, 520],                                                 // 13 the page beneath
      ['blend', { mode: 'overlay', opacity: 100 }, 600, 60],                       // 14 (Ruby: the table always blended against the page colours)
      ['material', { relief: 60, gloss: 45, shine: 55, shadow: 70, occlusion: 30, ambient: 40 }, 1160, 140]],   // 15 the Light Engine: the cards' heights and gloss
    wires: [[13, 1, 14, 1], [8, 1, 14, 2], [14, 1, 9, 1], [4, 1, 9, 2], [5, 1, 9, 3], [6, 1, 9, 4], [7, 1, 9, 5],
      [1, 1, 9, 'count'], [2, 1, 9, 'scatter'], [3, 1, 9, 'stakes'],
      [11, 1, 9, 'clutter'], [12, 1, 9, 'wear'], [9, 1, 15, 1], [9, 3, 15, 2], [9, 4, 15, 3], [15, 1, 10, 1]] },
  // ♡ Sleep Haze: smoke rising in a dusty room, a shaft of light through it
  // from the dial's way, dust catching the light. Drawn by a canvas pass (the
  // smoke on its own soft grid, the motes at full size).
  clouds: { label: 'Sleep Haze', canvas: true, teach: 'Smoke makes a density map: haze in layers and wisps rising (Lift and Drag set how). A Light Shaft shines from the Light Dial\'s direction through that density, so the smoke glows inside the beam; its second output is the beam itself. Dust Motes draws specks that show only where the beam catches them. Try: wire a Value Noise into the Light Shaft instead of the Smoke.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 140],                    // 2  (60 of 0–200)
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['dial', {}, 40, 340],                                                      // 4
      ['smoke', { lift: 100, drag: 60 }, 320, 40],                                // 5
      ['shaft', { dust: 35 }, 600, 120],                                          // 6
      ['motes', { dust: 35 }, 880, 160],                                          // 7
      ['surface', { name: 'Sleep Haze', ground: 'grey' }, 1160, 180]],            // 8
    wires: [[1, 1, 5, 'lift'], [2, 1, 5, 'drag'], [5, 1, 6, 1], [4, 1, 6, 2], [3, 1, 6, 'dust'],
      [6, 1, 7, 1], [6, 2, 7, 2], [3, 1, 7, 'dust'], [7, 1, 8, 1]] },
  // √ Scattered Polygons: flakes of leaf over a grey ground, in the leaf's hue
  metalleaf: { label: 'Scattered Polygons', canvas: true, teach: 'Flakes lays translucent flakes of leaf, in the Leaf Hue, over whatever comes into its Base (here nothing, so a gray ground). Shape makes them polygons of every kind, Sheen tilts each toward the dial\'s light, and Glitter speckles them. Its Mask output shows where the flakes lie, so Mix can lay them onto another picture. Try: wire a Value Noise into Base.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 60–360)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–260)
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['knob', { slot: '4' }, 40, 340],                    // 4
      ['knob', { slot: '5' }, 40, 440],                  // 5
      ['hue', { slot: '1', name: 'Leaf Hue' }, 40, 540],                          // 6
      ['flakes', { size: 100, coverage: 100, shape: 0, sheen: 0, glitter: 0 }, 340, 160],   // 7
      ['surface', { name: 'Scattered Polygons', ground: 'grey' }, 640, 200]],     // 8
    wires: [[1, 1, 7, 'size'], [2, 1, 7, 'coverage'], [3, 1, 7, 'shape'], [4, 1, 7, 'sheen'],
      [5, 1, 7, 'glitter'], [6, 1, 7, 2], [7, 1, 8, 1]] },
  // 🜚 Stained Glass: the window's panes (four kinds), then the glass lit from behind and in front
  stainedglass: { label: 'Stained Glass', poem: 'shape', div: 3, teach: 'Panes lays out the window (random shards, a lattice, a rose window or a grid, chosen by Shape; Size Variety mixes big panes with small; Window draws a pointed lancet arch, a round window or an arcade of three lancets in heavier lead, with a border of glass in its own colors beyond) and hands on its maps: the lead, the distance from it, a number for each pane, each pane\'s color slot, where the window is, and the joints where cames meet. Stained Glass lights them from behind, toward the dial\'s sun, and from the front; its lead is flat, dark and soldered at the joints. Its Texture runs from smooth cathedral glass through hammered and seedy to milky opalescent glass. Scene colors each pane from a picture behind it, as Tiffany\'s landscape windows were made: here a Painted Sky with Painted Ridges. With Shape Aware ticked your words are set in clear glass, no lead across them. Try: raise Scene, or wire any texture into Stained Glass\'s Scene.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 50–250)
      ['knob', { slot: '2' }, 40, 140],                 // 2  (100 of 30–250)
      ['knob', { slot: '3' }, 40, 240],                   // 3
      ['hue', { slot: '1', name: 'Glass Hue' }, 40, 340],                         // 4
      ['hue', { slot: '2', name: 'Second Glass Hue' }, 40, 440],                  // 5
      ['panes', { size: 100, leading: 100, shape: 25, variety: 0, '~variety': '0,45', frame: 0, '~frame': '0,100' }, 320, 60],   // 6
      ['glass', { relief: 100, scene: 0, '~scene': '0,100', texture: 0, '~texture': '0,100', reflect: 100 }, 600, 140],   // 7
      ['surface', { name: 'Stained Glass', ground: 'colour', aa: 'edges only' }, 880, 180],         // 8
      ['knob', { slot: '4' }, 40, 540],                    // 9
      ['knob', { slot: '5' }, 40, 640],            // 10
      ['knob', { slot: '6' }, 40, 740],                   // 11
      ['sky', { time: 'seed', clouds: 'seed', size: 100, tilt: 0, colour: 100 }, 320, 560],   // 12 (the scene behind the glass)
      ['ridges', { country: 'seed', time: 'seed', bands: 100, distance: 100, tilt: 0, colour: 100 }, 320, 700]],   // 13
    wires: [[1, 1, 6, 'size'], [2, 1, 6, 'leading'], [3, 1, 6, 'shape'],
      [6, 1, 7, 1], [6, 2, 7, 2], [6, 3, 7, 3], [6, 4, 7, 4], [4, 1, 7, 5], [5, 1, 7, 6], [6, 5, 7, 7], [7, 1, 8, 1],
      [9, 1, 7, 'scene'], [10, 1, 7, 'texture'], [11, 1, 6, 'frame'], [12, 1, 13, 1], [13, 1, 7, 8], [6, 6, 7, 9],
      [9, 1, 6, 'variety']] },   // (Scene also sets Size Variety: a scene wants small panes for its detail)
  // ⛰ Painted Landscape: a painted sky, the country's ridges painted over it, a watercolour wash
  // 🝊 Aurora: Deep Field's stars, then curtains of rays over them
  aurorasky: { label: 'Aurora', canvas: true, teach: 'Starfield lays Deep Field\'s stars on black; Aurora Curtains hangs curtains of light over them, each made of thousands of fine rays rising from a bright folded hem — green low down, red high up (the two colors oxygen glows at different heights), a pink fringe at the hem. The Light Dial goes into Field From: the rays lean along it and the hem bends. It is screened over the page, as Deep Field is. Try: raise Red Sky and Curtain Height for a rare red aurora.', nodes: [
      ['knob', { slot: '1' }, 40, 40],           // 1  (100 of 40–180)
      ['knob', { slot: '2' }, 40, 140],                     // 2  (100 of 20–250)
      ['knob', { slot: '3' }, 40, 240],                 // 3  (2 of 1–5)
      ['knob', { slot: '4' }, 40, 340],                  // 4
      ['knob', { slot: '5' }, 40, 440],                    // 5  (100 of 20–300)
      ['dial', {}, 40, 540],                                                       // 6
      ['starfield', { amount: 100, '~amount': '20,300', atmosphere: 30 }, 320, 360],   // 7
      ['curtains', { curtains: 2, '~curtains': '1,5', rays: 100, '~rays': '20,250', height: 100, '~height': '40,180', red: 30, '~red': '0,100', fringe: 50, glow: 100, horizon: 50, '~horizon': '0,100' }, 600, 160],   // 8
      ['surface', { name: 'Aurora', ground: 'colour' }, 880, 200],                 // 9
      ['knob', { slot: '6' }, 40, 620]],                 // 10
    wires: [[1, 1, 8, 'height'], [2, 1, 8, 'rays'], [3, 1, 8, 'curtains'], [4, 1, 8, 'red'],
      [5, 1, 7, 'amount'], [6, 1, 8, 2], [7, 1, 8, 1], [8, 1, 9, 1], [10, 1, 8, 'horizon']] },
  // 🜚 Fractured Glaze (the second): cracks that SPREAD — Tarbell's Substrate — lit as glaze by the dial
  crackle: { label: 'Fractured Glaze', div: 2, teach: 'Spreading Cracks lets cracks run across the glaze: each runs until it meets another, and then a new one starts from a crack already there, at right angles, so the first are long and each after shorter, as real crackle is. From One Point makes the first cracks burst from where the dial points, like an impact. It hands Glaze four maps: heights, where the glaze is, grime in the cracks and the finest cracks; Brushwork says how thick the glaze was painted. Glaze lights it all with your two Hues. Try: Chipping up, or From One Point at 100.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1  (100 of 50–300)
      ['knob', { slot: '2' }, 40, 130],                  // 2  (100 of 20–400)
      ['knob', { slot: '3' }, 40, 220],          // 3
      ['knob', { slot: '4' }, 40, 310],                  // 4
      ['knob', { slot: '5' }, 40, 400],                 // 5
      ['dial', {}, 40, 490],                                                      // 6
      ['cracks', { scale: 100, '~scale': '50,300', count: 100, '~count': '20,400', spread: 30, '~spread': '0,100', wander: 40, '~wander': '0,100', age: 0, '~age': '0,100' }, 320, 60],   // 7
      ['brushwork', { streaks: 55, runs: 30, pools: 60 }, 320, 380],              // 8
      ['hue', { slot: '1', name: 'Glaze Hue' }, 320, 500], ['hue', { slot: '2', name: 'Body Hue' }, 320, 600],   // 9, 10
      ['glaze', { scale: 100, gloss: 85, grime: 40 }, 620, 160],                  // 11
      ['surface', { name: 'Fractured Glaze', ground: 'colour', aa: 'edges only' }, 900, 220]],      // 12
    wires: [[1, 1, 7, 'scale'], [2, 1, 7, 'count'], [3, 1, 7, 'spread'], [4, 1, 7, 'wander'], [5, 1, 7, 'age'],
      [6, 1, 7, 1], [1, 1, 11, 'scale'], [7, 1, 11, 1], [7, 2, 11, 2], [7, 3, 11, 3], [7, 4, 11, 4], [8, 1, 11, 5], [9, 1, 11, 6], [10, 1, 11, 7], [11, 1, 12, 1]] },
  // 🝆 Veins of Light: a network grown (space colonization) through a material's ways, glowing inside it
  veins: { label: 'Veins of Light', div: 2, teach: 'A network running through stone, sand, fibre or skin: not a tree but a web with loops, like a leaf\'s veins, a slime mould\'s tubes, a street plan or a circuit. Growth Medium makes the material (Material picks it, or the seed) and its ways. Network throws nodes along those ways, takes hubs from the poem\'s pauses (else the seed\'s), joins them by the Weave, widens each line by the flow it carries from the hubs (Hierarchy), and routes it from organic curves to circuit traces at 45° and 90° (Organic ↔ Circuit), with pads, buses and pulses. Blend lays the lines and pads into the material and inlays some of its closed loops with the second material; Math cuts the lines in as channels or raises them as wire; the Light Engine lights it from the dial; Glow lets the network shine into the lit grain, more as the dial\'s light sinks. Try: Weave at Streets, then Organic ↔ Circuit up.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                      // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                        // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                     // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                       // 4
      ['knob', { slot: '5' }, 40, 480],                                                                           // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                   // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                        // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                      // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['poem', {}, 40, 1030],                                                                                                                         // 10
      ['hue', { slot: '1', name: 'Material Hue' }, 40, 1140],                                                                                         // 11
      ['hue', { slot: '2', name: 'Second Material Hue' }, 40, 1250],                                                                                  // 12
      ['hue', { slot: '3', name: 'Line Hue' }, 40, 1360],                                                                                             // 13
      ['hue', { slot: '4', name: 'Glow Hue' }, 40, 1470],                                                                                             // 14
      ['hue', { slot: '5', name: 'Node Hue' }, 40, 1580],                                                                                             // 15
      ['hue', { slot: '6', name: 'Pulse Hue' }, 40, 1690],                                                                                            // 16
      ['matrix', { kind: 25, scale: 100, '~scale': '70,180', angle: 0, '~angle': '0,180', variant: 0, '~variant': '0,99' }, 700, 40],                 // 17
      ['switch', { at: 16.7 }, 480, 40],                                                                                                              // 18
      ['random', { lo: 0, hi: 100 }, 40, 1800],                                                                                                       // 19
      ['maprange', { inLo: 16.7, inHi: 100, outLo: 0, outHi: 99.9 }, 260, 40],                                                                        // 20
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 21
      ['random', { lo: 0, hi: 100 }, 40, 2020],                                                                                                       // 22
      ['random', { lo: 0, hi: 100 }, 40, 2130],                                                                                                       // 23
      ['blur', { radius: 6 }, 920, 40],                                                                                                               // 24
      ['network', { weave: 0, nodes: 120, '~nodes': '25,420', even: 60, '~even': '30,85', loops: 50, hubs: 3, '~hubs': '1,7', order: 60, style: 65, wander: 30, '~wander': '5,60', width: 100, '~width': '70,150', pads: 50, '~pads': '15,90', bus: 20, '~bus': '0,60', pulses: 30, variant: 0, '~variant': '0,99' }, 1360, 40],// 25
      ['maprange', { outLo: 30, outHi: 100 }, 1140, 40],                                                                                              // 26
      ['switch', { at: 14.3 }, 480, 150],                                                                                                             // 27
      ['random', { lo: 0, hi: 100 }, 40, 2240],                                                                                                       // 28
      ['maprange', { inLo: 14.3, inHi: 100, outLo: 0, outHi: 99.9 }, 260, 150],                                                                       // 29
      ['random', { lo: 0, hi: 100 }, 40, 2350],                                                                                                       // 30
      ['random', { lo: 0, hi: 100 }, 40, 2460],                                                                                                       // 31
      ['random', { lo: 0, hi: 100 }, 40, 2570],                                                                                                       // 32
      ['random', { lo: 0, hi: 100 }, 40, 2680],                                                                                                       // 33
      ['random', { lo: 0, hi: 100 }, 40, 2790],                                                                                                       // 34
      ['random', { lo: 0, hi: 100 }, 40, 2900],                                                                                                       // 35
      ['random', { lo: 0, hi: 100 }, 40, 3010],                                                                                                       // 36
      ['maprange', { outLo: 45, outHi: 100 }, 920, 150],                                                                                              // 37
      ['blend', { mode: 'multiply', opacity: 100 }, 1140, 150],                                                                                       // 38
      ['blend', { mode: 'multiply', opacity: 100 }, 1140, 260],                                                                                       // 39
      ['threshold', { at: 80, '~at': '70,101', soft: 0 }, 1580, 40],                                                                                  // 40
      ['random', { lo: 0, hi: 100 }, 40, 3120],                                                                                                       // 41
      ['blend', { mode: 'normal', opacity: 80 }, 1800, 40],                                                                                           // 42
      ['blend', { mode: 'normal', opacity: 100 }, 2020, 40],                                                                                          // 43
      ['blend', { mode: 'normal', opacity: 100 }, 2240, 40],                                                                                          // 44
      ['maprange', { outLo: 0, outHi: 30, '~outHi': '0,70' }, 1580, 150],                                                                             // 45
      ['random', { lo: 0, hi: 100 }, 40, 3230],                                                                                                       // 46
      ['maprange', { outLo: 0, outHi: 40, '~outHi': '0,90' }, 1580, 260],                                                                             // 47
      ['random', { lo: 0, hi: 100 }, 40, 3340],                                                                                                       // 48
      ['math', { op: 'subtract' }, 1800, 150],                                                                                                        // 49
      ['math', { op: 'max' }, 2020, 150],                                                                                                             // 50
      ['material', { relief: 60, gloss: 35, shine: 45, shadow: 55, occlusion: 40, ambient: 40 }, 2460, 40],                                           // 51
      ['math', { op: 'max' }, 1580, 370],                                                                                                             // 52
      ['mix', { t: 70 }, 260, 260],                                                                                                                   // 53
      ['blend', { mode: 'screen', opacity: 45 }, 2680, 40],                                                                                           // 54
      ['math', { op: 'max' }, 1580, 480],                                                                                                             // 55
      ['math', { op: 'max' }, 1800, 260],                                                                                                             // 56
      ['blur', { radius: 3 }, 2020, 260],                                                                                                             // 57
      ['maprange', { inLo: 0, inHi: 22, outLo: 0, outHi: 100 }, 2240, 150],                                                                           // 58
      ['math', { op: 'max' }, 2460, 150],                                                                                                             // 59
      ['maprange', { outLo: 60, outHi: 100 }, 2680, 150],                                                                                             // 60
      ['maprange', { outLo: 100, outHi: 55 }, 260, 370],                                                                                              // 61
      ['math', { op: 'multiply' }, 2900, 40],                                                                                                         // 62
      ['glow', { radius: 16, aura: 70, strength: 70, '~strength': '0,100', auraK: 55, core: 45 }, 3340, 40],                                          // 63
      ['math', { op: 'multiply' }, 3120, 40],                                                                                                         // 64
      ['blend', { mode: 'screen', opacity: 100 }, 3560, 40],                                                                                          // 65
      ['surface', { name: 'Veins of Light', ground: 'colour' }, 3780, 40]],                                                                           // 66
    wires: [[19, 1, 18, 1], [1, 1, 20, 1], [20, 1, 18, 2], [1, 1, 18, 3], [18, 1, 17, 'kind'], [21, 1, 17, 'scale'],
      [22, 1, 17, 'angle'], [23, 1, 17, 'variant'], [17, 3, 24, 1], [24, 1, 26, 1], [26, 1, 25, 1], [17, 3, 25, 2],
      [10, 9, 25, 3], [9, 1, 25, 4], [28, 1, 27, 1], [2, 1, 29, 1], [29, 1, 27, 2], [2, 1, 27, 3], [27, 1, 25, 'weave'],
      [3, 1, 25, 'nodes'], [4, 1, 25, 'loops'], [5, 1, 25, 'style'],
      [6, 1, 25, 'order'], [8, 1, 25, 'pulses'], [30, 1, 25, 'even'],
      [31, 1, 25, 'hubs'], [32, 1, 25, 'wander'], [33, 1, 25, 'width'],
      [34, 1, 25, 'pads'], [35, 1, 25, 'bus'], [36, 1, 25, 'variant'], [17, 1, 37, 1],
      [11, 1, 38, 1], [37, 1, 38, 2], [12, 1, 39, 1], [37, 1, 39, 2], [25, 6, 40, 1], [41, 1, 40, 'at'], [38, 1, 42, 1],
      [39, 1, 42, 2], [40, 1, 42, 3], [42, 1, 43, 1], [13, 1, 43, 2], [25, 1, 43, 3], [43, 1, 44, 1], [15, 1, 44, 2], [25, 4, 44, 3], [25, 1, 45, 1],
      [46, 1, 45, 'outHi'], [25, 7, 47, 1], [48, 1, 47, 'outHi'], [17, 2, 49, 1], [45, 1, 49, 2], [49, 1, 50, 1],
      [47, 1, 50, 2], [44, 1, 51, 1], [50, 1, 51, 2], [25, 1, 52, 1], [25, 4, 52, 2], [52, 1, 51, 3], [9, 1, 51, 7], [13, 1, 53, 1], [14, 1, 53, 2],
      [51, 1, 54, 1], [53, 1, 54, 2], [25, 2, 54, 3], [25, 2, 55, 1], [25, 4, 55, 2], [55, 1, 56, 1], [25, 5, 56, 2], [56, 1, 57, 1], [57, 1, 58, 1],
      [56, 1, 59, 1], [58, 1, 59, 2], [51, 2, 60, 1], [9, 2, 61, 1], [60, 1, 62, 1], [61, 1, 62, 2], [54, 1, 63, 1], [59, 1, 63, 2], [14, 1, 63, 3],
      [62, 1, 64, 1], [7, 1, 64, 2], [64, 1, 63, 'strength'], [63, 1, 65, 1], [16, 1, 65, 2], [25, 5, 65, 3], [65, 1, 66, 1]] },
  // 🝓 Circuit Board: Circuit Traces on the page's own backdrop; Threshold powers some traces (Charge), the Light Engine
  // lights the board, then what it gives off is screened over: the traces' glow, the Glow Hue's aura, data, sparks
  circuit: { label: 'Circuit Board', div: 2, poem: 'lines', teach: 'A circuit board drawn on the page itself. Circuit Traces routes it the way boards are routed by hand: chips first, then buses of parallel traces that run straight and turn together (Bends: square corners, or 45° chamfers), ending in vias and pads. Page Backdrop makes the board of your backdrop\'s colors; Blend lays the copper, the tinned pads, the chips and the silkscreen on it. Every trace has its own grey (Each Trace), so three Thresholds driven by Charge decide which are powered: colored in your Trace Hue first, then (the grey dimmed by Math, so Charge reaches it later) glowing, then sparking. The Light Engine raises and lights the board; then the light it gives off is screened over (Blend in Screen): the glow, the Glow Hue\'s aura, data running along the powered traces in your Data Hue, and sparks from Scatter. Era (slider 7) turns the board, chip by chip, toward the future\'s, then quantum ones, then the atomic (brass gears and valves), then magitech: crystals set in the board, light guides curving to their pins, summoning circles, holograms, and their own light (Arcana) glowing and sparking where Charge reaches it; Markings (slider 8) stamps it with names, revisions and the odd little picture. The Poem keeps it clear of your words: Circuit Traces cuts away what lies under the lines after the board is routed, so the rest stays where it was as you write. With Shape Aware ticked it is routed round your words instead. Try: Charge at 100, then Bends at 0 for square corners.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                    // 1
      ['knob', { slot: '3' }, 40, 130],                   // 2
      ['knob', { slot: '4' }, 40, 220],                // 3
      ['knob', { slot: '6' }, 40, 310],                    // 4  (100 of 40–300)
      ['knob', { slot: '5' }, 40, 400],               // 5
      ['knob', { slot: '2' }, 40, 490],                    // 6
      ['dial', {}, 40, 580],                                                       // 7
      ['hue', { slot: '1', name: 'Trace Hue' }, 40, 660], ['hue', { slot: '2', name: 'Data Hue' }, 40, 740], ['glowhue', {}, 40, 820],   // 8, 9, 10
      ['backdrop', {}, 300, 700],                                                  // 11
      ['traces', { traces: 55, '~traces': '0,100', scale: 100, '~scale': '40,300', bends: 70, '~bends': '0,100', parts: 45, '~parts': '0,100', flow: 40, '~flow': '0,100', clearing: 'cutting it away' }, 300, 120],   // 12
      ['threshold', { at: 100, '~at': '100,4', soft: 2 }, 800, 40],               // 13 (powered: colored)
      ['threshold', { at: 100, '~at': '100,4', soft: 2 }, 800, 160],              // 14 (glowing)
      ['threshold', { at: 100, '~at': '100,4', soft: 2 }, 800, 280],              // 15 (sparking)
      ['math', { op: 'multiply' }, 1040, 40],                                      // 16 (the powered copper)
      ['math', { op: 'multiply' }, 1040, 160],                                     // 17 (the glowing copper)
      ['colour', { hex: '#FFFFFF' }, 560, 900],                                    // 18
      ['blend', { mode: 'soft-light', opacity: 70 }, 560, 620],                    // 19 (bare copper under the mask)
      ['colour', { hex: '#C9C1AA' }, 800, 900],                                    // 20 (tinned pads)
      ['blend', { mode: 'source-over', opacity: 90 }, 800, 620],                   // 21
      ['colour', { hex: '#141418' }, 1040, 900],                                   // 22 (the chips' epoxy)
      ['blend', { mode: 'source-over', opacity: 96 }, 1040, 620],                  // 23
      ['colour', { hex: '#ECE8DC' }, 1280, 900],                                   // 24 (silkscreen)
      ['blend', { mode: 'source-over', opacity: 75 }, 1280, 620],                  // 25
      ['blend', { mode: 'source-over', opacity: 100 }, 1520, 620],                 // 26 (powered traces in the Trace Hue)
      ['blur', { radius: 2 }, 1040, 440],                                          // 27 (edges rounded)
      ['material', { relief: 45, gloss: 50, shine: 45, shadow: 50, occlusion: 35, ambient: 42 }, 1760, 480],   // 28
      ['blur', { radius: 22 }, 1040, 140],                                         // 29 (the glow: a halo)
      ['blend', { mode: 'screen', opacity: 85 }, 2000, 420],                       // 30
      ['blend', { mode: 'screen', opacity: 45 }, 2240, 420],                       // 31 (hot cores)
      ['blur', { radius: 60 }, 1280, 140],                                         // 32 (the aura)
      ['blend', { mode: 'screen', opacity: 90 }, 2480, 420],                       // 33 (the Glow Hue's emission)
      ['math', { op: 'multiply' }, 1520, 40],                                      // 34 (data on the powered traces)
      ['blur', { radius: 5 }, 1760, 40],                                           // 35
      ['math', { op: 'screen' }, 2000, 40],                                        // 36
      ['blend', { mode: 'screen', opacity: 100 }, 2720, 420],                      // 37 (data)
      ['scatter', { shape: 'spark', count: 14, size: 8, vary: 70, turn: 100, clump: 0, fade: 50 }, 800, 300],   // 38
      ['blur', { radius: 8 }, 1040, 300],                                          // 39
      ['math', { op: 'screen' }, 1280, 300],                                       // 40
      ['blend', { mode: 'screen', opacity: 100 }, 2960, 420],                      // 41 (sparks)
      ['surface', { name: 'Circuit Board', ground: 'colour', aa: 'edges only' }, 3200, 440],         // 42
      ['number', { value: 70 }, 300, 900], ['number', { value: 36 }, 300, 980],   // 43, 44 (how far the glow and the sparks lag behind)
      ['math', { op: 'multiply' }, 560, 160], ['math', { op: 'multiply' }, 560, 280],   // 45, 46 (each trace's grey, dimmed: Charge reaches it later)
      // (Ruby: an Era slider, today → future and quantum → magitech; and markings, stamps and glyphs by the seed)
      ['knob', { slot: '7' }, 40, 1060], ['knob', { slot: '8' }, 40, 1140],   // 47, 48
      // (Ruby: no traces under the poem) its lines, cut away from the board after it is routed, so the rest stays put
      ['poem', { padding: 45, softness: 0 }, 40, 1220],   // 49
      // magitech's brass (gears, bars, rivets, valve caps, coils), laid over the chips before the silkscreen
      ['colour', { hex: '#B8893C' }, 1160, 900], ['blend', { mode: 'source-over', opacity: 100 }, 1160, 620],   // 50, 51
      // MAGITECH's own light (Arcana: crystals, light guides, circles, holograms): faint at rest, bright and haloed where
      // Charge powers it, and sparking (Ruby: "when it's more magical the lighting should lean more towards sparks")
      ['math', { op: 'multiply' }, 1520, 1300], ['blur', { radius: 16 }, 1760, 1300],   // 52 (powered arcana), 53 (its halo)
      ['colour', { hex: '#9FE8FF' }, 2720, 1100], ['blend', { mode: 'screen', opacity: 35 }, 3200, 760], ['blend', { mode: 'screen', opacity: 100 }, 3440, 760],   // 54, 55 (at rest), 56 (lit)
      ['colour', { hex: '#9B6BFF' }, 2960, 1100], ['blend', { mode: 'screen', opacity: 100 }, 3680, 760],   // 57, 58 (the halo, violet)
      ['math', { op: 'multiply' }, 1520, 1420], ['scatter', { shape: 'spark', count: 40, size: 7, vary: 80, turn: 100, clump: 0, fade: 40 }, 1760, 1420],   // 59, 60 (sparks where it sparks)
      ['blur', { radius: 6 }, 2000, 1420], ['math', { op: 'screen' }, 2240, 1420], ['colour', { hex: '#FFD98A' }, 2960, 1200], ['blend', { mode: 'screen', opacity: 100 }, 3920, 760]],   // 61, 62, 63, 64
    wires: [[49, 1, 12, 1], [47, 1, 12, 'era'], [48, 1, 12, 'marks'], [1, 1, 12, 'traces'], [4, 1, 12, 'scale'], [6, 1, 12, 'bends'], [5, 1, 12, 'parts'], [3, 1, 12, 'flow'],
      [2, 1, 13, 'at'], [2, 1, 14, 'at'], [2, 1, 15, 'at'],
      [12, 3, 13, 1], [12, 3, 45, 1], [43, 1, 45, 2], [12, 3, 46, 1], [44, 1, 46, 2], [45, 1, 14, 1], [46, 1, 15, 1], [13, 1, 16, 1], [12, 1, 16, 2], [14, 1, 17, 1], [12, 1, 17, 2],
      [11, 1, 19, 1], [18, 1, 19, 2], [12, 1, 19, 3], [19, 1, 21, 1], [20, 1, 21, 2], [12, 5, 21, 3], [21, 1, 23, 1], [22, 1, 23, 2], [12, 6, 23, 3],
      [23, 1, 51, 1], [50, 1, 51, 2], [12, 8, 51, 3], [51, 1, 25, 1], [24, 1, 25, 2], [12, 7, 25, 3], [25, 1, 26, 1], [8, 1, 26, 2], [16, 1, 26, 3],
      [12, 2, 27, 1], [26, 1, 28, 1], [27, 1, 28, 2], [12, 1, 28, 3], [7, 1, 28, 7],
      [17, 1, 29, 1], [28, 1, 30, 1], [8, 1, 30, 2], [29, 1, 30, 3], [30, 1, 31, 1], [18, 1, 31, 2], [17, 1, 31, 3],
      [17, 1, 32, 1], [31, 1, 33, 1], [10, 1, 33, 2], [32, 1, 33, 3],
      [12, 4, 34, 1], [16, 1, 34, 2], [34, 1, 35, 1], [34, 1, 36, 1], [35, 1, 36, 2], [33, 1, 37, 1], [9, 1, 37, 2], [36, 1, 37, 3],
      [15, 1, 38, 2], [38, 1, 39, 1], [38, 1, 40, 1], [39, 1, 40, 2], [37, 1, 41, 1], [18, 1, 41, 2], [40, 1, 41, 3], [41, 1, 55, 1],
      [12, 9, 52, 1], [13, 1, 52, 2], [52, 1, 53, 1], [54, 1, 55, 2], [12, 9, 55, 3], [55, 1, 56, 1], [54, 1, 56, 2], [52, 1, 56, 3], [56, 1, 58, 1], [57, 1, 58, 2], [53, 1, 58, 3],
      [12, 9, 59, 1], [15, 1, 59, 2], [59, 1, 60, 2], [60, 1, 61, 1], [60, 1, 62, 1], [61, 1, 62, 2], [58, 1, 64, 1], [63, 1, 64, 2], [62, 1, 64, 3], [64, 1, 42, 1]] },
  // ∆ the Chaos textures, each one part (as its texture always drew) with the sliders wired in
  sigils: { label: 'Sigil Scatter', canvas: true, teach: 'One part makes it: Sigils, which inscribes sigils with a broad nib (thick across the nib\'s angle, thin along it), ink pooling where each stroke ends. The dark ones are cut into the ground, the light ones raised from it, and the Light Dial lights that relief: a lit wall and a shadowed one in every cut. Chaos is the hand: steady at 0, then trembling, the nib skipping into scratches. Try: raise Chaos to 80, then turn the dial.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 100–500)
      ['knob', { slot: '2' }, 40, 140],              // 2  (100 of 15–260)
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['sigilmarks', { zoom: 100, '~zoom': '100,500', amount: 100, '~amount': '15,260', form: 20, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'Sigil Scatter', ground: 'grey' }, 600, 120]],           // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 1], [5, 1, 6, 1]] },
  inkbleed: { label: 'Rorschach Test', canvas: true, teach: 'One part makes it: Ink Blot, which drops ink on one half of a folded sheet and presses it, so the blot is mirrored. Wetness makes it bleed: pooled rims, pale mottled middles, wicking and drips. Color lets red join the black, then whole pastel figures, in your Ink Hue and Accent Hue. Try: set Color to 100, then press ⟳ Seed until you see something.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 60–400)
      ['knob', { slot: '2' }, 40, 140],                   // 2  (100 of 30–240)
      ['knob', { slot: '3' }, 40, 240],                  // 3
      ['knob', { slot: '4' }, 40, 340],                    // 4
      ['hue', { slot: '1', name: 'Ink Hue' }, 40, 440], ['hue', { slot: '2', name: 'Accent Hue' }, 40, 520],   // 5, 6
      ['blot', { zoom: 100, '~zoom': '60,400', amount: 100, '~amount': '30,240', form: 50, '~form': '0,100', color: 35, '~color': '0,100' }, 320, 100],   // 7
      ['surface', { name: 'Rorschach Test', ground: 'colour' }, 600, 120]],        // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 'color'], [5, 1, 7, 1], [6, 1, 7, 2], [7, 1, 8, 1]] },
  tessellate: { label: 'Facet Field', poem: 'shape', canvas: true, teach: 'One part makes it: Facet Field, a field of cut facets (a Voronoi of flat planes) each tilted its own way, so the Light Dial catches some and leaves others dark. Irregularity breaks the even cells apart. The Light Hue colors the light; the Facet Hue is the stone itself; the Glow Hue fills the seams with molten light. With Shape Aware ticked the facets near your words are ground flat. Try: raise Irregularity, then lower the dial toward the horizon.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 50–400)
      ['knob', { slot: '2' }, 40, 140],              // 2  (0 of 0–240)
      ['dial', {}, 40, 240],                                                       // 3
      ['hue', { slot: '1', name: 'Light Hue' }, 40, 320], ['hue', { slot: '2', name: 'Facet Hue' }, 40, 400],   // 4, 5
      ['facets', { zoom: 100, '~zoom': '50,400', amount: 0, '~amount': '0,240' }, 320, 100],   // 6
      ['surface', { name: 'Facet Field', ground: 'grey' }, 600, 120]],             // 7
    wires: [[1, 1, 6, 'zoom'], [2, 1, 6, 'amount'], [3, 1, 6, 1], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  blackhole: { label: 'Black Hole', canvas: true, teach: 'One part makes it: Black Hole, which ray-traces a black hole against a starry sky: every pixel follows a ray bent by the hole\'s gravity, so the sky behind is lensed into rings and a disc of hot matter wraps over and under it. The Camera Dial is where you look from: its Turn turns the disc in the sky, its View tips it from face-on at the middle to edge-on at the rim, its zoom brings it closer. The Light Dial places the hole: its way from the page’s middle, and its height how far out (in the middle, the hole stands at the page’s middle). Chaos stirs the disc, Particles fills it, Jets fires beams from the poles. The seed chooses the rest: how wide and turbulent the disc, which way it spins, hot spots orbiting in it, how much nebula and dust lies behind, and sometimes a galaxy right behind the hole, bent into arcs and a ring. Try: draw the camera dial slowly from the rim to the middle, and watch the disc open.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 10–300)
      ['knob', { slot: '3' }, 40, 240],                      // 3
      ['camdial', {}, 40, 340],                                                    // 4  (the camera: where you see it from)
      ['blackhole', { zoom: 100, '~zoom': '40,250', amount: 100, '~amount': '10,300', form: 0, '~form': '0,100', turn: 0, '~turn': '0,360', view: 100, '~view': '0,100', lens: 100, '~lens': '25,400' }, 320, 100],   // 5
      ['surface', { name: 'Black Hole', ground: 'grey' }, 600, 120],               // 6
      ['dial', {}, 40, 440]],                                                      // 7  (the light dial: where it stands)
    wires: [[7, 1, 5, 2], [7, 2, 5, 3], [1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'],
      [4, 1, 5, 'turn'], [4, 2, 5, 'view'], [4, 3, 5, 'lens'], [5, 1, 6, 1]] },
  moon: { label: 'Fractal Moon', canvas: true, teach: 'One part makes it: Fractal Moon, a moon whose maria and craters are fractal noise, in the phase of the seed, under a night sky of faint stars and drifting cloud. Fractal Depth adds finer and finer detail; Clouds draws cloud across it; Night Sky darkens the sky around. Try: Clouds at 0 and Night Sky at 100, for a clear night.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 60–150)
      ['knob', { slot: '2' }, 40, 140],            // 2  (100 of 20–190)
      ['knob', { slot: '3' }, 40, 240],                   // 3
      ['knob', { slot: '4' }, 40, 340],                // 4
      ['moon', { zoom: 100, '~zoom': '60,150', amount: 100, '~amount': '20,190', form: 30, '~form': '0,100', night: 70, '~night': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'Fractal Moon', ground: 'grey' }, 600, 120]],            // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 'night'], [5, 1, 6, 1]] },
  // the older textures, each one part with the sliders wired in (each drawn exactly as it was)
  coldpress: { label: 'Cold Press', canvas: true, teach: 'Watercolor paper, and what the felt it was pressed between left on it. One part makes it: Cold Press raises the tooth as heights (rounded hills and hollows over a gentle swell), so a low light fills the hollows with shadow, and lays the fibers as a normal map, too fine to cast shadows but still catching the light. Press runs from hot press (smooth) to rough. Try: pull the Light Dial out past its rim, and the tooth stands up in long shadows.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 75–400)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–300)
      ['knob', { slot: '3' }, 40, 240],                // 3  (50 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['coldpress', { zoom: 100, '~zoom': '75,400', amount: 100, '~amount': '20,300', form: 50, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'Cold Press', ground: 'grey' }, 600, 120]],   // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 1], [5, 1, 6, 1]] },
  cupring: { label: 'Cup Ring', canvas: true, teach: 'Where a mug of coffee stood on paper. One part makes it: Cup Ring draws each ring the way coffee dries, carried to the edge so the band darkens to a crisp outer line, pooled on the downhill side, mottled where the paper drank it, with drips and a second, offset ring. The Stain Hue is the coffee; the dial gives only a faint sheen where the film is thick. Try: raise Spill for drips and a pale wash inside the rings.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–320)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 30–300)
      ['knob', { slot: '3' }, 40, 240],                // 3  (35 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Stain Hue' }, 40, 440],                // 5
      ['cupring', { zoom: 100, '~zoom': '40,320', amount: 100, '~amount': '30,300', form: 35, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Cup Ring', ground: 'grey' }, 600, 120]],   // 7
    wires: [[1, 1, 6, 'zoom'], [2, 1, 6, 'amount'], [3, 1, 6, 'form'], [4, 1, 6, 1], [5, 1, 6, 2], [6, 1, 7, 1]] },
  oldpaper: { label: 'Old Paper', canvas: true, teach: 'What time and handling do to a sheet. One part makes it: Old Paper folds the sheet as it was folded to be carried (the seed decides how) and crinkles it, as heights the Light Dial lights; then Age yellows it from the edges, gathers foxing in the margins and mildew in colonies, and at the end scorches it. Age Hue colors the yellowing, Mold Hue the mildew. Try: Folds at 100, and the folds tear in from the edge.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–400)
      ['knob', { slot: '2' }, 40, 140],                // 2  (35 of 0–100)
      ['knob', { slot: '3' }, 40, 240],                // 3  (30 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (25 of 0–100)
      ['dial', {}, 40, 440],                                                       // 5
      ['hue', { slot: '1', name: 'Age Hue' }, 40, 540],                // 6
      ['hue', { slot: '2', name: 'Mold Hue' }, 40, 620],                // 7
      ['oldpaper', { zoom: 100, '~zoom': '40,400', amount: 35, '~amount': '0,100', form: 30, '~form': '0,100', crinkle: 25, '~crinkle': '0,100' }, 320, 100],   // 8
      ['surface', { name: 'Old Paper', ground: 'grey' }, 600, 120]],   // 9
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'amount'], [3, 1, 8, 'form'], [4, 1, 8, 'crinkle'], [5, 1, 8, 1], [6, 1, 8, 2], [7, 1, 8, 3], [8, 1, 9, 1]] },
  ash: { label: 'Burnt Letter', canvas: true, teach: 'The ash a burnt page leaves, as it lies. One part makes it: Burnt Letter scatters curled flakes (many small, a few large), each charred black at its heart and pale at its rim, crazed with the lines of the page it was, lifting at its ends so the Light Dial lights one side and throws a shadow; soot and soft piles of powder lie between them. Char moves the flakes from pale ash to black; Embers keeps some burning along their edge. Try: Char at 20 and Embers at 80.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–400)
      ['knob', { slot: '3' }, 40, 240],                // 3  (55 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (20 of 0–100)
      ['dial', {}, 40, 440],                                                       // 5
      ['hue', { slot: '1', name: 'Ash Hue' }, 40, 540],                // 6
      ['hue', { slot: '2', name: 'Ember Hue' }, 40, 620],                // 7
      ['ash', { zoom: 100, '~zoom': '40,300', amount: 100, '~amount': '20,400', form: 55, '~form': '0,100', embers: 20, '~embers': '0,100' }, 320, 100],   // 8
      ['surface', { name: 'Burnt Letter', ground: 'grey' }, 600, 120]],   // 9
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'amount'], [3, 1, 8, 'form'], [4, 1, 8, 'embers'], [5, 1, 8, 1], [6, 1, 8, 2], [7, 1, 8, 3], [8, 1, 9, 1]] },
  frost: { label: 'Hoarfrost', canvas: true, teach: 'Frost ferns across a pane. One part makes it: Hoarfrost grows them the way branching things grow toward the room they have (space colonization): from seeds along the frame inward, each crystal turning by sixty degrees, twigs feathering into needles, a matte rime toward the edges. The ice glints in the Light Dial’s light. Try: Feathering at 0 for bare branches, then raise it.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 50–250)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–250)
      ['knob', { slot: '3' }, 40, 240],                // 3  (55 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (30 of 0–100)
      ['dial', {}, 40, 440],                                                       // 5
      ['hue', { slot: '1', name: 'Frost Hue' }, 40, 540],                // 6
      ['hoarfrost', { zoom: 100, '~zoom': '50,250', amount: 100, '~amount': '20,250', form: 55, '~form': '0,100', rime: 30, '~rime': '0,100' }, 320, 100],   // 7
      ['surface', { name: 'Hoarfrost', ground: 'grey' }, 600, 120]],   // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 'rime'], [5, 1, 7, 1], [6, 1, 7, 2], [7, 1, 8, 1]] },
  glassrain: { label: 'Rain on Glass', canvas: true, teach: 'Rain on a window, simulated. One part makes it: Rain on Glass lets drops sit until they are heavy, then slide, sweep up droplets, merge and leave beaded trails, wiping the fog as they go; each drop is a small dome the Light Dial lights, and through them you see the page behind the glass. Condensation is the fog and the fine droplets between. Try: Condensation at 100, Rain low: a fogged pane with a few clear runs.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–300)
      ['knob', { slot: '3' }, 40, 240],                // 3  (30 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['glassrain', { zoom: 100, '~zoom': '40,300', amount: 100, '~amount': '20,300', form: 30, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'Rain on Glass', ground: 'colour' }, 600, 120]],   // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 1], [5, 1, 6, 1]] },
  water: { label: 'Scrying Pool', canvas: true, teach: 'Looking down into a pool. One part makes it: Scrying Pool lays waves on the surface, refracts what lies below through them (more the deeper it is) and focuses the light into caustics on the floor; the seed picks the pool: a koi pond, a pebbled stream, or a wishing well. The Camera Dial is the camera, wired into Turn, View and Camera Zoom: View tips it toward the horizon, where the water mirrors the sky; Turn walks round the pool; Zoom is the lens. Try: the camera dial at its middle and Turbulence low, then press ⟳ Seed.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 140],                // 2  (35 of 0–100)
      ['knob', { slot: '3' }, 40, 240],                // 3  (35 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (10 of 0–100)
      ['knob', { slot: '5' }, 40, 440],                // 5  (0 of 0–100)
      ['camdial', {}, 40, 540],                                                    // 6  (the camera: View tips it toward the far bank)
      ['dial', {}, 40, 640],                                                       // 7
      ['water', { zoom: 100, '~zoom': '40,250', amount: 35, '~amount': '0,100', form: 35, '~form': '0,100', haze: 10, '~haze': '0,100', murk: 0, '~murk': '0,100', tilt: 35, '~tilt': '0,100', turn: 0, '~turn': '0,360', lens: 100, '~lens': '25,400' }, 320, 100],   // 8
      ['surface', { name: 'Scrying Pool', ground: 'grey' }, 600, 120]],   // 9
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'amount'], [3, 1, 8, 'form'], [4, 1, 8, 'haze'], [5, 1, 8, 'murk'], [6, 1, 8, 'turn'], [6, 2, 8, 'tilt'], [6, 3, 8, 'lens'], [7, 1, 8, 1], [8, 1, 9, 1]] },
  dunes: { label: 'Dune Ripples', canvas: true, teach: 'A field of wind-blown sand. One part makes it: Dune Ripples builds the dunes the seed picks (ridges across the wind, crescents, or long dunes along it), each with a gentle windward slope and a steep slip face, then covers the slopes with ripples where the wind works. The Light Dial is the sun; the Camera Dial is the camera, wired into Turn, View and Camera Zoom: View tips it toward the horizon, Turn walks round the dunes (the sun stays where the light dial points), Zoom is the lens. Try: Dune Height at 0 for ripples alone, then lower the sun.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (50 of 0–100)
      ['knob', { slot: '3' }, 40, 240],                // 3  (40 of 0–100)
      ['camdial', {}, 40, 340],                                                    // 4  (the camera: View tips it toward the horizon)
      ['dial', {}, 40, 440],                                                       // 5
      ['hue', { slot: '1', name: 'Sand Hue' }, 40, 540],                // 6
      ['hue', { slot: '2', name: 'Sun Hue' }, 40, 620],                // 7
      ['dunes', { zoom: 100, '~zoom': '40,300', amount: 50, '~amount': '0,100', form: 40, '~form': '0,100', tilt: 40, '~tilt': '0,100', turn: 0, '~turn': '0,360', lens: 100, '~lens': '25,400' }, 320, 100],   // 8
      ['surface', { name: 'Dune Ripples', ground: 'colour' }, 600, 120]],   // 9
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'amount'], [3, 1, 8, 'form'], [4, 1, 8, 'turn'], [4, 2, 8, 'tilt'], [4, 3, 8, 'lens'], [5, 1, 8, 1], [6, 1, 8, 2], [7, 1, 8, 3], [8, 1, 9, 1]] },
  moss: { label: 'Moss on Stone', canvas: true, teach: 'Stone, and moss where moss grows. One part makes it: Moss on Stone raises rough stone as heights and lays moss where the stone dips below its surroundings and where it is flat, as soft raised clumps, each lit by the Light Dial with its own gloss. Dampness darkens and shines the stone. The Camera Dial is the camera, wired into Turn, View and Camera Zoom: View tips it toward the horizon, the far stone in haze. Try: Moss at 100 and Dampness at 80, for a wet forest floor.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (45 of 0–100)
      ['knob', { slot: '3' }, 40, 240],                // 3  (30 of 0–100)
      ['camdial', {}, 40, 340],                                                    // 4  (the camera: View tips it toward the horizon)
      ['dial', {}, 40, 440],                                                       // 5
      ['hue', { slot: '1', name: 'Stone Hue' }, 40, 540],                // 6
      ['hue', { slot: '2', name: 'Moss Hue' }, 40, 620],                // 7
      ['moss', { zoom: 100, '~zoom': '40,300', amount: 45, '~amount': '0,100', form: 30, '~form': '0,100', tilt: 30, '~tilt': '0,100', turn: 0, '~turn': '0,360', lens: 100, '~lens': '25,400' }, 320, 100],   // 8
      ['surface', { name: 'Moss on Stone', ground: 'colour' }, 600, 120]],   // 9
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'amount'], [3, 1, 8, 'form'], [4, 1, 8, 'turn'], [4, 2, 8, 'tilt'], [4, 3, 8, 'lens'], [5, 1, 8, 1], [6, 1, 8, 2], [7, 1, 8, 3], [8, 1, 9, 1]] },
  kintsugi: { label: 'Kintsugi', canvas: true, teach: 'A glazed vessel broken and mended with gold. One part makes it: Kintsugi breaks the glaze along some edges of a warped cell network, fills each crack with a raised seam of gold, and curves the whole wall away toward the sides, so the Light Dial draws one long highlight down it. Glaze Hue and Gold Hue color the two materials. Try: Fractures at 400, Seam Width at 50.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 50–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–400)
      ['knob', { slot: '3' }, 40, 240],                // 3  (70 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Glaze Hue' }, 40, 440],                // 5
      ['hue', { slot: '2', name: 'Gold Hue' }, 40, 520],                // 6
      ['kintsugi', { zoom: 100, '~zoom': '50,300', amount: 100, '~amount': '20,400', form: 70, '~form': '0,100' }, 320, 100],   // 7
      ['surface', { name: 'Kintsugi', ground: 'colour' }, 600, 120]],   // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 1], [5, 1, 7, 2], [6, 1, 7, 3], [7, 1, 8, 1]] },
  spangle: { label: 'Metal Spangle', canvas: true, teach: 'Metal that crystallized as it cooled: the spangle on galvanized zinc, the stepped hollows of bismuth. One part makes it: Metal Spangle grows grains, each tilted its own way, with feathered dendrites, so turning the Light Dial flashes them one by one. Terraces steps them down into bismuth’s colored hollows; Brushing lays fine lines across them. Try: Terraces at 100, then turn the dial slowly.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (50 of 0–100)
      ['knob', { slot: '3' }, 40, 240],                // 3  (0 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (40 of 0–100)
      ['knob', { slot: '5' }, 40, 440],                // 5  (0 of 0–100)
      ['dial', {}, 40, 540],                                                       // 6
      ['hue', { slot: '1', name: 'Metal Hue' }, 40, 640],                // 7
      ['spangle', { zoom: 100, '~zoom': '40,300', amount: 50, '~amount': '0,100', form: 0, '~form': '0,100', irregular: 40, '~irregular': '0,100', brushing: 0, '~brushing': '0,100' }, 320, 100],   // 8
      ['surface', { name: 'Metal Spangle', ground: 'grey' }, 600, 120]],   // 9
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'amount'], [3, 1, 8, 'form'], [4, 1, 8, 'irregular'], [5, 1, 8, 'brushing'], [6, 1, 8, 1], [7, 1, 8, 2], [8, 1, 9, 1]] },
  crystal: { label: 'Crystal Leaf', div: 2, teach: 'Looking into a crystal druse, close up, lit from its maps (Ruby: "reflectance, albedo, displacement, distortion"). Crystal Druse cuts the points (six-sided pyramids with growth lines across their faces) and hands on what each map holds: the Albedo, what the eye sees inside the stone (its hue deepening inward, the crystals behind seen through the face that bends them, phantoms of the smaller points it once was, and the Inclusions, needles and bubbles seen through the faces); the Height; the Gloss of the polish; the Veil, where it is milky; and the Fire, light split into its colors on the inner planes. A Light Engine lights the albedo from the Normals (each face\'s facing, so every face turns to the Light Dial on its own), the Height (the shadows between the points) and the Gloss (the shine on the polish), the Veil turned over is its Translucency, and the Fire is screened on as light of its own. Try: Clarity at 100 and Fire at 100, then turn the Light Dial.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 140],                // 2  (70 of 0–100)
      ['knob', { slot: '3' }, 40, 240],                // 3  (50 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (30 of 0–100)
      ['knob', { slot: '5' }, 40, 440],                // 5  (20 of 0–100)
      ['hue', { slot: '1', name: 'Crystal Hue' }, 40, 640],                // 6
      ['hue', { slot: '2', name: 'Inclusion Hue' }, 40, 720],                // 7
      ['druse', { zoom: 100, '~zoom': '40,300', clarity: 70, '~clarity': '0,100', fire: 50, '~fire': '0,100', phantoms: 30, '~phantoms': '0,100', inclusions: 20, '~inclusions': '0,100' }, 320, 100],   // 8
      ['invert', {}, 600, 360],                                                    // 9 (the clear stone lets the light through: the veil turned over)
      ['material', { relief: 110, gloss: 80, shine: 80, shadow: 55, occlusion: 45, ambient: 45, translucency: 45 }, 880, 100],   // 10 (the page's rim light its second light)
      ['blend', { mode: 'screen', opacity: 100 }, 1160, 120],                      // 11 (the fire, light of its own)
      ['surface', { name: 'Crystal Leaf', ground: 'colour' }, 1440, 140]],   // 12
    wires: [[1, 1, 8, 'zoom'], [2, 1, 8, 'clarity'], [3, 1, 8, 'fire'], [4, 1, 8, 'phantoms'], [5, 1, 8, 'inclusions'], [6, 1, 8, 2], [7, 1, 8, 3],
      [8, 1, 10, 1], [8, 2, 10, 2], [8, 3, 10, 3], [8, 7, 10, 10], [8, 4, 9, 1], [9, 1, 10, 'translucency'], [10, 1, 11, 1], [8, 5, 11, 2], [11, 1, 12, 1]] },
  // ✋ Drapery: a sheet of cloth simulated as it hangs or falls, its weave following the folds, lit from its maps
  drapery: { label: 'Drapery', teach: 'A sheet of cloth, simulated: Drape hangs it (from a rod in gathers, from two corners, from one, twisted, or seen from above over a hidden form, crumpled, or laid flat) and lets it settle under its own weight as real cloth does, its stiffness by the Fabric (silk makes many small folds, canvas and burlap a few broad ones). It hands on maps, not a picture: the Height of every fold, the Normals (which way each point faces), and U and V, where each point of the cloth came from on the flat sheet. Weave Maps lays threads over and under along U and V, so the weave bends round every fold and fades where a fold\'s wall turns it too fine to see; its Tone colours the warp and the weft through a Gradient Map from your two hues. Detail Normals lays the threads\' relief over the folds\' facing, and a Light Engine lights it all from the Light Dial, its Gloss from the threads (satin and silk shine, burlap does not), its gaps letting the light through. Try: Fabric on Satin and Hang on From Two Corners, then turn the Light Dial.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  Fabric
      ['knob', { slot: '2' }, 40, 140],               // 2  Hang
      ['knob', { slot: '3' }, 40, 240],               // 3  Folds
      ['knob', { slot: '4' }, 40, 340],               // 4  Thread Size
      ['knob', { slot: '5' }, 40, 440],               // 5  Wrinkles
      ['hue', { slot: '1', name: 'Warp Hue' }, 40, 560],                    // 6
      ['hue', { slot: '2', name: 'Weft Hue' }, 40, 640],                    // 7
      ['hue', { slot: '3', name: 'Ground Hue' }, 40, 720],                  // 8
      ['drape', { fabric: 39, '~fabric': '0,100', hang: 7, '~hang': '0,100', folds: 50, '~folds': '0,100', detail: 40, wrinkles: 50, '~wrinkles': '0,100' }, 320, 60],   // 9
      ['weavemaps', { fabric: 39, '~fabric': '0,100', size: 40, '~size': '25,400' }, 600, 60],   // 10
      ['gradmap', {}, 880, 40],                                                    // 11 (the weft's hue to the warp's)
      ['detailnormals', { strength: 18 }, 880, 200],                               // 12 (the threads' relief over the folds' facing)
      ['material', { relief: 100, gloss: 40, shine: 22, shadow: 55, occlusion: 60, ambient: 30, translucency: 15 }, 1160, 60],   // 13
      ['blend', { mode: 'normal', opacity: 100 }, 1440, 120],                      // 14 (the cloth over the ground behind it)
      ['surface', { name: 'Drapery', ground: 'colour' }, 1720, 140]],   // 15
    wires: [[1, 1, 9, 'fabric'], [1, 1, 10, 'fabric'], [2, 1, 9, 'hang'], [3, 1, 9, 'folds'], [4, 1, 10, 'size'], [5, 1, 9, 'wrinkles'],
      [9, 3, 10, 1], [9, 4, 10, 2], [10, 3, 11, 1], [7, 1, 11, 2], [6, 1, 11, 3], [9, 2, 12, 1], [10, 1, 12, 2],
      [11, 1, 13, 1], [9, 1, 13, 2], [10, 2, 13, 3], [12, 1, 13, 10], [10, 4, 13, 'translucency'],
      [8, 1, 14, 1], [13, 1, 14, 2], [9, 6, 14, 3], [14, 1, 15, 1]] },
  suminagashi: { label: 'Suminagashi', canvas: true, teach: 'Japanese floating ink. One part makes it: Suminagashi drops ink and clear water in turn on still water (each drop pushing the rings before it outward), lets a breath move them, and lifts the pattern onto paper. It is exact mathematical marbling: every pixel is traced back through each drop and stroke to the drop it came from. The Light Dial is the breath’s direction. Try: Breath at 0, then raise it slowly.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 50–250)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 30–250)
      ['knob', { slot: '3' }, 40, 240],                // 3  (40 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Ink Hue' }, 40, 440],                // 5
      ['hue', { slot: '2', name: 'Second Ink Hue' }, 40, 520],                // 6
      ['marbling', { zoom: 100, '~zoom': '50,250', amount: 100, '~amount': '30,250', form: 40, '~form': '0,100' }, 320, 100],   // 7
      ['surface', { name: 'Suminagashi', ground: 'colour' }, 600, 120]],   // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 1], [5, 1, 7, 2], [6, 1, 7, 3], [7, 1, 8, 1]] },
  aurora: { label: 'Silk Ribbons', canvas: true, teach: 'Ribbons of light hung in sheets. One part makes it: Silk Ribbons draws each ribbon as a filled sheet with a soft falloff. With two different hues the color blends across the page, from the side the Blend Direction dial points to toward the other; Bloom spills the brightest light into a grainy glow, as on film. Try: a red Curtain Hue and a blue Hem Hue, then turn the dial.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–220)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–1800)
      ['knob', { slot: '3' }, 40, 240],                // 3  (0 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Curtain Hue' }, 40, 440],                // 5
      ['hue', { slot: '2', name: 'Hem Hue' }, 40, 520],                // 6
      ['ribbons', { zoom: 100, '~zoom': '40,220', amount: 100, '~amount': '20,1800', form: 0, '~form': '0,100' }, 320, 100],   // 7
      ['surface', { name: 'Silk Ribbons', ground: 'grey' }, 600, 120]],   // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 1], [5, 1, 7, 2], [6, 1, 7, 3], [7, 1, 8, 1]] },
  bokeh: { label: 'Dream Bloom', canvas: true, teach: 'Lights out of focus, through a real lens. One part makes it: Dream Bloom places motes at real distances from a 50 mm lens at f/1.8 and blurs each by the thin-lens circle of confusion, so those near the Focal Plane stay small and sharp and the rest swell into discs the shape of the Aperture. Object Shape picks what the motes are. Try: Object Shape on the snowflake and Focal Plane low.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 25–400)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–260)
      ['knob', { slot: '3' }, 40, 240],                // 3  (0 of 0–100)
      ['knob', { slot: '4' }, 40, 340],                // 4  (0 of 0–100)
      ['knob', { slot: '5' }, 40, 440],                // 5  (0 of 0–180)
      ['hue', { slot: '1', name: 'Light Hue' }, 40, 540],                // 6
      ['bokeh', { zoom: 100, '~zoom': '25,400', amount: 100, '~amount': '20,260', form: 0, '~form': '0,100', object: 0, '~object': '0,100', spread: 0, '~spread': '0,180' }, 320, 100],   // 7
      ['surface', { name: 'Dream Bloom', ground: 'grey' }, 600, 120]],   // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 'object'], [5, 1, 7, 'spread'], [6, 1, 7, 1], [7, 1, 8, 1]] },
  cityscape: { label: 'Night City', canvas: true, teach: 'A city at night across the water. One part makes it: Night City raises a skyline of mostly dark windows (the few lit ones are what make a city look awake), reflected in rippling streaks below; the seed decides what lies at its feet. Window Hue is the lamplight, Water Hue the river. Try: Lit Windows at 0, then raise it slowly.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 60–180)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 0–300)
      ['hue', { slot: '1', name: 'Window Hue' }, 40, 240],                // 3
      ['hue', { slot: '2', name: 'Water Hue' }, 40, 320],                // 4
      ['cityscape', { zoom: 100, '~zoom': '60,180', amount: 100, '~amount': '0,300' }, 320, 100],   // 5
      ['surface', { name: 'Night City', ground: 'grey' }, 600, 120]],   // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 1], [4, 1, 5, 2], [5, 1, 6, 1]] },
  flowers: { label: 'Lotus Pond', canvas: true, teach: 'Flowers floating on water. One part makes it: Lotus Pond draws each bloom ring by ring, its petals shaded on their far halves and its shadow thrown on the water away from the Light Dial; Form runs through bell bud, cherry, day lily, lotus, daisy, rosette and hydrangea. Its ground is clear, so the page’s backdrop is the water. Try: Form at 100 for hydrangea, then 50 for lotus.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (150 of 50–450)
      ['knob', { slot: '2' }, 40, 140],                // 2  (60 of 10–300)
      ['knob', { slot: '3' }, 40, 240],                // 3  (50 of 0–100)
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Petal Hue' }, 40, 440],                // 5
      ['hue', { slot: '2', name: 'Heart Hue' }, 40, 520],                // 6
      ['lotus', { zoom: 150, '~zoom': '50,450', amount: 60, '~amount': '10,300', form: 50, '~form': '0,100' }, 320, 100],   // 7
      ['surface', { name: 'Lotus Pond', ground: 'colour' }, 600, 120]],   // 8
    wires: [[1, 1, 7, 'zoom'], [2, 1, 7, 'amount'], [3, 1, 7, 'form'], [4, 1, 7, 1], [5, 1, 7, 2], [6, 1, 7, 3], [7, 1, 8, 1]] },
  // ── Light to lay over a page (ROADMAP §2 L6): graphs of general parts, on mid-grey (Light Leaks on black, for Screen) ──
  dappled: { label: 'Dappled Leaves', div: 2, teach: 'Sunlight through leaves, to lay over a page: their shadows on a mid-grey ground, so Soft Light or Overlay lays them over anything. Three Scatters of a leaf (an Ellipse) make the foliage in clumps, far, middle and near; each is thrown along the light by a Motion Blur turned by the Light Dial’s direction and stretched by its height (a lower sun throws longer shadows), then softened by a Blur, the far ones most. Max gathers the shade; a Scatter of dots, blurred, makes the round spots of the sun between the leaves, kept to the gaps by the shade inverted. Map Range lays the shade below the middle and the spots above it, and a Gradient Map colours them Shade Hue, mid-grey, Light Hue. Try: Soft Light over a plain page, the dial low at one side.',
    nodes: [
  ['knob', { slot: '1' }, 40, 40],           // 1
  ['knob', { slot: '2' }, 40, 120],             // 2
  ['knob', { slot: '3' }, 40, 200],           // 3
  ['dial', {}, 40, 280],                                                 // 4 the sun
  ['hue', { slot: '1', name: 'Light Hue' }, 40, 360],                    // 5
  ['hue', { slot: '2', name: 'Shade Hue' }, 40, 440],                    // 6
  ['ellipse', { size: 90, '~size': '60,120', height: 34, soft: 6 }, 220, 40],               // 7 a leaf
  ['scatter', { shape: 'picture', count: 400, '~count': '150,400', size: 40, '~size': '20,70', vary: 50, turn: 100, clump: 92, fade: 0 }, 420, 40],          // 8 the far leaves
  ['scatter', { shape: 'picture', count: 340, '~count': '120,400', size: 34, '~size': '16,60', vary: 50, turn: 100, clump: 90, fade: 0, variation: 4 }, 420, 200],   // 9 the middle
  ['scatter', { shape: 'picture', count: 220, '~count': '60,400', size: 28, '~size': '12,50', vary: 50, turn: 100, clump: 88, fade: 0, variation: 8 }, 420, 360],   // 10 the near
  ['motionblur', { length: 12, '~length': '0,24' }, 620, 40],            // 11 thrown along the light
  ['motionblur', { length: 9, '~length': '0,18' }, 620, 200],           // 12
  ['motionblur', { length: 6, '~length': '0,12' }, 620, 360],           // 13
  ['blur', { radius: 14, '~radius': '4,30' }, 800, 40],                  // 14 far: soft
  ['blur', { radius: 7, '~radius': '2,16' }, 800, 200],                  // 15
  ['blur', { radius: 2, '~radius': '0,7' }, 800, 360],                   // 16 near: sharp
  ['math', { op: 'max' }, 980, 120],                                     // 17
  ['math', { op: 'max' }, 1160, 200],                                    // 18 all the shade
  ['scatter', { shape: 'dot', count: 300, size: 6, vary: 50, turn: 100, clump: 0, fade: 40, variation: 12 }, 980, 360],   // 19 the sun's spots
  ['blur', { radius: 5 }, 1160, 360],                                    // 20
  ['invert', {}, 1160, 460],                                             // 21 where the leaves let light through
  ['math', { op: 'multiply' }, 1340, 400],                               // 22 spots only in the gaps
  ['maprange', { outLo: 50, outHi: 0 }, 1340, 200],                     // 23 shade: below the middle, down to the Shade Hue itself
  ['maprange', { outLo: 0, outHi: 40 }, 1520, 400],                      // 24 spots: a little above it
  ['math', { op: 'add' }, 1520, 240],                                    // 25
  ['colour', { hex: '#808080' }, 1520, 520],                             // 26 the neutral
  ['gradmap', { stops: 3 }, 1700, 240],                                  // 27 shade, neutral, light
  ['surface', { name: 'Dappled Leaves', ground: 'grey' }, 1900, 240]],  // 28
  wires: [[7, 1, 8, 1], [7, 1, 9, 1], [7, 1, 10, 1], [8, 1, 11, 1], [9, 1, 12, 1], [10, 1, 13, 1], [11, 1, 14, 1], [12, 1, 15, 1], [13, 1, 16, 1],
    [14, 1, 17, 1], [15, 1, 17, 2], [17, 1, 18, 1], [16, 1, 18, 2], [19, 1, 20, 1], [18, 1, 21, 1], [20, 1, 22, 1], [21, 1, 22, 2],
    [18, 1, 23, 1], [22, 1, 24, 1], [23, 1, 25, 1], [24, 1, 25, 2], [25, 1, 27, 1], [6, 1, 27, 2], [26, 1, 27, 3], [5, 1, 27, 4], [27, 1, 28, 1],
    [4, 3, 11, 'angle'], [4, 3, 12, 'angle'], [4, 3, 13, 'angle'],
    [4, 2, 11, 'length'], [4, 2, 12, 'length'], [4, 2, 13, 'length'],
    [1, 1, 7, 'size'], [1, 1, 8, 'size'], [1, 1, 9, 'size'], [1, 1, 10, 'size'],
    [2, 1, 8, 'count'], [2, 1, 9, 'count'], [2, 1, 10, 'count'],
    [3, 1, 14, 'radius'], [3, 1, 15, 'radius'], [3, 1, 16, 'radius']] },
  windowlight: { label: 'Window Light', div: 2, teach: 'The light of a window laid across the page, to lay over it on a mid-grey ground. Grid & Dots draws the bars, inverted into panes, cut to a window by a Shape; a Scatter of leaves, kept to one corner by another Shape, is a plant on the sill. Scale stretches it as the Light Dial’s height lowers the sun, Rotate turns it to the dial’s direction, Blur softens its edges; Map Range and a Gradient Map make the room dim and the light bright in your hues. Random Numbers, by the seed, choose how many panes, where the window falls and how leafy the plant. Try: Overlay on a warm page.',
    nodes: [
  ['knob', { slot: '1' }, 40, 40],         // 1
  ['knob', { slot: '2' }, 40, 120],         // 2
  ['knob', { slot: '3' }, 40, 200],           // 3
  ['dial', {}, 40, 280],                                                 // 4 the sun
  ['hue', { slot: '1', name: 'Light Hue' }, 40, 360],                    // 5
  ['hue', { slot: '2', name: 'Shade Hue' }, 40, 440],                    // 6
  ['grid', { kind: 'grid lines', cells: 3, '~cells': '2,6', weight: 14, soft: 0 }, 220, 40],   // 7 the bars
  ['invert', {}, 400, 40],                                               // 8 the panes
  ['shape', { form: 'square', size: 70, '~size': '35,110', soft: 0, x: 55, y: 45, '~x': '30,70', '~y': '30,65' }, 220, 180],   // 9 the window
  ['math', { op: 'multiply' }, 580, 100],                                // 10 the panes in the window
  ['ellipse', { size: 90, height: 30, soft: 8 }, 220, 320],              // 11 a leaf
  ['scatter', { shape: 'picture', count: 70, '~count': '0,160', size: 30, vary: 50, turn: 100, clump: 95, fade: 0 }, 400, 320],   // 12 a plant on the sill
  ['shape', { form: 'circle', size: 70, soft: 60, x: 20, y: 80 }, 220, 460],   // 13 where the plant stands
  ['math', { op: 'multiply' }, 580, 380],                                // 14 the plant only there
  ['invert', {}, 760, 380],                                              // 15
  ['math', { op: 'multiply' }, 760, 160],                                // 16 its leaves' shadows in the light
  ['scale', { scale: 100, stretch: 30, '~stretch': '0,70', edges: 'stretch the edge' }, 940, 160],   // 17 a lower sun throws it longer
  ['rotate', { angle: 0, edges: 'stretch the edge' }, 1120, 160],        // 18 turned toward the sun's way
  ['blur', { radius: 6, '~radius': '1,24' }, 1300, 160],                 // 19
  ['maprange', { outLo: 32, outHi: 82, '~outHi': '62,100' }, 1480, 160],   // 20 the room dim, the light as bright as Brightness says
  ['colour', { hex: '#808080' }, 1480, 320],                             // 21
  ['gradmap', { stops: 3 }, 1660, 160],                                  // 22
  ['surface', { name: 'Window Light', ground: 'grey' }, 1860, 160],     // 23
  ['random', { lo: 0, hi: 100 }, 40, 540],                               // 24 the seed: how many panes
  ['random', { lo: 0, hi: 100 }, 40, 620],                               // 25 …where the window falls, across
  ['random', { lo: 0, hi: 100 }, 40, 700],                               // 26 …and down
  ['random', { lo: 0, hi: 100 }, 40, 780]],                              // 27 …and the plant
  wires: [[7, 1, 8, 1], [8, 1, 10, 1], [9, 1, 10, 2], [11, 1, 12, 1], [12, 1, 14, 1], [13, 1, 14, 2], [14, 1, 15, 1], [10, 1, 16, 1], [15, 1, 16, 2],
    [16, 1, 17, 1], [17, 1, 18, 1], [18, 1, 19, 1], [19, 1, 20, 1], [20, 1, 22, 1], [6, 1, 22, 2], [21, 1, 22, 3], [5, 1, 22, 4], [22, 1, 23, 1],
    [4, 3, 18, 'angle'], [4, 2, 17, 'stretch'], [1, 1, 9, 'size'], [3, 1, 19, 'radius'], [2, 1, 20, 'outHi'],
    [24, 1, 7, 'cells'], [25, 1, 9, 'x'], [26, 1, 9, 'y'], [27, 1, 12, 'count']] },
  caustics: { label: 'Pool Caustics', div: 2, teach: 'Light focused by rippling water onto the floor of a pool, to lay over a page: a bright net on a mid-grey ground. Two Cells, warped by a slow Perlin swell, give the net (their edges); Levels thin the lines and, softer, their glow, which a Blur spreads; a second, finer net is screened over fainter, so the lines are brightest where they cross. Map Range and a Gradient Map put it on mid-grey in your hues. Try: Overlay on a teal page.',
    nodes: [
  ['knob', { slot: '1' }, 40, 40],            // 1
  ['knob', { slot: '2' }, 40, 120],         // 2
  ['knob', { slot: '3' }, 40, 200],           // 3
  ['hue', { slot: '1', name: 'Light Hue' }, 40, 280],                    // 4
  ['hue', { slot: '2', name: 'Shade Hue' }, 40, 360],                    // 5
  ['perlin', { scale: 16, details: 2, rough: 40, contrast: 30, variation: 3 }, 220, 40],   // 6 the swell that bends it
  ['cells', { scale: 45, '~scale': '80,22', jitter: 95, gap: 0 }, 220, 160],   // 7 the net
  ['warp', { amount: 22 }, 420, 160],                                    // 8
  ['levels', { lo: 88, hi: 100, gamma: 45, '~lo': '93,70' }, 600, 120],   // 9 its lines (Softness widens them)
  ['levels', { lo: 55, hi: 100, gamma: 30 }, 600, 220],                  // 10 its glow
  ['cells', { scale: 80, '~scale': '140,40', jitter: 95, gap: 0, variation: 5 }, 220, 340],   // 11 a second, finer net
  ['warp', { amount: 16 }, 420, 340],                                    // 12
  ['levels', { lo: 92, hi: 100, gamma: 45 }, 600, 340],                  // 13
  ['blur', { radius: 5 }, 780, 220],                                     // 14 the glow, soft
  ['math', { op: 'screen' }, 960, 160],                                  // 15 line over glow
  ['maprange', { outLo: 0, outHi: 55 }, 780, 340],                       // 16 the finer net, fainter
  ['math', { op: 'screen' }, 1140, 240],                                 // 17
  ['maprange', { outLo: 45, outHi: 92, '~outHi': '68,100' }, 1320, 240],   // 18 on mid-grey, as bright as Brightness says
  ['colour', { hex: '#808080' }, 1320, 400],                             // 19 the neutral the blends leave as it is
  ['gradmap', { stops: 3 }, 1500, 240],                                  // 20 shade, neutral, light
  ['surface', { name: 'Pool Caustics', ground: 'grey' }, 1700, 240]],   // 21
  wires: [[7, 2, 8, 1], [6, 1, 8, 2], [8, 1, 9, 1], [8, 1, 10, 1], [11, 2, 12, 1], [6, 1, 12, 2], [12, 1, 13, 1], [10, 1, 14, 1], [9, 1, 15, 1], [14, 1, 15, 2],
    [13, 1, 16, 1], [15, 1, 17, 1], [16, 1, 17, 2], [17, 1, 18, 1], [18, 1, 20, 1], [5, 1, 20, 2], [19, 1, 20, 3], [4, 1, 20, 4], [20, 1, 21, 1],
    [1, 1, 7, 'scale'], [1, 1, 11, 'scale'], [3, 1, 9, 'lo'], [2, 1, 18, 'outHi']] },
  lightleaks: { label: 'Light Leaks', div: 4, teach: 'The warm stains of light leaking into a film camera, on black for Screen. Soft Forms make the blooms, kept toward one edge by a Gradient whose way the seed picks; a second Gradient, folded at its middle, is the band of light dragged across. A Blur softens them all; a Gradient Map colours them from black through the Red, Orange and Gold Hues. Random Numbers choose the edge, the band’s way and how many blooms. Try: Screen over a dark page.',
    nodes: [
  ['knob', { slot: '1' }, 40, 40],          // 1
  ['knob', { slot: '2' }, 40, 120],              // 2
  ['knob', { slot: '3' }, 40, 200],           // 3
  ['hue', { slot: '1', name: 'Gold Hue' }, 40, 280],                     // 4
  ['hue', { slot: '2', name: 'Orange Hue' }, 40, 360],                   // 5
  ['hue', { slot: '3', name: 'Red Hue' }, 40, 440],                      // 6
  ['forms', { count: 5, '~count': '2,10', size: 50, '~size': '25,90', noise: 60 }, 220, 40],   // 7 the blooms
  ['gradient', { shape: 'linear', angle: 90, '~angle': '0,360' }, 220, 200],   // 8 toward one edge (the seed's)
  ['levels', { lo: 35, hi: 100, gamma: 40 }, 400, 200],                  // 9 strongest at that edge
  ['math', { op: 'multiply' }, 580, 120],                                // 10
  ['gradient', { shape: 'linear', angle: 20, '~angle': '0,360' }, 220, 340],   // 11 the band across
  ['math', { op: 'difference' }, 400, 340],                              // 12 …its middle
  ['number', { value: 50 }, 220, 460],                                   // 13
  ['levels', { lo: 0, hi: 18, gamma: 50 }, 580, 340],                    // 14
  ['invert', {}, 760, 340],                                              // 15
  ['maprange', { outLo: 0, outHi: 45, '~outHi': '0,70' }, 940, 340],     // 16 as strong as Leaks says
  ['math', { op: 'screen' }, 1120, 200],                                 // 17
  ['blur', { radius: 20, '~radius': '6,40' }, 1300, 200],                // 18 soft
  ['maprange', { outLo: 0, outHi: 90, '~outHi': '50,100' }, 1480, 200],  // 19
  ['colour', { hex: '#000000' }, 1480, 380],                             // 20 the neutral for Screen
  ['gradmap', { stops: 4 }, 1660, 200],                                  // 21 black, red, orange, gold
  ['surface', { name: 'Light Leaks', ground: 'colour' }, 1860, 200],    // 22
  ['random', { lo: 0, hi: 100 }, 40, 540],                               // 23 the seed: which edge
  ['random', { lo: 0, hi: 100 }, 40, 620],                               // 24 …the band's way
  ['random', { lo: 0, hi: 100 }, 40, 700]],                              // 25 …how many blooms
  wires: [[7, 1, 10, 1], [8, 1, 9, 1], [9, 1, 10, 2], [11, 1, 12, 1], [13, 1, 12, 2], [12, 1, 14, 1], [14, 1, 15, 1], [15, 1, 16, 1], [10, 1, 17, 1], [16, 1, 17, 2],
    [17, 1, 18, 1], [18, 1, 19, 1], [19, 1, 21, 1], [20, 1, 21, 2], [6, 1, 21, 3], [5, 1, 21, 4], [4, 1, 21, 5], [21, 1, 22, 1],
    [1, 1, 7, 'size'], [2, 1, 16, 'outHi'], [2, 1, 19, 'outHi'], [3, 1, 18, 'radius'],
    [23, 1, 8, 'angle'], [24, 1, 11, 'angle'], [25, 1, 7, 'count']] },
  // 🪶 Feathers (Ruby: "simple textures of feathers with sliders that control how much … procedurally generated feathers in
  // the background that you can fade or blend with a page color or with a simple texture"): one part, on a transparent ground
  // ── Pixel Space (ROADMAP §2 L1): pixel-art space, general parts and Orbs; docs/prior-art/space-scenes.md ──
  pixelspace: { label: 'Pixel Space', div: 4, crisp: true, teach: 'Space in pixel art, after the generators pixel artists use (Deep-Fold’s Pixel Space and Pixel Planets): a nebula, worlds and stars on a coarse grid of square pixels, every colour from the six hues and the seed choosing the scene. The seed picks the nebula’s form (Random Numbers into a Map Switch): a torn band across the page at the seed’s angle, drifting clouds, a veil of filaments (the ridges of a Perlin Noise), or a galaxy twisted round a point, alone or lying in the band. Every grey map is cut into square cells by Pixelate (Pixel Size), stepped by Posterize (Bands) with Dither where two steps meet, and coloured by a Gradient Map from the Deep Sky through the Mid Sky and the Nebula Hue to Starlight. The rim on the side toward the light is a Smudge of the nebula toward the dial’s handle, less the nebula itself. Stars are two Scatters: dust (Stars) and four-point sparkles (Sparkles) with a halo, each cell taking its brightest point so the smallest star still lights a pixel; some take the Rim or World Hue. Orbs makes the worlds: the seed frames them (none, one, a close one cropped by the page, a horizon, an eclipse with its corona, a belt of rocks, a little system), with bands, continents, ice, craters or lava, rings and moons, each lit by the Light Dial. Try: turn the dial and watch the rims and every world’s terminator follow it.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                   // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                      // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                       // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                    // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                      // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                      // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                       // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                       // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Deep Sky' }, 40, 1030],                                                                                             // 10
      ['hue', { slot: '2', name: 'Mid Sky' }, 40, 1140],                                                                                              // 11
      ['hue', { slot: '3', name: 'Nebula Heart' }, 40, 1250],                                                                                         // 12
      ['hue', { slot: '4', name: 'Nebula Rim' }, 40, 1360],                                                                                           // 13
      ['hue', { slot: '5', name: 'Worlds' }, 40, 1470],                                                                                               // 14
      ['hue', { slot: '6', name: 'Starlight' }, 40, 1580],                                                                                            // 15
      ['perlin', { scale: 45, '~scale': '22,80', details: 4, rough: 45, contrast: 35 }, 260, 40],                                                     // 16
      ['random', { lo: 0, hi: 100 }, 40, 1690],                                                                                                       // 17
      ['perlin', { scale: 18, details: 3, rough: 50, contrast: 20 }, 40, 1800],                                                                       // 18
      ['gradient', { shape: 'linear', angle: 60 }, 260, 150],                                                                                         // 19
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 20
      ['number', { value: 50 }, 40, 2020],                                                                                                            // 21
      ['math', { op: 'difference' }, 480, 40],                                                                                                        // 22
      ['maprange', { inLo: 0, inHi: 30, '~inHi': '18,42', outLo: 100, outHi: 0 }, 700, 40],                                                           // 23
      ['random', { lo: 0, hi: 100 }, 40, 2130],                                                                                                       // 24
      ['warp', { amount: 30, '~amount': '0,80' }, 920, 40],                                                                                           // 25
      ['maprange', { outLo: 45, outHi: 100 }, 480, 150],                                                                                              // 26
      ['math', { op: 'multiply' }, 1140, 40],                                                                                                         // 27
      ['perlin', { scale: 12, details: 2, contrast: 70 }, 40, 2240],                                                                                  // 28
      ['warp', { amount: 30, '~amount': '0,80' }, 480, 260],                                                                                          // 29
      ['maprange', { inLo: 42, inHi: 62, outLo: 0, outHi: 100 }, 260, 260],                                                                           // 30
      ['math', { op: 'multiply' }, 700, 150],                                                                                                         // 31
      ['maprange', { inLo: 0, inHi: 12, '~inHi': '6,18', outLo: 100, outHi: 0 }, 700, 260],                                                           // 32
      ['perlin', { scale: 22, '~scale': '12,40', details: 2, rough: 40, contrast: 30 }, 260, 370],                                                    // 33
      ['random', { lo: 0, hi: 100 }, 40, 2350],                                                                                                       // 34
      ['math', { op: 'difference' }, 480, 370],                                                                                                       // 35
      ['random', { lo: 0, hi: 100 }, 40, 2460],                                                                                                       // 36
      ['maprange', { inLo: 42, inHi: 62, outLo: 0, outHi: 100 }, 260, 480],                                                                           // 37
      ['maprange', { outLo: 55, outHi: 100 }, 480, 480],                                                                                              // 38
      ['warp', { amount: 30, '~amount': '0,80' }, 920, 150],                                                                                          // 39
      ['math', { op: 'multiply' }, 1140, 150],                                                                                                        // 40
      ['number', { value: 40 }, 40, 2570],                                                                                                            // 41
      ['math', { op: 'multiply' }, 480, 590],                                                                                                         // 42
      ['math', { op: 'max' }, 1360, 40],                                                                                                              // 43
      ['math', { op: 'multiply' }, 1580, 40],                                                                                                         // 44
      ['random', { lo: 25, hi: 75 }, 40, 2680],                                                                                                       // 45
      ['random', { lo: 25, hi: 75 }, 40, 2790],                                                                                                       // 46
      ['ellipse', { size: 110, '~size': '70,160', height: 100, soft: 100 }, 260, 590],                                                                // 47
      ['random', { lo: 0, hi: 100 }, 40, 2900],                                                                                                       // 48
      ['invert', {}, 480, 700],                                                                                                                       // 49
      ['twirl', { angle: 520, radius: 60, '~angle': '300,720' }, 1360, 150],                                                                          // 50
      ['math', { op: 'multiply' }, 700, 370],                                                                                                         // 51
      ['math', { op: 'screen' }, 920, 260],                                                                                                           // 52
      ['math', { op: 'multiply' }, 1140, 260],                                                                                                        // 53
      ['random', { lo: 0, hi: 100 }, 40, 3010],                                                                                                       // 54
      ['math', { op: 'multiply' }, 700, 480],                                                                                                         // 55
      ['number', { value: 70 }, 40, 3120],                                                                                                            // 56
      ['math', { op: 'multiply' }, 920, 370],                                                                                                         // 57
      ['math', { op: 'screen' }, 1580, 150],                                                                                                          // 58
      ['ellipse', { size: 90, '~size': '50,130', height: 70, '~height': '35,100', angle: 0, soft: 100 }, 260, 700],                                   // 59
      ['random', { lo: 0, hi: 100 }, 40, 3230],                                                                                                       // 60
      ['random', { lo: 0, hi: 100 }, 40, 3340],                                                                                                       // 61
      ['random', { lo: 0, hi: 100 }, 40, 3450],                                                                                                       // 62
      ['maprange', { inLo: 0, inHi: 22, '~inHi': '12,30', outLo: 100, outHi: 0 }, 700, 590],                                                          // 63
      ['math', { op: 'difference' }, 480, 810],                                                                                                       // 64
      ['number', { value: 60 }, 40, 3560],                                                                                                            // 65
      ['random', { lo: 0, hi: 100 }, 40, 3670],                                                                                                       // 66
      ['maprange', { outLo: 35, outHi: 100 }, 480, 920],                                                                                              // 67
      ['math', { op: 'multiply' }, 920, 480],                                                                                                         // 68
      ['warp', { amount: 30, '~amount': '0,80' }, 1140, 370],                                                                                         // 69
      ['mapswitch', { soft: 0 }, 2240, 40],                                                                                                           // 70
      ['random', { lo: 0, hi: 100 }, 40, 3780],                                                                                                       // 71
      ['number', { value: 85 }, 40, 3890],                                                                                                            // 72
      ['math', { op: 'multiply' }, 1800, 40],                                                                                                         // 73
      ['math', { op: 'max' }, 2020, 40],                                                                                                              // 74
      ['random', { lo: 0, hi: 100 }, 40, 4000],                                                                                                       // 75
      ['mapswitch', { soft: 0 }, 2460, 40],                                                                                                           // 76
      ['levels', { lo: 35, '~lo': '75,5', hi: 95, gamma: 50 }, 2680, 40],                                                                             // 77
      ['maprange', { inLo: 30, inHi: 85, outLo: 0, outHi: 22 }, 260, 810],                                                                            // 78
      ['perlin', { scale: 25, details: 3, contrast: 20 }, 40, 4110],                                                                                  // 79
      ['maprange', { outLo: 18, outHi: 100 }, 2900, 40],                                                                                              // 80
      ['number', { value: 2 }, 40, 4220],                                                                                                             // 81
      ['math', { op: 'greater' }, 2900, 150],                                                                                                         // 82
      ['math', { op: 'multiply' }, 3120, 40],                                                                                                         // 83
      ['math', { op: 'max' }, 3340, 40],                                                                                                              // 84
      ['mix', { t: 40 }, 260, 920],                                                                                                                   // 85
      ['gradmap', { stops: 4 }, 4000, 40],                                                                                                            // 86
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 3560, 40],                                                                     // 87
      ['posterize', { steps: 6, dither: 40, cell: 12, '~cell': '5,24', pattern: 'ordered' }, 3780, 40],                                               // 88
      ['number', { value: 25 }, 40, 4330],                                                                                                            // 89
      ['math', { op: 'subtract' }, 260, 1030],                                                                                                        // 90
      ['math', { op: 'less' }, 260, 1140],                                                                                                            // 91
      ['number', { value: 75 }, 40, 4440],                                                                                                            // 92
      ['math', { op: 'add' }, 260, 1250],                                                                                                             // 93
      ['math', { op: 'multiply' }, 480, 1030],                                                                                                        // 94
      ['math', { op: 'add' }, 700, 700],                                                                                                              // 95
      ['blur', { radius: 5 }, 2900, 260],                                                                                                             // 96
      ['number', { value: 10 }, 40, 4550],                                                                                                            // 97
      ['math', { op: 'greater' }, 3120, 150],                                                                                                         // 98
      ['smudge', { length: 16, '~length': '8,32', strength: 100, trail: 85 }, 3340, 150],                                                             // 99
      ['random', { lo: 0, hi: 100 }, 40, 4660],                                                                                                       // 100
      ['math', { op: 'subtract' }, 3560, 150],                                                                                                        // 101
      ['number', { value: 100 }, 40, 4770],                                                                                                           // 102
      ['math', { op: 'multiply' }, 3780, 150],                                                                                                        // 103
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 4000, 150],                                                                    // 104
      ['threshold', { at: 4, soft: 0 }, 4220, 40],                                                                                                    // 105
      ['threshold', { at: 30, soft: 0 }, 4220, 150],                                                                                                  // 106
      ['threshold', { at: 88, soft: 0 }, 1360, 260],                                                                                                  // 107
      ['math', { op: 'multiply' }, 700, 810],                                                                                                         // 108
      ['math', { op: 'greater' }, 260, 1360],                                                                                                         // 109
      ['math', { op: 'multiply' }, 920, 590],                                                                                                         // 110
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 1140, 480],                                                                    // 111
      ['blend', { opacity: 100 }, 4220, 260],                                                                                                         // 112
      ['blend', { opacity: 100 }, 4440, 40],                                                                                                          // 113
      ['blend', { opacity: 55 }, 4660, 40],                                                                                                           // 114
      ['scatter', { shape: 'dot', count: 120, '~count': '20,400', size: 3, vary: 60, fade: 75, clump: 30, per: 'for the page' }, 260, 1470],          // 115
      ['random', { lo: 0, hi: 100 }, 40, 4880],                                                                                                       // 116
      ['scatter', { shape: 'cross', count: 8, '~count': '1,24', size: 24, vary: 75, turn: 0, fade: 30, per: 'for the page' }, 260, 1580],             // 117
      ['threshold', { at: 30, soft: 0 }, 700, 920],                                                                                                   // 118
      ['pixelate', { size: 12, '~size': '5,24', take: 'the brightest' }, 480, 1140],                                                                  // 119
      ['threshold', { at: 40, soft: 0 }, 700, 1030],                                                                                                  // 120
      ['pixelate', { size: 12, '~size': '5,24', take: 'the brightest' }, 480, 1250],                                                                  // 121
      ['blur', { radius: 10 }, 480, 1360],                                                                                                            // 122
      ['threshold', { at: 12, soft: 0 }, 920, 700],                                                                                                   // 123
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 700, 1140],                                                                    // 124
      ['blend', { opacity: 55 }, 4880, 40],                                                                                                           // 125
      ['threshold', { at: 70, soft: 0 }, 480, 1470],                                                                                                  // 126
      ['threshold', { at: 60, soft: 0 }, 480, 1580],                                                                                                  // 127
      ['math', { op: 'max' }, 920, 810],                                                                                                              // 128
      ['blend', { opacity: 100 }, 5100, 40],                                                                                                          // 129
      ['blend', { opacity: 100 }, 5320, 40],                                                                                                          // 130
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 700, 1250],                                                                    // 131
      ['math', { op: 'multiply' }, 920, 920],                                                                                                         // 132
      ['blend', { opacity: 100 }, 5540, 40],                                                                                                          // 133
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 700, 1360],                                                                    // 134
      ['math', { op: 'multiply' }, 920, 1030],                                                                                                        // 135
      ['orbs', { size: 100, '~size': '50,200' }, 260, 1690],                                                                                          // 136
      ['maprange', { outLo: 40, outHi: 100 }, 480, 1690],                                                                                             // 137
      ['maprange', { outLo: 6, outHi: 100 }, 480, 1800],                                                                                              // 138
      ['math', { op: 'multiply' }, 700, 1470],                                                                                                        // 139
      ['mix', { t: 40 }, 260, 1800],                                                                                                                  // 140
      ['gradmap', { stops: 4 }, 1360, 370],                                                                                                           // 141
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 920, 1140],                                                                    // 142
      ['posterize', { steps: 5, dither: 40, cell: 12, '~cell': '5,24', pattern: 'ordered' }, 1140, 590],                                              // 143
      ['pixelate', { size: 12, '~size': '5,24' }, 480, 1910],                                                                                         // 144
      ['posterize', { steps: 4, dither: 40, cell: 12, '~cell': '5,24', pattern: 'ordered' }, 700, 1580],                                              // 145
      ['gradmap', { stops: 3 }, 920, 1250],                                                                                                           // 146
      ['threshold', { at: 10, soft: 0 }, 920, 1360],                                                                                                  // 147
      ['blend', { opacity: 100 }, 5760, 40],                                                                                                          // 148
      ['threshold', { at: 50, soft: 0 }, 920, 1470],                                                                                                  // 149
      ['math', { op: 'max' }, 480, 2020],                                                                                                             // 150
      ['pixelate', { size: 12, '~size': '5,24', take: 'the average' }, 700, 1690],                                                                    // 151
      ['blend', { opacity: 100 }, 5980, 40],                                                                                                          // 152
      ['surface', { name: 'Pixel Space', ground: 'colour' }, 6200, 40]],                                                                              // 153
    wires: [[17, 1, 16, 'scale'], [20, 1, 19, 'angle'], [19, 1, 22, 1], [21, 1, 22, 2], [22, 1, 23, 1],
      [24, 1, 23, 'inHi'], [23, 1, 25, 1], [18, 1, 25, 2], [7, 1, 25, 'amount'], [25, 1, 27, 1], [26, 1, 27, 2],
      [16, 1, 26, 1], [16, 1, 29, 1], [18, 1, 29, 2], [7, 1, 29, 'amount'], [29, 1, 31, 1], [30, 1, 31, 2], [28, 1, 30, 1],
      [34, 1, 33, 'scale'], [33, 1, 35, 1], [21, 1, 35, 2], [35, 1, 32, 1], [36, 1, 32, 'inHi'], [28, 1, 37, 1],
      [16, 1, 38, 1], [32, 1, 39, 1], [18, 1, 39, 2], [7, 1, 39, 'amount'], [39, 1, 40, 1], [38, 1, 40, 2], [16, 1, 42, 1], [41, 1, 42, 2],
      [40, 1, 43, 1], [42, 1, 43, 2], [43, 1, 44, 1], [37, 1, 44, 2], [45, 1, 47, 'x'], [46, 1, 47, 'y'],
      [48, 1, 47, 'size'], [47, 2, 49, 1], [49, 1, 51, 1], [49, 1, 51, 2], [49, 1, 52, 1], [51, 1, 52, 2], [52, 1, 53, 1],
      [16, 1, 53, 2], [53, 1, 50, 1], [45, 1, 50, 'x'], [46, 1, 50, 'y'], [54, 1, 50, 'angle'],
      [49, 1, 55, 1], [49, 1, 55, 2], [55, 1, 57, 1], [56, 1, 57, 2], [50, 1, 58, 1], [57, 1, 58, 2], [45, 1, 59, 'x'],
      [46, 1, 59, 'y'], [60, 1, 59, 'size'], [61, 1, 59, 'height'],
      [62, 1, 59, 'angle'], [59, 2, 64, 1], [65, 1, 64, 2], [64, 1, 63, 1], [66, 1, 63, 'inHi'], [16, 1, 67, 1],
      [63, 1, 68, 1], [67, 1, 68, 2], [68, 1, 69, 1], [18, 1, 69, 2], [7, 1, 69, 'amount'], [71, 1, 70, 1], [58, 1, 70, 2], [58, 1, 73, 1],
      [72, 1, 73, 2], [27, 1, 74, 1], [73, 1, 74, 2], [74, 1, 70, 3], [69, 1, 70, 4], [75, 1, 76, 1], [27, 1, 76, 2], [31, 1, 76, 3], [44, 1, 76, 4],
      [70, 1, 76, 5], [76, 1, 77, 1], [2, 1, 77, 'lo'], [79, 1, 78, 1], [77, 1, 80, 1], [77, 1, 82, 1], [81, 1, 82, 2], [80, 1, 83, 1],
      [82, 1, 83, 2], [78, 1, 84, 1], [83, 1, 84, 2], [12, 1, 85, 1], [15, 1, 85, 2], [84, 1, 87, 1], [1, 1, 87, 'size'],
      [87, 1, 88, 1], [1, 1, 88, 'cell'], [6, 1, 88, 'dither'], [8, 1, 88, 'steps'],
      [88, 1, 86, 1], [10, 1, 86, 2], [11, 1, 86, 3], [12, 1, 86, 4], [85, 1, 86, 5], [9, 1, 90, 1], [89, 1, 90, 2], [9, 1, 91, 1], [89, 1, 91, 2],
      [9, 1, 93, 1], [92, 1, 93, 2], [91, 1, 94, 1], [93, 1, 94, 2], [90, 1, 95, 1], [94, 1, 95, 2], [77, 1, 96, 1], [96, 1, 98, 1], [97, 1, 98, 2],
      [98, 1, 99, 1], [95, 1, 99, 2], [100, 1, 99, 'length'], [99, 1, 101, 1], [98, 1, 101, 2], [101, 1, 103, 1], [102, 1, 103, 2],
      [103, 1, 104, 1], [1, 1, 104, 'size'], [104, 1, 105, 1], [104, 1, 106, 1], [49, 1, 108, 1], [49, 1, 108, 2], [75, 1, 109, 1],
      [92, 1, 109, 2], [108, 1, 110, 1], [109, 1, 110, 2], [110, 1, 111, 1], [1, 1, 111, 'size'], [111, 1, 107, 1], [86, 1, 112, 1],
      [15, 1, 112, 2], [107, 1, 112, 3], [112, 1, 113, 1], [13, 1, 113, 2], [105, 1, 113, 3], [113, 1, 114, 1], [15, 1, 114, 2], [106, 1, 114, 3],
      [3, 1, 115, 'count'], [116, 1, 115, 'clump'], [4, 1, 117, 'count'], [115, 1, 119, 1],
      [1, 1, 119, 'size'], [119, 1, 118, 1], [117, 1, 121, 1], [1, 1, 121, 'size'], [121, 1, 120, 1],
      [117, 1, 122, 1], [122, 1, 124, 1], [1, 1, 124, 'size'], [124, 1, 123, 1], [114, 1, 125, 1], [12, 1, 125, 2], [123, 1, 125, 3],
      [115, 3, 126, 1], [117, 3, 127, 1], [118, 1, 128, 1], [120, 1, 128, 2], [125, 1, 129, 1], [15, 1, 129, 2], [128, 1, 129, 3], [129, 1, 130, 1],
      [14, 1, 130, 2], [126, 1, 131, 1], [1, 1, 131, 'size'], [118, 1, 132, 1], [131, 1, 132, 2], [132, 1, 130, 3], [130, 1, 133, 1],
      [13, 1, 133, 2], [127, 1, 134, 1], [1, 1, 134, 'size'], [120, 1, 135, 1], [134, 1, 135, 2], [135, 1, 133, 3], [9, 1, 136, 1],
      [9, 2, 136, 2], [5, 1, 136, 'size'], [136, 3, 137, 1], [136, 2, 138, 1], [138, 1, 139, 1], [137, 1, 139, 2], [14, 1, 140, 1],
      [15, 1, 140, 2], [139, 1, 142, 1], [1, 1, 142, 'size'], [142, 1, 143, 1], [1, 1, 143, 'cell'],
      [6, 1, 143, 'dither'], [143, 1, 141, 1], [10, 1, 141, 2], [11, 1, 141, 3], [14, 1, 141, 4], [140, 1, 141, 5], [136, 5, 144, 1],
      [1, 1, 144, 'size'], [144, 1, 145, 1], [1, 1, 145, 'cell'], [6, 1, 145, 'dither'],
      [145, 1, 146, 1], [11, 1, 146, 2], [13, 1, 146, 3], [15, 1, 146, 4], [145, 1, 147, 1], [133, 1, 148, 1], [146, 1, 148, 2], [147, 1, 148, 3],
      [136, 1, 150, 1], [136, 4, 150, 2], [150, 1, 151, 1], [1, 1, 151, 'size'], [151, 1, 149, 1], [148, 1, 152, 1], [141, 1, 152, 2],
      [149, 1, 152, 3], [152, 1, 153, 1]] },
  // ── Webb Sky (ROADMAP §2 L1): JWST false colour, general parts and Diffraction Spikes; docs/prior-art/space-scenes.md ──
  webb: { label: 'Webb Sky', div: 2, teach: 'Deep space as the Webb telescope sees it, in infrared made visible: dust lit by the stars inside it, telescope stars with six long spikes and two short ones, galaxies everywhere behind; every colour from the six hues, the seed choosing the scene. The seed picks the dust (Random Numbers into a Map Switch): globules streaming away from the light (soft blobs Scattered where a broad noise allows, each Smudged into a tail away from the dial’s handle), cosmic cliffs (a Gradient at the seed’s angle raised by the ridges of a Perlin Noise, steam drifting off them along the light), a shell round a dying star (an Ellipse’s rim torn by the noise’s ridges), soft smoke, or a deep field with hardly any dust, a cluster of galaxies and the arcs of light it lenses round itself. A fine noise breaks all of it into clumps. Simple Lighting from the Light Dial shades the dust; a Gradient Map colours it smooth from the Deep Sky through the Dust Shadow and Dust Hues to Dust Light, its lit edges screened brighter; a blue haze of ionized gas (the last hue) glows where it thins. Diffraction Spikes makes the stars, seen through the dust as Webb sees into it; their spikes’ outer halves redden, and a Glow blooms round them. Try: Spiked Stars low and Spike Length high for a few great stars over the dust.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                         // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                   // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                       // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                    // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                        // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                      // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Deep Sky' }, 40, 1030],                                                                                             // 10
      ['hue', { slot: '2', name: 'Dust Shadow' }, 40, 1140],                                                                                          // 11
      ['hue', { slot: '3', name: 'Dust' }, 40, 1250],                                                                                                 // 12
      ['hue', { slot: '4', name: 'Dust Light' }, 40, 1360],                                                                                           // 13
      ['hue', { slot: '5', name: 'Starlight' }, 40, 1470],                                                                                            // 14
      ['hue', { slot: '6', name: 'Ionized Gas' }, 40, 1580],                                                                                          // 15
      ['number', { value: 25 }, 40, 1690],                                                                                                            // 16
      ['perlin', { scale: 40, '~scale': '20,90', details: 5, rough: 55, contrast: 30 }, 260, 40],                                                     // 17
      ['perlin', { scale: 14, details: 2, contrast: 40 }, 40, 1800],                                                                                  // 18
      ['number', { value: 50 }, 40, 1910],                                                                                                            // 19
      ['math', { op: 'difference' }, 480, 40],                                                                                                        // 20
      ['maprange', { inLo: 0, inHi: 50, outLo: 100, outHi: 0 }, 700, 40],                                                                             // 21
      ['ellipse', { size: 90, height: 80, soft: 100 }, 40, 2020],                                                                                     // 22
      ['perlin', { scale: 10, details: 2, contrast: 60 }, 40, 2130],                                                                                  // 23
      ['maprange', { inLo: 25, inHi: 60, outLo: 0, outHi: 100 }, 260, 150],                                                                           // 24
      ['scatter', { shape: 'picture', count: 360, '~count': '260,400', size: 10, '~size': '6,16', vary: 80, turn: 100, clump: 40, fade: 45, per: 'for the page' }, 480, 150],// 25
      ['random', { lo: 0, hi: 100 }, 40, 2240],                                                                                                       // 26
      ['smudge', { length: 30, '~length': '5,70', strength: 100, trail: 65 }, 700, 150],                                                              // 27
      ['maprange', { inLo: 0, inHi: 30, outLo: 0, outHi: 90 }, 920, 40],                                                                              // 28
      ['math', { op: 'max' }, 1140, 40],                                                                                                              // 29
      ['number', { value: 85 }, 40, 2350],                                                                                                            // 30
      ['math', { op: 'multiply' }, 480, 260],                                                                                                         // 31
      ['math', { op: 'multiply' }, 700, 260],                                                                                                         // 32
      ['math', { op: 'max' }, 1360, 40],                                                                                                              // 33
      ['gradient', { shape: 'linear', angle: 90 }, 260, 260],                                                                                         // 34
      ['random', { lo: 0, hi: 100 }, 40, 2460],                                                                                                       // 35
      ['levels', { lo: 45, '~lo': '30,60', hi: 70, '~hi': '55,80', gamma: 50 }, 1360, 150],                                                           // 36
      ['number', { value: 70 }, 40, 2570],                                                                                                            // 37
      ['math', { op: 'multiply' }, 480, 370],                                                                                                         // 38
      ['number', { value: 45 }, 40, 2680],                                                                                                            // 39
      ['math', { op: 'multiply' }, 920, 150],                                                                                                         // 40
      ['math', { op: 'add' }, 1140, 150],                                                                                                             // 41
      ['random', { lo: 0, hi: 100 }, 40, 2790],                                                                                                       // 42
      ['maprange', { outLo: 40, outHi: 100 }, 480, 480],                                                                                              // 43
      ['math', { op: 'multiply' }, 1580, 40],                                                                                                         // 44
      ['math', { op: 'multiply' }, 1580, 150],                                                                                                        // 45
      ['math', { op: 'max' }, 1800, 40],                                                                                                              // 46
      ['random', { lo: 25, hi: 75 }, 40, 2900],                                                                                                       // 47
      ['random', { lo: 25, hi: 75 }, 40, 3010],                                                                                                       // 48
      ['ellipse', { size: 100, '~size': '60,150', height: 75, '~height': '40,100', soft: 100 }, 260, 370],                                            // 49
      ['random', { lo: 0, hi: 100 }, 40, 3120],                                                                                                       // 50
      ['random', { lo: 0, hi: 100 }, 40, 3230],                                                                                                       // 51
      ['random', { lo: 0, hi: 100 }, 40, 3340],                                                                                                       // 52
      ['number', { value: 62 }, 40, 3450],                                                                                                            // 53
      ['math', { op: 'difference' }, 480, 590],                                                                                                       // 54
      ['maprange', { inLo: 0, inHi: 25, '~inHi': '12,35', outLo: 100, outHi: 0 }, 700, 370],                                                          // 55
      ['maprange', { inLo: 0, inHi: 65, outLo: 35, outHi: 0 }, 480, 700],                                                                             // 56
      ['maprange', { outLo: 0, outHi: 60 }, 480, 810],                                                                                                // 57
      ['math', { op: 'screen' }, 920, 260],                                                                                                           // 58
      ['math', { op: 'multiply' }, 1140, 260],                                                                                                        // 59
      ['warp', { amount: 35, '~amount': '10,70' }, 1360, 260],                                                                                        // 60
      ['random', { lo: 0, hi: 100 }, 40, 3560],                                                                                                       // 61
      ['math', { op: 'multiply' }, 700, 480],                                                                                                         // 62
      ['math', { op: 'max' }, 1580, 260],                                                                                                             // 63
      ['warp', { amount: 35, '~amount': '10,70' }, 480, 920],                                                                                         // 64
      ['random', { lo: 0, hi: 100 }, 40, 3670],                                                                                                       // 65
      ['maprange', { outLo: 30, outHi: 100 }, 480, 1030],                                                                                             // 66
      ['math', { op: 'multiply' }, 700, 590],                                                                                                         // 67
      ['number', { value: 18 }, 40, 3780],                                                                                                            // 68
      ['math', { op: 'multiply' }, 480, 1140],                                                                                                        // 69
      ['random', { lo: 0, hi: 100 }, 40, 3890],                                                                                                       // 70
      ['mapswitch', { soft: 0 }, 920, 370],                                                                                                           // 71
      ['random', { lo: 0, hi: 100 }, 40, 4000],                                                                                                       // 72
      ['mapswitch', { soft: 0 }, 2020, 40],                                                                                                           // 73
      ['number', { value: 75 }, 40, 4110],                                                                                                            // 74
      ['math', { op: 'greater' }, 260, 480],                                                                                                          // 75
      ['math', { op: 'greater' }, 260, 590],                                                                                                          // 76
      ['math', { op: 'multiply' }, 480, 1250],                                                                                                        // 77
      ['perlin', { scale: 200, details: 3, rough: 65, contrast: 60 }, 40, 4220],                                                                      // 78
      ['maprange', { outLo: 20, outHi: 100 }, 260, 700],                                                                                              // 79
      ['math', { op: 'multiply' }, 2240, 40],                                                                                                         // 80
      ['motionblur', { length: 20, '~length': '0,60' }, 2460, 40],                                                                                    // 81
      ['maprange', { inLo: 0, inHi: 70, outLo: 0, outHi: 80 }, 2680, 40],                                                                             // 82
      ['math', { op: 'max' }, 2900, 40],                                                                                                              // 83
      ['levels', { lo: 30, '~lo': '70,0', hi: 90, gamma: 50 }, 3120, 40],                                                                             // 84
      ['blur', { radius: 5 }, 3340, 40],                                                                                                              // 85
      ['light', { relief: 70, gloss: 20, shadow: 40 }, 3560, 40],                                                                                     // 86
      ['maprange', { inLo: 20, inHi: 80, outLo: 30, outHi: 100 }, 3780, 40],                                                                          // 87
      ['math', { op: 'multiply' }, 4000, 40],                                                                                                         // 88
      ['maprange', { inLo: 0, inHi: 62, outLo: 0, outHi: 100 }, 4220, 40],                                                                            // 89
      ['gradmap', { stops: 4 }, 4440, 40],                                                                                                            // 90
      ['blend', { mode: 'screen', opacity: 70 }, 4660, 40],                                                                                           // 91
      ['math', { op: 'multiply' }, 3780, 150],                                                                                                        // 92
      ['blur', { radius: 30 }, 3340, 150],                                                                                                            // 93
      ['perlin', { scale: 8, details: 3, contrast: 30 }, 40, 4330],                                                                                   // 94
      ['maprange', { inLo: 30, inHi: 80, outLo: 0, outHi: 100 }, 260, 810],                                                                           // 95
      ['maprange', { inLo: 0, inHi: 40, outLo: 0, outHi: 100 }, 3560, 150],                                                                           // 96
      ['maprange', { outLo: 100, outHi: 0 }, 3340, 260],                                                                                              // 97
      ['math', { op: 'multiply' }, 3780, 260],                                                                                                        // 98
      ['math', { op: 'multiply' }, 4000, 150],                                                                                                        // 99
      ['blend', { mode: 'screen', opacity: 45 }, 4880, 40],                                                                                           // 100
      ['ellipse', { size: 100, height: 38, soft: 100 }, 40, 4440],                                                                                    // 101
      ['levels', { lo: 0, hi: 100, gamma: 25 }, 480, 1360],                                                                                           // 102
      ['maprange', { outLo: 100, outHi: 0 }, 260, 920],                                                                                               // 103
      ['mix', { t: 0 }, 700, 700],                                                                                                                    // 104
      ['number', { value: 100 }, 40, 4550],                                                                                                           // 105
      ['maprange', { outLo: 100, outHi: 0 }, 480, 1470],                                                                                              // 106
      ['scatter', { shape: 'picture', count: 40, '~count': '0,140', size: 10, '~size': '9,22', vary: 85, turn: 100, fade: 50, per: 'for the page' }, 920, 480],// 107
      ['threshold', { at: 55, soft: 0 }, 1140, 370],                                                                                                  // 108
      ['blur', { radius: 3 }, 1140, 480],                                                                                                             // 109
      ['math', { op: 'multiply' }, 1360, 370],                                                                                                        // 110
      ['number', { value: 60 }, 40, 4660],                                                                                                            // 111
      ['math', { op: 'multiply' }, 1140, 590],                                                                                                        // 112
      ['math', { op: 'multiply' }, 1360, 480],                                                                                                        // 113
      ['math', { op: 'screen' }, 1580, 370],                                                                                                          // 114
      ['blend', { mode: 'screen', opacity: 90 }, 5100, 40],                                                                                           // 115
      ['math', { op: 'multiply' }, 1800, 150],                                                                                                        // 116
      ['blend', { mode: 'screen', opacity: 90 }, 5320, 40],                                                                                           // 117
      ['math', { op: 'subtract' }, 1360, 590],                                                                                                        // 118
      ['math', { op: 'multiply' }, 1800, 260],                                                                                                        // 119
      ['number', { value: 0 }, 40, 4770],                                                                                                             // 120
      ['math', { op: 'add' }, 480, 1580],                                                                                                             // 121
      ['math', { op: 'subtract' }, 700, 810],                                                                                                         // 122
      ['math', { op: 'less' }, 480, 1690],                                                                                                            // 123
      ['math', { op: 'add' }, 480, 1800],                                                                                                             // 124
      ['math', { op: 'multiply' }, 700, 920],                                                                                                         // 125
      ['math', { op: 'add' }, 920, 590],                                                                                                              // 126
      ['math', { op: 'difference' }, 480, 1910],                                                                                                      // 127
      ['maprange', { inLo: 0, inHi: 15, outLo: 100, outHi: 0 }, 700, 1030],                                                                           // 128
      ['scatter', { shape: 'dash', count: 16, '~count': '5,36', size: 16, vary: 70, turn: 8, fade: 40, per: 'for the page' }, 1140, 700],             // 129
      ['random', { lo: 0, hi: 100 }, 40, 4880],                                                                                                       // 130
      ['blur', { radius: 1 }, 1360, 700],                                                                                                             // 131
      ['blend', { mode: 'screen', opacity: 100 }, 5540, 40],                                                                                          // 132
      ['math', { op: 'multiply' }, 1580, 480],                                                                                                        // 133
      ['spikes', { count: 30, length: 50, dots: 50 }, 260, 1030],                                                                                     // 134
      ['blend', { mode: 'screen', opacity: 100 }, 5760, 40],                                                                                          // 135
      ['blend', { mode: 'screen', opacity: 60 }, 5980, 40],                                                                                           // 136
      ['glow', { radius: 20, aura: 60, strength: 70, auraK: 40, core: 40 }, 6200, 40],                                                                // 137
      ['surface', { name: 'Webb Sky', ground: 'colour' }, 6420, 40]],                                                                                 // 138
    wires: [[8, 1, 17, 'scale'], [17, 1, 20, 1], [19, 1, 20, 2], [20, 1, 21, 1], [23, 1, 24, 1], [22, 1, 25, 1], [24, 1, 25, 2],
      [26, 1, 25, 'count'], [8, 1, 25, 'size'], [25, 1, 27, 1], [9, 3, 27, 2],
      [2, 1, 27, 'length'], [27, 1, 28, 1], [25, 1, 29, 1], [28, 1, 29, 2], [17, 1, 31, 1], [30, 1, 31, 2], [24, 1, 32, 1],
      [31, 1, 32, 2], [29, 1, 33, 1], [32, 1, 33, 2], [35, 1, 34, 'angle'], [34, 1, 38, 1], [37, 1, 38, 2], [21, 1, 40, 1],
      [39, 1, 40, 2], [38, 1, 41, 1], [40, 1, 41, 2], [41, 1, 36, 1], [42, 1, 36, 'lo'], [17, 1, 43, 1], [36, 1, 44, 1], [43, 1, 44, 2],
      [36, 1, 45, 1], [21, 1, 45, 2], [44, 1, 46, 1], [45, 1, 46, 2], [47, 1, 49, 'x'], [48, 1, 49, 'y'],
      [50, 1, 49, 'size'], [51, 1, 49, 'height'], [52, 1, 49, 'angle'], [49, 2, 54, 1],
      [53, 1, 54, 2], [54, 1, 55, 1], [49, 2, 56, 1], [17, 1, 57, 1], [21, 1, 58, 1], [57, 1, 58, 2], [55, 1, 59, 1], [58, 1, 59, 2], [59, 1, 60, 1],
      [18, 1, 60, 2], [61, 1, 60, 'amount'], [56, 1, 62, 1], [17, 1, 62, 2], [60, 1, 63, 1], [62, 1, 63, 2], [17, 1, 64, 1], [18, 1, 64, 2],
      [65, 1, 64, 'amount'], [24, 1, 66, 1], [64, 1, 67, 1], [66, 1, 67, 2], [17, 1, 69, 1], [68, 1, 69, 2], [70, 1, 71, 1], [67, 1, 71, 2],
      [69, 1, 71, 3], [72, 1, 73, 1], [33, 1, 73, 2], [46, 1, 73, 3], [63, 1, 73, 4], [71, 1, 73, 5], [72, 1, 75, 1], [74, 1, 75, 2], [70, 1, 76, 1],
      [19, 1, 76, 2], [75, 1, 77, 1], [76, 1, 77, 2], [78, 1, 79, 1], [73, 1, 80, 1], [79, 1, 80, 2], [80, 1, 81, 1],
      [9, 3, 81, 'angle'], [2, 1, 81, 'length'], [81, 1, 82, 1], [80, 1, 83, 1], [82, 1, 83, 2],
      [83, 1, 84, 1], [1, 1, 84, 'lo'], [84, 1, 85, 1], [85, 1, 86, 1], [9, 1, 86, 2], [86, 1, 87, 1], [84, 1, 88, 1], [87, 1, 88, 2],
      [88, 1, 89, 1], [89, 1, 90, 1], [10, 1, 90, 2], [11, 1, 90, 3], [12, 1, 90, 4], [13, 1, 90, 5], [90, 1, 91, 1], [13, 1, 91, 2], [86, 2, 92, 1],
      [84, 1, 92, 2], [92, 1, 91, 3], [84, 1, 93, 1], [94, 1, 95, 1], [93, 1, 96, 1], [84, 1, 97, 1], [96, 1, 98, 1], [97, 1, 98, 2], [95, 1, 99, 1],
      [98, 1, 99, 2], [91, 1, 100, 1], [15, 1, 100, 2], [99, 1, 100, 3], [101, 2, 103, 1], [103, 1, 102, 1], [105, 1, 104, 1], [49, 2, 106, 1],
      [106, 1, 104, 2], [77, 1, 104, 3], [102, 1, 107, 1], [104, 1, 107, 2], [6, 1, 107, 'count'],
      [77, 1, 107, 'size'], [107, 3, 108, 1], [107, 1, 109, 1], [109, 1, 110, 1], [30, 1, 110, 2], [107, 1, 112, 1], [111, 1, 112, 2],
      [107, 1, 113, 1], [112, 1, 113, 2], [110, 1, 114, 1], [113, 1, 114, 2], [100, 1, 115, 1], [15, 1, 115, 2], [114, 1, 116, 1], [108, 1, 116, 2],
      [116, 1, 115, 3], [115, 1, 117, 1], [12, 1, 117, 2], [105, 1, 118, 1], [108, 1, 118, 2], [114, 1, 119, 1], [118, 1, 119, 2], [119, 1, 117, 3],
      [49, 3, 121, 1], [120, 1, 121, 2], [121, 1, 122, 1], [16, 1, 122, 2], [49, 3, 123, 1], [16, 1, 123, 2], [49, 3, 124, 1], [74, 1, 124, 2],
      [123, 1, 125, 1], [124, 1, 125, 2], [122, 1, 126, 1], [125, 1, 126, 2], [49, 2, 127, 1], [39, 1, 127, 2], [127, 1, 128, 1], [128, 1, 129, 2],
      [126, 1, 129, 3], [130, 1, 129, 'count'], [129, 1, 131, 1], [117, 1, 132, 1], [15, 1, 132, 2], [131, 1, 133, 1], [77, 1, 133, 2],
      [133, 1, 132, 3], [3, 1, 134, 'dots'], [4, 1, 134, 'count'], [5, 1, 134, 'length'],
      [132, 1, 135, 1], [14, 1, 135, 2], [134, 1, 135, 3], [135, 1, 136, 1], [12, 1, 136, 2], [134, 3, 136, 3], [136, 1, 137, 1], [134, 1, 137, 2],
      [14, 1, 137, 3], [7, 1, 137, 'strength'], [137, 1, 138, 1]] },
  // ── Liminal Spaces (ROADMAP §2 L3): the Room Caster and general parts; docs/prior-art/liminal-spaces.md ──
  liminal: { label: 'Liminal Spaces', div: 2, teach: 'An empty place made for passing through, after the liminal spaces of the internet (the Backrooms, the poolrooms, Kane Pixels’ found footage, Jared Pike’s Dream Pools, The Exit 8): nobody there, everything familiar and a little off, the end of it lost in the dark. The Room Caster builds it and casts it as a ray-caster does. The seed picks the kind of place (a lobby of stripes and drop ceiling, a concrete warehouse, maintenance tunnels, the poolrooms, a hotel corridor, a school hallway after hours, a hospital corridor, a subway passage of white tile, a parking garage, a dead mall, an office after hours), lays it out (a long corridor with doors and a turn into the dark, an open plan of stubs and pillars, a maze, a hall of pools), hangs its lights (some missing, some dead) and stands the camera in it. It hands on grey maps, as a renderer does: which surface each point is, how far, the light reaching it, each surface’s pattern, the lamps, the water, each face’s shade. A Gradient Map in bands colours each surface its own hue; Blend multiplies in the pattern and the light (a Gradient Map from the Dark Hue to the Light Hue) and lays the water in the Accent Hue; the lamps are screened in and bloom (Glow); a haze swallows the far end; Film Grain and a Chromatic Offset (the seed’s, now and then) give it a camcorder’s grade. The Camera Dial turns the camera from where the seed looks, tips it down, and zooms. Try: Failing Lights high and Haze high, for a corridor nobody has walked in years.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                        // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                     // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                       // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                      // 4
      ['knob', { slot: '5' }, 40, 480],                                                                              // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                        // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                       // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                 // 8
      ['camdial', {}, 40, 920],                                                                                                                       // 9
      ['hue', { slot: '1', name: 'Wall Hue' }, 40, 1030],                                                                                             // 10
      ['hue', { slot: '2', name: 'Floor Hue' }, 40, 1140],                                                                                            // 11
      ['hue', { slot: '3', name: 'Ceiling Hue' }, 40, 1250],                                                                                          // 12
      ['hue', { slot: '4', name: 'Accent Hue' }, 40, 1360],                                                                                           // 13
      ['hue', { slot: '5', name: 'Light Hue' }, 40, 1470],                                                                                            // 14
      ['hue', { slot: '6', name: 'Dark Hue' }, 40, 1580],                                                                                             // 15
      ['roomcaster', {}, 260, 40],                                                                                                                    // 16
      ['gradmap', { stops: 5, blend: 'bands' }, 480, 40],                                                                                             // 17
      ['blend', { mode: 'multiply', opacity: 100 }, 700, 40],                                                                                         // 18
      ['blend', { mode: 'normal', opacity: 85 }, 920, 40],                                                                                            // 19
      ['gradmap', { stops: 2 }, 700, 150],                                                                                                            // 20
      ['maprange', { inLo: 0, inHi: 85, outLo: 6, outHi: 100 }, 480, 150],                                                                            // 21
      ['blend', { mode: 'multiply', opacity: 100 }, 1140, 40],                                                                                        // 22
      ['maprange', { outLo: 0, outHi: 100 }, 480, 260],                                                                                               // 23
      ['blend', { mode: 'multiply', opacity: 100 }, 1360, 40],                                                                                        // 24
      ['blend', { mode: 'screen', opacity: 100 }, 1580, 40],                                                                                          // 25
      ['glow', { radius: 18, aura: 70, strength: 60, auraK: 35, core: 50 }, 1800, 40],                                                                // 26
      ['mix', { t: 18 }, 260, 150],                                                                                                                   // 27
      ['maprange', { inLo: 15, inHi: 100, outLo: 0, outHi: 60, '~outHi': '0,100' }, 480, 370],                                                        // 28
      ['blend', { mode: 'normal', opacity: 100 }, 2020, 40],                                                                                          // 29
      ['grain', { size: 160, contrast: 120, kind: 33 }, 40, 1690],                                                                                    // 30
      ['blend', { mode: 'overlay', opacity: 35, '~opacity': '0,80' }, 2240, 40],                                                                      // 31
      ['chroma', { amount: 10, '~amount': '0,30', angle: 0, edge: 30 }, 2460, 40],                                                                    // 32
      ['random', { lo: 0, hi: 100 }, 40, 1800],                                                                                                       // 33
      ['surface', { name: 'Liminal Spaces', ground: 'colour' }, 2680, 40]],                                                                           // 34
    wires: [[1, 1, 16, 'reach'], [2, 1, 16, 'ceiling'], [3, 1, 16, 'width'],
      [4, 1, 16, 'lights'], [5, 1, 16, 'failing'], [8, 1, 16, 'strange'],
      [9, 1, 16, 1], [9, 2, 16, 2], [9, 3, 16, 3], [16, 1, 17, 1], [15, 1, 17, 2], [11, 1, 17, 3], [12, 1, 17, 4], [10, 1, 17, 5], [13, 1, 17, 6],
      [17, 1, 18, 1], [16, 4, 18, 2], [18, 1, 19, 1], [13, 1, 19, 2], [16, 6, 19, 3], [16, 3, 21, 1], [21, 1, 20, 1], [15, 1, 20, 2], [14, 1, 20, 3],
      [19, 1, 22, 1], [20, 1, 22, 2], [16, 7, 23, 1], [22, 1, 24, 1], [23, 1, 24, 2], [24, 1, 25, 1], [14, 1, 25, 2], [16, 5, 25, 3], [25, 1, 26, 1],
      [16, 5, 26, 2], [14, 1, 26, 3], [15, 1, 27, 1], [14, 1, 27, 2], [16, 2, 28, 1], [6, 1, 28, 'outHi'], [26, 1, 29, 1],
      [27, 1, 29, 2], [28, 1, 29, 3], [29, 1, 31, 1], [30, 1, 31, 2], [7, 1, 31, 'opacity'], [31, 1, 32, 1],
      [33, 1, 32, 'amount'], [32, 1, 34, 1]] },
  imprints: { label: 'Floral Imprints', div: 2, teach: 'Flowers printed, drawn or pressed onto the page (docs/prior-art/floral-imprints.md), in fifteen media: a cyanotype’s Prussian blue with the plant left pale where it lay; a lumen print’s mauve; white chalk on a dark page, sitting on the paper’s tooth; a crayon rubbing; graphite with its sheen; charcoal’s smudge; the flower itself, pressed and taped as on a herbarium sheet; a blind emboss and gold foil the light dial lights; letterpress pressed into the paper; a nature print in the leaf’s own veins; an eco-print’s tannin and iron halo; a rubber stamp; a risograph’s two drums off register; a watercolour wash. Specimen lays whole plants of the Species on the page, root down, as a collector lays them on a sheet (docs/prior-art/botanical-specimens.md): each with its root, bulb or cut end, its own leaves and how they grow, its flowers in several views among buds and seed (Prints: how many plants; Print Size: how tall; Turn: how they lean); its maps (layers, part, height) are merged into one picture; Imprint develops them in the Medium, on the page beneath under Normal or on the blend’s own neutral under any other blend (so Multiply lays only ink, Screen only chalk); the Light Engine lights its height and gloss from the dial. Try: Medium Blind Emboss with the light dial low, or White Chalk with Screen on a dark page.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                // 1 Species
      ['knob', { slot: '2' }, 40, 150],                                                                               // 2 Prints
      ['knob', { slot: '3' }, 40, 260],                                                                               // 3 Print Size
      ['knob', { slot: '4' }, 40, 370],                                                                               // 4 Ink
      ['knob', { slot: '5' }, 40, 480],                                                                               // 5 Paper
      ['knob', { slot: '6' }, 40, 590],                                                                               // 6 Medium
      ['knob', { slot: '7' }, 40, 700],                                                                               // 7 Wear
      ['knob', { slot: '8' }, 40, 810],                                                                               // 8 Turn
      ['dial', {}, 40, 920],                                                                                          // 9
      ['hue', { slot: '1', name: 'Ink Hue' }, 40, 1030],                                                              // 10
      ['hue', { slot: '2', name: 'Second Hue' }, 40, 1140],                                                           // 11
      ['hue', { slot: '3', name: 'Petal Hue' }, 40, 1250],                                                            // 12
      ['hue', { slot: '4', name: 'Center Hue' }, 40, 1360],                                                           // 13
      ['hue', { slot: '5', name: 'Leaf Hue' }, 40, 1470],                                                             // 14
      ['backdrop', {}, 40, 1580],                                                                                     // 15 the page beneath
      ['perlin', { scale: 190, details: 3, rough: 65, contrast: 40, '~contrast': '5,95' }, 260, 1580],              // 16 the paper's tooth
      ['specimen', { species: 41, view: 40, stage: 55, '~stage': '35,80', page: 3, '~page': '1,6', size: 90, '~size': '60,120', turn: 50, '~turn': '35,65', flat: 100, jitter: 50, variant: 2 }, 260, 40], // 17 the plants
      ['maprange', { outLo: 0, outHi: 60 }, 480, 260],                                                                // 18 petals → part 0.6
      ['math', { op: 'max' }, 700, 260],                                                                              // 19 …and the centre, 1
      ['merge', {}, 920, 260],                                                                                        // 20 layers · part · height
      ['imprint', { medium: 10, load: 55, wear: 25, soft: 30 }, 1360, 150],                                           // 21
      ['material', { relief: 70, gloss: 35, shine: 45, shadow: 45, occlusion: 15, ambient: 55 }, 1580, 150],         // 22 the Light Engine
      ['surface', { name: 'Floral Imprints', ground: 'colour' }, 1800, 150]],                                         // 23
    wires: [[5, 1, 16, 'contrast'], [9, 1, 17, 1], [12, 1, 17, 2], [13, 1, 17, 4], [14, 1, 17, 5], [1, 1, 17, 'species'],
      [2, 1, 17, 'page'], [3, 1, 17, 'size'], [8, 1, 17, 'turn'],
      [17, 6, 18, 1], [18, 1, 19, 1], [17, 5, 19, 2], [17, 4, 20, 1], [19, 1, 20, 2], [17, 3, 20, 3],
      [17, 2, 21, 1], [20, 1, 21, 2], [17, 1, 21, 3], [16, 1, 21, 4], [15, 1, 21, 5], [10, 1, 21, 6], [11, 1, 21, 7], [9, 1, 21, 8],
      [6, 1, 21, 'medium'], [4, 1, 21, 'load'], [7, 1, 21, 'wear'],
      [21, 1, 22, 1], [21, 2, 22, 2], [21, 3, 22, 3], [9, 1, 22, 7], [22, 1, 23, 1]] },
  bouquets: { label: 'Bouquets', div: 2, teach: 'Flowers gathered (docs/prior-art/florals.md §4): a posy seen from above in its creased paper, a crown circling the page, or a bundle laid across a cloth; the seed chooses which, and where it lies. Bloom draws four sheets: the main flower (its species on the first slider), a second flower, a filler of Queen Anne’s lace, and leaves; four Scatters throw them inside the arrangement’s shape (an Ellipse, its ring, or a long one, chosen by a Map Switch), the leaves in a halo round it (Grow), the largest heads on top. Their heights, the leaves lowest and the heads highest, go to the Light Engine, which lights it all from the dial and lays its shadows (Shadow). The wrap shows round a posy only, creased in rings (Polar Coordinates on Waves). Try: a low dial for long shadows across the cloth.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                  // 1
      ['knob', { slot: '2' }, 40, 150],                                                                               // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                      // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                     // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                      // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                      // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                        // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Ground Hue' }, 40, 1030],                                                                                           // 10
      ['hue', { slot: '2', name: 'Main Bloom Hue' }, 40, 1140],                                                                                       // 11
      ['hue', { slot: '3', name: 'Second Bloom Hue' }, 40, 1250],                                                                                     // 12
      ['hue', { slot: '4', name: 'Filler Hue' }, 40, 1360],                                                                                           // 13
      ['hue', { slot: '5', name: 'Foliage Hue' }, 40, 1470],                                                                                          // 14
      ['hue', { slot: '6', name: 'Wrap Hue' }, 40, 1580],                                                                                             // 15
      ['random', { lo: 38, hi: 62 }, 40, 1690],                                                                                                       // 16
      ['random', { lo: 36, hi: 60 }, 40, 1800],                                                                                                       // 17
      ['ellipse', { size: 70, '~size': '35,110', height: 100, soft: 30 }, 260, 40],                                                                   // 18
      ['ellipse', { size: 80, '~size': '50,95', height: 100, rings: 1, line: 30, soft: 40 }, 260, 150],                                               // 19
      ['ellipse', { size: 110, '~size': '60,160', height: 36, soft: 40, angle: 30 }, 260, 260],                                                       // 20
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 21
      ['random', { lo: 0, hi: 100 }, 40, 2020],                                                                                                       // 22
      ['mapswitch', { soft: 0 }, 480, 40],                                                                                                            // 23
      ['levels', { lo: 10, hi: 60, gamma: 50 }, 700, 40],                                                                                             // 24
      ['grow', { amount: 60, radius: 25 }, 920, 40],                                                                                                  // 25
      ['perlin', { scale: 80, details: 4, rough: 55, contrast: 25 }, 40, 2130],                                                                       // 26
      ['maprange', { outLo: 42, outHi: 58 }, 260, 370],                                                                                               // 27
      ['gradmap', { stops: 3 }, 480, 150],                                                                                                            // 28
      ['mix', { t: 20 }, 260, 480],                                                                                                                   // 29
      ['mix', { t: 15 }, 260, 590],                                                                                                                   // 30
      ['polar', { rings: 6, turn: 0 }, 260, 700],                                                                                                     // 31
      ['waves', { freq: 18, angle: 0 }, 40, 2240],                                                                                                    // 32
      ['gradmap', { stops: 3 }, 480, 260],                                                                                                            // 33
      ['mix', { t: 30 }, 260, 810],                                                                                                                   // 34
      ['mix', { t: 20 }, 260, 920],                                                                                                                   // 35
      ['maprange', { outLo: 0, outHi: 100 }, 260, 1030],                                                                                              // 36
      ['math', { op: 'subtract' }, 1140, 40],                                                                                                         // 37
      ['number', { value: 34 }, 40, 2350],                                                                                                            // 38
      ['math', { op: 'less' }, 260, 1140],                                                                                                            // 39
      ['math', { op: 'multiply' }, 480, 370],                                                                                                         // 40
      ['math', { op: 'multiply' }, 1360, 40],                                                                                                         // 41
      ['blend', { mode: 'normal', opacity: 100 }, 1580, 40],                                                                                          // 42
      ['bloom', { part: 90, sheet: 100, stage: 40, size: 110, variant: 4 }, 260, 1250],                                                               // 43
      ['bloom', { species: 88, view: 10, stage: 50, sheet: 100, stem: 0, size: 80, jitter: 50, variant: 5 }, 260, 1360],                              // 44
      ['bloom', { species: 41, view: 8, '~view': '0,40', stage: 45, '~stage': '25,65', sheet: 100, stem: 0, jitter: 40, variant: 1 }, 260, 1470],     // 45
      ['random', { lo: 0, hi: 100 }, 40, 2460],                                                                                                       // 46
      ['random', { lo: 0, hi: 100 }, 40, 2570],                                                                                                       // 47
      ['bloom', { species: 43, view: 12, stage: 50, sheet: 100, stem: 0, jitter: 40, variant: 2 }, 260, 1580],                                        // 48
      ['scatter', { shape: 'picture', ground: 'black is clear', vary: 45, turn: 100, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 16', count: 40, '~count': '0,120', size: 40, big: 200, clump: 30 }, 1140, 150],// 49
      ['scatter', { shape: 'picture', ground: 'black is clear', vary: 45, turn: 100, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 16', count: 30, '~count': '0,90', size: 30, big: 200, clump: 40 }, 920, 150],// 50
      ['scatter', { shape: 'picture', ground: 'black is clear', vary: 45, turn: 100, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 16', count: 8, '~count': '2,22', size: 45, big: 250, clump: 20 }, 920, 260],// 51
      ['scatter', { shape: 'picture', ground: 'black is clear', vary: 45, turn: 100, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 16', count: 10, '~count': '3,26', size: 55, big: 250, clump: 20 }, 920, 370],// 52
      ['blend', { mode: 'normal', opacity: 100 }, 1800, 40],                                                                                          // 53
      ['blend', { mode: 'normal', opacity: 100 }, 2020, 40],                                                                                          // 54
      ['blend', { mode: 'normal', opacity: 100 }, 2240, 40],                                                                                          // 55
      ['blend', { mode: 'normal', opacity: 100 }, 2460, 40],                                                                                          // 56
      ['blur', { radius: 2 }, 2020, 150],                                                                                                             // 57
      ['number', { value: 35 }, 40, 2680],                                                                                                            // 58
      ['math', { op: 'multiply' }, 1360, 150],                                                                                                        // 59
      ['number', { value: 50 }, 40, 2790],                                                                                                            // 60
      ['math', { op: 'multiply' }, 1140, 260],                                                                                                        // 61
      ['math', { op: 'max' }, 1580, 150],                                                                                                             // 62
      ['number', { value: 75 }, 40, 2900],                                                                                                            // 63
      ['math', { op: 'multiply' }, 1140, 370],                                                                                                        // 64
      ['number', { value: 90 }, 40, 3010],                                                                                                            // 65
      ['math', { op: 'multiply' }, 1140, 480],                                                                                                        // 66
      ['math', { op: 'max' }, 1360, 260],                                                                                                             // 67
      ['math', { op: 'max' }, 1800, 150],                                                                                                             // 68
      ['material', { relief: 45, '~relief': '0,90', gloss: 20, shine: 25, shadow: 65, occlusion: 55, ambient: 40 }, 2680, 40],                        // 69
      ['surface', { name: 'Bouquets', ground: 'colour' }, 2900, 40]],                                                                                 // 70
    wires: [[16, 1, 18, 'x'], [17, 1, 18, 'y'], [4, 1, 18, 'size'],
      [4, 1, 19, 'size'], [21, 1, 20, 'angle'], [16, 1, 20, 'x'],
      [17, 1, 20, 'y'], [4, 1, 20, 'size'], [22, 1, 23, 1], [18, 1, 23, 2], [19, 1, 23, 3], [20, 1, 23, 4],
      [23, 1, 24, 1], [24, 1, 25, 1], [26, 1, 27, 1], [27, 1, 28, 1], [10, 1, 29, 1], [14, 1, 29, 2], [29, 1, 28, 2], [10, 1, 28, 3], [10, 1, 30, 1],
      [15, 1, 30, 2], [30, 1, 28, 4], [32, 1, 31, 1], [31, 1, 33, 1], [15, 1, 34, 1], [10, 1, 34, 2], [34, 1, 33, 2], [15, 1, 33, 3], [15, 1, 35, 1],
      [13, 1, 35, 2], [35, 1, 33, 4], [8, 1, 36, 1], [25, 1, 37, 1], [24, 1, 37, 2], [22, 1, 39, 1], [38, 1, 39, 2], [39, 1, 40, 1], [36, 1, 40, 2],
      [37, 1, 41, 1], [40, 1, 41, 2], [28, 1, 42, 1], [33, 1, 42, 2], [41, 1, 42, 3], [9, 1, 43, 1], [14, 1, 43, 2], [14, 1, 43, 5], [9, 1, 44, 1],
      [13, 1, 44, 2], [14, 1, 44, 5], [9, 1, 45, 1], [11, 1, 45, 2], [14, 1, 45, 5], [1, 1, 45, 'species'],
      [46, 1, 45, 'view'], [47, 1, 45, 'stage'], [9, 1, 48, 1], [12, 1, 48, 2], [14, 1, 48, 5],
      [2, 1, 48, 'species'], [43, 1, 49, 1], [25, 1, 49, 2], [5, 1, 49, 'count'], [44, 1, 50, 1], [24, 1, 50, 2],
      [6, 1, 50, 'count'], [48, 1, 51, 1], [24, 1, 51, 2], [3, 1, 51, 'count'], [45, 1, 52, 1], [24, 1, 52, 2],
      [3, 1, 52, 'count'], [42, 1, 53, 1], [49, 4, 53, 2], [49, 1, 53, 3], [53, 1, 54, 1], [50, 4, 54, 2], [50, 1, 54, 3],
      [54, 1, 55, 1], [51, 4, 55, 2], [51, 1, 55, 3], [55, 1, 56, 1], [52, 4, 56, 2], [52, 1, 56, 3], [49, 1, 59, 1], [58, 1, 59, 2], [50, 1, 61, 1],
      [60, 1, 61, 2], [59, 1, 62, 1], [61, 1, 62, 2], [51, 1, 64, 1], [63, 1, 64, 2], [52, 1, 66, 1], [65, 1, 66, 2], [64, 1, 67, 1], [66, 1, 67, 2],
      [62, 1, 68, 1], [67, 1, 68, 2], [68, 1, 57, 1], [56, 1, 69, 1], [57, 1, 69, 2], [9, 1, 69, 7], [7, 1, 69, 'relief'],
      [69, 1, 70, 1]] },
  petals: { label: 'Fallen Petals', div: 2, teach: 'Flowers past their best (docs/prior-art/florals.md §5), as the vanitas painters showed them: heads drooping and browning, petals fallen round them, fresh ones beside aged ones. Bloom draws a sheet of wilted flowers (Wilting their stage) and a sheet of single petals, in the Petal Hue ageing to the Aged Petal Hue; Scatters throw the flowers (Fallen Flowers) and, clumped round them, the petals. They lie on wood, linen or stone, the seed’s (a Map Switch of Waves warped by noise, Canvas Weave, Perlin Noise; Surface how much it shows); their heights go to the Light Engine, which casts their shadows from the dial (Shadow). Try: Wilting high and Petals high, the dial low.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                       // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                  // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                     // 3
      ['knob', { slot: '4' }, 40, 370],                                                                              // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                    // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                      // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                     // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                     // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Surface Hue' }, 40, 1030],                                                                                          // 10
      ['hue', { slot: '2', name: 'Petal Hue' }, 40, 1140],                                                                                            // 11
      ['hue', { slot: '3', name: 'Aged Petal Hue' }, 40, 1250],                                                                                       // 12
      ['hue', { slot: '4', name: 'Center Hue' }, 40, 1360],                                                                                           // 13
      ['hue', { slot: '5', name: 'Leaf Hue' }, 40, 1470],                                                                                             // 14
      ['hue', { slot: '6', name: 'Light Hue' }, 40, 1580],                                                                                            // 15
      ['waves', { freq: 30, '~freq': '14,60', angle: 90 }, 260, 40],                                                                                  // 16
      ['random', { lo: 0, hi: 100 }, 40, 1690],                                                                                                       // 17
      ['warp', { amount: 30 }, 480, 40],                                                                                                              // 18
      ['perlin', { scale: 6, details: 3 }, 40, 1800],                                                                                                 // 19
      ['canvasweave', { size: 60 }, 40, 1910],                                                                                                        // 20
      ['perlin', { scale: 30, details: 6, rough: 60, contrast: 30 }, 40, 2020],                                                                       // 21
      ['mapswitch', { soft: 0 }, 700, 40],                                                                                                            // 22
      ['random', { lo: 0, hi: 100 }, 40, 2130],                                                                                                       // 23
      ['maprange', { outLo: 40, outHi: 60, '~outLo': '50,15', '~outHi': '50,85' }, 920, 40],                                                          // 24
      ['gradmap', { stops: 3 }, 1140, 40],                                                                                                            // 25
      ['mix', { t: 35 }, 260, 150],                                                                                                                   // 26
      ['mix', { t: 40 }, 260, 260],                                                                                                                   // 27
      ['bloom', { species: 41, stage: 75, '~stage': '55,100', view: 70, sheet: 34, stem: 100, jitter: 60, variant: 3 }, 260, 370],                    // 28
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 2, '~count': '0,6', size: 70, '~size': '45,95', big: 300, vary: 40, turn: 100, clump: 0, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 4' }, 480, 150],// 29
      ['random', { lo: 0, hi: 100 }, 40, 2240],                                                                                                       // 30
      ['bloom', { species: 41, part: 50, sheet: 100, stage: 60, '~stage': '20,95', jitter: 60, variant: 9 }, 260, 480],                               // 31
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 60, '~count': '5,320', size: 12, '~size': '6,30', big: 200, vary: 55, turn: 100, clump: 55, '~clump': '0,95', fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 16' }, 480, 260],// 32
      ['blend', { mode: 'normal', opacity: 100 }, 1360, 40],                                                                                          // 33
      ['blend', { mode: 'normal', opacity: 100 }, 1580, 40],                                                                                          // 34
      ['blur', { radius: 5 }, 1140, 150],                                                                                                             // 35
      ['number', { value: 70 }, 40, 2350],                                                                                                            // 36
      ['math', { op: 'multiply' }, 700, 150],                                                                                                         // 37
      ['number', { value: 45 }, 40, 2460],                                                                                                            // 38
      ['math', { op: 'multiply' }, 700, 260],                                                                                                         // 39
      ['math', { op: 'max' }, 920, 150],                                                                                                              // 40
      ['math', { op: 'max' }, 700, 370],                                                                                                              // 41
      ['math', { op: 'multiply' }, 1360, 150],                                                                                                        // 42
      ['material', { relief: 35, '~relief': '0,65', gloss: 12, shine: 18, shadow: 45, occlusion: 55, ambient: 50, translucency: 25 }, 1800, 40],      // 43
      ['surface', { name: 'Fallen Petals', ground: 'colour' }, 2020, 40]],                                                                            // 44
    wires: [[17, 1, 16, 'freq'], [16, 1, 18, 1], [19, 1, 18, 2], [23, 1, 22, 1], [18, 1, 22, 2], [20, 1, 22, 3], [21, 1, 22, 4], [22, 1, 24, 1],
      [7, 1, 24, 'outLo'], [7, 1, 24, 'outHi'], [24, 1, 25, 1], [10, 1, 26, 1], [13, 1, 26, 2], [26, 1, 25, 2],
      [10, 1, 25, 3], [10, 1, 27, 1], [15, 1, 27, 2], [27, 1, 25, 4], [9, 1, 28, 1], [11, 1, 28, 2], [12, 1, 28, 3], [13, 1, 28, 4], [14, 1, 28, 5],
      [8, 1, 28, 'species'], [3, 1, 28, 'stage'], [28, 1, 29, 1], [4, 1, 29, 'count'],
      [30, 1, 29, 'size'], [9, 1, 31, 1], [11, 1, 31, 2], [12, 1, 31, 3], [13, 1, 31, 4], [14, 1, 31, 5],
      [8, 1, 31, 'species'], [3, 1, 31, 'stage'], [31, 1, 32, 1], [1, 1, 32, 'count'],
      [2, 1, 32, 'size'], [5, 1, 32, 'clump'], [25, 1, 33, 1], [29, 4, 33, 2], [29, 1, 33, 3], [33, 1, 34, 1],
      [32, 4, 34, 2], [32, 1, 34, 3], [29, 1, 37, 1], [36, 1, 37, 2], [32, 1, 39, 1], [38, 1, 39, 2], [37, 1, 40, 1], [39, 1, 40, 2], [40, 1, 35, 1],
      [29, 1, 41, 1], [32, 1, 41, 2], [35, 1, 42, 1], [41, 1, 42, 2], [34, 1, 43, 1], [42, 1, 43, 2], [15, 1, 43, 6], [9, 1, 43, 7],
      [6, 1, 43, 'relief'], [43, 1, 44, 1]] },
  meadow: { label: 'Idyllic Meadow', div: 2, teach: 'A meadow on a summer day (docs/prior-art/florals.md §6), after Monet’s and Van Gogh’s poppy fields and Kazuo Oga’s soft greens: a high warm sky of cumulus, rolling land fading into the distance, grass leaning with one wind, flowers near and far, petals in the air. The Light Dial is the sun: it lights the clouds (Simple Lighting on their blurred shape), the grass blades, every flower, and a warm glow where it stands. The land is a Threshold of a Gradient raised by a broad noise (Horizon); its colour runs from the far land’s hue, faded toward the sky, to the grass’s. Grass is a Scatter of dashes leaning with the seed’s wind, larger near; far flowers are clumped dabs; near ones are two of Bloom’s sheets (the Species slider’s, and a habitat’s mix in the second hue) thrown larger nearer, the largest on top; petals are diamonds smeared along the wind (Wind). Now and then (about one seed in six) a Fairy Light drifts over the grass. Try: the dial low behind the field.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                      // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                       // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                        // 3
      ['knob', { slot: '4' }, 40, 370],                                                                           // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                     // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                      // 6
      ['knob', { slot: '7' }, 40, 700],                                                                               // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                     // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Sky Hue' }, 40, 1030],                                                                                              // 10
      ['hue', { slot: '2', name: 'Far Land Hue' }, 40, 1140],                                                                                         // 11
      ['hue', { slot: '3', name: 'Grass Hue' }, 40, 1250],                                                                                            // 12
      ['hue', { slot: '4', name: 'Flower Hue' }, 40, 1360],                                                                                           // 13
      ['hue', { slot: '5', name: 'Second Flower Hue' }, 40, 1470],                                                                                    // 14
      ['hue', { slot: '6', name: 'Sunlight Hue' }, 40, 1580],                                                                                         // 15
      ['gradient', { shape: 'linear', angle: 90 }, 40, 1690],                                                                                         // 16
      ['perlin', { scale: 6, '~scale': '3,12', details: 2, contrast: 30 }, 40, 1800],                                                                 // 17
      ['maprange', { outLo: 0, outHi: 14, '~outHi': '4,24' }, 260, 40],                                                                               // 18
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 19
      ['threshold', { at: 40, '~at': '22,62', soft: 2 }, 700, 40],                                                                                    // 20
      ['math', { op: 'add' }, 480, 40],                                                                                                               // 21
      ['levels', { lo: 40, '~lo': '22,62', hi: 100, gamma: 40 }, 260, 150],                                                                           // 22
      ['mix', { t: 45 }, 260, 260],                                                                                                                   // 23
      ['gradmap', { stops: 2 }, 480, 150],                                                                                                            // 24
      ['maprange', { outLo: 0, outHi: 100 }, 260, 370],                                                                                               // 25
      ['perlin', { scale: 7, '~scale': '4,12', details: 4, rough: 50, contrast: 35 }, 260, 480],                                                      // 26
      ['random', { lo: 0, hi: 100 }, 40, 2020],                                                                                                       // 27
      ['motionblur', { length: 40, '~length': '20,70', angle: 0 }, 480, 260],                                                                         // 28
      ['random', { lo: 0, hi: 100 }, 40, 2130],                                                                                                       // 29
      ['threshold', { at: 55, '~at': '80,35', soft: 40 }, 700, 150],                                                                                  // 30
      ['blur', { radius: 6 }, 920, 40],                                                                                                               // 31
      ['gradmap', { stops: 2 }, 480, 370],                                                                                                            // 32
      ['maprange', { outLo: 0, outHi: 100 }, 260, 590],                                                                                               // 33
      ['mix', { t: 30 }, 260, 700],                                                                                                                   // 34
      ['mix', { t: 35 }, 260, 810],                                                                                                                   // 35
      ['blend', { mode: 'normal', opacity: 70 }, 1140, 40],                                                                                           // 36
      ['gradmap', { stops: 3 }, 480, 480],                                                                                                            // 37
      ['mix', { t: 35 }, 260, 920],                                                                                                                   // 38
      ['mix', { t: 55 }, 260, 1030],                                                                                                                  // 39
      ['perlin', { scale: 60, details: 4, rough: 60, contrast: 30 }, 40, 2240],                                                                       // 40
      ['maprange', { outLo: 82, outHi: 100 }, 260, 1140],                                                                                             // 41
      ['waves', { freq: 9, '~freq': '5,16', angle: 90 }, 260, 1250],                                                                                  // 42
      ['random', { lo: 0, hi: 100 }, 40, 2350],                                                                                                       // 43
      ['warp', { amount: 25 }, 480, 590],                                                                                                             // 44
      ['perlin', { scale: 5, details: 2 }, 40, 2460],                                                                                                 // 45
      ['gradmap', { stops: 3 }, 700, 260],                                                                                                            // 46
      ['mix', { t: 45 }, 260, 1360],                                                                                                                  // 47
      ['mix', { t: 50 }, 260, 1470],                                                                                                                  // 48
      ['maprange', { inLo: 0, inHi: 55, outLo: 75, outHi: 0 }, 480, 700],                                                                             // 49
      ['blend', { mode: 'multiply', opacity: 100 }, 700, 370],                                                                                        // 50
      ['blend', { mode: 'normal', opacity: 80 }, 920, 150],                                                                                           // 51
      ['blend', { mode: 'normal', opacity: 100 }, 1360, 40],                                                                                          // 52
      ['perlin', { scale: 45, '~scale': '30,80', details: 4, rough: 60, contrast: 60 }, 40, 2570],                                                    // 53
      ['maprange', { outLo: 0, outHi: 6, '~outHi': '2,9' }, 260, 1580],                                                                               // 54
      ['random', { lo: 0, hi: 100 }, 40, 2680],                                                                                                       // 55
      ['threshold', { at: 34, '~at': '16,56', soft: 1 }, 920, 260],                                                                                   // 56
      ['math', { op: 'add' }, 480, 810],                                                                                                              // 57
      ['math', { op: 'add' }, 700, 480],                                                                                                              // 58
      ['mix', { t: 35 }, 260, 1690],                                                                                                                  // 59
      ['perlin', { scale: 40, details: 4, contrast: 50 }, 40, 2790],                                                                                  // 60
      ['maprange', { outLo: 55, outHi: 95 }, 260, 1800],                                                                                              // 61
      ['blend', { mode: 'multiply', opacity: 100 }, 480, 920],                                                                                        // 62
      ['blend', { mode: 'normal', opacity: 28 }, 700, 590],                                                                                           // 63
      ['math', { op: 'subtract' }, 1140, 150],                                                                                                        // 64
      ['blend', { mode: 'normal', opacity: 100 }, 1580, 40],                                                                                          // 65
      ['random', { lo: 17, hi: 33 }, 40, 2900],                                                                                                       // 66
      ['perlin', { scale: 30, details: 2 }, 40, 3010],                                                                                                // 67
      ['maprange', { outLo: 0, outHi: 8 }, 260, 1910],                                                                                                // 68
      ['math', { op: 'add' }, 480, 1030],                                                                                                             // 69
      ['scatter', { shape: 'dash', count: 220, '~count': '60,400', size: 14, vary: 70, turn: 12, fade: 40, clump: 30 }, 920, 370],                    // 70
      ['maprange', { outLo: 2, outHi: 16 }, 480, 1140],                                                                                               // 71
      ['light', { relief: 60, gloss: 30, shadow: 20 }, 1140, 260],                                                                                    // 72
      ['gradmap', { stops: 3 }, 1360, 150],                                                                                                           // 73
      ['mix', { t: 40 }, 260, 2020],                                                                                                                  // 74
      ['mix', { t: 45 }, 260, 2130],                                                                                                                  // 75
      ['blend', { mode: 'normal', opacity: 85 }, 1800, 40],                                                                                           // 76
      ['scatter', { shape: 'dot', count: 40, '~count': '3,90', size: 3, vary: 60, clump: 75, fade: 30 }, 1140, 370],                                  // 77
      ['maprange', { inLo: 0, inHi: 60, outLo: 100, outHi: 0 }, 480, 1250],                                                                           // 78
      ['math', { op: 'multiply' }, 920, 480],                                                                                                         // 79
      ['threshold', { at: 50, '~at': '20,80', soft: 0 }, 1360, 260],                                                                                  // 80
      ['math', { op: 'multiply' }, 1580, 150],                                                                                                        // 81
      ['blend', { mode: 'normal', opacity: 90 }, 2020, 40],                                                                                           // 82
      ['math', { op: 'subtract' }, 1580, 260],                                                                                                        // 83
      ['blend', { mode: 'normal', opacity: 90 }, 2240, 40],                                                                                           // 84
      ['bloom', { species: 0, view: 55, '~view': '35,80', stage: 45, '~stage': '35,60', sheet: 100, stem: 100, jitter: 45 }, 260, 2240],              // 85
      ['random', { lo: 0, hi: 100 }, 40, 3120],                                                                                                       // 86
      ['bloom', { species: 99, view: 60, stage: 50, sheet: 100, stem: 100, jitter: 45, variant: 7 }, 260, 2350],                                      // 87
      ['maprange', { inLo: 25, inHi: 100, outLo: 0, outHi: 100 }, 480, 1360],                                                                         // 88
      ['math', { op: 'multiply' }, 920, 590],                                                                                                         // 89
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 60, '~count': '6,140', size: 22, vary: 60, turn: 8, clump: 65, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 16' }, 1140, 480],// 90
      ['maprange', { inLo: 20, inHi: 100, outLo: 6, outHi: 100 }, 480, 1470],                                                                         // 91
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 30, '~count': '0,90', size: 22, vary: 60, turn: 8, clump: 65, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 16' }, 1140, 590],// 92
      ['maprange', { inLo: 20, inHi: 100, outLo: 6, outHi: 100 }, 480, 1580],                                                                         // 93
      ['blend', { mode: 'normal', opacity: 100 }, 2460, 40],                                                                                          // 94
      ['blend', { mode: 'normal', opacity: 100 }, 2680, 40],                                                                                          // 95
      ['scatter', { shape: 'dash', count: 70, '~count': '20,160', size: 70, '~size': '40,110', vary: 60, turn: 16, fade: 30, clump: 20, per: 'for the page' }, 700, 700],// 96
      ['maprange', { inLo: 70, inHi: 100, outLo: 0, outHi: 100 }, 480, 1690],                                                                         // 97
      ['blur', { radius: 4 }, 920, 700],                                                                                                              // 98
      ['mix', { t: 40 }, 260, 2460],                                                                                                                  // 99
      ['blend', { mode: 'normal', opacity: 85 }, 2900, 40],                                                                                           // 100
      ['dial', {}, 40, 3230],                                                                                                                         // 101
      ['math', { op: 'sine' }, 260, 2570],                                                                                                            // 102
      ['number', { value: 75 }, 40, 3340],                                                                                                            // 103
      ['math', { op: 'sine' }, 260, 2680],                                                                                                            // 104
      ['number', { value: 100 }, 40, 3450],                                                                                                           // 105
      ['math', { op: 'min' }, 260, 2790],                                                                                                             // 106
      ['ellipse', { size: 40, height: 100, soft: 100 }, 1140, 700],                                                                                   // 107
      ['math', { op: 'multiply' }, 480, 1800],                                                                                                        // 108
      ['number', { value: 50 }, 40, 3560],                                                                                                            // 109
      ['math', { op: 'subtract' }, 480, 1910],                                                                                                        // 110
      ['math', { op: 'multiply' }, 700, 810],                                                                                                         // 111
      ['math', { op: 'add' }, 920, 810],                                                                                                              // 112
      ['math', { op: 'multiply' }, 480, 2020],                                                                                                        // 113
      ['math', { op: 'subtract' }, 480, 2130],                                                                                                        // 114
      ['math', { op: 'multiply' }, 700, 920],                                                                                                         // 115
      ['math', { op: 'add' }, 920, 920],                                                                                                              // 116
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 0 }, 1360, 370],                                                                          // 117
      ['levels', { lo: 30, hi: 100, gamma: 30 }, 1580, 370],                                                                                          // 118
      ['maprange', { inLo: 0, inHi: 80, outLo: 100, outHi: 30 }, 260, 2900],                                                                          // 119
      ['math', { op: 'multiply' }, 1800, 150],                                                                                                        // 120
      ['blend', { mode: 'screen', opacity: 45 }, 3120, 40],                                                                                           // 121
      ['scatter', { shape: 'diamond', count: 60, '~count': '0,240', size: 5, vary: 70, turn: 30, clump: 40, fade: 20, per: 'for the page' }, 260, 3010],// 122
      ['motionblur', { length: 6, '~length': '0,20', angle: 20 }, 480, 2240],                                                                         // 123
      ['mix', { t: 35 }, 260, 3120],                                                                                                                  // 124
      ['blend', { mode: 'normal', opacity: 90 }, 3340, 40],                                                                                           // 125
      ['surface', { name: 'Idyllic Meadow', ground: 'colour' }, 3560, 40],                                                                            // 126
      ['fairy', { chance: 18, size: 100, y0: 55, y1: 85 }, 3450, 160]],                                                                                 // 127 (now and then a fairy over the grass)
    wires: [[17, 1, 18, 1], [19, 1, 18, 'outHi'], [16, 1, 21, 1], [18, 1, 21, 2], [21, 1, 20, 1], [5, 1, 20, 'at'],
      [16, 1, 22, 1], [5, 1, 22, 'lo'], [10, 1, 23, 1], [15, 1, 23, 2], [16, 1, 25, 1], [25, 1, 24, 1], [10, 1, 24, 2], [23, 1, 24, 3],
      [27, 1, 26, 'scale'], [26, 1, 28, 1], [29, 1, 28, 'length'], [28, 1, 30, 1],
      [6, 1, 30, 'at'], [30, 1, 31, 1], [16, 1, 33, 1], [33, 1, 32, 1], [10, 1, 34, 1], [15, 1, 34, 2], [34, 1, 32, 2], [15, 1, 35, 1],
      [10, 1, 35, 2], [35, 1, 32, 3], [24, 1, 36, 1], [32, 1, 36, 2], [31, 1, 36, 3], [22, 1, 37, 1], [11, 1, 38, 1], [10, 1, 38, 2], [38, 1, 37, 2],
      [11, 1, 39, 1], [12, 1, 39, 2], [39, 1, 37, 3], [12, 1, 37, 4], [40, 1, 41, 1], [43, 1, 42, 'freq'], [42, 1, 44, 1], [45, 1, 44, 2],
      [44, 1, 46, 1], [12, 1, 47, 1], [11, 1, 47, 2], [47, 1, 46, 2], [12, 1, 46, 3], [12, 1, 48, 1], [15, 1, 48, 2], [48, 1, 46, 4], [22, 1, 49, 1],
      [37, 1, 50, 1], [41, 1, 50, 2], [50, 1, 51, 1], [46, 1, 51, 2], [49, 1, 51, 3], [36, 1, 52, 1], [51, 1, 52, 2], [20, 1, 52, 3], [53, 1, 54, 1],
      [55, 1, 54, 'outHi'], [16, 1, 57, 1], [18, 1, 57, 2], [57, 1, 58, 1], [54, 1, 58, 2], [58, 1, 56, 1],
      [5, 1, 56, 'at'], [11, 1, 59, 1], [12, 1, 59, 2], [60, 1, 61, 1], [59, 1, 62, 1], [61, 1, 62, 2], [62, 1, 63, 1], [10, 1, 63, 2],
      [56, 1, 64, 1], [20, 1, 64, 2], [52, 1, 65, 1], [63, 1, 65, 2], [64, 1, 65, 3], [67, 1, 68, 1], [66, 1, 69, 1], [68, 1, 69, 2], [20, 1, 70, 2],
      [69, 1, 70, 3], [2, 1, 70, 'count'], [22, 1, 71, 1], [71, 1, 70, 'size'], [70, 2, 72, 1], [9, 1, 72, 2],
      [72, 1, 73, 1], [12, 1, 74, 1], [11, 1, 74, 2], [74, 1, 73, 2], [12, 1, 73, 3], [12, 1, 75, 1], [15, 1, 75, 2], [75, 1, 73, 4], [65, 1, 76, 1],
      [73, 1, 76, 2], [70, 1, 76, 3], [22, 1, 78, 1], [20, 1, 79, 1], [78, 1, 79, 2], [79, 1, 77, 2], [1, 1, 77, 'count'],
      [77, 3, 80, 1], [7, 1, 80, 'at'], [77, 1, 81, 1], [80, 1, 81, 2], [76, 1, 82, 1], [13, 1, 82, 2], [81, 1, 82, 3], [77, 1, 83, 1],
      [80, 1, 83, 2], [82, 1, 84, 1], [14, 1, 84, 2], [83, 1, 84, 3], [9, 1, 85, 1], [13, 1, 85, 2], [8, 1, 85, 'species'],
      [86, 1, 85, 'view'], [9, 1, 87, 1], [14, 1, 87, 2], [22, 1, 88, 1], [20, 1, 89, 1], [88, 1, 89, 2], [85, 1, 90, 1], [89, 1, 90, 2],
      [1, 1, 90, 'count'], [22, 1, 91, 1], [91, 1, 90, 'size'], [87, 1, 92, 1], [89, 1, 92, 2],
      [7, 1, 92, 'count'], [22, 1, 93, 1], [93, 1, 92, 'size'], [84, 1, 94, 1], [92, 4, 94, 2], [92, 1, 94, 3],
      [94, 1, 95, 1], [90, 4, 95, 2], [90, 1, 95, 3], [22, 1, 97, 1], [97, 1, 96, 2], [69, 1, 96, 3], [2, 1, 96, 'count'],
      [96, 1, 98, 1], [12, 1, 99, 1], [11, 1, 99, 2], [95, 1, 100, 1], [99, 1, 100, 2], [98, 1, 100, 3], [101, 1, 102, 1], [101, 1, 104, 1], [103, 1, 104, 2],
      [101, 2, 106, 1], [105, 1, 106, 2], [102, 1, 108, 1], [106, 1, 108, 2], [105, 1, 110, 1], [106, 1, 110, 2], [109, 1, 111, 1], [110, 1, 111, 2],
      [108, 1, 112, 1], [111, 1, 112, 2], [112, 1, 107, 'x'], [104, 1, 113, 1], [106, 1, 113, 2], [105, 1, 114, 1], [106, 1, 114, 2],
      [109, 1, 115, 1], [114, 1, 115, 2], [113, 1, 116, 1], [115, 1, 116, 2], [116, 1, 107, 'y'], [107, 2, 117, 1], [117, 1, 118, 1],
      [16, 1, 119, 1], [118, 1, 120, 1], [119, 1, 120, 2], [100, 1, 121, 1], [15, 1, 121, 2], [120, 1, 121, 3], [66, 1, 122, 3],
      [4, 1, 122, 'count'], [122, 1, 123, 1], [3, 1, 123, 'length'], [13, 1, 124, 1], [15, 1, 124, 2],
      [121, 1, 125, 1], [124, 1, 125, 2], [123, 1, 125, 3], [125, 1, 127, 1], [127, 1, 126, 1]] },
  macro: { label: 'Macro Bloom', div: 2, v: 5, teach: 'One flower close, through a real lens (docs/prior-art/florals.md §8e). The camera dial frames it: Zoom from the whole flower in its setting to its heart filling the page, View tips it from face-on to the side, Turn says which way it tips and sets it toward that side’s third. Bloom draws it as maps, unlit, and the Light Engine lights them from the light dial: its heights, gloss, Facing and thinness, so light comes through thin petals (Translucency). Everything is painted sharp beside a depth map (the lights and the wash behind farthest, more flowers of its kind, the flower, a flower near the lens), and one Lens Blur focuses the whole scene as a lens does: Aperture how wide it is open, Focus where the plane of focus lies (its middle on the flower). Points of light behind (Lights Behind) become discs. Dew drops are little lenses; pollen dusts the heart. Draw order is depth order, and the same depth gives the shadows: read as heights (nearer higher) and lit twice by the Light Engine, with its shadow march and without, their ratio is the cast shadow alone, as a depth buffer gives it; a leaf crossing near the lens shadows the petals, a visitor the petal it stands on. The seed says whether the flower has its stem, and whether a blade of grass or leaves stand between the sun and it: out of the frame only their shadow falls; in it they cross near the lens, blurred. Now and then an insect visits, small, on a petal, lit with the flower: Visitors says how often (rare at its default, never more than two). Try: Aperture high and Focus low, to see the flower melt.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                      // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                       // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                    // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                       // 4
      ['knob', { slot: '5' }, 40, 480],                                                                               // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                         // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                    // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['camdial', {}, 40, 1030],                                                                                                                      // 10
      ['hue', { slot: '1', name: 'Bokeh Hue' }, 40, 1140],                                                                                            // 11
      ['hue', { slot: '2', name: 'Visitor Hue' }, 40, 1250],                                                                                          // 12
      ['hue', { slot: '3', name: 'Petal Hue' }, 40, 1360],                                                                                            // 13
      ['hue', { slot: '4', name: 'Center Hue' }, 40, 1470],                                                                                           // 14
      ['hue', { slot: '5', name: 'Foliage Hue' }, 40, 1580],                                                                                          // 15
      ['hue', { slot: '6', name: 'Key Light Hue' }, 40, 1690],                                                                                        // 16
      ['math', { op: 'sine' }, 260, 40],                                                                                                              // 17
      ['number', { value: 25 }, 40, 1800],                                                                                                            // 18
      ['math', { op: 'sine' }, 260, 150],                                                                                                             // 19
      ['maprange', { outLo: 37, outHi: 63 }, 480, 40],                                                                                                // 20
      ['maprange', { outLo: 62, outHi: 38 }, 480, 150],                                                                                               // 21
      ['perlin', { scale: 4, '~scale': '2,7', details: 3, contrast: 55 }, 260, 260],                                                                  // 22
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 23
      ['blur', { radius: 6 }, 480, 260],                                                                                                              // 24
      ['gradmap', { stops: 3 }, 700, 40],                                                                                                             // 25
      ['mix', { t: 45 }, 260, 370],                                                                                                                   // 26
      ['mix', { t: 45 }, 260, 480],                                                                                                                   // 27
      ['bloom', { species: 27, view: 40, '~view': '10,85', stage: 45, '~stage': '20,85', sheet: 34, stem: 100, jitter: 60, variant: 5 }, 260, 590],   // 28
      ['random', { lo: 0, hi: 100 }, 40, 2020],                                                                                                       // 29
      ['random', { lo: 0, hi: 100 }, 40, 2130],                                                                                                       // 30
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 3, '~count': '0,6', size: 60, '~size': '40,90', big: 300, vary: 50, turn: 30, clump: 30, fade: 0, layers: 'largest', per: 'for the page', sheet: 'a sheet of 4' }, 480, 370],// 31
      ['random', { lo: 0, hi: 100 }, 40, 2240],                                                                                                       // 32
      ['random', { lo: 0, hi: 100 }, 40, 2350],                                                                                                       // 33
      ['blend', { mode: 'normal', opacity: 65 }, 700, 150],                                                                                           // 34
      ['blend', { mode: 'normal', opacity: 100 }, 920, 40],                                                                                           // 35
      ['scatter', { shape: 'dot', count: 30, '~count': '0,90', size: 7, vary: 60, turn: 0, clump: 60, fade: 10, per: 'for the page' }, 260, 700],     // 36
      ['threshold', { at: 55, soft: 0 }, 480, 480],                                                                                                   // 37
      ['mix', { t: 30 }, 260, 810],                                                                                                                   // 38
      ['math', { op: 'multiply' }, 700, 260],                                                                                                         // 39
      ['blend', { mode: 'screen', opacity: 100 }, 1140, 40],                                                                                          // 40
      ['mix', { t: 25 }, 260, 920],                                                                                                                   // 41
      ['number', { value: 100 }, 40, 2460],                                                                                                           // 42
      ['math', { op: 'subtract' }, 700, 370],                                                                                                         // 43
      ['math', { op: 'multiply' }, 920, 150],                                                                                                         // 44
      ['blend', { mode: 'screen', opacity: 100 }, 1360, 40],                                                                                          // 45
      ['bloom', { species: 27, view: 25, '~view': '0,100', stage: 45, size: 110, '~size': '45,300', stem: 0, '~stem': '0,100', jitter: 40, x: 50, y: 50, lit: 100, turn: 0, '~turn': '0,100' }, 700, 480],// 46
      ['random', { lo: 0, hi: 100 }, 40, 2570],                                                                                                       // 47
      ['maprange', { outLo: 8, outHi: 46 }, 260, 1030],                                                                                               // 48
      ['threshold', { at: 30, soft: 20 }, 1140, 150],                                                                                                 // 49
      ['blur', { radius: 6 }, 920, 260],                                                                                                              // 50
      ['maprange', { outLo: 100, outHi: 40 }, 260, 1140],                                                                                             // 51
      ['bloom', { species: 27, part: 100, size: 110, '~size': '45,300', x: 50, y: 50, lit: 100, visitor: 0, variant: 13 }, 1140, 260],                // 52
      ['mix', { t: 55 }, 260, 1250],                                                                                                                  // 53
      ['random', { lo: 0, hi: 100 }, 40, 2680],                                                                                                       // 54
      ['math', { op: 'sine' }, 260, 1360],                                                                                                            // 55
      ['maprange', { outLo: 40, outHi: 60 }, 920, 370],                                                                                               // 56
      ['math', { op: 'subtract' }, 700, 590],                                                                                                         // 57
      ['math', { op: 'add' }, 700, 700],                                                                                                              // 58
      ['math', { op: 'sine' }, 260, 1470],                                                                                                            // 59
      ['maprange', { outLo: 40, outHi: 60 }, 920, 480],                                                                                               // 60
      ['math', { op: 'subtract' }, 700, 810],                                                                                                         // 61
      ['math', { op: 'add' }, 700, 920],                                                                                                              // 62
      ['threshold', { at: 90, soft: 0 }, 480, 590],                                                                                                   // 63
      ['random', { lo: 0, hi: 100 }, 40, 2790],                                                                                                       // 64
      ['math', { op: 'multiply' }, 1360, 150],                                                                                                        // 65
      ['math', { op: 'multiply' }, 1580, 40],                                                                                                         // 66
      ['maprange', { outLo: 100, outHi: 75 }, 260, 1580],                                                                                             // 67
      ['bloom', { species: 27, part: 100, size: 110, '~size': '45,300', x: 50, y: 50, lit: 100, visitor: 0, variant: 31 }, 1140, 370],                // 68
      ['mix', { t: 55 }, 260, 1690],                                                                                                                  // 69
      ['random', { lo: 0, hi: 100 }, 40, 2900],                                                                                                       // 70
      ['math', { op: 'sine' }, 260, 1800],                                                                                                            // 71
      ['maprange', { outLo: 40, outHi: 60 }, 920, 590],                                                                                               // 72
      ['math', { op: 'subtract' }, 700, 1030],                                                                                                        // 73
      ['math', { op: 'add' }, 700, 1140],                                                                                                             // 74
      ['math', { op: 'sine' }, 260, 1910],                                                                                                            // 75
      ['maprange', { outLo: 40, outHi: 60 }, 920, 700],                                                                                               // 76
      ['math', { op: 'subtract' }, 700, 1250],                                                                                                        // 77
      ['math', { op: 'add' }, 700, 1360],                                                                                                             // 78
      ['threshold', { at: 90, soft: 0 }, 480, 700],                                                                                                   // 79
      ['random', { lo: 0, hi: 100 }, 40, 3010],                                                                                                       // 80
      ['math', { op: 'multiply' }, 1360, 260],                                                                                                        // 81
      ['math', { op: 'multiply' }, 1580, 150],                                                                                                        // 82
      ['math', { op: 'multiply' }, 1800, 40],                                                                                                         // 83
      ['math', { op: 'max' }, 2020, 40],                                                                                                              // 84
      ['material', { relief: 120, gloss: 30, shine: 45, shadow: 50, occlusion: 45, ambient: 32, translucency: 50, '~translucency': '0,100', second: 55, secondTurn: 180, secondHeight: 120 }, 3120, 40],// 85
      ['perlin', { scale: 70, '~scale': '45,110', details: 4, rough: 60, contrast: 40 }, 260, 2020],                                                  // 86
      ['random', { lo: 0, hi: 100 }, 40, 3120],                                                                                                       // 87
      ['maprange', { outLo: 0, outHi: 8 }, 480, 810],                                                                                                 // 88
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 0 }, 920, 810],                                                                           // 89
      ['math', { op: 'multiply' }, 1140, 480],                                                                                                        // 90
      ['blend', { mode: 'normal', opacity: 100 }, 1800, 150],                                                                                         // 91
      ['blend', { mode: 'normal', opacity: 100 }, 2020, 150],                                                                                         // 92
      ['math', { op: 'subtract' }, 1800, 260],                                                                                                        // 93
      ['math', { op: 'multiply' }, 2020, 260],                                                                                                        // 94
      ['math', { op: 'multiply' }, 1800, 370],                                                                                                        // 95
      ['math', { op: 'add' }, 2240, 40],                                                                                                              // 96
      ['math', { op: 'subtract' }, 2020, 370],                                                                                                        // 97
      ['math', { op: 'multiply' }, 2460, 40],                                                                                                         // 98
      ['math', { op: 'multiply' }, 2020, 480],                                                                                                        // 99
      ['math', { op: 'add' }, 2680, 40],                                                                                                              // 100
      ['math', { op: 'multiply' }, 920, 920],                                                                                                         // 101
      ['math', { op: 'add' }, 1140, 590],                                                                                                             // 102
      ['math', { op: 'multiply' }, 1800, 480],                                                                                                        // 103
      ['math', { op: 'multiply' }, 2020, 590],                                                                                                        // 104
      ['math', { op: 'add' }, 2240, 150],                                                                                                             // 105
      ['math', { op: 'add' }, 2460, 150],                                                                                                             // 106
      ['math', { op: 'subtract' }, 1800, 590],                                                                                                        // 107
      ['math', { op: 'multiply' }, 2020, 700],                                                                                                        // 108
      ['math', { op: 'multiply' }, 1800, 700],                                                                                                        // 109
      ['math', { op: 'add' }, 2240, 260],                                                                                                             // 110
      ['math', { op: 'subtract' }, 2020, 810],                                                                                                        // 111
      ['math', { op: 'multiply' }, 2460, 260],                                                                                                        // 112
      ['math', { op: 'multiply' }, 2020, 920],                                                                                                        // 113
      ['math', { op: 'add' }, 2680, 150],                                                                                                             // 114
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 0 }, 1360, 370],                                                                          // 115
      ['math', { op: 'subtract' }, 1800, 810],                                                                                                        // 116
      ['math', { op: 'multiply' }, 2020, 1030],                                                                                                       // 117
      ['math', { op: 'multiply' }, 1800, 920],                                                                                                        // 118
      ['math', { op: 'add' }, 2240, 370],                                                                                                             // 119
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 0 }, 1360, 480],                                                                          // 120
      ['math', { op: 'subtract' }, 2020, 1140],                                                                                                       // 121
      ['math', { op: 'multiply' }, 2460, 370],                                                                                                        // 122
      ['math', { op: 'multiply' }, 2020, 1250],                                                                                                       // 123
      ['math', { op: 'add' }, 2680, 260],                                                                                                             // 124
      ['blend', { mode: 'multiply', opacity: 100 }, 2900, 40],                                                                                        // 125
      ['math', { op: 'multiply' }, 2900, 150],                                                                                                        // 126
      ['blur', { radius: 1 }, 2460, 480],                                                                                                             // 127
      ['math', { op: 'max' }, 2240, 480],                                                                                                             // 128
      ['blend', { mode: 'normal', opacity: 100 }, 3340, 40],                                                                                          // 129
      ['dial', {}, 40, 3230],                                                                                                                         // 130
      ['math', { op: 'sine' }, 260, 2130],                                                                                                            // 131
      ['math', { op: 'sine' }, 260, 2240],                                                                                                            // 132
      ['scatter', { shape: 'dash', count: 1, '~count': '0,3', size: 160, '~size': '90,240', vary: 40, turn: 100, clump: 0, fade: 0, per: 'for the page' }, 260, 2350],// 133
      ['random', { lo: 0, hi: 100 }, 40, 3340],                                                                                                       // 134
      ['random', { lo: 0, hi: 100 }, 40, 3450],                                                                                                       // 135
      ['bloom', { species: 27, part: 70, sheet: 34, stage: 40, jitter: 60, variant: 21 }, 260, 2460],                                                 // 136
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 3, '~count': '0,6', size: 80, '~size': '50,110', big: 300, vary: 50, turn: 100, clump: 50, fade: 0, per: 'for the page', sheet: 'a sheet of 4' }, 480, 920],// 137
      ['random', { lo: 0, hi: 100 }, 40, 3560],                                                                                                       // 138
      ['mapswitch', { soft: 0 }, 920, 1030],                                                                                                          // 139
      ['random', { lo: 0, hi: 100 }, 40, 3670],                                                                                                       // 140
      ['number', { value: 0 }, 40, 3780],                                                                                                             // 141
      ['math', { op: 'max' }, 700, 1470],                                                                                                             // 142
      ['threshold', { at: 68, soft: 0 }, 260, 2570],                                                                                                  // 143
      ['random', { lo: 0, hi: 100 }, 40, 3890],                                                                                                       // 144
      ['math', { op: 'subtract' }, 480, 1030],                                                                                                        // 145
      ['offset', { x: 0, y: 0, '~x': '-7,7', '~y': '-7,7' }, 1140, 700],                                                                              // 146
      ['blur', { radius: 22 }, 1360, 590],                                                                                                            // 147
      ['math', { op: 'multiply' }, 1580, 260],                                                                                                        // 148
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 50 }, 1800, 1030],                                                                        // 149
      ['blend', { mode: 'multiply', opacity: 100 }, 3560, 40],                                                                                        // 150
      ['math', { op: 'multiply' }, 1140, 810],                                                                                                        // 151
      ['scatter', { shape: 'dot', count: 30, '~count': '0,160', size: 3, '~size': '2,6', vary: 80, clump: 60, fade: 10, per: 'for the page' }, 920, 1140],// 152
      ['light', { relief: 90, gloss: 90, shadow: 40 }, 1140, 920],                                                                                    // 153
      ['offset', { x: 0, y: 0, '~x': '-1.4,1.4', '~y': '-1.4,1.4' }, 1140, 1030],                                                                     // 154
      ['blur', { radius: 2 }, 1580, 370],                                                                                                             // 155
      ['math', { op: 'subtract' }, 1360, 700],                                                                                                        // 156
      ['edges', { strength: 100 }, 1140, 1140],                                                                                                       // 157
      ['math', { op: 'multiply' }, 1800, 1140],                                                                                                       // 158
      ['blend', { mode: 'screen', opacity: 75 }, 3780, 40],                                                                                           // 159
      ['maprange', { inLo: 0, inHi: 40, outLo: 0, outHi: 60 }, 1360, 810],                                                                            // 160
      ['blend', { mode: 'multiply', opacity: 30 }, 4000, 40],                                                                                         // 161
      ['mix', { t: 30 }, 260, 2680],                                                                                                                  // 162
      ['maprange', { outLo: 0, outHi: 35 }, 1140, 1250],                                                                                              // 163
      ['blend', { mode: 'multiply', opacity: 100 }, 4220, 40],                                                                                        // 164
      ['math', { op: 'multiply' }, 1360, 920],                                                                                                        // 165
      ['blend', { mode: 'screen', opacity: 90 }, 4440, 40],                                                                                           // 166
      ['blur', { radius: 10 }, 920, 1250],                                                                                                            // 167
      ['scatter', { shape: 'dot', count: 80, '~count': '0,260', size: 1.5, '~size': '1,3', vary: 70, clump: 85, fade: 30, per: 'for the page' }, 1360, 1030],// 168
      ['maprange', { inLo: 0, inHi: 35, outLo: 0, outHi: 100 }, 1140, 1360],                                                                          // 169
      ['random', { lo: 0, hi: 100 }, 40, 4000],                                                                                                       // 170
      ['mix', { t: 55 }, 260, 2790],                                                                                                                  // 171
      ['blend', { mode: 'normal', opacity: 85 }, 4660, 40],                                                                                           // 172
      ['bloom', { species: 27, view: 20, '~view': '0,60', stage: 45, size: 260, '~size': '180,320', stem: 0, jitter: 50, x: 50, '~x': '0,100', y: 50, '~y': '0,100', variant: 9, lit: 0 }, 260, 2900],// 173
      ['random', { lo: 0, hi: 100 }, 40, 4110],                                                                                                       // 174
      ['random', { lo: 0, hi: 100 }, 40, 4220],                                                                                                       // 175
      ['random', { lo: 0, hi: 100 }, 40, 4330],                                                                                                       // 176
      ['random', { lo: 0, hi: 100 }, 40, 4440],                                                                                                       // 177
      ['threshold', { at: 55, soft: 0 }, 260, 3010],                                                                                                  // 178
      ['random', { lo: 0, hi: 100 }, 40, 4550],                                                                                                       // 179
      ['math', { op: 'multiply' }, 480, 1140],                                                                                                        // 180
      ['shape', { form: 'vignette', size: 100, soft: 60 }, 40, 4660],                                                                                 // 181
      ['maprange', { outLo: 100, outHi: 0 }, 260, 3120],                                                                                              // 182
      ['math', { op: 'multiply' }, 700, 1580],                                                                                                        // 183
      ['blend', { mode: 'normal', opacity: 100 }, 4880, 40],                                                                                          // 184
      ['mix', { t: 30 }, 260, 3230],                                                                                                                  // 185
      ['blend', { mode: 'normal', opacity: 95 }, 5100, 40],                                                                                           // 186
      ['math', { op: 'multiply' }, 1800, 1250],                                                                                                       // 187
      ['math', { op: 'add' }, 2020, 1360],                                                                                                            // 188
      ['maprange', { inLo: 0, inHi: 100, outLo: 42, outHi: 36 }, 2240, 590],                                                                          // 189
      ['number', { value: 78 }, 40, 4770],                                                                                                            // 190
      ['math', { op: 'subtract' }, 700, 1690],                                                                                                        // 191
      ['math', { op: 'multiply' }, 920, 1360],                                                                                                        // 192
      ['math', { op: 'multiply' }, 700, 1800],                                                                                                        // 193
      ['math', { op: 'add' }, 1140, 1470],                                                                                                            // 194
      ['math', { op: 'subtract' }, 2680, 370],                                                                                                        // 195
      ['math', { op: 'multiply' }, 2900, 260],                                                                                                        // 196
      ['math', { op: 'multiply' }, 2680, 480],                                                                                                        // 197
      ['math', { op: 'add' }, 3120, 150],                                                                                                             // 198
      ['number', { value: 4 }, 40, 4880],                                                                                                             // 199
      ['math', { op: 'subtract' }, 920, 1470],                                                                                                        // 200
      ['math', { op: 'multiply' }, 3340, 150],                                                                                                        // 201
      ['math', { op: 'multiply' }, 920, 1580],                                                                                                        // 202
      ['math', { op: 'add' }, 3560, 150],                                                                                                             // 203
      ['number', { value: 8 }, 40, 4990],                                                                                                             // 204
      ['math', { op: 'subtract' }, 1360, 1140],                                                                                                       // 205
      ['math', { op: 'multiply' }, 3780, 150],                                                                                                        // 206
      ['math', { op: 'multiply' }, 1360, 1250],                                                                                                       // 207
      ['math', { op: 'add' }, 4000, 150],                                                                                                             // 208
      ['blur', { radius: 2 }, 4440, 150],                                                                                                             // 209
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 0 }, 4220, 150],                                                                          // 210
      ['material', { relief: 200, gloss: 0, shine: 0, shadow: 100, occlusion: 0, ambient: 0 }, 4660, 150],                                            // 211
      ['material', { relief: 200, gloss: 0, shine: 0, shadow: 0, occlusion: 0, ambient: 0 }, 4660, 260],                                              // 212
      ['math', { op: 'divide' }, 4880, 150],                                                                                                          // 213
      ['threshold', { at: 35, soft: 6 }, 4440, 260],                                                                                                  // 214
      ['math', { op: 'subtract' }, 4220, 260],                                                                                                        // 215
      ['math', { op: 'subtract' }, 5100, 150],                                                                                                        // 216
      ['math', { op: 'multiply' }, 5320, 40],                                                                                                         // 217
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 42 }, 5540, 40],                                                                          // 218
      ['blend', { mode: 'multiply', opacity: 100 }, 5760, 40],                                                                                        // 219
      ['lensblur', { focus: 40, '~focus': '18,62', aperture: 60, size: 110, blades: 0, highlights: 100 }, 5980, 40],                                  // 220
      ['surface', { name: 'Macro Bloom', ground: 'colour' }, 6200, 40]],                                                                              // 221
    wires: [[10, 1, 17, 1], [10, 1, 19, 1], [18, 1, 19, 2], [17, 1, 20, 1], [19, 1, 21, 1], [23, 1, 22, 'scale'], [22, 1, 24, 1],
      [24, 1, 25, 1], [15, 1, 26, 1], [14, 1, 26, 2], [26, 1, 25, 2], [15, 1, 25, 3], [15, 1, 27, 1], [11, 1, 27, 2], [27, 1, 25, 4], [9, 1, 28, 1],
      [13, 1, 28, 2], [14, 1, 28, 4], [15, 1, 28, 5], [1, 1, 28, 'species'], [29, 1, 28, 'view'],
      [30, 1, 28, 'stage'], [28, 1, 31, 1], [32, 1, 31, 'count'], [33, 1, 31, 'size'],
      [15, 1, 34, 1], [31, 4, 34, 2], [25, 1, 35, 1], [34, 1, 35, 2], [31, 1, 35, 3], [5, 1, 36, 'count'], [36, 3, 37, 1],
      [11, 1, 38, 1], [16, 1, 38, 2], [36, 1, 39, 1], [37, 1, 39, 2], [35, 1, 40, 1], [38, 1, 40, 2], [39, 1, 40, 3], [16, 1, 41, 1], [11, 1, 41, 2],
      [42, 1, 43, 1], [37, 1, 43, 2], [36, 1, 44, 1], [43, 1, 44, 2], [40, 1, 45, 1], [41, 1, 45, 2], [44, 1, 45, 3], [9, 1, 46, 1], [13, 1, 46, 2],
      [14, 1, 46, 4], [15, 1, 46, 5], [1, 1, 46, 'species'], [2, 1, 46, 'stage'],
      [10, 3, 46, 'size'], [10, 2, 46, 'view'], [10, 1, 46, 'turn'],
      [20, 1, 46, 'x'], [21, 1, 46, 'y'], [47, 1, 46, 'stem'], [10, 3, 48, 1], [46, 2, 50, 1],
      [50, 1, 49, 1], [8, 1, 51, 1], [9, 1, 52, 1], [12, 1, 52, 2], [12, 1, 53, 1], [16, 1, 53, 2], [53, 1, 52, 3], [14, 1, 52, 4], [15, 1, 52, 5],
      [10, 3, 52, 'size'], [54, 1, 55, 1], [55, 1, 56, 1], [20, 1, 57, 1], [48, 1, 57, 2], [57, 1, 56, 'outLo'],
      [20, 1, 58, 1], [48, 1, 58, 2], [58, 1, 56, 'outHi'], [56, 1, 52, 'x'], [54, 1, 59, 1], [18, 1, 59, 2],
      [59, 1, 60, 1], [21, 1, 61, 1], [48, 1, 61, 2], [61, 1, 60, 'outLo'], [21, 1, 62, 1], [48, 1, 62, 2],
      [62, 1, 60, 'outHi'], [60, 1, 52, 'y'], [64, 1, 63, 1], [51, 1, 63, 'at'],
      [52, 2, 65, 1], [63, 1, 65, 2], [65, 1, 66, 1], [49, 1, 66, 2], [8, 1, 67, 1], [9, 1, 68, 1], [12, 1, 68, 2], [12, 1, 69, 1], [16, 1, 69, 2],
      [69, 1, 68, 3], [14, 1, 68, 4], [15, 1, 68, 5], [10, 3, 68, 'size'], [70, 1, 71, 1], [71, 1, 72, 1], [20, 1, 73, 1], [48, 1, 73, 2],
      [73, 1, 72, 'outLo'], [20, 1, 74, 1], [48, 1, 74, 2], [74, 1, 72, 'outHi'],
      [72, 1, 68, 'x'], [70, 1, 75, 1], [18, 1, 75, 2], [75, 1, 76, 1], [21, 1, 77, 1], [48, 1, 77, 2],
      [77, 1, 76, 'outLo'], [21, 1, 78, 1], [48, 1, 78, 2], [78, 1, 76, 'outHi'],
      [76, 1, 68, 'y'], [80, 1, 79, 1], [67, 1, 79, 'at'], [68, 2, 81, 1], [79, 1, 81, 2], [81, 1, 82, 1],
      [49, 1, 82, 2], [82, 1, 83, 1], [63, 1, 83, 2], [66, 1, 84, 1], [83, 1, 84, 2], [87, 1, 86, 'scale'], [86, 1, 88, 1],
      [46, 4, 89, 1], [89, 1, 90, 1], [46, 2, 90, 2], [46, 1, 91, 1], [52, 1, 91, 2], [66, 1, 91, 3], [91, 1, 92, 1], [68, 1, 92, 2], [83, 1, 92, 3],
      [42, 1, 93, 1], [66, 1, 93, 2], [46, 8, 94, 1], [93, 1, 94, 2], [52, 8, 95, 1], [66, 1, 95, 2], [94, 1, 96, 1], [95, 1, 96, 2], [42, 1, 97, 1],
      [83, 1, 97, 2], [96, 1, 98, 1], [97, 1, 98, 2], [68, 8, 99, 1], [83, 1, 99, 2], [98, 1, 100, 1], [99, 1, 100, 2], [88, 1, 101, 1], [46, 2, 101, 2],
      [46, 3, 102, 1], [101, 1, 102, 2], [52, 3, 103, 1], [66, 1, 103, 2], [68, 3, 104, 1], [83, 1, 104, 2], [103, 1, 105, 1], [104, 1, 105, 2],
      [102, 1, 106, 1], [105, 1, 106, 2], [42, 1, 107, 1], [66, 1, 107, 2], [46, 7, 108, 1], [107, 1, 108, 2], [52, 7, 109, 1], [66, 1, 109, 2],
      [108, 1, 110, 1], [109, 1, 110, 2], [42, 1, 111, 1], [83, 1, 111, 2], [110, 1, 112, 1], [111, 1, 112, 2], [68, 7, 113, 1], [83, 1, 113, 2],
      [112, 1, 114, 1], [113, 1, 114, 2], [52, 4, 115, 1], [42, 1, 116, 1], [66, 1, 116, 2], [90, 1, 117, 1], [116, 1, 117, 2], [115, 1, 118, 1],
      [66, 1, 118, 2], [117, 1, 119, 1], [118, 1, 119, 2], [68, 4, 120, 1], [42, 1, 121, 1], [83, 1, 121, 2], [119, 1, 122, 1], [121, 1, 122, 2],
      [120, 1, 123, 1], [83, 1, 123, 2], [122, 1, 124, 1], [123, 1, 124, 2], [92, 1, 125, 1], [100, 1, 125, 2], [125, 1, 85, 1], [106, 1, 85, 2],
      [114, 1, 85, 3], [16, 1, 85, 6], [9, 1, 85, 7], [124, 1, 126, 1], [7, 1, 126, 2], [126, 1, 85, 'translucency'], [46, 2, 128, 1],
      [84, 1, 128, 2], [128, 1, 127, 1], [45, 1, 129, 1], [85, 1, 129, 2], [127, 1, 129, 3], [130, 3, 131, 1], [18, 1, 131, 2], [130, 3, 132, 1],
      [134, 1, 133, 'count'], [135, 1, 133, 'size'], [9, 1, 136, 1], [15, 1, 136, 5], [136, 1, 137, 1],
      [138, 1, 137, 'count'], [140, 1, 139, 1], [141, 1, 139, 2], [133, 1, 139, 3], [137, 1, 139, 4], [133, 1, 142, 1], [137, 1, 142, 2],
      [142, 1, 139, 5], [144, 1, 143, 1], [42, 1, 145, 1], [143, 1, 145, 2], [139, 1, 146, 1], [131, 1, 146, 'x'],
      [132, 1, 146, 'y'], [146, 1, 147, 1], [147, 1, 148, 1], [145, 1, 148, 2], [148, 1, 149, 1], [129, 1, 150, 1], [149, 1, 150, 2],
      [127, 1, 150, 3], [139, 1, 151, 1], [143, 1, 151, 2], [46, 2, 152, 2], [6, 1, 152, 'count'], [152, 2, 153, 1], [9, 1, 153, 2],
      [152, 1, 154, 1], [131, 1, 154, 'x'], [132, 1, 154, 'y'], [154, 1, 156, 1], [152, 1, 156, 2], [156, 1, 155, 1],
      [152, 1, 157, 1], [155, 1, 158, 1], [46, 2, 158, 2], [150, 1, 159, 1], [16, 1, 159, 2], [158, 1, 159, 3], [157, 1, 160, 1], [159, 1, 161, 1],
      [14, 1, 161, 2], [160, 1, 161, 3], [13, 1, 162, 1], [15, 1, 162, 2], [152, 1, 163, 1], [161, 1, 164, 1], [162, 1, 164, 2], [163, 1, 164, 3],
      [153, 2, 165, 1], [152, 1, 165, 2], [164, 1, 166, 1], [16, 1, 166, 2], [165, 1, 166, 3], [46, 5, 167, 1], [167, 1, 169, 1], [169, 1, 168, 2],
      [170, 1, 168, 'count'], [14, 1, 171, 1], [16, 1, 171, 2], [166, 1, 172, 1], [171, 1, 172, 2], [168, 1, 172, 3], [9, 1, 173, 1],
      [13, 1, 173, 2], [14, 1, 173, 4], [15, 1, 173, 5], [1, 1, 173, 'species'], [174, 1, 173, 'view'],
      [175, 1, 173, 'size'], [176, 1, 173, 'x'], [177, 1, 173, 'y'], [179, 1, 178, 1],
      [173, 2, 180, 1], [178, 1, 180, 2], [181, 1, 182, 1], [180, 1, 183, 1], [182, 1, 183, 2], [172, 1, 184, 1], [173, 1, 184, 2], [183, 1, 184, 3],
      [15, 1, 185, 1], [14, 1, 185, 2], [184, 1, 186, 1], [185, 1, 186, 2], [151, 1, 186, 3], [52, 3, 187, 1], [66, 1, 187, 2], [46, 3, 188, 1],
      [187, 1, 188, 2], [188, 1, 189, 1], [42, 1, 191, 1], [31, 1, 191, 2], [42, 1, 192, 1], [191, 1, 192, 2], [190, 1, 193, 1], [31, 1, 193, 2],
      [192, 1, 194, 1], [193, 1, 194, 2], [42, 1, 195, 1], [127, 1, 195, 2], [194, 1, 196, 1], [195, 1, 196, 2], [189, 1, 197, 1], [127, 1, 197, 2],
      [196, 1, 198, 1], [197, 1, 198, 2], [42, 1, 200, 1], [183, 1, 200, 2], [198, 1, 201, 1], [200, 1, 201, 2], [199, 1, 202, 1], [183, 1, 202, 2],
      [201, 1, 203, 1], [202, 1, 203, 2], [42, 1, 205, 1], [151, 1, 205, 2], [203, 1, 206, 1], [205, 1, 206, 2], [204, 1, 207, 1], [151, 1, 207, 2],
      [206, 1, 208, 1], [207, 1, 208, 2], [208, 1, 210, 1], [210, 1, 209, 1], [42, 1, 211, 1], [209, 1, 211, 2], [9, 1, 211, 7], [42, 1, 212, 1],
      [209, 1, 212, 2], [9, 1, 212, 7], [211, 2, 213, 1], [212, 2, 213, 2], [42, 1, 215, 1], [208, 1, 215, 2], [215, 1, 214, 1], [42, 1, 216, 1],
      [213, 1, 216, 2], [216, 1, 217, 1], [214, 1, 217, 2], [217, 1, 218, 1], [186, 1, 219, 1], [218, 1, 219, 2], [219, 1, 220, 1], [208, 1, 220, 2],
      [3, 1, 220, 'aperture'], [4, 1, 220, 'focus'], [220, 1, 221, 1]] },
  ditsy: { label: 'Ditsy Print', div: 2, teach: 'A small floral print all over cloth, as the cotton day dresses of the 1930s and Liberty’s Tana Lawn have it (docs/prior-art/florals.md §8): tiny flowers at random, never in rows, a sprig of leaf between. Bloom draws a sheet of sixteen heads face on and pressed flat (a print has no depth), once in each of three colours; Scatter throws each sheet over the cloth (Flowers, Flower Size, Clustering, Turn), cut out by black; Colors says how many of the three print, and a Threshold of it lets the second and third in. Bloom’s single leaves are the sprigs. Canvas Weave, through a Map Range, gives the cloth its weave (Cloth). Try: a dark ground and Colors high.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                      // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                 // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                      // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                      // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                       // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                  // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                        // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                     // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Ground Hue' }, 40, 1030],                                                                                           // 10
      ['hue', { slot: '2', name: 'Flower Hue' }, 40, 1140],                                                                                           // 11
      ['hue', { slot: '3', name: 'Second Flower Hue' }, 40, 1250],                                                                                    // 12
      ['hue', { slot: '4', name: 'Third Flower Hue' }, 40, 1360],                                                                                     // 13
      ['hue', { slot: '5', name: 'Center Hue' }, 40, 1470],                                                                                           // 14
      ['hue', { slot: '6', name: 'Sprig Hue' }, 40, 1580],                                                                                            // 15
      ['canvasweave', { pitch: 70, '~pitch': '45,120' }, 260, 40],                                                                                    // 16
      ['random', { lo: 0, hi: 100 }, 40, 1690],                                                                                                       // 17
      ['maprange', { outLo: 92, outHi: 100, '~outLo': '100,72' }, 480, 40],                                                                           // 18
      ['blend', { mode: 'multiply', opacity: 100 }, 700, 40],                                                                                         // 19
      ['bloom', { species: 98, view: 0, flat: 100, stage: 50, '~stage': '30,65', sheet: 100, stem: 0, jitter: 55, variant: 1 }, 260, 150],            // 20
      ['random', { lo: 0, hi: 100 }, 40, 1800],                                                                                                       // 21
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 160, '~count': '10,350', size: 26, '~size': '12.0,48.0', vary: 35, turn: 70, clump: 30, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 16' }, 480, 150],// 22
      ['bloom', { species: 98, view: 0, flat: 100, stage: 50, '~stage': '30,65', sheet: 100, stem: 0, jitter: 55, variant: 2 }, 260, 260],            // 23
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 24
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 160, '~count': '6,210', size: 26, '~size': '12.0,48.0', vary: 35, turn: 70, clump: 30, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 16' }, 480, 260],// 25
      ['bloom', { species: 98, view: 0, flat: 100, stage: 50, '~stage': '30,65', sheet: 100, stem: 0, jitter: 55, variant: 3 }, 260, 370],            // 26
      ['random', { lo: 0, hi: 100 }, 40, 2020],                                                                                                       // 27
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 160, '~count': '4,140', size: 26, '~size': '12.0,48.0', vary: 35, turn: 70, clump: 30, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 16' }, 480, 370],// 28
      ['threshold', { at: 33, soft: 0 }, 260, 480],                                                                                                   // 29
      ['threshold', { at: 66, soft: 0 }, 260, 590],                                                                                                   // 30
      ['bloom', { species: 0, part: 70, sheet: 100, stage: 40, jitter: 50, variant: 4 }, 260, 700],                                                   // 31
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 80, '~count': '0,300', size: 20, '~size': '10,36', vary: 40, turn: 100, clump: 30, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 16' }, 480, 480],// 32
      ['blend', { mode: 'normal', opacity: 100 }, 920, 40],                                                                                           // 33
      ['math', { op: 'multiply' }, 700, 150],                                                                                                         // 34
      ['blend', { mode: 'normal', opacity: 100 }, 1140, 40],                                                                                          // 35
      ['math', { op: 'multiply' }, 700, 260],                                                                                                         // 36
      ['blend', { mode: 'normal', opacity: 100 }, 1360, 40],                                                                                          // 37
      ['blend', { mode: 'normal', opacity: 100 }, 1580, 40],                                                                                          // 38
      ['blend', { mode: 'multiply', opacity: 70 }, 1800, 40],                                                                                         // 39
      ['surface', { name: 'Ditsy Print', ground: 'colour' }, 2020, 40]],                                                                              // 40
    wires: [[17, 1, 16, 'pitch'], [16, 1, 18, 1], [5, 1, 18, 'outLo'], [10, 1, 19, 1], [18, 1, 19, 2],
      [9, 1, 20, 1], [11, 1, 20, 2], [11, 1, 20, 3], [14, 1, 20, 4], [15, 1, 20, 5], [8, 1, 20, 'species'],
      [21, 1, 20, 'stage'], [20, 1, 22, 1], [1, 1, 22, 'count'], [2, 1, 22, 'size'],
      [6, 1, 22, 'clump'], [7, 1, 22, 'turn'], [9, 1, 23, 1], [12, 1, 23, 2], [12, 1, 23, 3], [14, 1, 23, 4],
      [15, 1, 23, 5], [8, 1, 23, 'species'], [24, 1, 23, 'stage'], [23, 1, 25, 1],
      [1, 1, 25, 'count'], [2, 1, 25, 'size'], [6, 1, 25, 'clump'],
      [7, 1, 25, 'turn'], [9, 1, 26, 1], [13, 1, 26, 2], [13, 1, 26, 3], [14, 1, 26, 4], [15, 1, 26, 5],
      [8, 1, 26, 'species'], [27, 1, 26, 'stage'], [26, 1, 28, 1], [1, 1, 28, 'count'],
      [2, 1, 28, 'size'], [6, 1, 28, 'clump'], [7, 1, 28, 'turn'], [4, 1, 29, 1],
      [4, 1, 30, 1], [9, 1, 31, 1], [15, 1, 31, 5], [31, 1, 32, 1], [3, 1, 32, 'count'], [2, 1, 32, 'size'],
      [6, 1, 32, 'clump'], [19, 1, 33, 1], [32, 4, 33, 2], [32, 1, 33, 3], [28, 1, 34, 1], [30, 1, 34, 2], [33, 1, 35, 1],
      [28, 4, 35, 2], [34, 1, 35, 3], [25, 1, 36, 1], [29, 1, 36, 2], [35, 1, 37, 1], [25, 4, 37, 2], [36, 1, 37, 3], [37, 1, 38, 1], [22, 4, 38, 2],
      [22, 1, 38, 3], [38, 1, 39, 1], [18, 1, 39, 2], [39, 1, 40, 1]] },
  botline: { label: 'Botanical Line', div: 2, teach: 'Flowers drawn in a fine ink line, with a loose wash of colour or none (docs/prior-art/florals.md §8): the line art of a field guide’s margin, clean confident outlines, no shading, the paper left to breathe. Bloom draws a sheet of four whole plants from the side, stems and leaves; Scatter throws a few, large (Plants, Plant Size). Edges of the plants’ shape is the outline; edges of their colours (Detail) the lines between petals and leaves. Blur and Threshold set the pen (Line). The wash is the plants’ own colour, multiplied in under the line and slipped off it by an Offset (Wash, Wash Slip). Split HSB finds the green, so leaves and stems take the second ink. Try: Plants low, Plant Size high, Wash at nothing.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                       // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                  // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                        // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                      // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                        // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                   // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                       // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                     // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Paper Hue' }, 40, 1030],                                                                                            // 10
      ['hue', { slot: '2', name: 'Ink Hue' }, 40, 1140],                                                                                              // 11
      ['hue', { slot: '3', name: 'Petal Wash Hue' }, 40, 1250],                                                                                       // 12
      ['hue', { slot: '4', name: 'Center Wash Hue' }, 40, 1360],                                                                                      // 13
      ['hue', { slot: '5', name: 'Leaf Wash Hue' }, 40, 1470],                                                                                        // 14
      ['hue', { slot: '6', name: 'Second Ink Hue' }, 40, 1580],                                                                                       // 15
      ['perlin', { scale: 420, details: 4, rough: 60, contrast: 20 }, 40, 1690],                                                                      // 16
      ['maprange', { outLo: 97, outHi: 100, '~outLo': '100,90' }, 260, 40],                                                                           // 17
      ['blend', { mode: 'multiply', opacity: 100 }, 480, 40],                                                                                         // 18
      ['bloom', { species: 98, view: 70, '~view': '45,90', stage: 45, '~stage': '20,75', sheet: 34, stem: 100, jitter: 45, variant: 6 }, 260, 150],   // 19
      ['random', { lo: 0, hi: 100 }, 40, 1800],                                                                                                       // 20
      ['random', { lo: 0, hi: 100 }, 40, 1910],                                                                                                       // 21
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 4, '~count': '1,14', size: 60, '~size': '30,95', big: 300, vary: 35, turn: 25, '~turn': '0,60', clump: 20, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 4' }, 480, 150],// 22
      ['random', { lo: 0, hi: 100 }, 40, 2020],                                                                                                       // 23
      ['edges', { strength: 100 }, 700, 40],                                                                                                          // 24
      ['edges', { strength: 100 }, 700, 150],                                                                                                         // 25
      ['maprange', { inLo: 0, inHi: 60, outLo: 0, outHi: 60, '~outHi': '0,100' }, 920, 40],                                                           // 26
      ['maprange', { inLo: 0, inHi: 25, outLo: 0, outHi: 100 }, 920, 150],                                                                            // 27
      ['math', { op: 'max' }, 1140, 40],                                                                                                              // 28
      ['blur', { radius: 1, '~radius': '0,3' }, 1360, 40],                                                                                            // 29
      ['threshold', { at: 30, '~at': '45,12', soft: 25 }, 1580, 40],                                                                                  // 30
      ['offset', { x: 0, y: 0, '~x': '0,5', '~y': '0,4' }, 700, 260],                                                                                 // 31
      ['blur', { radius: 3 }, 920, 260],                                                                                                              // 32
      ['maprange', { outLo: 0, outHi: 40, '~outHi': '0,90' }, 1140, 150],                                                                             // 33
      ['blend', { mode: 'multiply', opacity: 100 }, 1360, 150],                                                                                       // 34
      ['splithsb', {}, 700, 370],                                                                                                                     // 35
      ['threshold', { at: 22, soft: 6 }, 1360, 260],                                                                                                  // 36
      ['maprange', { inLo: 20, inHi: 45, outLo: 0, outHi: 100 }, 920, 370],                                                                           // 37
      ['maprange', { inLo: 15, inHi: 40, outLo: 0, outHi: 100 }, 920, 480],                                                                           // 38
      ['math', { op: 'multiply' }, 1140, 260],                                                                                                        // 39
      ['blend', { mode: 'normal', opacity: 100 }, 1800, 40],                                                                                          // 40
      ['math', { op: 'multiply' }, 1800, 150],                                                                                                        // 41
      ['blend', { mode: 'normal', opacity: 100 }, 2020, 40],                                                                                          // 42
      ['surface', { name: 'Botanical Line', ground: 'colour' }, 2240, 40]],                                                                           // 43
    wires: [[16, 1, 17, 1], [7, 1, 17, 'outLo'], [10, 1, 18, 1], [17, 1, 18, 2], [9, 1, 19, 1], [12, 1, 19, 2], [12, 1, 19, 3],
      [13, 1, 19, 4], [14, 1, 19, 5], [8, 1, 19, 'species'], [20, 1, 19, 'view'],
      [21, 1, 19, 'stage'], [19, 1, 22, 1], [1, 1, 22, 'count'], [2, 1, 22, 'size'],
      [23, 1, 22, 'turn'], [22, 1, 24, 1], [22, 4, 25, 1], [25, 1, 26, 1], [4, 1, 26, 'outHi'], [24, 1, 27, 1],
      [27, 1, 28, 1], [26, 1, 28, 2], [28, 1, 29, 1], [3, 1, 29, 'radius'], [29, 1, 30, 1], [3, 1, 30, 'at'],
      [22, 1, 31, 1], [6, 1, 31, 'x'], [6, 1, 31, 'y'], [31, 1, 32, 1], [32, 1, 33, 1],
      [5, 1, 33, 'outHi'], [18, 1, 34, 1], [22, 4, 34, 2], [33, 1, 34, 3], [22, 4, 35, 1], [35, 1, 37, 1], [35, 2, 38, 1],
      [37, 1, 39, 1], [38, 1, 39, 2], [39, 1, 36, 1], [34, 1, 40, 1], [11, 1, 40, 2], [30, 1, 40, 3], [30, 1, 41, 1], [36, 1, 41, 2], [40, 1, 42, 1],
      [15, 1, 42, 2], [41, 1, 42, 3], [42, 1, 43, 1]] },
  windsea: { label: 'Windward Sea', div: 2, v: 5, teach: 'A sea and sky in the cel-shaded look of the great sailing games (docs/prior-art/cel-shaded.md): light in a few flat bands, never a gradient. The seed picks the weather (clear, fair, overcast, now and then a storm: a slate sky, a choppy sea, wind everywhere); Weather leans it fairer or stormier. The Light Engine lights the clouds’ and islands’ heights from the dial, and a Posterize of its light (Toon Bands) with a Gradient Map gives each band a hue: shadow, key, bright edge. The clouds are Scatter’s domes heaped above the horizon, curled by two Twirls (Swirls). The wind is not painted on the sky: Streamers sweeps ribbons through the scene, gusts that end in tightening curls, near ones large and far ones small, lit in the same bands, their back faces a shade darker (Wind). The sea is three colours: a Gradient Map of the depth, and foam in flattened rounds and the waves’ long lines, thrown smaller the farther they lie (Foam, Waves). Islands rise where a Perlin reaches above the horizon (Islands). The sun stands where the dial lays it, and sets into the sea as its height sinks. Now and then (about one seed in six) a Fairy Light drifts over the sea. Try: the dial low and behind, the Sky Hue orange.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                      // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                     // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                      // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                       // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                        // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                        // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                     // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                  // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Sky Hue' }, 40, 1030],                                                                                              // 10
      ['hue', { slot: '2', name: 'Sea Hue' }, 40, 1140],                                                                                              // 11
      ['hue', { slot: '3', name: 'Deep Sea Hue' }, 40, 1250],                                                                                         // 12
      ['hue', { slot: '4', name: 'Foam Hue' }, 40, 1360],                                                                                             // 13
      ['hue', { slot: '5', name: 'Island Hue' }, 40, 1470],                                                                                           // 14
      ['hue', { slot: '6', name: 'Sun Hue' }, 40, 1580],                                                                                              // 15
      ['maprange', { outLo: 0, outHi: 100 }, 480, 40],                                                                                                // 16
      ['random', { lo: 0, hi: 100 }, 40, 1690],                                                                                                       // 17
      ['maprange', { inLo: 50, inHi: 100, outLo: 0, outHi: 45 }, 260, 40],                                                                            // 18
      ['maprange', { inLo: 0, inHi: 50, outLo: 55, outHi: 100 }, 260, 150],                                                                           // 19
      ['maprange', { inLo: 76, inHi: 96, outLo: 0, outHi: 100 }, 700, 40],                                                                            // 20
      ['gradient', { shape: 'linear', angle: 90 }, 40, 1800],                                                                                         // 21
      ['threshold', { at: 45, '~at': '62,30', soft: 0 }, 260, 260],                                                                                   // 22
      ['levels', { lo: 45, '~lo': '62,30', hi: 100, gamma: 50 }, 260, 370],                                                                           // 23
      ['gradmap', { stops: 3 }, 480, 150],                                                                                                            // 24
      ['mix', { t: 45 }, 260, 480],                                                                                                                   // 25
      ['mix', { t: 70 }, 260, 590],                                                                                                                   // 26
      ['math', { op: 'sine' }, 260, 700],                                                                                                             // 27
      ['dial', {}, 40, 1910],                                                                                                                         // 28
      ['number', { value: 100 }, 40, 2020],                                                                                                           // 29
      ['math', { op: 'min' }, 260, 810],                                                                                                              // 30
      ['maprange', { outLo: 62, outHi: 30 }, 260, 920],                                                                                               // 31
      ['math', { op: 'multiply' }, 480, 260],                                                                                                         // 32
      ['number', { value: 12 }, 40, 2130],                                                                                                            // 33
      ['math', { op: 'subtract' }, 480, 370],                                                                                                         // 34
      ['math', { op: 'multiply' }, 700, 150],                                                                                                         // 35
      ['math', { op: 'subtract' }, 920, 40],                                                                                                          // 36
      ['number', { value: 4 }, 40, 2240],                                                                                                             // 37
      ['math', { op: 'subtract' }, 1140, 40],                                                                                                         // 38
      ['ellipse', { size: 9, height: 100, soft: 1 }, 1360, 40],                                                                                       // 39
      ['ellipse', { size: 16, height: 100, soft: 1, rings: 1, line: 6 }, 1360, 150],                                                                  // 40
      ['blend', { mode: 'normal', opacity: 100 }, 1580, 40],                                                                                          // 41
      ['mix', { t: 40 }, 260, 1030],                                                                                                                  // 42
      ['blend', { mode: 'normal', opacity: 70 }, 1800, 40],                                                                                           // 43
      ['maprange', { inLo: 30, inHi: 45, outLo: 100, outHi: 0 }, 480, 480],                                                                           // 44
      ['maprange', { outLo: 50, outHi: 18 }, 260, 1140],                                                                                              // 45
      ['maprange', { outLo: 62, outHi: 30 }, 260, 1250],                                                                                              // 46
      ['threshold', { at: 18, soft: 4 }, 700, 260],                                                                                                   // 47
      ['threshold', { at: 75, soft: 25 }, 700, 370],                                                                                                  // 48
      ['math', { op: 'multiply' }, 920, 150],                                                                                                         // 49
      ['maprange', { inLo: 15, inHi: 100, outLo: 100, outHi: 30 }, 700, 480],                                                                         // 50
      ['math', { op: 'multiply' }, 1140, 150],                                                                                                        // 51
      ['scatter', { shape: 'dot', count: 40, '~count': '4,110', size: 30, '~size': '16,46', vary: 60, turn: 0, clump: 70, fade: 0, layers: 'largest', per: 'for the page' }, 1360, 260],// 52
      ['maprange', { inLo: 0, inHi: 90, outLo: 3, outHi: 100 }, 700, 590],                                                                            // 53
      ['random', { lo: 0, hi: 100 }, 40, 2350],                                                                                                       // 54
      ['maprange', { inLo: 10, inHi: 90, outLo: 0, outHi: 100 }, 700, 700],                                                                           // 55
      ['math', { op: 'average' }, 920, 260],                                                                                                          // 56
      ['threshold', { at: 16, soft: 2 }, 700, 810],                                                                                                   // 57
      ['twirl', { angle: 120, '~angle': '0,220', radius: 30, '~radius': '18,50', x: 50, '~x': '10,90', y: 30, '~y': '15,40' }, 1800, 150],            // 58
      ['math', { op: 'multiply' }, 1580, 150],                                                                                                        // 59
      ['random', { lo: 0, hi: 100 }, 40, 2460],                                                                                                       // 60
      ['random', { lo: 0, hi: 100 }, 40, 2570],                                                                                                       // 61
      ['random', { lo: 0, hi: 100 }, 40, 2680],                                                                                                       // 62
      ['twirl', { angle: -120, '~angle': '0,-220', radius: 26, '~radius': '14,44', x: 50, '~x': '10,90', y: 25, '~y': '10,40' }, 2020, 40],           // 63
      ['random', { lo: 0, hi: 100 }, 40, 2790],                                                                                                       // 64
      ['random', { lo: 0, hi: 100 }, 40, 2900],                                                                                                       // 65
      ['random', { lo: 0, hi: 100 }, 40, 3010],                                                                                                       // 66
      ['threshold', { at: 30, soft: 3 }, 2240, 40],                                                                                                   // 67
      ['math', { op: 'subtract' }, 480, 590],                                                                                                         // 68
      ['math', { op: 'multiply' }, 2460, 40],                                                                                                         // 69
      ['blur', { radius: 14 }, 2240, 150],                                                                                                            // 70
      ['mix', { t: 38 }, 260, 1360],                                                                                                                  // 71
      ['mix', { t: 14 }, 260, 1470],                                                                                                                  // 72
      ['material', { relief: 120, gloss: 10, shine: 0, shadow: 70, occlusion: 20, ambient: 30 }, 2460, 150],                                          // 73
      ['number', { value: 50 }, 40, 3120],                                                                                                            // 74
      ['posterize', { steps: 3, '~steps': '2,5' }, 2680, 40],                                                                                         // 75
      ['gradmap', { stops: 3, blend: 'bands' }, 3120, 40],                                                                                            // 76
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 2900, 40],                                                                           // 77
      ['blend', { mode: 'normal', opacity: 100 }, 3340, 40],                                                                                          // 78
      ['perlin', { scale: 7, '~scale': '4,12', details: 3, contrast: 50 }, 260, 1580],                                                                // 79
      ['random', { lo: 0, hi: 100 }, 40, 3230],                                                                                                       // 80
      ['maprange', { outLo: 0, outHi: 40, '~outHi': '0,100' }, 480, 700],                                                                             // 81
      ['math', { op: 'subtract' }, 700, 920],                                                                                                         // 82
      ['threshold', { at: 1, soft: 0 }, 920, 370],                                                                                                    // 83
      ['math', { op: 'subtract' }, 480, 810],                                                                                                         // 84
      ['math', { op: 'multiply' }, 1140, 260],                                                                                                        // 85
      ['blur', { radius: 8 }, 1360, 370],                                                                                                             // 86
      ['mix', { t: 45 }, 260, 1690],                                                                                                                  // 87
      ['mix', { t: 40 }, 260, 1800],                                                                                                                  // 88
      ['material', { relief: 140, gloss: 10, shine: 0, shadow: 70, occlusion: 20, ambient: 30 }, 1580, 260],                                          // 89
      ['number', { value: 50 }, 40, 3340],                                                                                                            // 90
      ['posterize', { steps: 3, '~steps': '2,5' }, 1800, 260],                                                                                        // 91
      ['gradmap', { stops: 3, blend: 'bands' }, 2240, 260],                                                                                           // 92
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 2020, 150],                                                                          // 93
      ['blend', { mode: 'normal', opacity: 18 }, 2460, 260],                                                                                          // 94
      ['blend', { mode: 'normal', opacity: 100 }, 3560, 40],                                                                                          // 95
      ['gradmap', { stops: 3 }, 480, 920],                                                                                                            // 96
      ['mix', { t: 45 }, 260, 1910],                                                                                                                  // 97
      ['maprange', { inLo: 0, inHi: 100, outLo: 6, outHi: 100 }, 480, 1030],                                                                          // 98
      ['perlin', { scale: 4, '~scale': '2,7', details: 3, contrast: 50 }, 40, 3450],                                                                  // 99
      ['threshold', { at: 58, soft: 10 }, 260, 2020],                                                                                                 // 100
      ['scatter', { shape: 'dot', count: 160, '~count': '20,420', size: 9, '~size': '1,18', vary: 70, turn: 0, clump: 55, fade: 0, per: 'for the page' }, 920, 480],// 101
      ['math', { op: 'multiply' }, 480, 1140],                                                                                                        // 102
      ['maprange', { outLo: 100, outHi: 40 }, 480, 1250],                                                                                             // 103
      ['math', { op: 'multiply' }, 700, 1030],                                                                                                        // 104
      ['scale', { scale: 100, stretch: 55, cx: 50, cy: 100, edges: 'repeat' }, 1140, 370],                                                            // 105
      ['warp', { amount: 18 }, 1360, 480],                                                                                                            // 106
      ['perlin', { scale: 10, details: 3 }, 40, 3560],                                                                                                // 107
      ['scatter', { shape: 'dash', count: 60, '~count': '0,180', size: 22, '~size': '2,40', vary: 60, turn: 3, clump: 30, fade: 0, per: 'for the page' }, 1360, 590],// 108
      ['maprange', { outLo: 0, outHi: 45 }, 920, 590],                                                                                                // 109
      ['math', { op: 'add' }, 1140, 480],                                                                                                             // 110
      ['warp', { amount: 25 }, 1580, 370],                                                                                                            // 111
      ['perlin', { scale: 6, details: 3 }, 40, 3670],                                                                                                 // 112
      ['threshold', { at: 40, soft: 6 }, 1580, 480],                                                                                                  // 113
      ['blend', { mode: 'normal', opacity: 90 }, 1800, 370],                                                                                          // 114
      ['threshold', { at: 40, soft: 6 }, 1800, 480],                                                                                                  // 115
      ['blend', { mode: 'normal', opacity: 100 }, 2020, 260],                                                                                         // 116
      ['ellipse', { size: 40, height: 100, soft: 30 }, 480, 1360],                                                                                    // 117
      ['scatter', { shape: 'dash', count: 60, '~count': '20,140', size: 6, vary: 60, turn: 4, clump: 0, fade: 0, per: 'for the page' }, 920, 700],    // 118
      ['math', { op: 'multiply' }, 700, 1140],                                                                                                        // 119
      ['mix', { t: 30 }, 260, 2130],                                                                                                                  // 120
      ['blend', { mode: 'normal', opacity: 100 }, 2240, 370],                                                                                         // 121
      ['blend', { mode: 'normal', opacity: 100 }, 3780, 40],                                                                                          // 122
      ['maprange', { inLo: 0, inHi: 12, outLo: 55, outHi: 0 }, 480, 1470],                                                                            // 123
      ['mix', { t: 55 }, 260, 2240],                                                                                                                  // 124
      ['math', { op: 'multiply' }, 700, 1250],                                                                                                        // 125
      ['blend', { mode: 'normal', opacity: 100 }, 4000, 40],                                                                                          // 126
      ['mix', { t: 18 }, 260, 2350],                                                                                                                  // 127
      ['maprange', { outLo: 100, outHi: 55 }, 480, 1580],                                                                                             // 128
      ['math', { op: 'multiply' }, 920, 810],                                                                                                         // 129
      ['blend', { mode: 'normal', opacity: 84 }, 4220, 40],                                                                                           // 130
      ['streamers', { shape: 0, count: 5, '~count': '0,11', strands: 3, length: 50, '~length': '25,60', curl: 50, '~curl': '25,85', width: 100, twist: 30, depth: 60, horizon: 45, '~horizon': '62,30' }, 1360, 700],// 131
      ['random', { lo: 0, hi: 100 }, 40, 3780],                                                                                                       // 132
      ['maprange', { outLo: 19, outHi: 31 }, 260, 2460],                                                                                              // 133
      ['random', { lo: 0, hi: 100 }, 40, 3890],                                                                                                       // 134
      ['threshold', { at: 50, soft: 0 }, 260, 2570],                                                                                                  // 135
      ['number', { value: 50 }, 40, 4000],                                                                                                            // 136
      ['math', { op: 'multiply' }, 480, 1690],                                                                                                        // 137
      ['math', { op: 'add' }, 700, 1360],                                                                                                             // 138
      ['maprange', { outLo: 0, outHi: 30 }, 920, 920],                                                                                                // 139
      ['math', { op: 'add' }, 1140, 590],                                                                                                             // 140
      ['random', { lo: 0, hi: 100 }, 40, 4110],                                                                                                       // 141
      ['random', { lo: 0, hi: 100 }, 40, 4220],                                                                                                       // 142
      ['posterize', { steps: 3, '~steps': '2,5' }, 1580, 590],                                                                                        // 143
      ['gradmap', { stops: 3, blend: 'bands' }, 2020, 370],                                                                                           // 144
      ['maprange', { inLo: 20, inHi: 85, outLo: 0, outHi: 100 }, 1800, 590],                                                                          // 145
      ['mix', { t: 30 }, 260, 2680],                                                                                                                  // 146
      ['mix', { t: 9 }, 260, 2790],                                                                                                                   // 147
      ['invert', {}, 1580, 700],                                                                                                                      // 148
      ['mix', { t: 22 }, 260, 2900],                                                                                                                  // 149
      ['blend', { mode: 'normal', opacity: 50 }, 2240, 480],                                                                                          // 150
      ['blend', { mode: 'normal', opacity: 96 }, 4440, 40],                                                                                           // 151
      ['surface', { name: 'Windward Sea', ground: 'colour' }, 4660, 40],                                                                              // 152
      ['fairy', { chance: 18, size: 100, y0: 35, y1: 70 }, 4550, 160]],                                                                                 // 153 (now and then a fairy over the sea)
    wires: [[17, 1, 16, 1], [2, 1, 18, 1], [18, 1, 16, 'outLo'], [2, 1, 19, 1], [19, 1, 16, 'outHi'], [16, 1, 20, 1],
      [21, 1, 22, 1], [1, 1, 22, 'at'], [21, 1, 23, 1], [1, 1, 23, 'lo'], [21, 1, 24, 1], [10, 1, 24, 2],
      [10, 1, 25, 1], [13, 1, 25, 2], [25, 1, 24, 3], [10, 1, 26, 1], [13, 1, 26, 2], [26, 1, 24, 4], [9, 1, 27, 1], [28, 2, 30, 1], [29, 1, 30, 2],
      [1, 1, 31, 1], [30, 1, 32, 1], [30, 1, 32, 2], [31, 1, 34, 1], [33, 1, 34, 2], [32, 1, 35, 1], [34, 1, 35, 2], [31, 1, 36, 1], [35, 1, 36, 2],
      [36, 1, 38, 1], [37, 1, 38, 2], [27, 1, 39, 'x'], [38, 1, 39, 'y'], [27, 1, 40, 'x'],
      [38, 1, 40, 'y'], [24, 1, 41, 1], [15, 1, 41, 2], [39, 1, 41, 3], [15, 1, 42, 1], [13, 1, 42, 2], [41, 1, 43, 1], [42, 1, 43, 2],
      [40, 1, 43, 3], [21, 1, 44, 1], [1, 1, 45, 1], [45, 1, 44, 'inLo'], [1, 1, 46, 1], [46, 1, 44, 'inHi'],
      [44, 1, 47, 1], [44, 1, 48, 1], [47, 1, 49, 1], [48, 1, 49, 2], [44, 1, 50, 1], [50, 1, 51, 1], [49, 1, 51, 2], [51, 1, 52, 2], [16, 1, 53, 1],
      [53, 1, 52, 'count'], [16, 1, 55, 1], [54, 1, 56, 1], [55, 1, 56, 2], [56, 1, 52, 'size'], [44, 1, 57, 1],
      [52, 2, 59, 1], [57, 1, 59, 2], [59, 1, 58, 1], [3, 1, 58, 'angle'], [60, 1, 58, 'radius'],
      [61, 1, 58, 'x'], [62, 1, 58, 'y'], [58, 1, 63, 1], [3, 1, 63, 'angle'],
      [64, 1, 63, 'radius'], [65, 1, 63, 'x'], [66, 1, 63, 'y'], [63, 1, 67, 1], [29, 1, 68, 1],
      [22, 1, 68, 2], [67, 1, 69, 1], [68, 1, 69, 2], [63, 1, 70, 1], [10, 1, 71, 1], [13, 1, 71, 2], [13, 1, 72, 1], [10, 1, 72, 2], [74, 1, 73, 1],
      [70, 1, 73, 2], [9, 1, 73, 7], [73, 2, 75, 1], [8, 1, 75, 'steps'], [75, 1, 77, 1], [77, 1, 76, 1], [71, 1, 76, 2],
      [72, 1, 76, 3], [13, 1, 76, 4], [43, 1, 78, 1], [76, 1, 78, 2], [69, 1, 78, 3], [80, 1, 79, 'scale'], [79, 1, 81, 1],
      [7, 1, 81, 'outHi'], [81, 1, 82, 1], [44, 1, 82, 2], [82, 1, 83, 1], [29, 1, 84, 1], [22, 1, 84, 2], [83, 1, 85, 1],
      [84, 1, 85, 2], [85, 1, 86, 1], [14, 1, 87, 1], [12, 1, 87, 2], [14, 1, 88, 1], [15, 1, 88, 2], [90, 1, 89, 1], [86, 1, 89, 2], [9, 1, 89, 7],
      [89, 2, 91, 1], [8, 1, 91, 'steps'], [91, 1, 93, 1], [93, 1, 92, 1], [87, 1, 92, 2], [14, 1, 92, 3], [88, 1, 92, 4],
      [92, 1, 94, 1], [10, 1, 94, 2], [78, 1, 95, 1], [94, 1, 95, 2], [85, 1, 95, 3], [23, 1, 96, 1], [11, 1, 97, 1], [10, 1, 97, 2], [97, 1, 96, 2],
      [11, 1, 96, 3], [12, 1, 96, 4], [23, 1, 98, 1], [99, 1, 100, 1], [22, 1, 102, 1], [100, 1, 102, 2], [23, 1, 103, 1], [102, 1, 104, 1], [103, 1, 104, 2],
      [104, 1, 101, 2], [5, 1, 101, 'count'], [98, 1, 101, 'size'], [101, 1, 105, 1], [105, 1, 106, 1],
      [107, 1, 106, 2], [22, 1, 108, 2], [20, 1, 109, 1], [4, 1, 110, 1], [109, 1, 110, 2], [110, 1, 108, 'count'],
      [98, 1, 108, 'size'], [108, 1, 111, 1], [112, 1, 111, 2], [106, 1, 113, 1], [96, 1, 114, 1], [13, 1, 114, 2], [113, 1, 114, 3],
      [111, 1, 115, 1], [114, 1, 116, 1], [13, 1, 116, 2], [115, 1, 116, 3], [27, 1, 117, 'x'], [117, 1, 119, 1], [22, 1, 119, 2],
      [119, 1, 118, 2], [4, 1, 118, 'count'], [15, 1, 120, 1], [13, 1, 120, 2], [116, 1, 121, 1], [120, 1, 121, 2], [118, 1, 121, 3],
      [95, 1, 122, 1], [121, 1, 122, 2], [22, 1, 122, 3], [23, 1, 123, 1], [10, 1, 124, 1], [13, 1, 124, 2], [123, 1, 125, 1], [22, 1, 125, 2],
      [122, 1, 126, 1], [124, 1, 126, 2], [125, 1, 126, 3], [12, 1, 127, 1], [13, 1, 127, 2], [22, 1, 128, 1], [20, 1, 129, 1], [128, 1, 129, 2],
      [126, 1, 130, 1], [127, 1, 130, 2], [129, 1, 130, 3], [132, 1, 133, 1], [134, 1, 135, 1], [135, 1, 137, 1], [136, 1, 137, 2], [133, 1, 138, 1],
      [137, 1, 138, 2], [138, 1, 131, 2], [9, 1, 131, 3], [20, 1, 139, 1], [6, 1, 140, 1], [139, 1, 140, 2], [140, 1, 131, 'count'],
      [1, 1, 131, 'horizon'], [141, 1, 131, 'length'], [142, 1, 131, 'curl'],
      [131, 2, 143, 1], [8, 1, 143, 'steps'], [143, 1, 145, 1], [145, 1, 144, 1], [13, 1, 146, 1], [10, 1, 146, 2], [146, 1, 144, 2],
      [13, 1, 147, 1], [10, 1, 147, 2], [147, 1, 144, 3], [13, 1, 144, 4], [131, 3, 148, 1], [13, 1, 149, 1], [12, 1, 149, 2], [144, 1, 150, 1],
      [149, 1, 150, 2], [148, 1, 150, 3], [130, 1, 151, 1], [150, 1, 151, 2], [131, 1, 151, 3], [151, 1, 153, 1], [153, 1, 152, 1]] },
  inkscroll: { label: 'Sunrise Scroll', div: 2, v: 5, teach: 'A land painted in ink on old paper, in the cel-shaded ink-wash look of the brush-painted games and the painters they loved (docs/prior-art/cel-shaded.md §7). Mountains stand band behind band, as in a mountain-and-water painting: each ridge a noise laid along the page (a Curve’s noise through a Profile Gradient), the far ones folded into sharp crags (Peaks). Each is a flat wash of ink, diluted by distance and tinted toward the Mountain Hue by Wash, lit by the Light Engine in bands (Toon Bands), its foot fading back to paper as mist (Mist), its ridge brushed in ink, thick and thin, broken by dry-brush streaks (Ink). The sky is graded across the top as a woodblock print’s straight-line gradation; a red sun stands where the dial lays it and sinks behind the mountains; long bands of mist with rounded ends drift across the sky, outlined (Clouds); cherry petals drift over all (Blossoms); the paper darkens at its edges with age (Age). The land is the seed’s, or Land’s: Scroll Lands reads the bands’ masks and stands its things on their crests, hidden by the bands in front: towers out of the mist, a coast with a great curling wave and its claws of foam, the snowy north (snow left bare under every crest, the sky dark down to the hills), a bamboo grove in three depths, a village with its gate and pagoda, a great tree with its rope over terraced fields, or a cursed land under a rising miasma; each map laid in its hue by a Blend (wash in the Mountain Hue, water in the Sky Hue, gates and miasma in the Sun Hue, blossom in the Blossom Hue, snow and foam in the Paper Hue, lines in the Ink Hue). Try: Wash at nothing for bare ink; or Land on Coast.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                                                                                        // 1
      ['knob', { slot: '2' }, 40, 150],                                                                                        // 2
      ['knob', { slot: '3' }, 40, 260],                                                                                         // 3
      ['knob', { slot: '4' }, 40, 370],                                                                                        // 4
      ['knob', { slot: '5' }, 40, 480],                                                                                      // 5
      ['knob', { slot: '6' }, 40, 590],                                                                                    // 6
      ['knob', { slot: '7' }, 40, 700],                                                                                         // 7
      ['knob', { slot: '8' }, 40, 810],                                                                                  // 8
      ['dial', {}, 40, 920],                                                                                                                          // 9
      ['hue', { slot: '1', name: 'Paper Hue' }, 40, 1030],                                                                                            // 10
      ['hue', { slot: '2', name: 'Ink Hue' }, 40, 1140],                                                                                              // 11
      ['hue', { slot: '3', name: 'Sky Hue' }, 40, 1250],                                                                                              // 12
      ['hue', { slot: '4', name: 'Mountain Hue' }, 40, 1360],                                                                                         // 13
      ['hue', { slot: '5', name: 'Blossom Hue' }, 40, 1470],                                                                                          // 14
      ['hue', { slot: '6', name: 'Sun Hue' }, 40, 1580],                                                                                              // 15
      ['gradient', { shape: 'linear', angle: 90 }, 40, 1690],                                                                                         // 16
      ['coldpress', {}, 260, 40],                                                                                                                     // 17
      ['gradient', { shape: 'radial' }, 40, 1800],                                                                                                    // 18
      ['maprange', { inLo: 35, inHi: 100, outLo: 0, outHi: 70, '~outHi': '0,100' }, 260, 150],                                                        // 19
      ['mix', { t: 38 }, 260, 260],                                                                                                                   // 20
      ['blend', { mode: 'normal', opacity: 100 }, 480, 40],                                                                                           // 21
      ['maprange', { inLo: 0, inHi: 26, outLo: 100, outHi: 0 }, 260, 370],                                                                            // 22
      ['warp', { amount: 10 }, 480, 150],                                                                                                             // 23
      ['perlin', { scale: 8, details: 3 }, 40, 1910],                                                                                                 // 24
      ['blend', { mode: 'normal', opacity: 85 }, 700, 40],                                                                                            // 25
      ['math', { op: 'sine' }, 260, 480],                                                                                                             // 26
      ['dial', {}, 40, 2020],                                                                                                                         // 27
      ['number', { value: 100 }, 40, 2130],                                                                                                           // 28
      ['math', { op: 'min' }, 260, 590],                                                                                                              // 29
      ['number', { value: 48 }, 40, 2240],                                                                                                            // 30
      ['math', { op: 'multiply' }, 480, 260],                                                                                                         // 31
      ['number', { value: 34 }, 40, 2350],                                                                                                            // 32
      ['math', { op: 'multiply' }, 700, 150],                                                                                                         // 33
      ['math', { op: 'subtract' }, 920, 40],                                                                                                          // 34
      ['ellipse', { size: 12, height: 100, soft: 1 }, 1140, 40],                                                                                      // 35
      ['blend', { mode: 'normal', opacity: 92 }, 1360, 40],                                                                                           // 36
      ['maprange', { inLo: 4, inHi: 14, outLo: 0, outHi: 100 }, 260, 700],                                                                            // 37
      ['maprange', { inLo: 30, inHi: 42, outLo: 100, outHi: 0 }, 260, 810],                                                                           // 38
      ['math', { op: 'multiply' }, 480, 370],                                                                                                         // 39
      ['scatter', { shape: 'dash', count: 8, '~count': '0,22', size: 40, '~size': '24,60', vary: 50, turn: 0, clump: 60, fade: 0, layers: 'largest', per: 'for the page' }, 700, 260],// 40
      ['random', { lo: 0, hi: 100 }, 40, 2460],                                                                                                       // 41
      ['twirl', { angle: 120, '~angle': '60,200', radius: 12, '~radius': '6,18', x: 50, '~x': '15,85', y: 22, '~y': '12,30' }, 1360, 150],            // 42
      ['blur', { radius: 9 }, 920, 150],                                                                                                              // 43
      ['threshold', { at: 9, soft: 3 }, 1140, 150],                                                                                                   // 44
      ['random', { lo: 0, hi: 100 }, 40, 2570],                                                                                                       // 45
      ['random', { lo: 0, hi: 100 }, 40, 2680],                                                                                                       // 46
      ['random', { lo: 0, hi: 100 }, 40, 2790],                                                                                                       // 47
      ['random', { lo: 0, hi: 100 }, 40, 2900],                                                                                                       // 48
      ['threshold', { at: 40, soft: 2 }, 1580, 40],                                                                                                   // 49
      ['blur', { radius: 8 }, 1800, 40],                                                                                                              // 50
      ['mix', { t: 30 }, 260, 920],                                                                                                                   // 51
      ['mix', { t: 8 }, 260, 1030],                                                                                                                   // 52
      ['material', { relief: 110, gloss: 0, shine: 0, shadow: 55, occlusion: 20, ambient: 35 }, 2020, 40],                                            // 53
      ['number', { value: 50 }, 40, 3010],                                                                                                            // 54
      ['posterize', { steps: 3, '~steps': '2,5' }, 2240, 40],                                                                                         // 55
      ['gradmap', { stops: 3, blend: 'bands' }, 2680, 40],                                                                                            // 56
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 2460, 40],                                                                           // 57
      ['blend', { mode: 'normal', opacity: 100 }, 2900, 40],                                                                                          // 58
      ['edges', { strength: 80 }, 1800, 150],                                                                                                         // 59
      ['perlin', { scale: 5, details: 2, contrast: 40 }, 40, 3120],                                                                                   // 60
      ['maprange', { outLo: 25, outHi: 100 }, 260, 1140],                                                                                             // 61
      ['blur', { radius: 2, '~radius': '0.3,2.0' }, 2240, 150],                                                                                       // 62
      ['math', { op: 'multiply' }, 2020, 150],                                                                                                        // 63
      ['threshold', { at: 14, soft: 4 }, 2460, 150],                                                                                                  // 64
      ['motionblur', { length: 40, angle: 0 }, 260, 1250],                                                                                            // 65
      ['perlin', { scale: 60, details: 2, contrast: 70 }, 40, 3230],                                                                                  // 66
      ['threshold', { at: 28, soft: 10 }, 480, 480],                                                                                                  // 67
      ['math', { op: 'multiply' }, 2680, 150],                                                                                                        // 68
      ['blend', { mode: 'normal', opacity: 65 }, 3120, 40],                                                                                           // 69
      ['mix', { t: 50 }, 260, 1360],                                                                                                                  // 70
      ['maprange', { inLo: 8, inHi: 50, outLo: 100, outHi: 0 }, 260, 1470],                                                                           // 71
      ['curve', { shape: 'noise', amount: 50, count: 3, low: 0, high: 100, variation: 0 }, 260, 1580],                                                // 72
      ['curve', { shape: 'noise', amount: 50, count: 12, low: 0, high: 100, variation: 7 }, 260, 1690],                                               // 73
      ['random', { lo: 0, hi: 99 }, 40, 3340],                                                                                                        // 74
      ['random', { lo: 0, hi: 99 }, 40, 3450],                                                                                                        // 75
      ['curveops', { op: 'blend', amount: 30 }, 480, 590],                                                                                            // 76
      ['profile', { shape: 'linear', angle: 0 }, 700, 370],                                                                                           // 77
      ['number', { value: 92 }, 40, 3560],                                                                                                            // 78
      ['math', { op: 'multiply' }, 920, 260],                                                                                                         // 79
      ['perlin', { scale: 30, details: 3, contrast: 40 }, 40, 3670],                                                                                  // 80
      ['maprange', { outLo: 0, outHi: 6 }, 260, 1800],                                                                                                // 81
      ['math', { op: 'add' }, 1140, 260],                                                                                                             // 82
      ['invert', {}, 1800, 260],                                                                                                                      // 83
      ['math', { op: 'difference' }, 1360, 260],                                                                                                      // 84
      ['math', { op: 'add' }, 1580, 150],                                                                                                             // 85
      ['math', { op: 'multiply' }, 2020, 260],                                                                                                        // 86
      ['maprange', { outLo: 0, outHi: 80, '~outHi': '35,100' }, 2240, 260],                                                                           // 87
      ['math', { op: 'subtract' }, 2460, 260],                                                                                                        // 88
      ['threshold', { at: 1, soft: 0 }, 2680, 260],                                                                                                   // 89
      ['maprange', { inLo: 30, inHi: 50, outLo: 100, outHi: 0, '~inLo': '46,10' }, 260, 1910],                                                        // 90
      ['mix', { t: 24 }, 480, 700],                                                                                                                   // 91
      ['blur', { radius: 10 }, 2900, 150],                                                                                                            // 92
      ['perlin', { scale: 6, details: 4 }, 40, 3780],                                                                                                 // 93
      ['maprange', { outLo: 0, outHi: 22 }, 260, 2020],                                                                                               // 94
      ['math', { op: 'add' }, 3120, 150],                                                                                                             // 95
      ['mix', { t: 30 }, 700, 480],                                                                                                                   // 96
      ['mix', { t: 30 }, 700, 590],                                                                                                                   // 97
      ['material', { relief: 130, gloss: 0, shine: 0, shadow: 55, occlusion: 20, ambient: 35 }, 3340, 40],                                            // 98
      ['posterize', { steps: 3, '~steps': '2,5' }, 3560, 40],                                                                                         // 99
      ['gradmap', { stops: 3, blend: 'bands' }, 4000, 40],                                                                                            // 100
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 3780, 40],                                                                           // 101
      ['math', { op: 'multiply' }, 2900, 260],                                                                                                        // 102
      ['blend', { mode: 'normal', opacity: 100 }, 4220, 40],                                                                                          // 103
      ['mix', { t: 40 }, 260, 2130],                                                                                                                  // 104
      ['edges', { strength: 80 }, 2900, 370],                                                                                                         // 105
      ['perlin', { scale: 5, details: 2, contrast: 40 }, 40, 3890],                                                                                   // 106
      ['maprange', { outLo: 25, outHi: 100 }, 260, 2240],                                                                                             // 107
      ['blur', { radius: 2, '~radius': '0.4,2.7' }, 3340, 150],                                                                                       // 108
      ['math', { op: 'multiply' }, 3120, 260],                                                                                                        // 109
      ['threshold', { at: 14, soft: 4 }, 3560, 150],                                                                                                  // 110
      ['motionblur', { length: 40, angle: 0 }, 260, 2350],                                                                                            // 111
      ['perlin', { scale: 60, details: 2, contrast: 70 }, 40, 4000],                                                                                  // 112
      ['threshold', { at: 28, soft: 10 }, 480, 810],                                                                                                  // 113
      ['math', { op: 'multiply' }, 3780, 150],                                                                                                        // 114
      ['blend', { mode: 'normal', opacity: 35 }, 4440, 40],                                                                                           // 115
      ['maprange', { inLo: 20, inHi: 62, outLo: 100, outHi: 0 }, 260, 2460],                                                                          // 116
      ['curve', { shape: 'noise', amount: 50, count: 4, low: 0, high: 100, variation: 13 }, 260, 2570],                                               // 117
      ['curve', { shape: 'noise', amount: 50, count: 16, low: 0, high: 100, variation: 20 }, 260, 2680],                                              // 118
      ['random', { lo: 0, hi: 99 }, 40, 4110],                                                                                                        // 119
      ['random', { lo: 0, hi: 99 }, 40, 4220],                                                                                                        // 120
      ['curveops', { op: 'blend', amount: 30 }, 480, 920],                                                                                            // 121
      ['profile', { shape: 'linear', angle: 0 }, 700, 700],                                                                                           // 122
      ['math', { op: 'multiply' }, 920, 370],                                                                                                         // 123
      ['perlin', { scale: 30, details: 3, contrast: 40 }, 40, 4330],                                                                                  // 124
      ['maprange', { outLo: 0, outHi: 6 }, 260, 2790],                                                                                                // 125
      ['math', { op: 'add' }, 1140, 370],                                                                                                             // 126
      ['invert', {}, 1800, 370],                                                                                                                      // 127
      ['math', { op: 'difference' }, 1360, 370],                                                                                                      // 128
      ['math', { op: 'add' }, 1580, 260],                                                                                                             // 129
      ['math', { op: 'multiply' }, 2020, 370],                                                                                                        // 130
      ['maprange', { outLo: 0, outHi: 80, '~outHi': '35,100' }, 2240, 370],                                                                           // 131
      ['math', { op: 'subtract' }, 2460, 370],                                                                                                        // 132
      ['threshold', { at: 1, soft: 0 }, 2680, 370],                                                                                                   // 133
      ['maprange', { inLo: 42, inHi: 62, outLo: 100, outHi: 0, '~inLo': '58,22' }, 260, 2900],                                                        // 134
      ['mix', { t: 42 }, 480, 1030],                                                                                                                  // 135
      ['blur', { radius: 14 }, 2900, 480],                                                                                                            // 136
      ['perlin', { scale: 6, details: 4 }, 40, 4440],                                                                                                 // 137
      ['maprange', { outLo: 0, outHi: 22 }, 260, 3010],                                                                                               // 138
      ['math', { op: 'add' }, 3120, 370],                                                                                                             // 139
      ['mix', { t: 30 }, 700, 810],                                                                                                                   // 140
      ['mix', { t: 30 }, 700, 920],                                                                                                                   // 141
      ['material', { relief: 130, gloss: 0, shine: 0, shadow: 55, occlusion: 20, ambient: 35 }, 3340, 260],                                           // 142
      ['posterize', { steps: 3, '~steps': '2,5' }, 3560, 260],                                                                                        // 143
      ['gradmap', { stops: 3, blend: 'bands' }, 4000, 150],                                                                                           // 144
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 3780, 260],                                                                          // 145
      ['math', { op: 'multiply' }, 2900, 590],                                                                                                        // 146
      ['blend', { mode: 'normal', opacity: 100 }, 4660, 40],                                                                                          // 147
      ['mix', { t: 58 }, 260, 3120],                                                                                                                  // 148
      ['edges', { strength: 80 }, 2900, 700],                                                                                                         // 149
      ['perlin', { scale: 5, details: 2, contrast: 40 }, 40, 4550],                                                                                   // 150
      ['maprange', { outLo: 25, outHi: 100 }, 260, 3230],                                                                                             // 151
      ['blur', { radius: 2, '~radius': '0.5,3.8' }, 3340, 370],                                                                                       // 152
      ['math', { op: 'multiply' }, 3120, 480],                                                                                                        // 153
      ['threshold', { at: 14, soft: 4 }, 3560, 370],                                                                                                  // 154
      ['motionblur', { length: 40, angle: 0 }, 260, 3340],                                                                                            // 155
      ['perlin', { scale: 60, details: 2, contrast: 70 }, 40, 4660],                                                                                  // 156
      ['threshold', { at: 28, soft: 10 }, 480, 1140],                                                                                                 // 157
      ['math', { op: 'multiply' }, 3780, 370],                                                                                                        // 158
      ['blend', { mode: 'normal', opacity: 55 }, 4880, 40],                                                                                           // 159
      ['maprange', { inLo: 36, inHi: 76, outLo: 100, outHi: 0 }, 260, 3450],                                                                          // 160
      ['curve', { shape: 'noise', amount: 50, count: 4, low: 0, high: 100, variation: 26 }, 260, 3560],                                               // 161
      ['curve', { shape: 'noise', amount: 50, count: 16, low: 0, high: 100, variation: 33 }, 260, 3670],                                              // 162
      ['random', { lo: 0, hi: 99 }, 40, 4770],                                                                                                        // 163
      ['random', { lo: 0, hi: 99 }, 40, 4880],                                                                                                        // 164
      ['curveops', { op: 'blend', amount: 22 }, 480, 1250],                                                                                           // 165
      ['profile', { shape: 'linear', angle: 0 }, 700, 1030],                                                                                          // 166
      ['math', { op: 'multiply' }, 920, 480],                                                                                                         // 167
      ['perlin', { scale: 30, details: 3, contrast: 40 }, 40, 4990],                                                                                  // 168
      ['maprange', { outLo: 0, outHi: 6 }, 260, 3780],                                                                                                // 169
      ['math', { op: 'add' }, 1140, 480],                                                                                                             // 170
      ['maprange', { outLo: 0, outHi: 80, '~outHi': '35,100' }, 1360, 480],                                                                           // 171
      ['math', { op: 'subtract' }, 1580, 370],                                                                                                        // 172
      ['threshold', { at: 1, soft: 0 }, 1800, 480],                                                                                                   // 173
      ['maprange', { inLo: 56, inHi: 76, outLo: 100, outHi: 0, '~inLo': '72,36' }, 260, 3890],                                                        // 174
      ['mix', { t: 62 }, 480, 1360],                                                                                                                  // 175
      ['blur', { radius: 18 }, 2020, 480],                                                                                                            // 176
      ['perlin', { scale: 6, details: 4 }, 40, 5100],                                                                                                 // 177
      ['maprange', { outLo: 0, outHi: 22 }, 260, 4000],                                                                                               // 178
      ['math', { op: 'add' }, 2240, 480],                                                                                                             // 179
      ['mix', { t: 30 }, 700, 1140],                                                                                                                  // 180
      ['mix', { t: 30 }, 700, 1250],                                                                                                                  // 181
      ['material', { relief: 130, gloss: 0, shine: 0, shadow: 55, occlusion: 20, ambient: 35 }, 2460, 480],                                           // 182
      ['posterize', { steps: 3, '~steps': '2,5' }, 2680, 480],                                                                                        // 183
      ['gradmap', { stops: 3, blend: 'bands' }, 3120, 590],                                                                                           // 184
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 2900, 810],                                                                          // 185
      ['math', { op: 'multiply' }, 2020, 590],                                                                                                        // 186
      ['blend', { mode: 'normal', opacity: 100 }, 5100, 40],                                                                                          // 187
      ['mix', { t: 76 }, 260, 4110],                                                                                                                  // 188
      ['edges', { strength: 80 }, 2020, 700],                                                                                                         // 189
      ['perlin', { scale: 5, details: 2, contrast: 40 }, 40, 5210],                                                                                   // 190
      ['maprange', { outLo: 25, outHi: 100 }, 260, 4220],                                                                                             // 191
      ['blur', { radius: 2, '~radius': '0.7,5.0' }, 2460, 590],                                                                                       // 192
      ['math', { op: 'multiply' }, 2240, 590],                                                                                                        // 193
      ['threshold', { at: 14, soft: 4 }, 2680, 590],                                                                                                  // 194
      ['motionblur', { length: 40, angle: 0 }, 260, 4330],                                                                                            // 195
      ['perlin', { scale: 60, details: 2, contrast: 70 }, 40, 5320],                                                                                  // 196
      ['threshold', { at: 28, soft: 10 }, 480, 1470],                                                                                                 // 197
      ['math', { op: 'multiply' }, 2900, 920],                                                                                                        // 198
      ['blend', { mode: 'normal', opacity: 75 }, 5320, 40],                                                                                           // 199
      ['maprange', { inLo: 56, inHi: 100, outLo: 100, outHi: 0 }, 260, 4440],                                                                         // 200
      ['curve', { shape: 'noise', amount: 50, count: 3, low: 0, high: 100, variation: 39 }, 260, 4550],                                               // 201
      ['curve', { shape: 'noise', amount: 50, count: 12, low: 0, high: 100, variation: 46 }, 260, 4660],                                              // 202
      ['random', { lo: 0, hi: 99 }, 40, 5430],                                                                                                        // 203
      ['random', { lo: 0, hi: 99 }, 40, 5540],                                                                                                        // 204
      ['curveops', { op: 'blend', amount: 22 }, 480, 1580],                                                                                           // 205
      ['profile', { shape: 'linear', angle: 0 }, 700, 1360],                                                                                          // 206
      ['math', { op: 'multiply' }, 920, 590],                                                                                                         // 207
      ['perlin', { scale: 30, details: 3, contrast: 40 }, 40, 5650],                                                                                  // 208
      ['maprange', { outLo: 0, outHi: 6 }, 260, 4770],                                                                                                // 209
      ['math', { op: 'add' }, 1140, 590],                                                                                                             // 210
      ['maprange', { outLo: 0, outHi: 80, '~outHi': '35,100' }, 1360, 590],                                                                           // 211
      ['math', { op: 'subtract' }, 1580, 480],                                                                                                        // 212
      ['threshold', { at: 1, soft: 0 }, 1800, 590],                                                                                                   // 213
      ['maprange', { inLo: 80, inHi: 100, outLo: 100, outHi: 0, '~inLo': '96,60' }, 260, 4880],                                                       // 214
      ['mix', { t: 84 }, 480, 1690],                                                                                                                  // 215
      ['blur', { radius: 22 }, 2020, 810],                                                                                                            // 216
      ['perlin', { scale: 6, details: 4 }, 40, 5760],                                                                                                 // 217
      ['maprange', { outLo: 0, outHi: 22 }, 260, 4990],                                                                                               // 218
      ['math', { op: 'add' }, 2240, 700],                                                                                                             // 219
      ['mix', { t: 30 }, 700, 1470],                                                                                                                  // 220
      ['mix', { t: 30 }, 700, 1580],                                                                                                                  // 221
      ['material', { relief: 130, gloss: 0, shine: 0, shadow: 55, occlusion: 20, ambient: 35 }, 2460, 700],                                           // 222
      ['posterize', { steps: 3, '~steps': '2,5' }, 2680, 700],                                                                                        // 223
      ['gradmap', { stops: 3, blend: 'bands' }, 3120, 700],                                                                                           // 224
      ['maprange', { inLo: 15, inHi: 75, outLo: 0, outHi: 100 }, 2900, 1030],                                                                         // 225
      ['math', { op: 'multiply' }, 2020, 920],                                                                                                        // 226
      ['blend', { mode: 'normal', opacity: 100 }, 5540, 40],                                                                                          // 227
      ['mix', { t: 94 }, 260, 5100],                                                                                                                  // 228
      ['edges', { strength: 80 }, 2020, 1030],                                                                                                        // 229
      ['perlin', { scale: 5, details: 2, contrast: 40 }, 40, 5870],                                                                                   // 230
      ['maprange', { outLo: 25, outHi: 100 }, 260, 5210],                                                                                             // 231
      ['blur', { radius: 2, '~radius': '0.8,6.1' }, 2460, 810],                                                                                       // 232
      ['math', { op: 'multiply' }, 2240, 810],                                                                                                        // 233
      ['threshold', { at: 14, soft: 4 }, 2680, 810],                                                                                                  // 234
      ['motionblur', { length: 40, angle: 0 }, 260, 5320],                                                                                            // 235
      ['perlin', { scale: 60, details: 2, contrast: 70 }, 40, 5980],                                                                                  // 236
      ['threshold', { at: 28, soft: 10 }, 480, 1800],                                                                                                 // 237
      ['math', { op: 'multiply' }, 2900, 1140],                                                                                                       // 238
      ['blend', { mode: 'normal', opacity: 92 }, 5760, 40],                                                                                           // 239
      ['bloom', { species: 60.42, part: 40, sheet: 100, stage: 55, jitter: 60, lit: 0, variant: 3 }, 260, 5430],                                      // 240
      ['scatter', { shape: 'picture', ground: 'black is clear', count: 24, '~count': '0,90', size: 20, '~size': '14,28', vary: 45, turn: 100, clump: 40, fade: 0, layers: 'last thrown', per: 'for the page', sheet: 'a sheet of 16' }, 480, 1910],// 241
      ['blend', { mode: 'normal', opacity: 100 }, 5980, 40],                                                                                          // 242
      ['blend', { mode: 'multiply', opacity: 14 }, 6200, 40],                                                                                         // 243
      ['surface', { name: 'Sunrise Scroll', ground: 'colour' }, 6420, 40],
      ['knob', { slot: '9' }, 40, 6100],                                                                                      // 245
      ['scrolllands', { land: 0, amount: 70, scale: 100, variant: 0 }, 5540, 480],                                            // 246
      ['blend', { mode: 'normal', opacity: 100 }, 5760, 700],                                                                 // 247 (the land's washes, in the Mountain Hue)
      ['blend', { mode: 'normal', opacity: 100 }, 5760, 810],                                                                 // 248 (its water, in the Sky Hue)
      ['blend', { mode: 'normal', opacity: 100 }, 5760, 920],                                                                 // 249 (its gates and miasma, in the Sun Hue)
      ['blend', { mode: 'normal', opacity: 100 }, 5760, 1030],                                                                // 250 (its blossom, in the Blossom Hue)
      ['blend', { mode: 'normal', opacity: 100 }, 5760, 1140],                                                                // 251 (its bare paper: snow, foam, mist, walls)
      ['blend', { mode: 'normal', opacity: 100 }, 5760, 1250]],                                                               // 252 (its ink)                                                                           // 244
    wires: [[9, 1, 17, 1], [18, 1, 19, 1], [7, 1, 19, 'outHi'], [10, 1, 20, 1], [11, 1, 20, 2], [10, 1, 21, 1], [20, 1, 21, 2],
      [19, 1, 21, 3], [16, 1, 22, 1], [22, 1, 23, 1], [24, 1, 23, 2], [21, 1, 25, 1], [12, 1, 25, 2], [23, 1, 25, 3], [9, 1, 26, 1], [27, 2, 29, 1],
      [28, 1, 29, 2], [29, 1, 31, 1], [29, 1, 31, 2], [31, 1, 33, 1], [32, 1, 33, 2], [30, 1, 34, 1], [33, 1, 34, 2], [26, 1, 35, 'x'],
      [34, 1, 35, 'y'], [25, 1, 36, 1], [15, 1, 36, 2], [35, 1, 36, 3], [16, 1, 37, 1], [16, 1, 38, 1], [37, 1, 39, 1], [38, 1, 39, 2],
      [39, 1, 40, 2], [5, 1, 40, 'count'], [41, 1, 40, 'size'], [40, 1, 43, 1], [43, 1, 44, 1], [44, 1, 42, 1],
      [45, 1, 42, 'angle'], [46, 1, 42, 'radius'], [47, 1, 42, 'x'],
      [48, 1, 42, 'y'], [42, 1, 49, 1], [49, 1, 50, 1], [10, 1, 51, 1], [12, 1, 51, 2], [10, 1, 52, 1], [12, 1, 52, 2], [54, 1, 53, 1],
      [50, 1, 53, 2], [9, 1, 53, 7], [53, 2, 55, 1], [8, 1, 55, 'steps'], [55, 1, 57, 1], [57, 1, 56, 1], [51, 1, 56, 2],
      [52, 1, 56, 3], [10, 1, 56, 4], [36, 1, 58, 1], [56, 1, 58, 2], [49, 1, 58, 3], [49, 1, 59, 1], [60, 1, 61, 1], [59, 1, 63, 1], [61, 1, 63, 2],
      [63, 1, 62, 1], [3, 1, 62, 'radius'], [62, 1, 64, 1], [66, 1, 65, 1], [65, 1, 67, 1], [64, 1, 68, 1], [67, 1, 68, 2], [58, 1, 69, 1],
      [11, 1, 69, 2], [68, 1, 69, 3], [11, 1, 70, 1], [13, 1, 70, 2], [4, 1, 70, 3], [16, 1, 71, 1], [74, 1, 72, 'variation'],
      [75, 1, 73, 'variation'], [72, 1, 76, 1], [73, 1, 76, 2], [76, 1, 77, 1], [77, 1, 79, 1], [78, 1, 79, 2], [80, 1, 81, 1],
      [79, 1, 82, 1], [81, 1, 82, 2], [82, 1, 84, 1], [54, 1, 84, 2], [84, 1, 85, 1], [84, 1, 85, 2], [85, 1, 83, 1], [83, 1, 86, 1], [83, 1, 86, 2],
      [86, 1, 87, 1], [1, 1, 87, 'outHi'], [87, 1, 88, 1], [71, 1, 88, 2], [88, 1, 89, 1], [16, 1, 90, 1],
      [2, 1, 90, 'inLo'], [10, 1, 91, 1], [70, 1, 91, 2], [89, 1, 92, 1], [93, 1, 94, 1], [92, 1, 95, 1], [94, 1, 95, 2],
      [91, 1, 96, 1], [11, 1, 96, 2], [91, 1, 97, 1], [10, 1, 97, 2], [54, 1, 98, 1], [95, 1, 98, 2], [9, 1, 98, 7], [98, 2, 99, 1],
      [8, 1, 99, 'steps'], [99, 1, 101, 1], [101, 1, 100, 1], [96, 1, 100, 2], [91, 1, 100, 3], [97, 1, 100, 4], [89, 1, 102, 1],
      [90, 1, 102, 2], [69, 1, 103, 1], [100, 1, 103, 2], [102, 1, 103, 3], [10, 1, 104, 1], [11, 1, 104, 2], [89, 1, 105, 1], [106, 1, 107, 1],
      [105, 1, 109, 1], [107, 1, 109, 2], [109, 1, 108, 1], [3, 1, 108, 'radius'], [108, 1, 110, 1], [112, 1, 111, 1], [111, 1, 113, 1],
      [110, 1, 114, 1], [113, 1, 114, 2], [103, 1, 115, 1], [104, 1, 115, 2], [114, 1, 115, 3], [16, 1, 116, 1],
      [119, 1, 117, 'variation'], [120, 1, 118, 'variation'], [117, 1, 121, 1], [118, 1, 121, 2], [121, 1, 122, 1],
      [122, 1, 123, 1], [78, 1, 123, 2], [124, 1, 125, 1], [123, 1, 126, 1], [125, 1, 126, 2], [126, 1, 128, 1], [54, 1, 128, 2], [128, 1, 129, 1],
      [128, 1, 129, 2], [129, 1, 127, 1], [127, 1, 130, 1], [127, 1, 130, 2], [130, 1, 131, 1], [1, 1, 131, 'outHi'], [131, 1, 132, 1],
      [116, 1, 132, 2], [132, 1, 133, 1], [16, 1, 134, 1], [2, 1, 134, 'inLo'], [10, 1, 135, 1], [70, 1, 135, 2], [133, 1, 136, 1],
      [137, 1, 138, 1], [136, 1, 139, 1], [138, 1, 139, 2], [135, 1, 140, 1], [11, 1, 140, 2], [135, 1, 141, 1], [10, 1, 141, 2], [54, 1, 142, 1],
      [139, 1, 142, 2], [9, 1, 142, 7], [142, 2, 143, 1], [8, 1, 143, 'steps'], [143, 1, 145, 1], [145, 1, 144, 1], [140, 1, 144, 2],
      [135, 1, 144, 3], [141, 1, 144, 4], [133, 1, 146, 1], [134, 1, 146, 2], [115, 1, 147, 1], [144, 1, 147, 2], [146, 1, 147, 3], [10, 1, 148, 1],
      [11, 1, 148, 2], [133, 1, 149, 1], [150, 1, 151, 1], [149, 1, 153, 1], [151, 1, 153, 2], [153, 1, 152, 1], [3, 1, 152, 'radius'],
      [152, 1, 154, 1], [156, 1, 155, 1], [155, 1, 157, 1], [154, 1, 158, 1], [157, 1, 158, 2], [147, 1, 159, 1], [148, 1, 159, 2], [158, 1, 159, 3],
      [16, 1, 160, 1], [163, 1, 161, 'variation'], [164, 1, 162, 'variation'], [161, 1, 165, 1], [162, 1, 165, 2],
      [165, 1, 166, 1], [166, 1, 167, 1], [78, 1, 167, 2], [168, 1, 169, 1], [167, 1, 170, 1], [169, 1, 170, 2], [170, 1, 171, 1],
      [1, 1, 171, 'outHi'], [171, 1, 172, 1], [160, 1, 172, 2], [172, 1, 173, 1], [16, 1, 174, 1],
      [2, 1, 174, 'inLo'], [10, 1, 175, 1], [70, 1, 175, 2], [173, 1, 176, 1], [177, 1, 178, 1], [176, 1, 179, 1], [178, 1, 179, 2],
      [175, 1, 180, 1], [11, 1, 180, 2], [175, 1, 181, 1], [10, 1, 181, 2], [54, 1, 182, 1], [179, 1, 182, 2], [9, 1, 182, 7], [182, 2, 183, 1],
      [8, 1, 183, 'steps'], [183, 1, 185, 1], [185, 1, 184, 1], [180, 1, 184, 2], [175, 1, 184, 3], [181, 1, 184, 4], [173, 1, 186, 1],
      [174, 1, 186, 2], [159, 1, 187, 1], [184, 1, 187, 2], [186, 1, 187, 3], [10, 1, 188, 1], [11, 1, 188, 2], [173, 1, 189, 1], [190, 1, 191, 1],
      [189, 1, 193, 1], [191, 1, 193, 2], [193, 1, 192, 1], [3, 1, 192, 'radius'], [192, 1, 194, 1], [196, 1, 195, 1], [195, 1, 197, 1],
      [194, 1, 198, 1], [197, 1, 198, 2], [187, 1, 199, 1], [188, 1, 199, 2], [198, 1, 199, 3], [16, 1, 200, 1],
      [203, 1, 201, 'variation'], [204, 1, 202, 'variation'], [201, 1, 205, 1], [202, 1, 205, 2], [205, 1, 206, 1],
      [206, 1, 207, 1], [78, 1, 207, 2], [208, 1, 209, 1], [207, 1, 210, 1], [209, 1, 210, 2], [210, 1, 211, 1], [1, 1, 211, 'outHi'],
      [211, 1, 212, 1], [200, 1, 212, 2], [212, 1, 213, 1], [16, 1, 214, 1], [2, 1, 214, 'inLo'], [10, 1, 215, 1], [70, 1, 215, 2],
      [213, 1, 216, 1], [217, 1, 218, 1], [216, 1, 219, 1], [218, 1, 219, 2], [215, 1, 220, 1], [11, 1, 220, 2], [215, 1, 221, 1], [10, 1, 221, 2],
      [54, 1, 222, 1], [219, 1, 222, 2], [9, 1, 222, 7], [222, 2, 223, 1], [8, 1, 223, 'steps'], [223, 1, 225, 1], [225, 1, 224, 1],
      [220, 1, 224, 2], [215, 1, 224, 3], [221, 1, 224, 4], [213, 1, 226, 1], [214, 1, 226, 2], [199, 1, 227, 1], [224, 1, 227, 2], [226, 1, 227, 3],
      [10, 1, 228, 1], [11, 1, 228, 2], [213, 1, 229, 1], [230, 1, 231, 1], [229, 1, 233, 1], [231, 1, 233, 2], [233, 1, 232, 1],
      [3, 1, 232, 'radius'], [232, 1, 234, 1], [236, 1, 235, 1], [235, 1, 237, 1], [234, 1, 238, 1], [237, 1, 238, 2], [227, 1, 239, 1],
      [228, 1, 239, 2], [238, 1, 239, 3], [9, 1, 240, 1], [14, 1, 240, 2], [14, 1, 240, 3], [14, 1, 240, 4], [240, 1, 241, 1],
      [6, 1, 241, 'count'], [252, 1, 242, 1], [49, 1, 246, 1], [102, 1, 246, 2], [146, 1, 246, 3], [186, 1, 246, 4], [226, 1, 246, 5], [245, 1, 246, 'land'], [239, 1, 247, 1], [13, 1, 247, 2], [246, 2, 247, 3], [247, 1, 248, 1], [12, 1, 248, 2], [246, 3, 248, 3], [248, 1, 249, 1], [15, 1, 249, 2], [246, 5, 249, 3], [249, 1, 250, 1], [14, 1, 250, 2], [246, 6, 250, 3], [250, 1, 251, 1], [10, 1, 251, 2], [246, 4, 251, 3], [251, 1, 252, 1], [11, 1, 252, 2], [246, 1, 252, 3], [241, 4, 242, 2], [241, 1, 242, 3], [242, 1, 243, 1], [17, 1, 243, 2], [243, 1, 244, 1]] },
  feathers: { label: 'Feathers', canvas: true, teach: 'Feathers drifting over the page, on a transparent ground, so they lie on the page’s colour or on another surface and blend with it. One part makes them: Feathers draws each one as a shaft with a vane each side made of fine barbs that lean toward the tip, held together where the vane is whole, parting into V-shaped gaps where it splits, and loose and wavy where it is down (always at the foot, and over the whole feather as Fluff rises). The seed picks how they lie (scattered, drifting one way, fanned, or fallen to the bottom) and each feather’s kind: a contour feather, broad and round-tipped; a flight feather, long, its leading vane narrow; a soft plume. The Light Dial lights each vane as a shallow roof over the shaft, and Lift casts their soft shadows away from it; Depth sets some farther off, smaller, fainter and out of focus. Markings runs from plain, through bars, to eyes near the tips, in the Tip Hue. Try: Multiply on a pale page, Fluff high and Depth high, for down drifting in the air. Its six hues colour everything it draws: the feathers and their tips, a faint sheen in two colours that turns with the light, the pale parts and the dark.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 120],                 // 2
      ['knob', { slot: '3' }, 40, 200],                    // 3
      ['knob', { slot: '4' }, 40, 280],                     // 4
      ['knob', { slot: '5' }, 40, 360],                   // 5
      ['knob', { slot: '6' }, 40, 440],                  // 6
      ['knob', { slot: '7' }, 40, 520],                    // 7
      ['knob', { slot: '8' }, 40, 600],                     // 8
      ['dial', {}, 40, 680],                                                       // 9
      ['hue', { slot: '1', name: 'Feather Hue' }, 40, 760],                        // 10
      ['hue', { slot: '2', name: 'Tip Hue' }, 40, 840],                            // 11
      ['feathers', { bird: 0, size: 100, '~size': '40,250', count: 30, '~count': '0,100', fluff: 15, '~fluff': '0,100', curl: 30, '~curl': '0,100', splits: 30, '~splits': '0,100',
        marks: 0, '~marks': '0,100', sheen: 15, depth: 50, '~depth': '0,100', lift: 50, '~lift': '0,100' }, 320, 300],   // 12
      ['surface', { name: 'Feathers', ground: 'colour' }, 600, 320],               // 13
      ['hue', { slot: '3', name: 'Sheen Hue' }, 40, 920],                          // 14
      ['hue', { slot: '4', name: 'Second Sheen Hue' }, 40, 1000],                  // 15
      ['hue', { slot: '5', name: 'Pale Hue' }, 40, 1080],                          // 16
      ['hue', { slot: '6', name: 'Dark Hue' }, 40, 1160]],                         // 17
    wires: [[1, 1, 12, 'size'], [2, 1, 12, 'count'], [3, 1, 12, 'fluff'], [4, 1, 12, 'curl'],
      [5, 1, 12, 'splits'], [6, 1, 12, 'marks'], [7, 1, 12, 'depth'], [8, 1, 12, 'lift'],
      [9, 1, 12, 1], [10, 1, 12, 2], [11, 1, 12, 3], [14, 1, 12, 4], [15, 1, 12, 5], [16, 1, 12, 6], [17, 1, 12, 7], [12, 1, 13, 1]] },
  // 🪶 Corvid Feathers (Ruby: "really want corvid feathers"): the Feathers part, its Bird on a slider, all six hues wired
  corvids: { label: 'Corvid Feathers', canvas: true, teach: 'The feathers of the crow family, on a transparent ground. One part makes them: Feathers, its Bird on the first slider: a crow’s, matte black with a faint sheen; a raven’s, long and glossy, its sheen strong; a magpie’s, black with a white inner web near the foot and a green-blue-purple sheen; a blue jay’s, blue, barred dark, tipped pale. Their sheen is structural colour, as a real feather’s is: it turns between the two Sheen Hues with the angle between each barb and the light, strongest where it faces the Light Dial. Every colour is a hue: Feather, Tip, the two Sheens, Pale and Dark. Try: Raven, Sheen high, and turn the light dial slowly.', nodes: [
      ['knob', { slot: '1' }, 40, 40], ['knob', { slot: '2' }, 40, 120], ['knob', { slot: '3' }, 40, 200],
      ['knob', { slot: '4' }, 40, 280], ['knob', { slot: '5' }, 40, 360], ['knob', { slot: '6' }, 40, 440],
      ['knob', { slot: '7' }, 40, 520], ['knob', { slot: '8' }, 40, 600],                 // 1–8
      ['dial', {}, 40, 680],                                                                                                         // 9
      ['hue', { slot: '1', name: 'Feather Hue' }, 40, 760], ['hue', { slot: '2', name: 'Tip Hue' }, 40, 840], ['hue', { slot: '3', name: 'Sheen Hue' }, 40, 920],
      ['hue', { slot: '4', name: 'Second Sheen Hue' }, 40, 1000], ['hue', { slot: '5', name: 'Pale Hue' }, 40, 1080], ['hue', { slot: '6', name: 'Dark Hue' }, 40, 1160],   // 10–15
      ['feathers', { bird: 50, '~bird': '0,100', size: 100, '~size': '40,250', count: 25, '~count': '0,100', fluff: 10, '~fluff': '0,100', curl: 25, splits: 30, '~splits': '0,100', sheen: 70, '~sheen': '0,100', depth: 40, '~depth': '0,100', lift: 60, '~lift': '0,100' }, 320, 300],   // 16
      ['surface', { name: 'Corvid Feathers', ground: 'colour' }, 600, 320]],                                                         // 17
    wires: [[1, 1, 16, 'bird'], [2, 1, 16, 'size'], [3, 1, 16, 'count'], [4, 1, 16, 'fluff'],
      [5, 1, 16, 'splits'], [6, 1, 16, 'sheen'], [7, 1, 16, 'depth'], [8, 1, 16, 'lift'],
      [9, 1, 16, 1], [10, 1, 16, 2], [11, 1, 16, 3], [12, 1, 16, 4], [13, 1, 16, 5], [14, 1, 16, 6], [15, 1, 16, 7], [16, 1, 17, 1]] },
  summoning: { label: 'Transmutation Circle', canvas: true, teach: 'A transmutation circle, built from the rim inward as a stack of bands. One part makes it: Transmutation Circle lays rings of glyphs, polygrams and planets, more of them as Complexity rises; Organic ↔ Tech moves its making from hand-drawn vines and moons to machined ticks, circuit traces and hex digits. The Position dial places it: at the dial’s center it sits in the middle of the page. Try: drag the dial out, then raise Complexity.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 40–200)
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 20–300)
      ['knob', { slot: '3' }, 40, 240],                // 3  (30 of 0–100)
      ['camdial', {}, 40, 340],                                                    // 4  (the camera dial places it: Ruby)
      ['transmutation', { zoom: 100, '~zoom': '40,200', amount: 100, '~amount': '20,300', form: 30, '~form': '0,100', from: 'its own reach', reach: 100 }, 320, 100],   // 5
      ['surface', { name: 'Transmutation Circle', ground: 'grey' }, 600, 120]],   // 6
    wires: [[4, 2, 5, 'reach'], [1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🝓 Chladni Sand: sand on a ringing plate, gathered on its still lines, lit by the dial
  chladni: { label: 'Chladni Sand', canvas: true, teach: 'Sand on a metal plate set ringing by a bow (Ernst Chladni, 1787). One part makes it: Chladni Sand. The plate vibrates in a standing wave; the sand is thrown off everything that moves and gathers on the nodal lines, where nothing does. Mode picks how complex the wave is (a few lines, or many), and the seed picks which. Each grain is a lit speck with a small shadow away from the Light Dial. Try: wire a Perlin Noise into the part\'s Where, and the sand gathers where the noise is white instead.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 50–300)
      ['knob', { slot: '2' }, 40, 140],                     // 2  (100 of 20–300)
      ['knob', { slot: '3' }, 40, 240],                     // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['sand', { zoom: 100, '~zoom': '50,300', amount: 100, '~amount': '20,300', form: 40, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'Chladni Sand', ground: 'grey' }, 600, 120]],            // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 2], [5, 1, 6, 1]] },
  // 🝓 Guilloché: a field of interlaced waves and rosettes, engraved and lit by the dial
  guilloche: { label: 'Guilloché', canvas: true, teach: 'The engraved rosettes of banknotes and watch dials, made the way a rose engine makes them. One part does it: Guilloché lays a field of fine interlaced waves, then rosettes over it, each many copies of one wavy loop turned a little each time, so the lines weave into lace, with a spirograph at its heart. The lines are cut into the plate as grooves, lit by the Light Dial. Its second output is the lines alone. Try: wire the Lines output into a Light Engine\'s height, with a Gradient Map as the picture.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1  (100 of 50–250)
      ['knob', { slot: '2' }, 40, 140],             // 2  (100 of 30–200)
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['rosettes', { zoom: 100, '~zoom': '50,250', amount: 100, '~amount': '30,200', form: 45, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'Guilloché', ground: 'grey' }, 600, 120]],               // 6
    wires: [[1, 1, 5, 'zoom'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 1], [5, 1, 6, 1]] },
  // 🝓 Binary Pattern: Bit Grid, drawn on its own soft noise
  mathnoise: { label: 'Binary Pattern', canvas: true, teach: 'One part makes it: Bit Grid, a grid of small marks (filled and empty squares, dashes and bars, mostly dark, some light) that surface wherever a soft noise rises past a gate. Glyph Zoom is the size of a cell, Emergence how low the gate sits: more of the grid shows as it rises. Try: wire a Gradient into Bit Grid\'s Where, so the marks surface from one side of the page.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (140 of 100–500)
      ['knob', { slot: '2' }, 40, 140],                // 2  (130 of 30–240)
      ['bits', { zoom: 140, '~zoom': '100,500', amount: 130, '~amount': '30,240' }, 320, 60],   // 3
      ['surface', { name: 'Binary Pattern', ground: 'grey' }, 600, 80]],          // 4
    wires: [[1, 1, 3, 'zoom'], [2, 1, 3, 'amount'], [3, 1, 4, 1]] },
  // ⎐ Knotwork: Cromwell's plait and breaks → Blur (the ribbon rounded) → Light Engine
  knotwork: { label: 'Knotwork', poem: 'shape', div: 2, teach: 'The interlaced knots of Celtic manuscripts, made the way Peter Cromwell described them. Knotwork lays a plait: diagonal strands crossing at every point of a grid, over then under then over. Breaks turn some strands back instead of crossing them, and that is what makes a knot; the outline (a circle, a square, a cross…) is a ring of breaks. The heights go through Blur, which rounds the ribbon, and the Light Engine raises it from the page. With Shape Aware ticked the knot weaves round your words. Try: Breaks 0 for a plain plait, or raise Strands for a finer knot.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                      // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 130],                  // 2  (6 of 3–24)
      ['knob', { slot: '3' }, 40, 220],                   // 3
      ['knob', { slot: '4' }, 40, 310],                     // 4
      ['knob', { slot: '5' }, 40, 400],             // 5  (55 of 20–90)
      ['knob', { slot: '6' }, 40, 490],                    // 6
      ['dial', {}, 40, 580],                                                       // 7
      ['knotwork', { size: 100, '~size': '40,300', cells: 6, '~cells': '3,24', breaks: 45, '~breaks': '0,100', shape: 0, '~shape': '0,100', width: 55, '~width': '20,90', offset: 0, '~offset': '-100,100' }, 320, 160],   // 8
      ['blur', { radius: 5 }, 600, 260],                                           // 9
      ['material', { relief: 30, gloss: 45, shine: 40, shadow: 60, occlusion: 45, ambient: 40 }, 840, 180],   // 10
      ['surface', { name: 'Knotwork', ground: 'grey', aa: 'edges only' }, 1080, 200]],               // 11
    wires: [[1, 1, 8, 'size'], [2, 1, 8, 'cells'], [3, 1, 8, 'breaks'], [4, 1, 8, 'shape'],
      [5, 1, 8, 'width'], [6, 1, 8, 'offset'], [7, 1, 8, 1], [8, 2, 9, 1], [8, 1, 10, 1], [9, 1, 10, 2], [10, 1, 11, 1]] },
  // 🜉 Lichtenberg Figures: Discharge → Burn into Wood → Light Engine (the dial: where the strike enters, and the light)
  lichtenberg: { label: 'Lichtenberg Figures', div: 2, teach: 'The branching path high voltage burns through a surface. Discharge grows the path: each step goes where the electric potential is highest, so it forks and reaches; Strike Angle is where it enters. The Camera Dial is the camera, wired into Wood, Ground Coordinates and Discharge alike, so the plank and its figure turn, tip and zoom together; the Light Dial is only the light. Material chooses the plank through Map Switch: Wood\'s grain in your two hues, a slate (Noise at Coordinates on the plank, in slate\'s own grays), brushed brass (the same noise stretched along the plank) or a clear acrylic block. Burn chars the channels into wood, etches them pale into slate and brass, or lights them inside the acrylic; Depth sinks them and raises the relief; the Light Engine lights it, and Glow makes the channels give off your Glow Hue (black: none). Try: Material on Brass with a Glow Hue, then pull the camera low across the plank.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1
      ['knob', { slot: '2' }, 40, 120],                // 2
      ['knob', { slot: '3' }, 40, 200],                    // 3  (2 of 1–3)
      ['knob', { slot: '4', name: 'Material', def: 0, kind: 'steps', steps: 4, names: 'Charred Wood, Slate, Brass, Acrylic' }, 40, 280],   // 4
      ['knob', { slot: '5', name: 'Strike Angle', def: 87.5, kind: 'angle' }, 40, 360],   // 5  (315°)
      ['knob', { slot: '6' }, 40, 440],                    // 6
      ['knob', { slot: '7' }, 40, 520],           // 7  (100 of 30–300)
      ['knob', { slot: '8' }, 40, 600],                    // 8  (0 of −100–100)
      ['camdial', {}, 40, 700], ['dial', {}, 40, 800],                             // 9, 10
      ['hue', { slot: '1', name: 'Wood Hue' }, 40, 880], ['hue', { slot: '2', name: 'Grain Hue' }, 40, 960], ['glowhue', {}, 40, 1040],   // 11, 12, 13
      ['wood', { rings: 40, figure: 50, turn: 0, '~turn': '0,360', view: 0, '~view': '0,100', lens: 100, '~lens': '25,400' }, 300, 700],   // 14
      ['groundview', { turn: 0, '~turn': '0,360', view: 0, '~view': '0,100', lens: 100, '~lens': '25,400' }, 300, 860],   // 15
      ['mapnoise', { size: 35, octaves: 7, rough: 60, ridges: 20, variation: 3 }, 560, 860],   // 16 (slate)
      ['tint', {}, 800, 860],                                                      // 17 (between slate's own grays)
      ['number', { value: 4 }, 300, 1000], ['math', { op: 'multiply' }, 560, 1000],   // 18, 19 (brushed: along the plank, stretched)
      ['mapnoise', { size: 1, octaves: 5, rough: 50, variation: 7 }, 800, 1000],  // 20
      ['colour', { hex: '#E2C27A' }, 800, 1100], ['colour', { hex: '#9C7836' }, 800, 1180], ['tint', {}, 1040, 1000],   // 21, 22, 23 (brass)
      ['mapswitch', { soft: 0 }, 1280, 760],                                       // 24 (the plank, by Material)
      ['discharge', { reach: 50, '~reach': '0,100', branching: 50, '~branching': '0,100', poles: 2, '~poles': '1,3', grain: 30, width: 100, '~width': '30,300', zoom: 100, offset: 0, '~offset': '-100,100',
        turn: 0, '~turn': '0,360', view: 0, '~view': '0,100', lens: 100, '~lens': '25,400' }, 300, 120],   // 25
      ['threshold', { at: 90, soft: 1 }, 560, 360], ['threshold', { at: 15, soft: 1 }, 560, 440], ['math', { op: 'subtract' }, 800, 440],   // 26 (acrylic), 27, 28 (etched: slate or brass)
      ['burn', { material: 0, '~material': '0,100', scorch: 50, depth: 55, '~depth': '10,100', etch: 0, '~etch': '0,100' }, 1520, 300],   // 29
      ['material', { relief: 35, '~relief': '0,70', gloss: 30, '~gloss': '25,70', shine: 25, '~shine': '25,75', shadow: 55, occlusion: 40, ambient: 40 }, 1760, 300],   // 30
      ['glow', { radius: 10, aura: 40, strength: 85, auraK: 35, core: 45, hex: '#000000' }, 2000, 300],   // 31
      ['surface', { name: 'Lichtenberg Figures', ground: 'colour' }, 2240, 320],   // 32
      ['colour', { hex: '#6E7680' }, 560, 940], ['colour', { hex: '#2A2E35' }, 560, 1020]],   // 33, 34 (slate's grays)
    wires: [[1, 1, 25, 'reach'], [2, 1, 25, 'branching'], [3, 1, 25, 'poles'], [5, 1, 25, 1],
      [7, 1, 25, 'width'], [8, 1, 25, 'offset'],
      [9, 1, 14, 'turn'], [9, 2, 14, 'view'], [9, 3, 14, 'lens'],
      [9, 1, 15, 'turn'], [9, 2, 15, 'view'], [9, 3, 15, 'lens'],
      [9, 1, 25, 'turn'], [9, 2, 25, 'view'], [9, 3, 25, 'lens'],
      [11, 1, 14, 1], [12, 1, 14, 2],
      [15, 1, 16, 1], [15, 2, 16, 2], [15, 3, 16, 3], [16, 1, 17, 1], [33, 1, 17, 2], [34, 1, 17, 3],
      [15, 1, 19, 1], [18, 1, 19, 2], [19, 1, 20, 1], [15, 2, 20, 2], [15, 3, 20, 3], [20, 1, 23, 1], [21, 1, 23, 2], [22, 1, 23, 3],
      [4, 1, 24, 1], [14, 1, 24, 2], [17, 1, 24, 3], [23, 1, 24, 4], [14, 1, 24, 5],
      [4, 1, 26, 1], [4, 1, 27, 1], [27, 1, 28, 1], [26, 1, 28, 2],
      [24, 1, 29, 1], [25, 1, 29, 2], [26, 1, 29, 'material'], [28, 1, 29, 'etch'], [6, 1, 29, 'depth'],
      [29, 1, 30, 1], [29, 2, 30, 2], [10, 1, 30, 7], [6, 1, 30, 'relief'], [4, 1, 30, 'gloss'], [4, 1, 30, 'shine'],
      [30, 1, 31, 1], [25, 1, 31, 2], [13, 1, 31, 3], [31, 1, 32, 1]] },
  // 🜉 Ruffled Growth: Differential Growth, its body raised and lit
  growth: { label: 'Ruffled Growth', div: 2, teach: 'Differential growth: Differential Growth starts as small loops whose points push each other apart, follow their neighbours and split where they stretch, so the loops ruffle and fold the way lettuce, coral and brains do. The Light Dial goes into Sun: the line grows toward it. Its body becomes a raised surface (Mix makes the picture, the relief goes to the Light Engine). Try: raise Seeds, or wire the line itself into Burn over a Wood.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                    // 1
      ['knob', { slot: '2' }, 40, 140],                // 2  (100 of 50–250)
      ['knob', { slot: '3' }, 40, 240],                     // 3  (1 of 1–7)
      ['knob', { slot: '4' }, 40, 340],                   // 4
      ['dial', {}, 40, 440],                                                       // 5
      ['growline', { growth: 55, '~growth': '0,100', fold: 100, '~fold': '50,250', seeds: 1, '~seeds': '1,7', photo: 40, zoom: 100, '~zoom': '50,400', offset: 0, '~offset': '-100,100' }, 300, 120],   // 6
      ['number', { value: 40 }, 300, 380], ['number', { value: 74 }, 300, 460],   // 7, 8 (the ground, the body)
      ['mix', { t: 50 }, 560, 300],                                                // 9
      ['number', { value: 18 }, 560, 460],                                         // 10 (the line's crease)
      ['mix', { t: 50 }, 780, 300],                                                // 11
      ['material', { relief: 40, '~relief': '0,90', gloss: 35, shine: 30, shadow: 55, occlusion: 45, ambient: 40 }, 1000, 200],   // 12
      ['surface', { name: 'Ruffled Growth', ground: 'grey', aa: 'edges only' }, 1240, 220],          // 13
      ['knob', { slot: '5' }, 40, 540], ['knob', { slot: '6' }, 40, 620]],   // 14 (100 of 50–400), 15
    wires: [[1, 1, 6, 'growth'], [2, 1, 6, 'fold'], [3, 1, 6, 'seeds'], [4, 1, 12, 'relief'],
      [5, 1, 6, 1], [7, 1, 9, 1], [8, 1, 9, 2], [6, 2, 9, 3], [9, 1, 11, 1], [10, 1, 11, 2], [6, 1, 11, 3], [11, 1, 12, 1], [6, 3, 12, 2], [12, 1, 13, 1], [14, 1, 6, 'zoom'], [15, 1, 6, 'offset']] },
  // 🜚 Poured Wax (Ruby: waxier, and a slider from wax to a fluid's spatter): Pours → Meniscus → colour → Light Engine
  wax: { label: 'Poured Wax', div: 2, teach: 'Pours makes the pools (pools that touch merge); Splatter flings drops away from where the dial points, so it becomes a spatter of paint or ink. Meniscus gives the pools a flat top and a rounded edge. The wax is lighter where it is thin (Hue & Saturation brightens it, Mix lays it in by Thin), and the Light Engine lights it with Translucency, the way light sinks into wax and comes back out. The Glow Hue is screened in where the wax is thick, as if a candle were inside it. Try: Splatter 80 and Viscosity 0 for spilt ink, Sheen 100 for wet paint.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 40–400)
      ['knob', { slot: '2' }, 40, 130],               // 2  (100 of 25–300)
      ['knob', { slot: '3' }, 40, 220],                // 3
      ['knob', { slot: '4' }, 40, 310],                  // 4
      ['knob', { slot: '5' }, 40, 400],                   // 5
      ['knob', { slot: '6' }, 40, 490],                    // 6
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
    wires: [[1, 1, 10, 'size'], [2, 1, 10, 'count'], [3, 1, 10, 'viscosity'], [3, 1, 11, 'viscosity'], [4, 1, 10, 'splatter'],
      [5, 1, 11, 'height'], [6, 1, 16, 'gloss'], [6, 1, 16, 'shine'], [7, 1, 10, 1], [7, 1, 16, 7],
      [10, 1, 11, 1], [8, 1, 12, 1], [8, 1, 13, 1], [12, 1, 13, 2], [11, 3, 13, 3], [14, 1, 15, 1], [13, 1, 15, 2], [11, 2, 15, 3],
      [15, 1, 16, 1], [11, 1, 16, 2], [16, 1, 17, 1], [9, 1, 17, 2], [11, 4, 17, 3], [17, 1, 18, 1]] },
  // 🜚 Contour Map: Terrain → Contour Lines, inked over the land lit by the Light Engine (the hillshade)
  contour: { label: 'Contour Map', poem: 'shape', div: 2, teach: 'A survey of an imagined land. Terrain makes the land\'s heights. The Light Engine lights a plain gray picture by those heights (the hillshade), and Mix fades it toward plain gray by the Hillshade knob. Contour Lines draws the lines of equal height, every fifth heavier; the last Mix inks them over the hillshade in the Ink color. With Shape Aware ticked the land under your words is levelled, so the contours ring the poem. Try: wire another texture, or a Gradient, into Contour Lines instead of the Terrain.', nodes: [
      ['knob', { slot: '1' }, 40, 40],             // 1  (100 of 40–300)
      ['knob', { slot: '2' }, 40, 160],         // 2  (100 of 30–250)
      ['knob', { slot: '3' }, 40, 280],                // 3
      ['terrain', { scale: 100, '~scale': '40,300', crests: 22, variant: 0 }, 300, 40],   // 4
      ['number', { value: 50 }, 300, 220],                                         // 5  (a plain gray picture)
      ['material', { relief: 200, gloss: 5, shine: 0, shadow: 35, occlusion: 15, ambient: 45 }, 560, 160],   // 6
      ['mix', { t: 45, '~t': '0,100' }, 820, 200],                                 // 7  (the hillshade, faded to gray)
      ['contours', { levels: 20, '~levels': '6,50', weight: 100, index: 5, strength: 90 }, 560, 0],   // 8
      ['colour', { hex: '#222222' }, 820, 20],                                     // 9  (the ink)
      ['mix', { t: 50 }, 1060, 100],                                               // 10 (the lines inked over it)
      ['surface', { name: 'Contour Map', ground: 'grey', aa: 'edges only' }, 1300, 100]],            // 11
    wires: [[1, 1, 4, 'scale'], [2, 1, 8, 'levels'], [3, 1, 7, 't'],
      [5, 1, 6, 1], [4, 1, 6, 2], [5, 1, 7, 1], [6, 1, 7, 2], [4, 1, 8, 1], [7, 1, 10, 1], [9, 1, 10, 2], [8, 1, 10, 3], [10, 1, 11, 1]] },
  // ∆ Turing Skin: Turing Pattern → raised by the Light Engine
  turing: { label: 'Turing Skin', poem: 'shape', div: 2, teach: 'Turing Pattern grows the marks of an animal\'s skin or a coral (Pattern slides from spots to holes). Map Range turns it into a picture, the marks a little lighter than the skin between, and the Light Engine raises the marks by Relief and lights them by the dial. With Shape Aware ticked the pattern grows up to your words and follows their edges. Try: wire the Turing Pattern into a Color Ramp first, or set Pattern to Maze.', nodes: [
      ['knob', { slot: '1' }, 40, 40],             // 1  (100 of 50–250)
      ['knob', { slot: '2' }, 40, 140],                   // 2  (80 of 20–100)
      ['knob', { slot: '3' }, 40, 240],                  // 3
      ['knob', { slot: '4' }, 40, 340],                   // 4
      ['grayscott', { pattern: 25, '~pattern': '0,100', growth: 80, '~growth': '20,100', scale: 100, '~scale': '50,250', variant: 0 }, 300, 80],   // 5
      ['maprange', { inLo: 0, inHi: 100, outLo: 31, outHi: 69 }, 560, 40],          // 6  (the skin 128 ∓ 48)
      ['material', { relief: 23, '~relief': '6,40', gloss: 35, shine: 47, shadow: 45, occlusion: 40, ambient: 45 }, 800, 120],   // 7
      ['surface', { name: 'Turing Skin', ground: 'grey' }, 1060, 140]],            // 8
    wires: [[1, 1, 5, 'scale'], [2, 1, 5, 'growth'], [3, 1, 5, 'pattern'], [4, 1, 7, 'relief'],
      [5, 1, 6, 1], [6, 1, 7, 1], [5, 1, 7, 2], [7, 1, 8, 1]] },
  // 🜁 Rain on Water: Raindrops (each drop a ring wave, the newest splashing) → the water's colour by distance → Light Engine → Glow
  // ◯ Ringworld (Ruby: "an abstract ring world on a space background and then something made of shapes then
  // painted in the foreground and blend it"): flat shapes, blocked in, then painted over with Oil Paint's brushes
  skyring: { label: 'Ring in the Sky', canvas: true, teach: 'A ringworld seen from out in space, as a simple, cosmic picture to lay behind a poem (Ruby: "that simplified, but cosmic"). Starfield lays the stars. Ring in the Sky paints the ring round its star as a solid band in flat blocks: across the far side its land, facing the star, land, sea and white cloud, striped with the nights the shadow squares cast, between the rim walls that hold its air; across the near side its hull, passing in front of the star; the air it holds glowing faintly about it; the nebula\'s washes and the air of your Sky Hue rising from below. The Camera Dial moves the ring: Turn spins it, View raises your eye from edge-on to looking down into it, Zoom sizes it; Star Height raises or lowers it on the page. The Light Dial shades the hull. Paint lays Oil Paint over it with the Brush you choose; at 0 it stays flat. Try: wire Land of Shapes after Ring in the Sky for a land under it, or turn View down for the ring edge-on across the star.', nodes: [
      ['knob', { slot: '1' }, 40, 40],               // 1
      ['knob', { slot: '2' }, 40, 120],                   // 2
      ['knob', { slot: '3' }, 40, 200],                  // 3
      ['knob', { slot: '4' }, 40, 280],                     // 4
      ['knob', { slot: '5' }, 40, 360],             // 5
      ['knob', { slot: '6' }, 40, 440],                    // 6
      ['knob', { slot: '7' }, 40, 520],                   // 7
      ['dial', {}, 40, 600], ['camdial', {}, 40, 680],                            // 8, 9
      ['hue', { slot: '1', name: 'Land Hue' }, 40, 760], ['hue', { slot: '2', name: 'Sky Hue' }, 40, 840],   // 10, 11
      ['starfield', { amount: 45, '~amount': '5,100', atmosphere: 10 }, 320, 80],                                     // 12
      ['ringsky', { width: 45, '~width': '0,100', tilt: 33, turn: 8, size: 100, '~size': '63,250', centre: 45, '~centre': '15,85', haze: 60, '~haze': '0,100', nebula: 50, '~nebula': '0,100' }, 600, 120],   // 13
      ['oilpaint', { amount: 0, '~amount': '0,100', size: 100, length: 120, detail: 30, vary: 55, brush: 37, '~brush': '0,100' }, 880, 160],   // 14
      ['material', { relief: 16, gloss: 25, shine: 30, shadow: 40, occlusion: 25, ambient: 50 }, 1160, 180],   // 15
      ['surface', { name: 'Ring in the Sky', ground: 'colour' }, 1440, 160]],                                       // 16
    wires: [[1, 1, 13, 'width'], [2, 1, 12, 'amount'], [3, 1, 13, 'nebula'], [4, 1, 13, 'haze'],
      [5, 1, 13, 'centre'], [6, 1, 14, 'amount'], [7, 1, 14, 'brush'],
      [8, 1, 13, 2], [9, 1, 13, 'turn'], [9, 2, 13, 'tilt'], [9, 3, 13, 'size'],
      [10, 1, 13, 3], [11, 1, 13, 4], [12, 1, 13, 1], [13, 1, 14, 1], [14, 1, 15, 1], [14, 2, 15, 2], [15, 1, 16, 1]] },
  // (SEALED (Ruby: "it definitely shouldn't be [loadable in the Athanor] … it's pretty special"): its chain draws the page,
  //  but it never opens in the Athanor, and its parts are nowhere in the Athanor's menus, so the Ringworld can grow into an
  //  engine of its own)
  ringpaint: { label: 'Ringworld', canvas: true, sealed: true, teach: 'A ringworld seen from its own floor, painted in flat shapes rather than rendered. It sees through the same camera as Ringworld: the Camera Dial turns you to look along the ring (the land rising ahead into the arch), across it (the rim wall standing at the horizon, the arch crossing the sky), or up; Altitude lifts you from the grass to high over the land. The Light Dial is the sun and the day: its handle is where the sun stands round you (the way you face at that camera turn, so turning the camera turns past it, and the land is lit from it), overhead noon, at its rim dusk on the horizon, past it night, when the arch still shines where its own day is and the cities light. The Arch paints the sky: space and its stars (Starfield), the air thick at the horizon, the star at the ring\'s middle with its shadow squares circling it (one ring in four orbits a gas giant, Saturn, Jupiter, Neptune or Uranus, which hangs huge in its sky beyond the far arch with its moons: The Arch\'s Gas Giant setting), turning slowly with the stars as the ring spins, and the ring\'s far floor climbing into the arch in patches of land, sea, forest and city, its rim walls along both edges. Land on the Ring paints the floor you stand on, ridge behind ridge from the walls\' feet to your own, each cut in facets and lit, with what grows, lives and stands on it. Half of every ring is wilds; the rest lies in regions of its other worlds (Cities, Neon, Builders, Magic, Ruins), clustered by the seed. Flora is its trees, grass and flowers, and Fauna its wild things (deer at the woods\' edge, hares and now and then a fox in the open, rooks and starlings that lift all at once and settle somewhere else, pigeons in the towns, ducks, swans and a heron at the water, a hawk circling on the rising air, swallows over the fields, bats at dusk, and sometimes a skein of geese going over; and the hunters, fewer: a stoat bounding, a badger at dusk, a lynx in the deep woods, wolves in the cold, jackals in dry country, an owl quartering the fields, a kestrel hanging on the wind; in the magic world drakes, moonharts, lantern moths by night and sky rays rowing high overhead), now and then something small to find (insects, fairies, slime), and the droids at their work; Works its buildings, spires, great spans from wall to wall, bridges of light, circles, crystals, craters, wrecks and ships. Clouds stand over the land at their own distance, among the hills, their shadows lying on the land under them; by day over dry country a dust devil may whirl, and at dusk a murmuration of starlings wheels over the fields. Clutter is what stands about the streets and roads: lamps lighting them, signs and billboards, benches, bicycles, parked cars, hay in the fields. Round every village and town the land is farmed: fields of the crops its climate grows (wheat, hay, pasture, the plough, rapeseed, lavender, vines, rice), hedged in wet country and walled in dry, terraces stepped up the steep, bales on the stubble, a flock and its shepherd droid, now and then a harvester at work; boats are moored off the shore at the end of their jetties; and by night the towns far off are their lights, coming on one by one at dusk. The sky\'s weather comes by the seed: mostly clear, now and then clouds, rarely rain, a storm, snow or fog, and by the place a sunshower, a day of dust, the aurora in the cold, blossom drifting in spring, motes of light in the magic world or ash over the ruins; the sky glows round the sun, burning low at dusk, with the pink Belt of Venus opposite. The two hues color the land and the air; the page\'s two accents are the lights (neon, magic, the fairies). Detail is how far and how finely the land round you is drawn: Low, Medium, High or Ultra (each step slower to make). Time of Day sets the hour by hand; the Light Dial’s turn is then the ring’s heading, where its noon sun stands. Try: World on Neon, then draw the Light Dial past its rim for night, or set Time of Day to Dusk.', nodes: [
      ['knob', { slot: '1' }, 40, 40],               // 1
      ['knob', { slot: '2' }, 40, 120],               // 2
      ['knob', { slot: '3' }, 40, 200],                    // 3
      ['knob', { slot: '4' }, 40, 280],                    // 4
      ['knob', { slot: '5' }, 40, 360],                   // 5
      ['knob', { slot: '6' }, 40, 440],                // 6
      ['knob', { slot: '7' }, 40, 520],                    // 7
      ['knob', { slot: '8' }, 40, 600],                   // 8
      ['dial', {}, 40, 680], ['camdial', {}, 40, 760],                            // 9, 10
      ['hue', { slot: '1', name: 'Land Hue' }, 40, 840], ['hue', { slot: '2', name: 'Sky Hue' }, 40, 920],   // 11, 12
      ['accent', { slot: '1' }, 40, 1000], ['accent', { slot: '2' }, 40, 1080],   // 13, 14 (the page's accents: the lights)
      ['starfield', { amount: 45, '~amount': '5,80', atmosphere: 10 }, 320, 80],                                      // 15
      ['ringarch', { band: 45, '~band': '0,100', walls: 25, '~walls': '0,50', altitude: 15, '~altitude': '0,100', landforms: 50, '~landforms': '0,100', world: 0, '~world': '0,100', life: 50, '~life': '0,100', works: 50, '~works': '0,100', air: 60 }, 600, 120],   // 16
      ['ringland', { band: 45, '~band': '0,100', walls: 25, '~walls': '0,50', altitude: 15, '~altitude': '0,100', landforms: 50, '~landforms': '0,100', world: 0, '~world': '0,100', life: 50, '~life': '0,100', works: 50, '~works': '0,100', clutter: 50, '~clutter': '0,100', air: 60 }, 880, 160],   // 17
      ['material', { relief: 16, gloss: 25, shine: 30, shadow: 40, occlusion: 25, ambient: 50 }, 1440, 220],   // 18
      ['surface', { name: 'Ringworld', ground: 'colour' }, 1720, 200],                                     // 19
      ['knob', { slot: '9' }, 40, 1160]],                                                                  // 20 (Time of Day)
    // (Ruby, 2026-10-25: "remove the 'world' slider": every ring half wilds, its other worlds in stretches by the seed;
    //  the knobs a place up from Flora: 3 Flora, 4 Works, 5 Altitude, 6 Fauna, 7 Detail, 8 Clutter)
    wires: [[1, 1, 16, 'band'], [1, 1, 17, 'band'], [2, 1, 16, 'landforms'], [2, 1, 17, 'landforms'],
      [2, 1, 16, 'walls'], [2, 1, 17, 'walls'],
      [3, 1, 16, 'life'], [3, 1, 17, 'life'], [4, 1, 16, 'works'], [4, 1, 17, 'works'],
      [5, 1, 16, 'altitude'], [5, 1, 17, 'altitude'], [6, 1, 17, 'fauna'], [7, 1, 17, 'detail'], [8, 1, 17, 'clutter'],
      [9, 2, 16, 5], [9, 1, 16, 6], [9, 2, 17, 5], [9, 1, 17, 6], [10, 1, 16, 2], [10, 2, 16, 3], [10, 3, 16, 4], [10, 1, 17, 2], [10, 2, 17, 3], [10, 3, 17, 4],
      [11, 1, 16, 7], [11, 1, 17, 7], [12, 1, 16, 8], [12, 1, 17, 8], [13, 1, 16, 9], [13, 1, 17, 9], [14, 1, 16, 10], [14, 1, 17, 10],
      [15, 1, 16, 1], [16, 1, 17, 1], [17, 1, 18, 1], [18, 1, 19, 1], [20, 1, 16, 'hour'], [20, 1, 17, 'hour']] },
  rainwater: { label: 'Rain on Water', div: 2, teach: 'Rain falling on still water. Raindrops makes every drop that has fallen in the last moment: a ring wave spreading from where it struck, a short packet of ripples that weakens as it widens, the newest still splashing. It hands on three maps: the ripples as heights, the splashes, and how far off each point of the water lies. Tint colors the water by that distance (your Water Hue near, the Sky Hue it reflects toward the horizon), and Displace bends that reflection through the ripples; the Light Engine raises the ripples and catches the light on them; Glow makes the splashes sparkle. View looks from overhead (0) across the water toward the horizon, where the rings grow small and the water calms. Try: Spread at 100 for wide old rings, or wire Raindrops\' Ripples into a Displace to see the poem through the water.', nodes: [
      ['knob', { slot: '1' }, 40, 40],               // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 140],                     // 2
      ['knob', { slot: '3' }, 40, 240],                   // 3
      ['knob', { slot: '4' }, 40, 340],                 // 4
      ['math', { op: 'min' }, 40, 440],                                            // 5  the camera dial's View, at most 1 (0–85, as the View slider was; Ruby: the camera's)
      ['dial', {}, 40, 540],                                                       // 6
      ['hue', { slot: '1', name: 'Water Hue' }, 40, 620], ['hue', { slot: '2', name: 'Sky Hue' }, 40, 700],   // 7, 8
      ['raindrops', { size: 100, '~size': '40,250', rain: 50, '~rain': '0,100', spread: 50, '~spread': '0,100', splash: 40, '~splash': '0,100', view: 35, '~view': '0,85' }, 300, 120],   // 9
      ['tint', {}, 560, 520],                                                      // 10 (the water by distance: near, far)
      ['material', { relief: 110, gloss: 85, shine: 90, shadow: 20, occlusion: 10, ambient: 40 }, 1060, 300],   // 11
      ['glow', { radius: 4, aura: 14, strength: 45, auraK: 10, core: 40, hex: '#EAF4FF' }, 1300, 300],   // 12
      ['surface', { name: 'Rain on Water', ground: 'colour', aa: 'edges only' }, 1540, 320],          // 13
      ['displace', { amount: 35, blur: 10 }, 800, 520],                            // 14 (the reflection bent by the rings)
      ['camdial', {}, 40, 640],                                                    // 15 (the camera: its View looks across the water)
      ['number', { value: 100 }, 40, 700]],                                        // 16
    wires: [[15, 2, 5, 1], [16, 1, 5, 2], [1, 1, 9, 'size'], [2, 1, 9, 'rain'], [3, 1, 9, 'spread'], [4, 1, 9, 'splash'], [5, 1, 9, 'view'],
      [9, 3, 10, 1], [8, 1, 10, 2], [7, 1, 10, 3], [10, 1, 14, 1], [9, 1, 14, 2], [14, 1, 11, 1], [9, 1, 11, 2], [6, 1, 11, 7], [11, 1, 12, 1], [9, 2, 12, 2], [12, 1, 13, 1]] },
  // 🜚 Watercolor Wash: Washes lays two pigments' shapes; a Pigment part lays each on the paper
  watercolour: { label: 'Watercolor Wash', div: 2, teach: 'Washes lays the shapes of two pigments, each a blob drawn forty times over, a little differently each time, so its edges go soft. Each Pigment part lays one of them on the paper as watercolor does: darker at the drying edge, settling in the paper\'s tooth, running toward where the dial points. The second Pigment paints over the first, so where they overlap the colors mix. Try: wire a Cells or a Plain Noise into a Pigment\'s Density instead.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 140],                  // 2  (100 of 30–250)
      ['knob', { slot: '3' }, 40, 240],                  // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Pigment Hue' }, 40, 420], ['hue', { slot: '2', name: 'Second Pigment Hue' }, 40, 500],   // 5, 6
      ['washes', { amount: 100, '~amount': '30,250', size: 100, '~size': '40,250', wet: 50, '~wet': '0,100' }, 300, 60],   // 7
      ['pigment', { wet: 50, '~wet': '0,100' }, 560, 60],                          // 8
      ['pigment', { wet: 50, '~wet': '0,100' }, 800, 160],                         // 9
      ['surface', { name: 'Watercolor Wash', ground: 'colour' }, 1040, 160]],      // 10
    wires: [[1, 1, 7, 'size'], [2, 1, 7, 'amount'], [3, 1, 7, 'wet'], [3, 1, 8, 'wet'], [3, 1, 9, 'wet'],
      [7, 1, 8, 2], [5, 1, 8, 3], [4, 1, 8, 4], [8, 1, 9, 1], [7, 2, 9, 2], [6, 1, 9, 3], [4, 1, 9, 4], [9, 1, 10, 1]] },
  // ♡ Flow-Field Ink: one Flow Lines part, the dial its current
  flowfield: { label: 'Flow-Field Ink', poem: 'shape', canvas: true, teach: 'One part makes it: Flow Lines, which grows evenly spaced ink lines along a current and stops each one short of the others. The Light Dial goes into Flow From, so the current runs the way the dial points; Turbulence bends it into eddies. The two Hues are the inks. With Shape Aware ticked the lines flow round your words, as water round stones. Try: wire a Terrain or a Value Noise into Angle Map, then turn Turbulence up.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1  (100 of 40–250)
      ['knob', { slot: '2' }, 40, 140],                    // 2  (100 of 30–300)
      ['knob', { slot: '3' }, 40, 240],               // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['hue', { slot: '1', name: 'Ink Hue' }, 40, 420], ['hue', { slot: '2', name: 'Second Ink Hue' }, 40, 500],   // 5, 6
      ['flowlines', { amount: 100, '~amount': '30,300', size: 100, '~size': '40,250', turbulence: 50, '~turbulence': '0,100' }, 320, 140],   // 7
      ['surface', { name: 'Flow-Field Ink', ground: 'colour' }, 600, 160]],        // 8
    wires: [[1, 1, 7, 'size'], [2, 1, 7, 'amount'], [3, 1, 7, 'turbulence'],
      [4, 1, 7, 5], [5, 1, 7, 3], [6, 1, 7, 4], [7, 1, 8, 1]] },
  // ♡ First Snow, Burning Mana and Euphoria Dust: one Particles part each, of its own kind
  snow: { label: 'First Snow', canvas: true, teach: 'One part makes it: Particles, set to flakes. The Light Dial goes into Wind From, so the wind blows from where the dial points, and the Wind knob says how hard. The flakes are colored by the Snow Hue (or anything wired into Color A). Try: turn the dial with Wind up, then set Kind to sparks.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                // 1  (100 of 60–340)
      ['knob', { slot: '2' }, 40, 140],                 // 2  (100 of 20–260)
      ['knob', { slot: '3' }, 40, 240],                      // 3
      ['dial', {}, 40, 340],                                                       // 4
      ['particles', { kind: 'flakes', amount: 100, '~amount': '20,260', size: 100, '~size': '60,340', form: 0, '~form': '0,100' }, 320, 100],   // 5
      ['surface', { name: 'First Snow', ground: 'grey' }, 600, 120]],              // 6
    wires: [[1, 1, 5, 'size'], [2, 1, 5, 'amount'], [3, 1, 5, 'form'], [4, 1, 5, 4], [5, 1, 6, 1]] },
  embers: { label: 'Burning Mana', canvas: true, teach: 'One part makes it: Particles, set to sparks, each flung out and bent down by gravity, white-hot at the head. The two Hues color the sparks (they follow the page\'s accents until you set them). Hue Drift lets each spark\'s color stray. Try: wire a Texture into Over to rain sparks on it.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 60–600)
      ['knob', { slot: '2' }, 40, 140],              // 2  (100 of 20–500)
      ['knob', { slot: '3' }, 40, 240],                // 3
      ['hue', { slot: '1', name: 'Ember Hue' }, 40, 340], ['hue', { slot: '2', name: 'Spark Hue' }, 40, 420],   // 4, 5
      ['particles', { kind: 'sparks', amount: 100, '~amount': '20,500', size: 100, '~size': '60,600', form: 10, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Burning Mana', ground: 'grey' }, 600, 120]],            // 7
    wires: [[1, 1, 6, 'size'], [2, 1, 6, 'amount'], [3, 1, 6, 'form'], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  magicparticles: { label: 'Euphoria Dust', canvas: true, teach: 'One part makes it: Particles, set to motes. The two Hues color them (they follow the page\'s accents until you set them). Chaos gathers the dust into trails at 0, scatters it at 50 and bursts it at 100. Try: set Chaos to 0, then 100.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1  (100 of 20–200)
      ['knob', { slot: '2' }, 40, 140],            // 2  (100 of 10–400)
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['hue', { slot: '1', name: 'Sparkle Hue' }, 40, 340], ['hue', { slot: '2', name: 'Glow Hue' }, 40, 420],   // 4, 5
      ['particles', { kind: 'motes', amount: 100, '~amount': '10,400', size: 100, '~size': '20,200', form: 50, '~form': '0,100' }, 320, 100],   // 6
      ['surface', { name: 'Euphoria Dust', ground: 'grey' }, 600, 120]],           // 7
    wires: [[1, 1, 6, 'size'], [2, 1, 6, 'amount'], [3, 1, 6, 'form'], [4, 1, 6, 2], [5, 1, 6, 3], [6, 1, 7, 1]] },
  // √ Halftone: a soft Value Noise for the tone, printed as a Halftone Screen of dots.
  halftone: { label: 'Halftone', poem: 'shape', canvas: true, teach: 'A Value Noise with one octave makes a soft, slow tone; Halftone Screen prints it as dots, each as big as the tone is bright there. Dot Scale is the screen\'s cell size and Dot Weight how heavy the dots print. With Shape Aware ticked the dots give way round your words, leaving each line on clean paper. Try: wire another texture into the Halftone Screen\'s tone, or turn its Screen Angle.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 50–400)
      ['knob', { slot: '2' }, 40, 140],               // 2  (100 of 30–240)
      ['noise', { scale: 10, octaves: 1 }, 320, 40],                               // 3
      ['screen', { scale: 100, weight: 100, angle: 0 }, 600, 80],                  // 4
      ['surface', { name: 'Halftone', ground: 'grey' }, 880, 100]],                // 5
    wires: [[1, 1, 4, 'scale'], [2, 1, 4, 'weight'], [3, 1, 4, 1], [4, 1, 5, 1]] },
  // √ Film Grain: one part, its Kind sliding from silver to digital
  grain: { label: 'Film Grain', canvas: true, teach: 'One part makes it: Film Grain, whose Kind slides from silver halide through film and paper to a digital sensor, blending neighbours in between. The Knobs are the texture\'s sliders: Grain Size, Contrast and Grain (the Kind). Try: set Kind to 66 for paper, then blend the grain over another texture with Blend.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 100–600)
      ['knob', { slot: '2' }, 40, 140],                 // 2  (100 of 30–240)
      ['knob', { slot: '3' }, 40, 240],                    // 3
      ['grain', { size: 100, contrast: 100, kind: 33 }, 320, 80],                  // 4
      ['surface', { name: 'Film Grain', ground: 'grey' }, 600, 100]],              // 5
    wires: [[1, 1, 4, 'size'], [2, 1, 4, 'contrast'], [3, 1, 4, 'kind'], [4, 1, 5, 1]] },
  // √ Painter's Frustration: Paint Swipes lays the paint and its thickness; a little Canvas Weave
  // goes into the thickness (the oil-on-canvas module: weave, Mix, Light Engine, right before the
  // Surface); the Light Engine lights the impasto by the dial. Wetness also flattens and glosses it.
  brushstrokes: { label: "Painter's Frustration", canvas: true, teach: 'Paint Swipes lays a few fast swipes of gray paint and gives a second output, the paint\'s thickness. Before the Surface sits the oil-on-canvas module: Mix lays a little Canvas Weave into that thickness, and the Light Engine lights the paint by the dial. The Wetness knob goes to four places: the strokes (mixing, bleeding, drips) and the Light Engine\'s Relief, Gloss and Shine, because wet paint is flatter and shinier. Try: turn the light dial, then raise Wetness.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1  (100 of 60–380)
      ['knob', { slot: '2' }, 40, 140],             // 2  (100 of 20–260)
      ['knob', { slot: '3' }, 40, 240],                   // 3
      ['strokes', { width: 100, count: 100, wet: 0 }, 320, 60],                    // 4
      ['canvasweave', { pitch: 100 }, 320, 320],                                   // 5
      ['mix', { t: 4 }, 600, 220],                                                 // 6
      ['material', { relief: 87, '~relief': '87,39', gloss: 25, '~gloss': '25,85', shine: 22, '~shine': '22,65', shadow: 55, occlusion: 30, ambient: 45 }, 860, 80],   // 7
      ['surface', { name: "Painter's Frustration", ground: 'grey' }, 1120, 120]],  // 8
    wires: [[1, 1, 4, 'width'], [2, 1, 4, 'count'], [3, 1, 4, 'wet'],
      [3, 1, 7, 'relief'], [3, 1, 7, 'gloss'], [3, 1, 7, 'shine'],
      [4, 1, 7, 1], [4, 2, 6, 1], [5, 1, 6, 2], [6, 1, 7, 2], [7, 1, 8, 1]] },
  landscape: { label: 'Painted Landscape', canvas: true, teach: 'Painted Sky paints the time of day, a sun or a moon, and clouds. Painted Ridges paints the seed\'s country over whatever sky comes in, band behind band. Watercolor Bleed bleeds the painting (Wetness). Oil Paint repaints it in brushstrokes with the paint\'s heights, and the Light Engine lights those by the dial; the Impasto knob drives both (0: no strokes, as it used to be). Notice that one Knob can drive two parts: Distance, Tilt and Color each go to both the sky and the ridges, so they agree. Try: set the Ridges\' Country, then raise Color.', nodes: [
      ['knob', { slot: '1' }, 40, 40],                 // 1  (100 of 60–200)
      ['knob', { slot: '2' }, 40, 140],                  // 2  (100 of 20–250)
      ['knob', { slot: '3' }, 40, 240],                  // 3
      ['math', { op: 'min' }, 40, 340],                                           // 4  the camera dial's View: the camera's pitch (Ruby: the camera's, not a slider)
      ['knob', { slot: '4' }, 40, 440],                    // 5
      ['sky', { time: 'seed', clouds: 'seed', size: 100, tilt: 0, colour: 0 }, 320, 40],                                  // 6
      ['ridges', { country: 'seed', time: 'seed', bands: 100, distance: 100, tilt: 0, colour: 0 }, 600, 120],            // 7
      ['wash', { wet: 0 }, 880, 160],                                             // 8
      ['surface', { name: 'Painted Landscape', ground: 'grey' }, 1720, 180],     // 9
      ['oilpaint', { amount: 50, size: 100, length: 100, detail: 50, vary: 40 }, 1160, 160],   // 10
      ['material', { relief: 20, '~relief': '0,40', gloss: 25, shine: 30, shadow: 50, occlusion: 30, ambient: 45 }, 1440, 180],   // 11
      ['knob', { slot: '5' }, 880, 400],
      ['camdial', {}, 40, 760],                                                    // 13 (the camera: its View the pitch)
      ['number', { value: 100 }, 40, 820]],               // 12
    wires: [[13, 2, 4, 1], [14, 1, 4, 2], [1, 1, 6, 'size'], [1, 1, 7, 'distance'], [2, 1, 7, 'bands'], [3, 1, 8, 'wet'],
      [4, 1, 6, 'tilt'], [4, 1, 7, 'tilt'], [5, 1, 6, 'colour'], [5, 1, 7, 'colour'],
      [6, 1, 7, 1], [7, 1, 8, 1], [8, 1, 10, 1], [10, 1, 11, 1], [10, 2, 11, 2], [11, 1, 9, 1],
      [12, 1, 10, 'amount'], [12, 1, 11, 'relief']] },
  // Ᏹ Under Glass (Ruby: a glass to lay over another surface): the glass alone, on mid-gray, so its blend shows only what the glass catches
  underglass: { label: 'Under Glass', div: 2, teach: 'A sheet of glass laid over the page. It is made to go over another surface: choose it as the Upper of Two Surfaces (Screen adds only the light it catches; Overlay also darkens), or in a graph put Texture from the Menu into the Glass Pane\'s Picture. Window Reflection mirrors a window\'s bright bands about where the light\'s own reflection falls; Scratches are hairlines in bunches or wiped in swirls, and its Glints are those lying across the way to the light; Smudges are fingerprints, smears, water spots and dust; Shatter breaks it, with a gray for each piece. A soft Perlin Noise is old glass\'s waviness: it ripples the reflection (and in a graph bends whatever is under it). The Glass Pane puts it together, adding light as light adds, so clean glass that catches nothing is exactly mid-gray and leaves the page alone. Try: turn the light dial and watch the glints ring the light, then raise Cracks.', nodes: [
      ['knob', { slot: '1' }, 40, 40],              // 1
      ['knob', { slot: '2' }, 40, 120],              // 2
      ['knob', { slot: '3' }, 40, 200],                  // 3
      ['knob', { slot: '4' }, 40, 280],                // 4
      ['knob', { slot: '5' }, 40, 360],           // 5
      ['knob', { slot: '6' }, 40, 440],                  // 6
      ['knob', { slot: '7' }, 40, 520],               // 7
      ['knob', { slot: '8' }, 40, 600],                    // 8
      ['dial', {}, 40, 700],                                                     // 9
      ['perlin', { scale: 8, details: 2, rough: 40, contrast: 30 }, 300, 780],   // 10
      ['blur', { radius: 6 }, 540, 780],                                         // 11
      ['reflection', { bands: 2, width: 100, soft: 35, slant: 20, sky: 30, ripple: 50, '~ripple': '0,100' }, 1020, 40],   // 12
      ['scratches', { count: 40, '~count': '0,100', length: 50, swirl: 30, '~swirl': '0,100', width: 100, sharp: 50 }, 1020, 260],   // 13
      ['smudges', { prints: 35, '~prints': '0,100', smears: 30, '~smears': '0,85', spots: 20, '~spots': '0,70', dust: 30, '~dust': '0,100', size: 100 }, 1020, 460],   // 14
      ['shatter', { breaks: 0, '~breaks': '0,100', reach: 100, rays: 50, rings: 50, width: 100 }, 1020, 660],   // 15
      ['glasspane', { reflect: 60, '~reflect': '0,100', glint: 80, smudge: 60, dust: 70, bend: 30, '~bend': '0,100', edge: 0, '~edge': '0,100' }, 1300, 300],   // 16
      ['surface', { name: 'Under Glass', ground: 'grey' }, 1560, 300]],          // 17
    wires: [[1, 1, 16, 'reflect'], [2, 1, 13, 'count'], [3, 1, 13, 'swirl'],
      [4, 1, 14, 'prints'], [4, 1, 14, 'smears'], [5, 1, 14, 'dust'], [5, 1, 14, 'spots'],
      [6, 1, 15, 'breaks'], [7, 1, 16, 'bend'], [7, 1, 12, 'ripple'], [8, 1, 16, 'edge'],
      [9, 1, 12, 1], [9, 2, 12, 2], [9, 1, 13, 1], [9, 2, 13, 2], [10, 1, 11, 1], [11, 1, 12, 3],
      [12, 1, 16, 2], [13, 2, 16, 3], [14, 1, 16, 4], [14, 3, 16, 5], [14, 2, 16, 6], [15, 1, 16, 7], [15, 2, 16, 8], [11, 1, 16, 9], [16, 1, 17, 1]] },
  // 🜄 Broken Glass (Ruby: "a bunch of glass fragments laying on 'nothing'"): Glass Shards, lit by the Light Dial, laid on a plane by the Camera Dial, over mid-gray
  brokenglass: { label: 'Broken Glass', div: 2, poem: 'lines', teach: 'Broken glass lying on nothing: choose it as the Upper of Two Surfaces to scatter it over another (Screen keeps only the light it catches; Hard Light also lays its shadows), or in a graph wire Texture from the Menu into the Glass Shards\' Picture to see it through the glass. Glass Shards cuts each shard as a sharp polygon, sized as broken glass breaks (a few big, many small), heaped about where it fell; Slivers draws them out long. Each lies a little tilted: where a face lies just right for the light it flashes whole, and its edges catch the light on the side toward it, each colour a little apart (glass bends each its own way). The light through a shard falls beside it, gathered into a bright caustic inside a pale shadow. The Light Dial is the light (its height: overhead at the middle, the shadows and caustics short; at the rim and past it, long), and the Camera Dial lays the glass on a plane you can turn and tip. It knows where the poem is (Text Aware): a shard that falls on a line of the words is a small one, so the line reads; blended into the letters (Shape Aware) it lies only on the lines, sized to them. With Shape Aware ticked the shards are swept off your words. Try: pull the Light Dial past its rim for long caustics, then raise Colored Glass.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                   // 1
      ['knob', { slot: '2', def: 25.9 }, 40, 120],                  // 2  (100 of 30–300)
      ['knob', { slot: '3' }, 40, 200],                  // 3
      ['knob', { slot: '4' }, 40, 280],                 // 4
      ['knob', { slot: '5' }, 40, 360],                // 5
      ['knob', { slot: '6' }, 40, 440],                  // 6
      ['knob', { slot: '7' }, 40, 520],           // 7
      ['knob', { slot: '8' }, 40, 600],                 // 8
      ['camdial', {}, 40, 700], ['dial', {}, 40, 780],                            // 9, 10
      ['shards', { count: 40, '~count': '0,100', size: 100, '~size': '30,300', spread: 55, '~spread': '0,100', slivers: 35, '~slivers': '0,100', caustics: 60, '~caustics': '0,100',
        glints: 60, '~glints': '0,100', colors: 25, '~colors': '0,100', shadows: 50, '~shadows': '0,100', turn: 0, '~turn': '0,360', view: 0, '~view': '0,100', lens: 100, '~lens': '25,400' }, 320, 300],   // 11
      ['surface', { name: 'Broken Glass', ground: 'grey' }, 600, 320]],           // 12
    wires: [[1, 1, 11, 'count'], [2, 1, 11, 'size'], [3, 1, 11, 'spread'], [4, 1, 11, 'slivers'],
      [5, 1, 11, 'caustics'], [6, 1, 11, 'glints'], [7, 1, 11, 'colors'], [8, 1, 11, 'shadows'],
      [9, 1, 11, 'turn'], [9, 2, 11, 'view'], [9, 3, 11, 'lens'], [10, 1, 11, 2], [10, 2, 11, 3], [11, 1, 12, 1]] },
  // 🜄 Dewy Webs (Ruby: "dewy spider webs getting caught by the light"): Dewy Webs' silk, dew and glints, on mid-gray
  dewwebs: { label: 'Dewy Webs', div: 2, poem: 'lines', teach: 'Spider webs at dawn, beaded with dew. Dewy Webs strings orb webs across the page: anchor threads, a frame, spokes from the hub, and the sticky spiral wound out between them, sagging a little (Sag), torn here and there (Torn). Dew gathers on the spiral the way a wet thread breaks into beads: a drop, a smaller one between, larger low in the web. Each drop is a tiny lens, with a point of light toward the Light Dial and a bright crescent on its far side. The silk glints only where it runs across the light\'s way, and Iridescence colours those glints as thin silk does. Silk and dew are screened onto mid-gray; the drops are a little darkened round so they read on a light page; the glints get a soft bloom. It knows where the poem is (Text Aware): no web\'s hub sits on the words; blended into the letters (Shape Aware) a web is strung across each line. With Shape Aware ticked the webs keep to the room between your words. Try: Dew at 0 and Iridescence at 100 for a dry web shimmering in colors.',
    nodes: [
      ['knob', { slot: '1' }, 40, 40],                     // 1
      ['knob', { slot: '2', def: 28.6 }, 40, 120],                  // 2  (100 of 40–250)
      ['knob', { slot: '3' }, 40, 200],                     // 3
      ['knob', { slot: '4', def: 25.9 }, 40, 280],             // 4  (100 of 30–300)
      ['knob', { slot: '5' }, 40, 360],                    // 5
      ['knob', { slot: '6' }, 40, 440],                     // 6
      ['knob', { slot: '7' }, 40, 520],             // 7
      ['knob', { slot: '8' }, 40, 600],                 // 8
      ['dial', {}, 40, 700],                                                      // 9
      ['dewwebs', { webs: 30, '~webs': '0,100', size: 100, '~size': '40,250', dew: 60, '~dew': '0,100', drops: 100, '~drops': '30,300', torn: 20, '~torn': '0,100',
        sag: 40, '~sag': '0,100', irid: 50, '~irid': '0,100', threads: 50, '~threads': '0,100', width: 100 }, 300, 300],   // 10
      ['number', { value: 50 }, 560, 120],                                        // 11 (the mid-gray)
      ['maprange', { inLo: 0, inHi: 100, outLo: 0, outHi: 55 }, 560, 220],         // 12 (the silk, faint)
      ['blend', { mode: 'screen', opacity: 100 }, 800, 160],                      // 13
      ['blur', { radius: 4 }, 560, 420],                                          // 14 (round each drop)
      ['maprange', { inLo: 0, inHi: 100, outLo: 100, outHi: 66 }, 800, 420],       // 15
      ['blend', { mode: 'multiply', opacity: 100 }, 1040, 220],                   // 16 (a little darker round the drops)
      ['maprange', { inLo: 0, inHi: 100, outLo: 0, outHi: 80 }, 800, 520],         // 17 (the drops)
      ['blend', { mode: 'screen', opacity: 100 }, 1280, 260],                     // 18
      ['blur', { radius: 5 }, 800, 620],                                          // 19 (the glints' bloom)
      ['blend', { mode: 'screen', opacity: 70 }, 1520, 300],                      // 20
      ['blend', { mode: 'screen', opacity: 100 }, 1760, 300],                     // 21
      ['surface', { name: 'Dewy Webs', ground: 'grey', aa: 'edges only' }, 2000, 320]],             // 22
    wires: [[1, 1, 10, 'webs'], [2, 1, 10, 'size'], [3, 1, 10, 'dew'], [4, 1, 10, 'drops'],
      [5, 1, 10, 'torn'], [6, 1, 10, 'sag'], [7, 1, 10, 'irid'], [8, 1, 10, 'threads'], [9, 1, 10, 1],
      [10, 1, 12, 1], [11, 1, 13, 1], [12, 1, 13, 2], [10, 3, 14, 1], [14, 1, 15, 1], [13, 1, 16, 1], [15, 1, 16, 2], [10, 3, 17, 1], [16, 1, 18, 1], [17, 1, 18, 2],
      [10, 2, 19, 1], [18, 1, 20, 1], [19, 1, 20, 2], [20, 1, 21, 1], [10, 2, 21, 2], [21, 1, 22, 1]] },
};

// THE CHAINS' KNOBS AND SETTINGS, filled in once (docs/SIMPLIFY.md S1): a knob that gives only its slot takes its name and
// its default (as a share of the slider's range) from its surface's slider (textureParams.js), so a chain never restates
// them; and a wire to a setting may name it ('scale'), and is given that setting's port on the part it reaches.
for(const [key, c] of Object.entries(TEXTURE_CHAINS)){
  const sliders = TEXTURE_PARAMS[key] || [];
  for(const nd of c.nodes || []){ if(nd[0] !== 'knob') continue; const d = nd[1], p = sliders[(+d.slot || 1) - 1]; if(!p) continue;
    const { slot, name = p.label, def = Math.round((p.def - p.min)/(p.max - p.min)*100), ...rest } = d;
    nd[1] = { slot, name, def, ...rest }; }
  for(const w of c.wires || []) if(typeof w[3] === 'string'){ const to = (c.nodes || [])[w[2] - 1]; if(to) w[3] = paramPort(to[0], w[3]); }
  // A SLIDER'S MARKS FROM WHAT IT DRIVES (Ruby: ticks on the sliders that could use them): a knob wired to a setting that
  // picks among kinds (a part's `bands`, equal shares each with its name, or its `marks`) gives its slider those marks,
  // where they fall across the wire's range, unless the slider has marks of its own
  c.nodes.forEach((nd, i) => { if(nd[0] !== 'knob') return; const p = sliders[(+nd[1].slot || 1) - 1]; if(!p || p.ticks) return;
    for(const w of c.wires || []){ if(w[0] !== i + 1) continue; const to = c.nodes[w[2] - 1], st = to && STEPS[to[0]]; if(!st) continue;
      const key = st.paramPorts[w[3] - st.dataIns - 1], par = key && st.params.find(q => q[0] === key), o = par && par[4];
      if(!o || !(o.bands || o.marks)) continue;
      const [lo, hi] = String(to[1]['~' + key] || `${o.min},${o.max}`).split(',').map(Number);
      const at = o.bands ? o.bands.map((_, b) => o.min + (b + 0.5)/o.bands.length*(o.max - o.min)) : o.marks;
      const inside = at.map((m, b) => [(m - lo)/(hi - lo), b]).filter(([f]) => f > -0.001 && f < 1.001);
      if(inside.length < 2) continue;
      p.ticks = inside.map(([f]) => Math.round(p.min + Math.max(0, Math.min(1, f))*(p.max - p.min)));
      if(o.bands) p.names = inside.map(([, b]) => o.bands[b]);
      break; }
  });
}
