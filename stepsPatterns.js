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
 *   Border Mask · Lookup · Displace · Gradient Map (3- and 5-color,
 *   Elevation Gradient) · Spectrum.
 * Each carries its doc, ports, cost and whether its first input is required.
 * Names here are pat/PAT_: the bundle is one scope.
 */
import { CPU } from './texCore.js';

const PAT_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const PAT_SEL = (key, label, options) => [key, label, 'select', options[0], { options }];
const patClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
const patHex = h => { const n = parseInt(String(h || '#808080').replace('#', '').slice(0, 6), 16) || 0; return [(n >> 16)/255, ((n >> 8) & 255)/255, (n & 255)/255]; };

// ---- SCATTER: the shapes it can throw ----
// each drawn white on a canvas, centred at 0,0 with radius 1 (the caller scales and turns)
const PAT_SHAPES = ['dot', 'ring', 'star', 'cross', 'dash', 'diamond', 'spark', 'sigil', 'picture'];
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
  scatter: { cat: 'Marks', label: 'Scatter', ins: ['picture', 'where', 'which way'], outs: ['marks', 'heights', 'each mark'],
    io: { ins: ['image', 'field', 'field'], outs: ['field', 'field', 'field'] },
    params: [PAT_SEL('shape', 'Shape', PAT_SHAPES), PAT_R('count', 'Count', 60, 1, 400), PAT_R('size', 'Size', 20, 1, 100), PAT_R('vary', 'Size Variety', 50),
      PAT_R('turn', 'Turn', 100, 0, 100), PAT_R('clump', 'Clumping', 0), PAT_R('fade', 'Brightness Variety', 30), PAT_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 3,
    doc: 'Scatters copies of a mark across the page (dots, stars, sigils, or any picture), each with its own size, turn and brightness.',
    run(E, n){ const { ww, wh, N, unit, input, num, P, asField, asImage, carea, readCanvas } = E;
      const shape = P(n, 'shape', 'dot'), where = asField(input(n, 2)), way = asField(input(n, 3)), pic = shape === 'picture' ? asImage(input(n, 1)) : null;
      const count = Math.min(20000, Math.round(num(n, 'count', 60)/100*180*carea/1e6)), R0 = num(n, 'size', 20)/100*unit*0.12;
      const vary = num(n, 'vary', 50)/100, turn = num(n, 'turn', 100)/100, clump = num(n, 'clump', 0)/100, fade = num(n, 'fade', 30)/100;
      const mk = () => { const c = document.createElement('canvas'); c.width = ww; c.height = wh; const x = c.getContext('2d', CPU); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh); return [c, x]; };
      const [mc, mx] = mk(), [ic, ix] = mk();
      mx.globalCompositeOperation = 'lighten';
      // a picture to stamp, as a small canvas
      let stamp = null;
      if(pic){ const s = document.createElement('canvas'); s.width = ww; s.height = wh; const sx = s.getContext('2d', CPU), im = sx.createImageData(ww, wh);
        for(let i = 0; i < N; i++){ im.data[i*4] = pic.r[i]*255; im.data[i*4 + 1] = pic.g[i]*255; im.data[i*4 + 2] = pic.b[i]*255; im.data[i*4 + 3] = 255; } sx.putImageData(im, 0, 0); stamp = s; }
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
        const r = Math.max(0.5, R0*(1 - vary + vary*rand()*2*Math.min(1, 0.5 + rand())));
        let ang = (rand() - 0.5)*Math.PI*2*turn;
        if(way){ const q = Math.min(wh - 1, Math.max(0, y | 0))*ww + Math.min(ww - 1, Math.max(0, x | 0)); ang = way[q]*Math.PI*2 + (rand() - 0.5)*turn*0.6; }
        const g = Math.round(255*(1 - fade*rand())), id = Math.round(20 + rand()*235);
        for(const [ctx, col] of [[mx, `rgb(${g},${g},${g})`], [ix, `rgb(${id},${id},${id})`]]){
          ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(r, r); ctx.fillStyle = ctx.strokeStyle = col;
          if(stamp){ if(ctx === mx){ ctx.globalAlpha = g/255; ctx.drawImage(stamp, -1, -1, 2, 2); } else ctx.fillRect(-1, -1, 2, 2); }
          else { const s0 = st; patShape(ctx, shape, rand); if(ctx === mx) st = s0; }     // (the id pass draws the same sigil)
          ctx.restore(); }
      }
      const marks = E.lum(readCanvas(mc)), each = E.lum(readCanvas(ic));
      return [marks, E.boxBlur(marks, Math.max(1, R0*0.18)), each];
    } },

  // FILTER FORGE'S CHECKER, TILES and DOTS in one: a regular pattern, turned and sized
  grid: { cat: 'Noise', label: 'Grid & Dots', ins: [], outs: ['pattern'],
    params: [PAT_SEL('kind', 'Pattern', ['checker', 'grid lines', 'dots', 'hex dots', 'diamonds', 'stripes']), PAT_R('cells', 'Cells', 12, 2, 120), PAT_R('weight', 'Line or Dot Size', 30), PAT_R('angle', 'Angle', 0, 0, 360), PAT_R('soft', 'Softness', 10)],
    cost: () => 1,
    doc: 'A regular pattern: checkerboard, grid lines, dots in rows or in a honeycomb, diamonds, or stripes.',
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
    params: [PAT_SEL('shape', 'Shape', ['square', 'rounded', 'oval']), PAT_R('width', 'Width', 12, 0, 50), PAT_R('soft', 'Softness', 50), PAT_R('rough', 'Roughness', 0)],
    cost: () => 1,
    doc: 'A frame-shaped mask from the page’s edges: white at the edge, fading to black inward.',
    run(E, n){ const { ww, wh, unit, P, num, input, asField, field } = E;
      const shape = P(n, 'shape', 'square'), W = Math.max(0.001, num(n, 'width', 12)/100*unit), soft = Math.max(0.02, num(n, 'soft', 50)/100), rough = num(n, 'rough', 0)/100, R = asField(input(n, 1));
      let q = -1;
      return [field((u, v, x, y) => { q++;
        let d;                                                     // distance in from the edge, in pixels
        if(shape === 'oval'){ const dx = (x - ww/2)/(ww/2), dy = (y - wh/2)/(wh/2); d = (1 - Math.hypot(dx, dy))*Math.min(ww, wh)/2; }
        else if(shape === 'rounded'){ const r = W*1.5, cx = Math.min(Math.max(x, r), ww - r), cy = Math.min(Math.max(y, r), wh - r); d = Math.min(x, y, ww - x, wh - y);
          if((x < r || x > ww - r) && (y < r || y > wh - r)) d = r - Math.hypot(x - cx, y - cy); }
        else d = Math.min(x, y, ww - x, wh - y);
        if(R) d -= (R[q] - 0.5)*W*rough*2;
        const t = d/W; return patClamp(1 - (t - (1 - soft))/soft); })];
    } },

  // FILTER FORGE'S LOOKUP: a picture read at the places two gray maps name — refraction, foil, interference
  lookup: { cat: 'Shape', label: 'Lookup', ins: ['picture', 'across', 'down'], outs: ['picture'], io: { ins: ['image', 'field', 'field'], outs: ['image'] }, req: true,
    params: [PAT_R('amount', 'Amount', 100), PAT_SEL('edges', 'At the Edges', ['repeat', 'mirror', 'clamp']), PAT_R('scale', 'Scale', 100, 10, 400)],
    cost: () => 1,
    doc: 'Rebuilds a picture by reading it at positions given by two gray maps.',
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
  displace: { cat: 'Shape', label: 'Displace', ins: ['picture', 'by'], outs: ['picture'], io: { ins: ['image', 'field'], outs: ['image'] }, req: true,
    params: [PAT_R('amount', 'Amount', 30), PAT_R('blur', 'Smoothing', 20)],
    cost: () => 1.5,
    doc: 'Bends a picture as if seen through glass shaped like a gray map.',
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

  // FILTER FORGE'S 3- AND 5-COLOR GRADIENTS and ELEVATION GRADIENT: a gray map colored by up to five colors
  gradmap: { cat: 'Light & Color', label: 'Gradient Map', ins: ['field', 'color 1', 'color 2', 'color 3', 'color 4', 'color 5'], outs: ['picture'],
    io: { ins: ['field', 'colour', 'colour', 'colour', 'colour', 'colour'], outs: ['image'] }, req: true,
    params: [PAT_R('stops', 'Colors Used', 3, 2, 5), PAT_SEL('blend', 'Transition', ['smooth', 'bands']),
      ['c1', 'Color 1', 'text', '#120C18'], ['c2', 'Color 2', 'text', '#7A3050'], ['c3', 'Color 3', 'text', '#F2C8A0'], ['c4', 'Color 4', 'text', '#80B0D0'], ['c5', 'Color 5', 'text', '#FFFFFF']],
    cost: () => 1,
    doc: 'Colors a gray map with up to five colors: black takes the first, white the last.',
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

  // FILTER FORGE'S SPECTRUM: every hue in turn, across the page, round it, or along any gray map
  spectrum: { cat: 'Noise', label: 'Spectrum', ins: ['along'], outs: ['picture'], io: { ins: ['field'], outs: ['image'] },
    params: [PAT_SEL('shape', 'Shape', ['linear', 'radial', 'around', 'along a map']), PAT_R('angle', 'Angle', 0, 0, 360), PAT_R('repeat', 'Repeat', 1, 1, 12), PAT_R('sat', 'Saturation', 80), PAT_R('light', 'Lightness', 55)],
    cost: () => 1,
    doc: 'A rainbow: every hue in turn, across the page, from the center, around it, or along any gray map.',
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
