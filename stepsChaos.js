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
import { makeNoiseGrid, sampleNoiseGrid, wordsRoom, lightHeights, litK, litS, withSeed, kitCanvas, CPU, cpx, canonArea, lightVec, kitWhole, wholeDial, wholeZoom, wholeAmt, wholeShare } from './texCore.js';
import { genSigils, genInkBleed, genTessellate, genBlackHole, genSummoningCircles } from './texChaos.js';

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
function chaosTuring(ww, wh, growth, zoom, form, room){
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
  // ROUND THE WORDS (Shape Aware): where the poem is, the second chemical is killed off, so the pattern grows up to the
  // lines and lies along their edges, as a skin's marks follow a limb's (room: the words' room, on the page's grid)
  const KILL = room ? Float32Array.from({ length: n }, (_, k) => { const x = k % gx, y = (k/gx) | 0, v = room[Math.min(wh - 1, (y + 0.5)/gy*wh | 0)*ww + Math.min(ww - 1, (x + 0.5)/gx*ww | 0)]; return 1 - 0.35*(1 - v); }) : null;
  for(let it = 0; it < iters; it++){
    for(let y = 0; y < gy; y++){
      const yu = ((y - 1 + gy) % gy)*gx, yc = y*gx, yd = ((y + 1) % gy)*gx;
      for(let x = 0; x < gx; x++){
        const xl = x === 0 ? gx - 1 : x - 1, xr = x === gx - 1 ? 0 : x + 1, k = yc + x, a = A[k], b = B[k];
        const la = 0.2*(A[yu + x] + A[yd + x] + A[yc + xl] + A[yc + xr]) + 0.05*(A[yu + xl] + A[yu + xr] + A[yd + xl] + A[yd + xr]) - a;
        const lb = 0.2*(B[yu + x] + B[yd + x] + B[yc + xl] + B[yc + xr]) + 0.05*(B[yu + xl] + B[yu + xr] + B[yd + xl] + B[yd + xr]) - b;
        const abb = a*b*b;
        A2[k] = a + (1.0*la - abb + Fd*(1 - a)); B2[k] = b + (0.5*lb + abb - (Kd + Fd)*b);
        if(KILL) B2[k] *= KILL[k];
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

// Draw a bow along the edge:
// the sand runs from what is moving
// to where nothing moves.
/**
 * Chladni Sand — sand on a plate set ringing by a bow (Chladni, 1787): the
 * sand runs off what moves and gathers on the NODAL LINES, where nothing
 * does. The plate's pattern is the standing wave of a square plate (as Paul
 * Bourke writes it): cos(nπx)cos(mπy) − cos(mπx)cos(nπy), the seed choosing
 * the mode (n, m) and blending a neighbour into it. Each grain is a lit speck
 * with its own small shadow from the dial; a few stray grains still roam.
 * GRAIN SIZE · SAND · MODE (simple, a few lines → complex, many)
 * SAND (the part): the same grains on any gray map wired into Where (they gather where it is white).
 */
function chaosSand(w,h,amt,zoom,light,form,where){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const modeK=Math.max(0,Math.min(1, form==null?0.4:form));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU); ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);
  const unit=Math.min(w,h), aspX=w/unit, aspY=h/unit;
  // the mode: higher MODE, higher n and m
  const lo=1 + Math.round(modeK*6), n=lo + Math.floor(Math.random()*3), m=Math.max(1, n + 1 + Math.floor(Math.random()*(2 + modeK*4)));
  const n2=n + (Math.random()<0.5 ? 1 : 2), m2=m + 1, mix=0.15 + Math.random()*0.35, ph=Math.random()*0.4;
  const plate=(u,v)=>{ const X=u*aspX, Y=v*aspY, P=Math.PI;
    const a=Math.cos(n*P*X)*Math.cos(m*P*Y) - Math.cos(m*P*X)*Math.cos(n*P*Y);
    const b=Math.cos(n2*P*X + ph)*Math.cos(m2*P*Y) - Math.cos(m2*P*X)*Math.cos(n2*P*Y + ph);
    return a*(1-mix) + b*mix; };
  // sand gathers where the plate is still: density from |amplitude|, thin lines
  const lineW=0.045 + 0.035*(1-modeK);
  const count=Math.round(canonArea(w,h)/(3072*3072)*420000*amt);
  const lv=lightVec(light==null?315:light), lm=Math.hypot(lv.lx,lv.ly)||1, sdx=lv.lx/lm, sdy=lv.ly/lm;
  // grains are SPLATTED, not drawn one by one: each adds its area (canonical,
  // so a preview holds the same sand as the export) to the pixels it covers,
  // and its shadow, a little away from the light, to a shadow layer
  const N=w*h, SAND=new Float32Array(N), SH=new Float32Array(N), BR=new Float32Array(N);
  const shOff=cpx(1.2), splat=(arr, x, y, a)=>{ const x0=Math.floor(x), y0=Math.floor(y), fx=x-x0, fy=y-y0;
    if(x0<0||y0<0||x0>=w-1||y0>=h-1) return;
    const i=y0*w+x0; arr[i]+=a*(1-fx)*(1-fy); arr[i+1]+=a*fx*(1-fy); arr[i+w]+=a*(1-fx)*fy; arr[i+w+1]+=a*fx*fy; };
  for(let k=0, tries=0; k<count && tries<count*14; tries++){
    const u=Math.random(), v=Math.random(), am=where ? 0 : plate(u,v), p=where ? where(u,v) : Math.exp(-(am/lineW)*(am/lineW));
    if(Math.random() >= p*0.98 + 0.01) continue;
    k++;
    const r=cpx((0.55 + Math.random()*0.9)*zoom), area=Math.PI*r*r, x=u*w, y=v*h, t=Math.random();
    // a big grain covers several pixels: spread it over its footprint
    if(r > 1.2){ const R=Math.ceil(r); for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ if(dx*dx+dy*dy>r*r) continue; splat(SAND, x+dx, y+dy, 1); splat(BR, x+dx, y+dy, t + (-(dx*sdx+dy*sdy)/r)*0.35); splat(SH, x+dx+sdx*shOff, y+dy+sdy*shOff, 1); } }
    else { splat(SAND, x, y, area); splat(BR, x, y, area*t); splat(SH, x+sdx*shOff, y+sdy*shOff, area); }
  }
  const img=ctx.createImageData(w,h), d=img.data;
  for(let i=0;i<N;i++){
    const sd=Math.min(1, SAND[i]), sh=Math.min(1, SH[i])*(1-sd), br=SAND[i] > 0 ? BR[i]/SAND[i] : 0;
    const sand=200 + br*45, v=128*(1 - sh*0.45) + (sand - 128)*sd;
    const q=i*4; d[q]=d[q+1]=d[q+2]=v<0?0:v>255?255:v; d[q+3]=255;
  }
  ctx.putImageData(img,0,0);
  return c;
}

// Counting backwards from
// a number nobody wrote down.
// The grid keeps the score.
// BIT GRID (Binary Pattern's marks): a grid of small marks (filled and empty squares, dashes, bars) that surface
// wherever a field rises past a gate. The field is its own soft noise, or any gray map wired into Where.
function chaosBitGrid(w, h, amt, zoom, where){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
  const cell = Math.max(cpx(6), Math.round((Math.max(w, h)/72)*zoom));    // floor in canonical pixels
  const cols = Math.ceil(w/cell), rows = Math.ceil(h/cell);
  const gw = Math.max(2, Math.round(cols/6)), gh = Math.max(2, Math.round(rows/6));
  const field = where ? null : makeNoiseGrid(gw, gh);
  for(let ry = 0; ry < rows; ry++){
    for(let rx = 0; rx < cols; rx++){
      const n = where ? where(rx/cols, ry/rows) : sampleNoiseGrid(field, gw, gh, rx/cols, ry/rows);
      // low field values stay empty ground; the pattern surfaces out of it
      const gate = Math.max(0.02, Math.min(0.95, 0.46/amt));
      if(n < gate) continue;
      const strength = (n - gate)/(1 - gate);
      const x = rx*cell, y = ry*cell, pad = cell*0.22;
      const dark = Math.random() < 0.7, tone = dark ? 26 : 232;
      ctx.globalAlpha = 0.18 + strength*0.62*Math.random();
      ctx.strokeStyle = `rgb(${tone},${tone},${tone})`; ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.lineWidth = Math.max(cpx(0.5), cell*0.09);
      const kind = Math.floor(Math.random()*4);
      if(kind === 0) ctx.fillRect(x + pad, y + pad, cell - pad*2, cell - pad*2);
      else if(kind === 1) ctx.strokeRect(x + pad, y + pad, cell - pad*2, cell - pad*2);
      else if(kind === 2){ ctx.beginPath(); ctx.moveTo(x + pad, y + cell*0.5); ctx.lineTo(x + cell - pad, y + cell*0.5); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(x + cell*0.5, y + pad); ctx.lineTo(x + cell*0.5, y + cell - pad); ctx.stroke(); }
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// the texture's own seed (+ Variant), so a texture made of one of these parts draws as it always did
const chaosSeed = (E, n) => ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
// a color from a port (0–1 channels), as the generators take it: a hex code
const chaosHex = v => Array.isArray(v) ? '#' + v.slice(0, 3).map(c => Math.round(Math.max(0, Math.min(1, c))*255).toString(16).padStart(2, '0')).join('') : null;
export const CHAOS_STEPS = {
  // Transmutation Circle, one part (kitWhole: drawn as it always was, under the texture's own seed + Variant);
  // lettered in web fonts, so the texture is made on the page (textureService ON_PAGE)
  transmutation: kitWhole({ cat: 'Marks', label: 'Transmutation Circle', ins: ['position'], outs: ['circle'], io: { ins: ['value'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Circle Size', 100, 40, 200), CHAOS_R('amount', 'Complexity', 100, 20, 300), CHAOS_R('form', 'Organic ↔ Tech', 30), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 6 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100), f = wholeShare(E, n, 'form', 30);
      return () => genSummoningCircles(w, h, a, z, light, f); }),
  // ---- the ∆ Chaos textures as parts (each draws as its texture always has, under the texture's own seed + Variant) ----
  sigilmarks: { cat: 'Marks', label: 'Sigils', ins: ['light from'], outs: ['sigils'], io: { ins: ['value'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Sigil Zoom', 100, 100, 500), CHAOS_R('amount', 'Sigil Count', 100, 15, 260), CHAOS_R('form', 'Chaos', 20), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, dv = E.input(n, 1), light = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315);
      return [withSeed(chaosSeed(E, n), () => genSigils(w, h, Math.max(0.02, E.num(n, 'amount', 100)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100), light, E.num(n, 'form', 20)/100, E.ctx.mat || null))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  blot: { cat: 'Marks', label: 'Ink Blot', ins: ['ink', 'accent'], outs: ['blot'], io: { ins: ['colour', 'colour'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Blot Scale', 100, 60, 400), CHAOS_R('amount', 'Spread', 100, 30, 240), CHAOS_R('form', 'Wetness', 50), CHAOS_R('color', 'Color', 35), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, t = E.ctx.tints || [];
      const ink = chaosHex(E.input(n, 1)) || t[0] || '#141414', acc = chaosHex(E.input(n, 2)) || t[1] || '#B0283A';
      return [withSeed(chaosSeed(E, n), () => genInkBleed(w, h, Math.max(0.02, E.num(n, 'amount', 100)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100), E.num(n, 'form', 50)/100, E.num(n, 'color', 35)/100, ink, acc))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  facets: { cat: 'Textures', label: 'Facet Field', ins: ['light from', 'light hue', 'material hue'], outs: ['facets'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Facet Size', 100, 50, 400), CHAOS_R('amount', 'Irregularity', 0, 0, 240), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 6,
    paint(E, n){ const { ww: w, wh: h } = E, dv = E.input(n, 1), light = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315), t = E.ctx.tints || [];
      const t1 = chaosHex(E.input(n, 2)) || t[0] || null, t2 = chaosHex(E.input(n, 3)) || t[1] || null;
      // (Shape Aware: round the words, a polished plate under them; in the letters, smaller facets)
      return [withSeed(chaosSeed(E, n), () => genTessellate(w, h, Math.max(0.02, E.num(n, 'amount', 0)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100*(1 - 0.55*(+E.ctx.fill || 0))), light, t1, t2, E.ctx.mat || null, E.ctx.glow || null, E.ctx))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  blackhole: { cat: 'Textures', label: 'Black Hole', ins: ['view from'], outs: ['sky'], io: { ins: ['value'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Chaos', 100, 40, 250), CHAOS_R('amount', 'Particles', 100, 10, 300), CHAOS_R('form', 'Jets', 0), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 12,
    paint(E, n){ const { ww: w, wh: h } = E, dv = E.input(n, 1), light = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315);
      return [withSeed(chaosSeed(E, n), () => genBlackHole(w, h, Math.max(0.02, E.num(n, 'amount', 100)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100), light, E.num(n, 'form', 0)/100))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  sand: { cat: 'Marks', label: 'Chladni Sand', ins: ['where', 'light from'], outs: ['sand'], io: { ins: ['field', 'value'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Grain Size', 100, 50, 300), CHAOS_R('amount', 'Sand', 100, 20, 300), CHAOS_R('form', 'Mode', 40), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 4,
    // a canvas pass at full size, its grains under the texture's own seed (+ Variant): Chladni Sand as it was
    paint(E, n){ const { ww: w, wh: h } = E, wv = E.input(n, 1), wf = wv != null ? E.asField(wv) : null, dv = E.input(n, 2);
      const where = wf ? (u, v) => wf[Math.min(h - 1, v*h | 0)*w + Math.min(w - 1, u*w | 0)] : null, light = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315);
      const seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
      return [withSeed(seed, () => chaosSand(w, h, Math.max(0.02, E.num(n, 'amount', 100)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100), light, E.num(n, 'form', 40)/100, where))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  bits: { cat: 'Marks', label: 'Bit Grid', ins: ['where'], outs: ['pattern'], io: { ins: ['field'], outs: ['image'] },
    params: [CHAOS_R('zoom', 'Cell Size', 140, 100, 500), CHAOS_R('amount', 'Emergence', 130, 30, 240), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 2,
    // a canvas pass at full size; its marks drawn under the texture's own seed (+ Variant), so Binary Pattern is as it was
    paint(E, n){ const { ww: w, wh: h } = E, wv = E.input(n, 1), wf = wv != null ? E.asField(wv) : null;
      const where = wf ? (u, v) => wf[Math.min(h - 1, v*h | 0)*w + Math.min(w - 1, u*w | 0)] : null;
      const seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
      return [withSeed(seed, () => chaosBitGrid(w, h, Math.max(0.02, E.num(n, 'amount', 130)/100), Math.max(0.25, E.num(n, 'zoom', 140)/100), where))]; },
    run(E, n){ return [E.readCanvas(this.paint(E, n)[0])]; } },
  cracks: { cat: 'Noise', label: 'Spreading Cracks', ins: ['impact at'], outs: ['height', 'glaze', 'grime', 'fine'], io: { ins: ['value'], outs: ['field', 'field', 'field', 'field'] },
    params: [CHAOS_R('scale', 'Crack Scale', 100, 50, 300), CHAOS_R('count', 'Cracks', 100, 20, 400), CHAOS_R('spread', 'From One Point', 30), CHAOS_R('wander', 'Wander', 40), CHAOS_R('age', 'Chipping', 0), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 10,
    run(E, n){ const { ww, wh, N, unit, num, input, ctx } = E;
      const dv = input(n, 1), deg = typeof dv === 'number' ? dv*360 : (ctx.light ?? 315), da = (deg + 90)*Math.PI/180, zoom = num(n, 'scale', 100)/100;   // (struck on the side away from the light, the handle)
      // (the cracks run on the export's grid, `ctx.page`, at every size, and are drawn scaled: a crack walks pixel by
      //  pixel, so a preview's own grid ran other cracks)
      const [GW, GH] = ctx.page || [ww, wh], K = unit/Math.min(GW, GH);
      const area = (GW/Math.min(GW, GH))*(GH/Math.min(GW, GH)), o = { count: 240*area*num(n, 'count', 100)/100/(zoom*zoom), spread: num(n, 'spread', 30)/100, wander: num(n, 'wander', 40)/100, dx: Math.cos(da), dy: Math.sin(da) };
      const seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => {
        const segs = K === 1 ? chaosCracks(ww, wh, o).segs : chaosCracks(GW, GH, o).segs.map(([a, b, c, d, g]) => [a*K, b*K, c*K, d*K, g]), age = num(n, 'age', 0)/100;
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
    params: [CHAOS_R('pattern', 'Pattern', 25), CHAOS_R('growth', 'Growth', 80, 20, 100), CHAOS_R('scale', 'Scale', 100, 50, 250), CHAOS_R('variant', 'Variation', 0, 0, 99)], cost: () => 30,
    run(E, n){ const { ww, wh, num, ctx } = E, seed = ((ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
      // (Shape Aware: round the words, the pattern grows up to them and follows their edges; in the letters, finer)
      return withSeed(seed, () => [chaosTuring(ww, wh, Math.max(0.1, Math.min(1, num(n, 'growth', 80)/100)), num(n, 'scale', 100)/100*(1 - 0.45*(+ctx.fill || 0)), num(n, 'pattern', 25)/100, wordsRoom(ctx, ww, wh, 0.25, 0.8))]); } },
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
          let v = alb*(litK(L, k, 0.45, M3, c)/fl)*dirt + 255*sp*litS(M3, c, L, k);
          if(GW && g > 0) v += 255*GW[c]*(0.4 + 0.6*th)*0.55;
          OUT[c][k] = (v < 0 ? 0 : v > 255 ? 255 : v)/255;
        }
      }
      return [o];
    } },
};
