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

// ---------------- SIZES, IN METRES (docs/prior-art/painted-ringworld.md §5.1) ----------------
// One ruler for every painted thing (Ruby: "tag them all with a size range … buildings that are the size (small) of lil
// shrubs"): a caller turns metres into pixels with its own px-per-metre at the thing's distance, so a tree and a house
// stand in their true proportion at any distance. Heights [lo, hi]; buildings also their width. A thing larger than
// the view is culled by the caller, never shrunk.
export const PK_SIZE = {
  spruce: [18, 35], fir: [20, 45], stonepine: [12, 22], cedar: [20, 30], cypress: [12, 25], palm: [15, 28], baobab: [10, 22], acacia: [6, 14], saguaro: [5, 14],
  joshua: [5, 9], bamboo: [8, 20], fern: [3, 7], mushroom: [4, 20], crystal: [6, 20], cherry: [8, 12], bush: [1, 3], broadleaf: [12, 22], pine: [12, 20], poplar: [15, 25], birch: [10, 22], willow: [9, 15], dead: [8, 18], glow: [8, 18],
  brick: [9, 32, 12, 26], glass: [45, 220, 20, 45], deco: [70, 300, 30, 60], slab: [18, 55, 22, 45], dome: [16, 45, 18, 40], needle: [150, 450, 18, 30],
  pylon: [60, 400, 10, 30], arch: [30, 120, 30, 70], wizard: [22, 60, 8, 14], onion: [18, 50, 14, 30],
  cottage: [5, 8, 7, 12], aframe: [6, 10, 6, 10], barn: [9, 13, 8, 14], silo: [10, 25, 4, 8], windmill: [15, 25, 6, 9], stave: [10, 15, 7, 10], row: [7, 14, 15, 30],
  pagoda: [20, 45, 10, 16], torii: [4, 12, 5, 12], castle: [18, 40, 20, 40], lighthouse: [12, 40, 4, 8], cathedral: [45, 150, 40, 70], mosque: [35, 70, 40, 70],
  clock: [40, 96, 8, 14], factory: [12, 25, 30, 60], watertower: [15, 35, 8, 14], capsule: [30, 60, 15, 25], megablock: [30, 50, 50, 100], geodome: [20, 55, 40, 110],
  observatory: [12, 40, 12, 40], turbine: [80, 160, 6, 8],
  helper: [1.0, 1.5], drone: [0.5, 1.0], crawler: [0.6, 1.0], sentry: [1.8, 2.8], walker: [2.5, 4.5], derelict: [10, 22],
  fence: [0.9, 1.2], lamp: [3, 4.6], bench: [0.45, 0.5], mailbox: [1.1, 1.2], barrel: [0.9, 1.0], crate: [0.5, 1.1], sign: [1.8, 2.4], bicycle: [0.95, 1.05], hydrant: [0.6, 0.8],
  warden: [1.0, 1.4], gate: [14, 22], pod: [3, 4], spire: [90, 160], cogdoor: [8, 11], diner: [5, 6.5], car: [1.4, 1.6], billboard: [7, 9], suit: [6, 8], caps: [0.12, 0.15],
  rock: [1, 7], grass: [0.3, 1.1], figure: [1.6, 1.8] };
// a size in its range, tall specimens rarer (u: a draw from 0 to 1)
export const pkMetres = (kind, u, j = 0) => { const r = PK_SIZE[kind]; return r[2*j] + (r[2*j + 1] - r[2*j])*Math.pow(u, 1.5); };
// the archetype a style raises, by weight (the caller may choose it first, to size it before it is drawn)
export function pkArchOf(style, u){ const arch = PK_ARCH[style] || PK_ARCH.city; let tot = 0; for(const [, w] of arch) tot += w; let r = u*tot;
  for(const [k, w] of arch){ r -= w; if(r < 0) return k; } return arch[0][0]; }

