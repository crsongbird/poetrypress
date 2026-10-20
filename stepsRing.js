/**
 * stepsRing.js — THE PAINTED RINGWORLD: a ring seen from its own floor, painted in flat shapes (Ruby: "a generative art
 * piece that still looks like being on a ringworld … the same logic as the 3D generator but 2D"; and of the flat style,
 * "that simplified, but cosmic … keep that in mind").
 *   ringarch  THE ARCH: everything above the land — space, the air, the star and its shadow squares, the ring's far floor
 *             rising into the arch overhead, its rim walls — as flat patches in true perspective
 *   ringland  LAND ON THE RING: the floor you stand on, ridge behind ridge from the walls' feet to your own, with what
 *             grows, lives, stands and lies on it, by its World
 * Both see through the Ringworld's own camera (ringCamera): the Camera Dial is the camera, the Light Dial the day, and
 * one world (the land's heights, its seas, forests and cities, who built it) is shared by both, so the arch overhead
 * and the land at your feet are the same ring.
 */
import { mulberry32, kitCanvas, kitPicture, seedChoice } from './texCore.js';
import { ringParams, ringCamera, ringDay, ringSunDir, mnHash, mnValue, RING_COV, RING_SQR } from './stepsGenerative.js';
import { rsMix, rsCss, rsPoly, rsFace, rsSmooth, paintSaturn, paintEnceladus } from './stepsWhimsy.js';
import { PK_TREES, pkTree, PK_STYLE, pkBuilding, pkRock, pkSpire, pkMonolith, pkStone, pkLintel, pkDome, pkCrystals, pkMetres, pkArchOf, pkVernacularOf, PK_FLORA, PK_BOTS, pkRobot, PK_PROPS, PK_PROPS_BIG, pkProp, pkWires, PK_EGGS, pkEgg, PK_BOARDS, PK_SERIALS, pkBoardOf, pkBoardSize, pkBoard } from './paintKit.js';

const RG_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
// THE WORLDS (Ruby: "sometimes natural, sometimes city, sometimes cyberpunk, sometimes builders, sometimes magical,
// sometimes mixed, sometimes apocalyptic, sometimes destroyed, sometimes populated by [small life], sometimes with
// crashed spaceships"). By the Seed picks one; Mixed lays three side by side, region by region. (The small life was
// once cute little creatures; Ruby: "too cute and childish … insects, fairies, flowers, slime creatures. All subtle.")
export const RG_WORLDS = ['seed', 'wilds', 'cities', 'neon', 'builders', 'magic', 'ruins', 'mixed'];
// what each world raises, as weights (Life and Works scale them):
//   tr trees · de dead trees · gt glowing trees · to towers · sp spires · sa spans (wall to wall) · mo monoliths and
//   standing stones · cr crystals · ci circles · pi pillars of light · do domes · br bridges of light · ca craters, smoke
//   and fire · wr wrecks · sh ships · be small life · ro rocks · gr grass and flowers · cv how much of the land is city
const RG_PROF = {
  wilds:    { tr: 1,    de: 0.05, gt: 0,   to: 0,    sp: 0.05, sa: 0.12, mo: 0.35, cr: 0.12, ci: 0,   pi: 0,    do: 0,    br: 0,   ca: 0,   wr: 0.25, sh: 0.15, be: 1,    ro: 0.8,  gr: 1,    cv: 0 },
  cities:   { tr: 0.45, de: 0,    gt: 0,   to: 1,    sp: 0.2,  sa: 0.25, mo: 0,    cr: 0,    ci: 0,   pi: 0,    do: 0.5,  br: 0.2, ca: 0,   wr: 0.1,  sh: 0.8,  be: 0.3,  ro: 0.15, gr: 0.5,  cv: 1 },
  neon:     { tr: 0.12, de: 0,    gt: 0.15, to: 1,   sp: 0.3,  sa: 0.15, mo: 0,    cr: 0,    ci: 0,   pi: 0.1,  do: 0.2,  br: 0.6, ca: 0,   wr: 0.2,  sh: 1,    be: 0.2,  ro: 0.1,  gr: 0.15, cv: 0.9 },
  builders: { tr: 0.45, de: 0,    gt: 0,   to: 0.2,  sp: 1,    sa: 0.9,  mo: 0.6,  cr: 0.2,  ci: 0,   pi: 0.15, do: 0.3,  br: 0.8, ca: 0,   wr: 0.12, sh: 0.6,  be: 0.3,  ro: 0.25, gr: 0.6,  cv: 0.2 },
  magic:    { tr: 0.5,  de: 0,    gt: 0.7, to: 0.12, sp: 0.5,  sa: 0.6,  mo: 0.35, cr: 1,    ci: 0.8, pi: 0.25, do: 0.1,  br: 0.3, ca: 0,   wr: 0.08, sh: 0.2,  be: 0.9,  ro: 0.3,  gr: 1,    cv: 0.1 },
  ruins:    { tr: 0.15, de: 0.7,  gt: 0,   to: 0.6,  sp: 0.4,  sa: 0.6,  mo: 0.3,  cr: 0.1,  ci: 0,   pi: 0,    do: 0.2,  br: 0,   ca: 1,   wr: 0.9,  sh: 0.2,  be: 0.25, ro: 0.7,  gr: 0.3,  cv: 0.4 },
};
// the ground each world lays (mixed into the Land Hue), and its lights (null: the page's own accents)
const RG_GROUND = { wilds: [[0, 0, 0], 0], cities: [[132, 132, 128], 0.22], neon: [[34, 30, 48], 0.55], builders: [[208, 204, 190], 0.3], magic: [[120, 90, 170], 0.22], ruins: [[118, 96, 78], 0.5] };
const RG_LIGHTS = { wilds: [[226, 255, 170], [255, 214, 150]], cities: [[255, 212, 150], [255, 240, 210]], neon: null, builders: [[150, 224, 255], [210, 244, 255]], magic: null, ruins: [[255, 140, 64], [255, 196, 120]] };

// which world is where: one (By the Seed, or chosen), or three, region by region (Mixed)
// (exported: a test hook, test/chains.test.mjs)
export function rgWorldOf(seed, v){
  const names = RG_WORLDS.slice(1, 7), wt = [1.3, 1, 0.8, 1, 1, 1];
  const pick = (k, not) => { let tot = 0; for(let j = 0; j < 6; j++) if(!not.includes(names[j])) tot += wt[j];
    let r = mnHash(seed | 0, k, 4242)*tot; for(let j = 0; j < 6; j++){ if(not.includes(names[j])) continue; r -= wt[j]; if(r < 0) return names[j]; } return 'wilds'; };
  let i = Math.max(0, Math.min(7, Math.round(v/100*7)));
  if(i === 0) i = mnHash(seed | 0, 9, 4243) < 0.16 ? 7 : 1 + names.indexOf(pick(1, []));
  if(i < 7) return { name: RG_WORLDS[i], list: [RG_WORLDS[i]] };
  const a = pick(2, []), b = pick(3, [a]), c = pick(4, [a, b]);
  return { name: 'mixed', list: [a, b, c] };
}

// THE LAND'S HEIGHT at a point of the floor (along a, across z, in ring units; up is toward the axis): fractal, its
// big octaves ridged (mountains), mountains piled at the walls' feet, flatter where cities stand, terraced by the
// builders. One function for the arch, the ridges and the works, so they agree.
function rgTerrain(W, Hw, seed, forms, world){
  const s = seed | 0, flat = world.list.includes('cities') || world.list.includes('neon') ? 0.55 : 1, terrace = world.list.includes('builders') ? W*0.004 : 0;
  const sea = -W*0.004*(0.4 + 1.6*mnHash(s, 3, 77))*(0.3 + forms), snow = W*0.03*(0.7 + 0.6*mnHash(s, 4, 77));
  const raw = (a, z, fine) => { let v = 0;
    for(let k = 0; k < 11; k++){ const wl = W*Math.pow(0.5, k); if(wl < fine) break;
      const n = mnValue(a/wl + k*17.31, z/wl - k*9.17 + 40, s + k*101), r = 1 - Math.abs(2*n - 1);
      v += k < 3 ? (r*r - 0.33)*wl*0.13*forms*flat : (n - 0.5)*wl*(k < 6 ? 0.16 : 0.12)*(0.4 + forms); }
    v += Hw*0.4*forms*rsSmooth(0.55, 1, Math.abs(z)*2/W)*(0.3 + 0.7*mnValue(a/(W*0.18), 2.7, s + 5));
    if(terrace && v > 0){ const q = v/terrace, f = q - Math.floor(q); v = (Math.floor(q) + rsSmooth(0.7, 1, f))*terrace; }
    return v; };
  return { sea, snow, raw };
}
const rgClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
// a stream of its own for each thing in the world (Ruby: "sweep the camera and see it not really change much"): seeded by
// what the thing is and where it stands, never by what happened to be drawn before it
const rgRand = (s, a, b = 0, c = 0) => mulberry32((Math.imul(s | 0, 0x9E3779B1) ^ Math.imul(a | 0, 0x85EBCA77) ^ Math.imul(b | 0, 0xC2B2AE3D) ^ Math.imul(c | 0, 0x27D4EB2F)) >>> 0);
// canonical pixels for the painters' thinnest lines (set from the evaluator's E.px at each paint)
let rgPx = v => v;

