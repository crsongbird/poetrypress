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
import { mulberry32, kitCanvas, kitOwn, seedChoice } from './texCore.js';
import { WK_KINDS, WK_FLYERS, wkAt, wkCount, wkPaint, wkWander, wkNoise } from './wildKit.js';
import { lkLand, LK_BIOMES, LK_FORESTED } from './landKit.js';
import { ringParams, ringCamera, ringDay, ringSunDir, mnHash, mnValue, RING_COV, RING_SQR } from './stepsGenerative.js';
import { rsMix, rsCss, rsPoly, rsFace, rsSmooth, paintSaturn, paintEnceladus } from './stepsWhimsy.js';
import { PK_TREES, pkTree, PK_STYLE, pkBuilding, pkRock, PK_STONES, pkSpire, pkMonolith, pkStone, pkLintel, pkDome, pkCrystals, pkMetres, pkArchOf, pkVernacularOf, PK_FLORA, PK_BOTS, PK_BOTS3, pkRobot, PK_PROPS, PK_PROPS_BIG, pkProp, pkWires, pkFlip, PK_EGGS, pkEgg, PK_BOARDS, PK_SERIALS, pkBoardOf, pkBoardSize, pkBoard } from './paintKit.js';

const RG_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
// DETAIL (Ruby: "longer view distance with higher detail (low, medium, high, ultra) … The current values represent
// medium"): how much farther, and how much more finely, the things round the eye are sown, by step
const RG_DETAIL = [0.6, 1, 1.6, 2.4];
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
  wilds:    { tr: 1,    de: 0.05, gt: 0,   to: 0,    sp: 0.05, sa: 0.12, mo: 0.35, cr: 0.12, ci: 0,   pi: 0,    do: 0,    br: 0,   ca: 0,   wr: 0.07, sh: 0.15, be: 1,    ro: 0.8,  gr: 1,    cv: 0 },
  cities:   { tr: 0.45, de: 0,    gt: 0,   to: 1,    sp: 0.2,  sa: 0.25, mo: 0,    cr: 0,    ci: 0,   pi: 0,    do: 0.5,  br: 0.2, ca: 0,   wr: 0.04, sh: 0.8,  be: 0.3,  ro: 0.15, gr: 0.5,  cv: 1 },
  neon:     { tr: 0.12, de: 0,    gt: 0.06, to: 1,   sp: 0.3,  sa: 0.15, mo: 0,    cr: 0,    ci: 0,   pi: 0.1,  do: 0.2,  br: 0.6, ca: 0,   wr: 0.08, sh: 1,    be: 0.2,  ro: 0.1,  gr: 0.15, cv: 0.9 },
  builders: { tr: 0.45, de: 0,    gt: 0,   to: 0.2,  sp: 1,    sa: 0.9,  mo: 0.6,  cr: 0.2,  ci: 0,   pi: 0.15, do: 0.3,  br: 0.8, ca: 0,   wr: 0.05, sh: 0.6,  be: 0.3,  ro: 0.25, gr: 0.6,  cv: 0.2 },
  magic:    { tr: 0.5,  de: 0,    gt: 0.7, to: 0.12, sp: 0.5,  sa: 0.6,  mo: 0.35, cr: 1,    ci: 0.8, pi: 0.25, do: 0.1,  br: 0.3, ca: 0,   wr: 0.04, sh: 0.2,  be: 0.9,  ro: 0.3,  gr: 1,    cv: 0.1 },
  ruins:    { tr: 0.15, de: 0.7,  gt: 0,   to: 0.6,  sp: 0.4,  sa: 0.6,  mo: 0.3,  cr: 0.1,  ci: 0,   pi: 0,    do: 0.2,  br: 0,   ca: 1,   wr: 0.9,  sh: 0.2,  be: 0.25, ro: 0.7,  gr: 0.3,  cv: 0.4 },
};
// the ground each world lays (mixed into the Land Hue), and its lights (null: the page's own accents)
const RG_GROUND = { wilds: [[0, 0, 0], 0], cities: [[132, 132, 128], 0.22], neon: [[76, 72, 90], 0.5], builders: [[208, 204, 190], 0.3], magic: [[120, 90, 170], 0.22], ruins: [[118, 96, 78], 0.5] };
const RG_NEON_DISTRICTS = [[[255, 60, 190], [60, 230, 255]], [[255, 176, 40], [40, 220, 190]], [[120, 255, 110], [170, 90, 255]], [[255, 70, 70], [70, 120, 255]], [[255, 120, 210], [255, 236, 90]]];
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
    // (which way round the dusk comes, by the light dial; in a film, held as it was at the first frame)
    daylight, air: 50, side: E.ctx.camera && E.ctx.camera.side ? E.ctx.camera.side : typeof from === 'number' && Math.cos((from*360 - 90)*Math.PI/180) < 0 ? -1 : 1 });
  const L = ringCamera(p), W = L.W, world = rgWorldOf(seed, num(n, 'world', 0)), forms = num(n, 'landforms', 50)/100;
  // THE LAND (landKit.js; Ruby, 2026-10-25: "real landmasses and biomes by the seed … nothing morphing as the camera rises
  // or turns"): its heights a pure function of the seed and the place, flatter where cities stand, stepped where the
  // builders terraced it, kept gentle where the seed stands you; its biomes blending as widely as Detail asks
  const detail = Math.max(0, Math.min(3, Math.floor(num(n, 'detail', 37)/25)));
  const LK = lkLand(seed, { W, Hw: L.Hw, forms, flat: world.list.includes('cities') || world.list.includes('neon') ? 0.55 : 1, terrace: world.list.includes('builders') ? W*0.004 : 0, z0: L.z0, blend: [0.15, 0.45, 0.75, 1][detail] });
  const TR = { sea: LK.sea, snow: LK.snowline, cloud: W*0.03*(0.7 + 0.6*mnHash(seed | 0, 4, 77)), raw: (a, z, fine) => LK.height(a, z, fine) };   // (cloud: the cumulus's base)
  const v0 = LK.height(0, L.z0, W*0.001);
  // (the weather, by the seed or chosen; in snow the land lies white down to the ground you stand on)
  const wx = rgWeatherOf(seed, E.P(n, 'weather', 'by the seed'), world); if(wx === 'snow') TR.snow = v0 - W*0.004;
  const T = (a, z, fine) => LK.height(a, z, fine); T.true = T;
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
  // (how dry a place is, and how wooded: from its climate and its biomes, the woods in patches with clearings in them)
  const dryAt = (a, z) => rgClamp(1 - LK.climate(a, z, LK.height(a, z, W*0.05))[1]);
  const forestAt = (a, z) => { const bw = LK.biomes(a, z, LK.height(a, z, W*0.05)); let f = 0; for(let i = 0; i < LK_BIOMES.length; i++) f += (LK_FORESTED[LK_BIOMES[i].name] || 0)*bw[i];
    const th = 0.6 - 0.42*Math.min(1, f*1.15); return rsSmooth(th - 0.12, th + 0.12, mnValue(a/(W*0.09) + 2.1, z/(W*0.09) + 5.9, s + 17)); };
  const cityAt = (a, z, cv, soft = 0.06) => { if(cv <= 0) return 0; const t = 0.62 - 0.6*cv; return rsSmooth(t - soft, t + soft, mnValue(a/(W*0.22) + 7.7, z/(W*0.22) - 1.1, s + 19)); };
  const lightsOf = w => RG_LIGHTS[w] || [g1.map(c => Math.min(255, c*1.15 + 30)), g2.map(c => Math.min(255, c*1.15 + 30))];
  // (the neon world's districts not all one colour: each its own pair of neons, leaning the page's accents toward it, and
  //  its ground faintly of the same hue; RG_NEON_DISTRICTS)
  const districtAt = (a, z) => RG_NEON_DISTRICTS[Math.min(RG_NEON_DISTRICTS.length - 1, Math.floor(mnValue(a/(W*0.22) + 13.1, z/(W*0.22) - 4.4, s + 61)*RG_NEON_DISTRICTS.length*0.999))];
  const lightsAt = (w, a, z) => { const L0 = lightsOf(w); if(w !== 'neon') return L0; const d = districtAt(a, z); return [rsMix(L0[0], d[0], 0.65), rsMix(L0[1], d[1], 0.65)]; };
  // THE SUN (Ruby: the light dial places it, in the world, so turning the camera turns past it, and the light on the land
  // comes from where it is): its way round the dial's, its height the dial's reach (overhead it is the ring's own star, on
  // the arch; at the dial's rim it sets; past it, night). Where it falls on the screen, and which way its light comes there
  const reach = typeof sun === 'number' ? sun : 2*(1 - num(n, 'daylight', 80)/100), D = ringSunDir(L, typeof from === 'number' ? from*360 : (E.ctx.light ?? 315), reach);
  const sunR = D[0]*L.rx + D[1]*L.ry + D[2]*L.rz, sunU = D[0]*L.ux + D[1]*L.uy + D[2]*L.uz, sunUp = reach <= 1.02;
  const sunAt = sunUp ? proj(L.Px + D[0], D[1], L.z0 + D[2]) : null;
  // (the land's facets and the painted things, lit from the sun's side of the screen, and from above as it rises)
  const sunSd = Math.abs(sunR) > 0.04 ? (sunR > 0 ? 1 : -1) : L.side, lt = [sunR, -Math.max(0.25, sunU + 0.35)], ll = Math.hypot(lt[0], lt[1]) || 1;
  return { E, L, p, W, seed, sun: { D, at: sunAt, sd: sunSd, LT: [lt[0]/ll, lt[1]/ll], screen: [sunR, -sunU], back: sunUp ? rsSmooth(0.15, 0.75, D[0]*L.fx + D[1]*L.fy + D[2]*L.fz) : 0 }, world, forms, T, TR, LK, detail, unit, F, cx, cy, ww, wh, proj, at, psi, th, hx: Math.cos(psi), hz: Math.sin(psi), land, sky, g1, g2, worldAt, dryAt, forestAt, cityAt, lightsOf, lightsAt, districtAt, psi,
    // (Flora is what grows, Fauna what lives and moves; Detail how far and how finely: Low, Medium, High, Ultra, as a
    //  reach on the things sown round the eye, Medium as it always was: RG_DETAIL)
    life: num(n, 'life', 50)/100, fauna: num(n, 'fauna', 40)/100, detailK: RG_DETAIL[detail], works: num(n, 'works', 50)/100, clutter: num(n, 'clutter', 50)/100, weather: wx, air: num(n, 'air', 60)/100, dayHere: ringDay(L, 0), px: E.px, saturn: E.P(n, 'saturn', 'by the seed'),
    // THE SCENE'S CLOCK (the Moving Image's Time Passing): seconds since the film began, and the time between its frames
    // (0 in a still, so a still draws as it always did); and the ring's slow spin under the stars since then
    // (in a film, its frame and the scene's mean seconds a frame, from which the scene's own clocks run evenly; and a
    //  film's first frame is already a film's, its clock a moment past nought, so nothing moves from it to the next)
    ...(cam => { const film = !!cam && cam.frame !== undefined && cam.frame !== null; return { time: (cam && cam.time) || (film ? 1e-3 : 0), dt: (cam && cam.dt) || 0,
      frame: film ? cam.frame : null, step: film ? cam.step || 0 : 0, fps: film ? cam.fps || 0 : 0, spin: ((cam && cam.time) || 0)*RG_SPIN }; })(E.ctx.camera) };
}
// THE RING'S SPIN under the stars (docs/prior-art/ringworld-time.md: Niven's ring turns once in seven and a half of its
// thirty-hour days, 225 hours, a degree and a half an hour): radians a second of the film's clock turns the sky, kept to
// a sixth of that (Ruby: "movement introduced by the ring itself should be subtle"), so a day's film drifts the sky a
// few degrees rather than sweeping it round
const RG_SPIN = Math.PI*2/(225*3600)/6;
// THE CLOUDS' CLOCK (Ruby: "slower and more physically accurate cloud movement"): when a film's frames are far apart in
// time (a day in seconds), the clouds would leap from frame to frame; they are carried as a time-lapse carries them, at
// most two seconds of wind a frame (some sixty times their true pace at thirty frames a second), so they drift
// THE CLOCKS OF A TIME-LAPSE (Ruby: "clouds need to move slower, billow and gather"; "slower time lapse animation in
// general... it should slow a bit"): with hours to a frame the scene's clock would throw the clouds and the walkers
// about; so the weather's clock runs at most 0.7 s of wind a frame (Wind Waker's cumulus drift a few metres a frame
// and breathe, docs/prior-art/ringworld-time.md), and the small motions (walking, swaying, buzzing, falling) at most
// 2.5 s a frame. In real time both are the scene's own. What swings, sways or flickers (grass, a drone's bob, a lamp's
// flicker, a beacon's pulse, the aurora's ripple, a snowflake's sway) runs on a third, gentler clock, at most a quarter
// second a frame, so nothing strobes and no light blinks from frame to frame (Ruby: photosensitivity, "large regions
// cannot flash for brief periods")
// (Ruby, 2026-10-22: "clouds should fade instead of jumping around": with the hours spread unevenly over a film's frames
//  (its dawn and dusk given more of them) the time between frames changes from frame to frame, and a clock made from the
//  hours and that time ran unevenly, even backward, so the clouds leapt to and fro. Each clock now runs from the frame
//  itself: the frame times the film's mean step, held to its cap, so it runs evenly and only forward)
// (a real-time film's step comes rounded to a hundredth, 1/30 as 0.03: with its frame rate known it is the frame's own
//  length, so its clocks keep the scene's true time)
const rgStep = V => V.fps > 0 && Math.abs(V.step*V.fps - 1) < 0.2 ? 1/V.fps : V.step;
export const rgClock = (V, cap) => V.frame !== null && V.frame !== undefined && V.step > 0 ? V.frame*Math.min(cap, rgStep(V)) : V.dt > cap ? V.time/V.dt*cap : V.time;
// THE FILM'S OWN CLOCK (docs/prior-art/ringworld-motion-and-variety.md §4.7): seconds of the film itself, however fast
// it runs through the scene's hours and at whatever frame rate. What pulses, flickers, sweeps or turns runs on it, so a
// light's rate is the same in a time-lapse as in real time, and none goes faster than once a second (the photosensitivity
// rule, AGENTS.md §11). In real time it is the scene's own time.
export const rgFilmTime = V => V.frame !== null && V.frame !== undefined ? V.frame/(V.fps > 0 ? V.fps : V.step > 0 && V.step < 0.2 ? 1/V.step : 30) : V.dt > 0.2 ? V.time/V.dt/30 : V.time;
const rgCloudTime = V => rgClock(V, 0.7);
const rgSwayTime = V => rgClock(V, 0.25);
const rgMotionTime = V => rgClock(V, 2.5);
// (and the water's, gentler: a swell's line or a glint moves on at most 0.4 s a frame, docs/prior-art/
//  ringworld-life-and-views.md §4: at minutes a frame the sea would only shimmer)
const rgWaterTime = V => rgClock(V, 0.4);
// (and a heap's life, its building and thinning: at most four seconds a frame, so in a time-lapse a cumulus builds and
//  fades in some seconds of film while the wind barely carries it, as real time-lapses show them; docs/prior-art/
//  ringworld-motion-and-variety.md §2)
const rgGrowTime = V => rgClock(V, 4);
// (rain falls at its own pace in any film, a thirtieth of a second a frame, so its curtain slides as it does in real time
//  rather than being dealt afresh each frame; snow drifts on at most an eighth of a second a frame; and the low mist
//  breathes on the clouds' clock, never on the raw hours, which in a two-day film made it shimmer)
// the wind, by the seed (docs/prior-art/ringworld-time.md: fair-weather cumulus drift at three to seven metres a second,
// faster under a storm): its way and its speed
const rgWind = V => { const WD = seedChoice(V.seed, 'wind'), ang = WD()*Math.PI*2; return [ang, 3 + 4*WD() + (V.weather === 'storm' ? 5 : 0)]; };
// THE GROUND'S COLOUR at a place of height e (ring units): its biomes' grounds mixed by their weights (landKit.js; each
// a mix of the Land Hue toward its own ground, so the page's land hue still colours the land), its world's ground, a
// forest's dark canopy from afar, a town's grey (its edge soft), bare rock where it is steep, sand at
// the water's edge, scree and snow high up; under the water, the sea's colour. (coarse: the far arch's, read broadly;
// slope: rise over run, where known; bw0: its biomes' weights, if already known)
const RG_BIOME_GROUND = { ice: [[236, 240, 247], 1], tundra: [[150, 140, 112], 0.6], taiga: [[30, 52, 50], 0.55], meadow: [[0, 0, 0], 0], forest: [[20, 50, 30], 0.45],
  steppe: [[196, 176, 112], 0.6], desert: [[222, 194, 140], 0.82], savanna: [[204, 178, 98], 0.55], jungle: [[20, 80, 36], 0.4], marsh: [[70, 92, 70], 0.5] };
const RG_PATCH = [[206, 176, 92], [104, 140, 66], [138, 106, 72], [176, 190, 98], [150, 122, 170]];
function rgGround(V, a, z, e, coarse = 1, slope = 0, bw0 = null){
  const W = V.W, M = W*0.00025, w = V.worldAt(a, z), P = RG_PROF[w], [gc, gk] = RG_GROUND[w];
  if(e <= V.TR.sea + 1e-9) return rsMix([24, 58, 104], V.sky, 0.35);
  const bw = bw0 || V.LK.biomes(a, z, e); let c = [0, 0, 0];
  for(let i = 0; i < LK_BIOMES.length; i++){ if(bw[i] < 0.004) continue; const [bc, bk] = RG_BIOME_GROUND[LK_BIOMES[i].name], g = rsMix(V.land, bc, bk); c[0] += g[0]*bw[i]; c[1] += g[1]*bw[i]; c[2] += g[2]*bw[i]; }
  c = rsMix(c, gc, gk);
  const fo = V.forestAt(a/coarse, z/coarse)*Math.min(1, V.life*1.6)*(P.tr + P.gt*0.5 + P.de*0.3); if(fo > 0) c = rsMix(c, w === 'magic' ? rsMix([30, 70, 64], V.g1, 0.25) : w === 'ruins' ? [70, 64, 50] : rsMix(V.land, [20, 46, 30], 0.6), Math.min(0.6, fo*0.6));
  const ci = V.cityAt(a/Math.sqrt(coarse), z/Math.sqrt(coarse), P.cv*(0.3 + 0.9*V.works), 0.16); if(ci > 0) c = rsMix(c, w === 'neon' ? rsMix([40, 36, 58], V.districtAt(a, z)[0], 0.12) : [150, 148, 146], ci*0.7);
  const rock = rsSmooth(0.45, 0.95, slope); if(rock > 0) c = rsMix(c, rsMix([128, 120, 112], V.land, 0.12), rock*0.8);
  const sand = (1 - rsSmooth(1.2*M, 3.5*M, e))*(1 - ci); if(sand > 0) c = rsMix(c, [222, 206, 164], sand*0.75);
  const hi = rsSmooth(V.TR.snow*0.6, V.TR.snow, e); if(hi > 0) c = rsMix(c, [128, 122, 116], hi*0.4);
  if(e > V.TR.snow) c = rsMix(c, [240, 243, 250], rsSmooth(V.TR.snow, V.TR.snow*1.15, e)*(1 - rsSmooth(0.8, 1.4, slope)));
  return c;
}
// THE PATCHWORK OF FIELDS far off (Ruby: "more detail in the distance … in the ground"): where people farm (open, low,
// gentle land, not forest, not town), a far cell of the land takes its field's crop colour, the fields on a grid of the
// world's own: [colour, how much] or null. (bw: the place's biomes' weights; dd: how far off it is seen)
function rgFieldPatch(V, a, z, e, bw, slope, dd){ const W = V.W; if(dd <= W*0.3) return null; const w = V.worldAt(a, z); if(w !== 'wilds' && w !== 'cities' && w !== 'builders') return null;
  let fo = 0; for(let i = 0; i < LK_BIOMES.length; i++) fo += (LK_FORESTED[LK_BIOMES[i].name] || 0)*bw[i];
  const ci = V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works)), fa = (bw[3] + bw[5]*0.7 + bw[7]*0.4)*(1 - Math.min(1, fo*1.6))*(1 - ci)*(1 - rsSmooth(V.TR.snow*0.25, V.TR.snow*0.45, e))*rsSmooth(W*0.3, W*0.55, dd)*(1 - rsSmooth(0.12, 0.3, slope));
  if(fa < 0.05) return null; const cs = W*0.012, hv = mnHash(Math.floor(a/cs), Math.floor(z/cs*1.6), (V.seed | 0) + 77); return hv > 0.22 ? [RG_PATCH[Math.min(4, Math.floor(hv*hv*5.6))], 0.45*fa] : null; }
// GROUND TEXTURE (Ruby: "ground textures for each kind of terrain"; docs/prior-art/ringworld-terrain.md §6): a near cell of
// the land carries marks of its ground, each placed by the cell's own place in the world (its ring, row and column), so
// nothing swims as the camera moves: blades and clumps on grassland, sand ripples, cracks and pebbles on rock, sastrugi
// on snow, lichen and stones on the tundra, tussocks and pools in the marsh, joints in a town's paving; tinted from the
// cell's own colour, as many as its size on the page holds, none once it is small. (P: the cell's corners on the page;
// q: { l, i, j, box }; kind; c: the cell's colour)
const RG_GRASSY = { meadow: 1, forest: 1, taiga: 1, jungle: 1, savanna: 1, steppe: 1 };
// (a path written down to be drawn later, on any canvas: moveTo, lineTo, quadraticCurveTo, arc, ellipse; play(ctx))
const rgPathRec = () => { const ops = []; const r = { play(c){ c.beginPath(); for(const [f, a] of ops) c[f](...a); } };
  for(const f of ['moveTo', 'lineTo', 'quadraticCurveTo', 'arc', 'ellipse']) r[f] = (...a) => { ops.push([f, a]); }; return r; };
function rgGroundMarks(x, P, q, kind, c, px){
  const [bx0, bx1, by0, by1] = q.box, w = bx1 - bx0, h = by1 - by0, area = w*h*0.55; if(w < px(6) || h < px(2.5)) return;
  const n = Math.min(9, Math.floor(area/(px(16)*px(16)))); if(n < 1) return;
  const R = mulberry32((Math.imul(q.l + 1, 0x9E3779B1) ^ Math.imul(q.i, 0x85EBCA77) ^ Math.imul(q.j, 0xC2B2AE3D)) >>> 0);
  const pt = (u, v) => { const ax = P[0][0] + (P[1][0] - P[0][0])*u, ay = P[0][1] + (P[1][1] - P[0][1])*u, bx = P[3][0] + (P[2][0] - P[3][0])*u, by = P[3][1] + (P[2][1] - P[3][1])*u; return [ax + (bx - ax)*v, ay + (by - ay)*v]; };
  const lite = rsCss(rsMix(c, [255, 250, 232], 0.16), 0.75), dark = rsCss(rsMix(c, [0, 0, 0], 0.2), 0.7), s = Math.min(w, h*2.2)/Math.sqrt(n + 1);
  const L = rgPathRec(), D = rgPathRec(); let any = false;
  for(let k = 0; k < n; k++){ const [X, Y] = pt(0.1 + 0.8*R(), 0.1 + 0.8*R()), u = R(), r = s*(0.25 + 0.25*R()); any = true;
    if(RG_GRASSY[kind]){ const lb = r*(kind === 'steppe' || kind === 'savanna' ? 0.9 : 0.7), Pq = u < 0.5 ? L : D, lean = (R() - 0.5)*lb*0.6;
      Pq.moveTo(X - lb*0.25, Y); Pq.lineTo(X - lb*0.3 + lean, Y - lb); Pq.moveTo(X, Y); Pq.lineTo(X + lean*0.5, Y - lb*1.2); Pq.moveTo(X + lb*0.25, Y); Pq.lineTo(X + lb*0.35 + lean, Y - lb*0.9); }
    else if(kind === 'sand' || kind === 'desert'){ const lw = r*1.6; D.moveTo(X - lw, Y); D.quadraticCurveTo(X, Y - r*0.35, X + lw, Y); L.moveTo(X - lw, Y - r*0.2); L.quadraticCurveTo(X, Y - r*0.55, X + lw, Y - r*0.2); }
    else if(kind === 'rock'){ D.moveTo(X - r, Y - r*0.3); D.lineTo(X - r*0.2, Y + r*0.1); D.lineTo(X + r*0.3, Y - r*0.2); D.lineTo(X + r, Y + r*0.25); L.moveTo(X + r*0.4, Y + r*0.5); L.arc(X + r*0.3, Y + r*0.5, Math.max(px(0.5), r*0.12), 0, Math.PI*2); }
    else if(kind === 'snow' || kind === 'ice'){ const lw = r*1.4; L.moveTo(X - lw, Y); L.lineTo(X + lw, Y - r*0.12); D.moveTo(X - lw*0.6, Y + r*0.18); D.lineTo(X + lw*0.7, Y + r*0.1); }
    else if(kind === 'tundra'){ L.moveTo(X + r*0.3, Y); L.arc(X, Y, Math.max(px(0.5), r*0.3), 0, Math.PI*2); D.moveTo(X + r*0.9 + r*0.2, Y + r*0.3); D.arc(X + r*0.9, Y + r*0.3, Math.max(px(0.4), r*0.2), 0, Math.PI*2); }
    else if(kind === 'marsh'){ if(u < 0.4){ D.moveTo(X + r, Y); D.ellipse(X, Y, r, r*0.3, 0, 0, Math.PI*2); } else { L.moveTo(X - r*0.3, Y); L.lineTo(X - r*0.4, Y - r*0.9); L.moveTo(X, Y); L.lineTo(X, Y - r*1.1); L.moveTo(X + r*0.3, Y); L.lineTo(X + r*0.45, Y - r*0.8); } }
    else if(kind === 'paving'){ const lw = r*1.5; D.moveTo(X - lw, Y); D.lineTo(X + lw, Y); D.moveTo(X, Y - r*0.4); D.lineTo(X, Y + r*0.4); } }
  if(!any) return;
  x.lineWidth = Math.max(px(0.5), s*0.06); x.lineCap = 'round';
  x.strokeStyle = dark; D.play(x); x.stroke(); x.strokeStyle = lite; L.play(x); x.stroke();
  if(kind === 'marsh' || kind === 'rock' || kind === 'tundra'){ x.fillStyle = dark; D.play(x); x.fill(); }
  x.lineCap = 'butt';
}
// THE STONE a place's rocks are of (Ruby: "rocks of different stones"): sandstone in dry country, granite and slate up
// high and in the cold, limestone, granite or slate by region elsewhere, and now and then a field of basalt; by the land
// kit's climate and a region's own noise, so a region's boulders are of one stone (PK_STONES)
function rgStoneOf(V, a, z, e){ const W = V.W, s = V.seed | 0, r = mnValue(a/(W*0.8) + 3.3, z/(W*0.8) - 7.1, s + 97), dr = V.dryAt(a, z);
  if(mnValue(a/(W*1.6) - 1.7, z/(W*1.6) + 2.9, s + 98) > 0.78) return 'basalt';
  if(dr > 0.62) return r < 0.75 ? 'sandstone' : 'limestone';
  if(e > V.TR.snow*0.4) return r < 0.55 ? 'granite' : 'slate';
  return r < 0.4 ? 'limestone' : r < 0.75 ? 'granite' : 'slate'; }
// light, night and air on a colour: lit by the star (by day), dark blue by night, hazed by the air between
function rgLit(V, c, day, haze, air){ const n = rsMix(rsMix(c, [8, 12, 30], 0.82), c, 0.08); return rsMix(rsMix(n, c, day), air, haze); }
// the air's colour (the sky at the horizon): blue by day, warm at dusk, dark by night
function rgAirOf(V, day){ const dusk = rgClamp(1 - Math.abs(day - 0.5)*3.2), w = V.world.list[0];
  const a = rsMix(rsMix(rsMix(V.sky, [6, 8, 20], 0.86), rsMix(V.sky, [255, 255, 255], 0.38), rsSmooth(0.3, 0.75, day)), rsMix([255, 150, 118], V.g1, 0.2), dusk*0.55);
  // (a world's own air: the smoke over ruins, the neon's glow in the haze, the magic's)
  return w === 'ruins' ? rsMix(a, [150, 112, 88], 0.32) : w === 'neon' ? rsMix(a, V.g1, 0.22 + 0.2*(1 - day)) : w === 'magic' ? rsMix(a, V.g2, 0.15) : a; }

