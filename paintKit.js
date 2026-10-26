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
const pkSub = R => { const b = (R()*4294967296) >>> 0, f = t => mulberry32((b ^ Math.imul(t, 0x9E3779B1)) >>> 0); f.b = b; pkNow = b; pkFace = 0; pkLodNow = 1; return f; };
let pkNow = 0, pkFace = 0, pkLodNow = 1;   // (the thing being drawn, how many faces of it so far: what its faces' grain is keyed by; and its detail size over its drawn size)   // (f.b: the thing's own number, the same every frame)
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
const pkShade = (x, pts, col, y0, y1, k = 0.14) => { const fi = ++pkFace; if(!(y1 - y0 > 2)) return pkPoly(x, pts, pkCss(col));
  const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, pkCss(pkMix(col, PK_WHITE, k*0.5))); g.addColorStop(0.62, pkCss(col)); g.addColorStop(1, pkCss(pkMix(col, PK_BLACK, k*1.2))); pkPoly(x, pts, g);
  if((y1 - y0)*pkLodNow > 70) pkGrain(x, pts, col, fi); };
// THE SURFACE NEAR (Ruby: "some minor texturing to the primitives especially when they're close"): a face large on the
// page shows what it is made of, faintly: a mottle of slightly lighter and darker patches, and fine streaks along it,
// kept inside the face; keyed to where the face stands, so it holds still as long as the thing does (a level of
// detail: nothing at all where the face is small)
function pkGrain(x, pts, col, fi){
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for(const [a, b] of pts){ x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
  const w = x1 - x0, h = y1 - y0; if(w < 24 || h < 24) return;
  // (its mottle keyed to the thing and which of its faces this is, never to where the face is drawn: a pan moves it with
  //  the face, never re-rolls it)
  const R = mulberry32((pkNow ^ Math.imul(fi, 0x85EBCA77)) >>> 0), n = Math.min(90, Math.floor(w*h/1400));
  x.save(); x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip();
  // (small and faint beside the face, however near: a wall filling the frame shows a fine mottle, never soft grey
  //  blots that read as clouds on it)
  for(let q = 0; q < n; q++){ const cx = x0 + R()*w, cy = y0 + R()*h, r = Math.max(2, Math.min(w, h)*(0.015 + 0.035*R())), lt = R() < 0.5;
    x.fillStyle = pkCss(pkMix(col, lt ? PK_WHITE : PK_BLACK, 0.05 + 0.05*R()), 0.4); x.beginPath(); x.ellipse(cx, cy, r*(1 + R()), r*(0.5 + 0.4*R()), 0, 0, Math.PI*2); x.fill(); }
  x.strokeStyle = pkCss(pkMix(col, PK_BLACK, 0.12), 0.18); x.lineWidth = h*0.004; x.beginPath();
  for(let q = 0, m = Math.min(24, Math.floor(h/18)); q < m; q++){ const yy = y0 + R()*h, xa = x0 + R()*w*0.6; x.moveTo(xa, yy); x.lineTo(xa + w*(0.1 + 0.3*R()), yy + (R() - 0.5)*2); } x.stroke();
  x.restore(); }
// the shadow a thing from X0 to X1, h tall, throws on the ground away from the light, foreshortened
// (c.shv, where the caller knows where the sun stands: the shadow's way on the page for each pixel of height, toward or
//  away from the eye as the sun falls; otherwise down the side from the light, a little toward the eye)
//  (a shadow falling away from the eye is held short, up the page no more than an eighth of the height, shortened along
//  its own way: it is drawn with its thing, after what stands farther, and a long one would lie over them)
export const pkShadowWay = (c, h) => { if(!c.shv) return [-c.sd*h*0.42, h*0.07]; let dx = c.shv[0]*0.6, dy = c.shv[1]*0.6; const L = Math.hypot(dx, dy), k = Math.min(1, 1.2/(L || 1), dy < -0.12 ? 0.12/-dy : 1, dy > 0.9 ? 0.9/dy : 1);
  return [dx*k*h, dy*k*h]; };
const pkCast = (x, X0, X1, Y, h, c, a = 0.22) => { const [dx, dy] = pkShadowWay(c, h); pkPoly(x, [[X0, Y], [X1, Y], [X1 + dx, Y + dy], [X0 + dx, Y + dy]], pkCss(pkMix(c.dark, PK_BLACK, 0.5), a)); };
// streaks of weather down a wall from x0..x0+w, top..top+ht (only where large enough to carry them)
const pkStreaks = (x, x0, top, w, ht, c, R, px, a = 0.16) => { if(ht*(c.lod || 1) < px(28) || w*(c.lod || 1) < px(6)) return;
  for(let k = 0, n = Math.min(14, 2 + Math.floor(w*(c.lod || 1)/px(9))); k < n; k++){ const sx = x0 + w*(0.04 + 0.92*R()), sy = top + ht*R()*0.7, len = ht*(0.06 + 0.22*R()), sw = Math.max(px(0.5), w*(0.005 + 0.012*R()));
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
  spruce: [18, 35], fir: [20, 45], stonepine: [12, 22], cedar: [20, 30], cypress: [12, 25], palm: [15, 28], baobab: [10, 22], acacia: [6, 14], saguaro: [2.2, 14], organpipe: [2.5, 7], barrel: [0.5, 1.8], pear: [0.6, 2.2], cholla: [0.6, 1.6], ocotillo: [2.5, 6], agave: [0.5, 1.3],
  joshua: [5, 9], bamboo: [8, 20], fern: [3, 7], mushroom: [4, 20], crystal: [6, 20], cherry: [8, 12], fruit: [4, 6.5], olive: [3.5, 6], bush: [1, 3], broadleaf: [12, 22], pine: [12, 20], poplar: [15, 25], birch: [10, 22], willow: [9, 15], dead: [8, 18], glow: [8, 18],
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
  wall: [1.1, 1.5], hedge: [1.5, 2.6], gate: [1.2, 1.3], haybale: [1.2, 1.5], haystack: [3, 5], trough: [0.5, 0.6], pole: [10, 13], milestone: [0.6, 1], boundary: [0.7, 1.1], banner: [4.2, 5.6], welcome: [2.3, 2.9], cairn: [0.6, 2], stonepile: [0.4, 0.7], gulls: [1, 1], scarecrow: [1.7, 1.9],
  beehives: [0.6, 1.0], well: [2.3, 2.7], wishing: [2.3, 2.7], windpump: [9, 11], tractor: [2.5, 3], grainbin: [6, 10], shrine: [2, 3], busstop: [2.5, 2.7], phonebox: [2.4, 2.5], vending: [1.8, 1.9],
  signal: [3, 3.4], kiosk: [2.6, 3], cart: [2.1, 2.4], parked: [1.4, 1.6], hulk: [1.3, 1.4], scooter: [1.0, 1.2], rubble: [0.6, 2.4], column: [1.5, 4], statue: [1.6, 2.4], container: [2.59, 2.6], traps: [1.2, 1.4],
  camp: [1.8, 2.4], charcoal: [1.8, 3.2], hide: [3.5, 5], bothy: [3.5, 5], lookout: [9, 14], bandstand: [5, 7], fountain: [2.5, 4],
  cargo: [1.2, 2.4], solar: [2, 2.6], dish: [6, 12], beacon: [5, 10], pipes: [1.5, 2.5], tripod: [1.4, 1.6], menhir: [1.8, 4.5], dolmen: [1.8, 2.6], fairyring: [0.12, 0.16], wisp: [0.3, 0.4], flower: [3, 5],
  toadstool: [2.5, 4], moongate: [3, 4],
  warden: [1.0, 1.4], slabgate: [14, 22], pod: [3, 4], spire: [90, 160], cogdoor: [8, 11], diner: [5, 6.5], car: [1.4, 1.6], suit: [6, 8], caps: [0.12, 0.15],
  rock: [1, 7], grass: [0.3, 1.1], figure: [1.5, 1.95], sheep: [0.75, 0.9], boat: [1.6, 2.6],
  harvester: [2.4, 3.2], shepherd: [0.7, 0.9], lamplighter: [2.4, 2.8], crab: [0.4, 0.7] };
// a size in its range, tall specimens rarer (u: a draw from 0 to 1)
export const pkMetres = (kind, u, j = 0) => { const r = PK_SIZE[kind]; return r[2*j] + (r[2*j + 1] - r[2*j])*Math.pow(u, 1.5); };
// the archetype a style raises, by weight (the caller may choose it first, to size it before it is drawn)
export function pkArchOf(style, u){ const arch = PK_ARCH[style] || PK_ARCH.city; let tot = 0; for(const [, w] of arch) tot += w; let r = u*tot;
  for(const [k, w] of arch){ r -= w; if(r < 0) return k; } return arch[0][0]; }

// ---------------- TREES ----------------
// which trees each kind of world grows (the caller picks one of these by its stream)
export const PK_TREES = { wild: ['spruce', 'spruce', 'broadleaf', 'broadleaf', 'pine', 'poplar', 'birch'], magic: ['broadleaf', 'broadleaf', 'birch', 'willow', 'spruce', 'poplar'], ruins: ['dead', 'dead', 'spruce', 'broadleaf', 'pine'] };
// (and by the land's climate: dry country, warm country, jungle, and the fey places of magic worlds)
export const PK_FLORA = { dry: ['saguaro', 'saguaro', 'saguaro', 'organpipe', 'barrel', 'barrel', 'pear', 'pear', 'cholla', 'cholla', 'ocotillo', 'agave', 'joshua', 'acacia', 'acacia', 'baobab', 'bush', 'dead'], warm: ['stonepine', 'stonepine', 'cypress', 'cypress', 'cedar', 'palm', 'broadleaf', 'cherry', 'bush'],
  jungle: ['palm', 'palm', 'fern', 'fern', 'bamboo', 'broadleaf', 'broadleaf', 'bush'], cold: ['fir', 'fir', 'spruce', 'spruce', 'birch', 'pine', 'bush'],
  fey: ['mushroom', 'mushroom', 'crystal', 'cherry', 'fern', 'willow', 'bamboo', 'willow'] };
// THE TREES (Ruby, 2026-10-22: "change the conifers … make sure all the trees match the current art style and none have
// disconnected pieces … variations in size and form within species … not just colour … shape and branch variations …
// shading on all trees … texture when close … leaf translucency … subsurface scattering"; docs/prior-art/ringworld-trees.md)
// A TREE'S OWN FORM, from its own stream, so no two of a kind are alike: how wide its crown is for its height, how tall
// its crown sits, how it leans, which side it has grown out toward, how open its crown is (the sky through it), how old
// it is (young, narrow and pointed; old, broad and uneven, its lower limbs gone), and a touch of its own green
function pkTreeForm(R){ return { wide: 0.78 + 0.5*R(), tall: 0.9 + 0.2*R(), lean: (R() - 0.5)*0.1, side: (R() - 0.5)*0.5, open: R(), age: R(), hue: R()*2 - 1, val: R()*2 - 1 }; }
// (its colours nudged a few percent toward yellow or blue-green, a little lighter or darker; and when the sun is behind
//  it, the light through its leaves: the side you see in shade, its edges glowing yellow-green, its shade lifted a
//  little by the light scattered in the leaves)
function pkTreeTint(c, F){ const k = 1 + F.val*0.05, t = col => [Math.min(255, col[0]*k*(1 + F.hue*0.04)), Math.min(255, col[1]*k), Math.min(255, col[2]*k*(1 - F.hue*0.05))];
  const back = Math.max(0, Math.min(1, c.back || 0)), tr = pkMix(pkMix(t(c.lit), [176, 222, 120], 0.42), c.sun || PK_WHITE, 0.2);
  return { ...c, dark: pkMix(t(c.dark), tr, back*0.16), body: pkMix(t(c.body), t(c.dark), back*0.22), lit: pkMix(t(c.lit), t(c.body), back*0.45), trans: tr, back }; }
// A CROWN GROWN, NOT SCATTERED: each lobe set against one already there (overlapping it), so the crown is one body and
// nothing floats; inside an envelope (rx, ry about cx, cy) leaning toward the tree's side
function pkGrow(n, cx, cy, rx, ry, r0, R, F){ const lobes = [[cx, cy, r0]];
  for(let k = 1, tries = 0; k < n && tries < n*14; tries++){ const p = lobes[Math.floor(R()*lobes.length)], a = R()*Math.PI*2, r = r0*(0.5 + 0.5*R()), d = (p[2] + r)*(0.45 + 0.3*R());
    const X = p[0] + Math.cos(a)*d, Y = p[1] + Math.sin(a)*d*(ry/rx > 1 ? 1 : 0.85), u = (X - cx - F.side*rx*0.25)/rx, v = (Y - cy)/ry; if(u*u + v*v > 1) continue;
    lobes.push([X, Y, r]); k++; }
  return lobes; }
// a crown of lobes (a broadleaf, a willow's, a poplar's): every lobe in shadow first, then each again smaller and
// toward the light in the body's colour, then a few small lit lobes on the lit side of the crown's top
// THE TREES' SEASONS (Ruby's order, PLANTS: "blooming and turning in their seasons for the other trees (blossom, autumn
//  colour, bare branches, snow on them)"; docs/prior-art/ringworld-trees.md §7): a bare crown is its twigs, a fine dark
//  haze in the crown's shape with the limbs' last forks drawn into it, the sky through; a crown in blossom is dotted
//  over with its flowers, more toward the light. (c.bare, c.blossom: set by the caller from the year's turn)
function pkBareCrown(x, lobes, c, R, cx, cy, rr, px){ const tw = pkMix(c.trunk || c.dark, c.dark, 0.3), hz = pkMix(pkMix(tw, [128, 98, 104], 0.4), c.air || c.lit, 0.3);
  // (winter twigs read from afar as a purplish-brown haze, denser at the crown's heart)
  for(const [X, Y, r] of lobes){ pkDisc(x, X, Y, r*0.92, pkCss(hz, 0.22)); pkDisc(x, X, Y + r*0.15, r*0.55, pkCss(hz, 0.22)); }
  x.lineCap = 'round'; x.strokeStyle = pkCss(tw, 0.75);
  for(const [X, Y, r] of lobes){ const n = px && r*(c.lod || 1) > px(6) ? 9 : 3; for(let q = 0; q < n; q++){ const a = -Math.PI/2 + (R() - 0.5)*2.4, l = r*(0.6 + 0.4*R()), bx = X + (cx - X)*0.35, by = Y + r*0.5;
    x.lineWidth = Math.max(px ? px(0.35) : 0.35, r*0.035); x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(X, Y, X + Math.cos(a)*l, Y + Math.sin(a)*l); x.stroke(); } }
  if(c.snow) for(const [X, Y, r] of lobes) pkEll(x, X, Y - r*0.35, r*0.55, r*0.12, pkCss([242, 244, 250], 0.7)); }
function pkBlossom(x, lobes, c, R, px){ const RB = mulberry32((R()*4294967296) >>> 0), n = Math.min(160, lobes.length*(px && lobes[0] && lobes[0][2]*(c.lod || 1) > px(8) ? 9 : 3));
  for(let q = 0; q < n; q++){ const [X, Y, r] = lobes[Math.floor(RB()*lobes.length)], a = RB()*Math.PI*2, d = r*0.8*Math.sqrt(RB()), lt = Math.cos(a)*c.L[0] + Math.sin(a)*c.L[1];
    pkDisc(x, X + Math.cos(a)*d, Y + Math.sin(a)*d, Math.max(px ? px(0.5) : 0.5, r*(0.07 + 0.05*RB())), pkCss(lt > 0 ? pkMix(c.blossom, PK_WHITE, 0.25) : pkMix(c.blossom, c.dark, 0.25), 0.9)); } }
function pkLobes(x, lobes, c, R, cx, cy, rr, px){
  if(c.bare) return pkBareCrown(x, lobes, c, R, cx, cy, rr, px);
  pkLobesOf(x, lobes, c, R, cx, cy, rr, px); if(c.blossom) pkBlossom(x, lobes, c, R, px);
  // (snow on the crown: a cap on each clump's top, white toward the light, blue-grey away)
  if(c.snow) for(const [X, Y, r] of lobes){ const lt = (X - cx)*c.L[0] > 0; pkEll(x, X, Y - r*0.55, r*0.62, r*0.2, pkCss(lt ? [244, 246, 252] : [204, 212, 230], 0.92)); } }
function pkLobesOf(x, lobes, c, R, cx, cy, rr, px){
  // (rd: the crown's size as its detail reads it, at its true distance, so a turn never changes its stage; and the
  //  leaves and the backlit dashes each on a stream of their own, so a leaf more moves nothing else)
  const lx = c.L[0], ly = c.L[1], rd = rr*(c.lod || 1), big = px && rd > px(10), RLf = mulberry32((R()*4294967296) >>> 0), RBk = mulberry32((R()*4294967296) >>> 0);
  // (the crown's own shade: its lower inside, toward the trunk, deepest, as the light reaches it least)
  if(!big){ // far off: each lobe a disc in shadow, again smaller toward the light, a lit cap on the lit side
    for(const [X, Y, r] of lobes) pkDisc(x, X, Y, r, pkCss(c.dark));
    for(const [X, Y, r] of lobes) pkDisc(x, X + lx*r*0.22, Y + ly*r*0.22, r*0.78, pkCss(c.body));
    for(const [X, Y, r] of lobes){ const fx = (X - cx)/rr, fy = (Y - cy)/rr; if(fx*lx + fy*ly < 0.05) continue; pkDisc(x, X + lx*r*0.38, Y + ly*r*0.38, r*0.42, pkCss(c.lit)); }
    if(px && rd > px(6)) for(let q = 0; q < 3; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = Math.atan2(ly, lx) + (R() - 0.5)*1.2; pkDisc(x, X + Math.cos(a)*r*0.6, Y + Math.sin(a)*r*0.6, r*0.14, pkCss(pkMix(c.lit, PK_WHITE, 0.35))); }
    pkBacklit(x, lobes, c, RBk, false); return; }
  // NEAR (less cartoony: a crown is clumps of leaves, not balls): each lobe's edge broken into small clusters, so its
  // silhouette is ragged; within, clusters in the body's colour toward the light and lit clusters on the lit side, the
  // deep shade left showing between them; and a few gaps where the sky shows through
  const deep = pkMix(c.dark, PK_BLACK, 0.25);
  for(const [X, Y, r] of lobes){ pkDisc(x, X, Y, r*0.82, pkCss(c.dark)); for(let q = 0, n = 9; q < n; q++){ const a = q/n*Math.PI*2 + R()*0.5, d = r*(0.72 + 0.12*R()); pkDisc(x, X + Math.cos(a)*d, Y + Math.sin(a)*d*0.9, r*(0.22 + 0.12*R()), pkCss(c.dark)); } }
  for(const [X, Y, r] of lobes) for(let q = 0; q < 11; q++){ const a = R()*Math.PI*2, d = r*0.62*Math.sqrt(R()), ox = X + lx*r*0.2 + Math.cos(a)*d, oy = Y + ly*r*0.2 + Math.sin(a)*d;
    pkDisc(x, ox, oy, r*(0.14 + 0.12*R()), pkCss(c.body)); }
  // (the crown's own shade: its lower inside, toward the trunk, deepest, as the light reaches it least; kept within it)
  { let bx = 0, by = 0, bw = 0; for(const [X, Y, r] of lobes){ bx += X*r; by += Y*r; bw += r; } x.save(); x.beginPath(); for(const [X, Y, r] of lobes){ x.moveTo(X + r*0.84, Y); x.arc(X, Y, r*0.84, 0, Math.PI*2); } x.clip();
    pkEll(x, bx/bw - lx*rr*0.15, by/bw + rr*0.45, rr*0.85, rr*0.42, pkCss(pkMix(c.dark, PK_BLACK, 0.25), 0.45)); x.restore(); }
  for(const [X, Y, r] of lobes){ const fx = (X - cx)/rr, fy = (Y - cy)/rr, lt = fx*lx + fy*ly; if(lt < -0.2) continue;
    for(let q = 0; q < 9; q++){ const a = Math.atan2(ly, lx) + (R() - 0.5)*1.8, d = r*(0.3 + 0.5*R()); pkDisc(x, X + Math.cos(a)*d, Y + Math.sin(a)*d, r*(0.06 + 0.07*R()), pkCss(lt > 0.2 && R() < 0.4 ? pkMix(c.lit, PK_WHITE, 0.1) : c.lit)); } }
  // (the sky through the crown, here and there, and dark hollows deeper in)
  for(let q = 0; q < 3; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = R()*Math.PI*2; pkDisc(x, X + Math.cos(a)*r*0.45, Y + Math.sin(a)*r*0.45, r*0.09, pkCss(deep, 0.8)); }
  if(c.air) for(let q = 0; q < 2; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = R()*Math.PI*2; pkDisc(x, X + Math.cos(a)*r*0.8, Y + Math.sin(a)*r*0.8, r*0.07, pkCss(c.air, 0.85)); }
  // CLOSE BY, LEAVES: small leaves of the tree's own shape over the crown, each in the light of where it sits (lit toward
  // the light, in shade away from it), so the crown has a texture and not only a shape
  if(rd > px(34)){ const n = Math.min(rd > px(90) ? 720 : 320, Math.round(rd*rd/(px(5)*px(5))*0.35)), s0 = Math.max(px(1.1), rr*0.028)*(c.leaf || 1), R = RLf;
    for(let q = 0; q < n; q++){ const [X, Y, r] = lobes[Math.floor(R()*lobes.length)], a = R()*Math.PI*2, d = r*Math.sqrt(R())*0.92, lxp = X + Math.cos(a)*d, lyp = Y + Math.sin(a)*d, f = ((lxp - cx)*lx + (lyp - cy)*ly)/rr + (R() - 0.5)*0.3;
      const col = f > 0.3 ? pkMix(c.lit, PK_WHITE, 0.08*R()) : f > -0.15 ? c.body : c.dark, s = s0*(0.7 + 0.6*R()); x.fillStyle = pkCss(col, 0.8); x.beginPath(); x.ellipse(lxp, lyp, s, s*(c.leafW || 0.45), R()*Math.PI, 0, Math.PI*2); x.fill(); } }
  pkBacklit(x, lobes, c, RBk, true);
}
// THE LIGHT THROUGH THE LEAVES (the sun behind the tree, c.back): where a lobe lies on the crown's outline the leaves are
// thin against the light and glow, brightest at the very edge; near, a soft bloom of it spilling past the outline into
// the air (Ruby: the band it was, inside the edge, "looks like a yellow coffee stain"): laid on as light (screen), so it
// brightens what it falls on and never paints a band of its own colour
function pkBacklit(x, lobes, c, R, big){ const back = c.back || 0; if(back < 0.05) return; const tr = c.trans || c.lit; x.lineCap = 'round';
  // (along each lobe's arc wherever it is the crown's outline: a wide soft glow, then the bright thin edge)
  // (the outline only: a point of the arc not under another lobe, open air just beyond it, and facing out of the crown,
  //  so the gaps between lobes inside the crown are not rimmed)
  let gx = 0, gy = 0, gw = 0; for(const [X, Y, r] of lobes){ gx += X*r; gy += Y*r; gw += r; } gx /= gw; gy /= gw;
  const open = (px0, py0, L1) => !lobes.some(L2 => L2 !== L1 && Math.hypot(px0 - L2[0], py0 - L2[1]) < L2[2]);
  for(const L1 of lobes){ const [X, Y, r] = L1, n = 24, out = []; for(let q = 0; q <= n; q++){ const a = q/n*Math.PI*2, ca = Math.cos(a), sa = Math.sin(a), ox = X - gx, oy = Y - gy, od = Math.hypot(ox, oy) || 1;
      out.push(open(X + ca*r*0.92, Y + sa*r*0.92, L1) && open(X + ca*r*1.6, Y + sa*r*1.6, L1) && (ca*ox + sa*oy)/od > -0.35); }
    for(let q = 0; q < n;){ if(!out[q]){ q++; continue; } let e = q; while(e < n && out[e + 1]) e++; const a0 = q/n*Math.PI*2 - 0.1, a1 = (e + 1)/n*Math.PI*2 + 0.1;
      // (the thin edge broken where leaves stand out against the light, as a backlit crown's edge is)
      const gco = x.globalCompositeOperation; x.globalCompositeOperation = 'screen';
      for(const [w, al, rk] of big ? [[0.2, 0.1, 1.02], [0.05, 0.42, 0.96]] : [[0.12, 0.34, 0.97]]){ x.strokeStyle = pkCss(tr, Math.min(0.7, back*al)); x.lineWidth = r*w; if(big && w < 0.1 && x.setLineDash){ const d = []; for(let k = 0; k < 8; k++) d.push(r*(k % 2 ? 0.03 + 0.08*R() : 0.1 + 0.3*R())); x.setLineDash(d); }
        x.beginPath(); x.arc(X, Y, r*rk, a0, a1); x.stroke(); if(x.setLineDash) x.setLineDash([]); }
      x.globalCompositeOperation = gco;
      q = e + 1; } } }
// A FROND (a palm's, a tree fern's): a thin midrib arching out and down, and its leaflets from both sides of it, longest
// at its middle, so it reads as a feather and not a band; a palm's leaflets hang, a fern's spread flat (spread 0 to 1); far,
// the feather's outline filled; near, each leaflet its own line
function pkFrond(x, tx, ty, a, len, col, droop, lit, c, h, px, R, feather, spread){ const ex = tx + Math.cos(a)*len, ey = ty + Math.sin(a)*len*0.35 + len*droop, mx = tx + Math.cos(a)*len*0.55, my = ty - len*0.2 + Math.sin(a)*len*0.2;
  const at = t => [(1 - t)*(1 - t)*tx + 2*(1 - t)*t*mx + t*t*ex, (1 - t)*(1 - t)*ty + 2*(1 - t)*t*my + t*t*ey], hang = t => len*(0.26 - 0.1*spread)*Math.pow(Math.sin(Math.PI*Math.min(1, t*1.08)), 0.7);
  const dir = t => { const [a0, b0] = at(Math.max(0, t - 0.02)), [a1, b1] = at(Math.min(1, t + 0.02)), d = Math.hypot(a1 - a0, b1 - b0) || 1; return [(a1 - a0)/d, (b1 - b0)/d]; };
  // (where a leaflet from side sdd at t ends: hanging down, or spread out from the midrib, a little forward)
  const tip = (t, sdd, hl) => { const [qx, qy] = at(t), [ux, uy] = dir(t), nx = -uy*sdd, ny = ux*sdd; return [qx, qy, ux, uy, qx + (ux*0.35 + nx*(0.2 + 0.8*spread))*hl, qy + (1 - spread)*hl*(0.85 + 0.15*sdd) + spread*(uy*0.35 + ny)*hl]; };
  if(!feather){ const up = [], dn = []; for(let k = 0; k <= 10; k++){ const t = k/10, hl = hang(t), [, , , , ax, ay] = tip(t, -1, hl), [, , , , bx, by] = tip(t, 1, hl); up.push([ax, ay]); dn.push([bx, by]); }
    pkPoly(x, [...up, ...dn.reverse()], pkCss(col)); return; }
  x.strokeStyle = pkCss(col); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.5), h*0.006); x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
  const m = Math.min(40, Math.round(len*(c.lod || 1)/px(2.2))), lw = Math.max(px(0.45), h*0.0035);
  for(const sdd of [-1, 1]) for(let k = 1; k <= m; k++){ const t = k/(m + 1), hl = hang(t)*(0.8 + 0.4*R()), [qx, qy, ux, uy, lx, ly] = tip(t, sdd, hl);
    x.strokeStyle = pkCss(lit && sdd < 0 && R() < 0.6 ? c.lit : col, 0.92); x.lineWidth = lw; x.beginPath(); x.moveTo(qx, qy); x.quadraticCurveTo(qx + ux*hl*0.3, qy + uy*hl*0.3 + (1 - spread)*hl*0.15, lx, ly); x.stroke();
    if(c.back > 0.05 && R() < 0.5){ x.strokeStyle = pkCss(c.trans, c.back*0.55); x.stroke(); } } }
// A LIMB from (x0, y0) to (x1, y1), tapering, a little bent: what holds a clump of the crown to the tree
// (one smooth tapering shape, round at its root, so a thick limb has no steps)
function pkLimb(x, x0, y0, x1, y1, w0, col, px, bend = 0.15, lod = 1){ const mx = (x0 + x1)/2 + (y1 - y0)*bend, my = (y0 + y1)/2 - (x1 - x0)*bend*0.4, w = Math.max(px(0.5), w0);
  if(w*lod < px(2)){ x.strokeStyle = pkCss(col); x.lineCap = 'round'; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(mx, my, x1, y1); x.stroke(); return; }
  const q = t => [(1 - t)*(1 - t)*x0 + 2*(1 - t)*t*mx + t*t*x1, (1 - t)*(1 - t)*y0 + 2*(1 - t)*t*my + t*t*y1], L = [], Rt = [];
  for(let k = 0; k <= 8; k++){ const t = k/8, [a, b] = q(t), [a1, b1] = q(Math.min(1, t + 0.02)), [a0, b0] = q(Math.max(0, t - 0.02)), d = Math.hypot(a1 - a0, b1 - b0) || 1, nx = -(b1 - b0)/d, ny = (a1 - a0)/d, hw = w*(1 - 0.55*t)/2;
    L.push([a + nx*hw, b + ny*hw]); Rt.push([a - nx*hw, b - ny*hw]); }
  pkPoly(x, [...L, ...Rt.reverse()], pkCss(col)); pkDisc(x, x0, y0, w/2, pkCss(col)); pkDisc(x, x1, y1, w*0.45/2, pkCss(col)); }
// BARK, near: each kind's own (docs/prior-art/ringworld-trees.md §5): a pine's plates, an oak's ridges, a birch's dark
// marks across its white, a beech's smooth grey left bare, a cedar's fibrous strips
function pkBark(x, X, Y, top, wd, lean, kind, c, R, px){ if(wd*(c.lod || 1) < px(5)) return; const w = wd/2, at = u => X + lean*u, dk = pkMix(c.trunk, PK_BLACK, 0.4), lt = pkMix(c.trunk, PK_WHITE, 0.22);
  if(kind === 'birch'){ for(let k = 0, n = Math.round(top/(w*0.9)); k < n; k++){ const u = 0.06 + 0.9*R(), y = Y - top*u, bx = at(u) + (R() - 0.5)*w*0.6, len = w*(0.3 + 0.6*R()); x.fillStyle = pkCss(PK_BLACK, 0.55); x.fillRect(bx - len/2, y, len, Math.max(px(0.5), w*0.08)); }
    x.fillStyle = pkCss(PK_BLACK, 0.5); x.beginPath(); x.moveTo(X - w*1.6, Y); x.lineTo(X - w*0.9, Y - top*0.08); x.lineTo(X + w*0.9, Y - top*0.1); x.lineTo(X + w*1.6, Y); x.fill(); return; }
  x.lineCap = 'round';
  if(kind === 'pine'){ for(let k = 0, n = Math.round(top/(w*0.7)); k < n; k++){ const u = R()*0.9, y = Y - top*u, bx = at(u) + (R() - 0.5)*w*1.2; x.strokeStyle = pkCss(R() < 0.5 ? dk : lt, 0.6); x.lineWidth = Math.max(px(0.4), w*0.08); x.beginPath(); x.moveTo(bx - w*0.25, y); x.lineTo(bx + w*0.25, y + w*0.05); x.stroke(); } return; }
  const n = kind === 'cedar' || kind === 'cypress' ? 9 : kind === 'poplar' || kind === 'beech' ? 3 : 6;
  for(let k = 0; k < n; k++){ const o = (k/(n - 1) - 0.5)*w*1.4 + (R() - 0.5)*w*0.15, u0 = R()*0.3, u1 = 0.5 + 0.5*R(); x.strokeStyle = pkCss(dk, kind === 'poplar' ? 0.35 : 0.55); x.lineWidth = Math.max(px(0.4), w*0.07);
    x.beginPath(); x.moveTo(at(u0) + o, Y - top*u0); x.quadraticCurveTo(at((u0 + u1)/2) + o + (R() - 0.5)*w*0.3, Y - top*(u0 + u1)/2, at(u1) + o, Y - top*u1); x.stroke(); }
  if(kind === 'poplar'){ for(let k = 0; k < 3; k++){ const u = 0.2 + 0.6*R(), bx = at(u) + (R() - 0.5)*w; x.fillStyle = pkCss(dk, 0.6); x.beginPath(); x.moveTo(bx, Y - top*u - w*0.3); x.lineTo(bx + w*0.25, Y - top*u); x.lineTo(bx, Y - top*u + w*0.3); x.lineTo(bx - w*0.25, Y - top*u); x.fill(); } } }
// A CONIFER OF BRANCH TIERS (Ruby: "change the conifers"): no stack of triangles but whorls of branches, each tier a
// skirt growing out from the trunk, its tips drooping and turning up (a spruce) or held level (a fir), its top lit and
// its underside in shade, each side its own length, some short or gone, the upper tiers over the lower; a spire at the
// top; near, its needles hanging from each tier's edge. o: { bw (half-width at the base, of h), n (tiers), droop, lift
// (the tips turning up), spire (of h), bare (of h: the trunk bare below the lowest tier) }
function pkConifer(x, X, Y, h, c, R, F, o, px, small, sub){
  const hd = h*(c.lod || 1), rnd = (a, b) => a + (b - a)*R(), sd = c.sd, lean = F.lean*h*0.3, bare = h*o.bare, top = Y - h, n = small ? Math.min(5, o.n) : o.n, axis = u => X + lean*u;
  // (the trunk, up the middle, thinning; seen where the tiers leave it bare)
  const tw = h*0.035*(0.8 + 0.4*F.age); if(tw < px(1.2)){ x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.6), tw); x.beginPath(); x.moveTo(X, Y); x.lineTo(axis(0.7), Y - h*0.7); x.stroke(); }
  else { pkPoly(x, [[X - tw*(small ? 0.5 : 1.5), Y + tw*0.2], [X - tw*0.5, Y - bare*0.6], [axis(0.85) - tw*0.08, Y - h*0.85], [axis(0.85) + tw*0.08, Y - h*0.85], [X + tw*0.5, Y - bare*0.6], [X + tw*(small ? 0.5 : 1.5), Y + tw*0.2]], pkCss(c.trunk));
    pkPoly(x, [[X + sd*tw*0.1, Y], [axis(0.85), Y - h*0.85], [X + sd*tw*0.5, Y - bare*0.6], [X + sd*tw*1.2, Y]], pkCss(pkMix(c.trunk, PK_WHITE, 0.15))); }
  if(!small && hd > px(60)) pkBark(x, X, Y, bare + h*0.08, tw*1.3, lean*(bare/h), o.bark || 'spruce', c, sub(6), px);
  // (dead lower limbs, on an old tree: bare twigs below the green)
  if(!small && F.age > 0.6){ const R = sub(7), rnd = (a, b) => a + (b - a)*R(); x.strokeStyle = pkCss(pkMix(c.trunk, PK_BLACK, 0.25), 0.8); x.lineWidth = Math.max(px(0.4), h*0.006); for(let k = 0; k < 4; k++){ const u = rnd(0.25, 1)*bare/h, s = R() < 0.5 ? -1 : 1, yy = Y - h*u, len = h*o.bw*rnd(0.3, 0.7);
    x.beginPath(); x.moveTo(axis(u), yy); x.lineTo(axis(u) + s*len, yy + len*0.25*o.droop); x.stroke(); } }
  const span = h*(1 - o.spire) - bare, th = span/n*1.5;
  for(let t = 0; t < n; t++){ const u = t/n, yt = Y - bare - span*u - th*0.15, env = h*o.bw*F.wide*Math.pow(1 - u*0.92, 0.95 + 0.3*F.age)*(o.round ? 1 - Math.pow(u, 3)*0.4 : 1);
    const ax = axis((Y - yt)/h), wl = env*rnd(0.78, 1.15)*(R() < 0.1 ? 0.45 : 1)*(1 - F.side*0.3), wr = env*rnd(0.78, 1.15)*(R() < 0.1 ? 0.45 : 1)*(1 + F.side*0.3);
    for(const [s, wd] of [[-1, wl], [1, wr]]){ const dr = wd*o.droop*rnd(0.35, 0.55), tipX = ax + s*wd, tipY = yt + dr, up = th*o.lift;
      // (the tier's whole skirt in shade: from high on the trunk out along its upper edge, bowing up, to its tip, the tip
      //  turning up a little, then its ragged lower edge back in to the trunk)
      const P = [[ax, yt - th*0.55]], Q = [];
      for(let k = 1; k <= 5; k++){ const v = k/5; P.push([ax + s*wd*v, yt - th*0.55*(1 - v) + dr*Math.pow(v, 1.6) - th*0.12*Math.sin(Math.PI*v)]); }
      P.push([tipX + s*wd*0.04, tipY - up]);
      for(let k = 5; k >= 0; k--){ const v = k/5, rag = !small && k % 2 ? th*0.18 : 0; Q.push([ax + s*wd*v*0.97, yt + th*0.35*(1 - v) + dr*Math.pow(v, 1.3) + th*0.12 + rag]); }
      pkPoly(x, [...P, ...Q], pkCss(c.dark));
      // (its top in the body's colour, and on the sun's side lit along its upper edge, brightest toward its tip)
      const lit = s === sd, T = P.map(([a, b], k) => [a, b + th*(0.3 + 0.35*k/P.length)]);
      pkPoly(x, [...P.slice(0, -1), ...T.slice(0, -1).reverse()], pkCss(lit ? c.body : pkMix(c.body, c.dark, 0.25)));
      if(lit && !small) pkPoly(x, [...P.slice(1, -1), ...P.slice(1, -1).reverse().map(([a, b], k, A) => [a, b + th*(0.1 + 0.3*(A.length - k)/A.length)])], pkCss(c.lit, 0.85));
      else if(!small) pkPoly(x, [...P.slice(3, -1), ...P.slice(3, -1).reverse().map(([a, b]) => [a, b + th*0.07])], pkCss(pkMix(c.body, c.lit, 0.35), 0.8));
      // (near: needles hanging from the tier's edge, and tufts along its top)
      if(!small && hd > px(80)){ const R = sub(16 + t*2 + (s > 0 ? 1 : 0)), rnd = (a, b) => a + (b - a)*R(), wdd = wd*(c.lod || 1); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.4), h*0.0035);
        for(let k = 0, m = Math.round(wdd/px(3)); k < m; k++){ const v = 0.15 + 0.85*R(), bx = ax + s*wd*v, by = yt + th*0.35*(1 - v) + dr*Math.pow(v, 1.3) + th*0.1, len = th*rnd(0.15, 0.35);
          x.strokeStyle = pkCss(R() < 0.6 ? pkMix(c.dark, PK_BLACK, 0.2) : c.body, 0.8); x.beginPath(); x.moveTo(bx, by - len*0.3); x.lineTo(bx + s*len*0.2, by + len*0.7); x.stroke(); }
        for(let k = 0, m = Math.round(wdd/px(5)); k < m; k++){ const v = 0.2 + 0.8*R(), [bx, by] = P[Math.min(P.length - 2, Math.round(v*5))], len = th*rnd(0.12, 0.25);
          x.strokeStyle = pkCss(lit ? (R() < 0.5 ? c.lit : pkMix(c.lit, PK_WHITE, 0.15)) : c.body, 0.85); x.beginPath(); x.moveTo(bx, by + th*0.08); x.lineTo(bx + s*len*0.6, by - len*0.4); x.stroke(); } }
      // (the sun behind: the tier's edge glowing through its needles)
      if(c.back > 0.05){ x.strokeStyle = pkCss(c.trans, Math.min(0.8, c.back*0.8)); x.lineWidth = Math.max(px(0.6), th*0.1); x.beginPath(); P.slice(1).forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }
      // (snow lying along the tier's top, thickest toward the trunk, white in the light and blue-grey in shade)
      if(c.snow){ const S2 = P.slice(0, -1), Lw = S2.map(([a, b], k) => [a, b + th*(0.22 - 0.16*k/S2.length)]); pkPoly(x, [...S2, ...Lw.reverse()], pkCss(lit ? [244, 246, 252] : [200, 210, 228], 0.95)); } } }
  // (the spire: the leader rising from the top tier, thin, with a last small whorl or two on it)
  const sy = Y - bare - span + th*0.3, sw = h*o.bw*0.16*F.wide; x.strokeStyle = pkCss(c.dark); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.5), h*0.01); x.beginPath(); x.moveTo(axis((Y - sy)/h), sy); x.lineTo(axis(1), top); x.stroke();
  for(const f of [0.35, 0.7]){ const yy = sy + (top - sy)*f, ax = axis((Y - yy)/h), ww = sw*(1.1 - f*0.8); pkPoly(x, [[ax, yy - th*0.25], [ax + ww, yy + th*0.12], [ax, yy + th*0.05], [ax - ww, yy + th*0.12]], pkCss(c.dark));
    pkPoly(x, [[ax, yy - th*0.25], [ax + sd*ww, yy + th*0.1], [ax, yy + th*0.02]], pkCss(c.body)); } }
