/**
 * stepsGenerative.js — PARTS THAT GROW: generative processes, simulated, then
 * laid on a real material and lit (Ruby: between "the simplest pattern" and
 * "an entire scene" — the medium-effort textures: generative, structured,
 * lit, made of a material).
 *
 *   discharge  DISCHARGE: a Lichtenberg figure — the branching path electricity
 *              burns through an insulator — grown by the dielectric breakdown
 *              model (Niemeyer, Pietronero & Wiesmann 1984) in the fast,
 *              grid-free form of Kim, Sewall & Lin ("Fast simulation of
 *              Laplacian growth", 2007): each new step of the channel is a point
 *              charge; a neighbour of the channel is chosen with probability
 *              ∝ (its normalised potential)^η, so a low η branches bushily and a
 *              high one strikes thin and straight. One pole, or two or three
 *              that grow toward each other and meet (fractal burning: wood
 *              between two electrodes). Its trunk is thick where the most
 *              current ran (the branches beyond it), its twigs hairlines.
 *   wood       WOOD: a plank — growth rings round a pith far off the page, early
 *              and late wood, fibres along the grain — as a picture and heights.
 *   burn       BURN: any gray map of channels laid into a picture as a burn —
 *              charred and sunken in wood, still glowing as embers, or lit from
 *              inside a block of clear acrylic — with the picture's heights.
 *   traces     CIRCUIT TRACES: a circuit board routed as boards are by hand —
 *              chips and their pins, then buses of parallel traces that run
 *              straight and turn together (45° chamfers, or Factorio's 90°
 *              corners), ending in vias and pads — with each trace's own grey
 *              (so a cutoff can power some and not others), data running along
 *              them, the pads, the parts and their silkscreen.
 *   growline   GROWING LINE: differential growth (Anders Hoff's "differential
 *              line"; Nervous System's Floraform in a plane): a closed line whose
 *              points push each other apart, follow their neighbours and split
 *              where they stretch, so it ruffles and folds like a lettuce leaf or
 *              brain coral. The dial is the sun it grows toward (phototropism).
 *
 * The simulations run in page units on a lattice of their own, the same at
 * any size, so a preview is the export, smaller. Their randomness is the
 * texture's seed (+ Variant), like the other parts that grow.
 */
import { CPU, withSeed, kitCanvas, makeNoiseGrid, sampleNoiseGrid, lightVec } from './texCore.js';

const GEN_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const genClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
const genSeed = (E, n) => ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
// the dial (a wired value 0..1, else the page's own) as an angle, and the unit vector toward its handle
const genDial = (E, n, port) => { const v = E.input(n, port), deg = typeof v === 'number' ? v*360 : (E.ctx.light ?? 315), a = (deg - 90)*Math.PI/180; return { deg, x: Math.cos(a), y: Math.sin(a) }; };

// ---------------- THE GROUND CAMERA ----------------
// (Ruby: "change the fov of the lens and allow rotating or tracking around".) A part that draws a world lying on the
// page (a plank, a figure burned into it) sees it through a pinhole camera: Turn spins the ground about the page's
// middle, View tips its top away, so the far ground runs off toward a horizon above the page (never onto it), the
// near ground comes closer, and the lens is as far off as 1.1 of the page's long side. Turn 0 and View 0: no camera
// (null), the page exactly as it was. Everything in page units (the short side is 1).
export function groundCam(aspX, aspY, turn, view, zoom = 100){
  const th = (+turn || 0)*Math.PI/180, v = Math.max(0, Math.min(100, +view || 0))/100, Z = Math.max(0.25, Math.min(4, (+zoom || 100)/100));
  if(v < 1e-6 && Math.abs(Math.sin(th)) < 1e-9 && Math.cos(th) > 0 && Math.abs(Z - 1) < 1e-9) return null;
  const cx = aspX/2, cy = aspY/2, ct = Math.cos(th), st = Math.sin(th), d = 1.1*Math.max(aspX, aspY);
  // (the ZOOM is the lens: the picture magnified about the page's middle; zoomed out, the tip stops short so the horizon
  //  stays above the page's top)
  const phi = v*Math.min(1.2, Math.atan(0.9*2*d*Math.min(1, Z)/aspY)), cp = Math.cos(phi), sp = Math.sin(phi);
  return {
    // a point of the ground → where it shows, and how much it is magnified there (null: behind the lens)
    toScreen(gx, gy){ const X = gx - cx, Y = gy - cy, xr = X*ct - Y*st, yr = X*st + Y*ct, z = d - yr*sp;
      if(z <= 1e-6) return null; const k = d/z; return [cx + xr*k*Z, cy + yr*cp*k*Z, k*Z]; },
    // a point of the screen → the ground seen there, its magnification, and how much ground one unit of screen
    // spans there (the larger way: up the page, where the ground is foreshortened)
    toGround(sx, sy){ const xs = (sx - cx)/Z, ys = (sy - cy)/Z, den = d*cp + ys*sp; if(den <= 1e-6) return null;
      const yr = ys*d/den, z = d - yr*sp, k = d/z, xr = xs/k;
      return [cx + xr*ct + yr*st, cy - xr*st + yr*ct, k*Z, Math.max(1/k, 1/(cp*k*k))/Z]; }
  };
}

// ---------------- DISCHARGE ----------------
// The figure on a lattice G cells along the page's short side. Poles sit at the page's rim toward the dial (one),
// across from each other (two), or a triangle (three). Returns segments [x0, y0, x1, y1, current] in page units (short side 1).
// (Ruby: this, the first growth, was the better filter; a later one that always joined two poles is gone.) THE CAMERA:
// the figure grows as it always did, then o.zoom magnifies the finished figure about the page's middle, slid by
// o.offset along the dial's line: zoom 1 and no slide are the figure exactly as first made.
function genLichtenberg(aspX, aspY, o){
  const G = 240, h = 1/G, gx = Math.round(G*aspX), gy = Math.round(G*aspY);
  const poles = Math.max(1, Math.min(3, o.poles)), eta = o.eta, target = o.count;
  // the poles: toward the dial and round from it
  const cx = aspX/2, cy = aspY/2, rad = Math.min(aspX, aspY)*0.46, P = [];
  for(let k = 0; k < poles; k++){ const a = Math.atan2(o.dy, o.dx) + k*Math.PI*2/poles;
    const R = poles === 1 ? rad*0.15 : rad;                 // one pole: a strike near the middle, toward the dial
    P.push([Math.round((cx + Math.cos(a)*R)/h), Math.round((cy + Math.sin(a)*R)/h)]); }
  // charges (lattice points with a jitter, so the channel isn't drawn on graph paper), per tree
  const X = [], Y = [], JX = [], JY = [], par = [], tree = [], occ = new Uint8Array(gx*gy);
  const cand = new Map();   // lattice index → { s: [sum per tree], t: tree, p: parent }
  const R1 = 0.5;
  const addCharge = (ix, iy, t, p) => {
    const id = X.length; X.push(ix); Y.push(iy); JX.push((Math.random() - 0.5)*0.7); JY.push((Math.random() - 0.5)*0.7); par.push(p); tree.push(t);
    occ[iy*gx + ix] = 1; cand.delete(iy*gx + ix);
    // every candidate feels the new charge (Kim et al.: the potential of a point charge, 1 − R1/r, summed)
    for(const c of cand.values()){ const dx = c.x - ix, dy = c.y - iy, r = Math.sqrt(dx*dx + dy*dy); c.s[t] += 1 - R1/Math.max(R1, r); }
    // its free neighbours become candidates (their potential from every charge so far)
    for(let j = -1; j <= 1; j++) for(let i = -1; i <= 1; i++){ if(!i && !j) continue; const x = ix + i, y = iy + j;
      if(x < 1 || y < 1 || x >= gx - 1 || y >= gy - 1 || occ[y*gx + x]) continue; const k = y*gx + x; if(cand.has(k)) continue;
      const s = new Float64Array(poles); for(let q = 0; q < X.length; q++){ const dx = x - X[q], dy = y - Y[q], r = Math.sqrt(dx*dx + dy*dy); s[tree[q]] += 1 - R1/Math.max(R1, r); }
      cand.set(k, { x, y, s, t, p: id }); }
    return id;
  };
  const count = new Array(poles).fill(0);
  P.forEach((p, t) => { addCharge(Math.min(gx - 2, Math.max(1, p[0])), Math.min(gy - 2, Math.max(1, p[1])), t, -1); count[t]++; });
  // grain: growth along it is easier (wood burns along its fibres)
  const ga = o.grain, gcx = 1, gcy = 0;
  let turn = 0;
  for(let step = poles; step < target; step++){
    const t = turn; turn = (turn + 1) % poles;
    // the candidates of this tree: its own potential (high at the tips, far from the channel already burnt) and,
    // with more than one pole, the pull of the nearest other pole (the opposite charge) — each normalised, then
    // blended, then raised to the power η
    const list = []; let lo = Infinity, hi = -Infinity, alo = Infinity, ahi = -Infinity;
    for(const c of cand.values()){ if(c.t !== t) continue;
      const phi = c.s[t]/Math.max(1, count[t]); let att = 0;
      if(poles > 1){ let dm = Infinity; for(let q = 0; q < poles; q++) if(q !== t){ const d2 = Math.hypot(c.x - P[q][0], c.y - P[q][1]); if(d2 < dm) dm = d2; } att = -dm; }
      list.push([c, phi, att]); if(phi < lo) lo = phi; if(phi > hi) hi = phi; if(att < alo) alo = att; if(att > ahi) ahi = att; }
    if(!list.length) break;
    let tot = 0; const w = new Float64Array(list.length), pull = poles > 1 ? 0.62 : 0;
    for(let i = 0; i < list.length; i++){ const c = list[i][0], pn = (1 - pull)*(list[i][1] - lo)/Math.max(1e-9, hi - lo) + pull*(list[i][2] - alo)/Math.max(1e-9, ahi - alo);
      let g = 1; if(ga > 0){ const dx = c.x - X[c.p], dy = c.y - Y[c.p], m = Math.hypot(dx, dy) || 1; g = 1 + ga*2.5*Math.abs((dx*gcx + dy*gcy)/m); }
      w[i] = Math.pow(pn, eta)*g; tot += w[i]; }
    let r = Math.random()*tot, pick = list.length - 1; for(let i = 0; i < list.length; i++){ r -= w[i]; if(r <= 0){ pick = i; break; } }
    const c = list[pick][0]; addCharge(c.x, c.y, t, c.p); count[t]++;
  }
  // the current through each step: everything that grew beyond it
  const n = X.length, desc = new Float64Array(n).fill(1);
  for(let i = n - 1; i >= 0; i--) if(par[i] >= 0) desc[par[i]] += desc[i];
  const zoom = o.zoom || 1, off = o.offset || 0, sx = cx + o.dx*off*aspX*0.45, sy = cy + o.dy*off*aspY*0.45;
  const camX = v => zoom === 1 && !off ? v : sx + (v - cx)*zoom, camY = v => zoom === 1 && !off ? v : sy + (v - cy)*zoom;
  const segs = [];
  for(let i = 0; i < n; i++){ const p = par[i]; if(p < 0) continue;
    segs.push([camX((X[p] + JX[p])*h), camY((Y[p] + JY[p])*h), camX((X[i] + JX[i])*h), camY((Y[i] + JY[i])*h), desc[i]]); }
  return { segs, n };
}

// ---------------- RAINDROPS ----------------
// Rain on still water (Ruby's poem asked for it). Every drop that has fallen in the last moment is a ring wave
// spreading from where it hit: a short wave packet (a sine inside a smooth window) whose radius is its age times its
// speed, its height falling as it spreads (the energy shared round a growing circle), the longer waves running ahead
// (dispersion). Drops live on the water itself, in ground units (the page's short side is 1), seeded by a hash of
// each stretch of it, so any stretch near or far has its own and the picture never depends on the order things are
// drawn in. THE CAMERA (o.tilt) looks across the water toward the horizon, as Perspective does: rings draw as
// ellipses, smaller and denser with distance, and where a ring is finer than a pixel the water calms to flat (it
// would only flicker). A drop younger than a breath still shows its splash: a crater, a crown, and a few droplets.
function genRaindrops(ww, wh, unit, o){
  const N = ww*wh, H = new Float32Array(N), S = new Float32Array(N), D = new Float32Array(N);
  const lam = 0.012*o.size, packets = 2.5, Rmax = lam*(6 + 22*o.spread), reach = Rmax + lam*(packets + 1.5), C = Math.max(0.01, reach/2);
  const density = 20 + 520*o.rain, perCell = density*C*C, fresh = o.splash > 0 ? 0.015 + 0.05*o.splash : 0, salt = o.salt >>> 0;
  const hash = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647) ^ salt; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0)/4294967296; };
  const cells = new Map();
  const dropsIn = (cx, cy) => { const key = cx*73856093 ^ cy*19349663; let L = cells.get(key); if(L) return L; L = [];
    const n = Math.floor(perCell + hash(cx, cy, 0));
    for(let k = 1; k <= n; k++){
      // older drops wider and fainter; Spread lets the rings grow older (wider) before the next ones fall
      const a = Math.pow(hash(cx, cy, k*7 + 1), 0.7 + (1 - o.spread)*1.6), l = lam*(0.8 + 0.4*hash(cx, cy, k*7 + 2))*(1 + 0.7*a);
      L.push({ x: (cx + hash(cx, cy, k*7 + 3))*C, y: (cy + hash(cx, cy, k*7 + 4))*C, a, l, R: a*Rmax, amp: Math.pow(1 - a, 1.3)/Math.sqrt(1 + a*Rmax/lam),
        splash: a < fresh, turn: hash(cx, cy, k*7 + 5)*6.283 }); }
    cells.set(key, L); return L; };
  const t = Math.max(0, Math.min(0.9, o.tilt)), zFar = 1/(1 - t), aspX = ww/unit, aspY = wh/unit;
  // each row's depth: z (1 near, zFar at the top), its ground y, and a pixel's size on the water (forward, the larger)
  const Z = new Float32Array(wh), GY = new Float32Array(wh), FT = new Float32Array(wh);
  for(let y = 0; y < wh; y++){ const v = (y + 0.5)/wh, z = t > 1e-4 ? 1/(1 - t + t*v) : 1; Z[y] = z; GY[y] = (t > 1e-4 ? 1 - (z - 1)/t : v)*aspY; FT[y] = z*z/unit;
    const dist = t > 1e-4 ? (z - 1)/(zFar - 1) : 0; D.fill(dist, y*ww, y*ww + ww); }
  // the screen row nearest a ground y (rows run from far, at the top, to near)
  const rowOf = gy => { if(t <= 1e-4) return gy/aspY*wh - 0.5; const G = 1 - gy/aspY, v = (1 - G + G*t)/(1 + G*t); return v*wh - 0.5; };
  const h = new Float32Array(N);
  // EACH DROP IS LAID WHERE IT REACHES (not each point asking every drop nearby): row by row, only across its ring's band
  const gx0 = (0.5 - 0.5*zFar)*aspX - reach, gx1 = (0.5 + 0.5*zFar)*aspX + reach, gy0 = Math.min(GY[0], GY[wh - 1]) - reach, gy1 = Math.max(GY[0], GY[wh - 1]) + reach;
  for(let cy = Math.floor(gy0/C); cy <= Math.floor(gy1/C); cy++) for(let cx = Math.floor(gx0/C); cx <= Math.floor(gx1/C); cx++) for(const d of dropsIn(cx, cy)){
    const r0 = lam*0.7*(1 + d.a*12), rout = Math.max(d.R + d.l*1.5, d.splash ? r0*2.4 : 0), rin = d.splash ? 0 : Math.max(0, d.R - d.l*packets);
    const ya = Math.max(0, Math.floor(Math.min(rowOf(d.y - rout), rowOf(d.y + rout)))), yb = Math.min(wh - 1, Math.ceil(Math.max(rowOf(d.y - rout), rowOf(d.y + rout))));
    if(ya > yb) continue;
    // a drop whose rings are finer than a pixel where it lies, and that isn't splashing, would only flicker: the water there is calm
    const mid = Math.max(0, Math.min(wh - 1, Math.round(rowOf(d.y))));
    if(!d.splash && d.l/FT[mid] < 1.2) continue;
    for(let y = ya; y <= yb; y++){
      const dy = GY[y] - d.y, dy2 = dy*dy; if(dy2 > rout*rout) continue;
      const xo = Math.sqrt(rout*rout - dy2), xi = dy2 < rin*rin ? Math.sqrt(rin*rin - dy2) : 0, z = Z[y], foot = FT[y], row = y*ww;
      const toPx = gx => ((gx/aspX - 0.5)/z + 0.5)*ww - 0.5;
      for(const [a0, a1] of xi > 0 ? [[d.x - xo, d.x - xi], [d.x + xi, d.x + xo]] : [[d.x - xo, d.x + xo]]){
        const xa = Math.max(0, Math.floor(toPx(a0))), xb = Math.min(ww - 1, Math.ceil(toPx(a1)));
        for(let x = xa; x <= xb; x++){
          const gx = (0.5 + ((x + 0.5)/ww - 0.5)*z)*aspX, dx = gx - d.x, r = Math.sqrt(dx*dx + dy2), w = (d.R - r)/d.l, q = row + x;
          if(w > -1 && w < packets){
            // a ring finer than a pixel (far off, or seen edge-on) calms rather than flickers
            const sharp = Math.max(0, Math.min(1, (d.l/foot - 1.2)/2)), e = Math.sin(Math.PI*(w + 1)/(packets + 1));
            h[q] += 1.6*d.amp*sharp*e*e*Math.sin(6.283*w); }
          if(d.splash){
            // the splash: a crater where it struck, a crown thrown up round it, and a few droplets flung out
            const cr = (r - r0)/(lam*0.18);
            if(r < r0) h[q] -= 0.6*(1 - r/r0)*(1 - r/r0);
            if(cr > -3 && cr < 3){ const g = Math.exp(-cr*cr); h[q] += 0.5*g; if(g > S[q]) S[q] = g; }
            for(let k = 0; k < 6; k++){ const ang = d.turn + k*1.047, rr = r0*1.9, ox = d.x + Math.cos(ang)*rr, oy = d.y + Math.sin(ang)*rr*0.9, dd = Math.hypot(gx - ox, GY[y] - oy)/(lam*0.14);
              if(dd < 3){ const g = Math.exp(-dd*dd); if(g > S[q]) S[q] = g; h[q] += 0.3*g; } } }
        }
      }
    }
  }
  for(let q = 0; q < N; q++){ const v = h[q]; H[q] = 0.5 + 0.22*v/(1 + 0.45*Math.abs(v)); S[q] = Math.min(1, S[q]*(0.4 + o.splash*0.6)); }
  return [H, S, D];
}

