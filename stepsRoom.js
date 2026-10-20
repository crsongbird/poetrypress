/**
 * stepsRoom.js — THE ROOM CASTER, Liminal Spaces' one process part (ROADMAP §2 L3; prior art
 * docs/prior-art/liminal-spaces.md): an empty interior built for passing through, cast as a ray-caster casts one, a
 * grid of cells with walls a full storey high, floors and ceilings between, pool basins sunk in the floor. The seed
 * picks the kind of place (the lobby of yellowed wallpaper, a concrete warehouse, maintenance tunnels, the poolrooms,
 * a hotel corridor, a school hallway after hours, a hospital corridor, a subway passage of white tile, a parking
 * garage, a dead mall, an office after hours), builds its layout (a long corridor with doors and a turn into the dark,
 * an open plan of stubs and pillars, a maze, a hall of pools), hangs its lights on the ceiling's grid (some missing,
 * some dead) and stands a camera in it at waist to eye height, often dead-centre down a corridor.
 *
 * It hands the graph grey maps, as a renderer's buffers, for general parts to colour, light, fog and grain:
 *   surface   which surface each point is: void 0 · floor ¼ · ceiling ½ · wall ¾ · trim 1 (doors, wainscot, stripes,
 *             lockers, a pool's edge) — a Gradient Map in bands colours each with its own hue
 *   depth     how far (0 near, 1 at the space's reach, where the dark swallows it)
 *   light     the light reaching each point from the fixtures, through the open cells only (a light map, so it never
 *             leaks through a wall)
 *   pattern   each surface's own pattern and tone: tiles and grout, carpet, wallpaper stripes, concrete, drop-ceiling
 *             grid (1 the surface's own colour, darker for its lines and stains)
 *   lamps     the fixtures themselves, glowing (the dead ones faint)
 *   water     the water in the pools, with its ripples
 *   shade     how each face turns from the room's light: floors full, ceilings less, walls by their way
 * Rules from the prior art (§2): nobody there, spaces made for passing through, familiar but a little off, repetition
 * with no landmark, never an arrival, the end hidden in the dark, light even or in islands, never cosy.
 */
import { mulberry32 } from './texCore.js';

