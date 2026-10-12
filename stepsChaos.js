/**
 * stepsChaos.js — steps for ∆ Chaos surfaces (part of the steps library:
 * steps.js gathers them). Fractured Glaze is made of these:
 *
 *   crazing    a glassy layer CRAZED into a network of cracks — big cells
 *              split by finer ones — that blisters, chips and peels with age:
 *              its heights, where the glaze still is, the grime in its cracks,
 *              and the finest crazing (too fine for heights: a normal map)
 *   brushwork  paint brushed on: streaks along one stroke, runs down the
 *              page, slow pools — a thickness, 0..1
 *   glaze      the glaze lit and coloured: thick where it pools, thin (the
 *              body showing) where it breaks over a high spot, its hue
 *              wandering; glossy glaze, matte body; uranium glaze glowing
 *
 * Fractured Glaze is the chain crazing + brushwork → glaze → surface.
 */
import { makeNoiseGrid, sampleNoiseGrid, lightHeights, litK, litS, withSeed, kitCanvas } from './texCore.js';

const CHAOS_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];

/**
 * A crack network: cells of jittered points; at (x, y) the distance to the
 * nearest cell's edge (half the gap between the two nearest points), that
 * cell's id and its centre. Written into `out` (no allocation per pixel —
 * this is the glaze's hottest loop).
 */
function crackNet(ww, wh, size){
  const gx = Math.ceil(ww/size) + 2, gy = Math.ceil(wh/size) + 2, P = new Float32Array(gx*gy*2), id = new Float32Array(gx*gy);
  for(let k = 0; k < gx*gy; k++){ P[k*2] = 0.1 + Math.random()*0.8; P[k*2+1] = 0.1 + Math.random()*0.8; id[k] = Math.random(); }
  return (x, y, out) => {
    const fx = x/size + 1, fy = y/size + 1, ci = Math.floor(fx), cj = Math.floor(fy);
    let d1 = 81, d2 = 81, k1 = 0;
    for(let dj = -1; dj <= 1; dj++){ const j2 = cj + dj; if(j2 < 0 || j2 >= gy) continue;
      for(let di = -1; di <= 1; di++){ const i2 = ci + di; if(i2 < 0 || i2 >= gx) continue;
        const k = j2*gx + i2, dx = fx - i2 - P[k*2], dy = fy - j2 - P[k*2+1], dd = dx*dx + dy*dy;
        if(dd < d1){ d2 = d1; d1 = dd; k1 = k; } else if(dd < d2) d2 = dd; } }
    out.e = (Math.sqrt(d2) - Math.sqrt(d1))*0.5*size; out.id = id[k1];
    out.cx = ((k1 % gx) + P[k1*2] - 1)*size; out.cy = (Math.floor(k1/gx) + P[k1*2+1] - 1)*size;
  };
}

