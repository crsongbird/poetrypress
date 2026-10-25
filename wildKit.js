/**
 * wildKit.js — THE WILD THINGS: herds, flocks and single creatures, where each one is at any moment and how it is
 * painted (Ruby: "wildlife still travel on short predictable paths and do not really move or scatter, we should
 * probably have more wildlife in general (birds, small things)"; docs/prior-art/ringworld-wildlife.md).
 *
 * WHERE: every place is a pure function of a group's own seed, a member's number and the clock (wkAt), so nothing is
 * remembered from frame to frame, a film can begin anywhere, and a game could ask the same question of the same deer
 * and get the same answer (Ruby: the generators kept "fast and portable … so we can later use it inside of a game
 * engine"). A group lives in ERAS (wkEra): stretches of its own length, each ending in a move (a herd walking on or
 * bolting, a flock flushing, a heron flying down the shore), so its paths never close into loops. Between moves each
 * member drifts on smooth noise (wkWander), never a sine's circle. Places are metres from the group's home, across (x)
 * and along (z) the ground, with y its height above it.
 *
 * HOW: each creature in a few flat shapes (wkPaint), by the colours its caller lit ({ dark, lit, mat(rgb) → { body,
 * lit, dark } }), at (X, Y) where it meets the ground, m pixels to a metre, facing dir (+1 to the right), side (how
 * side-on it is seen, 0 to 1); its gait, wingbeat and pose from its state.
 */
// (the kit's own hash of three integers to 0..1, so it needs nothing from the land)
export const wkHash = (a, b, s) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x632be5ab, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
// smooth noise in time, -1..1: hashed knots a unit apart, eased between (quintic), so its value and its slope are
// continuous and it never repeats
export const wkNoise = (s, t) => { const i = Math.floor(t), f = t - i, u = f*f*f*(f*(f*6 - 15) + 10), a = wkHash(i, 7, s); return 2*(a + (wkHash(i + 1, 7, s) - a)*u) - 1; };
// a wandering offset, -1..1 on each axis: three octaves, the slowest turning over about every tau seconds
export const wkWander = (s, t, tau) => { let x = 0, z = 0, a = 1, k = 1, n = 0;
  for(let o = 0; o < 3; o++){ x += a*wkNoise(s + o*101, t*k/tau); z += a*wkNoise(s + o*101 + 53, t*k/tau); n += a; a *= 0.5; k *= 2.3; } return [1.6*x/n, 1.6*z/n]; };
// A GROUP'S ERAS: era k begins near k·P (up to a quarter of P either way), so each lasts half to one and a half P
const wkStart = (s, k, P) => k*P + (wkHash(k, 3, s) - 0.5)*0.5*P;
export const wkEra = (s, t, P) => { let k = Math.floor(t/P); if(t < wkStart(s, k, P)) k--; else if(t >= wkStart(s, k + 1, P)) k++; const t0 = wkStart(s, k, P); return { k, t0, d: wkStart(s, k + 1, P) - t0 }; };
const wkSmooth = p => p <= 0 ? 0 : p >= 1 ? 1 : p*p*(3 - 2*p);

// WHAT EACH KIND IS (metres, seconds, metres a second; docs/prior-art/ringworld-wildlife.md): how many in a group, how
// it moves (its `way`), how big (size: a body's length, a bird's span), and its colours
export const WK_KINDS = {
  // the ground's walkers: a home that moves each era (range), walked to or bolted for (bolt: how often an era opens in
  // flight), the herd re-forming round it (spread), each grazing on its own drift between (wander, over tau)
  deer:      { way: 'walk', n: [3, 8], P: 170, range: 45, spread: 4, walk: 1.2, run: 9, bolt: 0.4, wander: 3, tau: 32, size: 1.6, stride: 4.2, coat: [146, 98, 60] },
  elk:       { way: 'walk', n: [2, 6], P: 220, range: 60, spread: 6, walk: 1.1, run: 8, bolt: 0.3, wander: 3, tau: 40, size: 2.3, stride: 4.6, coat: [118, 84, 58] },
  hare:      { way: 'hop', n: [1, 3], P: 24, range: 6, spread: 5, walk: 2.4, run: 10, bolt: 0.18, wander: 0.5, tau: 9, size: 0.55, stride: 1.1, coat: [152, 124, 90] },
  fox:       { way: 'prowl', n: [1, 1], P: 80, range: 35, spread: 0, walk: 2.1, run: 9, bolt: 0.08, wander: 0.8, tau: 14, size: 0.75, stride: 1.4, coat: [196, 98, 44] },
  // the ground's birds, flushed all at once and wheeling down elsewhere (hgt: how high they rise)
  rooks:     { way: 'flock', n: [7, 20], P: 55, range: 28, spread: 8, fly: 9, wander: 1.3, tau: 7, size: 0.85, hgt: [5, 14], coat: [30, 30, 36], body: 0.46 },
  pigeons:   { way: 'flock', n: [6, 16], P: 40, range: 20, spread: 5, fly: 10, wander: 1.0, tau: 6, size: 0.65, hgt: [4, 11], coat: [128, 132, 146], body: 0.33 },
  starlings: { way: 'flock', n: [10, 28], P: 34, range: 22, spread: 6, fly: 10, wander: 1.2, tau: 5, size: 0.4, hgt: [3, 9], coat: [44, 46, 54], body: 0.21 },
  sparrows:  { way: 'flock', n: [4, 10], P: 26, range: 14, spread: 2.5, fly: 6, wander: 0.7, tau: 4, size: 0.24, hgt: [1.5, 4], coat: [134, 104, 76], body: 0.15 },
  // on the water: a slow drift, now and then up-ended to feed
  ducks:     { way: 'paddle', n: [2, 7], spread: 3, wander: 5, tau: 38, size: 0.55, coat: [116, 96, 74], head: [40, 88, 60] },
  swans:     { way: 'paddle', n: [1, 3], spread: 4, wander: 7, tau: 55, size: 1.4, coat: [240, 238, 232], head: [240, 238, 232] },
  // at the water's edge: still, a slow step, the strike, and now and then a long slow flight down the shore
  heron:     { way: 'wade', n: [1, 1], P: 90, range: 6, fly: 9, flyOff: 45, flies: 0.22, size: 0.95, coat: [150, 156, 164] },
  // in the air: circling on a thermal and gliding to the next; hawking for insects on noise (amp: how far, hgt: how high)
  raptor:    { way: 'soar', n: [1, 2], P: 160, size: 1.3, speed: 9, coat: [96, 72, 52] },
  swallows:  { way: 'hawk', n: [4, 10], tau: 10, amp: 18, hgt: [1.2, 9], size: 0.32, flap: 5, coat: [36, 40, 64] },
  swifts:    { way: 'hawk', n: [5, 14], tau: 14, amp: 40, hgt: [22, 65], size: 0.42, flap: 6, coat: [42, 40, 40] },
  bats:      { way: 'hawk', n: [3, 8], tau: 6, amp: 7, hgt: [3, 14], size: 0.28, flap: 6, coat: [44, 36, 34] },
  butterflies: { way: 'hawk', n: [1, 3], tau: 3, amp: 2, hgt: [0.3, 1.6], size: 0.07, flap: 5, coat: [230, 200, 90] },
  dragonflies: { way: 'dart', n: [1, 3], P: 2.6, range: 2, hgt: [0.4, 1.4], size: 0.09, coat: [70, 140, 170] },
  // a skein of geese passing over in its V, once in an era, against the wind
  geese:     { way: 'skein', n: [7, 15], P: 520, speed: 16, hgt: [120, 240], size: 1.6, coat: [110, 104, 96] },
};
export const WK_FLYERS = ['raptor', 'swallows', 'swifts', 'bats', 'geese', 'butterflies', 'dragonflies'];
export const wkCount = (kind, s) => { const K = WK_KINDS[kind]; return K.n[0] + Math.floor(wkHash(s, 1, 5)*(K.n[1] - K.n[0] + 1)); };

