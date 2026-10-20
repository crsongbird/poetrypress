/**
 * stepsSpecimen.js — SPECIMEN: a whole plant of one of Bloom's 23 species, as a herbarium sheet or a botanical plate
 * shows it (docs/prior-art/botanical-specimens.md). Ruby: "professional and species accurate", never clip art.
 *
 * What makes it a specimen and not a sticker (the doc's §1.2 and §4):
 *   - root down, off-centre and leaning, curved to fit its cell; a root, bulb, rhizome, tuber or a cut woody end;
 *   - the species' habit: a rosette and a bare scape, a branched cyme, a one-sided raceme, a fan of swords, a twig;
 *   - its leaves by their real outline (a width profile along a bending midrib, the two halves unequal), margin
 *     (serrate, crenate, incised), division (pinnatifid, pinnate, bi- and tripinnate, ternate, palmate, trifoliate) and
 *     arrangement (alternate, opposite, whorled, basal), shrinking up the stem as the species does; one turned over
 *     to show its paler underside; the lowest browning;
 *   - stems that taper and lean and recover, with the species' hairs or prickles;
 *   - its flowers in several views (face, three-quarter, profile) and stages: buds, open, spent, seed;
 *     racemes open from the bottom, cymes from the top.
 * The heads are Bloom's own (flDrawBloom), so a daisy here is the daisy of every floral surface.
 *
 * Outputs as Bloom's (picture, mask, height, thickness, centre, petals, gloss, facing), so it drops in wherever Bloom
 * did: Imprint develops them, the Light Engine lights them, Scatter throws a sheet of them.
 *
 * Haiku: / root down on the sheet — / one leaf turned to show its back, / the bud not yet out /
 */
import { mulberry32, freeCanvas } from './texCore.js';
import { flDrawBloom, flLayers, FLORA, FLORA_KEYS, FLORA_HABITATS, FLORA_SPECIES_LABEL, FLORA_NAMES, flHex, flMix, flCss, flClamp } from './stepsFlora.js';

const SPC_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const SPC_TAU = Math.PI*2, SPC_UP = -Math.PI/2;
const spcGrey = v => { const g = Math.round(flClamp(v)*255); return `rgb(${g},${g},${g})`; };
const spcAngTo = (a, b) => { let d = b - a; while(d > Math.PI) d -= SPC_TAU; while(d < -Math.PI) d += SPC_TAU; return d; };

