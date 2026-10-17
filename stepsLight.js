/**
 * stepsLight.js — THE ENGINE'S OWN PARTS for the Athanor (Ruby: "we especially
 * need the lighting engine in there since so many other textures depend on
 * it"). The app's lit textures are all made the same way: a picture (what
 * colour the surface is) and its HEIGHTS (how it stands up from the page),
 * lit by the dial. These parts let any graph do that, and give a picture
 * heights to light.
 *
 *   material  LIGHT ENGINE: a picture and its heights lit by the dial, the way
 *             the lit textures are — relief, gloss (or a gloss map: shine in
 *             some places only), cast shadows, occlusion in the crevices,
 *             ambient light; the Shade, Highlight and Light hues colour the
 *             shadows, the shine and the light itself (unwired: the page's
 *             own material hues). Out: the lit picture, the light, the shine.
 *   oilpaint  OIL PAINT: any picture repainted in strokes of oil — big strokes
 *             first, smaller ones where there is detail, each laid along the
 *             picture's forms (Hertzmann's painterly rendering, 1998) — and the
 *             paint's HEIGHTS: ridges where the bristles dragged, paint piled at
 *             a stroke's edges and ends. Wire both into a Light Engine and the
 *             dial lights the impasto.
 *   canvasweave CANVAS: the cloth under a painting, as heights (a plain weave).
 *   strokes   ANGRY STROKES: Painter's Frustration's swipes of paint and their impasto heights.
 *
 * Each paints at full size in a canvas pass (the page's own textures) and runs
 * on the Athanor's grid otherwise; the same code does both.
 */
import { cpx, canonDiv, lightHeights, withLightTilt, kitCanvas, kitPicture, kitField, kitFieldCanvas, kitImage, isCanvasLike, CPU } from './texCore.js';

const LT_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const ltClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
// a hue at the brightness of white: the colour it casts without darkening (as texCore's materials)
const ltHue = c => { const lum = Math.max(0.05, 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]); return c.map(x => Math.min(2.5, x/lum)); };
const ltWhite = c => !c || (c[0] > 0.98 && c[1] > 0.98 && c[2] > 0.98);

/** The material: wired hues (colours 0..1) where given, else the page's own (ctx.mat); null when there is none. */
function ltMaterial(E, n){
  const pick = (port, key) => { const v = E.input(n, port); return Array.isArray(v) ? (ltWhite(v) ? null : ltHue(v)) : (E.ctx.mat && E.ctx.mat[key]) || null; };
  const sh = pick(4, 'sh'), hi = pick(5, 'hi'), di = pick(6, 'di');
  return (sh || hi || di) ? { sh: sh || [1, 1, 1], hi: hi || [1, 1, 1], di } : null;
}
/** The light a pixel gets in channel c, k being its light over open flat ground's (1: flat ground) — as texCore's litK. */
function ltK(k, M, c){
  if(!M) return k;
  const deep = Math.max(0, Math.min(1, 2*(1 - k)));
  const di = M.di ? 1 + (M.di[c] - 1)*Math.min(1, k)*(1 - deep) : 1;
  return k*(1 + (M.sh[c] - 1)*deep)*di;
}
/**
 * THE ENGINE, on a gw×gh grid: heights H (0..1) → { K: light over flat ground's,
 * S: the shine }, from the dial (deg) and the part's settings.
 */
function ltLight(H, gw, gh, deg, o, glossMap){
  const unit = Math.min(gw, gh), Hs = new Float32Array(gw*gh), rel = o.relief*unit*0.03, RM = o.reliefMap;
  for(let i = 0; i < Hs.length; i++) Hs[i] = H[i]*(RM ? RM[i]*unit*0.03 : rel);
  // (a light at its own height, whatever the page's dial says: Ringworld's dial is its camera, and its star its own light)
  const lit = () => lightHeights(Hs, gw, gh, { light: deg, relief: 1, gloss: o.gloss, shadow: o.shadow, ao: o.ao, ambient: o.ambient, glossMap });
  const L = o.tilt == null ? lit() : withLightTilt(o.tilt, lit);
  const K = new Float32Array(gw*gh), S = new Float32Array(gw*gh), f = L.flat || 1;
  for(let i = 0; i < K.length; i++){ K[i] = L.light[i]/f; S[i] = L.spec[i]; }
  // TRANSLUCENCY: light that went in comes out a little way off (subsurface scattering, as wax, jade and skin do):
  // the shading softened by a blur of itself, its shadows lifted, its shine spread wider and dimmer
  if(o.sss > 0){ const r = Math.max(1, Math.round(unit*0.006*(0.5 + o.sss))), B = ltBlur(ltBlur(K, gw, gh, r), gw, gh, r), SB = ltBlur(S, gw, gh, r);
    for(let i = 0; i < K.length; i++){ const k = K[i] + (B[i] - K[i])*o.sss*0.85; K[i] = k + (1 - Math.min(1, k))*0.22*o.sss; S[i] = S[i]*(1 - o.sss*0.5) + SB[i]*o.sss*0.6; } }
  return { K, S };
}
// a box blur on a gw×gh grid (rows, then columns)
function ltBlur(F, gw, gh, r){
  const T = new Float32Array(F.length), O = new Float32Array(F.length);
  for(let y = 0; y < gh; y++){ let s = 0, c = 0; for(let x = 0; x <= r && x < gw; x++){ s += F[y*gw + x]; c++; }
    for(let x = 0; x < gw; x++){ T[y*gw + x] = s/c; const a = x - r, b = x + r + 1; if(a >= 0){ s -= F[y*gw + a]; c--; } if(b < gw){ s += F[y*gw + b]; c++; } } }
  for(let x = 0; x < gw; x++){ let s = 0, c = 0; for(let y = 0; y <= r && y < gh; y++){ s += T[y*gw + x]; c++; }
    for(let y = 0; y < gh; y++){ O[y*gw + x] = s/c; const a = y - r, b = y + r + 1; if(a >= 0){ s -= T[a*gw + x]; c--; } if(b < gh){ s += T[b*gw + x]; c++; } } }
  return O;
}
// (on the grid, `byPoint`: Relief and Gloss may be maps, a value per point; a canvas pass reads them whole)
function ltSettings(E, n, byPoint){
  const dial = E.input(n, 7), deg = typeof dial === 'number' ? dial*360 : (E.ctx.light ?? 315);
  const RM = byPoint ? E.map(n, 'relief', 50) : E.num(n, 'relief', 50), GM = byPoint ? E.map(n, 'gloss', 25) : E.num(n, 'gloss', 25);
  const per = M => { const o = new Float32Array(M.length); for(let i = 0; i < M.length; i++) o[i] = M[i]/100; return o; };
  return { deg, relief: typeof RM === 'number' ? RM/100 : 0.5, gloss: typeof GM === 'number' ? GM/100 : 0.25, shadow: E.num(n, 'shadow', 60)/100,
    ao: E.num(n, 'occlusion', 35)/100, ambient: E.num(n, 'ambient', 35)/100, shine: E.num(n, 'shine', 35)/100, sss: E.num(n, 'translucency', 0)/100,
    tilt: E.P(n, 'from', 'the dial') === 'its own height' ? E.num(n, 'height', 60)/100 : null,
    reliefMap: typeof RM === 'number' ? null : per(RM), glossMap: typeof GM === 'number' ? null : per(GM) };
}

