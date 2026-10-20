/**
 * stepsPatterns.js — general parts, the second shelf: patterns, scattering,
 * gradients, and pictures read through other pictures.
 *
 *   Filter Forge's bomber
 *   throws a handful of small things;
 *   where they land, a page.
 *
 * Every part here is general (a part someone reaches for twice), from Filter
 * Forge's component list and Ruby's future-directions doc (ROADMAP §2 F):
 *   Scatter (Bomber, Glyph Scatter) · Grid & Dots (Checker, Tiles, Dots) ·
 *   Ellipse · Polygon · Triangle Mesh (Delaunay) · Blocks (and Techno) ·
 *   Pyramids · Border Mask · Lookup · Displace · Gradient Map (3- and
 *   5-color, Elevation Gradient) · Noise Gradient · Spectrum · Extract and
 *   Assemble HSB and Lab · Median (Percentile) · Map Switch · Flip ·
 *   Perspective · Rotate · Scale.
 * Each carries its doc, ports, cost and whether its first input is required.
 * Names here are pat/PAT_: the bundle is one scope.
 */
import { CPU, chamferDistance, freeCanvas } from './texCore.js';
import { LORE } from './symbolLore.js';
import { GLYPH_FONT } from './spell.js';

const PAT_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const PAT_SEL = (key, label, options) => [key, label, 'select', options[0], { options }];
const patClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
// a picture read again through a map of where each pixel looks (`from(x, y)` → [x, y] in the picture's pixels, at
// pixel centres), between pixels, with what lies past the edges repeated, mirrored, or the edge stretched
function patResample(im, ww, wh, edges, from){
  const N = ww*wh, o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
  const fold = (v, m) => { if(edges === 'stretch the edge') return Math.max(0, Math.min(m - 1, v));
    if(edges === 'mirror'){ const p = 2*m, t = ((v % p) + p) % p; return t < m ? t : p - 1 - t; } return ((v % m) + m) % m; };
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const [sx, sy] = from(x + 0.5, y + 0.5), fx0 = sx - 0.5, fy0 = sy - 0.5, x0 = Math.floor(fx0), y0 = Math.floor(fy0), tx = fx0 - x0, ty = fy0 - y0;
    const a = fold(x0, ww), b = fold(x0 + 1, ww), c = fold(y0, wh)*ww, d = fold(y0 + 1, wh)*ww, q = y*ww + x;
    for(const ch of ['r', 'g', 'b']){ const A = im[ch]; o[ch][q] = (A[c + a]*(1 - tx) + A[c + b]*tx)*(1 - ty) + (A[d + a]*(1 - tx) + A[d + b]*tx)*ty; } }
  return o;
}
const patHex = h => { const n = parseInt(String(h || '#808080').replace('#', '').slice(0, 6), 16) || 0; return [(n >> 16)/255, ((n >> 8) & 255)/255, (n & 255)/255]; };
// a soft edge in the page's units: 1 well inside (sd < −s), 0 well outside (sd > s), smooth between
const patInside = (sd, s) => { const t = patClamp(0.5 - sd/(2*s)); return t*t*(3 - 2*t); };
// colors as hue (turns), saturation and value, and back
const patHsv = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const h = d < 1e-9 ? 0 : mx === r ? ((g - b)/d + 6) % 6 : mx === g ? (b - r)/d + 2 : (r - g)/d + 4; return [h/6, mx > 0 ? d/mx : 0, mx]; };
const patRgb = ([h, s, v]) => { const f = k => { const q = (k + h*6) % 6; return v - v*s*Math.max(0, Math.min(1, q, 4 - q)); }; return [f(5), f(3), f(1)]; };
// ---- color spaces: sRGB ↔ CIE Lab (D65), each channel 0..1 (a and b with 0.5 for neutral) ----
const patLin = c => c <= 0.04045 ? c/12.92 : ((c + 0.055)/1.055)**2.4, patGam = c => c <= 0.0031308 ? c*12.92 : 1.055*c**(1/2.4) - 0.055;
const patLabF = t => t > 216/24389 ? Math.cbrt(t) : (24389/27*t + 16)/116, patLabFi = t => t**3 > 216/24389 ? t**3 : (116*t - 16)/(24389/27);
function patToLab(r, g, b){
  const R = patLin(r), G = patLin(g), B = patLin(b);
  const x = patLabF((0.4124*R + 0.3576*G + 0.1805*B)/0.95047), y = patLabF(0.2126*R + 0.7152*G + 0.0722*B), z = patLabF((0.0193*R + 0.1192*G + 0.9505*B)/1.08883);
  return [(116*y - 16)/100, 500*(x - y)/255 + 0.5, 200*(y - z)/255 + 0.5];
}
function patFromLab(L, A, B){
  const y = (L*100 + 16)/116, x = y + (A - 0.5)*255/500, z = y - (B - 0.5)*255/200, X = patLabFi(x)*0.95047, Y = patLabFi(y), Z = patLabFi(z)*1.08883;
  return [3.2406*X - 1.5372*Y - 0.4986*Z, -0.9689*X + 1.8758*Y + 0.0415*Z, 0.0557*X - 0.2040*Y + 1.0570*Z].map(c => patClamp(patGam(Math.max(0, c))));
}
/**
 * A RANK FILTER along lines (Huang's sliding histogram, 256 levels): each value replaced by the one at `p` (0 the
 * least, 0.5 the median, 1 the most) among its neighbours within r. Run across, then down: a separable median.
 */
function patRank(src, ww, wh, r, p, across){
  const out = new Float32Array(src.length), hist = new Int32Array(256), L = across ? ww : wh, M = across ? wh : ww;
  const at = (j, i) => across ? j*ww + i : i*ww + j;
  for(let j = 0; j < M; j++){ hist.fill(0); let n = 0, m = 0, below = 0;
    const bin = i => Math.max(0, Math.min(255, src[at(j, i)]*255 + 0.5 | 0));
    const add = (i, s) => { const b = bin(i); hist[b] += s; n += s; if(b < m) below += s; };
    for(let i = 0; i <= Math.min(L - 1, r); i++) add(i, 1);
    for(let i = 0; i < L; i++){
      const k = Math.floor(p*(n - 1));
      while(below > k && m > 0){ m--; below -= hist[m]; }
      while(below + hist[m] <= k && m < 255){ below += hist[m]; m++; }
      out[at(j, i)] = m/255;
      if(i - r >= 0) add(i - r, -1); if(i + r + 1 < L) add(i + r + 1, 1); } }
  return out;
}
/**
 * DELAUNAY TRIANGLES of points [[x, y], …] (Bowyer–Watson): the points are added one by one, and the triangles
 * whose circumcircle holds the new point are taken out and the hole re-triangulated from it. Returns triangles
 * as index triples; no point lies inside another triangle's circle.
 */
