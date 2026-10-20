/**
 * paintKit.js — THE PAINTED THINGS: trees, buildings, rocks and the builders' works as a flat painter blocks them in
 * (docs/prior-art/painted-ringworld.md). Shared by the Painted Ringworld (stepsRing.js), Ring in the Sky's land
 * (stepsWhimsy.js paintShapeLand) and Night City's skyline (texSharpness.js genCityscape), so improving one improves all
 * (Ruby: "they're basically just squares or basic shapes … you can improve both generators at the same time").
 *
 * Each is a few flat shapes in two or three values (the shadow side, the body, the lit side, a highlight), its
 * silhouette doing the work: a spruce's drooping tiers, a broadleaf's lobes, a tower's base, shaft and crown. Detail
 * appears only where the thing is large enough to carry it (windows, floor bands, roof furniture), as a painter
 * simplifies with distance. Everything is drawn at (X, Y), the point where it meets the ground, from colours already
 * lit and hazed by the caller ({ dark, body, lit, glow, glow2, trunk, sd: the light's side ±1, L: the light's screen
 * direction }), with its own random stream R, and px(n) the export's pixels.
 *
 * Each thing takes ONE number from the caller's stream and keys each of its features to a stream of its own from it
 * (pkSub), so a thing crossing a size where it shows more detail keeps its shape, and the things after it keep theirs.
 */
import { mulberry32 } from './texCore.js';