// THE VIEW both parts paint through: the Ringworld's camera (ringParams, ringCamera) standing on this world's land
function rgView(E, n, ww, wh){
  const { num, input } = E, toward = input(n, 2), up = input(n, 3), zoom = input(n, 4), sun = input(n, 5), from = input(n, 6);
  const daylight = typeof sun === 'number' ? 100*(sun <= 1 ? 1 - 0.5*sun : Math.max(0, 0.5 - (sun - 1)/0.3*0.5)) : num(n, 'daylight', 80);
  const seed = ((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
  const p = ringParams({ band: num(n, 'band', 45), walls: num(n, 'walls', 25), altitude: num(n, 'altitude', 15), look: typeof toward === 'number' ? toward*360 : num(n, 'look', 0),
    up: typeof up === 'number' ? up : null, lift: num(n, 'lift', 22), lens: 75, zoom: typeof zoom === 'number' ? 25 + 375*zoom : 100, placeBy: 'where the seed says', seed: E.ctx.seed >>> 0,
    daylight, air: 50, side: typeof from === 'number' && Math.cos((from*360 - 90)*Math.PI/180) < 0 ? -1 : 1 });
  const L = ringCamera(p), W = L.W, world = rgWorldOf(seed, num(n, 'world', 0)), forms = num(n, 'landforms', 50)/100;
  const TR = rgTerrain(W, L.Hw, seed, forms, world);
  // (the land about you is kept gentler, so you stand on it rather than in a hillside)
  // (the land about you is kept gentle, so you stand on it rather than in a hillside; and as a painter does, the far
  //  land's forms are drawn taller than they are, so the ranges along the arch's foot read at all)
  const v0 = TR.raw(0, L.z0, W*0.001); TR.sea = Math.min(TR.sea, v0 - W*0.0015); TR.snow = Math.max(TR.snow, v0 + W*0.02);
  // (the weather, by the seed or chosen; in snow the land lies white down to the ground you stand on)
  const wx = rgWeatherOf(seed, E.P(n, 'weather', 'by the seed'), world); if(wx === 'snow') TR.snow = v0 - W*0.004;
  const T = (a, z, fine) => { const v = TR.raw(a, z, fine), d = Math.hypot(a, z - L.z0); return v0 + (v - v0)*(0.25 + 0.75*rsSmooth(0, W*0.03, d) + 2.2*rsSmooth(W*0.05, W*2, d)); };
  // (the heights as they are, for the ground's colour: snow by its true height, not the painter's)
  T.true = (a, z, fine) => { const v = TR.raw(a, z, fine), d = Math.hypot(a, z - L.z0); return v0 + (v - v0)*(0.25 + 0.75*rsSmooth(0, W*0.03, d)); };
  L.Px = 1 - L.hc - v0;
  const unit = Math.min(ww, wh), F = L.f*unit, cx = ww/2, cy = wh/2;
  // THE PAINTER'S PERSPECTIVE: stereographic, not a pinhole's. A pinhole draws the arch (a great circle through the
  // zenith, in a plane through your eye) as a straight line; a painter's curved perspective bows it across the sky as the
  // old paintings of ringworlds do, and keeps every small thing its own shape. At the middle it is the pinhole's scale.
  // (Returns x, y and the depth that sizes things there: F over it is pixels per ring unit at that point.)
  const proj = (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, vf = dx*L.fx + dy*L.fy + dz*L.fz, l = Math.sqrt(dx*dx + dy*dy + dz*dz), q = l + vf; if(q <= l*0.12 || l < 1e-9) return null;
    return [cx + 2*F*(dx*L.rx + dy*L.ry + dz*L.rz)/q, cy - 2*F*(dx*L.ux + dy*L.uy + dz*L.uz)/q, q/2]; };
  const at = (a, z, e) => proj((1 - e)*Math.cos(a), (1 - e)*Math.sin(a), z);
  const psi = p.look*Math.PI/180, th = p.lift*Math.PI/180;
  const rgb = (v, d) => Array.isArray(v) ? v.slice(0, 3).map(q => q*255) : d;
  const land = rgb(input(n, 7), [111, 143, 85]), sky = rgb(input(n, 8), [134, 174, 220]), g1 = rgb(input(n, 9), [176, 48, 58]), g2 = rgb(input(n, 10), [201, 163, 58]);
  // the biomes, by world coordinates: dry land, forest, city; which world (Mixed), its lights
  const s = seed | 0, worldAt = (a, z) => world.list.length < 2 ? world.list[0] : world.list[Math.min(2, Math.floor(mnValue(a/(W*0.9) + 3.1, z/(W*0.9) + 8.3, s + 23)*3.3))];
  const dryAt = (a, z) => mnValue(a/(W*0.6) + 11.7, z/(W*0.6) - 3.3, s + 13), forestAt = (a, z) => rsSmooth(0.38, 0.62, mnValue(a/(W*0.09) + 2.1, z/(W*0.09) + 5.9, s + 17));
  const cityAt = (a, z, cv) => { if(cv <= 0) return 0; const t = 0.62 - 0.6*cv; return rsSmooth(t - 0.06, t + 0.06, mnValue(a/(W*0.22) + 7.7, z/(W*0.22) - 1.1, s + 19)); };
  const lightsOf = w => RG_LIGHTS[w] || [g1.map(c => Math.min(255, c*1.15 + 30)), g2.map(c => Math.min(255, c*1.15 + 30))];
  // THE SUN (Ruby: the light dial places it, in the world, so turning the camera turns past it, and the light on the land
  // comes from where it is): its way round the dial's, its height the dial's reach (overhead it is the ring's own star, on
  // the arch; at the dial's rim it sets; past it, night). Where it falls on the screen, and which way its light comes there
  const reach = typeof sun === 'number' ? sun : 2*(1 - num(n, 'daylight', 80)/100), D = ringSunDir(L, typeof from === 'number' ? from*360 : (E.ctx.light ?? 315), reach);
  const sunR = D[0]*L.rx + D[1]*L.ry + D[2]*L.rz, sunU = D[0]*L.ux + D[1]*L.uy + D[2]*L.uz, sunUp = reach <= 1.02;
  const sunAt = sunUp ? proj(L.Px + D[0], D[1], L.z0 + D[2]) : null;
  // (the land's facets and the painted things, lit from the sun's side of the screen, and from above as it rises)
  const sunSd = Math.abs(sunR) > 0.04 ? (sunR > 0 ? 1 : -1) : L.side, lt = [sunR, -Math.max(0.25, sunU + 0.35)], ll = Math.hypot(lt[0], lt[1]) || 1;
  return { E, L, p, W, seed, sun: { D, at: sunAt, sd: sunSd, LT: [lt[0]/ll, lt[1]/ll], screen: [sunR, -sunU] }, world, forms, T, TR, unit, F, cx, cy, ww, wh, proj, at, psi, th, hx: Math.cos(psi), hz: Math.sin(psi), land, sky, g1, g2, worldAt, dryAt, forestAt, cityAt, lightsOf, psi,
    life: num(n, 'life', 50)/100, works: num(n, 'works', 50)/100, clutter: num(n, 'clutter', 50)/100, weather: wx, air: num(n, 'air', 60)/100, dayHere: ringDay(L, 0), px: E.px, saturn: E.P(n, 'saturn', 'by the seed') };
}
// the ground's own colour at a point (before light, night and haze): the Land Hue as each world lays it, dry land,
// forest, city, rock high up, snow on the tallest; the sea below its level
function rgGround(V, a, z, e, coarse = 1){
  const w = V.worldAt(a, z), P = RG_PROF[w], [gc, gk] = RG_GROUND[w];
  if(e <= V.TR.sea + 1e-9) return rsMix([24, 58, 104], V.sky, 0.35);
  let c = rsMix(V.land, gc, gk);
  const dry = rsSmooth(0.55, 0.8, V.dryAt(a, z)); if(dry > 0) c = rsMix(c, w === 'ruins' ? [150, 116, 84] : [206, 178, 124], dry*0.8);
  const fo = V.forestAt(a/coarse, z/coarse)*Math.min(1, V.life*1.6)*(P.tr + P.gt*0.5 + P.de*0.3); if(fo > 0) c = rsMix(c, w === 'magic' ? rsMix([30, 70, 64], V.g1, 0.25) : w === 'ruins' ? [70, 64, 50] : [34, 74, 46], Math.min(0.75, fo*0.7));
  const ci = V.cityAt(a/Math.sqrt(coarse), z/Math.sqrt(coarse), P.cv*(0.3 + 0.9*V.works)); if(ci > 0) c = rsMix(c, w === 'neon' ? [40, 36, 58] : [150, 148, 146], ci*0.7);
  const hi = rsSmooth(V.TR.snow*0.5, V.TR.snow, e); if(hi > 0) c = rsMix(c, [128, 122, 116], hi*0.5);
  if(e > V.TR.snow) c = rsMix(c, [240, 243, 250], rsSmooth(V.TR.snow, V.TR.snow*1.25, e));
  return c;
}
// light, night and air on a colour: lit by the star (by day), dark blue by night, hazed by the air between
function rgLit(V, c, day, haze, air){ const n = rsMix(rsMix(c, [8, 12, 30], 0.82), c, 0.08); return rsMix(rsMix(n, c, day), air, haze); }
// the air's colour (the sky at the horizon): blue by day, warm at dusk, dark by night
function rgAirOf(V, day){ const dusk = rgClamp(1 - Math.abs(day - 0.5)*3.2), w = V.world.list[0];
  const a = rsMix(rsMix(rsMix(V.sky, [6, 8, 20], 0.86), rsMix(V.sky, [255, 255, 255], 0.38), rsSmooth(0.3, 0.75, day)), rsMix([255, 150, 118], V.g1, 0.2), dusk*0.55);
  // (a world's own air: the smoke over ruins, the neon's glow in the haze, the magic's)
  return w === 'ruins' ? rsMix(a, [150, 112, 88], 0.32) : w === 'neon' ? rsMix(a, V.g1, 0.22 + 0.2*(1 - day)) : w === 'magic' ? rsMix(a, V.g2, 0.15) : a; }

// THE STARS BEHIND (what the Arch is laid over) pan with the camera, wrapping round, so turning the camera turns the sky
// with the land instead of leaving the stars pinned to the page
function rgPanSky(c, x, V){
  const { ww, wh, F } = V, ox = ((-V.psi*F) % ww + ww) % ww, oy = ((V.th*F) % wh + wh) % wh; if(ox < 0.5 && oy < 0.5) return;
  const [t, tx] = kitCanvas(ww, wh); tx.drawImage(c, 0, 0);
  for(const dx of [ox - ww, ox]) for(const dy of [oy - wh, oy]) x.drawImage(t, dx, dy);
  t.width = 0; t.height = 0;
}
// ---------------- THE ARCH ----------------
// THE WEATHER (Ruby: "more clouds, slightly rare weather effects … atmospherics, possibly rays from the sun"): by the seed
// mostly clear, often clouds, now and then fog, rarely rain, a storm or snow (never snow where it's neon or ruins hot)
function rgWeatherOf(seed, chosen, world){ if(chosen && chosen !== 'by the seed') return chosen; const u = mnHash(seed | 0, 77, 5);
  return u < 0.46 ? 'clear' : u < 0.74 ? 'clouds' : u < 0.84 ? 'fog' : u < 0.93 ? 'rain' : u < 0.97 ? 'storm' : world.list.includes('neon') ? 'rain' : 'snow'; }
function rgPaintArch(x, mk, V){
  rgPx = V.px;
  const { L, W, ww, wh, unit, F, cx, cy, proj, at, sky: S, g1, g2, px } = V, dl = V.dayHere, kday = rsSmooth(0.3, 0.75, dl), dusk = rgClamp(1 - Math.abs(dl - 0.5)*3.2);
  const SPACE = [8, 10, 24], AIR = rgAirOf(V, dl), s = V.seed | 0;
  // (everything in the sky stands in a DIRECTION of the world, so turning the camera turns past it: skyAt is where a
  //  bearing and an elevation fall on the page, and F the pixels a radian spans at the middle of the view)
  const psi = V.psi, skyAt = (az, el) => proj(L.Px - Math.sin(el)*0.01, Math.cos(el)*Math.cos(az)*0.01, L.z0 + Math.cos(el)*Math.sin(az)*0.01);
  // elevation → the screen's height, through the camera's middle (the camera never rolls, so near enough a line)
  const hx = V.hx, hz = V.hz, yAt = e => { const p = proj(L.Px - Math.sin(e)*0.01, Math.cos(e)*hx*0.01, L.z0 + Math.cos(e)*hz*0.01); return p ? p[1] : null; };
  // THE SKY: the air thick at the horizon, thin overhead, where space shows with its stars
  { const st = [[0, 1], [3, 0.92], [10, 0.75], [25, 0.5], [50, 0.32], [89, 0.22]].map(([deg, al]) => [yAt(deg*Math.PI/180), deg, al]).filter(q => q[0] != null);
    if(st.length >= 2){ const y0 = Math.min(...st.map(q => q[0])), y1 = Math.max(...st.map(q => q[0]));
      if(y1 - y0 > 1){ const g = x.createLinearGradient(0, y0, 0, y1);
        for(const [y, deg, al] of st){ const hi = deg/90, c = rsMix(AIR, rsMix(S, SPACE, 0.55 + 0.4*hi), rsSmooth(0, 0.35, hi)), a = al*(0.18 + 0.82*kday) + dusk*0.25*(1 - hi);
          g.addColorStop((y - y0)/(y1 - y0), rsCss(c, Math.min(1, a))); }
        x.fillStyle = g; x.fillRect(0, 0, ww, wh); x.fillStyle = rsCss(AIR, 0.95*(0.3 + 0.7*kday)); x.fillRect(0, y1, ww, wh - y1); } } }
  // THE FAR SKY'S OWN THINGS, by the seed: the nebula's washes in the page's accents, now and then a planet or a comet
  x.save(); x.globalCompositeOperation = 'screen';
  const nebA = 0.2*(1 - 0.65*kday);
  for(const sg of [0, 1]){ const R = rgRand(s, 801, sg), rnd = (a, b) => a + (b - a)*R(), az0 = sg*Math.PI + rnd(-0.9, 0.9), el0 = rnd(0.3, 0.9), ga = rnd(-0.7, 0.7);   // (two clouds of nebula, one each way along the ring)
   for(let i = 0, nW = 4 + Math.floor(R()*7); i < nW; i++){ const d = (R() - 0.5)*0.9, col = [S, g1, g2, rsMix(g1, g2, 0.5)][Math.floor(R()*4)], rx = F*rnd(0.15, 0.4), ry = rx*rnd(0.2, 0.45), tw = (R() - 0.5)*0.5;
    const p = skyAt(az0 + Math.cos(ga)*d, el0 + Math.sin(ga)*d*0.6); if(!p) continue; const X = p[0], Y = p[1]; x.save(); x.translate(X, Y); x.rotate(ga + tw); x.scale(1, ry/rx);
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rsCss(col, nebA)); gr.addColorStop(0.5, rsCss(col, nebA*0.35)); gr.addColorStop(1, rsCss(col, 0)); x.fillStyle = gr; x.fillRect(-rx, -rx, rx*2, rx*2); x.restore(); } }
  x.restore();
  // (Ruby: "Ringworld should sometimes be orbiting Saturn": a ring in four orbits it, as the old games' rings orbit
  //  their gas giants, and SATURN hangs huge in its sky, beyond the far arch; by the seed, or The Arch's Saturn. Now and
  //  then, when it doesn't, the far planet is Saturn: an Easter egg)
  const SC_ = seedChoice(V.seed, 'saturn'), byS = SC_() < 0.25, satSky = V.saturn === 'always' || (V.saturn !== 'never' && byS), satFar = !satSky && SC_() < 0.2;
  { const R = rgRand(s, 802), rnd = (a, b) => a + (b - a)*R(), has = R() < 0.35, r = F*rnd(0.04, 0.12), P0 = skyAt(R()*Math.PI*2, rnd(0.2, 0.6)), X = P0 ? P0[0] : 0, Y = P0 ? P0[1] : 0;
  if(has && P0){ const c1 = rsMix(rsMix(g2, S, 0.5), [255, 255, 255], 0.2), c2 = rsMix(c1, SPACE, 0.45), a = 0.55 + 0.4*(1 - kday), lit = rnd(-1, 1);
    const bands = Array.from({ length: 5 }, (_, b) => [(b*0.4 + R()*0.2)*r, r*rnd(0.12, 0.3)]);
    if(satFar) paintSaturn(x, X, Y, r*0.6, { axis: (SC_() - 0.5)*0.9, open: (SC_() < 0.5 ? -1 : 1)*(0.2 + 0.25*SC_()), sun: [lit < 0 ? 1 : -1, -0.3], alpha: a, tint: S });
    else if(satSky){ /* (Saturn fills the sky instead: no second planet) */ }
    else { x.save(); x.globalAlpha = a; x.fillStyle = rsCss(c2); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill(); x.clip();
      for(let b = 0; b < 5; b++){ x.fillStyle = rsCss(b % 2 ? c1 : rsMix(c1, c2, 0.5)); x.fillRect(X - r, Y - r + bands[b][0], r*2, bands[b][1]); }
      x.fillStyle = rsCss(SPACE, 0.55); x.beginPath(); x.arc(X + lit*r*0.55, Y - r*0.2, r*1.05, 0, Math.PI*2); x.fill(); x.restore(); } } }
  { const R = rgRand(s, 803), rnd = (a, b) => a + (b - a)*R(), has = R() < 0.25, P0 = skyAt(R()*Math.PI*2, rnd(0.25, 0.8)), X = P0 ? P0[0] : 0, Y = P0 ? P0[1] : 0;
  if(has && P0){ const ang = rnd(0.2, 0.9)*(R() < 0.5 ? 1 : -1) + Math.PI/2, len = F*rnd(0.12, 0.3), wd = F*0.012;
    const tx = X - Math.cos(ang)*len, ty = Y - Math.sin(ang)*len, g = x.createLinearGradient(X, Y, tx, ty); g.addColorStop(0, rsCss([240, 250, 255], 0.8*(1 - 0.6*kday))); g.addColorStop(1, rsCss(S, 0));
    rsPoly(x, [[X - Math.sin(ang)*wd, Y + Math.cos(ang)*wd], [tx, ty], [X + Math.sin(ang)*wd, Y - Math.cos(ang)*wd]], g); x.fillStyle = rsCss([255, 255, 255], 0.9*(1 - 0.5*kday)); x.beginPath(); x.arc(X, Y, wd*0.8, 0, Math.PI*2); x.fill(); } }
  // THE STAR, at the ring's middle (so on the arch's own line), and the SHADOW SQUARES circling close about it: they
  // stand between it and the land, and make its nights (where you stand under one, it hides the star)
  const sp = V.sun.at;
  const paintSun = () => { if(!sp) return; const rs = unit*0.018, SC = [255, 246, 226];
    x.save(); x.globalCompositeOperation = 'screen';
    for(const [r, a] of [[rs*18, 0.3], [rs*6, 0.6]]){ const gl = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); gl.addColorStop(0, rsCss(SC, a)); gl.addColorStop(0.2, rsCss(SC, a*0.35)); gl.addColorStop(1, rsCss(SC, 0)); x.fillStyle = gl; x.fillRect(sp[0] - r, sp[1] - r, r*2, r*2); }
    const R = rgRand(s, 804); for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2 + R()*0.2, Lr = rs*(k % 2 ? 4 : 9)*(0.8 + 0.4*R()), wd = rs*0.2;
      rsPoly(x, [[sp[0] + Math.cos(a + Math.PI/2)*wd, sp[1] + Math.sin(a + Math.PI/2)*wd], [sp[0] + Math.cos(a)*Lr, sp[1] + Math.sin(a)*Lr], [sp[0] - Math.cos(a + Math.PI/2)*wd, sp[1] - Math.sin(a + Math.PI/2)*wd]], rsCss(SC, 0.4)); }
    x.restore(); x.fillStyle = rsCss(SC); x.beginPath(); x.arc(sp[0], sp[1], rs, 0, Math.PI*2); x.fill(); };
  // (the sun first: Saturn passes in front of it. Ruby: "put the sun behind Saturn and do a sunrise": as the sun nears
  //  its disc, Saturn turns its night side to us, ringed with lit air, its rings backlit and shining)
  paintSun();
  if(satSky){ // SATURN in the sky, lit from the ring's star (or the light dial's side when the star is out of sight);
    // now and then ENCELADUS beside it, its plume rising (Ruby's favorite moon)
    // (it hangs in one direction of the world, so turning the camera turns past it: the way the camera faces by default
    //  (Turn 50°, View 55), give or take, and high enough to be framed there)
    const rS = F*(0.1 + 0.11*SC_()), az = (50 + (SC_() - 0.5)*70)*Math.PI/180, el = (18 + 22*SC_())*Math.PI/180, P0 = skyAt(az, el), X = P0 ? P0[0] : -1e4, Y = P0 ? P0[1] : -1e4, axis = (SC_() - 0.5)*1.1, open = (SC_() < 0.5 ? -1 : 1)*(0.14 + 0.26*SC_());
    const sun = sp ? [sp[0] - X, sp[1] - Y] : V.sun.screen, sa = 0.62 + 0.38*(1 - kday);
    const ecl = sp && P0 ? 1 - rsSmooth(rS*0.55, rS*1.5, Math.hypot(sp[0] - X, sp[1] - Y)) : 0;
    if(P0) paintSaturn(x, X, Y, rS, { axis, open, sun, alpha: sa, tint: S, behind: rsMix(rsMix(SPACE, S, 0.12), AIR, kday), eclipse: ecl });
    // (the sun just past its limb: a single bright bead of light where it slips out, as a diamond ring)
    if(ecl > 0.05 && ecl < 0.95 && sp){ const d = Math.hypot(sp[0] - X, sp[1] - Y) || 1, bx = X + (sp[0] - X)/d*rS, by = Y + (sp[1] - Y)/d*rS, k = 1 - Math.abs(ecl - 0.5)*2;
      rgGlow(x, bx, by, rS*0.8*k, [255, 248, 232], 0.95*k); rgGlow(x, bx, by, rS*0.2, [255, 255, 255], k);
      if(k > 0.3) for(let q = 0; q < 4; q++){ const an = q*Math.PI/2 + 0.4, Lr = rS*(q % 2 ? 0.5 : 1.1)*k; rsPoly(x, [[bx - Math.sin(an)*px(1.2), by + Math.cos(an)*px(1.2)], [bx + Math.cos(an)*Lr, by + Math.sin(an)*Lr], [bx + Math.sin(an)*px(1.2), by - Math.cos(an)*px(1.2)], [bx - Math.cos(an)*Lr, by - Math.sin(an)*Lr]], rsCss([255, 252, 240], 0.7*k)); } }
    if(SC_() < 0.45 && P0){ const th2 = (SC_() < 0.5 ? 0.25 : 0.75)*Math.PI*2 + (SC_() - 0.5)*0.9, d = 3.95*rS, ex = Math.cos(th2)*d, ey = Math.sin(th2)*d*open;
      paintEnceladus(x, X + ex*Math.cos(axis) - ey*Math.sin(axis), Y + ex*Math.sin(axis) + ey*Math.cos(axis), Math.max(px(3), rS*0.05), { axis, sun, alpha: sa, px }); } }
  const nsq = Math.round(Math.PI*2/L.per);
  for(let k = 0; k < nsq; k++){ const ph0 = (L.q0 + k*L.per)*L.side, ph1 = (L.q0 + (k + RING_COV)*L.per)*L.side, edge = [], back = [];
    for(let q = 0; q <= 8; q++){ const ph = ph0 + (ph1 - ph0)*q/8, X = RING_SQR*Math.cos(ph), Y = RING_SQR*Math.sin(ph), a = proj(X, Y, -W*0.3), b = proj(X, Y, W*0.3); if(!a || !b){ edge.length = 0; break; } edge.push(a); back.push(b); }
    if(edge.length) rsPoly(x, [...edge, ...back.reverse()], rsCss(rsMix(SPACE, S, 0.12), 0.96)); }
  // THE RING'S FAR FLOOR (the arch) and ITS RIM WALLS, in patches far to near: land, sea, forest, city as this world
  // lays them, its nights where the squares' shadows fall, hazed by the air low down and clear overhead
  const WALL0 = rsMix([96, 104, 124], S, 0.22), quads = [], hzOf = (zc, eS) => V.air*(1 - Math.exp(-zc/(W*1.6)))*(0.25 + 0.75*Math.exp(-Math.max(0, eS)/0.22));
  const elevOf = (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, l = Math.hypot(dx, dy, dz) || 1; return -dx/l; };
  const steps = (a0, fine, coarse) => { const out = [a0]; let a = a0; while(a < Math.PI){ a = Math.min(Math.PI, a + Math.max(fine, Math.min(coarse, a*0.12))); out.push(a); } return out; };
  const LN = 3, aF = steps(W*0.25, W*0.05, W*0.35);
  // AN UNFINISHED STRETCH (Ruby: "unfinished sections of the ring with scaffolding"): on some rings, more often where
  // the builders are, a stretch of the far floor was never laid: the bare lattice of the ring's frame shows, scaffolding
  // stands along its edges, and cranes lean over it
  const UF = (() => { const R = rgRand(s, 812), p = V.world.list.includes('builders') ? 0.7 : V.world.list.includes('ruins') ? 0.45 : 0.22; if(R() > p) return null;
    const sg = R() < 0.5 ? 1 : -1, a0 = (0.7 + R()*1.6)*sg, len = W*(1 + 3*R())*sg; return { lo: Math.min(a0, a0 + len), hi: Math.max(a0, a0 + len), R }; })();
  const unfinished = a => UF && a >= UF.lo && a <= UF.hi;
  for(const sg of [1, -1]) for(let i = 0; i + 1 < aF.length; i++){ const a0 = aF[i]*sg, a1 = aF[i + 1]*sg, am = (a0 + a1)/2, day = ringDay(L, am);
    for(let j = 0; j < LN; j++){ const z0 = -W/2 + W*j/LN, z1 = -W/2 + W*(j + 1)/LN, zm = (z0 + z1)/2, q = [at(a0, z0, 0), at(a1, z0, 0), at(a1, z1, 0), at(a0, z1, 0)];
      if(q.some(v => !v)) continue;
      const e = V.TR.raw(am, zm, W*0.25), wet = rsSmooth(V.TR.sea + W*0.004, V.TR.sea - W*0.004, e), c = rsMix(rgGround(V, am, zm, Math.max(e, V.TR.sea + 1e-6), 4), rsMix([24, 58, 104], S, 0.35), wet), zc = (q[0][2] + q[2][2])/2, eS = elevOf(Math.cos(am), Math.sin(am), zm);
      if(unfinished(am)){ quads.push([zc, q, rgLit(V, rsMix(WALL0, SPACE, 0.55), 0.3 + 0.7*day, hzOf(zc, eS)*0.55, AIR), null, 'frame', rgRand(s, 813, i*sg, j)]); continue; }
      quads.push([zc, q, rgLit(V, rsMix(c, [255, 255, 255], 0.06), day, hzOf(zc, eS)*0.55, AIR), day < 0.5 && V.cityAt(am, zm, RG_PROF[V.worldAt(am, zm)].cv*(0.3 + 0.9*V.works)) > 0.3 ? V.lightsOf(V.worldAt(am, zm))[0] : null, false, rgRand(s, 805, i*sg, j)]); } }
  const Hw = L.Hw, WALL = rsMix([96, 104, 124], S, 0.22), aW = steps(0, W*0.012, W*0.4);
  for(const zw of [-W/2, W/2]) for(const sg of [1, -1]) for(let i = 0; i + 1 < aW.length; i++){ const a0 = aW[i]*sg, a1 = aW[i + 1]*sg, am = (a0 + a1)/2, q = [at(a0, zw, 0), at(a1, zw, 0), at(a1, zw, Hw), at(a0, zw, Hw)];
    if(q.some(v => !v)) continue;
    const zc = (q[0][2] + q[2][2])/2, eS = elevOf((1 - Hw*0.5)*Math.cos(am), (1 - Hw*0.5)*Math.sin(am), zw), rib = i % 4 === 0 ? 0.12 : 0, day = ringDay(L, am);
    quads.push([zc, q, rgLit(V, rsMix(WALL, [0, 0, 0], rib*0.5), 0.25 + 0.75*day, Math.min(0.92, 0.45*V.air + hzOf(zc, eS)*0.7), AIR), null, true, rgRand(s, 810, i*sg, zw > 0 ? 1 : 0), V.worldAt(am, zw*0.96), day]); }
  quads.sort((p, q) => q[0] - p[0]);
  // a point inside a quad (u along it, v up or across it)
  const inQ = (q, u, v) => [q[0][0] + (q[1][0] - q[0][0])*u + (q[3][0] - q[0][0])*v + (q[2][0] - q[1][0] - q[3][0] + q[0][0])*u*v, q[0][1] + (q[1][1] - q[0][1])*u + (q[3][1] - q[0][1])*v + (q[2][1] - q[1][1] - q[3][1] + q[0][1])*u*v];
  const line = (pts, col, wd) => { x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); pts.forEach(([X, Y], k) => k ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.stroke(); };
  for(const [, q, c, lights, wall, R, ww2, wday] of quads){ rsPoly(x, q, rsCss(c)); rsPoly(mk, q, '#fff');
    if(wall === 'frame'){ // the ring's bare frame: its ribs across and along, lit on their edges
      const fc = rsCss(rsMix(c, [255, 255, 255], 0.3), 0.8), wd = Math.max(px(0.6), Math.abs(q[3][1] - q[0][1])*0.04);
      for(let k = 0; k <= 3; k++){ line([inQ(q, k/3, 0), inQ(q, k/3, 1)], fc, wd); line([inQ(q, 0, k/3), inQ(q, 1, k/3)], fc, wd*0.7); }
      line([inQ(q, 0, 0), inQ(q, 1, 1)], rsCss(c, 0.9), wd*0.5); continue; }
    if(wall){ // the wall's top, catching the light: a thin lighter band along its upper edge
      rsPoly(x, [q[3], q[2], [q[2][0] + (q[1][0] - q[2][0])*0.05, q[2][1] + (q[1][1] - q[2][1])*0.05], [q[3][0] + (q[0][0] - q[3][0])*0.05, q[3][1] + (q[0][1] - q[3][1])*0.05]], rsCss(rsMix(c, [255, 255, 255], 0.25)));
      // THE WALLS BY THEIR BUILDERS (Ruby: "different textures of the walls depending on the builders, including graffiti
      // or writing, some computerized bits"): seams between the plates where the wall is big enough to show them; the
      // builders' glowing script running along it; the cities' and neon's screens; graffiti at the foot where people reach
      const hp = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]), wp = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
      if(hp > px(14) && R){ const night = 1 - rsSmooth(0.3, 0.7, wday ?? 1), glowC = V.lightsOf(ww2)[0], seam = rsCss(rsMix(c, [0, 0, 0], 0.35), 0.6);
        line([inQ(q, 0, 0.34), inQ(q, 1, 0.34)], seam, Math.max(px(0.5), hp*0.006)); line([inQ(q, 0, 0.68), inQ(q, 1, 0.68)], seam, Math.max(px(0.5), hp*0.006));
        if((ww2 === 'builders' || ww2 === 'magic') && R() < 0.6){ // a line of script, glyph by glyph: ticks, hooks and rings of light
          const n = Math.max(2, Math.min(40, Math.round(wp/(hp*0.05)))), gc = rsCss(glowC, 0.55 + 0.4*night);
          for(let k = 0; k < n; k++){ const u = (k + 0.5)/n, [X, Y] = inQ(q, u, 0.5), g = hp*0.025, t = R();
            x.strokeStyle = gc; x.lineWidth = Math.max(px(0.5), g*0.25); x.beginPath();
            if(t < 0.3){ x.moveTo(X, Y - g); x.lineTo(X, Y + g); x.moveTo(X - g*0.6, Y - g*0.3); x.lineTo(X + g*0.6, Y - g*0.3); }
            else if(t < 0.6){ x.arc(X, Y, g*0.6, 0, Math.PI*2); }
            else { x.moveTo(X - g*0.6, Y + g); x.lineTo(X, Y - g); x.lineTo(X + g*0.6, Y + g*0.2); }
            x.stroke(); } }
        if((ww2 === 'cities' || ww2 === 'neon') && R() < 0.5){ // screens: a few lit panels, one a broadcast in the page's colours
          for(let k = 0, nS = 1 + Math.floor(R()*3); k < nS; k++){ const u0 = R()*0.8, v0 = 0.4 + R()*0.35, a = inQ(q, u0, v0), b = inQ(q, u0 + 0.12, v0 + 0.16);
            rsPoly(x, [a, inQ(q, u0 + 0.12, v0), b, inQ(q, u0, v0 + 0.16)], rsCss(R() < 0.5 ? glowC : V.lightsOf(ww2)[1], 0.35 + 0.55*night)); } }
        if((ww2 === 'ruins' || ww2 === 'neon' || ww2 === 'cities') && R() < 0.45){ // graffiti: tags and scrawl near the foot, in the page's colours
          const cols = [V.g1, V.g2, [240, 236, 228]];
          for(let k = 0, nT = 1 + Math.floor(R()*3); k < nT; k++){ const u0 = R()*0.85, col = rsCss(cols[Math.floor(R()*3)], 0.75), pts = [];
            for(let p = 0; p < 7; p++) pts.push(inQ(q, u0 + p*0.018 + (R() - 0.5)*0.01, 0.06 + 0.12*R()));
            line(pts, col, Math.max(px(0.6), hp*0.008)); } } } }
    else if(lights){ const n = 2 + Math.floor(R()*3); for(let k = 0; k < n; k++){ const u = R(), v = R(), X = q[0][0] + (q[1][0] - q[0][0])*u + (q[3][0] - q[0][0])*v, Y = q[0][1] + (q[1][1] - q[0][1])*u + (q[3][1] - q[0][1])*v;
        x.fillStyle = rsCss(lights, 0.85); x.fillRect(X, Y, px(2.2), px(2.2)); } } }
  // the unfinished stretch's scaffolding and cranes, along both its edges
  if(UF){ const R = UF.R, sc = rsCss(rgLit(V, rsMix(WALL0, [255, 220, 150], 0.25), 0.8, 0.2, AIR), 0.85);
    for(const [ae, inward] of [[UF.lo, 1], [UF.hi, -1]]){
      for(let k = 0; k < 7; k++){ const z = -W*0.45 + W*0.9*k/6, hgt = W*(0.012 + 0.02*R()), A = at(ae, z, 0), B = at(ae, z, hgt), C = at(ae + inward*W*0.02, z, 0), D = at(ae + inward*W*0.02, z, hgt); if(!A || !B || !C || !D) continue;
        const wd = Math.max(px(0.5), Math.abs(B[1] - A[1])*0.04); line([A, B], sc, wd); line([C, D], sc, wd); line([A, D], sc, wd*0.6); line([C, B], sc, wd*0.6); line([B, D], sc, wd); }
      for(let k = 0; k < 2; k++){ const z = (R() - 0.5)*W*0.7, H2 = W*(0.04 + 0.03*R()), M0 = at(ae, z, 0), M1 = at(ae, z, H2), J = at(ae + inward*W*(0.08 + 0.1*R()), z + (R() - 0.5)*W*0.1, H2*0.95), Cw = at(ae - inward*W*0.02, z, H2*0.9); if(!M0 || !M1 || !J || !Cw) continue;
        const wd = Math.max(px(0.6), Math.abs(M1[1] - M0[1])*0.03); line([M0, M1], sc, wd); line([Cw, M1, J], sc, wd*0.8); const hk = [J[0], J[1] + Math.abs(M1[1] - M0[1])*0.3]; line([J, hk], sc, wd*0.4);
        if(dl < 0.5){ x.fillStyle = rsCss([255, 80, 70], 0.9); x.fillRect(M1[0] - px(1), M1[1] - px(1), px(2), px(2)); } } } }
  // the arch's clouds: long streaks over its land, a little above it
  for(let k = 0, nC = 4 + Math.floor(rgRand(s, 806)()*9); k < nC; k++){ const R = rgRand(s, 807, k), rnd = (a, b) => a + (b - a)*R(), sg = R() < 0.5 ? 1 : -1, a0 = sg*rnd(W*0.6, Math.PI), len = W*rnd(0.4, 2.2), zc = rnd(-0.35, 0.35)*W, dz = W*rnd(0.05, 0.16), top = [], bot = [];
    for(let q = 0; q <= 6; q++){ const u = q/6, a = a0 + len*u*sg, th = dz/2*Math.pow(Math.sin(Math.PI*u), 0.7), A = at(a, zc - th, W*0.01), B = at(a, zc + th, W*0.01); if(!A || !B){ top.length = 0; break; } top.push(A); bot.push(B); }
    if(top.length > 2){ const am = a0 + len*0.5*sg, day = ringDay(L, am), A = top[3]; rsPoly(x, [...top, ...bot.reverse()], rsCss(rgLit(V, [246, 247, 252], day, hzOf(A[2], 0.3)*0.4, AIR), 0.72)); } }
  // THE AIR the walls hold in, low along the horizon, softening where the land will meet the sky
  const yh = yAt(0), yh2 = yAt(14*Math.PI/180);
  if(yh != null && yh2 != null && yh - yh2 > 1){ const g = x.createLinearGradient(0, yh, 0, yh2); g.addColorStop(0, rsCss(AIR, 0.7*V.air)); g.addColorStop(1, rsCss(AIR, 0)); x.fillStyle = g; x.fillRect(0, yh2, ww, wh - yh2); }
  // THE FAR BLOOM (a nod, very rare, and only over ruins): a faint mushroom of cloud on the far horizon, the colour of the
  // haze, barely there: what happened here, long ago
  { const R = rgRand(s, 815); if(V.world.list.includes('ruins') && R() < 0.08){ const P0 = skyAt(R()*Math.PI*2, 1.5*Math.PI/180), sz = F*(0.05 + 0.04*R());
    if(P0){ const [X, Y] = P0, c = rsMix(rsMix(AIR, [200, 170, 150], 0.35), [255, 255, 255], 0.1);
      rsPoly(x, [[X - sz*0.12, Y], [X - sz*0.08, Y - sz*1.1], [X + sz*0.08, Y - sz*1.1], [X + sz*0.12, Y]], rsCss(c, 0.22));
      for(let k = 0; k < 7; k++){ const a = k/7*Math.PI*2, r = sz*(0.28 + 0.06*R()); x.fillStyle = rsCss(c, 0.2); x.beginPath(); x.ellipse(X + Math.cos(a)*sz*0.35, Y - sz*1.25 + Math.sin(a)*sz*0.12, r, r*0.7, 0, 0, Math.PI*2); x.fill(); }
      x.fillStyle = rsCss(c, 0.16); x.beginPath(); x.ellipse(X, Y - sz*0.55, sz*0.3, sz*0.06, 0, 0, Math.PI*2); x.fill(); } } }
  // THE WEATHER'S SKY. Clear: now and then a few long low bands of cloud, high streaks of cirrus. Clouds: heaps of
  // cumulus standing over the land, their tops lit from the sun's side, their bases flat and shaded. Rain: the heaps
  // grey, rain falling from them in veils, and with the sun low behind you, a rainbow. Storm: dark towers with anvil
  // tops, and lightning. Fog and snow: a pale sky low down. Wherever the sun stands low or behind cloud, its rays.
  const wx = V.weather, cloudy = wx === 'clouds' || wx === 'rain' || wx === 'storm' || wx === 'snow', R0 = rgRand(s, 808), lowSun = sp && V.sun.D && Math.asin(Math.max(-1, Math.min(1, -V.sun.D[0]))) < 0.5;
  const cWhite = rsMix(rgLit(V, [244, 244, 250], dl, 0.2, AIR), [255, 170, 140], dusk*0.4), cGrey = rsMix(cWhite, [70, 74, 86], wx === 'storm' ? 0.6 : wx === 'rain' ? 0.38 : wx === 'snow' ? 0.15 : 0.05);
  const SL = V.sun.screen, lx = SL[0] > 0 ? 1 : -1;
  if(wx === 'clear' && R0() < 0.55) for(let k = 0, n = 8 + Math.floor(R0()*14); k < n; k++){ const R = rgRand(s, 809, k), rnd = (a, b) => a + (b - a)*R(), az = R()*Math.PI*2, e = rnd(2, 12)*Math.PI/180, P0 = skyAt(az, e); if(!P0) continue; const X = P0[0], Y = P0[1], wd = F*rnd(0.2, 0.6), ht = wd*rnd(0.03, 0.07), pts = [];
    for(let q = 0; q <= 8; q++){ const u = q/8; pts.push([X - wd/2 + wd*u, Y - ht*Math.pow(Math.sin(Math.PI*u), 0.6)*rnd(0.6, 1.2)]); }
    rsPoly(x, [...pts, [X + wd/2, Y + ht*0.25], [X - wd/2, Y + ht*0.25]], rsCss(cWhite, 0.8)); }
  if(wx === 'clear' || wx === 'clouds') if(R0() < 0.5) for(let k = 0, n = 5 + Math.floor(R0()*8); k < n; k++){ // cirrus: long thin streaks high up, combed one way
    const R = rgRand(s, 812, k), rnd = (a, b) => a + (b - a)*R(), P0 = skyAt(R()*Math.PI*2, rnd(18, 50)*Math.PI/180); if(!P0) continue; const len = F*rnd(0.2, 0.7), ang = rnd(-0.25, 0.25), th = F*rnd(0.004, 0.012);
    x.save(); x.translate(P0[0], P0[1]); x.rotate(ang); const g = x.createLinearGradient(-len/2, 0, len/2, 0); g.addColorStop(0, rsCss(cWhite, 0)); g.addColorStop(0.5, rsCss(cWhite, 0.35*(0.4 + 0.6*kday))); g.addColorStop(1, rsCss(cWhite, 0)); x.fillStyle = g;
    for(let q = 0; q < 3; q++){ x.beginPath(); x.ellipse(rnd(-0.1, 0.1)*len, (q - 1)*th*2.2, len/2*rnd(0.6, 1), th, 0, 0, Math.PI*2); x.fill(); } x.restore(); }
  const heaps = []; if(cloudy){ const n = wx === 'clouds' ? 9 + Math.floor(R0()*8) : 14 + Math.floor(R0()*10);
    for(let k = 0; k < n; k++){ const R = rgRand(s, 813, k), rnd = (a, b) => a + (b - a)*R(), az = R()*Math.PI*2, e = rnd(3, wx === 'storm' ? 16 : 22)*Math.PI/180, P0 = skyAt(az, e); if(!P0) continue;
      const wd = F*rnd(0.12, 0.38)*(wx === 'storm' ? 1.4 : 1), ht = wd*rnd(0.35, wx === 'storm' ? 1.3 : 0.7), X = P0[0], Y = P0[1]; heaps.push([X, Y, wd, ht, R]);
      // a heap: puffs piled from a flat base, each shaded below and lit on the sun's side; a storm's grows an anvil
      const base = rsMix(cGrey, [40, 44, 60], 0.25), lit = rsMix(cGrey, [255, 248, 236], 0.35*kday + 0.1), puffs = [];
      // (many small puffs, not a few balls: a heap's edge is broken into cauliflower; the lower ones squashed flat)
      for(let q = 0; q < 28; q++){ const u = R(), up = Math.pow(1 - Math.abs(u - 0.5)*2, 0.7), v = up*rnd(0.2, 0.95); puffs.push([X - wd/2 + wd*u, Y - ht*v, wd*rnd(0.045, 0.1)*(0.6 + 0.7*up)*(0.7 + 0.5*v)]); }
      const pl = Math.min(...puffs.map(q => q[0] - q[2]*0.6)), pr = Math.max(...puffs.map(q => q[0] + q[2]*0.6)), pt = Math.min(...puffs.map(q => q[1] - q[2]));
      if(wx === 'storm' && ht > wd*0.6){ x.fillStyle = rsCss(base, 0.85); x.beginPath(); x.moveTo(pl + wd*0.2, pt + ht*0.1); x.lineTo(pl - wd*0.15, pt - ht*0.02); x.lineTo(pr + wd*0.35, pt - ht*0.06); x.lineTo(pr, pt + ht*0.12); x.closePath(); x.fill(); }
      for(const [px0, py, r] of puffs){ x.fillStyle = rsCss(base, 0.88); x.beginPath(); x.arc(px0, py, r, 0, Math.PI*2); x.fill(); }
      for(const [px0, py, r] of puffs){ x.fillStyle = rsCss(rsMix(base, lit, 0.5), 0.85); x.beginPath(); x.arc(px0 + lx*r*0.15, py - r*0.18, r*0.82, 0, Math.PI*2); x.fill(); }
      for(const [px0, py, r] of puffs) if(py < Y - ht*0.3){ x.fillStyle = rsCss(lit, 0.6); x.beginPath(); x.arc(px0 + lx*r*0.3, py - r*0.32, r*0.5, 0, Math.PI*2); x.fill(); }
      // (its flat base: a few squashed puffs along it, shaded, where the heap sits)
      for(let q = 0; q < 5; q++){ const u = 0.2 + 0.6*q/4, bx = pl + (pr - pl)*u; x.fillStyle = rsCss(base, 0.85); x.beginPath(); x.ellipse(bx, Y - ht*0.06, (pr - pl)*0.12, ht*0.08, 0, 0, Math.PI*2); x.fill(); }
      if((wx === 'rain' || wx === 'storm') && R() < 0.6){ // rain falling from it in a veil, slanting with the wind, fading to the ground
        const g = x.createLinearGradient(0, Y, 0, Y + ht*2.5); g.addColorStop(0, rsCss(base, 0.22)); g.addColorStop(1, rsCss(base, 0)); x.fillStyle = g; const sl = wd*0.25;
        for(let q = 0; q < 7; q++){ const u0 = -0.4 + 0.7*R(), w0 = wd*rnd(0.03, 0.1), ln = ht*rnd(1.5, 2.6); x.beginPath(); x.moveTo(X + u0*wd, Y); x.lineTo(X + u0*wd + w0, Y); x.lineTo(X + u0*wd + w0 + sl*ln/(ht*2.5), Y + ln); x.lineTo(X + u0*wd + sl*ln/(ht*2.5), Y + ln); x.fill(); } } } }
  if(wx === 'storm' && heaps.length && R0() < 0.7){ // lightning: one bolt, jagged, forking once, from a cloud's base to the land
    const [X, Y, wd, ht, R] = heaps[Math.floor(R0()*heaps.length)]; let bx = X + (R() - 0.5)*wd*0.4, by = Y; const pts = [[bx, by]];
    for(let q = 0; q < 9; q++){ bx += (R() - 0.5)*wd*0.18; by += ht*0.35; pts.push([bx, by]); }
    x.save(); x.globalCompositeOperation = 'screen'; x.strokeStyle = rsCss([220, 220, 255], 0.95); x.lineWidth = Math.max(px(1), F*0.003); x.beginPath(); pts.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b));
    const f = pts[4]; x.moveTo(f[0], f[1]); x.lineTo(f[0] + wd*0.12, f[1] + ht*0.5); x.lineTo(f[0] + wd*0.08, f[1] + ht*0.9); x.stroke();
    const gl = x.createRadialGradient(pts[0][0], pts[0][1], 0, pts[0][0], pts[0][1], wd*1.2); gl.addColorStop(0, rsCss([200, 200, 255], 0.5)); gl.addColorStop(1, rsCss([200, 200, 255], 0)); x.fillStyle = gl; x.fillRect(pts[0][0] - wd*1.2, pts[0][1] - wd*1.2, wd*2.4, wd*2.4); x.restore(); }
  // the SUN'S RAYS: when it stands low, or the sky is heaped with cloud, light fanning from it across the air in shafts,
  // a gap between each (crepuscular rays), soft, in the sun's own colour
  // (they fan downward and to the sides, as shafts through broken cloud do, some gaps wide; soft-edged, faint)
  if(sp && (lowSun || cloudy) && wx !== 'fog'){ const R = rgRand(s, 814), n = 6 + Math.floor(R()*6), Lr = F*1.5, col = rsMix([255, 236, 200], [255, 170, 130], dusk*0.6), str = (cloudy ? 0.06 : 0.045)*(0.4 + 0.6*kday + dusk*0.6);
    x.save(); x.globalCompositeOperation = 'screen'; for(let k = 0; k < n; k++){ const a = Math.PI/2 + (k/(n - 1) - 0.5)*2.6 + (R() - 0.5)*0.25, wa = 0.03 + 0.07*R(), g = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], Lr*(0.6 + 0.4*R()));
      g.addColorStop(0, rsCss(col, str)); g.addColorStop(0.35, rsCss(col, str*0.45)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g;
      for(const k2 of [1, 0.55, 0.25]){ x.beginPath(); x.moveTo(sp[0], sp[1]); x.arc(sp[0], sp[1], Lr, a - wa*k2*1.6, a + wa*k2*1.6); x.closePath(); x.fill(); } } x.restore(); }
  // a RAINBOW after the rain, opposite the sun, when the sun is low behind you: its bands round the point opposite it
  if((wx === 'rain' || (wx === 'clouds' && R0() < 0.15)) && V.sun.D && -V.sun.D[0] < 0.6 && -V.sun.D[0] > -0.05){ const D = V.sun.D, A = proj(L.Px - D[0], -D[1], L.z0 - D[2]);
    if(A){ const r0 = 2*F*Math.tan(21*Math.PI/180), BOW = [[220, 60, 60], [240, 150, 50], [240, 230, 80], [80, 200, 90], [70, 120, 230], [140, 80, 200]]; x.save(); x.globalCompositeOperation = 'screen'; x.lineWidth = r0*0.018;
      BOW.forEach((cb, k) => { x.strokeStyle = rsCss(cb, 0.16*(0.4 + 0.6*kday)); x.beginPath(); x.arc(A[0], A[1], r0*(1.0 - k*0.018), Math.PI, 0); x.stroke(); }); x.restore(); } }
  // FOG and SNOW: the sky pale and low, the far things fading into it
  if(wx === 'fog' || wx === 'snow'){ const yH = yAt(0); if(yH != null){ const g = x.createLinearGradient(0, yH - F*0.5, 0, yH + F*0.05); g.addColorStop(0, rsCss(cWhite, 0)); g.addColorStop(1, rsCss(cWhite, wx === 'fog' ? 0.6 : 0.4)); x.fillStyle = g; x.fillRect(0, yH - F*0.5, ww, F*0.55); } }
}

