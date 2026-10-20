/**
 * NETWORK (Veins of Light's process part): a graph with loops, not a tree, drawn as a network running through
 * a material. Prior art: docs/prior-art/veins-network.md.
 *
 *   1. Nodes are dart-thrown where the `where` map is light (Evenness sets how far apart), a little past every
 *      edge of the page, so the network runs off the page rather than stopping politely at a margin.
 *   2. Hubs are the brightest spots of `hubs at` (the poem's punctuation), or the seed's, leaning to the side the
 *      flow comes from.
 *   3. The edges are woven one of six ways (Weave):
 *        Tree + Loops   the minimum spanning tree, then Delaunay edges added back by detour ratio (a ring road
 *                       first, where the tree's way round is longest); Loops sets how many
 *        Relative       the relative neighbourhood graph: long irregular loops, the most grown-looking
 *        Gabriel        the Gabriel graph: quads and pentagons, areoles
 *        Slime          Tero's Physarum model on the Delaunay graph: conductance grows with flux between
 *                       hubs taken in turn (a fluctuating load keeps loops, Katifori 2010)
 *        Streets        roads grown from the hubs along the `ways`' grain, snapping to what they meet
 *                       (Parish & Müller 2001), which closes blocks
 *        Subdivided     a coarse Gabriel graph whose faces are split by thinner chords, order by order, as a
 *                       leaf's areoles are (Ronellenfitsch 2015)
 *   4. Flow: the union of shortest-path trees from every hub counts each edge's use; its width follows
 *      Murray's law, w ∝ use^(1/n) (Runions 2005), with Hierarchy as the contrast.
 *   5. Each edge is routed by Organic ↔ Circuit: curved, straight, octilinear (45°), Manhattan (90°); tapering
 *      at the organic end, constant with pads at every junction and end at the circuit end. The busiest trunks
 *      may run as buses, parallel lines a fixed pitch apart.
 *   6. Pulses run along the edges away from the hubs: a bright head and a fading tail.
 *
 * Everything is placed in page units (the page's shorter side is 1), so a preview and its export hold the
 * same network; only the drawing is at the grid's resolution.
 */
import { mulberry32 } from './texCore.js';
import { patDelaunay } from './stepsPatterns.js';

const NW_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
export const NET_WEAVES = ['Tree + Loops', 'Relative', 'Gabriel', 'Slime', 'Streets', 'Subdivided'];

// ---- small geometry
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp = (a, b, t) => a + (b - a)*t;
/** Union–find, for Kruskal. */
function uf(n){ const p = Int32Array.from({ length: n }, (_, i) => i); const f = i => { while(p[i] !== i){ p[i] = p[p[i]]; i = p[i]; } return i; };
  return { f, join(a, b){ a = f(a); b = f(b); if(a === b) return false; p[a] = b; return true; } }; }
/** Minimum spanning tree of the candidate edges (each [a, b, cost]): the indices kept. */
function mst(n, E){ const U = uf(n), order = E.map((e, i) => i).sort((i, j) => E[i][2] - E[j][2]), keep = new Set();
  for(const i of order) if(U.join(E[i][0], E[i][1])) keep.add(i); return keep; }
