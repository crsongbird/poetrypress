/**
 * stepsImprint.js — IMPRINT (Floral Imprints' process part): a specimen's maps developed in a medium, as a photograph of
 * the real thing would show it (Ruby: "everything from white chalk to cyanotype to charcoal to pressed imprints").
 *
 *   Every imprint is one of four physical acts (docs/prior-art/floral-imprints.md §1): light through a mask (cyanotype,
 *   lumen), pressure on relief (rubbing, emboss, letterpress, foil), ink or dye carried from the plant or a block (nature
 *   print, eco-print, stamp, risograph), or the dried plant itself (pressed). So one set of maps feeds every medium:
 *     shape   where the specimen lies (Scatter's marks)
 *     maps    a picture packing its LAYERS (red: overlapping petals, how much light they stop), its PART (green: leaf and
 *             stem low, petals middle, the centre high) and its HEIGHT (blue)
 *     picture its own colours (a pressed flower, a watercolour, an eco-print's tannins)
 *     paper   the page's tooth: every medium follows it (§11.2, "the one rule that moves a result from illustrative to
 *             photographic")
 *     ground  the page beneath (Page Backdrop): under Normal the imprint lies on it; under any other blend on that
 *             blend's own neutral (white for Multiply, black for Screen, grey for Overlay), so only the marks touch the page
 *   It hands on a picture (the colour, never lit), a height and a gloss map, for the Light Engine to light from the dial:
 *   an emboss is only height, foil only shine, graphite's sheen its gloss — nothing is painted already lit.
 *
 * Haiku: / sun through a petal — / where the blue could not reach, white: / the shape of a day /
 */
import { fbmSampler, parseHex, dialVec } from './texCore.js';

const IMP_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
// THE MEDIA, in the Medium setting's order (bands, one each); By the Seed lets the texture's seed choose
export const IMPRINT_MEDIA = ['By the Seed', 'Cyanotype', 'Lumen Print', 'White Chalk', 'Rubbing', 'Graphite', 'Charcoal', 'Pressed Flower',
  'Blind Emboss', 'Gold Foil', 'Letterpress', 'Nature Print', 'Eco-print', 'Rubber Stamp', 'Risograph', 'Watercolour'];
// each medium's own colours (the research's tables, §2.4–7.3 [est]): its ink, its second colour, the paper it brings (if any)
const IMP_INK = {
  'Cyanotype':     ['#14315F', '#7FA6CF'],     // deep Prussian blue; the pale blue a translucent petal lets through
  'Lumen Print':   ['#5D5262', '#E9C64A'],     // the exposed paper's mauve-brown; the plant's sweat, a warm yellow
  'White Chalk':   ['#F2F0EA', '#C9D8B5'],
  'Rubbing':       ['#2A2930', '#4E6A86'],
  'Graphite':      ['#3F4144', '#9A9C9F'],
  'Charcoal':      ['#18181A', '#4A4746'],
  'Pressed Flower':['#7A2F2A', '#D9C8A2'],     // (its own colours, aged; the second, the tape)
  'Blind Emboss':  ['#F4F1E8', '#F4F1E8'],
  'Gold Foil':     ['#C9A54C', '#F5E4A3'],
  'Letterpress':   ['#23324F', '#A1402B'],
  'Nature Print':  ['#3F5B3A', '#6B4E34'],
  'Eco-print':     ['#5E5578', '#3E3D3A'],     // tannin and iron; the iron blanket's dark halo
  'Rubber Stamp':  ['#A1402B', '#6D2427'],
  'Risograph':     ['#FF48B0', '#3255A4'],     // fluorescent pink and a medium blue [est], two drums off register
  'Watercolour':   ['#914E72', '#3F5B3A'],
};
const impCol = (hex) => { const c = parseHex(hex); return [c.r/255, c.g/255, c.b/255]; };

// a box blur of a field, twice over (near enough a Gaussian), r in pixels
function impBlur(S, ww, wh, r){
  if(r < 1) return S;
  const N = ww*wh, T = new Float32Array(N), O = new Float32Array(N), n = 2*r + 1;
  const pass = (A, B) => {
    for(let y = 0; y < wh; y++){ let s = 0; for(let x = -r; x <= r; x++) s += A[y*ww + Math.min(ww - 1, Math.max(0, x))];
      for(let x = 0; x < ww; x++){ T[y*ww + x] = s/n; s += A[y*ww + Math.min(ww - 1, x + r + 1)] - A[y*ww + Math.max(0, x - r)]; } }
    for(let x = 0; x < ww; x++){ let s = 0; for(let y = -r; y <= r; y++) s += T[Math.min(wh - 1, Math.max(0, y))*ww + x];
      for(let y = 0; y < wh; y++){ B[y*ww + x] = s/n; s += T[Math.min(wh - 1, y + r + 1)*ww + x] - T[Math.max(0, y - r)*ww + x]; } } };
  pass(S, O); const O2 = new Float32Array(N); pass(O, O2); return O2;
}
const sat = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (a, b, v) => { const t = sat((v - a)/(b - a)); return t*t*(3 - 2*t); };

