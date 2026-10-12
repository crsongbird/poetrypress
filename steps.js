/**
 * steps.js — THE STEPS: the small operations Vellum's surfaces are made of,
 * shared by the Athanor (its parts) and the textures rebuilt as chains of them
 * (chains.js). One library, so a texture is a graph of steps anyone can open,
 * take apart and make their own.
 *
 * A step: { cat, label, ins, outs, params, cost, run(E, n) }
 *   ins / outs   port names, in order (Drawflow numbers them from 1)
 *   params       [key, label, kind, default, extra] — kind: range (min, max),
 *                select (options), text, texture, stitch
 *   cost         about how many passes over the page it makes (the budget)
 *   run          (E, n) → [outputs]: E is the evaluator's working set
 *                (athanor.js evalAthanor), n the node (its data are the params)
 * Values travel as fields (Float32Array, 0..1), images ({ r, g, b } fields),
 * colours ([r, g, b]) and plain numbers — see athanor.js.
 *
 * A param may be BOUND instead of set (the long refactor's knob-driven steps):
 *   '@k1'…'@k6'   that slider of the surface, across the param's own range
 *   '@k2[10,700]' …or across the range written (a texture's own slider range)
 *   '@dial'       the dial's direction, in degrees (0: from above, clockwise)
 *   '@tilt'       how low the dial's light is (0..130)
 * so one step serves a texture's slider directly (athanor.js resolves them).
 *
 * Families of steps live beside this file and are gathered here: stepsTouch.js
 * (weave, cloth — Linen; panes, glass — Stained Glass; flakes — Scattered
 * Polygons), stepsChaos.js (crazing, brushwork, glaze — Fractured Glaze),
 * stepsWhimsy.js (smoke, light shaft, dust motes — Sleep Haze; painted sky,
 * painted ridges, watercolour wash — Painted Landscape), cartomancy.js (table,
 * deal, coins).
 *
 * MARKS steps (streaks, hatching) draw strokes on a canvas the size of the
 * working grid and read it back as a field — the generators' own way of
 * drawing, kept inside a step. Their sizes are in canonical pixels (E.px).
 */
import { makeNoiseGrid, sampleNoiseGrid, canonDiv, smoothField } from './texCore.js';
import { drawStitch, pathFromPoints, roundRectPoints } from './stitches.js';
import { TOUCH_STEPS } from './stepsTouch.js';
import { WHIMSY_STEPS } from './stepsWhimsy.js';
import { CHAOS_STEPS } from './stepsChaos.js';
import { CARD_STEPS } from './cartomancy.js';

const STEP_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const STEP_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
export const STEP_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'darken', 'lighten', 'color-dodge', 'color-burn',
  'difference', 'exclusion', 'vivid-light', 'linear-light', 'pin-light', 'linear-burn', 'subtract', 'divide'];
export const STEP_CATEGORIES = ['Inputs', 'Noise', 'Marks', 'Textures', 'Shape', 'Combine', 'Light & Color', 'Output'];

// ---- blends, as the canvas and the GPU do them (per channel, 0..1) ----
const STEP_SOFT = (b, s) => s <= 0.5 ? b - (1 - 2*s)*b*(1 - b) : b + (2*s - 1)*((b <= 0.25 ? ((16*b - 12)*b + 4)*b : Math.sqrt(b)) - b);
export const STEP_BLEND_FN = {
  'normal': (b, s) => s, 'source-over': (b, s) => s,
  'multiply': (b, s) => b*s, 'screen': (b, s) => 1 - (1 - b)*(1 - s),
  'overlay': (b, s) => b < 0.5 ? 2*b*s : 1 - 2*(1 - b)*(1 - s), 'hard-light': (b, s) => s < 0.5 ? 2*b*s : 1 - 2*(1 - b)*(1 - s),
  'soft-light': STEP_SOFT, 'darken': Math.min, 'lighten': Math.max,
  'color-dodge': (b, s) => s >= 1 ? 1 : Math.min(1, b/(1 - s)), 'color-burn': (b, s) => s <= 0 ? 0 : 1 - Math.min(1, (1 - b)/s),
  'difference': (b, s) => Math.abs(b - s), 'exclusion': (b, s) => b + s - 2*b*s,
  'vivid-light': (b, s) => s < 0.5 ? (s <= 0 ? 0 : 1 - (1 - b)/(2*s)) : (s >= 1 ? 1 : b/(2*(1 - s))),
  'linear-light': (b, s) => b + 2*s - 1, 'pin-light': (b, s) => s < 0.5 ? Math.min(b, 2*s) : Math.max(b, 2*s - 1),
  'linear-burn': (b, s) => b + s - 1, 'subtract': (b, s) => b - s, 'divide': (b, s) => b/Math.max(s, 1/255),
};