// THE STARS BEHIND, STILL IN THE WORLD (Ruby: "stars should not pan with the camera"; then "With the starfield LOCKED TO
// THE CAMERA then it looks like, when the camera rotates, the entire ring rotates. The starfield should be pretty
// static"): the Starfield's picture laid on the six faces of a cube round the eye, a skybox, each face cut into patches
// and each patch projected through the camera as the arch is, so the stars stand still in the sky and the camera turns
// past them; only the ring's slow spin turns them, about its axis (V.spin, kept gentle). Each face takes the picture
// turned or mirrored its own way, so no two faces repeat side by side
const RG_SKY_FACES = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, -1, 0], [0, 0, 1]], [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [0, 1, 0], [-1, 0, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]]];
function rgPanSky(c, x, V){
  const { ww, wh, F, L, proj } = V, m = Math.min(ww, wh), N = 6, cs = Math.cos(V.spin), sn = Math.sin(V.spin);
  const [t, tx] = kitCanvas(ww, wh); tx.drawImage(c, 0, 0); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, ww, wh);
  const scr = (dx, dy, dz) => { const l = Math.hypot(dx, dy, dz) || 1, X = dx/l, Y = dy/l; return proj(L.Px + (X*cs - Y*sn)*0.01, (X*sn + Y*cs)*0.01, L.z0 + dz/l*0.01); };
  RG_SKY_FACES.forEach(([n0, u0, v0], f) => { const flipU = f & 1 ? -1 : 1, swap = f >= 4;
    const P = []; for(let j = 0; j <= N; j++){ const row = []; for(let i = 0; i <= N; i++){ const u = (i/N*2 - 1)*flipU, v = j/N*2 - 1, a = swap ? v : u, b = swap ? u : v;
      row.push(scr(n0[0] + u0[0]*a + v0[0]*b, n0[1] + u0[1]*a + v0[1]*b, n0[2] + u0[2]*a + v0[2]*b)); } P.push(row); }
    for(let j = 0; j < N; j++) for(let i = 0; i < N; i++){ const p00 = P[j][i], p10 = P[j][i + 1], p01 = P[j + 1][i], p11 = P[j + 1][i + 1]; if(!p00 || !p10 || !p01 || !p11) continue;
      const xs = [p00[0], p10[0], p01[0], p11[0]], ys = [p00[1], p10[1], p01[1], p11[1]];
      if(Math.max(...xs) < 0 || Math.min(...xs) > ww || Math.max(...ys) < 0 || Math.min(...ys) > wh || Math.max(...xs) - Math.min(...xs) > ww*3) continue;
      const s0 = i/N*m, s1 = (i + 1)/N*m, r0 = j/N*m, r1 = (j + 1)/N*m, ax = (p10[0] - p00[0])/(s1 - s0), ay = (p10[1] - p00[1])/(s1 - s0), bx = (p01[0] - p00[0])/(r1 - r0), by = (p01[1] - p00[1])/(r1 - r0);
      x.save(); x.beginPath(); x.moveTo(p00[0], p00[1]); x.lineTo(p10[0], p10[1]); x.lineTo(p11[0], p11[1]); x.lineTo(p01[0], p01[1]); x.closePath(); x.clip();
      x.setTransform(ax, ay, bx, by, p00[0] - ax*s0 - bx*r0, p00[1] - ay*s0 - by*r0); x.drawImage(t, 0, 0, m, m, 0, 0, m, m); x.restore(); } });
  x.restore(); t.width = 0; t.height = 0;
}
// ---------------- THE ARCH ----------------
// THE WEATHER (Ruby: "more clouds, slightly rare weather effects … atmospherics, possibly rays from the sun"): by the seed
// mostly clear, often clouds, now and then fog, rarely rain, a storm or snow (never snow where it's neon or ruins hot)
function rgWeatherOf(seed, chosen, world){ if(chosen && chosen !== 'by the seed') return chosen; const u = mnHash(seed | 0, 77, 5);
  // (Ruby: "rain is too common": a seed in twenty-two rains, one in forty storms)
  return u < 0.5 ? 'clear' : u < 0.82 ? 'clouds' : u < 0.9 ? 'fog' : u < 0.945 ? 'rain' : u < 0.97 ? 'storm' : world.list.includes('neon') ? 'rain' : 'snow'; }
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
  // A COMET (Ruby: "comet in space needs to move it shouldn't just hang there"; docs/prior-art/ringworld-motion-and-
  // variety.md §5.1): it crosses the far sky on its own way, half a degree or so a second of film, as well as turning
  // with the stars; its ion tail runs straight away from the star, thin and blue, its dust tail wider and white-gold,
  // bending back along the way it came; a faint green coma round its head. Its place and its tails by the clock alone
  { const R = rgRand(s, 803), rnd = (a, b) => a + (b - a)*R(), has = R() < 0.25, az0 = R()*Math.PI*2, el0 = rnd(0.25, 0.8), way = R()*Math.PI*2, spd = rnd(0.3, 0.8)*Math.PI/180, len0 = rnd(0.12, 0.3), sideR = R();
  const FTc = V.time > 0 ? rgFilmTime(V) : 0, along = spd*FTc + V.time/86400*1.5*Math.PI/180, cAz = az0 + Math.cos(way)*along/Math.max(0.3, Math.cos(el0)), cEl = el0 + Math.sin(way)*along*0.6;
  const P0 = farAt(cAz, cEl), Pb = farAt(cAz - Math.cos(way)*0.03/Math.max(0.3, Math.cos(el0)), cEl - Math.sin(way)*0.018), X = P0 ? P0[0] : 0, Y = P0 ? P0[1] : 0;
  if(has && P0){ const wd = F*0.012, len = F*len0, k = 1 - 0.6*kday;
    // (away from the star: from the star's place on the page to the head, or, the star off the page, the way that its
    //  direction falls; a little of the seed's lean where the star stands right behind it)
    const SA = V.sun.at, ang0 = sideR*0.9*(sideR < 0.5 ? 1 : -1) + Math.PI/2, ion = SA ? Math.atan2(Y - SA[1], X - SA[0]) : (() => { const D = V.sun.D, q = proj(L.Px + D[0]*0.01, D[1]*0.01, L.z0 + D[2]*0.01); return q ? Math.atan2(Y - q[1], X - q[0]) : ang0; })();
    const back = Pb ? Math.atan2(Pb[1] - Y, Pb[0] - X) : ion, dd = Math.atan2(Math.sin(back - ion), Math.cos(back - ion)), dust = ion + Math.max(-0.6, Math.min(0.6, dd*0.5));
    x.save(); x.globalCompositeOperation = 'screen';
    // the dust tail: a broad fan, curving from the ion tail's line toward its own way back
    { const n = 16; for(let q = 0; q < n; q++){ const u = q/(n - 1), a = ion + (dust - ion)*u*u, l = len*(0.75 + 0.25*u), tx = X + Math.cos(a)*l, ty = Y + Math.sin(a)*l, g = x.createLinearGradient(X, Y, tx, ty);
      g.addColorStop(0, rsCss([255, 238, 206], 0.11*k)); g.addColorStop(1, rsCss(S, 0)); rsPoly(x, [[X - Math.sin(a)*wd*1.6, Y + Math.cos(a)*wd*1.6], [tx, ty], [X + Math.sin(a)*wd*1.6, Y - Math.cos(a)*wd*1.6]], g); } }
    // the ion tail: straight and thin, blue
    { const tx = X + Math.cos(ion)*len*1.3, ty = Y + Math.sin(ion)*len*1.3, g = x.createLinearGradient(X, Y, tx, ty); g.addColorStop(0, rsCss([200, 226, 255], 0.75*k)); g.addColorStop(1, rsCss([120, 170, 255], 0));
      rsPoly(x, [[X - Math.sin(ion)*wd*0.7, Y + Math.cos(ion)*wd*0.7], [tx, ty], [X + Math.sin(ion)*wd*0.7, Y - Math.cos(ion)*wd*0.7]], g); }
    { const g = x.createRadialGradient(X, Y, 0, X, Y, wd*3.5); g.addColorStop(0, rsCss([170, 255, 200], 0.35*k)); g.addColorStop(1, rsCss([170, 255, 200], 0)); x.fillStyle = g; x.beginPath(); x.arc(X, Y, wd*3.5, 0, Math.PI*2); x.fill(); }
    x.restore(); x.fillStyle = rsCss([255, 255, 255], 0.9*(1 - 0.5*kday)); x.beginPath(); x.arc(X, Y, wd*0.8, 0, Math.PI*2); x.fill(); } }
  // METEORS by night (Ruby: "comets, meteor shower"; docs/prior-art/ringworld-time.md): with the scene's clock running,
  // every so often a meteor, a fraction of a second, caught by each frame's shutter (its time between frames, up to
  // twenty seconds, as a long exposure catches them); on some rings a shower, many more, all streaking out from one
  // point among the stars (the radiant), turning with them
  // (and in a film whose frames come quicker than a meteor lives, each lives its second (docs/prior-art/ringworld-motion-
  //  and-variety.md §5.2): its head runs from where it lit to where it burns out over its own 0.3 to 1.5 s, its streak
  //  growing behind it and fading from its tail, and a faint train lingers a moment after)
  if(V.time > 0 && kday < 0.6){ const MC = seedChoice(V.seed, 'meteors'), shower = MC() < 0.4, rate = shower ? 120 : 10, tau = 3600/rate, raz = MC()*Math.PI*2, rel = (25 + 50*MC())*Math.PI/180, expo = Math.min(20, Math.max(1/60, V.dt || 1/30));
    x.save(); x.globalCompositeOperation = 'screen';
    for(let k = Math.floor((V.time - 2.5)/tau); k*tau < V.time + expo; k++){ const R = rgRand(s, 830, k), tk = (k + R())*tau;
      const ang = R()*Math.PI*2, d0 = (shower ? 8 + 40*R() : 0)*Math.PI/180, len = (4 + 14*R())*Math.PI/180, az0 = shower ? raz : R()*Math.PI*2, el0 = shower ? rel : (20 + 60*R())*Math.PI/180;
      const br = 0.35 + 0.65*R()*R(), col = R() < 0.3 ? [190, 255, 210] : [255, 246, 220], life = 0.3 + 1.2*R();
      // (whole when its life fits within a frame's exposure, as a still or a time-lapse catches it; else where it is now)
      const whole = expo >= life, t = (V.time + expo - tk)/life; if(whole ? (tk < V.time || tk >= V.time + expo) : (t < 0 || t > 1.6)) continue;
      const hd = whole ? 1 : Math.min(1, t), tl = whole ? 0 : Math.max(0, Math.min(1, (t - 0.35)/0.9)), fade = whole ? 1 : t <= 1 ? 1 : 1 - (t - 1)/0.6;
      const pt = d => [az0 + Math.cos(ang)*d/Math.max(0.2, Math.cos(el0)), el0 + Math.sin(ang)*d], A = farAt(...pt(d0 + len*tl)), B = farAt(...pt(d0 + len*hd)); if(!A || !B || hd - tl < 0.02) continue;
      const g = x.createLinearGradient(A[0], A[1], B[0], B[1]), on = t <= 1 || whole;
      g.addColorStop(0, rsCss(col, 0)); g.addColorStop(0.8, rsCss(col, 0.8*br*(1 - kday)*fade*(on ? 1 : 0.35))); g.addColorStop(1, rsCss(on ? [255, 255, 255] : col, br*(1 - kday)*fade*(on ? 1 : 0.25)));
      x.strokeStyle = g; x.lineWidth = Math.max(px(0.6), px(1.4)*br); x.lineCap = 'round'; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); }
    x.restore(); }
  // AN AURORA, now and then by night (more often where there is magic or the builders' fields): curtains of light low
  // over one side of the horizon, folded, colored by height as the real ones are (docs/prior-art/ringworld-motion-and-
  // variety.md §5.3): a pink hem on a strong night, its body in its hue, its tops reddening as they fade upward, fine
  // rays up it. In a film its folds drift along the arc and it breathes, slowly, by the film's own seconds (never the
  // real thing's quick pulsing)
  { const AC = seedChoice(V.seed, 'aurora'), wild = V.world.list.includes('magic') || V.world.list.includes('builders'); if(AC() < (wild ? 0.35 : 0.12) && kday < 0.35){
    const az0 = AC()*Math.PI*2, span = (50 + 60*AC())*Math.PI/180, hue = [g1, g2, [120, 255, 170]][Math.floor(AC()*3)], a0 = 0.16*(1 - kday/0.35), strong = AC() < 0.5;
    const top = rsMix(hue, [255, 84, 110], 0.55), hem = rsMix(hue, [255, 150, 210], 0.6);
    x.save(); x.globalCompositeOperation = 'screen';
    const ta = V.time > 0 ? rgFilmTime(V)*4 : 0, br = V.time > 0 ? 1 + 0.12*Math.sin(rgFilmTime(V)*Math.PI*2/9) : 1;
    for(let q = 0; q < 60; q++){ const u = q/59, az = az0 + (u - 0.5)*span, wob = Math.sin(u*9 + ta*0.05 + AC()*6)*0.6 + Math.sin(u*23 - ta*0.11)*0.25;
      const B = skyAt(az, (6 + 3*wob)*Math.PI/180), T2 = skyAt(az, (22 + 8*wob + 6*Math.sin(u*5 + ta*0.03))*Math.PI/180); if(!B || !T2) continue;
      const g = x.createLinearGradient(B[0], B[1], T2[0], T2[1]), al = br*a0*(0.4 + 0.6*Math.pow(Math.sin(Math.PI*u), 0.6))*(0.6 + 0.4*Math.sin(u*31 + ta*0.2));
      g.addColorStop(0, rsCss(rsMix(strong ? hem : hue, [255, 255, 255], 0.3), al)); g.addColorStop(0.08, rsCss(rsMix(hue, [255, 255, 255], 0.25), al*0.9)); g.addColorStop(0.3, rsCss(hue, al*0.7)); g.addColorStop(0.65, rsCss(top, al*0.3)); g.addColorStop(1, rsCss(top, 0));
      x.strokeStyle = g; x.lineWidth = Math.max(px(1), F*span/60*1.3); x.beginPath(); x.moveTo(B[0], B[1]); x.lineTo(T2[0], T2[1]); x.stroke();
      // (fine rays up it, brighter threads among the folds)
      if(q % 3 === 1){ x.strokeStyle = rsCss(rsMix(hue, [255, 255, 255], 0.4), al*0.5); x.lineWidth = Math.max(px(0.5), F*span/60*0.25); x.beginPath(); x.moveTo(B[0], B[1]); x.lineTo(B[0] + (T2[0] - B[0])*0.7, B[1] + (T2[1] - B[1])*0.7); x.stroke(); } }
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
  const steps = (a0, fine, coarse, k = 0.05) => { const out = [a0]; let a = a0; while(a < Math.PI){ a = Math.min(Math.PI, a + Math.max(fine, Math.min(coarse, a*k))); out.push(a); } return out; };
  // (Ruby: "the far land in regions, not a checkerboard"; docs/prior-art/ringworld-terrain.md §5: the arch overhead is
  //  the land seen as a map): the far floor laid in patches a few pixels across wherever they fall, finer where it is
  //  nearer (by its true distance from the eye, never by where it falls on the page, so a turn changes nothing), each on a
  //  grid fixed in the world, of the land kit's broad regions where it lies and shaded by its relief (a hillshade), so
  //  lakes, ranges, forests and fields read as shapes, not squares; from where the land's own mesh gives out, give or
  //  take, to the far side
  const AB = W*0.004, A0 = Math.floor(W*[3.2, 4, 4.6, 5.2][V.detail]*0.6/AB)*AB, TGT = Math.max(2, px(9));
  const dist3 = (a, z) => Math.hypot(Math.cos(a) - L.Px, Math.sin(a), z - L.z0);
  // AN UNFINISHED STRETCH (Ruby: "unfinished sections of the ring with scaffolding"): on some rings, more often where
  // the builders are, a stretch of the far floor was never laid: the bare lattice of the ring's frame shows, scaffolding
  // stands along its edges, and cranes lean over it
  const UF = (() => { const R = rgRand(s, 812), p = V.world.list.includes('builders') ? 0.7 : V.world.list.includes('ruins') ? 0.45 : 0.22; if(R() > p) return null;
    const sg = R() < 0.5 ? 1 : -1, a0 = (0.7 + R()*1.6)*sg, len = W*(1 + 3*R())*sg; return { lo: Math.min(a0, a0 + len), hi: Math.max(a0, a0 + len), R }; })();
  const unfinished = a => UF && a >= UF.lo && a <= UF.hi;
  const SUN3 = V.sun.D;
  for(const sg of [1, -1]) for(let a = A0, guard = 0; a < Math.PI && guard < 4000; guard++){ const dz0 = dist3(a, L.z0), k = Math.max(0, Math.min(7, Math.ceil(Math.log2(TGT*dz0/(F*AB))))), da = AB*Math.pow(2, k);
    const aN = Math.min(Math.PI, (Math.floor(a/da + 1e-6) + 1)*da), i = Math.round(a/AB), a0 = a*sg, a1 = aN*sg, am = (a0 + a1)/2, day = ringDay(L, am); a = aN;
    const LNa = Math.pow(2, Math.max(1, Math.min(5, Math.floor(Math.log2(F*W/(dz0*TGT)))))), ws = W*0.06;
    for(let j = 0; j < LNa; j++){ const z0 = -W/2 + W*j/LNa, z1 = -W/2 + W*(j + 1)/LNa, zm = (z0 + z1)/2, q = [at(a0, z0, 0), at(a1, z0, 0), at(a1, z1, 0), at(a0, z1, 0)];
      if(q.some(v => !v) || (q[0][0] < 0 && q[1][0] < 0 && q[2][0] < 0 && q[3][0] < 0) || (q[0][0] > ww && q[1][0] > ww && q[2][0] > ww && q[3][0] > ww) || (q[0][1] > wh && q[1][1] > wh && q[2][1] > wh && q[3][1] > wh) || (q[0][1] < 0 && q[1][1] < 0 && q[2][1] < 0 && q[3][1] < 0)) continue;
      const e = V.TR.raw(am, zm, W*0.25), wet = rsSmooth(V.TR.sea + W*0.004, V.TR.sea - W*0.004, e); let c = rsMix(rgGround(V, am, zm, Math.max(e, V.TR.sea + 1e-6), 4), rsMix([24, 58, 104], S, 0.35), wet);
      if(wet < 0.95){ const dA2 = (V.TR.raw(am + ws, zm, W*0.25) - e)/ws*2.5, dZ2 = (V.TR.raw(am, Math.max(-W/2, Math.min(W/2, zm + ws*0.5)), W*0.25) - e)/(ws*0.5)*2.5, ca3 = Math.cos(am), sa3 = Math.sin(am);
        const nx = dA2*sa3 - ca3, ny = -dA2*ca3 - sa3, nz = -dZ2, nl = Math.hypot(nx, ny, nz), up3 = -(ca3*SUN3[0] + sa3*SUN3[1]), nd = (nx*SUN3[0] + ny*SUN3[1] + nz*SUN3[2])/nl, kk = up3 > 0.04 ? Math.max(0, Math.min(1.6, nd/Math.max(0.3, up3))) : 1;
        c = kk < 1 ? rsMix(rsMix(c, [26, 34, 70], 0.3), c, kk) : rsMix(c, rsMix(c, [255, 244, 222], 0.2), (kk - 1)/0.6*0.5); }
      const zc = (q[0][2] + q[2][2])/2, eS = elevOf(Math.cos(am), Math.sin(am), zm), jj = j*(32/LNa);
      if(unfinished(am)){ quads.push([zc, q, rgLit(V, rsMix(WALL0, SPACE, 0.55), 0.3 + 0.7*day, hzOf(zc, eS)*0.55, AIR), null, 'frame', rgRand(s, 813, i*sg, jj)]); continue; }
      quads.push([zc, q, rgLit(V, rsMix(c, [255, 255, 255], 0.06), day, hzOf(zc, eS)*0.55, AIR), day < 0.5 && V.cityAt(am, zm, RG_PROF[V.worldAt(am, zm)].cv*(0.3 + 0.9*V.works)) > 0.3 ? V.lightsOf(V.worldAt(am, zm))[0] : null, false, rgRand(s, 805, i*sg, jj)]); } }
  const Hw = L.Hw, WALL = rsMix([96, 104, 124], S, 0.22), aW = steps(0, W*0.012, W*0.4, 0.12);
  for(const zw of [-W/2, W/2]) for(const sg of [1, -1]) for(let i = 0; i + 1 < aW.length; i++){ const a0 = aW[i]*sg, a1 = aW[i + 1]*sg, am = (a0 + a1)/2, q = [at(a0, zw, 0), at(a1, zw, 0), at(a1, zw, Hw), at(a0, zw, Hw)];
    if(q.some(v => !v)) continue;
    const zc = (q[0][2] + q[2][2])/2, eS = elevOf((1 - Hw*0.5)*Math.cos(am), (1 - Hw*0.5)*Math.sin(am), zw), rib = i % 4 === 0 ? 0.12 : 0, day = ringDay(L, am);
    // (the wall above its foot stands clear of the air, crisper and darker against space than the land at its feet, and
    //  rises out of a haze along its foot: a scale cue, docs/prior-art/ringworld-motion-and-variety.md §6)
    quads.push([zc, q, rgLit(V, rsMix(WALL, [0, 0, 0], rib*0.5), 0.25 + 0.75*day, Math.min(0.92, 0.32*V.air + hzOf(zc, eS)*0.5), AIR), null, true, rgRand(s, 810, i*sg, zw > 0 ? 1 : 0), V.worldAt(am, zw*0.96), day, Math.min(0.9, 0.35 + 0.6*V.air)]); }
  quads.sort((p, q) => q[0] - p[0]);
  // a point inside a quad (u along it, v up or across it)
  const inQ = (q, u, v) => [q[0][0] + (q[1][0] - q[0][0])*u + (q[3][0] - q[0][0])*v + (q[2][0] - q[1][0] - q[3][0] + q[0][0])*u*v, q[0][1] + (q[1][1] - q[0][1])*u + (q[3][1] - q[0][1])*v + (q[2][1] - q[1][1] - q[3][1] + q[0][1])*u*v];
  const line = (pts, col, wd) => { x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); pts.forEach(([X, Y], k) => k ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.stroke(); };
  // (each patch pushed out half a pixel round its middle, so no seam of the sky shows between two)
  const growQ = q => { const cx2 = (q[0][0] + q[1][0] + q[2][0] + q[3][0])/4, cy2 = (q[0][1] + q[1][1] + q[2][1] + q[3][1])/4; return q.map(p => { const dx2 = p[0] - cx2, dy2 = p[1] - cy2, ln = Math.hypot(dx2, dy2) || 1; return [p[0] + dx2/ln*0.6, p[1] + dy2/ln*0.6]; }); };
  for(const [, q, c, lights, wall, R, ww2, wday, footHaze] of quads){ const qg = growQ(q); rsPoly(x, qg, rsCss(c)); rsPoly(mk, qg, '#fff');
    if(wall === true && footHaze){ const A = inQ(q, 0.5, 0), B = inQ(q, 0.5, 0.22), g = x.createLinearGradient(A[0], A[1], B[0], B[1]); g.addColorStop(0, rsCss(AIR, footHaze)); g.addColorStop(0.45, rsCss(AIR, footHaze*0.35)); g.addColorStop(1, rsCss(AIR, 0)); rsPoly(x, q, g); }
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
        if(night > 0.4 && ww2 !== 'ruins' && (R() < 0.5)){ const [X, Y] = inQ(q, 0.5, 0.985), pu = V.time ? 0.35 + 0.65*(0.5 + 0.5*Math.sin(rgFilmTime(V)*Math.PI*2*0.3 + X*0.05)) : 1; rgGlow(x, X, Y, Math.max(px(3), hp*0.02), [255, 70, 60], 0.7*night*pu); }
        // (what is painted or lit on a wall stays on that wall: drawn inside its own outline, never spilling off a narrow,
        //  far wall seen edge on into the sky)
        x.save(); x.beginPath(); q.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip();
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
            const fill = cols[Math.floor(R()*3)], edge = cols[(Math.floor(R()*3) + 1) % 4], tilt = (R() - 0.5)*0.3, us = g*1.6/Math.max(1, wp), dv = g*1.6*tilt/Math.max(1, hp);
            for(let pass = ww2 === 'ruins' ? 1 : 0; pass < 2; pass++){ x.strokeStyle = rsCss(pass ? fill : edge, (pass ? 0.85 : 0.8)*fade); x.lineCap = 'round'; x.lineJoin = 'round';
              x.lineWidth = Math.max(px(0.6), g*(ww2 === 'ruins' ? 0.12 : pass ? 0.32 : 0.55));
              const Rr = rgRand(s, 819, Math.round(u0*1e4), k); for(let c = 0; c < nL; c++){ const [X, Y] = inQ(q, u0 + c*us, v0 + c*dv); rgRune(x, X, Y - g, g, Rr()); } }
            for(let d = 0; d < nL*2; d++) if(R() < 0.35){ const [X, Y] = inQ(q, u0 + R()*nL*us, v0); line([[X, Y - g*0.2], [X, Y + g*(0.6 + 1.6*R())]], rsCss(fill, 0.55*fade), Math.max(px(0.4), g*0.06)); } } }
        x.restore(); } }
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
  // THE AIR ROUND THE SUN (Ruby: "slightly more dramatic skies"; docs/prior-art/ringworld-sky.md): the sky brightens
  // toward the sun, a wide soft glow in its own colour (the air scattering its light forward), and the horizon under it
  // glows brighter than the rest; at dusk that glow burns orange and red low down and stays a while after the sun has
  // gone; and opposite the sun at dusk and dawn, a band of pink over the horizon (the Belt of Venus) above the blue-grey
  // of the world's own shadow rising into the air
  { const D = V.sun.D, sEl = D ? Math.asin(Math.max(-1, Math.min(1, -D[0]))) : -1, sAz = D ? Math.atan2(D[2], D[1]) : 0;
    const glowK = rsSmooth(-0.22, 0.02, sEl), low = rsSmooth(0.6, 0.0, sEl), warm = rsMix([255, 236, 204], rsMix([255, 132, 84], [236, 84, 72], rsSmooth(0.02, -0.15, sEl)), low);
    x.save(); x.globalCompositeOperation = 'screen';
    // (the glow falls off as the air's forward scattering does, Henyey–Greenstein at g 0.8: half its strength 10° from
    //  the sun, a sixth at 20°, a fiftieth at 45°)
    if(sp && sEl > -0.05){ const r = F*0.8*(1 + 0.3*low), a = 0.32*(0.5 + 0.5*kday), g = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); g.addColorStop(0, rsCss(warm, a)); g.addColorStop(0.22, rsCss(warm, a*0.49)); g.addColorStop(0.44, rsCss(warm, a*0.16)); g.addColorStop(0.75, rsCss(warm, a*0.04)); g.addColorStop(1, rsCss(warm, 0)); x.fillStyle = g; x.fillRect(sp[0] - r, sp[1] - r, r*2, r*2); }
    const H0 = skyAt(sAz, 0), H1 = skyAt(sAz, 0.12);
    if(glowK > 0.01 && H0 && H1){ const ry = Math.max(px(4), Math.abs(H0[1] - H1[1])*(1.2 + 1.6*low)), rx = F*(0.9 + 0.8*low); x.save(); x.translate(H0[0], H0[1]); x.scale(1, ry/rx);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, rx), a = glowK*(0.16 + 0.34*low); g.addColorStop(0, rsCss(warm, a)); g.addColorStop(0.4, rsCss(rsMix(warm, [236, 120, 140], 0.4*low), a*0.4)); g.addColorStop(1, rsCss(warm, 0)); x.fillStyle = g; x.fillRect(-rx, -rx, rx*2, rx*2); x.restore(); }
    // (the belt as it is timed: coming as the sun meets the horizon, brightest a little after it has gone (2° under), gone
    //  by 6° under; its pink 10–20° up, the world's shadow under it rising as the sun sinks)
    const tw = rsSmooth(0.09, 0.0, sEl)*rsSmooth(-0.11, -0.04, sEl), sh = 0.06 + 0.6*Math.max(0, -sEl), A0 = skyAt(sAz + Math.PI, 0), A1 = skyAt(sAz + Math.PI, sh), A2 = skyAt(sAz + Math.PI, sh + 0.2);
    const band = (P, ry, col, a, op) => { const rx = F*2.2; x.globalCompositeOperation = op; x.save(); x.translate(P[0], P[1]); x.scale(1, Math.max(px(2), ry)/rx);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rsCss(col, a)); g.addColorStop(0.5, rsCss(col, a*0.5)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(-rx, -rx, rx*2, rx*2); x.restore(); };
    if(tw > 0.01 && A0 && A1 && A2){ band(A0, Math.abs(A0[1] - A1[1])*1.1, rsMix([52, 62, 106], S, 0.2), 0.32*tw, 'source-over'); band([(A1[0] + A2[0])/2, (A1[1] + A2[1])/2], Math.abs(A1[1] - A2[1])*0.6, [236, 158, 176], 0.36*tw, 'screen'); }
    // (and over where the sun went down, the purple light: from 2° to 6° under, at its most at 4°, a wide soft violet
    //  glow some 12° up, sinking as the sun sinks)
    const pl = rsSmooth(-0.03, -0.07, sEl)*rsSmooth(-0.115, -0.075, sEl), P0 = skyAt(sAz, 0.2 + 1.2*(sEl + 0.07)), P1 = skyAt(sAz, 0.32 + 1.2*(sEl + 0.07));
    if(pl > 0.01 && P0 && P1) band(P0, Math.abs(P0[1] - P1[1]), rsMix([206, 128, 196], g1, 0.15), 0.3*pl, 'screen');
    // ANTICREPUSCULAR RAYS: with the sun low on a clouded day, the shafts that fan from it run on across the whole sky
    // and, by perspective, gather again opposite it, on the point as far under the horizon as the sun is over it:
    // faint pale wedges and the cloud shadows' dark ones between, climbing from the far horizon
    const aw = sp && (V.weather === 'clouds' || V.weather === 'rain') ? rsSmooth(0.45, 0.12, sEl)*rsSmooth(-0.02, 0.04, sEl) : 0, AP = skyAt(sAz + Math.PI, -Math.max(0.02, sEl)), AT = skyAt(sAz + Math.PI, 0.6);
    if(aw > 0.01 && AP && AT){ const R = rgRand(s, 818), Lr = Math.hypot(AT[0] - AP[0], AT[1] - AP[1])*1.1, up = Math.atan2(AT[1] - AP[1], AT[0] - AP[0]), col = rsMix([255, 226, 200], [236, 160, 176], dusk*0.5);
      x.globalCompositeOperation = 'screen'; for(let k = 0, n = 5 + Math.floor(R()*4); k < n; k++){ const an = up + (k/(n - 1) - 0.5)*1.1 + (R() - 0.5)*0.12, wa = 0.012 + 0.03*R(), g = x.createRadialGradient(AP[0], AP[1], 0, AP[0], AP[1], Lr);
        g.addColorStop(0, rsCss(col, 0)); g.addColorStop(0.25, rsCss(col, 0.05*aw)); g.addColorStop(0.7, rsCss(col, 0.03*aw)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g;
        x.beginPath(); x.moveTo(AP[0], AP[1]); x.arc(AP[0], AP[1], Lr, an - wa, an + wa); x.closePath(); x.fill(); } }
    x.restore(); }
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
  // (each cloud rides the wind along a chord of a circle of the plane wide enough that the chord's ends lie low over the
  //  horizon, its start well inside it: it fades in over the chord's first tenth and out over its last, low and small, and
  //  comes in again on the far side, so the sky keeps the clouds it began with and none jumps (docs/prior-art/
  //  ringworld-motion-and-variety.md §1.2: a chord through its start, as before, had the start at one end, so half the
  //  clouds leapt across the sky at the film's first tick). It hands back its direction, how much nearer it has come, how
  //  much of it is there, and the direction a step downwind of it, which way the wind carries it on the page)
  const RG_DRIFT_END = Math.tan(2.5*Math.PI/180);
  const drift = (az, e, hc, k = 1) => { const d = hc/Math.tan(e), ux = Math.cos(wAng), uy = Math.sin(wAng), x0 = d*Math.cos(az), y0 = d*Math.sin(az);
    const u0 = x0*ux + y0*uy, w = -x0*uy + y0*ux, Rc = Math.max(hc/RG_DRIFT_END, d*1.35), Dc = Math.sqrt(Rc*Rc - w*w);
    const u = V.time ? ((u0 + wSp*k*rgCloudTime(V) + Dc) % (2*Dc) + 2*Dc) % (2*Dc) - Dc : u0, p = (u + Dc)/(2*Dc), fade = rsSmooth(0, 0.1, p)*rsSmooth(1, 0.9, p);
    const at = uu => { const xx = uu*ux - w*uy, yy = uu*uy + w*ux, d2 = Math.max(hc*0.12, Math.hypot(xx, yy)); return [Math.atan2(yy, xx), Math.atan(hc/d2), d2]; };
    const [a1, e1, d2] = V.time ? at(u) : [az, e, d], [a2, e2] = at(u + hc*0.08);
    return [a1, e1, Math.min(1.6, d/d2), fade, a2, e2]; };
  if(wx === 'clear' && R0() < 0.55) for(let k = 0, n = 8 + Math.floor(R0()*14); k < n; k++){ const R = rgRand(s, 809, k), rnd = (a, b) => a + (b - a)*R(), [az, e, gk, fa] = drift(R()*Math.PI*2, rnd(2, 12)*Math.PI/180, 1200), P0 = skyAt(az, e); if(!P0 || fa <= 0) continue; const X = P0[0], Y = P0[1], wd = F*rnd(0.2, 0.6)*gk, ht = wd*rnd(0.03, 0.07), pts = [];
    for(let q = 0; q <= 8; q++){ const u = q/8; pts.push([X - wd/2 + wd*u, Y - ht*Math.pow(Math.sin(Math.PI*u), 0.6)*rnd(0.6, 1.2)]); }
    rsPoly(x, [...pts, [X + wd/2, Y + ht*0.25], [X - wd/2, Y + ht*0.25]], rsCss(cWhite, 0.8*fa)); }
  if(wx === 'clear' || wx === 'clouds') if(R0() < 0.5) for(let k = 0, n = 5 + Math.floor(R0()*8); k < n; k++){ // cirrus: long thin streaks high up, combed one way
    // (each streak drawn as large as it has come nearer, and laid along the way the wind carries it across the page, a
    //  little of the seed's spread about that: so the sky's streaks are combed one way, turning as the sky curves)
    const R = rgRand(s, 812, k), rnd = (a, b) => a + (b - a)*R(), [caz, ce, gk, fa, waz, we] = drift(R()*Math.PI*2, rnd(18, 50)*Math.PI/180, 9000, 2.5), P0 = skyAt(caz, ce); if(!P0 || fa <= 0) continue;
    const P1 = skyAt(waz, we), wsa = P1 ? Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) : 0, len = F*rnd(0.2, 0.7)*gk, ang = Math.max(-1, Math.min(1, Math.abs(wsa) > Math.PI/2 ? wsa - Math.PI*Math.sign(wsa) : wsa)) + rnd(-0.25, 0.25)*0.5, th = F*rnd(0.004, 0.012)*Math.sqrt(gk);
    // (combed into fine strands as a painter dry-brushes them, each bowed a little and fading at its ends, some hooked
    //  down at their tail where their ice falls (mares' tails), lit warm at dusk like the heaps)
    x.save(); x.translate(P0[0], P0[1]); x.rotate(ang); const g = x.createLinearGradient(-len/2, 0, len/2, 0), cc = rsMix(cWhite, [255, 176, 150], dusk*0.35); g.addColorStop(0, rsCss(cc, 0)); g.addColorStop(0.45, rsCss(cc, 0.3*(0.4 + 0.6*kday)*fa)); g.addColorStop(1, rsCss(cc, 0));
    x.strokeStyle = g; x.lineCap = 'round';
    for(let q = 0, m = 5 + Math.floor(R()*6); q < m; q++){ const y0 = (q - m/2)*th*1.5 + rnd(-1, 1)*th, l0 = len*rnd(0.45, 1), x0 = rnd(-0.15, 0.15)*len, bend = rnd(-1, 1)*th*3, hook = R() < 0.35;
      x.lineWidth = Math.max(px(0.5), th*rnd(0.35, 1)); x.beginPath(); x.moveTo(x0 - l0/2, y0); x.quadraticCurveTo(x0, y0 + bend, x0 + l0/2, y0 + (hook ? th*5 : bend*0.3)); x.stroke(); }
    x.restore(); }
  // THE OVERCAST (Ruby: "there should always be overhead clouds during the rains"): in rain, a storm or snow a deck of
  // cloud covers the sky, a plane some two kilometres up laid out in rings round the eye, each patch projected where it
  // stands, so it grows overhead and thins to a lighter band at the horizon as a real ceiling does; mottled with the
  // darker bases of its rolls, and riding the wind as the heaps do. Storm the darkest, snow the palest
  if(wx === 'rain' || wx === 'storm' || wx === 'snow'){ const H = 1800, NR = 44, NA = 96, tc = V.time ? rgCloudTime(V) : 0, ox = Math.cos(wAng)*wSp*tc, oy = Math.sin(wAng)*wSp*tc;
    const dark = rsMix(cGrey, [26, 28, 38], wx === 'storm' ? 0.55 : wx === 'rain' ? 0.3 : 0.05), light = rsMix(cGrey, cWhite, wx === 'snow' ? 0.7 : 0.35), far = rsMix(AIR, cWhite, 0.25);
    const dOf = i => H*0.2*Math.pow(200, i/NR), thinOf = d => rsSmooth(H*1.5, H*35, d), colOf = d => rsMix(rsMix(dark, light, 0.35 + 0.3*rsSmooth(H, H*8, d)), far, thinOf(d)*0.85);
    x.save(); x.lineJoin = 'round';
    // (its body: ring after ring of the ceiling, darkest overhead, each ring a band all the way round)
    for(let i = NR - 1; i >= 0; i--){ const d0 = dOf(i), d1 = dOf(i + 1), e0 = Math.atan(H/d0), e1 = Math.atan(H/d1), dm = (d0 + d1)/2, css = rsCss(colOf(dm), 0.86 - 0.32*thinOf(dm));   // (never quite opaque: the arch looms through, just (Ruby: "The ring should always be visible even in bad weather"))
      x.fillStyle = css; x.strokeStyle = css; x.lineWidth = px(1);
      for(let j = 0; j < NA; j++){ const a0 = j/NA*Math.PI*2, a1 = (j + 1)/NA*Math.PI*2, P = [skyAt(a0, e0), skyAt(a1, e0), skyAt(a1, e1), skyAt(a0, e1)]; if(P.some(p => !p)) continue;
        x.beginPath(); P.forEach((p, q) => q ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); x.stroke(); } }
    // (and its rolls: soft darker bases laid on it in the plane, flattened as they go off toward the horizon, riding the
    //  wind; the lighter gaps between them are the deck itself)
    const RD = rgRand(s, 832), nRoll = 260;
    for(let k = 0; k < nRoll; k++){ const r0 = H*0.4*Math.pow(60, RD()), an = RD()*Math.PI*2, w0 = (500 + 900*RD()), sh = RD(), ph = RD();
      let qx = r0*Math.cos(an) + ox, qy = r0*Math.sin(an) + oy; const span = H*24*2; qx = ((qx + span/2) % span + span) % span - span/2; qy = ((qy + span/2) % span + span) % span - span/2;
      const d = Math.hypot(qx, qy); if(d < H*0.3 || d > H*24) continue; const az = Math.atan2(qy, qx), el = Math.atan(H/d), P = skyAt(az, el); if(!P) continue;
      const rx = F*w0/Math.hypot(d, H), ry = rx*Math.max(0.12, Math.sin(el))*(0.55 + 0.3*sh), fade = (1 - thinOf(d))*rsSmooth(H*24, H*18, d); if(rx < px(2) || fade < 0.03) continue;
      const g = x.createRadialGradient(P[0], P[1], 0, P[0], P[1], rx), cc = rsMix(dark, [18, 20, 28], 0.2 + 0.3*ph);
      g.addColorStop(0, rsCss(cc, 0.32*fade)); g.addColorStop(0.6, rsCss(cc, 0.16*fade)); g.addColorStop(1, rsCss(cc, 0));
      x.fillStyle = g; x.save(); x.translate(P[0], P[1]); x.scale(1, ry/rx); x.translate(-P[0], -P[1]); x.beginPath(); x.arc(P[0], P[1], rx, 0, Math.PI*2); x.fill(); x.restore(); }
    x.restore(); }
  // (the heaps of cumulus, and the storm's towers with their lightning, stand in the world over the land, and are drawn
  //  with it: rgPaintLand's clouds)
  // the SUN'S RAYS: when it stands low, or the sky is heaped with cloud, light fanning from it across the air in shafts,
  // a gap between each (crepuscular rays), soft, in the sun's own colour
  // (they fan downward and to the sides, as shafts through broken cloud do, some gaps wide; soft-edged, faint)
  if(sp && (lowSun || cloudy) && (wx === 'clear' || wx === 'clouds')){ const R = rgRand(s, 814), n = 6 + Math.floor(R()*6), Lr = F*1.5, col = rsMix([255, 236, 200], [255, 170, 130], dusk*0.6), str = (cloudy ? 0.06 : 0.045)*(0.4 + 0.6*kday + dusk*0.6);
    x.save(); x.globalCompositeOperation = 'screen'; for(let k = 0; k < n; k++){ const a = Math.PI/2 + (k/(n - 1) - 0.5)*2.6 + (R() - 0.5)*0.25, wa = 0.03 + 0.07*R(), g = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], Lr*(0.6 + 0.4*R()));
      g.addColorStop(0, rsCss(col, str)); g.addColorStop(0.35, rsCss(col, str*0.45)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g;
      for(const k2 of [1, 0.55, 0.25]){ x.beginPath(); x.moveTo(sp[0], sp[1]); x.arc(sp[0], sp[1], Lr, a - wa*k2*1.6, a + wa*k2*1.6); x.closePath(); x.fill(); } } x.restore(); }
  // a RAINBOW after the rain, opposite the sun, when the sun is low behind you: its bands round the point opposite it
  if((wx === 'rain' || (wx === 'clouds' && R0() < 0.15)) && V.sun.D && -V.sun.D[0] < 0.6 && -V.sun.D[0] > -0.05){ const D = V.sun.D, A = proj(L.Px - D[0], -D[1], L.z0 - D[2]);
    if(A){ const r0 = 2*F*Math.tan(21*Math.PI/180), BOW = [[220, 60, 60], [240, 150, 50], [240, 230, 80], [80, 200, 90], [70, 120, 230], [140, 80, 200]]; x.save(); x.globalCompositeOperation = 'screen'; x.lineWidth = r0*0.018;
      BOW.forEach((cb, k) => { x.strokeStyle = rsCss(cb, 0.16*(0.4 + 0.6*kday)); x.beginPath(); x.arc(A[0], A[1], r0*(1.0 - k*0.018), Math.PI, 0); x.stroke(); });
      // (as a bow is (docs/prior-art/ringworld-sky.md §9): the sky inside it brighter, a fainter second bow at 51° with its
      //  colours the other way round, and the band between them darker)
      const k0 = 0.4 + 0.6*kday, g = x.createRadialGradient(A[0], A[1], 0, A[0], A[1], r0*0.9); g.addColorStop(0, rsCss(cWhite, 0)); g.addColorStop(0.7, rsCss(cWhite, 0.03*k0)); g.addColorStop(1, rsCss(cWhite, 0.07*k0)); x.fillStyle = g; x.beginPath(); x.arc(A[0], A[1], r0*0.9, Math.PI, 0); x.fill();
      const r2 = 2*F*Math.tan(25.5*Math.PI/180); x.lineWidth = r2*0.022; BOW.forEach((cb, k) => { x.strokeStyle = rsCss(cb, 0.07*k0); x.beginPath(); x.arc(A[0], A[1], r2*(1.0 - (5 - k)*0.02), Math.PI, 0); x.stroke(); });
      x.globalCompositeOperation = 'source-over'; x.lineWidth = r2 - r0*1.02; x.strokeStyle = rsCss(rsMix(cGrey, [20, 24, 40], 0.3), 0.06*k0); x.beginPath(); x.arc(A[0], A[1], (r0*1.02 + r2*0.88)/2, Math.PI, 0); x.stroke(); x.restore(); } }
  // FOG and SNOW: the sky pale and low, the far things fading into it
  if(wx === 'fog' || wx === 'snow'){ const yH = yAt(0); if(yH != null){ const g = x.createLinearGradient(0, yH - F*0.5, 0, yH + F*0.05); g.addColorStop(0, rsCss(cWhite, 0)); g.addColorStop(1, rsCss(cWhite, wx === 'fog' ? 0.6 : 0.4)); x.fillStyle = g; x.fillRect(0, yH - F*0.5, ww, F*0.55); } }
}