// ---------------- WOOD ----------------
function genWood(ww, wh, unit, o){
  const N = ww*wh, pic = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, H = new Float32Array(N);
  const warp = makeNoiseGrid(9, 9), fib = makeNoiseGrid(64, 12), fig = makeNoiseGrid(6, 6), knot = makeNoiseGrid(5, 5);
  const pithY = -0.22 - Math.random()*0.35, pithX = 0.2 + Math.random()*0.6, rings = 34*o.rings + 8, L = o.light, D = o.dark;
  const cam = o.cam || null, ex = 9 - 4*o.figure, lateMean = 1/(ex + 1);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    let u = x/unit, v = y/unit, ringK = 1, fibK = 1;
    const i = y*ww + x;
    if(cam){ const g = cam.toGround((x + 0.5)/unit, (y + 0.5)/unit); if(!g) continue; u = g[0]; v = g[1];
      // far off, a ring or a fibre finer than a pixel would only shimmer: it fades to its average
      const foot = g[3]/unit; ringK = genClamp((1/rings/foot - 1.5)/2.5); fibK = genClamp((Math.min(ww/unit/63, wh/unit/11)/foot - 1)/2); }
    const wv = sampleNoiseGrid(warp, 9, 9, u/(ww/unit)*8, v/(wh/unit)*8) - 0.5;
    // (flat-sawn: the rings cut at a slant across the board, so they arch — "cathedrals" — round a pith above it;
    //  past the page's top, as a camera sees it, they straighten toward the pith's line and never close round it)
    const dv = v >= 0 ? v - pithY : -pithY*Math.exp(v/-pithY);
    const r = Math.hypot((u - pithX*ww/unit)*0.8, dv) + wv*0.05*o.figure + (sampleNoiseGrid(fig, 6, 6, u*2, v*2) - 0.5)*0.025*o.figure;
    const f = r*rings, q = f - Math.floor(f);
    // early wood pale and soft, late wood a dark sharp band at the ring's end
    const late = ringK === 1 ? Math.pow(q, ex) : lateMean + (Math.pow(q, ex) - lateMean)*ringK;
    const fb = sampleNoiseGrid(fib, 64, 12, u/(ww/unit)*63, v/(wh/unit)*11), fibre = fibK === 1 ? fb : 0.5 + (fb - 0.5)*fibK, pore = sampleNoiseGrid(knot, 5, 5, u*1.3, v*1.3);
    const tone = genClamp(0.1 + late*0.62 + (fibre - 0.5)*0.42 + (pore - 0.5)*0.18);
    pic.r[i] = L[0] + (D[0] - L[0])*tone; pic.g[i] = L[1] + (D[1] - L[1])*tone; pic.b[i] = L[2] + (D[2] - L[2])*tone;
    H[i] = 0.55 - late*0.05 + (fibre - 0.5)*0.05;
  }
  return [pic, H];
}

// ---------------- GROWING LINE ----------------
// Closed loops in page units; returns { loops: [[x,y,age]…], iters }.
function genGrowth(aspX, aspY, o){
  const d = 0.0065*o.fold, R = d*2.6, maxEdge = d*1.15, cap = Math.round(1000 + 5200*o.growth), iters = Math.round(120 + 720*o.growth);
  const loops = [];
  const seeds = Math.max(1, Math.round(o.seeds));
  for(let s = 0; s < seeds; s++){
    const cx = aspX*(seeds === 1 ? 0.5 : 0.18 + Math.random()*0.64), cy = aspY*(seeds === 1 ? 0.5 : 0.18 + Math.random()*0.64), r0 = 0.02 + Math.random()*0.02, k = 24;
    const L = []; for(let i = 0; i < k; i++){ const a = i/k*Math.PI*2; L.push([cx + Math.cos(a)*r0, cy + Math.sin(a)*r0, 0]); } loops.push(L); }
  const sun = o.sun, sunK = o.photo;
  const cell = R, gw = Math.ceil(aspX/cell) + 1, gh = Math.ceil(aspY/cell) + 1;
  for(let it = 1; it <= iters; it++){
    let total = 0; for(const L of loops) total += L.length;
    // the spatial hash: every point, by cell
    const head = new Int32Array(gw*gh).fill(-1), next = new Int32Array(total), PX = new Float64Array(total), PY = new Float64Array(total);
    let q = 0; for(const L of loops) for(const p of L){ PX[q] = p[0]; PY[q] = p[1]; const c = Math.min(gh - 1, Math.max(0, p[1]/cell|0))*gw + Math.min(gw - 1, Math.max(0, p[0]/cell|0)); next[q] = head[c]; head[c] = q; q++; }
    q = 0;
    for(const L of loops){ const m = L.length, NX = new Float64Array(m), NY = new Float64Array(m);
      for(let i = 0; i < m; i++, q++){
        const p = L[i], a = L[(i - 1 + m) % m], b = L[(i + 1) % m];
        // follow the neighbours (the line keeps smooth), and push off everything near
        let fx = ((a[0] + b[0])/2 - p[0])*0.35, fy = ((a[1] + b[1])/2 - p[1])*0.35;
        const ci = p[0]/cell|0, cj = p[1]/cell|0;
        for(let j = cj - 1; j <= cj + 1; j++){ if(j < 0 || j >= gh) continue; for(let k2 = ci - 1; k2 <= ci + 1; k2++){ if(k2 < 0 || k2 >= gw) continue;
          for(let z = head[j*gw + k2]; z >= 0; z = next[z]){ if(z === q) continue; const dx = p[0] - PX[z], dy = p[1] - PY[z], dd = dx*dx + dy*dy;
            if(dd < R*R && dd > 1e-12){ const dl = Math.sqrt(dd), f = (R - dl)/R*0.5*d/dl; fx += dx*f; fy += dy*f; } } } }
        NX[i] = Math.min(aspX - 0.01, Math.max(0.01, p[0] + fx)); NY[i] = Math.min(aspY - 0.01, Math.max(0.01, p[1] + fy));
      }
      for(let i = 0; i < m; i++){ L[i][0] = NX[i]; L[i][1] = NY[i]; }
    }
    if(total >= cap) continue;
    // growth: split stretched edges; and a few new points where the light is (the sun pulls the growth its way)
    for(let li = 0; li < loops.length; li++){ const L = loops[li], out = [];
      for(let i = 0; i < L.length; i++){ const p = L[i], b = L[(i + 1) % L.length]; out.push(p);
        const dx = b[0] - p[0], dy = b[1] - p[1], len = Math.hypot(dx, dy);
        let grow = len > maxEdge;
        if(!grow && Math.random() < 0.012){ const nx = dy/(len || 1), ny = -dx/(len || 1), face = nx*sun.x + ny*sun.y; grow = Math.random() < 0.5 + 0.5*sunK*face; }
        if(grow) out.push([(p[0] + b[0])/2, (p[1] + b[1])/2, it]); }
      loops[li] = out; }
  }
  return { loops, iters };
}

// ---------------- KNOTWORK ----------------
// Celtic knotwork by Cromwell's method ("Celtic knotwork: mathematical art", 1993) as Mercat draws it: a PLAIT of
// diagonal strands crossing at the points of a lattice, over and under in turn; then BREAKS — barriers at some
// crossings that turn the two strands back instead of crossing them — make the knot. A crossing's over-strand is
// fixed by its column, so every strand alternates over, under, over along its whole length. The panel's outline
// (a circle, square, diamond, cross, quatrefoil, or the whole page) is itself a set of breaks: a crossing on the
// edge turns its strands back inside. Interior breaks are mirrored four ways, so the knot reads as a sigil.
// Returns pieces: { a: [x,y], b: [x,y], c: [x,y] (the crossing), kind: 'over' | 'under' | 'turn' | 'pass' } in lattice units.
function genKnot(o){
  // CROMWELL'S GRID: square cells (the panel is a set of them), crossings at the midpoints of their edges; the strands
  // run diagonally between a cell's edge midpoints. In doubled coordinates a cell's centre is (odd, odd) and a
  // crossing is (even, odd) on an upright edge or (odd, even) on a level one.
  const n = Math.max(2, Math.round(o.cells)), shape = o.shape;
  const inShape = (u, v) => { const a = Math.abs(u), b = Math.abs(v);
    if(shape === 0) return u*u + v*v <= 1.0;                                    // circle
    if(shape === 1) return a <= 0.9 && b <= 0.9;                                // square
    if(shape === 2) return a + b <= 1.1;                                        // diamond
    if(shape === 3) return (a <= 0.34 && b <= 1) || (b <= 0.34 && a <= 1);      // cross
    if(shape === 4){ const q = 0.46; return Math.hypot(a - q, v) <= 0.5 || Math.hypot(u, b - q) <= 0.5 || (a <= 0.42 && b <= 0.42); }   // quatrefoil
    return a <= o.aspX && b <= o.aspY;                                          // the whole page
  };
  const R = n*2, span = shape === 5 ? Math.ceil(n*Math.max(o.aspX, o.aspY)) + 1 : n + 1;
  const cells = new Set(), ck = (x, y) => x + ',' + y;
  for(let b = -span; b < span; b++) for(let a = -span; a < span; a++){ const x = 2*a + 1, y = 2*b + 1; if(inShape(x/R, y/R)) cells.add(ck(x, y)); }
  const cell = (x, y) => cells.has(ck(x, y));
  const hsh = (a, b, k) => { const t = Math.sin(a*127.1 + b*311.7 + k*74.7 + o.salt*13.37)*43758.5453; return t - Math.floor(t); };
  // the ends: NE (+1,-1) NW (-1,-1) SE (+1,+1) SW (-1,+1), each half way to the next crossing
  const pieces = [], seen = new Set();
  const end = (c, dx, dy) => [c[0] + dx*0.5, c[1] + dy*0.5];
  for(const k of cells){ const [cx, cy] = k.split(',').map(Number);
    for(const [ex, ey] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]){
      const kk = ck(ex, ey); if(seen.has(kk)) continue; seen.add(kk);
      const upright = (ex & 1) === 0, c = [ex, ey];
      const A = upright ? cell(ex - 1, ey) : cell(ex, ey - 1), B = upright ? cell(ex + 1, ey) : cell(ex, ey + 1);
      const NE = end(c, 1, -1), NW = end(c, -1, -1), SE = end(c, 1, 1), SW = end(c, -1, 1);
      // A on the left (upright edge) or above (level edge); a break ALONG the edge bounces each side back on itself
      const along = (A && !B) || (B && !A) ? true : null;
      let brk = along ? 'along' : null;
      if(!brk){ const ax = Math.abs(ex), ay = Math.abs(ey), r = hsh(Math.min(ax, ay), Math.max(ax, ay), 1);
        if(r < o.breaks*0.5) brk = hsh(ax, ay, 2) < 0.5 ? 'along' : 'across'; }
      if(!brk){
        // a crossing: which strand is over follows the edge's kind, so every strand alternates along its length
        const first = !upright;
        pieces.push({ a: NE, b: SW, c, kind: first ? 'over' : 'under' }, { a: NW, b: SE, c, kind: first ? 'under' : 'over' });
        continue; }
      const alongPairs = upright ? [[NW, SW, A], [NE, SE, B]] : [[NW, NE, A], [SW, SE, B]];
      const acrossPairs = upright ? [[NW, NE, true], [SW, SE, true]] : [[NW, SW, true], [NE, SE, true]];
      for(const [p, q, live] of (brk === 'along' ? alongPairs : acrossPairs)) if(live) pieces.push({ a: p, b: q, c, kind: 'turn' });
    }
  }
  // (in cell units: halve, so a cell is one unit)
  for(const pc of pieces) for(const k of ['a', 'b', 'c']) pc[k] = [pc[k][0]/2, pc[k][1]/2];
  return pieces;
}
// Draws the pieces as ribbons: unders first, each over cut out of what's beneath it by a gap, then the overs.
// x: a context; T(p) → canvas [x, y]; s: one lattice unit in pixels; wd: the ribbon's width; fill / edge: its colours.
function genDrawKnot(x, pieces, T, s, wd, edge, fill, gap){
  const curve = pc => { const A = T(pc.a), B = T(pc.b), C = T(pc.c);
    x.beginPath(); x.moveTo(A[0], A[1]);
    if(pc.kind === 'turn'){ const k = 0.9; x.bezierCurveTo(A[0] + (C[0] - A[0])*k, A[1] + (C[1] - A[1])*k, B[0] + (C[0] - B[0])*k, B[1] + (C[1] - B[1])*k, B[0], B[1]); }
    else { x.lineTo(C[0], C[1]); x.lineTo(B[0], B[1]); } };
  const rib = pc => { curve(pc); x.strokeStyle = edge; x.lineWidth = wd; x.stroke(); curve(pc); x.strokeStyle = fill; x.lineWidth = wd*0.62; x.stroke(); };
  x.lineCap = 'butt'; x.lineJoin = 'round';
  for(const pc of pieces) if(pc.kind !== 'over') rib(pc);
  for(const pc of pieces) if(pc.kind === 'over'){ curve(pc); x.strokeStyle = gap; x.lineWidth = wd*1.55; x.stroke(); }
  // (the gap cleared the unders' ribbons where they pass beneath: draw them again outside it, then the over on top)
  for(const pc of pieces) if(pc.kind === 'over') rib(pc);
  x.lineCap = 'round';
  // the turns and passes again over any gap that clipped them
  for(const pc of pieces) if(pc.kind === 'turn' || pc.kind === 'pass') rib(pc);
}