// a walker's or a flock's LEG into era k: where its member j is bound (round the era's home), when it sets off, how fast
const wkLeg = (K, s, j, k, n) => { const t0 = wkStart(s, k, K.P), q = k*61 + j, home = [K.range*(2*wkHash(k, 21, s) - 1), K.range*0.8*(2*wkHash(k, 22, s) - 1)];
  const an = wkHash(q, 23, s)*Math.PI*2, rd = K.spread*Math.sqrt(wkHash(q, 24, s)*n), p1 = [home[0] + Math.cos(an)*rd, home[1] + Math.sin(an)*rd];
  const bolt = K.way === 'flock' || wkHash(k, 25, s) < K.bolt, sp = (K.way === 'flock' ? K.fly : bolt ? K.run : K.walk)*(0.85 + 0.3*wkHash(q, 26, s));
  const dep = t0 + (K.way === 'flock' ? 0.7 : bolt ? 0.9 : 10)*wkHash(q, 27, s) + (bolt && K.way !== 'flock' ? 0.7 : 0);
  return { t0, p1, bolt, sp, dep, q }; };
// how far a leg goes (from the last era's place, so it needs nothing older) and so how long it takes
// (a flock's way round its wheel counted in; never so long that the next era's leg would begin before it ends)
const wkSpan = (K, s, j, k, n) => { const L = wkLeg(K, s, j, k, n), P = wkLeg(K, s, j, k - 1, n), dist = Math.hypot(L.p1[0] - P.p1[0], L.p1[1] - P.p1[1]), loop = K.way === 'flock' ? 2*Math.PI*(5 + 9*wkHash(k, 29, s)) : 0;
  return { L, P, dist, T: Math.min((dist + loop)/L.sp + (K.way === 'flock' ? 1.5 : 0.4), wkStart(s, k + 1, K.P) - L.dep - 0.5) }; };
// where it grazes after a leg: the leg's end, drifted by its own wander since it arrived
const wkGraze = (K, s, j, L, T, t) => { const w = wkWander(s + j*97, t, K.tau), w0 = wkWander(s + j*97, L.dep + T, K.tau); return [L.p1[0] + (w[0] - w0[0])*K.wander, L.p1[1] + (w[1] - w0[1])*K.wander]; };