// ---------------- TREES ----------------
// which trees each kind of world grows (the caller picks one of these by its stream)
export const PK_TREES = { wild: ['spruce', 'spruce', 'broadleaf', 'broadleaf', 'pine', 'poplar', 'birch'], magic: ['broadleaf', 'glow', 'glow', 'birch', 'willow', 'spruce'], ruins: ['dead', 'dead', 'spruce', 'broadleaf', 'pine'] };
// (and by the land's climate: dry country, warm country, jungle, and the fey places of magic worlds)
export const PK_FLORA = { dry: ['saguaro', 'saguaro', 'joshua', 'acacia', 'acacia', 'baobab', 'bush', 'dead'], warm: ['stonepine', 'stonepine', 'cypress', 'cypress', 'cedar', 'palm', 'broadleaf', 'cherry', 'bush'],
  jungle: ['palm', 'palm', 'fern', 'fern', 'bamboo', 'broadleaf', 'broadleaf', 'bush'], cold: ['fir', 'fir', 'spruce', 'spruce', 'birch', 'pine', 'bush'],
  fey: ['mushroom', 'mushroom', 'crystal', 'cherry', 'fern', 'glow', 'bamboo', 'willow'] };
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
  if(kind === 'spruce'){
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
  // ---- the silhouette families (docs/prior-art/painted-ringworld.md §5.2): each a few flat shapes its real tree's
  // proportions give, lit on the light's side ----
  if(kind === 'fir'){
    // a subalpine fir: a needle, many small stiff tiers to a long spike, barely wider than a column
    trunk(h*0.08, h*0.03); const tiers = small ? 4 : 10 + Math.floor(R()*4), bw = h*rnd(0.07, 0.1), L = [], Rt = [];
    for(let t = 0; t <= tiers; t++){ const u = t/tiers, yy = Y - h*0.06 - h*0.86*u, wd = bw*(1 - u*0.85)*(0.85 + 0.3*R()); L.push([X - wd, yy], [X - wd*0.55, yy - h*0.03]); Rt.push([X + wd, yy], [X + wd*0.55, yy - h*0.03]); }
    pkPoly(x, [...L, [X, Y - h], ...Rt.slice().reverse()], pkCss(c.dark));
    pkPoly(x, [[X, Y - h*0.06], ...(sd > 0 ? Rt : L).map(([a, b]) => [X + (a - X)*0.8, b]), [X, Y - h]], pkCss(c.body));
    if(!small) pkPoly(x, [[X, Y - h*0.5], [X + sd*bw*0.6, Y - h*0.3], [X + sd*bw*0.25, Y - h*0.75]], pkCss(c.lit, 0.7));
    return; }
  if(kind === 'stonepine'){
    // a stone pine: a straight trunk under one wide dome, flat beneath, an umbrella
    trunk(h*0.62, h*0.05, h*rnd(-0.04, 0.04)); const cy = Y - h*0.72, rx = h*rnd(0.38, 0.5), ry = h*0.2;
    if(!small){ x.lineWidth = Math.max(px(0.5), h*0.025); x.beginPath(); x.moveTo(X, Y - h*0.5); x.lineTo(X - rx*0.5, cy + ry*0.4); x.moveTo(X, Y - h*0.55); x.lineTo(X + rx*0.45, cy + ry*0.4); x.stroke(); }
    x.fillStyle = pkCss(c.dark); x.beginPath(); x.ellipse(X, cy, rx, ry*1.3, 0, Math.PI, 0); x.lineTo(X - rx, cy); x.fill();
    pkEll(x, X, cy, rx, ry*0.3, pkCss(c.dark));
    x.fillStyle = pkCss(c.body); x.beginPath(); x.ellipse(X + sd*rx*0.08, cy - ry*0.08, rx*0.9, ry*1.15, 0, Math.PI, 0); x.fill();
    if(!small){ x.fillStyle = pkCss(c.lit); x.beginPath(); x.ellipse(X + sd*rx*0.35, cy - ry*0.35, rx*0.42, ry*0.75, 0, Math.PI, 0); x.fill(); }
    return; }
  if(kind === 'cedar'){
    // a cedar of Lebanon: three to five flat shelves, each pushed a little aside, flat-topped
    trunk(h*0.85, h*0.05); const n = small ? 2 : 3 + Math.floor(R()*3);
    for(let q = 0; q < n; q++){ const u = q/(n - 1 || 1), yy = Y - h*(0.3 + 0.62*u), wd = h*(0.5 - 0.28*u)*(0.8 + 0.4*R()), ox = rnd(-1, 1)*h*0.08, th = h*0.07;
      pkPoly(x, [[X + ox - wd, yy], [X + ox - wd*0.8, yy - th], [X + ox + wd*0.8, yy - th*1.1], [X + ox + wd, yy], [X + ox + wd*0.6, yy + th*0.5], [X + ox - wd*0.6, yy + th*0.5]], pkCss(c.dark));
      pkPoly(x, [[X + ox - wd*0.85, yy - th*0.2], [X + ox - wd*0.7, yy - th], [X + ox + wd*0.75, yy - th*1.05], [X + ox + wd*0.9, yy - th*0.2]], pkCss(c.body));
      if(!small) x.fillStyle = pkCss(c.lit), x.fillRect(X + ox + (sd > 0 ? 0 : -wd*0.7), yy - th*1.05, wd*0.7, Math.max(px(0.6), th*0.25)); }
    return; }
  if(kind === 'cypress'){
    // an Italian cypress: one dark flame, widest a third of the way up, pointed
    trunk(h*0.06, h*0.04); const wd = h*rnd(0.06, 0.08), pts = (k) => { const P = []; for(let q = 0; q <= 10; q++){ const u = q/10, yy = Y - h*0.04 - h*0.96*u, w = wd*k*Math.sin(Math.PI*Math.pow(u, 0.62))*(u < 0.33 ? 1 : 1 - (u - 0.33)*0.35); P.push([X + w, yy]); } return P; };
    const Rp = pts(1), Lp = pts(-1); pkPoly(x, [...Lp, ...Rp.reverse()], pkCss(c.dark));
    pkPoly(x, [[X, Y - h*0.04], ...pts(sd*0.85), [X, Y - h]], pkCss(c.body));
    if(!small) pkPoly(x, [[X + sd*wd*0.15, Y - h*0.2], ...pts(sd*0.5).slice(2, 9), [X + sd*wd*0.1, Y - h*0.8]], pkCss(c.lit, 0.8));
    return; }
  if(kind === 'palm'){
    // a palm: a thin trunk curving up to one knot, eight to twelve fronds arching out and down from it
    const lean = h*rnd(0.08, 0.22)*(R() < 0.5 ? -1 : 1), tx = X + lean, ty = Y - h*0.9;
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.6), h*0.035); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + lean*0.1, Y - h*0.5, tx, ty); x.stroke();
    const n = small ? 5 : 8 + Math.floor(R()*5);
    for(const pass of [0, 1]) for(let q = 0; q < n; q++){ const a = Math.PI*(1 + q/(n - 1)) + rnd(-0.12, 0.12), len = h*rnd(0.3, 0.42), ex = tx + Math.cos(a)*len, ey = ty + Math.sin(a)*len*0.35 + len*0.35, mx = tx + Math.cos(a)*len*0.55, my = ty - len*0.2 + Math.sin(a)*len*0.2;
      const lit = Math.cos(a)*sd > 0.2; if(pass === 0 ? lit : !lit) continue;
      x.strokeStyle = pkCss(lit ? c.body : c.dark); x.lineWidth = Math.max(px(0.6), h*0.03); x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
      if(!small && lit){ x.strokeStyle = pkCss(c.lit, 0.8); x.lineWidth = Math.max(px(0.4), h*0.01); x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(mx, my - h*0.01, ex, ey); x.stroke(); } }
    if(!small) pkDisc(x, tx, ty + h*0.02, h*0.03, pkCss(pkMix(c.trunk, PK_BLACK, 0.3)));
    return; }
  if(kind === 'baobab'){
    // a baobab: a bottle of a trunk, stubby branches like roots in the air, a few small leaf pads
    const bw = h*rnd(0.16, 0.22), top = Y - h*0.62; x.fillStyle = pkCss(c.trunk); x.beginPath(); x.moveTo(X - bw, Y); x.bezierCurveTo(X - bw*1.1, Y - h*0.35, X - bw*0.5, top + h*0.05, X - bw*0.45, top); x.lineTo(X + bw*0.45, top); x.bezierCurveTo(X + bw*0.5, top + h*0.05, X + bw*1.1, Y - h*0.35, X + bw, Y); x.fill();
    x.fillStyle = pkCss(pkMix(c.trunk, PK_WHITE, 0.25)); x.beginPath(); x.moveTo(X + sd*bw*0.1, Y); x.bezierCurveTo(X + sd*bw*0.3, Y - h*0.35, X + sd*bw*0.35, top + h*0.05, X + sd*bw*0.35, top); x.lineTo(X + sd*bw*0.45, top); x.bezierCurveTo(X + sd*bw*0.5, top + h*0.05, X + sd*bw*1.1, Y - h*0.35, X + sd*bw, Y); x.fill();
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const pads = [];
    for(let q = 0; q < (small ? 3 : 6); q++){ const sx = X + (q/(small ? 2 : 5) - 0.5)*bw*0.8, ex = sx + (q/(small ? 2 : 5) - 0.5)*h*0.4 + rnd(-1, 1)*h*0.04, ey = top - h*rnd(0.18, 0.34);
      x.lineWidth = Math.max(px(0.5), h*0.03); x.beginPath(); x.moveTo(sx, top + h*0.02); x.quadraticCurveTo((sx + ex)/2, top - h*0.02, ex, ey); x.stroke(); pads.push([ex, ey, h*rnd(0.04, 0.07)]); }
    if(!small) pkLobes(x, pads, c, RL, X, top - h*0.25, h*0.3);
    return; }
  if(kind === 'acacia'){
    // an umbrella thorn: two or three limbs forking up to one flat, wide crown
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const cy = Y - h*0.82, cw = h*rnd(0.75, 1);
    for(const [ex, wd] of [[-0.35, 0.05], [0.3, 0.045], [0.05, 0.035]]){ x.lineWidth = Math.max(px(0.5), h*wd); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + ex*cw*0.2, Y - h*0.45, X + ex*cw, cy + h*0.04); x.stroke(); }
    pkPoly(x, [[X - cw, cy + h*0.02], [X - cw*0.8, cy - h*0.1], [X + cw*0.85, cy - h*0.11], [X + cw, cy + h*0.02], [X + cw*0.4, cy + h*0.07], [X - cw*0.45, cy + h*0.07]], pkCss(c.dark));
    pkPoly(x, [[X - cw*0.85, cy - h*0.02], [X - cw*0.7, cy - h*0.11], [X + cw*0.75, cy - h*0.12], [X + cw*0.9, cy - h*0.02]], pkCss(c.body));
    if(!small) pkPoly(x, [[X + (sd > 0 ? 0 : -cw*0.7), cy - h*0.11], [X + (sd > 0 ? cw*0.72 : 0), cy - h*0.12], [X + (sd > 0 ? cw*0.6 : -cw*0.1), cy - h*0.07], [X + (sd > 0 ? 0.05*cw : -cw*0.6), cy - h*0.07]], pkCss(c.lit));
    return; }
  if(kind === 'saguaro' || kind === 'joshua'){
    const col = kind === 'saguaro';
    if(col){ // a saguaro: a ribbed column, arms going out and then up
      const wd = h*0.09, arm = (side, at, len) => { const ax = X + side*wd, ay = Y - h*at, ox = ax + side*h*0.12; x.strokeStyle = pkCss(side === sd ? c.body : c.dark); x.lineWidth = wd*1.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(ax - side*wd*0.5, ay); x.lineTo(ox, ay); x.lineTo(ox, ay - h*len); x.stroke(); };
      const n = small ? 1 : Math.floor(R()*4); for(let q = 0; q < n; q++) arm(q % 2 ? 1 : -1, rnd(0.35, 0.6), rnd(0.15, 0.3));
      x.strokeStyle = pkCss(c.dark); x.lineWidth = wd*2; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h + wd); x.stroke();
      x.strokeStyle = pkCss(c.body); x.lineWidth = wd; x.beginPath(); x.moveTo(X + sd*wd*0.4, Y); x.lineTo(X + sd*wd*0.4, Y - h + wd); x.stroke();
      if(!small){ x.strokeStyle = pkCss(c.lit, 0.7); x.lineWidth = Math.max(px(0.4), wd*0.2); x.beginPath(); x.moveTo(X + sd*wd*0.6, Y); x.lineTo(X + sd*wd*0.6, Y - h + wd*1.5); x.stroke(); }
      return; }
    // a Joshua tree: a shaggy trunk, crooked arms, each ending in a spiky ball
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const ends = [];
    const limb = (x0, y0, ang, len, wd, depth) => { const x1 = x0 + Math.sin(ang)*len, y1 = y0 - Math.cos(ang)*len; x.lineWidth = Math.max(px(0.5), wd); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      if(depth > 0) for(const s of [-1, 1]) limb(x1, y1, ang + s*rnd(0.4, 0.9), len*rnd(0.55, 0.8), wd*0.75, depth - 1); else ends.push([x1, y1]); };
    limb(X, Y, rnd(-0.1, 0.1), h*0.45, h*0.07, small ? 1 : 2);
    for(const [ex, ey] of ends){ const r = h*0.08; for(let q = 0; q < (small ? 3 : 9); q++){ const a = q/9*Math.PI*2; x.strokeStyle = pkCss(Math.cos(a)*sd > 0 ? c.lit : c.body); x.lineWidth = Math.max(px(0.5), r*0.25); x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex + Math.cos(a)*r, ey + Math.sin(a)*r); x.stroke(); } }
    return; }
  if(kind === 'bamboo'){
    // a stand of bamboo: thin culms, ringed at their nodes, feathery at the top
    const n = small ? 4 : 7 + Math.floor(R()*8), spread = h*0.3;
    for(let q = 0; q < n; q++){ const bx = X + (q/(n - 1) - 0.5)*spread + rnd(-1, 1)*h*0.02, hh = h*rnd(0.7, 1), lean = rnd(-0.08, 0.08)*h, lit = q/(n - 1) - 0.5 > 0 === sd > 0;
      x.strokeStyle = pkCss(lit ? pkMix(c.body, c.lit, 0.4) : c.body); x.lineWidth = Math.max(px(0.5), h*0.012); x.beginPath(); x.moveTo(bx, Y); x.quadraticCurveTo(bx + lean*0.3, Y - hh*0.5, bx + lean, Y - hh); x.stroke();
      if(!small){ x.fillStyle = pkCss(c.dark); for(let k = 1; k < 6; k++){ const u = k/6; x.fillRect(bx + lean*u*u - h*0.008, Y - hh*u, h*0.016, Math.max(px(0.4), h*0.004)); }
        for(let k = 0; k < 4; k++){ const a = -Math.PI/2 + rnd(-1.3, 1.3), len = h*rnd(0.06, 0.12); x.strokeStyle = pkCss(k % 2 ? c.body : c.dark); x.lineWidth = Math.max(px(0.5), h*0.012); x.beginPath(); x.moveTo(bx + lean*0.8, Y - hh*0.85); x.lineTo(bx + lean*0.8 + Math.cos(a)*len, Y - hh*0.85 + Math.sin(a)*len); x.stroke(); } } }
    return; }
  if(kind === 'fern'){
    // a tree fern: a shaggy trunk, a shuttlecock of fronds arching out and down
    trunk(h*0.6, h*0.06); const tx = X, ty = Y - h*0.6, n = small ? 5 : 10;
    for(let q = 0; q < n; q++){ const a = Math.PI*(1.05 + 0.9*q/(n - 1)), len = h*rnd(0.35, 0.45), ex = tx + Math.cos(a)*len, ey = ty + Math.sin(a)*len*0.4 + len*0.25, lit = Math.cos(a)*sd > 0.1;
      x.strokeStyle = pkCss(lit ? c.body : c.dark); x.lineWidth = Math.max(px(0.6), h*0.04); x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a)*len*0.5, ty - h*0.2, ex, ey); x.stroke();
      if(!small && lit){ x.strokeStyle = pkCss(c.lit, 0.6); x.lineWidth = Math.max(px(0.4), h*0.012); x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a)*len*0.5, ty - h*0.21, ex, ey); x.stroke(); } }
    return; }
  if(kind === 'mushroom'){
    // a giant mushroom: a pale stalk, a dome of a cap, its gills dark beneath (aglow by night where the world is magic)
    const sw = h*rnd(0.06, 0.1), cr = h*rnd(0.28, 0.45), cy = Y - h*0.72, cap = pkMix(c.glow, c.body, 0.45);
    pkPoly(x, [[X - sw, Y], [X - sw*0.7, cy], [X + sw*0.7, cy], [X + sw, Y]], pkCss(pkMix(c.lit, PK_WHITE, 0.3)));
    pkPoly(x, [[X + sd*sw*0.1, Y], [X + sd*sw*0.1, cy], [X - sd*sw*0.7, cy], [X - sd*sw, Y]], pkCss(pkMix(c.body, PK_WHITE, 0.15)));
    pkEll(x, X, cy, cr, cr*0.18, pkCss(pkMix(c.glow, PK_BLACK, 0.5)));
    x.fillStyle = pkCss(pkMix(cap, PK_BLACK, 0.25)); x.beginPath(); x.ellipse(X, cy, cr, cr*0.75, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(cap); x.beginPath(); x.ellipse(X + sd*cr*0.15, cy - cr*0.05, cr*0.75, cr*0.62, 0, Math.PI, 0); x.fill();
    if(!small) for(let q = 0; q < 5; q++) pkDisc(x, X + rnd(-0.7, 0.7)*cr, cy - cr*rnd(0.15, 0.55), cr*rnd(0.05, 0.1), pkCss(pkMix(c.lit, PK_WHITE, 0.5), 0.8));
    pkGlow(x, X, cy + cr*0.1, cr*1.2, c.glow, 0.22);
    return; }
  if(kind === 'crystal'){
    // a crystal tree: prisms of glass rising and spreading like limbs, their tips alight
    const n = small ? 3 : 5 + Math.floor(R()*4), glass = pkMix(c.glow, c.lit, 0.4);
    for(let q = 0; q < n; q++){ const a = (q/(n - 1) - 0.5)*1.1 + rnd(-0.1, 0.1), len = h*(q === Math.floor(n/2) ? 1 : rnd(0.45, 0.8)), wd = h*rnd(0.04, 0.07), ex = X + Math.sin(a)*len, ey = Y - Math.cos(a)*len, nx = Math.cos(a)*wd, ny = Math.sin(a)*wd;
      pkPoly(x, [[X - nx, Y - ny], [ex - nx, ey - ny], [X + Math.sin(a)*(len + wd*2), Y - Math.cos(a)*(len + wd*2)], [ex + nx, ey + ny], [X + nx, Y + ny]], pkCss(pkMix(glass, PK_BLACK, 0.35), 0.85));
      pkPoly(x, [[X, Y], [X + Math.sin(a)*(len + wd*2), Y - Math.cos(a)*(len + wd*2)], [ex + sd*nx, ey + sd*ny], [X + sd*nx, Y + sd*ny]], pkCss(glass, 0.85));
      pkGlow(x, ex, ey, wd*4, c.glow, 0.35); }
    return; }
  if(kind === 'bush'){
    // a bush: three to five low lobes, wider than tall
    const lobes = [], n = small ? 3 : 3 + Math.floor(R()*3);
    for(let q = 0; q < n; q++){ const u = q/(n - 1) - 0.5; lobes.push([X + u*h*1.1, Y - h*(0.35 + 0.15*(1 - Math.abs(u)*2)), h*rnd(0.32, 0.42)]); }
    pkLobes(x, lobes, c, RL, X, Y - h*0.4, h*0.6); return; }
  // a broadleaf (and the glowing trees): a trunk forking under a domed crown of five to eight lobes
  trunk(h*0.45, h*0.06);
  if(!small){ x.lineWidth = Math.max(px(0.5), h*0.03); x.beginPath(); x.moveTo(X, Y - h*0.3); x.lineTo(X - h*0.1, Y - h*0.5); x.moveTo(X, Y - h*0.34); x.lineTo(X + h*0.12, Y - h*0.52); x.stroke(); }
  const cx = X, cy = Y - h*0.64, rr = h*0.34, n = (t => small ? 3 : t)(5 + Math.floor(R()*4)), lobes = [], RG = sub(3);
  for(let q = 0; q < n; q++){ const a = Math.PI*(1.05 + 0.9*q/(n - 1)) + rnd(-0.15, 0.15), d = rr*rnd(0.4, 0.62); lobes.push([cx + Math.cos(a)*d*1.15, cy + Math.sin(a)*d*0.85 + rr*0.15, rr*rnd(0.42, 0.55)]); }
  lobes.push([cx, cy - rr*0.15, rr*0.55]);
  pkLobes(x, lobes, c, RL, cx, cy, rr);
  if(kind === 'cherry' && !small){ const RB = sub(4); for(let q = 0; q < 26; q++){ const [lx, ly, lr] = lobes[Math.floor(RB()*lobes.length)], a = RB()*Math.PI*2, d = lr*Math.sqrt(RB())*0.9;
      pkDisc(x, lx + Math.cos(a)*d, ly + Math.sin(a)*d, Math.max(px(0.6), lr*0.16), pkCss(pkMix([248, 214, 226], c.lit, 0.25), 0.9)); } }
  if(kind === 'glow'){ pkGlow(x, cx, cy, rr*2.2, c.glow, 0.4);
    for(let q = 0; q < (small ? 2 : 7); q++) pkDisc(x, cx + (RG()*1.6 - 0.8)*rr, cy + (RG()*1.3 - 0.6)*rr, Math.max(px(0.6), h*0.014), pkCss(pkMix(c.glow, PK_WHITE, 0.4), 0.95)); }
}

