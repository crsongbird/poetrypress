/**
 * floraKit.js — what Bloom and Specimen share (docs/prior-art/botanical-specimens.md): the colour helpers, and the
 * leaves — an outline as a width profile along a bending midrib (SPC_SHAPES), its margin's teeth, its veins, and the
 * kinds a leaf is divided into (pinnatifid, pinnate, finely dissected, ternate, palmate, trifoliate) — with each
 * species' own leaf (SPC_LEAVES), and stems as tapered bands with their hairs or prickles. So a rose in Macro Bloom
 * grows the rose's leaves, as on its specimen sheet (Ruby: "can they share code?").
 */
export const flClamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const flHex = h => { const n = parseInt(String(h || '#808080').replace('#', '').slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const flMix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
export const flCss = (c, k = 1, a = 1) => `rgba(${Math.round(flClamp(c[0]*k, 0, 255))},${Math.round(flClamp(c[1]*k, 0, 255))},${Math.round(flClamp(c[2]*k, 0, 255))},${a})`;
export const SPC_TAU = Math.PI*2, SPC_UP = -Math.PI/2;
export const spcGrey = v => { const g = Math.round(flClamp(v)*255); return `rgb(${g},${g},${g})`; };
export const spcAngTo = (a, b) => { let d = b - a; while(d > Math.PI) d -= SPC_TAU; while(d < -Math.PI) d += SPC_TAU; return d; };

// ---------------------------------------------------------------------------------------------------------------
// LEAF OUTLINES (the doc's §1.4 and §3.3): half an outline as control points [t along the midrib, half-width], drawn
// through a Catmull-Rom spline. A t below 0 reaches back past the stalk (a heart's lobes).
export const SPC_SHAPES = {
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
export function spcSpline(cp, per = 10){
  const out = [], P = [cp[0], ...cp, cp[cp.length - 1]];
  for(let i = 1; i < P.length - 2; i++) for(let k = 0; k < per; k++){ const u = k/per, u2 = u*u, u3 = u2*u;
    const f = j => 0.5*(2*P[i][j] + (-P[i - 1][j] + P[i + 1][j])*u + (2*P[i - 1][j] - 5*P[i][j] + 4*P[i + 1][j] - P[i + 2][j])*u2 + (-P[i - 1][j] + 3*P[i][j] - 3*P[i + 1][j] + P[i + 2][j])*u3);
    out.push([f(0), Math.max(0, f(1))]); }
  out.push(cp[cp.length - 1]);
  return out;
}
export const SPC_SPLINES = Object.fromEntries(Object.entries(SPC_SHAPES).map(([k, v]) => [k, spcSpline(v)]));
/** A margin's teeth (summed triangle waves, the venation paper's way), at u along the edge; a fraction of the width. */
export function spcTooth(kind, u){
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
export function spcPath(ctx, pts){ ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
export function spcFillAll(L, pts, m){
  for(const [k, v] of [['mask', '#fff'], ['height', m.h != null ? spcGrey(m.h) : null], ['thick', m.thick != null ? spcGrey(m.thick) : null], ['gloss', m.gloss != null ? spcGrey(m.gloss) : null], ['face', spcGrey(m.face ?? 0.78)], ['cen', m.cen ? '#fff' : null]]){
    if(!v) continue; spcPath(L[k], pts); L[k].fillStyle = v; L[k].fill(); }
}
/** A tapered band along a line of points ({x, y, a, w}): a stem, a stalk, a thread of a leaf. */
export function spcRibbon(pts, k = 1){
  const l = [], r = [];
  for(const p of pts){ const nx = -Math.sin(p.a), ny = Math.cos(p.a), w = p.w*k/2; l.push([p.x + nx*w, p.y + ny*w]); r.push([p.x - nx*w, p.y - ny*w]); }
  const e = pts[pts.length - 1], tip = [e.x + Math.cos(e.a)*e.w*k*0.3, e.y + Math.sin(e.a)*e.w*k*0.3];
  return [...l, tip, ...r.reverse()];
}
/** Paint a band (a stem): its colour darker at its sides and a lighter line down it (a round stem), as a ridge in height. */
export function spcBand(L, pts, col, m = {}){
  const poly = spcRibbon(pts);
  spcPath(L.pic, poly); L.pic.fillStyle = flCss(col, 0.86); L.pic.fill();
  const inner = spcRibbon(pts, 0.5);
  spcPath(L.pic, inner); L.pic.fillStyle = flCss(col, m.wood ? 1.02 : 1.06, 0.55); L.pic.fill();
  spcFillAll(L, poly, { h: m.h ?? 0.4, thick: m.thick ?? 0.8, gloss: m.gloss ?? 0.22, face: 0.76 });
  spcPath(L.height, inner); L.height.fillStyle = spcGrey((m.h ?? 0.4) + 0.08); L.height.fill();
}
/** Hairs on a stem's outline (a poppy's bristles, a foxglove's down), standing out from it, a little forward. */
export function spcHairs(L, R, pts, col, len, every = 1){
  L.pic.strokeStyle = flCss(col, 1.08, 0.75); L.mask.strokeStyle = '#fff'; L.height.strokeStyle = spcGrey(0.38);
  for(let i = 1; i < pts.length - 1; i += every) for(const sd of [-1, 1]){ if(R() < 0.35) continue;
    const p = pts[i], nx = -Math.sin(p.a)*sd, ny = Math.cos(p.a)*sd, x = p.x + nx*p.w/2, y = p.y + ny*p.w/2, l = len*(0.6 + R()*0.7), fw = 0.35 + R()*0.6;
    const ex = x + (nx + Math.cos(p.a)*fw)*l, ey = y + (ny + Math.sin(p.a)*fw)*l;
    for(const c of [L.pic, L.mask, L.height]){ c.lineWidth = (p.w*0.07); c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); } }
}
/** Prickles on a rose's cane: broad-based, flattened, hooked back down the stem, scattered. */
export function spcPrickles(L, R, pts, col, size){
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
export function spcBlade(L, R, x, y, a, len, sp, c){
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
export function spcLeaf(L, R, x, y, a, len, sp, c){
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
// THE HABITS (the doc's §2, species by species): how each grows, what its leaves are, where its flowers stand.
// Lengths are of U, the plant's height. The leaf specs are spcLeaf's; c in a plan is the plant's colours.
export const SPC_LEAVES = {
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

/** Each species' stem leaf, for a flower drawn with its stem (Bloom's). */
export const SPC_STEM_LEAF = { daisy: 'oxeyeStem', chamomile: 'thread', cosmos: 'cosmos', sunflower: 'sunflower', zinnia: 'zinnia', cornflower: 'cornStem', poppy: 'poppy',
  anemone: 'ruff', buttercup: 'buttercupUp', rose: 'rose', peony: 'peony', tulip: 'tulip', lily: 'lily', iris: 'iris', cherry: 'cherry', forgetmenot: 'myosotis', violet: 'violet',
  bluebell: 'bluebell', foxglove: 'foxglove', lavender: 'lavender', clover: 'clover', queenannes: 'carrot', hydrangea: 'hydrangea' };