const RM_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const rmClamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
/** The kinds of place the seed chooses among (the Kind setting fixes one): how each is built, lit and surfaced. */
export const ROOM_KINDS = {
  //            layout       cell  ceiling   width    light style   spacing  floor     wall       ceiling   trim         tones (floor, wall, ceiling, trim)
  lobby:     { lay: 'open',  cs: 1.2, h: [2.5, 2.7], w: [1, 1], lamp: 'troffer', every: 2, floor: 'carpet', wall: 'stripes', ceil: 'droptile', trim: 'none', tone: [0.78, 0.95, 0.92, 0.8], weight: 18 },
  warehouse: { lay: 'hall',  cs: 1.2, h: [3.5, 6],   w: [1, 1], lamp: 'hanging', every: 5, floor: 'concrete', wall: 'concrete', ceil: 'concrete', trim: 'none', tone: [0.62, 0.72, 0.5, 0.6], weight: 8 },
  tunnels:   { lay: 'maze',  cs: 1.2, h: [2.2, 2.4], w: [1, 1], lamp: 'bulb',    every: 3, floor: 'concrete', wall: 'pipes', ceil: 'concrete', trim: 'band', tone: [0.42, 0.55, 0.45, 0.9], weight: 6 },
  poolrooms: { lay: 'pools', cs: 1.2, h: [3, 5],     w: [1, 1], lamp: 'skylight', every: 3, floor: 'tile', wall: 'tile', ceil: 'tile', trim: 'pooledge', tone: [0.98, 0.98, 0.96, 0.9], weight: 18 },
  hotel:     { lay: 'corridor', cs: 1.2, h: [2.4, 2.6], w: [1, 2], lamp: 'sconce', every: 3, floor: 'hexcarpet', wall: 'damask', ceil: 'plain', trim: 'wainscot', tone: [0.55, 0.85, 0.9, 0.6], weight: 9 },
  school:    { lay: 'corridor', cs: 1.2, h: [2.7, 3],  w: [2, 3], lamp: 'troffer', every: 3, floor: 'vct', wall: 'block', ceil: 'droptile', trim: 'lockers', tone: [0.82, 0.9, 0.92, 0.7], weight: 8 },
  hospital:  { lay: 'corridor', cs: 1.2, h: [2.6, 2.8], w: [2, 2], lamp: 'troffer', every: 2, floor: 'vinyl', wall: 'plain', ceil: 'droptile', trim: 'rail', tone: [0.9, 0.95, 0.95, 0.75], weight: 7 },
  subway:    { lay: 'corridor', cs: 1.2, h: [2.5, 2.7], w: [2, 3], lamp: 'strip', every: 1, floor: 'tactile', wall: 'tile', ceil: 'plain', trim: 'posters', tone: [0.78, 0.97, 0.9, 0.85], weight: 8 },
  garage:    { lay: 'garage', cs: 1.2, h: [2.1, 2.4], w: [1, 1], lamp: 'tube', every: 4, floor: 'stalls', wall: 'concrete', ceil: 'concrete', trim: 'colband', tone: [0.55, 0.68, 0.6, 0.9], weight: 7 },
  mall:      { lay: 'hall',  cs: 1.2, h: [4, 7],     w: [1, 1], lamp: 'skylight', every: 2, floor: 'bigtile', wall: 'storefront', ceil: 'plain', trim: 'grille', tone: [0.85, 0.7, 0.8, 0.75], weight: 6 },
  office:    { lay: 'open',  cs: 1.2, h: [2.5, 2.7], w: [1, 1], lamp: 'troffer', every: 2, floor: 'carpettile', wall: 'plain', ceil: 'droptile', trim: 'cubicle', tone: [0.62, 0.88, 0.92, 0.72], weight: 5 },
};
const ROOM_KIND_KEYS = Object.keys(ROOM_KINDS);
/** The Kind setting's stops: Seeded, then each kind in ROOM_KINDS's order. */
export const ROOM_KIND_LABEL = 'Kind: Seeded · ' + ['Lobby', 'Warehouse', 'Tunnels', 'Poolrooms', 'Hotel', 'School', 'Hospital', 'Subway', 'Garage', 'Mall', 'Office'].join(' · ');

// value noise on a hashed lattice, for carpets, stains and concrete
function rmNoise(seed){
  const H = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0)/4294967296; };
  const s = t => t*t*(3 - 2*t);
  const vn = (x, y) => { const X = Math.floor(x), Y = Math.floor(y), u = s(x - X), v = s(y - Y);
    return (H(X, Y)*(1 - u) + H(X + 1, Y)*u)*(1 - v) + (H(X, Y + 1)*(1 - u) + H(X + 1, Y + 1)*u)*v; };
  return { H, vn, fbm: (x, y) => vn(x, y)*0.55 + vn(x*2.1 + 7, y*2.1)*0.3 + vn(x*4.3, y*4.3 + 3)*0.15 };
}

/**
 * THE PLACE: its grid (0 open, 1 wall, 2 door in a wall, 3 pool, 4 pillar), its lights, the camera.
 * o: kind ('seeded' or a key), reach 0..1, ceiling 0..1, width 0..1, lights 0..1, failing 0..1, strange 0..1
 */
