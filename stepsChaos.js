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
import { makeNoiseGrid, sampleNoiseGrid, lightHeights, litK, litS } from './texCore.js';

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

export const CHAOS_STEPS = {
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

  glaze: { cat: 'Light & Colour', label: 'Glaze', ins: ['height', 'glaze', 'grime', 'fine', 'thickness', 'glaze hue', 'base hue'], outs: ['image'],
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
