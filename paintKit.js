/**
 * paintKit.js — THE PAINTED THINGS: trees, buildings, rocks and the builders' works as a flat painter blocks them in
 * (docs/prior-art/painted-ringworld.md). Shared by the Ringworld (stepsRing.js), Ring in the Sky's land
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

// ---------------- THE FINISH (docs/prior-art/ringworld-sprites.md: Ruby, "a slightly less cartoony art style") ----------------
// What turns a flat sticker into a thing standing in the world, as the illustrators of flat-shaded games do it: a face
// lit from the sky (a touch paler at its top, darker toward the ground the sky can't reach); a shadow cast on the
// ground; weather streaking down from sills and copings; materials of their own (wood, stone, brick, rust, paint), lit
// by the scene's light rather than all one grey.
// a face, shaded from top to foot (plain when too small to show it)
const pkShade = (x, pts, col, y0, y1, k = 0.14) => { if(!(y1 - y0 > 2)) return pkPoly(x, pts, pkCss(col));
  const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, pkCss(pkMix(col, PK_WHITE, k*0.5))); g.addColorStop(0.62, pkCss(col)); g.addColorStop(1, pkCss(pkMix(col, PK_BLACK, k*1.2))); pkPoly(x, pts, g); };
// the shadow a thing from X0 to X1, h tall, throws on the ground away from the light, foreshortened
const pkCast = (x, X0, X1, Y, h, c, a = 0.22) => { const dx = -c.sd*h*0.42, dy = h*0.07; pkPoly(x, [[X0, Y], [X1, Y], [X1 + dx, Y + dy], [X0 + dx, Y + dy]], pkCss(pkMix(c.dark, PK_BLACK, 0.5), a)); };
// streaks of weather down a wall from x0..x0+w, top..top+ht (only where large enough to carry them)
const pkStreaks = (x, x0, top, w, ht, c, R, px, a = 0.16) => { if(ht < px(28) || w < px(6)) return;
  for(let k = 0, n = Math.min(14, 2 + Math.floor(w/px(9))); k < n; k++){ const sx = x0 + w*(0.04 + 0.92*R()), sy = top + ht*R()*0.7, len = ht*(0.06 + 0.22*R()), sw = Math.max(px(0.5), w*(0.005 + 0.012*R()));
    // (a soft stain: widest where the water ran off, fading as it goes)
    const g = x.createLinearGradient(0, sy, 0, sy + len); g.addColorStop(0, pkCss(c.dark, 0)); g.addColorStop(0.15, pkCss(c.dark, a*0.6)); g.addColorStop(1, pkCss(c.dark, 0)); x.fillStyle = g;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + sw, sy); x.lineTo(sx + sw*0.75, sy + len); x.lineTo(sx + sw*0.25, sy + len); x.fill(); } };
// a material lit as the scene lights it: the caller's own (c.mat) where it gives one, else mixed into its colours
const pkMat = (c, rgb, k = 0.6) => c.mat ? { ...c, ...c.mat(rgb) } : { ...c, body: pkMix(c.body, rgb, k), lit: pkMix(c.lit, pkMix(rgb, PK_WHITE, 0.3), k), dark: pkMix(c.dark, pkMix(rgb, PK_BLACK, 0.45), k) };
// ivy (or any creeper) climbing from (X, Y) up to ht, spreading to wd: a mass of small leaves along a few wandering
// stems, darker within, the light catching the outer leaves
const pkIvy = (x, X, Y, ht, wd, c, R, px) => { const iv = pkMat(c, [58, 92, 52], 0.75), lf = Math.max(px(0.6), Math.min(wd*0.12, ht*0.03)), m = 3 + Math.floor(R()*3), pts = [];
  for(let k = 0; k < m; k++){ let sx = X + (k/(m - 1 || 1) - 0.5)*wd*0.5, sy = Y; const top = ht*(0.45 + 0.55*R()), steps = Math.min(40, Math.max(6, Math.floor(top/lf)));
    for(let q = 0; q < steps; q++){ sy -= top/steps; sx += (R() - 0.5)*lf*1.6 + (sx - X)*0.04; for(let t = 0; t < 2; t++) pts.push([sx + (R() - 0.5)*lf*2.2*(1.2 - q/steps*0.6), sy + (R() - 0.5)*lf]); } }
  for(const [px0, py] of pts) pkEll(x, px0, py, lf*(0.7 + 0.5*R()), lf*(0.55 + 0.35*R()), pkCss(iv.dark, 0.95));
  for(const [px0, py] of pts) if(R() < 0.7){ const lt = (px0 - X)*c.sd > 0 && R() < 0.6; pkEll(x, px0 + c.sd*lf*0.2, py - lf*0.15, lf*(0.45 + 0.35*R()), lf*(0.35 + 0.25*R()), pkCss(lt ? iv.lit : iv.body, 0.92)); } };
const PK_WOOD = [124, 92, 64], PK_GREYWOOD = [138, 130, 118], PK_IRON = [58, 62, 60], PK_RUST = [140, 78, 46], PK_STONE = [140, 134, 122], PK_BRICK = [150, 78, 58], PK_TERRA = [172, 96, 64],
  PK_CONCRETE = [170, 166, 156], PK_STEEL = [150, 156, 160], PK_GREENPAINT = [62, 92, 74], PK_REDPAINT = [168, 52, 44], PK_CREAM = [222, 210, 182], PK_THATCH = [168, 140, 86], PK_SLATE = [84, 88, 98];

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
  yurt: [2.6, 3, 5.5, 7], rondavel: [4, 5.5, 4, 6], trullo: [4, 6, 6, 12], horreo: [3, 5, 3, 6], pueblo: [5, 12, 12, 30], machiya: [6, 8, 5.4, 6], chapel: [7, 11, 6, 9],
  gasstation: [5, 6, 20, 30], motel: [4, 6, 20, 36], greenhouse: [3, 4, 8, 20], radiomast: [60, 150, 2, 3], oast: [10, 14, 8, 14], dovecote: [6, 10, 3, 5], gassho: [10, 14, 10, 16],
  kubo: [4, 6, 4, 6], elevator: [24, 32, 8, 12],
  helper: [1.0, 1.5], drone: [0.5, 1.0], crawler: [0.6, 1.0], sentry: [1.8, 2.8], walker: [2.5, 4.5], derelict: [10, 22],
  fence: [0.9, 1.2], lamp: [3, 4.6], bench: [0.8, 0.9], mailbox: [1.1, 1.2], barrel: [0.9, 1.0], crate: [0.5, 1.1], sign: [2.2, 2.8], bicycle: [0.95, 1.05], hydrant: [0.6, 0.8],
  wall: [1.1, 1.5], hedge: [1.5, 2.6], gate: [1.2, 1.3], haybale: [1.2, 1.5], haystack: [3, 5], trough: [0.5, 0.6], pole: [10, 13], milestone: [0.6, 1], cairn: [0.6, 2], scarecrow: [1.7, 1.9],
  beehives: [0.6, 1.0], well: [2.3, 2.7], wishing: [2.3, 2.7], windpump: [9, 11], tractor: [2.5, 3], grainbin: [6, 10], shrine: [2, 3], busstop: [2.5, 2.7], phonebox: [2.4, 2.5], vending: [1.8, 1.9],
  signal: [3, 3.4], kiosk: [2.6, 3], cart: [2.1, 2.4], parked: [1.4, 1.6], hulk: [1.3, 1.4], scooter: [1.0, 1.2], rubble: [0.6, 2.4], column: [1.5, 4], statue: [1.6, 2.4], container: [2.59, 2.6], traps: [1.2, 1.4],
  cargo: [1.2, 2.4], solar: [2, 2.6], dish: [6, 12], beacon: [5, 10], pipes: [1.5, 2.5], tripod: [1.4, 1.6], menhir: [1.8, 4.5], dolmen: [1.8, 2.6], fairyring: [0.12, 0.16], wisp: [0.3, 0.4], flower: [3, 5],
  toadstool: [2.5, 4], moongate: [3, 4],
  warden: [1.0, 1.4], gate: [14, 22], pod: [3, 4], spire: [90, 160], cogdoor: [8, 11], diner: [5, 6.5], car: [1.4, 1.6], suit: [6, 8], caps: [0.12, 0.15],
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
function pkLobes(x, lobes, c, R, cx, cy, rr, px){
  const lx = c.L[0], ly = c.L[1], big = px && rr > px(10);
  if(!big){ // far off: each lobe a disc in shadow, again smaller toward the light, a lit cap on the lit side
    for(const [X, Y, r] of lobes) pkDisc(x, X, Y, r, pkCss(c.dark));
    for(const [X, Y, r] of lobes) pkDisc(x, X + lx*r*0.22, Y + ly*r*0.22, r*0.78, pkCss(c.body));
    for(const [X, Y, r] of lobes){ const fx = (X - cx)/rr, fy = (Y - cy)/rr; if(fx*lx + fy*ly < 0.05) continue; pkDisc(x, X + lx*r*0.38, Y + ly*r*0.38, r*0.42, pkCss(c.lit)); }
    if(rr > 6) for(let q = 0; q < 3; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = Math.atan2(ly, lx) + (R() - 0.5)*1.2; pkDisc(x, X + Math.cos(a)*r*0.6, Y + Math.sin(a)*r*0.6, r*0.14, pkCss(pkMix(c.lit, PK_WHITE, 0.35))); }
    return; }
  // NEAR (less cartoony: a crown is clumps of leaves, not balls): each lobe's edge broken into small clusters, so its
  // silhouette is ragged; within, clusters in the body's colour toward the light and lit clusters on the lit side, the
  // deep shade left showing between them; and a few gaps where the sky shows through
  const deep = pkMix(c.dark, PK_BLACK, 0.25);
  for(const [X, Y, r] of lobes){ pkDisc(x, X, Y, r*0.82, pkCss(c.dark)); for(let q = 0, n = 9; q < n; q++){ const a = q/n*Math.PI*2 + R()*0.5, d = r*(0.72 + 0.12*R()); pkDisc(x, X + Math.cos(a)*d, Y + Math.sin(a)*d*0.9, r*(0.22 + 0.12*R()), pkCss(c.dark)); } }
  for(const [X, Y, r] of lobes) for(let q = 0; q < 7; q++){ const a = R()*Math.PI*2, d = r*0.6*Math.sqrt(R()), ox = X + lx*r*0.2 + Math.cos(a)*d, oy = Y + ly*r*0.2 + Math.sin(a)*d;
    pkDisc(x, ox, oy, r*(0.2 + 0.14*R()), pkCss(c.body)); }
  for(const [X, Y, r] of lobes){ const fx = (X - cx)/rr, fy = (Y - cy)/rr, lt = fx*lx + fy*ly; if(lt < -0.2) continue;
    for(let q = 0; q < 5; q++){ const a = Math.atan2(ly, lx) + (R() - 0.5)*1.8, d = r*(0.3 + 0.45*R()); pkDisc(x, X + Math.cos(a)*d, Y + Math.sin(a)*d, r*(0.1 + 0.1*R()), pkCss(lt > 0.2 && R() < 0.5 ? pkMix(c.lit, PK_WHITE, 0.15) : c.lit)); } }
  // (the sky through the crown, here and there, and dark hollows deeper in)
  for(let q = 0; q < 3; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = R()*Math.PI*2; pkDisc(x, X + Math.cos(a)*r*0.45, Y + Math.sin(a)*r*0.45, r*0.09, pkCss(deep, 0.8)); }
  if(c.air) for(let q = 0; q < 2; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = R()*Math.PI*2; pkDisc(x, X + Math.cos(a)*r*0.8, Y + Math.sin(a)*r*0.8, r*0.07, pkCss(c.air, 0.85)); }
}
export function pkTree(x, X, Y, h, c, kind, R0, px){
  const sub = pkSub(R0), R = sub(1), RL = sub(2), sd = c.sd, rnd = (a, b) => a + (b - a)*R(), small = h < px(7);
  const trunk = (top, wd, lean = 0) => { if(wd < px(2.5)){ x.strokeStyle = pkCss(c.trunk); x.lineWidth = Math.max(px(0.6), wd); x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + lean, Y - top); x.stroke(); return; }
    // (near: a trunk that flares into its roots, darker on its shadow side, its bark marked)
    const w = wd/2, tk = c.trunk, dk = pkMix(tk, PK_BLACK, 0.35), lt = pkMix(tk, PK_WHITE, 0.18);
    pkPoly(x, [[X - w*2, Y + w*0.2], [X - w, Y - w*1.6], [X + lean - w*0.75, Y - top], [X + lean + w*0.75, Y - top], [X + w, Y - w*1.6], [X + w*2, Y + w*0.2]], pkCss(dk));
    pkPoly(x, [[X + sd*w*0.1, Y + w*0.2], [X + sd*w*0.2 + lean*0.05, Y - w*1.6], [X + lean + sd*w*0.15, Y - top], [X + lean + sd*w*0.75, Y - top], [X + sd*w, Y - w*1.6], [X + sd*w*1.8, Y + w*0.2]], pkCss(lt));
    if(wd > px(5)){ x.strokeStyle = pkCss(dk, 0.7); x.lineWidth = Math.max(px(0.4), w*0.12); x.beginPath(); for(let k = 0; k < 5; k++){ const u = 0.1 + 0.8*R(), bx = X + lean*u + (R() - 0.5)*w*1.2; x.moveTo(bx, Y - top*u); x.lineTo(bx + (R() - 0.5)*w*0.2, Y - top*(u + 0.06 + 0.08*R())); } x.stroke(); } };
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
    x.save(); x.translate(0, cy); x.scale(1, 0.55); x.translate(0, -cy); pkLobes(x, lobes, c, RL, cx, cy, h*0.3, px); x.restore(); return; }
  if(kind === 'poplar'){
    // a poplar: a tall flame of small lobes up a short trunk
    trunk(h*0.2, h*0.04); const lobes = [], n = small ? 3 : 7;
    for(let q = 0; q < n; q++){ const u = q/(n - 1); lobes.push([X + rnd(-1, 1)*h*0.04, Y - h*(0.25 + 0.65*u), h*(0.13 - 0.07*u)*(0.85 + 0.3*R())]); }
    pkLobes(x, lobes, c, RL, X, Y - h*0.6, h*0.4, px); return; }
  if(kind === 'birch'){
    // a birch: a slender pale trunk marked dark, an airy crown of few small lobes
    x.strokeStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.4)); x.lineWidth = Math.max(px(0.6), h*0.035); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + h*0.03, Y - h*0.8); x.stroke();
    if(!small){ x.fillStyle = pkCss(c.trunk); for(let q = 0; q < 4; q++){ const yy = Y - h*(0.15 + q*0.15); x.fillRect(X - h*0.02, yy, h*0.035, Math.max(px(0.5), h*0.012)); } }
    const lobes = []; for(let q = 0; q < (small ? 3 : 7); q++) lobes.push([X + h*0.03 + rnd(-0.13, 0.13)*h, Y - h*rnd(0.6, 0.92), h*rnd(0.09, 0.13)]);
    pkLobes(x, lobes, c, RL, X, Y - h*0.75, h*0.25, px); return; }
  if(kind === 'willow'){
    // a willow: a broad dome whose lobes hang down in long strands
    trunk(h*0.4, h*0.06); const cx = X, cy = Y - h*0.62, lobes = [];
    for(let q = 0; q < 6; q++){ const a = Math.PI + q/5*Math.PI; lobes.push([cx + Math.cos(a)*h*0.3, cy + Math.sin(a)*h*0.18, h*0.15]); }
    pkLobes(x, lobes, c, RL, cx, cy, h*0.35, px);
    if(!small){ const n = h > px(30) ? 34 : 9; x.lineCap = 'round';
      // (the curtain: many long falls of leaves from the crown's edge, the ones toward the light lit, swaying a little)
      for(const pass of [0, 1]) for(let q = 0; q < n; q++){ const u = q/(n - 1) - 0.5, sx = cx + u*h*0.72 + rnd(-1, 1)*h*0.01, len = h*rnd(0.28, 0.55)*(1 - Math.abs(u)*0.5), sw = rnd(-1, 1)*h*0.03, lit = u*sd > 0.05;
        if(pass === 0 ? lit : !lit) continue; x.strokeStyle = pkCss(lit ? (R() < 0.4 ? c.lit : c.body) : (R() < 0.5 ? c.dark : c.body)); x.lineWidth = Math.max(px(0.5), h*(n > 9 ? 0.016 : 0.025));
        x.beginPath(); x.moveTo(sx, cy - h*0.04); x.quadraticCurveTo(sx + u*h*0.08, cy + len*0.5, sx + u*h*0.12 + sw, cy + len); x.stroke(); } }
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
    if(h > px(30)){ x.lineWidth = Math.max(px(0.5), h*0.025); x.beginPath(); x.moveTo(X, Y - h*0.5); x.lineTo(X - rx*0.5, cy + ry*0.2); x.moveTo(X, Y - h*0.55); x.lineTo(X + rx*0.45, cy + ry*0.2); x.stroke();
      const lobes = []; for(let q = 0; q < 11; q++){ const u = q/10 - 0.5; lobes.push([X + u*rx*1.75, cy - ry*1.6*(1 - 3.4*u*u) + rnd(-1, 1)*ry*0.15, rx*rnd(0.2, 0.27)]); } for(let q = 0; q < 4; q++) lobes.push([X + rnd(-0.5, 0.5)*rx, cy - ry*rnd(1.2, 2), rx*0.28]);
      x.save(); x.translate(0, cy); x.scale(1, 0.62); x.translate(0, -cy); pkLobes(x, lobes, c, RL, X, cy - ry, rx, px); x.restore(); return; }
    if(!small){ x.lineWidth = Math.max(px(0.5), h*0.025); x.beginPath(); x.moveTo(X, Y - h*0.5); x.lineTo(X - rx*0.5, cy + ry*0.4); x.moveTo(X, Y - h*0.55); x.lineTo(X + rx*0.45, cy + ry*0.4); x.stroke(); }
    x.fillStyle = pkCss(c.dark); x.beginPath(); x.ellipse(X, cy, rx, ry*1.3, 0, Math.PI, 0); x.lineTo(X - rx, cy); x.fill();
    pkEll(x, X, cy, rx, ry*0.3, pkCss(c.dark));
    x.fillStyle = pkCss(c.body); x.beginPath(); x.ellipse(X + sd*rx*0.08, cy - ry*0.08, rx*0.9, ry*1.15, 0, Math.PI, 0); x.fill();
    if(!small){ x.fillStyle = pkCss(c.lit); x.beginPath(); x.ellipse(X + sd*rx*0.35, cy - ry*0.35, rx*0.42, ry*0.75, 0, Math.PI, 0); x.fill(); }
    return; }
  if(kind === 'cedar'){
    // a cedar of Lebanon: three to five flat shelves, each pushed a little aside, flat-topped
    trunk(h*0.85, h*0.05); const n = small ? 2 : 3 + Math.floor(R()*3);
    if(h > px(30)){ for(let q = 0; q < n; q++){ const u = q/(n - 1 || 1), yy = Y - h*(0.3 + 0.62*u), wd = h*(0.5 - 0.28*u)*(0.8 + 0.4*R()), ox = rnd(-1, 1)*h*0.08, lobes = [];
        for(let k = 0; k < 7; k++){ const v = k/6 - 0.5; lobes.push([X + ox + v*wd*1.8, yy - h*0.02 + rnd(-1, 1)*h*0.01, wd*rnd(0.18, 0.26)]); }
        x.save(); x.translate(0, yy); x.scale(1, 0.5); x.translate(0, -yy); pkLobes(x, lobes, c, RL, X + ox, yy, wd, px); x.restore(); } return; }
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
    if(!small) pkLobes(x, pads, c, RL, X, top - h*0.25, h*0.3, px);
    return; }
  if(kind === 'acacia'){
    // an umbrella thorn: two or three limbs forking up to one flat, wide crown
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const cy = Y - h*0.82, cw = h*rnd(0.75, 1);
    for(const [ex, wd] of [[-0.35, 0.05], [0.3, 0.045], [0.05, 0.035]]){ x.lineWidth = Math.max(px(0.5), h*wd); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + ex*cw*0.2, Y - h*0.45, X + ex*cw, cy + h*0.04); x.stroke(); }
    if(h > px(30)){ // (near: the flat crown is clumps of leaves on its branches, not a slab)
      const lobes = []; for(let q = 0; q < 9; q++){ const u = q/8 - 0.5; lobes.push([X + u*cw*1.8 + rnd(-1, 1)*cw*0.05, cy - h*0.02 + rnd(-1, 1)*h*0.03, cw*rnd(0.16, 0.24)]); }
      x.save(); x.translate(0, cy); x.scale(1, 0.5); x.translate(0, -cy); pkLobes(x, lobes, c, RL, X, cy, cw, px); x.restore(); return; }
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
    pkLobes(x, lobes, c, RL, X, Y - h*0.4, h*0.6, px); return; }
  // a broadleaf (and the glowing trees): a trunk forking under a domed crown of five to eight lobes
  trunk(h*0.45, h*0.06);
  if(!small){ x.lineWidth = Math.max(px(0.5), h*0.03); x.beginPath(); x.moveTo(X, Y - h*0.3); x.lineTo(X - h*0.1, Y - h*0.5); x.moveTo(X, Y - h*0.34); x.lineTo(X + h*0.12, Y - h*0.52); x.stroke(); }
  const cx = X, cy = Y - h*0.64, rr = h*0.34, n = (t => small ? 3 : t)(5 + Math.floor(R()*4)), lobes = [], RG = sub(3);
  for(let q = 0; q < n; q++){ const a = Math.PI*(1.05 + 0.9*q/(n - 1)) + rnd(-0.15, 0.15), d = rr*rnd(0.4, 0.62); lobes.push([cx + Math.cos(a)*d*1.15, cy + Math.sin(a)*d*0.85 + rr*0.15, rr*rnd(0.42, 0.55)]); }
  lobes.push([cx, cy - rr*0.15, rr*0.55]);
  pkLobes(x, lobes, c, RL, cx, cy, rr, px);
  if(kind === 'cherry' && !small){ const RB = sub(4); for(let q = 0, nb = h > px(30) ? 90 : 26; q < nb; q++){ const [lx, ly, lr] = lobes[Math.floor(RB()*lobes.length)], a = RB()*Math.PI*2, d = lr*Math.sqrt(RB())*0.9;
      pkDisc(x, lx + Math.cos(a)*d, ly + Math.sin(a)*d, Math.max(px(0.6), lr*(h > px(30) ? 0.08 : 0.14)), pkCss(pkMix([248, 214, 226], c.lit, 0.25), 0.9)); } }
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
const PK_ARCH = { city: [['glass', 3], ['deco', 2], ['slab', 2], ['brick', 3], ['dome', 0.6], ['needle', 0.4], ['row', 2.5], ['factory', 0.8], ['watertower', 0.5], ['clock', 0.3], ['cathedral', 0.25], ['mosque', 0.2], ['gasstation', 0.3], ['chapel', 0.2]],
  neon: [['glass', 3], ['slab', 2], ['deco', 1], ['needle', 1], ['capsule', 1.5], ['megablock', 1.5], ['motel', 0.4]],
  builders: [['pylon', 3], ['arch', 1], ['dome', 1.5], ['glass', 1], ['geodome', 1.5], ['observatory', 0.8], ['turbine', 1], ['greenhouse', 0.6], ['radiomast', 0.3]],
  ruins: [['brick', 2], ['glass', 2], ['slab', 2], ['deco', 1], ['castle', 0.8], ['cathedral', 0.3], ['factory', 1], ['lighthouse', 0.3], ['gasstation', 0.5], ['motel', 0.4], ['chapel', 0.3], ['elevator', 0.2]],
  magic: [['wizard', 3], ['onion', 2], ['brick', 1], ['pagoda', 1.5], ['torii', 0.8], ['stave', 0.8], ['observatory', 0.4]],
  village: [['cottage', 3], ['aframe', 1], ['barn', 1.5], ['silo', 1], ['windmill', 0.8], ['stave', 0.5], ['row', 1], ['lighthouse', 0.3], ['turbine', 0.4]] };
// THE VERNACULAR (Ruby: "a wider variety of things"; docs/prior-art/ringworld-sprites.md, Part C: a settlement builds in
// one tradition, never a mixture): the wilds' villages each in one, chosen by the land's region (the caller's u)
export const PK_VERNACULAR = {
  shire:    [['cottage', 3], ['barn', 1.5], ['row', 1], ['chapel', 0.6], ['dovecote', 0.4], ['oast', 0.4], ['windmill', 0.6], ['greenhouse', 0.4]],
  prairie:  [['barn', 2], ['silo', 1.5], ['aframe', 1], ['elevator', 0.4], ['gasstation', 0.4], ['motel', 0.3], ['watertower', 0.5], ['turbine', 0.4], ['radiomast', 0.15]],
  steppe:   [['yurt', 4], ['cottage', 0.3]],
  savanna:  [['rondavel', 4], ['cottage', 0.3]],
  apulia:   [['trullo', 4], ['cottage', 0.5], ['chapel', 0.4]],
  galicia:  [['horreo', 2], ['cottage', 2], ['chapel', 0.5], ['stave', 0.3]],
  mesa:     [['pueblo', 3], ['chapel', 0.4], ['windmill', 0.3]],
  kyo:      [['machiya', 2], ['gassho', 1.5], ['pagoda', 0.5], ['torii', 0.5]],
  tropic:   [['kubo', 4], ['greenhouse', 0.3]],
  north:    [['stave', 1.5], ['aframe', 2], ['cottage', 1], ['lighthouse', 0.3]] };
export function pkVernacularOf(fam, v){ const arch = PK_VERNACULAR[fam] || PK_VERNACULAR.shire; let tot = 0; for(const [, w] of arch) tot += w; let r = v*tot;
  for(const [k, w] of arch){ r -= w; if(r < 0) return k; } return arch[0][0]; }
// windows on a pitch of their own (a near building has many, not a few huge ones). By day each pane holds a little of
// the sky, more or less as its glass is angled (no two alike), with a sill catching the light and a lintel's shadow
// where it is large enough; by night lamplight, warm, a few rooms blue with a screen, whole floors dark
function pkWindows(x, x0, top, wd, ht, c, night, lit, R, px, kind){
  const pitch = Math.max(px(3), wd*0.11), cols = Math.max(1, Math.floor(wd/pitch) - 1), rows = Math.min(90, Math.max(1, Math.floor(ht/pitch) - 1)), cw = wd/(cols + 1), rh = ht/(rows + 1);
  if(ht < px(10)) return;
  const sky = pkMix(c.air || lit, PK_WHITE, 0.12), pane = pkMix(c.dark, PK_BLACK, 0.3), big = cw > px(5), lamp = k => k < 0.1 ? pkMix(c.glow2 || c.glow, [150, 180, 240], 0.6) : pkMix(c.glow, PK_WHITE, k*0.35);
  if(kind === 'ribbon'){ // a slab's ribbon windows: one long band per floor, the sky in it, mullions where near
    for(let r = 1; r <= rows; r++){ const on = night > 0.2 && R() < 0.55, y = top + r*rh, bh = rh*0.4;
      x.fillStyle = on ? pkCss(lamp(R()), 0.8*night) : pkCss(pkMix(pane, sky, 0.2 + 0.25*R()), 0.85); x.fillRect(x0 + cw*0.4, y, wd - cw*0.8, bh);
      if(big){ x.fillStyle = pkCss(c.lit, 0.55); x.fillRect(x0 + cw*0.4, y + bh, wd - cw*0.8, Math.max(px(0.4), bh*0.12)); x.fillStyle = pkCss(c.dark, 0.5); for(let k = 1; k <= cols; k++) x.fillRect(x0 + k*cw, y, Math.max(px(0.4), cw*0.06), bh); } } return; }
  if(kind === 'mullion'){ // a glass tower: the sky slid across it on a slant, spandrels at every floor, mullions
    const g = x.createLinearGradient(x0, top, x0 + wd, top + ht*0.6); g.addColorStop(0, pkCss(sky, 0.34)); g.addColorStop(0.45, pkCss(sky, 0.08)); g.addColorStop(0.7, pkCss(sky, 0.22)); g.addColorStop(1, pkCss(sky, 0.02));
    x.fillStyle = g; x.fillRect(x0, top, wd, ht);
    x.fillStyle = pkCss(c.dark, 0.32); for(let r = 1; r <= rows; r++) x.fillRect(x0, top + r*rh - rh*0.12, wd, Math.max(px(0.4), rh*0.14));
    x.strokeStyle = pkCss(c.dark, 0.45); x.lineWidth = Math.max(px(0.4), cw*0.08); x.beginPath(); for(let k = 1; k <= cols; k++){ x.moveTo(x0 + k*cw, top); x.lineTo(x0 + k*cw, top + ht); } x.stroke(); }
  if(night > 0.2 || kind === 'neon'){ const nk = Math.max(night, kind === 'neon' ? 0.5 : 0);
    for(let r = 1; r <= rows; r++){ const floorLit = R() < 0.6; for(let k = 1; k <= cols; k++){ const on = R() < (floorLit ? 0.5 : 0.12), v = R();
      if(on){ x.fillStyle = pkCss(lamp(v), 0.85*nk); x.fillRect(x0 + k*cw - cw*0.25, top + r*rh, cw*0.5, rh*0.45); if(big && v > 0.7){ x.fillStyle = pkCss(PK_BLACK, 0.25*nk); x.fillRect(x0 + k*cw - cw*0.25, top + r*rh, cw*0.5, rh*0.45*(0.2 + 0.5*R())); } }
      else if(kind !== 'mullion' && kind !== 'neon'){ x.fillStyle = pkCss(pane, 0.6); x.fillRect(x0 + k*cw - cw*0.22, top + r*rh, cw*0.44, rh*0.42); } } } }
  else if(kind !== 'mullion'){ const ww = cw*0.44, wh = rh*0.42;
    for(let r = 1; r <= rows; r++) for(let k = 1; k <= cols; k++){ const wx = x0 + k*cw - cw*0.22, wy = top + r*rh, ref = R();
      x.fillStyle = pkCss(pkMix(pane, sky, 0.12 + 0.4*ref*ref), 0.8); x.fillRect(wx, wy, ww, wh);
      if(big){ x.fillStyle = pkCss(pkMix(pane, sky, 0.45 + 0.3*ref), 0.5); x.fillRect(wx, wy, ww, wh*0.35); // the sky in its upper pane
        x.fillStyle = pkCss(c.lit, 0.7); x.fillRect(wx - ww*0.08, wy + wh, ww*1.16, Math.max(px(0.4), wh*0.1)); // its sill
        x.fillStyle = pkCss(c.dark, 0.35); x.fillRect(wx - ww*0.05, wy - Math.max(px(0.4), wh*0.08), ww*1.1, Math.max(px(0.4), wh*0.08)); } } } // its lintel's shadow
}
// a box: its face to you, shaded from the sky down to the ground, and its side toward the light catching it, with the
// shadow it casts
function pkBox(x, X, Y, top, wd, c, dep){
  // (its side shown is the one the view turns toward you, c.vside, where the caller gives a view; else the light's)
  const vs = c.vside || c.sd, w2 = wd/2, side = dep*vs*(c.vdep ?? 1);
  pkShade(x, [[X - w2, Y], [X - w2, top], [X + w2, top], [X + w2, Y]], c.body, top, Y, 0.13);
  pkShade(x, [[X + vs*w2, Y], [X + vs*w2, top], [X + vs*w2 + side, top + Math.abs(side)*0.3], [X + vs*w2 + side, Y]], vs === c.sd ? pkMix(c.body, c.lit, 0.55) : pkMix(c.body, c.dark, 0.45), top, Y, 0.16);
  return [X - w2, top, wd, Y - top];
}
// (kind0: the archetype, when the caller chose it to size the building; the draw that would have chosen it is still
//  taken, so every other feature keeps its stream)
// ---- THE WIDER KIT: each kind drawn at (X, Y), h tall and wd wide, in the caller's lit colours ----
// a gable roof over [x0, x1] from eave height ye up to the ridge yr; its lit slope toward the light
const pkGable = (x, x0, x1, ye, yr, c, over = 0.08) => { const w = x1 - x0, m = (x0 + x1)/2; pkPoly(x, [[x0 - w*over, ye], [m, yr], [x1 + w*over, ye]], pkCss(c.dark));
  pkPoly(x, c.sd > 0 ? [[m, yr], [x1 + w*over, ye], [m, ye]] : [[m, yr], [x0 - w*over, ye], [m, ye]], pkCss(pkMix(c.dark, c.body, 0.6))); };
// a strip (a sill, a coping, a course of brick) at least a hair thick
const pkBar = (x, x0, y0, w, t, col, px, a = 1) => { x.fillStyle = pkCss(col, a); x.fillRect(x0, y0, w, Math.max(px(0.4), t)); };
// a window in its frame (or a door's glazing, door true): the frame catching the light, the sky held in its upper panes by
// day, lamplight by night (not every room), its glazing bars where large enough
const pkFrame = (x, wx, wy, ww, wh, c, night, o, door = false) => { const px = o.px, fr = Math.max(px(0.4), ww*0.1), on = night > 0.2 && o.RW() < 0.7;
  x.fillStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.25), 0.9); x.fillRect(wx - fr, wy - fr, ww + fr*2, wh + fr*(door ? 1 : 2));
  if(on){ x.fillStyle = pkCss(pkMix(c.glow, PK_WHITE, 0.2*o.RW()), 0.9); x.fillRect(wx, wy, ww, wh); }
  else { const g = x.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, pkCss(pkMix(c.air || c.lit, PK_WHITE, 0.1), 0.85)); g.addColorStop(0.45, pkCss(pkMix(c.dark, PK_BLACK, 0.3), 0.9)); g.addColorStop(1, pkCss(pkMix(c.dark, PK_BLACK, 0.4), 0.95)); x.fillStyle = g; x.fillRect(wx, wy, ww, wh); }
  if(ww > px(5)){ x.fillStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.25), 0.9); x.fillRect(wx + ww/2 - fr*0.3, wy, fr*0.6, wh); if(!door) x.fillRect(wx, wy + wh*0.48, ww, fr*0.6); } };
const PK_BUILT = {
  cottage(x, X, Y, h, wd, c, night, lit, o){ // whitewashed or stone walls, a deep hump of thatch combed in lines, a chimney (smoke now
    // and then), small windows with their frames, a door under a little hood, flowers along its foot
    const ye = Y - h*0.42, w2 = wd/2, wall = pkMat(c, o.R() < 0.5 ? PK_CREAM : PK_STONE, 0.6), th = pkMat(c, PK_THATCH, 0.65); pkBox(x, X, Y, ye, wd, wall, o.dep*0.4);
    if(o.fine){ x.strokeStyle = pkCss(wall.dark, 0.25); x.lineWidth = Math.max(o.px(0.4), h*0.006); x.beginPath(); for(let k = 0; k < 9; k++){ const sx = X - w2 + wd*o.RD(), sy = Y - (Y - ye)*o.RD(); x.moveTo(sx, sy); x.lineTo(sx + wd*0.06, sy); } x.stroke(); }
    const roof = [[X - w2*1.15, ye + h*0.04], [X - w2*1.0, Y - h*0.74], [X - w2*0.6, Y - h*0.97], [X + w2*0.6, Y - h*0.97], [X + w2*1.0, Y - h*0.74], [X + w2*1.15, ye + h*0.04]];
    x.fillStyle = pkCss(th.dark); x.beginPath(); x.moveTo(...roof[0]); x.quadraticCurveTo(X - w2*1.05, Y - h*1.0, X, Y - h); x.quadraticCurveTo(X + w2*1.05, Y - h*1.0, ...roof[5]); x.fill();
    x.fillStyle = pkCss(th.body); x.beginPath(); x.moveTo(X, Y - h*0.98); x.quadraticCurveTo(X + c.sd*w2*0.95, Y - h*0.98, X + c.sd*w2*1.12, ye + h*0.02); x.lineTo(X - c.sd*w2*0.3, ye + h*0.02); x.quadraticCurveTo(X - c.sd*w2*0.4, Y - h*0.7, X, Y - h*0.98); x.fill();
    if(o.detail){ x.strokeStyle = pkCss(th.dark, 0.45); x.lineWidth = Math.max(o.px(0.4), wd*0.008); x.beginPath(); for(let k = 0; k < 16; k++){ const u = k/15 - 0.5; x.moveTo(X + u*wd*0.9, Y - h*(0.96 - Math.abs(u)*0.5)); x.lineTo(X + u*wd*1.12, ye + h*0.03); } x.stroke();
      pkBar(x, X - w2*1.12, ye + h*0.02, wd*1.24, h*0.025, th.dark, o.px, 0.7); }
    const ch = pkMat(c, PK_BRICK, 0.6), cx = X - c.sd*w2*0.55; pkShade(x, [[cx, Y - h*0.75], [cx, Y - h*1.08], [cx + wd*0.1, Y - h*1.08], [cx + wd*0.1, Y - h*0.75]], ch.body, Y - h*1.08, Y - h*0.75); pkBar(x, cx - wd*0.01, Y - h*1.1, wd*0.12, h*0.03, ch.dark, o.px);
    if(o.detail && o.R() < 0.45) for(let k = 0; k < 4; k++) pkDisc(x, cx + wd*0.05 + k*wd*0.06*c.sd*-1, Y - h*(1.18 + k*0.12), wd*(0.04 + k*0.025), pkCss(pkMix(c.lit, c.air || c.lit, 0.4), 0.35 - k*0.07));
    if(o.detail){ const door = pkMat(c, [[90, 60, 40], [60, 80, 70], [120, 50, 44]][Math.floor(o.R()*3)], 0.7), dx = X - w2*0.3, dh = (Y - ye)*0.72, dw = dh*0.45;
      pkShade(x, [[dx - dw/2, Y], [dx - dw/2, Y - dh], [dx + dw/2, Y - dh], [dx + dw/2, Y]], door.body, Y - dh, Y); pkPoly(x, [[dx - dw*0.75, Y - dh], [dx, Y - dh*1.2], [dx + dw*0.75, Y - dh]], pkCss(th.dark));
      for(const ux of [0.18, 0.62]) pkFrame(x, X - w2 + wd*ux, Y - (Y - ye)*0.72, wd*0.14, (Y - ye)*0.38, c, night, o);
      if(o.fine){ const fl = [[200, 70, 90], [230, 200, 80], [150, 110, 200], [240, 240, 230]]; for(let k = 0; k < 14; k++){ const fx = X - w2 + wd*o.RD(); if(Math.abs(fx - dx) < dw) continue; pkDisc(x, fx, Y - h*0.03*o.RD(), Math.max(o.px(0.5), wd*0.012), pkCss(pkMat(c, k % 3 ? [60, 100, 56] : fl[k % 4], 0.8).body)); } } } },
  aframe(x, X, Y, h, wd, c, night, lit, o){ // one tall triangle down to the ground, its gable glazed in a grid, a deck on posts, its roof's boards
    const w2 = wd/2, wood = pkMat(c, PK_WOOD, 0.55), roof = pkMat(c, PK_SLATE, 0.5);
    pkPoly(x, [[X - w2, Y], [X, Y - h], [X + w2, Y]], pkCss(roof.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2, Y], [X, Y]], pkCss(roof.body));
    pkShade(x, [[X - w2*0.78, Y], [X, Y - h*0.8], [X + w2*0.78, Y]], wood.body, Y - h*0.8, Y);
    pkPoly(x, [[X - w2*0.6, Y], [X, Y - h*0.62], [X + w2*0.6, Y]], pkCss(night > 0.2 ? pkMix(c.glow, c.dark, 0.3) : pkMix(c.air || lit, c.dark, 0.45)));
    if(o.detail){ x.strokeStyle = pkCss(wood.dark); x.lineWidth = Math.max(o.px(0.5), wd*0.015); x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.62);
      for(const v of [0.2, 0.38]){ const hw = w2*0.6*(1 - v/0.62); x.moveTo(X - hw, Y - h*v); x.lineTo(X + hw, Y - h*v); } for(const u of [-0.3, 0.3]){ x.moveTo(X + u*w2, Y); x.lineTo(X + u*w2*0.55, Y - h*0.28); } x.stroke();
      // a deck before it, on posts, its railing
      const dy = Y - h*0.08; pkBar(x, X - w2*1.0, dy, wd, h*0.02, wood.lit, o.px); x.strokeStyle = pkCss(wood.dark); x.lineWidth = Math.max(o.px(0.4), wd*0.01); x.beginPath(); for(let k = 0; k <= 8; k++){ const sx = X - w2 + wd*k/8; x.moveTo(sx, dy); x.lineTo(sx, dy - h*0.07); } x.moveTo(X - w2, dy - h*0.07); x.lineTo(X + w2, dy - h*0.07); x.stroke(); }
    if(o.fine){ x.strokeStyle = pkCss(roof.dark, 0.5); x.lineWidth = Math.max(o.px(0.4), wd*0.005); x.beginPath(); for(let k = 1; k < 8; k++){ const v = k/8; x.moveTo(X - w2*(1 - v), Y - h*v); x.lineTo(X - w2*(1 - v) + w2*0.12, Y - h*v); x.moveTo(X + w2*(1 - v), Y - h*v); x.lineTo(X + w2*(1 - v) - w2*0.12, Y - h*v); } x.stroke(); } },
  barn(x, X, Y, h, wd, c, night, lit, o){ // a gambrel roof over a box of upright boards, white-trimmed, big braced doors, a hay hood, a cupola
    const w2 = wd/2, ye = Y - h*0.45, red = pkMat(c, o.R() < 0.75 ? [150, 56, 44] : PK_GREYWOOD, 0.7), roof = pkMat(c, [o.R() < 0.5 ? 70 : 96, 70, 64], 0.55);
    pkShade(x, [[X - w2, Y], [X - w2, ye], [X + w2, ye], [X + w2, Y]], red.body, ye, Y, 0.16);
    if(o.detail){ x.fillStyle = pkCss(red.dark, 0.4); for(let k = 1; k < 18; k++) x.fillRect(X - w2 + wd*k/18, ye, Math.max(o.px(0.4), wd*0.004), Y - ye); }
    pkPoly(x, [[X - w2*1.06, ye], [X - w2*0.78, Y - h*0.82], [X, Y - h], [X + w2*0.78, Y - h*0.82], [X + w2*1.06, ye]], pkCss(roof.dark));
    pkPoly(x, [[X, Y - h], [X + c.sd*w2*0.78, Y - h*0.82], [X + c.sd*w2*1.06, ye], [X, ye]], pkCss(roof.body));
    if(o.detail){ const dw = wd*0.32, dh = h*0.32, tr = pkMat(c, PK_CREAM, 0.7); x.fillStyle = pkCss(red.dark); x.fillRect(X - dw/2, Y - dh, dw, dh); x.strokeStyle = pkCss(tr.body, 0.9); x.lineWidth = Math.max(o.px(0.5), wd*0.015);
      x.strokeRect(X - dw/2, Y - dh, dw, dh); x.beginPath(); x.moveTo(X, Y - dh); x.lineTo(X, Y); x.moveTo(X - dw/2, Y - dh); x.lineTo(X, Y); x.lineTo(X + dw/2, Y - dh); x.stroke();
      x.strokeRect(X - wd*0.07, Y - h*0.7, wd*0.14, h*0.13); pkBar(x, X - wd*0.04, Y - h*0.85, wd*0.08, h*0.12, roof.dark, o.px); // the loft door, its hay hood
      const cu = Y - h; pkShade(x, [[X - wd*0.05, cu + h*0.03], [X - wd*0.05, cu - h*0.07], [X + wd*0.05, cu - h*0.07], [X + wd*0.05, cu + h*0.03]], tr.body, cu - h*0.07, cu); pkPoly(x, [[X - wd*0.08, cu - h*0.07], [X, cu - h*0.13], [X + wd*0.08, cu - h*0.07]], pkCss(roof.dark));
      x.strokeStyle = pkCss(o.ink); x.lineWidth = Math.max(o.px(0.4), wd*0.006); x.beginPath(); x.moveTo(X, cu - h*0.13); x.lineTo(X, cu - h*0.2); x.moveTo(X - wd*0.04, cu - h*0.17); x.lineTo(X + wd*0.04, cu - h*0.17); x.stroke(); } },
  silo(x, X, Y, h, wd, c, night, lit, o){ // a cylinder of staves or steel, its hoops, a dome cap, a ladder in its cage up its side, rust streaking from the hoops
    const w2 = wd/2, t = Y - h + w2, m = pkMat(c, o.R() < 0.5 ? PK_STEEL : PK_CONCRETE, 0.55), tube = [[X - w2, Y], [X - w2, t], [X + w2, t], [X + w2, Y]];
    pkShade(x, tube, m.body, t, Y, 0.12); pkShade(x, [[X + c.sd*w2*0.15, Y], [X + c.sd*w2*0.15, t], [X + c.sd*w2*0.75, t], [X + c.sd*w2*0.75, Y]], m.lit, t, Y, 0.1);
    pkShade(x, [[X - c.sd*w2*0.55, Y], [X - c.sd*w2*0.55, t], [X - c.sd*w2, t], [X - c.sd*w2, Y]], m.dark, t, Y, 0.1);
    const cap = pkMat(c, [176, 180, 184], 0.6); x.fillStyle = pkCss(cap.body); x.beginPath(); x.arc(X, t, w2, Math.PI, 0); x.fill(); x.fillStyle = pkCss(cap.lit); x.beginPath(); x.arc(X + c.sd*w2*0.2, t, w2*0.6, Math.PI, 0); x.fill();
    if(o.detail){ x.fillStyle = pkCss(m.dark, 0.55); for(let q = 1; q < 9; q++) x.fillRect(X - w2, t + (Y - t)*q/9, wd, Math.max(o.px(0.5), h*0.005));
      x.strokeStyle = pkCss(o.ink, 0.8); x.lineWidth = Math.max(o.px(0.4), wd*0.015); x.beginPath(); const lx = X - c.sd*w2*0.25; x.moveTo(lx, Y); x.lineTo(lx, t - w2*0.7); x.moveTo(lx + wd*0.08, Y - h*0.1); x.lineTo(lx + wd*0.08, t - w2*0.6); x.stroke();
      pkStreaks(x, X - w2, t, wd, Y - t, { ...c, dark: PK_RUST }, o.RD, o.px, 0.25); } },
  windmill(x, X, Y, h, wd, c, night, lit, o){ // a tapered tower of tarred boards or white stone, a gallery, a boat-shaped cap, four sails of
    // lattice with cloth half-furled, a door and windows up its side
    const w2 = wd/2, bt = Y - h*0.62, tw = pkMat(c, o.R() < 0.5 ? [70, 66, 60] : PK_CREAM, 0.6), sail = pkMat(c, [226, 218, 200], 0.6);
    pkShade(x, [[X - w2, Y], [X - w2*0.55, bt], [X + w2*0.55, bt], [X + w2, Y]], tw.body, bt, Y); pkPoly(x, [[X, Y], [X, bt], [X + c.sd*w2*0.55, bt], [X + c.sd*w2, Y]], pkCss(tw.lit, 0.7));
    if(o.detail){ pkBar(x, X - w2*0.95, Y - h*0.22, wd*0.95, h*0.015, o.ink, o.px); pkFrame(x, X - wd*0.06, Y - h*0.12, wd*0.12, h*0.1, c, night, o, true); pkFrame(x, X - wd*0.04, Y - h*0.42, wd*0.08, h*0.06, c, night, o); }
    x.fillStyle = pkCss(tw.dark); x.beginPath(); x.ellipse(X, bt, w2*0.72, w2*0.42, 0, Math.PI, 0); x.fill();
    const hub = [X + c.sd*w2*0.2, bt - w2*0.12], ang = o.R()*Math.PI/2, L2 = h*0.4;
    for(let q = 0; q < 4; q++){ const a = ang + q*Math.PI/2, ca = Math.cos(a), sa = Math.sin(a), nx = -sa*L2*0.11, ny = ca*L2*0.11, P = (u, v) => [hub[0] + ca*L2*u + nx*v, hub[1] + sa*L2*u + ny*v];
      x.strokeStyle = pkCss(tw.dark); x.lineWidth = Math.max(o.px(0.5), L2*0.025); x.beginPath(); x.moveTo(...P(0, 0)); x.lineTo(...P(1, 0)); x.stroke();
      if(q % 2 && o.detail){ x.lineWidth = Math.max(o.px(0.3), L2*0.008); x.beginPath(); for(let k = 0; k <= 6; k++){ const u = 0.2 + 0.8*k/6; x.moveTo(...P(u, 0)); x.lineTo(...P(u, 1)); } x.moveTo(...P(0.2, 1)); x.lineTo(...P(1, 1)); x.stroke(); }
      else pkPoly(x, [P(0.2, 0), P(1, 0), P(1, 1), P(0.2, 1)], pkCss(q % 2 ? sail.dark : sail.body, 0.92)); }
    pkDisc(x, hub[0], hub[1], Math.max(o.px(0.6), w2*0.12), pkCss(tw.dark)); },
  stave(x, X, Y, h, wd, c, night, lit, o){ // a stave church: steep roofs stacked like a pine cone, dragon heads at the gables
    const w2 = wd/2, tar = pkMix(c.dark, [70, 44, 30], 0.4); pkBox(x, X, Y, Y - h*0.2, wd, { ...c, body: tar }, o.dep*0.3);
    for(let q = 0; q < 4; q++){ const u = q/4, w = w2*(1.1 - u*0.65), yb = Y - h*(0.2 + u*0.18), yt = Y - h*(0.36 + u*0.2); pkGable(x, X - w, X + w, yb, yt, { ...c, dark: tar }, 0.1);
      if(o.detail && q < 3) for(const s of [-1, 1]){ x.strokeStyle = pkCss(tar); x.lineWidth = Math.max(o.px(0.5), h*0.012); x.beginPath(); x.moveTo(X + s*w*0.5, yt + (yb - yt)*0.5); x.quadraticCurveTo(X + s*w*0.7, yt, X + s*w*0.85, yt + h*0.02); x.stroke(); } }
    x.fillStyle = pkCss(tar); x.fillRect(X - wd*0.03, Y - h, wd*0.06, h*0.25); },
  row(x, X, Y, h, wd, c, night, lit, o){ // a terrace: three to five narrow houses sharing their walls, each its own brick or paint, sash
    // windows with frames, a bay window now and then, steps to the door, chimney stacks with their pots
    const n = 3 + Math.floor(o.R()*3), hw = wd/n, M = [[150, 76, 58], [210, 196, 168], [150, 150, 146], [196, 120, 96], [110, 130, 150], [176, 168, 120]];
    for(let q = 0; q < n; q++){ const hx = X - wd/2 + hw*(q + 0.5), hh = h*(0.75 + 0.25*o.R()), wc = pkMat(c, M[Math.floor(o.R()*M.length)], 0.6), ye = Y - hh*0.75;
      pkShade(x, [[hx - hw/2, Y], [hx - hw/2, ye], [hx + hw/2, ye], [hx + hw/2, Y]], wc.body, ye, Y, 0.14); pkGable(x, hx - hw/2, hx + hw/2, ye, Y - hh, pkMat(c, PK_SLATE, 0.5), 0);
      const sx = hx + hw/2 - hw*0.08, st = pkMat(c, PK_BRICK, 0.6); pkShade(x, [[sx, Y - hh*0.86], [sx, Y - hh*1.04], [sx + hw*0.16, Y - hh*1.04], [sx + hw*0.16, Y - hh*0.86]], st.body, Y - hh*1.04, Y - hh*0.86);
      if(o.detail){ for(let k = 0; k < 3; k++) pkBar(x, sx + hw*(0.015 + k*0.05), Y - hh*1.09, hw*0.03, hh*0.05, PK_TERRA, o.px);
        const dx = hx - hw*0.22, dh = (Y - ye)*0.4; pkShade(x, [[dx - dh*0.22, Y - (Y - ye)*0.05], [dx - dh*0.22, Y - dh], [dx + dh*0.22, Y - dh], [dx + dh*0.22, Y - (Y - ye)*0.05]], pkMat(c, [[40, 50, 70], [110, 30, 34], [30, 70, 60]][q % 3], 0.7).body, Y - dh, Y);
        pkBar(x, dx - dh*0.32, Y - (Y - ye)*0.05, dh*0.64, (Y - ye)*0.05, wc.lit, o.px);
        const bay = o.R() < 0.4; for(let f = 1; f <= 2; f++){ if(bay && f === 1) { const by = Y - (Y - ye)*0.5; pkShade(x, [[hx - hw*0.02, Y - (Y - ye)*0.1], [hx - hw*0.02, by], [hx + hw*0.42, by], [hx + hw*0.42, Y - (Y - ye)*0.1]], wc.lit, by, Y); pkFrame(x, hx + hw*0.04, by + (Y - ye)*0.06, hw*0.32, (Y - ye)*0.28, c, night, o); continue; }
          pkFrame(x, hx + hw*0.05, Y - (Y - ye)*0.42*f - (Y - ye)*0.02, hw*0.28, (Y - ye)*0.24, c, night, o); } } } },
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
  castle(x, X, Y, h, wd, c, night, lit, o){ // a square keep of coursed stone, corner turrets corbelled out, merlons, arrow slits, a gate under
    // its arch with the portcullis down, a banner, moss at the foot
    const w2 = wd/2, kt = Y - h*0.82, st = pkMat(c, PK_STONE, 0.5); pkBox(x, X, Y, kt, wd*0.7, st, o.dep*0.5);
    for(const s of [-1, 1]){ pkShade(x, [[X + s*w2*0.35, Y], [X + s*w2*0.35, Y - h*0.95], [X + s*w2*0.62, Y - h*0.95], [X + s*w2*0.62, Y]], s === c.sd ? st.lit : st.body, Y - h, Y);
      for(let q = 0; q < 3; q++) pkBar(x, X + s*w2*0.35 + (s > 0 ? 0 : -w2*0.27) + q*w2*0.1 - w2*0.01*s, Y - h, w2*0.06, h*0.05, s === c.sd ? st.lit : st.body, o.px); }
    const mw = wd*0.06; for(let q = 0; q < 6; q++) pkBar(x, X - w2*0.35 + q*wd*0.12, kt - mw, mw, mw, st.body, o.px);
    if(o.detail){ x.fillStyle = pkCss(st.dark, 0.3); for(let k = 1; k < 14; k++) x.fillRect(X - w2*0.62, Y - h*0.95*k/14, wd*0.62, Math.max(o.px(0.4), h*0.003));
      x.fillStyle = pkCss(pkMix(st.dark, PK_BLACK, 0.4)); for(let q = 0; q < 3; q++) x.fillRect(X - wd*0.01 + (q - 1)*wd*0.15, kt + h*0.2, Math.max(o.px(0.5), wd*0.02), h*0.08);
      for(const s of [-1, 1]) x.fillRect(X + s*w2*0.48 - wd*0.008, Y - h*0.6, Math.max(o.px(0.5), wd*0.016), h*0.07);
      x.beginPath(); x.arc(X, Y - h*0.12, wd*0.07, Math.PI, 0); x.lineTo(X + wd*0.07, Y); x.lineTo(X - wd*0.07, Y); x.fill();
      x.strokeStyle = pkCss(PK_IRON, 0.9); x.lineWidth = Math.max(o.px(0.4), wd*0.006); x.beginPath(); for(let k = -2; k <= 2; k++){ x.moveTo(X + k*wd*0.025, Y - h*0.18); x.lineTo(X + k*wd*0.025, Y - h*0.04); } for(let k = 0; k < 4; k++){ x.moveTo(X - wd*0.065, Y - h*(0.17 - k*0.035)); x.lineTo(X + wd*0.065, Y - h*(0.17 - k*0.035)); } x.stroke();
      const fx = X + c.sd*w2*0.48, ft = Y - h; x.strokeStyle = pkCss(o.ink); x.beginPath(); x.moveTo(fx, ft); x.lineTo(fx, ft - h*0.18); x.stroke();
      const ban = pkMat(c, [[150, 40, 50], [40, 70, 130], [200, 160, 50]][Math.floor(o.R()*3)], 0.7); x.fillStyle = pkCss(ban.body); x.beginPath(); x.moveTo(fx, ft - h*0.18); x.quadraticCurveTo(fx + wd*0.1, ft - h*0.2, fx + wd*0.18, ft - h*0.16); x.lineTo(fx + wd*0.12, ft - h*0.14); x.quadraticCurveTo(fx + wd*0.08, ft - h*0.1, fx, ft - h*0.11); x.fill();
      if(o.fine) pkIvy(x, X - c.sd*w2*0.45, Y, h*0.35, wd*0.25, c, o.RD, o.px); } },
  lighthouse(x, X, Y, h, wd, c, night, lit, o){ // a tapered, banded tower, small windows up it, a gallery railed round the lantern, the
    // light alight (its beam across the air by night), the keeper's cottage at its foot
    const w2 = wd/2, gt = Y - h*0.82, wh = pkMat(c, [236, 232, 222], 0.6), red = pkMat(c, [176, 50, 46], 0.7);
    if(o.detail){ const kc = Y - h*0.12; pkBox(x, X - c.sd*wd*0.9, Y, kc, wd*0.9, wh, o.dep*0.2); pkGable(x, X - c.sd*wd*0.9 - wd*0.45, X - c.sd*wd*0.9 + wd*0.45, kc, kc - h*0.08, pkMat(c, [150, 60, 50], 0.6), 0.06); pkFrame(x, X - c.sd*wd*0.9 - wd*0.1, Y - h*0.09, wd*0.16, h*0.05, c, night, o); }
    pkShade(x, [[X - w2, Y], [X - w2*0.6, gt], [X + w2*0.6, gt], [X + w2, Y]], wh.body, gt, Y, 0.12); pkPoly(x, [[X, Y], [X, gt], [X + c.sd*w2*0.6, gt], [X + c.sd*w2, Y]], pkCss(wh.lit, 0.6));
    for(let q = 0; q < 3; q++){ const y0 = Y - h*0.82*(0.15 + q*0.3), y1 = y0 - h*0.1, k0 = 1 - 0.4*(Y - y0)/(Y - gt), k1 = 1 - 0.4*(Y - y1)/(Y - gt); pkPoly(x, [[X - w2*k0, y0], [X - w2*k1, y1], [X + w2*k1, y1], [X + w2*k0, y0]], pkCss(red.body)); pkPoly(x, [[X, y0], [X, y1], [X + c.sd*w2*k1, y1], [X + c.sd*w2*k0, y0]], pkCss(red.lit, 0.6)); }
    if(o.detail) for(let q = 0; q < 3; q++) pkBar(x, X - wd*0.03, Y - h*(0.3 + q*0.18), wd*0.06, h*0.04, night > 0.2 ? c.glow : o.ink, o.px, 0.85);
    x.fillStyle = pkCss(o.ink); x.fillRect(X - w2*0.8, gt - h*0.02, wd*0.8, h*0.02);
    if(o.detail){ x.strokeStyle = pkCss(o.ink); x.lineWidth = Math.max(o.px(0.4), wd*0.01); x.beginPath(); x.moveTo(X - w2*0.8, gt - h*0.05); x.lineTo(X + w2*0.8, gt - h*0.05); for(let k = 0; k <= 6; k++){ const sx = X - w2*0.8 + wd*0.8*k/6; x.moveTo(sx, gt - h*0.02); x.lineTo(sx, gt - h*0.05); } x.stroke(); }
    const lamp = pkMix(c.glow2 || c.glow, PK_WHITE, 0.4); pkPoly(x, [[X - w2*0.4, gt - h*0.02], [X - w2*0.4, gt - h*0.12], [X + w2*0.4, gt - h*0.12], [X + w2*0.4, gt - h*0.02]], pkCss(lamp));
    pkPoly(x, [[X - w2*0.5, gt - h*0.12], [X, Y - h], [X + w2*0.5, gt - h*0.12]], pkCss(o.ink)); pkGlow(x, X, gt - h*0.07, wd*(1.5 + 3*night), pkMix(c.glow2 || c.glow, PK_WHITE, 0.5), 0.5 + 0.4*night);
    if(night > 0.3){ x.save(); x.globalCompositeOperation = 'screen'; const dir = o.R() < 0.5 ? -1 : 1, by = gt - h*0.07, g = x.createLinearGradient(X, by, X + dir*h*1.6, by); g.addColorStop(0, pkCss(lamp, 0.4*night)); g.addColorStop(1, pkCss(lamp, 0)); x.fillStyle = g;
      x.beginPath(); x.moveTo(X, by - h*0.01); x.lineTo(X + dir*h*1.6, by - h*0.12); x.lineTo(X + dir*h*1.6, by + h*0.08); x.closePath(); x.fill(); x.restore(); } },
  cathedral(x, X, Y, h, wd, c, night, lit, o){ // a long nave under a steep roof, flying buttresses along it, lancet windows, two west towers
    // with their spires and belfry louvres, a rose window, a great door
    const w2 = wd/2, ne = Y - h*0.3, st = pkMat(c, [196, 186, 166], 0.45), roof = pkMat(c, [90, 110, 104], 0.5);
    pkBox(x, X + w2*0.2, Y, ne, wd*0.7, st, o.dep*0.3); pkGable(x, X - w2*0.15, X + w2*0.9, ne, Y - h*0.45, roof, 0.02);
    if(o.detail){ for(let k = 0; k < 6; k++){ const bx = X - w2*0.05 + wd*0.68*k/5; x.fillStyle = pkCss(night > 0.2 ? pkMix(c.glow, [120, 80, 200], 0.3) : st.dark, 0.85); x.beginPath(); x.moveTo(bx - wd*0.012, Y - h*0.06); x.lineTo(bx - wd*0.012, Y - h*0.2); x.lineTo(bx, Y - h*0.235); x.lineTo(bx + wd*0.012, Y - h*0.2); x.lineTo(bx + wd*0.012, Y - h*0.06); x.fill();
        if(k < 5){ const fx = bx + wd*0.068; x.strokeStyle = pkCss(st.body); x.lineWidth = Math.max(o.px(0.5), wd*0.012); x.beginPath(); x.moveTo(fx, Y); x.lineTo(fx, Y - h*0.18); x.quadraticCurveTo(fx, Y - h*0.27, fx - wd*0.03, Y - h*0.29); x.stroke(); pkPoly(x, [[fx - wd*0.008, Y - h*0.18], [fx, Y - h*0.24], [fx + wd*0.008, Y - h*0.18]], pkCss(st.lit)); } } }
    for(const s of [-0.65, -0.25]){ const tx = X + s*w2, tw = wd*0.13; pkShade(x, [[tx - tw, Y], [tx - tw, Y - h*0.58], [tx + tw, Y - h*0.58], [tx + tw, Y]], s < -0.4 ? st.body : st.lit, Y - h*0.58, Y); pkPoly(x, [[tx - tw*1.05, Y - h*0.58], [tx, Y - h], [tx + tw*1.05, Y - h*0.58]], pkCss(roof.dark)); pkPoly(x, [[tx, Y - h], [tx + c.sd*tw*1.05, Y - h*0.58], [tx, Y - h*0.58]], pkCss(roof.body));
      if(o.detail){ x.fillStyle = pkCss(pkMix(st.dark, PK_BLACK, 0.3)); x.fillRect(tx - tw*0.25, Y - h*0.5, tw*0.5, h*0.12); if(o.fine){ x.fillStyle = pkCss(st.lit, 0.6); for(let k = 1; k < 5; k++) x.fillRect(tx - tw*0.25, Y - h*0.5 + h*0.12*k/5, tw*0.5, Math.max(o.px(0.4), h*0.004)); }
        for(const sx of [-1, 1]) pkPoly(x, [[tx + sx*tw - wd*0.006, Y - h*0.58], [tx + sx*tw, Y - h*0.66], [tx + sx*tw + wd*0.006, Y - h*0.58]], pkCss(st.lit)); } }
    if(o.detail){ const rx = X - w2*0.45, ry = Y - h*0.32, rr = wd*0.055; pkDisc(x, rx, ry, rr*1.15, pkCss(st.dark)); pkDisc(x, rx, ry, rr, pkCss(night > 0.2 ? c.glow : pkMix(c.dark, [70, 60, 120], 0.4), 0.9));
      x.strokeStyle = pkCss(st.dark, 0.9); x.lineWidth = Math.max(o.px(0.4), rr*0.08); x.beginPath(); for(let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; x.moveTo(rx, ry); x.lineTo(rx + Math.cos(a)*rr, ry + Math.sin(a)*rr); } x.stroke();
      const dw = wd*0.08, dh = h*0.14; x.fillStyle = pkCss(o.ink); x.beginPath(); x.moveTo(rx - dw/2, Y); x.lineTo(rx - dw/2, Y - dh*0.7); x.quadraticCurveTo(rx - dw/2, Y - dh, rx, Y - dh*1.1); x.quadraticCurveTo(rx + dw/2, Y - dh, rx + dw/2, Y - dh*0.7); x.lineTo(rx + dw/2, Y); x.fill(); } },
  mosque(x, X, Y, h, wd, c, night, lit, o){ // a great dome over half-domes stepping down, needle minarets with balconies
    const w2 = wd/2, db = Y - h*0.42, dr = wd*0.24; pkBox(x, X, Y, Y - h*0.3, wd*0.8, c, o.dep*0.3);
    for(const s of [-1, 1]) { x.fillStyle = pkCss(c.body); x.beginPath(); x.arc(X + s*dr*1.1, Y - h*0.3, dr*0.55, Math.PI, 0); x.fill(); }
    x.fillStyle = pkCss(c.body); x.fillRect(X - dr, db, dr*2, Y - h*0.3 - db); x.beginPath(); x.arc(X, db, dr, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(c.lit); x.beginPath(); x.arc(X + c.sd*dr*0.25, db, dr*0.7, Math.PI, 0); x.fill(); x.fillRect(X - wd*0.006, db - dr - h*0.08, wd*0.012, h*0.08);
    for(const s of [-1, 1]){ const mx = X + s*w2*0.95, mw = Math.max(o.px(0.6), wd*0.03); pkPoly(x, [[mx - mw, Y], [mx - mw*0.7, Y - h*0.88], [mx + mw*0.7, Y - h*0.88], [mx + mw, Y]], pkCss(s === c.sd ? c.lit : c.body));
      pkPoly(x, [[mx - mw*0.8, Y - h*0.88], [mx, Y - h], [mx + mw*0.8, Y - h*0.88]], pkCss(c.dark)); if(o.detail) for(const b of [0.55, 0.75]) x.fillStyle = pkCss(c.dark), x.fillRect(mx - mw*1.6, Y - h*b, mw*3.2, Math.max(o.px(0.5), h*0.012)); } },
  clock(x, X, Y, h, wd, c, night, lit, o){ // a square shaft of stone, pilasters at its corners, a clock face with its hands and numerals,
    // a belfry with louvres, a steep spire
    const w2 = wd/2, ft = Y - h*0.62, st = pkMat(c, [190, 176, 150], 0.45); pkBox(x, X, Y, ft - wd*0.3, wd, st, o.dep*0.4); pkPoly(x, [[X - w2*1.05, ft - wd*0.3], [X, Y - h], [X + w2*1.05, ft - wd*0.3]], pkCss(pkMat(c, PK_SLATE, 0.5).dark));
    pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.05, ft - wd*0.3], [X, ft - wd*0.3]], pkCss(pkMat(c, PK_SLATE, 0.5).body));
    if(o.detail){ for(const s of [-1, 1]) pkBar(x, X + s*w2*0.85 - wd*0.05, ft - wd*0.3, wd*0.1, Y - ft + wd*0.3, s === c.sd ? st.lit : st.dark, o.px, 0.6);
      const by = ft - wd*0.28; x.fillStyle = pkCss(o.ink, 0.85); for(const s of [-0.22, 0.22]){ x.beginPath(); x.moveTo(X + s*wd - wd*0.1, by + wd*0.25); x.lineTo(X + s*wd - wd*0.1, by + wd*0.05); x.arc(X + s*wd, by + wd*0.05, wd*0.1, Math.PI, 0); x.lineTo(X + s*wd + wd*0.1, by + wd*0.25); x.fill(); }
      for(let k = 1; k < 6; k++) pkBar(x, X - w2*0.7, Y - (Y - ft)*k/6, wd*0.06, (Y - ft)*0.06, o.ink, o.px, 0.6); }
    const fy = ft + wd*0.15, fr = wd*0.32; pkDisc(x, X, fy, fr*1.12, pkCss(st.dark)); pkDisc(x, X, fy, fr, pkCss(night > 0.2 ? pkMix(c.glow, PK_WHITE, 0.4) : pkMix(c.lit, PK_WHITE, 0.4)));
    if(o.detail){ x.strokeStyle = pkCss(o.ink); x.lineWidth = Math.max(o.px(0.4), wd*0.025); x.beginPath(); const a1 = o.R()*Math.PI*2, a2 = o.R()*Math.PI*2; x.moveTo(X, fy); x.lineTo(X + Math.cos(a1)*fr*0.75, fy + Math.sin(a1)*fr*0.75); x.moveTo(X, fy); x.lineTo(X + Math.cos(a2)*fr*0.5, fy + Math.sin(a2)*fr*0.5); x.stroke();
      if(o.fine){ x.fillStyle = pkCss(o.ink, 0.8); for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; x.fillRect(X + Math.cos(a)*fr*0.85 - fr*0.02, fy + Math.sin(a)*fr*0.85 - fr*0.05, fr*0.04, fr*0.1); } } } },
  factory(x, X, Y, h, wd, c, night, lit, o){ // a saw-tooth shed of brick, its north lights glazed, tall chimneys banded, smoke from one, a tank
    const w2 = wd/2, st = Y - h*0.35, n = 4 + Math.floor(o.R()*3), br = pkMat(c, PK_BRICK, 0.55), roof = pkMat(c, PK_SLATE, 0.5);
    pkShade(x, [[X - w2, Y], [X - w2, st], [X + w2, st], [X + w2, Y]], br.body, st, Y, 0.15);
    if(o.detail){ for(let k = 0; k < n*2; k++) pkFrame(x, X - w2 + wd*(k + 0.25)/(n*2), Y - (Y - st)*0.75, wd*0.5/(n*2), (Y - st)*0.4, c, night, o); pkBar(x, X - w2, st, wd, (Y - st)*0.05, br.dark, o.px, 0.8); }
    for(let q = 0; q < n; q++){ const x0 = X - w2 + wd*q/n, x1 = x0 + wd/n; pkPoly(x, [[x0, st], [x1, st - h*0.12], [x1, st]], pkCss(roof.body)); pkPoly(x, [[x1 - wd/n*0.14, st - h*0.105], [x1, st - h*0.12], [x1, st], [x1 - wd/n*0.14, st]], pkCss(night > 0.2 ? pkMix(c.glow, PK_WHITE, 0.2) : pkMix(c.air || lit, c.dark, 0.3), night > 0.2 ? 0.8 : 0.9)); }
    const nc = 1 + Math.floor(o.R()*3); for(let q = 0; q < nc; q++){ const cx = X - w2*0.6 + q*wd*0.25, cw = Math.max(o.px(0.6), wd*0.04); pkShade(x, [[cx - cw, st], [cx - cw*0.7, Y - h], [cx + cw*0.7, Y - h], [cx + cw, st]], br.body, Y - h, st);
      if(o.detail){ x.fillStyle = pkCss(PK_WHITE, 0.45); x.fillRect(cx - cw*0.75, Y - h*0.92, cw*1.5, h*0.02); x.fillStyle = pkCss(br.dark); x.fillRect(cx - cw*0.8, Y - h*1.01, cw*1.6, h*0.02);
        if(q === 0) for(let k = 0; k < 5; k++) pkDisc(x, cx + c.sd*-1*k*wd*0.05, Y - h*(1.06 + k*0.06), wd*(0.03 + k*0.02), pkCss(pkMix(c.lit, c.air || c.lit, 0.5), 0.4 - k*0.06)); } } },
  watertower(x, X, Y, h, wd, c, night, lit, o){ // four legs braced in X's, a tank of staves bound in hoops, a cone roof, its ladder
    const w2 = wd/2, tb = Y - h*0.62, st = pkMat(c, PK_STEEL, 0.5), wood = pkMat(c, PK_GREYWOOD, 0.6); x.strokeStyle = pkCss(st.dark); x.lineWidth = Math.max(o.px(0.5), wd*0.04); x.beginPath(); for(const s of [-1, -0.35, 0.35, 1]){ x.moveTo(X + s*w2*0.7, Y); x.lineTo(X + s*w2*0.45, tb); } x.stroke();
    if(o.detail){ x.lineWidth = Math.max(o.px(0.4), wd*0.012); x.beginPath(); for(const [y0, y1] of [[Y, Y - h*0.3], [Y - h*0.3, tb]]){ const k0 = 0.7 - 0.25*(Y - y0)/(Y - tb), k1 = 0.7 - 0.25*(Y - y1)/(Y - tb); x.moveTo(X - w2*k0, y0); x.lineTo(X + w2*k1, y1); x.moveTo(X + w2*k0, y0); x.lineTo(X - w2*k1, y1); x.moveTo(X - w2*k1, y1); x.lineTo(X + w2*k1, y1); } x.stroke(); }
    pkShade(x, [[X - w2*0.6, tb], [X - w2*0.6, Y - h*0.88], [X + w2*0.6, Y - h*0.88], [X + w2*0.6, tb]], wood.body, Y - h*0.88, tb); pkPoly(x, [[X + c.sd*w2*0.1, tb], [X + c.sd*w2*0.1, Y - h*0.88], [X + c.sd*w2*0.6, Y - h*0.88], [X + c.sd*w2*0.6, tb]], pkCss(wood.lit, 0.6));
    if(o.detail){ x.fillStyle = pkCss(st.dark, 0.8); for(let k = 1; k < 5; k++) x.fillRect(X - w2*0.6, tb - (tb - Y + h*0.88)*k/5, wd*0.6, Math.max(o.px(0.4), h*0.006)); }
    pkPoly(x, [[X - w2*0.68, Y - h*0.88], [X, Y - h], [X + w2*0.68, Y - h*0.88]], pkCss(st.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*0.68, Y - h*0.88], [X, Y - h*0.88]], pkCss(st.body)); },
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
  observatory(x, X, Y, h, wd, c, night, lit, o){ // a drum, a white hemisphere ribbed, a dark slit open to the sky, the telescope's tube in it
    const w2 = wd/2, db = Y - h + w2*0.9; pkBox(x, X, Y, db, wd, c, o.dep*0.3);
    x.fillStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.25)); x.beginPath(); x.ellipse(X, db, w2, w2*0.9, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(c.body); x.beginPath(); x.ellipse(X - c.sd*w2*0.3, db, w2*0.65, w2*0.85, 0, Math.PI, 0); x.fill();
    if(o.detail){ x.strokeStyle = pkCss(c.dark, 0.35); x.lineWidth = Math.max(o.px(0.4), wd*0.006); x.beginPath(); for(let k = 1; k < 4; k++){ x.ellipse(X, db, w2, w2*0.9*k/4, 0, Math.PI, 0); } x.stroke(); pkBar(x, X - w2, db, wd, h*0.02, c.dark, o.px, 0.6); pkFrame(x, X - wd*0.08, Y - (Y - db)*0.55, wd*0.16, (Y - db)*0.5, c, night, o, true); }
    x.fillStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.4)); x.fillRect(X - w2*0.08, db - w2*0.88, w2*0.16, w2*0.88);
    if(o.detail){ x.strokeStyle = pkCss(c.lit); x.lineWidth = Math.max(o.px(0.5), w2*0.06); x.beginPath(); x.moveTo(X, db - w2*0.3); x.lineTo(X + w2*0.05, db - w2*0.8); x.stroke(); } },
  turbine(x, X, Y, h, wd, c, night, lit, o){ // a white stalk, a nacelle, three long blades
    const hub = [X, Y - h*0.62], bl = h*0.38, sw = Math.max(o.px(0.6), h*0.012), white = pkMix(c.lit, PK_WHITE, 0.4);
    pkPoly(x, [[X - sw*1.5, Y], [X - sw*0.7, hub[1]], [X + sw*0.7, hub[1]], [X + sw*1.5, Y]], pkCss(white)); const a0 = o.R()*Math.PI*2;
    for(let q = 0; q < 3; q++){ const a = a0 + q*Math.PI*2/3, ex = hub[0] + Math.cos(a)*bl, ey = hub[1] + Math.sin(a)*bl, nx = -Math.sin(a)*sw*1.6, ny = Math.cos(a)*sw*1.6; pkPoly(x, [[hub[0] + nx, hub[1] + ny], [ex, ey], [hub[0] - nx*0.3, hub[1] - ny*0.3]], pkCss(white)); }
    pkEll(x, hub[0], hub[1], sw*2.4, sw*1.3, pkCss(c.body)); if(night > 0.2) pkDisc(x, hub[0], hub[1] - sw*1.5, sw, pkCss([255, 70, 60], 0.9)); },
  // ---- the vernacular (docs/prior-art/ringworld-sprites.md, Part C: each settlement builds in one tradition) ----
  yurt(x, X, Y, h, wd, c, night, lit, o){ // a ger: a low white drum, a shallow cone of a roof, its crown ring, bands round it, a painted door
    const w2 = wd/2, felt = pkMat(c, [234, 228, 214], 0.6), ye = Y - h*0.6; pkShade(x, [[X - w2, Y], [X - w2, ye], [X + w2, ye], [X + w2, Y]], felt.body, ye, Y, 0.18);
    pkPoly(x, [[X - w2*1.04, ye], [X - w2*0.15, Y - h], [X + w2*0.15, Y - h], [X + w2*1.04, ye]], pkCss(felt.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*0.15, Y - h], [X + c.sd*w2*1.04, ye], [X, ye]], pkCss(felt.lit));
    if(o.detail){ for(const v of [0.25, 0.45]) pkBar(x, X - w2, Y - h*v, wd, h*0.02, pkMat(c, [120, 60, 50], 0.7).body, o.px); pkBar(x, X - w2*0.15, Y - h*1.02, w2*0.3, h*0.03, PK_IRON, o.px);
      const door = pkMat(c, [200, 110, 40], 0.75); pkShade(x, [[X - wd*0.07, Y], [X - wd*0.07, Y - h*0.45], [X + wd*0.07, Y - h*0.45], [X + wd*0.07, Y]], door.body, Y - h*0.45, Y); if(o.fine){ x.strokeStyle = pkCss(door.lit); x.lineWidth = Math.max(o.px(0.3), wd*0.006); x.strokeRect(X - wd*0.05, Y - h*0.42, wd*0.1, h*0.38); } } },
  rondavel(x, X, Y, h, wd, c, night, lit, o){ // a rondavel: a drum of earth painted in a band of patterns, a cone of thatch with its fringe
    const w2 = wd/2, wall = pkMat(c, [196, 160, 120], 0.6), th = pkMat(c, PK_THATCH, 0.65), ye = Y - h*0.45; pkShade(x, [[X - w2*0.9, Y], [X - w2*0.9, ye], [X + w2*0.9, ye], [X + w2*0.9, Y]], wall.body, ye, Y, 0.2);
    if(o.detail){ const P = [[60, 50, 46], [230, 226, 216], [170, 70, 50]]; for(let k = 0; k < 10; k++) pkPoly(x, [[X - w2*0.9 + wd*0.9*k/10, Y - h*0.12], [X - w2*0.9 + wd*0.9*(k + 0.5)/10, Y - h*0.22], [X - w2*0.9 + wd*0.9*(k + 1)/10, Y - h*0.12]], pkCss(pkMat(c, P[k % 3], 0.7).body)); pkShade(x, [[X - wd*0.08, Y], [X - wd*0.08, Y - h*0.33], [X + wd*0.08, Y - h*0.33], [X + wd*0.08, Y]], o.ink, Y - h*0.33, Y); }
    pkPoly(x, [[X - w2*1.15, ye + h*0.04], [X, Y - h], [X + w2*1.15, ye + h*0.04]], pkCss(th.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.15, ye + h*0.04], [X, ye]], pkCss(th.body));
    if(o.detail){ x.strokeStyle = pkCss(th.dark, 0.6); x.lineWidth = Math.max(o.px(0.3), wd*0.006); x.beginPath(); for(let k = 0; k < 16; k++){ const u = k/15 - 0.5; x.moveTo(X + u*wd*0.3, Y - h*0.9); x.lineTo(X + u*wd*1.15, ye + h*0.06); } x.stroke(); } },
  trullo(x, X, Y, h, wd, c, night, lit, o){ // trulli: whitewashed drums under grey stone cones coursed in rings, a pinnacle on each, a white sign painted on one
    const n = 2 + Math.floor(o.R()*3), uw = wd/n, wh = pkMat(c, [238, 234, 224], 0.55), st = pkMat(c, [140, 138, 132], 0.6);
    for(let k = 0; k < n; k++){ const cx = X - wd/2 + uw*(k + 0.5), hh = h*(0.8 + 0.2*o.R()), ye = Y - hh*0.42; pkShade(x, [[cx - uw*0.5, Y], [cx - uw*0.5, ye], [cx + uw*0.5, ye], [cx + uw*0.5, Y]], wh.body, ye, Y, 0.15);
      pkPoly(x, [[cx - uw*0.48, ye], [cx - uw*0.1, Y - hh*0.95], [cx + uw*0.1, Y - hh*0.95], [cx + uw*0.48, ye]], pkCss(st.dark)); pkPoly(x, [[cx, Y - hh*0.95], [cx + c.sd*uw*0.1, Y - hh*0.95], [cx + c.sd*uw*0.48, ye], [cx, ye]], pkCss(st.body));
      if(o.detail){ x.fillStyle = pkCss(st.dark, 0.6); for(let q = 1; q < 6; q++){ const v = q/6, hw = uw*0.48*(1 - v*0.8); x.fillRect(cx - hw, ye - (ye - Y + hh*0.95)*v, hw*2, Math.max(o.px(0.3), hh*0.006)); }
        pkDisc(x, cx, Y - hh, uw*0.06, pkCss(wh.lit)); if(k === 0 && o.fine){ x.strokeStyle = pkCss(PK_WHITE, 0.85); x.lineWidth = Math.max(o.px(0.4), uw*0.02); x.beginPath(); x.arc(cx, Y - hh*0.7, uw*0.06, 0, Math.PI*2); x.moveTo(cx, Y - hh*0.76); x.lineTo(cx, Y - hh*0.64); x.stroke(); }
        if(k === Math.floor(n/2)) pkShade(x, [[cx - uw*0.1, Y], [cx - uw*0.1, Y - hh*0.3], [cx + uw*0.1, Y - hh*0.3], [cx + uw*0.1, Y]], o.ink, Y - hh*0.3, Y); } } },
  horreo(x, X, Y, h, wd, c, night, lit, o){ // a hórreo: a granary of slatted wood raised on stone pillars, each capped with a flat stone against the rats; a pyramid roof
    const w2 = wd/2, st = pkMat(c, PK_STONE, 0.65), wood = pkMat(c, PK_WOOD, 0.6), py = Y - h*0.35, by = Y - h*0.75;
    for(const s of [-0.38, 0.38]){ pkShade(x, [[X + s*wd - wd*0.05, Y], [X + s*wd - wd*0.05, py], [X + s*wd + wd*0.05, py], [X + s*wd + wd*0.05, Y]], st.body, py, Y); pkEll(x, X + s*wd, py, wd*0.1, h*0.03, pkCss(st.lit)); }
    pkShade(x, [[X - w2*0.9, py - h*0.02], [X - w2*0.9, by], [X + w2*0.9, by], [X + w2*0.9, py - h*0.02]], wood.body, by, py, 0.2);
    if(o.detail){ x.fillStyle = pkCss(wood.dark, 0.6); for(let k = 1; k < 12; k++) x.fillRect(X - w2*0.9 + wd*0.9*k/12, by, Math.max(o.px(0.3), wd*0.006), py - by); }
    pkPoly(x, [[X - w2*1.08, by], [X, Y - h], [X + w2*1.08, by]], pkCss(pkMat(c, PK_TERRA, 0.65).dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.08, by], [X, by]], pkCss(pkMat(c, PK_TERRA, 0.65).body)); pkDisc(x, X, Y - h, wd*0.03, pkCss(st.lit)); },
  pueblo(x, X, Y, h, wd, c, night, lit, o){ // a pueblo: blocks of adobe set back as they rise, beam ends standing out in rows, small dark doors, ladders above the roofs
    const ad = pkMat(c, [198, 150, 110], 0.6), n = 2 + Math.floor(o.R()*2); for(let k = 0; k < n; k++){ const u = k/n, w = wd*(1 - u*0.4), x0 = X - wd/2 + wd*u*0.25, y0 = Y - h*u, hh = h/n;
      pkShade(x, [[x0, y0], [x0, y0 - hh], [x0 + w, y0 - hh], [x0 + w, y0]], ad.body, y0 - hh, y0, 0.18); pkBar(x, x0, y0 - hh, w, hh*0.06, ad.lit, o.px, 0.8);
      if(o.detail){ for(let q = 0; q < Math.floor(w/(hh*0.4)); q++) pkBar(x, x0 + hh*0.2 + q*hh*0.4, y0 - hh*0.85, hh*0.06, hh*0.06, pkMat(c, PK_WOOD, 0.6).dark, o.px); for(let q = 0; q < 2; q++){ const dx = x0 + w*(0.25 + 0.4*q); pkShade(x, [[dx, y0], [dx, y0 - hh*0.5], [dx + hh*0.25, y0 - hh*0.5], [dx + hh*0.25, y0]], o.ink, y0 - hh*0.5, y0); }
        if(k && o.R() < 0.7){ const lx = x0 + w*0.7; x.strokeStyle = pkCss(pkMat(c, PK_WOOD, 0.6).body); x.lineWidth = Math.max(o.px(0.3), hh*0.03); x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx + hh*0.1, y0 - hh*1.35); x.moveTo(lx + hh*0.3, y0); x.lineTo(lx + hh*0.4, y0 - hh*1.35); for(let q = 1; q < 6; q++){ x.moveTo(lx + q*hh*0.02, y0 - hh*0.22*q); x.lineTo(lx + hh*0.3 + q*hh*0.02, y0 - hh*0.22*q); } x.stroke(); } } } },
  machiya(x, X, Y, h, wd, c, night, lit, o){ // a machiya: a narrow two-storey townhouse, tiled eaves at each floor, lattice on the ground floor, a shop curtain
    const w2 = wd/2, wood = pkMat(c, [86, 60, 44], 0.6), tile = pkMat(c, [70, 74, 80], 0.6), f1 = Y - h*0.45; pkShade(x, [[X - w2, Y], [X - w2, Y - h*0.85], [X + w2, Y - h*0.85], [X + w2, Y]], wood.body, Y - h, Y, 0.15);
    for(const [ey, ew] of [[f1, 1.1], [Y - h*0.85, 1.15]]){ pkPoly(x, [[X - w2*ew, ey], [X - w2, ey - h*0.1], [X + w2, ey - h*0.1], [X + w2*ew, ey]], pkCss(tile.dark)); pkBar(x, X - w2*ew, ey - h*0.02, wd*ew, h*0.02, tile.lit, o.px, 0.7); }
    pkPoly(x, [[X - w2*1.15, Y - h*0.85], [X, Y - h], [X + w2*1.15, Y - h*0.85]], pkCss(tile.body));
    if(o.detail){ x.fillStyle = pkCss(wood.lit, 0.7); for(let k = 0; k < 14; k++) x.fillRect(X - w2*0.9 + wd*0.9*k/14, Y - h*0.4, Math.max(o.px(0.3), wd*0.012), h*0.38); pkFrame(x, X - w2*0.6, Y - h*0.72, wd*0.6, h*0.16, c, night, o);
      const cu = pkMat(c, [[40, 50, 90], [150, 40, 40], [220, 210, 190]][Math.floor(o.R()*3)], 0.7); pkBar(x, X + w2*0.1, Y - h*0.38, w2*0.7, h*0.12, cu.body, o.px); if(night > 0.2) pkGlow(x, X + w2*0.4, Y - h*0.3, wd*0.5, c.glow, 0.3*night); } },
  chapel(x, X, Y, h, wd, c, night, lit, o){ // a village chapel: a white gable box, an arched door, a small open bell-cote on its ridge, a cross; graves beside it
    const w2 = wd/2, wh = pkMat(c, [236, 232, 220], 0.55), roof = pkMat(c, PK_SLATE, 0.55), ye = Y - h*0.45; pkBox(x, X, Y, ye, wd, wh, o.dep*0.4); pkGable(x, X - w2, X + w2, ye, Y - h*0.72, roof, 0.06);
    const bx = X; pkShade(x, [[bx - wd*0.08, Y - h*0.7], [bx - wd*0.08, Y - h*0.88], [bx + wd*0.08, Y - h*0.88], [bx + wd*0.08, Y - h*0.7]], wh.body, Y - h*0.88, Y - h*0.7); pkDisc(x, bx, Y - h*0.8, wd*0.035, pkCss(pkMat(c, [160, 120, 60], 0.7).body));
    pkPoly(x, [[bx - wd*0.11, Y - h*0.88], [bx, Y - h*0.94], [bx + wd*0.11, Y - h*0.88]], pkCss(roof.dark)); x.strokeStyle = pkCss(o.ink); x.lineWidth = Math.max(o.px(0.4), wd*0.015); x.beginPath(); x.moveTo(bx, Y - h*0.94); x.lineTo(bx, Y - h); x.moveTo(bx - wd*0.03, Y - h*0.975); x.lineTo(bx + wd*0.03, Y - h*0.975); x.stroke();
    if(o.detail){ const dh = (Y - ye)*0.6, dw = wd*0.14; x.fillStyle = pkCss(pkMat(c, [80, 50, 36], 0.7).body); x.beginPath(); x.moveTo(X - dw/2, Y); x.lineTo(X - dw/2, Y - dh + dw/2); x.arc(X, Y - dh + dw/2, dw/2, Math.PI, 0); x.lineTo(X + dw/2, Y); x.fill();
      for(const s of [-1, 1]) pkFrame(x, X + s*w2*0.55 - wd*0.04, Y - (Y - ye)*0.8, wd*0.08, (Y - ye)*0.45, c, night, o);
      for(let k = 0; k < 4; k++){ const gx = X + w2*(1.2 + k*0.22), gh = h*0.08; x.strokeStyle = pkCss(pkMat(c, PK_STONE, 0.7).body); x.lineWidth = Math.max(o.px(0.4), wd*0.015); x.beginPath(); x.moveTo(gx, Y); x.lineTo(gx, Y - gh); x.moveTo(gx - gh*0.3, Y - gh*0.7); x.lineTo(gx + gh*0.3, Y - gh*0.7); x.stroke(); } } },
  gasstation(x, X, Y, h, wd, c, night, lit, o){ // a filling station: a thin flat canopy on its columns, a coloured fascia, pumps beneath, a tall price sign, the shop
    const ca = Y - h*0.82, w2 = wd/2, fas = pkMat(c, [[200, 50, 40], [40, 90, 160], [230, 180, 40], [40, 130, 90]][Math.floor(o.R()*4)], 0.7), wh = pkMat(c, [232, 232, 230], 0.55);
    pkBox(x, X + w2*0.55, Y, Y - h*0.6, wd*0.4, wh, o.dep*0.3); if(o.detail) pkFrame(x, X + w2*0.4, Y - h*0.45, wd*0.25, h*0.35, c, night, o, true);
    for(const s of [-0.65, -0.05]) pkShade(x, [[X + s*w2 - wd*0.012, Y], [X + s*w2 - wd*0.012, ca], [X + s*w2 + wd*0.012, ca], [X + s*w2 + wd*0.012, Y]], wh.body, ca, Y);
    pkShade(x, [[X - w2*0.85, ca], [X - w2*0.85, ca - h*0.1], [X + w2*0.15, ca - h*0.1], [X + w2*0.15, ca]], wh.body, ca - h*0.1, ca); pkBar(x, X - w2*0.85, ca - h*0.08, wd*0.5, h*0.05, fas.body, o.px);
    if(night > 0.2){ pkBar(x, X - w2*0.85, ca, wd*0.5, h*0.015, pkMix(c.glow, PK_WHITE, 0.7), o.px); pkGlow(x, X - w2*0.35, Y - h*0.2, wd*0.4, pkMix(c.glow, PK_WHITE, 0.6), 0.4*night); }
    for(const s of [-0.45, -0.25]) pkShade(x, [[X + s*wd - wd*0.025, Y], [X + s*wd - wd*0.025, Y - h*0.3], [X + s*wd + wd*0.025, Y - h*0.3], [X + s*wd + wd*0.025, Y]], fas.body, Y - h*0.3, Y);
    const sx = X - w2*1.05; x.fillStyle = pkCss(PK_IRON); x.fillRect(sx - wd*0.01, Y - h, wd*0.02, h); pkShade(x, [[sx - wd*0.07, Y - h*0.75], [sx - wd*0.07, Y - h*1.05], [sx + wd*0.07, Y - h*1.05], [sx + wd*0.07, Y - h*0.75]], fas.body, Y - h*1.05, Y - h*0.75);
    if(o.detail) for(let k = 0; k < 3; k++) pkBar(x, sx - wd*0.055, Y - h*(0.98 - k*0.07), wd*0.11, h*0.045, night > 0.2 ? pkMix(c.glow, PK_WHITE, 0.4) : [30, 30, 34], o.px, 0.9); },
  motel(x, X, Y, h, wd, c, night, lit, o){ // a motel: a long low bar of rooms, door and window, door and window, a walkway, its tall arrow sign
    const w2 = wd/2, wall = pkMat(c, [[220, 200, 170], [200, 220, 214], [230, 214, 200]][Math.floor(o.R()*3)], 0.6), roof = pkMat(c, [150, 70, 50], 0.6), ye = Y - h*0.6;
    pkBox(x, X, Y, ye, wd, wall, o.dep*0.2); pkPoly(x, [[X - w2*1.03, ye], [X - w2, ye - h*0.12], [X + w2, ye - h*0.12], [X + w2*1.03, ye]], pkCss(roof.body));
    if(o.detail){ const n = Math.max(3, Math.floor(wd/(h*0.5))); for(let k = 0; k < n; k++){ const ux = X - w2 + wd*(k + 0.15)/n, uw = wd/n; pkShade(x, [[ux, Y], [ux, Y - h*0.42], [ux + uw*0.22, Y - h*0.42], [ux + uw*0.22, Y]], pkMat(c, [[60, 100, 140], [150, 60, 60], [60, 120, 90]][k % 3], 0.7).body, Y - h*0.42, Y);
      pkFrame(x, ux + uw*0.38, Y - h*0.38, uw*0.42, h*0.2, c, night, o); } }
    const sx = X + w2*1.12, st = pkMat(c, [230, 60, 70], 0.7); x.fillStyle = pkCss(PK_IRON); x.fillRect(sx - wd*0.005, Y - h*1.4, wd*0.01, h*1.4);
    pkPoly(x, [[sx - wd*0.08, Y - h*1.45], [sx + wd*0.08, Y - h*1.45], [sx + wd*0.08, Y - h*1.05], [sx - wd*0.08, Y - h*1.05]], pkCss(night > 0.2 ? pkMix(st.body, PK_WHITE, 0.2) : st.body));
    pkType(x, 'MOTEL', sx, Y - h*1.2, h*0.12, wd*0.15, PK_WHITE, o.px); pkType(x, 'VACANCY', sx, Y - h*1.1, h*0.05, wd*0.15, night > 0.2 ? [140, 255, 190] : [210, 210, 200], o.px);
    if(night > 0.2) pkGlow(x, sx, Y - h*1.25, h*0.6, st.body, 0.45*night); },
  greenhouse(x, X, Y, h, wd, c, night, lit, o){ // a greenhouse: a gabled frame of glass, a pale grid, green showing through
    const w2 = wd/2, ye = Y - h*0.6, gl = pkMix(c.air || lit, PK_WHITE, 0.25); pkPoly(x, [[X - w2, Y], [X - w2, ye], [X, Y - h], [X + w2, ye], [X + w2, Y]], pkCss(gl, 0.45)); pkEll(x, X, Y - h*0.12, w2*0.9, h*0.12, pkCss(pkMat(c, [60, 120, 70], 0.75).body, 0.8));
    const g = x.createLinearGradient(X - w2, Y - h, X + w2, Y); g.addColorStop(0, pkCss(PK_WHITE, 0.35)); g.addColorStop(0.5, pkCss(PK_WHITE, 0.02)); g.addColorStop(1, pkCss(PK_WHITE, 0.2)); pkPoly(x, [[X - w2, Y], [X - w2, ye], [X, Y - h], [X + w2, ye], [X + w2, Y]], g);
    x.strokeStyle = pkCss(pkMix(lit, PK_WHITE, 0.4), 0.85); x.lineWidth = Math.max(o.px(0.3), wd*0.008); x.beginPath(); for(let k = 0; k <= 10; k++){ const u = X - w2 + wd*k/10; x.moveTo(u, Y); x.lineTo(u, ye - (1 - Math.abs(k/10 - 0.5)*2)*(h*0.4)); } x.moveTo(X - w2, ye); x.lineTo(X, Y - h); x.lineTo(X + w2, ye); x.moveTo(X - w2, Y - h*0.3); x.lineTo(X + w2, Y - h*0.3); x.stroke();
    if(night > 0.2) pkGlow(x, X, Y - h*0.4, wd*0.6, pkMix(c.glow, [255, 120, 200], 0.4), 0.3*night); },
  radiomast(x, X, Y, h, wd, c, night, lit, o){ // a guyed mast: a hair-thin lattice banded red and white, its guy wires fanning to the ground, its warning lights
    const red = pkMat(c, [200, 50, 40], 0.7), wh = pkMat(c, [236, 236, 232], 0.5), mw = Math.max(o.px(0.5), wd*0.15);
    for(let k = 0; k < 7; k++) x.fillStyle = pkCss(k % 2 ? wh.body : red.body), x.fillRect(X - mw/2, Y - h*(k + 1)/7, mw, h/7);
    x.strokeStyle = pkCss(PK_BLACK, 0.3); x.lineWidth = Math.max(o.px(0.3), wd*0.01); x.beginPath(); for(const v of [0.35, 0.65, 0.95]) for(const s of [-1, 1]){ x.moveTo(X, Y - h*v); x.lineTo(X + s*h*0.35*v, Y); } x.stroke();
    for(const v of [0.5, 1]) pkDisc(x, X, Y - h*v, Math.max(o.px(0.6), mw*0.6), pkCss([255, 60, 50], night > 0.2 ? 1 : 0.5)); if(night > 0.2) pkGlow(x, X, Y - h, h*0.06, [255, 60, 50], 0.6); },
  oast(x, X, Y, h, wd, c, night, lit, o){ // an oast house: round kilns of brick with steep cones, each topped by a white cowl and its vane, a long barn beside
    const br = pkMat(c, PK_BRICK, 0.6), roof = pkMat(c, [120, 70, 56], 0.6), wh = pkMat(c, [240, 238, 230], 0.5), w2 = wd/2;
    pkBox(x, X + w2*0.35, Y, Y - h*0.38, wd*0.6, pkMat(c, [210, 200, 180], 0.6), o.dep*0.3); pkGable(x, X + w2*0.05, X + w2*0.95, Y - h*0.38, Y - h*0.55, roof, 0.04);
    for(let k = 0, n = 1 + Math.floor(o.R()*2); k < n; k++){ const kx = X - w2*0.55 + k*wd*0.22, kw = wd*0.11, ky = Y - h*0.4; pkShade(x, [[kx - kw, Y], [kx - kw, ky], [kx + kw, ky], [kx + kw, Y]], br.body, ky, Y);
      pkPoly(x, [[kx - kw*1.05, ky], [kx, Y - h*0.88], [kx + kw*1.05, ky]], pkCss(roof.dark)); pkPoly(x, [[kx, Y - h*0.88], [kx + c.sd*kw*1.05, ky], [kx, ky]], pkCss(roof.body));
      pkPoly(x, [[kx - kw*0.3, Y - h*0.86], [kx - kw*0.3, Y - h*0.95], [kx, Y - h*1.0], [kx + kw*0.5, Y - h*0.96], [kx + kw*0.3, Y - h*0.86]], pkCss(wh.body)); pkPoly(x, [[kx + kw*0.3, Y - h*0.96], [kx + kw*0.7, Y - h*0.98], [kx + kw*0.3, Y - h*0.92]], pkCss(wh.lit)); } },
  dovecote(x, X, Y, h, wd, c, night, lit, o){ // a round dovecote: a tower with a ledge round it, a cone roof, clusters of small round holes, a bird or two
    const st = pkMat(c, [210, 196, 170], 0.6), w2 = wd/2, ye = Y - h*0.7; pkShade(x, [[X - w2, Y], [X - w2, ye], [X + w2, ye], [X + w2, Y]], st.body, ye, Y, 0.18); pkPoly(x, [[X + c.sd*w2*0.2, Y], [X + c.sd*w2*0.2, ye], [X + c.sd*w2*0.75, ye], [X + c.sd*w2*0.75, Y]], pkCss(st.lit, 0.5));
    pkBar(x, X - w2*1.06, Y - h*0.42, wd*1.06, h*0.025, st.lit, o.px); pkPoly(x, [[X - w2*1.1, ye], [X, Y - h], [X + w2*1.1, ye]], pkCss(pkMat(c, PK_TERRA, 0.65).dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.1, ye], [X, ye]], pkCss(pkMat(c, PK_TERRA, 0.65).body));
    if(o.detail){ for(let r = 0; r < 3; r++) for(let k = 0; k < 4; k++) pkDisc(x, X - w2*0.45 + k*w2*0.3 + (r % 2)*w2*0.15, Y - h*(0.5 + r*0.06), Math.max(o.px(0.4), wd*0.03), pkCss(o.ink)); pkShade(x, [[X - wd*0.07, Y], [X - wd*0.07, Y - h*0.18], [X + wd*0.07, Y - h*0.18], [X + wd*0.07, Y]], o.ink, Y - h*0.18, Y);
      for(let k = 0; k < 2; k++) pkEll(x, X + (o.R() - 0.5)*wd, Y - h*(0.43 + 0.01*k), wd*0.04, wd*0.025, pkCss(pkMat(c, [230, 230, 230], 0.6).body)); } },
  gassho(x, X, Y, h, wd, c, night, lit, o){ // a gasshō-zukuri farmhouse: a huge steep thatched gable like praying hands, rows of small gable windows, a low wall beneath
    const w2 = wd/2, th = pkMat(c, [150, 126, 86], 0.65), wood = pkMat(c, [80, 60, 44], 0.6), ye = Y - h*0.18; pkShade(x, [[X - w2*0.9, Y], [X - w2*0.9, ye], [X + w2*0.9, ye], [X + w2*0.9, Y]], wood.body, ye, Y);
    pkPoly(x, [[X - w2*1.05, ye], [X, Y - h], [X + w2*1.05, ye]], pkCss(th.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.05, ye], [X, ye]], pkCss(th.body));
    pkPoly(x, [[X - w2*0.6, ye], [X, Y - h*0.82], [X + w2*0.6, ye]], pkCss(pkMat(c, [210, 200, 180], 0.6).body));
    if(o.detail){ for(let r = 0; r < 3; r++){ const v = 0.28 + r*0.18, hw = w2*0.6*(1 - (v - 0.18)/0.64); for(let k = -1; k <= 1; k++) if(Math.abs(k*hw*0.5) < hw*0.8) pkFrame(x, X + k*hw*0.5 - wd*0.03, Y - h*v - h*0.05, wd*0.06, h*0.06, c, night, o); }
      x.strokeStyle = pkCss(th.dark, 0.5); x.lineWidth = Math.max(o.px(0.3), wd*0.004); x.beginPath(); for(let k = 0; k < 20; k++){ const u = k/19; x.moveTo(X + c.sd*w2*1.05*u, ye - (1 - u)*0.0); x.lineTo(X + c.sd*w2*0.1*u, Y - h*(1 - u*0.1)); } x.stroke(); } },
  kubo(x, X, Y, h, wd, c, night, lit, o){ // a stilt hut: a woven-bamboo cube on posts, its tall steep thatch with long eaves, a ladder up
    const w2 = wd/2, bam = pkMat(c, [190, 170, 120], 0.6), th = pkMat(c, [140, 120, 80], 0.65), fl = Y - h*0.3, ye = Y - h*0.6;
    for(const s of [-0.4, 0, 0.4]) pkBar(x, X + s*wd - wd*0.02, fl, wd*0.04, Y - fl, pkMat(c, PK_WOOD, 0.6).body, o.px);
    pkShade(x, [[X - w2*0.8, fl], [X - w2*0.8, ye], [X + w2*0.8, ye], [X + w2*0.8, fl]], bam.body, ye, fl, 0.18);
    if(o.detail){ x.strokeStyle = pkCss(bam.dark, 0.5); x.lineWidth = Math.max(o.px(0.3), wd*0.006); x.beginPath(); for(let k = 0; k < 8; k++){ const v = fl - (fl - ye)*k/8; x.moveTo(X - w2*0.8, v); x.lineTo(X + w2*0.8, v); } x.stroke(); pkFrame(x, X - wd*0.1, ye + (fl - ye)*0.25, wd*0.2, (fl - ye)*0.4, c, night, o);
      x.strokeStyle = pkCss(pkMat(c, PK_WOOD, 0.6).body); x.lineWidth = Math.max(o.px(0.3), wd*0.015); x.beginPath(); x.moveTo(X + w2*0.4, fl); x.lineTo(X + w2*0.7, Y); x.moveTo(X + w2*0.55, fl); x.lineTo(X + w2*0.85, Y); for(let k = 1; k < 4; k++){ const v = k/4; x.moveTo(X + w2*(0.4 + 0.3*v), fl + (Y - fl)*v); x.lineTo(X + w2*(0.55 + 0.3*v), fl + (Y - fl)*v); } x.stroke(); }
    pkPoly(x, [[X - w2*1.25, ye + h*0.06], [X, Y - h], [X + w2*1.25, ye + h*0.06]], pkCss(th.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*1.25, ye + h*0.06], [X, ye]], pkCss(th.body)); },
  elevator(x, X, Y, h, wd, c, night, lit, o){ // a prairie grain elevator: a tall box with its cupola box on top, a gabled annex, its name painted big in a band
    const w2 = wd/2, m = pkMat(c, [[170, 50, 40], [180, 176, 168], [210, 190, 140]][Math.floor(o.R()*3)], 0.65), roof = pkMat(c, [90, 90, 96], 0.6), bt = Y - h*0.78;
    pkBox(x, X + w2*0.75, Y, Y - h*0.35, wd*0.5, m, o.dep*0.3); pkGable(x, X + w2*0.5, X + w2*1.0, Y - h*0.35, Y - h*0.45, roof, 0.05);
    pkBox(x, X - w2*0.1, Y, bt, wd*0.6, m, o.dep*0.5); pkBox(x, X - w2*0.1, bt, Y - h*0.92, wd*0.3, m, o.dep*0.2); pkGable(x, X - w2*0.4, X + w2*0.2, bt, bt - h*0.04, roof, 0.05); pkGable(x, X - w2*0.25, X + w2*0.05, Y - h*0.92, Y - h, roof, 0.05);
    if(o.detail){ pkBar(x, X - w2*0.4, Y - h*0.62, wd*0.6, h*0.08, PK_WHITE, o.px, 0.85); pkType(x, ['SPINWARD', 'ARCHVALE', 'NOONDALE', 'RIMSIDE'][Math.floor(o.R()*4)], X - w2*0.1, Y - h*0.555, h*0.07, wd*0.55, m.dark, o.px);
      if(o.fine){ x.fillStyle = pkCss(m.dark, 0.3); for(let k = 1; k < 10; k++) x.fillRect(X - w2*0.4 + wd*0.6*k/10, bt, Math.max(o.px(0.3), wd*0.004), Y - bt); } } }
};
// EIGHT VIEWS (Ruby: "these objects should have more than one view … front, sides, back, and the half-turned states …
// mirrored the other direction, except the ones that have text"): a caller may give c.view = { cs, sn }, the cosine and
// sine of the angle between the way a thing faces and the way to the eye. A building is then drawn as the eye sees it:
// its face narrowed as it turns away (|cs|), its side shown on the side turned toward you, deeper as it turns (|sn|)
// the round buildings, the same from any side
const PK_ROUND = ['yurt', 'rondavel', 'trullo', 'dome', 'oast', 'dovecote', 'radiomast', 'elevator', 'needle'];
export function pkBuilding(x, X, Y, h, wdt, c, style, night, R0, px, kind0){
  if(c.view && PK_ROUND.includes(kind0)) c = { ...c, view: null }; // (round: the same from every side)
  if(c.view && !c.vdep){ const { cs, sn } = c.view, f = Math.max(0.34, Math.abs(cs)); x.save(); x.translate(X, 0); x.scale(f, 1); x.translate(-X, 0);
    pkBuilding(x, X, Y, h, wdt, { ...c, view: null, vside: sn >= 0 ? 1 : -1, vdep: Math.max(0.05, Math.abs(sn))*1.6/f }, style, night, R0, px, kind0); x.restore(); return; }
  const sub = pkSub(R0), R = sub(1), RW = sub(2), RT = sub(3), RN = sub(4), RU = sub(5), RD = sub(6);
  const kind = (k => kind0 || k)(pkArchOf(style, R()));
  // each building its own material (warm stone, brick, concrete, blue glass, dark steel), laid over the world's own
  // colour and fading into the air with distance, so a city is many buildings and not one white block
  { const M = PK_MATS[style] || PK_MATS.city, m = M[Math.floor(R()*M.length)], k = 0.55*(1 - (c.haze || 0));
    if(m) c = { ...c, body: pkMix(c.body, pkMix(m, c.body, 0.3), k), lit: pkMix(c.lit, pkMix(m, PK_WHITE, 0.35), k), dark: pkMix(c.dark, pkMix(m, PK_BLACK, 0.45), k) }; }
  const neon = style === 'neon', ruin = style === 'ruins' && h > px(6), w2 = wdt/2, top = Y - h, dep = wdt*0.32, detail = h > px(14), fine = h > px(48), lit = pkMix(c.lit, PK_WHITE, 0.2);
  const ink = pkMix(c.dark, PK_BLACK, 0.35), bar = (x0, y0, w, t, col, a = 1) => { x.fillStyle = pkCss(col, a); x.fillRect(x0, y0, w, Math.max(px(0.4), t)); };
  // (its shadow on the ground first, thrown away from the light)
  if(h > px(4) && kind !== 'arch' && kind !== 'torii' && kind !== 'turbine') pkCast(x, X - wdt*0.5, X + wdt*0.5, Y, Math.min(h, wdt*1.6), c);
  // RUIN: its top broken away along a jagged line (the building is drawn only below it), its floors open to the air
  let bk = 0;
  if(ruin){ bk = top + h*(0.08 + 0.3*RU()); const jag = [[X + wdt*2, Y + h], [X - wdt*2, Y + h]];
    for(let q = 0; q <= 6; q++) jag.push([X - wdt*1.2 + wdt*2.4*q/6, bk + (RU() - 0.3)*h*0.2]);
    x.save(); x.beginPath(); jag.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip(); }
  if(kind === 'deco'){ // base, shaft and crown: setbacks stepping in, piers running up unbroken, a crown of fins and a spire
    const b1 = top + h*0.3, b2 = top + h*0.12, lob = Y - Math.min(h*0.06, wdt*0.5);
    pkBox(x, X, Y, b1, wdt, c, dep); pkBox(x, X, b1, b2, wdt*0.72, c, dep*0.72); pkBox(x, X, b2, top, wdt*0.44, c, dep*0.44);
    pkPoly(x, [[X - wdt*0.08, top], [X, top - h*0.16], [X + wdt*0.08, top]], pkCss(c.lit)); pkPoly(x, [[X, top], [X, top - h*0.16], [X + c.sd*wdt*0.08, top]], pkCss(pkMix(c.lit, PK_WHITE, 0.3)));
    if(detail){ pkWindows(x, X - w2, b1, wdt, lob - b1, c, night, lit, RW, px); pkWindows(x, X - wdt*0.36, b2, wdt*0.72, b1 - b2, c, night, lit, RW, px);
      bar(X - wdt*0.36, b1 - px(1), wdt*0.72, h*0.008, c.lit, 0.6); bar(X - wdt*0.22, b2 - px(1), wdt*0.44, h*0.008, c.lit, 0.6);
      // the piers: lines of the stone running from the street to the crown, every other bay
      for(let k = 1; k < 6; k++){ const px0 = X - w2 + wdt*k/6; x.fillStyle = pkCss(k % 2 ? c.lit : c.body, 0.75); x.fillRect(px0 - wdt*0.012, b1, wdt*0.024, lob - b1); }
      // the lobby: tall dark glass between bronze posts, an entrance lit
      x.fillStyle = pkCss(night > 0.2 ? pkMix(c.glow, ink, 0.4) : ink, 0.9); x.fillRect(X - w2*0.9, lob, wdt*0.9, Y - lob); bar(X - w2, lob - px(0.5), wdt, (Y - lob)*0.12, c.lit, 0.8);
      if(fine){ // the crown's fins fanned like a sunburst, floodlit by night
        for(let k = -3; k <= 3; k++){ const a = k*0.22; pkPoly(x, [[X + k*wdt*0.03, b2], [X + Math.sin(a)*wdt*0.3, b2 - Math.cos(a)*h*0.07], [X + Math.sin(a)*wdt*0.3 + wdt*0.02, b2 - Math.cos(a)*h*0.07 + h*0.01]], pkCss(k*c.sd > 0 ? lit : c.body)); }
        pkStreaks(x, X - w2, b1, wdt, lob - b1, c, RD, px); }
      if(night > 0.2) pkGlow(x, X, b2 - h*0.02, wdt*0.6, pkMix(c.glow, PK_WHITE, 0.4), 0.35*night); } }
  else if(kind === 'slab'){ // a long block of board-marked concrete raised on pilotis, its ribbon windows, plant on its roof
    const ww = wdt*1.5, hh = h*0.6, t2 = Y - hh, und = Y - hh*0.14;
    pkBox(x, X, und, t2, ww, c, dep*1.2);
    // the undercroft: deep shade between the columns it stands on
    x.fillStyle = pkCss(pkMix(ink, PK_BLACK, 0.2), 0.9); x.fillRect(X - ww/2 + ww*0.04, und, ww*0.92, Y - und);
    for(let k = 0; k < 7; k++){ const cx = X - ww/2 + ww*(0.06 + 0.88*k/6); pkShade(x, [[cx - ww*0.012, Y], [cx - ww*0.012, und], [cx + ww*0.012, und], [cx + ww*0.012, Y]], c.body, und, Y, 0.3); }
    if(detail){ pkWindows(x, X - ww/2, t2, ww, und - t2, c, night, lit, RW, px, neon ? 'neon' : 'ribbon'); pkBox(x, X + ww*(RT() - 0.5)*0.4, t2, t2 - hh*0.08, ww*0.25, c, dep*0.3);
      if(fine){ x.fillStyle = pkCss(c.dark, 0.18); for(let k = 0; k < 14; k++) x.fillRect(X - ww/2, t2 + (und - t2)*k/14, ww, Math.max(px(0.4), hh*0.002)); pkStreaks(x, X - ww/2, t2, ww, und - t2, c, RD, px, 0.12); } } }
  else if(kind === 'brick'){ // a mid-rise: a grid of windows over shopfronts under awnings, string courses, a cornice on brackets, a
    // fire escape zigzagging down its face, a water tower now and then
    const hh = h*0.7, t2 = Y - hh, sh = Math.min(hh*0.16, wdt*0.35), ww = wdt*1.1; pkBox(x, X, Y, t2, ww, c, dep);
    if(detail){ pkWindows(x, X - ww/2, t2, ww, hh - sh, c, night, lit, RW, px);
      bar(X - ww*0.55, t2 - Math.max(px(0.6), hh*0.02), ww*1.1, Math.max(px(1), hh*0.03), c.dark); // the cornice
      if(fine){ for(let k = 0; k < 18; k++) bar(X - ww*0.53 + ww*1.06*k/18, t2 + hh*0.012, ww*0.02, hh*0.012, c.lit, 0.8); // its dentils
        for(let k = 1; k < 3; k++) bar(X - ww/2, t2 + (hh - sh)*k/3, ww, hh*0.006, c.lit, 0.5); } // string courses
      // the shopfronts: glass, lit at night, under striped awnings
      const ns = 2 + Math.floor(RT()*2), M = [[150, 50, 46], [46, 80, 70], [200, 170, 60], [60, 70, 120]];
      for(let k = 0; k < ns; k++){ const sx = X - ww/2 + ww*(k + 0.1)/ns, sw = ww*0.8/ns, aw = M[Math.floor(RT()*M.length)];
        x.fillStyle = pkCss(night > 0.2 ? pkMix(c.glow, PK_WHITE, 0.25) : pkMix(ink, c.air || lit, 0.35), night > 0.2 ? 0.85 : 0.9); x.fillRect(sx, Y - sh*0.8, sw, sh*0.8);
        const a = pkMat(c, aw, 0.75); pkPoly(x, [[sx - sw*0.04, Y - sh*0.82], [sx - sw*0.04, Y - sh], [sx + sw*1.04, Y - sh], [sx + sw*1.04, Y - sh*0.82], [sx + sw*0.98, Y - sh*0.72], [sx + sw*0.02, Y - sh*0.72]], pkCss(a.body));
        if(fine) for(let q = 0; q < 6; q += 2) x.fillStyle = pkCss(PK_WHITE, 0.4), x.fillRect(sx + sw*q/6, Y - sh, sw/6, sh*0.18); }
      if(fine && RT() < 0.55){ // a fire escape: landings at each floor, ladders between, in black iron
        const fx = X - ww*(0.1 + 0.25*RT()), fw = ww*0.22, fl = Math.min(8, Math.floor((hh - sh)/(wdt*0.18))); x.strokeStyle = pkCss(PK_IRON, 0.9); x.lineWidth = Math.max(px(0.4), wdt*0.01); x.beginPath();
        for(let k = 0; k < fl; k++){ const yy = Y - sh - (hh - sh)*(k + 0.5)/fl; x.moveTo(fx, yy); x.lineTo(fx + fw, yy); x.moveTo(fx, yy - (hh - sh)*0.04/fl*4); x.lineTo(fx + fw, yy - (hh - sh)*0.04/fl*4);
          if(k) { x.moveTo(fx + (k % 2 ? 0.1 : 0.7)*fw, yy); x.lineTo(fx + (k % 2 ? 0.4 : 1)*fw, yy + (hh - sh)/fl); } } x.stroke(); }
      if(RT() < 0.45 && !ruin){ const tx = X + wdt*(RT() - 0.5)*0.6, tw = wdt*0.22, th = tw*1.1, wood = pkMat(c, PK_GREYWOOD, 0.6); x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), tw*0.08); x.beginPath(); x.moveTo(tx - tw*0.4, t2); x.lineTo(tx - tw*0.3, t2 - th*0.5); x.moveTo(tx + tw*0.4, t2); x.lineTo(tx + tw*0.3, t2 - th*0.5); x.stroke();
        pkShade(x, [[tx - tw/2, t2 - th*0.5], [tx - tw/2, t2 - th*1.2], [tx + tw/2, t2 - th*1.2], [tx + tw/2, t2 - th*0.5]], wood.body, t2 - th*1.2, t2 - th*0.5); pkPoly(x, [[tx - tw*0.56, t2 - th*1.2], [tx, t2 - th*1.5], [tx + tw*0.56, t2 - th*1.2]], pkCss(wood.dark));
        if(fine){ x.fillStyle = pkCss(wood.dark, 0.6); for(let q = 1; q < 4; q++) x.fillRect(tx - tw/2, t2 - th*(0.5 + q*0.17), tw, Math.max(px(0.4), th*0.03)); } }
      if(fine) pkStreaks(x, X - ww/2, t2, ww, hh - sh, c, RD, px, 0.12); } }
  else if(kind === 'dome'){ // a drum ringed with columns under a ribbed dome (copper gone green, gilt or lead), its lantern; a portico
    const dr = wdt*0.7, base = Y - h*0.35, finish = [[110, 160, 140], [200, 168, 90], [130, 134, 140]][Math.floor(RT()*3)], dc = pkMat(c, finish, 0.55);
    pkBox(x, X, Y, base, dr*2, c, dep*0.5);
    x.fillStyle = pkCss(dc.dark); x.beginPath(); x.ellipse(X, base, dr, dr*0.85, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(dc.body); x.beginPath(); x.ellipse(X + c.sd*dr*0.12, base, dr*0.86, dr*0.8, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(dc.lit); x.beginPath(); x.ellipse(X + c.sd*dr*0.4, base, dr*0.38, dr*0.7, 0, Math.PI, 0); x.fill();
    if(detail){ x.strokeStyle = pkCss(dc.dark, 0.6); x.lineWidth = Math.max(px(0.5), dr*0.025); x.beginPath(); for(let q = 1; q < 8; q++){ const u = q/8*2 - 1; x.moveTo(X + u*dr, base); x.quadraticCurveTo(X + u*dr*0.6, base - dr*0.8, X, base - dr*0.85); } x.stroke();
      pkBox(x, X, base - dr*0.82, base - dr*1.05, dr*0.2, c, dr*0.06); pkPoly(x, [[X - dr*0.12, base - dr*1.05], [X, base - dr*1.2], [X + dr*0.12, base - dr*1.05]], pkCss(dc.body));
      // the colonnade round the drum, and a portico before it: columns under a pediment
      for(let q = 0; q < 9; q++){ const u = q/8*2 - 1; x.fillStyle = pkCss(u*c.sd > 0 ? c.lit : c.body); x.fillRect(X + u*dr*0.92 - dr*0.025, base + (Y - base)*0.05, dr*0.05, (Y - base)*0.55); }
      bar(X - dr, base, dr*2, (Y - base)*0.06, c.lit, 0.9);
      const pw = dr*0.9, pt = Y - (Y - base)*0.75;
      x.fillStyle = pkCss(ink, 0.5); x.fillRect(X - pw/2, pt, pw, Y - pt); for(let q = 0; q < 6; q++){ const cx = X - pw/2 + pw*q/5; pkShade(x, [[cx - pw*0.03, Y], [cx - pw*0.03, pt], [cx + pw*0.03, pt], [cx + pw*0.03, Y]], c.lit, pt, Y); }
      pkPoly(x, [[X - pw*0.58, pt], [X, pt - pw*0.22], [X + pw*0.58, pt]], pkCss(c.body)); pkPoly(x, [[X, pt - pw*0.22], [X + c.sd*pw*0.58, pt], [X, pt]], pkCss(c.lit)); bar(X - pw*0.58, pt, pw*1.16, pw*0.05, c.dark, 0.6); }
    if(night > 0.2) pkGlow(x, X, base - dr*0.4, dr*1.6, c.glow, 0.45*night); }
  else if(kind === 'needle'){ // a needle: a shaft on three splayed legs, a saucer high up ringed with windows, a mast with its warning light
    const sh = h*1.3, st = Y - sh*0.8, lg = sh*0.12, wht = pkMix(c.lit, PK_WHITE, 0.25);
    x.strokeStyle = pkCss(c.body); x.lineWidth = Math.max(px(0.6), wdt*0.06); x.lineCap = 'round'; x.beginPath(); for(const s of [-1, 0.3, 1]){ x.moveTo(X + s*wdt*0.45, Y); x.quadraticCurveTo(X + s*wdt*0.1, Y - lg*0.6, X, Y - lg*1.6); } x.stroke();
    pkShade(x, [[X - wdt*0.08, Y - lg], [X - wdt*0.06, st], [X + wdt*0.06, st], [X + wdt*0.08, Y - lg]], c.body, st, Y, 0.1); x.fillStyle = pkCss(wht, 0.8); x.fillRect(X + c.sd*wdt*0.02, st, wdt*0.04, sh*0.8 - lg);
    if(detail){ x.fillStyle = pkCss(c.glow, 0.5 + 0.4*night); x.fillRect(X - c.sd*wdt*0.03 - px(0.3), st + sh*0.05, Math.max(px(0.6), wdt*0.02), sh*0.6); } // the lift's lamp running up
    pkEll(x, X, st + wdt*0.06, wdt*0.42, wdt*0.12, pkCss(ink)); pkEll(x, X, st, wdt*0.5, wdt*0.12, pkCss(c.body)); pkEll(x, X + c.sd*wdt*0.1, st - wdt*0.03, wdt*0.32, wdt*0.07, pkCss(wht));
    if(detail){ x.fillStyle = pkCss(night > 0.2 ? c.glow : pkMix(ink, c.air || lit, 0.35), 0.85); x.fillRect(X - wdt*0.44, st + wdt*0.015, wdt*0.88, Math.max(px(0.5), wdt*0.05)); pkEll(x, X, st - wdt*0.1, wdt*0.18, wdt*0.06, pkCss(c.body)); }
    x.fillStyle = pkCss(c.body); x.fillRect(X - Math.max(px(0.4), wdt*0.02), st - sh*0.2, Math.max(px(0.8), wdt*0.04), sh*0.2);
    pkDisc(x, X, st - sh*0.2, Math.max(px(0.8), wdt*0.035), pkCss([255, 70, 60], night > 0.2 ? 0.95 : 0.5)); if(night > 0.2) pkGlow(x, X, st - sh*0.2, wdt*0.4, [255, 70, 60], 0.5*night); }
  else if(kind === 'pylon'){ // the builders' white pylon: rounded, its panels seamed, chamfered on the light's side, a line of light up its edge
    const t2 = top + wdt*0.5; pkShade(x, [[X - w2, Y], [X - w2*0.8, t2], [X + w2*0.8, t2], [X + w2, Y]], c.body, top, Y, 0.12);
    x.fillStyle = pkCss(c.body); x.beginPath(); x.arc(X, t2, w2*0.8, Math.PI, 0); x.fill();
    pkPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2*0.8, t2], [X + c.sd*w2*0.3, t2], [X + c.sd*w2*0.4, Y]], pkCss(c.lit));
    if(detail){ x.fillStyle = pkCss(c.dark, 0.35); for(let k = 1; k < 9; k++){ const yy = t2 + (Y - t2)*k/9, kk = 0.8 + 0.2*k/9; x.fillRect(X - w2*kk, yy, wdt*kk, Math.max(px(0.4), h*0.003)); }
      pkShade(x, [[X - w2*1.15, Y], [X - w2*1.15, Y - h*0.04], [X + w2*1.15, Y - h*0.04], [X + w2*1.15, Y]], c.dark, Y - h*0.04, Y); }
    x.fillStyle = pkCss(c.glow, 0.85); x.fillRect(X - c.sd*w2*0.55 - px(0.5), t2, Math.max(px(0.8), wdt*0.05), Y - t2);
    pkGlow(x, X, t2 - w2*0.5, wdt*0.9, c.glow, 0.5); }
  else if(kind === 'arch'){ // the builders' arch: two legs and a span, its face seamed into blocks, light beneath it
    const aw = wdt*1.8, th = aw*0.16, ry = Y - h*0.5;
    x.fillStyle = pkCss(c.body); x.beginPath(); x.moveTo(X - aw/2, Y); x.lineTo(X - aw/2, ry); x.arc(X, ry, aw/2, Math.PI, 0); x.lineTo(X + aw/2, Y); x.lineTo(X + aw/2 - th, Y); x.lineTo(X + aw/2 - th, ry); x.arc(X, ry, aw/2 - th, 0, Math.PI, true); x.lineTo(X - aw/2 + th, Y); x.closePath(); x.fill();
    x.strokeStyle = pkCss(c.lit); x.lineWidth = Math.max(px(0.6), th*0.3); x.beginPath(); x.arc(X, ry, aw/2 - th*0.15, c.sd > 0 ? -Math.PI/2 : Math.PI, c.sd > 0 ? 0 : -Math.PI/2); x.stroke();
    if(detail){ x.strokeStyle = pkCss(c.dark, 0.4); x.lineWidth = Math.max(px(0.4), th*0.05); x.beginPath(); for(let k = 1; k < 10; k++){ const a = Math.PI + k/10*Math.PI; x.moveTo(X + Math.cos(a)*(aw/2 - th), ry + Math.sin(a)*(aw/2 - th)); x.lineTo(X + Math.cos(a)*aw/2, ry + Math.sin(a)*aw/2); }
      for(const s of [-1, 1]) for(let k = 1; k < 5; k++){ const yy = ry + (Y - ry)*k/5; x.moveTo(X + s*aw/2, yy); x.lineTo(X + s*(aw/2 - th), yy); } x.stroke(); }
    pkGlow(x, X, Y - h*0.15, aw*0.4, c.glow, 0.35); }
  else if(kind === 'wizard'){ // a tower of the magi: round, its stone coursed, arched windows lit, a balcony of merlons, a tall cone
    // of a roof shingled in bands, a pennant at its tip, ivy up one side
    const tw = wdt*0.7, t2 = Y - h*0.75, roof = pkMat(c, [70, 64, 110], 0.35); pkBox(x, X, Y, t2, tw, c, tw*0.15);
    if(detail){ x.fillStyle = pkCss(c.dark, 0.25); for(let k = 1; k < 10; k++) x.fillRect(X - tw/2, t2 + (Y - t2)*k/10, tw, Math.max(px(0.4), h*0.003));
      for(let k = 0; k < 5; k++) bar(X - tw*0.62 + k*tw*0.31, t2 - tw*0.12, tw*0.16, tw*0.12, c.body); bar(X - tw*0.62, t2, tw*1.24, tw*0.05, c.dark, 0.8);
      pkIvy(x, X - c.sd*tw*0.38, Y, (Y - t2)*(0.35 + 0.4*RD()), tw*0.3, c, RD, px); }
    pkPoly(x, [[X - tw*0.65, t2], [X, top - h*0.1], [X + tw*0.65, t2]], pkCss(pkMix(roof.dark, c.glow, 0.15))); pkPoly(x, [[X, t2], [X, top - h*0.1], [X + c.sd*tw*0.65, t2]], pkCss(pkMix(roof.body, c.glow, 0.15)));
    if(detail){ x.strokeStyle = pkCss(roof.dark, 0.6); x.lineWidth = Math.max(px(0.4), h*0.004); x.beginPath(); for(let k = 1; k < 6; k++){ const u = k/6, yy = t2 - (t2 - top + h*0.1)*u, hw = tw*0.65*(1 - u); x.moveTo(X - hw, yy); x.lineTo(X + hw, yy); } x.stroke();
      for(let q = 0; q < 3; q++){ const wy = t2 + (Y - t2)*(0.15 + q*0.28), ww = tw*0.2, wh = (Y - t2)*0.1; x.fillStyle = pkCss(c.glow, 0.5 + 0.4*night); x.beginPath(); x.moveTo(X - ww/2, wy + wh); x.lineTo(X - ww/2, wy + ww/2); x.arc(X, wy + ww/2, ww/2, Math.PI, 0); x.lineTo(X + ww/2, wy + wh); x.fill(); }
      const ft = top - h*0.1; x.strokeStyle = pkCss(ink); x.lineWidth = Math.max(px(0.4), tw*0.02); x.beginPath(); x.moveTo(X, ft); x.lineTo(X, ft - h*0.06); x.stroke(); pkPoly(x, [[X, ft - h*0.06], [X + tw*0.3, ft - h*0.045], [X, ft - h*0.03]], pkCss(pkMat(c, [160, 50, 60], 0.7).body)); }
    pkGlow(x, X, t2 + (Y - t2)*0.2, tw*0.8, c.glow, 0.3 + 0.3*night); }
  else if(kind === 'onion'){ // an onion dome on a drum of arched windows, its gores striped, gilt or painted, an orb and finial; two
    // small onions on turrets beside it
    const dr = wdt*0.55, base = Y - h*0.45, finish = [[200, 168, 80], [60, 110, 150], [90, 140, 90], [170, 70, 70]][Math.floor(RT()*4)], dc = pkMat(c, finish, 0.6);
    const onion = (cx, b, r, cc) => { x.fillStyle = pkCss(cc.body); x.beginPath(); x.moveTo(cx - r*0.7, b); x.bezierCurveTo(cx - r*1.3, b - r*0.9, cx - r*0.2, b - r*1.4, cx, b - r*2); x.bezierCurveTo(cx + r*0.2, b - r*1.4, cx + r*1.3, b - r*0.9, cx + r*0.7, b); x.fill();
      x.fillStyle = pkCss(pkMix(cc.lit, c.glow, 0.15)); x.beginPath(); x.moveTo(cx + c.sd*r*0.1, b); x.bezierCurveTo(cx + c.sd*r*1.15, b - r*0.9, cx + c.sd*r*0.15, b - r*1.4, cx, b - r*2); x.bezierCurveTo(cx + c.sd*r*0.05, b - r*1.4, cx + c.sd*r*0.4, b - r*0.9, cx + c.sd*r*0.1, b); x.fill();
      if(detail){ x.strokeStyle = pkCss(cc.dark, 0.5); x.lineWidth = Math.max(px(0.4), r*0.04); x.beginPath(); for(const u of [-0.55, -0.2, 0.2, 0.55]){ x.moveTo(cx + u*r*0.7, b); x.bezierCurveTo(cx + u*r*1.5, b - r*0.9, cx + u*r*0.3, b - r*1.4, cx, b - r*2); } x.stroke(); }
      x.fillStyle = pkCss(dc.lit); x.fillRect(cx - Math.max(px(0.3), r*0.03), b - r*2.4, Math.max(px(0.6), r*0.06), r*0.4); pkDisc(x, cx, b - r*2.05, Math.max(px(0.4), r*0.08), pkCss(dc.lit)); };
    if(detail) for(const s of [-1, 1]){ const tx = X + s*dr*1.05, tb = Y - h*0.3; pkBox(x, tx, Y, tb, dr*0.4, c, dep*0.1); onion(tx, tb, dr*0.28, dc); }
    pkBox(x, X, Y, base, dr*1.6, c, dep*0.4);
    if(detail){ for(let q = 0; q < 5; q++){ const wx = X - dr*0.6 + q*dr*0.3, ww = dr*0.12, wy = base + (Y - base)*0.18, wh = (Y - base)*0.3; x.fillStyle = pkCss(night > 0.2 ? c.glow : ink, 0.8); x.beginPath(); x.moveTo(wx - ww/2, wy + wh); x.lineTo(wx - ww/2, wy); x.arc(wx, wy, ww/2, Math.PI, 0); x.lineTo(wx + ww/2, wy + wh); x.fill(); }
      bar(X - dr*0.82, base, dr*1.64, (Y - base)*0.05, c.lit, 0.8); }
    onion(X, base, dr, dc);
    if(night > 0.2) pkGlow(x, X, base - dr, dr*2, c.glow, 0.4*night); }
  // ---- the wider kit (docs/prior-art/painted-ringworld.md §5.3): houses and farms, landmarks, the neon's and the
  // builders' own; each a few flat shapes in true proportion, its door and floors where it is large enough ----
  else if(PK_BUILT[kind]) PK_BUILT[kind](x, X, Y, h, wdt, c, night, lit, { R: RT, RW, RD, px, detail, fine, dep, top, ink });
  else { // 'glass': a tower of glass over a lobby, a slanted or stepped top, its plant, a mast
    const sl = R() < 0.4 ? h*0.08*(R() < 0.5 ? 1 : -1) : 0, lob = Y - Math.min(h*0.07, wdt*0.45);
    pkShade(x, [[X - w2, Y], [X - w2, top + Math.max(0, sl)], [X + w2, top + Math.max(0, -sl)], [X + w2, Y]], c.body, top, Y, 0.1);
    { const vs = c.vside || c.sd, dp = dep*(c.vdep ?? 1); pkPoly(x, [[X + vs*w2, Y], [X + vs*w2, top + Math.max(0, vs > 0 ? -sl : sl)], [X + vs*(w2 + dp), top + Math.abs(dp)*0.3 + Math.max(0, vs > 0 ? -sl : sl)], [X + vs*(w2 + dp), Y]], pkCss(vs === c.sd ? pkMix(c.body, c.lit, 0.5) : pkMix(c.body, c.dark, 0.45))); }
    if(detail){ pkWindows(x, X - w2, top + Math.abs(sl), wdt, lob - top - Math.abs(sl), c, night, lit, RW, px, neon ? 'neon' : 'mullion');
      x.fillStyle = pkCss(night > 0.2 ? pkMix(c.glow, ink, 0.3) : ink, 0.85); x.fillRect(X - w2*0.92, lob, wdt*0.92, Y - lob); bar(X - w2, lob - px(0.5), wdt, (Y - lob)*0.1, c.lit, 0.8);
      if(fine && !sl){ pkBox(x, X + wdt*(RT() - 0.5)*0.3, top, top - h*0.03, wdt*0.4, { ...c, body: pkMix(c.body, c.dark, 0.3) }, dep*0.3); } }
    if(R() < 0.35){ x.fillStyle = pkCss(c.dark); x.fillRect(X - Math.max(px(0.4), wdt*0.02), top - h*0.14, Math.max(px(0.8), wdt*0.04), h*0.14); if(night > 0.2) pkDisc(x, X, top - h*0.14, Math.max(px(0.8), wdt*0.03), pkCss([255, 80, 70], 0.9)); } }
  // NEON: the edges in light, a sign hung on the face, its glow on the air
  if(neon && h > px(8) && kind !== 'needle'){ const R = RN; x.strokeStyle = pkCss(c.glow2, 0.85); x.lineWidth = Math.max(px(0.6), wdt*0.03); if(kind === 'glass'){ x.beginPath(); x.moveTo(X - w2, Y); x.lineTo(X - w2, top); x.lineTo(X + w2, top); x.lineTo(X + w2, Y); x.stroke(); }
    if(R() < 0.65){ const sh = h*0.14, sy = top + h*(0.12 + 0.45*R()), vert = R() < 0.5, col = R() < 0.5 ? c.glow : c.glow2;
      x.fillStyle = pkCss(col, 0.92); if(vert) x.fillRect(X - w2 - wdt*0.12, sy, wdt*0.14, sh*1.6); else x.fillRect(X - w2*0.8, sy, wdt*0.8, sh*0.45);
      pkGlow(x, X, sy, wdt*1.3, col, 0.35); } }
  if(ruin){ x.restore(); const air = c.air || c.body, R = RU;
    const floors = kind === 'glass' || kind === 'slab' || kind === 'deco' || kind === 'brick', fw = kind === 'slab' ? wdt*0.75 : kind === 'brick' ? wdt*0.55 : w2;
    if(detail && floors){ x.strokeStyle = pkCss(c.dark, 0.7); x.lineWidth = Math.max(px(0.5), h*0.01); x.beginPath(); for(let q = 0; q < 3; q++){ const fy = bk + h*0.1*(q + 1); x.moveTo(X - fw, fy); x.lineTo(X - fw + 2*fw*(0.6 + 0.4*R()), fy); } x.stroke();
      // the broken floors' rebar standing out of the break, rust down the walls
      x.strokeStyle = pkCss(PK_RUST, 0.8); x.lineWidth = Math.max(px(0.4), wdt*0.008); x.beginPath(); for(let q = 0; q < 6; q++){ const rx = X + (R() - 0.5)*wdt*0.9; x.moveTo(rx, bk + h*0.06); x.lineTo(rx + (R() - 0.5)*wdt*0.1, bk - h*0.03*R()); } x.stroke();
      pkStreaks(x, X - fw, bk, fw*2, Y - bk, { ...c, dark: PK_RUST }, R, px, 0.16); }
    for(let q = 0; q < 4; q++) pkPoly(x, [[X + (R() - 0.5)*wdt*1.6, Y + px(0.5)], [X + (R() - 0.5)*wdt*1.2, Y - h*0.06*R()], [X + (R() - 0.5)*wdt*1.6, Y + px(0.5)]], pkCss(pkMix(c.dark, air, 0.2))); }
}

// ---------------- ROCKS AND THE BUILDERS' WORKS ----------------
// a boulder in three facets: its top catching the light, its lit side, its shadow side; and its shadow on the ground
// ---------------- SMALL THINGS, for close by (docs/prior-art/painted-ringworld.md §5.5; ringworld-sprites.md, Part C) ----------------
// What you find near your feet and along the roads, each world its own: in the wilds fences and gates, stone walls and
// hedgerows, hay, troughs, a windpump, a well, a scarecrow, beehives, cairns and milestones, a wayside shrine, a tractor,
// grain bins, the poles that carry the wires; in town lamps, benches, hydrants, bicycles, bus stops, a phone box,
// vending machines, traffic lights, kiosks, food carts, parked cars and scooters; in the ruins barrels, crates, rubble,
// broken columns, a toppled statue, rusted cars, containers, tank traps; where the builders were dishes, solar fields,
// beacons, pipes, cargo and a surveyor's tripod; where there is magic standing stones, dolmens, fairy rings, wisps,
// giant flowers, toadstool houses, moon gates, a wishing well; and now and then a person, for scale. Each at (X, Y), h
// its height in pixels, in its own materials lit by the caller's light; night how dark it is. (Each world's list is
// weighted by repeats; a few kinds stand in rows or clusters of their own.)
export const PK_PROPS = {
  wilds: ['fence', 'fence', 'wall', 'hedge', 'gate', 'haybale', 'haybale', 'haystack', 'trough', 'pole', 'pole', 'mailbox', 'sign', 'milestone', 'cairn', 'scarecrow', 'beehives', 'well', 'windpump', 'tractor', 'grainbin', 'shrine', 'figure'],
  cities: ['lamp', 'lamp', 'bench', 'hydrant', 'bicycle', 'sign', 'figure', 'figure', 'mailbox', 'busstop', 'phonebox', 'vending', 'signal', 'kiosk', 'cart', 'parked', 'parked', 'scooter', 'pole'],
  neon: ['lamp', 'sign', 'bicycle', 'crate', 'figure', 'figure', 'vending', 'vending', 'signal', 'cart', 'scooter', 'scooter', 'parked'],
  builders: ['lamp', 'crate', 'bench', 'cargo', 'cargo', 'solar', 'solar', 'dish', 'beacon', 'pipes', 'tripod'],
  ruins: ['barrel', 'barrel', 'crate', 'sign', 'fence', 'rubble', 'rubble', 'column', 'hulk', 'hulk', 'container', 'traps', 'statue', 'pole'],
  magic: ['lamp', 'fence', 'bench', 'menhir', 'menhir', 'dolmen', 'fairyring', 'wisp', 'wisp', 'flower', 'toadstool', 'moongate', 'wishing', 'cairn'] };
// the side-drawn small things seen END-ON (front, toward you: its lamps; back: its tail): a car's width, roof and glass,
// headlights or tail lights, its wheels at the corners; a tractor between its great wheels; a bike or scooter a thin
// upright with its bars; a cart's end under its umbrella; a bench's end, seat and back in profile
function pkPropEnd(x, X, Y, h, c, kind, R0, px, night, front){
  const R = pkSub(R0)(1), steel = pkMat(c, PK_STEEL, 0.65), iron = pkMat(c, PK_IRON, 0.7), wheelB = (wx, wy, w, hh) => { x.fillStyle = pkCss(pkMix(PK_IRON, PK_BLACK, 0.5)); x.fillRect(wx - w/2, wy - hh, w, hh); };
  if(kind === 'parked' || kind === 'hulk'){ const hulk = kind === 'hulk', m = hulk ? pkMat(c, PK_RUST, 0.7) : pkMat(c, [[180, 40, 40], [40, 60, 110], [210, 210, 214], [30, 32, 36], [120, 130, 100], [200, 170, 70]][Math.floor(R()*6)], 0.7), w = h*1.2, yb = Y + (hulk ? h*0.08 : 0);
    for(const s of [-1, 1]) wheelB(X + s*w*0.36, yb, w*0.16, h*0.3);
    pkShade(x, [[X - w*0.5, yb - h*0.18], [X - w*0.5, yb - h*0.55], [X - w*0.36, yb - h*0.62], [X - w*0.3, yb - h*0.96], [X + w*0.3, yb - h*0.96], [X + w*0.36, yb - h*0.62], [X + w*0.5, yb - h*0.55], [X + w*0.5, yb - h*0.18]], m.body, yb - h, yb, 0.2);
    pkPoly(x, [[X - w*0.27, yb - h*0.9], [X + w*0.27, yb - h*0.9], [X + w*0.33, yb - h*0.62], [X - w*0.33, yb - h*0.62]], pkCss(hulk ? PK_BLACK : pkMix(c.air || m.lit, PK_BLACK, 0.3), hulk ? 0.75 : 0.9));
    const lc = front ? (night > 0.2 && !hulk ? pkMix(c.glow, PK_WHITE, 0.7) : [230, 226, 200]) : [200, 40, 40]; for(const s of [-1, 1]){ pkBar(x, X + s*w*0.38 - w*0.07, yb - h*0.47, w*0.14, h*0.08, hulk ? PK_BLACK : lc, px); if(front && night > 0.2 && !hulk) pkGlow(x, X + s*w*0.38, yb - h*0.43, h*0.6, c.glow, 0.4*night); }
    pkBar(x, X - w*0.48, yb - h*0.24, w*0.96, h*0.06, front ? steel.lit : m.dark, px); if(front && !hulk) pkBar(x, X - w*0.15, yb - h*0.4, w*0.3, h*0.1, pkMix(m.dark, PK_BLACK, 0.3), px); return; }
  if(kind === 'tractor'){ const m = pkMat(c, [[170, 50, 40], [60, 110, 60], [50, 80, 140], [210, 170, 50]][Math.floor(R()*4)], 0.75); for(const s of [-1, 1]) wheelB(X + s*h*0.42, Y, h*0.18, h*0.64);
    pkShade(x, [[X - h*0.18, Y - h*0.2], [X - h*0.18, Y - h*0.6], [X + h*0.18, Y - h*0.6], [X + h*0.18, Y - h*0.2]], m.body, Y - h*0.6, Y);
    pkPoly(x, [[X - h*0.3, Y - h*0.6], [X - h*0.28, Y - h], [X + h*0.28, Y - h], [X + h*0.3, Y - h*0.6]], pkCss(pkMix(m.dark, PK_BLACK, 0.2))); pkPoly(x, [[X - h*0.24, Y - h*0.64], [X - h*0.22, Y - h*0.95], [X + h*0.22, Y - h*0.95], [X + h*0.24, Y - h*0.64]], pkCss(pkMix(c.air || m.lit, PK_BLACK, 0.3), 0.85)); return; }
  if(kind === 'bicycle' || kind === 'scooter'){ const m = pkMat(c, [[40, 70, 120], [170, 40, 40], [40, 40, 44]][Math.floor(R()*3)], 0.7); x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.05);
    x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.66); x.stroke(); x.strokeStyle = pkCss(m.body); x.lineWidth = Math.max(px(0.5), h*0.06); x.beginPath(); x.moveTo(X, Y - h*0.3); x.lineTo(X, Y - h*0.9); x.stroke();
    x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.04); x.beginPath(); x.moveTo(X - h*0.25, Y - h*0.92); x.lineTo(X + h*0.25, Y - h*0.92); x.stroke(); return; }
  if(kind === 'cart'){ const m = pkMat(c, [[200, 60, 50], [230, 220, 200], [60, 120, 160]][Math.floor(R()*3)], 0.7); for(const s of [-1, 1]) wheelB(X + s*h*0.2, Y, h*0.05, h*0.2);
    pkShade(x, [[X - h*0.2, Y - h*0.12], [X - h*0.2, Y - h*0.48], [X + h*0.2, Y - h*0.48], [X + h*0.2, Y - h*0.12]], m.body, Y - h*0.48, Y); x.fillStyle = pkCss(pkMat(c, [220, 70, 60], 0.75).body); x.beginPath(); x.ellipse(X, Y - h*0.86, h*0.55, h*0.14, 0, Math.PI, 0); x.fill();
    x.strokeStyle = pkCss(steel.dark); x.lineWidth = Math.max(px(0.4), h*0.02); x.beginPath(); x.moveTo(X, Y - h*0.48); x.lineTo(X, Y - h*0.86); x.stroke(); return; }
  // a bench's end: its iron end in profile, the seat and the back as short bars
  const m = pkMat(c, R() < 0.5 ? PK_WOOD : PK_GREENPAINT, 0.7); x.strokeStyle = pkCss(iron.body); x.lineWidth = Math.max(px(0.5), h*0.07); x.lineCap = 'round';
  x.beginPath(); x.moveTo(X - h*0.2, Y); x.lineTo(X - h*0.1, Y - h*0.5); x.lineTo(X + h*0.2, Y - h*0.5); x.moveTo(X + h*0.18, Y); x.lineTo(X + h*0.1, Y - h*0.5); x.moveTo(X - h*0.1, Y - h*0.5); x.lineTo(X - h*0.2, Y - h); x.stroke();
  pkBar(x, X - h*0.12, Y - h*0.55, h*0.34, h*0.08, m.body, px); pkBar(x, X - h*0.24, Y - h*0.95, h*0.1, h*0.32, m.lit, px);
}
// the kinds large enough to be seen from further off (the caller sows them on a coarser grid)
export const PK_PROPS_BIG = ['windpump', 'grainbin', 'haystack', 'tractor', 'dish', 'beacon', 'solar', 'container', 'statue', 'dolmen', 'flower', 'toadstool', 'moongate', 'well', 'wishing', 'shrine', 'busstop', 'kiosk', 'menhir', 'column'];
// wires from one pole's top A to the next's B (h the near pole's height): three, sagging, thin as they are
export function pkWires(x, A, B, h, c, px){ const d = Math.hypot(B[0] - A[0], B[1] - A[1]); if(d > h*12 || d < px(2)) return; x.strokeStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.5), 0.6); x.lineWidth = Math.max(px(0.3), h*0.003); x.beginPath();
  for(const s of [-0.08, 0, 0.08]){ x.moveTo(A[0] + s*h, A[1] + h*0.05); x.quadraticCurveTo((A[0] + B[0])/2, Math.max(A[1], B[1]) + d*0.05, B[0] + s*h*0.6, B[1] + h*0.04); } x.stroke(); }
// (the small things seen as the eye sees them: those drawn side-on, a car, a bench, a bike, end-on as they turn to face
//  you or away, half-turned between; boxes narrowed as they turn; the rest mirrored by the side they turn, except
//  what carries writing)
// (a mirrored thing keeps its light where it is: its lit side swapped before it is drawn, so the mirror puts it back)
export const pkFlip = c => ({ ...c, sd: -c.sd, L: c.L ? [-c.L[0], c.L[1]] : c.L });
const PK_SIDE_NATIVE = ['parked', 'hulk', 'tractor', 'scooter', 'bicycle', 'cart', 'bench'];
const PK_WRITTEN = ['sign', 'milestone'];
// (those with a back of their own, drawn when the camera stands behind them: the plain backs of signs, of the vending machines)
const PK_BACKED = ['sign', 'milestone', 'vending'];
const PK_BOXLIKE = ['vending', 'phonebox', 'busstop', 'container', 'crate', 'cargo', 'mailbox', 'beehives', 'trough', 'shrine'];
export function pkProp(x, X, Y, h, c, kind, R0, px, night = 0){
  if(c.view){ const { cs, sn } = c.view, cc = { ...c, view: null };
    if(PK_SIDE_NATIVE.includes(kind)){ if(Math.abs(sn) < 0.38){ pkPropEnd(x, X, Y, h, cc, kind, R0, px, night, cs >= 0); return; }
      x.save(); x.translate(X, 0); x.scale((sn >= 0 ? 1 : -1)*(0.45 + 0.55*Math.abs(sn)), 1); x.translate(-X, 0); pkProp(x, X, Y, h, sn >= 0 ? cc : pkFlip(cc), kind, R0, px, night); x.restore(); return; }
    const f = PK_BOXLIKE.includes(kind) || PK_WRITTEN.includes(kind) ? Math.max(0.4, Math.abs(cs)) : 1, m = PK_WRITTEN.includes(kind) ? 1 : (sn >= 0 ? 1 : -1);
    x.save(); x.translate(X, 0); x.scale(f*m, 1); x.translate(-X, 0); pkProp(x, X, Y, h, { ...(m < 0 ? pkFlip(cc) : cc), back: PK_BACKED.includes(kind) && cs < 0 }, kind, R0, px, night); x.restore(); return; }
  const sub = pkSub(R0), R = sub(1), RD = sub(2), sd = c.sd, rnd = (a, b) => a + (b - a)*R(), near = h > px(14), fine = h > px(40);
  const ln = (pts, col, wd) => { x.strokeStyle = col; x.lineWidth = Math.max(px(0.5), wd); x.lineCap = 'round'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
  const box = (x0, y0, w, hh, m, k = 0.16) => { pkShade(x, [[x0, y0 + hh], [x0, y0], [x0 + w, y0], [x0 + w, y0 + hh]], m.body, y0, y0 + hh, k); };
  const side = (x0, y0, w, hh, d, m) => { const sx = sd > 0 ? x0 + w : x0; pkPoly(x, [[sx, y0 + hh], [sx, y0], [sx + sd*d, y0 - d*0.35], [sx + sd*d, y0 + hh - d*0.35]], pkCss(m.lit)); pkPoly(x, [[x0, y0], [x0 + w, y0], [x0 + w + sd*d, y0 - d*0.35], [x0 + sd*d, y0 - d*0.35]], pkCss(pkMix(m.lit, PK_WHITE, 0.15))); };
  const wheel = (wx, wy, r, m) => { pkDisc(x, wx, wy, r, pkCss(pkMix(PK_IRON, PK_BLACK, 0.4))); if(r > px(1.5)) pkDisc(x, wx + sd*r*0.08, wy - r*0.08, r*0.45, pkCss(m ? m.body : PK_STEEL)); };
  const wood = pkMat(c, PK_WOOD, 0.7), grey = pkMat(c, PK_GREYWOOD, 0.7), iron = pkMat(c, PK_IRON, 0.75), stone = pkMat(c, PK_STONE, 0.75), steel = pkMat(c, PK_STEEL, 0.65), rust = pkMat(c, PK_RUST, 0.7);
  const glowOn = night > 0.2, lamp = pkMix(c.glow, PK_WHITE, 0.55);
  if(near && !['wisp', 'fairyring', 'pole', 'beacon', 'flower'].includes(kind)) pkCast(x, X - h*0.3, X + h*0.3, Y, h*0.6, c, 0.16);
  switch(kind){
  case 'fence': { // a run of pickets on two rails, painted or bare, a few leaning, one gone
    const n = 5 + Math.floor(R()*5), sp = h*0.45, x0 = X - n*sp/2, lean = (R() - 0.5)*h*0.1, m = R() < 0.5 ? pkMat(c, [226, 222, 210], 0.6) : grey;
    ln([[x0, Y - h*0.35], [x0 + n*sp, Y - h*0.38 + lean]], pkCss(m.dark), h*0.07); ln([[x0, Y - h*0.75], [x0 + n*sp, Y - h*0.78 + lean]], pkCss(m.dark), h*0.07);
    for(let k = 0; k <= n; k++){ if(R() < 0.07) continue; const p0 = x0 + k*sp, tl = (R() - 0.5)*h*0.08, pw = h*0.05; pkShade(x, [[p0 - pw, Y], [p0 - pw + tl, Y - h*0.9], [p0 + tl, Y - h], [p0 + pw + tl, Y - h*0.9], [p0 + pw, Y]], m.body, Y - h, Y, 0.2);
      if(near) pkPoly(x, [[p0 + sd*pw*0.1, Y], [p0 + sd*pw*0.1 + tl, Y - h*0.95], [p0 + sd*pw + tl, Y - h*0.9], [p0 + sd*pw, Y]], pkCss(m.lit, 0.7)); } return; }
  case 'wall': { // a dry stone wall: a low band of fitted stones, its coping set on edge along the top
    const w = h*rnd(5, 9), x0 = X - w/2, top = (u) => Y - h*(0.85 + 0.1*Math.sin(u*5 + R()))*(1 - 0.03*u);
    pkShade(x, [[x0, Y], [x0 + w*0.01, top(0)], ...Array.from({ length: 9 }, (_, k) => [x0 + w*(k + 1)/10, top((k + 1)/10)]), [x0 + w, Y]], stone.body, Y - h, Y, 0.25);
    if(near){ for(let k = 0; k < Math.min(60, w/(h*0.22)*3); k++){ const sx = x0 + w*R(), sy = Y - h*0.75*R(), sw = h*rnd(0.15, 0.3); pkEll(x, sx, sy, sw, sw*0.45, pkCss(R() < 0.5 ? stone.dark : stone.lit, 0.45)); }
      for(let k = 0; k < Math.floor(w/(h*0.14)); k++){ const sx = x0 + k*h*0.14, ty = top(k*h*0.14/w); pkPoly(x, [[sx, ty + h*0.05], [sx + h*0.02, ty - h*0.12], [sx + h*0.12, ty - h*0.1], [sx + h*0.13, ty + h*0.05]], pkCss(k % 2 ? stone.body : stone.lit)); } } return; }
  case 'hedge': { // a hedgerow: a long lumpy band of dark green, now and then a tree grown out of it
    const w = h*rnd(4, 8), g = pkMat(c, [44, 82, 46], 0.8), lobes = []; for(let k = 0; k < 9; k++){ const u = k/8 - 0.5; lobes.push([X + u*w, Y - h*rnd(0.35, 0.55), h*rnd(0.4, 0.6)]); }
    pkPoly(x, [[X - w/2 - h*0.3, Y], [X - w/2 - h*0.3, Y - h*0.4], [X + w/2 + h*0.3, Y - h*0.4], [X + w/2 + h*0.3, Y]], pkCss(g.dark)); pkLobes(x, lobes, { ...c, ...g }, RD, X, Y - h*0.5, w*0.5, px);
    if(R() < 0.3) pkTree(x, X + (R() - 0.5)*w*0.6, Y - h*0.2, h*rnd(3, 5), { ...c, ...g, trunk: wood.body }, 'broadleaf', mulberry32((R()*4294967296) >>> 0), px); return; }
  case 'gate': { // a five-bar gate between two thick posts, its diagonal brace
    const w = h*2.8, x0 = X - w/2; for(const s of [0, 1]) box(x0 + s*w - h*0.08, Y - h*1.1, h*0.16, h*1.1, grey, 0.2);
    for(let k = 0; k < 5; k++) ln([[x0 + h*0.1, Y - h*(0.15 + k*0.2)], [x0 + w - h*0.1, Y - h*(0.15 + k*0.2)]], pkCss(k % 2 ? grey.body : grey.lit), h*0.07);
    ln([[x0 + h*0.12, Y - h*0.15], [x0 + w - h*0.12, Y - h*0.95]], pkCss(grey.body), h*0.07); ln([[x0 + w*0.5, Y - h*0.15], [x0 + w*0.5, Y - h*0.95]], pkCss(grey.dark), h*0.05); return; }
  case 'haybale': { // round bales lying in a loose row along the field: the spiral on their ends, some wrapped white or green
    const n = 1 + Math.floor(R()*4), wrap = R() < 0.3 ? pkMat(c, R() < 0.5 ? [232, 232, 226] : [60, 96, 64], 0.7) : null, hay = pkMat(c, [196, 168, 98], 0.7);
    for(let k = 0; k < n; k++){ const bx = X + (k - (n - 1)/2)*h*1.6 + (R() - 0.5)*h*0.4, by = Y + (R() - 0.5)*h*0.1, r = h*0.5, m = wrap || hay;
      pkEll(x, bx - sd*r*0.5, by, r*1.2, r*0.2, pkCss(PK_BLACK, 0.25)); pkShade(x, [[bx - r*1.1, by], [bx - r*1.1, by - r*1.6], [bx + r*0.2, by - r*1.95], [bx + r*0.2, by - r*0.1]], m.dark, by - r*2, by, 0.15);
      pkDisc(x, bx + r*0.35, by - r, r, pkCss(m.body)); pkDisc(x, bx + r*0.35 + sd*r*0.12, by - r*1.08, r*0.7, pkCss(m.lit, 0.6));
      if(near && !wrap){ x.strokeStyle = pkCss(hay.dark, 0.6); x.lineWidth = Math.max(px(0.4), r*0.04); x.beginPath(); for(let q = 0; q < 40; q++){ const a = q*0.45, rr = r*0.9*q/40; q ? x.lineTo(bx + r*0.35 + Math.cos(a)*rr, by - r + Math.sin(a)*rr) : x.moveTo(bx + r*0.35, by - r); } x.stroke(); } } return; }
  case 'haystack': { // a haystack built round its pole: a beehive cone, darker cap, the pole standing out of its top
    const hay = pkMat(c, [180, 150, 86], 0.7), w = h*0.45; pkShade(x, [[X - w, Y], [X - w*0.95, Y - h*0.45], [X - w*0.55, Y - h*0.82], [X, Y - h*0.92], [X + w*0.55, Y - h*0.82], [X + w*0.95, Y - h*0.45], [X + w, Y]], hay.body, Y - h, Y, 0.2);
    pkPoly(x, [[X + sd*w*0.1, Y], [X + sd*w*0.05, Y - h*0.9], [X + sd*w*0.55, Y - h*0.82], [X + sd*w*0.95, Y - h*0.45], [X + sd*w, Y]], pkCss(hay.lit, 0.6)); pkPoly(x, [[X - w*0.55, Y - h*0.8], [X, Y - h*0.92], [X + w*0.55, Y - h*0.8], [X, Y - h*0.75]], pkCss(hay.dark));
    ln([[X, Y - h*0.85], [X + h*0.02, Y - h]], pkCss(grey.dark), h*0.03); if(near){ x.strokeStyle = pkCss(hay.dark, 0.4); x.lineWidth = Math.max(px(0.4), h*0.008); x.beginPath(); for(let k = 0; k < 14; k++){ const u = (k/13 - 0.5)*1.7; x.moveTo(X + u*w*0.6, Y - h*0.75); x.lineTo(X + u*w, Y - h*0.05); } x.stroke(); } return; }
  case 'trough': { const w = h*3.5, gal = pkMat(c, [150, 156, 160], 0.65); box(X - w/2, Y - h, w, h, gal, 0.2); x.fillStyle = pkCss(pkMix(c.air || gal.lit, PK_WHITE, 0.3), 0.9); x.fillRect(X - w/2 + h*0.1, Y - h, w - h*0.2, h*0.1); pkBar(x, X - w/2, Y - h*1.04, w, h*0.06, gal.lit, px); return; }
  case 'pole': { // a utility pole: a tall tapered post, its crossarm, insulators, a transformer now and then, wires sagging away both ways
    const pw = Math.max(px(0.5), h*0.022), lean = (R() - 0.5)*h*0.05, top = [X + lean, Y - h];
    pkShade(x, [[X - pw, Y], [top[0] - pw*0.6, top[1]], [top[0] + pw*0.6, top[1]], [X + pw, Y]], pkMat(c, [100, 78, 56], 0.7).body, top[1], Y, 0.2);
    ln([[top[0] - h*0.1, top[1] + h*0.06], [top[0] + h*0.1, top[1] + h*0.06]], pkCss(grey.dark), h*0.015);
    if(near){ for(const s of [-0.08, 0, 0.08]) pkDisc(x, top[0] + s*h, top[1] + h*0.045, h*0.008, pkCss([150, 190, 170])); if(R() < 0.3){ box(top[0] + pw, top[1] + h*0.15, h*0.05, h*0.08, steel); } }
    if(!c.noWires){ x.strokeStyle = pkCss(PK_BLACK, 0.55); x.lineWidth = Math.max(px(0.3), h*0.003); x.beginPath(); for(const s of [-0.08, 0, 0.08]) for(const d of [-1, 1]){ const ex = top[0] + d*h*1.4; x.moveTo(top[0] + s*h, top[1] + h*0.05); x.quadraticCurveTo((top[0] + ex)/2, top[1] + h*0.17, ex, top[1] + h*0.08); } x.stroke(); } return; }
  case 'lamp': { // a street lamp: a tapered iron post on its plinth, an arm, a lantern head; its pool of light by night
    const pw = Math.max(px(0.5), h*0.022), m = R() < 0.5 ? iron : pkMat(c, PK_GREENPAINT, 0.7); box(X - pw*2.2, Y - h*0.12, pw*4.4, h*0.12, m, 0.2); pkShade(x, [[X - pw*1.3, Y - h*0.1], [X - pw*0.8, Y - h], [X + pw*0.8, Y - h], [X + pw*1.3, Y - h*0.1]], m.body, Y - h, Y, 0.2);
    ln([[X, Y - h*0.97], [X + h*0.1, Y - h*1.01], [X + h*0.2, Y - h*0.97]], pkCss(m.dark), h*0.018);
    pkPoly(x, [[X + h*0.14, Y - h*0.94], [X + h*0.16, Y - h*0.99], [X + h*0.24, Y - h*0.99], [X + h*0.26, Y - h*0.94]], pkCss(m.dark)); pkPoly(x, [[X + h*0.15, Y - h*0.94], [X + h*0.25, Y - h*0.94], [X + h*0.23, Y - h*0.88], [X + h*0.17, Y - h*0.88]], pkCss(glowOn ? lamp : pkMix(m.lit, c.air || m.lit, 0.4)));
    // (by night its light: the glow about the lantern, a cone falling from it, and a pool spread on the ground beneath, wider than tall)
    if(glowOn){ pkGlow(x, X + h*0.2, Y - h*0.9, h*0.4, c.glow, 0.5*night); x.save(); x.globalCompositeOperation = 'screen'; const g = x.createLinearGradient(0, Y - h*0.88, 0, Y); g.addColorStop(0, pkCss(c.glow, 0.22*night)); g.addColorStop(1, pkCss(c.glow, 0.04*night)); x.fillStyle = g;
      x.beginPath(); x.moveTo(X + h*0.16, Y - h*0.88); x.lineTo(X + h*0.24, Y - h*0.88); x.lineTo(X + h*0.75, Y); x.lineTo(X - h*0.35, Y); x.closePath(); x.fill(); x.translate(X + h*0.2, Y); x.scale(1, 0.32); pkGlow(x, 0, 0, h*1.1, c.glow, 0.4*night); x.restore(); } return; }
  case 'bench': { // a park bench: slats on iron ends, a backrest
    const w = h*2.1, m = pkMat(c, R() < 0.5 ? PK_WOOD : PK_GREENPAINT, 0.7); for(const s of [-0.42, 0.42]){ ln([[X + s*w, Y], [X + s*w, Y - h*0.5], [X + s*w - w*0.05, Y - h]], pkCss(iron.body), h*0.06); ln([[X + s*w - w*0.06, Y], [X + s*w + w*0.06, Y - h*0.5]], pkCss(iron.dark), h*0.04); }
    for(let k = 0; k < 3; k++) ln([[X - w/2, Y - h*(0.48 + k*0.035)], [X + w/2, Y - h*(0.48 + k*0.035)]], pkCss(k === 2 ? m.lit : m.body), h*0.04);
    for(let k = 0; k < 3; k++) ln([[X - w*0.48, Y - h*(0.7 + k*0.11)], [X + w*0.48, Y - h*(0.7 + k*0.11)]], pkCss(k === 2 ? m.lit : m.body), h*0.06); return; }
  case 'mailbox': { const m = pkMat(c, R() < 0.6 ? [70, 86, 120] : [200, 196, 186], 0.7); box(X - h*0.04, Y - h*0.65, h*0.08, h*0.65, grey, 0.2);
    pkShade(x, [[X - h*0.3, Y - h*0.62], [X - h*0.3, Y - h*0.82], [X - h*0.2, Y - h*0.95], [X + h*0.2, Y - h*0.95], [X + h*0.3, Y - h*0.82], [X + h*0.3, Y - h*0.62]], m.body, Y - h, Y - h*0.6); pkEll(x, X + sd*h*0.08, Y - h*0.85, h*0.14, h*0.06, pkCss(m.lit, 0.7));
    pkPoly(x, [[X + h*0.26, Y - h*0.82], [X + h*0.26, Y - h*1.02], [X + h*0.36, Y - h*0.98], [X + h*0.3, Y - h*0.92]], pkCss(pkMat(c, PK_REDPAINT, 0.8).body)); return; }
  case 'barrel': { // a steel drum: its rolled ribs, the paint gone to rust in patches, its lid's rim
    const w = h*0.62, m = pkMat(c, [[60, 90, 120], [170, 60, 40], [70, 90, 60], [200, 160, 50]][Math.floor(R()*4)], 0.6), n = R() < 0.4 ? 3 : 1;
    for(let q = 0; q < n; q++){ const bx = X + (q - (n - 1)/2)*w*1.05, by = Y + (q === 1 ? h*0.02 : 0);
      pkShade(x, [[bx - w/2, by], [bx - w/2, by - h], [bx + w/2, by - h], [bx + w/2, by]], m.body, by - h, by, 0.2); pkPoly(x, [[bx + sd*w*0.1, by], [bx + sd*w*0.1, by - h], [bx + sd*w*0.35, by - h], [bx + sd*w*0.35, by]], pkCss(m.lit, 0.55));
      for(const v of [0.33, 0.66]) ln([[bx - w*0.5, by - h*v], [bx + w*0.5, by - h*v]], pkCss(m.dark), h*0.04); pkEll(x, bx, by - h, w*0.5, w*0.12, pkCss(m.dark));
      if(near) for(let k = 0; k < 4; k++) pkEll(x, bx + (R() - 0.5)*w*0.8, by - h*R(), w*0.12, h*0.06, pkCss(rust.body, 0.75)); } return; }
  case 'crate': { // wooden crates: planks and battens, one stacked on another now and then
    const n = R() < 0.4 ? 2 : 1; for(let q = 0; q < n; q++){ const w = h*1.1, bx = X - w/2 + (q ? w*0.15 : 0), by = Y - q*h; box(bx, by - h, w, h, wood, 0.2); side(bx, by - h, w, h, w*0.25, wood);
      if(near){ for(let k = 1; k < 4; k++) pkBar(x, bx, by - h + h*k/4, w, h*0.015, wood.dark, px, 0.5); ln([[bx + w*0.06, by - h*0.06], [bx + w*0.94, by - h*0.94]], pkCss(wood.dark), h*0.06); pkBar(x, bx, by - h, w, h*0.08, wood.lit, px, 0.8); } } return; }
  case 'sign': { // a road sign on its pole: a direction board in green or blue with white letters, an arrow (from behind, its bare back)
    const m = pkMat(c, R() < 0.5 ? [40, 100, 70] : [40, 70, 130], 0.75), w = h*0.7, bh = h*0.28, by = Y - h; box(X - h*0.02, Y - h, h*0.04, h, steel, 0.2);
    if(c.back){ box(X - w/2, by, w, bh, steel, 0.1); pkBar(x, X - h*0.03, by + bh*0.2, h*0.06, bh*0.6, iron.body, px); return; }
    box(X - w/2, by, w, bh, m, 0.1); x.strokeStyle = pkCss(PK_WHITE, 0.85); x.lineWidth = Math.max(px(0.3), bh*0.05); x.strokeRect(X - w/2 + bh*0.06, by + bh*0.06, w - bh*0.12, bh*0.88);
    const dir = R() < 0.5 ? -1 : 1, txt = ['SPINWARD', 'RIMWARD', 'HUBWARD', 'TOWN 3', 'ARCH VIEW', 'NO EXIT'][Math.floor(R()*6)];
    pkType(x, txt, X + dir*-w*0.08, by + bh*0.68, bh*0.42, w*0.65, pkMix(PK_WHITE, m.body, 0.1), px); ln([[X + dir*w*0.3, by + bh*0.5], [X + dir*w*0.42, by + bh*0.5]], pkCss(PK_WHITE, 0.85), bh*0.1); return; }
  case 'milestone': { const m = pkMat(c, [222, 218, 206], 0.7); pkShade(x, [[X - h*0.22, Y], [X - h*0.22, Y - h*0.75], [X, Y - h], [X + h*0.22, Y - h*0.75], [X + h*0.22, Y]], m.body, Y - h, Y, 0.2);
    if(!c.back) pkType(x, String(1 + Math.floor(R()*99)), X, Y - h*0.45, h*0.28, h*0.4, PK_BLACK, px); return; }
  case 'cairn': { // stones stacked, smaller upward
    // (each stone its own rough block, set a little off the one below, its top catching the light)
    let cy = Y, ox = 0; for(let k = 0, n = 4 + Math.floor(R()*4); k < n; k++){ const u = k/n, w = h*0.5*(1 - u*0.65)*(0.8 + 0.4*R()), th = h/n*(0.9 + 0.3*R()); ox += (R() - 0.5)*w*0.3; const cx = X + ox, j = () => (R() - 0.5)*w*0.12;
      pkPoly(x, [[cx - w + j(), cy], [cx - w*0.9 + j(), cy - th*0.75], [cx - w*0.4 + j(), cy - th], [cx + w*0.5 + j(), cy - th*0.95], [cx + w + j(), cy - th*0.5], [cx + w*0.9 + j(), cy]], pkCss(R() < 0.3 ? stone.dark : pkMix(stone.dark, stone.body, 0.5)));
      pkPoly(x, [[cx - w*0.4, cy - th], [cx + w*0.5, cy - th*0.95], [cx + sd*w*0.7, cy - th*0.7], [cx - sd*w*0.1, cy - th*0.75]], pkCss(stone.lit, 0.8)); cy -= th*0.92; } return; }
  case 'scarecrow': { // a scarecrow: a T of pole and crossbar, sack head, hat, ragged shirt; a crow on its arm
    const cloth = pkMat(c, [[120, 60, 50], [70, 90, 120], [130, 120, 80]][Math.floor(R()*3)], 0.7), sack = pkMat(c, [196, 176, 130], 0.7);
    ln([[X, Y], [X, Y - h*0.95]], pkCss(grey.dark), h*0.04); ln([[X - h*0.38, Y - h*0.7], [X + h*0.38, Y - h*0.72]], pkCss(grey.dark), h*0.035);
    pkPoly(x, [[X - h*0.35, Y - h*0.73], [X + h*0.35, Y - h*0.75], [X + h*0.2, Y - h*0.6], [X + h*0.14, Y - h*0.35], [X + h*0.06, Y - h*0.38], [X, Y - h*0.33], [X - h*0.08, Y - h*0.37], [X - h*0.15, Y - h*0.34], [X - h*0.2, Y - h*0.6]], pkCss(cloth.body));
    pkDisc(x, X, Y - h*0.82, h*0.08, pkCss(sack.body)); pkPoly(x, [[X - h*0.14, Y - h*0.87], [X + h*0.14, Y - h*0.87], [X + h*0.06, Y - h*0.9], [X + h*0.04, Y - h*1.0], [X - h*0.06, Y - h*0.99], [X - h*0.07, Y - h*0.9]], pkCss(pkMix(grey.dark, PK_BLACK, 0.3)));
    if(R() < 0.6) pkPoly(x, [[X + h*0.28, Y - h*0.75], [X + h*0.3, Y - h*0.8], [X + h*0.35, Y - h*0.81], [X + h*0.37, Y - h*0.76]], pkCss(PK_BLACK, 0.85)); return; }
  case 'beehives': { // a row of hive boxes, each stacked of two or three, a lid overhanging, each its own pastel
    const n = 2 + Math.floor(R()*4), P = [[220, 210, 170], [170, 200, 190], [210, 180, 170], [190, 200, 220], [230, 230, 220]];
    for(let k = 0; k < n; k++){ const bx = X + (k - (n - 1)/2)*h*0.9, m = pkMat(c, P[Math.floor(R()*P.length)], 0.7), st = 2 + Math.floor(R()*2), bh = h/st*0.85;
      for(let q = 0; q < st; q++) box(bx - h*0.3, Y - bh*(q + 1) - h*0.08, h*0.6, bh, q % 2 ? m : { ...m, body: pkMix(m.body, m.lit, 0.4) }, 0.15);
      pkBar(x, bx - h*0.35, Y - bh*st - h*0.12, h*0.7, h*0.06, m.dark, px); pkBar(x, bx - h*0.12, Y - h*0.14, h*0.24, h*0.02, PK_BLACK, px, 0.8); box(bx - h*0.3, Y - h*0.08, h*0.6, h*0.08, grey); } return; }
  case 'well': case 'wishing': { // a village well: a drum of stone, two posts, a little gable roof, the windlass, the bucket; the wishing
    // well's flowers and the glow rising from its shaft
    const w = h*0.42, m = stone; pkShade(x, [[X - w, Y], [X - w, Y - h*0.35], [X + w, Y - h*0.35], [X + w, Y]], m.body, Y - h*0.35, Y, 0.2); pkEll(x, X, Y - h*0.35, w, h*0.06, pkCss(m.lit));
    pkEll(x, X, Y - h*0.35, w*0.8, h*0.04, pkCss(PK_BLACK, 0.8)); if(near){ for(let k = 0; k < 10; k++) pkBar(x, X - w + (k % 5)*w*0.4 + (Math.floor(k/5) % 2)*w*0.2, Y - h*(0.08 + Math.floor(k/5)*0.12), w*0.04, h*0.08, m.dark, px, 0.4); }
    for(const s of [-1, 1]) box(X + s*w*0.85 - h*0.03, Y - h*0.82, h*0.06, h*0.5, grey, 0.2); ln([[X - w*0.85, Y - h*0.62], [X + w*0.85, Y - h*0.62]], pkCss(grey.dark), h*0.03); ln([[X, Y - h*0.62], [X, Y - h*0.48]], pkCss(PK_IRON), h*0.01); box(X - h*0.05, Y - h*0.5, h*0.1, h*0.08, wood);
    pkPoly(x, [[X - w*1.2, Y - h*0.78], [X, Y - h], [X + w*1.2, Y - h*0.78]], pkCss(pkMat(c, kind === 'wishing' ? [90, 70, 110] : PK_SLATE, 0.6).dark)); pkPoly(x, [[X, Y - h], [X + sd*w*1.2, Y - h*0.78], [X, Y - h*0.78]], pkCss(pkMat(c, kind === 'wishing' ? [90, 70, 110] : PK_SLATE, 0.6).body));
    if(kind === 'wishing'){ pkGlow(x, X, Y - h*0.4, h*0.6, c.glow, 0.35 + 0.35*night); for(let k = 0; k < 12; k++) pkDisc(x, X + (RD() - 0.5)*w*2.4, Y - h*0.3*RD(), Math.max(px(0.5), h*0.02), pkCss(pkMat(c, [[220, 110, 150], [240, 230, 240], [170, 120, 220]][k % 3], 0.8).body)); for(let k = 0; k < 4; k++) pkDisc(x, X + (RD() - 0.5)*w, Y - h*(0.45 + 0.4*RD()), Math.max(px(0.5), h*0.01), pkCss(pkMix(c.glow, PK_WHITE, 0.6), 0.9)); }
    return; }
  case 'windpump': { // a farm windpump: a lattice tower, braced, a wheel of many blades, its tail vane, the tank at its foot
    const tw = h*0.22, top = Y - h*0.82; x.strokeStyle = pkCss(steel.dark); x.lineWidth = Math.max(px(0.4), h*0.008); x.beginPath(); x.moveTo(X - tw, Y); x.lineTo(X - tw*0.15, top); x.moveTo(X + tw, Y); x.lineTo(X + tw*0.15, top);
    for(let k = 0; k < 4; k++){ const y0 = Y - (Y - top)*k/4, y1 = Y - (Y - top)*(k + 1)/4, k0 = 1 - 0.85*k/4, k1 = 1 - 0.85*(k + 1)/4; x.moveTo(X - tw*k0, y0); x.lineTo(X + tw*k1, y1); x.moveTo(X + tw*k0, y0); x.lineTo(X - tw*k1, y1); } x.stroke();
    const hx = X + sd*h*0.03, hy = top - h*0.05, r = h*0.15; for(let k = 0; k < 16; k++){ const a = k/16*Math.PI*2; pkPoly(x, [[hx + Math.cos(a)*r*0.25, hy + Math.sin(a)*r*0.25], [hx + Math.cos(a)*r, hy + Math.sin(a)*r], [hx + Math.cos(a + 0.25)*r, hy + Math.sin(a + 0.25)*r]], pkCss(k % 2 ? steel.body : steel.lit)); }
    pkPoly(x, [[hx - sd*h*0.02, hy], [hx - sd*h*0.22, hy - h*0.06], [hx - sd*h*0.22, hy + h*0.03]], pkCss(steel.body)); pkDisc(x, hx, hy, r*0.12, pkCss(steel.dark));
    box(X + tw*1.2, Y - h*0.12, h*0.3, h*0.12, steel, 0.2); return; }
  case 'tractor': { // a tractor: its big rear wheel and small front one, a long hood, the cab with its window, the exhaust stack
    const m = pkMat(c, [[170, 50, 40], [60, 110, 60], [50, 80, 140], [210, 170, 50]][Math.floor(R()*4)], 0.75), d = R() < 0.5 ? 1 : -1, L = h*1.6, P = (u, v) => [X + d*u*L, Y - v*h];
    pkPoly(x, [P(-0.45, 0.5), P(-0.45, 0.62), P(0.05, 0.62), P(0.48, 0.55), P(0.48, 0.32), P(-0.1, 0.32)], pkCss(m.body)); pkPoly(x, [P(-0.45, 0.62), P(-0.42, 1), P(-0.12, 1), P(-0.1, 0.62)], pkCss(pkMix(m.dark, PK_BLACK, 0.2)));
    pkPoly(x, [P(-0.4, 0.66), P(-0.38, 0.95), P(-0.16, 0.95), P(-0.15, 0.66)], pkCss(pkMix(c.air || m.lit, PK_BLACK, 0.3), 0.85)); ln([P(0.3, 0.6), P(0.3, 0.92)], pkCss(PK_IRON), h*0.04);
    wheel(P(-0.3, 0.32)[0], Y - h*0.32, h*0.32, steel); wheel(P(0.38, 0.17)[0], Y - h*0.17, h*0.17, steel); return; }
  case 'grainbin': { // corrugated grain bins in a row, shallow cone roofs, a ladder up one, the auger
    const n = 1 + Math.floor(R()*3), r = h*0.42; for(let k = 0; k < n; k++){ const bx = X + (k - (n - 1)/2)*r*2.3, wall = Y - h*0.72;
      pkShade(x, [[bx - r, Y], [bx - r, wall], [bx + r, wall], [bx + r, Y]], steel.body, wall, Y, 0.15); pkPoly(x, [[bx + sd*r*0.1, Y], [bx + sd*r*0.1, wall], [bx + sd*r*0.6, wall], [bx + sd*r*0.6, Y]], pkCss(steel.lit, 0.6));
      if(near){ x.fillStyle = pkCss(steel.dark, 0.3); for(let q = 0; q < 12; q++) x.fillRect(bx - r + q*r/6, wall, Math.max(px(0.3), r*0.01), Y - wall); }
      pkPoly(x, [[bx - r*1.05, wall], [bx, Y - h], [bx + r*1.05, wall]], pkCss(steel.dark)); pkPoly(x, [[bx, Y - h], [bx + sd*r*1.05, wall], [bx, wall]], pkCss(steel.body)); box(bx - r*0.1, Y - h*1.03, r*0.2, h*0.04, steel); }
    ln([[X - n*r, Y], [X + n*r*0.6, Y - h*0.95]], pkCss(steel.dark), h*0.03); return; }
  case 'shrine': { // a wayside shrine: a pillar, a box with its dark niche, a little roof, a finial; flowers at its foot
    const m = pkMat(c, [226, 220, 206], 0.6); box(X - h*0.08, Y - h*0.6, h*0.16, h*0.6, m, 0.2); box(X - h*0.14, Y - h*0.88, h*0.28, h*0.28, m, 0.15);
    pkPoly(x, [[X - h*0.08, Y - h*0.64], [X - h*0.08, Y - h*0.78], [X, Y - h*0.83], [X + h*0.08, Y - h*0.78], [X + h*0.08, Y - h*0.64]], pkCss(PK_BLACK, 0.75)); pkDisc(x, X, Y - h*0.7, h*0.02, pkCss(glowOn ? lamp : [200, 160, 80]));
    pkPoly(x, [[X - h*0.2, Y - h*0.86], [X, Y - h*0.98], [X + h*0.2, Y - h*0.86]], pkCss(pkMat(c, PK_TERRA, 0.7).body)); ln([[X, Y - h*0.98], [X, Y - h]], pkCss(PK_IRON), h*0.02);
    for(let k = 0; k < 6; k++) pkDisc(x, X + (RD() - 0.5)*h*0.4, Y - h*0.03*RD(), Math.max(px(0.4), h*0.02), pkCss(pkMat(c, [[220, 80, 90], [240, 220, 120], [240, 240, 230]][k % 3], 0.8).body)); return; }
  case 'busstop': { // a bus shelter: a thin roof on two posts, a glass back, a bench, a lit panel at one end, the stop's sign
    const w = h*1.4, m = pkMat(c, [70, 76, 84], 0.7); pkPoly(x, [[X - w/2, Y - h*0.25], [X - w/2, Y - h*0.92], [X + w/2, Y - h*0.92], [X + w/2, Y - h*0.25]], pkCss(pkMix(c.air || m.lit, PK_WHITE, 0.2), 0.35));
    for(const s of [-0.5, 0.5]) box(X + s*w - h*0.02, Y - h*0.95, h*0.04, h*0.95, m); pkBar(x, X - w*0.55, Y - h*0.98, w*1.1, h*0.05, m.dark, px);
    box(X + w*0.32, Y - h*0.85, w*0.18, h*0.7, { body: glowOn ? lamp : pkMix(m.lit, [230, 200, 160], 0.5) }, 0.05); ln([[X - w*0.4, Y - h*0.35], [X + w*0.28, Y - h*0.35]], pkCss(m.body), h*0.04);
    box(X - w*0.75, Y - h*1.05, h*0.03, h*1.05, steel); pkDisc(x, X - w*0.75 + h*0.015, Y - h*1.05, h*0.1, pkCss(pkMat(c, [40, 80, 150], 0.7).body)); return; }
  case 'phonebox': { // a red telephone box: its domed top, the crown, small panes, the lit sign band
    const w = h*0.38, m = pkMat(c, PK_REDPAINT, 0.75); box(X - w/2, Y - h*0.9, w, h*0.9, m, 0.18); pkEll(x, X, Y - h*0.9, w*0.55, h*0.07, pkCss(m.body)); pkDisc(x, X, Y - h*0.97, w*0.08, pkCss(m.lit));
    pkBar(x, X - w*0.42, Y - h*0.86, w*0.84, h*0.05, glowOn ? lamp : PK_WHITE, px, 0.8);
    if(near){ x.fillStyle = pkCss(glowOn ? pkMix(c.glow, PK_WHITE, 0.4) : pkMix(c.air || m.lit, PK_BLACK, 0.3), 0.85); for(let r = 0; r < 6; r++) for(let k = 0; k < 3; k++) x.fillRect(X - w*0.36 + k*w*0.25, Y - h*0.78 + r*h*0.1, w*0.2, h*0.08); } return; }
  case 'vending': { // vending machines side by side: an upper window lit with rows of coloured drinks, the slot, a glow by night
    const n = 1 + Math.floor(R()*3), w = h*0.55; for(let k = 0; k < n; k++){ const bx = X + (k - (n - 1)/2)*w*1.05, m = pkMat(c, [[230, 230, 236], [180, 40, 40], [40, 90, 160], [240, 190, 40]][Math.floor(R()*4)], 0.6);
      box(bx - w/2, Y - h, w, h, m, 0.12); if(c.back){ for(let r = 0; r < 5; r++) pkBar(x, bx - w*0.3, Y - h*(0.85 - r*0.06), w*0.6, h*0.02, m.dark, px, 0.7); if(near) ln([[bx + w*0.3, Y - h*0.3], [bx + w*0.42, Y - h*0.1], [bx + w*0.5, Y]], pkCss(PK_BLACK, 0.8), h*0.015); continue; }
      pkPoly(x, [[bx - w*0.4, Y - h*0.92], [bx + w*0.4, Y - h*0.92], [bx + w*0.4, Y - h*0.45], [bx - w*0.4, Y - h*0.45]], pkCss(glowOn ? pkMix(lamp, PK_WHITE, 0.3) : pkMix(c.air || m.lit, PK_WHITE, 0.2)));
      if(near) for(let r = 0; r < 4; r++) for(let q = 0; q < 5; q++) pkBar(x, bx - w*0.36 + q*w*0.15, Y - h*(0.88 - r*0.11), w*0.09, h*0.07, [[200, 40, 50], [40, 120, 200], [240, 200, 60], [60, 160, 90], [240, 240, 240]][(q + r*2) % 5], px, 0.9);
      pkBar(x, bx - w*0.3, Y - h*0.2, w*0.6, h*0.08, PK_BLACK, px, 0.7); if(glowOn) pkGlow(x, bx, Y - h*0.6, h*0.8, pkMix(lamp, PK_WHITE, 0.3), 0.35*night); } return; }
  case 'signal': { // a traffic light: its pole, a dark head of three lamps, one of them lit
    const m = pkMat(c, [40, 42, 40], 0.7), hw = h*0.12; box(X - h*0.015, Y - h*0.72, h*0.03, h*0.72, m); box(X - hw/2, Y - h, hw, h*0.32, m, 0.1);
    const on = Math.floor(R()*3), col = [[255, 70, 50], [255, 190, 40], [60, 230, 120]]; for(let k = 0; k < 3; k++){ const ly = Y - h*(0.94 - k*0.1); pkDisc(x, X, ly, hw*0.32, pkCss(k === on ? col[k] : pkMix(col[k], PK_BLACK, 0.75))); if(k === on) pkGlow(x, X, ly, hw*1.5, col[k], 0.3 + 0.4*night); } return; }
  case 'kiosk': { // a kiosk: a round drum under a dome cap, posters round it, an awning
    const w = h*0.42, m = pkMat(c, PK_GREENPAINT, 0.7); box(X - w/2, Y - h*0.82, w, h*0.82, m, 0.15); pkEll(x, X, Y - h*0.84, w*0.62, h*0.05, pkCss(m.dark)); x.fillStyle = pkCss(m.body); x.beginPath(); x.ellipse(X, Y - h*0.86, w*0.45, h*0.14, 0, Math.PI, 0); x.fill();
    if(near) for(let k = 0; k < 3; k++) pkBar(x, X - w*0.4 + k*w*0.27, Y - h*0.7, w*0.24, h*0.32, [[230, 200, 120], [200, 90, 80], [120, 160, 200]][(k + Math.floor(R()*3)) % 3], px, 0.85); return; }
  case 'cart': { // a food cart: a box on two wheels, its umbrella, steam, a lantern by night
    const w = h*0.75, m = pkMat(c, [[200, 60, 50], [230, 220, 200], [60, 120, 160]][Math.floor(R()*3)], 0.7); box(X - w/2, Y - h*0.48, w, h*0.36, m, 0.15); wheel(X - w*0.25, Y - h*0.1, h*0.1, steel); wheel(X + w*0.25, Y - h*0.1, h*0.1, steel);
    ln([[X, Y - h*0.48], [X, Y - h*0.88]], pkCss(steel.dark), h*0.02); const um = pkMat(c, [[220, 70, 60], [240, 220, 120]][Math.floor(R()*2)], 0.75); x.fillStyle = pkCss(um.body); x.beginPath(); x.ellipse(X, Y - h*0.86, w*0.75, h*0.14, 0, Math.PI, 0); x.fill();
    for(let k = 0; k < 3; k++) pkDisc(x, X - w*0.2 + k*w*0.05, Y - h*(0.55 + k*0.08), h*(0.05 + k*0.02), pkCss(PK_WHITE, 0.25 - k*0.06)); if(glowOn){ pkDisc(x, X + w*0.45, Y - h*0.72, h*0.04, pkCss(lamp)); pkGlow(x, X + w*0.45, Y - h*0.72, h*0.4, c.glow, 0.45*night); } return; }
  case 'parked': case 'hulk': { // a parked car (or, in the ruins, its rusted hulk: no glass, flat tyres, rust, sunk)
    const hulk = kind === 'hulk', m = hulk ? rust : pkMat(c, [[180, 40, 40], [40, 60, 110], [210, 210, 214], [30, 32, 36], [120, 130, 100], [200, 170, 70]][Math.floor(R()*6)], 0.7), L = h*3, d = R() < 0.5 ? 1 : -1, P = (u, v) => [X + d*u*L, Y - v*h + (hulk ? h*0.08 : 0)];
    pkShade(x, [P(-0.5, 0.15), P(-0.5, 0.5), P(-0.3, 0.55), P(-0.18, 0.95), P(0.2, 0.95), P(0.32, 0.55), P(0.5, 0.48), P(0.5, 0.15)], m.body, Y - h, Y, 0.18);
    pkPoly(x, [P(-0.14, 0.9), P(0.17, 0.9), P(0.27, 0.57), P(-0.25, 0.57)], pkCss(hulk ? PK_BLACK : pkMix(c.air || m.lit, PK_BLACK, 0.35), hulk ? 0.75 : 0.9)); ln([P(0.02, 0.9), P(0.02, 0.57)], pkCss(m.body), h*0.04);
    if(!hulk) ln([P(-0.5, 0.35), P(0.5, 0.35)], pkCss(m.lit, 0.7), h*0.03); if(hulk && near) for(let k = 0; k < 5; k++) pkEll(x, X + (R() - 0.5)*L*0.8, Y - h*(0.25 + 0.4*R()), h*0.15, h*0.08, pkCss(pkMix(rust.dark, PK_BLACK, 0.2), 0.7));
    for(const u of [-0.32, 0.32]) hulk ? pkEll(x, P(u, 0)[0], Y - h*0.08, h*0.2, h*0.1, pkCss(PK_BLACK, 0.8)) : wheel(P(u, 0)[0], Y - h*0.16, h*0.17, steel);
    if(!hulk && glowOn && R() < 0.3) pkGlow(x, P(0.5, 0.4)[0], Y - h*0.4, h*0.5, [255, 230, 180], 0.4*night); return; }
  case 'scooter': { const m = pkMat(c, [[200, 60, 50], [240, 230, 210], [80, 140, 120], [40, 40, 44]][Math.floor(R()*4)], 0.7), d = R() < 0.5 ? 1 : -1;
    wheel(X - d*h*0.5, Y - h*0.17, h*0.17, steel); wheel(X + d*h*0.5, Y - h*0.17, h*0.17, steel); pkPoly(x, [[X - d*h*0.6, Y - h*0.3], [X - d*h*0.55, Y - h*0.6], [X - d*h*0.1, Y - h*0.62], [X - d*h*0.05, Y - h*0.3]], pkCss(m.body));
    ln([[X - d*h*0.05, Y - h*0.3], [X + d*h*0.45, Y - h*0.3], [X + d*h*0.4, Y - h*1.0]], pkCss(m.body), h*0.07); ln([[X + d*h*0.3, Y - h*1.0], [X + d*h*0.5, Y - h*1.0]], pkCss(PK_IRON), h*0.04); return; }
  case 'bicycle': { // a bicycle: two wheels with their spokes, the frame's diamond, saddle, bars
    const r = h*0.33, m = pkMat(c, [[40, 70, 120], [170, 40, 40], [40, 40, 44], [60, 120, 90]][Math.floor(R()*4)], 0.7); x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.035);
    for(const s of [-1, 1]){ x.beginPath(); x.arc(X + s*h*0.55, Y - r, r, 0, Math.PI*2); x.stroke(); if(near){ x.save(); x.lineWidth = Math.max(px(0.3), h*0.006); x.strokeStyle = pkCss(steel.lit, 0.6); x.beginPath(); for(let k = 0; k < 8; k++){ const a = k/8*Math.PI; x.moveTo(X + s*h*0.55 + Math.cos(a)*r, Y - r + Math.sin(a)*r); x.lineTo(X + s*h*0.55 - Math.cos(a)*r, Y - r - Math.sin(a)*r); } x.stroke(); x.restore(); } }
    ln([[X - h*0.55, Y - r], [X - h*0.1, Y - h*0.75], [X + h*0.35, Y - h*0.75], [X + h*0.55, Y - r], [X, Y - r], [X - h*0.1, Y - h*0.75]], pkCss(m.body), h*0.05);
    ln([[X - h*0.18, Y - h*0.82], [X - h*0.02, Y - h*0.82]], pkCss(PK_BLACK), h*0.05); ln([[X + h*0.35, Y - h*0.75], [X + h*0.32, Y - h*0.95], [X + h*0.42, Y - h*0.95]], pkCss(PK_IRON), h*0.04); return; }
  case 'hydrant': { const w = h*0.4, m = pkMat(c, [[196, 52, 44], [220, 190, 50]][Math.floor(R()*2)], 0.8); box(X - w/2, Y - h*0.75, w, h*0.75, m, 0.2); x.fillStyle = pkCss(m.body); x.beginPath(); x.ellipse(X, Y - h*0.76, w*0.5, h*0.18, 0, Math.PI, 0); x.fill();
    pkEll(x, X, Y - h*0.45, w*0.8, h*0.08, pkCss(m.dark)); for(const s of [-1, 1]) pkDisc(x, X + s*w*0.62, Y - h*0.55, w*0.18, pkCss(m.dark)); pkDisc(x, X, Y - h*0.97, w*0.12, pkCss(m.dark)); box(X - w*0.65, Y - h*0.08, w*1.3, h*0.08, m); return; }
  case 'rubble': { // a heap of broken concrete: angular slabs in two tones, rebar standing out
    const w = h*2.2, con = pkMat(c, PK_CONCRETE, 0.7); for(let k = 0; k < 9; k++){ const u = (R() - 0.5)*w*0.9, v = (1 - Math.abs(u)/(w*0.5))*h*0.8*R(), s0 = h*rnd(0.15, 0.4);
      pkPoly(x, [[X + u - s0, Y - v + s0*0.3], [X + u - s0*0.6, Y - v - s0*0.6], [X + u + s0*0.7, Y - v - s0*0.4], [X + u + s0, Y - v + s0*0.4]], pkCss(R() < 0.5 ? con.body : R() < 0.5 ? con.dark : con.lit)); }
    x.strokeStyle = pkCss(rust.body); x.lineWidth = Math.max(px(0.3), h*0.02); x.beginPath(); for(let k = 0; k < 4; k++){ const u = (R() - 0.5)*w*0.6; x.moveTo(X + u, Y - h*0.4); x.lineTo(X + u + (R() - 0.5)*h*0.5, Y - h*(0.6 + 0.5*R())); } x.stroke(); return; }
  case 'column': { // a broken column: fluted, its break slanting, a drum fallen beside it
    const w = h*0.22, m = pkMat(c, [220, 212, 196], 0.6), bt = Y - h*(0.85 + 0.15*R()), sl = h*0.12*(R() < 0.5 ? 1 : -1);
    box(X - w*0.8, Y - h*0.08, w*1.6, h*0.08, m); pkShade(x, [[X - w/2, Y - h*0.08], [X - w/2, bt + Math.max(0, sl)], [X + w/2, bt + Math.max(0, -sl)], [X + w/2, Y - h*0.08]], m.body, bt, Y, 0.15);
    if(near){ x.fillStyle = pkCss(m.dark, 0.35); for(let k = 1; k < 6; k++) x.fillRect(X - w/2 + w*k/6, bt + Math.abs(sl), Math.max(px(0.3), w*0.04), Y - bt - Math.abs(sl) - h*0.08); }
    pkEll(x, X + w*1.8, Y - w*0.45, w*0.55, w*0.45, pkCss(m.dark)); pkEll(x, X + w*1.8 + sd*w*0.1, Y - w*0.45, w*0.4, w*0.38, pkCss(m.body)); return; }
  case 'statue': { // a toppled statue: the empty plinth, the figure lying beside it, an arm raised to nobody, its head rolled away
    const m = pkMat(c, R() < 0.5 ? [120, 140, 120] : [210, 204, 190], 0.65), w = h*1.2; box(X - w*0.25, Y - h*0.45, w*0.5, h*0.45, stone, 0.18);
    pkPoly(x, [[X + w*0.3, Y], [X + w*0.35, Y - h*0.18], [X + w*1.25, Y - h*0.14], [X + w*1.3, Y]], pkCss(m.body)); ln([[X + w*0.8, Y - h*0.15], [X + w*0.85, Y - h*0.45]], pkCss(m.body), h*0.07);
    pkDisc(x, X - w*0.6, Y - h*0.1, h*0.1, pkCss(m.body)); return; }
  case 'container': { // a shipping container: corrugated, its door end with locking bars; one stacked on another now and then
    const m = pkMat(c, [[170, 60, 40], [40, 80, 130], [60, 110, 70], [150, 150, 140], [200, 140, 40]][Math.floor(R()*5)], 0.6), w = h*(R() < 0.5 ? 2.35 : 4.7), st = R() < 0.3 ? 2 : 1;
    for(let q = 0; q < st; q++){ const by = Y - q*h, mm = q ? pkMat(c, [[40, 80, 130], [150, 150, 140]][q % 2], 0.6) : m; box(X - w/2, by - h, w, h, mm, 0.2);
      if(near){ x.fillStyle = pkCss(mm.dark, 0.4); for(let k = 0; k < w/(h*0.08); k++) x.fillRect(X - w/2 + k*h*0.08, by - h, Math.max(px(0.3), h*0.02), h); for(const s of [0.2, 0.4]) pkBar(x, X + sd*w*0.5 - sd*w*0.05*s*5, by - h*0.95, h*0.02, h*0.9, mm.dark, px); }
      pkStreaks(x, X - w/2, by - h, w, h, { ...c, dark: PK_RUST }, R, px, 0.25); } return; }
  case 'traps': { // tank traps: stars of three beams in a line across the way
    for(let k = 0; k < 3; k++){ const tx = X + (k - 1)*h*1.4; for(const a of [0.5, -0.5, 0]) ln([[tx - Math.cos(a)*h*0.5, Y - (0.5 - Math.sin(a)*0.5)*h], [tx + Math.cos(a)*h*0.5, Y - (0.5 + Math.sin(a)*0.5)*h]], pkCss(a ? rust.body : rust.dark), h*0.1); } return; }
  case 'cargo': { // the builders' cargo: chamfered boxes banded with hazard stripes, a tag glowing on each
    const m = pkMat(c, [210, 212, 216], 0.5), n = 1 + Math.floor(R()*3); for(let k = 0; k < n; k++){ const w = h*1.2, bx = X + (k - (n - 1)/2)*w*1.05 - w/2, by = Y - (k === 1 && n === 3 ? 0 : 0);
      pkShade(x, [[bx, by], [bx, by - h*0.85], [bx + w*0.08, by - h], [bx + w*0.92, by - h], [bx + w, by - h*0.85], [bx + w, by]], m.body, by - h, by, 0.15);
      if(near){ for(let q = 0; q < 8; q++) pkPoly(x, [[bx + w*q/8, by - h*0.12], [bx + w*(q + 0.5)/8, by - h*0.12], [bx + w*(q + 0.2)/8, by - h*0.22], [bx + w*(q - 0.3)/8, by - h*0.22]].map(([a, b]) => [Math.max(bx, Math.min(bx + w, a)), b]), pkCss(q % 2 ? [40, 40, 40] : [230, 180, 40])); }
      pkDisc(x, bx + w*0.8, by - h*0.6, h*0.04, pkCss(pkMix(c.glow, PK_WHITE, 0.4))); pkGlow(x, bx + w*0.8, by - h*0.6, h*0.2, c.glow, 0.4); } return; }
  case 'solar': { // a solar field: rows of dark blue panels all at one tilt on their legs, a pale grid across them
    const n = 3 + Math.floor(R()*3), pv = pkMat(c, [36, 50, 90], 0.75); for(let k = n - 1; k >= 0; k--){ const ry = Y - k*h*0.45, w = h*5*(1 - k*0.05), x0 = X - w/2 + k*h*0.2;
      ln([[x0 + w*0.1, ry], [x0 + w*0.1, ry - h*0.5]], pkCss(steel.dark), h*0.03); ln([[x0 + w*0.9, ry], [x0 + w*0.9, ry - h*0.5]], pkCss(steel.dark), h*0.03);
      const pts = [[x0, ry - h*0.4], [x0 + h*0.25, ry - h], [x0 + w + h*0.25, ry - h], [x0 + w, ry - h*0.4]]; pkPoly(x, pts, pkCss(pv.body));
      const g = x.createLinearGradient(x0, ry - h, x0 + w, ry - h*0.4); g.addColorStop(0, pkCss(c.air || pv.lit, 0.35)); g.addColorStop(0.5, pkCss(c.air || pv.lit, 0.05)); g.addColorStop(1, pkCss(c.air || pv.lit, 0.25)); pkPoly(x, pts, g);
      if(near){ x.strokeStyle = pkCss(pkMix(pv.lit, PK_WHITE, 0.4), 0.5); x.lineWidth = Math.max(px(0.3), h*0.01); x.beginPath(); for(let q = 1; q < 10; q++){ x.moveTo(x0 + w*q/10, ry - h*0.4); x.lineTo(x0 + w*q/10 + h*0.25, ry - h); } x.moveTo(x0 + h*0.125, ry - h*0.7); x.lineTo(x0 + w + h*0.125, ry - h*0.7); x.stroke(); } } return; }
  case 'dish': { // an antenna dish: its lattice mount, the parabola tipped to the sky, the feed horn on its struts
    const m = pkMat(c, [228, 228, 224], 0.5), r = h*0.45; pkPoly(x, [[X - h*0.15, Y], [X - h*0.05, Y - h*0.45], [X + h*0.05, Y - h*0.45], [X + h*0.15, Y]], pkCss(steel.dark));
    x.save(); x.translate(X, Y - h*0.55); x.rotate(-0.5*sd); x.fillStyle = pkCss(m.dark); x.beginPath(); x.ellipse(0, 0, r, r*0.35, 0, 0, Math.PI*2); x.fill(); x.fillStyle = pkCss(m.body); x.beginPath(); x.ellipse(0, -r*0.03, r*0.92, r*0.3, 0, 0, Math.PI*2); x.fill();
    x.strokeStyle = pkCss(steel.dark); x.lineWidth = Math.max(px(0.4), r*0.02); x.beginPath(); for(const s of [-0.7, 0, 0.7]){ x.moveTo(s*r, -s*s*r*0.05); x.lineTo(0, -r*0.75); } x.stroke(); pkDisc(x, 0, -r*0.75, r*0.05, pkCss(steel.dark)); x.restore(); return; }
  case 'beacon': { // a relay beacon: a slim mast, a glowing orb at its tip in rings of light
    const m = pkMat(c, [230, 232, 236], 0.5); pkShade(x, [[X - h*0.025, Y], [X - h*0.012, Y - h*0.9], [X + h*0.012, Y - h*0.9], [X + h*0.025, Y]], m.body, Y - h, Y, 0.1);
    pkDisc(x, X, Y - h*0.94, h*0.05, pkCss(pkMix(c.glow, PK_WHITE, 0.5))); pkGlow(x, X, Y - h*0.94, h*0.3, c.glow, 0.6); x.strokeStyle = pkCss(c.glow, 0.6); x.lineWidth = Math.max(px(0.4), h*0.006);
    for(const r of [0.09, 0.14]){ x.beginPath(); x.ellipse(X, Y - h*0.94, h*r, h*r*0.25, 0, 0, Math.PI*2); x.stroke(); } return; }
  case 'pipes': { // a run of pipes on their frames, flanged, a valve wheel
    const w = h*4, m = pkMat(c, [[180, 186, 190], [170, 110, 60]][Math.floor(R()*2)], 0.6); for(let k = 0; k < 4; k++) ln([[X - w/2 + k*w/3, Y], [X - w/2 + k*w/3, Y - h*0.75]], pkCss(steel.dark), h*0.05);
    for(let q = 0; q < 2; q++){ const py = Y - h*(0.6 + q*0.28), pr = h*0.12; pkShade(x, [[X - w/2, py + pr], [X - w/2, py - pr], [X + w/2, py - pr], [X + w/2, py + pr]], m.body, py - pr, py + pr, 0.3); pkBar(x, X - w/2, py - pr*0.6, w, pr*0.3, m.lit, px, 0.6);
      for(let k = 0; k < 5; k++) pkBar(x, X - w/2 + k*w/4 - pr*0.15, py - pr*1.2, pr*0.3, pr*2.4, m.dark, px); }
    x.strokeStyle = pkCss(PK_REDPAINT); x.lineWidth = Math.max(px(0.3), h*0.03); x.beginPath(); x.arc(X + w*0.15, Y - h*1.02, h*0.1, 0, Math.PI*2); x.stroke(); return; }
  case 'tripod': { // a surveyor's tripod, its instrument, a little flag on a stake nearby
    for(const s of [-1, 0.3, 1]) ln([[X, Y - h*0.82], [X + s*h*0.28, Y]], pkCss(pkMat(c, [200, 170, 60], 0.7).body), h*0.04); box(X - h*0.08, Y - h, h*0.16, h*0.18, pkMat(c, [230, 200, 60], 0.7), 0.15);
    ln([[X + h*0.7, Y], [X + h*0.7, Y - h*0.7]], pkCss(grey.body), h*0.02); pkPoly(x, [[X + h*0.7, Y - h*0.7], [X + h*0.9, Y - h*0.64], [X + h*0.7, Y - h*0.58]], pkCss([240, 90, 40])); return; }
  case 'menhir': pkStone(x, X, Y, h, c, mulberry32((R()*4294967296) >>> 0), px); return;
  case 'dolmen': { // a dolmen: three uprights, a thin capstone tilted over a dark hollow, its mound
    pkEll(x, X, Y, h*1.6, h*0.25, pkCss(pkMat(c, [80, 110, 70], 0.8).dark, 0.5)); pkPoly(x, [[X - h*0.7, Y], [X - h*0.65, Y - h*0.75], [X + h*0.65, Y - h*0.7], [X + h*0.7, Y]], pkCss(PK_BLACK, 0.8));
    for(const [u, sh] of [[-0.6, 0.78], [0.05, 0.72], [0.55, 0.7]]) pkStone(x, X + u*h, Y, h*sh, c, mulberry32((R()*4294967296) >>> 0), px, { wide: 0.45 });
    const st = pkMat(c, PK_STONE, 0.75), tl = h*0.12*(R() < 0.5 ? 1 : -1); pkPoly(x, [[X - h*0.95, Y - h*0.72 + tl], [X - h*0.85, Y - h*0.95 + tl], [X + h*0.85, Y - h*0.9 - tl], [X + h*1.0, Y - h*0.7 - tl], [X + h*0.6, Y - h*0.64 - tl]], pkCss(st.dark));
    pkPoly(x, [[X - h*0.85, Y - h*0.95 + tl], [X + h*0.85, Y - h*0.9 - tl], [X + h*0.6, Y - h*0.82 - tl], [X - h*0.7, Y - h*0.85 + tl]], pkCss(st.lit)); return; }
  case 'fairyring': { // a fairy ring: a ring of small toadstools on darker grass, the grass pale within, motes of light by night
    const r = h*14, g = pkMat(c, [52, 96, 54], 0.8); x.strokeStyle = pkCss(g.dark, 0.5); x.lineWidth = Math.max(px(0.5), h*1.2); x.beginPath(); x.ellipse(X, Y, r, r*0.22, 0, 0, Math.PI*2); x.stroke(); pkEll(x, X, Y, r*0.8, r*0.17, pkCss(pkMix(g.lit, [200, 200, 140], 0.3), 0.35));
    const cap = pkMat(c, [[220, 200, 170], [200, 80, 70], [180, 150, 120]][Math.floor(R()*3)], 0.7); for(let k = 0; k < 18; k++){ const a = k/18*Math.PI*2 + R()*0.2, mx = X + Math.cos(a)*r, my = Y + Math.sin(a)*r*0.22, s = h*(0.8 + 0.5*R())*(0.7 + 0.3*Math.sin(a));
      ln([[mx, my], [mx, my - s*0.6]], pkCss([236, 230, 214]), s*0.18); x.fillStyle = pkCss(cap.body); x.beginPath(); x.ellipse(mx, my - s*0.6, s*0.4, s*0.3, 0, Math.PI, 0); x.fill(); }
    for(let k = 0; k < 6; k++) pkGlow(x, X + (R() - 0.5)*r*1.4, Y - h*(2 + 6*R()), h*1.2, c.glow, 0.25 + 0.5*night); return; }
  case 'wisp': { // will-o'-the-wisps: two to five soft lights in a drifting line low over the ground, bright at their cores
    for(let k = 0, n = 2 + Math.floor(R()*4); k < n; k++){ const wx = X + (k - n/2)*h*2.2 + (R() - 0.5)*h, wy = Y - h*(2 + 3*R()) - k*h*0.3, col = pkMix(c.glow, [150, 230, 255], R()*0.5);
      pkGlow(x, wx, wy, h*(1.6 + night), col, 0.35 + 0.45*night); pkDisc(x, wx, wy, h*0.18, pkCss(pkMix(col, PK_WHITE, 0.6), 0.9)); } return; }
  case 'flower': { // a giant flower: a tall spadix in a frilled bell of a spathe, its throat aglow
    const sp = pkMat(c, [[120, 40, 70], [200, 160, 210], [230, 120, 60]][Math.floor(R()*3)], 0.7), w = h*0.35;
    ln([[X, Y], [X + h*0.02, Y - h*0.35]], pkCss(pkMat(c, [70, 110, 60], 0.8).body), h*0.05);
    x.fillStyle = pkCss(sp.dark); x.beginPath(); x.moveTo(X, Y - h*0.3); x.bezierCurveTo(X - w*1.4, Y - h*0.45, X - w*1.2, Y - h*0.85, X - w*0.7, Y - h*0.82); x.lineTo(X + w*0.7, Y - h*0.84); x.bezierCurveTo(X + w*1.2, Y - h*0.85, X + w*1.4, Y - h*0.45, X, Y - h*0.3); x.fill();
    x.fillStyle = pkCss(sp.body); x.beginPath(); x.moveTo(X + sd*w*0.1, Y - h*0.32); x.bezierCurveTo(X + sd*w*1.2, Y - h*0.45, X + sd*w*1.1, Y - h*0.82, X + sd*w*0.7, Y - h*0.83); x.lineTo(X, Y - h*0.8); x.fill();
    pkPoly(x, [[X - w*0.12, Y - h*0.75], [X, Y - h], [X + w*0.12, Y - h*0.75]], pkCss(pkMat(c, [230, 210, 140], 0.7).body)); pkGlow(x, X, Y - h*0.72, w*1.4, c.glow, 0.25 + 0.4*night); return; }
  case 'toadstool': { // a toadstool house: a spotted dome of a cap, a round door in its stalk, a window lit, a little chimney
    const cap = pkMat(c, [[190, 50, 46], [200, 120, 60], [120, 70, 140]][Math.floor(R()*3)], 0.7), stalk = pkMat(c, [230, 220, 200], 0.6), w = h*0.32;
    pkShade(x, [[X - w, Y], [X - w*0.85, Y - h*0.55], [X + w*0.85, Y - h*0.55], [X + w, Y]], stalk.body, Y - h*0.55, Y, 0.2); pkEll(x, X - w*0.2, Y - h*0.15, w*0.3, h*0.15, pkCss(wood.dark)); pkDisc(x, X + w*0.45, Y - h*0.35, w*0.18, pkCss(glowOn ? lamp : pkMix(c.air || stalk.lit, PK_BLACK, 0.3)));
    x.fillStyle = pkCss(cap.dark); x.beginPath(); x.ellipse(X, Y - h*0.5, w*2.1, h*0.5, 0, Math.PI, 0); x.fill(); x.fillStyle = pkCss(cap.body); x.beginPath(); x.ellipse(X + sd*w*0.25, Y - h*0.52, w*1.7, h*0.45, 0, Math.PI, 0); x.fill();
    for(let k = 0; k < 7; k++) pkEll(x, X + (R() - 0.5)*w*3, Y - h*(0.6 + 0.3*R()), w*0.18, h*0.05, pkCss(PK_WHITE, 0.85)); box(X + w*0.9, Y - h*1.02, w*0.25, h*0.2, stone); if(glowOn) pkGlow(x, X + w*0.45, Y - h*0.35, w, c.glow, 0.4*night); return; }
  case 'moongate': { // a moon gate: a ring of stone standing on its sill, leaves grown over it, the light within it
    const r = h*0.5, st = pkMat(c, PK_STONE, 0.7); x.lineWidth = Math.max(px(0.6), r*0.18); x.strokeStyle = pkCss(st.dark); x.beginPath(); x.arc(X, Y - r, r, 0, Math.PI*2); x.stroke(); x.lineWidth = Math.max(px(0.4), r*0.1); x.strokeStyle = pkCss(st.lit); x.beginPath(); x.arc(X, Y - r, r*1.03, sd > 0 ? -1.2 : 1.9, sd > 0 ? 0.3 : 3.5); x.stroke();
    pkGlow(x, X, Y - r, r*0.9, c.glow, 0.2 + 0.4*night); pkIvy(x, X - r*0.9, Y - r*0.3, r*1.4, r*0.4, c, RD, px); return; }
  }
  // a person, for scale: seven and a half heads tall, legs and arms, a coat or jacket in three values, a hat now and
  // then; no face (the eye reads its size, not who it is)
  const coat = pkMat(c, [[70, 80, 100], [120, 60, 50], [150, 140, 110], [60, 90, 70], [40, 40, 44], [190, 170, 140]][Math.floor(R()*6)], 0.75), legs = pkMat(c, [[50, 56, 70], [70, 60, 50], [40, 40, 44]][Math.floor(R()*3)], 0.75), skin = pkMat(c, [[220, 180, 150], [170, 120, 90], [110, 74, 54]][Math.floor(R()*3)], 0.7);
  const hd = h/7.5, st = (R() - 0.5)*hd*0.6;
  pkPoly(x, [[X - hd*0.4, Y], [X - hd*0.45 - st*0.3, Y - h*0.47], [X - hd*0.05, Y - h*0.47], [X, Y - h*0.2], [X + hd*0.05, Y - h*0.47], [X + hd*0.45 + st*0.3, Y - h*0.47], [X + hd*0.4 + st, Y], [X + hd*0.12 + st, Y], [X, Y - h*0.3], [X - hd*0.12, Y]], pkCss(legs.body));
  pkShade(x, [[X - hd*0.55, Y - h*0.42], [X - hd*0.62, Y - h*0.78], [X - hd*0.3, Y - h*0.84], [X + hd*0.3, Y - h*0.84], [X + hd*0.62, Y - h*0.78], [X + hd*0.55, Y - h*0.42]], coat.body, Y - h*0.84, Y - h*0.42, 0.2);
  pkPoly(x, [[X + sd*hd*0.05, Y - h*0.44], [X + sd*hd*0.08, Y - h*0.8], [X + sd*hd*0.55, Y - h*0.78], [X + sd*hd*0.5, Y - h*0.44]], pkCss(coat.lit, 0.5));
  for(const s of [-1, 1]) pkPoly(x, [[X + s*hd*0.55, Y - h*0.8], [X + s*hd*0.75, Y - h*0.55], [X + s*hd*0.65, Y - h*0.47], [X + s*hd*0.5, Y - h*0.6]], pkCss(s === sd ? coat.body : coat.dark));
  pkEll(x, X, Y - h + hd*0.5, hd*0.4, hd*0.5, pkCss(skin.body)); pkEll(x, X - sd*hd*0.06, Y - h + hd*0.38, hd*0.42, hd*0.35, pkCss(pkMat(c, [[40, 32, 28], [120, 90, 60], [190, 170, 130], [30, 30, 34]][Math.floor(R()*4)], 0.7).body));
  if(R() < 0.25) pkPoly(x, [[X - hd*0.6, Y - h + hd*0.25], [X + hd*0.6, Y - h + hd*0.25], [X + hd*0.35, Y - h + hd*0.1], [X + hd*0.3, Y - h - hd*0.25], [X - hd*0.3, Y - h - hd*0.25], [X - hd*0.35, Y - h + hd*0.1]], pkCss(pkMix(coat.dark, PK_BLACK, 0.3)));
}

// ---------------- NODS (Ruby: "a few Easter eggs … that nod to both of those games but without infringing") ----------
// docs/prior-art/painted-ringworld-2.md §E: genre stock drawn in shapes of our own, never a series' marks, names, logos
// or designs. Halo-leaning: a pair of lens wardens, a keyless gate in a cliff, a drop-pod opened like a flower, a spire
// beaming to the arch. Fallout-leaning: a toothed door rolled aside in a hill (no number), an atomic-age diner, a
// finned wreck, a rusted colossus suit kneeling in a field; crimped caps.
// Each at (X, Y), h its height in pixels, in the caller's lit colours (c.glow its light), night how dark it is.
// (q: the chance a place the rule allows holds one, tuned so a scene shows a common nod about one time in two, an
//  uncommon one in seven, a rare one in twenty-five, a very rare one hardly ever; loud ones one to a scene)
export const PK_EGGS = {
  warden:   { worlds: ['builders', 'ruins'], q: 0.03, loud: false },  gate:     { worlds: ['builders', 'ruins'], q: 0.003, loud: true },
  pod:      { worlds: ['wilds', 'ruins'], q: 0.015, loud: true },      spire:    { worlds: ['builders'], q: 0.006, loud: true },
  cogdoor:  { worlds: ['wilds', 'ruins'], q: 0.02, loud: false },      diner:    { worlds: ['ruins', 'cities'], q: 0.27, loud: false },
  car:      { worlds: ['ruins', 'cities'], q: 1, loud: false },
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

// ---------------- BOARDS: billboards, signs and notices (docs/prior-art/ringworld-sprites.md, Part B) ----------------
// Ruby: "a wider variety of billboards … somewhat tongue in cheek, referencing fake brands … that rarely appear", and the
// crescent-moon mascot read as a banana: "less cartoony". So: no mascots and no faces; each board ONE image idea (a
// painted product, a poster landscape, a silhouette, or type alone) and at most seven words in capitals, as boards are
// read at speed; the brands are invented, the jokes are the ring's own (spin gravity, the arch overhead, no horizon,
// endless noon, the rim wall, the builders who left). The board is a real thing too: a timber board on posts in the
// wilds, a pasted paper poster on steel with its catwalk and lamps in town, tubes in the neon, a seamless slab where the
// builders were, rust and torn paper in the ruins, a hanging shingle where there is magic.
// Each design: worlds, r (how often: common 1, uncommon 0.5, rare 0.24, very rare 0.07), fmt (the board it is painted on),
// pal (three colours, hex), say (its words: a brand and a line), art (its picture, drawn into the face by pkBoardArt).
// where a picture leaves room for the words (L left, R right, T a band along the top, C the middle; else left), and
// the small signs, whose name goes on a band along their foot
const PK_ZONE = { pour: 'R', suns: 'R', glass: 'R', can: 'R', spiral: 'R', obelisk: 'R', kettle: 'R', house: 'T', tins: 'T', marquee: 'T', broom: 'T', plough: 'T', train: 'T', level: 'T', type: 'C', planks: 'C', glyphs: 'C' };
const PK_SMALL = ['shingle', 'plate', 'sheet', 'map', 'bottle'];
const PK_FMT = { // face width and height, how high its foot stands off the ground, in metres
  timber: [3.0, 1.5, 1.4], poster: [7.5, 3.7, 3.2], bulletin: [14.6, 4.3, 6.5], tube: [5, 2.6, 4.2], vertical: [1.4, 5.5, 3.2], slab: [4.2, 2.4, 0],
  shingle: [0.9, 0.6, 1.5], plate: [0.7, 0.5, 1.6], sheet: [0.42, 0.56, 1.1], map: [2.4, 1.2, 0.8], bottle: [0.7, 1.1, 1.4], barn: [6, 1.6, 2.2], serial: [1.0, 0.46, 0.9] };
export const PK_BOARDS = {
  feed:      { worlds: ['wilds'], r: 1, fmt: 'timber', pal: ['#9e2b25', '#d9a441', '#f2e8cf'], say: ['UPCURVE FEED & SEED', 'OUR FIELDS GO UP. YIELDS TOO.'], art: 'rows' },
  plough:    { worlds: ['wilds'], r: 0.5, fmt: 'timber', pal: ['#5b3a29', '#8fb8de', '#f7f4ea'], say: ['SPINWARD PLOUGH WORKS', 'PLOUGHS STRAIGHT. RING CURVES.'], art: 'plough' },
  dairy:     { worlds: ['wilds'], r: 1, fmt: 'timber', pal: ['#6a994e', '#1b1b1b', '#fdfcf7'], say: ['OLD PALE DAIRY', 'FROM COWS WHO NEVER SAW NIGHT'], art: 'cow' },
  cider:     { worlds: ['wilds'], r: 0.5, fmt: 'timber', pal: ['#8ab83a', '#c97b2a', '#4a3222'], say: ['CORIOLIS CIDER', 'POURS A LITTLE TO THE LEFT'], art: 'pour' },
  tonic:     { worlds: ['wilds'], r: 1, fmt: 'barn', pal: ['#141414', '#efe3c2', '#d4a017'], say: ['LONGNOON TONIC', 'FOR THE AFTERNOON THAT NEVER ENDS'], art: 'type' },
  almanac:   { worlds: ['wilds'], r: 0.5, fmt: 'timber', pal: ['#6cb4e4', '#f6c90e', '#23303b'], say: ['ARCHLIGHT ALMANAC', 'FORECAST: SUNNY. AGAIN. FOREVER.'], art: 'suns' },
  archview:  { worlds: ['cities'], r: 1, fmt: 'poster', pal: ['#3d4a5c', '#e0b84f', '#dfe7ef'], say: ['ARCHVIEW RESIDENCES', 'EVERY WINDOW FACES THE RING'], art: 'tower' },
  edgeward:  { worlds: ['cities', 'wilds'], r: 0.24, fmt: 'bulletin', pal: ['#1d3557', '#f77f00', '#f1faee'], say: ['EDGEWARD MUTUAL', "FELL OFF THE EDGE? YOU'RE COVERED."], art: 'rim' },
  transit:   { worlds: ['cities'], r: 1, fmt: 'bulletin', pal: ['#00818a', '#f4f4f4', '#ffd23f'], say: ['SPOKELINE', 'ANTISPINWARD IN 20 MINUTES. PROBABLY.'], art: 'train' },
  blinds:    { worlds: ['cities'], r: 1, fmt: 'poster', pal: ['#14213d', '#fca311', '#e5e5e5'], say: ['SHADOWSQUARE BLINDS', 'NIGHT, SOLD BY THE METRE'], art: 'blind' },
  levels:    { worlds: ['cities', 'builders'], r: 0.5, fmt: 'poster', pal: ['#f2c12e', '#2e2e2e', '#a9d6e5'], say: ['PLUMB & TRUE', 'TRUST THE BUBBLE, NOT THE HORIZON'], art: 'level' },
  savings:   { worlds: ['cities'], r: 1, fmt: 'poster', pal: ['#2d6a4f', '#c9a227', '#f8f5ec'], say: ['ROUNDABOUT SAVINGS', 'YOUR MONEY GOES AROUND. AND AROUND.'], art: 'coin' },
  lounge:    { worlds: ['neon'], r: 1, fmt: 'tube', pal: ['#ff2e88', '#7b2ff7', '#0b0b12'], say: ['DEEP SHADE', 'DARKNESS BY THE HOUR'], art: 'glass' },
  noodle:    { worlds: ['neon'], r: 1, fmt: 'vertical', pal: ['#ff3b30', '#3fa7ff', '#111111'], say: ['NOONBOWL', 'NOODLE'], art: 'bowl' },
  cinema:    { worlds: ['neon', 'cities'], r: 0.5, fmt: 'tube', pal: ['#fff4d6', '#37e2d5', '#2b0f3a'], say: ['STARLESS CINEMA', 'TONIGHT: REAL STARS. PROJECTED.'], art: 'marquee' },
  overflux:  { worlds: ['neon'], r: 1, fmt: 'tube', pal: ['#a6ff00', '#ff6b00', '#161616'], say: ['OVERFLUX', 'STAY AWAKE. THE SUN DOES.'], art: 'can' },
  arcade:    { worlds: ['neon'], r: 0.5, fmt: 'tube', pal: ['#ffe600', '#ff00a8', '#0a0f2c'], say: ['SPINLOCK ARCADE', 'LOSE YOUR SENSE OF DOWN'], art: 'spiral' },
  hotel:     { worlds: ['neon'], r: 0.24, fmt: 'vertical', pal: ['#ff4f79', '#f6f6f6', '#3a1d16'], say: ['HALFWAY', 'HOTEL'], art: 'hotel' },
  relics:    { worlds: ['builders', 'ruins'], r: 0.24, fmt: 'poster', pal: ['#b8b8aa', '#2ec4b6', '#ffbf00'], say: ['PRIOR TENANTS RELIC REMOVAL', 'ANCIENT. HUMMING. GONE BY TUESDAY.'], art: 'obelisk' },
  climb:     { worlds: ['builders', 'wilds'], r: 0.5, fmt: 'poster', pal: ['#6b7078', '#e85d04', '#bde0fe'], say: ['RIMWALL CLIMB CO.', 'SUMMIT IN 1000 KM. BRING SNACKS.'], art: 'wall' },
  filler:    { worlds: ['builders'], r: 0.5, fmt: 'poster', pal: ['#e9dcc9', '#8c6a43', '#222222'], say: ['MENDWELL FILLER', 'FOR CRACKS IN ANCIENT WONDERS'], art: 'crack' },
  survey:    { worlds: ['builders'], r: 1, fmt: 'poster', pal: ['#264653', '#f1f1e6', '#d62828'], say: ['HOLLOWMARK SURVEY GUILD', 'WE MAP WHAT THEY FORGOT TO'], art: 'survey' },
  plaque:    { worlds: ['builders'], r: 0.07, fmt: 'slab', pal: ['#121418', '#48e5c2', '#f0f0f0'], say: ['OUT FOR MAINTENANCE.', 'BACK IN 40,000 YEARS.'], art: 'glyphs' },
  acres:     { worlds: ['ruins'], r: 1, fmt: 'bulletin', pal: ['#7fb7b2', '#e8a598', '#efe6d2'], say: ['BRIGHTSIDE ACRES', 'GRAVITY INCLUDED AT NO EXTRA CHARGE'], art: 'house' },
  kettle:    { worlds: ['ruins'], r: 0.5, fmt: 'poster', pal: ['#a8d5ba', '#9aa5ab', '#c1440e'], say: ['EVERGLOW KETTLE', 'BOILS IN SECONDS. GLOWS FOR CENTURIES.'], art: 'kettle' },
  daylight:  { worlds: ['ruins', 'cities'], r: 0.5, fmt: 'poster', pal: ['#f4c430', '#8d99ae', '#8b3a1a'], say: ['CANNED DAYLIGHT', 'SHELF LIFE: YES.'], art: 'tins' },
  domestics: { worlds: ['ruins'], r: 0.24, fmt: 'poster', pal: ['#f3e9d2', '#6fa8dc', '#c0392b'], say: ['DUTIFUL DOMESTICS', 'A HELPER THAT WILL OUTLAST YOU'], art: 'robot' },
  bonds:     { worlds: ['ruins'], r: 1, fmt: 'poster', pal: ['#b22222', '#f5ecd7', '#1a1a1a'], say: ['RING BONDS', 'BUY A SHARE OF FOREVER'], art: 'bond' },
  survivor:  { worlds: ['ruins'], r: 0.24, fmt: 'timber', pal: ['#e8e4d8', '#1c1c1c', '#9b2d20'], say: ['WATER. TRADE. DOGS OK.', 'NO RAIDERS'], art: 'planks' },
  charm:     { worlds: ['magic'], r: 1, fmt: 'shingle', pal: ['#6a4c93', '#d4af37', '#f4ecd8'], say: ['TRUEDOWN CHARMS', 'KNOW WHICH WAY IS DOWN'], art: 'pendant' },
  oracle:    { worlds: ['magic'], r: 0.5, fmt: 'shingle', pal: ['#0b525b', '#e8f1f2', '#c9a227'], say: ['WELLWATER ORACLE', 'PASTS REFUNDED'], art: 'orb' },
  brooms:    { worlds: ['magic'], r: 0.5, fmt: 'timber', pal: ['#2c3e75', '#e1b866', '#e2573b'], say: ['BROOMWORKS', 'FLY STRAIGHT. ARRIVE ELSEWHERE.'], art: 'broom' },
  apothecary:{ worlds: ['magic'], r: 1, fmt: 'bottle', pal: ['#2f5d50', '#a4161a', '#f1e3c3'], say: ['MOONLESS', 'SLEEPING DRAUGHTS'], art: 'label' },
  wards:     { worlds: ['magic'], r: 1, fmt: 'shingle', pal: ['#5c1a1b', '#e0b13a', '#2f3e46'], say: ['WARDWRIGHT', 'CURSES LIFTED'], art: 'ward' },
  advisory:  { worlds: ['cities', 'wilds', 'builders'], r: 1, fmt: 'plate', pal: ['#f2f2f2', '#1f4e79', '#c00000'], say: ['SPIN ADVISORY', 'THROWN OBJECTS WILL NOT RETURN'], art: 'throw' },
  missing:   { worlds: ['cities', 'neon'], r: 0.5, fmt: 'sheet', pal: ['#f5f5f0', '#222222', '#fff35c'], say: ['MISSING: UNIT 7', "ANSWERS TO 'HEY'"], art: 'wanted' },
  vote:      { worlds: ['ruins', 'cities'], r: 0.24, fmt: 'poster', pal: ['#b5544c', '#2a2a2a', '#e9dfc4'], say: ['ORRIN VASQUE', 'MORE TOMORROW, SOONER'], art: 'stride' },
  here:      { worlds: ['wilds', 'cities', 'builders', 'ruins', 'magic'], r: 0.5, fmt: 'map', pal: ['#f6f0e1', '#2a6f97', '#e63946'], say: ['YOU ARE HERE', 'ALSO, EVENTUALLY, HERE'], art: 'loop' } };
// the serial roadside verses (a board each, thirty metres apart, the brand last)
export const PK_SERIALS = [['HE DROVE ALL DAY', 'TO REACH THE HORIZON', "THERE ISN'T ONE", "HE'S STILL DRIVING", 'LOOPWAY MOTOR OIL'],
  ["DON'T LEAN OUT", 'NEAR THE RIM', 'THE DROP IS LONG', 'THE CLAIM FORM LONGER', 'EDGEWARD MUTUAL'],
  ['THE BUILDERS LEFT', 'WITHOUT A NOTE', 'BUT LEFT THE LIGHTS ON', 'SO DO WE', 'ALL-NOON DINER 40 KM'],
  ['SPIN IS FREE', 'SO IS DOWN', 'BUT BRAKES', 'COST EXTRA', 'CHECK YOURS']];
// a board's width and whole height in metres (for the caller's culling and sizing)
export const pkBoardSize = id => { const f = PK_FMT[PK_BOARDS[id] ? PK_BOARDS[id].fmt : 'serial']; return [f[0], f[1] + f[2]]; };
// which board a world puts up, by its draw u (0..1), weighted by how often each appears
export function pkBoardOf(w, u){ let tot = 0; const L = []; for(const k in PK_BOARDS){ const B = PK_BOARDS[k]; if(B.worlds.includes(w)){ L.push(k); tot += B.r; } }
  let r = u*tot; for(const k of L){ r -= PK_BOARDS[k].r; if(r < 0) return k; } return L[0] || null; }
// of the colours offered, the one that reads best on what is already painted at (X, Y): the picture's own ground
const pkLum = c => 0.3*c[0] + 0.59*c[1] + 0.11*c[2];
function pkInk(x, X, Y, cands){ let g = null; try { const d = x.getImageData(Math.round(X), Math.round(Y), 1, 1).data; if(d[3] > 0) g = [d[0], d[1], d[2]]; } catch(e){ g = null; }
  if(!g) return cands[0]; let best = cands[0], bd = -1; for(const k of cands){ const d = Math.abs(pkLum(k) - pkLum(g)); if(d > bd){ bd = d; best = k; } } return best; }
const pkHex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// type set to fit: capitals, condensed by measure, or (too small to read) a bar of its colour, as a sign seen too far
function pkType(x, s, X, Y, size, maxW, col, px, o = {}){
  if(size < px(4)){ const w = Math.min(maxW, s.length*size*0.55); x.fillStyle = pkCss(col, 0.85); x.fillRect(o.align === 'left' ? X : X - w/2, Y - size*0.75, w, size*0.6); return; }
  x.font = `${o.weight || 'bold'} ${Math.round(size)}px ${o.face || 'sans-serif'}`; x.textAlign = o.align || 'center'; x.textBaseline = 'alphabetic';
  const w = x.measureText(s).width, k = w > maxW ? maxW/w : 1; x.save(); x.translate(X, Y); x.scale(k, 1);
  if(o.tube){ x.strokeStyle = pkCss(col, 0.95); x.lineWidth = Math.max(px(0.5), size*0.07); x.strokeText(s, 0, 0); } else { x.fillStyle = pkCss(col); x.fillText(s, 0, 0); } x.restore(); }
// THE PICTURE on a face (fx, fy the face's top left, fw, fh its size), in its three colours p (already lit), by its art
function pkBoardArt(x, B, fx, fy, fw, fh, p, c, R, px, night, tube){
  const U = u => fx + u*fw, V = v => fy + v*fh, poly = (pts, col, a = 1) => pkPoly(x, pts.map(([u, v]) => [U(u), V(v)]), pkCss(col, a)), rect = (u, v, w, h, col, a = 1) => { x.fillStyle = pkCss(col, a); x.fillRect(U(u), V(v), w*fw, h*fh); };
  const disc = (u, v, r, col, a = 1) => pkDisc(x, U(u), V(v), r*fh, pkCss(col, a)), line = (pts, col, wd) => { x.strokeStyle = pkCss(col); x.lineWidth = Math.max(px(0.4), wd*fh); x.lineCap = 'round'; x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(U(u), V(v)) : x.moveTo(U(u), V(v))); x.stroke(); };
  const grad = (c0, c1) => { const g = x.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, pkCss(c0)); g.addColorStop(1, pkCss(c1)); x.fillStyle = g; x.fillRect(fx, fy, fw, fh); };
  const shine = (u, v, w, h) => { const g = x.createLinearGradient(U(u), 0, U(u + w), 0); g.addColorStop(0, pkCss(PK_BLACK, 0.25)); g.addColorStop(0.3, pkCss(PK_WHITE, 0.35)); g.addColorStop(0.45, pkCss(PK_WHITE, 0.05)); g.addColorStop(0.85, pkCss(PK_BLACK, 0.2)); g.addColorStop(1, pkCss(PK_WHITE, 0.08)); x.fillStyle = g; x.fillRect(U(u), V(v), w*fw, h*fh); };
  const figure = (u, v, hh, col) => { const s = hh*fh, X0 = U(u), Y0 = V(v); pkPoly(x, [[X0 - s*0.07, Y0], [X0 - s*0.09, Y0 - s*0.5], [X0 - s*0.12, Y0 - s*0.82], [X0 + s*0.12, Y0 - s*0.82], [X0 + s*0.09, Y0 - s*0.5], [X0 + s*0.07, Y0]], pkCss(col)); pkEll(x, X0, Y0 - s*0.9, s*0.065, s*0.075, pkCss(col)); };
  const hd = p[0], ink = pkMix(p[1], PK_BLACK, 0.1), A = B.art, big = fh > px(10);
  switch(A){
    case 'rows': rect(0, 0, 1, 1, p[2]); for(let k = 0; k < 7; k++){ const u0 = 0.35 + k*0.1; poly([[u0, 1], [u0 + 0.06, 1], [0.95 + k*0.008, 0.35 - k*0.02], [0.93 + k*0.008, 0.35 - k*0.02]], k % 2 ? p[1] : pkMix(p[1], p[0], 0.25)); }
      poly([[0.06, 1], [0.07, 0.62], [0.12, 0.56], [0.22, 0.57], [0.25, 0.63], [0.26, 1]], p[0]); break;
    case 'plough': grad(p[1], pkMix(p[1], PK_WHITE, 0.4)); rect(0, 0.6, 1, 0.4, p[0]); x.strokeStyle = pkCss(p[2], 0.8); x.lineWidth = Math.max(px(0.4), fh*0.03); x.beginPath(); x.moveTo(U(0.12), V(0.78)); x.lineTo(U(0.5), V(0.78)); x.quadraticCurveTo(U(0.85), V(0.78), U(1), V(0.62)); x.stroke();
      poly([[0.06, 0.78], [0.1, 0.62], [0.16, 0.6], [0.2, 0.7], [0.14, 0.8]], ink); line([[0.16, 0.62], [0.26, 0.48]], ink, 0.03); break;
    case 'cow': grad(pkMix(p[2], [150, 190, 220], 0.4), p[2]); rect(0, 0.72, 1, 0.28, p[0]); disc(0.5, 0.12, 0.08, [246, 214, 120]); pkGlow(x, U(0.5), V(0.12), fh*0.3, [255, 230, 160], 0.35);
      poly([[0.55, 0.45], [0.82, 0.44], [0.86, 0.5], [0.84, 0.62], [0.58, 0.63], [0.55, 0.56]], p[1]); poly([[0.52, 0.47], [0.47, 0.44], [0.45, 0.5], [0.5, 0.56], [0.56, 0.54]], p[1]);
      for(const u of [0.59, 0.64, 0.77, 0.82]) rect(u, 0.6, 0.02, 0.15, p[1]); line([[0.86, 0.5], [0.89, 0.62]], p[1], 0.012); if(big) rect(0.66, 0.48, 0.08, 0.06, p[2], 0.9); break;
    case 'pour': grad(pkMix(p[0], PK_WHITE, 0.55), p[0]); x.save(); x.translate(U(0.28), V(0.42)); x.rotate(-0.9); const bw = fh*0.13; pkPoly(x, [[-bw, fh*0.3], [-bw, -fh*0.05], [-bw*0.4, -fh*0.15], [-bw*0.4, -fh*0.28], [bw*0.4, -fh*0.28], [bw*0.4, -fh*0.15], [bw, -fh*0.05], [bw, fh*0.3]], pkCss(pkMix(p[0], PK_BLACK, 0.45))); x.restore();
      x.strokeStyle = pkCss(p[1], 0.9); x.lineWidth = Math.max(px(0.4), fh*0.04); x.beginPath(); x.moveTo(U(0.38), V(0.3)); x.quadraticCurveTo(U(0.5), V(0.45), U(0.43), V(0.85)); x.stroke(); poly([[0.52, 0.62], [0.6, 0.62], [0.59, 0.9], [0.53, 0.9]], pkMix(p[2], PK_WHITE, 0.6), 0.7); break;
    case 'type': rect(0, 0, 1, 1, p[0]); rect(0.04, 0.12, 0.92, 0.02, p[2]); rect(0.04, 0.86, 0.92, 0.02, p[2]); poly([[0.9, 0.7], [0.9, 0.42], [0.92, 0.36], [0.94, 0.42], [0.94, 0.7]], p[2]); break;
    case 'suns': rect(0, 0, 1, 1, p[0]); poly([[0.08, 0.2], [0.42, 0.18], [0.44, 0.88], [0.1, 0.9]], p[2]); for(let k = 0; k < 7; k++){ const u = 0.13 + (k % 4)*0.08, v = 0.35 + Math.floor(k/4)*0.25; disc(u, v, 0.06, p[1]); } break;
    case 'tower': grad(pkMix(p[2], [180, 200, 220], 0.3), p[2]); x.strokeStyle = pkCss(pkMix(p[2], PK_WHITE, 0.6)); x.lineWidth = Math.max(px(0.5), fh*0.05); x.beginPath(); x.moveTo(U(0), V(0.95)); x.quadraticCurveTo(U(0.5), V(-0.45), U(1), V(0.95)); x.stroke();
      poly([[0.62, 1], [0.62, 0.18], [0.74, 0.1], [0.78, 0.18], [0.78, 1]], p[0]); if(big) for(let r = 0; r < 9; r++) for(let k = 0; k < 3; k++) if(R() < 0.6) rect(0.64 + k*0.045, 0.25 + r*0.08, 0.025, 0.04, p[1]); break;
    case 'rim': grad(pkMix(p[0], PK_WHITE, 0.25), p[0]); poly([[0.8, 1], [0.8, 0.05], [1, 0.05], [1, 1]], pkMix(p[0], PK_BLACK, 0.4)); figure(0.83, 0.05, 0.12, PK_BLACK);
      for(let k = 0; k < 9; k++){ const t = k/9; disc(0.78 - t*0.5, 0.15 + t*t*0.7, 0.012, p[1]); } break;
    case 'train': rect(0, 0, 1, 1, p[1]); rect(0, 0.72, 1, 0.06, p[0]); poly([[0.3, 0.7], [0.3, 0.42], [0.36, 0.36], [0.9, 0.36], [0.98, 0.5], [0.98, 0.7]], p[0]); rect(0.38, 0.43, 0.5, 0.08, pkMix(p[0], PK_BLACK, 0.5));
      for(let k = 0; k < 4; k++) rect(0.04, 0.42 + k*0.07, 0.18 - k*0.03, 0.025, p[0], 0.6); poly([[0.02, 0.89], [0.08, 0.82], [0.08, 0.86], [0.2, 0.86], [0.2, 0.92], [0.08, 0.92], [0.08, 0.96]], p[2]); break;
    case 'blind': rect(0, 0, 1, 1, p[2]); rect(0.5, 0.08, 0.42, 0.82, p[1]); rect(0.5, 0.08, 0.42, 0.42, p[0]); for(let k = 0; k < 9; k++) disc(0.53 + R()*0.36, 0.12 + R()*0.34, 0.008 + 0.008*R(), PK_WHITE);
      for(let k = 0; k < 6; k++) rect(0.5, 0.1 + k*0.07, 0.42, 0.006, pkMix(p[0], PK_WHITE, 0.15)); rect(0.49, 0.06, 0.44, 0.03, pkMix(p[2], PK_BLACK, 0.4)); line([[0.71, 0.5], [0.71, 0.62]], pkMix(p[2], PK_BLACK, 0.4), 0.01); break;
    case 'level': grad(p[2], pkMix(p[2], PK_WHITE, 0.4)); x.strokeStyle = pkCss(ink, 0.5); x.lineWidth = Math.max(px(0.4), fh*0.015); x.beginPath(); x.moveTo(U(0), V(0.9)); x.quadraticCurveTo(U(0.5), V(0.62), U(1), V(0.75)); x.stroke();
      rect(0.12, 0.6, 0.76, 0.14, p[0]); shine(0.12, 0.6, 0.76, 0.14); rect(0.44, 0.63, 0.12, 0.08, [190, 230, 160]); disc(0.5, 0.67, 0.03, PK_WHITE, 0.8); break;
    case 'coin': rect(0, 0, 1, 1, p[2]); disc(0.72, 0.5, 0.3, pkMix(p[1], PK_BLACK, 0.2)); disc(0.72, 0.5, 0.26, p[1]); disc(0.69, 0.46, 0.15, pkMix(p[1], PK_WHITE, 0.25), 0.6);
      x.strokeStyle = pkCss(p[0]); x.lineWidth = Math.max(px(0.4), fh*0.02); x.beginPath(); x.ellipse(U(0.72), V(0.5), fh*0.62, fh*0.12, -0.25, 0, Math.PI*2); x.stroke(); break;
    case 'glass': if(tube){ line([[0.12, 0.2], [0.32, 0.2], [0.22, 0.5], [0.12, 0.2]], p[0], 0.03); line([[0.22, 0.5], [0.22, 0.8], [0.14, 0.82], [0.3, 0.82]], p[0], 0.03); line([[0.18, 0.3], [0.26, 0.3]], p[1], 0.03); } break;
    case 'bowl': line([[0.15, 0.55], [0.85, 0.55]], p[0], 0.06); x.strokeStyle = pkCss(p[0]); x.lineWidth = Math.max(px(0.4), fh*0.012); x.beginPath(); x.arc(U(0.5), V(0.55), fw*0.35, 0, Math.PI); x.stroke();
      for(const u of [0.35, 0.5, 0.65]) line([[u, 0.48], [u - 0.06, 0.4], [u + 0.04, 0.32], [u - 0.03, 0.24]], p[1], 0.008); break;
    case 'marquee': for(let k = 0; k < 24; k++){ const t = k/24, u = t < 0.5 ? 0.04 + t*2*0.92 : 0.96 - (t - 0.5)*2*0.92, v = t < 0.5 ? 0.06 : 0.94; disc(u, v, 0.02, k === 7 ? pkMix(p[0], PK_BLACK, 0.6) : p[0]); }
      poly([[0.08, 0.7], [0.16, 0.62], [0.16, 0.78]], p[1], 0.9); for(let k = 0; k < 7; k++) disc(0.2 + 0.1*k, 0.55 + 0.3*R(), 0.012, p[1]); break;
    case 'can': rect(0.08, 0.22, 0.2, 0.62, p[0]); shine(0.08, 0.22, 0.2, 0.62); poly([[0.12, 0.45], [0.18, 0.38], [0.24, 0.45], [0.24, 0.5], [0.18, 0.43], [0.12, 0.5]], p[2]); poly([[0.12, 0.58], [0.18, 0.51], [0.24, 0.58], [0.24, 0.63], [0.18, 0.56], [0.12, 0.63]], p[2]);
      for(let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; line([[0.18 + Math.cos(a)*0.17, 0.53 + Math.sin(a)*0.34], [0.18 + Math.cos(a)*0.22, 0.53 + Math.sin(a)*0.44]], p[1], 0.02); } break;
    case 'spiral': { x.strokeStyle = pkCss(p[1]); x.lineWidth = Math.max(px(0.4), fh*0.025); x.beginPath(); for(let k = 0; k < 60; k++){ const a = k*0.3, r = 0.02 + k*0.0035; const X0 = U(0.15) + Math.cos(a)*r*fh*2, Y0 = V(0.5) + Math.sin(a)*r*fh*2; k ? x.lineTo(X0, Y0) : x.moveTo(X0, Y0); } x.stroke(); } break;
    case 'obelisk': grad(pkMix(p[0], PK_WHITE, 0.3), p[0]); poly([[0.2, 0.86], [0.22, 0.12], [0.26, 0.06], [0.3, 0.12], [0.32, 0.86]], pkMix(p[0], PK_BLACK, 0.5)); for(let k = 0; k < 6; k++) rect(0.245, 0.22 + k*0.1, 0.03, 0.03, p[1]);
      line([[0.36, 0.2], [0.36, 0.88], [0.18, 0.88]], p[2], 0.025); disc(0.34, 0.9, 0.05, ink); break;
    case 'wall': grad(p[2], pkMix(p[2], PK_WHITE, 0.4)); poly([[0.45, 1], [0.48, 0], [1, 0], [1, 1]], p[0]); for(let k = 0; k < 6; k++) rect(0.48, k*0.18, 0.52, 0.005, pkMix(p[0], PK_BLACK, 0.3)); line([[0.6, 0], [0.62, 0.55]], p[1], 0.008); figure(0.62, 0.62, 0.08, PK_BLACK); break;
    case 'crack': grad(pkMix(p[0], PK_WHITE, 0.2), p[0]); x.strokeStyle = pkCss(p[1]); x.lineWidth = Math.max(px(0.4), fh*0.12); x.beginPath(); x.arc(U(0.65), V(1.05), fh*0.75, Math.PI, 0); x.stroke();
      line([[0.52, 0.32], [0.55, 0.4], [0.53, 0.45], [0.57, 0.52]], p[2], 0.012); line([[0.52, 0.32], [0.55, 0.4], [0.53, 0.45], [0.57, 0.52]], p[0], 0.006); poly([[0.06, 0.95], [0.07, 0.66], [0.24, 0.66], [0.25, 0.95]], pkMix(p[0], PK_WHITE, 0.4)); shine(0.06, 0.66, 0.19, 0.29); line([[0.26, 0.7], [0.36, 0.6]], p[1], 0.02); break;
    case 'survey': rect(0, 0, 1, 1, p[1]); x.strokeStyle = pkCss(p[0], 0.9); x.lineWidth = Math.max(px(0.4), fh*0.05); x.beginPath(); x.arc(U(0.92), V(1.1), fh*0.8, Math.PI, Math.PI*1.5); x.stroke();
      x.lineWidth = Math.max(px(0.3), fh*0.006); x.strokeStyle = pkCss(p[0], 0.4); x.beginPath(); for(let k = 0; k <= 6; k++){ x.moveTo(U(0.52 + k*0.065), V(0.2)); x.lineTo(U(0.52 + k*0.065), V(1)); x.moveTo(U(0.52), V(0.2 + k*0.13)); x.lineTo(U(0.91), V(0.2 + k*0.13)); } x.stroke();
      if(big) pkType(x, '?', U(0.95), V(0.6), fh*0.4, fw*0.1, p[2], px); break;
    case 'glyphs': rect(0, 0, 1, 1, p[0]); { const on = 0.35 + 0.65*night; for(let k = 0; k < 9; k++){ const u = 0.1 + k*0.09; line(R() < 0.5 ? [[u, 0.15], [u, 0.42]] : [[u - 0.03, 0.42], [u, 0.15], [u + 0.03, 0.42]], pkMix(p[1], p[0], 1 - on), 0.025); } pkGlow(x, U(0.5), V(0.3), fw*0.4, p[1], 0.2*on); }
      rect(0.06, 0.58, 0.88, 0.36, p[2]); break;
    case 'house': grad(pkMix(p[0], PK_WHITE, 0.3), p[0]); for(let k = 0; k < 16; k++){ const a = k/16*Math.PI*2; poly([[0.3, 0.5], [0.3 + Math.cos(a)*0.4, 0.5 + Math.sin(a)*1.2], [0.3 + Math.cos(a + 0.12)*0.4, 0.5 + Math.sin(a + 0.12)*1.2]], p[2], 0.35); }
      poly([[0.12, 0.85], [0.12, 0.55], [0.48, 0.55], [0.48, 0.85]], p[2]); poly([[0.08, 0.6], [0.3, 0.42], [0.55, 0.52], [0.5, 0.56], [0.3, 0.48], [0.1, 0.62]], p[1]); rect(0.3, 0.65, 0.08, 0.2, pkMix(p[1], PK_BLACK, 0.3));
      figure(0.6, 0.88, 0.3, pkMix(p[0], PK_BLACK, 0.5)); figure(0.66, 0.88, 0.28, pkMix(p[0], PK_BLACK, 0.55)); figure(0.71, 0.88, 0.16, pkMix(p[0], PK_BLACK, 0.5)); break;
    case 'kettle': grad(p[0], pkMix(p[0], PK_WHITE, 0.4)); pkGlow(x, U(0.3), V(0.55), fh*0.5, [190, 255, 190], 0.35); poly([[0.18, 0.85], [0.16, 0.5], [0.22, 0.38], [0.38, 0.38], [0.44, 0.5], [0.42, 0.85]], p[1]); shine(0.16, 0.38, 0.28, 0.47);
      line([[0.44, 0.55], [0.52, 0.45], [0.55, 0.42]], p[1], 0.04); line([[0.22, 0.38], [0.3, 0.26], [0.38, 0.38]], pkMix(p[1], PK_BLACK, 0.4), 0.03); break;
    case 'tins': rect(0, 0, 1, 1, pkMix(p[2], PK_WHITE, 0.6)); for(let k = 0; k < 6; k++){ rect(0.56 + (k % 3)*0.12, 0.6 - Math.floor(k/3)*0.22, 0.1, 0.2, p[1]); rect(0.56 + (k % 3)*0.12, 0.66 - Math.floor(k/3)*0.22, 0.1, 0.08, p[0], 0.8); } rect(0.12, 0.42, 0.3, 0.52, p[1]); shine(0.12, 0.42, 0.3, 0.52); rect(0.12, 0.52, 0.3, 0.3, p[0]);
      disc(0.27, 0.67, 0.07, pkMix(p[0], PK_WHITE, 0.4)); for(let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; line([[0.27 + Math.cos(a)*0.05, 0.67 + Math.sin(a)*0.09], [0.27 + Math.cos(a)*0.08, 0.67 + Math.sin(a)*0.13]], p[2], 0.012); } break;
    case 'robot': rect(0, 0, 1, 1, p[0]); for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; poly([[0.7, 0.4], [0.7 + Math.cos(a)*0.4, 0.4 + Math.sin(a)*1.2], [0.7 + Math.cos(a + 0.18)*0.4, 0.4 + Math.sin(a + 0.18)*1.2]], p[1], 0.3); }
      rect(0.62, 0.35, 0.16, 0.35, pkMix(p[1], PK_BLACK, 0.3)); rect(0.65, 0.22, 0.1, 0.12, pkMix(p[1], PK_BLACK, 0.4)); disc(0.7, 0.2, 0.02, p[2]); line([[0.62, 0.45], [0.54, 0.5], [0.5, 0.48]], pkMix(p[1], PK_BLACK, 0.3), 0.03); rect(0.44, 0.46, 0.12, 0.02, PK_WHITE); rect(0.64, 0.7, 0.03, 0.18, pkMix(p[1], PK_BLACK, 0.3)); rect(0.73, 0.7, 0.03, 0.18, pkMix(p[1], PK_BLACK, 0.3)); break;
    case 'bond': rect(0, 0, 1, 1, p[1]); x.strokeStyle = pkCss(p[0]); x.lineWidth = Math.max(px(0.4), fh*0.02); x.strokeRect(U(0.04), V(0.08), fw*0.92, fh*0.84); for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; line([[0.75, 0.5], [0.75 + Math.cos(a)*0.2, 0.5 + Math.sin(a)*0.4]], p[0], 0.008); }
      x.lineWidth = Math.max(px(0.4), fh*0.05); x.beginPath(); x.ellipse(U(0.75), V(0.5), fh*0.18, fh*0.18, 0, 0, Math.PI*2); x.stroke(); break;
    case 'planks': for(let k = 0; k < 4; k++) rect(0, k*0.25, 1, 0.24, pkMix(p[0], [170, 150, 120], R()*0.5)); line([[0.82, 0.62], [0.95, 0.62], [0.91, 0.55]], p[2], 0.04); line([[0.95, 0.62], [0.91, 0.69]], p[2], 0.04);
      poly([[0.06, 0.95], [0.07, 0.82], [0.1, 0.78], [0.18, 0.78], [0.2, 0.74], [0.22, 0.78], [0.22, 0.95]], p[1]); break;
    case 'pendant': rect(0, 0, 1, 1, p[2]); line([[0.3, 0.05], [0.5, 0.45], [0.7, 0.05]], p[1], 0.02); poly([[0.44, 0.45], [0.56, 0.45], [0.5, 0.9]], p[0]); break;
    case 'orb': rect(0, 0, 1, 1, p[0]); disc(0.5, 0.45, 0.28, pkMix(p[1], p[0], 0.4)); disc(0.45, 0.38, 0.1, PK_WHITE, 0.45); poly([[0.38, 0.9], [0.42, 0.72], [0.58, 0.72], [0.62, 0.9]], p[2]); break;
    case 'broom': grad(p[0], pkMix(p[0], PK_WHITE, 0.3)); line([[0.3, 0.88], [0.62, 0.55]], pkMix(p[1], PK_BLACK, 0.4), 0.03); poly([[0.6, 0.58], [0.76, 0.45], [0.78, 0.62], [0.68, 0.68]], p[1]);
      x.strokeStyle = pkCss(p[2], 0.7); x.lineWidth = Math.max(px(0.3), fh*0.012); x.setLineDash([fh*0.04, fh*0.04]); x.beginPath(); x.moveTo(U(0.3), V(0.9)); x.bezierCurveTo(U(0.12), V(1.05), U(0.02), V(0.6), U(0.12), V(0.5)); x.stroke(); x.setLineDash([]); break;
    case 'label': rect(0, 0, 1, 1, p[0]); rect(0.12, 0.3, 0.76, 0.5, p[2]); disc(0.5, 0.48, 0.12, pkMix(p[2], PK_BLACK, 0.5)); disc(0.56, 0.44, 0.11, p[2]); line([[0.3, 0.68], [0.7, 0.3]], p[1], 0.03); break;
    case 'ward': rect(0, 0, 1, 1, p[0]); for(let k = 3; k >= 1; k--){ const pts = []; for(let q = 0; q <= 6; q++){ const a = q/6*Math.PI*2 + Math.PI/6; pts.push([0.5 + Math.cos(a)*0.12*k*fh/fw, 0.5 + Math.sin(a)*0.13*k]); } line(pts, p[1], 0.018); }
      line([[0.4, 0.75], [0.6, 0.25]], p[2], 0.03); disc(0.6, 0.25, 0.04, p[2]); break;
    case 'throw': rect(0, 0, 1, 1, p[0]); rect(0, 0, 1, 0.08, p[2]); figure(0.15, 0.9, 0.55, p[1]); x.strokeStyle = pkCss(p[1]); x.lineWidth = Math.max(px(0.3), fh*0.02); x.setLineDash([fh*0.04, fh*0.05]); x.beginPath(); x.moveTo(U(0.22), V(0.45)); x.quadraticCurveTo(U(0.55), V(0.15), U(0.9), V(0.75)); x.stroke(); x.setLineDash([]); disc(0.9, 0.75, 0.04, p[2]); break;
    case 'wanted': rect(0, 0, 1, 1, p[0]); rect(0.15, 0.22, 0.7, 0.36, pkMix(p[0], PK_BLACK, 0.12)); rect(0.38, 0.3, 0.24, 0.26, p[1]); rect(0.44, 0.24, 0.12, 0.07, p[1]); rect(0.1, 0.62, 0.8, 0.08, p[2]); for(let k = 0; k < 8; k++) rect(0.06 + k*0.11, 0.86, 0.06, 0.14, pkMix(p[0], PK_BLACK, 0.05)); break;
    case 'stride': rect(0, 0, 1, 1, p[2]); poly([[0.45, 1], [0.85, 0.1], [1, 0.1], [0.7, 1]], p[0]); { const s = fh*0.75, X0 = U(0.72), Y0 = V(0.92); pkPoly(x, [[X0 - s*0.12, Y0], [X0, Y0 - s*0.45], [X0 + s*0.18, Y0], [X0 + s*0.06, Y0], [X0, Y0 - s*0.25], [X0 - s*0.04, Y0]], pkCss(p[1])); pkPoly(x, [[X0 - s*0.06, Y0 - s*0.42], [X0 + s*0.1, Y0 - s*0.45], [X0 + s*0.14, Y0 - s*0.78], [X0 - s*0.02, Y0 - s*0.8]], pkCss(p[1])); pkEll(x, X0 + s*0.06, Y0 - s*0.88, s*0.06, s*0.07, pkCss(p[1])); x.strokeStyle = pkCss(p[1]); x.lineWidth = s*0.05; x.beginPath(); x.moveTo(X0 + s*0.12, Y0 - s*0.75); x.lineTo(X0 + s*0.3, Y0 - s*0.95); x.stroke(); } break;
    case 'loop': rect(0, 0, 1, 1, p[0]); rect(0.06, 0.38, 0.88, 0.12, p[1]); disc(0.3, 0.44, 0.05, p[2]); line([[0.3, 0.3], [0.97, 0.3]], p[2], 0.02); line([[0.03, 0.3], [0.1, 0.3]], p[2], 0.02); for(let k = 0; k < 4; k++) rect(0.08 + k*0.22, 0.68, 0.06, 0.1, [p[1], p[2], [120, 160, 90], [200, 170, 80]][k]); break;
  }
}
// THE BOARD: what it stands on and what is on it, at (X, Y) with m pixels to the metre; id a key of PK_BOARDS (or a
// serial verse: { serial: [lines], k }); its state by its own stream: lit or not, faded, peeling, torn to an older
// board beneath, half-pasted with the crew still on the catwalk
export function pkBoard(x, X, Y, m, c, id, R0, px, night = 0, aged = 0){
  // (seen as the eye sees it, c.view: its face narrowed as it turns, and from behind its bare back; never mirrored, as
  //  it carries writing)
  if(c.view){ const { cs } = c.view; x.save(); x.translate(X, 0); x.scale(Math.max(0.1, Math.abs(cs)), 1); x.translate(-X, 0); pkBoard(x, X, Y, m, { ...c, view: null, back: cs < 0 }, id, R0, px, night, aged); x.restore(); return; }
  const sub = pkSub(R0), R = sub(1), RS = sub(2), RA = sub(3), ser = id && id.serial, B = ser ? { fmt: 'serial', pal: ['#c1121f', '#ffffff', '#111111'], say: [id.serial[id.k]], art: 'none', worlds: [] } : PK_BOARDS[id]; if(!B) return;
  const [fwM, fhM, upM] = PK_FMT[B.fmt], fw = fwM*m, fh = fhM*m, up = upM*m, fx = X - fw/2, fy = Y - up - fh, fmt = B.fmt;
  if(fw < px(2)) return;
  const wood = pkMat(c, PK_GREYWOOD, 0.65), steel = pkMat(c, aged > 0.5 ? PK_RUST : [96, 100, 104], 0.65), fade = Math.min(0.75, aged*0.6 + (fmt === 'poster' || fmt === 'bulletin' ? 0.12 : 0));
  // its colours, lit by the scene's light (a tube's are its own light), sun-faded toward a cooler grey
  const P = B.pal.map(h => { const v = pkHex(h), f = pkMix(v, pkMix([200, 204, 208], v, 0.25), fade); return fmt === 'tube' || fmt === 'vertical' ? f : pkMat(c, f, 0.85).body; });
  const neon = fmt === 'tube' || fmt === 'vertical', lit = neon ? (night > 0.2 ? 1 : 0.25) : 1;
  // ---- what it stands on ----
  pkCast(x, fx, fx + fw, Y, Math.min(fh + up, fw*0.6), c, 0.18);
  const post = (px0, top, col, w) => pkShade(x, [[px0 - w/2, Y], [px0 - w/2, top], [px0 + w/2, top], [px0 + w/2, Y]], col.body, top, Y, 0.2);
  if(fmt === 'timber' || fmt === 'map' || fmt === 'serial' || fmt === 'barn'){ const pw = Math.max(px(0.5), m*0.12), posts = fmt === 'serial' ? [X] : [X - fw*0.32, X + fw*0.32];
    for(const p0 of posts) post(p0, fy + fh*0.2, wood, pw);
    if(fmt !== 'serial' && m > px(3)){ x.strokeStyle = pkCss(wood.dark); x.lineWidth = Math.max(px(0.4), pw*0.5); x.beginPath(); for(const p0 of posts){ x.moveTo(p0, fy + fh); x.lineTo(p0 + (p0 < X ? 1 : -1)*fw*0.08, Y); } x.stroke(); } }
  else if(fmt === 'poster' || fmt === 'bulletin'){ const pw = Math.max(px(0.6), m*(fmt === 'bulletin' ? 1.0 : 0.3));
    if(fmt === 'bulletin') post(X, fy + fh*0.5, steel, pw); else for(const s of [-0.3, 0.3]) post(X + s*fw, fy + fh*0.5, steel, pw);
    if(m > px(2)){ // the catwalk along its foot, its rail, the lamps on their arms over it
      const cy = fy + fh + m*0.25, sag = aged > 0.6 ? m*0.6 : 0; x.fillStyle = pkCss(steel.dark); x.beginPath(); x.moveTo(fx, cy); x.lineTo(fx + fw*0.6, cy + sag); x.lineTo(fx + fw, cy); x.lineTo(fx + fw, cy + m*0.12); x.lineTo(fx + fw*0.6, cy + sag + m*0.12); x.lineTo(fx, cy + m*0.12); x.fill();
      x.strokeStyle = pkCss(steel.dark, 0.9); x.lineWidth = Math.max(px(0.3), m*0.04); x.beginPath(); x.moveTo(fx, cy - m*0.9); x.lineTo(fx + fw, cy - m*0.9); for(let k = 0; k <= 8; k++){ const sx = fx + fw*k/8; x.moveTo(sx, cy + (k > 2 && k < 7 ? sag*0.7 : 0)); x.lineTo(sx, cy - m*0.9); } x.stroke();
      const nl = fmt === 'bulletin' ? 4 : 2; for(let k = 0; k < nl; k++){ const lx = fx + fw*(k + 0.5)/nl; x.beginPath(); x.moveTo(lx, cy); x.quadraticCurveTo(lx, cy - m*1.2, lx + m*0.4, cy - m*1.3); x.stroke(); pkEll(x, lx + m*0.45, cy - m*1.3, m*0.18, m*0.08, pkCss(night > 0.2 && aged < 0.6 ? pkMix(c.glow, PK_WHITE, 0.6) : steel.body)); } } }
  else if(fmt === 'tube'){ const pw = Math.max(px(0.6), m*0.2); for(const s of [-0.38, 0.38]) post(X + s*fw, fy + fh, steel, pw); }
  else if(fmt === 'vertical'){ post(X - fw*0.6, fy - m*0.3, steel, Math.max(px(0.6), m*0.22)); x.strokeStyle = pkCss(steel.dark); x.lineWidth = Math.max(px(0.4), m*0.06); x.beginPath(); for(const v of [0.1, 0.9]){ x.moveTo(X - fw*0.6, fy + fh*v); x.lineTo(fx, fy + fh*v); } x.stroke(); }
  else if(fmt === 'shingle' || fmt === 'bottle'){ const pw = Math.max(px(0.5), m*0.1), pt = fy - m*0.5; post(X - fw*0.75, pt, wood, pw); x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.4), m*0.05); x.beginPath(); x.moveTo(X - fw*0.75, pt + m*0.1); x.lineTo(X + fw*0.4, pt + m*0.1); for(const s of [-0.35, 0.35]){ x.moveTo(X + s*fw, pt + m*0.1); x.lineTo(X + s*fw, fy); } x.stroke(); }
  else if(fmt === 'plate' || fmt === 'sheet'){ post(X, fy - m*0.1, steel, Math.max(px(0.5), m*0.07)); }
  // ---- its face ----
  const frame = fmt === 'slab' ? pkMat(c, [30, 32, 38], 0.7) : neon ? steel : fmt === 'poster' || fmt === 'bulletin' || fmt === 'plate' ? steel : wood;
  if(fmt === 'slab'){ pkShade(x, [[fx - fw*0.04, Y], [fx, fy - fh*0.1], [fx + fw, fy - fh*0.1], [fx + fw*1.04, Y]], frame.body, fy, Y, 0.15); }
  else if(fmt === 'bottle'){ x.fillStyle = pkCss(frame.dark); x.beginPath(); x.moveTo(fx, fy + fh); x.lineTo(fx, fy + fh*0.35); x.lineTo(fx + fw*0.35, fy + fh*0.2); x.lineTo(fx + fw*0.35, fy); x.lineTo(fx + fw*0.65, fy); x.lineTo(fx + fw*0.65, fy + fh*0.2); x.lineTo(fx + fw, fy + fh*0.35); x.lineTo(fx + fw, fy + fh); x.fill(); }
  else { const fr = Math.max(px(0.4), fh*0.04); x.fillStyle = pkCss(frame.dark); x.fillRect(fx - fr, fy - fr, fw + fr*2, fh + fr*2); }
  const face = fmt === 'slab' ? [fx + fw*0.05, fy + fh*0.05, fw*0.9, fh*0.7] : fmt === 'bottle' ? [fx + fw*0.06, fy + fh*0.38, fw*0.88, fh*0.58] : [fx, fy, fw, fh];
  const draw = (BB, PP) => {
    x.save(); x.beginPath(); x.rect(face[0], face[1], face[2], face[3]); x.clip();
    if(neon){ x.fillStyle = pkCss(pkMix(PP[2], PK_BLACK, 0.2)); x.fillRect(...face); }
    else if(fmt !== 'slab'){ x.fillStyle = pkCss(PP[2]); x.fillRect(...face); }
    if(ser){ x.fillStyle = pkCss(PP[0]); x.fillRect(...face); }
    if(face[3] > px(6) && BB.art !== 'none') pkBoardArt(x, BB, face[0], face[1], face[2], face[3]*(PK_SMALL.includes(fmt) ? 0.8 : 1), neon ? PP.map(q => pkMix(q, [70, 70, 80], 1 - lit)) : PP, c, RA, px, night, neon);
    // its words: the brand big, its line smaller under it (where the art leaves room), in its own face of type
    // (the words keep to where the picture leaves room: left, right, a band along the top, the middle; on a small sign,
    //  only its name, on a band along its foot)
    const [ux, uy, uw, uh] = face, face0 = BB.worlds.includes('magic') ? 'serif' : 'sans-serif', words = BB.say, small = PK_SMALL.includes(fmt), zone = small ? 'B' : PK_ZONE[BB.art] || 'L';
    const al = zone === 'L' ? 'left' : zone === 'R' ? 'right' : 'center', tx = zone === 'L' ? ux + uw*0.05 : zone === 'R' ? ux + uw*0.95 : ux + uw/2, mw = zone === 'L' || zone === 'R' ? uw*0.46 : uw*0.9, col = neon ? pkMix(PP[0], [70, 70, 80], 1 - lit) : BB.art === 'type' || BB.art === 'glyphs' || BB.art === 'pendant' || BB.art === 'label' ? (BB.art === 'glyphs' ? PK_BLACK : PP[1]) : pkMix(PP[0], PK_BLACK, 0.25);
    if(BB.art === 'vertical' || fmt === 'vertical'){ const ls = words.join('').split(''); for(let k = 0; k < ls.length; k++) pkType(x, ls[k], ux + uw/2, uy + uh*(0.1 + 0.85*(k + 0.8)/ls.length), uh/ls.length*0.85, uw*0.8, col, px, { tube: true }); }
    else if(ser){ pkType(x, words[0], ux + uw/2, uy + uh*0.62, uh*0.36, uw*0.9, PP[1], px); }
    else if(small){ x.fillStyle = pkCss(BB.art === 'throw' || BB.art === 'loop' ? PP[1] : pkMix(PP[0], PK_BLACK, 0.2)); x.fillRect(ux, uy + uh*0.8, uw, uh*0.2); pkType(x, words[0], ux + uw/2, uy + uh*0.96, uh*0.15, uw*0.9, pkInk(x, ux + uw/2, uy + uh*0.9, [...PP, [24, 22, 26], [242, 236, 222]]), px, { face: face0 }); }
    else { const ty = BB.art === 'glyphs' ? uy + uh*0.75 : BB.art === 'type' ? uy + uh*0.55 : uy + uh*(zone === 'T' ? 0.24 : 0.3), ts = BB.art === 'type' ? uh*0.32 : BB.art === 'glyphs' ? uh*0.11 : uh*(zone === 'T' ? 0.16 : 0.19);
      const sx = zone === 'L' ? tx + mw*0.3 : zone === 'R' ? tx - mw*0.3 : tx, ink = neon ? col : pkInk(x, sx, ty - ts*0.35, [...PP.map(q => pkMix(q, PK_BLACK, 0.12)), [24, 22, 26], [242, 236, 222]]);
      pkType(x, words[0], tx, ty, ts, mw, ink, px, { align: al, face: face0, tube: neon });
      if(words[1]) pkType(x, words[1], tx, ty + ts*1.1 + (BB.art === 'glyphs' ? uh*0.06 : 0), ts*0.5, mw, BB.art === 'glyphs' ? PK_BLACK : neon ? pkMix(PP[1], [70, 70, 80], 1 - lit) : ink, px, { align: al, face: face0, weight: 'normal', tube: neon }); }
    if(neon && lit > 0.5) pkGlow(x, face[0] + face[2]/2, face[1] + face[3]/2, Math.max(face[2], face[3])*0.7, PP[0], 0.3);
    x.restore(); };
  if(c.back){ // from behind: the back of its face, braced across, the bare backs of its sheets or planks
    const bk = fmt === 'slab' ? frame : fmt === 'timber' || fmt === 'barn' || fmt === 'shingle' || fmt === 'bottle' || fmt === 'map' || fmt === 'serial' ? wood : steel;
    x.fillStyle = pkCss(pkMix(bk.body, bk.dark, 0.3)); x.fillRect(face[0], face[1], face[2], face[3]);
    if(face[3] > px(8)){ x.strokeStyle = pkCss(bk.dark, 0.8); x.lineWidth = Math.max(px(0.4), face[3]*0.03); x.beginPath(); x.moveTo(face[0], face[1]); x.lineTo(face[0] + face[2], face[1] + face[3]); x.moveTo(face[0] + face[2], face[1]); x.lineTo(face[0], face[1] + face[3]);
      for(let k = 1; k < 4; k++){ x.moveTo(face[0] + face[2]*k/4, face[1]); x.lineTo(face[0] + face[2]*k/4, face[1] + face[3]); } x.stroke(); }
    return; }
  draw(B, P);
  // ---- what time has done to it ----
  if(!neon && fmt !== 'slab' && fh > px(8)){
    if(fmt === 'poster' || fmt === 'bulletin'){ x.strokeStyle = pkCss(PK_BLACK, 0.12); x.lineWidth = Math.max(px(0.3), fh*0.006); x.beginPath(); for(let k = 1; k < 5; k++){ x.moveTo(fx + fw*k/5, fy); x.lineTo(fx + fw*k/5, fy + fh); } x.moveTo(fx, fy + fh/2); x.lineTo(fx + fw, fy + fh/2); x.stroke(); } // the paper's sheets
    if(fmt === 'timber' || fmt === 'barn'){ x.fillStyle = pkCss(PK_BLACK, 0.1); for(let k = 1; k < 4; k++) x.fillRect(fx, fy + fh*k/4, fw, Math.max(px(0.3), fh*0.01)); } // its planks
    const st = RS();
    if((fmt === 'poster' || fmt === 'bulletin') && st < 0.18 + 0.4*aged){ // TORN: a ragged hole through to the board beneath
      const keys = Object.keys(PK_BOARDS).filter(k => PK_BOARDS[k].fmt === B.fmt && k !== id), old = keys[Math.floor(RS()*keys.length)];
      if(old){ const hx = fx + fw*(0.2 + 0.5*RS()), hy = fy + fh*(0.1 + 0.4*RS()), hw = fw*(0.2 + 0.25*RS()), hh = fh*(0.35 + 0.35*RS()), pts = [];
        for(let q = 0; q < 14; q++){ const a = q/14*Math.PI*2, r = 0.7 + 0.3*RS(); pts.push([hx + hw/2 + Math.cos(a)*hw/2*r, hy + hh/2 + Math.sin(a)*hh/2*r]); }
        x.save(); x.beginPath(); pts.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip(); const O = PK_BOARDS[old]; draw(O, O.pal.map(h => pkMat(c, pkMix(pkHex(h), [200, 204, 208], 0.5), 0.85).body)); x.restore();
        x.strokeStyle = pkCss(pkMix(P[2], PK_WHITE, 0.5), 0.9); x.lineWidth = Math.max(px(0.4), fh*0.015); x.beginPath(); pts.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.stroke(); } }
    else if((fmt === 'poster' || fmt === 'bulletin') && st < 0.3 + 0.3*aged){ // PEELING at a seam: a sheet curling away, the grey backing behind
      const k = 1 + Math.floor(RS()*4), sx = fx + fw*k/5, sy = fy + fh*(RS() < 0.5 ? 0 : 0.5), d = fh*(0.2 + 0.2*RS());
      pkPoly(x, [[sx, sy], [sx + d, sy], [sx, sy + d]], pkCss(pkMix(steel.body, PK_WHITE, 0.2))); pkPoly(x, [[sx + d, sy], [sx, sy + d], [sx + d*0.7, sy + d*0.9]], pkCss(pkMix(P[2], PK_WHITE, 0.4))); }
    else if((fmt === 'poster' || fmt === 'bulletin') && st < 0.36 && aged < 0.3 && m > px(3)){ // HALF-PASTED: the crew on the catwalk, the rest of the sheets still blank
      const at = 0.4 + 0.4*RS(); x.fillStyle = pkCss(pkMix(steel.body, PK_WHITE, 0.6)); x.beginPath(); x.moveTo(fx + fw*at, fy); x.lineTo(fx + fw, fy); x.lineTo(fx + fw, fy + fh); x.lineTo(fx + fw*(at - 0.08), fy + fh); x.fill();
      for(const u of [at - 0.05, at + 0.12]) pkProp(x, fx + fw*u, fy + fh + m*0.25, m*1.75, c, 'figure', mulberry32((RS()*4294967296) >>> 0), px, night);
      x.strokeStyle = pkCss(wood.body); x.lineWidth = Math.max(px(0.4), m*0.05); x.beginPath(); x.moveTo(fx + fw*(at + 0.12), fy + fh - m*0.8); x.lineTo(fx + fw*(at + 0.05), fy + fh*0.4); x.stroke(); }
    if(aged > 0.3){ pkStreaks(x, fx, fy, fw, fh, { ...c, dark: PK_RUST }, RS, px, 0.15*aged); x.fillStyle = pkCss(PK_WHITE, 0.15*aged); x.fillRect(fx, fy, fw, fh); }
  }
  // by night: the lamps throw their light up the face (a lamp gone dark here and there)
  if(night > 0.2 && (fmt === 'poster' || fmt === 'bulletin') && aged < 0.6){ const nl = fmt === 'bulletin' ? 4 : 2; for(let k = 0; k < nl; k++) if(R() < 0.85) pkGlow(x, fx + fw*(k + 0.5)/nl, fy + fh*0.75, fh*0.8, pkMix(c.glow, PK_WHITE, 0.6), 0.28*night); }
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
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.04); x.lineCap = 'round'; x.beginPath(); x.moveTo(X - sd*r*0.9, Y - h*0.5); x.lineTo(X - sd*r*1.4, Y - h*(0.75 + 0.15*R())); x.stroke();
    if(h > px(16)){ // (near: its panel seams on the shadow side, a vent, the wheel's hub, an aerial)
      x.lineWidth = Math.max(px(0.3), h*0.008); x.strokeStyle = pkCss(c.dark, 0.6); x.beginPath(); x.ellipse(X, Y - h*0.45, r*0.95, r*0.3, 0, 0, Math.PI); x.moveTo(X - sd*r*0.5, Y - h*0.75); x.lineTo(X - sd*r*0.5, Y - h*0.2); x.stroke();
      for(let k = 0; k < 3; k++) pkBar(x, X - sd*r*0.15 - r*0.15, Y - h*(0.35 - k*0.04), r*0.3, h*0.012, c.dark, px, 0.7); pkDisc(x, X, Y - r*0.5, r*0.18, pkCss(c.lit));
      x.strokeStyle = pkCss(c.dark); x.beginPath(); x.moveTo(X - sd*r*0.3, Y - h*0.98); x.lineTo(X - sd*r*0.4, Y - h*1.12); x.stroke(); pkDisc(x, X - sd*r*0.4, Y - h*1.12, r*0.06, pkCss(eyeCol)); }
    return; }
  if(kind === 'drone'){ // a little sphere hovering, two fins, its eye and a soft light beneath it
    const r = h*0.3, cy = Y - h*(1.6 + 1.6*R()); pkGlow(x, X, Y - h*0.05, r*2, eye, 0.18*glowA);
    pkPoly(x, [[X - r*1.9, cy], [X - r*0.8, cy - r*0.35], [X - r*0.8, cy + r*0.25]], pkCss(c.dark)); pkPoly(x, [[X + r*1.9, cy], [X + r*0.8, cy - r*0.35], [X + r*0.8, cy + r*0.25]], pkCss(c.dark));
    pkDisc(x, X, cy, r, pkCss(c.body)); pkDisc(x, X + sd*r*0.3, cy - r*0.3, r*0.5, pkCss(c.lit)); dot(X, cy + r*0.1, Math.max(px(0.5), r*0.25));
    if(r > px(5)){ x.strokeStyle = pkCss(c.dark, 0.6); x.lineWidth = Math.max(px(0.3), r*0.05); x.beginPath(); x.ellipse(X, cy, r, r*0.25, 0, 0, Math.PI); x.stroke(); for(const s of [-1, 1]){ pkEll(x, X + s*r*1.5, cy - r*0.15, r*0.5, r*0.1, pkCss(c.dark, 0.5)); } }
    return; }
  if(kind === 'crawler'){ // a low tracked tender, an arm folded over it, a lamp at its end
    const w = h*1.4; pkPoly(x, [[X - w/2, Y], [X - w/2 + h*0.1, Y - h*0.35], [X + w/2 - h*0.1, Y - h*0.35], [X + w/2, Y]], pkCss(c.dark));
    pkPoly(x, [[X - w*0.4, Y - h*0.3], [X - w*0.3, Y - h*0.6], [X + w*0.25, Y - h*0.6], [X + w*0.35, Y - h*0.3]], pkCss(c.body));
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.08); x.lineCap = 'round'; x.beginPath(); x.moveTo(X + w*0.2, Y - h*0.6); x.lineTo(X + w*0.1, Y - h*1.0); x.lineTo(X - w*0.3, Y - h*0.85); x.stroke();
    dot(X - w*0.3, Y - h*0.85, Math.max(px(0.5), h*0.07));
    if(h > px(10)){ for(let k = 0; k < 4; k++) pkDisc(x, X - w*0.36 + k*w*0.24, Y - h*0.16, h*0.12, pkCss(pkMix(c.dark, PK_BLACK, 0.3))); for(let k = 0; k < 4; k++) pkDisc(x, X - w*0.36 + k*w*0.24, Y - h*0.16, h*0.05, pkCss(c.body)); x.fillStyle = pkCss(c.dark, 0.5); x.fillRect(X - w*0.05, Y - h*0.58, Math.max(px(0.3), w*0.015), h*0.26); }
    return; }
  if(kind === 'sentry'){ // a turret on three legs: a wedge of a head, a slit of red eye, spikes along its back
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.beginPath(); for(const s of [-1, 0, 1]){ x.moveTo(X, Y - h*0.45); x.lineTo(X + s*h*0.35, Y); } x.stroke();
    pkPoly(x, [[X - h*0.45, Y - h*0.5], [X - h*0.2, Y - h*0.95], [X + h*0.5, Y - h*0.7], [X + h*0.25, Y - h*0.45]], pkCss(pkMix(c.dark, c.body, 0.3)));
    pkPoly(x, [[X - h*0.2, Y - h*0.95], [X + h*0.5, Y - h*0.7], [X + h*0.1, Y - h*0.75]], pkCss(c.lit));
    for(let q = 0; q < 3; q++) pkPoly(x, [[X - h*(0.4 - q*0.18), Y - h*(0.56 + q*0.12)], [X - h*(0.5 - q*0.18), Y - h*(0.8 + q*0.12)], [X - h*(0.3 - q*0.18), Y - h*(0.62 + q*0.12)]], pkCss(c.dark));
    x.fillStyle = pkCss(eyeCol, 0.95); x.fillRect(X + h*0.15, Y - h*0.72, h*0.25, Math.max(px(0.6), h*0.04)); pkGlow(x, X + h*0.28, Y - h*0.7, h*0.5, eyeCol, 0.4*glowA);
    if(h > px(12)){ pkDisc(x, X, Y - h*0.45, h*0.07, pkCss(pkMix(c.dark, PK_BLACK, 0.3))); for(const s of [-1, 0, 1]) pkDisc(x, X + s*h*0.35, Y, h*0.04, pkCss(c.dark)); x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.4), h*0.03); x.beginPath(); x.moveTo(X + h*0.4, Y - h*0.62); x.lineTo(X + h*0.62, Y - h*0.58); x.stroke(); }
    return; }
  if(kind === 'walker'){ // four jointed legs, a long low body, a head held forward: it hunts
    const bw = h*0.9, by = Y - h*0.62; x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.lineCap = 'round'; x.beginPath();
    for(const [lx, f] of [[-0.4, -1], [-0.15, 1], [0.15, -1], [0.4, 1]]){ const kx = X + lx*bw + f*h*0.12; x.moveTo(X + lx*bw*0.8, by); x.lineTo(kx, by - h*0.15); x.lineTo(X + lx*bw*1.1, Y); } x.stroke();
    pkPoly(x, [[X - bw/2, by + h*0.06], [X - bw*0.4, by - h*0.12], [X + bw*0.4, by - h*0.14], [X + bw/2, by + h*0.04]], pkCss(c.body));
    pkPoly(x, [[X + sd*bw*0.45, by - h*0.06], [X + sd*bw*0.75, by - h*0.12], [X + sd*bw*0.8, by + h*0.02], [X + sd*bw*0.5, by + h*0.05]], pkCss(pkMix(c.dark, c.body, 0.4)));
    dot(X + sd*bw*0.72, by - h*0.05, Math.max(px(0.5), h*0.035));
    if(h > px(12)){ for(const [lx, f] of [[-0.4, -1], [-0.15, 1], [0.15, -1], [0.4, 1]]) pkDisc(x, X + lx*bw + f*h*0.12, by - h*0.15, h*0.035, pkCss(pkMix(c.dark, PK_BLACK, 0.3))); x.strokeStyle = pkCss(c.dark, 0.6); x.lineWidth = Math.max(px(0.3), h*0.008); x.beginPath(); for(const u of [-0.2, 0.05, 0.25]){ x.moveTo(X + u*bw, by - h*0.12); x.lineTo(X + u*bw, by + h*0.05); } x.stroke(); }
    return; }
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

export function pkRock(x, X, Y, r, col, L, R, px){
  // a boulder: an irregular outline of eight to eleven points, flatter on its underside; split into facets (its top
  // catching the light, a lit side, a shadow side, a darker underside), lit from the light's side; near, a crack or two,
  // lichen in patches, grass grown up at its foot (docs/prior-art/ringworld-sprites.md: no pure primitives)
  const sd = L[0] > 0 ? 1 : -1, n = 8 + Math.floor(R()*4), pts = [], ap = [X + sd*r*0.15 + (R() - 0.5)*r*0.3, Y - r*(0.75 + 0.3*R())], near = px && r > px(12);
  for(let q = 0; q <= n; q++){ const t = Math.PI + q/n*Math.PI, k = 0.75 + 0.35*R(); pts.push([X + Math.cos(t)*r*k*(1 + 0.15*Math.sin(t*3)), Y + Math.sin(t)*r*(0.5 + 0.4*R())*k]); }
  pkEll(x, X - sd*r*0.45, Y + r*0.04, r*1.3, r*0.22, pkCss(pkMix(col, PK_BLACK, 0.6), 0.32));
  pkPoly(x, [...pts, [X + r*0.9, Y + r*0.06], [X - r*0.9, Y + r*0.06]], pkCss(pkMix(col, [20, 26, 44], 0.45)));
  const mid = Math.floor(n/2), litSide = sd > 0 ? pts.slice(mid) : pts.slice(0, mid + 1);
  pkPoly(x, [[X + sd*r*0.05, Y], ...litSide, ap], pkCss(col));
  pkPoly(x, [ap, pts[mid - 1], pts[mid], pts[mid + 1]], pkCss(pkMix(col, [255, 244, 220], 0.22)));
  const q2 = sd > 0 ? mid + 2 : mid - 2; if(pts[q2]) pkPoly(x, [ap, pts[q2], [X + sd*r*0.5, Y - r*0.2]], pkCss(pkMix(col, [255, 244, 220], 0.1)));
  if(near){ x.strokeStyle = pkCss(pkMix(col, PK_BLACK, 0.55), 0.6); x.lineWidth = Math.max(px(0.4), r*0.02); x.beginPath(); let cx = ap[0] + (R() - 0.5)*r*0.4, cy = ap[1] + r*0.15; x.moveTo(cx, cy); for(let k = 0; k < 3; k++){ cx += (R() - 0.5)*r*0.3; cy += r*0.15; x.lineTo(cx, cy); } x.stroke();
    for(let k = 0; k < 3; k++){ const lx = X + (R() - 0.5)*r, ly = Y - r*(0.3 + 0.4*R()), lc = R() < 0.6 ? [180, 186, 140] : [184, 120, 64]; for(let q = 0; q < 6; q++) pkEll(x, lx + (R() - 0.5)*r*0.15, ly + (R() - 0.5)*r*0.08, r*0.03, r*0.02, pkCss(pkMix(col, lc, 0.5), 0.6)); }
    x.fillStyle = pkCss(pkMix(col, [50, 90, 50], 0.7), 0.85); for(let k = 0; k < 9; k++){ const gx = X + (R() - 0.5)*r*1.8, gh = r*(0.06 + 0.1*R()); x.beginPath(); x.moveTo(gx - gh*0.3, Y + r*0.05); x.lineTo(gx + (R() - 0.5)*gh*0.6, Y - gh); x.lineTo(gx + gh*0.3, Y + r*0.05); x.fill(); } }
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
// a monolith of the builders: a tall slab, chamfered, on a stepped plinth; seams between its panels, a line of light let
// into its face, a band of script near its top (count: kept for its callers, one slab drawn)
export function pkMonolith(x, X, Y, hh, c, count, R, px){
  const mw = hh*0.2, pl = mw*0.35; if(hh < 1.5) return; const sd = c.sd, tl = hh*0.06*(R() < 0.5 ? 1 : -1), top = Y - hh;
  pkCast(x, X - mw*1.4, X + mw*1.4, Y, hh*0.6, c, 0.2);
  for(const [k, w] of [[0, 1.45], [1, 1.25]]) pkShade(x, [[X - mw*w, Y - pl*k], [X - mw*w, Y - pl*(k + 1)], [X + mw*w, Y - pl*(k + 1)], [X + mw*w, Y - pl*k]], k ? c.body : c.dark, Y - pl*(k + 1), Y - pl*k);
  const b = Y - pl*2, face = [[X - mw, b], [X - mw*0.92, top + Math.max(0, tl)], [X + mw*0.92, top + Math.max(0, -tl)], [X + mw, b]];
  pkShade(x, face, c.body, top, b, 0.18);
  pkPoly(x, [[X + sd*mw, b], [X + sd*mw*0.92, top + Math.max(0, -sd*tl)], [X + sd*mw*1.3, top + mw*0.25 + Math.max(0, -sd*tl)], [X + sd*mw*1.38, b + mw*0.1]], pkCss(c.dark));
  pkPoly(x, [[X + sd*mw*0.78, b], [X + sd*mw*0.74, top + Math.max(0, -sd*tl) + mw*0.1], [X + sd*mw*0.92, top + Math.max(0, -sd*tl)], [X + sd*mw, b]], pkCss(c.lit));
  if(hh > px(10)){ const lx = X - sd*mw*0.3; x.fillStyle = pkCss(pkMix(c.glow, PK_WHITE, 0.4), 0.85); x.fillRect(lx - Math.max(px(0.4), mw*0.035), top + hh*0.12, Math.max(px(0.8), mw*0.07), (b - top)*0.82); pkGlow(x, lx, top + hh*0.5, mw*1.6, c.glow, 0.3); }
  if(hh > px(22)){ x.fillStyle = pkCss(c.dark, 0.5); for(let k = 1; k < 6; k++) x.fillRect(X - mw*0.92, top + (b - top)*k/6, mw*1.84, Math.max(px(0.4), hh*0.004));
    x.strokeStyle = pkCss(c.glow, 0.75); x.lineWidth = Math.max(px(0.4), mw*0.03); x.beginPath(); const gy = top + hh*0.07;
    for(let k = 0; k < 7; k++){ const gx = X - mw*0.6 + k*mw*0.2, t = Math.floor(R()*3); if(t === 0){ x.moveTo(gx, gy - mw*0.07); x.lineTo(gx, gy + mw*0.07); } else if(t === 1){ x.moveTo(gx - mw*0.06, gy + mw*0.07); x.lineTo(gx, gy - mw*0.07); x.lineTo(gx + mw*0.06, gy + mw*0.07); } else { x.moveTo(gx - mw*0.06, gy); x.lineTo(gx + mw*0.06, gy); } } x.stroke();
    pkStreaks(x, X - mw*0.9, top, mw*1.8, b - top, c, R, px, 0.1); }
}
// A STANDING STONE (docs/prior-art/ringworld-sprites.md: sarsens and menhirs are rough, tapering, never square; they lean,
// their tops are rounded by weather, lichen grows on them in pale and rust-orange patches): h its height in pixels; its
// lit face and its shadow face split along an uneven ridge; o.wide a fallen one or a lintel's block
export function pkStone(x, X, Y, h, c, R0, px, o = {}){
  if(!(h > px(0.8))) return; const sub = pkSub(R0), R = sub(1), RL = sub(2), sd = c.sd, st = pkMat(c, PK_STONE, 0.7), j = () => (R() - 0.5)*0.12;
  const bw = h*(o.wide || (0.32 + 0.22*R())), lean = (R() - 0.5)*h*0.14, tp = 0.5 + 0.3*R();
  const pts = [[X - bw*0.5, Y + h*0.03]];
  for(const [u, v] of [[-0.54, 0.3], [-0.5*tp - 0.04, 0.68], [-0.32*tp, 0.92], [0.02, 1], [0.3*tp, 0.94], [0.48*tp + 0.03, 0.72], [0.53, 0.32]]) pts.push([X + (u + j())*bw + lean*v, Y - h*(v + j()*0.3)]);
  pts.push([X + bw*0.5, Y + h*0.03]);
  if(h > px(4)) pkCast(x, X - bw*0.45, X + bw*0.45, Y, h*0.5, c, 0.18);
  pkPoly(x, pts, pkCss(st.dark));
  // the lit face, from an uneven ridge toward the light; the top's facet catching it
  const rx = q => X + lean*(q) - sd*bw*(0.08 + 0.06*Math.sin(q*7 + R()*3)), lit = [[rx(0), Y + h*0.03]];
  for(const q of [0.3, 0.6, 0.85]) lit.push([rx(q), Y - h*q]);
  pkShade(x, [...lit, ...(sd > 0 ? pts.slice(4) : pts.slice(0, 5).reverse())], st.body, Y - h, Y, 0.16);
  pkPoly(x, [pts[3], pts[4], pts[5], [X + lean*0.85 + sd*bw*0.08, Y - h*0.82]], pkCss(pkMix(st.lit, st.body, 0.3)));
  if(h > px(9)){ // a crack, grooves of weather, lichen
    x.strokeStyle = pkCss(pkMix(st.dark, PK_BLACK, 0.3), 0.7); x.lineWidth = Math.max(px(0.4), bw*0.025); x.beginPath(); let cx = X + (R() - 0.3)*bw*0.4, cy = Y - h*(0.55 + 0.3*R()); x.moveTo(cx, cy);
    for(let k = 0; k < 3; k++){ cx += (R() - 0.5)*bw*0.18; cy += h*0.1; x.lineTo(cx, cy); } x.stroke();
    // (lichen in colonies: a few patches, each a scatter of small flecks, pale grey-green or rust)
    for(let k = 0, n = 3 + Math.floor(RL()*4); k < n; k++){ const ux = (RL() - 0.5)*bw*0.65 + lean*0.6, vy = 0.3 + RL()*0.6, lc = pkMat(c, RL() < 0.65 ? [186, 190, 150] : [184, 116, 62], 0.7).body, a0 = 0.45 + 0.35*RL();
      for(let q = 0, m = 5 + Math.floor(RL()*8); q < m; q++){ const r = bw*0.07*Math.sqrt(RL()), an = RL()*6.28; pkEll(x, X + ux + Math.cos(an)*r, Y - h*vy + Math.sin(an)*r*0.7, bw*(0.012 + 0.022*RL()), bw*(0.01 + 0.016*RL()), pkCss(lc, a0)); } } }
  if(h > px(20)){ x.strokeStyle = pkCss(st.dark, 0.3); x.lineWidth = Math.max(px(0.4), bw*0.015); x.beginPath(); for(let k = 0; k < 4; k++){ const gx = X + (RL() - 0.5)*bw*0.6 + lean*0.4; x.moveTo(gx, Y - h*(0.7 + 0.2*RL())); x.lineTo(gx + (RL() - 0.5)*bw*0.05, Y - h*(0.25 + 0.2*RL())); } x.stroke(); }
  // grass grown up round its foot
  if(h > px(6)){ x.fillStyle = pkCss(pkMat(c, [70, 104, 58], 0.8).body, 0.9); for(let k = 0; k < 7; k++){ const gx = X + (R() - 0.5)*bw*1.1, gh = h*(0.04 + 0.05*R()); x.beginPath(); x.moveTo(gx - gh*0.3, Y + h*0.03); x.lineTo(gx + (R() - 0.5)*gh*0.5, Y - gh); x.lineTo(gx + gh*0.3, Y + h*0.03); x.fill(); } }
}
// a lintel laid across two stones' tops (A, B the tops' inner points), th thick
export function pkLintel(x, A, B, th, c){ const st = pkMat(c, PK_STONE, 0.7), ov = (B[0] - A[0])*0.12;
  pkPoly(x, [[A[0] - ov, A[1] + th*0.15], [A[0] - ov*0.8, A[1] - th], [B[0] + ov*0.8, B[1] - th], [B[0] + ov, B[1] + th*0.15]], pkCss(st.dark));
  pkPoly(x, [[A[0] - ov*0.8, A[1] - th], [B[0] + ov*0.8, B[1] - th], [B[0] + ov*0.6, B[1] - th*0.55], [A[0] - ov*0.6, A[1] - th*0.55]], pkCss(st.lit)); }
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