// ---------------- THE PAINTED THINGS: trees, buildings, rocks and most of the works from the shared kit (paintKit.js) ----------------
// ONE OF THE WORKS, at the ground point (X, Y), k pixels per ring unit there (F over its depth), in its colours c
function rgWork(x, o, X, Y, k, c, night, R, V, e){
  const { L, W, at, px } = V, AIR = c.air, haze = c.haze, day = ringDay(L, o.a), BLACK = [0, 0, 0], sd = c.sd, F = V.F;
  // (in a film a work's glow breathes, by at most an eighth over six to twelve seconds of the film, each in its own time:
  //  docs/prior-art/ringworld-motion-and-variety.md §4.7)
  const bre = V.time > 0 ? 1 + 0.12*Math.sin(rgFilmTime(V)*Math.PI*2/(6 + 6*o.h) + o.h2*6.283) : 1;
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
      rgGlow(x, X, Y, r*k*1.3, c.glow, 0.35*bre); }
    else if(o.kind === 'pi'){ const wd = W*(0.003 + 0.006*o.h)*k, top = Math.max(0, Y - W*(0.15 + 0.3*o.h2)*k); if(wd < 1) return; const g = x.createLinearGradient(X, Y, X, top); g.addColorStop(0, rsCss(c.glow, 0.7)); g.addColorStop(0.4, rsCss(c.glow, 0.25)); g.addColorStop(1, rsCss(c.glow, 0));
      x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = g; rsPoly(x, [[X - wd/2, Y], [X - wd*0.2, top], [X + wd*0.2, top], [X + wd/2, Y]], g); x.restore(); rgGlow(x, X, Y, wd*3, c.glow, 0.6*bre); }
    else if(o.kind === 'cr'){ pkCrystals(x, X, Y, W*0.0021*k, [rsMix(c.glow, AIR, haze*0.4), rsMix(c.glow2, AIR, haze*0.4)], c, 3 + Math.floor(o.h2*4), R, px); }
    else if(o.kind === 'to'){ const hh = W*(0.02 + 0.07*o.h)*k*(o.w === 'neon' ? 1.4 : 1); if(hh >= 2) pkBuilding(x, X, Y, hh, hh*(0.12 + 0.1*o.h2), c, PK_STYLE[o.w], night, R, px); }
    else if(o.kind === 'wr'){ // a crashed ship: its hull half sunk and tilted, a fin, its trench behind it, smoke
      const len = W*(0.006 + 0.02*o.h)*k; if(len < 3) return; const ang = (o.h2 - 0.5)*0.7 + 0.25*(o.h2 < 0.5 ? -1 : 1), ca = Math.cos(ang), sa = Math.sin(ang), hb = len*0.22;
      const hull = [[-0.5, 0], [-0.35, -0.8], [0.3, -1], [0.5, -0.45], [0.45, 0.3], [-0.45, 0.35]].map(([u, v]) => [X + (u*len)*ca - (v*hb)*sa, Y + (u*len)*sa + (v*hb)*ca]);
      rsPoly(x, [[X - len*0.9, Y + hb*0.3], [X - len*0.4, Y - hb*0.1], [X + len*0.1, Y + hb*0.1], [X - len*0.5, Y + hb*0.6]], rsCss(rgLit(V, [86, 70, 56], day, haze, AIR)));
      rsPoly(x, hull, rsCss(c.body)); rsPoly(x, [hull[1], hull[2], hull[3], [X, Y - hb*0.3]], rsCss(c.lit));
      rsPoly(x, [[X - len*0.15*ca, Y - len*0.15*sa - hb*0.8], [X - len*0.3*ca, Y - len*0.3*sa - hb*1.9], [X - len*0.05*ca, Y - len*0.05*sa - hb*0.9]], rsCss(c.dark));
      for(let q = 0; q < 3; q++){ x.fillStyle = rsCss(c.glow, 0.5 + 0.4*night); x.fillRect(X + (q - 1)*len*0.12*ca - hb*0.1, Y + (q - 1)*len*0.12*sa - hb*0.55, Math.max(rgPx(1), hb*0.18), Math.max(rgPx(1), hb*0.12)); }
      // (its smoke rising and leaning with the wind (Ruby: "Smoke effect from crashes needs to be affected by the wind"): the
      //  way the wind runs across the page where it stands, a step downwind seen, and harder as it blows harder; each puff
      //  rising from the wreck, growing and thinning, the next behind it, on the scene's clock)
      const [wA, wS] = rgWind(V), q0 = V.at(o.a, o.z, e), q1 = V.at(o.a + Math.cos(wA)*1e-4, o.z + Math.sin(wA)*1e-4, e), dq = q0 && q1 ? Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) : 0;
      const lean = (dq > 1e-9 ? (q1[0] - q0[0])/dq : 0)*Math.min(1, wS/9), tt = V.time ? rgMotionTime(V)*0.06 : 0, smoke = rgLit(V, [90, 88, 92], day, haze, AIR);
      for(let q = 0; q < 8; q++){ const u = (q/8 + tt) % 1, r = hb*(0.45 + u*2.2), sx = X + len*0.2 + lean*u*u*hb*9 + Math.sin(u*5 + q)*hb*0.25, sy = Y - hb - u*hb*(8 - 4*Math.abs(lean));
        x.fillStyle = rsCss(smoke, (0.55 - 0.45*u)*rsSmooth(0, 0.06, u)); x.beginPath(); for(let v = 0; v < 6; v++){ const t = v/6*Math.PI*2; x[v ? 'lineTo' : 'moveTo'](sx + Math.cos(t)*r, sy + Math.sin(t)*r*0.8); } x.closePath(); x.fill(); }
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
    for(let q = 0; q < n; q++){ const wv = t ? wkWander((c.seed || 0) + q*131, t, 1.1) : [0, 0], ix = X + (R() - 0.5)*h*1.4 + wv[0]*h*0.35, iy = cy + (R() - 0.5)*h*0.6 + wv[1]*h*0.18; dot(ix, iy, h*0.04, 1.9, rsCss(c.dark, 0.8));   // (with the clock, a swarm's dance, never the same twice)
      // (at dusk and by night they are fireflies: each a cold yellow-green light, flashing for most of a second every five
      //  or six, each in its own time)
      //  (each flash swelling and fading, never on in one frame)
      if((c.night || 0) > 0.35){ const ph = ((t || 0)/5.5 + q*0.37 + (X*0.013 % 1)) % 1, on = !t ? 1 : ph < 0.14 ? Math.sin(Math.PI*ph/0.14) : 0; if(on > 0.02) rgGlow(x, ix, iy, Math.max(rgPx(5), h*0.16), [200, 255, 120], 0.6*c.night*on); }
      if(h > rgPx(40) && R() < 0.5){ x.strokeStyle = rsCss(c.lit, 0.45); x.lineWidth = Math.max(rgPx(0.8), h*0.012); x.beginPath(); x.moveTo(ix - h*0.06, iy - h*0.04); x.lineTo(ix, iy); x.lineTo(ix + h*0.06, iy - h*0.04); x.stroke(); } }
    return; }
  if(kind === 'gulls'){ // GULLS FOLLOWING THE PLOUGH (Ruby: "more interactions nobody asked for"): a loose flock behind the
    // tractor, some wheeling low over the fresh furrow, some down in it; white with grey backs, their wings beating slowly
    if((c.night || 0) > 0.5) return;
    const n = 8 + Math.floor(R()*12), body = rsMix(c.lit, [255, 255, 255], 0.2), back = rsMix(c.lit, [120, 128, 140], 0.45);
    // (most wait on the ground, a few in the air at any moment, two to six metres up; §16)
    // (each bird its own: down in the furrow, then up for a while and wheeling, then down again, on noise of its own)
    for(let q = 0; q < n; q++){ const ra = R(), bx = (R() - 0.5)*h*6, by2 = (R() - 0.5)*h*0.3, ah = rnd(0.7, 2.1), s2 = h*rnd(0.1, 0.14), f0 = (R() - 0.5)*0.6, sd = (c.seed || 0) + q*977;
      const up = t ? rsSmooth(0.15, 0.55, wkNoise(sd + 5, t/8)) : ra < 0.22 ? 1 : 0, wv = t ? wkWander(sd, t, 5) : [0, 0], air = up > 0.15;
      const gx = X + bx + wv[0]*h*0.9*up, gy = Y - h*0.05 + by2*(1 - up) - h*ah*up + wv[1]*h*0.15*up;
      if(air){ const flap = t ? Math.sin(t*3 + q*2.3)*0.45 : f0; x.strokeStyle = rsCss(body, 0.95); x.lineWidth = Math.max(rgPx(0.8), s2*0.28); x.lineCap = 'round'; x.beginPath();
        x.moveTo(gx - s2*1.8, gy - s2*flap*1.6); x.quadraticCurveTo(gx - s2*0.7, gy - s2*(0.5 + flap), gx, gy); x.quadraticCurveTo(gx + s2*0.7, gy - s2*(0.5 + flap), gx + s2*1.8, gy - s2*flap*1.6); x.stroke();
        dot(gx - s2*1.7, gy - s2*flap*1.6, s2*0.18, 0.4, rsCss(c.dark, 0.8)); dot(gx + s2*1.7, gy - s2*flap*1.6, s2*0.18, 0.4, rsCss(c.dark, 0.8)); }
      else { x.fillStyle = rsCss(body, 0.95); x.beginPath(); x.ellipse(gx, gy - s2*0.5, s2*0.9, s2*0.45, 0, 0, Math.PI*2); x.fill(); x.fillStyle = rsCss(back, 0.95); x.beginPath(); x.ellipse(gx + s2*0.15, gy - s2*0.6, s2*0.6, s2*0.25, 0, 0, Math.PI*2); x.fill();
        dot(gx - s2*0.85, gy - s2*0.75, s2*0.28, 0.5, rsCss(body, 0.95)); } }
    return; }
  if(kind === 'fairies'){ // a few points of light drifting low, each with a faint trail behind it
    const n = 1 + Math.floor(R()*3);
    for(let q = 0; q < n; q++){ const wv = t ? wkWander((c.seed || 0) + q*211, t, 6) : [0, 0], fx = X + (R() - 0.5)*h*2 + wv[0]*h*0.6, fy = Y - h*rnd(0.4, 1.4) + wv[1]*h*0.25, dx = (R() < 0.5 ? -1 : 1)*Math.max(rgPx(4), h*0.18);   // (drifting where it will, with the clock)
      rgGlow(x, fx, fy, Math.max(rgPx(12), h*0.32), c.glow, 0.4);
      for(let t = 1; t <= 3; t++) dot(fx - dx*t, fy + dx*0.15*t*t*Math.sign(dx), h*0.025*(1 - t*0.22), 1 - t*0.2, rsCss(c.glow, 0.32/t));
      dot(fx, fy, h*0.04, 2.2, rsCss(rsMix(c.glow, [255, 255, 255], 0.6), 0.85)); }
    return; }
  if(kind === 'kite'){ // someone flying a kite on a fair day with a wind: the kite high and downwind, nodding and swinging
    // on its string (with the clock), its tail of bows streaming and waving; put away by dusk and in rain or snow
    if((c.night || 0) > 0.4 || /rain|storm|snow|fog/.test(c.weather || '')) return;
    const [wa, ws] = c.wind || [0, 5], dir = Math.cos(wa) < 0 ? -1 : 1, lift = Math.min(1, ws/8), ph = X*0.017;
    const hx = X + dir*h*0.12, hy = Y - h*0.48, bobX = t ? wkNoise((c.seed || 0) + 3, t/2.5)*h*0.6 : 0, bobY = t ? wkNoise((c.seed || 0) + 9, t/1.7)*h*0.35 : 0;
    const kx = X + dir*h*rnd(2.2, 3.6)*(0.6 + 0.4*lift) + bobX, ky = Y - h*rnd(3, 4.6)*(0.5 + 0.5*lift) + bobY, ks = h*rnd(0.22, 0.32), tilt = (t ? Math.sin(t*1.7 + ph)*0.25 : 0) + dir*0.3;
    // (the flyer: a small dark figure, an arm up to the string)
    x.strokeStyle = rsCss(c.dark, 0.9); x.lineWidth = Math.max(rgPx(1), h*0.07); x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.42); x.moveTo(X, Y - h*0.38); x.lineTo(hx, hy); x.stroke();
    dot(X, Y - h*0.5, h*0.07, 1.2, rsCss(c.dark, 0.9));
    // (the string sagging a little between, the kite's own weight against the wind)
    x.strokeStyle = rsCss(c.dark, 0.45); x.lineWidth = Math.max(rgPx(0.5), h*0.012); x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo((hx + kx)/2, (hy + ky)/2 + h*(1.2 - lift*0.6), kx, ky + ks*0.6); x.stroke();
    const col = c.flowers[Math.floor(R()*c.flowers.length)], cs = Math.cos(tilt), sn = Math.sin(tilt), P = (u, v) => [kx + u*cs - v*sn, ky + u*sn + v*cs];
    x.fillStyle = rsCss(col, 0.95); x.beginPath(); [[0, -ks], [ks*0.6, 0], [0, ks*0.9], [-ks*0.6, 0]].forEach(([u, v], i) => i ? x.lineTo(...P(u, v)) : x.moveTo(...P(u, v))); x.closePath(); x.fill();
    x.strokeStyle = rsCss(c.dark, 0.35); x.lineWidth = Math.max(rgPx(0.4), ks*0.06); x.beginPath(); x.moveTo(...P(0, -ks)); x.lineTo(...P(0, ks*0.9)); x.moveTo(...P(-ks*0.6, 0)); x.lineTo(...P(ks*0.6, 0)); x.stroke();
    // (the tail: from its foot, downwind and down, waving)
    const tail = [P(0, ks*0.9)]; for(let q = 1; q <= 6; q++){ const [tx, ty] = tail[q - 1]; tail.push([tx + dir*ks*0.35 + (t ? Math.sin(t*3 + q*0.9 + ph)*ks*0.25 : 0), ty + ks*0.45]); }
    x.strokeStyle = rsCss(c.dark, 0.4); x.beginPath(); tail.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.stroke();
    tail.forEach(([u, v], q) => { if(q && q % 2 === 0) dot(u, v, ks*0.09, 0.6, rsCss(c.flowers[(q/2) % c.flowers.length], 0.9)); }); return; }
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
  barn: { edge: 0.35 }, silo: { edge: 0.35 }, watertower: { heart: 0.25 }, cathedral: { heart: 0.7 }, mosque: { heart: 0.7 }, clock: { heart: 0.6 }, geodome: { flat: 0.25 }, pagoda: { rise: 0 },
  radiomast: { rise: 0.5 }, gasstation: { edge: 0.4, flat: 0.3 }, motel: { edge: 0.45 }, elevator: { edge: 0.5 }, greenhouse: { flat: 0.25 }, chapel: { rise: 0 } };
// what a farmstead builds, by its region's tradition: its house, then its barns and sheds (a hamlet builds the whole
// tradition, PK_VERNACULAR; docs/prior-art/ringworld-countryside.md)
const RG_FARM = { shire: { house: ['cottage'], out: ['barn', 'barn', 'oast', 'dovecote', 'greenhouse'] }, prairie: { house: ['cottage'], out: ['barn', 'barn', 'silo', 'silo', 'turbine'] },
  steppe: { house: ['yurt'], out: ['yurt'] }, savanna: { house: ['rondavel'], out: ['rondavel'] }, apulia: { house: ['trullo'], out: ['trullo', 'trullo', 'cottage'] },
  galicia: { house: ['cottage'], out: ['horreo', 'horreo', 'barn'] }, mesa: { house: ['pueblo'], out: ['pueblo', 'windmill'] }, kyo: { house: ['gassho', 'machiya'], out: ['gassho'] },
  tropic: { house: ['kubo'], out: ['kubo'] }, north: { house: ['stave', 'cottage', 'aframe'], out: ['barn', 'stave'] } };
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
// (what stands on legs or posts, or is a gate or a mast, needs no plinth: its feet go into the ground)
const RG_LIGHTFOOT = ['arch', 'torii', 'pylon', 'turbine', 'radiomast', 'needle', 'watertower', 'windmill', 'elevator'];
const RG_WIDE = ['gate', 'wall', 'hedge', 'fence', 'container', 'solar', 'pipes', 'traps', 'haybale', 'bench', 'parked', 'hulk', 'rubble', 'statue', 'dolmen', 'stonepile'];
// which tradition the wilds build in here: the cold north's, the dry country's, the jungle's, else the temperate land's,
// each region its own by the seed
// THE COLORS OF A PLACE (Ruby: "more colouration in variety seed dependent"; docs/prior-art/ringworld-motion-and-
// variety.md §7.2): each region of the ring paints by one rule, as real towns do, chosen by the seed among its world's
// families, and some regions left in their own colors: Falu red (barn red, the trim kept light), Burano (each house its
// own strong color from the street's few), Jaipur's rose, the Cyclades' whitewash, Roussillon's ochres, the dark wood
// of Kyoto's streets; violet only ever an accent. A function that takes a material's color to the region's
const RG_PALETTES = { falu: [[150, 52, 40]], burano: [[196, 64, 60], [232, 176, 64], [70, 120, 176], [88, 150, 104], [220, 120, 150], [236, 210, 120]], jaipur: [[214, 140, 122], [224, 160, 130]],
  cyclades: [[238, 238, 234]], ochre: [[204, 140, 72], [196, 112, 64], [224, 176, 96]], kyoto: [[74, 54, 42], [96, 70, 52]] };
const RG_PALETTE_OF = { cities: ['own', 'burano', 'jaipur', 'ochre', 'cyclades', 'burano'], wilds: ['own', 'falu', 'falu', 'ochre', 'kyoto', 'cyclades'], magic: ['own', 'burano', 'jaipur', 'cyclades'], ruins: ['own', 'ochre'], neon: ['own'], builders: ['own', 'cyclades'] };
function rgPaletteOf(V, o, w){ const W = V.W, s = V.seed | 0, fams = RG_PALETTE_OF[w] || ['own'], r = mnValue(o.a/(W*0.3) - 2.1, o.z/(W*0.3) + 4.7, s + 57), fam = fams[Math.min(fams.length - 1, Math.floor(r*fams.length*0.999))];
  if(fam === 'own') return null; const P = RG_PALETTES[fam], each = P[((o.rs >>> 7) % P.length + P.length) % P.length], k = fam === 'burano' ? 0.55 : fam === 'cyclades' ? 0.5 : 0.42;
  // (dark materials, a roof's slate or iron, keep most of their own; light ones take the region's)
  return m => { const lum = (m[0]*0.3 + m[1]*0.59 + m[2]*0.11)/255; return rsMix(m, each, k*(0.35 + 0.65*Math.min(1, lum*1.6))); }; }
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
  garden: { c: [150, 190, 140], row: [2, [106, 158, 108]] }, orchard: { c: [112, 150, 74] }, olives: { c: [176, 160, 118] }, 'orchard rows': { c: [126, 150, 86], row: [3.4, [50, 90, 46]] }, 'olive rows': { c: [176, 160, 118], row: [4, [100, 118, 92]] }, moonflower: { c: [150, 166, 186], row: [2, [128, 140, 176]], glow: true }, fallow: { c: [146, 136, 94] } };