export function patDelaunay(P){   // test hook: the Delaunay property is checked directly (filterforge.test)
  const nP = P.length; if(nP < 3) return [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for(const [x, y] of P){ x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const S = Math.max(x1 - x0, y1 - y0, 1)*20, mx = (x0 + x1)/2, pts = [...P, [mx - S, y0 - S], [mx + S, y0 - S], [mx, y1 + S]];
  const circ = ([a, b, c]) => { const [ax, ay] = pts[a], [bx, by] = pts[b], [cx, cy] = pts[c], d = 2*(ax*(by - cy) + bx*(cy - ay) + cx*(ay - by)) || 1e-12;
    const ux = ((ax*ax + ay*ay)*(by - cy) + (bx*bx + by*by)*(cy - ay) + (cx*cx + cy*cy)*(ay - by))/d, uy = ((ax*ax + ay*ay)*(cx - bx) + (bx*bx + by*by)*(ax - cx) + (cx*cx + cy*cy)*(bx - ax))/d;
    return [ux, uy, (ax - ux)**2 + (ay - uy)**2]; };
  let tris = [[nP, nP + 1, nP + 2]], C = tris.map(circ);
  const key = (a, b) => a < b ? a + ',' + b : b + ',' + a, sides = t => [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]];
  for(let i = 0; i < nP; i++){ const [x, y] = pts[i], bad = [], keep = [], keepC = [];
    tris.forEach((t, k) => { const c = C[k]; ((x - c[0])**2 + (y - c[1])**2 < c[2]) ? bad.push(t) : (keep.push(t), keepC.push(c)); });
    const seen = new Map(); for(const t of bad) for(const [a, b] of sides(t)) seen.set(key(a, b), (seen.get(key(a, b)) || 0) + 1);
    for(const t of bad) for(const [a, b] of sides(t)) if(seen.get(key(a, b)) === 1){ const nt = [a, b, i]; keep.push(nt); keepC.push(circ(nt)); }
    tris = keep; C = keepC; }
  return tris.filter(t => t[0] < nP && t[1] < nP && t[2] < nP);
}
// rings of a shape: `K` of them, the outermost at d = 1. With a line width, each ring a line; without, bands
// filled in turn (one band: the whole shape). m: the distance (page units) to the nearest ring; d: how far out
function patRings(d, m, K, lw, sf){
  if(lw > 0) return patInside(m - lw/2, sf);
  const j = Math.max(1, Math.ceil(d*K - 1e-9)), base = j <= K && j % 2 === 1 ? 1 : 0, w = patClamp(m/sf);
  return 0.5 + (base - 0.5)*w*w*(3 - 2*w);
}

// ---- SCATTER: the shapes it can throw ----
// each drawn white on a canvas, centred at 0,0 with radius 1 (the caller scales and turns)
const PAT_SHAPES = ['dot', 'ring', 'star', 'cross', 'dash', 'diamond', 'spark', 'sigil', 'picture', 'glyph'];
// GLYPHS TO SCATTER (ROADMAP F2): Symbology's families (symbolLore.js), in the symbol fonts the page loads — so a graph
// that scatters them is made on the page, where those fonts are (textureService)
const PAT_GLYPH_SETS = { mixed: null, alchemy: 'Alchemy', heavens: 'Heavens', zodiac: 'Zodiac', occult: 'Occult', runes: 'Elder Futhark', stars: 'Stars' };
const PAT_GLYPHS = Object.fromEntries(Object.entries(PAT_GLYPH_SETS).map(([k, fam]) => [k, LORE.filter(([g, , f]) => (fam ? f === fam : true) && Array.from(g.replace('\uFE0E', '')).length === 1).map(r => r[0])]));
/** THE INSET BOX (ROADMAP G5): how far in from the box's line each point lies, in grid pixels (negative outside it), as
 *  a rounded rectangle; from the page's own edges when the box is off. Returns { d(x, y), thick } (thick: its line's width). */
function patBox(E){
  const { ww, wh } = E, b = String((E.ctx && E.ctx.box) || '').split(',').map(Number), on = b.length >= 6 && b.every(isFinite);
  const [x0, y0, x1, y1, cr, th] = on ? b : [0, 0, 1, 1, 0, 0], m = Math.min(ww, wh);
  const cx = (x0 + x1)/2*ww, cy = (y0 + y1)/2*wh, hx = Math.max(0, (x1 - x0)/2*ww), hy = Math.max(0, (y1 - y0)/2*wh), r = Math.min(cr*m, hx, hy);
  return { thick: th*m, d: (x, y) => { const qx = Math.abs(x - cx) - (hx - r), qy = Math.abs(y - cy) - (hy - r);
    return -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r); } };
}
/** Whether a graph scatters glyphs in the symbol fonts (it must then be made on the page, which has them). */
export function graphScattersGlyphs(graph){ return /"shape":\s*"glyph"/.test(typeof graph === 'string' ? graph : JSON.stringify(graph || '')); }
function patShape(x, kind, rand){
  x.beginPath();
  if(kind === 'dot'){ x.arc(0, 0, 1, 0, Math.PI*2); x.fill(); return; }
  if(kind === 'ring'){ x.lineWidth = 0.28; x.arc(0, 0, 0.85, 0, Math.PI*2); x.stroke(); return; }
  if(kind === 'diamond'){ x.moveTo(0, -1); x.lineTo(0.62, 0); x.lineTo(0, 1); x.lineTo(-0.62, 0); x.closePath(); x.fill(); return; }
  if(kind === 'dash'){ x.rect(-1, -0.14, 2, 0.28); x.fill(); return; }
  if(kind === 'cross'){ x.rect(-1, -0.14, 2, 0.28); x.rect(-0.14, -1, 0.28, 2); x.fill(); return; }
  if(kind === 'star' || kind === 'spark'){
    const pts = kind === 'star' ? 5 : 4, inner = kind === 'star' ? 0.42 : 0.16;
    for(let i = 0; i < pts*2; i++){ const a = i*Math.PI/pts - Math.PI/2, r = i % 2 ? inner : 1; i ? x.lineTo(Math.cos(a)*r, Math.sin(a)*r) : x.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
    x.closePath(); x.fill(); return; }
  if(kind === 'sigil'){
    // a small sigil: three to six strokes, lines and arcs, inside a circle, as Sigil Scatter's are inscribed
    x.lineWidth = 0.13; x.lineCap = 'round';
    const n = 3 + Math.floor(rand()*4), pt = () => { const a = rand()*Math.PI*2, r = 0.25 + rand()*0.75; return [Math.cos(a)*r, Math.sin(a)*r]; };
    for(let i = 0; i < n; i++){ x.beginPath();
      if(rand() < 0.35){ const r = 0.2 + rand()*0.6, a = rand()*Math.PI*2; x.arc((rand() - 0.5)*0.6, (rand() - 0.5)*0.6, r, a, a + 1 + rand()*3); }
      else { const [a1, b1] = pt(), [a2, b2] = pt(); x.moveTo(a1, b1); x.lineTo(a2, b2); }
      x.stroke(); }
    if(rand() < 0.4){ x.beginPath(); x.arc(0, 0, 0.95, 0, Math.PI*2); x.stroke(); }
    return; }
}

export const PATTERN_STEPS = {
  // FILTER FORGE'S BOMBER: throw copies of a shape (or of a picture) across the page, each of its own size, turn
  // and brightness; where they may fall can be a gray map, and which way they turn an angle map (a vector field)
  scatter: { cat: 'Marks', label: 'Scatter', ins: ['picture', 'where', 'which way'], outs: ['marks', 'heights', 'each mark', 'in color'], maps: ['size:4'],
    io: { ins: ['image', 'field', 'field'], outs: ['field', 'field', 'field', 'image'] },
    params: [PAT_SEL('shape', 'Shape', PAT_SHAPES), PAT_R('count', 'Count', 60, 1, 400), PAT_R('size', 'Size', 20, 1, 100), PAT_R('vary', 'Size Variety', 50),
      PAT_R('turn', 'Turn', 100, 0, 100), PAT_R('clump', 'Clumping', 0), PAT_R('fade', 'Brightness Variety', 30), PAT_R('variation', 'Variation', 0, 0, 99),
      // (F2: glyphs, which mark lies on top, and each mark's own color — after the old settings, so no ⚙ port moves)
      ['glyphs', 'Glyphs', 'select', 'mixed', { options: Object.keys(PAT_GLYPH_SETS), when: 'shape:glyph' }],
      PAT_SEL('layers', 'On Top', ['brightest', 'last thrown', 'largest', 'smallest']),
      PAT_SEL('color', 'Mark Colors', ['white', 'from the picture']),
      // (COUNT FOR THE PAGE: Count marks on the whole page, however large it is drawn — stars in a sky, a few sparkles —
      //  where per area, as it always was, a bigger page holds more of them)
      PAT_SEL('per', 'Count Is', ['per area', 'for the page']),
      // (A SHEET: a picture of 4, 8 or 16 different things in cells — Bloom's sheet — each mark one of them at random, so
      //  a field is never clones; BLACK IS CLEAR: a picture drawn on black, as Bloom draws, stamps its shape, not its square)
      PAT_SEL('sheet', 'Picture Is', ['one picture', 'a sheet of 4', 'a sheet of 8', 'a sheet of 16']),
      // (SIZE ×: Size's range, made larger, for marks that are whole things — a fallen flower, a bouquet's heads)
      PAT_R('big', 'Size ×', 100, 100, 400), PAT_SEL('ground', 'Picture’s Ground', ['solid', 'black is clear'])],
    cost: () => 3,
    run(E, n){ const { ww, wh, N, unit, input, num, P, asField, asImage, carea, readCanvas } = E;
      const shape = P(n, 'shape', 'dot'), where = asField(input(n, 2)), way = asField(input(n, 3));
      const tinted = P(n, 'color', 'white') === 'from the picture', layers = P(n, 'layers', 'brightest');
      const pic = shape === 'picture' || tinted ? asImage(input(n, 1)) : null, glyphs = shape === 'glyph' ? (PAT_GLYPHS[P(n, 'glyphs', 'mixed')] || PAT_GLYPHS.mixed) : null;
      // (SIZE BY POINT: a map on Size's ⚙ sizes each mark by the map where it lands; the heights' blur takes its average)
      const count = P(n, 'per', 'per area') === 'for the page' ? Math.round(num(n, 'count', 60)) : Math.min(20000, Math.round(num(n, 'count', 60)/100*180*carea/1e6)), SZ = E.map(n, 'size', 20);
      const BIG = num(n, 'big', 100)/100, R0 = (typeof SZ === 'number' ? SZ : SZ.reduce((a, b) => a + b, 0)/SZ.length)/100*unit*0.12*BIG;
      const vary = num(n, 'vary', 50)/100, turn = num(n, 'turn', 100)/100, clump = num(n, 'clump', 0)/100, fade = num(n, 'fade', 30)/100;
      const mk = () => { const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d', CPU); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); return [c, x]; };
      const [mc, mx] = mk(), [ic, ix] = mk();
      // ON TOP (F2): the brightest mark wins where marks overlap (as Scatter always drew), or they lie in the order
      // thrown, or the largest (or smallest) on top; and in color, a third pass, each mark the picture's color where it lands
      const colored = tinted || shape === 'picture', deferred = layers !== 'brightest' || shape === 'glyph' || colored;
      if(layers === 'brightest') mx.globalCompositeOperation = 'lighten';
      const [cc, cx] = colored ? mk() : [null, null];
      if(cx && layers === 'brightest') cx.globalCompositeOperation = 'lighten';
      // (a picture whose black is clear: where a stamp only partly covers a point its colour was drawn partly over
      //  black, a dark rim round every stamp; its coverage, kept apart, gives the colour back)
      const clearPic = shape === 'picture' && P(n, 'ground', 'solid') === 'black is clear' && pic, [vc, vx] = clearPic && cx ? mk() : [null, null];
      const marks = [];
      // a picture to stamp, as a small canvas
      let stamp = null;
      const clear = shape === 'picture' && P(n, 'ground', 'solid') === 'black is clear'; let stampMask = null, cut = null;
      if(clear && pic){ cut = new Float32Array(N); for(let i = 0; i < N; i++){ const m = Math.max(pic.r[i], pic.g[i], pic.b[i]); cut[i] = Math.min(1, m*120); } }
      if(pic && shape === 'picture'){ const s = document.createElement('canvas'); s.width = ww; s.height = wh; const sx = s.getContext('2d', CPU), im = sx.createImageData(ww, wh);
        for(let i = 0; i < N; i++){ im.data[i*4] = pic.r[i]*255; im.data[i*4 + 1] = pic.g[i]*255; im.data[i*4 + 2] = pic.b[i]*255; im.data[i*4 + 3] = cut ? Math.max(0, Math.min(255, cut[i]*255)) : 255; } sx.putImageData(im, 0, 0); stamp = s;
        if(cut){ const t = document.createElement('canvas'); t.width = ww; t.height = wh; const tx = t.getContext('2d', CPU), tm = tx.createImageData(ww, wh);
          for(let i = 0; i < N; i++){ tm.data[i*4] = tm.data[i*4 + 1] = tm.data[i*4 + 2] = 255; tm.data[i*4 + 3] = Math.max(0, Math.min(255, cut[i]*255)); } tx.putImageData(tm, 0, 0); stampMask = t; } }
      const cellsN = { 'a sheet of 4': 4, 'a sheet of 8': 8, 'a sheet of 16': 16 }[P(n, 'sheet', 'one picture')] || 1, sheetCols = cellsN >= 16 ? 4 : cellsN >= 8 ? 4 : cellsN >= 4 ? 2 : 1, sheetRows = Math.max(1, Math.round(cellsN/sheetCols));
      const cellW = ww/sheetCols, cellH = wh/sheetRows, cellAsp = cellH/cellW;
      const stampAt = (ctx, img, m) => { if(cellsN === 1){ ctx.drawImage(img, -1, -1, 2, 2); return; } const ci = m.cell, sxp = (ci % sheetCols)*cellW, syp = Math.floor(ci/sheetCols)*cellH;
        ctx.drawImage(img, sxp, syp, cellW, cellH, -1, -cellAsp, 2, 2*cellAsp); };
      // Variation turns the throw without moving the seed (Filter Forge's local Variation)
      const v0 = Math.round(num(n, 'variation', 0)); let st = 0x9e3779b9 ^ Math.floor(Math.random()*4294967296) ^ Math.imul(v0 + 1, 2654435761);
      const rand = () => { st |= 0; st = st + 0x6D2B79F5 | 0; let t = Math.imul(st ^ st >>> 15, 1 | st); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
      const centres = Array.from({ length: 3 + Math.floor(rand()*5) }, () => [rand()*ww, rand()*wh]);
      for(let i = 0; i < count; i++){
        let x = 0, y = 0;
        for(let tries = 0; tries < 12; tries++){
          if(rand() < clump){ const c = centres[Math.floor(rand()*centres.length)], g = Math.sqrt(-2*Math.log(Math.max(1e-6, rand())))*unit*0.09, a = rand()*Math.PI*2; x = c[0] + Math.cos(a)*g; y = c[1] + Math.sin(a)*g; }
          else { x = rand()*ww; y = rand()*wh; }
          if(!where) break;
          const q = Math.min(wh - 1, Math.max(0, y | 0))*ww + Math.min(ww - 1, Math.max(0, x | 0));
          if(rand() < where[q]) break;
          if(tries === 11) x = -1e9;
        }
        if(x < -1e8) continue;
        const Rm = typeof SZ === 'number' ? R0 : SZ[Math.min(wh - 1, Math.max(0, y | 0))*ww + Math.min(ww - 1, Math.max(0, x | 0))]/100*unit*0.12*BIG;
        const r = Math.max(0.5, Rm*(1 - vary + vary*rand()*2*Math.min(1, 0.5 + rand())));
        let ang = (rand() - 0.5)*Math.PI*2*turn;
        if(way){ const q = Math.min(wh - 1, Math.max(0, y | 0))*ww + Math.min(ww - 1, Math.max(0, x | 0)); ang = way[q]*Math.PI*2 + (rand() - 0.5)*turn*0.6; }
        const g = Math.round(255*(1 - fade*rand())), id = Math.round(20 + rand()*235);
        if(deferred){ marks.push({ x, y, r, ang, g, id, s0: st, glyph: glyphs && glyphs.length ? glyphs[Math.floor(rand()*glyphs.length)] : null, cell: cellsN > 1 ? Math.floor(rand()*cellsN) : 0 }); continue; }
        for(const [ctx, col] of [[mx, `rgb(${g},${g},${g})`], [ix, `rgb(${id},${id},${id})`]]){
          ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(r, r); ctx.fillStyle = ctx.strokeStyle = col;
          if(stamp){ if(ctx === mx){ ctx.globalAlpha = g/255; ctx.drawImage(stamp, -1, -1, 2, 2); } else ctx.fillRect(-1, -1, 2, 2); }
          else { const s0 = st; patShape(ctx, shape, rand); if(ctx === mx) st = s0; }     // (the id pass draws the same sigil)
          ctx.restore(); }
      }
      if(deferred){
        if(layers === 'largest') marks.sort((a, b) => a.r - b.r); else if(layers === 'smallest') marks.sort((a, b) => b.r - a.r);
        const at = (m, img) => { const q = Math.min(wh - 1, Math.max(0, m.y | 0))*ww + Math.min(ww - 1, Math.max(0, m.x | 0)); return [img.r[q], img.g[q], img.b[q]]; };
        for(const m of marks){
          const k = m.g/255, c = tinted && pic ? at(m, pic).map(v => Math.round(Math.max(0, Math.min(1, v))*255*k)) : [m.g, m.g, m.g];
          for(const [ctx, col, isMark] of [[mx, `rgb(${m.g},${m.g},${m.g})`, true], [ix, `rgb(${m.id},${m.id},${m.id})`, false], ...(cx ? [[cx, `rgb(${c[0]},${c[1]},${c[2]})`, true]] : []), ...(vx ? [[vx, '#fff', 'coverage']] : [])]){
            ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.ang); ctx.fillStyle = ctx.strokeStyle = col;
            if(m.glyph){ ctx.font = `${Math.max(1, m.r*2.2)}px ${GLYPH_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.glyph, 0, 0); }
            else { ctx.scale(m.r, m.r);
              if(stamp && isMark === 'coverage'){ ctx.globalAlpha = 1; stampAt(ctx, stampMask, m); }
              else if(stamp){ if(isMark){ ctx.globalAlpha = ctx === cx ? 1 : m.g/255; if(ctx === cx && !tinted) ctx.globalAlpha = k; stampAt(ctx, ctx === mx && stampMask ? stampMask : stamp, m); }
                else ctx.fillRect(-1, -1, 2, 2); }
              else { st = m.s0; patShape(ctx, shape, rand); } }     // (every pass draws the same sigil)
            ctx.restore(); }
        }
      }
      const markF = E.lum(readCanvas(mc)), each = E.lum(readCanvas(ic));
      let colour = cc ? readCanvas(cc) : markF;
      if(vc && colour.r){ const V = E.lum(readCanvas(vc));
        for(let i = 0; i < N; i++){ const v = V[i]; if(v > 0.02 && v < 0.98){ const u = 1/v; colour.r[i] = Math.min(1, colour.r[i]*u); colour.g[i] = Math.min(1, colour.g[i]*u); colour.b[i] = Math.min(1, colour.b[i]*u); } } }
      freeCanvas(mc, ic, cc, vc);
      return [markF, E.boxBlur(markF, Math.max(1, R0*0.18)), each, colour];
    } },

  // FILTER FORGE'S CHECKER, TILES and DOTS in one: a regular pattern, turned and sized
  grid: { cat: 'Noise', label: 'Grid & Dots', ins: [], outs: ['pattern'], maps: ['weight'],
    params: [PAT_SEL('kind', 'Pattern', ['checker', 'grid lines', 'dots', 'hex dots', 'diamonds', 'stripes']), PAT_R('cells', 'Cells', 12, 2, 120), PAT_R('weight', 'Line or Dot Size', 30), PAT_R('angle', 'Angle', 0, 0, 360), PAT_R('soft', 'Softness', 10)],
    cost: () => 1,
    run(E, n){ const { ww, wh, unit, P, num, map, at, field } = E;
      const kind = P(n, 'kind', 'checker'), c = Math.max(2, num(n, 'cells', 12)), a = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(a), sa = Math.sin(a);
      const WT = map(n, 'weight', 30), SF = num(n, 'soft', 10)/100*0.25 + 0.01;
      const sm = (e, d) => patClamp(0.5 - d/e);         // a soft edge: 1 inside, 0 outside
      let q = -1;
      return [field((u, v, x, y) => { q++;
        const px = (x - ww/2)/unit*c, py = (y - wh/2)/unit*c, X = px*ca + py*sa, Y = -px*sa + py*ca, w = at(WT, q)/100;
        const fx = X - Math.floor(X), fy = Y - Math.floor(Y);
        if(kind === 'checker') return ((Math.floor(X) + Math.floor(Y)) & 1) ? 1 : 0;
        if(kind === 'stripes') return sm(SF, Math.abs(fx - 0.5) - w*0.5);
        if(kind === 'grid lines') return Math.max(sm(SF, Math.min(fx, 1 - fx) - w*0.25), sm(SF, Math.min(fy, 1 - fy) - w*0.25));
        if(kind === 'diamonds') return sm(SF, Math.abs(fx - 0.5) + Math.abs(fy - 0.5) - w*0.5);
        if(kind === 'hex dots'){ const r = Math.floor(Y), off = (r & 1) ? 0.5 : 0, gx = X + off - Math.floor(X + off) - 0.5; return sm(SF, Math.hypot(gx, fy - 0.5) - w*0.5); }
        return sm(SF, Math.hypot(fx - 0.5, fy - 0.5) - w*0.5); })];
    } },

  // A FRAME from the page's edges (ROADMAP F3): white at the edge, fading inward, square-cornered or round
  border: { cat: 'Noise', label: 'Border Mask', ins: ['roughen'], outs: ['frame'], io: { ins: ['field'] },
    // (Inset Box: the frame measured from the page's inset box, its offset and corners — ROADMAP F3)
    params: [PAT_SEL('shape', 'Shape', ['square', 'rounded', 'oval', 'inset box']), PAT_R('width', 'Width', 12, 0, 50), PAT_R('soft', 'Softness', 50), PAT_R('rough', 'Roughness', 0)],
    cost: () => 1,
    run(E, n){ const { ww, wh, unit, P, num, input, asField, field } = E;
      const shape = P(n, 'shape', 'square'), W = Math.max(0.001, num(n, 'width', 12)/100*unit), soft = Math.max(0.02, num(n, 'soft', 50)/100), rough = num(n, 'rough', 0)/100, R = asField(input(n, 1));
      const box = shape === 'inset box' ? patBox(E) : null;
      let q = -1;
      return [field((u, v, x, y) => { q++;
        let d;                                                     // distance in from the edge, in pixels
        if(box) d = box.d(x, y);
        else if(shape === 'oval'){ const dx = (x - ww/2)/(ww/2), dy = (y - wh/2)/(wh/2); d = (1 - Math.hypot(dx, dy))*Math.min(ww, wh)/2; }
        else if(shape === 'rounded'){ const r = W*1.5, cx = Math.min(Math.max(x, r), ww - r), cy = Math.min(Math.max(y, r), wh - r); d = Math.min(x, y, ww - x, wh - y);
          if((x < r || x > ww - r) && (y < r || y > wh - r)) d = r - Math.hypot(x - cx, y - cy); }
        else d = Math.min(x, y, ww - x, wh - y);
        if(R) d -= (R[q] - 0.5)*W*rough*2;
        const t = d/W; return patClamp(1 - (t - (1 - soft))/soft); })];
    } },

  // THE INSET BOX AS AN INPUT (ROADMAP G5): the page's box as masks — inside it, a rise in from its edge, its line
  insetbox: { cat: 'Inputs', label: 'Inset Box', ins: [], outs: ['inside', 'edge', 'line'],
    params: [PAT_R('width', 'Edge Width', 10, 1, 50), PAT_R('soft', 'Softness', 0)],
    cost: () => 1,
    run(E, n){ const { N, ww, wh, unit, num, field } = E;
      const B = patBox(E), W = Math.max(0.5, num(n, 'width', 10)/100*unit), sf = Math.max(0.75, num(n, 'soft', 0)/100*unit*0.2), half = Math.max(0.5, B.thick/2);
      const D = new Float32Array(N); let q = 0; for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) D[q++] = B.d(x + 0.5, y + 0.5);
      const inside = new Float32Array(N), edge = new Float32Array(N), line = new Float32Array(N);
      for(let i = 0; i < N; i++){ const d = D[i]; inside[i] = patClamp(0.5 + d/sf); edge[i] = d <= 0 ? 0 : Math.min(1, d/W);
        line[i] = B.thick > 0 ? patClamp(half + 0.5 - Math.abs(d)) : 0; }
      return [inside, edge, line];
    } },

  // FILTER FORGE'S LOOKUP: a picture read at the places two gray maps name — refraction, foil, interference
  lookup: { cat: 'Shape', label: 'Lookup', ins: ['picture', 'across', 'down'], outs: ['picture'], maps: ['amount'], io: { ins: ['image', 'field', 'field'], outs: ['image'] }, req: true,
    params: [PAT_R('amount', 'Amount', 100), PAT_SEL('edges', 'At the Edges', ['repeat', 'mirror', 'clamp']), PAT_R('scale', 'Scale', 100, 10, 400)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, input, num, map, at, P, asImage, asField } = E;
      const pic = asImage(input(n, 1)); if(!pic) return null;
      const AX = asField(input(n, 2)), AY = asField(input(n, 3)), A = map(n, 'amount', 100), sc = num(n, 'scale', 100)/100, mode = P(n, 'edges', 'repeat');
      const wrap = t => mode === 'clamp' ? patClamp(t) : mode === 'mirror' ? (m => m > 1 ? 2 - m : m)(((t % 2) + 2) % 2) : ((t % 1) + 1) % 1;
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, a = at(A, q)/100, u = x/ww, v = y/wh;
        const tu = wrap((u + ((AX ? AX[q]*sc : u) - u)*a)), tv = wrap((v + ((AY ? AY[q]*sc : v) - v)*a));
        const s = Math.min(wh - 1, Math.floor(tv*wh))*ww + Math.min(ww - 1, Math.floor(tu*ww));
        o.r[q] = pic.r[s]; o.g[q] = pic.g[s]; o.b[q] = pic.b[s]; }
      return [o];
    } },

  // DISPLACE BY A MAP'S SLOPE (Filter Forge's Refraction): a picture seen through a bumpy glass
  displace: { cat: 'Shape', label: 'Displace', ins: ['picture', 'by'], outs: ['picture'], maps: ['amount'], io: { ins: ['image', 'field'], outs: ['image'] }, req: true,
    params: [PAT_R('amount', 'Amount', 30), PAT_R('blur', 'Smoothing', 20)],
    cost: () => 1.5,
    run(E, n){ const { ww, wh, N, unit, input, num, map, at, asImage, asField, boxBlur } = E;
      const pic = asImage(input(n, 1)); if(!pic) return null;
      let by = asField(input(n, 2)); if(!by) return [pic];
      by = boxBlur(by, num(n, 'blur', 20)/100*unit*0.02);
      const A = map(n, 'amount', 30), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, k = at(A, q)/100*unit*0.5;
        const gx = by[y*ww + Math.min(ww - 1, x + 1)] - by[y*ww + Math.max(0, x - 1)], gy = by[Math.min(wh - 1, y + 1)*ww + x] - by[Math.max(0, y - 1)*ww + x];
        const sx = Math.min(ww - 1, Math.max(0, Math.round(x + gx*k))), sy = Math.min(wh - 1, Math.max(0, Math.round(y + gy*k))), s = sy*ww + sx;
        o.r[q] = pic.r[s]; o.g[q] = pic.g[s]; o.b[q] = pic.b[s]; }
      return [o];
    } },

  // FILTER FORGE'S ELLIPSE (and Free Ellipse): one ellipse, or rings of them like orbits, filled or drawn as lines;
  // with how far out from its centre each point lies, and how far round, to shape or place other things by
  ellipse: { cat: 'Noise', label: 'Ellipse', ins: [], outs: ['shape', 'distance', 'around'],
    params: [PAT_R('size', 'Size', 60, 1, 200), PAT_R('height', 'Height', 60, 5, 100), PAT_R('angle', 'Turn', 0, 0, 360), PAT_R('x', 'Across', 50), PAT_R('y', 'Down', 50),
      PAT_R('rings', 'Rings', 1, 1, 40), PAT_R('line', 'Line Width', 0), PAT_R('soft', 'Softness', 4)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, unit, num } = E;
      const A = Math.max(1e-3, num(n, 'size', 60)/200), B = Math.max(1e-3, A*num(n, 'height', 60)/100), an = num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(an), sa = Math.sin(an);
      const cx = num(n, 'x', 50)/100*ww/unit, cy = num(n, 'y', 50)/100*wh/unit, K = Math.max(1, Math.round(num(n, 'rings', 1)));
      const lw = num(n, 'line', 0)/100*0.04, sf = Math.max(0.7/unit, num(n, 'soft', 4)/100*0.05);
      const shape = new Float32Array(N), dist = new Float32Array(N), round = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, px = x/unit - cx, py = y/unit - cy;
        const u = (px*ca + py*sa)/A, v = (-px*sa + py*ca)/B, d = Math.hypot(u, v);
        // how fast d grows per page unit here, so a ring's line is as wide all the way round
        const g = d > 1e-9 ? Math.hypot(u/A, v/B)/d : 1/Math.min(A, B);
        let m = Infinity; for(let k = 1; k <= K; k++){ const e = Math.abs(d - k/K)/g; if(e < m) m = e; }
        shape[q] = patRings(d, m, K, lw, sf); dist[q] = Math.min(1, d); round[q] = Math.atan2(v, u)/(Math.PI*2) + 0.5; }
      return [shape, dist, round];
    } },

  // FILTER FORGE'S POLYGON (and Free Polygon): a regular polygon, or a star, or rings of them; with a bevel (a
  // pyramid, flat faces rising to the centre) and how far round each point lies
  polygon: { cat: 'Noise', label: 'Polygon', ins: [], outs: ['shape', 'bevel', 'around'],
    params: [PAT_R('sides', 'Sides', 6, 3, 12), PAT_R('star', 'Star', 0), PAT_R('size', 'Size', 60, 1, 200), PAT_R('angle', 'Turn', 0, 0, 360), PAT_R('x', 'Across', 50), PAT_R('y', 'Down', 50),
      PAT_R('rings', 'Rings', 1, 1, 40), PAT_R('line', 'Line Width', 0), PAT_R('soft', 'Softness', 4)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, unit, num } = E;
      const sides = Math.max(3, Math.min(12, Math.round(num(n, 'sides', 6)))), star = num(n, 'star', 0)/100, R = Math.max(1e-3, num(n, 'size', 60)/200);
      const an = num(n, 'angle', 0)*Math.PI/180, cx = num(n, 'x', 50)/100*ww/unit, cy = num(n, 'y', 50)/100*wh/unit, K = Math.max(1, Math.round(num(n, 'rings', 1)));
      const lw = num(n, 'line', 0)/100*0.04, sf = Math.max(0.7/unit, num(n, 'soft', 4)/100*0.05);
      // its corners (a star: every other one pulled in), the first pointing up; each edge as its outward normal and its distance from the centre
      const M = star > 0 ? sides*2 : sides, a0 = an - Math.PI/2, V = Array.from({ length: M }, (_, k) => { const r = star > 0 && k % 2 ? R*(1 - star*0.8) : R, a = a0 + k*Math.PI*2/M; return [Math.cos(a)*r, Math.sin(a)*r]; });
      const edges = V.map((p, k) => { const q = V[(k + 1) % M]; let nx = q[1] - p[1], ny = p[0] - q[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        const h = p[0]*nx + p[1]*ny; return h < 0 ? [-nx, -ny, -h] : [nx, ny, h]; });
      const shape = new Float32Array(N), bevel = new Float32Array(N), round = new Float32Array(N);
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, px = x/unit - cx, py = y/unit - cy;
        const t = (((Math.atan2(py, px) - a0)/(Math.PI*2)) % 1 + 1) % 1, k = Math.min(M - 1, Math.floor(t*M)), [nx, ny, h] = edges[k];
        // within its sector a point's place is how far it lies toward that edge: 1 on the outline
        const d = Math.max(0, (px*nx + py*ny)/h);
        let m = Infinity; for(let j = 1; j <= K; j++){ const e = Math.abs(d - j/K)*h; if(e < m) m = e; }
        shape[q] = patRings(d, m, K, lw, sf); bevel[q] = 1 - Math.min(1, d); round[q] = t; }
      return [shape, bevel, round];
    } },

  // A MESH OF TRIANGLES between scattered points (Delaunay's: no point inside another triangle's circle), its
  // lines thinned to the shortest for a constellation; points land where a map is light
  mesh: { cat: 'Marks', label: 'Triangle Mesh', ins: ['where'], outs: ['lines', 'points', 'facets'],
    params: [PAT_R('count', 'Points', 40, 3, 400), PAT_R('even', 'Evenness', 50), PAT_R('prune', 'Thin Out', 0), PAT_R('line', 'Line Width', 15), PAT_R('dot', 'Point Size', 20), PAT_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 3,
    run(E, n){ const { ww, wh, N, input, num, asField, readCanvas } = E;
      const where = asField(input(n, 1)), count = Math.max(3, Math.min(400, Math.round(num(n, 'count', 40)))), tries = 1 + Math.round(num(n, 'even', 50)/100*12);
      const prune = num(n, 'prune', 0)/100, lw = num(n, 'line', 15)/100*10, dot = num(n, 'dot', 20)/100*14;
      // the points: each the best of a few candidates (the farthest from the rest: even), landing where the map is light
      const P = [];
      const cand = () => { for(let t = 0; t < 16; t++){ const x = Math.random()*ww, y = Math.random()*wh;
        if(!where || Math.random() < where[Math.min(wh - 1, y | 0)*ww + Math.min(ww - 1, x | 0)]) return [x, y]; } return null; };
      for(let i = 0; i < count; i++){ let best = null, bd = -1;
        for(let c = 0; c < tries; c++){ const p = cand(); if(!p) continue; let d = Infinity; for(const o of P) d = Math.min(d, (o[0] - p[0])**2 + (o[1] - p[1])**2); if(d > bd){ bd = d; best = p; } }
        if(best) P.push(best); }
      const pts = P, nP = P.length, tris = patDelaunay(P);
      // its edges, the longest dropped first as Thin Out rises
      const seen = new Set(), E2 = [];
      for(const t of tris) for(const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]){ const k = a < b ? a + ',' + b : b + ',' + a; if(!seen.has(k)){ seen.add(k); E2.push([a, b, Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1])]); } }
      E2.sort((p, q) => p[2] - q[2]); const kept = E2.slice(0, Math.max(0, Math.round(E2.length*(1 - prune*0.9))));
      const mk = () => { const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d', CPU); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); return [c, x]; };
      const [lc, lx] = mk(), [pc, px] = mk(), [fc, fx] = mk();
      lx.strokeStyle = '#fff'; lx.lineCap = 'round'; lx.lineWidth = E.px(lw); lx.beginPath();
      for(const [a, b] of kept){ lx.moveTo(pts[a][0], pts[a][1]); lx.lineTo(pts[b][0], pts[b][1]); } if(lw > 0) lx.stroke();
      px.fillStyle = '#fff'; if(dot > 0) for(let i = 0; i < nP; i++){ px.beginPath(); px.arc(pts[i][0], pts[i][1], E.px(dot)/2, 0, Math.PI*2); px.fill(); }
      for(const t of tris){ const g = Math.round(20 + Math.random()*235); fx.fillStyle = `rgb(${g},${g},${g})`; fx.strokeStyle = fx.fillStyle; fx.lineWidth = Math.max(1, E.px(1));   // (stroked too: no seam between neighbours)
        fx.beginPath(); fx.moveTo(pts[t[0]][0], pts[t[0]][1]); fx.lineTo(pts[t[1]][0], pts[t[1]][1]); fx.lineTo(pts[t[2]][0], pts[t[2]][1]); fx.closePath(); fx.fill(); fx.stroke(); }
      return [E.lum(readCanvas(lc)), E.lum(readCanvas(pc)), E.lum(readCanvas(fc))];
    } },

  // FILTER FORGE'S BLOCKS and TECHNO: rectangles of random gray, laid at several sizes over each other; their
  // outlines are Techno's circuitry of lines
  blocks: { cat: 'Noise', label: 'Blocks', ins: [], outs: ['blocks', 'outlines'],
    params: [PAT_R('scale', 'Scale', 6, 1, 60), PAT_R('octaves', 'Octaves', 3, 1, 5), PAT_R('fill', 'Density', 60), PAT_R('line', 'Line Width', 12), PAT_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 2,
    run(E, n){ const { ww, wh, N, unit, num, readCanvas } = E;
      const cells0 = Math.max(1, num(n, 'scale', 6)), oct = Math.max(1, Math.min(5, Math.round(num(n, 'octaves', 3)))), fill = num(n, 'fill', 60)/100, lw = num(n, 'line', 12)/100*8;
      const mk = bg => { const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d', CPU); x.fillStyle = bg; x.fillRect(0, 0, ww, wh); return [c, x]; };
      const [oc, ox] = mk('#000'); ox.strokeStyle = '#fff'; ox.lineWidth = E.px(lw);
      const sum = new Float32Array(N); let norm = 0;
      for(let o = 0; o < oct; o++){ const cs = unit/(cells0*Math.pow(2, o)), gx = Math.ceil(ww/cs), gy = Math.ceil(wh/cs), a = Math.pow(0.5, o);
        const [c, x] = mk('rgb(128,128,128)'), count = Math.round(fill*gx*gy*0.7);
        ox.globalAlpha = Math.max(0.25, a);
        for(let i = 0; i < count; i++){ const bx = Math.floor(Math.random()*gx), by = Math.floor(Math.random()*gy), bw = 1 + Math.floor(Math.random()*3), bh = 1 + Math.floor(Math.random()*3), g = Math.round(Math.random()*255);
          x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(bx*cs, by*cs, bw*cs, bh*cs); if(lw > 0) ox.strokeRect(bx*cs, by*cs, bw*cs, bh*cs); }
        const L = E.lum(readCanvas(c)); for(let i = 0; i < N; i++) sum[i] += L[i]*a; norm += a; }
      for(let i = 0; i < N; i++) sum[i] /= norm;
      return [sum, E.lum(readCanvas(oc))];
    } },

  // FILTER FORGE'S PAVEMENTS (ROADMAP F6): irregular paving stones laid in rows — each row its own height, each stone
  // its own width, its corners pushed a little off square, the joints between them of a width, the corners worn round
  pavement: { cat: 'Noise', label: 'Pavements', ins: [], outs: ['stones', 'bevel', 'each stone'],
    params: [PAT_R('rows', 'Rows', 8, 2, 40), PAT_R('irreg', 'Irregularity', 50), PAT_R('gap', 'Joint Width', 20), PAT_R('round', 'Roundness', 30),
      PAT_R('bevel', 'Bevel Width', 30), PAT_R('angle', 'Angle', 0, 0, 360), PAT_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 3,
    run(E, n){ const { ww, wh, N, unit, num, readCanvas } = E;
      const rows = Math.max(2, num(n, 'rows', 8)), irr = num(n, 'irreg', 50)/100, rh = unit/rows, gap = num(n, 'gap', 20)/100*rh*0.25;
      const round = num(n, 'round', 30)/100*rh*0.35, bev = Math.max(1, num(n, 'bevel', 30)/100*rh*0.4), a = num(n, 'angle', 0)*Math.PI/180;
      const mk = () => { const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d', CPU); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); return [c, x]; };
      const [sc, sx] = mk(), [ic, ix] = mk();
      // laid over a square the page's diagonal across, about its middle, so any angle covers it
      const D = Math.hypot(ww, wh), half = D/2;
      for(const x of [sx, ix]){ x.translate(ww/2, wh/2); x.rotate(a); x.lineJoin = 'round'; }
      // the rows, and the corner points along each joint between them (shared by the rows above and below, so they fit)
      const ys = [-half]; while(ys[ys.length - 1] < half) ys.push(ys[ys.length - 1] + rh*(1 + irr*(Math.random() - 0.5)*0.8));
      const wob = () => (Math.random() - 0.5)*irr*rh*0.3;
      // a quad drawn in from each of its edges by d (each edge's line moved inward, the corners where they meet)
      const inset = (P, d) => { const L = P.map((p, i) => { const q = P[(i + 1) % 4], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1, nx = -dy/len, ny = dx/len;
          return [p[0] + nx*d, p[1] + ny*d, dx, dy]; });
        return L.map((l, i) => { const m = L[(i + 3) % 4], det = m[2]*l[3] - m[3]*l[2];
          if(Math.abs(det) < 1e-9) return [l[0], l[1]];
          const t = ((l[0] - m[0])*l[3] - (l[1] - m[1])*l[2])/det; return [m[0] + m[2]*t, m[1] + m[3]*t]; }); };
      for(let r = 0; r + 1 < ys.length; r++){
        const y0 = ys[r], y1 = ys[r + 1], h = y1 - y0;
        // the joints along the row, each leaning its own way: a stone's right edge is the next one's left
        const joints = []; let x = -half - Math.random()*h*1.5;
        while(x < half + h*2){ joints.push([x + wob(), x + wob()]); x += h*(0.9 + Math.random()*(0.6 + 1.6*irr)); }
        for(let j = 0; j + 1 < joints.length; j++){
          const [a0, a1] = joints[j], [b0, b1] = joints[j + 1];
          const P = [[a0, y0 + wob()*0.4], [b0, y0 + wob()*0.4], [b1, y1 + wob()*0.4], [a1, y1 + wob()*0.4]];
          const Q = inset(P, gap/2 + round);
          if(Q.some(q => !isFinite(q[0]) || !isFinite(q[1]))) continue;
          const g = Math.round(30 + Math.random()*225);
          for(const [ctx, col] of [[sx, '#fff'], [ix, `rgb(${g},${g},${g})`]]){
            ctx.beginPath(); Q.forEach(([qx, qy], i) => i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)); ctx.closePath();
            ctx.fillStyle = ctx.strokeStyle = col; ctx.fill(); if(round > 0.3){ ctx.lineWidth = round*2; ctx.stroke(); } }
        }
      }
      const stones = E.lum(readCanvas(sc)), each = E.lum(readCanvas(ic));
      // the bevel: how far in from a stone's edge, up to the bevel's width (a chamfer distance from the joints)
      const joint = new Uint8Array(N); for(let i = 0; i < N; i++) joint[i] = stones[i] < 0.5 ? 1 : 0;
      const dist = chamferDistance(joint, ww, wh), bevel = new Float32Array(N);
      for(let i = 0; i < N; i++){ const t = Math.min(1, dist[i]/bev); bevel[i] = stones[i] < 0.5 ? 0 : Math.sin(t*Math.PI/2); }
      return [stones, bevel, each];
    } },

  // FILTER FORGE'S PYRAMIDS: a grid of pyramids (or cones, or domes), each its own height, at one or more sizes
  pyramids: { cat: 'Noise', label: 'Pyramids', ins: [], outs: ['heights', 'cells'],
    params: [PAT_R('scale', 'Scale', 10, 1, 80), PAT_R('octaves', 'Octaves', 1, 1, 5), PAT_R('round', 'Roundness', 0), PAT_R('vary', 'Height Variety', 50), PAT_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, unit, num } = E;
      const cells0 = Math.max(1, num(n, 'scale', 10)), oct = Math.max(1, Math.min(5, Math.round(num(n, 'octaves', 1)))), rd = num(n, 'round', 0)/100, vary = num(n, 'vary', 50)/100;
      const H = new Float32Array(N), id = new Float32Array(N); let norm = 0;
      for(let o = 0; o < oct; o++){ const cs = unit/(cells0*Math.pow(2, o)), gx = Math.ceil(ww/cs) + 1, gy = Math.ceil(wh/cs) + 1, a = Math.pow(0.5, o);
        const ht = new Float32Array(gx*gy), gr = new Float32Array(gx*gy); for(let i = 0; i < gx*gy; i++){ ht[i] = 1 - vary*Math.random(); gr[i] = Math.random(); }
        for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const cx = Math.floor(x/cs), cy = Math.floor(y/cs), fx = x/cs - cx - 0.5, fy = y/cs - cy - 0.5, q = y*ww + x;
          // pyramid (flat faces) → cone (round) at 50 → dome at 100
          const pyr = 1 - 2*Math.max(Math.abs(fx), Math.abs(fy)), r = Math.min(1, 2*Math.hypot(fx, fy)), cone = 1 - r, dome = Math.sqrt(Math.max(0, 1 - r*r));
          const s = rd < 0.5 ? pyr + (cone - pyr)*rd*2 : cone + (dome - cone)*(rd - 0.5)*2;
          H[q] += Math.max(0, s)*ht[cy*gx + cx]*a; if(o === 0) id[q] = gr[cy*gx + cx]; }
        norm += a; }
      for(let i = 0; i < N; i++) H[i] /= norm;
      return [H, id];
    } },

  // FILTER FORGE'S NOISE GRADIENT: a gray map colored by a gradient of many stops between two colors, each stop
  // straying from the line between them: a palette that drifts, as nebulae and old dyes do
  noisegrad: { cat: 'Light & Color', label: 'Noise Gradient', ins: ['field', 'color a', 'color b'], outs: ['picture'], io: { ins: ['field', 'colour', 'colour'], outs: ['image'] },
    params: [PAT_R('stops', 'Stops', 8, 2, 32), PAT_R('drift', 'Color Drift', 40), PAT_R('smooth', 'Smoothness', 70), ['ca', 'Color A', 'text', '#14102A'], ['cb', 'Color B', 'text', '#E8C8E0'], PAT_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, input, num, P, asField } = E;
      const f = asField(input(n, 1)), K = Math.max(2, Math.min(32, Math.round(num(n, 'stops', 8)))), drift = num(n, 'drift', 40)/100, sm = num(n, 'smooth', 70)/100;
      const ca = input(n, 2), cb = input(n, 3), A = Array.isArray(ca) ? ca : patHex(P(n, 'ca', '#14102A')), B = Array.isArray(cb) ? cb : patHex(P(n, 'cb', '#E8C8E0'));
      // the stops: along the line from A to B, each turned in hue and moved in saturation and value by the drift
      const stops = Array.from({ length: K }, (_, k) => { const t = k/(K - 1), c = [0, 1, 2].map(i => A[i] + (B[i] - A[i])*t), [h, s, v] = patHsv(c);
        return patRgb([((h + (Math.random() - 0.5)*drift*0.5) % 1 + 1) % 1, patClamp(s + (Math.random() - 0.5)*drift*0.8), patClamp(v + (Math.random() - 0.5)*drift*0.5)]); });
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const v = f ? patClamp(f[i]) : (i % ww)/Math.max(1, ww - 1), t = v*(K - 1), j = Math.min(K - 2, Math.floor(t));
        // Smoothness: hard bands at 0, each stop running straight into the next at 100 (eased between)
        let u = patClamp((t - j - 0.5)/Math.max(1e-3, sm) + 0.5); u += (u*u*(3 - 2*u) - u)*(1 - sm);
        const a = stops[j], b = stops[j + 1]; o.r[i] = a[0] + (b[0] - a[0])*u; o.g[i] = a[1] + (b[1] - a[1])*u; o.b[i] = a[2] + (b[2] - a[2])*u; }
      return [o];
    } },

  // FILTER FORGE'S EXTRACT HSB and ASSEMBLE HSB: a picture as hue, saturation and brightness, and back
  splithsb: { cat: 'Combine', label: 'Split HSB', ins: ['picture'], outs: ['hue', 'saturation', 'brightness'], io: { ins: ['image'], outs: ['field', 'field', 'field'] }, req: true,
    params: [], cost: () => 1,
    run(E, n){ const { N, input, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const h = new Float32Array(N), s = new Float32Array(N), v = new Float32Array(N);
      for(let i = 0; i < N; i++){ const c = patHsv([patClamp(im.r[i]), patClamp(im.g[i]), patClamp(im.b[i])]); h[i] = c[0]; s[i] = c[1]; v[i] = c[2]; }
      return [h, s, v]; } },
  mergehsb: { cat: 'Combine', label: 'Merge HSB', ins: ['hue', 'saturation', 'brightness'], outs: ['picture'], io: { ins: ['field', 'field', 'field'], outs: ['image'] },
    params: [], cost: () => 1,
    run(E, n){ const { N, input, asField } = E; const h = asField(input(n, 1)), s = asField(input(n, 2)), v = asField(input(n, 3)); if(!h && !s && !v) return null;
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const c = patRgb([((h ? h[i] : 0) % 1 + 1) % 1, patClamp(s ? s[i] : 1), patClamp(v ? v[i] : 1)]); o.r[i] = c[0]; o.g[i] = c[1]; o.b[i] = c[2]; }
      return [o]; } },
  // FILTER FORGE'S EXTRACT LAB and ASSEMBLE LAB: lightness as the eye sees it, and two color axes
  splitlab: { cat: 'Combine', label: 'Split Lab', ins: ['picture'], outs: ['lightness', 'green–red', 'blue–yellow'], io: { ins: ['image'], outs: ['field', 'field', 'field'] }, req: true,
    params: [], cost: () => 1.5,
    run(E, n){ const { N, input, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N);
      for(let i = 0; i < N; i++){ const c = patToLab(patClamp(im.r[i]), patClamp(im.g[i]), patClamp(im.b[i])); L[i] = c[0]; A[i] = c[1]; B[i] = c[2]; }
      return [L, A, B]; } },
  mergelab: { cat: 'Combine', label: 'Merge Lab', ins: ['lightness', 'green–red', 'blue–yellow'], outs: ['picture'], io: { ins: ['field', 'field', 'field'], outs: ['image'] },
    params: [], cost: () => 1.5,
    run(E, n){ const { N, input, asField } = E; const l = asField(input(n, 1)), a = asField(input(n, 2)), b = asField(input(n, 3)); if(!l && !a && !b) return null;
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const c = patFromLab(l ? l[i] : 0.5, a ? a[i] : 0.5, b ? b[i] : 0.5); o.r[i] = c[0]; o.g[i] = c[1]; o.b[i] = c[2]; }
      return [o]; } },

  // FILTER FORGE'S MEDIAN and PERCENTILE: each point takes the middle value of those around it (or another rank)
  median: { cat: 'Shape', label: 'Median', ins: ['picture'], outs: ['picture'], io: { ins: ['image'], outs: ['image'] }, req: true,
    params: [PAT_R('radius', 'Radius', 10, 1, 100), PAT_R('rank', 'Percentile', 50)],
    cost: () => 3,
    run(E, n){ const { ww, wh, unit, input, num, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const r = Math.max(1, Math.round(num(n, 'radius', 10)*unit/1536*1.2)), p = num(n, 'rank', 50)/100;
      const ch = c => patRank(patRank(c, ww, wh, r, p, true), ww, wh, r, p, false);
      return [im.r === im.g && im.g === im.b ? (f => ({ r: f, g: f, b: f }))(ch(im.r)) : { r: ch(im.r), g: ch(im.g), b: ch(im.b) }]; } },

  // FILTER FORGE'S MAP SWITCH: a map chooses, point by point, which of up to four pictures shows
  mapswitch: { cat: 'Combine', label: 'Map Switch', ins: ['by', 'a', 'b', 'c', 'd'], outs: ['picture'], io: { ins: ['field', 'image', 'image', 'image', 'image'], outs: ['image'] }, req: true,
    params: [PAT_R('soft', 'Softness', 10)],
    cost: () => 1,
    run(E, n){ const { N, input, num, asField, asImage } = E; const by = asField(input(n, 1)); if(!by) return null;
      const pics = [2, 3, 4, 5].map(j => input(n, j)).filter(v => v != null).map(asImage); if(!pics.length) return null;
      const K = pics.length, sf = num(n, 'soft', 10)/100*0.5, o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const t = patClamp(by[i])*K, j = Math.min(K - 1, Math.floor(t)), f = t - j;
        // within Softness of a band's edge, the two pictures blend
        let k = j, w = 0; if(sf > 0){ if(f > 1 - sf && j < K - 1){ k = j + 1; w = (f - (1 - sf))/(2*sf); } else if(f < sf && j > 0){ k = j - 1; w = (sf - f)/(2*sf); } }
        const A = pics[j], B = pics[k]; o.r[i] = A.r[i] + (B.r[i] - A.r[i])*w; o.g[i] = A.g[i] + (B.g[i] - A.g[i])*w; o.b[i] = A.b[i] + (B.b[i] - A.b[i])*w; }
      return [o]; } },

  // FILTER FORGE'S FLIP: a picture mirrored, left to right or top to bottom (Mirror folds; Flip turns it over)
  flip: { cat: 'Shape', label: 'Flip', ins: ['picture'], outs: ['picture'], io: { ins: ['image'], outs: ['image'] }, req: true,
    params: [PAT_SEL('axis', 'Flip', ['left to right', 'top to bottom', 'both'])],
    cost: () => 0.5,
    run(E, n){ const { ww, wh, N, input, P, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const ax = P(n, 'axis', 'left to right'), fx = ax !== 'top to bottom', fy = ax !== 'left to right', o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, s = (fy ? wh - 1 - y : y)*ww + (fx ? ww - 1 - x : x); o.r[q] = im.r[s]; o.g[q] = im.g[s]; o.b[q] = im.b[s]; }
      return [o]; } },

  // FILTER FORGE'S ROTATE and SCALE (ROADMAP F8; Tile & Rotate did both, on gray maps only, without a centre or a choice
  // of edges): a picture turned, or made larger or smaller, about a centre anywhere on the page; what lies past its edges
  // repeats, mirrors, or stretches the edge. Read between pixels (bilinear), so a slow turn never steps.
  rotate: { cat: 'Shape', label: 'Rotate', ins: ['picture'], outs: ['picture'], io: { ins: ['image'], outs: ['image'] }, req: true,
    params: [PAT_R('angle', 'Angle', 0, 0, 360), PAT_R('cx', 'Center Across', 50), PAT_R('cy', 'Center Down', 50), PAT_SEL('edges', 'Past the Edges', ['repeat', 'mirror', 'stretch the edge'])],
    cost: () => 1,
    run(E, n){ const { ww, wh, input, num, P, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const a = -num(n, 'angle', 0)*Math.PI/180, ca = Math.cos(a), sa = Math.sin(a), cx = num(n, 'cx', 50)/100*ww, cy = num(n, 'cy', 50)/100*wh;
      return [patResample(im, ww, wh, P(n, 'edges', 'repeat'), (x, y) => { const dx = x - cx, dy = y - cy; return [cx + dx*ca - dy*sa, cy + dx*sa + dy*ca]; })]; } },
  scale: { cat: 'Shape', label: 'Scale', ins: ['picture'], outs: ['picture'], io: { ins: ['image'], outs: ['image'] }, req: true,
    params: [PAT_R('scale', 'Scale', 100, 10, 400), PAT_R('stretch', 'Stretch', 0, -100, 100), PAT_R('cx', 'Center Across', 50), PAT_R('cy', 'Center Down', 50),
      PAT_SEL('edges', 'Past the Edges', ['repeat', 'mirror', 'stretch the edge'])],
    cost: () => 1,
    run(E, n){ const { ww, wh, input, num, P, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const k = Math.max(0.1, num(n, 'scale', 100)/100), st = num(n, 'stretch', 0)/100, kx = k*Math.pow(2, st), ky = k*Math.pow(2, -st);
      const cx = num(n, 'cx', 50)/100*ww, cy = num(n, 'cy', 50)/100*wh;
      return [patResample(im, ww, wh, P(n, 'edges', 'repeat'), (x, y) => [cx + (x - cx)/kx, cy + (y - cy)/ky])]; } },

  // FILTER FORGE'S PERSPECTIVE: a picture laid flat on the ground and seen at a slant, repeating to the horizon
  perspective: { cat: 'Shape', label: 'Perspective', ins: ['picture'], outs: ['picture'], io: { ins: ['image'], outs: ['image'] }, req: true,
    params: [PAT_R('tilt', 'Tilt', 50, 0, 95), PAT_R('scale', 'Scale', 100, 25, 400)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, input, num, asImage } = E; const im = asImage(input(n, 1)); if(!im) return null;
      const t = num(n, 'tilt', 50)/100, sc = 100/Math.max(25, num(n, 'scale', 100)), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      // the ground's depth at each row: 1 at the bottom (the picture as it is), farther toward the top
      const wrap = (v, m) => ((v % m) + m) % m;
      for(let y = 0; y < wh; y++){ const v = (y + 0.5)/wh, z = 1/(1 - t + t*v), vs = t > 1e-4 ? 1 - (z - 1)/t : v;
        for(let x = 0; x < ww; x++){ const u = (x + 0.5)/ww, us = 0.5 + (u - 0.5)*z;
          const sx = wrap(us*sc*ww - 0.5, ww), sy = wrap((vs - 1)*sc*wh + wh - 0.5, wh), x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0, x1 = (x0 + 1) % ww, y1 = (y0 + 1) % wh, q = y*ww + x;
          for(const c of ['r', 'g', 'b']){ const a = im[c]; o[c][q] = (a[y0*ww + x0]*(1 - fx) + a[y0*ww + x1]*fx)*(1 - fy) + (a[y1*ww + x0]*(1 - fx) + a[y1*ww + x1]*fx)*fy; } } }
      return [o]; } },

  // FILTER FORGE'S 3- AND 5-COLOR GRADIENTS and ELEVATION GRADIENT: a gray map colored by up to five colors
  gradmap: { cat: 'Light & Color', label: 'Gradient Map', ins: ['field', 'color 1', 'color 2', 'color 3', 'color 4', 'color 5'], outs: ['picture'],
    io: { ins: ['field', 'colour', 'colour', 'colour', 'colour', 'colour'], outs: ['image'] }, req: true,
    params: [PAT_R('stops', 'Colors Used', 3, 2, 5), PAT_SEL('blend', 'Transition', ['smooth', 'bands']),
      ['c1', 'Color 1', 'text', '#120C18'], ['c2', 'Color 2', 'text', '#7A3050'], ['c3', 'Color 3', 'text', '#F2C8A0'], ['c4', 'Color 4', 'text', '#80B0D0'], ['c5', 'Color 5', 'text', '#FFFFFF']],
    cost: () => 1,
    run(E, n){ const { N, input, num, P, asField } = E;
      const f = asField(input(n, 1)); if(!f) return null;
      const k = Math.max(2, Math.min(5, Math.round(num(n, 'stops', 3)))), bands = P(n, 'blend', 'smooth') === 'bands';
      const DEF = ['#120C18', '#7A3050', '#F2C8A0', '#80B0D0', '#FFFFFF'];
      const cols = [1, 2, 3, 4, 5].slice(0, k).map(i => { const w = input(n, i + 1); return Array.isArray(w) ? w : patHex(P(n, 'c' + i, DEF[i - 1])); });
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const t = patClamp(f[i])*(k - 1), j = Math.min(k - 2, Math.floor(t)), u = bands ? (t - j < 0.5 ? 0 : 1) : t - j, a = cols[j], b = cols[j + 1];
        o.r[i] = a[0] + (b[0] - a[0])*u; o.g[i] = a[1] + (b[1] - a[1])*u; o.b[i] = a[2] + (b[2] - a[2])*u; }
      return [o];
    } },

  // GLOW (Ruby: a bloom took a dozen parts — blurs and screens — and a phone's memory): light given off, in one part.
  // Where the glow map is bright, a halo spreads (Radius) and a wide, faint aura beyond it (Aura), colored and
  // screened over the picture, the bright places themselves burning hottest (Core). Screening only ever adds light.
  glow: { cat: 'Light & Color', label: 'Glow', ins: ['picture', 'glows', 'color'], outs: ['picture'], io: { ins: ['image', 'field', 'colour'], outs: ['image'] },
    maps: ['strength:4'],
    params: [PAT_R('radius', 'Radius', 22), PAT_R('aura', 'Aura', 60, 0, 200), PAT_R('strength', 'Strength', 85), PAT_R('auraK', 'Aura Strength', 45), PAT_R('core', 'Core', 45), ['hex', 'Color', 'text', '#FFE2B0']],
    cost: () => 2,
    run(E, n){ const { N, unit, input, num, map, at, P, asField, asImage, boxBlur } = E;
      const pic = asImage(input(n, 1) ?? 0), src = asField(input(n, 2)); if(!src) return [pic];
      const w = input(n, 3), c = Array.isArray(w) ? w : patHex(P(n, 'hex', '#FFE2B0')), k = unit/1536*1.2;
      const H = boxBlur(src, num(n, 'radius', 22)*k), ra = num(n, 'aura', 60)*k, A = ra >= 0.5 ? boxBlur(src, ra) : null;
      const ST = map(n, 'strength', 85), au = num(n, 'auraK', 45)/100, core = num(n, 'core', 45)/100;
      const o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      for(let i = 0; i < N; i++){ const g = patClamp(H[i]*at(ST, i)/100 + (A ? A[i]*au : 0) + src[i]*core);
        o.r[i] = 1 - (1 - pic.r[i])*(1 - g*c[0]); o.g[i] = 1 - (1 - pic.g[i])*(1 - g*c[1]); o.b[i] = 1 - (1 - pic.b[i])*(1 - g*c[2]); }
      return [o];
    } },

  // FILTER FORGE'S SPECTRUM: every hue in turn, across the page, round it, or along any gray map
  spectrum: { cat: 'Noise', label: 'Spectrum', ins: ['along'], outs: ['picture'], io: { ins: ['field'], outs: ['image'] },
    params: [PAT_SEL('shape', 'Shape', ['linear', 'radial', 'around', 'along a map']), PAT_R('angle', 'Angle', 0, 0, 360), PAT_R('repeat', 'Repeat', 1, 1, 12), PAT_R('sat', 'Saturation', 80), PAT_R('light', 'Lightness', 55)],
    cost: () => 1,
    run(E, n){ const { ww, wh, N, input, num, P, asField } = E;
      const shape = P(n, 'shape', 'linear'), along = asField(input(n, 1)), an = num(n, 'angle', 0)*Math.PI/180, rep = Math.max(1, num(n, 'repeat', 1)), s = num(n, 'sat', 80)/100, l = num(n, 'light', 55)/100;
      const ca = Math.cos(an), sa = Math.sin(an), o = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) };
      const hsl = (h, c) => { const k = (c + h*12) % 12, a = s*Math.min(l, 1 - l); return l - a*Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
      for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const q = y*ww + x, u = x/ww - 0.5, v = y/wh - 0.5;
        let t = shape === 'radial' ? Math.hypot(u, v)*2 : shape === 'around' ? Math.atan2(v, u)/(Math.PI*2) + 0.5 : shape === 'along a map' ? (along ? along[q] : 0) : 0.5 + u*ca + v*sa;
        t = ((t*rep % 1) + 1) % 1;
        o.r[q] = hsl(t, 0); o.g[q] = hsl(t, 8); o.b[q] = hsl(t, 4); }
      return [o];
    } },
};