// ---- the parts as the editor shows them ----
const STEP_PARTS = {
  // inputs: what the finished texture offers on the page
  knob:     { cat: 'Inputs', label: 'Knob', ins: [], outs: ['value'], params: [STEP_SEL('slot', 'Slider', ['1','2','3','4','5','6']), ['name', 'Name', 'text', 'Amount'], STEP_R('def', 'Default', 50)] },
  hue:      { cat: 'Inputs', label: 'Hue', ins: [], outs: ['colour'], params: [STEP_SEL('slot', 'Hue', ['1','2']), ['name', 'Name', 'text', 'Light Hue']] },
  dial:     { cat: 'Inputs', label: 'Light Dial', ins: [], outs: ['direction', 'height'], params: [] },
  seed:     { cat: 'Inputs', label: 'Seed', ins: [], outs: ['seed'], params: [] },
  page:     { cat: 'Inputs', label: 'Page Coordinates', ins: [], outs: ['x', 'y', 'radius'], params: [] },
  // makers
  noise:    { cat: 'Noise', label: 'Value Noise', ins: ['seed'], outs: ['field'], params: [STEP_R('scale', 'Scale', 40, 1, 200), STEP_R('octaves', 'Octaves', 3, 1, 6)] },
  cells:    { cat: 'Noise', label: 'Cells', ins: ['seed'], outs: ['distance', 'edges', 'id'], params: [STEP_R('scale', 'Scale', 30, 2, 200), STEP_R('jitter', 'Jitter', 80)] },
  waves:    { cat: 'Noise', label: 'Waves', ins: ['warp'], outs: ['field'], params: [STEP_R('freq', 'Frequency', 12, 1, 120), STEP_R('angle', 'Angle', 0, 0, 360)] },
  gradient: { cat: 'Noise', label: 'Gradient', ins: [], outs: ['field'], params: [STEP_SEL('shape', 'Shape', ['linear', 'radial', 'rectangular']), STEP_R('angle', 'Angle', 90, 0, 360)] },
  turing:   { cat: 'Noise', label: 'Reaction–Diffusion', ins: ['seed'], outs: ['field'], params: [STEP_SEL('pattern', 'Pattern', ['spots', 'coral', 'maze', 'worms', 'holes']), STEP_R('scale', 'Scale', 100, 50, 250)] },
  texture:  { cat: 'Textures', label: 'Texture from the Menu', ins: ['seed'], outs: ['image', 'grey'], params: [['type', 'Texture', 'texture', 'linen'], STEP_R('p1', 'Knob 1', 100, 0, 400), STEP_R('p2', 'Knob 2', 100, 0, 400), STEP_R('p3', 'Knob 3', 50)] },
  stitch:   { cat: 'Textures', label: 'Stitch Border', ins: [], outs: ['mask'], params: [['style', 'Stitch', 'stitch', 'scallop'], STEP_R('offset', 'Offset', 14, 0, 400), STEP_R('size', 'Size', 4, 1, 40)] },
  // shaping
  levels:   { cat: 'Shape', label: 'Levels', ins: ['field'], outs: ['field'], params: [STEP_R('lo', 'Low', 0), STEP_R('hi', 'High', 100), STEP_R('gamma', 'Gamma', 50)] },
  threshold:{ cat: 'Shape', label: 'Threshold', ins: ['field'], outs: ['mask'], params: [STEP_R('at', 'At', 50), STEP_R('soft', 'Softness', 10)] },
  blur:     { cat: 'Shape', label: 'Blur', ins: ['field'], outs: ['field'], params: [STEP_R('radius', 'Radius', 8, 0, 100)] },
  warp:     { cat: 'Shape', label: 'Warp', ins: ['field', 'by'], outs: ['field'], params: [STEP_R('amount', 'Amount', 20)] },
  math:     { cat: 'Combine', label: 'Math', ins: ['a', 'b'], outs: ['result'], params: [STEP_SEL('op', 'Operation', ['add', 'multiply', 'max', 'min', 'difference', 'subtract'])] },
  mix:      { cat: 'Combine', label: 'Mix', ins: ['a', 'b', 'amount'], outs: ['result'], params: [STEP_R('t', 'Amount', 50)] },
  invert:   { cat: 'Shape', label: 'Invert', ins: ['field'], outs: ['field'], params: [] },
  posterize:{ cat: 'Shape', label: 'Posterize', ins: ['field'], outs: ['field'], params: [STEP_R('steps', 'Steps', 5, 2, 16)] },
  transform:{ cat: 'Shape', label: 'Tile & Rotate', ins: ['field'], outs: ['field'], params: [STEP_R('scale', 'Scale', 100, 25, 400), STEP_R('angle', 'Angle', 0, 0, 360)] },
  edges:    { cat: 'Shape', label: 'Edge Detect', ins: ['field'], outs: ['edges'], params: [STEP_R('strength', 'Strength', 50)] },
  // light and colour
  light:    { cat: 'Light & Color', label: 'Light (heights)', ins: ['height', 'dial'], outs: ['light', 'highlight'], params: [STEP_R('relief', 'Relief', 50), STEP_R('gloss', 'Gloss', 30), STEP_R('shadow', 'Shadow', 60)] },
  tint:     { cat: 'Light & Color', label: 'Tint', ins: ['field', 'light hue', 'dark hue'], outs: ['image'], params: [] },
  ramp:     { cat: 'Light & Color', label: 'Color Ramp', ins: ['field', 'color a', 'color b'], outs: ['image'], params: [STEP_R('mid', 'Middle', 50)] },
  blend:    { cat: 'Combine', label: 'Blend', ins: ['base', 'layer', 'mask'], outs: ['image'], params: [STEP_SEL('mode', 'Mode', STEP_BLENDS), STEP_R('opacity', 'Opacity', 100)] },
  // the end
  surface:  { cat: 'Output', label: 'Surface', ins: ['image', 'height'], outs: [], params: [['name', 'Name', 'text', 'My Surface'], STEP_SEL('ground', 'Ground', ['grey', 'colour'])] },
  // newer parts (the chains' own)
  colour:   { cat: 'Inputs', label: 'Color', ins: [], outs: ['colour'], params: [['hex', 'Color', 'text', '#808080']] },
  // the page's own two accent colors (Cartomancy's first two suits)
  accent:   { cat: 'Inputs', label: 'Accent', ins: [], outs: ['colour'], params: [STEP_SEL('slot', 'Accent', ['1', '2']), ['name', 'Name', 'text', 'Accent']] },
  forms:    { cat: 'Noise', label: 'Soft Forms', ins: [], outs: ['tone'], params: [STEP_R('count', 'Forms', 5, 1, 12), STEP_R('size', 'Size', 50), STEP_R('noise', 'Noise', 50)] },
  streaks:  { cat: 'Marks', label: 'Streaks', ins: ['base'], outs: ['field'], params: [STEP_SEL('kind', 'Kind', ['streaks', 'sheets']), STEP_R('angle', 'From', 0, 0, 360),
              STEP_R('spread', 'Gusts', 0, 0, 40), STEP_R('length', 'Length', 100, 100, 500), STEP_R('count', 'Count', 100, 0, 400), STEP_R('light', 'Light Share', 75), STEP_R('strength', 'Strength', 50)] },
  hatching: { cat: 'Marks', label: 'Hatching', ins: ['tone'], outs: ['ink'], params: [STEP_R('angle', 'Direction', 125, 0, 360), STEP_R('density', 'Density', 100, 10, 700),
              STEP_R('size', 'Patch Size', 100, 25, 400), STEP_R('cross', 'Cross-Hatching', 38), STEP_R('crossAngle', 'Cross Angle', 54, 10, 90), STEP_R('weight', 'Weight', 50)] },
  // the way Filter Forge folds a picture: mirror it round the centre, or wrap it into rings
  kaleidoscope: { cat: 'Shape', label: 'Kaleidoscope', ins: ['field'], outs: ['field'], params: [STEP_R('folds', 'Folds', 6, 2, 16), STEP_R('turn', 'Turn', 0, 0, 360), STEP_R('zoom', 'Zoom', 100, 25, 400)] },
  polar:    { cat: 'Shape', label: 'Polar Wrap', ins: ['field'], outs: ['field'], params: [STEP_R('rings', 'Rings', 100, 25, 400), STEP_R('turn', 'Turn', 0, 0, 360)] },
  // numbers to wire into any ⚙ setting (Ruby: some settings could only be set by a wire — now anything can be random)
  number:   { cat: 'Inputs', label: 'Number', ins: [], outs: ['value'], params: [STEP_R('value', 'Value', 50)] },
  random:   { cat: 'Inputs', label: 'Random Number', ins: [], outs: ['value'], params: [STEP_R('lo', 'Lowest', 0), STEP_R('hi', 'Highest', 100)] },
  // reshaping a grey map's values; masks drawn from shapes
  maprange: { cat: 'Shape', label: 'Map Range', ins: ['field'], outs: ['field'], params: [STEP_R('inLo', 'From Low', 0), STEP_R('inHi', 'From High', 100), STEP_R('outLo', 'To Low', 0), STEP_R('outHi', 'To High', 100)] },
  shape:    { cat: 'Noise', label: 'Shape Mask', ins: [], outs: ['mask'], params: [STEP_SEL('form', 'Shape', ['circle', 'ring', 'square', 'diamond', 'star', 'vignette']),
              STEP_R('size', 'Size', 60, 5, 150), STEP_R('soft', 'Softness', 10), STEP_R('x', 'Across', 50), STEP_R('y', 'Down', 50)] },
  // the COMBINE family: pictures taken apart and put together
  split:    { cat: 'Combine', label: 'Split Channels', ins: ['picture'], outs: ['red', 'green', 'blue', 'brightness'], params: [] },
  merge:    { cat: 'Combine', label: 'Merge Channels', ins: ['red', 'green', 'blue'], outs: ['picture'], params: [] },
  switch:   { cat: 'Combine', label: 'Switch', ins: ['a', 'b', 'choose'], outs: ['result'], params: [STEP_R('at', 'Switch At', 50)] },
  hsv:      { cat: 'Light & Color', label: 'Hue & Saturation', ins: ['picture'], outs: ['picture'], params: [STEP_R('hue', 'Hue Turn', 0, 0, 360), STEP_R('sat', 'Saturation', 100, 0, 200), STEP_R('val', 'Brightness', 100, 0, 200)] },
};
/**
 * WHAT EACH PART DOES, in a sentence a person can use (the parts list, the
 * menus and the Help show these). Plain and instructive: what goes in, what
 * comes out, what to try.
 */