// WHERE member j of a group of kind (its seed s) is at time t: { x, z, y (metres), pose, ph (its gait or wingbeat's
// turn), head (0 down … 1 up), on (0 … 1: whether it is here at all) } (env: { wind: [way, m/s] })
export function wkAt(kind, s, j, t, env = {}){
  const K = WK_KINDS[kind], n = wkCount(kind, s), tt = t + (K.P ? wkHash(s, 2, 9)*K.P*30 : wkHash(s, 4, 9)*500);
  switch(K.way){
  case 'walk': case 'hop': case 'prowl': case 'flock': {
    const e = wkEra(s, tt, K.P), { L, P, dist, T } = wkSpan(K, s, j, e.k, n), Pp = wkSpan(K, s, j, e.k - 1, n);
    const alertBy = wkSmooth((wkNoise(s + j*17, tt/7) - 0.15)/0.35), grazeFace = (LL, TT, ux, uz) => Math.atan2(uz, ux) + 1.3*(wkNoise(s + j*5, tt/40) - wkNoise(s + j*5, (LL.dep + TT)/40));
    if(tt < L.dep || dist < 1e-6){ const LL = tt < L.dep ? P : L, TT = tt < L.dep ? Pp.T : T, g = wkGraze(K, s, j, LL, TT, tt), ux = LL.p1[0] - (tt < L.dep ? Pp.P : P).p1[0], uz = LL.p1[1] - (tt < L.dep ? Pp.P : P).p1[1];
      const warn = L.bolt && K.way !== 'flock' ? wkSmooth((tt - (L.dep - 1.2))/0.6) : 0;
      return { x: g[0], z: g[1], y: 0, face: grazeFace(LL, TT, ux, uz), pose: K.way === 'flock' ? 'peck' : 'graze', ph: tt*(K.way === 'flock' ? 0.9 : 0.12) + j*0.37, head: Math.max(warn, alertBy*(K.way === 'hop' ? 1 : 0.7)), on: 1 }; }
    const from = wkGraze(K, s, j, P, Pp.T, L.dep), p = Math.min(1, (tt - L.dep)/T);
    if(p >= 1){ const g = wkGraze(K, s, j, L, T, tt); return { x: g[0], z: g[1], y: 0, face: grazeFace(L, T, L.p1[0] - from[0], L.p1[1] - from[1]), pose: K.way === 'flock' ? 'peck' : 'graze', ph: tt*0.9 + j*0.37, head: alertBy*0.7, on: 1 }; }
    const dx = L.p1[0] - from[0], dz = L.p1[1] - from[1], dl = Math.hypot(dx, dz) || 1e-6, nx = -dz/dl, nz = dx/dl;
    // (a bolt and a walk ease on and off; a flock's flight wheels once round as it goes, rising and
    //  settling, the birds loosening in the air and closing up as they land)
    const ea = wkSmooth(p), spread = (wkHash(L.q, 28, s) - 0.5)*2;
    let x = from[0] + dx*ea, z = from[1] + dz*ea, y = 0;
    if(K.way === 'flock'){ const wr = 5 + 9*wkHash(e.k, 29, s), sg = wkHash(e.k, 30, s) < 0.5 ? 1 : -1, th0 = Math.atan2(dz, dx) - Math.PI/2*sg;
      const fl = pp => { const ep = wkSmooth(pp), th = th0 + Math.PI*2*sg*ep, sp2 = spread*4*Math.sin(Math.PI*pp); return [from[0] + dx*ep + wr*(Math.cos(th) - Math.cos(th0)) + nx*sp2, from[1] + dz*ep + wr*(Math.sin(th) - Math.sin(th0)) + nz*sp2]; };
      const [fx, fz] = fl(p), [gx, gz] = fl(Math.min(1, p + 0.02));
      return { x: fx, z: fz, y: (K.hgt[0] + (K.hgt[1] - K.hgt[0])*wkHash(e.k, 31, s))*wkSmooth(p/0.3)*wkSmooth((1 - p)/0.35), face: Math.atan2(gz - fz, gx - fx), pose: 'fly', ph: (tt - L.dep)*4.5 + j*0.31, head: 1, on: 1 }; }
    // (a bolting herd fans out as it runs and closes again as it stops: scattered, then a herd)
    const lat = L.bolt ? spread*dl*0.22*Math.sin(Math.PI*ea) : spread*0.6*Math.sin(Math.PI*ea); x += nx*lat; z += nz*lat;
    const gone = ea*dl;
    if(K.way === 'hop'){ const hops = gone/(L.bolt ? 2.6 : 0.8); y = Math.abs(Math.sin(Math.PI*hops))*(L.bolt ? 0.35 : 0.18); }
    // (a fox now and then ends its trot in the mouser's pounce: up half a metre and down, nose first)
    if(K.way === 'prowl' && !L.bolt && wkHash(e.k, 32, s) < 0.35){ const q = (gone - (dl - 1.6))/1.6; if(q > 0) y = 0.5*Math.sin(Math.PI*Math.min(1, q)); if(q > 0) return { x, z, y, face: Math.atan2(dz, dx), pose: 'pounce', ph: q, head: 0.5, on: 1 }; }
    return { x, z, y, face: Math.atan2(dz + nz*0.001, dx + nx*0.001), pose: L.bolt ? 'run' : 'walk', ph: gone/K.stride, head: L.bolt ? 0.8 : 0.45, on: 1 }; }
  case 'paddle': { const an = wkHash(j, 33, s)*Math.PI*2, rd = K.spread*Math.sqrt(wkHash(j, 34, s)*n), w = wkWander(s + j*91, tt, K.tau), w2 = wkWander(s + j*91, tt + 1, K.tau);
    const x = Math.cos(an)*rd + w[0]*K.wander, z = Math.sin(an)*rd + w[1]*K.wander, vx = (w2[0] - w[0])*K.wander, vz = (w2[1] - w[1])*K.wander;
    return { x, z, y: 0, face: Math.atan2(vz, vx), pose: 'swim', ph: Math.min(1, Math.hypot(vx, vz)/0.4), head: 1 - wkSmooth((wkNoise(s + j*9, tt/9) - 0.45)/0.25), on: 1 }; }
  case 'wade': { const e = wkEra(s, tt, K.P), spot = k => [K.flyOff*(2*wkHash(k, 35, s) - 1)*(wkHash(k, 36, s) < K.flies ? 1 : 0.08), K.range*(2*wkHash(k, 37, s) - 1)];
    // (its spot is the last era's but for a step; in a flying era, a long way down the shore)
    const cum = k => { let x = 0, z = 0; for(let q = k - 3; q <= k; q++){ const p = spot(q); x += p[0]; z += p[1]*0.3; } return [x, z]; };
    const a = cum(e.k - 1), b = cum(e.k), fly = wkHash(e.k, 36, s) < K.flies, dl = Math.hypot(b[0] - a[0], b[1] - a[1]), T = Math.min(fly ? dl/K.fly + 3 : dl/0.25 + 1, e.d - 5), p = (tt - e.t0 - 4)/T;
    if(p <= 0 || p >= 1){ const at = p <= 0 ? a : b; return { x: at[0], z: at[1], y: 0, face: Math.atan2(b[1] - a[1], b[0] - a[0]) + 0.8*wkNoise(s, tt/50), pose: 'stand', ph: 0, head: wkSmooth((wkNoise(s + 3, tt/5) - 0.55)/0.2), on: 1 }; }
    const ea = wkSmooth(p); return { x: a[0] + (b[0] - a[0])*ea, z: a[1] + (b[1] - a[1])*ea, y: fly ? 7*wkSmooth(p/0.25)*wkSmooth((1 - p)/0.3) : 0, face: Math.atan2(b[1] - a[1], b[0] - a[0]), pose: fly ? 'fly' : 'wade', ph: fly ? (tt - e.t0)*1.4 : ea*dl/0.6, head: 0.6, on: 1 }; }
  case 'soar': { const e = wkEra(s, tt, K.P), [wa, ws] = env.wind || [0, 3], drift = Math.min(2, ws*0.25), sgn = wkHash(s + j, 38, 1) < 0.5 ? 1 : -1;
    const circ = k => { const R0 = 22 + 16*wkHash(k*7 + j, 39, s); return { c: [160*(2*wkHash(k*7 + j, 40, s) - 1), 160*(2*wkHash(k*7 + j, 41, s) - 1)], r: R0, th: wkHash(k*7 + j, 42, s)*Math.PI*2, h0: 30 + 20*wkHash(k*7 + j, 43, s) }; };
    const at = (C, k, t0, u) => { const th = C.th + sgn*u*K.speed/C.r; return [C.c[0] + Math.cos(wa)*drift*u + C.r*Math.cos(th), C.c[1] + Math.sin(wa)*drift*u + C.r*Math.sin(th), C.h0 + 0.9*u, th]; };
    const C = circ(e.k), up = e.d*0.78, u = tt - e.t0;
    if(u < up){ const [x, z, y, th] = at(C, e.k, e.t0, u); return { x, z, y, face: th + sgn*Math.PI/2, pose: 'soar', ph: u*0.6, head: 1, on: 1 }; }
    const [x0, z0, y0] = at(C, e.k, e.t0, up), C1 = circ(e.k + 1), x1 = C1.c[0] + C1.r*Math.cos(C1.th), z1 = C1.c[1] + C1.r*Math.sin(C1.th), q = wkSmooth((u - up)/(e.d - up));
    return { x: x0 + (x1 - x0)*q, z: z0 + (z1 - z0)*q, y: y0 + (C1.h0 - y0)*q, face: Math.atan2(z1 - z0, x1 - x0), pose: 'glide', ph: u*0.6, head: 1, on: 1 }; }
  case 'hawk': { const an = wkHash(j, 44, s)*Math.PI*2, rd = K.amp*0.3*Math.sqrt(wkHash(j, 45, s)), w = wkWander(s + j*131, tt, K.tau), w2 = wkWander(s + j*131, tt + 0.08, K.tau), hy = wkNoise(s + j*7 + 1, tt/(K.tau*0.8));
    return { x: Math.cos(an)*rd + w[0]*K.amp, z: Math.sin(an)*rd + w[1]*K.amp, y: K.hgt[0] + (K.hgt[1] - K.hgt[0])*(0.5 + 0.5*hy), face: Math.atan2(w2[1] - w[1], w2[0] - w[0]), pose: 'fly', ph: tt*K.flap + j*0.4, head: 1, on: 1 }; }
  case 'dart': { const e = wkEra(s + j*29, tt, K.P), sp = k => [K.range*(2*wkHash(k, 46, s + j) - 1), K.range*(2*wkHash(k, 47, s + j) - 1), K.hgt[0] + (K.hgt[1] - K.hgt[0])*wkHash(k, 48, s + j)];
    const a = sp(e.k - 1), b = sp(e.k), p = wkSmooth((tt - e.t0)/0.5), jit = wkWander(s + j*7, tt, 0.6);
    return { x: a[0] + (b[0] - a[0])*p + jit[0]*0.08, z: a[1] + (b[1] - a[1])*p + jit[1]*0.08, y: a[2] + (b[2] - a[2])*p, face: Math.atan2(b[1] - a[1], b[0] - a[0]), pose: p < 1 ? 'dart' : 'hover', ph: tt*9 + j, head: 1, on: 1 }; }
  case 'skein': { const e = wkEra(s, tt, K.P), [wa] = env.wind || [0, 3], hd = wa + Math.PI + (wkHash(e.k, 49, s) - 0.5)*1.4, Lh = 1100, Dp = 2*Lh/K.speed;
    if(wkHash(e.k, 50, s) > 0.75) return { on: 0 }; const ts = e.t0 + wkHash(e.k, 51, s)*Math.max(0, e.d - Dp), u = (tt - ts)*K.speed - Lh; if(u < -Lh || u > Lh) return { on: 0 };
    const ca = Math.cos(hd), sa = Math.sin(hd), off = 160*(2*wkHash(e.k, 52, s) - 1), r = Math.ceil(j/2), side = j % 2 ? -1 : 1, wob = wkWander(s + j*3, tt, 9);
    const back = r*3.4 + wob[0]*0.6, lat = side*r*2.3 + wob[1]*0.5, H = K.hgt[0] + (K.hgt[1] - K.hgt[0])*wkHash(e.k, 53, s);
    return { x: ca*(u - back) - sa*(off + lat), z: sa*(u - back) + ca*(off + lat), y: H + wob[1]*2, face: hd, pose: 'fly', ph: tt*3 + j*0.7, head: 1, on: Math.min(1, (Lh - Math.abs(u))/(Lh*0.2)) }; }
  }
  return { on: 0 };
}