const pkMix = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t);
const pkCss = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const pkPoly = (x, pts, fill) => { x.fillStyle = fill; x.beginPath(); pts.forEach(([X, Y], i) => i ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.closePath(); x.fill(); };
const pkDisc = (x, X, Y, r, fill) => { if(!(r > 0)) return; x.fillStyle = fill; x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill(); };
const pkEll = (x, X, Y, rx, ry, fill) => { if(!(rx > 0 && ry > 0)) return; x.fillStyle = fill; x.beginPath(); x.ellipse(X, Y, rx, ry, 0, 0, Math.PI*2); x.fill(); };
const PK_WHITE = [255, 248, 232], PK_BLACK = [0, 0, 0];
const pkSub = R => { const b = (R()*4294967296) >>> 0; return t => mulberry32((b ^ Math.imul(t, 0x9E3779B1)) >>> 0); };
export function pkGlow(x, X, Y, r, col, a){ if(!(r > 0.5)) return; x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(X, Y, 0, X, Y, r);
  g.addColorStop(0, pkCss(col, a)); g.addColorStop(1, pkCss(col, 0)); x.fillStyle = g; x.fillRect(X - r, Y - r, r*2, r*2); x.restore(); }
// a soft shadow where a thing stands, thrown away from the light
const pkFoot = (x, X, Y, r, c) => pkEll(x, X - c.sd*r*0.35, Y, r, r*0.22, pkCss(c.dark, 0.28));

// ---------------- TREES ----------------
// which trees each kind of world grows (the caller picks one of these by its stream)
export const PK_TREES = { wild: ['spruce', 'spruce', 'broadleaf', 'broadleaf', 'pine', 'poplar', 'birch'], magic: ['broadleaf', 'glow', 'glow', 'birch', 'willow', 'spruce'], ruins: ['dead', 'dead', 'spruce', 'broadleaf', 'pine'] };
// a crown of lobes (a broadleaf, a willow's, a poplar's): every lobe in shadow first, then each again smaller and
// toward the light in the body's colour, then a few small lit lobes on the lit side of the crown's top
function pkLobes(x, lobes, c, R, cx, cy, rr){
  const lx = c.L[0], ly = c.L[1];
  for(const [X, Y, r] of lobes) pkDisc(x, X, Y, r, pkCss(c.dark));
  for(const [X, Y, r] of lobes) pkDisc(x, X + lx*r*0.22, Y + ly*r*0.22, r*0.78, pkCss(c.body));
  for(const [X, Y, r] of lobes){ const fx = (X - cx)/rr, fy = (Y - cy)/rr; if(fx*lx + fy*ly < 0.05) continue;
    pkDisc(x, X + lx*r*0.38, Y + ly*r*0.38, r*0.42, pkCss(c.lit)); }
  // (a few sparks of the brightest light, on the lit edge of a lit lobe)
  if(rr > 6) for(let q = 0; q < 3; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = Math.atan2(ly, lx) + (R() - 0.5)*1.2; pkDisc(x, X + Math.cos(a)*r*0.6, Y + Math.sin(a)*r*0.6, r*0.14, pkCss(pkMix(c.lit, PK_WHITE, 0.35))); }
}
export function pkTree(x, X, Y, h, c, kind, R0, px){
  const sub = pkSub(R0), R = sub(1), RL = sub(2), sd = c.sd, rnd = (a, b) => a + (b - a)*R(), small = h < px(7);
  const trunk = (top, wd, lean = 0) => { x.strokeStyle = pkCss(c.trunk); x.lineWidth = Math.max(px(0.6), wd); x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + lean, Y - top); x.stroke(); };
  if(!small) pkFoot(x, X, Y, h*0.22, c);
  if(kind === 'spruce' || kind === 'fir'){
    // a spruce: a narrow cone of drooping tiers, each a jag below the last; its lit side a strip from the axis out
    trunk(h*0.16, h*0.05);
    const tiers = (t => small ? 3 : t)(5 + Math.floor(R()*3)), bw = h*rnd(0.2, 0.26), base = Y - h*0.1, L = [], Rt = [];
    for(let t = 0; t <= tiers; t++){ const u = t/tiers, yy = base - (h*0.9)*u, wd = bw*(1 - u)*(0.85 + 0.3*R());
      L.push([X - wd, yy + h*0.03], [X - wd*0.45, yy - h*0.02]); Rt.push([X + wd, yy + h*0.03], [X + wd*0.45, yy - h*0.02]); }
    const tip = [X, Y - h];
    pkPoly(x, [...L, tip, ...Rt.reverse()], pkCss(c.dark));
    const side = (sd > 0 ? Rt.slice().reverse() : L);
    pkPoly(x, [[X, base], ...side.map(([a, b]) => [X + (a - X)*0.92, b]), tip], pkCss(c.body));
    if(!small) for(let t = 1; t < tiers; t++){ const u = t/tiers, yy = base - h*0.9*u, wd = bw*(1 - u); pkPoly(x, [[X, yy - h*0.03], [X + sd*wd*0.85, yy + h*0.025], [X + sd*wd*0.3, yy + h*0.01]], pkCss(c.lit)); }
    return; }
  if(kind === 'pine'){
    // a pine: a tall bare trunk, leaning a little, under a flat umbrella of two or three clumps
    const lean = h*rnd(-0.08, 0.08), top = h*0.62; trunk(top, h*0.045, lean);
    if(!small){ x.lineWidth = Math.max(px(0.5), h*0.02); x.beginPath(); x.moveTo(X + lean*0.7, Y - top*0.75); x.lineTo(X + lean*0.7 - h*0.12, Y - top*0.9); x.moveTo(X + lean*0.85, Y - top*0.85); x.lineTo(X + lean + h*0.14, Y - top*1.02); x.stroke(); }
    const cx = X + lean, cy = Y - h*0.82, lobes = [];
    for(let q = 0; q < (small ? 2 : 4); q++){ const u = (q/(small ? 1 : 3)) - 0.5; lobes.push([cx + u*h*0.42 + rnd(-1, 1)*h*0.03, cy + Math.abs(u)*h*0.12 + rnd(-1, 1)*h*0.03, h*rnd(0.12, 0.16)]); }
    x.save(); x.translate(0, cy); x.scale(1, 0.55); x.translate(0, -cy); pkLobes(x, lobes, c, RL, cx, cy, h*0.3); x.restore(); return; }
  if(kind === 'poplar'){
    // a poplar: a tall flame of small lobes up a short trunk
    trunk(h*0.2, h*0.04); const lobes = [], n = small ? 3 : 7;
    for(let q = 0; q < n; q++){ const u = q/(n - 1); lobes.push([X + rnd(-1, 1)*h*0.04, Y - h*(0.25 + 0.65*u), h*(0.13 - 0.07*u)*(0.85 + 0.3*R())]); }
    pkLobes(x, lobes, c, RL, X, Y - h*0.6, h*0.4); return; }
  if(kind === 'birch'){
    // a birch: a slender pale trunk marked dark, an airy crown of few small lobes
    x.strokeStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.4)); x.lineWidth = Math.max(px(0.6), h*0.035); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + h*0.03, Y - h*0.8); x.stroke();
    if(!small){ x.fillStyle = pkCss(c.trunk); for(let q = 0; q < 4; q++){ const yy = Y - h*(0.15 + q*0.15); x.fillRect(X - h*0.02, yy, h*0.035, Math.max(px(0.5), h*0.012)); } }
    const lobes = []; for(let q = 0; q < (small ? 3 : 7); q++) lobes.push([X + h*0.03 + rnd(-0.13, 0.13)*h, Y - h*rnd(0.6, 0.92), h*rnd(0.09, 0.13)]);
    pkLobes(x, lobes, c, RL, X, Y - h*0.75, h*0.25); return; }
  if(kind === 'willow'){
    // a willow: a broad dome whose lobes hang down in long strands
    trunk(h*0.4, h*0.06); const cx = X, cy = Y - h*0.62, lobes = [];
    for(let q = 0; q < 6; q++){ const a = Math.PI + q/5*Math.PI; lobes.push([cx + Math.cos(a)*h*0.3, cy + Math.sin(a)*h*0.18, h*0.15]); }
    pkLobes(x, lobes, c, RL, cx, cy, h*0.35);
    if(!small){ x.strokeStyle = pkCss(c.body); x.lineWidth = Math.max(px(0.6), h*0.025); x.beginPath();
      for(let q = 0; q < 9; q++){ const sx = cx + (q/8 - 0.5)*h*0.7; x.moveTo(sx, cy - h*0.02); x.quadraticCurveTo(sx + (q/8 - 0.5)*h*0.1, cy + h*0.25, sx + (q/8 - 0.5)*h*0.14, cy + h*rnd(0.3, 0.5)); } x.stroke(); }
    return; }
  if(kind === 'dead'){
    // a dead tree: its trunk forking twice, bare
    x.strokeStyle = pkCss(c.dark); x.lineCap = 'round';
    const limb = (x0, y0, ang, len, wd, depth) => { const x1 = x0 + Math.sin(ang)*len, y1 = y0 - Math.cos(ang)*len; x.lineWidth = Math.max(px(0.5), wd); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      if(depth > 0) for(const s of [-1, 1]) limb(x1, y1, ang + s*rnd(0.3, 0.7), len*rnd(0.5, 0.7), wd*0.6, depth - 1); };
    limb(X, Y, rnd(-0.1, 0.1), h*0.45, h*0.06, small ? 1 : 3); return; }
  // a broadleaf (and the glowing trees): a trunk forking under a domed crown of five to eight lobes
  trunk(h*0.45, h*0.06);
  if(!small){ x.lineWidth = Math.max(px(0.5), h*0.03); x.beginPath(); x.moveTo(X, Y - h*0.3); x.lineTo(X - h*0.1, Y - h*0.5); x.moveTo(X, Y - h*0.34); x.lineTo(X + h*0.12, Y - h*0.52); x.stroke(); }
  const cx = X, cy = Y - h*0.64, rr = h*0.34, n = (t => small ? 3 : t)(5 + Math.floor(R()*4)), lobes = [], RG = sub(3);
  for(let q = 0; q < n; q++){ const a = Math.PI*(1.05 + 0.9*q/(n - 1)) + rnd(-0.15, 0.15), d = rr*rnd(0.4, 0.62); lobes.push([cx + Math.cos(a)*d*1.15, cy + Math.sin(a)*d*0.85 + rr*0.15, rr*rnd(0.42, 0.55)]); }
  lobes.push([cx, cy - rr*0.15, rr*0.55]);
  pkLobes(x, lobes, c, RL, cx, cy, rr);
  if(kind === 'glow'){ pkGlow(x, cx, cy, rr*2.2, c.glow, 0.4);
    for(let q = 0; q < (small ? 2 : 7); q++) pkDisc(x, cx + (RG()*1.6 - 0.8)*rr, cy + (RG()*1.3 - 0.6)*rr, Math.max(px(0.6), h*0.014), pkCss(pkMix(c.glow, PK_WHITE, 0.4), 0.95)); }
}