// ---------------- MATRIX: the stuff a network grows through ----------------
// Five materials as a picture (a grey to tint), heights, and where something can creep through (its ways):
//   0 rock STRATA (bands of sediment; the ways are the bedding planes between them) · 1 PEBBLES (rounded stones; the
//   ways, the gaps between) · 2 SAND (fine grains in ripples; anywhere) · 3 FIBRES (a bundle, combed one way; between
//   the strands) · 4 SKIN (pores and creases; along the creases).
function genMatrix(ww, wh, unit, o){
  const N = ww*wh, kind = o.kind, z = o.zoom, pic = new Float32Array(N), H = new Float32Array(N), W = new Float32Array(N);
  const n1 = makeNoiseGrid(7, 7), n2 = makeNoiseGrid(31, 31), n3 = makeNoiseGrid(90, 90);
  const S = (g, c, u, v) => sampleNoiseGrid(g, c, c, u*(c - 1), v*(c - 1));
  // pebbles: jittered points, the nearest two (Worley)
  const cs = unit*0.06*z, gx = Math.ceil(ww/cs) + 2, gy = Math.ceil(wh/cs) + 2, P = new Float32Array(gx*gy*3);
  for(let i = 0; i < gx*gy; i++){ P[i*3] = 0.15 + Math.random()*0.7; P[i*3+1] = 0.15 + Math.random()*0.7; P[i*3+2] = Math.random(); }
  const ca = Math.cos(o.angle), sa = Math.sin(o.angle);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x, u = x/unit/z, v = y/unit/z, au = (u*ca + v*sa), av = (-u*sa + v*ca);
    let p = 0.5, h = 0.5, w = 0;
    if(kind === 0){ // strata: bands bent by slow noise; each band its own tone; a dark seam where bands meet
      const b = av*7 + (S(n1, 7, u*0.25, v*0.25) - 0.5)*1.6 + (S(n2, 31, u*0.4, v*0.4) - 0.5)*0.25, f = b - Math.floor(b), band = Math.floor(b);
      const tone = 0.35 + 0.4*((Math.sin(band*12.9898)*43758.5453) % 1 + 1) % 1;
      const seam = Math.exp(-Math.pow(Math.min(f, 1 - f)*14, 2));
      p = tone*(0.88 + 0.24*S(n3, 90, u*0.5, v*0.5)) - seam*0.18; h = 0.5 + tone*0.12 - seam*0.25 + (S(n3, 90, u*0.5, v*0.5) - 0.5)*0.06; w = seam; }
    else if(kind === 1){ // pebbles
      const fx = x/cs + 1, fy = y/cs + 1, ci = Math.floor(fx), cj = Math.floor(fy); let d1 = 9, d2 = 9, t = 0;
      for(let dj = -1; dj <= 1; dj++) for(let di = -1; di <= 1; di++){ const a = ci + di, b2 = cj + dj; if(a < 0 || b2 < 0 || a >= gx || b2 >= gy) continue; const k = b2*gx + a, dx = fx - a - P[k*3], dy = fy - b2 - P[k*3+1], d = Math.sqrt(dx*dx + dy*dy);
        if(d < d1){ d2 = d1; d1 = d; t = P[k*3+2]; } else if(d < d2) d2 = d; }
      const edge = d2 - d1, dome = Math.min(1, edge*3.2);
      p = (0.3 + 0.45*t)*(0.85 + 0.3*S(n3, 90, u, v))*(0.55 + 0.45*dome) ; h = Math.sqrt(dome)*0.8 + 0.1; w = Math.max(0, 1 - edge*7); }
    else if(kind === 2){ // sand
      const g = S(n3, 90, u*1.8, v*1.8), rip = Math.sin((av + (S(n1, 7, u*0.3, v*0.3) - 0.5)*0.6)*48)*0.5 + 0.5;
      p = 0.45 + (g - 0.5)*0.5 + rip*0.08; h = 0.5 + rip*0.12 + (g - 0.5)*0.1; w = 0.55 + 0.45*(1 - rip); }
    else if(kind === 3){ // fibres: noise stretched along the comb
      const f = S(n3, 90, au*0.08, av*1.8), f2 = S(n2, 31, au*0.05, av*0.9);
      p = 0.35 + f*0.45 + (f2 - 0.5)*0.2; h = 0.35 + f*0.5; w = Math.max(0, 1 - f*2.2); }
    else { // skin: pores, and creases where two noises' bands meet
      const c1 = Math.abs(S(n1, 7, u*0.6, v*0.6)*2 - 1), c2 = Math.abs(S(n2, 31, u*0.35, v*0.35)*2 - 1), crease = Math.exp(-c1*c1*120) + 0.6*Math.exp(-c2*c2*200);
      const pore = S(n3, 90, u*1.2, v*1.2); p = 0.62 - crease*0.16 - Math.max(0, pore - 0.72)*0.8; h = 0.6 - crease*0.25 - Math.max(0, pore - 0.72)*0.6; w = Math.min(1, crease); }
    pic[i] = Math.max(0, Math.min(1, p)); H[i] = Math.max(0, Math.min(1, h)); W[i] = Math.max(0, Math.min(1, w));
  }
  return [pic, H, W];
}
// ---------------- TENDRILS: a network grown through it ----------------
// SPACE COLONIZATION (Runions, Fuhrer, Lane, Mech & Prusinkiewicz, "Modeling trees with a space colonization
// algorithm", 2007; and leaf venation, 2005): points of attraction are scattered where the matrix lets something
// through; from a root, every node grows one step toward the average of the points that have it as their nearest
// (within reach), and a point is used up when a node arrives. So the network branches where it must and fills
// the space it was given. Its thickness follows how much it feeds (Murray's law: r³ adds at a branch).
function genTendrils(ww, wh, unit, W, o){
  const step = unit*0.006*o.zoom, reach = step*(10 + 22*o.branching), kill = step*2.2;
  const nA = Math.round(1800*o.amount*(ww*wh)/(unit*unit)/(o.zoom*o.zoom)), AX = [], AY = [];
  for(let t = 0; AX.length < nA && t < nA*30; t++){ const x = Math.random()*ww, y = Math.random()*wh, w = W[(y|0)*ww + (x|0)];
    if(Math.random() < 0.08 + 0.92*w*w) { AX.push(x); AY.push(y); } }
  // the roots: from the page's edge toward the dial's handle, or from a point (Slide moves it)
  const NX = [], NY = [], PAR = [];
  const rx = ww/2 - o.dx*ww*(0.5 - 0.5*o.inner) + o.dy*o.slide*ww*0.4, ry = wh/2 - o.dy*wh*(0.5 - 0.5*o.inner) - o.dx*o.slide*wh*0.4;
  const roots = Math.max(1, Math.round(o.roots));
  for(let r = 0; r < roots; r++){ NX.push(Math.min(ww - 1, Math.max(0, rx + (r - (roots - 1)/2)*o.dy*unit*0.18))); NY.push(Math.min(wh - 1, Math.max(0, ry - (r - (roots - 1)/2)*o.dx*unit*0.18))); PAR.push(-1); }
  const alive = new Uint8Array(AX.length).fill(1);
  const cell = reach, gw = Math.ceil(ww/cell) + 1, gh = Math.ceil(wh/cell) + 1;
  for(let it = 0; it < 420; it++){
    // the nodes in buckets
    const head = new Int32Array(gw*gh).fill(-1), next = new Int32Array(NX.length);
    for(let k = 0; k < NX.length; k++){ const c = Math.min(gh - 1, NY[k]/cell|0)*gw + Math.min(gw - 1, NX[k]/cell|0); next[k] = head[c]; head[c] = k; }
    const sx = new Float64Array(NX.length), sy = new Float64Array(NX.length), cnt = new Int32Array(NX.length); let any = false;
    for(let a = 0; a < AX.length; a++){ if(!alive[a]) continue;
      const ci = AX[a]/cell|0, cj = AY[a]/cell|0; let best = -1, bd = reach*reach;
      for(let j = cj - 1; j <= cj + 1; j++){ if(j < 0 || j >= gh) continue; for(let i = ci - 1; i <= ci + 1; i++){ if(i < 0 || i >= gw) continue;
        for(let k = head[j*gw + i]; k >= 0; k = next[k]){ const dx = AX[a] - NX[k], dy = AY[a] - NY[k], d = dx*dx + dy*dy; if(d < bd){ bd = d; best = k; } } } }
      if(best < 0) continue;
      if(bd < kill*kill){ alive[a] = 0; continue; }
      const d = Math.sqrt(bd); sx[best] += (AX[a] - NX[best])/d; sy[best] += (AY[a] - NY[best])/d; cnt[best]++; any = true; }
    if(!any) break;
    const n0 = NX.length;
    for(let k = 0; k < n0; k++){ if(!cnt[k]) continue; let dx = sx[k], dy = sy[k]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      // and it keeps to the ways: of the way toward the points and two a little either side, the one most open ahead
      let best = -1, bx = dx, by = dy;
      for(const t of [0, -0.55, 0.55]){ const c = Math.cos(t), sn = Math.sin(t), ex = dx*c - dy*sn, ey = dx*sn + dy*c, qx = NX[k] + ex*step*2, qy = NY[k] + ey*step*2;
        const w = qx < 0 || qy < 0 || qx >= ww || qy >= wh ? 0 : W[(qy|0)*ww + (qx|0)], sc = w*o.keep + (t === 0 ? 0.35 : 0);
        if(sc > best){ best = sc; bx = ex; by = ey; } }
      NX.push(NX[k] + bx*step); NY.push(NY[k] + by*step); PAR.push(k); }
    if(NX.length > 30000) break;
  }
  // the flow through each node (everything beyond it), for its thickness
  const n = NX.length, flow = new Float64Array(n).fill(1);
  for(let k = n - 1; k >= 0; k--) if(PAR[k] >= 0) flow[PAR[k]] += flow[k];
  return { NX, NY, PAR, flow };
}

// ---------------- CIRCUIT TRACES: a board's copper, routed ----------------
// The way circuit boards are routed by hand, and the way generative circuit patterns are usually drawn: a grid of
// cells one trace apart. CHIPS go down first, their pins round their edges. Then BUSES (one to eight traces side by
// side) walk out from the pins, the page's edges and lone vias: straight for a while, then turning together, by 45°
// (a board's chamfered corners) or by 90° (Factorio's belts), every trace keeping its distance from its neighbours
// round the corner (a mitred offset), until something is in the way or the bus has gone far enough. There each trace
// ends in a via or a pad. Every cell remembers the bus that crossed it, so no two buses cross. Small parts (resistors,
// capacitors) and stitching vias fill some of what is left, and a silkscreen names the parts.
// Everything is in CELLS (the page's short side is `across` cells), so the board is the same at any size.
const CIR_DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];   // E SE S SW W NW N NE (y down)
// a 3×5 font for the silkscreen's part names (U chips, R resistors, C capacitors, digits)
const CIR_FONT = { U: '101101101101111', R: '110101110101101', C: '111100100100111', 0: '111101101101111', 1: '010110010010111', 2: '111001111100111',
  3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  // (the rest of the alphabet and a few marks, for the Era's names and the Markings' stamps)
  A: '010101111101101', B: '110101110101110', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '111100101101111', H: '101101111101101',
  I: '111010010010111', J: '001001001101111', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '111101101101111',
  P: '110101110100100', Q: '111101101111001', S: '111100111001111', T: '111010010010010', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '-': '000000111000000', '.': '000000000000010', '/': '001001010100100', ' ': '000000000000000', '+': '000010111010000',
  // RUNES (Magitech's silkscreen: made up, a stave and its branches), written as a–l
  a: '010011010110010', b: '010111010010010', c: '101010010010101', d: '010010111010010', e: '110011010110011', f: '010101010101010',
  g: '011010010010110', h: '101110100110101', i: '010010010101101', j: '100110111110100', k: '001011111011001', l: '111010010010111' };
// the Markings' little pictures, 7×7 (the board's Easter eggs): a fox, a bird, a crescent moon, a star, a witch's hat, an eye
const CIR_EGGS = [
  '1000001110001111111111011101111111101111100011100', '0000110000111101111101111100001110000010000010100',
  '0011100011000011000001100000110000001100000011100', '0001000000100011111110011100011011001000100000000',
  '0001000000110000111000011110011111011111110000000', '0000000011111011000111011101110001101111100000000'];
// what a stamp says, by its era (Today, Future, Quantum, Magitech): made up, every word of it
const CIR_SAYS = [
  ['REV A', 'REV B', 'REV C', 'LOT 0427', 'DO NOT FLEX', 'ESD SAFE', 'TP1', 'GND', '3V3', '5V0', 'MADE BY HAND', 'KEEP DRY', 'PASS QC', 'SER 0091'],
  ['PHOTONIC BUS', 'NEURAL MESH', 'FUSION OK', 'GRAV LINK', 'SYNTH CORE', 'LIGHT PIPE 4', 'SELF HEAL', 'ORBITAL', 'NANO FAB 9', 'DREAM CACHE'],
  ['KEEP BELOW 20 MK', 'QUBIT ARRAY', 'ENTANGLED', 'OBSERVE GENTLY', 'SUPERPOSED', 'COHERENT', 'DO NOT LOOK', 'PHASE 0/1', 'SPIN UP', 'TUNNEL'],
  ['WARDED', 'BOUND', 'THIRD MOON', 'SPELLBOUND', 'HEX SAFE', 'FAMILIAR PORT', 'MANA 9', 'BRAZIER', 'SIGIL 7', 'WITCH OK']];