// ---------------- HOW THEY ARE PAINTED ----------------
const wkCss = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const wkMix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const wkLine = (x, pts, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
const wkEll = (x, cx, cy, rx, ry, rot, col) => { if(!(rx > 0 && ry > 0)) return; x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI*2); x.fill(); };
const wkPolyF = (x, pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); };

// A FOUR-LEGGED THING in profile (deer, elk, hare, fox): its body, the legs by its gait (a walk's four in turn, a run's
// pairs together and stretched in the air), its neck down to graze or up to look, its own marks (a deer's pale rump, a
// stag's antlers, a fox's white-tipped brush, a hare's long ears)
function wkQuad(x, X, Y, m, kind, st, c, px){
  if(kind === 'hare') return wkHare(x, X, Y, m, st, c, px);
  const K = WK_KINDS[kind], d = st.dir, sk = Math.max(0.3, st.side), L = K.size*m, coat = c.mat(K.coat), cervid = kind !== 'fox';
  const lift = st.y*m, run = st.pose === 'run' || st.pose === 'pounce', q = u => X + d*u*sk, fill = wkCss(coat.body), lw = Math.max(px(0.4), L*(cervid ? 0.034 : 0.05));
  // (a deer's back stands about two thirds of its length up, its chest a quarter of its length deep; a fox's low)
  const back = L*(cervid ? 0.66 : 0.5), deep = L*(cervid ? 0.27 : 0.24), by = Y - lift - back + deep*0.5, ph = st.ph*Math.PI*2;
  const legs = [[0.3, 0], [0.24, Math.PI], [-0.3, Math.PI*0.5], [-0.36, Math.PI*1.5]];
  if(L > px(3)) legs.forEach(([u, o], i) => { const far = i % 2 === 1, hind = i >= 2, sw = run ? (hind ? -1 : 1)*Math.sin(ph)*0.7 : st.pose === 'walk' ? Math.sin(ph + o)*0.36 : 0;
    const top = [q(u*L), by + deep*0.25], len = Math.max(L*0.05, Y - lift - top[1]), knee = [top[0] + d*(Math.sin(sw)*0.5 + (hind ? -0.08 : 0.04))*len, top[1] + len*0.5], ft = [top[0] + d*Math.sin(sw)*len, top[1] + Math.cos(sw)*len];
    const col = wkCss(far ? wkMix(coat.dark, [0, 0, 0], 0.3) : coat.dark); wkLine(x, [top, knee, ft], col, lw); if(L > px(10)) wkLine(x, [ft, [ft[0] + d*lw*1.2, ft[1]]], wkCss([24, 20, 18]), lw*1.2); });
  // the body: chest and haunch and the barrel between, lit along the back
  wkEll(x, X, by, L*0.36*sk, deep*0.42, 0, fill); wkEll(x, q(L*0.2), by - deep*0.04, L*0.2*sk, deep*0.52, 0, fill); wkEll(x, q(-L*0.22), by - deep*0.06, L*0.18*sk, deep*0.5, 0, fill);
  if(L > px(5)) wkEll(x, q(-L*0.02), by - deep*0.3, L*0.36*sk, deep*0.16, 0, wkCss(coat.lit, 0.5));
  if(cervid) wkEll(x, q(-L*0.37), by - deep*0.12, L*0.06*sk, deep*0.3, 0, wkCss(wkMix(coat.lit, [255, 255, 255], 0.65)));
  else { const tb = [q(-L*0.38), by - deep*0.1], tt = [q(-L*0.85), by + deep*0.35 - (run ? deep*0.6 : 0)]; wkLine(x, [tb, [q(-L*0.62), by + deep*0.15], tt], fill, Math.max(px(0.6), L*0.13));
    wkEll(x, tt[0], tt[1], Math.max(px(0.4), L*0.07), Math.max(px(0.4), L*0.05), 0, wkCss([238, 232, 222])); }
  // the neck from the withers, tapering: down to the grass, up to look, out to run
  const hu = run ? 0.3 : st.head, na = run ? 0.35 : -1.25 + 2.35*hu, nl = L*(cervid ? 0.4 : 0.18), nb = [q(L*0.3), by - deep*0.25];
  const ne = [nb[0] + d*Math.cos(na)*nl, nb[1] - Math.sin(na)*nl], nw = L*(cervid ? 0.09 : 0.1), px2 = -Math.sin(na), pz2 = -Math.cos(na), mane = kind === 'elk' ? wkCss(wkMix(coat.body, coat.dark, 0.6)) : fill;   // (an elk's neck and head darker, its mane)
  wkPolyF(x, [[nb[0] - d*px2*nw*1.4, nb[1] - pz2*nw*1.4 + deep*0.3], [nb[0] + d*px2*nw, nb[1] + pz2*nw], [ne[0] + d*px2*nw*0.55, ne[1] + pz2*nw*0.55], [ne[0] - d*px2*nw*0.55, ne[1] - pz2*nw*0.55]], mane);
  // the head, a wedge to the nose (down when it grazes); its ears; a fox's white muzzle
  const ha = hu < 0.35 ? -1.2 : run ? 0.1 : -0.35, hl = L*(cervid ? 0.2 : 0.17), nose = [ne[0] + d*Math.cos(ha)*hl, ne[1] - Math.sin(ha)*hl];
  wkPolyF(x, [[ne[0] - d*hl*0.12, ne[1] - hl*0.28], [ne[0] + d*hl*0.15, ne[1] - hl*0.3], nose, [ne[0], ne[1] + hl*0.25]], mane);
  if(!cervid && L > px(4)) wkEll(x, (ne[0] + nose[0])/2 + d*hl*0.15, (ne[1] + nose[1])/2 + hl*0.1, hl*0.25, hl*0.12, 0, wkCss([238, 232, 222]));
  if(L > px(5)) for(const e of [0, 1]) wkPolyF(x, [[ne[0] - d*hl*0.05*e, ne[1] - hl*0.22], [ne[0] - d*hl*(0.35 + 0.1*e), ne[1] - hl*(cervid ? 0.62 : 0.55)], [ne[0] + d*hl*0.08, ne[1] - hl*0.3]], wkCss(e ? coat.dark : coat.body));
  // a stag's antlers: a beam back and up, its tines forward
  if(cervid && st.stag && L > px(6)){ const ab = [ne[0], ne[1] - hl*0.3], aw = Math.max(px(0.4), L*0.02), col = wkCss(wkMix(coat.lit, [230, 220, 196], 0.5)), sz = kind === 'elk' ? 1.4 : 1;
    const tip = [ab[0] - d*L*0.16*sz, ab[1] - L*0.36*sz]; wkLine(x, [ab, [ab[0] - d*L*0.05*sz, ab[1] - L*0.18*sz], tip], col, aw);
    for(const k of [0.3, 0.55, 0.8]){ const p = [ab[0] + (tip[0] - ab[0])*k, ab[1] + (tip[1] - ab[1])*k]; wkLine(x, [p, [p[0] + d*L*0.09*sz, p[1] - L*0.06*sz]], col, aw*0.8); } } }

