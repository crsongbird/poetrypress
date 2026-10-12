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
 *
 * Each paints at full size in a canvas pass (the page's own textures) and runs
 * on the Athanor's grid otherwise; the same code does both.
 */
import { cpx, lightHeights, kitCanvas, kitPicture, kitField, kitFieldCanvas, kitImage, isCanvasLike } from './texCore.js';

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
  const unit = Math.min(gw, gh), Hs = new Float32Array(gw*gh), rel = o.relief*unit*0.012;
  for(let i = 0; i < Hs.length; i++) Hs[i] = H[i]*rel;
  const L = lightHeights(Hs, gw, gh, { light: deg, relief: 1, gloss: o.gloss, shadow: o.shadow, ao: o.ao, ambient: o.ambient, glossMap });
  const K = new Float32Array(gw*gh), S = new Float32Array(gw*gh), f = L.flat || 1;
  for(let i = 0; i < K.length; i++){ K[i] = L.light[i]/f; S[i] = L.spec[i]; }
  return { K, S };
}
function ltSettings(E, n){
  const dial = E.input(n, 7), deg = typeof dial === 'number' ? dial*360 : (E.ctx.light ?? 315);
  return { deg, relief: E.num(n, 'relief', 50)/100, gloss: E.num(n, 'gloss', 25)/100, shadow: E.num(n, 'shadow', 60)/100,
    ao: E.num(n, 'occlusion', 35)/100, ambient: E.num(n, 'ambient', 35)/100, shine: E.num(n, 'shine', 35)/100 };
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
      // the paint
      px.strokeStyle = col; px.lineWidth = r*1.6; path(px, 0); px.stroke();
      // its bristles: a few threads a little lighter and darker along it
      for(let b = 0; b < 4; b++){ const off = (R() - 0.5)*r*1.3, t = R() < 0.5 ? 0.88 : 1.12;
        px.strokeStyle = `rgba(${Math.round(c[0]*j*t)},${Math.round(c[1]*j*t)},${Math.round(c[2]*j*t)},${0.32*o.amount})`; px.lineWidth = Math.max(cpx(0.5), r*0.14); path(px, off); px.stroke(); }
      // the paint's HEIGHTS: the stroke's body; ridges at its edges where the paint piles; grooves where the bristles dragged
      const body = 115 + R()*40;
      hx.strokeStyle = `rgb(${body|0},${body|0},${body|0})`; hx.lineWidth = r*1.6; path(hx, 0); hx.stroke();
      hx.lineWidth = Math.max(cpx(0.6), r*0.22);
      for(const off of [-r*0.72, r*0.72]){ const g = Math.min(255, body + 28)|0; hx.strokeStyle = `rgb(${g},${g},${g})`; path(hx, off); hx.stroke(); }
      for(let b = 0; b < 3; b++){ const off = (R() - 0.5)*r*1.1, g = Math.max(0, body - 12 - R()*16)|0; hx.strokeStyle = `rgb(${g},${g},${g})`; hx.lineWidth = Math.max(cpx(0.4), r*0.1); path(hx, off); hx.stroke(); }
      // where the brush lifted: a little ridge of paint at the end
      const [ex, ey] = pts[pts.length - 1], g2 = Math.min(255, body + 38)|0; hx.fillStyle = `rgb(${g2},${g2},${g2})`; hx.beginPath(); hx.arc(ex, ey, r*0.55, 0, 6.283); hx.fill();
    }
  }
  return [pc, hc];
}
const oilOpts = (E, n) => ({ size: E.num(n, 'size', 100)/100, length: E.num(n, 'length', 100)/100, detail: E.num(n, 'detail', 50)/100, vary: E.num(n, 'vary', 50)/100, amount: E.num(n, 'amount', 100)/100 });

/** A plain-weave canvas as heights, on a w×h grid (thread every `pitch` px). */
function weaveField(w, h, pitch){
  const f = new Float32Array(w*h), p = Math.max(2, pitch);
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    const u = x/p, v = y/p, cu = Math.floor(u), cv = Math.floor(v), over = (cu + cv) & 1;
    const fu = u - cu, fv = v - cv, a = Math.sin(fu*Math.PI), b = Math.sin(fv*Math.PI);
    f[y*w + x] = over ? 0.35 + 0.65*b*(0.6 + 0.4*a) : 0.35 + 0.65*a*(0.6 + 0.4*b);
  }
  return f;
}

export const LIGHT_STEPS = {
  material: { cat: 'Light & Color', label: 'Light Engine', ins: ['picture', 'height', 'gloss map', 'shade hue', 'highlight hue', 'light hue', 'dial'], outs: ['image', 'light', 'highlight'],
    io: { ins: ['image', 'field', 'field', 'colour', 'colour', 'colour', 'value'], outs: ['image', 'field', 'field'] },
    params: [LT_R('relief', 'Relief', 50), LT_R('gloss', 'Gloss', 25), LT_R('shine', 'Shine', 35), LT_R('shadow', 'Shadow', 60), LT_R('occlusion', 'Occlusion', 35), LT_R('ambient', 'Ambient', 35)],
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
      const { ww, wh, N } = E, o = ltSettings(E, n), M = ltMaterial(E, n);
      const img = E.asImage(E.input(n, 1) ?? 0.5), H = E.asField(E.input(n, 2));
      if(!H) return [img, new Float32Array(N).fill(0.5), new Float32Array(N)];
      const G = E.input(n, 3) != null ? E.asField(E.input(n, 3)) : null;
      const { K, S } = ltLight(H, ww, wh, o.deg, o, G), out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }, lf = new Float32Array(N);
      const ch = [img.r, img.g, img.b], oc = [out.r, out.g, out.b];
      for(let i = 0; i < N; i++){ const s = S[i]*o.shine; lf[i] = ltClamp(K[i]*0.5);
        for(let c = 0; c < 3; c++) oc[c][i] = ch[c][i]*ltK(K[i], M, c) + s*(M ? M.hi[c] : 1); }
      return [out, lf, S]; } },
  oilpaint: { cat: 'Marks', label: 'Oil Paint', ins: ['picture'], outs: ['painting', 'heights'], io: { ins: ['image'], outs: ['image', 'field'] },
    params: [LT_R('amount', 'Amount', 100), LT_R('size', 'Brush Size', 100, 30, 300), LT_R('length', 'Stroke Length', 100, 30, 300), LT_R('detail', 'Detail', 50), LT_R('vary', 'Color Variation', 50)],
    cost: () => 16,
    paint(E, n){ const [src] = kitPicture(E.input(n, 1), E.ww, E.wh); return oilPaint(src, E.ww, E.wh, oilOpts(E, n)); },
    run(E, n){ const v = E.input(n, 1), src = isCanvasLike(v) ? v : kitPicture(v, E.ww, E.wh)[0], [pc, hc] = oilPaint(src, E.ww, E.wh, oilOpts(E, n));
      return [kitImage(pc, E.ww, E.wh), kitField(hc, E.ww, E.wh)]; } },
  canvasweave: { cat: 'Noise', label: 'Canvas Weave', ins: [], outs: ['heights'], params: [LT_R('pitch', 'Thread Size', 100, 30, 400)], cost: () => 2,
    run(E, n){ return [weaveField(E.ww, E.wh, cpx(2.2)*E.num(n, 'pitch', 100)/100/(E.ctx.div > 0 ? E.ctx.div : 1))]; } },
};