// ---------------- BUILDINGS ----------------
// each world's way of building (the caller passes one)
export const PK_STYLE = { cities: 'city', neon: 'neon', builders: 'builders', ruins: 'ruins', magic: 'magic', wilds: 'city' };
// the materials each style builds in (null: the world's own colour)
const PK_MATS = { city: [[196, 178, 150], [168, 96, 76], [150, 150, 146], [120, 150, 184], [72, 76, 88], null], neon: [[40, 36, 58], [30, 44, 60], null], builders: [null, null, [236, 232, 220]],
  ruins: [[150, 128, 104], [120, 104, 92], [96, 92, 90]], magic: [[176, 160, 210], [150, 120, 150], [210, 196, 170]] };
// the archetypes each style raises, by weight
const PK_ARCH = { city: [['glass', 3], ['deco', 2], ['slab', 2], ['brick', 3], ['dome', 0.6], ['needle', 0.4]], neon: [['glass', 3], ['slab', 2], ['deco', 1], ['needle', 1]],
  builders: [['pylon', 3], ['arch', 1], ['dome', 1.5], ['glass', 1]], ruins: [['brick', 2], ['glass', 2], ['slab', 2], ['deco', 1]], magic: [['wizard', 3], ['onion', 2], ['brick', 1]] };
// windows on a pitch of their own (a near building has many, not a few huge ones): panes by day, lamplit by night
function pkWindows(x, x0, top, wd, ht, c, night, lit, R, px, kind){
  const pitch = Math.max(px(3), wd*0.11), cols = Math.max(1, Math.floor(wd/pitch) - 1), rows = Math.min(90, Math.max(1, Math.floor(ht/pitch) - 1)), cw = wd/(cols + 1), rh = ht/(rows + 1);
  if(ht < px(10)) return;
  if(kind === 'ribbon'){ // a slab's ribbon windows: one long band per floor
    for(let r = 1; r <= rows; r++){ const on = night > 0.2 && R() < 0.55; x.fillStyle = on ? pkCss(c.glow, 0.8*night) : pkCss(c.dark, 0.55); x.fillRect(x0 + cw*0.4, top + r*rh, wd - cw*0.8, rh*0.38); } return; }
  if(kind === 'mullion'){ // a glass tower: tall panes between mullions, the sky's light on the lit half
    x.fillStyle = pkCss(lit, 0.18); x.fillRect(x0, top, wd*0.45, ht);
    x.strokeStyle = pkCss(c.dark, 0.45); x.lineWidth = Math.max(px(0.4), cw*0.08); x.beginPath(); for(let k = 1; k <= cols; k++){ x.moveTo(x0 + k*cw, top); x.lineTo(x0 + k*cw, top + ht); } x.stroke(); }
  if(night > 0.2 || kind === 'neon'){ x.fillStyle = pkCss(c.glow, 0.85*Math.max(night, kind === 'neon' ? 0.5 : 0));
    for(let r = 1; r <= rows; r++){ const floorLit = R() < 0.6; for(let k = 1; k <= cols; k++) if(R() < (floorLit ? 0.5 : 0.12)) x.fillRect(x0 + k*cw - cw*0.25, top + r*rh, cw*0.5, rh*0.45); } }
  else if(kind !== 'mullion'){ x.fillStyle = pkCss(c.dark, 0.5); for(let r = 1; r <= rows; r++) for(let k = 1; k <= cols; k++) x.fillRect(x0 + k*cw - cw*0.22, top + r*rh, cw*0.44, rh*0.42); }
}
// a box: its face to you and its side toward the light or away (depth by the light's side), with a parapet line
function pkBox(x, X, Y, top, wd, c, dep){
  const w2 = wd/2, side = dep*c.sd;
  pkPoly(x, [[X - w2, Y], [X - w2, top], [X + w2, top], [X + w2, Y]], pkCss(c.body));
  pkPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2, top], [X + c.sd*w2 + side, top + Math.abs(side)*0.3], [X + c.sd*w2 + side, Y]], pkCss(c.dark));
  return [X - w2, top, wd, Y - top];
}
export function pkBuilding(x, X, Y, h, wdt, c, style, night, R0, px){
  const sub = pkSub(R0), R = sub(1), RW = sub(2), RT = sub(3), RN = sub(4), RU = sub(5);
  const arch = PK_ARCH[style] || PK_ARCH.city; let tot = 0; for(const [, w] of arch) tot += w; let r = R()*tot, kind = arch[0][0]; for(const [k, w] of arch){ r -= w; if(r < 0){ kind = k; break; } }
  // each building its own material (warm stone, brick, concrete, blue glass, dark steel), laid over the world's own
  // colour and fading into the air with distance, so a city is many buildings and not one white block
  { const M = PK_MATS[style] || PK_MATS.city, m = M[Math.floor(R()*M.length)], k = 0.55*(1 - (c.haze || 0));
    if(m) c = { ...c, body: pkMix(c.body, pkMix(m, c.body, 0.3), k), lit: pkMix(c.lit, pkMix(m, PK_WHITE, 0.35), k), dark: pkMix(c.dark, pkMix(m, PK_BLACK, 0.45), k) }; }
  const neon = style === 'neon', ruin = style === 'ruins' && h > px(6), w2 = wdt/2, top = Y - h, dep = wdt*0.32, detail = h > px(14), lit = pkMix(c.lit, PK_WHITE, 0.2);
  // RUIN: its top broken away along a jagged line (the building is drawn only below it), its floors open to the air
  let bk = 0;
  if(ruin){ bk = top + h*(0.08 + 0.3*RU()); const jag = [[X + wdt*2, Y + h], [X - wdt*2, Y + h]];
    for(let q = 0; q <= 6; q++) jag.push([X - wdt*1.2 + wdt*2.4*q/6, bk + (RU() - 0.3)*h*0.2]);
    x.save(); x.beginPath(); jag.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip(); }
  if(kind === 'deco'){ // base, shaft and crown: setbacks stepping in, a spire on top
    const b1 = top + h*0.3, b2 = top + h*0.12;
    pkBox(x, X, Y, b1, wdt, c, dep); pkBox(x, X, b1, b2, wdt*0.72, c, dep*0.72); pkBox(x, X, b2, top, wdt*0.44, c, dep*0.44);
    pkPoly(x, [[X - wdt*0.08, top], [X, top - h*0.16], [X + wdt*0.08, top]], pkCss(c.lit));
    if(detail){ pkWindows(x, X - w2, b1, wdt, Y - b1, c, night, lit, RW, px); pkWindows(x, X - wdt*0.36, b2, wdt*0.72, b1 - b2, c, night, lit, RW, px);
      x.fillStyle = pkCss(c.lit, 0.6); x.fillRect(X - wdt*0.36, b1 - px(1), wdt*0.72, Math.max(px(0.6), h*0.008)); x.fillRect(X - wdt*0.22, b2 - px(1), wdt*0.44, Math.max(px(0.6), h*0.008)); } }
  else if(kind === 'slab'){ // a wide modern block: ribbon windows, a machine room on the roof
    const ww = wdt*1.5, hh = h*0.6, t2 = Y - hh; pkBox(x, X, Y, t2, ww, c, dep*1.2);
    if(detail){ pkWindows(x, X - ww/2, t2, ww, hh, c, night, lit, RW, px, neon ? 'neon' : 'ribbon'); pkBox(x, X + ww*(RT() - 0.5)*0.4, t2, t2 - hh*0.08, ww*0.25, c, dep*0.3); } }
  else if(kind === 'brick'){ // a mid-rise: a grid of windows, a cornice, a water tower now and then
    const hh = h*0.7, t2 = Y - hh; pkBox(x, X, Y, t2, wdt*1.1, c, dep);
    if(detail){ pkWindows(x, X - wdt*0.55, t2, wdt*1.1, hh, c, night, lit, RW, px); x.fillStyle = pkCss(c.dark); x.fillRect(X - wdt*0.6, t2 - Math.max(px(0.6), hh*0.02), wdt*1.2, Math.max(px(1), hh*0.03));
      if(RT() < 0.45 && !ruin){ const tx = X + wdt*(RT() - 0.5)*0.6, tw = wdt*0.22, th = tw*1.1; x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), tw*0.08); x.beginPath(); x.moveTo(tx - tw*0.4, t2); x.lineTo(tx - tw*0.3, t2 - th*0.5); x.moveTo(tx + tw*0.4, t2); x.lineTo(tx + tw*0.3, t2 - th*0.5); x.stroke();
        pkPoly(x, [[tx - tw/2, t2 - th*0.5], [tx - tw/2, t2 - th*1.2], [tx, t2 - th*1.45], [tx + tw/2, t2 - th*1.2], [tx + tw/2, t2 - th*0.5]], pkCss(c.body)); pkPoly(x, [[tx + c.sd*tw/2, t2 - th*0.5], [tx + c.sd*tw/2, t2 - th*1.2], [tx, t2 - th*1.45], [tx, t2 - th*0.5]], pkCss(c.dark)); } } }
  else if(kind === 'dome'){ // a drum under a ribbed dome, a lantern on top
    const dr = wdt*0.7, base = Y - h*0.35; pkBox(x, X, Y, base, dr*2, c, dep*0.5);
    x.fillStyle = pkCss(c.body); x.beginPath(); x.ellipse(X, base, dr, dr*0.85, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(c.lit); x.beginPath(); x.ellipse(X + c.sd*dr*0.25, base, dr*0.55, dr*0.8, 0, Math.PI, 0); x.fill();
    if(detail){ x.strokeStyle = pkCss(c.dark, 0.5); x.lineWidth = Math.max(px(0.5), dr*0.04); x.beginPath(); for(let q = 1; q < 5; q++){ const u = q/5*2 - 1; x.moveTo(X + u*dr, base); x.quadraticCurveTo(X + u*dr*0.6, base - dr*0.8, X, base - dr*0.85); } x.stroke();
      pkBox(x, X, base - dr*0.82, base - dr*1.05, dr*0.2, c, dr*0.06); }
    if(night > 0.2) pkGlow(x, X, base - dr*0.4, dr*1.6, c.glow, 0.45*night); }
  else if(kind === 'needle'){ // a needle: a thin shaft, a saucer high up, a mast
    const sh = h*1.3, st = Y - sh*0.8; x.fillStyle = pkCss(c.body); x.fillRect(X - wdt*0.08, st, wdt*0.16, sh*0.8);
    pkEll(x, X, st, wdt*0.5, wdt*0.12, pkCss(c.body)); pkEll(x, X + c.sd*wdt*0.1, st - wdt*0.03, wdt*0.32, wdt*0.07, pkCss(c.lit));
    x.fillRect(X - Math.max(px(0.4), wdt*0.02), st - sh*0.2, Math.max(px(0.8), wdt*0.04), sh*0.2);
    if(night > 0.2) pkDisc(x, X, st - sh*0.2, Math.max(px(1), wdt*0.04), pkCss(c.glow2, 0.9)); }
  else if(kind === 'pylon'){ // the builders' white pylon: rounded, seamless, a line of light up its edge
    const t2 = top + wdt*0.5; pkPoly(x, [[X - w2, Y], [X - w2*0.8, t2], [X + w2*0.8, t2], [X + w2, Y]], pkCss(c.body));
    x.fillStyle = pkCss(c.body); x.beginPath(); x.arc(X, t2, w2*0.8, Math.PI, 0); x.fill();
    pkPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2*0.8, t2], [X + c.sd*w2*0.3, t2], [X + c.sd*w2*0.4, Y]], pkCss(c.lit));
    x.fillStyle = pkCss(c.glow, 0.85); x.fillRect(X - c.sd*w2*0.55 - px(0.5), t2, Math.max(px(0.8), wdt*0.05), Y - t2);
    pkGlow(x, X, t2 - w2*0.5, wdt*0.9, c.glow, 0.5); }
  else if(kind === 'arch'){ // the builders' arch: two legs and a span, light beneath it
    const aw = wdt*1.8, th = aw*0.16, ry = Y - h*0.5;
    x.fillStyle = pkCss(c.body); x.beginPath(); x.moveTo(X - aw/2, Y); x.lineTo(X - aw/2, ry); x.arc(X, ry, aw/2, Math.PI, 0); x.lineTo(X + aw/2, Y); x.lineTo(X + aw/2 - th, Y); x.lineTo(X + aw/2 - th, ry); x.arc(X, ry, aw/2 - th, 0, Math.PI, true); x.lineTo(X - aw/2 + th, Y); x.closePath(); x.fill();
    x.strokeStyle = pkCss(c.lit); x.lineWidth = Math.max(px(0.6), th*0.3); x.beginPath(); x.arc(X, ry, aw/2 - th*0.15, c.sd > 0 ? -Math.PI/2 : Math.PI, c.sd > 0 ? 0 : -Math.PI/2); x.stroke();
    pkGlow(x, X, Y - h*0.15, aw*0.4, c.glow, 0.35); }
  else if(kind === 'wizard'){ // a tower of the magi: a round tower, a tall cone of a roof, a lit window high up
    const tw = wdt*0.7, t2 = Y - h*0.75; pkBox(x, X, Y, t2, tw, c, tw*0.15);
    pkPoly(x, [[X - tw*0.65, t2], [X, top - h*0.1], [X + tw*0.65, t2]], pkCss(pkMix(c.dark, c.glow, 0.2))); pkPoly(x, [[X, t2], [X, top - h*0.1], [X + c.sd*tw*0.65, t2]], pkCss(pkMix(c.body, c.glow, 0.25)));
    if(detail) for(let q = 0; q < 3; q++){ const wy = t2 + (Y - t2)*(0.15 + q*0.28); x.fillStyle = pkCss(c.glow, 0.5 + 0.4*night); x.fillRect(X - tw*0.1, wy, tw*0.2, (Y - t2)*0.1); }
    pkGlow(x, X, t2 + (Y - t2)*0.2, tw*0.8, c.glow, 0.3 + 0.3*night); }
  else if(kind === 'onion'){ // an onion dome on a drum
    const dr = wdt*0.55, base = Y - h*0.45; pkBox(x, X, Y, base, dr*1.6, c, dep*0.4);
    x.fillStyle = pkCss(c.body); x.beginPath(); x.moveTo(X - dr*0.7, base); x.bezierCurveTo(X - dr*1.3, base - dr*0.9, X - dr*0.2, base - dr*1.4, X, base - dr*2); x.bezierCurveTo(X + dr*0.2, base - dr*1.4, X + dr*1.3, base - dr*0.9, X + dr*0.7, base); x.fill();
    x.fillStyle = pkCss(pkMix(c.lit, c.glow, 0.3)); x.beginPath(); x.moveTo(X, base); x.bezierCurveTo(X + c.sd*dr*1.2, base - dr*0.9, X + c.sd*dr*0.15, base - dr*1.4, X, base - dr*2); x.fill();
    if(night > 0.2) pkGlow(x, X, base - dr, dr*2, c.glow, 0.4*night); }
  else { // 'glass': a tower of glass, a slanted or stepped top, a mast
    const sl = R() < 0.4 ? h*0.08*(R() < 0.5 ? 1 : -1) : 0;
    pkPoly(x, [[X - w2, Y], [X - w2, top + Math.max(0, sl)], [X + w2, top + Math.max(0, -sl)], [X + w2, Y]], pkCss(c.body));
    pkPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2, top + Math.max(0, c.sd > 0 ? -sl : sl)], [X + c.sd*(w2 + dep), top + Math.abs(dep)*0.3 + Math.max(0, c.sd > 0 ? -sl : sl)], [X + c.sd*(w2 + dep), Y]], pkCss(c.dark));
    if(detail) pkWindows(x, X - w2, top + Math.abs(sl), wdt, h - Math.abs(sl), c, night, lit, RW, px, neon ? 'neon' : 'mullion');
    if(R() < 0.35){ x.fillStyle = pkCss(c.dark); x.fillRect(X - Math.max(px(0.4), wdt*0.02), top - h*0.14, Math.max(px(0.8), wdt*0.04), h*0.14); if(night > 0.2) pkDisc(x, X, top - h*0.14, Math.max(px(0.8), wdt*0.03), pkCss([255, 80, 70], 0.9)); } }
  // NEON: the edges in light, a sign hung on the face, its glow on the air
  if(neon && h > px(8) && kind !== 'needle'){ const R = RN; x.strokeStyle = pkCss(c.glow2, 0.85); x.lineWidth = Math.max(px(0.6), wdt*0.03); if(kind === 'glass'){ x.beginPath(); x.moveTo(X - w2, Y); x.lineTo(X - w2, top); x.lineTo(X + w2, top); x.lineTo(X + w2, Y); x.stroke(); }
    if(R() < 0.65){ const sh = h*0.14, sy = top + h*(0.12 + 0.45*R()), vert = R() < 0.5, col = R() < 0.5 ? c.glow : c.glow2;
      x.fillStyle = pkCss(col, 0.92); if(vert) x.fillRect(X - w2 - wdt*0.12, sy, wdt*0.14, sh*1.6); else x.fillRect(X - w2*0.8, sy, wdt*0.8, sh*0.45);
      pkGlow(x, X, sy, wdt*1.3, col, 0.35); } }
  if(ruin){ x.restore(); const air = c.air || c.body, R = RU;
    if(detail){ x.strokeStyle = pkCss(c.dark, 0.7); x.lineWidth = Math.max(px(0.5), h*0.01); x.beginPath(); for(let q = 0; q < 3; q++){ const fy = bk + h*0.1*(q + 1); x.moveTo(X - w2, fy); x.lineTo(X + w2*(0.2 + 0.8*R()), fy); } x.stroke(); }
    for(let q = 0; q < 4; q++) pkPoly(x, [[X + (R() - 0.5)*wdt*1.6, Y + px(0.5)], [X + (R() - 0.5)*wdt*1.2, Y - h*0.06*R()], [X + (R() - 0.5)*wdt*1.6, Y + px(0.5)]], pkCss(pkMix(c.dark, air, 0.2))); }
}