// a tree's foot: the shadow it casts, longer the lower the light
const pkTreeFoot = (x, X, Y, h, c) => { const [dx, dy] = pkShadowWay(c, h*0.3); pkEll(x, X + dx*0.5, Y + dy*0.3, h*0.26 + Math.abs(dx)*0.3, h*0.055 + Math.abs(dy)*0.25, pkCss(c.dark, 0.3)); };
export function pkTree(x, X, Y, h, c0, kind, R0, px){
  // (hd: the tree's height as its detail reads it, at its true distance (c0.lod: that over the drawn height), so a turn of
  //  the camera never changes its stage; every number drawn only at some sizes on a stream of its own (sub 6 on), so a
  //  stage gained or lost moves nothing else on the tree)
  const sub = pkSub(R0), R = sub(1), RL = sub(2), F = pkTreeForm(sub(5)), c = pkTreeTint(c0, F), sd = c.sd, rnd = (a, b) => a + (b - a)*R(), small = h*(c0.lod || 1) < px(7);
  // (its STAGE from its size, where its caller knows its height in metres (c0.hM): a small one young, a tall one old, so a
  //  plant's form is regular for its kind and size; a little of its own chance kept, so no two of a size are alike)
  if(c0.hM !== undefined && PK_SIZE[kind]){ const [lo, hi] = PK_SIZE[kind]; F.age = 0.7*Math.max(0, Math.min(1, (c0.hM - lo)/((hi - lo) || 1))) + 0.3*F.age; }
  h *= F.tall; const hd = h*(c0.lod || 1), nR = R();
  const trunk = (top, wd, lean = 0, bark = kind) => { if(wd*(c0.lod || 1) < px(2.5)){ x.strokeStyle = pkCss(c.trunk); x.lineWidth = Math.max(px(0.6), wd); x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + lean, Y - top); x.stroke(); return; }
    // (near: a trunk that flares into its roots, darker on its shadow side, its bark marked)
    const w = wd/2, tk = c.trunk, dk = pkMix(tk, PK_BLACK, 0.35), lt = pkMix(tk, PK_WHITE, 0.18);
    pkPoly(x, [[X - w*2, Y + w*0.2], [X - w, Y - w*1.6], [X + lean - w*0.75, Y - top], [X + lean + w*0.75, Y - top], [X + w, Y - w*1.6], [X + w*2, Y + w*0.2]], pkCss(dk));
    pkPoly(x, [[X + sd*w*0.1, Y + w*0.2], [X + sd*w*0.2 + lean*0.05, Y - w*1.6], [X + lean + sd*w*0.15, Y - top], [X + lean + sd*w*0.75, Y - top], [X + sd*w, Y - w*1.6], [X + sd*w*1.8, Y + w*0.2]], pkCss(lt));
    pkDisc(x, X + lean, Y - top, w*0.75, pkCss(dk)); pkBark(x, X, Y, top, wd, lean, bark, c, sub(6), px); };
  if(!small && !c0.nofoot) pkTreeFoot(x, X, Y, h*F.wide*(kind === 'saguaro' || kind === 'organpipe' || kind === 'ocotillo' ? 0.4 : 1), c);
  // ---- the conifers ----
  if(kind === 'spruce'){ pkConifer(x, X, Y, h, c, R, F, { bw: rnd(0.2, 0.3), n: 8 + Math.floor(R()*5), droop: 0.55, lift: 0.22, spire: 0.07, bare: rnd(0.03, 0.08) + F.age*0.06, bark: 'spruce' }, px, small, sub); return; }
  if(kind === 'fir'){ pkConifer(x, X, Y, h, c, R, F, { bw: rnd(0.1, 0.15), n: 11 + Math.floor(R()*6), droop: 0.18, lift: 0.08, spire: 0.08, bare: rnd(0.02, 0.06), round: F.age > 0.7, bark: 'fir' }, px, small, sub); return; }
  if(kind === 'pine' && F.age < 0.35){ // a young pine: still a rough cone, its whorls far apart and its tufts at their ends
    pkConifer(x, X, Y, h, c, R, F, { bw: rnd(0.2, 0.28), n: 5 + Math.floor(R()*3), droop: 0.1, lift: 0.25, spire: 0.1, bare: rnd(0.08, 0.15), bark: 'pine' }, px, small, sub); return; }
  if(kind === 'pine'){
    // a mature pine: a tall trunk bare and reddening toward its top, leaning a little, forking high into a few limbs, each
    // ending in a flattened cloud of needles; dead stubs on the trunk below; the crown flat-topped and uneven with age
    const lean = h*F.lean*0.9, top = h*rnd(0.84, 0.9); trunk(top, h*0.045, lean, 'pine');
    if(!small && hd > px(40)){ const R = sub(7), rnd = (a, b) => a + (b - a)*R(); x.strokeStyle = pkCss(pkMix(c.trunk, PK_BLACK, 0.2), 0.8); x.lineWidth = Math.max(px(0.4), h*0.008); for(let k = 0; k < 3; k++){ const u = rnd(0.25, 0.8), s = R() < 0.5 ? -1 : 1, yy = Y - top*u; x.beginPath(); x.moveTo(X + lean*u, yy); x.lineTo(X + lean*u + s*h*rnd(0.03, 0.07), yy - h*0.01); x.stroke(); } }
    // (its clumps each at its own height on its own limb, out to alternate sides, the top one on the leader; lower ones
    //  wider, as the oldest; an old pine's clumps fewer and flatter)
    const cw = h*0.26*F.wide, nc = small ? 2 : 3 + Math.floor(nR*3), clumps = []; let s0 = R() < 0.5 ? -1 : 1;
    for(let q = 0; q < nc; q++){ const u = q/(nc - 1 || 1), last = q === nc - 1, ty = Y - h*(0.64 + 0.27*u + rnd(-0.02, 0.02)), at = Math.min(top, Y - ty + h*rnd(0.02, 0.06)), ax = X + lean*at/top;
      const out = last ? rnd(-0.1, 0.1)*cw : s0*cw*(0.6 - 0.3*u)*rnd(0.7, 1.15) + F.side*cw*0.3, w = cw*(0.95 - 0.35*u)*rnd(0.85, 1.15); s0 = -s0; clumps.push([ax + out, ty, w, ax, Y - at]); }
    for(const [tx, ty, w, ax, ay] of clumps){ if(!small) pkLimb(x, ax, ay, tx, ty + h*0.012, h*0.026, c.trunk, px, (tx - ax)/(Math.abs(tx - ax) + 1e-6)*0.12, c.lod);
      const lobes = pkGrow(small ? 2 : 6 + Math.floor(R()*3), tx, ty, w, h*0.07, w*0.34, R, F); x.save(); x.translate(0, ty); x.scale(1, 0.62 - F.age*0.12); x.translate(0, -ty);
      pkLobes(x, lobes, { ...c, leaf: 0.8, leafW: 0.22 }, RL, tx, ty, w, px); x.restore(); }
    return; }
  if(kind === 'cedar'){
    // a cedar of Lebanon: three to six flat shelves, each held out on its own limb from the trunk, pushed a little aside,
    // flat-topped, the trunk through them
    trunk(h*0.85, h*0.05, 0, 'cedar'); const n = small ? 2 : 3 + Math.floor(nR*4);
    for(let q = 0; q < n; q++){ const u = q/(n - 1 || 1), yy = Y - h*(0.28 + 0.62*u), wd = h*(0.5 - 0.27*u)*F.wide*rnd(0.8, 1.2), ox = rnd(-1, 1)*h*0.08 + F.side*wd*0.3, th = h*0.07;
      const lobes = hd > px(30) ? pkGrow(7, X + ox, yy, wd, th*1.4, wd*0.24, sub(40 + q), F) : null;
      if(!small) for(const s of [-1, 1]){ const ends = lobes ? lobes.filter(l => (l[0] - X)*s > 0) : []; if(lobes && !ends.length) continue; const ex = ends.length ? ends.reduce((m, l) => Math.abs(l[0] - X) > Math.abs(m - X) ? l[0] : m, X) : X + ox + s*wd*0.5; pkLimb(x, X, yy + th*0.6, X + (ex - X)*0.8, yy + th*0.1, h*0.022, c.trunk, px, 0.05, c.lod); }
      if(lobes){ x.save(); x.translate(0, yy); x.scale(1, 0.5); x.translate(0, -yy); pkLobes(x, lobes, { ...c, leaf: 0.8, leafW: 0.3 }, RL, X + ox, yy, wd, px); x.restore(); continue; }
      pkPoly(x, [[X + ox - wd, yy], [X + ox - wd*0.8, yy - th], [X + ox + wd*0.8, yy - th*1.1], [X + ox + wd, yy], [X + ox + wd*0.6, yy + th*0.5], [X + ox - wd*0.6, yy + th*0.5]], pkCss(c.dark));
      pkPoly(x, [[X + ox - wd*0.85, yy - th*0.2], [X + ox - wd*0.7, yy - th], [X + ox + wd*0.75, yy - th*1.05], [X + ox + wd*0.9, yy - th*0.2]], pkCss(c.body));
      if(!small){ x.fillStyle = pkCss(c.lit); x.fillRect(X + ox + (sd > 0 ? 0 : -wd*0.7), yy - th*1.05, wd*0.7, Math.max(px(0.6), th*0.25)); } }
    return; }
  if(kind === 'cypress'){
    // an Italian cypress: one dark flame, widest a third of the way up, pointed, its edge a little uneven where its
    // sprays stand out; near, its sprays as small scales of light and shade
    trunk(h*0.06, h*0.04, 0, 'cypress'); const wd = h*rnd(0.055, 0.085)*F.wide, ph = R()*6, lean = F.lean*h*0.15;
    const pts = k => { const P = []; for(let q = 0; q <= 14; q++){ const u = q/14, yy = Y - h*0.04 - h*0.96*u, bump = 1 + 0.08*Math.sin(u*23 + ph + k)*(1 - u), w = wd*k*Math.sin(Math.PI*Math.pow(u, 0.62))*(u < 0.33 ? 1 : 1 - (u - 0.33)*0.35)*bump; P.push([X + lean*u + w, yy]); } return P; };
    const Rp = pts(1), Lp = pts(-1); pkPoly(x, [...Lp, ...Rp.reverse()], pkCss(c.dark));
    pkPoly(x, [[X, Y - h*0.04], ...pts(sd*0.85), [X + lean, Y - h]], pkCss(c.body));
    if(!small) pkPoly(x, [[X + sd*wd*0.15, Y - h*0.2], ...pts(sd*0.5).slice(3, 12), [X + lean + sd*wd*0.1, Y - h*0.8]], pkCss(c.lit, 0.8));
    if(hd > px(80)) for(let q = 0, m = Math.round(hd*wd*(c0.lod || 1)/(px(6)*px(6))*0.6); q < Math.min(260, m); q++){ const u = 0.05 + 0.9*R(), w = wd*Math.sin(Math.PI*Math.pow(u, 0.62)), ox = (R()*2 - 1)*w*0.9, lit = ox*sd > w*0.2;
      pkEll(x, X + lean*u + ox, Y - h*0.04 - h*0.96*u, wd*0.12, wd*0.07, pkCss(lit ? c.lit : R() < 0.5 ? c.dark : c.body, 0.8)); }
    if(c.back > 0.05){ x.strokeStyle = pkCss(c.trans, c.back*0.7); x.lineWidth = Math.max(px(0.6), wd*0.12); x.beginPath(); Lp.forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.beginPath(); pts(1).forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }
    return; }
  // ---- the round-crowned trees: a trunk, limbs holding the crown, the crown grown lobe on lobe ----
  if(kind === 'poplar'){
    // a Lombardy poplar: a tall narrow column of small lobes up a short trunk, its limbs held upright inside it
    const lean = F.lean*h*0.2; trunk(h*0.22, h*0.04, lean*0.2, 'poplar');
    if(!small){ const R = sub(7), rnd = (a, b) => a + (b - a)*R(); for(let k = 0; k < 3; k++) pkLimb(x, X + lean*0.2, Y - h*0.2, X + lean*0.6 + rnd(-1, 1)*h*0.04, Y - h*rnd(0.45, 0.75), h*0.02, c.trunk, px, 0.02, c.lod); }
    const cx = X + lean*0.6, cy = Y - h*0.58, lobes = [];
    // (each lobe up the column overlapping the one below, so the column is whole)
    for(let q = 0, m = small ? 4 : 10, yq = Y - h*0.24; q < m; q++){ const u = q/(m - 1), r = h*(0.1 - 0.055*u)*Math.min(1.15, F.wide), yy = Y - h*(0.24 + 0.68*u);
      lobes.push(...pkGrow(small ? 1 : 2, cx + rnd(-1, 1)*h*0.015, yy, r*1.1, r*0.8, r, R, F)); yq = yy; }
    pkLobes(x, lobes, { ...c, leaf: 0.7 }, RL, cx, cy, h*0.4, px); return; }
  if(kind === 'birch'){
    // a birch: a slender pale trunk, a little crooked, marked dark across and black at its foot; an airy crown of small
    // lobes on drooping limbs, the sky through it
    const lean = F.lean*h*0.5, tw = h*0.032, tp = h*0.68, pale = pkMix(c.lit, PK_WHITE, 0.55);
    x.strokeStyle = pkCss(pale); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.6), tw); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + lean*0.2 + rnd(-1, 1)*h*0.02, Y - tp*0.5, X + lean, Y - tp); x.stroke();
    if(!small) pkBark(x, X, Y, tp*0.8, tw, lean*0.8, 'birch', c, sub(6), px);
    const cx = X + lean, cy = Y - h*0.58, lobes = pkGrow(small ? 3 : 12, cx, cy, h*0.18*F.wide, h*0.33, h*0.085, R, F);
    if(!small) for(const [lx2, ly2] of lobes.slice(1, 5)) pkLimb(x, X + lean*0.6, Y - h*0.55, lx2, ly2, h*0.012, pale, px, 0.2, c.lod);
    pkLobes(x, lobes, { ...c, leaf: 0.7, air: c.air || pkMix(c.lit, PK_WHITE, 0.3) }, RL, cx, cy, h*0.25, px);
    if(hd > px(60)){ const R = sub(9), rnd = (a, b) => a + (b - a)*R(); x.strokeStyle = pkCss(c.body, 0.7); x.lineWidth = Math.max(px(0.4), h*0.004); for(let k = 0; k < 14; k++){ const [lx2, ly2, r2] = lobes[Math.floor(R()*lobes.length)], ex = lx2 + rnd(-1, 1)*r2, ey = ly2 + r2*0.6; x.beginPath(); x.moveTo(ex, ey); x.quadraticCurveTo(ex + rnd(-1, 1)*r2*0.2, ey + r2*0.4, ex + rnd(-1, 1)*r2*0.3, ey + r2*rnd(0.5, 0.9)); x.stroke(); } }
    return; }
  if(kind === 'willow'){
    // a willow: a broad dome whose lobes hang down in long strands
    const lean = F.lean*h*0.4; trunk(h*0.4, h*0.06, lean*0.5, 'broadleaf'); const cx = X + lean, cy = Y - h*0.62, lobes = [], rw = h*0.3*F.wide;
    for(let q = 0; q < 6; q++){ const a = Math.PI + q/5*Math.PI; lobes.push([cx + Math.cos(a)*rw, cy + Math.sin(a)*h*0.18, h*0.15*rnd(0.85, 1.15)]); }
    if(!small) for(const [lx2, ly2] of [lobes[1], lobes[4]]) pkLimb(x, X + lean*0.5, Y - h*0.38, lx2, ly2, h*0.03, c.trunk, px, 0.2, c.lod);
    pkLobes(x, lobes, { ...c, leaf: 1.2, leafW: 0.25 }, RL, cx, cy, h*0.35, px);
    if(!small){ const n = hd > px(30) ? 34 : 9; x.lineCap = 'round';
      // (the curtain: many long falls of leaves from the crown's edge, the ones toward the light lit, swaying a little)
      for(const pass of [0, 1]) for(let q = 0; q < n; q++){ const u = q/(n - 1) - 0.5, sx = cx + u*rw*2.4 + rnd(-1, 1)*h*0.01, len = h*rnd(0.28, 0.55)*(1 - Math.abs(u)*0.5), sw = rnd(-1, 1)*h*0.03, lit = u*sd > 0.05;
        if(pass === 0 ? lit : !lit) continue; const pick = R() < 0.4, pick2 = R() < 0.5;
        // (bare in winter: a weeping willow's curtain is its long whips, yellow to orange, thin, the sky between)
        x.strokeStyle = c.bare ? pkCss(pkMix([206, 158, 70], lit ? c.lit : c.dark, pick ? 0.15 : 0.4), 0.85) : pkCss(lit ? (pick ? c.lit : c.body) : (pick2 ? c.dark : c.body)); x.lineWidth = Math.max(px(0.5), h*(n > 9 ? 0.016 : 0.025)*(c.bare ? 0.35 : 1));
        x.beginPath(); x.moveTo(sx, cy - h*0.04); x.quadraticCurveTo(sx + u*h*0.08, cy + len*0.5, sx + u*h*0.12 + sw, cy + len); x.stroke();
        if(c.back > 0.05 && R() < 0.5){ x.strokeStyle = pkCss(c.trans, c.back*0.6); x.lineWidth = Math.max(px(0.4), h*0.006); x.stroke(); } } }
    return; }
  if(kind === 'dead'){
    // a dead tree: its trunk forking, and forking again, bare, each fork its own angle and length
    x.strokeStyle = pkCss(c.dark); x.lineCap = 'round';
    const limb = (x0, y0, ang, len, wd, depth) => { const x1 = x0 + Math.sin(ang)*len, y1 = y0 - Math.cos(ang)*len; x.lineWidth = Math.max(px(0.5), wd); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      if(depth > 0) for(const s of R() < 0.25 ? [R() < 0.5 ? -1 : 1] : [-1, 1]) limb(x1, y1, ang + s*rnd(0.25, 0.8), len*rnd(0.45, 0.75), wd*0.6, depth - 1); };
    limb(X, Y, F.lean*2, h*rnd(0.35, 0.5), h*0.06, small ? 1 : 3); return; }
  if(kind === 'stonepine'){
    // a stone pine: a straight trunk forking into limbs that hold one wide dome, flat beneath, an umbrella
    trunk(h*0.55, h*0.05, F.lean*h*0.3, 'pine'); const cy = Y - h*0.72, rx = h*rnd(0.36, 0.5)*F.wide, ry = h*0.2, tx = X + F.lean*h*0.3;
    const lobes = pkGrow(small ? 4 : 13, X + F.side*rx*0.2, cy - ry*0.5, rx, ry*1.4, rx*0.24, R, F).map(([a, b, r]) => [a, Math.min(b, cy + ry*0.05), r]);
    // (its limbs reach the lowest lobes at either side and the middle, ending inside them, as the crown is drawn squashed)
    if(!small){ const by = l => -l[1] - l[2], lo = [...lobes].sort((p, q) => by(q) - by(p)), L0 = lo.filter(l => l[0] < tx)[0], L1 = lo.filter(l => l[0] >= tx)[0];
      for(const L of [L0, L1, lo[0]]) if(L){ const ly = cy + (L[1] - cy)*0.62; pkLimb(x, tx, Y - h*0.52, tx + (L[0] - tx)*0.9, ly + (Y - h*0.52 - ly)*0.08, h*0.03, c.trunk, px, 0.1, c.lod); } }
    x.save(); x.translate(0, cy); x.scale(1, 0.62); x.translate(0, -cy); pkLobes(x, lobes, { ...c, leaf: 0.8, leafW: 0.25 }, RL, X, cy - ry, rx, px); x.restore(); return; }
  if(kind === 'palm'){
    // a palm: a ringed trunk curving up to one knot, eight to twelve fronds arching out and down from it, a dead frond or
    // two hanging; near, each frond's leaflets
    const lean = h*rnd(0.06, 0.22)*(R() < 0.5 ? -1 : 1)*(0.6 + F.wide*0.6), tx = X + lean, ty = Y - h*0.9, cw = rnd(0.85, 1.2);
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; x.lineWidth = Math.max(px(0.6), h*0.035); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + lean*0.1, Y - h*0.5, tx, ty); x.stroke();
    if(hd > px(60)){ x.strokeStyle = pkCss(pkMix(c.trunk, PK_BLACK, 0.35), 0.7); x.lineWidth = Math.max(px(0.4), h*0.004); for(let k = 1; k < 20; k++){ const u = k/20, bx = X + lean*0.1*2*u*(1 - u) + lean*u*u, by = Y - h*0.9*u; x.beginPath(); x.moveTo(bx - h*0.017, by); x.lineTo(bx + h*0.017, by - h*0.004); x.stroke(); } }
    const n = small ? 5 : 8 + Math.floor(nR*5), feather = hd > px(70), frond = (a, len, col, droop, lit, k) => pkFrond(x, tx, ty, a, len, col, droop, lit, c, h, px, sub(k), feather, 0);
    // (one or two dead fronds hanging against the trunk, straw-brown, behind the living)
    if(!small){ const R = sub(7), rnd = (a, b) => a + (b - a)*R(); for(let q = 0; q < 1 + Math.floor(R()*2); q++) frond(Math.PI*0.5 + rnd(-0.35, 0.35)*(q ? -1 : 1), h*0.2, pkMix(c.trunk, [170, 140, 84], 0.6), 0.75, false, 30 + q); }
    // (the fronds: those turned from the light first, darker, then those toward it; a few young ones still upright)
    for(const pass of [0, 1]) for(let q = 0; q < n; q++){ const a = Math.PI*(1 + q/(n - 1)) + rnd(-0.12, 0.12), len = h*rnd(0.3, 0.42)*cw, lit = Math.cos(a)*sd > 0.2; if(pass === 0 ? lit : !lit) continue;
      const up = Math.sin(a) < -0.85; frond(a, len*(up ? 0.75 : 1), lit ? c.body : c.dark, up ? 0.05 : rnd(0.25, 0.45), lit, 20 + q); }
    if(!small && hd > px(40)){ const RC = sub(10); for(let q = 0, nc = 2 + Math.floor(RC()*4); q < nc; q++) pkDisc(x, tx + (RC() - 0.5)*h*0.05, ty + h*(0.02 + RC()*0.025), h*0.014, pkCss(pkMix(c.trunk, [120, 110, 50], 0.4))); }
    if(!small) pkDisc(x, tx, ty + h*0.02, h*0.03, pkCss(pkMix(c.trunk, PK_BLACK, 0.3)));
    return; }
  if(kind === 'baobab'){
    // a baobab: a bottle of a trunk, stubby branches like roots in the air, a few small leaf pads at their ends
    const bw = h*rnd(0.16, 0.22)*F.wide, top = Y - h*rnd(0.56, 0.66); x.fillStyle = pkCss(c.trunk); x.beginPath(); x.moveTo(X - bw, Y); x.bezierCurveTo(X - bw*1.1, Y - h*0.35, X - bw*0.5, top + h*0.05, X - bw*0.45, top); x.lineTo(X + bw*0.45, top); x.bezierCurveTo(X + bw*0.5, top + h*0.05, X + bw*1.1, Y - h*0.35, X + bw, Y); x.fill();
    x.fillStyle = pkCss(pkMix(c.trunk, PK_WHITE, 0.25)); x.beginPath(); x.moveTo(X + sd*bw*0.1, Y); x.bezierCurveTo(X + sd*bw*0.3, Y - h*0.35, X + sd*bw*0.35, top + h*0.05, X + sd*bw*0.35, top); x.lineTo(X + sd*bw*0.45, top); x.bezierCurveTo(X + sd*bw*0.5, top + h*0.05, X + sd*bw*1.1, Y - h*0.35, X + sd*bw, Y); x.fill();
    if(hd > px(50)) pkBark(x, X, Y - h*0.05, Y - top - h*0.1, bw*1.2, 0, 'beech', c, sub(6), px);
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const pads = [], nb = small ? 3 : 4 + Math.floor(nR*4);
    for(let q = 0; q < nb; q++){ const v = q/(nb - 1) - 0.5, sx = X + v*bw*0.8, ex = sx + v*h*0.36*F.wide + rnd(-1, 1)*h*0.03, ey = top - h*rnd(0.1, 0.22)*(1 - Math.abs(v)*0.6);
      if(small){ x.lineWidth = Math.max(px(0.5), h*0.04); x.beginPath(); x.moveTo(sx, top + h*0.02); x.quadraticCurveTo((sx + ex)/2, top - h*0.02, ex, ey); x.stroke(); }
      else pkLimb(x, sx, top + h*0.03, ex, ey, h*0.07, c.trunk, px, -v*0.5, c.lod); pads.push(...pkGrow(3, ex, ey - h*0.02, h*0.08, h*0.05, h*rnd(0.035, 0.055), R, F)); }
    if(!small) pkLobes(x, pads, c, RL, X, top - h*0.2, h*0.3, px);
    return; }
  if(kind === 'acacia'){
    // an umbrella thorn: two or three limbs forking up to one flat, wide crown, grown on them
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const cy = Y - h*rnd(0.76, 0.86), cw = h*rnd(0.5, 0.72)*F.wide, fk = h*rnd(0.18, 0.34), lean = F.lean*h*0.5;
    if(hd > px(30)){ // (near: the flat crown is clumps of leaves on its limbs, not a slab; the trunk forks low, its limbs
      //  spreading like a vase and each ending inside one of the crown's lowest clumps)
      const lobes = pkGrow(10 + Math.floor(R()*4), X + lean + F.side*cw*0.2, cy, cw, h*0.06, cw*0.2, R, F), sq = 0.5; trunk(fk, h*0.06, lean*0.3, 'broadleaf');
      const fx = X + lean*0.3, fy = Y - fk, near = tx => lobes.reduce((m, l) => Math.abs(l[0] - tx) + (l[1] - cy)*-0.3 < Math.abs(m[0] - tx) + (m[1] - cy)*-0.3 ? l : m), pick = [...new Set([-0.5, 0.5, -0.15, 0.2].slice(0, 2 + Math.floor(R()*3)).map(u => near(fx + u*cw)))];
      for(const L of pick){ const ty = cy + (L[1] - cy)*sq; pkLimb(x, fx, fy, fx + (L[0] - fx)*0.88, ty + (fy - ty)*0.05, h*0.045, c.trunk, px, (L[0] < fx ? -1 : 1)*-0.12, c.lod); }
      x.save(); x.translate(0, cy); x.scale(1, sq); x.translate(0, -cy); pkLobes(x, lobes, { ...c, leaf: 0.6 }, RL, X + lean, cy, cw, px); x.restore(); return; }
    for(const [ex, wd] of [[-0.35, 0.05], [0.3, 0.045], [0.05, 0.035]].slice(0, small ? 2 : 3)){ x.lineWidth = Math.max(px(0.5), h*wd); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + ex*cw*0.2, Y - h*0.45, X + ex*cw, cy + h*0.04); x.stroke(); }
    pkPoly(x, [[X - cw, cy + h*0.02], [X - cw*0.8, cy - h*0.1], [X + cw*0.85, cy - h*0.11], [X + cw, cy + h*0.02], [X + cw*0.4, cy + h*0.07], [X - cw*0.45, cy + h*0.07]], pkCss(c.dark));
    pkPoly(x, [[X - cw*0.85, cy - h*0.02], [X - cw*0.7, cy - h*0.11], [X + cw*0.75, cy - h*0.12], [X + cw*0.9, cy - h*0.02]], pkCss(c.body));
    if(!small) pkPoly(x, [[X + (sd > 0 ? 0 : -cw*0.7), cy - h*0.11], [X + (sd > 0 ? cw*0.72 : 0), cy - h*0.12], [X + (sd > 0 ? cw*0.6 : -cw*0.1), cy - h*0.07], [X + (sd > 0 ? 0.05*cw : -cw*0.6), cy - h*0.07]], pkCss(c.lit));
    return; }
  // THE DESERT'S PLANTS (Ruby: "more cacti; saguaros with more limbs as they grow taller, limb counts never identical,
  // limbs shaded by position and direction, blooming only in their season; growth stages"; docs/prior-art/
  // ringworld-desert-plants.md). (bloom: c0.season, the year's turn 0..1 from January; each blooms and fruits in its
  // own months, else none)
  const inSeason = (a2, b2) => c0.season !== undefined && c0.season >= a2 && c0.season <= b2;
  // (a ribbed green column, shaded round: its shadow side, its body, its lit flank and rim, its ribs near; w: half width)
  const column = (x0, y0, x1, y1, w, tone = 1) => { const dk = pkMix(c.dark, PK_BLACK, 0.1*(1 - tone)), bd = pkMix(c.body, c.dark, 1 - tone), lt = pkMix(c.lit, c.body, 1 - tone);
    x.lineCap = 'round'; x.strokeStyle = pkCss(dk); x.lineWidth = w*2; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.strokeStyle = pkCss(bd); x.lineWidth = w*1.3; x.beginPath(); x.moveTo(x0 + sd*w*0.25, y0); x.lineTo(x1 + sd*w*0.25, y1); x.stroke();
    x.strokeStyle = pkCss(lt, 0.8); x.lineWidth = Math.max(px(0.4), w*0.35); x.beginPath(); x.moveTo(x0 + sd*w*0.55, y0); x.lineTo(x1 + sd*w*0.55, y1 + w*0.4); x.stroke();
    if(w*(c0.lod || 1) > px(4)){ x.strokeStyle = pkCss(pkMix(dk, PK_BLACK, 0.3), 0.5); x.lineWidth = Math.max(px(0.3), w*0.06); x.lineCap = 'butt';
      for(const f of [-0.6, -0.2, 0.2, 0.6]){ x.beginPath(); x.moveTo(x0 + f*w, y0); x.lineTo(x1 + f*w, y1 + w*0.3); x.stroke(); } x.lineCap = 'round'; }
    // (Ruby: "which tree is that which is just a green stick? There should always be more color and texture": a cactus
    //  is never one green. Its spines catch the light as a pale gold rim along its lit edge; its foot is corky, grey and
    //  brown where it has aged; its skin goes yellower and bluer in long patches; its crown is woolly and tan. NPS and
    //  the desert-plants notes, docs/prior-art/ringworld-desert-plants.md)
    if(w > px(0.9)){ const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0)/L, uy = (y1 - y0)/L, at = f => [x0 + (x1 - x0)*f, y0 + (y1 - y0)*f];
      x.strokeStyle = pkCss(pkMix(lt, [236, 214, 150], 0.55), 0.55*tone); x.lineWidth = Math.max(px(0.3), w*0.18); x.beginPath(); x.moveTo(x0 + sd*w*0.95, y0); x.lineTo(x1 + sd*w*0.9, y1 + w*0.5); x.stroke();
      const cork = Math.min(0.22, w*3/L); if(cork > 0.03){ const [cx3, cy3] = at(cork); x.strokeStyle = pkCss(pkMix(dk, [120, 100, 80], 0.6), 0.85); x.lineWidth = w*1.9; x.lineCap = 'butt'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(cx3, cy3); x.stroke(); x.lineCap = 'round'; }
      let hs = (Math.round(x0*7 + y0*13) & 0xffff) || 1; const rr = () => ((hs = (hs*16807) % 2147483647)/2147483647);
      for(let k = 0; k < 3; k++){ const f0 = 0.15 + 0.6*rr(), f1 = Math.min(0.95, f0 + 0.1 + 0.2*rr()), [ax2, ay2] = at(f0), [bx2, by2] = at(f1), side = (rr() - 0.5)*w*0.9;
        x.strokeStyle = pkCss(pkMix(bd, rr() < 0.5 ? [170, 176, 90] : [80, 120, 120], 0.35), 0.5); x.lineWidth = w*0.5; x.beginPath(); x.moveTo(ax2 - uy*side, ay2 + ux*side); x.lineTo(bx2 - uy*side, by2 + ux*side); x.stroke(); }
      pkDisc(x, x1, y1 + w*0.15, w*0.55, pkCss(pkMix(lt, [210, 190, 150], 0.5), 0.75)); } };
  // (a crown's flowers or fruit, in their season: white flowers with yellow hearts, or the red fruit after)
  const crown = (cx2, cy2, w, flower, fruit) => { if(small || hd < px(30)) return; const RC = sub(11);
    if(inSeason(...flower)) for(let k = 0; k < 6; k++){ const fx2 = cx2 + (RC()*2 - 1)*w*0.8, fy2 = cy2 + (RC() - 0.2)*w*0.6; pkDisc(x, fx2, fy2, w*0.3, pkCss([246, 242, 228], 0.95)); pkDisc(x, fx2, fy2, w*0.11, pkCss([236, 196, 80])); }
    else if(inSeason(...fruit)) for(let k = 0; k < 5; k++) pkDisc(x, cx2 + (RC()*2 - 1)*w*0.7, cy2 + (RC() - 0.2)*w*0.5, w*0.18, pkCss([184, 36, 52], 0.95)); };
  if(kind === 'saguaro'){
    // a saguaro (NPS: its first arm at some 3 to 6 m, "around 50 to 70 years", some never; many arms on an old one): a
    // ribbed column rounded at its top; its arms by its height, never the same count twice, each going out round the
    // column at its own bearing and turning up at a rounded elbow; the arms behind it drawn first and in its shade, those
    // before it after and in the light, each lit by the side it stands on; an old one's arms drooping before they turn
    // up, now and then an arm on an arm; white flowers on each crown from late April to mid June, red fruit after
    const hM = c0.hM ?? (PK_SIZE.saguaro[0] + F.age*(PK_SIZE.saguaro[1] - PK_SIZE.saguaro[0])), wd = h/hM*rnd(0.27, 0.34)*(0.9 + F.wide*0.15);   // (some 0.6 m across at any height, as a saguaro is)
    const nA = small || hd < px(14) || hM < 3.3 ? 0 : Math.max(0, Math.round((hM - 3.3)/1.7 + (nR - 0.5)*1.8 - (F.hue > 0.85 ? 3 : 0)));
    const tx = X + F.lean*h*0.1, ty = Y - h + wd, RA = sub(12), arms = [];
    for(let q = 0; q < nA; q++){ const az = (q === 0 ? 2.6 : q === 1 ? 0.4 : RA()*Math.PI*2) + (RA() - 0.5)*0.9, at = 0.32 + 0.33*RA(), out = h*(0.07 + 0.07*RA()), up = h*(0.12 + 0.2*RA())*(1 - at*0.5), aw = wd*(0.58 + 0.22*RA()), droop = F.age > 0.75 && RA() < 0.4;
      arms.push({ az, at, out, up, aw, droop, sub2: F.age > 0.8 && RA() < 0.25 }); }
    const drawArm = A => { const s = Math.sin(A.az), front = Math.cos(A.az) > 0, ox = s*(wd + A.out), ay = Y - h*A.at, ax = X + ox, tone = front ? (s*sd > 0 ? 1 : 0.75) : 0.45 + 0.2*(s*sd > 0 ? 1 : 0), dy = A.droop ? A.out*0.6 : 0;
      x.lineCap = 'round'; const P2 = [X + s*wd*0.4, ay], E = [ax, ay + dy], T2 = [ax, ay - A.up];
      x.strokeStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.1)); x.lineWidth = A.aw*2; x.beginPath(); x.moveTo(P2[0], P2[1]); x.quadraticCurveTo(ax, ay + dy*1.4, E[0], E[1] - A.up*0.25); x.lineTo(T2[0], T2[1]); x.stroke();
      x.strokeStyle = pkCss(pkMix(c.body, c.dark, 1 - tone)); x.lineWidth = A.aw*1.2; x.beginPath(); x.moveTo(P2[0], P2[1] - A.aw*0.2); x.quadraticCurveTo(ax + sd*A.aw*0.2, ay + dy*1.4 - A.aw*0.2, E[0] + sd*A.aw*0.2, E[1] - A.up*0.25); x.lineTo(T2[0] + sd*A.aw*0.2, T2[1]); x.stroke();
      if(tone > 0.7){ x.strokeStyle = pkCss(c.lit, 0.7); x.lineWidth = Math.max(px(0.4), A.aw*0.3); x.beginPath(); x.moveTo(E[0] + sd*A.aw*0.55, E[1] - A.up*0.25); x.lineTo(T2[0] + sd*A.aw*0.55, T2[1] + A.aw*0.4); x.stroke(); }
      if(A.sub2){ const s2 = -Math.sign(s || 1), bx = ax, by = ay - A.up*0.55; x.strokeStyle = pkCss(pkMix(c.body, c.dark, 1 - tone)); x.lineWidth = A.aw*1.1; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + s2*A.out*0.6, by, bx + s2*A.out*0.6, by - A.up*0.35); x.stroke(); }
      crown(T2[0], T2[1], A.aw, [0.31, 0.45], [0.47, 0.55]); };
    for(const A of arms) if(Math.cos(A.az) <= 0) drawArm(A);
    column(X, Y, tx, ty, wd);
    for(const A of arms) if(Math.cos(A.az) > 0) drawArm(A);
    crown(tx, ty, wd, [0.31, 0.45], [0.47, 0.55]);
    return; }
  if(kind === 'organpipe'){
    // an organ pipe (many stems from its foot, ribbed, to some 7 m here; night flowers pale pink at its tips in May and June)
    const n = small ? 3 : 5 + Math.floor(F.age*9 + nR*3), spread = h*0.28*(0.7 + F.wide*0.4), w = c0.hM ? h/c0.hM*0.1 : h*0.045, RO = sub(12), st = [];
    for(let q = 0; q < n; q++){ const u = (q + 0.5)/n - 0.5, hh = h*(0.55 + 0.45*RO())*(1 - Math.abs(u)*0.5), bx = X + u*spread*0.25, tx2 = X + u*spread + (RO() - 0.5)*w*2; st.push({ u, hh, bx, tx2, d: RO() }); }
    st.sort((p, q) => p.d - q.d);
    for(const S of st){ const tone = S.d < 0.5 ? 0.6 : (S.u*sd > 0 ? 1 : 0.8); x.lineCap = 'round'; x.strokeStyle = pkCss(c.dark); x.lineWidth = w*2; x.beginPath(); x.moveTo(S.bx, Y); x.quadraticCurveTo(S.bx + (S.tx2 - S.bx)*0.9, Y - S.hh*0.25, S.tx2, Y - S.hh); x.stroke();
      x.strokeStyle = pkCss(pkMix(c.body, c.dark, 1 - tone)); x.lineWidth = w*1.2; x.beginPath(); x.moveTo(S.bx + sd*w*0.25, Y); x.quadraticCurveTo(S.bx + (S.tx2 - S.bx)*0.9 + sd*w*0.25, Y - S.hh*0.25, S.tx2 + sd*w*0.25, Y - S.hh); x.stroke();
      crown(S.tx2, Y - S.hh, w, [0.36, 0.48], [0.52, 0.62]); }
    return; }
  if(kind === 'barrel'){
    // a barrel cactus (to 1.8 m here: a ball growing into a squat column, leaning south, "15–28 ribs", hooked spines; its
    // crown ringed with yellow-to-orange flowers through the summer, its yellow fruit kept a year after)
    const w = h*(0.42 - 0.12*F.age), lean = (F.side*0.6 + 0.15)*h*0.25, cx2 = X + lean*0.5, top = Y - h;
    pkEll(x, X - sd*w*0.6, Y, w*1.2, w*0.25, pkCss(c.dark, 0.3));
    x.beginPath(); x.moveTo(X - w, Y); x.bezierCurveTo(X - w*1.1, Y - h*0.6, cx2 - w*0.9, top, cx2, top); x.bezierCurveTo(cx2 + w*0.9, top, X + w*1.1, Y - h*0.6, X + w, Y); x.closePath(); x.fillStyle = pkCss(c.dark); x.fill();
    x.beginPath(); x.moveTo(X + sd*w*0.05, Y); x.bezierCurveTo(X + sd*w*0.2, Y - h*0.6, cx2 + sd*w*0.1, top + h*0.04, cx2 + sd*w*0.15, top + h*0.03); x.bezierCurveTo(cx2 + sd*w*0.85, top + h*0.05, X + sd*w*1.05, Y - h*0.55, X + sd*w, Y); x.closePath(); x.fillStyle = pkCss(c.body); x.fill();
    if(!small){ x.strokeStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.3), 0.6); x.lineWidth = Math.max(px(0.3), w*0.05); for(const f of [-0.66, -0.33, 0, 0.33, 0.66]){ x.beginPath(); x.moveTo(X + f*w, Y); x.quadraticCurveTo(X + f*w*1.08 + lean*0.3, Y - h*0.6, cx2 + f*w*0.45, top + h*0.08); x.stroke(); }
      if(hd > px(14)){ x.strokeStyle = pkCss([214, 160, 120], 0.75); x.lineWidth = Math.max(px(0.3), w*0.03); const RB2 = sub(13); for(let k = 0; k < 18; k++){ const f = RB2()*2 - 1, yy = Y - h*(0.1 + 0.8*RB2()), xx = X + f*w*(1 - Math.abs(yy - Y + h*0.5)/h*0.5); x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + w*0.12, yy - w*0.05); x.stroke(); } } }
    if(!small && hd > px(10)){ const RF = sub(14); if(inSeason(0.45, 0.72)) for(let k = 0; k < 7; k++) pkDisc(x, cx2 + (k/6 - 0.5)*w*1.1, top + h*0.05 + Math.abs(k/6 - 0.5)*h*0.06, w*0.14, pkCss(RF() < 0.5 ? [236, 176, 52] : [226, 106, 46]));
      else for(let k = 0; k < 5; k++) pkDisc(x, cx2 + (k/4 - 0.5)*w*0.9, top + h*0.05, w*0.1, pkCss([218, 196, 72], 0.9)); }
    return; }
  if(kind === 'pear'){
    // a prickly pear: flat oval pads, each grown from the edge of the last, in a sprawling clump; yellow flowers on the
    // pads' rims in May and June, purple-red fruit (tunas) through July and August
    const RP = sub(12), pads = [], n = small ? 4 : 6 + Math.floor(F.age*10 + nR*3), pw = h*0.22, ph = h*0.3;
    const grow = (x0, y0, ang, depth) => { if(pads.length >= n || depth > 4) return; const cx2 = x0 + Math.sin(ang)*ph*0.42, cy2 = y0 - Math.cos(ang)*ph*0.42; pads.push({ cx: cx2, cy: cy2, ang, d: RP(), t: depth });
      const kids = depth === 0 ? 3 : RP() < 0.6 ? 2 : 1; for(let k = 0; k < kids; k++) grow(cx2 + Math.sin(ang)*ph*0.42, cy2 - Math.cos(ang)*ph*0.42, ang + (RP() - 0.5)*1.6, depth + 1); };
    grow(X, Y + ph*0.1, (RP() - 0.5)*0.4, 0);
    pkEll(x, X - sd*pw*0.6, Y, pw*1.8, pw*0.3, pkCss(c.dark, 0.3));
    pads.sort((p, q) => p.d - q.d);
    for(const P of pads){ const tone = P.d < 0.4 ? 0.65 : (Math.sin(P.ang)*sd > 0 ? 1 : 0.85); x.save(); x.translate(P.cx, P.cy); x.rotate(P.ang);
      x.beginPath(); x.ellipse(0, 0, pw*0.5, ph*0.5, 0, 0, Math.PI*2); x.fillStyle = pkCss(pkMix(c.body, c.dark, 1 - tone)); x.fill();
      x.beginPath(); x.ellipse(sd*pw*0.1, -ph*0.05, pw*0.34, ph*0.38, 0, 0, Math.PI*2); x.fillStyle = pkCss(pkMix(c.lit, c.body, 1 - tone*0.6), 0.55); x.fill();
      if(!small && hd > px(16)){ x.fillStyle = pkCss([236, 228, 196], 0.7); for(let k = 0; k < 5; k++) x.fillRect((RP() - 0.5)*pw*0.7, (RP() - 0.5)*ph*0.7, Math.max(px(0.4), pw*0.03), Math.max(px(0.4), pw*0.03)); }
      if(!small && hd > px(12) && P.t >= 1){ if(inSeason(0.36, 0.47)) pkDisc(x, (RP() - 0.5)*pw*0.5, -ph*0.5, pw*0.16, pkCss([246, 214, 74])); else if(inSeason(0.52, 0.68) && RP() < 0.7) pkDisc(x, (RP() - 0.5)*pw*0.5, -ph*0.48, pw*0.1, pkCss([150, 34, 70])); }
      x.restore(); }
    return; }
  if(kind === 'cholla'){
    // a teddy-bear cholla: a dark trunk, its lower limbs gone, short limbs nearly level at its top furred with silvery
    // spines that catch the light, brightest with the sun behind; greenish-yellow flowers at their tips in May and June
    const RC2 = sub(12), tw = h*0.06, top = Y - h*0.55, spine = pkMix(PK_WHITE, c.lit, 0.25), glow = 0.55 + 0.45*(c0.back || 0);
    x.strokeStyle = pkCss(pkMix(c.trunk, PK_BLACK, 0.3)); x.lineWidth = tw*2; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + F.lean*h*0.2, top); x.stroke();
    const n = small ? 4 : 7 + Math.floor(F.age*8);
    for(let q = 0; q < n; q++){ const a2 = (RC2() - 0.5)*2.6, len = h*(0.16 + 0.14*RC2()), y0 = top - RC2()*h*0.3, x0 = X + F.lean*h*0.2, x1 = x0 + Math.sin(a2)*len, y1 = y0 - Math.cos(a2)*len*0.5 - h*0.05;
      x.strokeStyle = pkCss(pkMix(c.body, c.dark, 0.3)); x.lineWidth = tw*2.6; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      x.strokeStyle = pkCss(spine, 0.6*glow); x.lineWidth = tw*1.6; x.beginPath(); x.moveTo(x0 + sd*tw*0.4, y0 - tw*0.4); x.lineTo(x1 + sd*tw*0.4, y1 - tw*0.4); x.stroke();
      if(!small && inSeason(0.36, 0.47) && RC2() < 0.5) pkDisc(x, x1, y1 - tw, tw*0.9, pkCss([214, 214, 110])); }
    return; }
  if(kind === 'ocotillo'){
    // an ocotillo: long unbranched spiny canes fanning up from a short base, bare grey most of the year, in small leaves
    // after the rains, red flower clusters at their tips from March to June
    const RO2 = sub(12), n = small ? 6 : 12 + Math.floor(F.age*14), leaf = inSeason(0.62, 0.78) || inSeason(0.12, 0.3), bloom = inSeason(0.18, 0.45);
    x.lineCap = 'round';
    for(let q = 0; q < n; q++){ const a2 = (q/(n - 1) - 0.5)*1.1 + (RO2() - 0.5)*0.25 + F.lean, len = h*(0.7 + 0.3*RO2()), x1 = X + Math.sin(a2)*len, y1 = Y - Math.cos(a2)*len, bend = (RO2() - 0.5)*h*0.08;
      x.strokeStyle = pkCss(leaf ? pkMix(c.body, c.lit, a2*sd > 0 ? 0.4 : 0) : pkMix([128, 116, 104], c.trunk, 0.3)); x.lineWidth = Math.max(px(0.5), h*0.012); x.beginPath(); x.moveTo(X + Math.sin(a2)*h*0.02, Y); x.quadraticCurveTo(X + Math.sin(a2)*len*0.5 + bend, Y - Math.cos(a2)*len*0.5, x1, y1); x.stroke();
      if(bloom && !small){ x.strokeStyle = pkCss([214, 50, 40]); x.lineWidth = Math.max(px(0.8), h*0.022); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x1 + Math.sin(a2)*h*0.06, y1 - Math.cos(a2)*h*0.06); x.stroke(); } }
    return; }
  if(kind === 'agave'){
    // an agave: a rosette of thick grey-green leaves pointed and edged, the outer ones splaying; now and then an old one
    // has sent up its one tall flower stalk, branched with yellow flowers at its top, before it dies
    const RG2 = sub(12), n = small ? 6 : 12 + Math.floor(F.age*8), r = h*0.95, gray = pkMix(c.body, [150, 170, 160], 0.45);
    const leaves = []; for(let q = 0; q < n; q++){ const a2 = (q/n - 0.5)*Math.PI*1.15 + (RG2() - 0.5)*0.2, len = r*(0.55 + 0.45*RG2())*(1 - Math.abs(a2)*0.18); leaves.push({ a2, len, d: Math.cos(a2*2)*0.5 + RG2()*0.5 }); }
    leaves.sort((p, q) => p.d - q.d);
    for(const Lf of leaves){ const tipX = X + Math.sin(Lf.a2)*Lf.len, tipY = Y - Math.cos(Lf.a2)*Lf.len*0.8, wB = h*0.08, nx2 = Math.cos(Lf.a2), ny2 = Math.sin(Lf.a2)*0.8;
      pkPoly(x, [[X - nx2*wB, Y - ny2*wB], [tipX, tipY], [X + nx2*wB, Y + ny2*wB]], pkCss(Lf.a2*sd > 0 ? pkMix(gray, c.lit, 0.35) : pkMix(gray, c.dark, 0.3)));
      if(!small && hd > px(16)){ x.strokeStyle = pkCss(pkMix(gray, PK_BLACK, 0.4), 0.6); x.lineWidth = Math.max(px(0.3), h*0.01); x.beginPath(); x.moveTo(X, Y); x.lineTo(tipX, tipY); x.stroke(); } }
    if(F.age > 0.85 && nR < 0.35 && !small){ const sx = X + h*0.05, sh = h*4.5; x.strokeStyle = pkCss(pkMix(c.trunk, [150, 140, 100], 0.4)); x.lineWidth = Math.max(px(0.6), h*0.05); x.beginPath(); x.moveTo(X, Y - h*0.2); x.lineTo(sx, Y - sh); x.stroke();
      for(let k = 0; k < 6; k++){ const yy = Y - sh*(0.6 + k*0.07), bl = h*(0.4 - k*0.04); x.lineWidth = Math.max(px(0.4), h*0.02); x.beginPath(); x.moveTo(sx, yy); x.lineTo(sx + (k % 2 ? 1 : -1)*bl, yy - h*0.1); x.stroke(); pkDisc(x, sx + (k % 2 ? 1 : -1)*bl, yy - h*0.12, h*0.09, pkCss([214, 186, 70])); } }
    return; }
  if(kind === 'joshua'){
    // a Joshua tree: a shaggy trunk, crooked arms forking, each ending in a spiky ball
    x.strokeStyle = pkCss(c.trunk); x.lineCap = 'round'; const ends = [];
    const limb = (x0, y0, ang, len, wd, depth) => { const x1 = x0 + Math.sin(ang)*len, y1 = y0 - Math.cos(ang)*len; x.lineWidth = Math.max(px(0.5), wd); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      if(depth > 0) for(const s of R() < 0.3 ? [R() < 0.5 ? -1 : 1] : [-1, 1]) limb(x1, y1, ang + s*rnd(0.4, 0.9), len*rnd(0.55, 0.8), wd*0.75, depth - 1); else ends.push([x1, y1]); };
    limb(X, Y, F.lean*2, h*rnd(0.38, 0.5), h*0.07, small ? 1 : 2 + (F.age > 0.6 ? 1 : 0));
    for(const [ex, ey] of ends){ const r = h*0.08; for(let q = 0; q < (small ? 3 : 9); q++){ const a = q/9*Math.PI*2; x.strokeStyle = pkCss(Math.cos(a)*sd > 0 ? c.lit : c.body); x.lineWidth = Math.max(px(0.5), r*0.25); x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex + Math.cos(a)*r, ey + Math.sin(a)*r); x.stroke(); } }
    return; }
  if(kind === 'bamboo'){
    // a stand of bamboo: thin culms, ringed at their nodes, feathery at the top
    const n = small ? 4 : 7 + Math.floor(nR*8), spread = h*0.3*F.wide;
    for(let q = 0; q < n; q++){ const bx = X + (q/(n - 1) - 0.5)*spread + rnd(-1, 1)*h*0.02, hh = h*rnd(0.7, 1), lean = (rnd(-0.08, 0.08) + F.lean)*h, lit = q/(n - 1) - 0.5 > 0 === sd > 0;
      x.strokeStyle = pkCss(lit ? pkMix(c.body, c.lit, 0.4) : c.body); x.lineWidth = Math.max(px(0.5), h*0.012); x.beginPath(); x.moveTo(bx, Y); x.quadraticCurveTo(bx + lean*0.3, Y - hh*0.5, bx + lean, Y - hh); x.stroke();
      if(!small){ x.fillStyle = pkCss(c.dark); for(let k = 1; k < 6; k++){ const u = k/6; x.fillRect(bx + lean*u*u - h*0.008, Y - hh*u, h*0.016, Math.max(px(0.4), h*0.004)); }
        for(let k = 0; k < 4; k++){ const a = -Math.PI/2 + rnd(-1.3, 1.3), len = h*rnd(0.06, 0.12); x.strokeStyle = pkCss(k % 2 ? c.body : c.dark); x.lineWidth = Math.max(px(0.5), h*0.012); x.beginPath(); x.moveTo(bx + lean*0.8, Y - hh*0.85); x.lineTo(bx + lean*0.8 + Math.cos(a)*len, Y - hh*0.85 + Math.sin(a)*len); x.stroke(); } } }
    return; }
  if(kind === 'fern'){
    // a tree fern: a shaggy trunk, a shuttlecock of fronds arching out and down
    trunk(h*0.6, h*0.06, F.lean*h*0.3); const tx = X + F.lean*h*0.3, ty = Y - h*0.6, n = small ? 5 : 9 + Math.floor(nR*3);
    // (its fronds feathers spread flat, those turned from the light first; a skirt of dead fronds under them, near)
    if(!small){ const R = sub(7); for(let q = 0; q < 3; q++) pkFrond(x, tx, ty + h*0.03, Math.PI*(0.3 + 0.4*R()), h*0.18, pkMix(c.trunk, [150, 120, 70], 0.5), 0.7, false, c, h, px, sub(30 + q), hd > px(70), 0.3); }
    for(const pass of [0, 1]) for(let q = 0; q < n; q++){ const a = Math.PI*(1.05 + 0.9*q/(n - 1)) + rnd(-0.08, 0.08), len = h*rnd(0.35, 0.45)*F.wide, lit = Math.cos(a)*sd > 0.1; if(pass === 0 ? lit : !lit) continue;
      pkFrond(x, tx, ty, a, len, lit ? c.body : c.dark, rnd(0.15, 0.3), lit, c, h, px, sub(20 + q), hd > px(70), 0.85); }
    return; }
  if(kind === 'mushroom'){
    // a giant mushroom: a pale stalk, a dome of a cap, its gills dark beneath (aglow by night where the world is magic)
    const sw = h*rnd(0.06, 0.1), cr = h*rnd(0.28, 0.45)*F.wide, cy = Y - h*0.72, cap = pkMix(c.glow, c.body, 0.45);
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
    const n = small ? 3 : 5 + Math.floor(nR*4), glass = pkMix(c.glow, c.lit, 0.4);
    for(let q = 0; q < n; q++){ const a = (q/(n - 1) - 0.5)*1.1*F.wide + rnd(-0.1, 0.1), len = h*(q === Math.floor(n/2) ? 1 : rnd(0.45, 0.8)), wd = h*rnd(0.04, 0.07), ex = X + Math.sin(a)*len, ey = Y - Math.cos(a)*len, nx = Math.cos(a)*wd, ny = Math.sin(a)*wd;
      pkPoly(x, [[X - nx, Y - ny], [ex - nx, ey - ny], [X + Math.sin(a)*(len + wd*2), Y - Math.cos(a)*(len + wd*2)], [ex + nx, ey + ny], [X + nx, Y + ny]], pkCss(pkMix(glass, PK_BLACK, 0.35), 0.85));
      pkPoly(x, [[X, Y], [X + Math.sin(a)*(len + wd*2), Y - Math.cos(a)*(len + wd*2)], [ex + sd*nx, ey + sd*ny], [X + sd*nx, Y + sd*ny]], pkCss(glass, 0.85));
      pkGlow(x, ex, ey, wd*4, c.glow, 0.35); }
    return; }
  if(kind === 'fruit' || kind === 'olive'){
    // AN ORCHARD'S TREE (Ruby: "keep widening the library … in a less cartoony hand"): a short trunk (an olive's thick,
    // twisted and split), limbs pruned open, a low crown wider than it is tall, an olive's silver-grey; near, its fruit
    const ol = kind === 'olive', th = h*(ol ? 0.36 : 0.42), lean = ol ? rnd(-0.1, 0.1)*h : F.lean*h*0.3; trunk(th, h*(ol ? 0.11 : 0.07), lean, ol ? 'olive' : 'broadleaf');
    if(ol && !small){ x.strokeStyle = pkCss(pkMix(c.trunk, PK_BLACK, 0.35)); x.lineWidth = Math.max(px(0.5), h*0.016); x.beginPath(); x.moveTo(X - h*0.02, Y); x.quadraticCurveTo(X + h*0.035, Y - th*0.5, X - h*0.01, Y - th*0.95); x.stroke(); }
    const cx = X + lean, cy = Y - h*0.64, rr = h*0.4*F.wide, lobes = pkGrow(small ? 3 : ol ? 11 + Math.floor(nR*4) : 7 + Math.floor(nR*3), cx, cy, rr, h*0.28, rr*(ol ? 0.34 : 0.42), R, F);
    // (its limbs leave the trunk below its top, as thick as it is there, so the trunk divides and does not end)
    if(!small){ const R = sub(7); for(const [lx2, ly2] of lobes.slice(1).sort((p, q) => q[1] - p[1]).slice(0, 3)) pkLimb(x, X + lean*0.9, Y - th*0.88, lx2 + (X + lean - lx2)*0.15, ly2 + (Y - th - ly2)*0.15, h*(ol ? 0.06 : 0.045), c.trunk, px, (R() - 0.5)*0.3, c.lod); }
    // (an olive's leaves grey-green above and silver beneath, the crown open, the sky through it in many places)
    const co = ol ? { ...c, dark: pkMix(c.dark, PK_BLACK, 0.25), lit: pkMix(c.lit, [226, 232, 220], 0.4), air: c.air || pkMix(c.lit, PK_WHITE, 0.45) } : c;
    pkLobes(x, lobes, { ...co, leaf: ol ? 0.7 : 1, leafW: ol ? 0.25 : 0.45 }, RL, cx, cy, rr, px);
    if(!ol && !small && c.fruit){ const RB = sub(4); for(let q = 0, nb = hd > px(30) ? 40 : 14; q < nb; q++){ const [lx, ly, lr] = lobes[Math.floor(RB()*lobes.length)], a = RB()*Math.PI*2, d = lr*Math.sqrt(RB())*0.85;
      pkDisc(x, lx + Math.cos(a)*d, ly + Math.sin(a)*d, Math.max(px(0.6), lr*0.07), pkCss(c.fruit, 0.9)); } }
    return; }
  if(kind === 'bush'){
    // a bush: low lobes grown together, wider than tall, each its own
    const lobes = pkGrow(small ? 3 : 4 + Math.floor(nR*4), X + F.side*h*0.2, Y - h*0.42, h*0.75*F.wide, h*0.4, h*0.36, R, F).map(([a, b, r]) => [a, Math.min(b, Y - r*0.7), r]);
    pkLobes(x, lobes, c, RL, X, Y - h*0.4, h*0.6, px); return; }
  // a broadleaf (and the glowing trees): a trunk forking into limbs under a domed crown grown lobe on lobe: tall and narrow
  // where it grew among others, broad where it grew alone, leaning a little and fuller on the side it grew toward
  const lean = F.lean*h*0.4, fork = h*rnd(0.36, 0.5); trunk(fork, h*0.06*(0.8 + 0.4*F.age), lean, kind === 'glow' ? 'beech' : 'broadleaf');
  // (plants that meet each other: now and then ivy climbing the trunk of an old tree in the wet woods, c0.ivy)
  if(c0.ivy && hd > px(36)){ const RI = sub(15), tw = h*0.06*(0.8 + 0.4*F.age); for(let k = 0; k < 26; k++){ const u = k/26, wob = Math.sin(u*9 + RI()*0.5)*tw*0.45;
    pkDisc(x, X + lean*u + wob + (RI() - 0.5)*tw*0.3, Y - fork*u*0.92, Math.max(px(0.6), tw*(0.18 + 0.1*RI())), pkCss(RI() < 0.4 ? pkMix(c.dark, PK_BLACK, 0.25) : pkMix(c.body, c.dark, 0.4), 0.95)); } }
  const cx = X + lean + F.side*h*0.06, cy = Y - h*0.6, rr = h*0.34*F.wide, n = small ? 3 : 8 + Math.floor(nR*5), RG = sub(3);
  const lobes = pkGrow(n, cx, cy, rr*1.05, h*0.32, rr*0.46, R, F); if(!small) for(const s of [-1, 1]) lobes.push(...pkGrow(2, cx + s*rr*0.5, cy + h*0.12, rr*0.5, h*0.1, rr*0.36, R, F));
  if(!small){ const R = sub(7); for(const [lx2, ly2] of lobes.slice(1).sort((p, q) => q[1] - p[1]).slice(0, 2 + Math.floor(R()*2))) pkLimb(x, X + lean, Y - fork, lx2, ly2, h*0.045, c.trunk, px, (R() - 0.5)*0.4, c.lod); }
  pkLobes(x, lobes, c, RL, cx, cy, rr, px);
  if(kind === 'cherry' && !small){ const RB = sub(4); for(let q = 0, nb = hd > px(30) ? 90 : 26; q < nb; q++){ const [lx, ly, lr] = lobes[Math.floor(RB()*lobes.length)], a = RB()*Math.PI*2, d = lr*Math.sqrt(RB())*0.9;
      pkDisc(x, lx + Math.cos(a)*d, ly + Math.sin(a)*d, Math.max(px(0.6), lr*(hd > px(30) ? 0.08 : 0.14)), pkCss(pkMix([248, 214, 226], c.lit, 0.25), 0.9)); } }
  // (Ruby: "fewer large glowing regions": its glow kept close about its crown, soft)
  if(kind === 'glow'){ pkGlow(x, cx, cy, rr*1.35, c.glow, 0.24);
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
// A WINDOW LIT BY THE HOUR: r its own draw, base how many are lit as the evening begins. Fewer as the night deepens
// toward its middle (people abed: a share of them only); and with the scene's clock (c.t, in seconds), each goes on and
// off in its own time, hours apart (an evening's comings and goings, a light left on, a kitchen before dawn). How lit,
// from 0 to 1: in a film a lamp comes up and goes down over a minute of the scene's time, never in one frame
// (docs/prior-art/ringworld-motion-and-variety.md §4.4); a still's are on or off. c.unlit: every window dark (a turned
// building's proof, read for its walls' colours, so they never change with the hour)
const pkSs = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a)/(b - a))); return t*t*(3 - 2*t); };
const pkLit = (c, night, r, base) => { if(night <= 0.2 || c.unlit) return 0; const t = Math.max(0, Math.min(1, (night - 0.6)/0.4)), share = base*(1 - 0.6*t*t*(3 - 2*t));
  if(!c.t) return r < share ? 1 : 0; const period = 3600*(1.5 + 4*((r*31.7) % 1)), ph = (r*97.13 + c.t/period) % 1, e = Math.min(share/2, 60/period);
  return share <= 0 ? 0 : pkSs(0, e, ph)*pkSs(share, share - e, ph); };