// ---------------- THE PAINTED THINGS: trees, buildings, rocks and most of the works from the shared kit (paintKit.js) ----------------
// ONE OF THE WORKS, at the ground point (X, Y), k pixels per ring unit there (F over its depth), in its colours c
function rgWork(x, o, X, Y, k, c, night, R, V, e){
  const { L, W, at, px } = V, AIR = c.air, haze = c.haze, day = ringDay(L, o.a), BLACK = [0, 0, 0], sd = c.sd, F = V.F;
    if(o.kind === 'sp'){ pkSpire(x, X, Y, W*(0.02 + 0.08*o.h)*k, c, o.w === 'ruins', R, px); }
    else if(o.kind === 'mo' && o.w !== 'builders'){ // a stone circle far off, as the store's near ones (rgHenge)
      rgHenge(x, { a: o.a, z: o.z, n: 9 + Math.floor(o.h2*12), rr: W*0.00025*(8 + 20*o.h), hm: 2.5 + 4.5*o.h }, (a, z) => { const p = at(a, z, e); return p && [p[0], p[1], W*0.00025*F/p[2], p[2]]; }, c, R, px); }
    else if(o.kind === 'mo'){ pkMonolith(x, X, Y, W*(0.006 + 0.02*o.h)*k, c, 1, R, px); }
    else if(o.kind === 'do'){ pkDome(x, X, Y, W*(0.006 + 0.016*o.h)*k, c, night, px); }
    else if(o.kind === 'ci' || o.kind === 'ca'){ const r = W*(o.kind === 'ci' ? 0.004 + 0.008*o.h : 0.006 + 0.014*o.h), pts = [], inn = [];
      for(let q = 0; q < 28; q++){ const t = q/28*Math.PI*2, p = at(o.a + Math.cos(t)*r, o.z + Math.sin(t)*r, e + W*0.0002), p2 = at(o.a + Math.cos(t)*r*0.7, o.z + Math.sin(t)*r*0.7, e + W*0.0002); if(!p || !p2) return; pts.push(p); inn.push(p2); }
      if(o.kind === 'ca'){ rsPoly(x, pts, rsCss(rgLit(V, [70, 58, 48], day, haze, AIR))); rsPoly(x, inn, rsCss(rgLit(V, [36, 30, 26], day, haze, AIR))); return; }
      x.strokeStyle = rsCss(c.glow, 0.9); x.lineWidth = Math.max(rgPx(1), r*k*0.05); x.beginPath(); pts.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.closePath(); x.stroke();
      x.beginPath(); inn.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.closePath(); x.stroke();
      x.beginPath(); for(let q = 0; q < 5; q++){ const A = inn[Math.floor(q*28/5)], B = inn[Math.floor(((q + 2) % 5)*28/5)]; x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); } x.stroke();
      rgGlow(x, X, Y, r*k*1.3, c.glow, 0.35); }
    else if(o.kind === 'pi'){ const wd = W*(0.003 + 0.006*o.h)*k, top = Math.max(0, Y - W*(0.15 + 0.3*o.h2)*k); if(wd < 1) return; const g = x.createLinearGradient(X, Y, X, top); g.addColorStop(0, rsCss(c.glow, 0.7)); g.addColorStop(0.4, rsCss(c.glow, 0.25)); g.addColorStop(1, rsCss(c.glow, 0));
      x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = g; rsPoly(x, [[X - wd/2, Y], [X - wd*0.2, top], [X + wd*0.2, top], [X + wd/2, Y]], g); x.restore(); rgGlow(x, X, Y, wd*3, c.glow, 0.6); }
    else if(o.kind === 'cr'){ pkCrystals(x, X, Y, W*0.0021*k, [rsMix(c.glow, AIR, haze*0.4), rsMix(c.glow2, AIR, haze*0.4)], c, 3 + Math.floor(o.h2*4), R, px); }
    else if(o.kind === 'to'){ const hh = W*(0.02 + 0.07*o.h)*k*(o.w === 'neon' ? 1.4 : 1); if(hh >= 2) pkBuilding(x, X, Y, hh, hh*(0.12 + 0.1*o.h2), c, PK_STYLE[o.w], night, R, px); }
    else if(o.kind === 'wr'){ // a crashed ship: its hull half sunk and tilted, a fin, its trench behind it, smoke
      const len = W*(0.006 + 0.02*o.h)*k; if(len < 3) return; const ang = (o.h2 - 0.5)*0.7 + 0.25*(o.h2 < 0.5 ? -1 : 1), ca = Math.cos(ang), sa = Math.sin(ang), hb = len*0.22;
      const hull = [[-0.5, 0], [-0.35, -0.8], [0.3, -1], [0.5, -0.45], [0.45, 0.3], [-0.45, 0.35]].map(([u, v]) => [X + (u*len)*ca - (v*hb)*sa, Y + (u*len)*sa + (v*hb)*ca]);
      rsPoly(x, [[X - len*0.9, Y + hb*0.3], [X - len*0.4, Y - hb*0.1], [X + len*0.1, Y + hb*0.1], [X - len*0.5, Y + hb*0.6]], rsCss(rgLit(V, [86, 70, 56], day, haze, AIR)));
      rsPoly(x, hull, rsCss(c.body)); rsPoly(x, [hull[1], hull[2], hull[3], [X, Y - hb*0.3]], rsCss(c.lit));
      rsPoly(x, [[X - len*0.15*ca, Y - len*0.15*sa - hb*0.8], [X - len*0.3*ca, Y - len*0.3*sa - hb*1.9], [X - len*0.05*ca, Y - len*0.05*sa - hb*0.9]], rsCss(c.dark));
      for(let q = 0; q < 3; q++){ x.fillStyle = rsCss(c.glow, 0.5 + 0.4*night); x.fillRect(X + (q - 1)*len*0.12*ca - hb*0.1, Y + (q - 1)*len*0.12*sa - hb*0.55, Math.max(rgPx(1), hb*0.18), Math.max(rgPx(1), hb*0.12)); }
      const smoke = rgLit(V, [90, 88, 92], day, haze, AIR); for(let q = 0; q < 6; q++){ const r = hb*(0.5 + q*0.35), sx = X + len*0.2 + q*hb*0.5*sd, sy = Y - hb - q*hb*1.1;
        x.fillStyle = rsCss(smoke, 0.55 - q*0.07); x.beginPath(); for(let v = 0; v < 6; v++){ const t = v/6*Math.PI*2; x[v ? 'lineTo' : 'moveTo'](sx + Math.cos(t)*r, sy + Math.sin(t)*r*0.8); } x.closePath(); x.fill(); }
      rgGlow(x, X + len*0.15, Y - hb*0.2, hb*2, [255, 140, 60], 0.5); }
    else if(o.kind === 'sh'){ if(o.d < W*0.25) return; const sb = at(o.a, o.z, e + o.up); if(!sb) return; const len = W*(0.003 + 0.01*o.h)*F/sb[2]; if(len < 2) return;
      const [SX, SY] = sb, dir = o.h2 < 0.5 ? -1 : 1, hb = len*0.11, hull = rgLit(V, [150, 156, 172], day, haze*0.8, AIR), top = rsMix(hull, [255, 250, 240], 0.3), under = rsMix(hull, BLACK, 0.35);
      const g = x.createLinearGradient(SX - dir*len*0.5, SY, SX - dir*len*5, SY + len*0.2); g.addColorStop(0, rsCss(c.glow, 0.55)); g.addColorStop(1, rsCss(c.glow, 0));
      x.strokeStyle = g; x.lineWidth = Math.max(rgPx(0.8), hb*0.5); x.beginPath(); x.moveTo(SX - dir*len*0.5, SY); x.lineTo(SX - dir*len*5, SY + len*0.2); x.stroke();
      const P2 = (u, v) => [SX + dir*u*len, SY + v*hb];
      rsPoly(x, [P2(0.5, 0), P2(0.2, -1), P2(-0.45, -0.8), P2(-0.5, 0), P2(-0.45, 0.7), P2(0.2, 0.8)], rsCss(under));
      rsPoly(x, [P2(0.5, 0), P2(0.2, -1), P2(-0.45, -0.8), P2(-0.5, -0.1), P2(0.3, -0.1)], rsCss(top));
      rsPoly(x, [P2(-0.2, -0.8), P2(-0.42, -2.2), P2(-0.48, -0.8)], rsCss(hull)); rsPoly(x, [P2(-0.15, 0.6), P2(-0.4, 1.8), P2(-0.45, 0.6)], rsCss(under));
      x.fillStyle = rsCss(c.glow2, 0.9); x.fillRect(Math.min(P2(0.25, 0)[0], P2(0.35, 0)[0]), SY - hb*0.55, len*0.1, Math.max(rgPx(1), hb*0.3));
      rgGlow(x, P2(-0.52, 0)[0], SY, hb*3, c.glow, 0.9); }
    else if(o.kind === 'sa' || o.kind === 'br'){ // from wall top to wall top across the band: a great arch (broken in ruin), or a straight bar of light
      const N = 24, outer = [], inner = [], th = W*0.012, Hw = L.Hw;
      for(let q = 0; q <= N; q++){ const zq = -W/2 + W*q/N, u = (2*zq/W), lift = o.kind === 'sa' ? Hw + W*(0.12 + 0.12*o.h)*Math.sqrt(Math.max(0, 1 - u*u)) : Hw*(0.55 + 0.3*o.h);
        const A = at(o.a, zq, lift), B = at(o.a, zq, lift - th*(o.kind === 'sa' ? 1 + 1.2*u*u : 0.3)); if(!A || !B) return; outer.push(A); inner.push(B); }
      if(o.kind === 'br'){ x.save(); x.globalCompositeOperation = 'screen'; for(const [wd, al] of [[4, 0.07], [1.8, 0.16], [0.8, 0.5]]){ x.strokeStyle = rsCss(c.glow, al); x.lineWidth = Math.max(rgPx(0.8), Math.abs(outer[12][1] - inner[12][1])*wd);
          x.beginPath(); outer.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.stroke(); } x.restore(); return; }
      const gap = o.w === 'ruins' ? [Math.floor(N*0.35 + o.h*4), Math.floor(N*0.6 + o.h*3)] : null;
      for(let q = 0; q < N; q++){ if(gap && q >= gap[0] && q < gap[1]) continue; rsPoly(x, [outer[q], outer[q + 1], inner[q + 1], inner[q]], rsCss(q % 2 ? c.body : rsMix(c.body, c.dark, 0.35))); }
      if(o.w !== 'ruins'){ x.strokeStyle = rsCss(c.glow, 0.7); x.lineWidth = Math.max(rgPx(0.8), Math.abs(outer[12][1] - inner[12][1])*0.15); x.beginPath(); inner.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.stroke(); } }
}
// SMALL LIFE (Ruby: "insects, fairies, flowers, slime creatures … all subtle"): never more than a few marks, small for
// their distance and quiet in colour, so they are found rather than seen. Each kind at the ground point (X, Y), at
// h, the height a body would stand there.
function rgSmallLife(x, X, Y, h, kind, c, R){
  // (each mark has a floor in the export's pixels: smaller than that, a find is not subtle but missing)
  const rnd = (a, b) => a + (b - a)*R(), dot = (cx, cy, r, lo, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, Math.max(rgPx(lo), r), 0, Math.PI*2); x.fill(); };
  if(kind === 'insects'){ // a small cloud of specks over the grass, a pair of wings catching the light on the nearer
    const n = 3 + Math.floor(R()*5), cy = Y - h*rnd(0.5, 1.2);
    for(let q = 0; q < n; q++){ const ix = X + (R() - 0.5)*h*1.4, iy = cy + (R() - 0.5)*h*0.6; dot(ix, iy, h*0.04, 1.9, rsCss(c.dark, 0.8));
      if(h > rgPx(40) && R() < 0.5){ x.strokeStyle = rsCss(c.lit, 0.45); x.lineWidth = Math.max(rgPx(0.8), h*0.012); x.beginPath(); x.moveTo(ix - h*0.06, iy - h*0.04); x.lineTo(ix, iy); x.lineTo(ix + h*0.06, iy - h*0.04); x.stroke(); } }
    return; }
  if(kind === 'fairies'){ // a few points of light drifting low, each with a faint trail behind it
    const n = 1 + Math.floor(R()*3);
    for(let q = 0; q < n; q++){ const fx = X + (R() - 0.5)*h*2, fy = Y - h*rnd(0.4, 1.4), dx = (R() < 0.5 ? -1 : 1)*Math.max(rgPx(4), h*0.18);
      rgGlow(x, fx, fy, Math.max(rgPx(12), h*0.32), c.glow, 0.4);
      for(let t = 1; t <= 3; t++) dot(fx - dx*t, fy + dx*0.15*t*t*Math.sign(dx), h*0.025*(1 - t*0.22), 1 - t*0.2, rsCss(c.glow, 0.32/t));
      dot(fx, fy, h*0.04, 2.2, rsCss(rsMix(c.glow, [255, 255, 255], 0.6), 0.85)); }
    return; }
  if(kind === 'flowers'){ // a patch of small blossoms in the page's colours
    const n = 4 + Math.floor(R()*6);
    for(let q = 0; q < n; q++) dot(X + (R() - 0.5)*Math.max(rgPx(24), h*1.6), Y - h*rnd(0.02, 0.18), h*rnd(0.04, 0.07), 2.4, rsCss(c.flowers[Math.floor(R()*c.flowers.length)], 0.8));
    return; }
  // slime: one to three low, glistening mounds, half see-through, a highlight on each
  const n = 1 + Math.floor(R()*3);
  for(let q = 0; q < n; q++){ const sx = X + (R() - 0.5)*h*1.2, sw = Math.max(rgPx(7), h*rnd(0.18, 0.32)), sh = sw*rnd(0.45, 0.7);
    x.fillStyle = rsCss(c.slime, 0.68); x.beginPath(); x.ellipse(sx, Y, sw, sh, 0, Math.PI, Math.PI*2); x.fill();
    x.fillStyle = rsCss([255, 255, 255], 0.45); x.beginPath(); x.ellipse(sx - sw*0.3, Y - sh*0.55, sw*0.22, sh*0.16, -0.3, 0, Math.PI*2); x.fill(); }
}
function rgGlow(x, X, Y, r, col, a){ if(!(r > 0.5)) return; x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rsCss(col, a)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(X - r, Y - r, r*2, r*2); x.restore(); }