// ---------------- ROCKS AND THE BUILDERS' WORKS ----------------
// a boulder in three facets: its top catching the light, its lit side, its shadow side; and its shadow on the ground
export function pkRock(x, X, Y, r, col, L, R){
  const sd = L[0] > 0 ? 1 : -1, ap = [X + sd*r*0.15 + (R() - 0.5)*r*0.3, Y - r*(0.75 + 0.3*R())], pts = [];
  for(let q = 0; q <= 6; q++){ const t = Math.PI + q/6*Math.PI; pts.push([X + Math.cos(t)*r*(0.85 + 0.3*R()), Y + Math.sin(t)*r*(0.55 + 0.35*R())]); }
  pkEll(x, X - sd*r*0.4, Y + r*0.05, r*1.2, r*0.22, pkCss(pkMix(col, PK_BLACK, 0.55), 0.3));
  pkPoly(x, pts, pkCss(pkMix(col, PK_BLACK, 0.3)));
  const litSide = sd > 0 ? pts.slice(3) : pts.slice(0, 4); pkPoly(x, [[X, Y], ...litSide, ap], pkCss(col));
  pkPoly(x, [ap, pts[2], pts[3], pts[4]], pkCss(pkMix(col, PK_WHITE, 0.22)));
}
// a spire of the builders: a tapering needle on a plinth, banded, a ring of light about it and its tip alight
export function pkSpire(x, X, Y, hh, c, broken, R, px){
  const bw = hh*0.06; if(hh < 2) return;
  pkPoly(x, [[X - bw*1.8, Y + bw*0.4], [X - bw*1.2, Y - bw*1.6], [X + bw*1.2, Y - bw*1.6], [X + bw*1.8, Y + bw*0.4]], pkCss(c.dark));
  pkPoly(x, [[X - bw*1.2, Y - bw*1.6], [X - bw*1.2, Y - bw*1.9], [X + bw*1.2, Y - bw*1.9], [X + bw*1.2, Y - bw*1.6]], pkCss(c.lit));
  const tip = broken ? 0.55 + 0.2*R() : 1;
  pkPoly(x, [[X - bw, Y - bw*1.9], [X - bw*(1 - tip)*0.8, Y - hh*tip], [X + bw*(1 - tip)*0.3, Y - hh*tip*0.97], [X + bw, Y - bw*1.9]], pkCss(c.body));
  pkPoly(x, [[X + c.sd*bw*0.1, Y - bw*1.9], [X + c.sd*bw*(1 - tip)*0.5, Y - hh*tip], [X + c.sd*bw, Y - bw*1.9]], pkCss(c.lit));
  if(hh > px(20)){ x.fillStyle = pkCss(c.dark, 0.6); for(let q = 1; q < 4; q++){ const u = q/4*tip, wd = bw*(1 - u*0.9); x.fillRect(X - wd, Y - hh*u, wd*2, Math.max(px(0.5), hh*0.006)); } }
  if(!broken){ const ry = Y - hh*0.42, rw = bw*2.2; x.strokeStyle = pkCss(c.glow, 0.85); x.lineWidth = Math.max(px(0.6), hh*0.006); x.beginPath(); x.ellipse(X, ry, rw, rw*0.22, 0, 0, Math.PI*2); x.stroke();
    pkGlow(x, X, Y - hh, bw*4, c.glow, 0.6); }
}
// standing stones (one, or a circle's worth in the wilds) or a monolith: slabs with a lit and a shaded side, carved lines
export function pkMonolith(x, X, Y, hh, c, count, R, px){
  const mw = hh*0.22; if(hh < 1.5) return;
  for(let q = 0; q < count; q++){ const ox = (q - (count - 1)/2)*mw*3.2, hq = hh*(q ? 0.55 + 0.35*R() : 1), tl = hq*0.12*(R() < 0.5 ? 1 : -1), Yq = Y + (count > 1 ? Math.abs(q - (count - 1)/2)*mw*0.3 : 0);
    pkPoly(x, [[X + ox - mw, Yq + mw*0.3], [X + ox - mw, Yq - hq], [X + ox + mw, Yq - hq + tl], [X + ox + mw, Yq + mw*0.3]], pkCss(c.body));
    pkPoly(x, [[X + ox + c.sd*mw, Yq + mw*0.3], [X + ox + c.sd*mw, Yq - hq + (c.sd > 0 ? tl : 0)], [X + ox + c.sd*mw*1.5, Yq - hq + mw*0.4], [X + ox + c.sd*mw*1.5, Yq + mw*0.5]], pkCss(c.dark));
    pkPoly(x, [[X + ox - mw, Yq - hq], [X + ox + mw, Yq - hq + tl], [X + ox + mw*0.6, Yq - hq + tl + mw*0.15], [X + ox - mw*0.6, Yq - hq + mw*0.15]], pkCss(c.lit));
    if(hq > px(14)){ x.strokeStyle = pkCss(c.dark, 0.55); x.lineWidth = Math.max(px(0.5), mw*0.06); x.beginPath(); for(let k = 0; k < 3; k++){ const yy = Yq - hq*(0.3 + k*0.18); x.moveTo(X + ox - mw*0.6, yy); x.lineTo(X + ox + mw*0.6, yy); } x.stroke(); } }
}
// a dome: a hemisphere on the ground, lit on one side, ribbed, an oculus glowing by night
export function pkDome(x, X, Y, r, c, night, px){
  if(r < 1.5) return;
  x.fillStyle = pkCss(c.dark); x.beginPath(); x.ellipse(X, Y, r, r*0.8, 0, Math.PI, 0); x.fill();
  x.fillStyle = pkCss(c.body); x.beginPath(); x.ellipse(X + c.sd*r*0.12, Y, r*0.85, r*0.76, 0, Math.PI, 0); x.fill();
  x.fillStyle = pkCss(c.lit); x.beginPath(); x.ellipse(X + c.sd*r*0.35, Y, r*0.45, r*0.66, 0, Math.PI, 0); x.fill();
  if(r > px(8)){ x.strokeStyle = pkCss(c.dark, 0.4); x.lineWidth = Math.max(px(0.5), r*0.03); x.beginPath(); for(let q = 1; q < 4; q++){ x.ellipse(X, Y, r, r*0.8*q/4, 0, Math.PI, 0); } x.stroke(); }
  pkEll(x, X, Y - r*0.8, r*0.12, r*0.05, pkCss(night > 0.2 ? c.glow : c.dark, 0.9));
  if(night > 0.2) pkGlow(x, X, Y - r*0.4, r*1.6, c.glow, 0.5*night);
}
// a cluster of crystals: prisms of two lights, faceted, their tips aglow
export function pkCrystals(x, X, Y, cs0, cols, c, n, R, px){
  for(let q = 0; q < n; q++){ const cs = cs0*(0.5 + R()), ang = (R() - 0.5)*0.9, ox = (R() - 0.5)*cs0*3, len = cs*(3 + 2*R()); if(cs < 1) continue;
    const tipX = X + ox + Math.sin(ang)*len, tipY = Y - Math.cos(ang)*len, nx = Math.cos(ang)*cs, ny = Math.sin(ang)*cs, sx = X + ox + Math.sin(ang)*len*0.75, sy = Y - Math.cos(ang)*len*0.75, cc = cols[q % cols.length];
    pkPoly(x, [[X + ox - nx, Y - ny], [sx - nx, sy - ny], [tipX, tipY], [sx + nx, sy + ny], [X + ox + nx, Y + ny]], pkCss(pkMix(cc, PK_BLACK, 0.4)));
    pkPoly(x, [[X + ox, Y], [sx, sy], [tipX, tipY], [sx + c.sd*nx, sy + c.sd*ny], [X + ox + c.sd*nx, Y + c.sd*ny]], pkCss(cc));
    pkPoly(x, [[sx, sy], [tipX, tipY], [sx + c.sd*nx*0.5, sy + c.sd*ny*0.5]], pkCss(pkMix(cc, PK_WHITE, 0.45)));
    pkGlow(x, tipX, tipY, cs*2, cc, 0.5); }
}