// A LIGHT THAT COMES ON AT DUSK (a sign, a lantern, a lit face): in a still on once the night passes a fifth; in a film
// eased in across the dusk, so a town's lights never all come on in one frame. pkDm: a when lit, b when not, between
const pkDk = (c, night) => c && c.t ? pkSs(0.16, 0.26, night) : night > 0.2 ? 1 : 0;
// A WARNING LIGHT'S PULSE (docs/prior-art/ringworld-motion-and-variety.md §4.2: a mast's red lights flash twenty to
// thirty times a minute): in a film, on the film's own seconds (c.ft), a raised-cosine pulse of 0.8 s every 2.4 s, every
// mast's in step, so it is the same calm pace at any frame rate or speed of time; in a still, steady
const pkBeacon = c => { if(!c || !c.t || c.ft === undefined) return 1; const t = ((c.ft % 2.4) + 2.4) % 2.4; return t < 0.8 ? 0.15 + 0.85*(0.5 - 0.5*Math.cos(Math.PI*2*t/0.8)) : 0.15; };
// A LIGHTHOUSE'S CHARACTER (§4.3), chosen by its own draw: its beam's period in seconds and how many beams in a group
// (Fl 5s, Fl(2) 10s, Fl(3) 15s, Fl 6s, Fl(2) 8s, Fl 4s)
const PK_LIGHTS = [[5, 1], [10, 2], [15, 3], [6, 1], [8, 2], [4, 1]];
// A GLOW THAT BREATHES (§4.7: Ruby, "glow, lights, etc should also be animated … large spires and other buildings like
// this"): in a film, by at most an eighth over six to twelve seconds of the film, each building in its own time (by
// where it stands, k); in a still, steady
const pkBreathe = (c, k) => !c || !c.t || c.ft === undefined ? 1 : 1 + 0.12*Math.sin(Math.PI*2*c.ft/(6 + 6*(((k*0.01371) % 1) + 1) % 1) + k*0.37);
const pkDm = (c, night, a, b) => { const k = pkDk(c, night); return k >= 1 ? a : k <= 0 ? b : Array.isArray(a) ? pkMix(b, a, k) : b + (a - b)*k; };
function pkWindows(x, x0, top, wd, ht, c, night, lit, R, px, kind){
  // (how many windows, and whether near enough for their frames, by the building's size at its true distance (c.lod),
  //  so a turn never re-flows its windows)
  const lod = c.lod || 1, pitch = Math.max(px(3)/lod, wd*0.11), cols = Math.max(1, Math.floor(wd/pitch) - 1), rows = Math.min(90, Math.max(1, Math.floor(ht/pitch) - 1)), cw = wd/(cols + 1), rh = ht/(rows + 1);
  if(ht*lod < px(10)) return;
  const sky = pkMix(c.air || lit, PK_WHITE, 0.12), pane = pkMix(c.dark, PK_BLACK, 0.3), big = cw*lod > px(5), lamp = k => k < 0.1 ? pkMix(c.glow2 || c.glow, [150, 180, 240], 0.6) : pkMix(c.glow, PK_WHITE, k*0.35);
  if(kind === 'ribbon'){ // a slab's ribbon windows: one long band per floor, the sky in it, mullions where near
    for(let r = 1; r <= rows; r++){ const on = pkLit(c, night, R(), 0.55), y = top + r*rh, bh = rh*0.4, v = R();
      if(on < 1){ x.fillStyle = pkCss(pkMix(pane, sky, 0.2 + 0.25*v), 0.85); x.fillRect(x0 + cw*0.4, y, wd - cw*0.8, bh); }
      if(on > 0){ x.fillStyle = pkCss(lamp(v), 0.8*night*on); x.fillRect(x0 + cw*0.4, y, wd - cw*0.8, bh); }
      if(big){ x.fillStyle = pkCss(c.lit, 0.55); x.fillRect(x0 + cw*0.4, y + bh, wd - cw*0.8, Math.max(px(0.4), bh*0.12)); x.fillStyle = pkCss(c.dark, 0.5); for(let k = 1; k <= cols; k++) x.fillRect(x0 + k*cw, y, Math.max(px(0.4), cw*0.06), bh); } } return; }
  if(kind === 'mullion'){ // a glass tower: the sky slid across it on a slant, spandrels at every floor, mullions
    const g = x.createLinearGradient(x0, top, x0 + wd, top + ht*0.6); g.addColorStop(0, pkCss(sky, 0.34)); g.addColorStop(0.45, pkCss(sky, 0.08)); g.addColorStop(0.7, pkCss(sky, 0.22)); g.addColorStop(1, pkCss(sky, 0.02));
    x.fillStyle = g; x.fillRect(x0, top, wd, ht);
    x.fillStyle = pkCss(c.dark, 0.32); for(let r = 1; r <= rows; r++) x.fillRect(x0, top + r*rh - rh*0.12, wd, Math.max(px(0.4), rh*0.14));
    x.strokeStyle = pkCss(c.dark, 0.45); x.lineWidth = Math.max(px(0.4), cw*0.08); x.beginPath(); for(let k = 1; k <= cols; k++){ x.moveTo(x0 + k*cw, top); x.lineTo(x0 + k*cw, top + ht); } x.stroke(); }
  if(night > 0.2 || kind === 'neon'){ const nk = Math.max(night, kind === 'neon' ? 0.5 : 0);
    // (each window's draws the same whether lit or not, so one lighting never re-deals the next; its blind's depth from
    //  its own lamp draw)
    for(let r = 1; r <= rows; r++){ const floorLit = R() < 0.6; for(let k = 1; k <= cols; k++){ const on = pkLit(c, nk, R(), floorLit ? 0.5 : 0.12), v = R();
      if(on < 1 && kind !== 'mullion' && kind !== 'neon'){ x.fillStyle = pkCss(pane, 0.6); x.fillRect(x0 + k*cw - cw*0.22, top + r*rh, cw*0.44, rh*0.42); }
      if(on > 0){ x.fillStyle = pkCss(lamp(v), 0.85*nk*on); x.fillRect(x0 + k*cw - cw*0.25, top + r*rh, cw*0.5, rh*0.45); if(big && v > 0.7){ x.fillStyle = pkCss(PK_BLACK, 0.25*nk*on); x.fillRect(x0 + k*cw - cw*0.25, top + r*rh, cw*0.5, rh*0.45*(0.2 + 0.5*((v*13.7) % 1))); } } } } }
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
let PK_SNOW = false;   // (snow lying on the roofs: set by pkBuilding from its colours' snow, for the gables it draws)
const pkGable = (x, x0, x1, ye, yr, c, over = 0.08) => { const w = x1 - x0, m = (x0 + x1)/2, sn = k => PK_SNOW ? pkMix(k, [236, 240, 248], 0.7) : k; pkPoly(x, [[x0 - w*over, ye], [m, yr], [x1 + w*over, ye]], pkCss(sn(c.dark)));
  pkPoly(x, c.sd > 0 ? [[m, yr], [x1 + w*over, ye], [m, ye]] : [[m, yr], [x0 - w*over, ye], [m, ye]], pkCss(sn(pkMix(c.dark, c.body, 0.6)))); };
// a strip (a sill, a coping, a course of brick) at least a hair thick
const pkBar = (x, x0, y0, w, t, col, px, a = 1) => { x.fillStyle = pkCss(col, a); x.fillRect(x0, y0, w, Math.max(px(0.4), t)); };
// a window in its frame (or a door's glazing, door true): the frame catching the light, the sky held in its upper panes by
// day, lamplight by night (not every room), its glazing bars where large enough
const pkFrame = (x, wx, wy, ww, wh, c, night, o, door = false) => { const px = o.px, fr = Math.max(px(0.4), ww*0.1), on = pkLit(c, night, o.RW(), 0.7), tw = o.RW();
  x.fillStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.25), 0.9); x.fillRect(wx - fr, wy - fr, ww + fr*2, wh + fr*(door ? 1 : 2));
  if(on < 1){ const g = x.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, pkCss(pkMix(c.air || c.lit, PK_WHITE, 0.1), 0.85)); g.addColorStop(0.45, pkCss(pkMix(c.dark, PK_BLACK, 0.3), 0.9)); g.addColorStop(1, pkCss(pkMix(c.dark, PK_BLACK, 0.4), 0.95)); x.fillStyle = g; x.fillRect(wx, wy, ww, wh); }
  if(on > 0){ x.fillStyle = pkCss(pkMix(c.glow, PK_WHITE, 0.2*tw), 0.9*on); x.fillRect(wx, wy, ww, wh); }
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
    if(o.detail && o.R() < 0.45) pkSmoke(x, cx + wd*0.05, Y - h*1.1, wd, h*0.12, c, 4, 0.35);
    if(o.detail){ const door = pkMat(c, [[90, 60, 40], [60, 80, 70], [120, 50, 44]][Math.floor(o.R()*3)], 0.7), dx = X - w2*0.3, dh = (Y - ye)*0.72, dw = dh*0.45;
      pkShade(x, [[dx - dw/2, Y], [dx - dw/2, Y - dh], [dx + dw/2, Y - dh], [dx + dw/2, Y]], door.body, Y - dh, Y); pkPoly(x, [[dx - dw*0.75, Y - dh], [dx, Y - dh*1.2], [dx + dw*0.75, Y - dh]], pkCss(th.dark));
      for(const ux of [0.18, 0.62]) pkFrame(x, X - w2 + wd*ux, Y - (Y - ye)*0.72, wd*0.14, (Y - ye)*0.38, c, night, o);
      if(o.fine){ const fl = [[200, 70, 90], [230, 200, 80], [150, 110, 200], [240, 240, 230]]; for(let k = 0; k < 14; k++){ const fx = X - w2 + wd*o.RD(); if(Math.abs(fx - dx) < dw) continue; pkDisc(x, fx, Y - h*0.03*o.RD(), Math.max(o.px(0.5), wd*0.012), pkCss(pkMat(c, k % 3 ? [60, 100, 56] : fl[k % 4], 0.8).body)); } } } },
  aframe(x, X, Y, h, wd, c, night, lit, o){ // one tall triangle down to the ground, its gable glazed in a grid, a deck on posts, its roof's boards
    const w2 = wd/2, wood = pkMat(c, PK_WOOD, 0.55), roof = pkMat(c, PK_SLATE, 0.5);
    pkPoly(x, [[X - w2, Y], [X, Y - h], [X + w2, Y]], pkCss(roof.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2, Y], [X, Y]], pkCss(roof.body));
    pkShade(x, [[X - w2*0.78, Y], [X, Y - h*0.8], [X + w2*0.78, Y]], wood.body, Y - h*0.8, Y);
    pkPoly(x, [[X - w2*0.6, Y], [X, Y - h*0.62], [X + w2*0.6, Y]], pkCss(pkDm(c, night, pkMix(c.glow, c.dark, 0.3), pkMix(c.air || lit, c.dark, 0.45))));
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
    // (the tower round, the same from any side; its cap and sails turned with the mill, the sails a cross in their own
    //  plane, narrowed as the mill turns edge on, behind the tower when it faces away)
    const w2 = wd/2, bt = Y - h*0.62, tw = pkMat(c, o.R() < 0.5 ? [70, 66, 60] : PK_CREAM, 0.6), sail = pkMat(c, [226, 218, 200], 0.6), tn = c.turn, kx = tn ? (tn.cs < 0 ? -1 : 1)*Math.max(0.08, Math.abs(tn.cs)) : 1;
    // (its sails turning slowly in a film, by the film's own seconds)
    const hub = [X + (tn ? tn.sn*w2*0.45 : c.sd*w2*0.2), bt - w2*0.12], ang = o.R()*Math.PI/2 + (c.t && c.ft ? c.ft*0.45 : 0), L2 = h*0.4;
    const sails = () => { for(let q = 0; q < 4; q++){ const a = ang + q*Math.PI/2, ca = Math.cos(a), sa = Math.sin(a), nx = -sa*L2*0.11, ny = ca*L2*0.11, P = (u, v) => [hub[0] + (ca*L2*u + nx*v)*kx, hub[1] + sa*L2*u + ny*v];
      x.strokeStyle = pkCss(tw.dark); x.lineWidth = Math.max(o.px(0.5), L2*0.025); x.beginPath(); x.moveTo(...P(0, 0)); x.lineTo(...P(1, 0)); x.stroke();
      if(q % 2 && o.detail){ x.lineWidth = Math.max(o.px(0.3), L2*0.008); x.beginPath(); for(let k = 0; k <= 6; k++){ const u = 0.2 + 0.8*k/6; x.moveTo(...P(u, 0)); x.lineTo(...P(u, 1)); } x.moveTo(...P(0.2, 1)); x.lineTo(...P(1, 1)); x.stroke(); }
      else pkPoly(x, [P(0.2, 0), P(1, 0), P(1, 1), P(0.2, 1)], pkCss(q % 2 ? sail.dark : sail.body, 0.92)); }
      pkDisc(x, hub[0], hub[1], Math.max(o.px(0.6), w2*0.12), pkCss(tw.dark)); };
    if(kx < 0) sails();
    pkShade(x, [[X - w2, Y], [X - w2*0.55, bt], [X + w2*0.55, bt], [X + w2, Y]], tw.body, bt, Y); pkPoly(x, [[X, Y], [X, bt], [X + c.sd*w2*0.55, bt], [X + c.sd*w2, Y]], pkCss(tw.lit, 0.7));
    if(o.detail){ pkBar(x, X - w2*0.95, Y - h*0.22, wd*0.95, h*0.015, o.ink, o.px); pkFrame(x, X - wd*0.06, Y - h*0.12, wd*0.12, h*0.1, c, night, o, true); pkFrame(x, X - wd*0.04, Y - h*0.42, wd*0.08, h*0.06, c, night, o); }
    x.fillStyle = pkCss(tw.dark); x.beginPath(); x.ellipse(X, bt, w2*0.72, w2*0.42, 0, Math.PI, 0); x.fill();
    if(kx > 0) sails(); },
  stave(x, X, Y, h, wd, c, night, lit, o){ // a stave church: steep roofs stacked like a pine cone, dragon heads at the gables
    const w2 = wd/2, tar = pkMix(c.dark, [70, 44, 30], 0.4); pkBox(x, X, Y, Y - h*0.2, wd, { ...c, body: tar }, o.dep*0.3);
    for(let q = 0; q < 4; q++){ const u = q/4, w = w2*(1.1 - u*0.65), yb = Y - h*(0.2 + u*0.18), yt = Y - h*(0.36 + u*0.2); pkGable(x, X - w, X + w, yb, yt, { ...c, dark: tar }, 0.1);
      if(o.detail && q < 3) for(const s of [-1, 1]){ x.strokeStyle = pkCss(tar); x.lineWidth = Math.max(o.px(0.5), h*0.012); x.beginPath(); x.moveTo(X + s*w*0.5, yt + (yb - yt)*0.5); x.quadraticCurveTo(X + s*w*0.7, yt, X + s*w*0.85, yt + h*0.02); x.stroke(); } }
    // the ridge turret on the topmost roof and its spire to the cross, one piece from the roof up (never floating free)
    x.fillStyle = pkCss(tar); x.fillRect(X - wd*0.05, Y - h*0.62, wd*0.1, h*0.14); pkGable(x, X - wd*0.08, X + wd*0.08, Y - h*0.62, Y - h*0.68, { ...c, dark: tar }, 0.1);
    pkPoly(x, [[X - wd*0.035, Y - h*0.67], [X, Y - h], [X + wd*0.035, Y - h*0.67]], pkCss(tar)); },
  row(x, X, Y, h, wd, c, night, lit, o){ // a terrace: three to five narrow houses sharing their walls, each its own brick or paint, sash
    // windows with frames, a bay window now and then, steps to the door, chimney stacks with their pots
    const n = 3 + Math.floor(o.R()*3), hw = wd/n, M = [[150, 76, 58], [210, 196, 168], [150, 150, 146], [196, 120, 96], [110, 130, 150], [176, 168, 120]];
    for(let q = 0; q < n; q++){ const hx = X - wd/2 + hw*(q + 0.5), hh = h*(0.75 + 0.25*o.R()), wc = pkMat(c, M[Math.floor(o.R()*M.length)], 0.6), ye = Y - hh*0.75;
      pkShade(x, [[hx - hw/2, Y], [hx - hw/2, ye], [hx + hw/2, ye], [hx + hw/2, Y]], wc.body, ye, Y, 0.14); pkGable(x, hx - hw/2, hx + hw/2, ye, Y - hh, pkMat(c, [PK_SLATE, [150, 84, 64], [118, 108, 100], [92, 98, 112]][(q*3 + n) % 4], 0.55), 0);   // (each house its own slate or tile, never one dark comb along the row)
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
    if(o.detail) for(let q = 0; q < 3; q++) pkBar(x, X - wd*0.03, Y - h*(0.3 + q*0.18), wd*0.06, h*0.04, pkDm(c, night, c.glow, o.ink), o.px, 0.85);
    x.fillStyle = pkCss(o.ink); x.fillRect(X - w2*0.8, gt - h*0.02, wd*0.8, h*0.02);
    if(o.detail){ x.strokeStyle = pkCss(o.ink); x.lineWidth = Math.max(o.px(0.4), wd*0.01); x.beginPath(); x.moveTo(X - w2*0.8, gt - h*0.05); x.lineTo(X + w2*0.8, gt - h*0.05); for(let k = 0; k <= 6; k++){ const sx = X - w2*0.8 + wd*0.8*k/6; x.moveTo(sx, gt - h*0.02); x.lineTo(sx, gt - h*0.05); } x.stroke(); }
    // (its light has a character of its own (PK_LIGHTS): in a film its beams sweep round on the film's own seconds, each
    //  drawn as long as it lies across the page, and the lantern blazes up, eased, as a beam swings toward you; in a
    //  still, one beam out to its side as before)
    const lamp = pkMix(c.glow2 || c.glow, PK_WHITE, 0.4), rl = o.R(), dir = rl < 0.5 ? -1 : 1, [per, nbm] = PK_LIGHTS[Math.floor(((rl*7.919) % 1)*PK_LIGHTS.length)], film = !!(c.t && c.ft !== undefined);
    const th0 = dir < 0 ? Math.PI : 0, beams = Array.from({ length: film ? nbm : 1 }, (_, k) => th0 + (film ? Math.PI*2*c.ft/per : 0) + k*0.32), face = film ? Math.max(...beams.map(b => pkSs(0.86, 1, Math.sin(b)))) : 0;
    pkPoly(x, [[X - w2*0.4, gt - h*0.02], [X - w2*0.4, gt - h*0.12], [X + w2*0.4, gt - h*0.12], [X + w2*0.4, gt - h*0.02]], pkCss(lamp));
    pkPoly(x, [[X - w2*0.5, gt - h*0.12], [X, Y - h], [X + w2*0.5, gt - h*0.12]], pkCss(o.ink)); pkGlow(x, X, gt - h*0.07, wd*(1.5 + 3*night)*(1 + 0.5*face*night), pkMix(c.glow2 || c.glow, PK_WHITE, 0.5), Math.min(1, 0.5 + 0.4*night + 0.35*face*night));
    if(night > 0.3){ x.save(); x.globalCompositeOperation = 'screen'; const by = gt - h*0.07;
      for(const b of beams){ const cb = Math.cos(b), ln = h*1.6*Math.abs(cb), sd2 = cb < 0 ? -1 : 1; if(ln < h*0.05) continue; const g = x.createLinearGradient(X, by, X + sd2*ln, by); g.addColorStop(0, pkCss(lamp, 0.4*night)); g.addColorStop(1, pkCss(lamp, 0)); x.fillStyle = g;
        x.beginPath(); x.moveTo(X, by - h*0.01); x.lineTo(X + sd2*ln, by - h*0.12); x.lineTo(X + sd2*ln, by + h*0.08); x.closePath(); x.fill(); } x.restore(); } },
  cathedral(x, X, Y, h, wd, c, night, lit, o){ // a long nave under a steep roof, flying buttresses along it, lancet windows, two west towers
    // with their spires and belfry louvres, a rose window, a great door
    const w2 = wd/2, ne = Y - h*0.3, st = pkMat(c, [196, 186, 166], 0.45), roof = pkMat(c, [90, 110, 104], 0.5);
    pkBox(x, X + w2*0.2, Y, ne, wd*0.7, st, o.dep*0.3); pkGable(x, X - w2*0.15, X + w2*0.9, ne, Y - h*0.45, roof, 0.02);
    if(o.detail){ for(let k = 0; k < 6; k++){ const bx = X - w2*0.05 + wd*0.68*k/5; x.fillStyle = pkCss(pkDm(c, night, pkMix(c.glow, [120, 80, 200], 0.3), st.dark), 0.85); x.beginPath(); x.moveTo(bx - wd*0.012, Y - h*0.06); x.lineTo(bx - wd*0.012, Y - h*0.2); x.lineTo(bx, Y - h*0.235); x.lineTo(bx + wd*0.012, Y - h*0.2); x.lineTo(bx + wd*0.012, Y - h*0.06); x.fill();
        if(k < 5){ const fx = bx + wd*0.068; x.strokeStyle = pkCss(st.body); x.lineWidth = Math.max(o.px(0.5), wd*0.012); x.beginPath(); x.moveTo(fx, Y); x.lineTo(fx, Y - h*0.18); x.quadraticCurveTo(fx, Y - h*0.27, fx - wd*0.03, Y - h*0.29); x.stroke(); pkPoly(x, [[fx - wd*0.008, Y - h*0.18], [fx, Y - h*0.24], [fx + wd*0.008, Y - h*0.18]], pkCss(st.lit)); } } }
    for(const s of [-0.65, -0.25]){ const tx = X + s*w2, tw = wd*0.13; pkShade(x, [[tx - tw, Y], [tx - tw, Y - h*0.58], [tx + tw, Y - h*0.58], [tx + tw, Y]], s < -0.4 ? st.body : st.lit, Y - h*0.58, Y); pkPoly(x, [[tx - tw*1.05, Y - h*0.58], [tx, Y - h], [tx + tw*1.05, Y - h*0.58]], pkCss(roof.dark)); pkPoly(x, [[tx, Y - h], [tx + c.sd*tw*1.05, Y - h*0.58], [tx, Y - h*0.58]], pkCss(roof.body));
      if(o.detail){ x.fillStyle = pkCss(pkMix(st.dark, PK_BLACK, 0.3)); x.fillRect(tx - tw*0.25, Y - h*0.5, tw*0.5, h*0.12); if(o.fine){ x.fillStyle = pkCss(st.lit, 0.6); for(let k = 1; k < 5; k++) x.fillRect(tx - tw*0.25, Y - h*0.5 + h*0.12*k/5, tw*0.5, Math.max(o.px(0.4), h*0.004)); }
        for(const sx of [-1, 1]) pkPoly(x, [[tx + sx*tw - wd*0.006, Y - h*0.58], [tx + sx*tw, Y - h*0.66], [tx + sx*tw + wd*0.006, Y - h*0.58]], pkCss(st.lit)); } }
    if(o.detail){ const rx = X - w2*0.45, ry = Y - h*0.32, rr = wd*0.055; pkDisc(x, rx, ry, rr*1.15, pkCss(st.dark)); pkDisc(x, rx, ry, rr, pkCss(pkDm(c, night, c.glow, pkMix(c.dark, [70, 60, 120], 0.4)), 0.9));
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
    const fy = ft + wd*0.15, fr = wd*0.32; pkDisc(x, X, fy, fr*1.12, pkCss(st.dark)); pkDisc(x, X, fy, fr, pkCss(pkDm(c, night, pkMix(c.glow, PK_WHITE, 0.4), pkMix(c.lit, PK_WHITE, 0.4))));
    if(o.detail){ x.strokeStyle = pkCss(o.ink); x.lineWidth = Math.max(o.px(0.4), wd*0.025); x.beginPath(); const a1 = o.R()*Math.PI*2, a2 = o.R()*Math.PI*2; x.moveTo(X, fy); x.lineTo(X + Math.cos(a1)*fr*0.75, fy + Math.sin(a1)*fr*0.75); x.moveTo(X, fy); x.lineTo(X + Math.cos(a2)*fr*0.5, fy + Math.sin(a2)*fr*0.5); x.stroke();
      if(o.fine){ x.fillStyle = pkCss(o.ink, 0.8); for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; x.fillRect(X + Math.cos(a)*fr*0.85 - fr*0.02, fy + Math.sin(a)*fr*0.85 - fr*0.05, fr*0.04, fr*0.1); } } } },
  factory(x, X, Y, h, wd, c, night, lit, o){ // a saw-tooth shed of brick, its north lights glazed, tall chimneys banded, smoke from one, a tank
    const w2 = wd/2, st = Y - h*0.35, n = 4 + Math.floor(o.R()*3), br = pkMat(c, PK_BRICK, 0.55), roof = pkMat(c, PK_SLATE, 0.5);
    pkShade(x, [[X - w2, Y], [X - w2, st], [X + w2, st], [X + w2, Y]], br.body, st, Y, 0.15);
    if(o.detail){ for(let k = 0; k < n*2; k++) pkFrame(x, X - w2 + wd*(k + 0.25)/(n*2), Y - (Y - st)*0.75, wd*0.5/(n*2), (Y - st)*0.4, c, night, o); pkBar(x, X - w2, st, wd, (Y - st)*0.05, br.dark, o.px, 0.8); }
    for(let q = 0; q < n; q++){ const x0 = X - w2 + wd*q/n, x1 = x0 + wd/n; pkPoly(x, [[x0, st], [x1, st - h*0.12], [x1, st]], pkCss(roof.body)); pkPoly(x, [[x1 - wd/n*0.14, st - h*0.105], [x1, st - h*0.12], [x1, st], [x1 - wd/n*0.14, st]], pkCss(pkDm(c, night, pkMix(c.glow, PK_WHITE, 0.2), pkMix(c.air || lit, c.dark, 0.3)), pkDm(c, night, 0.8, 0.9))); }
    const nc = 1 + Math.floor(o.R()*3); for(let q = 0; q < nc; q++){ const cx = X - w2*0.6 + q*wd*0.25, cw = Math.max(o.px(0.6), wd*0.04); pkShade(x, [[cx - cw, st], [cx - cw*0.7, Y - h], [cx + cw*0.7, Y - h], [cx + cw, st]], br.body, Y - h, st);
      if(o.detail){ x.fillStyle = pkCss(PK_WHITE, 0.45); x.fillRect(cx - cw*0.75, Y - h*0.92, cw*1.5, h*0.02); x.fillStyle = pkCss(br.dark); x.fillRect(cx - cw*0.8, Y - h*1.01, cw*1.6, h*0.02);
        if(q === 0) pkSmoke(x, cx, Y - h*1.0, wd*0.85, h*0.06, c, 5, 0.4); } } },
  watertower(x, X, Y, h, wd, c, night, lit, o){ // four legs braced in X's, a tank of staves bound in hoops, a cone roof, its ladder
    const w2 = wd/2, tb = Y - h*0.62, st = pkMat(c, PK_STEEL, 0.5), wood = pkMat(c, PK_GREYWOOD, 0.6); x.strokeStyle = pkCss(st.dark); x.lineWidth = Math.max(o.px(0.5), wd*0.04); x.beginPath(); for(const s of [-1, -0.35, 0.35, 1]){ x.moveTo(X + s*w2*0.7, Y); x.lineTo(X + s*w2*0.45, tb); } x.stroke();
    if(o.detail){ x.lineWidth = Math.max(o.px(0.4), wd*0.012); x.beginPath(); for(const [y0, y1] of [[Y, Y - h*0.3], [Y - h*0.3, tb]]){ const k0 = 0.7 - 0.25*(Y - y0)/(Y - tb), k1 = 0.7 - 0.25*(Y - y1)/(Y - tb); x.moveTo(X - w2*k0, y0); x.lineTo(X + w2*k1, y1); x.moveTo(X + w2*k0, y0); x.lineTo(X - w2*k1, y1); x.moveTo(X - w2*k1, y1); x.lineTo(X + w2*k1, y1); } x.stroke(); }
    pkShade(x, [[X - w2*0.6, tb], [X - w2*0.6, Y - h*0.88], [X + w2*0.6, Y - h*0.88], [X + w2*0.6, tb]], wood.body, Y - h*0.88, tb); pkPoly(x, [[X + c.sd*w2*0.1, tb], [X + c.sd*w2*0.1, Y - h*0.88], [X + c.sd*w2*0.6, Y - h*0.88], [X + c.sd*w2*0.6, tb]], pkCss(wood.lit, 0.6));
    if(o.detail){ x.fillStyle = pkCss(st.dark, 0.8); for(let k = 1; k < 5; k++) x.fillRect(X - w2*0.6, tb - (tb - Y + h*0.88)*k/5, wd*0.6, Math.max(o.px(0.4), h*0.006)); }
    pkPoly(x, [[X - w2*0.68, Y - h*0.88], [X, Y - h], [X + w2*0.68, Y - h*0.88]], pkCss(st.dark)); pkPoly(x, [[X, Y - h], [X + c.sd*w2*0.68, Y - h*0.88], [X, Y - h*0.88]], pkCss(st.body)); },
  capsule(x, X, Y, h, wd, c, night, lit, o){ // two core shafts, cubes stuck on at every side, a round porthole each
    const w2 = wd/2, cs = Math.max(wd*0.22, h*0.07); for(const s of [-0.25, 0.25]) pkPoly(x, [[X + s*wd - wd*0.06, Y], [X + s*wd - wd*0.06, Y - h], [X + s*wd + wd*0.06, Y - h], [X + s*wd + wd*0.06, Y]], pkCss(c.dark));
    for(let yy = Y - cs; yy > Y - h; yy -= cs*1.05) for(const s of [-1, 1]) if(o.R() < 0.8){ const cx = X + s*(w2*0.55 + o.R()*cs*0.3); pkPoly(x, [[cx - cs/2, yy + cs], [cx - cs/2, yy], [cx + cs/2, yy], [cx + cs/2, yy + cs]], pkCss(o.R() < 0.5 ? c.body : c.lit));
      if(o.detail) pkDisc(x, cx, yy + cs/2, cs*0.22, pkCss(pkMix(pkMix(c.dark, PK_BLACK, 0.3), c.glow, pkLit(c, night, o.RW(), 0.6)))); } },
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
    // (its rotor turning in a film, on the film's own seconds at about twelve turns a minute, faster in a stronger wind;
    //  its warning light pulsing with every mast's)
    pkPoly(x, [[X - sw*1.5, Y], [X - sw*0.7, hub[1]], [X + sw*0.7, hub[1]], [X + sw*1.5, Y]], pkCss(white)); const a0 = o.R()*Math.PI*2 + (c.t && c.ft ? c.ft*1.25*(0.7 + 0.6*Math.min(1, Math.abs(c.windX || 0.5))) : 0);
    for(let q = 0; q < 3; q++){ const a = a0 + q*Math.PI*2/3, ex = hub[0] + Math.cos(a)*bl, ey = hub[1] + Math.sin(a)*bl, nx = -Math.sin(a)*sw*1.6, ny = Math.cos(a)*sw*1.6; pkPoly(x, [[hub[0] + nx, hub[1] + ny], [ex, ey], [hub[0] - nx*0.3, hub[1] - ny*0.3]], pkCss(white)); }
    pkEll(x, hub[0], hub[1], sw*2.4, sw*1.3, pkCss(c.body)); if(night > 0.2) pkDisc(x, hub[0], hub[1] - sw*1.5, sw, pkCss([255, 70, 60], 0.9*pkBeacon(c))); },
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
    if(o.detail) for(let k = 0; k < 3; k++) pkBar(x, sx - wd*0.055, Y - h*(0.98 - k*0.07), wd*0.11, h*0.045, pkDm(c, night, pkMix(c.glow, PK_WHITE, 0.4), [30, 30, 34]), o.px, 0.9); },
  motel(x, X, Y, h, wd, c, night, lit, o){ // a motel: a long low bar of rooms, door and window, door and window, a walkway, its tall arrow sign
    const w2 = wd/2, wall = pkMat(c, [[220, 200, 170], [200, 220, 214], [230, 214, 200]][Math.floor(o.R()*3)], 0.6), roof = pkMat(c, [150, 70, 50], 0.6), ye = Y - h*0.6;
    pkBox(x, X, Y, ye, wd, wall, o.dep*0.2); pkPoly(x, [[X - w2*1.03, ye], [X - w2, ye - h*0.12], [X + w2, ye - h*0.12], [X + w2*1.03, ye]], pkCss(roof.body));
    if(o.detail){ const n = Math.max(3, Math.floor(wd/(h*0.5))); for(let k = 0; k < n; k++){ const ux = X - w2 + wd*(k + 0.15)/n, uw = wd/n; pkShade(x, [[ux, Y], [ux, Y - h*0.42], [ux + uw*0.22, Y - h*0.42], [ux + uw*0.22, Y]], pkMat(c, [[60, 100, 140], [150, 60, 60], [60, 120, 90]][k % 3], 0.7).body, Y - h*0.42, Y);
      pkFrame(x, ux + uw*0.38, Y - h*0.38, uw*0.42, h*0.2, c, night, o); } }
    const sx = X + w2*1.12, st = pkMat(c, [230, 60, 70], 0.7); x.fillStyle = pkCss(PK_IRON); x.fillRect(sx - wd*0.005, Y - h*1.4, wd*0.01, h*1.4);
    pkPoly(x, [[sx - wd*0.08, Y - h*1.45], [sx + wd*0.08, Y - h*1.45], [sx + wd*0.08, Y - h*1.05], [sx - wd*0.08, Y - h*1.05]], pkCss(pkDm(c, night, pkMix(st.body, PK_WHITE, 0.2), st.body)));
    pkType(x, 'MOTEL', sx, Y - h*1.2, h*0.12, wd*0.15, PK_WHITE, o.px); pkType(x, 'VACANCY', sx, Y - h*1.1, h*0.05, wd*0.15, pkDm(c, night, [140, 255, 190], [210, 210, 200]), o.px);
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
    for(const v of [0.5, 1]) pkDisc(x, X, Y - h*v, Math.max(o.px(0.6), mw*0.6), pkCss([255, 60, 50], pkDm(c, night, 1, 0.5)*pkBeacon(c))); if(night > 0.2) pkGlow(x, X, Y - h, h*0.06, [255, 60, 50], 0.6*pkBeacon(c)); },
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
// a chimney's smoke from (X, Y): puffs rising and growing, leaning with the wind (c.windX, -1 to 1: blown flat in a
// strong one) or, with no wind given, away from the light; with the clock (c.mt, the scene's small motions, else c.t)
// they rise from the pot and thin away
// SMOKE ON THE WIND (docs/prior-art/ringworld-motion-and-variety.md §3): a train of puffs, each born at the pot in its
// own moment and carried off by its age alone (stateless): leaning downwind, rising as the two-thirds power of its age
// as a plume does (Briggs), so it bends over into the wind, less steeply as the wind blows harder; swelling and thinning
// as it goes, with a slow curl along its way. In a film each puff is born faint and fades out, so none appears or
// vanishes whole, and the train runs on a gentle clock (at most a quarter second a frame: c.smt), never strobing
function pkSmoke(x, X, Y, wd, step, c, n, a0){ const wx = c.windX ?? -c.sd*0.6, tm = c.smt ?? c.mt ?? c.t, run = tm ? (tm*0.12) % 1 : 0, col = pkCss(pkMix(c.lit, c.air || c.lit, 0.45));
  const up = step*(1 - 0.55*Math.min(1, Math.abs(wx)))*Math.cbrt(n), ph = (X*0.013 + Y*0.007) % 6.28;
  const GA = x.globalAlpha;   // (laid at whatever the thing it rises from is laid at)
  for(let k = 0; k < n; k++){ const f = k + run, a = a0*(1 - f/n)*(tm ? pkSs(0, 0.8, f) : 1); if(a <= 0.01) continue; x.globalAlpha = GA*a;
    pkDisc(x, X + f*wd*0.07*wx*1.4 + Math.sin(f*1.3 + ph)*wd*0.012*f, Y - up*Math.pow(f, 2/3), wd*(0.04 + f*0.024), col); }
  x.globalAlpha = GA; }