// Two chemicals, one feeding,
// one eating — and out of nothing
// the leopard's spots.
// THE GRAY–SCOTT MODEL (Turing Skin's own, texChaos genTuringSkin until now): two chemicals on a torus, one
// feeding the other, walked along the feed/kill map by Pattern — spots → coral → maze → worms → holes (Pearson
// 1993's classes; Karl Sims's tutorial). Its own grid, whatever the page's; then sampled bicubically and given a
// crisp edge. Returns the pattern as a field 0..1 on the ww×wh grid.
function chaosTuring(ww, wh, growth, zoom, form){
  const FK = [[0.0367, 0.0649], [0.0545, 0.062], [0.029, 0.057], [0.078, 0.061], [0.039, 0.058]];
  const t = Math.max(0, Math.min(1, form))*(FK.length - 1), i0 = Math.min(FK.length - 2, Math.floor(t)), fr = t - i0;
  const Fd = FK[i0][0] + (FK[i0 + 1][0] - FK[i0][0])*fr, Kd = FK[i0][1] + (FK[i0 + 1][1] - FK[i0][1])*fr;
  const G = Math.max(48, Math.min(160, Math.round(110/zoom))), short = Math.min(ww, wh);
  const gx = Math.max(16, Math.round(G*ww/short)), gy = Math.max(16, Math.round(G*wh/short)), n = gx*gy;
  let A = new Float32Array(n).fill(1), B = new Float32Array(n), A2 = new Float32Array(n), B2 = new Float32Array(n);
  // seeds: small patches, a few of them large; and a few stray specks
  const seeds = 6 + Math.floor(Math.random()*10);
  for(let s = 0; s < seeds; s++){ const cx = Math.floor(Math.random()*gx), cy = Math.floor(Math.random()*gy), r = 1 + Math.floor(Math.random()*3);
    for(let y = -r; y <= r; y++) for(let x = -r; x <= r; x++){ const k = ((cy + y + gy) % gy)*gx + ((cx + x + gx) % gx); B[k] = 1; A[k] = 0.5; } }
  for(let k = 0; k < n; k++) if(Math.random() < 0.002) B[k] = 0.5;
  // (a budget of cell-updates, so a fine pattern on a wide page stays quick)
  const iters = Math.min(Math.round(900 + 5100*growth), Math.round(55e6/n));
  for(let it = 0; it < iters; it++){
    for(let y = 0; y < gy; y++){
      const yu = ((y - 1 + gy) % gy)*gx, yc = y*gx, yd = ((y + 1) % gy)*gx;
      for(let x = 0; x < gx; x++){
        const xl = x === 0 ? gx - 1 : x - 1, xr = x === gx - 1 ? 0 : x + 1, k = yc + x, a = A[k], b = B[k];
        const la = 0.2*(A[yu + x] + A[yd + x] + A[yc + xl] + A[yc + xr]) + 0.05*(A[yu + xl] + A[yu + xr] + A[yd + xl] + A[yd + xr]) - a;
        const lb = 0.2*(B[yu + x] + B[yd + x] + B[yc + xl] + B[yc + xr]) + 0.05*(B[yu + xl] + B[yu + xr] + B[yd + xl] + B[yd + xr]) - b;
        const abb = a*b*b;
        A2[k] = a + (1.0*la - abb + Fd*(1 - a)); B2[k] = b + (0.5*lb + abb - (Kd + Fd)*b);
      }
    }
    let tmp = A; A = A2; A2 = tmp; tmp = B; B = B2; B2 = tmp;
  }
  const at = (x, y) => B[((y % gy + gy) % gy)*gx + ((x % gx + gx) % gx)];
  const cub = (p0, p1, p2, p3, t2) => p1 + 0.5*t2*(p2 - p0 + t2*(2*p0 - 5*p1 + 4*p2 - p3 + t2*(3*(p1 - p2) + p3 - p0)));
  let bmin = Infinity, bmax = -Infinity; for(let k = 0; k < n; k++){ if(B[k] < bmin) bmin = B[k]; if(B[k] > bmax) bmax = B[k]; }
  const mid = bmin + (bmax - bmin)*0.45, soft = Math.max(0.01, (bmax - bmin)*0.12), S = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++){ const fy = (y + 0.5)/wh*gy - 0.5, y1 = Math.floor(fy), ty = fy - y1;
    for(let x = 0; x < ww; x++){ const fx = (x + 0.5)/ww*gx - 0.5, x1 = Math.floor(fx), tx = fx - x1;
      const row = j => cub(at(x1 - 1, y1 + j), at(x1, y1 + j), at(x1 + 1, y1 + j), at(x1 + 2, y1 + j), tx);
      const v = cub(row(-1), row(0), row(1), row(2), ty), s = Math.max(0, Math.min(1, (v - mid)/soft*0.5 + 0.5));
      S[y*ww + x] = s*s*(3 - 2*s); } }
  return S;
}

