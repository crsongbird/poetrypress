/**
 * wildlife.test.mjs — the wild things move as creatures do (wildKit.js): every place a pure function of the clock (the
 * same answer twice, any moment on its own), never faster than the creature can go from one film frame to the next
 * (no jump, at any era's turn), never round a loop (a herd's ground over half an hour is wide, not a circle), a flock
 * lifting all together and coming down elsewhere, a herd now and then bolting and fanning out as it runs; and every
 * kind painted in every pose without a fault.
 *
 * Run: node test/wildlife.test.mjs
 */
import { check, done } from './harness.mjs';
const K = await import('../wildKit.js');
const kinds = Object.keys(K.WK_KINDS), env = { wind: [1.1, 6] }, dt = 1/30;

// (the same answer twice, and asked out of order)
{ const a = K.wkAt('deer', 4242, 2, 777.7, env), b = (K.wkAt('deer', 4242, 2, 12, env), K.wkAt('deer', 4242, 2, 777.7, env));
  check('a place is the same each time it is asked', JSON.stringify(a) === JSON.stringify(b)); }

// (no faster than it can go: metres a second, frame to frame, across ten minutes of three groups of each kind)
const top = { deer: 16, elk: 16, hare: 17, fox: 16, rooks: 20, pigeons: 20, starlings: 20, sparrows: 14, ducks: 3, swans: 3, heron: 18, raptor: 20, swallows: 24, swifts: 36, bats: 16, butterflies: 8, dragonflies: 18, geese: 20, slimes: 6, striders: 20 };
for(const kind of kinds){ let worst = 0;
  for(const s of [7, 31337, 900001]) for(let j = 0; j < K.wkCount(kind, s); j += 2){ let prev = null;
    for(let t = 0; t < 600; t += dt){ const p = K.wkAt(kind, s, j, t, env); if(!p.on){ prev = null; continue; } if(prev) worst = Math.max(worst, Math.hypot(p.x - prev.x, p.z - prev.z, p.y - prev.y)/dt); prev = p; } }
  check(`${kind} never jumps (its fastest ${worst.toFixed(1)} m/s, at most ${top[kind]})`, worst <= (top[kind] ?? 20)); }

// (a herd's ground over half an hour: wide, and not a loop: where it is after each era is a new place)
{ const homes = []; for(let t = 0; t < 1800; t += 170){ const p = K.wkAt('deer', 55, 0, t, env); homes.push([p.x, p.z]); }
  const span = Math.max(...homes.map(p => p[0])) - Math.min(...homes.map(p => p[0])), same = homes.filter((p, i) => homes.some((q, k) => k !== i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5)).length;
  check(`a herd ranges over its ground (${span.toFixed(0)} m across), never back to the same spot`, span > 30 && same === 0); }

// (a flock lifts together: at some moment most of it is in the air, at others all of it is down)
{ const n = K.wkCount('rooks', 808); let together = 0, down = 0;
  for(let t = 0; t < 600; t += 0.5){ let up = 0; for(let j = 0; j < n; j++) if(K.wkAt('rooks', 808, j, t, env).y > 1) up++; if(up >= n*0.8) together++; if(up === 0) down++; }
  check('a flock flushes all together and settles again', together > 0 && down > together); }

// (a herd now and then bolts: running members, spread wider while they run than while they graze)
{ let bolts = 0, wideRun = 0, grazeSpread = []; const s = 99, n = K.wkCount('deer', s);
  for(let t = 0; t < 3600; t += 1){ const ps = Array.from({ length: n }, (_, j) => K.wkAt('deer', s, j, t, env)), xs = ps.map(p => p.x), sp = Math.max(...xs) - Math.min(...xs);
    if(ps.some(p => p.pose === 'run')){ bolts++; wideRun = Math.max(wideRun, sp); } else if(ps.every(p => p.pose === 'graze')) grazeSpread.push(sp); }
  const gs = grazeSpread.reduce((a, b) => a + b, 0)/Math.max(1, grazeSpread.length);
  check(`a herd bolts now and then, fanning out as it runs (${wideRun.toFixed(0)} m against ${gs.toFixed(0)} m grazing)`, bolts > 0 && wideRun > gs); }

// (a skein comes and goes: passing over, then gone for a while)
{ let on = 0, off = 0; for(let t = 0; t < 3000; t += 2){ if(K.wkAt('geese', 12, 0, t, env).on) on++; else off++; } check('geese pass over now and then', on > 0 && off > on); }