/**
 * Develop the maps in a medium. o: { ww, wh, M, T, part, Hs, pic, paper, ground, neutral, ink, ink2, medium, load, wear,
 * soft, light }. Returns { img, H, G }.
 */
export function developImprint(o){
  const { ww, wh } = o, N = ww*wh, unit = Math.min(ww, wh);
  let medium = o.medium;
  if(medium === 'By the Seed') medium = IMPRINT_MEDIA[1 + Math.floor(Math.random()*(IMPRINT_MEDIA.length - 1))];
  const [inkHex, ink2Hex] = IMP_INK[medium] || IMP_INK['Cyanotype'];
  const ink = o.ink || impCol(inkHex), ink2 = o.ink2 || impCol(ink2Hex), load = o.load, wear = o.wear, soft = o.soft;
  const M = o.M, T = o.T || M, part = o.part, Hs = o.Hs || M;
  // the page's tooth (a fine noise where none is wired), and the page beneath (its own, or the blend's neutral)
  let P = o.paper;
  if(!P){ const f = fbmSampler(Math.max(40, unit/6), 2); P = new Float32Array(N); for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) P[y*ww + x] = f(x/ww, y/wh); }
  const base = i => o.neutral === 'page' && o.ground ? [o.ground.r[i], o.ground.g[i], o.ground.b[i]] : o.neutral === 'white' ? [1, 1, 1] : o.neutral === 'black' ? [0, 0, 0] : o.neutral === 'mid' ? [0.5, 0.5, 0.5] : [0.94, 0.92, 0.88];
  // what every medium reads: the mask softened where the plant stood off the paper, its rim, its veins (thin ridges in
  // the layers), the light's way across the page (for chalk and graphite's tone), and a field of accidents for Wear
  const sr = Math.max(1, Math.round(unit*(0.002 + soft*0.012)));
  const Ms = impBlur(M, ww, wh, sr), Mw = impBlur(M, ww, wh, sr*3);
  const Tb = impBlur(T, ww, wh, Math.max(1, Math.round(unit*0.004)));
  const V = new Float32Array(N); for(let i = 0; i < N; i++) V[i] = sat((T[i] - Tb[i])*6 + (Hs[i] - Tb[i])*2);
  const acc = fbmSampler(6, 4), spk = fbmSampler(Math.max(30, unit/10), 2);
  const fail = new Float32Array(N); for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const i = y*ww + x;
    fail[i] = smooth(1 - wear*0.55, 1.02 - wear*0.4, acc(x/ww, y/wh)) * 0.8 + smooth(1 - wear*0.25, 1, spk(x/ww, y/wh))*0.6; }
  const lv = dialVec(o.light == null ? 315 : o.light), lm = Math.hypot(lv.lx, lv.ly) || 1, lx = lv.lx/lm, ly = lv.ly/lm;
  const shade = i => { const x = i % ww, y = (i - x)/ww, xl = Math.max(0, x - 1), xr = Math.min(ww - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(wh - 1, y + 1);
    const gx = (Hs[y*ww + xr] - Hs[y*ww + xl])*ww*0.02, gy = (Hs[yd*ww + x] - Hs[yu*ww + x])*wh*0.02; return sat(0.5 - (gx*lx + gy*ly)*2.5); };
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N), H = new Float32Array(N), GL = new Float32Array(N);
  const lay = (i, c, a) => { R[i] += (c[0] - R[i])*a; G[i] += (c[1] - G[i])*a; B[i] += (c[2] - B[i])*a; };
  const pic = o.pic;
  // the coated sheet of a sun print: a brushed panel inset from the page's edges, ragged where the brush ran out (§2.5)
  const coat = (medium === 'Cyanotype' || medium === 'Lumen Print') ? (() => { const f = fbmSampler(5, 3), inset = 0.035 + Math.random()*0.05, C = new Float32Array(N);
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const u = x/ww, v = y/wh, d = Math.min(u, v, 1 - u, 1 - v)*Math.min(ww, wh)/unit;
      const n = (f(u*1.3, v*1.3) - 0.5)*0.05 + (spk(u*0.5, v*7) - 0.5)*0.012; C[y*ww + x] = smooth(inset - 0.008, inset + 0.006, d + n); } return C; })() : null;
  for(let i = 0; i < N; i++){
    const b = base(i); R[i] = b[0]; G[i] = b[1]; B[i] = b[2];
    const p = P[i], m = M[i], ms = Ms[i], t = T[i], v = V[i], f = fail[i];
    H[i] = 0.45 + (p - 0.5)*0.12; GL[i] = 0.06;
    switch(medium){
      case 'Cyanotype': case 'Lumen Print': {
        // the paper goes blue (or mauve) where the sun reached it; where the plant lay it stays pale, a thin petal letting
        // a little light through (graded by how many layers lie there), its edges soft where it stood off the paper
        const exposed = coat[i]*(0.55 + 0.45*load)*(0.92 + (p - 0.5)*0.25), stop = sat(ms*(0.35 + 0.65*sat(t*1.6)));
        const dark = ink, pale = medium === 'Cyanotype' ? [0.95, 0.94, 0.9] : ink2;
        lay(i, dark, exposed*(1 - stop));
        // a translucent petal: some light got through (the paler blue), veins a shade deeper
        if(stop > 0.02){ const through = sat((1 - sat(t*1.7))*0.55 + v*0.35); const c = medium === 'Cyanotype' ? [ink2[0]*0.9 + 0.08, ink2[1]*0.9 + 0.08, ink2[2]*0.92 + 0.06] : pale;
          lay(i, c, coat[i]*stop*(1 - through*0.5)); lay(i, dark, coat[i]*stop*through*0.35*load); }
        // a lumen print's plant sweats where it lay: a warm halo about it (§2.2)
        if(medium === 'Lumen Print'){ const halo = sat(Mw[i] - ms)*1.6; lay(i, ink2, coat[i]*halo*0.45); }
        lay(i, [0.97, 0.95, 0.9], f*0.5*coat[i]);   // water spots and unexposed specks
        break; }
      case 'White Chalk': case 'Graphite': case 'Charcoal': {
        // a drawing: outline where the mask turns, tone from the light across its form, hatching in the shade, all broken
        // by the paper's tooth (chalk on its peaks; graphite and charcoal sink into the valleys and smear)
        const edge = sat(Math.abs(ms - Mw[i])*5), tone = m*(medium === 'White Chalk' ? shade(i) : 1 - shade(i));
        const x = i % ww, y = (i - x)/ww, hatch = 0.5 + 0.5*Math.sin((x*0.7071 + y*0.7071)/(unit*0.0055)*Math.PI);
        let d = sat(edge*(0.6 + 0.4*load) + tone*(0.25 + 0.5*load)*(hatch > 0.55 - tone*0.3 ? 1 : 0.35) + v*0.4*m);
        if(medium === 'Charcoal') d = sat(impBlurAt(Ms, Mw, i)*0.25 + d);   // charcoal's smudge into the paper about it
        const peak = medium === 'White Chalk' ? smooth(0.62 - d*0.55, 0.7 - d*0.45, p) : smooth(0.25 + (1 - d)*0.5, 0.15 + (1 - d)*0.55, 1 - p);
        const a = d*(medium === 'White Chalk' ? peak : 0.55 + 0.45*peak)*(1 - f*0.7);
        lay(i, ink, a);
        if(medium === 'Graphite'){ GL[i] = 0.06 + a*0.55; }
        H[i] += a*0.03; break; }
      case 'Rubbing': {
        // crayon dragged over paper laid on the plant: it catches on whatever stands up — the specimen's veins and rims
        // most — and on the paper's tooth; diagonal strokes
        const x = i % ww, y = (i - x)/ww, stroke = 0.5 + 0.5*Math.sin((x*0.94 - y*0.34)/(unit*0.004)*Math.PI);
        const relief = sat(m*(0.35 + Hs[i]*0.4) + v*0.9 + sat(ms - Mw[i])*1.5);
        const a = sat(relief*(0.4 + 0.6*load)*smooth(0.35, 0.65, p*0.7 + stroke*0.3) + 0.06*load*stroke*smooth(0.5, 0.7, p))*(1 - f*0.6);
        lay(i, ink, a); GL[i] = 0.06 + a*0.25; break; }
      case 'Pressed Flower': {
        // the dried plant itself, its colours shifted as they dry (reds and violets to brown and grey, yellows kept; §5.3),
        // a thin petal letting the paper through, a faint stain about it; tape strips are laid by the chain's seed below
        if(m > 0.01 && pic){ let r = pic.r[i], g = pic.g[i], bl = pic.b[i];
          const yellow = r > 0.55 && g > 0.45 && bl < 0.45;
          const age = 0.35 + 0.45*load;
          if(!yellow){ const grey = (r + g + bl)/3; r = r + (grey*0.85 + 0.1 - r)*age*0.6 + 0.06*age; g = g + (grey*0.8 + 0.06 - g)*age*0.6; bl = bl + (grey*0.7 - bl)*age*0.7; }
          const through = sat(1 - t*1.4)*0.45;
          lay(i, [r, g, bl], ms*(1 - through)*(1 - f*0.4));
          GL[i] = 0.06 + ms*0.18; H[i] += ms*0.06 + t*0.05; }
        const stain = sat(Mw[i]*1.4 - ms)*0.25*load; lay(i, [0.6, 0.5, 0.32], stain); break; }
      case 'Blind Emboss': {
        // only the paper, pushed up: no colour at all; the Light Engine shows it
        H[i] += (Ms[i]*0.7 + Mw[i]*0.3)*(0.18 + 0.35*load) + v*0.04*load; break; }
      case 'Gold Foil': {
        // a metal leaf where the die pressed, a little debossed, broken where the foil didn't take (§6.4)
        const a = smooth(0.35, 0.6, ms)*(1 - smooth(0.5, 0.9, f));
        const c = [ink[0] + (ink2[0] - ink[0])*v*0.6, ink[1] + (ink2[1] - ink[1])*v*0.6, ink[2] + (ink2[2] - ink[2])*v*0.6];
        lay(i, c, a); GL[i] = 0.06 + a*0.88; H[i] -= a*(0.04 + 0.08*load); break; }
      case 'Letterpress': {
        // ink pressed into the paper: the impression sinks, ink squeezes to a darker rim, the tooth shows through thin
        const a = smooth(0.4, 0.6, ms), rim = sat((ms - Mw[i])*4)*0.35, cover = a*(0.7 + 0.3*load)*(0.82 + 0.18*smooth(0.3, 0.6, p))*(1 - f*0.6);
        lay(i, ink, sat(cover + rim*a)); H[i] -= a*(0.08 + 0.16*load); GL[i] = 0.06 + cover*0.12; break; }
      case 'Nature Print': case 'Rubber Stamp': {
        // a block or the plant itself inked and pressed: veins carry the ink (nature print), a stamp's flat face prints
        // whole but unevenly, its rim heavier, its failures patchy (§7.1, §8)
        const nature = medium === 'Nature Print';
        const a = smooth(0.35, 0.55, ms)*(nature ? 0.45 + 0.55*sat(v*1.6 + t*0.4) : 0.85)*(0.55 + 0.45*load)*(0.75 + 0.25*smooth(0.3, 0.7, p));
        const rim = sat((ms - Mw[i])*4)*0.3;
        lay(i, nature && part && part[i] < 0.4 ? ink2 : ink, sat(a + rim*smooth(0.35, 0.55, ms))*(1 - f*0.85)); break; }
      case 'Eco-print': {
        // tannin from the leaf, iron in the blanket: grey-violet to brown prints, a dark halo of iron about each one (§7.1)
        const tan = smooth(0.3, 0.55, ms)*(0.45 + 0.55*sat(t + v))*(0.6 + 0.4*load), halo = sat(Mw[i]*1.3 - ms)*0.8;
        const c = pic && m > 0.05 ? [ink[0]*0.7 + pic.r[i]*0.3*0.6, ink[1]*0.7 + pic.g[i]*0.3*0.5, ink[2]*0.7 + pic.b[i]*0.3*0.5] : ink;
        lay(i, ink2, halo*(0.4 + 0.4*load)); lay(i, c, tan*(1 - f*0.5)); break; }
      case 'Risograph': {
        // two drums, two inks, off register: the flowers in one, the leaves in the other, each grainy and capped short of
        // solid (the drum never lays more than about 85%: §8)
        const x = i % ww, y = (i - x)/ww, off = Math.max(1, Math.round(unit*0.006*(0.5 + load)));
        const xo = Math.min(ww - 1, x + off), yo = Math.min(wh - 1, y + Math.round(off*0.6)), j = yo*ww + xo;
        const isLeaf = part ? part[i] < 0.4 : false, isLeafJ = part ? part[j] < 0.4 : false;
        const grain = smooth(0.2, 0.75, spk(x/ww*1.7, y/wh*1.7)*0.5 + p*0.5);
        if(!isLeaf) lay(i, ink, smooth(0.4, 0.6, ms)*0.85*(0.55 + 0.45*grain)*(1 - f*0.5));
        if(isLeafJ || (!part && Ms[j] > 0)) lay(i, ink2, smooth(0.4, 0.6, Ms[j])*0.8*(0.55 + 0.45*grain)*(1 - f*0.5));
        break; }
      case 'Watercolour': {
        // washes in the flower's own colours, paler than paint, darker at the edges where pigment gathers as it dries,
        // granulating into the paper's valleys (§9)
        if(ms > 0.01){ const c = pic ? [pic.r[i], pic.g[i], pic.b[i]] : ink;
          const rimW = sat((ms - Mw[i])*3.5), gran = smooth(0.2, 0.8, 1 - p)*0.35;
          lay(i, c, sat(ms*(0.38 + 0.3*load) + rimW*0.4 + gran*ms*0.5)*(1 - f*0.4)); }
        break; }
      default: break;
    }
  }
  // HERBARIUM TAPE: on a pressed sheet, a few gummed strips across the stems (§5.2)
  if(medium === 'Pressed Flower' && part){
    const strips = 2 + Math.floor(Math.random()*4), cand = [];
    for(let k = 0; k < 400 && cand.length < strips; k++){ const i = Math.floor(Math.random()*N); if(M[i] > 0.5 && part[i] < 0.4) cand.push(i); }
    for(const c of cand){ const cx = c % ww, cy = (c - cx)/ww, a = Math.random()*Math.PI, L = unit*(0.05 + Math.random()*0.03), Wd = unit*0.012;
      const ca = Math.cos(a), sa = Math.sin(a), r = Math.ceil(L);
      for(let y = Math.max(0, cy - r); y < Math.min(wh, cy + r); y++) for(let x = Math.max(0, cx - r); x < Math.min(ww, cx + r); x++){
        const dx = x - cx, dy = y - cy, u = dx*ca + dy*sa, v = -dx*sa + dy*ca; if(Math.abs(u) < L/2 && Math.abs(v) < Wd/2){ const i = y*ww + x; lay(i, ink2, 0.42); H[i] += 0.03; GL[i] = 0.3; } } }
  }
  return { img: { r: R, g: G, b: B }, H, G: GL, medium };
}
// (charcoal's smudge: the wider blur, past the mask)
function impBlurAt(Ms, Mw, i){ return sat(Mw[i] - Ms[i]*0.5); }