const PK_ROUND = ['windmill', 'yurt', 'rondavel', 'trullo', 'dome', 'oast', 'dovecote', 'radiomast', 'elevator', 'needle', 'silo', 'lighthouse', 'watertower', 'geodome',
  'observatory', 'wizard', 'onion']; // (round: the same from every side)
// SQUARE AND ALIKE ON FOUR SIDES (Ruby: "definitely up to 16 points of rotation for buildings"): a pagoda and a mosque
// were drawn the same from every side, so as the camera went round they turned with it. Each is built now in the round
// (pkSpace) and seen as the eye sees it turned, through every angle: the pagoda's tiers square boxes under square roofs
// whose four slopes curl up at the corners, the mosque's hall a box under its domes with a minaret at each corner, the
// far ones behind it and the near ones before it (docs/prior-art/ringworld-life-and-views.md §5)
function pkPagoda3(x, X, Y, h, wd, c, night, R0, px){
  const S = pkSpace(X, Y, 1, c.view), sd = c.sd, R = pkSub(R0)(7), n = 3 + Math.floor(R()*3), w2 = wd/2, th = h*0.82/n;
  const wall = pkMat(c, [190, 70, 50], 0.45), roof = pkMat(c, pkMix(c.dark, [60, 50, 50], 0.3), 0.8), lit = (nu, nv, up) => { const k = S.light(nu, nv, sd)*0.7 + up; return k > 0 ? pkMix(roof.body, roof.lit, Math.min(1, k)) : pkMix(roof.body, roof.dark, Math.min(1, -k)); };
  pkCast(x, X - w2*0.9, X + w2*0.9, Y, Math.min(h, wd*1.6), c);
  for(let q = 0; q < n; q++){ const u = q/n, zb = h*0.82*u, w = w2*(1 - u*0.55), hw = w*0.55, E = w*1.15, T = w*0.4, ze = zb + 0.62*th, zc = ze + 0.15*th, zr = zb + 0.95*th;
    pkBox3(x, S, -hw, hw, -hw, hw, zb, zb + 0.65*th, wall, sd);
    // (the roof's four slopes, the far first: from the eaves, raised at the corners, up to the next tier's foot)
    const slopes = [[1, 0], [0, 1], [-1, 0], [0, -1]].sort((p, q2) => S.depth(p[0], p[1]) - S.depth(q2[0], q2[1]));
    for(const [nu, nv] of slopes){ const tu = -nv, tv = nu, P = (a, b, z) => S.P(nu*a + tu*b, nv*a + tv*b, z);
      pkPoly(x, [P(E, -E, zc), P(E*0.7, 0, ze), P(E, E, zc), P(T, T, zr), P(T, -T, zr)], pkCss(lit(nu, nv, 0.15))); }
    if(night > 0.2 && px(1) && w > px(4)) pkGlow(x, X, Y - zb - th*0.3, w*0.6, c.glow, 0.3*night); }
  x.fillStyle = pkCss(roof.dark); x.fillRect(X - wd*0.02, Y - h, wd*0.04, h*0.2); }
function pkMosque3(x, X, Y, h, wd, c, night, R0, px){
  const S = pkSpace(X, Y, 1, c.view), sd = c.sd, w2 = wd/2, hb = h*0.3, d = w2*0.8, dr = wd*0.24, a = w2*0.86, mw = Math.max(px(0.6), wd*0.03);
  pkCast(x, X - w2, X + w2, Y, Math.min(h, wd*1.2), c);
  // (a minaret: a slender shaft tapering to its cap, two balconies; lit on the side toward the light)
  const minaret = (u, v) => { const [mx, my] = S.P(u, v, 0), top = my - h*0.88, side = Math.sign(u*S.sn + v*S.cs) || 1;
    pkPoly(x, [[mx - mw, my], [mx - mw*0.7, top], [mx + mw*0.7, top], [mx + mw, my]], pkCss(c.body)); pkPoly(x, [[mx + sd*mw*0.1, my], [mx + sd*mw*0.1, top], [mx + sd*mw*0.7, top], [mx + sd*mw, my]], pkCss(c.lit));
    pkPoly(x, [[mx - mw*0.8, top], [mx, my - h], [mx + mw*0.8, top]], pkCss(c.dark)); for(const b of [0.55, 0.75]){ x.fillStyle = pkCss(c.dark); x.fillRect(mx - mw*1.6, my - h*b, mw*3.2, Math.max(px(0.5), h*0.012)); } return side; };
  const corners = [[a, a], [a, -a], [-a, a], [-a, -a]].sort((p, q) => S.depth(...p) - S.depth(...q)), far = corners.slice(0, 2), near = corners.slice(2);
  for(const [u, v] of far) minaret(u, v);
  pkBox3(x, S, -d, d, -d, d, 0, hb, c, sd);
  // (the half-domes on its four sides and the great dome on its drum, round from any side: the far half-domes first)
  const domeAt = (u, v, z, r, col) => { const [ex, ey] = S.P(u, v, z); x.fillStyle = pkCss(col); x.beginPath(); x.arc(ex, ey, r, Math.PI, 0); x.fill(); };
  for(const [u, v] of [[dr*1.1, 0], [-dr*1.1, 0], [0, dr*1.1], [0, -dr*1.1]].sort((p, q) => S.depth(...p) - S.depth(...q))) domeAt(u, v, hb, dr*0.55, c.body);
  const [cx0, cy0] = S.P(0, 0, hb), db = cy0 - (h*0.42 - hb); x.fillStyle = pkCss(c.body); x.fillRect(cx0 - dr, db, dr*2, cy0 - db);
  x.beginPath(); x.arc(cx0, db, dr, Math.PI, 0); x.fill(); x.fillStyle = pkCss(c.lit); x.beginPath(); x.arc(cx0 + sd*dr*0.25, db, dr*0.7, Math.PI, 0); x.fill(); x.fillRect(cx0 - wd*0.006, db - dr - h*0.08, wd*0.012, h*0.08);
  for(const [u, v] of near) minaret(u, v); }
// TURNED IN DEPTH (Ruby: "some of your object rotations are extremely cheap looking … think about them in
// three-dimensional space even though they are two-dimensional"): a box-built building turned from the eye is a box, as
// pkSpace sees it: its front (the building's own painted face, laid on the face's plane, foreshortened and sheared as the
// face turns), the side it turns toward you with its own windows and a gable roof running back over it, and from behind,
// its plain back wall and gable; each face lit by the side it turns to the light. Its width, height, setbacks, eaves,
// ridge and stilts are read off its own face (pkFaceProof). [depth as a share of the width, the eaves' height as a share
// of the whole if the face can't be read (0 for a flat top), the roof's material, where what stands above the roof
// stands (1 on its face, 0 amidships), how far above a flat top that begins (a sawtooth's teeth are the roof's own)]
// by kind; any other building (a temple) stands facing you, mirrored when it turns the other way
const PK_BOX3 = { brick: [0.9, 0], glass: [0.9, 0], slab: [0.45, 0], deco: [0.8, 0], factory: [1, 0, null, 1, 0.12], capsule: [0.8, 0], megablock: [0.6, 0], gasstation: [0.5, 0], motel: [0.4, 0],
  pueblo: [0.8, 0], kubo: [0.9, 0.5, PK_THATCH], clock: [1, 0], cottage: [0.85, 0.55, PK_THATCH], barn: [1.4, 0.55, [140, 52, 42], 0], stave: [1.2, 0.45, [70, 52, 38], 0], row: [0.45, 0.7, PK_SLATE],
  chapel: [1.8, 0.6, PK_SLATE], aframe: [1.2, 0.04, PK_SLATE], machiya: [1.6, 0.65, [74, 78, 86]], gassho: [1.3, 0.25, PK_THATCH], horreo: [0.9, 0.6, PK_TERRA], greenhouse: [2.2, 0.6, [200, 216, 214]], cathedral: [2.4, 0.5, PK_SLATE], castle: [1, 0] };
// a building's face drawn small, off the page, and read back: its outline (how wide its walls stand, how high, the
// steps of a setback tower, where a gable's eaves and ridge are) and its colours (the wall's, the commonest low on the
// face; the roof's, high on it), so the box it is turned into in depth is its own shape and the same stuff as its face
// (kept: a film draws the same buildings frame after frame, the camera turning or the hours passing; a proof is read
//  back from a canvas the CPU keeps, never one the GPU must hand back)
const PK_PROOFS = new Map();
// (Ruby, 2026-10-25: buildings flashing as the camera panned, "shouldn't this stuff all be tagged data": a proof is the
//  building's own, read ONCE: drawn at one size whatever size it shows (its readings are shares of its height and width),
//  by daylight in its own unlit colours (c.raw, its palette's; lit again where they are used: c.lightRaw), so neither a
//  film's moving camera nor its passing hours ever read it again or read it differently)
function pkFaceProof(face, c, R0, h, wdt, eave, id, px){
  const H0 = px ? px(140) : 140, W0 = H0*wdt/Math.max(1e-6, h), raw = !!c.raw;
  const key = id ? id + '|' + Math.round(wdt/Math.max(1e-6, h)*24) + '|' + eave + '|' + (PK_SNOW ? 's|' : '') + (raw ? 'raw' : JSON.stringify(c, (k, v) => k === 't' || k === 'mt' || k === 'smt' || k === 'ft' || k === 'view' || k === 'windX' || typeof v === 'function' ? undefined : typeof v === 'number' ? Math.round(v*100)/100 : v)) : null;
  if(key && PK_PROOFS.has(key)) return PK_PROOFS.get(key);
  const cP = raw ? { ...c, mat: m0 => { const m = c.raw(m0); return { body: m, lit: pkMix(m, PK_WHITE, 0.28), dark: pkMix(m, PK_BLACK, 0.42) }; }, body: c.rawBody || c.body, lit: c.rawLit || c.lit, dark: c.rawDark || c.dark } : c;
  const out = pkFaceProofOf(face, cP, R0, H0, W0, eave);
  if(key){ if(PK_PROOFS.size > 3000) PK_PROOFS.clear(); PK_PROOFS.set(key, out); }
  return out; }