const RG_STREET_KINDS = ['lamp', 'hydrant', 'busstop', 'phonebox', 'vending', 'signal', 'kiosk', 'cart', 'parked', 'scooter'];
const RG_DOORLESS = ['arch', 'needle', 'pylon', 'torii', 'turbine', 'radiomast', 'watertower', 'windmill', 'silo', 'elevator'];   // (what no one goes in at)
// (the kinds drawn best, that may stand near the eye, by world)
const RG_NEAR_KINDS = { cities: ['row', 'brick', 'chapel', 'cottage'], neon: ['motel', 'capsule'], builders: ['observatory', 'geodome', 'dome'], magic: ['wizard', 'chapel', 'cottage'], ruins: ['castle', 'chapel'] };
const RG_SINKS = ['hulk', 'column', 'statue', 'container', 'bicycle', 'barrel', 'crate', 'traps'];
function rgStore(V){
  const { L, W, T, TR } = V, s = V.seed | 0;
  const key = [s, V.world.list.join('+'), V.forms, V.life, V.fauna, V.detailK, V.works, V.clutter, W.toFixed(6), L.z0.toFixed(6)].join('|');
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
  // (what is sown round the eye, by Detail: farther out, and its finest cells reaching farther, so more stands at middle
  //  distance; Medium is 1, as it always was)
  const DK = V.detailK || 1, sowD = (id, c0, B0, rMax, cap, fn) => sow(id, c0, B0*DK, rMax*DK, cap, fn);
  // THE GROUND at a point, as the placing rules read it: its height, how steep, whether it is under water, whether water
  // is near (a coast), and how it stands against the land round it (a rise or a hollow), in the land's own units
  const ground = (a, z) => { const d = W*0.004, e = T.true(a, z, d), ex = T.true(a + d, z, d) - T.true(a - d, z, d), ez = T.true(a, z + d, d) - T.true(a, z - d, d);
    const slope = Math.hypot(ex, ez)/(2*d), wet = e <= TR.sea; let coast = false, ring = 0;
    for(let q = 0; q < 6 && !coast; q++){ const an = q/6*Math.PI*2, en = T.true(a + Math.cos(an)*W*0.012, z + Math.sin(an)*W*0.012, d); if(en <= TR.sea) coast = true; }
    // (how far it stands above the land round it: worked out only when asked, as only some of what is placed asks it)
    let rise; return { e, slope, wet, coast, get rise(){ if(rise === undefined){ for(let q = 0; q < 6; q++){ const an = q/6*Math.PI*2; ring += T.true(a + Math.cos(an)*W*0.03, z + Math.sin(an)*W*0.03, W*0.01); } rise = (e - ring/6)/(W*0.002); } return rise; } }; };
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
    // (the neon world's main roads ride high (Ruby: the roads that floated, made highways): an elevated expressway on a
    //  line of columns, straight on its own gentle curves over land and water alike, its deck some 12 m over the highest
    //  ground beneath it, eased along; docs/prior-art/ringworld-terrain.md §10)
    if(rd.kind === 'neon'){ const ph = R()*6.283, n = Math.ceil((rd.along ? W*0.64 : W*0.95)/step), pts = [];
      for(let q = 0; q <= n; q++){ const u = q/n, mv = W*0.025*Math.sin(u*4.2 + ph); pts.push(rd.along ? [-W*0.32 + W*0.64*u, rd.at + mv] : [rd.at + mv, -W*0.46 + W*0.92*u]); }
      addWay(pts, mat, rd.w, true, R); const wy = ways[ways.length - 1]; if(wy){ wy.high = true; const g = wy.pts.map(p => Math.max(TR.sea, T.true(p.a, p.z, W*0.002)));
        const mx = g.map((_, q) => Math.max(...g.slice(Math.max(0, q - 3), q + 4))); wy.pts.forEach((p, q) => { let sm = 0, nn = 0; for(let r = Math.max(0, q - 3); r <= Math.min(g.length - 1, q + 3); r++){ sm += mx[r]; nn++; } p.e = sm/nn + (11 + 3*mnValue(p.u/(W*0.05), 0.5, s + 66))*M; }); }
      return; }
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
    // (Ruby: "farms should only appear around or near densely populated rings": a wild village keeps no fields)
    if(top && w !== 'wilds' && T.true(a, z, W*0.003) > TR.sea) farms.push([a, z, w, Math.min(1, t*2)]); } }
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
  // A BUILDING'S GROUND (Ruby: "make sure buildings are never floating in the air or on water"; docs/prior-art/
  // ringworld-life-and-views.md §6, §7): its footprint's four corners and middle sampled, two metres out all round; never
  // on the water or within a step of it, never where its ground falls more than seven tenths of its width (some 35°).
  // Kept: how far its uphill corner stands above its middle and its downhill corner below, in metres, so it stands level
  // on a stone plinth that reaches down to the ground at its lowest corner
  const footing = (a, z, wM, face) => { const hw = (wM*0.5 + 2)*M, ca = Math.cos(face), sa = Math.sin(face), e0 = T.true(a, z, W*0.002); let lo = e0, hi = e0;
    for(const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const e = T.true(a + (ca*u - sa*v)*hw, z + (sa*u + ca*v)*hw, W*0.002); if(e <= TR.sea + 0.3*M) return null; lo = Math.min(lo, e); hi = Math.max(hi, e); }
    if(e0 <= TR.sea + 0.3*M || (hi - lo)/M > wM*0.7) return null; return { up: (hi - e0)/M, down: (e0 - lo)/M }; };
  // a walk along a way: every so far, a point on it, the way's normal there, how far along, and how worn
  const along = (wy, step, fn, start = step/2) => { const P = wy.pts; let next = start, i = 0;
    while(i + 1 < P.length){ const p = P[i], q = P[i + 1], du = (q.u - p.u) || 1; if(q.u < next){ i++; continue; } const t = (next - p.u)/du;
      fn(p.a + (q.a - p.a)*t, p.z + (q.z - p.z)*t, -(q.z - p.z)/du, (q.a - p.a)/du, next, p.dec); next += step; } };
  out.ways = ways;
  // BUILDINGS: where the cities are (and in the wilds, a few villages and farms); each archetype chosen first, then sized
  // in metres (tall ones where the city is densest, as a downtown rises), so a house is a house and a tower a tower
  // FARMSTEADS AND HAMLETS (Ruby, seen from a height: houses stood alone all over the fields): out in the country the
  // buildings gather, a house and its barns and sheds round one yard, a few hundred metres from the next farmstead, and
  // now and then a hamlet of a dozen houses round a green; between them, the fields. A seat in one cell of the grid in
  // two or so (more where the country is more settled), so farmsteads stand some 600 to 900 m apart and never closer
  // than about 200 (closer makes a hamlet); a farmstead's buildings within 45 to 70 m of its middle, round a yard 30
  // to 60 m across; a hamlet's within 90 to 140 m
  const SEAT = 560*M, seatOf = (a, z, ci) => { const i0 = Math.floor(a/SEAT), j0 = Math.floor(z/SEAT); let best = null;
    for(let i = i0 - 1; i <= i0 + 1; i++) for(let j = j0 - 1; j <= j0 + 1; j++){ if(mnHash(i, j, s + 91) > 0.3 + 0.45*ci) continue;
      const hamlet = mnHash(i, j, s + 95) < 0.18, sa = (i + 0.2 + 0.6*mnHash(i, j, s + 92))*SEAT, sz = (j + 0.2 + 0.6*mnHash(i, j, s + 93))*SEAT, rr = (hamlet ? 90 + 50*mnHash(i, j, s + 94) : 45 + 25*mnHash(i, j, s + 94))*M, d = Math.hypot(a - sa, z - sz);
      if(d < rr && (!best || d < best.d)) best = { a: sa, z: sz, rr, d, hamlet, key: i + ',' + j }; }
    return best; }, seats = new Map();
  sow(2, W*0.009, W*0.03, W*3.6, 2, (a, z, r, R) => {
    const w = V.worldAt(a, z), P = RG_PROF[w], ci = w === 'wilds' ? 0.7*V.cityAt(a, z, 0.12*(0.3 + 0.9*V.works)) : V.cityAt(a, z, P.cv*(0.3 + 0.9*V.works));
    // (in the country a village stands only round a town's heart, its houses close; the rest of the country's buildings
    //  are built by their seats, below)
    //  (closest at its heart and thinning to its edge, as a village does)
    let vk = 1; if(w === 'wilds' || w === 'magic'){ vk = 0; for(const [ha, hz, hw, ht] of hubs) if(hw === w) vk = Math.max(vk, 1 - Math.pow(Math.hypot(a - ha, z - hz)/((90 + 180*ht)*M), 1.5)); if(vk <= 0) return null; }
    if(ci < 0.05 || R() > ci*vk*(0.08 + 0.92*rsSmooth(W*0.012, W*0.07, r))) return null;
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
    const face = faceOf(a, z, R()), ft = footing(a, z, wM, face); if(!ft) return null;
    return { c: 'bldg', w, kind, hM, wM, face, ...ft }; });
  // (each seat built: a farmstead's house first, then its barns and sheds round the yard, each facing its middle; a
  //  hamlet's houses in a ring round its green, a well on the green; near you fewer, as everywhere, and far off only
  //  the house of a farmstead and half a hamlet. Its kinds are its region's tradition, PK_VERNACULAR; a farmstead keeps
  //  to what a farm builds, RG_FARM)
  // (Ruby, 2026-10-24: "farms should only appear around or near densely populated rings … maybe druid groves and other
  //  things in Wilds?": the farmsteads stand in the countryside round the cities, a belt about each city's edge as von
  //  Thünen's rings have it (docs/prior-art/ringworld-countryside.md §1), and where magic is; none in the wilds, whose
  //  places are their own (below))
  const beltAt = (a, z) => { const cv = RG_PROF.cities.cv*(0.3 + 0.9*V.works); return V.cityAt(a, z, cv + 0.25)*(1 - V.cityAt(a, z, cv)); };
  { const span = W*2.2, i0 = Math.floor(-span/SEAT), i1 = Math.ceil(span/SEAT), j0 = Math.floor((L.z0 - span)/SEAT), j1 = Math.ceil((L.z0 + span)/SEAT);
    for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){
      const sa = (i + 0.2 + 0.6*mnHash(i, j, s + 92))*SEAT, sz = (j + 0.2 + 0.6*mnHash(i, j, s + 93))*SEAT; if(Math.abs(sz) > W*0.45) continue;
      const rs0 = Math.hypot(sa, sz - L.z0); if(rs0 > span) continue; const w = V.worldAt(sa, sz); if(w !== 'cities' && w !== 'magic') continue;
      const ci = w === 'cities' ? 0.7*beltAt(sa, sz) : V.cityAt(sa, sz, RG_PROF[w].cv*(0.3 + 0.9*V.works));
      if(ci < 0.05 || mnHash(i, j, s + 91) > 0.3 + 0.45*ci) continue;
      const g0 = ground(sa, sz); if(g0.wet || g0.slope > 0.8) continue;
      const seat = seatOf(sa, sz, ci); if(!seat || seat.key !== i + ',' + j) continue;
      const R = rgRand(s, 1420, i*4099 + j), fam = w === 'cities' ? rgVernacular(V, sa, sz) : null, farm = fam ? RG_FARM[fam] || RG_FARM.shire : null, th0 = R()*Math.PI*2;
      let n = seat.hamlet ? 5 + Math.floor(R()*9) : 2 + Math.floor(R()*4); if(rs0 > W*0.7) n = seat.hamlet ? Math.ceil(n/2) : 1;
      // (a farmstead's plan, as the Peak District's farmsteads share them: four in ten a LINEAR range, house and barn and
      //  sheds in one row along the yard; nearly as many a COURTYARD, buildings on two to four sides of a yard; the rest
      //  a loose cluster. Each building faces the yard; docs/prior-art/ringworld-countryside.md §12)
      const plan = seat.hamlet ? 'ring' : (u => u < 0.4 ? 'linear' : u < 0.77 ? 'court' : 'cluster')(R()), yd = seat.rr*(0.4 + 0.15*R()), cs0 = Math.cos(th0), sn0 = Math.sin(th0);
      const spot = k => { if(plan === 'linear'){ const t2 = (k - (n - 1)/2)*(14 + 6*R())*M; return [sa + cs0*t2 - sn0*yd*0.6, sz + sn0*t2 + cs0*yd*0.6, Math.atan2(-cs0, sn0)]; }
        if(plan === 'court'){ const side = k % 4, ang = th0 + side*Math.PI/2, along = (Math.floor(k/4) - 0.5 + (R() - 0.5)*0.5)*yd*0.7, ca = Math.cos(ang), sa2 = Math.sin(ang); return [sa + ca*yd - sa2*along, sz + sa2*yd + ca*along, ang + Math.PI]; }
        const an = seat.hamlet ? th0 + k/n*Math.PI*2 + (R() - 0.5)*0.4 : th0 + k*(1.1 + 0.5*R()), dd = seat.rr*(seat.hamlet ? 0.55 + 0.4*R() : k ? 0.45 + 0.45*R() : 0.5 + 0.2*R());
        return [sa + Math.cos(an)*dd, sz + Math.sin(an)*dd, null]; };
      const placed = [];
      for(let k = 0; k < n; k++){
        const [a, z, fc] = spot(k), r = Math.hypot(a, z - L.z0); if(R() > 0.08 + 0.92*rsSmooth(W*0.012, W*0.07, r)) continue;
        const g = ground(a, z); if(g.wet || g.slope > 0.9) continue;
        let kind = null; for(let t = 0; t < 3 && !kind; t++){ const u = R(), k2 = !fam ? pkArchOf(PK_STYLE[w], u) : seat.hamlet ? pkVernacularOf(fam, u) : (k ? farm.out : farm.house)[Math.floor(u*(k ? farm.out : farm.house).length)];
          if(rgFits(k2, g, seat.hamlet ? 0.3 : 0.1)) kind = k2; } if(!kind) continue;
        const hM = pkMetres(kind, Math.pow(R(), 1.5)), wM = pkMetres(kind, R(), 1);
        if(!offWay(a, z, wM*M*0.5 + 2*M) || placed.some(([pa, pz, pw]) => Math.hypot(a - pa, z - pz) < (pw + wM)*M*0.55 + 3*M)) continue;
        const face = fc ?? Math.atan2(sz - z, sa - a), ft = footing(a, z, wM, face); if(!ft) continue;
        placed.push([a, z, wM]); out.push({ c: 'bldg', w, kind, hM, wM, face, a, z, r, rs: (R()*4294967296) >>> 0, ...ft }); }
      // (a cold country's yard keeps one tree in its middle, as Norway's do)
      if(!seat.hamlet && (fam === 'north' || fam === 'galicia') && placed.length && R() < 0.6){ const kind = fam === 'north' ? 'birch' : 'broadleaf'; out.push({ c: 'tree', w, kind, hM: pkMetres(kind, R()), a: sa, z: sz, r: rs0, rs: (R()*4294967296) >>> 0 }); }
      if(!placed.length) continue;
      seats.set(seat.key, { ...seat, w, n: placed.length, fam });
      // (a windbreak on a farmstead's windward sides, in open and windy country: rows of trees in an L round the yard,
      //  a little way out from it, longer than the yard is wide; near enough to be seen as trees)
      if(!seat.hamlet && rs0 < W*0.25 && (['prairie', 'steppe', 'north', 'shire'].includes(fam) || V.dryAt(sa, sz) > 0.45) && R() < 0.55){
        // (its inside row 15 to 30 m off the yard, each arm running on 30 to 60 m past the last building; three rows,
        //  outward from the tallest: conifers (or poplars), smaller trees, shrubs; close enough to read as one dark mass)
        const th = mnHash(s, 71, 3)*Math.PI*2, Dw = seat.rr*0.55 + (15 + 15*R())*M, run = seat.rr*0.55 + (30 + 30*R())*M, rowM = (4 + 2*R())*M, tall = fam === 'north' || fam === 'prairie' || fam === 'steppe' ? 'spruce' : 'poplar';
        for(const arm of [th, th + Math.PI/2]){ const ca = Math.cos(arm), sn = Math.sin(arm);
          for(const [rw, kind, sp, hk] of [[0, tall, 4.5, 0.85], [1, 'broadleaf', 4, 0.45], [2, 'bush', 3, 1]]) for(let t2 = -run; t2 <= run; t2 += sp*M){ const a = sa + ca*(Dw + rw*rowM) - sn*t2, z = sz + sn*(Dw + rw*rowM) + ca*t2;
            if(Math.abs(z) > W*0.47 || R() < 0.06 || T.true(a, z, W*0.002) <= TR.sea || !offWay(a, z, 2*M)) continue;
            out.push({ c: 'tree', w, kind, hM: pkMetres(kind, R())*hk, a, z, r: Math.hypot(a, z - L.z0), rs: (R()*4294967296) >>> 0 }); } }
        seats.get(seat.key).rf = Dw + 3*rowM + 4*M; }
      if(seat.hamlet && rs0 < W*0.5 && R() < 0.7) out.push({ c: 'prop', w, kind: 'well', hM: pkMetres('well', R()), a: sa, z: sz, r: rs0, rs: (R()*4294967296) >>> 0, face: R()*Math.PI*2 }); } }
  // (a lane from each farmstead and hamlet out to the nearest way, as a farm's track runs to the road: walked over the
  //  land like any way, earth or gravel, never more than half a kilometre)
  for(const st of seats.values()){ const gap = wayGap(st.a, st.z); if(!(gap < 500*M) || gap < st.rr || !wayAt) continue; const R = rgRand(s, 1430, Math.round(st.a/M)*7 + Math.round(st.z/M)), goal = wayAt.slice();
    addWay(walk(st.a, st.z, Math.atan2(goal[1] - st.z, goal[0] - st.a), gap*1.6, 10*M, goal, R), R() < 0.7 ? 'earth' : 'gravel', st.w, false, R); }
  // THE WILDS' OWN PLACES (Ruby: "maybe druid groves and other things in Wilds?"; docs/prior-art/ringworld-motion-and-
  // variety.md §7.4): each sown sparsely, one in a cell of a few kilometres at most, on the ground it belongs on, as
  // Islanders and Dorfromantik place a thing near what it goes with and away from its own kind:
  //  a SACRED GROVE on open ground by a forest: a ring of great trees round a greater one, a standing stone in it, and
  //   where there is magic its lights; a STONE ROW across an open, dry moor, the largest stones at its ends and a cairn
  //   at one; a HOLY WELL at a wood's edge, a tree over it; a RUIN OF THE OLD ONES, columns standing in the grass; a
  //   LOOKOUT on a high place; a BOTHY in the open hills; a WILD CAMP by a wood, its fire by night; CHARCOAL STACKS
  //   smoking in a pine wood; a HIDE at a wood's edge
  { const CELL = 2600*M, span = W*2.2, i0 = Math.floor(-span/CELL), i1 = Math.ceil(span/CELL), j0 = Math.floor((L.z0 - span)/CELL), j1 = Math.ceil((L.z0 + span)/CELL);
    const put = (o, a, z, R) => { if(Math.abs(z) > W*0.47 || T.true(a, z, W*0.002) <= TR.sea || !offWay(a, z, 2*M)) return; out.push({ ...o, a, z, r: Math.hypot(a, z - L.z0), rs: (R()*4294967296) >>> 0 }); };
    for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){
      const a0 = (i + 0.15 + 0.7*mnHash(i, j, s + 1501))*CELL, z0 = (j + 0.15 + 0.7*mnHash(i, j, s + 1502))*CELL; if(Math.abs(z0) > W*0.44 || Math.hypot(a0, z0 - L.z0) > span) continue;
      const w = V.worldAt(a0, z0); if(w !== 'wilds' && w !== 'magic') continue; if(mnHash(i, j, s + 1503) > (w === 'magic' ? 0.6 : 0.5)) continue;
      const g = ground(a0, z0); if(g.wet || g.coast || g.slope > 0.45 || V.cityAt(a0, z0, 0.12) > 0.05) continue;
      const R = rgRand(s, 1510, i*4099 + j), fo = V.forestAt(a0, z0), dr = V.dryAt(a0, z0), u = R(), th = R()*Math.PI*2, ca = Math.cos(th), sn = Math.sin(th);
      const u2 = R(), high = g.e > TR.snow*0.55 || g.rise > 0.35;
      if(u2 < 0.4 && w === 'wilds'){   // the hills' and the woods' own buildings and work
        if(high && fo < 0.4) put({ c: 'prop', w, kind: 'lookout', hM: pkMetres('lookout', R()), face: th }, a0, z0, R);
        else if(fo < 0.3 && g.slope < 0.35) put({ c: 'prop', w, kind: 'bothy', hM: pkMetres('bothy', R()), face: th }, a0, z0, R);
        else if(fo > 0.45 && g.slope < 0.3){ for(let k = 0, n = 2 + Math.floor(R()*4); k < n; k++){ const an = R()*Math.PI*2, d = (12 + 30*R())*M; put({ c: 'prop', w, kind: 'charcoal', hM: pkMetres('charcoal', R()) }, a0 + Math.cos(an)*d, z0 + Math.sin(an)*d, R); } }
        else if(fo > 0.2){ const kind = R() < 0.5 ? 'camp' : 'hide'; put({ c: 'prop', w, kind, hM: pkMetres(kind, R()), face: th }, a0, z0, R); }
        continue; }
      // (which of them, among those whose ground this is, by weight: a grove the likeliest)
      const fits = [['grove', fo < 0.85 && g.slope < 0.4 ? 3 : 0], ['row', fo < 0.3 && dr > 0.15 && g.slope < 0.3 ? 2 : 0], ['well', fo > 0.1 ? 1.5 : 0], ['ruin', 0.7]];
      let pick = u*fits.reduce((t, f) => t + f[1], 0), place = 'ruin'; for(const [k, wt] of fits){ pick -= wt; if(pick < 0){ place = k; break; } }
      if(place === 'grove'){   // the grove
        const n = 7 + Math.floor(R()*5), rr = (16 + 10*R())*M, kind = w === 'magic' && R() < 0.5 ? 'glow' : 'broadleaf';
        put({ c: 'tree', w, kind: 'broadleaf', hM: pkMetres('broadleaf', 0.8 + 0.2*R())*1.35 }, a0, z0, R);
        for(let k = 0; k < n; k++){ const an = th + k/n*Math.PI*2 + (R() - 0.5)*0.3, d = rr*(0.9 + 0.2*R()); put({ c: 'tree', w, kind, hM: pkMetres(kind, 0.5 + 0.5*R()) }, a0 + Math.cos(an)*d, z0 + Math.sin(an)*d, R); }
        put({ c: 'prop', w, kind: 'menhir', hM: 1.8 + 1.2*R(), face: th }, a0 + ca*rr*0.45, z0 + sn*rr*0.45, R);
        if(w === 'magic') for(let k = 0; k < 3; k++){ const an = R()*Math.PI*2, d = rr*0.6*R(); put({ c: 'prop', w, kind: 'wisp', hM: pkMetres('wisp', R()) }, a0 + Math.cos(an)*d, z0 + Math.sin(an)*d, R); } }
      else if(place === 'row'){   // the stone row
        const n = 6 + Math.floor(R()*13), sp = (5 + 3*R())*M;
        for(let k = 0; k < n; k++){ const t = (k - (n - 1)/2)*sp, end = Math.min(k, n - 1 - k), hM = 0.8 + 0.5*R() + (end === 0 ? 0.9 : end === 1 ? 0.35 : 0);
          put({ c: 'prop', w, kind: 'menhir', hM, face: th + Math.PI/2 }, a0 + ca*t + (R() - 0.5)*0.6*M, z0 + sn*t + (R() - 0.5)*0.6*M, R); }
        const e = ((n - 1)/2 + 1.6)*sp; put({ c: 'prop', w, kind: 'cairn', hM: 1.2 + 0.8*R() }, a0 + ca*e, z0 + sn*e, R); }
      else if(place === 'well'){   // the holy well
        put({ c: 'prop', w, kind: w === 'magic' ? 'wishing' : 'well', hM: 2.4, face: th }, a0, z0, R);
        put({ c: 'tree', w, kind: w === 'magic' ? 'glow' : 'birch', hM: pkMetres('birch', R())*0.8 }, a0 + ca*5*M, z0 + sn*5*M, R);
        if(R() < 0.5) put({ c: 'prop', w, kind: 'shrine', hM: 2.2, face: th }, a0 - sn*6*M, z0 + ca*6*M, R); }
      else {   // the old ones' ruin
        const n = 2 + Math.floor(R()*4); for(let k = 0; k < n; k++){ const t = (k - (n - 1)/2)*(4 + 2*R())*M; put({ c: 'prop', w, kind: 'column', hM: pkMetres('column', R()) }, a0 + ca*t, z0 + sn*t, R); }
        if(R() < 0.5) put({ c: 'prop', w, kind: 'dolmen', hM: pkMetres('dolmen', R()), face: th }, a0 - sn*8*M, z0 + ca*8*M, R); } } }
  // A FEW GOOD BUILDINGS NEAR THE EYE (Ruby: "Buildings sparsely can be generated close to the starting position, but
  // only in a way that makes sense where building doesn't obstruct entire view, and only good looking building
  // models"): now and then, one to three of a world's finest kinds stand sixty to two hundred metres off, on good
  // ground, off the ways, turned to face the eye; never in the Wilds, which keep their own places. Drawn faint as one
  // grows to fill the frame (rgPaintThing0), so none ever blocks the whole view
  { const RN = rgRand(s, 1720), w0 = V.worldAt(0, L.z0), kinds = RG_NEAR_KINDS[w0];
    if(kinds && RN() < 0.7) for(let k = 0, n = 2 + Math.floor(RN()*3); k < n; k++){ const an = RN()*Math.PI*2, d = (60 + 140*RN())*M, a = Math.cos(an)*d, z = L.z0 + Math.sin(an)*d, kind = kinds[Math.floor(RN()*kinds.length)], hu = RN(), wu = RN();
      if(Math.abs(z) > W*0.46 || V.worldAt(a, z) !== w0) continue; const g = ground(a, z); if(g.wet || g.slope > 0.35 || !rgFits(kind, g, 0.5)) continue;
      const hM = Math.min(kind === 'wizard' ? 36 : 28, pkMetres(kind, 0.3 + 0.4*hu)), wM = pkMetres(kind, wu, 1);   // (never a tower over the eye) if(!offWay(a, z, wM*M*0.5 + 4*M)) continue;
      const face = Math.atan2(L.z0 - z, -a), ft = footing(a, z, wM, face); if(!ft) continue;
      out.push({ c: 'bldg', w: w0, kind, hM, wM, face, near: true, a, z, r: d, rs: (RN()*4294967296) >>> 0, ...ft }); } }
  // (a town's lights by night, between its houses: streets, yards, windows too small to be houses, out to the far
  //  side of the land; few in the ruins, a fire here and there)
  sow(14, W*0.005, W*0.03, W*2.5, 2, (a, z, r, R) => { const w = V.worldAt(a, z), ci = w === 'wilds' ? V.cityAt(a, z, 0.12) : V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works));
    if(ci < 0.1 || R() > ci*(w === 'ruins' ? 0.12 : 0.9) || T.true(a, z, W*0.004) <= TR.sea) return null;
    // (in the country, only where its farmsteads and hamlets stand: the farmland between them dark, as it is at night)
    if(w === 'wilds' || w === 'magic'){ const st = seats.get((seatOf(a, z, 1) || {}).key); if(!st || Math.hypot(a - st.a, z - st.z) > st.rr*1.2) return null; }
    return { c: 'glim', w, big: R() < 0.15 ? 1.5 : 1 }; });
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
    if(dr > 0.62) return u < 0.25 ? 'lavender' : u < 0.5 ? 'vines' : u < 0.62 ? 'olives' : u < 0.68 ? 'olive rows' : u < 0.87 ? 'wheat' : 'stubble';
    if(dr < 0.38 && mnValue(a/(W*0.3) + 2.2, z/(W*0.3) - 6.1, s + 81) > 0.58) return u < 0.85 ? 'rice' : 'pasture';
    return ['wheat', 'wheat', 'barley', 'stubble', 'hay', 'pasture', 'pasture', 'ploughed', 'rapeseed', 'maize', 'orchard', 'orchard rows'][Math.floor(u*12)]; };
  const inField = (a, z, room = 0) => { const L2 = fbins.get(Math.floor(a/FBIN) + ',' + Math.floor(z/FBIN)); if(!L2) return null;
    for(const f of L2){ const da = a - f.a, dz = z - f.z, u = da*f.ux + dz*f.uz, v = -da*f.uz + dz*f.ux; if(Math.abs(u) < f.hl + room && Math.abs(v) < f.hw + room) return f; } return null; };
  // (two fields' rectangles overlap unless one of the four axes they're turned on parts them)
  const fieldClash = (f, room) => { const ext = Math.hypot(f.hl, f.hw), seen = new Set();
    for(let bi = Math.floor((f.a - ext)/FBIN); bi <= Math.floor((f.a + ext)/FBIN); bi++) for(let bj = Math.floor((f.z - ext)/FBIN); bj <= Math.floor((f.z + ext)/FBIN); bj++){ const L2 = fbins.get(bi + ',' + bj); if(!L2) continue;
      for(const g of L2){ if(seen.has(g)) continue; seen.add(g); const da = g.a - f.a, dz = g.z - f.z; let apart = false;
        for(const [nx, nz] of [[f.ux, f.uz], [-f.uz, f.ux], [g.ux, g.uz], [-g.uz, g.ux]]){ const rf = f.hl*Math.abs(f.ux*nx + f.uz*nz) + f.hw*Math.abs(-f.uz*nx + f.ux*nz), rg = g.hl*Math.abs(g.ux*nx + g.uz*nz) + g.hw*Math.abs(-g.uz*nx + g.ux*nz);
          if(Math.abs(da*nx + dz*nz) > rf + rg + room){ apart = true; break; } }
        if(!apart) return true; } }
    return false; };
  // (a building, its yard round it, standing in the field's rectangle)
  const bldgIn = (f, yard) => { const ext = Math.hypot(f.hl, f.hw) + yard + 20*M;
    for(let bi = Math.floor((f.a - ext)/BB); bi <= Math.floor((f.a + ext)/BB); bi++) for(let bj = Math.floor((f.z - ext)/BB); bj <= Math.floor((f.z + ext)/BB); bj++){ const L2 = bbins.get(bi + ',' + bj); if(!L2) continue;
      for(const o of L2){ const da = o.a - f.a, dz = o.z - f.z, u = da*f.ux + dz*f.uz, v = -da*f.uz + dz*f.ux, m = o.wM*M*0.6 + yard; if(Math.abs(u) < f.hl + m && Math.abs(v) < f.hw + m) return true; } }
    return false; };
  // (nor over a farmstead's yard or a hamlet's green)
  const yardIn = f => { for(const st of seats.values()){ const rr = st.rf || st.rr, da = st.a - f.a, dz = st.z - f.z; if(Math.abs(da) > f.hl + f.hw + rr || Math.abs(dz) > f.hl + f.hw + rr) continue;
    const u = da*f.ux + dz*f.uz, v = -da*f.uz + dz*f.ux; if(Math.abs(u) < f.hl + rr && Math.abs(v) < f.hw + rr) return true; } return false; };
  // (no way runs through it: its middle, corners and the middles of its sides all clear of every way)
  const wayClear = f => { for(const p of [-1, -0.5, 0, 0.5, 1]) for(const q of [-1, 0, 1]){ const a = f.a + p*f.hl*f.ux - q*f.hw*f.uz, z = f.z + p*f.hl*f.uz + q*f.hw*f.ux; if(!offWay(a, z, (p || q ? 1 : Math.min(f.hl, f.hw)*0.9/M)*M)) return false; } return true; };
  // (and each farmstead out in the country its own fields round its yard, as many as Works raises: at a little Works the
  //  rough grazing between farms is left open, as Ruby likes it; as Works rises the patchwork fills in between them)
  { const k = 0.18 + 1.1*Math.max(0, V.works - 0.25); for(const st of seats.values()) if(!st.hamlet && st.n) farms.push([st.a, st.z, st.w, 0, k]); }
  farms.forEach(([a0, z0, w, t, kf = 1], hi) => { if(w === 'neon') return;
    const R = rgRand(s, 1400, hi), th = R()*Math.PI, ux = Math.cos(th), uz = Math.sin(th), strips = R() < 0.35;
    const cu = (strips ? 160 + 80*R() : 90 + 70*R())*M, cv = strips ? cu*(0.22 + 0.12*R()) : cu*(0.6 + 0.5*R()), Rf = (350 + 550*R())*M*(0.6 + t)*kf, nu = Math.ceil(Rf/cu), nv = Math.ceil(Rf/cv);
    for(let i = -nu; i <= nu; i++) for(let j = -nv; j <= nv; j++){
      const lu = (i + (j & 1)*0.5*(strips ? 0 : 1))*cu, lv = j*cv, dist = Math.hypot(lu, lv); if(dist > Rf || R() > 1.1 - Math.pow(dist/Rf, 2)) continue;
      const a = a0 + lu*ux - lv*uz, z = z0 + lu*uz + lv*ux; if(Math.abs(z) > W*0.47) continue;
      if((w !== 'wilds' && w !== 'magic' && villageAt(w, a, z) > 0.4) || V.forestAt(a, z) > 0.55) continue; const g = ground(a, z); if(g.wet || g.coast) continue;   // (the cheaper tests first) (a village's fields come up to its houses; a town's begin past its streets)
      const hl = cu*(0.4 + 0.08*R()), hw = cv*(0.36 + 0.1*R());
      let f;
      if(g.slope < 0.28) f = { a, z, ux, uz, hl, hw, w, crop: cropOf(w, a, z, g.e, R), step: 0 };
      // (too steep to plough: terraced along the contour, but only where the country terraces (Ruby, from a height: every
      //  slope was terraced and flooded, and the hills looked glazed); a flooded paddy only where it is warm and wet,
      //  else tea or vines; elsewhere the steep is left to grazing)
      else if(g.slope < 1.1 && g.slope > 0.4 && w !== 'builders' && w !== 'ruins' && mnValue(a/(W*0.4) + 3.3, z/(W*0.4) - 7.7, s + 87) > 0.45){
        const d = W*0.003, ex = T.true(a + d, z, d) - T.true(a - d, z, d), ez = T.true(a, z + d, d) - T.true(a, z - d, d), gl = Math.hypot(ex, ez) || 1, dr = V.dryAt(a, z), warm = mnValue(a/(W*0.5) + 9.1, z/(W*0.5) + 1.7, s + 31) > 0.5;
        f = { a, z, ux: -ez/gl, uz: ex/gl, hl: hl*0.8, hw: hw*0.8, w, crop: dr < 0.38 && warm ? 'rice' : dr > 0.55 ? 'vines' : 'tea', step: (3 + 3*R())*M/Math.max(0.6, g.slope) }; }
      else continue;
      // (Ruby, seen from a height: fields lay over each other. Now one never crosses another, whatever way each is
      //  turned (their rectangles tested on all four axes), nor a way, nor a house and its yard)
      // (a field that won't fit is tried once more a third smaller, as a smaller field fills the corner left between others)
      const fits = () => !(fieldClash(f, 2*M) || bldgIn(f, 6*M) || yardIn(f) || !wayClear(f)); if(!fits()){ f.hl *= 0.66; f.hw *= 0.66; if(!fits()) continue; }
      f.edge = f.step ? (f.crop === 'rice' ? 'bund' : 'wall') : f.crop === 'rice' ? 'bund' : w === 'builders' ? 'none' : V.dryAt(a, z) > 0.5 || g.slope > 0.15 ? 'wall' : 'hedge';
      f.i = fields.length; fields.push(f);
      // (now and then a field is being ploughed: its ploughed part and the stubble still to plough, side by side with no
      //  hedge between, the line between them where the tractor is; see what each field holds, below)
      if(f.crop === 'ploughed' && !f.step && w !== 'ruins' && rgRand(s, 1440, f.i)() < 0.35*(0.3 + 0.7*Math.min(1, CL))){ const Rp = rgRand(s, 1441, f.i), cut = (Rp()*1.2 - 0.6)*f.hw, at2 = v => [f.a - v*f.uz, f.z + v*f.ux];
        const g2 = { ...f, crop: 'stubble', hw: (f.hw - cut)/2, openV: -1, rest: true }, va = (-f.hw + cut)/2, vb = (cut + f.hw)/2; [g2.a, g2.z] = at2(vb); const hwA = (cut + f.hw)/2; [f.a, f.z] = at2(va); f.hw = hwA; f.openV = 1; f.plough = Rp() < 0.5 ? 1 : -1;
        g2.i = fields.length; fields.push(g2); const e2 = Math.hypot(g2.hl, g2.hw); for(let bi = Math.floor((g2.a - e2)/FBIN); bi <= Math.floor((g2.a + e2)/FBIN); bi++) for(let bj = Math.floor((g2.z - e2)/FBIN); bj <= Math.floor((g2.z + e2)/FBIN); bj++){ const k = bi + ',' + bj; if(!fbins.has(k)) fbins.set(k, []); fbins.get(k).push(g2); } }
      const ext = Math.hypot(f.hl, f.hw); for(let bi = Math.floor((f.a - ext)/FBIN); bi <= Math.floor((f.a + ext)/FBIN); bi++) for(let bj = Math.floor((f.z - ext)/FBIN); bj <= Math.floor((f.z + ext)/FBIN); bj++){ const k = bi + ',' + bj; if(!fbins.has(k)) fbins.set(k, []); fbins.get(k).push(f); } } });
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
      // (an orchard's trees in their rows, a few metres apart, an olive grove's further; an orchard's apples or plums on
      //  half of them; the grass under them; they keep a row's width in from its edge)
      // (a traditional orchard: apples on a 9 m grid, cherries on 20, olives on 10 to 12; the grid turned a little off
      //  the field's, each tree a little off its place, one place in six or so empty, now and then a young tree at half
      //  size; docs/prior-art/ringworld-countryside.md §14. A modern orchard or hedgerow grove is rows, painted as a crop)
      if(f.crop === 'orchard' || f.crop === 'olives'){ const ol = f.crop === 'olives', kind = ol ? 'olive' : R() < 0.25 ? 'cherry' : 'fruit', sp0 = (ol ? 10 + 2*R() : kind === 'cherry' ? 18 + 4*R() : 8.5 + 1.5*R())*M, sp = Math.max(sp0, Math.sqrt(f.hl*f.hw*4/260)), fruit = !ol && R() < 0.5;
        const tw = (R() - 0.5)*0.35, ct = Math.cos(tw), st = Math.sin(tw);
        for(let i2 = -Math.ceil(f.hl/sp) - 1; i2 <= Math.ceil(f.hl/sp) + 1; i2++) for(let j2 = -Math.ceil(f.hw/sp) - 1; j2 <= Math.ceil(f.hw/sp) + 1; j2++){
          const gu = i2*sp + (R() - 0.5)*1.5*M, gv = j2*sp + (R() - 0.5)*1.5*M, u = gu*ct - gv*st, v = gu*st + gv*ct; if(Math.abs(u) > f.hl - sp*0.45 || Math.abs(v) > f.hw - sp*0.45 || R() < 0.15) continue;
          put(kind, u, v, { fruit }); const o2 = out[out.length - 1]; o2.c = 'tree'; if(kind === 'cherry') o2.hM *= 0.6; if(R() < 0.08) o2.hM *= 0.5; }
        continue; }
      // (the stones a farmer cleared off a ploughed or mown field, heaped at a corner or along its edge)
      if(['ploughed', 'wheat', 'barley', 'stubble', 'maize', 'hay', 'pasture'].includes(f.crop) && !f.rest && R() < 0.2*CLF*(0.4 + V.forms)){ const cu = R() < 0.5 ? -1 : 1, cv = R() < 0.5 ? -1 : 1; put('stonepile', cu*(f.hl - 3*M)*(R() < 0.6 ? 1 : R()), cv*(f.hw + 2.5*M)); }
      // (a field being ploughed: the tractor on the line between ploughed and not, turned along the furrows, and the gulls
      //  that follow a plough, wheeling over the fresh furrow behind it and down in it)
      if(f.plough){ const ut = (R()*1.6 - 0.8)*f.hl; put('tractor', ut, f.hw - 2*M, { face: Math.atan2(f.uz, f.ux) + (f.plough < 0 ? Math.PI : 0) });
        if(R() < 0.85){ put('gulls', ut + f.plough*(3 + 6*R())*M, f.hw - 1*M); out[out.length - 1].c = 'life'; } }
      if(f.rest) continue;
      if(f.crop === 'stubble' && R() < 0.8*CLF){ const n = 4 + Math.floor(R()*10), rows = 1 + Math.floor(R()*3); for(let k = 0; k < n; k++) put('haybale', (R()*2 - 1)*f.hl*0.85, ((k % rows) + 0.5)/rows*f.hw*1.6 - f.hw*0.8 + (R() - 0.5)*f.hw*0.1); }
      if(f.crop === 'hay' && R() < 0.6*CLF){ const n = 1 + Math.floor(R()*3); for(let k = 0; k < n; k++) put('haystack', (R()*2 - 1)*f.hl*0.7, (R()*2 - 1)*f.hw*0.6); }
      if(f.crop === 'pasture' && R() < 0.55*CLF){ const cu = (R()*2 - 1)*f.hl*0.6, cv = (R()*2 - 1)*f.hw*0.5, n = 3 + Math.floor(R()*10);
        for(let k = 0; k < n; k++){ const an = R()*Math.PI*2, rd = (2 + 14*Math.sqrt(R()))*M; put('sheep', cu + Math.cos(an)*rd, cv + Math.sin(an)*rd*0.7, { face: R()*Math.PI*2 }); }
        if(R() < 0.25) put('shepherd', cu + 18*M, cv); }
      if((f.crop === 'wheat' || f.crop === 'maize' || f.crop === 'barley') && R() < 0.12*CLF) put('scarecrow', (R()*2 - 1)*f.hl*0.5, (R()*2 - 1)*f.hw*0.5);
      if((f.crop === 'wheat' || f.crop === 'barley') && f.w !== 'ruins' && R() < 0.06){ const hu = (R()*2 - 1)*f.hl*0.6, hv = (R()*2 - 1)*f.hw*0.5; put('harvester', hu, hv, { face: Math.atan2(f.uz, f.ux) });
        if(R() < 0.6){ put('gulls', hu, hv + 6*M); out[out.length - 1].c = 'life'; } }   // (the same wave of gulls follows the harvester as it cuts)
      if((f.crop === 'lavender' || f.crop === 'rapeseed' || f.crop === 'moonflower') && R() < 0.3*CLF) put('beehives', f.hl + 2*M, (R()*2 - 1)*f.hw*0.8);
      if(f.crop === 'stubble' && f.w !== 'ruins' && R() < 0.04*CLF) put('tractor', f.hl - 6*M, (R()*2 - 1)*f.hw*0.7);
      if(f.edge === 'hedge') for(let k = 0, n = Math.floor(f.hl*2/(25*M)); k < n; k++) if(R() < 0.18*V.life*2){ const side = R() < 0.5 ? -1 : 1, kind = ['broadleaf', 'broadleaf', 'poplar', 'birch'][Math.floor(R()*4)];
        put(kind, -f.hl + (k + 0.5)*f.hl*2/n, side*(f.hw + 1.2*M), {}); out[out.length - 1].c = 'tree'; } } }
  sowD(1, W*0.0036, W*0.02, Math.min(W*4, W*3.2*DK)/DK, 4, (a, z, r, R) => {
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
  // (never in a field: a farmer clears the stones off it, and they lie in heaps at its edge, below)
  sowD(3, W*0.006, W*0.02, W*1.0, 2, (a, z, r, R) => { const w = V.worldAt(a, z), g = ground(a, z); if(g.wet || R() > RG_PROF[w].ro*V.forms*(0.4 + 0.9*Math.min(1, g.slope)) || inField(a, z, 3*M)) return null; return { c: 'rock', w, kind: 'rock', hM: pkMetres('rock', R()) }; });
  // GRASS AND FLOWERS near you
  sowD(4, W*0.0012, W*0.004, W*0.05, 3, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > RG_PROF[w].gr*V.life*1.4) return null; return { c: 'grass', w, kind: 'grass', hM: pkMetres('grass', R()) }; });
  // SMALL LIFE lives on some rings, not all: insects, fairies, flowers, slime and kites flown on a windy day, each world
  // its own mix
  { const beMax = Math.max(...V.world.list.map(w => RG_PROF[w].be)), lively = mnHash(s, 41, 9) < 0.25 + 0.6*V.fauna*beMax;
    const MIX = { magic: [1, 3, 1, 1, 0.4], wilds: [3, 1, 3, 1, 0.8], ruins: [2, 0.5, 1, 3, 0], neon: [1, 2, 0.5, 1, 0], cities: [2, 0.5, 2, 0.5, 1], builders: [2, 1, 2, 1, 0.2] }, KINDS = ['insects', 'fairies', 'flowers', 'slime', 'kite'];
    if(lively) sowD(5, W*0.003, W*0.01, W*0.12, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.12*V.fauna*(0.3 + 0.7*RG_PROF[w].be)) return null;
      const mix = MIX[w] || [2, 1, 2, 1, 0], tot = mix.reduce((p, q) => p + q, 0); let pick = R()*tot, ki = 0; while(ki < KINDS.length - 1 && pick > mix[ki]){ pick -= mix[ki]; ki++; }
      return { c: 'life', w, kind: KINDS[ki] }; }); }
  // ROBOTS AND DROIDS, as life, where they belong (Ruby: "cute robots and threatening ones, in appropriate biomes
  // only"): the builders' helpers and drones, the neon's sentries and walkers, the ruins' scavengers, and now and then
  // a giant fallen long ago, kneeling in the grass
  { const BOTS = { builders: 0.2, neon: 0.14, cities: 0.07, ruins: 0.1, wilds: 0.012, magic: 0.015 };
    sow(6, W*0.004, W*0.012, W*0.3, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > (BOTS[w] || 0)*(0.3 + V.fauna)) return null;
      const g = ground(a, z); if(g.wet || g.slope > 1.2) return null; const L2 = PK_BOTS[w] || PK_BOTS.cities, kind = L2[Math.floor(R()*L2.length)];
      if(kind === 'derelict' && R() > 0.2) return null;
      return { c: 'bot', w, kind, hM: pkMetres(kind, R()) }; }); }
  // THE WILD THINGS (Ruby: "wildlife still travel on short predictable paths and do not really move or scatter, we
  // should probably have more wildlife in general (birds, small things)"; docs/prior-art/ringworld-wildlife.md): herds,
  // flocks and single creatures, each group at a home of its own and moving by wildKit's clock. Which kind, by the world
  // and the ground: deer and elk where wood meets open land, hares and a fox in the open; rooks, starlings and sparrows
  // on open ground, pigeons and sparrows in town; ducks and swans on the water by its edge, a heron at the edge; over
  // the land a raptor circling and swallows and swifts hawking, bats round the trees and water at dusk, butterflies and
  // dragonflies near you, and now and then a skein of geese going over
  { const LIFE = V.fauna, wildish = w => ({ wilds: 1, magic: 0.85, ruins: 0.75, cities: 0.55, builders: 0.4, neon: 0.12 })[w] ?? 0.5, wild = (kind, w, x2 = {}) => ({ c: 'wild', kind, w, ...x2 });
    sowD(17, W*0.02, W*0.04, W*0.6, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.5*LIFE*wildish(w)) return null; const g = ground(a, z), fo = V.forestAt(a, z);
      if(g.wet || g.slope > 0.7 || fo < 0.1 || fo > 0.62 || inTown(w, a, z)) return null; return wild(T.true(a, z, W*0.01) > TR.snow*0.3 || R() < 0.2 ? 'elk' : 'deer', w); });
    sowD(18, W*0.008, W*0.02, W*0.25, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.24*LIFE*wildish(w)) return null; const g = ground(a, z);
      if(g.wet || g.slope > 0.6 || V.forestAt(a, z) > 0.5 || inTown(w, a, z)) return null; return wild(R() < 0.3 ? 'fox' : 'hare', w); });
    sowD(19, W*0.012, W*0.03, W*0.4, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.24*LIFE) return null; const g = ground(a, z); if(g.wet || V.forestAt(a, z) > 0.45) return null;
      const u = R(); return wild(inTown(w, a, z) ? (u < 0.6 ? 'pigeons' : 'sparrows') : w === 'ruins' || w === 'magic' ? (u < 0.7 ? 'rooks' : 'starlings') : u < 0.45 ? 'rooks' : u < 0.8 ? 'starlings' : 'sparrows', w); });
    sowD(20, W*0.012, W*0.03, W*0.5, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.55*LIFE) return null; const g = ground(a, z); if(!g.coast) return null;
      if(g.wet) return wild(R() < 0.25 ? 'swans' : 'ducks', w, { afloat: true }); return R() < 0.5 ? wild('heron', w) : null; });
    sowD(21, W*0.06, W*0.12, W*1.2, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.55*LIFE*(w === 'neon' ? 0.25 : 1)) return null; const u = R();
      return wild(inTown(w, a, z) ? (u < 0.7 ? 'swifts' : 'raptor') : u < 0.4 ? 'raptor' : u < 0.8 ? 'swallows' : 'swifts', w); });
    sowD(22, W*0.015, W*0.04, W*0.2, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.3*LIFE) return null; const g = ground(a, z); if((g.wet && !g.coast) || (!g.coast && V.forestAt(a, z) < 0.3)) return null; return wild('bats', w); });
    sowD(24, W*0.004, W*0.008, W*0.04, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.3*LIFE*(0.3 + 0.7*wildish(w))) return null; const g = ground(a, z); if(g.wet && !g.coast) return null; return wild(g.coast ? 'dragonflies' : 'butterflies', w); });
    // (and near you, where they are seen best: a hare or two, a fox, a few birds on the grass, swallows over it)
    sowD(25, W*0.005, W*0.012, W*0.05, 1, (a, z, r, R) => { const w = V.worldAt(a, z); if(R() > 0.38*LIFE*(0.3 + 0.7*wildish(w))) return null; const g = ground(a, z); if(g.wet || g.slope > 0.8) return null;
      const u = R(), town = inTown(w, a, z), fo = V.forestAt(a, z); return wild(town ? (u < 0.5 ? 'sparrows' : u < 0.8 ? 'pigeons' : 'swifts') : fo > 0.5 ? (u < 0.5 ? 'butterflies' : 'sparrows') : u < 0.3 ? 'hare' : u < 0.4 ? 'fox' : u < 0.6 ? 'swallows' : u < 0.8 ? 'starlings' : 'rooks', w); });
    sow(23, W*0.4, W*0.8, W*2.4, 1, (a, z, r, R) => R() < 0.35*LIFE ? wild('geese', V.worldAt(a, z)) : null); }
  // SMALL THINGS near you (Ruby: "small things that get found closer to the player"): fences and mailboxes in the wilds,
  // lamps, benches and bicycles in town, barrels and crates in the ruins, now and then a person, for scale
  // (each where it belongs: hay, a scarecrow, a tractor in the open fields; a well, a shrine, a mailbox by a village; a
  //  windpump and its trough on dry pasture; stone walls on the steep and dry, hedges on the low and wet; the town's
  //  furniture in town; wisps by water; the poles along the roads, below. The large ones are seen from further off)
  const propFits = (k, w, g, a, z, ci) => { const fo = V.forestAt(a, z), dr = V.dryAt(a, z);
    switch(k){ case 'haybale': case 'haystack': case 'scarecrow': case 'tractor': case 'beehives': return false; case 'grainbin': return fo < 0.4 && g.slope < 0.3 && ci < 0.3 && !!inField(a, z, 40*M);   // (the field's own things stand in its fields)
      case 'windpump': case 'trough': return dr > 0.45 && g.slope < 0.35; case 'wall': return g.slope > 0.15 || dr > 0.5; case 'hedge': return dr < 0.55 && g.slope < 0.4;
      case 'well': case 'shrine': case 'mailbox': case 'wishing': return ci > 0.03; case 'busstop': case 'kiosk': case 'signal': case 'phonebox': case 'vending': case 'cart': return ci > 0.15;
      case 'fountain': return ci > 0.2 && g.slope < 0.2; case 'bandstand': return ci > 0.12 && ci < 0.7 && g.slope < 0.15;
      case 'wisp': return g.coast || g.rise < -0.2; case 'fairyring': return fo > 0.2 && g.slope < 0.25; case 'solar': case 'dish': return g.slope < 0.25; case 'pole': return false; default: return true; } };
  sowD(7, W*0.002, W*0.006, W*0.05, 1, (a, z, r, R) => { const w = V.worldAt(a, z), P = RG_PROF[w], ci = V.cityAt(a, z, w === 'wilds' ? 0.12 : P.cv), near = 0.05 + 0.5*ci;
    if(R() > near*0.45*CL) return null; const g = ground(a, z); if(g.wet || g.slope > 0.8 || !offWay(a, z, 1.5*M)) return null;
    const L2 = (PK_PROPS[w] || PK_PROPS.cities).filter(k => !PK_PROPS_BIG.includes(k) && !RG_STREET_KINDS.includes(k)), kind = L2[Math.floor(R()*L2.length)]; if(!kind || (kind === 'figure' && R() > 0.4)) return null;
    // (a person walks along the street or lane beside it, faceOf turned a quarter: the way to the way, turned along it)
    if(!propFits(kind, w, g, a, z, ci)) return null; return { c: 'prop', w, kind, hM: pkMetres(kind, R()), sink: w === 'ruins' && RG_SINKS.includes(kind) ? 0.08 + 0.3*R() : 0, ...(kind === 'figure' ? { walk: faceOf(a, z, R()) + Math.PI/2 } : {}) }; });
  sowD(11, W*0.006, W*0.02, W*0.2, 1, (a, z, r, R) => { const w = V.worldAt(a, z), P = RG_PROF[w], ci = V.cityAt(a, z, w === 'wilds' ? 0.12 : P.cv);
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
      if(w !== 'neon' && R() < 0.012*V.fauna*2){ const o = put('lamplighter', a + nz*1.2*M, z - nx*1.2*M, nx, nz, k % 2 ? 1 : -1, 0.6*M); if(o) o.c = 'bot'; } } }); }
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
    const fits = (k, g, a, z, r, ci) => k === 'slabgate' ? g.rise > 0.4 || g.slope > 0.5 : k === 'cogdoor' ? g.slope > 0.15 && g.slope < 0.9 && ci < 0.1 : k === 'spire' ? g.rise > 0.6
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
  // LONG THINGS ARE MANY THINGS (Ruby: "overly wide objects rotate with the camera, so … broken up into smaller objects
  // and positioned individually (hedgerows etc) and sorted by the camera"; docs/prior-art/ringworld-life-and-views.md §5):
  // a wall, a hedgerow, a fence was one picture pinned at its middle, always square to you; each is now a run of short
  // pieces laid along its own line in the world, each standing where it stands and sorted by its own distance, so the
  // run recedes and turns as the camera goes round it
  { const RUN = { wall: [7, 2], hedge: [6, 2.5], fence: [3.4, 2.2] }, pieces = [];
    for(let i = out.length - 1; i >= 0; i--){ const o = out[i], rn = o.c === 'prop' && RUN[o.kind]; if(!rn || o.piece) continue;
      const len = o.hM*rn[0], n = Math.max(1, Math.round(len/rn[1])), pl = len/n, ax = o.face ?? (o.rs % 62832)/10000, ca = Math.cos(ax), sa = Math.sin(ax);
      for(let k = 0; k < n; k++){ const t = (k + 0.5 - n/2)*pl*M, a = o.a + ca*t, z = o.z + sa*t;
        pieces.push({ ...o, a, z, r: Math.hypot(a, z - L.z0), piece: pl, axis: ax, rs: (Math.imul(o.rs, 31) + k*0x9E3779B1) >>> 0 }); }
      out.splice(i, 1); }
    out.push(...pieces); }
  // A DOOR FOR EACH WALKER (Ruby, 2026-10-24: "people need to go to doors"): the nearest house within a quarter of a
  // kilometre that has a door (a walker out on the lanes walks home across the fields), the walker's door a metre out from its front, the side toward the eye (where its door is drawn); at its
  // own moment of the dusk it walks there and goes in, and at its moment of the dawn it comes out and goes back
  { const doors = out.filter(o => o.c === 'bldg' && !RG_DOORLESS.includes(o.kind));
    for(const o of out){ if(o.c !== 'prop' || o.kind !== 'figure' || o.w === 'neon') continue; let best = null, bd = 250*M;
      for(const b of doors){ const d = Math.abs(b.a - o.a) + Math.abs(b.z - o.z); if(d < bd*1.42 && Math.hypot(b.a - o.a, b.z - o.z) < bd){ bd = Math.hypot(b.a - o.a, b.z - o.z); best = b; } }
      if(best){ const ex = -best.a, ez = L.z0 - best.z, el = Math.hypot(ex, ez) || 1, off = (best.wM*0.5 + 1)*M; o.door = { a: best.a + ex/el*off, z: best.z + ez/el*off }; } } }
  // EVERY THING NAMED (Ruby: "Each NPC should probably have an internal ID and tag so they can be tracked and given specific
  // animation states and their states can be captured … Same with the plants … and the buildings"): an id from its own
  // stream (the same thing has the same id from wherever it is seen, view after view, film frame after frame), and its tags
  // (what it is, what world built it, and what it does: rgTagsOf); a wild group's members are its id and their number
  const seenIds = new Set();
  for(const o of out){ let id = RG_ID_CLASS[o.c] + '-' + (o.kind || o.c) + '-' + (o.rs >>> 0).toString(36); while(seenIds.has(id)) id += "'"; seenIds.add(id); o.id = id; o.tags = rgTagsOf(o); }
  RG_KEPT_STORES.set(key, out); if(RG_KEPT_STORES.size > 4) RG_KEPT_STORES.delete(RG_KEPT_STORES.keys().next().value);
  return out;
}
// (each record's class as its id's first word, and its tags: its class's role, its kind, its world, and what it does)
const RG_ID_CLASS = { tree: 'plant', grass: 'plant', bldg: 'building', prop: 'thing', bot: 'droid', life: 'life', wild: 'animal', rock: 'stone', board: 'board', glim: 'light', henge: 'stones', egg: 'find' };
const RG_ANIMALS = ['sheep', 'gulls', 'crab'], RG_PEOPLE = ['figure', 'shepherd', 'lamplighter', 'harvester'];
function rgTagsOf(o){ const t = [RG_ID_CLASS[o.c] || o.c, o.kind, o.w].filter(Boolean);
  if(o.c === 'wild' || RG_ANIMALS.includes(o.kind)) t.push('animal', 'moves'); if(RG_PEOPLE.includes(o.kind)) t.push('npc', 'person', 'moves');
  if(o.c === 'bot') t.push('npc', 'droid', 'moves'); if(o.c === 'tree' || o.c === 'grass') t.push('plant'); if(o.c === 'bldg') t.push(o.near ? 'near' : 'far'); if(o.door) t.push('has-door');
  if(o.c === 'wild' && WK_FLYERS.includes(o.kind)) t.push('flies'); return t; }