// A HARE: sitting hunched on its great haunch, ears up when it listens and laid back when it feeds or runs; running
// stretched long, its hind feet thrown past its fore
function wkHare(x, X, Y, m, st, c, px){
  const K = WK_KINDS.hare, d = st.dir, sk = Math.max(0.35, st.side), L = K.size*m, coat = c.mat(K.coat), fill = wkCss(coat.body), q = u => X + d*u*sk, y0 = Y - st.y*m;
  const run = st.pose === 'run' || st.pose === 'walk', s = run ? Math.sin(st.ph*Math.PI*2) : 0, ink = wkCss(coat.dark), lw = Math.max(px(0.4), L*0.045);
  if(run){ wkLine(x, [[q(-L*0.2), y0 - L*0.16], [q(-L*0.32 - L*0.22*(0.5 + 0.5*s)), y0 - L*0.02]], ink, lw*1.3); wkLine(x, [[q(L*0.16), y0 - L*0.16], [q(L*0.26 + L*0.18*(0.5 - 0.5*s)), y0]], ink, lw);
    wkEll(x, X, y0 - L*0.22, L*0.36*sk, L*0.12, -d*0.08, fill); wkEll(x, q(L*0.36), y0 - L*0.3, L*0.1*sk, L*0.075, -d*0.2, fill);
    wkEll(x, q(L*0.18), y0 - L*0.36, L*0.17*sk, L*0.03, d*0.25, wkCss(coat.dark)); return; }
  const up = st.head;   // (listening: upright, ears high; feeding: low and laid back)
  wkLine(x, [[q(-L*0.1), y0 - L*0.02], [q(L*0.12), y0]], ink, lw*1.2);
  wkEll(x, q(-L*0.12), y0 - L*0.17, L*0.18*sk, L*0.17, 0, fill); wkEll(x, q(L*0.05), y0 - L*(0.2 + 0.06*up), L*0.2*sk, L*0.13, -d*(0.2 + 0.3*up), fill);
  wkLine(x, [[q(L*0.18), y0 - L*0.18], [q(L*0.2), y0]], ink, lw);
  const hx = q(L*(0.24 + 0.04*up)), hy = y0 - L*(0.12 + 0.24*up); wkEll(x, hx, hy, L*0.1*sk, L*0.075, -d*0.3, fill);
  if(L > px(3)) for(const e of [0, 1]) wkEll(x, hx - d*L*(0.06 + 0.2*(1 - up)) - d*e*L*0.02, hy - L*(0.08 + 0.14*up), L*(0.03 + 0.13*(1 - up)), L*(0.03 + 0.12*up), -d*(0.25 - 0.1*e), wkCss(e ? coat.dark : coat.body));
  wkEll(x, q(-L*0.29), y0 - L*0.14, L*0.04, L*0.035, 0, wkCss([236, 232, 226])); }