/** Adjacency lists of an edge list. */
function adjOf(n, E){ const A = Array.from({ length: n }, () => []); E.forEach((e, k) => { A[e[0]].push([e[1], k]); A[e[1]].push([e[0], k]); }); return A; }
/** Shortest distances from src over adjacency A with edge lengths L (Dijkstra; n is small). Returns [dist, parent edge]. */
function dijkstra(n, A, L, src){
  const D = new Float64Array(n).fill(Infinity), PE = new Int32Array(n).fill(-1), done = new Uint8Array(n); D[src] = 0;
  // a binary heap of [d, i]
  const H = [[0, src]], push = v => { H.push(v); let i = H.length - 1; while(i > 0){ const p = (i - 1) >> 1; if(H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if(H.length){ H[0] = last; let i = 0; for(;;){ const l = 2*i + 1, r = l + 1; let m = i;
    if(l < H.length && H[l][0] < H[m][0]) m = l; if(r < H.length && H[r][0] < H[m][0]) m = r; if(m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
  while(H.length){ const [d, u] = pop(); if(done[u]) continue; done[u] = 1;
    for(const [v, k] of A[u]){ const nd = d + L[k]; if(nd < D[v]){ D[v] = nd; PE[v] = k; push([nd, v]); } } }
  return [D, PE];
}

/**
 * THE GRAPH: nodes P ([x, y] page units), edges E ([a, b]), each edge's use (0..1) and order (0 trunk, 1, 2… finer),
 * hubs, and for Subdivided the faces. o: weave, count, even, loops, hubs, order, wander, where(x, y), ways(x, y),
 * hubsAt(x, y) | null, flow [dx, dy], W, H (page size in page units), R.
 */
export function netGraph(o){
  const { R, W, H } = o, m = 0.07, X0 = -m, Y0 = -m, X1 = W + m, Y1 = H + m, area = (X1 - X0)*(Y1 - Y0);
  const want = Math.max(3, Math.round(o.count)), rmin = o.even*0.8*Math.sqrt(area/want), P = [];
  // ---- 1. nodes: dart-thrown where the map allows, at least rmin apart (Evenness), a few tries each
  const cell = Math.max(rmin, 1e-3), gw = Math.ceil((X1 - X0)/cell) + 1, grid = new Map();
  const near = (x, y) => { const gx = Math.floor((x - X0)/cell), gy = Math.floor((y - Y0)/cell);
    for(let j = gy - 1; j <= gy + 1; j++) for(let i = gx - 1; i <= gx + 1; i++){ const b = grid.get(j*gw + i); if(b) for(const k of b) if(dist(P[k], [x, y]) < rmin) return true; } return false; };
  for(let t = 0; t < want*40 && P.length < want; t++){
    const x = lerp(X0, X1, R()), y = lerp(Y0, Y1, R()), w = o.where(x, y);
    if(R() > w*w*1.2 + 0.02) continue;
    if(rmin > 0 && near(x, y)) continue;
    const key = Math.floor((y - Y0)/cell)*gw + Math.floor((x - X0)/cell); (grid.get(key) || grid.set(key, []).get(key)).push(P.length); P.push([x, y]); }
  while(P.length < 3) P.push([lerp(X0, X1, R()), lerp(Y0, Y1, R())]);
  const n = P.length, cx = W/2, cy = H/2;
  // ---- 2. hubs: the brightest of `hubs at`, else the seed's layout, leaning toward the side the flow comes from
  const nh = Math.max(1, Math.min(8, Math.round(o.hubs))), hubs = [], taken = new Uint8Array(n), apart = 0.6/Math.sqrt(nh);
  const pickBy = score => { let best = -1, bs = -Infinity; for(let i = 0; i < n; i++){ if(taken[i] || hubs.some(h => dist(P[h], P[i]) < apart)) continue; const s = score(i); if(s > bs){ bs = s; best = i; } }
    if(best < 0) for(let i = 0; i < n; i++) if(!taken[i]){ best = i; break; } if(best >= 0){ taken[best] = 1; hubs.push(best); } };
  const layout = Math.floor(R()*5);   // random · a line · a ring · the thirds · off the page
  for(let h = 0; h < nh; h++){
    let tx, ty;
    if(layout === 1){ const t = nh === 1 ? 0.5 : h/(nh - 1); tx = lerp(W*0.15, W*0.85, t); ty = H*(0.3 + R()*0.4); }
    else if(layout === 2){ const a = h/nh*Math.PI*2 + R(); tx = cx + Math.cos(a)*W*0.32; ty = cy + Math.sin(a)*H*0.32; }
    else if(layout === 3){ tx = W*(R() < 0.5 ? 1/3 : 2/3); ty = H*(R() < 0.5 ? 1/3 : 2/3); }
    else if(layout === 4){ const a = R()*Math.PI*2; tx = cx + Math.cos(a)*W*0.7; ty = cy + Math.sin(a)*H*0.7; }
    else { tx = lerp(0, W, R()); ty = lerp(0, H, R()); }
    // (the flow's side: the hubs drawn a third of the way toward it)
    tx = lerp(tx, cx + o.flow[0]*W*0.5, 0.35); ty = lerp(ty, cy + o.flow[1]*H*0.5, 0.35);
    pickBy(o.hubsAt ? i => o.hubsAt(P[i][0], P[i][1])*4 - dist(P[i], [tx, ty])*0.3 : i => -dist(P[i], [tx, ty]));
  }
  // ---- 3. the candidate edges: Delaunay
  const tris = patDelaunay(P), seen = new Set(), D = [];
  for(const t of tris) for(const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]){ const k = a < b ? a*n + b : b*n + a; if(!seen.has(k)){ seen.add(k); D.push([Math.min(a, b), Math.max(a, b)]); } }
  const cost = (a, b) => { const mx = (P[a][0] + P[b][0])/2, my = (P[a][1] + P[b][1])/2; return dist(P[a], P[b])*(1.6 - o.where(mx, my)); };
  D.forEach(e => e[2] = cost(e[0], e[1]));
  let E = [], faces = null, chords = [];
  const weave = o.weave;
  // keep some of base S's non-tree edges (in detour order), then add Delaunay's others back: Loops sweeps tree → mesh
  const loopy = S => {
    const T = mst(n, D), tree = [...T].map(i => D[i]), A = adjOf(n, tree), L = tree.map(e => e[2]);
    // the tree's way round, for every candidate: how much a loop there would save
    const detour = e => { const [Dd] = dijkstra(n, A, L, e[0]); return Dd[e[1]]/Math.max(1e-6, e[2]); };
    const inS = D.map(S), extra = D.map((e, i) => i).filter(i => !T.has(i)).map(i => [i, detour(D[i]) + R()*0.3]).sort((a, b) => b[1] - a[1]);
    const fromS = extra.filter(([i]) => inS[i]), fromD = extra.filter(([i]) => !inS[i]);
    const keepS = Math.round(fromS.length*Math.min(1, o.loops*2)), addD = Math.round(fromD.length*Math.max(0, o.loops*2 - 1)*0.8);
    return [...tree, ...fromS.slice(0, keepS).map(([i]) => D[i]), ...fromD.slice(0, addD).map(([i]) => D[i])];
  };
  if(weave === 0) E = loopy(() => false);
  else if(weave === 1 || weave === 2){
    // relative neighbourhood (an empty lune) or Gabriel (an empty diameter disc)
    const ok = e => { const a = P[e[0]], b = P[e[1]], d = dist(a, b), mx = (a[0] + b[0])/2, my = (a[1] + b[1])/2;
      for(let c = 0; c < n; c++){ if(c === e[0] || c === e[1]) continue; const p = P[c];
        if(weave === 1 ? Math.max(dist(a, p), dist(b, p)) < d : Math.hypot(p[0] - mx, p[1] - my) < d/2) return false; } return true; };
    E = loopy(ok);
  }
  else if(weave === 3){
    // Physarum (Tero 2010) on the Delaunay graph: Kirchhoff flow between pairs of hubs, in turn; conductance grows
    // with the flux it carries and decays without it. Loops: how much the load wanders (more sinks, more loops).
    const m2 = D.length, C = new Float64Array(m2).fill(1), Ln = D.map(e => Math.max(1e-4, e[2])), A = adjOf(n, D), pr = new Float64Array(n);
    const ends = hubs.length > 1 ? hubs : [hubs[0], ...Array.from({ length: 3 }, () => Math.floor(R()*n))];
    for(let it = 0; it < 36; it++){
      let s = ends[it % ends.length]; if(R() < o.loops*0.3) s = Math.floor(R()*n); let t = ends[(it + 1 + Math.floor(R()*(ends.length - 1))) % ends.length];
      if(R() < 0.3 + o.loops*0.5) t = Math.floor(R()*n);   // (a wandering sink: the fluctuating load)
      if(s === t) continue;
      // pressures by Gauss–Seidel: Σ C/L (p_i − p_j) = source
      pr.fill(0);
      for(let g = 0; g < 60; g++) for(let i = 0; i < n; i++){ if(i === t){ pr[i] = 0; continue; } let num = i === s ? 1 : 0, den = 0;
        for(const [j, k] of A[i]){ const c = C[k]/Ln[k]; num += c*pr[j]; den += c; } if(den > 0) pr[i] = num/den; }
      let qmax = 1e-9; const Q = D.map((e, k) => { const q = Math.abs(C[k]/Ln[k]*(pr[e[0]] - pr[e[1]])); qmax = Math.max(qmax, q); return q; });
      for(let k = 0; k < m2; k++) C[k] = Math.max(1e-4, C[k] + 0.6*(Q[k]/qmax - C[k]*0.5));
    }
    let cmax = 0; for(const c of C) cmax = Math.max(cmax, c);
    const T = mst(n, D.map((e, k) => [e[0], e[1], e[2]/(0.05 + C[k]/cmax)]));
    const thr = 0.04 + (1 - o.loops)*0.14;
    // (the strongest tubes, and the faint tree under them that keeps the whole page fed)
    E = D.filter((e, k) => T.has(k) || C[k]/cmax > thr);
    E.forEach(e => { const k = D.indexOf(e); e.slime = C[k]/cmax; });
  }
  else if(weave === 4) E = netStreets(o, P, hubs).E;
  else {
    // a coarse Gabriel graph, whose faces are split by thinner chords order by order
    const coarse = Math.max(6, Math.round(n/7)), Pc = P.slice(0, coarse);
    const okG = e => { const a = Pc[e[0]], b = Pc[e[1]], d = dist(a, b), mx = (a[0] + b[0])/2, my = (a[1] + b[1])/2;
      for(let c = 0; c < coarse; c++){ if(c === e[0] || c === e[1]) continue; if(Math.hypot(Pc[c][0] - mx, Pc[c][1] - my) < d/2) return false; } return true; };
    const tri = patDelaunay(Pc), sn = new Set(), Ec = [];
    for(const t of tri) for(const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]){ const k = a < b ? a*coarse + b : b*coarse + a; if(!sn.has(k)){ sn.add(k); Ec.push([Math.min(a, b), Math.max(a, b), dist(Pc[a], Pc[b])]); } }
    const Tc = mst(coarse, Ec);
    E = Ec.filter((e, k) => Tc.has(k) || okG(e));
    P.length = coarse; hubs.length = 0; for(let h = 0; h < nh && h < coarse; h++){ let b = 0, bs = Infinity; for(let i = 0; i < coarse; i++){ const s = dist(P[i], [cx + o.flow[0]*W*0.4*(h ? R() : 1), cy + o.flow[1]*H*0.4*(h ? R() : 1)]); if(s < bs && !hubs.includes(i)){ bs = s; b = i; } } hubs.push(b); }
    faces = netFaces(P, E);
    const depth = 2 + Math.round(o.order*3), minA = 0.0015 + (1 - o.loops)*0.012;
    const split = (poly, k) => {
      const A = polyArea(poly); if(k >= depth || A < minA*(0.6 + R()*0.8)) return;
      // the longest side, and the side whose middle lies furthest from it: a chord between them
      let li = 0, ll = 0; for(let i = 0; i < poly.length; i++){ const l = dist(poly[i], poly[(i + 1) % poly.length]); if(l > ll){ ll = l; li = i; } }
      const mid = i => { const a = poly[i], b = poly[(i + 1) % poly.length]; return [(a[0] + b[0])/2, (a[1] + b[1])/2]; };
      let oj = -1, od = 0; for(let j = 0; j < poly.length; j++){ if(j === li) continue; const d = dist(mid(j), mid(li)); if(d > od){ od = d; oj = j; } }
      if(oj < 0) return;
      const at = (i, t) => { const a = poly[i], b = poly[(i + 1) % poly.length]; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; };
      const p = at(li, 0.3 + R()*0.4), q = at(oj, 0.3 + R()*0.4);
      chords.push([p, q, k + 1]);
      const [i, j] = li < oj ? [li, oj] : [oj, li], [pi, pj] = li < oj ? [p, q] : [q, p];
      const A1 = [pi, ...poly.slice(i + 1, j + 1), pj], A2 = [pj, ...poly.slice(j + 1), ...poly.slice(0, i + 1), pi];
      split(A1, k + 1); split(A2, k + 1); };
    for(const f of faces) split(f, 0);
  }
  return { P, E, hubs, chords };
}

/** A polygon's area (page units², unsigned). */
function polyArea(p){ let s = 0; for(let i = 0; i < p.length; i++){ const a = p[i], b = p[(i + 1) % p.length]; s += a[0]*b[1] - b[0]*a[1]; } return Math.abs(s)/2; }
/** The bounded faces of a planar straight-line graph, as point lists (half-edges, turning to the next on the left). */
function netFaces(P, E){
  const out = P.map(() => []); E.forEach(([a, b]) => { out[a].push(b); out[b].push(a); });
  const ang = (a, b) => Math.atan2(P[b][1] - P[a][1], P[b][0] - P[a][0]);
  out.forEach((l, a) => l.sort((x, y) => ang(a, x) - ang(a, y)));
  const used = new Set(), faces = [];
  for(const [a0, b0] of E) for(const [s, t] of [[a0, b0], [b0, a0]]){
    if(used.has(s + ',' + t)) continue; const f = []; let u = s, v = t, guard = 0;
    while(!used.has(u + ',' + v) && guard++ < 400){ used.add(u + ',' + v); f.push(P[u]); const l = out[v], i = l.indexOf(u), w = l[(i - 1 + l.length) % l.length]; u = v; v = w; }
    let sg = 0; for(let i = 0; i < f.length; i++){ const p = f[i], q = f[(i + 1) % f.length]; sg += p[0]*q[1] - q[0]*p[1]; }
    if(f.length >= 3) faces.push([f, sg]); }
  // (the bounded faces turn one way, each component's outer face the other: keep the commoner way)
  const pos = faces.filter(f => f[1] > 0).length;
  return faces.filter(f => pos*2 >= faces.length ? f[1] > 0 : f[1] < 0).map(f => f[0]);
}

/**
 * STREETS: roads grown from the hubs along the grain of the ways (each step turns to the nearest of four
 * directions of the local frame, so the grid bends with the material), branching at right angles; a road
 * that comes near a junction joins it, and one that meets a road stops there, which closes the blocks.
 */
function netStreets(o, P0, hubs0){
  const { R, W, H } = o, P = [], E = [], seeds = P0.slice(), m = 0.07, step = 0.9/Math.sqrt(Math.max(9, o.count)), snap = step*0.7, budget = Math.round(o.count*2.2);
  const frame = (x, y) => { const e = 0.01, gx = o.ways(x + e, y) - o.ways(x - e, y), gy = o.ways(x, y + e) - o.ways(x, y - e);
    return Math.hypot(gx, gy) > 1e-4 ? Math.atan2(gy, gx) + Math.PI/2 : o.base; };
  const segHit = (a, b, skip) => { let best = null, bt = 1; for(let k = 0; k < E.length; k++){ if(k === skip) continue; const [i, j] = E[k]; if(i === a.id || j === a.id) continue;
      const p = P[i], q = P[j], d1 = [b[0] - a[0], b[1] - a[1]], d2 = [q[0] - p[0], q[1] - p[1]], den = d1[0]*d2[1] - d1[1]*d2[0]; if(Math.abs(den) < 1e-12) continue;
      const t = ((p[0] - a[0])*d2[1] - (p[1] - a[1])*d2[0])/den, u = ((p[0] - a[0])*d1[1] - (p[1] - a[1])*d1[0])/den;
      if(t > 1e-4 && t <= 1 && u >= 0 && u <= 1 && t < bt){ bt = t; best = [k, t, u]; } } return best; };
  const nearNode = (x, y, not) => { let b = -1, bd = snap; for(let i = 0; i < P.length; i++){ if(not.includes(i)) continue; const d = Math.hypot(P[i][0] - x, P[i][1] - y); if(d < bd){ bd = d; b = i; } } return b; };
  o.base = R()*Math.PI;
  const q = [];
  const hubs = [];
  for(const h of hubs0){ const p = P0[h]; hubs.push(P.length); P.push([p[0], p[1]]);
    const a0 = frame(p[0], p[1]), arms = 2 + Math.floor(R()*3);
    for(let k = 0; k < arms; k++) q.push({ from: P.length - 1, ang: a0 + k*Math.PI/2*(arms === 2 ? 2 : 1), gen: 0, life: 40 }); }
  let made = 0, tries = 0;
  while(made < budget && tries++ < budget*3){
    // (when the roads from the hubs are spent, a new one leaves a junction somewhere else: the town fills out)
    if(!q.length){ let i = Math.floor(R()*P.length);
      // (or a new crossroads anywhere the nodes were thrown)
      if(R() < 0.5){ const p = seeds[Math.floor(R()*seeds.length)]; if(nearNode(p[0], p[1], []) < 0){ i = P.length; P.push([p[0], p[1]]); } }
      const p = P[i]; q.push({ from: i, ang: frame(p[0], p[1]) + Math.floor(R()*4)*Math.PI/2, gen: 1, life: 12 }); }
    const r = q.shift(); let cur = r.from, ang = r.ang, prev = [cur];
    for(let s = 0; s < r.life && made < budget; s++){
      const a = P[cur], f = frame(a[0], a[1]);
      // turn to the nearest of the frame's four ways, and wander a little
      let best = ang, bd = 9; for(let k = 0; k < 4; k++){ const c = f + k*Math.PI/2, d = Math.abs(Math.atan2(Math.sin(c - ang), Math.cos(c - ang))); if(d < bd){ bd = d; best = c; } }
      ang = lerp(ang, best, 0.6) + (R() - 0.5)*o.wander*0.5;
      const len = step*(r.gen ? 0.75 : 1)*(0.8 + R()*0.4), b = [a[0] + Math.cos(ang)*len, a[1] + Math.sin(ang)*len];
      if(b[0] < -m || b[1] < -m || b[0] > W + m || b[1] > H + m) break;
      if(o.where(b[0], b[1]) < 0.12) break;
      a.id = cur; const hit = segHit(a, b, -1);
      if(hit){ const [k, , u] = hit, [i, j] = E[k], p = [lerp(P[i][0], P[j][0], u), lerp(P[i][1], P[j][1], u)], id = P.length; P.push(p);
        E[k] = [i, id, 0, E[k][3]]; E.push([id, j, 0, E[k][3]]); E.push([cur, id, 0, r.gen]); made++; break; }
      const nn = nearNode(b[0], b[1], prev);
      if(nn >= 0){ E.push([cur, nn, 0, r.gen]); made++; break; }
      const id = P.length; P.push(b); E.push([cur, id, 0, r.gen]); made++; prev = [...prev.slice(-3), id]; cur = id;
      // a side road, at right angles (more as Loops rises)
      if(R() < 0.12 + o.loops*0.3) q.push({ from: cur, ang: ang + (R() < 0.5 ? 1 : -1)*Math.PI/2, gen: r.gen + 1, life: Math.round((r.gen ? 8 : 14)*(0.5 + R())) });
    }
  }
  P0.length = 0; P.forEach(p => P0.push(p)); hubs0.length = 0; hubs.forEach(h => hubs0.push(h));
  E.forEach(e => e[2] = dist(P[e[0]], P[e[1]]));
  return { P: P0, E };
}

/** How much each edge carries: the union of shortest-path trees from every hub, each edge's count of the nodes
 *  beyond it (normalized 0..1), and each edge's way (1: a → b runs away from the nearest hub). */
export function netFlow(G){
  const { P, E, hubs } = G, n = P.length, A = adjOf(n, E), L = E.map(e => dist(P[e[0]], P[e[1]])), use = new Float64Array(E.length), way = new Int8Array(E.length), best = new Float64Array(n).fill(Infinity);
  for(const h of hubs){ const [D, PE] = dijkstra(n, A, L, h), order = [...Array(n).keys()].filter(i => isFinite(D[i])).sort((a, b) => D[b] - D[a]), below = new Float64Array(n).fill(1);
    for(const v of order){ const k = PE[v]; if(k < 0) continue; const u = E[k][0] === v ? E[k][1] : E[k][0]; use[k] += below[v]; below[u] += below[v];
      if(D[v] < best[v]){ best[v] = D[v]; way[k] = E[k][1] === v ? 1 : -1; } } }
  let mx = 1; for(const u of use) mx = Math.max(mx, u);
  return { use: Array.from(use, u => u/mx), way };
}

/** An edge's path from a to b by style (0 organic … 1 circuit): curved, straight, octilinear, Manhattan. */
function netRoute(a, b, style, R, wander, ways){
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const mode = style + (R() - 0.5)*0.14;
  if(mode < 0.33){
    // a gentle curve, bent by wander and toward the ways
    const nx = -dy/len, ny = dx/len, mx = (a[0] + b[0])/2, my = (a[1] + b[1])/2, e = len*0.25;
    // (two bends, each its own: toward the ways, and the seed's wander; at times an S)
    const bend = t => { const px = lerp(a[0], b[0], t), py = lerp(a[1], b[1], t); return (ways(px + nx*e, py + ny*e) - ways(px - nx*e, py - ny*e))*1.2 + (R() - 0.5)*(0.3 + wander*0.9); };
    const l1 = bend(1/3), l2 = bend(2/3), c1 = [lerp(a[0], b[0], 1/3) + nx*len*l1, lerp(a[1], b[1], 1/3) + ny*len*l1], c2 = [lerp(a[0], b[0], 2/3) + nx*len*l2, lerp(a[1], b[1], 2/3) + ny*len*l2], out = [];
    for(let i = 0; i <= 10; i++){ const t = i/10, u = 1 - t; out.push([u*u*u*a[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*b[0], u*u*u*a[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*b[1]]); }
    return out; }
  if(mode < 0.66) return [a, b];
  if(mode < 0.9){
    // octilinear: straight along the main axis, then the 45° leg
    const ax = Math.abs(dx), ay = Math.abs(dy), d = Math.min(ax, ay), sx = Math.sign(dx), sy = Math.sign(dy), first = R() < 0.5;
    const c = ax > ay ? (first ? [a[0] + sx*(ax - d), a[1]] : [b[0] - sx*(ax - d), b[1]]) : (first ? [a[0], a[1] + sy*(ay - d)] : [b[0], b[1] - sy*(ay - d)]);
    return [a, c, b]; }
  return R() < 0.5 ? [a, [b[0], a[1]], b] : [a, [a[0], b[1]], b];
}
/** A polyline offset sideways by d (mitred, limited), for the lines of a bus. */
function offsetLine(pts, d){
  const nrm = (p, q) => { const x = q[0] - p[0], y = q[1] - p[1], l = Math.hypot(x, y) || 1; return [-y/l, x/l]; };
  return pts.map((p, i) => { const n0 = i > 0 ? nrm(pts[i - 1], p) : nrm(p, pts[i + 1]), n1 = i < pts.length - 1 ? nrm(p, pts[i + 1]) : n0;
    let mx = n0[0] + n1[0], my = n0[1] + n1[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml; const k = Math.min(2, 1/Math.max(0.5, mx*n1[0] + my*n1[1]));
    return [p[0] + mx*d*k, p[1] + my*d*k]; });
}

export const NETWORK_STEPS = {
  network: { cat: 'Marks', label: 'Network', ins: ['where', 'ways', 'hubs at', 'flow from'], outs: ['lines', 'core', 'order', 'nodes', 'pulses', 'loops', 'height'],
    io: { ins: ['field', 'field', 'field', 'value'], outs: ['field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [NW_R('weave', 'Weave: ' + NET_WEAVES.join(' · '), 0), NW_R('nodes', 'Nodes', 120, 3, 600), NW_R('even', 'Evenness', 60), NW_R('loops', 'Loops', 50), NW_R('hubs', 'Hubs', 3, 1, 8),
      NW_R('order', 'Hierarchy', 60), NW_R('style', 'Organic ↔ Circuit', 65), NW_R('wander', 'Wander', 30), NW_R('width', 'Line Width', 100, 30, 300), NW_R('pads', 'Pads', 50), NW_R('bus', 'Buses', 20),
      NW_R('pulses', 'Pulses', 30), NW_R('variant', 'Variation', 0, 0, 99)], cost: () => 10,
    run(E, n){ const { ww, wh, num } = E, mn = Math.min(ww, wh), W = ww/mn, H = wh/mn;
      const fieldAt = f => f ? (x, y) => f[Math.min(wh - 1, Math.max(0, y*mn | 0))*ww + Math.min(ww - 1, Math.max(0, x*mn | 0))] : null;
      const whereF = E.asField(E.input(n, 1)), waysF = E.asField(E.input(n, 2)), hubF = E.asField(E.input(n, 3)), fv = E.input(n, 4);
      const deg = typeof fv === 'number' ? fv*360 : (E.ctx.light ?? 315), fa = deg*Math.PI/180;
      const seed = ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0) ^ 0x5e1a) >>> 0, R = mulberry32(seed);
      const style = num(n, 'style', 65)/100, order = num(n, 'order', 60)/100, wander = num(n, 'wander', 30)/100;
      const hubMax = hubF ? hubF.reduce((m, v) => Math.max(m, v), 0) : 0;
      const o = { R, W, H, weave: Math.min(5, Math.floor(num(n, 'weave', 0)/100*6)), count: num(n, 'nodes', 120), even: num(n, 'even', 60)/100, loops: num(n, 'loops', 50)/100,
        hubs: num(n, 'hubs', 3), order, wander, flow: [Math.sin(fa), -Math.cos(fa)],
        where: fieldAt(whereF) || (() => 1), ways: fieldAt(waysF) || (() => 0.5), hubsAt: hubMax > 0.05 ? fieldAt(hubF) : null };
      const G = netGraph(o), F = netFlow(G), { P } = G;
      // ---- widths: Murray's law, n from 3 to 2 as Hierarchy rises; Hierarchy also the contrast
      const wk = num(n, 'width', 100)/100, wMax = E.px(26)*wk, wMin = E.px(4)*wk*(1 - order*0.35), mur = 1/lerp(3, 2, order);
      const wOf = u => lerp(wMax*0.45, lerp(wMin, wMax, Math.pow(u, mur)), 0.25 + order*0.75);
      const strokes = G.E.map((e, k) => { const u = e.slime != null ? Math.max(F.use[k], e.slime) : F.use[k] ?? 0, gen = e[3] || 0;
        return { a: e[0], b: e[1], u: gen ? u*Math.pow(0.55, gen) : u, w: wOf(gen ? u*Math.pow(0.55, gen) : u), way: F.way[k] || 1 }; });
      // each node as wide as the widest line it meets (so organic lines taper into their junctions)
      const nw = new Float64Array(P.length), deg2 = new Int32Array(P.length);
      for(const s of strokes){ nw[s.a] = Math.max(nw[s.a], s.w); nw[s.b] = Math.max(nw[s.b], s.w); deg2[s.a]++; deg2[s.b]++; }
      const lines = strokes.map(s => { const pts = netRoute(P[s.a], P[s.b], style, R, wander, o.ways); return { ...s, pts }; });
      // the chords of Subdivided: thinner order by order
      for(const [p, q, k] of G.chords){ const w = Math.max(wMin*0.6, wMax*0.5*Math.pow(0.58, k)*(0.5 + order)); lines.push({ pts: netRoute(p, q, style, R, wander, o.ways), w, u: Math.pow(0.4, k), way: 1, chord: true, w0: w, w1: w }); }
      lines.sort((a, b) => a.u - b.u);
      const taper = Math.max(0, 1 - style*1.4);
      for(const L of lines) if(!L.chord){ const wa = L.w, wb = lerp(L.w, L.w*0.35, taper*(deg2[L.b] === 1 ? 1 : 0.3));
        L.w0 = L.way > 0 ? wa : wb; L.w1 = L.way > 0 ? wb : wa; }
      // ---- the busiest trunks as buses (a share by Buses), the pitch a little over a line
      const busShare = num(n, 'bus', 20)/100*Math.max(0, Math.min(1, (style - 0.4)/0.2)),   // (buses belong to the circuit end)
        busCut = 1 - busShare*0.6;
      // ---- drawing, at the grid's resolution
      const S = mn, T = p => [p[0]*S, p[1]*S];
      const pathOf = (x, pts) => { x.beginPath(); pts.forEach((p, i) => { const [X, Y] = T(p); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); };
      const strokeLine = (x, L, scale, grey) => {
        const pts = L.pts, many = L.w0 !== L.w1 && pts.length > 1;
        x.strokeStyle = grey; x.lineCap = 'round'; x.lineJoin = style > 0.6 ? 'miter' : 'round';
        if(!many){ x.lineWidth = L.w0*scale; pathOf(x, pts); x.stroke(); return; }
        // a taper: the line in short pieces, each at its own width
        const seg = []; for(let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], k = Math.max(1, Math.ceil(dist(a, b)*S/(E.px(14)))); for(let j = 0; j < k; j++) seg.push([[lerp(a[0], b[0], j/k), lerp(a[1], b[1], j/k)], [lerp(a[0], b[0], (j + 1)/k), lerp(a[1], b[1], (j + 1)/k)]]); }
        seg.forEach(([a, b], i) => { x.lineWidth = lerp(L.w0, L.w1, (i + 0.5)/seg.length)*scale; pathOf(x, [a, b]); x.stroke(); }); };
      const busLines = L => { if(L.chord || L.u < busCut || busShare <= 0) return [L]; const k = 2 + Math.floor(L.u*4*busShare + R()*2), pitch = L.w0*1.9/S, out = [];
        for(let i = 0; i < k; i++){ const off = (i - (k - 1)/2)*pitch; out.push({ ...L, pts: offsetLine(L.pts, off), w0: L.w0*0.62, w1: L.w1*0.62 }); } return out; };
      const drawn = lines.flatMap(busLines);
      const linesF = E.marks(null, 0, x => { for(const L of drawn) strokeLine(x, L, 1, '#fff'); });
      const coreF = E.marks(null, 0, x => { for(const L of drawn) strokeLine(x, L, 0.35, '#fff'); });
      const orderF = E.marks(null, 0, x => { for(const L of drawn){ const g = Math.round(40 + 215*Math.pow(L.u, 0.5)); strokeLine(x, L, 1, `rgb(${g},${g},${g})`); } });
      // ---- pads: at every end and junction (not where a line merely passes), rings or vias at the circuit end, beads at the organic
      const padK = num(n, 'pads', 50)/100, pads = [];
      if(padK > 0) for(let i = 0; i < P.length; i++){ const d = deg2[i]; if(d === 0 || (d === 2 && (style > 0.5 || R() > 0.15))) continue;
        if(d >= 3 && style < 0.4 && R() > 0.5) continue;
        const r = (nw[i]*0.5 + E.px(3))*(0.6 + padK*1.6)*(d === 1 ? 1.15 : 1); pads.push([P[i], r, style > 0.55 && (d === 1 || R() < 0.4)]); }
      const nodesF = E.marks(null, 0, x => { for(const [p, r, via] of pads){ const [X, Y] = T(p); x.fillStyle = '#fff'; x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill();
        if(via){ x.fillStyle = '#000'; x.beginPath(); x.arc(X, Y, r*0.42, 0, Math.PI*2); x.fill(); } } });
      // ---- pulses: a bright head and a fading tail, running away from the hubs
      const pk = num(n, 'pulses', 30)/100;
      const pulsesF = E.marks(null, 0, x => { if(pk <= 0) return; x.lineCap = 'round';
        for(const L of lines){ if(R() > pk*(0.35 + L.u)) continue; const pts = L.way > 0 ? L.pts : [...L.pts].reverse(), segs = [];
          let tot = 0; for(let i = 0; i < pts.length - 1; i++){ const d = dist(pts[i], pts[i + 1]); segs.push(d); tot += d; }
          const at = s => { let i = 0; while(i < segs.length - 1 && s > segs[i]){ s -= segs[i]; i++; } const t = Math.min(1, s/(segs[i] || 1)); return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]; };
          const head = (0.2 + R()*0.8)*tot, tail = Math.min(head, tot*0.45), K = 10;
          for(let j = K; j >= 1; j--){ const g = Math.round(255*Math.pow(1 - j/K, 1.6)); x.strokeStyle = `rgb(${g},${g},${g})`; x.lineWidth = L.w0*0.7;
            pathOf(x, [at(head - tail*j/K), at(head - tail*(j - 1)/K)]); x.stroke(); }
          const [X, Y] = T(at(head)); x.fillStyle = '#fff'; x.beginPath(); x.arc(X, Y, L.w0*0.75, 0, Math.PI*2); x.fill(); } });
      // ---- loops: each closed face its own grey (the spaces between the lines, labelled)
      const N = ww*wh, loopsF = new Float32Array(N), lab = new Int32Array(N).fill(-1), Rq = mulberry32(seed ^ 0x77), stack = new Int32Array(N);
      // (only the closed ones: a space that reaches the page's edge is not a loop, and stays black)
      const members = [];
      for(let i = 0, id = 0; i < N; i++){ if(lab[i] >= 0 || linesF[i] > 0.5) continue; const g = 0.08 + Rq()*0.92; let sp = 0, open = false; stack[sp++] = i; lab[i] = id; members.length = 0;
        while(sp){ const j = stack[--sp]; members.push(j); const xj = j % ww; if(xj === 0 || xj === ww - 1 || j < ww || j >= N - ww) open = true;
          for(const k of [xj > 0 ? j - 1 : -1, xj < ww - 1 ? j + 1 : -1, j - ww, j + ww]) if(k >= 0 && k < N && lab[k] < 0 && linesF[k] <= 0.5){ lab[k] = id; stack[sp++] = k; } }
        if(!open) for(const j of members) loopsF[j] = g; id++; }
      // ---- height: the lines raised a little, the core a little more, pads domed, via holes sunk
      const heightF = new Float32Array(N), blurL = E.boxBlur(linesF, Math.max(1, E.px(1.5)));
      for(let i = 0; i < N; i++) heightF[i] = Math.min(1, blurL[i]*0.6 + coreF[i]*0.25 + nodesF[i]*0.3);
      return [linesF, coreF, orderF, nodesF, pulsesF, loopsF, heightF]; } },
};