export const STEP_DOCS = {
  knob: 'One of the page\'s six sliders, as a number from 0 to 1. Wire it into a ⚙ setting and that slider drives the setting.',
  hue: 'One of the texture\'s two hue pickers on the page, as a color.',
  accent: 'One of the page\'s two accent colors (the colors set under Thoughtforms).',
  colour: 'A fixed color you type as a hex code, such as #C0392B.',
  dial: 'The page\'s light dial: its direction (0 to 1 around the circle) and how low the light is.',
  seed: 'The page\'s seed as a number from 0 to 1. Wire it into a seed port to shift a part\'s pattern with the seed.',
  page: 'Where each point is on the page: across (x), down (y) and how far from the center (radius), each from 0 to 1.',
  number: 'A number you set by hand, from 0 to 1. Wire it into a ⚙ setting to set it exactly.',
  random: 'A number chosen at random between Lowest and Highest. It changes when the page\'s seed changes, so a ⚙ setting wired to it is new with every seed.',
  noise: 'Soft, cloudy noise: a gray map. Scale sets how many blobs across the page; Octaves adds finer detail.',
  cells: 'Cells, like a sponge or cobblestones: the distance to each cell\'s center, the lines between cells, and a number for each cell.',
  waves: 'Parallel stripes of light and dark. Wire a gray map into Warp to bend them.',
  gradient: 'A smooth ramp from dark to light: straight, round or square.',
  turing: 'Reaction–diffusion: spots, coral, mazes and worms, grown the way animal markings grow.',
  forms: 'A few large, soft shapes: where a drawing is dark.',
  shape: 'A mask in a simple shape: a circle, a ring, a square, a diamond, a star or a vignette.',
  panes: 'A window\'s panes: random shards, a lattice, a rose window or a grid. It hands on the lead, the distance from it, a number for each pane and its color slot.',
  smoke: 'Smoke in a still room: haze in layers and wisps rising. Out: how dense the smoke is.',
  brushwork: 'How thickly paint was laid: streaks, runs and pools, as a gray map.',
  streaks: 'Rain: far sheets or near streaks, drawn over what comes in. From sets the direction; Gusts swings it.',
  hatching: 'Pencil hatching that gathers where the tone coming in is dark, along the direction you set.',
  flakes: 'Flakes of metal leaf laid over what comes in, in the leaf\'s hue. Its mask shows where they lie.',
  motes: 'Specks of dust that show only where a beam (from a Light Shaft) catches them.',
  ridges: 'A painted landscape\'s hills and mountains, band behind band, painted over whatever sky comes in.',
  deal: 'Cards and coins laid on what comes in (a Table): a game in progress, one of eleven. Its four color ports are the four suits. Clutter adds other things to the table (a candle, a cup, a letter) toward its edges; Wear damages some of the cards (dog-ears, tears, rings, burns).',
  objects: 'Things left on a table, laid on what comes in: candles, cups, glasses, a crystal ball, quartz, dice, a pocket watch, rings, a hag stone, keys, feathers, letters, petals, matches, stains. Kind “seed” lets the seed choose and keeps them toward the edges; pick one kind to scatter only that.',
  coins: 'Coins scattered and stacked, with a mask of where they lie.',
  texture: 'Any texture from the Surface menu, made here so you can change it further.',
  stitch: 'A stitched border around the page, as a mask.',
  weave: 'Woven threads: silk, twill, linen, canvas or burlap.',
  cloth: 'Colors the weave with two hues and adds seams, stitching and buttons, lit by the dial.',
  crazing: 'The fine cracks in old glaze: heights, the glaze, grime in the cracks and the finest cracks.',
  table: 'A table top (felt, velvet, wood, marble, slate or linen) under a lamp.',
  sky: 'A painted sky: a time of day, a sun or a moon, and painted clouds.',
  levels: 'Moves the dark and light points of a gray map: Low and High set where black and white begin; Gamma lightens or darkens the middle.',
  threshold: 'Turns a gray map into black and white at a level you choose; Softness blurs the edge.',
  blur: 'Softens a gray map: a larger Radius gives a softer, wider blur.',
  warp: 'Pushes a gray map around, guided by a second map.',
  invert: 'Light becomes dark and dark becomes light.',
  posterize: 'Reduces a gray map to a few flat steps.',
  transform: 'Scales and turns a gray map, repeating it past its edges.',
  edges: 'Finds the edges in a gray map: where it changes fastest.',
  kaleidoscope: 'Folds a gray map into mirrored wedges around the center.',
  polar: 'Wraps a gray map into rings around the center.',
  maprange: 'Remaps a gray map\'s values: what was From Low to From High becomes To Low to To High.',
  wash: 'A watercolor wash over any picture: soft bleeding, and blooms when it is very wet.',
  math: 'Combines two gray maps: add, multiply, the larger, the smaller, the difference, or subtract.',
  mix: 'Blends picture A into picture B. Amount (a number or a gray map, used as a mask) says how much of B.',
  blend: 'Lays one picture over another with a blend mode (multiply, screen, overlay…), optionally through a mask.',
  split: 'Takes a picture apart into its red, green and blue, and its brightness, each a gray map.',
  merge: 'Puts three gray maps together as the red, green and blue of a picture.',
  switch: 'Passes A or B: B when the number at Choose is above Switch At. Wire a Knob into Choose to switch from the page.',
  light: 'Lights a gray map as if it were a surface with height, from the dial\'s direction: its light and its highlights.',
  tint: 'Colors a gray map between two hues: the light hue where it is light, the dark hue where it is dark.',
  ramp: 'Colors a gray map between two colors; Middle moves where they meet.',
  hsv: 'Turns a picture\'s hues around the color wheel, and changes its saturation and brightness.',
  glass: 'Lights a tiling as stained glass: from behind toward the dial\'s sun, and from the front, each pane domed and catching the light.',
  glaze: 'Lights and colors crazed glaze from its maps.',
  shaft: 'A shaft of light from the dial through any density (smoke, noise): the density glows inside it. Its second output is the beam itself.',
  surface: 'The end of every graph. What reaches Image is the texture; a gray map in Height is lit by the dial. A graph has exactly one.',
};
const STEP_COST = {
  noise: d => Math.max(1, +d.octaves || 3),
  cells: () => 9,
  turing: () => 60,
  texture: () => 40,
  stitch: () => 8,
  blur: () => 4,
  warp: () => 1.5,
  mix: () => 1.5,
  light: () => 14,
  tint: () => 1.5,
  ramp: () => 2,
  blend: () => 3,
  page: () => 3,
  transform: () => 1.5,
  edges: () => 2,
  forms: () => 2, streaks: () => 4, hatching: () => 6,
};

