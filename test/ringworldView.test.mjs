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
const { pkTree, pkBuilding, pkShadowWay } = await import('../paintKit.js');
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

// THINGS' SHADOWS BY THE SUN: a shadow falls the way the sun throws it on the page (toward the eye, sideways), and one
// falling away from the eye is held short, never lying up the page over what stands farther; with no sun known, the old
// shadow down the side away from the light
{ const h = 100, toward = pkShadowWay({ shv: [0.3, 1.2] }, h), away = pkShadowWay({ shv: [0.8, -3] }, h), side = pkShadowWay({ shv: [-1.5, 0.1] }, h), none = pkShadowWay({ sd: 1 }, h);
  check(`a shadow toward the eye falls down the page (${toward.map(Math.round)})`, toward[1] > 30 && toward[1] <= 90);
  check(`a shadow away from the eye is held short, up the page by an eighth of the height at most, along its own way (${away.map(Math.round)})`, away[1] < 0 && away[1] >= -12.01 && away[0] > 0 && Math.abs(away[0]/away[1] - 0.8/-3) < 1e-6);
  check(`a shadow to the side falls to that side (${side.map(Math.round)})`, side[0] < -50);
  check('with no sun known, the old shadow away from the light', none[0] < 0 && none[1] > 0); }

// THE EYE CARRIED (a drone flight): the world it flies over is built once for the whole flight (every frame reads the same
// store, so nothing pops in or out), the land under it is the world's own (a place's true height the same seen from
// anywhere on the way), and where the eye has gone the picture changes
{ const { installCanvasMock } = await import('./canvasMock.mjs'); installCanvasMock();
  const T = await import('../textureGenerators.js'), SR = await import('../stepsRing.js'), defs = T.paramsFor('ringpaint'), t6 = T.TEXTURE_CAPS.ringpaint.tintDefaults || [];
  const shot = (u, flight) => { const o = { seed: 15, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: 200/3072, camera: { view: 100, zoom: 100, turn: 0, fly: { route: 'seed', u, secs: 10, ...(flight ? { flight } : {}) } } };
    defs.forEach((dd, j) => o['p' + (j + 1)] = String(dd.def)); o.p3 = '14'; T.clearTextureCache(); T.getTextureCanvas('ringpaint', 200, 120, o); const st = SR.ringKeptStores().pop(), m = SR.ringMeshOf(); return { st, m }; };
  const A = shot(0), B = shot(0.5), C = shot(1);
  check('a flight\'s world is built once: the same store at its start, its middle and its end', A.st === B.st && B.st === C.st && A.st.length > 50);
  check('the eye has gone somewhere: its rings stand about another place', B.m.ca && A.m.ca && B.m.ca[0] !== A.m.ca[0]);
  // (and the flight chosen reaches the picture: an orbit halfway round is not a reveal halfway out)
  const O = shot(0.5, 'orbit'); check('the flight chosen is the flight flown: an orbit is not drawn as a reveal', O.m.ca && B.m.ca && O.m.ca[0] !== B.m.ca[0]); }