// ---------------------------------------------------------------------------------------------------------------
// LEAF OUTLINES (the doc's §1.4 and §3.3): half an outline as control points [t along the midrib, half-width], drawn
// through a Catmull-Rom spline. A t below 0 reaches back past the stalk (a heart's lobes).
const SPC_SHAPES = {
  linear:      [[0, 0.55], [0.06, 0.95], [0.5, 1], [0.82, 0.85], [0.95, 0.42], [1, 0]],
  strap:       [[0, 0.72], [0.12, 0.96], [0.35, 1], [0.72, 0.82], [0.93, 0.38], [1, 0]],
  sword:       [[0, 0.8], [0.15, 0.97], [0.42, 1], [0.78, 0.72], [0.95, 0.22], [1, 0]],
  lanceolate:  [[0, 0.08], [0.1, 0.62], [0.3, 1], [0.56, 0.84], [0.8, 0.44], [1, 0]],
  oblanceolate:[[0, 0.05], [0.28, 0.34], [0.6, 0.84], [0.78, 1], [0.92, 0.68], [1, 0]],
  elliptic:    [[0, 0.05], [0.12, 0.62], [0.48, 1], [0.84, 0.62], [1, 0]],
  ovate:       [[0, 0.28], [0.07, 0.76], [0.3, 1], [0.58, 0.84], [0.84, 0.42], [1, 0]],
  obovate:     [[0, 0.05], [0.25, 0.45], [0.62, 1], [0.86, 0.86], [0.97, 0.42], [1, 0]],
  spatulate:   [[0, 0.07], [0.4, 0.17], [0.62, 0.68], [0.8, 1], [0.94, 0.76], [1, 0]],
  oblong:      [[0, 0.32], [0.06, 0.86], [0.2, 1], [0.74, 0.95], [0.92, 0.58], [1, 0]],
  cordate:     [[0, 0], [-0.1, 0.36], [-0.07, 0.8], [0.12, 1], [0.42, 0.86], [0.72, 0.46], [1, 0]],
  reniform:    [[0, 0], [-0.15, 0.42], [-0.1, 0.88], [0.15, 1], [0.5, 0.94], [0.8, 0.56], [1, 0]],
  obcordate:   [[0, 0.05], [0.3, 0.52], [0.68, 1], [0.94, 0.8], [1, 0.32], [0.96, 0]],
  wedge:       [[0, 0.06], [0.45, 0.5], [0.85, 1], [0.98, 0.7], [1, 0]],
  scale:       [[0, 0.6], [0.3, 1], [0.7, 0.8], [1, 0]],
};
function spcSpline(cp, per = 10){
  const out = [], P = [cp[0], ...cp, cp[cp.length - 1]];
  for(let i = 1; i < P.length - 2; i++) for(let k = 0; k < per; k++){ const u = k/per, u2 = u*u, u3 = u2*u;
    const f = j => 0.5*(2*P[i][j] + (-P[i - 1][j] + P[i + 1][j])*u + (2*P[i - 1][j] - 5*P[i][j] + 4*P[i + 1][j] - P[i + 2][j])*u2 + (-P[i - 1][j] + 3*P[i][j] - 3*P[i + 1][j] + P[i + 2][j])*u3);
    out.push([f(0), Math.max(0, f(1))]); }
  out.push(cp[cp.length - 1]);
  return out;
}
const SPC_SPLINES = Object.fromEntries(Object.entries(SPC_SHAPES).map(([k, v]) => [k, spcSpline(v)]));
/** A margin's teeth (summed triangle waves, the venation paper's way), at u along the edge; a fraction of the width. */
function spcTooth(kind, u){
  const f = u - Math.floor(u);
  switch(kind){
    case 'serrate': return f < 0.78 ? f/0.78 : (1 - f)/0.22;          // (the steep side toward the tip)
    case 'double': { const g = (u*3) - Math.floor(u*3); return 0.75*(f < 0.78 ? f/0.78 : (1 - f)/0.22) + 0.35*(g < 0.7 ? g/0.7 : (1 - g)/0.3); }
    case 'dentate': return 1 - Math.abs(f*2 - 1);
    case 'crenate': return Math.sqrt(Math.max(0, Math.sin(Math.PI*f)));
    case 'incised': return Math.pow(1 - Math.abs(f*2 - 1), 2.2);
    default: return 0;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// PAINTING: every organ on every map at once, as Bloom paints (picture: its colour unlit; mask; height: how near;
// thickness: where light comes through; gloss; facing)
function spcPath(ctx, pts){ ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
function spcFillAll(L, pts, m){
  for(const [k, v] of [['mask', '#fff'], ['height', m.h != null ? spcGrey(m.h) : null], ['thick', m.thick != null ? spcGrey(m.thick) : null], ['gloss', m.gloss != null ? spcGrey(m.gloss) : null], ['face', spcGrey(m.face ?? 0.78)], ['cen', m.cen ? '#fff' : null]]){
    if(!v) continue; spcPath(L[k], pts); L[k].fillStyle = v; L[k].fill(); }
}
/** A tapered band along a line of points ({x, y, a, w}): a stem, a stalk, a thread of a leaf. */
function spcRibbon(pts, k = 1){
  const l = [], r = [];
  for(const p of pts){ const nx = -Math.sin(p.a), ny = Math.cos(p.a), w = p.w*k/2; l.push([p.x + nx*w, p.y + ny*w]); r.push([p.x - nx*w, p.y - ny*w]); }
  const e = pts[pts.length - 1], tip = [e.x + Math.cos(e.a)*e.w*k*0.3, e.y + Math.sin(e.a)*e.w*k*0.3];
  return [...l, tip, ...r.reverse()];
}
/** Paint a band (a stem): its colour darker at its sides and a lighter line down it (a round stem), as a ridge in height. */
function spcBand(L, pts, col, m = {}){
  const poly = spcRibbon(pts);
  spcPath(L.pic, poly); L.pic.fillStyle = flCss(col, 0.86); L.pic.fill();
  const inner = spcRibbon(pts, 0.5);
  spcPath(L.pic, inner); L.pic.fillStyle = flCss(col, m.wood ? 1.02 : 1.06, 0.55); L.pic.fill();
  spcFillAll(L, poly, { h: m.h ?? 0.4, thick: m.thick ?? 0.8, gloss: m.gloss ?? 0.22, face: 0.76 });
  spcPath(L.height, inner); L.height.fillStyle = spcGrey((m.h ?? 0.4) + 0.08); L.height.fill();
}
/** Hairs on a stem's outline (a poppy's bristles, a foxglove's down), standing out from it, a little forward. */
function spcHairs(L, R, pts, col, len, every = 1){
  L.pic.strokeStyle = flCss(col, 1.08, 0.75); L.mask.strokeStyle = '#fff'; L.height.strokeStyle = spcGrey(0.38);
  for(let i = 1; i < pts.length - 1; i += every) for(const sd of [-1, 1]){ if(R() < 0.35) continue;
    const p = pts[i], nx = -Math.sin(p.a)*sd, ny = Math.cos(p.a)*sd, x = p.x + nx*p.w/2, y = p.y + ny*p.w/2, l = len*(0.6 + R()*0.7), fw = 0.35 + R()*0.6;
    const ex = x + (nx + Math.cos(p.a)*fw)*l, ey = y + (ny + Math.sin(p.a)*fw)*l;
    for(const c of [L.pic, L.mask, L.height]){ c.lineWidth = (p.w*0.07); c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); } }
}
/** Prickles on a rose's cane: broad-based, flattened, hooked back down the stem, scattered. */
function spcPrickles(L, R, pts, col, size){
  for(let i = 2; i < pts.length - 2; i++){ if(R() > 0.32) continue;
    const p = pts[i], sd = R() < 0.5 ? -1 : 1, nx = -Math.sin(p.a)*sd, ny = Math.cos(p.a)*sd, bx = p.x + nx*p.w*0.45, by = p.y + ny*p.w*0.45, s = size*(0.7 + R()*0.6);
    const back = [-Math.cos(p.a), -Math.sin(p.a)];
    const tri = [[bx + back[0]*s*0.5, by + back[1]*s*0.5], [bx - back[0]*s*0.5, by - back[1]*s*0.5], [bx + nx*s*0.95 + back[0]*s*0.75, by + ny*s*0.95 + back[1]*s*0.75]];
    spcPath(L.pic, tri); L.pic.fillStyle = flCss(flMix(col, [150, 60, 50], 0.35), 0.9); L.pic.fill();
    spcFillAll(L, tri, { h: 0.5, thick: 0.9, gloss: 0.35 }); }
}

// ---------------------------------------------------------------------------------------------------------------
// A LEAF BLADE: the outline along a bending midrib, the halves unequal, teeth on the margin; turned over (the paler,
// more veined underside) or folded; veins as the species has them (pinnate, parallel, palmate, three from the base)
function spcBlade(L, R, x, y, a, len, sp, c){
  // (a blade a few pixels long: its outline only, a lens along its midrib, on every map)
  if(len < 7){ const W = (sp.w || 0.25)*len, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], b = (c.bend || 0)*len*0.2, pts = [];
    for(let i = 0; i <= 6; i++){ const t = i/6, w = W*Math.sin(Math.PI*Math.min(1, t*1.05)); pts.push([x + d[0]*t*len + n[0]*(w + b*t*t), y + d[1]*t*len + n[1]*(w + b*t*t)]); }
    for(let i = 6; i >= 0; i--){ const t = i/6, w = W*Math.sin(Math.PI*Math.min(1, t*1.05)); pts.push([x + d[0]*t*len - n[0]*(w - b*t*t), y + d[1]*t*len - n[1]*(w - b*t*t)]); }
    spcPath(L.pic, pts); L.pic.fillStyle = flCss(c.under ? flMix(c.col, [200, 210, 190], 0.28) : c.col, 0.9 + R()*0.14); L.pic.fill(); spcFillAll(L, pts, { h: c.h ?? 0.46, thick: 0.42, gloss: sp.gloss ?? 0.22 }); return; }
  const N = 44, sh = SPC_SPLINES[sp.shape] || SPC_SPLINES.lanceolate, W = (sp.w || 0.25)*len;
  const bend = c.bend ?? (R() - 0.5)*0.6, droop = c.droop ?? 0, roll = c.roll ?? 1, asym = 1 + (R() - 0.5)*0.2;
  // the midrib: bending as it goes, the tip drooping toward the ground (down the page) by droop
  const mid = []; { let X = x, Y = y, A = a; for(let i = 0; i <= N; i++){ const t = i/N; mid.push([X, Y, A]);
    A += bend/N + spcAngTo(A, Math.PI/2)*droop*t*2.2/N; X += Math.cos(A)*len/N; Y += Math.sin(A)*len/N; } }
  const at = t => { if(t <= 0){ const [X, Y, A] = mid[0]; return [X + Math.cos(A)*t*len, Y + Math.sin(A)*t*len, A]; }
    const f = Math.min(N - 1e-6, t*N), i = Math.floor(f), u = f - i, p = mid[i], q = mid[i + 1]; return [p[0] + (q[0] - p[0])*u, p[1] + (q[1] - p[1])*u, p[2] + (q[2] - p[2])*u]; };
  const teeth = sp.teeth || 0, amp = sp.tooth ?? (sp.margin === 'incised' ? 0.22 : sp.margin === 'crenate' ? 0.06 : 0.07), wave = sp.wave || 0, wph = R()*6;
  const half = side => sh.map(([t, w0]) => {
    let w = w0;
    if(teeth && t > 0.04 && t < 0.97 && w0 > 0.08) w += amp*spcTooth(sp.margin, t*teeth + (side > 0 ? 0 : 0.5))*Math.min(1, w0*3);
    if(sp.tip === 'acuminate' && t > 0.78) w *= Math.pow(Math.max(0, 1 - (t - 0.78)/0.22), 0.8)*0.85 + 0.15*(1 - (t - 0.78)/0.22);
    if(wave) w *= 1 + wave*Math.sin(t*14 + wph + side);
    const [X, Y, A] = at(t), nx = -Math.sin(A), ny = Math.cos(A), k = W*w*(side > 0 ? asym : 1/asym)*(side > 0 ? 1 : roll);
    return [X + nx*k*side, Y + ny*k*side, t]; });
  const right = half(1), left = half(-1), outline = [...right.map(p => [p[0], p[1]]), ...left.reverse().map(p => [p[0], p[1]])];
  // colour: each leaf its own green, darker at its base; the underside paler and greyer; the oldest browning
  const v = 0.92 + R()*0.14, under = !!c.under, base = under ? flMix(flMix(c.col, [200, 210, 190], 0.28), [128, 128, 128], 0.12) : c.col;
  const [bx, by] = at(0), [tx, ty] = at(1), g = L.pic.createLinearGradient(bx, by, tx, ty);
  g.addColorStop(0, flCss(base, v*0.84)); g.addColorStop(0.5, flCss(base, v)); g.addColorStop(1, flCss(base, v*1.04));
  spcPath(L.pic, outline); L.pic.fillStyle = g; L.pic.fill();
  spcFillAll(L, outline, { h: c.h ?? 0.46, thick: 0.42, gloss: (sp.gloss ?? 0.22)*(under ? 0.5 : 1), face: 0.8 });
  if(len < 4) return;
  L.pic.save(); spcPath(L.pic, outline); L.pic.clip(); L.height.save(); spcPath(L.height, outline); L.height.clip(); L.thick.save(); spcPath(L.thick, outline); L.thick.clip();
  // a soft fall of tone at the edge (a blade is never one flat colour), and the brown of age creeping in at the tip
  L.pic.strokeStyle = flCss(base, 0.78, 0.22); L.pic.lineWidth = W*0.28; spcPath(L.pic, outline); L.pic.stroke();
  if(c.age > 0.05){ const r = len*(0.25 + c.age*0.45), gg = L.pic.createRadialGradient(tx, ty, 0, tx, ty, r); gg.addColorStop(0, flCss(flMix(base, [128, 92, 48], 0.75), 0.9, 0.85*c.age)); gg.addColorStop(1, 'rgba(0,0,0,0)'); L.pic.fillStyle = gg; L.pic.fillRect(tx - r, ty - r, r*2, r*2); }
  // veins: lighter lines on the upper face, raised and plainer beneath
  const vc = flCss(base, under ? 1.18 : 1.12, under ? 0.6 : 0.42), vw = Math.max(0.35, W*0.05);
  const line = (pts, w, ctxs) => { for(const [cx, st] of ctxs){ cx.strokeStyle = st; cx.lineWidth = w; cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])); cx.stroke(); } };
  const veinCtx = w => [[L.pic, vc], [L.height, under ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'], [L.thick, 'rgba(255,255,255,0.18)']];
  const ven = sp.vein || 'pinnate';
  if(ven === 'parallel'){
    for(let k = -3; k <= 3; k++){ const pts = []; for(let i = 0; i <= 24; i++){ const t = i/24, j = Math.min(sh.length - 1, Math.round(t*(sh.length - 1))), w = sh[j][1]*W*(k/4), [X, Y, A] = at(t); pts.push([X - Math.sin(A)*w, Y + Math.cos(A)*w]); }
      line(pts, vw*(k ? 0.45 : 0.8), veinCtx()); }
  } else {
    line(Array.from({ length: 21 }, (_, i) => at(i/20*0.96)), vw, veinCtx());
    if(ven === 'palmate' || ven === 'tripli'){ for(const sd of [-1, 1]) for(const spread of ven === 'palmate' ? [0.55, 1.05] : [0.45]){ const pts = []; for(let i = 0; i <= 12; i++){ const t = i/12, [X, Y, A] = at(t*0.6 + 0.04); pts.push([X - Math.sin(A)*sd*W*spread*Math.sin(t*1.4), Y + Math.cos(A)*sd*W*spread*Math.sin(t*1.4)]); } line(pts, vw*0.6, veinCtx()); } }
    if(ven !== 'none'){ const nv = sp.veins || Math.max(4, Math.round(len/W*2.4));
      for(let k = 1; k < nv; k++){ const t0 = k/nv*0.9 + 0.03; for(const sd of [-1, 1]){ const pts = [], j = Math.min(sh.length - 1, Math.round(Math.max(0, t0)*(sh.length - 1))), ww = Math.max(0.1, sh[j][1])*W;
        for(let i = 0; i <= 8; i++){ const u = i/8, [X, Y, A] = at(Math.min(1, t0 + u*0.22)), off = ww*u*0.86; pts.push([X - Math.sin(A)*off*sd, Y + Math.cos(A)*off*sd]); }
        line(pts, vw*0.45, veinCtx()); } } }
  }
  // the blade's form for the light: its edges fall away from the midrib (or a folded leaf's crease stands)
  L.height.strokeStyle = 'rgba(0,0,0,0.16)'; L.height.lineWidth = W*0.45; spcPath(L.height, outline); L.height.stroke();
  L.pic.restore(); L.height.restore(); L.thick.restore();
}

/** A LEAF of any kind: a stalk then a blade; pinnatifid (poppy), pinnate (rose), finely dissected (cosmos, chamomile,
 *  carrot), ternate (peony, anemone), palmate (buttercup) or trifoliate (clover). */
function spcLeaf(L, R, x, y, a, len, sp, c){
  const stalk = (l, w) => { const pts = []; let X = x, Y = y, A = a; const b = (R() - 0.5)*0.3;
    for(let i = 0; i <= 10; i++){ pts.push({ x: X, y: Y, a: A, w: w*(1 - i/10*0.45) }); A += b/10 + spcAngTo(A, Math.PI/2)*(c.droop || 0)*0.06; X += Math.cos(A)*l/10; Y += Math.sin(A)*l/10; }
    spcBand(L, pts, flMix(c.col, c.stalk || c.col, 0.5), { h: (c.h ?? 0.46) - 0.04, thick: 0.6 }); const e = pts[pts.length - 1]; return [e.x, e.y, e.a]; };
  const pet = sp.pet || 0, kind = sp.kind || 'simple';
  let [X, Y, A] = pet > 0 ? stalk(len*pet, Math.max(0.6, len*0.035)) : [x, y, a];
  const rest = len*(1 - pet);
  // stipules (a rose's winged ones, a clover's papery sheath): a pair of small blades at the stalk's foot
  if(sp.stip){ for(const sd of [-1, 1]) spcBlade(L, R, x, y, a + sd*0.45, len*sp.stip, { shape: 'lanceolate', w: 0.32, vein: 'none' }, { ...c, bend: sd*0.3, under: false, age: 0 }); }
  if(kind === 'simple'){ spcBlade(L, R, X, Y, A, rest, sp, c); return; }
  const sub = { ...sp, kind: sp.sub || 'simple', sub: 'simple', pet: sp.subPet || 0, stip: 0, chevron: false, depth: 1, pairs: sp.subPairs || 2 };
  if(kind === 'pinnatifid' || kind === 'pinnate'){
    // a midrib (winged where the lobes join, bare where leaflets stand apart) and its lobes, alternating a little,
    // reaching forward, shrinking to the tip; a terminal lobe
    const n = sp.pairs || 4, wing = kind === 'pinnatifid' ? (sp.wing || 0.1) : 0;
    const rach = []; { let x2 = X, y2 = Y, A2 = A; const b = c.bend ?? (R() - 0.5)*0.4; for(let i = 0; i <= 24; i++){ rach.push([x2, y2, A2]); A2 += b/24 + spcAngTo(A2, Math.PI/2)*(c.droop || 0)*0.04; x2 += Math.cos(A2)*rest/24; y2 += Math.sin(A2)*rest/24; } }
    if(wing) spcBlade(L, R, X, Y, A, rest, { shape: 'linear', w: wing, vein: 'none', margin: sp.margin, teeth: sp.teeth ? 8 : 0 }, { ...c, bend: c.bend ?? 0 });
    else { const pts = rach.map(([px, py, pa], i) => ({ x: px, y: py, a: pa, w: Math.max(0.5, rest*0.02*(1 - i/30)) })); spcBand(L, pts, c.col, { h: c.h ?? 0.46 }); }
    for(let k = 0; k < n; k++) for(const sd of [-1, 1]){
      const t = (sp.from ?? 0.12) + (k + (sd > 0 ? 0 : 0.35*(kind === 'pinnatifid' ? 1 : 0)))/n*(0.86 - (sp.from ?? 0.12)), [px, py, pa] = rach[Math.min(24, Math.round(t*24))];
      const sz = (sp.lf || 0.38)*rest*(kind === 'pinnatifid' ? (0.75 + 0.35*Math.sin(Math.PI*Math.min(1, t*1.2))) : (0.85 + 0.25*t))*(0.88 + R()*0.24);
      spcLeaf(L, R, px, py, pa + sd*(sp.ang ?? 0.95)*(0.85 + R()*0.3), sz, sub, { ...c, bend: sd*(0.15 + R()*0.25), droop: 0, roll: c.roll });
    }
    const [ex, ey, ea] = rach[24]; spcLeaf(L, R, ex, ey, ea, (sp.lf || 0.38)*rest*(kind === 'pinnate' ? 1.15 : 0.9), sub, { ...c, bend: (R() - 0.5)*0.3, droop: 0 });
    return;
  }
  if(kind === 'dissect'){
    // finely cut, two or three orders, its last segments threads (cosmos, chamomile) or tiny lobes (carrot)
    const order = sp.order || 2, thread = sp.seg !== 'lobe';
    const branch = (bx, by, ba, l, depth) => {
      const pts = []; let x2 = bx, y2 = by, A2 = ba; const b = (R() - 0.5)*0.5;
      for(let i = 0; i <= 12; i++){ pts.push({ x: x2, y: y2, a: A2, w: Math.max(0.35, l*(depth === order ? 0.022 : thread ? 0.05 : 0.03))*(1 - i/16) }); A2 += b/12 + spcAngTo(A2, Math.PI/2)*(c.droop || 0)*0.03; x2 += Math.cos(A2)*l/12; y2 += Math.sin(A2)*l/12; }
      if(depth === 0){ if(thread) spcBand(L, pts, c.col, { h: c.h ?? 0.46, thick: 0.4, gloss: 0.2 }); else spcBlade(L, R, bx, by, ba, l, { shape: 'lanceolate', w: 0.28, vein: 'none' }, { ...c, bend: b }); return; }
      spcBand(L, pts, c.col, { h: c.h ?? 0.46, thick: 0.5 });
      const n = sp.pairs || (depth === order ? 6 : 4);
      for(let k = 0; k < n; k++) for(const sd of [-1, 1]){ const t = 0.12 + (k + (sd > 0 ? 0 : 0.5))/n*0.8, p = pts[Math.min(12, Math.round(t*12))];
        branch(p.x, p.y, p.a + sd*(0.7 + R()*0.35), l*(depth === order ? 0.42 : 0.5)*(1.05 - t*0.6)*(0.85 + R()*0.3), depth - 1); }
      const e = pts[12]; branch(e.x, e.y, e.a + (R() - 0.5)*0.3, l*0.3, depth - 1);
    };
    branch(X, Y, A, rest, order); return;
  }
  if(kind === 'ternate' || kind === 'palmate' || kind === 'trifoliate'){
    // three (or a hand of five) from the stalk's end; ternate twice over for a peony, thrice for an anemone
    const n = kind === 'palmate' ? (sp.lobes || 5) : 3, spread = kind === 'palmate' ? 1.25 : kind === 'trifoliate' ? 1.05 : 0.8;
    for(let k = 0; k < n; k++){ const u = n === 1 ? 0 : k/(n - 1) - 0.5, ang = A + u*2*spread*(0.9 + R()*0.2), l = rest*(sp.lf || 0.6)*(1 - Math.abs(u)*(kind === 'palmate' ? 0.45 : 0.15))*(0.9 + R()*0.2);
      if(kind === 'ternate' && (sp.depth || 1) > 1){ const sl = l*0.38, ex = X + Math.cos(ang)*sl, ey = Y + Math.sin(ang)*sl;
        spcBand(L, [{ x: X, y: Y, a: ang, w: Math.max(0.5, l*0.03) }, { x: ex, y: ey, a: ang, w: Math.max(0.4, l*0.02) }], flMix(c.col, c.stalk || c.col, 0.5), { h: c.h ?? 0.46 });
        spcLeaf(L, R, ex, ey, ang, l*0.7, { ...sp, depth: sp.depth - 1, pet: 0 }, { ...c, bend: u*0.6 }); }
      else spcLeaf(L, R, X, Y, ang, l, sub, { ...c, bend: u*0.5 + (R() - 0.5)*0.2 });
      // (a clover's pale chevron)
      if(kind === 'trifoliate' && sp.chevron){ const cx = X + Math.cos(ang)*l*0.55, cy = Y + Math.sin(ang)*l*0.55, w = l*0.2, pa = ang + Math.PI;
        L.pic.strokeStyle = flCss(flMix(c.col, [235, 240, 220], 0.55), 1, 0.7); L.pic.lineWidth = (l*0.05); L.pic.beginPath();
        L.pic.moveTo(cx + Math.cos(pa + 0.9)*w, cy + Math.sin(pa + 0.9)*w); L.pic.lineTo(cx, cy); L.pic.lineTo(cx + Math.cos(pa - 0.9)*w, cy + Math.sin(pa - 0.9)*w); L.pic.stroke(); } }
    return;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// FLOWERS, BUDS AND FRUIT that Bloom doesn't draw on its own: an involucre's cup of bracts, buds of each kind, a bell
// (bluebell, foxglove), a lavender whorl, a poppy's capsule, Queen Anne's lace in profile
/** The bracts under a composite head seen from the side (a cornflower's urn of fringed scales, a daisy's shallow cup). */
function spcCup(L, R, x, y, a, r, col, kind){
  const urn = kind === 'urn', d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], rows = urn ? 4 : 2;
  for(let row = 0; row < rows; row++) for(let k = -3; k <= 3; k++){ const u = k/3.4, back = urn ? 0.95 - row*0.22 : 0.32 - row*0.12;
    const bx = x - d[0]*r*back + n[0]*u*r*(urn ? 0.36 + row*0.06 : 0.55), by = y - d[1]*r*back + n[1]*u*r*(urn ? 0.36 + row*0.06 : 0.55);
    const ang = a + u*(urn ? 0.35 : 0.9), l = r*(urn ? 0.36 : 0.34);
    spcBlade(L, R, bx, by, ang, l, { shape: urn ? 'scale' : 'lanceolate', w: urn ? 0.55 : 0.3, vein: 'none', margin: urn ? 'dentate' : '', teeth: urn ? 4 : 0, tooth: 0.12 }, { col: flMix(col, [205, 210, 175], urn ? 0.2 : 0.1), h: 0.5, bend: 0, roll: 1, age: 0 });
    if(urn){ const tx = bx + Math.cos(ang)*l*0.92, ty = by + Math.sin(ang)*l*0.92; L.pic.fillStyle = flCss(flMix(col, [110, 80, 50], 0.7), 0.85, 0.8); L.pic.beginPath(); L.pic.ellipse(tx, ty, l*0.3, l*0.12, ang + Math.PI/2, 0, SPC_TAU); L.pic.fill(); } }
}
/** A bud, by its kind: a composite's button of bracts, a poppy's bristly egg, a peony's ball, a pointed bud wrapped in
 *  its sepals (rose, tulip, lily, iris), a bell's (bluebell, foxglove). open: how near opening (the petal showing). */
function spcBud(L, R, x, y, a, r, kind, c, open = 0.3){
  const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], pts = [];
  const prof = { button: [0.2, 0.75, 1, 0.92, 0.55], egg: [0.25, 0.75, 1, 0.82, 0.3], ball: [0.3, 0.85, 1, 0.85, 0.3], point: [0.25, 0.6, 0.62, 0.4, 0.04], long: [0.2, 0.42, 0.44, 0.3, 0.03], bell: [0.2, 0.42, 0.48, 0.38, 0.1] }[kind] || [0.25, 0.75, 1, 0.82, 0.3];
  const lenK = { button: 1.25, egg: 1.6, ball: 1.8, point: 2.3, long: 3.6, bell: 2.4 }[kind] || 1.6;
  const cp = [[0, prof[0]], [0.25, prof[1]], [0.5, prof[2]], [0.75, prof[3]], [1, prof[4]]], sp = spcSpline(cp, 6);
  for(const sd of [1, -1]) for(const [t, w] of sd > 0 ? sp : [...sp].reverse()) pts.push([x + d[0]*t*r*lenK + n[0]*w*r*sd, y + d[1]*t*r*lenK + n[1]*w*r*sd]);
  const green = c.F, col = flMix(green, c.P, kind === 'button' ? open*0.5 : open);
  const g = L.pic.createLinearGradient(x, y, x + d[0]*r*lenK, y + d[1]*r*lenK); g.addColorStop(0, flCss(green, 0.85)); g.addColorStop(0.55, flCss(col, 0.98)); g.addColorStop(1, flCss(flMix(col, c.P, 0.4), 1.05));
  spcPath(L.pic, pts); L.pic.fillStyle = g; L.pic.fill();
  spcFillAll(L, pts, { h: 0.6, thick: 0.85, gloss: 0.3 });
  // its dome for the light, and its seams: sepals' edges, bract scales
  { const cx = x + d[0]*r*lenK*0.5, cy = y + d[1]*r*lenK*0.5, gg = L.height.createRadialGradient(cx, cy, 0, cx, cy, r*lenK*0.6); gg.addColorStop(0, 'rgba(255,255,255,0.25)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    L.height.save(); spcPath(L.height, pts); L.height.clip(); L.height.fillStyle = gg; L.height.fillRect(cx - r*lenK, cy - r*lenK, r*lenK*2, r*lenK*2); L.height.restore(); }
  L.pic.save(); spcPath(L.pic, pts); L.pic.clip(); L.pic.strokeStyle = flCss(green, 0.7, 0.5); L.pic.lineWidth = (r*0.06);
  if(kind === 'button'){ for(let k = 0; k < 7; k++){ const t = 0.25 + (k % 3)*0.22, u = (k/6 - 0.5)*1.6; L.pic.beginPath(); L.pic.ellipse(x + d[0]*t*r*lenK + n[0]*u*r*0.5, y + d[1]*t*r*lenK + n[1]*u*r*0.5, r*0.3, r*0.18, a, 0, Math.PI); L.pic.stroke(); } }
  else for(const u of [-0.45, 0, 0.45]){ L.pic.beginPath(); L.pic.moveTo(x + n[0]*u*r*0.3, y + n[1]*u*r*0.3); L.pic.quadraticCurveTo(x + d[0]*r*lenK*0.6 + n[0]*u*r*0.9, y + d[1]*r*lenK*0.6 + n[1]*u*r*0.9, x + d[0]*r*lenK*0.98, y + d[1]*r*lenK*0.98); L.pic.stroke(); }
  L.pic.restore();
  if(kind === 'egg' && c.hairy) spcHairs(L, R, Array.from({ length: 9 }, (_, i) => ({ x: x + d[0]*i/8*r*lenK, y: y + d[1]*i/8*r*lenK, a, w: r*1.7*Math.sin(Math.PI*Math.min(0.95, 0.15 + i/9)) })), green, r*0.35);
  // (a rose's bud: its feathery sepals reaching past the tip)
  if(c.sepals){ L.pic.strokeStyle = flCss(green, 0.95); for(const sd of [-1, 0.2, 1]){ const sx = x + d[0]*r*lenK*0.55 + n[0]*sd*r*0.5, sy = y + d[1]*r*lenK*0.55 + n[1]*sd*r*0.5;
    L.pic.lineWidth = (r*0.12); L.pic.beginPath(); L.pic.moveTo(sx, sy); L.pic.quadraticCurveTo(sx + d[0]*r*1.4, sy + d[1]*r*1.4, sx + d[0]*r*2 + n[0]*sd*r*0.9, sy + d[1]*r*2 + n[1]*sd*r*0.9); L.pic.stroke();
    L.mask.strokeStyle = '#fff'; L.mask.lineWidth = L.pic.lineWidth; L.mask.beginPath(); L.mask.moveTo(sx, sy); L.mask.quadraticCurveTo(sx + d[0]*r*1.4, sy + d[1]*r*1.4, sx + d[0]*r*2 + n[0]*sd*r*0.9, sy + d[1]*r*2 + n[1]*sd*r*0.9); L.mask.stroke(); } }
}
/** A BELL hanging from its stalk (a = the way its mouth points): a bluebell's narrow tube with its tips curled back, or
 *  a foxglove's wide one with its long spotted lower lip; seen from the side, its mouth a dark opening. */
function spcBell(L, R, x, y, a, len, c, kind){
  const fox = kind === 'foxglove', d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], sd = c.side || 1;
  const prof = fox ? [[0, 0.12], [0.18, 0.2], [0.55, 0.3], [0.86, 0.38], [1, 0.42]] : [[0, 0.1], [0.2, 0.15], [0.6, 0.2], [0.85, 0.22], [0.96, 0.3]];
  const sp = spcSpline(prof, 6), P = (t, w) => [x + d[0]*t*len + n[0]*w*len, y + d[1]*t*len + n[1]*w*len];
  // one side runs on past the mouth (the lip, the curled tip), the other stops short
  const upper = sp.map(([t, w]) => P(t*(fox ? 0.9 : 1), w*sd)), lower = sp.map(([t, w]) => P(t*(fox ? 1.06 : 1), -w*sd));
  const tipU = fox ? [P(0.92, 0.47*sd)] : [P(1.02, 0.36*sd), P(0.95, 0.42*sd)], tipL = fox ? [P(1.14, -0.36*sd), P(1.1, -0.5*sd)] : [P(1.02, -0.36*sd), P(0.95, -0.42*sd)];
  const body = [...upper, ...tipU, ...tipL.reverse(), ...lower.reverse()];
  const g = L.pic.createLinearGradient(x, y, x + d[0]*len, y + d[1]*len); g.addColorStop(0, flCss(flMix(c.P, c.F, 0.25), 0.82)); g.addColorStop(0.6, flCss(c.P, 1)); g.addColorStop(1, flCss(flMix(c.P, c.T, 0.4), 1.05));
  spcPath(L.pic, body); L.pic.fillStyle = g; L.pic.fill();
  spcFillAll(L, body, { h: 0.58, thick: 0.62, gloss: 0.2 });
  L.pic.save(); spcPath(L.pic, body); L.pic.clip();
  // its ribs, and the dark of its mouth
  L.pic.strokeStyle = flCss(c.P, 0.78, 0.35); L.pic.lineWidth = (len*0.015);
  for(const w of [-0.12, 0.05, 0.2]){ L.pic.beginPath(); L.pic.moveTo(...P(0.05, w*0.6)); L.pic.lineTo(...P(0.95, w*1.25)); L.pic.stroke(); }
  const [mx, my] = P(fox ? 0.97 : 0.95, fox ? -0.02*sd : 0); L.pic.fillStyle = flCss(flMix(c.P, c.C, 0.5), 0.45, 0.9); L.pic.beginPath(); L.pic.ellipse(mx, my, len*0.07, len*(fox ? 0.3 : 0.2), a, 0, SPC_TAU); L.pic.fill();
  if(fox){ for(let k = 0; k < 9; k++){ const [sx, sy] = P(0.62 + R()*0.42, (-0.12 - R()*0.28)*sd); L.pic.fillStyle = flCss(flMix(c.T, [255, 255, 255], 0.6), 1, 0.7); L.pic.beginPath(); L.pic.arc(sx, sy, len*0.034, 0, SPC_TAU); L.pic.fill(); L.pic.fillStyle = flCss(c.C, 0.9); L.pic.beginPath(); L.pic.arc(sx, sy, len*0.02, 0, SPC_TAU); L.pic.fill(); } }
  if(!fox){ L.pic.fillStyle = flCss(c.C, 1.1); for(let k = 0; k < 3; k++){ const [ax, ay] = P(0.88, (k - 1)*0.08); L.pic.beginPath(); L.pic.arc(ax, ay, len*0.028, 0, SPC_TAU); L.pic.fill(); } }
  L.pic.restore();
  // its calyx (a foxglove's five pointed sepals; a bluebell's two bracts)
  for(const s2 of fox ? [-1, -0.3, 0.4, 1] : [-1, 1]) spcBlade(L, R, x - d[0]*len*0.02, y - d[1]*len*0.02, a + s2*0.5, len*(fox ? 0.22 : 0.16), { shape: 'lanceolate', w: 0.22, vein: 'none' }, { col: c.F, h: 0.56, bend: s2*0.2, age: 0 });
}
/** A lavender whorl (a verticillaster): its woolly ribbed calyces held up round the stem, a few with their corolla out. */
function spcWhorl(L, R, x, y, a, r, c){
  const n = 7 + Math.floor(R()*4), calyx = flMix(c.P, c.C, 0.45);
  for(let k = 0; k < n; k++){ const u = (k/(n - 1) - 0.5)*2, ang = a + u*0.95 + (R() - 0.5)*0.2, l = r*(0.85 + R()*0.3), front = Math.abs(u) < 0.4;
    const px = x + Math.cos(a + Math.PI/2)*u*r*0.12, py = y + Math.sin(a + Math.PI/2)*u*r*0.12;
    spcBlade(L, R, px, py, ang, l, { shape: 'oblong', w: 0.34, vein: 'parallel' }, { col: flMix(calyx, [140, 140, 150], 0.15), h: front ? 0.62 : 0.52, bend: 0, age: 0 });
    if(R() < 0.45){ const tx = px + Math.cos(ang)*l, ty = py + Math.sin(ang)*l; spcBlade(L, R, tx, ty, ang + (R() - 0.5)*0.6, l*0.5, { shape: 'obovate', w: 0.6, vein: 'none' }, { col: c.P, h: 0.64, bend: 0, age: 0 }); } }
}
/** A poppy's capsule: a smooth urn under its flat lid of stigma rays (the pepper-pot). */
function spcCapsule(L, R, x, y, a, r, c){
  const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], sp = spcSpline([[0, 0.25], [0.3, 0.8], [0.65, 0.95], [0.92, 0.7], [1, 0.62]], 6), pts = [];
  for(const sd of [1, -1]) for(const [t, w] of sd > 0 ? sp : [...sp].reverse()) pts.push([x + d[0]*t*r*1.5 + n[0]*w*r*sd*0.8, y + d[1]*t*r*1.5 + n[1]*w*r*sd*0.8]);
  const col = flMix(c.F, [200, 190, 140], 0.25); spcPath(L.pic, pts); L.pic.fillStyle = flCss(col, 0.95); L.pic.fill(); spcFillAll(L, pts, { h: 0.66, thick: 1, gloss: 0.45 });
  const lx = x + d[0]*r*1.55, ly = y + d[1]*r*1.55; L.pic.fillStyle = flCss(flMix(col, c.C, 0.4), 0.8); L.pic.beginPath(); L.pic.ellipse(lx, ly, r*0.2, r*0.62, a, 0, SPC_TAU); L.pic.fill();
  L.pic.strokeStyle = flCss(col, 1.15); L.pic.lineWidth = (r*0.05); for(let k = -3; k <= 3; k++){ L.pic.beginPath(); L.pic.moveTo(lx, ly); L.pic.lineTo(lx + n[0]*k*r*0.17 + d[0]*r*0.12, ly + n[1]*k*r*0.17 + d[1]*r*0.12); L.pic.stroke(); }
}
/** Queen Anne's lace from the side: rays rising from one point to a flat top of umbellets, the thread-like forked
 *  bracts spreading beneath; or, gone to seed, curled in to a bird's nest. */
function spcUmbelSide(L, R, x, y, a, r, c, nest){
  const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], rays = 18 + Math.floor(R()*10), stalk = flMix(c.F, [200, 200, 170], 0.15);
  // the bracts: forked threads, spreading and bending back
  for(let k = 0; k < 7; k++){ const u = (k/6 - 0.5)*2, ang = a + Math.PI + u*1.2*(nest ? 0.6 : 1) + Math.PI*0.75*Math.sign(u || 1)*(nest ? 0.3 : 0.9);
    spcLeaf(L, R, x, y, a + u*1.25 + (nest ? 0 : Math.sign(u || 1)*0.35), r*0.55, { kind: 'dissect', order: 1, seg: 'thread', pairs: 2 }, { col: c.F, h: 0.5, droop: nest ? 0 : 0.3 }); void ang; }
  const ends = [];
  for(let k = 0; k < rays; k++){ const u = (k + R()*0.5)/rays*2 - 1, top = nest ? 0.55 : 0.85 + (1 - u*u)*0.05, sx = u*(nest ? 0.42*(1 - Math.abs(u)*0.3) : 1)*r;
    const ex = x + d[0]*top*r + n[0]*sx, ey = y + d[1]*top*r + n[1]*sx, mx = x + d[0]*top*r*0.45 + n[0]*sx*(nest ? 1.3 : 0.35), my = y + d[1]*top*r*0.45 + n[1]*sx*(nest ? 1.3 : 0.35);
    for(const [cx, st] of [[L.pic, flCss(stalk, 0.9)], [L.mask, '#fff'], [L.height, spcGrey(0.45)]]){ cx.strokeStyle = st; cx.lineWidth = (r*0.012); cx.beginPath(); cx.moveTo(x, y); cx.quadraticCurveTo(mx, my, ex, ey); cx.stroke(); }
    ends.push([ex, ey]); }
  // the umbellets: a little dome of florets each, white (or the browning seeds of the nest), one dark floret in the middle
  const fl = nest ? flMix(c.F, [150, 120, 80], 0.6) : c.P;
  ends.forEach(([ex, ey], i) => { const m = nest ? 6 : 12, rr = r*(nest ? 0.07 : 0.1);
    for(let k = 0; k < m; k++){ const b = k*2.39996, q = Math.sqrt((k + 0.5)/m)*rr, fx = ex + Math.cos(b)*q, fy = ey + Math.sin(b)*q*0.6 + d[1]*q*0.2, fr = Math.max(0.5, r*0.024);
      L.pic.fillStyle = flCss(fl, 0.9 + R()*0.15); L.pic.beginPath(); L.pic.arc(fx, fy, fr, 0, SPC_TAU); L.pic.fill();
      for(const [cx, st] of [[L.mask, '#fff'], [L.height, spcGrey(0.6)], [L.thick, spcGrey(0.3)], [L.face, spcGrey(0.8)]]){ cx.fillStyle = st; cx.beginPath(); cx.arc(fx, fy, fr, 0, SPC_TAU); cx.fill(); } }
    if(!nest && i === (ends.length >> 1)){ L.pic.fillStyle = flCss(c.C, 1); L.pic.beginPath(); L.pic.arc(ex, ey, Math.max(0.6, r*0.03), 0, SPC_TAU); L.pic.fill(); } });
}
/** ROOTS, down from the base: a fibrous tuft, a taproot, a bulb with its roots, a rhizome, a tuber; or a clean cut. */
function spcRoots(L, R, x, y, a, U, kind, c){
  const col = flMix(c.F, [196, 176, 138], 0.78), down = a + Math.PI;
  const strand = (sx, sy, sa, l, w, depth) => { const pts = []; let X = sx, Y = sy, A = sa;
    for(let i = 0; i <= 10; i++){ pts.push({ x: X, y: Y, a: A, w: w*(1 - i/11) }); A += (R() - 0.5)*0.5 + spcAngTo(A, Math.PI/2)*0.08; X += Math.cos(A)*l/10; Y += Math.sin(A)*l/10; }
    spcBand(L, pts, col, { h: 0.34, thick: 0.75, gloss: 0.1 });
    if(depth > 0) for(let k = 0; k < 3; k++){ const p = pts[2 + Math.floor(R()*7)]; strand(p.x, p.y, p.a + (R() < 0.5 ? -1 : 1)*(0.5 + R()*0.6), l*0.4, w*0.5, depth - 1); } };
  if(kind === 'cut' || kind === 'woodcut'){ const w = c.w0 || U*0.01, d = [Math.cos(down), Math.sin(down)];
    const pts = [[x - d[1]*w/2, y + d[0]*w/2], [x + d[1]*w/2 + d[0]*w*0.7, y - d[0]*w/2 + d[1]*w*0.7], [x + d[0]*w*0.25, y + d[1]*w*0.25]];
    spcPath(L.pic, pts); L.pic.fillStyle = flCss(kind === 'woodcut' ? flMix(col, [220, 200, 160], 0.5) : flMix(c.F, [230, 235, 200], 0.4), 1); L.pic.fill(); spcFillAll(L, pts, { h: 0.42, thick: 0.9 }); return; }
  if(kind === 'bulb' || kind === 'tuber'){ const r = U*(kind === 'bulb' ? 0.045 : 0.035), cx = x, cy = y + r*0.9;
    for(let k = 0; k < 9; k++) strand(cx + (k/8 - 0.5)*r*1.2, cy + r*0.75, Math.PI/2 + (k/8 - 0.5)*1.4, U*(0.06 + R()*0.05), Math.max(0.5, U*0.0025), 0);
    const pts = []; for(let i = 0; i <= 24; i++){ const t = i/24*SPC_TAU, rr = r*(1 + 0.05*Math.sin(t*5)); pts.push([cx + Math.cos(t)*rr*(kind === 'bulb' ? 0.9 : 1.1)*(1 - 0.35*Math.max(0, -Math.sin(t))), cy + Math.sin(t)*rr*(kind === 'bulb' ? 1 : 0.7) - (kind === 'bulb' && Math.sin(t) < -0.6 ? (-Math.sin(t) - 0.6)*r*1.4 : 0)]); }
    const bc = kind === 'bulb' ? flMix(col, [230, 215, 190], 0.4) : flMix(col, [60, 45, 40], 0.65);
    spcPath(L.pic, pts); L.pic.fillStyle = flCss(bc, 0.95); L.pic.fill(); spcFillAll(L, pts, { h: 0.6, thick: 1, gloss: 0.3 });
    if(kind === 'bulb'){ L.pic.strokeStyle = flCss(bc, 0.75, 0.6); L.pic.lineWidth = (r*0.04); for(const u of [-0.5, 0, 0.5]){ L.pic.beginPath(); L.pic.moveTo(cx + u*r*0.2, cy - r*1.2); L.pic.quadraticCurveTo(cx + u*r*1.2, cy, cx + u*r*0.6, cy + r*0.9); L.pic.stroke(); } }
    return; }
  if(kind === 'rhizome'){ const pts = []; for(let i = 0; i <= 12; i++){ const t = i/12; pts.push({ x: x - U*0.08 + t*U*0.16, y: y + U*0.012 + Math.sin(t*5)*U*0.004, a: 0, w: U*0.03*(0.8 + 0.3*Math.sin(t*9)) }); }
    spcBand(L, pts, flMix(col, [150, 120, 90], 0.4), { h: 0.55, thick: 1 }); for(let k = 0; k < 6; k++) strand(x - U*0.07 + k*U*0.028, y + U*0.025, Math.PI/2 + (R() - 0.5)*0.8, U*0.05, Math.max(0.5, U*0.002), 0); return; }
  if(kind === 'tap'){ strand(x, y, Math.PI/2 + (R() - 0.5)*0.3, U*0.18, U*0.016, 1); return; }
  for(let k = 0; k < 11; k++) strand(x + (R() - 0.5)*U*0.01, y, Math.PI/2 + (k/10 - 0.5)*1.6, U*(0.05 + R()*0.07), Math.max(0.5, U*0.003), 1);
}

