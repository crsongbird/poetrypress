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
  rooks:     { way: 'flock', n: [5, 12], P: 55, range: 28, spread: 8, fly: 9, wander: 1.3, tau: 7, size: 0.85, hgt: [5, 14], coat: [30, 30, 36], body: 0.46, breast: [44, 44, 52], bill: [86, 84, 90], tail: 0.7 },
  pigeons:   { way: 'flock', n: [4, 10], P: 40, range: 20, spread: 5, fly: 10, wander: 1.0, tau: 6, size: 0.65, hgt: [4, 11], coat: [128, 132, 146], body: 0.33, breast: [170, 150, 170], face: [96, 140, 120], wing: [150, 154, 166] },
  starlings: { way: 'flock', n: [6, 16], P: 34, range: 22, spread: 6, fly: 10, wander: 1.2, tau: 5, size: 0.4, hgt: [3, 9], coat: [44, 46, 54], body: 0.21, breast: [58, 60, 72], gloss: [90, 70, 130], bill: [214, 190, 70] },
  sparrows:  { way: 'flock', n: [4, 10], P: 26, range: 14, spread: 2.5, fly: 6, wander: 0.7, tau: 4, size: 0.24, hgt: [1.5, 4], coat: [134, 104, 76], body: 0.15, breast: [196, 180, 152], face: [92, 84, 78] },
  // (Ruby, 2026-10-25: "increase the size of and diversity of birds (and colors, shading, etc)": the colourful ones,
  //  each by its field marks, docs/prior-art/ringworld-wildlife.md §8: breast, wing patch, face, tail, bill)
  magpies:   { way: 'flock', n: [2, 5], P: 60, range: 22, spread: 5, fly: 7, wander: 1.1, tau: 8, size: 0.58, hgt: [3, 9], coat: [22, 24, 30], body: 0.44, breast: [242, 242, 238], patch: [238, 238, 234], gloss: [70, 120, 110], tail: 1.6 },
  jays:      { way: 'flock', n: [1, 3], P: 70, range: 24, spread: 6, fly: 7, wander: 1.2, tau: 9, size: 0.55, hgt: [4, 10], coat: [190, 146, 124], body: 0.34, breast: [206, 172, 150], wing: [40, 38, 42], patch: [74, 128, 214], face: [236, 230, 222], tail: 0.9 },
  goldfinches: { way: 'flock', n: [6, 14], P: 24, range: 12, spread: 3, fly: 7, wander: 0.8, tau: 4, size: 0.23, hgt: [1.5, 5], coat: [176, 138, 98], body: 0.13, breast: [238, 228, 212], wing: [26, 24, 26], patch: [246, 206, 40], face: [208, 42, 40] },
  parakeets: { way: 'flock', n: [5, 12], P: 40, range: 30, spread: 6, fly: 12, wander: 1, tau: 6, size: 0.45, hgt: [6, 16], coat: [98, 194, 84], body: 0.3, breast: [158, 220, 110], wing: [64, 156, 66], patch: [232, 222, 92], bill: [214, 44, 44], tail: 1.7 },
  robins:    { way: 'flock', n: [1, 2], P: 30, range: 10, spread: 2, fly: 6, wander: 0.6, tau: 5, size: 0.21, hgt: [1, 3], coat: [128, 108, 78], body: 0.13, breast: [230, 118, 50], face: [230, 118, 50] },
  // on the water: a slow drift, now and then up-ended to feed
  ducks:     { way: 'paddle', n: [2, 7], spread: 3, wander: 5, tau: 38, size: 0.55, coat: [116, 96, 74], head: [40, 88, 60] },
  swans:     { way: 'paddle', n: [1, 3], spread: 4, wander: 7, tau: 55, size: 1.4, coat: [240, 238, 232], head: [240, 238, 232] },
  // at the water's edge: still, a slow step, the strike, and now and then a long slow flight down the shore
  heron:     { way: 'wade', n: [1, 1], P: 90, range: 6, fly: 9, flyOff: 45, flies: 0.22, size: 0.95, coat: [150, 156, 164] },
  egret:     { way: 'wade', n: [1, 1], P: 90, range: 6, fly: 8, flyOff: 45, flies: 0.22, size: 1.0, coat: [246, 246, 240], bill: [232, 192, 52] },
  // in the air: circling on a thermal and gliding to the next; hawking for insects on noise (amp: how far, hgt: how high)
  raptor:    { way: 'soar', n: [1, 2], P: 160, size: 1.3, speed: 9, coat: [96, 72, 52] },
  swallows:  { way: 'hawk', n: [3, 7], tau: 10, amp: 18, hgt: [1.2, 9], size: 0.32, flap: 5, coat: [36, 40, 64] },
  swifts:    { way: 'hawk', n: [4, 9], tau: 14, amp: 40, hgt: [22, 65], size: 0.42, flap: 6, coat: [42, 40, 40] },
  bats:      { way: 'hawk', n: [3, 8], tau: 6, amp: 7, hgt: [3, 14], size: 0.28, flap: 6, coat: [44, 36, 34] },
  butterflies: { way: 'hawk', n: [1, 3], tau: 3, amp: 2, hgt: [0.3, 1.6], size: 0.07, flap: 5, coat: [230, 200, 90] },
  dragonflies: { way: 'dart', n: [1, 3], P: 2.6, range: 2, hgt: [0.4, 1.4], size: 0.09, coat: [70, 140, 170] },
  // the magic world's own (Ruby, 2026-10-25: "cute slimes, chocobo-like birds and such (legally distinct)";
  // docs/prior-art/ringworld-magic-creatures.md): slimes, low mounds of jelly that hop about and bounce where they sit,
  // squashing as they gather and land and stretching as they leap; striders, tall flightless runners of the open
  // country as emus are (size: a slime's width, a strider's height)
  slimes:    { way: 'hop', body: 'slime', n: [1, 4], P: 40, range: 8, spread: 2.5, walk: 1.2, run: 4, bolt: 0.1, wander: 1.2, tau: 10, size: 0.5, stride: 0.9, coat: [120, 200, 150] },
  striders:  { way: 'walk', body: 'strider', n: [2, 5], P: 150, range: 50, spread: 5, walk: 1.4, run: 12, bolt: 0.3, wander: 3, tau: 30, size: 2, stride: 2.75, coat: [176, 150, 112] },
  // (Ruby, 2026-10-25: "a wider diversity of wildlife, medium and small predators, fantastic life": the hunters, each by
  //  its country and its hours and fewer than what they hunt; docs/prior-art/ringworld-wildlife.md §9. belly: its
  //  underparts (a badger's legs and belly black); a stoat bounds, a lynx creeps, a wolf pack trots and lies up)
  stoat:     { way: 'prowl', body: 'hunter', n: [1, 1], P: 30, range: 14, spread: 0, walk: 1.6, run: 6, bolt: 0.15, wander: 0.8, tau: 6, size: 0.3, stride: 0.45, coat: [150, 96, 56], belly: [236, 222, 196] },
  badger:    { way: 'prowl', body: 'hunter', n: [1, 2], P: 90, range: 25, spread: 2, walk: 0.9, run: 4, bolt: 0.05, wander: 1, tau: 16, size: 0.8, stride: 0.6, coat: [146, 142, 136], belly: [38, 36, 36], pounce: 0 },
  lynx:      { way: 'prowl', body: 'hunter', n: [1, 1], P: 120, range: 40, spread: 0, walk: 1.0, run: 12, bolt: 0.06, wander: 0.6, tau: 20, size: 1.0, stride: 1.2, coat: [176, 140, 102], belly: [228, 216, 198] },
  wolves:    { way: 'walk', body: 'hunter', n: [4, 8], P: 200, range: 80, spread: 5, walk: 2.2, run: 11, bolt: 0.2, wander: 2, tau: 30, size: 1.2, stride: 1.7, coat: [126, 120, 110], belly: [214, 208, 196] },
  jackals:   { way: 'walk', body: 'hunter', n: [1, 3], P: 110, range: 50, spread: 3, walk: 1.8, run: 10, bolt: 0.2, wander: 1.6, tau: 20, size: 0.85, stride: 1.2, coat: [178, 146, 104], belly: [230, 218, 196] },
  // (the night's and the open field's hunters of the air: an owl quartering low and slow on its broad round wings; a
  //  kestrel hanging on the wind over one spot, its head still, then sliding on to the next or dropping on its prey)
  owls:      { way: 'hawk', n: [1, 1], tau: 30, amp: 26, hgt: [1.5, 5], size: 0.9, flap: 1.4, coat: [206, 170, 120], face: [246, 240, 228] },
  kestrel:   { way: 'hover', n: [1, 1], P: 30, range: 35, hgt: [6, 12], size: 0.75, flap: 7, fly: 8, coat: [176, 100, 60], head: [128, 134, 148] },
  // (the magic world's fantastic ones, kinds of folklore and of no one's game, docs/prior-art/ringworld-magic-creatures.md
  //  §3–6: drakes, two-legged and winged, soaring as a raptor does; sky rays, vast and slow, rowing the high air in pods;
  //  lantern moths glowing softly by night; moonharts, pale deer with one horn and a mane of their region's light)
  drakes:    { way: 'soar', body: 'drake', n: [1, 2], P: 180, size: 4.2, speed: 11, coat: [92, 74, 104] },
  skyrays:   { way: 'cruise', body: 'ray', n: [1, 3], size: 38, speed: 4.5, hgt: [170, 380], R: [320, 760], beat: 7, coat: [64, 78, 112], belly: [178, 192, 216] },
  lanternmoths: { way: 'hawk', body: 'moth', n: [3, 8], tau: 8, amp: 3.5, hgt: [0.6, 4], size: 0.2, flap: 3, coat: [214, 196, 160] },
  moonharts: { way: 'walk', n: [2, 4], P: 190, range: 45, spread: 4, walk: 1.1, run: 9, bolt: 0.25, wander: 3, tau: 34, size: 1.7, stride: 4.2, coat: [226, 222, 214] },
  // a skein of geese passing over in its V, once in an era, against the wind
  geese:     { way: 'skein', n: [7, 15], P: 520, speed: 16, hgt: [120, 240], size: 1.6, coat: [110, 104, 96] },
};
export const WK_FLYERS = ['raptor', 'swallows', 'swifts', 'bats', 'geese', 'butterflies', 'dragonflies', 'owls', 'kestrel', 'drakes', 'skyrays', 'lanternmoths'];
// (the birds: drawn larger than life still, as a painter does birds so that they read, Ruby: "increase the size of … birds")
export const WK_BIRDS = ['rooks', 'pigeons', 'starlings', 'sparrows', 'magpies', 'jays', 'goldfinches', 'parakeets', 'robins', 'heron', 'egret', 'raptor', 'swallows', 'swifts', 'geese', 'owls', 'kestrel'];
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
// (a slime's own bounce on top of where it is: a hop every second or two of its own, sitting or on its way, gathering
//  itself flat before it and squashing as it lands, stretched in the air, a jelly's wobble after. sq: -1 squashed …
//  +1 stretched, its volume kept by its painter)
export function wkAt(kind, s, j, t, env = {}){ const st = wkAt0(kind, s, j, t, env), K = WK_KINDS[kind]; if(K.body !== 'slime' || !st.on) return st;
  const per = 1.4 + 1.2*wkHash(j, 40, s), tt = t + wkHash(j, 41, s)*per, u = (tt % per)/per, up = 0.3;
  const y = u < up ? 0.55*K.size*Math.sin(Math.PI*u/up) : 0, wob = u >= up && u < up + 0.3 ? 0.12*Math.sin((u - up)*60)*(1 - (u - up)/0.3) : 0;
  const sq = u < up ? 0.28*Math.sin(Math.PI*u/up) : u < up + 0.08 ? -0.4*(1 - (u - up)/0.08) : u > 0.9 ? -0.35*wkSmooth((u - 0.9)/0.1) : wob;
  return { ...st, y, sq }; }
