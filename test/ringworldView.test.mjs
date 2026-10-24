/**
 * ringworldView.test.mjs — the Ringworld seen from a moving camera (docs/prior-art/ringworld-stability.md): what a turn of
 * the camera may not change. The painter's perspective draws a thing larger toward the frame's edges; a tree or a
 * building drawn so keeps the stage of detail its true distance gives it (paintKit's `lod`), so turning past it never
 * redraws it as another stage.
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
done();