// ---- what each part does ----
const STEP_RUN = {
  knob(E, n){ const { ctx, num, P } = E;
    return [Math.max(0, Math.min(100, +((ctx.knobs || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] ?? num(n, 'def', 50))))/100];
  },
  hue(E, n){ const { ctx, P, hexCol } = E;
    return [hexCol((ctx.tints || [])[(parseInt(P(n, 'slot', '1'), 10) || 1) - 1] || '#FFFFFF')];
  },
  dial(E, n){ const { ctx } = E;
    return [((ctx.light ?? 315) % 360)/360, Math.max(0, Math.min(1.3, (ctx.lightTilt ?? 100)/100))];
  },
  seed(E, n){ const { ctx } = E;
    return [((ctx.seed >>> 0) % 1000)/1000];
  },
  page(E, n){ const { field } = E;
    return [field(u => u), field((u, v) => v), field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
  },
  noise(E, n){ const { unit, input, num, field } = E;
    const cells = Math.max(1, num(n, 'scale', 40))/10, oct = Math.max(1, Math.min(6, Math.round(num(n, 'octaves', 3))));
    const s0 = input(n, 1), off = typeof s0 === 'number' ? s0*97 : 0;
    const grids = []; for(let o = 0; o < oct; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; grids.push({ g, grid: makeNoiseGrid(g, g), a: Math.pow(0.5, o) }); }
    const norm = grids.reduce((s, o) => s + o.a, 0);
    // square cells, `scale/10` of them across the page's short side
    return [field((u, v, x, y) => { let s = 0; for(const o of grids) s += sampleNoiseGrid(o.grid, o.g, o.g, x/unit*(o.g - 1) + off, y/unit*(o.g - 1) + off*1.7)*o.a; return s/norm; })];
  },
  cells(E, n){ const { ww, wh, N, unit, num } = E;
    const sc = Math.max(2, num(n, 'scale', 30))/10, jit = num(n, 'jitter', 80)/100, cs = unit/sc;
    const gx = Math.ceil(ww/cs) + 2, gy = Math.ceil(wh/cs) + 2, pts = new Float32Array(gx*gy*3);
    for(let i = 0; i < gx*gy; i++){ pts[i*3] = 0.5 + (Math.random() - 0.5)*jit; pts[i*3+1] = 0.5 + (Math.random() - 0.5)*jit; pts[i*3+2] = Math.random(); }
    const d1 = new Float32Array(N), ed = new Float32Array(N), id = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const cx = Math.floor(x/cs) + 1, cy = Math.floor(y/cs) + 1; let a = 1e9, b = 1e9, ia = 0;
      for(let j = cy - 1; j <= cy + 1; j++) for(let i = cx - 1; i <= cx + 1; i++){ if(i < 0 || j < 0 || i >= gx || j >= gy) continue;
        const k = (j*gx + i)*3, px = (i - 1 + pts[k])*cs, py = (j - 1 + pts[k+1])*cs, d = Math.hypot(px - x, py - y);
        if(d < a){ b = a; a = d; ia = pts[k+2]; } else if(d < b) b = d; }
      const q = y*ww + x; d1[q] = Math.min(1, a/cs); ed[q] = 1 - Math.min(1, (b - a)/cs*4); id[q] = ia;
    }
    return [d1, ed, id];
  },
  waves(E, n){ const { ww, wh, unit, input, num, field, asField } = E;
    const fq = Math.max(1, num(n, 'freq', 12)), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
    const wf = asField(input(n, 1)), asp = ww/unit, asq = wh/unit;
    return [field((u, v, x, y) => 0.5 + 0.5*Math.sin(((u*asp*ca + v*asq*sa)*fq + (wf ? wf[y*ww + x]*2 : 0))*Math.PI*2))];
  },
  gradient(E, n){ const { num, P, field } = E;
    const shape = P(n, 'shape', 'linear'), an = num(n, 'angle', 90)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
    if(shape === 'radial') return [field((u, v) => Math.min(1, Math.hypot(u - 0.5, v - 0.5)/0.7071))];
    if(shape === 'rectangular') return [field((u, v) => Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5))*2)];
    return [field((u, v) => Math.max(0, Math.min(1, 0.5 + ((u - 0.5)*ca + (v - 0.5)*sa))))];
  },
  turing(E, n){ const { ww, wh, ctx, deps, num, P, readCanvas, lum } = E;
    if(!deps.texture) return null;
    const type = n.name === 'turing' ? 'turing' : String(P(n, 'type', 'linen'));
    if(type === 'athanor') return null;              // never itself
    const opts = n.name === 'turing'
      ? { p1: num(n, 'scale', 100), p2: 80, p3: ['spots', 'coral', 'maze', 'worms', 'holes'].indexOf(P(n, 'pattern', 'coral'))*25, p4: 0 }
      : { p1: num(n, 'p1', 100), p2: num(n, 'p2', 100), p3: num(n, 'p3', 50) };
    const cv = deps.texture(type, ww*canonDiv(2) | 0, wh*canonDiv(2) | 0, { ...opts, seed: ctx.seed, light: ctx.light, scale: ctx.scale });
    if(!cv) return null;
    const img = readCanvas(cv);
    return n.name === 'turing' ? [lum(img)] : [img, lum(img)];
  },
  texture(E, n){ const { ww, wh, ctx, deps, num, P, readCanvas, lum } = E;
    if(!deps.texture) return null;
    const type = n.name === 'turing' ? 'turing' : String(P(n, 'type', 'linen'));
    if(type === 'athanor') return null;              // never itself
    const opts = n.name === 'turing'
      ? { p1: num(n, 'scale', 100), p2: 80, p3: ['spots', 'coral', 'maze', 'worms', 'holes'].indexOf(P(n, 'pattern', 'coral'))*25, p4: 0 }
      : { p1: num(n, 'p1', 100), p2: num(n, 'p2', 100), p3: num(n, 'p3', 50) };
    const cv = deps.texture(type, ww*canonDiv(2) | 0, wh*canonDiv(2) | 0, { ...opts, seed: ctx.seed, light: ctx.light, scale: ctx.scale });
    if(!cv) return null;
    const img = readCanvas(cv);
    return n.name === 'turing' ? [lum(img)] : [img, lum(img)];
  },
  stitch(E, n){ const { ww, wh, unit, num, P, readCanvas, lum } = E;
    const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh);
    const k = unit/1536, off = num(n, 'offset', 14)*k*2, sz = Math.max(1, num(n, 'size', 4))*k*2;
    drawStitch(x, pathFromPoints(roundRectPoints(off, off, ww - off*2, wh - off*2, 0), true), String(P(n, 'style', 'scallop')),
      { period: sz*6 + unit*0.012, amp: sz*2 + unit*0.004, width: sz, color: '#fff', side: 1 });
    return [lum(readCanvas(c))];
  },
  levels(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const lo = num(n, 'lo', 0)/100, hi = Math.max(lo + 0.01, num(n, 'hi', 100)/100), g = Math.pow(2, (num(n, 'gamma', 50) - 50)/25), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.pow(Math.max(0, Math.min(1, (f[i] - lo)/(hi - lo))), g);
    return [o];
  },
  threshold(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const at = num(n, 'at', 50)/100, sf = Math.max(0.002, num(n, 'soft', 10)/200), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const t = Math.max(0, Math.min(1, (f[i] - at + sf)/(2*sf))); o[i] = t*t*(3 - 2*t); }
    return [o];
  },
  blur(E, n){ const { unit, input, num, asField, boxBlur } = E; const f = asField(input(n, 1)); if(!f) return null; return [boxBlur(f, num(n, 'radius', 8)*unit/1536*1.2)];
  },
  warp(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)), by = asField(input(n, 2)); if(!f) return null; if(!by) return [f];
    const A = num(n, 'amount', 20)/100*unit*0.08, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, a = by[q]*Math.PI*2;
      const sx = Math.max(0, Math.min(ww - 1, Math.round(x + Math.cos(a)*A))), sy = Math.max(0, Math.min(wh - 1, Math.round(y + Math.sin(a)*A))); o[q] = f[sy*ww + sx]; }
    return [o];
  },
  math(E, n){ const { N, input, P, flat, asField } = E;
    const a = asField(input(n, 1), 0), b = asField(input(n, 2), 0); if(!a && !b) return null;
    const A = a || flat(0), B = b || flat(0), op = P(n, 'op', 'add'), o = new Float32Array(N);
    const f = { add: (x, y) => x + y, multiply: (x, y) => x*y, max: Math.max, min: Math.min, difference: (x, y) => Math.abs(x - y), subtract: (x, y) => x - y }[op] || ((x, y) => x + y);
    for(let i = 0; i < N; i++) o[i] = Math.max(0, Math.min(1, f(A[i], B[i])));
    return [o];
  },
  mix(E, n){ const { N, input, num, asField, asImage } = E;
    const ia = input(n, 1), ib = input(n, 2), ta = input(n, 3), tp = num(n, 't', 50)/100;
    if(ia == null && ib == null) return null;
    // two colours by one amount: one colour (never a page of them)
    if(Array.isArray(ia) && Array.isArray(ib) && (ta == null || typeof ta === 'number')){ const k = ta == null ? tp : ta; return [[0, 1, 2].map(c => ia[c] + (ib[c] - ia[c])*k)]; }
    const t = asField(ta);
    const A = asImage(ia ?? 0), B = asImage(ib ?? 0), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = t ? t[i] : tp; o.r[i] = A.r[i] + (B.r[i] - A.r[i])*k; o.g[i] = A.g[i] + (B.g[i] - A.g[i])*k; o.b[i] = A.b[i] + (B.b[i] - A.b[i])*k; }
    return [o];
  },
  invert(E, n){ const { N, input, asField, isImg } = E; const v = input(n, 1); if(v == null) return null;
    if(isImg(v)){ const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ o.r[i] = 1 - v.r[i]; o.g[i] = 1 - v.g[i]; o.b[i] = 1 - v.b[i]; } return [o]; }
    const f = asField(v), o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = 1 - f[i]; return [o];
  },
  posterize(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const k = Math.max(2, Math.min(16, Math.round(num(n, 'steps', 5)))), o = new Float32Array(N);
    for(let i = 0; i < N; i++) o[i] = Math.min(k - 1, Math.floor(Math.max(0, f[i])*k))/(k - 1);
    return [o];
  },
  transform(E, n){ const { ww, wh, N, input, num, asField } = E;
    // tiled and turned about the page's centre (it repeats past its edges)
    const f = asField(input(n, 1)); if(!f) return null;
    const sc = Math.max(0.25, num(n, 'scale', 100)/100), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an), o = new Float32Array(N);
    const cx = ww/2, cy = wh/2;
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = (x - cx)/sc, dy = (y - cy)/sc;
      let sx = Math.round(cx + dx*ca + dy*sa), sy = Math.round(cy - dx*sa + dy*ca);
      sx = ((sx % ww) + ww) % ww; sy = ((sy % wh) + wh) % wh; o[y*ww + x] = f[sy*ww + sx];
    }
    return [o];
  },
  edges(E, n){ const { ww, wh, N, unit, input, num, field, asField } = E;
    // Sobel: where the field changes fastest
    const f = asField(input(n, 1)); if(!f) return null;
    const k = num(n, 'strength', 50)/50*unit/96, o = new Float32Array(N), at = (x, y) => f[Math.max(0, Math.min(wh - 1, y))*ww + Math.max(0, Math.min(ww - 1, x))];
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const gx = at(x+1,y-1) + 2*at(x+1,y) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x-1,y) - at(x-1,y+1);
      const gy = at(x-1,y+1) + 2*at(x,y+1) + at(x+1,y+1) - at(x-1,y-1) - 2*at(x,y-1) - at(x+1,y-1);
      o[y*ww + x] = Math.min(1, Math.hypot(gx, gy)*k/8);
    }
    return [o];
  },
  light(E, n){ const { N, unit, ctx, input, num, flat, asField, lightOf } = E;
    const h0 = asField(input(n, 1)); if(!h0) return null;
    const dial = input(n, 2), deg = typeof dial === 'number' ? dial*360 : (ctx.light ?? 315);
    const H = new Float32Array(N), rel = num(n, 'relief', 50)/100*unit*0.02;
    for(let i = 0; i < N; i++) H[i] = h0[i]*rel;
    const L = lightOf(H, deg, 1, num(n, 'gloss', 30)/100, num(n, 'shadow', 60)/100), lf = new Float32Array(N), sp = new Float32Array(N);
    for(let i = 0; i < N; i++){ lf[i] = Math.min(1, L.light[i]/L.flat*0.5); sp[i] = L.spec[i]; }
    return [lf, sp];
  },
  tint(E, n){ const { N, ctx, input, asField, asColour, hexCol } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const lc = asColour(input(n, 2), hexCol((ctx.tints || [])[0] || '#FFFFFF')), dc = asColour(input(n, 3), hexCol((ctx.tints || [])[1] || '#000000'));
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const t = f[i]; o.r[i] = dc[0] + (lc[0] - dc[0])*t; o.g[i] = dc[1] + (lc[1] - dc[1])*t; o.b[i] = dc[2] + (lc[2] - dc[2])*t; }
    return [o];
  },
  ramp(E, n){ const { N, input, num, asField, asColour } = E;
    const f = asField(input(n, 1), 0.5); if(!f) return null;
    const a = asColour(input(n, 2), [0, 0, 0]), b = asColour(input(n, 3), [1, 1, 1]), mid = Math.max(0.02, Math.min(0.98, num(n, 'mid', 50)/100));
    const g = Math.log(0.5)/Math.log(mid), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const t = Math.pow(Math.max(0, Math.min(1, f[i])), g); o.r[i] = a[0] + (b[0] - a[0])*t; o.g[i] = a[1] + (b[1] - a[1])*t; o.b[i] = a[2] + (b[2] - a[2])*t; }
    return [o];
  },
  blend(E, n){ const { N, input, num, P, asField, asImage } = E;
    const base = asImage(input(n, 1) ?? 0.5), lay = input(n, 2), m = asField(input(n, 3));
    if(lay == null) return [base];
    const L = asImage(lay), fn = STEP_BLEND_FN[P(n, 'mode', 'normal')] || STEP_BLEND_FN.normal, op = num(n, 'opacity', 100)/100;
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = op*(m ? m[i] : 1);
      for(const c of ['r', 'g', 'b']){ const b0 = base[c][i]; o[c][i] = b0 + (Math.max(0, Math.min(1, fn(b0, L[c][i]))) - b0)*k; } }
    return [o];
  },
  surface(E, n){ const { N, unit, ctx, input, flat, asField, asImage, lightOf } = E;
    const img = asImage(input(n, 1) ?? 0.5), h0 = asField(input(n, 2));
    if(!h0) return [img];
    // heights: the picture lit by the dial, as the engine lights a texture
    const H = new Float32Array(N); for(let i = 0; i < N; i++) H[i] = h0[i]*unit*0.01;
    const L = lightOf(H, ctx.light ?? 315, 1, 0.3, 0.6), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){ const k = L.light[i]/L.flat, s = L.spec[i]*0.6; o.r[i] = img.r[i]*k + s; o.g[i] = img.g[i]*k + s; o.b[i] = img.b[i]*k + s; }
    return [o];
  },
  colour(E, n){ const { P, hexCol } = E;
    return [hexCol(String(P(n, 'hex', '#808080')))];
  },
  accent(E, n){ const { ctx, P, hexCol } = E, k = (parseInt(P(n, 'slot', '1'), 10) || 1) - 1;
    return [hexCol((ctx.accents || [])[k] || ['#B0303A', '#C9A33A'][k] || '#808080')];
  },
  // a few large soft shapes and a little noise: where a drawing is dark
  forms(E, n){ const { ww, wh, unit, num } = E;
    const k = Math.max(1, Math.round(num(n, 'count', 5))), sz = num(n, 'size', 50)/50, nz = num(n, 'noise', 50)/100;
    const blobs = []; for(let i = 0; i < k; i++) blobs.push({ x: Math.random(), y: Math.random(), r: (0.18 + Math.random()*0.28)*sz, s: 0.5 + Math.random()*0.6 });
    const g = makeNoiseGrid(6, 6);
    // broad shapes: sampled on a lattice and blended between (smoothField), not at every pixel
    return [smoothField(ww, wh, Math.max(2, unit/96), (u, v) => { let t = 0; for(const b of blobs){ const q = ((u - b.x)**2 + (v - b.y)**2)/(b.r*b.r); t += b.s*Math.exp(-q*1.6); }
      return Math.max(0, Math.min(1, t*0.75 + (sampleNoiseGrid(g, 6, 6, u*5, v*5) - 0.5)*nz)); })];
  },
  // RAIN in depth: far back, soft wide sheets; nearer, streaks blurred by
  // their motion (fading at both ends). They come FROM the angle (the dial's
  // way); GUSTS swing them, page-wide, as a gust front would — near streaks
  // swing together with their neighbours, not each its own way.
  streaks(E, n){ const { ww, wh, unit, input, num, P, asField, marks, px, carea } = E;
    const base = asField(input(n, 1)), kind = P(n, 'kind', 'streaks');
    const from = num(n, 'angle', 0)*Math.PI/180, spread = num(n, 'spread', 0)*Math.PI/180;
    const share = num(n, 'light', 75)/100, k = num(n, 'strength', 50)/50, long = Math.max(ww, wh);
    const gust = makeNoiseGrid(5, 5), dirAt = (x, y) => from + (spread ? (sampleNoiseGrid(gust, 5, 5, x/ww*4, y/wh*4) - 0.5)*2*spread : 0);
    return [marks(base, 0.5, g => {
      if(kind === 'sheets'){
        for(let i = 0; i < 9; i++){
          const x = Math.random()*ww*1.4 - ww*0.2, bw = unit*(0.05 + Math.random()*0.13), len = long*1.6, a = dirAt(x, wh/2);
          const t = Math.random() < share*0.8 ? 230 : 60, al = (0.05 + Math.random()*0.07)*k;
          const gr = g.createLinearGradient(x - bw, 0, x + bw, 0);
          gr.addColorStop(0, `rgba(${t},${t},${t},0)`); gr.addColorStop(0.5, `rgba(${t},${t},${t},${al})`); gr.addColorStop(1, `rgba(${t},${t},${t},0)`);
          g.save(); g.translate(x, wh/2); g.rotate(a); g.translate(-x, -wh/2);
          g.fillStyle = gr; g.fillRect(x - bw, wh/2 - len/2, bw*2, len); g.restore();
        }
        return;
      }
      const count = Math.round(carea/7600*num(n, 'count', 100)/100), zoom = num(n, 'length', 100)/100;
      g.lineCap = 'round';
      for(let i = 0; i < count; i++){
        const len = (Math.random()*0.09 + 0.04)*long*zoom;
        const x = Math.random()*(ww + len) - len*0.5, y = Math.random()*(wh + len) - len, a = dirAt(x, y) + (Math.random() - 0.5)*spread*0.15;
        const dx = Math.sin(a)*len, dy = -Math.cos(a)*len;
        const t = Math.random() < share ? 205 + Math.random()*45 : 40 + Math.random()*30, al = Math.min(1, (0.22 + Math.random()*0.3)*k);
        const gr = g.createLinearGradient(x, y, x + dx, y + dy);
        gr.addColorStop(0, `rgba(${t|0},${t|0},${t|0},0)`); gr.addColorStop(0.5, `rgba(${t|0},${t|0},${t|0},${al})`); gr.addColorStop(1, `rgba(${t|0},${t|0},${t|0},0)`);
        g.strokeStyle = gr; g.lineWidth = px(2.4 + Math.random()*3.6);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
      }
    })];
  },
  // The plate is scratched
  // in one direction, always.
  // Patience, then a line.
  //
  // SILVERPOINT hatching: patches of short strokes, parallel, tapered at both
  // ends, slightly curved, heavier where the stylus pressed; the patches
  // gather where the TONE is high, and where it is highest a second layer
  // crosses (CROSS-HATCHING: none at 0, everywhere at 100). The strokes run
  // along the angle (the dial's way). Out: how much ink covers each point.
  hatching(E, n){ const { ww, wh, unit, input, num, asField, marks, px } = E;
    const tone = asField(input(n, 1)), at = (u, v) => tone ? tone[Math.min(wh - 1, (v*wh) | 0)*ww + Math.min(ww - 1, (u*ww) | 0)] : 0.5;
    const base = (num(n, 'angle', 125) - 90)*Math.PI/180, cross = num(n, 'cross', 38)/100, ca2 = num(n, 'crossAngle', 54)*Math.PI/180;
    const zoom = num(n, 'size', 100)/100, patches = Math.round(150*num(n, 'density', 100)/100), wt = num(n, 'weight', 50)/50;
    const noise = makeNoiseGrid(6, 6);
    return [marks(null, 0, g => {
      const stroke = (x, y, a, len, wd, bend, alpha) => {
        const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, L = [], R = [];
        for(let k = 0; k <= 10; k++){ const t = k/10, along = (t - 0.5)*len, off = Math.sin(t*Math.PI)*bend;
          const qx = x + ca*along + nx*off, qy = y + sa*along + ny*off, half = wd*Math.pow(Math.sin(t*Math.PI), 0.7)/2;
          L.push([qx + nx*half, qy + ny*half]); R.push([qx - nx*half, qy - ny*half]); }
        g.fillStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
        g.beginPath(); g.moveTo(L[0][0], L[0][1]); for(const p of L) g.lineTo(p[0], p[1]);
        for(let k = R.length - 1; k >= 0; k--) g.lineTo(R[k][0], R[k][1]); g.closePath(); g.fill(); };
      for(let i = 0; i < patches; i++){
        let u, v, t, tries = 0;
        do { u = Math.random(); v = Math.random(); t = at(u, v); tries++; } while(tries < 6 && Math.random() > 0.15 + 0.85*t);
        const qx = u*ww, qy = v*wh, size = unit*(0.045 + Math.random()*0.06)*zoom;
        const a = base + (sampleNoiseGrid(noise, 6, 6, u*5 + 2, v*5 + 2) - 0.5)*0.7;
        const layers = cross > 0 && t > 1 - cross ? 2 : 1;
        for(let l = 0; l < layers; l++){
          const la = a + l*ca2, k = Math.round(7 + t*12), gap = size/k;
          for(let j = 0; j < k; j++){
            const off = (j - (k - 1)/2)*gap, len = size*(0.55 + Math.random()*0.45)*Math.sqrt(1 - Math.min(0.9, (off/size*1.6)**2));
            const sx = qx - Math.sin(la)*off + (Math.random() - 0.5)*gap*0.4, sy = qy + Math.cos(la)*off + (Math.random() - 0.5)*gap*0.4;
            const press = 0.6 + Math.random()*0.4;
            stroke(sx, sy, la + (Math.random() - 0.5)*0.06, len, px(2.6 + t*3)*press*wt, len*(Math.random() - 0.5)*0.08, (0.5 + t*0.45)*press);
          }
        }
      }
    })];
  },
};