export function roomPlan(R, o){
  const rnd = (a, b) => a + R()*(b - a), pick = a => a[Math.floor(R()*a.length)];
  let kind = o.kind;
  if(!ROOM_KINDS[kind]){ const tot = ROOM_KIND_KEYS.reduce((t, k) => t + ROOM_KINDS[k].weight, 0); let t = R()*tot; kind = ROOM_KIND_KEYS.find(k => (t -= ROOM_KINDS[k].weight) < 0) || 'lobby'; }
  const K = ROOM_KINDS[kind], strange = o.strange;
  const H = (K.h[0] + (K.h[1] - K.h[0])*o.ceiling)*(R() < strange*0.5 ? rnd(0.82, 0.9) : 1);   // (a ceiling a little too low, when strange)
  const W = 64, D = 64, M = new Uint8Array(W*D).fill(1), at = (x, z) => x < 0 || z < 0 || x >= W || z >= D ? 1 : M[z*W + x], set = (x, z, v) => { if(x >= 0 && z >= 0 && x < W && z < D) M[z*W + x] = v; };
  const reach = Math.round(14 + o.reach*44);
  let cam = { x: W/2 + 0.5, z: 2.5, yaw: 0 }, axis = true;
  if(K.lay === 'corridor'){
    // a long corridor (too long, when strange), doors along it on both sides, a turn into the dark at its end, a branch now and then
    const w = Math.max(1, Math.round(K.w[0] + (K.w[1] - K.w[0])*o.width + (R() < 0.2 ? 1 : 0))), x0 = Math.floor(W/2 - w/2), len = Math.min(D - 8, Math.round(reach*(0.7 + strange*0.5)));
    for(let z = 1; z < 1 + len; z++) for(let x = x0; x < x0 + w; x++) set(x, z, 0);
    const doorEvery = 2 + Math.floor(R()*3);
    for(let z = 3; z < len; z += doorEvery){ for(const side of [-1, 1]){ const x = side < 0 ? x0 - 1 : x0 + w; if(R() < 0.85){
      if(R() < 0.18){ set(x, z, 0); for(let k = 1; k < 3; k++) for(let dz = -1; dz <= 1; dz++) set(x + side*k, z + dz, 0); }   // an open door onto a dark room
      else set(x, z, 2); } } }
    const end = 1 + len, turn = R() < 0.5 ? -1 : 1, tw = w;
    for(let z = end; z < end + tw; z++) for(let x = x0; x < x0 + w; x++) set(x, z, 0);
    for(let k = 0; k < 20; k++) for(let z = end; z < end + tw; z++) set(turn < 0 ? x0 - 1 - k : x0 + w + k, z, 0);
    if(R() < 0.4){ const bz = 4 + Math.floor(R()*(len - 6)), side = R() < 0.5 ? -1 : 1; for(let k = 1; k < 16; k++) for(let dz = 0; dz < w; dz++) set(side < 0 ? x0 - k : x0 + w - 1 + k, bz + dz, 0); }
    cam = { x: x0 + w/2, z: 1.3, yaw: R() < 0.7 ? rnd(-0.06, 0.06) : rnd(-0.35, 0.35) };
  } else if(K.lay === 'maze'){
    // a maze of one-cell corridors (the recursive backtracker), many dead ends
    const C = 15, cell = (i, j) => [W/2 - C + 2*i, 2 + 2*j], seen = new Uint8Array(C*C), stack = [[Math.floor(C/2), 0]]; seen[stack[0][1]*C + stack[0][0]] = 1;
    { const [x, z] = cell(...stack[0]); set(x, z, 0); }
    while(stack.length){ const [i, j] = stack[stack.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < C && b < C && !seen[b*C + a]);
      if(!nb.length){ stack.pop(); continue; }
      const [a, b] = nb[Math.floor(R()*nb.length)], [x1, z1] = cell(i, j), [x2, z2] = cell(a, b); seen[b*C + a] = 1;
      set(x2, z2, 0); set((x1 + x2)/2, (z1 + z2)/2, R() < 0.12 ? 2 : 0); stack.push([a, b]); }
    // (a few loops, so it isn't a tree)
    for(let k = 0; k < 18; k++){ const x = W/2 - C + 1 + Math.floor(R()*(2*C - 2)), z = 3 + Math.floor(R()*(2*C - 2)); if((x + z) % 2) set(x, z, 0); }
    const [sx, sz] = cell(Math.floor(C/2), 0); cam = { x: sx + 0.5, z: sz + 0.5, yaw: 0 };
  } else {
    // open plans: a lobby of partial walls and stubs, a hall on a column grid, a garage open at its edges, a hall of pools
    const ow = Math.round(18 + o.reach*26), od = Math.round(18 + o.reach*30), x0 = Math.floor(W/2 - ow/2);
    for(let z = 1; z < 1 + od; z++) for(let x = x0; x < x0 + ow; x++) set(x, z, 0);
    if(K.lay === 'open'){
      // partial walls and stubs, rooms of differing shape, doorless
      for(let k = 0, n = Math.round(10 + R()*14); k < n; k++){ const horiz = R() < 0.5, len = 2 + Math.floor(R()*7), x = x0 + 2 + Math.floor(R()*(ow - 4)), z = 4 + Math.floor(R()*(od - 4));
        for(let s = 0; s < len; s++) set(horiz ? x + s : x, horiz ? z : z + s, 1); }
      for(let k = 0, n = Math.round(R()*8); k < n; k++) set(x0 + 2 + Math.floor(R()*(ow - 4)), 4 + Math.floor(R()*(od - 4)), 4);
      if(kind === 'office') for(let z = 6; z < od - 2; z += 2) for(let x = x0 + 2; x < x0 + ow - 2; x += 2) if(R() < 0.55) set(x, z, 5);   // (cubicle partitions, half height)
    } else {
      const g = K.lay === 'garage' ? 6 : 5 + Math.floor(R()*2);
      for(let z = 4; z < od; z += g) for(let x = x0 + 2; x < x0 + ow - 1; x += g) set(x, z, 4);
      if(K.lay === 'pools'){
        // pool basins sunk in the floor, joined by tile walkways; pillars stand in some
        for(let k = 0, n = 2 + Math.floor(R()*4); k < n; k++){ const pw = 3 + Math.floor(R()*7), pd = 3 + Math.floor(R()*9), px = x0 + 1 + Math.floor(R()*(ow - pw - 2)), pz = 4 + Math.floor(R()*(od - pd - 3));
          for(let z = pz; z < pz + pd; z++) for(let x = px; x < px + pw; x++) if(at(x, z) !== 1) set(x, z, at(x, z) === 4 && R() < 0.5 ? 4 : 3); }
        // and walls dividing the hall into rooms, with arches
        for(let k = 0, n = 1 + Math.floor(R()*3); k < n; k++){ const z = 6 + Math.floor(R()*(od - 8)); for(let x = x0; x < x0 + ow; x++) if(at(x, z) === 0) set(x, z, 1);
          for(let a = 0; a < 2; a++){ const ax = x0 + 1 + Math.floor(R()*(ow - 3)); set(ax, z, 0); set(ax + 1, z, 0); } }
      }
      if(K.lay === 'garage') for(let z = 1; z < 1 + od; z++){ set(x0 - 1, z, 6); set(x0 + ow, z, 6); }   // (open bays at the edges: the night beyond)
    }
    // the camera: in from the near edge, looking along the space (or across it)
    cam = { x: x0 + ow*rnd(0.3, 0.7), z: 2.2, yaw: R() < 0.4 ? 0 : rnd(-0.6, 0.6) }; axis = Math.abs(cam.yaw) < 0.1;
    set(Math.floor(cam.x), Math.floor(cam.z), at(Math.floor(cam.x), Math.floor(cam.z)) === 3 ? 0 : 0);
  }
  // the lights, on the ceiling's grid: some slots empty, some dead
  const lamps = [], ev = K.every, dens = 0.35 + 0.65*o.lights;
  const maze = K.lay === 'maze';
  for(let z = 1; z < D - 1; z += maze ? 1 : ev) for(let x = 1; x < W - 1; x += (maze || K.lamp === 'strip' || K.lamp === 'sconce' ? 1 : ev)){ const v = at(x, z); if(v !== 0 && v !== 3) continue;
    if(K.lamp === 'sconce' && !(at(x - 1, z) === 1 || at(x + 1, z) === 1)) continue;
    if(R() > dens/(maze ? ev : 1)) continue;
    lamps.push({ x: x + 0.5, z: z + 0.5, on: R() > o.failing*0.45, k: rnd(0.8, 1.15) }); }
  // (where the seed didn't line the camera up with a corridor, it looks the longest way it can see, give or take)
  if(K.lay !== 'corridor'){ let best = -1, by = cam.yaw;
    for(let k = 0; k < 24; k++){ const a = k/24*Math.PI*2, sx = Math.sin(a), sz = Math.cos(a); let d = 0; while(d < 40){ const v = at(Math.floor(cam.x + sx*d), Math.floor(cam.z + sz*d)); if(v !== 0 && v !== 3 && v !== 5) break; d += 0.25; }
      const score = d*(0.8 + 0.4*R()); if(score > best){ best = score; by = a; } }
    cam.yaw = by + (axis ? 0 : rnd(-0.25, 0.25)); }
  return { kind, K, M, W, D, H, cam, lamps, reach, axis, at };
}

