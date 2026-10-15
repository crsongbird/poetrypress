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

// ---------------- WOOD ----------------
function genWood(ww, wh, unit, o){
  const N = ww*wh, pic = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, H = new Float32Array(N);
  const warp = makeNoiseGrid(9, 9), fib = makeNoiseGrid(64, 12), fig = makeNoiseGrid(6, 6), knot = makeNoiseGrid(5, 5);
  const pithY = -0.22 - Math.random()*0.35, pithX = 0.2 + Math.random()*0.6, rings = 34*o.rings + 8, L = o.light, D = o.dark;
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const u = x/unit, v = y/unit, i = y*ww + x;
    const wv = sampleNoiseGrid(warp, 9, 9, u/(ww/unit)*8, v/(wh/unit)*8) - 0.5;
    // (flat-sawn: the rings cut at a slant across the board, so they arch — "cathedrals" — round a pith above it)
    const r = Math.hypot((u - pithX*ww/unit)*0.8, v - pithY) + wv*0.05*o.figure + (sampleNoiseGrid(fig, 6, 6, u*2, v*2) - 0.5)*0.025*o.figure;
    const f = r*rings, q = f - Math.floor(f);
    // early wood pale and soft, late wood a dark sharp band at the ring's end
    const late = Math.pow(q, 9 - 4*o.figure);
    const fibre = sampleNoiseGrid(fib, 64, 12, u/(ww/unit)*63, v/(wh/unit)*11), pore = sampleNoiseGrid(knot, 5, 5, u*1.3, v*1.3);
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
  3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
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
  return { chips, smd, vias, traces, names: named };
}
// The board drawn: s pixels a cell. Each of the part's maps is its own canvas (see the part).
function genDrawCircuit(B, ww, wh, s, o){
  const mk = () => kitCanvas(ww, wh), cv = {}, fillAll = (x, c) => { x.fillStyle = c; x.fillRect(0, 0, ww, wh); };
  for(const k of ['copper', 'height', 'each', 'data', 'pads', 'parts', 'legend']){ const [c, x] = mk(); fillAll(x, k === 'height' ? 'rgb(77,77,77)' : '#000'); x.lineCap = 'round'; x.lineJoin = 'round'; cv[k] = [c, x]; }
  const g = v => { const q = Math.round(Math.max(0, Math.min(1, v))*255); return `rgb(${q},${q},${q})`; };
  const line = (x, pts, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0]*s, p[1]*s) : x.moveTo(p[0]*s, p[1]*s)); x.stroke(); };
  const disc = (x, p, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(p[0]*s, p[1]*s, r*s, 0, Math.PI*2); x.fill(); };
  const rect = (x, X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X*s, Y*s, W*s, H*s); };
  const [, CU] = cv.copper, [, HT] = cv.height, [, EA] = cv.each, [, DA] = cv.data, [, PD] = cv.pads, [, PT] = cv.parts, [, LG] = cv.legend;
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
  // the chips: a dark body standing well above the board, a pin pad at every pin, a dimple at pin one
  for(const c of B.chips){
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
    rect(PT, ...body, p.cap ? 'rgb(150,150,150)' : '#fff'); rect(HT, ...body, p.cap ? 'rgb(168,168,168)' : 'rgb(158,158,158)');
    LG.strokeStyle = '#fff'; LG.lineWidth = 0.1*s; LG.strokeRect((p.x - 0.25)*s, (p.y - 0.25)*s, (p.w + 0.5)*s, (p.h + 0.5)*s);
  }
  for(const v of B.vias){ disc(CU, v, 0.38, '#fff'); disc(CU, v, 0.15, '#000'); disc(PD, v, 0.38, '#fff'); disc(PD, v, 0.15, '#000'); disc(HT, v, 0.38, 'rgb(115,115,115)'); disc(HT, v, 0.15, 'rgb(31,31,31)'); }
  // the parts' names, in the silkscreen's little font
  for(const nm of B.names){ const txt = nm.kind + nm.n, px = 0.24; let x0 = nm.x;
    for(const ch of txt){ const bits = CIR_FONT[ch] || ''; for(let r = 0; r < 5; r++) for(let q = 0; q < 3; q++) if(bits[r*3 + q] === '1') rect(LG, x0 + q*px, nm.y + r*px, px*0.92, px*0.92, '#fff'); x0 += px*4; } }
  // DATA: bright pulses running along the traces, a comet each (the head bright, the tail fading behind it), and
  // packets of bits; each trace's are fixed by its own hash, so more Data Flow adds pulses and moves none
  const flow = o.flow;
  if(flow > 0) B.traces.forEach((tr, ti) => {
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

export const GEN_STEPS = {
  traces: { cat: 'Marks', label: 'Circuit Traces', ins: ['keep clear'], outs: ['copper', 'height', 'each trace', 'data', 'pads', 'parts', 'silkscreen'],
    io: { ins: ['field'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [GEN_R('traces', 'Traces', 55), GEN_R('scale', 'Scale', 100, 40, 300), GEN_R('bends', 'Bends', 70), GEN_R('parts', 'Components', 45), GEN_R('flow', 'Data Flow', 40), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, unit = Math.min(w, h), across = 80/(E.num(n, 'scale', 100)/100), s = unit/across;
      const cw = Math.max(4, Math.ceil(w/s)), ch = Math.max(4, Math.ceil(h/s)), kv = E.input(n, 1), keep = kv != null ? E.asField(kv) : null;
      const bends = E.num(n, 'bends', 70)/100;
      const o = { traces: E.num(n, 'traces', 55)/100, parts: E.num(n, 'parts', 45)/100, bends, diag: bends > 0, flow: E.num(n, 'flow', 40)/100,
        salt: Math.round(E.num(n, 'variant', 0)) + ((E.ctx.seed >>> 0) % 997),
        clear: keep ? (x, y) => keep[Math.min(h - 1, Math.max(0, y*s | 0))*w + Math.min(w - 1, Math.max(0, x*s | 0))] : null };
      const B = withSeed(genSeed(E, n), () => genCircuit(cw, ch, o)), cv = genDrawCircuit(B, w, h, s, o);
      return ['copper', 'height', 'each', 'data', 'pads', 'parts', 'legend'].map(k => cv[k][0]); },
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
      GEN_R('zoom', 'Zoom', 100, 50, 400), GEN_R('offset', 'Slide', 0, -100, 100), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 12,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1), zoom = num(n, 'zoom', 100)/100;
      const o = { count: Math.round(700 + 8000*num(n, 'reach', 50)/100), eta: 1.2 + (1 - num(n, 'branching', 50)/100)*6.5, poles: Math.round(num(n, 'poles', 2)),
        grain: num(n, 'grain', 30)/100, dx: dial.x, dy: dial.y, zoom, offset: num(n, 'offset', 0)/100 };
      const { segs } = withSeed(genSeed(E, n), () => genLichtenberg(ww/unit, wh/unit, o));
      const [c, x] = kitCanvas(ww, wh); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'round';
      const wk = num(n, 'width', 100)/100;
      // thick where the most current ran; the twigs fade as well as thin
      // (magnified with the figure: the camera brings the channels closer, wider as well as longer)
      for(const [x0, y0, x1, y1, cur] of segs){ const w = Math.max(E.px(0.9)*zoom, E.px(1.6)*wk*Math.pow(cur, 0.34)*zoom);
        x.globalAlpha = Math.min(1, 0.35 + Math.pow(cur, 0.5)*0.22); x.lineWidth = w;
        x.beginPath(); x.moveTo(x0*unit, y0*unit); x.lineTo(x1*unit, y1*unit); x.stroke(); }
      return [E.asField(E.readCanvas(c))]; } },
  wood: { cat: 'Textures', label: 'Wood', ins: ['light wood', 'dark wood'], outs: ['picture', 'height'], io: { ins: ['colour', 'colour'], outs: ['image', 'field'] },
    params: [GEN_R('rings', 'Rings', 40), GEN_R('figure', 'Figure', 50), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 4,
    run(E, n){ const a = E.input(n, 1), b = E.input(n, 2);
      const o = { rings: E.num(n, 'rings', 40)/100, figure: E.num(n, 'figure', 50)/100, light: Array.isArray(a) ? a : [0.80, 0.64, 0.45], dark: Array.isArray(b) ? b : [0.42, 0.26, 0.15] };
      return withSeed(genSeed(E, n), () => genWood(E.ww, E.wh, E.unit, o)); } },
  burn: { cat: 'Light & Color', label: 'Burn', ins: ['picture', 'channels', 'glow'], outs: ['picture', 'height'], io: { ins: ['image', 'field', 'colour'], outs: ['image', 'field'] },
    params: [GEN_R('material', 'Charred · Embers · Acrylic', 0), GEN_R('scorch', 'Scorch', 50), GEN_R('depth', 'Depth', 50)], cost: () => 3,
    run(E, n){ const { N, unit } = E, ch = E.asField(E.input(n, 2)); if(!ch) return null;
      const pic = E.asImage(E.input(n, 1) ?? 0.6), gv = E.input(n, 3), m = E.num(n, 'material', 0)/100, sc = E.num(n, 'scorch', 50)/100, dp = E.num(n, 'depth', 50)/100;
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
          O[k][i] = wood*charred + ember*hot + acr*lit;
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