/** THE STATE OF A THING at a moment of the clock (t, seconds): what a tracker, a game or a test can capture of it, by its
 *  id; for a wild group, each member's own (its id the group's and its number). Pure: the same record and moment, the same
 *  answer (test hook: the ids and states are read by test/wildlife.test.mjs). */
export function ringStateOf(o, t = 0, env = {}){   // test hook: a thing's state by its id, for a tracker or a game
  const base = { id: o.id, tags: o.tags, kind: o.kind, a: o.a, z: o.z };
  if(o.c !== 'wild') return base;
  const n = wkCount(o.kind, o.rs), members = []; for(let j = 0; j < n; j++){ const st = wkAt(o.kind, o.rs, j, t, env); members.push({ id: o.id + '#' + j, on: st.on, x: st.x, z: st.z, y: st.y, pose: st.pose, face: st.face }); }
  return { ...base, members }; }
let RG_LAST_MESH = null;
const RG_MESH_KEPT = new Map();   // (the land's mesh, its corners' heights and colours, for the last few worlds viewed)
export const ringMeshOf = () => RG_LAST_MESH;   // test hook: the last view's mesh of the land (its rings and each corner's height)
export const ringKeptStores = () => [...RG_KEPT_STORES.values()];   // test hook: the stores the views made, every thing in them with its id and tags

// ---------------- THE LAND ----------------
// the trees whose crown is a narrow spire or column: what they hide is narrow too
const RG_NARROW_TREES = ['spruce', 'fir', 'cypress', 'poplar', 'pine', 'bamboo', 'saguaro'];
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
// how lit a strike is at its phase (0 to 1 over its 1.2 s): nothing while its leader creeps down (a fifth of a second),
// then rising over a quarter, held a tenth, fading over two thirds; a still's bolt (at 0.42) whole
const rgBoltLit = ph => rsSmooth(0.17, 0.375, ph)*(1 - rsSmooth(0.45, 1, ph));
// THE DISHES' SKY (Ruby: "Satellite dishes should move, and they should point in sync at the same targets like real
// satellite dishes (but not all at the exact same time)"): an array listens to one source at a time. By the seed a run
// of sources (a bearing in the world and a height in the sky); each held seven seconds of the film while the dishes
// track it slowly across the sky, then all slew to the next over its last two, each dish starting its own moment late
// (lag, up to a second), as an array's dishes do; a still shows every dish on the first. [bearing, height] in radians
const rgDishAim = (s, ft, lag) => { const P = 7, t = Math.max(0, ft - lag), k = Math.floor(t/P), u = t/P - k, src = j => { const R = rgRand(s, 1700, j); return [R()*Math.PI*2, (22 + 55*R())*Math.PI/180]; };
  const [a0, e0] = src(k), [a1, e1] = src(k + 1), trk = 0.5*Math.PI/180, sl = rsSmooth(0.7, 1, u), a0t = a0 + trk*u*P, e0t = e0 + 0.3*trk*u*P;
  return [a0t + Math.atan2(Math.sin(a1 - a0t), Math.cos(a1 - a0t))*sl, e0t + (e1 - e0t)*sl]; };
// a storm's strike at a moment of a film (ft, in the film's own seconds): slots 2.8 s long, each striking or not by its
// own stream, a strike beginning in its slot's first 0.3 s and lasting 1.2 s, none beginning in the film's first 1.5 s;
// the strike's phase, its slot, and its draw for which cloud it falls from (null: none now)
export const rgStrike = (s, ft) => { const P = 2.8, k0 = Math.floor(ft/P); let out = null;
  for(const k of [k0 - 1, k0]){ const Rk = rgRand(s, 818, k); if(Rk() < 0.5){ const t0 = k*P + Rk()*0.3, ph = (ft - t0)/1.2, pick = Rk(); if(t0 >= 1.5 && ph >= 0 && ph < 1) out = { ph, ev: k, pick, t0 }; } }
  return out; };