/** The buffers (fields on the grid ww × wh) of a plan seen through its camera. cam: turn (0..360), view (0..130), lens. */
export function roomCast(ww, wh, P, o){
  const { K, M, W, D, at } = P, cs = K.cs, Hc = P.H, nz = rmNoise(o.seed), R = mulberry32(o.seed ^ 0x9e37);
  const N = ww*wh, surf = new Float32Array(N), depth = new Float32Array(N), light = new Float32Array(N), pat = new Float32Array(N), lamps = new Float32Array(N), water = new Float32Array(N), shade = new Float32Array(N);
  // the light map: each lamp's light spread through the open cells only (so no wall lets it through)
  const L = new Float32Array(W*D), open = (x, z) => { const v = at(x, z); return v === 0 || v === 3 || v === 5; };
  // (each lamp reaches as far as the lamps are spaced, and farther the higher it hangs: a big hall's few lamps light it)
  const Hn0 = Hc/cs, spread = 1 + K.every*K.every*0.3 + Hn0*0.6, Rr = Math.round(4 + K.every*1.6 + Hn0*0.5);
  for(const l of P.lamps){ if(!l.on) continue; const lx = Math.floor(l.x), lz = Math.floor(l.z), q = [[lx, lz, 0]], seen = new Map([[lz*W + lx, 0]]);
    while(q.length){ const [x, z, d] = q.shift(); const e = Math.hypot(x + 0.5 - l.x, z + 0.5 - l.z); L[z*W + x] += l.k/(1 + (e*e)/spread);
      if(d >= Rr) continue; for(const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const X = x + a, Z = z + b, k = Z*W + X; if(!open(X, Z) || seen.has(k)) continue; seen.set(k, d + 1); q.push([X, Z, d + 1]); } } }
  const Lat = (x, z) => { const fx = x - 0.5, fz = z - 0.5, X = Math.floor(fx), Z = Math.floor(fz), u = fx - X, v = fz - Z, g = (a, b) => open(a, b) ? L[b*W + a] : 0;
    return (g(X, Z)*(1 - u) + g(X + 1, Z)*u)*(1 - v) + (g(X, Z + 1)*(1 - u) + g(X + 1, Z + 1)*u)*v; };
  // the camera: where it stands, which way it looks (the seed's, turned by the camera dial), how wide
  const eye = (0.8 + 0.9*R())/cs*(K.lay === 'pools' ? 0.9 : 1), Hn = Hc/cs, yaw = P.cam.yaw + (o.turn || 0)*Math.PI/180;
  const pitch = -(1 - Math.min(1, (o.view ?? 100)/100))*0.75 + (R() - 0.5)*0.06, roll = (R() < o.strange*0.6 ? (R() - 0.5)*0.09 : 0) + (K === ROOM_KINDS.lobby ? (R() - 0.5)*0.05 : 0);
  const hfov = (60 + 30*R())*Math.PI/180/Math.max(0.25, (o.lens || 100)/100), fx = Math.tan(hfov/2), aspect = wh/ww;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const far = P.reach*1.1, poolDepth = 0.35 + 0.6*R(), wl = poolDepth/cs;
  const floorAt = v => v === 3 ? -wl : 0;
  // each surface's own pattern and tone, at a point of it (world units: cells; u along it, v up it)
  const patOf = (kindOfSurface, cls, u, v) => {
    const tone = K.tone[cls === 0.25 ? 0 : cls === 0.75 ? 1 : cls === 0.5 ? 2 : 3], line = (t, w) => { const f = t - Math.floor(t); return f < w || f > 1 - w ? 1 : 0; };
    const m = cs, U = u*m, V = v*m;   // (metres)
    switch(kindOfSurface){
      case 'carpet': return tone*(0.86 + 0.14*nz.fbm(U*1.5, V*1.5) - 0.2*Math.max(0, nz.fbm(U*0.25 + 9, V*0.25) - 0.62)*3);
      case 'carpettile': return tone*(0.9 + 0.1*nz.vn(U*6, V*6) - 0.08*line(U/0.5, 0.02) - 0.08*line(V/0.5, 0.02));
      case 'hexcarpet': { const a = Math.floor(U/0.3 + Math.floor(V/0.26) % 2*0.5), b = Math.floor(V/0.26); return tone*((a + b) % 3 === 0 ? 0.72 : (a + b) % 3 === 1 ? 1 : 0.86); }
      case 'concrete': return tone*(0.8 + 0.2*nz.fbm(U*0.8, V*0.8) - 0.25*Math.max(0, nz.fbm(U*0.3 + 3, V*0.3 + 5) - 0.6)*2.5);
      case 'tile': return tone*(1 - 0.32*Math.max(line(U/0.15, 0.06), line(V/0.15, 0.06)));
      case 'bigtile': return tone*(0.95 + 0.05*nz.vn(U*3, V*3) - 0.25*Math.max(line(U/0.45, 0.025), line(V/0.45, 0.025)) - 0.15*Math.max(0, nz.fbm(U*0.5, V*0.5) - 0.7)*3);
      case 'vct': return tone*(((Math.floor(U/0.305) + Math.floor(V/0.305)) & 1) ? 0.82 : 1);
      case 'vinyl': return tone*(0.94 + 0.06*nz.fbm(U*2, V*2));
      case 'tactile': { const strip = Math.abs((u % 1 + 1) % 1 - 0.5) < 0.12; return strip ? -1 : tone*(1 - 0.25*Math.max(line(U/0.3, 0.03), line(V/0.3, 0.03))); }
      case 'stalls': return tone*(0.85 + 0.15*nz.fbm(U*0.7, V*0.7)) + (line(U/2.5, 0.02)*(line(V/5, 0.45) ? 0 : 1) ? 0.6 : 0);
      case 'stripes': return tone*(0.88 + 0.12*(Math.sin(U/0.15*Math.PI*2) > 0.6 ? 1 : 0) - 0.12*Math.max(0, nz.fbm(U*0.4, V*0.4) - 0.6)*3);
      case 'damask': return tone*(0.86 + 0.14*Math.abs(Math.sin(U/0.12*3.1)*Math.sin(V/0.12*3.1)));
      case 'block': return tone*(1 - 0.18*Math.max(line(V/0.2, 0.04), line(U/0.4 + (Math.floor(V/0.2) % 2)*0.5, 0.02)));
      case 'pipes': return v > 0.66*Hn && v < 0.88*Hn ? tone*(0.55 + 0.45*Math.abs(Math.sin(V/0.11*Math.PI))) : tone*(0.85 + 0.15*nz.fbm(U, V));
      case 'storefront': return v < 0.75*Hn ? tone*(0.35 + 0.15*line(U/1.2, 0.05)) : tone;
      case 'droptile': return tone*(1 - 0.22*Math.max(line(U/0.6, 0.03), line(V/0.6, 0.03)));
      default: return tone*(0.95 + 0.05*nz.vn(U*2, V*2));
    }
  };
  // a wall's trim: wainscot, lockers, a rail, posters, a coloured band, grilles (a share of its height as the fifth colour)
  const trimOf = (u, v) => { const m = cs, V = v*m, U = u*m;
    switch(K.trim){
      case 'wainscot': return V < 0.9 ? 1 : 0;
      case 'lockers': return V < 1.8 && Math.abs(((U/0.3) % 1 + 1) % 1 - 0.5) < 0.47 ? 1 : 0;
      case 'rail': return Math.abs(V - 0.9) < 0.05 || V < 0.12 ? 1 : 0;
      case 'band': return Math.abs(V - 1.0) < 0.08 ? 1 : 0;
      case 'posters': return V > 1.2 && V < 1.8 && ((U/2.4) % 1 + 1) % 1 < 0.45 ? 1 : 0;
      case 'colband': return V > 0.9 && V < 1.4 ? 1 : 0;
      case 'grille': return V > 2.2 && V < 2.9 ? 1 : 0;
      default: return V < 0.1 ? 1 : 0;
    } };
  for(let j = 0; j < wh; j++) for(let i = 0; i < ww; i++){
    const q = j*ww + i;
    // the ray: through the pixel, turned by roll, pitch and yaw
    let px = (2*(i + 0.5)/ww - 1)*fx, py = -(2*(j + 0.5)/wh - 1)*fx*aspect;
    const rx = px*cr - py*sr, ry = px*sr + py*cr;
    let dx = rx, dy = ry*cp + sp, dz = -ry*sp + cp;
    const n = Math.hypot(dx, dy, dz); dx /= n; dy /= n; dz /= n;
    const wx = dx*cy + dz*sy, wz = -dx*sy + dz*cy, wy = dy;
    // walk the grid (DDA), the floor and the ceiling tested in every cell on the way
    let X = Math.floor(P.cam.x), Z = Math.floor(P.cam.z), t = 0;
    const stepX = wx > 0 ? 1 : -1, stepZ = wz > 0 ? 1 : -1, tdx = Math.abs(1/(wx || 1e-9)), tdz = Math.abs(1/(wz || 1e-9));
    let tmx = (wx > 0 ? X + 1 - P.cam.x : P.cam.x - X)*tdx, tmz = (wz > 0 ? Z + 1 - P.cam.z : P.cam.z - Z)*tdz;
    let hit = null;
    for(let s = 0; s < 400 && t < far; s++){
      const v = at(X, Z), fl = floorAt(v), tEnd = Math.min(tmx, tmz);
      // (t is along the ray: the grid's crossings measured on it too)
      const t0 = t, t1 = tEnd;
      if(wy < 0){ const tf = (fl - eye)/wy; if(tf >= t0 && tf <= t1){ hit = { cls: v === 3 ? 'water' : 'floor', t: tf, x: P.cam.x + wx*tf, z: P.cam.z + wz*tf }; break; } }
      if(wy > 0){ const tc = (Hn - eye)/wy; if(tc >= t0 && tc <= t1){ hit = { cls: 'ceil', t: tc, x: P.cam.x + wx*tc, z: P.cam.z + wz*tc }; break; } }
      // into the next cell
      const sideX = tmx < tmz; t = tEnd; if(sideX){ X += stepX; tmx += tdx; } else { Z += stepZ; tmz += tdz; }
      const nv = at(X, Z), y = eye + wy*t, hx = P.cam.x + wx*t, hz = P.cam.z + wz*t, u = sideX ? hz : hx;
      if(nv === 1 || nv === 2 || nv === 4 || nv === 6){ if(nv === 6){ hit = { cls: 'void', t }; break; } hit = { cls: nv === 2 ? 'door' : nv === 4 ? 'pillar' : 'wall', t, u, y, side: sideX ? stepX : 2*stepZ, x: hx, z: hz, fx: X - (sideX ? stepX : 0), fz: Z - (sideX ? 0 : stepZ) }; break; }
      if(nv === 5 && y < 1.2/cs){ hit = { cls: 'cubicle', t, u, y, side: sideX ? stepX : 2*stepZ, x: hx, z: hz, fx: X - (sideX ? stepX : 0), fz: Z - (sideX ? 0 : stepZ) }; break; }
      // a pool's side, where the floor drops away: the ray below the walkway meets the basin's wall
      const fv = floorAt(nv), fb = floorAt(v);
      if(fv > fb && y < fv){ hit = { cls: 'pooledge', t, u, y, side: sideX ? stepX : 2*stepZ, x: hx, z: hz, fx: X, fz: Z }; break; }
    }
    if(!hit || hit.cls === 'void'){ surf[q] = 0; depth[q] = 1; continue; }
    const dd = rmClamp(hit.t/far);
    depth[q] = dd;
    if(hit.cls === 'floor' || hit.cls === 'water'){
      surf[q] = 0.25; shade[q] = 1; light[q] = Lat(hit.x, hit.z);
      let p = patOf(K.floor, 0.25, hit.x, hit.z); if(p < 0){ surf[q] = 1; p = K.tone[3]; } pat[q] = p;
      if(hit.cls === 'water'){ water[q] = 1; pat[q] = 0.8 + 0.2*nz.fbm(hit.x*3, hit.z*3); light[q] *= 0.85; }
      else if(K.floor === 'stalls' && p > 1){ pat[q] = 1; surf[q] = 1; }
    } else if(hit.cls === 'ceil'){
      surf[q] = 0.5; shade[q] = 0.82; light[q] = Lat(hit.x, hit.z)*0.7; pat[q] = patOf(K.ceil, 0.5, hit.x, hit.z);
      // the lamps on it
      for(const l of P.lamps){ const ex = Math.abs(hit.x - l.x), ez = Math.abs(hit.z - l.z), sz = K.lamp;
        const inLamp = sz === 'troffer' ? ex < 0.25 && ez < 0.5 : sz === 'strip' ? ex < 0.08 && ez < 0.5 : sz === 'skylight' ? ex < 0.42 && ez < 0.42 : sz === 'tube' ? ex < 0.05 && ez < 0.5 : sz === 'hanging' ? ex < 0.12 && ez < 0.5 : sz === 'bulb' ? ex*ex + ez*ez < 0.012 : false;
        if(inLamp){ lamps[q] = l.on ? 1 : 0.12; break; } }
    } else {
      // a wall (a door, a pillar, a cubicle's partition, a pool's side): its trim, its pattern, its light from the open cell in front
      const isTrim = hit.cls === 'door' || hit.cls === 'pooledge' || hit.cls === 'cubicle' || trimOf(hit.u, hit.y) > 0;
      surf[q] = isTrim ? 1 : 0.75; shade[q] = Math.abs(hit.side) === 1 ? 0.72 : 0.86;
      light[q] = Lat(hit.fx + 0.5 + (hit.x - Math.floor(hit.x) - 0.5)*0.2, hit.fz + 0.5 + (hit.z - Math.floor(hit.z) - 0.5)*0.2)*(0.7 + 0.3*rmClamp(hit.y/Hn));
      pat[q] = hit.cls === 'door' ? K.tone[3]*(Math.abs(((hit.u % 1) + 1) % 1 - 0.5) < 0.42 && hit.y*cs < 2.05 ? 0.85 : 1.1) : isTrim ? K.tone[3] : patOf(K.wall, 0.75, hit.u, hit.y);
      // (a sconce's own glow, on the wall beside it)
      if(K.lamp === 'sconce') for(const l of P.lamps){ if(!l.on) continue; const e = Math.hypot(hit.x - l.x, hit.z - l.z); if(e < 0.7 && Math.abs(hit.y*cs - 1.7) < 0.12 && e < 0.12){ lamps[q] = 1; break; } }
    }
    // (light falls off into the dark far away: the end of the space hidden)
    light[q] = rmClamp(light[q]*0.55)*(1 - dd*dd*0.5);
  }
  return [surf, depth, light, pat, lamps, water, shade];
}