// ---- OIL PAINT: strokes laid along the picture's forms ----
/**
 * The picture (a canvas, w×h) repainted in oil: returns [paint canvas, heights canvas].
 * o: { size (brush, 1 as made), length, detail (0..1: how many smaller strokes), vary (colour jitter), amount (0..1: 0 the picture untouched) }.
 */
function oilPaint(src, w, h, o){
  const R = Math.random, unit = Math.min(w, h);
  const [pc, px] = kitCanvas(w, h), [hc, hx] = kitCanvas(w, h);
  px.drawImage(src, 0, 0, w, h);
  hx.fillStyle = 'rgb(60,60,60)'; hx.fillRect(0, 0, w, h);                    // a thin ground of paint everywhere
  if(!(o.amount > 0)) return [pc, hc];
  // the picture, sampled small: its colours, and its forms (a blurred lightness, and which way it runs)
  const sw = Math.max(48, Math.min(384, Math.round(w/Math.max(1, unit/320)))), sh = Math.max(48, Math.round(sw*h/w));
  const [, sx] = kitCanvas(sw, sh); sx.drawImage(src, 0, 0, sw, sh);
  const d = sx.getImageData(0, 0, sw, sh).data, lumA = new Float32Array(sw*sh);
  for(let i = 0; i < sw*sh; i++) lumA[i] = (0.299*d[i*4] + 0.587*d[i*4+1] + 0.114*d[i*4+2])/255;
  const blur = new Float32Array(sw*sh);
  for(let y = 0; y < sh; y++) for(let x = 0; x < sw; x++){ let s = 0, c = 0;
    for(let j = -2; j <= 2; j++) for(let k = -2; k <= 2; k++){ const yy = Math.min(sh - 1, Math.max(0, y + j)), xx = Math.min(sw - 1, Math.max(0, x + k)); s += lumA[yy*sw + xx]; c++; }
    blur[y*sw + x] = s/c; }
  const at = (a, x, y) => a[Math.min(sh - 1, Math.max(0, y|0))*sw + Math.min(sw - 1, Math.max(0, x|0))];
  // which way a stroke runs at (u, v) in 0..1: along the picture's contours (across its gradient), else a lazy horizontal
  const flowPh = R()*6.28;
  const dirAt = (u, v) => { const x = u*sw, y = v*sh, gx = at(blur, x + 1, y) - at(blur, x - 1, y), gy = at(blur, x, y + 1) - at(blur, x, y - 1), m = Math.hypot(gx, gy);
    const lazy = Math.sin(u*4 + flowPh)*0.35 + Math.sin(v*7 + flowPh*2)*0.2;
    if(m < 0.012) return [Math.cos(lazy), Math.sin(lazy), 0];
    return [-gy/m, gx/m, Math.min(1, m*12)]; };
  const colAt = (u, v) => { const q = (Math.min(sh - 1, Math.max(0, v*sh|0))*sw + Math.min(sw - 1, Math.max(0, u*sw|0)))*4; return [d[q], d[q+1], d[q+2]]; };
  const base = unit*0.03*o.size;
  const passes = [[1, 1], [0.55, 0.35 + o.detail*0.5], [0.3, 0.15 + o.detail*0.6]];
  px.lineCap = 'round'; px.lineJoin = 'round'; hx.lineCap = 'round'; hx.lineJoin = 'round';
  for(const [k, chance] of passes){
    const r = Math.max(cpx(1.2), base*k), step = r*1.25, cols = Math.ceil(w/step), rows = Math.ceil(h/step), cells = [];
    for(let gy = 0; gy < rows; gy++) for(let gx = 0; gx < cols; gx++) cells.push([gx, gy]);
    for(let i = cells.length - 1; i > 0; i--){ const j = Math.floor(R()*(i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }   // laid in no order, as a hand would
    let budget = k === 1 ? Infinity : 7000;
    for(const [gx, gy] of cells){
      const x0 = (gx + R())*step, y0 = (gy + R())*step, u = x0/w, v = y0/h, [dx0, dy0, edge] = dirAt(u, v);
      // the smaller strokes go where there is something to say: edges and detail
      if(k < 1 && R() > chance*(0.35 + edge*1.3)) continue;
      if(budget-- <= 0) break;
      // the stroke: from its middle out both ways, bending with the forms
      // (a stroke stops where the picture's colour changes — Hertzmann's rule — so edges stay where they were)
      const len = r*(2 + R()*3)*o.length, segs = 4, pts = [[x0, y0]], c0 = colAt(u, v), edgeAt = 70 + (1 - o.detail)*60;
      for(const sgn of [1, -1]){ let x = x0, y = y0, ddx = dx0*sgn, ddy = dy0*sgn;
        for(let s = 0; s < segs; s++){ const [ex, ey] = dirAt(x/w, y/h), dot = ex*ddx + ey*ddy, f = dot < 0 ? -1 : 1;
          ddx = ddx*0.6 + ex*f*0.4; ddy = ddy*0.6 + ey*f*0.4; const m = Math.hypot(ddx, ddy) || 1; ddx /= m; ddy /= m;
          const nx2 = x + ddx*len/(segs*2), ny2 = y + ddy*len/(segs*2), cn = colAt(nx2/w, ny2/h);
          if(Math.abs(cn[0] - c0[0]) + Math.abs(cn[1] - c0[1]) + Math.abs(cn[2] - c0[2]) > edgeAt) break;
          x = nx2; y = ny2; sgn > 0 ? pts.push([x, y]) : pts.unshift([x, y]); } }
      if(pts.length < 2){ const [a, b2] = pts[0]; pts.push([a + dx0*r*0.3, b2 + dy0*r*0.3]); }
      const c = c0, j = 1 + (R() - 0.5)*0.12*o.vary, warm = (R() - 0.5)*10*o.vary;
      const col = `rgba(${Math.round(c[0]*j + warm)},${Math.round(c[1]*j)},${Math.round(c[2]*j - warm)},${0.92*o.amount})`;
      const path = (x, off) => { x.beginPath(); pts.forEach(([a, b], q) => { const nx = q < pts.length - 1 ? pts[q+1][1] - b : b - pts[q-1][1], ny = q < pts.length - 1 ? -(pts[q+1][0] - a) : -(a - pts[q-1][0]), m = Math.hypot(nx, ny) || 1;
        const X = a + nx/m*off, Y = b + ny/m*off; q ? x.lineTo(X, Y) : x.moveTo(X, Y); }); };
      // the paint, as the BRUSH lays it (Ruby: "you get to make brushes and paint with them"); the round brush as it always was
      if(o.brush){ oilBrush(px, hx, pts, c, j, warm, r, o, colAt, w, h); continue; }
      px.strokeStyle = col; px.lineWidth = r*1.6; path(px, 0); px.stroke();
      // its bristles: a few threads a little lighter and darker along it
      for(let b = 0; b < 4; b++){ const off = (R() - 0.5)*r*1.3, t = R() < 0.5 ? 0.88 : 1.12;
        px.strokeStyle = `rgba(${Math.round(c[0]*j*t)},${Math.round(c[1]*j*t)},${Math.round(c[2]*j*t)},${0.32*o.amount})`; px.lineWidth = Math.max(cpx(0.5), r*0.14); path(px, off); px.stroke(); }
      // the paint's HEIGHTS: the stroke's body; ridges at its edges where the paint piles; grooves where the bristles dragged.
      // IMPASTO WHERE A PAINTER PUTS IT (Ruby): thick in the lights, thin in the darks ("fat over lean"), and a loaded
      // brush lays most at the start, thinning along the stroke until it lifts and leaves a ridge
      const lum0 = (0.299*c[0] + 0.587*c[1] + 0.114*c[2])/255, tk = 0.6 + 0.8*lum0, H = v => Math.max(0, Math.min(255, 60 + (v - 60)*tk))|0;
      const body = 115 + R()*40, nseg = pts.length - 1;
      hx.lineWidth = r*1.6;
      for(let q = 0; q < nseg; q++){ const g = H(body + 14 - 28*q/Math.max(1, nseg - 1)); hx.strokeStyle = `rgb(${g},${g},${g})`;
        hx.beginPath(); hx.moveTo(pts[q][0], pts[q][1]); hx.lineTo(pts[q + 1][0], pts[q + 1][1]); hx.stroke(); }
      hx.lineWidth = Math.max(cpx(0.6), r*0.22);
      for(const off of [-r*0.72, r*0.72]){ const g = H(body + 28); hx.strokeStyle = `rgb(${g},${g},${g})`; path(hx, off); hx.stroke(); }
      for(let b = 0; b < 3; b++){ const off = (R() - 0.5)*r*1.1, g = H(body - 12 - R()*16); hx.strokeStyle = `rgb(${g},${g},${g})`; hx.lineWidth = Math.max(cpx(0.4), r*0.1); path(hx, off); hx.stroke(); }
      // where the brush lifted: a little ridge of paint at the end
      const [ex, ey] = pts[pts.length - 1], g2 = H(body + 38); hx.fillStyle = `rgb(${g2},${g2},${g2})`; hx.beginPath(); hx.arc(ex, ey, r*0.55, 0, 6.283); hx.fill();
    }
  }
  // DETAIL RESCUED (Ruby: small things, distant trees, were lost): Hertzmann's rule for a finer brush — compare the
  // painting so far with the picture, at a finer grid, and lay small short strokes only where they still differ.
  // It comes after the passes above, so they draw exactly as they did; only where detail was lost is touched.
  if(o.detail > 0){
    const dw = Math.max(64, Math.min(1024, Math.round(w/Math.max(1, unit/900)))), dh = Math.max(64, Math.round(dw*h/w)), sc = w/dw;
    const [, fx] = kitCanvas(dw, dh), [, gx2] = kitCanvas(dw, dh); fx.drawImage(src, 0, 0, dw, dh); gx2.drawImage(pc, 0, 0, dw, dh);
    const F = fx.getImageData(0, 0, dw, dh).data, G = gx2.getImageData(0, 0, dw, dh).data;
    const fcol = (x, y) => { const q = (Math.min(dh - 1, Math.max(0, y|0))*dw + Math.min(dw - 1, Math.max(0, x|0)))*4; return [F[q], F[q+1], F[q+2]]; };
    const r = Math.max(cpx(1.2), base*0.14), step = Math.max(1, r*1.1/sc), T = 46 - o.detail*26;     // the brush, its spacing on the fine grid, how different is "lost"
    const cells = []; for(let y = 0; y < dh; y += step) for(let x = 0; x < dw; x += step) cells.push([x, y]);
    for(let i = cells.length - 1; i > 0; i--){ const j = Math.floor(R()*(i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    let budget = 14000;
    for(const [cx, cy] of cells){
      // the cell's error: how far the painting is from the picture, at its worst point
      let worst = 0, wx = cx, wy = cy;
      for(let j = 0; j < step; j++) for(let k = 0; k < step; k++){ const x = Math.min(dw - 1, cx + k|0), y = Math.min(dh - 1, cy + j|0), q = (y*dw + x)*4;
        const e = Math.abs(F[q] - G[q]) + Math.abs(F[q+1] - G[q+1]) + Math.abs(F[q+2] - G[q+2]); if(e > worst){ worst = e; wx = x; wy = y; } }
      if(worst/3 < T || budget-- <= 0) continue;
      // which way: along the small thing's own outline, from the fine picture (a trunk's stroke runs up it), else the forms'
      const lum = (x, y) => { const q = (Math.min(dh - 1, Math.max(0, y))*dw + Math.min(dw - 1, Math.max(0, x)))*4; return 0.299*F[q] + 0.587*F[q+1] + 0.114*F[q+2]; };
      let gx = 0, gy = 0; for(let j = -1; j <= 1; j++){ gx += lum(wx + 1, wy + j) - lum(wx - 1, wy + j); gy += lum(wx + j, wy + 1) - lum(wx + j, wy - 1); }
      const gm = Math.hypot(gx, gy), [fdx, fdy] = dirAt((wx + 0.5)*sc/w, (wy + 0.5)*sc/h), dx0 = gm > 12 ? -gy/gm : fdx, dy0 = gm > 12 ? gx/gm : fdy;
      const x0 = (wx + 0.5)*sc, y0 = (wy + 0.5)*sc, c = fcol(wx, wy), len = r*(1.4 + R()*2)*o.length, pts = [[x0, y0]];
      // a short stroke, stopped where the picture's colour changes, so the small thing keeps its shape
      for(const sgn of [1, -1]){ let x = x0, y = y0;
        for(let s = 0; s < 2; s++){ const nx2 = x + dx0*sgn*len/4, ny2 = y + dy0*sgn*len/4, cn = fcol(nx2/sc, ny2/sc);
          if(Math.abs(cn[0] - c[0]) + Math.abs(cn[1] - c[1]) + Math.abs(cn[2] - c[2]) > 60) break;
          x = nx2; y = ny2; sgn > 0 ? pts.push([x, y]) : pts.unshift([x, y]); } }
      if(pts.length < 2) pts.push([x0 + dx0*r*0.25, y0 + dy0*r*0.25]);
      const j = 1 + (R() - 0.5)*0.1*o.vary, line = (x, wdt, style) => { x.strokeStyle = style; x.lineWidth = wdt; x.beginPath(); pts.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
      line(px, r*1.5, `rgba(${Math.round(c[0]*j)},${Math.round(c[1]*j)},${Math.round(c[2]*j)},${Math.min(0.95, 1.4*o.amount)})`);
      // its paint is a thin layer ON what lies below (added, not laid over flat), thicker in the lights, with the
      // small ridges a fine brush leaves at its edges and where it lifts
      const lift = (0.6 + 0.8*(0.299*c[0] + 0.587*c[1] + 0.114*c[2])/255)*(0.8 + R()*0.4), add = v => { const g = Math.round(v*lift); return `rgb(${g},${g},${g})`; };
      hx.globalCompositeOperation = 'lighter';
      line(hx, r*1.5, add(12));
      for(const off of [-r*0.6, r*0.6]){ hx.strokeStyle = add(7); hx.lineWidth = Math.max(cpx(0.4), r*0.25); hx.beginPath();
        pts.forEach(([a, b], q) => { const nx = q < pts.length - 1 ? pts[q+1][1] - b : b - pts[q-1][1], ny = q < pts.length - 1 ? -(pts[q+1][0] - a) : -(a - pts[q-1][0]), m = Math.hypot(nx, ny) || 1;
          q ? hx.lineTo(a + nx/m*off, b + ny/m*off) : hx.moveTo(a + nx/m*off, b + ny/m*off); }); hx.stroke(); }
      { const [ex, ey] = pts[pts.length - 1]; hx.fillStyle = add(10); hx.beginPath(); hx.arc(ex, ey, r*0.5, 0, 6.283); hx.fill(); }
      hx.globalCompositeOperation = 'source-over';
    }
  }
  return [pc, hc];
}
const oilOpts = (E, n) => ({ size: E.num(n, 'size', 100)/100, length: E.num(n, 'length', 100)/100, detail: E.num(n, 'detail', 50)/100, vary: E.num(n, 'vary', 50)/100, amount: E.num(n, 'amount', 100)/100,
  brush: Math.min(3, Math.floor(E.num(n, 'brush', 0)/100*4)) });
// THE BRUSHES (the round one is oilPaint's own): one stroke along pts in colour c, its heights on hx.
//   1 · FLAT: a ribbon of even width with square ends, loaded with two tones across it, its bristles' streaks along it
//   2 · PALETTE KNIFE: a short straight plane of paint, crisp-edged, smeared from this colour into the colour where it
//       ends, a lip of paint along one edge where the knife lifted (the geometric painter's tool)
//   3 · DRY BRUSH: little paint on many bristles: broken threads that skip, the ground showing between
function oilBrush(px, hx, pts, c, j, warm, r, o, colAt, w, h){
  const R = Math.random, rgba = (k, a) => `rgba(${Math.round(c[0]*j*k + warm)},${Math.round(c[1]*j*k)},${Math.round(c[2]*j*k - warm)},${a})`;
  const lum0 = (0.299*c[0] + 0.587*c[1] + 0.114*c[2])/255, tk = 0.6 + 0.8*lum0, H = v => { const g = Math.max(0, Math.min(255, 60 + (v - 60)*tk))|0; return `rgb(${g},${g},${g})`; };
  const off = (q, d) => { const [a, b] = pts[q], nx = q < pts.length - 1 ? pts[q+1][1] - b : b - pts[q-1][1], ny = q < pts.length - 1 ? -(pts[q+1][0] - a) : -(a - pts[q-1][0]), m = Math.hypot(nx, ny) || 1; return [a + nx/m*d, b + ny/m*d]; };
  const line = (x, d, wd, style, cap = 'butt') => { x.lineCap = cap; x.strokeStyle = style; x.lineWidth = wd; x.beginPath(); pts.forEach((_, q) => { const [X, Y] = off(q, d); q ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke(); };
  if(o.brush === 1){
    const wd = r*2.1;
    line(px, 0, wd, rgba(1, 0.94*o.amount));
    line(px, -wd*0.3, wd*0.4, rgba(1.12, 0.45*o.amount)); line(px, wd*0.3, wd*0.35, rgba(0.88, 0.4*o.amount));
    for(let b = 0; b < 6; b++){ const d = (R() - 0.5)*wd*0.9; line(px, d, Math.max(cpx(0.5), r*0.08), rgba(R() < 0.5 ? 0.85 : 1.15, 0.3*o.amount)); }
    line(hx, 0, wd, H(130)); line(hx, -wd*0.48, Math.max(cpx(0.6), r*0.2), H(165)); line(hx, wd*0.48, Math.max(cpx(0.6), r*0.2), H(165));
    for(let b = 0; b < 4; b++) line(hx, (R() - 0.5)*wd*0.8, Math.max(cpx(0.4), r*0.08), H(108));
  } else if(o.brush === 2){
    // straight, from the stroke's first point to its last; as wide as a knife's blade is long
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || r, ux = dx/L, uy = dy/L, nx = -uy, ny = ux;
    const wd = r*(1.3 + R()*0.9), skew = (R() - 0.5)*r*0.8, L2 = Math.max(r*2.6, L*1.05), e = colAt(Math.min(1, Math.max(0, bx/w)), Math.min(1, Math.max(0, by/h)));
    const P = [[ax - nx*wd/2, ay - ny*wd/2], [ax + ux*L2 - nx*wd/2 + ux*skew, ay + uy*L2 - ny*wd/2 + uy*skew], [ax + ux*L2 + nx*wd/2, ay + uy*L2 + ny*wd/2], [ax + nx*wd/2 - ux*skew*0.4, ay + ny*wd/2 - uy*skew*0.4]];
    const g = px.createLinearGradient(ax, ay, ax + ux*L2, ay + uy*L2), mixc = t => [0, 1, 2].map(i => Math.round((c[i]*(1 - t) + e[i]*t)*j));
    const [c0, c1] = [mixc(0), mixc(0.55)]; g.addColorStop(0, `rgba(${c0[0] + Math.round(warm)},${c0[1]},${c0[2] - Math.round(warm)},${0.97*o.amount})`); g.addColorStop(1, `rgba(${c1[0]},${c1[1]},${c1[2]},${0.97*o.amount})`);
    const poly = (x, style) => { x.fillStyle = style; x.beginPath(); P.forEach(([X, Y], q) => q ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.closePath(); x.fill(); };
    poly(px, g);
    // drag: the knife's own scrape across the plane, and the lip where it lifted, catching the light
    for(let b = 0; b < 3; b++){ const t = 0.15 + 0.7*R(); px.strokeStyle = rgba(R() < 0.5 ? 0.9 : 1.1, 0.25*o.amount); px.lineWidth = Math.max(cpx(0.4), r*0.06);
      px.beginPath(); px.moveTo(P[0][0] + (P[3][0] - P[0][0])*t, P[0][1] + (P[3][1] - P[0][1])*t); px.lineTo(P[1][0] + (P[2][0] - P[1][0])*t, P[1][1] + (P[2][1] - P[1][1])*t); px.stroke(); }
    px.strokeStyle = rgba(1.22, 0.6*o.amount); px.lineWidth = Math.max(cpx(0.6), r*0.12); px.lineCap = 'butt'; px.beginPath(); px.moveTo(P[1][0], P[1][1]); px.lineTo(P[2][0], P[2][1]); px.stroke();
    poly(hx, H(140)); hx.strokeStyle = H(190); hx.lineWidth = Math.max(cpx(0.7), r*0.18); hx.beginPath(); hx.moveTo(P[1][0], P[1][1]); hx.lineTo(P[2][0], P[2][1]); hx.stroke();
  } else {
    const wd = r*2;
    for(let b = 0; b < 14; b++){ const d = (R() - 0.5)*wd, a = (0.25 + 0.55*R())*o.amount, k = R() < 0.5 ? 0.85 : 1.15;
      px.setLineDash ? px.setLineDash([r*(0.6 + R()*2.2), r*(0.2 + R()*0.9)]) : 0; line(px, d, Math.max(cpx(0.5), r*0.11), rgba(k, a), 'round');
      hx.setLineDash ? hx.setLineDash([r*(0.6 + R()*2), r*0.4]) : 0; line(hx, d, Math.max(cpx(0.4), r*0.1), H(100 + R()*30), 'round'); }
    if(px.setLineDash){ px.setLineDash([]); hx.setLineDash([]); }
  }
  px.lineCap = 'round'; hx.lineCap = 'round';
}

/** A plain-weave canvas as heights, on a w×h grid (thread every `pitch` px). */
function weaveField(w, h, pitch){
  // threads finer than ~3 px can't be drawn, only aliased (a moiré): too fine to see is drawn as flat cloth
  if(pitch < 3) return new Float32Array(w*h).fill(0.5);
  const f = new Float32Array(w*h), p = pitch;
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    const u = x/p, v = y/p, cu = Math.floor(u), cv = Math.floor(v), over = (cu + cv) & 1;
    const fu = u - cu, fv = v - cv, a = Math.sin(fu*Math.PI), b = Math.sin(fv*Math.PI);
    f[y*w + x] = over ? 0.35 + 0.65*b*(0.6 + 0.4*a) : 0.35 + 0.65*a*(0.6 + 0.4*b);
  }
  return f;
}

// ---- ANGRY STROKES (Painter's Frustration): a few fast, loaded swipes of grey paint, each a body with
// bristle striations, fraying at its tail, flung droplets; wet paint mixing, bleeding and running ----
function paintAngryStrokes(w,h,amt,zoom,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // IMPASTO: every stroke also lays down paint THICKNESS on a height map —
  // the body thick, ridges where the paint piles up at its edges, raised
  // bristle lines, drips and droplets. Returns [the painting, its heights];
  // the Light Engine lights them (chains.js 'brushstrokes').
  const hdiv = canonDiv(2), hw = Math.ceil(w/hdiv), hh = Math.ceil(h/hdiv);
  const hcv = document.createElement('canvas'); hcv.width = hw; hcv.height = hh;
  const hx = hcv.getContext('2d', CPU); hx.fillStyle = '#000'; hx.fillRect(0, 0, hw, hh);
  if(hx.setTransform) hx.setTransform(1/hdiv, 0, 0, 1/hdiv, 0, 0);
  hx.globalCompositeOperation = 'lighter'; hx.fillStyle = '#fff'; hx.strokeStyle = '#fff'; hx.lineCap = 'round'; hx.lineJoin = 'round';
  const trace = (g, P) => { g.beginPath(); P.forEach(([x,y],i)=> i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  // WETNESS: 0 is dry paint, drawn exactly as before. Wetter, the paint is
  // thinner (strokes mix where they cross), the bristle marks level out,
  // edges bleed softly into what's under them, and heavy strokes run in drips.
  const wet = Math.max(0, Math.min(1, form==null ? 0 : form));
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle='rgb(128,128,128)'; ctx.fillRect(0,0,w,h);

  // Angry paint. Each stroke is a BODY of paint first — an opaque ribbon laid
  // along a fast, curving swish, blotted where the loaded brush lands — with
  // bristle striations running inside it. Only at the tail, where the paint
  // runs out, does it fray into separate dry streaks, and a few droplets are
  // flung off the end. Dark paint goes down first as an underlayer, light
  // paint is dragged across it, and a few dark accents come last; the bodies
  // are slightly translucent, so where strokes cross the paints mix.
  const unit = Math.min(w,h);
  const n = Math.max(3, Math.round((6 + Math.random()*4) * amt));
  const plan = [];
  for(let i=0;i<n;i++) plan.push(i < n*0.4 ? 'dark' : 'light');
  for(let i=0;i<Math.max(1, Math.round(n*0.2));i++) plan.push('accent');

  for(const kind of plan){
    const tone = kind === 'light' ? 214 + Math.random()*26 : 18 + Math.random()*26;
    const W = unit*(kind === 'accent' ? 0.028 : 0.05 + Math.random()*0.06) * zoom;
    const L = unit*(0.38 + Math.random()*0.5) * (kind === 'accent' ? 0.7 : 1);
    // the swish: a cubic whose handles pull hard to one side
    const a0 = Math.random()*Math.PI*2, bendDir = Math.random()<0.5 ? 1 : -1;
    const x0 = Math.random()*w, y0 = Math.random()*h;
    const x3 = x0 + Math.cos(a0)*L, y3 = y0 + Math.sin(a0)*L;
    // not every swipe is the same arc: a near-straight slash, an S, or a hook
    const gesture = Math.random();
    const k = L*(0.12 + Math.random()*0.4)*bendDir;
    const k2 = gesture < 0.3 ? k*0.15 : gesture < 0.65 ? -k*0.9 : k*1.3;
    const nx = -Math.sin(a0), ny = Math.cos(a0);
    const x1 = x0 + Math.cos(a0)*L*0.3 + nx*k,  y1 = y0 + Math.sin(a0)*L*0.3 + ny*k;
    const x2 = x0 + Math.cos(a0)*L*0.7 + nx*k2, y2 = y0 + Math.sin(a0)*L*0.7 + ny*k2;
    const at = t => { const u=1-t;
      return [u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
              u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]; };
    const N = 90, pts = [];
    for(let s=0;s<=N;s++){
      const t = s/N, [px,py] = at(t), [qx,qy] = at(Math.min(1, t+0.01));
      const len = Math.hypot(qx-px, qy-py) || 1;
      pts.push({ t, x:px, y:py, nx:-(qy-py)/len, ny:(qx-px)/len });
    }
    // pressure: a blot on landing, full through the sweep, lifting at the end
    const dry = 0.55 + Math.random()*0.2;
    // pressure swings hard: loaded and wide on landing, pressing to a peak,
    // then lifting — never the even width of a tube
    const peak = 0.12 + Math.random()*0.2;
    const width = t => W * (t < peak ? 0.75 + 0.55*(t/peak) : 1.3 - 0.75*((t-peak)/(1-peak)))
                         * (t > dry ? Math.pow(1 - (t-dry)/(1-dry), 0.7) : 1);
    // ragged edges that wander slowly, so the outline is torn, not smooth
    const ph1 = Math.random()*6, ph2 = Math.random()*6, ph3 = Math.random()*6;
    const edge = (t, side) => 1 + 0.16*Math.sin(t*9 + (side ? ph1 : ph2)) + 0.07*Math.sin(t*31 + ph3) + (Math.random()-0.5)*0.06;

    // 1. the body, up to where it runs dry
    const left = [], right = [];
    for(const p of pts){ if(p.t > dry) break;
      const hw = width(p.t)/2;
      left.push([p.x + p.nx*hw*edge(p.t,1), p.y + p.ny*hw*edge(p.t,1)]);
      right.push([p.x - p.nx*hw*edge(p.t,0), p.y - p.ny*hw*edge(p.t,0)]); }
    ctx.fillStyle = `rgb(${tone|0},${tone|0},${tone|0})`;
    ctx.globalAlpha = (kind === 'accent' ? 0.9 : 0.78) * (1 - 0.35*wet);
    ctx.beginPath();
    left.forEach(([x,y],i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    for(let i=right.length-1;i>=0;i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath(); ctx.fill();
    // its thickness: the body, and the ridge where the paint piled at its edges
    { const P = left.concat(right.slice().reverse());
      hx.globalAlpha = 0.32*(1 - 0.4*wet); trace(hx, P); hx.closePath(); hx.fill();
      hx.globalAlpha = 0.16*(1 - 0.5*wet); hx.lineWidth = W*0.1; trace(hx, P); hx.closePath(); hx.stroke(); }

    // 2. bristles: striations inside the body, then fraying past the dry point
    const bristles = 14 + Math.floor(Math.random()*14);
    for(let b=0;b<bristles;b++){
      const f = (b/(bristles-1))*2 - 1;
      const shade = tone + (Math.random()-0.5)*110;          // visible striations
      const end = dry + (1-dry)*(0.3 + Math.random()*0.7);   // some give out early
      ctx.strokeStyle = `rgb(${Math.max(0,Math.min(255,shade))|0},${Math.max(0,Math.min(255,shade))|0},${Math.max(0,Math.min(255,shade))|0})`;
      ctx.lineWidth = Math.max(cpx(0.6), W*0.035*(0.6+Math.random()));
      ctx.lineCap = 'round';
      ctx.beginPath(); let on = false;
      for(const p of pts){
        if(p.t > end) break;
        const inTail = p.t > dry;
        if(inTail && Math.random() < (p.t-dry)*2.2){ if(on){ ctx.stroke(); ctx.beginPath(); on=false; } continue; }
        const spread = inTail ? 1 + (p.t-dry)*1.8 : 1;      // the tail fans open
        const off = f * width(p.t)/2 * 0.92 * spread;
        const x = p.x + p.nx*off, y = p.y + p.ny*off;
        on ? ctx.lineTo(x,y) : (ctx.moveTo(x,y), on = true);
      }
      ctx.globalAlpha = 0.5*(1 - 0.75*wet); if(on) ctx.stroke();
      // the bristle's raised line in the paint (redrawn on the height map: same path, stroked again)
    }
    { const nb = 10 + Math.floor(Math.random()*8);
      for(let b=0;b<nb;b++){ const f = (b/(nb-1))*2 - 1; hx.globalAlpha = 0.09*(1 - 0.7*wet); hx.lineWidth = Math.max(cpx(0.6), W*0.03);
        const P = []; for(const p of pts){ if(p.t > dry*1.15) break; const off = f*width(p.t)/2*0.9; P.push([p.x + p.nx*off, p.y + p.ny*off]); }
        if(P.length > 1){ trace(hx, P); hx.stroke(); } } }
    // wet paint runs: drips fall from the body's lower edge, thinning, each
    // ending in a bead
    if(wet > 0.25){
      const drips = Math.floor(Math.random()*(1 + wet*5));
      for(let d=0; d<drips; d++){
        const i = Math.floor(Math.random()*Math.max(1, left.length)), a = left[i], b = right[i];
        if(!a || !b) continue;
        const [sx, sy] = a[1] > b[1] ? a : b;                  // the lower edge
        const len = W*(0.6 + Math.random()*3.2)*wet, dw = W*(0.05 + Math.random()*0.08);
        ctx.fillStyle = `rgb(${tone|0},${tone|0},${tone|0})`; ctx.globalAlpha = 0.7;
        ctx.beginPath();
        const steps = 14, sway = (Math.random()-0.5)*W*0.2;
        for(let s=0; s<=steps; s++){ const t = s/steps; ctx.lineTo(sx + sway*t*t - dw*(1 - 0.5*t)/2, sy + len*t); }
        for(let s=steps; s>=0; s--){ const t = s/steps; ctx.lineTo(sx + sway*t*t + dw*(1 - 0.5*t)/2, sy + len*t); }
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + sway, sy + len, dw*0.55, 0, Math.PI*2); ctx.fill();
        hx.globalAlpha = 0.3; hx.beginPath(); hx.arc(sx + sway, sy + len, dw*0.6, 0, Math.PI*2); hx.fill();
        hx.globalAlpha = 0.18; hx.lineWidth = dw*0.8; hx.beginPath(); hx.moveTo(sx, sy); hx.lineTo(sx + sway, sy + len); hx.stroke();
      }
    }

    // 3. droplets flung off the end of an angry stroke
    const tip = pts[pts.length-1], dx = tip.x - pts[pts.length-6].x, dy = tip.y - pts[pts.length-6].y;
    const dl = Math.hypot(dx,dy) || 1;
    ctx.fillStyle = `rgb(${tone|0},${tone|0},${tone|0})`;
    for(let d=0; d<Math.floor(Math.random()*6); d++){
      const r = W*(0.2 + Math.random()*1.4);
      const dotR = W*(0.03 + Math.random()*0.06);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      const ddx = tip.x + dx/dl*r + (Math.random()-0.5)*W*0.5, ddy = tip.y + dy/dl*r + (Math.random()-0.5)*W*0.5;
      ctx.arc(ddx, ddy, dotR, 0, Math.PI*2);
      ctx.fill();
      hx.globalAlpha = 0.35; hx.beginPath(); hx.arc(ddx, ddy, dotR, 0, Math.PI*2); hx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // wet edges bleed: a soft copy of the whole painting laid over it
  if(wet > 0.01){
    const k = Math.max(4, Math.round(10 - wet*4)), sw = Math.max(1, Math.round(w/k)), sh = Math.max(1, Math.round(h/k));
    const soft = document.createElement('canvas'); soft.width = sw; soft.height = sh;
    const sx = soft.getContext('2d', CPU); sx.imageSmoothingEnabled = true; sx.drawImage(c, 0, 0, sw, sh);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 0.65*wet; ctx.drawImage(soft, 0, 0, w, h); ctx.restore();
  }
  return [c, hcv];
}


export const LIGHT_STEPS = {
  material: { cat: 'Light & Color', label: 'Light Engine', ins: ['picture', 'height', 'gloss map', 'shade hue', 'highlight hue', 'light hue', 'dial'], outs: ['image', 'light', 'highlight'], maps: ['relief:4', 'gloss:4'],
    io: { ins: ['image', 'field', 'field', 'colour', 'colour', 'colour', 'value'], outs: ['image', 'field', 'field'] },
    params: [LT_R('relief', 'Relief', 50, 0, 200), LT_R('gloss', 'Gloss', 25), LT_R('shine', 'Shine', 35), LT_R('shadow', 'Shadow', 60), LT_R('occlusion', 'Occlusion', 35), LT_R('ambient', 'Ambient', 35), LT_R('translucency', 'Translucency', 0),
      ['from', 'Light Height From', 'select', 'the dial', { options: ['the dial', 'its own height'] }], LT_R('height', 'Light Height', 60, 0, 130)],
    cost: () => 10,
    // a canvas pass (full size): light on a grid of at most ~1.2M points, the picture composed at full size
    paint(E, n){
      const { ww: w, wh: h } = E, o = ltSettings(E, n), M = ltMaterial(E, n), hv = E.input(n, 2);
      const [pc, px] = kitPicture(E.input(n, 1), w, h);
      if(hv == null) return [pc, kitFieldCanvas(new Float32Array(4).fill(0.5), 2, 2), kitFieldCanvas(new Float32Array(4), 2, 2)];
      const dv = Math.max(1, Math.ceil(Math.sqrt(w*h/1.2e6))), gw = Math.ceil(w/dv), gh = Math.ceil(h/dv);
      const H = kitField(hv, gw, gh) || kitField(kitFieldCanvas(kitField(hv, w, h) || new Float32Array(w*h).fill(0.5), w, h), gw, gh);
      const G = E.input(n, 3) != null ? kitField(E.input(n, 3), gw, gh) : null;
      const { K, S } = ltLight(H, gw, gh, o.deg, o, G);
      const im = px.getImageData(0, 0, w, h), dd = im.data, sk = o.shine*255;
      for(let y = 0; y < h; y++){ const gy = Math.min(gh - 1.001, (y + 0.5)/dv - 0.5), y0 = Math.max(0, gy|0), fy = Math.max(0, gy - y0), r0 = y0*gw, r1 = Math.min(gh - 1, y0 + 1)*gw;
        for(let x = 0; x < w; x++){ const gx = Math.min(gw - 1.001, (x + 0.5)/dv - 0.5), x0 = Math.max(0, gx|0), fx = Math.max(0, gx - x0), x1 = Math.min(gw - 1, x0 + 1);
          const k = (K[r0 + x0]*(1 - fx) + K[r0 + x1]*fx)*(1 - fy) + (K[r1 + x0]*(1 - fx) + K[r1 + x1]*fx)*fy;
          const s = ((S[r0 + x0]*(1 - fx) + S[r0 + x1]*fx)*(1 - fy) + (S[r1 + x0]*(1 - fx) + S[r1 + x1]*fx)*fy)*sk, q = (y*w + x)*4;
          for(let c = 0; c < 3; c++) dd[q + c] = dd[q + c]*ltK(k, M, c) + s*(M ? M.hi[c] : 1); } }
      px.putImageData(im, 0, 0);
      const lf = new Float32Array(K.length); for(let i = 0; i < K.length; i++) lf[i] = ltClamp(K[i]*0.5);
      return [pc, kitFieldCanvas(lf, gw, gh), kitFieldCanvas(S, gw, gh)]; },
    run(E, n){
      const { ww, wh, N } = E, o = ltSettings(E, n, true), M = ltMaterial(E, n);
      const img = E.asImage(E.input(n, 1) ?? 0.5), H = E.asField(E.input(n, 2));
      if(!H) return [img, new Float32Array(N).fill(0.5), new Float32Array(N)];
      // its gloss map input, else a map on Gloss's ⚙ (both a gloss per point)
      const G = E.input(n, 3) != null ? E.asField(E.input(n, 3)) : o.glossMap;
      const { K, S } = ltLight(H, ww, wh, o.deg, o, G), out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, lf = new Float32Array(N);
      const ch = [img.r, img.g, img.b], oc = [out.r, out.g, out.b];
      for(let i = 0; i < N; i++){ const s = S[i]*o.shine; lf[i] = ltClamp(K[i]*0.5);
        for(let c = 0; c < 3; c++) oc[c][i] = ch[c][i]*ltK(K[i], M, c) + s*(M ? M.hi[c] : 1); }
      return [out, lf, S]; } },
  oilpaint: { cat: 'Marks', label: 'Oil Paint', ins: ['picture'], outs: ['painting', 'heights'], io: { ins: ['image'], outs: ['image', 'field'] },
    params: [LT_R('amount', 'Amount', 100), LT_R('size', 'Brush Size', 100, 30, 300), LT_R('length', 'Stroke Length', 100, 30, 300), LT_R('detail', 'Detail', 50), LT_R('vary', 'Color Variation', 50),
      LT_R('brush', 'Brush: Round · Flat · Knife · Dry', 0)],
    cost: () => 16,
    paint(E, n){ const [src] = kitPicture(E.input(n, 1), E.ww, E.wh); return oilPaint(src, E.ww, E.wh, oilOpts(E, n)); },
    run(E, n){ const v = E.input(n, 1), src = isCanvasLike(v) ? v : kitPicture(v, E.ww, E.wh)[0], [pc, hc] = oilPaint(src, E.ww, E.wh, oilOpts(E, n));
      return [kitImage(pc, E.ww, E.wh), kitField(hc, E.ww, E.wh)]; } },
  strokes: { cat: 'Marks', label: 'Paint Swipes', ins: [], outs: ['painting', 'heights'], io: { outs: ['image', 'field'] },
    params: [LT_R('width', 'Stroke Width', 100, 60, 380), LT_R('count', 'Stroke Count', 100, 20, 260), LT_R('wet', 'Wetness', 0)], cost: () => 6,
    paint(E, n){ return paintAngryStrokes(E.ww, E.wh, E.num(n, 'count', 100)/100, E.num(n, 'width', 100)/100, E.num(n, 'wet', 0)/100); },
    run(E, n){ const [c, hc] = this.paint(E, n); return [kitImage(c, E.ww, E.wh), kitField(hc, E.ww, E.wh)]; } },
  canvasweave: { cat: 'Noise', label: 'Canvas Weave', ins: [], outs: ['heights'], params: [LT_R('pitch', 'Thread Size', 100, 30, 400)], cost: () => 2,
    run(E, n){ return [weaveField(E.ww, E.wh, cpx(2.2)*E.num(n, 'pitch', 100)/100/(E.ctx.div > 0 ? E.ctx.div : 1))]; } },
};
