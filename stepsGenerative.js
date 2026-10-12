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
  const segs = [];
  for(let i = 0; i < n; i++){ const p = par[i]; if(p < 0) continue;
    segs.push([(X[p] + JX[p])*h, (Y[p] + JY[p])*h, (X[i] + JX[i])*h, (Y[i] + JY[i])*h, desc[i]]); }
  // where two trees met, the burn ran hardest: join their closest tips
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

export const GEN_STEPS = {
  discharge: { cat: 'Marks', label: 'Discharge', ins: ['strike from'], outs: ['channels'], io: { ins: ['value'], outs: ['field'] },
    params: [GEN_R('reach', 'Reach', 50), GEN_R('branching', 'Branching', 50), GEN_R('poles', 'Poles', 2, 1, 3), GEN_R('grain', 'Along the Grain', 30), GEN_R('width', 'Channel Width', 100, 30, 300), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 12,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1);
      const o = { count: Math.round(700 + 8000*num(n, 'reach', 50)/100), eta: 1.2 + (1 - num(n, 'branching', 50)/100)*6.5, poles: Math.round(num(n, 'poles', 2)), grain: num(n, 'grain', 30)/100, dx: dial.x, dy: dial.y };
      const { segs } = withSeed(genSeed(E, n), () => genLichtenberg(ww/unit, wh/unit, o));
      const [c, x] = kitCanvas(ww, wh); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.strokeStyle = '#fff'; x.lineCap = 'round';
      const wk = num(n, 'width', 100)/100;
      // thick where the most current ran; the twigs fade as well as thin
      for(const [x0, y0, x1, y1, cur] of segs){ const w = Math.max(E.px(0.9), E.px(1.6)*wk*Math.pow(cur, 0.34));
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
  growline: { cat: 'Marks', label: 'Growing Line', ins: ['sun'], outs: ['line', 'body', 'relief'], io: { ins: ['value'], outs: ['field', 'field', 'field'] },
    params: [GEN_R('growth', 'Growth', 55), GEN_R('fold', 'Fold Size', 100, 50, 250), GEN_R('seeds', 'Seeds', 1, 1, 7), GEN_R('photo', 'Toward the Sun', 40), GEN_R('variant', 'Variant', 0, 0, 99)], cost: () => 14,
    run(E, n){ const { ww, wh, unit, num } = E, dial = genDial(E, n, 1);
      const o = { growth: num(n, 'growth', 55)/100, fold: num(n, 'fold', 100)/100, seeds: num(n, 'seeds', 1), photo: num(n, 'photo', 40)/100, sun: { x: dial.x, y: dial.y } };
      const { loops } = withSeed(genSeed(E, n), () => genGrowth(ww/unit, wh/unit, o));
      const [lc, lx] = kitCanvas(ww, wh), [bc, bx] = kitCanvas(ww, wh);
      bx.fillStyle = '#000'; bx.fillRect(0, 0, ww, wh); lx.fillStyle = '#000'; lx.fillRect(0, 0, ww, wh);
      // the body: every loop filled (even–odd, so a loop grown round another leaves a ring)
      bx.fillStyle = '#fff'; bx.beginPath(); for(const L of loops){ L.forEach((p, i) => i ? bx.lineTo(p[0]*unit, p[1]*unit) : bx.moveTo(p[0]*unit, p[1]*unit)); bx.closePath(); } bx.fill('evenodd');
      lx.strokeStyle = '#fff'; lx.lineJoin = 'round'; lx.lineWidth = Math.max(1, E.px(3.2)*o.fold);
      lx.beginPath(); for(const L of loops){ L.forEach((p, i) => i ? lx.lineTo(p[0]*unit, p[1]*unit) : lx.moveTo(p[0]*unit, p[1]*unit)); lx.closePath(); } lx.stroke();
      const line = E.asField(E.readCanvas(lc)), body = E.asField(E.readCanvas(bc));
      // relief: the body rounded at its edges, a groove along the line
      const soft = E.boxBlur(body, unit*0.0045*o.fold), rel = new Float32Array(E.N);
      for(let i = 0; i < E.N; i++) rel[i] = genClamp(soft[i]*0.9 - line[i]*0.25 + 0.05);
      return [line, body, rel]; } },
};