// ---------------- THE WORLD STORE ----------------
// Everything on the land within sight, as records in the world's own coordinates: { c (class), a, z (where), r (how far
// from where you stand), w (its world), kind (its sprite), hM, wM (its size in metres), rs (its own stream's seed) }.
// SOWN IN NESTED CELLS (the level-of-detail of a game's foliage, made so nothing ever jumps): level m's cells are 2^m
// times the finest, each holding the same few candidates, and level m reaches out to 2^(m+1) times the first radius.
// So near you every level's things stand together, far off only the coarser levels' (as dense on the screen at every
// depth), and a thing, once sown, is the same thing from wherever it is seen. Kept per world (`RG_KEPT_STORES`).
const RG_KEPT_STORES = new Map();
// WHAT STANDS WHERE (Ruby: "defining their relationships to each other so the generator places them in ways that make
// sense"): a lighthouse on a coast; windmills, turbines, castles and observatories on rises; barns and silos at a town's
// edge, among fields; cathedrals, mosques and clock towers at its heart; geodomes and landing pads on the flat. Kinds not
// named stand wherever their world builds (ground: rgStore's `ground`; ci: how much of a city stands here, 0 to 1)
const RG_PLACE = { lighthouse: { coast: true }, windmill: { rise: 0.4 }, turbine: { rise: 0.6 }, castle: { rise: 0.3 }, observatory: { rise: 0.6 },
  barn: { edge: 0.35 }, silo: { edge: 0.35 }, cathedral: { heart: 0.7 }, mosque: { heart: 0.7 }, clock: { heart: 0.6 }, geodome: { flat: 0.25 }, pagoda: { rise: 0 },
  radiomast: { rise: 0.5 }, gasstation: { edge: 0.4, flat: 0.3 }, motel: { edge: 0.45 }, elevator: { edge: 0.5 }, greenhouse: { flat: 0.25 }, chapel: { rise: 0 } };
function rgFits(kind, g, ci){ const P = RG_PLACE[kind]; if(!P) return true;
  if(P.coast && !g.coast) return false; if(P.rise != null && g.rise < P.rise) return false; if(P.edge != null && ci > P.edge) return false;
  if(P.heart != null && ci < P.heart) return false; if(P.flat != null && g.slope > P.flat) return false; return true; }
// THE ROADS a world lays (one along the ring, one across it, by the seed), shared by the land that paints them and the
// store that sets boards beside them
const RG_ROADS = { cities: ['road', 1], neon: ['neon', 1], builders: ['path', 0.8], ruins: ['broken', 0.6], magic: ['ley', 0.6], wilds: ['trail', 0.45] };
function rgRoadsOf(V){ const s = V.seed | 0, W = V.W, roads = [];
  const zr = (mnHash(s, 31, 7) - 0.5)*W*0.6, w1 = V.worldAt(0.5*W, zr), ar = (0.15 + 0.5*mnHash(s, 32, 7))*W*(mnHash(s, 33, 7) < 0.5 ? -1 : 1), w2 = V.worldAt(ar, 0);
  if(mnHash(s, 34, 7) < RG_ROADS[w1][1]*(0.3 + 0.6*V.works)) roads.push({ along: true, at: zr, w: w1, kind: RG_ROADS[w1][0] });
  if(mnHash(s, 35, 7) < RG_ROADS[w2][1]*(0.15 + 0.45*V.works)) roads.push({ along: false, at: ar, w: w2, kind: RG_ROADS[w2][0] });
  return roads; }
// the small things wider than they are tall, kept back from the very front of the view so a gate or a wall never fills it
const RG_WIDE = ['gate', 'wall', 'hedge', 'fence', 'container', 'solar', 'pipes', 'traps', 'haybale', 'bench', 'parked', 'hulk', 'rubble', 'statue', 'dolmen'];
// which tradition the wilds build in here: the cold north's, the dry country's, the jungle's, else the temperate land's,
// each region its own by the seed
function rgVernacular(V, a, z){ const W = V.W, s = V.seed | 0, dr = V.dryAt(a, z), e = V.T.true(a, z, W*0.01), r = mnValue(a/(W*0.35) + 5.5, z/(W*0.35) - 1.3, s + 51);
  if(e > V.TR.snow*0.45) return 'north'; if(dr > 0.6) return ['steppe', 'savanna', 'mesa'][Math.floor(r*2.999)];
  if(mnValue(a/(W*0.5) + 9.1, z/(W*0.5) + 1.7, s + 31) > 0.64 && dr < 0.5) return 'tropic'; return ['shire', 'prairie', 'apulia', 'galicia', 'kyo'][Math.floor(r*4.999)]; }