export const IMPRINT_STEPS = {
  imprint: { cat: 'Light & Color', label: 'Imprint', ins: ['shape', 'maps', 'picture', 'paper', 'ground', 'ink hue', 'second hue', 'light from'],
    outs: ['picture', 'height', 'gloss'], req: true,
    io: { ins: ['field', 'image', 'image', 'field', 'image', 'colour', 'colour', 'value'], outs: ['image', 'field', 'field'] },
    params: [[...IMP_R('medium', 'Medium: ' + IMPRINT_MEDIA.join(' · '), 7).slice(0, 4), { min: 0, max: 100, bands: IMPRINT_MEDIA }],
      IMP_R('load', 'Exposure · Pressure · Ink', 55), IMP_R('wear', 'Wear', 25), IMP_R('soft', 'Soft Edges', 30), IMP_R('variation', 'Variation', 0, 0, 99)],
    cost: () => 6,
    run(E, n){ const { ww, wh, N, input, num, asField, asImage, ctx } = E, M = asField(input(n, 1)); if(!M) return null;
      const maps = input(n, 2) != null ? asImage(input(n, 2)) : null, pic = input(n, 3) != null ? asImage(input(n, 3)) : null;
      const k = Math.min(IMPRINT_MEDIA.length - 1, Math.floor(num(n, 'medium', 7)/100*IMPRINT_MEDIA.length));
      const hue = c => Array.isArray(c) && !c.none ? [c[0], c[1], c[2]] : null, dv = input(n, 8);
      // (a Variation turns the medium's accidents without moving the specimens)
      const v = Math.round(num(n, 'variation', 0)); for(let s = 0; s < v*3; s++) Math.random();
      const out = developImprint({ ww, wh, M, T: maps ? maps.r : null, part: maps ? maps.g : null, Hs: maps ? maps.b : null, pic,
        paper: input(n, 4) != null ? asField(input(n, 4)) : null, ground: input(n, 5) != null ? asImage(input(n, 5)) : null,
        neutral: ctx.neutral || 'page', ink: hue(input(n, 6)), ink2: hue(input(n, 7)), medium: IMPRINT_MEDIA[k],
        load: num(n, 'load', 55)/100, wear: num(n, 'wear', 25)/100, soft: num(n, 'soft', 30)/100,
        light: typeof dv === 'number' ? dv*360 : (ctx.light ?? 315) });
      void N; return [out.img, out.H, out.G]; } },
};