// ---------------- BUILDINGS ----------------
// each world's way of building (the caller passes one)
export const PK_STYLE = { cities: 'city', neon: 'neon', builders: 'builders', ruins: 'ruins', magic: 'magic', wilds: 'village' };
// the materials each style builds in (null: the world's own colour)
const PK_MATS = { city: [[196, 178, 150], [168, 96, 76], [150, 150, 146], [120, 150, 184], [72, 76, 88], null], neon: [[40, 36, 58], [30, 44, 60], null], builders: [null, null, [236, 232, 220]],
  ruins: [[150, 128, 104], [120, 104, 92], [96, 92, 90]], magic: [[176, 160, 210], [150, 120, 150], [210, 196, 170]], village: [[214, 196, 160], [176, 92, 70], [230, 226, 214], [150, 120, 90]] };
// the archetypes each style raises, by weight
const PK_ARCH = { city: [['glass', 3], ['deco', 2], ['slab', 2], ['brick', 3], ['dome', 0.6], ['needle', 0.4], ['row', 2.5], ['factory', 0.8], ['watertower', 0.5], ['clock', 0.3], ['cathedral', 0.25], ['mosque', 0.2]],
  neon: [['glass', 3], ['slab', 2], ['deco', 1], ['needle', 1], ['capsule', 1.5], ['megablock', 1.5]],
  builders: [['pylon', 3], ['arch', 1], ['dome', 1.5], ['glass', 1], ['geodome', 1.5], ['observatory', 0.8], ['turbine', 1]],
  ruins: [['brick', 2], ['glass', 2], ['slab', 2], ['deco', 1], ['castle', 0.8], ['cathedral', 0.3], ['factory', 1], ['lighthouse', 0.3]],
  magic: [['wizard', 3], ['onion', 2], ['brick', 1], ['pagoda', 1.5], ['torii', 0.8], ['stave', 0.8], ['observatory', 0.4]],
  village: [['cottage', 3], ['aframe', 1], ['barn', 1.5], ['silo', 1], ['windmill', 0.8], ['stave', 0.5], ['row', 1], ['lighthouse', 0.3], ['turbine', 0.4]] };
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
// (kind0: the archetype, when the caller chose it to size the building; the draw that would have chosen it is still
//  taken, so every other feature keeps its stream)
// ---- THE WIDER KIT: each kind drawn at (X, Y), h tall and wd wide, in the caller's lit colours ----
// a gable roof over [x0, x1] from eave height ye up to the ridge yr; its lit slope toward the light
const pkGable = (x, x0, x1, ye, yr, c, over = 0.08) => { const w = x1 - x0, m = (x0 + x1)/2; pkPoly(x, [[x0 - w*over, ye], [m, yr], [x1 + w*over, ye]], pkCss(c.dark));
  pkPoly(x, c.sd > 0 ? [[m, yr], [x1 + w*over, ye], [m, ye]] : [[m, yr], [x0 - w*over, ye], [m, ye]], pkCss(pkMix(c.dark, c.body, 0.6))); };