// THE DRONE'S ROUTE (Ruby: "generate a route per seed that the camera follows … make sure the route is picturesque"): the
// seed's own, the same each time; it goes somewhere (its end far from its start), and as it goes the eye turns and looks down
{ const { installCanvasMock } = await import('./canvasMock.mjs'); installCanvasMock();
  const T = await import('../textureGenerators.js'), SR = await import('../stepsRing.js'), defs = T.paramsFor('ringpaint'), t6 = T.TEXTURE_CAPS.ringpaint.tintDefaults || [];
  const shot = u => { const o = { seed: 511298746, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: 160/3072, camera: { view: 100, zoom: 100, turn: 0, fly: { route: 'seed', u, secs: 12 } } };
    defs.forEach((dd, j) => o['p' + (j + 1)] = String(dd.def)); T.clearTextureCache(); T.getTextureCanvas('ringpaint', 160, 100, o); return { st: SR.ringKeptStores().pop(), m: SR.ringMeshOf() }; };
  const a = shot(0), b = shot(0.5), c = shot(1), c2 = shot(1);
  check('the seed\'s route is its own: the same flight twice', JSON.stringify(c.m.ca) === JSON.stringify(c2.m.ca) && JSON.stringify(c.m.cz) === JSON.stringify(c2.m.cz));
  check('the route goes somewhere, and its world is built once for all of it', (c.m.ca[0] !== a.m.ca[0] || c.m.cz[0] !== a.m.cz[0]) && a.st === b.st && b.st === c.st);
  // (Ruby, 2026-10-26: "The drone camera sometimes just suddenly switches direction or shakes": its eye turns evenly, never
  //  more than a few degrees in a hundredth of the flight, and never swings back and forth)
  const RT = SR.rgDroneRoute.last; let big = 0, flips = 0, prev = null, dPrev = 0;
  for(let k = 0; k <= 400; k++){ const y = RT.at(k/400).yaw; if(prev !== null){ const d = y - prev; big = Math.max(big, Math.abs(d)*4); if(Math.abs(d) > 0.05 && Math.abs(dPrev) > 0.05 && Math.sign(d) !== Math.sign(dPrev) && Math.abs(d - dPrev) > 1) flips++; if(Math.abs(d) > 0.05) dPrev = d; } prev = y; }
  check(`the drone's eye turns evenly (at most ${big.toFixed(1)}° in a hundredth of the flight, ${flips} sudden reversals)`, big < 8 && flips === 0);
  // (Ruby, 2026-10-26: "more than one option for a drone flight": an orbit keeps its distance round its sight, a dronie
  //  flies away from its start and climbs, a rise climbs where it stands; each from the start, each turning evenly)
  const flown = fl => { const o = { seed: 511298746, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: 160/3072, camera: { view: 100, zoom: 100, turn: 0, fly: { route: 'seed', u: 0.5, secs: 12, flight: fl } } };
    defs.forEach((dd, j) => o['p' + (j + 1)] = String(dd.def)); T.clearTextureCache(); T.getTextureCanvas('ringpaint', 160, 100, o); return SR.rgDroneRoute.last; };
  const even = R => { let mx = 0; for(let k = 1; k <= 200; k++) mx = Math.max(mx, Math.abs(R.at(k/200).yaw - R.at((k - 1)/200).yaw)*2); return mx; };
  const ob = flown('orbit'), dr = flown('dronie'), ri = flown('rise'), d = (p, q) => Math.hypot(p.a - q.a, p.z - q.z);
  check('the other flights: an orbit turns its eye half round and more as it circles, a dronie flies off and climbs, a rise climbs where it stands, each turning evenly',
    Math.abs(ob.at(1).yaw - ob.at(0).yaw) > 150 && d(ob.at(0.5), ob.at(0)) > 0 && d(dr.at(1), dr.at(0)) > d(dr.at(0.5), dr.at(0)) && dr.at(1).rise > dr.at(0).rise
    && d(ri.at(1), ri.at(0)) < 1e-9 && ri.at(1).rise > ri.at(0).rise*3 && ri.at(1).lift < ri.at(0).lift && [ob, dr, ri].every(R => even(R) < 8)); }

// (Ruby, 2026-10-26: "sudden color shifts from lighting/daytime changes are a no, they need to be a lil more gradual"):
// through a sunrise the sun's light on a slope and the dawn's warmth change by small steps, with no corner to turn at
{ const SR = await import('../stepsRing.js'); let sunStep = 0, duskStep = 0, duskBend = 0;
  for(const ndl of [0, 0.3, 0.7, 1]) for(let k = 1; k <= 200; k++){ const u0 = (k - 1)/200*0.5, u1 = k/200*0.5; sunStep = Math.max(sunStep, Math.abs(SR.rgSunK(u1, ndl) - SR.rgSunK(u0, ndl))); }
  for(let k = 1; k < 400; k++){ const d = x => SR.rgDusk(x/400), a = d(k) - d(k - 1), b = d(k + 1) - d(k); duskStep = Math.max(duskStep, Math.abs(b)); duskBend = Math.max(duskBend, Math.abs(b - a)); }
  check(`the sun's light comes on evenly as it rises (largest step ${sunStep.toFixed(3)} in a 400th of its climb)`, sunStep < 0.05);
  check(`dawn's and dusk's warmth swell and fade with no corner (largest step ${duskStep.toFixed(4)}, bend ${duskBend.toFixed(5)})`, duskStep < 0.02 && duskBend < 0.002); }