function wkAt0(kind, s, j, t, env = {}){
  const K = WK_KINDS[kind], n = wkCount(kind, s), tt = t + (K.P ? wkHash(s, 2, 9)*K.P*30 : wkHash(s, 4, 9)*500);
  switch(K.way){
  case 'walk': case 'hop': case 'prowl': case 'flock': {
    const e = wkEra(s, tt, K.P), { L, P, dist, T } = wkSpan(K, s, j, e.k, n), Pp = wkSpan(K, s, j, e.k - 1, n);
    const alertBy = wkSmooth((wkNoise(s + j*17, tt/7) - 0.15)/0.35), grazeFace = (LL, TT, ux, uz) => Math.atan2(uz, ux) + 1.3*(wkNoise(s + j*5, tt/40) - wkNoise(s + j*5, (LL.dep + TT)/40));
    // (Ruby: "a deer not always eating": between moves each member keeps its own rhythm of grazing, standing to look
    //  round, and lying down to rest and chew, slowly, a member at a time; a ground bird hops now and then and flicks
    //  its wings. lie: how far down it lies, 0 standing … 1 lying; hop: a ground bird's hop, in metres)
    const act = wkNoise(s + j*31, tt/55), lie = K.way === 'walk' ? wkSmooth((-0.22 - act)/0.22) : 0, look = wkSmooth((act - 0.3)/0.25);
    const hopU = K.way === 'flock' ? (tt*0.7 + wkHash(j, 33, s)*7) % 7 : 9, hop = hopU < 0.45 ? 0.12*K.size*Math.sin(Math.PI*hopU/0.45) : 0;
    if(tt < L.dep || dist < 1e-6){ const LL = tt < L.dep ? P : L, TT = tt < L.dep ? Pp.T : T, g = wkGraze(K, s, j, LL, TT, tt), ux = LL.p1[0] - (tt < L.dep ? Pp.P : P).p1[0], uz = LL.p1[1] - (tt < L.dep ? Pp.P : P).p1[1];
      const warn = L.bolt && K.way !== 'flock' ? wkSmooth((tt - (L.dep - 1.2))/0.6) : 0;
      return { x: g[0], z: g[1], y: hop, face: grazeFace(LL, TT, ux, uz), pose: K.way === 'flock' ? 'peck' : 'graze', ph: tt*(K.way === 'flock' ? 0.9 : 0.12) + j*0.37, head: Math.max(warn, alertBy*(K.way === 'hop' ? 1 : 0.7), look, lie*0.8), lie: lie*(1 - warn), flick: hop > 0 ? 1 : 0, on: 1 }; }
    const from = wkGraze(K, s, j, P, Pp.T, L.dep), p = Math.min(1, (tt - L.dep)/T);
    if(p >= 1){ const g = wkGraze(K, s, j, L, T, tt), settle = wkSmooth((tt - L.dep - T)/20); return { x: g[0], z: g[1], y: hop, face: grazeFace(L, T, L.p1[0] - from[0], L.p1[1] - from[1]), pose: K.way === 'flock' ? 'peck' : 'graze', ph: tt*0.9 + j*0.37, head: Math.max(alertBy*0.7, look*settle, lie*settle*0.8), lie: lie*settle, flick: hop > 0 ? 1 : 0, on: 1 }; }
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
    if(K.way === 'prowl' && !L.bolt && wkHash(e.k, 32, s) < 0.35*(K.pounce ?? 1)){ const q = (gone - (dl - 1.6))/1.6; if(q > 0) y = 0.5*Math.sin(Math.PI*Math.min(1, q)); if(q > 0) return { x, z, y, face: Math.atan2(dz, dx), pose: 'pounce', ph: q, head: 0.5, on: 1 }; }
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
  // (a kestrel's hunt: it hangs on the wind over one spot, facing into it, its head held still while its wings beat fast;
  //  then it slides on to the next, or now and then drops, wings half shut, to the grass and rises again)
  case 'hover': { const e = wkEra(s + j*41, tt, K.P), [wa] = env.wind || [0, 3], spot = k => [K.range*(2*wkHash(k, 57, s + j) - 1), K.range*(2*wkHash(k, 58, s + j) - 1), K.hgt[0] + (K.hgt[1] - K.hgt[0])*wkHash(k, 59, s + j)];
    const a = spot(e.k), b = spot(e.k + 1), u = (tt - e.t0)/e.d, stoop = wkHash(e.k, 60, s + j) < 0.3, hv = 0.66, sd = 0.1, w = wkWander(s + j*13, tt, 2.5);
    if(u < hv){ const dn = stoop ? wkSmooth((u - (hv - sd))/sd) : 0;
      return { x: a[0] + w[0]*0.25, z: a[1] + w[1]*0.25, y: a[2]*(1 - dn) + 0.4*dn + w[1]*0.15, face: wa + Math.PI, pose: dn > 0.05 ? 'stoop' : 'hover', ph: tt*K.flap, head: 0, on: 1 }; }
    const p = wkSmooth((u - hv)/(1 - hv)), y0 = stoop ? 0.4 : a[2];
    return { x: a[0] + (b[0] - a[0])*p, z: a[1] + (b[1] - a[1])*p, y: y0 + (b[2] - y0)*p + 2*Math.sin(Math.PI*p), face: Math.atan2(b[1] - a[1], b[0] - a[0]), pose: 'glide', ph: tt*K.flap*0.4, head: 1, on: 1 }; }
  // (a pod of sky rays rowing round a wide circle of their own, high and slow, one behind another, rising and sinking
  //  on the air as whales do on the sea; ph their wings' slow beat)
  case 'cruise': { const R = K.R[0] + (K.R[1] - K.R[0])*wkHash(s, 54, 1), sgn = wkHash(s, 55, 1) < 0.5 ? 1 : -1, th = wkHash(s, 56, 1)*Math.PI*2 + sgn*(tt*K.speed - j*K.size*1.7)/R;
    const lat = (j % 2 ? 1 : -1)*Math.ceil(j/2)*K.size*0.9, rr = R + lat, h = K.hgt[0] + (K.hgt[1] - K.hgt[0])*(0.5 + 0.5*wkNoise(s + 3, tt/160)) + 6*wkNoise(s + j*11, tt/30);
    return { x: rr*Math.cos(th), z: rr*Math.sin(th), y: h, face: th + sgn*Math.PI/2, pose: 'fly', ph: tt/K.beat + j*0.27, head: 1, on: 1 }; }
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
  // (lying down to rest (st.lie): its body let down to the ground, its legs folded under it)
  const lie = st.lie || 0, back = L*(cervid ? 0.66 : 0.5)*(1 - 0.62*lie), deep = L*(cervid ? 0.27 : 0.24), by = Y - lift - back + deep*0.5, ph = st.ph*Math.PI*2;
  const legs = [[0.3, 0], [0.24, Math.PI], [-0.3, Math.PI*0.5], [-0.36, Math.PI*1.5]];
  if(lie > 0.6 && L > px(3)) for(const u of [0.22, -0.26]) wkEll(x, q(u*L), Y - deep*0.18, L*0.16*sk, deep*0.2, 0, wkCss(coat.dark));
  if(L > px(3) && lie <= 0.6) legs.forEach(([u, o], i) => { const far = i % 2 === 1, hind = i >= 2, sw = run ? (hind ? -1 : 1)*Math.sin(ph)*0.7 : st.pose === 'walk' ? Math.sin(ph + o)*0.36 : 0;
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
  // (a moonhart: one long spiral horn from its brow, ivory; its mane its region's light, glowing softly by night)
  if(kind === 'moonharts' && L > px(5)){ const gl = c.glow || [220, 230, 255], nt = st.nt || 0, hb = [ne[0] + d*hl*0.05, ne[1] - hl*0.3], ht = [ne[0] + d*hl*0.55, ne[1] - hl*1.6], hw = Math.max(px(0.4), L*0.018);
    wkLine(x, [nb, ne].map(([a2, b2], i) => [a2 + d*px2*nw*(i ? 0.45 : 0.9), b2 + pz2*nw*(i ? 0.45 : 0.9)]), wkCss(gl, 0.5 + 0.4*nt), Math.max(px(0.5), nw*0.4));
    wkLine(x, [hb, ht], wkCss(wkMix(coat.lit, [246, 238, 214], 0.7)), hw);
    if(L > px(14)) for(let k = 1; k < 5; k++){ const p = [hb[0] + (ht[0] - hb[0])*k/5, hb[1] + (ht[1] - hb[1])*k/5]; wkLine(x, [[p[0] - hw, p[1] + hw*0.6], [p[0] + hw, p[1] - hw*0.6]], wkCss(coat.dark, 0.5), hw*0.4); } }
  if(cervid && st.stag && L > px(6) && kind !== 'moonharts'){ const ab = [ne[0], ne[1] - hl*0.3], aw = Math.max(px(0.4), L*0.02), col = wkCss(wkMix(coat.lit, [230, 220, 196], 0.5)), sz = kind === 'elk' ? 1.4 : 1;
    const tip = [ab[0] - d*L*0.16*sz, ab[1] - L*0.36*sz]; wkLine(x, [ab, [ab[0] - d*L*0.05*sz, ab[1] - L*0.18*sz], tip], col, aw);
    for(const k of [0.3, 0.55, 0.8]){ const p = [ab[0] + (tip[0] - ab[0])*k, ab[1] + (tip[1] - ab[1])*k]; wkLine(x, [p, [p[0] + d*L*0.09*sz, p[1] - L*0.06*sz]], col, aw*0.8); } } }

// THE HUNTERS' FORMS (docs/prior-art/ringworld-wildlife.md §9), each to its body's length: back, its back's height off the
// ground; deep, its chest; leg, a leg's width; neck and head, their lengths; its ears; tail: [length, width, how far it
// hangs below level (radians)]; tip, a tail's darker tip; and its marks (a badger's striped face and black legs, a lynx's
// spots, a canid's pale muzzle and belly); bound, a mustelid's arched bounding; creep, a cat's low stalk
const WK_HUNT = {
  stoat:   { back: 0.3, deep: 0.22, leg: 0.06, neck: 0.14, head: 0.17, ear: 'round', tail: [0.42, 0.07, 0.25], tip: [26, 22, 20], bound: 1 },
  badger:  { back: 0.36, deep: 0.36, leg: 0.09, neck: 0.06, head: 0.25, ear: 'round', tail: [0.14, 0.09, 0.9], legs: 'belly', stripe: 1 },
  lynx:    { back: 0.66, deep: 0.3, leg: 0.055, neck: 0.12, head: 0.17, ear: 'tuft', tail: [0.16, 0.07, 0.5], tip: [30, 26, 24], spots: 1, creep: 1 },
  wolves:  { back: 0.72, deep: 0.33, leg: 0.055, neck: 0.2, head: 0.25, ear: 'point', tail: [0.42, 0.13, 1.15], mask: 1 },
  jackals: { back: 0.68, deep: 0.28, leg: 0.045, neck: 0.18, head: 0.24, ear: 'big', tail: [0.38, 0.11, 1.15], tip: [44, 36, 30], mask: 1 },
};
// A HUNTER in profile: its legs by its gait, its tail as it carries it (a wolf's hanging, level as it runs), its body
// lit along the back, its head and ears and marks; a stoat bounding with its back arched, white in winter (st.wint)
function wkHunter(x, X, Y, m, kind, st, c, px){
  const K = WK_KINDS[kind], F = WK_HUNT[kind], d = st.dir, sk = Math.max(0.3, st.side), L = K.size*m, q = u => X + d*u*sk;
  const coat = c.mat(kind === 'stoat' && (st.wint || 0) > 0.5 ? [238, 236, 230] : K.coat), belly = c.mat(K.belly || K.coat), fill = wkCss(coat.body);
  const lift = st.y*m, moving = st.pose === 'run' || st.pose === 'walk' || st.pose === 'pounce', run = st.pose === 'run' || (!!F.bound && moving), ph = st.ph*Math.PI*2, lie = st.lie || 0;
  const creep = F.creep && st.pose === 'walk' ? 0.22 : 0, arch = F.bound && moving ? Math.max(0, Math.sin(ph)) : 0;
  const back = L*F.back*(1 - 0.62*lie)*(1 - creep), deep = L*F.deep, by = Y - lift - back + deep*0.5, lw = Math.max(px(0.4), L*F.leg), bA = arch*L*0.1;
  const legCol = far => wkCss(F.legs === 'belly' ? wkMix(belly.body, [0, 0, 0], far ? 0.3 : 0) : far ? coat.dark : wkMix(coat.body, coat.dark, 0.45));
  if(L > px(3) && lie <= 0.6) [[0.3, 0], [0.24, Math.PI], [-0.3, Math.PI*0.5], [-0.36, Math.PI*1.5]].forEach(([u, o], i) => { const far = i % 2 === 1, hind = i >= 2;
    const sw = run ? (hind ? -1 : 1)*Math.sin(ph)*(F.bound ? 0.9 : 0.7) : st.pose === 'walk' ? Math.sin(ph + o)*0.38 : 0, uu = F.bound ? u*(1 - 0.45*arch) : u;
    const top = [q(uu*L), by + deep*0.25 - bA*0.5], len = Math.max(L*0.05, Y - lift - top[1]), knee = [top[0] + d*(Math.sin(sw)*0.5 + (hind ? -0.1 : 0.05))*len, top[1] + len*0.5], ft = [top[0] + d*Math.sin(sw)*len, top[1] + Math.cos(sw)*len];
    wkLine(x, [top, knee, ft], legCol(far), lw); });
  if(lie > 0.6 && L > px(3)) for(const u of [0.24, -0.26]) wkEll(x, q(u*L), Y - deep*0.15, L*0.15*sk, deep*0.2, 0, legCol(false));
  // (its tail, hung as it carries it; level and streaming as it runs, raised as it pounces)
  x.lineCap = 'round'; const tl = F.tail, tb = [q(-L*0.38), by - deep*0.18 - bA*0.4], dr = tl[2]*(run ? 0.35 : 1) - (st.pose === 'pounce' ? 0.6 : 0), tlen = L*tl[0];
  const te = lie > 0.6 ? [tb[0] - d*tlen*0.95*sk, Y - lift - L*0.03] : [tb[0] - d*Math.cos(dr)*tlen*sk, tb[1] + Math.sin(dr)*tlen], tm = [(tb[0] + te[0])/2 - d*tlen*0.06, (tb[1] + te[1])/2 - tlen*0.08];
  const tw = Math.max(px(0.5), L*tl[1]), tnx = -(te[1] - tb[1]), tny = te[0] - tb[0], tnl = Math.hypot(tnx, tny) || 1, plume = (u, w) => { const a2 = u < 0.5 ? tb : tm, b2 = u < 0.5 ? tm : te, v = u < 0.5 ? u*2 : u*2 - 1, px0 = a2[0] + (b2[0] - a2[0])*v, py0 = a2[1] + (b2[1] - a2[1])*v; return [[px0 + tnx/tnl*w, py0 + tny/tnl*w], [px0 - tnx/tnl*w, py0 - tny/tnl*w]]; };
  const prof = [0, 0.3, 0.6, 0.85, 1].map(u => [u, tw*0.5*(u < 0.3 ? 0.55 + 1.5*u : 1 - 0.85*((u - 0.3)/0.7)**1.6)]), side1 = prof.map(([u, w]) => plume(u, w)[0]), side2 = prof.map(([u, w]) => plume(u, w)[1]).reverse();
  wkPolyF(x, [...side1, ...side2], fill);
  if(F.tip && L > px(4)){ const t1 = [0.62, 0.8, 1].map(u => [u, tw*0.5*(1 - 0.85*((u - 0.3)/0.7)**1.6)]); wkPolyF(x, [...t1.map(([u, w]) => plume(u, w*1.05)[0]), ...t1.map(([u, w]) => plume(u, w*1.05)[1]).reverse()], wkCss(c.mat(F.tip).body)); }
  // (its body: a stoat's one long arched stroke; the rest chest, haunch and barrel; lit along the back, paler beneath)
  if(F.bound){ const arc = (u0, u1, dy) => [0, 0.25, 0.5, 0.75, 1].map(k => { const u = u0 + (u1 - u0)*k, v = (u + 0.3)/0.58; return [q(u*L), by + dy - bA*Math.sin(Math.PI*Math.max(0, Math.min(1, v)))]; });
    wkLine(x, arc(-0.3, 0.28, 0), fill, deep);
    if(L > px(4)) wkLine(x, arc(-0.2, 0.24, deep*0.26), wkCss(kind === 'stoat' && (st.wint || 0) > 0.5 ? coat.lit : belly.body), deep*0.32);
    if(L > px(6)) wkLine(x, arc(-0.2, 0.18, -deep*0.3), wkCss(coat.lit, 0.5), deep*0.16); }
  else { wkEll(x, X, by, L*0.36*sk, deep*0.42, 0, fill); wkEll(x, q(L*0.2), by - deep*0.04, L*0.2*sk, deep*0.52, 0, fill); wkEll(x, q(-L*0.22), by - deep*0.06, L*0.18*sk, deep*0.5, 0, fill);
    if(F.mask && L > px(5)) wkEll(x, q(L*0.04), by + deep*0.3, L*0.28*sk, deep*0.13, 0, wkCss(belly.body, 0.85));
    if(F.spots && L > px(10)) for(const [u, v] of [[-0.18, 0.08], [0.02, -0.06], [0.14, 0.14], [-0.28, -0.08], [-0.04, 0.22], [0.2, -0.02]]) wkEll(x, q(u*L), by + v*deep, deep*0.08, deep*0.06, 0, wkCss(coat.dark, 0.55));
    if(L > px(5)) wkEll(x, q(-L*0.02), by - deep*0.3, L*0.34*sk, deep*0.15, 0, wkCss(coat.lit, 0.5)); }
  // (its neck and head: down to the scent, up to look, low and long as it runs)
  const hu = run ? 0.35 : st.pose === 'pounce' ? 0.15 : st.head, na = run ? 0.2 : (F.stripe ? -0.9 : -0.8) + 1.6*hu, nl = L*F.neck, nb = [q(L*0.3), by - deep*0.12 - bA*0.6];
  const ne = [nb[0] + d*Math.cos(na)*nl, nb[1] - Math.sin(na)*nl]; wkLine(x, [nb, ne], fill, deep*0.66); x.lineCap = 'butt';
  const hl = L*F.head, ha = hu < 0.3 ? -0.8 : run ? 0.05 : -0.18, nose = [ne[0] + d*Math.cos(ha)*hl, ne[1] - Math.sin(ha)*hl], cat = F.ear === 'tuft';
  const headCol = F.stripe ? wkCss(c.mat([236, 234, 228]).body) : fill;
  if(cat){ wkEll(x, ne[0] + d*hl*0.25, ne[1] - hl*0.05, hl*0.42, hl*0.36, 0, headCol); wkEll(x, ne[0] + d*hl*0.62, ne[1] + hl*0.08, hl*0.2, hl*0.15, 0, wkCss(belly.body)); }
  else { const hp = [[ne[0] - d*hl*0.12, ne[1] - hl*(F.stripe ? 0.4 : 0.32)], [ne[0] + d*hl*0.25, ne[1] - hl*(F.stripe ? 0.36 : 0.3)], nose, [ne[0] + d*hl*0.05, ne[1] + hl*(F.stripe ? 0.32 : 0.24)]];
    wkPolyF(x, hp, headCol);
    if(F.stripe && L > px(5)){ x.save(); x.beginPath(); hp.forEach(([a2, b2], i) => i ? x.lineTo(a2, b2) : x.moveTo(a2, b2)); x.closePath(); x.clip();
      wkLine(x, [[ne[0] + (nose[0] - ne[0])*0.82, ne[1] + (nose[1] - ne[1])*0.82 - hl*0.04], [ne[0] - d*hl*0.15, ne[1] - hl*0.12]], wkCss(belly.body), Math.max(px(0.4), hl*0.16)); x.restore(); } }
  if(F.mask && L > px(6)) wkEll(x, ne[0] + (nose[0] - ne[0])*0.6, ne[1] + (nose[1] - ne[1])*0.6 + hl*0.08, hl*0.28, hl*0.1, ha*-d*0.5, wkCss(belly.body));
  if(L > px(14)) wkEll(x, ne[0] + (nose[0] - ne[0])*(cat ? 0.42 : 0.45) + d*hl*0.02, ne[1] + (nose[1] - ne[1])*0.45 - hl*0.1, Math.max(px(0.4), hl*0.05), Math.max(px(0.4), hl*0.04), 0, wkCss([18, 16, 14]));
  // (its ears: a badger's and a stoat's small and round, a wolf's pointed, a jackal's tall, a lynx's with their black tufts)
  if(L > px(4)){ const eb = [ne[0] + d*hl*(cat ? 0.15 : 0), ne[1] - hl*(cat ? 0.3 : 0.26)], earCol = wkCss(F.stripe ? belly.body : coat.dark);
    if(F.ear === 'round') wkEll(x, eb[0] - d*hl*0.06, eb[1] - hl*0.04, hl*0.13, hl*0.11, 0, earCol);
    else { const tall = F.ear === 'big' ? 0.62 : F.ear === 'tuft' ? 0.42 : 0.46, tip = [eb[0] - d*hl*0.1, eb[1] - hl*tall];
      wkPolyF(x, [[eb[0] - d*hl*0.16, eb[1] + hl*0.04], tip, [eb[0] + d*hl*0.12, eb[1] + hl*0.02]], earCol);
      if(cat && L > px(8)) wkLine(x, [tip, [tip[0] - d*hl*0.02, tip[1] - hl*0.2]], wkCss([22, 20, 18]), Math.max(px(0.3), hl*0.05)); } } }

// A HARE: sitting hunched on its great haunch, ears up when it listens and laid back when it feeds or runs; running
// stretched long, its hind feet thrown past its fore
// A SLIME (docs/prior-art/ringworld-magic-creatures.md §1): a low mound of jelly, wider than tall, see-through, its
// darker heart showing inside it, a gleam on the light's side, two small dark eyes and no mouth (a mound of its own, not
// a teardrop); squashed flat as it gathers and lands, stretched tall in the air (st.sq), its volume kept; of its
// region's element (c.glow), lit faintly from within by night (st.nt)
function wkSlime(x, X, Y, m, st, c, px){
  const K = WK_KINDS.slimes, L = K.size*m, sq = st.sq || 0, w = L*(1 - 0.45*sq), h = L*0.62*(1 + sq), d = st.dir || 1, yb = Y - st.y*m, sd = c.sd || 1;
  const jel = wkMix(c.mat(K.coat).body, c.glow || K.coat, 0.55), nt = st.nt || 0;
  if(L < px(1.6)){ x.fillStyle = wkCss(jel, 0.8); x.fillRect(X - px(0.8), yb - px(1.2), px(1.6), px(1.2)); return; }
  wkEll(x, X, Y, w*0.5*(1 - Math.min(0.5, st.y/(K.size*1.2))), Math.max(px(0.5), L*0.07), 0, wkCss([0, 0, 0], 0.18));
  const dome = () => { x.beginPath(); x.moveTo(X - w/2, yb); x.bezierCurveTo(X - w/2, yb - h*0.85, X - w*0.24, yb - h, X, yb - h); x.bezierCurveTo(X + w*0.24, yb - h, X + w/2, yb - h*0.85, X + w/2, yb);
    x.quadraticCurveTo(X, yb + h*0.1, X - w/2, yb); x.closePath(); };
  if(nt > 0.2){ const g = x.createRadialGradient(X, yb - h*0.4, 0, X, yb - h*0.4, L*1.1); g.addColorStop(0, wkCss(c.glow || jel, 0.22*nt)); g.addColorStop(1, wkCss(c.glow || jel, 0)); x.fillStyle = g; x.fillRect(X - L*1.1, yb - h*0.4 - L*1.1, L*2.2, L*2.2); }
  dome(); x.fillStyle = wkCss(wkMix(jel, [255, 255, 255], 0.08*nt), 0.74); x.fill();
  wkEll(x, X + d*w*0.08, yb - h*0.34, w*0.17, h*0.17, 0, wkCss(wkMix(jel, [0, 0, 0], 0.38), 0.45));
  wkEll(x, X + sd*w*0.17, yb - h*0.7, w*0.12, h*0.09, -0.5*sd, wkCss([255, 255, 255], 0.55));
  if(L > px(6)){ x.strokeStyle = wkCss(wkMix(jel, [0, 0, 0], 0.3), 0.5); x.lineWidth = Math.max(px(0.4), L*0.03); dome(); x.stroke(); }
  if(L > px(4)){ const ey = yb - h*0.5, ex = X + d*w*0.1*(st.side ?? 1), sp = w*0.13*Math.max(0.5, 1 - 0.5*(st.side ?? 1)) + w*0.05;
    for(const s2 of [-1, 1]) wkEll(x, ex + s2*sp, ey, Math.max(px(0.5), w*0.045), Math.max(px(0.6), h*0.075), 0, wkCss([22, 18, 26], 0.9)); } }
// A STRIDER (docs/prior-art/ringworld-magic-creatures.md §2): the magic world's tall runner of the open country, a bird
// as an emu is: some two metres tall, a deep body under shaggy plumes, a long bare neck, a small head with a short beak
// and a fan of plumes on its crown, little wings, a plumed tail; long bare legs that never straighten, two toes; its
// plumage of its region's element. Walking, running with its neck stretched forward, its head down to feed, sitting to rest
function wkStrider(x, X, Y, m, st, c, px){
  const K = WK_KINDS.striders, H = K.size*m, d = st.dir || 1, sk = Math.max(0.35, st.side ?? 1), lie = st.lie || 0, run = st.pose === 'run', walk = st.pose === 'walk', ph = st.ph*Math.PI*2;
  const pl = c.mat(wkMix(K.coat, c.glow || K.coat, 0.45)), skin = c.mat([118, 136, 168]), leg = c.mat([96, 84, 72]), lift = st.y*m;
  if(H < px(2.5)){ x.fillStyle = wkCss(pl.dark); x.fillRect(X - px(0.8), Y - lift - H*0.7, px(1.6), H*0.5); return; }
  const hip = H*0.5*(1 - 0.72*lie), bl = H*(0.18 + 0.26*sk), bh = H*0.27, by = Y - lift - hip - bh*0.2, lw = Math.max(px(0.5), H*0.028), q = u => X + d*u*bl;
  // (its legs: the shin hidden in the body, the ankle bent back, the long bare foot forward; one swinging as the other bears)
  if(lie < 0.6) for(const [o, far] of [[0, true], [Math.PI, false]]){ const sw = run ? Math.sin(ph + o)*0.75 : walk ? Math.sin(ph + o)*0.42 : 0, up = (run || walk) ? Math.max(0, Math.cos(ph + o))*H*(run ? 0.08 : 0.04) : 0;
    const top = [q(far ? -0.14 : 0.04), by + bh*0.3], ft = [top[0] + d*Math.sin(sw)*H*0.32, Y - lift - up], ank = [(top[0] + ft[0])/2 - d*H*0.07, (top[1] + ft[1])/2 + H*0.02], col = wkCss(far ? wkMix(leg.dark, [0, 0, 0], 0.3) : leg.dark);
    wkLine(x, [top, ank, ft], col, lw*(far ? 1 : 1.15)); if(H > px(12)) wkLine(x, [ft, [ft[0] + d*H*0.06, ft[1]]], col, lw); }
  // (its tail plume, its body under shaggy plumes, a little wing; lit along its back)
  wkEll(x, q(-0.55), by - bh*0.12, bl*0.28, bh*0.3, -d*0.5, wkCss(pl.dark));
  wkEll(x, X, by, bl*0.55, bh*0.5, 0, wkCss(pl.body));
  if(H > px(14)){ x.strokeStyle = wkCss(pl.dark, 0.8); x.lineWidth = Math.max(px(0.4), H*0.012); x.beginPath(); for(let k = 0; k < 9; k++){ const u = -0.45 + 0.9*k/8, bx = q(u), byy = by + bh*0.42*Math.sqrt(Math.max(0, 1 - u*u*1.6)); x.moveTo(bx, byy - bh*0.1); x.lineTo(bx - d*H*0.012, byy + bh*0.18); } x.stroke(); }
  if(H > px(6)) wkEll(x, q(-0.05), by - bh*0.28, bl*0.42, bh*0.16, 0, wkCss(pl.lit, 0.55));
  wkEll(x, q(0.02), by - bh*0.02, bl*0.2, bh*0.2, -d*0.3, wkCss(wkMix(pl.body, pl.dark, 0.5)));
  // (its neck and head: up and looking round; forward as it runs; down to the ground as it feeds)
  const hd = Math.max(0, Math.min(1, st.head ?? 1)), base = [q(0.42), by - bh*0.15], low = [q(0.75), Y - lift - H*0.06], high = [q(run ? 0.85 : 0.55), Y - lift - H*(run ? 0.78 : 0.95)*(1 - 0.35*lie) ];
  const head = st.pose === 'graze' ? [low[0] + (high[0] - low[0])*hd, low[1] + (high[1] - low[1])*hd] : high, mid = [(base[0] + head[0])/2 + d*H*0.04, (base[1] + head[1])/2];
  wkLine(x, [base, mid, head], wkCss(skin.body), Math.max(px(0.6), H*0.05));
  wkEll(x, head[0], head[1], H*0.05, H*0.04, 0, wkCss(skin.body));
  wkPolyF(x, [[head[0] + d*H*0.035, head[1] - H*0.012], [head[0] + d*H*0.1, head[1] + H*0.004], [head[0] + d*H*0.035, head[1] + H*0.016]], wkCss(leg.dark));
  if(H > px(10)){ wkEll(x, head[0] + d*H*0.015, head[1] - H*0.008, Math.max(px(0.4), H*0.008), Math.max(px(0.4), H*0.008), 0, wkCss([16, 14, 18]));
    x.strokeStyle = wkCss(pl.lit); x.lineWidth = Math.max(px(0.4), H*0.012); x.beginPath(); for(let k = 0; k < 4; k++){ const an = -Math.PI/2 - d*(0.35 + 0.28*k); x.moveTo(head[0] - d*H*0.01, head[1] - H*0.03); x.lineTo(head[0] - d*H*0.01 + Math.cos(an)*H*0.09, head[1] - H*0.03 + Math.sin(an)*H*0.09); } x.stroke(); } }
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
    if(K.way === 'wade'){ const hgt = K.size*m, by = Y - hgt*0.62; wkLine(x, [[X - d*b*0.05, Y], [X, by]], ink, Math.max(px(0.4), hgt*0.02)); wkLine(x, [[X + d*b*0.08, Y], [X + d*b*0.02, by]], ink, Math.max(px(0.4), hgt*0.02));
      wkEll(x, X, by - hgt*0.08, hgt*0.17, hgt*0.1, -d*0.5, wkCss(col.body)); const strike = st.head, nk = [[X + d*hgt*0.1, by - hgt*0.12], [X + d*hgt*(0.04 + 0.22*strike), by - hgt*(0.3 - 0.05*strike)], [X + d*hgt*(0.12 + 0.3*strike), by - hgt*(0.36 - 0.1*strike)]];
      wkLine(x, nk, wkCss(col.lit), Math.max(px(0.5), hgt*0.04)); const hx = nk[2][0], hy = nk[2][1]; wkLine(x, [[hx, hy], [hx + d*hgt*0.16, hy + hgt*0.02*(1 + strike)]], wkCss(K.bill || [196, 168, 80]), Math.max(px(0.4), hgt*0.022));
      if(hgt > px(14)) wkLine(x, [[hx - d*hgt*0.02, hy - hgt*0.01], [hx - d*hgt*0.12, hy - hgt*0.01]], ink, Math.max(px(0.3), hgt*0.012)); return; }
    if(K.breast || K.patch || K.tail) return wkSongbirdDown(x, X, y, b, d, bob, K, c, col, st, px);
    const by = y - b*0.55; wkEll(x, X, by, b*0.5, b*0.26, -d*0.25, wkCss(col.body));
    if(st.flick && b > px(3)) for(const s2 of [-1, 1]) wkPolyF(x, [[X - d*b*0.1, by - b*0.1], [X - d*b*0.45, by - b*(0.55 + 0.15*s2)], [X + d*b*0.15, by - b*0.2]], wkCss(s2 > 0 ? col.dark : col.body)); wkLine(x, [[X - d*b*0.42, by + b*0.04], [X - d*b*0.8, by + b*0.12]], wkCss(col.body), Math.max(px(0.4), b*0.14));
    wkEll(x, X + d*b*0.42, by - b*0.2 + bob*b*0.5, b*0.16, b*0.14, 0, wkCss(col.body)); if(b > px(5)) wkLine(x, [[X + d*b*0.56, by - b*0.2 + bob*b*0.5], [X + d*b*0.72, by - b*0.16 + bob*b*0.6]], ink, Math.max(px(0.3), b*0.06));
    if(b > px(3)) wkLine(x, [[X, by + b*0.2], [X + d*b*0.04, y]], ink, Math.max(px(0.3), b*0.04)); return; }
  // in the air
  const wader = K.way === 'wade';
  if(kind === 'owls') return wkOwl(x, X, y, S, st, c, col, px);
  if(kind === 'kestrel') return wkKestrel(x, X, y, S, d, st, c, col, px);
  if(kind === 'raptor' || (wader && st.pose === 'fly')){ const span = (wader ? 1.7*K.size/0.95 : K.size)*m, fl = st.pose === 'fly' ? Math.sin(st.ph*Math.PI*2)*0.35 : st.pose === 'soar' ? 0.06 + 0.04*Math.sin(st.ph) : 0.02;
    // (a broad plank of wing, bowed, its tips fingered; the tail fanned; seen from below as it circles)
    const ws = span*0.5, cw = span*0.09, tip = sg => [X + sg*ws, y - span*fl*0.6];
    wkPolyF(x, [[X - cw*0.6, y - cw*0.2], tip(-1), [X - ws*0.95, y + cw*0.5], [X, y + cw*0.7], [X + ws*0.95, y + cw*0.5], tip(1), [X + cw*0.6, y - cw*0.2]], wkCss(wader ? col.body : col.dark));
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
  if(K.breast || K.patch || K.tail) return wkSongbirdUp(x, X, y, S, d, fl, K, c, col, px);
  // (a flushed flock: rooks, pigeons, starlings, sparrows; a pale underwing on a pigeon as it turns)
  const under = kind === 'pigeons' ? wkCss(col.lit) : ink; wkEll(x, X, y, sp*0.22, sp*0.11, -d*0.2, wkCss(col.body));
  wkLine(x, [[X - sp, y - sp*fl*0.7], [X - sp*0.45, y - sp*(0.25 + fl*0.35)], [X, y]], under, w); wkLine(x, [[X, y], [X + sp*0.45, y - sp*(0.25 + fl*0.35)], [X + sp, y - sp*fl*0.7]], ink, w);
}

// A SONGBIRD BY ITS FIELD MARKS (Ruby: "diversity of birds (and colors, shading, etc)"): its body shaded round (lit
//  above toward the light, its breast's colour under it, a darker belly edge), its wing folded with its patch (a jay's
//  blue, a goldfinch's yellow bar, a magpie's white shoulder), its tail by its length (a magpie's and a parakeet's
//  long), its face (a robin's orange, a goldfinch's red), its bill; on the ground, or beating in the air
function wkSongbirdDown(x, X, y, b, d, bob, K, c, col, st, px){
  const wing = c.mat(K.wing || K.coat), br = c.mat(K.breast || K.coat), by = y - b*0.55, tl = K.tail || 0.6, gl = K.gloss ? c.mat(K.gloss) : null;
  wkLine(x, [[X - d*b*0.38, by - b*0.02], [X - d*b*(0.38 + 0.55*tl), by - b*(0.06 + 0.1*tl)]], wkCss(K.tail ? wing.dark : col.body), Math.max(px(0.4), b*0.13));   // its tail, cocked
  if(gl && b > px(4)) wkLine(x, [[X - d*b*0.42, by - b*0.04], [X - d*b*(0.4 + 0.5*tl), by - b*(0.07 + 0.1*tl)]], wkCss(gl.lit, 0.6), Math.max(px(0.3), b*0.05));
  wkEll(x, X, by, b*0.5, b*0.27, -d*0.25, wkCss(col.dark));                                          // the body, its shade
  wkEll(x, X + d*b*0.04, by - b*0.04, b*0.44, b*0.21, -d*0.25, wkCss(col.body));
  wkEll(x, X + d*b*0.16, by + b*0.06, b*0.26, b*0.16, -d*0.1, wkCss(br.body));                    // the breast
  wkEll(x, X - d*b*0.06, by - b*0.08, b*0.3, b*0.13, -d*0.3, wkCss(wing.body));                   // the folded wing
  if(K.patch) wkEll(x, X + d*b*0.02, by - b*0.06, b*0.12, b*0.07, -d*0.3, wkCss(c.mat(K.patch).lit));
  if(st.flick && b > px(3)) for(const s2 of [-1, 1]) wkPolyF(x, [[X - d*b*0.1, by - b*0.1], [X - d*b*0.45, by - b*(0.55 + 0.15*s2)], [X + d*b*0.15, by - b*0.2]], wkCss(s2 > 0 ? wing.dark : wing.body));
  wkEll(x, X + d*b*0.1, by - b*0.2, b*0.3, b*0.06, -d*0.25, wkCss(col.lit, 0.55));               // the light along its back
  const hx = X + d*b*0.42, hy = by - b*0.2 + bob*b*0.5; wkEll(x, hx, hy, b*0.17, b*0.15, 0, wkCss(col.body));
  if(K.face) wkEll(x, hx + d*b*0.05, hy + b*0.03, b*0.1, b*0.09, 0, wkCss(c.mat(K.face).body));
  if(b > px(4)){ wkLine(x, [[hx + d*b*0.15, hy], [hx + d*b*0.3, hy + b*0.04 + bob*b*0.1]], wkCss(c.mat(K.bill || [52, 46, 42]).body), Math.max(px(0.3), b*0.06));
    wkEll(x, hx + d*b*0.06, hy - b*0.03, b*0.025, b*0.025, 0, wkCss([12, 12, 14])); }
  if(b > px(3)) wkLine(x, [[X, by + b*0.2], [X + d*b*0.04, y]], wkCss(wing.dark), Math.max(px(0.3), b*0.04)); }
function wkSongbirdUp(x, X, y, S, d, fl, K, c, col, px){
  const wing = c.mat(K.wing || K.coat), br = c.mat(K.breast || K.coat), sp = S*0.5, tl = K.tail || 0.6, w = Math.max(px(0.5), S*0.09);
  // (the wings: from the shoulder out to the tip, each a broad stroke of its colour, its patch near the shoulder, its
  //  tip darker; the far wing first, in shade)
  const wingAt = (sg, near) => { const tipY = y - sp*fl*0.7, mid = [X + sg*sp*0.45, y - sp*(0.22 + fl*0.32)], tip = [X + sg*sp, tipY];
    wkPolyF(x, [[X - d*sp*0.05, y - sp*0.04], mid, tip, [X + sg*sp*0.55, y - sp*(0.12 + fl*0.2)], [X + d*sp*0.08, y + sp*0.02]], wkCss(near ? wing.body : wing.dark));
    wkLine(x, [mid, tip], wkCss(wing.dark), w*0.8);
    if(K.patch && S > px(4)) wkLine(x, [[X + sg*sp*0.12, y - sp*(0.06 + fl*0.1)], [X + sg*sp*0.36, y - sp*(0.18 + fl*0.26)]], wkCss(c.mat(K.patch).lit), w*1.1); };
  wingAt(-d, false);
  wkLine(x, [[X - d*sp*0.2, y + sp*0.02], [X - d*sp*(0.3 + 0.5*tl), y + sp*0.06]], wkCss(K.tail ? wing.dark : col.body), Math.max(px(0.4), S*(K.tail ? 0.07 : 0.1)));   // the tail streaming behind
  wkEll(x, X, y, sp*0.26, sp*0.12, -d*0.15, wkCss(col.body));                                     // the body
  wkEll(x, X + d*sp*0.04, y + sp*0.04, sp*0.18, sp*0.07, -d*0.1, wkCss(br.body));                 // its breast below
  wkEll(x, X - d*sp*0.02, y - sp*0.05, sp*0.16, sp*0.04, -d*0.15, wkCss(col.lit, 0.6));           // the light on its back
  const hx = X + d*sp*0.3, hy = y - sp*0.03; wkEll(x, hx, hy, sp*0.1, sp*0.09, 0, wkCss(K.face ? c.mat(K.face).body : col.body));
  if(S > px(5)) wkLine(x, [[hx + d*sp*0.08, hy], [hx + d*sp*0.17, hy + sp*0.02]], wkCss(c.mat(K.bill || [52, 46, 42]).body), Math.max(px(0.3), S*0.04));
  wingAt(d, true); }

// AN OWL quartering: glides between short runs of deep, slow beats, its broad round-tipped wings held level, pale
// beneath, a big round head with its pale face disc, a short tail; seen from below as it turns
function wkOwl(x, X, y, S, st, c, col, px){
  const K = WK_KINDS.owls, run = 0.5 + 0.5*Math.sin(st.ph*Math.PI*2/6), fl = Math.sin(st.ph*Math.PI*2)*0.4*wkSmooth((run - 0.35)/0.3), sp = S*0.5, ch = S*0.17, face = c.mat(K.face);
  for(const sg of [-1, 1]){ const lift = sp*fl*0.5;
    wkPolyF(x, [[X, y - ch*0.35], [X + sg*sp*0.5, y - lift*0.5 - ch*0.3], [X + sg*sp*0.96, y - lift], [X + sg*sp*0.9, y - lift + ch*0.55], [X + sg*sp*0.45, y - lift*0.45 + ch*0.7], [X, y + ch*0.45]], wkCss(col.body));
    wkPolyF(x, [[X, y - ch*0.2], [X + sg*sp*0.5, y - lift*0.5 - ch*0.1], [X + sg*sp*0.48, y - lift*0.45 + ch*0.6], [X, y + ch*0.4]], wkCss(face.body, 0.85));
    if(S > px(10)) for(let k = 0; k < 3; k++) wkLine(x, [[X + sg*sp*(0.66 + k*0.1), y - lift*(0.7 + k*0.1) - ch*0.15], [X + sg*sp*(0.64 + k*0.1), y - lift*(0.7 + k*0.1) + ch*0.45]], wkCss(col.dark, 0.6), Math.max(px(0.3), ch*0.08)); }
  wkEll(x, X, y + ch*0.1, ch*0.5, ch*0.8, 0, wkCss(face.body));
  wkPolyF(x, [[X - ch*0.35, y + ch*0.7], [X - ch*0.45, y + ch*1.25], [X + ch*0.45, y + ch*1.25], [X + ch*0.35, y + ch*0.7]], wkCss(col.body));
  wkEll(x, X, y - ch*0.6, ch*0.56, ch*0.5, 0, wkCss(col.body)); wkEll(x, X, y - ch*0.56, ch*0.42, ch*0.38, 0, wkCss(face.body));
  if(S > px(12)) for(const e of [-1, 1]) wkEll(x, X + e*ch*0.16, y - ch*0.6, Math.max(px(0.3), ch*0.07), Math.max(px(0.3), ch*0.07), 0, wkCss([18, 14, 12])); }
// A KESTREL: hanging on the wind, its body tipped up, its tail fanned down, its pointed wings beating fast above it and
// its head still; with its wings half shut as it drops; gliding on, a narrow pointed plank with a long tail
function wkKestrel(x, X, y, S, d, st, c, col, px){
  const K = WK_KINDS.kestrel, head = c.mat(K.head), fl = Math.sin(st.ph*Math.PI*2), ink = wkCss(col.dark);
  if(st.pose === 'glide'){ const ws = S*0.5, cw = S*0.07;
    for(const sg of [-1, 1]) wkPolyF(x, [[X, y - cw*0.4], [X + sg*ws*0.45, y - cw*0.9], [X + sg*ws, y - cw*0.2], [X + sg*ws*0.4, y + cw*0.6], [X, y + cw*0.5]], wkCss(sg === d ? col.body : col.dark));
    wkPolyF(x, [[X - cw*0.35, y + cw*0.4], [X - cw*0.5, y + cw*3.6], [X + cw*0.5, y + cw*3.6], [X + cw*0.35, y + cw*0.4]], wkCss(head.body));
    wkEll(x, X, y - cw*0.6, cw*0.6, cw*0.6, 0, wkCss(head.body)); return; }
  const shut = st.pose === 'stoop' ? 0.45 : 1, sh = [X + d*S*0.02, y - S*0.05];
  wkPolyF(x, [[X - d*S*0.06, y + S*0.04], [X - d*S*0.2, y + S*0.36], [X - d*S*0.04, y + S*0.4], [X + d*S*0.03, y + S*0.06]], wkCss(head.body));
  if(S > px(10)) wkLine(x, [[X - d*S*0.19, y + S*0.33], [X - d*S*0.04, y + S*0.37]], ink, Math.max(px(0.3), S*0.03));
  for(const sg of [-1, 1]){ const tip = [X + sg*S*0.46*shut, y - S*(0.16 + 0.2*fl*shut)*shut - S*0.1*(1 - shut)];
    wkPolyF(x, [sh, [X + sg*S*0.22*shut, y - S*(0.2 + 0.1*fl)*shut], tip, [X + sg*S*0.16*shut, y + S*0.02]], wkCss(sg === d ? col.body : wkMix(col.body, col.dark, 0.5)));
    if(S > px(8)) wkLine(x, [[X + sg*S*0.3*shut, y - S*(0.16 + 0.14*fl)*shut], tip], ink, Math.max(px(0.3), S*0.035)); }
  wkEll(x, X, y, S*0.07, S*0.16, -d*0.5, wkCss(col.body)); if(S > px(6)) wkEll(x, X + d*S*0.03, y + S*0.02, S*0.04, S*0.1, -d*0.5, wkCss(wkMix(col.lit, [240, 226, 200], 0.5)));
  wkEll(x, X + d*S*0.08, y - S*0.15, S*0.06, S*0.055, 0, wkCss(head.body)); if(S > px(8)) wkLine(x, [[X + d*S*0.12, y - S*0.14], [X + d*S*0.15, y - S*0.12]], ink, Math.max(px(0.3), S*0.025)); }
// A DRAKE (docs/prior-art/ringworld-magic-creatures.md §3): a wyvern, two-legged and winged, soaring on a thermal as a
// raptor does. Its arm out to the wrist and three long fingers fanned behind it, the membrane between them scalloped
// along the trailing edge and a little see-through; its long neck and horned head ahead, its long tail and its spade
// behind; its hide of its region's element
function wkDrake(x, X, Y, m, st, c, px){
  const K = WK_KINDS.drakes, S = K.size*m, y = Y - st.y*m, d = st.dir || 1, gl = c.glow || K.coat, hide = c.mat(wkMix(K.coat, gl, 0.3)), mem = c.mat(wkMix(wkMix(K.coat, gl, 0.55), [255, 255, 255], 0.12));
  if(S < px(1.4)){ x.fillStyle = wkCss(hide.dark); x.fillRect(X - px(0.6), y - px(0.4), px(1.2), px(0.8)); return; }
  const fl = st.pose === 'soar' ? 0.1 + 0.05*Math.sin(st.ph) : st.pose === 'glide' ? 0.04 : Math.sin(st.ph*Math.PI*2)*0.4, ws = S*0.5, ch = S*0.08, lw = Math.max(px(0.4), ch*0.25);
  const mixP = (p, q2, t) => [p[0] + (q2[0] - p[0])*t, p[1] + (q2[1] - p[1])*t];
  for(const sg of [-d, d]){ const sh = [X + d*ch*0.4, y - ch*0.2], wr = [X + sg*ws*0.42, y - ws*fl*0.8 - ch*1.1], root = [X - d*ch*0.9, y + ch*0.4];
    const fs = [0.98, 0.8, 0.58].map((r, k) => [X + sg*ws*r, y - ws*fl*(0.95 - k*0.25) + ch*(k*1.6 - 0.4)]), sc = (p, q2) => mixP(mixP(p, q2, 0.5), wr, 0.22);
    wkPolyF(x, [sh, wr, fs[0], sc(fs[0], fs[1]), fs[1], sc(fs[1], fs[2]), fs[2], mixP(mixP(fs[2], root, 0.5), wr, 0.18), root], wkCss(sg === d ? mem.body : mem.dark, 0.9));
    wkLine(x, [sh, wr], wkCss(hide.body), lw*1.5); if(S > px(8)) for(const f of fs) wkLine(x, [wr, f], wkCss(hide.dark), lw); }
  x.lineCap = 'round';
  wkLine(x, [[X - d*ch*1.2, y + ch*0.1], [X - d*ch*3.6, y + ch*0.9], [X - d*ch*5.6, y + ch*0.4]], wkCss(hide.body), Math.max(px(0.4), ch*0.45));
  if(S > px(6)){ const te = [X - d*ch*5.6, y + ch*0.4]; wkPolyF(x, [[te[0] + d*ch*0.2, te[1] - ch*0.4], [te[0] - d*ch*0.9, te[1]], [te[0] + d*ch*0.2, te[1] + ch*0.4]], wkCss(hide.dark)); }
  wkEll(x, X, y, ch*1.7, ch*0.62, -d*0.08, wkCss(hide.body)); if(S > px(6)) wkEll(x, X + d*ch*0.2, y + ch*0.22, ch*1.2, ch*0.25, 0, wkCss(hide.lit, 0.6));
  const hd = [X + d*ch*3.2, y - ch*1.0]; wkLine(x, [[X + d*ch*1.3, y - ch*0.1], [X + d*ch*2.3, y - ch*0.8], hd], wkCss(hide.body), Math.max(px(0.4), ch*0.5)); x.lineCap = 'butt';
  wkPolyF(x, [[hd[0] - d*ch*0.3, hd[1] - ch*0.35], [hd[0] + d*ch*1.1, hd[1] + ch*0.05], [hd[0] - d*ch*0.2, hd[1] + ch*0.35]], wkCss(hide.body));
  if(S > px(10)) wkLine(x, [[hd[0] - d*ch*0.1, hd[1] - ch*0.3], [hd[0] - d*ch*0.8, hd[1] - ch*0.9]], wkCss(wkMix(hide.lit, [236, 226, 200], 0.5)), lw); }
// A SKY RAY (docs/prior-art/ringworld-magic-creatures.md §4): seen from below and to the side, high up: a broad lens of a
// body, its wings rising and falling slowly with a wave running out along them (the near one lower on the page), the
// horns of its head fins forward, a long whip of a tail behind; pale beneath, its region's light along its wings' edges
// by night, steady (never a flash)
function wkRay(x, X, Y, m, st, c, px){
  const K = WK_KINDS.skyrays, S = K.size*m, y = Y - st.y*m, d = st.dir || 1, sk = Math.max(0.2, st.side ?? 1), gl = c.glow || K.belly, nt = st.nt || 0;
  const back = c.mat(K.coat), bel = c.mat(wkMix(K.belly, gl, 0.22));
  if(S < px(1.6)){ x.fillStyle = wkCss(bel.dark); x.fillRect(X - px(0.8), y - px(0.4), px(1.6), px(0.8)); return; }
  const b = Math.sin(st.ph*Math.PI*2), b2 = Math.sin(st.ph*Math.PI*2 - 1.2), half = S*0.5, len = S*0.4*(0.5 + 0.5*sk), th = S*0.075, fore = 0.5, spr = 1 - 0.7*sk;
  const tipOf = (sg, wv) => [X + sg*half*spr*0.95 - d*len*0.15, y + sg*half*fore*sk - half*0.24*wv];
  for(const sg of [-1, 1]){ const tip = tipOf(sg, b2), mid = [X + sg*half*spr*0.5 + d*len*0.12, y + sg*half*fore*sk*0.55 - half*0.14*b];
    wkPolyF(x, [[X + d*len*0.42, y - th*0.2*sg], mid, tip, [X + sg*half*spr*0.4 - d*len*0.4, y + sg*half*fore*sk*0.4 - half*0.09*b], [X - d*len*0.48, y]], wkCss(sg > 0 ? bel.body : wkMix(bel.body, back.dark, 0.45)));
    if(nt > 0.05 && S > px(6)) for(let k = 1; k <= 4; k++){ const p = [mid[0] + (tip[0] - mid[0])*k/4.5, mid[1] + (tip[1] - mid[1])*k/4.5]; wkEll(x, p[0], p[1], Math.max(px(0.5), S*0.012), Math.max(px(0.5), S*0.012), 0, wkCss(gl, 0.6*nt)); } }
  wkEll(x, X, y, len*0.55, th, 0, wkCss(bel.lit));
  if(S > px(8)) for(const sg of [-1, 1]) wkLine(x, [[X + d*len*0.5, y + sg*th*0.5], [X + d*len*0.72, y + sg*th*0.9], [X + d*len*0.78, y + sg*th*0.3]], wkCss(back.dark), Math.max(px(0.4), th*0.4));
  wkLine(x, [[X - d*len*0.5, y], [X - d*len*1.1, y + th*0.6 + half*0.04*b], [X - d*len*1.7, y + th*0.2]], wkCss(back.dark), Math.max(px(0.3), th*0.25)); }
// A LANTERN MOTH (docs/prior-art/ringworld-magic-creatures.md §5): pale soft wings folding as they beat, and by night a
// glow round it of its region's light that breathes slowly, seconds to a breath, each its own; never a flash
function wkMoth(x, X, Y, m, st, c, px){
  const K = WK_KINDS.lanternmoths, S = Math.max(px(1.4), K.size*m), y = Y - st.y*m, gl = c.glow || [250, 222, 160], nt = st.nt || 0;
  const br = 0.75 + 0.25*Math.sin(st.ph/K.flap*Math.PI*2/3.4 + (st.hue || 0)*1.7);
  if(nt > 0.05){ const r = S*3.2, g = x.createRadialGradient(X, y, 0, X, y, r); g.addColorStop(0, wkCss(gl, 0.42*nt*br)); g.addColorStop(1, wkCss(gl, 0)); x.fillStyle = g; x.beginPath(); x.arc(X, y, r, 0, Math.PI*2); x.fill(); }
  const op = 0.3 + 0.7*Math.abs(Math.sin(st.ph*Math.PI)), wc = wkMix(c.mat(K.coat).lit, gl, 0.5*nt);
  for(const k of [-1, 1]) wkEll(x, X + k*S*0.3*op, y - S*0.08, S*0.3*op, S*0.34, k*0.5, wkCss(wc, 0.9));
  wkEll(x, X, y, S*0.06, S*0.2, 0, wkCss(wkMix(wc, gl, 0.5))); }

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
  if(K.body === 'slime') return wkSlime(x, X, Y, m, st, c, px);
  if(K.body === 'strider') return wkStrider(x, X, Y, m, st, c, px);
  if(K.body === 'drake') return wkDrake(x, X, Y, m, st, c, px);
  if(K.body === 'ray') return wkRay(x, X, Y, m, st, c, px);
  if(K.body === 'moth') return wkMoth(x, X, Y, m, st, c, px);
  if(K.body === 'hunter'){ if(K.size*m < px(1.4)){ x.fillStyle = wkCss(c.mat(K.coat).dark); x.fillRect(X - px(0.7), Y - st.y*m - px(1.2), px(1.4), px(1)); return; } return wkHunter(x, X, Y, m, kind, st, c, px); }
  if(K.way === 'walk' || K.way === 'hop' || K.way === 'prowl'){ const L = K.size*m; if(L < px(1.4)){ x.fillStyle = wkCss(c.mat(K.coat).dark); x.fillRect(X - px(0.7), Y - st.y*m - px(1.2), px(1.4), px(1)); return; } return wkQuad(x, X, Y, m, kind, st, c, px); }
  return wkBird(x, X, Y, m, kind, st, c, px);
}
