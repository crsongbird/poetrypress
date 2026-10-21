/**
 * stepsWhimsy.js — steps for ♡ Whimsy surfaces (part of the steps library:
 * steps.js gathers them). Two textures are made of these, and every part is
 * a part on its own, to lay on anything:
 *
 *   SLEEP HAZE        smoke → light shaft → dust motes
 *     smoke           haze in strata and wisps rising, carried by curl noise
 *                     (LIFT, DRAG); out: how dense the smoke is
 *     light shaft     a shaft of light from the dial through ANY density: the
 *                     smoke in it glows, its own shadow darkens it (DUST)
 *     dust motes      motes drifting everywhere, seen only where a beam
 *                     catches them; a few near the lens, large and soft
 *
 *   PAINTED LANDSCAPE painted sky → painted ridges → watercolour wash
 *     painted sky     a time of day, its sky wash, a sun or a moon, painted
 *                     clouds (cumulus, stratus, cirrus)
 *     painted ridges  a COUNTRY of the seed's (twelve biomes), band behind
 *                     band, brushed, laid over whatever sky comes in
 *     watercolour wash  blooms and a soft bleed, over any picture (WETNESS)
 *
 * The sky and the ridges agree on the country, the time and the sun because
 * the SEED chooses them (seedChoice), not each part's own random stream; set
 * one in a part's menu to fix it there.
 *
 * Each part RUNS on the Athanor's grid and PAINTS in a canvas pass (the
 * textures themselves: chains.js 'clouds', 'landscape'), where it works on
 * its own grid (smoke is soft by nature) or at full size (a stroke is not).
 */
import { canonArea, canonDiv, wordsRoom, mulberry32, cpx, smoothField, pageSunAt, kitCanvas, kitPicture, kitField, kitFieldCanvas, seedChoice, withSeed, lightVec, dialVec, makeNoiseGrid, sampleNoiseGrid, CPU, kitWhole, wholeDial, wholeHex, wholeZoom, wholeAmt, wholeShare } from './texCore.js';
import { genEmbers, genSnow, genMagicParticles, genAstralStars, genMoon, genAuroraVeil, genBokeh, genFeathers } from './texWhimsy.js';
import { skyRingFrame } from './stepsGenerative.js';
import { pkTree, pkSpire, pkMonolith, pkCrystals } from './paintKit.js';

const WHIM_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
/** The birds the Feathers part draws (its Bird setting, in fifths). */
const FEATHER_BIRDS = ['plain', 'crow', 'raven', 'magpie', 'jay'];
const WHIM_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
const whimClamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

// ---- value noise on a shuffled table (the smoke's own) ----
function whimNoise(){
  const perm = new Uint8Array(512), base = [...Array(256).keys()];
  for(let i = 255; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  for(let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const fade = t => t*t*(3 - 2*t);
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = fade(xf), v = fade(yf);
    const a = perm[(perm[xi & 255] + yi) & 511], b = perm[(perm[(xi + 1) & 255] + yi) & 511];
    const c2 = perm[(perm[xi & 255] + yi + 1) & 511], d = perm[(perm[(xi + 1) & 255] + yi + 1) & 511];
    return ((a*(1 - u) + b*u)*(1 - v) + (c2*(1 - u) + d*u)*v)/255; };
  const fbm = (x, y) => { let s = 0, a = 0.5, f = 1; for(let o = 0; o < 4; o++){ s += vn(x*f, y*f)*a; a *= 0.5; f *= 2.07; } return s/0.9375; };
  return { vn, fbm };
}
// a field read between its cells
const whimSamp = (F, ww, wh, x, y) => { x = x < 0 ? 0 : x > ww - 1.001 ? ww - 1.001 : x; y = y < 0 ? 0 : y > wh - 1.001 ? wh - 1.001 : y;
  const x0 = x | 0, y0 = y | 0, tx = x - x0, ty = y - y0, k = y0*ww + x0;
  return (F[k]*(1 - tx) + F[k + 1]*tx)*(1 - ty) + (F[k + ww]*(1 - tx) + F[k + ww + 1]*tx)*ty; };
// soften a field in place (two box passes make a near-gaussian)
function whimBoxBlur(F, ww, wh, R){
  const N = ww*wh, tmp = new Float32Array(N), n = 2*R + 1;
  for(let y = 0; y < wh; y++){ const r = y*ww; let s = 0; for(let x = -R; x <= R; x++) s += F[r + Math.min(ww - 1, Math.max(0, x))];
    for(let x = 0; x < ww; x++){ tmp[r + x] = s/n; s += F[r + Math.min(ww - 1, x + R + 1)] - F[r + Math.max(0, x - R)]; } }
  for(let x = 0; x < ww; x++){ let s = 0; for(let y = -R; y <= R; y++) s += tmp[Math.min(wh - 1, Math.max(0, y))*ww + x];
    for(let y = 0; y < wh; y++){ F[y*ww + x] = s/n; s += tmp[Math.min(wh - 1, y + R + 1)*ww + x] - tmp[Math.max(0, y - R)*ww + x]; } }
}

/**
 * SMOKE in a dusty room, as a density field on a ww×wh grid. Haze pools in
 * soft strata under the ceiling; WISPS rise from a few smouldering sources —
 * a narrow laminar plume that breaks into curls as it climbs (particles
 * carried by curl noise), thinning as it goes. LIFT is how far and straight
 * they rise; DRAG the draught pulling them sideways, more the higher they
 * get. Now and then a SMOKE RING drifts up, trailing a wake.
 */
export function smokeField(ww, wh, lift, drag){
  const unit = Math.min(ww, wh), N = ww*wh, { fbm } = whimNoise();
  lift = Math.max(0.4, lift);
  // near enough a normal for drifting smoke (the sum of three uniforms), at a fraction of Box–Muller's cost
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5)*2;
  // 1 · HAZE: soft strata, denser toward the ceiling (more so with more lift)
  const haze = smoothField(ww, wh, 4, (fu, fv) => { const u = fu*ww/unit, v = fv*wh/unit, up = 1 - fv;
    const q = fbm(u*1.1 + 3.1, v*1.1 + 7.7);
    const s = fbm((u + drag*0.5*up + 0.7*q)*1.3, (v*2.8 + 0.5*q)*1.3);
    return whimClamp01((s - 0.34)/0.44)*(0.15 + 0.85*Math.pow(up, 1.4/lift)); });
  // 2 · WISPS: particles carried by curl noise (the curl of a smooth potential
  // swirls without ever converging, as smoke does). Two potentials, blended per
  // particle, so neighbouring strands drift apart as they climb.
  const PA = smoothField(ww, wh, 3, (fu, fv) => fbm(fu*ww/unit*2.2 + 11.3, fv*wh/unit*2.2 + 2.9));
  const PB = smoothField(ww, wh, 3, (fu, fv) => fbm(fu*ww/unit*2.2 + 41.7, fv*wh/unit*2.2 + 19.1));
  // three layers by age: fresh smoke is crisp, older smoke has diffused
  const WL = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  let W = WL[0];
  const splat = (x, y, a) => { if(!(x >= 0 && y >= 0 && x < ww - 1 && y < wh - 1)) return; const x0 = x | 0, y0 = y | 0, tx = x - x0, ty = y - y0, k = y0*ww + x0;
    W[k] += a*(1 - tx)*(1 - ty); W[k + 1] += a*tx*(1 - ty); W[k + ww] += a*(1 - tx)*ty; W[k + ww + 1] += a*tx*ty; };
  const e = 1.5, gk = unit/(2*e)*0.55, ds = 1.2;
  // the curl of each potential, worked out ONCE on the grid, then read with one bilinear look per component
  const curlField = F => { const CX = new Float32Array(N), CY = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const k = y*ww + x;
      CX[k] = (whimSamp(F, ww, wh, x, y + e) - whimSamp(F, ww, wh, x, y - e))*gk; CY[k] = -(whimSamp(F, ww, wh, x + e, y) - whimSamp(F, ww, wh, x - e, y))*gk; }
    return [CX, CY]; };
  const [AX, AY] = curlField(PA), [BX, BY] = curlField(PB);
  const curl = (x, y, ph) => {
    x = x < 0 ? 0 : x > ww - 1.001 ? ww - 1.001 : x; y = y < 0 ? 0 : y > wh - 1.001 ? wh - 1.001 : y;
    const x0 = x | 0, y0 = y | 0, tx = x - x0, ty = y - y0, k = y0*ww + x0, a00 = (1 - tx)*(1 - ty), a10 = tx*(1 - ty), a01 = (1 - tx)*ty, a11 = tx*ty;
    const ax = AX[k]*a00 + AX[k + 1]*a10 + AX[k + ww]*a01 + AX[k + ww + 1]*a11, ay = AY[k]*a00 + AY[k + 1]*a10 + AY[k + ww]*a01 + AY[k + ww + 1]*a11;
    const bx = BX[k]*a00 + BX[k + 1]*a10 + BX[k + ww]*a01 + BX[k + ww + 1]*a11, by = BY[k]*a00 + BY[k + 1]*a10 + BY[k + ww]*a01 + BY[k + ww + 1]*a11;
    return [ax*(1 - ph) + bx*ph, ay*(1 - ph) + by*ph]; };
  const sources = 3 + Math.floor(Math.random()*4);
  for(let s = 0; s < sources; s++){
    const sx = ww*(0.08 + Math.random()*0.84), sy = wh*(0.6 + Math.random()*0.45), strength = 0.6 + Math.random()*0.6;
    const P = Math.round(150*strength);
    for(let p = 0; p < P; p++){
      let x = sx + gauss()*unit*0.0025, y = sy + gauss()*unit*0.002;
      const ph = Math.random(), life = unit*(0.45 + Math.random()*0.9)*lift, keep = unit*0.5*lift;
      for(let t = 0; t < life; t += ds){
        const up = 1 - y/wh, age = t/(unit*0.08), turb = Math.min(2.2, age*age);   // laminar at first, then breaking up
        const [cx, cy] = curl(x, y, ph);
        const vx = cx*turb + drag*0.5*(0.25 + up), vy = cy*turb - lift;
        // and it diffuses: each strand spreads as it goes (a random walk)
        const m = Math.hypot(vx, vy) || 1, dif = ds*0.33*Math.min(1, age); x += vx/m*ds + gauss()*dif; y += vy/m*ds + gauss()*dif;
        W = WL[t < unit*0.1 ? 0 : t < unit*0.3 ? 1 : 2];
        splat(x, y, 0.0675*strength*Math.exp(-t/keep)*Math.min(1, t/(unit*0.02)));
        if(y < -2 || x < -ww*0.2 || x > ww*1.2) break;
      }
    }
  }
  // 3 · SMOKE RINGS: a torus seen from a little below — denser on its near side, wobbling, frayed — with a wake
  const rings = Math.random() < 0.2 ? 0 : 1 + Math.floor(Math.random()*2.2);
  for(let r = 0; r < rings; r++){
    const cx = ww*(0.15 + Math.random()*0.7), cy = wh*(0.12 + Math.random()*0.55), R = unit*(0.05 + Math.random()*0.06);
    const sq = 0.3 + Math.random()*0.25, rot = (Math.random() - 0.5)*0.5, tube = R*(0.2 + Math.random()*0.1), ph = Math.random()*6.283;
    const cr = Math.cos(rot), sr = Math.sin(rot), n = Math.round(2*Math.PI*R*tube*5); W = WL[1];
    for(let k = 0; k < n; k++){
      const t = Math.random()*6.2832, wob = 1 + 0.07*Math.sin(3*t + ph) + 0.04*Math.sin(5*t + 2*ph);
      const rr = R*wob + gauss()*tube*0.5, X = Math.cos(t)*rr, Y = Math.sin(t)*rr*sq + gauss()*tube*0.35;
      let x = cx + X*cr - Y*sr, y = cy + X*sr + Y*cr;
      const [fx, fy] = curl(x, y, 0.5); x += fx*tube*0.12; y += fy*tube*0.12;
      splat(x, y, 0.03*(0.7 + 0.3*Math.sin(t)));
    }
    for(let j = 0; j < 18; j++){                                   // the wake
      const t = Math.PI*(0.15 + Math.random()*0.7), ph2 = Math.random();
      let x = cx + Math.cos(t)*R*cr - Math.sin(t)*R*sq*sr, y = cy + Math.cos(t)*R*sr + Math.sin(t)*R*sq*cr;
      for(let s = 0; s < R*1.8; s += ds){
        const [vx0, vy0] = curl(x, y, ph2), vx = vx0*0.8 + (cx - x)*0.004, vy = vy0*0.8 + lift*0.6, m = Math.hypot(vx, vy) || 1;
        x += vx/m*ds; y += vy/m*ds; splat(x, y, 0.0525*(1 - s/(R*1.8)));
      }
    }
  }
  // soften each layer: smoke never has a hard edge, and spreads as it ages
  const soft = [1, Math.max(1, Math.round(unit*0.003)), Math.max(2, Math.round(unit*0.007))];
  for(let l = 0; l < 3; l++){ whimBoxBlur(WL[l], ww, wh, soft[l]); if(l) whimBoxBlur(WL[l], ww, wh, soft[l]); }
  const D = new Float32Array(N);
  for(let i = 0; i < N; i++) D[i] = 1 - Math.exp(-1.7*(haze[i]*0.5 + WL[0][i] + WL[1][i] + WL[2][i]));
  return D;
}

/**
 * A LIGHT SHAFT from the dial's direction through a density field (smoke,
 * or anything): the density inside it glows, light reaching each point
 * through what lies between it and the light; the edge facing the light
 * rims. DUST is how strong the shaft is. Out: the lit picture (grey, or in
 * the material's Highlight and Shade hues), and the beam itself (0..1).
 */
export function lightShaft(D, ww, wh, dust, light, M3){
  const unit = Math.min(ww, wh), N = ww*wh, { vn } = whimNoise();
  // (dx, dy) points toward the light, as the dial's handle does
  const ang = ((light == null ? 315 : light) - 90)*Math.PI/180, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const off = (Math.random() - 0.5)*0.5, ox = ww/2 + nx*off*unit, oy = wh/2 + ny*off*unit, bw0 = unit*(0.13 + Math.random()*0.08);
  const streak = Math.random()*100;
  const beamAt = (x, y) => { const px = x - ox, py = y - oy, along = px*dx + py*dy, across = Math.abs(px*nx + py*ny);
    const bw = bw0*(1 - 0.25*along/unit), q = across/bw;                // wider as it travels from the light
    // the shaft has streaks along it, where the dust is thicker
    return 1/(1 + q*q*q*q*q*q)*(0.8 + 0.2*vn(across/unit*14 + streak, along/unit*0.7)); };
  const B = new Float32Array(N);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) B[y*ww + x] = beamAt(x, y);
  const st = unit*0.012, r = new Float32Array(N), g = new Float32Array(N), b = new Float32Array(N);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x, s0 = D[i], Bi = dust > 0 ? B[i] : 0;
    let val = 128, vr = 128, vg = 128, vb = 128;
    if(s0 > 0.002 || Bi > 0.01){
      // light reaching this point through the smoke between it and the light
      let tau = 0; for(let k = 1; k <= 8; k++) tau += whimSamp(D, ww, wh, x + dx*st*k, y + dy*st*k);
      const T = Math.exp(-0.35*tau);
      const toward = whimSamp(D, ww, wh, x + dx*1.5, y + dy*1.5), rim = whimClamp01((s0 - toward)*5)*0.25;   // the edge that faces the light
      const lit = s0*(0.5 + 0.5*T)*(1 + 2.4*dust*Bi) + rim*s0;
      // brightness rolls off softly instead of clipping where the shaft is full of smoke
      val = 128 + 127*(1 - Math.exp(-(118*lit + 48*dust*Bi)/127)) - 22*s0*(1 - T);
      if(M3){
        // MATERIAL: the light in the shaft takes the Highlight hue, smoke in its own shadow the Shade hue
        const own = 118*s0*(0.5 + 0.5*T) + rim*s0*118, all = 118*lit + 48*dust*Bi, fb = all > 0 ? Math.max(0, (all - own)/all) : 0;
        const rolled = 127*(1 - Math.exp(-all/127)), dark = 22*s0*(1 - T);
        const ch = c => 128 + rolled*((1 - fb) + fb*M3.hi[c]) - dark*Math.max(0, 1 + (1 - M3.sh[c])*0.7);
        vr = ch(0); vg = ch(1); vb = ch(2);
      } else vr = vg = vb = val;
    }
    r[i] = whimClamp01(vr/255); g[i] = whimClamp01(vg/255); b[i] = whimClamp01(vb/255);
  }
  return { img: { r, g, b }, B };
}

/**
 * DUST MOTES drawn on a canvas at its own size: drifting everywhere, seen only
 * where the beam catches them (beam(x, y) → 0..1, or none: a faint few
 * everywhere); a few float near the lens, large and out of focus. px: a size
 * in canonical pixels, as drawn; area: the canvas's canonical area.
 */
export function drawMotes(ctx, w, h, dust, beam, M3, px, area){
  if(dust <= 0.01) return;
  // motes catch the shaft's light: its Highlight hue, when there is one
  const MC = M3 ? (() => { const m = Math.max(...M3.hi); return M3.hi.map(v => Math.round(255*v/m)).join(','); })() : '255,255,255';
  const n = Math.round(area/(3072*3072)*3200*dust);
  for(let k = 0; k < n; k++){
    const x = Math.random()*w, y = Math.random()*h, b = Math.pow(beam ? beam(x, y) : 0.25, 1.5), near = Math.random() < 0.1, gl = Math.random();
    if(b < 0.03 && Math.random() > 0.15) continue;
    const a = (0.06 + 0.94*b)*(0.4 + 0.6*gl);
    if(near){
      const r = px(6 + Math.random()*14), g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${MC},${0.2*a})`); g.addColorStop(0.7, `rgba(${MC},${0.14*a})`); g.addColorStop(1, `rgba(${MC},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = `rgba(${MC},${0.85*a})`; ctx.beginPath(); ctx.arc(x, y, px(0.7 + Math.random()*1.6), 0, Math.PI*2); ctx.fill();
    }
  }
}