// ---------------------------------------------------------------------------------------------------------------
// THE HABITS (the doc's §2, species by species): how each grows, what its leaves are, where its flowers stand.
// Lengths are of U, the plant's height. The leaf specs are spcLeaf's; c in a plan is the plant's colours.
const SPC_LEAVES = {
  oxeyeBasal: { kind: 'simple', shape: 'spatulate', w: 0.24, pet: 0.35, margin: 'crenate', teeth: 7, vein: 'pinnate' },
  oxeyeStem:  { kind: 'simple', shape: 'oblong', w: 0.17, margin: 'dentate', teeth: 9, tooth: 0.12, vein: 'pinnate' },
  bellis:     { kind: 'simple', shape: 'spatulate', w: 0.3, pet: 0.2, margin: 'crenate', teeth: 5, vein: 'pinnate' },
  thread:     { kind: 'dissect', order: 2, seg: 'thread', pairs: 4 },
  cosmos:     { kind: 'dissect', order: 2, seg: 'thread', pairs: 5 },
  carrot:     { kind: 'dissect', order: 3, seg: 'lobe', pairs: 3, pet: 0.18 },
  sunflower:  { kind: 'simple', shape: 'cordate', w: 0.52, pet: 0.38, margin: 'serrate', teeth: 14, vein: 'tripli', gloss: 0.15 },
  zinnia:     { kind: 'simple', shape: 'ovate', w: 0.34, vein: 'tripli', gloss: 0.12, tip: 'acuminate' },
  cornLower:  { kind: 'pinnatifid', pairs: 2, wing: 0.07, lf: 0.3, ang: 0.8, sub: 'simple', shape: 'linear', w: 0.14 },
  cornStem:   { kind: 'simple', shape: 'linear', w: 0.07, vein: 'pinnate', veins: 2 },
  poppy:      { kind: 'pinnatifid', pairs: 4, wing: 0.07, lf: 0.32, ang: 0.9, pet: 0.12, sub: 'simple', shape: 'lanceolate', w: 0.3, margin: 'dentate', teeth: 3, tooth: 0.25 },
  anemone:    { kind: 'ternate', depth: 2, pet: 0.45, lf: 0.7, sub: 'pinnatifid', pairs: 2, wing: 0.1, shape: 'lanceolate', w: 0.32, margin: 'incised', teeth: 2 },
  ruff:       { kind: 'pinnatifid', pairs: 2, wing: 0.06, lf: 0.45, ang: 0.7, sub: 'simple', shape: 'linear', w: 0.12 },
  buttercup:  { kind: 'palmate', lobes: 5, pet: 0.6, lf: 0.7, sub: 'pinnatifid', subPairs: 1, wing: 0.1, ang: 0.5, shape: 'wedge', w: 0.4, margin: 'incised', teeth: 2, tooth: 0.35, vein: 'pinnate', veins: 2 },
  buttercupUp:{ kind: 'palmate', lobes: 3, lf: 0.9, sub: 'simple', shape: 'linear', w: 0.1, vein: 'none' },
  rose:       { kind: 'pinnate', pairs: 2, lf: 0.36, ang: 1.05, pet: 0.2, stip: 0.14, sub: 'simple', shape: 'ovate', w: 0.4, margin: 'serrate', teeth: 10, tooth: 0.07, gloss: 0.35, vein: 'pinnate' },
  peony:      { kind: 'ternate', depth: 2, pet: 0.3, lf: 0.85, sub: 'simple', shape: 'lanceolate', w: 0.24, vein: 'pinnate', gloss: 0.4 },
  tulip:      { kind: 'simple', shape: 'strap', w: 0.13, vein: 'parallel', wave: 0.04, gloss: 0.2 },
  lily:       { kind: 'simple', shape: 'lanceolate', w: 0.15, vein: 'parallel', gloss: 0.25 },
  iris:       { kind: 'simple', shape: 'sword', w: 0.075, vein: 'parallel', gloss: 0.18 },
  cherry:     { kind: 'simple', shape: 'ovate', w: 0.36, pet: 0.18, margin: 'double', teeth: 16, tooth: 0.05, tip: 'acuminate', vein: 'pinnate', veins: 9, gloss: 0.3 },
  myosotis:   { kind: 'simple', shape: 'oblong', w: 0.28, vein: 'pinnate', veins: 3 },
  violet:     { kind: 'simple', shape: 'cordate', w: 0.72, pet: 0.58, margin: 'crenate', teeth: 11, tooth: 0.05, vein: 'palmate', gloss: 0.18 },
  bluebell:   { kind: 'simple', shape: 'linear', w: 0.045, vein: 'parallel', gloss: 0.35 },
  foxglove:   { kind: 'simple', shape: 'ovate', w: 0.34, pet: 0.18, margin: 'crenate', teeth: 12, tooth: 0.04, vein: 'pinnate', veins: 8 },
  lavender:   { kind: 'simple', shape: 'linear', w: 0.1, vein: 'none' },
  clover:     { kind: 'trifoliate', pet: 0.5, lf: 0.55, stip: 0.12, chevron: true, sub: 'simple', shape: 'elliptic', w: 0.48, vein: 'pinnate', veins: 6 },
  cloverWhite:{ kind: 'trifoliate', pet: 0.6, lf: 0.5, chevron: true, sub: 'simple', shape: 'obcordate', w: 0.62, margin: 'serrate', teeth: 10, tooth: 0.03, vein: 'pinnate', veins: 6 },
  hydrangea:  { kind: 'simple', shape: 'ovate', w: 0.5, pet: 0.12, margin: 'serrate', teeth: 15, tooth: 0.06, tip: 'acuminate', vein: 'pinnate', veins: 8, gloss: 0.4 },
};

