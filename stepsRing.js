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
import { PK_TREES, pkTree, PK_STYLE, pkBuilding, pkRock, pkSpire, pkMonolith, pkStone, pkLintel, pkDome, pkCrystals, pkMetres, pkArchOf, pkVernacularOf, PK_FLORA, PK_BOTS, pkRobot, PK_PROPS, PK_PROPS_BIG, pkProp, pkWires, pkFlip, PK_EGGS, pkEgg, PK_BOARDS, PK_SERIALS, pkBoardOf, pkBoardSize, pkBoard } from './paintKit.js';

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
    life: num(n, 'life', 50)/100, works: num(n, 'works', 50)/100, clutter: num(n, 'clutter', 50)/100, weather: wx, air: num(n, 'air', 60)/100, dayHere: ringDay(L, 0), px: E.px, saturn: E.P(n, 'saturn', 'by the seed'),
    // THE SCENE'S CLOCK (the Moving Image's Time Passing): seconds since the film began, and the time between its frames
    // (0 in a still, so a still draws as it always did); and the ring's slow spin under the stars since then
    time: (E.ctx.camera && E.ctx.camera.time) || 0, dt: (E.ctx.camera && E.ctx.camera.dt) || 0, spin: ((E.ctx.camera && E.ctx.camera.time) || 0)*RG_SPIN };
}
// THE RING'S SPIN under the stars (docs/prior-art/ringworld-time.md: Niven's ring turns once in seven and a half of its
// thirty-hour days, 225 hours): radians a second of the film's clock turns the sky, a degree and a half an hour
const RG_SPIN = Math.PI*2/(225*3600);
// THE CLOUDS' CLOCK (Ruby: "slower and more physically accurate cloud movement"): when a film's frames are far apart in
// time (a day in seconds), the clouds would leap from frame to frame; they are carried as a time-lapse carries them, at
// most two seconds of wind a frame (some sixty times their true pace at thirty frames a second), so they drift
const rgCloudTime = V => V.dt > 2 ? V.time/V.dt*2 : V.time;
// the wind, by the seed (docs/prior-art/ringworld-time.md: fair-weather cumulus drift at three to seven metres a second,
// faster under a storm): its way and its speed
const rgWind = V => { const WD = seedChoice(V.seed, 'wind'), ang = WD()*Math.PI*2; return [ang, 3 + 4*WD() + (V.weather === 'storm' ? 5 : 0)]; };
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
  const { ww, wh, F } = V, ox = ((-V.psi*F) % ww + ww) % ww, oy = (((V.th + V.spin*V.hx)*F) % wh + wh) % wh; if(ox < 0.5 && oy < 0.5) return;
  const [t, tx] = kitCanvas(ww, wh); tx.drawImage(c, 0, 0);
  for(const dx of [ox - ww, ox]) for(const dy of [oy - wh, oy]) x.drawImage(t, dx, dy);
  t.width = 0; t.height = 0;
}
// ---------------- THE ARCH ----------------
// THE WEATHER (Ruby: "more clouds, slightly rare weather effects … atmospherics, possibly rays from the sun"): by the seed
// mostly clear, often clouds, now and then fog, rarely rain, a storm or snow (never snow where it's neon or ruins hot)
function rgWeatherOf(seed, chosen, world){ if(chosen && chosen !== 'by the seed') return chosen; const u = mnHash(seed | 0, 77, 5);
  return u < 0.46 ? 'clear' : u < 0.74 ? 'clouds' : u < 0.84 ? 'fog' : u < 0.93 ? 'rain' : u < 0.97 ? 'storm' : world.list.includes('neon') ? 'rain' : 'snow'; }
// A RUNE (Ruby: "better rune graffiti"): a letter of a runic hand, as the old futhark is cut, straight strokes only (a
// knife's or a brush's): a stave, and twigs from it (up or down, one side or both, from its top or its middle), now and
// then a bow or a lozenge; the same seed always cuts the same letter. (X, Y) its middle, g half its height
function rgRune(x, X, Y, g, u){ const k = Math.floor(u*24), w = g*0.55, P = (a, b) => [X + a*w, Y + b*g];
  const seg = (A, B) => { x.moveTo(...P(...A)); x.lineTo(...P(...B)); };
  x.beginPath(); if(k % 6 !== 5) seg([0, -1], [0, 1]);   // the stave (all but the lozenges)
  switch(k % 6){ case 0: seg([0, -1], [1, -0.4]); if(k & 8) seg([0, -0.3], [1, 0.3]); break;                    // twigs up and out, one or two
    case 1: seg([0, -1], [-1, -0.4]); seg([0, -1], [1, -0.4]); break;                                             // twigs both ways from the top
    case 2: seg([0, -1], [0.9, -0.5]); seg([0.9, -0.5], [0, 0]); if(k & 8) seg([0, 0], [0.9, 1]); break;            // a bow (and a leg)
    case 3: seg([-0.9, -0.4], [0.9, 0.4]); if(k & 8) seg([-0.9, 0.4], [0.9, -0.4]); break;                        // a cross-stroke (or two)
    case 4: seg([0, 0], [-0.9, 0.6]); seg([0, 0], [0.9, 0.6]); if(k & 8) seg([0, -1], [0.7, -0.6]); break;         // twigs down from the middle
    default: seg([0, -1], [0.8, 0]); seg([0.8, 0], [0, 1]); seg([0, 1], [-0.8, 0]); seg([-0.8, 0], [0, -1]); if(k & 8){ seg([-0.8, 0], [-1, 0.8]); seg([0.8, 0], [1, 0.8]); } }
  x.stroke(); }
// THE GAS GIANTS the ring may orbit (Ruby: "a random gas giant including Jupiter, Saturn, Uranus, Neptune (with some of
// their moons)"; docs/prior-art/ringworld-time.md): Saturn is paintSaturn's; the other three here, in flat shapes as a
// space painter blocks them: JUPITER's cream zones and rust belts, their edges waved, the Great Red Spot in the south;
// URANUS a pale cyan ball almost without a mark, its thin dark rings standing nearly upright (it lies on its side);
// NEPTUNE deep blue, its dark spot and the white streaks of high cloud. Each lit from the ring's star (its night side
// away from it, the terminator soft), and its moons strung along its equator, each a small disc with its own night
// side: Io, Europa, Ganymede and Callisto; Miranda to Oberon; Triton. (X, Y) its middle, r its radius.
//   far giant, banded —
//   the moons keep their little nights
//   on the line of its waist
const RG_GIANTS = {
  jupiter: { base: [222, 206, 182], bands: [[236, 226, 206], [186, 136, 100], [230, 214, 190], [168, 122, 92], [226, 210, 186], [196, 152, 116], [214, 200, 180]], poles: [150, 140, 130],
    moons: [['Io', [232, 210, 120], 0.026], ['Europa', [226, 216, 196], 0.022], ['Ganymede', [170, 160, 150], 0.037], ['Callisto', [116, 106, 98], 0.034]] },
  uranus: { base: [174, 216, 224], bands: [[180, 220, 228], [170, 212, 222], [184, 224, 230]], poles: [196, 230, 234],
    moons: [['Miranda', [170, 170, 170], 0.0185], ['Ariel', [196, 192, 186], 0.045], ['Umbriel', [120, 118, 116], 0.046], ['Titania', [176, 168, 160], 0.062], ['Oberon', [156, 146, 138], 0.059]] },
  neptune: { base: [64, 98, 196], bands: [[70, 106, 204], [58, 88, 184], [76, 114, 210], [60, 92, 190]], poles: [52, 80, 170],
    moons: [['Triton', [216, 198, 192], 0.055]] } };