// ======================= PAINTED LANDSCAPE =======================
export const LAND_BIOMES = {
  // decay: how much each finer octave keeps — low is smooth, high is busy. sharp: crests that come to a point
  desert:   { bands:[3,5],  decay:0.18, sharp:false, amp:0.05, bump:0,   dab:'long',  horizon:0.55, pal:[[196,150,92],[214,176,118],[170,112,70],[226,196,150]] },
  grass:    { bands:[4,6],  decay:0.3,  sharp:false, amp:0.07, bump:0,   dab:'grass', horizon:0.5,  pal:[[96,134,64],[150,160,70],[70,110,72],[176,170,96]] },
  jungle:   { bands:[6,9],  decay:0.42, sharp:false, amp:0.06, bump:0.9, dab:'leaf',  horizon:0.42, pal:[[34,96,64],[60,128,70],[26,78,70],[104,140,60]] },
  plains:   { bands:[2,4],  decay:0.12, sharp:false, amp:0.018,bump:0,   dab:'long',  horizon:0.62, pal:[[196,176,104],[170,160,90],[210,190,130],[140,150,84]] },
  mountain: { bands:[6,9],  decay:0.36, sharp:true,  amp:0.15, bump:0,   dab:'rock',  horizon:0.38, wave:1.1, snow:true, pal:[[110,112,128],[130,120,118],[92,98,116],[150,140,130]] },
  mesa:     { bands:[3,5],  decay:0.2,  sharp:false, amp:0.09, bump:0,   dab:'long',  horizon:0.5,  wave:0.9, mesa:true, pal:[[176,90,58],[200,120,70],[150,70,52],[214,160,110]] },
  forest:   { bands:[4,6],  decay:0.28, sharp:false, amp:0.06, bump:0,   dab:'dot',   horizon:0.48, trees:true, pal:[[46,90,56],[70,108,60],[36,72,62],[96,120,64]] },
  tundra:   { bands:[2,4],  decay:0.15, sharp:false, amp:0.025,bump:0,   dab:'snow',  horizon:0.58, pale:true, pal:[[200,206,214],[176,186,196],[220,222,226],[160,170,170]] },
  lake:     { bands:[3,5],  decay:0.34, sharp:true,  amp:0.12, bump:0,   dab:'rock',  horizon:0.36, wave:1.1, lake:true, snow:true, pal:[[96,110,124],[120,124,120],[80,96,110],[70,100,80]] },
  coast:    { bands:[2,4],  decay:0.3,  sharp:false, amp:0.08, bump:0,   dab:'grass', horizon:0.46, sea:true, pal:[[120,140,80],[180,170,120],[96,120,80],[200,186,140]] },
  // fields: rolling hills sewn into a patchwork of strips that follow the ground
  fields:   { bands:[4,6],  decay:0.22, sharp:false, amp:0.06, bump:0,   dab:'field', horizon:0.46, pal:[[150,170,70],[200,180,90],[110,140,60],[180,140,80],[130,160,90]] },
  // a volcano: one great cone on the skyline, its plume leaning on the wind
  volcano:  { bands:[3,5],  decay:0.24, sharp:false, amp:0.06, bump:0,   dab:'rock',  horizon:0.5,  cone:true, pal:[[80,70,72],[110,92,84],[60,58,64],[130,110,90]] },
  // a river: green hills opening into a valley, the river winding down it toward you, widening as it comes
  river:    { bands:[4,6],  decay:0.26, sharp:false, amp:0.075,bump:0,   dab:'grass', horizon:0.47, river:true, pal:[[96,134,64],[140,156,72],[74,112,70],[170,164,96]] },
};
// the time of day: the sky, the light's warmth, the shadows' coolness
export const LAND_TIMES = {
  dawn:   { skyTop:[120,140,190], skyLow:[240,190,170], light:[255,214,180], shadow:[110,110,170], sun:[255,236,210], k:0.95 },
  day:    { skyTop:[90,140,210],  skyLow:[200,220,236], light:[255,248,226], shadow:[96,120,170],  sun:[255,252,236], k:1.05 },
  golden: { skyTop:[110,130,180], skyLow:[250,200,120], light:[255,200,120], shadow:[90,80,150],   sun:[255,224,160], k:1.0 },
  dusk:   { skyTop:[50,50,110],   skyLow:[220,120,110], light:[240,150,120], shadow:[70,60,120],   sun:[255,170,120], k:0.82 },
  night:  { skyTop:[14,22,48],    skyLow:[50,66,104],   light:[180,200,240], shadow:[30,40,80],    sun:[230,236,250], k:0.62, moon:true },
};
/**
 * THE SCENE the seed chooses, the same for every part that asks: the country,
 * the time of day, where the horizon lies (lower as the camera tilts down),
 * where the sun is. o.country / o.time fix them ('seed': the seed's choice).
 */
export function landScene(seed, o = {}){
  const R = seedChoice(seed, 'landscape'), kinds = Object.keys(LAND_BIOMES), tkeys = Object.keys(LAND_TIMES);
  // (the first ten keep their old odds; the two newer countries are rarer)
  let kind = R() < 0.84 ? kinds[Math.floor(R()*10)] : kinds[10 + Math.floor(R()*2)];
  // (the river country is grassland's own, drawn by its own stream so no other seed's country changes: two in five)
  if(kind === 'grass' && seedChoice(seed, 'river')() < 0.4) kind = 'river';
  const hz = R(); let time = tkeys[Math.floor(R()*tkeys.length)]; const sx = R(), sy = R(), sr = R();
  if(o.country && LAND_BIOMES[o.country]) kind = o.country;
  if(o.time && LAND_TIMES[o.time]) time = o.time;
  const B = LAND_BIOMES[kind], pitch = Math.max(0, Math.min(1, o.tilt || 0));
  return { kind, B, time, TM: LAND_TIMES[time], pitch,
    horizon: h => Math.max(h*0.08, h*(B.horizon + (hz - 0.5)*0.08) - pitch*h*0.3),
    // (THE SUN FOLLOWS THE DIAL, Ruby: laid on the page as the sun's guide lays it, kept just above the horizon when the
    //  dial would set it lower; without a dial, the seed's)
    sun: (w, horizon, h) => { if(o.light == null || !h) return { x: w*(0.12 + sx*0.76), y: horizon*(0.25 + sy*0.5), k: 0.8 + sr*0.4 };
      const u = Math.min(w, h), p = pageSunAt(o.light, o.lightTilt ?? 100, w/u, h/u); return { x: p.x*u, y: Math.min(p.y*u, horizon*0.92), k: 0.8 + sr*0.4 }; } };
}
/** The palette of a painting at COLOUR ck (0: the grey painting exactly): paint(tone 0–255, colour) → a CSS colour. */
export function landPalette(ck, TM){
  const lum = c => 0.299*c[0] + 0.587*c[1] + 0.114*c[2];
  const mixC = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
  // a colour at the value `tone`: the hue kept, the lightness set — past white it pales toward white, as paint does
  const atValue = (col, tone) => { const L = Math.max(1, lum(col)), f = tone/L; let r = [col[0]*f, col[1]*f, col[2]*f];
    const over = Math.max(r[0], r[1], r[2]) - 255; if(over > 0){ const t = Math.min(1, over/255); r = mixC(r.map(v => Math.min(255, v)), [255, 255, 255], t); } return r; };
  const css = col => `rgb(${Math.max(0, Math.min(255, col[0] | 0))},${Math.max(0, Math.min(255, col[1] | 0))},${Math.max(0, Math.min(255, col[2] | 0))})`;
  const paint = (tone, col) => { if(ck <= 0 || !col) return `rgb(${tone | 0},${tone | 0},${tone | 0})`;
    const v = Math.max(0, Math.min(255, tone*(1 + (TM.k - 1)*ck))); return css(mixC([tone, tone, tone], atValue(col, v), ck)); };
  const rgba = (tone, col, a) => paint(tone, col).replace('rgb', 'rgba').replace(')', `,${a})`);
  const jitHue = (col, amt) => [col[0]*(1 + (Math.random() - 0.5)*amt), col[1]*(1 + (Math.random() - 0.5)*amt), col[2]*(1 + (Math.random() - 0.5)*amt)];
  return { paint, rgba, mixC, jitHue };
}

// ======== THE PAINTER'S STROKES (after Bob Ross: a fan brush, a knife, a little mist) ========
/**
 * A HAPPY LITTLE TREE, painted with a fan brush: the trunk a single line,
 * then the branches tapped in row by row from the top, each row wider and
 * drooping, in the dark color; then the light, touched onto the side facing
 * the sun in a lighter one. (x, y) is its foot; th its height.
 */
export function paintEvergreen(ctx, x, y, th, dark, light, sunSide, paint, tone, unit){
  // fine strokes at any size: a big tree is MORE strokes, not fatter ones
  const u = unit || th*8, rows = Math.max(6, Math.min(70, Math.round(th/(u*0.0075)))), lw = Math.max(cpx(0.6), Math.min(th*0.03, u*0.0045));
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.9; ctx.strokeStyle = paint(Math.max(0, tone - 30), dark); ctx.lineWidth = Math.max(cpx(0.6), th*0.025);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5)*th*0.02, y - th); ctx.stroke();
  ctx.strokeStyle = paint(tone, dark); ctx.lineWidth = lw;
  for(let r = 0; r < rows; r++){
    const t = (r + 0.5)/rows, yy = y - th*(1 - t)*0.97, wdt = th*(0.03 + 0.3*Math.pow(t, 0.95))*(0.85 + Math.random()*0.3), n = 2 + Math.floor(t*(4 + th/(u*0.06)));
    for(const side of [-1, 1]) for(let k = 0; k < n; k++){
      const reach = wdt*(0.35 + Math.random()*0.7), droop = Math.min(th*(0.025 + 0.05*t), u*0.03)*(0.6 + Math.random()*0.8);
      ctx.globalAlpha = 0.75 + Math.random()*0.2;
      ctx.beginPath(); ctx.moveTo(x + side*wdt*0.05, yy - th*0.02 + (Math.random() - 0.5)*th*0.02);
      ctx.quadraticCurveTo(x + side*reach*0.5, yy - th*0.01, x + side*reach, yy + droop); ctx.stroke(); }
  }
  // the light, on the sun's side only, a few short touches
  ctx.strokeStyle = paint(Math.min(255, tone + 45), light); ctx.lineWidth = lw*0.8;
  for(let r = 1; r < rows; r++){ if(Math.random() < 0.35) continue;
    const t = (r + 0.5)/rows, yy = y - th*(1 - t)*0.97, wdt = th*(0.03 + 0.3*Math.pow(t, 0.95));
    ctx.globalAlpha = 0.45 + Math.random()*0.3;
    ctx.beginPath(); ctx.moveTo(x + sunSide*wdt*0.25, yy - th*0.015); ctx.lineTo(x + sunSide*wdt*(0.6 + Math.random()*0.35), yy + Math.min(th*0.03*t, u*0.015)); ctx.stroke(); }
}
/** A BUSH (or a broadleaf crown), tapped in with the corner of a brush: dark dabs heaped, then lighter ones where the sun reaches. */
export function paintBush(ctx, x, y, r, dark, light, sunSide, paint, tone){
  for(let pass = 0; pass < 2; pass++){
    const n = pass ? 12 : 26;
    for(let k = 0; k < n; k++){
      const a = Math.random()*Math.PI, rr = Math.sqrt(Math.random())*r, px = x + Math.cos(a)*rr*(pass ? 0.8 : 1) + (pass ? sunSide*r*0.25 : 0),
        py = y - Math.sin(a)*rr*0.85 - (pass ? r*0.25 : 0), dr = r*(0.12 + Math.random()*0.12);
      ctx.globalAlpha = pass ? 0.45 + Math.random()*0.3 : 0.75;
      ctx.fillStyle = pass ? paint(Math.min(255, tone + 55), light) : paint(Math.min(255, tone + 10), dark);
      ctx.beginPath(); ctx.ellipse(px, py, dr*1.3, dr*0.8, (Math.random() - 0.5)*0.8, 0, Math.PI*2); ctx.fill(); }
  }
}
/**
 * THE KNIFE on a mountain: from each peak, slivers of light pulled down the
 * slope that faces the sun, crisp and broken — and darker, cooler slivers on
 * the side turned away. prof is the ridge line [[x, y]…]; amp its height.
 */
export function paintKnife(ctx, prof, amp, unit, sunSide, light, shade, paint, tone, snowy){
  const peaks = [];
  for(let j = 2; j < prof.length - 2; j++){ const y = prof[j][1]; if(y <= prof[j - 1][1] && y <= prof[j + 1][1] && y <= prof[j - 2][1] && y <= prof[j + 2][1]) peaks.push(j); }
  const sliver = (x0, y0, dir, len, wd, col, a) => {
    const x1 = x0 + dir*len*(0.55 + Math.random()*0.4), y1 = y0 + len, wob = (Math.random() - 0.5)*wd;
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1)/2 + wob + dir*wd, (y0 + y1)/2, x1, y1); ctx.lineTo(x1 - dir*wd*0.3, y1 - len*0.02);
    ctx.quadraticCurveTo((x0 + x1)/2 + wob - dir*wd*0.2, (y0 + y1)/2, x0 - dir*wd*0.4, y0 + len*0.02); ctx.closePath(); ctx.fill(); };
  // the faces: each slope streaked with the knife, light where it faces the sun, shade where it turns away
  for(let j = 1; j < prof.length - 1; j += 2){
    const dy = prof[j + 1][1] - prof[j - 1][1], dx = prof[j + 1][0] - prof[j - 1][0], facing = dy*sunSide/(Math.hypot(dx, dy) || 1);
    if(Math.abs(facing) < 0.1 || Math.random() < 0.2) continue;
    const [x0, y0] = prof[j], len = amp*(0.25 + Math.random()*0.6)*Math.min(1, Math.abs(facing)*2.4), lit = facing > 0;
    ctx.globalAlpha = (lit ? 0.38 : 0.28)*(0.6 + Math.random()*0.6); ctx.strokeStyle = lit ? paint(Math.min(255, tone + (snowy ? 85 : 50)), light) : paint(Math.max(0, tone - 35), shade);
    ctx.lineWidth = unit*(0.004 + Math.random()*0.007); ctx.lineCap = 'butt';
    const dir = lit ? sunSide : -sunSide;
    ctx.beginPath(); ctx.moveTo(x0, y0 + unit*0.002); ctx.lineTo(x0 + dir*len*0.55, y0 + len); ctx.stroke();
  }
  for(const j of peaks){
    const [px, py] = prof[j], strokes = 3 + Math.floor(Math.random()*5);
    for(let k = 0; k < strokes; k++){
      // down the lit side, from points along the ridge near the peak
      const off = Math.floor(Math.random()*6)*sunSide, q = prof[Math.max(0, Math.min(prof.length - 1, j + off))];
      const len = amp*(0.25 + Math.random()*0.55), wd = unit*(0.004 + Math.random()*0.01);
      sliver(q[0], q[1] + unit*0.002, sunSide, len, wd, paint(Math.min(255, tone + (snowy ? 75 : 45)), light), 0.55 + Math.random()*0.35);
    }
    for(let k = 0; k < Math.ceil(strokes*0.6); k++){
      const off = -Math.floor(Math.random()*6)*sunSide, q = prof[Math.max(0, Math.min(prof.length - 1, j + off))];
      sliver(q[0], q[1] + unit*0.003, -sunSide, amp*(0.2 + Math.random()*0.45), unit*(0.004 + Math.random()*0.008), paint(Math.max(0, tone - 25), shade), 0.35 + Math.random()*0.25);
    }
    void px; void py;
  }
}
/** MIST at the foot of a range: the sky's haze, laid on thick at the bottom and blended up to nothing. */
export function paintMist(ctx, w, top, bottom, haze, paint, k){
  if(!(bottom > top)) return;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, paint(200, haze).replace('rgb', 'rgba').replace(')', ',0)'));
  g.addColorStop(0.5, paint(200, haze).replace('rgb', 'rgba').replace(')', `,${0.5*k})`));
  g.addColorStop(0.75, paint(200, haze).replace('rgb', 'rgba').replace(')', `,${0.6*k})`));
  g.addColorStop(1, paint(200, haze).replace('rgb', 'rgba').replace(')', ',0)'));
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(-10, top, w + 20, bottom - top);
}

