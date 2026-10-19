/**
 * stepsFlora.js — BLOOM, the floral surfaces' one process part (ROADMAP §2 L4; prior art docs/prior-art/florals.md §1–2):
 * one flower of a real species, or a sheet of them, drawn as a botanist draws: its petals laid out as the species lays
 * them (a ring of rays round a disc, a few broad petals in whorls, a double's spiral by the golden angle, bells along a
 * spike, a ball of florets, an umbel of lace), each petal a curved surface — cupped, flat, or curled back — seen from
 * the face, three-quarters or the side, lit from the dial, and drawn back to front. Its stage runs from a bud, through
 * the open flower, to petals drooping and browning at their edges, the outer ones fallen, to a bare seed head.
 *
 * Outputs, for general parts to light, scatter, blur and colour:
 *   picture    the flower(s) in their hues, on black
 *   mask       where they are (white), to cut them out (Scatter's Cut Out, Blend's mask)
 *   height     how far toward you each point stands (cupped rims high, a disc domed), for the Light Engine
 *   thickness  thin petals, thick disc and stem: the Light Engine's translucency
 *   centre     the disc, the stamens, the eye
 *   petals     a grey for each petal, to tint or drop some
 * A sheet (Sheet setting) draws 4, 8 or 16 different flowers in cells, so Scatter (its Picture Is: a sheet) throws a
 * field that is never clones. Part draws one petal or one leaf instead, for scattered petals and fallen leaves.
 */
import { mulberry32, CPU } from './texCore.js';