function rgGiant(x, X, Y, r, kind, o){
  const G = RG_GIANTS[kind], a = o.alpha ?? 1, SPACE = [8, 10, 24], tint = c => o.tint ? rsMix(c, o.tint, 0.1) : c, R = o.R, px = o.px || (v => v);
  const sl = Math.hypot(...o.sun) || 1, sun = o.sun.map(v => v/sl), axis = kind === 'uranus' ? Math.PI/2 + (o.axis || 0)*0.2 : (o.axis || 0)*0.5;
  const moons = G.moons.map(([, c, k], i) => { const side = R() < 0.5 ? -1 : 1, d = r*(1.8 + i*1.15 + R()*0.6); return { c: tint(c), rr: Math.max(px(1.2), r*k*2.2), dx: Math.cos(axis)*d*side, dy: Math.sin(axis)*d*side, behind: R() < 0.4 }; });
  const moon = m => { const mx = X + m.dx, my = Y + m.dy; x.fillStyle = rsCss(m.c, a); x.beginPath(); x.arc(mx, my, m.rr, 0, Math.PI*2); x.fill();
    x.save(); x.beginPath(); x.arc(mx, my, m.rr, 0, Math.PI*2); x.clip(); x.fillStyle = rsCss(SPACE, 0.7*a); x.beginPath(); x.arc(mx - sun[0]*m.rr*1.3, my - sun[1]*m.rr*1.3, m.rr*1.05, 0, Math.PI*2); x.fill(); x.restore(); };
  // (Uranus's thin rings, the far half first: narrow and dark, standing nearly upright round it)
  const ringsU = far => { if(kind !== 'uranus') return; x.save(); x.translate(X, Y); x.rotate(axis + Math.PI/2); x.scale(1, 0.92);
    for(const [k, al] of [[1.6, 0.3], [1.75, 0.22], [1.95, 0.45]]){ x.strokeStyle = rsCss(rsMix(G.base, SPACE, 0.55), al*a); x.lineWidth = Math.max(px(0.5), r*0.012); x.beginPath(); x.arc(0, 0, r*k, far ? Math.PI : 0, far ? Math.PI*2 : Math.PI); x.stroke(); }
    x.restore(); };
  for(const m of moons) if(m.behind) moon(m);
  ringsU(true);
  x.fillStyle = rsCss(o.behind || SPACE); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill();
  x.save(); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.clip(); x.translate(X, Y); x.rotate(axis);
  x.fillStyle = rsCss(tint(G.base), a); x.fillRect(-r, -r, 2*r, 2*r);
  // (the bands, their edges waved where the winds shear them: Jupiter's strongly, the ice giants' faintly)
  const wav = kind === 'jupiter' ? 0.025 : 0.008; let y = -r*0.92;
  for(let i = 0; y < r*0.92; i++){ const hh = r*(0.08 + 0.12*R()), c = tint(G.bands[i % G.bands.length]); x.fillStyle = rsCss(c, a); x.beginPath(); x.moveTo(-r, y);
    for(let q = 0; q <= 24; q++){ const u = -r + 2*r*q/24; x.lineTo(u, y + Math.sin(q*1.7 + i*2.3)*r*wav); }
    for(let q = 24; q >= 0; q--){ const u = -r + 2*r*q/24; x.lineTo(u, y + hh + Math.sin(q*1.9 + i*1.3)*r*wav); } x.closePath(); x.fill(); y += hh; }
  x.fillStyle = rsCss(tint(G.poles), 0.5*a); x.fillRect(-r, -r, 2*r, r*0.16); x.fillRect(-r, r*0.84, 2*r, r*0.16);
  if(kind === 'jupiter'){ // the Great Red Spot, in the southern belt, with its pale collar
    const gx = (R() - 0.5)*r*0.8, gy = r*0.36; x.fillStyle = rsCss(tint([236, 222, 200]), 0.8*a); x.beginPath(); x.ellipse(gx, gy, r*0.2, r*0.1, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = rsCss(tint([196, 112, 80]), a); x.beginPath(); x.ellipse(gx, gy, r*0.15, r*0.07, 0, 0, Math.PI*2); x.fill(); }
  if(kind === 'neptune'){ // the Great Dark Spot, and its bright companion clouds, high streaks of white
    const gx = (R() - 0.5)*r*0.7, gy = -r*0.25; x.fillStyle = rsCss([34, 52, 128], 0.9*a); x.beginPath(); x.ellipse(gx, gy, r*0.16, r*0.08, 0, 0, Math.PI*2); x.fill();
    x.strokeStyle = rsCss([236, 242, 255], 0.75*a); x.lineWidth = Math.max(px(0.5), r*0.025); x.lineCap = 'round';
    for(let k = 0; k < 4; k++){ const sy = (R() - 0.5)*r*1.4, sx = (R() - 0.5)*r, len = r*(0.15 + 0.25*R()); x.beginPath(); x.moveTo(sx - len/2, sy); x.lineTo(sx + len/2, sy + r*0.01); x.stroke(); } }
  x.restore();
  // its night side, away from the star: two soft steps of dark, so the terminator is soft
  x.save(); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.clip();
  x.fillStyle = rsCss(SPACE, 0.6*a); x.beginPath(); x.arc(X - sun[0]*r*1.25, Y - sun[1]*r*1.25, r*1.02, 0, Math.PI*2); x.fill();
  x.fillStyle = rsCss(SPACE, 0.22*a); x.beginPath(); x.arc(X - sun[0]*r*0.85, Y - sun[1]*r*0.85, r*1.02, 0, Math.PI*2); x.fill();
  if(o.eclipse > 0){ x.fillStyle = rsCss(SPACE, 0.88*o.eclipse*a); x.fillRect(X - r, Y - r, 2*r, 2*r); }
  x.restore();
  // (the thin air at its limb on the lit side, and in eclipse all round it)
  { x.save(); x.globalCompositeOperation = 'screen'; const L = rsMix(G.base, [255, 255, 255], 0.5), k = Math.max(0.15, o.eclipse || 0), g = x.createRadialGradient(X, Y, r*0.97, X, Y, r*1.08);
    g.addColorStop(0, rsCss(L, 0)); g.addColorStop(0.3, rsCss(L, 0.35*k*a)); g.addColorStop(1, rsCss(L, 0)); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r*1.08, 0, Math.PI*2); x.fill(); x.restore(); }
  ringsU(false);
  for(const m of moons) if(!m.behind) moon(m);
}
function rgPaintArch(x, mk, V){
  rgPx = V.px;
  const { L, W, ww, wh, unit, F, cx, cy, proj, at, sky: S, g1, g2, px } = V, dl = V.dayHere, kday = rsSmooth(0.3, 0.75, dl), dusk = rgClamp(1 - Math.abs(dl - 0.5)*3.2);
  const SPACE = [8, 10, 24], AIR = rgAirOf(V, dl), s = V.seed | 0;
  // (everything in the sky stands in a DIRECTION of the world, so turning the camera turns past it: skyAt is where a
  //  bearing and an elevation fall on the page, and F the pixels a radian spans at the middle of the view)
  const psi = V.psi, skyAt = (az, el) => proj(L.Px - Math.sin(el)*0.01, Math.cos(el)*Math.cos(az)*0.01, L.z0 + Math.cos(el)*Math.sin(az)*0.01);
  // (what lies beyond the ring, the nebula, the planets, a comet, turns with the stars as the ring spins: about the
  //  axis across the ring; the star at its middle, the arch and the air stay where they are)
  const cs0 = Math.cos(V.spin), sn0 = Math.sin(V.spin), farAt = (az, el) => { const dx = -Math.sin(el), dy = Math.cos(el)*Math.cos(az);
    return proj(L.Px + (dx*cs0 - dy*sn0)*0.01, (dx*sn0 + dy*cs0)*0.01, L.z0 + Math.cos(el)*Math.sin(az)*0.01); };
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
    const p = farAt(az0 + Math.cos(ga)*d, el0 + Math.sin(ga)*d*0.6); if(!p) continue; const X = p[0], Y = p[1]; x.save(); x.translate(X, Y); x.rotate(ga + tw); x.scale(1, ry/rx);
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rsCss(col, nebA)); gr.addColorStop(0.5, rsCss(col, nebA*0.35)); gr.addColorStop(1, rsCss(col, 0)); x.fillStyle = gr; x.fillRect(-rx, -rx, rx*2, rx*2); x.restore(); } }
  x.restore();
  // (Ruby: "Ringworld should sometimes be orbiting Saturn": a ring in four orbits it, as the old games' rings orbit
  //  their gas giants, and SATURN hangs huge in its sky, beyond the far arch; by the seed, or The Arch's Saturn. Now and
  //  then, when it doesn't, the far planet is Saturn: an Easter egg)
  const SC_ = seedChoice(V.seed, 'saturn'), byS = SC_() < 0.25, satSky = V.saturn === 'always' || (V.saturn !== 'never' && byS), satFar = !satSky && SC_() < 0.2;
  { const R = rgRand(s, 802), rnd = (a, b) => a + (b - a)*R(), has = R() < 0.35, r = F*rnd(0.04, 0.12), P0 = farAt(R()*Math.PI*2, rnd(0.2, 0.6)), X = P0 ? P0[0] : 0, Y = P0 ? P0[1] : 0;
  if(has && P0){ const c1 = rsMix(rsMix(g2, S, 0.5), [255, 255, 255], 0.2), c2 = rsMix(c1, SPACE, 0.45), a = 0.55 + 0.4*(1 - kday), lit = rnd(-1, 1);
    const bands = Array.from({ length: 5 }, (_, b) => [(b*0.4 + R()*0.2)*r, r*rnd(0.12, 0.3)]);
    if(satFar) paintSaturn(x, X, Y, r*0.6, { axis: (SC_() - 0.5)*0.9, open: (SC_() < 0.5 ? -1 : 1)*(0.2 + 0.25*SC_()), sun: [lit < 0 ? 1 : -1, -0.3], alpha: a, tint: S });
    else if(satSky){ /* (Saturn fills the sky instead: no second planet) */ }
    else { x.save(); x.globalAlpha = a; x.fillStyle = rsCss(c2); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill(); x.clip();
      for(let b = 0; b < 5; b++){ x.fillStyle = rsCss(b % 2 ? c1 : rsMix(c1, c2, 0.5)); x.fillRect(X - r, Y - r + bands[b][0], r*2, bands[b][1]); }
      x.fillStyle = rsCss(SPACE, 0.55); x.beginPath(); x.arc(X + lit*r*0.55, Y - r*0.2, r*1.05, 0, Math.PI*2); x.fill(); x.restore(); } } }
  { const R = rgRand(s, 803), rnd = (a, b) => a + (b - a)*R(), has = R() < 0.25, P0 = farAt(R()*Math.PI*2 + V.time/86400*1.5*Math.PI/180, rnd(0.25, 0.8)), X = P0 ? P0[0] : 0, Y = P0 ? P0[1] : 0;
  if(has && P0){ const ang = rnd(0.2, 0.9)*(R() < 0.5 ? 1 : -1) + Math.PI/2, len = F*rnd(0.12, 0.3), wd = F*0.012;
    const tx = X - Math.cos(ang)*len, ty = Y - Math.sin(ang)*len, g = x.createLinearGradient(X, Y, tx, ty); g.addColorStop(0, rsCss([240, 250, 255], 0.8*(1 - 0.6*kday))); g.addColorStop(1, rsCss(S, 0));
    rsPoly(x, [[X - Math.sin(ang)*wd, Y + Math.cos(ang)*wd], [tx, ty], [X + Math.sin(ang)*wd, Y - Math.cos(ang)*wd]], g); x.fillStyle = rsCss([255, 255, 255], 0.9*(1 - 0.5*kday)); x.beginPath(); x.arc(X, Y, wd*0.8, 0, Math.PI*2); x.fill(); } }
  // METEORS by night (Ruby: "comets, meteor shower"; docs/prior-art/ringworld-time.md): with the scene's clock running,
  // every so often a meteor, a fraction of a second, caught by each frame's shutter (its time between frames, up to
  // twenty seconds, as a long exposure catches them); on some rings a shower, many more, all streaking out from one
  // point among the stars (the radiant), turning with them
  if(V.time > 0 && kday < 0.6){ const MC = seedChoice(V.seed, 'meteors'), shower = MC() < 0.4, rate = shower ? 120 : 10, tau = 3600/rate, raz = MC()*Math.PI*2, rel = (25 + 50*MC())*Math.PI/180, expo = Math.min(20, Math.max(1/60, V.dt || 1/30));
    x.save(); x.globalCompositeOperation = 'screen';
    for(let k = Math.floor(V.time/tau); k*tau < V.time + expo; k++){ const R = rgRand(s, 830, k), tk = (k + R())*tau; if(tk < V.time || tk >= V.time + expo) continue;
      const ang = R()*Math.PI*2, d0 = (shower ? 8 + 40*R() : 0)*Math.PI/180, len = (4 + 14*R())*Math.PI/180, az0 = shower ? raz : R()*Math.PI*2, el0 = shower ? rel : (20 + 60*R())*Math.PI/180;
      const pt = d => [az0 + Math.cos(ang)*d/Math.max(0.2, Math.cos(el0)), el0 + Math.sin(ang)*d], A = farAt(...pt(d0)), B = farAt(...pt(d0 + len)); if(!A || !B) continue;
      const br = 0.35 + 0.65*R()*R(), col = R() < 0.3 ? [190, 255, 210] : [255, 246, 220], g = x.createLinearGradient(A[0], A[1], B[0], B[1]);
      g.addColorStop(0, rsCss(col, 0)); g.addColorStop(0.8, rsCss(col, 0.8*br*(1 - kday))); g.addColorStop(1, rsCss([255, 255, 255], br*(1 - kday)));
      x.strokeStyle = g; x.lineWidth = Math.max(px(0.6), px(1.4)*br); x.lineCap = 'round'; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); }
    x.restore(); }
  // AN AURORA, now and then by night where there is magic or the builders' fields: faint curtains of light low over
  // one side of the horizon, folded, their hems bright and their tops fading; with the clock they ripple and drift
  { const AC = seedChoice(V.seed, 'aurora'); if((V.world.list.includes('magic') || V.world.list.includes('builders')) && AC() < 0.3 && kday < 0.35){
    const az0 = AC()*Math.PI*2, span = (50 + 60*AC())*Math.PI/180, hue = [g1, g2, [120, 255, 170]][Math.floor(AC()*3)], a0 = 0.16*(1 - kday/0.35);
    x.save(); x.globalCompositeOperation = 'screen';
    for(let q = 0; q < 60; q++){ const u = q/59, az = az0 + (u - 0.5)*span, wob = Math.sin(u*9 + V.time*0.05 + AC()*6)*0.6 + Math.sin(u*23 - V.time*0.11)*0.25;
      const B = skyAt(az, (6 + 3*wob)*Math.PI/180), T2 = skyAt(az, (22 + 8*wob + 6*Math.sin(u*5 + V.time*0.03))*Math.PI/180); if(!B || !T2) continue;
      const g = x.createLinearGradient(B[0], B[1], T2[0], T2[1]), al = a0*(0.4 + 0.6*Math.pow(Math.sin(Math.PI*u), 0.6))*(0.6 + 0.4*Math.sin(u*31 + V.time*0.2));
      g.addColorStop(0, rsCss(rsMix(hue, [255, 255, 255], 0.3), al)); g.addColorStop(0.25, rsCss(hue, al*0.7)); g.addColorStop(1, rsCss(hue, 0));
      x.strokeStyle = g; x.lineWidth = Math.max(px(1), F*span/60*1.3); x.beginPath(); x.moveTo(B[0], B[1]); x.lineTo(T2[0], T2[1]); x.stroke(); }
    x.restore(); } }
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
    const rS = F*(0.1 + 0.11*SC_()), az = (50 + (SC_() - 0.5)*70)*Math.PI/180, el = (18 + 22*SC_())*Math.PI/180, P0 = farAt(az, el), X = P0 ? P0[0] : -1e4, Y = P0 ? P0[1] : -1e4, axis = (SC_() - 0.5)*1.1, open = (SC_() < 0.5 ? -1 : 1)*(0.14 + 0.26*SC_());
    const sun = sp ? [sp[0] - X, sp[1] - Y] : V.sun.screen, sa = 0.62 + 0.38*(1 - kday);
    const ecl = sp && P0 ? 1 - rsSmooth(rS*0.55, rS*1.5, Math.hypot(sp[0] - X, sp[1] - Y)) : 0;
    // (which giant, by the seed: Saturn most often, then Jupiter; Neptune and Uranus the rarer)
    const GU = seedChoice(V.seed, 'giant')(), GK = GU < 0.4 ? 'saturn' : GU < 0.7 ? 'jupiter' : GU < 0.85 ? 'neptune' : 'uranus', behind = rsMix(rsMix(SPACE, S, 0.12), AIR, kday);
    if(P0 && GK === 'saturn') paintSaturn(x, X, Y, rS, { axis, open, sun, alpha: sa, tint: S, behind, eclipse: ecl });
    else if(P0) rgGiant(x, X, Y, rS*(GK === 'jupiter' ? 1.1 : 0.85), GK, { axis, sun, alpha: sa, tint: S, behind, eclipse: ecl, R: rgRand(s, 816), px });
    // (the sun just past its limb: a single bright bead of light where it slips out, as a diamond ring)
    if(ecl > 0.05 && ecl < 0.95 && sp){ const d = Math.hypot(sp[0] - X, sp[1] - Y) || 1, bx = X + (sp[0] - X)/d*rS, by = Y + (sp[1] - Y)/d*rS, k = 1 - Math.abs(ecl - 0.5)*2;
      rgGlow(x, bx, by, rS*0.8*k, [255, 248, 232], 0.95*k); rgGlow(x, bx, by, rS*0.2, [255, 255, 255], k);
      if(k > 0.3) for(let q = 0; q < 4; q++){ const an = q*Math.PI/2 + 0.4, Lr = rS*(q % 2 ? 0.5 : 1.1)*k; rsPoly(x, [[bx - Math.sin(an)*px(1.2), by + Math.cos(an)*px(1.2)], [bx + Math.cos(an)*Lr, by + Math.sin(an)*Lr], [bx + Math.sin(an)*px(1.2), by - Math.cos(an)*px(1.2)], [bx - Math.cos(an)*Lr, by - Math.sin(an)*Lr]], rsCss([255, 252, 240], 0.7*k)); } }
    if(GK === 'saturn' && P0){ const tR = rgRand(s, 817), td = rS*(4.6 + tR()*1.2)*(tR() < 0.5 ? -1 : 1), tr = Math.max(px(1.5), rS*0.07);   // (Titan, orange in its haze, out along the rings' plane)
      const tx = X + Math.cos(axis)*td, ty = Y + Math.sin(axis)*td; x.fillStyle = rsCss(rsMix([214, 170, 90], S, 0.1), sa); x.beginPath(); x.arc(tx, ty, tr, 0, Math.PI*2); x.fill(); x.fillStyle = rsCss(SPACE, 0.6*sa); x.beginPath(); x.arc(tx - sun[0]/(Math.hypot(...sun) || 1)*tr*1.3, ty - sun[1]/(Math.hypot(...sun) || 1)*tr*1.3, tr*1.05, 0, Math.PI*2); x.fill(); }
    if(GK === 'saturn' && SC_() < 0.45 && P0){ const th2 = (SC_() < 0.5 ? 0.25 : 0.75)*Math.PI*2 + (SC_() - 0.5)*0.9, d = 3.95*rS, ex = Math.cos(th2)*d, ey = Math.sin(th2)*d*open;
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
        // (near, the plates' upright seams too, and weather run down the wall from each seam; a hatch at the foot now and
        //  then, its frame catching the light; and along the top, lights for the ships, blinking by night)
        if(wp > px(30)){ for(const u of [0.25, 0.5, 0.75]) line([inQ(q, u, 0), inQ(q, u, 1)], rsCss(rsMix(c, [0, 0, 0], 0.25), 0.4), Math.max(px(0.4), hp*0.004));
          for(const v of [0.34, 0.68]) for(let k = 0; k < 4; k++){ const u = R(), A = inQ(q, u, v), B = inQ(q, u, v - 0.06 - 0.1*R()); line([A, B], rsCss(rsMix(c, [0, 0, 0], 0.3), 0.18), Math.max(px(0.5), wp*0.01)); } }
        if(hp > px(40) && wp > px(20) && R() < 0.3 && ww2 !== 'magic'){ const u0 = 0.2 + 0.5*R(), A = inQ(q, u0, 0), B = inQ(q, u0 + 0.08, 0), C2 = inQ(q, u0 + 0.08, 0.07), D = inQ(q, u0, 0.07);
          rsPoly(x, [A, B, C2, D], rsCss(rsMix(c, [0, 0, 0], 0.5))); line([A, D, C2, B], rsCss(rsMix(c, [255, 255, 255], 0.3), 0.8), Math.max(px(0.4), hp*0.004));
          if(night > 0.3) rsPoly(x, [inQ(q, u0 + 0.01, 0.005), inQ(q, u0 + 0.07, 0.005), inQ(q, u0 + 0.07, 0.06), inQ(q, u0 + 0.01, 0.06)], rsCss(glowC, 0.4*night)); }
        if(night > 0.4 && ww2 !== 'ruins' && (R() < 0.5)){ const [X, Y] = inQ(q, 0.5, 0.985), on = !V.time || Math.sin(V.time*Math.PI*0.75 + (X*0.05)) > 0.4; if(on) rgGlow(x, X, Y, Math.max(px(3), hp*0.02), [255, 70, 60], 0.7*night); }
        if((ww2 === 'builders' || ww2 === 'magic') && R() < 0.6){ // a band of their runes, glowing, between two ruled lines, words parted by a dot
          const n = Math.max(2, Math.min(48, Math.round(wp/(hp*0.045)))), gc = rsCss(glowC, 0.55 + 0.4*night), g = hp*0.022, vR = 0.44 + 0.12*R();
          x.strokeStyle = gc; x.lineWidth = Math.max(px(0.5), g*0.22); x.lineCap = 'round';
          line([inQ(q, 0, vR - 0.045), inQ(q, 1, vR - 0.045)], gc, Math.max(px(0.4), g*0.12)); line([inQ(q, 0, vR + 0.045), inQ(q, 1, vR + 0.045)], gc, Math.max(px(0.4), g*0.12));
          for(let k = 0; k < n; k++){ const [X, Y] = inQ(q, (k + 0.5)/n, vR), t = R(); x.strokeStyle = gc; x.lineWidth = Math.max(px(0.5), g*0.22);
            if(t < 0.14){ x.fillStyle = gc; x.beginPath(); x.arc(X, Y, Math.max(px(0.5), g*0.18), 0, Math.PI*2); x.fill(); } else rgRune(x, X, Y, g, R()); }
          if(night > 0.3) rgGlow(x, ...inQ(q, 0.5, vR), Math.min(hp*0.3, wp*0.5), glowC, 0.12*night); }
        if((ww2 === 'cities' || ww2 === 'neon') && R() < 0.5){ // screens: a few lit panels, one a broadcast in the page's colours
          for(let k = 0, nS = 1 + Math.floor(R()*3); k < nS; k++){ const u0 = R()*0.8, v0 = 0.4 + R()*0.35, a = inQ(q, u0, v0), b = inQ(q, u0 + 0.12, v0 + 0.16);
            rsPoly(x, [a, inQ(q, u0 + 0.12, v0), b, inQ(q, u0, v0 + 0.16)], rsCss(R() < 0.5 ? glowC : V.lightsOf(ww2)[1], 0.35 + 0.55*night)); } }
        if((ww2 === 'ruins' || ww2 === 'neon' || ww2 === 'cities') && R() < 0.45){ // GRAFFITI near the foot where people reach, in runes: in the
          // towns a word thrown up big in one colour outlined in another, in the ruins scrawled thin and hurried; paint
          // running down from the heaviest strokes; older pieces faded under newer
          const cols = [V.g1, V.g2, [240, 236, 228], [30, 30, 34]];
          for(let k = 0, nT = 1 + Math.floor(R()*3); k < nT; k++){ const u0 = R()*0.8, v0 = 0.08 + 0.1*R(), nL = 2 + Math.floor(R()*4), g = hp*(ww2 === 'ruins' ? 0.025 : 0.04)*(0.7 + 0.6*R()), fade = 0.45 + 0.5*R();
            const fill = cols[Math.floor(R()*3)], edge = cols[(Math.floor(R()*3) + 1) % 4], tilt = (R() - 0.5)*0.3, us = g*1.6/Math.max(1, wp);
            for(let pass = ww2 === 'ruins' ? 1 : 0; pass < 2; pass++){ x.strokeStyle = rsCss(pass ? fill : edge, (pass ? 0.85 : 0.8)*fade); x.lineCap = 'round'; x.lineJoin = 'round';
              x.lineWidth = Math.max(px(0.6), g*(ww2 === 'ruins' ? 0.12 : pass ? 0.32 : 0.55));
              const Rr = rgRand(s, 819, Math.round(u0*1e4), k); for(let c = 0; c < nL; c++){ const [X, Y] = inQ(q, u0 + c*us, v0 + c*us*tilt*hp/Math.max(1, wp)*20); rgRune(x, X, Y - g, g, Rr()); } }
            for(let d = 0; d < nL*2; d++) if(R() < 0.35){ const [X, Y] = inQ(q, u0 + R()*nL*us, v0); line([[X, Y - g*0.2], [X, Y + g*(0.6 + 1.6*R())]], rsCss(fill, 0.55*fade), Math.max(px(0.4), g*0.06)); } } } } }
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
  // THE WIND (Ruby: "clouds moving"; docs/prior-art/ringworld-time.md): by the seed a way and a speed; as the scene's clock
  // runs, each cloud rides on its own layer (the heaps low, the cirrus high and faster) a plane over the land, and the
  // plane carries it: across the sky, growing as it nears and shrinking down to the horizon, gone past it and coming
  // round again from the far side (a still: every cloud where it always was)
  const [wAng, wSp] = rgWind(V);
  // (each cloud keeps to its own circle of the plane, as far out as it began: it crosses the sky along a chord of it with
  //  the wind, and past the horizon comes in again on the far side, so the sky keeps the clouds it began with)
  const drift = (az, e, hc, k = 1) => { if(!V.time) return [az, e, 1]; const d = hc/Math.tan(e), ux = Math.cos(wAng), uy = Math.sin(wAng), x0 = d*Math.cos(az), y0 = d*Math.sin(az);
    const u0 = x0*ux + y0*uy, w = -x0*uy + y0*ux, Dc = Math.sqrt(Math.max(1, d*d - w*w)), u = ((u0 + wSp*k*rgCloudTime(V) + Dc) % (2*Dc) + 2*Dc) % (2*Dc) - Dc;
    const xx = u*ux - w*uy, yy = u*uy + w*ux, d2 = Math.max(hc*0.3, Math.hypot(xx, yy));
    return [Math.atan2(yy, xx), Math.atan(hc/d2), Math.min(1.6, d/d2)]; };
  if(wx === 'clear' && R0() < 0.55) for(let k = 0, n = 8 + Math.floor(R0()*14); k < n; k++){ const R = rgRand(s, 809, k), rnd = (a, b) => a + (b - a)*R(), [az, e, gk] = drift(R()*Math.PI*2, rnd(2, 12)*Math.PI/180, 1200), P0 = skyAt(az, e); if(!P0) continue; const X = P0[0], Y = P0[1], wd = F*rnd(0.2, 0.6)*gk, ht = wd*rnd(0.03, 0.07), pts = [];
    for(let q = 0; q <= 8; q++){ const u = q/8; pts.push([X - wd/2 + wd*u, Y - ht*Math.pow(Math.sin(Math.PI*u), 0.6)*rnd(0.6, 1.2)]); }
    rsPoly(x, [...pts, [X + wd/2, Y + ht*0.25], [X - wd/2, Y + ht*0.25]], rsCss(cWhite, 0.8)); }
  if(wx === 'clear' || wx === 'clouds') if(R0() < 0.5) for(let k = 0, n = 5 + Math.floor(R0()*8); k < n; k++){ // cirrus: long thin streaks high up, combed one way
    const R = rgRand(s, 812, k), rnd = (a, b) => a + (b - a)*R(), [caz, ce] = drift(R()*Math.PI*2, rnd(18, 50)*Math.PI/180, 9000, 2.5), P0 = skyAt(caz, ce); if(!P0) continue; const len = F*rnd(0.2, 0.7), ang = rnd(-0.25, 0.25), th = F*rnd(0.004, 0.012);
    x.save(); x.translate(P0[0], P0[1]); x.rotate(ang); const g = x.createLinearGradient(-len/2, 0, len/2, 0); g.addColorStop(0, rsCss(cWhite, 0)); g.addColorStop(0.5, rsCss(cWhite, 0.35*(0.4 + 0.6*kday))); g.addColorStop(1, rsCss(cWhite, 0)); x.fillStyle = g;
    for(let q = 0; q < 3; q++){ x.beginPath(); x.ellipse(rnd(-0.1, 0.1)*len, (q - 1)*th*2.2, len/2*rnd(0.6, 1), th, 0, 0, Math.PI*2); x.fill(); } x.restore(); }
  // (the heaps of cumulus, and the storm's towers with their lightning, stand in the world over the land, and are drawn
  //  with it: rgPaintLand's clouds)
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
function rgSmallLife(x, X, Y, h, kind, c, R, t = 0){
  // (each mark has a floor in the export's pixels: smaller than that, a find is not subtle but missing)
  const rnd = (a, b) => a + (b - a)*R(), dot = (cx, cy, r, lo, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, Math.max(rgPx(lo), r), 0, Math.PI*2); x.fill(); };
  if(kind === 'insects'){ // a small cloud of specks over the grass, a pair of wings catching the light on the nearer
    const n = 3 + Math.floor(R()*5), cy = Y - h*rnd(0.5, 1.2);
    for(let q = 0; q < n; q++){ const ix = X + (R() - 0.5)*h*1.4 + (t ? Math.sin(t*(2.1 + q*0.7) + q*2.3 + X*0.01)*h*0.35 : 0), iy = cy + (R() - 0.5)*h*0.6 + (t ? Math.sin(t*(2.9 + q*0.5) + q*1.7)*h*0.18 : 0); dot(ix, iy, h*0.04, 1.9, rsCss(c.dark, 0.8));   // (with the clock, a swarm's dance)
      // (at dusk and by night they are fireflies: each a cold yellow-green light, flashing for most of a second every five
      //  or six, each in its own time)
      if((c.night || 0) > 0.35){ const ph = ((t || 0)/5.5 + q*0.37 + (X*0.013 % 1)) % 1, on = !t || ph < 0.14; if(on) rgGlow(x, ix, iy, Math.max(rgPx(5), h*0.16), [200, 255, 120], 0.6*c.night); }
      if(h > rgPx(40) && R() < 0.5){ x.strokeStyle = rsCss(c.lit, 0.45); x.lineWidth = Math.max(rgPx(0.8), h*0.012); x.beginPath(); x.moveTo(ix - h*0.06, iy - h*0.04); x.lineTo(ix, iy); x.lineTo(ix + h*0.06, iy - h*0.04); x.stroke(); } }
    return; }
  if(kind === 'fairies'){ // a few points of light drifting low, each with a faint trail behind it
    const n = 1 + Math.floor(R()*3);
    for(let q = 0; q < n; q++){ const fx = X + (R() - 0.5)*h*2 + (t ? Math.sin(t*0.45 + q*2.1)*h*0.6 : 0), fy = Y - h*rnd(0.4, 1.4) + (t ? Math.sin(t*0.7 + q)*h*0.2 : 0), dx = (R() < 0.5 ? -1 : 1)*Math.max(rgPx(4), h*0.18);   // (drifting, with the clock)
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
const RG_WAYCOL = { jetty: [130, 102, 74], asphalt: [92, 92, 98], cobble: [138, 128, 116], brick: [150, 86, 66], gravel: [176, 166, 146], earth: [150, 124, 92], flag: [168, 164, 152], moss: [104, 128, 86], light: [214, 220, 230], pale: [214, 210, 196] };
const RG_LIT_WAYS = ['asphalt', 'cobble', 'brick', 'pale', 'flag'];
// THE CROPS a field shows (docs/prior-art/ringworld-countryside.md): its colour; its rows (or furrows) every so many
// metres and their colour; a hay field's mowing stripes; a paddy's water; the moonflowers' light by night
const RG_CROPS = { wheat: { c: [214, 184, 100] }, barley: { c: [200, 190, 128] }, stubble: { c: [206, 184, 128], row: [6, [184, 158, 102]] },
  hay: { c: [150, 170, 90], stripe: [10, [178, 192, 112]] }, pasture: { c: [104, 146, 72] }, ploughed: { c: [124, 94, 66], row: [1.6, [92, 68, 48]] },
  rapeseed: { c: [234, 210, 52] }, maize: { c: [88, 128, 56], row: [1.5, [66, 98, 44]] }, lavender: { c: [126, 106, 168], row: [1.2, [176, 156, 118]] },
  vines: { c: [150, 128, 96], row: [2.6, [80, 110, 58]] }, rice: { c: [118, 156, 112], water: true, row: [0.7, [96, 150, 70]] }, tea: { c: [74, 110, 62], row: [1.6, [52, 88, 48]] },
  garden: { c: [150, 190, 140], row: [2, [106, 158, 108]] }, moonflower: { c: [150, 166, 186], row: [2, [128, 140, 176]], glow: true }, fallow: { c: [146, 136, 94] } };
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
  const hubs = [], farms = []; { const C = W*0.05, Rr = W*0.25; for(let i = Math.floor(-Rr/C); i <= Math.ceil(Rr/C); i++) for(let j = Math.floor((L.z0 - Rr)/C); j <= Math.ceil((L.z0 + Rr)/C); j++){
    const a = (i + 0.5)*C, z = (j + 0.5)*C; if(Math.abs(z) > W*0.46 || Math.hypot(a, z - L.z0) > Rr) continue; const w = V.worldAt(a, z), t = townAt(w, a, z); if(t < (w === 'wilds' || w === 'magic' ? 0.1 : 0.25)) continue;
    let top = true; for(const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const a2 = a + di*C, z2 = z + dj*C; if(townAt(V.worldAt(a2, z2), a2, z2) > t){ top = false; break; } }
    if(!top || T.true(a, z, W*0.003) <= TR.sea || mnHash(i, j, s + 65) > 0.15 + 0.7*V.works) continue; hubs.push([a, z, w, t]); } }
  // (the farms' hearts: wherever the houses gather, as the buildings below are placed, a village or a town's edge)
  const villageAt = (w, a, z) => w === 'wilds' ? 0.7*V.cityAt(a, z, 0.12*(0.3 + 0.9*V.works)) : V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works));
  { const C = W*0.03, Rr = W*0.3; for(let i = Math.floor(-Rr/C); i <= Math.ceil(Rr/C); i++) for(let j = Math.floor((L.z0 - Rr)/C); j <= Math.ceil((L.z0 + Rr)/C); j++){
    const a = (i + 0.5)*C, z = (j + 0.5)*C; if(Math.abs(z) > W*0.46 || Math.hypot(a, z - L.z0) > Rr) continue; const w = V.worldAt(a, z), t = villageAt(w, a, z); if(t < 0.06) continue;
    let top = true; for(const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const a2 = a + di*C, z2 = z + dj*C; if(villageAt(V.worldAt(a2, z2), a2, z2) > t){ top = false; break; } }
    if(top && T.true(a, z, W*0.003) > TR.sea) farms.push([a, z, w, Math.min(1, t*2)]); } }
  hubs.forEach(([a, z, w, t], hi) => { const R = rgRand(s, 1310, hi), n = 2 + Math.floor(R()*(0.5 + 2.5*V.works)), mat = pickMat(w, R), step = (w === 'wilds' || w === 'magic' ? 14 : 12)*M;
    for(let k = 0; k < n; k++) addWay(walk(a, z, k/n*Math.PI*2 + R()*0.8, (120 + 380*R()*t)*M, step, null, R), k === 0 || R() < 0.7 ? mat : pickMat(w, R), w, false, R);
    let near = null, nd = Infinity; hubs.forEach((h2, hj) => { if(hj <= hi) return; const d = Math.hypot(h2[0] - a, h2[1] - z); if(d < nd){ nd = d; near = h2; } });
    if(near && nd < 1400*M) addWay(walk(a, z, Math.atan2(near[1] - z, near[0] - a), nd*1.6, step*1.5, [near[0], near[1]], R), w === 'ruins' ? 'gravel' : w === 'cities' || w === 'neon' ? 'asphalt' : 'earth', w, false, R); });
  // how far a point stands from the nearest way's edge (so buildings, trees and what is scattered keep off them)
  let wayAt = null; // (the nearest point of a way, found by the last wayGap)
  const wayGap = (a, z) => { const bi = Math.floor(a/BIN), bj = Math.floor(z/BIN); let best = Infinity; wayAt = null;
    for(let di = -1; di <= 1; di++) for(let dj = -1; dj <= 1; dj++){ const L2 = bins.get((bi + di) + ',' + (bj + dj)); if(!L2) continue;
      for(const [wy, i] of L2){ const p = wy.pts[i], q = wy.pts[i + 1], dx = q.a - p.a, dz = q.z - p.z, l2 = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((a - p.a)*dx + (z - p.z)*dz)/l2)), g = Math.hypot(a - p.a - dx*t, z - p.z - dz*t) - wy.half;
        if(g < best){ best = g; wayAt = [p.a + dx*t, p.z + dz*t]; } } }
    return best; };
  // which way a thing at (a, z) faces: toward the nearest way, if one is near; else its own way, by its draw u
  const faceOf = (a, z, u) => { const g = wayGap(a, z); return g < 60*M && wayAt ? Math.atan2(wayAt[1] - z, wayAt[0] - a) : u*Math.PI*2; };
  const offWay = (a, z, room) => wayGap(a, z) > room;
  // a walk along a way: every so far, a point on it, the way's normal there, how far along, and how worn
  const along = (wy, step, fn, start = step/2) => { const P = wy.pts; let next = start, i = 0;
    while(i + 1 < P.length){ const p = P[i], q = P[i + 1], du = (q.u - p.u) || 1; if(q.u < next){ i++; continue; } const t = (next - p.u)/du;
      fn(p.a + (q.a - p.a)*t, p.z + (q.z - p.z)*t, -(q.z - p.z)/du, (q.a - p.a)/du, next, p.dec); next += step; } };
  out.ways = ways;
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
    return { c: 'bldg', w, kind, hM, wM, face: faceOf(a, z, R()) }; });
  // (a town's lights by night, between its houses: streets, yards, windows too small to be houses, out to the far
  //  side of the land; few in the ruins, a fire here and there)
  sow(14, W*0.005, W*0.03, W*2.5, 2, (a, z, r, R) => { const w = V.worldAt(a, z), ci = w === 'wilds' ? V.cityAt(a, z, 0.12) : V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works));
    if(ci < 0.1 || R() > ci*(w === 'ruins' ? 0.12 : 0.9) || T.true(a, z, W*0.004) <= TR.sea) return null; return { c: 'glim', w, big: R() < 0.15 ? 1.5 : 1 }; });
  // WHAT THE HOUSES HOLD ROUND THEM (Ruby: "more placing rules … trees kept back from a house"): each building's
  // footprint, so a tree keeps a few metres back from its walls and a field from its yard
  const BB = W*0.004, bbins = new Map();
  for(const o of out) if(o.c === 'bldg'){ const k = Math.floor(o.a/BB) + ',' + Math.floor(o.z/BB); if(!bbins.has(k)) bbins.set(k, []); bbins.get(k).push(o); }
  const nearBldg = (a, z, room) => { const bi = Math.floor(a/BB), bj = Math.floor(z/BB);
    for(let di = -1; di <= 1; di++) for(let dj = -1; dj <= 1; dj++){ const L2 = bbins.get((bi + di) + ',' + (bj + dj)); if(L2) for(const o of L2) if(Math.hypot(a - o.a, z - o.z) - o.wM*M*0.6 < room) return true; }
    return false; };
  // FIELDS (Ruby: "farmland in rings round a town"; docs/prior-art/ringworld-countryside.md): round each town Works
  // raises, past its last houses, the land is farmed before it is forest, as von Thünen drew it: a patchwork of fields
  // laid out on the town's own lines, thinning with distance, each a crop its climate grows (wheat, barley, hay, pasture,
  // the plough, rapeseed, maize; lavender and vines in dry country; rice in the warm and wet; the builders' gardens, the
  // magic world's moonflowers, the ruins' fallow), hedged in wet country, walled in dry; and on the steep near a town,
  // terraces stepped along the contours. In them, what a field holds: bales on the stubble, ricks in the hay, a flock on
  // the pasture with its shepherd, a scarecrow, hives by the flowers, a harvester at work
  const fields = [], FBIN = W*0.006, fbins = new Map();
  const cropOf = (w, a, z, e, R) => { const dr = V.dryAt(a, z), cold = e > TR.snow*0.32, u = R();
    if(w === 'ruins') return u < 0.75 ? 'fallow' : 'wheat'; if(w === 'builders') return u < 0.6 ? 'garden' : 'pasture'; if(w === 'magic') return u < 0.2 ? 'moonflower' : u < 0.55 ? 'wheat' : u < 0.7 ? 'hay' : 'pasture';
    if(cold) return u < 0.5 ? 'pasture' : u < 0.8 ? 'hay' : 'ploughed';
    if(dr > 0.62) return u < 0.3 ? 'lavender' : u < 0.6 ? 'vines' : u < 0.85 ? 'wheat' : 'stubble';
    if(dr < 0.38 && mnValue(a/(W*0.3) + 2.2, z/(W*0.3) - 6.1, s + 81) > 0.58) return u < 0.85 ? 'rice' : 'pasture';
    return ['wheat', 'wheat', 'barley', 'stubble', 'hay', 'pasture', 'pasture', 'ploughed', 'rapeseed', 'maize'][Math.floor(u*10)]; };
  const inField = (a, z, room = 0) => { const L2 = fbins.get(Math.floor(a/FBIN) + ',' + Math.floor(z/FBIN)); if(!L2) return null;
    for(const f of L2){ const da = a - f.a, dz = z - f.z, u = da*f.ux + dz*f.uz, v = -da*f.uz + dz*f.ux; if(Math.abs(u) < f.hl + room && Math.abs(v) < f.hw + room) return f; } return null; };
  farms.forEach(([a0, z0, w, t], hi) => { if(w === 'neon') return;
    const R = rgRand(s, 1400, hi), th = R()*Math.PI, ux = Math.cos(th), uz = Math.sin(th), strips = R() < 0.35;
    const cu = (strips ? 160 + 80*R() : 90 + 70*R())*M, cv = strips ? cu*(0.22 + 0.12*R()) : cu*(0.6 + 0.5*R()), Rf = (350 + 550*R())*M*(0.6 + t), nu = Math.ceil(Rf/cu), nv = Math.ceil(Rf/cv);
    for(let i = -nu; i <= nu; i++) for(let j = -nv; j <= nv; j++){
      const lu = (i + (j & 1)*0.5*(strips ? 0 : 1))*cu, lv = j*cv, dist = Math.hypot(lu, lv); if(dist > Rf || R() > 1.1 - Math.pow(dist/Rf, 2)) continue;
      const a = a0 + lu*ux - lv*uz, z = z0 + lu*uz + lv*ux; if(Math.abs(z) > W*0.47) continue;
      const g = ground(a, z); if(g.wet || g.coast || (w !== 'wilds' && w !== 'magic' && villageAt(w, a, z) > 0.4) || V.forestAt(a, z) > 0.55) continue;   // (a village's fields come up to its houses; a town's begin past its streets)
      const hl = cu*(0.4 + 0.08*R()), hw = cv*(0.36 + 0.1*R()); if(nearBldg(a, z, Math.min(hl, hw)*0.9) || !offWay(a, z, Math.min(hl, hw)*0.9)) continue;
      // (one farm's fields never lie over its neighbour's)
      if([[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(([p, q]) => inField(a + p*hl*ux - q*hw*uz, z + p*hl*uz + q*hw*ux, 2*M))) continue;
      let f;
      if(g.slope < 0.28) f = { a, z, ux, uz, hl, hw, w, crop: cropOf(w, a, z, g.e, R), step: 0 };
      else if(g.slope < 1.1 && w !== 'builders' && w !== 'ruins'){   // (too steep to plough: terraced along the contour)
        const d = W*0.003, ex = T.true(a + d, z, d) - T.true(a - d, z, d), ez = T.true(a, z + d, d) - T.true(a, z - d, d), gl = Math.hypot(ex, ez) || 1, dr = V.dryAt(a, z);
        f = { a, z, ux: -ez/gl, uz: ex/gl, hl: hl*0.8, hw: hw*0.8, w, crop: dr < 0.42 ? 'rice' : dr > 0.6 ? 'vines' : 'tea', step: (3 + 3*R())*M/Math.max(0.6, g.slope) }; }
      else continue;
      f.edge = f.step ? (f.crop === 'rice' ? 'bund' : 'wall') : f.crop === 'rice' ? 'bund' : w === 'builders' ? 'none' : V.dryAt(a, z) > 0.5 || g.slope > 0.15 ? 'wall' : 'hedge';
      f.i = fields.length; fields.push(f);
      const ext = Math.max(f.hl, f.hw); for(let bi = Math.floor((a - ext)/FBIN); bi <= Math.floor((a + ext)/FBIN); bi++) for(let bj = Math.floor((z - ext)/FBIN); bj <= Math.floor((z + ext)/FBIN); bj++){ const k = bi + ',' + bj; if(!fbins.has(k)) fbins.set(k, []); fbins.get(k).push(f); } } });
  out.fields = fields;
  // THE SHORE (Ruby: "more interactions nobody asked for"): where a town comes down to the water, a boat or two moored
  // off it, each at the end of a wooden jetty run out from the bank; along the tideline now and then a beachcomber
  // droid sorting what the sea left; and where the builders were, or their ruins, now and then a BRIDGE OF HARD LIGHT
  // across the water, from bank to bank, as level as their roads (the nod: Halo's hard-light bridges)
  { const dirs = Array.from({ length: 12 }, (_, q) => [Math.cos(q/12*Math.PI*2), Math.sin(q/12*Math.PI*2)]);
    // (from a point on the bank, the way out to deep water: how far the bank runs before the water, how far to land beyond)
    const across = (a, z, ca, sa, max) => { let wetAt = -1; for(let u = 3*M; u < max; u += 3*M){ const a2 = a + ca*u, z2 = z + sa*u; if(Math.abs(z2) > W*0.47) return null; const wt = T.true(a2, z2, W*0.002) <= TR.sea;
      if(wt && wetAt < 0) wetAt = u; else if(!wt && wetAt >= 0) return { wetAt, land: u }; } return wetAt >= 0 ? { wetAt, land: null } : null; };
    const deck = (pts, mat, w, half, e) => { let u = 0; ways.push({ mat, w, half, main: false, i: ways.length, deck: e, pts: pts.map(([a, z], q) => { if(q) u += Math.hypot(a - pts[q - 1][0], z - pts[q - 1][1]); return { a, z, u, dec: 0 }; }) }); };
    sow(15, W*0.008, W*0.02, W*0.3, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(w === 'neon' || w === 'builders') return null; const g = ground(a, z); if(g.wet || !g.coast || townAt(w, a, z) < 0.04 || R() > 0.6*(0.3 + 0.7*Math.min(1, CL))) return null;
      let best = null; for(const [ca, sa] of dirs){ const q = across(a, z, ca, sa, 60*M); if(q && (!best || q.wetAt < best.q.wetAt)) best = { q, ca, sa }; } if(!best || best.q.wetAt > 30*M) return null;
      const { ca, sa } = best, len = best.q.wetAt + (8 + 12*R())*M, end = [a + ca*len, z + sa*len]; if(T.true(end[0], end[1], W*0.002) > TR.sea) return null;
      const steps = Math.max(2, Math.ceil(len/(4*M))), pts = Array.from({ length: steps + 1 }, (_, q) => [a + ca*len*q/steps, z + sa*len*q/steps]);
      if(w !== 'ruins') deck(pts, 'jetty', w, 1.1*M, TR.sea + 1.0*M);
      const n = w === 'ruins' ? 0 : 1 + Math.floor(R()*2), side = R() < 0.5 ? 1 : -1;
      for(let k = 0; k < n; k++){ const ba = end[0] - ca*k*4*M + (-sa)*side*(2.6 + 0.4*k)*M, bz = end[1] - sa*k*4*M + ca*side*(2.6 + 0.4*k)*M;
        out.push({ c: 'prop', w, kind: 'boat', hM: pkMetres('boat', R()), a: ba, z: bz, r: Math.hypot(ba, bz - L.z0), rs: (R()*4294967296) >>> 0, face: Math.atan2(sa, ca) + (R() - 0.5)*0.4, afloat: true }); }
      if(R() < 0.15) return { c: 'bot', w, kind: 'crab', hM: pkMetres('crab', R()) };
      return null; });
    sow(16, W*0.02, W*0.04, W*0.4, 1, (a, z, r, R) => { const w = V.worldAt(a, z), p = { builders: 0.5, ruins: 0.25, magic: 0.1 }[w] ?? 0.03; if(R() > p*(0.3 + V.works)) return null;
      const g = ground(a, z); if(g.wet || !g.coast) return null; let best = null;
      for(const [ca, sa] of dirs){ const q = across(a, z, ca, sa, 500*M); if(q && q.land && q.land - q.wetAt > 30*M && (!best || q.land < best.q.land)) best = { q, ca, sa }; }
      if(!best) return null; const { ca, sa } = best, len = best.q.land + 6*M, b = [a + ca*len, z + sa*len], e = Math.max(T.true(a, z, W*0.002), T.true(b[0], b[1], W*0.002)) + 1.5*M;
      const steps = Math.max(2, Math.ceil(len/(8*M))); deck(Array.from({ length: steps + 1 }, (_, q) => [a + ca*len*q/steps, z + sa*len*q/steps]), 'hardlight', w, 2.4*M, e); return null; }); }
  // (what each field holds, placed in its own frame: bales in rows on the stubble, a rick or two in the hay, a flock on
  //  the pasture and now and then its shepherd, a scarecrow in the corn, hives along the flowers, a harvester at work;
  //  and along a hedge, now and then a tree left standing in it)
  { const CLF = 0.3 + 0.7*Math.min(1, CL);
    for(const f of fields){ const R = rgRand(s, 1410, f.i), at2 = (u, v) => [f.a + u*f.ux - v*f.uz, f.z + u*f.uz + v*f.ux];
      const put = (kind, u, v, extra = {}) => { const [a, z] = at2(u, v); if(Math.abs(z) > W*0.485) return; out.push({ c: kind === 'shepherd' || kind === 'harvester' ? 'bot' : 'prop', w: f.w, kind, hM: pkMetres(kind, R()), a, z, r: Math.hypot(a, z - L.z0), rs: (R()*4294967296) >>> 0, face: Math.atan2(f.uz, f.ux) + (R() < 0.5 ? 0 : Math.PI), ...extra }); };
      if(f.step) continue;
      if(f.crop === 'stubble' && R() < 0.8*CLF){ const n = 4 + Math.floor(R()*10), rows = 1 + Math.floor(R()*3); for(let k = 0; k < n; k++) put('haybale', (R()*2 - 1)*f.hl*0.85, ((k % rows) + 0.5)/rows*f.hw*1.6 - f.hw*0.8 + (R() - 0.5)*f.hw*0.1); }
      if(f.crop === 'hay' && R() < 0.6*CLF){ const n = 1 + Math.floor(R()*3); for(let k = 0; k < n; k++) put('haystack', (R()*2 - 1)*f.hl*0.7, (R()*2 - 1)*f.hw*0.6); }
      if(f.crop === 'pasture' && R() < 0.55*CLF){ const cu = (R()*2 - 1)*f.hl*0.6, cv = (R()*2 - 1)*f.hw*0.5, n = 3 + Math.floor(R()*10);
        for(let k = 0; k < n; k++){ const an = R()*Math.PI*2, rd = (2 + 14*Math.sqrt(R()))*M; put('sheep', cu + Math.cos(an)*rd, cv + Math.sin(an)*rd*0.7, { face: R()*Math.PI*2 }); }
        if(R() < 0.25) put('shepherd', cu + 18*M, cv); }
      if((f.crop === 'wheat' || f.crop === 'maize' || f.crop === 'barley') && R() < 0.12*CLF) put('scarecrow', (R()*2 - 1)*f.hl*0.5, (R()*2 - 1)*f.hw*0.5);
      if((f.crop === 'wheat' || f.crop === 'barley') && f.w !== 'ruins' && R() < 0.06) put('harvester', (R()*2 - 1)*f.hl*0.6, (R()*2 - 1)*f.hw*0.5, { face: Math.atan2(f.uz, f.ux) });
      if((f.crop === 'lavender' || f.crop === 'rapeseed' || f.crop === 'moonflower') && R() < 0.3*CLF) put('beehives', f.hl + 2*M, (R()*2 - 1)*f.hw*0.8);
      if(f.crop === 'stubble' && f.w !== 'ruins' && R() < 0.04*CLF) put('tractor', f.hl - 6*M, (R()*2 - 1)*f.hw*0.7);
      if(f.edge === 'hedge') for(let k = 0, n = Math.floor(f.hl*2/(25*M)); k < n; k++) if(R() < 0.18*V.life*2){ const side = R() < 0.5 ? -1 : 1, kind = ['broadleaf', 'broadleaf', 'poplar', 'birch'][Math.floor(R()*4)];
        put(kind, -f.hl + (k + 0.5)*f.hl*2/n, side*(f.hw + 1.2*M), {}); out[out.length - 1].c = 'tree'; } } }
  sow(1, W*0.0036, W*0.02, W*2.5, 4, (a, z, r, R) => {
    const w = V.worldAt(a, z), P = RG_PROF[w], tot = P.tr + P.de + P.gt; if(!tot) return null;
    // (fewer trees where a town stands, none under water)
    const town = V.cityAt(a, z, P.cv*(0.3 + 0.9*V.works)); if(T.true(a, z, W*0.004) <= TR.sea || !offWay(a, z, 2*M) || inField(a, z, -2*M)) return null;
    if(R() > Math.min(1, V.forestAt(a, z)*V.life*1.25*tot)*(r < W*0.01 ? 0.35 : 1)*(1 - 0.85*town)) return null;
    const u = R()*tot, kind = u < P.de ? 'dead' : u < P.de + P.gt ? 'glow' : (T2 => T2[Math.floor(R()*T2.length)])(floraAt(w, a, z)), hM = pkMetres(kind, R());
    // (kept back from a house: its crown clear of the walls, by a few metres)
    if(nearBldg(a, z, (3 + hM*0.22)*M)) return null;
    return { c: 'tree', w, kind, hM }; });
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
    switch(k){ case 'haybale': case 'haystack': case 'scarecrow': case 'tractor': case 'beehives': return false; case 'grainbin': return fo < 0.4 && g.slope < 0.3 && ci < 0.3 && !!inField(a, z, 40*M);   // (the field's own things stand in its fields)
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
  for(const wy of ways){ if(wy.deck !== undefined) continue; const w = wy.w, R = rgRand(s, 1200, wy.i), kerb = wy.half + 1.6*M, side = () => R() < 0.5 ? 1 : -1;
    const put = (kind, a, z, nx, nz, sd2, off = 0, extra = {}) => { const a2 = a + nx*sd2*(kerb + off), z2 = z + nz*sd2*(kerb + off); if(Math.abs(z2) > W*0.485 || ground(a2, z2).wet) return null;
      const o = { c: 'prop', w, kind, hM: pkMetres(kind, R()), a: a2, z: z2, r: Math.hypot(a2, z2 - L.z0), rs: (R()*4294967296) >>> 0, face: Math.atan2(-nz*sd2, -nx*sd2), ...extra }; out.push(o); return o; };
    if(RG_LIT_WAYS.includes(wy.mat) && w !== 'wilds'){ let k = 0; along(wy, 25*M, (a, z, nx, nz, u, dec) => { k++; if(inTown(w, a, z) && dec < 0.7 && R() < Math.min(1, 0.3 + 1.4*V.clutter)){ put('lamp', a, z, nx, nz, k % 2 ? 1 : -1);
      // (and now and then, beside a lamp, the lamplighter on its round: seen only about dusk)
      if(w !== 'neon' && R() < 0.012*V.life*2){ const o = put('lamplighter', a + nz*1.2*M, z - nx*1.2*M, nx, nz, k % 2 ? 1 : -1, 0.6*M); if(o) o.c = 'bot'; } } }); }
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
          for(let k = 0; k < 5; k++){ const [ak0, zk0, nkx, nkz] = spots[i + k], ak = ak0 + nkx*sd2*off, zk = zk0 + nkz*sd2*off; out.push({ c: 'board', w, kind: 'serial', v, k, aged: ag, hM: pkBoardSize('serial')[1], wM: pkBoardSize('serial')[0], a: ak, z: zk, r: Math.hypot(ak, zk - L.z0), rs: (R()*4294967296) >>> 0, face: Math.atan2(-nkz*sd2, -nkx*sd2) }); }
          i += 6; continue; }
        if(R() > (BOARD[w] || 0)*CL) continue; const id = pkBoardOf(w, R()); if(!id || PK_SMALL_BOARDS.includes(PK_BOARDS[id].fmt)) continue;
        const [bw, bh] = pkBoardSize(id); out.push({ c: 'board', w, kind: id, aged: age(w, R), hM: bh, wM: bw, a, z, r, rs: (R()*4294967296) >>> 0, face: Math.atan2(-nz*sd2, -nx*sd2) }); } });
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
  // EIGHT VIEWS (Ruby: "front, sides, back, and the half-turned states … one more data value to determine facing angle"):
  // each thing faces a way of its own in the world (a house its street, a lamp the way, a board the traffic; the rest
  // by their own draw), and is drawn as seen from where the eye is: the angle between its facing and the way to the eye
  const viewOf = o => { const face = o.face ?? (o.rs % 62832)/10000, rel = face - Math.atan2(L.z0 - o.z, -o.a); return { cs: Math.cos(rel), sn: Math.sin(rel) }; };
  const mirrored = (X, draw) => { x.save(); x.translate(X, 0); x.scale(-1, 1); x.translate(-X, 0); draw(); x.restore(); };
  // A SETTLEMENT'S LIGHTS (Ruby: "a settlement's lights at night"): a house too far off to draw is a window's light at
  // night, a street lamp a point on its string of them; they come on one by one through the dusk (each its own moment,
  // by its stream), warm or cold by its world's lights, the brightest with a little bloom
  // (with the clock: a light now and then going out for the night or coming on again, each half hour; a fire in the
  //  ruins and one light in sixteen flickering)
  const nightDot = (o, f, l, wday, haze, big = 1) => { const nt = 1 - rsSmooth(0.3, 0.7, wday); if(nt < 0.15 || (o.rs % 997)/997 > nt*1.4 - 0.15) return;
    if(V.time && mnHash(o.rs & 4095, Math.floor(V.time/1800 + (o.rs % 97)/97), s + 840) < 0.15) return;
    const fl = V.time && (o.w === 'ruins' || (o.rs & 15) === 5) ? 0.55 + 0.45*Math.abs(Math.sin(V.time*(7 + (o.rs & 7)) + (o.rs & 255))) : 1;
    const X = f[0], Y = stand(l, X, f[1]) - px(0.6)*big; if(!vis(l, X - px(1), X + px(1), Y - px(2), Y + px(1))) return;
    const lights = V.lightsOf(o.w), col = rsMix(o.rs & 2 ? lights[0] : lights[1] || lights[0], AIR, haze*0.5), r = px(0.55 + 0.5*((o.rs >> 3) % 3)/2)*big;
    x.fillStyle = rsCss(rsMix(col, [255, 255, 255], 0.35), Math.min(1, nt*1.3)*fl); x.fillRect(X - r, Y - r, r*2, r*2);
    if((o.rs & 12) === 12) rgGlow(x, X, Y, r*5, col, 0.35*nt); };
  // WHAT MOVES (Ruby: "robots moving, minor animations"): with the scene's clock, each droid about its work, back and
  // forth along the way it faces (turning round at each end) or round a small circle, at its own pace; a sheep's few
  // steps as it grazes. [metres of its path, seconds for a round, circling?] by kind; the rest stand still
  const RG_MOVES = { helper: [8, 70], drone: [3, 22, 1], crawler: [4, 120], walker: [15, 90], harvester: [30, 300], shepherd: [10, 45, 1], crab: [3, 40], lamplighter: [10, 60], sheep: [0.8, 50] };
  const moved = o => { const mv = V.time && RG_MOVES[o.kind]; if(!mv) return o; const M1 = W*0.00025, ph = (o.rs % 1000)/1000*Math.PI*2, w = Math.PI*2/mv[1], f0 = o.face ?? (o.rs % 62832)/10000;
    if(mv[2]){ const an = V.time*w + ph; return { ...o, a: o.a + Math.cos(an)*mv[0]*M1, z: o.z + Math.sin(an)*mv[0]*M1, face: an + Math.PI/2 }; }
    const u = Math.sin(V.time*w + ph), back = Math.cos(V.time*w + ph) < 0; return { ...o, a: o.a + Math.cos(f0)*u*mv[0]*M1, z: o.z + Math.sin(f0)*u*mv[0]*M1, face: back ? f0 + Math.PI : f0 }; };
  const rgPaintThing = (o0, l, dd) => { const o = moved(o0);
    const f = foot(o.a, o.z); if(!f || (f[3] <= TR.sea && !o.afloat)) return;
    const wday = ringDay(L, o.a), haze = hazeOf(dd), R = mulberry32(o.rs);
    if(o.c === 'tree'){ const h = o.hM*f[2]; if(h < px(1.6) || h > nearCut) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*0.3, X + h*0.3, Y - h, Y, o.kind === 'dead' || o.kind === 'willow' || h < px(4) ? null : [X - h*0.13, X + h*0.13, Y - h*0.8, Y - h*0.4])) return;
      const green = rsMix(o.w === 'ruins' ? [80, 70, 54] : [36, 82, 50], V.land, 0.35), c = colsOf(o.w, wday, haze);
      const tc = { trunk: rgLit(V, [70, 52, 40], wday, haze, AIR), dark: rgLit(V, rsMix(green, BLACK, 0.18), wday, haze, AIR), body: rgLit(V, green, wday, haze, AIR),
        lit: rgLit(V, rsMix(green, [255, 244, 222], 0.3), wday, haze, AIR), glow: c.glow, sd: c.sd, L: LT };
      // (a tree has no front: half of them are drawn mirrored, their light kept where it is)
      if(o.rs & 1) mirrored(X, () => pkTree(x, X, Y, h, pkFlip(tc), o.kind, R, rgPx)); else pkTree(x, X, Y, h, tc, o.kind, R, rgPx); return; }
    if(o.c === 'bldg'){ const h = o.hM*f[2], wd = o.wM*f[2]; if(h < px(1.2)){ nightDot(o, f, l, wday, haze, h > px(0.5) ? 1.3 : 1); return; } if(h > wh*0.75) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - wd, X + wd, Y - h*1.3, Y, o.kind === 'arch' || o.kind === 'needle' || o.kind === 'pylon' ? null : [X - wd*0.4, X + wd*0.4, Y - h*0.3, Y])) return;
      const cb = colsOf(o.w, wday, haze), night = 1 - rsSmooth(0.3, 0.7, wday); pkBuilding(x, X, Y + h*0.03, h, wd, { ...cb, view: viewOf(o), mpx: f[2] }, PK_STYLE[o.w], night, R, rgPx, o.kind);
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
      // (with the clock the tufts sway: gusts travelling over the field, each blade's top leaning and coming back)
      const sway = V.time ? gH*(0.16*Math.sin(V.time*1.7 - o.a/(W*0.002) + (o.rs & 7)) + 0.08*Math.sin(V.time*4.3 + (o.rs & 31))) : 0;
      for(let b = -2; b <= 2; b++) rsPoly(x, [[X + b*gH*0.25, Y], [X + b*gH*0.5 + (R() - 0.5)*gH*0.4 + sway*(1 + 0.15*b), Y - gH*rnd(0.7, 1.4)], [X + b*gH*0.25 + gH*0.15, Y]], rsCss(b*LT[0] > 0 ? gl : gc2));
      if(R() < 0.25*RG_PROF[o.w].gr){ const fc = rsMix(flw[Math.floor(R()*3)], [0, 0, 0], 0.1); x.fillStyle = rsCss(fc); x.beginPath(); x.arc(X, Y - gH*1.1, Math.max(rgPx(0.8), gH*0.18), 0, Math.PI*2); x.fill(); if(o.w === 'magic') rgGlow(x, X, Y - gH*1.1, gH*0.8, fc, 0.6); }
      return; }
    if(o.c === 'egg'){ const h = o.hM*f[2], E = PK_EGGS[o.kind]; if(h < px(o.kind === 'caps' ? 1.2 : 3) || h > wh*0.6) return;
      if(E.loud && loudDrawn >= 1) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*2, X + h*2, Y - h*(o.kind === 'warden' ? 4.2 : o.kind === 'spire' ? 1.1 : 1.8), Y)) return;
      if(E.loud) loudDrawn++;
      const c = colsOf(o.w, wday, haze), vw = viewOf(o); if(vw.sn < 0 && o.kind !== 'diner') mirrored(X, () => pkEgg(x, X, Y + h*0.02, h, pkFlip(c), o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday))); else pkEgg(x, X, Y + h*0.02, h, c, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
    if(o.c === 'henge'){ if(f[2]*o.hm < px(2)) return; const c = colsOf(o.w, wday, haze); rgHenge(x, o, (a, z) => { const q = foot(a, z); return q && [q[0], stand(l, q[0], q[1]), q[2], Math.hypot(a, z - L.z0)]; }, c, R, rgPx); return; }
    if(o.c === 'board'){ const m = f[2], h = o.hM*m, bw = o.wM*m; if(h < px(3) || h > wh*0.6) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - bw/2, X + bw/2, Y - h, Y)) return;
      pkBoard(x, X, Y, m, { ...colsOf(o.w, wday, haze), view: viewOf(o) }, o.kind === 'serial' ? { serial: PK_SERIALS[o.v], k: o.k } : o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday), o.aged); return; }
    if(o.c === 'glim'){ nightDot(o, f, l, wday, haze, o.big); return; }
    if(o.c === 'prop'){ const h = o.hM*f[2]; if(h < px(3)){ if(o.kind === 'lamp') nightDot(o, f, l, wday, haze, 0.8); return; } if(h > wh*(RG_WIDE.includes(o.kind) ? 0.12 : 0.35)) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*2, X + h*2, Y - h*1.1, Y)) return;
      // (set into the ground a little, always; the ruins' wrecks and bikes half buried, clipped where the ground meets them)
      const c = colsOf(o.w, wday, haze), sink = h*(0.025 + (o.sink || 0)), cc = { ...c, noWires: !!o.next, view: o.kind === 'pole' ? null : viewOf(o) };
      if(o.sink){ x.save(); x.beginPath(); x.rect(X - h*6, Y - h*6, h*12, h*6 + h*0.02); x.clip(); pkProp(x, X, Y + sink, h, cc, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); x.restore(); }
      else pkProp(x, X, Y + sink, h, cc, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday));
      // (a road's pole wired to the next one along, the wires sagging between)
      if(o.next){ const f2 = foot(o.next[0], o.next[1]); if(f2) pkWires(x, [X, Y - h*0.95], [f2[0], f2[1] - o.hM*f2[2]*0.95], h, c, rgPx); } return; }
    if(o.c === 'bot'){ const h = o.hM*f[2]; if(h < px(3) || h > wh*0.5) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h, X + h, Y - h*(o.kind === 'drone' ? 3.4 : 1.1), Y)) return;
      const c = { ...colsOf(o.w, wday, haze) }; c.eye = c.glow; const nt = 1 - rsSmooth(0.3, 0.7, wday);
      if(o.kind === 'lamplighter' && !(nt > 0.12 && nt < 0.8)) return;   // (out only about dusk, on its round)
      if(o.kind === 'harvester'){ pkRobot(x, X, Y + h*0.02, h, { ...c, view: viewOf(o) }, o.kind, R, rgPx, nt); return; }
      const bob = V.time && o.kind === 'drone' ? Math.sin(V.time*1.3 + (o.rs & 63))*h*0.12 : 0;   // (a drone hovering, rising and dipping a little)
      if(viewOf(o).sn < 0) mirrored(X, () => pkRobot(x, X, Y + h*0.02 + bob, h, pkFlip(c), o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday))); else pkRobot(x, X, Y + h*0.02 + bob, h, c, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
    // small life: found rather than seen
    const hh = 2.8*f[2]; if(hh < px(3) || hh > wh*0.2) return;
    const X = f[0], Y = stand(l, X, f[1]); if(Y < px(4) || Y > wh*0.95 || !vis(l, X - hh, X + hh, Y - hh*1.4, Y)) return;
    const glow = colsOf(o.w, wday, haze).glow;
    const lc = { night: 1 - rsSmooth(0.3, 0.7, wday), dark: rgLit(V, [34, 30, 28], wday, haze, AIR), lit: rgLit(V, [236, 240, 246], wday, haze, AIR), glow,
      flowers: [V.g1, V.g2, [244, 238, 228]].map(g => rgLit(V, rsMix(g, [0, 0, 0], 0.1), Math.max(0.4, wday), haze, AIR)),
      slime: rgLit(V, rsMix(V.g2, [120, 200, 150], 0.45), Math.max(0.4, wday), haze, AIR) };
    rgSmallLife(x, X, Y, hh*(0.8 + 0.4*R()), o.kind, lc, R, V.time);
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
      for(const P of run.length ? [pc.q] : [pc.p, pc.q]){ const e = wy.deck ?? Math.max(TR.sea, T(P.a, P.z, W*0.002)) + W*0.00003, A = at(P.a - pc.nx*wy.half, P.z - pc.nz*wy.half, e), B = at(P.a + pc.nx*wy.half, P.z + pc.nz*wy.half, e);
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
    // (a jetty: its planks across, the posts under its edges down into the water; a bridge of hard light: a pale sheet of
    //  light, its edges burning, faint chevrons along it, nothing beneath)
    if(wy.mat === 'jetty'){ for(let q = 0; q < run.length; q++){ const wq = wid(q); if(wq > px(4)) line([mix(q, 0), mix(q, 1)], rsCss(lit([70, 54, 40]), 0.6), Math.max(px(0.4), wq*0.05));
      for(const t of [0.05, 0.95]){ const [X, Y] = mix(q, t); line([[X, Y], [X, Y + Math.max(px(1), wq*0.7)]], rsCss(lit([60, 46, 34])), Math.max(px(0.5), wq*0.08)); } } }
    if(wy.mat === 'hardlight'){ const hl = rsMix(c.glow, [150, 230, 255], 0.6); x.save(); x.globalCompositeOperation = 'screen'; rsPoly(x, poly, rsCss(hl, 0.2));
      line(L2, rsCss(hl, 0.85), Math.max(px(0.8), wpx*1.2)); line(R2, rsCss(hl, 0.85), Math.max(px(0.8), wpx*1.2)); line(L2, rsCss(hl, 0.25), wpx*5); line(R2, rsCss(hl, 0.25), wpx*5);
      for(let q = 1; q < run.length - 1; q += 2){ if(wid(q) < px(6)) continue; const A = mix(q, 0.2), B = mix(q, 0.8), Cn = mix(Math.min(run.length - 1, q + 1), 0.5); line([A, Cn, B], rsCss(hl, 0.35), Math.max(px(0.5), wpx*0.6)); } x.restore(); }
    if(wy.w === 'neon' && wy.mat === 'asphalt'){ x.save(); x.globalCompositeOperation = 'screen'; line(L2, rsCss(c.glow2, 0.35), wpx*1.6); line(R2, rsCss(c.glow, 0.35), wpx*1.6); x.restore(); }
    // (wear: where it is worn, cracks across it and potholes in it, weeds along its edges)
    for(let q = 0; q < run.length; q++){ const dc = decs[q]; if(dc < 0.4) continue; const wq = wid(q);
      if(Rm() < dc){ const A = mix(q, 0.1 + 0.3*Rm()), B = mix(Math.min(run.length - 1, q + 1), 0.5 + 0.4*Rm()); line([A, [(A[0] + B[0])/2 + (Rm() - 0.5)*wq*0.2, (A[1] + B[1])/2], B], rsCss(lit([30, 28, 26]), 0.6), Math.max(px(0.4), wpx*0.6)); }
      if(dc > 0.55 && Rm() < 0.5 && wq > px(6)){ const [X, Y] = mix(q, 0.2 + 0.6*Rm()); x.fillStyle = rsCss(lit([40, 36, 32]), 0.7); x.beginPath(); x.ellipse(X, Y, wq*0.12, wq*0.05, 0, 0, Math.PI*2); x.fill(); }
      if(wq > px(5)) for(const t of [0.02, 0.98]) if(Rm() < dc){ const [X, Y] = mix(q, t), gh = Math.min(px(6), wq*0.12); x.fillStyle = rsCss(lit([70, 104, 58]), 0.85); x.beginPath(); x.moveTo(X - gh*0.5, Y); x.lineTo(X, Y - gh); x.lineTo(X + gh*0.5, Y); x.fill(); } } };

  // THE FIELDS on the floor (the store's), as the ways are: each cut into pieces, finer near you, each piece lying on
  // the land between its corners and drawn with the ridge before it; a crop's colour mottled by the land's own noise,
  // its rows or furrows where they can be seen (along the field's length), a hay field's mowing stripes, a paddy's
  // water holding the sky; terraces stepped down the slope; and round each, its hedge or its wall standing up from the
  // ground, a paddy's low bund
  const fieldPieces = []; for(const f of store.fields){ const dist = Math.hypot(f.a, f.z - L.z0), ext = Math.max(f.hl, f.hw); if(keep(f.a, f.z, ext) == null || dist > W*0.8) continue;
    const sz = Math.max(W*0.0005, dist*0.06), nu = Math.max(1, Math.min(10, Math.ceil(f.hl*2/sz))), nv = Math.max(1, Math.min(10, Math.ceil(f.hw*2/sz)));
    for(let i = 0; i < nu; i++) for(let j = 0; j < nv; j++){ const u0 = -f.hl + 2*f.hl*i/nu, u1 = -f.hl + 2*f.hl*(i + 1)/nu, v0 = -f.hw + 2*f.hw*j/nv, v1 = -f.hw + 2*f.hw*(j + 1)/nv, um = (u0 + u1)/2, vm = (v0 + v1)/2;
      fieldPieces.push({ f, u0, u1, v0, v1, dd: cutOf(f.a + um*f.ux - vm*f.uz, f.z + um*f.uz + vm*f.ux) }); } }
  const drawFields = (dn, df) => { for(const pc of fieldPieces) if(pc.dd > dn && pc.dd <= df) paintFieldPiece(pc); };
  const paintFieldPiece = ({ f, u0, u1, v0, v1 }) => {
    const wa = (u, v) => [f.a + u*f.ux - v*f.uz, f.z + u*f.uz + v*f.ux], M1 = W*0.00025, lift = W*0.00002;
    const P = (u, v, up = 0) => { const [a, z] = wa(u, v); return at(a, z, Math.max(TR.sea, T(a, z, W*0.002)) + lift + up); };
    const q = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; if(q.some(p => !p)) return;
    const [am, zm] = wa((u0 + u1)/2, (v0 + v1)/2), day = ringDay(L, am), haze = hazeOf(Math.hypot(am, zm - L.z0)), lit = col => rgLit(V, col, day, haze, AIR), C = RG_CROPS[f.crop] || RG_CROPS.pasture;
    const n1 = mnValue(am/(W*0.004) + f.i*0.37, zm/(W*0.004), s + 83), ppm = W*0.00025*F/q[0][2];
    // (near you a field is a wash over the land, so the land's own rise and fall shows through it; further off, its colour)
    const near0 = 0.3 + 0.7*rsSmooth(120*M1, 520*M1, Math.hypot(am, zm - L.z0));
    let base = rsMix(C.c, n1 > 0.5 ? [255, 250, 230] : [0, 0, 0], Math.abs(n1 - 0.5)*0.16); if(C.water) base = rsMix(base, AIR, 0.15);
    rsPoly(x, q.map(p => [p[0], p[1]]), rsCss(lit(base), near0));
    if(C.water && ppm > px(0.05)){ x.save(); x.globalCompositeOperation = 'screen'; rsPoly(x, q.map(p => [p[0], p[1]]), rsCss(rsMix(AIR, [255, 255, 255], 0.3), 0.18*day + 0.04)); x.restore(); }
    // (rows, furrows, mowing stripes or terrace steps: lines along the field's length, at their spacing across it)
    const step = f.step || (C.row ? C.row[0]*M1 : C.stripe ? C.stripe[0]*M1 : 0);
    if(step && step*ppm/M1 > px(1.6)){ const k0 = Math.ceil((v0 + f.hw)/step), k1 = Math.floor((v1 + f.hw)/step);
      if(k1 - k0 < 60) for(let k = k0; k <= k1; k++){ const v = -f.hw + k*step, A = P(u0, v), B = P(u1, v); if(!A || !B) continue;
        if(f.step){ const wdt = Math.max(px(0.6), step*ppm/M1*0.22); x.strokeStyle = rsCss(lit(rsMix(base, [0, 0, 0], 0.35)), 0.8); x.lineWidth = wdt; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
          x.strokeStyle = rsCss(lit(rsMix(base, [255, 248, 230], 0.25)), 0.7); x.lineWidth = Math.max(px(0.4), wdt*0.35); x.beginPath(); x.moveTo(A[0], A[1] - wdt*0.6); x.lineTo(B[0], B[1] - wdt*0.6); x.stroke(); continue; }
        const rc = C.row ? C.row[1] : C.stripe[1]; if(C.stripe && k % 2) continue;
        x.strokeStyle = rsCss(lit(rc), C.stripe ? 0.55 : 0.75); x.lineWidth = Math.max(px(0.4), step*ppm/M1*(C.stripe ? 0.5 : 0.35)); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); } }
    if(C.glow){ const nt = 1 - rsSmooth(0.3, 0.7, day); if(nt > 0.2){ const [cx, cy] = [(q[0][0] + q[2][0])/2, (q[0][1] + q[2][1])/2]; rgGlow(x, cx, cy, Math.hypot(q[2][0] - q[0][0], q[2][1] - q[0][1])*0.6, colsOf(f.w, day, haze).glow, 0.25*nt); } }
    // (its hedge or wall, along whichever of the field's own edges this piece lies on, standing up from the ground)
    const edges = []; if(v0 <= -f.hw + 1e-9) edges.push([u0, v0, u1, v0]); if(v1 >= f.hw - 1e-9) edges.push([u0, v1, u1, v1]); if(u0 <= -f.hl + 1e-9) edges.push([u0, v0, u0, v1]); if(u1 >= f.hl - 1e-9) edges.push([u1, v0, u1, v1]);
    if(f.edge === 'none' || !edges.length) return;
    const H = f.edge === 'hedge' ? 1.6*M1 : f.edge === 'wall' ? 1.1*M1 : 0.3*M1, col = f.edge === 'hedge' ? rsMix([62, 102, 56], V.land, 0.3) : f.edge === 'wall' ? [150, 144, 132] : rsMix(C.c, [120, 104, 80], 0.6);
    for(const [ua, va, ub, vb] of edges){ const A = P(ua, va), B = P(ub, vb), A2 = P(ua, va, H), B2 = P(ub, vb, H); if(!A || !B || !A2 || !B2) continue;
      if(A[1] - A2[1] < px(0.8)){ x.strokeStyle = rsCss(lit(rsMix(col, [0, 0, 0], 0.2)), 0.7); x.lineWidth = Math.max(px(0.5), A[1] - A2[1]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); continue; }
      rsPoly(x, [[A[0], A[1]], [B[0], B[1]], [B2[0], B2[1]], [A2[0], A2[1]]], rsCss(lit(rsMix(col, [0, 0, 0], 0.18))));
      x.strokeStyle = rsCss(lit(rsMix(col, [255, 246, 226], 0.22))); x.lineWidth = Math.max(px(0.4), (A[1] - A2[1])*0.25); x.beginPath(); x.moveTo(A2[0], A2[1]); x.lineTo(B2[0], B2[1]); x.stroke();
      // (near, a hedge's top is ragged with leaves; a wall's stones show)
      const len = Math.hypot(B[0] - A[0], B[1] - A[1]), hh = A[1] - A2[1]; if(hh > px(4)){ const Rh = mulberry32((f.i*977 + Math.round(ua*1e4) + Math.round(va*1e4)) >>> 0), n = Math.min(40, Math.floor(len/(hh*0.5)));
        for(let k = 0; k < n; k++){ const t = (k + Rh())/n, X = A2[0] + (B2[0] - A2[0])*t, Y = A2[1] + (B2[1] - A2[1])*t;
          if(f.edge === 'hedge') rsPoly(x, [[X - hh*0.3, Y + hh*0.1], [X, Y - hh*(0.15 + 0.25*Rh())], [X + hh*0.3, Y + hh*0.1]], rsCss(lit(rsMix(col, Rh() < 0.5 ? [255, 246, 226] : [0, 0, 0], 0.15))));
          else { x.fillStyle = rsCss(lit(rsMix(col, Rh() < 0.5 ? [255, 246, 226] : [0, 0, 0], 0.18)), 0.8); x.fillRect(X - hh*0.25, Y + hh*(0.15 + 0.6*Rh()), hh*0.45, hh*0.2); } } } } };

  // THE CLOUDS AS THINGS IN THE WORLD (Ruby: "clouds will need distance, lod, parallaxing, transparency, blending, and to
  // not clip with other objects"): each heap of cumulus stands at its own place over the band, its base at its own height
  // above the sea, its size in metres, so it is drawn at its distance among the ridges (a nearer hill hides it, a far
  // range stands behind it, a high peak pokes up through it), seen from below or, from high up, from above; hazed as
  // the land is by the air between; detailed by how large it is (more and smaller billows near, a few far); painted
  // whole on its own sheet and laid on the page at once, see-through at its edges, so its billows never darken each
  // other; and with the clock carried by the wind. A storm's towers carry their anvils, rain falls from their bases to
  // the ground below them, and lightning strikes from one of them down to the land
  { const wx = V.weather, cloudy = wx === 'clouds' || wx === 'rain' || wx === 'storm' || wx === 'snow';
    if(cloudy){ const R0 = rgRand(s, 850), n = wx === 'clouds' ? 12 + Math.floor(R0()*8) : 18 + Math.floor(R0()*10), M1 = W*0.00025, A = W*1.6, Zh = W*0.44, storm = wx === 'storm';
      const [wAng, wSp] = rgWind(V), wrap = (v, h) => ((v + h) % (2*h) + 2*h) % (2*h) - h;
      const lxC = V.sun.screen[0] > 0 ? 1 : -1, strike = storm && (!V.time || mnHash(Math.floor(V.time/Math.max(0.25, Math.min(4, V.dt || 0.25))), 3, s + 818) < 0.12) ? Math.floor(R0()*n) : -1;
      for(let k = 0; k < n; k++){ const R = rgRand(s, 851, k), rnd = (a, b) => a + (b - a)*R();
        const tc = rgCloudTime(V), a = wrap((R()*2 - 1)*A + Math.cos(wAng)*wSp*M1*tc, A), z = wrap((R()*2 - 1)*Zh + Math.sin(wAng)*wSp*M1*tc*0.3, Zh);
        const eb = Math.max(TR.sea, TR.snow*rnd(0.7, 1.05)), wd0 = rnd(250, 900)*M1*(storm ? 1.4 : 1), ht0 = wd0*rnd(0.35, storm ? 1.3 : 0.7), seed0 = (R()*4294967296) >>> 0, rain = (wx === 'rain' || storm) && R() < 0.6;
        // (a cumulus lives a quarter of an hour or so: with the clock each grows old, thins and is gone, and another builds
        //  in its place, of its own shape; at the film's start each is at its fullest, as a still shows it)
        const lifeT = (900 + 1500*R())*(storm ? 2 : 1), cyc = V.time ? Math.floor(tc/lifeT) : 0, lp = V.time ? (tc/lifeT) % 1 : 0;
        const life = rsSmooth(0.75, 0.55, lp) + rsSmooth(0.8, 1, lp), wd = wd0*(0.35 + 0.65*life), ht = ht0*(0.25 + 0.75*life), seed = (seed0 ^ Math.imul(cyc, 0x9E3779B1)) >>> 0;
        if(life < 0.04) continue; const dd = keep(a, z, wd); if(dd == null) continue;
        things.push({ dd, draw: l => paintHeap({ a, z, eb, wd, ht, seed, rain, life, bolt: k === strike }, l, dd) }); }
      const paintHeap = (h, l, dd) => { const B = at(h.a, h.z, h.eb); if(!B) return; const kpx = F/B[2], W0 = h.wd*kpx, H0 = h.ht*kpx; if(W0 < px(2) || W0 > ww*3) return;
        const X = B[0], Y = B[1]; if(!vis(l, X - W0*0.8, X + W0*0.8, Y - H0*1.2, Y)) return;
        const day = ringDay(L, h.a), haze = hazeOf(dd), dusk = rgClamp(1 - Math.abs(day - 0.5)*3.2), R = mulberry32(h.seed), rnd = (a, b) => a + (b - a)*R();
        const white = rsMix(rgLit(V, [244, 244, 250], day, 0, AIR), [255, 170, 140], dusk*0.4), grey = rsMix(white, [70, 74, 86], storm ? 0.6 : wx === 'rain' ? 0.38 : wx === 'snow' ? 0.15 : 0.05);
        const base = rsMix(rsMix(grey, [40, 44, 60], 0.25), AIR, haze*0.85), lit = rsMix(rsMix(grey, [255, 248, 236], 0.35*rsSmooth(0.3, 0.75, day) + 0.1), AIR, haze*0.85);
        // (its billows: as many as fill its size, more and smaller the nearer and larger it is, the lower ones squashed flat
        //  on the base; a tower's billows climb it)
        const S0 = Math.sqrt(W0*Math.max(H0, W0*0.35)), pr0 = S0*0.11, np = Math.max(10, Math.min(64, Math.round(W0*H0/(pr0*pr0)*0.55), Math.round(W0/px(4))));
        const pad = W0*0.25 + pr0*1.5, cw = Math.ceil(W0*1.5 + pad*2), ch = Math.ceil(H0*1.3 + pad*2), ox = X - cw/2, oy = Y - H0*1.15 - pad;
        if(cw*ch > 4.2e6) return; const [cc, cx] = kitCanvas(cw, ch), L0 = (px0, py) => [px0 - ox, py - oy], puffs = [];
        for(let q = 0; q < np; q++){ const v = Math.pow(R(), 0.8), half = 0.5*Math.pow(1 - v, 0.5)*(0.75 + 0.25*R()) + 0.08, u = 0.5 + (R()*2 - 1)*half;
          puffs.push([X - W0/2 + W0*u, Y - H0*v*0.92 - pr0*0.4, pr0*rnd(0.7, 1.35)*(0.75 + 0.5*(1 - Math.abs(u - 0.5)*2))]); }
        // (soft as a painter's cloud: each billow a gradient, its rim fading into the air, so the edge is soft and no
        //  billow outlines another; then its body lit toward the sun and from above; the lit caps on top; the flat
        //  shaded base beneath it all)
        for(let q = 0; q < 6; q++){ const [qx, qy] = L0(X - W0*0.42 + W0*0.84*q/5, Y - pr0*0.2), g = cx.createRadialGradient(qx, qy, 0, qx, qy, W0*0.16); g.addColorStop(0, rsCss(base, 0.8)); g.addColorStop(1, rsCss(base, 0));
          cx.save(); cx.translate(qx, qy); cx.scale(1, 0.32); cx.translate(-qx, -qy); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, W0*0.16, 0, Math.PI*2); cx.fill(); cx.restore(); }
        for(const [p0, p1, r] of puffs){ const [qx, qy] = L0(p0, p1), g = cx.createRadialGradient(qx, qy, r*0.55, qx, qy, r*1.3); g.addColorStop(0, rsCss(base, 0.95)); g.addColorStop(1, rsCss(base, 0)); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, r*1.3, 0, Math.PI*2); cx.fill(); }
        puffs.sort((p, q) => q[1] - p[1]);   // (the lower billows first, so the upper ones sit on them)
        for(const [p0, p1, r] of puffs){ const [qx, qy] = L0(p0, p1), up = rsSmooth(Y, Y - H0, p1), body = rsMix(base, lit, 0.35 + 0.4*up), g = cx.createRadialGradient(qx + lxC*r*0.3, qy - r*0.35, 0, qx, qy, r);
          g.addColorStop(0, rsCss(rsMix(body, lit, 0.5))); g.addColorStop(0.7, rsCss(body)); g.addColorStop(1, rsCss(rsMix(body, base, 0.6), 0.6)); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, r, 0, Math.PI*2); cx.fill(); }
        for(const [p0, p1, r] of puffs) if(p1 < Y - H0*0.45){ const [qx, qy] = L0(p0 + lxC*r*0.3, p1 - r*0.35), g = cx.createRadialGradient(qx, qy, 0, qx, qy, r*0.6); g.addColorStop(0, rsCss(lit, 0.75)); g.addColorStop(1, rsCss(lit, 0)); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, r*0.6, 0, Math.PI*2); cx.fill(); }
        // rain from its base to the ground under it, slanting with the wind, fading as it falls
        if(h.rain){ const G = at(h.a, h.z, Math.max(TR.sea, T(h.a, h.z, W*0.003))); if(G && G[1] > Y){ const ln = G[1] - Y, sl = Math.cos(wAng)*W0*0.12, g = x.createLinearGradient(0, Y, 0, G[1]);
          g.addColorStop(0, rsCss(base, 0.3)); g.addColorStop(1, rsCss(base, 0.04)); x.fillStyle = g;
          for(let q = 0; q < 7; q++){ const u0 = -0.4 + 0.7*R(), w0 = W0*rnd(0.03, 0.1); x.beginPath(); x.moveTo(X + u0*W0, Y); x.lineTo(X + u0*W0 + w0, Y); x.lineTo(X + u0*W0 + w0 + sl, G[1]); x.lineTo(X + u0*W0 + sl, G[1]); x.fill(); } } }
        x.save(); x.globalAlpha = (0.93 - 0.25*haze)*Math.min(1, (h.life ?? 1)*1.3); x.drawImage(cc, ox, oy); x.restore(); cc.width = 0;
        // a bolt of lightning from its base down to the land (with the clock, now and then)
        if(h.bolt){ const G = at(h.a + W0/kpx*0.1, h.z, Math.max(TR.sea, T(h.a, h.z, W*0.003))); if(G && G[1] > Y){ let bx = X + (R() - 0.5)*W0*0.3, by = Y; const pts = [[bx, by]], steps = 10;
          for(let q = 0; q < steps; q++){ bx += (G[0] - bx)/(steps - q) + (R() - 0.5)*W0*0.08; by += (G[1] - by)/(steps - q); pts.push([bx, by]); }
          x.save(); x.globalCompositeOperation = 'screen'; x.strokeStyle = rsCss([226, 226, 255], 0.95); x.lineWidth = Math.max(px(1), W0*0.006); x.lineJoin = 'round'; x.beginPath(); pts.forEach(([p0, p1], q) => q ? x.lineTo(p0, p1) : x.moveTo(p0, p1));
          const fk = pts[4]; x.moveTo(fk[0], fk[1]); x.lineTo(fk[0] + W0*0.08, fk[1] + (G[1] - Y)*0.2); x.lineTo(fk[0] + W0*0.05, fk[1] + (G[1] - Y)*0.35); x.stroke();
          rgGlow(x, pts[0][0], pts[0][1], W0*0.9, [200, 200, 255], 0.45); rgGlow(x, G[0], G[1], W0*0.25, [220, 220, 255], 0.5); x.restore(); } } }; } }

  // ---- 4. BACK TO FRONT ----
  const bySlot = lay.map(() => []);
  for(const t of things){ const j = slot(t.dd); if(j >= 0){ t.l = lay[j]; bySlot[j].push(t); } }
  things.sort((p, q) => p.dd - q.dd); for(const t of things) if(t.l && t.draw){ cur = t; t.draw(t.l); }
  painting = true;
  let prevY = null;
  const MIST = { fog: 0.075, rain: 0.035, storm: 0.03, snow: 0.045 }[V.weather] || 0, MISTC = rsMix(AIR, [236, 238, 242], 0.35);
  const LOWMIST = (V.weather === 'clear' || V.weather === 'clouds') && seedChoice(V.seed, 'mist')() < 0.6 ? 0.22*rgClamp(1 - Math.abs(V.dayHere - 0.5)*3.5) : 0;
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
        // (with the clock the glints move on the water)
        if((V.time ? wn(am + V.time*W*0.000002, zm, l.ws, 1) : n1) < 0.5){ x.fillStyle = rsCss(rsMix(cl, [255, 255, 255], 0.3*day + 0.05)); x.fillRect(p0.X, p0.Y + depth*n2*0.25, (p1.X - p0.X)*(0.3 + 0.6*n3), Math.max(rgPx(1), depth*0.03)); } continue; }
      const face = rsFace(dark, lit, p1.Y - p0.Y, p0.X - p1.X, LT), slope = Math.abs(p1.Y - p0.Y)/Math.max(1, Math.abs(p1.X - p0.X));
      if(slope > 0.32){ const q0 = [p0.X + (p1.X - p0.X)*(n1 - 0.5)*0.3, p0.Y + depth*(0.35 + 0.45*n2)], q1 = [p1.X, p1.Y + depth*(0.35 + 0.45*n3)];
        rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], q0], rsCss(jit(face, 0.03, n4))); rsPoly(x, [[p1.X, p1.Y], q1, q0], rsCss(jit(rsMix(face, dark, 0.2), 0.03, n1))); }
      // (the lit band under a gentle crest: its lower edge by the land's own noise at each point, so it runs on from
      //  facet to facet without a step)
      else { const bdOf = p => depth*(0.1 + 0.14*wn(p.a, p.z, l.ws, 2)), bd = bdOf(p1); rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], [p1.X, p1.Y + bd], [p0.X, p0.Y + bdOf(p0)]], rsCss(jit(rsMix(face, lit, 0.35), 0.02, n4)));
        // FIELDS (Ruby: "more detail in the distance … in the ground"): where people farm (open, low, not forest, not
        // town), the land below a crest is a mosaic of fields, each its crop's colour by where it lies (ripe, green,
        // fallow, now and then in flower), hedged with a dark line; far off, at the scale a painter shows them
        const fw = V.worldAt(am, zm);
        if((fw === 'wilds' || fw === 'cities' || fw === 'builders') && d > W*0.5 && d < W*2.2 && p0.ec < TR.snow*0.4 && V.forestAt(am, zm) < 0.35 && V.cityAt(am, zm, RG_PROF[fw].cv*(0.3 + 0.9*V.works)) < 0.2 && V.dryAt(am, zm) < 0.68){
          const CROPS = [[206, 176, 92], [104, 140, 66], [138, 106, 72], [176, 190, 98], [150, 122, 170]], cs = W*0.012, hedge = rsCss(rsMix(dark, BLACK, 0.2), 0.5);
          for(let b = 0; b < 3; b++){ const v0 = 0.18 + b*0.26, v1 = v0 + 0.22, fi = Math.floor(am/cs), fj = Math.floor(zm/cs) + b*7, hv = mnHash(fi, fj, s + 77);
            if(hv < 0.25) continue; const crop = CROPS[Math.min(4, Math.floor(hv*hv*5.6))], fc = rgLit(V, rsMix(gc, crop, 0.45), day, haze, AIR);
            const A = [p0.X, p0.Y + depth*v0], B = [p1.X, p1.Y + depth*v0], C2 = [p1.X, p1.Y + depth*v1], D = [p0.X, p0.Y + depth*v1];
            rsPoly(x, [A, B, C2, D], rsCss(fc, 0.75)); x.strokeStyle = hedge; x.lineWidth = Math.max(px(0.6), depth*0.012); x.beginPath(); x.moveTo(D[0], D[1]); x.lineTo(C2[0], C2[1]); x.stroke(); } } }
      x.strokeStyle = rsCss(rsMix(lit, [255, 250, 236], 0.3*(1 - haze)), 0.7*day + 0.1); x.lineWidth = Math.max(px(1.2), depth*0.025); x.beginPath(); x.moveTo(p0.X, p0.Y); x.lineTo(p1.X, p1.Y); x.stroke(); }
    // then the roads and the things between this ridge and the next nearer one, far to near
    const dn = li + 1 < lay.length ? lay[li + 1].d : 0; drawFields(dn, d); drawWays(dn, d);
    bySlot[li].sort((p, q) => q.dd - p.dd); for(const t of bySlot[li]){ if(t.o) drawWork(t.o, l); else if(t.ok){ cur = t; t.draw(l); } }
    // (in fog, rain or snow the air thickens between each ridge and the next, so the far ridges sink into it, layer on layer)
    if(MIST && li < lay.length - 2){ x.fillStyle = rsCss(MISTC, MIST); x.fillRect(0, 0, ww, wh); }
    // (at dawn and dusk on a still day, mist lies in the low land: a soft pale band along the foot of each low ridge, thicker
    //  the lower it lies, breathing a little with the clock)
    if(LOWMIST > 0 && d > W*0.01 && li < lay.length - 1){ const lowness = rsSmooth(TR.snow*0.25, TR.sea, mid.ec); if(lowness > 0.05){ const yB = yC + depth*0.5, a = LOWMIST*lowness*(0.8 + 0.2*Math.sin(V.time*0.002 + li));
      const g = x.createLinearGradient(0, yC - depth*0.15, 0, yB); g.addColorStop(0, rsCss(MISTC, 0)); g.addColorStop(0.6, rsCss(MISTC, a)); g.addColorStop(1, rsCss(MISTC, 0)); x.fillStyle = g; x.fillRect(0, yC - depth*0.15, ww, depth*0.65); } }
  });
  // ---- 5. THE AIR OVER IT ALL: the sun's glare low in the sky, and the weather falling ----
  const sp = V.sun.at; if(sp && V.weather !== 'fog'){ const el = Math.asin(Math.max(-1, Math.min(1, -V.sun.D[0]))); if(el < 0.45){ const r = F*(0.6 + 0.5*(0.45 - el)), dk = ringDay(L, 0), col = rsMix([255, 232, 196], [255, 160, 120], rgClamp(1 - Math.abs(dk - 0.5)*3.2)*0.6);
    x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); g.addColorStop(0, rsCss(col, 0.22)); g.addColorStop(0.4, rsCss(col, 0.07)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(sp[0] - r, sp[1] - r, r*2, r*2); x.restore(); } }
  if(V.weather === 'rain' || V.weather === 'storm'){ const R = rgRand(s, 820), n = Math.round(ww*wh/(px(26)*px(26))), sl = 0.18; x.strokeStyle = rsCss(rsMix(AIR, [230, 236, 246], 0.5), V.weather === 'storm' ? 0.24 : 0.18); x.lineWidth = Math.max(px(0.5), px(0.9)); x.beginPath();
    // (with the clock each streak falls on, steeply, and comes round again at the top)
    const fall = V.time*wh*1.6; for(let k = 0; k < Math.min(n, 4000); k++){ const ln = px(10 + 30*R()), X0 = R()*ww, Y = ((R()*wh + fall) % (wh + ln)) - ln, X = ((X0 + fall*sl) % ww); x.moveTo(X, Y); x.lineTo(X + ln*sl, Y + ln); } x.stroke();
    if(V.weather === 'storm'){ x.fillStyle = rsCss([20, 24, 44], 0.16); x.fillRect(0, 0, ww, wh); } }
  if(V.weather === 'snow'){ const R = rgRand(s, 821), n = Math.min(3000, Math.round(ww*wh/(px(34)*px(34)))); x.fillStyle = rsCss([250, 252, 255], 0.85); x.beginPath();
    for(let k = 0; k < n; k++){ const X0 = R()*ww, Y0 = R()*wh, r = px(0.8 + 2.6*Math.pow(R(), 3)), sp2 = wh*(0.05 + 0.04*r/px(3.4)), Y = (Y0 + V.time*sp2) % wh, X = ((X0 + Math.sin(V.time*0.8 + k)*px(6)*(V.time ? 1 : 0)) % ww + ww) % ww;   // (with the clock: drifting down, swaying, the near flakes faster)
      x.moveTo(X + r, Y); x.arc(X, Y, r, 0, Math.PI*2); } x.fill(); }
}

// the weather (both parts read it the same way, so the arch's clouds and the land's rain agree)
const RG_WEATHER_SEL = ['weather', 'Weather', 'select', 'by the seed', { options: ['by the seed', 'clear', 'clouds', 'rain', 'storm', 'snow', 'fog'] }];
export const RING_STEPS = {
  ringarch: { cat: 'Textures', label: 'The Arch', ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'ring'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Life', 50),
      RG_R('works', 'Works', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99),
      ['saturn', 'Gas Giant', 'select', 'by the seed', { options: ['by the seed', 'never', 'always'] }], RG_WEATHER_SEL], cost: () => 4,
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