const CIR_SYLL = ['AR', 'VEL', 'ION', 'KAI', 'SOL', 'NYX', 'OR', 'TEL', 'LUM', 'QUA', 'MER', 'ZEN', 'RHO', 'AXI', 'DRA', 'FEN'];
function genCircuit(cw, ch, o){
  const R = Math.random, occ = new Int32Array(cw*ch), age = new Int32Array(cw*ch);
  const inb = (x, y) => x >= 0 && y >= 0 && x < cw && y < ch, at = (x, y) => (y | 0)*cw + (x | 0);
  // a mask kept clear (the part's first input): those cells are taken before anything is placed
  if(o.clear) for(let y = 0; y < ch; y++) for(let x = 0; x < cw; x++) if(o.clear(x + 0.5, y + 0.5) > 0.5) occ[y*cw + x] = -3;
  const chips = [], smd = [], vias = [], traces = [], names = [];
  // ---- chips: square ones with pins on four sides, long ones on two ----
  const nChips = Math.round(o.parts*cw*ch/650) + (o.parts > 0.08 ? 1 : 0);
  for(let t = 0; t < nChips*14 && chips.length < nChips; t++){
    const quad = R() < 0.5, a = quad ? 5 + (R()*7 | 0) : 2 + (R()*2 | 0), b = quad ? a : 5 + (R()*9 | 0);
    const [W, H] = quad || R() < 0.5 ? [a, b] : [b, a];
    const x = 3 + (R()*Math.max(1, cw - W - 6) | 0), y = 3 + (R()*Math.max(1, ch - H - 6) | 0);
    let ok = x + W + 3 < cw && y + H + 3 < ch;
    for(let j = y - 3; j < y + H + 3 && ok; j++) for(let i = x - 3; i < x + W + 3; i++) if(!inb(i, j) || occ[j*cw + i]){ ok = false; break; }
    if(!ok) continue;
    for(let j = y - 1; j <= y + H; j++) for(let i = x - 1; i <= x + W; i++) occ[j*cw + i] = -1;
    const c = { x, y, w: W, h: H, pins: [], rank: R() }, sides = quad ? [0, 1, 2, 3] : W < H ? [1, 3] : [0, 2];
    for(const sd of sides){ const len = sd % 2 === 0 ? W : H;
      for(let k = 0; k < len; k++) c.pins.push({ side: sd, k, used: false, rank: -1,
        x: sd === 0 || sd === 2 ? x + k + 0.5 : sd === 1 ? x + W + 0.5 : x - 0.5, y: sd === 1 || sd === 3 ? y + k + 0.5 : sd === 0 ? y - 0.5 : y + H + 0.5, dir: [6, 0, 2, 4][sd] }); }
    chips.push(c); names.push({ kind: 'U', n: chips.length, x: x, y: y - 2.2, chip: c });
  }
  // ---- buses ----
  const free = (x, y, id, t) => { if(!inb(x, y)) return 2; const q = at(x, y), v = occ[q]; return v === 0 || (v === id && age[q] > t - 4) ? 1 : 0; };
  const mark = (ax, ay, bx, by, id, t) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)*4));
    for(let s = 0; s <= n; s++){ const x = ax + (bx - ax)*s/n, y = ay + (by - ay)*s/n; if(!inb(x, y)) continue; const q = at(x, y); if(occ[q] === 0 || occ[q] === id){ occ[q] = id; age[q] = t; } } };
  const nrm = d => { const [dx, dy] = CIR_DIRS[d], l = Math.hypot(dx, dy); return [dy/l, -dx/l]; };
  const nBus = Math.round((0.2 + 3.4*o.traces)*cw*ch/150);
  let id = 0;
  const walk = (P, d, k, start, near = null) => {
    id++; const offs = Array.from({ length: k }, (_, i) => i - (k - 1)/2), busRank = near == null ? R() : near*0.65 + R()*0.35;
    let n = nrm(d);
    const pts = offs.map(oi => [[P[0] + n[0]*oi, P[1] + n[1]*oi]]), cur = pts.map(p => p[0].slice());
    // is the bus's footprint free at Q (going dd)? 0 no · 1 yes · 2 the whole bus has left the page
    const ok = (Q, dd, t) => { const nn = nrm(dd); let out = 0;
      for(const oi of offs){ const f = free(Q[0] + nn[0]*oi, Q[1] + nn[1]*oi, id, t); if(f === 0) return 0; if(f === 2) out++; }
      // a little room either side, so two buses never touch
      for(const oi of [offs[0] - 0.8, offs[k - 1] + 0.8]) if(free(Q[0] + nn[0]*oi, Q[1] + nn[1]*oi, id, t) === 0) return 0;
      return out === k ? 2 : 1; };
    const maxSteps = 8 + Math.round(R()*R()*150), turnP = 0.05 + 0.08*R(), diagonal = dd => dd % 2 === 1;
    let t = 0, run = 0, mov = 0, end = R() < 0.62 ? 'via' : 'pad';
    while(t < maxSteps){
      t++;
      const [dx, dy] = CIR_DIRS[d], Q = [P[0] + dx, P[1] + dy], mid = [P[0] + dx/2, P[1] + dy/2];
      const f = ok(Q, d, t), fm = ok(mid, d, t);
      if(f === 2){ end = 'off'; for(let i = 0; i < k; i++) pts[i].push([Q[0] + n[0]*offs[i], Q[1] + n[1]*offs[i]]); mov++; break; }
      const blocked = !f || !fm;
      // time to turn: a diagonal is a short jog; a straight run turns now and then; a blocked one must
      const want = blocked || (run >= (diagonal(d) ? 2 + (R()*4 | 0) : 3) && R() < (diagonal(d) ? 0.45 : turnP));
      if(want){
        // which way: 45° (a board's chamfer) or 90° (a belt's corner), toward the side with more room
        const opts = diagonal(d) || R() < o.bends ? [1, -1] : [2, -2];
        const room = sg => { const dd = (d + sg + 8) % 8, [ex, ey] = CIR_DIRS[dd]; let r = 0;
          for(let q = 1; q <= 6; q++){ if(!ok([P[0] + ex*q, P[1] + ey*q], dd, t)) break; r++; } return r + R()*0.5; };
        let turned = false;
        for(const [sg, r] of opts.map(sg => [sg, room(sg)]).sort((a, b) => b[1] - a[1])){
          const d2 = (d + sg + 8) % 8;
          if(r < 2 || (!o.diag && diagonal(d2))) continue;
          // the corner: each trace turns where its offset line meets the new one (a mitre)
          const n2 = nrm(d2), c = n[0]*n2[0] + n[1]*n2[1], m = [(n[0] + n2[0])/(1 + c), (n[1] + n2[1])/(1 + c)];
          for(let i = 0; i < k; i++){ const q = [P[0] + m[0]*offs[i], P[1] + m[1]*offs[i]]; mark(cur[i][0], cur[i][1], q[0], q[1], id, t); pts[i].push(q); cur[i] = q; }
          d = d2; n = n2; run = 0; turned = true; break;
        }
        if(turned) continue;
        if(blocked) break;
      }
      // a step straight on: each trace's line marked as taken
      for(let i = 0; i < k; i++){ const q = [Q[0] + n[0]*offs[i], Q[1] + n[1]*offs[i]]; mark(cur[i][0], cur[i][1], q[0], q[1], id, t); cur[i] = q; }
      P = Q; run++; mov++;
    }
    if(mov < 2) return false;
    const [dx, dy] = CIR_DIRS[d], ln = Math.hypot(dx, dy);
    if(end !== 'off') for(let i = 0; i < k; i++){
      // each trace runs on to its end (every other one a little further, so neighbouring vias don't touch)
      const ext = end === 'via' && k > 1 && i % 2 ? 1.1 : 0; pts[i].push([cur[i][0] + dx/ln*ext, cur[i][1] + dy/ln*ext]); }
    offs.forEach((_, i) => traces.push({ pts: pts[i], rank: Math.min(1, Math.max(0, busRank + (R() - 0.5)*0.14)), bus: id, start, end: end === 'off' ? null : end, w: k }));
    return true;
  };
  for(let b = 0; b < nBus; b++){
    const r = R();
    const k = (q => q < 0.32 ? 1 : q < 0.46 ? 2 : q < 0.7 ? 3 + (R()*2 | 0) : 5 + (R()*4 | 0))(R());
    if(r < 0.5 && chips.length){
      // out of a chip: k pins side by side that nothing uses yet
      const c = chips[R()*chips.length | 0], sd = c.pins[R()*c.pins.length | 0].side, row = c.pins.filter(p => p.side === sd);
      // a run of k pins that nothing uses yet (as long a run as there is, up to k)
      const k2 = Math.min(k, row.length); let run = [];
      for(let tries = 0; tries < 6 && !run.length; tries++){ const s0 = R()*(row.length - k2 + 1) | 0, r2 = row.slice(s0, s0 + k2); if(!r2.some(p => p.used)) run = r2; }
      if(!run.length) continue;
      // pins on the left or top of a side are counted the other way round from the bus's offsets
      const P = [run.reduce((a, p) => a + p.x, 0)/run.length, run.reduce((a, p) => a + p.y, 0)/run.length];
      const before = traces.length;
      if(walk(P, run[0].dir, run.length, 'pin', c.rank)){ run.forEach(p => { p.used = true; });
        // which trace left from which pin: the nearest
        for(const tr of traces.slice(before)){ const s = tr.pts[0]; let best = null, bd = 9; for(const p of run){ const dd = Math.hypot(p.x - s[0], p.y - s[1]); if(dd < bd){ bd = dd; best = p; } } if(best) best.rank = tr.rank; } }
    } else if(r < 0.72){
      // in from the page's edge
      const e = R()*4 | 0, d = [2, 4, 6, 0][e], along = e % 2 === 0 ? cw : ch, s = 2 + (R()*(along - 4) | 0);
      const P = e === 0 ? [s + 0.5, -0.5] : e === 1 ? [cw + 0.5, s + 0.5] : e === 2 ? [s + 0.5, ch + 0.5] : [-0.5, s + 0.5];
      walk(P, d, k, 'edge');
    } else {
      // out of a row of vias, anywhere free
      const x = 2 + (R()*(cw - 4) | 0), y = 2 + (R()*(ch - 4) | 0);
      if(occ[at(x, y)]) continue;
      walk([x + 0.5, y + 0.5], o.diag ? R()*8 | 0 : (R()*4 | 0)*2, Math.min(k, 4), 'via');
    }
  }
  // ---- small parts and stitching vias in what is left ----
  const room = (x, y, w, h, m) => { for(let j = y - m; j < y + h + m; j++) for(let i = x - m; i < x + w + m; i++) if(!inb(i, j) || occ[j*cw + i]) return false; return true; };
  const nSmd = Math.round(o.parts*cw*ch/170);
  for(let t = 0; t < nSmd*6 && smd.length < nSmd; t++){
    const horiz = R() < 0.5, w = horiz ? 3 : 2, h = horiz ? 2 : 3, x = 1 + (R()*(cw - w - 2) | 0), y = 1 + (R()*(ch - h - 2) | 0);
    if(!room(x, y, w, h, 1)) continue;
    for(let j = y; j < y + h; j++) for(let i = x; i < x + w; i++) occ[j*cw + i] = -2;
    smd.push({ x, y, w, h, horiz, cap: R() < 0.45 }); if(R() < 0.5) names.push({ kind: smd[smd.length - 1].cap ? 'C' : 'R', n: smd.length, x: x + w + 0.4, y: y + 0.2 });
  }
  const nVia = Math.round(o.parts*cw*ch/260);
  for(let t = 0; t < nVia*4 && vias.length < nVia; t++){ const x = 1 + (R()*(cw - 2) | 0), y = 1 + (R()*(ch - 2) | 0); if(!room(x, y, 1, 1, 1)) continue; occ[y*cw + x] = -2; vias.push([x + 0.5, y + 0.5]); }
  // the names: only where they don't sit on copper
  const named = names.filter(nm => { const x = Math.floor(nm.x), y = Math.floor(nm.y); return room(x, y, 3, 2, 0); });
  // ---- THE ERA (Ruby: today's boards → the future's and quantum ones → magitech) ----
  // Nothing of the layout moves: each chip, name and trace has its own era, set by its own hash, so more Era turns more
  // of the board toward the next one (at 0, every one is today's, exactly as before).
  const eh = k => { const v = Math.sin((k + 1)*91.17 + o.salt*12.9898)*43758.5453; return v - Math.floor(v); };
  const era = Math.max(0, Math.min(3, (o.era || 0)*3)), level = k => Math.min(3, Math.floor(era + eh(k)));
  const runes = (k, n) => Array.from({ length: n }, (_, i) => 'abcdefghijkl'[Math.floor(eh(k*7 + i)*12)]).join('');
  chips.forEach((c, i) => { c.era = level(100 + i); }); smd.forEach((p, i) => { p.era = level(501 + i); });
  const fits = (nm, txt) => room(Math.floor(nm.x), Math.floor(nm.y), Math.ceil(txt.length*0.96), 2, 0);
  const shown = named.filter(nm => {
    const lv = nm.chip ? nm.chip.era : level(500 + nm.n); if(!lv) return true;
    const txt = nm.kind === 'U' ? ['', 'NX' + nm.n, 'Q' + nm.n, runes(nm.n, 3)][lv] : ['', (nm.kind === 'C' ? 'CL' : 'PH') + nm.n, (nm.kind === 'C' ? 'CQ' : 'JJ') + nm.n, runes(600 + nm.n, 2)][lv];
    nm.text = txt; return fits(nm, txt); });
  // a rune or three beside a magitech trace's longest run
  const glyphs = [];
  traces.forEach((tr, ti) => { tr.id = ti; tr.era = level(800 + ti); });
  if(era > 0) traces.forEach((tr, ti) => { if(level(800 + ti) < 3 || tr.pts.length < 2) return;
    let best = 0, A = null, Bp = null; for(let i = 1; i < tr.pts.length; i++){ const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]); if(l > best){ best = l; A = tr.pts[i - 1]; Bp = tr.pts[i]; } }
    if(best < 6) return; const mx = (A[0] + Bp[0])/2, my = (A[1] + Bp[1])/2, dx = (Bp[0] - A[0])/best, dy = (Bp[1] - A[1])/best;
    const txt = runes(900 + ti, 1 + Math.floor(eh(950 + ti)*3)), x = mx - dy*1.4 - txt.length*0.48, y = my + dx*1.4 - 0.6;
    if(room(Math.floor(x), Math.floor(y), Math.ceil(txt.length*0.96), 2, 0)) glyphs.push({ x, y, text: txt }); });
  // ---- THE MARKINGS (Ruby: stamps, labels, glyphs, made-up technology, by the seed) ----
  // Found room for last, so they move nothing; each says what its own era would say.
  const stamps = [], nMarks = Math.round((o.marks || 0)*(1 + cw*ch/700));
  if(nMarks > 0){
    const name = () => CIR_SYLL[R()*16 | 0] + CIR_SYLL[R()*16 | 0] + (R() < 0.6 ? '-' + (2 + (R()*98 | 0)) : '');
    const place = (wc, hc) => { for(let t = 0; t < 60; t++){ const x = 1 + (R()*Math.max(1, cw - wc - 2) | 0), y = 1 + (R()*Math.max(1, ch - hc - 2) | 0);
      if(room(x, y, wc, hc, 1)){ for(let j = y; j < y + hc; j++) for(let i = x; i < x + wc; i++) occ[j*cw + i] = -4; return [x, y]; } } return null; };
    for(let k = 0; k < nMarks; k++){
      const lv = level(1000 + k), kind = k === 0 ? 'title' : k === 1 && o.marks > 0.35 ? 'egg' : R() < 0.25 && lv > 0 && lv < 3 ? 'matrix' : 'say';
      if(kind === 'egg'){ const at = place(3, 3); if(at) stamps.push({ kind, x: at[0] + 0.15, y: at[1] + 0.15, egg: R()*CIR_EGGS.length | 0 }); continue; }
      if(kind === 'matrix'){ const at = place(2, 2); if(at) stamps.push({ kind, x: at[0] + 0.1, y: at[1] + 0.1, bits: Array.from({ length: 36 }, () => R() < 0.5) }); continue; }
      const lines = kind === 'title' ? [lv === 3 ? runes(1100, 4) + ' ' + name() : name(), lv === 3 ? runes(1200, 3) : ['REV ', 'MK ', 'GEN ', 'CIRCLE '][lv] + 'ABCDEFGH'[R()*8 | 0]]
        : [lv === 3 && R() < 0.4 ? runes(1300 + k, 2 + (R()*4 | 0)) : CIR_SAYS[lv][R()*CIR_SAYS[lv].length | 0]];
      const wc = Math.ceil(Math.max(...lines.map(t => t.length))*0.96 + 0.6), hc = Math.ceil(lines.length*1.45 + 0.4), at = place(wc, hc);
      if(at) stamps.push({ kind, x: at[0], y: at[1], w: wc, h: hc, lines, box: kind === 'title' || R() < 0.35 });
    }
  }
  // ---- THE POEM KEPT CLEAR (Ruby: no traces under the text), cut away last, so the rest of the board never moves
  //      as the poem changes: what lies under it is lifted, and a trace cut by it ends in a via at the cut ----
  if(o.cut){
    const out = (x, y) => !o.cut(x, y), boxOut = (x, y, w, h) => out(x, y) && out(x + w, y) && out(x, y + h) && out(x + w, y + h) && out(x + w/2, y + h/2);
    const keepChips = new Set(chips.filter(c => boxOut(c.x - 1, c.y - 1, c.w + 2, c.h + 2)));
    const cutTraces = [];
    for(const tr of traces){
      let piece = [], first = true;
      const flush = (endsCut) => { if(piece.length >= 2){ let L = 0; for(let i = 1; i < piece.length; i++) L += Math.hypot(piece[i][0] - piece[i - 1][0], piece[i][1] - piece[i - 1][1]);
          if(L >= 1.2) cutTraces.push({ ...tr, pts: piece, start: first ? tr.start : 'via', end: endsCut ? 'via' : tr.end }); }
        piece = []; first = false; };
      for(let i = 0; i < tr.pts.length; i++){
        const a = tr.pts[i];
        if(i === 0){ if(out(a[0], a[1])) piece.push(a); else first = false; continue; }
        const b = tr.pts[i - 1], n = Math.max(1, Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1])*4));
        for(let k = 1; k <= n; k++){ const p = [b[0] + (a[0] - b[0])*k/n, b[1] + (a[1] - b[1])*k/n], o2 = out(p[0], p[1]);
          if(o2){ if(!piece.length && k < n){ piece.push(p); continue; } if(k === n) piece.push(a); }
          else if(piece.length){ piece.push(p); flush(true); } }
      }
      flush(false);
    }
    // (a trace that ran into a lifted chip keeps its pins' end only where the chip stays)
    return { chips: chips.filter(c => keepChips.has(c)), smd: smd.filter(p => boxOut(p.x, p.y, p.w, p.h)), vias: vias.filter(v => out(v[0], v[1])), traces: cutTraces,
      names: shown.filter(nm => (!nm.chip || keepChips.has(nm.chip)) && boxOut(nm.x, nm.y, (nm.text || 'U00').length*0.96, 1.2)),
      glyphs: glyphs.filter(gl => boxOut(gl.x, gl.y, gl.text.length*0.96, 1.2)), stamps: stamps.filter(st => boxOut(st.x, st.y, st.w || 3, st.h || 3)) };
  }
  return { chips, smd, vias, traces, names: shown, glyphs, stamps };
}
// A chip of another era, drawn in place of today's (its pins are drawn after, as today's are). What of it lights
// is copper with the chip's own grey (each trace's way), so Charge powers it as it powers the traces.
//   1 · the future's: a chamfered body with a window across it that lights, corner brackets for an outline
//   2 · quantum: no package at all, a cross of bare metal (a qubit) on the board, a serpentine resonator, a dashed keep-out
//   3 · magitech: a dark body set with gems that light, ringed by a sigil (a star in an oval)
function cirEraChip(c, K){
  const { CU, HT, PD, PT, EA, LG, rect, disc, line, poly, s, tw, g } = K, x0 = c.x - 0.1, y0 = c.y - 0.1, W = c.w + 0.2, H = c.h + 0.2, mx = c.x + c.w/2, my = c.y + c.h/2, m = Math.min(c.w, c.h);
  const h = k => { const v = Math.sin((c.x*31 + c.y*17 + k)*12.9898)*43758.5453; return v - Math.floor(v); };
  const used = c.pins.filter(p => p.rank >= 0), e = g(0.1 + 0.85*(used.length ? Math.max(...used.map(p => p.rank)) : h(9)));
  const lit = (draw) => { draw(CU, '#fff'); draw(PD, '#fff'); draw(EA, e); };
  const wide = c.w >= c.h, long = Math.max(c.w, c.h) > m*1.6;
  if(c.era === 1){
    const k = Math.min(0.9, m*0.25), body = [[x0 + k, y0], [x0 + W - k, y0], [x0 + W, y0 + k], [x0 + W, y0 + H - k], [x0 + W - k, y0 + H], [x0 + k, y0 + H], [x0, y0 + H - k], [x0, y0 + k]];
    poly(PT, body, '#fff'); poly(HT, body, 'rgb(205,205,205)');
    const win = wide ? [c.x + 0.7, my - 0.2, c.w - 1.4, 0.4] : [mx - 0.2, c.y + 0.7, 0.4, c.h - 1.4];
    lit((x, col) => rect(x, ...win, col)); rect(HT, ...win, 'rgb(214,214,214)');
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.12*s;
    for(const [ax, ay, sx, sy] of [[c.x - 1.15, c.y - 1.15, 1, 1], [c.x + c.w + 1.15, c.y - 1.15, -1, 1], [c.x - 1.15, c.y + c.h + 1.15, 1, -1], [c.x + c.w + 1.15, c.y + c.h + 1.15, -1, -1]]){
      LG.beginPath(); LG.moveTo(ax*s, (ay + sy*1.2)*s); LG.lineTo(ax*s, ay*s); LG.lineTo((ax + sx*1.2)*s, ay*s); LG.stroke(); }
    poly(LG, [[c.x - 1.15, c.y - 0.5], [c.x - 0.5, c.y - 1.15], [c.x - 1.15, c.y - 1.15]], '#fff');
    return;
  }
  if(c.era === 2){
    const ax = long ? (wide ? c.w*0.42 : 0.6) : Math.max(0.9, m*0.42), ay = long ? (wide ? 0.6 : c.h*0.42) : ax, aw = 0.45;
    for(const r of [[mx - ax, my - aw/2, ax*2, aw], [mx - aw/2, my - ay, aw, ay*2]]){ lit((x, col) => rect(x, ...r, col)); rect(HT, ...r, 'rgb(118,118,118)'); }
    // the resonator: a meander beside the cross, along the chip's long side
    if(c.w >= 4 && c.h >= 4){ const turns = 2 + Math.floor(h(1)*3), pitch = (c.w*0.5 - 0.6)/(turns*2), top = c.y + 0.5, bot = my - 0.7, pts = [[mx + 0.4, bot]];
      let x = mx + 0.4; for(let i = 0; i < turns*2; i++){ pts.push([x, i % 2 ? bot : top]); x += pitch; pts.push([x, i % 2 ? bot : top]); }
      line(CU, pts, tw*0.55*s, '#fff'); line(PD, pts, tw*0.55*s, '#fff'); line(HT, pts, tw*0.55*s, 'rgb(104,104,104)'); }
    // flux lines to the middle pin of each side
    for(const sd of [0, 1, 2, 3]){ const ps = c.pins.filter(p => p.side === sd); if(!ps.length) continue; const p = ps[ps.length >> 1];
      const end = sd === 0 ? [mx, my - ay] : sd === 1 ? [mx + ax, my] : sd === 2 ? [mx, my + ay] : [mx - ax, my];
      line(CU, [end, [p.x, p.y]], tw*0.45*s, '#fff'); line(PD, [end, [p.x, p.y]], tw*0.3*s, '#fff'); }
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; if(LG.setLineDash) LG.setLineDash([0.5*s, 0.4*s]);
    LG.strokeRect((c.x - 1.15)*s, (c.y - 1.15)*s, (c.w + 2.3)*s, (c.h + 2.3)*s); if(LG.setLineDash) LG.setLineDash([]);
    return;
  }
  // MAGITECH (Ruby: "it starts to go steampunk, with crystals and things that look maybe low-tech combined with things
  // that look extremely high-tech"): a brass gear for a body, spoked over the dark, a cut crystal set in its hub that
  // lights with the charge, rivets round it; a long one is a riveted brass bar set with a row of crystals
  const { BR } = K, crystal = (cx, cy, r) => { const pts = [[cx, cy - r], [cx + r*0.5, cy - r*0.45], [cx + r*0.5, cy + r*0.45], [cx, cy + r], [cx - r*0.5, cy + r*0.45], [cx - r*0.5, cy - r*0.45]];
    lit((x, col) => poly(x, pts, col)); poly(HT, pts, 'rgb(240,240,240)'); line(HT, [[cx, cy - r], [cx, cy + r]], 0.06*s, 'rgb(255,255,255)'); };
  const rivet = (x, y) => { disc(BR, [x, y], 0.2, '#fff'); disc(HT, [x, y], 0.2, 'rgb(214,214,214)'); };
  if(!long){
    const R = m/2 + 0.35, teeth = 8 + Math.floor(h(2)*6), hub = Math.max(0.55, R*0.38), spokes = 3 + Math.floor(h(3)*3);
    disc(PT, [mx, my], R, '#fff'); disc(HT, [mx, my], R, 'rgb(150,150,150)');
    const gear = []; for(let k = 0; k < teeth*4; k++){ const a = (k/(teeth*4))*Math.PI*2 + h(4), on = (k % 4) < 2, rr = on ? R + 0.32 : R; gear.push([mx + Math.cos(a)*rr, my + Math.sin(a)*rr]); }
    poly(BR, gear, '#fff'); poly(HT, gear, 'rgb(200,200,200)');
    // the windows between the spokes show the dark beneath
    const r1 = R - 0.35, r0 = hub + 0.2;
    if(r1 - r0 > 0.25) for(let k = 0; k < spokes; k++){ const a0 = (k + 0.18)/spokes*Math.PI*2 + h(5), a1 = (k + 0.82)/spokes*Math.PI*2 + h(5);
      for(const X of [BR, HT]){ X.fillStyle = X === BR ? '#000' : 'rgb(150,150,150)'; X.beginPath(); X.arc(mx*s, my*s, r1*s, a0, a1); X.arc(mx*s, my*s, r0*s, a1, a0, true); X.closePath(); X.fill(); } }
    disc(BR, [mx, my], hub, '#000'); crystal(mx, my, hub*0.95);
    for(let k = 0; k < 4; k++){ const a = k*Math.PI/2 + Math.PI/4; rivet(mx + Math.cos(a)*(R + 0.75), my + Math.sin(a)*(R + 0.75)); }
  } else {
    const L = Math.max(c.w, c.h), n = Math.max(1, Math.round(L/2.6)), ux = wide ? 1 : 0, uy = wide ? 0 : 1, bw = wide ? W : W, bh = H;
    rect(BR, x0, y0, bw, bh, '#fff'); rect(HT, x0, y0, bw, bh, 'rgb(196,196,196)');
    for(let k = 0; k < n; k++){ const t = n === 1 ? 0 : -L/2 + 1.3 + (L - 2.6)*k/(n - 1), cx = mx + ux*t, cy = my + uy*t, r = Math.max(0.4, m*0.42);
      disc(BR, [cx, cy], r + 0.08, '#000'); crystal(cx, cy, r); }
    rivet(mx - ux*(L/2 - 0.35) , my - uy*(L/2 - 0.35)); rivet(mx + ux*(L/2 - 0.35), my + uy*(L/2 - 0.35));
  }
  // the silkscreen: an engraved plate's border, its corners clipped, as a maker's plate would have
  { const k = 0.6, X0 = c.x - 1.15, Y0 = c.y - 1.15, X1 = c.x + c.w + 1.15, Y1 = c.y + c.h + 1.15;
    poly(LG, [[X0 + k, Y0], [X1 - k, Y0], [X1, Y0 + k], [X1, Y1 - k], [X1 - k, Y1], [X0 + k, Y1], [X0, Y1 - k], [X0, Y0 + k]], '#fff', false, 0.1); }
}
// The board drawn: s pixels a cell. Each of the part's maps is its own canvas (see the part).
function genDrawCircuit(B, ww, wh, s, o){
  const mk = () => kitCanvas(ww, wh), cv = {}, fillAll = (x, c) => { x.fillStyle = c; x.fillRect(0, 0, ww, wh); };
  for(const k of ['copper', 'height', 'each', 'data', 'pads', 'parts', 'legend', 'brass']){ const [c, x] = mk(); fillAll(x, k === 'height' ? 'rgb(77,77,77)' : '#000'); x.lineCap = 'round'; x.lineJoin = 'round'; cv[k] = [c, x]; }
  const g = v => { const q = Math.round(Math.max(0, Math.min(1, v))*255); return `rgb(${q},${q},${q})`; };
  const line = (x, pts, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0]*s, p[1]*s) : x.moveTo(p[0]*s, p[1]*s)); x.stroke(); };
  const disc = (x, p, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(p[0]*s, p[1]*s, r*s, 0, Math.PI*2); x.fill(); };
  const rect = (x, X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X*s, Y*s, W*s, H*s); };
  const [, CU] = cv.copper, [, HT] = cv.height, [, EA] = cv.each, [, DA] = cv.data, [, PD] = cv.pads, [, PT] = cv.parts, [, LG] = cv.legend, [, BR] = cv.brass;
  const tw = 0.34;
  // the traces: copper, raised a little, and each one's own grey (drawn wide, so a cutoff takes the whole trace)
  for(const tr of B.traces){
    const e = g(0.1 + 0.85*tr.rank);   // (never quite white: a cutoff at the top passes none)
    line(CU, tr.pts, tw*s, '#fff'); line(HT, tr.pts, tw*s, 'rgb(107,107,107)'); line(EA, tr.pts, 0.78*s, e);
    const ends = [];
    if(tr.start === 'via') ends.push([tr.pts[0], 'via']);
    if(tr.end) ends.push([tr.pts[tr.pts.length - 1], tr.end]);
    for(const [p, kind] of ends){
      if(kind === 'via'){ disc(CU, p, 0.4, '#fff'); disc(HT, p, 0.4, 'rgb(117,117,117)'); disc(HT, p, 0.16, 'rgb(31,31,31)'); disc(CU, p, 0.16, '#000'); disc(PD, p, 0.4, '#fff'); disc(PD, p, 0.16, '#000'); disc(EA, p, 0.46, e); }
      else { rect(CU, p[0] - 0.36, p[1] - 0.36, 0.72, 0.72, '#fff'); rect(HT, p[0] - 0.36, p[1] - 0.36, 0.72, 0.72, 'rgb(117,117,117)'); rect(PD, p[0] - 0.36, p[1] - 0.36, 0.72, 0.72, '#fff'); rect(EA, p[0] - 0.42, p[1] - 0.42, 0.84, 0.84, e); }
    }
  }
  // the silkscreen's letters (and runes), px cells a font pixel
  const write = (txt, X, Y, px = 0.24) => { let x0 = X; for(const ch of txt){ const bits = CIR_FONT[ch] || ''; for(let r = 0; r < 5; r++) for(let q = 0; q < 3; q++) if(bits[r*3 + q] === '1') rect(LG, x0 + q*px, Y + r*px, px*0.92, px*0.92, '#fff'); x0 += px*4; } };
  const poly = (x, pts, col, fill = true, w = 0.12) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0]*s, p[1]*s) : x.moveTo(p[0]*s, p[1]*s)); x.closePath();
    if(fill){ x.fillStyle = col; x.fill(); } else { x.strokeStyle = col; x.lineWidth = w*s; x.stroke(); } };
  // the chips: a dark body standing well above the board, a pin pad at every pin, a dimple at pin one
  // (or, as the Era turns them: the future's, a quantum qubit, a magitech sigil — their pins are where they were)
  for(const c of B.chips){
    if(c.era){ cirEraChip(c, { CU, HT, PD, PT, EA, LG, BR, rect, disc, line, poly, s, tw, g });
      for(const p of c.pins){ const [dx, dy] = CIR_DIRS[p.dir], L = 0.75, W = 0.4, cx = p.x - dx*0.15, cy = p.y - dy*0.15;
        const [X, Y, Wd, Hd] = dx ? [cx - L/2, cy - W/2, L, W] : [cx - W/2, cy - L/2, W, L];
        rect(CU, X, Y, Wd, Hd, '#fff'); rect(PD, X, Y, Wd, Hd, '#fff'); rect(HT, X, Y, Wd, Hd, 'rgb(122,122,122)');
        if(p.rank >= 0) rect(EA, X - 0.05, Y - 0.05, Wd + 0.1, Hd + 0.1, g(0.1 + 0.85*p.rank)); }
      continue; }
    rect(PT, c.x - 0.1, c.y - 0.1, c.w + 0.2, c.h + 0.2, '#fff');
    rect(HT, c.x - 0.1, c.y - 0.1, c.w + 0.2, c.h + 0.2, 'rgb(205,205,205)'); rect(HT, c.x + 0.25, c.y + 0.25, c.w - 0.5, c.h - 0.5, 'rgb(218,218,218)');
    disc(HT, [c.x + 0.9, c.y + 0.9], 0.3, 'rgb(196,196,196)');
    for(const p of c.pins){ const [dx, dy] = CIR_DIRS[p.dir], L = 0.75, W = 0.4, cx = p.x - dx*0.15, cy = p.y - dy*0.15;
      const [X, Y, Wd, Hd] = dx ? [cx - L/2, cy - W/2, L, W] : [cx - W/2, cy - L/2, W, L];
      rect(CU, X, Y, Wd, Hd, '#fff'); rect(PD, X, Y, Wd, Hd, '#fff'); rect(HT, X, Y, Wd, Hd, 'rgb(122,122,122)');
      if(p.rank >= 0) rect(EA, X - 0.05, Y - 0.05, Wd + 0.1, Hd + 0.1, g(0.1 + 0.85*p.rank)); }
    // the silkscreen: an outline round the body and its pins, a notch at pin one
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.12*s; LG.strokeRect((c.x - 1.15)*s, (c.y - 1.15)*s, (c.w + 2.3)*s, (c.h + 2.3)*s);
    disc(LG, [c.x - 1.15, c.y - 1.15], 0.32, '#fff');
  }
  // small parts: two pads and a body between
  for(const p of B.smd){
    const [a, b] = p.horiz ? [[p.x, p.y + 0.5, 0.9, 1], [p.x + 2.1, p.y + 0.5, 0.9, 1]] : [[p.x + 0.5, p.y, 1, 0.9], [p.x + 0.5, p.y + 2.1, 1, 0.9]];
    for(const q of [a, b]){ rect(CU, ...q, '#fff'); rect(PD, ...q, '#fff'); rect(HT, ...q, 'rgb(122,122,122)'); }
    const body = p.horiz ? [p.x + 0.55, p.y + 0.45, 1.9, 1.1] : [p.x + 0.45, p.y + 0.55, 1.1, 1.9];
    if(p.era === 3){
      // a valve: a glass envelope in brass end-caps, its filament glowing with the charge (each trace's grey: one hashed)
      const [bx, by, bw, bh] = body, e = g(0.1 + 0.85*((Math.sin((p.x*7 + p.y*13)*12.9898)*43758.5453 % 1 + 1) % 1));
      rect(PD, bx + 0.1, by + 0.1, bw - 0.2, bh - 0.2, 'rgb(90,90,90)'); rect(HT, bx, by, bw, bh, 'rgb(176,176,176)');
      const cap = p.horiz ? [[bx, by, 0.3, bh], [bx + bw - 0.3, by, 0.3, bh]] : [[bx, by, bw, 0.3], [bx, by + bh - 0.3, bw, 0.3]];
      for(const q of cap){ rect(BR, ...q, '#fff'); rect(HT, ...q, 'rgb(196,196,196)'); }
      const fil = p.horiz ? [[bx + 0.4, by + bh/2], [bx + bw - 0.4, by + bh/2]] : [[bx + bw/2, by + 0.4], [bx + bw/2, by + bh - 0.4]];
      line(CU, fil, 0.12*s, '#fff'); line(EA, fil, 0.3*s, e);
      continue;
    }
    rect(PT, ...body, p.cap ? 'rgb(150,150,150)' : '#fff'); rect(HT, ...body, p.cap ? 'rgb(168,168,168)' : 'rgb(158,158,158)');
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; LG.strokeRect((p.x - 0.25)*s, (p.y - 0.25)*s, (p.w + 0.5)*s, (p.h + 0.5)*s);
  }
  // a magitech trace has a coil wound round its longest run: brass wire, loop on loop
  for(const tr of B.traces){ if(tr.era !== 3 || tr.pts.length < 2) continue;
    let best = 0, A = null, Bp = null; for(let i = 1; i < tr.pts.length; i++){ const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]); if(l > best){ best = l; A = tr.pts[i - 1]; Bp = tr.pts[i]; } }
    if(best < 5) continue;
    const dx = (Bp[0] - A[0])/best, dy = (Bp[1] - A[1])/best, len = Math.min(best*0.5, 4), t0 = (best - len)/2, turns = Math.round(len/0.28);
    for(let k = 0; k <= turns; k++){ const t = t0 + len*k/turns, cx = A[0] + dx*t, cy = A[1] + dy*t;
      for(const [X, col, wd] of [[BR, '#fff', 0.09], [HT, 'rgb(190,190,190)', 0.09]]){ X.strokeStyle = col; X.lineWidth = wd*s; X.beginPath();
        X.ellipse(cx*s, cy*s, 0.12*s, 0.42*s, Math.atan2(dy, dx), 0, Math.PI*2); X.stroke(); } } }
  for(const v of B.vias){ disc(CU, v, 0.38, '#fff'); disc(CU, v, 0.15, '#000'); disc(PD, v, 0.38, '#fff'); disc(PD, v, 0.15, '#000'); disc(HT, v, 0.38, 'rgb(115,115,115)'); disc(HT, v, 0.15, 'rgb(31,31,31)'); }
  // the parts' names, in the silkscreen's little font (each in its era's words)
  for(const nm of B.names) write(nm.text || nm.kind + nm.n, nm.x, nm.y);
  for(const gl of B.glyphs || []) write(gl.text, gl.x, gl.y);
  // the Markings: stamps of what each era would print, a code block, and once a little picture
  for(const st of B.stamps || []){
    if(st.kind === 'egg'){ const bits = CIR_EGGS[st.egg], px = 0.38; for(let r = 0; r < 7; r++) for(let q = 0; q < 7; q++) if(bits[r*7 + q] === '1') rect(LG, st.x + q*px, st.y + r*px, px*0.9, px*0.9, '#fff'); continue; }
    if(st.kind === 'matrix'){ const px = 0.3; LG.strokeStyle = '#fff'; LG.lineWidth = 0.08*s; LG.strokeRect(st.x*s, st.y*s, 6*px*s, 6*px*s);
      st.bits.forEach((b, i) => { if(b) rect(LG, st.x + (i % 6)*px, st.y + Math.floor(i/6)*px, px*0.9, px*0.9, '#fff'); }); continue; }
    st.lines.forEach((t, i) => write(t, st.x + 0.3, st.y + 0.35 + i*1.45));
    if(st.box){ LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; LG.strokeRect((st.x + 0.05)*s, (st.y + 0.05)*s, (st.w - 0.1)*s, (st.h - 0.1)*s); }
  }
  // DATA: bright pulses running along the traces, a comet each (the head bright, the tail fading behind it), and
  // packets of bits; each trace's are fixed by its own hash, so more Data Flow adds pulses and moves none
  const flow = o.flow;
  if(flow > 0) B.traces.forEach((tr, tix) => { const ti = tr.id ?? tix;
    const P = tr.pts, seg = []; let L = 0;
    for(let i = 1; i < P.length; i++){ const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push([L, l, P[i - 1], P[i]]); L += l; }
    if(L < 1) return;
    const point = u => { for(const [s0, l, a, b] of seg) if(u <= s0 + l || seg[seg.length - 1][2] === a){ const f = l ? Math.max(0, Math.min(1, (u - s0)/l)) : 0; return [a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f]; } return P[P.length - 1]; };
    const hs = k => { const v = Math.sin((ti + 1)*127.1 + k*311.7 + o.salt*17.3)*43758.5453; return v - Math.floor(v); };
    const slots = Math.ceil(L/3);
    for(let k = 0; k < slots; k++){
      if(hs(k*3) > flow*0.9) continue;
      const head = hs(k*3 + 1)*L, len = 0.8 + hs(k*3 + 2)*2.6*(0.5 + flow), back = hs(k*7 + 5) < 0.5;
      if(hs(k*5 + 9) < 0.28*flow){
        // a packet: a run of bits, some lit
        for(let b = 0; b < 6; b++){ if(hs(k*13 + b) < 0.45) continue; const u = head + (back ? -b : b)*0.42; if(u < 0 || u > L) continue; disc(DA, point(u), 0.13, '#fff'); }
        continue; }
      // a comet: ten short strokes, brighter toward the head
      for(let q = 0; q < 10; q++){ const u0 = head - (back ? -1 : 1)*len*(q + 1)/10, u1 = head - (back ? -1 : 1)*len*q/10;
        if(Math.max(u0, u1) < 0 || Math.min(u0, u1) > L) continue;
        DA.globalAlpha = Math.pow(1 - q/10, 1.6); line(DA, [point(Math.max(0, Math.min(L, u0))), point(Math.max(0, Math.min(L, u1)))], tw*0.9*s, '#fff'); }
      DA.globalAlpha = 1; disc(DA, point(Math.max(0, Math.min(L, head))), 0.2, '#fff');
    }
  });
  return cv;
}