// A STONE CIRCLE (Ruby: "five square things in a row … I don't even know what it's supposed to be"): stones of two and a
// half to seven metres round a ring fifteen to fifty-five across, each standing in the world where it stands, the far
// ones first; some gone, one now and then fallen, some joined by lintels (docs/prior-art/ringworld-sprites.md, Part C
// §2). P(a, z) is where a world point meets the screen: [X, Y, px per metre, depth]
function rgHenge(x, o, P, c, R, px){
  const st = []; for(let q = 0; q < o.n; q++){ const t = q/o.n*Math.PI*2 + (R() - 0.5)*0.15, p = P(o.a + Math.cos(t)*o.rr, o.z + Math.sin(t)*o.rr);
    st.push({ p, q, gone: R() < 0.15, fall: R() < 0.1, hq: o.hm*(0.65 + 0.35*R()), lin: R() < 0.4, rs: (R()*4294967296) >>> 0 }); }
  const top = new Map(), up = s2 => s2.p && !s2.gone && !s2.fall;
  for(const s2 of st.filter(s3 => s3.p && !s3.gone).sort((A, B) => B.p[3] - A.p[3])){ const h = s2.hq*s2.p[2];
    if(s2.fall){ pkStone(x, s2.p[0], s2.p[1], h*0.3, c, mulberry32(s2.rs), px, { wide: 2.6 }); continue; }
    pkStone(x, s2.p[0], s2.p[1], h, c, mulberry32(s2.rs), px); top.set(s2.q, [s2.p[0], s2.p[1] - h*0.93, h]);
    // (a lintel over this stone and its neighbour, laid once both stand, by the nearer of the two)
    for(const nb of [st[(s2.q + 1) % o.n], st[(s2.q + o.n - 1) % o.n]]){ const A = top.get(s2.q), B = top.get(nb.q), lead = nb.q === (s2.q + 1) % o.n ? s2 : nb;
      if(B && lead.lin && up(nb) && Math.abs(A[0] - B[0]) < (A[2] + B[2])*0.38 && Math.abs(A[1] - B[1]) < Math.min(A[2], B[2])*0.25) pkLintel(x, A[0] < B[0] ? A : B, A[0] < B[0] ? B : A, Math.min(A[2], B[2])*0.13, c); } } }
// the town's furniture that stands along the streets (never scattered), and the things the ruins half bury
// THE WAYS' MATERIALS by world (and how often each), their half-widths in metres, their colours, and which are lit
const RG_WAYMAT = { cities: [['asphalt', 6], ['cobble', 1.2], ['brick', 1]], neon: [['asphalt', 1]], ruins: [['asphalt', 3], ['gravel', 1], ['cobble', 0.6]],
  wilds: [['earth', 3], ['gravel', 2], ['flag', 0.6]], magic: [['flag', 2], ['moss', 1.5], ['earth', 1]], builders: [['light', 2], ['pale', 1.5]] };
const RG_WAYHALF = { asphalt: 4, cobble: 3, brick: 3, gravel: 2.2, earth: 1.5, flag: 1.6, moss: 1.2, light: 2.2, pale: 3, ley: 1.5 };
const RG_WAYCOL = { asphalt: [92, 92, 98], cobble: [138, 128, 116], brick: [150, 86, 66], gravel: [176, 166, 146], earth: [150, 124, 92], flag: [168, 164, 152], moss: [104, 128, 86], light: [214, 220, 230], pale: [214, 210, 196] };
const RG_LIT_WAYS = ['asphalt', 'cobble', 'brick', 'pale', 'flag'];
const RG_STREET_KINDS = ['lamp', 'hydrant', 'busstop', 'phonebox', 'vending', 'signal', 'kiosk', 'cart', 'parked', 'scooter'];
const RG_SINKS = ['hulk', 'column', 'statue', 'container', 'bicycle', 'barrel', 'crate', 'traps'];
function rgStore(V){
  const { L, W, T, TR } = V, s = V.seed | 0;
  const key = [s, V.world.list.join('+'), V.forms, V.life, V.works, V.clutter, W.toFixed(6), L.z0.toFixed(6)].join('|');
  const kept = RG_KEPT_STORES.get(key); if(kept) return kept;
  const out = [];
  const sow = (id, c0, B0, rMax, cap, fn) => {
    for(let m = 0; m < 12; m++){ const hi = Math.min(rMax, B0*Math.pow(2, m + 1)), c = c0*Math.pow(2, m);
      const i0 = Math.floor(-hi/c) - 1, i1 = Math.ceil(hi/c) + 1, j0 = Math.floor((L.z0 - hi)/c) - 1, j1 = Math.ceil((L.z0 + hi)/c) + 1;
      for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){
        const ac = (i + 0.5)*c, zc = (j + 0.5)*c; if(Math.hypot(ac, zc - L.z0) - c > hi) continue;
        for(let q = 0; q < cap; q++){ const R = rgRand(s, id*16 + m, i*2048 + q, j), a = (i + R())*c, z = (j + R())*c;
          if(Math.abs(z) > W*0.485) continue; const r = Math.hypot(a, z - L.z0); if(r >= hi) continue;
          const o = fn(a, z, r, R); if(o){ o.a = a; o.z = z; o.r = r; o.rs = (R()*4294967296) >>> 0; out.push(o); } } }
      if(hi >= rMax) break; } };
  // THE GROUND at a point, as the placing rules read it: its height, how steep, whether it is under water, whether water
  // is near (a coast), and how it stands against the land round it (a rise or a hollow), in the land's own units
  const ground = (a, z) => { const d = W*0.004, e = T.true(a, z, d), ex = T.true(a + d, z, d) - T.true(a - d, z, d), ez = T.true(a, z + d, d) - T.true(a, z - d, d);
    const slope = Math.hypot(ex, ez)/(2*d), wet = e <= TR.sea; let coast = false, ring = 0;
    for(let q = 0; q < 6; q++){ const an = q/6*Math.PI*2, ca = Math.cos(an), sa = Math.sin(an), en = T.true(a + ca*W*0.012, z + sa*W*0.012, d); if(en <= TR.sea) coast = true; ring += T.true(a + ca*W*0.03, z + sa*W*0.03, W*0.01); }
    return { e, slope, wet, coast, rise: (e - ring/6)/(W*0.002) }; };
  // TREES: where the forests are, each kind by its world and the land's climate (dry country, warm, jungle, the cold
  // heights, the fey places of a magic world), sized by its kind
  const floraAt = (w, a, z) => { if(w === 'ruins') return PK_TREES.ruins;
    if(w === 'magic') return mnValue(a/(W*0.25) + 4.4, z/(W*0.25) - 2.2, s + 37) > 0.5 ? PK_FLORA.fey : PK_TREES.magic;
    const dr = V.dryAt(a, z), e = T.true(a, z, W*0.01);
    if(e > TR.snow*0.45) return PK_FLORA.cold; if(dr > 0.6) return PK_FLORA.dry; if(dr > 0.5) return PK_FLORA.warm;
    return mnValue(a/(W*0.5) + 9.1, z/(W*0.5) + 1.7, s + 31) > 0.64 ? PK_FLORA.jungle : PK_TREES.wild; };
  // THE WAYS (Ruby: streets and paths "should be related to works … able to be destroyed … fairly uncommon … made out of
  // different materials … curved, and they should follow the contour of the land a little bit"): the main roads the world
  // lays, and in its towns (as many as Works builds) a few ways out from each one's heart and one on to the next town;
  // each walked across the land a step at a time, turning toward the level and away from the steep (and toward where it
  // goes); each of one of its world's materials, and worn: cracked and weeded, broken right through in the ruins
  const M = W*0.00025, CL = 2.4*V.clutter*V.clutter, ways = [], BIN = W*0.006, bins = new Map();
  const townAt = (w, a, z) => w === 'wilds' || w === 'magic' ? V.cityAt(a, z, 0.12) : V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works));
  const inTown = (w, a, z) => townAt(w, a, z) > (w === 'wilds' || w === 'magic' ? 0.08 : 0.2);
  const pickMat = (w, R) => { const L2 = RG_WAYMAT[w] || RG_WAYMAT.wilds; let t = 0; for(const [, q] of L2) t += q; let u = R()*t; for(const [k, q] of L2){ u -= q; if(u < 0) return k; } return L2[0][0]; };
  const angD = (p, q) => { let d = p - q; while(d > Math.PI) d -= 2*Math.PI; while(d < -Math.PI) d += 2*Math.PI; return d; };
  const walk = (a, z, th, len, step, goal, R) => { const pts = [[a, z]]; let h0 = T.true(a, z, W*0.002);
    for(let u = 0; u < len; u += step){ let best = null, bc = Infinity;
      for(const dl of [-0.3, -0.15, 0, 0.15, 0.3]){ const t2 = th + dl, a2 = a + Math.cos(t2)*step, z2 = z + Math.sin(t2)*step; if(Math.abs(z2) > W*0.47) continue; const h = T.true(a2, z2, W*0.002); if(h <= TR.sea) continue;
        const cost = Math.abs(h - h0)/step*10 + Math.abs(dl)*0.5 + (goal ? Math.abs(angD(Math.atan2(goal[1] - z2, goal[0] - a2), t2))*0.9 : 0) + (R() - 0.5)*0.2; if(cost < bc){ bc = cost; best = [a2, z2, t2, h]; } }
      if(!best) break; [a, z, th, h0] = best; pts.push([a, z]); if(goal && Math.hypot(goal[0] - a, goal[1] - z) < step*1.5) break; }
    return pts; };
  const addWay = (pts, mat, w, main, R) => { if(pts.length < 3) return; const dec0 = w === 'ruins' ? 0.5 + 0.3*R() : R() < 0.2 ? 0.25 + 0.3*R() : 0.05*R(), so = R()*100, P = []; let u = 0;
    pts.forEach(([a, z], i) => { if(i) u += Math.hypot(a - pts[i - 1][0], z - pts[i - 1][1]); P.push({ a, z, u, dec: dec0 + (mnValue(u/(W*0.008) + so, so*0.3, s + 64) - 0.5)*0.7 }); });
    const wy = { mat, w, half: RG_WAYHALF[mat]*(main ? 1.4 : 1)*M, pts: P, main, i: ways.length }; ways.push(wy);
    for(let i = 0; i + 1 < P.length; i++){ const k = Math.floor(P[i].a/BIN) + ',' + Math.floor(P[i].z/BIN); if(!bins.has(k)) bins.set(k, []); bins.get(k).push([wy, i]); } };
  // (the main roads, walked from end to end of the view)
  rgRoadsOf(V).forEach((rd, ri) => { const R = rgRand(s, 1300, ri), step = 20*M, mat = { road: 'asphalt', neon: 'asphalt', path: 'light', broken: 'asphalt', ley: 'ley', trail: 'earth' }[rd.kind];
    addWay(rd.along ? walk(-W*0.32, rd.at, 0, W*0.64, step, [W*0.32, rd.at], R) : walk(rd.at, -W*0.46, Math.PI/2, W*0.95, step, [rd.at, W*0.46], R), mat, rd.w, true, R); });
  // (the towns': from the heart of each town Works raises, two to five ways out, and one on to the nearest other town)
  const hubs = []; { const C = W*0.05, Rr = W*0.25; for(let i = Math.floor(-Rr/C); i <= Math.ceil(Rr/C); i++) for(let j = Math.floor((L.z0 - Rr)/C); j <= Math.ceil((L.z0 + Rr)/C); j++){
    const a = (i + 0.5)*C, z = (j + 0.5)*C; if(Math.abs(z) > W*0.46 || Math.hypot(a, z - L.z0) > Rr) continue; const w = V.worldAt(a, z), t = townAt(w, a, z); if(t < (w === 'wilds' || w === 'magic' ? 0.1 : 0.25)) continue;
    let top = true; for(const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const a2 = a + di*C, z2 = z + dj*C; if(townAt(V.worldAt(a2, z2), a2, z2) > t){ top = false; break; } }
    if(!top || T.true(a, z, W*0.003) <= TR.sea || mnHash(i, j, s + 65) > 0.15 + 0.7*V.works) continue; hubs.push([a, z, w, t]); } }
  hubs.forEach(([a, z, w, t], hi) => { const R = rgRand(s, 1310, hi), n = 2 + Math.floor(R()*(0.5 + 2.5*V.works)), mat = pickMat(w, R), step = (w === 'wilds' || w === 'magic' ? 14 : 12)*M;
    for(let k = 0; k < n; k++) addWay(walk(a, z, k/n*Math.PI*2 + R()*0.8, (120 + 380*R()*t)*M, step, null, R), k === 0 || R() < 0.7 ? mat : pickMat(w, R), w, false, R);
    let near = null, nd = Infinity; hubs.forEach((h2, hj) => { if(hj <= hi) return; const d = Math.hypot(h2[0] - a, h2[1] - z); if(d < nd){ nd = d; near = h2; } });
    if(near && nd < 1400*M) addWay(walk(a, z, Math.atan2(near[1] - z, near[0] - a), nd*1.6, step*1.5, [near[0], near[1]], R), w === 'ruins' ? 'gravel' : w === 'cities' || w === 'neon' ? 'asphalt' : 'earth', w, false, R); });
  // how far a point stands from the nearest way's edge (so buildings, trees and what is scattered keep off them)
  const wayGap = (a, z) => { const bi = Math.floor(a/BIN), bj = Math.floor(z/BIN); let best = Infinity;
    for(let di = -1; di <= 1; di++) for(let dj = -1; dj <= 1; dj++){ const L2 = bins.get((bi + di) + ',' + (bj + dj)); if(!L2) continue;
      for(const [wy, i] of L2){ const p = wy.pts[i], q = wy.pts[i + 1], dx = q.a - p.a, dz = q.z - p.z, l2 = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((a - p.a)*dx + (z - p.z)*dz)/l2));
        best = Math.min(best, Math.hypot(a - p.a - dx*t, z - p.z - dz*t) - wy.half); } }
    return best; };
  const offWay = (a, z, room) => wayGap(a, z) > room;
  // a walk along a way: every so far, a point on it, the way's normal there, how far along, and how worn
  const along = (wy, step, fn, start = step/2) => { const P = wy.pts; let next = start, i = 0;
    while(i + 1 < P.length){ const p = P[i], q = P[i + 1], du = (q.u - p.u) || 1; if(q.u < next){ i++; continue; } const t = (next - p.u)/du;
      fn(p.a + (q.a - p.a)*t, p.z + (q.z - p.z)*t, -(q.z - p.z)/du, (q.a - p.a)/du, next, p.dec); next += step; } };
  out.ways = ways;
  sow(1, W*0.0036, W*0.02, W*2.5, 4, (a, z, r, R) => {
    const w = V.worldAt(a, z), P = RG_PROF[w], tot = P.tr + P.de + P.gt; if(!tot) return null;
    // (fewer trees where a town stands, none under water)
    const town = V.cityAt(a, z, P.cv*(0.3 + 0.9*V.works)); if(T.true(a, z, W*0.004) <= TR.sea || !offWay(a, z, 2*M)) return null;
    if(R() > Math.min(1, V.forestAt(a, z)*V.life*1.25*tot)*(r < W*0.01 ? 0.35 : 1)*(1 - 0.85*town)) return null;
    const u = R()*tot, kind = u < P.de ? 'dead' : u < P.de + P.gt ? 'glow' : (T2 => T2[Math.floor(R()*T2.length)])(floraAt(w, a, z));
    return { c: 'tree', w, kind, hM: pkMetres(kind, R()) }; });
  // BUILDINGS: where the cities are (and in the wilds, a few villages and farms); each archetype chosen first, then sized
  // in metres (tall ones where the city is densest, as a downtown rises), so a house is a house and a tower a tower
  sow(2, W*0.009, W*0.03, W*3, 2, (a, z, r, R) => {
    const w = V.worldAt(a, z), P = RG_PROF[w], ci = w === 'wilds' ? 0.7*V.cityAt(a, z, 0.12*(0.3 + 0.9*V.works)) : V.cityAt(a, z, P.cv*(0.3 + 0.9*V.works));
    if(ci < 0.05 || R() > ci*(0.08 + 0.92*rsSmooth(W*0.012, W*0.07, r))) return null;
    // (what stands where: each kind on the ground it belongs on, RG_PLACE; a kind whose ground this isn't gives way to
    //  another of the style's, up to three tries, else nothing is built here)
    const g = ground(a, z); if(g.wet || g.slope > 0.9) return null;
    // (a village in the wilds builds in its region's own tradition, by its climate: PK_VERNACULAR)
    const fam = w === 'wilds' ? rgVernacular(V, a, z) : null;
    let kind = null; for(let t = 0; t < 3 && !kind; t++){ const k = fam ? pkVernacularOf(fam, R()) : pkArchOf(PK_STYLE[w], R()); if(rgFits(k, g, ci)) kind = k; } if(!kind) return null;
    const hM = pkMetres(kind, Math.pow(R(), 0.6 + 1.6*(1 - ci)))*(w === 'neon' ? 1.3 : 1), wM = pkMetres(kind, R(), 1);
    // (a city rises away from you: near, only what stands low; its towers further off, where they make a skyline)
    if(hM > 24 + 420*rsSmooth(W*0.03, W*0.45, r)) return null;
    if(!offWay(a, z, wM*M*0.5 + 2*M)) return null; // (a building fronts its way; it never stands in it)
    return { c: 'bldg', w, kind, hM, wM }; });
  // ROCKS: boulders where the land is rough
  // (boulders gather where the land is steep, as scree under a slope)
  sow(3, W*0.006, W*0.02, W*0.8, 2, (a, z, r, R) => { const w = V.worldAt(a, z), g = ground(a, z); if(g.wet || R() > RG_PROF[w].ro*V.forms*(0.4 + 0.9*Math.min(1, g.slope))) return null; return { c: 'rock', w, kind: 'rock', hM: pkMetres('rock', R()) }; });
  // GRASS AND FLOWERS near you
  sow(4, W*0.0012, W*0.004, W*0.05, 3, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > RG_PROF[w].gr*V.life*1.4) return null; return { c: 'grass', w, kind: 'grass', hM: pkMetres('grass', R()) }; });
  // SMALL LIFE lives on some rings, not all: insects, fairies, flowers and slime, each world its own mix
  { const beMax = Math.max(...V.world.list.map(w => RG_PROF[w].be)), lively = mnHash(s, 41, 9) < 0.25 + 0.6*V.life*beMax;
    const MIX = { magic: [1, 3, 1, 1], wilds: [3, 1, 3, 1], ruins: [2, 0.5, 1, 3], neon: [1, 2, 0.5, 1], cities: [2, 0.5, 2, 0.5], builders: [2, 1, 2, 1] }, KINDS = ['insects', 'fairies', 'flowers', 'slime'];
    if(lively) sow(5, W*0.003, W*0.01, W*0.12, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.12*V.life*(0.3 + 0.7*RG_PROF[w].be)) return null;
      const mix = MIX[w] || [2, 1, 2, 1], tot = mix.reduce((p, q) => p + q, 0); let pick = R()*tot, ki = 0; while(ki < 3 && pick > mix[ki]){ pick -= mix[ki]; ki++; }
      return { c: 'life', w, kind: KINDS[ki] }; }); }
  // ROBOTS AND DROIDS, as life, where they belong (Ruby: "cute robots and threatening ones, in appropriate biomes
  // only"): the builders' helpers and drones, the neon's sentries and walkers, the ruins' scavengers, and now and then
  // a giant fallen long ago, kneeling in the grass
  { const BOTS = { builders: 0.2, neon: 0.14, cities: 0.07, ruins: 0.1, wilds: 0.012, magic: 0.015 };
    sow(6, W*0.004, W*0.012, W*0.3, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > (BOTS[w] || 0)*(0.3 + V.life)) return null;
      const g = ground(a, z); if(g.wet || g.slope > 1.2) return null; const L2 = PK_BOTS[w] || PK_BOTS.cities, kind = L2[Math.floor(R()*L2.length)];
      if(kind === 'derelict' && R() > 0.2) return null;
      return { c: 'bot', w, kind, hM: pkMetres(kind, R()) }; }); }
  // SMALL THINGS near you (Ruby: "small things that get found closer to the player"): fences and mailboxes in the wilds,
  // lamps, benches and bicycles in town, barrels and crates in the ruins, now and then a person, for scale
  // (each where it belongs: hay, a scarecrow, a tractor in the open fields; a well, a shrine, a mailbox by a village; a
  //  windpump and its trough on dry pasture; stone walls on the steep and dry, hedges on the low and wet; the town's
  //  furniture in town; wisps by water; the poles along the roads, below. The large ones are seen from further off)
  const propFits = (k, w, g, a, z, ci) => { const fo = V.forestAt(a, z), dr = V.dryAt(a, z);
    switch(k){ case 'haybale': case 'haystack': case 'scarecrow': case 'tractor': case 'beehives': case 'grainbin': return fo < 0.4 && g.slope < 0.3 && ci < 0.3;
      case 'windpump': case 'trough': return dr > 0.45 && g.slope < 0.35; case 'wall': return g.slope > 0.15 || dr > 0.5; case 'hedge': return dr < 0.55 && g.slope < 0.4;
      case 'well': case 'shrine': case 'mailbox': case 'wishing': return ci > 0.03; case 'busstop': case 'kiosk': case 'signal': case 'phonebox': case 'vending': case 'cart': return ci > 0.15;
      case 'wisp': return g.coast || g.rise < -0.2; case 'fairyring': return fo > 0.2 && g.slope < 0.25; case 'solar': case 'dish': return g.slope < 0.25; case 'pole': return false; default: return true; } };
  sow(7, W*0.002, W*0.006, W*0.05, 1, (a, z, r, R) => { const w = V.worldAt(a, z), P = RG_PROF[w], ci = V.cityAt(a, z, w === 'wilds' ? 0.12 : P.cv), near = 0.05 + 0.5*ci;
    if(R() > near*0.45*CL) return null; const g = ground(a, z); if(g.wet || g.slope > 0.8 || !offWay(a, z, 1.5*M)) return null;
    const L2 = (PK_PROPS[w] || PK_PROPS.cities).filter(k => !PK_PROPS_BIG.includes(k) && !RG_STREET_KINDS.includes(k)), kind = L2[Math.floor(R()*L2.length)]; if(!kind || (kind === 'figure' && R() > 0.4)) return null;
    if(!propFits(kind, w, g, a, z, ci)) return null; return { c: 'prop', w, kind, hM: pkMetres(kind, R()), sink: w === 'ruins' && RG_SINKS.includes(kind) ? 0.08 + 0.3*R() : 0 }; });
  sow(11, W*0.006, W*0.02, W*0.2, 1, (a, z, r, R) => { const w = V.worldAt(a, z), P = RG_PROF[w], ci = V.cityAt(a, z, w === 'wilds' ? 0.12 : P.cv);
    if(R() > (0.08 + 0.4*ci)*0.45*CL) return null; const g = ground(a, z); if(g.wet || g.slope > 0.6 || !offWay(a, z, 4*M)) return null;
    const L2 = (PK_PROPS[w] || PK_PROPS.cities).filter(k => PK_PROPS_BIG.includes(k) && !RG_STREET_KINDS.includes(k)); if(!L2.length) return null; const kind = L2[Math.floor(R()*L2.length)];
    if(!propFits(kind, w, g, a, z, ci)) return null; return { c: 'prop', w, kind, hM: pkMetres(kind, R()), sink: w === 'ruins' && RG_SINKS.includes(kind) ? 0.05 + 0.2*R() : 0 }; });
  // THE WAYS' FURNITURE (Ruby: "generated intelligently instead of just scattered"): where a way runs through town,
  // lamps along it lighting it, side to side; at its kerbs parked cars, a hydrant, a bench with a bicycle by it, a bus
  // stop, a food cart; now and then a signal, a sign, a phone box, vending machines, a kiosk; mailboxes along the village
  // lanes; in the ruins rusted cars sunk into the verge, barrels, tank traps across the way; out in the country, the
  // poles that carry the wires along the main roads. Each faces the way. All of it by Clutter
  for(const wy of ways){ const w = wy.w, R = rgRand(s, 1200, wy.i), kerb = wy.half + 1.6*M, side = () => R() < 0.5 ? 1 : -1;
    const put = (kind, a, z, nx, nz, sd2, off = 0, extra = {}) => { const a2 = a + nx*sd2*(kerb + off), z2 = z + nz*sd2*(kerb + off); if(Math.abs(z2) > W*0.485 || ground(a2, z2).wet) return null;
      const o = { c: 'prop', w, kind, hM: pkMetres(kind, R()), a: a2, z: z2, r: Math.hypot(a2, z2 - L.z0), rs: (R()*4294967296) >>> 0, face: Math.atan2(-nz*sd2, -nx*sd2), ...extra }; out.push(o); return o; };
    if(RG_LIT_WAYS.includes(wy.mat) && w !== 'wilds'){ let k = 0; along(wy, 25*M, (a, z, nx, nz, u, dec) => { k++; if(inTown(w, a, z) && dec < 0.7 && R() < Math.min(1, 0.3 + 1.4*V.clutter)) put('lamp', a, z, nx, nz, k % 2 ? 1 : -1); }); }
    along(wy, 16*M, (a, z, nx, nz, u, dec) => { const town = inTown(w, a, z);
      if((w === 'cities' || w === 'neon') && town){ if(R() < 0.1*CL) put('parked', a, z, nx, nz, side(), -0.7*M); if(R() < 0.04*CL) put('hydrant', a, z, nx, nz, side(), 0.4*M);
        if(R() < 0.035*CL){ const s2 = side(); put(R() < 0.35 ? 'busstop' : 'bench', a, z, nx, nz, s2, 1.6*M); if(R() < 0.6) put('bicycle', a + nz*3*M, z - nx*3*M, nx, nz, s2, 1.2*M); }
        if(w === 'neon' && R() < 0.05*CL) put('scooter', a, z, nx, nz, side(), 0.8*M); if(R() < 0.02*CL) put('cart', a, z, nx, nz, side(), 2.2*M);
        if(R() < 0.035*CL) put('signal', a, z, nx, nz, side(), 0.2*M); if(R() < 0.03*CL) put('sign', a, z, nx, nz, side(), 0.3*M); if(R() < 0.012*CL) put('phonebox', a, z, nx, nz, side(), 2*M);
        if(R() < 0.02*CL) put('vending', a, z, nx, nz, side(), 2*M); if(w === 'cities' && R() < 0.01*CL) put('kiosk', a, z, nx, nz, side(), 3*M); }
      if(w === 'ruins'){ if(R() < 0.07*CL) put('hulk', a, z, nx, nz, side(), -0.8*M, { sink: 0.1 + 0.3*R() }); if(dec > 0.5 && R() < 0.03*CL) put('traps', a, z, nx, nz, 1, -kerb);
        if(R() < 0.04*CL) put('barrel', a, z, nx, nz, side(), 0.8*M, { sink: 0.15*R() }); if(R() < 0.025*CL) put('bicycle', a, z, nx, nz, side(), 1*M, { sink: 0.2 + 0.3*R() }); }
      if((w === 'wilds' || w === 'magic') && town){ if(R() < 0.05*CL) put('mailbox', a, z, nx, nz, side(), 0.4*M); if(R() < 0.025*CL) put('bench', a, z, nx, nz, side(), 1.2*M); if(w === 'magic' && R() < 0.06*CL) put('lamp', a, z, nx, nz, side(), 0.3*M); } });
    // (the poles along a main road out of town, forty metres apart, each wired to the next)
    if(wy.main && wy.mat !== 'ley' && wy.mat !== 'light' && CL > 0.02){ const sd2 = mnHash(s, 70 + wy.i, 3) < 0.5 ? -1 : 1; let prev = null;
      along(wy, 40*M, (a, z, nx, nz) => { if(inTown(w, a, z) || Math.hypot(a, z - L.z0) > W*0.25){ prev = null; return; } const o = put('pole', a, z, nx, nz, sd2, 2.5*M); if(o && prev) prev.next = [o.a, o.z]; prev = o; }); } }
  // NODS (Ruby: "Easter eggs … that nod to both [Halo and Fallout] … rarely or commonly depending on how obnoxious they
  // are and seed dependently"): each on the ground its rule asks, by the seed; the loud ones rare (PK_EGGS)
  { const KINDS = Object.keys(PK_EGGS);
    const fits = (k, g, a, z, r, ci) => k === 'gate' ? g.rise > 0.4 || g.slope > 0.5 : k === 'cogdoor' ? g.slope > 0.15 && g.slope < 0.9 && ci < 0.1 : k === 'spire' ? g.rise > 0.6
      : k === 'pod' || k === 'suit' ? V.forestAt(a, z) < 0.35 && ci < 0.05 && g.slope < 0.4 : k === 'diner' || k === 'car' ? ci < 0.7 && g.slope < 0.35
      : k === 'caps' ? r < W*0.03 : true;
    sow(8, W*0.02, W*0.05, W*1.2, 1, (a, z, r, R) => { const w = V.worldAt(a, z), g = ground(a, z); if(g.wet) return null;
      const ci = V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works)), u = R(), mine = KINDS.filter(k2 => k2 !== 'caps' && PK_EGGS[k2].worlds.includes(w)); if(!mine.length) return null;
      const k = mine[Math.floor(R()*mine.length)], E = PK_EGGS[k];
      if(u > E.q*(0.5 + V.works)/0.85 || !fits(k, g, a, z, r, ci)) return null;
      return { c: 'egg', w, kind: k, hM: pkMetres(k, R()) }; });
    sow(9, W*0.0015, W*0.004, W*0.03, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(!PK_EGGS.caps.worlds.includes(w) || R() > PK_EGGS.caps.q) return null;
      return { c: 'egg', w, kind: 'caps', hM: pkMetres('caps', R()) }; }); }
  // BOARDS (Ruby: "a wider variety of billboards … tongue in cheek, referencing fake brands"): beside the roads, facing
  // the traffic, every sixty metres a place one might stand, each world its own (PK_BOARDS, the jokey ones rare); now and
  // then a serial verse, a board every thirty metres; and small signs (notices, posters, shingles) about the towns
  { const BOARD = { cities: 0.3, neon: 0.35, ruins: 0.22, wilds: 0.1, builders: 0.08, magic: 0.1 }, PK_SMALL_BOARDS = ['shingle', 'plate', 'sheet', 'bottle'], age = (w, R) => w === 'ruins' ? 0.5 + 0.5*R() : 0.4*R()*R();
    // (beside the main roads, every sixty metres a place a board might stand, facing the traffic; now and then, on a
    //  country road, a serial verse, a board every thirty metres)
    ways.filter(wy => wy.main).forEach(wy => { const R = rgRand(s, 1000, wy.i), w0 = wy.w, spots = [];
      along(wy, 30*M, (a, z, nx, nz) => spots.push([a, z, nx, nz]));
      for(let i = 0; i < spots.length; i += 2){ const [a0, z0, nx, nz] = spots[i], sd2 = R() < 0.5 ? -1 : 1, off = wy.half + (5 + 6*R())*M, a = a0 + nx*sd2*off, z = z0 + nz*sd2*off;
        if(Math.abs(z) > W*0.485) continue; const r = Math.hypot(a, z - L.z0); if(r > W*0.3) continue; const w = V.worldAt(a, z), g = ground(a, z); if(g.wet || g.slope > 0.6) continue;
        if((w === 'wilds' || w === 'ruins') && R() < 0.03*CL && i + 5 < spots.length){ const v = Math.floor(R()*PK_SERIALS.length), ag = age(w, R); // a serial verse
          for(let k = 0; k < 5; k++){ const [ak0, zk0, nkx, nkz] = spots[i + k], ak = ak0 + nkx*sd2*off, zk = zk0 + nkz*sd2*off; out.push({ c: 'board', w, kind: 'serial', v, k, aged: ag, hM: pkBoardSize('serial')[1], wM: pkBoardSize('serial')[0], a: ak, z: zk, r: Math.hypot(ak, zk - L.z0), rs: (R()*4294967296) >>> 0 }); }
          i += 6; continue; }
        if(R() > (BOARD[w] || 0)*CL) continue; const id = pkBoardOf(w, R()); if(!id || PK_SMALL_BOARDS.includes(PK_BOARDS[id].fmt)) continue;
        const [bw, bh] = pkBoardSize(id); out.push({ c: 'board', w, kind: id, aged: age(w, R), hM: bh, wM: bw, a, z, r, rs: (R()*4294967296) >>> 0 }); } });
    // (and the big boards where a town meets the country, on its approaches, where there is no road to stand by)
    sow(12, W*0.012, W*0.03, W*0.35, 1, (a, z, r, R) => { const w = V.worldAt(a, z), ci = w === 'wilds' ? V.cityAt(a, z, 0.12) : V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works));
      if(ci < 0.04 || ci > 0.75 || R() > (BOARD[w] || 0)*1.2*CL) return null; const g = ground(a, z); if(g.wet || g.slope > 0.45) return null;
      const id = pkBoardOf(w, R()); if(!id || PK_SMALL_BOARDS.includes(PK_BOARDS[id].fmt) || PK_BOARDS[id].fmt === 'map') return null; const [bw, bh] = pkBoardSize(id); return { c: 'board', w, kind: id, aged: age(w, R), hM: bh, wM: bw }; });
    sow(10, W*0.003, W*0.01, W*0.08, 1, (a, z, r, R) => { const w = V.worldAt(a, z), ci = V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works)); if(R() > 0.045*ci*CL) return null;
      const g = ground(a, z); if(g.wet || g.slope > 0.5) return null; const id = pkBoardOf(w, R()); if(!id || !(PK_SMALL_BOARDS.includes(PK_BOARDS[id].fmt) || PK_BOARDS[id].fmt === 'map')) return null;
      const [bw, bh] = pkBoardSize(id); return { c: 'board', w, kind: id, aged: age(w, R), hM: bh, wM: bw }; }); }
  // STONE CIRCLES near enough to walk to, now and then, on open ground in the wilds and where there is magic (and fallen
  // ones in the ruins)
  sow(13, W*0.03, W*0.06, W*0.25, 1, (a, z, r, R) => { const w = V.worldAt(a, z), p = { wilds: 0.07, magic: 0.12, ruins: 0.035 }[w] || 0; if(R() > p*(0.4 + V.works)) return null;
    const g = ground(a, z); if(g.wet || g.slope > 0.3 || V.forestAt(a, z) > 0.5 || V.cityAt(a, z, 0.12) > 0.05) return null;
    return { c: 'henge', w, n: 9 + Math.floor(R()*14), rr: W*0.00025*(7 + 20*R()), hm: 2.5 + 4.5*R(), wM: 60 }; });
  RG_KEPT_STORES.set(key, out); if(RG_KEPT_STORES.size > 4) RG_KEPT_STORES.delete(RG_KEPT_STORES.keys().next().value);
  return out;
}