function pkFaceProofOf(face, c, R0, h, wdt, eave){ const out = {};
  try { const N = 96, cv = document.createElement('canvas'); cv.width = N; cv.height = N; const q = cv.getContext('2d', { willReadFrequently: true }), kx = (N - 6)/(wdt*2), ky = (N - 6)/(h*1.4);
    q.save(); q.translate(N/2, N - 3); q.scale(kx, ky); face(q, { ...c, view: null, vdep: 1e-6, nocast: true, unlit: true }, R0, h, wdt, 0); q.restore();
    const d = q.getImageData(0, 0, N, N).data, op = (i, j) => i >= 0 && i < N && j >= 0 && j < N && d[(j*N + i)*4 + 3] > 160;
    const J = fy => Math.round(N - 3 - fy*h*ky), I = fx => Math.round(N/2 + fx*wdt*kx), at = (fx, fy) => { const i = (J(fy)*N + I(fx))*4; return d[i + 3] > 200 ? [d[i], d[i + 1], d[i + 2]] : null; };
    // (a row's half-width, out from the middle both ways and the narrower kept; a column's top, down from the sky)
    const half = fy => { const j = J(fy); let l = 0, r = 0; while(op(N/2 - 1 - l, j)) l++; while(op(N/2 + r, j)) r++; return Math.min(l, r)/kx/wdt; };
    const topAt = fx => { const i = I(fx); for(let j = 0; j < N; j++) if(op(i, j)) return (N - 3 - j)/ky/h; return 0; };
    // (a granary up on its pillars: the body starts where the middle of the face first has something in it)
    const a0 = Math.max(...[0.3, 0.5, 0.7, 0.85].map(half)) || 0.4;
    const lift = (ls => ls.sort((p, q) => p - q)[2])([-0.5, -0.25, 0, 0.25, 0.5].map(u => { const i = I(u*a0); for(let j = N - 4; j > 0; j--) if(op(i, j) && op(i, j - 1) && op(i, j - 2)) return Math.max(0, (N - 3 - j)/ky/h); return 0; }));
    if(lift > 0.06 && lift < 0.85) out.lift = lift; const L = out.lift || 0;
    const a = Math.min(half(L + 0.05), half(L + 0.12), half(L + 0.2)); if(a > 0.15 && a < 1.2) out.a = a;
    const A = out.a || 0.5, both = u => Math.min(topAt(-u*A), topAt(u*A));
    if(eave){ // the gable's line, read off its slope halfway out and nearer the eaves (clear of a tower or belfry in the middle;
      // a terrace's row of gables can't be read so, and keeps its table's eaves: pkTurned's o.ends)
      const t5 = both(0.5), t8 = both(0.82), sl = (t5 - t8)/0.32, ridge = t5 + 0.5*sl, ev = t8 - 0.18*sl;
      if(sl > 0 && ev > 0.02 && ev < 0.95 && ridge > ev && ridge < 1.3) Object.assign(out, { eave: ev, ridge }); }
    else { // a flat top, or the steps of a setback tower: a box for each step, the narrower ones standing up from the wider
      const ts = [0.9, 0.6, 0.3].map(u => [u, both(u)]).filter(([, t]) => t > 0.05), tiers = [];
      for(const [u, t] of ts){ if(tiers.length && t < tiers[tiers.length - 1].z*1.06) continue; const w = half(Math.max(0.02, t - 0.03));
        if(tiers.length && w < A*0.2) continue; tiers.push({ z: Math.min(1.05, t), a: Math.min(A, w || A*u) }); } // (a step is a body, not a chimney or a sawtooth)
      if(tiers.length) out.tiers = tiers; }
    const zt0 = out.eave || eave || (out.tiers ? out.tiers[0].z : 0.9), zt = zt0 - L, lv = v => L + v; // (heights on the body, above any stilts)
    out.wall = (pts => { const cs = pts.map(([u, v]) => at(u*A*2, lv(v))).filter(Boolean); if(!cs.length) return null; cs.sort((p, s) => (p[0] + p[1] + p[2]) - (s[0] + s[1] + s[2])); return cs[cs.length >> 1]; })(
      [[-0.4, zt*0.15], [0.4, zt*0.15], [-0.42, zt*0.5], [0.42, zt*0.5], [0.1, zt*0.85], [-0.3, zt*0.85], [0.35, zt*0.35]]);
    // (and each end's own wall, for a terrace whose end houses are each their own brick or paint: its side is the end house's)
    for(const sg of [-1, 1]){ const cs = [0.2, 0.4, 0.6].map(v => at(sg*A*0.9, lv(zt*v))).filter(Boolean); if(cs.length) out[sg] = cs[cs.length >> 1]; }
    if(eave){ const e = out.eave || eave, rg = out.ridge || 1, r = t => e + (rg - e)*t, cs = [[-0.3, r(0.3)], [0.3, r(0.3)], [-0.18, r(0.55)], [0.18, r(0.55)], [-0.38, r(0.12)], [0.38, r(0.12)]].map(([u, v]) => at(u*A*2, v)).filter(Boolean);
      if(cs.length){ cs.sort((p, s) => (p[0] + p[1] + p[2]) - (s[0] + s[1] + s[2])); out.roof = cs[cs.length >> 1]; } } } catch(e){ /* no canvas here: the table's shape and the kit's own colours */ }
  return out; }
// o: { kind, dk (depth as a share of the width), eave, roofM, at (where what stands above the roof stands), face (draws
// the thing's own face at a context's origin), back (it has a back of its own to draw), ends (its sides each the colour
// of its own end), plain (no windows, no cast shadow: a small thing) }
function pkTurned(x, X, Y, h, wdt, c, R0, px, night, o){
  const GA = x.globalAlpha;   // (drawn faint as a whole when its caller lays it faint)
  const { kind, dk, eave: eave0, roofM, at: crownAt = 1, rim = 0.035, face } = o, S = pkSpace(X, Y, 1, c.view), sd = c.sd, mpx = c.mpx || wdt/10;
  // (the same thing every way: its stream taken once, and its shape and colours read back from a small proof of its face)
  const v0 = R0(), R1 = () => v0, pr = pkFaceProof(face, c, R1, h, wdt, eave0, o.id && o.id + '|' + v0 + '|' + px(100).toFixed(3), px); R0 = R1;
  if(o.plain && !pr.a) return false; // (a small thing whose face can't be read: squeezed as before)
  const w2 = (pr.a || 0.5)*wdt, D = w2*2*dk, eave = eave0 ? ((!o.ends && pr.eave) || eave0) : 0, ridge = h*((!o.ends && pr.ridge) || 1), Hs = h*eave;
  const tiers = eave ? [{ z: eave, a: w2/wdt }] : (pr.tiers || [{ z: 0.97, a: w2/wdt }]);
  const litOf = m => c.lightRaw ? c.lightRaw(m) : { body: m, lit: pkMix(m, PK_WHITE, 0.25), dark: pkMix(m, PK_BLACK, 0.4) };
  if(pr.wall) c = { ...c, ...litOf(pr.wall) };
  const shadeOf = (nu, nv, m = c) => { const k = S.light(nu, nv, sd); return k > 0 ? pkMix(m.body, m.lit, k*0.85) : pkMix(m.body, m.dark, -k*0.85); };
  const wall = (pts, nu, nv, m = c) => pkShade(x, pts.map(p => S.P(...p)), shadeOf(nu, nv, m), Math.min(...pts.map(p => S.P(...p)[1])), Math.max(...pts.map(p => S.P(...p)[1])), 0.1);
  // windows on a face from (ua, va) to (ub, vb), between heights z0 and z1: a storey every three metres or so, a bay
  // every three, each a dark pane, some lit by night
  const windows = (ua, va, ub, vb, z0, z1, Rw) => { if(o.plain) return; const len = Math.hypot(ub - ua, vb - va), cols = Math.max(1, Math.floor(len/(3*mpx))), rows = Math.max(1, Math.floor((z1 - z0)/(3.2*mpx)));
    if(len < px(10) || z1 - z0 < px(8) || cols*rows > 400) return; const ww = Math.min(1.2*mpx, len/cols*0.5), wh = Math.min(1.5*mpx, (z1 - z0)/rows*0.5);
    for(let r = 0; r < rows; r++) for(let q = 0; q < cols; q++){ const t = (q + 0.5)/cols, uc = ua + (ub - ua)*t, vc = va + (vb - va)*t, du = (ub - ua)/len*ww/2, dv = (vb - va)/len*ww/2, zc = z0 + (z1 - z0)*(r + 0.55)/rows;
      const on = pkLit(c, night, Rw(), 0.45), col = pkMix(pkMix(c.dark, c.air || PK_BLACK, 0.25), pkMix(c.glow, PK_WHITE, 0.3), on);
      pkPoly(x, [S.P(uc - du, vc - dv, zc - wh/2), S.P(uc + du, vc + dv, zc - wh/2), S.P(uc + du, vc + dv, zc + wh/2), S.P(uc - du, vc - dv, zc + wh/2)], pkCss(col, 0.9)); } };
  const Rw = pkSub(R0)(9), sideN = S.sn >= 0 ? -1 : 1, front = S.cs >= 0, side = Math.abs(S.sn) > 0.03;
  if(!o.plain) pkCast(x, X - w2, X + w2, Y, Math.min(h, wdt*1.6), c);
  // each step of it, the widest first: the side turned toward you (its wall, windows, and the roof's slope over it, from
  // the eaves back to the ridge), its back if it is turned away, then its face laid on its own plane
  let z0 = h*(pr.lift || 0);
  if(z0){ // up on pillars (a granary off the damp and the rats): the four of them, the far ones first
    const pu = D*0.42, pv = w2*0.82, pw = Math.max(px(0.6), wdt*0.035), pm = pkMat(c, PK_STONE, 0.6);
    (o.post ? [[0, 0]] : [[-pu, -pv], [-pu, pv], [pu, -pv], [pu, pv]]).sort((p, q) => S.depth(...q) - S.depth(...p)).forEach(([u, v]) => { const [a0, b0] = S.P(u, v, 0), [, b1] = S.P(u, v, z0);
      pkShade(x, [[a0 - pw, b0], [a0 - pw, b1], [a0 + pw, b1], [a0 + pw, b0]], pm.body, b1, b0, 0.2); }); }
  const glassy = kind === 'greenhouse'; // (its sides and roof glass: the light and the green inside seen through)
  // what stands above the roof (a spire, a belfry, a crown, chimneys) is near enough round: seen from any side, never
  // narrowed to nothing edge-on; it stands on the face's own plane, behind the roof when the building is turned away
  const zTop = eave ? ridge : h*(tiers[tiers.length - 1].z + rim), uTop = D*tiers[tiers.length - 1].a*wdt/w2/2*crownAt;
  // (the face laid on its plane at u = fu, its band from za to zb: in strips, each its own fit of the plane as the eye
  //  sees it, since what is above the eye recedes down and what is below it up; one strip when the eye is far above)
  const faceOn = (fu, za, zb, a, cc) => { const lo = Math.max(za, 0), vary = Math.abs(S.tilt(lo) - S.tilt(zb))*a*Math.abs(S.sn), n = zb > lo ? Math.max(1, Math.min(6, Math.ceil(vary/1.2))) : 1, ox = S.P(fu, 0, 0)[0];
    for(let k = 0; k < n; k++){ const s0 = lo + (zb - lo)*k/n, s1 = lo + (zb - lo)*(k + 1)/n, y0 = S.P(fu, 0, s0)[1], y1 = S.P(fu, 0, s1)[1], kz = s1 > s0 ? (y1 - y0)/(s1 - s0) : -1;
      const c0 = k ? s0 : za, c1 = s1 + (k < n - 1 ? px(0.25) : 0); x.save(); x.translate(ox, y0 - kz*s0); x.transform(S.cs, -S.sn*S.tilt((s0 + s1)/2), 0, -kz, 0, 0);
      x.beginPath(); x.rect(-wdt*3, -c1, wdt*6, c1 - c0); x.clip(); face(x, cc, R0); x.restore(); } };
  const crown = () => { const fx = S.P(uTop, 0, 0)[0], fy = S.P(uTop, 0, zTop)[1] + zTop, sx = (S.cs >= 0 ? 1 : -1)*Math.max(Math.abs(S.cs), 0.55); x.save(); x.translate(fx, fy); x.transform(sx, 0, 0, 1, 0, 0);
    // (upright, and only what stands within the roof's own width: a cornice or a parapet's run belongs to the face)
    const aw = wdt*tiers[tiers.length - 1].a*0.9; x.beginPath(); x.rect(-aw, -h*3, aw*2, h*3 - zTop + px(0.3)); x.clip();
    face(x, { ...c, view: null, vside: sideN === 1 ? -1 : 1, vdep: 1e-6, nocast: true }, R0); x.restore(); };
  if(!front) crown();
  tiers.forEach((T, i) => { const a = T.a*wdt, Dt = D*T.a*wdt/w2, zt = h*T.z, sv = sideN*a, fu = (front ? 1 : -1)*Dt/2, last = i === tiers.length - 1;
    if(glassy) x.globalAlpha = GA*0.6;
    { const ew = o.ends && pr[sideN], ec = ew ? litOf(ew) : c;
      if(side){ wall([[-Dt/2, sv, z0], [Dt/2, sv, z0], [Dt/2, sv, zt], [-Dt/2, sv, zt]], 0, sideN, ec); windows(-Dt/2 + Dt*0.08, sv, Dt/2 - Dt*0.08, sv, z0 + (zt - z0)*0.05, zt*0.97, Rw); }
      if(eave){ const rm = pkMat(c, roofM, 0.8), rb = pkMix(pr.roof ? litOf(pr.roof).body : rm.body, [236, 240, 248], c.snow ? 0.72 : 0), o = wdt*0.04;   // (snow lying on it where it is snowing)
        // both slopes, the far one first: seen nearly end-on, from a little above, the far one shows beside the near
        for(const sg of [-sideN, sideN]){ const up = S.light(0, sg, sd)*0.5 + 0.25, sv2 = sg*a;
          const rc = up > 0 ? pkMix(rb, PK_WHITE, up*0.3) : pkMix(rb, PK_BLACK, -up*0.45), Q = (u, f) => S.P(u, sv2*1.08*(1 - f), Hs - h*0.02 + (ridge - Hs + h*0.02)*f);
          pkPoly(x, [Q(-Dt/2 - o, 0), Q(Dt/2 + o, 0), Q(Dt/2 + o, 1), Q(-Dt/2 - o, 1)], pkCss(rc));
          // (Ruby: "weird giant dark roofs … there should always be more color and texture": a roof is laid in courses of
          //  tile or slate, each a hair lighter at its lower edge, and weathered in patches, a few long strokes of a
          //  warmer or greener colour along the courses, as a painter lays a roof in, never one flat plane)
          if(Math.abs(ridge - Hs) > px(4)){ const n = Math.max(3, Math.min(14, Math.round(Math.abs(ridge - Hs)/px(2.2)))), lw = Math.max(px(0.35), Math.abs(ridge - Hs)/n*0.22);
            x.strokeStyle = pkCss(pkMix(rc, PK_BLACK, 0.35), 0.4); x.lineWidth = lw; x.beginPath();
            for(let k = 1; k < n; k++){ const f = k/n; x.moveTo(...Q(-Dt/2 - o, f)); x.lineTo(...Q(Dt/2 + o, f)); } x.stroke();
            let hs = (v0*1e6 | 0) ^ (sg > 0 ? 0x5bd1 : 0x2c9f); const rr = () => ((hs = (hs*1103515245 + 12345) & 0x7fffffff)/0x7fffffff);
            x.lineCap = 'round'; for(let k = 0; k < 5; k++){ const f = 0.1 + 0.8*rr(), u0 = (rr() - 0.5)*Dt, len = Dt*(0.15 + 0.3*rr()), tint = rr() < 0.5 ? [150, 120, 70] : [96, 120, 70];
              x.strokeStyle = pkCss(pkMix(rc, tint, 0.3), 0.45); x.lineWidth = lw*2.5; x.beginPath(); x.moveTo(...Q(u0, f)); x.lineTo(...Q(Math.min(Dt/2, u0 + len), f + (rr() - 0.5)*0.05)); x.stroke(); }
            x.lineCap = 'butt'; } }
        x.strokeStyle = pkCss(rm.dark, 0.5); x.lineWidth = Math.max(px(0.4), h*0.006); x.beginPath(); x.moveTo(...S.P(-Dt/2 - o, 0, ridge)); x.lineTo(...S.P(Dt/2 + o, 0, ridge)); x.stroke(); }
      else if(S.tilt(zt) > 0){ // a flat top, seen from a little above (never from under it): the roof's own plane
        pkPoly(x, [S.P(-Dt/2, -a, zt), S.P(Dt/2, -a, zt), S.P(Dt/2, a, zt), S.P(-Dt/2, a, zt)], pkCss(pkMix(pkMix(c.body, c.lit, 0.55), PK_CONCRETE, 0.25), glassy ? 0.6 : 1)); }
      if(!eave && o.battlements && last){ // (a castle's battlements: merlons along every top edge toward the eye)
        const run = (ua, va, ub, vb, nu, nv) => { const len = Math.hypot(ub - ua, vb - va), n = Math.max(3, Math.round(len/(wdt*0.09))), mh = h*0.045, col = shadeOf(nu, nv);
          for(let k = 0; k < n; k += 2){ const t0 = k/n, t1 = (k + 1)/n, P0 = [ua + (ub - ua)*t0, va + (vb - va)*t0], P1 = [ua + (ub - ua)*t1, va + (vb - va)*t1];
            pkPoly(x, [S.P(...P0, zt), S.P(...P1, zt), S.P(...P1, zt + mh), S.P(...P0, zt + mh)], pkCss(col)); } };
        run(-Dt/2, -sv, Dt/2, -sv, 0, -sideN); run(-fu, a, -fu, -a, front ? -1 : 1, 0); if(side) run(-Dt/2, sv, Dt/2, sv, 0, sideN); if(!front) run(fu, a, fu, -a, -1, 0); }
      if(!eave && side){ x.strokeStyle = pkCss(pkMix(c.lit, PK_WHITE, 0.2), 0.7); x.lineWidth = Math.max(px(0.4), h*0.006); x.beginPath(); x.moveTo(...S.P(-Dt/2, sv, zt)); x.lineTo(...S.P(Dt/2, sv, zt)); x.stroke(); } }
    if(!front && o.back){ // from behind, a thing with a back of its own (a vending machine's): that, on the back plane
      faceOn(fu, i ? z0 : -h, last ? zTop : zt, a, { ...c, view: null, back: true, vdep: 1e-6, nocast: true }); }
    else if(!front){ // from behind: its back wall and gable, its windows
      if(glassy) x.globalAlpha = GA*0.6; wall([[fu, a, z0], [fu, -a, z0], [fu, -a, zt], [fu, a, zt]], -1, 0); if(eave) pkPoly(x, [S.P(fu, a, Hs), S.P(fu, -a, Hs), S.P(fu, 0, ridge)], pkCss(shadeOf(-1, 0)));
      windows(fu, a*0.85, fu, -a*0.85, z0 + (zt - z0)*0.08, zt*0.95, Rw); x.globalAlpha = GA; }
    else { x.globalAlpha = GA; // the front: the building's own face, this step's band of it, laid on this step's plane (narrowed by the turn,
      // sheared back into depth); the top step keeps all above it (a spire, a crown, a chimney)
      faceOn(fu, i ? z0 : -h, last ? zTop : zt, a, { ...c, view: null, vside: sideN === 1 ? -1 : 1, vdep: 1e-6, nocast: true }); }
    z0 = zt; });
  if(front) crown();
  return true;
}
// THE ROOF'S CLUTTER (Ruby: "minor variations on buildings"; docs/prior-art/ringworld-motion-and-variety.md §7.1): on a
// flat roof from X0 to X1 at top, now and then aerials, a dish, the boxes of its plant; drawn from a stream of its own
// (R), so adding them changed nothing else on the building
const pkRoofThings = (x, X0, X1, top, h, c, R, px) => { const sp = X1 - X0;
  if(R() < 0.45){ const n = 1 + Math.floor(R()*3); x.strokeStyle = pkCss(c.dark, 0.85); x.lineWidth = Math.max(px(0.3), h*0.004); x.beginPath();
    for(let k = 0; k < n; k++){ const ax = X0 + sp*(0.15 + 0.7*R()), ah = h*(0.05 + 0.08*R()); x.moveTo(ax, top); x.lineTo(ax, top - ah); x.moveTo(ax - ah*0.18, top - ah*0.75); x.lineTo(ax + ah*0.18, top - ah*0.75); } x.stroke(); }
  if(R() < 0.35){ const dx = X0 + sp*(0.2 + 0.6*R()), dr = Math.min(sp*0.08, h*0.025); pkEll(x, dx, top - dr*0.9, dr, dr*0.55, pkCss(pkMix(c.lit, PK_WHITE, 0.4))); }
  if(R() < 0.6){ for(let k = 0, n = 2 + Math.floor(R()*3); k < n; k++){ const bx = X0 + sp*(0.1 + 0.8*R()), bw = Math.min(sp*0.12, h*(0.03 + 0.03*R())), bh = bw*(0.5 + 0.4*R());
    x.fillStyle = pkCss(pkMix(c.body, c.lit, 0.4)); x.fillRect(bx - bw/2, top - bh, bw, bh); x.fillStyle = pkCss(c.dark, 0.6); x.fillRect(bx - bw/2, top - bh*0.25, bw, bh*0.25); } } };
export function pkBuilding(x, X, Y, h, wdt, c, style, night, R0, px, kind0){
  PK_SNOW = !!c.snow;
  // (on a slope (c.plinth, its height in pixels): first the stone plinth it stands on, its footprint's own box, from its
  //  floor at Y down into the ground at its lowest corner)
  if(c.plinth > px(0.6)){ const dk = (PK_BOX3[kind0] || [0.8])[0], hv = wdt*0.47, S = pkSpace(X, Y, 1, c.view || { cs: 1, sn: 0 }); pkBox3(x, S, -hv*dk, hv*dk, -hv, hv, -c.plinth, 0, pkMat(c, PK_STONE, 0.65), c.sd); c = { ...c, plinth: 0 }; }
  if(c.view && kind0 === 'pagoda'){ pkPagoda3(x, X, Y, h, wdt, c, night, R0, px); return; }
  if(c.view && kind0 === 'mosque'){ pkMosque3(x, X, Y, h, wdt, { ...c, ...pkMat(c, [226, 214, 196], 0.4) }, night, R0, px); return; }
  if(c.view && PK_ROUND.includes(kind0)) c = { ...c, view: null, turn: c.view }; // (round: the same from every side; turn kept for what isn't, a mill's sails)
  if(c.view && kind0 && PK_BOX3[kind0]){ const [dk, eave, roofM, at, rim] = PK_BOX3[kind0];
    pkTurned(x, X, Y, h, wdt, c, R0, px, night, { kind: kind0, id: 'b|' + kind0 + '|' + style, dk, eave, roofM, at, rim, ends: kind0 === 'row', battlements: kind0 === 'castle', face: (q, cc, R, hh = h, ww = wdt, nt = night) => pkBuilding(q, 0, 0, hh, ww, cc, style, nt, R, px, kind0) }); return; }
  if(c.view && (kind0 === 'torii' || kind0 === 'arch')){ // (a gate is a frame in its own plane: edge on, a post and a beam's end)
    const k = Math.max(kind0 === 'arch' ? 0.28 : 0.1, Math.abs(c.view.cs)); x.save(); x.translate(X, 0); x.scale(k, 1); x.translate(-X, 0); pkBuilding(x, X, Y, h, wdt, { ...c, view: null }, style, night, R0, px, kind0); x.restore(); return; }
  if(c.view){ const sn = c.view.sn; if(sn < 0){ x.save(); x.translate(X, 0); x.scale(-1, 1); x.translate(-X, 0); pkBuilding(x, X, Y, h, wdt, pkFlip({ ...c, view: null }), style, night, R0, px, kind0); x.restore(); return; } c = { ...c, view: null }; }
  const sub = pkSub(R0), R = sub(1), RW = sub(2), RT = sub(3), RN = sub(4), RU = sub(5), RD = sub(6); pkLodNow = c.lod || 1;
  const kind = (k => kind0 || k)(pkArchOf(style, R()));
  // each building its own material (warm stone, brick, concrete, blue glass, dark steel), laid over the world's own
  // colour and fading into the air with distance, so a city is many buildings and not one white block
  { const M = PK_MATS[style] || PK_MATS.city, m = M[Math.floor(R()*M.length)], k = 0.55*(1 - (c.haze || 0));
    if(m) c = { ...c, body: pkMix(c.body, pkMix(m, c.body, 0.3), k), lit: pkMix(c.lit, pkMix(m, PK_WHITE, 0.35), k), dark: pkMix(c.dark, pkMix(m, PK_BLACK, 0.45), k) }; }
  // (hd: its height as its detail reads it, at its true distance: c.lod; a turn of the camera never changes its stage)
  const hd = h*(c.lod || 1), neon = style === 'neon', ruin = style === 'ruins' && hd > px(6), w2 = wdt/2, top = Y - h, dep = wdt*0.32, detail = hd > px(14), fine = hd > px(48), lit = pkMix(c.lit, PK_WHITE, 0.2);
  const ink = pkMix(c.dark, PK_BLACK, 0.35), bar = (x0, y0, w, t, col, a = 1) => { x.fillStyle = pkCss(col, a); x.fillRect(x0, y0, w, Math.max(px(0.4), t)); };
  // (its shadow on the ground first, thrown away from the light)
  if(hd > px(4) && !c.nocast && kind !== 'arch' && kind !== 'torii' && kind !== 'turbine') pkCast(x, X - wdt*0.5, X + wdt*0.5, Y, Math.min(h, wdt*1.6), c);
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
      x.fillStyle = pkCss(pkDm(c, night, pkMix(c.glow, ink, 0.4), ink), 0.9); x.fillRect(X - w2*0.9, lob, wdt*0.9, Y - lob); bar(X - w2, lob - px(0.5), wdt, (Y - lob)*0.12, c.lit, 0.8);
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
    if(detail){ pkWindows(x, X - ww/2, t2, ww, und - t2, c, night, lit, RW, px, neon ? 'neon' : 'ribbon'); pkRoofThings(x, X - ww*0.48, X + ww*0.48, t2, hh, c, sub(21), px); pkBox(x, X + ww*(RT() - 0.5)*0.4, t2, t2 - hh*0.08, ww*0.25, c, dep*0.3);
      if(fine){ x.fillStyle = pkCss(c.dark, 0.18); for(let k = 0; k < 14; k++) x.fillRect(X - ww/2, t2 + (und - t2)*k/14, ww, Math.max(px(0.4), hh*0.002)); pkStreaks(x, X - ww/2, t2, ww, und - t2, c, RD, px, 0.12); } } }
  else if(kind === 'brick'){ // a mid-rise: a grid of windows over shopfronts under awnings, string courses, a cornice on brackets, a
    // fire escape zigzagging down its face, a water tower now and then
    const hh = h*0.7, t2 = Y - hh, sh = Math.min(hh*0.16, wdt*0.35), ww = wdt*1.1; pkBox(x, X, Y, t2, ww, c, dep);
    if(detail){ pkWindows(x, X - ww/2, t2, ww, hh - sh, c, night, lit, RW, px); if(!ruin) pkRoofThings(x, X - ww*0.45, X + ww*0.45, t2 - Math.max(px(0.6), hh*0.02), hh, c, sub(21), px);
      bar(X - ww*0.55, t2 - Math.max(px(0.6), hh*0.02), ww*1.1, Math.max(px(1), hh*0.03), c.dark); // the cornice
      if(fine){ for(let k = 0; k < 18; k++) bar(X - ww*0.53 + ww*1.06*k/18, t2 + hh*0.012, ww*0.02, hh*0.012, c.lit, 0.8); // its dentils
        for(let k = 1; k < 3; k++) bar(X - ww/2, t2 + (hh - sh)*k/3, ww, hh*0.006, c.lit, 0.5); } // string courses
      // the shopfronts: glass, lit at night, under striped awnings
      const ns = 2 + Math.floor(RT()*2), M = [[150, 50, 46], [46, 80, 70], [200, 170, 60], [60, 70, 120]];
      for(let k = 0; k < ns; k++){ const sx = X - ww/2 + ww*(k + 0.1)/ns, sw = ww*0.8/ns, aw = M[Math.floor(RT()*M.length)];
        x.fillStyle = pkCss(pkDm(c, night, pkMix(c.glow, PK_WHITE, 0.25), pkMix(ink, c.air || lit, 0.35)), pkDm(c, night, 0.85, 0.9)); x.fillRect(sx, Y - sh*0.8, sw, sh*0.8);
        const a = pkMat(c, aw, 0.75); pkPoly(x, [[sx - sw*0.04, Y - sh*0.82], [sx - sw*0.04, Y - sh], [sx + sw*1.04, Y - sh], [sx + sw*1.04, Y - sh*0.82], [sx + sw*0.98, Y - sh*0.72], [sx + sw*0.02, Y - sh*0.72]], pkCss(a.body));
        if(fine) for(let q = 0; q < 6; q += 2) x.fillStyle = pkCss(PK_WHITE, 0.4), x.fillRect(sx + sw*q/6, Y - sh, sw/6, sh*0.18); }
      const fe = RT() < 0.55, fe1 = RT(); if(fine && fe){ // a fire escape: landings at each floor, ladders between, in black iron
        const fx = X - ww*(0.1 + 0.25*fe1), fw = ww*0.22, fl = Math.min(8, Math.floor((hh - sh)/(wdt*0.18))); x.strokeStyle = pkCss(PK_IRON, 0.9); x.lineWidth = Math.max(px(0.4), wdt*0.01); x.beginPath();
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
    if(detail){ x.fillStyle = pkCss(pkDm(c, night, c.glow, pkMix(ink, c.air || lit, 0.35)), 0.85); x.fillRect(X - wdt*0.44, st + wdt*0.015, wdt*0.88, Math.max(px(0.5), wdt*0.05)); pkEll(x, X, st - wdt*0.1, wdt*0.18, wdt*0.06, pkCss(c.body)); }
    x.fillStyle = pkCss(c.body); x.fillRect(X - Math.max(px(0.4), wdt*0.02), st - sh*0.2, Math.max(px(0.8), wdt*0.04), sh*0.2);
    pkDisc(x, X, st - sh*0.2, Math.max(px(0.8), wdt*0.035), pkCss([255, 70, 60], pkDm(c, night, 0.95, 0.5)*pkBeacon(c))); if(night > 0.2) pkGlow(x, X, st - sh*0.2, wdt*0.4, [255, 70, 60], 0.5*night*pkBeacon(c)); }
  else if(kind === 'pylon'){ // the builders' white pylon: rounded, its panels seamed, chamfered on the light's side, a line of light up its edge
    const t2 = top + wdt*0.5; pkShade(x, [[X - w2, Y], [X - w2*0.8, t2], [X + w2*0.8, t2], [X + w2, Y]], c.body, top, Y, 0.12);
    x.fillStyle = pkCss(c.body); x.beginPath(); x.arc(X, t2, w2*0.8, Math.PI, 0); x.fill();
    pkPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2*0.8, t2], [X + c.sd*w2*0.3, t2], [X + c.sd*w2*0.4, Y]], pkCss(c.lit));
    if(detail){ x.fillStyle = pkCss(c.dark, 0.35); for(let k = 1; k < 9; k++){ const yy = t2 + (Y - t2)*k/9, kk = 0.8 + 0.2*k/9; x.fillRect(X - w2*kk, yy, wdt*kk, Math.max(px(0.4), h*0.003)); }
      pkShade(x, [[X - w2*1.15, Y], [X - w2*1.15, Y - h*0.04], [X + w2*1.15, Y - h*0.04], [X + w2*1.15, Y]], c.dark, Y - h*0.04, Y); }
    x.fillStyle = pkCss(c.glow, 0.85); x.fillRect(X - c.sd*w2*0.55 - px(0.5), t2, Math.max(px(0.8), wdt*0.05), Y - t2);
    // (in a film a soft bright spot climbs its line of light, once in four to eight seconds of the film, and its crown
    //  breathes)
    if(c.t && c.ft !== undefined){ const per = 4 + 4*(((X*0.0193) % 1) + 1) % 1, u = ((c.ft/per + X*0.011) % 1 + 1) % 1, sy = Y - (Y - t2)*u;
      pkGlow(x, X - c.sd*w2*0.55, sy, Math.max(px(2), wdt*0.3), pkMix(c.glow, PK_WHITE, 0.4), 0.55*Math.sin(Math.PI*u)); }
    pkGlow(x, X, t2 - w2*0.5, wdt*0.9, c.glow, 0.5*pkBreathe(c, X)); }
  else if(kind === 'arch'){ // the builders' arch: two legs and a span, its face seamed into blocks, light beneath it
    const aw = wdt*1.8, th = aw*0.16, ry = Y - h*0.5;
    x.fillStyle = pkCss(c.body); x.beginPath(); x.moveTo(X - aw/2, Y); x.lineTo(X - aw/2, ry); x.arc(X, ry, aw/2, Math.PI, 0); x.lineTo(X + aw/2, Y); x.lineTo(X + aw/2 - th, Y); x.lineTo(X + aw/2 - th, ry); x.arc(X, ry, aw/2 - th, 0, Math.PI, true); x.lineTo(X - aw/2 + th, Y); x.closePath(); x.fill();
    x.strokeStyle = pkCss(c.lit); x.lineWidth = Math.max(px(0.6), th*0.3); x.beginPath(); x.arc(X, ry, aw/2 - th*0.15, c.sd > 0 ? -Math.PI/2 : Math.PI, c.sd > 0 ? 0 : -Math.PI/2); x.stroke();
    if(detail){ x.strokeStyle = pkCss(c.dark, 0.4); x.lineWidth = Math.max(px(0.4), th*0.05); x.beginPath(); for(let k = 1; k < 10; k++){ const a = Math.PI + k/10*Math.PI; x.moveTo(X + Math.cos(a)*(aw/2 - th), ry + Math.sin(a)*(aw/2 - th)); x.lineTo(X + Math.cos(a)*aw/2, ry + Math.sin(a)*aw/2); }
      for(const s of [-1, 1]) for(let k = 1; k < 5; k++){ const yy = ry + (Y - ry)*k/5; x.moveTo(X + s*aw/2, yy); x.lineTo(X + s*(aw/2 - th), yy); } x.stroke(); }
    pkGlow(x, X, Y - h*0.15, aw*0.4, c.glow, 0.35*pkBreathe(c, X)); }
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
    if(detail){ for(let q = 0; q < 5; q++){ const wx = X - dr*0.6 + q*dr*0.3, ww = dr*0.12, wy = base + (Y - base)*0.18, wh = (Y - base)*0.3; x.fillStyle = pkCss(pkDm(c, night, c.glow, ink), 0.8); x.beginPath(); x.moveTo(wx - ww/2, wy + wh); x.lineTo(wx - ww/2, wy); x.arc(wx, wy, ww/2, Math.PI, 0); x.lineTo(wx + ww/2, wy + wh); x.fill(); }
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
      x.fillStyle = pkCss(pkDm(c, night, pkMix(c.glow, ink, 0.3), ink), 0.85); x.fillRect(X - w2*0.92, lob, wdt*0.92, Y - lob); bar(X - w2, lob - px(0.5), wdt, (Y - lob)*0.1, c.lit, 0.8);
      if(fine && !sl){ pkBox(x, X + wdt*(RT() - 0.5)*0.3, top, top - h*0.03, wdt*0.4, { ...c, body: pkMix(c.body, c.dark, 0.3) }, dep*0.3); } }
    if(R() < 0.35){ x.fillStyle = pkCss(c.dark); x.fillRect(X - Math.max(px(0.4), wdt*0.02), top - h*0.14, Math.max(px(0.8), wdt*0.04), h*0.14); if(night > 0.2) pkDisc(x, X, top - h*0.14, Math.max(px(0.8), wdt*0.03), pkCss([255, 80, 70], 0.9*pkBeacon(c))); } }
  // NEON: the edges in light, a sign hung on the face, its glow on the air
  if(neon && hd > px(8) && kind !== 'needle'){ const R = RN; x.strokeStyle = pkCss(c.glow2, 0.85); x.lineWidth = Math.max(px(0.6), wdt*0.03); if(kind === 'glass'){ x.beginPath(); x.moveTo(X - w2, Y); x.lineTo(X - w2, top); x.lineTo(X + w2, top); x.lineTo(X + w2, Y); x.stroke(); }
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
  cities: ['lamp', 'lamp', 'bench', 'hydrant', 'bicycle', 'sign', 'figure', 'figure', 'mailbox', 'busstop', 'phonebox', 'vending', 'signal', 'kiosk', 'cart', 'parked', 'parked', 'scooter', 'pole', 'fountain', 'bandstand'],
  neon: ['lamp', 'sign', 'bicycle', 'crate', 'figure', 'figure', 'vending', 'vending', 'signal', 'cart', 'scooter', 'scooter', 'parked'],
  builders: ['lamp', 'crate', 'bench', 'cargo', 'cargo', 'solar', 'solar', 'dish', 'beacon', 'pipes', 'tripod'],
  ruins: ['barrel', 'barrel', 'crate', 'sign', 'fence', 'rubble', 'rubble', 'column', 'hulk', 'hulk', 'container', 'traps', 'statue', 'pole'],
  magic: ['lamp', 'fence', 'bench', 'menhir', 'menhir', 'dolmen', 'fairyring', 'wisp', 'wisp', 'flower', 'toadstool', 'moongate', 'wishing', 'cairn'] };
// the side-drawn small things seen END-ON: a bike or scooter a thin upright with its bars; a bench's end, seat and back
// in profile
function pkPropEnd(x, X, Y, h, c, kind, R0, px, night, front){
  const R = pkSub(R0)(1), iron = pkMat(c, PK_IRON, 0.7);
  if(kind === 'bicycle' || kind === 'scooter'){ const m = pkMat(c, [[40, 70, 120], [170, 40, 40], [40, 40, 44]][Math.floor(R()*3)], 0.7); x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.05);
    x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.66); x.stroke(); x.strokeStyle = pkCss(m.body); x.lineWidth = Math.max(px(0.5), h*0.06); x.beginPath(); x.moveTo(X, Y - h*0.3); x.lineTo(X, Y - h*0.9); x.stroke();
    x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.04); x.beginPath(); x.moveTo(X - h*0.25, Y - h*0.92); x.lineTo(X + h*0.25, Y - h*0.92); x.stroke(); return; }
  // a bench's end: its iron end in profile, the seat and the back as short bars
  const m = pkMat(c, R() < 0.5 ? PK_WOOD : PK_GREENPAINT, 0.7); x.strokeStyle = pkCss(iron.body); x.lineWidth = Math.max(px(0.5), h*0.07); x.lineCap = 'round';
  x.beginPath(); x.moveTo(X - h*0.2, Y); x.lineTo(X - h*0.1, Y - h*0.5); x.lineTo(X + h*0.2, Y - h*0.5); x.moveTo(X + h*0.18, Y); x.lineTo(X + h*0.1, Y - h*0.5); x.moveTo(X - h*0.1, Y - h*0.5); x.lineTo(X - h*0.2, Y - h); x.stroke();
  pkBar(x, X - h*0.12, Y - h*0.55, h*0.34, h*0.08, m.body, px); pkBar(x, X - h*0.24, Y - h*0.95, h*0.1, h*0.32, m.lit, px);
}
// the kinds large enough to be seen from further off (the caller sows them on a coarser grid)
export const PK_PROPS_BIG = ['lookout', 'bothy', 'bandstand', 'fountain', 'windpump', 'grainbin', 'haystack', 'tractor', 'dish', 'beacon', 'solar', 'container', 'statue', 'dolmen', 'flower', 'toadstool', 'moongate', 'well', 'wishing', 'shrine', 'busstop', 'kiosk', 'menhir', 'column'];
// wires from one pole's top A to the next's B (h the near pole's height): three, sagging, thin as they are
export function pkWires(x, A, B, h, c, px){ const d = Math.hypot(B[0] - A[0], B[1] - A[1]); if(d > h*12 || d < px(2)) return; x.strokeStyle = pkCss(pkMix(c.dark, PK_BLACK, 0.5), 0.6); x.lineWidth = Math.max(px(0.3), h*0.003); x.beginPath();
  for(const s of [-0.08, 0, 0.08]){ x.moveTo(A[0] + s*h, A[1] + h*0.05); x.quadraticCurveTo((A[0] + B[0])/2, Math.max(A[1], B[1]) + d*0.05, B[0] + s*h*0.6, B[1] + h*0.04); } x.stroke(); }