// ---------------- A RINGWORLD, SEEN FROM ITS FLOOR ----------------
// (Ruby: a ringworld, Niven's or Halo's, but abstract; its light the star at its centre, so the dial is the camera and
// one slider the light.) A ring of radius 1 round its star, `W` wide, walled at both rims; the camera stands on its
// inner floor. Each pixel's ray is followed to what it meets: the floor (near ground, or far off where the ring rises
// into the arch overhead), a rim wall, the star, the shadow squares that make its nights, or open space. What the
// part hands on are maps OF the world — where on the ring each pixel shows (along it and across it, in band widths),
// how far off, how fine a pixel is there, and where it is day — so any noise or picture can be laid on the ring.
const RING_SQ = 10, RING_COV = 0.36, RING_SQR = 0.15;   // shadow squares round the star, and the share of each turn they cover (night)
function ringLook(o){
  const W = o.band, Hw = o.walls, hc = o.altitude, R = 1, z0 = o.place*W*0.45, fov = o.lens*Math.PI/180, f = 0.5/Math.tan(fov/2);
  const psi = o.look*Math.PI/180, th = o.lift*Math.PI/180, hx = Math.cos(psi), hz = Math.sin(psi);
  // up is toward the ring's axis (−x); along the ring is +y, across it +z. f: forward; r: right; u: the screen's up
  const fx = -Math.sin(th), fy = Math.cos(th)*hx, fz = Math.cos(th)*hz;
  // right = h × up, with h = (0, hx, hz), up = (−1, 0, 0): (0, −hz, hx)
  const rx = 0, ry = -hz, rz = hx;
  const ux = ry*fz - rz*fy, uy = rz*fx - rx*fz, uz = rx*fy - ry*fx;
  // the shadow squares turn so that the camera stands where Daylight says: 1 noon (mid-gap), 0 midnight (mid-square)
  // (0 midnight, behind the middle of a square; 0.5 the very edge of its shadow, dawn; 1 noon, the middle of a gap)
  const dl = Math.max(0, Math.min(1, o.daylight)), per = Math.PI*2/RING_SQ, uc = dl < 0.5 ? RING_COV/2 + dl*RING_COV : RING_COV + (dl - 0.5)*(1 - RING_COV), q0 = -uc*per;
  // the air the walls hold in: thinning with height (Hs, its scale height), so a column straight up is o.air deep
  // (its optical depth) and the ground far along is hazed far more than the ground at your feet
  const Hs = Math.min(Hw*0.5, W*0.025) + 1e-6, L0 = Hs/Math.max(0.005, o.air);
  const L = { W, Hw, hc, R, z0, f, fx, fy, fz, rx, ry, rz, ux, uy, uz, per, q0, Hs, L0, Px: R - hc };
  ringBuild(L, o);
  return L;
}
// THE CONSTRUCTION (Ruby: spires, bare scaffolding, spill mountains — "the seed should determine the environment and
// the construction of the ringworld to some degree, and it should never be bare"). From the seed: which works this
// ring has and how many, never none; Structures (o.build, 0.25 at its lowest) raises them.
function ringBuild(L, o){
  let st = (o.seed >>> 0) || 1; const rnd = () => { st = Math.imul(st ^ (st >>> 15), 2246822507) + 0x6D2B79F5 | 0; st = Math.imul(st ^ (st >>> 13), 3266489909); return ((st ^= st >>> 16) >>> 0)/4294967296; };
  const b = o.build, W = L.W, style = rnd();
  // spires: needles standing up from the floor, many near you and a few far round the ring (the seed may grow a forest)
  const forest = style < 0.3, nSp = Math.round((forest ? 18 : 8) + (forest ? 40 : 22)*b*(0.5 + rnd()));
  L.spires = [];
  for(let i = 0; i < nSp; i++){
    // (none closer than a quarter of the band: a needle at your elbow would fill the view)
    const near = i < nSp*0.7, side = rnd() < 0.5 ? -1 : 1, phi = near ? side*W*(0.3 + Math.pow(rnd(), 1.5)*4) : (rnd()*2 - 1)*Math.PI, z = (rnd()*2 - 1)*W*0.45;
    const h = L.Hw*(0.8 + rnd()*(forest ? 1.8 : 3))*(0.6 + b*0.8), r = Math.max(W*0.0015, h*(0.008 + rnd()*0.012));
    const cx = L.R*Math.cos(phi), cy = L.R*Math.sin(phi), ux = -Math.cos(phi), uy = -Math.sin(phi);
    // (where it stands from the camera, for a quick test of whether a ray could come near it at all)
    const mx = cx + ux*h/2 - L.Px, my = cy + uy*h/2, mz = z - L.z0, dist = Math.hypot(mx, my, mz), rho = h/2 + r*2;
    const tx = cx + ux*h - L.Px, ty = cy + uy*h, tz = z - L.z0, tl = Math.hypot(tx, ty, tz), glowR = Math.max(r*1.2, W*0.002);
    L.spires.push({ phi, z, h, r, glowR, tip: [tx/tl, ty/tl, tz/tl], tl, tipCos: Math.cos(Math.min(1.5, 3*glowR/tl)), bx: cx, by: cy, ux, uy, dir: [mx/dist, my/dist, mz/dist], cosB: dist > rho ? Math.cos(Math.asin(rho/dist)) : -1 });
  }
  // scaffolding: stretches of floor left unfinished, an open lattice over the void (more of it on some rings)
  L.scaf = { on: style > 0.15, amount: (0.08 + 0.3*b)*(style > 0.7 ? 1.6 : 1), cell: 0.05 + rnd()*0.07, beam: 0.14 + rnd()*0.1, salt: (rnd()*1e6) | 0 };
  // the rare seam: now and then the edge of the world shows (Ruby's egg), one ring in seven
  L.seam = ((o.seed >>> 0) % 7) === 3;
}
// the scaffolding's lattice, filtered by a pixel's own footprint (box-filtered beams: no shimmer at any distance)
function ringLattice(L, a, c, foot){
  const S = L.scaf; if(!S.on) return [0, 0];
  const reg = mnValue(a*1.1 + 3.7, c*2.2 + 9.1, S.salt), wR = genClamp((reg - (1 - S.amount))/0.04)*genClamp((Math.abs(a) - 1.5)/2);
  if(wR <= 0) return [0, 0];
  const bw = S.beam, F = x => Math.floor(x)*bw + Math.min(x - Math.floor(x), bw);
  const cover = (x, w) => w < 1e-6 ? ((x - Math.floor(x)) < bw ? 1 : 0) : Math.min(1, Math.max(0, (F(x + w/2) - F(x - w/2))/w));
  const fw = foot/S.cell, cu = cover(a/S.cell, fw), cv = cover(c/S.cell, fw), beams = 1 - (1 - cu)*(1 - cv);
  return [wR*beams, wR*(1 - beams)];
}
// day at a ring angle: 1 in a gap between the squares, 0 behind one, a soft edge (the star's own size) between
function ringDay(L, phi){ let u = (phi - L.q0)/L.per; u -= Math.floor(u);
  const sd = u >= RING_COV ? Math.min(u - RING_COV, 1 - u) : -Math.min(u, RING_COV - u), t = genClamp(0.5 + sd/0.09); return t*t*(3 - 2*t); }