/** THE SKY, painted: its wash, the sun (or the moon) and its glow, and painted clouds of the kind asked (or the seed's). */
export function paintSky(ctx, w, h, S, o){
  const ck = o.colour || 0, zoom = o.size || 1, unit = Math.min(w, h), TM = S.TM, horizon = S.horizon(h), sun = S.sun(w, horizon, h);
  const { paint, rgba, mixC } = landPalette(ck, TM), pick = a => a[Math.floor(Math.random()*a.length)];
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, paint(150, TM.skyTop)); sky.addColorStop(1, paint(132, TM.skyLow));
  ctx.globalAlpha = 1; ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // the sky worked in with big criss-cross strokes, as a two-inch brush lays it: darker above, paler toward the horizon
  ctx.lineCap = 'round';
  for(let k = 0, n = Math.round(w/(unit*0.025)); k < n; k++){
    const x = Math.random()*w, y = Math.random()*horizon*1.05, len = unit*(0.08 + Math.random()*0.12), a = (Math.random() < 0.5 ? 1 : -1)*(0.6 + Math.random()*0.35);
    const f = Math.max(0, Math.min(1, y/horizon));
    ctx.globalAlpha = 0.07; ctx.strokeStyle = paint(150 - f*18 + (Math.random() - 0.5)*16, mixC(TM.skyTop, TM.skyLow, f)); ctx.lineWidth = unit*(0.012 + Math.random()*0.014);
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a)*len/2, y - Math.sin(a)*len/2); ctx.lineTo(x + Math.cos(a)*len/2, y + Math.sin(a)*len/2); ctx.stroke(); }
  // the sun (or the moon) and its glow, laid in before the clouds so they pass over it
  { const R = unit*(TM.moon ? 0.035 : 0.05)*sun.k, gl = ctx.createRadialGradient(sun.x, sun.y, R*0.5, sun.x, sun.y, R*6);
    gl.addColorStop(0, rgba(190, TM.sun, 0.45)); gl.addColorStop(1, rgba(150, TM.skyLow, 0));
    ctx.fillStyle = gl; ctx.fillRect(sun.x - R*6, sun.y - R*6, R*12, R*12);
    ctx.globalAlpha = 0.85; ctx.fillStyle = paint(212, TM.sun); ctx.beginPath(); ctx.arc(sun.x, sun.y, R, 0, Math.PI*2); ctx.fill(); }
  // ---- PAINTED CLOUDS: heaped cumulus, long stratus or thin cirrus ----
  const ckind = o.clouds && o.clouds !== 'seed' ? o.clouds : pick(['cumulus', 'cumulus', 'stratus', 'cirrus', 'mixed']);
  const cloudLit = TM.light, cloudShade = mixC(TM.shadow, TM.skyTop, 0.4);
  const cumulus = (cx, cy, cw) => {
    const n = Math.round(26 + Math.random()*30), baseY = cy + cw*0.12;
    for(let k = 0; k < n; k++){
      // dabs heaped in a dome: bigger in the middle, the top built up, the base flat
      const u = (Math.random()*2 - 1), rr = cw*(0.12 + Math.random()*0.16)*(1 - Math.abs(u)*0.45);
      const x = cx + u*cw*0.55, top = Math.sqrt(Math.max(0, 1 - u*u)), y = baseY - rr*0.4 - Math.random()*cw*0.32*top;
      const up = Math.max(0, Math.min(1, (baseY - y)/(cw*0.4)));        // 0 at the base, 1 at the crown
      const tone = 158 + up*50 + (Math.random() - 0.5)*10;
      ctx.globalAlpha = 0.35 + Math.random()*0.25; ctx.fillStyle = paint(tone, mixC(cloudShade, cloudLit, up));
      ctx.beginPath(); ctx.ellipse(x, Math.min(y, baseY - rr*0.35), rr, rr*0.82, 0, 0, Math.PI*2); ctx.fill();
    }
    // the flat, shadowed base: a few long strokes along it
    ctx.globalAlpha = 0.3; ctx.fillStyle = paint(150, cloudShade);
    for(let k = 0; k < 4; k++){ ctx.beginPath(); ctx.ellipse(cx + (Math.random() - 0.5)*cw*0.3, baseY - cw*0.02*k, cw*(0.45 - k*0.06), cw*0.035, 0, 0, Math.PI*2); ctx.fill(); }
  };
  const stratus = cy => { const n = Math.round(10 + Math.random()*10);
    for(let k = 0; k < n; k++){ const x = Math.random()*w, len = w*(0.15 + Math.random()*0.35), th = unit*(0.006 + Math.random()*0.014), y = cy + (Math.random() - 0.5)*unit*0.05;
      const lit = Math.random(); ctx.globalAlpha = 0.16 + Math.random()*0.16; ctx.fillStyle = paint(170 + lit*30, mixC(cloudShade, cloudLit, lit));
      ctx.beginPath(); ctx.ellipse(x, y, len/2, th, (Math.random() - 0.5)*0.03, 0, Math.PI*2); ctx.fill(); } };
  const cirrus = () => { const n = Math.round(8 + Math.random()*10); ctx.lineCap = 'round';
    for(let k = 0; k < n; k++){ const x = Math.random()*w, y = horizon*(0.08 + Math.random()*0.5), len = unit*(0.08 + Math.random()*0.2), bend = (Math.random() - 0.5)*len*0.5, ang = (Math.random() - 0.5)*0.4;
      for(let p = 0; p < 3; p++){ ctx.globalAlpha = 0.12 + Math.random()*0.1; ctx.strokeStyle = paint(196, cloudLit); ctx.lineWidth = unit*(0.002 + Math.random()*0.004);
        const ox = x + p*unit*0.004, oy = y + p*unit*0.006; ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(ox + Math.cos(ang)*len/2, oy + Math.sin(ang)*len/2 + bend*0.3, ox + Math.cos(ang)*len, oy + Math.sin(ang)*len + bend); ctx.stroke(); } } };
  if(ckind === 'cumulus' || ckind === 'mixed'){ const n = 1 + Math.floor(Math.random()*4); for(let k = 0; k < n; k++) cumulus(Math.random()*w, horizon*(0.2 + Math.random()*0.55), unit*(0.12 + Math.random()*0.16)*zoom); }
  if(ckind === 'stratus' || ckind === 'mixed') for(let k = 0; k < 2; k++) stratus(horizon*(0.2 + Math.random()*0.65));
  if(ckind === 'cirrus') cirrus();
  ctx.globalAlpha = 1;
}

/**
 * THE RIDGES, painted over whatever is on the canvas (a sky): the country's
 * bands, far to near — each laid in, its crest brushed, worked over with
 * strokes along the slope in BROKEN COLOUR (warmer facing the sun, cooler
 * turned away), far ones leaning to the sky's colour; snow on far peaks,
 * trees, water (a sea, a lake with its reflection, the sun's path), a
 * volcano and its plume. o: { amt (bands), zoom (distance), colour }.
 */