// The glaze lets go
// along a line, and the line
// lets go of a line.
// SPREADING CRACKS (Jared Tarbell's "Substrate", 2003, laid on a glaze): a crack runs straight, curving a little,
// until it meets another crack or the edge; then a new one starts from a point on a crack already there, at right
// angles to it. So the first cracks are long and cross the piece, and each later one is shorter, closing smaller
// cells — the hierarchy real crackle has. SPREAD: 0, they start anywhere (craquelure); toward 100, the first ones
// burst from one point of impact, where the dial points. Returns { segs: [x0,y0,x1,y1,gen] } on a w×h grid.
function chaosCracks(w, h, o){
  const unit = Math.min(w, h), N = w*h, A = new Float32Array(N).fill(NaN), ID = new Int32Array(N).fill(-1), marked = [];
  const ix = (x, y) => (y|0)*w + (x|0);
  const segs = [], active = [], maxCracks = Math.round(o.count);
  let made = 0;
  const start = (x, y, a, gen) => { if(made >= maxCracks) return; made++; active.push({ id: made, x, y, a, gen, sx: x, sy: y, curve: (Math.random() - 0.5)*o.wander*0.012, steps: 0 }); };
  // the first cracks: from the impact (Spread), the rest anywhere
  const px = w/2 + o.dx*w*0.38, py = h/2 + o.dy*h*0.38, nRad = Math.round(o.spread*12), nFree = Math.max(2, Math.round((1 - o.spread)*8));
  for(let k = 0; k < nRad; k++){ const a = k/nRad*Math.PI*2 + Math.random()*0.4; start(px + Math.cos(a)*2, py + Math.sin(a)*2, a, 0); }
  for(let k = 0; k < nFree; k++) start(Math.random()*w, Math.random()*h, Math.random()*Math.PI*2, 0);
  const step = 0.6;
  while(active.length){
    const c = active.shift(); let alive = true, run = 0; const pts = [c.x, c.y];
    while(alive){
      c.a += c.curve + (Math.random() - 0.5)*o.wander*0.03; const nx = c.x + Math.cos(c.a)*step, ny = c.y + Math.sin(c.a)*step;
      if(nx < 0 || ny < 0 || nx >= w || ny >= h){ alive = false; break; }
      const k = ix(nx, ny);
      // another crack here (its cell, or one beside it — a thin line crossed on the diagonal is still met): stop on it
      if(run > 2){ let hit = false; const X0 = nx|0, Y0 = ny|0;
        for(let dy = -1; dy <= 1 && !hit; dy++) for(let dx = -1; dx <= 1 && !hit; dx++){ if(dx && dy) continue; const xx = X0 + dx, yy = Y0 + dy; if(xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const q = ID[yy*w + xx]; if(q >= 0 && q !== c.id) hit = true; }
        if(hit){ c.x = nx; c.y = ny; alive = false; break; } }
      c.x = nx; c.y = ny; run++; if(run % 6 === 0) pts.push(c.x, c.y);
      if(ID[k] < 0){ ID[k] = c.id; A[k] = c.a; marked.push(k); }
    }
    pts.push(c.x, c.y);
    if(run > 1) for(let q = 0; q + 3 < pts.length; q += 2) segs.push([pts[q], pts[q+1], pts[q+2], pts[q+3], c.gen]);   // (the path as it ran: a chord would cut across the cracks it curved round)
    // and a new crack from a point on one already there, at right angles to it (two, while the piece is young)
    for(let t = 0; t < 2; t++){ if(made >= maxCracks || !marked.length) break;
      const k = marked[Math.floor(Math.random()*marked.length)], x = k % w + 0.5, y = (k/w | 0) + 0.5;
      const a = A[k] + (Math.random() < 0.5 ? 1 : -1)*(Math.PI/2 + (Math.random() - 0.5)*0.25*o.wander);
      start(x + Math.cos(a)*1.2, y + Math.sin(a)*1.2, a, Math.min(6, c.gen + 1)); }
  }
  return { segs };
}

export const CHAOS_STEPS = {
  cracks: { cat: 'Noise', label: 'Spreading Cracks', ins: ['impact at'], outs: ['height', 'glaze', 'grime', 'fine'], io: { ins: ['value'], outs: ['field', 'field', 'field', 'field'] },
    params: [CHAOS_R('scale', 'Crack Scale', 100, 50, 300), CHAOS_R('count', 'Cracks', 100, 20, 400), CHAOS_R('spread', 'From One Point', 30), CHAOS_R('wander', 'Wander', 40), CHAOS_R('age', 'Chipping', 0), CHAOS_R('variant', 'Variant', 0, 0, 99)], cost: () => 10,
    run(E, n){ const { ww, wh, N, unit, num, input, ctx } = E;
      const dv = input(n, 1), deg = typeof dv === 'number' ? dv*360 : (ctx.light ?? 315), da = (deg - 90)*Math.PI/180, zoom = num(n, 'scale', 100)/100;
      const area = (ww/unit)*(wh/unit), o = { count: 240*area*num(n, 'count', 100)/100/(zoom*zoom), spread: num(n, 'spread', 30)/100, wander: num(n, 'wander', 40)/100, dx: Math.cos(da), dy: Math.sin(da) };
      const seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => {
        const { segs } = chaosCracks(ww, wh, o), age = num(n, 'age', 0)/100;
        // the cracks drawn: the first wide and deep, each generation after finer
        const [cc, cx] = kitCanvas(ww, wh), [fc, fx] = kitCanvas(ww, wh), [kc, kx] = kitCanvas(ww, wh);
        for(const x of [cx, fx, kx]){ x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); x.lineCap = 'round'; }
        cx.strokeStyle = '#fff'; fx.strokeStyle = '#fff';
        for(const [x0, y0, x1, y1, g] of segs){ const wd = Math.max(E.px(1.1), E.px(4.2)*Math.sqrt(zoom)*Math.pow(0.7, g));
          const t = g >= 3 ? fx : cx; t.lineWidth = g >= 3 ? Math.max(E.px(0.9), wd) : wd; t.beginPath(); t.moveTo(x0, y0); t.lineTo(x1, y1); t.stroke(); }
        // chips: flakes of glaze gone where cracks meet (Chipping), each an uneven polygon
        if(age > 0){ kx.fillStyle = '#fff'; const nC = Math.round(o.count*age*0.5);
          for(let k = 0; k < nC; k++){ const s = segs[Math.floor(Math.random()*segs.length)], t = Math.random() < 0.6 ? 1 : Math.random(), x = s[0] + (s[2] - s[0])*t, y = s[1] + (s[3] - s[1])*t, r = E.px(6 + Math.random()*26)*Math.sqrt(zoom)*(0.5 + age);
            kx.beginPath(); const m = 6 + Math.floor(Math.random()*4); for(let q = 0; q < m; q++){ const a = q/m*Math.PI*2, rr = r*(0.5 + Math.random()*0.7); q ? kx.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr) : kx.moveTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } kx.closePath(); kx.fill(); } }
        const CR = E.asField(E.readCanvas(cc)), FN = E.asField(E.readCanvas(fc)), CH = E.asField(E.readCanvas(kc));
        // each cell of glaze a little domed (lower toward its cracks); grime settles in and beside the cracks
        const near = E.boxBlur(CR, unit*0.012*Math.sqrt(zoom)), lip = E.boxBlur(CR, unit*0.002);
        const H = new Float32Array(N), GL = new Float32Array(N), DIRT = new Float32Array(N);
        for(let i = 0; i < N; i++){ const c = Math.max(CR[i], FN[i]*0.6), ch = CH[i];
          H[i] = Math.max(0, 1 - c*0.85 - near[i]*0.35 - ch*0.45); GL[i] = Math.min(1 - c*0.6, 1 - ch);
          DIRT[i] = Math.min(1, lip[i]*1.6 + c*0.8); }
        return [H, GL, DIRT, FN]; }); } },
  grayscott: { cat: 'Noise', label: 'Turing Pattern', ins: [], outs: ['pattern'],
    params: [CHAOS_R('pattern', 'Pattern', 25), CHAOS_R('growth', 'Growth', 80, 20, 100), CHAOS_R('scale', 'Scale', 100, 50, 250), CHAOS_R('variant', 'Variant', 0, 0, 99)], cost: () => 30,
    run(E, n){ const { ww, wh, num, ctx } = E, seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => [chaosTuring(ww, wh, Math.max(0.1, Math.min(1, num(n, 'growth', 80)/100)), num(n, 'scale', 100)/100, num(n, 'pattern', 25)/100)]); } },
  crazing: { cat: 'Textures', label: 'Crazing', ins: [], outs: ['height', 'glaze', 'grime', 'fine'],
    params: [CHAOS_R('scale', 'Fracture Scale', 100, 60, 400), CHAOS_R('density', 'Crack Density', 100, 10, 900), CHAOS_R('age', 'Enameling', 0)], cost: () => 14,
    // Crazing as it really looks: hairline cracks in a glassy surface that is
    // otherwise smooth — the big cells' cracks are narrow V-grooves with grime
    // settled in them, the finer nets fainter still. As it ages it BLISTERS,
    // CHIPS at the cracks, and at last PEELS whole cells away to the rough
    // body below, the glaze's broken edge CURLING up off it.
    run(E, n){ const { ww, wh, unit, num } = E;
      const zoom = num(n, 'scale', 100)/100, amt = num(n, 'density', 100)/100, enamel = Math.max(0, Math.min(1, num(n, 'age', 0)/100));
      const N = ww*wh, nCells = Math.max(4, Math.round(26*amt/(zoom*zoom)));
      const cs = Math.sqrt(N/nCells), fineCs = cs*0.42;
      const primary = crackNet(ww, wh, cs), secondary = crackNet(ww, wh, fineCs), crackle = crackNet(ww, wh, cs*0.17);
      const warp = makeNoiseGrid(9, 9), warpY = makeNoiseGrid(9, 9), peelField = makeNoiseGrid(6, 6), grit = makeNoiseGrid(64, 64);
      const t = unit*0.006*Math.sqrt(zoom);
      const H = new Float32Array(N), GL = new Float32Array(N), DIRT = new Float32Array(N), FN = new Float32Array(N);
      const peelAt = enamel < 0.6 ? 1.1 : 1.05 - (enamel - 0.6)*1.05;
      const chipAt = enamel < 0.4 ? 1.1 : 1.0 - (enamel - 0.4)*0.9;
      // groove widths: the big cracks hairlines, never under a pixel (they would flicker)
      const w1 = Math.max(1.1, unit*0.0024), w2 = Math.max(0.9, unit*0.0018), w3 = Math.max(0.8, unit*0.001);
      const A = { e: 0, id: 0, cx: 0, cy: 0 }, B = { e: 0, id: 0, cx: 0, cy: 0 }, C = { e: 0, id: 0, cx: 0, cy: 0 };
      for(let y = 0; y < wh; y++){ const v = y/wh;
        for(let x = 0; x < ww; x++){
          const u = x/ww, k = y*ww + x;
          const qx = x + (sampleNoiseGrid(warp, 9, 9, u*8, v*8) - 0.5)*cs*0.35, qy = y + (sampleNoiseGrid(warpY, 9, 9, u*8, v*8) - 0.5)*cs*0.35;
          primary(qx, qy, A); secondary(qx, qy, B);
          const rough = (sampleNoiseGrid(grit, 64, 64, u*63, v*63) - 0.5)*t*0.25;
          const field = sampleNoiseGrid(peelField, 6, 6, Math.max(0, Math.min(1, A.cx/ww))*5, Math.max(0, Math.min(1, A.cy/wh))*5);
          const peeled = field*0.7 + A.id*0.45 > peelAt;
          const chipped = !peeled && A.e < cs*0.14*(0.4 + B.id) && ((A.id*7.3 + B.id*3.1) % 1) > chipAt;
          if(peeled || chipped){ H[k] = rough; continue; }        // the body: lower, rough, matte
          crackle(qx, qy, C);
          // a V-groove, not a trough: the cracks read as lines, not as moats
          const g1 = Math.pow(Math.max(0, 1 - A.e/w1), 1.6), g2 = Math.pow(Math.max(0, 1 - B.e/w2), 1.4)*0.55, g3 = Math.max(0, 1 - C.e/w3)*0.22;
          const fine = Math.max(g2, g3);
          H[k] = t - t*0.55*g1 + rough*0.2;
          FN[k] = fine;
          GL[k] = 1 - Math.max(g1*0.6, fine*0.25);
          DIRT[k] = Math.max(g1*0.9, g2*0.7, g3*0.4);
        }
      }
      // the CURL: where the glaze has peeled, its edge rolls up off the body
      if(enamel > 0.35){
        const R = Math.max(2, unit*0.012), D = new Float32Array(N);
        for(let k = 0; k < N; k++) D[k] = GL[k] > 0 ? 1e6 : 0;
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const k = y*ww + x; if(!D[k]) continue; let m = D[k];
          if(x > 0) m = Math.min(m, D[k-1] + 1); if(y > 0){ m = Math.min(m, D[k-ww] + 1); if(x > 0) m = Math.min(m, D[k-ww-1] + 1.414); if(x < ww-1) m = Math.min(m, D[k-ww+1] + 1.414); } D[k] = m; }
        for(let y = wh-1; y >= 0; y--) for(let x = ww-1; x >= 0; x--){ const k = y*ww + x; if(!D[k]) continue; let m = D[k];
          if(x < ww-1) m = Math.min(m, D[k+1] + 1); if(y < wh-1){ m = Math.min(m, D[k+ww] + 1); if(x < ww-1) m = Math.min(m, D[k+ww+1] + 1.414); if(x > 0) m = Math.min(m, D[k+ww-1] + 1.414); } D[k] = m; }
        const lift = Math.min(1, (enamel - 0.35)/0.45);
        for(let k = 0; k < N; k++){ if(GL[k] <= 0 || D[k] > R) continue;
          const q = D[k]/R; H[k] += t*1.0*lift*Math.sin(Math.PI*Math.min(1, q*1.15))*(1 - q*0.4); DIRT[k] *= 0.5; }
      }
      // bubbles: blisters in the glaze, some burst into pinholes
      const nBub = Math.round(Math.sin(Math.min(1, enamel*1.4)*Math.PI)*N/(unit*unit)*240);
      for(let q = 0; q < nBub; q++){
        const bx = Math.random()*ww, by = Math.random()*wh, r = unit*(0.003 + Math.pow(Math.random(), 1.6)*0.012), burst = Math.random() < 0.3;
        const x0 = Math.max(0, Math.floor(bx - r)), x1 = Math.min(ww - 1, Math.ceil(bx + r)), y0 = Math.max(0, Math.floor(by - r)), y1 = Math.min(wh - 1, Math.ceil(by + r));
        for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ const k = y*ww + x; if(GL[k] <= 0) continue;
          const q2 = 1 - ((x - bx)**2 + (y - by)**2)/(r*r); if(q2 <= 0) continue;
          if(burst){ H[k] -= t*0.7*Math.pow(q2, 2); DIRT[k] = Math.max(DIRT[k], q2*0.7); } else H[k] += t*0.9*Math.sqrt(q2); }
      }
      // heights travel as a field: in units of the glaze's thickness (the glaze step scales them back)
      for(let k = 0; k < N; k++) H[k] /= t;
      return [H, GL, DIRT, FN];
    } },

  brushwork: { cat: 'Noise', label: 'Brushwork', ins: [], outs: ['thickness'],
    params: [CHAOS_R('streaks', 'Streaks', 55), CHAOS_R('runs', 'Runs', 30), CHAOS_R('pools', 'Pools', 60)], cost: () => 3,
    // paint brushed on: streaks along one stroke (by the seed), runs down the
    // page, slow pools — how thick it lies, 0..1 (0.5: as meant)
    run(E, n){ const { num, field } = E;
      const ks = num(n, 'streaks', 55)/100, kr = num(n, 'runs', 30)/100, kp = num(n, 'pools', 60)/100;
      const ba = Math.random()*Math.PI, bc = Math.cos(ba), bs = Math.sin(ba);
      const strk = makeNoiseGrid(48, 48), runs = makeNoiseGrid(64, 16), pool = makeNoiseGrid(7, 7);
      return [field((u, v) => { const al = u*bc + v*bs, ac = -u*bs + v*bc;
        return Math.max(0, Math.min(1, 0.5 + (sampleNoiseGrid(strk, 48, 48, al*3, ac*40) - 0.5)*ks + (sampleNoiseGrid(runs, 64, 16, u*63, v*4) - 0.5)*kr + (sampleNoiseGrid(pool, 7, 7, u*6, v*6) - 0.5)*kp)); })];
    } },

  glaze: { cat: 'Light & Color', label: 'Glaze', ins: ['height', 'glaze', 'grime', 'fine', 'thickness', 'glaze hue', 'base hue'], outs: ['image'],
    params: [CHAOS_R('scale', 'Fracture Scale', 100, 60, 400), CHAOS_R('gloss', 'Gloss', 85), CHAOS_R('grime', 'Grime', 40)], cost: () => 16,
    // Coloured as a game engine would: GLAZE and BASE (the clay body, bare in
    // chips, peels and crack bottoms) are the albedos; the material hues (the
    // light's colour, the shine, the shade) colour the light; heights lit by
    // the dial with the fine crazing as normals and a gloss per pixel (the
    // glaze glassy, its cracks duller, the bare body matte). The glaze is
    // PAINTED: thick glaze pools deeper, thin glaze breaks and the body shows.
    run(E, n){ const { ww, wh, unit, ctx, input, num, asField, asColour, hexCol } = E;
      const N = ww*wh, h0 = asField(input(n, 1), 1), GL = asField(input(n, 2), 1), DIRT = asField(input(n, 3), 0), FN = asField(input(n, 4), 0), THK = asField(input(n, 5), 0.5);
      const gz = asColour(input(n, 6), hexCol((ctx.tints || [])[0] || '#A9B4B0')), bs = asColour(input(n, 7), hexCol((ctx.tints || [])[1] || '#7A6A5E'));
      const GZ = [gz[0]*255, gz[1]*255, gz[2]*255], BS = [bs[0]*255, bs[1]*255, bs[2]*255];
      const zoom = num(n, 'scale', 100)/100, gloss = num(n, 'gloss', 85)/100, grime = num(n, 'grime', 40)/100, M3 = ctx.mat || null, GLW = ctx.glow || null;
      const t = unit*0.006*Math.sqrt(zoom), H = new Float32Array(N);
      for(let k = 0; k < N; k++) H[k] = h0[k]*t + (GL[k] > 0 ? t*0.35*(THK[k] - 0.5) : 0);
      // the fine crazing as normals (a groove's walls face across it)
      const NM = new Float32Array(N*3), fd = t*0.22;   // shallow: crazing reads as fine dark lines, not embossing
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const k = y*ww + x;
        const gx = -(FN[y*ww + Math.min(ww-1, x+1)] - FN[y*ww + Math.max(0, x-1)])*0.5*fd, gy = -(FN[Math.min(wh-1, y+1)*ww + x] - FN[Math.max(0, y-1)*ww + x])*0.5*fd;
        const l = Math.sqrt(gx*gx + gy*gy + 1); NM[k*3] = -gx/l; NM[k*3+1] = -gy/l; NM[k*3+2] = 1/l; }
      const GM = new Float32Array(N); for(let k = 0; k < N; k++) GM[k] = 0.06 + 0.84*GL[k];
      const L = lightHeights(H, ww, wh, { light: ctx.light ?? 315, relief: 1, gloss, shadow: 0.6, ao: 0.35, ambient: 0.45, normals: NM, glossMap: GM });
      const fl = L.flat || 1;
      // the glaze's own wandering colour: a second hue, a little round the wheel
      const sh2 = (Math.random() - 0.5)*0.5, G2 = [GZ[0] + (GZ[1] - GZ[0])*sh2, GZ[1] + (GZ[2] - GZ[1])*sh2, GZ[2] + (GZ[0] - GZ[2])*sh2];
      const hueN = makeNoiseGrid(5, 5), grain2 = makeNoiseGrid(80, 80);
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, OUT = [o.r, o.g, o.b];
      const GW = GLW ? [GLW.r, GLW.g, GLW.b] : null;
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
        const k = y*ww + x, g = GL[k], th = THK[k];
        const hv = sampleNoiseGrid(hueN, 5, 5, x/ww*4, y/wh*4), gr = 0.85 + 0.3*sampleNoiseGrid(grain2, 80, 80, x/ww*79, y/wh*79);
        const sp = L.spec[k]*(0.35 + 0.65*g)*0.75, thin = Math.max(0, 0.45 - th)*1.2, dirt = 1 - DIRT[k]*grime;
        for(let c = 0; c < 3; c++){
          const gzc = GZ[c]*(1 - hv) + G2[c]*hv;
          const alb = g > 0 ? gzc*(1.12 - 0.3*th)*(1 - thin) + BS[c]*thin : BS[c]*gr;
          let v = alb*(litK(L, k, 0.45, M3, c)/fl)*dirt + 255*sp*litS(M3, c);
          if(GW && g > 0) v += 255*GW[c]*(0.4 + 0.6*th)*0.55;
          OUT[c][k] = (v < 0 ? 0 : v > 255 ? 255 : v)/255;
        }
      }
      return [o];
    } },
};