// (the small things seen as the eye sees them: those drawn side-on, a car, a bench, a bike, end-on as they turn to face
//  you or away, half-turned between; boxes narrowed as they turn; the rest mirrored by the side they turn, except
//  what carries writing)
// (a mirrored thing keeps its light where it is: its lit side swapped before it is drawn, so the mirror puts it back)
export const pkFlip = c => ({ ...c, sd: -c.sd, L: c.L ? [-c.L[0], c.L[1]] : c.L });
const PK_SIDE_NATIVE = ['scooter', 'bicycle', 'bench'];
const PK_WRITTEN = ['sign', 'milestone', 'welcome', 'boundary', 'banner'];
// (those with a back of their own, drawn when the camera stands behind them: the plain backs of signs, of the vending machines)
const PK_BACKED = ['sign', 'milestone', 'vending', 'welcome', 'boundary'];
const PK_BOXLIKE = ['vending', 'phonebox', 'busstop', 'container', 'crate', 'cargo', 'mailbox', 'beehives', 'trough', 'shrine'];
// (the boxlike things turned in depth as the buildings are (pkTurned), by their depth as a share of their width: a pair of
// vending machines shallow, a phone box square, a mailbox long, a container a third as deep as it is long)
const PK_PROP3 = { vending: 0.4, phonebox: 1, mailbox: 1.7, container: 0.42, trough: 0.3 };
// ---------------- THINGS IN THREE DIMENSIONS ----------------
// (Ruby: "think about them in three-dimensional space even though they are two-dimensional"): a thing built of solids in
// its own frame (u along it, from its back to its front; v across it; z up), every point carried to the page as the eye
// sees it turned (c.view: cs, sn of the angle between its facing and the way to the eye) and seen a little from above,
// so a hull foreshortens, a body's far legs hide behind it and its near ones stand in front; then painted flat, a face
// lit or shaded by the side it turns to the light. s: pixels per unit of the frame. Seen from a little above, so long
// as the eye is above it: given the eye's height over the thing's foot (view.eyePx, in pixels), what stands at the eye's
// height is seen edge on, and what stands higher is seen from below (a near factory's roof is not seen from a
// streetlamp's height; from a hill, a village's roofs are)
const PK_TILT = 0.26;
const pkSpace = (X, Y, s, view) => { const cs = view ? view.cs : 0, sn = view ? view.sn : 1, eye = view && view.eyePx != null ? view.eyePx/s : null;
  const tilt = z => eye === null ? PK_TILT : eye <= 1e-6 ? -PK_TILT : PK_TILT*Math.max(-1, Math.min(1, (eye - z)/eye));
  return { cs, sn, tilt, P: (u, v, z) => [X + (u*sn + v*cs)*s, Y + (u*cs - v*sn)*s*tilt(z) - z*s], depth: (u, v) => u*cs - v*sn,
    // a face whose outward normal in the frame is (nu, nv): is it toward the eye, and how lit (from -1 shade to 1 light)
    faces: (nu, nv) => nu*cs - nv*sn > 0.02, light: (nu, nv, sd) => Math.max(-1, Math.min(1, (nu*sn + nv*cs)*sd)) }; };
// a box in the frame, from (u0, v0, z0) to (u1, v1, z1): its sides toward the eye, then its top, each in its light
function pkBox3(x, S, u0, u1, v0, v1, z0, z1, m, sd){
  const sides = [[1, 0, [[u1, v0], [u1, v1]]], [-1, 0, [[u0, v1], [u0, v0]]], [0, 1, [[u1, v1], [u0, v1]]], [0, -1, [[u0, v0], [u1, v0]]]];
  for(const [nu, nv, [[ua, va], [ub, vb]]] of sides) if(S.faces(nu, nv)){ const k = S.light(nu, nv, sd), col = k > 0 ? pkMix(m.body, m.lit, k) : pkMix(m.body, m.dark, -k);
    pkPoly(x, [S.P(ua, va, z0), S.P(ub, vb, z0), S.P(ub, vb, z1), S.P(ua, va, z1)], pkCss(col)); }
  pkPoly(x, [S.P(u0, v0, z1), S.P(u1, v0, z1), S.P(u1, v1, z1), S.P(u0, v1, z1)], pkCss(pkMix(m.lit, PK_WHITE, 0.12))); }
// (a vehicle's parts in its own frame, T a pkSpace: a prism of an outline in its length and height, run across its
// width, its faces toward the eye each lit by its side (faceCol(q, nu, nz, s) may colour a face: q the outline's edge,
// -1 a flank); a wheel, a disc in the length and height turned with it, flat if it has gone flat)
function pkPrism(x, T, pr, hw, mat, sd, faceCol){
  const lit = (nu, nv, up) => { const k = T.light(nu, nv, sd)*0.8 + (up || 0); return k > 0 ? pkMix(mat.body, mat.lit, Math.min(1, k)) : pkMix(mat.body, mat.dark, -k); };
  for(let q = 0; q < pr.length; q++){ const [u0, z0] = pr[q], [u1, z1] = pr[(q + 1) % pr.length], nu = z1 - z0, nz = -(u1 - u0), nl = Math.hypot(nu, nz) || 1;
    if(nz/nl < -0.3 || !(nz/nl > 0.3 || T.faces(nu, 0))) continue; const col = (faceCol && faceCol(q, nu/nl, nz/nl)) || lit(nu/nl, 0, nz/nl*0.35);
    pkPoly(x, [T.P(u0, -hw, z0), T.P(u1, -hw, z1), T.P(u1, hw, z1), T.P(u0, hw, z0)], pkCss(col)); }
  for(const s of [-1, 1]) if(T.faces(0, s)) pkPoly(x, pr.map(([u, z]) => T.P(u, s*hw, z)), pkCss((faceCol && faceCol(-1, 0, 0, s)) || lit(0, s))); }
function pkWheel3(x, T, u, v, r, h, px, sd, hub, o = {}){ const [wx, wy] = T.P(u, v, o.flat ? r*0.5 : r), rx = h*(r*Math.abs(T.sn) + (o.tread || 0.08)*Math.abs(T.cs)), ry = h*r*(o.flat ? 0.55 : 1);
  pkEll(x, wx, wy, rx, ry, pkCss(pkMix(PK_IRON, PK_BLACK, 0.45))); if(hub && Math.abs(T.sn) > 0.3 && ry > px(1.5)) pkEll(x, wx + sd*rx*0.06, wy - ry*0.06, rx*(o.hub || 0.45), ry*(o.hub || 0.45), pkCss(hub)); }
// (its wheels in two lots: the far ones, hidden behind it, and those toward the eye, drawn over it)
const pkWheelsSplit = (T, ws) => { const toward = ([u, v]) => T.faces(0, Math.sign(v)) || Math.abs(T.sn) < 0.15 && T.faces(Math.sign(u), 0), s = [...ws].sort((p, q) => T.depth(p[0], p[1]) - T.depth(q[0], q[1]));
  return [s.filter(w => !toward(w)), s.filter(toward)]; };