/**
 * Plan one specimen of `key` into `items` (each { z, draw }) in a frame with its base at (0, 0), up the page.
 * U: the plant's height in px. c: { P, T, C, F } its colours (petal, tip, centre, foliage). o: { stage, view, jitter,
 * albedo, light, flat }. Every organ also notes its reach (ext) so the plant can be fitted to its cell.
 */
function spcPlan(key, R, U, c, o){
  const items = [], ext = [], S = FLORA[key] || FLORA.daisy, j = o.jitter;
  const put = (z, draw) => items.push({ z: z + R()*0.01, draw });
  const reach = (x, y, r = 0) => ext.push([x, y, r]);
  const rnd = (a, b) => a + R()*(b - a), pick = arr => arr[Math.floor(R()*arr.length)];
  const stemCol = flMix(c.F, [150, 170, 90], 0.12), wood = flMix(c.F, [96, 70, 54], 0.78);
  const st = o.stage;
  /** A stem from (x, y) heading a, len long: it leans and recovers (tropism up), its tip nods if asked. */
  const grow = (x, y, a, len, w0, w1, g = {}) => {
    const N = 36, pts = []; let X = x, Y = y, A = a; const ph = R()*6.28, ph2 = R()*6.28, f1 = 0.6 + R()*0.9, wob = (g.wob ?? 0.35)*(0.6 + j*0.8), side = g.side || (R() < 0.5 ? -1 : 1);
    for(let i = 0; i <= N; i++){ const t = i/N; pts.push({ x: X, y: Y, a: A, w: w0 + (w1 - w0)*Math.pow(t, 0.7) });
      let dA = wob*(Math.sin(t*f1*6.28 + ph)*0.7 + Math.sin(t*2.7*6.28 + ph2)*0.3)/N*3 + spcAngTo(A, SPC_UP)*(g.up ?? 0.5)*3/N;
      if(g.nod && t > (g.nodAt ?? 0.8)) dA += side*g.nod*Math.PI/((1 - (g.nodAt ?? 0.8))*N);
      if(g.zig && i % Math.max(2, Math.round(N/g.zig)) === 0) dA += (i/Math.max(2, Math.round(N/g.zig)) % 2 ? 1 : -1)*0.14;
      A += dA; X += Math.cos(A)*len/N; Y += Math.sin(A)*len/N; reach(X, Y, w0); }
    return pts; };
  const at = (pts, t) => { const f = Math.min(pts.length - 1 - 1e-6, Math.max(0, t)*(pts.length - 1)), i = Math.floor(f), u = f - i, p = pts[i], q = pts[i + 1];
    return { x: p.x + (q.x - p.x)*u, y: p.y + (q.y - p.y)*u, a: p.a + (q.a - p.a)*u, w: p.w + (q.w - p.w)*u }; };
  const stem = (pts, z = 2, m = {}) => put(z, L => { spcBand(L, pts, m.wood ? wood : stemCol, { h: m.h ?? 0.42, wood: m.wood, thick: m.wood ? 1 : 0.8, gloss: m.wood ? 0.12 : 0.22 });
    if(m.hairs) spcHairs(L, R, pts, stemCol, U*m.hairs, 1); if(m.prickles) spcPrickles(L, R, pts, wood, U*m.prickles);
    if(m.lenticels){ L.pic.strokeStyle = flCss(wood, 1.35, 0.6); for(let i = 2; i < pts.length - 2; i += 2){ if(R() < 0.4) continue; const p = pts[i], w = p.w*0.35, nx = -Math.sin(p.a), ny = Math.cos(p.a), off = (R() - 0.5)*p.w*0.5;
      L.pic.lineWidth = (p.w*0.1); L.pic.beginPath(); L.pic.moveTo(p.x + nx*(off - w), p.y + ny*(off - w)); L.pic.lineTo(p.x + nx*(off + w), p.y + ny*(off + w)); L.pic.stroke(); } } });
  // (which leaf on the sheet is turned over to show its underside: at least one — the RHS's rule)
  let turned = 0;
  const leaf = (x, y, a, len, spec, z = 2.5, m = {}) => { const under = m.under ?? (turned < 1 && R() < 0.3) ? (turned++, true) : false;
    const roll = m.roll ?? (o.flat ? (R() < 0.2 ? 0.25 : 1) : 0.55 + R()*0.45);
    reach(x + Math.cos(a)*len, y + Math.sin(a)*len, len*0.35);
    put(z, L => spcLeaf(L, R, x, y, a, len, spec, { col: m.col || c.F, stalk: stemCol, h: 0.44 + (z - 2)*0.04, roll, under, droop: m.droop ?? 0.15, bend: m.bend, age: m.age ?? 0 })); };
  /** A flower head of the species (Bloom's), at the stalk's tip facing along it: view 0 face-on … 1 profile. */
  const head = (x, y, a, rad, m = {}) => { const view = m.view ?? o.view, sp = m.sp || S;
    reach(x, y, rad*1.1);
    put(m.z ?? 4, L => { if(m.cup && view > 0.35) spcCup(L, R, x, y, a, rad*0.8, c.F, m.cup);
      flDrawBloom(L, R, x, y, rad, { sp, view, stage: m.stage ?? st, spin: R()*SPC_TAU, turn: a + Math.PI/2, jitter: j, flat: false, light: o.light, albedo: o.albedo, cols: [m.P || c.P, c.T, c.C, c.F], stem: false }); }); };
  const bud = (x, y, a, r, kind, m = {}) => { reach(x + Math.cos(a)*r*2.5, y + Math.sin(a)*r*2.5, r); put(m.z ?? 3.6, L => spcBud(L, R, x, y, a, r, kind, { ...c, hairy: m.hairy, sepals: m.sepals }, m.open ?? 0.25)); };
  const roots = (kind, w0) => put(1, L => spcRoots(L, R, 0, 0, SPC_UP, U, kind, { ...c, w0 }));
  /** Leaves up a stem, in the species' arrangement and its size from base to top (down: largest below). */
  const cauline = (pts, spec, n, from, to, len0, len1, arr = 'alt', ang = [0.5, 0.9], m = {}) => {
    let side = R() < 0.5 ? -1 : 1;
    for(let k = 0; k < n; k++){ const t = from + (to - from)*(n === 1 ? 0.5 : k/(n - 1)), p = at(pts, t), l = (len0 + (len1 - len0)*(n === 1 ? 0 : k/(n - 1)))*U*rnd(0.85, 1.15);
      const sides = arr === 'opp' ? [-1, 1] : arr === 'whorl' ? [-1, -0.3, 0.3, 1] : [side];
      for(const sd of sides){ const fore = arr === 'whorl' && Math.abs(sd) < 0.5;
        leaf(p.x, p.y, p.a + sd*rnd(ang[0], ang[1])*(fore ? 0.4 : 1), l*(fore ? 0.6 : 1), spec, R() < 0.5 ? 1.6 : 2.6, { ...m, age: m.age ?? (t < 0.15 ? 0.5*R() : 0), roll: fore ? 0.35 : undefined }); }
      if(arr === 'opp') side = -side; else side = -side*(R() < 0.85 ? 1 : -1); } };
  const rosette = (n, spec, l0, l1, spread = 1.2, m = {}) => { for(let k = 0; k < n; k++){ const u = n === 1 ? 0 : k/(n - 1) - 0.5, a = SPC_UP + u*2*spread + rnd(-0.15, 0.15);
    leaf(rnd(-0.01, 0.01)*U, 0, a, rnd(l0, l1)*U*(1 - Math.abs(u)*0.3), spec, 1.2 + R()*0.3, { ...m, droop: m.droop ?? 0.35, age: m.age ?? (Math.abs(u) > 0.35 ? 0.4*R() : 0) }); } };
  // the stage's mix: younger plants more buds, older more spent flowers and seed
  const stageOf = k => flClamp(st + (R() - 0.5)*0.25 - k*0.08, 0.05, 0.98);
  const lean = rnd(-0.18, 0.18);

  switch(key){
    case 'daisy': {
      if(R() < 0.3){   // the lawn daisy (Bellis): a rosette, bare hairy scapes, heads pink-tipped in bud
        roots('fibrous'); rosette(7 + Math.floor(R()*4), SPC_LEAVES.bellis, 0.22, 0.34, 1.4, { droop: 0.5 });
        for(let k = 0, n = 2 + Math.floor(R()*3); k < n; k++){ const p = grow(rnd(-0.02, 0.02)*U, 0, SPC_UP + (k/(n - 1 || 1) - 0.5)*0.9, U*rnd(0.55, 0.95), U*0.012, U*0.009, { up: 0.6 });
          stem(p, 2, { hairs: 0.006 }); const e = p[p.length - 1]; if(k === n - 1 && st < 0.7) bud(e.x, e.y, e.a, U*0.025, 'button', { open: 0.6 }); else head(e.x, e.y, e.a, U*0.09, { cup: 'cup', stage: stageOf(k) }); } break; }
      roots('fibrous'); rosette(4 + Math.floor(R()*3), SPC_LEAVES.oxeyeBasal, 0.2, 0.28, 1.1);
      for(let k = 0, n = 1 + Math.floor(R()*2.5); k < n; k++){ const p = grow(0, 0, SPC_UP + lean + (k - (n - 1)/2)*0.25, U*rnd(0.75, 1), U*0.014, U*0.008, { up: 0.55 });
        stem(p, 2); cauline(p, SPC_LEAVES.oxeyeStem, 4 + Math.floor(R()*3), 0.1, 0.62, 0.2, 0.07, 'alt', [0.35, 0.7]);
        const e = p[p.length - 1]; if(k > 0 && st < 0.5) bud(e.x, e.y, e.a, U*0.03, 'button'); else head(e.x, e.y, e.a, U*0.105, { cup: 'cup', stage: stageOf(k), view: k ? rnd(0.5, 0.9) : o.view }); }
      break; }
    case 'chamomile': {
      roots('tap');
      const p = grow(0, 0, SPC_UP + lean, U*0.95, U*0.012, U*0.005, { up: 0.5 }); stem(p);
      cauline(p, SPC_LEAVES.thread, 5, 0.08, 0.55, 0.26, 0.12, 'alt', [0.5, 0.9]);
      for(let k = 0, n = 5 + Math.floor(R()*4); k < n; k++){ const t = 0.38 + k/n*0.55, b = at(p, t), sd = k % 2 ? -1 : 1;
        const q = grow(b.x, b.y, b.a + sd*rnd(0.45, 0.8), U*(0.95 - t)*rnd(0.55, 0.9), b.w*0.7, U*0.003, { up: 0.6 }); stem(q, 2.2);
        if(R() < 0.6) cauline(q, SPC_LEAVES.thread, 1, 0.3, 0.3, 0.1, 0.1);
        const e = q[q.length - 1]; if(R() < 0.18 && st < 0.7) bud(e.x, e.y, e.a, U*0.014, 'button'); else head(e.x, e.y, e.a, U*0.045, { stage: stageOf(0), view: rnd(0.55, 0.95) }); }
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.05, { view: rnd(0.6, 0.95) }); break; }
    case 'cosmos': {
      roots('fibrous');
      const p = grow(0, 0, SPC_UP + lean, U*0.7, U*0.014, U*0.008, { up: 0.5 }); stem(p);
      cauline(p, SPC_LEAVES.cosmos, 3, 0.1, 0.8, 0.28, 0.16, 'opp', [0.5, 0.8]);
      const tips = [p[p.length - 1]];
      for(const t of [0.55, 0.85]){ const b = at(p, t), sd = R() < 0.5 ? -1 : 1, q = grow(b.x, b.y, b.a + sd*rnd(0.4, 0.7), U*rnd(0.3, 0.45), b.w*0.75, U*0.005, { up: 0.55 }); stem(q, 2.1);
        cauline(q, SPC_LEAVES.cosmos, 1, 0.15, 0.15, 0.15, 0.15, 'opp'); tips.push(q[q.length - 1]); }
      tips.forEach((e, k) => { const r = U*0.11; if(k === 2 && st < 0.6) bud(e.x, e.y, e.a, r*0.25, 'ball'); else head(e.x, e.y, e.a, r, { cup: 'cup', stage: stageOf(k), view: k === 1 ? rnd(0.5, 0.85) : o.view }); });
      break; }
    case 'sunflower': {
      roots('cut', U*0.04);
      const p = grow(0, 0, SPC_UP + lean, U*0.72, U*0.04, U*0.026, { up: 0.6, nod: 0.18, nodAt: 0.8 }); stem(p, 2, { hairs: 0.006 });
      cauline(p, SPC_LEAVES.sunflower, 4, 0.08, 0.7, 0.42, 0.26, 'alt', [0.75, 1.05], { droop: 0.4 });
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.2, { cup: 'cup', view: rnd(0.35, 0.7) }); break; }
    case 'zinnia': {
      roots('fibrous');
      const p = grow(0, 0, SPC_UP + lean, U*0.82, U*0.02, U*0.012, { up: 0.6 }); stem(p, 2, { hairs: 0.004 });
      cauline(p, SPC_LEAVES.zinnia, 3, 0.1, 0.62, 0.15, 0.1, 'opp', [0.55, 0.85]);
      const b = at(p, 0.55), q = grow(b.x, b.y, b.a + (R() < 0.5 ? -1 : 1)*0.55, U*0.32, b.w*0.8, U*0.009, { up: 0.6 }); stem(q, 2.1);
      cauline(q, SPC_LEAVES.zinnia, 1, 0.25, 0.25, 0.1, 0.1, 'opp');
      const e = p[p.length - 1], e2 = q[q.length - 1];
      head(e.x, e.y, e.a, U*0.12, { cup: 'cup', view: rnd(0.45, 0.8) });
      if(st < 0.55) bud(e2.x, e2.y, e2.a, U*0.03, 'button'); else head(e2.x, e2.y, e2.a, U*0.09, { cup: 'cup', stage: stageOf(1) });
      break; }
    case 'cornflower': {
      roots('tap');
      const p = grow(0, 0, SPC_UP + lean, U*0.9, U*0.01, U*0.005, { up: 0.5, zig: 4 }); stem(p, 2, { hairs: 0.003 });
      cauline(p, SPC_LEAVES.cornLower, 2, 0.04, 0.12, 0.2, 0.18, 'alt', [0.5, 0.8], { col: flMix(c.F, [170, 180, 170], 0.25) });
      cauline(p, SPC_LEAVES.cornStem, 5, 0.2, 0.7, 0.2, 0.1, 'alt', [0.35, 0.6], { col: flMix(c.F, [170, 180, 170], 0.25) });
      const tips = [p[p.length - 1]];
      for(let k = 0, n = 2 + Math.floor(R()*3); k < n; k++){ const t = 0.45 + k/n*0.4, b = at(p, t), q = grow(b.x, b.y, b.a + (k % 2 ? -1 : 1)*rnd(0.4, 0.7), U*(1 - t)*rnd(0.6, 0.85), b.w*0.8, U*0.004, { up: 0.6 }); stem(q, 2.1); tips.push(q[q.length - 1]); }
      tips.forEach((e, k) => { if(k && R() < 0.35) bud(e.x, e.y, e.a, U*0.018, 'egg'); else head(e.x, e.y, e.a, U*0.05, { cup: 'urn', view: k ? rnd(0.65, 0.95) : rnd(0.55, 0.9), stage: stageOf(k) }); });
      break; }
    case 'poppy': {
      roots('tap');
      rosette(3, SPC_LEAVES.poppy, 0.24, 0.32, 0.9);
      const n = 2 + Math.floor(R()*2);
      for(let k = 0; k < n; k++){ const role = k === 0 ? 'flower' : k === 1 ? 'bud' : (st > 0.6 ? 'capsule' : 'bud');
        const p = grow(rnd(-0.01, 0.01)*U, 0, SPC_UP + lean + (k - (n - 1)/2)*0.32, U*rnd(0.7, 0.98), U*0.011, U*0.006, { up: 0.5, nod: role === 'bud' ? 0.95 : 0, nodAt: 0.86 });
        stem(p, 2, { hairs: 0.009 }); if(k === 0) cauline(p, SPC_LEAVES.poppy, 2, 0.12, 0.35, 0.22, 0.18, 'alt', [0.5, 0.8]);
        const e = p[p.length - 1];
        if(role === 'flower') head(e.x, e.y, e.a, U*0.15, { view: rnd(0.3, 0.6), stage: flClamp(st, 0.3, 0.9) });
        else if(role === 'bud') bud(e.x, e.y, e.a, U*0.03, 'egg', { hairy: true, open: 0.15 });
        else put(3.8, L => spcCapsule(L, R, e.x, e.y, e.a, U*0.035, c)); }
      break; }
    case 'anemone': {
      roots('tuber');
      rosette(3 + Math.floor(R()*2), SPC_LEAVES.anemone, 0.26, 0.36, 1.0);
      const p = grow(0, 0, SPC_UP + lean, U*0.88, U*0.012, U*0.009, { up: 0.6 }); stem(p, 2, { hairs: 0.003 });
      { const b = at(p, 0.68); for(const sd of [-1, 0, 1]) leaf(b.x, b.y, b.a + sd*0.95 + rnd(-0.1, 0.1), U*0.15, SPC_LEAVES.ruff, 2.8, { droop: 0.05, roll: sd ? 0.9 : 0.4 }); }
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.14, { view: rnd(0.2, 0.6) }); break; }
    case 'buttercup': {
      roots('fibrous');
      rosette(3 + Math.floor(R()*2), SPC_LEAVES.buttercup, 0.22, 0.3, 1.0);
      const p = grow(0, 0, SPC_UP + lean, U*0.95, U*0.011, U*0.005, { up: 0.5 }); stem(p, 2, { hairs: 0.002 });
      cauline(p, SPC_LEAVES.buttercupUp, 3, 0.35, 0.75, 0.12, 0.06, 'alt', [0.4, 0.7]);
      const tips = [p[p.length - 1]];
      for(let k = 0, n = 3 + Math.floor(R()*3); k < n; k++){ const t = 0.5 + k/n*0.42, b = at(p, t), q = grow(b.x, b.y, b.a + (k % 2 ? -1 : 1)*rnd(0.35, 0.7), U*(1 - t)*rnd(0.6, 1.1), b.w*0.7, U*0.003, { up: 0.6 }); stem(q, 2.1); tips.push(q[q.length - 1]); }
      tips.forEach((e, k) => { if(k > 2 && R() < 0.5) bud(e.x, e.y, e.a, U*0.014, 'ball', { open: 0.1 }); else head(e.x, e.y, e.a, U*0.045, { view: rnd(0.15, 0.85), stage: stageOf(k) }); });
      break; }
    case 'rose': {
      roots('woodcut', U*0.024);
      const p = grow(0, 0, SPC_UP + lean, U*0.82, U*0.024, U*0.013, { up: 0.45, zig: 5 }); stem(p, 2, { wood: true, prickles: 0.018 });
      cauline(p, SPC_LEAVES.rose, 4, 0.12, 0.72, 0.26, 0.2, 'alt', [0.65, 1.0]);
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.13, { view: rnd(0.3, 0.7) });
      const b = at(p, 0.78), q = grow(b.x, b.y, b.a + (R() < 0.5 ? -1 : 1)*0.6, U*0.14, b.w*0.6, U*0.005, { up: 0.5 }); stem(q, 2.2, { wood: true });
      const e2 = q[q.length - 1]; bud(e2.x, e2.y, e2.a, U*0.022, 'point', { sepals: true, open: 0.55 });
      break; }
    case 'peony': {
      roots('cut', U*0.03);
      const p = grow(0, 0, SPC_UP + lean, U*0.76, U*0.03, U*0.02, { up: 0.6 }); stem(p, 2, { h: 0.45 });
      cauline(p, SPC_LEAVES.peony, 3, 0.12, 0.62, 0.42, 0.3, 'alt', [0.7, 1.0], { droop: 0.25 });
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.19, { view: rnd(0.25, 0.6) });
      const b = at(p, 0.7), q = grow(b.x, b.y, b.a + (R() < 0.5 ? -1 : 1)*0.55, U*0.2, b.w*0.6, U*0.01, { up: 0.6 }); stem(q, 2.1);
      const e2 = q[q.length - 1]; bud(e2.x, e2.y, e2.a, U*0.035, 'ball', { open: 0.35 });
      break; }
    case 'tulip': {
      roots('bulb');
      for(let k = 0, n = 2 + Math.floor(R()*2); k < n; k++){ const sd = k % 2 ? -1 : 1;
        leaf(0, -U*0.02*k, SPC_UP + sd*rnd(0.2, 0.5), U*rnd(0.42, 0.58)*(1 - k*0.18), SPC_LEAVES.tulip, k ? 2.6 : 1.4, { droop: 0.35, bend: sd*0.35, col: flMix(c.F, [150, 170, 175], 0.25), roll: rnd(0.55, 1) }); }
      const p = grow(0, 0, SPC_UP + lean, U*0.85, U*0.022, U*0.018, { up: 0.55 }); stem(p, 2, { h: 0.45 });
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.12, { view: rnd(0.7, 0.95) }); break; }
    case 'lily': {
      roots('bulb');
      const p = grow(0, 0, SPC_UP + lean, U*0.78, U*0.02, U*0.012, { up: 0.6 }); stem(p);
      const whorled = R() < 0.4;
      if(whorled) for(const t of [0.18, 0.4, 0.62]) cauline(p, SPC_LEAVES.lily, 1, t, t, 0.2, 0.2, 'whorl', [0.7, 1.1]);
      else cauline(p, SPC_LEAVES.lily, 12, 0.08, 0.76, 0.2, 0.1, 'alt', [0.3, 0.6]);
      const n = 2 + Math.floor(R()*3);
      for(let k = 0; k < n; k++){ const b = at(p, 1), sd = k % 2 ? -1 : 1, q = grow(b.x, b.y, b.a + sd*rnd(0.35, 0.9), U*rnd(0.1, 0.18), U*0.006, U*0.005, { up: 0.1, nod: 0.45, nodAt: 0.4, side: sd }); stem(q, 2.2);
        const e = q[q.length - 1]; if(k >= 2 && st < 0.7) bud(e.x, e.y, e.a, U*0.022, 'long', { open: 0.5 }); else head(e.x, e.y, e.a, U*0.11, { view: rnd(0.6, 0.95), stage: stageOf(k) }); }
      break; }
    case 'iris': {
      roots('rhizome');
      for(let k = 0, n = 5 + Math.floor(R()*3); k < n; k++){ const u = k/(n - 1) - 0.5; leaf(u*U*0.05, U*0.01, SPC_UP + u*0.7 + rnd(-0.06, 0.06), U*rnd(0.48, 0.7)*(1 - Math.abs(u)*0.6), SPC_LEAVES.iris, 1.5 + (Math.abs(u) < 0.2 ? 1.2 : 0), { droop: 0.08, bend: u*0.5, col: flMix(c.F, [150, 170, 175], 0.28), roll: 1, age: Math.abs(u) > 0.4 ? 0.5 : 0, under: false }); }
      const p = grow(0, 0, SPC_UP + lean*0.5, U*0.95, U*0.02, U*0.014, { up: 0.7 }); stem(p, 2.3, { h: 0.45 });
      const spathe = (b, l) => leaf(b.x, b.y, b.a + rnd(-0.25, 0.25), l, { kind: 'simple', shape: 'lanceolate', w: 0.22, vein: 'parallel' }, 3, { col: flMix(c.F, [190, 170, 120], 0.35), droop: 0, roll: 1, under: false });
      const e = p[p.length - 1]; spathe(at(p, 0.93), U*0.08); head(e.x, e.y, e.a, U*0.14, { view: rnd(0.55, 0.85) });
      const b = at(p, 0.62), q = grow(b.x, b.y, b.a + (R() < 0.5 ? -1 : 1)*0.4, U*0.16, b.w*0.7, U*0.009, { up: 0.6 }); stem(q, 2.2); spathe(at(q, 0.6), U*0.06);
      const e2 = q[q.length - 1]; bud(e2.x, e2.y, e2.a, U*0.02, 'long', { open: 0.6 });
      break; }
    case 'cherry': {
      // a flowering twig: woody, tapering, a little zigzag at each bud, with clusters of long-stalked flowers from spurs
      roots('woodcut', U*0.02);
      const p = grow(0, 0, SPC_UP + lean*1.5 + rnd(-0.3, 0.3), U*0.95, U*0.02, U*0.006, { up: 0.25, zig: 7, wob: 0.5 }); stem(p, 2, { wood: true, lenticels: true });
      const side = grow(at(p, 0.4).x, at(p, 0.4).y, at(p, 0.4).a + (R() < 0.5 ? -1 : 1)*0.6, U*0.35, U*0.01, U*0.004, { up: 0.2, zig: 4 }); stem(side, 1.9, { wood: true, lenticels: true });
      const cluster = (b, n) => { const base = [b.x, b.y];
        put(3.2, L => { for(let k = 0; k < 4; k++) spcBlade(L, R, base[0], base[1], b.a + (k - 1.5)*0.5, U*0.012, { shape: 'scale', w: 0.6, vein: 'none' }, { col: flMix(wood, [180, 120, 90], 0.3), h: 0.5, bend: 0, age: 0 }); });
        for(let k = 0; k < n; k++){ const ang = b.a + (k/(n - 1 || 1) - 0.5)*2.2 + rnd(-0.2, 0.2), q = grow(base[0], base[1], ang, U*rnd(0.06, 0.1), U*0.0035, U*0.0025, { up: -0.3, wob: 0.6 });
          stem(q, 3.1); const e = q[q.length - 1]; if(R() < 0.3) bud(e.x, e.y, e.a, U*0.013, 'ball', { open: 0.75 }); else head(e.x, e.y, e.a, U*0.05, { view: rnd(0.1, 0.8), stage: stageOf(0) }); } };
      for(const t of [0.3, 0.55, 0.78, 0.98]) cluster(at(p, t), 2 + Math.floor(R()*3));
      cluster(at(side, 0.95), 2 + Math.floor(R()*2));
      for(const t of [0.65, 0.9]){ const b = at(p, t); leaf(b.x, b.y, b.a + (R() < 0.5 ? -1 : 1)*0.7, U*0.09, SPC_LEAVES.cherry, 3.3, { col: flMix(c.F, [140, 90, 60], 0.25), roll: 0.45, droop: 0.05, under: false }); }
      break; }
    case 'forgetmenot': {
      roots('fibrous');
      const p = grow(0, 0, SPC_UP + lean, U*0.62, U*0.011, U*0.006, { up: 0.5 }); stem(p, 2, { hairs: 0.004 });
      rosette(3, { ...SPC_LEAVES.myosotis, shape: 'oblanceolate', pet: 0.25 }, 0.2, 0.26, 1.0);
      cauline(p, SPC_LEAVES.myosotis, 4, 0.12, 0.6, 0.14, 0.08, 'alt', [0.4, 0.7]);
      // the sprays: each a scorpioid cyme, flowers spaced along it below and buds packed in its coiled tip
      const spray = (b, a0, len) => { const sd = R() < 0.5 ? -1 : 1, q = grow(b.x, b.y, a0, len, U*0.005, U*0.003, { up: 0.3, nod: 1.6, nodAt: 0.75, side: sd }); stem(q, 2.2, { hairs: 0.003 });
        for(let k = 0; k < 11; k++){ const t = 0.3 + k/11*0.7, e = at(q, t), sd2 = k % 2 ? -1 : 1, off = U*(t < 0.75 ? 0.014 : 0.006), px = e.x - Math.sin(e.a)*sd2*off, py = e.y + Math.cos(e.a)*sd2*off;
          if(t < 0.75){ const pq = grow(e.x, e.y, e.a + sd2*1.1, off*1.2, U*0.002, U*0.0015, { up: 0, wob: 0 }); stem(pq, 2.3); head(px, py, e.a + sd2*0.9, U*0.02, { view: rnd(0, 0.35), stage: 0.45, z: 3.5 }); }
          else bud(px, py, e.a + sd2*0.6, U*0.0045*(1.3 - t*0.5), 'ball', { open: 0.8, z: 3.4 }); } };
      spray(p[p.length - 1], p[p.length - 1].a, U*0.36);
      for(const t of [0.55, 0.75]){ const b = at(p, t); spray(b, b.a + (R() < 0.5 ? -1 : 1)*0.6, U*0.24); }
      break; }
    case 'violet': {
      roots('fibrous');
      rosette(6 + Math.floor(R()*3), SPC_LEAVES.violet, 0.3, 0.45, 1.25, { droop: 0.25 });
      for(let k = 0, n = 2 + Math.floor(R()*2); k < n; k++){ const sd = k % 2 ? -1 : 1;
        const p = grow(rnd(-0.01, 0.01)*U, 0, SPC_UP + sd*rnd(0.1, 0.5), U*rnd(0.5, 0.75), U*0.006, U*0.004, { up: 0.5, nod: 0.5, nodAt: 0.88, side: sd }); stem(p, 2.4);
        const b = at(p, 0.55); for(const s2 of [-1, 1]) leaf(b.x, b.y, b.a + s2*0.5, U*0.02, { kind: 'simple', shape: 'linear', w: 0.15, vein: 'none' }, 2.5, { roll: 1 });
        const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.075, { view: rnd(0.25, 0.65), stage: stageOf(k) }); }
      // a runner, rooting at its tip
      { const q = grow(0, 0, (R() < 0.5 ? 0.15 : Math.PI - 0.15), U*0.35, U*0.005, U*0.004, { up: -0.2, wob: 0.4 }); stem(q, 1.1); const e = q[q.length - 1];
        rosette(0, SPC_LEAVES.violet, 0, 0); leaf(e.x, e.y, SPC_UP + 0.3, U*0.14, SPC_LEAVES.violet, 1.3, { droop: 0.2 }); put(1, L => spcRoots(L, R, e.x, e.y, SPC_UP, U*0.4, 'fibrous', c)); }
      break; }
    case 'bluebell': {
      roots('bulb');
      for(let k = 0, n = 3 + Math.floor(R()*3); k < n; k++){ const u = k/(n - 1) - 0.5; leaf(0, 0, SPC_UP + u*1.1 + rnd(-0.1, 0.1), U*rnd(0.5, 0.75), SPC_LEAVES.bluebell, 1.4 + R(), { droop: 0.5, bend: u*0.8, roll: rnd(0.6, 1), under: false }); }
      const sd = R() < 0.5 ? -1 : 1, p = grow(0, 0, SPC_UP + sd*0.08, U*0.95, U*0.012, U*0.006, { up: 0.5, nod: 0.6, nodAt: 0.62, side: sd }); stem(p, 2.2);
      const n = 6 + Math.floor(R()*7);
      for(let k = 0; k < n; k++){ const t = 0.6 + k/(n - 1)*0.4, b = at(p, t), stg = k/(n - 1); // (open from the bottom: buds at the crook's tip)
        const pa = b.a + sd*1.35, px = b.x + Math.cos(pa)*U*0.012, py = b.y + Math.sin(pa)*U*0.012, hang = Math.PI/2 + sd*0.25 + rnd(-0.2, 0.2);
        if(stg > 0.8 && st < 0.8) bud(px, py, b.a + sd*0.3, U*0.009, 'bell', { open: 0.6 });
        else { reach(px + Math.cos(hang)*U*0.07, py + Math.sin(hang)*U*0.07, U*0.03); put(3.5, L => spcBell(L, R, px, py, hang, U*0.09*(1 - stg*0.25), { ...c, side: sd }, 'bluebell')); } }
      break; }
    case 'foxglove': {
      roots('fibrous');
      rosette(5, SPC_LEAVES.foxglove, 0.3, 0.42, 1.25, { droop: 0.35 });
      const sd = R() < 0.5 ? -1 : 1, p = grow(0, 0, SPC_UP + lean*0.5, U*0.98, U*0.022, U*0.006, { up: 0.75, nod: 0.12, nodAt: 0.9, side: sd }); stem(p, 2, { hairs: 0.003 });
      cauline(p, SPC_LEAVES.foxglove, 4, 0.08, 0.4, 0.2, 0.08, 'alt', [0.45, 0.75]);
      const n = 12 + Math.floor(R()*8);
      for(let k = 0; k < n; k++){ const t = 0.45 + k/(n - 1)*0.55, b = at(p, t), stg = k/(n - 1), side = sd*(R() < 0.85 ? 1 : -1);
        const pa = b.a + side*1.3, px = b.x + Math.cos(pa)*U*0.01, py = b.y + Math.sin(pa)*U*0.01;
        if(stg > 0.72) bud(px, py, b.a + side*0.45, U*0.008*(1.4 - stg), 'bell', { open: 0.4 });
        else { const hang = Math.PI/2 - side*0.55 + rnd(-0.15, 0.15), len = U*0.1*(1 - stg*0.45); reach(px + Math.cos(hang)*len, py + Math.sin(hang)*len, len*0.5); put(3.5 - stg*0.2, L => spcBell(L, R, px, py, hang, len, { ...c, side: -side }, 'foxglove')); } }
      break; }
    case 'lavender': {
      roots('woodcut', U*0.018);
      const base = grow(0, 0, SPC_UP + lean, U*0.12, U*0.02, U*0.014, { up: 0.6 }); stem(base, 2, { wood: true });
      const b0 = base[base.length - 1];
      for(let k = 0; k < 6; k++){ const u = k/5 - 0.5; leaf(b0.x, b0.y, SPC_UP + u*2.2, U*rnd(0.07, 0.1), SPC_LEAVES.lavender, 1.5, { col: flMix(c.F, [190, 195, 185], 0.3), droop: 0.1, under: false }); }
      for(let s = 0, ns = 3 + Math.floor(R()*4); s < ns; s++){ const u = s/(ns - 1 || 1) - 0.5, p = grow(b0.x, b0.y, SPC_UP + u*0.55 + rnd(-0.06, 0.06), U*rnd(0.72, 0.88), U*0.006, U*0.004, { up: 0.6, wob: 0.15 }); stem(p, 2.1, { h: 0.4 });
        const b = at(p, 0.12); for(const s2 of [-1, 1]) leaf(b.x, b.y, b.a + s2*0.35, U*0.05, SPC_LEAVES.lavender, 2.2, { col: flMix(c.F, [190, 195, 185], 0.3), droop: 0, under: false });
        // the spike: whorls, the lowest set apart, packed toward the tip
        const nw = 6 + Math.floor(R()*4);
        for(let k = 0; k < nw; k++){ const t = k === 0 ? 0.7 : 0.8 + Math.pow((k - 1)/(nw - 2 || 1), 0.8)*0.2, e = at(p, t); reach(e.x, e.y, U*0.025); put(3.4 + k*0.01, L => spcWhorl(L, R, e.x, e.y, e.a, U*0.022*(1 - k/nw*0.3), c)); } }
      break; }
    case 'clover': {
      const white = R() < 0.35;
      if(white){   // white clover: a creeping stolon rooting at its nodes, leaves and heads on long stalks; old florets a brown skirt
        const q = grow(-U*0.3, 0, rnd(-0.08, 0.08), U*0.65, U*0.008, U*0.006, { up: 0, wob: 0.3 }); stem(q, 1.5);
        for(let k = 0; k < 4; k++){ const b = at(q, 0.15 + k*0.25); put(1, L => spcRoots(L, R, b.x, b.y, SPC_UP, U*0.3, 'fibrous', c));
          leaf(b.x, b.y, SPC_UP + rnd(-0.6, 0.6), U*rnd(0.3, 0.42), SPC_LEAVES.cloverWhite, 2 + R(), { droop: 0.1 });
          if(k % 2 === 0){ const p = grow(b.x, b.y, SPC_UP + rnd(-0.3, 0.3), U*rnd(0.5, 0.75), U*0.005, U*0.004, { up: 0.6 }); stem(p, 2.2); const e = p[p.length - 1];
            head(e.x, e.y, e.a, U*0.07, { view: 0.85, P: k ? flMix(c.P, [150, 120, 90], 0.45) : flMix(c.P, [245, 240, 230], 0.75) }); } }
        break; }
      roots('tap');
      for(let k = 0, n = 2 + Math.floor(R()*2); k < n; k++){ const p = grow(0, 0, SPC_UP + lean + (k - (n - 1)/2)*0.45, U*rnd(0.7, 0.95), U*0.011, U*0.007, { up: 0.5, zig: 4 }); stem(p, 2, { hairs: 0.003 });
        cauline(p, SPC_LEAVES.clover, 3, 0.15, 0.65, 0.34, 0.24, 'alt', [0.6, 1.0]);
        const e = p[p.length - 1];
        // (red clover: a pair of leaves right under the head, like a collar)
        for(const sd of [-1, 1]) leaf(e.x, e.y, e.a + sd*1.0, U*0.15, { ...SPC_LEAVES.clover, pet: 0.15 }, 3, { droop: 0.05 });
        if(k === n - 1 && st < 0.5) bud(e.x, e.y, e.a, U*0.022, 'ball', { open: 0.4 }); else head(e.x, e.y, e.a, U*0.06, { view: rnd(0.55, 0.9), stage: stageOf(k) }); }
      break; }
    case 'queenannes': {
      roots('tap');
      rosette(2, SPC_LEAVES.carrot, 0.3, 0.38, 0.8);
      const p = grow(0, 0, SPC_UP + lean, U*0.9, U*0.014, U*0.008, { up: 0.6 }); stem(p, 2, { hairs: 0.002 });
      cauline(p, SPC_LEAVES.carrot, 2, 0.2, 0.5, 0.26, 0.16, 'alt', [0.6, 0.9]);
      const tips = [[p[p.length - 1], 0.17]];
      for(const t of [0.55, 0.72]){ const b = at(p, t), q = grow(b.x, b.y, b.a + (R() < 0.5 ? -1 : 1)*rnd(0.45, 0.75), U*(1 - t)*rnd(0.7, 0.95), b.w*0.7, U*0.005, { up: 0.6 }); stem(q, 2.1); tips.push([q[q.length - 1], 0.12]); }
      tips.forEach(([e, r], k) => { const nest = k === 2 && st > 0.55, face = !nest && R() < 0.35;
        if(face) head(e.x, e.y, e.a, U*r, { view: rnd(0, 0.3) });
        else { reach(e.x + Math.cos(e.a)*U*r, e.y + Math.sin(e.a)*U*r, U*r); put(4, L => spcUmbelSide(L, R, e.x, e.y, e.a, U*r, c, nest)); } });
      break; }
    case 'hydrangea': {
      roots('woodcut', U*0.026);
      const p = grow(0, 0, SPC_UP + lean, U*0.72, U*0.026, U*0.02, { up: 0.6 }); stem(p, 2, { wood: R() < 0.5 });
      cauline(p, SPC_LEAVES.hydrangea, 3, 0.15, 0.75, 0.32, 0.26, 'opp', [0.75, 1.05], { droop: 0.2 });
      const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.22, { view: rnd(0.25, 0.55) }); break; }
    default: {
      roots('fibrous'); const p = grow(0, 0, SPC_UP + lean, U*0.85, U*0.012, U*0.008); stem(p);
      cauline(p, SPC_LEAVES.oxeyeStem, 4, 0.1, 0.6, 0.2, 0.1); const e = p[p.length - 1]; head(e.x, e.y, e.a, U*0.1); }
  }
  return { items, ext };
}