function rgPaintLand(x, mk, dk, V){
  let FLASH = null;   // (a strike's light on the land, set where the storm's heaps are dealt, laid at the end)
  rgPx = V.px;
  const { L, W, ww, wh, unit, F, at, T, TR, px, hx, hz } = V, BLACK = [0, 0, 0], s = V.seed | 0;
  const LT = V.sun.LT, sd = V.sun.sd, cth = Math.cos(V.th), AIR = rgAirOf(V, V.dayHere);
  const d0 = W*0.0012;
  // THE VIEW'S REACH (Ruby: "make the drawing script aware of the view frustum"): how far round from the heading the page
  // sees, its corners included (the painter's perspective: a radius on the page of 2F·tan(θ/2)); the land is kept that
  // far round, so a wide lens never shows its ends
  const half = Math.hypot(ww/2, wh/2)/unit/L.f, PHI = Math.min(2.55, 2*Math.atan(half/2)*1.06 + 0.06);
  // a floor point's angle from the heading, and how far off along the floor it lies (what sorts the land and the things,
  // far to near)
  const angOf = (a, z) => Math.atan2(-a*hz + (z - L.z0)*hx, a*hx + (z - L.z0)*hz), cutOf = (a, z) => Math.hypot(a, z - L.z0);
  const hazeOf = d => V.air*(1 - Math.exp(-d/(W*1.3)));
  // a point of the floor in the view's terms: how far ahead
  const ahead = (a, z) => a*hx + (z - L.z0)*hz;
  // the land's own noise, smooth in the world (the water's glints)
  const wn = (a, z, ws, salt) => mnValue(a/ws + salt*3.17, z/ws - salt*1.93, s + 900 + salt);

  // ---- 1. THE LAND, A MESH FIXED IN THE WORLD ----
  // (Ruby, 2026-10-25: "nothing morphing as the camera rises or turns"; docs/prior-art/ringworld-terrain.md §4): the floor
  // is a grid fixed in the world, in nested rings of square cells each twice the last (a geometry clipmap, Losasso and
  // Hoppe), the finest round where you stand. Each corner's height is the land kit's at its own place, asked for detail
  // down to its cell's size (landKit.js): nothing of the eye's but how far along the floor it stands, so rising,
  // tilting, turning or zooming the camera changes how the grid is seen and never the grid. Each ring's outer part eases
  // into the next coarser ring's shape (a geomorph by place), so where two rings meet they share their edge and no crack
  // opens. Detail sets how fine the cells (some 16 to 7.5 pixels at the page's scale) and how far the land reaches.
  const DI = V.detail, reach = W*[3.2, 4, 4.6, 5.2][DI], d1 = reach;
  const NG = 2*Math.round(Math.max(8, Math.min(80, F/[16, 12, 9.5, 7.5][DI]))/2);   // (cells from a ring's middle to its edge)
  // (the finest ring's cells a fraction of a metre, the ground at your feet being so near; and finer rings drawn only where their cells would show at all from the
  //  eye's height, so looking down from a height costs no more than looking across. A ring so left out was finer than
  //  a pixel: its land is the next ring's, the same land without detail no one could see)
  let c0 = W*0.00025*[0.5, 0.36, 0.28, 0.22][DI]; while(c0*F/Math.max(L.hc, W*0.0004) < 1.2 && c0*NG*4 < reach) c0 *= 2;
  const NLV = Math.max(1, Math.ceil(Math.log2(reach/(NG*c0))) + 1), cl = [], cz = [], ZMAX = W*0.497, SIDE = 2*NG + 1;
  for(let l = 0; l < NLV; l++){ cl.push(c0*Math.pow(2, l)); cz.push(Math.round(L.z0/(2*cl[l]))*2*cl[l]); }
  // (the corners' heights and ground colours kept between views of the same world, so a turn of the camera or a film's
  //  frames, the eye standing where it stands, ask the land kit nothing twice)
  const meshKey = [V.seed, W, V.forms, V.world.list.join(), V.detail, NG, c0, L.z0, L.Hw, TR.snow, V.life, V.works, V.land.join()].join('|');
  let kept = RG_MESH_KEPT.get(meshKey); if(!kept){ kept = { vH: cl.map(() => new Float64Array(SIDE*SIDE).fill(NaN)), vC: cl.map(() => new Float32Array(SIDE*SIDE*3).fill(-1)) }; RG_MESH_KEPT.set(meshKey, kept); while(RG_MESH_KEPT.size > 3) RG_MESH_KEPT.delete(RG_MESH_KEPT.keys().next().value); }
  const vH = kept.vH, vP = cl.map(() => new Array(SIDE*SIDE));
  const zOf = (l, j) => Math.max(-ZMAX, Math.min(ZMAX, cz[l] + j*cl[l]));
  const vC = kept.vC;
  // a corner's height (each ring's middle at a = 0, where you stand along the ring), eased toward the coarser ring's
  // shape over the ring's outer part, wholly its shape at the edge
  // (and as a painter does, the far land drawn taller than it is, so the ranges along the arch's foot read at all: by how
  //  far it lies along the floor from where you stand, so it too is the land's and not the camera's; never above the rim
  //  walls (Ruby: "no mountain above the rim walls"); exf: how much taller, and its inverse for the land's true colours)
  const exf = d => 1 + 2.2*rsSmooth(W*0.05, W*2, d), capD = L.Hw*0.9, capK = L.Hw*0.06;
  const exH = (h, d) => { if(h <= 0) return h; const v = h*exf(d); return v < capD - capK*4 ? v : capD - capK*Math.log1p(Math.exp((capD - v)/capK)); };
  let heightIn = null;
  const vh = (l, i, j) => { const k = (j + NG)*SIDE + i + NG; let h = vH[l][k]; if(h === h) return h;
    const a = i*cl[l], z = zOf(l, j); h = exH(V.LK.height(a, z, 2*cl[l]), Math.hypot(a, z - L.z0));
    const al = l + 1 < NLV ? rsSmooth(0.7, 1, Math.max(Math.abs(i), Math.abs(j))/NG) : 0; if(al > 0) h += (heightIn(l + 1, a, z) - h)*al;
    vH[l][k] = h; return h; };
  heightIn = (l, a, z) => { const u = a/cl[l], v = (z - cz[l])/cl[l], i = Math.max(-NG, Math.min(NG - 1, Math.floor(u))), j = Math.max(-NG, Math.min(NG - 1, Math.floor(v))), fu = u - i, fv = v - j;
    const h00 = vh(l, i, j), h10 = vh(l, i + 1, j), h01 = vh(l, i, j + 1), h11 = vh(l, i + 1, j + 1); return h00 + (h10 - h00)*fu + (h01 - h00)*fv + (h00 - h10 - h01 + h11)*fu*fv; };
  // THE LAND AS DRAWN at a place, and the cell it lies in (so a thing stands on the ground that is painted, never on
  // one a little above or below it: Ruby, "objects embedded in the ground or growing from it, never floating")
  const levelAt = (a, z) => { for(let l = 0; l < NLV; l++){ const R = (NG - 0.5)*cl[l]; if(Math.abs(a) < R && Math.abs(z - cz[l]) < R) return l; } return -1; };
  const meshH = (a, z) => { const l = levelAt(a, z); return l < 0 ? V.LK.height(a, z, cl[NLV - 1]*2) : heightIn(l, a, z); };
  // (how steep the drawn land is at a place: a thing on a slope is set into it, its downhill side not left in the air)
  const slopeAt = (a, z) => { const d = W*0.0005; return Math.hypot(meshH(a + d, z) - meshH(a - d, z), meshH(a, z + d) - meshH(a, z - d))/(2*d); };
  const cellAt = (a, z) => { const l = levelAt(a, z); return l < 0 ? cl[NLV - 1]*2 : cl[l]; };
  // THE SUN'S SHADOWS ON THE LAND (Ruby: "shadows cast by the sun where it stands"; docs/prior-art/ringworld-terrain.md):
  // from each place, a walk toward the sun over the land as it is drawn, out some two kilometres in widening steps; where
  // a hill or a rim wall stands above the line to the sun, the place lies in its shadow, softly at the shadow's edge (the
  // farther the hill, the softer: the sun's own disc). Low suns throw the hills' and the walls' shadows across the band.
  // (litAt: 1 in full sun, 0 in shadow; 1 too where the sun is overhead or down, the day's own light deciding then)
  const SUN0 = V.sun.D, sunKey = SUN0.map(v => v.toFixed(4)).join(), M1s = W*0.00025;
  const litAt = (a, z, h0) => { const ca = Math.cos(a), sa = Math.sin(a), up = -(ca*SUN0[0] + sa*SUN0[1]), al = -sa*SUN0[0] + ca*SUN0[1], ac = SUN0[2], hl = Math.hypot(al, ac);
    if(up <= 0.02 || hl < 1e-6) return 1; const tE = up/hl, da = al/hl, dz = ac/hl; let occ = 0;
    for(let s2 = Math.max(c0*2, 3*M1s); s2 < W*0.6; s2 *= 1.32){ const a2 = a + da*s2, z2 = z + dz*s2, ray = h0 + tE*s2;
      const h2 = Math.abs(z2) > ZMAX ? L.Hw : meshH(a2, z2); if(h2 > ray - s2*0.03){ occ = Math.max(occ, (h2 - ray)/(s2*0.03) + 1); if(occ >= 2) break; }
      if(ray > L.Hw*1.05) break; }
    return 1 - rsSmooth(0, 2, occ); };
  // (each corner's, kept with the mesh for this sun)
  if(!kept.lit || kept.litKey !== sunKey){ kept.lit = cl.map(() => new Float32Array(SIDE*SIDE).fill(-1)); kept.litKey = sunKey; }
  const vLit = (l, i, j) => { const k2 = (j + NG)*SIDE + i + NG, A = kept.lit[l]; if(A[k2] >= 0) return A[k2]; const v = litAt(i*cl[l], zOf(l, j), vh(l, i, j)); A[k2] = v; return v; };
  RG_LAST_MESH = { c0, NG, NLV, cz: cz.slice(), height: (l, i, j) => vh(l, i, j) };
  // (each corner where it falls on the page, the water's at the sea's level)
  const vp = (l, i, j) => { const k = (j + NG)*SIDE + i + NG; let p = vP[l][k]; if(p !== undefined) return p; p = at(i*cl[l], zOf(l, j), Math.max(TR.sea, vh(l, i, j))); vP[l][k] = p; return p; };
  // the cells in view: each ring's, less the finer ring inside it, as far as the land reaches, within the view's reach
  const quads = [];
  for(let l = 0; l < NLV; l++){ const c = cl[l], hole = l > 0 ? [-NG/2, NG/2, (cz[l - 1] - cz[l])/c - NG/2, (cz[l - 1] - cz[l])/c + NG/2] : null;
    for(let j = -NG; j < NG; j++){ const zA = cz[l] + j*c, zB = zA + c; if(zB < -ZMAX || zA > ZMAX) continue;
      for(let i = -NG; i < NG; i++){ if(hole && i >= hole[0] && i + 1 <= hole[1] && j >= hole[2] && j + 1 <= hole[3]) continue;
        const am = (i + 0.5)*c, zm = Math.max(-ZMAX, Math.min(ZMAX, (zA + zB)/2)), dd = Math.hypot(am, zm - L.z0); if(dd > reach) continue;
        if(Math.abs(angOf(am, zm)) > PHI + Math.atan2(c*0.8, Math.max(dd, 1e-9)) + 0.02) continue;
        quads.push({ l, i, j, dd, am, zm, c }); } } }
  // which way round a cell facing you winds on the page (a flat cell straight ahead), so cells turned away, hidden behind
  // the land in front of them, are never drawn
  const ORI = (() => { const dq = W*0.02, a0 = dq*hx, z0 = L.z0 + dq*hz, e = Math.max(TR.sea, meshH(0, L.z0)), dl = W*0.001, P = [at(a0, z0, e), at(a0 + dl, z0, e), at(a0 + dl, z0 + dl, e), at(a0, z0 + dl, e)];
    if(P.some(p => !p)) return 1; let A = 0; for(let q = 0; q < 4; q++){ const p = P[q], r = P[(q + 1) & 3]; A += p[0]*r[1] - r[0]*p[1]; } return A >= 0 ? 1 : -1; })();
  const shown = [];
  for(const q of quads){ const { l, i, j } = q, P = [vp(l, i, j), vp(l, i + 1, j), vp(l, i + 1, j + 1), vp(l, i, j + 1)]; if(P[0] === null || P[1] === null || P[2] === null || P[3] === null) continue;
    let A = 0, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for(let k = 0; k < 4; k++){ const p = P[k], r = P[(k + 1) & 3]; A += p[0]*r[1] - r[0]*p[1]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    if(A*ORI < 0 || x1 < 0 || x0 > ww || y0 > wh) continue; q.P = P; q.box = [x0, x1, y0, y1]; shown.push(q); }

  // ---- 2. WHAT THE LAND HIDES, AND ITS CRESTS ----
  // (as the ridges were measured, now from the mesh itself: docs/prior-art/ringworld-stability.md) the cells are walked
  // nearest first, and in each column of the page the highest land yet is kept (the occlusion horizon). Where a farther
  // cell rises above it from behind it (its own nearer part hidden), the land below was a ridge's crest: Ruby's bands are
  // kept there, where the land really drops away behind a crest (Ruby: "the bands kept to mark drops in elevation and
  // sharp borders"), and not at distances fixed to the eye. A thing at some depth is hidden by the land nearer than it
  const NCOL = Math.max(64, Math.min(1200, Math.round(ww))), CW = ww/NCOL, NC = NCOL;
  const col = X => Math.max(0, Math.min(NCOL - 1, Math.round(X/CW)));
  shown.sort((p, q) => p.dd - q.dd);
  const NBK = 40, bkD = [], lay = []; { const dA = Math.max(d0, shown.length ? shown[0].dd : d0); for(let b = 0; b < NBK; b++) bkD.push(b ? dA*Math.pow(reach/dA, b/(NBK - 1)) : 0); }
  const HY = new Float32Array(NCOL).fill(Infinity), HD = new Float32Array(NCOL), HQ = new Int32Array(NCOL).fill(-1), crests = Array.from({ length: NCOL }, () => []);
  { let b = 0; const tY = new Float32Array(NCOL), bY = new Float32Array(NCOL);
    for(let qi = 0; qi < shown.length; qi++){ const q = shown[qi];
      while(b < NBK && bkD[b] <= q.dd){ lay.push({ k: b, d: bkD[b], near: HY.slice() }); b++; }
      const P = q.P, c0 = Math.max(0, Math.ceil(q.box[0]/CW)), c1 = Math.min(NCOL - 1, Math.floor(q.box[1]/CW)); if(c1 < c0) continue;
      for(let c = c0; c <= c1; c++){ tY[c] = Infinity; bY[c] = -Infinity; }
      for(let k = 0; k < 4; k++){ const A = P[k], B = P[(k + 1) & 3], xa = Math.min(A[0], B[0]), xb = Math.max(A[0], B[0]);
        for(let c = Math.max(c0, Math.ceil(xa/CW)), ce = Math.min(c1, Math.floor(xb/CW)); c <= ce; c++){ const X = c*CW, t = xb > xa ? (X - A[0])/(B[0] - A[0]) : 0, Y = A[1] + (B[1] - A[1])*t; if(Y < tY[c]) tY[c] = Y; if(Y > bY[c]) bY[c] = Y; } }
      const tol = Math.max(px(1.5), 0.25*(q.box[3] - q.box[2]));
      for(let c = c0; c <= c1; c++){ const t = tY[c]; if(!(t < HY[c] - px(0.3))) continue;
        if(HY[c] < Infinity && bY[c] > HY[c] + tol) crests[c].push(HY[c], HD[c], HQ[c]);
        HY[c] = t; HD[c] = q.dd; HQ[c] = qi; } }
    while(b < NBK){ lay.push({ k: b, d: bkD[b], near: HY.slice() }); b++; }
    for(let c = 0; c < NCOL; c++) if(HY[c] < Infinity) crests[c].push(HY[c], HD[c], HQ[c]); }
  // (each crest's band as deep on the page as a ridge's lit face is at its distance, the near ones deeper)
  const bandOf = d => Math.max(px(3), Math.min(px(44), F*0.045*Math.sqrt(W*0.05/Math.max(d, W*0.002))));
  for(let c = 0; c < NCOL; c++){ const C = crests[c]; for(let k = 2; k < C.length; k += 3) if(C[k] >= 0) shown[C[k]].rim = true; }
  // (how far below its crest a point on the page lies, in its crest's band: 0 on the crest, 1 a band down)
  const bandAt = (X, Y) => { const C = crests[col(X)]; for(let k = 0; k < C.length; k += 3) if(C[k] <= Y + px(0.5)) return (Y - C[k])/bandOf(C[k + 1]); return 9; };
  // which bucket of depth a thing stands in (what it is drawn after, and what land nearer than it hides)
  const slot = dd => { let j = -1; for(let i = 0; i < lay.length; i++) if(lay[i].d <= dd) j = i; else break; return j; };
  // is a thing from X0 to X1, its top at Yt, hidden by the land nearer than it? (all its columns covered)
  const hidden = (l, X0, X1, Yt) => { if(X1 < 0 || X0 > ww) return true; const n = l ? l.near : null; if(!n) return false;
    for(let ci = col(Math.max(0, X0)), c1 = col(Math.min(ww, X1)); ci <= c1; ci++) if(!(n[ci] <= Yt)) return false; return true; };
  // WHAT NEARER THINGS HIDE: first every thing is measured, nearest first, and the solid heart of each (a crown's
  // middle, a building's lower body, a boulder's) is laid in its columns; a farther thing wholly inside what is laid
  // there, or below the nearer land, is never drawn. Then they are painted, farthest first (vis: measured, then told)
  const covT = new Float32Array(NC).fill(Infinity), covB = new Float32Array(NC).fill(-Infinity); let painting = false, cur = null;
  const vis = (l, X0, X1, Yt, Yb, oc) => { if(painting) return cur.ok;
    let ok = false; if(!(X1 < 0 || X0 > ww || Yb < 0 || Yt > wh)){ const n = l ? l.near : null;
      for(let ci = Math.max(0, col(Math.max(0, X0)) - 1), c1 = Math.min(NC - 1, col(Math.min(ww, X1)) + 1); ci <= c1; ci++) if(!((n && n[ci] <= Yt) || (covT[ci] <= Yt && covB[ci] >= Yb))){ ok = true; break; } }
    cur.ok = ok;
    if(ok && oc) for(let ci = col(Math.max(0, oc[0])), c1 = col(Math.min(ww, oc[1])); ci <= c1; ci++){
      if(covT[ci] === Infinity || (oc[2] <= covB[ci] && oc[3] >= covT[ci])){ covT[ci] = Math.min(covT[ci], oc[2]); covB[ci] = Math.max(covB[ci], oc[3]); }
      else if(oc[3] - oc[2] > covB[ci] - covT[ci]){ covT[ci] = oc[2]; covB[ci] = oc[3]; } }
    return false; };
  // (a thing stands where the mesh puts it, on the ground that is painted)
  const stand = (l, X, Y) => Y;

  // ---- 3. THE THINGS ----
  const things = []; // { dd, draw(l) }
  // CLOUD SHADOWS (Ruby: "more atmospheric effects"; docs/prior-art/ringworld-sky.md): each heap of cloud lays its shadow
  // on the land under it, cast away from the sun, lumpy, its edge fairly sharp (a cumulus's shadow is about a fifth of
  // full sun, about half the painted value, its edge some 50 m), so with the clock the shadows sweep the hills under the
  // clouds that make them; the land and everything standing on it darken there and turn a little blue (lit by the sky
  // alone), as much as the weather's clouds are thick, and only by day (cloudShadeAt: 0 in full sun)
  const shades = [], CSH = { clouds: 0.42, rain: 0.5, storm: 0.55, snow: 0.3 }[V.weather] || 0;
  const cloudShadeAt = (a, z) => { if(!shades.length) return 0; let v = 1; for(const h of shades){ const dx = a - h.a, dz = z - h.z, q = (dx*dx + dz*dz)/(h.r*h.r); if(q > 1.9) continue;
    const th = Math.atan2(dz, dx), rr = 1 + 0.16*Math.sin(3*th + h.ph) + 0.09*Math.sin(5*th + 2*h.ph); v *= 1 - h.k*rsSmooth(1.08, 0.8, Math.sqrt(q)/rr); } return CSH*(1 - v); };
  // (a thing is kept while any of it can be in view: its angle within the view's reach by as much as its own width)
  const keep = (a, z, w0 = 0) => { const r = Math.hypot(a, z - L.z0), ph = angOf(a, z), dd = r; if(dd <= 0) return null;
    if(Math.abs(ph) > PHI + Math.atan2(w0 + W*0.0005, Math.max(r, 1e-9))) return null; return dd; };
  // (a building takes its region's palette (rgPaletteOf): its materials mixed toward the family the seed chose there)
  const colsOf = (w, day, haze, o = null) => { const lights = o ? V.lightsAt(w, o.a, o.z) : V.lightsOf(w), g = lights[0], g2 = lights[1], pal = o ? rgPaletteOf(V, o, w) : null;
    const metal = w === 'ruins' ? [120, 108, 96] : w === 'neon' ? [44, 42, 60] : w === 'magic' ? rsMix([200, 196, 230], V.g1, 0.15) : [212, 216, 228];
    const lit = rgLit(V, rsMix(metal, [255, 246, 226], 0.15), day, haze, AIR), dark = rgLit(V, rsMix(metal, BLACK, 0.35), day, haze, AIR);
    // (and any material, wood, stone, rust or paint, lit by the same light: the kit's own colours, never all one grey)
    const mat = m0 => { const m = pal ? pal(m0) : m0; return { body: rgLit(V, m, day, haze, AIR), lit: rgLit(V, rsMix(m, [255, 246, 226], 0.28), day, haze, AIR), dark: rgLit(V, rsMix(m, BLACK, 0.42), day, haze, AIR) }; };
    return { body: rgLit(V, metal, day, haze, AIR), lit, dark, glow: rsMix(g, AIR, haze*0.4), glow2: rsMix(g2, AIR, haze*0.4), sd: sd > 0 ? 1 : -1, L: LT, air: AIR, haze, w, mat }; };
  // where a world point meets the screen, standing on its ground: [X, Y, px per metre, distance]
  // (a thing stands on the land as finely as the ridges about it show it, so it stands on the ground that is painted)
  const foot = (a, z) => { const e = Math.max(TR.sea, meshH(a, z)), p = at(a, z, e); if(!p) return null; return [p[0], p[1], W*0.00025*F/p[2], e]; };
  // (a thing's DETAIL is read from its size at its true distance from the eye, not its size drawn: the painter's
  //  perspective draws a thing larger toward the frame's edges, and a turn must never change what a thing shows; lodOf:
  //  that size over the drawn size, ≤ 1, handed to the kit as its colours' lod)
  const lodOf = (o, f) => Math.min(1, W*0.00025*F/Math.max(1e-9, Math.hypot((1 - f[3])*Math.cos(o.a) - L.Px, (1 - f[3])*Math.sin(o.a), o.z - L.z0))/f[2]);
  // THE WORLD STORE (Ruby: "handle it a little bit like a game engine: a very fast data structure holding all of the
  // positions, their size, sprite, etc, and then use that when you do the view transform"): every tree, building,
  // rock, tuft and find within sight of where you stand, in the world's own coordinates, made once for this world and
  // kept (`rgStore`); a view only reads it, transforms, culls and sorts. Turning the camera, tilting it, zooming,
  // lighting it: nothing in the store changes, so nothing moves but your view of it.
  // (the one loud nod a view may hold: the nearest in the world, chosen from the world, never from what is in view, so
  //  a turn never swaps one for another)
  const store = rgStore(V); let loudOne = null, loudR = Infinity;
  for(const o of store) if(o.c === 'egg' && PK_EGGS[o.kind] && PK_EGGS[o.kind].loud){ const r = Math.hypot(o.a, o.z - L.z0); if(r < loudR){ loudR = r; loudOne = o; } }
  const marginOf = o => o.c === 'bldg' ? Math.max(o.wM*1.7, o.hM)*W*0.00025 : o.c === 'board' || o.c === 'henge' ? o.wM*W*0.00025 : o.c === 'tree' || o.c === 'bot' || o.c === 'egg' ? o.hM*W*0.0005 : o.c === 'prop' ? o.hM*W*0.0012 : o.c === 'wild' ? (WK_FLYERS.includes(o.kind) ? 200 : 90)*W*0.00025 : W*0.0004;
  for(const o of store){ const dd = keep(o.a, o.z, marginOf(o)); if(dd != null) things.push({ dd, rad: o.c === 'bldg' ? o.wM*0.6*W*0.00025 : o.c === 'board' || o.c === 'henge' ? o.wM*0.5*W*0.00025 : 0, draw: l => rgPaintThing(o, l, dd) }); }
  // (Ruby: "don't clip objects until they are entirely out of frame": a thing near you is drawn however large it grows,
  //  until it is so large it would fill the frame from edge to edge, or wholly off it; vis() tests the frame itself)
  const nearCut = wh*3;
  // each thing painted from its record: where it stands, how big in metres, which sprite, its own stream
  // EIGHT VIEWS (Ruby: "front, sides, back, and the half-turned states … one more data value to determine facing angle"):
  // each thing faces a way of its own in the world (a house its street, a lamp the way, a board the traffic; the rest
  // by their own draw), and is drawn as seen from where the eye is: the angle between its facing and the way to the eye
  const viewOf = o => { const face = o.face ?? (o.rs % 62832)/10000, rel = face - Math.atan2(L.z0 - o.z, -o.a); return { cs: Math.cos(rel), sn: Math.sin(rel) }; };
  // (and how high the eye stands over a thing's foot, in pixels there: a thing turned is seen from above only so far
  //  as the eye is above it. Near, the camera's own eye: a factory beside you never shows you its roof. Far, the
  //  painter's, standing up to three times higher, the town over there seen a little from above as the painting likes)
  const seen = (o, f) => ({ ...viewOf(o), eyePx: (1 + 2*rsSmooth(40, 400, F/(f[2]*lodOf(o, f))))*((1 - f[3]) - L.Px)*f[2]/(W*0.00025) });
  const mirrored = (X, draw) => { x.save(); x.translate(X, 0); x.scale(-1, 1); x.translate(-X, 0); draw(); x.restore(); };
  // A SETTLEMENT'S LIGHTS (Ruby: "a settlement's lights at night"): a house too far off to draw is a window's light at
  // night, a street lamp a point on its string of them; they come on one by one through the dusk (each its own moment,
  // by its stream), warm or cold by its world's lights, the brightest with a little bloom
  // (with the clock: a light now and then going out for the night or coming on again, each half hour; a fire in the
  //  ruins and one light in sixteen flickering)
  // (in a film each comes on through the dusk, and goes out and on again, over a minute or so of the scene's time, never
  //  in one frame; and a flicker is a slow breath of the film's own clock, under half a second's rate, docs/prior-art/
  //  ringworld-motion-and-variety.md §4.7)
  const nightDot = (o, f, l, wday, haze, big = 1) => { const nt = 1 - rsSmooth(0.3, 0.7, wday), th = (o.rs % 997)/997, dk = nt*1.4 - 0.15; if(nt < 0.15 || dk < th) return;
    let on = V.time ? rsSmooth(th, th + 0.04, dk) : 1;
    if(V.time){ const u = V.time/1800 + (o.rs % 97)/97, k = Math.floor(u), out = j => mnHash(o.rs & 4095, j, s + 840) < 0.15 ? 1 : 0, o1 = out(k), o0 = out(k - 1);
      on *= 1 - (o1 + (o0 - o1)*(1 - rsSmooth(0, 60/1800, u - k))); if(on <= 0.004) return; }
    const fl = on*(V.time && (o.w === 'ruins' || (o.rs & 15) === 5) ? 0.75 + 0.25*Math.sin(FT*Math.PI*2*(0.2 + (o.rs & 7)*0.035) + (o.rs & 255)) : 1);
    const X = f[0], Y = stand(l, X, f[1]) - px(0.6)*big; if(!vis(l, X - px(1), X + px(1), Y - px(2), Y + px(1))) return;
    const lights = V.lightsAt(o.w, o.a, o.z), col = rsMix(o.rs & 2 ? lights[0] : lights[1] || lights[0], AIR, haze*0.5), r = px(0.55 + 0.5*((o.rs >> 3) % 3)/2)*big;
    x.fillStyle = rsCss(rsMix(col, [255, 255, 255], 0.35), Math.min(1, nt*1.3)*fl); x.fillRect(X - r, Y - r, r*2, r*2);
    if((o.rs & 12) === 12) rgGlow(x, X, Y, r*5, col, 0.35*nt*on); };
  // WHAT MOVES (Ruby: "robots moving, minor animations"; "longer, smoother paths"; then, 2026-10-22: "humans don't
  // move? … some objects still move in circles"): each mover keeps a timetable of its own, as townsfolk do in games
  // (docs/prior-art/ringworld-life-and-views.md §1, §2, §7): stops drawn one by one round its home, each independent of
  // the last, so its path never closes into a loop and nothing need be remembered from frame to frame; it walks from
  // one stop to the next at its own pace, setting off and arriving gently, faces the way it walks, and waits at the
  // stop until that leg's time is up. [metres it ranges along its way, across it, its pace in metres a second] by kind:
  // a person along the street or lane it is beside, a drone in quick straight legs between hovers, a harvester and a
  // lamplighter along their rows and rounds (the wild things and the grazing sheep go by wildKit's clock instead)
  const MT = rgMotionTime(V), ST = rgSwayTime(V), FT = rgFilmTime(V), DSUN = [V.sun.screen[0], -V.sun.screen[1], -(V.sun.D[0]*L.fx + V.sun.D[1]*L.fy + V.sun.D[2]*L.fz)];
  const RG_MOVES = { helper: [14, 14, 1.0], drone: [12, 12, 4], crawler: [8, 8, 0.4], walker: [24, 24, 1.5], harvester: [40, 5, 1.6], shepherd: [16, 16, 1.0], crab: [5, 5, 0.3],
    lamplighter: [16, 3, 1.0], figure: [18, 1.5, 1.25] };
  // (a walker with a door, at its going-in: from wherever its round has it, along the way to its door, in at the door; and
  //  out again at its dawn. Where along it, by how far the dusk has come where it stands, so nothing need be remembered)
  const toDoor = (o, p) => { const q = ((o.rs >>> 10) % 1000)/1000; if(!o.door || q < 0.1) return p;
    const out = 0.08 + 0.92*rsSmooth(0.15, 0.65, ringDay(L, o.a)), k = rsSmooth(q + 0.14, q + 0.03, out); if(k <= 0) return p;
    const da = o.door.a - p.a, dz = o.door.z - p.z; return { ...p, a: p.a + da*k, z: p.z + dz*k, ...(k < 1 && Math.hypot(da, dz) > W*0.0001 ? { face: Math.atan2(dz, da), walking: 1 } : { walking: 0 }) }; };
  // (a sheep grazes on a drift of its own, a few metres this way and that, never round a loop)
  const grazed = (o, mt) => { const w = wkWander(o.rs, mt, 50), w2 = wkWander(o.rs, mt + 2, 50), M1 = W*0.00025, A = 5, v = Math.hypot(w2[0] - w[0], w2[1] - w[1])*A/2;
    return { ...o, a: o.a + w[0]*A*M1, z: o.z + w[1]*A*M1, face: v > 0.004 ? Math.atan2(w2[1] - w[1], w2[0] - w[0]) : o.face, walking: Math.min(1, v/0.25) }; };
  const moved = (o, mt = MT) => o.kind === 'sheep' ? (V.time ? grazed(o, mt) : o) : o.door ? toDoor(o, movedRound(o, mt)) : movedRound(o, mt);
  const movedRound = (o, mt) => { const mv = V.time && RG_MOVES[o.kind]; if(!mv) return o; const M1 = W*0.00025, R = mulberry32(o.rs ^ 0x6d6f7665), ax = o.walk ?? o.face ?? (o.rs % 62832)/10000;
    const ca = Math.cos(ax), sa = Math.sin(ax), pace = mv[2]*(0.8 + 0.35*R()), T = 2*Math.hypot(mv[0], mv[1])/pace/0.95 + 2 + 8*R(), t = mt + R()*T*40;
    // (a person, a harvester and a lamplighter go up and down their street, row or round, each stop at its own distance
    //  toward one end or the other, so they are mostly on their way; the rest stop anywhere round home)
    const alt = o.kind === 'figure' || o.kind === 'harvester' || o.kind === 'lamplighter';
    const stop = j => { const Q = mulberry32((o.rs ^ Math.imul(j + 7, 0x9E3779B1)) >>> 0), q = Q(); return [alt ? ((j & 1) ? 1 : -1)*(0.35 + 0.65*q)*mv[0] : (q*2 - 1)*mv[0], (Q()*2 - 1)*mv[1]]; };
    const k = Math.floor(t/T), [u0, w0] = stop(k), [u1, w1] = stop(k + 1), du = u1 - u0, dw = w1 - w0, go = Math.hypot(du, dw)/pace, s = go > 0 ? Math.min(1, (t - k*T)/go) : 1, e = s*s*(3 - 2*s);
    const u = u0 + du*e, w = w0 + dw*e;
    return { ...o, a: o.a + (ca*u - sa*w)*M1, z: o.z + (sa*u + ca*w)*M1, face: Math.atan2(sa*du + ca*dw, ca*du - sa*dw), walking: s < 1 ? Math.min(1, 6*s*(1 - s)) : 0 }; };
  const smokeWind = (([wa, ws]) => Math.cos(wa)*Math.min(1, ws/9))(rgWind(V)); // (chimney smoke leans with the ring's wind)
  // (and leans the way the wind runs across the page where it rises, so turning the camera turns its lean: the wind's
  //  way at the thing's foot, a step along it, as seen; straight up where the wind blows toward or away from the eye)
  const [SWA, SWS] = rgWind(V), smokeAt = (o, f) => { const d = 1e-4, b = at(o.a + d*Math.cos(SWA), o.z + d*Math.sin(SWA), f[3] || 0); if(!b) return smokeWind;
    const dx = b[0] - f[0], l = Math.hypot(dx, b[1] - f[1]); return l > 1e-12 ? dx/l*Math.min(1, SWS/9) : smokeWind; };
  // (a thing that moves farther in one of a film's frames than its own size (a time-lapse's drone, or a walker near the
  //  eye) is seen as a long exposure sees it: faint while it goes, whole where it stops, so it never flicks from place to
  //  place, there one frame and gone the next)
  // THE WILD THINGS painted (wildKit.js): each member where its clock has it, on the ground or up in the air over it,
  // facing the way it goes as the eye sees it; a group comes and goes with its hours and weather, one group at a time
  // (bats at dusk, the day's birds to roost, swallows down and raptors grounded in rain); in a time-lapse a member that
  // crosses more than its size in a frame is drawn faint, as a long exposure sees it
  // (drawn half again their size, as a painter does the creatures in a landscape so that they are found at all)
  const RG_WILD_LICENCE = 1.5, rgWildHere = (o, night) => { const k = o.kind, q = ((o.rs >>> 8) % 1000)/1000, wet = /rain|storm/.test(V.weather), cold = /snow/.test(V.weather);
    const av = k === 'bats' ? (cold ? 0 : rsSmooth(0.2, 0.5, night)) : ['swallows', 'swifts', 'butterflies', 'dragonflies', 'raptor'].includes(k) ? (1 - rsSmooth(0.25, 0.6, night))*(cold ? 0 : wet ? (k === 'swallows' ? 0.7 : 0) : 1)
      : ['rooks', 'pigeons', 'starlings', 'sparrows'].includes(k) ? (1 - rsSmooth(0.35, 0.7, night))*(V.weather === 'storm' ? 0.3 : 1) : k === 'fox' ? 0.35 + 0.65*rsSmooth(0.15, 0.45, night) : 1;
    return av >= 1 ? 1 : av <= 0 ? 0 : rsSmooth(q - 0.04, q + 0.04, av); };
  const rgPaintWild = (o, l, dd) => { const K = WK_KINDS[o.kind], wday = ringDay(L, o.a), night = 1 - rsSmooth(0.3, 0.7, wday), pres = rgWildHere(o, night); if(pres < 0.02) return;
    const haze = hazeOf(dd), cday = wday*(1 - cloudShadeAt(o.a, o.z)*rsSmooth(0.3, 0.7, wday))*(0.5 + 0.5*litAt(o.a, o.z, meshH(o.a, o.z) + 0.8*M1s)), n = wkCount(o.kind, o.rs), t = V.time ? MT : 0, step = V.frame !== null && V.time ? Math.min(2.5, rgStep(V)) : 0;
    const env = { wind: rgWind(V) }, M1 = W*0.00025, fly = WK_FLYERS.includes(o.kind), c = { ...colsOf(o.w, cday, haze), flowers: [V.g1, V.g2, [244, 238, 228]].map(g => rgLit(V, g, Math.max(0.4, wday), haze, AIR)) }, out2 = [];
    for(let j = 0; j < n; j++){ const st = wkAt(o.kind, o.rs, j, t, env); if(!st.on) continue;
      const a = o.a + st.x*M1, z = o.z + st.z*M1, f = foot(a, z); if(!f) continue; const m = f[2], sz = K.size*m*RG_WILD_LICENCE;
      if((sz < px(0.7) && !fly) || sz > wh*0.5 || (f[3] <= TR.sea && !o.afloat && !st.y)) continue;
      const X = f[0], Y = fly || st.y ? f[1] : stand(l, X, f[1]), yy = Y - st.y*m; if(!vis(l, X - sz, X + sz, yy - sz, yy + sz*0.3)) continue;
      // (its heading a step along, seen: which way it faces on the page, and how side-on)
      const g2 = foot(a + Math.cos(st.face)*M1*3, z + Math.sin(st.face)*M1*3), side = Math.abs(Math.sin(st.face - Math.atan2(L.z0 - z, -a)));
      let al = pres*st.on; if(step > 0.2){ const p = wkAt(o.kind, o.rs, j, t - step, env), fp = p.on ? foot(o.a + p.x*M1, o.z + p.z*M1) : null;
        if(fp) al *= rsSmooth(Math.max(px(2), sz)*2.5, Math.max(px(2), sz)*0.9, Math.hypot(fp[0] - X, fp[1] - p.y*fp[2] - yy)); }
      if(al < 0.03) continue;
      out2.push([m, () => { x.globalAlpha = al; wkPaint(x, X, Y, m*RG_WILD_LICENCE, o.kind, { ...st, y: st.y/RG_WILD_LICENCE, dir: !g2 || g2[0] >= X ? 1 : -1, side, stag: j === 0 && (o.rs & 4), hue: j }, c, rgPx); x.globalAlpha = 1; }]); }
    out2.sort((p, q) => p[0] - q[0]); for(const [, d] of out2) d(); };
  const rgPaintThing = (o0, l, dd) => { const o = moved(o0);
    // (a building standing near the eye is drawn faint as it grows to fill the frame, gone before it could block it)
    if(o0.near){ const f1 = foot(o0.a, o0.z); if(!f1) return; const nf = rsSmooth(ww*0.8, ww*0.45, o0.wM*f1[2]*1.6)*rsSmooth(wh*1.05, wh*0.65, o0.hM*f1[2]); if(nf < 0.03) return;
      if(nf < 0.97){ x.save(); x.globalAlpha = nf; rgPaintThing0(o0, l, dd, o0); x.restore(); return; } }
    if(V.frame === null || o === o0) return rgPaintThing0(o, l, dd, o0);
    const p = moved(o0, MT - Math.min(2.5, rgStep(V))), f1 = foot(o.a, o.z), f0 = foot(p.a, p.z); if(!f1 || !f0) return rgPaintThing0(o, l, dd, o0);
    const sz = Math.max(px(2), (o.hM || 1.7)*f1[2]), gh = rsSmooth(sz*2.5, sz*0.9, Math.hypot(f1[0] - f0[0], f1[1] - f0[1]));
    if(gh >= 0.97) return rgPaintThing0(o, l, dd, o0); if(gh < 0.03) return; x.save(); x.globalAlpha = gh; rgPaintThing0(o, l, dd, o0); x.restore(); };
  const rgPaintThing0 = (o, l, dd, o0) => { if(o.c === 'wild') return rgPaintWild(o, l, dd);
    const f = foot(o.a, o.z); if(!f || (f[3] <= TR.sea && !o.afloat)) return;
    const wday = ringDay(L, o.a), haze = hazeOf(dd), R = mulberry32(o.rs), cday = wday*(1 - cloudShadeAt(o.a, o.z)*rsSmooth(0.3, 0.7, wday))*(0.5 + 0.5*litAt(o.a, o.z, meshH(o.a, o.z) + Math.min(6, (o.hM || 2)*0.5)*M1s));   // (its colours by the sun that reaches it, under a cloud's shadow or not; its nights by the hour)
    if(o.c === 'tree'){ const h = o.hM*f[2], lo = lodOf(o, f), hl = h*lo; if(hl < px(1) || h > nearCut) return;   // (Ruby: "trees … culled too early": kept down to a speck)
      // (its solid heart, what hides a farther thing behind it, kept inside its drawn shape: a narrow conifer's narrow)
      const hw = RG_NARROW_TREES.includes(o.kind) ? 0.045 : 0.13, X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*0.3, X + h*0.3, Y - h, Y, o.kind === 'dead' || o.kind === 'willow' || hl < px(4) ? null : [X - h*hw, X + h*hw, Y - h*0.8, Y - h*0.4])) return;
      // (and the smallest fade in as they grow, never popping on at the size they are first drawn)
      const fadeIn = rgClamp((hl - px(1))/px(0.9)); if(fadeIn < 1) x.globalAlpha = fadeIn;
      const green = o.kind === 'olive' ? [118, 134, 106] : rsMix(o.w === 'ruins' ? [80, 70, 54] : [36, 82, 50], V.land, 0.35), c = colsOf(o.w, cday, haze);
      const tc = { lod: lo, trunk: rgLit(V, [70, 52, 40], cday, haze, AIR), dark: rgLit(V, rsMix(green, BLACK, 0.18), cday, haze, AIR), body: rgLit(V, green, cday, haze, AIR),
        lit: rgLit(V, rsMix(green, [255, 244, 222], 0.3), cday, haze, AIR), glow: c.glow, sd: c.sd, L: LT, fruit: o.fruit ? rgLit(V, (o.rs & 2) ? [196, 58, 40] : [126, 52, 92], cday, haze, AIR) : null,
        // (the sun behind it, low: the light through its leaves; less as it hazes into the distance)
        back: V.sun.back*rsSmooth(0.35, 0.7, cday)*(1 - haze), sun: rgLit(V, [255, 236, 196], cday, haze, AIR) };
      // (a tree has no front: half of them are drawn mirrored, their light kept where it is)
      if(o.rs & 1) mirrored(X, () => pkTree(x, X, Y, h, pkFlip(tc), o.kind, R, rgPx)); else pkTree(x, X, Y, h, tc, o.kind, R, rgPx); x.globalAlpha = 1; return; }
    if(o.c === 'bldg'){ const h = o.hM*f[2], wd = o.wM*f[2], lo = lodOf(o, f), hl = h*lo; if(hl < px(1.2)){ nightDot(o, f, l, wday, haze, hl > px(0.5) ? 1.3 : 1); return; } if(h > nearCut) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - wd*1.7, X + wd*1.7, Y - h*1.4, Y, o.kind === 'arch' || o.kind === 'needle' || o.kind === 'pylon' ? null : [X - wd*0.4, X + wd*0.4, Y - h*0.3, Y])) return;
      // (on a slope, level: its floor at its uphill corner's ground, on a stone plinth down to the ground at its lowest
      //  corner and a little into it, so no corner of it hangs in the air)
      const fall = (o.up || 0) + (o.down || 0), pl = fall > 0.25 ? (fall + 0.3)*f[2] : 0, onPl = pl > px(0.6) && !RG_LIGHTFOOT.includes(o.kind);
      const cb = colsOf(o.w, cday, haze, o), night = 1 - rsSmooth(0.3, 0.7, wday); pkBuilding(x, X, onPl ? Y - (o.up || 0)*f[2] : Y + h*0.03, h, wd, { ...cb, lod: lo, view: seen(o, f), mpx: f[2], t: V.time, mt: MT, smt: ST, ft: FT, windX: smokeAt(o, f), plinth: onPl ? pl : 0 }, PK_STYLE[o.w], night, R, rgPx, o.kind);
      // CLOSE BY, its foot (the building's base detailed, Ruby: "close-up versions with details for their base"): a door
      // two metres tall with its step, a lamp beside it lit at night, a planter
      const m = f[2]; if(m*lo*2.1 > px(10) && o.kind !== 'arch' && o.kind !== 'needle' && o.kind !== 'pylon' && o.kind !== 'torii' && o.kind !== 'turbine'){
        const Rb = mulberry32(o.rs ^ 0x5eed), dx = X + (Rb() - 0.5)*wd*0.5, dw = 1.0*m, dh = 2.1*m;
        x.fillStyle = rsCss(rsMix(cb.dark, BLACK, 0.35)); x.fillRect(dx - dw/2, Y - dh, dw, dh);
        if(night > 0.2){ x.fillStyle = rsCss(cb.glow, 0.5*night); x.fillRect(dx - dw/2 + dw*0.15, Y - dh*0.9, dw*0.7, dh*0.35); }
        x.fillStyle = rsCss(cb.lit); x.fillRect(dx - dw*0.75, Y - m*0.15, dw*1.5, m*0.15);
        pkProp(x, dx + dw*1.3, Y, 3.2*m, cb, 'lamp', mulberry32(o.rs ^ 0x1a3b), rgPx, night);
        if(Rb() < 0.6){ x.fillStyle = rsCss(cb.dark); x.fillRect(dx - dw*1.9, Y - m*0.5, dw*0.7, m*0.5); for(let q = 0; q < 3; q++){ x.fillStyle = rsCss(rgLit(V, [60, 110, 60], cday, haze, AIR)); x.beginPath(); x.arc(dx - dw*1.55 + (q - 1)*dw*0.2, Y - m*0.6, m*0.22, 0, Math.PI*2); x.fill(); } } }
      return; }
    if(o.c === 'rock'){ const rr = o.hM*f[2]; if(rr*lodOf(o, f) < px(2) || rr > nearCut) return;
      const X = f[0], Y = stand(l, X, f[1]) + rr*Math.min(0.32, slopeAt(o.a, o.z)*0.45); if(!vis(l, X - rr, X + rr, Y - rr, Y, [X - rr*0.5, X + rr*0.5, Y - rr*0.4, Y])) return;
      const st = rgStoneOf(V, o.a, o.z, f[3]); pkRock(x, X, Y, rr, rgLit(V, rsMix(PK_STONES[st], V.land, 0.08), cday, haze, AIR), LT, R, rgPx, st); return; }
    if(o.c === 'grass'){ const gH = o.hM*f[2]; if(gH < px(2.5) || gH > wh*0.4) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - gH, X + gH, Y - gH*1.4, Y)) return;
      const gc2 = rgLit(V, rsMix([40, 88, 54], V.land, 0.45), cday, haze, AIR), gl = rsMix(gc2, [255, 244, 222], 0.2), flw = [V.g1, V.g2, [250, 246, 240]], rnd = (p, q) => p + (q - p)*R();
      // (with the clock the tufts sway: gusts travelling over the field, each blade's top leaning and coming back)
      const sway = V.time ? gH*(0.16*Math.sin(ST*1.7 - o.a/(W*0.002) + (o.rs & 7)) + 0.08*Math.sin(ST*2.3 + (o.rs & 31))) : 0;
      for(let b = -2; b <= 2; b++) rsPoly(x, [[X + b*gH*0.25, Y], [X + b*gH*0.5 + (R() - 0.5)*gH*0.4 + sway*(1 + 0.15*b), Y - gH*rnd(0.7, 1.4)], [X + b*gH*0.25 + gH*0.15, Y]], rsCss(b*LT[0] > 0 ? gl : gc2));
      if(R() < 0.25*RG_PROF[o.w].gr){ const fc = rsMix(flw[Math.floor(R()*3)], [0, 0, 0], 0.1); x.fillStyle = rsCss(fc); x.beginPath(); x.arc(X, Y - gH*1.1, Math.max(rgPx(0.8), gH*0.18), 0, Math.PI*2); x.fill(); if(o.w === 'magic') rgGlow(x, X, Y - gH*1.1, gH*0.8, fc, 0.6); }
      return; }
    if(o.c === 'egg'){ const h = o.hM*f[2], E = PK_EGGS[o.kind]; if(h*lodOf(o, f) < px(o.kind === 'caps' ? 1.2 : 3) || h > nearCut) return;
      if(E.loud && o0 !== loudOne) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*2, X + h*2, Y - h*(o.kind === 'warden' ? 4.2 : o.kind === 'spire' ? 1.1 : 1.8), Y)) return;
      const c = colsOf(o.w, cday, haze), vw = viewOf(o); if(vw.sn < 0 && o.kind !== 'diner') mirrored(X, () => pkEgg(x, X, Y + h*0.02, h, pkFlip(c), o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday))); else pkEgg(x, X, Y + h*0.02, h, c, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
    if(o.c === 'henge'){ if(f[2]*o.hm < px(2)) return; const c = colsOf(o.w, cday, haze); rgHenge(x, o, (a, z) => { const q = foot(a, z); return q && [q[0], stand(l, q[0], q[1]), q[2], Math.hypot(a, z - L.z0)]; }, c, R, rgPx); return; }
    if(o.c === 'board'){ const m = f[2], h = o.hM*m, bw = o.wM*m; if(h*lodOf(o, f) < px(3) || h > nearCut) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - bw/2, X + bw/2, Y - h, Y)) return;
      pkBoard(x, X, Y, m, { ...colsOf(o.w, cday, haze), view: viewOf(o) }, o.kind === 'serial' ? { serial: PK_SERIALS[o.v], k: o.k } : o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday), o.aged); return; }
    if(o.c === 'glim'){ nightDot(o, f, l, wday, haze, o.big); return; }
    if(o.c === 'prop'){ const h = o.hM*f[2], hl = h*lodOf(o, f); if(hl < px(3)){ if(o.kind === 'lamp') nightDot(o, f, l, wday, haze, 0.8); return; } if(h > (RG_WIDE.includes(o.kind) ? wh*0.6 : nearCut)) return;   // (shown by its size at its true distance, so a turn never shows or hides it; too large for the frame by its size drawn)
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h*2, X + h*2, Y - h*1.1, Y)) return;
      // (Ruby: "nearby lights lighting what is near them more": by night a street lamp lays its pool of light on the ground
      //  round its foot, an ellipse as the ground lies seen from here, warm or cold by its world's lights, eased on with
      //  the dusk as the lamp itself is)
      if(o.kind === 'lamp'){ const nt = 1 - rsSmooth(0.3, 0.7, wday); if(nt > 0.05){ const Rm = 7*W*0.00025, e0 = f[3], pA = at(o.a - Rm*hx, o.z - Rm*hz, e0), pB = at(o.a + Rm*hx, o.z + Rm*hz, e0), pC = at(o.a + Rm*hz, o.z - Rm*hx, e0);
        if(pA && pB && pC){ const rx = Math.max(px(2), Math.abs(pC[0] - X)*1.1), ry = Math.max(px(1), Math.abs(pA[1] - pB[1])*0.55), lc = V.lightsAt(o.w, o.a, o.z)[(o.rs & 2) ? 0 : 1] || V.lightsAt(o.w, o.a, o.z)[0];
          x.save(); x.globalCompositeOperation = 'screen'; x.translate(X, Y); x.scale(1, ry/rx); const g = x.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rsCss(lc, 0.34*nt*(1 - haze))); g.addColorStop(0.55, rsCss(lc, 0.12*nt*(1 - haze))); g.addColorStop(1, rsCss(lc, 0));
          x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI*2); x.fill(); x.restore(); } } }
      // (set into the ground a little, always; the ruins' wrecks and bikes half buried, clipped where the ground meets them)
      // (a dish turned to where the array listens now, its own moment late: rgDishAim)
      // (and lit, piece by piece, from where the sun is: its way across the screen, up it, and toward the eye)
      const aim = o.kind === 'dish' ? rgDishAim(s, V.time > 0 ? FT : 0, ((o.rs >>> 5) % 1000)/1000*0.9) : null;
      const c = colsOf(o.w, cday, haze), sink = h*(0.025 + (o.sink || 0) + Math.min(0.12, slopeAt(o.a, o.z)*0.15)), cc = { ...c, noWires: !!o.next, view: o.kind === 'pole' ? null : seen(aim ? { ...o, face: aim[0] } : o, f), ...(aim ? { dishEl: aim[1], sun3: DSUN } : {}) };
      // PEOPLE BY THE HOUR (Ruby: "humans … should mostly try to go inside at night"; docs/prior-art/ringworld-life-and-
      // views.md §1, §7): by day nearly everyone is out, by night about one in twelve (§1's counts: from 23:00 to 05:00 some
      // 8% of noon's), the night watch with a lantern and a late walker; each goes in at its own point of the dusk and out
      // at its own of the dawn, fading over many frames of a time-lapse; a neon city keeps its people out at all hours.
      // Walking, a stride on the gentle clock
      if(o.kind === 'figure'){ const nt = 1 - rsSmooth(0.3, 0.7, wday), q = ((o.rs >>> 10) % 1000)/1000, out = o.w === 'neon' ? 0.75 : 0.08 + 0.92*rsSmooth(0.15, 0.65, wday), al = o.door && q >= 0.1 ? rsSmooth(q - 0.02, q + 0.03, out) : rsSmooth(q - 0.1, q + 0.04, out);
        if(al < 0.02) return; const fc = { ...cc, stride: o.walking ? Math.sin(ST*5.5 + (o.rs & 63))*o.walking : 0, lantern: nt > 0.25 && q < 0.12 ? nt : 0 };
        if(al > 0.98){ pkProp(x, X, Y + sink, h, fc, 'figure', R, rgPx, nt); return; }
        // (fading: drawn whole on its own sheet and laid down see-through, so its coat never shows its legs through it)
        const bw = Math.ceil(h*1.8), bh = Math.ceil(h*1.5), [fcv, fx] = kitCanvas(bw, bh); pkProp(fx, bw/2, h*1.3, h, fc, 'figure', R, rgPx, nt);
        const ga = x.globalAlpha; x.globalAlpha = ga*al; x.drawImage(fcv, X - bw/2, Y + sink - h*1.3); x.globalAlpha = ga; return; }
      // (a piece of a run: as wide on the page as its own length is from here, its two ends projected, a little more so
      //  the pieces meet; never turned or mirrored, as the run itself carries the turn)
      if(o.piece){ const ca = Math.cos(o.axis), sa = Math.sin(o.axis), hp = o.piece*0.5*W*0.00025, e0 = foot(o.a - ca*hp, o.z - sa*hp), e1 = foot(o.a + ca*hp, o.z + sa*hp); if(!e0 || !e1) return;
        const pw = Math.abs(e1[0] - e0[0]) + h*0.25; if(h > wh*0.3 || pw > ww*0.45) return;   // (a piece right at your feet is let go, as a whole one was)
        pkProp(x, (e0[0] + e1[0])/2, Y + sink, h, { ...cc, view: null, runW: pw }, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
      if(o.sink){ x.save(); x.beginPath(); x.rect(X - h*6, Y - h*6, h*12, h*6 + h*0.02); x.clip(); pkProp(x, X, Y + sink, h, cc, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); x.restore(); }
      else pkProp(x, X, Y + sink, h, cc, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday));
      // (a road's pole wired to the next one along, the wires sagging between)
      if(o.next){ const f2 = foot(o.next[0], o.next[1]); if(f2) pkWires(x, [X, Y - h*0.95], [f2[0], f2[1] - o.hM*f2[2]*0.95], h, c, rgPx); } return; }
    if(o.c === 'bot'){ const h = o.hM*f[2]; if(h*lodOf(o, f) < px(3) || h > nearCut) return;
      const X = f[0], Y = stand(l, X, f[1]); if(!vis(l, X - h, X + h, Y - h*(o.kind === 'drone' ? 3.4 : 1.1), Y)) return;
      const c = { ...colsOf(o.w, cday, haze) }; c.eye = c.glow; const nt = 1 - rsSmooth(0.3, 0.7, wday);
      if(o.kind === 'lamplighter' && !(nt > 0.12 && nt < 0.8)) return;   // (out only about dusk, on its round)
      if(PK_BOTS3.includes(o.kind)){ pkRobot(x, X, Y + h*0.02, h, { ...c, view: seen(o, f) }, o.kind, R, rgPx, nt); return; }
      const bob = V.time && o.kind === 'drone' ? Math.sin(ST*1.3 + (o.rs & 63))*h*0.12 : 0;   // (a drone hovering, rising and dipping a little)
      if(viewOf(o).sn < 0) mirrored(X, () => pkRobot(x, X, Y + h*0.02 + bob, h, pkFlip(c), o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday))); else pkRobot(x, X, Y + h*0.02 + bob, h, c, o.kind, R, rgPx, 1 - rsSmooth(0.3, 0.7, wday)); return; }
    // small life: found rather than seen
    const hh = 2.8*f[2]; if(hh < px(3) || hh > wh*0.6) return;
    const X = f[0], Y = stand(l, X, f[1]); if(Y > wh + hh*0.2 || !vis(l, X - hh*4, X + hh*4, Y - hh*(o.kind === 'kite' ? 5 : 1.4), Y)) return;
    const glow = colsOf(o.w, cday, haze).glow;
    const lc = { night: 1 - rsSmooth(0.3, 0.7, wday), dark: rgLit(V, [34, 30, 28], cday, haze, AIR), lit: rgLit(V, [236, 240, 246], cday, haze, AIR), glow,
      flowers: [V.g1, V.g2, [244, 238, 228]].map(g => rgLit(V, rsMix(g, [0, 0, 0], 0.1), Math.max(0.4, wday), haze, AIR)),
      slime: rgLit(V, rsMix(V.g2, [120, 200, 150], 0.45), Math.max(0.4, wday), haze, AIR), weather: V.weather, wind: rgWind(V), seed: o.rs };
    rgSmallLife(x, X, Y, hh*(0.8 + 0.4*R()), o.kind, lc, R, ST);
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
    const e = Math.max(TR.sea, meshH(o.a, o.z)), b = at(o.a, o.z, e); if(!b) return;
    const k = F/b[2], day = ringDay(L, o.a), big = { sp: 0.02 + 0.08*o.h, mo: 0.006 + 0.02*o.h, do: 0.006 + 0.016*o.h, to: 0.02 + 0.07*o.h, wr: 0.006 + 0.02*o.h, cr: 0.012 }[o.kind]; if(big && W*big/o.d > 0.4) return;
    const X = b[0], Y = o.kind === 'sh' || o.kind === 'sa' || o.kind === 'br' ? b[1] : stand(l, b[0], b[1]);
    if(big && hidden(l, X - W*big*k*0.3, X + W*big*k*0.3, Y - W*big*k)) return;
    const night = 1 - rsSmooth(0.3, 0.7, day), haze = hazeOf(o.d), c = colsOf(o.w, day, haze);
    rgWork(x, o, X, Y, k, c, night, o.R, V, e);
  };
  // THE WAYS on the floor (the store's, walked across the land), each run drawn just after the land under it, so the
  // hills nearer hide it; near you a piece is cut finer, so the way lies on the ground between its points, not across the air
  const wayPieces = store.ways.map(wy => { const out2 = [];
    for(let i = 0; i + 1 < wy.pts.length; i++){ const p = wy.pts[i], q = wy.pts[i + 1], len = Math.hypot(q.a - p.a, q.z - p.z) || 1e-9, nx = -(q.z - p.z)/len, nz = (q.a - p.a)/len;
      const dist = Math.hypot((p.a + q.a)/2, (p.z + q.z)/2 - L.z0), n = Math.max(1, Math.min(8, Math.ceil(len/Math.max(W*0.0005, dist*0.06))));
      for(let k = 0; k < n; k++){ const t0 = k/n, t1 = (k + 1)/n, P0 = { a: p.a + (q.a - p.a)*t0, z: p.z + (q.z - p.z)*t0, dec: p.dec + (q.dec - p.dec)*t0, u: p.u + (q.u - p.u)*t0, e: p.e === undefined ? undefined : p.e + (q.e - p.e)*t0 }, P1 = { a: p.a + (q.a - p.a)*t1, z: p.z + (q.z - p.z)*t1, dec: p.dec + (q.dec - p.dec)*t1, u: p.u + (q.u - p.u)*t1, e: p.e === undefined ? undefined : p.e + (q.e - p.e)*t1 };
        out2.push({ p: P0, q: P1, nx, nz, dd: Math.min(cutOf(P0.a, P0.z), cutOf(P1.a, P1.z)) - wy.half }); } }
    return out2; });
  const collectWays = (dn, df) => { const out = []; store.ways.forEach((wy, wi) => { let run = [], decs = [], keys = [], dmin = Infinity, gnd = [], pyl = [], lastU = null;
    const flush = () => { if(run.length >= 2){ run.gnd = gnd; run.pyl = pyl; out.push({ wy, run, decs, keys, dd: dmin }); } run = []; decs = []; keys = []; dmin = Infinity; gnd = []; pyl = []; lastU = null; };
    for(const pc of wayPieces[wi]){ if(!(pc.dd > dn && pc.dd <= df) || pc.p.dec > 0.8){ flush(); continue; } dmin = Math.min(dmin, pc.dd);
      for(const P of run.length ? [pc.q] : [pc.p, pc.q]){ const e = P.e !== undefined ? exH(P.e, cutOf(P.a, P.z)) : wy.deck ?? Math.max(TR.sea, meshH(P.a, P.z)) + W*0.00003;
        if(wy.high){ gnd.push(at(P.a, P.z, Math.max(TR.sea, meshH(P.a, P.z)))); const k2 = Math.floor(P.u/(42*W*0.00025)); pyl.push(lastU !== null && k2 !== lastU); lastU = k2; } const A = at(P.a - pc.nx*wy.half, P.z - pc.nz*wy.half, e), B = at(P.a + pc.nx*wy.half, P.z + pc.nz*wy.half, e);
        if(!A || !B){ if(wy.high){ gnd.pop(); pyl.pop(); } flush(); continue; } run.push([A, B]); decs.push(P.dec); keys.push(Math.imul(Math.round(P.a/W*20000), 73856093) ^ Math.imul(Math.round(P.z/W*20000), 19349663)); } }
    flush(); }); return out; };
  // A WAY'S PIECE PAINTED in its material: asphalt (a centre line on the main roads), cobbles, brick laid across,
  // gravel, packed earth with its two ruts, flagstones, stepping stones in moss, the builders' pale paths and paths of
  // light, a ley line's glow; worn where it is worn (cracks, potholes, weeds at its edges), and broken through where most
  const paintWay = (wy, run, decs, keys) => { const L2 = run.map(q => q[0]), R2 = run.map(q => q[1]);
    const mid = L2[L2.length >> 1], day = ringDay(L, 0), haze = hazeOf(mid[2]), c = colsOf(wy.w, day, haze), poly = [...L2, ...R2.slice().reverse()], lit = col => rgLit(V, col, day, haze, AIR);
    const line = (pts, cl, wdt, dash) => { x.strokeStyle = cl; x.lineWidth = wdt; if(dash && x.setLineDash) x.setLineDash(dash); x.beginPath(); pts.forEach(([X, Y], q) => q ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.stroke(); if(dash && x.setLineDash) x.setLineDash([]); };
    const ctr = L2.map((p, q) => [(p[0] + R2[q][0])/2, (p[1] + R2[q][1])/2]), wid = q => Math.hypot(L2[q][0] - R2[q][0], L2[q][1] - R2[q][1]), wpx = Math.min(px(3.5), Math.max(px(0.8), wid(0)*0.06)), mix = (q, t) => [L2[q][0] + (R2[q][0] - L2[q][0])*t, L2[q][1] + (R2[q][1] - L2[q][1])*t];
    const base = RG_WAYCOL[wy.mat] && (wy.mat === 'asphalt' && wy.w === 'neon' ? [34, 32, 44] : RG_WAYCOL[wy.mat]), Rq = (q, salt) => mulberry32((Math.imul(wy.i + 1, 7919) ^ keys[q] ^ salt) >>> 0);   // (its wear keyed to where each piece lies in the world, never to where it is drawn)
    if(wy.high && run.gnd){ const conc = rsCss(lit([116, 112, 126])), concD = rsCss(lit([62, 58, 74])), th = q => Math.max(px(1), wid(q)*0.14);
      for(let q = 0; q < run.length; q++){ const g = run.gnd[q]; if(!g || !run.pyl[q]) continue; const [X, Y] = ctr[q], pw = Math.max(px(1), wid(q)*0.16); if(g[1] - Y < px(1)) continue;
        rsPoly(x, [[X - pw/2, Y], [X, Y], [g[0], g[1]], [g[0] - pw/2, g[1]]], conc); rsPoly(x, [[X, Y], [X + pw/2, Y], [g[0] + pw/2, g[1]], [g[0], g[1]]], concD); }
      rsPoly(x, [...L2, ...L2.map((p, q) => [p[0], p[1] + th(q)]).reverse()], concD); rsPoly(x, [...R2, ...R2.map((p, q) => [p[0], p[1] + th(q)]).reverse()], concD); }
    if(base){ rsPoly(x, poly, rsCss(lit(base), wy.mat === 'earth' || wy.mat === 'moss' ? 0.82 : 1)); line(L2, rsCss(lit(rsMix(base, [0, 0, 0], 0.25)), 0.5), wpx); line(R2, rsCss(lit(rsMix(base, [0, 0, 0], 0.25)), 0.5), wpx); }
    const near = q => wid(q) > px(10);
    for(let q = 0; q < run.length; q++){ if(!near(q)) continue; const wq = wid(q);
      if(wy.mat === 'cobble' || wy.mat === 'brick'){ const n = Math.min(14, Math.floor(wq/px(4))); for(let k = 0; k < n; k++){ const [X, Y] = mix(q, (k + 0.5)/n); x.fillStyle = rsCss(lit(rsMix(base, k % 2 ? [255, 250, 240] : [0, 0, 0], 0.15)), 0.8);
          if(wy.mat === 'cobble'){ x.beginPath(); x.ellipse(X, Y, wq/n*0.38, wq/n*0.2, 0, 0, Math.PI*2); x.fill(); } else x.fillRect(X - wq/n*0.42, Y - wq/n*0.12, wq/n*0.84, wq/n*0.24); } }
      else if(wy.mat === 'gravel'){ const Rm = Rq(q, 1); for(let k = 0; k < 6; k++){ const [X, Y] = mix(q, Rm()); x.fillStyle = rsCss(lit(Rm() < 0.5 ? [120, 112, 100] : [220, 212, 196]), 0.7); x.fillRect(X, Y, px(1), px(1)); } }
      else if(wy.mat === 'flag' && q % 2 === 0){ line([mix(q, 0), mix(q, 1)], rsCss(lit([100, 96, 88]), 0.5), Math.max(px(0.4), wpx*0.4)); }
      else if(wy.mat === 'moss'){ const Rm = Rq(q, 2), [X, Y] = mix(q, 0.3 + 0.4*Rm()); x.fillStyle = rsCss(lit([168, 164, 152])); x.beginPath(); x.ellipse(X, Y, wq*0.18, wq*0.08, 0, 0, Math.PI*2); x.fill(); } }
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
    for(let q = 0; q < run.length; q++){ const dc = decs[q]; if(dc < 0.4) continue; const wq = wid(q), Rm = Rq(q, 3);
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
      // (drawn with the ridge before its NEAREST corner, so no ridge it lies across paints over its near end)
      const cw = (u, v) => cutOf(f.a + u*f.ux - v*f.uz, f.z + u*f.uz + v*f.ux);
      fieldPieces.push({ f, u0, u1, v0, v1, dd: Math.min(cw(u0, v0), cw(u1, v0), cw(u0, v1), cw(u1, v1), cw(um, vm)) }); } }
  const paintFieldPiece = ({ f, u0, u1, v0, v1 }) => {
    const wa = (u, v) => [f.a + u*f.ux - v*f.uz, f.z + u*f.uz + v*f.ux], M1 = W*0.00025, lift = W*0.00002;
    const P = (u, v, up = 0) => { const [a, z] = wa(u, v); return at(a, z, Math.max(TR.sea, meshH(a, z)) + lift + up); };
    const q = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; if(q.some(p => !p)) return;
    const [am, zm] = wa((u0 + u1)/2, (v0 + v1)/2), day = ringDay(L, am)*(0.45 + 0.55*litAt(am, zm, meshH(am, zm))), haze = hazeOf(Math.hypot(am, zm - L.z0)), lit = col => rgLit(V, col, day, haze, AIR), C = RG_CROPS[f.crop] || RG_CROPS.pasture;
    const n1 = mnValue(am/(W*0.004) + f.i*0.37, zm/(W*0.004), s + 83), ppm = W*0.00025*F/q[0][2];
    // (near you a field is a wash over the land, so the land's own rise and fall shows through it; further off, its colour)
    const near0 = 0.3 + 0.7*rsSmooth(120*M1, 520*M1, Math.hypot(am, zm - L.z0));
    let base = rsMix(C.c, n1 > 0.5 ? [255, 250, 230] : [0, 0, 0], Math.abs(n1 - 0.5)*0.16); if(C.water) base = rsMix(base, AIR, 0.15);
    // (its wash shaded corner by corner by the sun that reaches each, so a hill's shadow runs smoothly over it)
    { const cd = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => { const [a2, z2] = wa(u, v); return rgLit(V, base, ringDay(L, a2)*(0.45 + 0.55*litAt(a2, z2, meshH(a2, z2))), haze, AIR); });
      let dmx = 0; for(let k = 1; k < 4; k++) dmx = Math.max(dmx, Math.abs(cd[k][0] - cd[0][0]) + Math.abs(cd[k][1] - cd[0][1]) + Math.abs(cd[k][2] - cd[0][2]));
      if(dmx > 12){ fillTri([q[0], q[1], q[2]], [cd[0], cd[1], cd[2]], near0); fillTri([q[0], q[2], q[3]], [cd[0], cd[2], cd[3]], near0); }
      else rsPoly(x, q.map(p => [p[0], p[1]]), rsCss([0, 1, 2].map(ch => (cd[0][ch] + cd[1][ch] + cd[2][ch] + cd[3][ch])/4), near0)); }
    if(C.water && ppm > px(0.05)){ x.save(); x.globalCompositeOperation = 'screen'; rsPoly(x, q.map(p => [p[0], p[1]]), rsCss(rsMix(AIR, [255, 255, 255], 0.3), 0.18*day + 0.04)); x.restore(); }
    // (rows, furrows, mowing stripes or terrace steps: lines along the field's length, at their spacing across it)
    const step = f.step || (C.row ? C.row[0]*M1 : C.stripe ? C.stripe[0]*M1 : 0);
    if(step && step*ppm/M1 > px(1.6)){ const k0 = Math.ceil((v0 + f.hw)/step), k1 = Math.floor((v1 + f.hw)/step);
      if(k1 - k0 < 60) for(let k = k0; k <= k1; k++){ const v = -f.hw + k*step, A = P(u0, v), B = P(u1, v); if(!A || !B) continue;
        if(f.step){ const wdt = Math.max(px(0.6), step*ppm/M1*0.22); x.strokeStyle = rsCss(lit(rsMix(base, [0, 0, 0], 0.35)), 0.8); x.lineWidth = wdt; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
          x.strokeStyle = rsCss(lit(rsMix(base, [255, 248, 230], 0.25)), 0.7); x.lineWidth = Math.max(px(0.4), wdt*0.35); x.beginPath(); x.moveTo(A[0], A[1] - wdt*0.6); x.lineTo(B[0], B[1] - wdt*0.6); x.stroke(); continue; }
        const rc = C.row ? C.row[1] : C.stripe[1]; if(C.stripe && k % 2) continue;
        x.strokeStyle = rsCss(lit(rc), C.stripe ? 0.55 : 0.75); x.lineWidth = Math.max(px(0.4), step*ppm/M1*(C.stripe ? 0.5 : 0.35)); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
        // (near, a furrow's turned ridge catches the light along its top, so it reads as soil turned, not a pipe laid)
        if(f.crop === 'ploughed' && step*ppm/M1 > px(5)){ const wr = step*ppm/M1*0.35; x.strokeStyle = rsCss(lit(rsMix(C.c, [255, 240, 214], 0.28)), 0.6); x.lineWidth = wr*0.3; x.beginPath(); x.moveTo(A[0], A[1] - wr*0.45); x.lineTo(B[0], B[1] - wr*0.45); x.stroke(); } } }
    if(C.glow){ const nt = 1 - rsSmooth(0.3, 0.7, day); if(nt > 0.2){ const [cx, cy] = [(q[0][0] + q[2][0])/2, (q[0][1] + q[2][1])/2]; rgGlow(x, cx, cy, Math.hypot(q[2][0] - q[0][0], q[2][1] - q[0][1])*0.6, colsOf(f.w, day, haze).glow, 0.25*nt); } }
    // (its hedge or wall, along whichever of the field's own edges this piece lies on, standing up from the ground)
    const edges = []; if(v0 <= -f.hw + 1e-9 && f.openV !== -1) edges.push([u0, v0, u1, v0]); if(v1 >= f.hw - 1e-9 && f.openV !== 1) edges.push([u0, v1, u1, v1]); if(u0 <= -f.hl + 1e-9) edges.push([u0, v0, u0, v1]); if(u1 >= f.hl - 1e-9) edges.push([u1, v0, u1, v1]);
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

  // DUST DEVILS (Ruby: "more atmospheric effects"): on some rings, by day in clear weather over the dry country, a few
  // whirls of dust stand up from the hot ground, a tapering column leaning with the wind, its skirt of dust at the foot;
  // with the clock each wanders over the land, twisting, and lives a while (rising from nothing, standing, dying away)
  if(V.weather === 'clear' && seedChoice(V.seed, 'devils')() < 0.55){ const RD = rgRand(s, 870), [wA, wS] = rgWind(V), tc = rgCloudTime(V); let nd = 0;
    for(let k = 0; k < 40; k++){ const R = rgRand(s, 871, k), a0 = (R()*2 - 1)*W*0.4, z0 = (R() - 0.5)*W*0.8, hM = 80 + 260*R()*R(), life0 = 260 + 400*R(), ph = R()*6.283;
      if(V.dryAt(a0, z0) < 0.6 || RD() > 0.5) continue;
      const lp = V.time ? (tc/life0 + R()) % 1 : 0.5, life = rsSmooth(0, 0.2, lp)*rsSmooth(1, 0.75, lp), wan = V.time ? tc*0.6 : 0;
      const a = a0 + (Math.cos(wA)*wS*0.4*wan + Math.sin(wan*0.013 + ph)*60)*W*0.00025, z = z0 + (Math.sin(wA)*wS*0.4*wan + Math.cos(wan*0.011 + ph)*60)*W*0.00025;
      if(life < 0.03 || ringDay(L, a) < 0.45) continue; if(++nd > 4) break; const dd = keep(a, z, hM*W*0.00025); if(dd == null) continue;   // (the first four standing in the world, not the first four in view)
      things.push({ dd, draw: l => { const f = foot(a, z); if(!f || f[3] <= TR.sea) return; const h = hM*f[2]; if(h < px(6) || h > nearCut) return;
        const X = f[0], Y = stand(l, X, f[1]), lean = Math.cos(wA)*0.25, wb = h*0.05, wt = h*0.32; if(!vis(l, X - wt*1.4 + Math.min(0, lean*h), X + wt*1.4 + Math.max(0, lean*h), Y - h, Y)) return;
        const day = ringDay(L, a), dc = rgLit(V, rsMix(rgGround(V, a, z, f[3]), [214, 190, 146], 0.45), day, hazeOf(dd), AIR), al = life*rsSmooth(0.45, 0.65, day), tw = V.time ? MT*0.02 : 0;
        const sk = x.createRadialGradient(X, Y, 0, X, Y, wb*5); sk.addColorStop(0, rsCss(dc, 0.3*al)); sk.addColorStop(1, rsCss(dc, 0)); x.save(); x.translate(X, Y); x.scale(1, 0.3); x.translate(-X, -Y); x.fillStyle = sk; x.beginPath(); x.arc(X, Y, wb*5, 0, Math.PI*2); x.fill(); x.restore();
        // (the column in rings of dust, densest low, its sun side lit; then the whirl's strands winding up it)
        const dl = rsMix(dc, [255, 244, 222], 0.3), cs = V.sun.sd || 1, ring = t => { const w = wb + (wt - wb)*Math.pow(t, 1.6); return [X + lean*h*t + Math.sin(t*5 + ph + tw)*w*0.3, Y - h*t, w]; };
        for(let q = 0, n = Math.max(8, Math.min(40, Math.round(h/px(3)))); q < n; q++){ const t = q/(n - 1), [xx, yy, w] = ring(t);
          const g = x.createRadialGradient(xx + cs*w*0.3, yy, 0, xx, yy, w); g.addColorStop(0, rsCss(dl, 0.3*(1 - 0.7*t)*al)); g.addColorStop(0.6, rsCss(dc, 0.16*(1 - 0.7*t)*al)); g.addColorStop(1, rsCss(dc, 0));
          x.save(); x.translate(xx, yy); x.scale(1, 0.32); x.translate(-xx, -yy); x.fillStyle = g; x.beginPath(); x.arc(xx, yy, w, 0, Math.PI*2); x.fill(); x.restore(); }
        x.strokeStyle = rsCss(rsMix(dc, BLACK, 0.12), 0.22*al); x.lineWidth = Math.max(px(0.5), h*0.006); x.lineCap = 'round';
        for(let k2 = 0; k2 < 3; k2++){ x.beginPath(); for(let q = 0; q <= 24; q++){ const t = q/24, [xx, yy, w] = ring(t), an = t*14 + k2*2.1 + tw*3; if(Math.cos(an) < 0){ x.moveTo(xx + Math.sin(an)*w*0.8, yy); continue; } q ? x.lineTo(xx + Math.sin(an)*w*0.8, yy) : x.moveTo(xx + Math.sin(an)*w*0.8, yy); } x.stroke(); } } }); } }

  // A MURMURATION: on some rings, at dusk over open country, a flock of starlings in its thousands wheels over the land,
  // a dark cloud of birds folding from one shape into the next as the clock runs (stretched, turned, folded on itself),
  // densest where it folds and thinning at its edges; with no clock, one shape held
  if((V.weather === 'clear' || V.weather === 'clouds') && seedChoice(V.seed, 'flock')() < 0.3 && V.world.list.some(w => w === 'wilds' || w === 'cities' || w === 'builders')){
    const RF = rgRand(s, 880), az = RF()*Math.PI*2, r0 = W*(0.04 + 0.2*RF()), a0 = Math.cos(az)*r0, z0 = Math.max(-W*0.42, Math.min(W*0.42, L.z0 + Math.sin(az)*r0)), hF = 90 + 160*RF(), SF = 160 + 260*RF(), NB = 600 + Math.floor(900*RF()), ph = RF()*50;
    const dd = keep(a0, z0, SF*W*0.00025); if(dd != null) things.push({ dd, draw: l => { const day = ringDay(L, a0), dk = rgClamp(1 - Math.abs(day - 0.5)*3.2); if(dk < 0.15) return;
      const e = Math.max(TR.sea, T(a0, z0, W*0.003)), B = at(a0, z0, e + hF*W*0.00025); if(!B) return; const k = W*0.00025*F/B[2], S2 = SF*k*0.5, X = B[0], Y = B[1]; if(S2 < px(5) || S2 > wh*1.5) return;
      if(!vis(l, X - S2*2.4, X + S2*2.4, Y - S2*1.6, Y + S2*1.6)) return;
      const T0 = (V.time ? MT*0.004 : 0) + ph, sx = 1.6 + 0.7*Math.sin(T0*0.7), sy = 0.45 + 0.25*Math.sin(T0*0.9 + 1), th = T0*0.3, ct = Math.cos(th), st = Math.sin(th), Rb = mulberry32(s ^ 0xb1d5);
      x.fillStyle = rsCss(rgLit(V, [34, 30, 40], 0.4, hazeOf(dd)*0.7, AIR), 0.85*rsSmooth(0.15, 0.4, dk)); x.beginPath(); const rd = Math.max(px(0.5), Math.min(px(1.4), S2*0.008));
      for(let q = 0; q < NB; q++){ let u = Rb()*2 - 1, v = Rb()*2 - 1, w = Rb()*2 - 1; const m = Math.cbrt(Rb())/(Math.hypot(u, v, w) || 1); u *= m; v *= m; w *= m;
        let px0 = (u*ct - w*st)*sx, py0 = v*sy; px0 += 0.45*Math.sin(2.1*py0/sy + T0); py0 += 0.3*Math.sin(1.6*px0 - T0*0.8);
        const BX = X + px0*S2, BY = Y - py0*S2; x.moveTo(BX + rd, BY); x.arc(BX, BY, rd, 0, Math.PI*2); }
      x.fill(); } }); }

  // THE CLOUDS AS THINGS IN THE WORLD (Ruby: "clouds will need distance, lod, parallaxing, transparency, blending, and to
  // not clip with other objects"): each heap of cumulus stands at its own place over the band, its base at its own height
  // above the sea, its size in metres, so it is drawn at its distance among the ridges (a nearer hill hides it, a far
  // range stands behind it, a high peak pokes up through it), seen from below or, from high up, from above; hazed as
  // the land is by the air between; detailed by how large it is (more and smaller billows near, a few far); painted
  // whole on its own sheet and laid on the page at once, see-through at its edges, so its billows never darken each
  // other; and with the clock carried by the wind. A storm's towers carry their anvils, rain falls from their bases to
  // the ground below them, and lightning strikes from one of them down to the land
  { const wx = V.weather, cloudy = wx === 'clouds' || wx === 'rain' || wx === 'storm' || wx === 'snow';
    if(cloudy){ const R0 = rgRand(s, 850), n = wx === 'clouds' ? 16 + Math.floor(R0()*10) : 20 + Math.floor(R0()*10), M1 = W*0.00025, A = W*1.6, Zh = W*0.44, storm = wx === 'storm';
      const [wAng, wSp] = rgWind(V), wrap = (v, h) => ((v + h) % (2*h) + 2*h) % (2*h) - h;
      const lxC = V.sun.screen[0] > 0 ? 1 : -1;
      // LIGHTNING, stark and safe (Ruby: photosensitivity, "a creeping bolt, a couple frames of easing"; and "should never
      // be the first frame of animation, and should change the whole scene lighting fairly starkly as well as shading").
      // A strike is an event in the film's own seconds, the same at any frame rate and any pace through the hours
      // (docs/prior-art/ringworld-motion-and-variety.md §5.4, §8 item 7): slots 2.8 s long, each striking or not by its own
      // stream, a strike beginning in its slot's first 0.3 s, so two are never nearer than 2.5 s; none in a film's first
      // 1.5 s. Each plays over 1.2 s: its leader creeps down from the cloud's base over a fifth of a second, touches the
      // land, and the light rises over a quarter, holds, and fades over two thirds (rgBoltLit). The light it gives: the
      // cloud lit from within, a glow where it lands, and the land lit from it (FLASH, at the end). A still shows one bolt
      let strike = -1, sph = 0.42, sev = 0; const inView = [], allHeaps = [];
      if(storm){ if(!V.time && V.frame == null) strike = R0();   // (a still storm shows its bolt; a film's first frame never does: Ruby)
        else { const st = rgStrike(s, rgFilmTime(V)); if(st){ strike = st.pick; sph = st.ph; sev = st.ev; } } }
      for(let k = 0; k < n; k++){ const R = rgRand(s, 851, k), rnd = (a, b) => a + (b - a)*R();
        const tc = rgCloudTime(V), u0 = R()*2 - 1, a = wrap(Math.sign(u0)*Math.pow(Math.abs(u0), 1.35)*A + Math.cos(wAng)*wSp*M1*tc, A), z = wrap((R()*2 - 1)*Zh + Math.sin(wAng)*wSp*M1*tc*0.3, Zh);
        const eb = Math.max(TR.sea, TR.cloud*rnd(0.7, 1.05)), wd0 = rnd(250, 900)*M1*(storm ? 1.4 : 1), ht0 = wd0*rnd(0.35, storm ? 1.3 : 0.7), seed0 = (R()*4294967296) >>> 0, rain = (wx === 'rain' || storm) && R() < 0.6;
        // (a cumulus lives a quarter of an hour or so, in clean stages (Ruby: "clouds should have clean transition states"):
        //  it GATHERS (its billows drawing in from wisps, a third of its life), stands, then THINS (fading and loosening as
        //  it spreads), and is gone a while before another of its own shape gathers in its place; a new shape only ever
        //  begins from nothing. At the film's start, and in a still, each stands at its fullest)
        // (its life runs on a clock of its own, faster than the wind's in a time-lapse, as a time-lapse of cumulus shows
        //  them: a quarter hour's life in some seconds of film, building and thinning while they barely drift; docs/
        //  prior-art/ringworld-motion-and-variety.md §2)
        const gt = rgGrowTime(V), lifeT = (900 + 1500*R())*(storm ? 2 : 1), ph0 = 0.45, cyc = V.time ? Math.floor(gt/lifeT + ph0) : 0, lp = V.time ? (gt/lifeT + ph0) % 1 : ph0;
        const grow = rsSmooth(0, 0.3, lp), fade = rsSmooth(0.86, 0.62, lp), life = grow*fade;
        const wd = wd0*(0.6 + 0.4*grow)*(1 + 0.25*(1 - fade)), ht = ht0*(0.35 + 0.65*grow)*(0.75 + 0.25*fade), seed = (seed0 ^ Math.imul(cyc, 0x9E3779B1)) >>> 0;
        if(life < 0.03) continue;
        { const D = V.sun.D, up = Math.max(0.3, -D[0]), hg = Math.max(0, eb - TR.sea); shades.push({ a: a + hg*D[1]/up, z: z + hg*D[2]/up, r: wd*0.5, k: life*Math.min(1, ht/wd + 0.4), ph: (seed0 % 628)/100 }); }
        const hp = { a, z, eb, wd, ht, seed, rain, life, grow, tc, bolt: null }; allHeaps.push(hp);
        const dd = keep(a, z, wd); if(dd == null) continue;
        const P0 = at(a, z, eb); if(P0 && P0[0] > ww*0.08 && P0[0] < ww*0.92 && P0[1] > 0 && P0[1] < wh) inView.push(hp); things.push({ dd, draw: l => paintHeap(hp, l, dd) }); }
      // (in a film the bolt's cloud is chosen among every cloud about you, so a turn never moves it to another; in a still,
      //  among those in view, so a still storm shows its bolt)
      const pool = V.time ? allHeaps : inView; if(strike >= 0 && pool.length){ const hb = pool[Math.floor(strike*pool.length)], G = at(hb.a, hb.z, Math.max(TR.sea, T(hb.a, hb.z, W*0.003)));
        hb.bolt = { ph: sph, ev: sev }; FLASH = { lit: rgBoltLit(sph)*(G ? 1 : 0.8), X: G ? G[0] : ww/2, Y: G ? G[1] : -wh*0.5 }; }
      const paintHeap = (h, l, dd) => { const B = at(h.a, h.z, h.eb); if(!B) return; const kpx = F/B[2], W0 = h.wd*kpx, H0 = h.ht*kpx; if(W0 < px(2) || W0 > ww*1.2) return;
        const X = B[0], Y = B[1]; if(!vis(l, X - W0*1.2, X + W0*1.2, Y - H0*1.3, Y + H0*0.1)) return;
        const day = ringDay(L, h.a), haze = hazeOf(dd), dusk = rgClamp(1 - Math.abs(day - 0.5)*3.2), R = mulberry32(h.seed), rnd = (a, b) => a + (b - a)*R();
        const white = rsMix(rgLit(V, [244, 244, 250], day, 0, AIR), [255, 170, 140], dusk*0.4), grey = rsMix(white, [70, 74, 86], storm ? 0.6 : wx === 'rain' ? 0.38 : wx === 'snow' ? 0.15 : 0.05);
        const base = rsMix(rsMix(grey, [40, 44, 60], 0.25), AIR, haze*0.85), lit = rsMix(rsMix(grey, [255, 248, 236], 0.35*rsSmooth(0.3, 0.75, day) + 0.1), AIR, haze*0.85);
        // (its billows: as many as fill its size, more and smaller the nearer and larger it is, the lower ones squashed flat
        //  on the base; a tower's billows climb it)
        // (how many by its width at its true distance, so a turn never re-forms it)
        const Wt = h.wd*F/Math.max(1e-9, Math.hypot((1 - h.eb)*Math.cos(h.a) - L.Px, (1 - h.eb)*Math.sin(h.a), h.z - L.z0));
        const S0 = Math.sqrt(W0*Math.max(H0, W0*0.35)), pr0 = S0*0.11, npf = Math.max(6, Math.min(64, W0*H0/(pr0*pr0)*0.55, Wt/px(4)))*(0.4 + 0.6*(h.grow ?? 1));
        const pad = W0*0.25 + pr0*1.5, cw = Math.ceil(W0*1.5 + pad*2), ch = Math.ceil(H0*1.3 + pad*2), ox = X - cw/2, oy = Y - H0*1.15 - pad;
        // (a heap too large for its own sheet is drawn on a smaller one and laid on enlarged, rather than left out)
        const ks = Math.min(1, Math.sqrt(4.2e6/(cw*ch))), [cc, cx] = kitCanvas(Math.ceil(cw*ks), Math.ceil(ch*ks)), L0 = (px0, py) => [px0 - ox, py - oy], puffs = []; if(ks < 1) cx.setTransform(ks, 0, 0, ks, 0, 0);
        // (with the clock, as Wind Waker's cumulus do: each billow breathes, swelling and settling a few percent in its own
        //  time, and the upper ones roll up a little and back, so the heap churns; and while it forms (the first part of its
        //  life) its billows GATHER: scattered wide and thin at first, low and flat, drawing in to the heap as it builds)
        // (its billows GROWN as a heap grows: a row along the base, then each new one bulging up or out from one already
        //  there, inside the heap's dome, so they hold together as one body and none floats free (a lone billow reads as
        //  a ball). Laid out in the heap's own measure, so the same heap keeps its shape at any distance; while it
        //  gathers the layout is spread wide and low and its billows small)
        const tm = V.time ? h.tc : 0, grow = h.grow ?? 1, spread = 1 + 0.9*(1 - grow), Hn = H0*0.92, ru = pr0/W0, rv = pr0/Hn;
        // (its billows DEALT ONCE, the most it ever shows (64), in the order it grows them: three in every ten along its base,
        //  laid from the middle outward, the rest each bulging up or out from one already there. How many show is how large
        //  it stands and how far it has grown, the next swelling in as the count reaches it: so a heap drifting nearer, or
        //  building, adds billows one by one, its top climbing in turrets, and never re-deals the rest (docs/prior-art/
        //  ringworld-motion-and-variety.md §1.3: a count taken from its size re-dealt the whole heap now and then)
        const env = v => 0.5*Math.sqrt(Math.max(0, 1 - v)) + 0.06, sk = [], vdc = b => { let v = 0, f = 0.5; for(b++; b; b >>= 1, f /= 2) if(b & 1) v += f; return v; }; let nbs = 0;
        for(let q = 0; q < 64; q++){ const rr = rnd(0.7, 1.3); let u = -1, v = 0;
          if(q % 10 < 3 || !sk.length){ u = 0.5 + (vdc(nbs++)*2 - 1)*env(0)*0.85 + (R() - 0.5)*ru; v = R()*rv*0.4; }
          else for(let t = 0; t < 6 && u < 0; t++){ const p = sk[Math.floor(R()*sk.length)], th = (R()*2 - 1)*1.25, d = (p[2] + rr)*0.5, u1 = p[0] + Math.sin(th)*d*ru, v1 = p[1] + Math.cos(th)*d*rv;
            if(v1 <= 1 && Math.abs(u1 - 0.5) <= env(v1)){ u = u1; v = v1; } }
          if(u >= 0) sk.push([u, v, rr*(1 - 0.2*v)*(0.8 + 0.4*(1 - Math.abs(u - 0.5)*2)), rsSmooth(q - 1, q + 1, npf)]); }
        const all = sk.map(([u0, v0, r0, wq], q) => { const ph = q*2.399 + (h.seed % 628)/100, breathe = tm ? 1 + 0.08*Math.sin(tm*0.021 + ph) : 1, roll = tm ? Math.sin(tm*0.013 + ph*1.7)*0.06*v0 : 0;
          return [X - W0/2 + W0*(0.5 + (u0 - 0.5)*spread), Y - Hn*(v0*(0.45 + 0.55*grow) + roll) - pr0*0.4, pr0*r0*breathe*(0.6 + 0.4*grow)*(0.55 + 0.45*wq), wq]; });
        for(const p of all) if(p[3] > 0.01) puffs.push(p);
        // (and, drawn large, a cauliflower's smaller billows on its outline, coming in as the heap nears so none pops in;
        //  dealt for every billow, shown or not, so one more never re-deals the rest)
        { const det = rsSmooth(px(90), px(220), W0), Rd = mulberry32(h.seed ^ 0x5eed5eed), n0 = puffs.length;
          if(det > 0) all.forEach(([p0, p1, r, wq]) => { for(let c = 0; c < 3; c++){ const th = (Rd()*2 - 1)*1.7, cr = r*(0.3 + 0.2*Rd()), k0 = p0 + Math.sin(th)*r*0.8, k1 = p1 - Math.cos(th)*r*0.8;
            if(wq > 0.01 && k1 < Y - pr0*0.3 && !puffs.some(([s0, s1, sr], j) => j < n0 && sr > 0 && Math.hypot(k0 - s0, k1 - s1) < sr*0.85 && !(s0 === p0 && s1 === p1))) puffs.push([k0, k1, cr, det*wq]); } }); }
        // (soft as a painter's cloud: each billow a gradient, its rim fading into the air, so the edge is soft and no
        //  billow outlines another; then its body lit toward the sun and from above; the lit caps on top; the flat
        //  shaded base beneath it all)
        for(let q = 0; q < 6; q++){ const [qx, qy] = L0(X - W0*0.42 + W0*0.84*q/5, Y - pr0*0.2), g = cx.createRadialGradient(qx, qy, 0, qx, qy, W0*0.16); g.addColorStop(0, rsCss(base, 0.8)); g.addColorStop(1, rsCss(base, 0));
          cx.save(); cx.translate(qx, qy); cx.scale(1, 0.32); cx.translate(-qx, -qy); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, W0*0.16, 0, Math.PI*2); cx.fill(); cx.restore(); }
        for(const [p0, p1, r, pa] of puffs){ const [qx, qy] = L0(p0, p1), g = cx.createRadialGradient(qx, qy, r*0.55, qx, qy, r*1.3); g.addColorStop(0, rsCss(base, 0.95*pa)); g.addColorStop(1, rsCss(base, 0)); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, r*1.3, 0, Math.PI*2); cx.fill(); }
        puffs.sort((p, q) => q[1] - p[1]);   // (the lower billows first, so the upper ones sit on them)
        for(const [p0, p1, r, pa] of puffs){ const [qx, qy] = L0(p0, p1), up = rsSmooth(Y, Y - H0, p1), body = rsMix(base, lit, 0.35 + 0.4*up), g = cx.createRadialGradient(qx + lxC*r*0.3, qy - r*0.35, 0, qx, qy, r);
          g.addColorStop(0, rsCss(rsMix(body, lit, 0.22), pa)); g.addColorStop(0.72, rsCss(body, pa)); g.addColorStop(1, rsCss(body, 0)); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, r, 0, Math.PI*2); cx.fill(); }
        // (lit as ONE body, not billow by billow (Ruby: the bubbles read as a cartoon): the light laid over the whole heap,
        //  brightest high on the sun's side, the shadow pooling low on the far side; then its edge broken into a fringe of
        //  small, faint wisps, so no round billow draws the outline)
        // (and lit by where the sun stands (docs/prior-art/ringworld-sky.md): high, from above on its side; low, at dawn or
        //  dusk, from BELOW on its side, the undersides burning warm and the tops gone grey and violet in their own shade;
        //  and with the sun behind it, a heap is dark at its heart and its edges shine (a silver lining))
        const sEl = V.sun.D ? Math.asin(Math.max(-1, Math.min(1, -V.sun.D[0]))) : 1, lowK = rsSmooth(0.5, 0.08, sEl)*rsSmooth(-0.12, 0.02, sEl);
        const sp2 = V.sun.at, back = sp2 && sEl > -0.05 ? rsSmooth(W0*1.6, W0*0.35, Math.hypot(sp2[0] - X, sp2[1] - (Y - H0*0.5))) : 0;
        cx.save(); cx.globalCompositeOperation = 'source-atop';
        { const [ax, ay] = L0(X + lxC*W0*0.35, Y - H0*1.05), [bx, by] = L0(X - lxC*W0*0.3, Y), g = cx.createLinearGradient(ax, ay, bx, by), k = 1 - lowK;
          g.addColorStop(0, rsCss(lit, 0.55*k)); g.addColorStop(0.45, rsCss(lit, 0.08*k)); g.addColorStop(0.75, rsCss(base, 0.12*k)); g.addColorStop(1, rsCss(rsMix(base, [20, 24, 40], 0.3), 0.45*k)); cx.fillStyle = g; cx.fillRect(0, 0, cw, ch); }
        if(lowK > 0.01){ const warm = rsMix(rsMix([255, 150, 104], [255, 196, 150], rsSmooth(0.05, 0.4, sEl)), lit, 0.2), cool = rsMix(base, [74, 62, 112], 0.35), [ax, ay] = L0(X + lxC*W0*0.45, Y), [bx, by] = L0(X - lxC*W0*0.15, Y - H0*1.1), g = cx.createLinearGradient(ax, ay, bx, by);
          g.addColorStop(0, rsCss(warm, 0.62*lowK)); g.addColorStop(0.35, rsCss(warm, 0.22*lowK)); g.addColorStop(0.7, rsCss(cool, 0.2*lowK)); g.addColorStop(1, rsCss(cool, 0.5*lowK)); cx.fillStyle = g; cx.fillRect(0, 0, cw, ch); }
        if(back > 0.01){ const [qx, qy] = L0(X, Y - H0*0.5), g = cx.createRadialGradient(qx, qy, 0, qx, qy, Math.max(W0, H0)*0.6); g.addColorStop(0, rsCss(rsMix(base, [16, 18, 30], 0.4), 0.45*back)); g.addColorStop(1, rsCss(base, 0)); cx.fillStyle = g; cx.fillRect(0, 0, cw, ch); }
        cx.restore();
        { const nf = Math.min(160, all.length*3), fr = pr0*0.32, rimC = rsMix([255, 250, 238], lit, 0.3); for(let q = 0; q < nf; q++){ const [p0, p1, r, wq] = all[(q*7) % all.length], an = q*2.399 + (h.seed % 97), fx = p0 + Math.cos(an)*r*1.05, fy = p1 + Math.sin(an)*r*0.9;
          if(wq < 0.05 || fy > Y - pr0*0.2 || puffs.some(([s0, s1, sr, sa]) => sa > 0.5 && Math.hypot(fx - s0, fy - s1) < sr*0.92)) continue;   // (only out on the edge; and only off a billow that shows)
          const [qx, qy] = L0(fx, fy), rim = back*(sp2 ? rsSmooth(W0*1.4, W0*0.2, Math.hypot(sp2[0] - fx, sp2[1] - fy)) : 0);
          const g = cx.createRadialGradient(qx, qy, 0, qx, qy, fr*(1 + 0.6*rim)); g.addColorStop(0, rsCss(rim > 0.05 ? rsMix(Math.sin(an) < 0 ? lit : base, rimC, rim) : Math.sin(an) < 0 ? lit : base, (0.32 + 0.55*rim)*wq)); g.addColorStop(1, rsCss(base, 0)); cx.fillStyle = g; cx.beginPath(); cx.arc(qx, qy, fr*(1 + 0.6*rim), 0, Math.PI*2); cx.fill(); } }
        // rain from its base to the ground under it, slanting with the wind, fading as it falls
        // (a curtain of streaks, not slabs: many thin falls of rain, thickest under the heap's middle, each fading as it
        //  falls, slanting with the wind and swaying with it as the clock runs; and where the heap's rain never reaches the
        //  ground (a light shower, virga) its streaks thin out half way down, hanging from the base like a fringe)
        // (and in plain cloudy weather now and then a far heap rains: a shower out over the land, its curtain reaching the
        //  ground there while the sky over you stays dry)
        const shower = !h.rain && wx === 'clouds' && (h.seed % 9) === 0 && dd > W*0.6 && h.ht > h.wd*0.4, virga = !h.rain && !shower && (wx === 'clouds' || wx === 'snow') && (h.seed % 7) < 2 && h.ht > h.wd*0.45;
        // (Ruby: "Rain curtains should not be just a single panel and should fade in and out": a heap's rain falls as two
        //  to five curtains across its base, each its own width and weight and a little nearer or farther, each slanting
        //  with the wind and swaying with it, each thickening and thinning on its own slow time, so a shower moves along
        //  the base and comes and goes; its streaks thickest at its middle, fading to its edges)
        if(h.rain || shower || virga){ const G = at(h.a, h.z, Math.max(TR.sea, T(h.a, h.z, W*0.003))); if(G && G[1] > Y){ const ln = G[1] - Y, Rr = mulberry32(h.seed ^ 0x7a17), sway = tm ? Math.sin(tm*0.004 + (h.seed % 97))*0.05 : 0, sl = (Math.cos(wAng)*0.12 + sway)*W0;
          const col = rsMix(base, AIR, 0.25), a0 = (storm ? 0.16 : 0.11)*(virga ? 0.7 : 1), nc = 2 + Math.floor(Rr()*(storm ? 4 : 3)), gtm = V.time ? rgGrowTime(V) : 0;
          for(let k = 0; k < nc; k++){ const cu = (Rr()*2 - 1)*0.34, cw = 0.12 + 0.22*Rr(), dep = Rr(), per = 240 + 420*Rr(), ph = Rr()*6.283, pw = 0.7 + 0.6*Rr();
            // (how heavy it falls now: a slow swell and ebb of its own, none ever quite gone in a still)
            const I = V.time ? 0.15 + 0.85*Math.pow(0.5 + 0.5*Math.sin(gtm/per*6.283 + ph), 1.3) : 0.55 + 0.45*Math.sin(ph), wk = (0.55 + 0.45*(1 - dep))*I, slk = sl*(0.8 + 0.4*dep) + Math.sin(tm*0.003 + ph)*0.03*W0*(tm ? 1 : 0);
            const n = Math.max(6, Math.min(40, Math.round(W0*cw/px(2.2))));
            for(let q = 0; q < n; q++){ const v = (Rr() + Rr())/2*2 - 1, u0 = cu + v*cw, w0 = Math.max(px(0.6), W0*(0.005 + 0.024*Rr()*Rr()))*pw, reach = virga ? 0.2 + 0.4*Rr() : 0.72 + 0.28*Rr(), Y1 = Y + ln*reach, edge = 1 - Math.abs(v)*0.75;
              const al = a0*(0.5 + Rr())*wk*edge; if(al < 0.004) continue;
              const g = x.createLinearGradient(0, Y, 0, Y1); g.addColorStop(0, rsCss(col, al)); g.addColorStop(0.6, rsCss(col, al*0.45)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g;
              const X0 = X + u0*W0; x.beginPath(); x.moveTo(X0, Y); x.lineTo(X0 + w0, Y); x.lineTo(X0 + w0 + slk*reach, Y1); x.lineTo(X0 + slk*reach, Y1); x.fill(); } } } }
        // (and, as Wind Waker's do overhead, a heap fades as it nears and swells past half the frame: drawn up close a painted
        //  heap would show itself a flat sheet; so it thins away as you pass under it, and gathers again as it draws off)
        const overhead = rsSmooth(ww*1.2, ww*0.55, W0);
        x.save(); x.globalAlpha = (0.93 - 0.25*haze)*Math.min(1, (h.life ?? 1)*1.3)*overhead; x.drawImage(cc, ox, oy, cc.width/ks, cc.height/ks); x.restore(); cc.width = 0;
        // a bolt of lightning from its base down to the land (with the clock, now and then, as an eased event above)
        if(h.bolt){ const ph = h.bolt.ph, creep = rsSmooth(0, 0.167, ph), lit = rgBoltLit(ph), G = at(h.a + W0/kpx*0.1, h.z, Math.max(TR.sea, T(h.a, h.z, W*0.003)));
          if(G && G[1] > Y + px(6)){ const Rb = mulberry32((h.seed ^ Math.imul(h.bolt.ev + 1, 0x2c1b3c6d)) >>> 0), drop = G[1] - Y, jag = Math.min(W0*0.08, drop*0.12); let bx = X + (Rb() - 0.5)*Math.min(W0*0.3, drop*0.3), by = Y; const pts = [[bx, by]], steps = 10;
            for(let q = 0; q < steps; q++){ bx += (G[0] - bx)/(steps - q) + (Rb() - 0.5)*jag; by += (G[1] - by)/(steps - q); pts.push([bx, by]); }
            x.save(); x.globalCompositeOperation = 'screen';
            // (the heap lit from within, softly, and less the larger it stands on the page)
            rgGlow(x, X, Y - H0*0.45, Math.max(W0, H0)*0.45, [190, 190, 240], 0.14*lit*(1 - 0.6*rsSmooth(ww*0.3, ww*0.8, W0)));
            // (the leader creeping down, faint, then the bolt bright once it has touched the land, dimming away)
            const reach = creep*steps, nq = Math.floor(reach); x.strokeStyle = rsCss([226, 226, 255], 0.3 + 0.6*lit); x.lineWidth = Math.max(px(0.8), W0*0.006)*(0.55 + 0.45*lit); x.lineJoin = 'round'; x.beginPath();
            for(let q = 0; q <= nq && q <= steps; q++) q ? x.lineTo(pts[q][0], pts[q][1]) : x.moveTo(pts[q][0], pts[q][1]);
            if(nq < steps){ const f2 = reach - nq, A2 = pts[nq], B2 = pts[nq + 1]; x.lineTo(A2[0] + (B2[0] - A2[0])*f2, A2[1] + (B2[1] - A2[1])*f2); }
            if(reach > 6){ const fk = pts[4]; x.moveTo(fk[0], fk[1]); x.lineTo(fk[0] + jag, fk[1] + drop*0.2); x.lineTo(fk[0] + jag*0.6, fk[1] + drop*0.35); }
            x.stroke(); if(creep >= 1) rgGlow(x, G[0], G[1], W0*0.2, [220, 220, 255], 0.35*lit); x.restore(); } } }; } }

  // ---- 4. BACK TO FRONT ----
  // every cell of the land, every thing, every run of way and piece of field, sorted far to near and painted so; a thing
  // just after the cells about its foot and those just in front of them, so the ground it stands on lies under it and
  // only land truly nearer hides it
  for(const t of things){ const j = slot(t.dd); if(j >= 0) t.l = lay[j]; }
  things.sort((p, q) => p.dd - q.dd); for(const t of things) if(t.l && t.draw){ cur = t; t.draw(t.l); }
  painting = true;
  const cellNear = dd => { for(let l = 0; l < NLV; l++) if((NG - 0.5)*cl[l] > dd*1.05) return cl[l]; return cl[NLV - 1]; };
  const items = [];
  for(const q of shown) items.push({ dd: q.dd, q });
  for(const t of things) if(t.l && (t.o || t.ok)) items.push({ dd: t.dd - (t.rad || 0) - 0.8*cellNear(t.dd), t });
  for(let b = 1; b < lay.length; b++){ const dn = lay[b - 1].d, df = lay[b].d; for(const r of collectWays(dn, df)) items.push({ dd: r.dd - 0.8*cellNear(r.dd), r }); }
  for(const pc of fieldPieces) items.push({ dd: pc.dd - 0.8*cellNear(pc.dd), pc });
  // (in fog, rain or snow the air thickens with depth, so the far land sinks into it layer on layer)
  const MIST = { fog: 0.075, rain: 0.035, storm: 0.03, snow: 0.045 }[V.weather] || 0, MISTC = rsMix(AIR, [236, 238, 242], 0.35), MISTB = 1 - Math.pow(1 - MIST, 16/NBK);
  if(MIST) for(let b = 1; b < lay.length; b++) if(lay[b].d > W*0.012) items.push({ dd: lay[b].d, mist: 1 });
  // (at dawn and dusk on a still day, mist lies in the low land, thicker the lower, breathing a little with the clock)
  const LOWMIST = (V.weather === 'clear' || V.weather === 'clouds') && seedChoice(V.seed, 'mist')() < 0.6 ? 0.22*rgClamp(1 - Math.abs(V.dayHere - 0.5)*3.5) : 0;
  const WT = rgWaterTime(V), WA = rgWind(V)[0];   // (the water's clock, and the way its glints drift)
  const DKG = d => Math.round(255*rgClamp(Math.log(Math.max(d, d0)/d0)/Math.log(reach/d0))), dkPolys = new Map(), mkPath = [];
  const SUN = V.sun.D, sunUp = V.sun.at !== null && V.sun.at !== undefined, M1 = W*0.00025;
  const lerpP = (A, B, t) => [A[0] + (B[0] - A[0])*t, A[1] + (B[1] - A[1])*t];
  // (a cell's polygon pushed out half a pixel round its middle, so no seam of the sky shows between two cells)
  const grow = P => { const cx2 = (P[0][0] + P[1][0] + P[2][0] + P[3][0])/4, cy2 = (P[0][1] + P[1][1] + P[2][1] + P[3][1])/4, g = 0.55;
    return P.map(p => { const dx2 = p[0] - cx2, dy2 = p[1] - cy2, ln = Math.hypot(dx2, dy2) || 1; return [p[0] + dx2/ln*g, p[1] + dy2/ln*g]; }); };
  // (a triangle of a cell shaded smoothly between its corners' colours, as a game's Gouraud shading: the two most unlike
  //  corners' colours at the ends of a linear gradient laid exactly along the way the colour changes across it, the
  //  third corner's falling where its colour lies between; so a shadow's or a border's edge runs smoothly across the
  //  cells, never in steps of them)
  const fillTri = (T3, C3, al = 1) => { let iA = 0, iB = 1, dm = -1; for(let k = 0; k < 3; k++) for(let m = k + 1; m < 3; m++){ const d2 = (C3[k][0] - C3[m][0])**2 + (C3[k][1] - C3[m][1])**2 + (C3[k][2] - C3[m][2])**2; if(d2 > dm){ dm = d2; iA = k; iB = m; } }
    const cA3 = C3[iA], cB3 = C3[iB], dC = [cB3[0] - cA3[0], cB3[1] - cA3[1], cB3[2] - cA3[2]], L2 = dm, cx3 = (T3[0][0] + T3[1][0] + T3[2][0])/3, cy3 = (T3[0][1] + T3[1][1] + T3[2][1])/3;
    const gp = T3.map(p => { const dx2 = p[0] - cx3, dy2 = p[1] - cy3, ln = Math.hypot(dx2, dy2) || 1; return [p[0] + dx2/ln*0.55, p[1] + dy2/ln*0.55]; });
    const tt = C3.map(c => ((c[0] - cA3[0])*dC[0] + (c[1] - cA3[1])*dC[1] + (c[2] - cA3[2])*dC[2])/(L2 || 1)), e1x = T3[1][0] - T3[0][0], e1y = T3[1][1] - T3[0][1], e2x = T3[2][0] - T3[0][0], e2y = T3[2][1] - T3[0][1], det = e1x*e2y - e1y*e2x;
    if(L2 < 4 || Math.abs(det) < 1e-6){ rsPoly(x, gp, rsCss([0, 1, 2].map(ch => (C3[0][ch] + C3[1][ch] + C3[2][ch])/3), al)); return; }
    const gx = ((tt[1] - tt[0])*e2y - (tt[2] - tt[0])*e1y)/det, gy = ((tt[2] - tt[0])*e1x - (tt[1] - tt[0])*e2x)/det, g2 = gx*gx + gy*gy;
    if(g2 < 1e-12){ rsPoly(x, gp, rsCss(cA3, al)); return; }
    const Ax = T3[0][0] - gx*tt[0]/g2, Ay = T3[0][1] - gy*tt[0]/g2, gr = x.createLinearGradient(Ax, Ay, Ax + gx/g2, Ay + gy/g2); gr.addColorStop(0, rsCss(cA3, al)); gr.addColorStop(1, rsCss(cB3, al)); rsPoly(x, gp, gr); };
  // THE LAND'S LIGHT on a cell (Ruby: "the scene lit with direction and purpose"): its slope facing the sun lit, facing
  // away lit by the sky alone (bluer, darker), each against the level ground's light, so the sun low at dusk rakes the
  // hills; the hollows a little darker (their sky half hidden: ambient occlusion); the crest's band lit along the top of
  // each face that drops away behind it (Ruby's bands); cloud shadows sweeping over it; low mist at dawn and dusk; and
  // the air between, by its distance
  // (what a cell's ground is, for its marks: snow high up, bare rock where steep, sand by the water, a town's paving,
  //  else its heaviest biome)
  const groundKind = (h, slope, bw, a, z) => { if(h > TR.snow && slope < 1) return 'snow'; if(slope > 0.62) return 'rock'; if(h < 3.2*M1) return 'sand';
    const w = V.worldAt(a, z); if(V.cityAt(a, z, RG_PROF[w].cv*(0.3 + 0.9*V.works)) > 0.45) return w === 'neon' ? 'paving' : 'paving';
    let bi = 0; for(let k = 1; k < bw.length; k++) if(bw[k] > bw[bi]) bi = k; return LK_BIOMES[bi].name; };
  // (each corner's ground colour, by its true height, kept: a cell takes its corners' colours, so a border between two
  //  grounds runs smoothly across the cells, never in steps of them)
  const vcol = (l, i, j) => { const k = ((j + NG)*SIDE + i + NG)*3, C = vC[l]; if(C[k] >= 0) return [C[k], C[k + 1], C[k + 2]];
    const a = i*cl[l], z = zOf(l, j), g = rgGround(V, a, z, Math.max(vh(l, i, j)/exf(Math.hypot(a, z - L.z0)), TR.sea + M1*0.5)); C[k] = g[0]; C[k + 1] = g[1]; C[k + 2] = g[2]; return g; };
  const paintCell = q => {
    const { l, i, j, P, am, zm, dd, c } = q, h00 = vh(l, i, j), h10 = vh(l, i + 1, j), h11 = vh(l, i + 1, j + 1), h01 = vh(l, i, j + 1), hm = (h00 + h10 + h01 + h11)/4, sea = TR.sea;
    const day = ringDay(L, am), haze = hazeOf(dd), wet = [h00 < sea, h10 < sea, h11 < sea, h01 < sea], nWet = wet[0] + wet[1] + wet[2] + wet[3];
    const dA = ((h10 - h00) + (h11 - h01))/(2*c), dZ = ((h01 - h00) + (h11 - h10))/(2*c), slope = Math.hypot(dA, dZ)/exf(dd);   // (its true steepness, for rock and snow)
    const ca2 = Math.cos(am), sa2 = Math.sin(am), nx = dA*sa2 - ca2, ny = -dA*ca2 - sa2, nz = -dZ, nl = Math.hypot(nx, ny, nz);
    const upS = -(ca2*SUN[0] + sa2*SUN[1]), ndl = (nx*SUN[0] + ny*SUN[1] + nz*SUN[2])/nl, kSun = upS > 0.04 ? ndl/Math.max(0.3, upS) : 1 + 0.4*(ndl - upS);
    const cv = (vh(l, Math.max(-NG, i - 1), j) + vh(l, Math.min(NG, i + 2), j) + vh(l, i, Math.max(-NG, j - 1)) + vh(l, i, Math.min(NG, j + 2)))/4, hol = rgClamp((cv - hm)/(c*1.6))*0.3;
    // (the crest's band, read at each corner on the page)
    const tb = P.map(p => bandAt(p[0], p[1])), fl = t => (1 - rsSmooth(0, 1.1, t))*0.62, fd = t => rsSmooth(0.8, 1.8, t)*(1 - rsSmooth(1.8, 3.4, t))*0.2;
    const shade = (g, t, sa = am, sz = zm, sl = 1) => { const kk = Math.max(0, Math.min(1.7, kSun))*sl, dark = rsMix(g, [26, 34, 70], 0.42), lit = rsMix(g, [255, 244, 222], 0.3);
      let cc = kk < 1 ? rsMix(dark, g, kk) : rsMix(g, lit, (kk - 1)/0.7*0.55); if(hol > 0.01) cc = rsMix(cc, dark, hol);
      cc = rsMix(rsMix(cc, lit, fl(t)), dark, fd(t)); cc = rgLit(V, cc, day, haze, AIR);
      const cs2 = cloudShadeAt(sa, sz)*rsSmooth(0.3, 0.7, day)*(1 - 0.85*haze); if(cs2 > 0.004) cc = rsMix(cc, [10, 14, 34], cs2);
      if(LOWMIST > 0 && dd > W*0.01){ const lw = rsSmooth(TR.cloud*0.25, sea, hm); if(lw > 0.05) cc = rsMix(cc, MISTC, LOWMIST*lw*0.7*(0.8 + 0.2*Math.sin(rgCloudTime(V)*0.03 + am*40))); }
      return cc; };
    const poly = grow(P), he = Math.max(hm/exf(dd), sea + M1*0.5), bw = nWet === 4 ? null : V.LK.biomes(am, zm, he); let g0 = null;
    if(bw){ const rock = rsSmooth(0.45, 0.95, slope), rk = rsMix([128, 120, 112], V.land, 0.12), fp = rgFieldPatch(V, am, zm, he, bw, slope, dd), g4 = [vcol(l, i, j), vcol(l, i + 1, j), vcol(l, i + 1, j + 1), vcol(l, i, j + 1)];
      g0 = [0, 1, 2].map(ch => (g4[0][ch] + g4[1][ch] + g4[2][ch] + g4[3][ch])/4);
      const VA = [i, i + 1, i + 1, i], VZ = [j, j, j + 1, j + 1], cs = g4.map((g, k) => { let c3 = g; if(fp) c3 = rsMix(c3, fp[0], fp[1]); if(rock > 0) c3 = rsMix(c3, rk, rock*0.8); return shade(c3, tb[k], VA[k]*c, zOf(l, VZ[k]), vLit(l, VA[k], VZ[k])); });   // (each corner's own cloud shadow, so a shadow's edge runs smoothly)
      let pA = 0, pB = 1, dM = -1; for(let k = 0; k < 4; k++) for(let m = k + 1; m < 4; m++){ const d2 = Math.abs(cs[k][0] - cs[m][0]) + Math.abs(cs[k][1] - cs[m][1]) + Math.abs(cs[k][2] - cs[m][2]); if(d2 > dM){ dM = d2; pA = k; pB = m; } }
      const cA = [0, 1, 2].map(ch => (cs[0][ch] + cs[1][ch] + cs[2][ch] + cs[3][ch])/4);
      if(dM > 24 && Math.hypot(P[pB][0] - P[pA][0], P[pB][1] - P[pA][1]) > px(2)){ fillTri([P[0], P[1], P[2]], [cs[0], cs[1], cs[2]]); fillTri([P[0], P[2], P[3]], [cs[0], cs[2], cs[3]]); }
      else rsPoly(x, poly, rsCss(cA));
      if(nWet === 0) rgGroundMarks(x, P, q, groundKind(he, slope, bw, am, zm), cA, px); }
    // WATER with its shore (docs/prior-art/ringworld-terrain.md §3): deep water dark and holding the sky the farther off
    // and the more glancing it is seen, the shallows lighter; where the land meets it, the wet edge and a line of foam
    if(nWet){ const hs = [h00, h10, h11, h01], wp = [], shore = [];
      for(let k = 0; k < 4; k++){ const k2 = (k + 1) & 3; if(wet[k]) wp.push(nWet === 4 ? poly[k] : P[k]); if(wet[k] !== wet[k2]){ const t = (sea - hs[k])/(hs[k2] - hs[k]), pp = lerpP(P[k], P[k2], t); wp.push(pp); shore.push(pp); } }
      const dep = Math.max(0, sea - Math.min(...hs.filter((_, k) => wet[k])))/M1, wbase = rsMix([24, 58, 104], V.sky, 0.35), wc0 = rsMix(wbase, [70, 150, 160], 0.4*(1 - rsSmooth(0, 9, dep)));
      let wc = rgLit(V, rsMix(wc0, AIR, 0.3*rsSmooth(0, W*0.6, dd)), day, haze, AIR); const cs2 = cloudShadeAt(am, zm)*rsSmooth(0.3, 0.7, day)*(1 - 0.85*haze); if(cs2 > 0.004) wc = rsMix(wc, [10, 14, 34], cs2*0.8);
      if(wp.length >= 3) rsPoly(x, wp, rsCss(wc));
      if(shore.length >= 2){ x.strokeStyle = rsCss(rgLit(V, [236, 240, 238], day, haze, AIR), 0.55*(1 - haze*0.7)); x.lineWidth = Math.max(px(0.6), Math.min(px(3), c*F/Math.max(dd, 1e-9)*0.08)); x.beginPath(); x.moveTo(shore[0][0], shore[0][1]); x.lineTo(shore[1][0], shore[1][1]); if(shore.length === 4){ x.moveTo(shore[2][0], shore[2][1]); x.lineTo(shore[3][0], shore[3][1]); } x.stroke(); }
      // (with the clock the glints move on the water: on the water's own gentle clock, drifting with the wind, each rising
      //  and fading as it comes and goes, never on or off between frames; docs/prior-art/ringworld-life-and-views.md §4, §7)
      if(nWet === 4 && dd < W*2.5){ const ws = Math.max(W*0.004, c*2), gv = V.time ? wn(am + WT*W*0.0000012*Math.cos(WA), zm + WT*W*0.0000012*Math.sin(WA), ws, 1) : wn(am, zm, ws, 1), gk = rsSmooth(0.5, 0.36, gv)*(0.3 + 0.7*day);
        if(gk > 0.02){ const [bx0, bx1, by0, by1] = q.box, n3 = wn(am, zm, ws, 3); x.fillStyle = rsCss(rsMix(wc, [255, 255, 255], 0.35*day + 0.05), gk*(1 - haze)); x.fillRect(bx0 + (bx1 - bx0)*0.2*n3, (by0 + by1)/2, (bx1 - bx0)*(0.3 + 0.5*n3), Math.max(px(0.6), (by1 - by0)*0.08)); } } }
    // (a crest's rim: a bright line along the top of the land that drops away behind it)
    if(q.rim && g0){ let iL = 0, iR = 0; for(let k = 1; k < 4; k++){ if(P[k][0] < P[iL][0]) iL = k; if(P[k][0] > P[iR][0]) iR = k; }
      const chain = (dir) => { const out = [P[iL]]; for(let k = iL; k !== iR;){ k = (k + dir + 4) & 3; out.push(P[k]); } return out; }, A1 = chain(1), A2 = chain(-1), my = ch => ch.reduce((s2, p) => s2 + p[1], 0)/ch.length, top = my(A1) <= my(A2) ? A1 : A2;
      x.strokeStyle = rsCss(rsMix(rgLit(V, rsMix(g0, [255, 244, 222], 0.4), day, haze, AIR), [255, 250, 236], 0.3*(1 - haze)), (0.7*day + 0.15)*(1 - 0.5*haze)); x.lineWidth = Math.max(px(1.6), bandOf(dd)*0.08); x.beginPath(); top.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
    mkPath.push(poly); const g = DKG(dd); let dl = dkPolys.get(g); if(!dl){ dl = []; dkPolys.set(g, dl); } dl.push(poly); };
  items.sort((p, q) => q.dd - p.dd);
  for(const it of items){
    if(it.q) paintCell(it.q);
    else if(it.t){ const t = it.t; if(t.o) drawWork(t.o, t.l); else if(t.ok){ cur = t; t.draw(t.l); } }
    else if(it.r) paintWay(it.r.wy, it.r.run, it.r.decs, it.r.keys);
    else if(it.pc) paintFieldPiece(it.pc);
    else if(it.mist){ x.fillStyle = rsCss(MISTC, MISTB); x.fillRect(0, 0, ww, wh); } }
  // the land's mask and its distance (white far, black near), for the parts after
  mk.fillStyle = '#fff'; mk.beginPath(); for(const P of mkPath){ P.forEach((p, k) => k ? mk.lineTo(p[0], p[1]) : mk.moveTo(p[0], p[1])); mk.closePath(); } mk.fill();
  for(const g of [...dkPolys.keys()].sort((p, q) => q - p)){ dk.fillStyle = `rgb(${g},${g},${g})`; dk.beginPath(); for(const P of dkPolys.get(g)){ P.forEach((p, k) => k ? dk.lineTo(p[0], p[1]) : dk.moveTo(p[0], p[1])); dk.closePath(); } dk.fill(); }
  // ---- 5. THE AIR OVER IT ALL: the sun's glare low in the sky, and the weather falling ----
  const sp = V.sun.at; if(sp && V.weather !== 'fog'){ const el = Math.asin(Math.max(-1, Math.min(1, -V.sun.D[0]))); if(el < 0.45){ const r = F*(0.6 + 0.5*(0.45 - el)), dk = ringDay(L, 0), col = rsMix([255, 232, 196], [255, 160, 120], rgClamp(1 - Math.abs(dk - 0.5)*3.2)*0.6);
    x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); g.addColorStop(0, rsCss(col, 0.22)); g.addColorStop(0.4, rsCss(col, 0.07)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(sp[0] - r, sp[1] - r, r*2, r*2); x.restore(); } }
  if(V.weather === 'rain' || V.weather === 'storm'){ const R = rgRand(s, 820), n = Math.round(ww*wh/(px(26)*px(26))), sl = 0.18; x.strokeStyle = rsCss(rsMix(AIR, [230, 236, 246], 0.5), V.weather === 'storm' ? 0.24 : 0.18); x.lineWidth = Math.max(px(0.5), px(0.9)); x.beginPath();
    // (with the clock each streak falls on, steeply, and comes round again at the top)
    const fall = rgClock(V, 1/30)*wh*1.6; for(let k = 0; k < Math.min(n, 4000); k++){ const ln = px(10 + 30*R()), X0 = R()*ww, Y = ((R()*wh + fall) % (wh + ln)) - ln, X = ((X0 + fall*sl) % ww); x.moveTo(X, Y); x.lineTo(X + ln*sl, Y + ln); } x.stroke();
    if(V.weather === 'storm'){ x.fillStyle = rsCss([20, 24, 44], 0.16); x.fillRect(0, 0, ww, wh); } }
  // LIGHTNING LIGHTS THE LAND (Ruby: "should change the whole scene lighting fairly starkly as well as shading"): while a
  // bolt burns, the whole land takes its light, cold and hard: lit from the bolt's side of the frame, its lights pushed
  // toward a blue-white and its shadows deepened (an overlay, so the contrast rises rather than the brightness), the side
  // away from it left dark. So it reads by its direction and its hardness, while no tenth of the frame brightens or
  // darkens by more than the photosensitivity rule's tenth of relative luminance (AGENTS.md §11; docs/prior-art/
  // ringworld-motion-and-variety.md §5.4)
  // (its strength held by measure, as arithmetic, not by eye: the land drawn small, the light laid on it, each tenth of the
  //  frame's change in relative luminance found at the light's full strength, and the light scaled so that none changes
  //  by more than 0.06; laid only over the land itself, never over the sky behind it)
  if(FLASH && FLASH.lit > 0.01){ const { lit, X: fx, Y: fy } = FLASH, sx = fx < ww/2 ? -1 : 1;
    const lay = (cx, w, h, a) => { const k = w/ww, x0 = (sx < 0 ? Math.min(0, fx) : Math.max(ww, fx))*k, x1 = (sx < 0 ? ww*1.1 : -ww*0.1)*k, g = cx.createLinearGradient(x0, Math.min(fy, 0)*h/wh, x1, h);
      g.addColorStop(0, rsCss([216, 226, 255], 0.6*a)); g.addColorStop(0.45, rsCss([170, 182, 226], 0.36*a)); g.addColorStop(1, rsCss([40, 46, 84], 0.4*a)); cx.save(); cx.globalCompositeOperation = 'overlay'; cx.fillStyle = g; cx.fillRect(0, 0, w, h); cx.restore(); };
    const lin = v => { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v + 0.055)/1.055, 2.4); }, tenths = cx => { const d = cx.getImageData(0, 0, 20, 20).data, t = new Float64Array(10);
      for(let i = 0; i < 400; i++){ const r = Math.floor(Math.floor(i/20)/4)*2 + (i % 20 < 10 ? 0 : 1); t[r] += (0.2126*lin(d[i*4]) + 0.7152*lin(d[i*4 + 1]) + 0.0722*lin(d[i*4 + 2]))*d[i*4 + 3]/255/40; } return t; };
    const [mc0, mx0] = kitCanvas(20, 20); mx0.drawImage(x.canvas, 0, 0, 20, 20); const t0 = tenths(mx0); lay(mx0, 20, 20, 1); mx0.globalCompositeOperation = 'destination-in'; mx0.drawImage(x.canvas, 0, 0, 20, 20);
    const t1 = tenths(mx0), dmax = Math.max(1e-9, ...t1.map((v, r) => Math.abs(v - t0[r]))), a = lit*Math.min(1, 0.06/dmax); mc0.width = 0;   // (measured at its full strength, so it eases in and out as the strike does)
    const [lc, lx] = kitCanvas(ww, wh); lx.drawImage(x.canvas, 0, 0); lay(lx, ww, wh, a); lx.globalCompositeOperation = 'destination-in'; lx.drawImage(x.canvas, 0, 0);
    x.save(); x.globalCompositeOperation = 'source-atop'; x.drawImage(lc, 0, 0); x.restore(); lc.width = 0; }
  if(V.weather === 'snow'){ const R = rgRand(s, 821), n = Math.min(3000, Math.round(ww*wh/(px(34)*px(34)))); x.fillStyle = rsCss([250, 252, 255], 0.85); x.beginPath();
    for(let k = 0; k < n; k++){ const X0 = R()*ww, Y0 = R()*wh, r = px(0.8 + 2.6*Math.pow(R(), 3)), sp2 = wh*(0.05 + 0.04*r/px(3.4)), Y = (Y0 + rgClock(V, 0.12)*sp2) % wh, X = ((X0 + Math.sin(ST*0.8 + k)*px(6)*(V.time ? 1 : 0)) % ww + ww) % ww;   // (with the clock: drifting down, swaying, the near flakes faster)
      x.moveTo(X + r, Y); x.arc(X, Y, r, 0, Math.PI*2); } x.fill(); }
}