export const ROOM_STEPS = {
  // THE ROOM CASTER (Liminal Spaces' process part): an empty place, cast through the camera dial, as grey buffers
  roomcaster: { cat: 'Shape', label: 'Room Caster', ins: ['turn', 'view', 'zoom'], outs: ['surface', 'depth', 'light', 'pattern', 'lamps', 'water', 'shade'],
    io: { ins: ['value', 'value', 'value'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [RM_R('kind', ROOM_KIND_LABEL, 0), RM_R('reach', 'Reach', 50), RM_R('ceiling', 'Ceiling', 50), RM_R('width', 'Width', 50), RM_R('lights', 'Lights', 60),
      RM_R('failing', 'Failing Lights', 25), RM_R('strange', 'Strangeness', 30), RM_R('variant', 'Variation', 0, 0, 99)], cost: () => 8,
    run(E, n){ const { ww, wh, num } = E, sel = Math.min(ROOM_KIND_KEYS.length, Math.floor(num(n, 'kind', 0)/100*(ROOM_KIND_KEYS.length + 1)));
      const seed = (((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0) ^ 0x2f6b;
      const tv = E.input(n, 1), vv = E.input(n, 2), zv = E.input(n, 3), cam = E.ctx.camera || {};
      const o = { kind: sel ? ROOM_KIND_KEYS[sel - 1] : 'seeded', reach: num(n, 'reach', 50)/100, ceiling: num(n, 'ceiling', 50)/100, width: num(n, 'width', 50)/100, lights: num(n, 'lights', 60)/100,
        failing: num(n, 'failing', 25)/100, strange: num(n, 'strange', 30)/100, seed,
        turn: typeof tv === 'number' ? tv*360 : (cam.turn ?? 0), view: typeof vv === 'number' ? vv*100 : (cam.view ?? 100), lens: typeof zv === 'number' ? 25 + zv*375 : (cam.zoom ?? 100) };
      // (the turn from the camera dial's middle: 0 looks where the seed looks)
      if(o.turn > 180) o.turn -= 360;
      const P = roomPlan(mulberry32(seed), o);
      return roomCast(ww, wh, P, o); } },
};