/** SPECIMEN: one plant, or a sheet of them in cells, each a different plant of its species (or of a habitat's); or
 *  laid on the page (o.page plants), root down, side by side and leaning as a collector lays them on a sheet. */
export function genSpecimen(w, h, o){
  const L = flLayers(w, h), R = mulberry32(o.seed);
  const habitat = FLORA_HABITATS[Math.floor(R()*FLORA_HABITATS.length)];
  const plantOf = (k, many) => { const key = o.species === 'mixed' ? habitat[Math.floor(R()*habitat.length)] : o.species, S = FLORA[key] || FLORA.daisy;
    const cc = o.cols.map((c, q) => c || flHex(S.cols[q])), c = { P: cc[0], T: cc[1], C: cc[2], F: cc[3] }, PR = mulberry32(((o.seed >>> 0) + (k + 1)*104729) >>> 0);
    const plan = spcPlan(key, PR, Math.min(w, h)*0.9, c, { stage: flClamp(o.stage + (many ? (PR() - 0.5)*0.2 : 0)), view: o.view, jitter: o.jitter, albedo: o.albedo, light: o.light, flat: o.flat > 0.5 });
    return { ...plan, PR }; };
  const bounds = (ext, turn) => { const ct = Math.cos(turn), stn = Math.sin(turn); let xa = Infinity, xb = -Infinity, ya = Infinity, yb = -Infinity;
    for(const [x, y, r] of ext){ const X = x*ct - y*stn, Y = x*stn + y*ct; xa = Math.min(xa, X - r); xb = Math.max(xb, X + r); ya = Math.min(ya, Y - r); yb = Math.max(yb, Y + r); }
    return isFinite(xa) ? [xa, xb, ya, yb] : [-1, 1, -1, 1]; };
  const draw = (items, tx, ty, turn, k, clip) => { for(const ctx of Object.values(L)){ ctx.save(); if(clip){ ctx.beginPath(); ctx.rect(...clip); ctx.clip(); } ctx.translate(tx, ty); ctx.rotate(turn); ctx.scale(k, k); }
    items.sort((a, b) => a.z - b.z).forEach(it => it.draw(L)); for(const ctx of Object.values(L)) ctx.restore(); };
  if(o.page){
    // ON THE PAGE: each plant in its own band across the page, as tall as the page lets it (Size), root down near the
    // foot, leaning a little each its own way (Turn leans them all); neighbours may overlap a little, as on a sheet
    const n = Math.max(1, Math.round(o.page)), band = w/n;
    for(let k = 0; k < n; k++){ const { items, ext, PR } = plantOf(k, n > 1), turn = (PR() - 0.5)*0.5 + (o.turn || 0), [xa, xb, ya, yb] = bounds(ext, turn);
      const tall = h*(0.66 + PR()*0.26)*o.size, sc = Math.min(tall/Math.max(1, yb - ya), band*(n > 1 ? 1.5 : 0.9)/Math.max(1, xb - xa));
      const yLo = h*0.03 - ya*sc, yHi = h*0.975 - yb*sc, ty = yHi > yLo ? yLo + (yHi - yLo)*(0.75 + PR()*0.25) : (yLo + yHi)/2;
      const want = (k + 0.5 + (PR() - 0.5)*0.35)*band - (xa + xb)/2*sc, txLo = w*0.02 - xa*sc, txHi = w*0.98 - xb*sc, tx = txHi > txLo ? Math.min(txHi, Math.max(txLo, want)) : (txLo + txHi)/2;
      draw(items, tx, ty, turn, sc, null); }
  }
  const cells = o.page ? 0 : o.cells;
  const cols = cells >= 16 ? 4 : cells >= 8 ? 4 : cells >= 4 ? 2 : 1, rows = cells ? Math.max(1, Math.round(cells/cols)) : 0, cw = w/cols, ch = rows ? h/rows : h;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const many = cells > 1, x0 = i*cw, y0 = j*ch, { items, ext, PR } = plantOf(j*cols + i, many);
    // fit it to its cell: turned a little (curved to fit, the doc's §1.1), scaled down if it reaches past, the base low
    const turn = (many ? (PR() - 0.5)*0.35 : 0) + (o.turn || 0), [xa, xb, ya, yb] = bounds(ext, turn);
    const room = many ? 0.94 : 0.9, k = Math.min(cw*room/Math.max(1, xb - xa), ch*room/Math.max(1, yb - ya))*(many ? 1 : o.size);
    const cx = x0 + (many ? cw/2 : (o.x ?? 0.5)*w) - (xa + xb)/2*k, cy = y0 + (many ? ch/2 : (o.y ?? 0.5)*h) - (ya + yb)/2*k;
    draw(items, cx, cy, turn, k, many ? [x0, y0, cw, ch] : null);
  }
  // (as Bloom: never quite black where the plant is, and its own colour given back at its edge, so no dark rim)
  { const pd = L.pic.getImageData(0, 0, w, h), md = L.mask.getImageData(0, 0, w, h), d = pd.data, m = md.data;
    for(let i = 0; i < d.length; i += 4) if(m[i] > 8){ const k = m[i]/255;
      if(k < 0.97){ const u = 1/Math.max(0.2, k); d[i] = Math.min(255, d[i]*u); d[i + 1] = Math.min(255, d[i + 1]*u); d[i + 2] = Math.min(255, d[i + 2]*u); }
      d[i] = Math.max(d[i], 3*k); d[i + 1] = Math.max(d[i + 1], 3*k); d[i + 2] = Math.max(d[i + 2], 3*k); }
      else d[i] = d[i + 1] = d[i + 2] = 0;
    L.pic.putImageData(pd, 0, 0); }
  return [L.pic.canvas, L.mask.canvas, L.height.canvas, L.thick.canvas, L.cen.canvas, L.ids.canvas, L.gloss.canvas, L.face.canvas];
}

