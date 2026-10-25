/**
 * regions.test.mjs — the regions of a ring (regionKit.js) and what the Ringworld builds on them
 * (docs/prior-art/ringworld-regions.md). Ruby, 2026-10-25: "towns with walls; eras side by side … with clear borders;
 * factions holding regions; names from the seeds …; crystals of a color for each magical element ruling a region".
 * The regions are a pure function of the seed and the place and go round the ring; a Mixed ring shares its worlds out
 * region by region; every magic region has its element; where a way crosses a border it is marked; walls stand round
 * towns of the old worlds only, and nothing is built on them.
 *
 * Run: node test/regions.test.mjs
 */
import { check, done } from './harness.mjs';
const K = await import('../regionKit.js');

const W = 0.0566, M = W*0.00025;
// a pure function of the seed and the place, round the ring; regions some kilometres across, each one named
{ const A = K.rkRegions(77, { W, worlds: ['wilds'] }), B = K.rkRegions(77, { W, worlds: ['wilds'] }); let same = true, round = true; const ids = new Set();
  for(let k = 0; k < 400; k++){ const a = (k*0.37 % 1 - 0.5)*W*20, z = ((k*0.61) % 1 - 0.5)*W*0.95, id = A.at(a, z).id;
    if(B.at(a, z).id !== id) same = false; if(A.at(a + 2*Math.PI, z).id !== id) round = false; ids.add(id); }
  check('the regions are a pure function of the seed and the place: made twice, the same', same);
  check('the regions go round the ring: a place and the same place one turn on lie in one region', round);
  check(`twenty band-widths of the ring hold many regions, not one or hundreds (${ids.size})`, ids.size >= 10 && ids.size <= 120);
  const names = [...ids].map(id => A.info(id).name);
  check('every region has a name, and they differ', names.every(n => typeof n === 'string' && n.length > 3) && new Set(names).size > ids.size*0.8);
  check('every region is held by a faction with a name and a banner (a metal and a colour)', [...ids].every(id => { const f = A.info(id).faction; return f.name && f.field && f.charge && K.RK_DIVISIONS.includes(f.div) && (K.RK_TINCTURES.metals.includes(f.field) !== K.RK_TINCTURES.metals.includes(f.charge)); }));
  const fac = new Set([...ids].map(id => A.info(id).faction.id));
  check(`a faction holds several regions (${ids.size} regions, ${fac.size} factions)`, fac.size >= 2 && fac.size < ids.size); }
// a Mixed ring shares its worlds out region by region; in the magic world every region has its element, the four of old most often
{ const R = K.rkRegions(4242, { W, worlds: ['wilds', 'ruins', 'magic'] }), seen = new Set(), els = {}; let bad = 0;
  for(let k = 0; k < 600; k++){ const I = R.info(R.at((k/600 - 0.5)*W*60, ((k*0.618) % 1 - 0.5)*W*0.9).id); seen.add(I.world);
    if((I.world === 'magic') !== !!I.element) bad++; if(I.element) els[I.element.name] = (els[I.element.name] || 0) + 1; }
  check(`a Mixed ring's regions are of each of its worlds (${[...seen].join(', ')})`, seen.size === 3);
  check('a region has an element exactly when it is magic', bad === 0);
  const old = ['Fire', 'Wind', 'Water', 'Earth'].reduce((s, e) => s + (els[e] || 0), 0), all = Object.values(els).reduce((s, v) => s + v, 0);
  check(`the four elements of old rule most magic regions (${old} of ${all})`, all > 0 && old/all > 0.6); }
// at a border: b is small, and the region over it is another
{ const R = K.rkRegions(9, { W, worlds: ['wilds'] }); let ok = 0, n = 0;
  for(let k = 0; k < 2000 && n < 20; k++){ const a = k*W*0.01, z = 0.1*W, { id, id2, b } = R.at(a, z), q = R.at(a + W*0.01, z); if(q.id !== id){ n++; if(b < W*0.02 && q.b < W*0.02 && id2 === q.id) ok++; } }
  check(`on either side of a border each point knows it is near it, and which region lies over it (${ok} of ${n})`, n > 5 && ok >= n*0.8); }

// the Ringworld's World: each band names its world; By the Seed picks one of the six (now and then Mixed),
// and Mixed lays three different ones side by side
{ const { rgWorldOf, RG_WORLDS } = await import('../stepsRing.js');
  const named = [14, 29, 43, 57, 71, 86].map(v => rgWorldOf(1234, v).name), seeded = Array.from({ length: 60 }, (_, s) => rgWorldOf(s*7919, 0)), mixed = rgWorldOf(99, 100);
  check('the Ringworld\'s World: each band its world, in order', named.join() === RG_WORLDS.slice(1, 7).join());
  check('…By the Seed picks among them (and sometimes Mixed), each world a single list but Mixed\'s three, all different',
    seeded.every(w => RG_WORLDS.includes(w.name) && w.name !== 'seed') && new Set(seeded.map(w => w.name)).size >= 5 && seeded.every(w => w.name === 'mixed' ? w.list.length === 3 : w.list.join() === w.name)
    && mixed.name === 'mixed' && new Set(mixed.list).size === 3); }

// THE STORE: border marks where the ways cross, walls round old-world towns, nothing built on a wall
{ const { installCanvasMock } = await import('./canvasMock.mjs'); installCanvasMock();
  const T = await import('../textureGenerators.js'), SR = await import('../stepsRing.js'), defs = T.paramsFor('ringpaint'), t6 = T.TEXTURE_CAPS.ringpaint.tintDefaults || [];
  const store = (seed, world) => { const o = { seed, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: 200/3072, camera: { view: 100, zoom: 100 } };
    defs.forEach((d, j) => o['p' + (j + 1)] = String(d.def)); o.p3 = String(world); T.clearTextureCache(); T.getTextureCanvas('ringpaint', 200, 120, o); return SR.ringKeptStores().pop(); };
  let marks = 0, signs = 0, named = 0, walls = 0, onWall = 0, wrongWorld = 0, region = 0, things = 0;
  for(const [seed, world] of [[15, 14], [26, 28], [5, 71], [4, 71], [7, 86]]){ const st = store(seed, world); if(!st) continue;
    for(const o of st){ things++; if(o.region) region++; if(['boundary', 'banner', 'welcome'].includes(o.kind)){ marks++; if(o.kind === 'welcome'){ signs++; if(o.mark && o.mark.say) named++; } } }
    for(const wl of st.walls || []){ walls++; if(!['wilds', 'magic', 'ruins'].includes(wl.w)) wrongWorld++;
      for(const o of st) if(o.c === 'bldg'){ const d = Math.hypot(o.a - wl.a, o.z - wl.z); if(Math.abs(d - wl.rOf(Math.atan2(o.z - wl.z, o.a - wl.a))) < (o.wM*0.5)*M + wl.T*0.5) onWall++; } } }
  check(`where the ways cross a border it is marked: stones, banners, signs (${marks}), every sign naming where it stands (${named} of ${signs})`, marks > 0 && signs > 0 && named === signs);
  check(`every thing knows the region it stands in (${region} of ${things})`, things > 0 && region === things);
  check(`walls round some towns, and only the old worlds' (${walls}, ${wrongWorld} elsewhere)`, walls > 0 && wrongWorld === 0);
  check(`no building stands on a wall (${onWall})`, onWall === 0); }

done();