// ---------------- SKYLINES ----------------
// a building as one flat silhouette (Night City's rows, where only the outline and the windows read), from its left
// edge X0 standing on the ground line: the kinds a skyline is made of, each with its crown (Art Deco's setbacks, a
// slanted glass top, twin tops, a water tower, a mast, a dome, a gable, a vaulted roof). Fills with the current style,
// or with clip, makes its outline the clip (so windows fall only on the building).
// (its kinds: tower, setback, deco, slant, twin, brick, spire, dome, block, warehouse, house)
export function pkSilhouette(x, X0, ground, bw, bh, kind, R, px, clip = false){
  const top = ground - bh, R2 = (a, b) => a + (b - a)*R();
  x.beginPath();
  const rect = (a, t, w2) => x.rect(a, t, w2, ground - t);
  if(kind === 'setback'){ const s1 = bw*0.18, s2 = bw*0.34; x.moveTo(X0, ground); x.lineTo(X0, top + bh*0.35); x.lineTo(X0 + s1, top + bh*0.35); x.lineTo(X0 + s1, top + bh*0.12);
    x.lineTo(X0 + s2, top + bh*0.12); x.lineTo(X0 + s2, top); x.lineTo(X0 + bw - s2, top); x.lineTo(X0 + bw - s2, top + bh*0.12); x.lineTo(X0 + bw - s1, top + bh*0.12); x.lineTo(X0 + bw - s1, top + bh*0.35); x.lineTo(X0 + bw, top + bh*0.35); x.lineTo(X0 + bw, ground); }
  else if(kind === 'deco'){ // base, shaft, a stepped crown and its needle
    rect(X0, top + bh*0.18, bw); rect(X0 + bw*0.15, top + bh*0.08, bw*0.7); rect(X0 + bw*0.3, top, bw*0.4);
    x.moveTo(X0 + bw*0.42, top); x.lineTo(X0 + bw*0.5, top - bh*0.16); x.lineTo(X0 + bw*0.58, top); }
  else if(kind === 'slant'){ const up = R() < 0.5; x.moveTo(X0, ground); x.lineTo(X0, top + (up ? bh*0.12 : 0)); x.lineTo(X0 + bw, top + (up ? 0 : bh*0.12)); x.lineTo(X0 + bw, ground); }
  else if(kind === 'twin'){ rect(X0, top + bh*0.3, bw); rect(X0 + bw*0.05, top + bh*0.02, bw*0.36); rect(X0 + bw*0.59, top, bw*0.36); }
  else if(kind === 'brick'){ rect(X0, top, bw); x.rect(X0 - bw*0.03, top - Math.max(px(1), bh*0.02), bw*1.06, Math.max(px(1), bh*0.03));
    if(R() < 0.5){ const tx = X0 + bw*R2(0.2, 0.7), tw = bw*0.2; x.rect(tx, top - tw*1.5, tw, tw); x.moveTo(tx - tw*0.1, top - tw*1.5); x.lineTo(tx + tw*0.5, top - tw*1.95); x.lineTo(tx + tw*1.1, top - tw*1.5); x.rect(tx + tw*0.1, top - tw*0.6, tw*0.1, tw*0.6); x.rect(tx + tw*0.8, top - tw*0.6, tw*0.1, tw*0.6); } }
  else if(kind === 'dome'){ x.rect(X0, top + bw*0.3, bw, bh - bw*0.3); x.moveTo(X0 + bw, top + bw*0.3); x.arc(X0 + bw/2, top + bw*0.3, bw/2, 0, Math.PI, true); }
  else if(kind === 'house'){ x.moveTo(X0, ground); x.lineTo(X0, top + bh*0.4); x.lineTo(X0 + bw/2, top - bh*0.2); x.lineTo(X0 + bw, top + bh*0.4); x.lineTo(X0 + bw, ground);
    x.rect(X0 + bw*0.68, top - bh*0.1, bw*0.12, bh*0.3); }
  else if(kind === 'warehouse'){ x.moveTo(X0, ground); x.lineTo(X0, top + bh*0.3); x.quadraticCurveTo(X0 + bw/2, top - bh*0.1, X0 + bw, top + bh*0.3); x.lineTo(X0 + bw, ground); }
  else { rect(X0, top, bw);
    // a tower's roof: a machine room, a mast, or nothing
    const r = R(); if(r < 0.35) x.rect(X0 + bw*R2(0.15, 0.5), top - bh*0.05, bw*0.35, bh*0.05); else if(r < 0.55) x.rect(X0 + bw*0.5 - Math.max(px(0.5), bw*0.015), top - bh*0.15, Math.max(px(1), bw*0.03), bh*0.15); }
  if(clip){ x.clip(); return; }
  x.fill();
  if(kind === 'spire'){ x.fillRect(X0 + bw/2 - Math.max(px(0.5), bw*0.02), top - bh*0.18, Math.max(px(1), bw*0.04), bh*0.18); x.beginPath(); x.moveTo(X0 + bw*0.2, top); x.lineTo(X0 + bw/2, top - bh*0.1); x.lineTo(X0 + bw*0.8, top); x.fill(); }
}