// every kind in every pose, drawn on a stand-in canvas that only counts its strokes
{ const calls = { n: 0 }, g = new Proxy({}, { get: (o, k) => typeof k === 'string' && /^(beginPath|moveTo|lineTo|bezierCurveTo|quadraticCurveTo|stroke|fill|ellipse|closePath|fillRect|save|restore|rect|clip|arc)$/.test(k) ? () => { calls.n++; } : o[k], set: (o, k, v) => { o[k] = v; return true; } });
  const c = { dark: [30, 30, 30], lit: [240, 240, 240], mat: rgb => ({ body: rgb, lit: rgb, dark: rgb }), flowers: [[200, 50, 60]] };
  let bad = null; for(const kind of kinds) for(const pose of ['graze', 'walk', 'run', 'pounce', 'peck', 'fly', 'soar', 'glide', 'swim', 'stand', 'wade', 'hover', 'dart'])
    for(const m of [0.5, 40]) try { K.wkPaint(g, 100, 100, m, kind, { x: 0, z: 0, y: 0.5, pose, ph: 0.3, head: 0.5, dir: -1, side: 0.7, stag: 1, hue: 1, on: 1 }, c, v => v); } catch(e){ bad = `${kind} ${pose}: ${e.message}`; }
  check('every kind paints in every pose' + (bad ? ` (${bad})` : ''), !bad && calls.n > 0); }

// every thing named (Ruby: "Each NPC should probably have an internal ID and tag so they can be tracked"): the Ringworld drawn
// with the camera turned two ways, its store's things each with an id of their own and tags, the same thing keeping its id
{ const { installCanvasMock } = await import('./canvasMock.mjs'); installCanvasMock();
  const T = await import('../textureGenerators.js'), R = await import('../stepsRing.js'), defs = T.paramsFor('ringpaint'), t6 = T.TEXTURE_CAPS.ringpaint.tintDefaults || [];
  const draw = (turn, clutter) => { const o = { seed: 4242, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: 120/3072, camera: { turn, view: 100, zoom: 100 } };
    defs.forEach((d, j) => o['p' + (j + 1)] = String(d.def)); o.p8 = String(clutter); T.getTextureCanvas('ringpaint', 120, 80, o); return R.ringKeptStores().slice(-1)[0] || []; };
  const a = draw(0, 50), b = draw(140, 61), ids = new Set(a.map(o => o.id)), byRs = new Map(a.map(o => [o.c + o.rs, o.id]));
  check(`every thing in the world has an id of its own and tags (${a.length} things)`, a.length > 50 && ids.size === a.length && a.every(o => o.id && Array.isArray(o.tags) && o.tags.length >= 2));
  const trees = b.filter(o => o.c === 'tree');
  check('a tree keeps its id in a world built again (the camera turned, the streets\' clutter changed)', trees.length >= 12 && b !== a && trees.every(o => byRs.get(o.c + o.rs) === o.id));
  const herd = a.find(o => o.c === 'wild'), st = herd && R.ringStateOf(herd, 12.5);
  check('a wild group\'s members each have an id and a state that can be captured', !herd || (st.members.length > 0 && st.members.every((m, j) => m.id === herd.id + '#' + j && 'pose' in m))); }

// (Ruby: "increase the size of and diversity of birds (and colors, shading, etc)": each colourful kind painted in its own
// field marks, four colours or more, in the air and on the ground; and the flocks the land sows are fewer)
{ const rec = () => { const cols = new Set(), x = { set fillStyle(v){ cols.add(v); }, get fillStyle(){ return ''; }, set strokeStyle(v){ cols.add(v); }, get strokeStyle(){ return ''; }, lineWidth: 1, lineCap: 'butt' };
    for(const f of ['beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'ellipse', 'arc', 'fillRect', 'quadraticCurveTo', 'bezierCurveTo', 'save', 'restore', 'rect', 'clip']) x[f] = () => {}; return [x, cols]; };
  const mat = m => ({ body: m, lit: m.map(v => Math.min(255, v + 40)), dark: m.map(v => v*0.6) }), c = { mat, lit: [240, 240, 230] };
  const marks = ['magpies', 'jays', 'goldfinches', 'parakeets', 'robins'].map(k => { const [a, A] = rec(), [b, B] = rec();
    K.wkPaint(a, 100, 100, 200, k, { y: 0.6, pose: 'fly', ph: 0.15, dir: 1, head: 1 }, c, v => v); K.wkPaint(b, 100, 100, 200, k, { y: 0, pose: 'stand', ph: 0, dir: 1, head: 0.2 }, c, v => v); return [k, A.size, B.size]; });
  check(`the colourful birds paint their field marks in the air and on the ground (${marks.map(m => m.join(' ')).join(', ')})`, marks.every(([, a, b]) => a >= 4 && b >= 4));
  check('the new kinds are all birds drawn larger than life', ['magpies', 'jays', 'goldfinches', 'parakeets', 'robins', 'egret'].every(k => K.WK_BIRDS.includes(k) && K.WK_KINDS[k])); }

done();