// A BIRD: on the ground a body tipped forward, its head bobbing to peck; in the air its wings by their beat (a gull's
// M, a rook's rowing, a swift's sickle, a goose's long neck, a heron's folded one and trailing legs, a raptor's broad
// fingered plank), always a few strokes, as a painter puts birds in a sky
function wkBird(x, X, Y, m, kind, st, c, px){
  const K = WK_KINDS[kind], d = st.dir, S = K.size*m, col = c.mat(K.coat), y = Y - st.y*m, ink = wkCss(col.dark), w = Math.max(px(0.5), S*0.07);
  if(S < px(1.1)){ x.fillStyle = ink; x.fillRect(X - px(0.5), y - px(0.5), px(1), px(1)); return; }
  if(st.pose === 'peck' || st.pose === 'stand' || st.pose === 'wade'){ const b = (K.body || 0.4)*m, bob = st.pose === 'peck' ? Math.max(0, Math.sin(st.ph*Math.PI*2))*0.6 : 0;
    if(kind === 'heron'){ const hgt = 0.95*m, by = Y - hgt*0.62; wkLine(x, [[X - d*b*0.05, Y], [X, by]], ink, Math.max(px(0.4), hgt*0.02)); wkLine(x, [[X + d*b*0.08, Y], [X + d*b*0.02, by]], ink, Math.max(px(0.4), hgt*0.02));
      wkEll(x, X, by - hgt*0.08, hgt*0.17, hgt*0.1, -d*0.5, wkCss(col.body)); const strike = st.head, nk = [[X + d*hgt*0.1, by - hgt*0.12], [X + d*hgt*(0.04 + 0.22*strike), by - hgt*(0.3 - 0.05*strike)], [X + d*hgt*(0.12 + 0.3*strike), by - hgt*(0.36 - 0.1*strike)]];
      wkLine(x, nk, wkCss(col.lit), Math.max(px(0.5), hgt*0.04)); const hx = nk[2][0], hy = nk[2][1]; wkLine(x, [[hx, hy], [hx + d*hgt*0.16, hy + hgt*0.02*(1 + strike)]], wkCss([196, 168, 80]), Math.max(px(0.4), hgt*0.022));
      if(hgt > px(14)) wkLine(x, [[hx - d*hgt*0.02, hy - hgt*0.01], [hx - d*hgt*0.12, hy - hgt*0.01]], ink, Math.max(px(0.3), hgt*0.012)); return; }
    const by = Y - b*0.55; wkEll(x, X, by, b*0.5, b*0.26, -d*0.25, wkCss(col.body)); wkLine(x, [[X - d*b*0.42, by + b*0.04], [X - d*b*0.8, by + b*0.12]], wkCss(col.body), Math.max(px(0.4), b*0.14));
    wkEll(x, X + d*b*0.42, by - b*0.2 + bob*b*0.5, b*0.16, b*0.14, 0, wkCss(col.body)); if(b > px(5)) wkLine(x, [[X + d*b*0.56, by - b*0.2 + bob*b*0.5], [X + d*b*0.72, by - b*0.16 + bob*b*0.6]], ink, Math.max(px(0.3), b*0.06));
    if(b > px(3)) wkLine(x, [[X, by + b*0.2], [X + d*b*0.04, Y]], ink, Math.max(px(0.3), b*0.04)); return; }
  // in the air
  if(kind === 'raptor' || (kind === 'heron' && st.pose === 'fly')){ const span = (kind === 'heron' ? 1.7 : K.size)*m, fl = st.pose === 'fly' ? Math.sin(st.ph*Math.PI*2)*0.35 : st.pose === 'soar' ? 0.06 + 0.04*Math.sin(st.ph) : 0.02;
    // (a broad plank of wing, bowed, its tips fingered; the tail fanned; seen from below as it circles)
    const ws = span*0.5, cw = span*0.09, tip = sg => [X + sg*ws, y - span*fl*0.6];
    wkPolyF(x, [[X - cw*0.6, y - cw*0.2], tip(-1), [X - ws*0.95, y + cw*0.5], [X, y + cw*0.7], [X + ws*0.95, y + cw*0.5], tip(1), [X + cw*0.6, y - cw*0.2]], wkCss(kind === 'heron' ? col.body : col.dark));
    if(kind === 'raptor'){ wkPolyF(x, [[X - cw*0.3, y + cw*0.4], [X - cw*0.8, y + cw*2.2], [X + cw*0.8, y + cw*2.2], [X + cw*0.3, y + cw*0.4]], wkCss(col.dark));
      if(span > px(14)) for(const sg of [-1, 1]) for(let f = 0; f < 4; f++) wkLine(x, [[X + sg*ws*0.9, y - span*fl*0.55 + cw*(f*0.25 - 0.2)], [X + sg*ws*1.04, y - span*fl*0.6 + cw*(f*0.3 - 0.35)]], wkCss(col.dark), Math.max(px(0.3), cw*0.18)); }
    else { wkLine(x, [[X + d*cw*0.6, y - cw*0.1], [X + d*cw*1.4, y - cw*0.8], [X + d*cw*2.0, y - cw*0.3]], wkCss(col.body), Math.max(px(0.4), cw*0.5)); wkLine(x, [[X - d*cw*0.6, y + cw*0.4], [X - d*cw*3.2, y + cw*0.9]], ink, Math.max(px(0.3), cw*0.18)); }
    return; }
  if(kind === 'geese'){ const fl = Math.sin(st.ph*Math.PI*2), sp = S*0.5, bw = Math.max(px(0.5), S*0.06);
    wkLine(x, [[X - d*S*0.2, y], [X + d*S*0.28, y - S*0.03]], wkCss(col.body), Math.max(px(0.6), S*0.1)); wkLine(x, [[X + d*S*0.28, y - S*0.03], [X + d*S*0.5, y - S*0.05]], wkCss(wkMix(col.dark, [0, 0, 0], 0.4)), Math.max(px(0.4), S*0.05));
    wkLine(x, [[X - sp*0.9, y - sp*fl*0.5], [X - sp*0.3, y - sp*(0.2 + fl*0.25)], [X, y]], ink, bw); wkLine(x, [[X, y], [X + sp*0.3*0.6, y - sp*(0.2 + fl*0.25)*0.7], [X + sp*0.55, y - sp*fl*0.35]], ink, bw); return; }
  if(kind === 'butterflies' || kind === 'dragonflies'){ const sz = Math.max(px(1.6), S), op = kind === 'butterflies' ? 0.25 + 0.75*Math.abs(Math.sin(st.ph*Math.PI)) : 1;
    if(kind === 'dragonflies'){ wkLine(x, [[X - d*sz*0.9, y + sz*0.05], [X + d*sz*0.4, y]], wkCss(col.body), Math.max(px(0.4), sz*0.12));
      for(const k of [-1, 1]) wkEll(x, X + d*sz*0.1, y - k*sz*0.2 - sz*0.05, sz*0.5, sz*0.12, k*0.3, wkCss(wkMix(col.lit, [255, 255, 255], 0.6), 0.45)); return; }
    const wc = c.flowers ? c.flowers[(st.hue || 0) % c.flowers.length] : col.body; for(const k of [-1, 1]) wkEll(x, X + k*sz*0.32*op, y - sz*0.15, sz*0.32*op, sz*0.42, k*0.4, wkCss(wc, 0.92));
    wkLine(x, [[X, y - sz*0.45], [X, y + sz*0.2]], wkCss(col.dark), Math.max(px(0.3), sz*0.08)); return; }
  // the rest: two wing strokes and a body, beating (a swallow's and swift's narrow and swept, a bat's jagged)
  const fl = Math.sin(st.ph*Math.PI*2), sp = S*0.5;
  if(kind === 'bats'){ const k = 0.5 + 0.5*fl; for(const sg of [-1, 1]) wkPolyF(x, [[X, y], [X + sg*sp*0.4, y - sp*0.35*k], [X + sg*sp, y - sp*(0.5*k - 0.1)], [X + sg*sp*0.75, y + sp*0.05], [X + sg*sp*0.45, y - sp*0.02], [X + sg*sp*0.2, y + sp*0.12]], ink);
    wkEll(x, X, y + sp*0.05, sp*0.12, sp*0.18, 0, ink); return; }
  if(kind === 'swallows' || kind === 'swifts'){ const sw = kind === 'swifts' ? 0.45 : 0.3, k = 0.3 + 0.7*Math.abs(fl);
    for(const sg of [-1, 1]) wkPolyF(x, [[X, y - sp*0.06], [X + sg*sp*0.55, y - sp*0.3*k], [X + sg*sp, y - sp*(sw*k - 0.05)], [X + sg*sp*0.5, y - sp*0.05*k], [X, y + sp*0.08]], ink);
    if(kind === 'swallows' && S > px(5)) wkLine(x, [[X - px(0.3), y + sp*0.05], [X - sp*0.12, y + sp*0.4]], ink, Math.max(px(0.3), sp*0.04)), wkLine(x, [[X + px(0.3), y + sp*0.05], [X + sp*0.12, y + sp*0.4]], ink, Math.max(px(0.3), sp*0.04));
    return; }
  // (a flushed flock: rooks, pigeons, starlings, sparrows; a pale underwing on a pigeon as it turns)
  const under = kind === 'pigeons' ? wkCss(col.lit) : ink; wkEll(x, X, y, sp*0.22, sp*0.11, -d*0.2, wkCss(col.body));
  wkLine(x, [[X - sp, y - sp*fl*0.7], [X - sp*0.45, y - sp*(0.25 + fl*0.35)], [X, y]], under, w); wkLine(x, [[X, y], [X + sp*0.45, y - sp*(0.25 + fl*0.35)], [X + sp, y - sp*fl*0.7]], ink, w);
}

