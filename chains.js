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
  landscape: { label: 'Painted Landscape', canvas: true, teach: 'This is Painted Landscape. Painted Sky paints the time of day, a sun or a moon, and clouds. Painted Ridges paints the seed\'s country over whatever sky comes in, band behind band. Watercolor Wash bleeds the painting (Wetness). Notice that one Knob can drive two parts: Distance, Tilt and Color each go to both the sky and the ridges, so they agree. Try: set the Ridges\' Country, then raise Color.', nodes: [
      ['knob', { slot: '1', name: 'Distance', def: 29 }, 40, 40],                 // 1  (100 of 60–200)
      ['knob', { slot: '2', name: 'Ridges', def: 35 }, 40, 140],                  // 2  (100 of 20–250)
      ['knob', { slot: '3', name: 'Wetness', def: 0 }, 40, 240],                  // 3
      ['knob', { slot: '4', name: 'Tilt', def: 0 }, 40, 340],                     // 4
      ['knob', { slot: '5', name: 'Color', def: 0 }, 40, 440],                    // 5
      ['sky', { time: 'seed', clouds: 'seed', size: 100, tilt: 0, colour: 0 }, 320, 40],                                  // 6
      ['ridges', { country: 'seed', time: 'seed', bands: 100, distance: 100, tilt: 0, colour: 0 }, 600, 120],            // 7
      ['wash', { wet: 0 }, 880, 160],                                             // 8
      ['surface', { name: 'Painted Landscape', ground: 'grey' }, 1160, 180]],     // 9
    wires: [[1, 1, 6, paramPort('sky', 'size')], [1, 1, 7, paramPort('ridges', 'distance')], [2, 1, 7, paramPort('ridges', 'bands')], [3, 1, 8, paramPort('wash', 'wet')],
      [4, 1, 6, paramPort('sky', 'tilt')], [4, 1, 7, paramPort('ridges', 'tilt')], [5, 1, 6, paramPort('sky', 'colour')], [5, 1, 7, paramPort('ridges', 'colour')],
      [6, 1, 7, 1], [7, 1, 8, 1], [8, 1, 9, 1]] },
};