// the weather (both parts read it the same way, so the arch's clouds and the land's rain agree)
const RG_WEATHER_SEL = ['weather', 'Weather', 'select', 'by the seed', { options: ['by the seed', 'clear', 'clouds', 'rain', 'storm', 'snow', 'fog'] }];
export const RING_STEPS = {
  ringarch: { cat: 'Textures', label: 'The Arch', hidden: true, sealed: true, ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'ring'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Life', 50),
      RG_R('works', 'Works', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99),
      ['saturn', 'Gas Giant', 'select', 'by the seed', { options: ['by the seed', 'never', 'always'] }], RG_WEATHER_SEL], cost: () => 4,
    fresh: true,   // (it paints a canvas of its own, which the next part may take: athanor.js E.take)
    paint(E, n){ const { ww, wh } = E, [c, x] = kitOwn(E, n, 1, ww, wh, 0), [mc, mk] = kitCanvas(ww, wh); mk.fillStyle = '#000'; mk.fillRect(0, 0, ww, wh);
      const V = rgView(E, n, ww, wh); rgPanSky(c, x, V); rgPaintArch(x, mk, V); return [c, mc]; },
    run(E, n){ const [c, m] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m))]; } },
  ringland: { cat: 'Marks', label: 'Land on the Ring', hidden: true, sealed: true, ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'land', 'distance'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Flora', 50), RG_R('fauna', 'Fauna', 40), RG_R('detail', 'Detail', 37),
      RG_R('works', 'Works', 50), RG_R('clutter', 'Clutter', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99), RG_WEATHER_SEL], cost: () => 4,
    fresh: true,
    paint(E, n){ const { ww, wh } = E, [c, x] = kitOwn(E, n, 1, ww, wh, 0), [mc, mk] = kitCanvas(ww, wh), [dc, dk] = kitCanvas(ww, wh);
      mk.fillStyle = '#000'; mk.fillRect(0, 0, ww, wh); dk.fillStyle = '#fff'; dk.fillRect(0, 0, ww, wh);
      const V = rgView(E, n, ww, wh); rgPaintLand(x, mk, dk, V); return [c, mc, dc]; },
    run(E, n){ const [c, m, d] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m)), E.asField(E.readCanvas(d))]; } },
};
