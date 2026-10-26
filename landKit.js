/**
 * landKit.js — THE LAND OF A RING: its heights, its seas and its climates, as pure functions of the seed and a place on
 * the floor (Ruby, 2026-10-25: "real landmasses and biomes by the seed, rendered with intention, with transition
 * zones; water with clear shores; nothing morphing as the camera rises or turns"; docs/prior-art/ringworld-terrain.md).
 *
 * A place is (a, z): a the angle round the ring (radians, the ring's radius 1), z across the band (ring units, the
 * band W wide, −W/2 to W/2). The land is a pure function of the seed and the place, never of the eye, so a painter, a
 * game or a test asking the height of the same place gets the same answer however it looks (Minecraft's terrain is
 * the same kind of function: docs/prior-art/ringworld-terrain.md §1). Its finest detail is asked for (fine: the size of
 * the smallest feature wanted, in ring units): a painter asks for less detail far off, and the octaves finer than that
 * are faded out, never cut. Inside, the land is worked in metres (the band is 4000 m across at any width, as the
 * Ringworld's painters measure their things), every noise of it periodic round the whole ring, so nothing seams.
 *
 * WHAT IT IS MADE OF: continents and seas from domain-warped noise (sea level by the seed: some rings mostly land, some
 * half water), a coast rising to a plain and a plateau, mountain belts of ridged noise inland, kept below the rim walls
 * (Ruby: "no mountain above the rim walls"), hills where erosion has not worn them flat, the spill mountains at the
 * walls' feet, rivers winding across the lowlands to the sea, lakes in the wet ones, canyons cut stepwise through dry
 * uplands; and a landing where the seed stands you, so you stand on land, not in a hillside. CLIMATE: warmth by the
 * seed and by region, cooled with height; moisture by region, wetter by the coasts. BIOMES: ten, by warmth and
 * moisture (Whittaker's diagram, §2), each a weight that fades into the next over a transition as wide as the Detail
 * asks, patchy at its edges as real ecotones are.
 */

// ---- THE KIT'S OWN NOISE: gradient noise in about −1..1, periodic in x with P cells (0: not periodic) ----
const LK_GX = new Float64Array(16), LK_GY = new Float64Array(16);
for(let i = 0; i < 16; i++){ LK_GX[i] = Math.cos(i*Math.PI/8); LK_GY[i] = Math.sin(i*Math.PI/8); }
export const lkHash = (x, y, s) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };
export function lkNoise(x, y, s, P){
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  let x0 = xi, x1 = xi + 1; if(P > 0){ x0 = ((x0 % P) + P) % P; x1 = ((x1 % P) + P) % P; }
  let k = lkHash(x0, yi, s) & 15; const n00 = LK_GX[k]*fx + LK_GY[k]*fy;
  k = lkHash(x1, yi, s) & 15; const n10 = LK_GX[k]*(fx - 1) + LK_GY[k]*fy;
  k = lkHash(x0, yi + 1, s) & 15; const n01 = LK_GX[k]*fx + LK_GY[k]*(fy - 1);
  k = lkHash(x1, yi + 1, s) & 15; const n11 = LK_GX[k]*(fx - 1) + LK_GY[k]*(fy - 1);
  const u = fx*fx*fx*(fx*(fx*6 - 15) + 10), v = fy*fy*fy*(fy*(fy*6 - 15) + 10);
  return 1.41*(n00 + (n10 - n00)*u + (n01 - n00)*v + (n00 - n10 - n01 + n11)*u*v);
}
const lkSmooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a)/(b - a))); return t*t*(3 - 2*t); };

// THE BIOMES (docs/prior-art/ringworld-terrain.md §2): each at its warmth and moisture on Whittaker's diagram (0 cold
// … 1 hot; 0 dry … 1 wet), and how each reads from afar (its colour, as a mix of the Land Hue toward its own ground)
export const LK_BIOMES = [
  { name: 'ice',     t: -0.05, m: 0.5,  wm: 3 },
  { name: 'tundra',  t: 0.16,  m: 0.42 },
  { name: 'taiga',   t: 0.3,   m: 0.7 },
  { name: 'meadow',  t: 0.5,   m: 0.46 },
  { name: 'forest',  t: 0.52,  m: 0.8 },
  { name: 'steppe',  t: 0.6,   m: 0.22 },
  { name: 'desert',  t: 0.86,  m: 0.04 },
  { name: 'savanna', t: 0.8,   m: 0.36 },
  { name: 'jungle',  t: 0.86,  m: 0.88 },
  { name: 'marsh',   t: 0.55,  m: 1.0 },
];
export const LK_FORESTED = { taiga: 1, forest: 1, jungle: 1, savanna: 0.16, marsh: 0.35, meadow: 0.12 };