// one ray: what it meets. Returns { kind: 0 space, 1 floor, 2 wall, 3 star, 4 square, t, phi, z, h (height up a wall), air, cosI }
function ringRay(L, dx, dy, dz, air){
  const Px = L.Px, z0 = L.z0, a = dx*dx + dy*dy, b = Px*dx, c = Px*Px - L.R*L.R;
  let hit = null;
  if(a > 1e-12){ const t = (-b + Math.sqrt(b*b - a*c))/a, z = z0 + t*dz;
    if(Math.abs(z) <= L.W/2){ const X = Px + t*dx, Y = t*dy; hit = { kind: 1, t, phi: Math.atan2(Y, X), z, h: 0, cosI: Math.abs(X*dx + Y*dy)/L.R }; }
    else if(Math.abs(dz) > 1e-12){ const zw = Math.sign(dz)*L.W/2, tw = (zw - z0)/dz, X = Px + tw*dx, Y = tw*dy, rho = Math.sqrt(X*X + Y*Y);
      if(rho >= L.R - L.Hw) hit = { kind: 2, t: tw, phi: Math.atan2(Y, X), z: zw, h: (L.R - rho)/L.W, cosI: Math.abs(dz) }; } }
  // the shadow squares: a ring of panels close round the star, 0.6 band widths tall
  const Rq = RING_SQR, aq = a, cq = Px*Px - Rq*Rq, dq = b*b - aq*cq;
  if(aq > 1e-12 && dq > 0){ const t1 = (-b - Math.sqrt(dq))/aq;
    if(t1 > 0 && (!hit || t1 < hit.t)){ const z = z0 + t1*dz; if(Math.abs(z) <= L.W*0.3){ const X = Px + t1*dx, Y = t1*dy; let u = (Math.atan2(Y, X) - L.q0)/L.per; u -= Math.floor(u);
      if(u < RING_COV) hit = { kind: 4, t: t1, phi: 0, z, h: 0, cosI: 1 }; } } }
  // the spires: a needle, tapering, along its own up (toward the axis) from its foot on the floor
  if(L.spires) for(const sp of L.spires){
    if(dx*sp.dir[0] + dy*sp.dir[1] + dz*sp.dir[2] < sp.cosB) continue;
    // the closest approach of the ray (P + tD) and the spire's axis (B + uA·s, 0 ≤ s ≤ h)
    const wx = Px - sp.bx, wy = -sp.by, wz = z0 - sp.z, b2 = dx*sp.ux + dy*sp.uy, d1 = dx*wx + dy*wy + dz*wz, e1 = sp.ux*wx + sp.uy*wy, den = 1 - b2*b2;
    if(den < 1e-9) continue;
    let t = (b2*e1 - d1)/den, sv = (e1 - b2*d1)/den;
    if(sv < 0 || sv > sp.h || t <= 0 || (hit && t > hit.t)) continue;
    const qx = Px + t*dx - (sp.bx + sp.ux*sv), qy = t*dy - (sp.by + sp.uy*sv), qz = z0 + t*dz - sp.z, rr = sp.r*(1 - 0.85*sv/sp.h);
    if(qx*qx + qy*qy + qz*qz <= rr*rr) hit = { kind: 2, t, phi: sp.phi, z: sp.z + (qz >= 0 ? 1 : -1)*L.W*0.5, h: sv/L.W + 0.3, cosI: 0.5, spire: sv/sp.h };
  }
  // the star (radius 0.02) at the centre
  const cs = Px*Px - 0.0004, ds = b*b - (dx*dx + dy*dy + dz*dz)*cs;
  if(ds > 0){ const ts = (-b - Math.sqrt(ds))/(dx*dx + dy*dy + dz*dz); if(ts > 0 && (!hit || ts < hit.t)) hit = { kind: 3, t: ts, phi: 0, z: 0, h: 0, cosI: 1 }; }
  if(!hit) hit = { kind: 0, t: 4, phi: 0, z: 0, h: 0, cosI: 1 };
  hit.air = air ? ringAir(L, dx, dy, dz, a, b, hit) : 0;
  return hit;
}
// the air a ray passes through (its optical depth), summed where there is air: near the camera, and near the far floor it
// meets (the ring's middle, far from any floor, is empty). Between the walls only.
// the air's sample points along a stretch: crowded toward its near end (0) or its far end (1), as cubes
const RING_AIR = [0, 1].map(far => { const n = 14, m = [], w = []; for(let k = 0; k < n; k++){ const a = k/n, b = (k + 1)/n, c = (a + b)/2;
  const F = x => far ? 1 - (1 - x)*(1 - x)*(1 - x) : x*x*x; m.push(F(c)); w.push(F(b) - F(a)); } return { n, m, w }; });