export const SPECIMEN_STEPS = {
  // SPECIMEN: a whole plant of one of Bloom's species, as a herbarium sheet or a botanical plate shows it
  specimen: { cat: 'Marks', label: 'Specimen', ins: ['light from', 'petal hue', 'tip hue', 'center hue', 'foliage hue'], outs: ['picture', 'mask', 'height', 'thickness', 'center', 'petals', 'gloss', 'facing'],
    io: { ins: ['value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field', 'field', 'field', 'field', 'field', 'field', 'field'] },
    params: [[...SPC_R('species', FLORA_SPECIES_LABEL, 0).slice(0, 4), { min: 0, max: 100, bands: FLORA_NAMES.map(nm => nm.replace(' (seeded)', '')) }], SPC_R('view', 'Flowers: Face → Side', 40), SPC_R('stage', 'Stage: Buds → Open → Seed', 50), SPC_R('jitter', 'Jitter', 40),
      SPC_R('size', 'Size', 100, 30, 200), SPC_R('flat', 'Pressed', 0), SPC_R('sheet', 'Sheet: One · 4 · 8 · 16', 0), SPC_R('page', 'On the Page (0: the sheet)', 0, 0, 7), SPC_R('variant', 'Variation', 0, 0, 99), SPC_R('x', 'Across', 50), SPC_R('y', 'Down', 50),
      SPC_R('turn', 'Turn', 50), SPC_R('lit', 'Lit By: Specimen · The Light Engine', 0)], cost: () => 3,
    run(E, n){ const { ww, wh, num } = E, k = Math.min(FLORA_KEYS.length, Math.floor(num(n, 'species', 0)/100*(FLORA_KEYS.length + 1))), d = E.input(n, 1);
      const deg = typeof d === 'number' ? d*360 : (E.ctx.light ?? 315), a = (deg - 90)*Math.PI/180, t = Math.min(1, Math.max(0, (E.ctx.lightTilt ?? 100)/100));
      const hue = j => { const v = E.input(n, j); return Array.isArray(v) && !v.none ? v.map(c => c*255) : null; };   // (an empty hue: the species' own)
      const o = { species: k >= FLORA_KEYS.length ? 'mixed' : FLORA_KEYS[k], view: num(n, 'view', 40)/100, stage: num(n, 'stage', 50)/100, jitter: num(n, 'jitter', 40)/100, size: num(n, 'size', 100)/100,
        flat: num(n, 'flat', 0)/100, cells: [1, 4, 8, 16][Math.min(3, Math.floor(num(n, 'sheet', 0)/100*4))], page: Math.round(num(n, 'page', 0)), light: [Math.cos(a)*t, Math.sin(a)*t, Math.sqrt(Math.max(0.05, 1 - t*t))], cols: [hue(2), hue(3), hue(4), hue(5)],
        seed: ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0) ^ 0x51ec) >>> 0, x: num(n, 'x', 50)/100, y: num(n, 'y', 50)/100, turn: (num(n, 'turn', 50) - 50)/100*Math.PI, albedo: num(n, 'lit', 0) >= 50 };
      const [pic, mask, height, thick, cen, ids, gloss, face] = genSpecimen(ww, wh, o);
      const res = [E.readCanvas(pic), E.asField(E.readCanvas(mask)), E.asField(E.readCanvas(height)), E.asField(E.readCanvas(thick)), E.asField(E.readCanvas(cen)), E.asField(E.readCanvas(ids)), E.asField(E.readCanvas(gloss)), E.asField(E.readCanvas(face))];
      freeCanvas(pic, mask, height, thick, cen, ids, gloss, face); return res; } },
};