// ---------------- THE LAND ----------------
// How it is painted (Ruby, from game development: "figure out what's in front, and what's occluding what … sort objects
// … draw back to front, avoiding drawing things that are occluded and partially masking things that are part
// occluded"):
//   1. THE RIDGES: the land cut across the view at depths ever closer together, each cut a painter's range (its crest
//      the land's true height there), found first, all of them, before anything is painted;
//   2. THE OCCLUSION HORIZON: for each ridge, the highest of the nearer crests in each column of the screen; whatever
//      lies wholly below it is hidden, and is never drawn;
//   3. THE THINGS: trees, buildings, rocks, grass, works and finds, each standing at its own place in the WORLD (a
//      cell of the floor, finer near and coarser far, keyed by where it is), so turning the camera turns past them and
//      they stay put; each sized in metres (paintKit's PK_SIZE) by one ruler, px per metre at its distance;
//   4. BACK TO FRONT: each ridge, then what stands between it and the next nearer one, far to near; nearer ridges then
//      mask what they partly hide. A thing stands on the ground that shows: never above the farther crest.
// Kept plain on purpose: a game exploring the ring would do the same, in real time (OPEN-ISSUES §5).
function rgPaintLand(x, mk, dk, V){
  rgPx = V.px;
  const { L, W, ww, wh, unit, F, at, T, TR, px, hx, hz } = V, BLACK = [0, 0, 0], s = V.seed | 0;
  const LT = V.sun.LT, sd = V.sun.sd, cth = Math.cos(V.th), AIR = rgAirOf(V, V.dayHere);
  const K = 16, d0 = Math.max(L.hc*2.2, W*0.0012), d1 = W*4, dOf = k => d0*Math.pow(d1/d0, k/(K - 1));
  // THE VIEW'S REACH (Ruby: "make the drawing script aware of the view frustum"): how far round from the heading the page
  // sees, its corners included (the painter's perspective: a radius on the page of 2F·tan(θ/2)); every cut of the land
  // runs that far round, so a wide lens never shows its ends. A cut is straight ahead, as Ruby likes the ridges, and
  // bends round the eye as a circle past 55°, where a straight cut could never reach the page's sides
  const half = Math.hypot(ww/2, wh/2)/unit/L.f, PHI = Math.min(2.55, 2*Math.atan(half/2)*1.06 + 0.06), C0 = Math.cos(55*Math.PI/180);
  const smax = c => 0.5*(c + C0 + Math.sqrt((c - C0)*(c - C0) + 0.01)), Sof = d => d*Math.max(Math.tan(Math.min(PHI, 1.1)), PHI)*1.1 + W*0.002;
  // a floor point's place in the cuts' terms: its angle from the heading, and the depth of the cut it lies on
  const angOf = (a, z) => Math.atan2(-a*hz + (z - L.z0)*hx, a*hx + (z - L.z0)*hz), cutOf = (a, z) => Math.hypot(a, z - L.z0)*smax(Math.cos(angOf(a, z)));
  // where the heading meets a wall (looking across): no ridge lies beyond it
  const dWall = Math.abs(hz) > 1e-4 ? ((hz > 0 ? W/2 : -W/2) - L.z0)/hz : Infinity;
  const hazeOf = d => V.air*(1 - Math.exp(-d/(W*1.3)));
  // a point of the floor in the view's terms: how far ahead, how far aside
  const ahead = (a, z) => a*hx + (z - L.z0)*hz, aside = (a, z) => -a*hz + (z - L.z0)*hx;
  // the land's own noise for a ridge's facets: smooth in the world, so a facet changes as the cut moves, never jumps
  const wn = (a, z, ws, salt) => mnValue(a/ws + salt*3.17, z/ws - salt*1.93, s + 900 + salt);

  // ---- 1. THE RIDGES ----
  const lay = [];
  for(let k = K - 1; k >= 0; k--){
    let d = dOf(k); if(d > dWall*1.02){ if(k === 0 || dOf(k - 1) <= dWall*1.02) d = dWall*0.995; else continue; }
    const Sd = Sof(d), M = PHI > 1.2 ? 140 : 96, pts = [], fine = 2*Sd/M*1.3;
    for(let i = 0; i < M; i++){ const ph = -PHI + 2*PHI*i/(M - 1), r = d/smax(Math.cos(ph)), fw = r*Math.cos(ph), sl = r*Math.sin(ph), a = fw*hx - sl*hz, z = Math.max(-W*0.497, Math.min(W*0.497, L.z0 + fw*hz + sl*hx)), er = T(a, z, fine), e = Math.max(er, TR.sea), p = at(a, z, e);
      if(p) pts.push({ X: p[0], Y: p[1], zc: p[2], a, z, e, ec: er <= TR.sea ? TR.sea : Math.max(TR.sea + 1e-9, T.true(a, z, fine)), sea: er <= TR.sea }); }
    if(pts.length < 2) continue;
    if(pts[0].X > pts[pts.length - 1].X) pts.reverse();
    lay.push({ k, d, Sd, pts, ws: 4*Sd/M });
  }
  // ---- 2. THE OCCLUSION HORIZON: each ridge's crest in columns of the screen, and the nearer crests' highest ----
  const CW = Math.max(1, ww/320), NC = Math.ceil(ww/CW) + 1;
  for(const l of lay){ const c = new Float32Array(NC).fill(Infinity), P = l.pts;
    for(let q = 0; q + 1 < P.length; q++){ const A = P[q], B = P[q + 1], c0 = Math.max(0, Math.ceil(A.X/CW)), c1 = Math.min(NC - 1, Math.floor(B.X/CW));
      for(let ci = c0; ci <= c1; ci++){ const t = (ci*CW - A.X)/((B.X - A.X) || 1); c[ci] = Math.min(c[ci], A.Y + (B.Y - A.Y)*t); } }
    l.crest = c; }
  for(let i = lay.length - 1, near = new Float32Array(NC).fill(Infinity); i >= 0; i--){ lay[i].near = near.slice(); const c = lay[i].crest; for(let ci = 0; ci < NC; ci++) near[ci] = Math.min(near[ci], c[ci]); }
  const col = X => Math.max(0, Math.min(NC - 1, Math.round(X/CW)));
  // which ridge a depth stands behind (the drawing order puts it after that ridge, before the next nearer)
  const slot = dd => { let j = -1; for(let i = 0; i < lay.length; i++) if(lay[i].d >= dd) j = i; else break; return j; };
  // is a thing from X0 to X1, its top at Yt, hidden by the ridges nearer than it? (all its columns covered)
  const hidden = (l, X0, X1, Yt) => { if(X1 < 0 || X0 > ww) return true; const n = l ? l.near : null; if(!n) return false;
    for(let ci = col(Math.max(0, X0)), c1 = col(Math.min(ww, X1)); ci <= c1; ci++) if(!(n[ci] <= Yt)) return false; return true; };
  // WHAT NEARER THINGS HIDE: first every thing is measured, nearest first, and the solid heart of each (a crown's
  // middle, a building's lower body, a boulder's) is laid in its columns; a farther thing wholly inside what is laid
  // there, or below the nearer ridges, is never drawn. Then they are painted, farthest first (vis: measured, then told)
  const covT = new Float32Array(NC).fill(Infinity), covB = new Float32Array(NC).fill(-Infinity); let painting = false, cur = null;
  const vis = (l, X0, X1, Yt, Yb, oc) => { if(painting) return cur.ok;
    let ok = false; if(!(X1 < 0 || X0 > ww || Yb < 0 || Yt > wh)){ const n = l ? l.near : null;
      for(let ci = col(Math.max(0, X0)), c1 = col(Math.min(ww, X1)); ci <= c1; ci++) if(!((n && n[ci] <= Yt) || (covT[ci] <= Yt && covB[ci] >= Yb))){ ok = true; break; } }
    cur.ok = ok;
    if(ok && oc) for(let ci = col(Math.max(0, oc[0])), c1 = col(Math.min(ww, oc[1])); ci <= c1; ci++){
      if(covT[ci] === Infinity || (oc[2] <= covB[ci] && oc[3] >= covT[ci])){ covT[ci] = Math.min(covT[ci], oc[2]); covB[ci] = Math.max(covB[ci], oc[3]); }
      else if(oc[3] - oc[2] > covB[ci] - covT[ci]){ covT[ci] = oc[2]; covB[ci] = oc[3]; } }
    return false; };
  // the ground that shows: never above the farther crest (between two cuts the land is painted as the farther one's face)
  const stand = (l, X, Y) => { if(!l) return Y; const c = l.crest[col(X)]; return c < Infinity && Y < c ? c + px(0.5) : Y; };

  // ---- 3. THE THINGS ----
  const things = []; // { dd, draw(l) }
  // (a thing is kept while any of it can be in view: its angle within the view's reach by as much as its own width)
  const keep = (a, z, w0 = 0) => { const r = Math.hypot(a, z - L.z0), ph = angOf(a, z), dd = r*smax(Math.cos(ph)); if(dd <= 0 || dd > dWall*1.02) return null;
    if(Math.abs(ph) > PHI + Math.atan2(w0 + W*0.0005, Math.max(r, 1e-9))) return null; return dd; };
  const colsOf = (w, day, haze) => { const lights = V.lightsOf(w), g = lights[0], g2 = lights[1];
    const metal = w === 'ruins' ? [120, 108, 96] : w === 'neon' ? [44, 42, 60] : w === 'magic' ? rsMix([200, 196, 230], V.g1, 0.15) : [212, 216, 228];
    const lit = rgLit(V, rsMix(metal, [255, 246, 226], 0.15), day, haze, AIR), dark = rgLit(V, rsMix(metal, BLACK, 0.35), day, haze, AIR);
    // (and any material, wood, stone, rust or paint, lit by the same light: the kit's own colours, never all one grey)
    const mat = m => ({ body: rgLit(V, m, day, haze, AIR), lit: rgLit(V, rsMix(m, [255, 246, 226], 0.28), day, haze, AIR), dark: rgLit(V, rsMix(m, BLACK, 0.42), day, haze, AIR) });
    return { body: rgLit(V, metal, day, haze, AIR), lit, dark, glow: rsMix(g, AIR, haze*0.4), glow2: rsMix(g2, AIR, haze*0.4), sd: sd > 0 ? 1 : -1, L: LT, air: AIR, haze, w, mat }; };
  // where a world point meets the screen, standing on its ground: [X, Y, px per metre, distance]
  const foot = (a, z) => { const e = Math.max(TR.sea, T(a, z, W*0.0015)), p = at(a, z, e); if(!p) return null; return [p[0], p[1], W*0.00025*F/p[2], e]; };
  // THE WORLD STORE (Ruby: "handle it a little bit like a game engine: a very fast data structure holding all of the
  // positions, their size, sprite, etc, and then use that when you do the view transform"): every tree, building,
  // rock, tuft and find within sight of where you stand, in the world's own coordinates, made once for this world and
  // kept (`rgStore`); a view only reads it, transforms, culls and sorts. Turning the camera, tilting it, zooming,
  // lighting it: nothing in the store changes, so nothing moves but your view of it.
  const store = rgStore(V); let loudDrawn = 0;
  const marginOf = o => o.c === 'bldg' || o.c === 'board' || o.c === 'henge' ? o.wM*W*0.00025 : o.c === 'tree' || o.c === 'bot' || o.c === 'egg' ? o.hM*W*0.0005 : o.c === 'prop' ? o.hM*W*0.0012 : W*0.0004;
  for(const o of store){ const dd = keep(o.a, o.z, marginOf(o)); if(dd != null) things.push({ dd, draw: l => rgPaintThing(o, l, dd) }); }
  const nearCut = wh*0.6;
  // each thing painted from its record: where it stands, how big in metres, which sprite, its own stream
  const rgPaintThing = (o, l, dd) => {
    const f = foot(o.a, o.z); if(!f || f[3] <= TR.sea) return;
    const wday = ringDay(L, o.a), haze = hazeOf(dd), R = mulberry32(o.rs);
    if(o.c === 'tree'){ const h = o.hM*f[2]; if(h < px(1.6) || h > nearCut) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*0.3, X + h*0.3, Y - h, Y, o.kind === 'dead' || o.kind === 'willow' || h < px(4) ? null : [X - h*0.13, X + h*0.13, Y - h*0.8, Y - h*0.4])) return;
      const green = rsMix(o.w === 'ruins' ? [80, 70, 54] : [36, 82, 50], V.land, 0.35), c = colsOf(o.w, wday, haze);
      pkTree(x, X, Y, h, { trunk: rgLit(V, [70, 52, 40], wday, haze, AIR), dark: rgLit(V, rsMix(green, BLACK, 0.18), wday, haze, AIR), body: rgLit(V, green, wday, haze, AIR),
        lit: rgLit(V, rsMix(green, [255, 244, 222], 0.3), wday, haze, AIR), glow: c.glow, sd: c.sd, L: LT }, o.kind, R, rgPx); return; }
    if(o.c === 'bldg'){ const h = o.hM*f[2], wd = o.wM*f[2]; if(h < px(1.2) || h > wh*0.75) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - wd, X + wd, Y - h*1.3, Y, o.kind === 'arch' || o.kind === 'needle' || o.kind === 'pylon' ? null : [X - wd*0.4, X + wd*0.4, Y - h*0.3, Y])) return;
      const cb = colsOf(o.w, wday, haze), night = 1 - rsSmooth(0.3, 0.7, wday); pkBuilding(x, X, Y + h*0.03, h, wd, cb, PK_STYLE[o.w], night, R, rgPx, o.kind);
      // CLOSE BY, its foot (the building's base detailed, Ruby: "close-up versions with details for their base"): a door
      // two metres tall with its step, a lamp beside it lit at night, a planter
      const m = f[2]; if(m*2.1 > px(10) && o.kind !== 'arch' && o.kind !== 'needle' && o.kind !== 'pylon' && o.kind !== 'torii' && o.kind !== 'turbine'){
        const Rb = mulberry32(o.rs ^ 0x5eed), dx = X + (Rb() - 0.5)*wd*0.5, dw = 1.0*m, dh = 2.1*m;
        x.fillStyle = rsCss(rsMix(cb.dark, BLACK, 0.35)); x.fillRect(dx - dw/2, Y - dh, dw, dh);
        if(night > 0.2){ x.fillStyle = rsCss(cb.glow, 0.5*night); x.fillRect(dx - dw/2 + dw*0.15, Y - dh*0.9, dw*0.7, dh*0.35); }
        x.fillStyle = rsCss(cb.lit); x.fillRect(dx - dw*0.75, Y - m*0.15, dw*1.5, m*0.15);
        pkProp(x, dx + dw*1.3, Y, 3.2*m, cb, 'lamp', mulberry32(o.rs ^ 0x1a3b), rgPx, night);
        if(Rb() < 0.6){ x.fillStyle = rsCss(cb.dark); x.fillRect(dx - dw*1.9, Y - m*0.5, dw*0.7, m*0.5); for(let q = 0; q < 3; q++){ x.fillStyle = rsCss(rgLit(V, [60, 110, 60], wday, haze, AIR)); x.beginPath(); x.arc(dx - dw*1.55 + (q - 1)*dw*0.2, Y - m*0.6, m*0.22, 0, Math.PI*2); x.fill(); } } }
      return; }
    if(o.c === 'rock'){ const rr = o.hM*f[2]; if(rr < px(2) || rr > wh*0.3) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - rr, X + rr, Y - rr, Y, [X - rr*0.5, X + rr*0.5, Y - rr*0.4, Y])) return;
      pkRock(x, X, Y, rr, rgLit(V, [128, 122, 114], wday, haze, AIR), LT, R, rgPx); return; }
    if(o.c === 'grass'){ const gH = o.hM*f[2]; if(gH < px(2.5) || gH > wh*0.12) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - gH, X + gH, Y - gH*1.4, Y)) return;
      const gc2 = rgLit(V, rsMix([40, 88, 54], V.land, 0.45), wday, haze, AIR), gl = rsMix(gc2, [255, 244, 222], 0.2), flw = [V.g1, V.g2, [250, 246, 240]], rnd = (p, q) => p + (q - p)*R();
      for(let b = -2; b <= 2; b++) rsPoly(x, [[X + b*gH*0.25, Y], [X + b*gH*0.5 + (R() - 0.5)*gH*0.4, Y - gH*rnd(0.7, 1.4)], [X + b*gH*0.25 + gH*0.15, Y]], rsCss(b*LT[0] > 0 ? gl : gc2));
      if(R() < 0.25*RG_PROF[o.w].gr){ const fc = rsMix(flw[Math.floor(R()*3)], [0, 0, 0], 0.1); x.fillStyle = rsCss(fc); x.beginPath(); x.arc(X, Y - gH*1.1, Math.max(rgPx(0.8), gH*0.18), 0, Math.PI*2); x.fill(); if(o.w === 'magic') rgGlow(x, X, Y - gH*1.1, gH*0.8, fc, 0.6); }
      return; }
    if(o.c === 'egg'){ const h = o.hM*f[2], E = PK_EGGS[o.kind]; if(h < px(o.kind === 'caps' ? 1.2 : 3) || h > wh*0.6) return;
      if(E.loud && loudDrawn >= 1) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*2, X + h*2, Y - h*(o.kind === 'warden' ? 4.2 : o.kind === 'spire' ? 1.1 : 1.8), Y)) return;
      if(E.loud) loudDrawn++;
      const c = colsOf(o.w, wday, haze); pkEgg(x, X, Y + h*0.02, h, c, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
    if(o.c === 'henge'){ if(f[2]*o.hm < px(2)) return; const c = colsOf(o.w, wday, haze); rgHenge(x, o, (a, z) => { const q = foot(a, z); return q && [q[0], stand(l, q[0], q[1]), q[2], Math.hypot(a, z - L.z0)]; }, c, R, rgPx); return; }
    if(o.c === 'board'){ const m = f[2], h = o.hM*m, bw = o.wM*m; if(h < px(3) || h > wh*0.6) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - bw/2, X + bw/2, Y - h, Y)) return;
      pkBoard(x, X, Y, m, colsOf(o.w, wday, haze), o.kind === 'serial' ? { serial: PK_SERIALS[o.v], k: o.k } : o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday), o.aged); return; }
    if(o.c === 'prop'){ const h = o.hM*f[2]; if(h < px(3) || h > wh*(RG_WIDE.includes(o.kind) ? 0.12 : 0.35)) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*2, X + h*2, Y - h*1.1, Y)) return;
      // (set into the ground a little, always; the ruins' wrecks and bikes half buried, clipped where the ground meets them)
      const c = colsOf(o.w, wday, haze), sink = h*(0.025 + (o.sink || 0)), cc = o.next ? { ...c, noWires: true } : c;
      if(o.sink){ x.save(); x.beginPath(); x.rect(X - h*6, Y - h*6, h*12, h*6 + h*0.02); x.clip(); pkProp(x, X, Y + sink, h, cc, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); x.restore(); }
      else pkProp(x, X, Y + sink, h, cc, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday));
      // (a road's pole wired to the next one along, the wires sagging between)
      if(o.next){ const f2 = foot(o.next[0], o.next[1]); if(f2) pkWires(x, [X, Y - h*0.95], [f2[0], f2[1] - o.hM*f2[2]*0.95], h, c, rgPx); } return; }
    if(o.c === 'bot'){ const h = o.hM*f[2]; if(h < px(3) || h > wh*0.5) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h, X + h, Y - h*(o.kind === 'drone' ? 3.4 : 1.1), Y)) return;
      const c = colsOf(o.w, wday, haze); pkRobot(x, X, Y + h*0.02, h, { ...c, eye: c.glow }, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
    // small life: found rather than seen
    const hh = 2.8*f[2]; if(hh < px(3) || hh > wh*0.2) return;
    const X = f[0], Y = stand(l, X, f[1]); if(Y < px(4) || Y > wh*0.95 || !vis(l, X - hh, X + hh, Y - hh*1.4, Y)) return;
    const glow = colsOf(o.w, wday, haze).glow;
    const lc = { dark: rgLit(V, [34, 30, 28], wday, haze, AIR), lit: rgLit(V, [236, 240, 246], wday, haze, AIR), glow,
      flowers: [V.g1, V.g2, [244, 238, 228]].map(g => rgLit(V, rsMix(g, [0, 0, 0], 0.1), Math.max(0.4, wday), haze, AIR)),
      slime: rgLit(V, rsMix(V.g2, [120, 200, 150], 0.45), Math.max(0.4, wday), haze, AIR) };
    rgSmallLife(x, X, Y, hh*(0.8 + 0.4*R()), o.kind, lc, R);
  };
  // THE WORKS, standing in the world: spires, monoliths, domes, circles, pillars, craters, wrecks, towers, crystals
  // (Ruby: "works needs to be turned down significantly": fewer of each)
  { const cw = W*0.035, imax = Math.ceil(d1/cw) + 1, jmax = Math.ceil(W/2/cw), kinds = ['sp', 'mo', 'do', 'ci', 'pi', 'ca', 'wr', 'to', 'cr'];
    for(let i = -imax; i <= imax; i++) for(let j = -jmax; j <= jmax; j++){
      if(mnHash(i, j, s + 501) > 0.16*V.works + 0.005) continue;
      const a = (i + mnHash(i, j, s + 502))*cw, z = (j + mnHash(i, j, s + 503) - 0.5)*cw; if(Math.abs(z) > W*0.48) continue;
      const dd = keep(a, z, W*0.01); if(dd == null || dd < W*0.03 || dd > d1) continue;
      const w = V.worldAt(a, z), P = RG_PROF[w]; let tot = 0; for(const k of kinds) tot += P[k] || 0; let r = mnHash(i, j, s + 504)*tot, kind = null;
      for(const k of kinds){ r -= P[k] || 0; if(r < 0){ kind = k; break; } }
      if(kind) things.push({ dd, o: { d: dd, a, z, kind, w, h: mnHash(i, j, s + 505), h2: mnHash(i, j, s + 506), R: rgRand(s, 501, i, j) } }); }
    // spans and bridges of light, wall to wall across the band, where you look along it (as they were: Ruby, "the bridges
    // and the spans were fine"); ships in the air, each at its own place over the floor
    for(let i = -24; i <= 24; i++){ const a = (i + mnHash(i, 7, s + 511))*W*0.45, w = V.worldAt(a, 0), P = RG_PROF[w], r = mnHash(i, 8, s + 512)*1.6, dd = ahead(a, 0);
      if(dd > W*1.1 && dd < d1*1.5 && Math.abs(hx) > 0.3 && r < (P.sa + P.br)*V.works*0.5) things.push({ dd, o: { d: dd, a, z: 0, kind: r < P.sa*V.works*0.5 ? 'sa' : 'br', w, h: mnHash(i, 9, s + 513), R: rgRand(s, 511, i) } }); }
    for(let i = 0; i < 40; i++){ const w = V.world.list[i % V.world.list.length], P = RG_PROF[w]; if(mnHash(i, 1, s + 521) > P.sh*V.works*0.22) continue;
      const a = (mnHash(i, 2, s + 522)*2 - 1)*d1, z = (mnHash(i, 3, s + 523) - 0.5)*W*0.9, dd = keep(a, z, W*0.02);
      if(dd == null || dd < d0*4 || dd > d1) continue;
      things.push({ dd, o: { d: Math.hypot(a, z - L.z0), a, z, kind: 'sh', w, h: mnHash(i, 4, s + 524), h2: mnHash(i, 6, s + 524), up: W*(0.006 + 0.05*mnHash(i, 5, s + 525)), R: rgRand(s, 521, i) } }); } }
  const drawWork = (o, l) => {
    const e = Math.max(TR.sea, T(o.a, o.z, W*0.003)), b = at(o.a, o.z, e); if(!b) return;
    const k = F/b[2], day = ringDay(L, o.a), big = { sp: 0.02 + 0.08*o.h, mo: 0.006 + 0.02*o.h, do: 0.006 + 0.016*o.h, to: 0.02 + 0.07*o.h, wr: 0.006 + 0.02*o.h, cr: 0.012 }[o.kind]; if(big && W*big/o.d > 0.4) return;
    const X = b[0], Y = o.kind === 'sh' || o.kind === 'sa' || o.kind === 'br' ? b[1] : stand(l, b[0], b[1]);
    if(big && hidden(l, X - W*big*k*0.3, X + W*big*k*0.3, Y - W*big*k)) return;
    const night = 1 - rsSmooth(0.3, 0.7, day), haze = hazeOf(o.d), c = colsOf(o.w, day, haze);
    rgWork(x, o, X, Y, k, c, night, o.R, V, e);
  };
  // THE WAYS on the floor (the store's, walked across the land), each piece drawn with the ridge before it, so the hills
  // hide it; near you a piece is cut finer, so the way lies on the ground between its points, not across the air
  const wayPieces = store.ways.map(wy => { const out2 = [];
    for(let i = 0; i + 1 < wy.pts.length; i++){ const p = wy.pts[i], q = wy.pts[i + 1], len = Math.hypot(q.a - p.a, q.z - p.z) || 1e-9, nx = -(q.z - p.z)/len, nz = (q.a - p.a)/len;
      const dist = Math.hypot((p.a + q.a)/2, (p.z + q.z)/2 - L.z0), n = Math.max(1, Math.min(8, Math.ceil(len/Math.max(W*0.0005, dist*0.06))));
      for(let k = 0; k < n; k++){ const t0 = k/n, t1 = (k + 1)/n, P0 = { a: p.a + (q.a - p.a)*t0, z: p.z + (q.z - p.z)*t0, dec: p.dec + (q.dec - p.dec)*t0 }, P1 = { a: p.a + (q.a - p.a)*t1, z: p.z + (q.z - p.z)*t1, dec: p.dec + (q.dec - p.dec)*t1 };
        out2.push({ p: P0, q: P1, nx, nz, dd: cutOf((P0.a + P1.a)/2, (P0.z + P1.z)/2) }); } }
    return out2; });
  const drawWays = (dn, df) => store.ways.forEach((wy, wi) => { let run = [], decs = [];
    const flush = () => { if(run.length >= 2) paintWay(wy, run, decs); run = []; decs = []; };
    for(const pc of wayPieces[wi]){ if(!(pc.dd > dn && pc.dd <= df) || pc.p.dec > 0.8){ flush(); continue; }
      for(const P of run.length ? [pc.q] : [pc.p, pc.q]){ const e = Math.max(TR.sea, T(P.a, P.z, W*0.002)) + W*0.00003, A = at(P.a - pc.nx*wy.half, P.z - pc.nz*wy.half, e), B = at(P.a + pc.nx*wy.half, P.z + pc.nz*wy.half, e);
        if(!A || !B){ flush(); continue; } run.push([A, B]); decs.push(P.dec); } }
    flush(); });
  // A WAY'S PIECE PAINTED in its material: asphalt (a centre line on the main roads), cobbles, brick laid across,
  // gravel, packed earth with its two ruts, flagstones, stepping stones in moss, the builders' pale paths and paths of
  // light, a ley line's glow; worn where it is worn (cracks, potholes, weeds at its edges), and broken through where most
  const paintWay = (wy, run, decs) => { const L2 = run.map(q => q[0]), R2 = run.map(q => q[1]);
    const mid = L2[L2.length >> 1], day = ringDay(L, 0), haze = hazeOf(mid[2]), c = colsOf(wy.w, day, haze), poly = [...L2, ...R2.slice().reverse()], lit = col => rgLit(V, col, day, haze, AIR);
    const line = (pts, cl, wdt, dash) => { x.strokeStyle = cl; x.lineWidth = wdt; if(dash && x.setLineDash) x.setLineDash(dash); x.beginPath(); pts.forEach(([X, Y], q) => q ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.stroke(); if(dash && x.setLineDash) x.setLineDash([]); };
    const ctr = L2.map((p, q) => [(p[0] + R2[q][0])/2, (p[1] + R2[q][1])/2]), wid = q => Math.hypot(L2[q][0] - R2[q][0], L2[q][1] - R2[q][1]), wpx = Math.min(px(3.5), Math.max(px(0.8), wid(0)*0.06)), mix = (q, t) => [L2[q][0] + (R2[q][0] - L2[q][0])*t, L2[q][1] + (R2[q][1] - L2[q][1])*t];
    const base = RG_WAYCOL[wy.mat] && (wy.mat === 'asphalt' && wy.w === 'neon' ? [34, 32, 44] : RG_WAYCOL[wy.mat]), Rm = mulberry32((wy.i*7919 + Math.round(mid[0]*13 + mid[1]*7)) >>> 0);
    if(base){ rsPoly(x, poly, rsCss(lit(base), wy.mat === 'earth' || wy.mat === 'moss' ? 0.82 : 1)); line(L2, rsCss(lit(rsMix(base, [0, 0, 0], 0.25)), 0.5), wpx); line(R2, rsCss(lit(rsMix(base, [0, 0, 0], 0.25)), 0.5), wpx); }
    const near = q => wid(q) > px(10);
    for(let q = 0; q < run.length; q++){ if(!near(q)) continue; const wq = wid(q);
      if(wy.mat === 'cobble' || wy.mat === 'brick'){ const n = Math.min(14, Math.floor(wq/px(4))); for(let k = 0; k < n; k++){ const [X, Y] = mix(q, (k + 0.5)/n); x.fillStyle = rsCss(lit(rsMix(base, k % 2 ? [255, 250, 240] : [0, 0, 0], 0.15)), 0.8);
          if(wy.mat === 'cobble'){ x.beginPath(); x.ellipse(X, Y, wq/n*0.38, wq/n*0.2, 0, 0, Math.PI*2); x.fill(); } else x.fillRect(X - wq/n*0.42, Y - wq/n*0.12, wq/n*0.84, wq/n*0.24); } }
      else if(wy.mat === 'gravel'){ for(let k = 0; k < 6; k++){ const [X, Y] = mix(q, Rm()); x.fillStyle = rsCss(lit(Rm() < 0.5 ? [120, 112, 100] : [220, 212, 196]), 0.7); x.fillRect(X, Y, px(1), px(1)); } }
      else if(wy.mat === 'flag' && q % 2 === 0){ line([mix(q, 0), mix(q, 1)], rsCss(lit([100, 96, 88]), 0.5), Math.max(px(0.4), wpx*0.4)); }
      else if(wy.mat === 'moss'){ const [X, Y] = mix(q, 0.3 + 0.4*Rm()); x.fillStyle = rsCss(lit([168, 164, 152])); x.beginPath(); x.ellipse(X, Y, wq*0.18, wq*0.08, 0, 0, Math.PI*2); x.fill(); } }
    if(wy.mat === 'earth'){ for(const t of [0.3, 0.7]) line(run.map((_, q) => mix(q, t)), rsCss(lit([110, 88, 64]), 0.6), Math.max(px(0.5), wpx*0.8)); line(ctr, rsCss(lit([96, 126, 70]), 0.5), Math.max(px(0.5), wpx*0.9)); }
    else if(wy.mat === 'asphalt' && wy.main) line(ctr, rsCss([236, 230, 200], 0.75), wpx, [wpx*4, wpx*4]);
    else if(wy.mat === 'light' || wy.mat === 'ley'){ x.save(); x.globalCompositeOperation = 'screen'; if(wy.mat === 'light'){ line(L2, rsCss(c.glow, 0.5), wpx*1.2); line(R2, rsCss(c.glow, 0.5), wpx*1.2); } else { line(ctr, rsCss(c.glow, 0.22), wpx*4); line(ctr, rsCss(c.glow, 0.7), wpx*1.1); } x.restore(); }
    if(wy.w === 'neon' && wy.mat === 'asphalt'){ x.save(); x.globalCompositeOperation = 'screen'; line(L2, rsCss(c.glow2, 0.35), wpx*1.6); line(R2, rsCss(c.glow, 0.35), wpx*1.6); x.restore(); }
    // (wear: where it is worn, cracks across it and potholes in it, weeds along its edges)
    for(let q = 0; q < run.length; q++){ const dc = decs[q]; if(dc < 0.4) continue; const wq = wid(q);
      if(Rm() < dc){ const A = mix(q, 0.1 + 0.3*Rm()), B = mix(Math.min(run.length - 1, q + 1), 0.5 + 0.4*Rm()); line([A, [(A[0] + B[0])/2 + (Rm() - 0.5)*wq*0.2, (A[1] + B[1])/2], B], rsCss(lit([30, 28, 26]), 0.6), Math.max(px(0.4), wpx*0.6)); }
      if(dc > 0.55 && Rm() < 0.5 && wq > px(6)){ const [X, Y] = mix(q, 0.2 + 0.6*Rm()); x.fillStyle = rsCss(lit([40, 36, 32]), 0.7); x.beginPath(); x.ellipse(X, Y, wq*0.12, wq*0.05, 0, 0, Math.PI*2); x.fill(); }
      if(wq > px(5)) for(const t of [0.02, 0.98]) if(Rm() < dc){ const [X, Y] = mix(q, t), gh = Math.min(px(6), wq*0.12); x.fillStyle = rsCss(lit([70, 104, 58]), 0.85); x.beginPath(); x.moveTo(X - gh*0.5, Y); x.lineTo(X, Y - gh); x.lineTo(X + gh*0.5, Y); x.fill(); } } };

  // ---- 4. BACK TO FRONT ----
  const bySlot = lay.map(() => []);
  for(const t of things){ const j = slot(t.dd); if(j >= 0){ t.l = lay[j]; bySlot[j].push(t); } }
  things.sort((p, q) => p.dd - q.dd); for(const t of things) if(t.l && t.draw){ cur = t; t.draw(t.l); }
  painting = true;
  let prevY = null;
  const MIST = { fog: 0.075, rain: 0.035, storm: 0.03, snow: 0.045 }[V.weather] || 0, MISTC = rsMix(AIR, [236, 238, 242], 0.35);
  lay.forEach((l, li) => {
    const { k, d, pts } = l, haze = hazeOf(d), mid = pts[pts.length >> 1], day = ringDay(L, mid.a), yC = mid.Y;
    const depth = Math.max(px(6), prevY == null ? wh : Math.abs(yC - prevY)*1.4 + px(4)); prevY = yC;
    const gm = rgGround(V, mid.a, mid.z, mid.ec), base = rgLit(V, gm, day, haze, AIR), sil = [...pts.map(p => [p.X, p.Y]), [pts[pts.length - 1].X, wh + 4], [pts[0].X, wh + 4]];
    // the ridge in one wash: lit along its crest, deepening below it (as a painter blocks a ridge), then its facets where
    // it is steep (mountains, cliffs), a bright rim on its crest, water flat with a glint
    { const yTop = Math.min(...pts.map(p => p.Y)), g = x.createLinearGradient(0, yTop, 0, yTop + depth*1.6 + px(4)), litC = rgLit(V, rsMix(gm, [255, 244, 222], 0.22), day, haze, AIR), darkC = rgLit(V, rsMix(gm, BLACK, 0.3), day, haze, AIR);
      g.addColorStop(0, rsCss(rsMix(base, litC, 0.6))); g.addColorStop(1, rsCss(rsMix(base, darkC, 0.6))); rsPoly(x, sil, g); }
    rsPoly(mk, sil, '#fff'); { const g = Math.round(255*k/(K - 1)); rsPoly(dk, sil, `rgb(${g},${g},${g})`); }
    for(let q = 0; q + 1 < pts.length; q += 2){ const p0 = pts[q], p1 = pts[Math.min(pts.length - 1, q + 2)], am = (p0.a + p1.a)/2, zm = (p0.z + p1.z)/2;
      // (each facet's choices from the world's own smooth noise where it stands)
      const n1 = wn(am, zm, l.ws, 1), n2 = wn(am, zm, l.ws, 2), n3 = wn(am, zm, l.ws, 3), n4 = wn(am, zm, l.ws, 4);
      const jit = (c2, k2, nv) => { const v = (nv - 0.5)*2*k2; return v > 0 ? rsMix(c2, [255, 255, 255], v) : rsMix(c2, BLACK, -v); };
      const gc = rgGround(V, am, zm, Math.max(p0.ec, p1.ec));
      const cl = rgLit(V, gc, day, haze, AIR), lit = rgLit(V, rsMix(gc, [255, 244, 222], 0.3), day, haze, AIR), dark = rgLit(V, rsMix(gc, BLACK, 0.34), day, haze, AIR);
      if(p0.sea && p1.sea){ rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], [p1.X, p1.Y + depth*0.5], [p0.X, p0.Y + depth*0.5]], rsCss(cl));
        if(n1 < 0.5){ x.fillStyle = rsCss(rsMix(cl, [255, 255, 255], 0.3*day + 0.05)); x.fillRect(p0.X, p0.Y + depth*n2*0.25, (p1.X - p0.X)*(0.3 + 0.6*n3), Math.max(rgPx(1), depth*0.03)); } continue; }
      const face = rsFace(dark, lit, p1.Y - p0.Y, p0.X - p1.X, LT), slope = Math.abs(p1.Y - p0.Y)/Math.max(1, Math.abs(p1.X - p0.X));
      if(slope > 0.32){ const q0 = [p0.X + (p1.X - p0.X)*(n1 - 0.5)*0.3, p0.Y + depth*(0.35 + 0.45*n2)], q1 = [p1.X, p1.Y + depth*(0.35 + 0.45*n3)];
        rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], q0], rsCss(jit(face, 0.03, n4))); rsPoly(x, [[p1.X, p1.Y], q1, q0], rsCss(jit(rsMix(face, dark, 0.2), 0.03, n1))); }
      else { const bd = depth*(0.1 + 0.12*n2); rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], [p1.X, p1.Y + bd], [p0.X, p0.Y + bd*(0.6 + 0.6*n3)]], rsCss(jit(rsMix(face, lit, 0.35), 0.02, n4)));
        // FIELDS (Ruby: "more detail in the distance … in the ground"): where people farm (open, low, not forest, not
        // town), the land below a crest is a mosaic of fields, each its crop's colour by where it lies (ripe, green,
        // fallow, now and then in flower), hedged with a dark line; far off, at the scale a painter shows them
        const fw = V.worldAt(am, zm);
        if((fw === 'wilds' || fw === 'cities' || fw === 'builders') && d > W*0.03 && d < W*2.2 && p0.ec < TR.snow*0.4 && V.forestAt(am, zm) < 0.35 && V.cityAt(am, zm, RG_PROF[fw].cv*(0.3 + 0.9*V.works)) < 0.2 && V.dryAt(am, zm) < 0.68){
          const CROPS = [[206, 176, 92], [104, 140, 66], [138, 106, 72], [176, 190, 98], [150, 122, 170]], cs = W*0.012, hedge = rsCss(rsMix(dark, BLACK, 0.2), 0.5);
          for(let b = 0; b < 3; b++){ const v0 = 0.18 + b*0.26, v1 = v0 + 0.22, fi = Math.floor(am/cs), fj = Math.floor(zm/cs) + b*7, hv = mnHash(fi, fj, s + 77);
            if(hv < 0.25) continue; const crop = CROPS[Math.min(4, Math.floor(hv*hv*5.6))], fc = rgLit(V, rsMix(gc, crop, 0.45), day, haze, AIR);
            const A = [p0.X, p0.Y + depth*v0], B = [p1.X, p1.Y + depth*v0], C2 = [p1.X, p1.Y + depth*v1], D = [p0.X, p0.Y + depth*v1];
            rsPoly(x, [A, B, C2, D], rsCss(fc, 0.75)); x.strokeStyle = hedge; x.lineWidth = Math.max(px(0.6), depth*0.012); x.beginPath(); x.moveTo(D[0], D[1]); x.lineTo(C2[0], C2[1]); x.stroke(); } } }
      x.strokeStyle = rsCss(rsMix(lit, [255, 250, 236], 0.3*(1 - haze)), 0.7*day + 0.1); x.lineWidth = Math.max(px(1.2), depth*0.025); x.beginPath(); x.moveTo(p0.X, p0.Y); x.lineTo(p1.X, p1.Y); x.stroke(); }
    // then the roads and the things between this ridge and the next nearer one, far to near
    const dn = li + 1 < lay.length ? lay[li + 1].d : 0; drawWays(dn, d);
    bySlot[li].sort((p, q) => q.dd - p.dd); for(const t of bySlot[li]){ if(t.o) drawWork(t.o, l); else if(t.ok){ cur = t; t.draw(l); } }
    // (in fog, rain or snow the air thickens between each ridge and the next, so the far ridges sink into it, layer on layer)
    if(MIST && li < lay.length - 2){ x.fillStyle = rsCss(MISTC, MIST); x.fillRect(0, 0, ww, wh); }
  });
  // ---- 5. THE AIR OVER IT ALL: the sun's glare low in the sky, and the weather falling ----
  const sp = V.sun.at; if(sp && V.weather !== 'fog'){ const el = Math.asin(Math.max(-1, Math.min(1, -V.sun.D[0]))); if(el < 0.45){ const r = F*(0.6 + 0.5*(0.45 - el)), dk = ringDay(L, 0), col = rsMix([255, 232, 196], [255, 160, 120], rgClamp(1 - Math.abs(dk - 0.5)*3.2)*0.6);
    x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); g.addColorStop(0, rsCss(col, 0.22)); g.addColorStop(0.4, rsCss(col, 0.07)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(sp[0] - r, sp[1] - r, r*2, r*2); x.restore(); } }
  if(V.weather === 'rain' || V.weather === 'storm'){ const R = rgRand(s, 820), n = Math.round(ww*wh/(px(26)*px(26))), sl = 0.18; x.strokeStyle = rsCss(rsMix(AIR, [230, 236, 246], 0.5), V.weather === 'storm' ? 0.24 : 0.18); x.lineWidth = Math.max(px(0.5), px(0.9)); x.beginPath();
    for(let k = 0; k < Math.min(n, 4000); k++){ const X = R()*ww, Y = R()*wh, ln = px(10 + 30*R()); x.moveTo(X, Y); x.lineTo(X + ln*sl, Y + ln); } x.stroke();
    if(V.weather === 'storm'){ x.fillStyle = rsCss([20, 24, 44], 0.16); x.fillRect(0, 0, ww, wh); } }
  if(V.weather === 'snow'){ const R = rgRand(s, 821), n = Math.min(3000, Math.round(ww*wh/(px(34)*px(34)))); x.fillStyle = rsCss([250, 252, 255], 0.85); x.beginPath();
    for(let k = 0; k < n; k++){ const X = R()*ww, Y = R()*wh, r = px(0.8 + 2.6*Math.pow(R(), 3)); x.moveTo(X + r, Y); x.arc(X, Y, r, 0, Math.PI*2); } x.fill(); }
}

