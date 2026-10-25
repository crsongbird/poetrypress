/**
 * land.test.mjs — the land of a ring (landKit.js) and the mesh the Ringworld lays on it (docs/prior-art/ringworld-terrain.md).
 * Ruby, 2026-10-25: "real landmasses and biomes by the seed … nothing morphing as the camera rises or turns"; "no
 * mountain above the rim walls". The land is a pure function of the seed and the place; the mesh is fixed in the world,
 * so the camera rising, tilting or turning changes no corner of it.
 *
 * Run: node test/land.test.mjs
 */
import { check, done } from './harness.mjs';
const K = await import('../landKit.js');

const W = 0.0566, M = W*0.00025, mk = (seed, o = {}) => K.lkLand(seed, { W, Hw: W*0.215, forms: 0.5, z0: W*0.1, blend: 0.5, ...o });
// a pure function of the seed and the place: made twice, the same land; round the whole ring, it meets itself
{ const A = mk(77), B = mk(77); let same = true, round = true;
  for(let k = 0; k < 60; k++){ const a = (k*0.37 % 1 - 0.5)*W*20, z = ((k*0.61) % 1 - 0.5)*W*0.95;
    if(A.height(a, z, W*0.002) !== B.height(a, z, W*0.002)) same = false;
    if(Math.abs(A.height(a, z, W*0.01) - A.height(a + 2*Math.PI, z, W*0.01)) > M*0.01) round = false; }
  check('the land is a pure function of the seed and the place: made twice, the same heights', same);
  check('every noise of it goes round the ring: a place and the same place one turn on are one height', round); }
// no mountain above the rim walls, however rugged the seed or high the Landforms, the walls low or high
{ let worst = 0; for(const seed of [3, 9, 999, 4242, 1552113911]) for(const walls of [0.04, 0.215, 0.74]) { const L = mk(seed, { Hw: W*walls, forms: 1 });
    for(let k = 0; k < 400; k++){ const a = (k/400 - 0.5)*W*24, z = ((k*0.618) % 1 - 0.5)*W*0.99; worst = Math.max(worst, L.height(a, z, W*0.002)/(W*walls)); } }
  check(`no mountain above the rim walls (the highest at ${(worst*100).toFixed(0)}% of the walls' height)`, worst < 0.9); }
// real landmasses: some rings mostly land, some half water; where the seed stands you, land
{ const shares = [3, 7, 12345, 1552113911, 651484638, 2005838566, 88, 4242].map(seed => { const L = mk(seed); let wet = 0, n = 0;
    for(let i = 0; i < 60; i++) for(let j = 0; j < 12; j++){ n++; if(L.height((i/60 - 0.5)*W*16, (j/12 - 0.46)*W*0.92, W*0.004) < 0) wet++; } return wet/n; });
  check(`the sea's share is the seed's (${shares.map(v => v.toFixed(2)).join(' ')})`, Math.min(...shares) < 0.12 && Math.max(...shares) > 0.2);
  const stand = [3, 7, 12345, 1552113911, 651484638].map(seed => mk(seed).height(0, W*0.1, W*0.001)/M);
  check(`where the seed stands you is land (${stand.map(v => v.toFixed(0)).join(' ')} m)`, stand.every(v => v >= 5)); }
// the biomes: weights that sum to one, their transitions as wide as Detail asks
{ const mixed = blend => { const L = mk(4242, { blend }); let n = 0; for(let k = 0; k < 300; k++){ const a = (k/300 - 0.5)*W*30, z = ((k*0.618) % 1 - 0.5)*W*0.9, h = Math.max(0, L.height(a, z, W*0.01)), w = L.biomes(a, z, h);
      if(Math.abs(w.reduce((s, v) => s + v, 0) - 1) > 1e-9) return -1; if(Math.max(...w) < 0.8) n++; } return n; };
  const lo = mixed(0.15), hi = mixed(1);
  check(`every place's biome weights sum to one, and more of the land lies in transition the more Detail blends (${lo} → ${hi} of 300)`, lo >= 0 && hi > lo); }

// THE MESH: drawn from the camera low and high, turned and tilted, every corner of it the same height
{ const { installCanvasMock } = await import('./canvasMock.mjs'); installCanvasMock();
  const T = await import('../textureGenerators.js'), R = await import('../stepsRing.js'), defs = T.paramsFor('ringpaint'), t6 = T.TEXTURE_CAPS.ringpaint.tintDefaults || [];
  const draw = (cam, alt) => { const o = { seed: 1552113911, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: 240/3072, camera: { view: 100, zoom: 100, ...cam } };
    defs.forEach((d, j) => o['p' + (j + 1)] = String(d.def)); o.p6 = String(alt); T.clearTextureCache(); T.getTextureCanvas('ringpaint', 240, 160, o); return R.ringMeshOf(); };
  const base = draw({ turn: 0 }, 15), views = [draw({ turn: 0 }, 32), draw({ turn: 90 }, 15), draw({ turn: 200, view: 70 }, 15)];
  const lay = m => [m.c0, m.NG, m.NLV, m.cz.join()].join('|'), probe = m => { const out = []; for(let l = 0; l < m.NLV; l++) for(let k = 0; k < 12; k++) out.push(m.height(l, ((k*7) % (2*m.NG)) - m.NG, ((k*5) % (2*m.NG)) - m.NG)); return out; };
  const b0 = probe(base);
  check('the land\'s mesh is fixed in the world: the camera raised, turned or tilted, the same rings of cells', views.every(m => lay(m) === lay(base)));
  check('and every corner of it the same height: nothing morphs as the camera rises or turns', views.every(m => probe(m).every((v, k) => v === b0[k]))); }
done();