export const PK_SOLIDS = ['sheep', 'boat', 'parked', 'hulk', 'tractor', 'cart', 'crate', 'shrine', 'cargo'];
// the solid small things: a sheep on four legs, a boat on the water, a parked car, a tractor, a food cart, a crate, a
// wayside shrine, the builders' cargo, each drawn in the round (pkSpace)
function pkSolidProp(x, X, Y, h, c, kind, R0, px, night){
  const sub = pkSub(R0), R = sub(1), sd = c.sd, S = pkSpace(X, Y, h, c.view), near = h > px(10);
  if(kind === 'sheep'){ // a sheep: its fleece a cloud over four thin dark legs, its head down to graze or up to look
    const wool = pkMat(c, R() < 0.12 ? [70, 62, 58] : [222, 214, 196], 0.8), skin = pkMat(c, R() < 0.5 ? [40, 36, 36] : [214, 190, 170], 0.8), L = 0.75, B = 0.32, grazing = R() < 0.6;
    pkEll(x, X - sd*h*0.2, Y, h*(0.45*Math.abs(S.sn) + 0.25), h*0.1, pkCss(PK_BLACK, 0.2));
    const legs = [[L*0.32, B*0.5], [L*0.32, -B*0.5], [-L*0.32, B*0.5], [-L*0.32, -B*0.5]].sort((p, q) => S.depth(...p) - S.depth(...q));
    const leg = ([u, v]) => { const [ax, ay] = S.P(u, v, 0), [bx, by] = S.P(u, v, 0.5); x.strokeStyle = pkCss(skin.dark); x.lineWidth = Math.max(px(0.5), h*0.07); x.lineCap = 'round'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); };
    const headAt = grazing ? [L*0.62, 0, 0.32] : [L*0.62, 0, 0.82], head = () => { const [hx, hy] = S.P(...headAt), [nx, ny] = S.P(L*0.42, 0, 0.66);
      x.strokeStyle = pkCss(wool.body); x.lineWidth = Math.max(px(0.6), h*0.2); x.beginPath(); x.moveTo(nx, ny); x.lineTo(hx, hy); x.stroke();
      pkEll(x, hx, hy, h*(0.1 + 0.06*Math.abs(S.sn)), h*0.11, pkCss(skin.body)); if(near) for(const e of [-1, 1]){ const [ex, ey] = S.P(headAt[0] - 0.04, e*0.1, headAt[2] + 0.06); pkEll(x, ex, ey, h*0.05, h*0.025, pkCss(skin.dark)); } };
    const front = S.depth(L*0.6, 0) > 0;
    for(const p of legs) if(S.depth(...p) < 0) leg(p);
    if(!front) head();
    // (the fleece: a body of small curls, shaded on the side from the light, brightest on top toward it)
    const [cx, cy] = S.P(0, 0, 0.66), rx = h*(L*0.5*Math.abs(S.sn) + B*0.55*Math.abs(S.cs) + 0.14), ry = h*0.3;
    pkEll(x, cx, cy, rx, ry, pkCss(wool.dark)); pkEll(x, cx + sd*rx*0.12, cy - ry*0.12, rx*0.86, ry*0.82, pkCss(wool.body));
    if(near){ for(let q = 0; q < 14; q++){ const a = R()*Math.PI*2, d = Math.sqrt(R()); pkDisc(x, cx + Math.cos(a)*rx*0.8*d, cy + Math.sin(a)*ry*0.75*d, Math.min(rx, ry)*0.22, pkCss(Math.cos(a)*sd > 0.2 ? wool.lit : wool.body, 0.85)); } }
    else pkEll(x, cx + sd*rx*0.3, cy - ry*0.3, rx*0.4, ry*0.4, pkCss(wool.lit));
    for(const p of legs) if(S.depth(...p) >= 0) leg(p);
    if(front) head(); return; }
  if(kind === 'parked' || kind === 'hulk'){ // a parked car (or, in the ruins, its rusted hulk: no glass, flat tyres, rust,
    // sunk): its body and its glasshouse two prisms of its side's outline, each face lit by the side it turns to the sun,
    // its four wheels discs turned with it, its lamps on its ends
    const hulk = kind === 'hulk', m = hulk ? pkMat(c, PK_RUST, 0.7) : pkMat(c, [[180, 40, 40], [40, 60, 110], [210, 210, 214], [30, 32, 36], [120, 130, 100], [200, 170, 70]][Math.floor(R()*6)], 0.7);
    const d = R() < 0.5 ? 1 : -1, T = pkSpace(X, Y + (hulk ? h*0.08 : 0), h, c.view || { cs: 0, sn: d }), steel = pkMat(c, PK_STEEL, 0.7), glass = hulk ? PK_BLACK : pkMix(c.air || m.lit, PK_BLACK, 0.35);
    const body = [[-1.5, 0.15], [1.5, 0.15], [1.5, 0.48], [0.96, 0.56], [-0.9, 0.56], [-1.5, 0.5]], cabin = [[-0.9, 0.55], [0.96, 0.55], [0.6, 0.95], [-0.54, 0.95]];
    const [far, nearW] = pkWheelsSplit(T, [[0.96, 0.62], [-0.96, 0.62], [0.96, -0.62], [-0.96, -0.62]]), wheel = ([u, v]) => pkWheel3(x, T, u, v, 0.24, h, px, sd, hulk ? null : steel.body, { flat: hulk });
    pkEll(x, X - sd*h*0.25, Y, h*(1.5*Math.abs(T.sn) + 0.65*Math.abs(T.cs)), h*0.12, pkCss(PK_BLACK, 0.22));
    far.forEach(wheel); pkPrism(x, T, body, 0.62, m, sd);
    pkPrism(x, T, cabin, 0.54, m, sd, q => q === 2 ? pkMix(m.lit, PK_WHITE, 0.08) : glass); // (its roof, and its glass all round)
    // (the pillars between the windows, the shine on its flank, its rust, its lamps on whichever end you see)
    if(Math.abs(T.sn) > 0.2){ const s = T.faces(0, 1) ? 1 : -1; x.strokeStyle = pkCss(m.body); x.lineWidth = Math.max(px(0.5), h*0.05); x.beginPath(); x.moveTo(...T.P(0.06, s*0.54, 0.56)); x.lineTo(...T.P(0.06, s*0.54, 0.95)); x.stroke();
      if(!hulk){ x.strokeStyle = pkCss(m.lit, 0.7); x.lineWidth = Math.max(px(0.4), h*0.03); x.beginPath(); x.moveTo(...T.P(-1.5, s*0.625, 0.35)); x.lineTo(...T.P(1.5, s*0.625, 0.35)); x.stroke(); }
      else if(h > px(10)) for(let k = 0; k < 5; k++){ const [rx, ry] = T.P((R() - 0.5)*2.4, s*0.625, 0.25 + 0.25*R()); pkEll(x, rx, ry, h*0.15*Math.abs(T.sn), h*0.08, pkCss(pkMix(m.dark, PK_BLACK, 0.2), 0.7)); } }
    for(const e of [1, -1]) if(T.faces(e, 0) && Math.abs(T.cs) > 0.15){ const col = hulk ? PK_BLACK : e > 0 ? (pkDm(c, night, pkMix(c.glow, PK_WHITE, 0.7), [230, 226, 200])) : [200, 40, 40];
      for(const v of [-0.44, 0.44]){ pkPoly(x, [T.P(e*1.5, v - 0.12, 0.36), T.P(e*1.5, v + 0.12, 0.36), T.P(e*1.5, v + 0.12, 0.44), T.P(e*1.5, v - 0.12, 0.44)], pkCss(col));
        if(e > 0 && !hulk && night > 0.2) pkGlow(x, ...T.P(e*1.55, v, 0.4), h*0.6, c.glow, 0.4*night); }
      x.strokeStyle = pkCss(e > 0 ? steel.lit : m.dark); x.lineWidth = Math.max(px(0.5), h*0.06); x.beginPath(); x.moveTo(...T.P(e*1.52, -0.6, 0.22)); x.lineTo(...T.P(e*1.52, 0.6, 0.22)); x.stroke(); }
    nearW.forEach(wheel);
    if(!hulk && night > 0.2 && R() < 0.3) pkGlow(x, ...T.P(1.5, 0, 0.4), h*0.5, [255, 230, 180], 0.4*night); return; }
  if(kind === 'tractor'){ // a tractor: its long bonnet, the cab glazed all round on top of it, the great rear wheels
    // outside its body and the small front ones under it, the exhaust stack
    const m = pkMat(c, [[170, 50, 40], [60, 110, 60], [50, 80, 140], [210, 170, 50]][Math.floor(R()*4)], 0.75), d = R() < 0.5 ? 1 : -1, T = pkSpace(X, Y, h, c.view || { cs: 0, sn: d });
    const steel = pkMat(c, PK_STEEL, 0.7), glass = pkMix(c.air || m.lit, PK_BLACK, 0.3), frame = pkMix(m.dark, PK_BLACK, 0.2);
    const [far, nearW] = pkWheelsSplit(T, [[-0.48, 0.5, 0.32], [-0.48, -0.5, 0.32], [0.61, 0.36, 0.17], [0.61, -0.36, 0.17]]);
    const wheel = ([u, v, r]) => pkWheel3(x, T, u, v, r, h, px, sd, steel.body, { tread: r > 0.2 ? 0.17 : 0.09, hub: 0.5 });
    pkEll(x, X - sd*h*0.2, Y, h*(0.75*Math.abs(T.sn) + 0.6*Math.abs(T.cs)), h*0.1, pkCss(PK_BLACK, 0.22));
    far.forEach(wheel); pkPrism(x, T, [[-0.72, 0.32], [0.77, 0.32], [0.77, 0.55], [0.08, 0.62], [-0.72, 0.62]], 0.28, m, sd);
    pkPrism(x, T, [[-0.72, 0.62], [-0.16, 0.62], [-0.19, 1], [-0.67, 1]], 0.38, m, sd, q => q === 2 ? frame : q === 0 ? null : glass);
    if(Math.abs(T.sn) > 0.25){ const s = T.faces(0, 1) ? 1 : -1; x.strokeStyle = pkCss(frame); x.lineWidth = Math.max(px(0.5), h*0.035); x.beginPath(); // (the cab's frame round its side glass)
      for(const [u0, z0, u1, z1] of [[-0.72, 0.62, -0.67, 1], [-0.16, 0.62, -0.19, 1], [-0.72, 0.64, -0.16, 0.64]]){ x.moveTo(...T.P(u0, s*0.38, z0)); x.lineTo(...T.P(u1, s*0.38, z1)); } x.stroke(); }
    x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.04); x.beginPath(); x.moveTo(...T.P(0.48, 0.12, 0.6)); x.lineTo(...T.P(0.48, 0.12, 0.92)); x.stroke();
    nearW.forEach(wheel); return; }
  if(kind === 'cart'){ // a food cart: a box on two wheels, a pole and its round umbrella, steam, a lantern by night
    const m = pkMat(c, [[200, 60, 50], [230, 220, 200], [60, 120, 160]][Math.floor(R()*3)], 0.7), um = pkMat(c, [[220, 70, 60], [240, 220, 120]][Math.floor(R()*2)], 0.75), steel = pkMat(c, PK_STEEL, 0.7);
    const T = pkSpace(X, Y, h, c.view || { cs: 0, sn: 1 }), [far, nearW] = pkWheelsSplit(T, [[-0.19, 0.27], [0.19, 0.27], [-0.19, -0.27], [0.19, -0.27]]), wheel = ([u, v]) => pkWheel3(x, T, u, v, 0.1, h, px, sd, steel.body, { tread: 0.04 });
    pkEll(x, X - sd*h*0.15, Y, h*(0.4*Math.abs(T.sn) + 0.3*Math.abs(T.cs)), h*0.06, pkCss(PK_BLACK, 0.2));
    far.forEach(wheel); pkPrism(x, T, [[-0.375, 0.12], [0.375, 0.12], [0.375, 0.48], [-0.375, 0.48]], 0.25, m, sd); nearW.forEach(wheel);
    const [bx, by] = T.P(0, 0, 0.48), [tx, ty] = T.P(0, 0, 0.88); x.strokeStyle = pkCss(steel.dark); x.lineWidth = Math.max(px(0.4), h*0.02); x.beginPath(); x.moveTo(bx, by); x.lineTo(tx, ty); x.stroke();
    for(let k = 0; k < 3; k++){ const [sx, sy] = T.P(-0.15 + k*0.04, 0, 0.55 + k*0.08); pkDisc(x, sx, sy, h*(0.05 + k*0.02), pkCss(PK_WHITE, 0.25 - k*0.06)); }
    // (the umbrella: round, so the same dome from any side, its underside shown from a little above)
    x.fillStyle = pkCss(um.dark); x.beginPath(); x.ellipse(tx, ty + h*0.02, h*0.56, h*0.56*PK_TILT*0.6, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = pkCss(um.body); x.beginPath(); x.ellipse(tx, ty + h*0.02, h*0.56, h*0.14, 0, Math.PI, 0); x.fill();
    x.fillStyle = pkCss(um.lit, 0.6); x.beginPath(); x.ellipse(tx + sd*h*0.14, ty - h*0.03, h*0.2, h*0.06, 0, Math.PI, 0); x.fill();
    if(night > 0.2){ const [lx, ly] = T.P(0.34, 0, 0.72); pkDisc(x, lx, ly, h*0.04, pkCss(pkMix(c.glow, PK_WHITE, 0.55))); pkGlow(x, lx, ly, h*0.4, c.glow, 0.45*night); } return; }
  if(kind === 'crate'){ // wooden crates: cubes of planks, battened and braced corner to corner on each face, one stacked
    // on another now and then, turned a little each on the other
    const wood = pkMat(c, PK_WOOD, 0.7), n = R() < 0.4 ? 2 : 1, base = R()*0.5;
    for(let q = 0; q < n; q++){ const tw = q ? (R() - 0.5)*0.5 : 0, vw = c.view || { cs: Math.cos(0.6), sn: Math.sin(0.6) }, ca = Math.cos(base + tw), sa = Math.sin(base + tw);
      const T = pkSpace(X + (q ? h*0.12 : 0), Y - q*h, h, { cs: vw.cs*ca - vw.sn*sa, sn: vw.sn*ca + vw.cs*sa }), s = 0.55;
      if(!q) pkEll(x, X - sd*h*0.2, Y, h*0.8, h*0.1, pkCss(PK_BLACK, 0.2));
      pkBox3(x, T, -s, s, -s, s, 0, 1, wood, sd);
      if(near) for(const [nu, nv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if(T.faces(nu, nv)){ // (its planks, the brace across)
        const at = (t, z) => nu ? T.P(nu*s, (t*2 - 1)*s*nu, z) : T.P((1 - t*2)*s*nv, nv*s, z); x.strokeStyle = pkCss(wood.dark, 0.55); x.lineWidth = Math.max(px(0.3), h*0.015); x.beginPath();
        for(let k = 1; k < 4; k++){ x.moveTo(...at(0, k/4)); x.lineTo(...at(1, k/4)); } x.stroke(); x.strokeStyle = pkCss(wood.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.beginPath(); x.moveTo(...at(0.05, 0.06)); x.lineTo(...at(0.95, 0.94)); x.stroke(); } }
    return; }
  if(kind === 'shrine'){ // a wayside shrine: a square pillar, a box with its dark niche on the face toward the road, a little
    // hipped roof, a finial; flowers at its foot
    const m = pkMat(c, [226, 220, 206], 0.6), T = pkSpace(X, Y, h, c.view || { cs: 1, sn: 0 }), roof = pkMat(c, PK_TERRA, 0.7), lamp = pkDm(c, night, pkMix(c.glow, PK_WHITE, 0.55), [200, 160, 80]);
    const flowers = Array.from({ length: 6 }, (_, k) => [(R() - 0.5)*0.4, (R() - 0.5)*0.4, k]).sort((p, q) => T.depth(p[0], p[1]) - T.depth(q[0], q[1]));
    const flower = ([u, v, k]) => pkDisc(x, ...T.P(u, v, 0.02), Math.max(px(0.4), h*0.02), pkCss(pkMat(c, [[220, 80, 90], [240, 220, 120], [240, 240, 230]][k % 3], 0.8).body));
    flowers.filter(f => T.depth(f[0], f[1]) < 0).forEach(flower);
    pkBox3(x, T, -0.08, 0.08, -0.08, 0.08, 0, 0.6, m, sd); pkBox3(x, T, -0.14, 0.14, -0.14, 0.14, 0.6, 0.86, m, sd);
    if(T.faces(1, 0)){ pkPoly(x, [[0.08, 0.64], [-0.08, 0.64], [-0.08, 0.78], [0, 0.83], [0.08, 0.78]].map(([v, z]) => T.P(0.141, v, z)), pkCss(PK_BLACK, 0.75)); pkDisc(x, ...T.P(0.142, 0, 0.7), h*0.02, pkCss(lamp)); }
    else if(night > 0.2) pkGlow(x, ...T.P(0.14, 0, 0.7), h*0.2, c.glow, 0.2*night);
    // (the roof's four slopes, the far ones first, each lit by its side)
    [[1, 0], [-1, 0], [0, 1], [0, -1]].sort((p, q) => T.depth(...p) - T.depth(...q)).forEach(([nu, nv]) => { const e = 0.2, a = nu ? [nu*e, -e] : [-e, nv*e], b = nu ? [nu*e, e] : [e, nv*e], k = T.light(nu, nv, sd)*0.6 + 0.2;
      pkPoly(x, [T.P(a[0], a[1], 0.86), T.P(b[0], b[1], 0.86), T.P(0, 0, 0.98)], pkCss(k > 0 ? pkMix(roof.body, roof.lit, k) : pkMix(roof.body, roof.dark, -k))); });
    const [fx, fy] = T.P(0, 0, 0.98), [gx, gy] = T.P(0, 0, 1); x.strokeStyle = pkCss(PK_IRON); x.lineWidth = Math.max(px(0.5), h*0.02); x.beginPath(); x.moveTo(fx, fy); x.lineTo(gx, gy); x.stroke();
    flowers.filter(f => T.depth(f[0], f[1]) >= 0).forEach(flower); return; }
  if(kind === 'cargo'){ // the builders' cargo: chamfered boxes in a row, banded with hazard stripes, a tag glowing on each
    const m = pkMat(c, [210, 212, 216], 0.5), n = 1 + Math.floor(R()*3), T0 = pkSpace(X, Y, h, c.view || { cs: 1, sn: 0 }), tagC = pkMix(c.glow, PK_WHITE, 0.4);
    const boxes = Array.from({ length: n }, (_, k) => (k - (n - 1)/2)*1.26).sort((p, q) => T0.depth(0, p) - T0.depth(0, q));
    for(const vo of boxes){ const T = pkSpace(...T0.P(0, vo, 0), h, c.view || { cs: 1, sn: 0 }), e = T.faces(1, 0) ? 1 : T.faces(-1, 0) ? -1 : 0;
      pkPrism(x, T, [[-0.5, 0], [0.5, 0], [0.5, 0.85], [0.42, 1], [-0.42, 1], [-0.5, 0.85]], 0.6, m, sd);
      if(e && near) for(let q = 0; q < 8; q++){ const v0 = -0.6 + 1.2*q/8, v1 = -0.6 + 1.2*(q + 0.5)/8, cl = v => Math.max(-0.6, Math.min(0.6, v));
        pkPoly(x, [T.P(e*0.501, cl(v0), 0.12), T.P(e*0.501, cl(v1), 0.12), T.P(e*0.501, cl(v1 - 0.09), 0.22), T.P(e*0.501, cl(v0 - 0.09), 0.22)], pkCss(q % 2 ? [40, 40, 40] : [230, 180, 40])); }
      const [tx, ty] = T.P(e ? e*0.5 : 0.5, 0.3, 0.6); if(e){ pkDisc(x, tx, ty, h*0.04, pkCss(tagC)); } pkGlow(x, tx, ty, h*0.2, c.glow, e ? 0.4 : 0.2); }
    return; }
  // a boat moored on the water: a hull of planks (a rowing boat, a fishing boat with its wheelhouse, or a small sailing
  // boat with its mast and furled sail), its gunwale an outline foreshortened as it turns, the inside of the hull showing
  // when seen from above, its reflection broken in the water below it
  const type = R() < 0.45 ? 'row' : R() < 0.55 ? 'sail' : 'fish', L = type === 'row' ? 1.6 : 2.6, B = type === 'row' ? 0.55 : 0.8, H = 0.32;
  const paint = pkMat(c, [[226, 222, 208], [60, 96, 132], [170, 60, 48], [70, 110, 80], [214, 180, 70]][Math.floor(R()*5)], 0.75), wood = pkMat(c, PK_WOOD, 0.75);
  const rim = n => { const pts = []; for(let q = 0; q <= n; q++){ const t = q/n*Math.PI*2, cu = Math.cos(t), sv = Math.sin(t); pts.push([cu*L/2*(cu > 0 ? 1 : 0.85), sv*B/2*(cu > 0 ? Math.sqrt(1 - cu*0.8) : 1)]); } return pts; };
  const top = rim(24), keel = top.map(([u, v]) => [u*0.86, v*0.55]);
  // (the reflection first, darker and broken by ripples)
  for(let q = 0; q < 4; q++){ const [rx, ry] = S.P(0, 0, -0.12 - q*0.12); x.fillStyle = pkCss(pkMix(paint.dark, c.air || PK_BLACK, 0.5), 0.3 - q*0.06); x.fillRect(rx - h*(L*0.5*Math.abs(S.sn) + B*0.5*Math.abs(S.cs))*(1 - q*0.15), ry, h*(L*Math.abs(S.sn) + B*Math.abs(S.cs))*(1 - q*0.15), Math.max(px(0.5), h*0.05)); }
  // (the hull's planks, face by face, the far ones first)
  const quads = []; for(let q = 0; q < top.length - 1; q++){ const [u0, v0] = top[q], [u1, v1] = top[q + 1], nu = (v1 - v0), nv = -(u1 - u0), nl = Math.hypot(nu, nv) || 1;
    quads.push({ d: S.depth((u0 + u1)/2, (v0 + v1)/2), nu: nu/nl, nv: nv/nl, pts: [S.P(keel[q][0], keel[q][1], 0), S.P(keel[q + 1][0], keel[q + 1][1], 0), S.P(u1, v1, H), S.P(u0, v0, H)] }); }
  quads.sort((p, q) => p.d - q.d);
  for(const f of quads){ const k = S.light(f.nu, f.nv, sd), col = k > 0 ? pkMix(paint.body, paint.lit, k*0.8) : pkMix(paint.body, paint.dark, -k*0.8); pkPoly(x, f.pts, pkCss(col)); }
  // (the inside, seen from above: its floor of boards and its thwarts)
  pkPoly(x, top.map(([u, v]) => S.P(u*0.92, v*0.85, H*0.95)), pkCss(wood.dark));
  if(near){ x.strokeStyle = pkCss(wood.body); x.lineWidth = Math.max(px(0.4), h*0.06); x.beginPath(); for(const u of [-0.3, 0.25]){ const [ax, ay] = S.P(u, -B*0.4, H*0.9), [bx, by] = S.P(u, B*0.4, H*0.9); x.moveTo(ax, ay); x.lineTo(bx, by); } x.stroke(); }
  x.strokeStyle = pkCss(paint.lit); x.lineWidth = Math.max(px(0.4), h*0.04); x.beginPath(); top.forEach(([u, v], q) => { const [px0, py] = S.P(u, v, H); q ? x.lineTo(px0, py) : x.moveTo(px0, py); }); x.stroke();
  if(type === 'fish') pkBox3(x, S, -L*0.3, L*0.05, -B*0.28, B*0.28, H, H + 0.55, pkMat(c, PK_CREAM, 0.7), sd);
  if(type === 'sail'){ const [mx, my] = S.P(L*0.15, 0, H), [tx, ty] = S.P(L*0.15, 0, H + 2.2), [bx, by] = S.P(-L*0.35, 0, H + 0.35);
    x.strokeStyle = pkCss(wood.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.beginPath(); x.moveTo(mx, my); x.lineTo(tx, ty); x.moveTo(mx, my - h*0.35); x.lineTo(bx, by); x.stroke();
    // (its sail furled along the boom, or set, a triangle in the boat's own plane, narrowed as the boat turns end on)
    if(R() < 0.5) pkPoly(x, [[tx, ty + h*0.1], [mx, my - h*0.4], [bx, by - h*0.05]], pkCss(pkMix(pkMat(c, [236, 228, 210], 0.8).body, sd*(S.sn) > 0 ? PK_WHITE : PK_BLACK, 0.12)));
    else { x.strokeStyle = pkCss(pkMat(c, [236, 228, 210], 0.8).body); x.lineWidth = Math.max(px(0.6), h*0.1); x.beginPath(); x.moveTo(mx, my - h*0.38); x.lineTo(bx, by - h*0.05); x.stroke(); } }
  if(night > 0.3 && type !== 'row') pkGlow(x, ...S.P(L*0.1, 0, H + 0.8), h*0.6, c.glow, 0.4*night);
}
// AN ANTENNA DISH, built in the round (Ruby: dishes that "point in sync at the same targets"; then "the satellite dish
// definitely needs depth and the bits need to connect to each other"): a bowl a third of its radius deep (a paraboloid
// of focal ratio 0.4, as most big dishes are), its feed held at the focus on four legs from the rim, its back braced to
// a hub, the hub on an elevation axle between the yoke's two arms, the yoke turning on the pedestal's head. Every piece
// is a point in the dish's own space, turned to its aim (c.view: how its bearing stands to the eye; c.dishEl: its height
// in the sky, radians), seen a little from above, and painted far to near, so each piece meets the next however it is
// turned; each face lit from the sun's way (c.sun3: right, up, toward the eye). Without a view, turned toward the light
function pkDish(x, X, Y, h, c, px){
  const el = c.dishEl ?? 0.9, cs = c.view ? c.view.cs : 0.75, sn = c.view ? c.view.sn : -0.66*c.sd;
  const paint = pkMat(c, [234, 234, 230], 0.55), backing = pkMat(c, [168, 172, 176], 0.6), steel = pkMat(c, PK_STEEL, 0.65);
  const S0 = c.sun3 || [c.sd*0.6, 0.65, 0.4], Sl = Math.hypot(S0[0], S0[1], S0[2]) || 1, S = [S0[0]/Sl, S0[1]/Sl, S0[2]/Sl];
  const tone = (m, k) => k < 0.5 ? pkMix(m.dark, m.body, k*2) : pkMix(m.body, m.lit, Math.min(1, (k - 0.5)*2));
  const lam = N => 0.22 + 0.78*Math.max(0, N[0]*S[0] + N[1]*S[1] + N[2]*S[2]);
  // (the eye a little above: y up and z toward the eye, tipped down by TL, so the turntable shows its top)
  const TL = 0.17, ct = Math.cos(TL), st = Math.sin(TL), P = p => [X + p[0]*h, Y - (p[1]*ct - p[2]*st)*h, p[2]*ct + p[1]*st], faces = N => N[2]*ct + N[1]*st;
  const add = (a, b, k) => [a[0] + b[0]*k, a[1] + b[1]*k, a[2] + b[2]*k], unit = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
  // its frame: n the way it looks, u its axle (level, across its bearing), v up its face
  const n = [Math.cos(el)*sn, Math.sin(el), Math.cos(el)*cs], u = [cs, 0, -sn], v = [n[1]*u[2], n[2]*u[0] - n[0]*u[2], -n[1]*u[0]];
  const Rd = 0.4, dp = Rd*0.3125, A = [0, 0.5, 0], C = add(A, n, 0.07 + dp), F = add(C, n, Rd*0.4875);
  const er = th => add(add([0, 0, 0], u, Math.cos(th)), v, Math.sin(th)), bowl = (rho, th) => add(add(C, er(th), Rd*rho), n, -dp*(1 - rho*rho));
  const inward = (rho, th) => unit(add(n, er(th), -2*dp*rho/Rd));   // (the bowl's inner normal: toward the focus)
  const big = h > px(30), mid = h > px(9), NR = big ? 4 : mid ? 2 : 1, NT = big ? 24 : mid ? 14 : 8, items = [], wmin = Math.max(px(0.4), h*0.004), fn = faces(n);
  // (each piece is painted by its nearness, but a long piece behind a hollow bowl would show through it: so the mount is
  //  always behind the bowl while the bowl faces the eye, and in front while it faces away, and the feed the other way)
  let gb = 0; const MOUNT = fn > 0.15 ? -1 : fn < -0.15 ? 1 : 0, FEED = -MOUNT;
  const line = (a, b, col, wd, bias = 0) => { const p = P(a), q = P(b); items.push([(p[2] + q[2])/2 + bias + gb, () => { x.strokeStyle = col; x.lineWidth = Math.max(wmin, wd*h); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); }]); };
  const rod = (a, b, col, wd, k = 3, bias = 0) => { for(let i = 0; i < k; i++) line(add(a, add(b, a, -1), i/k), add(a, add(b, a, -1), (i + 1)/k), col, wd, bias); };
  // the bowl, ring by ring: its inside where it faces the eye, its painted back where not
  for(let i = 0; i < NR; i++) for(let j = 0; j < NT; j++){ const r0 = i/NR, r1 = (i + 1)/NR, t0 = j/NT*Math.PI*2, t1 = (j + 1)/NT*Math.PI*2, rm = (r0 + r1)/2, tm = (t0 + t1)/2;
    const q = [bowl(r0, t0), bowl(r1, t0), bowl(r1, t1), bowl(r0, t1)].map(P), N = inward(rm, tm), inside = faces(N) >= 0;
    const col = pkCss(inside ? tone(paint, lam(N)*(0.8 + 0.2*rm)) : tone(backing, lam([-N[0], -N[1], -N[2]])*0.92));
    items.push([(q[0][2] + q[1][2] + q[2][2] + q[3][2])/4, () => { x.fillStyle = col; x.strokeStyle = col; x.lineWidth = wmin; x.beginPath(); q.forEach(([a, b], w) => w ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); x.stroke(); }]); }
  // its rim, a lip catching the light; and on its back the ribs and the ring that stiffen it
  const lip = pkCss(tone(paint, 0.85)), rib = pkCss(tone(backing, 0.25));
  for(let j = 0; j < NT; j++) line(bowl(1, j/NT*Math.PI*2), bowl(1, (j + 1)/NT*Math.PI*2), lip, 0.011, 0.002);
  if(mid){ const back = faces(n) < 0.35; if(back){ for(let k = 0; k < 8; k++){ const th = (k + 0.5)/8*Math.PI*2; for(let i = 0; i < 3; i++){ const a = add(bowl(0.12 + i*0.29, th), n, -0.008), b = add(bowl(0.12 + (i + 1)*0.29, th), n, -0.008); if(faces(inward(0.3 + i*0.3, th)) < 0) line(a, b, rib, 0.009); } }
    for(let j = 0; j < NT; j++){ const th = (j + 0.5)/NT*Math.PI*2; if(faces(inward(0.62, th)) < 0) line(add(bowl(0.62, j/NT*Math.PI*2), n, -0.008), add(bowl(0.62, (j + 1)/NT*Math.PI*2), n, -0.008), rib, 0.008); } } }
  gb = FEED;
  // the feed at the focus on its four legs from the rim, its horn's mouth to the bowl
  const legs = pkCss(tone(steel, 0.45)), horn = pkCss(tone(steel, 0.6));
  if(mid) for(let k = 0; k < 4; k++) rod(bowl(1, Math.PI/4 + k*Math.PI/2), F, legs, 0.012, 3, 0.003*Math.sign(faces(n) || 1));
  rod(add(F, n, -0.035), add(F, n, 0.04), horn, 0.07, 1, 0.004*Math.sign(faces(n) || 1));
  if(mid){ const mouth = P(add(F, n, -0.036)); items.push([mouth[2] + 0.005*Math.sign(faces(n) || 1) + gb, () => { if(faces(n) > 0.05) pkDisc(x, mouth[0], mouth[1], Math.max(px(0.4), h*0.03), pkCss(tone(steel, 0.12))); }]); }
  gb = MOUNT;
  // behind it, the hub and four struts out to its back; the hub on the axle, the axle in the yoke's two arms
  const metal = pkCss(tone(steel, 0.55)), dark = pkCss(tone(steel, 0.3)), lightU = lam(u) > lam(u.map(w => -w)) ? 1 : -1;
  rod(A, add(A, n, 0.064), metal, 0.1, 2);
  if(mid && faces(n) < 0.2) for(let k = 0; k < 4; k++) rod(add(A, n, 0.04), add(bowl(0.6, k*Math.PI/2), n, -0.01), dark, 0.014, 2);   // (hidden behind the bowl when it faces the eye)
  rod(add(A, u, -0.19), add(A, u, 0.19), metal, 0.045, 4);
  for(const sgn of [-1, 1]){ const B = add(A, u, sgn*0.17), foot = add([0, 0.31, 0], u, sgn*0.1), col = pkCss(tone(steel, lam(u.map(w => w*sgn))));
    rod(foot, B, col, 0.05, 3); const b = P(add(A, u, sgn*0.2)); items.push([b[2] + gb, () => pkDisc(x, b[0], b[1], Math.max(px(0.5), h*0.034), pkCss(tone(steel, sgn === lightU ? 0.8 : 0.35)))]); }
  rod(add([0, 0.31, 0], u, -0.13), add([0, 0.31, 0], u, 0.13), metal, 0.045, 2);
  // the pedestal and its turntable, lit from the sun's side
  items.push([gb, () => { const b0 = 0.09*h, b1 = 0.064*h, yt = Y - 0.29*ct*h, g = x.createLinearGradient(X - b0, 0, X + b0, 0), L0 = tone(steel, S[0] > 0 ? 0.25 : 0.75), L1 = tone(steel, S[0] > 0 ? 0.75 : 0.25);
    g.addColorStop(0, pkCss(L0)); g.addColorStop(1, pkCss(L1)); x.fillStyle = g; x.beginPath(); x.moveTo(X - b0, Y); x.lineTo(X - b1, yt); x.lineTo(X + b1, yt); x.lineTo(X + b0, Y); x.closePath(); x.fill();
    const tr = 0.12*h, ty = Y - 0.31*ct*h; x.fillStyle = g; x.fillRect(X - tr, ty, tr*2, 0.025*h); pkEll(x, X, ty, tr, Math.max(px(0.3), tr*st), pkCss(tone(steel, 0.7))); }]);
  if(h > px(14)) pkCast(x, X - h*0.32, X + h*0.32, Y, h*0.5, c, 0.16);
  items.sort((a, b) => a[0] - b[0]); x.lineCap = 'round'; for(const [, draw] of items) draw(); x.lineCap = 'butt'; }
export function pkProp(x, X, Y, h, c, kind, R0, px, night = 0){
  if(PK_SOLIDS.includes(kind)){ pkSolidProp(x, X, Y, h, c, kind, R0, px, night); return; }
  if(kind === 'dish'){ pkDish(x, X, Y, h, c, px); return; }
  if(c.view && PK_PROP3[kind]){ const v0 = R0(), R1 = () => v0;
    if(pkTurned(x, X, Y, h, h, c, R1, px, night, { kind, id: 'p|' + kind, dk: PK_PROP3[kind], eave: 0, plain: true, back: PK_BACKED.includes(kind), ends: kind === 'vending', post: kind === 'mailbox',
      face: (q, cc, R, hh = h, ww, nt = night) => pkProp(q, 0, 0, hh, cc, kind, R, px, nt) })) return; R0 = R1; }
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
  if(near && !['wisp', 'fairyring', 'pole', 'beacon', 'flower', 'banner'].includes(kind)) pkCast(x, X - h*0.3, X + h*0.3, Y, h*0.6, c, 0.16);
  switch(kind){
  case 'fence': { // a run of pickets on two rails, painted or bare, a few leaning, one gone
    // (a piece of a run (c.runW, its width on the page): as many pickets as fill it)
    const n0 = 5 + Math.floor(R()*5), sp = h*0.45, n = c.runW ? Math.max(1, Math.round(c.runW/sp)) : n0, x0 = X - n*sp/2, lean = (R() - 0.5)*h*0.1, m = R() < 0.5 ? pkMat(c, [226, 222, 210], 0.6) : grey;
    ln([[x0, Y - h*0.35], [x0 + n*sp, Y - h*0.38 + lean]], pkCss(m.dark), h*0.07); ln([[x0, Y - h*0.75], [x0 + n*sp, Y - h*0.78 + lean]], pkCss(m.dark), h*0.07);
    for(let k = 0; k <= n; k++){ if(R() < 0.07) continue; const p0 = x0 + k*sp, tl = (R() - 0.5)*h*0.08, pw = h*0.05; pkShade(x, [[p0 - pw, Y], [p0 - pw + tl, Y - h*0.9], [p0 + tl, Y - h], [p0 + pw + tl, Y - h*0.9], [p0 + pw, Y]], m.body, Y - h, Y, 0.2);
      if(near) pkPoly(x, [[p0 + sd*pw*0.1, Y], [p0 + sd*pw*0.1 + tl, Y - h*0.95], [p0 + sd*pw + tl, Y - h*0.9], [p0 + sd*pw, Y]], pkCss(m.lit, 0.7)); } return; }
  case 'wall': { // a dry stone wall: a low band of fitted stones, its coping set on edge along the top
    const w0 = h*rnd(5, 9), w = c.runW || w0, x0 = X - w/2, top = (u) => Y - h*(0.85 + 0.1*Math.sin(u*5 + R()))*(1 - 0.03*u);
    pkShade(x, [[x0, Y], [x0 + w*0.01, top(0)], ...Array.from({ length: 9 }, (_, k) => [x0 + w*(k + 1)/10, top((k + 1)/10)]), [x0 + w, Y]], stone.body, Y - h, Y, 0.25);
    if(near){ for(let k = 0; k < Math.min(60, w/(h*0.22)*3); k++){ const sx = x0 + w*R(), sy = Y - h*0.75*R(), sw = h*rnd(0.15, 0.3); pkEll(x, sx, sy, sw, sw*0.45, pkCss(R() < 0.5 ? stone.dark : stone.lit, 0.45)); }
      for(let k = 0; k < Math.floor(w/(h*0.14)); k++){ const sx = x0 + k*h*0.14, ty = top(k*h*0.14/w); pkPoly(x, [[sx, ty + h*0.05], [sx + h*0.02, ty - h*0.12], [sx + h*0.12, ty - h*0.1], [sx + h*0.13, ty + h*0.05]], pkCss(k % 2 ? stone.body : stone.lit)); } } return; }
  case 'hedge': { // a hedgerow: a long lumpy band of dark green, now and then a tree grown out of it
    const w0 = h*rnd(4, 8), w = c.runW || w0, g = pkMat(c, [44, 82, 46], 0.8), lobes = []; for(let k = 0, nl = c.runW ? Math.max(2, Math.min(9, Math.round(w/(h*0.7)))) : 9; k < nl; k++){ const u = k/(nl - 1) - 0.5; lobes.push([X + u*w, Y - h*rnd(0.35, 0.55), h*rnd(0.4, 0.6)]); }
    pkPoly(x, [[X - w/2 - h*0.3, Y], [X - w/2 - h*0.3, Y - h*0.4], [X + w/2 + h*0.3, Y - h*0.4], [X + w/2 + h*0.3, Y]], pkCss(g.dark)); pkLobes(x, lobes, { ...c, ...g }, RD, X, Y - h*0.5, w*0.5, px);
    if(R() < (c.runW ? 0.08 : 0.3)) pkTree(x, X + (R() - 0.5)*w*0.6, Y - h*0.2, h*rnd(3, 5), { ...c, ...g, trunk: wood.body }, 'broadleaf', mulberry32((R()*4294967296) >>> 0), px); return; }
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
  case 'sign': { // a road sign on its pole: a direction board in green or blue with white letters, an arrow (from behind, its bare back)
    const m = pkMat(c, R() < 0.5 ? [40, 100, 70] : [40, 70, 130], 0.75), w = h*0.7, bh = h*0.28, by = Y - h; box(X - h*0.02, Y - h, h*0.04, h, steel, 0.2);
    if(c.back){ box(X - w/2, by, w, bh, steel, 0.1); pkBar(x, X - h*0.03, by + bh*0.2, h*0.06, bh*0.6, iron.body, px); return; }
    box(X - w/2, by, w, bh, m, 0.1); x.strokeStyle = pkCss(PK_WHITE, 0.85); x.lineWidth = Math.max(px(0.3), bh*0.05); x.strokeRect(X - w/2 + bh*0.06, by + bh*0.06, w - bh*0.12, bh*0.88);
    const dir = R() < 0.5 ? -1 : 1, txt = ['SPINWARD', 'RIMWARD', 'HUBWARD', 'TOWN 3', 'ARCH VIEW', 'NO EXIT'][Math.floor(R()*6)];
    pkType(x, txt, X + dir*-w*0.08, by + bh*0.68, bh*0.42, w*0.65, pkMix(PK_WHITE, m.body, 0.1), px); ln([[X + dir*w*0.3, by + bh*0.5], [X + dir*w*0.42, by + bh*0.5]], pkCss(PK_WHITE, 0.85), bh*0.1); return; }
  case 'milestone': { const m = pkMat(c, [222, 218, 206], 0.7); pkShade(x, [[X - h*0.22, Y], [X - h*0.22, Y - h*0.75], [X, Y - h], [X + h*0.22, Y - h*0.75], [X + h*0.22, Y]], m.body, Y - h, Y, 0.2);
    if(!c.back) pkType(x, String(1 + Math.floor(R()*99)), X, Y - h*0.45, h*0.28, h*0.4, PK_BLACK, px); return; }
  // BORDERS MARKED (docs/prior-art/ringworld-regions.md §2, §3): where a way crosses from one region into another.
  // c.mark: { rune, rune2 (each side's, cut on the face toward it), ban (a faction: its field, charge, division, rune,
  // tails), say (the name of the region entered) }
  case 'boundary': { // a boundary stone: squat, dressed, its top rounded; on each face the rune of the side it faces
    const m = pkMat(c, [210, 204, 190], 0.7), w = h*0.52, mk = c.mark || {};
    pkShade(x, [[X - w/2, Y], [X - w/2, Y - h*0.78], [X - w*0.32, Y - h*0.96], [X, Y - h], [X + w*0.32, Y - h*0.96], [X + w/2, Y - h*0.78], [X + w/2, Y]], m.body, Y - h, Y, 0.25);
    side(X - w/2, Y - h*0.78, w, h*0.78, w*0.35, m);
    if(near){ const u = c.back ? mk.rune2 : mk.rune; x.strokeStyle = pkCss(m.dark, 0.9); x.lineWidth = Math.max(px(0.5), h*0.05); x.lineCap = 'round'; if(u != null) pkRune(x, X, Y - h*0.52, h*0.2, u);
      if(fine){ x.strokeStyle = pkCss(m.dark, 0.6); x.lineWidth = Math.max(px(0.4), h*0.02); x.beginPath(); x.moveTo(X - w*0.35, Y - h*0.22); x.lineTo(X + w*0.35, Y - h*0.22); x.stroke(); } } return; }
  case 'banner': { // a faction's banner on its pole, hung from a crossbar: its field parted as heraldry parts one, a rune
    // on a plain field; swallow-tailed or square; stirring in the wind
    const ban = (c.mark || {}).ban; if(!ban) return; const pw = Math.max(px(0.5), h*0.022), bw = h*0.26, bh = h*0.42, x0 = X + pw, y0 = Y - h*0.95, fl = c.flap || 0;
    ln([[X, Y], [X, Y - h]], pkCss(wood.dark), pw*1.4); ln([[X - pw, y0], [x0 + bw + pw, y0]], pkCss(wood.body), pw);
    const F = pkMat(c, ban.field, 1), C = pkMat(c, ban.charge, 1), wav = k => Math.sin(fl*2.1 + k*3.2)*bh*0.03;
    const cloth = ban.tails ? [[x0, y0], [x0 + bw, y0], [x0 + bw + wav(1), y0 + bh], [x0 + bw*0.5 + wav(0.5), y0 + bh*0.72], [x0 + wav(0), y0 + bh]] : [[x0, y0], [x0 + bw, y0], [x0 + bw + wav(1), y0 + bh], [x0 + wav(0), y0 + bh]];
    pkPoly(x, cloth, pkCss(F.body)); x.save(); x.beginPath(); cloth.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip();
    const cc = pkCss(C.body), mx = x0 + bw/2, my = y0 + bh/2, rc = (a, b, ww, hh) => { x.fillStyle = cc; x.fillRect(a, b, ww, hh); };
    switch(ban.div){ case 'pale': rc(mx, y0, bw, bh*1.1); break; case 'fess': rc(x0, my, bw*1.1, bh); break;
      case 'bend': pkPoly(x, [[x0, y0], [x0 + bw*0.35, y0], [x0 + bw*1.1, y0 + bh*0.8], [x0 + bw*1.1, y0 + bh*1.1], [x0 + bw*0.75, y0 + bh*1.1], [x0, y0 + bh*0.3]], cc); break;
      case 'chevron': pkPoly(x, [[x0, y0 + bh*0.8], [mx, y0 + bh*0.35], [x0 + bw*1.1, y0 + bh*0.8], [x0 + bw*1.1, y0 + bh*1.05], [mx, y0 + bh*0.6], [x0, y0 + bh*1.05]], cc); break;
      case 'cross': rc(mx - bw*0.11, y0, bw*0.22, bh*1.1); rc(x0, my - bw*0.11, bw*1.1, bw*0.22); break;
      case 'saltire': ln([[x0, y0], [x0 + bw, y0 + bh]], cc, bw*0.22); ln([[x0 + bw, y0], [x0, y0 + bh]], cc, bw*0.22); break;
      case 'quarterly': rc(mx, y0, bw, bh*0.5); rc(x0, my, bw*0.5, bh); break;
      default: if(near){ x.strokeStyle = cc; x.lineWidth = Math.max(px(0.5), bw*0.08); x.lineCap = 'round'; pkRune(x, mx, y0 + bh*0.42, bh*0.22, ban.rune); } }
    pkPoly(x, [[x0, y0], [x0 + bw*0.12, y0], [x0 + bw*0.12 + wav(0), y0 + bh], [x0 + wav(0), y0 + bh]], pkCss(F.dark, 0.25)); x.restore(); return; }
  case 'welcome': { // a sign naming the region entered, on two posts, in its holders' colours (from behind, its bare back)
    // (in the old worlds, of wood: its posts and its back)
    const mk = c.mark || {}, ban = mk.ban, w = h*1.25, bh = h*0.34, by = Y - h, post = ['wilds', 'magic', 'ruins'].includes(c.w) ? wood : steel; for(const s of [-1, 1]) box(X + s*w*0.36 - h*0.02, by, h*0.04, h, post, 0.2);
    if(c.back || !ban){ box(X - w/2, by, w, bh, post, 0.1); return; }
    const F = pkMat(c, ban.field, 1), C = pkMat(c, ban.charge, 1); box(X - w/2, by, w, bh, F, 0.1);
    x.strokeStyle = pkCss(C.body, 0.9); x.lineWidth = Math.max(px(0.3), bh*0.05); x.strokeRect(X - w/2 + bh*0.07, by + bh*0.07, w - bh*0.14, bh*0.86);
    pkType(x, String(mk.say || '').toUpperCase(), X, by + bh*0.66, bh*0.4, w*0.86, C.body, px); return; }
  case 'stonepile': { // the stones cleared off a field, heaped at its edge: a low broad mound of them, 2 to 4 m across and
    // half a metre high, rounded, the top ones
    // catching the light, grass grown up round its foot (docs/prior-art/ringworld-countryside.md)
    const w = h*(4 + 2*R()); pkShade(x, [[X - w/2, Y], [X - w*0.42, Y - h*0.45], [X - w*0.2, Y - h*0.85], [X + w*0.05, Y - h], [X + w*0.3, Y - h*0.75], [X + w*0.48, Y - h*0.3], [X + w/2, Y]], stone.dark, Y - h, Y, 0.25);
    for(let k = 0, n = Math.min(26, 6 + Math.floor(w/px(2))); k < n; k++){ const u = R()*2 - 1, top = 1 - u*u, sy = Y - h*top*(0.15 + 0.8*R()), r = h*(0.11 + 0.12*R())*(1 - 0.3*top);
      pkEll(x, X + u*w*0.44, sy, r*1.25, r*0.8, pkCss(pkMix(stone.dark, stone.body, R()))); pkEll(x, X + u*w*0.44 + sd*r*0.25, sy - r*0.3, r*0.6, r*0.32, pkCss(stone.lit, 0.65)); }
    if(h > px(8)) for(let k = 0; k < 7; k++){ const gx = X + (R() - 0.5)*w*1.05, gh = h*(0.15 + 0.2*R()); x.strokeStyle = pkCss(pkMix([70, 110, 60], stone.dark, 0.3), 0.8); x.lineWidth = Math.max(px(0.4), h*0.02); x.beginPath(); x.moveTo(gx, Y); x.lineTo(gx + (R() - 0.5)*gh*0.5, Y - gh); x.stroke(); }
    return; }
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
  case 'grainbin': { // corrugated grain bins in a row, shallow cone roofs, a ladder up one, the auger
    const n = 1 + Math.floor(R()*3), r = h*0.42; for(let k = 0; k < n; k++){ const bx = X + (k - (n - 1)/2)*r*2.3, wall = Y - h*0.72;
      pkShade(x, [[bx - r, Y], [bx - r, wall], [bx + r, wall], [bx + r, Y]], steel.body, wall, Y, 0.15); pkPoly(x, [[bx + sd*r*0.1, Y], [bx + sd*r*0.1, wall], [bx + sd*r*0.6, wall], [bx + sd*r*0.6, Y]], pkCss(steel.lit, 0.6));
      if(near){ x.fillStyle = pkCss(steel.dark, 0.3); for(let q = 0; q < 12; q++) x.fillRect(bx - r + q*r/6, wall, Math.max(px(0.3), r*0.01), Y - wall); }
      pkPoly(x, [[bx - r*1.05, wall], [bx, Y - h], [bx + r*1.05, wall]], pkCss(steel.dark)); pkPoly(x, [[bx, Y - h], [bx + sd*r*1.05, wall], [bx, wall]], pkCss(steel.body)); box(bx - r*0.1, Y - h*1.03, r*0.2, h*0.04, steel); }
    ln([[X - n*r, Y], [X + n*r*0.6, Y - h*0.95]], pkCss(steel.dark), h*0.03); return; }
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
  case 'solar': { // a solar field: rows of dark blue panels all at one tilt on their legs, a pale grid across them
    const n = 3 + Math.floor(R()*3), pv = pkMat(c, [36, 50, 90], 0.75); for(let k = n - 1; k >= 0; k--){ const ry = Y - k*h*0.45, w = h*5*(1 - k*0.05), x0 = X - w/2 + k*h*0.2;
      ln([[x0 + w*0.1, ry], [x0 + w*0.1, ry - h*0.5]], pkCss(steel.dark), h*0.03); ln([[x0 + w*0.9, ry], [x0 + w*0.9, ry - h*0.5]], pkCss(steel.dark), h*0.03);
      const pts = [[x0, ry - h*0.4], [x0 + h*0.25, ry - h], [x0 + w + h*0.25, ry - h], [x0 + w, ry - h*0.4]]; pkPoly(x, pts, pkCss(pv.body));
      const g = x.createLinearGradient(x0, ry - h, x0 + w, ry - h*0.4); g.addColorStop(0, pkCss(c.air || pv.lit, 0.35)); g.addColorStop(0.5, pkCss(c.air || pv.lit, 0.05)); g.addColorStop(1, pkCss(c.air || pv.lit, 0.25)); pkPoly(x, pts, g);
      if(near){ x.strokeStyle = pkCss(pkMix(pv.lit, PK_WHITE, 0.4), 0.5); x.lineWidth = Math.max(px(0.3), h*0.01); x.beginPath(); for(let q = 1; q < 10; q++){ x.moveTo(x0 + w*q/10, ry - h*0.4); x.lineTo(x0 + w*q/10 + h*0.25, ry - h); } x.moveTo(x0 + h*0.125, ry - h*0.7); x.lineTo(x0 + w + h*0.125, ry - h*0.7); x.stroke(); } } return; }
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
  // ---- THE WILDS' OWN AND THE TOWNS' NEW (Ruby: "expanding the library and spawning logic"; docs/prior-art/
  //      ringworld-motion-and-variety.md §8 item 19) ----
  case 'camp': { // a wild camp: a ridge tent of canvas, its door flap open, guy lines pegged out; a ring of stones with a fire,
    // its glow and its smoke at dusk and by night; a log for a seat
    const can = pkMat(c, [[176, 132, 70], [86, 116, 74], [196, 104, 56], [120, 120, 104]][Math.floor(R()*4)], 0.7), tw = h*1.1, tx = X - sd*h*0.35;
    pkPoly(x, [[tx - tw/2, Y], [tx, Y - h*0.95], [tx + tw/2, Y]], pkCss(can.body)); pkPoly(x, [[tx, Y - h*0.95], [tx + sd*tw/2, Y], [tx + sd*tw*0.15, Y]], pkCss(can.lit, 0.85));
    pkPoly(x, [[tx - tw*0.12, Y], [tx, Y - h*0.55], [tx + tw*0.12, Y]], pkCss(PK_BLACK, 0.7));
    if(near){ ln([[tx, Y - h*0.95], [tx - tw*0.85, Y]], pkCss(can.dark, 0.6), h*0.008); ln([[tx, Y - h*0.95], [tx + tw*0.85, Y]], pkCss(can.dark, 0.6), h*0.008); }
    const fx = X + sd*h*0.55, fr = h*0.16; for(let k = 0; k < 7; k++){ const a = k/7*Math.PI*2; pkEll(x, fx + Math.cos(a)*fr, Y + Math.sin(a)*fr*0.3, fr*0.32, fr*0.2, pkCss(stone.body)); }
    box(fx + sd*h*0.35 - h*0.2, Y - h*0.12, h*0.4, h*0.12, wood, 0.25);
    const fire = pkDk(c, night); if(fire > 0){ pkPoly(x, [[fx - fr*0.5, Y], [fx - fr*0.1, Y - fr*1.4*fire], [fx + fr*0.1, Y - fr*0.8*fire], [fx + fr*0.4, Y - fr*1.6*fire], [fx + fr*0.55, Y]], pkCss([255, 170, 70], 0.9*fire));
      pkGlow(x, fx, Y - fr*0.6, h*0.9, [255, 150, 70], 0.55*fire*pkBreathe(c, X)); }
    if(night > 0.05) pkSmoke(x, fx, Y - fr*1.2, h*1.4, h*0.35, c, 4, 0.25*Math.min(1, night*3)); return; }
  case 'charcoal': { // a charcoal stack in the wood: a low mound of earth and turf over the stacked wood, its vent at the top
    // smoking, and by night a red glow at the vent; a rake leaning on it
    const w = h*1.5, turf = pkMat(c, [72, 64, 50], 0.75), top = Y - h*0.8;
    pkShade(x, [[X - w, Y], [X - w*0.7, Y - h*0.45], [X - w*0.3, top], [X + w*0.3, top], [X + w*0.7, Y - h*0.45], [X + w, Y]], turf.body, top, Y, 0.3);
    pkPoly(x, [[X + sd*w*0.3, top], [X + sd*w*0.7, Y - h*0.45], [X + sd*w, Y], [X + sd*w*0.35, Y]], pkCss(turf.lit, 0.5));
    if(near) for(let k = 0; k < 6; k++){ const u = R()*1.6 - 0.8, v = R(); pkEll(x, X + u*w*0.8, Y - h*(0.1 + 0.6*v)*(1 - Math.abs(u)*0.6), h*0.12, h*0.05, pkCss(pkMat(c, [86, 110, 62], 0.7).body, 0.7)); }
    pkEll(x, X, top + h*0.02, w*0.12, h*0.04, pkCss(PK_BLACK, 0.8)); if(night > 0.2) pkGlow(x, X, top, h*0.5, [255, 90, 40], 0.5*night*pkBreathe(c, X));
    pkSmoke(x, X, top, h*1.6, h*0.45, c, 5, 0.45); if(near) ln([[X - sd*w*0.9, Y], [X - sd*w*0.55, Y - h*0.75]], pkCss(grey.dark), h*0.03); return; }
  case 'hide': { // a raised hunting hide at a wood's edge: four legs braced, a small cabin of boards on top with its slit
    // window and a roof, a ladder up to its door
    const cw = h*0.42, cb = Y - h*0.62, ct = Y - h*0.95;
    for(const s of [-1, 1]) ln([[X + s*cw*0.7, Y], [X + s*cw*0.45, cb]], pkCss(grey.dark), h*0.025);
    if(near){ ln([[X - cw*0.65, Y - h*0.1], [X + cw*0.5, cb + h*0.08]], pkCss(grey.dark, 0.8), h*0.012); ln([[X + cw*0.65, Y - h*0.1], [X - cw*0.5, cb + h*0.08]], pkCss(grey.dark, 0.8), h*0.012); }
    box(X - cw/2, ct, cw, cb - ct, grey, 0.2); pkPoly(x, [[X - cw*0.62, ct + h*0.02], [X, ct - h*0.06], [X + cw*0.62, ct + h*0.02]], pkCss(PK_SLATE));
    x.fillStyle = pkCss(PK_BLACK, 0.8); x.fillRect(X - cw*0.35, ct + (cb - ct)*0.3, cw*0.7, Math.max(px(0.5), (cb - ct)*0.12));
    const lx = X + sd*cw*0.75; ln([[lx, Y], [lx - sd*cw*0.25, cb]], pkCss(wood.dark), h*0.012); ln([[lx + sd*cw*0.15, Y], [lx - sd*cw*0.1, cb]], pkCss(wood.dark), h*0.012);
    if(near) for(let k = 1; k < 6; k++){ const u = k/6; ln([[lx - sd*cw*0.25*u, Y - (Y - cb)*u], [lx + sd*cw*0.15 - sd*cw*0.25*u, Y - (Y - cb)*u]], pkCss(wood.dark), h*0.008); } return; }
  case 'bothy': { // a bothy (a shepherd's or a walker's shelter in the hills): low walls of rough stone, a roof of slate or
    // of turf, one door, one small window, a chimney at its gable end, smoking now and then; its window lit by night
    const w = h*1.25, eave = Y - h*0.55, wall = pkMat(c, R() < 0.5 ? [132, 128, 118] : [156, 146, 128], 0.7), turfRoof = R() < 0.45, roof = turfRoof ? pkMat(c, [92, 112, 66], 0.7) : pkMat(c, PK_SLATE, 0.65);
    pkShade(x, [[X - w/2, Y], [X - w/2, eave], [X + w/2, eave], [X + w/2, Y]], wall.body, eave, Y, 0.2);
    if(near){ x.fillStyle = pkCss(wall.dark, 0.35); for(let k = 0; k < 14; k++){ const sx = X - w/2 + w*R(), sy = Y - (Y - eave)*R(); x.fillRect(sx, sy, w*0.08, Math.max(px(0.4), h*0.03)); } }
    pkPoly(x, [[X - w*0.56, eave], [X - w*0.36, Y - h*0.95], [X + w*0.36, Y - h*0.95], [X + w*0.56, eave]], pkCss(roof.body)); pkPoly(x, [[X - w*0.56, eave], [X - w*0.36, Y - h*0.95], [X - w*0.2, Y - h*0.95], [X - w*0.4, eave]], pkCss(sd > 0 ? roof.dark : roof.lit, 0.6));
    const cx2 = X - sd*w*0.42; box(cx2 - h*0.07, Y - h*1.08, h*0.14, h*0.3, wall, 0.2); if(R() < 0.6) pkSmoke(x, cx2, Y - h*1.1, h*0.9, h*0.3, c, 4, 0.35);
    box(X + sd*w*0.15 - h*0.1, Y - h*0.38, h*0.2, h*0.38, pkMat(c, [[70, 52, 40], [60, 80, 90], [120, 48, 40]][Math.floor(R()*3)], 0.7), 0.15);
    const win = pkLit(c, night, R(), 0.6); x.fillStyle = pkCss(pkMix(pkMix(c.dark, PK_BLACK, 0.4), pkMix(c.glow, PK_WHITE, 0.25), win)); x.fillRect(X - sd*w*0.18 - h*0.06, Y - h*0.38, h*0.12, h*0.1); return; }
  case 'lookout': { // a fire lookout on a summit: a timber tower on four splayed legs, braced crosswise, a stair turning up
    // inside it, a cabin on top glazed all round under a hipped roof, a light in it by night
    const bw = h*0.32, tw = h*0.14, cb = Y - h*0.8, ct = Y - h*0.95;
    x.strokeStyle = pkCss(wood.dark); x.lineWidth = Math.max(px(0.5), h*0.012); x.beginPath(); for(const s of [-1, 1]){ x.moveTo(X + s*bw, Y); x.lineTo(X + s*tw, cb); }
    for(let k = 0; k < 5; k++){ const y0 = Y - (Y - cb)*k/5, y1 = Y - (Y - cb)*(k + 1)/5, w0 = bw - (bw - tw)*k/5, w1 = bw - (bw - tw)*(k + 1)/5; x.moveTo(X - w0, y0); x.lineTo(X + w1, y1); x.moveTo(X + w0, y0); x.lineTo(X - w1, y1); x.moveTo(X - w1, y1); x.lineTo(X + w1, y1); } x.stroke();
    const cw = tw*2.4; box(X - cw/2, ct, cw, cb - ct, wood, 0.15);
    const lit2 = pkLit(c, night, R(), 0.8); x.fillStyle = pkCss(pkMix(pkMix(c.air || c.lit, PK_WHITE, 0.15), pkMix(c.glow, PK_WHITE, 0.3), lit2), 0.9); x.fillRect(X - cw*0.42, ct + (cb - ct)*0.15, cw*0.84, (cb - ct)*0.45);
    if(near){ x.fillStyle = pkCss(wood.dark); for(let k = 1; k < 4; k++) x.fillRect(X - cw*0.42 + cw*0.84*k/4 - px(0.3), ct + (cb - ct)*0.15, Math.max(px(0.5), cw*0.02), (cb - ct)*0.45); }
    pkPoly(x, [[X - cw*0.62, ct], [X - cw*0.1, ct - h*0.06], [X + cw*0.1, ct - h*0.06], [X + cw*0.62, ct]], pkCss(PK_SLATE)); if(lit2 > 0.05) pkGlow(x, X, ct + (cb - ct)*0.4, cw*1.4, c.glow, 0.35*lit2); return; }
  case 'bandstand': { // a bandstand on the green: an octagon on a low plinth, slender iron posts, a roof curving up to its
    // finial, painted (a park's green, white, or a deep red), lit by night
    const w = h*0.7, paint = pkMat(c, [[62, 92, 74], [228, 226, 216], [150, 46, 40]][Math.floor(R()*3)], 0.7), pl = Y - h*0.14, eave = Y - h*0.62;
    pkEll(x, X, Y, w*1.05, h*0.1, pkCss(stone.dark, 0.6)); pkShade(x, [[X - w, Y], [X - w, pl], [X + w, pl], [X + w, Y]], stone.body, pl, Y, 0.2); pkEll(x, X, pl, w, h*0.08, pkCss(stone.lit));
    for(let k = 0; k < 6; k++){ const px0 = X + w*0.92*Math.cos(Math.PI*(k/5)); ln([[px0, pl], [px0, eave]], pkCss(paint.dark), h*0.018); }
    if(near) ln([[X - w*0.92, pl - h*0.12], [X + w*0.92, pl - h*0.12]], pkCss(paint.dark, 0.8), h*0.008);
    pkPoly(x, [[X - w*1.08, eave], [X - w*0.6, eave - h*0.16], [X, Y - h*0.97], [X + w*0.6, eave - h*0.16], [X + w*1.08, eave]], pkCss(paint.body)); pkPoly(x, [[X, Y - h*0.97], [X + sd*w*0.6, eave - h*0.16], [X + sd*w*1.08, eave], [X, eave]], pkCss(paint.lit, 0.6));
    pkBar(x, X - w*1.08, eave, w*2.16, h*0.03, paint.dark, px); ln([[X, Y - h*0.97], [X, Y - h]], pkCss(paint.dark), h*0.012);
    if(night > 0.2) pkGlow(x, X, eave + h*0.1, w*1.2, c.glow, 0.3*pkDk(c, night)); return; }
  case 'fountain': { // a town's fountain: a round stone basin, a column rising from it to a smaller bowl, water falling from
    // the bowl's rim to the basin, a jet above it, the water catching the sky
    const w = h*0.9, rim = Y - h*0.22, water = pkMix(c.air || c.lit, [150, 190, 220], 0.5);
    pkShade(x, [[X - w, Y], [X - w, rim], [X + w, rim], [X + w, Y]], stone.body, rim, Y, 0.2); pkEll(x, X, rim, w, h*0.1, pkCss(stone.lit)); pkEll(x, X, rim + h*0.01, w*0.9, h*0.08, pkCss(water, 0.9));
    box(X - w*0.07, Y - h*0.62, w*0.14, h*0.42, stone, 0.2); pkEll(x, X, Y - h*0.62, w*0.42, h*0.06, pkCss(stone.lit)); pkEll(x, X, Y - h*0.61, w*0.36, h*0.04, pkCss(water, 0.9));
    x.strokeStyle = pkCss(pkMix(water, PK_WHITE, 0.4), 0.55); x.lineWidth = Math.max(px(0.4), h*0.01); x.beginPath();
    for(let k = 0; k < 6; k++){ const u = (k/5)*2 - 1, sx = X + u*w*0.4; x.moveTo(sx, Y - h*0.61); x.quadraticCurveTo(sx + u*w*0.25, Y - h*0.58, sx + u*w*0.3, rim); } x.moveTo(X, Y - h*0.64); x.lineTo(X, Y - h*0.95); x.stroke(); return; }
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
  // a person (pkPerson)
  pkPerson(x, X, Y, h, c, sub(3), px);
}

// PEOPLE OF ALL KINDS (Ruby: "people of all genders and types, humanoid species"; docs/prior-art/ringworld-folk.md): who
// each one is comes from their own stream, the same person from any view: their age (a child, an adult, an elder with a
// stoop and now and then a cane), their build, their skin (ten tones), their hair (short or long, tied up or loose,
// grey with age, dyed in the neon world), a beard on some, a skirt or a dress on some, a hat or a headscarf; their
// clothes of their world (coats in the cities, a bright jacket edged with light in the neon world, cloaks and packs in
// the wilds, robes in the magic world, rags and masks in the ruins, the builders' suits); and in the worlds that have
// them, other folk: elves tall and slender with pointed ears, dwarves short and broad and bearded, fae small and winged
// with a light about them, the builders' androids with lit seams; their skin one of the Monk Skin Tone Scale's ten. No
// face: the eye reads who someone is from their shape. Walking (c.stride, a step's swing), legs apart and together; at night (c.lantern) a lantern held low.
// (the ten tones of the Monk Skin Tone Scale, lightest to deepest)
export const PK_SKINS = [[246, 237, 228], [243, 231, 219], [247, 234, 208], [234, 218, 186], [215, 189, 150], [160, 126, 86], [130, 92, 67], [96, 65, 52], [58, 49, 42], [41, 36, 32]];
export function pkPerson(x, X, Y, h, c, R, px){
  const sd = c.sd, w = c.w || 'cities', u = () => R();
  const folkR = u(), folk = w === 'magic' ? (folkR < 0.3 ? 'elf' : folkR < 0.45 ? 'dwarf' : folkR < 0.55 ? 'fae' : 'human') : w === 'wilds' ? (folkR < 0.1 ? 'elf' : folkR < 0.16 ? 'dwarf' : 'human') : w === 'builders' && folkR < 0.18 ? 'android' : 'human';
  const ageR = u(), age = folk === 'fae' ? 'adult' : ageR < 0.12 ? 'child' : ageR > 0.87 ? 'elder' : 'adult', femme = u() < 0.5, longHair = u() < (femme ? 0.72 : 0.22), skirt = u() < (femme ? 0.45 : 0.06), beard = !femme && age !== 'child' && u() < (folk === 'dwarf' ? 0.95 : 0.3);
  const build = folk === 'dwarf' ? 1.35 : folk === 'elf' ? 0.82 : folk === 'fae' ? 0.75 : 0.85 + 0.4*u(), tall = folk === 'dwarf' ? 0.68 : folk === 'fae' ? 0.42 : folk === 'elf' ? 1.07 : age === 'child' ? 0.6 + 0.12*u() : 1;
  const skin = folk === 'android' ? [214, 220, 228] : PK_SKINS[Math.floor(u()*PK_SKINS.length)], hairC = age === 'elder' ? [206, 204, 200] : w === 'neon' && u() < 0.35 ? [[236, 60, 170], [60, 200, 240], [140, 236, 90]][Math.floor(u()*3)] : [[30, 26, 24], [64, 44, 30], [104, 72, 44], [150, 74, 40], [214, 182, 110]][Math.floor(u()*5)];
  const pal = { cities: [[70, 80, 100], [120, 60, 50], [150, 140, 110], [60, 90, 70], [40, 40, 44], [190, 170, 140], [150, 90, 120]], neon: [[30, 28, 40], [60, 30, 80], [24, 50, 70], [70, 30, 40]], wilds: [[94, 82, 60], [70, 90, 60], [110, 70, 50], [60, 64, 70]],
    magic: [[80, 50, 120], [40, 80, 110], [110, 40, 60], [200, 190, 220], [50, 90, 60]], ruins: [[96, 84, 70], [70, 66, 60], [110, 96, 70], [60, 56, 50]], builders: [[214, 218, 226], [190, 200, 214], [96, 104, 120]] }[w] || [[70, 80, 100]];
  const coat = pkMat(c, pal[Math.floor(u()*pal.length)], 0.75), legs = pkMat(c, pkMix(pal[Math.floor(u()*pal.length)], [40, 40, 44], 0.5), 0.75), sk = pkMat(c, skin, 0.8), hair = pkMat(c, hairC, 0.75);
  const hat = u() < (w === 'wilds' ? 0.4 : w === 'magic' && folk !== 'elf' ? 0.35 : 0.18), scarf = !hat && u() < 0.08, pack = w === 'wilds' && u() < 0.35, cane = age === 'elder' && u() < 0.4, mask = w === 'ruins' && u() < 0.4;
  h *= tall; const hd = h/(age === 'child' ? 5.6 : folk === 'dwarf' ? 5.8 : 7.5), sw = hd*0.62*build, hw = hd*(skirt ? 0.62 : 0.45)*build, stoop = age === 'elder' ? hd*0.25 : 0;
  const st = c.stride !== undefined && c.stride !== null ? c.stride*hd*0.55 : (u() - 0.5)*hd*0.6, waist = Y - h*0.47, shoulder = Y - h*0.82, nX = X + stoop;
  // (fae: wings of light behind, and the light about them)
  if(folk === 'fae'){ const wc = pkMix(c.glow || [200, 240, 255], PK_WHITE, 0.4); for(const s of [-1, 1]){ x.beginPath(); x.ellipse(X + s*hd*0.9, Y - h*0.72, hd*0.9, hd*0.45, s*0.6, 0, Math.PI*2); x.fillStyle = pkCss(wc, 0.4); x.fill(); } pkGlow(x, X, Y - h*0.6, h*0.9, c.glow || [200, 240, 255], 0.3); }
  if(pack){ pkPoly(x, [[nX - sd*sw*0.9, shoulder + hd*0.1], [nX - sd*sw*1.5, shoulder + hd*0.3], [nX - sd*sw*1.45, waist], [nX - sd*sw*0.8, waist]], pkCss(pkMat(c, [110, 84, 56], 0.75).dark)); }
  // legs, or a skirt or a robe
  if(skirt || w === 'magic' && folk !== 'fae' && u() < 0.5){ const hem = Y - h*(skirt ? 0.2 : 0.04); pkShade(x, [[X - hw*1.4, hem], [X - sw*0.75, waist], [X + sw*0.75, waist], [X + hw*1.4, hem]], skirt ? legs.body : coat.body, waist, hem, 0.15);
    if(skirt){ pkPoly(x, [[X - hd*0.3, hem], [X - hd*0.3 - st*0.2, Y], [X - hd*0.15 - st*0.2, Y], [X - hd*0.12, hem]], pkCss(sk.dark)); pkPoly(x, [[X + hd*0.12, hem], [X + hd*0.15 + st, Y], [X + hd*0.3 + st, Y], [X + hd*0.3, hem]], pkCss(sk.dark)); } }
  else pkPoly(x, [[X - hd*0.4*build, Y], [X - hd*0.45*build - st*0.3, waist], [X - hd*0.05, waist], [X, Y - h*0.2], [X + hd*0.05, waist], [X + hd*0.45*build + st*0.3, waist], [X + hd*0.4*build + st, Y], [X + hd*0.12 + st, Y], [X, Y - h*0.3], [X - hd*0.12, Y]], pkCss(legs.body));
  // the body, its lit side, the arms
  pkShade(x, [[X - sw*0.88, waist + hd*0.1], [nX - sw, shoulder + hd*0.1], [nX - sw*0.5, shoulder], [nX + sw*0.5, shoulder], [nX + sw, shoulder + hd*0.1], [X + sw*0.88, waist + hd*0.1]], coat.body, shoulder, waist, 0.2);
  pkPoly(x, [[X + sd*hd*0.05, waist + hd*0.05], [nX + sd*hd*0.08, shoulder + hd*0.2], [nX + sd*sw*0.9, shoulder + hd*0.2], [X + sd*sw*0.8, waist + hd*0.05]], pkCss(coat.lit, 0.5));
  if(w === 'neon' && h > px(10)){ x.strokeStyle = pkCss(pkMix(c.glow || [255, 80, 200], PK_WHITE, 0.3), 0.85); x.lineWidth = Math.max(px(0.4), hd*0.07); x.beginPath(); x.moveTo(nX - sw, shoulder + hd*0.15); x.lineTo(X - sw*0.88, waist + hd*0.1); x.moveTo(nX + sw, shoulder + hd*0.15); x.lineTo(X + sw*0.88, waist + hd*0.1); x.stroke(); }
  if(folk === 'android' && h > px(10)){ x.strokeStyle = pkCss(c.glow || [150, 224, 255], 0.9); x.lineWidth = Math.max(px(0.4), hd*0.05); x.beginPath(); x.moveTo(nX, shoulder); x.lineTo(X, waist); x.stroke(); }
  for(const s of [-1, 1]){ const swing = (c.stride || 0)*hd*0.4*s; pkPoly(x, [[nX + s*sw*0.95, shoulder + hd*0.12], [X + s*sw*1.2 + swing, Y - h*0.55], [X + s*sw*1.05 + swing, Y - h*0.46], [X + s*sw*0.8, Y - h*0.6]], pkCss(s === sd ? coat.body : coat.dark));
    pkDisc(x, X + s*sw*1.12 + swing, Y - h*0.45, Math.max(px(0.4), hd*0.12), pkCss(s === sd ? sk.body : sk.dark)); }
  if(cane){ x.strokeStyle = pkCss(pkMat(c, [90, 66, 44], 0.75).dark); x.lineWidth = Math.max(px(0.4), hd*0.08); x.beginPath(); x.moveTo(X + sd*sw*1.15, Y - h*0.45); x.lineTo(X + sd*sw*1.5, Y); x.stroke(); }
  // the head: hair behind, the face's skin, hair on top, ears for the elves, a beard, a mask, a hat or a scarf
  const hx = nX + stoop*0.4, hy = Y - h + hd*0.5;
  if(longHair) pkPoly(x, [[hx - hd*0.45, hy - hd*0.1], [hx - hd*0.5, hy + hd*(folk === 'elf' ? 1.6 : 1.1)], [hx + hd*0.5, hy + hd*(folk === 'elf' ? 1.6 : 1.1)], [hx + hd*0.45, hy - hd*0.1]], pkCss(hair.dark));
  pkEll(x, hx, hy, hd*0.4, hd*0.5, pkCss(sk.body));
  if(folk === 'elf') for(const s of [-1, 1]) pkPoly(x, [[hx + s*hd*0.35, hy - hd*0.05], [hx + s*hd*0.75, hy - hd*0.45], [hx + s*hd*0.38, hy + hd*0.15]], pkCss(s === sd ? sk.body : sk.dark));
  pkEll(x, hx - sd*hd*0.06, hy - hd*0.12, hd*0.43, hd*0.36, pkCss(hair.body));
  if(beard) pkPoly(x, [[hx - hd*0.36, hy + hd*0.05], [hx - hd*0.3, hy + hd*(folk === 'dwarf' ? 1.1 : 0.55)], [hx + hd*0.3, hy + hd*(folk === 'dwarf' ? 1.1 : 0.55)], [hx + hd*0.36, hy + hd*0.05]], pkCss(hair.body));
  if(mask) pkPoly(x, [[hx - hd*0.38, hy + hd*0.02], [hx - hd*0.3, hy + hd*0.4], [hx + hd*0.3, hy + hd*0.4], [hx + hd*0.38, hy + hd*0.02]], pkCss(pkMat(c, [70, 70, 64], 0.75).dark));
  if(hat){ const hc = pkMix(coat.dark, PK_BLACK, 0.3), pointed = w === 'magic'; pkPoly(x, pointed ? [[hx - hd*0.65, hy - hd*0.25], [hx + hd*0.65, hy - hd*0.25], [hx + hd*0.15, hy - hd*1.5]] : [[hx - hd*0.6, hy - hd*0.25], [hx + hd*0.6, hy - hd*0.25], [hx + hd*0.35, hy - hd*0.4], [hx + hd*0.3, hy - hd*0.75], [hx - hd*0.3, hy - hd*0.75], [hx - hd*0.35, hy - hd*0.4]], pkCss(hc)); }
  else if(scarf) pkPoly(x, [[hx - hd*0.5, hy + hd*0.45], [hx - hd*0.52, hy - hd*0.2], [hx, hy - hd*0.6], [hx + hd*0.52, hy - hd*0.2], [hx + hd*0.5, hy + hd*0.45], [hx + hd*0.3, hy + hd*0.15], [hx - hd*0.3, hy + hd*0.15]], pkCss(pkMat(c, pal[0], 0.75).lit));
  // (out at night (c.lantern, how dark): a lantern held low at the side, its light steady, never flickering)
  if(c.lantern > 0){ const lx = X + sd*hd*0.85, ly = Y - h*0.4, warm = [255, 198, 124]; pkGlow(x, lx, ly, h*0.45, warm, 0.4*c.lantern);
    pkDisc(x, lx, ly, Math.max(px(0.5), hd*0.2), pkCss(pkMix(warm, PK_WHITE, 0.5), 0.6 + 0.4*c.lantern)); }
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
  warden:   { worlds: ['builders', 'ruins'], q: 0.03, loud: false },  slabgate: { worlds: ['builders', 'ruins'], q: 0.003, loud: true },
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
  if(kind === 'slabgate'){ // a keyless gate: a tall slab set into the hill, a slit of light, two leaning buttresses, script on its lintel
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
    x.fillStyle = pkCss(pkDm(c, night, pkMix(glow, PK_WHITE, 0.3), pkMix(c.lit, [150, 200, 220], 0.4)), pkDm(c, night, 0.8, 0.7)); x.fillRect(X - w*0.42, top + h*0.08, w*0.84, h*0.22);
    pkPoly(x, [[X - w*0.6, top + h*0.05], [X - w*0.1, top - h*0.12], [X + w*0.62, top - h*0.3], [X + w*0.55, top - h*0.2], [X - w*0.05, top - h*0.02]], pkCss(pkMix(c.lit, [230, 120, 110], 0.35)));
    const px0 = X + w*0.7; ln([[px0, Y], [px0, Y - h*1.4]], pkCss(c.dark), h*0.05);
    for(let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; ln([[px0, Y - h*1.15], [px0 + Math.cos(a)*h*0.18, Y - h*1.15 + Math.sin(a)*h*0.18]], pkCss(pkMix(glow, PK_WHITE, 0.3)), h*0.02); }
    pkPoly(x, [[px0, Y - h*1.7], [px0 - h*0.06, Y - h*1.45], [px0 + h*0.06, Y - h*1.45]], pkCss(c.lit));
    x.fillStyle = pkCss(pkDm(c, night, glow, [200, 60, 60]), 0.95); x.font = `bold ${Math.max(4, Math.round(h*0.22))}px sans-serif`; x.textAlign = 'center'; x.fillText('EATS', px0, Y - h*0.75);
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
// (the ink a board's words take, kept for the board (its own number, which call, and its colours' lightness, coarsely):
//  reading a pixel back stalls the canvas every time, frame after frame, for the same answer)
const PK_INKS = new Map();
function pkInkKept(key, cands, read){ const k = key + '|' + cands.map(q => Math.round(pkLum(q)/24)).join('.'); let i = PK_INKS.get(k);
  if(i === undefined){ const ink = read(); i = cands.findIndex(q => q === ink); if(PK_INKS.size > 4000) PK_INKS.clear(); PK_INKS.set(k, i); } return cands[Math.max(0, i)]; }
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
  const neon = fmt === 'tube' || fmt === 'vertical', lit = neon ? (pkDm(c, night, 1, 0.25)) : 1;
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
    else if(small){ x.fillStyle = pkCss(BB.art === 'throw' || BB.art === 'loop' ? PP[1] : pkMix(PP[0], PK_BLACK, 0.2)); x.fillRect(ux, uy + uh*0.8, uw, uh*0.2); { const cands = [...PP, [24, 22, 26], [242, 236, 222]]; pkType(x, words[0], ux + uw/2, uy + uh*0.96, uh*0.15, uw*0.9, pkInkKept(sub.b + '|s', cands, () => pkInk(x, ux + uw/2, uy + uh*0.9, cands)), px, { face: face0 }); } }
    else { const ty = BB.art === 'glyphs' ? uy + uh*0.75 : BB.art === 'type' ? uy + uh*0.55 : uy + uh*(zone === 'T' ? 0.24 : 0.3), ts = BB.art === 'type' ? uh*0.32 : BB.art === 'glyphs' ? uh*0.11 : uh*(zone === 'T' ? 0.16 : 0.19);
      const sx = zone === 'L' ? tx + mw*0.3 : zone === 'R' ? tx - mw*0.3 : tx, ink = neon ? col : (cands => pkInkKept(sub.b + '|w', cands, () => pkInk(x, sx, ty - ts*0.35, cands)))([...PP.map(q => pkMix(q, PK_BLACK, 0.12)), [24, 22, 26], [242, 236, 222]]);
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
// the droids built in the round (pkSpace), turned with the camera; the rest the same from every side, or mirrored
export const PK_BOTS3 = ['harvester', 'walker', 'shepherd', 'crawler'];
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
  if(kind === 'crawler'){ // a low tracked tender, an arm folded over it, a lamp at its end; in the round (pkSpace): two
    // tracks with their wheels, the body between, the arm over it in the way it goes
    const S = pkSpace(X, Y, h, c.view || { cs: 0, sn: 1 }), dk = { body: c.dark, lit: pkMix(c.dark, c.body, 0.4), dark: pkMix(c.dark, PK_BLACK, 0.3) }, tracks = [-0.36, 0.36].sort((p, q) => S.depth(0, p) - S.depth(0, q));
    const track = vo => { const T = pkSpace(...S.P(0, vo, 0), h, c.view || { cs: 0, sn: 1 }); pkPrism(x, T, [[-0.7, 0], [0.7, 0], [0.6, 0.35], [-0.6, 0.35]], 0.11, dk, sd);
      if(h > px(10) && T.faces(0, Math.sign(vo)) && Math.abs(S.sn) > 0.25) for(let k = 0; k < 4; k++){ const [wx, wy] = T.P(-0.5 + k/3, Math.sign(vo)*0.111, 0.16), r = h*0.12; pkEll(x, wx, wy, r*Math.abs(S.sn), r, pkCss(pkMix(c.dark, PK_BLACK, 0.3))); pkEll(x, wx, wy, r*0.42*Math.abs(S.sn), r*0.42, pkCss(c.body)); } };
    track(tracks[0]); pkBox3(x, S, -0.42, 0.35, -0.25, 0.25, 0.3, 0.6, c, sd);
    const a0 = S.P(0.28, 0, 0.6), a1 = S.P(0.14, 0, 1.0), a2 = S.P(-0.42, 0, 0.85); x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.08); x.lineCap = 'round';
    x.beginPath(); x.moveTo(...a0); x.lineTo(...a1); x.lineTo(...a2); x.stroke(); dot(...a2, Math.max(px(0.5), h*0.07)); track(tracks[1]); return; }
  if(kind === 'sentry'){ // a turret on three legs: a wedge of a head, a slit of red eye, spikes along its back
    x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.beginPath(); for(const s of [-1, 0, 1]){ x.moveTo(X, Y - h*0.45); x.lineTo(X + s*h*0.35, Y); } x.stroke();
    pkPoly(x, [[X - h*0.45, Y - h*0.5], [X - h*0.2, Y - h*0.95], [X + h*0.5, Y - h*0.7], [X + h*0.25, Y - h*0.45]], pkCss(pkMix(c.dark, c.body, 0.3)));
    pkPoly(x, [[X - h*0.2, Y - h*0.95], [X + h*0.5, Y - h*0.7], [X + h*0.1, Y - h*0.75]], pkCss(c.lit));
    for(let q = 0; q < 3; q++) pkPoly(x, [[X - h*(0.4 - q*0.18), Y - h*(0.56 + q*0.12)], [X - h*(0.5 - q*0.18), Y - h*(0.8 + q*0.12)], [X - h*(0.3 - q*0.18), Y - h*(0.62 + q*0.12)]], pkCss(c.dark));
    x.fillStyle = pkCss(eyeCol, 0.95); x.fillRect(X + h*0.15, Y - h*0.72, h*0.25, Math.max(px(0.6), h*0.04)); pkGlow(x, X + h*0.28, Y - h*0.7, h*0.5, eyeCol, 0.4*glowA);
    if(h > px(12)){ pkDisc(x, X, Y - h*0.45, h*0.07, pkCss(pkMix(c.dark, PK_BLACK, 0.3))); for(const s of [-1, 0, 1]) pkDisc(x, X + s*h*0.35, Y, h*0.04, pkCss(c.dark)); x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.4), h*0.03); x.beginPath(); x.moveTo(X + h*0.4, Y - h*0.62); x.lineTo(X + h*0.62, Y - h*0.58); x.stroke(); }
    return; }
  if(kind === 'walker'){ // four jointed legs, a long low body, a head held forward: it hunts. In the round (pkSpace): its
    // far legs behind its body, its near ones before it, its head turned with it
    const S = pkSpace(X, Y, h, c.view || { cs: 0, sn: 1 }), legs = [[-0.36, 0.15, -1], [-0.12, -0.15, 1], [0.12, 0.15, -1], [0.36, -0.15, 1]].sort((p, q) => S.depth(p[0], p[1]) - S.depth(q[0], q[1]));
    const leg = ([u, v, f]) => { const hip = S.P(u*0.8, v, 0.6), knee = S.P(u + f*0.12, v*1.5, 0.77), foot = S.P(u*1.1, v*1.8, 0); x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.05); x.lineCap = 'round';
      x.beginPath(); x.moveTo(...hip); x.lineTo(...knee); x.lineTo(...foot); x.stroke(); if(h > px(12)) pkDisc(x, ...knee, h*0.035, pkCss(pkMix(c.dark, PK_BLACK, 0.3))); };
    const head = () => { pkBox3(x, S, 0.4, 0.68, -0.08, 0.08, 0.52, 0.66, { body: pkMix(c.dark, c.body, 0.4), lit: c.body, dark: c.dark }, sd); if(S.faces(1, 0) || Math.abs(S.sn) > 0.4) dot(...S.P(0.66, 0, 0.6), Math.max(px(0.5), h*0.035)); };
    const ahead = S.depth(1, 0) > 0; legs.filter(l => S.depth(l[0], l[1]) < 0).forEach(leg); if(!ahead) head();
    pkBox3(x, S, -0.42, 0.42, -0.13, 0.13, 0.5, 0.66, c, sd); if(h > px(12)){ x.strokeStyle = pkCss(c.dark, 0.6); x.lineWidth = Math.max(px(0.3), h*0.008); x.beginPath(); for(const u of [-0.2, 0.05, 0.25]){ const s = S.faces(0, 1) ? 0.131 : -0.131; x.moveTo(...S.P(u, s, 0.66)); x.lineTo(...S.P(u, s, 0.5)); } x.stroke(); }
    legs.filter(l => S.depth(l[0], l[1]) >= 0).forEach(leg); if(ahead) head(); return; }
  if(kind === 'harvester'){ // a harvester droid at work in the corn: a long body on tracks, its reel turning at the front, a chute over the side,
    // a pale eye in its cab; drawn in the round (pkSpace), the reel across the way it goes
    const S = pkSpace(X, Y, h, c.view), body = pkMat({ ...c, mat: c.mat }, [[210, 170, 60], [200, 70, 50], [120, 150, 90]][Math.floor(R()*3)], 0.7), dk = pkMat(c, PK_IRON, 0.8), L = 1.6, B = 0.7;
    const parts = [[() => pkBox3(x, S, -L/2, L/2, -B/2, -B*0.25, 0, 0.3, dk, sd), S.depth(0, -B*0.4)], [() => pkBox3(x, S, -L/2, L/2, B*0.25, B/2, 0, 0.3, dk, sd), S.depth(0, B*0.4)],
      [() => pkBox3(x, S, -L*0.45, L*0.3, -B*0.3, B*0.3, 0.2, 0.7, body, sd), S.depth(-0.05, 0)], [() => pkBox3(x, S, -L*0.1, L*0.22, -B*0.22, B*0.22, 0.7, 1.0, pkMat(c, [180, 200, 210], 0.6), sd), S.depth(0.06, 0)],
      [() => { pkBox3(x, S, L*0.3, L*0.55, -B*0.75, B*0.75, 0.05, 0.35, dk, sd); const [ax, ay] = S.P(L*0.48, -B*0.7, 0.32), [bx, by] = S.P(L*0.48, B*0.7, 0.32); x.strokeStyle = pkCss(body.lit); x.lineWidth = Math.max(px(0.5), h*0.06); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }, S.depth(L*0.45, 0)],
      [() => { const [ax, ay] = S.P(-L*0.2, B*0.3, 0.6), [bx, by] = S.P(-L*0.2, B*0.95, 0.95); x.strokeStyle = pkCss(body.dark); x.lineWidth = Math.max(px(0.5), h*0.08); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }, S.depth(-L*0.2, B*0.6)]];
    parts.sort((p, q) => p[1] - q[1]).forEach(p => p[0]());
    if(S.depth(L*0.1, 0) > -0.2) dot(...S.P(L*0.2, 0, 0.88), Math.max(px(0.5), h*0.05));
    if(night > 0.3){ const [lx, ly] = S.P(L*0.55, 0, 0.3); pkGlow(x, lx, ly, h*0.8, pkMix(c.glow, PK_WHITE, 0.6), 0.35*night); }
    return; }
  if(kind === 'shepherd'){ // a shepherd droid, the flock's: a low four-legged body like a dog's, a round head held high, one
    // ear-aerial, its eye kind. In the round (pkSpace), as the sheep it keeps: far legs, body, near legs, head turned with it
    const S = pkSpace(X, Y, h, c.view || { cs: 0, sn: 1 }), legs = [[-0.32, 0.12], [-0.32, -0.12], [0.3, 0.12], [0.3, -0.12]].sort((p, q) => S.depth(...p) - S.depth(...q));
    const leg = ([u, v]) => { x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.5), h*0.07); x.lineCap = 'round'; x.beginPath(); x.moveTo(...S.P(u, v, 0.55)); x.lineTo(...S.P(u*1.05, v, 0)); x.stroke(); };
    const head = () => { const [nx, ny] = S.P(0.35, 0, 0.5), [hx, hy] = S.P(0.5, 0, 0.95), [ax, ay] = S.P(0.42, 0, 1.4), [tx, ty] = S.P(-0.62, 0, 0.8);
      x.strokeStyle = pkCss(c.body); x.lineWidth = Math.max(px(0.6), h*0.14); x.beginPath(); x.moveTo(nx, ny); x.lineTo(hx, hy + h*0.1); x.stroke();
      pkDisc(x, hx, hy, h*0.2, pkCss(c.body)); pkDisc(x, hx + sd*h*0.05, hy - h*0.05, h*0.12, pkCss(c.lit)); if(S.depth(1, 0) > -0.5) dot(...S.P(0.62, 0, 0.96), Math.max(px(0.5), h*0.05));
      x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.4), h*0.03); x.beginPath(); x.moveTo(hx, hy - h*0.16); x.lineTo(ax, ay); x.stroke(); pkDisc(x, ax, ay, h*0.04, pkCss(eyeCol));
      x.beginPath(); x.moveTo(...S.P(-0.45, 0, 0.5)); x.lineTo(tx, ty); x.stroke(); };
    const ahead = S.depth(1, 0) > 0; legs.filter(l => S.depth(...l) < 0).forEach(leg); if(!ahead) head();
    const [bx, by] = S.P(0, 0, 0.55), rx = h*(0.45*Math.abs(S.sn) + 0.18*Math.abs(S.cs)); pkEll(x, bx, by, rx, h*0.18, pkCss(c.body)); pkEll(x, bx + sd*rx*0.2, by - h*0.06, rx*0.7, h*0.09, pkCss(c.lit));
    legs.filter(l => S.depth(...l) >= 0).forEach(leg); if(ahead) head(); return; }
  if(kind === 'lamplighter'){ // the lamplighter, out at dusk: a tall thin droid on a single wheel, a long pole in its hand with a little flame at its end
    const m = pkMat({ ...c }, [120, 110, 96], 0.6); pkDisc(x, X, Y - h*0.06, h*0.06, pkCss(c.dark));
    pkPoly(x, [[X - h*0.08, Y - h*0.1], [X - h*0.1, Y - h*0.7], [X + h*0.1, Y - h*0.7], [X + h*0.08, Y - h*0.1]], pkCss(m.body)); pkPoly(x, [[X + sd*h*0.01, Y - h*0.12], [X + sd*h*0.02, Y - h*0.68], [X + sd*h*0.1, Y - h*0.68], [X + sd*h*0.08, Y - h*0.12]], pkCss(m.lit));
    pkEll(x, X, Y - h*0.8, h*0.11, h*0.1, pkCss(m.body)); pkPoly(x, [[X - h*0.16, Y - h*0.86], [X, Y - h*0.98], [X + h*0.16, Y - h*0.86]], pkCss(m.dark)); dot(X + h*0.04, Y - h*0.8, Math.max(px(0.4), h*0.03));
    const tx = X + h*0.45, ty = Y - h*1.15; x.strokeStyle = pkCss(PK_WOOD); x.lineWidth = Math.max(px(0.4), h*0.025); x.beginPath(); x.moveTo(X + h*0.08, Y - h*0.5); x.lineTo(tx, ty); x.stroke();
    pkGlow(x, tx, ty, h*(0.15 + 0.3*night), [255, 190, 110], 0.5 + 0.4*night); pkDisc(x, tx, ty - h*0.02, Math.max(px(0.5), h*0.02), pkCss([255, 236, 190])); return; }
  if(kind === 'crab'){ // a beachcomber: a crab-like droid, low and wide on six legs, a basket on its back, sorting the tideline
    const w = h*1.6, by = Y - h*0.45; x.strokeStyle = pkCss(c.dark); x.lineWidth = Math.max(px(0.4), h*0.06); x.lineCap = 'round'; x.beginPath();
    for(const lx of [-0.45, -0.3, -0.15, 0.15, 0.3, 0.45]){ const kx = X + lx*w*1.2; x.moveTo(X + lx*w*0.5, by); x.lineTo(kx, by - h*0.2); x.lineTo(kx + Math.sign(lx)*h*0.1, Y); } x.stroke();
    pkEll(x, X, by, w*0.38, h*0.22, pkCss(c.body)); pkEll(x, X + sd*w*0.08, by - h*0.08, w*0.24, h*0.1, pkCss(c.lit));
    pkPoly(x, [[X - w*0.2, by - h*0.15], [X - w*0.16, by - h*0.55], [X + w*0.12, by - h*0.55], [X + w*0.16, by - h*0.15]], pkCss(pkMat(c, PK_WOOD, 0.7).body));
    for(const e of [-1, 1]){ x.beginPath(); x.moveTo(X + e*w*0.12, by - h*0.1); x.lineTo(X + e*w*0.16, by - h*0.4); x.stroke(); dot(X + e*w*0.16, by - h*0.42, Math.max(px(0.4), h*0.04)); } return; }
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