const FL_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const flClamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const flHex = h => { const n = parseInt(String(h || '#808080').replace('#', '').slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const flMix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const flCss = (c, k = 1, a = 1) => `rgba(${Math.round(flClamp(c[0]*k, 0, 255))},${Math.round(flClamp(c[1]*k, 0, 255))},${Math.round(flClamp(c[2]*k, 0, 255))},${a})`;

/**
 * THE SPECIES (florals.md §2), in the Species slider's order, neighbours alike. type: how its petals are laid out;
 * n: petal count range; shape: the petal's outline; tip; cup: how far the petals rise (degrees); len: petal length
 * (of the head's radius); wid: petal width; disc: the centre; cols: petal, tip, centre, foliage (the defaults, when a
 * hue is not wired).
 */
export const FLORA_SPECIES = [
  ['daisy',      { type: 'ray',    n: [15, 35], shape: 'oblong', tip: 'notch', cup: 4,  len: 1,    wid: 0.13, disc: ['flat', 0.3],     cols: ['#F7F5EE', '#F2EEE6', '#E8B21C', '#5E7F3A'] }],
  ['chamomile',  { type: 'ray',    n: [10, 20], shape: 'oblong', tip: 'notch', cup: -12, len: 0.9, wid: 0.16, disc: ['cone', 0.34],    cols: ['#FBFAF4', '#F2F0E6', '#F0C02A', '#6E8F48'] }],
  ['cosmos',     { type: 'ray',    n: [8, 8],   shape: 'wedge',  tip: 'teeth', cup: 8,  len: 1,    wid: 0.42, disc: ['flat', 0.2],     cols: ['#E25A9A', '#F4C0DA', '#E8B21C', '#5E8A3E'] }],
  ['sunflower',  { type: 'ray',    n: [17, 30], shape: 'point',  tip: 'point', cup: 10, len: 0.62, wid: 0.2,  disc: ['vogel', 0.46],   cols: ['#F2B31B', '#E89A12', '#4A2A14', '#4E7A2E'] }],
  ['zinnia',     { type: 'tiers',  n: [12, 18], shape: 'round',  tip: 'notch', cup: 12, len: 0.85, wid: 0.32, disc: ['vogel', 0.18],   cols: ['#F05A28', '#E83F7A', '#C89A22', '#4F7A3A'] }],
  ['cornflower', { type: 'ray',    n: [9, 14],  shape: 'wedge',  tip: 'teeth', cup: 20, len: 0.8,  wid: 0.38, disc: ['tufts', 0.3],    cols: ['#3A5FD0', '#5A80F0', '#22307A', '#6A8A6A'] }],
  ['poppy',      { type: 'cup',    n: [4, 4],   shape: 'round',  tip: 'round', cup: 30, len: 1,    wid: 1.05, disc: ['crown', 0.24],   cols: ['#D7261E', '#C21C16', '#1A1414', '#6A8A4A'] }],
  ['anemone',    { type: 'cup',    n: [5, 8],   shape: 'round',  tip: 'round', cup: 14, len: 1,    wid: 0.72, disc: ['crown', 0.3],    cols: ['#C8102E', '#B01028', '#16121C', '#4E6E3A'] }],
  ['buttercup',  { type: 'cup',    n: [5, 5],   shape: 'round',  tip: 'round', cup: 34, len: 1,    wid: 0.82, disc: ['boss', 0.22],    cols: ['#F7D21E', '#FFE24A', '#C89A12', '#4E7A2E'], gloss: 1 }],
  ['rose',       { type: 'double', n: [26, 40], shape: 'round',  tip: 'round', cup: 40, len: 1,    wid: 0.7,  disc: ['none', 0],       cols: ['#B3123A', '#D8405E', '#6A0A20', '#3E5E2A'] }],
  ['peony',      { type: 'double', n: [40, 60], shape: 'round',  tip: 'teeth', cup: 30, len: 1,    wid: 0.6,  disc: ['none', 0],       cols: ['#F3C6CF', '#FBE2E6', '#C2264B', '#4E6E3A'] }],
  ['tulip',      { type: 'cup',    n: [6, 6],   shape: 'oval',   tip: 'round', cup: 68, len: 1.1,  wid: 0.62, disc: ['none', 0],       cols: ['#D9332B', '#F2C230', '#2A1A12', '#5E8A6A'], gloss: 0.7 }],
  ['lily',       { type: 'cup',    n: [6, 6],   shape: 'point',  tip: 'point', cup: 22, len: 1.15, wid: 0.36, disc: ['stamens', 0.9], cols: ['#E8742A', '#F6B26A', '#5A2A12', '#4E7A3A'], curl: -40, spots: 1 }],
  ['iris',       { type: 'iris',   n: [3, 3],   shape: 'oval',   tip: 'round', cup: 60, len: 1.1,  wid: 0.6,  disc: ['beard', 0.3],    cols: ['#5B3C9C', '#7E5CC4', '#F2C230', '#5E7E6A'] }],
  ['cherry',     { type: 'cup',    n: [5, 5],   shape: 'round',  tip: 'notch', cup: 16, len: 1,    wid: 0.82, disc: ['stamens', 0.35], cols: ['#F6D3DC', '#FFF7F8', '#C24A6A', '#7A5A3A'] }],
  ['forgetmenot',{ type: 'cup',    n: [5, 5],   shape: 'round',  tip: 'round', cup: 6,  len: 1,    wid: 0.86, disc: ['eye', 0.3],      cols: ['#7FB2E5', '#A2CCF2', '#F3D24A', '#5E8A4A'] }],
  ['violet',     { type: 'violet', n: [5, 5],   shape: 'round',  tip: 'round', cup: 10, len: 1,    wid: 0.7,  disc: ['eye', 0.16],     cols: ['#5C2E91', '#7A4AB4', '#F2E25A', '#4E7A3A'] }],
  ['bluebell',   { type: 'spike',  n: [4, 8],  shape: 'bell',   tip: 'round', cup: 0,  len: 1,    wid: 1,    disc: ['none', 0],       cols: ['#4B4FB8', '#6A6ED8', '#F0E6C0', '#4E7A4A'], spike: 'bells', arch: 1 }],
  ['foxglove',   { type: 'spike',  n: [8, 18],  shape: 'bell',   tip: 'round', cup: 0,  len: 1,    wid: 1,    disc: ['none', 0],       cols: ['#B04F9B', '#D07CC0', '#5A1E4A', '#4E6E3A'], spike: 'bells', spots: 1 }],
  ['lavender',   { type: 'spike',  n: [6, 10],  shape: 'bud',    tip: 'round', cup: 0,  len: 1,    wid: 1,    disc: ['none', 0],       cols: ['#8C7BC4', '#A898D8', '#5A4A8A', '#8FA08A'], spike: 'whorls' }],
  ['clover',     { type: 'ball',   n: [40, 60], shape: 'bud',    tip: 'round', cup: 0,  len: 1,    wid: 1,    disc: ['none', 0],       cols: ['#C25A8E', '#F0C8DA', '#7A2A4A', '#4E7A3A'], ball: 'pea' }],
  ['queenannes', { type: 'umbel',  n: [10, 18], shape: 'bud',    tip: 'round', cup: 0,  len: 1,    wid: 1,    disc: ['dot', 0.05],     cols: ['#F5F3EC', '#FFFFFF', '#4A1F3D', '#6A8A5A'] }],
  ['hydrangea',  { type: 'ball',   n: [40, 70], shape: 'round',  tip: 'round', cup: 0,  len: 1,    wid: 1,    disc: ['none', 0],       cols: ['#7E9BD6', '#E79BB8', '#4A5AA0', '#4E7A4A'], ball: 'florets' }],
];
const FLORA_KEYS = FLORA_SPECIES.map(s => s[0]);
const FLORA = Object.fromEntries(FLORA_SPECIES);
/** The "mixed" stop: a habitat's species (florals.md §8). */
const FLORA_HABITATS = [['daisy', 'poppy', 'cornflower', 'buttercup', 'clover', 'queenannes', 'chamomile'], ['bluebell', 'foxglove', 'violet', 'anemone'], ['rose', 'peony', 'lavender', 'foxglove'], ['tulip', 'cherry', 'forgetmenot']];
export const FLORA_SPECIES_LABEL = 'Species: ' + ['Daisy', 'Chamomile', 'Cosmos', 'Sunflower', 'Zinnia', 'Cornflower', 'Poppy', 'Anemone', 'Buttercup', 'Rose', 'Peony', 'Tulip', 'Lily', 'Iris', 'Cherry', 'Forget-me-not', 'Violet', 'Bluebell', 'Foxglove', 'Lavender', 'Clover', 'Queen Anne’s Lace', 'Hydrangea', 'Mixed (seeded)'].join(' · ');

/** A petal's half-width at s (0 at its base, 1 at its tip), by its outline. */
function flWidth(shape, s){
  switch(shape){
    case 'oblong': return Math.min(1, s*4)*Math.pow(Math.max(0, 1 - Math.pow(s, 6)), 0.5);
    case 'wedge': return Math.min(1, 0.25 + s*0.95)*Math.pow(Math.max(0, 1 - Math.pow(s, 10)), 0.3);
    case 'point': return Math.sin(Math.PI*Math.min(1, s*0.85 + 0.0))*Math.pow(1 - s, 0.35);
    case 'oval': return Math.pow(Math.sin(Math.PI*s), 0.7);
    case 'bud': return Math.pow(Math.sin(Math.PI*s), 0.8);
    default: return Math.pow(Math.sin(Math.PI*Math.min(1, s*0.92 + 0.04)), 0.55)*(s < 0.15 ? 0.4 + s*4 : 1);   // round
  }
}

/**
 * One flower drawn on the layers L (picture, mask, height, thickness, centre, petals: 2d contexts), centred at (cx, cy),
 * its head's radius R px. f: { sp, view (0 face … 1 side), stage, spin, turn, jitter, flat, light: [lx, ly, lz] toward
 * the light, cols: [petal, tip, centre, foliage] rgb, stem }
 */
function flDrawBloom(L, R, cx, cy, Rad, f){
  const S = f.sp, rnd = (a, b) => a + R()*(b - a);
  const alpha = (f.flat ? 0 : f.view)*Math.PI/2*0.95, ca = Math.cos(alpha), sa = Math.sin(alpha), tc = Math.cos(f.turn), ts = Math.sin(f.turn);
  // a point of the flower (x, y in its plane, z toward its face) on the page, and how near you
  const P = (x, y, z) => { const Y = y*ca - z*sa, Dz = y*sa + z*ca; return [cx + (x*tc - Y*ts)*Rad, cy + (x*ts + Y*tc)*Rad, Dz]; };
  const [lx, ly, lz] = f.albedo ? [0, 0, 0.75] : f.light, [Lx, Ly, Lz] = f.light, st = f.stage;
  // (ALBEDO (Lit By: the Light Engine): the colours with no light in them, the light the engine's, from the maps:
  //  docs/prior-art/florals.md §8c. Drawn (the default): lit here, as it always was)
  const [cP, cT, cC, cF] = f.cols;
  // the stage: a bud closes (petals short, upright), the open flower, then drooping, browning, the outer petals fallen
  const open = st < 0.25 ? st/0.25 : 1, past = flClamp((st - 0.6)/0.35), bare = st > 0.96;
  const brown = flMix(cC, [70, 48, 30], 0.55);
  // ---- the stem and its leaves, below the head (not from the face: hidden)
  if(f.stem && alpha > 0.35){ const sx0 = cx, sy0 = cy + Rad*0.25*sa, len = Rad*(2.2 + R()*1.8)*sa, bend = rnd(-0.4, 0.4)*Rad;
    const sx1 = cx + bend*1.4 + Math.sin(f.turn)*len*0.3, sy1 = sy0 + len, droop = past*Rad*0.8;
    for(const [ctx, col] of [[L.pic, flCss(cF, 0.8)], [L.mask, '#fff'], [L.thick, 'rgb(200,200,200)'], [L.height, 'rgb(90,90,90)'], [L.gloss, 'rgb(80,80,80)'], [L.face, 'rgb(190,190,190)']]){
      ctx.strokeStyle = col; ctx.lineWidth = Rad*0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx0, sy0 - droop*0.2); ctx.quadraticCurveTo(cx + bend, sy0 + len*0.5, sx1, sy1); ctx.stroke(); }
    for(let k = 0, n = 1 + Math.floor(R()*3); k < n; k++){ const t = 0.35 + R()*0.5, x = sx0 + (sx1 - sx0)*t + bend*0.5*(1 - Math.abs(t - 0.5)*2), y = sy0 + len*t, side = R() < 0.5 ? -1 : 1;
      flLeaf(L, x, y, Rad*rnd(0.7, 1.3), (side < 0 ? Math.PI : 0) + rnd(-0.6, -0.2)*side, cF, R, past); } }
  // ---- the petals, as surfaces: a centre line out from the base, its width each side; cupped (rising), curled at the tip
  const petals = [];
  const addPetal = (theta, len, wid, cup, curl, colK, zBase = 0, rBase = 0, id = 0) => {
    const pts = [], hs = [], N = Math.min(44, 14 + Math.round(Rad/14)), cupR = cup*Math.PI/180, curlR = curl*Math.PI/180;   // (more points along a petal the larger it is drawn: no facets close up)
    // (a wilting petal crumples: its edge waves along its length, more as it ages; a little anyway, with Jitter)
    const crK = past*0.32 + f.jitter*0.05, crF = 2 + R()*3, crP = R()*6.283, crF2 = 5 + R()*4, crP2 = R()*6.283;
    const crumple = (s, side) => 1 + crK*(Math.sin(s*crF*Math.PI + crP + side)*0.7 + Math.sin(s*crF2*Math.PI + crP2 - side)*0.3)*Math.sin(Math.PI*Math.min(1, s*1.15));
    const lateral = [-Math.sin(theta), Math.cos(theta)];
    const ctr = s => { const a = cupR + curlR*s*s, r = rBase + len*s*Math.cos(a)*0.98, z = zBase + len*s*Math.sin(a); return [Math.cos(theta)*r, Math.sin(theta)*r, z]; };
    for(let side = -1; side <= 1; side += 2) for(let k = 0; k <= N; k++){ const s = side < 0 ? k/N : 1 - k/N, c = ctr(s);
      let w = flWidth(S.shape, s)*wid*len*0.5*(1 + f.jitter*(R() - 0.5)*0.15)*crumple(s, side);
      // the tip: notched, toothed, pointed or round
      if(S.tip === 'notch' && s > 0.9) w *= 1;
      const cupAcross = Math.sin(cupR)*0.18*w;   // (a petal cups across its width too)
      pts.push(P(c[0] + lateral[0]*w*side, c[1] + lateral[1]*w*side, c[2] + cupAcross)); }
    // (a notch or teeth cut into the tip)
    if(S.tip === 'notch' || S.tip === 'teeth'){ const tip = ctr(1), back = ctr(S.tip === 'notch' ? 0.9 : 0.94), n = S.tip === 'notch' ? 1 : 3;
      const at = Math.floor(pts.length/2), ins = [];
      for(let k = 1; k <= n*2 - 1; k++){ const u = k/(n*2) - 0.5, w = flWidth(S.shape, 0.97)*wid*len*0.5*u*2, q = k % 2 ? back : tip; ins.push(P(q[0] + lateral[0]*w, q[1] + lateral[1]*w, q[2])); }
      pts.splice(at, 0, ...ins); }
    const base = P(...ctr(0)), tipP = P(...ctr(1)), mid = ctr(0.6);
    // its normal (cup and curl), for the light
    const a = cupR + curlR*0.36, nx = -Math.cos(theta)*Math.sin(a), ny = -Math.sin(theta)*Math.sin(a), nz = Math.cos(a);
    const NY = ny*ca - nz*sa, NZ = ny*sa + nz*ca, NX = nx*tc - NY*ts, NYs = nx*ts + NY*tc;
    const lam = NX*lx + NYs*ly + NZ*lz, depth = pts.reduce((t, p) => t + p[2], 0)/pts.length;
    // (FACING: how squarely each part of it faces the dial's light, from its true normals — at its base, at its tip,
    //  and turned across its width by its cup — wrapped a little round the terminator; the object-scale light a
    //  height map is too shallow to give: docs/prior-art/lit-maps.md)
    const nAt = (s, side) => { const a2 = cupR + curlR*s*s; let ux = -Math.cos(theta)*Math.sin(a2), uy = -Math.sin(theta)*Math.sin(a2), uz = Math.cos(a2);
      if(side){ const b = -side*Math.min(0.9, Math.abs(cupR)*0.8 + 0.12), cb = Math.cos(b), sb = Math.sin(b); ux = ux*cb + lateral[0]*sb; uy = uy*cb + lateral[1]*sb; uz = uz*cb; }
      const qY = uy*ca - uz*sa, qZ = uy*sa + uz*ca, qX = ux*tc - qY*ts, qYs = ux*ts + qY*tc; return flClamp((qX*Lx + qYs*Ly + qZ*Lz + 0.3)/1.3); };
    const mi = Math.round(N*0.55);
    petals.push({ pts, base, tipP, depth, lam, colK, id, back: NZ < 0, zTop: Math.max(...pts.map(p => p[2])),
      face: [nAt(0.12, 0), nAt(0.9, 0), nAt(0.55, -1), nAt(0.55, 0), nAt(0.55, 1)], edgeL: pts[mi], edgeR: pts[2*N + 1 - mi] }); };
  const n = Math.round(S.n[0] + (S.n[1] - S.n[0])*R()), spin = f.spin;
  const dropped = st > 0.75 ? Math.floor((st - 0.75)/0.25*n*0.6) : 0;
  const cupNow = (c) => c*(0.25 + 0.75*open) + (1 - open)*70 - past*60, curlNow = (S.curl || 0) - past*70;
  const lenK = 0.35 + 0.65*open - past*0.12;
  if(!bare){
    if(S.type === 'ray' || S.type === 'tiers'){
      const tiers = S.type === 'tiers' ? 3 : 1;
      for(let t = 0; t < tiers; t++) for(let i = 0; i < n; i++){ if(t === 0 && i < dropped) continue;
        const th = spin + (i + t*0.5)/n*Math.PI*2 + f.jitter*(R() - 0.5)*0.25, ln = S.len*(1 - t*0.22)*lenK*(1 + f.jitter*(R() - 0.5)*0.3);
        addPetal(th, ln, S.wid, cupNow(S.cup + t*14) + f.jitter*(R() - 0.5)*20 - (past > 0 ? R()*past*40 : 0), curlNow, 1 - t*0.08, t*0.05, S.disc[1]*0.5, (i + t*n)/(n*tiers)); }
    } else if(S.type === 'cup' || S.type === 'violet' || S.type === 'iris'){
      const whorls = S.type === 'iris' ? 2 : n >= 6 ? 2 : 1, per = S.type === 'iris' ? 3 : Math.ceil(n/whorls);
      for(let w = 0; w < whorls; w++) for(let i = 0; i < per; i++){ const k = w*per + i; if(k >= n && S.type !== 'iris') break; if(w === 0 && i < dropped) continue;
        const th = spin + (i + w*0.5)/per*Math.PI*2 + f.jitter*(R() - 0.5)*0.2;
        let ln = S.len*lenK*(1 + f.jitter*(R() - 0.5)*0.2), cp = cupNow(S.cup) - w*6, wid = S.wid;
        if(S.type === 'iris'){ if(w === 0){ cp = cupNow(-35) - 10; ln *= 1.05; wid *= 1.1; } else { cp = cupNow(80); ln *= 0.85; wid *= 0.8; } }   // (falls droop, standards stand)
        if(S.type === 'violet'){ const lower = i === 0; ln *= lower ? 1.15 : 0.9; wid *= lower ? 1.25 : 0.85; }
        addPetal(th, ln, wid, cp + f.jitter*(R() - 0.5)*12, curlNow, w ? 0.92 : 1, w*0.04, 0.02, k/n); }
    } else if(S.type === 'double'){
      // the golden angle, inner petals small and upright, outer broad and open (ABOP's zinnia rule)
      for(let i = n - 1; i >= 0; i--){ if(i >= n - dropped) continue; const u = i/(n - 1), th = spin + i*2.39996;
        const ln = S.len*lenK*(0.28 + 0.72*Math.pow(u, 0.7)), cp = cupNow(S.cup + (1 - u)*45) - u*20*(1 - open);
        addPetal(th, ln, S.wid*(0.8 + 0.5*u), cp, curlNow - u*25*(S === FLORA.peony ? 0.3 : 1), 0.86 + 0.14*u, (1 - u)*0.25*open, 0.02 + u*0.08, i/n); }
    }
  }
  // ---- florets of the spikes, balls and umbels: many small cups or buds
  const florets = [];
  if(S.type === 'spike' || S.type === 'ball' || S.type === 'umbel'){
    const fl = (x, y, z, r, k, th, kind) => florets.push({ x, y, z, r, k, th, kind });
    if(S.type === 'spike'){
      // a stem up the head's middle, its florets on it (bells on one side, hanging; whorls of buds round it)
      // (a bluebell's stem arches over, its bells hanging on one side; a foxglove's stands, its bells held out on one
      //  side, the lowest open and largest; lavender's whorls of buds, spaced lower down, packed at the top)
      const H = 2.2*lenK, side = R() < 0.5 ? -1 : 1, arch = S.arch ? 0.9*side : 0.06*side, pts = [];
      const at = t => [arch*(Math.pow(t, 1.6) - 0.5)*(S.arch ? 1 : 0.5), 1.15 - t*H + (S.arch ? Math.pow(t, 2.2)*H*0.45 : 0)];
      for(let k = 0; k <= 20; k++) pts.push(at(k/20));
      florets.stemPts = pts;
      if(S.spike === 'bells'){ for(let i = 0; i < n; i++){ const t = S.arch ? 0.3 + 0.7*i/(n - 1 || 1) : 0.15 + 0.85*i/(n - 1 || 1), [x, y] = at(t), big = S.arch ? 0.17*(1 - t*0.3) : 0.34*(1 - t*0.55);
        fl(x + side*0.08, y, 0.1, big*(i/(n - 1) > 1 - (1 - open)*0.8 ? 0.45 : 1), 1 - t*0.1, S.arch ? Math.PI/2 + side*0.25 : Math.PI/2 - side*0.9, 'bell'); } }
      else for(let i = 0; i < n; i++){ const t = 0.3 + 0.7*Math.pow(i/(n - 1 || 1), 0.7), [x, y] = at(t); for(let k = 0; k < 7; k++){ const a = k/7*Math.PI*2 + i*0.7; fl(x + Math.cos(a)*0.09, y - Math.sin(a)*0.035, Math.sin(a)*0.09, 0.075*(1 - t*0.25), 0.8 + 0.2*Math.cos(a), Math.PI/2 + Math.cos(a)*0.6, 'bud'); } }
    } else if(S.type === 'ball'){
      // florets over the front of a sphere (the Fibonacci sphere)
      const m = n*(S.ball === 'pea' ? 4 : 2); for(let i = 0; i < m; i++){ const z = 1 - (i + 0.5)/m*2, r = Math.sqrt(1 - z*z), a = i*2.39996; if(z < -0.1) continue;
        fl(Math.cos(a)*r*0.8, Math.sin(a)*r*0.8, z*0.8, S.ball === 'pea' ? 0.2 : 0.21, 0.75 + 0.25*z, a, S.ball === 'pea' ? 'pea' : 'four'); }
      florets.ball = true;
    } else {
      // an umbel: rays out to little heads of lace, the one dark floret at the middle
      for(let i = 0; i < n; i++){ const a = i*2.39996, r = Math.sqrt((i + 0.5)/n)*0.85; for(let k = 0; k < 9; k++){ const b = k*2.39996, q = Math.sqrt((k + 0.5)/9)*0.12;
        fl(Math.cos(a)*r + Math.cos(b)*q, Math.sin(a)*r + Math.sin(b)*q, 0.05*(1 - r), 0.035, 0.9 + 0.1*R(), b, 'dot'); } }
    }
  }
  // ---- draw, back to front: the petals that face away, the disc's underside, the petals, the florets, the centre
  const drawPetal = p => {
    const shade = f.albedo ? (p.back ? 0.9 : 1)*p.colK : flClamp(0.62 + 0.45*p.lam, 0.35, 1.15)*(p.back ? 0.82 : 1)*p.colK;
    const age = past*0.9, cBase = flMix(cP, cC, 0.18), cTip = flMix(cT, brown, age*0.7), cMid = flMix(cP, brown, age*0.25);
    const path = ctx => { ctx.beginPath(); p.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
    const g = L.pic.createLinearGradient(p.base[0], p.base[1], p.tipP[0], p.tipP[1]);
    g.addColorStop(0, flCss(cBase, shade*0.85)); g.addColorStop(0.45, flCss(cMid, shade)); g.addColorStop(1, flCss(cTip, shade*1.02));
    path(L.pic); L.pic.fillStyle = g; L.pic.fill();
    // (no outline: a petal's edge is where its colour stops; an inked rim read as a drawing, Ruby's "too cartoony")
    // (no petal is one flat colour: a few soft patches lighter and darker, and as it ages, brown creeping in from the
    //  tip and the edges; drawn inside it, so its outline stays clean)
    if(Rad > 14){ L.pic.save(); path(L.pic); L.pic.clip(); const pl = Math.hypot(p.tipP[0] - p.base[0], p.tipP[1] - p.base[1]) || 1;
      for(let k = 0; k < 3; k++){ const t = 0.25 + R()*0.7, x = p.base[0] + (p.tipP[0] - p.base[0])*t + (R() - 0.5)*pl*0.25, y = p.base[1] + (p.tipP[1] - p.base[1])*t + (R() - 0.5)*pl*0.25, r = pl*(0.12 + R()*0.2);
        const lite = R() < 0.5, gg = L.pic.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, lite ? 'rgba(255,248,236,0.10)' : 'rgba(30,10,10,0.10)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        L.pic.fillStyle = gg; L.pic.fillRect(x - r, y - r, r*2, r*2); }
      if(age > 0.05){ const x = p.tipP[0], y = p.tipP[1], r = pl*(0.35 + age*0.5), gg = L.pic.createRadialGradient(x, y, 0, x, y, r);
        gg.addColorStop(0, flCss(brown, 0.75, Math.min(0.85, age*0.9))); gg.addColorStop(0.6, flCss(brown, 0.9, age*0.35)); gg.addColorStop(1, 'rgba(0,0,0,0)');
        L.pic.fillStyle = gg; L.pic.fillRect(x - r, y - r, r*2, r*2);
        for(let k = 0; k < 2; k++){ const t = 0.5 + R()*0.5, sd = R() < 0.5 ? -1 : 1, q = p.pts[Math.floor((sd < 0 ? t : 1 - t)*(p.pts.length - 1)*0.5 + (sd < 0 ? 0 : p.pts.length*0.5)) % p.pts.length], rr = pl*(0.1 + R()*0.18)*age;
          const g2 = L.pic.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g2.addColorStop(0, flCss(brown, 0.7, 0.7*age)); g2.addColorStop(1, 'rgba(0,0,0,0)'); L.pic.fillStyle = g2; L.pic.fillRect(q[0] - rr, q[1] - rr, rr*2, rr*2); } }
      L.pic.restore(); }
    // (faint veins, from the base out)
    if(Rad > 18){ L.pic.save(); path(L.pic); L.pic.clip(); L.pic.strokeStyle = flCss(cP, shade*0.82, 0.22); L.pic.lineWidth = Rad*0.006;
      for(let v = -2; v <= 2; v++){ L.pic.beginPath(); L.pic.moveTo(p.base[0], p.base[1]); const mx = (p.base[0] + p.tipP[0])/2 + (p.tipP[1] - p.base[1])*v*0.08, my = (p.base[1] + p.tipP[1])/2 - (p.tipP[0] - p.base[0])*v*0.08; L.pic.quadraticCurveTo(mx, my, p.tipP[0] + (mx - (p.base[0] + p.tipP[0])/2)*0.6, p.tipP[1] + (my - (p.base[1] + p.tipP[1])/2)*0.6); L.pic.stroke(); }
      L.pic.restore(); }
    // (spots, on a lily's or a foxglove's throat)
    if(S.spots && Rad > 12){ L.pic.fillStyle = flCss(cC, 0.8, 0.8); for(let k = 0; k < 6; k++){ const t = 0.15 + R()*0.4, x = p.base[0] + (p.tipP[0] - p.base[0])*t + (R() - 0.5)*Rad*0.06, y = p.base[1] + (p.tipP[1] - p.base[1])*t + (R() - 0.5)*Rad*0.06; L.pic.beginPath(); L.pic.arc(x, y, Math.max(0.6, Rad*0.012), 0, 6.283); L.pic.fill(); } }
    // (a buttercup's or a tulip's gloss: a hotspot where the cup faces the light)
    if(S.gloss && p.lam > 0.55 && !f.albedo){ const t = 0.55, x = p.base[0] + (p.tipP[0] - p.base[0])*t, y = p.base[1] + (p.tipP[1] - p.base[1])*t, gg = L.pic.createRadialGradient(x, y, 0, x, y, Rad*0.18);
      gg.addColorStop(0, `rgba(255,255,240,${0.55*S.gloss*(p.lam - 0.5)})`); gg.addColorStop(1, 'rgba(255,255,240,0)'); L.pic.save(); path(L.pic); L.pic.clip(); L.pic.fillStyle = gg; L.pic.fillRect(x - Rad*0.2, y - Rad*0.2, Rad*0.4, Rad*0.4); L.pic.restore(); }
    // (thickness ADDS where petals overlap: two layers let less light through than one — Habel 2007)
    L.thick.save(); L.thick.globalCompositeOperation = 'lighter'; path(L.thick); L.thick.fillStyle = 'rgb(56,56,56)'; L.thick.fill(); L.thick.restore();
    for(const [ctx, col] of [[L.mask, '#fff'], [L.ids, (v => `rgb(${v},${v},${v})`)(Math.round(30 + p.id*220))],
      [L.gloss, (v => `rgb(${v},${v},${v})`)(Math.round(255*(S.gloss ? 0.42 + 0.5*S.gloss : 0.14)))]]){ path(ctx); ctx.fillStyle = col; ctx.fill(); }
    { const pl = Math.hypot(p.tipP[0] - p.base[0], p.tipP[1] - p.base[1]) || 1;
      { const [f0, f1, fl, fm, fr] = p.face, gv = v => Math.round(255*(0.22 + 0.78*v)), gF = L.face.createLinearGradient(p.base[0], p.base[1], p.tipP[0], p.tipP[1]);
      gF.addColorStop(0, `rgb(${gv(f0)},${gv(f0)},${gv(f0)})`); gF.addColorStop(1, `rgb(${gv(f1)},${gv(f1)},${gv(f1)})`); path(L.face); L.face.fillStyle = gF; L.face.fill();
      if(p.edgeL && p.edgeR){ const ov = v => Math.round(255*flClamp(0.5 + 0.6*(v - fm))), gX = L.face.createLinearGradient(p.edgeL[0], p.edgeL[1], p.edgeR[0], p.edgeR[1]);
        gX.addColorStop(0, `rgb(${ov(fl)},${ov(fl)},${ov(fl)})`); gX.addColorStop(0.5, 'rgb(128,128,128)'); gX.addColorStop(1, `rgb(${ov(fr)},${ov(fr)},${ov(fr)})`);
        L.face.save(); L.face.globalCompositeOperation = 'overlay'; path(L.face); L.face.fillStyle = gX; L.face.fill(); L.face.restore(); } }
    // (thinner toward its edge and tip: more light comes through there)
      L.thick.save(); path(L.thick); L.thick.clip(); L.thick.globalCompositeOperation = 'multiply'; L.thick.strokeStyle = 'rgb(150,150,150)'; L.thick.lineWidth = pl*0.18; path(L.thick); L.thick.stroke();
      // (and its veins carry more: dark lines when the light comes through it)
      L.thick.globalCompositeOperation = 'lighter'; L.thick.strokeStyle = 'rgb(34,34,34)'; L.thick.lineWidth = Math.max(Rad*0.004, pl*0.007);
      for(let v = -3; v <= 3; v++){ L.thick.beginPath(); L.thick.moveTo(p.base[0], p.base[1]); const mx = (p.base[0] + p.tipP[0])/2 + (p.tipP[1] - p.base[1])*v*0.07, my = (p.base[1] + p.tipP[1])/2 - (p.tipP[0] - p.base[0])*v*0.07;
        L.thick.quadraticCurveTo(mx, my, p.tipP[0] + (mx - (p.base[0] + p.tipP[0])/2)*0.7, p.tipP[1] + (my - (p.base[1] + p.tipP[1])/2)*0.7); L.thick.stroke(); }
      L.thick.restore(); }
    const hg = L.height.createLinearGradient(p.base[0], p.base[1], p.tipP[0], p.tipP[1]), h0 = f.albedo ? flClamp(0.22 + p.pts[0][2]*0.6) : flClamp(0.45 + p.depth*0.0 + (p.pts[0][2])*0.35), h1 = f.albedo ? flClamp(0.3 + p.zTop*0.7) : flClamp(0.45 + p.zTop*0.4);
    hg.addColorStop(0, `rgb(${h0*255|0},${h0*255|0},${h0*255|0})`); hg.addColorStop(1, `rgb(${h1*255|0},${h1*255|0},${h1*255|0})`); path(L.height); L.height.fillStyle = hg; L.height.fill();
    // (its cross-section: a cupped petal's edges stand above its middle, a flat or reflexed one's fall away; and its
    //  veins lie a little sunk, which a low light finds — Habel 2007: grazing light shows a leaf's ridges)
    { const pl = Math.hypot(p.tipP[0] - p.base[0], p.tipP[1] - p.base[1]) || 1, cupK = Math.max(-1, Math.min(1, (S.cup + (S.curl || 0)*0.3)/40));
      L.height.save(); path(L.height); L.height.clip();
      L.height.strokeStyle = cupK > 0 ? `rgba(255,255,255,${0.22*cupK})` : `rgba(0,0,0,${-0.22*cupK})`; L.height.lineWidth = pl*0.35; path(L.height); L.height.stroke();
      L.height.strokeStyle = `rgba(0,0,0,${f.albedo ? 0.06 : 0.16})`; L.height.lineWidth = Math.max(Rad*0.005, pl*0.008);
      for(let v = -3; v <= 3; v++){ L.height.beginPath(); L.height.moveTo(p.base[0], p.base[1]); const mx = (p.base[0] + p.tipP[0])/2 + (p.tipP[1] - p.base[1])*v*0.07, my = (p.base[1] + p.tipP[1])/2 - (p.tipP[0] - p.base[0])*v*0.07;
        L.height.quadraticCurveTo(mx, my, p.tipP[0] + (mx - (p.base[0] + p.tipP[0])/2)*0.7, p.tipP[1] + (my - (p.base[1] + p.tipP[1])/2)*0.7); L.height.stroke(); }
      // (lit by the engine: its free edge falls away a little, so a petal over another has a rim that catches the light
      //  and a step that casts a shadow on the one beneath)
      if(f.albedo){ L.height.strokeStyle = 'rgba(0,0,0,0.12)'; L.height.lineWidth = pl*0.06; path(L.height); L.height.stroke(); }
      L.height.restore(); } };
  const drawFloret = q => { const [X, Y, Z] = P(q.x, q.y, q.z), r = q.r*Rad, shade = f.albedo ? flClamp(0.8 + 0.2*q.k) : flClamp(q.k*(0.7 + 0.35*(lz*0.8 + 0.2)));
    const c = q.kind === 'pea' ? flMix(cP, cT, R()*0.6) : q.kind === 'dot' ? flMix(cP, cT, R()) : flMix(cP, cT, R()*0.35);
    const shapeP = ctx => { ctx.beginPath();
      if(q.kind === 'bell'){
        // a bell: narrow at its stalk, flaring to its mouth, the lip turned back, pointing its own way (th)
        const a = q.th + f.turn, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, pt = (s, w) => [X + ux*s*r*1.6 + vx*w*r, Y + uy*s*r*1.6 + vy*w*r];
        const prof = [[0, 0.18], [0.3, 0.32], [0.65, 0.42], [0.92, 0.52], [1, 0.66], [1.04, 0.5]]; const L2 = [...prof.map(([s, w]) => pt(s, w)), ...prof.slice().reverse().map(([s, w]) => pt(s, -w))];
        L2.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
      else if(q.kind === 'four'){ for(let k = 0; k < 4; k++){ const a = q.th + k*Math.PI/2; ctx.moveTo(X, Y); ctx.ellipse(X + Math.cos(a)*r*0.5, Y + Math.sin(a)*r*0.5, r*0.5, r*0.36, a, 0, 6.283); } }
      else if(q.kind === 'pea'){ ctx.ellipse(X, Y, r*0.4, r, q.th, 0, 6.283); }
      else ctx.arc(X, Y, Math.max(0.6, r), 0, 6.283); };
    shapeP(L.pic); L.pic.fillStyle = flCss(c, shade); L.pic.fill();
    if(q.kind === 'bell'){ const a = q.th + f.turn, mx = X + Math.cos(a)*r*1.6, my = Y + Math.sin(a)*r*1.6; L.pic.beginPath(); L.pic.ellipse(mx, my, r*0.42, r*0.13, a + Math.PI/2, 0, 6.283); L.pic.fillStyle = flCss(flMix(cP, cC, 0.5), 0.6); L.pic.fill();
      if(S.spots){ L.pic.fillStyle = flCss(flMix(cC, [20, 10, 20], 0.4), 1, 0.8); for(let k = 0; k < 5; k++){ L.pic.beginPath(); L.pic.arc(mx - Math.cos(a)*r*(0.2 + k*0.12) + (R() - 0.5)*r*0.4, my - Math.sin(a)*r*(0.2 + k*0.12) + (R() - 0.5)*r*0.4, Math.max(0.5, r*0.06), 0, 6.283); L.pic.fill(); } } }
    for(const [ctx, col] of [[L.mask, '#fff'], [L.thick, 'rgb(90,90,90)'], [L.height, (v => `rgb(${v},${v},${v})`)(flClamp(0.5 + Z*0.4)*255|0)], [L.gloss, 'rgb(46,46,46)'], [L.face, 'rgb(205,205,205)']]){ shapeP(ctx); ctx.fillStyle = col; ctx.fill(); } };
  if(florets.stemPts){ const pp = florets.stemPts.map(([x, y]) => P(x, y, 0));
    for(const [ctx, col] of [[L.pic, flCss(cF, 0.8)], [L.mask, '#fff'], [L.thick, 'rgb(200,200,200)'], [L.gloss, 'rgb(80,80,80)'], [L.face, 'rgb(190,190,190)']]){ ctx.strokeStyle = col; ctx.lineWidth = Rad*0.045; ctx.lineCap = 'round'; ctx.beginPath(); pp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); } }
  // (a ball of florets has its dark heart behind them)
  if(florets.ball){ const c0 = P(0, 0, 0); for(const [ctx, col] of [[L.pic, flCss(flMix(cC, cP, 0.4), 0.8)], [L.mask, '#fff'], [L.thick, 'rgb(150,150,150)'], [L.height, 'rgb(150,150,150)']]){ ctx.beginPath(); ctx.arc(c0[0], c0[1], Rad*0.82, 0, 6.283); ctx.fillStyle = col; ctx.fill(); } }
  if(S.type === 'umbel'){ const c0 = P(0, 0, 0); L.pic.strokeStyle = flCss(cF, 0.75, 0.7); L.pic.lineWidth = Rad*0.01; for(let i = 0; i < n; i++){ const a = i*2.39996, r = Math.sqrt((i + 0.5)/n)*0.85, e = P(Math.cos(a)*r, Math.sin(a)*r, 0.05*(1 - r)); L.pic.beginPath(); L.pic.moveTo(c0[0], c0[1]); L.pic.lineTo(e[0], e[1]); L.pic.stroke(); } }
  petals.sort((a, b) => a.depth - b.depth);
  const front = [], back = [];
  for(const p of petals) (p.depth < 0 ? back : front).push(p);
  back.forEach(drawPetal);
  florets.sort((a, b) => a.z - b.z).forEach(drawFloret);
  // the centre
  const dk = S.disc[0], dr = S.disc[1]*Rad*(bare ? 1.15 : 1);
  if(dk !== 'none' && dr > 0){ const c0 = P(0, 0, 0.04), shadeC = f.albedo ? 0.95 : flClamp(0.75 + 0.3*lz);
    const disc = (ctx, col) => { ctx.beginPath(); ctx.ellipse(c0[0], c0[1], dr*(dk === 'stamens' ? 0.25 : 1), dr*(dk === 'stamens' ? 0.25 : 1)*Math.max(0.25, ca), f.turn, 0, 6.283); ctx.fillStyle = col; ctx.fill(); };
    front.forEach(drawPetal);
    disc(L.pic, flCss(dk === 'eye' ? cT : cC, shadeC*(dk === 'cone' ? 1.1 : 1)));
    disc(L.mask, '#fff'); disc(L.cen, '#fff'); disc(L.thick, 'rgb(230,230,230)'); disc(L.gloss, dk === 'boss' ? 'rgb(150,150,150)' : 'rgb(26,26,26)'); disc(L.face, 'rgb(215,215,215)'); disc(L.height, dk === 'cone' ? 'rgb(240,240,240)' : 'rgb(190,190,190)');
    if(dk === 'vogel' || dk === 'flat' || dk === 'cone' || dk === 'tufts'){
      // florets in the disc by the golden angle (the 21/34 spirals)
      const m = Math.round(dk === 'vogel' ? 240 : 90), sz = dr/Math.sqrt(m)*1.05;
      for(let i = 0; i < m; i++){ const a = i*2.39996, r = Math.sqrt((i + 0.5)/m), q = P(Math.cos(a)*r*S.disc[1], Math.sin(a)*r*S.disc[1], 0.04 + (1 - r*r)*(dk === 'cone' ? 0.25 : 0.06));
        const k = 0.75 + 0.35*Math.cos(a*3 + r*8)*(dk === 'vogel' ? 1 : 0.3), c = dk === 'vogel' ? flMix(cC, flMix(cC, cT, 0.4), r > 0.75 ? 0.6 : 0) : cC;
        L.pic.beginPath(); L.pic.arc(q[0], q[1], Math.max(0.5, sz*0.55), 0, 6.283); L.pic.fillStyle = flCss(c, shadeC*k*(0.8 + 0.4*r)); L.pic.fill(); } }
    if(dk === 'eye'){ L.pic.beginPath(); L.pic.ellipse(c0[0], c0[1], dr*0.62, dr*0.62*Math.max(0.25, ca), f.turn, 0, 6.283); L.pic.fillStyle = flCss(cC, shadeC); L.pic.fill();
      L.pic.beginPath(); L.pic.ellipse(c0[0], c0[1], dr*0.2, dr*0.2*Math.max(0.25, ca), f.turn, 0, 6.283); L.pic.fillStyle = flCss(flMix(cC, [40, 30, 20], 0.6), 1); L.pic.fill(); }
    if(dk === 'crown' || dk === 'stamens' || dk === 'boss'){
      // stamens: filaments with their anthers, round a knob (a poppy's, an anemone's) or long and few (a lily's)
      const m = dk === 'stamens' ? (S === FLORA.lily ? 6 : 24) : 40, long = dk === 'stamens' ? S.disc[1] : S.disc[1]*1.3;
      for(let i = 0; i < m; i++){ const a = i*2.39996 + spin, rr = long*(dk === 'stamens' ? 1 : 0.6 + 0.4*R()), e = P(Math.cos(a)*rr, Math.sin(a)*rr, 0.15 + (dk === 'stamens' ? 0.25 : 0.08));
        L.pic.strokeStyle = flCss(dk === 'boss' ? cC : flMix(cC, cT, 0.3), 0.9, 0.85); L.pic.lineWidth = Rad*0.008; L.pic.beginPath(); L.pic.moveTo(c0[0], c0[1]); L.pic.lineTo(e[0], e[1]); L.pic.stroke();
        L.pic.beginPath(); L.pic.arc(e[0], e[1], Math.max(0.6, Rad*(dk === 'stamens' ? 0.03 : 0.018)), 0, 6.283); L.pic.fillStyle = flCss(dk === 'boss' ? flMix(cC, [255, 230, 120], 0.4) : cC, 0.8); L.pic.fill();
        L.cen.beginPath(); L.cen.arc(e[0], e[1], Math.max(0.6, Rad*0.02), 0, 6.283); L.cen.fillStyle = '#fff'; L.cen.fill(); }
      if(dk === 'crown'){ L.pic.beginPath(); L.pic.arc(c0[0], c0[1], dr*0.35, 0, 6.283); L.pic.fillStyle = flCss(flMix(cC, cF, 0.4), 1.1); L.pic.fill(); } }
    if(dk === 'beard'){ for(const p of petals.filter(p => p.depth >= 0).slice(0, 3)){ L.pic.strokeStyle = flCss(cC, 1); L.pic.lineWidth = Rad*0.04; L.pic.beginPath(); L.pic.moveTo(p.base[0], p.base[1]); L.pic.lineTo(p.base[0] + (p.tipP[0] - p.base[0])*0.45, p.base[1] + (p.tipP[1] - p.base[1])*0.45); L.pic.stroke(); } }
    if(dk === 'dot'){ L.pic.beginPath(); L.pic.arc(c0[0], c0[1], Math.max(1, Rad*0.05), 0, 6.283); L.pic.fillStyle = flCss(cC, 1); L.pic.fill(); }
  } else front.forEach(drawPetal);
  // (a bud's sepals, green, hugging it)
  if(open < 0.7 && S.type !== 'spike' && S.type !== 'ball' && S.type !== 'umbel'){ for(let k = 0; k < 5; k++){ const th = spin + k/5*6.283 + 0.3, b = P(0, 0, 0), e = P(Math.cos(th)*0.45, Math.sin(th)*0.45, -0.25);
    L.pic.strokeStyle = flCss(cF, 0.85); L.pic.lineWidth = Rad*0.06*(1 - open); L.pic.beginPath(); L.pic.moveTo(b[0], b[1]); L.pic.lineTo(e[0], e[1]); L.pic.stroke(); } }
}
/** A leaf (lanceolate to ovate, a midrib and veins), its base at (x, y), length r, pointing a. */
function flLeaf(L, x, y, r, a, cF, R, age = 0){
  const w = 0.22 + R()*0.18, curve = (R() - 0.5)*0.5, pts = [];
  const wav = 0.04 + age*0.18, wf = 3 + R()*4, wp = R()*6.283;
  for(let side = -1; side <= 1; side += 2) for(let k = 0; k <= 16; k++){ const s = side < 0 ? k/16 : 1 - k/16, wd = Math.pow(Math.sin(Math.PI*s), 0.8)*(1 - s*0.3)*w*r*side*(1 + wav*Math.sin(s*wf*Math.PI + wp + side*1.7)), c = curve*s*s*r;
    pts.push([x + Math.cos(a)*s*r - Math.sin(a)*(wd + c), y + Math.sin(a)*s*r + Math.cos(a)*(wd + c)]); }
  const tip = [x + Math.cos(a)*r - Math.sin(a)*curve*r, y + Math.sin(a)*r + Math.cos(a)*curve*r], col = flMix(cF, [110, 80, 40], age*0.6);
  const path = ctx => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
  const g = L.pic.createLinearGradient(x, y, tip[0], tip[1]); g.addColorStop(0, flCss(col, 0.75)); g.addColorStop(1, flCss(col, 1.05));
  path(L.pic); L.pic.fillStyle = g; L.pic.fill();
  L.pic.save(); path(L.pic); L.pic.clip();
  // (side veins off the midrib, faint; soft patches; brown spreading in from the edge as it ages)
  L.pic.strokeStyle = flCss(col, 1.12, 0.22); L.pic.lineWidth = r*0.008;
  for(let k = 1; k <= 7; k++){ const s = k/8, mx = x + Math.cos(a)*s*r - Math.sin(a)*curve*s*s*r, my = y + Math.sin(a)*s*r + Math.cos(a)*curve*s*s*r;
    for(const sd of [-1, 1]){ const ang = a + sd*0.9, l = Math.sin(Math.PI*s)*w*r*1.05; L.pic.beginPath(); L.pic.moveTo(mx, my); L.pic.quadraticCurveTo(mx + Math.cos(ang)*l*0.6, my + Math.sin(ang)*l*0.6, mx + Math.cos(ang + sd*0.25)*l + Math.cos(a)*l*0.35, my + Math.sin(ang + sd*0.25)*l + Math.sin(a)*l*0.35); L.pic.stroke(); } }
  for(let k = 0; k < 3 + Math.round(age*4); k++){ const t = R(), sd = R() < 0.5 ? -1 : 1, ex = x + Math.cos(a)*t*r - Math.sin(a)*sd*w*r*0.8*Math.sin(Math.PI*t), ey = y + Math.sin(a)*t*r + Math.cos(a)*sd*w*r*0.8*Math.sin(Math.PI*t), rr = r*(0.08 + R()*0.15)*(k < 3 ? 1 : 1 + age);
    const gg = L.pic.createRadialGradient(ex, ey, 0, ex, ey, rr); gg.addColorStop(0, k < 3 ? (R() < 0.5 ? 'rgba(255,250,220,0.08)' : 'rgba(0,20,0,0.1)') : flCss([110, 74, 34], 0.8, 0.6*age)); gg.addColorStop(1, 'rgba(0,0,0,0)'); L.pic.fillStyle = gg; L.pic.fillRect(ex - rr, ey - rr, rr*2, rr*2); }
  L.pic.restore();
  L.pic.strokeStyle = flCss(col, 1.1, 0.35); L.pic.lineWidth = r*0.016; L.pic.beginPath(); L.pic.moveTo(x, y); L.pic.quadraticCurveTo((x + tip[0])/2 - Math.sin(a)*curve*r*0.3, (y + tip[1])/2 + Math.cos(a)*curve*r*0.3, tip[0], tip[1]); L.pic.stroke();
  for(const [ctx, col] of [[L.mask, '#fff'], [L.thick, 'rgb(120,120,120)'], [L.height, 'rgb(110,110,110)'], [L.gloss, (v => `rgb(${v},${v},${v})`)(Math.round(255*(0.38 - age*0.25)))], [L.face, 'rgb(200,200,200)']]){ path(ctx); ctx.fillStyle = col; ctx.fill(); }
  L.height.save(); path(L.height); L.height.clip(); L.height.strokeStyle = 'rgba(255,255,255,0.18)'; L.height.lineWidth = r*0.03; L.height.beginPath(); L.height.moveTo(x, y); L.height.quadraticCurveTo((x + tip[0])/2 - Math.sin(a)*curve*r*0.3, (y + tip[1])/2 + Math.cos(a)*curve*r*0.3, tip[0], tip[1]); L.height.stroke();
  L.height.strokeStyle = 'rgba(255,255,255,0.14)'; L.height.lineWidth = w*r*0.9; path(L.height); L.height.stroke(); L.height.restore();
}

/** The layers a Bloom draws on, each a canvas w × h (picture on black; the rest grey on black). */
function flLayers(w, h){
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', CPU); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); return x; };
  return { pic: mk(), mask: mk(), height: mk(), thick: mk(), cen: mk(), ids: mk(), gloss: mk(), face: mk() };
}
/**
 * BLOOM: one flower, or a sheet of them in cells, or one petal or one leaf, on the layers.
 * o: { species (key or 'mixed'), view, stage, jitter, flat, part ('whole' | 'petal' | 'leaf'), cells (1, 4, 8, 16), size,
 *      stem, light: [lx, ly, lz], cols: [4 rgb], seed }
 */
export function genBloom(w, h, o){
  const L = flLayers(w, h), R = mulberry32(o.seed);
  const cols = o.cells >= 16 ? 4 : o.cells >= 4 ? (o.cells >= 8 ? 4 : 2) : 1, rows = Math.max(1, Math.round(o.cells/cols)), cw = w/cols, ch = h/rows;
  const habitat = FLORA_HABITATS[Math.floor(R()*FLORA_HABITATS.length)];
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const key = o.species === 'mixed' ? habitat[Math.floor(R()*habitat.length)] : o.species, S = FLORA[key] || FLORA.daisy;
    const cc = o.cols.map((c, k) => c || flHex(S.cols[k]));
    const many = o.cells > 1, cx = many ? (i + 0.5)*cw : (o.x ?? 0.5)*w, cy = many ? (j + 0.5)*ch : (o.y ?? 0.5)*h;
    const Rad = Math.min(cw, ch)*0.42*o.size*(many ? 0.75 + R()*0.3 : 1);   // (one flower: Size of the page's shorter side; Across and Down place it)
    if(o.part === 'leaf'){ flLeaf(L, cx - Math.min(cw, ch)*0.35, cy + Math.min(cw, ch)*0.1, Math.min(cw, ch)*0.7*o.size, -0.4 + (R() - 0.5)*0.8, cc[3], R, o.stage > 0.6 ? (o.stage - 0.6)/0.4 : 0); continue; }
    const f = { sp: S, view: flClamp(o.view + (many ? (R() - 0.5)*0.4 : 0)), stage: flClamp(o.stage + (many ? (R() - 0.5)*0.25 : 0)), spin: R()*6.283, turn: many ? (R() - 0.5)*0.6 : 0,
      jitter: o.jitter, flat: o.flat > 0.5, light: o.light, albedo: !!o.albedo, cols: cc, stem: o.stem && o.part === 'whole' };
    if(o.part === 'petal'){
      // one petal, lying flat (a little curled), its base toward the cell's middle
      const S1 = { ...S, type: 'cup', n: [1, 1], disc: ['none', 0], cup: 8 + R()*30, spots: 0 };
      flDrawBloom(L, R, cx - Rad*0.6, cy, Rad*1.4, { ...f, sp: S1, view: 0.15 + R()*0.3, spin: (R() - 0.5)*0.8, stem: false });
      continue; }
    // (the head sits a little high when its stem shows)
    flDrawBloom(L, R, cx, cy - (f.stem && f.view > 0.35 ? ch*0.18 : 0), Rad*(f.stem && f.view > 0.35 ? 0.7 : 1), f);
  }
  // (never quite black where the flower is, so a Scatter that takes black as clear keeps all of it; and at its edge,
  //  where a pixel was only partly covered and so drawn partly black, its own colour given back: no dark rim round
  //  a petal thrown on a ground)
  { const pd = L.pic.getImageData(0, 0, w, h), md = L.mask.getImageData(0, 0, w, h), d = pd.data, m = md.data;
    for(let i = 0; i < d.length; i += 4) if(m[i] > 8){ const k = m[i]/255;
      if(k < 0.97){ const u = 1/Math.max(0.2, k); d[i] = Math.min(255, d[i]*u); d[i + 1] = Math.min(255, d[i + 1]*u); d[i + 2] = Math.min(255, d[i + 2]*u); }
      d[i] = Math.max(d[i], 3*k); d[i + 1] = Math.max(d[i + 1], 3*k); d[i + 2] = Math.max(d[i + 2], 3*k); }
      else d[i] = d[i + 1] = d[i + 2] = 0;   // (a hair of coverage is no coverage: left black, so it stays clear, not a dark speck)
    L.pic.putImageData(pd, 0, 0); }
  return [L.pic.canvas, L.mask.canvas, L.height.canvas, L.thick.canvas, L.cen.canvas, L.ids.canvas, L.gloss.canvas, L.face.canvas];
}

export const FLORA_STEPS = {
  // BLOOM (the floral surfaces' process part): a flower of a real species, or a sheet of them, lit from the dial
  bloom: { cat: 'Marks', label: 'Bloom', ins: ['light from', 'petal hue', 'tip hue', 'center hue', 'foliage hue'], outs: ['picture', 'mask', 'height', 'thickness', 'center', 'petals', 'gloss', 'facing'],
    io: { ins: ['value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [FL_R('species', FLORA_SPECIES_LABEL, 0), FL_R('view', 'View: Face → Side', 30), FL_R('stage', 'Stage: Bud → Open → Wilted → Seed Head', 45), FL_R('jitter', 'Jitter', 40),
      FL_R('size', 'Size', 100, 30, 300), FL_R('flat', 'Pressed', 0), FL_R('part', 'Part: Whole · Petal · Leaf', 0), FL_R('sheet', 'Sheet: One · 4 · 8 · 16', 0), FL_R('stem', 'Stem', 100), FL_R('variant', 'Variation', 0, 0, 99), FL_R('x', 'Across', 50), FL_R('y', 'Down', 50), FL_R('lit', 'Lit By: Bloom · The Light Engine', 0)], cost: () => 3,
    doc: 'A flower of a real species — a daisy, a poppy, a rose, a foxglove — drawn petal by petal and lit from the dial, from bud to wilted to seed head; or a sheet of them, or one petal or leaf, for Scatter to throw.',
    run(E, n){ const { ww, wh, num } = E, k = Math.min(FLORA_KEYS.length, Math.floor(num(n, 'species', 0)/100*(FLORA_KEYS.length + 1))), d = E.input(n, 1);
      const deg = typeof d === 'number' ? d*360 : (E.ctx.light ?? 315), a = (deg - 90)*Math.PI/180, t = Math.min(1, Math.max(0, (E.ctx.lightTilt ?? 100)/100));
      const hue = j => { const v = E.input(n, j); return Array.isArray(v) ? v.map(c => c*255) : null; };
      const sh = [1, 4, 8, 16][Math.min(3, Math.floor(num(n, 'sheet', 0)/100*4))], part = ['whole', 'petal', 'leaf'][Math.min(2, Math.floor(num(n, 'part', 0)/100*3))];
      const o = { species: k >= FLORA_KEYS.length ? 'mixed' : FLORA_KEYS[k], view: num(n, 'view', 30)/100, stage: num(n, 'stage', 45)/100, jitter: num(n, 'jitter', 40)/100, size: num(n, 'size', 100)/100,
        flat: num(n, 'flat', 0)/100, part, cells: sh, stem: num(n, 'stem', 100) > 50, light: [Math.cos(a)*t, Math.sin(a)*t, Math.sqrt(Math.max(0.05, 1 - t*t))], cols: [hue(2), hue(3), hue(4), hue(5)],
        seed: ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0) ^ 0x6b10) >>> 0, x: num(n, 'x', 50)/100, y: num(n, 'y', 50)/100, albedo: num(n, 'lit', 0) >= 50 };
      const [pic, mask, height, thick, cen, ids, gloss, face] = genBloom(ww, wh, o);
      const M = E.asField(E.readCanvas(mask)), Hf = E.asField(E.readCanvas(height)), Ff = E.asField(E.readCanvas(face));
      // (Lit By the Light Engine: Facing and Height made SMOOTH, curved and tapered, never stepped at a petal's edge (Ruby:
      //  "generate normal maps that are somewhat curved, tapered and smooth instead of maps with sharp lines"; stepped maps
      //  made cardboard cut-outs). Each is blurred within the flower's own shape (a blur of it over a blur of the shape),
      //  so the shape's outline stays sharp and nothing darkens round it)
      if(o.albedo){ const unit = Math.min(ww, wh), inside = (F, r) => { const N = F.length, FM = new Float32Array(N); for(let i = 0; i < N; i++) FM[i] = F[i]*M[i];
          const a = E.boxBlur(FM, r), b = E.boxBlur(M, r), out = new Float32Array(N); for(let i = 0; i < N; i++) out[i] = M[i] > 0.004 ? Math.min(1, a[i]/Math.max(1e-4, b[i])) : 0; return out; };
        const sm = o.size*unit*(sh > 1 ? 0.5 : 1);
        return [E.readCanvas(pic), M, inside(Hf, Math.max(1, sm*0.012)), E.asField(E.readCanvas(thick)), E.asField(E.readCanvas(cen)), E.asField(E.readCanvas(ids)), E.asField(E.readCanvas(gloss)), inside(Ff, Math.max(1, sm*0.016))]; }
      return [E.readCanvas(pic), M, Hf, E.asField(E.readCanvas(thick)), E.asField(E.readCanvas(cen)), E.asField(E.readCanvas(ids)), E.asField(E.readCanvas(gloss)), Ff]; } },
};