// the weather (both parts read it the same way, so the arch's clouds and the land's rain agree)
const RG_WEATHER_SEL = ['weather', 'Weather', 'select', 'by the seed', { options: ['by the seed', 'clear', 'clouds', 'rain', 'storm', 'snow', 'fog'] }];
export const RING_STEPS = {
  ringarch: { cat: 'Textures', label: 'The Arch', ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'ring'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Life', 50),
      RG_R('works', 'Works', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99),
      ['saturn', 'Saturn', 'select', 'by the seed', { options: ['by the seed', 'never', 'always'] }], RG_WEATHER_SEL], cost: () => 4,
    paint(E, n){ const { ww, wh } = E, [c, x] = kitPicture(E.input(n, 1) ?? 0, ww, wh), [mc, mk] = kitCanvas(ww, wh); mk.fillStyle = '#000'; mk.fillRect(0, 0, ww, wh);
      const V = rgView(E, n, ww, wh); rgPanSky(c, x, V); rgPaintArch(x, mk, V); return [c, mc]; },
    run(E, n){ const [c, m] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m))]; } },
  ringland: { cat: 'Marks', label: 'Land on the Ring', ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'land', 'distance'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Life', 50),
      RG_R('works', 'Works', 50), RG_R('clutter', 'Clutter', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99), RG_WEATHER_SEL], cost: () => 4,
    paint(E, n){ const { ww, wh } = E, [c, x] = kitPicture(E.input(n, 1) ?? 0, ww, wh), [mc, mk] = kitCanvas(ww, wh), [dc, dk] = kitCanvas(ww, wh);
      mk.fillStyle = '#000'; mk.fillRect(0, 0, ww, wh); dk.fillStyle = '#fff'; dk.fillRect(0, 0, ww, wh);
      const V = rgView(E, n, ww, wh); rgPaintLand(x, mk, dk, V); return [c, mc, dc]; },
    run(E, n){ const [c, m, d] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m)), E.asField(E.readCanvas(d))]; } },
};