function ringAir(L, dx, dy, dz, a, b, hit){
  const Px = L.Px, top = L.R - L.Hs*7, ci = Px*Px - top*top, di = b*b - a*ci, end = hit.kind === 1 || hit.kind === 2 ? hit.t : 3;
  const segs = [];
  if(a <= 1e-12 || di <= 0) segs.push([0, end]);
  else { const t1 = (-b - Math.sqrt(di))/a, t2 = (-b + Math.sqrt(di))/a; segs.push([0, Math.min(end, Math.max(0, t1))]); if(t2 < end) segs.push([Math.max(0, t2), end]); }
  let tau = 0;
  // (samples crowd toward the camera's end of the first stretch and the far floor's end of the second, where the air is:
  //  evenly spaced, a ray skimming over low walls stepped clean past the thin air beside you)
  segs.forEach(([t0, t1], si) => { if(t1 <= t0) return; const S = RING_AIR[si];
    for(let k = 0; k < S.n; k++){ const dt = S.w[k]*(t1 - t0), t = t0 + S.m[k]*(t1 - t0), z = L.z0 + t*dz, over = Math.abs(z) - L.W/2;
      // (past the walls the air thins away, not at a line: an edge in the sky gave the world away)
      const X = Px + t*dx, Y = t*dy, h = L.R - Math.sqrt(X*X + Y*Y); if(h < 0) continue; tau += Math.exp(-h/L.Hs - (over > 0 ? over/(L.W*0.08) : 0))*dt; } });
  return tau/L.L0;
}
function genRingView(ww, wh, unit, o){
  const L = ringLook(o), N = ww*wh, along = new Float32Array(N), across = new Float32Array(N), dist = new Float32Array(N), detail = new Float32Array(N);
  const sky = new Float32Array(N), walls = new Float32Array(N), star = new Float32Array(N), day = new Float32Array(N), squares = new Float32Array(N), airs = new Float32Array(N);
  const scaf = new Float32Array(N), open = new Float32Array(N), seam = new Float32Array(N), skyAir = new Float32Array(N);
  // (the day where the camera stands: the air about it is lit by it, whatever lies beyond)
  const here = new Float32Array(N).fill(ringDay(L, 0)), beacon = new Float32Array(N);
  const px = 1/unit, alpha = px/L.f, D3 = new Float64Array(3);
  const ray = (sx, sy) => { const dx = L.f*L.fx + sx*L.rx - sy*L.ux, dy = L.f*L.fy + sx*L.ry - sy*L.uy, dz = L.f*L.fz + sx*L.rz - sy*L.uz, l = Math.sqrt(dx*dx + dy*dy + dz*dz); D3[0] = dx/l; D3[1] = dy/l; D3[2] = dz/l; return D3; };
  // what each pixel's CORNER sees (shared by the four pixels round it): their mix is the pixel's coverage, its edges smooth
  const cw = ww + 1, K = new Uint8Array(cw*(wh + 1));
  for(let y = 0; y <= wh; y++) for(let x = 0; x <= ww; x++){ const d = ray((x - ww/2)*px, (y - wh/2)*px); K[y*cw + x] = ringRay(L, d[0], d[1], d[2], false).kind; }
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const q = y*ww + x, sx = (x + 0.5 - ww/2)*px, sy = (y + 0.5 - wh/2)*px, ks = [K[y*cw + x], K[y*cw + x + 1], K[(y + 1)*cw + x], K[(y + 1)*cw + x + 1]];
    const d = ray(sx, sy), dx = d[0], dy = d[1], dz = d[2], c = ringRay(L, dx, dy, dz, true);
    let n0 = 0, n2 = 0, n3 = 0, n4 = 0; for(const k of ks){ if(k === 0) n0++; else if(k === 2) n2++; else if(k === 3) n3++; else if(k === 4) n4++; }
    // (the centre counts as much as the corners together)
    const w = k => (k === c.kind ? 0.5 : 0) + 0.125*(k === 0 ? n0 : k === 2 ? n2 : k === 3 ? n3 : n4);
    const space = w(0) + w(3) + w(4);
    sky[q] = space; walls[q] = w(2); star[q] = w(3); squares[q] = w(4);
    // the star's glow in the air: by the angle from it (it stands straight up, at −x)
    const cosA = Math.max(-1, Math.min(1, -dx));
    if(cosA > 0.9){ const ang = Math.acos(cosA), glow = (space - w(4))*(Math.exp(-ang*ang/0.0016)*0.8 + Math.exp(-ang*ang/0.04)*0.25); star[q] = Math.min(1, star[q] + glow); }
    let H = c.kind === 1 || c.kind === 2 ? c : null;
    // (an edge pixel whose centre missed the ring: the ring's coordinates from a corner that met it)
    if(!H) for(let k = 0; k < 4 && !H; k++) if(ks[k] === 1 || ks[k] === 2){ const e = ray(sx + ((k & 1) - 0.5)*px, sy + ((k >> 1) - 0.5)*px), h = ringRay(L, e[0], e[1], e[2], false); if(h.kind === 1 || h.kind === 2) H = h; }
    if(H){ along[q] = H.phi/L.W; across[q] = H.kind === 2 ? (H.z > 0 ? 1 + H.h : -H.h) : H.z/L.W + 0.5;
      dist[q] = 1 - Math.exp(-H.t/(L.W*6)); detail[q] = H.t*alpha/Math.max(0.03, H.cosI)/L.W; day[q] = ringDay(L, H.phi);
      // the unfinished floor: its beams (metal), and the void seen between them (space shows through)
      if(H.kind === 1){ const [bm, op] = ringLattice(L, along[q], across[q], detail[q]); const fl = 1 - space - w(2); scaf[q] = bm*fl; open[q] = op*fl; } }
    else { dist[q] = 1; detail[q] = 1; day[q] = here[0]; }
    airs[q] = 1 - Math.exp(-c.air);
    // the air of the sky part of a pixel: an edge pixel whose centre met the ring takes it from a corner that saw space
    skyAir[q] = airs[q];
    if(space > 0 && !(c.kind === 0 || c.kind === 3 || c.kind === 4)) for(let k = 0; k < 4; k++) if(ks[k] === 0){ const e = ray(sx + ((k & 1) - 0.5)*px, sy + ((k >> 1) - 0.5)*px), h = ringRay(L, e[0], e[1], e[2], true); skyAir[q] = 1 - Math.exp(-h.air); break; }
    // a beacon at each spire's tip, always lit (red, as a tall thing's warning light is)
    if(L.spires) for(const sp of L.spires){ const cosT = dx*sp.tip[0] + dy*sp.tip[1] + dz*sp.tip[2]; if(cosT < sp.tipCos) continue;
      const a2 = (1 - cosT)*2*sp.tl*sp.tl/(sp.glowR*sp.glowR); if(a2 < 9) beacon[q] = Math.max(beacon[q], Math.exp(-a2)*Math.min(1, 0.002/(px*sp.tl/L.W) + 0.4)); }
    // the seam (a rare ring): the edges of the world's own box, faint, where you look out into space
    if(L.seam && space > 0){ const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz), mxA = Math.max(ax, ay, az), mid = ax + ay + az - mxA - Math.min(ax, ay, az);
      const edge = Math.exp(-Math.pow((mxA - mid)/(px*1.5), 2)), u = (ax === mxA ? dy/ax : dx/mxA)*4, v = (az === mxA ? dy/az : dz/mxA)*4, gu = Math.abs(u - Math.round(u)), gv = Math.abs(v - Math.round(v));
      seam[q] = space*Math.min(1, edge + 0.35*Math.exp(-Math.pow(Math.min(gu, gv)/(px*6), 2))); }
  }
  return [along, across, dist, detail, sky, walls, star, day, squares, airs, here, scaf, open, seam, beacon, skyAir];
}

// a Ringworld View's settings (as its sliders give them) as the world it draws — shared with the camera's guide
export function ringParams(r){
  const b = r.band/100, W = 0.012 + 0.22*b*b, z = Math.max(0.25, (r.zoom ?? 100)/100);
  return { band: W, walls: W*(0.04 + 0.7*r.walls/100), altitude: W*Math.pow(10, -3.2 + 3*r.altitude/100), look: r.look,
    lift: Math.max(-30, Math.min(89.5, r.up != null ? 90 - 90*Math.min(1.3, r.up) : (r.lift ?? 15)*0.9)),
    lens: 2*Math.atan(Math.tan((r.lens ?? 75)*Math.PI/360)/z)*180/Math.PI, place: (r.place ?? 0)/100, daylight: (r.daylight ?? 80)/100,
    air: (a => 0.01 + 0.4*a*a)((r.air ?? 50)/100), build: 0.25 + 0.75*(r.build ?? 35)/100, seed: r.seed >>> 0 };
}
// THE CAMERA'S GUIDE (Ruby: "a fast render … almost a guide while you're adjusting the camera"): the shot as a few
// lines, in page units (the short side 1), drawn over the page while the camera dial moves and the surface is still
// being made. A plane (Wood, Discharge): its grid, the page's own square bold. A ring: its floor's edges, its walls.
export function cameraGuide(kind, aspX, aspY, cam, ring){
  const lines = [];
  if(kind === 'plane'){
    const g = groundCam(aspX, aspY, cam.turn, cam.view, cam.zoom), P = (x, y) => g ? g.toScreen(x, y) : [x, y, 1];
    const run = (pts, bold) => { const out = []; for(const [x, y] of pts){ const p = P(x, y); if(p) out.push([p[0], p[1]]); } if(out.length > 1) lines.push({ pts: out, bold }); };
    const step = Math.min(aspX, aspY)/6;
    for(let x = -aspX; x <= aspX*2 + 1e-9; x += step) run(Array.from({ length: 41 }, (_, i) => [x, -aspY*2 + i*aspY*5/40]), false);
    for(let y = -aspY*2; y <= aspY*3 + 1e-9; y += step) run(Array.from({ length: 41 }, (_, i) => [-aspX + i*aspX*3/40, y]), false);
    run([[0, 0], [aspX, 0], [aspX, aspY], [0, aspY], [0, 0]].flatMap((p, i, a) => i ? Array.from({ length: 10 }, (_, k) => [a[i - 1][0] + (p[0] - a[i - 1][0])*(k + 1)/10, a[i - 1][1] + (p[1] - a[i - 1][1])*(k + 1)/10]) : [p]), true);
    return lines;
  }
  if(kind === 'ring' && ring){
    const L = ringLook(ringParams(ring)), F = L.f, cx = aspX/2, cy = aspY/2;
    const proj = (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, zc = dx*L.fx + dy*L.fy + dz*L.fz; if(zc <= 1e-6) return null;
      return [cx + F*(dx*L.rx + dy*L.ry + dz*L.rz)/zc, cy - F*(dx*L.ux + dy*L.uy + dz*L.uz)/zc]; };
    const run = (fn, n, bold) => { let cur = []; for(let i = 0; i <= n; i++){ const p = fn(i/n); if(p && Math.abs(p[0] - cx) < aspX*3 && Math.abs(p[1] - cy) < aspY*3) cur.push(p); else { if(cur.length > 1) lines.push({ pts: cur, bold }); cur = []; } } if(cur.length > 1) lines.push({ pts: cur, bold }); };
    // the floor's two edges and the walls' tops, round the whole ring; the band's middle, faint; rungs across it near you
    for(const [zf, rr, bold] of [[0.5, 1, true], [-0.5, 1, true], [0.5, 1 - L.Hw, false], [-0.5, 1 - L.Hw, false], [0, 1, false]])
      run(t => { const a = (t*2 - 1)*Math.PI; return proj(rr*Math.cos(a), rr*Math.sin(a), zf*L.W); }, 720, bold);
    for(let k = -12; k <= 12; k++){ const a = k*L.W*0.5; run(t => proj(Math.cos(a), Math.sin(a), (t - 0.5)*L.W), 8, false); }
    return lines;
  }
  return lines;
}

// ---------------- NOISE AT COORDINATES ----------------
// Noise read wherever two maps say (any projection: a ring's floor, a polar wrap, a perspective), never repeating, and
// never finer than a pixel where it lands: a third map (Detail, how much ground a pixel spans there) ends the octaves
// a pixel can't show, so far ground is smooth and near ground sharp.
const mnHash = (x, y, s) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
function mnValue(x, y, s){ const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx*fx*(3 - 2*fx), v = fy*fy*(3 - 2*fy);
  const a = mnHash(xi, yi, s), b = mnHash(xi + 1, yi, s), c = mnHash(xi, yi + 1, s), d = mnHash(xi + 1, yi + 1, s);
  return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v; }
function genMapNoise(X, Y, D, N, o){
  const out = new Float32Array(N), slope = new Float32Array(N), base = 1/Math.max(1e-6, o.size), seed = o.seed | 0, oct = Math.max(1, Math.min(14, Math.round(o.octaves)));
  const fbm = (x, y, foot) => {
    if(o.warp > 0){ const wx = (mnValue(x*base*0.5 + 17.3, y*base*0.5, seed + 7) - 0.5)*o.warp*o.size, wy = (mnValue(x*base*0.5, y*base*0.5 + 41.1, seed + 9) - 0.5)*o.warp*o.size; x += wx; y += wy; }
    let sum = 0, norm = 0, amp = 1, fq = base;
    for(let k = 0; k < oct; k++){
      // how many pixels one cell of this octave spans here: under one, it would only shimmer, so it gives way to its mean
      const w = foot ? genClamp(1/(fq*foot) - 1) : 1;
      if(w <= 0){ sum += amp*0.5; norm += amp; break; }
      let nv = mnValue(x*fq, y*fq, seed + k*101);
      if(o.ridges > 0){ const r = 1 - Math.abs(2*nv - 1); nv = nv + (r*r - nv)*o.ridges; }
      sum += amp*(0.5 + (nv - 0.5)*w); norm += amp; amp *= o.rough; fq *= 2.03;
    }
    return sum/norm; };
  for(let i = 0; i < N; i++){
    const x = X ? X[i] : 0, y = Y ? Y[i] : 0, foot = D ? Math.max(1e-9, D[i]) : 0, v = fbm(x, y, foot);
    out[i] = v;
    // THE SLOPE, on the ground itself (not on the page): how steep the land is where this pixel looks, as if its
    // heights were Steepness × Size tall; read across a pixel's own width, so far ground is as smooth as it looks
    if(o.steep > 0){ const e = Math.max(foot*2.5, o.size*1e-4), gx = (fbm(x + e, y, foot) - v)/e, gy = (fbm(x, y + e, foot) - v)/e, g = Math.hypot(gx, gy)*o.steep*o.size*4;
      slope[i] = 1 - 1/Math.sqrt(1 + g*g); }
  }
  return [out, slope];
}