// THE STONES (Ruby: "rocks of different stones"; docs/prior-art/ringworld-terrain.md): what each is made of and how it
// breaks, so a boulder reads as its stone: granite rounded by weather and speckled, sandstone blocky with its beds laid
// level, basalt in dark columns, limestone pale and pitted, slate in tilted slabs; its colour before the light
export const PK_STONES = { granite: [150, 142, 138], sandstone: [190, 140, 100], basalt: [72, 74, 82], limestone: [198, 192, 174], slate: [98, 106, 118] };
export function pkRock(x, X, Y, r, col, L, R, px, kind = 'granite'){
  // a boulder: an irregular outline, flatter on its underside, its shape its stone's (round, blocky, columnar, slabbed);
  // split into facets (its top catching the light, a lit side, a shadow side, a darker underside), lit from the light's
  // side; near, its stone's own marks, lichen in patches, grass grown up at its foot (docs/prior-art/ringworld-sprites.md)
  const sd = L[0] > 0 ? 1 : -1, n = 8 + Math.floor(R()*4), pts = [], near = px && r > px(12);
  const round = kind === 'granite' || kind === 'limestone', block = kind === 'sandstone', col3 = kind === 'basalt', slab = kind === 'slate';
  const hk = block ? 0.62 : col3 ? 1.05 : slab ? 0.42 : 0.7; let ap = [X + sd*r*0.15 + (R() - 0.5)*r*0.3, Y - r*(block ? 0.55 + 0.1*R() : col3 ? 0.95 + 0.2*R() : slab ? 0.4 + 0.1*R() : 0.6)];
  for(let q = 0; q <= n; q++){ const t = Math.PI + q/n*Math.PI, k = 0.75 + 0.35*R();
    let dx2 = Math.cos(t), dy2 = Math.sin(t);
    if(block){ const m = Math.max(Math.abs(dx2), Math.abs(dy2)*1.4); dx2 /= m; dy2 /= m*1.4; }   // (squared off: a block)
    else if(col3){ dx2 *= 0.62; }
    pts.push([X + dx2*r*k*(round ? 1 : 1 + 0.15*Math.sin(t*3)), Y + dy2*r*(hk - 0.15 + 0.3*R())*k]); }
  const mid = Math.floor(n/2); if(round) ap = [pts[mid][0] + sd*r*0.12, pts[mid][1] + r*0.08];   // (a rounded stone has no peak: its top is its outline's)
  pkEll(x, X - sd*r*0.45, Y + r*0.04, r*1.3, r*0.22, pkCss(pkMix(col, PK_BLACK, 0.6), 0.32));
  const outline = [...pts, [X + r*0.9, Y + r*0.06], [X - r*0.9, Y + r*0.06]]; pkPoly(x, outline, pkCss(pkMix(col, [20, 26, 44], 0.45)));
  const litSide = sd > 0 ? pts.slice(mid) : pts.slice(0, mid + 1);
  pkPoly(x, [[X + sd*r*0.05, Y], ...litSide, ap], pkCss(col));
  pkPoly(x, [ap, pts[mid - 1], pts[mid], pts[mid + 1]], pkCss(pkMix(col, [255, 244, 220], round ? 0.16 : 0.22)));
  const q2 = sd > 0 ? mid + 2 : mid - 2; if(pts[q2]) pkPoly(x, [ap, pts[q2], [X + sd*r*0.5, Y - r*0.2]], pkCss(pkMix(col, [255, 244, 220], 0.1)));
  if(px && r > px(6)){ const dk = pkCss(pkMix(col, PK_BLACK, 0.5), 0.55), lw = Math.max(px(0.4), r*0.02); x.save(); x.beginPath(); outline.forEach(([px2, py2], q) => q ? x.lineTo(px2, py2) : x.moveTo(px2, py2)); x.closePath(); x.clip();
    x.strokeStyle = dk; x.lineWidth = lw; x.beginPath();
    // (its stone's marks: beds, columns' joints, slabs' cleavage; a granite's speckle and a limestone's pits drawn below)
    if(block) for(let k = 1; k < 4; k++){ const yy = Y - r*hk*k/4.2; x.moveTo(X - r*0.85, yy + (R() - 0.5)*r*0.04); x.lineTo(X + r*0.85, yy + (R() - 0.5)*r*0.04); }
    else if(col3) for(let k = -2; k <= 2; k++){ const xx = X + k*r*0.22; x.moveTo(xx, Y); x.lineTo(xx + (R() - 0.5)*r*0.05, Y - r*(0.6 + 0.3*R())); }
    else if(slab) for(let k = 1; k < 4; k++){ const yy = Y - r*0.12*k; x.moveTo(X - r*0.85, yy + r*0.12); x.lineTo(X + r*0.85, yy - r*0.1); }
    else { let cx = ap[0] + (R() - 0.5)*r*0.4, cy = ap[1] + r*0.15; x.moveTo(cx, cy); for(let k = 0; k < 3; k++){ cx += (R() - 0.5)*r*0.3; cy += r*0.15; x.lineTo(cx, cy); } }
    x.stroke();
    if(round && near){ const sp = kind === 'granite' ? [[30, 28, 30], [236, 222, 214]] : [[120, 112, 96], [120, 112, 96]]; for(let k = 0; k < 14; k++){ const a2 = R()*Math.PI*2, rr2 = R()*0.7;
      pkEll(x, X + Math.cos(a2)*r*rr2*0.8, Y - r*0.3 + Math.sin(a2)*r*rr2*0.35, r*(kind === 'granite' ? 0.018 : 0.035), r*(kind === 'granite' ? 0.014 : 0.025), pkCss(pkMix(col, sp[k & 1], 0.45), 0.6)); } }
    x.restore(); }
  if(near){
    for(let k = 0; k < 3; k++){ const lx = X + (R() - 0.5)*r, ly = Y - r*(0.3 + 0.4*R())*hk/0.7, lc = R() < 0.6 ? [180, 186, 140] : [184, 120, 64]; for(let q = 0; q < 6; q++) pkEll(x, lx + (R() - 0.5)*r*0.15, ly + (R() - 0.5)*r*0.08, r*0.03, r*0.02, pkCss(pkMix(col, lc, 0.5), 0.7)); }
    x.fillStyle = pkCss(pkMix(col, [50, 90, 50], 0.7), 0.85); for(let k = 0; k < 9; k++){ const gx = X + (R() - 0.5)*r*1.8, gh = r*(0.06 + 0.1*R()); x.beginPath(); x.moveTo(gx - gh*0.3, Y + r*0.05); x.lineTo(gx + (R() - 0.5)*gh*0.6, Y + r*0.05 - gh); x.lineTo(gx + gh*0.3, Y + r*0.05); x.fill(); } }
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
  pkEll(x, X, Y - r*0.8, r*0.12, r*0.05, pkCss(pkDm(c, night, c.glow, c.dark), 0.9));
  if(night > 0.2) pkGlow(x, X, Y - r*0.4, r*1.6, c.glow, 0.5*night);
}
// a cluster of crystals: prisms of two lights, faceted, their tips aglow
// A RUNE (Ruby: "better rune graffiti"): a letter of a runic hand, as the old futhark is cut, straight strokes only (a
// knife's or a brush's): a stave, and twigs from it (up or down, one side or both, from its top or its middle), now and
// then a bow or a lozenge; the same seed always cuts the same letter. (X, Y) its middle, g half its height
export function pkRune(x, X, Y, g, u){ const k = Math.floor(u*24), w = g*0.55, P = (a, b) => [X + a*w, Y + b*g];
  const seg = (A, B) => { x.moveTo(...P(...A)); x.lineTo(...P(...B)); };
  x.beginPath(); if(k % 6 !== 5) seg([0, -1], [0, 1]);   // the stave (all but the lozenges)
  switch(k % 6){ case 0: seg([0, -1], [1, -0.4]); if(k & 8) seg([0, -0.3], [1, 0.3]); break;                    // twigs up and out, one or two
    case 1: seg([0, -1], [-1, -0.4]); seg([0, -1], [1, -0.4]); break;                                             // twigs both ways from the top
    case 2: seg([0, -1], [0.9, -0.5]); seg([0.9, -0.5], [0, 0]); if(k & 8) seg([0, 0], [0.9, 1]); break;            // a bow (and a leg)
    case 3: seg([-0.9, -0.4], [0.9, 0.4]); if(k & 8) seg([-0.9, 0.4], [0.9, -0.4]); break;                        // a cross-stroke (or two)
    case 4: seg([0, 0], [-0.9, 0.6]); seg([0, 0], [0.9, 0.6]); if(k & 8) seg([0, -1], [0.7, -0.6]); break;         // twigs down from the middle
    default: seg([0, -1], [0.8, 0]); seg([0.8, 0], [0, 1]); seg([0, 1], [-0.8, 0]); seg([-0.8, 0], [0, -1]); if(k & 8){ seg([-0.8, 0], [-1, 0.8]); seg([0.8, 0], [1, 0.8]); } }
  x.stroke(); }
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