/** THE LAND OF ONE RING. seed; o: { W, Hw (the rim walls' height), forms (Landforms 0..1), flat (relief kept in cities,
 *  0..1), terrace (the builders' step, ring units, 0 none), z0 (where across the band the seed stands you), blend (how
 *  wide the biomes' transitions, 0..1, by Detail) }. Returns { M (ring units a metre), sea (0), height(a, z, fine),
 *  climate(a, z, h) → [warmth, moisture], biomes(a, z, h) → weights by LK_BIOMES, snowline }. */
export function lkLand(seed, o){
  const s = seed | 0, W = o.W, M = W*0.00025, F = o.forms ?? 0.5, flat = o.flat ?? 1, Hwm = o.Hw/M, z0m = (o.z0 || 0)/M;
  const Cm = 2*Math.PI/M, P = wl => Math.max(1, Math.round(Cm/wl)), N = (u, v, wl, salt) => { const p = P(wl), w = Cm/p; return lkNoise(u/w, v/w, s + salt*7919, p); };
  const fbm = (u, v, wl, oct, salt, g = 0.5) => { let t = 0, a = 1, n = 0; for(let k = 0; k < oct; k++){ t += a*N(u, v, wl, salt + k*13); n += a; a *= g; wl *= 0.5; } return t/n; };
  const ridged = (u, v, wl, oct, salt) => { let t = 0, a = 1, n = 0, w = 1; for(let k = 0; k < oct; k++){ const r = 1 - Math.abs(N(u, v, wl, salt + k*17)); const q = r*r*w; t += a*q; n += a; w = Math.min(1, q*1.6); a *= 0.5; wl *= 0.5; } return t/n; };
  // the seed's own sea (a fraction of the floor under water) and warmth
  const wet = 0.08 + 0.4*(lkHash(s, 11, 4041)/4294967296), t0 = (wet - 0.5)*0.75, warm = 0.22 + 0.62*(lkHash(s, 12, 4041)/4294967296);
  // (how rugged the seed's land is: some rings rolling, some all crags and cliffs)
  const rug = 0.6 + 1.0*(lkHash(s, 13, 4041)/4294967296);
  // (how wet the seed's ring is on the whole: some rings green, some dry country and desert)
  const arid = 0.5*(lkHash(s, 14, 4041)/4294967296) - 0.25;
  const capM = Hwm*0.86;   // (no mountain above the rim walls: peaks eased under this)
  // (how tall the land's steps stand: some rings in low shelves, some in tall ones, taller where Landforms is high)
  const stepM = (13 + 15*(lkHash(s, 15, 4041)/4294967296))*(0.6 + 0.8*F);
  // (the lapse rate: warmth lost a metre up, so strong that a ring's hills show their zones, woods giving way to tundra,
  //  and the high ranges stand white over the plains: the snowline some 250 to 800 m up by the seed's warmth)
  const LAPSE = 1.15/1000;
  // (the raw land in metres, and the parts the climate and the colours read: s, how far inland; dryness of the region)
  const raw = (u, v, fineM) => {
    const wu = 1800*fbm(u, v, 7000, 2, 1), wv = 1800*fbm(u, v, 7000, 2, 2);
    let C = fbm(u + wu, v + wv, 11000, 4, 3); const dl = Math.hypot(u - Cm*Math.round(u/Cm), v - z0m)/1400; C += 0.1*Math.exp(-dl*dl);
    const sc = C - t0;
    const land = lkSmooth(-0.04, 0.12, sc);
    let h = sc <= 0 ? -(3 + 120*lkSmooth(0, 0.35, -sc)) : 2 + 110*sc + 200*lkSmooth(0.2, 0.9, sc)*(0.4 + F);
    const er = lkSmooth(-0.1, 0.4, fbm(u, v, 9000, 2, 4));   // (worn flat: 1)
    const belt = lkSmooth(-0.15, 0.35, fbm(u + wu*0.5, v, 16000, 2, 5) + 0.3*(F - 0.5) + 0.25*(rug - 1))*lkSmooth(0.02, 0.3, sc)*(1 - 0.7*er);
    let relief = belt > 0.002 ? capM*belt*Math.pow(ridged(u, v, 3200, 5, 6), 1.7)*(0.45 + 0.9*F)*rug : 0;
    // (the hills: rolling where the land is worn, crested and folded where it is not, so ridge stands behind ridge)
    relief += (1 - 0.4*er)*rug*(0.35 + F)*(260*fbm(u, v, 1800, 4, 7) + 230*(ridged(u + wv*0.3, v + wu*0.3, 2400, 3, 15) - 0.3))*lkSmooth(-0.02, 0.12, sc);
    // (escarpments: in some regions the land steps up in long cliffs, a plateau's edge, a drop to the plain below)
    const escR = lkSmooth(0.05, 0.45, fbm(u, v, 20000, 2, 14) + 0.2*(rug - 1));
    if(escR > 0.002) relief += (30 + 120*F)*rug*escR*lkSmooth(0.44, 0.56, 0.5 + 0.5*N(u + wu, v + wv, 5200, 13))*lkSmooth(0.02, 0.2, sc);
    // (the fine octaves, down to the detail asked for, the last fading in over its own size)
    for(let wl = 380, k = 0; wl >= fineM*0.85 && k < 12; wl *= 0.5, k++){ const fade = lkSmooth(fineM*0.85, fineM*1.7, wl); relief += fade*0.075*wl*(0.4 + F)*(0.3 + 0.7*land)*N(u, v, wl, 40 + k); }
    h += relief*flat;
    // (the spill mountains at the walls' feet)
    const av = Math.abs(v); if(av > 1100) h += Hwm*0.42*F*lkSmooth(1100, 2000, av)*(0.3 + 0.7*(0.5 + 0.5*N(u, 2.7, 720, 8)));
    // (canyons cut stepwise through the dry uplands; rivers across the lowlands to the sea; lakes in the wet ones)
    const dryR = 0.5 - 0.5*fbm(u, v, 18000, 2, 12);
    if(dryR > 0.55 && sc > 0.12){ const ch = lkSmooth(0.93, 0.985, 1 - Math.abs(N(u + wu, v + wv, 2600, 9))), g = ch*lkSmooth(0.55, 0.75, dryR)*lkSmooth(0.12, 0.35, sc);
      if(g > 0.002){ const q = (40 + 150*F)*g/16, f = q - Math.floor(q); h -= (Math.floor(q) + lkSmooth(0.65, 1, f))*16; } }
    const low = 1 - lkSmooth(25, 110, h);
    // (a river: a broad soft valley where the land is low, and the water's own channel down its middle where it is lowest)
    if(low > 0.002 && sc > -0.02){ const r = 1 - Math.abs(N(u + wu*1.3, v + wv*1.3, 6000, 10)), vf = lkSmooth(0.9, 0.99, r)*Math.min(1, low*1.5);
      if(vf > 0){ h -= Math.min(Math.max(0, h)*0.6, 30)*vf; const rv = lkSmooth(0.972, 0.992, r)*lkSmooth(0.45, 0.85, low); if(rv > 0) h += (-2.5 - h)*rv; } }
    if(low > 0.002 && dryR < 0.5){ const lk = lkSmooth(0.5, 0.62, 0.5 + 0.5*N(u, v, 2400, 11))*low*lkSmooth(0.5, 0.35, dryR); if(lk > 0) h += (-4 - h)*lk; }
    // STEPS (Ruby, 2026-10-25: "more steps and ridgelines so we can kinda nail the look of the original, even if that is
    // sort of 'unrealistic' terrain"): the land laid in shelves, each a broad level ending in a short rise to the next, as
    // the first painted ring stood ridge behind ridge; the shelves' edges wandering, some regions more stepped than
    // others, the highest crags left to their own ridges; and read only as finely as the land is asked for, so a far
    // coarse ring never aliases them into noise
    if(h > 2){ const St = stepM*(0.75 + 0.5*(0.5 + 0.5*N(u, v, 14000, 33))), tm = (0.55 + 0.45*lkSmooth(-0.25, 0.25, fbm(u, v, 9000, 2, 31)))*lkSmooth(2, 12, h)*(1 - 0.6*lkSmooth(350, 1000, h))*(1 - lkSmooth(St*3, St*14, fineM))*flat;
      if(tm > 0.01){ const J = St*0.45*N(u + wv, v + wu, 700, 32), q = (h + J)/St, f = q - Math.floor(q); h += ((Math.floor(q) + lkSmooth(0.82, 1, f))*St - J - h)*tm; } }
    // (no mountain above the walls: a soft ceiling)
    if(h > capM - 200){ const k2 = 80; h = capM - k2*Math.log1p(Math.exp((capM - h)/k2)); }
    return h;
  };
  // THE LANDING: where the seed stands you, the land kept gentle within 120 m and lifted clear of any water
  const h0 = raw(0, z0m, 2), lift = Math.max(0, 7 - h0);
  const heightM = (u, v, fineM) => { let h = raw(u, v, fineM); const d = Math.hypot(u - Cm*Math.round(u/Cm), v - z0m);
    if(d < 1600){ if(lift > 0) h += lift*Math.exp(-(d/520)*(d/520)); const hs = h0 + lift; if(d < 160) h = hs + (h - hs)*(0.25 + 0.75*lkSmooth(0, 140, d)); }
    // (the lowest step kept a little above the water, a bank rising to its first shelf: levelled flat to the sea's own
    //  height it would read as dry land to the painter and as water to what is sown, ducks and jetties on the sand)
    if(o.terrace && h > 0){ const st = o.terrace/M, q = h/st, f = q - Math.floor(q), t = (Math.floor(q) + lkSmooth(0.7, 1, f))*st; h = q < 1 ? Math.max(h*0.35, t) : t; }
    return h; };
  const height = (a, z, fine) => heightM(a/M, z/M, Math.max(0.5, (fine || W*0.001)/M))*M;
  // CLIMATE at a place of height h (ring units): warmth by the seed and the region, a little patchy, cooled with
  // height (the lapse rate, made stronger than Earth's so a ring's hills show a treeline); moisture by the region,
  // wetter by the coasts (both 0..1)
  const climate = (a, z, h) => { const u = a/M, v = z/M, hm = h/M;
    const t = warm + 0.2*fbm(u, v, 40000, 2, 21) + 0.05*N(u, v, 2300, 23) - LAPSE*Math.max(0, hm);
    const coast = hm < 40 ? 0.18*(1 - lkSmooth(0, 40, hm)) : 0;
    const m = 0.5 + arid + 1.7*fbm(u, v, 18000, 2, 12) + 0.06*N(u, v, 1900, 24) + coast;
    return [t, Math.max(0, Math.min(1, m))]; };
  // THE BIOMES' WEIGHTS at a place (summing to 1): near on the diagram, heavier; the transition as wide as blend asks
  const sg = 0.06 + 0.07*(o.blend ?? 0.5);
  const biomes = (a, z, h) => { const [t, m] = climate(a, z, h), w = new Float64Array(LK_BIOMES.length); let n = 0;
    const lowWet = 1 - lkSmooth(4*M, 30*M, h);
    for(let i = 0; i < LK_BIOMES.length; i++){ const b = LK_BIOMES[i], dt = (t - b.t)/sg, dm = (m - b.m)/(sg*(b.wm || 1.4));
      let v = Math.exp(-(dt*dt + dm*dm)); if(b.name === 'marsh') v *= lowWet; w[i] = v; n += v; }
    for(let i = 0; i < w.length; i++) w[i] /= n || 1; return w; };
  // the snowline: where warmth falls under freezing (ice's own warmth plus a little)
  const snowline = Math.max(150, (warm + 0.06)/LAPSE)*M;
  return { M, sea: 0, height, climate, biomes, snowline, wet, warm, rug };
}