export function paintRidges(ctx, w, h, S, o){
  const amt = o.amt ?? 1, zoom = o.zoom ?? 1, CK = o.colour || 0, unit = Math.min(w, h), B = S.B, TM = S.TM, pitch = S.pitch;
  const horizon = S.horizon(h), sun = S.sun(w, horizon, h), sunX = sun.x, sunY = sun.y, sunSide = sunX < w/2 ? -1 : 1;
  const { paint, mixC, jitHue } = landPalette(CK, TM), pick = a => a[Math.floor(Math.random()*a.length)];
  const bands = Math.max(2, Math.round((B.bands[0] + Math.random()*(B.bands[1] - B.bands[0]))*amt));
  const ridge = (x, seed, amp, decay, bump) => {
    // mountains are broad masses: a long base wavelength, so peaks are wide for their height
    let y = 0, a = amp, f = 1/(unit*(B.wave || 0.4)*zoom);
    for(let oc = 0; oc < 5; oc++){
      // (a mountain's base octave is a TRIANGLE wave: peaks come to a point, as a knife paints them)
      const tri = th => (2/Math.PI)*Math.asin(Math.sin(th));
      const n = (B.sharp && oc === 0) ? tri(x*f*6.283 + seed)*0.75 + tri(x*f*2.1*6.283 + seed*1.7)*0.25
        : Math.sin(x*f*6.283 + seed*(oc + 1))*0.6 + Math.sin(x*f*2.1*6.283 + seed*1.7*(oc + 1))*0.4;
      // a mesa's base octave is squashed flat at top and bottom: plateaus with walls
      const m = (B.mesa && oc === 0) ? Math.max(-1, Math.min(1, n*3)) : n;
      y += (B.sharp && oc > 0 ? Math.abs(m)*2 - 1 : m)*a;
      a *= decay; f *= 2.1;
    }
    if(bump) y -= Math.abs(Math.sin(x/(unit*0.018*zoom) + seed))*amp*0.35*bump;   // canopy lumps
    return y;
  };
  // the volcano's cone stands in the middle distance
  const cone = B.cone ? { x: w*(0.25 + Math.random()*0.5), hgt: unit*(0.22 + Math.random()*0.12)*zoom, half: unit*(0.32 + Math.random()*0.15)*zoom, band: Math.floor((bands - 1)*0.35) } : null;
  const coastAt = B.sea ? { x: w*(0.3 + Math.random()*0.35), side: Math.random() < 0.5 ? 1 : -1 } : null;
  const waterCol = mixC(TM.skyLow, [40, 90, 130], 0.55);
  // THE WATER'S MOOD, by the seed, where there is water: still (a mirror, its reflections whole, a few strokes), ruffled
  // (as it was), or choppy (short strokes crowding, white on their crests, the reflections broken)
  const mood = B.sea || B.lake || B.river ? ['still', 'ruffled', 'choppy'][Math.floor(Math.random()*3)] : 'ruffled', calm = mood === 'still' ? 1 : 0, chop = mood === 'choppy' ? 1 : 0;
  // THE RIVER: its middle wandering across the valley, swinging wider as it nears; narrow on the horizon, broad at your feet
  const riv = B.river ? { x0: w*(0.3 + Math.random()*0.4), ph: Math.random()*6.28, k: 2 + Math.random()*2.5, swing: unit*(0.1 + Math.random()*0.14) } : null;
  const rivX = t => riv.x0 + Math.sin(t*riv.k + riv.ph)*riv.swing*(0.2 + t), rivW = t => unit*(0.003 + 0.085*t*t)*zoom;
  // water: flat, lighter than the land, laid with short level strokes; it holds the reflection of the band behind it
  const water = (top, prof, tone, col) => {
    ctx.globalAlpha = 0.95; ctx.fillStyle = paint(150, waterCol); ctx.fillRect(0, top, w, h - top);
    if(prof){
      ctx.globalAlpha = 0.32 + 0.22*calm - 0.12*chop; ctx.fillStyle = paint(tone, col);
      ctx.beginPath(); ctx.moveTo(-20, top); prof.forEach(([x, y]) => ctx.lineTo(x, top + (top - Math.min(top, y))*0.9)); ctx.lineTo(w + 20, top); ctx.closePath(); ctx.fill();
    }
    // the sun's path on the water
    if(CK > 0 && sunY < top){ ctx.globalAlpha = 0.25*CK; ctx.fillStyle = paint(200, TM.sun); for(let k = 0; k < 26; k++){ const y = top + Math.pow(Math.random(), 1.3)*(h - top);
      ctx.fillRect(sunX + (Math.random() - 0.5)*unit*0.06*(1 + (y - top)/(h - top)*2), y, unit*(0.01 + Math.random()*0.03), unit*0.0025); } }
    // the knife's cuts: long thin lines of light across the water, where it meets the shore and beyond
    for(let k = 0; k < 7; k++){ const y = top + Math.pow(Math.random(), 1.4)*(h - top)*0.6, x = Math.random()*w*0.8, len = w*(0.1 + Math.random()*0.3);
      ctx.globalAlpha = 0.25 + Math.random()*0.2; ctx.fillStyle = paint(215, mixC([240, 244, 250], TM.light, 0.4)); ctx.fillRect(x, y, len, Math.max(0.6, unit*0.0018)); }
    const n = Math.round(w/(unit*0.012)*(1 - 0.6*calm + 1.2*chop));
    for(let k = 0; k < n; k++){
      const y = top + Math.pow(Math.random(), 1.6)*(h - top), x = Math.random()*w, len = unit*(0.02 + Math.random()*0.05)*(0.5 + (y - top)/(h - top))*(1 + 0.8*calm - 0.45*chop);
      const tn = 150 + (Math.random() - 0.5)*60;
      ctx.globalAlpha = 0.35; ctx.strokeStyle = paint(tn, jitHue(waterCol, 0.25)); ctx.lineWidth = unit*0.002*(1 + (y - top)/(h - top)*2);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      // (choppy: a white crest on the wave's lit edge)
      if(chop && Math.random() < 0.45){ ctx.globalAlpha = 0.4; ctx.strokeStyle = paint(225, mixC([244, 246, 250], TM.light, 0.35)); ctx.lineWidth = unit*0.0012*(1 + (y - top)/(h - top)*2);
        ctx.beginPath(); ctx.moveTo(x + len*0.2, y - unit*0.0015); ctx.lineTo(x + len*0.7, y - unit*0.0015); ctx.stroke(); }
    }
  };
  if(B.sea) water(horizon, null, 0);
  let lakeTop = null;
  for(let i = 0; i < bands; i++){
    const t = bands === 1 ? 1 : i/(bands - 1);                    // 0 far .. 1 near
    let base = horizon + (h - horizon)*Math.pow(t, 1.35 + pitch*0.9)*0.92;
    let amp = unit*B.amp*(0.35 + t*0.9)*(1 - 0.4*pitch)*((B.sharp && t < 0.4) ? 1.7 : 1);     // the far range stands tall
    if(lakeTop != null){ const lk = Math.floor((bands - 1)/2), u = (i - lk)/Math.max(1, bands - 1 - lk); base = lakeTop + (h - lakeTop)*(0.5 + 0.45*u); amp *= 0.45; }
    const tone = B.pale ? Math.round(205 - t*95) : Math.round(178 - t*140);   // pale far, dark near
    // this band's color: the biome's, leaning toward the sky's with distance (air between)
    const own = B.pal[i % B.pal.length], bandCol = mixC(own, TM.skyLow, (1 - t)*0.6);
    const seed = Math.random()*100;
    const prof = [];
    // a headland: the land breaks off in a cliff that leans out of true and steps down in ledges (not a cut wall)
    const cliff = B.sea ? { x: coastAt.x + coastAt.side*(unit*0.1*t + (Math.random() - 0.5)*unit*0.07), side: coastAt.side, fall: unit*(0.06 + Math.random()*0.1)*(0.6 + t*0.6), ph: Math.random()*6.28 } : null;
    // by the sea a band is land standing in water: it ends at its own waterline (far ones a strip on the horizon), not the bottom
    const wl = B.sea ? Math.min(h + 40, base + unit*(0.012 + t*t*0.14)) : h + 40;
    for(let x = -20; x <= w + 20; x += Math.max(2, w/400)){
      let y = base + ridge(x, seed, amp, B.decay, B.bump);
      if(B.sea) y = Math.min(y, wl - 0.5);
      if(cliff){ const d = (x - cliff.x)*cliff.side, k = Math.max(0, Math.min(1, d/cliff.fall)), e = k*k*(3 - 2*k);
        const ledge = k > 0 && k < 1 ? (Math.sin(k*9 + cliff.ph)*0.5 + Math.sin(k*23 + cliff.ph*2)*0.25)*unit*0.012*(1 - k) : 0;
        y += e*(wl - y) + ledge*(B.sea ? 0.5 : 1); }
      if(riv){ const d = (x - rivX(t))/(rivW(t)*3 + unit*0.06); y += amp*0.9*Math.exp(-d*d); }   // (the hills open where the river runs)
      if(cone && i === cone.band){ const d = Math.abs(x - cone.x)/cone.half; if(d < 1){ const peak = base - cone.hgt*(1 - Math.pow(d, 0.85)); y = Math.min(y, d < 0.08 ? base - cone.hgt*0.93 : peak); } }
      prof.push([x, y]); }
    // lay the band in
    ctx.globalAlpha = 0.92; ctx.fillStyle = paint(tone, bandCol);
    ctx.beginPath(); ctx.moveTo(-20, Math.min(h, wl)); prof.forEach(([x, y]) => ctx.lineTo(x, Math.min(y, wl))); ctx.lineTo(w + 20, Math.min(h, wl)); ctx.closePath(); ctx.fill();
    if(B.sea && wl < h){
      // its reflection in the water below its waterline, darker and broken by the swell
      ctx.globalAlpha = 0.28; ctx.fillStyle = paint(Math.max(0, tone - 25), mixC(bandCol, waterCol, 0.4));
      ctx.beginPath(); ctx.moveTo(-20, wl); prof.forEach(([x, y]) => ctx.lineTo(x, wl + (wl - Math.min(y, wl))*0.55)); ctx.lineTo(w + 20, wl); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.35; ctx.fillStyle = paint(215, mixC([240, 244, 250], TM.light, 0.4));
      for(let k = 0; k < 8; k++){ const x = Math.random()*w, j = prof.findIndex(([px]) => px >= x); if(j >= 0 && prof[j][1] < wl - 1) ctx.fillRect(x, wl, unit*(0.01 + Math.random()*0.04), Math.max(0.6, unit*0.0018)); } }
    // a brushed edge, not a cut one: the crest painted over a few times, loosely
    for(let pass = 0; pass < 3; pass++){
      const jit = unit*0.004*(pass + 1);
      ctx.globalAlpha = 0.22; ctx.strokeStyle = paint(tone, bandCol); ctx.lineWidth = unit*0.006*(1 + pass);
      ctx.beginPath();
      const ph1 = Math.random()*6.28, ph2 = Math.random()*6.28;
      prof.forEach(([x, y], j) => {
        const yy = y + (Math.sin(x/(unit*0.05) + ph1)*0.6 + Math.sin(x/(unit*0.017) + ph2)*0.4)*jit;
        j ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); });
      ctx.stroke();
    }
    // THE KNIFE: on mountains (and the volcano's cone) light pulled down the sunny slopes, shade on the others
    if((B.sharp || B.cone || B.mesa) && t < 0.85) paintKnife(ctx, prof, amp, unit, sunSide, mixC([240, 244, 250], TM.light, 0.4), mixC(TM.shadow, bandCol, 0.4), paint, tone, !!B.snow && t < 0.6);
    // THE CLIFF FACE: rock knifed down it (lit if it faces the sun), the sea's foam at its foot
    if(cliff){ const rock = mixC(mixC(bandCol, [150, 140, 128], 0.55), TM.skyLow, (1 - t)*0.4), lit = cliff.side*sunSide < 0;
      for(let k = 0; k < Math.round(60*(0.4 + t)); k++){ const x = cliff.x + cliff.side*Math.random()*cliff.fall*0.95, j = prof.findIndex(([px]) => px >= x); if(j < 0) continue;
        const y0 = prof[j][1], len = Math.min(unit*(0.02 + Math.random()*0.06)*(0.5 + t), wl - y0 - unit*0.004); if(len <= 0) continue;
        ctx.globalAlpha = 0.28 + Math.random()*0.2; ctx.strokeStyle = paint(Math.max(0, Math.min(255, tone + (lit ? 40 : -25) + (Math.random() - 0.5)*30)), lit ? mixC(rock, TM.light, 0.35) : mixC(rock, TM.shadow, 0.35));
        ctx.lineWidth = unit*(0.003 + Math.random()*0.006)*(0.6 + t); ctx.beginPath(); ctx.moveTo(x, y0 + unit*0.003); ctx.lineTo(x + cliff.side*len*0.25, y0 + len); ctx.stroke(); }
      for(let k = 0; k < Math.round(40*(0.4 + t)); k++){ const j = Math.floor(Math.random()*prof.length), [x, y] = prof[j];
        if((x - cliff.x)*cliff.side < cliff.fall*0.35 || y < horizon || y > h) continue;
        ctx.globalAlpha = 0.25 + Math.random()*0.3; ctx.fillStyle = paint(235, mixC([244, 246, 250], TM.light, 0.3));
        ctx.beginPath(); ctx.ellipse(x + cliff.side*unit*0.006, y + (Math.random() - 0.5)*unit*0.01, unit*(0.004 + Math.random()*0.012)*(0.5 + t), unit*0.003, 0, 0, Math.PI*2); ctx.fill(); } }
    // snow on the high crests (the far mountains), painted where the light can find it
    if(B.snow && t < 0.7){ ctx.globalAlpha = 0.5*(1 - t); ctx.fillStyle = paint(Math.min(240, tone + 60), mixC([240, 244, 250], TM.light, 0.3));
      let top = Infinity; for(const [, y] of prof) top = Math.min(top, y); const line = top + amp*0.5;
      ctx.beginPath(); let on = false; prof.forEach(([x, y]) => { if(y < line){ if(!on){ ctx.moveTo(x, line); on = true; } ctx.lineTo(x, y); } else if(on){ ctx.lineTo(x, line); on = false; } }); if(on) ctx.lineTo(prof[prof.length - 1][0], line); ctx.fill(); }
    // work it over with BRUSH strokes: broad and flat-ended, laid along the ground, each a little different —
    // in colour, BROKEN COLOUR: a hue from the biome's palette, warmer facing the sun, cooler turned away
    const strokes = Math.round(w/(unit*0.016)*(0.5 + t)*(B.dab === 'leaf' ? 1.4 : 1)*(B.dab === 'field' ? 0.6 : 1));
    ctx.lineCap = 'butt';
    for(let d = 0; d < strokes; d++){
      const k = Math.floor(Math.random()*(prof.length - 1)), [x0, y0] = prof[k], [x1, y1] = prof[k + 1];
      const slope = Math.atan2(y1 - y0, x1 - x0);
      const depthInto = Math.pow(Math.random(), 1.5)*unit*(0.03 + t*0.16);
      const x = x0 + (Math.random() - 0.5)*unit*0.01, y = y0 + depthInto + unit*0.004;
      if(B.sea && y > wl - unit*0.006) continue;                    // (no land strokes out on the water)
      const tn = Math.max(0, Math.min(255, tone + (Math.random() - 0.5)*(30 + t*44)));
      const len = unit*(B.dab === 'long' ? 0.07 : B.dab === 'rock' ? 0.035 : B.dab === 'dot' ? 0.008 : B.dab === 'snow' ? 0.05 : B.dab === 'field' ? 0.12 : 0.04)*(0.6 + t*0.8)*(0.7 + Math.random()*0.6)*zoom;
      const wide = unit*(0.007 + t*0.013)*(0.7 + Math.random()*0.6)*(B.dab === 'field' ? 1.4 : 1);
      const ang = B.dab === 'grass' ? slope - 0.35 + (Math.random() - 0.5)*0.4
              : B.dab === 'leaf' ? slope + (Math.random() - 0.5)*1.1
              : B.dab === 'rock' ? slope + (Math.random() - 0.5)*0.9
              : B.dab === 'dot' ? Math.random()*6.283
              : B.dab === 'snow' ? (Math.random() - 0.5)*0.08
              : B.dab === 'field' ? slope + (Math.random() - 0.5)*0.05
              : slope + (Math.random() - 0.5)*0.18;
      const ex = x + Math.cos(ang)*len, ey = y + Math.sin(ang)*len;
      const face = Math.max(-1, Math.min(1, Math.sin(slope)*sunSide*3));           // toward the sun (+) or away (−): a slope rising toward the sun faces it
      const hue = jitHue(mixC(pick(B.pal), TM.skyLow, (1 - t)*0.5), 0.22);
      const strokeCol = face > 0 ? mixC(hue, TM.light, face*0.35) : mixC(hue, TM.shadow, -face*0.35);
      ctx.strokeStyle = paint(tn, strokeCol);
      ctx.globalAlpha = (0.2 + Math.random()*0.18)*(B.dab === 'field' ? 1.6 : 1); ctx.lineWidth = wide;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + ex)/2, (y + ey)/2 - wide*0.4, ex, ey); ctx.stroke();
      const tn2 = Math.max(0, Math.min(255, tn + (Math.random() < 0.5 ? -18 : 18)));
      ctx.strokeStyle = paint(tn2, jitHue(strokeCol, 0.15));
      ctx.globalAlpha = 0.22; ctx.lineWidth = wide*0.45;
      ctx.beginPath(); ctx.moveTo(x + wide*0.2, y - wide*0.18); ctx.lineTo(ex - wide*0.4, ey - wide*0.18); ctx.stroke();
    }
    ctx.lineCap = 'round';
    // the river's reach through this band: from where it comes out of the valley here, down to where the nearer band
    // takes over (it paints over the rest): the sky in it, its banks dark, a few glints, and the near bank's own lip
    if(riv){ const tn = Math.min(1.25, t + 1/Math.max(1, bands - 1)), j = prof.findIndex(([px]) => px >= rivX(t)), ytop = j >= 0 ? prof[j][1] : base, L = [], Rr = [];
      // (it reaches the next band's foot of the valley as the depth it has there, then runs on under that band)
      const nb = horizon + (h - horizon)*Math.pow(Math.min(1, tn), 1.35 + pitch*0.9)*0.92 + unit*B.amp*(0.35 + Math.min(1, tn)*0.9)*0.6, yb = Math.max(ytop + unit*0.01, Math.min(h, nb));
      for(let q = 0; q <= 12; q++){ const sq = q/12, tt = t + (tn - t)*sq, yy = ytop + (yb - ytop)*sq; L.push([rivX(tt) - rivW(tt), yy]); Rr.push([rivX(tt) + rivW(tt), yy]); }
      L.push([rivX(tn) - rivW(tn), h + 10]); Rr.push([rivX(tn) + rivW(tn), h + 10]);
      const rc = mixC(waterCol, TM.skyLow, 0.35 + 0.3*(1 - t) + 0.15*calm);
      ctx.globalAlpha = 0.95; ctx.fillStyle = paint(Math.min(240, 160 + (1 - t)*40), rc); ctx.beginPath(); L.forEach(([a, b], q) => q ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); for(let q = Rr.length - 1; q >= 0; q--) ctx.lineTo(...Rr[q]); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.45; ctx.strokeStyle = paint(Math.max(0, tone - 30), mixC(bandCol, TM.shadow, 0.45)); ctx.lineWidth = unit*(0.002 + 0.004*t);
      for(const side of [L, Rr]){ ctx.beginPath(); side.forEach(([a, b], q) => q ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke(); }
      ctx.globalAlpha = 0.35 + 0.15*chop; ctx.fillStyle = paint(215, mixC([240, 244, 250], TM.light, 0.4));
      for(let k = 0; k < Math.round(4 + 10*t*(1 + chop)); k++){ const sq = Math.random(), q = Math.min(12, Math.floor(sq*13)), xa = L[q][0], xb = Rr[q][0], yy = L[q][1];
        ctx.fillRect(xa + (xb - xa)*(0.15 + Math.random()*0.5), yy, (xb - xa)*(0.1 + Math.random()*0.3)*(1 + calm), Math.max(0.6, unit*0.0016*(1 + t))); } }
    // a soft haze where each band meets the air behind it
    ctx.globalAlpha = 0.12*(1 - t); ctx.strokeStyle = paint(200, TM.skyLow); ctx.lineWidth = unit*0.01;
    ctx.beginPath(); prof.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    // the volcano's plume, leaning on the wind
    if(cone && i === cone.band){ const tx = cone.x, ty = base - cone.hgt*0.93, lean = (Math.random() < 0.5 ? -1 : 1)*unit*0.25;
      for(let k = 0; k < 70; k++){ const q = k/70, px = tx + lean*q*q + (Math.random() - 0.5)*unit*0.03*(1 + q*3), py = ty - unit*0.35*q, r = unit*(0.012 + q*0.05);
        ctx.globalAlpha = 0.1*(1 - q*0.6); ctx.fillStyle = paint(120 + q*60, mixC([90, 84, 86], TM.skyLow, q*0.6)); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill(); } }
    // TREES, painted (Ruby: "the trees need to be painted too"): evergreens with a fan brush, broadleaf
    // and bushes tapped in — dark first, then the light on the sun's side; far ones paler and smaller
    const greens = B.trees || B.lake || (B.sharp && t > 0.3) || (B.dab === 'grass' && t > 0.4) || B.bump;
    if(greens && t > 0.12){
      const n = Math.round(w/(unit*(B.trees ? 0.022 : 0.05))*(0.35 + t)), tt = Math.max(0, tone - 25);
      const dark = mixC(mixC([30, 70, 50], TM.shadow, 0.25), TM.skyLow, (1 - t)*0.45), lit = mixC(mixC([120, 160, 70], TM.light, 0.35), TM.skyLow, (1 - t)*0.3);
      for(let k = 0; k < n; k++){
        const [x, y] = prof[Math.floor(Math.random()*prof.length)], th = unit*(0.02 + 0.06*t)*(0.6 + Math.random()*0.8)*zoom;
        if(riv && Math.abs(x - rivX(t)) < rivW(t)*1.6 + th*0.3) continue;   // (none standing in the river)
        if(B.bump || Math.random() < (B.trees ? 0.25 : 0.4)) paintBush(ctx, x, y + th*0.1, th*0.35, dark, lit, sunSide, paint, tt);
        else paintEvergreen(ctx, x, y + th*0.08, th, dark, lit, sunSide, paint, tt, unit);
      }
    }
    // MIST at the foot of every far range: a soft haze before the next one is laid in front of it
    if(i < bands - 1 && !B.sea && !(B.lake && lakeTop == null && i === Math.floor((bands - 1)/2))){
      const nt = (i + 1)/(bands - 1), nb = horizon + (h - horizon)*Math.pow(nt, 1.35 + pitch*0.9)*0.92, nAmp = unit*B.amp*(0.35 + nt*0.9);
      paintMist(ctx, w, base - amp*0.15, Math.min(h, Math.max(nb, base + amp*0.4) + nAmp*1.2), TM.skyLow, paint, (1 - t)*(0.55 + 0.45*(B.sharp ? 1 : 0.6)));
    }
    // the lake lies in front of the far range
    if(B.lake && i === Math.floor((bands - 1)/2)){
      let top = 0; for(const [, y] of prof) top = Math.max(top, y);
      lakeTop = Math.min(h*0.8, top);
      water(lakeTop, prof, tone, bandCol);
    }
  }
  // A FRAMING TREE (Ross's "almighty" evergreen): a big one at an edge, standing in the foreground
  if(B.trees || B.lake || B.sharp || B.dab === 'grass' || B.sea){
    const side = Math.random() < 0.5 ? -1 : 1, count = 1 + Math.floor(Math.random()*2.4), tone = B.pale ? 70 : 40;
    const dark = mixC([24, 52, 40], TM.shadow, 0.3), lit = mixC([110, 150, 70], TM.light, 0.4);
    for(let k = 0; k < count; k++){
      const x = side < 0 ? w*(0.02 + k*0.09 + Math.random()*0.05) : w*(0.98 - k*0.09 - Math.random()*0.05), th = h*(0.55 + Math.random()*0.35)*(1 - k*0.2);
      paintEvergreen(ctx, x, h*1.02, th, dark, lit, sunSide, paint, tone, unit);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * A WATERCOLOUR WASH over any picture: past half wet, a few blooms (pale
 * cauliflower-edged pools with a darker tide line); and the whole picture
 * bleeding softly into itself, more the wetter it is.
 */
export function paintWash(ctx, c, w, h, wet){
  const unit = Math.min(w, h);
  if(wet > 0.5){
    const n = Math.round((wet - 0.5)*8*(0.5 + Math.random()));
    for(let k = 0; k < n; k++){
      const x = Math.random()*w, y = h*0.3 + Math.random()*h*0.7, r = unit*(0.03 + Math.random()*0.07);
      const ph = [Math.random()*6, Math.random()*6, Math.random()*6, Math.random()*6], pts = [];
      for(let a = 0; a <= 96; a++){ const an = a/96*Math.PI*2;
        const rr = r*(1 + 0.22*Math.sin(an*3 + ph[0]) + 0.12*Math.abs(Math.sin(an*7 + ph[1])) + 0.07*Math.abs(Math.sin(an*13 + ph[2])) + 0.04*Math.sin(an*29 + ph[3]));
        pts.push([x + Math.cos(an)*rr, y + Math.sin(an)*rr*0.8]); }
      const path = () => { ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); };
      ctx.globalAlpha = 0.1; ctx.fillStyle = 'rgb(205,205,205)'; path(); ctx.fill();
      ctx.globalAlpha = 0.22; ctx.strokeStyle = 'rgb(80,80,80)'; ctx.lineWidth = unit*0.0018; path(); ctx.stroke();
    }
  }
  if(wet > 0.01){
    const k = Math.max(4, Math.round(12 - wet*6)), sw = Math.max(1, Math.round(w/k)), sh = Math.max(1, Math.round(h/k));
    const [soft, sx] = kitCanvas(sw, sh); sx.imageSmoothingEnabled = true; sx.drawImage(c, 0, 0, sw, sh);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 0.7*wet; ctx.drawImage(soft, 0, 0, w, h); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ======================= THE PARTS AS STEPS =======================
// a part's own grid in a canvas pass: the texture's (smoke on a grid six canonical pixels to a cell)
const whimGrid = (E, d) => E.canvasPass ? [Math.ceil(E.ww/canonDiv(d)), Math.ceil(E.wh/canonDiv(d))] : [E.ww, E.wh];
const whimPx = E => E.canvasPass ? cpx : E.px;
const whimArea = E => E.canvasPass ? canonArea(E.ww, E.wh) : E.carea;
const whimDial = (E, v) => typeof v === 'number' ? v*360 : (E.ctx.light ?? 315);
const LAND_COUNTRIES = ['seed', ...Object.keys(LAND_BIOMES)], LAND_TIMESEL = ['seed', ...Object.keys(LAND_TIMES)];
const landSceneOf = (E, n) => landScene(E.ctx.seed, { country: String(E.P(n, 'country', 'seed')), time: String(E.P(n, 'time', 'seed')), tilt: E.num(n, 'tilt', 0)/100, light: E.ctx.light ?? 315, lightTilt: E.ctx.lightTilt ?? 100 });
// PARTICLES: three ways light hangs in the air, each the painter of a texture that used to be its own
// (texWhimsy: genSnow, genEmbers, genMagicParticles) — flakes (First Snow), sparks (Burning Mana) and
// motes (Euphoria Dust) — drawn over any picture, in any colours, the wind from any direction
// Lay a comb through water
// and every tooth leaves a line
// that will not cross another.
// FLOW LINES (Flow-Field Ink's painter, texWhimsy genFlowField until now; after Tyler Hobbs's essay on flow fields):
// evenly spaced streamlines, as Jobard &
// Lefer (1997) space them — a line grows from a seed both ways along the field and stops short of any other line —
// drawn as tapering strokes of ink. The field is the dial's direction bent by noise (Turbulence), or bent by any gray
// map wired into Angle Map. px/area: the canvas's own canonical sizes (E.px, E.carea), so the grid and the page agree.
function whimFlowLines(w, h, o, px, area){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', CPU);
  const unit = Math.min(w, h), zoom = o.zoom, amt = o.amt, turb = o.turb;
  const lv = dialVec(o.light == null ? 0 : o.light), base = Math.hypot(lv.lx, lv.ly) > 1e-3 ? Math.atan2(lv.ly, lv.lx) : 0;   // (a direction: the handle's way)
  let fieldAt;
  if(o.map){ const M = o.map, mw = o.mw, mh = o.mh;
    fieldAt = (x, y) => base + (M[Math.min(mh - 1, Math.max(0, y/h*mh|0))*mw + Math.min(mw - 1, Math.max(0, x/w*mw|0))] - 0.5)*Math.PI*2.6*turb; }
  else { const g1 = makeNoiseGrid(6, 6), g2 = makeNoiseGrid(13, 13);
    fieldAt = (x, y) => { const u = x/unit/zoom, v = y/unit/zoom;
      return base + (sampleNoiseGrid(g1, 6, 6, u*2.2, v*2.2)*0.75 + sampleNoiseGrid(g2, 13, 13, u*5, v*5)*0.25 - 0.5)*Math.PI*2.6*turb; }; }
  // round the words: near them the way turns along the room's own contour (the side nearer the flow's), so lines bend
  // round each line of the poem; on the words themselves a line ends
  const R = o.room, rAt = (x, y) => R[Math.min(h - 1, Math.max(0, y | 0))*w + Math.min(w - 1, Math.max(0, x | 0))];
  if(R){ const free = fieldAt; fieldAt = (x, y) => { const a = free(x, y), r = rAt(x, y); if(r >= 0.999) return a;
    const gx = rAt(x + 2, y) - rAt(x - 2, y), gy = rAt(x, y + 2) - rAt(x, y - 2), g = Math.hypot(gx, gy); if(g < 1e-6) return a;
    let t = Math.atan2(gx, -gy); if(Math.cos(t - a) < 0) t += Math.PI;
    const k = 1 - r, d = Math.atan2(Math.sin(t - a), Math.cos(t - a)); return a + d*Math.min(1, k*1.6); }; }
  const sep = px(54)*zoom/Math.max(0.3, amt), step = Math.max(0.6, px(4)), cell = sep*0.5;
  const gw = Math.ceil(w/cell) + 1, gh = Math.ceil(h/cell) + 1, grid = new Array(gw*gh);
  const near = (x, y, own) => { const cx = Math.floor(x/cell), cy = Math.floor(y/cell);
    for(let j = cy - 2; j <= cy + 2; j++) for(let i = cx - 2; i <= cx + 2; i++){ if(i < 0 || j < 0 || i >= gw || j >= gh) continue; const L = grid[j*gw + i]; if(!L) continue;
      for(const p of L){ if(p[2] === own && p[3] > -1) continue; const dx = p[0] - x, dy = p[1] - y; if(dx*dx + dy*dy < sep*sep) return true; } }
    return false; };
  const add = (x, y, own) => { const k = Math.floor(y/cell)*gw + Math.floor(x/cell); (grid[k] || (grid[k] = [])).push([x, y, own, 0]); };
  const tries = Math.round(area/(3072*3072)*1400*Math.min(3, amt));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let strokeId = 0;
  for(let t = 0; t < tries; t++){
    const sx = Math.random()*w, sy = Math.random()*h;
    if(near(sx, sy, -1) || (R && rAt(sx, sy) < 0.3)) continue;
    const id = strokeId++, pts = [[sx, sy]];
    for(const dir of [1, -1]){                       // walk both ways from the seed point
      let x = sx, y = sy;
      for(let s = 0; s < 900; s++){
        const a = fieldAt(x, y); const nx = x + Math.cos(a)*step*dir, ny = y + Math.sin(a)*step*dir;
        if(nx < -sep || ny < -sep || nx > w + sep || ny > h + sep) break;
        if(R && rAt(nx, ny) < 0.12) break;
        const cx = Math.floor(nx/cell), cy = Math.floor(ny/cell); let hit = false;      // too close to ANOTHER line
        for(let j = cy - 2; j <= cy + 2 && !hit; j++) for(let i = cx - 2; i <= cx + 2 && !hit; i++){ if(i < 0 || j < 0 || i >= gw || j >= gh) continue; const L = grid[j*gw + i]; if(!L) continue;
          for(const p of L){ if(p[2] === id) continue; const dx = p[0] - nx, dy = p[1] - ny; if(dx*dx + dy*dy < sep*sep*0.55){ hit = true; break; } } }
        if(hit) break;
        x = nx; y = ny; if(dir > 0) pts.push([x, y]); else pts.unshift([x, y]);
      }
    }
    if(pts.length < 12) continue;
    for(const p of pts) if(p[0] >= 0 && p[1] >= 0 && p[0] < w && p[1] < h) add(p[0], p[1], id);
    // one ink or the other, its width a little its own, tapering at both ends
    const wd = px(9 + Math.random()*9)*zoom*Math.min(1.3, 0.55 + 0.45/Math.max(0.4, amt)), col = Math.random() < 0.18 ? o.ink2 : o.ink1;
    ctx.strokeStyle = col; ctx.globalAlpha = 0.82 + Math.random()*0.15;
    const n = pts.length, seg = Math.max(4, Math.floor(n/14));
    for(let a = 0; a < n - 1; a += seg){
      const b = Math.min(n - 1, a + seg), m = (a + b)/2/(n - 1), taper = Math.min(1, Math.sin(m*Math.PI)*1.6);
      ctx.lineWidth = Math.max(px(0.4), wd*(0.35 + 0.65*taper));
      ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); for(let q = a + 1; q <= b; q++) ctx.lineTo(pts[q][0], pts[q][1]); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}
// Green below, red above —
// the same oxygen, burning
// at two different heights.
// AURORA CURTAINS: an aurora as a photograph shows one — not ribbons but CURTAINS of fine vertical RAYS along the
// magnetic field, hanging from a bright, folded lower hem. Each ray is a particle: a streak of light whose colour
// follows its height as the real emission does (oxygen's 557.7 nm green low down, its 630 nm red high up, a
// nitrogen pink-violet fringe at the very hem; after the Stanford pbrt aurora's altitude table), drawn additively,
// so where rays crowd the curtain glows. The dial leans the rays (the field lines) and turns the arc of the hem.
function whimAurora(x, w, h, o, px){
  const unit = Math.min(w, h), R = Math.random, curtains = Math.max(1, Math.round(o.curtains));
  const lean = o.lean, H = unit*0.55*o.height;
  const hue = (t, k) => {   // t: 0 at the hem, 1 at the top of a ray; k: how red the high sky is (Color)
    const g = [80, 255, 120], r = [255, 40, 80], hem = [255, 110, 200];
    const top = Math.min(1, t*1.6), mix = Math.min(1, top*top*(0.15 + 1.1*k)), low = Math.max(0, 1 - t*14)*0.7*(0.3 + 0.7*o.fringe);
    return [0, 1, 2].map(c => (g[c]*(1 - mix) + r[c]*mix)*(1 - low) + hem[c]*low);
  };
  x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
  for(let c = 0; c < curtains; c++){
    // the hem: a line across the sky, folded (sums of slow waves), lower curtains brighter and nearer; Horizon lowers or raises them all
    const y0 = h*(0.38 + 0.38*(curtains === 1 ? 0.5 : c/(curtains - 1)))*(0.85 + R()*0.3) + (o.horizon - 0.5)*h*0.7, amp = unit*(0.06 + R()*0.11), ph = [R()*6.3, R()*6.3, R()*6.3], fr = [1.2 + R()*1.6, 3 + R()*3, 7 + R()*6];
    const arc = o.arc*unit*0.25, bright = (0.55 + 0.45*R())*(1 - c*0.12);
    const hemY = X => y0 + Math.sin(X/unit*fr[0] + ph[0])*amp + Math.sin(X/unit*fr[1] + ph[1])*amp*0.35 + Math.sin(X/unit*fr[2] + ph[2])*amp*0.12 + arc*Math.pow((X/w - 0.5)*2, 2);
    // the curtain's light comes and goes along it: bright knots, dim gaps (rays crowd in bundles)
    const knots = [], nk = 4 + Math.floor(R()*5); for(let k = 0; k < nk; k++) knots.push([R()*w, unit*(0.05 + R()*0.18), 0.4 + R()*0.6]);
    const along = X => { let s = 0.18; for(const [kx, kw, ka] of knots){ const d = (X - kx)/kw; s += ka*Math.exp(-d*d); } return Math.min(1.4, s); };
    // fine striation along the curtain: a few frequencies of ripple in its brightness (the rays crowd and part)
    const st = [[R()*6.3, 40 + R()*30], [R()*6.3, 90 + R()*60], [R()*6.3, 190 + R()*120]];
    const stri = X => { let s = 0; for(const [p, f] of st) s += Math.sin(X/unit*f + p); return 0.55 + 0.45*s/3; };
    // THE BODY: column by column, a band of light rising from the hem — brightest just above it, fading slowly up
    // (the emission's height profile), its colour by height; added light, so bundles of columns glow
    const colW = px(3.2), cols = Math.ceil(w/colW) + 1;
    for(let k = 0; k < cols; k++){
      const X = k*colW, a = along(X)*bright*stri(X); if(a < 0.04) continue;
      const len = H*(0.45 + 0.55*Math.min(1, a))*(0.85 + 0.3*stri(X*1.7 + 13)), base = hemY(X), lx = lean*len;
      const g = x.createLinearGradient(X, base, X + lx, base - len), col = t => hue(t, o.red);
      const stops = [[0, 0.0], [0.03, 0.85], [0.1, 0.7], [0.3, 0.38], [0.55, 0.16], [0.8, 0.05], [1, 0]];
      for(const [t, al] of stops){ const c2 = col(t); g.addColorStop(t, `rgba(${c2[0]|0},${c2[1]|0},${c2[2]|0},${Math.min(1, al*a*0.85*o.glow)})`); }
      x.fillStyle = g; x.beginPath(); x.moveTo(X - colW*0.6, base + px(2)); x.lineTo(X + colW*0.6, base + px(2)); x.lineTo(X + colW*0.6 + lx, base - len); x.lineTo(X - colW*0.6 + lx, base - len); x.closePath(); x.fill();
    }
    // THE RAYS: thin, brighter streaks through the body (the field lines picked out)
    const rays = Math.round(w/px(9)*o.rays);
    for(let i = 0; i < rays; i++){
      const X = R()*w, a = along(X)*bright*stri(X); if(R() > a) continue;
      const len = H*(0.3 + 0.7*R())*(0.6 + 0.4*Math.min(1, a)), base = hemY(X) - px(2), wd = px(1.2 + R()*2.4), lx = lean*len;
      const g = x.createLinearGradient(X, base, X + lx, base - len);
      for(const [t, al] of [[0, 0.5], [0.15, 0.4], [0.5, 0.14], [1, 0]]){ const c2 = hue(t, o.red); g.addColorStop(t, `rgba(${c2[0]|0},${c2[1]|0},${c2[2]|0},${Math.min(1, al*a*0.9*o.glow)})`); }
      x.strokeStyle = g; x.lineWidth = wd; x.beginPath(); x.moveTo(X, base); x.lineTo(X + lx, base - len); x.stroke();
    }
  }
  x.restore();
}
const whimHex = v => '#' + v.slice(0, 3).map(c => Math.max(0, Math.min(255, Math.round(c*255))).toString(16).padStart(2, '0')).join('');
// ---------------- A RINGWORLD, PAINTED (Ruby: "an abstract ring world on a space background and then something made
// of shapes then painted in the foreground and blend it … abstract, painterly, geometric, and blended representations";
// the 3D one "looks kind of bad" rendered) ----------------
// Two scene parts, each a stack of flat shapes laid as a painter blocks in a canvas before the brush goes over it: the
// RING IN THE SKY (a solid band round its star: land and sea on its inside between two rim walls, its hull across the
// near side, the air rising at the horizon), and the LAND OF SHAPES (faceted ridges band behind band, hazier as they go back, with spires,
// arches, monoliths and crystals on them and trees on the near hills). Oil Paint's brushes paint them.
export const rsMix = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t);
export const rsCss = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
export const rsPoly = (x, pts, fill) => { x.fillStyle = fill; x.beginPath(); pts.forEach(([X, Y], i) => i ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.closePath(); x.fill(); };
// a face's colour by how squarely it faces the light: (nx, ny) its outward normal on the page, L the way to the light
export const rsFace = (dark, lit, nx, ny, L) => { const l = Math.hypot(nx, ny) || 1; return rsMix(dark, lit, 0.5 + 0.5*Math.max(-1, Math.min(1, (nx*L[0] + ny*L[1])/l))); };
export const rsSmooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a)/(b - a))); return t*t*(3 - 2*t); };
// SATURN, in flat shapes (Ruby's favorite planet: "Easter eggs should include Saturn"): pale gold bands, the C, B and A
// rings with the Cassini gap between, the night side and the planet's shadow across the rings away from the sun, the
// rings' shadow on the globe; the near half of the rings crossing in front of it. (X, Y) its middle, r its radius;
// o.axis the rings' long axis on the page (radians), o.open how far they open (0 edge-on, ±1 face-on; the sign says
// which face shows), o.sun the way to the sun on the page, o.alpha, o.tint a color the planet leans a little toward,
// o.behind the sky's color behind it (the globe is solid, so the far rings never show through it).
//   ringed and patient,
//   the old god keeps his hours —
//   gold dust, and the gap
export function paintSaturn(x, X, Y, r, o = {}){
  if(!(r > 0.5)) return;
  const axis = o.axis || 0, open = Math.abs(o.open ?? 0.3) < 0.04 ? 0.04*Math.sign(o.open || 1) : (o.open ?? 0.3), a = o.alpha ?? 1, SPACE = [8, 10, 24];
  const tint = c => o.tint ? rsMix(c, o.tint, 0.12) : c;
  const BANDS = [[214, 194, 150], [230, 212, 168], [204, 178, 128], [238, 224, 188], [198, 170, 122], [226, 204, 158], [184, 160, 120]].map(tint);
  const RINGS = [[1.24, 1.53, tint([168, 150, 122]), 0.4], [1.53, 1.95, tint([234, 220, 186]), 0.88], [2.03, 2.27, tint([206, 192, 162]), 0.7]];
  const sl = Math.hypot(...(o.sun || [0.8, -0.6])) || 1, sun = (o.sun || [0.8, -0.6]).map(v => v/sl), sx = sun[0]*Math.cos(axis) + sun[1]*Math.sin(axis);
  const frame = () => { x.translate(X, Y); x.rotate(axis); };
  // the rings, one half (the far half first, behind the globe), and the globe's shadow across them, away from the sun
  // (backlit, in an eclipse, the rings shine as their dust scatters the light forward: the thin ones brightest)
  const rings = (far, ec = 0) => {
    for(const [r0, r1, c, al] of RINGS){ x.save(); frame(); x.scale(1, open); x.strokeStyle = rsCss(ec > 0 ? rsMix(c, [255, 244, 222], 0.5*ec) : c, (ec > 0 ? al + (1 - al)*0.6*ec : al)*a); x.lineWidth = (r1 - r0)*r;
      x.beginPath(); x.arc(0, 0, (r0 + r1)/2*r, far ? Math.PI : 0, far ? Math.PI*2 : Math.PI); x.stroke(); x.restore(); }
    if(Math.abs(sx) > 0.15){ x.save(); frame(); x.scale(1, open); x.beginPath(); x.rect(sx > 0 ? -2.4*r : 0, far ? -r : 0, 2.4*r, r); x.clip();
      x.strokeStyle = rsCss(SPACE, 0.55*a); x.lineWidth = (2.27 - 1.24)*r; x.beginPath(); x.arc(0, 0, 1.755*r, far ? Math.PI : 0, far ? Math.PI*2 : Math.PI); x.stroke(); x.restore(); } };
  const ec = Math.max(0, Math.min(1, o.eclipse || 0));
  rings(true, ec);
  // the globe: its bands along the rings, darker toward the poles, the night side away from the sun, the rings' shadow
  x.fillStyle = rsCss(o.behind || SPACE); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill();
  x.save(); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.clip(); frame();
  let y = -r; for(let i = 0; y < r; i++){ const hh = r*(i === 0 ? 0.3 : 0.12 + 0.13*((i*0.618) % 1)); x.fillStyle = rsCss(BANDS[i % BANDS.length], a); x.fillRect(-r, y, 2*r, hh + 0.5); y += hh; }
  x.fillStyle = rsCss(rsMix(BANDS[6], SPACE, 0.2), 0.45*a); x.fillRect(-r, -r, 2*r, r*0.22); x.fillRect(-r, r*0.78, 2*r, r*0.22);
  x.strokeStyle = rsCss(SPACE, 0.32*a); x.lineWidth = r*0.07; x.save(); x.scale(1, open); x.beginPath(); x.arc(0, r*0.1/open, 1.3*r, 0, Math.PI); x.stroke(); x.restore();
  x.restore();
  x.save(); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.clip();
  x.fillStyle = rsCss(SPACE, 0.62*a); x.beginPath(); x.arc(X - sun[0]*r*1.25, Y - sun[1]*r*1.25, r*1.02, 0, Math.PI*2); x.fill();
  x.fillStyle = rsCss(SPACE, 0.22*a); x.beginPath(); x.arc(X - sun[0]*r*0.85, Y - sun[1]*r*0.85, r*1.02, 0, Math.PI*2); x.fill();
  // ECLIPSE (o.eclipse, 0..1: the sun behind the globe, as Cassini saw it from Saturn's shadow): the face toward us all
  // night, only a thin limb of sunlit air round it, brightest on the sun's side
  if(ec > 0){ x.fillStyle = rsCss(SPACE, 0.88*ec*a); x.fillRect(X - r, Y - r, 2*r, 2*r); }
  x.restore();
  if(ec > 0){ const L = o.limb || [255, 236, 200]; x.save(); x.globalCompositeOperation = 'screen';
    // the air round the limb, lit through (a ring of light), and the dust of the faint outer rings glowing round it all
    const g = x.createRadialGradient(X, Y, r*0.96, X, Y, r*1.18); g.addColorStop(0, rsCss(L, 0)); g.addColorStop(0.2, rsCss(L, 0.75*ec*a)); g.addColorStop(1, rsCss(L, 0));
    x.fillStyle = g; x.beginPath(); x.arc(X, Y, r*1.18, 0, Math.PI*2); x.fill();
    const t = x.createRadialGradient(X + sun[0]*r*0.9, Y + sun[1]*r*0.9, 0, X + sun[0]*r*0.9, Y + sun[1]*r*0.9, r*0.9); t.addColorStop(0, rsCss(L, 0.5*ec*a)); t.addColorStop(1, rsCss(L, 0));
    x.fillStyle = t; x.fillRect(X - r*2, Y - r*2, r*4, r*4);
    x.save(); frame(); x.scale(1, open); x.strokeStyle = rsCss(o.tint ? rsMix(L, o.tint, 0.3) : L, 0.07*ec*a); x.lineWidth = r*0.45; x.beginPath(); x.arc(0, 0, 3.4*r, 0, Math.PI*2); x.stroke(); x.restore();
    x.restore(); }
  rings(false, ec);
}
// ENCELADUS (Ruby's favorite moon, home of the kitsune): small and white, its night side grey-blue, blue tiger stripes at
// its south pole and the plume rising from them, a fan of faint jets. (X, Y), r; o.axis the way its north points on the
// page (radians from up), o.sun, o.alpha; o.px a canonical pixel (for the finest lines).
export function paintEnceladus(x, X, Y, r, o = {}){
  if(!(r > 0.3)) return;
  const a = o.alpha ?? 1, px = o.px || (v => v), sl = Math.hypot(...(o.sun || [0.8, -0.6])) || 1, sun = (o.sun || [0.8, -0.6]).map(v => v/sl);
  x.save(); x.translate(X, Y); x.rotate(o.axis || 0);
  // the plume, from the south pole down and out: a soft fan, then its jets
  x.save(); x.globalCompositeOperation = 'screen';
  const g = x.createRadialGradient(0, r*1.6, 0, 0, r*1.6, r*3.2); g.addColorStop(0, rsCss([200, 226, 255], 0.35*a)); g.addColorStop(1, rsCss([200, 226, 255], 0)); x.fillStyle = g; x.fillRect(-r*3.2, -r*1.6, r*6.4, r*6.4);
  for(let k = -2; k <= 2; k++){ const jg = x.createLinearGradient(k*r*0.2, r*0.85, k*r*0.9, r*4); jg.addColorStop(0, rsCss([226, 240, 255], 0.5*a)); jg.addColorStop(1, rsCss([226, 240, 255], 0));
    x.strokeStyle = jg; x.lineWidth = Math.max(px(0.6), r*0.14); x.beginPath(); x.moveTo(k*r*0.2, r*0.85); x.lineTo(k*r*0.9, r*4); x.stroke(); }
  x.restore();
  x.fillStyle = rsCss([244, 247, 252], a); x.beginPath(); x.arc(0, 0, r, 0, Math.PI*2); x.fill();
  x.save(); x.beginPath(); x.arc(0, 0, r, 0, Math.PI*2); x.clip();
  if(r > px(5)){ x.strokeStyle = rsCss([110, 170, 226], 0.85*a); x.lineWidth = Math.max(px(0.5), r*0.07);
    for(let k = 0; k < 4; k++){ const yy = r*(0.42 + k*0.13); x.beginPath(); x.moveTo(-r*0.5 + k*r*0.05, yy - r*0.08); x.lineTo(r*0.45 - k*r*0.04, yy + r*0.06); x.stroke(); } }
  const sa = -(o.axis || 0), su = [sun[0]*Math.cos(sa) - sun[1]*Math.sin(sa), sun[0]*Math.sin(sa) + sun[1]*Math.cos(sa)];
  x.fillStyle = rsCss([60, 72, 98], 0.6*a); x.beginPath(); x.arc(-su[0]*r*1.3, -su[1]*r*1.3, r*1.05, 0, Math.PI*2); x.fill();
  x.restore(); x.restore();
}
function paintRingSky(x, mk, w, h, o){
  const unit = Math.min(w, h), R = o.rnd, S = o.sky, Lh = o.land, px = o.px;
  const SEA = rsMix([22, 58, 120], S, 0.3), CLOUD = [244, 245, 250], NIGHT = [20, 22, 48], METAL = rsMix([46, 50, 70], S, 0.2), SAND = rsMix(Lh, [218, 186, 128], 0.6), FOREST = rsMix(Lh, [20, 52, 34], 0.45);
  const VIOLET = [150, 92, 206], ROSE = [210, 98, 128], SC = [255, 246, 226], la = (o.light - 90)*Math.PI/180, L = [Math.cos(la), Math.sin(la)];
  // THE NEBULA: long washes of the sky's hue and its neighbours (violet, rose) along one band, the galaxy's, and a few
  // broad ones anywhere; laid as light, so the dark between them stays space
  x.save(); x.globalCompositeOperation = 'screen';
  const wash = (cx, cy, rx, ry, a, col, al) => { x.save(); x.translate(cx, cy); x.rotate(a); x.scale(1, ry/rx); const g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rsCss(col, al)); g.addColorStop(0.5, rsCss(col, al*0.35)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(-rx, -rx, rx*2, rx*2); x.restore(); };
  const ga = (R() - 0.5)*1.4, gx = w*(0.3 + 0.4*R()), gy = h*(0.12 + 0.22*R()), nW = Math.round(3 + 9*o.nebula);
  for(let i = 0; i < nW; i++){ const d = (R() - 0.5)*unit*1.8, col = [S, VIOLET, ROSE, S][Math.floor(R()*4)];
    wash(gx + Math.cos(ga)*d + (R() - 0.5)*unit*0.12, gy + Math.sin(ga)*d + (R() - 0.5)*unit*0.12, unit*(0.16 + 0.3*R()), unit*(0.05 + 0.09*R()), ga + (R() - 0.5)*0.5, col, 0.24*o.nebula); }
  for(let i = 0; i < Math.round(1 + 3*o.nebula); i++) wash(R()*w, R()*h*0.6, unit*(0.3 + 0.5*R()), unit*(0.15 + 0.25*R()), R()*3, R() < 0.5 ? S : VIOLET, 0.12*o.nebula);
  // THE AIR: the sky's hue rising from the horizon, held in by the ring's walls
  const hz = x.createLinearGradient(0, h*0.3, 0, h); hz.addColorStop(0, rsCss(S, 0)); hz.addColorStop(0.55, rsCss(S, 0.32*o.haze)); hz.addColorStop(1, rsCss(rsMix(S, [255, 255, 255], 0.4), 0.9*o.haze));
  x.fillStyle = hz; x.fillRect(0, 0, w, h); x.restore();
  // THE RING round its star, as a solid (Ruby: "some depth… at the moment it's a flat disc"): a band whose land faces
  // in to the star, its hull outside, a rim wall standing in from each edge to hold the air, seen in a gentle perspective
  // (skyRingFrame: Turn spins it, View raises the eye above its plane, Zoom sizes it). Cut in short blocks, three lanes
  // across the land; every face is laid farthest first, the star at the ring's middle between the far faces and the near
  const F = skyRingFrame(w, h, o), { P, faceSeen, depthAt, A, cx, cy, Dw } = F;
  const s1 = R()*10, s2 = R()*10, s3 = R()*10, s4 = R()*10, nsq = 6 + Math.floor(R()*8), sq0 = R();
  const nz = (t, f, s) => { let v = 0, amp = 1, nm = 0; for(let k = 0; k < 3; k++){ v += amp*Math.sin(t*f*(k + 1)*1.31 + s*(k + 1)*2.3 + Math.sin(t*f*0.7 + s)*1.6); nm += amp; amp *= 0.5; } return v/nm; };
  // night where a shadow square stands between the star and the land, its edges a short dusk
  const nightOf = t => { const ph = ((t/(Math.PI*2))*nsq + sq0) % 1; return ph < 0.34 ? rsSmooth(0, 0.045, Math.min(ph, 0.34 - ph)) : 0; };
  const N = 200, LANES = 3, step = Math.PI*2/N, ov = step*0.08, WALL = rsMix(METAL, [255, 255, 255], 0.3), LIP = rsMix(METAL, S, 0.25);
  // the land at (t, lane z): sea, sand, forest or meadow, clouds as blocks of white (Ruby, "that simplified, but cosmic"),
  // always lit by its star but where a shadow square's night falls; hazed with the ring's own air, darker by the walls
  const landAt = (tm, zm) => { const v = nz(tm, 2.2, s1) + 0.2*nz(tm*3 + zm*0.9, 5, s2), dry = nz(tm*1.4 + zm*0.4, 3, s3), nf = nightOf(tm);
    let col = v < -0.1 ? rsMix(SEA, [255, 255, 255], 0.1*Math.max(0, v + 0.35)) : dry > 0.45 ? SAND : v > 0.5 ? FOREST : rsMix(Lh, FOREST, 0.25 + 0.3*nz(tm, 9, s4));
    const cl = nz(tm*1.6 + zm*0.5, 6, s4 + 1); if(cl > 0.4) col = rsMix(col, CLOUD, Math.min(0.75, (cl - 0.4)*4));
    col = rsMix(rsMix(col, [255, 255, 255], 0.1), S, 0.16*o.haze);
    col = rsMix(col, [0, 0, 0], 0.12*Math.pow(Math.abs(zm*2 - 1), 3));
    return nf > 0 ? rsMix(col, NIGHT, 0.86*nf) : col; };
  // the hull and the walls' faces, metal lit by the dial's light from where it falls on them (n: the face's way on the page)
  const litMetal = (base, n, k) => { const d = n[0]*L[0] + n[1]*L[1]; return rsMix(base, d > 0 ? [235, 238, 248] : [0, 0, 0], Math.min(1, Math.abs(d))*k); };
  const faces = [];
  for(let i = 0; i < N; i++){
    const t0 = i*step, t1 = (i + 1)*step + ov, tm = (t0 + t1)/2, seam = i % 5 === 0, ct = Math.cos(tm), st = Math.sin(tm);
    // the band: its land where its inside faces the eye, else its hull (three lanes across, either way)
    const inside = faceSeen([-ct, st, 0], tm, 1, 0);
    for(let j = 0; j < LANES; j++){ const z0 = -1 + 2*j/LANES, z1 = -1 + 2*(j + 1)/LANES + (j < LANES - 1 ? 0.04 : 0), zm = (j + 0.5)/LANES;
      const q = [P(t0, 1, z0), P(t1, 1, z0), P(t1, 1, z1), P(t0, 1, z1)], d = depthAt(tm, 1, (z0 + z1)/2);
      if(inside) faces.push({ d, q, col: landAt(tm, zm), land: tm });
      else { let col = rsMix(METAL, j === 1 ? [0, 0, 0] : [255, 255, 255], j === 1 ? 0.12 : 0.04); col = litMetal(col, [ct, st], 0.22); if(seam) col = rsMix(col, [0, 0, 0], 0.2);
        faces.push({ d, q, col }); } }
    // the rim walls: each a shelf standing in from an edge, seen from the side it shows (its top above, the face to the land below)
    for(const z of [1, -1]){ const up = faceSeen([0, 0, 1], tm, 1 - Dw/2, z), q = [P(t0, 1, z), P(t1, 1, z), P(t1, 1 - Dw, z), P(t0, 1 - Dw, z)];
      if(!up && !faceSeen([0, 0, -1], tm, 1 - Dw/2, z)) continue;
      let col = z > 0 === up ? litMetal(WALL, [0, -1], 0.3) : rsMix(LIP, [0, 0, 0], 0.18);
      if(seam) col = rsMix(col, [0, 0, 0], 0.16);
      faces.push({ d: depthAt(tm, 1 - Dw/2, z), q, col, edge: z > 0 && up ? [P(t0, 1, z), P(t1, 1, z)] : null }); }
  }
  faces.sort((p, q) => p.d - q.d);
  const lay = f => { rsPoly(x, f.q, rsCss(f.col)); rsPoly(mk, f.q, '#fff');
    // the wall's top catching the light along its outer edge
    if(f.edge){ x.strokeStyle = rsCss(rsMix([232, 238, 250], S, 0.2), 0.7); x.lineWidth = px(1.6); x.beginPath(); x.moveTo(...f.edge[0]); x.lineTo(...f.edge[1]); x.stroke(); }
    // the night side's cities: warm sparks on its land
    if(f.land != null && nightOf(f.land) > 0.5 && nz(f.land, 3, s1) > -0.1 && R() < 0.45){ const u = R(), v = R(), [a0, a1, a2, a3] = f.q;
      const X = (a0[0]*(1 - u) + a1[0]*u)*(1 - v) + (a3[0]*(1 - u) + a2[0]*u)*v, Y = (a0[1]*(1 - u) + a1[1]*u)*(1 - v) + (a3[1]*(1 - u) + a2[1]*u)*v;
      x.fillStyle = 'rgba(255,214,150,0.9)'; x.fillRect(X, Y, px(2.4), px(2.4)); } };
  let k = 0;
  for(; k < faces.length && faces[k].d < 0; k++) lay(faces[k]);
  // the air it holds, lit about its far arc
  x.save(); x.globalCompositeOperation = 'screen'; x.lineWidth = F.Hw*2*A*Math.max(0.3, F.cp)*1.6; x.strokeStyle = rsCss(rsMix(S, [255, 255, 255], 0.3), 0.05*(0.5 + o.haze));
  x.beginPath(); for(let i = 0; i <= N/2; i++){ const [X, Y] = P(Math.PI + i*step, 1 - Dw, 0); i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); x.restore();
  // THE STAR at its middle: its glow, its long thin rays, its disc; the shadow squares circling close about it, in the ring's plane
  const rs = unit*0.022*Math.sqrt(o.size);
  x.save(); x.globalCompositeOperation = 'screen';
  for(const [r, a] of [[rs*16, 0.35], [rs*6, 0.6]]){ const gl = x.createRadialGradient(cx, cy, 0, cx, cy, r); gl.addColorStop(0, rsCss(SC, a)); gl.addColorStop(0.2, rsCss(SC, a*0.35)); gl.addColorStop(1, rsCss(SC, 0)); x.fillStyle = gl; x.fillRect(cx - r, cy - r, r*2, r*2); }
  for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2 + R()*0.2, Lr = rs*(k % 2 ? 4 : 9)*(0.8 + 0.4*R()), wd = rs*0.2;
    rsPoly(x, [[cx + Math.cos(a + Math.PI/2)*wd, cy + Math.sin(a + Math.PI/2)*wd], [cx + Math.cos(a)*Lr, cy + Math.sin(a)*Lr], [cx - Math.cos(a + Math.PI/2)*wd, cy - Math.sin(a + Math.PI/2)*wd]], rsCss(SC, 0.4)); }
  x.restore();
  x.fillStyle = rsCss(SC); x.beginPath(); x.arc(cx, cy, rs, 0, Math.PI*2); x.fill();
  for(let k = 0; k < nsq; k++){ const t = (k/nsq + sq0)*Math.PI*2, [X, Y] = P(t, 0.2, 0);
    const a = Math.atan2(Y - cy, X - cx) + Math.PI/2, Ls = rs*1.5, Wd = rs*0.4, ca = Math.cos(a), sa = Math.sin(a);
    rsPoly(x, [[X - ca*Ls, Y - sa*Ls], [X + ca*Ls, Y + sa*Ls], [X + ca*Ls - sa*Wd, Y + sa*Ls + ca*Wd], [X - ca*Ls - sa*Wd, Y - sa*Ls + ca*Wd]], rsCss(NIGHT, 0.92)); }
  // the near faces, in front of the star
  for(; k < faces.length; k++) lay(faces[k]);
}
function paintShapeLand(x, mk, dk, w, h, o){
  const R = o.rnd, unit = Math.min(w, h), px = o.px, la = (o.light - 90)*Math.PI/180, L = [Math.cos(la), Math.sin(la)], Lh = o.land, HZ = o.haze3, SUN = [255, 244, 222], BLACK = [0, 0, 0];
  const AIR = rsMix(HZ, [255, 255, 255], 0.3), METAL = [204, 210, 226], GLOW = [150, 224, 255], GREEN = rsMix([40, 88, 54], Lh, 0.45);
  const nL = 3 + Math.round(o.layers*3), hy = h*o.horizon, rnd = (a, b) => a + (b - a)*R();
  const jit = (c, k = 0.07) => { const q = (R() - 0.5)*2*k; return q > 0 ? rsMix(c, [255, 255, 255], q) : rsMix(c, BLACK, -q); };
  // one tree, as a painter blocks it: a fir of stacked triangles, a round crown of facets, or a poplar; lit on the light's side
  const tree = (X, Y, sz, fa, kind) => { const gc = rsMix(jit(GREEN, 0.1), AIR, fa*0.7), sd = L[0] > 0 ? 1 : -1;
    const c = { trunk: rsMix([70, 52, 40], AIR, fa*0.7), dark: rsMix(gc, BLACK, 0.3*(1 - fa)), body: gc, lit: rsMix(gc, SUN, 0.28*(1 - fa*0.6)), glow: GLOW, sd, L };
    pkTree(x, X, Y, sz*1.7, c, kind < 0.3 ? 'spruce' : kind < 0.45 ? 'pine' : kind < 0.75 ? 'broadleaf' : kind < 0.88 ? 'poplar' : 'birch', R, px); };
  // THE BUILDERS' SHAPES: a spire, a gate, a standing ring (the ring overhead, echoed), a monolith, crystals
  const structure = (ax, ay, s, fa) => { const kind = R(), m = rsMix(METAL, AIR, fa*0.75), md = rsMix(m, BLACK, 0.32*(1 - fa*0.5)), gl = rsMix(GLOW, AIR, fa*0.4), sd = L[0] > 0 ? 1 : -1;
    const glow = (X, Y, r) => { x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rsCss(gl, 0.8)); g.addColorStop(1, rsCss(gl, 0)); x.fillStyle = g; x.fillRect(X - r, Y - r, r*2, r*2); x.restore(); };
    const pc = { body: m, lit: rsMix(m, SUN, 0.3), dark: md, glow: gl, glow2: gl, sd, L };
    if(kind < 0.3){ pkSpire(x, ax, ay, unit*(0.16 + 0.16*R())*s, pc, false, R, px); }
    else if(kind < 0.52){ const gw = unit*(0.07 + 0.06*R())*s, gh = gw*(1.15 + 0.5*R()), th = gw*0.24, gy = ay + th*0.4, ry = gy - gh + gw/2;
      x.fillStyle = rsCss(md); x.beginPath(); x.moveTo(ax - gw/2, gy); x.lineTo(ax - gw/2, ry); x.arc(ax, ry, gw/2, Math.PI, 0); x.lineTo(ax + gw/2, gy);
      x.lineTo(ax + gw/2 - th, gy); x.lineTo(ax + gw/2 - th, ry); x.arc(ax, ry, gw/2 - th, 0, Math.PI, true); x.lineTo(ax - gw/2 + th, gy); x.closePath(); x.fill();
      x.fillStyle = rsCss(m); x.beginPath(); x.moveTo(ax + sd*gw/2, gy); x.lineTo(ax + sd*gw/2, ry); x.arc(ax, ry, gw/2, sd > 0 ? 0 : Math.PI, -Math.PI/2, sd > 0);
      x.lineTo(ax, ry - gw/2 + th); x.arc(ax, ry, gw/2 - th, -Math.PI/2, sd > 0 ? 0 : Math.PI, sd < 0); x.lineTo(ax + sd*(gw/2 - th), gy); x.closePath(); x.fill();
      x.save(); x.globalAlpha = 0.28; rsPoly(x, [[ax - gw/2 + th, gy], [ax - gw/2 + th, ry], [ax + gw/2 - th, ry], [ax + gw/2 - th, gy]], rsCss(gl)); x.restore(); }
    else if(kind < 0.7){ const rr = unit*(0.035 + 0.025*R())*s, ph = rr*0.5, ccy = ay - ph - rr;
      rsPoly(x, [[ax - rr*0.5, ay + rr*0.2], [ax - rr*0.3, ay - ph], [ax + rr*0.3, ay - ph], [ax + rr*0.5, ay + rr*0.2]], rsCss(md));
      x.fillStyle = rsCss(md); x.beginPath(); x.arc(ax, ccy, rr, 0, Math.PI*2); x.arc(ax, ccy, rr*0.74, 0, Math.PI*2, true); x.fill();
      const a0 = sd > 0 ? -Math.PI/2 : Math.PI/2; x.fillStyle = rsCss(m); x.beginPath(); x.arc(ax, ccy, rr, a0, a0 + Math.PI); x.arc(ax, ccy, rr*0.74, a0 + Math.PI, a0, true); x.closePath(); x.fill();
      x.strokeStyle = rsCss(gl, 0.9); x.lineWidth = Math.max(px(1.5), rr*0.06); x.beginPath(); x.arc(ax, ccy, rr*0.74, 0, Math.PI*2); x.stroke(); glow(ax, ccy, rr*0.9); }
    else if(kind < 0.86) pkMonolith(x, ax, ay, unit*(0.07 + 0.08*R())*s, pc, 1, R, px);
    else pkCrystals(x, ax, ay, unit*0.018*s, [rsMix(GLOW, AIR, fa*0.5), rsMix([176, 146, 255], AIR, fa*0.5)], pc, 3 + Math.floor(R()*3), R, px); };
  for(let i = 0; i < nL; i++){
    const t = nL > 1 ? i/(nL - 1) : 1, base = hy + (h - hy)*Math.pow(t, 1.15)*0.82, amp = h*(0.03 + 0.2*o.height)*(1 - 0.5*t);
    const fa = Math.pow(1 - t, 1.2)*(0.35 + 0.65*o.haze), col = rsMix(rsMix(Lh, BLACK, 0.1 + 0.42*t), AIR, fa*0.8);
    const lit = rsMix(col, SUN, 0.32*(1 - fa*0.5)), dark = rsMix(col, BLACK, 0.36*(1 - fa*0.7));
    const style = t < 0.3 ? 'peaks' : t > 0.72 ? 'hills' : ['peaks', 'mesas', 'hills'][Math.floor(R()*3)];
    // THE RIDGE'S LINE, across the page and past it: a few great mountains (each a peak with its shoulders), flat-topped
    // mesas, or rolling hills
    const pts = [];
    if(style === 'peaks'){ let xx = -w*rnd(0.05, 0.2);
      while(xx < w*1.05){ const hw = w*rnd(0.12, 0.26)*(1 + 0.4*t), H = amp*rnd(0.55, 1), X = xx + hw, sk = rnd(-0.15, 0.15);
        for(const [u, v] of [[-1, 0.04], [-0.62, rnd(0.25, 0.45)], [-0.3 + sk, rnd(0.6, 0.78)], [sk, 1], [0.25 + sk, rnd(0.66, 0.84)], [0.6, rnd(0.3, 0.5)]]) pts.push([X + u*hw, base - H*v, v === 1 ? 1 : 0]);
        xx += hw*1.6; }
      pts.push([xx + w*0.1, base - amp*0.05, 0]); }
    else if(style === 'mesas'){ let xx = -w*rnd(0, 0.1);
      while(xx < w*1.05){ const mw = w*rnd(0.1, 0.3), top = base - amp*rnd(0.4, 1.05), side = mw*rnd(0.1, 0.22);
        pts.push([xx, base - amp*0.06*R(), 0], [xx + side, top, 2], [xx + mw - side, top + amp*(R() - 0.5)*0.08, 2], [xx + mw, base - amp*0.08*R(), 0]); xx += mw + w*rnd(0.03, 0.12); } }
    else { const f = [rnd(2, 4), rnd(5, 9), rnd(11, 17)].map(v => v*Math.PI*2/w), ph = [R(), R(), R()].map(v => v*7), st = w*rnd(0.05, 0.08);
      for(let xx = -st; xx < w + st*2; xx += st*rnd(0.8, 1.2)) pts.push([xx, base - amp*(0.45 + 0.3*Math.sin(xx*f[0] + ph[0]) + 0.17*Math.sin(xx*f[1] + ph[1]) + 0.08*Math.sin(xx*f[2] + ph[2])), 3]); }
    const cand = [], sil = [...pts.map(p => [p[0], p[1]]), [pts[pts.length - 1][0], h + 2], [pts[0][0], h + 2]];
    rsPoly(x, sil, rsCss(col)); rsPoly(mk, sil, '#fff'); const g = Math.round(255*(1 - t)); rsPoly(dk, sil, `rgb(${g},${g},${g})`);
    // ITS FACETS, each shaded by how it faces the light: two down from each stretch of the line and one below them
    // (crisp on mountains, soft on hills); snow on the far tall peaks; a mesa's cliffs, its lit top and its strata
    if(style !== 'mesas'){ const rough = style === 'peaks' ? 1 : 0.45, foot = base + (h - base)*0.14;
      for(let k = 0; k < pts.length - 1; k++){ const p0 = pts[k], p1 = pts[k + 1], q0 = [p0[0] + (p1[0] - p0[0])*(R() - 0.5)*0.3, p0[1] + (base - p0[1])*rnd(0.45, 0.7) + amp*0.1], q1 = [p1[0], p1[1] + (base - p1[1])*rnd(0.45, 0.7) + amp*0.1];
        const face = rsFace(dark, lit, p1[1] - p0[1], p0[0] - p1[0], L);
        rsPoly(x, [p0, p1, q0], rsCss(jit(face, 0.05*rough + 0.02))); rsPoly(x, [p1, q1, q0], rsCss(jit(rsMix(face, dark, 0.22*rough), 0.04)));
        rsPoly(x, [q0, q1, [(q0[0] + q1[0])/2, foot]], rsCss(jit(rsMix(rsMix(face, col, 0.55), dark, 0.12), 0.04)));
        if(style === 'peaks' ? p1[2] === 1 || (k % 6 === 2 && t > 0.2) : k % 3 === 1) cand.push([p1[0], p1[1]]); }
      if(style === 'peaks' && t < 0.45 && o.height > 0.25) for(let k = 1; k < pts.length - 1; k++){ if(pts[k][2] !== 1 || base - pts[k][1] < amp*0.7) continue;
        const pk = pts[k], pl = pts[k - 1], pr = pts[k + 1], f = rnd(0.3, 0.5), lf = [pk[0] + (pl[0] - pk[0])*f, pk[1] + (pl[1] - pk[1])*f], rf = [pk[0] + (pr[0] - pk[0])*f, pk[1] + (pr[1] - pk[1])*f], c = [pk[0] + (R() - 0.5)*(pr[0] - pl[0])*0.06, pk[1] + (base - pk[1])*f*0.5];
        const sl = rsMix([250, 251, 255], AIR, fa*0.4), sd2 = rsMix(rsMix([176, 188, 216], HZ, 0.3), AIR, fa*0.4);
        rsPoly(x, [pk, lf, [lf[0] + (c[0] - lf[0])*0.4, lf[1] + (base - lf[1])*0.08], c], rsCss(rsFace(sd2, sl, pk[1] - pl[1], pl[0] - pk[0], L)));
        rsPoly(x, [pk, c, [rf[0] + (c[0] - rf[0])*0.4, rf[1] + (base - rf[1])*0.1], rf], rsCss(rsFace(sd2, sl, pr[1] - pk[1], pk[0] - pr[0], L))); } }
    else for(let k = 0; k + 3 < pts.length; k += 4){ const [a, b, c, d] = pts.slice(k, k + 4), dep = (base - b[1])*0.8, front = rsMix(col, L[1] < 0 ? lit : dark, 0.2);
      // its cliff in a few upright facets, its two sides shaded by the light, a lit rim along its top, a band of strata
      const nf = 2 + Math.floor(R()*3), xs = Array.from({ length: nf + 1 }, (_, q) => b[0] + (c[0] - b[0])*(q/nf + (q && q < nf ? (R() - 0.5)*0.3/nf : 0)));
      for(let q = 0; q < nf; q++){ const y0 = b[1] + (c[1] - b[1])*(xs[q] - b[0])/(c[0] - b[0] || 1), y1 = b[1] + (c[1] - b[1])*(xs[q + 1] - b[0])/(c[0] - b[0] || 1);
        rsPoly(x, [[xs[q], y0], [xs[q + 1], y1], [xs[q + 1] + (R() - 0.5)*dep*0.1, y1 + dep], [xs[q], y0 + dep]], rsCss(jit(front, 0.06))); }
      rsPoly(x, [a, b, [b[0], b[1] + dep], [a[0] - dep*0.2, a[1] + dep*0.3]], rsCss(jit(rsFace(dark, lit, b[1] - a[1], a[0] - b[0], L))));
      rsPoly(x, [c, d, [d[0] + dep*0.2, d[1] + dep*0.3], [c[0], c[1] + dep]], rsCss(jit(rsFace(dark, lit, d[1] - c[1], c[0] - d[0], L))));
      rsPoly(x, [b, c, [c[0], c[1] + dep*0.06], [b[0], b[1] + dep*0.06]], rsCss(rsMix(lit, SUN, 0.25*(1 - fa))));
      const sy = b[1] + dep*rnd(0.3, 0.5); x.fillStyle = rsCss(rsMix(front, dark, 0.35)); x.fillRect(b[0], sy, c[0] - b[0], Math.max(px(1), dep*0.05));
      if(R() < 0.4 && c[0] - b[0] > w*0.08){ const tw = (c[0] - b[0])*rnd(0.3, 0.5), tx = b[0] + (c[0] - b[0] - tw)*R(), th = dep*rnd(0.2, 0.4), ty = b[1] + (c[1] - b[1])*(tx - b[0])/(c[0] - b[0]);
        rsPoly(x, [[tx, ty], [tx + tw*0.12, ty - th], [tx + tw*0.88, ty - th], [tx + tw, ty]], rsCss(jit(front, 0.05))); rsPoly(x, [[tx + tw*0.12, ty - th], [tx + tw*0.88, ty - th], [tx + tw*0.88, ty - th + dep*0.05], [tx + tw*0.12, ty - th + dep*0.05]], rsCss(rsMix(lit, SUN, 0.25*(1 - fa))));
        cand.push([tx + tw/2, ty - th]); }
      else cand.push([(b[0] + c[0])/2, (b[1] + c[1])/2]); }
    // the builders' shapes, a few, on the middle and far ridges, nearer ones larger
    if(t > 0.12 && t < 0.85){ const nS = Math.round(o.structures*2.6*rnd(0.4, 1.6));
      for(let k = 0; k < nS && cand.length; k++){ const [ax, ay] = cand.splice(Math.floor(R()*cand.length), 1)[0]; if(ax > w*0.04 && ax < w*0.96) structure(ax, ay + unit*0.004, rnd(0.7, 1.3)*(0.5 + 0.7*t), fa); } }
    // TREES in clumps on the nearer hills, some on the skyline, the rest down the slope
    if(t >= 0.4 && o.foliage > 0){ const clumps = Math.round(o.foliage*7*(0.5 + R())*(0.6 + t));
      const yAt = X => { for(let k = 0; k < pts.length - 1; k++) if(pts[k][0] <= X && pts[k + 1][0] > X){ const u = (X - pts[k][0])/(pts[k + 1][0] - pts[k][0]); return pts[k][1] + (pts[k + 1][1] - pts[k][1])*u; } return base; };
      for(let c = 0; c < clumps; c++){ const X0 = R()*w, kind = R(), n = 2 + Math.floor(R()*6*o.foliage + R()*3), down = R() < 0.35 ? 0 : amp*rnd(0.1, 0.5);
        const trees = Array.from({ length: n }, () => { const X = X0 + (R() - 0.5)*w*0.08*(0.5 + t); return [X, yAt(X) + down + R()*amp*0.15, unit*rnd(0.03, 0.065)*(0.35 + 0.9*t), kind < 0.85 ? kind : R()]; }).sort((a, b) => a[1] - b[1]);
        for(const [X, Y, sz, k] of trees) tree(X, Y, sz, fa, k); } }
  }
  // AT YOUR FEET: a tree or two framing the page at one side, nearest and darkest, and grass in tufts along the near hill
  if(o.foliage > 0.15){ const side = R() < 0.5 ? -1 : 1, X0 = side < 0 ? w*rnd(-0.04, 0.08) : w*rnd(0.92, 1.04), n = 2 + Math.floor(R()*3*o.foliage), kind = R() < 0.7 ? R()*0.45 : rnd(0.76, 1);
    for(let k = 0; k < n; k++) tree(X0 + side*k*w*rnd(0.03, 0.07), h*rnd(1, 1.05), unit*rnd(0.2, 0.32)*(0.6 + 0.6*o.foliage)*(1 - 0.15*k), -0.25, kind); }
  const gr = rsMix(GREEN, BLACK, 0.25), grl = rsMix(GREEN, SUN, 0.2);
  for(let k = 0; k < Math.round(30*o.foliage + 6); k++){ const X = R()*w, Y = h*rnd(0.9, 1.0), sz = unit*rnd(0.01, 0.025);
    for(let b = -2; b <= 2; b++) rsPoly(x, [[X + b*sz*0.25, Y], [X + b*sz*0.5 + (R() - 0.5)*sz*0.4, Y - sz*rnd(0.7, 1.4)], [X + b*sz*0.25 + sz*0.15, Y]], rsCss(b*L[0] > 0 ? grl : gr)); }
}
export const WHIMSY_STEPS = {
  // Silk Ribbons and Dream Bloom, each one part (kitWhole: drawn as it always was, under the texture's own seed + Variant)
  ribbons: kitWhole({ cat: 'Marks', label: 'Silk Ribbons', ins: ['blend from', 'curtain hue', 'hem hue'], outs: ['ribbons'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [WHIM_R('zoom', 'Curtain Height', 100, 40, 220), WHIM_R('amount', 'Ribbon Count', 100, 20, 1800), WHIM_R('form', 'Bloom', 0), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 6 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 0);
      return () => genAuroraVeil(w, h, a, z, light, t1, t2, f); }),
  bokeh: kitWhole({ cat: 'Marks', label: 'Dream Bloom', ins: ['light hue'], outs: ['bloom'], io: { ins: ['colour'], outs: ['image'] },
    params: [WHIM_R('zoom', 'Focal Plane', 100, 25, 400), WHIM_R('amount', 'Orb Count', 100, 20, 260), WHIM_R('form', 'Aperture', 0), WHIM_R('object', 'Object Shape', 0), WHIM_R('spread', 'Color Variation', 0, 0, 180), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 6 },
    (E, n, w, h) => { const t1 = wholeHex(E, n, 1), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 0), o = E.num(n, 'object', 0), sp = E.num(n, 'spread', 0);
      return () => genBokeh(w, h, a, z, f, o, sp, t1); }),
  // Feathers (Ruby: "procedurally generated feathers in the background"), on a transparent ground, under the texture's
  // own seed + Variant
  feathers: kitWhole({ cat: 'Marks', label: 'Feathers', ins: ['light from', 'feather hue', 'tip hue', 'sheen hue', 'second sheen hue', 'pale hue', 'dark hue'], outs: ['feathers'],
    io: { ins: ['value', 'colour', 'colour', 'colour', 'colour', 'colour', 'colour'], outs: ['image'] },
    params: [WHIM_R('bird', 'Bird: Plain · Crow · Raven · Magpie · Blue Jay', 0), WHIM_R('size', 'Feather Size', 100, 40, 250), WHIM_R('count', 'Feathers', 30), WHIM_R('fluff', 'Fluff', 15),
      WHIM_R('curl', 'Curl', 30), WHIM_R('splits', 'Splits', 30), WHIM_R('marks', 'Markings', 0), WHIM_R('sheen', 'Sheen', 15), WHIM_R('depth', 'Depth', 50), WHIM_R('lift', 'Lift', 50),
      WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 5 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), v = k => E.num(n, k, 0)/100, kind = FEATHER_BIRDS[Math.min(4, Math.floor(E.num(n, 'bird', 0)/100*5))];
      const o = { kind, size: Math.max(0.4, E.num(n, 'size', 100)/100), count: v('count'), fluff: v('fluff'), curl: v('curl'), splits: v('splits'), marks: v('marks'), sheen: v('sheen'), depth: v('depth'), lift: v('lift'), light,
        hue: wholeHex(E, n, 2), tip: wholeHex(E, n, 3), sheenA: wholeHex(E, n, 4), sheenB: wholeHex(E, n, 5), patch: wholeHex(E, n, 6), dark: wholeHex(E, n, 7) };
      return () => genFeathers(w, h, o); }),
  // Fractal Moon, as a part (drawn as it always was, under the texture's own seed + Variant)
  moon: { cat: 'Textures', label: 'Fractal Moon', ins: [], outs: ['moon'], io: { outs: ['image'] },
    params: [WHIM_R('zoom', 'Moon Size', 100, 60, 150), WHIM_R('amount', 'Fractal Depth', 100, 20, 190), WHIM_R('form', 'Clouds', 30), WHIM_R('night', 'Night Sky', 70), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
      return [withSeed(seed, () => genMoon(w, h, Math.max(0.02, E.num(n, 'amount', 100)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100), E.num(n, 'form', 30)/100, E.num(n, 'night', 70)/100))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  starfield: { cat: 'Marks', label: 'Starfield', ins: ['over', 'color a', 'color b'], outs: ['image'], io: { ins: ['image', 'colour', 'colour'], outs: ['image'] },
    params: [WHIM_R('amount', 'Stars', 100, 20, 300), WHIM_R('atmosphere', 'Atmosphere', 20), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    // Deep Field's stars (texWhimsy genAstralStars): each a soft glow by its brightness, coloured by temperature, the brightest spiked
    paint(E, n){ const { ww: w, wh: h } = E, a = E.input(n, 2), b = E.input(n, 3), seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919 + 977) >>> 0;
      const c = withSeed(seed, () => genAstralStars(w, h, Array.isArray(a) ? whimHex(a) : '#D9C8E8', Array.isArray(b) ? whimHex(b) : '#9FB8E8', E.num(n, 'amount', 100)/100, 1, E.num(n, 'atmosphere', 20)/100, null));
      const [pc, x] = kitPicture(E.input(n, 1) ?? 0, w, h); x.drawImage(c, 0, 0);
      // (Ruby's favorite planet, very rarely among the stars, about one sky in thirty-six: a small Saturn, an Easter egg;
      //  from a stream of its own, so every other sky is as it was. Seen through an atmosphere (an Earth sky, the
      //  aurora's) it is what it would be there, Ruby: "much dimmer and fainter": a faint warm point, its rings a hint)
      const eg = seedChoice(seed, 'starfield saturn'), air = rsSmooth(0.12, 0.3, E.num(n, 'atmosphere', 20)/100);
      if(eg() < 0.04){ const r = Math.min(w, h)*(0.012 + 0.012*eg())*(1 - 0.9*air); paintSaturn(x, w*(0.1 + 0.8*eg()), h*(0.08 + 0.4*eg()), r, { axis: (eg() - 0.5)*0.8, open: (eg() < 0.5 ? -1 : 1)*(0.25 + 0.2*eg()), sun: [eg() - 0.5, -0.5], alpha: 0.85 - 0.65*air }); }
      return [pc]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  curtains: { cat: 'Marks', label: 'Aurora Curtains', ins: ['over', 'field from'], outs: ['image'], io: { ins: ['image', 'value'], outs: ['image'] },
    params: [WHIM_R('curtains', 'Curtains', 2, 1, 5), WHIM_R('rays', 'Rays', 100, 20, 250), WHIM_R('height', 'Height', 100, 40, 180), WHIM_R('red', 'Red Sky', 30),
      WHIM_R('fringe', 'Pink Hem', 50), WHIM_R('glow', 'Brightness', 100, 20, 250), WHIM_R('horizon', 'Horizon', 50), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, dv = E.input(n, 2), deg = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 0), a = (deg - 90)*Math.PI/180;
      const o = { curtains: E.num(n, 'curtains', 2), rays: E.num(n, 'rays', 100)/100, height: E.num(n, 'height', 100)/100, red: E.num(n, 'red', 30)/100,
        fringe: E.num(n, 'fringe', 50)/100, glow: E.num(n, 'glow', 100)/100, lean: Math.cos(a)*0.35, arc: Math.sin(a)*0.5, horizon: E.num(n, 'horizon', 50)/100 };
      const [pc, x] = kitPicture(E.input(n, 1) ?? 0, w, h);
      withSeed(((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919 + 4441) >>> 0, () => whimAurora(x, w, h, o, E.px));
      return [pc]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  flowlines: { cat: 'Marks', label: 'Flow Lines', ins: ['over', 'angle map', 'ink', 'second ink', 'flow from'], outs: ['image'], io: { ins: ['image', 'field', 'colour', 'colour', 'value'], outs: ['image'] },
    params: [WHIM_R('amount', 'Lines', 100, 30, 300), WHIM_R('size', 'Scale', 100, 40, 250), WHIM_R('turbulence', 'Turbulence', 50), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, i1 = E.input(n, 3), i2 = E.input(n, 4), dv = E.input(n, 5), mv = E.input(n, 2);
      const o = { amt: E.num(n, 'amount', 100)/100, zoom: E.num(n, 'size', 100)/100, turb: E.num(n, 'turbulence', 50)/100,
        light: typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 0),
        ink1: Array.isArray(i1) ? whimHex(i1) : '#2B2A3A', ink2: Array.isArray(i2) ? whimHex(i2) : '#7A4A6A' };
      if(mv != null){ const mw = Math.max(8, Math.min(512, w >> 2)), mh = Math.max(8, Math.round(mw*h/w)); o.map = kitField(mv, mw, mh); o.mw = mw; o.mh = mh; }
      // (Shape Aware: round the words the lines flow round them, as water round stones, and end at their margin; in the
      //  letters they run closer, to show in a stroke)
      o.room = wordsRoom(E.ctx, w, h, 0.3, 1.8); o.zoom *= 1 - 0.55*(+E.ctx.fill || 0);
      // the texture's own seed (+ Variant): Flow-Field Ink draws the lines it always drew
      const seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => { const c = whimFlowLines(w, h, o, E.px, E.carea);
        const over = E.input(n, 1); if(over == null) return [c];
        const [pc, px] = kitPicture(over, w, h); px.drawImage(c, 0, 0); return [pc]; }); },
    run(E, n){ const [c] = this.paint(E, n); return [E.readCanvas(c)]; } },
  particles: { cat: 'Marks', label: 'Particles', ins: ['over', 'color a', 'color b', 'wind from'], outs: ['image'], io: { ins: ['image', 'colour', 'colour', 'value'], outs: ['image'] },
    params: [WHIM_SEL('kind', 'Kind', ['flakes', 'sparks', 'motes']), WHIM_R('amount', 'Amount', 100, 10, 500), WHIM_R('size', 'Size', 100, 20, 600), WHIM_R('form', 'Wind · Drift · Chaos', 50), WHIM_R('scatter', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, kind = String(E.P(n, 'kind', 'flakes')), amt = Math.max(0.02, E.num(n, 'amount', 100)/100), zoom = Math.max(0.2, E.num(n, 'size', 100)/100), form = E.num(n, 'form', 50)/100;
      const ca = E.input(n, 2), cb = E.input(n, 3), dv = E.input(n, 4), light = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315);
      // the texture's own seed (+ Scatter), not the part's: so First Snow, Burning Mana and Euphoria Dust fall exactly as they always did
      const seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'scatter', 0))*7919) >>> 0;
      return withSeed(seed, () => { let c;
      if(kind === 'sparks') c = genEmbers(w, h, Array.isArray(ca) ? whimHex(ca) : '#E0526F', Array.isArray(cb) ? whimHex(cb) : '#9B7FE8', amt, zoom, form);
      else if(kind === 'motes') c = genMagicParticles(w, h, Array.isArray(ca) ? whimHex(ca) : '#E0526F', Array.isArray(cb) ? whimHex(cb) : '#9B7FE8', amt, zoom, form);
      else c = genSnow(w, h, amt, zoom, light, form, Array.isArray(ca) ? { r: Math.round(ca[0]*255), g: Math.round(ca[1]*255), b: Math.round(ca[2]*255) } : (E.ctx.base || null));
      const over = E.input(n, 1); if(over == null) return [c];
      const [pc, px] = kitPicture(over, w, h); px.drawImage(c, 0, 0); return [pc]; }); },
    run(E, n){ const [c] = this.paint(E, n); return [E.readCanvas(c)]; } },
  smoke: { cat: 'Noise', label: 'Smoke', ins: [], outs: ['density'], params: [WHIM_R('lift', 'Lift', 100, 40, 250), WHIM_R('drag', 'Drag', 60, 0, 200)], cost: () => 24,
    density(E, n, gw, gh){ return smokeField(gw, gh, E.num(n, 'lift', 100)/100, E.num(n, 'drag', 60)/100); },
    paint(E, n){ const [gw, gh] = whimGrid(E, 6); return [kitFieldCanvas(this.density(E, n, gw, gh), gw, gh)]; },
    run(E, n){ return [this.density(E, n, E.ww, E.wh)]; } },
  shaft: { cat: 'Light & Color', label: 'Light Shaft', ins: ['density', 'dial'], outs: ['image', 'beam'], io: { ins: ['field', 'value'], outs: ['image', 'field'] },
    params: [WHIM_R('dust', 'Dust', 35)], cost: () => 10,
    lit(E, n, gw, gh){ const D = kitField(E.input(n, 1), gw, gh) || new Float32Array(gw*gh);
      return lightShaft(D, gw, gh, E.num(n, 'dust', 35)/100, whimDial(E, E.input(n, 2)), E.ctx.mat || null); },
    paint(E, n){ const [gw, gh] = whimGrid(E, 6), L = this.lit(E, n, gw, gh); return [kitFieldCanvas(L.img, gw, gh), kitFieldCanvas(L.B, gw, gh)]; },
    run(E, n){ const L = this.lit(E, n, E.ww, E.wh); return [L.img, L.B]; } },
  motes: { cat: 'Marks', label: 'Dust Motes', ins: ['picture', 'beam'], outs: ['image'], io: { ins: ['image', 'field'], outs: ['image'] },
    params: [WHIM_R('dust', 'Dust', 35)], cost: () => 3,
    paint(E, n){ const { ww, wh } = E, [c, x] = kitPicture(E.input(n, 1), ww, wh);
      const bv = E.input(n, 2), [gw, gh] = bv && isFinite(bv.width) ? [bv.width, bv.height] : [ww, wh], B = kitField(bv, gw, gh);
      const beam = B ? (px, py) => whimSamp(B, gw, gh, px/ww*gw, py/wh*gh) : null;
      drawMotes(x, ww, wh, E.num(n, 'dust', 35)/100, beam, E.ctx.mat || null, whimPx(E), whimArea(E));
      return [c]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  sky: { cat: 'Textures', label: 'Painted Sky', ins: [], outs: ['image'], io: { outs: ['image'] },
    params: [WHIM_SEL('time', 'Time of Day', LAND_TIMESEL), WHIM_SEL('clouds', 'Clouds', ['seed', 'cumulus', 'stratus', 'cirrus', 'mixed', 'clear']),
      WHIM_R('size', 'Cloud Size', 100, 60, 200), WHIM_R('tilt', 'Tilt', 0), WHIM_R('colour', 'Color', 0)], cost: () => 4,
    paint(E, n){ const [c, x] = kitCanvas(E.ww, E.wh);
      paintSky(x, E.ww, E.wh, landSceneOf(E, n), { colour: E.num(n, 'colour', 0)/100, size: E.num(n, 'size', 100)/100, clouds: String(E.P(n, 'clouds', 'seed')) });
      return [c]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  ridges: { cat: 'Marks', label: 'Painted Ridges', ins: ['sky'], outs: ['image'], io: { ins: ['image'], outs: ['image'] },
    params: [WHIM_SEL('country', 'Country', LAND_COUNTRIES), WHIM_SEL('time', 'Time of Day', LAND_TIMESEL),
      WHIM_R('bands', 'Ridges', 100, 20, 250), WHIM_R('distance', 'Distance', 100, 60, 200), WHIM_R('tilt', 'Tilt', 0), WHIM_R('colour', 'Color', 0)], cost: () => 8,
    paint(E, n){ const S = landSceneOf(E, n), sky = E.input(n, 1), colour = E.num(n, 'colour', 0)/100;
      let c, x;
      if(sky == null){ [c, x] = kitCanvas(E.ww, E.wh); paintSky(x, E.ww, E.wh, S, { colour, clouds: 'clear' }); }      // no sky wired: its plain wash
      else [c, x] = kitPicture(sky, E.ww, E.wh, E.ww, E.wh);
      paintRidges(x, E.ww, E.wh, S, { amt: E.num(n, 'bands', 100)/100, zoom: E.num(n, 'distance', 100)/100, colour });
      return [c]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  ringsky: { cat: 'Textures', label: 'Ring in the Sky', ins: ['over', 'light from', 'land hue', 'sky hue'], outs: ['picture', 'ring'], io: { ins: ['image', 'value', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [WHIM_R('width', 'Ring Width', 45), WHIM_R('tilt', 'Ring Open', 72, 2, 90), WHIM_R('turn', 'Turn', 8, 0, 360), WHIM_R('size', 'Ring Size', 100, 40, 250), WHIM_R('centre', 'Star Height', 38, 10, 90),
      WHIM_R('haze', 'Air', 60), WHIM_R('nebula', 'Nebula', 50), WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 4,
    paint(E, n){ const { ww: w, wh: h } = E, [c, x] = kitPicture(E.input(n, 1) ?? 0, w, h), [mc, mk] = kitCanvas(w, h), dv = E.input(n, 2), lh = E.input(n, 3), sh = E.input(n, 4);
      mk.fillStyle = '#000'; mk.fillRect(0, 0, w, h);
      const rgb = (v, d) => Array.isArray(v) ? v.slice(0, 3).map(q => q*255) : d;
      paintRingSky(x, mk, w, h, { width: E.num(n, 'width', 45)/100, tilt: E.num(n, 'tilt', 72), turn: E.num(n, 'turn', 8), size: E.num(n, 'size', 100)/100, centre: E.num(n, 'centre', 38)/100,
        haze: E.num(n, 'haze', 60)/100, nebula: E.num(n, 'nebula', 50)/100, light: typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315), land: rgb(lh, [111, 143, 85]), sky: rgb(sh, [134, 174, 220]), px: E.px,
        rnd: mulberry32((((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) ^ 0x51A9E) >>> 0) });
      return [c, mc]; },
    run(E, n){ const [c, m] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m))]; } },
  shapeland: { cat: 'Marks', label: 'Land of Shapes', ins: ['over', 'light from', 'land hue', 'haze hue'], outs: ['picture', 'land', 'distance'], io: { ins: ['image', 'value', 'colour', 'colour'], outs: ['image', 'field', 'field'] },
    params: [WHIM_R('height', 'Landforms', 50), WHIM_R('layers', 'Ridges', 50), WHIM_R('structures', 'Structures', 40), WHIM_R('foliage', 'Trees', 40), WHIM_R('haze', 'Haze', 60), WHIM_R('horizon', 'Horizon', 66, 30, 90),
      WHIM_R('variant', 'Variation', 0, 0, 99)], cost: () => 4,
    paint(E, n){ const { ww: w, wh: h } = E, [c, x] = kitPicture(E.input(n, 1) ?? 0, w, h), [mc, mk] = kitCanvas(w, h), [dc, dk] = kitCanvas(w, h), dv = E.input(n, 2), lh = E.input(n, 3), hh = E.input(n, 4);
      mk.fillStyle = '#000'; mk.fillRect(0, 0, w, h); dk.fillStyle = '#fff'; dk.fillRect(0, 0, w, h);
      const rgb = (v, d) => Array.isArray(v) ? v.slice(0, 3).map(q => q*255) : d;
      paintShapeLand(x, mk, dk, w, h, { height: E.num(n, 'height', 50)/100, layers: E.num(n, 'layers', 50)/100, structures: E.num(n, 'structures', 40)/100, foliage: E.num(n, 'foliage', 40)/100,
        haze: E.num(n, 'haze', 60)/100, horizon: E.num(n, 'horizon', 66)/100, light: typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315), land: rgb(lh, [111, 143, 85]), haze3: rgb(hh, [134, 174, 220]), px: E.px,
        rnd: mulberry32((((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) ^ 0x1A4D5) >>> 0) });
      return [c, mc, dc]; },
    run(E, n){ const [c, m, d] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m)), E.asField(E.readCanvas(d))]; } },
  wash: { cat: 'Shape', label: 'Watercolor Bleed', ins: ['picture'], outs: ['image'], io: { ins: ['image'], outs: ['image'] },
    params: [WHIM_R('wet', 'Wetness', 50)], cost: () => 2,
    paint(E, n){ const [c, x] = kitPicture(E.input(n, 1), E.ww, E.wh, E.ww, E.wh); paintWash(x, c, E.ww, E.wh, E.num(n, 'wet', 50)/100); return [c]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
};