// ON THE WATER: a body half under, a head on its neck (a mallard's green, a swan's curve), up-ended to feed with its
// tail to the sky, and the V of its wake behind it as it goes
function wkSwimmer(x, X, Y, m, kind, st, c, px){
  const K = WK_KINDS[kind], d = st.dir, S = K.size*m, col = c.mat(K.coat), head = c.mat(K.head || K.coat), w = Math.max(px(0.4), S*0.04);
  if(st.ph > 0.05 && S > px(3)){ const wl = S*(1 + 3*st.ph); wkLine(x, [[X - d*S*0.4, Y + S*0.02], [X - d*(S*0.4 + wl), Y - S*0.06*st.ph]], wkCss(c.lit, 0.5*st.ph), w); wkLine(x, [[X - d*S*0.4, Y + S*0.02], [X - d*(S*0.4 + wl), Y + S*0.16*st.ph]], wkCss(c.lit, 0.4*st.ph), w); }
  const up = 1 - st.head;   // (up-ended: only its tail above the water)
  if(up > 0.6){ wkPolyF(x, [[X - S*0.18, Y], [X - d*S*0.05, Y - S*0.32], [X + S*0.18, Y]], wkCss(col.body)); return; }
  x.save(); x.beginPath(); x.rect(X - S*2, Y - S*2, S*4, S*2); x.clip(); wkEll(x, X, Y, S*0.5, S*0.24, 0, wkCss(col.body)); if(S > px(4)) wkEll(x, X - d*S*0.05, Y - S*0.12, S*0.32, S*0.08, 0, wkCss(col.lit, 0.6)); x.restore();
  const swan = kind === 'swans', nb = [X + d*S*0.3, Y - S*0.1], hd = swan ? [X + d*S*0.36, Y - S*0.62] : [X + d*S*0.4, Y - S*0.3];
  if(swan) wkLine(x, [nb, [X + d*S*0.5, Y - S*0.32], hd], wkCss(col.body), Math.max(px(0.5), S*0.07)); else wkLine(x, [nb, hd], wkCss(head.body), Math.max(px(0.5), S*0.12));
  wkEll(x, hd[0], hd[1], S*(swan ? 0.08 : 0.13), S*(swan ? 0.06 : 0.1), 0, wkCss(swan ? col.body : head.body)); wkLine(x, [[hd[0] + d*S*0.06, hd[1]], [hd[0] + d*S*0.2, hd[1] + S*0.04]], wkCss(swan ? [220, 110, 40] : [200, 170, 60]), Math.max(px(0.4), S*0.05)); }

// PAINT one creature of a kind in its state st ({ …wkAt's, dir, side, stag, hue }) at (X, Y) on the ground, m px a metre
export function wkPaint(x, X, Y, m, kind, st, c, px){
  const K = WK_KINDS[kind]; if(!K) return;
  if(K.way === 'paddle') return wkSwimmer(x, X, Y, m, kind, st, c, px);
  if(K.way === 'walk' || K.way === 'hop' || K.way === 'prowl'){ const L = K.size*m; if(L < px(1.4)){ x.fillStyle = wkCss(c.mat(K.coat).dark); x.fillRect(X - px(0.7), Y - st.y*m - px(1.2), px(1.4), px(1)); return; } return wkQuad(x, X, Y, m, kind, st, c, px); }
  return wkBird(x, X, Y, m, kind, st, c, px);
}