export const GEN_STEPS = {
  // (Ruby: a ringworld; the dial is its camera, one slider its light) the world's maps, for other parts to lay things on
  ringview: { cat: 'Shape', label: 'Ringworld View', ins: ['look toward', 'look up', 'zoom'], outs: ['along', 'across', 'distance', 'detail', 'space', 'walls', 'star', 'daylight', 'shadow squares', 'air', 'daylight here', 'scaffolding', 'open floor', 'seam', 'beacons', 'sky air'],
    io: { ins: ['value', 'value', 'value'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [GEN_R('band', 'Band Width', 45), GEN_R('walls', 'Rim Walls', 25), GEN_R('altitude', 'Altitude', 15), GEN_R('look', 'Look Toward', 0, 0, 360), GEN_R('lift', 'Look Up', 15, -30, 100),
      GEN_R('lens', 'Lens', 75, 30, 120), GEN_R('place', 'Stand At', 0, -100, 100), GEN_R('daylight', 'Daylight', 80), GEN_R('air', 'Air', 50), GEN_R('build', 'Construction', 35)], cost: () => 8,
    doc: 'A ringworld seen from its floor: maps of what each pixel looks at — the ground near you, the ring rising far off into the arch overhead, its rim walls, the star, the shadow squares, open space.',
    // (a dial wired in is the camera — the Camera Dial, or the Light Dial: its direction where you look round the ring,
    //  its height how far up (at the middle, straight up at the arch; at the rim, level; past it, a little down), and the
    //  Camera Dial's zoom narrows the lens)
    run(E, n){ const { ww, wh, unit, num, input } = E, toward = input(n, 1), up = input(n, 2), zoom = input(n, 3);
      return genRingView(ww, wh, unit, ringParams({ band: num(n, 'band', 45), walls: num(n, 'walls', 25), altitude: num(n, 'altitude', 15),
        look: typeof toward === 'number' ? toward*360 : num(n, 'look', 0), up: typeof up === 'number' ? up : null, lift: num(n, 'lift', 15),
        lens: num(n, 'lens', 75), zoom: typeof zoom === 'number' ? 25 + 375*zoom : 100, place: num(n, 'place', 0), daylight: num(n, 'daylight', 80), air: num(n, 'air', 50), build: num(n, 'build', 35),
        seed: E.ctx.seed >>> 0 })); } },
  // the GROUND CAMERA's view as maps (Wood and Discharge see the plank this way): where on the page's plane each pixel
  // looks, and how much of it a pixel spans — for Noise at Coordinates (or a Lookup) to lay anything on the same plank
  groundview: { cat: 'Shape', label: 'Ground Coordinates', ins: [], outs: ['across', 'down', 'detail'], io: { outs: ['field', 'field', 'field'] },
    params: [GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 1,
    doc: 'Where on the page’s plane each pixel looks, through the ground camera that Wood and Discharge share: across, down, and how much a pixel spans there.',
    run(E, n){ const { ww, wh, unit, N, num } = E, cam = groundCam(ww/unit, wh/unit, num(n, 'turn', 0), num(n, 'view', 0), num(n, 'lens', 100));
      const X = new Float32Array(N), Y = new Float32Array(N), D = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, sx = (x + 0.5)/unit, sy = (y + 0.5)/unit;
        if(!cam){ X[q] = sx; Y[q] = sy; D[q] = 1/unit; continue; }
        const g = cam.toGround(sx, sy); if(!g){ D[q] = 1; continue; } X[q] = g[0]; Y[q] = g[1]; D[q] = g[3]/unit; }
      return [X, Y, D]; } },
  mapnoise: { cat: 'Noise', label: 'Noise at Coordinates', ins: ['across', 'down', 'detail'], outs: ['noise', 'slope'], io: { ins: ['field', 'field', 'field'], outs: ['field', 'field'] },
    params: [GEN_R('size', 'Size', 100, 1, 1000), GEN_R('octaves', 'Octaves', 8, 1, 14), GEN_R('rough', 'Roughness', 50), GEN_R('ridges', 'Ridges', 0), GEN_R('warp', 'Warp', 0), GEN_R('variation', 'Variation', 0, 0, 99),
      GEN_R('steep', 'Steepness', 0)], cost: () => 4,
    doc: 'Noise read wherever two maps say: laid on a ring, a polar wrap or a perspective, never repeating, never finer than a pixel where it lands.',
    run(E, n){ const { N, num, input, asField } = E, X = asField(input(n, 1)), Y = asField(input(n, 2)), D = input(n, 3) != null ? asField(input(n, 3)) : null;
      return genMapNoise(X, Y, D, N, { size: num(n, 'size', 100)/100, octaves: num(n, 'octaves', 8), rough: 0.3 + 0.4*num(n, 'rough', 50)/100, ridges: num(n, 'ridges', 0)/100,
        warp: num(n, 'warp', 0)/100*2, steep: num(n, 'steep', 0)/100, seed: ((E.ctx.seed >>> 0) % 100003) + Math.round(num(n, 'variation', 0))*7919 }); } },
  raindrops: { cat: 'Marks', label: 'Raindrops', ins: [], outs: ['ripples', 'splashes', 'distance'], io: { outs: ['field', 'field', 'field'] },
    params: [GEN_R('size', 'Ripple Size', 100, 40, 250), GEN_R('rain', 'Rain', 50), GEN_R('spread', 'Spread', 50), GEN_R('splash', 'Splashes', 40), GEN_R('view', 'View', 35, 0, 85), GEN_R('variation', 'Variation', 0, 0, 99)], cost: () => 8,
    doc: 'Rain falling on still water: every drop a ring wave spreading from where it struck, the newest still splashing, seen from above or across the water.',
    run(E, n){ const { num } = E;
      return genRaindrops(E.ww, E.wh, E.unit, { size: num(n, 'size', 100)/100, rain: num(n, 'rain', 50)/100, spread: num(n, 'spread', 50)/100, splash: num(n, 'splash', 40)/100,
        tilt: num(n, 'view', 35)/100, salt: ((E.ctx.seed >>> 0) + Math.round(num(n, 'variation', 0))*7919) >>> 0 }); } },
  traces: { cat: 'Marks', label: 'Circuit Traces', ins: ['keep clear'], outs: ['copper', 'height', 'each trace', 'data', 'pads', 'parts', 'silkscreen', 'brass'],
    io: { ins: ['field'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [GEN_R('traces', 'Traces', 55), GEN_R('scale', 'Scale', 100, 40, 300), GEN_R('bends', 'Bends', 70), GEN_R('parts', 'Components', 45), GEN_R('flow', 'Data Flow', 40), GEN_R('variant', 'Variant', 0, 0, 99),
      GEN_R('era', 'Era', 0), GEN_R('marks', 'Markings', 0), ['clearing', 'Keep Clear By', 'select', 'routing around it', { options: ['routing around it', 'cutting it away'] }]], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, unit = Math.min(w, h), across = 80/(E.num(n, 'scale', 100)/100), s = unit/across;
      const cw = Math.max(4, Math.ceil(w/s)), ch = Math.max(4, Math.ceil(h/s)), kv = E.input(n, 1), keep = kv != null ? E.asField(kv) : null;
      const bends = E.num(n, 'bends', 70)/100;
      const o = { traces: E.num(n, 'traces', 55)/100, parts: E.num(n, 'parts', 45)/100, bends, diag: bends > 0, flow: E.num(n, 'flow', 40)/100,
        era: E.num(n, 'era', 0)/100, marks: E.num(n, 'marks', 0)/100,
        salt: Math.round(E.num(n, 'variant', 0)) + ((E.ctx.seed >>> 0) % 997),
        clear: null, cut: null };
      // KEEP CLEAR: routed around (the cells are taken before anything is placed), or, for a mask that moves (the poem),
      // cut away after, so the rest of the board stays where it was
      const look = keep ? (x, y) => keep[Math.min(h - 1, Math.max(0, y*s | 0))*w + Math.min(w - 1, Math.max(0, x*s | 0))] : null;
      if(look){ if(E.P(n, 'clearing', 'routing around it') !== 'cutting it away') o.clear = look; else if(keep.some(v => v > 0.5)) o.cut = (x, y) => look(x, y) > 0.5; }
      const B = withSeed(genSeed(E, n), () => genCircuit(cw, ch, o)), cv = genDrawCircuit(B, w, h, s, o);
      return ['copper', 'height', 'each', 'data', 'pads', 'parts', 'legend', 'brass'].map(k => cv[k][0]); },
    run(E, n){ return this.paint(E, n).map(c => E.asField(E.readCanvas(c))); } },
  matrix: { cat: 'Textures', label: 'Growth Medium', ins: [], outs: ['picture', 'height', 'ways'], io: { outs: ['field', 'field', 'field'] },
    params: [GEN_R('kind', 'Strata · Pebbles · Sand · Fibres · Skin', 25), GEN_R('scale', 'Scale', 100, 40, 300), GEN_R('angle', 'Angle', 0, 0, 180), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 4,
    run(E, n){ const k = Math.min(4, Math.floor(E.num(n, 'kind', 25)/100*5));
      return withSeed(genSeed(E, n), () => genMatrix(E.ww, E.wh, E.unit, { kind: k, zoom: E.num(n, 'scale', 100)/100, angle: E.num(n, 'angle', 0)*Math.PI/180 })); } },
  tendrils: { cat: 'Marks', label: 'Tendrils', ins: ['ways', 'grow from'], outs: ['wires', 'glow'], io: { ins: ['field', 'value'], outs: ['field', 'field'] },
    params: [GEN_R('amount', 'Reach', 60), GEN_R('branching', 'Branching', 50), GEN_R('roots', 'Roots', 2, 1, 6), GEN_R('inner', 'Start Inside', 0), GEN_R('slide', 'Slide', 0, -100, 100),
      GEN_R('zoom', 'Scale', 100, 40, 300), GEN_R('width', 'Wire Width', 100, 30, 300), GEN_R('keep', 'Follow the Ways', 60), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 14,
    run(E, n){ const { ww, wh, unit, N, num } = E, dial = genDial(E, n, 2), Wv = E.asField(E.input(n, 1)) || new Float32Array(N).fill(0.6);
      const o = { amount: num(n, 'amount', 60)/100 + 0.05, branching: num(n, 'branching', 50)/100, roots: num(n, 'roots', 2), inner: num(n, 'inner', 0)/100, slide: num(n, 'slide', 0)/100,
        zoom: num(n, 'zoom', 100)/100, dx: dial.x, dy: dial.y, keep: num(n, 'keep', 60)/100 };
      const T = withSeed(genSeed(E, n), () => genTendrils(ww, wh, unit, Wv, o));
      const [c, x] = kitCanvas(ww, wh); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'round';
      const wk = num(n, 'width', 100)/100;
      for(let k = 0; k < T.NX.length; k++){ const p = T.PAR[k]; if(p < 0) continue;
        x.lineWidth = Math.max(E.px(0.9), E.px(1.1)*wk*o.zoom*Math.cbrt(T.flow[k])); x.beginPath(); x.moveTo(T.NX[p], T.NY[p]); x.lineTo(T.NX[k], T.NY[k]); x.stroke(); }
      const wires = E.asField(E.readCanvas(c)), g1 = E.boxBlur(wires, unit*0.004), g2 = E.boxBlur(wires, unit*0.016), glow = new Float32Array(N);
      for(let i = 0; i < N; i++) glow[i] = Math.min(1, wires[i]*0.8 + g1[i]*1.2 + g2[i]*1.1);
      return [wires, glow]; } },
  knotwork: { cat: 'Marks', label: 'Knotwork', ins: ['slide toward'], outs: ['picture', 'height'], io: { ins: ['value'], outs: ['image', 'field'] },
    params: [GEN_R('size', 'Size', 100, 40, 300), GEN_R('cells', 'Strands', 8, 3, 24), GEN_R('breaks', 'Breaks', 45), GEN_R('shape', 'Circle · Square · Diamond · Cross · Quatrefoil · Page', 0),
      GEN_R('width', 'Ribbon Width', 55, 20, 90), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 4,
    paint(E, n){ const { ww: w, wh: h } = E, unit = Math.min(w, h), dial = genDial(E, n, 1), sh = E.num(n, 'shape', 0);
      const o = { cells: E.num(n, 'cells', 8), breaks: E.num(n, 'breaks', 45)/100, shape: Math.min(5, Math.floor(sh/100*6)), salt: Math.round(E.num(n, 'variant', 0)) + ((E.ctx.seed >>> 0) % 997),
        aspX: w/unit, aspY: h/unit };
      const pieces = genKnot(o), size = E.num(n, 'size', 100)/100, off = E.num(n, 'offset', 0)/100;
      // the panel: its radius a share of the page, zoomed by Size; slid along the dial's line
      const s = unit*0.44*size/Math.max(2, Math.round(o.cells))*2, cx = w/2 + dial.x*off*w*0.42, cy = h/2 + dial.y*off*h*0.42;
      const T = p => [cx + p[0]*s/2, cy + p[1]*s/2], wd = s*0.5*0.707*E.num(n, 'width', 55)/100*1.3;
      const [pc, px] = kitCanvas(w, h), [hc, hx] = kitCanvas(w, h);
      px.fillStyle = 'rgb(128,128,128)'; px.fillRect(0, 0, w, h); hx.fillStyle = '#000'; hx.fillRect(0, 0, w, h);
      genDrawKnot(px, pieces, T, s, wd, 'rgb(28,26,24)', 'rgb(232,226,214)', 'rgb(128,128,128)');
      // heights: the ribbon raised, its edges rounded down, the under-strand lower where it passes beneath
      genDrawKnot(hx, pieces, T, s, wd, 'rgb(150,150,150)', 'rgb(235,235,235)', '#000');
      return [pc, hc]; },
    run(E, n){ const [pc, hc] = this.paint(E, n); return [E.readCanvas(pc), E.asField(E.readCanvas(hc))]; } },
  discharge: { cat: 'Marks', label: 'Discharge', ins: ['strike from'], outs: ['channels'], io: { ins: ['value'], outs: ['field'] },
    params: [GEN_R('reach', 'Reach', 50), GEN_R('branching', 'Branching', 50), GEN_R('poles', 'Poles', 2, 1, 3), GEN_R('grain', 'Along the Grain', 30), GEN_R('width', 'Channel Width', 100, 30, 300),
      GEN_R('zoom', 'Zoom', 100, 50, 400), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variant', 0, 0, 99),
      GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 12,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1), zoom = num(n, 'zoom', 100)/100, cam = groundCam(ww/unit, wh/unit, num(n, 'turn', 0), num(n, 'view', 0), num(n, 'lens', 100));
      const o = { count: Math.round(700 + 8000*num(n, 'reach', 50)/100), eta: 1.2 + (1 - num(n, 'branching', 50)/100)*6.5, poles: Math.round(num(n, 'poles', 2)),
        grain: num(n, 'grain', 30)/100, dx: dial.x, dy: dial.y, zoom, offset: num(n, 'offset', 0)/100 };
      const { segs } = withSeed(genSeed(E, n), () => genLichtenberg(ww/unit, wh/unit, o));
      const [c, x] = kitCanvas(ww, wh); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'round';
      const wk = num(n, 'width', 100)/100;
      // thick where the most current ran; the twigs fade as well as thin
      // (magnified with the figure: the camera brings the channels closer, wider as well as longer)
      // (through the ground camera: a channel is as wide as it is near; one finer than the thinnest line fades instead)
      const thin = E.px(0.9);
      for(const [x0, y0, x1, y1, cur] of segs){ let w = Math.max(E.px(0.9)*zoom, E.px(1.6)*wk*Math.pow(cur, 0.34)*zoom), a = Math.min(1, 0.35 + Math.pow(cur, 0.5)*0.22);
        let p = [x0, y0], q = [x1, y1];
        if(cam){ p = cam.toScreen(x0, y0); q = cam.toScreen(x1, y1); if(!p || !q) continue; w *= (p[2] + q[2])/2; if(w < thin){ a *= w/thin; w = thin; } }
        x.globalAlpha = a; x.lineWidth = w;
        x.beginPath(); x.moveTo(p[0]*unit, p[1]*unit); x.lineTo(q[0]*unit, q[1]*unit); x.stroke(); }
      return [E.asField(E.readCanvas(c))]; } },
  wood: { cat: 'Textures', label: 'Wood', ins: ['light wood', 'dark wood'], outs: ['picture', 'height'], io: { ins: ['colour', 'colour'], outs: ['image', 'field'] },
    params: [GEN_R('rings', 'Rings', 40), GEN_R('figure', 'Figure', 50), GEN_R('variant', 'Variant', 0, 0, 99), GEN_R('turn', 'Turn', 0, 0, 360), GEN_R('view', 'View', 0), GEN_R('lens', 'Camera Zoom', 100, 25, 400)], cost: () => 4,
    run(E, n){ const a = E.input(n, 1), b = E.input(n, 2);
      const o = { rings: E.num(n, 'rings', 40)/100, figure: E.num(n, 'figure', 50)/100, light: Array.isArray(a) ? a : [0.80, 0.64, 0.45], dark: Array.isArray(b) ? b : [0.42, 0.26, 0.15],
        cam: groundCam(E.ww/E.unit, E.wh/E.unit, E.num(n, 'turn', 0), E.num(n, 'view', 0), E.num(n, 'lens', 100)) };
      return withSeed(genSeed(E, n), () => genWood(E.ww, E.wh, E.unit, o)); } },
  burn: { cat: 'Light & Color', label: 'Burn', ins: ['picture', 'channels', 'glow'], outs: ['picture', 'height'], io: { ins: ['image', 'field', 'colour'], outs: ['image', 'field'] },
    params: [GEN_R('material', 'Charred · Embers · Acrylic', 0), GEN_R('scorch', 'Scorch', 50), GEN_R('depth', 'Depth', 50), GEN_R('etch', 'Etched', 0)], cost: () => 3,
    run(E, n){ const { N, unit } = E, ch = E.asField(E.input(n, 2)); if(!ch) return null;
      const pic = E.asImage(E.input(n, 1) ?? 0.6), gv = E.input(n, 3), m = E.num(n, 'material', 0)/100, sc = E.num(n, 'scorch', 50)/100, dp = E.num(n, 'depth', 50)/100, et = E.num(n, 'etch', 0)/100;
      const ember = genClamp(1 - Math.abs(m - 0.5)*2), acr = genClamp((m - 0.5)*2), wood = genClamp(1 - m*2);
      const glow = Array.isArray(gv) ? gv : [1*(1 - acr) + 0.62*acr, 0.42*(1 - acr) + 0.86*acr, 0.12*(1 - acr) + 1*acr];
      // the scorch: wide and soft; the lip: just beside the channel
      const wide = E.boxBlur(ch, unit*0.012*(0.4 + sc)), lip = E.boxBlur(ch, unit*0.0025);
      const out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, H = new Float32Array(N), P = [pic.r, pic.g, pic.b], O = [out.r, out.g, out.b];
      const block = [0.035, 0.05, 0.075];
      for(let i = 0; i < N; i++){
        const c = ch[i], s = genClamp(wide[i]*3.2*sc), core = genClamp(c*1.4), inner = genClamp((lip[i] - 0.72)*3.5);
        for(let k = 0; k < 3; k++){
          // wood: browned round the channel, black in it
          const brown = [0.42, 0.24, 0.12][k], burnt = P[k][i]*(1 - s*0.55) + brown*P[k][i]*s*0.55, charred = burnt*(1 - core*0.92) + 0.03*core;
          // embers: the char with fire still in its heart
          const hot = charred*(1 - inner*0.4) + glow[k]*(inner*0.85 + core*s*0.18);
          // acrylic: a dark clear block, the channels white-hot at the core and coloured round it
          const lit = block[k] + glow[k]*(s*0.45 + core*0.8) + inner*0.9;
          const o = wood*charred + ember*hot + acr*lit;
          // ETCHED (slate, brass): the cut shows paler than the face, its own material bared and catching light; no char
          O[k][i] = et > 0 ? o*(1 - et) + et*(P[k][i]*(1 - s*0.25) + (0.8 + 0.2*P[k][i] - P[k][i]*(1 - s*0.25))*core*0.85) : o;
        }
        // sunk into the wood, with a crust of char at the lip (acrylic: smooth)
        H[i] = (0.55 - dp*0.45*core - dp*0.12*s + dp*0.18*genClamp(lip[i]*2 - core))*(1 - acr) + 0.5*acr;
      }
      return [out, H]; } },
  growline: { cat: 'Marks', label: 'Differential Growth', ins: ['sun'], outs: ['line', 'body', 'relief'], io: { ins: ['value'], outs: ['field', 'field', 'field'] },
    params: [GEN_R('growth', 'Growth', 55), GEN_R('fold', 'Fold Size', 100, 50, 250), GEN_R('seeds', 'Seeds', 1, 1, 7), GEN_R('photo', 'Toward the Sun', 40),
      GEN_R('zoom', 'Zoom', 100, 50, 400), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 14,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1), zoom = num(n, 'zoom', 100)/100, off = num(n, 'offset', 0)/100;
      const o = { growth: num(n, 'growth', 55)/100, fold: num(n, 'fold', 100)/100, seeds: num(n, 'seeds', 1), photo: num(n, 'photo', 40)/100, sun: { x: dial.x, y: dial.y } };
      const { loops } = withSeed(genSeed(E, n), () => genGrowth(ww/unit, wh/unit, o));
      // into the page: zoomed about the page's middle, then slid along the dial's line (the sun's)
      const cx = ww/unit/2, cy = wh/unit/2, sx = cx + dial.x*off*cx*0.9, sy = cy + dial.y*off*cy*0.9;
      for(const L of loops) for(const p of L){ p[0] = sx + (p[0] - cx)*zoom; p[1] = sy + (p[1] - cy)*zoom; }
      const [lc, lx] = kitCanvas(ww, wh), [bc, bx] = kitCanvas(ww, wh);
      bx.fillStyle = '#000'; bx.fillRect(0, 0, ww, wh); lx.fillStyle = '#000'; lx.fillRect(0, 0, ww, wh);
      // the body: every loop filled (even–odd, so a loop grown round another leaves a ring)
      bx.fillStyle = '#fff'; bx.beginPath(); for(const L of loops){ L.forEach((p, i) => i ? bx.lineTo(p[0]*unit, p[1]*unit) : bx.moveTo(p[0]*unit, p[1]*unit)); bx.closePath(); } bx.fill('evenodd');
      lx.strokeStyle = '#fff'; lx.lineJoin = 'round'; lx.lineWidth = Math.max(1, E.px(3.2)*o.fold*zoom);
      lx.beginPath(); for(const L of loops){ L.forEach((p, i) => i ? lx.lineTo(p[0]*unit, p[1]*unit) : lx.moveTo(p[0]*unit, p[1]*unit)); lx.closePath(); } lx.stroke();
      const line = E.asField(E.readCanvas(lc)), body = E.asField(E.readCanvas(bc));
      // relief: the body rounded at its edges, a groove along the line
      const soft = E.boxBlur(body, unit*0.0045*o.fold*zoom), rel = new Float32Array(E.N);
      for(let i = 0; i < E.N; i++) rel[i] = genClamp(soft[i]*0.9 - line[i]*0.25 + 0.05);
      return [line, body, rel]; } },
};