// (Ruby, 2026-10-26: "ground texture/texture lods recomputing so frequently is … terrible to look at": the ground's marks
// stand on the world's own grid, so a patch of the world cut into one cell or into four lays the same marks in it)
{ const SR = await import('../stepsRing.js'), M = 0.00001, c = 64*M, sc = 4/M, P = (a0, z0, cc) => [[a0*sc, z0*sc], [(a0 + cc)*sc, z0*sc], [(a0 + cc)*sc, (z0 + cc)*sc], [a0*sc, (z0 + cc)*sc]];
  const marks = cells => { const out = []; for(const [a0, z0, cc] of cells) SR.rgGroundGrid(P(a0, z0, cc), { a0, z0, c: cc, M }, 30, 2, (X, Y, sp, al, R, a, z) => out.push(`${a.toFixed(9)},${z.toFixed(9)},${al.toFixed(3)}`)); return out.sort().join('|'); };
  const one = marks([[0, 0, c]]), four = marks([[0, 0, c/2], [c/2, 0, c/2], [0, c/2, c/2], [c/2, c/2, c/2]]);
  check(`the ground's marks are the world's, not the mesh's: one cell or four lay the same ones (${one.split('|').length} marks)`, one.length > 0 && one === four); }

// (the land on WebGPU, ringGpu.js: where there is none, Node here, the canvas draws it, and the batch of triangles holds
// what it is given)
{ const G = await import('../ringGpu.js'), B = G.ringGpuBatch(), v = k => [k, k + 1, 0.5, 0.5, 0.5, 1, 10*k, 20*k, 1, 1, 0.5];
  for(let k = 0; k < 5000; k++) B.tri(v(k), v(k + 1), v(k + 2));
  check('without WebGPU the land is laid on the canvas, and the GPU batch keeps every triangle it is given', !G.ringGpuReady() && G.ringGpuDraw(B, 64, 64) === null && B.n === 5000*3*G.RG_STRIDE && B.data[(4999*3 + 2)*G.RG_STRIDE] === 5001);
  // (the things' quads: kept in order as they grow, and without WebGPU none laid there, no sheet kept, the canvas paints)
  const T = G.ringGpuThingBatch(); for(let k = 0; k < 3000; k++) T.put(k, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, k % 4, 0.5, 1, 0, 0, 0, 0);
  check('the GPU\'s quads for the things keep their order, and without WebGPU the canvas paints them', T.n === 3000*G.RG_TSTRIDE && T.data[2999*G.RG_TSTRIDE] === 2999 && T.data[2999*G.RG_TSTRIDE + 11] === 3
    && G.ringGpuThings(T, 64, 64, { S: 2048, pages: [] }, {}) === null && G.ringGpuSheet('x') === null && G.ringGpuPutSheet('x', null) === null && G.ringGpuLandMaps() === null);
  // (the buildings' solids: kept in order as they grow; a turned building's shape read as the canvas reads it, a gabled
  //  one with its ridge over its eaves, and none for a building the canvas does not turn)
  const MB = G.ringGpuMeshBatch(), mv = k => Array.from({ length: G.RG_MSTRIDE }, (_, j) => j ? 0.5 : k); for(let k = 0; k < 2000; k++) MB.tri(mv(k), mv(k + 1), mv(k + 2));
  const PK = await import('../paintKit.js'), cc = { body: [180, 170, 150], lit: [220, 210, 190], dark: [90, 80, 70], glow: [255, 220, 160], sd: 1, raw: m => m, rawBody: [180, 170, 150], rawLit: [220, 210, 190], rawDark: [90, 80, 70] };
  const cot = PK.pkBuildingShape(7, 9, cc, 'village', mulberry32(5), v => v, 'cottage'), flat = PK.pkBuildingShape(30, 12, cc, 'city', mulberry32(6), v => v, 'brick');
  check('the buildings\' solids keep their triangles, and a building is turned into a solid as the canvas turns it', MB.n === 2000*3*G.RG_MSTRIDE && MB.data[1999*3*G.RG_MSTRIDE] === 1999
    && cot && cot.eave > 0 && cot.ridge > cot.eave && cot.a > 0.15 && cot.a < 1.2 && flat && !flat.eave && flat.tiers.length >= 1 && typeof cot.paint === 'function'
    && PK.pkBuildingShape(7, 9, cc, 'village', mulberry32(5), v => v, 'no-such-kind') === null);
  // (depth by one over the distance, as a camera's: even across a triangle of the land seen in perspective, the near given the room)
  check('depth runs from the eye to the farthest by one over the distance', G.ringGpuDepth(1, 1, 1000) === 0 && G.ringGpuDepth(1000, 1, 1000) === 1 && Math.abs(G.ringGpuDepth(2, 1, 1000) - 0.5005) < 0.001 && G.ringGpuDepth(5000, 1, 1000) === 1); }

done();
