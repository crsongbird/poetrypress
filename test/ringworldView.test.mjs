/**
 * ringworldView.test.mjs — the Ringworld seen from a moving camera (docs/prior-art/ringworld-stability.md): what a turn of
 * the camera may not change. The painter's perspective draws a thing larger toward the frame's edges; a tree or a
 * building drawn so keeps the stage of detail its true distance gives it (paintKit's `lod`), so turning past it never
 * redraws it as another stage. And what the camera sees of the sky: its lens held in bounds, the sun where the light
 * dial puts it, Saturn over some rings.
 *
 * Run: node test/ringworldView.test.mjs
 */
import { check, done } from './harness.mjs';
import { installCanvasMock, makeMockContext } from './canvasMock.mjs';
installCanvasMock();
const { pkTree, pkBuilding } = await import('../paintKit.js');
const { mulberry32 } = await import('../texCore.js');

const px = v => v, cols = { dark: [40, 60, 40], body: [60, 90, 60], lit: [120, 160, 100], trunk: [70, 52, 40], glow: [255, 200, 120], glow2: [120, 200, 255], sd: 1, L: [0.6, -0.8] };
const marks = st => [st.fills, st.strokes, st.arcs].join('/');
// drawn at h with its detail read at hd (lod = hd/h): as a thing at the middle of the frame, or the same thing toward
// its corner, drawn larger by the perspective
const tree = (kind, h, hd) => { const x = makeMockContext(600, 600); pkTree(x, 300, 580, h, { ...cols, lod: hd/h }, kind, mulberry32(77), px); return marks(x._stats); };
for(const kind of ['spruce', 'fir', 'oak', 'palm', 'pine', 'cedar', 'birch'])
  for(const hd of [6.3, 41, 77]) check(`a ${kind} ${hd} px tall at its true distance, drawn 1.6 times larger toward the frame's corner, keeps its stage`, tree(kind, hd, hd) === tree(kind, hd*1.6, hd));
const bldg = (h, hd) => { const x = makeMockContext(600, 600); pkBuilding(x, 300, 580, h, h*0.6, { ...cols, lod: hd/h }, 'city', 0, mulberry32(91), px, 'brick'); return marks(x._stats); };
for(const hd of [11, 33, 61]) check(`a brick building ${hd} px tall at its true distance keeps its stage drawn larger (windows, fire escape, streaks)`, bldg(hd, hd) === bldg(hd*1.6, hd));
// the Ringworld's LENS is held under 118° across the page's short side however far the camera zooms out (Ruby: "clamp
// the extremes of this fov"), and a middling zoom is left as it was
{ const G = await import('../stepsGenerative.js'), r = zoom => G.ringParams({ band: 45, walls: 12, altitude: 15, seed: 9, lens: 75, zoom, look: 0, lift: 15 }).lens;
  check('the Ringworld\'s widest lens is held under 118°, a middling one untouched', r(25) <= 118 && Math.abs(r(100) - 75) < 1e-9); }

// the Ringworld's SUN (Ruby: the light dial sets it, in the world, whatever the camera's turn): overhead it is the
// ring's own star; at the dial's rim it is on the horizon; facing the dial's way (camera Turn = the dial's angle) puts it
// straight ahead; east of where you look it stands to the right; its guide is where the painting puts it
{ const G = await import('../stepsGenerative.js'), ring = look => ({ band: 45, walls: 12, altitude: 15, placeBy: 'where the seed says', seed: 9, lens: 75, zoom: 100, look, up: 0.6, curved: true });
  const L = G.ringCamera(G.ringParams(ring(0))), star = G.ringSunDir(L, 315, 0), s = Math.hypot(L.Px, L.z0);
  check('the Ringworld\'s sun: overhead it is the ring\'s own star, at the ring\'s middle; at the dial\'s rim, on the horizon',
    Math.abs(star[0] + L.Px/s) < 1e-9 && Math.abs(star[2] + L.z0/s) < 1e-9 && Math.abs(G.ringSunDir(L, 120, 1)[0]) < 1e-9);
  const ahead = G.ringSunGuide(1, 1, ring(120), 120, 0.9), east = G.ringSunGuide(1, 1, ring(0), 90, 0.9), west = G.ringSunGuide(1, 1, ring(0), 270, 0.9), behind = G.ringSunGuide(1, 1, ring(180), 0, 0.95);
  const off = p => p === null || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1;
  check('…facing the dial\'s way puts it straight ahead; east of where you look it stands right, west left; behind you, off the frame',
    !!ahead && Math.abs(ahead.x - 0.5) < 0.01 && !!east && !!west && east.x > 0.5 && west.x < 0.5 && off(behind)); }

// the Ringworld orbiting Saturn (Ruby; The Arch's Saturn): never draws no Saturn, always does, and by the seed
// it is one ring in four, the rest drawn exactly as with never
{ const M = await import('./canvasMock.mjs'), doc = globalThis.document; M.installCanvasMock();   // (the DOM mock's canvases go uncounted)
  const A = await import('../athanor.js'), drawn = (saturn, seed) => { const g = A.athanorStarter('ringpaint');
    for(const n of Object.values(A.athanorNodes(g))) if(n.name === 'ringarch') n.data = { ...n.data, saturn };
    // (drawn twice and the second counted: the kit keeps what it can (a building's face read back once), so a first
    //  drawing makes canvases a second never does; compared warm, two drawings differ only by what they draw)
    A.evalAthanor(g, 160, 160, { seed, knobs: [], tints: [], canvas: true }, {});
    M.resetCreatedCanvases(); A.evalAthanor(g, 160, 160, { seed, knobs: [], tints: [], canvas: true }, {});
    return JSON.stringify(M.createdCanvases.map(c => c.getContext('2d')._stats)); };
  const seeds = Array.from({ length: 24 }, (_, i) => i + 1), saturnine = seeds.filter(s => drawn('by the seed', s) !== drawn('never', s));
  check('The Arch\'s Saturn: always draws something never does', seeds.slice(0, 4).every(s => drawn('always', s) !== drawn('never', s)));
  check(`…by the seed, about one ring in four orbits Saturn (${saturnine.length} of 24), the others exactly as never`, saturnine.length >= 2 && saturnine.length <= 12
    && saturnine.every(s => drawn('by the seed', s) === drawn('always', s)));
  globalThis.document = doc; }

done();