Object.assign(STEP_RUN, {
  // fold the picture into N mirrored wedges about the centre (a kaleidoscope)
  kaleidoscope(E, n){ const { ww, wh, N, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const k = Math.max(2, Math.round(num(n, 'folds', 6))), wedge = Math.PI*2/k, turn = num(n, 'turn', 0)*Math.PI/180, z = Math.max(0.25, num(n, 'zoom', 100)/100);
    const cx = ww/2, cy = wh/2, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)/z; let a = Math.atan2(dy, dx) - turn;
      a = ((a % wedge) + wedge) % wedge; if(a > wedge/2) a = wedge - a;            // mirrored inside each wedge
      const sx = Math.round(cx + Math.cos(a + turn)*r), sy = Math.round(cy + Math.sin(a + turn)*r);
      o[y*ww + x] = f[Math.min(wh - 1, Math.max(0, sy))*ww + Math.min(ww - 1, Math.max(0, sx))];
    }
    return [o];
  },
  // the picture wrapped round the centre: its left edge the middle, its rows rings
  polar(E, n){ const { ww, wh, N, unit, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const rings = Math.max(0.25, num(n, 'rings', 100)/100), turn = num(n, 'turn', 0)/360, cx = ww/2, cy = wh/2, R = unit*0.5, o = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
      const dx = x - cx, dy = y - cy, u = (((Math.atan2(dy, dx)/(Math.PI*2) + 0.5 + turn) % 1) + 1) % 1, v = (Math.hypot(dx, dy)/R*rings) % 1;
      o[y*ww + x] = f[Math.min(wh - 1, Math.floor(v*wh))*ww + Math.min(ww - 1, Math.floor(u*ww))];
    }
    return [o];
  },
});
Object.assign(STEP_COST, { kaleidoscope: () => 1.5, polar: () => 1.5 });
Object.assign(STEP_RUN, {
  number(E, n){ return [Math.max(0, Math.min(100, E.num(n, 'value', 50)))/100]; },
  // the node's own random stream (from the page's seed and the node's id): the same number until the seed changes
  random(E, n){ const lo = E.num(n, 'lo', 0), hi = E.num(n, 'hi', 100); return [(lo + (hi - lo)*Math.random())/100]; },
  maprange(E, n){ const { N, input, num, asField } = E;
    const f = asField(input(n, 1)); if(!f) return null;
    const a = num(n, 'inLo', 0)/100, b = num(n, 'inHi', 100)/100, c = num(n, 'outLo', 0)/100, d = num(n, 'outHi', 100)/100, k = Math.abs(b - a) < 1e-6 ? 0 : 1/(b - a), o = new Float32Array(N);
    for(let i = 0; i < N; i++){ const t = Math.max(0, Math.min(1, (f[i] - a)*k)); o[i] = c + (d - c)*t; }
    return [o]; },
  shape(E, n){ const { ww, wh, unit, P, num, field } = E;
    const form = String(P(n, 'form', 'circle')), R = num(n, 'size', 60)/200, sf = Math.max(0.002, num(n, 'soft', 10)/200), cx = num(n, 'x', 50)/100*ww/unit, cy = num(n, 'y', 50)/100*wh/unit;
    const edge = d => { const t = Math.max(0, Math.min(1, (R - d + sf)/(2*sf))); return t*t*(3 - 2*t); };
    return [field((u, v, x, y) => { const px = x/unit - cx, py = y/unit - cy, r = Math.hypot(px, py);
      if(form === 'ring'){ const t = Math.abs(r - R*0.8); return Math.max(0, Math.min(1, 1 - (t - R*0.12)/(sf*2 + 1e-3))); }
      if(form === 'square') return edge(Math.max(Math.abs(px), Math.abs(py)));
      if(form === 'diamond') return edge((Math.abs(px) + Math.abs(py))*0.75);
      if(form === 'star'){ const a = Math.atan2(py, px); return edge(r/(0.65 + 0.35*Math.cos(a*5))); }
      if(form === 'vignette') return 1 - Math.max(0, Math.min(1, (r - R*0.6)/(R*0.9 + sf*4)));
      return edge(r); })]; },
  split(E, n){ const { N, input, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const y = new Float32Array(N); for(let i = 0; i < N; i++) y[i] = 0.299*im.r[i] + 0.587*im.g[i] + 0.114*im.b[i];
    return [im.r, im.g, im.b, y]; },
  merge(E, n){ const { N, input, asField } = E; const r = asField(input(n, 1)), g = asField(input(n, 2)), b = asField(input(n, 3));
    if(!r && !g && !b) return null; const z = new Float32Array(N);
    return [{ r: r || z, g: g || z, b: b || z }]; },
  switch(E, n){ const { input, num, asField } = E;
    const c = input(n, 3), at = num(n, 'at', 50)/100;
    const v = typeof c === 'number' ? c : c == null ? 0 : (() => { const f = asField(c); let t = 0; for(let i = 0; i < f.length; i++) t += f[i]; return f.length ? t/f.length : 0; })();
    const pick = v >= at ? input(n, 2) : input(n, 1);
    return pick == null ? null : [pick]; },
  hsv(E, n){ const { N, input, num, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
    const turn = num(n, 'hue', 0)/360, sat = num(n, 'sat', 100)/100, val = num(n, 'val', 100)/100;
    const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
    for(let i = 0; i < N; i++){
      const r = im.r[i], g = im.g[i], b = im.b[i], mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
      let h = 0; if(dl > 1e-6) h = mx === r ? ((g - b)/dl + 6) % 6 : mx === g ? (b - r)/dl + 2 : (r - g)/dl + 4; h = h/6 + turn; h -= Math.floor(h);
      const s = mx > 1e-6 ? Math.min(1, dl/mx*sat) : 0, v = Math.min(1, mx*val), k = n2 => { const t = (n2 + h*6) % 6; return v - v*s*Math.max(0, Math.min(t, 4 - t, 1)); };
      o.r[i] = k(5); o.g[i] = k(3); o.b[i] = k(1);
    }
    return [o]; },
});
Object.assign(STEP_COST, { maprange: () => 1, shape: () => 1.5, split: () => 1, merge: () => 1, hsv: () => 2 });

/**
 * What travels on each port: field (a grey map), image (colour), colour (one
 * colour), value (one number). The editor colours ports and wires by these;
 * the evaluator converts between them wherever a port asks (athanor.js).
 */
export const VALUE_TYPES = ['field', 'image', 'colour', 'value'];
const STEP_IO = {
  knob: { outs: ['value'] }, hue: { outs: ['colour'] }, colour: { outs: ['colour'] }, accent: { outs: ['colour'] }, number: { outs: ['value'] }, random: { outs: ['value'] },
  split: { ins: ['image'] }, merge: { outs: ['image'] }, switch: { ins: ['image', 'image', 'value'], outs: ['image'] }, hsv: { ins: ['image'], outs: ['image'] }, dial: { outs: ['value', 'value'] }, seed: { outs: ['value'] },
  noise: { ins: ['value'] }, cells: { ins: ['value'] }, turing: { ins: ['value'] }, texture: { ins: ['value'], outs: ['image', 'field'] },
  mix: { ins: ['image', 'image', 'field'], outs: ['image'] }, light: { ins: ['field', 'value'] },
  tint: { ins: ['field', 'colour', 'colour'], outs: ['image'] }, ramp: { ins: ['field', 'colour', 'colour'], outs: ['image'] },
  blend: { ins: ['image', 'image', 'field'], outs: ['image'] }, surface: { ins: ['image', 'field'] },
  cloth: { ins: ['field', 'field', 'colour', 'colour'], outs: ['image'] },
  glaze: { ins: ['field', 'field', 'field', 'field', 'field', 'colour', 'colour'], outs: ['image'] },
};
// FILTER FORGE'S LESSON: every slider can take a wire. A step's range params
// each get an input port after its own (⚙ Name); a value wired there sets the
// param across its range (0 → its min, 1 → its max), so a Knob or the Dial
// can drive any of them — and a template shows its wiring instead of hiding it.
const PARAM_PORTS_OFF = new Set(['Inputs', 'Output']);

/** Every step: the part, its cost and what it does. */
const STEPS_RAW = { ...Object.fromEntries(Object.entries(STEP_PARTS).map(([k, part]) =>
  [k, { ...part, cost: STEP_COST[k] || (() => 1), run: STEP_RUN[k] }])),
  // the surfaces' own steps (each file a family; their parts carry their own cost and run)
  ...TOUCH_STEPS, ...CHAOS_STEPS, ...CARD_STEPS, ...WHIMSY_STEPS };
export const STEPS = Object.fromEntries(Object.entries(STEPS_RAW).map(([k, s]) => {
  const io = STEP_IO[k] || s.io || {};          // (a family's part may carry its own port types)
  const paramPorts = PARAM_PORTS_OFF.has(s.cat) ? [] : s.params.filter(p => p[2] === 'range').map(p => p[0]);
  return [k, { ...s, doc: STEP_DOCS[k] || s.doc || '',
    dataIns: s.ins.length,
    ins: s.ins.concat(paramPorts.map(key => '⚙ ' + s.params.find(p => p[0] === key)[1])),
    inTypes: s.ins.map((_, i) => (io.ins || [])[i] || 'field').concat(paramPorts.map(() => 'value')),
    outTypes: s.outs.map((_, i) => (io.outs || [])[i] || 'field'),
    paramPorts }];
}));
/** The input port (1-based) that drives a param, or 0 if it has none. */
export function paramPort(name, key){ const s = STEPS[name]; if(!s) return 0; const i = s.paramPorts.indexOf(key); return i < 0 ? 0 : s.dataIns + i + 1; }
/** A param's range (for a bound param with no range of its own), or null. */
export function stepRange(name, key){
  const p = ((STEPS[name] || {}).params || []).find(q => q[0] === key);
  return p && p[2] === 'range' ? [p[4].min, p[4].max] : null;
}