const pkDoor = (x, X, Y, h, c, o) => { if(h > o.px(3)) x.fillStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.4)), x.fillRect(X - h*0.22, Y - h, h*0.44, h); };
// a lit window: a pane by day, lamplight by night
const pkPane = (x, X, Y, w, h, c, night, R) => { x.fillStyle = night > 0.2 && R() < 0.7 ? pkCss(c.glow, 0.85*night) : pkCss(pkMix(c.dark, PK_BLACK, 0.2), 0.7); x.fillRect(X, Y, w, h); };
const PK_BUILT = {
  cottage(x, X, Y, h, wd, c, night, lit, o){ // walls, a fat hump of thatch twice their height, a chimney
    const ye = Y - h*0.4, w2 = wd/2; pkBox(x, X, Y, ye, wd, c, o.dep*0.4);
    x.fillStyle = pkCss(pkMix(c.dark, [150, 120, 70], 0.35)); x.beginPath(); x.moveTo(X - w2*1.15, ye + h*0.04); x.quadraticCurveTo(X - w2*0.9, Y - h*1.02, X, Y - h); x.quadraticCurveTo(X + w2*0.9, Y - h*1.02, X + w2*1.15, ye + h*0.04); x.fill();
    x.fillStyle = pkCss(pkMix(c.lit, [214, 180, 110], 0.4)); x.beginPath(); x.moveTo(X, Y - h*0.98); x.quadraticCurveTo(X + c.sd*w2*0.85, Y - h*0.98, X + c.sd*w2*1.1, ye + h*0.02); x.lineTo(X + c.sd*w2*0.3, ye); x.fill();
    x.fillStyle = pkCss(c.dark); x.fillRect(X - c.sd*w2*0.55, Y - h*1.05, wd*0.1, h*0.3);
    if(o.detail){ pkDoor(x, X - w2*0.3, Y, h*0.32, c, o); pkPane(x, X + w2*0.2, Y - h*0.3, wd*0.14, h*0.12, c, night, o.R); } },
  aframe(x, X, Y, h, wd, c, night, lit, o){ // one tall triangle down to the ground, its gable glazed
    const w2 = wd/2; pkPoly(x, [[X - w2, Y], [X, Y - h], [X + w2, Y]], pkCss(c.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2, Y], [X, Y]], pkCss(c.body));
    pkPoly(x, [[X - w2*0.6, Y], [X, Y - h*0.62], [X + w2*0.6, Y]], pkCss(night > 0.2 ? pkMix(c.glow, c.dark, 0.3) : pkMix(lit, c.dark, 0.4)));
    if(o.detail){ x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(o.px(0.5), wd*0.02); x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.62); x.moveTo(X - w2*0.4, Y - h*0.2); x.lineTo(X + w2*0.4, Y - h*0.2); x.stroke(); } },
  barn(x, X, Y, h, wd, c, night, lit, o){ // a gambrel roof over a box, big braced doors, a hay hood
    const w2 = wd/2, ye = Y - h*0.45, red = pkMix(c.body, [168, 60, 48], 0.55); pkPoly(x, [[X - w2, Y], [X - w2, ye], [X + w2, ye], [X + w2, Y]], pkCss(red));
    pkPoly(x, [[X - w2*1.06, ye], [X - w2*0.78, Y - h*0.82], [X, Y - h], [X + w2*0.78, Y - h*0.82], [X + w2*1.06, ye]], pkCss(pkMix(c.dark, PK_BLACK, 0.2)));
    pkPoly(x, [[X, Y - h], [X + c.sd*w2*0.78, Y - h*0.82], [X + c.sd*w2*1.06, ye], [X, ye]], pkCss(c.dark));
    if(o.detail){ const dw = wd*0.32, dh = h*0.32; x.fillStyle = pkCss(pkMix(red, PK_BLACK, 0.3)); x.fillRect(X - dw/2, Y - dh, dw, dh); x.strokeStyle = pkCss(PK_WHITE, 0.8); x.lineWidth = Math.max(o.px(0.5), wd*0.015);
      x.strokeRect(X - dw/2, Y - dh, dw, dh); x.beginPath(); x.moveTo(X - dw/2, Y - dh); x.lineTo(X + dw/2, Y); x.moveTo(X + dw/2, Y - dh); x.lineTo(X - dw/2, Y); x.stroke(); } },
  silo(x, X, Y, h, wd, c, night, lit, o){ // a cylinder under a dome cap, hoop bands
    const w2 = wd/2, t = Y - h + w2; pkPoly(x, [[X - w2, Y], [X - w2, t], [X + w2, t], [X + w2, Y]], pkCss(c.body)); pkPoly(x, [[X + c.sd*w2*0.2, Y], [X + c.sd*w2*0.2, t], [X + c.sd*w2, t], [X + c.sd*w2, Y]], pkCss(c.lit));
    x.fillStyle = pkCss(c.dark); x.beginPath(); x.arc(X, t, w2, Math.PI, 0); x.fill();
    if(o.detail){ x.fillStyle = pkCss(c.dark, 0.5); for(let q = 1; q < 6; q++) x.fillRect(X - w2, t + (Y - t)*q/6, wd, Math.max(o.px(0.5), h*0.006)); } },
  windmill(x, X, Y, h, wd, c, night, lit, o){ // a tapered tower, a cap, four sails in an X
    const w2 = wd/2, bt = Y - h*0.62; pkPoly(x, [[X - w2, Y], [X - w2*0.55, bt], [X + w2*0.55, bt], [X + w2, Y]], pkCss(c.body)); pkPoly(x, [[X, Y], [X, bt], [X + c.sd*w2*0.55, bt], [X + c.sd*w2, Y]], pkCss(c.lit));
    pkEll(x, X, bt, w2*0.7, w2*0.4, pkCss(c.dark)); const hub = [X, bt - w2*0.1], ang = o.R()*Math.PI/2, L2 = h*0.4;
    for(let q = 0; q < 4; q++){ const a = ang + q*Math.PI/2, ex = hub[0] + Math.cos(a)*L2, ey = hub[1] + Math.sin(a)*L2, nx = -Math.sin(a)*L2*0.09, ny = Math.cos(a)*L2*0.09;
      pkPoly(x, [[hub[0] + Math.cos(a)*L2*0.15, hub[1] + Math.sin(a)*L2*0.15], [ex, ey], [ex + nx, ey + ny], [hub[0] + Math.cos(a)*L2*0.15 + nx, hub[1] + Math.sin(a)*L2*0.15 + ny]], pkCss(pkMix(c.lit, PK_WHITE, 0.3), 0.85)); }
    pkDisc(x, hub[0], hub[1], Math.max(o.px(0.6), w2*0.12), pkCss(c.dark)); },
  stave(x, X, Y, h, wd, c, night, lit, o){ // a stave church: steep roofs stacked like a pine cone, dragon heads at the gables
    const w2 = wd/2, tar = pkMix(c.dark, [70, 44, 30], 0.4); pkBox(x, X, Y, Y - h*0.2, wd, { ...c, body: tar }, o.dep*0.3);
    for(let q = 0; q < 4; q++){ const u = q/4, w = w2*(1.1 - u*0.65), yb = Y - h*(0.2 + u*0.18), yt = Y - h*(0.36 + u*0.2); pkGable(x, X - w, X + w, yb, yt, { ...c, dark: tar }, 0.1);
      if(o.detail && q < 3) for(const s of [-1, 1]){ x.strokeStyle = pkCss(tar); x.lineWidth = Math.max(o.px(0.5), h*0.012); x.beginPath(); x.moveTo(X + s*w*0.5, yt + (yb - yt)*0.5); x.quadraticCurveTo(X + s*w*0.7, yt, X + s*w*0.85, yt + h*0.02); x.stroke(); } }
    x.fillStyle = pkCss(tar); x.fillRect(X - wd*0.03, Y - h, wd*0.06, h*0.25); },
  row(x, X, Y, h, wd, c, night, lit, o){ // a terrace: three to five narrow houses sharing their walls, chimney stacks between
    const n = 3 + Math.floor(o.R()*3), hw = wd/n, M = [[176, 92, 70], [200, 182, 150], [150, 150, 146], [196, 120, 96]];
    for(let q = 0; q < n; q++){ const hx = X - wd/2 + hw*(q + 0.5), hh = h*(0.75 + 0.25*o.R()), col = pkMix(c.body, M[Math.floor(o.R()*M.length)], 0.35);
      pkPoly(x, [[hx - hw/2, Y], [hx - hw/2, Y - hh*0.75], [hx + hw/2, Y - hh*0.75], [hx + hw/2, Y]], pkCss(col)); pkGable(x, hx - hw/2, hx + hw/2, Y - hh*0.75, Y - hh, c, 0);
      x.fillStyle = pkCss(c.dark); x.fillRect(hx + hw/2 - hw*0.08, Y - hh*1.02, hw*0.16, hh*0.2);
      if(o.detail){ pkDoor(x, hx - hw*0.2, Y, hh*0.28, c, o); for(let f = 1; f <= 2; f++) pkPane(x, hx + hw*0.05, Y - hh*0.26*f - hh*0.06, hw*0.28, hh*0.14, c, night, o.RW); } } },
  pagoda(x, X, Y, h, wd, c, night, lit, o){ // five roofs stacked, each narrower, their eaves curling up; a spire of rings
    const n = 3 + Math.floor(o.R()*3), w2 = wd/2, roof = pkMix(c.dark, [60, 50, 50], 0.3), wall = pkMix(c.body, [190, 70, 50], 0.45);
    for(let q = 0; q < n; q++){ const u = q/n, yb = Y - h*0.82*u, yt = Y - h*0.82*(u + 1/n), w = w2*(1 - u*0.55);
      pkPoly(x, [[X - w*0.55, yb], [X - w*0.55, yt + (yb - yt)*0.35], [X + w*0.55, yt + (yb - yt)*0.35], [X + w*0.55, yb]], pkCss(wall));
      const ey = yt + (yb - yt)*0.38; x.fillStyle = pkCss(roof); x.beginPath(); x.moveTo(X - w*1.15, ey - (yb - yt)*0.15); x.quadraticCurveTo(X - w*0.7, ey, X - w*0.4, yt + (yb - yt)*0.05); x.lineTo(X + w*0.4, yt + (yb - yt)*0.05); x.quadraticCurveTo(X + w*0.7, ey, X + w*1.15, ey - (yb - yt)*0.15); x.lineTo(X, ey + (yb - yt)*0.05); x.fill();
      if(o.detail && night > 0.2) pkGlow(x, X, yb - (yb - yt)*0.2, w*0.6, c.glow, 0.3*night); }
    x.fillStyle = pkCss(roof); x.fillRect(X - wd*0.02, Y - h, wd*0.04, h*0.2); },
  torii(x, X, Y, h, wd, c, night, lit, o){ // two posts, a curved lintel, a tie beam: vermilion
    const v = pkMix([206, 64, 40], c.body, 0.3), w2 = wd/2, pw = Math.max(o.px(0.6), wd*0.08); x.fillStyle = pkCss(v);
    x.fillRect(X - w2*0.75 - pw/2, Y - h*0.88, pw, h*0.88); x.fillRect(X + w2*0.75 - pw/2, Y - h*0.88, pw, h*0.88); x.fillRect(X - w2*0.85, Y - h*0.72, wd*0.85, h*0.06);
    x.fillStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.3)); x.beginPath(); x.moveTo(X - w2*1.1, Y - h*0.96); x.quadraticCurveTo(X, Y - h*0.86, X + w2*1.1, Y - h*0.96); x.lineTo(X + w2*1.05, Y - h*0.88); x.quadraticCurveTo(X, Y - h*0.8, X - w2*1.05, Y - h*0.88); x.fill(); },
  castle(x, X, Y, h, wd, c, night, lit, o){ // a square keep, its corner turrets, its top a row of merlons
    const w2 = wd/2, kt = Y - h*0.82; pkBox(x, X, Y, kt, wd*0.7, c, o.dep*0.5);
    for(const s of [-1, 1]){ pkPoly(x, [[X + s*w2*0.35, Y], [X + s*w2*0.35, Y - h], [X + s*w2*0.62, Y - h], [X + s*w2*0.62, Y]], pkCss(s === c.sd ? c.lit : c.body)); }
    const mw = wd*0.06; x.fillStyle = pkCss(c.body); for(let q = 0; q < 6; q++) x.fillRect(X - w2*0.35 + q*wd*0.12, kt - mw, mw, mw);
    if(o.detail){ x.fillStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.3)); for(let q = 0; q < 3; q++) x.fillRect(X - wd*0.01 + (q - 1)*wd*0.15, kt + h*0.2, Math.max(o.px(0.5), wd*0.02), h*0.08); x.beginPath(); x.arc(X, Y - h*0.12, wd*0.07, Math.PI, 0); x.lineTo(X + wd*0.07, Y); x.lineTo(X - wd*0.07, Y); x.fill(); } },
  lighthouse(x, X, Y, h, wd, c, night, lit, o){ // a tapered, banded tower, a gallery, a lantern alight
    const w2 = wd/2, gt = Y - h*0.82; pkPoly(x, [[X - w2, Y], [X - w2*0.6, gt], [X + w2*0.6, gt], [X + w2, Y]], pkCss(pkMix(c.lit, PK_WHITE, 0.3)));
    x.fillStyle = pkCss(pkMix(c.body, [190, 50, 48], 0.6)); for(let q = 0; q < 3; q++){ const y0 = Y - h*0.82*(0.15 + q*0.3), y1 = y0 - h*0.1, k0 = 1 - 0.4*(Y - y0)/(Y - gt), k1 = 1 - 0.4*(Y - y1)/(Y - gt); pkPoly(x, [[X - w2*k0, y0], [X - w2*k1, y1], [X + w2*k1, y1], [X + w2*k0, y0]], x.fillStyle); }
    x.fillStyle = pkCss(c.dark); x.fillRect(X - w2*0.8, gt - h*0.02, wd*0.8, h*0.02); pkPoly(x, [[X - w2*0.4, gt - h*0.02], [X - w2*0.4, gt - h*0.12], [X + w2*0.4, gt - h*0.12], [X + w2*0.4, gt - h*0.02]], pkCss(pkMix(c.glow2 || c.glow, PK_WHITE, 0.4)));
    pkPoly(x, [[X - w2*0.5, gt - h*0.12], [X, Y - h], [X + w2*0.5, gt - h*0.12]], pkCss(c.dark)); pkGlow(x, X, gt - h*0.07, wd*(1.5 + 3*night), pkMix(c.glow2 || c.glow, PK_WHITE, 0.5), 0.5 + 0.4*night); },
  cathedral(x, X, Y, h, wd, c, night, lit, o){ // a long nave under a steep roof, two west towers with spires, a rose window
    const w2 = wd/2, ne = Y - h*0.3; pkBox(x, X + w2*0.2, Y, ne, wd*0.7, c, o.dep*0.3); pkGable(x, X - w2*0.15, X + w2*0.9, ne, Y - h*0.45, c, 0.02);
    for(const s of [-0.65, -0.25]){ const tx = X + s*w2, tw = wd*0.13; pkPoly(x, [[tx - tw, Y], [tx - tw, Y - h*0.58], [tx + tw, Y - h*0.58], [tx + tw, Y]], pkCss(s < -0.4 ? c.body : c.lit)); pkPoly(x, [[tx - tw*1.05, Y - h*0.58], [tx, Y - h], [tx + tw*1.05, Y - h*0.58]], pkCss(c.dark));
      if(o.detail){ x.fillStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.3)); x.fillRect(tx - tw*0.25, Y - h*0.5, tw*0.5, h*0.12); } }
    if(o.detail) pkDisc(x, X - w2*0.45, Y - h*0.32, wd*0.05, pkCss(night > 0.2 ? c.glow : pkMix(c.dark, c.glow, 0.3), 0.9)); },
  mosque(x, X, Y, h, wd, c, night, lit, o){ // a great dome over half-domes stepping down, needle minarets with balconies
    const w2 = wd/2, db = Y - h*0.42, dr = wd*0.24; pkBox(x, X, Y, Y - h*0.3, wd*0.8, c, o.dep*0.3);
    for(const s of [-1, 1]) { x.fillStyle = pkCss(c.body); x.beginPath(); x.arc(X + s*dr*1.1, Y - h*0.3, dr*0.55, Math.PI, 0); x.fill(); }
    x.fillStyle = pkCss(c.body); x.fillRect(X - dr, db, dr*2, Y - h*0.3 - db); x.beginPath(); x.arc(X, db, dr, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(c.lit); x.beginPath(); x.arc(X + c.sd*dr*0.25, db, dr*0.7, Math.PI, 0); x.fill(); x.fillRect(X - wd*0.006, db - dr - h*0.08, wd*0.012, h*0.08);
    for(const s of [-1, 1]){ const mx = X + s*w2*0.95, mw = Math.max(o.px(0.6), wd*0.03); pkPoly(x, [[mx - mw, Y], [mx - mw*0.7, Y - h*0.88], [mx + mw*0.7, Y - h*0.88], [mx + mw, Y]], pkCss(s === c.sd ? c.lit : c.body));
      pkPoly(x, [[mx - mw*0.8, Y - h*0.88], [mx, Y - h], [mx + mw*0.8, Y - h*0.88]], pkCss(c.dark)); if(o.detail) for(const b of [0.55, 0.75]) x.fillStyle = pkCss(c.dark), x.fillRect(mx - mw*1.6, Y - h*b, mw*3.2, Math.max(o.px(0.5), h*0.012)); } },
  clock(x, X, Y, h, wd, c, night, lit, o){ // a square shaft, a clock face, a belfry, a steep spire
    const w2 = wd/2, ft = Y - h*0.62; pkBox(x, X, Y, ft - wd*0.3, wd, c, o.dep*0.4); pkPoly(x, [[X - w2*1.05, ft - wd*0.3], [X, Y - h], [X + w2*1.05, ft - wd*0.3]], pkCss(c.dark));
    pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.05, ft - wd*0.3], [X, ft - wd*0.3]], pkCss(pkMix(c.dark, c.body, 0.5)));
    pkDisc(x, X, ft + wd*0.15, wd*0.32, pkCss(night > 0.2 ? pkMix(c.glow, PK_WHITE, 0.4) : pkMix(c.lit, PK_WHITE, 0.4)));
    if(o.detail){ x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(o.px(0.4), wd*0.03); x.beginPath(); x.moveTo(X, ft + wd*0.15); x.lineTo(X, ft - wd*0.08); x.moveTo(X, ft + wd*0.15); x.lineTo(X + wd*0.15, ft + wd*0.2); x.stroke(); } },
  factory(x, X, Y, h, wd, c, night, lit, o){ // a saw-tooth shed, tall chimneys, a tank
    const w2 = wd/2, st = Y - h*0.35, n = 4 + Math.floor(o.R()*3); pkPoly(x, [[X - w2, Y], [X - w2, st], [X + w2, st], [X + w2, Y]], pkCss(c.body));
    for(let q = 0; q < n; q++){ const x0 = X - w2 + wd*q/n, x1 = x0 + wd/n; pkPoly(x, [[x0, st], [x1, st - h*0.12], [x1, st]], pkCss(c.dark)); if(night > 0.2) x.fillStyle = pkCss(c.glow, 0.7*night), x.fillRect(x1 - wd/n*0.12, st - h*0.1, wd/n*0.1, h*0.1); }
    for(let q = 0; q < 1 + Math.floor(o.R()*3); q++){ const cx = X - w2*0.6 + q*wd*0.25, cw = Math.max(o.px(0.6), wd*0.04); pkPoly(x, [[cx - cw, st], [cx - cw*0.7, Y - h], [cx + cw*0.7, Y - h], [cx + cw, st]], pkCss(pkMix(c.body, [150, 80, 60], 0.4)));
      if(o.detail){ x.fillStyle = pkCss(PK_WHITE, 0.5); x.fillRect(cx - cw*0.75, Y - h*0.92, cw*1.5, h*0.02); } } },
  watertower(x, X, Y, h, wd, c, night, lit, o){ // four legs braced, a tank with a cone roof
    const w2 = wd/2, tb = Y - h*0.62; x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(o.px(0.5), wd*0.04); x.beginPath(); for(const s of [-1, -0.35, 0.35, 1]){ x.moveTo(X + s*w2*0.7, Y); x.lineTo(X + s*w2*0.45, tb); } x.moveTo(X - w2*0.6, Y - h*0.3); x.lineTo(X + w2*0.6, Y - h*0.3); x.stroke();
    pkPoly(x, [[X - w2*0.6, tb], [X - w2*0.6, Y - h*0.88], [X + w2*0.6, Y - h*0.88], [X + w2*0.6, tb]], pkCss(c.body)); pkPoly(x, [[X + c.sd*w2*0.1, tb], [X + c.sd*w2*0.1, Y - h*0.88], [X + c.sd*w2*0.6, Y - h*0.88], [X + c.sd*w2*0.6, tb]], pkCss(c.lit));
    pkPoly(x, [[X - w2*0.68, Y - h*0.88], [X, Y - h], [X + w2*0.68, Y - h*0.88]], pkCss(c.dark)); },
  capsule(x, X, Y, h, wd, c, night, lit, o){ // two core shafts, cubes stuck on at every side, a round porthole each
    const w2 = wd/2, cs = Math.max(wd*0.22, h*0.07); for(const s of [-0.25, 0.25]) pkPoly(x, [[X + s*wd - wd*0.06, Y], [X + s*wd - wd*0.06, Y - h], [X + s*wd + wd*0.06, Y - h], [X + s*wd + wd*0.06, Y]], pkCss(c.dark));
    for(let yy = Y - cs; yy > Y - h; yy -= cs*1.05) for(const s of [-1, 1]) if(o.R() < 0.8){ const cx = X + s*(w2*0.55 + o.R()*cs*0.3); pkPoly(x, [[cx - cs/2, yy + cs], [cx - cs/2, yy], [cx + cs/2, yy], [cx + cs/2, yy + cs]], pkCss(o.R() < 0.5 ? c.body : c.lit));
      if(o.detail) pkDisc(x, cx, yy + cs/2, cs*0.22, pkCss(night > 0.2 && o.RW() < 0.6 ? c.glow : pkMix(c.dark, PK_BLACK, 0.3))); } },
  megablock(x, X, Y, h, wd, c, night, lit, o){ // many slabs grown into one mass, a flat common roof bristling with aerials, a field of lit windows
    const w2 = wd/2, n = 5 + Math.floor(o.R()*4); for(let q = 0; q < n; q++){ const x0 = X - w2 + wd*q/n, hh = h*(0.85 + 0.15*o.R()); pkPoly(x, [[x0, Y], [x0, Y - hh], [x0 + wd/n + 0.5, Y - hh], [x0 + wd/n + 0.5, Y]], pkCss(q % 2 ? c.body : pkMix(c.body, c.dark, 0.25)));
      if(o.detail){ for(let r = 0; r < 14; r++) for(let k = 0; k < 3; k++) if(o.RW() < (night > 0.2 ? 0.45 : 0.25)) x.fillStyle = night > 0.2 ? pkCss(o.RW() < 0.3 ? c.glow2 || c.glow : c.glow, 0.85) : pkCss(c.dark, 0.5), x.fillRect(x0 + wd/n*(0.15 + k*0.28), Y - hh + hh*(0.04 + r*0.068), wd/n*0.16, hh*0.03); }
      x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(o.px(0.4), h*0.004); x.beginPath(); for(let k = 0; k < 3; k++){ const ax = x0 + wd/n*o.R(); x.moveTo(ax, Y - hh); x.lineTo(ax, Y - hh - h*0.08*o.R()); } x.stroke(); } },
  geodome(x, X, Y, h, wd, c, night, lit, o){ // a glass bubble of hexes, gardens inside
    const w2 = wd/2, r = Math.min(w2, h); x.fillStyle = pkCss(pkMix(c.body, c.glow, 0.2), 0.75); x.beginPath(); x.ellipse(X, Y, w2, h, 0, Math.PI, 0); x.fill();
    if(o.detail){ x.fillStyle = pkCss([60, 110, 70], 0.7); x.beginPath(); x.ellipse(X, Y, w2*0.7, h*0.25, 0, Math.PI, 0); x.fill();
      x.strokeStyle = pkCss(c.lit, 0.6); x.lineWidth = Math.max(o.px(0.4), r*0.012); x.beginPath(); for(let q = 1; q < 6; q++){ const a = Math.PI*(1 + q/6); x.moveTo(X, Y); x.lineTo(X + Math.cos(a)*w2, Y + Math.sin(a)*h); } x.stroke();
      for(let q = 1; q < 4; q++){ x.beginPath(); x.ellipse(X, Y, w2, h*q/4, 0, Math.PI, 0); x.stroke(); } }
    x.fillStyle = pkCss(PK_WHITE, 0.35); x.beginPath(); x.ellipse(X + c.sd*w2*0.35, Y - h*0.6, w2*0.18, h*0.22, c.sd*0.5, 0, Math.PI*2); x.fill(); },
  observatory(x, X, Y, h, wd, c, night, lit, o){ // a drum, a white hemisphere, a dark slit open to the sky
    const w2 = wd/2, db = Y - h + w2*0.9; pkBox(x, X, Y, db, wd, c, o.dep*0.3);
    x.fillStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.25)); x.beginPath(); x.ellipse(X, db, w2, w2*0.9, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(c.body); x.beginPath(); x.ellipse(X - c.sd*w2*0.3, db, w2*0.65, w2*0.85, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.4)); x.fillRect(X - w2*0.08, db - w2*0.88, w2*0.16, w2*0.88); },
  turbine(x, X, Y, h, wd, c, night, lit, o){ // a white stalk, a nacelle, three long blades
    const hub = [X, Y - h*0.62], bl = h*0.38, sw = Math.max(o.px(0.6), h*0.012), white = pkMix(c.lit, PK_WHITE, 0.4);
    pkPoly(x, [[X - sw*1.5, Y], [X - sw*0.7, hub[1]], [X + sw*0.7, hub[1]], [X + sw*1.5, Y]], pkCss(white)); const a0 = o.R()*Math.PI*2;
    for(let q = 0; q < 3; q++){ const a = a0 + q*Math.PI*2/3, ex = hub[0] + Math.cos(a)*bl, ey = hub[1] + Math.sin(a)*bl, nx = -Math.sin(a)*sw*1.6, ny = Math.cos(a)*sw*1.6; pkPoly(x, [[hub[0] + nx, hub[1] + ny], [ex, ey], [hub[0] - nx*0.3, hub[1] - ny*0.3]], pkCss(white)); }
    pkEll(x, hub[0], hub[1], sw*2.4, sw*1.3, pkCss(c.body)); if(night > 0.2) pkDisc(x, hub[0], hub[1] - sw*1.5, sw, pkCss([255, 70, 60], 0.9)); },
};
export function pkBuilding(x, X, Y, h, wdt, c, style, night, R0, px, kind0){
  const sub = pkSub(R0), R = sub(1), RW = sub(2), RT = sub(3), RN = sub(4), RU = sub(5);
  const kind = (k => kind0 || k)(pkArchOf(style, R()));
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
  // ---- the wider kit (docs/prior-art/painted-ringworld.md §5.3): houses and farms, landmarks, the neon's and the
  // builders' own; each a few flat shapes in true proportion, its door and floors where it is large enough ----
  else if(PK_BUILT[kind]) PK_BUILT[kind](x, X, Y, h, wdt, c, night, lit, { R: RT, RW, px, detail, dep, top });
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
// ---------------- SMALL THINGS, for close by (docs/prior-art/painted-ringworld.md §5.5) ----------------
// What you find near your feet: a fence, a lamp, a bench, a mailbox, a barrel, a crate, a sign, a bicycle, a hydrant,
// and now and then a person, for scale. Each at (X, Y), h its height in pixels, in the caller's lit colours.
export const PK_PROPS = { wilds: ['fence', 'fence', 'sign', 'mailbox', 'figure'], cities: ['lamp', 'bench', 'hydrant', 'bicycle', 'sign', 'figure', 'mailbox'],
  neon: ['lamp', 'sign', 'bicycle', 'crate', 'figure'], builders: ['lamp', 'crate', 'bench'], ruins: ['barrel', 'crate', 'sign', 'barrel', 'fence'], magic: ['lamp', 'fence', 'bench'] };
export function pkProp(x, X, Y, h, c, kind, R0, px, night = 0){
  const sub = pkSub(R0), R = sub(1), sd = c.sd, ln = (pts, col, wd) => { x.strokeStyle = col; x.lineWidth = Math.max(px(0.5), wd); x.lineCap = 'round'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
  if(kind === 'fence'){ // a run of pickets on two rails, leaning a little
    const n = 5 + Math.floor(R()*5), sp = h*0.45, x0 = X - n*sp/2, lean = (R() - 0.5)*h*0.1;
    ln([[x0, Y - h*0.35], [x0 + n*sp, Y - h*0.38 + lean]], pkCss(c.dark), h*0.07); ln([[x0, Y - h*0.75], [x0 + n*sp, Y - h*0.78 + lean]], pkCss(c.dark), h*0.07);
    for(let k = 0; k <= n; k++){ const px0 = x0 + k*sp; pkPoly(x, [[px0 - h*0.05, Y], [px0 - h*0.05, Y - h*0.9], [px0, Y - h], [px0 + h*0.05, Y - h*0.9], [px0 + h*0.05, Y]], pkCss(k % 2 ? c.body : c.lit)); } return; }
  if(kind === 'lamp'){ // a post, an arm, a head; its pool of light by night
    ln([[X, Y], [X, Y - h]], pkCss(c.dark), h*0.04); ln([[X, Y - h], [X + h*0.18, Y - h*0.97]], pkCss(c.dark), h*0.03);
    pkEll(x, X + h*0.2, Y - h*0.95, h*0.06, h*0.03, pkCss(night > 0.2 ? pkMix(c.glow, PK_WHITE, 0.5) : c.body));
    if(night > 0.2){ pkGlow(x, X + h*0.2, Y - h*0.93, h*0.4, c.glow, 0.5*night); pkGlow(x, X + h*0.2, Y, h*0.45, c.glow, 0.25*night); } return; }
  if(kind === 'bench'){ const w = h*3; ln([[X - w/2, Y - h*0.5], [X + w/2, Y - h*0.5]], pkCss(c.body), h*0.12); ln([[X - w/2, Y - h], [X + w/2, Y - h]], pkCss(c.lit), h*0.1);
    ln([[X - w*0.4, Y], [X - w*0.4, Y - h]], pkCss(c.dark), h*0.07); ln([[X + w*0.4, Y], [X + w*0.4, Y - h]], pkCss(c.dark), h*0.07); return; }
  if(kind === 'mailbox'){ ln([[X, Y], [X, Y - h*0.65]], pkCss(c.dark), h*0.08); pkEll(x, X, Y - h*0.78, h*0.28, h*0.16, pkCss(c.body)); pkEll(x, X + sd*h*0.06, Y - h*0.82, h*0.18, h*0.08, pkCss(c.lit));
    pkPoly(x, [[X + h*0.22, Y - h*0.82], [X + h*0.22, Y - h*1.02], [X + h*0.34, Y - h*0.97], [X + h*0.26, Y - h*0.92]], pkCss([200, 50, 44])); return; }
  if(kind === 'barrel'){ const w = h*0.6; pkPoly(x, [[X - w/2, Y], [X - w*0.6, Y - h/2], [X - w/2, Y - h], [X + w/2, Y - h], [X + w*0.6, Y - h/2], [X + w/2, Y]], pkCss(c.body));
    pkPoly(x, [[X + sd*w*0.1, Y], [X + sd*w*0.2, Y - h/2], [X + sd*w*0.1, Y - h], [X + sd*w/2, Y - h], [X + sd*w*0.6, Y - h/2], [X + sd*w/2, Y]], pkCss(c.lit));
    for(const v of [0.22, 0.78]) ln([[X - w*0.58, Y - h*v], [X + w*0.58, Y - h*v]], pkCss(c.dark), h*0.06); return; }
  if(kind === 'crate'){ const w = h*1.1; pkPoly(x, [[X - w/2, Y], [X - w/2, Y - h], [X + w/2, Y - h], [X + w/2, Y]], pkCss(c.body)); pkPoly(x, [[X + sd*w/2, Y], [X + sd*w/2, Y - h], [X + sd*w*0.75, Y - h*0.9], [X + sd*w*0.75, Y + h*0.05]], pkCss(c.dark));
    ln([[X - w/2, Y], [X + w/2, Y - h]], pkCss(c.dark), h*0.06); ln([[X - w/2, Y - h], [X + w/2, Y - h]], pkCss(c.lit), h*0.05); return; }
  if(kind === 'sign'){ // a board on a post; its writing is only marks, as a sign seen too far to read
    ln([[X, Y], [X, Y - h]], pkCss(c.dark), h*0.06); const w = h*0.9, tilt = (R() - 0.5)*h*0.12;
    pkPoly(x, [[X - w/2, Y - h + tilt], [X + w/2, Y - h - tilt], [X + w/2, Y - h*0.6 - tilt], [X - w/2, Y - h*0.6 + tilt]], pkCss(R() < 0.5 ? c.lit : pkMix(c.body, c.glow, 0.4)));
    for(let k = 0; k < 2; k++) ln([[X - w*0.35, Y - h*(0.88 - k*0.14)], [X + w*(0.1 + 0.25*R()), Y - h*(0.88 - k*0.14)]], pkCss(c.dark, 0.6), h*0.04); return; }
  if(kind === 'bicycle'){ const r = h*0.32; x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.04);
    for(const s of [-1, 1]){ x.beginPath(); x.arc(X + s*h*0.55, Y - r, r, 0, Math.PI*2); x.stroke(); }
    ln([[X - h*0.55, Y - r], [X - h*0.1, Y - h*0.75], [X + h*0.35, Y - h*0.75], [X + h*0.55, Y - r], [X, Y - r], [X - h*0.1, Y - h*0.75]], pkCss(c.body), h*0.05);
    ln([[X + h*0.35, Y - h*0.75], [X + h*0.32, Y - h*0.95], [X + h*0.42, Y - h*0.95]], pkCss(c.dark), h*0.04); return; }
  if(kind === 'hydrant'){ const w = h*0.4; pkPoly(x, [[X - w/2, Y], [X - w/2, Y - h*0.75], [X + w/2, Y - h*0.75], [X + w/2, Y]], pkCss([196, 52, 44])); pkEll(x, X, Y - h*0.78, w*0.55, h*0.16, pkCss([214, 70, 56]));
    pkEll(x, X, Y - h*0.45, w*0.8, h*0.08, pkCss([170, 40, 36])); return; }
  // a person, for scale (a capsule and a head, no face: the eye reads its size, not who it is)
  const coat = [c.body, c.lit, pkMix(c.glow, c.body, 0.5), c.dark][Math.floor(R()*4)];
  pkPoly(x, [[X - h*0.12, Y], [X - h*0.15, Y - h*0.72], [X + h*0.15, Y - h*0.72], [X + h*0.12, Y]], pkCss(coat));
  pkDisc(x, X, Y - h*0.84, h*0.11, pkCss(c.dark)); pkPoly(x, [[X + sd*h*0.02, Y - h*0.1], [X + sd*h*0.03, Y - h*0.68], [X + sd*h*0.14, Y - h*0.68], [X + sd*h*0.11, Y - h*0.1]], pkCss(pkMix(coat, PK_WHITE, 0.2)));
}

// ---------------- NODS (Ruby: "a few Easter eggs … that nod to both of those games but without infringing") ----------
// docs/prior-art/painted-ringworld-2.md §E: genre stock drawn in shapes of our own, never a series' marks, names, logos
// or designs. Halo-leaning: a pair of lens wardens, a keyless gate in a cliff, a drop-pod opened like a flower, a spire
// beaming to the arch. Fallout-leaning: a toothed door rolled aside in a hill (no number), an atomic-age diner, a
// finned wreck, a billboard with a grinning crescent moon, a rusted colossus suit kneeling in a field; crimped caps.
// Each at (X, Y), h its height in pixels, in the caller's lit colours (c.glow its light), night how dark it is.
// (q: the chance a place the rule allows holds one, tuned so a scene shows a common nod about one time in two, an
//  uncommon one in seven, a rare one in twenty-five, a very rare one hardly ever; loud ones one to a scene)
export const PK_EGGS = {
  warden:   { worlds: ['builders', 'ruins'], q: 0.03, loud: false },  gate:     { worlds: ['builders', 'ruins'], q: 0.003, loud: true },
  pod:      { worlds: ['wilds', 'ruins'], q: 0.015, loud: true },      spire:    { worlds: ['builders'], q: 0.006, loud: true },
  cogdoor:  { worlds: ['wilds', 'ruins'], q: 0.02, loud: false },      diner:    { worlds: ['ruins', 'cities'], q: 0.27, loud: false },
  car:      { worlds: ['ruins', 'cities'], q: 1, loud: false },        billboard: { worlds: ['ruins', 'cities'], q: 0.05, loud: false },
  suit:     { worlds: ['ruins', 'wilds'], q: 0.015, loud: true },      caps:     { worlds: ['ruins', 'cities'], q: 0.015, loud: false } };
export function pkEgg(x, X, Y, h, c, kind, R0, px, night = 0){
  const sub = pkSub(R0), R = sub(1), sd = c.sd, glow = c.glow, rust = pkMix(c.body, [150, 86, 52], 0.45), moss = pkMix(c.dark, [70, 104, 58], 0.45);
  const ln = (pts, col, wd) => { x.strokeStyle = col; x.lineWidth = Math.max(px(0.5), wd); x.lineCap = 'round'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
  if(kind === 'warden'){ // two lens-bodied drones drifting together, a pale slit eye each, three hanging tassels of light
    for(const [ox, oy] of [[-h*0.9, 0], [h*0.7, -h*0.6]]){ const cx = X + ox, cy = Y - h*3.5 + oy;
      pkGlow(x, cx, Y - h*0.05, h*0.8, glow, 0.15 + 0.2*night);
      pkEll(x, cx, cy, h*0.55, h*0.2, pkCss(c.body)); pkEll(x, cx + sd*h*0.12, cy - h*0.06, h*0.3, h*0.09, pkCss(c.lit));
      x.fillStyle = pkCss(pkMix(glow, PK_WHITE, 0.5), 0.95); x.fillRect(cx - h*0.18, cy - h*0.02, h*0.36, Math.max(px(0.5), h*0.04)); pkGlow(x, cx, cy, h*0.5, glow, 0.35 + 0.3*night);
      for(let k = -1; k <= 1; k++) ln([[cx + k*h*0.18, cy + h*0.18], [cx + k*h*0.2, cy + h*0.5]], pkCss(glow, 0.6), h*0.04); }
    return; }
  if(kind === 'gate'){ // a keyless gate: a tall slab set into the hill, a slit of light, two leaning buttresses, script on its lintel
    const w = h*0.5; pkPoly(x, [[X - w*0.9, Y], [X - w*0.55, Y - h], [X - w*0.35, Y - h], [X - w*0.5, Y]], pkCss(c.dark)); pkPoly(x, [[X + w*0.9, Y], [X + w*0.55, Y - h], [X + w*0.35, Y - h], [X + w*0.5, Y]], pkCss(c.dark));
    pkPoly(x, [[X - w*0.5, Y], [X - w*0.4, Y - h*1.05], [X + w*0.4, Y - h*1.05], [X + w*0.5, Y]], pkCss(c.body)); pkPoly(x, [[X, Y], [X, Y - h*1.05], [X + sd*w*0.4, Y - h*1.05], [X + sd*w*0.5, Y]], pkCss(c.lit));
    x.fillStyle = pkCss(pkMix(glow, PK_WHITE, 0.4), 0.9); x.fillRect(X - w*0.03, Y - h*0.85, w*0.06, h*0.85); pkGlow(x, X, Y - h*0.4, w*0.8, glow, 0.35 + 0.3*night);
    for(let k = 0; k < 7; k++){ const gx = X - w*0.3 + k*w*0.1, gy = Y - h*0.96; ln(R() < 0.5 ? [[gx, gy - h*0.03], [gx, gy + h*0.03]] : [[gx - w*0.03, gy + h*0.03], [gx, gy - h*0.03], [gx + w*0.03, gy + h*0.03]], pkCss(glow, 0.8), h*0.012); }
    for(let k = 0; k < 4; k++) pkEll(x, X + (R() - 0.5)*w, Y - h*0.03*R(), w*0.12, h*0.03, pkCss(moss, 0.85)); return; }
  if(kind === 'pod'){ // a drop-pod half-buried, its three doors splayed open like petals, a scorch, a wisp of smoke
    pkEll(x, X - sd*h*0.6, Y + h*0.02, h*1.6, h*0.18, pkCss(PK_BLACK, 0.35));
    for(const s of [-1, 0, 1]) pkPoly(x, [[X + s*h*0.15, Y - h*0.35], [X + s*h*0.75 + (s === 0 ? sd*h*0.2 : 0), Y - h*(s === 0 ? 0.95 : 0.5)], [X + s*h*0.55, Y - h*0.12]], pkCss(s === sd ? c.lit : c.body));
    pkPoly(x, [[X - h*0.3, Y], [X - h*0.25, Y - h*0.5], [X, Y - h*0.65], [X + h*0.25, Y - h*0.5], [X + h*0.3, Y]], pkCss(c.dark)); pkGlow(x, X, Y - h*0.4, h*0.4, glow, 0.25 + 0.3*night);
    for(let k = 0; k < 4; k++){ const r = h*(0.15 + k*0.08); pkDisc(x, X + sd*h*0.2*k, Y - h*(0.8 + k*0.35), r, pkCss(pkMix(c.lit, c.dark, 0.5), 0.35 - k*0.07)); } return; }
  if(kind === 'spire'){ // a pulse spire: tall and angular, a collar halfway up, a beam from its tip up toward the arch
    const w = h*0.05; pkPoly(x, [[X - w, Y], [X - w*0.3, Y - h], [X + w*0.3, Y - h], [X + w, Y]], pkCss(c.dark)); pkPoly(x, [[X, Y], [X, Y - h], [X + sd*w*0.3, Y - h], [X + sd*w, Y]], pkCss(c.body));
    pkEll(x, X, Y - h*0.5, w*2.2, w*0.6, pkCss(c.lit)); x.save(); x.globalCompositeOperation = 'screen';
    const g = x.createLinearGradient(X, Y - h, X, Y - h*6); g.addColorStop(0, pkCss(glow, 0.8)); g.addColorStop(1, pkCss(glow, 0)); x.fillStyle = g; x.fillRect(X - w*0.25, Y - h*6, w*0.5, h*5); x.restore();
    pkGlow(x, X, Y - h, w*6, glow, 0.6); return; }
  if(kind === 'cogdoor'){ // a great round toothed door rolled aside from a dark round opening in the hill; an apron, two striped bollards
    const r = h*0.5, cx = X - r*0.3, cy = Y - r; pkEll(x, X, Y, r*2.2, r*0.25, pkCss(pkMix(c.lit, c.body, 0.5)));
    pkDisc(x, cx, cy, r, pkCss(pkMix(PK_BLACK, c.dark, 0.3)));
    const dx = cx + r*1.35, tooth = 12; x.fillStyle = pkCss(R() < 0.5 ? rust : pkMix(c.body, [150, 40, 46], 0.4)); x.beginPath();
    for(let k = 0; k < tooth*2; k++){ const a = k/(tooth*2)*Math.PI*2, rr = k % 2 ? r*1.0 : r*1.1; x.lineTo(dx + Math.cos(a)*rr*0.35, cy + Math.sin(a)*rr); } x.closePath(); x.fill();
    pkEll(x, dx + sd*r*0.08, cy, r*0.22, r*0.75, pkCss(c.lit, 0.5));
    for(const s of [-1, 1]){ const bx = X + s*r*1.6; ln([[bx, Y], [bx, Y - r*0.5]], pkCss([214, 182, 70]), r*0.12); ln([[bx, Y - r*0.15], [bx, Y - r*0.25]], pkCss(PK_BLACK, 0.7), r*0.12); }
    if(night > 0.2) pkGlow(x, cx + r*0.9, cy - r*0.9, r*0.4, [255, 190, 110], 0.5*night); return; }
  if(kind === 'diner'){ // an atomic diner: a low glass box under an upswept roof, a pylon sign with a starburst and a rocket on top, EATS
    const w = h*2.2, top = Y - h*0.45; pkPoly(x, [[X - w/2, Y], [X - w/2, top], [X + w/2, top], [X + w/2, Y]], pkCss(c.body));
    x.fillStyle = pkCss(night > 0.2 ? pkMix(glow, PK_WHITE, 0.3) : pkMix(c.lit, [150, 200, 220], 0.4), night > 0.2 ? 0.8 : 0.7); x.fillRect(X - w*0.42, top + h*0.08, w*0.84, h*0.22);
    pkPoly(x, [[X - w*0.6, top + h*0.05], [X - w*0.1, top - h*0.12], [X + w*0.62, top - h*0.3], [X + w*0.55, top - h*0.2], [X - w*0.05, top - h*0.02]], pkCss(pkMix(c.lit, [230, 120, 110], 0.35)));
    const px0 = X + w*0.7; ln([[px0, Y], [px0, Y - h*1.4]], pkCss(c.dark), h*0.05);
    for(let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; ln([[px0, Y - h*1.15], [px0 + Math.cos(a)*h*0.18, Y - h*1.15 + Math.sin(a)*h*0.18]], pkCss(pkMix(glow, PK_WHITE, 0.3)), h*0.02); }
    pkPoly(x, [[px0, Y - h*1.7], [px0 - h*0.06, Y - h*1.45], [px0 + h*0.06, Y - h*1.45]], pkCss(c.lit));
    x.fillStyle = pkCss(night > 0.2 ? glow : [200, 60, 60], 0.95); x.font = `bold ${Math.max(4, Math.round(h*0.22))}px sans-serif`; x.textAlign = 'center'; x.fillText('EATS', px0, Y - h*0.75);
    if(night > 0.2) pkGlow(x, px0, Y - h*0.82, h*0.5, glow, 0.5*night); return; }
  if(kind === 'car'){ // a finned wreck: long and low, its tailfins high, its wheels flat, rust through it, a bush growing in it
    const L = h*3.6, dir = R() < 0.5 ? 1 : -1, P = (u, v) => [X + dir*u*L, Y - v*h];
    pkPoly(x, [P(-0.5, 0.15), P(-0.5, 0.5), P(-0.45, 0.62), P(-0.15, 0.62), P(0, 0.95), P(0.25, 0.95), P(0.35, 0.65), P(0.48, 0.6), P(0.5, 0.15)], pkCss(R() < 0.5 ? rust : pkMix(c.body, [110, 150, 160], 0.4)));
    pkPoly(x, [P(-0.5, 0.5), P(-0.52, 0.9), P(-0.42, 0.62)], pkCss(c.lit)); pkPoly(x, [P(-0.05, 0.9), P(0.22, 0.9), P(0.3, 0.66), P(0.02, 0.66)], pkCss(c.dark, 0.7));
    for(const u of [-0.32, 0.32]) pkEll(x, P(u, 0)[0], Y - h*0.12, h*0.22, h*0.16, pkCss(c.dark));
    pkEll(x, P(0.1, 0.5)[0], Y - h*0.45, h*0.3, h*0.2, pkCss(rust, 0.6)); if(R() < 0.6) for(let k = 0; k < 4; k++) pkDisc(x, P(-0.1, 0.8)[0] + (R() - 0.5)*h*0.6, Y - h*(0.85 + R()*0.4), h*0.18, pkCss(moss)); return; }
  if(kind === 'billboard'){ // a peeling billboard on two posts: a crescent moon grinning in a nightcap, a glass in its hand, an older layer under a torn strip
    const w = h*1.6, b = Y - h*0.35, t = Y - h; ln([[X - w*0.3, Y], [X - w*0.3, b]], pkCss(c.dark), h*0.05); ln([[X + w*0.3, Y], [X + w*0.3, b]], pkCss(c.dark), h*0.05);
    pkPoly(x, [[X - w/2, b], [X - w/2, t], [X + w/2, t], [X + w/2, b]], pkCss(pkMix(c.lit, [236, 220, 170], 0.4)));
    const mx = X - w*0.18, my = (b + t)/2, mr = (b - t)*0.36; pkDisc(x, mx, my, mr, pkCss([240, 200, 70])); pkDisc(x, mx + mr*0.45, my - mr*0.15, mr*0.85, pkCss(pkMix(c.lit, [236, 220, 170], 0.4)));
    ln([[mx - mr*0.55, my + mr*0.2], [mx - mr*0.3, my + mr*0.45], [mx - mr*0.05, my + mr*0.35]], pkCss(PK_BLACK, 0.7), mr*0.08); pkDisc(x, mx - mr*0.45, my - mr*0.2, mr*0.08, pkCss(PK_BLACK, 0.8));
    pkPoly(x, [[mx - mr*0.8, my - mr*0.7], [mx - mr*0.1, my - mr*1.25], [mx + mr*0.1, my - mr*0.6]], pkCss([60, 90, 160])); pkDisc(x, mx + mr*0.1, my - mr*1.25, mr*0.12, pkCss(PK_WHITE));
    pkPoly(x, [[mx + mr*0.3, my + mr*0.3], [mx + mr*0.55, my + mr*0.3], [mx + mr*0.5, my + mr*0.8], [mx + mr*0.35, my + mr*0.8]], pkCss(pkMix(glow, PK_WHITE, 0.3), 0.85));
    for(let k = 0; k < 2; k++){ x.fillStyle = pkCss(PK_BLACK, 0.55); x.fillRect(X + w*0.08, t + (b - t)*(0.3 + k*0.25), w*(0.25 + 0.12*R()), (b - t)*0.08); }
    pkPoly(x, [[X + w*0.32, t], [X + w*0.5, t], [X + w*0.5, t + (b - t)*0.6], [X + w*0.42, t + (b - t)*0.4]], pkCss(pkMix(c.body, [120, 160, 190], 0.4))); return; }
  if(kind === 'suit'){ // a rust colossus: a barrel-chested suit kneeling, a porthole helmet, its chest hatch open, moss and a nest
    pkPoly(x, [[X - h*0.3, Y], [X - h*0.25, Y - h*0.32], [X + h*0.02, Y - h*0.34], [X + h*0.05, Y]], pkCss(c.dark));
    pkEll(x, X, Y - h*0.55, h*0.3, h*0.26, pkCss(rust)); pkEll(x, X + sd*h*0.1, Y - h*0.58, h*0.15, h*0.18, pkCss(pkMix(rust, PK_WHITE, 0.15)));
    pkPoly(x, [[X - h*0.08, Y - h*0.62], [X + h*0.1, Y - h*0.62], [X + h*0.12, Y - h*0.45], [X - h*0.1, Y - h*0.45]], pkCss(PK_BLACK, 0.6));
    pkDisc(x, X, Y - h*0.88, h*0.15, pkCss(rust)); pkDisc(x, X + sd*h*0.03, Y - h*0.88, h*0.08, pkCss(pkMix(c.dark, [120, 170, 190], 0.4)));
    ln([[X + h*0.28, Y - h*0.65], [X + h*0.45, Y - h*0.35], [X + h*0.42, Y]], pkCss(c.dark), h*0.12); ln([[X - h*0.28, Y - h*0.65], [X - h*0.4, Y - h*0.35]], pkCss(c.dark), h*0.12);
    for(let k = 0; k < 5; k++) pkEll(x, X + (R() - 0.5)*h*0.5, Y - h*(0.4 + R()*0.55), h*0.06, h*0.03, pkCss(moss, 0.85));
    pkEll(x, X + h*0.05, Y - h*1.03, h*0.08, h*0.035, pkCss([110, 84, 60])); return; }
  // caps: a few crimped bottle caps in the grass, bone, red and blue
  for(let k = 0, n = 3 + Math.floor(R()*7); k < n; k++){ const cx = X + (R() - 0.5)*h*4, cy = Y - R()*h*0.4, col = [[230, 222, 200], [196, 56, 50], [70, 100, 170]][Math.floor(R()*3)];
    pkEll(x, cx, cy, h*0.5, h*0.22, pkCss(pkMix(col, c.dark, 0.25))); pkEll(x, cx - sd*h*0.08, cy - h*0.04, h*0.3, h*0.12, pkCss(col)); }
}

// ---------------- ROBOTS AND DROIDS (as life, where they belong) ----------------
// Shape language, as games use it: round, soft and big-eyed is a friend (a helper on its wheel, a drone humming along,
// a crawler tending the pipes); angular, spiked, red-eyed and low is a threat (a sentry on its tripod, a walker stalking);
// and one giant, fallen long ago, kneels rusting in the ruins. Each drawn standing at (X, Y), h tall (a drone floats
// above its spot), in the caller's lit colours; c.eye its eye's light (the world's), night how dark it is.
export const PK_BOTS = { builders: ['helper', 'drone', 'crawler', 'walker'], cities: ['helper', 'drone', 'drone'], neon: ['drone', 'sentry', 'walker', 'helper'],
  ruins: ['sentry', 'crawler', 'derelict', 'sentry'], wilds: ['helper', 'derelict'], magic: ['drone'] };
export function pkRobot(x, X, Y, h, c, kind, R0, px, night = 0){
  const sub = pkSub(R0), R = sub(1), sd = c.sd, eye = c.eye || c.glow, threat = kind === 'sentry' || kind === 'walker';
  const eyeCol = threat ? pkMix([255, 60, 50], eye, 0.2) : eye, glowA = 0.5 + 0.5*night;
  const dot = (ex, ey, r) => { pkGlow(x, ex, ey, r*4, eyeCol, 0.35*glowA); pkDisc(x, ex, ey, r, pkCss(pkMix(eyeCol, PK_WHITE, 0.4))); };
  if(h > px(6)) pkFoot(x, X, Y, h*0.3, c);
  if(kind === 'helper'){ // a round body on one wheel, a dome of a head, one big eye: it waves
    const r = h*0.32; pkDisc(x, X, Y - r*0.5, r*0.5, pkCss(c.dark));
    pkEll(x, X, Y - h*0.45, r, r*1.05, pkCss(c.body)); pkEll(x, X + sd*r*0.3, Y - h*0.5, r*0.55, r*0.8, pkCss(c.lit));
    pkEll(x, X, Y - h*0.82, r*0.7, r*0.55, pkCss(c.body)); pkEll(x, X + sd*r*0.15, Y - h*0.86, r*0.4, r*0.3, pkCss(c.lit));
    dot(X + sd*r*0.15, Y - h*0.8, Math.max(px(0.6), r*0.18));
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.04); x.lineCap = 'round'; x.beginPath(); x.moveTo(X - sd*r*0.9, Y - h*0.5); x.lineTo(X - sd*r*1.4, Y - h*(0.75 + 0.15*R())); x.stroke(); return; }
  if(kind === 'drone'){ // a little sphere hovering, two fins, its eye and a soft light beneath it
    const r = h*0.3, cy = Y - h*(1.6 + 1.6*R()); pkGlow(x, X, Y - h*0.05, r*2, eye, 0.18*glowA);
    pkPoly(x, [[X - r*1.9, cy], [X - r*0.8, cy - r*0.35], [X - r*0.8, cy + r*0.25]], pkCss(c.dark)); pkPoly(x, [[X + r*1.9, cy], [X + r*0.8, cy - r*0.35], [X + r*0.8, cy + r*0.25]], pkCss(c.dark));
    pkDisc(x, X, cy, r, pkCss(c.body)); pkDisc(x, X + sd*r*0.3, cy - r*0.3, r*0.5, pkCss(c.lit)); dot(X, cy + r*0.1, Math.max(px(0.5), r*0.25)); return; }
  if(kind === 'crawler'){ // a low tracked tender, an arm folded over it, a lamp at its end
    const w = h*1.4; pkPoly(x, [[X - w/2, Y], [X - w/2 + h*0.1, Y - h*0.35], [X + w/2 - h*0.1, Y - h*0.35], [X + w/2, Y]], pkCss(c.dark));
    pkPoly(x, [[X - w*0.4, Y - h*0.3], [X - w*0.3, Y - h*0.6], [X + w*0.25, Y - h*0.6], [X + w*0.35, Y - h*0.3]], pkCss(c.body));
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.08); x.lineCap = 'round'; x.beginPath(); x.moveTo(X + w*0.2, Y - h*0.6); x.lineTo(X + w*0.1, Y - h*1.0); x.lineTo(X - w*0.3, Y - h*0.85); x.stroke();
    dot(X - w*0.3, Y - h*0.85, Math.max(px(0.5), h*0.07)); return; }
  if(kind === 'sentry'){ // a turret on three legs: a wedge of a head, a slit of red eye, spikes along its back
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.beginPath(); for(const s of [-1, 0, 1]){ x.moveTo(X, Y - h*0.45); x.lineTo(X + s*h*0.35, Y); } x.stroke();
    pkPoly(x, [[X - h*0.45, Y - h*0.5], [X - h*0.2, Y - h*0.95], [X + h*0.5, Y - h*0.7], [X + h*0.25, Y - h*0.45]], pkCss(pkMix(c.dark, c.body, 0.3)));
    pkPoly(x, [[X - h*0.2, Y - h*0.95], [X + h*0.5, Y - h*0.7], [X + h*0.1, Y - h*0.75]], pkCss(c.lit));
    for(let q = 0; q < 3; q++) pkPoly(x, [[X - h*(0.4 - q*0.18), Y - h*(0.56 + q*0.12)], [X - h*(0.5 - q*0.18), Y - h*(0.8 + q*0.12)], [X - h*(0.3 - q*0.18), Y - h*(0.62 + q*0.12)]], pkCss(c.dark));
    x.fillStyle = pkCss(eyeCol, 0.95); x.fillRect(X + h*0.15, Y - h*0.72, h*0.25, Math.max(px(0.6), h*0.04)); pkGlow(x, X + h*0.28, Y - h*0.7, h*0.5, eyeCol, 0.4*glowA); return; }
  if(kind === 'walker'){ // four jointed legs, a long low body, a head held forward: it hunts
    const bw = h*0.9, by = Y - h*0.62; x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.lineCap = 'round'; x.beginPath();
    for(const [lx, f] of [[-0.4, -1], [-0.15, 1], [0.15, -1], [0.4, 1]]){ const kx = X + lx*bw + f*h*0.12; x.moveTo(X + lx*bw*0.8, by); x.lineTo(kx, by - h*0.15); x.lineTo(X + lx*bw*1.1, Y); } x.stroke();
    pkPoly(x, [[X - bw/2, by + h*0.06], [X - bw*0.4, by - h*0.12], [X + bw*0.4, by - h*0.14], [X + bw/2, by + h*0.04]], pkCss(c.body));
    pkPoly(x, [[X + sd*bw*0.45, by - h*0.06], [X + sd*bw*0.75, by - h*0.12], [X + sd*bw*0.8, by + h*0.02], [X + sd*bw*0.5, by + h*0.05]], pkCss(pkMix(c.dark, c.body, 0.4)));
    dot(X + sd*bw*0.72, by - h*0.05, Math.max(px(0.5), h*0.035)); return; }
  // a derelict: a giant, fallen long ago, kneeling, one arm on the ground, rust and moss on it, its eye long dark
  const rust = pkMix(c.body, [140, 80, 50], 0.45), moss = pkMix(c.dark, [70, 100, 60], 0.4);
  pkPoly(x, [[X - h*0.35, Y], [X - h*0.3, Y - h*0.35], [X - h*0.05, Y - h*0.38], [X, Y]], pkCss(c.dark));                       // the knee
  pkPoly(x, [[X - h*0.25, Y - h*0.3], [X - h*0.3, Y - h*0.75], [X + h*0.25, Y - h*0.8], [X + h*0.3, Y - h*0.35]], pkCss(rust));   // the torso
  pkPoly(x, [[X + sd*h*0.02, Y - h*0.32], [X + sd*h*0.27, Y - h*0.38], [X + sd*h*0.24, Y - h*0.78], [X + sd*h*0.02, Y - h*0.76]], pkCss(pkMix(rust, PK_WHITE, 0.12)));
  pkPoly(x, [[X - h*0.12, Y - h*0.8], [X - h*0.1, Y - h*1.0], [X + h*0.15, Y - h*0.98], [X + h*0.14, Y - h*0.8]], pkCss(rust));   // the head
  x.fillStyle = pkCss(PK_BLACK, 0.6); x.fillRect(X - h*0.04, Y - h*0.92, h*0.14, h*0.035);
  pkPoly(x, [[X + h*0.28, Y - h*0.75], [X + h*0.55, Y - h*0.4], [X + h*0.6, Y], [X + h*0.48, Y], [X + h*0.44, Y - h*0.38], [X + h*0.22, Y - h*0.6]], pkCss(c.dark));   // the arm on the ground
  for(let q = 0; q < 5; q++) pkEll(x, X + (R() - 0.5)*h*0.5, Y - h*(0.3 + R()*0.5), h*0.06, h*0.03, pkCss(moss, 0.8));
}

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
